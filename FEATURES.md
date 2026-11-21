# Dental App – Feature Map (based on Open Dental module tree)
Status: collecting requirements. More pages will be added as the user uploads them.
Design goal: same features as Open Dental, NEW modern look (web app, sidebar nav, cards, dark/light).
Database: MySQL 8 (see db/schema.sql)

## 1. Appointments Module
Reference: https://www.opendental.com/site/0_appointments.html
- Edit Appointment (0_apptedit.html) – patient, provider/hygienist, operatory, time pattern, procedures attached, status, notes, confirmation status
- Blockouts (0_blockouts.html) – block time in schedule (lunch, meetings, reserved types)
- Appointment Pinboard & Search (0_apptsearch.html) – drag appts to pinboard, find next open slot
- Insurance Verification List (0_insverifylist.html) – verify eligibility before upcoming visits
- Appointment Types (0_appointmenttypes.html) – preset length, color, default procedures
- Lab Cases (0_labcases.html) – lab, sent/received/due dates, link to appointment
- Routing Slips (0_routingslips.html) – printable day sheet per patient visit
- Planned Appointments (0_plannedappts.html) – future visits planned from treatment plan
- Appointment Lists (0_appointmentlists.html):
  - Recall List (0_recalllist.html)
  - Confirmation List (0_confirmationlist.html)
  - Planned Appointment Tracker (0_plannedtracker.html)
  - Unscheduled List (0_unscheduledlist.html)
  - ASAP List (0_asaplist.html)

## 2. Family Module
Reference: https://www.opendental.com/site/0_family.html
- Patient info / family members / guarantor
- Insurance Plans: Insurance History, Insurance Benefit Information, Medical Insurance
- Recall
- Discount Plans
- Super Family (link multiple families)
- Clone (patient clone for separate billing)
- Referrals (referred from / to)

## 3. Account Module
- Patient Payments
- Claims (+ Medicare Modifiers)
- Payment Plan
- Insurance Payment Plans
- Repeating Charges
- Insurance Payments (+ ERAs – electronic remittance)
- Statements
- Unearned / Prepayments
- Income Transfer Manager

## 4. Treatment Plan Module
- Treatment plans, priorities, estimates, signatures

## 5. Chart Module
- Procedure Info, Enter Treatment
- Orthodontics (+ Ortho Chart)
- Perio Chart
- Graphical Tooth Chart
- Medical (conditions, allergies, medications)
- Rx / Prescription
- Notes, Exam Sheet, Chart Layout
- eRx integrations: DoseSpot (setup, alerts, allergies, medications, pharmacies, reports, presets),
  Ensora (allergies, quick Rx, drug interaction checks, EPCS, formulary), PDMP

## 6. Imaging Module
- Images / documents per patient
- AI integrations: BetterDiagnostics, Pearl

## 7. Manage Module
- Backup Tool, Supply Inventory, Accounting, Time Cards, Billing,
  Email, Send Claims, Messaging Buttons, Chat

## 8. Main Menu – Setup
- Family / Ins: Insurance Blue Book, Clearinghouses (EDS, DentalXChange)
- Automation, Definitions, Paths, eForms, Fee Schedules, Schedule Setup
- Security (+ Audit Trail)
- Sheets (custom printable forms)
- Program Links / Bridges: Custom Bridges (output file), imaging bridges (Dexis, Carestream, Apteryx,
  Cerec, DTX Studio, Dolphin, etc.), CareCredit (action, transactions, payment, refund, self-service),
  eClinicalWorks, and many more -> build as a generic "Integrations" plugin system


### Program Links – full bridge list (screens 6-9)
eClinicalWorks (installation, bridge modes, demographics, fee schedules, workstation, procedures, technical, troubleshooting, using eCW),
EdgeExpress Setup, eRx Setup (Disabling eRx), EvaSoft, EzDent-i, Ez3D-i, Florida Probe, Genoray Triana, Glidewell,
Global Payments V1/V2, Guru, HandyDentist, HDX Will, HouseCalls, Insurance Answers Plus, iCat, i-Dixel, iRYS,
Jazz Classic, MediaDent, Medit Link, MiPACS, Mountainside, NewTom NNT, Office, One2, OrthoCAD, OrthoComposite,
Ortho Insight 3D, OrthoPlex, Oryx, Overjet, Owandy, PANDA Perio (+advanced), Patient Gallery, Patterson Imaging,
PaySimple, PaySuite, PDMP, Pearl AI, PerioPal, Pixel, Planmeca, Podium, PORTRAY, Practice Booster, Practice by Numbers,
PracticeWeb Reports, PreXion (+Acquire), Progeny, QuickBooks Online, PT Dental, DentalTek Rapid Call, RayMage, Scanora,
Schick CDR Dicom, Shining 3D, Sirona Sidexis, SMARTDent (+New), Sopro, SOTA Cloud, SpeedVision, SteriSimple, TigerView,
Trophy (+Enhanced), Trojan (+Express Collect), Tscan, TSI Setup, UAppoint, Vipersoft, VisionX, visOra, VistaDent,
VixWin (Numbered), Wiki Standalone, XDR, Z-Image, 3Shape.
Integration categories for our plugin system:
- Imaging/X-ray/3D viewers (launch with patient ID)
- Payments (Global Payments, PaySimple, PaySuite, EdgeExpress, CareCredit)
- Perio probes, Ortho software, AI diagnostics (Pearl, Overjet, BetterDiagnostics)
- Patient communication/marketing (Podium, Demandforce, HouseCalls, UAppoint, Rapid Call)
- Accounting/Reports (QuickBooks Online, Practice by Numbers, PracticeWeb)
- Collections (TSI, Trojan Express Collect), Medical EHR (eClinicalWorks)

### Setup – other
- Show Features (enable/disable optional features)
- Scheduled Processes (automated background jobs)

## 9. Lists
- Procedure Codes (+ Fee Tools: https://www.opendental.com/site/0_feeschedtools.html – copy/increase/round fees, import/export, update fees across schedules)
- Clinics (multi-location), Employees, Providers

## 10. Reports
- Standard reports + Treatment Finder Report (unscheduled treatment by insurance benefits remaining)

## 11. Tools
- Kiosk (patient check-in / forms), Billing/Finance Charges, Patient Dashboard, Wiki, Zoom

## 12. eServices Setup
- eServices Signup (Basic, Advanced, About, Help), Patient Portal Settings, SMS Warning Amount
- eConnector (background service linking cloud services)
- eServices Texting: Integrated Texting, Appointment Texts (reminders/confirmations), Texting Terms of Service

## 13. Other
- Feature Requests (user voting board)
- Toolbar (to be detailed)

## Pending
- [x] Full technical reference received: docs/opendental-reference.md (7 parts, ~200 features)
- [ ] Note: opendental.com is blocked from this environment; details come from user uploads + general knowledge
- [ ] Then: UI design (new look) + build
