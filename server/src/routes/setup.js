import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q, one } from '../db.js';
import { h, bad } from '../http.js';
import { need, audit, PERMISSIONS } from '../auth.js';
import { crud } from './crud.js';

const r = Router();
r.use('/clinics', crud('clinic', ['name', 'phone', 'address', 'is_hidden'], { order: 'name' }));
r.use('/providers', crud('provider', ['abbr', 'first_name', 'last_name', 'is_hygienist', 'color', 'fee_schedule_id', 'is_hidden'], { order: 'is_hidden, abbr' }));
r.use('/operatories', crud('operatory', ['clinic_id', 'name', 'abbr', 'provider_id', 'hygienist_id', 'is_hygiene', 'item_order', 'is_hidden'], { order: 'item_order, id' }));
r.use('/fee-schedules', crud('fee_schedule', ['name'], { order: 'id' }));
r.use('/appt-types', crud('appt_type', ['name', 'color', 'minutes', 'code_ids', 'is_hidden'], { order: 'name' }));
r.use('/carriers', crud('carrier', ['name', 'phone', 'address', 'payer_id'], { order: 'name', perm: 'InsPlanEdit' }));
r.use('/referrals', crud('referral', ['name', 'is_doctor', 'specialty', 'phone', 'email'], { order: 'name', perm: 'PatientEdit' }));
r.use('/supplies', crud('supply', ['name', 'category', 'supplier', 'qty_on_hand', 'qty_min', 'price'], { order: 'category, name', perm: 'SupplyEdit' }));
r.use('/definitions', crud('definition', ['category', 'name', 'abbr', 'color', 'item_order', 'is_hidden'], { order: 'category, item_order, id' }));

// Procedure codes with fee for a given schedule
r.get('/codes', h(async (req) => {
  const fs = Number(req.query.feeSchedule) || Number((await one("SELECT value FROM preference WHERE name='DefaultFeeSchedule'"))?.value) || 1;
  return q(`SELECT c.*, f.amount fee FROM procedure_code c LEFT JOIN fee f ON f.code_id=c.id AND f.fee_schedule_id=? ORDER BY c.code`, [fs]);
}));
r.post('/codes', need('Setup'), h(async (req) => {
  const b = req.body;
  if (!b.code || !b.descript) throw bad('Code and description are required');
  const res = await q(`INSERT INTO procedure_code (code, descript, abbr, category, treat_area, minutes, is_recall, paint_color) VALUES (?,?,?,?,?,?,?,?)`,
    [b.code, b.descript, b.abbr || null, b.category || 'Other', b.treat_area || 'Mouth', b.minutes || 30, b.is_recall ? 1 : 0, b.paint_color || null]);
  return { id: res.insertId };
}));
r.put('/codes/:id', need('Setup'), h(async (req) => {
  const b = req.body;
  await q(`UPDATE procedure_code SET descript=?, abbr=?, category=?, treat_area=?, minutes=?, is_recall=?, paint_color=? WHERE id=?`,
    [b.descript, b.abbr || null, b.category, b.treat_area, b.minutes, b.is_recall ? 1 : 0, b.paint_color || null, req.params.id]);
  return { ok: true };
}));
r.put('/fees', need('Setup'), h(async (req) => {
  const { fee_schedule_id, code_id, amount } = req.body;
  await q('INSERT INTO fee (fee_schedule_id, code_id, amount) VALUES (?,?,?) ON DUPLICATE KEY UPDATE amount=VALUES(amount)', [fee_schedule_id, code_id, amount]);
  return { ok: true };
}));
// Fee Tools: copy schedule, increase by %, round
r.post('/fee-tools', need('Setup'), h(async (req) => {
  const { action, from_id, to_id, percent = 0, round_to = 0 } = req.body;
  if (action === 'copy') {
    await q('DELETE FROM fee WHERE fee_schedule_id=?', [to_id]);
    await q('INSERT INTO fee (fee_schedule_id, code_id, amount) SELECT ?, code_id, amount FROM fee WHERE fee_schedule_id=?', [to_id, from_id]);
  } else if (action === 'increase') {
    const rnd = Number(round_to) || 0.01;
    await q('UPDATE fee SET amount = ROUND(amount * (1 + ?/100) / ?) * ? WHERE fee_schedule_id=?', [percent, rnd, rnd, to_id]);
  } else throw bad('Unknown action');
  await audit(req.user.id, 'Setup', null, `Fee tools: ${action} on schedule ${to_id}`);
  return { ok: true };
}));

