// «Подземная лаборатория» для компьютера (Windows). Вся игра лежит рядом, в
// resources/game, и открывается по своему адресу app://lab — сеть не нужна.
// Мышь не нужна: управление целиком с клавиатуры (руководство → «Клавиатура»).
//
// Голоса — все синтезаторы, что стоят у игрока: голос NVDA и голос JAWS (игра
// говорит через чтец экрана тем, что в нём выбрано), RHVoice и eSpeak NG из
// NVDA (сами, даже без запущенного NVDA), сторонние голоса SAPI 5 (Acapela,
// Vocalizer, RHVoice для SAPI и другие, в том числе 32-битные). Голосов
// Microsoft в игре нет. Мост голосов — общий с «Гранью Миров» (desktop/sapi.js
// в корне репозитория): при сборке он кладётся рядом с этим файлом.
// Если у игрока нет ни одного такого голоса, игра говорит встроенным eSpeak NG.
//
// Сборок две: 64-битная (Electron 44, Windows 10 и 11) и 32-битная (Electron 22 —
// последний с 32-битной Windows, Windows 7 и 8; идёт и на 64-битной Windows).
// Этот файл работает в обеих.
const { app, BrowserWindow, protocol, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let SapiMod = null;
for (const p of ['./sapi.js', '../../desktop/sapi.js']) { try { SapiMod = require(p); break; } catch (_) { } }

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
}]);
// Звук с первой секунды, без щелчка мышью: игроку нечем «разрешить» звук.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const VERSION = 'Альфа 1.2';
const TITLE = 'Подземная лаборатория ' + VERSION;
// Самопроверка (сборка на серверах GitHub): игра проходит все этажи, пишет
// итог в журнал и закрывается с кодом 0 (всё хорошо) или 1.
const SELFTEST = process.argv.includes('--lab-selftest');
const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, '..');
// 32-битная сборка держит сохранения в своей папке: её Chromium старше и не
// читает хранилище 64-битной сборки — стёр бы его, а с ним и сохранения.
if (process.arch === 'ia32') app.setPath('userData', path.join(app.getPath('appData'), 'Подземная лаборатория (32 бит)'));

