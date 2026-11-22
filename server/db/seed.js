// Demo data for SmileOS. Run: npm run migrate && npm run seed
import bcrypt from 'bcryptjs';
import { pool, q } from '../src/db.js';
import { seedClinicBase } from './defaults.js';


const tables = ['user_session', 'message_log', 'claim_file', 'portal_token', 'web_request', 'sheet', 'sheet_def', 'program_link', 'integration_setting', 'audit_log', 'claim_proc', 'claim', 'pay_split', 'payment', 'adjustment', 'payment_plan', 'repeat_charge', 'statement', 'commlog', 'task', 'document_review', 'document',
  'time_clock', 'supply', 'progress_note', 'treat_plan', 'perio_measure', 'medication_pat', 'rx', 'lab_case', 'procedure_log', 'blockout', 'appointment', 'recall',
  'ref_attach', 'referral', 'pat_plan', 'ins_sub', 'benefit', 'ins_plan', 'carrier', 'patient', 'appt_type', 'fee', 'procedure_code', 'fee_schedule',
  'provider_schedule', 'operatory', 'app_user', 'provider', 'group_permission', 'user_group', 'definition', 'preference', 'clinic'];
await q('SET FOREIGN_KEY_CHECKS=0');
for (const t of tables) await q(`TRUNCATE TABLE \`${t}\``);
await q('SET FOREIGN_KEY_CHECKS=1');

