#!/usr/bin/env bash
# SmileOS installer for Ubuntu 22.04 / 24.04
# Usage:  sudo bash install-ubuntu.sh your-domain.com you@email.com
# Installs Node.js 20, MySQL 8, Nginx and a free HTTPS certificate (Let's Encrypt),
# builds SmileOS into /opt/smileos and runs it as a background service.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
REPO="${REPO:-https://github.com/taimoorali0/smileos.git}"
APP_DIR=/opt/smileos

if [[ $EUID -ne 0 ]]; then echo "Run with sudo"; exit 1; fi
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then echo "Usage: sudo bash install-ubuntu.sh your-domain.com you@email.com"; exit 1; fi

echo "==> Installing system packages"
apt-get update -y
apt-get install -y curl git nginx mysql-server certbot python3-certbot-nginx ufw openssl
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating user and database"
id smileos >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/smileos --shell /usr/sbin/nologin smileos
systemctl enable --now mysql
if [[ ! -f /etc/smileos.env ]]; then
  DB_PASS=$(openssl rand -hex 16)
  JWT=$(openssl rand -hex 32)
  mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS smileos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'smileos'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'smileos'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL ON smileos.* TO 'smileos'@'localhost';
FLUSH PRIVILEGES;
SQL
  cat > /etc/smileos.env <<ENV
DB_HOST=localhost
DB_PORT=3306
DB_USER=smileos
DB_PASSWORD=${DB_PASS}
DB_NAME=smileos
JWT_SECRET=${JWT}
PORT=4000
UPLOAD_DIR=/var/lib/smileos/uploads
ENV
  chmod 600 /etc/smileos.env
fi

echo "==> Downloading and building SmileOS"
if [[ -d "$APP_DIR/.git" ]]; then git -C "$APP_DIR" pull --ff-only; else git clone "$REPO" "$APP_DIR"; fi
cd "$APP_DIR/web" && npm ci && npm run build
cd "$APP_DIR/server" && npm ci --omit=dev
set -a; source /etc/smileos.env; set +a
node src/migrate.js
mkdir -p /var/lib/smileos/uploads
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

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now smileos
systemctl restart smileos

echo "==> Configuring Nginx for ${DOMAIN}"
cat > /etc/nginx/sites-available/smileos <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    client_max_body_size 30m;
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
nginx -t && systemctl reload nginx

echo "==> Firewall"
ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null

echo "==> HTTPS certificate"
if certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect; then
  URL="https://${DOMAIN}"
else
  echo "!! Certificate failed. Check that ${DOMAIN} points to this server's IP, then run: sudo certbot --nginx -d ${DOMAIN}"
  URL="http://${DOMAIN}"
fi

mysql -u root smileos -e "INSERT INTO integration_setting (name, config) VALUES ('portal', JSON_OBJECT('public_url', '${URL}')) ON DUPLICATE KEY UPDATE config=JSON_SET(config, '$.public_url', '${URL}')"

echo "==> Daily database backup (kept 14 days in /var/backups/smileos)"
mkdir -p /var/backups/smileos
cat > /etc/cron.daily/smileos-backup <<'CRON'
#!/bin/sh
set -a; . /etc/smileos.env; set +a
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" --single-transaction "$DB_NAME" | gzip > /var/backups/smileos/smileos-$(date +%F).sql.gz
tar -czf /var/backups/smileos/uploads-$(date +%F).tar.gz -C /var/lib/smileos uploads
find /var/backups/smileos -type f -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/smileos-backup

echo
echo "SmileOS is running at ${URL}"
echo "Next: load demo data with   sudo bash ${APP_DIR}/deploy/seed-demo.sh"
echo "      or create your admin with   sudo bash ${APP_DIR}/deploy/create-admin.sh"
