// Demo data for SmileOS. Run: npm run migrate && npm run seed
import bcrypt from 'bcryptjs';
import { pool, q } from '../src/db.js';
import { PERMISSIONS } from '../src/auth.js';

const tables = ['message_log', 'claim_file', 'portal_token', 'web_request', 'sheet', 'sheet_def', 'program_link', 'integration_setting', 'audit_log', 'claim_proc', 'claim', 'pay_split', 'payment', 'adjustment', 'payment_plan', 'repeat_charge', 'statement', 'commlog', 'task', 'document',
  'time_clock', 'supply', 'progress_note', 'treat_plan', 'perio_measure', 'medication_pat', 'rx', 'lab_case', 'procedure_log', 'blockout', 'appointment', 'recall',
  'ref_attach', 'referral', 'pat_plan', 'ins_sub', 'benefit', 'ins_plan', 'carrier', 'patient', 'appt_type', 'fee', 'procedure_code', 'fee_schedule',
  'provider_schedule', 'operatory', 'app_user', 'provider', 'group_permission', 'user_group', 'definition', 'preference', 'clinic'];
await q('SET FOREIGN_KEY_CHECKS=0');
for (const t of tables) await q(`TRUNCATE TABLE \`${t}\``);
await q('SET FOREIGN_KEY_CHECKS=1');

