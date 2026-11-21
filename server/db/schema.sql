-- SmileOS - MySQL 8 schema (v1)
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS clinic (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30), address VARCHAR(200),
  is_hidden TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_group (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS group_permission (
  group_id INT NOT NULL,
  permission VARCHAR(60) NOT NULL,
  PRIMARY KEY (group_id, permission),
  FOREIGN KEY (group_id) REFERENCES user_group(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS app_user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  group_id INT NOT NULL,
  provider_id INT NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES user_group(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generic configurable lists (Setup > Definitions)
CREATE TABLE IF NOT EXISTS definition (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(40) NOT NULL,      -- ApptConfirmed, RecallUnschedStatus, BlockoutType, AdjType, PaymentType, BillingType, ImageCat, InsVerifyStatus
  name VARCHAR(100) NOT NULL,
  abbr VARCHAR(10),
  color CHAR(7),
  item_order INT NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  INDEX (category, item_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS preference (
  name VARCHAR(80) PRIMARY KEY,
  value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS provider (
  id INT AUTO_INCREMENT PRIMARY KEY,
  abbr VARCHAR(10) NOT NULL,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  is_hygienist TINYINT(1) NOT NULL DEFAULT 0,
  color CHAR(7) NOT NULL DEFAULT '#0875F5',
  fee_schedule_id INT NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS operatory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NULL,
  name VARCHAR(40) NOT NULL,
  abbr VARCHAR(10),
  provider_id INT NULL,
  hygienist_id INT NULL,
  is_hygiene TINYINT(1) NOT NULL DEFAULT 0,
  item_order INT NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (provider_id) REFERENCES provider(id),
  FOREIGN KEY (hygienist_id) REFERENCES provider(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS procedure_code (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(15) NOT NULL UNIQUE,
  descript VARCHAR(255) NOT NULL,
  abbr VARCHAR(20),
  category VARCHAR(30) NOT NULL,       -- Diagnostic, Preventive, Restorative, Endo, Perio, Prosth, OralSurg, Ortho, Other
  treat_area ENUM('Mouth','Tooth','Surface','Quad','Arch') NOT NULL DEFAULT 'Mouth',
  minutes SMALLINT NOT NULL DEFAULT 30,
  is_recall TINYINT(1) NOT NULL DEFAULT 0,
  paint_color CHAR(7) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee (
  fee_schedule_id INT NOT NULL,
  code_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (fee_schedule_id, code_id),
  FOREIGN KEY (fee_schedule_id) REFERENCES fee_schedule(id),
  FOREIGN KEY (code_id) REFERENCES procedure_code(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appt_type (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  color CHAR(7),
  minutes SMALLINT NOT NULL DEFAULT 30,
  code_ids VARCHAR(255) DEFAULT '',
  is_hidden TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Family =====
CREATE TABLE IF NOT EXISTS patient (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guarantor_id INT NULL,
  clinic_id INT NULL,
  last_name VARCHAR(60) NOT NULL,
  first_name VARCHAR(60) NOT NULL,
  preferred VARCHAR(60),
  birthdate DATE NULL,
  gender ENUM('M','F','U') NOT NULL DEFAULT 'U',
  status ENUM('Patient','NonPatient','Inactive','Archived','Deceased','Prospective') NOT NULL DEFAULT 'Patient',
  position ENUM('Single','Married','Child','Widowed','Divorced') NOT NULL DEFAULT 'Single',
  wireless_phone VARCHAR(30), home_phone VARCHAR(30), email VARCHAR(120),
  address VARCHAR(200), city VARCHAR(80), state VARCHAR(40), zip VARCHAR(15),
  pri_prov_id INT NULL, sec_prov_id INT NULL,
  fee_schedule_id INT NULL,
  billing_type_id INT NULL,
  medical_alert VARCHAR(255),
  allergies VARCHAR(255),
  note TEXT,
  text_ok TINYINT(1) NOT NULL DEFAULT 1,
  referral_source VARCHAR(120),
  date_first_visit DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (last_name, first_name),
  INDEX (guarantor_id),
  FOREIGN KEY (pri_prov_id) REFERENCES provider(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carrier (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30), address VARCHAR(200),
  payer_id VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ins_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carrier_id INT NOT NULL,
  group_name VARCHAR(120), group_num VARCHAR(40),
  plan_type ENUM('Percentage','PPO','Flat','Medicaid') NOT NULL DEFAULT 'PPO',
  annual_max DECIMAL(12,2) NOT NULL DEFAULT 1500,
  deductible DECIMAL(12,2) NOT NULL DEFAULT 50,
  fee_schedule_id INT NULL,
  date_benefits_verified DATE NULL,
  FOREIGN KEY (carrier_id) REFERENCES carrier(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS benefit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  category VARCHAR(30) NOT NULL,
  percent TINYINT NOT NULL,
  UNIQUE KEY (plan_id, category),
  FOREIGN KEY (plan_id) REFERENCES ins_plan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ins_sub (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  subscriber_id INT NOT NULL,
  subscriber_num VARCHAR(40),
  date_effective DATE NULL,
  FOREIGN KEY (plan_id) REFERENCES ins_plan(id),
  FOREIGN KEY (subscriber_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pat_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  ins_sub_id INT NOT NULL,
  ordinal TINYINT NOT NULL DEFAULT 1,
  relationship ENUM('Self','Spouse','Child','Other') NOT NULL DEFAULT 'Self',
  date_eligibility_verified DATE NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(id),
  FOREIGN KEY (ins_sub_id) REFERENCES ins_sub(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recall (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  recall_type VARCHAR(30) NOT NULL DEFAULT 'Prophy',
  interval_months TINYINT NOT NULL DEFAULT 6,
  date_previous DATE NULL,
  date_due DATE NULL,
  status_id INT NULL,
  reminders_sent TINYINT NOT NULL DEFAULT 0,
  date_last_reminder DATE NULL,
  note VARCHAR(255),
  is_disabled TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY (patient_id, recall_type),
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS referral (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  is_doctor TINYINT(1) NOT NULL DEFAULT 0,
  specialty VARCHAR(60), phone VARCHAR(30), email VARCHAR(120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ref_attach (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  referral_id INT NOT NULL,
  direction ENUM('From','To') NOT NULL DEFAULT 'From',
  ref_date DATE NOT NULL,
  note VARCHAR(255),
  FOREIGN KEY (patient_id) REFERENCES patient(id),
  FOREIGN KEY (referral_id) REFERENCES referral(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Scheduling =====
CREATE TABLE IF NOT EXISTS appointment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  clinic_id INT NULL,
  op_id INT NULL,
  prov_id INT NOT NULL,
  hyg_id INT NULL,
  is_hygiene TINYINT(1) NOT NULL DEFAULT 0,
  apt_datetime DATETIME NULL,
  minutes SMALLINT NOT NULL DEFAULT 30,
  apt_status TINYINT NOT NULL DEFAULT 1,     -- 1 Scheduled 2 Complete 3 UnschedList 5 Broken 6 Planned
  confirmed_id INT NULL,
  unsched_status_id INT NULL,
  priority TINYINT NOT NULL DEFAULT 0,       -- 0 Normal 1 ASAP
  is_new_patient TINYINT(1) NOT NULL DEFAULT 0,
  appt_type_id INT NULL,
  color CHAR(7) NULL,
  note TEXT,
  next_apt_id INT NULL,                      -- planned appt -> scheduled copy
  item_order INT NOT NULL DEFAULT 0,         -- planned appt order
  time_arrived TIME NULL, time_seated TIME NULL, time_dismissed TIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (apt_datetime, op_id),
  INDEX (patient_id),
  INDEX (apt_status),
  FOREIGN KEY (patient_id) REFERENCES patient(id),
  FOREIGN KEY (op_id) REFERENCES operatory(id),
  FOREIGN KEY (prov_id) REFERENCES provider(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blockout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  op_id INT NOT NULL,
  type_id INT NULL,
  start_dt DATETIME NOT NULL,
  stop_dt DATETIME NOT NULL,
  note VARCHAR(255),
  no_schedule TINYINT(1) NOT NULL DEFAULT 0,
  INDEX (start_dt),
  FOREIGN KEY (op_id) REFERENCES operatory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS provider_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prov_id INT NOT NULL,
  weekday TINYINT NOT NULL,
  start_time TIME NOT NULL,
  stop_time TIME NOT NULL,
  FOREIGN KEY (prov_id) REFERENCES provider(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lab_case (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  apt_id INT NULL,
  prov_id INT NULL,
  lab_name VARCHAR(100) NOT NULL,
  instructions TEXT,
  fee DECIMAL(12,2) NULL,
  date_sent DATETIME NULL, date_received DATETIME NULL, date_due DATETIME NULL, date_checked DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Clinical =====
CREATE TABLE IF NOT EXISTS procedure_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  code_id INT NOT NULL,
  prov_id INT NOT NULL,
  apt_id INT NULL,
  planned_apt_id INT NULL,
  tooth VARCHAR(3),
  surf VARCHAR(5),
  fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,  -- 1 TP, 2 Complete, 3 ExistingCurProv, 4 ExistingOther, 5 Referred, 6 Deleted, 7 Condition
  priority TINYINT NOT NULL DEFAULT 0,
  proc_date DATE NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (patient_id, status),
  INDEX (apt_id),
  FOREIGN KEY (patient_id) REFERENCES patient(id),
  FOREIGN KEY (code_id) REFERENCES procedure_code(id),
  FOREIGN KEY (prov_id) REFERENCES provider(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress_note (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  proc_id INT NULL,
  user_id INT NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS treat_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  heading VARCHAR(120) NOT NULL,
  note TEXT,
  proc_ids TEXT,
  signed_by VARCHAR(120) NULL,
  date_signed DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perio_measure (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  exam_date DATE NOT NULL,
  tooth TINYINT NOT NULL,
  depths VARCHAR(40) NOT NULL,     -- 6 sites "3,2,3,3,2,3"
  bleeding VARCHAR(20) DEFAULT '',
  UNIQUE KEY (patient_id, exam_date, tooth),
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS medication_pat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  kind ENUM('Medication','Allergy','Problem') NOT NULL,
  name VARCHAR(120) NOT NULL,
  note VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rx (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  prov_id INT NOT NULL,
  drug VARCHAR(120) NOT NULL,
  sig VARCHAR(255) NOT NULL,
  disp VARCHAR(60), refills VARCHAR(20),
  rx_date DATE NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Account =====
CREATE TABLE IF NOT EXISTS adjustment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  prov_id INT NULL,
  proc_id INT NULL,
  type_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,     -- + adds to balance, - discount
  adj_date DATE NOT NULL,
  note VARCHAR(255),
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,          -- who paid (usually guarantor)
  pay_type_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  pay_date DATE NOT NULL,
  check_num VARCHAR(40),
  note VARCHAR(255),
  user_id INT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pay_split (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  patient_id INT NOT NULL,
  prov_id INT NULL,
  proc_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_prepayment TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS claim (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  pat_plan_id INT NOT NULL,
  claim_type ENUM('P','S','PreAuth') NOT NULL DEFAULT 'P',
  status ENUM('U','W','S','R') NOT NULL DEFAULT 'U',   -- Unsent, Waiting to send, Sent, Received
  date_service DATE NULL,
  date_sent DATE NULL,
  date_received DATE NULL,
  claim_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  ins_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  ins_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  write_off DECIMAL(12,2) NOT NULL DEFAULT 0,
  note VARCHAR(255),
  FOREIGN KEY (patient_id) REFERENCES patient(id),
  FOREIGN KEY (pat_plan_id) REFERENCES pat_plan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS claim_proc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NULL,
  proc_id INT NOT NULL,
  patient_id INT NOT NULL,
  pat_plan_id INT NOT NULL,
  status ENUM('Estimate','NotReceived','Received','Preauth') NOT NULL DEFAULT 'Estimate',
  fee_billed DECIMAL(12,2) NOT NULL DEFAULT 0,
  ins_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  write_off_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  ded_applied DECIMAL(12,2) NOT NULL DEFAULT 0,
  ins_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  write_off DECIMAL(12,2) NOT NULL DEFAULT 0,
  INDEX (proc_id),
  INDEX (claim_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  guarantor_id INT NOT NULL,
  principal DECIMAL(12,2) NOT NULL,
  apr DECIMAL(5,2) NOT NULL DEFAULT 0,
  pay_amount DECIMAL(12,2) NOT NULL,
  date_first DATE NOT NULL,
  frequency ENUM('Weekly','Monthly') NOT NULL DEFAULT 'Monthly',
  note VARCHAR(255),
  is_closed TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repeat_charge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  code_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date_start DATE NOT NULL,
  date_stop DATE NULL,
  last_posted DATE NULL,
  note VARCHAR(255),
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS statement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guarantor_id INT NOT NULL,
  date_sent DATE NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  mode ENUM('Mail','Email','InPerson','Electronic') NOT NULL DEFAULT 'Email',
  note VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Communication / Imaging / Manage =====
CREATE TABLE IF NOT EXISTS commlog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  comm_type VARCHAR(30) NOT NULL DEFAULT 'Misc',   -- Appointment, Recall, Financial, Misc, Text, Email
  mode ENUM('None','Phone','Email','Text','Mail','InPerson') NOT NULL DEFAULT 'Phone',
  note TEXT NOT NULL,
  user_id INT NULL,
  comm_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descript TEXT NOT NULL,
  patient_id INT NULL,
  assigned_user_id INT NULL,
  created_by INT NULL,
  date_due DATE NULL,
  is_done TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS document (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  category_id INT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime VARCHAR(80),
  description VARCHAR(255),
  tooth VARCHAR(10),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS time_clock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS supply (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60),
  supplier VARCHAR(120),
  qty_on_hand INT NOT NULL DEFAULT 0,
  qty_min INT NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  permission VARCHAR(60) NOT NULL,
  patient_id INT NULL,
  log_text VARCHAR(1000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (created_at), INDEX (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- ===== v2: integrations, messaging, portal, forms, bridges =====
CREATE TABLE IF NOT EXISTS integration_setting (
  name VARCHAR(40) PRIMARY KEY,           -- clearinghouse, email, sms, erx, imaging_import, portal
  config JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS message_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NULL,
  channel ENUM('sms','email') NOT NULL,
  direction ENUM('out','in') NOT NULL DEFAULT 'out',
  to_addr VARCHAR(160) NOT NULL,
  subject VARCHAR(200),
  body TEXT NOT NULL,
  status ENUM('queued','sent','failed','test','received') NOT NULL DEFAULT 'queued',
  error VARCHAR(500),
  kind VARCHAR(30) NOT NULL DEFAULT 'manual',   -- manual, reminder, confirmation, recall, statement, portal
  apt_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (patient_id), INDEX (kind, apt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS claim_file (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('837','835','270','271') NOT NULL,
  file_name VARCHAR(120) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  claim_ids VARCHAR(500),
  status ENUM('created','uploaded','imported','failed','test') NOT NULL DEFAULT 'created',
  note VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS portal_token (
  token CHAR(48) PRIMARY KEY,
  patient_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS web_request (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('booking','message','new_patient') NOT NULL,
  patient_id INT NULL,
  apt_id INT NULL,
  data JSON NOT NULL,
  is_handled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sheet_def (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  kind VARCHAR(30) NOT NULL DEFAULT 'PatientForm',   -- PatientForm, MedicalHistory, Consent, RoutingSlip, LabSlip, Rx
  width SMALLINT NOT NULL DEFAULT 850,
  height SMALLINT NOT NULL DEFAULT 1100,
  fields JSON NOT NULL,
  show_in_portal TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sheet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sheet_def_id INT NOT NULL,
  patient_id INT NOT NULL,
  values_json JSON NOT NULL,
  source ENUM('office','portal','kiosk') NOT NULL DEFAULT 'office',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sheet_def_id) REFERENCES sheet_def(id),
  FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS program_link (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(30) NOT NULL,       -- Imaging, Payments, Perio, Ortho, AI, Communication, Accounting, Collections, EHR, Other
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  launch_type ENUM('url','command','none') NOT NULL DEFAULT 'command',
  path VARCHAR(500),                   -- exe path or URL template
  args VARCHAR(500),                   -- e.g. "/patid=[PatNum] /name=\"[LName], [FName]\""
  note VARCHAR(500),
  show_on_toolbar TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
