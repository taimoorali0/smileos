import { Router } from 'express';
import { q, one, tx, setClause } from '../db.js';
import { h, bad, notFound, today } from '../http.js';
import { need, audit } from '../auth.js';
import { APT, checkOverlap, completeAppointment } from '../logic/appointments.js';
import { feeFor } from '../logic/fees.js';
import { crud } from './crud.js';
import { findOpenings } from '../logic/openings.js';

const r = Router();
// Only numeric ids match /:id routes; other paths fall through to named routes
r.param('id', (_req, _res, next, id) => (/^\d+$/.test(id) ? next() : next('route')));
const APT_FIELDS = ['patient_id', 'clinic_id', 'op_id', 'prov_id', 'hyg_id', 'is_hygiene', 'apt_datetime', 'minutes', 'confirmed_id', 'unsched_status_id',
  'priority', 'is_new_patient', 'appt_type_id', 'color', 'note', 'time_arrived', 'time_seated', 'time_dismissed'];

const APPT_SELECT = `SELECT a.*, p.first_name, p.last_name, p.preferred, p.wireless_phone, p.medical_alert, TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) age,
  pr.abbr prov_abbr, pr.color prov_color, hy.abbr hyg_abbr, d.name confirmed_name, d.color confirmed_color, t.name type_name, t.color type_color,
  (SELECT GROUP_CONCAT(CONCAT(c.abbr, IF(pl.tooth IS NULL OR pl.tooth='', '', CONCAT('#', pl.tooth))) SEPARATOR ', ') FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id WHERE pl.apt_id=a.id AND pl.status<>6) procs,
  (SELECT COALESCE(SUM(pl.fee),0) FROM procedure_log pl WHERE pl.apt_id=a.id AND pl.status<>6) production
  FROM appointment a JOIN patient p ON p.id=a.patient_id JOIN provider pr ON pr.id=a.prov_id LEFT JOIN provider hy ON hy.id=a.hyg_id
  LEFT JOIN definition d ON d.id=a.confirmed_id LEFT JOIN appt_type t ON t.id=a.appt_type_id`;

// Day (or range) schedule
r.get('/schedule', h(async (req) => {
  const from = req.query.date || today();
  const days = Math.min(Number(req.query.days) || 1, 7);
  const ops = await q(`SELECT o.*, p.abbr prov_abbr, p.color prov_color, hy.abbr hyg_abbr FROM operatory o LEFT JOIN provider p ON p.id=o.provider_id LEFT JOIN provider hy ON hy.id=o.hygienist_id
    WHERE o.is_hidden=0 AND (? IS NULL OR o.clinic_id=? OR o.clinic_id IS NULL) ORDER BY o.item_order, o.id`, [req.query.clinicId || null, req.query.clinicId || null]);
  const appts = await q(`${APPT_SELECT} WHERE a.apt_datetime >= ? AND a.apt_datetime < DATE_ADD(?, INTERVAL ? DAY) AND a.apt_status IN (1,2,5) ORDER BY a.apt_datetime`, [from, from, days]);
  const blockouts = await q(`SELECT b.*, d.name type_name, d.color FROM blockout b LEFT JOIN definition d ON d.id=b.type_id WHERE b.start_dt >= ? AND b.start_dt < DATE_ADD(?, INTERVAL ? DAY)`, [from, from, days]);
  const prod = appts.filter((a) => a.apt_status !== APT.Broken).reduce((s, a) => s + Number(a.production), 0);
  const goal = await one("SELECT value FROM preference WHERE name='DailyGoal'");
  const waiting = appts.filter((a) => a.time_arrived && !a.time_seated && a.apt_status === 1);
  return { ops, appts, blockouts, production: prod, goal: Number(goal?.value || 0) * days, waiting };
}));

