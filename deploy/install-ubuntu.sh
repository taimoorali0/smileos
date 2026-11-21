#!/usr/bin/env bash
# SmileOS installer for Ubuntu 22.04 / 24.04 (multi-clinic)
#
# Usage:
#   sudo CF_API_TOKEN=xxxx bash install-ubuntu.sh smileos.marg101.com you@email.com
#
# Clinics get their own address: <clinic>.smileos.marg101.com, the admin console is at
# https://smileos.marg101.com/superadmin. CF_API_TOKEN (Cloudflare token with "Edit zone DNS")
# lets the installer get one HTTPS certificate for the domain and all clinic subdomains.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
REPO="${REPO:-https://github.com/taimoorali0/smileos.git}"
BRANCH="${BRANCH:-main}"
APP_DIR=/opt/smileos

if [[ $EUID -ne 0 ]]; then echo "Run with sudo"; exit 1; fi
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then echo "Usage: sudo CF_API_TOKEN=... bash install-ubuntu.sh your-domain.com you@email.com"; exit 1; fi

echo "==> Installing system packages"
apt-get update -y
apt-get install -y curl git nginx mysql-server certbot python3-certbot-nginx python3-certbot-dns-cloudflare ufw openssl unattended-upgrades
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
dpkg-reconfigure -f noninteractive unattended-upgrades || true   # automatic security updates

echo "==> Creating service user, database account and secrets"
id smileos >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/smileos --shell /usr/sbin/nologin smileos
systemctl enable --now mysql
if [[ ! -f /etc/smileos.env ]]; then
  DB_PASS=$(openssl rand -hex 16)
  mysql -u root -e "CREATE USER IF NOT EXISTS 'smileos'@'localhost' IDENTIFIED BY '${DB_PASS}'; ALTER USER 'smileos'@'localhost' IDENTIFIED BY '${DB_PASS}';"
  cat > /etc/smileos.env <<ENV
NODE_ENV=production
MULTI_TENANT=1
BASE_DOMAIN=${DOMAIN}
DB_HOST=localhost
DB_PORT=3306
DB_USER=smileos
DB_PASSWORD=${DB_PASS}
DB_NAME=smileos
CONTROL_DB=smileos_control
JWT_SECRET=$(openssl rand -hex 32)
APP_KEY=$(openssl rand -hex 32)
PORT=4000
UPLOAD_DIR=/var/lib/smileos/uploads
ENV
  chmod 600 /etc/smileos.env
fi
# Settings from an earlier install may lack the multi-clinic options: add any that are missing
grep -q '^MULTI_TENANT=' /etc/smileos.env || echo 'MULTI_TENANT=1' >> /etc/smileos.env
grep -q '^BASE_DOMAIN=' /etc/smileos.env || echo "BASE_DOMAIN=${DOMAIN}" >> /etc/smileos.env
grep -q '^CONTROL_DB=' /etc/smileos.env || echo 'CONTROL_DB=smileos_control' >> /etc/smileos.env
grep -q '^APP_KEY=' /etc/smileos.env || echo "APP_KEY=$(openssl rand -hex 32)" >> /etc/smileos.env
grep -q '^NODE_ENV=' /etc/smileos.env || echo 'NODE_ENV=production' >> /etc/smileos.env
# Always (re)apply: the app must be able to create one database per clinic (smileos_t_<clinic>)
mysql -u root -e "GRANT ALL ON \`smileos%\`.* TO 'smileos'@'localhost'; FLUSH PRIVILEGES;"
[[ -f /etc/smileos-backup.key ]] || { openssl rand -hex 32 > /etc/smileos-backup.key; chmod 600 /etc/smileos-backup.key; }

