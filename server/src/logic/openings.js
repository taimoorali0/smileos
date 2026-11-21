import { q } from '../db.js';

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Find free slots. perDay: how many slots to return per day (1 = first opening only).
 * Respects provider schedules, existing appointments and no-schedule blockouts.
 */
export async function findOpenings({ after, minutes = 30, provIds = [], opIds = [], maxDays = 60, maxResults = 10, perDay = 1, step = 10, notBeforeNow = true }) {
  const out = [];
  const d = new Date(`${after}T00:00:00`);
  const ops = (await q('SELECT * FROM operatory WHERE is_hidden=0 ORDER BY item_order')).filter((o) => !opIds.length || opIds.includes(o.id));
  const scheds = await q('SELECT * FROM provider_schedule');
  const now = new Date();
  for (let i = 0; i < maxDays && out.length < maxResults; i++, d.setDate(d.getDate() + 1)) {
    const ds = localDate(d);
    const wd = d.getDay();
    const appts = await q('SELECT op_id, apt_datetime, minutes FROM appointment WHERE DATE(apt_datetime)=? AND apt_status IN (1,2)', [ds]);
    const blocks = await q('SELECT op_id, start_dt, stop_dt FROM blockout WHERE DATE(start_dt)=? AND no_schedule=1', [ds]);
    const today = ds === localDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let dayCount = 0;
    const seen = new Set();
    for (const op of ops) {
      const pid = op.is_hygiene ? op.hygienist_id : op.provider_id;
      if (provIds.length && !provIds.includes(pid)) continue;
      const busy = [...appts.filter((a) => a.op_id === op.id).map((a) => [toMin(a.apt_datetime.slice(11)), toMin(a.apt_datetime.slice(11)) + a.minutes]),
        ...blocks.filter((b) => b.op_id === op.id).map((b) => [toMin(b.start_dt.slice(11)), toMin(b.stop_dt.slice(11))])];
      for (const s of scheds.filter((x) => x.prov_id === pid && x.weekday === wd)) {
        for (let m = toMin(s.start_time); m + minutes <= toMin(s.stop_time); m += step) {
          if (notBeforeNow && today && m <= nowMin) continue;
          if (busy.some(([a, b]) => m < b && m + minutes > a)) continue;
          const key = `${m}`;
          if (perDay > 1 && seen.has(key)) continue;
          seen.add(key);
          out.push({ date: ds, time: hhmm(m), op_id: op.id, op: op.name, prov_id: pid });
          dayCount++;
          if (dayCount >= perDay || out.length >= maxResults) break;
        }
        if (dayCount >= perDay || out.length >= maxResults) break;
      }
      if (dayCount >= perDay || out.length >= maxResults) break;
    }
  }
  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}
