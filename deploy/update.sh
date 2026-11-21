#!/usr/bin/env bash
# Updates SmileOS to the latest version from GitHub and restarts it.
set -euo pipefail
source /opt/smileos/deploy/env.sh
cd /opt/smileos && git pull --ff-only
cd web && npm ci && npm run build
cd ../server && npm ci --omit=dev
mysql -u root -e "GRANT ALL ON \`smileos%\`.* TO '${DB_USER:-smileos}'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || echo "(could not update MySQL permissions as root – skipped)"
node src/migrate.js
restart_smileos
echo "Updated."
