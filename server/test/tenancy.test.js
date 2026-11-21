// Multi-clinic tests: super admin, clinic creation, data separation, suspension.
process.env.MULTI_TENANT = '1';
process.env.ALLOW_TENANT_HEADER = '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
const { app } = await import('../src/index.js');
const { pool } = await import('../src/db.js');
const { cq } = await import('../src/tenancy.js');
const { migrateControlDb } = await import('../src/migrations.js');
const { totp } = await import('../src/security.js');

let server, base, superTok;
const slugA = `ta${Date.now() % 1e6}`; const slugB = `tb${Date.now() % 1e6}`;
const call = async (method, url, body, token, tenant) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(tenant ? { 'x-tenant': tenant } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
before(async () => {
  await migrateControlDb(process.env.CONTROL_DB || 'smileos_control');
  await cq('DELETE FROM super_admin WHERE email=?', ['test-super@example.com']);
  await cq('INSERT INTO super_admin (email, full_name, password_hash) VALUES (?,?,?)', ['test-super@example.com', 'Test Super', await bcrypt.hash('Super#Admin-2026', 10)]);
  server = app.listen(0); base = `http://localhost:${server.address().port}/api`;
});
after(async () => {
  for (const s of [slugA, slugB]) { const t = (await cq('SELECT id FROM tenant WHERE slug=?', [s]))[0]; if (t) await call('DELETE', `/super/tenants/${t.id}`, { confirm: s, dropData: true }, superTok); }
  await cq('DELETE FROM super_admin WHERE email=?', ['test-super@example.com']);
  server.close(); await pool.end();
});

test('super admin must set up two-factor before doing anything', async () => {
  const l = await call('POST', '/super/login', { email: 'test-super@example.com', password: 'Super#Admin-2026' });
  assert.equal(l.data.mfaSetup, true);
  superTok = l.data.token;
  assert.equal((await call('GET', '/super/tenants', null, superTok)).status, 401);
  assert.equal((await call('POST', '/super/mfa', { code: totp(l.data.secret) }, superTok)).status, 200);
  assert.equal((await call('GET', '/super/tenants', null, superTok)).status, 200);
});

test('create two clinics; each has its own admin, roles and data', async () => {
  const a = await call('POST', '/super/tenants', { slug: slugA, name: 'Clinic A', adminEmail: 'a@example.com' }, superTok);
  const b = await call('POST', '/super/tenants', { slug: slugB, name: 'Clinic B' }, superTok);
  assert.equal(a.status, 200, JSON.stringify(a.data)); assert.equal(b.status, 200);
  assert.equal((await call('POST', '/super/tenants', { slug: slugA, name: 'Dup' }, superTok)).status, 409);
  assert.equal((await call('POST', '/super/tenants', { slug: 'Bad Slug!', name: 'x' }, superTok)).status, 400);

  // Clinic A admin signs in with the temporary password and must change it
  const la = await call('POST', '/auth/login', { username: 'admin', password: a.data.tempPassword }, null, slugA);
  assert.equal(la.data.user.mustChangePassword, true);
  assert.equal((await call('POST', '/auth/password', { current: a.data.tempPassword, next: 'Clinic#A-secure1' }, la.data.token, slugA)).status, 200);
  const groups = (await call('GET', '/setup/groups', null, la.data.token, slugA)).data.map((g) => g.name);
  assert.deepEqual(groups.sort(), ['Admin', 'Billing', 'Dentist', 'FrontDesk', 'Hygienist']);
  const p = await call('POST', '/patients', { first_name: 'Only', last_name: 'InClinicA' }, la.data.token, slugA);
  assert.equal(p.status, 200);
  // Clinic A's session does not work at clinic B, and B cannot see A's patient
  assert.equal((await call('GET', '/patients?search=InClinicA', null, la.data.token, slugB)).status, 401);
  const lb = await call('POST', '/auth/login', { username: 'admin', password: b.data.tempPassword }, null, slugB);
  await call('POST', '/auth/password', { current: b.data.tempPassword, next: 'Clinic#B-secure1' }, lb.data.token, slugB);
  assert.equal((await call('GET', '/patients?search=InClinicA', null, lb.data.token, slugB)).data.length, 0);
  // Super admin list shows counts only
  const list = (await call('GET', '/super/tenants', null, superTok)).data;
  const ta = list.find((t) => t.slug === slugA);
  assert.equal(ta.stats.patients, 1);
  assert.equal(ta.db_name, undefined);
});

test('suspended clinic cannot sign in; reset admin gives a new temporary password', async () => {
  const t = (await cq('SELECT id FROM tenant WHERE slug=?', [slugA]))[0];
  await call('PUT', `/super/tenants/${t.id}`, { status: 'suspended' }, superTok);
  assert.equal((await call('POST', '/auth/login', { username: 'admin', password: 'Clinic#A-secure1' }, null, slugA)).status, 403);
  await call('PUT', `/super/tenants/${t.id}`, { status: 'active' }, superTok);
  const r = await call('POST', `/super/tenants/${t.id}/reset-admin`, { username: 'admin' }, superTok);
  const l = await call('POST', '/auth/login', { username: 'admin', password: r.data.tempPassword }, null, slugA);
  assert.equal(l.status, 200); assert.equal(l.data.user.mustChangePassword, true);
});

test('requests without a clinic address are refused', async () => {
  assert.equal((await call('POST', '/auth/login', { username: 'admin', password: 'x' })).status, 404);
  assert.equal((await call('GET', '/public/practice')).data.noClinic, true);
});
