// Super admin API (/api/super): manage clinics. Separate accounts and sessions from clinic staff; two-factor is mandatory.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { h, bad, HttpError } from '../http.js';
import { poolFor, adminConnection } from '../db.js';
import { cq, provisionTenant, tenantStats, forgetTenant, tempPassword } from '../tenancy.js';
import { sha256, randomToken, encrypt, decrypt, newTotpSecret, verifyTotp, otpauthUrl, assertStrongPassword } from '../security.js';
import { BCRYPT_COST, MAX_FAILED, LOCK_MINUTES } from '../auth.js';

const r = Router();
const COOKIE = 'smileos_super';
const IDLE_MIN = 15;
const DUMMY = bcrypt.hashSync('dummy-password', BCRYPT_COST);
const log = (adminId, action, tenantId, detail, req) => cq('INSERT INTO super_audit (admin_id, action, tenant_id, detail, ip) VALUES (?,?,?,?,?)', [adminId, action, tenantId || null, String(detail || '').slice(0, 1000), req.ip]);

// Simple per-IP rate limit on login
const hits = new Map();
const limit = (req) => {
  const now = Date.now(); const arr = (hits.get(req.ip) || []).filter((t) => now - t < 15 * 60000); arr.push(now); hits.set(req.ip, arr);
  if (arr.length > 20) throw new HttpError(429, 'Too many attempts. Wait 15 minutes.');
};

r.post('/login', h(async (req, res) => {
  limit(req);
  const a = (await cq('SELECT * FROM super_admin WHERE email=?', [String(req.body.email || '').trim().toLowerCase()]))[0];
  if (!a || a.is_disabled) { await bcrypt.compare(String(req.body.password || ''), DUMMY); await log(null, 'LoginFailed', null, `Unknown ${String(req.body.email).slice(0, 80)}`, req); throw new HttpError(401, 'Wrong email or password'); }
  if (a.locked_until && new Date(a.locked_until.replace(' ', 'T')) > new Date()) throw new HttpError(423, `Account locked. Try again in ${LOCK_MINUTES} minutes.`);
  if (!(await bcrypt.compare(String(req.body.password || ''), a.password_hash))) {
    const n = a.failed_logins + 1;
    if (n >= MAX_FAILED) await cq('UPDATE super_admin SET failed_logins=0, locked_until=DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id=?', [LOCK_MINUTES, a.id]);
    else await cq('UPDATE super_admin SET failed_logins=? WHERE id=?', [n, a.id]);
    await log(a.id, 'LoginFailed', null, 'Wrong password', req);
    throw new HttpError(401, 'Wrong email or password');
  }
  await cq('UPDATE super_admin SET failed_logins=0, locked_until=NULL WHERE id=?', [a.id]);
  const token = randomToken(32);
  await cq('INSERT INTO super_session (id, admin_id, expires_at, ip, user_agent, mfa_pending) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 8 HOUR),?,?,1)', [sha256(token), a.id, req.ip, String(req.headers['user-agent'] || '').slice(0, 255)]);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/', maxAge: 8 * 3600 * 1000 });
  await log(a.id, 'Login', null, 'Password accepted', req);
  // Two-factor is required for super admins: either enter a code, or set it up now
  if (a.mfa_enabled) return { token, mfaRequired: true };
  const secret = newTotpSecret();
  await cq('UPDATE super_admin SET mfa_secret=? WHERE id=?', [encrypt(secret), a.id]);
  return { token, mfaSetup: true, secret, qr: await QRCode.toDataURL(otpauthUrl(secret, a.email, 'SmileOS Super Admin'), { margin: 1, width: 220 }) };
}));

// Session check for everything below
r.use(h(async (req, _res, next) => {
  const bearer = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  const token = bearer || req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Please sign in');
  if (!bearer && !['GET', 'HEAD'].includes(req.method) && req.headers['x-smileos'] !== '1') throw new HttpError(403, 'Request blocked');
  const s = (await cq('SELECT * FROM super_session WHERE id=?', [sha256(token)]))[0];
  if (!s || new Date(s.expires_at.replace(' ', 'T')) < new Date() || Date.now() - new Date(s.last_seen_at.replace(' ', 'T')).getTime() > IDLE_MIN * 60000) {
    if (s) await cq('DELETE FROM super_session WHERE id=?', [s.id]);
    throw new HttpError(401, 'Your session has ended. Please sign in again.');
  }
  req.superSession = s;
  if (s.mfa_pending && !['/mfa', '/logout'].includes(req.path)) throw new HttpError(401, 'Enter your two-factor code');
  await cq('UPDATE super_session SET last_seen_at=NOW() WHERE id=?', [s.id]);
  req.admin = (await cq('SELECT id, email, full_name, mfa_enabled FROM super_admin WHERE id=?', [s.admin_id]))[0];
  next();
}));

r.post('/mfa', h(async (req) => {
  const a = (await cq('SELECT * FROM super_admin WHERE id=?', [req.superSession.admin_id]))[0];
  if (!a.mfa_secret || !verifyTotp(decrypt(a.mfa_secret), req.body.code)) {
    await log(a.id, 'LoginFailed', null, 'Wrong two-factor code', req);
    throw new HttpError(401, 'That code is not correct');
  }
  await cq('UPDATE super_admin SET mfa_enabled=1, last_login_at=NOW() WHERE id=?', [a.id]);
  await cq('UPDATE super_session SET mfa_pending=0 WHERE id=?', [req.superSession.id]);
  await log(a.id, 'Login', null, a.mfa_enabled ? 'Signed in with two-factor' : 'Two-factor set up and signed in', req);
  return { ok: true };
}));
r.post('/logout', h(async (req, res) => { await cq('DELETE FROM super_session WHERE id=?', [req.superSession.id]); res.clearCookie(COOKIE, { path: '/' }); return { ok: true }; }));
r.get('/me', h(async (req) => req.admin));

