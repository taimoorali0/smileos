# Dental Practice Management System – Software Architecture

Version 0.1 · Scope: all features in `docs/opendental-reference.md` (Parts 1–7)
Database: **MySQL 8** (required)

> **Implementation note (v1):** the first working version uses **Express + mysql2 (plain SQL)** instead of NestJS + Prisma, to keep the install small and avoid Prisma's engine download. The module layout, MySQL schema and business rules follow this document. Code: `server/` (API) and `web/` (React).

---

## 1. Goals & Constraints

| Goal | Decision |
|---|---|
| Same features as Open Dental, modern UI | Web app (browser), responsive, light/dark theme |
| One practice → many clinics | Multi-clinic in one database (`clinic_id` on scoped tables) |
| Many staff working the same schedule at once | Real-time updates over WebSockets |
| Patient health data (HIPAA-level) | Encryption, role permissions, full audit trail |
| ~90 third-party bridges, payments, texting | Plugin-based Integration layer |
| Small team, fast delivery | **Modular monolith** (one deployable app, strict internal modules) – split later only if needed |

---

## 2. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 18 + TypeScript + Vite** | Large ecosystem, fast dev |
| UI kit | **Tailwind CSS + shadcn/ui**, TanStack Table, TanStack Query | Modern look, fast data grids |
| Scheduler UI | Custom drag-drop grid (dnd-kit) | Operatory × time grid, pinboard, blockouts |
| Tooth / perio charts | SVG components | Crisp, clickable teeth & surfaces |
| Imaging viewer | Cornerstone.js (DICOM) + Fabric.js (annotations) | X-rays, mounts, enhancement |
| Backend | **Node.js 20 + NestJS + TypeScript** | Modules map 1:1 to our domains |
| ORM | **Prisma** (MySQL provider) + migrations | Type-safe queries, versioned schema |
| Database | **MySQL 8 (InnoDB, utf8mb4)** | Required |
| Cache / queues | **Redis + BullMQ** | Scheduled processes, texting, claims, statements |
| Files | **S3-compatible storage** (AWS S3 or self-hosted MinIO) | Images, documents, PDFs |
| Real-time | Socket.IO (NestJS gateway) | Live schedule, waiting room, chat, alerts |
| Auth | JWT access + refresh tokens, optional MFA, badge login | Security |
| PDF / print | Puppeteer (HTML → PDF) | Sheets, statements, routing slips, claims |
| Deploy | Docker Compose (on-prem) or AWS (ECS + RDS MySQL + S3) | Both small offices and cloud |

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                         │
│  Staff Web App (React)   Patient Portal   Kiosk / eClipboard     │
│  Mobile (later)          Web Sched pages  Public API consumers   │
└───────────────┬───────────────────────────┬──────────────────────┘
                │ HTTPS (REST /api/v1)      │ WebSocket (Socket.IO)
┌───────────────▼───────────────────────────▼──────────────────────┐
│  API GATEWAY LAYER (NestJS)                                      │
│  Auth · Permission guard · Clinic scope · Rate limit · Audit hook │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN MODULES (modular monolith)                               │
│  Scheduling │ Patients/Family │ Insurance │ Clinical (Chart/TP)  │
│  Billing/Account │ Claims │ Imaging │ Communication │ Manage     │
│  Setup/Config │ Reports │ eServices │ Integrations │ Security    │
├──────────────────────────────────────────────────────────────────┤
│  SHARED KERNEL                                                   │
│  Definitions engine · Fee engine · Insurance estimate engine     │
│  Sheets/PDF engine · Event bus · Audit · File service            │
└───────┬──────────────┬───────────────┬──────────────┬────────────┘
        │              │               │              │
   ┌────▼────┐   ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼──────────┐
   │ MySQL 8 │   │  Redis    │   │ S3/MinIO  │  │ Worker process │
   │ primary │   │ cache+jobs│   │ files     │  │ (BullMQ jobs)  │
   │ +replica│   └───────────┘   └───────────┘  └─────┬──────────┘
   └─────────┘                                        │
                                   ┌──────────────────▼──────────────┐
                                   │ EXTERNAL: clearinghouses (EDS,  │
                                   │ DentalXChange), SMS, email,     │
                                   │ payments, eRx, imaging bridges, │
                                   │ QuickBooks, AI (Pearl/Overjet)  │
                                   └─────────────────────────────────┘