// Preferences
r.get('/preferences', h(async () => Object.fromEntries((await q('SELECT * FROM preference')).map((p) => [p.name, p.value]))));
r.put('/preferences', need('Setup'), h(async (req) => {
  for (const [k, v] of Object.entries(req.body)) await q('INSERT INTO preference (name, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)', [k, String(v)]);
  return { ok: true };
}));

// Security: users and groups
r.get('/permissions', h(async () => PERMISSIONS));
r.get('/groups', need('SecurityAdmin'), h(async () => {
  const gs = await q('SELECT * FROM user_group ORDER BY name');
  for (const g of gs) g.permissions = (await q('SELECT permission FROM group_permission WHERE group_id=?', [g.id])).map((x) => x.permission);
  return gs;
}));
r.post('/groups', need('SecurityAdmin'), h(async (req) => ({ id: (await q('INSERT INTO user_group (name) VALUES (?)', [req.body.name])).insertId })));
r.put('/groups/:id/permissions', need('SecurityAdmin'), h(async (req) => {
  await q('DELETE FROM group_permission WHERE group_id=?', [req.params.id]);
  for (const p of req.body.permissions || []) if (PERMISSIONS.includes(p)) await q('INSERT INTO group_permission VALUES (?,?)', [req.params.id, p]);
  await audit(req.user.id, 'SecurityAdmin', null, `Permissions changed for group ${req.params.id}`);
  return { ok: true };
}));
r.get('/users', need('SecurityAdmin'), h(async () => q('SELECT u.id, u.username, u.full_name, u.group_id, u.provider_id, u.is_hidden, g.name group_name FROM app_user u JOIN user_group g ON g.id=u.group_id ORDER BY u.username')));
r.post('/users', need('SecurityAdmin'), h(async (req) => {
  const { username, full_name, password, group_id, provider_id } = req.body;
  if (!username || !password || password.length < 8) throw bad('Username and a password of 8+ characters are required');
  const res = await q('INSERT INTO app_user (username, full_name, password_hash, group_id, provider_id) VALUES (?,?,?,?,?)',
    [username, full_name || username, await bcrypt.hash(password, 10), group_id, provider_id || null]);
  await audit(req.user.id, 'SecurityAdmin', null, `User ${username} created`);
  return { id: res.insertId };
}));
r.put('/users/:id', need('SecurityAdmin'), h(async (req) => {
  const { full_name, group_id, provider_id, is_hidden, password } = req.body;
  await q('UPDATE app_user SET full_name=?, group_id=?, provider_id=?, is_hidden=? WHERE id=?', [full_name, group_id, provider_id || null, is_hidden ? 1 : 0, req.params.id]);
  if (password) {
    if (password.length < 8) throw bad('Password must be 8+ characters');
    await q('UPDATE app_user SET password_hash=? WHERE id=?', [await bcrypt.hash(password, 10), req.params.id]);
  }
  return { ok: true };
}));
r.get('/audit', need('AuditTrail'), h(async (req) => q(`SELECT a.*, u.username, CONCAT(p.last_name, ', ', p.first_name) patient FROM audit_log a
  LEFT JOIN app_user u ON u.id=a.user_id LEFT JOIN patient p ON p.id=a.patient_id
  WHERE (? IS NULL OR a.patient_id=?) ORDER BY a.id DESC LIMIT 500`, [req.query.patientId || null, req.query.patientId || null])));

// Provider schedules
r.get('/schedules', h(async () => q('SELECT * FROM provider_schedule ORDER BY prov_id, weekday, start_time')));
r.put('/schedules/:provId', need('Setup'), h(async (req) => {
  await q('DELETE FROM provider_schedule WHERE prov_id=?', [req.params.provId]);
  for (const s of req.body.rows || []) await q('INSERT INTO provider_schedule (prov_id, weekday, start_time, stop_time) VALUES (?,?,?,?)', [req.params.provId, s.weekday, s.start_time, s.stop_time]);
  return { ok: true };
}));
export default r;
