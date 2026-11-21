import { one } from '../db.js';

/** Resolve the fee for a code: patient fee schedule > provider fee schedule > default (preference). */
export async function feeFor(codeId, patientId, provId, conn) {
  const pat = patientId ? await one('SELECT fee_schedule_id FROM patient WHERE id=?', [patientId], conn) : null;
  const prov = provId ? await one('SELECT fee_schedule_id FROM provider WHERE id=?', [provId], conn) : null;
  const pref = await one("SELECT value FROM preference WHERE name='DefaultFeeSchedule'", [], conn);
  for (const fs of [pat?.fee_schedule_id, prov?.fee_schedule_id, pref ? Number(pref.value) : null]) {
    if (!fs) continue;
    const f = await one('SELECT amount FROM fee WHERE fee_schedule_id=? AND code_id=?', [fs, codeId], conn);
    if (f) return f.amount;
  }
  return 0;
}
