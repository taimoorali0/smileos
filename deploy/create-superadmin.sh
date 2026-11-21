#!/usr/bin/env bash
# Creates (or resets the password of) a SmileOS super admin.
set -euo pipefail
source /opt/smileos/deploy/env.sh
cd /opt/smileos/server
run_as_app node src/create-superadmin.js
