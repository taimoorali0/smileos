# SmileOS security and HIPAA

SmileOS includes the technical safeguards the HIPAA Security Rule asks for. **Software alone does not make a practice HIPAA compliant**: the practice (and you, as the hosting provider) also need policies, training, a risk assessment and Business Associate Agreements (BAAs).

## Technical safeguards built in

| HIPAA requirement (45 CFR 164.312) | In SmileOS |
|---|---|
| Unique user identification | Every staff member has their own login; shared logins are not needed. Each clinic has its own users and roles. |
| Access control / minimum necessary | Role-based permissions per clinic (Admin, Dentist, Hygienist, Front desk, Billing, custom roles). |
| Automatic logoff | Signed out after 5–60 minutes of inactivity (clinic setting, default 15); warning one minute before; sessions end after 12 hours. |
| Person or entity authentication | Strong password rules, account lockout after 5 wrong attempts, two-factor sign-in (authenticator app), can be required for all users; mandatory for super admins. New and reset accounts must choose their own password. |
| Audit controls | Every sign-in (success and failure), lockout, patient record view and change, payment, claim and security change is logged with user, time and IP. |
| Integrity | Completed procedures and payments cannot be silently deleted; changes are audited. |
| Transmission security | HTTPS only (TLS 1.2/1.3, HSTS); secure, httpOnly, SameSite cookies; CSRF protection. |
| Encryption at rest | Two-factor secrets and integration passwords encrypted (AES-256-GCM); passwords hashed with bcrypt; nightly backups encrypted (AES-256). Use an encrypted disk on the server (most cloud providers offer this) for the database and images. |
| Clinic separation | Each clinic's data lives in its own database; super admins see only counts, never patient records. |

Also: strict Content Security Policy (no third-party scripts or fonts), no caching of patient data in browsers, patient portal links expire, rate limiting on sign-in, registration and booking pages.

## What you still need to do
1. **Sign BAAs** with: your hosting/server provider, Cloudflare (if proxied), Twilio (texting), your email provider, your clearinghouse, DoseSpot. Only use services that sign a BAA.
2. **Encrypt the server disk** and keep the backup key (`/etc/smileos-backup.key`) and off-site backup copies safe.
3. **Risk assessment** and written policies (who gets which role, how accounts are removed when staff leave, incident response, breach notification).
4. **Train staff**; require two-factor in Setup → Users & security.
5. Review the audit trail regularly; keep the server updated (`unattended-upgrades` is enabled by the installer).
