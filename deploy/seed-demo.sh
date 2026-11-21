#!/usr/bin/env bash
# Loads demo data (ERASES all existing data). Login: admin / smileos123
set -euo pipefail
read -r -p "This deletes ALL data in SmileOS and loads demo data. Type YES to continue: " ok
[[ "$ok" == "YES" ]] || exit 1
cd /opt/smileos/server
npm ci >/dev/null
set -a; source /etc/smileos.env; set +a
node db/seed.js
echo "Done. Change the admin password in Setup -> Users & security."
