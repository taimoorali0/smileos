import { q, one } from '../db.js';
import { round2 } from '../http.js';

/** All family member ids for a patient. */
export async function familyIds(patientId, conn) {
  const p = await one('SELECT id, guarantor_id FROM patient WHERE id=?', [patientId], conn);
  if (!p) return [];
  const g = p.guarantor_id || p.id;
  return (await q('SELECT id FROM patient WHERE id=? OR guarantor_id=?', [g, g], conn)).map((r) => r.id);
}

/** Chronological ledger rows for one or more patients with running balance. */
export async function ledger(patientIds, conn) {
  if (!patientIds.length) return [];
  const rows = await q(`
    SELECT 'Proc' kind, p.id, p.patient_id, p.proc_date dt, CONCAT(c.code,' ',c.descript, IF(p.tooth IS NULL OR p.tooth='', '', CONCAT(' #',p.tooth)), IF(p.surf IS NULL OR p.surf='', '', CONCAT(' ',p.surf))) descr, p.fee charge, 0 credit, pr.abbr prov
      FROM procedure_log p JOIN procedure_code c ON c.id=p.code_id LEFT JOIN provider pr ON pr.id=p.prov_id
      WHERE p.status=2 AND p.patient_id IN (?)
    UNION ALL
    SELECT 'Adj', a.id, a.patient_id, a.adj_date, CONCAT('Adjustment: ', COALESCE(d.name,''), ' ', COALESCE(a.note,'')), IF(a.amount>0,a.amount,0), IF(a.amount<0,-a.amount,0), pr.abbr
      FROM adjustment a LEFT JOIN definition d ON d.id=a.type_id LEFT JOIN provider pr ON pr.id=a.prov_id WHERE a.patient_id IN (?)
    UNION ALL
    SELECT 'Pay', ps.id, ps.patient_id, pm.pay_date, CONCAT('Payment: ', COALESCE(d.name,''), ' ', COALESCE(pm.note,''), IF(ps.is_prepayment,' (prepayment)','')), 0, ps.amount, pr.abbr
      FROM pay_split ps JOIN payment pm ON pm.id=ps.payment_id LEFT JOIN definition d ON d.id=pm.pay_type_id LEFT JOIN provider pr ON pr.id=ps.prov_id WHERE ps.patient_id IN (?)
    UNION ALL
    SELECT 'InsPay', cl.id, cl.patient_id, cl.date_received, CONCAT('Insurance payment, claim #', cl.id), 0, cl.ins_paid + cl.write_off, NULL
      FROM claim cl WHERE cl.status='R' AND cl.patient_id IN (?)
    ORDER BY dt, FIELD(kind, 'Proc', 'Adj', 'Pay', 'InsPay')`, [patientIds, patientIds, patientIds, patientIds], conn);
  let bal = 0;
  return rows.map((r) => { bal = round2(bal + Number(r.charge) - Number(r.credit)); return { ...r, balance: bal }; });
}

/** Balance figures for a patient and their family. */
export async function balances(patientId, conn) {
  const ids = await familyIds(patientId, conn);
  const calc = async (list) => {
    const r = await one(`SELECT
      (SELECT COALESCE(SUM(fee),0) FROM procedure_log WHERE status=2 AND patient_id IN (?)) +
      (SELECT COALESCE(SUM(amount),0) FROM adjustment WHERE patient_id IN (?)) -
      (SELECT COALESCE(SUM(amount),0) FROM pay_split WHERE patient_id IN (?)) -
      (SELECT COALESCE(SUM(ins_paid+write_off),0) FROM claim WHERE status='R' AND patient_id IN (?)) total,
      (SELECT COALESCE(SUM(cp.ins_est),0) FROM claim_proc cp WHERE cp.status='NotReceived' AND cp.patient_id IN (?)) ins_pending,
      (SELECT COALESCE(SUM(cp.write_off_est),0) FROM claim_proc cp WHERE cp.status='NotReceived' AND cp.patient_id IN (?)) wo_pending`,
      [list, list, list, list, list, list], conn);
    return { total: round2(r.total), insPending: round2(r.ins_pending), patPortion: round2(r.total - r.ins_pending - r.wo_pending) };
  };
  return { patient: await calc([patientId]), family: await calc(ids), familyIds: ids };
}

/** Aging buckets for each guarantor (based on charge dates, FIFO credits). */
export async function aging(conn) {
  const gs = await q('SELECT DISTINCT COALESCE(guarantor_id,id) g FROM patient', [], conn);
  const out = [];
  const now = Date.now();
  for (const { g } of gs) {
    const ids = await familyIds(g, conn);
    const rows = await ledger(ids, conn);
    let credits = rows.reduce((s, r) => s + Number(r.credit), 0);
    const b = { b0_30: 0, b31_60: 0, b61_90: 0, b90: 0 };
    for (const r of rows.filter((x) => Number(x.charge) > 0)) {
      let amt = Number(r.charge);
      const used = Math.min(amt, credits); amt -= used; credits -= used;
      if (amt <= 0) continue;
      const days = (now - new Date(r.dt).getTime()) / 86400000;
      if (days <= 30) b.b0_30 += amt; else if (days <= 60) b.b31_60 += amt; else if (days <= 90) b.b61_90 += amt; else b.b90 += amt;
    }
    const total = b.b0_30 + b.b31_60 + b.b61_90 + b.b90 - credits;
    if (Math.abs(total) > 0.004) {
      const p = await one('SELECT id, first_name, last_name FROM patient WHERE id=?', [g], conn);
      out.push({ guarantorId: g, name: `${p.last_name}, ${p.first_name}`, ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, round2(v)])), credit: round2(credits), total: round2(total) });
    }
  }
  return out.sort((a, b) => b.total - a.total);
}
