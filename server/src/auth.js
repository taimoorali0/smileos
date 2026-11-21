// Staff authentication: server-side sessions (revocable), lockout, two-factor (TOTP), idle timeout, audit.
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { one, q, context } from './db.js';
import { HttpError } from './http.js';
import { sha256, randomToken, encrypt, decrypt, newTotpSecret, verifyTotp, otpauthUrl, assertStrongPassword } from './security.js';

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

export const BCRYPT_COST = 12;
export const MAX_FAILED = 5;
export const LOCK_MINUTES = 15;
const ABSOLUTE_HOURS = 12;
export const COOKIE = 'smileos_sid';

const ip = (req) => req?.ip || req?.socket?.remoteAddress || null;

export async function securityPolicy() {
  const rows = await q("SELECT name, value FROM preference WHERE name IN ('SessionIdleMinutes','RequireMfa','PasswordMinLength')");
  const m = Object.fromEntries(rows.map((r) => [r.name, r.value]));
  return { idleMinutes: Math.max(1, Number(m.SessionIdleMinutes || 15)), requireMfa: m.RequireMfa === '1', minLength: Math.max(10, Number(m.PasswordMinLength || 10)) };
}

export async function audit(userId, permission, patientId, text, req) {
  await q('INSERT INTO audit_log (user_id, permission, patient_id, log_text, ip) VALUES (?,?,?,?,?)', [userId, permission, patientId || null, String(text).slice(0, 1000), ip(req) || context().ip || null]);
}
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

export function setSessionCookie(req, res, token) {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/', maxAge: ABSOLUTE_HOURS * 3600 * 1000 });
}

async function createSession(userId, req, mfaPending) {
  const token = randomToken(32);
  await q('INSERT INTO user_session (id, user_id, expires_at, ip, user_agent, mfa_pending) VALUES (?,?,DATE_ADD(NOW(), INTERVAL ? HOUR),?,?,?)',
    [sha256(token), userId, ABSOLUTE_HOURS, ip(req), String(req?.headers?.['user-agent'] || '').slice(0, 255), mfaPending ? 1 : 0]);
  return token;
}

async function userInfo(u) {
  const perms = (await q('SELECT permission FROM group_permission WHERE group_id=?', [u.group_id])).map((r) => r.permission);
  const pol = await securityPolicy();
  return {
    id: u.id, username: u.username, fullName: u.full_name, groupId: u.group_id, providerId: u.provider_id, permissions: perms,
    mustChangePassword: !!u.must_change_password, mfaEnabled: !!u.mfa_enabled, mustSetupMfa: pol.requireMfa && !u.mfa_enabled,
  };
}

/** Step 1: username + password. Returns a session token (MFA-pending if the user has two-factor on). */
export async function login(username, password, req) {
  const u = await one('SELECT * FROM app_user WHERE username=?', [String(username || '').trim()]);
  const generic = new HttpError(401, 'Wrong username or password');
  if (!u || u.is_hidden) {
    await bcrypt.compare(String(password || ''), DUMMY_HASH); // same timing as a real user
    await audit(null, 'LoginFailed', null, `Unknown or disabled user "${String(username).slice(0, 60)}"`, req);
    throw generic;
  }
  if (u.locked_until && new Date(u.locked_until.replace(' ', 'T')) > new Date()) {
    await audit(u.id, 'LoginFailed', null, 'Login attempt while locked', req);
    throw new HttpError(423, `Account locked after too many wrong passwords. Try again after ${LOCK_MINUTES} minutes or ask your administrator.`);
  }
  if (!(await bcrypt.compare(String(password || ''), u.password_hash))) {
    const n = u.failed_logins + 1;
    if (n >= MAX_FAILED) {
      await q('UPDATE app_user SET failed_logins=0, locked_until=DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id=?', [LOCK_MINUTES, u.id]);
      await audit(u.id, 'AccountLocked', null, `Locked after ${n} failed logins`, req);
      throw new HttpError(423, `Account locked after too many wrong passwords. Try again after ${LOCK_MINUTES} minutes or ask your administrator.`);
    }
    await q('UPDATE app_user SET failed_logins=? WHERE id=?', [n, u.id]);
    await audit(u.id, 'LoginFailed', null, `Wrong password (${n}/${MAX_FAILED})`, req);
    throw generic;
  }
  await q('UPDATE app_user SET failed_logins=0, locked_until=NULL WHERE id=?', [u.id]);
  const token = await createSession(u.id, req, !!u.mfa_enabled);
  if (u.mfa_enabled) { await audit(u.id, 'Login', null, 'Password accepted, waiting for two-factor code', req); return { token, mfaRequired: true }; }
  await q('UPDATE app_user SET last_login_at=NOW() WHERE id=?', [u.id]);
  await audit(u.id, 'Login', null, 'Signed in', req);
  return { token, user: await userInfo(u) };
}

