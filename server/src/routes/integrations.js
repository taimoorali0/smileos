import { Router } from 'express';
import crypto from 'node:crypto';
import SftpClient from 'ssh2-sftp-client';
import { q, one, tx } from '../db.js';
import { h, bad, notFound, today, round2 } from '../http.js';
import { need, audit } from '../auth.js';
import { getSetting, getSettingMasked, saveSetting, renderTemplate, DEFAULTS, publicBase } from '../logic/settings.js';
import { sendSms, sendEmail } from '../logic/messaging.js';
import { build837, build270, parse835, sample835 } from '../logic/x12.js';
import { sha256 } from '../security.js';
import QRCode from 'qrcode';
import { context } from '../db.js';

const r = Router();

// ===== Settings =====
r.get('/settings', need('Setup'), h(async () => Object.fromEntries(await Promise.all(Object.keys(DEFAULTS).map(async (k) => [k, await getSettingMasked(k)])))));
r.put('/settings/:name', need('Setup'), h(async (req) => {
  await saveSetting(req.params.name, req.body);
  await audit(req.user.id, 'Setup', null, `Integration settings changed: ${req.params.name}`);
  return getSettingMasked(req.params.name);
}));
r.post('/settings/test/:name', need('Setup'), h(async (req) => {
  if (req.params.name === 'email') return sendEmail({ to: req.body.to, subject: 'SmileOS test email', body: 'If you can read this, email sending works.', kind: 'test' });
  if (req.params.name === 'sms') return sendSms({ to: req.body.to, body: 'SmileOS test message: texting works.', kind: 'test' });
  if (req.params.name === 'clearinghouse') {
    const cfg = await getSetting('clearinghouse');
    return { ok: true, result: await deliver(cfg, `TEST_${Date.now()}.txt`, 'SmileOS connection test') };
  }
  throw bad('Nothing to test for this integration');
}));

// ===== Messages =====
r.get('/messages', h(async (req) => q(`SELECT m.*, CONCAT(p.first_name,' ',p.last_name) patient FROM message_log m LEFT JOIN patient p ON p.id=m.patient_id
  WHERE (? IS NULL OR m.patient_id=?) ORDER BY m.id DESC LIMIT 300`, [req.query.patientId || null, req.query.patientId || null])));
r.post('/messages/send', h(async (req) => {
  const { patient_id, channel, subject, body, apt_id } = req.body;
  const p = await one('SELECT * FROM patient WHERE id=?', [patient_id]);
  if (!p) throw notFound('Patient not found');
  if (!body) throw bad('Message is empty');
  const apt = apt_id ? await one('SELECT * FROM appointment WHERE id=?', [apt_id]) : null;
  const text = await renderTemplate(body, { patient: p, apt });
  let res;
  if (channel === 'email') res = await sendEmail({ to: p.email, subject: await renderTemplate(subject || 'Message from [Practice]', { patient: p }), body: text, patient_id: p.id, apt_id });
  else {
    if (!p.text_ok) throw bad('Patient has not agreed to receive texts');
    res = await sendSms({ to: p.wireless_phone, body: text, patient_id: p.id, apt_id });
  }
  await q('INSERT INTO commlog (patient_id, comm_type, mode, note, user_id) VALUES (?,?,?,?,?)', [p.id, apt_id ? 'Appointment' : 'Misc', channel === 'email' ? 'Email' : 'Text', `${channel === 'email' ? 'Email' : 'Text'} (${res.status}): ${text}`, req.user.id]);
  if (res.status === 'failed') throw bad(`Not sent: ${res.error}`);
  return res;
}));

