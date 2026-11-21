# SmileOS

Dental practice management software: appointments, patients and families, insurance, chart, treatment plans, billing, claims, imaging, worklists, reports and setup.
Web-based, installable as an app, and can run on a clinic's own server.

- **Server:** Node.js 20+ (Express) with **MySQL 8**
- **Web app:** React 18 (Vite), SmileOS Navy Classic theme with dark mode
- **Docs:** `docs/ARCHITECTURE.md`, feature reference in `docs/opendental-reference.md`, feature checklist in `FEATURES.md`

## Run it (development)

Requirements: Node.js 20+ and MySQL 8.

```bash
# 1. Database user (run once in MySQL as root)
mysql -u root -e "CREATE USER 'smileos'@'localhost' IDENTIFIED BY 'smileos'; GRANT ALL ON smileos.* TO 'smileos'@'localhost';"

# 2. Server
cd server
cp .env.example .env        # edit DB password and JWT_SECRET
npm install
npm run migrate             # creates the tables
npm run seed                # optional demo data (wipes existing data!)
npm start                   # http://localhost:4000

# 3. Web app (second terminal)
cd web
npm install
npm run dev                 # http://localhost:5173
```

Demo logins (after `npm run seed`), all with password `smileos123`:

| User | Role |
|---|---|
| `admin` | Full access |
| `drkhan` | Dentist |
| `frontdesk` | Front desk |
| `billing` | Billing |

Change these passwords in **Setup → Users & security** before real use.

## Install options

1. **Web (cloud or office server):** build once and the server serves everything on one port:
   ```bash
   cd web && npm run build && cd ../server && npm start
   ```
   Staff open `http://<server>:4000` in Chrome, Edge, Safari or Firefox.
2. **Installable app (PWA):** in Chrome or Edge, open SmileOS and click **Install** in the address bar. It gets a desktop icon, its own window and updates automatically.
3. **Clinic server with Docker:** on the clinic PC or a small server:
   ```bash
   docker compose up -d
   ```
   Set `DB_PASSWORD`, `DB_ROOT_PASSWORD` and `JWT_SECRET` in a `.env` file next to `docker-compose.yml` first.

## Tests

```bash
cd server && npm run seed && npm test
```

The API test suites (17 tests) cover login, schedule rules, insurance estimates, completing appointments, payments, claims, worklists, reports, permissions, 837/835/270 files, messaging, reminders, online booking, the portal, forms and bridges.

## What is included

| Module | Features |
|---|---|
| Appointments | Day schedule by operatory, drag-and-drop moves, click to book, edit appointment, appointment types, blockouts (add, clear day, copy day), pinboard for unscheduled/planned visits, find next opening, waiting room, confirmation status, arrived/seated/dismissed times, complete/break/unschedule, production vs goal |
| Worklists | Confirmation, Recall, ASAP, Unscheduled, Planned tracker, Insurance verification |
| Family | Patient info, family members and guarantor, insurance plans with coverage %, verification dates, recall, medical (allergies, medications, problems), referrals, commlog |
| Chart | Graphical tooth chart, enter treatment (tooth, surfaces, status TP/C/EC/EO/Cn), quick buttons, progress notes, planned appointments, perio chart, prescriptions with allergy warning |
| Treatment Plan | Insurance estimates (deductible, annual max, coverage %, PPO write-off), priorities, signed/saved plans, print |
| Account | Family ledger, payments auto-split to procedures, prepayments, adjustments, claims (send, receive insurance payment), payment plans, repeating charges, statements |
| Imaging | Upload X-rays, photos and PDFs, categories, viewer with brightness/contrast/zoom/invert/rotate |
| Manage | Send claims, billing run, repeating charge posting, A/R aging, tasks, time clock, supply inventory |
| Reports | Production and income by provider, procedures, payments, aging, new patients, treatment finder, dashboard |
| Setup | Practice preferences, providers, operatories, procedure codes and fees, fee tools, appointment types, definitions, provider schedules, users, groups and permissions, audit trail |

## Integrations (v2)

Each integration works in **test mode** out of the box (nothing leaves the server; messages and files are logged). Switch to live mode in **Setup → Integrations** once you have the account.

| Feature | How it works | What you need for live use |
|---|---|---|
| **Electronic claims** | Builds X12 5010 **837D** batches (Manage → Send claims → Send electronically), validates NPI / tax ID / member ID / payer ID first, delivers by SFTP, HTTPS or manual download. **835 ERA** import posts insurance payments and write-offs per procedure. **270** eligibility requests from Family → Insurance. | A clearinghouse account (e.g. DentalXChange, EDS, Change Healthcare): submitter/receiver IDs and SFTP or upload details. Run their test-file certification before switching files to Production. |
| **Texting** | Manual texts (Text / Email button), templates, appointment reminders, recall reminders, thank-you texts, replies: "C" confirms the next appointment. | Twilio account SID, auth token and number. Set the number's webhook to `https://<server>/api/public/sms/twilio`. |
| **Email** | Same as texting, by SMTP. | Any SMTP service login. |
| **Patient portal** (`/portal`) | Patients sign in (last name + birthdate + mobile, or a secure link sent from Family), see appointments and confirm, balance, treatment estimates, fill in forms with signature, message the office. | Server reachable from the internet over HTTPS. |
| **Online booking** (`/book`) | Shows real openings from provider schedules, books the appointment, creates new patients, sends a confirmation text. Bookings show in Manage → Web requests. | Same as the portal. |
| **eRx** | "Open eRx" in Chart → Prescriptions opens DoseSpot by single sign-on. Local prescriptions with allergy warnings work without it. | DoseSpot clinic ID, key and prescriber IDs; test on DoseSpot staging first. |
| **X-ray sensors & cameras** | Camera capture in Imaging (intraoral cameras/webcams); automatic import folder (files named `<patient#>_*.jpg`); sensor software opened through bridges. | Set the sensor software to save into the import folder, or enable its bridge. |
| **Program links (bridges)** | ~95 bridges (Dexis, Sidexis, Carestream, Planmeca, Pearl, Overjet, Florida Probe, OrthoCAD, QuickBooks…) plus custom ones. Buttons appear in Chart and Imaging and pass patient number, name and birthdate. | Program path and arguments from each vendor's integration guide. Command bridges need the desktop app. |
| **Desktop app** (`desktop/`) | Electron app for Windows, macOS and Linux: own window, connects to your server, starts bridged programs. | Build with `npm run dist:win` / `dist:mac`, or run the **Desktop installers** GitHub workflow. |
| **Forms designer** | Setup → Forms designer: drag-and-drop text, inputs, dates, checkboxes and signatures; fields can update the patient record (name, phone, allergies…). Forms are filled in the office, on a tablet, or in the portal. | — |

## Limits to know

- Claim files follow the 5010 837D layout but every clearinghouse runs its own validation; expect a round of test files before going live.
- The DoseSpot login follows their single sign-on method; DoseSpot must approve your integration before production use.
- X-ray sensors cannot be driven directly from a browser; use the sensor vendor's software via a bridge or the import folder.
- The Windows installer must be built on Windows or by the GitHub workflow (this build machine produced the Linux AppImage only). macOS builds need a Mac and an Apple developer certificate for signing.