r.get('/:id', h(async (req) => {
  const a = await one(`${APPT_SELECT} WHERE a.id=?`, [req.params.id]);
  if (!a) throw notFound();
  a.procedures = await q(`SELECT pl.*, c.code, c.descript, c.abbr FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id WHERE (pl.apt_id=? OR pl.planned_apt_id=?) AND pl.status<>6`, [a.id, a.id]);
  a.available = await q(`SELECT pl.*, c.code, c.descript, c.abbr FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id
    WHERE pl.patient_id=? AND pl.status=1 AND (pl.apt_id IS NULL OR pl.apt_id=?) ORDER BY pl.priority, pl.id`, [a.patient_id, a.id]);
  a.commlog = await q('SELECT * FROM commlog WHERE patient_id=? ORDER BY comm_dt DESC LIMIT 10', [a.patient_id]);
  return a;
}));

// Patient appointment history
r.get('/patient/:pid', h(async (req) => q(`${APPT_SELECT} WHERE a.patient_id=? ORDER BY a.apt_status=6 DESC, a.apt_datetime DESC`, [req.params.pid])));

/** Attach procedures to an appointment (or planned appointment) and recalc length if not locked. */
async function attachProcs(aptId, procIds, planned, c) {
  const col = planned ? 'planned_apt_id' : 'apt_id';
  await q(`UPDATE procedure_log SET ${col}=NULL WHERE ${col}=? AND status=1`, [aptId], c);
  if (procIds?.length) await q(`UPDATE procedure_log SET ${col}=? WHERE id IN (?) AND status IN (1,2)`, [aptId, procIds], c);
}

r.post('/', need('AppointmentCreate'), h(async (req) => tx(async (c) => {
  const b = { ...req.body };
  if (!b.patient_id) throw bad('Patient is required');
  const planned = b.apt_status === APT.Planned;
  if (!planned && !b.apt_datetime) b.apt_status = APT.UnschedList;
  const pat = await one('SELECT pri_prov_id, date_first_visit FROM patient WHERE id=?', [b.patient_id], c);
  const op = b.op_id ? await one('SELECT * FROM operatory WHERE id=?', [b.op_id], c) : null;
  b.prov_id = b.prov_id || op?.provider_id || pat?.pri_prov_id || (await one('SELECT id FROM provider WHERE is_hidden=0 AND is_hygienist=0 LIMIT 1', [], c)).id;
  if (op?.is_hygiene && !b.hyg_id) { b.hyg_id = op.hygienist_id; b.is_hygiene = 1; }
  if (b.is_new_patient === undefined) b.is_new_patient = pat?.date_first_visit ? 0 : 1;
  if (!b.confirmed_id) b.confirmed_id = (await one("SELECT id FROM definition WHERE category='ApptConfirmed' AND is_hidden=0 ORDER BY item_order LIMIT 1", [], c))?.id || null;
  // Appointment type: add its procedures
  if (b.appt_type_id) {
    const t = await one('SELECT * FROM appt_type WHERE id=?', [b.appt_type_id], c);
    if (t && !b.minutes) b.minutes = t.minutes;
    if (t?.code_ids) {
      b.proc_ids = b.proc_ids || [];
      for (const codeId of t.code_ids.split(',').filter(Boolean)) {
        const fee = await feeFor(codeId, b.patient_id, b.prov_id, c);
        const pr = await q('INSERT INTO procedure_log (patient_id, code_id, prov_id, fee, status) VALUES (?,?,?,?,1)', [b.patient_id, codeId, b.prov_id, fee], c);
        b.proc_ids.push(pr.insertId);
      }
    }
  }
  b.minutes = b.minutes || 30;
  if (!planned) await checkOverlap(b, c);
  const s = setClause(b, APT_FIELDS);
  const res = await q(`INSERT INTO appointment SET ${s.sql}, apt_status=?`, [...s.params, b.apt_status || APT.Scheduled], c);
  await attachProcs(res.insertId, b.proc_ids, planned, c);
  await audit(req.user.id, 'AppointmentCreate', b.patient_id, `Appointment #${res.insertId} created ${b.apt_datetime || '(no date)'}`);
  return { id: res.insertId };
})));

