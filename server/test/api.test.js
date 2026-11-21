// End-to-end API test against the seeded database. Run: npm run seed && npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';
import { pool } from '../src/db.js';

let server, base, token;
const api = async (method, url, body) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data.error), { status: r.status });
  return data;
};
before(async () => {
  server = app.listen(0); base = `http://localhost:${server.address().port}/api`;
  token = (await (await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'smileos123' }) })).json()).token;
});
after(async () => { server.close(); await pool.end(); });

test('login rejects a wrong password', async () => {
  const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'x' }) });
  assert.equal(r.status, 401);
});

test('schedule shows today with operatories and appointments', async () => {
  const s = await api('GET', '/appointments/schedule');
  assert.equal(s.ops.length, 4);
  assert.ok(s.appts.length >= 7);
  assert.ok(s.production > 0);
});

test('overlapping booking is refused, free slot is accepted', async () => {
  const s = await api('GET', '/appointments/schedule');
  const a = s.appts.find((x) => x.op_id && x.apt_status === 1);
  await assert.rejects(api('POST', '/appointments', { patient_id: a.patient_id, op_id: a.op_id, apt_datetime: a.apt_datetime, minutes: 30 }), /Overlaps/);
  await assert.rejects(api('POST', '/appointments', { patient_id: a.patient_id, op_id: a.op_id, apt_datetime: a.apt_datetime.slice(0, 10) + ' 12:40:00', minutes: 20 }), /blocked/);
});

test('treatment plan gives insurance estimates', async () => {
  const tp = await api('GET', '/chart/1/treatplan');
  assert.ok(tp.rows.length > 0);
  const total = tp.totals.insEst + tp.totals.patient + tp.totals.writeOff;
  assert.ok(Math.abs(total - tp.totals.fee) < 0.02, 'fee = ins + patient + write-off');
});

test('completing an appointment posts charges, creates a claim, resets recall', async () => {
  const s = await api('GET', '/appointments/schedule');
  const a = s.appts.find((x) => x.first_name === 'Omar' && x.apt_status === 1);
  const before = await api('GET', `/account/${a.patient_id}`);
  await api('POST', `/appointments/${a.id}/action`, { action: 'complete' });
  const after = await api('GET', `/account/${a.patient_id}`);
  assert.ok(after.ledger.length > before.ledger.length);
  assert.ok(after.claims.some((c) => c.status === 'W'));
  const pat = await api('GET', `/patients/${a.patient_id}`);
  assert.ok(pat.recalls[0].date_due > new Date().toISOString().slice(0, 10));
});

test('payment is split to procedures and reduces the balance', async () => {
  const b0 = (await api('GET', '/account/4')).balances.patient.total;
  await api('POST', '/account/4/payments', { amount: 10 });
  const b1 = (await api('GET', '/account/4')).balances.patient.total;
  assert.ok(Math.abs(b0 - 10 - b1) < 0.01);
});

test('receiving a claim records insurance payment', async () => {
  const claims = await api('GET', '/account/claims/list/all?status=W');
  const cl = await api('GET', `/account/claims/${claims[0].id}`);
  await api('POST', `/account/claims/${cl.id}/receive`, { procs: cl.procs.map((p) => ({ id: p.id, ins_paid: p.ins_est, write_off: p.write_off_est })) });
  const again = await api('GET', `/account/claims/${cl.id}`);
  assert.equal(again.status, 'R');
});

test('worklists and reports respond', async () => {
  for (const l of ['confirmation', 'unscheduled', 'asap', 'planned', 'recall', 'insverify']) assert.ok(Array.isArray(await api('GET', `/appointments/lists/${l}`)), l);
  assert.ok((await api('GET', '/reports/production')).byProv.length);
  assert.ok(Array.isArray(await api('GET', '/reports/aging')));
  assert.ok((await api('GET', '/reports/dashboard')).apptsToday >= 0);
});

test('front desk cannot open setup security', async () => {
  const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'frontdesk', password: 'smileos123' }) });
  const t = (await r.json()).token;
  const res = await fetch(base + '/setup/users', { headers: { authorization: `Bearer ${t}` } });
  assert.equal(res.status, 403);
});
