import { Router } from 'express';
import { q, one, tx, setClause } from '../db.js';
import { h, bad, notFound, today } from '../http.js';
import { need, audit } from '../auth.js';
import { balances, familyIds } from '../logic/ledger.js';

const r = Router();
const PAT_FIELDS = ['guarantor_id', 'clinic_id', 'last_name', 'first_name', 'preferred', 'birthdate', 'gender', 'status', 'position', 'wireless_phone', 'home_phone', 'email',
  'address', 'city', 'state', 'zip', 'pri_prov_id', 'sec_prov_id', 'fee_schedule_id', 'billing_type_id', 'medical_alert', 'allergies', 'note', 'text_ok', 'referral_source'];

// Search patients
r.get('/', h(async (req) => {
  const s = (req.query.search || '').trim();
  const like = `%${s}%`;
  const digits = s.replace(/\D/g, '');
  return q(`SELECT p.id, p.first_name, p.last_name, p.preferred, p.birthdate, p.status, p.wireless_phone, p.home_phone, p.email, p.guarantor_id,
      TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) age
    FROM patient p
    WHERE (? = '' OR CONCAT(p.first_name,' ',p.last_name) LIKE ? OR CONCAT(p.last_name,', ',p.first_name) LIKE ? OR p.id = ?
      OR (? <> '' AND (REPLACE(REPLACE(REPLACE(p.wireless_phone,'-',''),' ',''),'(','') LIKE ? OR REPLACE(REPLACE(REPLACE(p.home_phone,'-',''),' ',''),'(','') LIKE ?)))
      AND (? = '1' OR p.status NOT IN ('Archived','Deceased'))
    ORDER BY p.last_name, p.first_name LIMIT 100`,
  [s, like, like, Number(s) || 0, digits, `%${digits}%`, `%${digits}%`, req.query.all ? '1' : '0']);
}));

// Full patient record for the Family module
r.get('/:id', h(async (req) => {
  const id = Number(req.params.id);
  const p = await one(`SELECT p.*, TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) age, pr.abbr pri_prov FROM patient p LEFT JOIN provider pr ON pr.id=p.pri_prov_id WHERE p.id=?`, [id]);
  if (!p) throw notFound('Patient not found');
  const ids = await familyIds(id);
  const family = await q(`SELECT id, first_name, last_name, birthdate, gender, status, position, guarantor_id, TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) age FROM patient WHERE id IN (?) ORDER BY guarantor_id IS NOT NULL, birthdate`, [ids]);
  const insurance = await q(`SELECT pp.id pat_plan_id, pp.ordinal, pp.relationship, pp.date_eligibility_verified, s.id ins_sub_id, s.subscriber_num, s.subscriber_id,
      CONCAT(sp.first_name,' ',sp.last_name) subscriber, ip.id plan_id, ip.group_name, ip.group_num, ip.plan_type, ip.annual_max, ip.deductible, ip.fee_schedule_id, ip.date_benefits_verified,
      c.id carrier_id, c.name carrier
    FROM pat_plan pp JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN patient sp ON sp.id=s.subscriber_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier c ON c.id=ip.carrier_id
    WHERE pp.patient_id=? ORDER BY pp.ordinal`, [id]);
  for (const i of insurance) i.benefits = await q('SELECT category, percent FROM benefit WHERE plan_id=? ORDER BY category', [i.plan_id]);
  const recalls = await q(`SELECT r.*, d.name status_name FROM recall r LEFT JOIN definition d ON d.id=r.status_id WHERE r.patient_id=?`, [id]);
  const referrals = await q(`SELECT ra.*, rf.name, rf.specialty FROM ref_attach ra JOIN referral rf ON rf.id=ra.referral_id WHERE ra.patient_id=? ORDER BY ra.ref_date DESC`, [id]);
  const medical = await q('SELECT * FROM medication_pat WHERE patient_id=? ORDER BY kind, name', [id]);
  const nextAppt = await one(`SELECT id, apt_datetime FROM appointment WHERE patient_id=? AND apt_status=1 AND apt_datetime>=NOW() ORDER BY apt_datetime LIMIT 1`, [id]);
  await audit(req.user.id, 'FamilyModule', id, 'Patient record viewed');
  return { patient: p, family, insurance, recalls, referrals, medical, nextAppt, balances: await balances(id) };
}));

