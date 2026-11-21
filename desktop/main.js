// SmileOS desktop app. Opens the SmileOS server in its own window and lets bridges start local programs (imaging, perio, ortho software).
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const configFile = () => path.join(app.getPath('userData'), 'config.json');
const readConfig = () => { try { return JSON.parse(fs.readFileSync(configFile(), 'utf8')); } catch { return {}; } };
const writeConfig = (c) => fs.writeFileSync(configFile(), JSON.stringify(c, null, 2));
let win;

function serverOrigin() { try { return new URL(readConfig().serverUrl).origin; } catch { return null; } }

function open() {
  const cfg = readConfig();
  if (cfg.serverUrl) win.loadURL(cfg.serverUrl);
  else win.loadFile(path.join(__dirname, 'setup.html'));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680, title: 'SmileOS', backgroundColor: '#F3F6FB',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  // Stay on the SmileOS server; open everything else (eRx, payer sites) in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (serverOrigin() && url.startsWith(serverOrigin()) && /\/api\//.test(url)) return { action: 'allow' };
    shell.openExternal(url); return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file://')) return;
    if (serverOrigin() && new URL(url).origin !== serverOrigin()) { e.preventDefault(); shell.openExternal(url); }
  });
  open();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'SmileOS', submenu: [
      { label: 'Change server…', click: () => { const c = readConfig(); delete c.serverUrl; writeConfig(c); open(); } },
      { role: 'reload' }, { role: 'togglefullscreen' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { role: 'toggleDevTools' }] },
  ]));
}

/** Split an argument string, keeping "quoted parts" together. */
function splitArgs(s) {
  const out = []; let cur = ''; let q = false;
  for (const ch of String(s || '')) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ' ' && !q) { if (cur) out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

ipcMain.handle('setup:save', (_e, url) => {
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) throw new Error('Use http:// or https://'); writeConfig({ ...readConfig(), serverUrl: u.toString() }); open(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; }
});
// Launch a bridged program. Only requests from the configured SmileOS server are accepted, and the program file must exist.
ipcMain.handle('bridge:launch', (e, program, args) => {
  const origin = serverOrigin();
  if (!origin || !e.senderFrame.url.startsWith(origin)) return { ok: false, error: 'Not allowed' };
  if (!program || !fs.existsSync(program)) return { ok: false, error: `Program not found: ${program}` };
  try {
    const child = spawn(program, splitArgs(args), { detached: true, stdio: 'ignore', cwd: path.dirname(program), windowsHide: false });
    child.on('error', () => {});
    child.unref();
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
