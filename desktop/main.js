// «Грань Миров» для компьютера (Windows). Вся игра лежит рядом, в resources/game,
// и открывается по своему адресу app://grani — сеть не нужна. Мышь не нужна:
// управление целиком с клавиатуры (см. главу «Игра на компьютере» в руководстве).
const { app, BrowserWindow, protocol, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
}]);
// Звук с первой секунды, без щелчка мышью: игроку нечем «разрешить» звук.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac', '.wav': 'audio/wav',
  '.m4a': 'audio/mp4', '.webm': 'audio/webm', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

async function serve(request) {
  const u = new URL(request.url);
  let rel = decodeURIComponent(u.pathname);
  if (!rel || rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) return new Response('forbidden', { status: 403 });
  let st;
  try { st = await fs.promises.stat(file); } catch (_) { return new Response('not found', { status: 404 }); }
  if (!st.isFile()) return new Response('not found', { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = st.size;
  const range = request.headers.get('range');
  if (range) {
    // Длинные записи (музыка, фоны) браузерный плеер читает кусками.
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let s = 0, e = size - 1;
    if (m) {
      if (m[1] === '' && m[2] !== '') { s = Math.max(0, size - Number(m[2])); }
      else { s = Number(m[1] || 0); if (m[2] !== '') e = Number(m[2]); }
    }
    e = Math.min(e, size - 1);
    if (s > e || s >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const fh = await fs.promises.open(file, 'r');
    const buf = Buffer.alloc(e - s + 1);
    try { await fh.read(buf, 0, buf.length, s); } finally { await fh.close(); }
    return new Response(buf, { status: 206, headers: {
      'Content-Type': type, 'Content-Length': String(buf.length), 'Content-Range': `bytes ${s}-${e}/${size}`, 'Accept-Ranges': 'bytes' } });
  }
  const data = await fs.promises.readFile(file);
  return new Response(data, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
}

function createWindow() {
  const icon = path.join(ROOT, 'icon-512.png');
  const win = new BrowserWindow({
    width: 1100, height: 800, show: false, title: 'Грань Миров', backgroundColor: '#12121e',
    autoHideMenuBar: true, icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false, spellcheck: false
    }
  });
  // Клавиши приложения: F11 — во весь экран. Прочие сочетания браузера
  // (обновить страницу, инструменты разработчика) отключены: они сбили бы игру.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    const k = String(input.key || '').toLowerCase();
    if ((input.control || input.meta) && (k === 'r' || k === 'w' || (input.shift && k === 'i'))) event.preventDefault();
    if (input.key === 'F12') event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) e.preventDefault(); });
  win.once('ready-to-show', () => { win.show(); win.focus(); win.webContents.focus(); });
  win.loadURL('app://grani/index.html');
}

const single = app.requestSingleInstanceLock();
if (!single) { app.quit(); }
else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    protocol.handle('app', serve);
    ipcMain.on('grani-quit', () => app.quit());
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