r.put('/:id', need('AppointmentEdit'), h(async (req) => tx(async (c) => {
  const cur = await one('SELECT * FROM appointment WHERE id=?', [req.params.id], c);
  if (!cur) throw notFound();
  if (cur.apt_status === APT.Complete && !req.user.permissions.has('AppointmentComplete') && !req.user.permissions.has('SecurityAdmin')) throw bad('Completed appointments need extra permission to edit');
  const merged = { ...cur, ...req.body, id: cur.id };
  const moved = req.body.apt_datetime !== undefined && req.body.apt_datetime !== cur.apt_datetime;
  if (cur.apt_status !== APT.Planned) await checkOverlap(merged, c);
  const body = { ...req.body };
  // Rescheduling resets confirmation to the default
  if (moved && req.body.confirmed_id === undefined) body.confirmed_id = (await one("SELECT id FROM definition WHERE category='ApptConfirmed' AND is_hidden=0 ORDER BY item_order LIMIT 1", [], c))?.id;
  const s = setClause(body, APT_FIELDS);
  if (s.sql) await q(`UPDATE appointment SET ${s.sql} WHERE id=?`, [...s.params, cur.id], c);
  if (moved && [APT.UnschedList, APT.Broken].includes(cur.apt_status) && body.apt_datetime) await q('UPDATE appointment SET apt_status=1 WHERE id=?', [cur.id], c);
  if (req.body.proc_ids) await attachProcs(cur.id, req.body.proc_ids, cur.apt_status === APT.Planned, c);
  await audit(req.user.id, moved ? 'AppointmentMove' : 'AppointmentEdit', cur.patient_id, `Appointment #${cur.id} ${moved ? `moved to ${body.apt_datetime}` : 'edited'}`);
  return { ok: true };
})));

// Status actions
r.post('/:id/action', h(async (req) => tx(async (c) => {
  const { action } = req.body;
  const a = await one('SELECT * FROM appointment WHERE id=?', [req.params.id], c);
  if (!a) throw notFound();
  const has = (p) => req.user.permissions.has(p) || req.user.permissions.has('SecurityAdmin');
  const now = new Date().toTimeString().slice(0, 8);
  switch (action) {
    case 'complete':
      if (!has('AppointmentComplete')) throw bad('No permission to complete appointments');
      await completeAppointment(a.id, req.user.id, c); break;
    case 'break':
      await q('UPDATE appointment SET apt_status=5 WHERE id=?', [a.id], c);
      await q('INSERT INTO commlog (patient_id, comm_type, mode, note, user_id) VALUES (?,?,?,?,?)', [a.patient_id, 'Appointment', 'None', `Broken appointment ${a.apt_datetime}`, req.user.id], c); break;
    case 'unschedule':
      await q('UPDATE appointment SET apt_status=3, op_id=NULL WHERE id=?', [a.id], c); break;
    case 'asap':
      await q('UPDATE appointment SET priority=1-priority WHERE id=?', [a.id], c); break;
    case 'confirm':
      if (!has('ConfirmationStatusEdit')) throw bad('No permission to change confirmation');
      await q('UPDATE appointment SET confirmed_id=? WHERE id=?', [req.body.confirmed_id, a.id], c); break;
    case 'arrived': await q('UPDATE appointment SET time_arrived=? WHERE id=?', [now, a.id], c); break;
    case 'seated': await q('UPDATE appointment SET time_seated=? WHERE id=?', [now, a.id], c); break;
    case 'dismissed': await q('UPDATE appointment SET time_dismissed=? WHERE id=?', [now, a.id], c); break;
    default: throw bad('Unknown action');
  }
  await audit(req.user.id, 'AppointmentEdit', a.patient_id, `Appointment #${a.id}: ${action}`);
  return { ok: true };
})));