r.post('/', need('PatientEdit'), h(async (req) => {
  const b = req.body;
  if (!b.first_name || !b.last_name) throw bad('First and last name are required');
  const s = setClause(b, PAT_FIELDS);
  const res = await q(`INSERT INTO patient SET ${s.sql}`, s.params);
  // Default recall for new active patients
  await q(`INSERT IGNORE INTO recall (patient_id, recall_type, interval_months, date_due) VALUES (?, 'Prophy', 6, CURDATE())`, [res.insertId]);
  await audit(req.user.id, 'PatientEdit', res.insertId, 'Patient created');
  return { id: res.insertId };
}));

r.put('/:id', need('PatientEdit'), h(async (req) => {
  const s = setClause(req.body, PAT_FIELDS);
  if (s.sql) await q(`UPDATE patient SET ${s.sql} WHERE id=?`, [...s.params, req.params.id]);
  await audit(req.user.id, 'PatientEdit', req.params.id, `Patient edited: ${Object.keys(req.body).join(', ')}`);
  return { ok: true };
}));

// Family: move a patient into a family / set guarantor
r.post('/:id/family/move', need('PatientEdit'), h(async (req) => {
  const g = await one('SELECT id, COALESCE(guarantor_id,id) gid FROM patient WHERE id=?', [req.body.toPatientId]);
  if (!g) throw notFound();
  await q('UPDATE patient SET guarantor_id=? WHERE id=?', [g.gid === Number(req.params.id) ? null : g.gid, req.params.id]);
  return { ok: true };
}));
r.post('/:id/family/set-guarantor', need('PatientEdit'), h(async (req) => tx(async (c) => {
  const ids = await familyIds(req.params.id, c);
  await q('UPDATE patient SET guarantor_id=? WHERE id IN (?)', [req.params.id, ids], c);
  await q('UPDATE patient SET guarantor_id=NULL WHERE id=?', [req.params.id], c);
  return { ok: true };
})));

// Insurance: add plan to patient (creates carrier/plan/subscriber as needed)
r.post('/:id/insurance', need('InsPlanEdit'), h(async (req) => tx(async (c) => {
  const b = req.body;
  let carrierId = b.carrier_id;
  if (!carrierId) {
    if (!b.carrier_name) throw bad('Carrier is required');
    carrierId = (await q('INSERT INTO carrier (name, phone) VALUES (?,?)', [b.carrier_name, b.carrier_phone || null], c)).insertId;
  }
  let planId = b.plan_id;
  if (!planId) {
    planId = (await q('INSERT INTO ins_plan (carrier_id, group_name, group_num, plan_type, annual_max, deductible, fee_schedule_id) VALUES (?,?,?,?,?,?,?)',
      [carrierId, b.group_name || null, b.group_num || null, b.plan_type || 'PPO', b.annual_max ?? 1500, b.deductible ?? 50, b.fee_schedule_id || null], c)).insertId;
    const defaults = b.benefits || { Diagnostic: 100, Preventive: 100, Restorative: 80, Endo: 80, Perio: 80, OralSurg: 80, Prosth: 50, Ortho: 50 };
    for (const [cat, pct] of Object.entries(defaults)) await q('INSERT INTO benefit (plan_id, category, percent) VALUES (?,?,?)', [planId, cat, pct], c);
  }
  const subId = (await q('INSERT INTO ins_sub (plan_id, subscriber_id, subscriber_num, date_effective) VALUES (?,?,?,?)',
    [planId, b.subscriber_id || req.params.id, b.subscriber_num || null, b.date_effective || null], c)).insertId;
  const ord = (await one('SELECT COALESCE(MAX(ordinal),0)+1 n FROM pat_plan WHERE patient_id=?', [req.params.id], c)).n;
  await q('INSERT INTO pat_plan (patient_id, ins_sub_id, ordinal, relationship) VALUES (?,?,?,?)', [req.params.id, subId, ord, b.relationship || 'Self'], c);
  await audit(req.user.id, 'InsPlanEdit', req.params.id, 'Insurance plan added');
  return { ok: true };
})));
r.put('/insurance/plan/:planId', need('InsPlanEdit'), h(async (req) => {
  const b = req.body;
  await q('UPDATE ins_plan SET group_name=?, group_num=?, plan_type=?, annual_max=?, deductible=?, fee_schedule_id=? WHERE id=?',
    [b.group_name, b.group_num, b.plan_type, b.annual_max, b.deductible, b.fee_schedule_id || null, req.params.planId]);
  if (b.benefits) for (const [cat, pct] of Object.entries(b.benefits)) {
    await q('INSERT INTO benefit (plan_id, category, percent) VALUES (?,?,?) ON DUPLICATE KEY UPDATE percent=VALUES(percent)', [req.params.planId, cat, pct]);
  }
  return { ok: true };
}));
r.post('/insurance/verify', need('InsPlanEdit'), h(async (req) => {
  const { pat_plan_id, plan_id, what } = req.body;
  if (what !== 'eligibility' && plan_id) await q('UPDATE ins_plan SET date_benefits_verified=CURDATE() WHERE id=?', [plan_id]);
  if (what !== 'benefits' && pat_plan_id) await q('UPDATE pat_plan SET date_eligibility_verified=CURDATE() WHERE id=?', [pat_plan_id]);
  return { ok: true };
}));
r.delete('/insurance/:patPlanId', need('InsPlanEdit'), h(async (req) => {
  const pp = await one('SELECT * FROM pat_plan WHERE id=?', [req.params.patPlanId]);
  if (!pp) throw notFound();
  const used = await one("SELECT COUNT(*) n FROM claim WHERE pat_plan_id=?", [pp.id]);
  if (used.n) throw bad('This plan has claims attached and cannot be dropped');
  await q('DELETE FROM pat_plan WHERE id=?', [pp.id]);
  await q('UPDATE pat_plan SET ordinal=ordinal-1 WHERE patient_id=? AND ordinal>?', [pp.patient_id, pp.ordinal]);
  return { ok: true };
}));

