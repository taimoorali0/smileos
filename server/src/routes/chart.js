import { Router } from 'express';
import { q, one, tx } from '../db.js';
import { h, bad, notFound, today } from '../http.js';
import { need, audit } from '../auth.js';
import { feeFor } from '../logic/fees.js';
import { estimate } from '../logic/insurance.js';

const r = Router();
const STATUS = { TP: 1, C: 2, EC: 3, EO: 4, R: 5, D: 6, Cn: 7 };

r.get('/:pid/procedures', h(async (req) => q(`SELECT pl.*, c.code, c.descript, c.abbr, c.category, c.treat_area, c.paint_color, pr.abbr prov_abbr,
    a.apt_datetime, a.apt_status
  FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id JOIN provider pr ON pr.id=pl.prov_id LEFT JOIN appointment a ON a.id=pl.apt_id
  WHERE pl.patient_id=? AND pl.status<>6 ORDER BY COALESCE(pl.proc_date, '9999-12-31'), pl.id`, [req.params.pid])));

r.post('/:pid/procedures', need('ProcEdit'), h(async (req) => tx(async (c) => {
  const b = req.body;
  const items = Array.isArray(b.items) ? b.items : [b];
  const ids = [];
  for (const it of items) {
    const code = await one('SELECT * FROM procedure_code WHERE id=? OR code=?', [it.code_id || 0, it.code || ''], c);
    if (!code) throw bad(`Unknown procedure code ${it.code || it.code_id}`);
    if (['Tooth', 'Surface'].includes(code.treat_area) && !it.tooth) throw bad(`${code.code} needs a tooth number`);
    if (code.treat_area === 'Surface' && !it.surf) throw bad(`${code.code} needs surfaces`);
    const status = STATUS[it.status] || it.status || STATUS.TP;
    if (status === STATUS.C && !req.user.permissions.has('ProcComplete') && !req.user.permissions.has('SecurityAdmin')) throw bad('No permission to set procedures complete');
    const prov = it.prov_id || req.user.providerId || (await one('SELECT pri_prov_id FROM patient WHERE id=?', [req.params.pid], c))?.pri_prov_id;
    if (!prov) throw bad('Choose a provider');
    const fee = it.fee ?? (status === STATUS.EC || status === STATUS.EO || status === STATUS.Cn ? 0 : await feeFor(code.id, req.params.pid, prov, c));
    const res = await q(`INSERT INTO procedure_log (patient_id, code_id, prov_id, tooth, surf, fee, status, priority, proc_date, note, apt_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.params.pid, code.id, prov, it.tooth || null, it.surf || null, fee, status, it.priority || 0,
        status === STATUS.TP ? null : (it.proc_date || today()), it.note || null, it.apt_id || null], c);
    ids.push(res.insertId);
  }
  await audit(req.user.id, 'ProcEdit', req.params.pid, `${ids.length} procedure(s) added`);
  return { ids };
})));

r.put('/procedures/:id', need('ProcEdit'), h(async (req) => {
  const p = await one('SELECT * FROM procedure_log WHERE id=?', [req.params.id]);
  if (!p) throw notFound();
  const b = req.body;
  if (p.status === STATUS.C && b.status && b.status !== STATUS.C) {
    const paid = await one('SELECT COUNT(*) n FROM pay_split WHERE proc_id=?', [p.id]);
    if (paid.n) throw bad('Procedure has payments attached and cannot be changed from complete');
    await q("DELETE FROM claim_proc WHERE proc_id=? AND status='NotReceived'", [p.id]);
  }
  if (b.status === STATUS.C && p.status !== STATUS.C && !req.user.permissions.has('ProcComplete') && !req.user.permissions.has('SecurityAdmin')) throw bad('No permission to set complete');
  await q(`UPDATE procedure_log SET tooth=?, surf=?, fee=?, status=?, priority=?, prov_id=?, note=?, proc_date=? WHERE id=?`,
    [b.tooth ?? p.tooth, b.surf ?? p.surf, b.fee ?? p.fee, b.status ?? p.status, b.priority ?? p.priority, b.prov_id ?? p.prov_id, b.note ?? p.note,
      (b.status ?? p.status) === STATUS.TP ? null : (b.proc_date || p.proc_date || today()), p.id]);
  if (b.status === STATUS.TP) await q('UPDATE procedure_log SET apt_id=NULL WHERE id=? AND apt_id IN (SELECT id FROM appointment WHERE apt_status=2)', [p.id]);
  await audit(req.user.id, 'ProcEdit', p.patient_id, `Procedure #${p.id} edited`);
  return { ok: true };
}));

r.delete('/procedures/:id', need('ProcDelete'), h(async (req) => {
  const p = await one('SELECT * FROM procedure_log WHERE id=?', [req.params.id]);
  if (!p) throw notFound();
  if (p.status === STATUS.C) throw bad('Completed procedures cannot be deleted. Change status first.');
  await q('UPDATE procedure_log SET status=6, apt_id=NULL, planned_apt_id=NULL WHERE id=?', [p.id]);
  await audit(req.user.id, 'ProcDelete', p.patient_id, `Procedure #${p.id} deleted`);
  return { ok: true };
}));

// Progress notes
r.get('/:pid/notes', h(async (req) => q(`SELECT n.*, u.username FROM progress_note n LEFT JOIN app_user u ON u.id=n.user_id WHERE n.patient_id=? ORDER BY n.created_at DESC`, [req.params.pid])));
r.post('/:pid/notes', need('ProcEdit'), h(async (req) => {
  if (!req.body.note) throw bad('Note is empty');
  await q('INSERT INTO progress_note (patient_id, proc_id, user_id, note) VALUES (?,?,?,?)', [req.params.pid, req.body.proc_id || null, req.user.id, req.body.note]);
  return { ok: true };
}));

// Perio chart
r.get('/:pid/perio', h(async (req) => {
  const exams = (await q('SELECT DISTINCT exam_date FROM perio_measure WHERE patient_id=? ORDER BY exam_date DESC', [req.params.pid])).map((x) => x.exam_date);
  const date = req.query.date || exams[0];
  return { exams, date: date || null, rows: date ? await q('SELECT tooth, depths, bleeding FROM perio_measure WHERE patient_id=? AND exam_date=?', [req.params.pid, date]) : [] };
}));
r.put('/:pid/perio', need('PerioEdit'), h(async (req) => {
  const { date, rows } = req.body;
  for (const row of rows || []) {
    await q(`INSERT INTO perio_measure (patient_id, exam_date, tooth, depths, bleeding) VALUES (?,?,?,?,?)
      ON DUPLICATE KEY UPDATE depths=VALUES(depths), bleeding=VALUES(bleeding)`, [req.params.pid, date || today(), row.tooth, row.depths, row.bleeding || '']);
  }
  return { ok: true };
}));

// Prescriptions
r.get('/:pid/rx', h(async (req) => q('SELECT rx.*, p.abbr prov_abbr FROM rx JOIN provider p ON p.id=rx.prov_id WHERE patient_id=? ORDER BY rx_date DESC', [req.params.pid])));
r.post('/:pid/rx', need('RxCreate'), h(async (req) => {
  const b = req.body;
  if (!b.drug || !b.sig) throw bad('Drug and directions are required');
  const allergy = await one("SELECT name FROM medication_pat WHERE patient_id=? AND kind='Allergy' AND is_active=1 AND ? LIKE CONCAT('%', name, '%')", [req.params.pid, b.drug]);
  if (allergy && !b.override) throw bad(`Allergy warning: patient is allergic to ${allergy.name}. Confirm to override.`);
  await q('INSERT INTO rx (patient_id, prov_id, drug, sig, disp, refills, rx_date) VALUES (?,?,?,?,?,?,?)',
    [req.params.pid, b.prov_id || req.user.providerId, b.drug, b.sig, b.disp || null, b.refills || null, today()]);
  await audit(req.user.id, 'RxCreate', req.params.pid, `Rx: ${b.drug}`);
  return { ok: true };
}));

// ===== Treatment plan =====
r.get('/:pid/treatplan', h(async (req) => {
  const procs = await q(`SELECT pl.*, c.code, c.descript, c.abbr, c.category, pr.abbr prov_abbr, a.apt_datetime
    FROM procedure_log pl JOIN procedure_code c ON c.id=pl.code_id JOIN provider pr ON pr.id=pl.prov_id LEFT JOIN appointment a ON a.id=pl.apt_id
    WHERE pl.patient_id=? AND pl.status=1 ORDER BY pl.priority, pl.tooth+0, pl.id`, [req.params.pid]);
  const { plan, est } = await estimate(req.params.pid, procs);
  const rows = procs.map((p) => ({ ...p, ...est[p.id] }));
  const sum = (k) => Math.round(rows.reduce((s, x) => s + Number(x[k] || 0), 0) * 100) / 100;
  const saved = await q('SELECT * FROM treat_plan WHERE patient_id=? ORDER BY created_at DESC', [req.params.pid]);
  return { rows, plan: plan && { carrier: plan.carrier_name, annual_max: plan.annual_max, deductible: plan.deductible },
    totals: { fee: sum('fee'), insEst: sum('insEst'), writeOff: sum('writeOffEst'), patient: sum('patPortion') }, saved };
}));
r.post('/:pid/treatplan', need('TreatPlanEdit'), h(async (req) => {
  const procs = await q('SELECT id FROM procedure_log WHERE patient_id=? AND status=1', [req.params.pid]);
  const res = await q('INSERT INTO treat_plan (patient_id, heading, note, proc_ids, signed_by, date_signed) VALUES (?,?,?,?,?,?)',
    [req.params.pid, req.body.heading || 'Treatment Plan', req.body.note || null, procs.map((p) => p.id).join(','), req.body.signed_by || null, req.body.signed_by ? new Date() : null]);
  await audit(req.user.id, 'TreatPlanEdit', req.params.pid, `Treatment plan saved${req.body.signed_by ? ' and signed' : ''}`);
  return { id: res.insertId };
}));
r.put('/procedures/:id/priority', need('TreatPlanEdit'), h(async (req) => {
  await q('UPDATE procedure_log SET priority=? WHERE id=? AND status=1', [req.body.priority || 0, req.params.id]);
  return { ok: true };
}));
export default r;
