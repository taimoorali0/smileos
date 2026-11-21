// Security tests (single clinic mode). Run after: npm run seed
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';
import { pool, q } from '../src/db.js';
import { totp } from '../src/security.js';

let server, base, adminToken;
const call = async (method, url, body, token, headers = {}) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data, headers: r.headers };
};
before(async () => {
  server = app.listen(0); base = `http://localhost:${server.address().port}/api`;
  adminToken = (await call('POST', '/auth/login', { username: 'admin', password: 'smileos123' })).data.token;
});
after(async () => { server.close(); await pool.end(); });

test('security headers and no caching of API data', async () => {
  const r = await call('GET', '/auth/me', null, adminToken);
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('account locks after 5 wrong passwords and admin can unlock', async () => {
  for (let i = 0; i < 4; i++) assert.equal((await call('POST', '/auth/login', { username: 'billing', password: 'wrong' })).status, 401);
  assert.equal((await call('POST', '/auth/login', { username: 'billing', password: 'wrong' })).status, 423);
  assert.equal((await call('POST', '/auth/login', { username: 'billing', password: 'smileos123' })).status, 423, 'correct password refused while locked');
  const u = (await call('GET', '/setup/users', null, adminToken)).data.find((x) => x.username === 'billing');
  await call('POST', `/setup/users/${u.id}/unlock`, {}, adminToken);
  assert.equal((await call('POST', '/auth/login', { username: 'billing', password: 'smileos123' })).status, 200);
  const log = (await call('GET', '/setup/audit', null, adminToken)).data;
  assert.ok(log.some((l) => l.permission === 'AccountLocked'));
});

test('new staff must change temporary password; weak passwords are refused', async () => {
  const groups = (await call('GET', '/setup/groups', null, adminToken)).data;
  const created = await call('POST', '/setup/users', { username: `nurse${Date.now() % 100000}`, full_name: 'Test Nurse', group_id: groups.find((g) => g.name === 'Hygienist').id }, adminToken);
  assert.equal(created.status, 200);
  const users = (await call('GET', '/setup/users', null, adminToken)).data;
  const u = users.find((x) => x.full_name === 'Test Nurse');
  const t = (await call('POST', '/auth/login', { username: u.username, password: created.data.tempPassword })).data.token;
  assert.equal((await call('GET', '/patients?search=a', null, t)).status, 403, 'blocked until password changed');
  assert.equal((await call('POST', '/auth/password', { current: created.data.tempPassword, next: 'password1' }, t)).status, 400);
  assert.equal((await call('POST', '/auth/password', { current: created.data.tempPassword, next: 'Tooth&Smile-2026' }, t)).status, 200);
  assert.equal((await call('GET', '/patients?search=a', null, t)).status, 200);
});

test('two-factor sign-in with an authenticator code', async () => {
  const t = (await call('POST', '/auth/login', { username: 'drkhan', password: 'smileos123' })).data.token;
  const setup = await call('POST', '/auth/mfa/setup', {}, t);
  assert.match(setup.data.qr, /^data:image\/png;base64,/);
  assert.equal((await call('POST', '/auth/mfa/confirm', { code: '000000' }, t)).status, 400);
  assert.equal((await call('POST', '/auth/mfa/confirm', { code: totp(setup.data.secret) }, t)).status, 200);
  const step1 = await call('POST', '/auth/login', { username: 'drkhan', password: 'smileos123' });
  assert.equal(step1.data.mfaRequired, true);
  assert.equal((await call('GET', '/patients', null, step1.data.token)).status, 401, 'no access before code');
  assert.equal((await call('POST', '/auth/mfa', { code: '123456' }, step1.data.token)).status, 401);
  assert.equal((await call('POST', '/auth/mfa', { code: totp(setup.data.secret) }, step1.data.token)).status, 200);
  assert.equal((await call('GET', '/patients', null, step1.data.token)).status, 200);
  // secret is stored encrypted
  const row = (await q("SELECT mfa_secret FROM app_user WHERE username='drkhan'"))[0];
  assert.ok(row.mfa_secret.startsWith('v1:') && !row.mfa_secret.includes(setup.data.secret));
  await q("UPDATE app_user SET mfa_enabled=0, mfa_secret=NULL WHERE username='drkhan'");
});

test('cookie sessions need the app header on changes (CSRF), idle sessions expire, logout ends session', async () => {
  const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'frontdesk', password: 'smileos123' }) });
  const cookie = login.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Strict/i);
  const c = cookie.split(';')[0];
  assert.equal((await fetch(base + '/auth/me', { headers: { cookie: c } })).status, 200);
  assert.equal((await fetch(base + '/manage/tasks', { method: 'POST', headers: { cookie: c, 'content-type': 'application/json' }, body: '{"descript":"x"}' })).status, 403);
  assert.equal((await fetch(base + '/manage/tasks', { method: 'POST', headers: { cookie: c, 'content-type': 'application/json', 'x-smileos': '1' }, body: '{"descript":"csrf ok"}' })).status, 200);
  const { token } = await login.json();
  await q('UPDATE user_session SET last_seen_at=DATE_SUB(NOW(), INTERVAL 20 MINUTE) WHERE id=SHA2(?, 256)', [token]);
  assert.equal((await fetch(base + '/auth/me', { headers: { cookie: c } })).status, 401, 'idle timeout');
  const t2 = (await call('POST', '/auth/login', { username: 'frontdesk', password: 'smileos123' })).data.token;
  await call('POST', '/auth/logout', {}, t2);
  assert.equal((await call('GET', '/auth/me', null, t2)).status, 401);
});