const ins = async (sql, params) => (await q(sql, params)).insertId;
const day = (offset, time = '00:00') => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.toISOString().slice(0, 10)} ${time}:00`; };
const date = (offset) => day(offset).slice(0, 10);

await ins('INSERT INTO clinic (name, phone, address) VALUES (?,?,?)', ['Main Clinic', '555-0100', '12 Harbor Street']);

// Security groups
const groups = {
  Admin: PERMISSIONS,
  Dentist: PERMISSIONS.filter((p) => !['SecurityAdmin', 'Setup', 'AuditTrail', 'PaymentDelete'].includes(p)),
  Hygienist: ['AppointmentsModule', 'AppointmentEdit', 'FamilyModule', 'ChartModule', 'ProcEdit', 'ProcComplete', 'PerioEdit', 'TreatPlanModule', 'ImagingModule', 'ImageCreate'],
  FrontDesk: ['AppointmentsModule', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentMove', 'AppointmentDelete', 'AppointmentComplete', 'ConfirmationStatusEdit', 'Blockouts',
    'FamilyModule', 'PatientEdit', 'InsPlanEdit', 'ChartModule', 'TreatPlanModule', 'AccountModule', 'PaymentCreate', 'ImagingModule', 'ImageCreate', 'ManageModule'],
  Billing: ['AppointmentsModule', 'FamilyModule', 'PatientEdit', 'InsPlanEdit', 'TreatPlanModule', 'AccountModule', 'PaymentCreate', 'PaymentDelete', 'AdjustmentCreate',
    'ClaimEdit', 'InsPayCreate', 'PaymentPlanEdit', 'ManageModule', 'Billing', 'Reports'],
};
const gid = {};
for (const [name, perms] of Object.entries(groups)) {
  gid[name] = await ins('INSERT INTO user_group (name) VALUES (?)', [name]);
  for (const p of perms) await q('INSERT INTO group_permission VALUES (?,?)', [gid[name], p]);
}

// Fee schedules, providers, operatories
const fsStd = await ins('INSERT INTO fee_schedule (name) VALUES (?)', ['Standard']);
const fsPpo = await ins('INSERT INTO fee_schedule (name) VALUES (?)', ['Delta PPO']);
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
const hash = await bcrypt.hash('smileos123', 10);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['admin', 'Clinic Admin', hash, gid.Admin]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id, provider_id) VALUES (?,?,?,?,?)', ['drkhan', 'Dr. Sami Khan', hash, gid.Dentist, prov.KH]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['frontdesk', 'Sara Ahmed', hash, gid.FrontDesk]);
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', ['billing', 'Omar Billing', hash, gid.Billing]);

// Definitions
const defs = {
  ApptConfirmed: [['Unconfirmed', 'Unconf', '#94A3B8'], ['Confirmed', 'Conf', '#16A34A'], ['Left message', 'LM', '#F59E0B'], ['Texted', 'Txt', '#0875F5'], ['Arrived', 'Arr', '#2563EB'], ['In treatment room', 'InRm', '#7C3AED'], ['Front desk', 'FD', '#0EA5E9']],
  RecallUnschedStatus: [['Left message', 'LM'], ['Call back', 'CB'], ['Will call', 'WC'], ['Mailed postcard', 'PC'], ['Declined', 'Decl']],
  BlockoutType: [['Lunch', 'L', '#E2E8F0'], ['Staff meeting', 'M', '#FDE68A'], ['New patients only', 'NP', '#DBEAFE'], ['Emergency', 'ER', '#FECACA']],
  AdjType: [['Professional courtesy', 'PC'], ['Senior discount', 'SD'], ['Finance charge', 'FC'], ['Bad debt write-off', 'BD'], ['Billing error correction', 'BE']],
  PaymentType: [['Cash', 'Cash'], ['Credit card', 'Card'], ['Check', 'Chk'], ['Online payment', 'Web'], ['Bank transfer', 'Bank']],
  BillingType: [['Standard account', 'Std'], ['Insurance only', 'Ins'], ['Collections', 'Coll']],
  ImageCat: [['X-rays', 'XR'], ['Photos', 'Ph'], ['Forms', 'Frm'], ['Insurance cards', 'Ins'], ['Treatment plans', 'TP']],
  InsVerifyStatus: [['Not started', 'NS'], ['Called carrier', 'Call'], ['Verified on portal', 'Web'], ['Problem', 'Prob']],
};
for (const [cat, list] of Object.entries(defs)) {
  let i = 0;
  for (const [name, abbr, color] of list) await q('INSERT INTO definition (category, name, abbr, color, item_order) VALUES (?,?,?,?,?)', [cat, name, abbr, color || null, i++]);
}
const defId = async (cat, name) => (await q('SELECT id FROM definition WHERE category=? AND name=?', [cat, name]))[0].id;

// Procedure codes and fees
const codes = [
  ['D0120', 'Periodic oral evaluation', 'PerEx', 'Diagnostic', 'Mouth', 15, 1, 65],
  ['D0140', 'Limited oral evaluation – problem focused', 'LimEx', 'Diagnostic', 'Mouth', 20, 0, 85],
  ['D0150', 'Comprehensive oral evaluation', 'CompEx', 'Diagnostic', 'Mouth', 30, 0, 110],
  ['D0210', 'Full mouth series of radiographs', 'FMX', 'Diagnostic', 'Mouth', 20, 0, 150],
  ['D0220', 'Periapical radiograph – first image', 'PA', 'Diagnostic', 'Tooth', 5, 0, 32],
  ['D0274', 'Bitewings – four images', '4BW', 'Diagnostic', 'Mouth', 10, 1, 75],
  ['D0330', 'Panoramic radiograph', 'Pano', 'Diagnostic', 'Mouth', 10, 0, 120],
  ['D1110', 'Prophylaxis – adult', 'Pro', 'Preventive', 'Mouth', 45, 1, 105],
  ['D1120', 'Prophylaxis – child', 'ChPro', 'Preventive', 'Mouth', 30, 1, 75],
  ['D1206', 'Topical fluoride varnish', 'Flo', 'Preventive', 'Mouth', 5, 1, 40],
  ['D1351', 'Sealant – per tooth', 'Seal', 'Preventive', 'Tooth', 10, 0, 50],
  ['D2140', 'Amalgam – one surface', 'Am1', 'Restorative', 'Surface', 30, 0, 140],
  ['D2150', 'Amalgam – two surfaces', 'Am2', 'Restorative', 'Surface', 40, 0, 175],
  ['D2330', 'Resin composite – one surface, anterior', 'C1A', 'Restorative', 'Surface', 30, 0, 160],
  ['D2391', 'Resin composite – one surface, posterior', 'C1P', 'Restorative', 'Surface', 30, 0, 180],
  ['D2392', 'Resin composite – two surfaces, posterior', 'C2P', 'Restorative', 'Surface', 45, 0, 230],
  ['D2393', 'Resin composite – three surfaces, posterior', 'C3P', 'Restorative', 'Surface', 60, 0, 280],
  ['D2740', 'Crown – porcelain/ceramic', 'PFZ', 'Prosth', 'Tooth', 90, 0, 1250],
  ['D2750', 'Crown – porcelain fused to high noble metal', 'PFM', 'Prosth', 'Tooth', 90, 0, 1150],
  ['D2950', 'Core buildup', 'BU', 'Restorative', 'Tooth', 30, 0, 280],
  ['D3310', 'Root canal – anterior', 'RCTA', 'Endo', 'Tooth', 60, 0, 850],
  ['D3330', 'Root canal – molar', 'RCTM', 'Endo', 'Tooth', 90, 0, 1200],
  ['D4341', 'Scaling and root planing – 4+ teeth per quadrant', 'SRP', 'Perio', 'Quad', 60, 0, 260],
  ['D4910', 'Periodontal maintenance', 'PerM', 'Perio', 'Mouth', 60, 1, 150],
  ['D5110', 'Complete denture – maxillary', 'CDmx', 'Prosth', 'Arch', 60, 0, 1800],
  ['D6010', 'Implant body – endosteal', 'Impl', 'OralSurg', 'Tooth', 90, 0, 2200],
  ['D7140', 'Extraction – erupted tooth', 'Ext', 'OralSurg', 'Tooth', 30, 0, 190],
  ['D7210', 'Surgical extraction', 'SExt', 'OralSurg', 'Tooth', 45, 0, 320],
  ['D8090', 'Comprehensive orthodontic treatment – adult', 'Ortho', 'Ortho', 'Mouth', 60, 0, 5500],
  ['D9110', 'Palliative emergency treatment', 'Pall', 'Other', 'Mouth', 20, 0, 95],
  ['D9972', 'External bleaching – per arch', 'Bleach', 'Other', 'Arch', 60, 0, 350],
];
const code = {};
for (const [c, d, a, cat, area, mins, recall, fee] of codes) {
  code[c] = await ins('INSERT INTO procedure_code (code, descript, abbr, category, treat_area, minutes, is_recall) VALUES (?,?,?,?,?,?,?)', [c, d, a, cat, area, mins, recall]);
  await q('INSERT INTO fee VALUES (?,?,?)', [fsStd, code[c], fee]);
  await q('INSERT INTO fee VALUES (?,?,?)', [fsPpo, code[c], Math.round(fee * 0.8)]);
}
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Recall visit', '#14B8A6', 60, [code.D0120, code.D1110, code.D0274].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['New patient exam', '#0875F5', 60, [code.D0150, code.D0210].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Emergency', '#E5484D', 30, [code.D0140, code.D0220].join(',')]);
await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Crown prep', '#7C5CFF', 90, '']);

for (const [k, v] of Object.entries({ DefaultFeeSchedule: fsStd, DailyGoal: 4500, AllowOverlap: 0, PracticeTitle: 'SmileOS Demo Dental', ScheduleStart: '07:00', ScheduleEnd: '18:00', TimeIncrement: 10 })) {
  await q('INSERT INTO preference VALUES (?,?)', [k, String(v)]);
}

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


// Program links (bridges): names from the Open Dental bridge list, grouped by category. All start disabled; enable and set the path in Setup.
const bridges = {
  Imaging: ['Acteon', 'ADSTRA', 'Apixia', 'Apteryx', 'Apteryx XVWeb', 'AudaxCeph', 'BioPAK', 'CADI', 'CamSight', 'CaptureLink', 'Carestream', 'Central Data Storage', 'Cerec', 'CleaRay', 'Clever One',
    'CliniView', 'ClioSoft/SOTA Imaging', 'DBSWIN', 'DentalEye', 'DentalStudio', 'AFP ProImage Eva', 'Dexis', 'Dexis Integrator', 'Digora Soredex Optime', 'Dolphin', 'Dr. Ceph', 'DTX Studio',
    'DXIS', 'EvaSoft', 'EzDent-i', 'Ez3D-i', 'Genoray Triana', 'HDX Will', 'iCat', 'i-Dixel', 'iRYS', 'Jazz Classic', 'MediaDent', 'Medit Link', 'MiPACS', 'NewTom NNT', 'Owandy',
    'Patient Gallery', 'Patterson Imaging', 'Pixel', 'Planmeca', 'PreXion', 'Progeny', 'RayMage', 'Scanora', 'Schick CDR Dicom', 'Shining 3D', 'Sirona Sidexis', 'SMARTDent', 'Sopro',
    'SOTA Cloud', 'SpeedVision', 'TigerView', 'Trophy', 'VisionX', 'visOra', 'VixWin', 'XDR', 'Z-Image', '3Shape'],
  AI: ['Ai-Dental', 'BetterDiagnostics', 'Bola AI', 'Overjet', 'Pearl AI'],
  Ortho: ['OrthoCAD', 'OrthoComposite', 'Ortho Insight 3D', 'OrthoPlex', 'VistaDent'],
  Perio: ['Florida Probe', 'PANDA Perio', 'PerioPal'],
  Payments: ['CareCredit', 'EdgeExpress', 'Global Payments', 'PaySimple', 'PaySuite'],
  Communication: ['CallFire', 'Demandforce', 'DentalTek Rapid Call', 'HouseCalls', 'Podium', 'UAppoint', 'Practice Booster'],
  Accounting: ['QuickBooks Online', 'Practice by Numbers', 'PracticeWeb Reports'],
  Collections: ['TSI', 'Trojan Express Collect'],
  EHR: ['eClinicalWorks', 'Glidewell', 'Allied Star Connect', 'Benco', 'Divvy', 'Docpoint', 'DentForms', 'EasyNotesPro', 'Guru', 'HandyDentist', 'Insurance Answers Plus', 'Mountainside', 'Office', 'One2', 'Oryx', 'PDMP', 'PT Dental', 'SteriSimple', 'Tscan', 'Vipersoft', 'Wiki Standalone'],
};
for (const [cat, names] of Object.entries(bridges)) {
  for (const n of names) await q('INSERT INTO program_link (name, category, launch_type, args) VALUES (?,?,?,?)', [n, cat, ['Payments', 'Communication', 'Accounting', 'AI'].includes(cat) ? 'url' : 'command', cat === 'Imaging' ? '[PatNum] "[LName]" "[FName]" [BirthdateMDY]' : '']);
}

// Forms
const medHistory = [
  { id: 'title', type: 'static', x: 40, y: 30, w: 770, h: 40, text: 'Medical History', size: 26, bold: true },
  { id: 'intro', type: 'static', x: 40, y: 75, w: 770, h: 30, text: 'Please answer all questions. Your answers are private.', size: 14 },
  { id: 'fname', type: 'input', label: 'First name', bind: 'first_name', x: 40, y: 120, w: 360, h: 56 },
  { id: 'lname', type: 'input', label: 'Last name', bind: 'last_name', x: 420, y: 120, w: 390, h: 56 },
  { id: 'dob', type: 'date', label: 'Birthdate', bind: 'birthdate', x: 40, y: 190, w: 240, h: 56 },
  { id: 'phone', type: 'input', label: 'Mobile phone', bind: 'wireless_phone', x: 300, y: 190, w: 240, h: 56 },
  { id: 'email', type: 'input', label: 'Email', bind: 'email', x: 560, y: 190, w: 250, h: 56 },
  { id: 'allergies', type: 'textarea', label: 'Allergies (comma separated)', bind: 'allergies', x: 40, y: 265, w: 770, h: 80 },
  { id: 'meds', type: 'textarea', label: 'Current medications (comma separated)', bind: 'medications', x: 40, y: 360, w: 770, h: 80 },
  { id: 'q1', type: 'checkbox', label: 'Heart disease or high blood pressure', x: 40, y: 460, w: 380, h: 30 },
  { id: 'q2', type: 'checkbox', label: 'Diabetes', x: 430, y: 460, w: 380, h: 30 },
  { id: 'q3', type: 'checkbox', label: 'Pregnant or nursing', x: 40, y: 500, w: 380, h: 30 },
  { id: 'q4', type: 'checkbox', label: 'Bleeding disorder / blood thinners', x: 430, y: 500, w: 380, h: 30 },
  { id: 'q5', type: 'checkbox', label: 'Artificial joint or heart valve', x: 40, y: 540, w: 380, h: 30 },
  { id: 'q6', type: 'checkbox', label: 'Smoker / tobacco use', x: 430, y: 540, w: 380, h: 30 },
  { id: 'other', type: 'textarea', label: 'Anything else we should know?', x: 40, y: 590, w: 770, h: 90 },
  { id: 'sig', type: 'signature', label: 'Patient signature', x: 40, y: 700, w: 500, h: 120 },
  { id: 'sigdate', type: 'date', label: 'Date', x: 570, y: 700, w: 240, h: 56 },
];
await q('INSERT INTO sheet_def (name, kind, width, height, fields, show_in_portal) VALUES (?,?,?,?,?,1)', ['Medical History', 'MedicalHistory', 850, 860, JSON.stringify(medHistory)]);
const consent = [
  { id: 't', type: 'static', x: 40, y: 30, w: 770, h: 40, text: 'Consent for Treatment', size: 26, bold: true },
  { id: 'body', type: 'static', x: 40, y: 85, w: 770, h: 160, size: 14, text: 'I consent to the dental treatment discussed with me, including examinations, X-rays, cleanings and the procedures in my treatment plan. The risks, benefits and alternatives have been explained and my questions have been answered.' },
  { id: 'agree', type: 'checkbox', label: 'I have read and agree', x: 40, y: 260, w: 400, h: 30 },
  { id: 'sig', type: 'signature', label: 'Signature', x: 40, y: 310, w: 500, h: 120 },
  { id: 'd', type: 'date', label: 'Date', x: 570, y: 310, w: 240, h: 56 },
];
await q('INSERT INTO sheet_def (name, kind, width, height, fields, show_in_portal) VALUES (?,?,?,?,?,1)', ['Treatment Consent', 'Consent', 850, 470, JSON.stringify(consent)]);

await q("INSERT INTO integration_setting (name, config) VALUES ('clearinghouse', ?)", [JSON.stringify({ billing_name: 'SmileOS Demo Dental', billing_npi: '1234567893', tax_id: '123456789', billing_address: '12 Harbor Street', billing_city: 'Springfield', billing_state: 'CA', billing_zip: '90210', billing_phone: '5550100' })]);

console.log('Seed complete. Log in with admin / smileos123 (also drkhan, frontdesk, billing).');
await pool.end();