// ===== Clearinghouse =====
async function nextControl() {
  const r0 = await one("SELECT value FROM preference WHERE name='X12Control'");
  const n = Number(r0?.value || 0) + 1;
  await q("INSERT INTO preference (name, value) VALUES ('X12Control', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [String(n)]);
  return n;
}
/** Send a file using the configured transport. Returns a short description. */
async function deliver(cfg, fileName, content) {
  if (cfg.mode === 'http') {
    if (!cfg.http_url) throw bad('Clearinghouse URL is not set');
    const res = await fetch(cfg.http_url, { method: 'POST', headers: { 'content-type': 'text/plain', ...(cfg.http_user ? { authorization: 'Basic ' + Buffer.from(`${cfg.http_user}:${cfg.http_password}`).toString('base64') } : {}), 'x-file-name': fileName }, body: content });
    if (!res.ok) throw bad(`Clearinghouse returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return `Uploaded to ${new URL(cfg.http_url).host}`;
  }
  if (cfg.mode === 'sftp') {
    const s = new SftpClient();
    try {
      await s.connect({ host: cfg.sftp_host, port: Number(cfg.sftp_port || 22), username: cfg.sftp_user, password: cfg.sftp_password, readyTimeout: 15000 });
      await s.put(Buffer.from(content), `${cfg.sftp_dir.replace(/\/$/, '')}/${fileName}`);
      return `Uploaded by SFTP to ${cfg.sftp_host}`;
    } finally { s.end().catch(() => {}); }
  }
  if (cfg.mode === 'download') return 'Saved – download the file and upload it on your clearinghouse website';
  return 'Test mode – file created but not sent';
}

r.get('/claim-files', need('ClaimEdit'), h(async () => q('SELECT id, kind, file_name, claim_ids, status, note, created_at FROM claim_file ORDER BY id DESC LIMIT 200')));
r.get('/claim-files/:id/download', need('ClaimEdit'), h(async (req, res) => {
  const f = await one('SELECT * FROM claim_file WHERE id=?', [req.params.id]);
  if (!f) throw notFound();
  res.setHeader('content-disposition', `attachment; filename="${f.file_name}"`);
  res.type('text/plain').send(f.content);
}));
// Validate claims before sending
r.post('/claims/validate', need('ClaimEdit'), h(async (req) => {
  const cfg = await getSetting('clearinghouse');
  const { errors } = await build837(req.body.ids || [], cfg, 0);
  return { errors };
}));
// Create an 837 batch, deliver it, and mark claims sent
r.post('/claims/send-electronic', need('ClaimEdit'), h(async (req) => {
  const ids = (req.body.ids || []).map(Number).filter(Boolean);
  if (!ids.length) throw bad('Choose at least one claim');
  const cfg = await getSetting('clearinghouse');
  const control = await nextControl();
  const { content, errors } = await build837(ids, cfg, control);
  if (errors.length && !req.body.force) return { ok: false, errors };
  const fileName = `837D_${control}_${today().replace(/-/g, '')}.x12`;
  let note; let status = cfg.mode === 'test' ? 'test' : 'uploaded';
  try { note = await deliver(cfg, fileName, content); } catch (e) { note = e.message; status = 'failed'; }
  const f = await q('INSERT INTO claim_file (kind, file_name, content, claim_ids, status, note) VALUES (?,?,?,?,?,?)', ['837', fileName, content, ids.join(','), status, note]);
  if (status !== 'failed') await q("UPDATE claim SET status='S', date_sent=CURDATE() WHERE id IN (?) AND status IN ('U','W')", [ids]);
  await audit(req.user.id, 'ClaimEdit', null, `837 batch ${fileName} (${ids.length} claims): ${note}`);
  return { ok: status !== 'failed', fileId: f.insertId, fileName, note, errors };
}));
// Import an 835 ERA and post payments
r.post('/era/import', need('InsPayCreate'), h(async (req) => {
  const text = String(req.body.content || '');
  const era = parse835(text);
  const results = [];
  await tx(async (c) => {
    for (const ec of era.claims) {
      const cl = await one('SELECT * FROM claim WHERE id=?', [Number(ec.claimId)], c);
      if (!cl) { results.push({ claimId: ec.claimId, ok: false, note: 'Claim not found in SmileOS' }); continue; }
      if (cl.status === 'R') { results.push({ claimId: cl.id, ok: false, note: 'Already received' }); continue; }
      const cps = await q('SELECT cp.*, pc.code FROM claim_proc cp JOIN procedure_log pl ON pl.id=cp.proc_id JOIN procedure_code pc ON pc.id=pl.code_id WHERE cp.claim_id=?', [cl.id], c);
      let paid = 0; let wo = 0;
      for (const s of ec.services) {
        const cp = cps.find((x) => (s.procId && x.proc_id === s.procId)) || cps.find((x) => x.code === s.code && x.status !== 'Received');
        if (!cp) continue;
        await q("UPDATE claim_proc SET ins_paid=?, write_off=?, status='Received' WHERE id=?", [s.paid, round2(s.writeOff), cp.id], c);
        cp.status = 'Received'; paid += s.paid; wo += s.writeOff;
      }
      if (!ec.services.length) paid = ec.paid;
      await q("UPDATE claim SET status='R', date_received=CURDATE(), ins_paid=?, write_off=?, note=? WHERE id=?", [round2(paid), round2(wo), `ERA ${era.checkNumber}`, cl.id], c);
      results.push({ claimId: cl.id, ok: true, paid: round2(paid), writeOff: round2(wo) });
    }
    await q('INSERT INTO claim_file (kind, file_name, content, claim_ids, status, note) VALUES (?,?,?,?,?,?)',
      ['835', req.body.file_name || `835_${era.checkNumber || Date.now()}.x12`, text, results.filter((x) => x.ok).map((x) => x.claimId).join(','), 'imported', `${era.payer} · check ${era.checkNumber} · ${era.totalPaid}`], c);
  });
  await audit(req.user.id, 'InsPayCreate', null, `ERA imported: ${era.payer} ${era.checkNumber}, ${results.filter((x) => x.ok).length} claim(s) posted`);
  return { era: { payer: era.payer, checkNumber: era.checkNumber, totalPaid: era.totalPaid }, results };
}));
// Test mode helper: produce a sample 835 for a sent claim
r.get('/era/sample/:claimId', need('InsPayCreate'), h(async (req) => {
  const cfg = await getSetting('clearinghouse');
  return { content: await sample835(Number(req.params.claimId), cfg, await nextControl()) };
}));
// Eligibility 270
r.post('/eligibility/:patPlanId', need('InsPlanEdit'), h(async (req) => {
  const cfg = await getSetting('clearinghouse');
  const control = await nextControl();
  const content = await build270(Number(req.params.patPlanId), cfg, control);
  const fileName = `270_${control}.x12`;
  let note; let status = cfg.mode === 'test' ? 'test' : 'uploaded';
  try { note = await deliver(cfg, fileName, content); } catch (e) { note = e.message; status = 'failed'; }
  const f = await q('INSERT INTO claim_file (kind, file_name, content, status, note) VALUES (?,?,?,?,?)', ['270', fileName, content, status, note]);
  return { fileId: f.insertId, note, status };
}));

// ===== eRx (DoseSpot single sign-on) =====
function dsHash(s) { return crypto.createHash('sha512').update(s, 'utf8').digest('base64').replace(/==$/, ''); }
r.get('/erx/launch/:patientId', need('RxCreate'), h(async (req) => {
  const cfg = await getSetting('erx');
  if (cfg.mode !== 'dosespot') throw bad('eRx is not turned on. Add your DoseSpot clinic ID and key in Setup → Integrations.');
  const userId = cfg.user_ids?.[req.user.providerId] || cfg.user_ids?.[req.user.id];
  if (!userId) throw bad('Your user is not linked to a DoseSpot prescriber ID (Setup → Integrations → eRx).');
  const phrase = crypto.randomBytes(24).toString('base64').replace(/[^A-Za-z0-9]/g, '').padEnd(32, 'x').slice(0, 32);
  const code = phrase + dsHash(phrase + cfg.clinic_key);
  const verify = dsHash(phrase.slice(0, 22) + userId + cfg.clinic_key);
  const u = new URL('/LoginSingleSignOn.aspx', cfg.base_url);
  u.search = new URLSearchParams({ SingleSignOnClinicId: cfg.clinic_id, SingleSignOnUserId: userId, SingleSignOnPhraseLength: '32', SingleSignOnCode: code, SingleSignOnUserIdVerify: verify, PatientId: String(req.params.patientId) }).toString();
  await audit(req.user.id, 'RxCreate', req.params.patientId, 'eRx opened');
  return { url: u.toString() };
}));

// ===== Program links (bridges) =====
r.get('/program-links', h(async () => q('SELECT * FROM program_link ORDER BY enabled DESC, category, name')));
r.put('/program-links/:id', need('Setup'), h(async (req) => {
  const b = req.body;
  await q('UPDATE program_link SET enabled=?, launch_type=?, path=?, args=?, note=?, show_on_toolbar=? WHERE id=?', [b.enabled ? 1 : 0, b.launch_type, b.path || null, b.args || null, b.note || null, b.show_on_toolbar ? 1 : 0, req.params.id]);
  return { ok: true };
}));
r.post('/program-links', need('Setup'), h(async (req) => {
  const b = req.body;
  if (!b.name) throw bad('Name is required');
  return { id: (await q('INSERT INTO program_link (name, category, enabled, launch_type, path, args, note) VALUES (?,?,?,?,?,?,?)', [b.name, b.category || 'Other', 1, b.launch_type || 'command', b.path || null, b.args || null, b.note || null])).insertId };
}));
r.get('/program-links/:id/launch/:patientId', h(async (req) => {
  const l = await one('SELECT * FROM program_link WHERE id=? AND enabled=1', [req.params.id]);
  if (!l) throw notFound('Program link not enabled');
  const p = await one('SELECT * FROM patient WHERE id=?', [req.params.patientId]);
  if (!p) throw notFound('Patient not found');
  const tags = { PatNum: p.id, ChartNumber: p.id, FName: p.first_name, LName: p.last_name, Birthdate: p.birthdate || '', BirthdateMDY: p.birthdate ? `${p.birthdate.slice(5, 7)}/${p.birthdate.slice(8, 10)}/${p.birthdate.slice(0, 4)}` : '', Gender: p.gender, Email: p.email || '', Phone: p.wireless_phone || '' };
  const fill = (s) => String(s || '').replace(/\[(\w+)\]/g, (m, k) => (k in tags ? String(tags[k]).replace(/["&|<>^]/g, '') : m));
  await audit(req.user.id, 'ImagingModule', p.id, `Program link launched: ${l.name}`);
  return { type: l.launch_type, path: l.launch_type === 'url' ? fill(l.path) : l.path, args: fill(l.args), name: l.name };
}));

// ===== Forms (sheets) =====
r.get('/sheet-defs', h(async () => q('SELECT * FROM sheet_def ORDER BY kind, name')));
r.post('/sheet-defs', need('Setup'), h(async (req) => {
  const b = req.body;
  return { id: (await q('INSERT INTO sheet_def (name, kind, width, height, fields, show_in_portal) VALUES (?,?,?,?,?,?)', [b.name || 'New form', b.kind || 'PatientForm', b.width || 850, b.height || 1100, JSON.stringify(b.fields || []), b.show_in_portal ? 1 : 0])).insertId };
}));
r.put('/sheet-defs/:id', need('Setup'), h(async (req) => {
  const b = req.body;
  await q('UPDATE sheet_def SET name=?, kind=?, width=?, height=?, fields=?, show_in_portal=? WHERE id=?', [b.name, b.kind, b.width, b.height, JSON.stringify(b.fields || []), b.show_in_portal ? 1 : 0, req.params.id]);
  return { ok: true };
}));
r.delete('/sheet-defs/:id', need('Setup'), h(async (req) => {
  const used = await one('SELECT COUNT(*) n FROM sheet WHERE sheet_def_id=?', [req.params.id]);
  if (used.n) throw bad('This form has been filled in for patients and cannot be deleted');
  await q('DELETE FROM sheet_def WHERE id=?', [req.params.id]);
  return { ok: true };
}));
r.get('/sheets/patient/:pid', h(async (req) => q(`SELECT s.id, s.sheet_def_id, s.source, s.created_at, d.name, d.kind FROM sheet s JOIN sheet_def d ON d.id=s.sheet_def_id WHERE s.patient_id=? ORDER BY s.id DESC`, [req.params.pid])));
r.get('/sheets/:id', h(async (req) => {
  const s = await one('SELECT s.*, d.name, d.width, d.height, d.fields FROM sheet s JOIN sheet_def d ON d.id=s.sheet_def_id WHERE s.id=?', [req.params.id]);
  if (!s) throw notFound();
  return s;
}));
r.post('/sheets', h(async (req) => {
  const { sheet_def_id, patient_id, values } = req.body;
  const res = await q('INSERT INTO sheet (sheet_def_id, patient_id, values_json, source) VALUES (?,?,?,?)', [sheet_def_id, patient_id, JSON.stringify(values || {}), req.body.source === 'kiosk' ? 'kiosk' : 'office']);
  await applySheetToPatient(patient_id, sheet_def_id, values || {});
  await audit(req.user.id, 'PatientEdit', patient_id, 'Form filled in');
  return { id: res.insertId };
}));

/** Fields bound to patient columns (field.bind) update the patient record; allergy/medication lists are added to Medical. */
export async function applySheetToPatient(patientId, defId, values) {
  const def = await one('SELECT fields FROM sheet_def WHERE id=?', [defId]);
  const fields = typeof def.fields === 'string' ? JSON.parse(def.fields) : def.fields;
  const allowed = ['first_name', 'last_name', 'preferred', 'birthdate', 'wireless_phone', 'home_phone', 'email', 'address', 'city', 'state', 'zip', 'medical_alert'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    const v = values[f.id];
    if (v == null || v === '') continue;
    if (f.bind && allowed.includes(f.bind)) { sets.push(`\`${f.bind}\`=?`); params.push(String(v).slice(0, 200)); }
    if (f.bind === 'allergies' || f.bind === 'medications') {
      for (const name of String(v).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) {
        await q('INSERT INTO medication_pat (patient_id, kind, name) VALUES (?,?,?)', [patientId, f.bind === 'allergies' ? 'Allergy' : 'Medication', name.slice(0, 120)]);
      }
    }
  }
  if (sets.length) await q(`UPDATE patient SET ${sets.join(', ')} WHERE id=?`, [...params, patientId]);
}

