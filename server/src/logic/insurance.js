import { q, one } from '../db.js';
import { round2 } from '../http.js';

const NO_DEDUCTIBLE = ['Diagnostic', 'Preventive'];

/** Primary (or given ordinal) plan details for a patient. */
export async function patPlan(patientId, ordinal = 1, conn) {
  return one(`SELECT pp.id pat_plan_id, pp.ordinal, ip.*, c.name carrier_name
    FROM pat_plan pp JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier c ON c.id=ip.carrier_id
    WHERE pp.patient_id=? AND pp.ordinal=?`, [patientId, ordinal], conn);
}

/** Benefits used this calendar year (paid + pending estimates), and deductible used. */
export async function yearUsage(patPlanId, excludeProcIds = [], conn) {
  const year = new Date().getFullYear();
  const ex = excludeProcIds.length ? excludeProcIds : [0];
  const r = await one(`SELECT
      COALESCE(SUM(CASE WHEN cp.status='Received' THEN cp.ins_paid WHEN cp.status='NotReceived' THEN cp.ins_est ELSE 0 END),0) used,
      COALESCE(SUM(CASE WHEN cp.status IN ('Received','NotReceived') THEN cp.ded_applied ELSE 0 END),0) ded_used
    FROM claim_proc cp JOIN procedure_log p ON p.id=cp.proc_id
    WHERE cp.pat_plan_id=? AND YEAR(p.proc_date)=? AND cp.proc_id NOT IN (?)`, [patPlanId, year, ex], conn);
  return r;
}

/**
 * Estimate insurance for a list of procedures (in order), applying deductible and annual max.
 * Returns map procId -> { insEst, writeOffEst, dedApplied, patPortion }
 */
export async function estimate(patientId, procs, conn) {
  const out = {};
  const plan = await patPlan(patientId, 1, conn);
  if (!plan) {
    for (const p of procs) out[p.id] = { insEst: 0, writeOffEst: 0, dedApplied: 0, patPortion: round2(p.fee) };
    return { plan: null, est: out };
  }
  const benefits = Object.fromEntries((await q('SELECT category, percent FROM benefit WHERE plan_id=?', [plan.id], conn)).map((b) => [b.category, b.percent]));
  const usage = await yearUsage(plan.pat_plan_id, procs.map((p) => p.id), conn);
  let maxLeft = Math.max(0, plan.annual_max - usage.used);
  let dedLeft = Math.max(0, plan.deductible - usage.ded_used);
  for (const p of procs) {
    let allowed = Number(p.fee);
    if (plan.plan_type === 'PPO' && plan.fee_schedule_id) {
      const f = await one('SELECT amount FROM fee WHERE fee_schedule_id=? AND code_id=?', [plan.fee_schedule_id, p.code_id], conn);
      if (f) allowed = Math.min(allowed, f.amount);
    }
    const writeOffEst = round2(Number(p.fee) - allowed);
    const pct = benefits[p.category] ?? 0;
    let ded = 0;
    if (!NO_DEDUCTIBLE.includes(p.category) && pct > 0) { ded = Math.min(dedLeft, allowed); dedLeft -= ded; }
    let ins = round2((allowed - ded) * pct / 100);
    ins = Math.min(ins, maxLeft); maxLeft = round2(maxLeft - ins);
    out[p.id] = { insEst: round2(ins), writeOffEst, dedApplied: round2(ded), patPortion: round2(Number(p.fee) - writeOffEst - ins) };
  }
  return { plan, est: out };
}