/** Step 2: two-factor code for an MFA-pending session. */
export async function verifyMfa(req, code) {
  const s = req.session;
  if (!s?.mfa_pending) throw new HttpError(400, 'No two-factor check is waiting');
  const u = await one('SELECT * FROM app_user WHERE id=?', [s.user_id]);
  if (!u.mfa_secret || !verifyTotp(decrypt(u.mfa_secret), code)) {
    const n = u.failed_logins + 1;
    if (n >= MAX_FAILED) {
      await q('UPDATE app_user SET failed_logins=0, locked_until=DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id=?', [LOCK_MINUTES, u.id]);
      await q('DELETE FROM user_session WHERE id=?', [s.id]);
      await audit(u.id, 'AccountLocked', null, 'Locked after wrong two-factor codes', req);
      throw new HttpError(423, 'Too many wrong codes. Account locked for 15 minutes.');
    }
    await q('UPDATE app_user SET failed_logins=? WHERE id=?', [n, u.id]);
    await audit(u.id, 'LoginFailed', null, 'Wrong two-factor code', req);
    throw new HttpError(401, 'That code is not correct. Check the time on your phone and try again.');
  }
  await q('UPDATE user_session SET mfa_pending=0 WHERE id=?', [s.id]);
  await q('UPDATE app_user SET failed_logins=0, last_login_at=NOW() WHERE id=?', [u.id]);
  await audit(u.id, 'Login', null, 'Signed in with two-factor', req);
  return { user: await userInfo(u) };
}