const ins = async (sql, params) => (await q(sql, params)).insertId;
const day = (offset, time = '00:00') => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.toISOString().slice(0, 10)} ${time}:00`; };
const date = (offset) => day(offset).slice(0, 10);

const { gid, fsStd, code, defId } = await seedClinicBase({ practiceName: 'SmileOS Demo Dental' });
await q("UPDATE preference SET value='4500' WHERE name='DailyGoal'");

// Providers, operatories
const fsPpo = await ins('INSERT INTO fee_schedule (name) VALUES (?)', ['Delta PPO']);
await q('INSERT INTO fee (fee_schedule_id, code_id, amount) SELECT ?, code_id, ROUND(amount*0.8) FROM fee WHERE fee_schedule_id=?', [fsPpo, fsStd]);
const prov = {
  KH: await ins('INSERT INTO provider (abbr, first_name, last_name, color, fee_schedule_id) VALUES (?,?,?,?,?)', ['DrKhan', 'Sami', 'Khan', '#0875F5', fsStd]),
  LE: await ins('INSERT INTO provider (abbr, first_name, last_name, color, fee_schedule_id) VALUES (?,?,?,?,?)', ['DrLee', 'Grace', 'Lee', '#7C5CFF', fsStd]),
  MO: await ins('INSERT INTO provider (abbr, first_name, last_name, is_hygienist, color, fee_schedule_id) VALUES (?,?,?,?,?,?)', ['Mona', 'Mona', 'Farid', 1, '#14B8A6', fsStd]),
  TA: await ins('INSERT INTO provider (abbr, first_name, last_name, is_hygienist, color, fee_schedule_id) VALUES (?,?,?,?,?,?)', ['Tariq', 'Tariq', 'Aziz', 1, '#F59E0B', fsStd]),
};
const op = {
  O1: await ins('INSERT INTO operatory (clinic_id, name, abbr, provider_id, item_order) VALUES (1,?,?,?,1)', ['Op 1', 'OP1', prov.KH]),
  O2: await ins('INSERT INTO operatory (clinic_id, name, abbr, provider_id, item_order) VALUES (1,?,?,?,2)', ['Op 2', 'OP2', prov.LE]),
  H1: await ins('INSERT INTO operatory (clinic_id, name, abbr, provider_id, hygienist_id, is_hygiene, item_order) VALUES (1,?,?,?,?,1,3)', ['Hyg 1', 'HYG1', prov.KH, prov.MO]),
  H2: await ins('INSERT INTO operatory (clinic_id, name, abbr, provider_id, hygienist_id, is_hygiene, item_order) VALUES (1,?,?,?,?,1,4)', ['Hyg 2', 'HYG2', prov.LE, prov.TA]),
};
for (const p of Object.values(prov)) for (const wd of [0, 1, 2, 3, 4, 5, 6]) await q('INSERT INTO provider_schedule (prov_id, weekday, start_time, stop_time) VALUES (?,?,?,?)', [p, wd, '08:00', '17:00']);

// Users
const hash = await bcrypt.hash('smileos123', 12);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['admin', 'Clinic Admin', hash, gid.Admin]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id, provider_id) VALUES (?,?,?,?,?)', ['drkhan', 'Dr. Sami Khan', hash, gid.Dentist, prov.KH]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['frontdesk', 'Sara Ahmed', hash, gid.FrontDesk]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['billing', 'Omar Billing', hash, gid.Billing]);
await q("UPDATE app_user SET email=CONCAT(username, '@demo.smileos.example')");


await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Recall visit', '#14B8A6', 60, [code.D0120, code.D1110, code.D0274].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['New patient exam', '#0875F5', 60, [code.D0150, code.D0210].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Emergency', '#E5484D', 30, [code.D0140, code.D0220].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Crown prep', '#7C5CFF', 90, '']);


// Insurance
const delta = await ins('INSERT INTO carrier (name, phone, payer_id) VALUES (?,?,?)', ['Delta Dental', '800-555-0110', 'DDCA1']);
const cigna = await ins('INSERT INTO carrier (name, phone, payer_id) VALUES (?,?,?)', ['Cigna Dental', '800-555-0120', '62308']);
const metlife = await ins('INSERT INTO carrier (name, phone, payer_id) VALUES (?,?,?)', ['MetLife', '800-555-0130', '65978']);
const mkPlan = async (carrier, group, type, max, ded, fs) => {
  const id = await ins('INSERT INTO ins_plan (carrier_id, group_name, group_num, plan_type, annual_max, deductible, fee_schedule_id, date_benefits_verified) VALUES (?,?,?,?,?,?,?,?)',
    [carrier, group, `G${Math.floor(Math.random() * 90000 + 10000)}`, type, max, ded, fs, date(-40)]);
  for (const [cat, pct] of Object.entries({ Diagnostic: 100, Preventive: 100, Restorative: 80, Endo: 80, Perio: 80, OralSurg: 80, Prosth: 50, Ortho: 50 })) {
    await q('INSERT INTO benefit (plan_id, category, percent) VALUES (?,?,?)', [id, cat, pct]);
  }
  return id;
};
const planDelta = await mkPlan(delta, 'Harbor Logistics', 'PPO', 1500, 50, fsPpo);
const planCigna = await mkPlan(cigna, 'City Schools', 'Percentage', 2000, 50, null);
const planMet = await mkPlan(metlife, 'Bright Tech', 'PPO', 1500, 75, fsPpo);

// Patients (families)
const pat = async (o) => ins(`INSERT INTO patient (guarantor_id, clinic_id, last_name, first_name, birthdate, gender, position, wireless_phone, email, address, city, state, zip,
  pri_prov_id, sec_prov_id, medical_alert, allergies, date_first_visit, referral_source) VALUES (?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
[o.g || null, o.last, o.first, o.dob, o.gender, o.pos || 'Single', o.phone, o.email || null, o.addr || '14 Cedar Ave', 'Springfield', 'CA', '90210',
  o.prov || prov.KH, o.hyg || prov.MO, o.alert || null, o.allergy || null, o.first_visit === undefined ? date(-400) : o.first_visit, o.ref || null]);
