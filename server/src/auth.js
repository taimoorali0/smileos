import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { one, q } from './db.js';
import { HttpError } from './http.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export const PERMISSIONS = [
  'AppointmentsModule', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentMove', 'AppointmentDelete', 'AppointmentComplete', 'ConfirmationStatusEdit', 'Blockouts',
  'FamilyModule', 'PatientEdit', 'InsPlanEdit',
  'ChartModule', 'ProcEdit', 'ProcComplete', 'ProcDelete', 'RxCreate', 'PerioEdit',
  'TreatPlanModule', 'TreatPlanEdit',
  'AccountModule', 'PaymentCreate', 'PaymentDelete', 'AdjustmentCreate', 'ClaimEdit', 'InsPayCreate', 'PaymentPlanEdit',
  'ImagingModule', 'ImageCreate', 'ImageDelete',
  'ManageModule', 'TimeCardEdit', 'SupplyEdit', 'Billing',
  'Reports', 'Setup', 'SecurityAdmin', 'AuditTrail',
];

export async function login(username, password) {
  const u = await one('SELECT * FROM app_user WHERE username=? AND is_hidden=0', [username]);
  if (!u || !(await bcrypt.compare(password, u.password_hash))) throw new HttpError(401, 'Wrong username or password');
  const perms = (await q('SELECT permission FROM group_permission WHERE group_id=?', [u.group_id])).map((r) => r.permission);
  const user = { id: u.id, username: u.username, fullName: u.full_name, groupId: u.group_id, providerId: u.provider_id, permissions: perms };
  return { token: jwt.sign({ uid: u.id }, SECRET, { expiresIn: '12h' }), user };
}

export async function authMiddleware(req, _res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : req.query.token;
    if (!token) throw new HttpError(401, 'Login required');
    const { uid } = jwt.verify(token, SECRET);
    const u = await one('SELECT id, username, full_name, group_id, provider_id FROM app_user WHERE id=? AND is_hidden=0', [uid]);
    if (!u) throw new HttpError(401, 'User not found');
    const perms = (await q('SELECT permission FROM group_permission WHERE group_id=?', [u.group_id])).map((r) => r.permission);
    req.user = { id: u.id, username: u.username, fullName: u.full_name, providerId: u.provider_id, permissions: new Set(perms) };
    next();
  } catch (e) {
    next(e.status ? e : new HttpError(401, 'Session expired, please log in again'));
  }
}

/** Route guard: require a permission. */
export const need = (perm) => (req, _res, next) => {
  if (req.user.permissions.has(perm) || req.user.permissions.has('SecurityAdmin')) return next();
  next(new HttpError(403, `You do not have permission: ${perm}`));
};

export async function audit(userId, permission, patientId, text) {
  await q('INSERT INTO audit_log (user_id, permission, patient_id, log_text) VALUES (?,?,?,?)', [userId, permission, patientId || null, String(text).slice(0, 1000)]);
}