/** Load the session from cookie or Bearer token; enforce idle and absolute timeouts and CSRF protection. */
export async function authMiddleware(req, _res, next) {
  try {
    const bearer = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    const token = bearer || req.cookies?.[COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in');
    // Cookie sessions must send the custom header on changes (blocks cross-site form posts)
    if (!bearer && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['x-smileos'] !== '1') throw new HttpError(403, 'Request blocked');
    const s = await one('SELECT * FROM user_session WHERE id=?', [sha256(token)]);
    if (!s) throw new HttpError(401, 'Your session has ended. Please sign in again.');
    const pol = await securityPolicy();
    const idleMs = Date.now() - new Date(s.last_seen_at.replace(' ', 'T')).getTime();
    if (new Date(s.expires_at.replace(' ', 'T')) < new Date() || idleMs > pol.idleMinutes * 60000) {
      await q('DELETE FROM user_session WHERE id=?', [s.id]);
      throw new HttpError(401, 'You were signed out after a period of inactivity. Please sign in again.');
    }
    req.session = s;
    context().ip = ip(req);
    if (s.mfa_pending) {
      if (req.path === '/auth/mfa' || req.path === '/auth/logout') return next();
      throw new HttpError(401, 'Enter your two-factor code');
    }
    if (idleMs > 30000 && req.headers['x-smileos-background'] !== '1') await q('UPDATE user_session SET last_seen_at=NOW() WHERE id=?', [s.id]);
    const u = await one('SELECT * FROM app_user WHERE id=? AND is_hidden=0', [s.user_id]);
    if (!u) throw new HttpError(401, 'User not found');
    const info = await userInfo(u);
    req.user = { ...info, permissions: new Set(info.permissions) };
    // Until the password is changed / two-factor set up, only the security endpoints are allowed
    if ((info.mustChangePassword || info.mustSetupMfa) && !req.path.startsWith('/auth/')) throw new HttpError(403, info.mustChangePassword ? 'Please change your password first' : 'Please set up two-factor sign-in first');
    next();
  } catch (e) {
    next(e.status ? e : new HttpError(401, 'Session expired, please sign in again'));
  }
}

/** Route guard: require a permission. */
export const need = (perm) => (req, _res, next) => {
  if (req.user.permissions.has(perm) || req.user.permissions.has('SecurityAdmin')) return next();
  next(new HttpError(403, `You do not have permission: ${perm}`));
};

export async function changePassword(req, current, next) {
  const u = await one('SELECT * FROM app_user WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(String(current || ''), u.password_hash))) throw new HttpError(400, 'Current password is not correct');
  if (current === next) throw new HttpError(400, 'Choose a new password that is different from the current one');
  const pol = await securityPolicy();
  assertStrongPassword(next, { username: u.username, minLength: pol.minLength });
  await q('UPDATE app_user SET password_hash=?, must_change_password=0, password_changed_at=NOW() WHERE id=?', [await bcrypt.hash(next, BCRYPT_COST), u.id]);
  await q('DELETE FROM user_session WHERE user_id=? AND id<>?', [u.id, req.session.id]);
  await audit(u.id, 'PasswordChanged', null, 'Password changed; other sessions signed out', req);
}

export async function mfaBegin(req) {
  const u = await one('SELECT * FROM app_user WHERE id=?', [req.user.id]);
  if (u.mfa_enabled) throw new HttpError(400, 'Two-factor is already on');
  const secret = newTotpSecret();
  await q('UPDATE app_user SET mfa_secret=? WHERE id=?', [encrypt(secret), u.id]);
  const title = (await one("SELECT value FROM preference WHERE name='PracticeTitle'"))?.value || 'SmileOS';
  const url = otpauthUrl(secret, u.username, `SmileOS ${title}`.slice(0, 60));
  return { secret, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) };
}
export async function mfaConfirm(req, code) {
  const u = await one('SELECT * FROM app_user WHERE id=?', [req.user.id]);
  if (!u.mfa_secret || !verifyTotp(decrypt(u.mfa_secret), code)) throw new HttpError(400, 'That code is not correct. Scan the QR code again and enter the 6-digit code.');
  await q('UPDATE app_user SET mfa_enabled=1 WHERE id=?', [u.id]);
  await audit(u.id, 'MfaEnabled', null, 'Two-factor sign-in turned on', req);
}
export async function mfaDisable(req, password) {
  const u = await one('SELECT * FROM app_user WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(String(password || ''), u.password_hash))) throw new HttpError(400, 'Password is not correct');
  if ((await securityPolicy()).requireMfa) throw new HttpError(400, 'Your clinic requires two-factor sign-in');
  await q('UPDATE app_user SET mfa_enabled=0, mfa_secret=NULL WHERE id=?', [u.id]);
  await audit(u.id, 'MfaDisabled', null, 'Two-factor sign-in turned off', req);
}


// ===== Self-service password reset by email =====
// The answer is always the same whether or not the account exists (no account discovery).
// Links are single-use, expire after 30 minutes, and only their hash is stored.
export const RESET_MINUTES = 30;
export async function requestPasswordReset(login, req, { sendEmail, linkFor }) {
  const key = String(login || '').trim();
  if (!key) return;
  const u = await one('SELECT * FROM app_user WHERE (username=? OR (email IS NOT NULL AND LOWER(email)=LOWER(?))) AND is_hidden=0 LIMIT 1', [key, key]);
  if (!u || !u.email) { await audit(u?.id || null, 'PasswordResetRequest', null, `Reset requested for "${key.slice(0, 60)}" – ${u ? 'no email on file' : 'unknown account'}`, req); return; }
  const recent = await one('SELECT COUNT(*) n FROM password_reset WHERE user_id=? AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)', [u.id]);
  if (recent.n >= 3) { await audit(u.id, 'PasswordResetRequest', null, 'Too many reset requests – ignored', req); return; }
  const token = randomToken(32);
  await q('INSERT INTO password_reset (id, user_id, expires_at, ip) VALUES (?,?,DATE_ADD(NOW(), INTERVAL ? MINUTE),?)', [sha256(token), u.id, RESET_MINUTES, ip(req)]);
  const link = await linkFor(token);
  await sendEmail({
    to: u.email, subject: 'Reset your SmileOS password', kind: 'password_reset',
    body: `Hello ${u.full_name},\n\nSomeone asked to reset the password for your SmileOS account "${u.username}".\nTo choose a new password, open this link within ${RESET_MINUTES} minutes:\n\n${link}\n\nIf this was not you, ignore this email and tell your clinic administrator. Your password has not changed.`,
  });
  await audit(u.id, 'PasswordResetRequest', null, 'Reset link emailed', req);
}
export async function completePasswordReset(token, next, req) {
  const r = await one('SELECT * FROM password_reset WHERE id=?', [sha256(String(token || ''))]);
  if (!r || r.used_at || new Date(r.expires_at.replace(' ', 'T')) < new Date()) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');
  const u = await one('SELECT * FROM app_user WHERE id=? AND is_hidden=0', [r.user_id]);
  if (!u) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');
  const pol = await securityPolicy();
  assertStrongPassword(next, { username: u.username, minLength: pol.minLength });
  if (await bcrypt.compare(String(next), u.password_hash)) throw new HttpError(400, 'Choose a password different from your old one');
  await q('UPDATE app_user SET password_hash=?, must_change_password=0, failed_logins=0, locked_until=NULL, password_changed_at=NOW() WHERE id=?', [await bcrypt.hash(next, BCRYPT_COST), u.id]);
  await q('UPDATE password_reset SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [u.id]);
  await q('DELETE FROM user_session WHERE user_id=?', [u.id]);
  await audit(u.id, 'PasswordChanged', null, 'Password reset with emailed link; all sessions signed out', req);
  return { username: u.username };
}
