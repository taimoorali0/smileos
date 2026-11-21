// Tests for clearinghouse (837/835/270), messaging, portal, online booking, forms and bridges. Run after: npm run seed
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';
import { pool } from '../src/db.js';
import { parse835 } from '../src/logic/x12.js';

let server, base, token;
const call = async (method, url, body, headers = {}) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw Object.assign(new Error(data.error || data), { status: r.status });
  return data;
};
before(async () => {
  server = app.listen(0); base = `http://localhost:${server.address().port}/api`;
  token = (await call('POST', '/auth/login', { username: 'admin', password: 'smileos123' })).token;
});
after(async () => { server.close(); await pool.end(); });

test('837D batch is valid X12 and marks claims sent; sample 835 posts insurance payment', async () => {
  const s = await call('GET', '/appointments/schedule');
  const a = s.appts.find((x) => x.first_name === 'Hana' && x.apt_status === 1);
  await call('POST', `/appointments/${a.id}/action`, { action: 'complete' });
  const claims = await call('GET', '/account/claims/list/all?status=W');
  const claim = claims.find((c) => c.patient_id === a.patient_id);
  const sent = await call('POST', '/integrations/claims/send-electronic', { ids: [claim.id] });
  assert.equal(sent.ok, true, JSON.stringify(sent.errors));
  const file = await call('GET', `/integrations/claim-files/${sent.fileId}/download`);
  assert.match(file, /^ISA\*00\*/);
  assert.match(file, /ST\*837\*0001\*005010X224A2~/);
  assert.match(file, new RegExp(`CLM\\*${claim.id}\\*`));
  assert.match(file, /SV3\*AD:D4910\*/);
  const seCount = Number(file.match(/SE\*(\d+)\*0001~/)[1]);
  const segs = file.split('~').map((x) => x.trim()).filter(Boolean);
  assert.equal(seCount, segs.indexOf(segs.find((x) => x.startsWith('SE*'))) - segs.findIndex((x) => x.startsWith('ST*')) + 1, 'SE segment count matches');
  const after = await call('GET', `/account/claims/${claim.id}`);
  assert.equal(after.status, 'S');

  const era = (await call('GET', `/integrations/era/sample/${claim.id}`)).content;
  assert.equal(parse835(era).claims[0].claimId, String(claim.id));
  const imp = await call('POST', '/integrations/era/import', { content: era });
  assert.equal(imp.results[0].ok, true);
  const received = await call('GET', `/account/claims/${claim.id}`);
  assert.equal(received.status, 'R');
  assert.ok(received.ins_paid > 0);
});

test('claims with missing data are blocked with clear errors', async () => {
  await call('PUT', '/integrations/settings/clearinghouse', { billing_npi: '' });
  const claims = await call('GET', '/account/claims/list/all');
  const res = await call('POST', '/integrations/claims/send-electronic', { ids: [claims[0].id] });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes('NPI')));
  await call('PUT', '/integrations/settings/clearinghouse', { billing_npi: '1234567893' });
});

test('270 eligibility request is created', async () => {
  const pat = await call('GET', '/patients/1');
  const r = await call('POST', `/integrations/eligibility/${pat.insurance[0].pat_plan_id}`);
  assert.equal(r.status, 'test');
});

test('texts in test mode are logged, and secrets are masked', async () => {
  await call('PUT', '/integrations/settings/sms', { twilio_token: 'secret-value' });
  const s = await call('GET', '/integrations/settings');
  assert.equal(s.sms.twilio_token, '••••••••');
  const r = await call('POST', '/integrations/messages/send', { patient_id: 4, channel: 'sms', body: 'Hello [FName] from [Practice]' });
  assert.equal(r.status, 'test');
  const log = await call('GET', '/integrations/messages?patientId=4');
  assert.match(log[0].body, /^Hello Lina from SmileOS Demo Dental/);
});

test('appointment reminders are sent once', async () => {
  await call('PUT', '/integrations/settings/automation', { reminders_on: true, reminder_hours: 72 });
  const r1 = await call('POST', '/automation/run');
  const r2 = await call('POST', '/automation/run');
  assert.ok(r1.reminders > 0);
  assert.equal(r2.reminders, 0);
  await call('PUT', '/integrations/settings/automation', { reminders_on: false });
});

test('online booking creates a new patient and appointment', async () => {
  const saved = token; token = null;
  const open = await call('GET', '/public/openings');
  assert.ok(open.length > 0);
  const slot = open[open.length - 1];
  const r = await call('POST', '/public/book', { first_name: 'Test', last_name: 'Booker', birthdate: '1990-01-01', phone: '555-777-1234', date: slot.date, time: slot.time, op_id: slot.op_id, reason: 'Checkup' });
  assert.equal(r.ok, true);
  await assert.rejects(call('POST', '/public/book', { first_name: 'Other', last_name: 'Person', birthdate: '1980-01-01', phone: '555-777-9999', date: slot.date, time: slot.time, op_id: slot.op_id }), /taken/);
  token = saved;
  const found = await call('GET', '/patients?search=Booker');
  assert.equal(found.length, 1);
});

test('patient portal login, view, confirm, form submit and SMS confirm', async () => {
  const saved = token; token = null;
  await assert.rejects(call('POST', '/public/portal/login', { last_name: 'Haddad', birthdate: '1997-11-30', phone: '000-000-0000' }), /could not find/);
  const { token: pt } = await call('POST', '/public/portal/login', { last_name: 'Haddad', birthdate: '1997-11-30', phone: '555-201-2001' });
  const me = await call('GET', '/public/portal/me', null, { 'x-portal-token': pt });
  assert.equal(me.patient.first_name, 'Lina');
  assert.ok(me.forms.length >= 1);
  const form = me.forms.find((f) => f.name === 'Medical History');
  await call('POST', `/public/portal/forms/${form.id}`, { values: { allergies: 'Latex, Codeine', email: 'lina.new@example.com' } }, { 'x-portal-token': pt });
  token = saved;
  const pat = await call('GET', '/patients/4');
  assert.equal(pat.patient.email, 'lina.new@example.com');
  assert.ok(pat.medical.some((m) => m.name === 'Latex'));
  // Inbound SMS "C" confirms next appointment
  token = null;
  const xml = await fetch(base + '/public/sms/twilio', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'From=%2B15552012001&Body=C' }).then((r) => r.text());
  assert.match(xml, /confirmed/);
  token = saved;
});

test('program link fills patient tags; eRx needs setup', async () => {
  const links = await call('GET', '/integrations/program-links');
  assert.ok(links.length >= 90);
  const dexis = links.find((l) => l.name === 'Dexis');
  await call('PUT', `/integrations/program-links/${dexis.id}`, { ...dexis, enabled: 1, path: 'C:\\Dexis\\dexis.exe' });
  const l = await call('GET', `/integrations/program-links/${dexis.id}/launch/4`);
  assert.equal(l.args, '4 "Haddad" "Lina" 11/30/1997');
  await assert.rejects(call('GET', '/integrations/erx/launch/4'), /not turned on/);
});