// ===== Web requests (online bookings, portal messages) =====
r.get('/web-requests', h(async () => q(`SELECT w.*, CONCAT(p.first_name,' ',p.last_name) patient FROM web_request w LEFT JOIN patient p ON p.id=w.patient_id ORDER BY w.is_handled, w.id DESC LIMIT 200`)));
r.put('/web-requests/:id', h(async (req) => { await q('UPDATE web_request SET is_handled=? WHERE id=?', [req.body.is_handled ? 1 : 0, req.params.id]); return { ok: true }; }));
r.post('/portal-link/:pid', h(async (req) => {
  const token = crypto.randomBytes(24).toString('hex');
  await q('INSERT INTO portal_token (token, patient_id, expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))', [sha256(token), req.params.pid]);
  await audit(req.user.id, 'PatientEdit', req.params.pid, 'Portal link created', req);
  const url = `${await publicBase()}/portal?t=${token}`;
  if (req.body.send) {
    const p = await one('SELECT * FROM patient WHERE id=?', [req.params.pid]);
    const body = await renderTemplate('Hi [FName], here is your secure link to the [Practice] patient portal: ' + url, { patient: p });
    const res = req.body.send === 'email' ? await sendEmail({ to: p.email, subject: 'Your patient portal link', body, patient_id: p.id, kind: 'portal' }) : await sendSms({ to: p.wireless_phone, body, patient_id: p.id, kind: 'portal' });
    if (res.status === 'failed') throw bad(`Not sent: ${res.error}`);
  }
  return { url };
}));
export default r;