const P = {};
P.omar = await pat({ last: 'Khalid', first: 'Omar', dob: '1990-04-12', gender: 'M', pos: 'Married', phone: '555-201-1001', email: 'omar.k@example.com' });
P.huda = await pat({ g: P.omar, last: 'Khalid', first: 'Huda', dob: '1992-08-03', gender: 'F', pos: 'Married', phone: '555-201-1002', allergy: 'Penicillin', alert: 'Penicillin allergy' });
P.adam = await pat({ g: P.omar, last: 'Khalid', first: 'Adam', dob: '2016-02-20', gender: 'M', pos: 'Child', phone: '555-201-1001', prov: prov.LE, hyg: prov.TA });
P.lina = await pat({ last: 'Haddad', first: 'Lina', dob: '1997-11-30', gender: 'F', phone: '555-201-2001', email: 'lina.h@example.com', ref: 'Google search' });
P.maria = await pat({ last: 'Lopez', first: 'Maria', dob: '1974-06-15', gender: 'F', pos: 'Married', phone: '555-201-3001', prov: prov.LE, alert: 'High blood pressure' });
P.yusuf = await pat({ last: 'Ali', first: 'Yusuf', dob: '2003-01-09', gender: 'M', phone: '555-201-4001', first_visit: null, ref: 'Friend referral' });
P.hana = await pat({ last: 'Saleh', first: 'Hana', dob: '1979-03-22', gender: 'F', phone: '555-201-5001', hyg: prov.MO });
P.ali = await pat({ last: 'Rahman', first: 'Ali', dob: '1988-09-17', gender: 'M', phone: '555-201-6001', prov: prov.LE, hyg: prov.TA });
P.sofia = await pat({ last: 'Rossi', first: 'Sofia', dob: '1970-12-01', gender: 'F', phone: '555-201-7001', prov: prov.LE });
P.noah = await pat({ last: 'Smith', first: 'Noah', dob: '2017-07-07', gender: 'M', pos: 'Child', phone: '555-201-8001', hyg: prov.MO });

const addIns = async (patient, plan, subscriber, rel) => {
  const sub = await ins('INSERT INTO ins_sub (plan_id, subscriber_id, subscriber_num) VALUES (?,?,?)', [plan, subscriber, `M${100000 + patient}`]);
  return ins('INSERT INTO pat_plan (patient_id, ins_sub_id, ordinal, relationship, date_eligibility_verified) VALUES (?,?,1,?,?)', [patient, sub, rel, date(-20)]);
};
await addIns(P.omar, planDelta, P.omar, 'Self'); await addIns(P.huda, planDelta, P.omar, 'Spouse'); await addIns(P.adam, planDelta, P.omar, 'Child');
await addIns(P.lina, planCigna, P.lina, 'Self'); await addIns(P.maria, planMet, P.maria, 'Self'); await addIns(P.hana, planMet, P.hana, 'Self');
await addIns(P.ali, planCigna, P.ali, 'Self'); await addIns(P.sofia, planMet, P.sofia, 'Self');
await q("INSERT INTO medication_pat (patient_id, kind, name) VALUES (?, 'Allergy', 'Penicillin')", [P.huda]);
await q("INSERT INTO medication_pat (patient_id, kind, name) VALUES (?, 'Medication', 'Lisinopril 10mg'), (?, 'Problem', 'Hypertension')", [P.maria, P.maria]);

const rf = await ins('INSERT INTO referral (name, is_doctor, specialty, phone) VALUES (?,1,?,?)', ['Dr. Nadia Perio', 'Periodontist', '555-300-1000']);
await ins('INSERT INTO referral (name, is_doctor, specialty) VALUES (?,1,?)', ['Dr. Ben Endo', 'Endodontist']);
await q('INSERT INTO ref_attach (patient_id, referral_id, direction, ref_date, note) VALUES (?,?,?,?,?)', [P.sofia, rf, 'To', date(-60), 'Perio evaluation']);

// Helper to add procedures / appointments
const proc = async (patient, c, provider, status, o = {}) => ins(`INSERT INTO procedure_log (patient_id, code_id, prov_id, tooth, surf, fee, status, proc_date, apt_id) VALUES (?,?,?,?,?,
  (SELECT amount FROM fee WHERE fee_schedule_id=? AND code_id=?),?,?,?)`, [patient, code[c], provider, o.tooth || null, o.surf || null, fsStd, code[c], status, status === 1 ? null : (o.date || date(-30)), o.apt || null]);
const conf = await defId('ApptConfirmed', 'Confirmed');
const unconf = await defId('ApptConfirmed', 'Unconfirmed');
const appt = async (patient, opId, provider, dt, mins, procsList, o = {}) => {
  const id = await ins(`INSERT INTO appointment (patient_id, clinic_id, op_id, prov_id, hyg_id, is_hygiene, apt_datetime, minutes, apt_status, confirmed_id, priority, note, appt_type_id)
    VALUES (?,1,?,?,?,?,?,?,?,?,?,?,?)`, [patient, opId, provider, o.hyg || null, o.hyg ? 1 : 0, dt, mins, o.status || 1, o.confirmed || unconf, o.asap ? 1 : 0, o.note || null, o.type || null]);
  for (const [c, extra] of procsList) await proc(patient, c, o.hyg || provider, o.status === 2 ? 2 : 1, { ...extra, apt: id, date: dt.slice(0, 10) });
  return id;
};

