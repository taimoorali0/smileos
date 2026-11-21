// Public endpoints (no staff login): patient portal, online booking, inbound SMS.
import { Router } from 'express';
import crypto from 'node:crypto';
import { q, one, tx } from '../db.js';
import { h, bad, HttpError, today } from '../http.js';
import { getSetting, renderTemplate } from '../logic/settings.js';
import { sendSms, sendEmail } from '../logic/messaging.js';
import { findOpenings } from '../logic/openings.js';
import { checkOverlap } from '../logic/appointments.js';
import { balances } from '../logic/ledger.js';
import { estimate } from '../logic/insurance.js';
import { applySheetToPatient } from './integrations.js';

const r = Router();

// Very small rate limiter per IP (protects login/booking from brute force)
const hits = new Map();
const limit = (max, windowMs) => (req, _res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (arr.length > max) return next(new HttpError(429, 'Too many attempts, please wait a few minutes'));
  next();
};
const digits = (s) => String(s || '').replace(/\D/g, '');

r.get('/practice', h(async () => {
  const portal = await getSetting('portal');
  const name = (await one("SELECT value FROM preference WHERE name='PracticeTitle'"))?.value || 'Our dental office';
  return { name, portalEnabled: !!portal.enabled, bookingEnabled: !!portal.booking_enabled, bookingMinutes: portal.booking_minutes };
}));

// ===== Online booking (Web Sched) =====
r.get('/openings', limit(60, 60000), h(async (req) => {
  const portal = await getSetting('portal');
  if (!portal.booking_enabled) throw bad('Online booking is turned off');
  const after = req.query.after && req.query.after > today() ? req.query.after : today();
  return findOpenings({ after, minutes: Number(portal.booking_minutes) || 60, opIds: (portal.booking_op_ids || []).map(Number), maxDays: Number(portal.booking_days) || 30, maxResults: 40, perDay: 8, step: 30 });
}));

r.post('/book', limit(10, 600000), h(async (req) => {
  const portal = await getSetting('portal');
  if (!portal.booking_enabled) throw bad('Online booking is turned off');
  const b = req.body;
  if (!b.first_name || !b.last_name || !b.birthdate || digits(b.phone).length < 10) throw bad('Please enter your name, birthdate and a mobile number');
  if (!b.date || !b.time || !b.op_id) throw bad('Please choose a time');
  const minutes = Number(portal.booking_minutes) || 60;
  const slot = (await findOpenings({ after: b.date, minutes, opIds: [Number(b.op_id)], maxDays: 1, maxResults: 100, perDay: 100, step: 10 }))
    .find((o) => o.date === b.date && o.time === b.time && o.op_id === Number(b.op_id));
  if (!slot) throw bad('Sorry, that time was just taken. Please choose another.');
  const result = await tx(async (c) => {
    let p = await one(`SELECT * FROM patient WHERE LOWER(last_name)=LOWER(?) AND birthdate=? AND (REPLACE(REPLACE(REPLACE(REPLACE(wireless_phone,'-',''),' ',''),'(',''),')','') LIKE ? OR LOWER(first_name)=LOWER(?))`,
      [b.last_name.trim(), b.birthdate, `%${digits(b.phone).slice(-10)}`, b.first_name.trim()], c);
    const isNew = !p;
    if (!p) {
      const id = (await q(`INSERT INTO patient (last_name, first_name, birthdate, wireless_phone, email, status, referral_source) VALUES (?,?,?,?,?, 'Patient', 'Online booking')`,
        [b.last_name.trim().slice(0, 60), b.first_name.trim().slice(0, 60), b.birthdate, b.phone, b.email || null], c)).insertId;
      p = await one('SELECT * FROM patient WHERE id=?', [id], c);
    }
    const dt = `${slot.date} ${slot.time}:00`;
    await checkOverlap({ id: 0, op_id: slot.op_id, apt_datetime: dt, minutes }, c);
    const op = await one('SELECT * FROM operatory WHERE id=?', [slot.op_id], c);
    const conf = await one("SELECT id FROM definition WHERE category='ApptConfirmed' AND is_hidden=0 ORDER BY item_order LIMIT 1", [], c);
    const apt = (await q(`INSERT INTO appointment (patient_id, op_id, prov_id, hyg_id, is_hygiene, apt_datetime, minutes, apt_status, confirmed_id, is_new_patient, note) VALUES (?,?,?,?,?,?,?,1,?,?,?)`,
      [p.id, op.id, op.provider_id || p.pri_prov_id, op.is_hygiene ? op.hygienist_id : null, op.is_hygiene ? 1 : 0, dt, minutes, conf?.id || null, isNew ? 1 : 0,
        `${portal.booking_note || 'Online booking'}${b.reason ? `: ${String(b.reason).slice(0, 300)}` : ''}`], c)).insertId;
    await q('INSERT INTO web_request (kind, patient_id, apt_id, data) VALUES (?,?,?,?)', [isNew ? 'new_patient' : 'booking', p.id, apt, JSON.stringify({ ...b, slot })], c);
    await q('INSERT INTO commlog (patient_id, comm_type, mode, note) VALUES (?,?,?,?)', [p.id, 'Appointment', 'None', `Booked online for ${dt}`], c);
    return { p, apt, dt };
  });
  const body = await renderTemplate('Hi [FName], your appointment at [Practice] is booked for [Date] at [Time]. Reply C to confirm.', { patient: result.p, apt: { apt_datetime: result.dt } });
  await sendSms({ to: result.p.wireless_phone, body, patient_id: result.p.id, kind: 'confirmation', apt_id: result.apt });
  return { ok: true, date: slot.date, time: slot.time };
}));