// Recall edit
r.put('/:id/recall', need('PatientEdit'), h(async (req) => {
  const b = req.body;
  await q(`INSERT INTO recall (patient_id, recall_type, interval_months, date_due, status_id, note, is_disabled) VALUES (?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE interval_months=VALUES(interval_months), date_due=VALUES(date_due), status_id=VALUES(status_id), note=VALUES(note), is_disabled=VALUES(is_disabled)`,
  [req.params.id, b.recall_type || 'Prophy', b.interval_months || 6, b.date_due || null, b.status_id || null, b.note || null, b.is_disabled ? 1 : 0]);
  return { ok: true };
}));

// Referrals
r.post('/:id/referrals', need('PatientEdit'), h(async (req) => {
  await q('INSERT INTO ref_attach (patient_id, referral_id, direction, ref_date, note) VALUES (?,?,?,?,?)',
    [req.params.id, req.body.referral_id, req.body.direction || 'From', req.body.ref_date || today(), req.body.note || null]);
  return { ok: true };
}));

// Medical: medications, allergies, problems
r.post('/:id/medical', need('PatientEdit'), h(async (req) => {
  await q('INSERT INTO medication_pat (patient_id, kind, name, note) VALUES (?,?,?,?)', [req.params.id, req.body.kind, req.body.name, req.body.note || null]);
  return { ok: true };
}));
r.delete('/medical/:mid', need('PatientEdit'), h(async (req) => { await q('DELETE FROM medication_pat WHERE id=?', [req.params.mid]); return { ok: true }; }));

// Commlog
r.get('/:id/commlog', h(async (req) => q(`SELECT c.*, u.username FROM commlog c LEFT JOIN app_user u ON u.id=c.user_id WHERE c.patient_id=? ORDER BY c.comm_dt DESC`, [req.params.id])));
r.post('/:id/commlog', h(async (req) => {
  if (!req.body.note) throw bad('Note is required');
  await q('INSERT INTO commlog (patient_id, comm_type, mode, note, user_id) VALUES (?,?,?,?,?)', [req.params.id, req.body.comm_type || 'Misc', req.body.mode || 'Phone', req.body.note, req.user.id]);
  if (req.body.comm_type === 'Recall') await q('UPDATE recall SET reminders_sent=reminders_sent+1, date_last_reminder=CURDATE() WHERE patient_id=?', [req.params.id]);
  return { ok: true };
}));
export default r;