```

Two runtime processes from one codebase:
- **api** – HTTP + WebSocket
- **worker** – background jobs (scheduled processes, sending, imports)

---

## 4. Domain Modules (backend)

Each module owns its tables, services, controllers, and emits events. Modules talk via service interfaces or the event bus – **never** by writing another module's tables directly.

| Module | Covers (reference parts) | Main entities |
|---|---|---|
| **security** | Users, roles, permissions, audit trail, badges, MFA | user, user_group, permission, audit_log |
| **setup** | Preferences, Definitions, Show Features, Practice/Clinics, Required Fields, Display Fields, Computers | preference, definition, clinic, display_field |
| **patients** (Family) | Patient info, families, Super Family, Clone, referrals, patient fields, merge | patient, family links, referral, patient_field |
| **insurance** | Carriers, plans, subscribers, benefits, history, discount plans, verification, Blue Book | carrier, ins_plan, ins_sub, pat_plan, benefit, discount_plan, ins_verify |
| **scheduling** | Appointments, views, types, rules, blockouts, pinboard, operatories, provider schedules, all 5 lists, lab cases | appointment, appt_type, appt_view, operatory, schedule, blockout, lab_case, recall |
| **clinical** | Chart, procedures, treatment plans, perio, ortho, tooth chart, medical, Rx/eRx, exam sheets, progress notes, auto codes/notes | procedure_log, treat_plan, perio_exam, ortho_chart, med/allergy/problem, rx |
| **billing** (Account) | Ledger, payments + paysplits, adjustments, payment plans, repeating charges, statements, prepayments, income transfer, aging, finance/late charges | payment, pay_split, adjustment, payment_plan, statement, repeat_charge |
| **claims** | Claims, claim procs, preauths, insurance payments, ERAs, batch payments, send claims, claim forms | claim, claim_proc, claim_payment, era |
| **imaging** | Documents, mounts, categories, devices, annotations | document, mount, mount_item, image_category |
| **communication** | Commlog, email, WebMail, texting, letters, labels, popups, tasks, chat, messaging buttons | commlog, email_message, sms, task, popup |
| **manage** | Supplies, time cards, deposits, accounting, backup | supply, time_clock, deposit, journal_entry |
| **sheets** | Forms, routing slips, lab slips, statements, Rx layouts | sheet_def, sheet, sheet_field |
| **reports** | Standard reports, graphic reports, user query, query favorites, treatment finder | report_def, query_favorite |
| **eservices** | Patient portal, Web Sched (recall/new/existing/ASAP), automated messaging, eClipboard, kiosk | web_sched_*, auto_message_rule |
| **integrations** | Program links/bridges, payments, clearinghouses, eRx, HL7, API, QuickBooks, AI | program_link, program_property, api_key |

---

## 5. Shared Engines (the important business logic)

1. **Definitions engine** – Open Dental keeps configurable lists (confirmation statuses, recall/unsched statuses, blockout types, image categories, adjustment types, payment types, billing types, insurance verify statuses, colors). One generic `definition(category, name, abbrev, color, hidden, item_order, flags)` table + typed service.
2. **Fee engine** – resolve fee: clinic + provider fee schedule override → patient fee schedule → provider → practice default; Fee Tools (copy, increase %, round, import/export).
3. **Insurance estimate engine** – per procedure: allowed fee, coverage % by category, deductible, annual max, frequency limits, waiting periods, secondary insurance coordination, write-offs (PPO), discount plans → `ins_estimate`, `write_off_est`, `patient_portion`.
4. **Ledger / balance engine** – charges, payments, splits, adjustments, claim payments → patient balance, family balance (guarantor), aging buckets (0-30/31-60/61-90/90+), unearned income.
5. **Scheduling engine** – slot availability (provider schedule × operatory × blockouts × appointment rules × type restrictions), overlap checks, time patterns, Pinboard search (ProviderTime / ProviderTimeOperatory).
6. **Recall engine** – due date from last completed recall procedure + interval; reminder counts and suppression; family grouping.
7. **Sheets/PDF engine** – template (fields, static text, images, positions) + data binding → HTML → PDF / print / email.
8. **Audit engine** – every create/update/delete writes `audit_log(user, permission, patient, before, after, time)` through an interceptor.

---

## 6. Key Workflows (event driven)

```
Complete appointment
  scheduling.complete(appt)
   → clinical: procedures Complete + locked, progress note
   → billing: post charges (ledger)
   → claims: create claim(s) for primary/secondary (status Unsent)
   → scheduling: recall due date recalculated
   → eservices: queue thank-you message (if enabled)
   → audit + websocket "appointment.updated"