// ===== Patient portal =====
async function portalPatient(req) {
  const t = String(req.headers['x-portal-token'] || '');
  if (!t) throw new HttpError(401, 'Please sign in');
  const row = await one('SELECT * FROM portal_token WHERE token=? AND expires_at > NOW()', [t]);
  if (!row) throw new HttpError(401, 'Your link has expired. Please sign in again.');
  return row.patient_id;
}
r.post('/portal/login', limit(8, 600000), h(async (req) => {
  const portal = await getSetting('portal');
  if (!portal.enabled) throw bad('The patient portal is turned off');
  let pid = null;
  if (req.body.token) {
    pid = (await one('SELECT patient_id FROM portal_token WHERE token=? AND expires_at > NOW()', [req.body.token]))?.patient_id;
  } else {
    const { last_name, birthdate, phone } = req.body;
    if (!last_name || !birthdate || digits(phone).length < 10) throw bad('Enter your last name, birthdate and mobile number');
    pid = (await one(`SELECT id FROM patient WHERE LOWER(last_name)=LOWER(?) AND birthdate=? AND REPLACE(REPLACE(REPLACE(REPLACE(wireless_phone,'-',''),' ',''),'(',''),')','') LIKE ?`,
      [last_name.trim(), birthdate, `%${digits(phone).slice(-10)}`]))?.id;
  }
  if (!pid) throw new HttpError(401, 'We could not find you. Check your details or call the office.');
  const token = crypto.randomBytes(24).toString('hex');
  await q('INSERT INTO portal_token (token, patient_id, expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 2 HOUR))', [token, pid]);
  return { token };
}));
r.get('/portal/me', h(async (req) => {
  const pid = await portalPatient(req);
  const p = await one('SELECT id, first_name, last_name, preferred, birthdate, email, wireless_phone, address, city, state, zip FROM patient WHERE id=?', [pid]);
  const appts = await q(`SELECT a.id, a.apt_datetime, a.minutes, a.apt_status, d.name confirmed, pr.first_name prov_first, pr.last_name prov_last,
      (SELECT GROUP_CONCAT(c.descript SEPARATOR ', ') FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id WHERE pl.apt_id=a.id) procs
    FROM appointment a JOIN provider pr ON pr.id=a.prov_id LEFT JOIN definition d ON d.id=a.confirmed_id
    WHERE a.patient_id=? AND a.apt_status=1 AND a.apt_datetime >= CURDATE() ORDER BY a.apt_datetime`, [pid]);
  const tp = await q(`SELECT pl.id, pl.fee, pl.tooth, pl.code_id, c.descript, c.category FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id WHERE pl.patient_id=? AND pl.status=1 ORDER BY pl.priority, pl.id`, [pid]);
  const { est } = await estimate(pid, tp);
  const forms = await q('SELECT id, name, kind, width, height, fields FROM sheet_def WHERE show_in_portal=1 ORDER BY name');
  const done = await q('SELECT sheet_def_id, MAX(created_at) last FROM sheet WHERE patient_id=? GROUP BY sheet_def_id', [pid]);
  const bal = await balances(pid);
  return { patient: p, appointments: appts, treatment: tp.map((x) => ({ ...x, patPortion: est[x.id]?.patPortion ?? x.fee })), balance: bal.family.patPortion,
    forms: forms.map((f) => ({ ...f, lastFilled: done.find((d) => d.sheet_def_id === f.id)?.last || null })) };
}));
r.post('/portal/confirm/:aptId', h(async (req) => {
  const pid = await portalPatient(req);
  const conf = await one("SELECT id FROM definition WHERE category='ApptConfirmed' AND name LIKE 'Confirmed%' LIMIT 1");
  const res = await q('UPDATE appointment SET confirmed_id=? WHERE id=? AND patient_id=? AND apt_status=1', [conf?.id, req.params.aptId, pid]);
  if (!res.affectedRows) throw bad('Appointment not found');
  await q('INSERT INTO commlog (patient_id, comm_type, mode, note) VALUES (?,?,?,?)', [pid, 'Appointment', 'None', 'Patient confirmed appointment in portal']);
  return { ok: true };
}));
r.post('/portal/message', limit(10, 600000), h(async (req) => {
  const pid = await portalPatient(req);
  const text = String(req.body.message || '').trim().slice(0, 2000);
  if (!text) throw bad('Message is empty');
  await q('INSERT INTO web_request (kind, patient_id, data) VALUES (?,?,?)', ['message', pid, JSON.stringify({ message: text })]);
  return { ok: true };
}));
r.post('/portal/forms/:defId', limit(20, 600000), h(async (req) => {
  const pid = await portalPatient(req);
  const def = await one('SELECT id FROM sheet_def WHERE id=? AND show_in_portal=1', [req.params.defId]);
  if (!def) throw bad('Form not available');
  await q('INSERT INTO sheet (sheet_def_id, patient_id, values_json, source) VALUES (?,?,?,?)', [def.id, pid, JSON.stringify(req.body.values || {}), 'portal']);
  await applySheetToPatient(pid, def.id, req.body.values || {});
  return { ok: true };
}));

