// Default configuration for every new clinic: security groups, definitions, procedure codes and fees,
// appointment types, preferences, program links (bridges) and forms. Used by provisioning and the demo seed.
import { q } from '../src/db.js';
import { PERMISSIONS } from '../src/auth.js';

export async function seedClinicBase({ practiceName = 'My Dental Clinic' } = {}) {
  const ins = async (sql, params) => (await q(sql, params)).insertId;
  await ins('INSERT INTO clinic (name) VALUES (?)', [practiceName]);
  // Security groups
  const groups = {
    Admin: PERMISSIONS,
    Dentist: PERMISSIONS.filter((p) => !['SecurityAdmin', 'Setup', 'AuditTrail', 'PaymentDelete'].includes(p)),
    Hygienist: ['AppointmentsModule', 'AppointmentEdit', 'FamilyModule', 'ChartModule', 'ProcEdit', 'ProcComplete', 'PerioEdit', 'TreatPlanModule', 'ImagingModule', 'ImageCreate'],
    FrontDesk: ['AppointmentsModule', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentMove', 'AppointmentDelete', 'AppointmentComplete', 'ConfirmationStatusEdit', 'Blockouts',
      'FamilyModule', 'PatientEdit', 'InsPlanEdit', 'ChartModule', 'TreatPlanModule', 'AccountModule', 'PaymentCreate', 'ImagingModule', 'ImageCreate', 'ManageModule'],
    ImagingAssistant: ['FamilyModule', 'ImagingModule', 'ImageCreate'],
    Billing: ['AppointmentsModule', 'FamilyModule', 'PatientEdit', 'InsPlanEdit', 'TreatPlanModule', 'AccountModule', 'PaymentCreate', 'PaymentDelete', 'AdjustmentCreate',
      'ClaimEdit', 'InsPayCreate', 'PaymentPlanEdit', 'ManageModule', 'Billing', 'Reports'],
  };
  const gid = {};
  for (const [name, perms] of Object.entries(groups)) {
    gid[name] = await ins('INSERT INTO user_group (name) VALUES (?)', [name]);
    for (const p of perms) await q('INSERT INTO group_permission VALUES (?,?)', [gid[name], p]);
  }


    const fsStd = await ins('INSERT INTO fee_schedule (name) VALUES (?)', ['Standard']);

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
  }
  await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Recall visit', '#14B8A6', 60, [code.D0120, code.D1110, code.D0274].join(',')]);
  await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['New patient exam', '#0875F5', 60, [code.D0150, code.D0210].join(',')]);
  await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Emergency', '#E5484D', 30, [code.D0140, code.D0220].join(',')]);
  await ins('INSERT INTO appt_type (name, color, minutes, code_ids) VALUES (?,?,?,?)', ['Crown prep', '#7C5CFF', 90, '']);

  for (const [k, v] of Object.entries({ DefaultFeeSchedule: fsStd, DailyGoal: 3000, AllowOverlap: 0, PracticeTitle: practiceName, ScheduleStart: '07:00', ScheduleEnd: '18:00', TimeIncrement: 10,
    SessionIdleMinutes: 15, RequireMfa: 0, PasswordMinLength: 10 })) {
    await q('INSERT INTO preference VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)', [k, String(v)]);
  }
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

  return { gid, fsStd, code, defId };
}
