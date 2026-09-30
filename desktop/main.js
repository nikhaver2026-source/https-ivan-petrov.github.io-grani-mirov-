// «Грань Миров» для компьютера (Windows). Вся игра лежит рядом, в resources/game,
// и открывается по своему адресу app://grani — сеть не нужна. Мышь не нужна:
// управление целиком с клавиатуры (см. главу «Игра на компьютере» в руководстве).
const { app, BrowserWindow, protocol, Menu, shell, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { Sapi } = require('./sapi.js');
const { VoicePack } = require('./voicepack.js');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
}]);
// Голоса, установленные у игрока в Windows (SAPI 5 и голоса Windows 10/11):
// мост поднимается сразу, пока Electron готовит окно.
const sapi = new Sapi();
const sapiReady = sapi.start(12000).catch(() => false);
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

// Голосовой пакет Gemini — отдельным файлом (см. voicepack.js).
const voicePack = new VoicePack(app);

async function serve(request) {
  const u = new URL(request.url);
  let rel = decodeURIComponent(u.pathname);
  if (!rel || rel === '/') rel = '/index.html';
  if (rel.startsWith('/sounds/gvoice_pack/') && !fs.existsSync(path.join(ROOT, rel))) {
    const data = await voicePack.read(rel.slice('/sounds/gvoice_pack/'.length));
    if (!data) return new Response('not found', { status: 404 });
    const type = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
    return new Response(data, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(data.length) } });
  }
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
  // Конец фразы голосом Windows — в игру, тем же вызовом, что на Android.
  sapi.onDone = (kind, id) => {
    if (win.isDestroyed() || kind === 'cancel') return;
    const fn = kind === 'done' ? 'GraniTTSDone' : 'GraniTTSError';
    win.webContents.executeJavaScript(`window.${fn}&&window.${fn}(${JSON.stringify(String(id))})`).catch(() => { });
  };
  // Игру открываем, когда мост голосов ответил (или не ответил за 8 секунд):
  // список голосов должен быть готов к первому слову.
  sapiReady.then(() => win.loadURL('app://grani/index.html'));
  // Голосовой пакет Gemini — сам, в фоне (см. VoicePack.autoFetch).
  setTimeout(() => voicePack.autoFetch(net, ok => {
    if (!ok || win.isDestroyed()) return;
    win.webContents.executeJavaScript('window.GraniVoicePackDone&&window.GraniVoicePackDone("auto")').catch(() => { });
  }), 4000);
}

// Мост голосов Windows для окна игры (window.GraniTTS в preload.js).
ipcMain.on('tts-info', e => { e.returnValue = { ready: sapi.ready, voices: sapi.list() }; });
ipcMain.on('tts-voices', e => { e.returnValue = JSON.stringify(sapi.list()); });
ipcMain.on('tts-speaking', e => { e.returnValue = sapi.speaking.size > 0; });
ipcMain.on('tts-speak', (e, text, rate, volume, id) => sapi.speak(String(text || ''), rate, volume, String(id)));
ipcMain.on('tts-stop', () => sapi.stop());
ipcMain.on('tts-voice', (e, name) => sapi.setVoice(String(name || '')));
// «Установить голосовой пакет»: игрок выбирает скачанный файл, приложение
// проверяет его и кладёт копию в свою папку данных.
ipcMain.handle('grani-voicepack-install', async e => {
  const win = BrowserWindow.fromWebContents(e.sender);
  let dl = ''; try { dl = app.getPath('downloads'); } catch (_) { }
  const r = await dialog.showOpenDialog(win, { title: 'Голосовой пакет Грани Миров', defaultPath: dl,
    filters: [{ name: 'Голосовой пакет', extensions: ['zip'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths.length) return 'cancel';
  try { return voicePack.install(r.filePaths[0]); } catch (_) { return false; }
});
ipcMain.on('grani-voicepack-info', e => { e.returnValue = voicePack.info(); });

const single = app.requestSingleInstanceLock();
if (!single) { sapi.quit(); app.quit(); }
else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    try { voicePack.load(); } catch (_) { }
    protocol.handle('app', serve);
    ipcMain.on('grani-quit', () => app.quit());
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => sapi.quit());
}