r.get('/tenants', h(async () => {
  const ts = await cq("SELECT * FROM tenant WHERE status<>'deleted' ORDER BY created_at DESC");
  return Promise.all(ts.map(async (t) => ({ ...t, db_name: undefined, stats: await tenantStats(t) })));
}));
r.post('/tenants', h(async (req) => {
  const out = await provisionTenant(req.body);
  await log(req.admin.id, 'TenantCreated', out.id, `${out.slug} (${req.body.name})`, req);
  const base = process.env.BASE_DOMAIN;
  return { ...out, dbName: undefined, url: base ? `https://${base}/?clinic=${out.slug}` : `http://localhost:${process.env.PORT || 4000}/?clinic=${out.slug}` };
}));
r.put('/tenants/:id', h(async (req) => {
  const t = (await cq('SELECT * FROM tenant WHERE id=?', [req.params.id]))[0];
  if (!t) throw bad('Clinic not found');
  const b = req.body;
  const status = ['active', 'suspended'].includes(b.status) ? b.status : t.status;
  await cq('UPDATE tenant SET name=?, status=?, admin_email=?, phone=?, address=?, plan=?, note=? WHERE id=?',
    [b.name ?? t.name, status, b.admin_email ?? t.admin_email, b.phone ?? t.phone, b.address ?? t.address, b.plan ?? t.plan, b.note ?? t.note, t.id]);
  if (status === 'suspended') await poolFor(t.db_name).query('DELETE FROM user_session');
  forgetTenant(t.slug);
  await log(req.admin.id, status !== t.status ? (status === 'active' ? 'TenantActivated' : 'TenantSuspended') : 'TenantEdited', t.id, t.slug, req);
  return { ok: true };
}));
// Reset (or create) the clinic's admin login: returns a one-time temporary password
r.post('/tenants/:id/reset-admin', h(async (req) => {
  const t = (await cq('SELECT * FROM tenant WHERE id=?', [req.params.id]))[0];
  if (!t) throw bad('Clinic not found');
  const username = String(req.body.username || 'admin').trim();
  const pw = tempPassword();
  const p = poolFor(t.db_name);
  const [[u]] = await p.query('SELECT id FROM app_user WHERE username=?', [username]);
  const hash = await bcrypt.hash(pw, BCRYPT_COST);
  if (u) {
    await p.query('UPDATE app_user SET password_hash=?, must_change_password=1, failed_logins=0, locked_until=NULL, is_hidden=0 WHERE id=?', [hash, u.id]);
    if (req.body.resetMfa) await p.query('UPDATE app_user SET mfa_enabled=0, mfa_secret=NULL WHERE id=?', [u.id]);
    await p.query('DELETE FROM user_session WHERE user_id=?', [u.id]);
  } else {
    const [[g]] = await p.query("SELECT id FROM user_group WHERE name='Admin'");
    await p.query('INSERT INTO app_user (username, full_name, password_hash, group_id, must_change_password) VALUES (?,?,?,?,1)', [username, 'Clinic Administrator', hash, g.id]);
  }
  await p.query('INSERT INTO audit_log (permission, log_text, ip) VALUES (?,?,?)', ['SecurityAdmin', `Password for ${username} reset by SmileOS administrator`, req.ip]);
  await log(req.admin.id, 'AdminReset', t.id, `${t.slug}: ${username}${req.body.resetMfa ? ' (+two-factor reset)' : ''}`, req);
  return { username, tempPassword: pw };
}));
r.delete('/tenants/:id', h(async (req) => {
  const t = (await cq('SELECT * FROM tenant WHERE id=?', [req.params.id]))[0];
  if (!t) throw bad('Clinic not found');
  if (req.body.confirm !== t.slug) throw bad(`Type the clinic address "${t.slug}" to confirm`);
  await cq("UPDATE tenant SET status='deleted' WHERE id=?", [t.id]);
  if (req.body.dropData) {
    const c = await adminConnection(); await c.query(`DROP DATABASE IF EXISTS \`${t.db_name}\``); await c.end();
  } else await poolFor(t.db_name).query('DELETE FROM user_session');
  forgetTenant(t.slug);
  await log(req.admin.id, 'TenantDeleted', t.id, `${t.slug}${req.body.dropData ? ' (data erased)' : ' (data kept)'}`, req);
  return { ok: true };
}));
r.get('/audit', h(async () => cq(`SELECT a.*, s.email, t.slug FROM super_audit a LEFT JOIN super_admin s ON s.id=a.admin_id LEFT JOIN tenant t ON t.id=a.tenant_id ORDER BY a.id DESC LIMIT 300`)));
r.post('/password', h(async (req) => {
  const a = (await cq('SELECT * FROM super_admin WHERE id=?', [req.admin.id]))[0];
  if (!(await bcrypt.compare(String(req.body.current || ''), a.password_hash))) throw bad('Current password is not correct');
  assertStrongPassword(req.body.next, { username: a.email.split('@')[0], minLength: 12 });
  await cq('UPDATE super_admin SET password_hash=? WHERE id=?', [await bcrypt.hash(req.body.next, BCRYPT_COST), a.id]);
  await cq('DELETE FROM super_session WHERE admin_id=? AND id<>?', [a.id, req.superSession.id]);
  await log(a.id, 'PasswordChanged', null, '', req);
  return { ok: true };
}));
export default r;