// Schedule a planned appointment: copy to a real appointment
r.post('/:id/schedule-planned', need('AppointmentCreate'), h(async (req) => tx(async (c) => {
  const pa = await one('SELECT * FROM appointment WHERE id=? AND apt_status=6', [req.params.id], c);
  if (!pa) throw notFound('Planned appointment not found');
  const b = { ...pa, id: 0, op_id: req.body.op_id, apt_datetime: req.body.apt_datetime };
  await checkOverlap(b, c);
  const res = await q(`INSERT INTO appointment (patient_id, op_id, prov_id, hyg_id, is_hygiene, apt_datetime, minutes, apt_status, note, appt_type_id, confirmed_id)
    VALUES (?,?,?,?,?,?,?,1,?,?,(SELECT id FROM definition WHERE category='ApptConfirmed' AND is_hidden=0 ORDER BY item_order LIMIT 1))`,
  [pa.patient_id, b.op_id, pa.prov_id, pa.hyg_id, pa.is_hygiene, b.apt_datetime, pa.minutes, pa.note, pa.appt_type_id], c);
  await q('UPDATE procedure_log SET apt_id=? WHERE planned_apt_id=? AND status=1', [res.insertId, pa.id], c);
  await q('UPDATE appointment SET next_apt_id=? WHERE id=?', [res.insertId, pa.id], c);
  await q('UPDATE lab_case SET apt_id=? WHERE apt_id=?', [res.insertId, pa.id], c);
  return { id: res.insertId };
})));

r.delete('/:id', need('AppointmentDelete'), h(async (req) => tx(async (c) => {
  const a = await one('SELECT * FROM appointment WHERE id=?', [req.params.id], c);
  if (!a) throw notFound();
  if (a.apt_status === APT.Complete) throw bad('Completed appointments cannot be deleted');
  await q('UPDATE procedure_log SET apt_id=NULL WHERE apt_id=?', [a.id], c);
  await q('UPDATE procedure_log SET planned_apt_id=NULL WHERE planned_apt_id=?', [a.id], c);
  await q('UPDATE appointment SET next_apt_id=NULL WHERE next_apt_id=?', [a.id], c);
  await q('DELETE FROM appointment WHERE id=?', [a.id], c);
  await audit(req.user.id, 'AppointmentDelete', a.patient_id, `Appointment #${a.id} deleted (${a.apt_datetime})`);
  return { ok: true };
})));

// Find openings: first free slot per day for chosen providers
r.get('/openings', h(async (req) => findOpenings({
  after: req.query.after || today(), minutes: Number(req.query.minutes) || 30,
  provIds: String(req.query.provIds || '').split(',').filter(Boolean).map(Number), notBeforeNow: false,
})));

// ===== Worklists =====
r.get('/lists/confirmation', h(async (req) => {
  const from = req.query.from || today(); const to = req.query.to || from;
  return q(`${APPT_SELECT} WHERE DATE(a.apt_datetime) BETWEEN ? AND ? AND a.apt_status=1 ORDER BY a.apt_datetime`, [from, to]);
}));
r.get('/lists/unscheduled', h(async (req) => q(`${APPT_SELECT} WHERE (a.apt_status=3 OR (? = '1' AND a.apt_status=5)) AND p.status='Patient' ORDER BY a.created_at DESC`, [req.query.broken ? '1' : '0'])));
r.get('/lists/asap', h(async () => q(`${APPT_SELECT} WHERE a.priority=1 AND a.apt_status IN (1,3,5,6) ORDER BY a.apt_datetime`)));
r.get('/lists/planned', h(async () => q(`${APPT_SELECT} WHERE a.apt_status=6 AND (a.next_apt_id IS NULL OR NOT EXISTS (SELECT 1 FROM appointment x WHERE x.id=a.next_apt_id))
  AND p.status='Patient' ORDER BY a.created_at`)));
