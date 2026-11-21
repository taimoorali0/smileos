# Shared by the deploy scripts: load SmileOS settings and find how the server is run.
if [[ -f /etc/smileos.env ]]; then ENV_FILE=/etc/smileos.env
elif [[ -f /opt/smileos/server/.env ]]; then ENV_FILE=/opt/smileos/server/.env
else echo "No settings file found (/etc/smileos.env or /opt/smileos/server/.env)."; exit 1; fi
set -a; source "$ENV_FILE"; set +a
restart_smileos() {
  if systemctl list-unit-files 2>/dev/null | grep -q '^smileos\.service'; then systemctl restart smileos && echo "Restarted (systemd service smileos)."
  elif command -v pm2 >/dev/null && pm2 jlist 2>/dev/null | grep -q '"name"'; then pm2 restart all && echo "Restarted (pm2)."
  else echo "!! Could not find how SmileOS runs. Restart it yourself (stop the running 'node src/index.js' and start it again in /opt/smileos/server)."; fi
}
run_as_app() { if id smileos >/dev/null 2>&1 && [[ "$ENV_FILE" == /etc/smileos.env ]]; then sudo -E -u smileos "$@"; else "$@"; fi; }
