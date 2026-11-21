# Installing SmileOS on an Ubuntu server

## What you need
- An Ubuntu 22.04 or 24.04 server (2 GB RAM or more) with a public IP address.
- A domain in Cloudflare, e.g. `marg101.com`.

## 1. DNS records in Cloudflare (DNS → Records)
| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `smileos` | server IP | DNS only (grey) |
| A | `*.smileos` | server IP | DNS only (grey) |

The second record makes every clinic address work (`drkhan.smileos.marg101.com`, `demo.smileos.marg101.com`, …).

## 2. Cloudflare API token (for the HTTPS certificate covering all clinics)
Cloudflare → My Profile → API Tokens → Create Token → **Edit zone DNS** → Zone: `marg101.com` → Create. Copy the token.

## 3. Install
```bash
ssh root@YOUR_SERVER_IP
git clone https://github.com/taimoorali0/smileos.git /opt/smileos
sudo CF_API_TOKEN=paste-token-here bash /opt/smileos/deploy/install-ubuntu.sh smileos.marg101.com you@email.com
sudo bash /opt/smileos/deploy/create-superadmin.sh
sudo bash /opt/smileos/deploy/create-demo.sh        # optional demo clinic with sample data
```

## 4. Use it
- Admin console: `https://smileos.marg101.com/superadmin` (two-factor required at first sign-in).
- Create a clinic → it gets `https://<clinic>.smileos.marg101.com` and an `admin` login with a one-time password.
- Demo: `https://demo.smileos.marg101.com` – `admin` / `smileos123`.

## Updating
```bash
sudo bash /opt/smileos/deploy/update.sh
```

## Backups
Every night all clinic databases and uploaded images are encrypted with `/etc/smileos-backup.key` and saved in `/var/backups/smileos` (30 days).
**Copy the key and the backups to another place** (another server or encrypted cloud storage). Restore with `deploy/restore-backup.sh`.
