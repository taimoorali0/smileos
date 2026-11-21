import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { q, one } from '../db.js';
import { h, bad, notFound, today } from '../http.js';
import { need, audit } from '../auth.js';
import { aging } from '../logic/ledger.js';

const UPLOAD = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOAD, filename: (_r, f, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.originalname).toLowerCase()}`) }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, /^(image\/(png|jpeg|gif|webp|bmp)|application\/pdf)$/.test(f.mimetype)),
});

// ===== Imaging =====
export const imaging = Router();
imaging.get('/:pid', need('ImagingModule'), h(async (req) => q(`SELECT d.*, df.name category FROM document d LEFT JOIN definition df ON df.id=d.category_id WHERE d.patient_id=? ORDER BY d.created_at DESC`, [req.params.pid])));
imaging.post('/:pid', need('ImageCreate'), upload.single('file'), h(async (req) => {
  if (!req.file) throw bad('Upload an image (PNG, JPG, GIF, WebP, BMP) or PDF');
  const res = await q('INSERT INTO document (patient_id, category_id, file_name, mime, description, tooth) VALUES (?,?,?,?,?,?)',
    [req.params.pid, req.body.category_id || null, req.file.filename, req.file.mimetype, req.body.description || req.file.originalname, req.body.tooth || null]);
  await audit(req.user.id, 'ImageCreate', req.params.pid, `Image uploaded: ${req.file.originalname}`);
  return { id: res.insertId };
}));
imaging.get('/file/:id', need('ImagingModule'), h(async (req, res) => {
  const d = await one('SELECT * FROM document WHERE id=?', [req.params.id]);
  if (!d) throw notFound();
  res.type(d.mime).sendFile(path.join(UPLOAD, path.basename(d.file_name)));
}));
imaging.put('/doc/:id', need('ImageCreate'), h(async (req) => {
  await q('UPDATE document SET description=?, category_id=?, tooth=? WHERE id=?', [req.body.description, req.body.category_id || null, req.body.tooth || null, req.params.id]);
  return { ok: true };
}));
imaging.delete('/doc/:id', need('ImageDelete'), h(async (req) => {
  const d = await one('SELECT * FROM document WHERE id=?', [req.params.id]);
  if (!d) throw notFound();
  await q('DELETE FROM document WHERE id=?', [d.id]);
  fs.rm(path.join(UPLOAD, path.basename(d.file_name)), () => {});
  await audit(req.user.id, 'ImageDelete', d.patient_id, `Image deleted: ${d.description}`);
  return { ok: true };
}));

// ===== Manage: time clock, tasks =====
export const manage = Router();
manage.get('/timeclock', h(async (req) => q(`SELECT t.*, u.full_name, TIMESTAMPDIFF(MINUTE, t.clock_in, COALESCE(t.clock_out, NOW())) minutes
  FROM time_clock t JOIN app_user u ON u.id=t.user_id WHERE (? = '1' OR t.user_id=?) AND t.clock_in >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) ORDER BY t.clock_in DESC`,
[req.user.permissions.has('TimeCardEdit') || req.user.permissions.has('SecurityAdmin') ? '1' : '0', req.user.id])));
manage.post('/timeclock', h(async (req) => {
  const open = await one('SELECT id FROM time_clock WHERE user_id=? AND clock_out IS NULL', [req.user.id]);
  if (open) await q('UPDATE time_clock SET clock_out=NOW() WHERE id=?', [open.id]);
  else await q('INSERT INTO time_clock (user_id, clock_in) VALUES (?, NOW())', [req.user.id]);
  return { clockedIn: !open };
}));
manage.get('/tasks', h(async () => q(`SELECT t.*, u.full_name assigned, CONCAT(p.first_name,' ',p.last_name) patient FROM task t LEFT JOIN app_user u ON u.id=t.assigned_user_id
  LEFT JOIN patient p ON p.id=t.patient_id ORDER BY t.is_done, t.date_due IS NULL, t.date_due, t.id DESC LIMIT 300`)));
manage.post('/tasks', h(async (req) => {
  if (!req.body.descript) throw bad('Description is required');
  await q('INSERT INTO task (descript, patient_id, assigned_user_id, created_by, date_due) VALUES (?,?,?,?,?)',
    [req.body.descript, req.body.patient_id || null, req.body.assigned_user_id || null, req.user.id, req.body.date_due || null]);
  return { ok: true };
}));
manage.put('/tasks/:id', h(async (req) => { await q('UPDATE task SET is_done=? WHERE id=?', [req.body.is_done ? 1 : 0, req.params.id]); return { ok: true }; }));
manage.get('/users-lite', h(async () => q('SELECT id, full_name FROM app_user WHERE is_hidden=0 ORDER BY full_name')));

// ===== Reports =====
export const reports = Router();
reports.use(need('Reports'));
reports.get('/production', h(async (req) => {
  const from = req.query.from || today(); const to = req.query.to || from;
  const byProv = await q(`SELECT pr.abbr, CONCAT(pr.first_name,' ',pr.last_name) name,
      COALESCE((SELECT SUM(fee) FROM procedure_log WHERE prov_id=pr.id AND status=2 AND proc_date BETWEEN ? AND ?),0) production,
      COALESCE((SELECT SUM(amount) FROM adjustment WHERE prov_id=pr.id AND adj_date BETWEEN ? AND ?),0) adjustments,
      COALESCE((SELECT SUM(cp.write_off) FROM claim_proc cp JOIN procedure_log pl ON pl.id=cp.proc_id WHERE pl.prov_id=pr.id AND cp.status='Received' AND pl.proc_date BETWEEN ? AND ?),0) write_offs,
      COALESCE((SELECT SUM(ps.amount) FROM pay_split ps JOIN payment pm ON pm.id=ps.payment_id WHERE ps.prov_id=pr.id AND pm.pay_date BETWEEN ? AND ?),0) pat_income
    FROM provider pr WHERE pr.is_hidden=0 ORDER BY pr.abbr`, [from, to, from, to, from, to, from, to]);
  const insIncome = (await one(`SELECT COALESCE(SUM(ins_paid),0) s FROM claim WHERE status='R' AND date_received BETWEEN ? AND ?`, [from, to])).s;
  const unassigned = (await one(`SELECT COALESCE(SUM(ps.amount),0) s FROM pay_split ps JOIN payment pm ON pm.id=ps.payment_id WHERE ps.prov_id IS NULL AND pm.pay_date BETWEEN ? AND ?`, [from, to])).s;
  return { from, to, byProv, insIncome, unassignedIncome: unassigned };
}));
reports.get('/aging', h(async () => aging()));
reports.get('/procedures', h(async (req) => {
  const from = req.query.from || today(); const to = req.query.to || from;
  return q(`SELECT pl.proc_date, CONCAT(p.last_name,', ',p.first_name) patient, c.code, c.descript, pl.tooth, pl.surf, pr.abbr prov, pl.fee
    FROM procedure_log pl JOIN patient p ON p.id=pl.patient_id JOIN procedure_code c ON c.id=pl.code_id JOIN provider pr ON pr.id=pl.prov_id
    WHERE pl.status=2 AND pl.proc_date BETWEEN ? AND ? ORDER BY pl.proc_date, patient`, [from, to]);
}));
reports.get('/payments', h(async (req) => {
  const from = req.query.from || today(); const to = req.query.to || from;
  return q(`SELECT pm.pay_date, CONCAT(p.last_name,', ',p.first_name) patient, d.name type, pm.amount, pm.check_num, pm.note
    FROM payment pm JOIN patient p ON p.id=pm.patient_id LEFT JOIN definition d ON d.id=pm.pay_type_id WHERE pm.pay_date BETWEEN ? AND ? ORDER BY pm.pay_date`, [from, to]);
}));
reports.get('/new-patients', h(async (req) => {
  const from = req.query.from || today().slice(0, 8) + '01'; const to = req.query.to || today();
  return q(`SELECT id, CONCAT(last_name,', ',first_name) patient, date_first_visit, referral_source FROM patient WHERE date_first_visit BETWEEN ? AND ? ORDER BY date_first_visit`, [from, to]);
}));
reports.get('/treatment-finder', h(async () => q(`SELECT p.id, CONCAT(p.last_name,', ',p.first_name) patient, p.wireless_phone, COUNT(pl.id) procs, SUM(pl.fee) amount,
    c.name carrier
  FROM procedure_log pl JOIN patient p ON p.id=pl.patient_id
  LEFT JOIN pat_plan pp ON pp.patient_id=p.id AND pp.ordinal=1 LEFT JOIN ins_sub s ON s.id=pp.ins_sub_id LEFT JOIN ins_plan ip ON ip.id=s.plan_id LEFT JOIN carrier c ON c.id=ip.carrier_id
  WHERE pl.status=1 AND pl.apt_id IS NULL AND p.status='Patient' GROUP BY p.id, c.name ORDER BY amount DESC`)));
reports.get('/dashboard', h(async () => {
  const t = today();
  const m = t.slice(0, 8) + '01';
  return {
    apptsToday: (await one('SELECT COUNT(*) n FROM appointment WHERE DATE(apt_datetime)=? AND apt_status IN (1,2)', [t])).n,
    productionMonth: (await one('SELECT COALESCE(SUM(fee),0) s FROM procedure_log WHERE status=2 AND proc_date BETWEEN ? AND ?', [m, t])).s,
    collectionsMonth: (await one('SELECT COALESCE(SUM(amount),0) s FROM payment WHERE pay_date BETWEEN ? AND ?', [m, t])).s
      + (await one("SELECT COALESCE(SUM(ins_paid),0) s FROM claim WHERE status='R' AND date_received BETWEEN ? AND ?", [m, t])).s,
    newPatientsMonth: (await one('SELECT COUNT(*) n FROM patient WHERE date_first_visit BETWEEN ? AND ?', [m, t])).n,
    claimsOutstanding: (await one("SELECT COUNT(*) n, COALESCE(SUM(ins_est),0) s FROM claim WHERE status IN ('U','W','S')")),
    unscheduledTx: (await one('SELECT COALESCE(SUM(fee),0) s FROM procedure_log WHERE status=1 AND apt_id IS NULL')).s,
  };
}));