// Send someone a link to register as a new patient or to book an appointment
r.post('/invite', h(async (req) => {
  const { kind, channel, to, name } = req.body;
  if (!['register', 'book'].includes(kind)) throw bad('Choose register or book');
  if (!to) throw bad(channel === 'email' ? 'Enter an email address' : 'Enter a mobile number');
  const link = `${await publicBase()}/${kind === 'register' ? 'register' : 'book'}`;
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const body = await renderTemplate(kind === 'register'
    ? `Hi ${first}, welcome to [Practice]! Please fill in your new patient registration here: ${link}`
    : `Hi ${first}, you can book your appointment at [Practice] online here: ${link}`, { patient: null });
  const res = channel === 'email'
    ? await sendEmail({ to, subject: kind === 'register' ? 'Your new patient registration' : 'Book your appointment', body, kind: 'invite' })
    : await sendSms({ to, body, kind: 'invite' });
  await audit(req.user.id, 'PatientEdit', null, `Sent ${kind} link by ${channel} (${res.status})`, req);
  if (res.status === 'failed') throw bad(`Not sent: ${res.error}`);
  return { ...res, link };
}));

// Shareable links and QR codes for new patient registration and online booking
r.get('/share-links', h(async (req) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const mk = async (path) => { const url = `${base.replace(/\/$/, '')}${path}`; return { url, qr: await QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#10265F' } }) }; };
  return { register: await mk('/register'), book: await mk('/book'), portal: await mk('/portal') };
}));