echo "==> Downloading and building SmileOS"
if [[ -d "$APP_DIR/.git" ]]; then git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout -q "$BRANCH" && git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else git clone -b "$BRANCH" "$REPO" "$APP_DIR"; fi
cd "$APP_DIR/web" && npm ci && npm run build
cd "$APP_DIR/server" && npm ci --omit=dev
set -a; source /etc/smileos.env; set +a
node src/migrate.js
mkdir -p /var/lib/smileos/uploads && chmod 700 /var/lib/smileos/uploads
chown -R smileos:smileos /var/lib/smileos

echo "==> Creating background service"
cat > /etc/systemd/system/smileos.service <<UNIT
[Unit]
Description=SmileOS dental practice management
After=network.target mysql.service

[Service]
User=smileos
WorkingDirectory=${APP_DIR}/server
EnvironmentFile=/etc/smileos.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now smileos
systemctl restart smileos

echo "==> HTTPS certificate"
CERT_OK=0
if [[ -n "${CF_API_TOKEN:-}" ]]; then
  echo "dns_cloudflare_api_token = ${CF_API_TOKEN}" > /etc/smileos-cloudflare.ini; chmod 600 /etc/smileos-cloudflare.ini
  certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/smileos-cloudflare.ini -d "$DOMAIN" -d "*.$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive && CERT_OK=1
else
  echo "!! CF_API_TOKEN not given: getting a certificate for ${DOMAIN} only. Clinic subdomains need the wildcard certificate (see deploy/README.md)."
  systemctl stop nginx || true
  certbot certonly --standalone -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive && CERT_OK=1
  systemctl start nginx
fi

echo "==> Configuring Nginx"
SSL=/etc/letsencrypt/live/${DOMAIN}
cat > /etc/nginx/sites-available/smileos <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} *.${DOMAIN};
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} *.${DOMAIN};
    ssl_certificate     ${SSL}/fullchain.pem;
    ssl_certificate_key ${SSL}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    client_max_body_size 30m;
    server_tokens off;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/smileos /etc/nginx/sites-enabled/smileos
rm -f /etc/nginx/sites-enabled/default
if [[ $CERT_OK -eq 1 ]]; then nginx -t && systemctl reload nginx; else echo "!! No certificate yet – fix DNS and run this installer again."; fi

echo "==> Firewall (only SSH, HTTP, HTTPS)"
ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null

echo "==> Encrypted daily backups (kept 30 days in /var/backups/smileos)"
mkdir -p /var/backups/smileos && chmod 700 /var/backups/smileos
cat > /etc/cron.daily/smileos-backup <<'CRON'
#!/bin/sh
# Every SmileOS database + uploaded images, encrypted with /etc/smileos-backup.key (keep a copy of that key somewhere safe!)
set -a; . /etc/smileos.env; set +a
D=$(date +%F)
for db in $(mysql -u "$DB_USER" -p"$DB_PASSWORD" -N -e "SHOW DATABASES LIKE 'smileos%'"); do
  mysqldump -u "$DB_USER" -p"$DB_PASSWORD" --single-transaction --routines "$db" | gzip | \
    openssl enc -aes-256-cbc -pbkdf2 -salt -pass file:/etc/smileos-backup.key -out "/var/backups/smileos/$db-$D.sql.gz.enc"
done
tar -czf - -C /var/lib/smileos uploads | openssl enc -aes-256-cbc -pbkdf2 -salt -pass file:/etc/smileos-backup.key -out "/var/backups/smileos/uploads-$D.tar.gz.enc"
find /var/backups/smileos -type f -mtime +30 -delete
CRON
chmod 700 /etc/cron.daily/smileos-backup

echo
echo "SmileOS is installed."
echo "  1. Create your administrator:   sudo bash ${APP_DIR}/deploy/create-superadmin.sh"
echo "  2. Optional demo clinic:         sudo bash ${APP_DIR}/deploy/create-demo.sh   (https://demo.${DOMAIN})"
echo "  3. Sign in at https://${DOMAIN}/superadmin and create clinics."
echo "  Backup key: /etc/smileos-backup.key  – copy it somewhere safe; backups cannot be restored without it."