// History: completed visits with claims and payments
const hist = [[P.omar, -200], [P.huda, -190], [P.lina, -160], [P.maria, -120], [P.hana, -100], [P.sofia, -90], [P.ali, -75]];
for (const [p, off] of hist) {
  await appt(p, op.H1, prov.KH, day(off, '09:00'), 60, [['D0120'], ['D1110'], ['D0274']], { status: 2, hyg: prov.MO, confirmed: conf });
  await q("INSERT INTO recall (patient_id, recall_type, interval_months, date_previous, date_due) VALUES (?, 'Prophy', 6, ?, DATE_ADD(?, INTERVAL 6 MONTH))", [p, date(off), date(off)]);
}
await q("INSERT INTO recall (patient_id, recall_type, interval_months, date_due) VALUES (?, 'Prophy', 6, ?), (?, 'Prophy', 6, ?), (?, 'Prophy', 6, ?)",
  [P.adam, date(-10), P.noah, date(5), P.yusuf, date(0)]);
await proc(P.maria, 'D2750', prov.LE, 2, { tooth: '19', date: date(-110) });
await proc(P.lina, 'D2391', prov.KH, 2, { tooth: '30', surf: 'O', date: date(-155) });
await proc(P.omar, 'D2140', prov.KH, 4, { tooth: '3', surf: 'O' });

// Claims for history: received
const done = await q('SELECT p.*, c.category FROM procedure_log p JOIN procedure_code c ON c.id=p.code_id WHERE p.status=2');
for (const p of done) {
  const pp = (await q('SELECT id FROM pat_plan WHERE patient_id=? AND ordinal=1', [p.patient_id]))[0];
  if (!pp) continue;
  const pct = ['Diagnostic', 'Preventive'].includes(p.category) ? 1 : p.category === 'Prosth' ? 0.5 : 0.8;
  const paid = Math.round(p.fee * pct * 0.9 * 100) / 100;
  const cl = await ins("INSERT INTO claim (patient_id, pat_plan_id, status, date_service, date_sent, date_received, claim_fee, ins_est, ins_paid) VALUES (?,?,'R',?,?,?,?,?,?)",
    [p.patient_id, pp.id, p.proc_date, p.proc_date, p.proc_date, p.fee, paid, paid]);
  await q("INSERT INTO claim_proc (claim_id, proc_id, patient_id, pat_plan_id, status, fee_billed, ins_est, ins_paid) VALUES (?,?,?,?,'Received',?,?,?)", [cl, p.id, p.patient_id, pp.id, p.fee, paid, paid]);
}
// Patient payments
const cash = await defId('PaymentType', 'Credit card');
for (const [p, amt] of [[P.omar, 40], [P.lina, 50], [P.hana, 30]]) {
  const pay = await ins('INSERT INTO payment (patient_id, pay_type_id, amount, pay_date, note) VALUES (?,?,?,?,?)', [p, cash, amt, date(-80), 'Thank you']);
  await q('INSERT INTO pay_split (payment_id, patient_id, prov_id, amount) VALUES (?,?,?,?)', [pay, p, prov.KH, amt]);
}

