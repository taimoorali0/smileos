#!/usr/bin/env bash
# Creates or rebuilds the "demo" clinic with sample data (only that clinic is reset).
# Demo logins (clinic code: demo): admin / drkhan / frontdesk / billing, password smileos123
set -euo pipefail
source /opt/smileos/deploy/env.sh
cd /opt/smileos/server
npm ci >/dev/null
run_as_app node src/create-demo.js
echo "Demo clinic: https://${BASE_DOMAIN:-your-domain} – clinic code: demo"
