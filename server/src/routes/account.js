import { Router } from 'express';
import { q, one, tx } from '../db.js';
import { h, bad, notFound, today, round2 } from '../http.js';
import { need, audit } from '../auth.js';
import { ledger, balances, familyIds } from '../logic/ledger.js';

const r = Router();

r.get('/:pid', h(async (req) => {
  const ids = req.query.family ? await familyIds(req.params.pid) : [Number(req.params.pid)];
  const claims = await q(`SELECT cl.*, c.name carrier, CONCAT(p.first_name,' ',p.last_name) patient FROM claim cl JOIN pat_plan pp ON pp.id=cl.pat_plan_id
    JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier c ON c.id=ip.carrier_id JOIN patient p ON p.id=cl.patient_id
    WHERE cl.patient_id IN (?) ORDER BY cl.date_service DESC`, [ids]);
  const plans = await q('SELECT * FROM payment_plan WHERE patient_id IN (?) ORDER BY id DESC', [ids]);
  for (const pp of plans) {
    pp.paid = (await one('SELECT COALESCE(SUM(ps.amount),0) s FROM pay_split ps JOIN payment pm ON pm.id=ps.payment_id WHERE ps.patient_id=? AND pm.pay_date>=?', [pp.patient_id, pp.date_first])).s;
  }
  return { ledger: await ledger(ids), balances: await balances(req.params.pid), claims, paymentPlans: plans,
    repeating: await q(`SELECT rc.*, c.code, c.descript FROM repeat_charge rc JOIN procedure_code c ON c.id=rc.code_id WHERE rc.patient_id IN (?)`, [ids]),
    statements: await q('SELECT * FROM statement WHERE guarantor_id IN (?) ORDER BY date_sent DESC', [ids]) };
}));

// Payment with automatic FIFO allocation to oldest unpaid procedures (or explicit splits)
r.post('/:pid/payments', need('PaymentCreate'), h(async (req) => tx(async (c) => {
  const b = req.body;
  const amount = round2(b.amount);
  if (!(amount > 0)) throw bad('Amount must be greater than zero');
  const pay = await q('INSERT INTO payment (patient_id, pay_type_id, amount, pay_date, check_num, note, user_id) VALUES (?,?,?,?,?,?,?)',
    [req.params.pid, b.pay_type_id || null, amount, b.pay_date || today(), b.check_num || null, b.note || null, req.user.id], c);
  let left = amount;
  if (b.splits?.length) {
    for (const s of b.splits) { await q('INSERT INTO pay_split (payment_id, patient_id, prov_id, proc_id, amount) VALUES (?,?,?,?,?)', [pay.insertId, s.patient_id, s.prov_id || null, s.proc_id || null, s.amount], c); left -= s.amount; }
  } else {
    const ids = await familyIds(req.params.pid, c);
    const procs = await q(`SELECT p.id, p.patient_id, p.prov_id, p.fee
        - COALESCE((SELECT SUM(amount) FROM pay_split WHERE proc_id=p.id),0)
        - COALESCE((SELECT SUM(CASE WHEN status='Received' THEN ins_paid+write_off ELSE ins_est+write_off_est END) FROM claim_proc WHERE proc_id=p.id AND status IN ('Received','NotReceived')),0)
        - COALESCE((SELECT -SUM(amount) FROM adjustment WHERE proc_id=p.id),0) owed
      FROM procedure_log p WHERE p.status=2 AND p.patient_id IN (?) ORDER BY p.proc_date, p.id`, [ids], c);
    for (const p of procs) {
      if (left <= 0) break;
      const owed = round2(p.owed);
      if (owed <= 0) continue;
      const amt = Math.min(owed, left);
      await q('INSERT INTO pay_split (payment_id, patient_id, prov_id, proc_id, amount) VALUES (?,?,?,?,?)', [pay.insertId, p.patient_id, p.prov_id, p.id, amt], c);
      left = round2(left - amt);
    }
  }
  if (left > 0.004) await q('INSERT INTO pay_split (payment_id, patient_id, amount, is_prepayment) VALUES (?,?,?,1)', [pay.insertId, req.params.pid, round2(left)], c);
  await audit(req.user.id, 'PaymentCreate', req.params.pid, `Payment ${amount.toFixed(2)}`);
  return { id: pay.insertId };
})));
r.delete('/payments/:id', need('PaymentDelete'), h(async (req) => {
  const p = await one('SELECT * FROM payment WHERE id=?', [req.params.id]);
  if (!p) throw notFound();
  await q('DELETE FROM payment WHERE id=?', [p.id]);
  await audit(req.user.id, 'PaymentDelete', p.patient_id, `Payment #${p.id} of ${p.amount} deleted`);
  return { ok: true };
}));

r.post('/:pid/adjustments', need('AdjustmentCreate'), h(async (req) => {
  const b = req.body;
  if (!Number(b.amount)) throw bad('Amount is required');
  await q('INSERT INTO adjustment (patient_id, prov_id, proc_id, type_id, amount, adj_date, note) VALUES (?,?,?,?,?,?,?)',
    [req.params.pid, b.prov_id || null, b.proc_id || null, b.type_id || null, b.amount, b.adj_date || today(), b.note || null]);
  await audit(req.user.id, 'AdjustmentCreate', req.params.pid, `Adjustment ${b.amount}`);
  return { ok: true };
}));

