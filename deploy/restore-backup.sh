#!/usr/bin/env bash
# Restore one encrypted database backup:  sudo bash restore-backup.sh /var/backups/smileos/smileos_t_demo-2026-11-21.sql.gz.enc
set -euo pipefail
F="$1"; DB=$(basename "$F" | sed -E 's/-[0-9]{4}-[0-9]{2}-[0-9]{2}\.sql\.gz\.enc$//')
read -r -p "This replaces all data in database $DB. Type YES to continue: " ok; [[ "$ok" == "YES" ]] || exit 1
set -a; source /etc/smileos.env; set +a
mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB\`"
openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/etc/smileos-backup.key -in "$F" | gunzip | mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB"
echo "Restored $DB"