test('share links with QR codes, invite and online registration', async () => {
  const s = await call('GET', '/integrations/share-links', null, adminToken);
  assert.match(s.data.register.url, /\/register$/);
  assert.match(s.data.book.qr, /^data:image\/png/);
  const inv = await call('POST', '/integrations/invite', { kind: 'register', channel: 'sms', to: '555-444-1111', name: 'Sam Lee' }, adminToken);
  assert.equal(inv.data.status, 'test');
  const reg = await call('POST', '/public/register', { first_name: 'Sam', last_name: 'Lee', birthdate: '1992-02-02', phone: '555-444-1111', allergies: 'Latex', consent: true });
  assert.equal(reg.status, 200);
  const found = (await call('GET', '/patients?search=Sam Lee', null, adminToken)).data;
  assert.equal(found.length, 1);
});

test('forgot password: same answer for any account, emailed one-time link, strong new password', async () => {
  const groups = (await call('GET', '/setup/groups', null, adminToken)).data;
  const uname = `reset${Date.now() % 100000}`;
  await call('POST', '/setup/users', { username: uname, full_name: 'Reset Tester', email: `${uname}@example.com`, group_id: groups.find((g) => g.name === 'Billing').id }, adminToken);
  const unknown = await call('POST', '/auth/forgot', { login: 'nobody-here' });
  const known = await call('POST', '/auth/forgot', { login: `${uname}@example.com` });
  assert.equal(unknown.status, 200); assert.equal(known.data.message, unknown.data.message, 'no account discovery');
  const mail = (await q("SELECT body FROM message_log WHERE kind='password_reset' AND to_addr=? ORDER BY id DESC LIMIT 1", [`${uname}@example.com`]))[0];
  const token = mail.body.match(/reset-password\?t=([\w-]+)/)[1];
  assert.equal((await call('POST', '/auth/reset', { token, password: 'weak' })).status, 400);
  assert.equal((await call('POST', '/auth/reset', { token, password: 'Fresh#Start-2026' })).status, 200);
  assert.equal((await call('POST', '/auth/reset', { token, password: 'Other#Start-2026' })).status, 400, 'link is single-use');
  const l = await call('POST', '/auth/login', { username: uname, password: 'Fresh#Start-2026' });
  assert.equal(l.status, 200); assert.equal(l.data.user.mustChangePassword, false);
  const row = (await q('SELECT id FROM password_reset WHERE id=?', [token]))[0];
  assert.equal(row, undefined, 'only the hash is stored');
});