```

```
Insurance payment received (manual or ERA)
  claims.receive(claim, amounts) → claim_proc paid/write-off
   → billing: patient balance recalculated → statement eligibility
```

```
Treatment planned → Planned Appointment → Pinboard → Scheduled
  → Confirmation (manual/eConfirm/SMS reply) → Arrived (Waiting Room)
  → Seated → Dismissed → Complete
  Side paths: Broken → Unsched List / ASAP List
```

Events use an in-process event bus (NestJS EventEmitter) for sync rules and BullMQ for slow/external work (SMS, email, claims to clearinghouse, ERA download, statements batch).

---

## 7. Database Design (MySQL 8)

- One schema `dental_app`; InnoDB; `utf8mb4_unicode_ci`.
- Primary keys `BIGINT UNSIGNED AUTO_INCREMENT`.
- Every table: `created_at`, `updated_at`, `created_by`, `updated_by`; soft delete (`deleted_at`) for clinical/financial rows (never hard-delete money or chart records).
- Money: `DECIMAL(12,2)`. Dates: `DATE` / `DATETIME(3)`; use `NULL` instead of `0001-01-01`.
- `clinic_id` on clinic-scoped tables + composite indexes `(clinic_id, date)`.
- Status columns as `TINYINT` with code enums in code (e.g. AptStatus 1 Scheduled, 2 Complete, 3 UnschedList, 5 Broken, 6 Planned, 7 PtNote, 8 PtNoteCompleted).
- Configurable values → `definition` table FK.
- Encrypted columns (AES via app layer) for SSN, card tokens, sensitive notes.
- Migrations via Prisma; seeds for procedure codes, definitions, default permissions.
- Read replica for reports / user query (user query runs **read-only** on replica).
- `db/schema.sql` (v0) will be replaced by the Prisma schema (~180 tables) grouped by module.

---

## 8. Frontend Architecture

```
web/src/
  app/            routing, layout shell, theme, auth
  modules/
    appointments/ schedule grid, pinboard, lists, edit dialog
    family/       patient, insurance, recall, referrals
    account/      ledger, payments, claims, plans, statements
    treatplan/    plans, estimates, signatures
    chart/        tooth chart, progress notes, perio, ortho, medical, rx
    imaging/      viewer, mounts, capture
    manage/       claims queue, billing, deposits, time clock, supplies
    setup/        all setup screens (auto-generated forms where possible)
    reports/
  components/     design system (Button, DataGrid, Dialog, DatePicker, MoneyInput...)
  lib/            api client (generated from OpenAPI), socket, permissions, formatters