r.get('/lists/recall', h(async (req) => {
  const from = req.query.from || '2000-01-01'; const to = req.query.to || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return q(`SELECT r.*, p.first_name, p.last_name, p.wireless_phone, p.email, TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) age, d.name status_name,
      (SELECT MIN(apt_datetime) FROM appointment a WHERE a.patient_id=r.patient_id AND a.apt_status=1 AND a.apt_datetime>=NOW()) sched_date
    FROM recall r JOIN patient p ON p.id=r.patient_id LEFT JOIN definition d ON d.id=r.status_id
    WHERE r.is_disabled=0 AND p.status='Patient' AND r.date_due BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM appointment a WHERE a.patient_id=r.patient_id AND a.apt_status=1 AND a.apt_datetime>=NOW())
    ORDER BY r.date_due`, [from, to]);
}));
r.put('/lists/recall/:rid', need('AppointmentEdit'), h(async (req) => {
  await q('UPDATE recall SET status_id=?, note=? WHERE id=?', [req.body.status_id || null, req.body.note || null, req.params.rid]);
  return { ok: true };
}));
r.get('/lists/insverify', h(async (req) => {
  const days = Number(req.query.days) || 7;
  return q(`SELECT a.id apt_id, a.apt_datetime, p.id patient_id, p.first_name, p.last_name, c.name carrier, ip.id plan_id, pp.id pat_plan_id,
      ip.date_benefits_verified, pp.date_eligibility_verified
    FROM appointment a JOIN patient p ON p.id=a.patient_id JOIN pat_plan pp ON pp.patient_id=p.id AND pp.ordinal=1
    JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier c ON c.id=ip.carrier_id
    WHERE a.apt_status=1 AND a.apt_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
      AND (ip.date_benefits_verified IS NULL OR ip.date_benefits_verified < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        OR pp.date_eligibility_verified IS NULL OR pp.date_eligibility_verified < DATE_SUB(CURDATE(), INTERVAL 30 DAY))
    ORDER BY a.apt_datetime`, [days]);
}));

// Blockouts and lab cases
const blk = Router();
blk.post('/', need('Blockouts'), h(async (req) => {
  const b = req.body;
  if (!b.op_ids?.length && !b.op_id) throw bad('Choose an operatory');
  for (const op of b.op_ids || [b.op_id]) {
    const clash = await one('SELECT id FROM blockout WHERE op_id=? AND start_dt < ? AND stop_dt > ?', [op, b.stop_dt, b.start_dt]);
    if (clash) throw bad('Blockouts cannot overlap');
    await q('INSERT INTO blockout (op_id, type_id, start_dt, stop_dt, note, no_schedule) VALUES (?,?,?,?,?,?)', [op, b.type_id || null, b.start_dt, b.stop_dt, b.note || null, b.no_schedule ? 1 : 0]);
  }
  return { ok: true };
}));
blk.delete('/:id', need('Blockouts'), h(async (req) => { await q('DELETE FROM blockout WHERE id=?', [req.params.id]); return { ok: true }; }));
blk.post('/clear-day', need('Blockouts'), h(async (req) => { await q('DELETE FROM blockout WHERE DATE(start_dt)=?', [req.body.date]); return { ok: true }; }));
blk.post('/copy-day', need('Blockouts'), h(async (req) => {
  const { from, to } = req.body;
  await q(`INSERT INTO blockout (op_id, type_id, start_dt, stop_dt, note, no_schedule)
    SELECT op_id, type_id, TIMESTAMP(?, TIME(start_dt)), TIMESTAMP(?, TIME(stop_dt)), note, no_schedule FROM blockout WHERE DATE(start_dt)=?`, [to, to, from]);
  return { ok: true };
}));
r.use('/blockouts', blk);
r.use('/labcases', crud('lab_case', ['patient_id', 'apt_id', 'prov_id', 'lab_name', 'instructions', 'fee', 'date_sent', 'date_received', 'date_due', 'date_checked'],
  { order: 'date_due IS NULL, date_due', perm: 'AppointmentEdit' }));
export default r;
