#!/usr/bin/env bash
# Creates (or resets the password of) a SmileOS super admin.
set -euo pipefail
cd /opt/smileos/server
set -a; source /etc/smileos.env; set +a
sudo -E -u smileos node src/create-superadmin.js