```

UI layout (new look):
- **Left sidebar**: Appointments · Family · Account · Treatment Plan · Chart · Imaging · Manage
- **Top bar**: patient search (Ctrl+K command palette), selected patient chip, clinic switcher, toolbar actions (Commlog, Email, Text, Letter, Forms, Tasks, Labels, Popups), notifications
- **Right drawer**: patient summary card (alerts, balance, insurance, next appt)
- Data grids with saved column layouts (= Display Fields)
- Permission-aware UI: hide/disable actions the user can't do (server still enforces)

---

## 9. Security & Compliance

- RBAC: user groups → permission list (mirror Open Dental names: AppointmentCreate, AppointmentMove, PaymentCreate, ProcComplEdit, etc.), plus date-lock rules ("can't edit completed procs older than N days").
- Clinic restrictions per user.
- Password hashing (Argon2), MFA (TOTP), session timeout, badge login.
- TLS everywhere; encryption at rest (MySQL TDE / RDS encryption, S3 SSE).
- Audit log for every PHI read of sensitive screens and every write.
- Automated backups: nightly MySQL dump + binlog point-in-time recovery; S3 versioning.

---

## 10. Integrations Layer

- `ProgramLink` plugin interface: `{ id, name, category, properties schema, launch(patient) | sync() | webhook() }`.
- Categories: Imaging bridges (launch with patient ID / command-line or URL), Payments (tokenized cards; no raw card data stored), Clearinghouse (X12 837 claims, 270/271 eligibility, 835 ERA), eRx (DoseSpot), Texting/Email providers, Accounting (QuickBooks Online), AI imaging (Pearl, Overjet), HL7/HIE.
- Public REST API with API keys + per-key permissions (= API Setup).
- Webhooks out for events (appointment.created, payment.created…).

---

## 11. Deployment

```
docker-compose.yml
  web      (nginx serving React build, reverse proxy /api)
  api      (NestJS)
  worker   (NestJS worker mode)
  mysql    (8.x)
  redis
  minio    (optional, if not using AWS S3)
```
Cloud option: AWS ECS Fargate (api/worker) + RDS MySQL (Multi-AZ) + ElastiCache Redis + S3 + CloudFront.
Environments: dev → staging → production. CI: lint, unit tests, API tests, Prisma migration check.

---

### Install options (one codebase)
1. **Web (cloud)** – browser only, hosted on AWS or own server.
2. **Installable PWA** – manifest + service worker; "Install" in Chrome/Edge, desktop icon, own window, auto-update.
3. **Desktop app + on-prem server** – Electron wrapper (Windows .exe / macOS) for local printers, scanners, imaging bridges (command-line launch); clinic server installer = Docker Compose or Windows setup bundling Node + MySQL 8.

App name: **SmileOS** (brand files in brand/: logo, app icon, preloader). Colors: navy #10265F, blue #0875F5, light blue #56B7FF, background #F3F6FB.

## 12. Repository Layout

```
dental-app/
  apps/
    api/        NestJS (modules per section 4)
    worker/     job processors
    web/        React staff app
    portal/     patient portal + Web Sched (later)
  packages/
    shared/     types, enums (AptStatus...), validation (zod)
    ui/         design system
  prisma/       schema.prisma, migrations, seeds
  docs/         ARCHITECTURE.md, opendental-reference.md
  docker-compose.yml
```

---

## 13. Delivery Roadmap

| Phase | Content |
|---|---|
| 0. Foundation | Repo, auth, users/permissions, clinics, definitions, audit, design system, app shell |
| 1. Patients | Family module, patient search, insurance plans & benefits |
| 2. Scheduling | Operatories, provider schedules, appointment grid, edit appt, types, blockouts, pinboard, 5 lists |
| 3. Clinical | Procedure codes & fees, chart, tooth chart, progress notes, treatment plans + estimates |
| 4. Account | Ledger, payments/splits, adjustments, statements, payment plans |
| 5. Insurance claims | Claims, claim forms, insurance payments, ERA, clearinghouse |
| 6. Imaging | Upload, viewer, mounts, categories |
| 7. Manage & Reports | Billing batches, deposits, time clock, supplies, standard reports, user query |
| 8. eServices | Texting, automated messaging, patient portal, Web Sched, kiosk/eClipboard |
| 9. Integrations | Payments, eRx, imaging bridges, QuickBooks, API |
