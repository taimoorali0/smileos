# Installing SmileOS on an Ubuntu server

## What you need
- An Ubuntu 22.04 or 24.04 server (2 GB RAM or more) with a public IP address.
- A domain in Cloudflare, e.g. `marg101.com`.

## 1. DNS record in Cloudflare (DNS → Records)
| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `smileos` | server IP | DNS only (grey) during install |

Everyone uses this one address. Staff type their **clinic code** on the sign-in page; patient links look like `https://smileos.marg101.com/book?clinic=demo`.

## 2. Install
```bash
ssh root@YOUR_SERVER_IP
git clone https://github.com/taimoorali0/smileos.git /opt/smileos
sudo bash /opt/smileos/deploy/install-ubuntu.sh smileos.marg101.com you@email.com
sudo bash /opt/smileos/deploy/create-superadmin.sh
sudo bash /opt/smileos/deploy/create-demo.sh        # optional demo clinic with sample data
```

## 3. Use it
- Admin console: `https://smileos.marg101.com/superadmin` (two-factor required at first sign-in).
- Create a clinic → you get its **clinic code** and an `admin` login with a one-time password.
- Staff sign in at `https://smileos.marg101.com` with clinic code + username + password. The clinic code is remembered on that computer.
- Demo: clinic code `demo`, `admin` / `smileos123`.
- Optional: separate addresses per clinic (`demo.smileos.marg101.com`) – add a `*.smileos` DNS record, run the installer with `CF_API_TOKEN=...` and set `CLINIC_SUBDOMAINS=1` in `/etc/smileos.env`.

## Updating
```bash
sudo bash /opt/smileos/deploy/update.sh
```

## Backups
Every night all clinic databases and uploaded images are encrypted with `/etc/smileos-backup.key` and saved in `/var/backups/smileos` (30 days).
**Copy the key and the backups to another place** (another server or encrypted cloud storage). Restore with `deploy/restore-backup.sh`.