// Today and this week
await appt(P.omar, op.H1, prov.KH, day(0, '08:00'), 60, [['D0120'], ['D1110']], { hyg: prov.MO, confirmed: conf });
await appt(P.lina, op.O1, prov.KH, day(0, '09:30'), 60, [['D2393', { tooth: '14', surf: 'MOD' }]], { confirmed: conf, note: 'Prefers morning appointments' });
await appt(P.maria, op.O2, prov.LE, day(0, '08:30'), 90, [['D2740', { tooth: '30' }], ['D2950', { tooth: '30' }]], { confirmed: conf });
await appt(P.yusuf, op.O2, prov.LE, day(0, '11:00'), 60, [['D0150'], ['D0210']], { type: 2 });
await appt(P.hana, op.H1, prov.KH, day(0, '10:00'), 60, [['D4910']], { hyg: prov.MO, confirmed: conf });
await appt(P.ali, op.H2, prov.LE, day(0, '09:00'), 60, [['D1110'], ['D0274']], { hyg: prov.TA });
await appt(P.sofia, op.H2, prov.LE, day(0, '11:00'), 90, [['D4341', { tooth: 'UR' }], ['D4341', { tooth: 'UL' }]], { hyg: prov.TA, confirmed: conf });
await appt(P.noah, op.H1, prov.KH, day(1, '15:00'), 30, [['D1120'], ['D1206']], { hyg: prov.MO });
await appt(P.huda, op.O1, prov.KH, day(2, '13:00'), 30, [['D0140']], { asap: true });
// Unscheduled and planned
await q("INSERT INTO appointment (patient_id, clinic_id, prov_id, minutes, apt_status, note) VALUES (?,1,?,30,3,'Cancelled – call to reschedule')", [P.adam, prov.LE]);
const planned = await ins("INSERT INTO appointment (patient_id, clinic_id, prov_id, minutes, apt_status, note, item_order) VALUES (?,1,?,60,6,'Root canal then crown',1)", [P.maria, prov.LE]);
await q(`INSERT INTO procedure_log (patient_id, code_id, prov_id, tooth, fee, status, planned_apt_id) VALUES (?,?,?,?,(SELECT amount FROM fee WHERE fee_schedule_id=? AND code_id=?),1,?)`,
  [P.maria, code.D3330, prov.LE, '3', fsStd, code.D3330, planned]);
// Treatment planned (not scheduled)
await proc(P.omar, 'D2392', prov.KH, 1, { tooth: '19', surf: 'MO' });
await proc(P.sofia, 'D6010', prov.LE, 1, { tooth: '30' });

// Blockouts today
const lunch = await defId('BlockoutType', 'Lunch');
for (const o of Object.values(op)) await q('INSERT INTO blockout (op_id, type_id, start_dt, stop_dt, note, no_schedule) VALUES (?,?,?,?,?,1)', [o, lunch, day(0, '12:30'), day(0, '13:30'), 'Lunch']);

await q("INSERT INTO lab_case (patient_id, prov_id, lab_name, instructions, date_sent, date_due) VALUES (?,?,?,?,?,?)", [P.maria, prov.LE, 'Precision Dental Lab', 'Zirconia crown #30, shade A2', day(-3, '10:00'), day(6, '12:00')]);
await q("INSERT INTO supply (name, category, supplier, qty_on_hand, qty_min, price) VALUES ('Nitrile gloves M','Disposables','DentSupply Co',12,20,9.5),('Composite A2','Restorative','DentSupply Co',8,5,42),('Prophy paste','Hygiene','CleanSmile',30,10,18)");
await q("INSERT INTO task (descript, patient_id, date_due) VALUES ('Call Delta Dental about Huda frequency limits', ?, CURDATE()), ('Order more gloves', NULL, DATE_ADD(CURDATE(), INTERVAL 2 DAY))", [P.huda]);
await q("INSERT INTO perio_measure (patient_id, exam_date, tooth, depths, bleeding) VALUES (?,?,2,'3,2,3,4,3,3','0,0,0,1,0,0'),(?,?,3,'4,3,4,5,4,4','1,0,0,1,0,1'),(?,?,14,'3,2,3,3,2,3','')", [P.sofia, date(-90), P.sofia, date(-90), P.sofia, date(-90)]);


await q("INSERT INTO integration_setting (name, config) VALUES ('clearinghouse', ?)", [JSON.stringify({ billing_name: 'SmileOS Demo Dental', billing_npi: '1234567893', tax_id: '123456789', billing_address: '12 Harbor Street', billing_city: 'Springfield', billing_state: 'CA', billing_zip: '90210', billing_phone: '5550100' })]);

console.log('Seed complete. Log in with admin / smileos123 (also drkhan, frontdesk, billing).');
await pool.end();