// Claims
r.get('/claims/list/all', h(async (req) => q(`SELECT cl.*, c.name carrier, CONCAT(p.last_name,', ',p.first_name) patient FROM claim cl JOIN pat_plan pp ON pp.id=cl.pat_plan_id
  JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier c ON c.id=ip.carrier_id JOIN patient p ON p.id=cl.patient_id
  WHERE (? = '' OR cl.status=?) ORDER BY cl.date_service DESC LIMIT 500`, [req.query.status || '', req.query.status || ''])));
r.get('/claims/:id', h(async (req) => {
  const cl = await one('SELECT * FROM claim WHERE id=?', [req.params.id]);
  if (!cl) throw notFound();
  cl.procs = await q(`SELECT cp.*, c.code, c.descript, pl.tooth, pl.surf, pl.proc_date FROM claim_proc cp JOIN procedure_log pl ON pl.id=cp.proc_id JOIN procedure_code c ON c.id=pl.code_id WHERE cp.claim_id=?`, [cl.id]);
  return cl;
}));
r.post('/claims/send', need('ClaimEdit'), h(async (req) => {
  await q("UPDATE claim SET status='S', date_sent=CURDATE() WHERE id IN (?) AND status IN ('U','W')", [req.body.ids?.length ? req.body.ids : [0]]);
  return { ok: true };
}));
// Receive insurance payment by procedure
r.post('/claims/:id/receive', need('InsPayCreate'), h(async (req) => tx(async (c) => {
  const cl = await one('SELECT * FROM claim WHERE id=? FOR UPDATE', [req.params.id], c);
  if (!cl) throw notFound();
  if (cl.status === 'R') throw bad('Claim already received');
  let paid = 0, wo = 0;
  for (const row of req.body.procs || []) {
    await q("UPDATE claim_proc SET ins_paid=?, write_off=?, status='Received' WHERE id=? AND claim_id=?", [row.ins_paid || 0, row.write_off || 0, row.id, cl.id], c);
    paid += Number(row.ins_paid || 0); wo += Number(row.write_off || 0);
  }
  await q("UPDATE claim SET status='R', date_received=?, ins_paid=?, write_off=?, note=? WHERE id=?", [req.body.date || today(), round2(paid), round2(wo), req.body.note || cl.note, cl.id], c);
  await audit(req.user.id, 'InsPayCreate', cl.patient_id, `Claim #${cl.id} received: paid ${paid.toFixed(2)}, write-off ${wo.toFixed(2)}`);
  return { ok: true };
})));

// Payment plans
r.post('/:pid/payment-plans', need('PaymentPlanEdit'), h(async (req) => {
  const b = req.body;
  if (!(b.principal > 0) || !(b.pay_amount > 0)) throw bad('Principal and payment amount are required');
  const g = await one('SELECT COALESCE(guarantor_id,id) g FROM patient WHERE id=?', [req.params.pid]);
  await q('INSERT INTO payment_plan (patient_id, guarantor_id, principal, apr, pay_amount, date_first, frequency, note) VALUES (?,?,?,?,?,?,?,?)',
    [req.params.pid, g.g, b.principal, b.apr || 0, b.pay_amount, b.date_first || today(), b.frequency || 'Monthly', b.note || null]);
  return { ok: true };
}));
r.post('/payment-plans/:id/close', need('PaymentPlanEdit'), h(async (req) => { await q('UPDATE payment_plan SET is_closed=1 WHERE id=?', [req.params.id]); return { ok: true }; }));

// Repeating charges
r.post('/:pid/repeating', need('AccountModule'), h(async (req) => {
  const b = req.body;
  await q('INSERT INTO repeat_charge (patient_id, code_id, amount, date_start, date_stop, note) VALUES (?,?,?,?,?,?)', [req.params.pid, b.code_id, b.amount, b.date_start || today(), b.date_stop || null, b.note || null]);
  return { ok: true };
}));
r.post('/repeating/run', need('Billing'), h(async (req) => tx(async (c) => {
  const due = await q(`SELECT rc.*, p.pri_prov_id FROM repeat_charge rc JOIN patient p ON p.id=rc.patient_id
    WHERE rc.date_start<=CURDATE() AND (rc.date_stop IS NULL OR rc.date_stop>=CURDATE())
      AND (rc.last_posted IS NULL OR rc.last_posted < DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`, [], c);
  for (const rc of due) {
    await q('INSERT INTO procedure_log (patient_id, code_id, prov_id, fee, status, proc_date, note) VALUES (?,?,?,?,2,CURDATE(),?)', [rc.patient_id, rc.code_id, rc.pri_prov_id || 1, rc.amount, 'Repeating charge'], c);
    await q('UPDATE repeat_charge SET last_posted=CURDATE() WHERE id=?', [rc.id], c);
  }
  return { posted: due.length };
})));

// Statements: create one per guarantor with balance over a minimum
r.post('/statements/run', need('Billing'), h(async (req) => {
  const min = Number(req.body.min_balance ?? 1);
  const gs = await q('SELECT DISTINCT COALESCE(guarantor_id,id) g FROM patient WHERE status IN (\'Patient\',\'NonPatient\')');
  let n = 0;
  for (const { g } of gs) {
    const bal = (await balances(g)).family.patPortion;
    if (bal >= min) { await q('INSERT INTO statement (guarantor_id, date_sent, balance, mode) VALUES (?,CURDATE(),?,?)', [g, bal, req.body.mode || 'Email']); n++; }
  }
  return { created: n };
}));
export default r;
