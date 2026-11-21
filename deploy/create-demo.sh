#!/usr/bin/env bash
# Creates or rebuilds the "demo" clinic with sample data (only that clinic is reset).
# Demo logins: admin / drkhan / frontdesk / billing, password smileos123
set -euo pipefail
cd /opt/smileos/server
set -a; source /etc/smileos.env; set +a
npm ci >/dev/null
sudo -E -u smileos node src/create-demo.js
echo "Demo clinic: https://demo.${BASE_DOMAIN}"
