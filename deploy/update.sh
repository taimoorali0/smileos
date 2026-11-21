#!/usr/bin/env bash
# Updates SmileOS to the latest version from GitHub.
set -euo pipefail
cd /opt/smileos && git pull --ff-only
cd web && npm ci && npm run build
cd ../server && npm ci --omit=dev
set -a; source /etc/smileos.env; set +a
mysql -u root -e "GRANT ALL ON \`smileos%\`.* TO 'smileos'@'localhost'; FLUSH PRIVILEGES;" || true
node src/migrate.js
systemctl restart smileos
echo "Updated."