// ── ЖУРНАЛ ── (папка данных игры: %APPDATA%\Подземная лаборатория\lab.log;
// у 32-битной сборки — %APPDATA%\Подземная лаборатория (32 бит)\lab.log)
// В игре журнал пишется в фоне: запись на диск (антивирус проверяет каждую)
// не держит главный процесс, а с ним — клавиши и речь.
let logFile = '', logStream = null;
function log(m) {
  const line = new Date().toISOString().slice(11, 23) + ' ' + String(m);
  try { console.log(line); } catch (_) { }
  if (logFile) {
    if (SELFTEST) { try { fs.appendFileSync(logFile, line + '\n', 'utf8'); } catch (_) { } }
    else {
      try { if (!logStream) { logStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' }); logStream.on('error', () => { logFile = ''; }); } logStream.write(line + '\n'); } catch (_) { }
    }
  }
  if (SELFTEST) {
    const r = /^selftest (ok|FAIL)/.exec(String(m));
    if (r) setTimeout(() => app.exit(r[1] === 'ok' ? 0 : 1), 400);
  }
}

// ── ГОЛОСА КОМПЬЮТЕРА ──
const sapi = SapiMod && process.platform === 'win32' ? new SapiMod.Sapi() : null;
let ttsState = sapi ? 'init' : 'failed';
const sapiReady = sapi ? sapi.start(12000).then(ok => { ttsState = sapi.ready ? 'ready' : 'failed'; return ok; }).catch(() => { ttsState = 'failed'; return false; }) : Promise.resolve(false);
function voices() { try { return sapi && sapi.ready ? sapi.list() : []; } catch (_) { return []; } }
// Состояние голосов — в окно игры сразу, как только оно меняется: окно
// держит его у себя и на вопросы игры отвечает мгновенно, не спрашивая
// главный процесс и не дожидаясь его.
function ttsInfo() { return { state: ttsState, voices: voices(), diag: sapi ? sapi.diag() : (process.platform === 'win32' ? 'мост голосов не найден' : 'не Windows') }; }
function pushTts() { if (win && !win.isDestroyed()) win.webContents.send('lab-tts-state', ttsInfo()); }

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.webm': 'audio/webm', '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};
// Файл игры по адресу app://lab/…; пусто — адрес ведёт за пределы игры.
function gameFile(url) {
  let rel;
  try { rel = decodeURIComponent(new URL(url).pathname); } catch (_) { return ''; }
  if (!rel || rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  return file.startsWith(ROOT) ? file : '';
}
async function serve(request) {
  const file = gameFile(request.url);
  if (!file) return new Response('forbidden', { status: 403 });
  let st;
  try { st = await fs.promises.stat(file); } catch (_) { return new Response('not found', { status: 404 }); }
  if (!st.isFile()) return new Response('not found', { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = st.size;
  const range = request.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let s = 0, e = size - 1;
    if (m) {
      if (m[1] === '' && m[2] !== '') s = Math.max(0, size - Number(m[2]));
      else { s = Number(m[1] || 0); if (m[2] !== '') e = Number(m[2]); }
    }
    e = Math.min(e, size - 1);
    if (s > e || s >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const fh = await fs.promises.open(file, 'r');
    const buf = Buffer.alloc(e - s + 1);
    try { await fh.read(buf, 0, buf.length, s); } finally { await fh.close(); }
    return new Response(buf, { status: 206, headers: { 'Content-Type': type, 'Content-Length': String(buf.length), 'Content-Range': `bytes ${s}-${e}/${size}`, 'Accept-Ranges': 'bytes' } });
  }
  const data = await fs.promises.readFile(file);
  return new Response(data, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
}

let win = null;
function js(code) { if (win && !win.isDestroyed()) win.webContents.executeJavaScript(code).catch(() => { }); }

function createWindow() {
  const icon = path.join(ROOT, 'icon-512.png');
  win = new BrowserWindow({
    width: 1100, height: 800, show: false, title: TITLE, backgroundColor: '#0b0d12',
    autoHideMenuBar: true, icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false, spellcheck: false
    }
  });
  // Клавиши приложения: F11 — во весь экран. Сочетания браузера (обновить
  // страницу, инструменты разработчика) отключены: они сбили бы игру.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); return; }
    const k = String(input.key || '').toLowerCase();
    if ((input.control || input.meta) && (k === 'r' || k === 'w' || k === 'p' || (input.shift && k === 'i'))) event.preventDefault();
    if (input.key === 'F12' || input.key === 'F5') event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) e.preventDefault(); });
  // Electron 44: уровень и текст — в самом событии; Electron 22 (32-битная
  // сборка): отдельными значениями, уровень — числом (3 — ошибка).
  win.webContents.on('console-message', (e, level, message) => {
    const lv = e && e.level !== undefined ? e.level : level, msg = e && e.message !== undefined ? e.message : message;
    if (SELFTEST || lv === 'error' || lv === 3) log('console: ' + msg);
  });
  win.webContents.on('render-process-gone', (e, d) => { log('render-process-gone ' + (d && d.reason)); if (SELFTEST) app.exit(3); });
  win.on('page-title-updated', e => e.preventDefault());
  win.once('ready-to-show', () => { win.show(); win.focus(); win.webContents.focus(); });
  // Закрытие окна (Alt+F4, «Закрыть приложение»): игра сперва пишет автозапись.
  let closing = false;
  win.on('close', e => {
    if (closing) return;
    closing = true; e.preventDefault();
    const done = () => { if (win && !win.isDestroyed()) win.destroy(); };
    win.webContents.executeJavaScript('try{window.labPause&&window.labPause()}catch(e){}').catch(() => { }).then(done);
    setTimeout(done, 1500);
  });
  // Конец фразы голосом компьютера — в игру, тем же вызовом, что на Android,
  // и в окно (оно знает, говорит ли мост сейчас, — не спрашивая главный процесс).
  if (sapi) {
    sapi.onDone = (kind, id) => {
      if (win && !win.isDestroyed()) win.webContents.send('lab-tts-end', kind, String(id));
      if (kind === 'cancel') return;
      js(`window.${kind === 'done' ? 'LabTTSDone' : 'LabTTSError'}&&window.${kind === 'done' ? 'LabTTSDone' : 'LabTTSError'}(${JSON.stringify(String(id))})`);
    };
    // Голоса, появившиеся позже (мост поднялся после открытия игры, запустили
    // или закрыли NVDA и JAWS, «Перечитать голоса»), уходят в игру без перезапуска.
    sapi.onChange = () => { ttsState = sapi.ready ? 'ready' : ttsState; pushTts(); };
  }
  // Игру открываем, когда мост голосов ответил, но не ждём его дольше шести секунд.
  let loaded = false;
  const open = () => { if (loaded || win.isDestroyed()) return; loaded = true; win.loadURL('app://lab/index.html'); };
  sapiReady.then(open); setTimeout(open, 6000);
  sapiReady.then(pushTts);
  win.webContents.on('did-finish-load', () => {
    pushTts();
    log('страница открыта; голоса: ' + ttsState + ', ' + voices().length + (sapi ? '; ' + sapi.diag() : ''));
    if (SELFTEST) setTimeout(() => js('LAB.selftest&&LAB.selftest()'), 1500);
  });
}

// ── МОСТ ДЛЯ ОКНА ИГРЫ (window.LabTTS и window.LabDesktop в preload.js) ──
// Окно спрашивает синхронно только раз, при открытии; дальше состояние
// приходит само (lab-tts-state, lab-tts-end).
ipcMain.on('lab-tts-info', e => { e.returnValue = ttsInfo(); });
ipcMain.on('lab-tts-speaking', e => { e.returnValue = !!(sapi && sapi.speaking.size > 0); });
// Фраза игры — следом за прежней: обрывает речь игра сама (lab-tts-stop), а у
// чтеца экрана фраза встаёт в его очередь, не обрезая недосказанное.
ipcMain.on('lab-tts-speak', (e, text, rate, volume, id) => {
  if (sapi && sapi.ready) sapi.speak(String(text || ''), rate, volume, String(id), { queue: true });
  else { if (win && !win.isDestroyed()) win.webContents.send('lab-tts-end', 'error', String(id)); js(`window.LabTTSError&&window.LabTTSError(${JSON.stringify(String(id))})`); }
});
ipcMain.on('lab-tts-stop', () => { if (sapi) sapi.stop(); });
ipcMain.on('lab-tts-voice', (e, name) => { if (sapi) { sapi.setVoice(String(name || '')); pushTts(); } });
ipcMain.on('lab-tts-diag', e => { e.returnValue = ttsInfo().diag; });
// «Перечитать голоса компьютера»: новый синтезатор (NVDA и JAWS игра замечает и сама).
ipcMain.handle('lab-tts-restart', async () => {
  if (!sapi) return { ready: false, count: 0, diag: 'мост голосов недоступен' };
  await sapi.restart(15000).catch(() => false);
  ttsState = sapi.ready ? 'ready' : 'failed';
  pushTts();
  return { ready: !!sapi.ready, count: voices().length, diag: sapi.diag() };
});
ipcMain.on('lab-log', (e, m) => log(m));
ipcMain.on('lab-quit', () => app.quit());

const single = SELFTEST || app.requestSingleInstanceLock();
if (!single) { if (sapi) sapi.quit(); app.quit(); }
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    logFile = process.env.LAB_LOG || path.join(app.getPath('userData'), 'lab.log');
    try { fs.mkdirSync(path.dirname(logFile), { recursive: true }); fs.writeFileSync(logFile, '', 'utf8'); } catch (_) { logFile = ''; }
    log(TITLE + '; Electron ' + process.versions.electron + ', ' + process.arch + '; игра: ' + ROOT + (SELFTEST ? '; самопроверка' : ''));
    // Electron 25 и новее — protocol.handle. В Electron 22 (32-битная сборка) его
    // нет: там файлы отдаёт обработчик Chromium, он сам отдаёт и части файла (Range).
    if (typeof protocol.handle === 'function') protocol.handle('app', serve);
    else protocol.registerFileProtocol('app', (request, cb) => { const f = gameFile(request.url); cb(f ? { path: f } : { error: -10 }); });
    Menu.setApplicationMenu(null);
    createWindow();
    if (SELFTEST) setTimeout(() => { log('selftest FAIL: нет итога за 150 с'); app.exit(2); }, 150000);
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => { if (sapi) sapi.quit(); });
}