// ===== Inbound SMS (Twilio webhook: set to https://<your-server>/api/public/sms/twilio) =====
r.post('/sms/twilio', h(async (req, res) => {
  const from = digits(req.body.From).slice(-10);
  const body = String(req.body.Body || '').trim();
  const p = from ? await one(`SELECT * FROM patient WHERE REPLACE(REPLACE(REPLACE(REPLACE(wireless_phone,'-',''),' ',''),'(',''),')','') LIKE ? ORDER BY id LIMIT 1`, [`%${from}`]) : null;
  await q("INSERT INTO message_log (patient_id, channel, direction, to_addr, body, status, kind) VALUES (?, 'sms', 'in', ?, ?, 'received', 'reply')", [p?.id || null, req.body.From || '', body.slice(0, 2000)]);
  let reply = '';
  if (p && /^(c|yes|y|confirm)\b/i.test(body)) {
    const apt = await one('SELECT id FROM appointment WHERE patient_id=? AND apt_status=1 AND apt_datetime>=NOW() ORDER BY apt_datetime LIMIT 1', [p.id]);
    const conf = await one("SELECT id FROM definition WHERE category='ApptConfirmed' AND name LIKE 'Confirmed%' LIMIT 1");
    if (apt && conf) {
      await q('UPDATE appointment SET confirmed_id=? WHERE id=?', [conf.id, apt.id]);
      await q('INSERT INTO commlog (patient_id, comm_type, mode, note) VALUES (?,?,?,?)', [p.id, 'Appointment', 'Text', 'Patient confirmed by text']);
      reply = 'Thank you, your appointment is confirmed.';
    }
  } else if (p) {
    await q('INSERT INTO web_request (kind, patient_id, data) VALUES (?,?,?)', ['message', p.id, JSON.stringify({ message: body, via: 'sms' })]);
  }
  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response>${reply ? `<Message>${reply}</Message>` : ''}</Response>`);
}));
export default r;
