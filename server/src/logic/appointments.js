import { q, one } from '../db.js';
import { HttpError, today } from '../http.js';
import { estimate, patPlan } from './insurance.js';

export const APT = { Scheduled: 1, Complete: 2, UnschedList: 3, Broken: 5, Planned: 6 };

/** Throw if the appointment would overlap another in the same operatory, or a no-schedule blockout. */
export async function checkOverlap({ id, op_id, apt_datetime, minutes }, conn) {
  if (!op_id || !apt_datetime) return;
  const clash = await one(`SELECT a.id, p.first_name, p.last_name FROM appointment a JOIN patient p ON p.id=a.patient_id
    WHERE a.op_id=? AND a.apt_status IN (1,2) AND a.id<>? AND a.apt_datetime < DATE_ADD(?, INTERVAL ? MINUTE)
      AND DATE_ADD(a.apt_datetime, INTERVAL a.minutes MINUTE) > ?`, [op_id, id || 0, apt_datetime, minutes, apt_datetime], conn);
  const allow = await one("SELECT value FROM preference WHERE name='AllowOverlap'", [], conn);
  if (clash && allow?.value !== '1') throw new HttpError(409, `Overlaps with ${clash.first_name} ${clash.last_name}'s appointment`);
  const bo = await one(`SELECT b.id, b.note FROM blockout b WHERE b.op_id=? AND b.no_schedule=1 AND b.start_dt < DATE_ADD(?, INTERVAL ? MINUTE) AND b.stop_dt > ?`,
    [op_id, apt_datetime, minutes, apt_datetime], conn);
  if (bo) throw new HttpError(409, `Time is blocked: ${bo.note || 'blockout'}`);
}

/** Complete an appointment: complete procs, create claims, update recall. Must run in a transaction. */
export async function completeAppointment(aptId, userId, conn) {
  const apt = await one('SELECT * FROM appointment WHERE id=? FOR UPDATE', [aptId], conn);
  if (!apt) throw new HttpError(404, 'Appointment not found');
  if (apt.apt_status === APT.Complete) return apt;
  const date = (apt.apt_datetime || today()).slice(0, 10);
  if (date > today()) throw new HttpError(400, 'Cannot complete a future appointment');
  await q('UPDATE procedure_log SET status=2, proc_date=? WHERE apt_id=? AND status=1', [date, aptId], conn);
  await q('UPDATE appointment SET apt_status=2 WHERE id=?', [aptId], conn);
  await q('UPDATE patient SET date_first_visit=COALESCE(date_first_visit, ?) WHERE id=?', [date, apt.patient_id], conn);

  const procs = await q(`SELECT p.*, c.category, c.is_recall FROM procedure_log p JOIN procedure_code c ON c.id=p.code_id
    WHERE p.apt_id=? AND p.status=2`, [aptId], conn);
  // Claims for primary/secondary insurance
  for (const ord of [1, 2]) {
    const plan = await patPlan(apt.patient_id, ord, conn);
    if (!plan || !procs.length) continue;
    const { est } = ord === 1 ? await estimate(apt.patient_id, procs, conn) : { est: {} };
    const fee = procs.reduce((s, p) => s + Number(p.fee), 0);
    const insEst = procs.reduce((s, p) => s + (est[p.id]?.insEst || 0), 0);
    const r = await q(`INSERT INTO claim (patient_id, pat_plan_id, claim_type, status, date_service, claim_fee, ins_est) VALUES (?,?,?,?,?,?,?)`,
      [apt.patient_id, plan.pat_plan_id, ord === 1 ? 'P' : 'S', 'W', date, fee, insEst], conn);
    for (const p of procs) {
      const e = est[p.id] || { insEst: 0, writeOffEst: 0, dedApplied: 0 };
      await q(`INSERT INTO claim_proc (claim_id, proc_id, patient_id, pat_plan_id, status, fee_billed, ins_est, write_off_est, ded_applied) VALUES (?,?,?,?,?,?,?,?,?)`,
        [r.insertId, p.id, apt.patient_id, plan.pat_plan_id, 'NotReceived', p.fee, e.insEst, e.writeOffEst, e.dedApplied], conn);
    }
  }
  // Recall
  if (procs.some((p) => p.is_recall)) {
    const types = procs.some((p) => p.category === 'Perio') ? ['Perio'] : ['Prophy'];
    for (const t of types) {
      await q(`INSERT INTO recall (patient_id, recall_type, interval_months, date_previous, date_due) VALUES (?,?,6,?,DATE_ADD(?, INTERVAL 6 MONTH))
        ON DUPLICATE KEY UPDATE date_previous=VALUES(date_previous), date_due=DATE_ADD(VALUES(date_previous), INTERVAL interval_months MONTH), reminders_sent=0, status_id=NULL`,
        [apt.patient_id, t, date, date], conn);
    }
  }
  // Planned appointment done when its scheduled copy completes
  await q('UPDATE appointment SET apt_status=2 WHERE next_apt_id=? AND apt_status=6', [aptId], conn);
  return apt;
}
