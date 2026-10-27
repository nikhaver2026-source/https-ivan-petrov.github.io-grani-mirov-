#!/usr/bin/env node
/* Проверка единого обработчика звука (LAB.Sound) и речи (LAB.Speech) в Chromium:
   • записи звучат, предел голосов соблюдается, важный звук не теряется;
   • запись, которой ещё нет в памяти, звучит, как только загрузится;
   • петля, замолчавшая сама, запускается снова; уснувшее устройство
     просыпается; сломанное — пересоздаётся, и петли звучат дальше;
   • речь: очередь по важности, повторы не копятся, устаревшее выбрасывается,
     зависшая фраза не держит очередь.
   Запуск: node lab/tests/sound.test.js */
"use strict";
const path = require("path"), http = require("http"), fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
let pw = null;
for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { pw = require(p); break; } catch (e) { /* дальше */ } }
if (!pw) { console.log("нет playwright — проверка пропущена"); process.exit(0); }
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".ogg": "audio/ogg", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
let fails = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; }
(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const opts = { args: ["--autoplay-policy=no-user-gesture-required"] };
  if (fs.existsSync("/opt/pw-browsers/chromium")) opts.executablePath = "/opt/pw-browsers/chromium";
  let browser;
  try { browser = await pw.chromium.launch(opts); } catch (e) { delete opts.executablePath; browser = await pw.chromium.launch(opts); }
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.LAB && LAB.Sound && LAB.AE, null, { timeout: 20000 });
  const wait = ms => page.waitForTimeout(ms);

  console.log("Единый обработчик звука");
  await page.evaluate(() => { LAB.settings.effects = true; LAB.settings.music = true; LAB.AE.ensure(); });
  await page.evaluate(() => new Promise(r => LAB.Sound.preload(["w_blaster_s", "step_plate", "bump_wall", "ui_click", "amb_l1", "w_shock", "w_power_low"], r)));
  let s = await page.evaluate(() => { const h = LAB.Sound.play("w_blaster_s", {}); return { h: !!h, st: LAB.Sound.state() }; });
  ok(s.h && s.st.ctx === "running", "запись звучит, устройство работает (" + s.st.ctx + ")");

  s = await page.evaluate(() => {
    for (let i = 0; i < 120; i++) LAB.Sound.play("step_plate", { prio: 1 });
    const st = LAB.Sound.state();
    return { voices: st.voices, total: LAB.Sound.LIMIT.total, sameMax: 3 };
  });
  ok(s.voices <= s.total, "предел голосов соблюдён: " + s.voices + " из " + s.total);
  s = await page.evaluate(() => {
    for (let i = 0; i < 60; i++) LAB.Sound.play("bump_wall", { prio: 1, gain: 0.01 });
    const h = LAB.Sound.play("w_shock", {});
    return !!h;
  });
  ok(s, "важный звук (удар дубинки) звучит и в толчее — уступает фон");

  s = await page.evaluate(() => {
    const st0 = LAB.Sound.state().stats.stolen;
    for (let i = 0; i < 12; i++) LAB.UI.tone(440 + i * 40, 0.3, 0, 0.1, 0.3 + i * 0.5);
    return LAB.Sound.state().stats.stolen - st0;
  });
  ok(s === 0, "мелодия из двенадцати нот в расписании — ни одна нота не снята");
  s = await page.evaluate(() => new Promise(res => {
    const id = "w_power_tail";
    LAB.Bank.release([id]);
    const before = LAB.Bank.ready(id);
    LAB.Sound.play(id, { wait: 5000 });
    const q = LAB.Sound.state().pending;
    setTimeout(() => res({ before, q, after: LAB.Sound.state().stats.played }), 2500);
  }));
  ok(!s.before && s.q >= 1, "запись не в памяти — звук ждёт загрузки (в очереди: " + s.q + ")");

  s = await page.evaluate(() => new Promise(res => {
    LAB.Sound.loop("bed", "amb_l1", { bus: "amb", gain: 0.5 });
    setTimeout(() => { const sl = LAB.Sound.state().slots.bed; res({ on: sl && sl.on }); }, 1200);
  }));
  ok(s.on, "петля в ячейке «bed» звучит");
  s = await page.evaluate(() => new Promise(res => {
    const rv0 = LAB.Sound.state().stats.revived;
    /* «обрыв»: источник петли остановился сам, как при сбое устройства */
    LAB.Sound._breakSlot("bed");
    setTimeout(() => { const st = LAB.Sound.state(); res({ rv: st.stats.revived - rv0, on: st.slots.bed && st.slots.bed.on }); }, 2600);
  }));
  ok(s.rv >= 1 && s.on, "петля, замолчавшая сама, запущена снова (перезапусков: " + s.rv + ")");

  s = await page.evaluate(() => new Promise(res => {
    LAB.AE.ctx.suspend().then(() => {
      const st0 = LAB.AE.ctx.state;
      setTimeout(() => res({ st0, st1: LAB.AE.ctx.state }), 2600);
    });
  }));
  ok(s.st0 === "suspended" && s.st1 === "running", "уснувшее устройство проснулось само (" + s.st0 + " → " + s.st1 + ")");

  s = await page.evaluate(() => new Promise(res => {
    const old = LAB.AE.ctx;
    const rb0 = LAB.Sound.state().stats.rebuilt;
    old.close().then(() => {
      setTimeout(() => {
        const st = LAB.Sound.state();
        res({ rebuilt: st.stats.rebuilt - rb0, fresh: LAB.AE.ctx !== old, ctx: st.ctx, bed: st.slots.bed && st.slots.bed.on });
      }, 3500);
    });
  }));
  ok(s.rebuilt >= 1 && s.fresh && s.ctx === "running", "сломанное устройство пересоздано (" + s.ctx + ")");
  ok(s.bed, "после пересоздания петля звучит снова");
  s = await page.evaluate(() => !!LAB.Sound.play("w_blaster_s", {}));
  ok(s, "после пересоздания записи звучат");
  await page.evaluate(() => LAB.Sound.stopLoop("bed", 0.1));

  console.log("Единый обработчик речи");
  s = await page.evaluate(() => {
    const Sp = LAB.Speech;
    if (!Sp.selfTest) return { skip: true };
    return Sp.selfTest();
  });
  if (s.skip) ok(false, "у речи нет самопроверки");
  else (s.checks || []).forEach(c => ok(c[0], c[1]));

  console.log("Записка: Escape закрывает окно и обрывает чтение");
  s = await page.evaluate(async () => {
    const Sp = LAB.Speech, spoken = [];
    const saved = { backend: Sp.backend, eng: Sp.testEngine, speech: LAB.settings.speech, est: Sp.estScale };
    LAB.settings.speech = true; Sp.hush();
    Sp.testEngine = { speak: function (t, id) { spoken.push(t); Sp._started(id); setTimeout(function () { if (Sp.cur && Sp.cur.id === id) Sp._done(); }, 120); }, stop: function () {}, busy: function () { return !!Sp.cur; } };
    Sp.backend = "test"; Sp.estScale = 0.05;
    if (LAB.ui.screen() === "boot") LAB.ui.mainMenu();
    const long = Array.from({ length: 12 }, (_, i) => "Абзац номер " + (i + 1) + " длинной записки, которую читают вслух до конца.").join(" ");
    LAB.ui.note("Проверочная записка", long);
    await new Promise(r => setTimeout(r, 300));
    const before = spoken.filter(t => /Абзац номер/.test(t)).length, open = !!(LAB.ui.top() && LAB.ui.top().note);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const closed = !(LAB.ui.top() && LAB.ui.top().note);
    const n1 = spoken.length;
    await new Promise(r => setTimeout(r, 1500));
    const after = spoken.slice(n1).filter(t => /Абзац номер/.test(t)).length;
    const reading = Sp.noteReading;
    Sp.hush(); Sp.testEngine = saved.eng; Sp.backend = saved.backend; LAB.settings.speech = saved.speech; Sp.estScale = saved.est;
    return { before, open, closed, after, reading };
  });
  ok(s.open && s.before >= 1, "записка открылась окном и читается");
  ok(s.closed && s.after === 0 && !s.reading, "Escape закрыл окно записки — чтение оборвалось и дальше не идёт (после закрытия прозвучало: " + s.after + ")");

  console.log("(3.5) Alt+Tab: приглушение — после ограничителя, речь в фоне ждёт возвращения");
  s = await page.evaluate(async () => {
    const Sp = LAB.Speech, AE = LAB.AE, S = LAB.settings, spoken = [];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const saved = { backend: Sp.backend, eng: Sp.testEngine, speech: S.speech, est: Sp.estScale, dim: S.bgDim };
    S.speech = true; Sp.hush();
    Sp.testEngine = { speak: function (t, id) { spoken.push(t); Sp._started(id); setTimeout(function () { if (Sp.cur && Sp.cur.id === id) Sp._done(); }, 120); }, stop: function () {}, busy: function () { return !!Sp.cur; } };
    Sp.backend = "test"; Sp.estScale = 0.05;
    if (window.labBgReset) window.labBgReset();
    AE.ensure(); try { await AE.ctx.resume(); } catch (e) { /* */ }
    S.bgDim = 1;
    window.dispatchEvent(new Event("blur")); await wait(700);
    const out = { bg: LAB.bg === true, outGain: AE.out ? AE.out.gain.value : -1, masterGain: AE.master.gain.value };
    Sp.say("Проверка: фраза в фоне", { interrupt: false, keep: true });
    await wait(600);
    out.inBg = spoken.filter(t => /фраза в фоне/.test(t)).length;
    window.dispatchEvent(new Event("focus")); await wait(1500);
    out.back = spoken.filter(t => /фраза в фоне/.test(t)).length;
    out.outBack = AE.out ? AE.out.gain.value : -1;
    Sp.hush(); Sp.testEngine = saved.eng; Sp.backend = saved.backend; S.speech = saved.speech; Sp.estScale = saved.est; S.bgDim = saved.dim;
    if (window.labBgReset) window.labBgReset();
    return out;
  });
  ok(s.bg && s.outGain >= 0 && s.outGain < 0.4 && s.masterGain > 0.8, "в фоне со звуком тише последнее звено — после ограничителя: громкие и тихие звуки опускаются поровну (выход " + s.outGain.toFixed(2) + ", вход ограничителя " + s.masterGain.toFixed(2) + ")");
  ok(s.inBg === 0 && s.back === 1 && s.outBack > 0.8, "фраза, сказанная в фоне, ждёт и звучит, когда игра снова на экране (в фоне " + s.inBg + ", после " + s.back + ")");

  /* (3.5) Громкость на самом выходе, а не числа в настройках: с флажком «Приглушать
     звук в фоне» каждый канал — громкий выстрел, тихий фон, музыка, интерфейс, сигналы
     головоломок — в фоне звучит одинаково тише; без флажка устройство в фоне спит, и
     ни звуки, которые игра просит в фоне, ни сторож звука его не будят. */
  console.log("(3.5) Фон: громкость на выходе — с флажком все звуки тише поровну, без флажка — тишина");
  s = await page.evaluate(async () => {
    const AE = LAB.AE, S = LAB.settings, Sp = LAB.Speech, out = { dim: {} };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const dim0 = S.bgDim, speech0 = S.speech, duck0 = AE.setDuck;
    if (window.labBgReset) window.labBgReset();
    AE.ensure(); try { await AE.ctx.resume(); } catch (e) { /* */ }
    /* в замер — только свои тоны: прочие звуки и петли смолкли, речь молчит, и приглушение
       под речь (setDuck: фон и музыка тише, пока говорят) не двигает каналы посреди замера —
       фраза, звучавшая на экране и ждущая в фоне, давала фону 0,35 вместо четверти */
    LAB.Sound.stopAll(0); S.speech = false; if (Sp && Sp.hush) Sp.hush();
    AE.setDuck(false); AE.setDuck = function () { /* на время замера */ }; await wait(1500);
    const c = AE.ctx, an = c.createAnalyser(); an.fftSize = 2048; AE.out.connect(an);
    const buf = new Float32Array(an.fftSize);
    const rms = async () => { let sum = 0, n = 0; for (let k = 0; k < 8; k++) { an.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i++) { sum += buf[i] * buf[i]; n++; } await wait(30); } return Math.sqrt(sum / n); };
    /* величина своего тона на выходе (окно Ханна): прочее, что звучит, в неё не входит */
    const amp = async f => { const N = buf.length, w = 2 * Math.PI * f / c.sampleRate; let a = 0; for (let k = 0; k < 8; k++) { an.getFloatTimeDomainData(buf); let re = 0, im = 0; for (let i = 0; i < N; i++) { const h = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); re += buf[i] * h * Math.cos(w * i); im += buf[i] * h * Math.sin(w * i); } a += Math.hypot(re, im); await wait(30); } return a / 8; };
    const tone = (bus, g, f) => { const o = c.createOscillator(), gg = c.createGain(); o.frequency.value = f; gg.gain.value = g; o.connect(gg); gg.connect(bus); o.start(); return () => { o.stop(); gg.disconnect(); }; };
    /* громкий выстрел жмёт ограничитель, тихий фон — нет: до 3.5 они опускались по-разному */
    const buses = { "выстрел": [AE.weap, 2.5, 330], "фон": [AE.amb, 0.05, 220], "музыка": [AE.music, 0.3, 440], "интерфейс": [AE.ui, 0.2, 660], "головоломка": [AE.puzzle, 0.2, 550] };
    for (const k in buses) {
      const b = buses[k], stop = tone(b[0], b[1], b[2]);
      await wait(400); const fg = await amp(b[2]);
      S.bgDim = 1; window.dispatchEvent(new Event("blur")); await wait(900); const bg = await amp(b[2]);
      window.dispatchEvent(new Event("focus")); await wait(900); const back = await amp(b[2]);
      stop(); await wait(200);
      out.dim[k] = { ratio: fg ? bg / fg : 0, back: fg ? back / fg : 0 };
    }
    /* флажок снят: в фоне устройство спит три секунды подряд, что бы игра ни просила */
    const stop2 = tone(AE.music, 0.3, 440); await wait(300);
    S.bgDim = 0; window.dispatchEvent(new Event("blur")); await wait(300);
    out.muteAt = c.state; let woke = 0;
    for (let t = 0; t < 6; t++) { LAB.Sound.play("ui_click", {}); LAB.Sound.tick(); AE.ensure(); await wait(500); if (c.state === "running") woke++; }
    out.woke = woke;
    window.dispatchEvent(new Event("focus")); await wait(800);
    out.backState = c.state; out.backRms = await rms();
    stop2(); an.disconnect();
    S.bgDim = dim0; S.speech = speech0; AE.setDuck = duck0;
    if (window.labBgReset) window.labBgReset();
    return out;
  });
  const rs = Object.keys(s.dim).map(k => k + " " + s.dim[k].ratio.toFixed(2));
  ok(Object.keys(s.dim).every(k => s.dim[k].ratio > 0.18 && s.dim[k].ratio < 0.34), "с флажком в фоне каждый звук на выходе тише одинаково, около четверти (" + rs.join(", ") + ")");
  ok(Object.keys(s.dim).every(k => s.dim[k].back > 0.8), "вернулись из фона — каждый звук снова в полную громкость");
  ok(s.muteAt === "suspended" && s.woke === 0 && s.backState === "running" && s.backRms > 0.01, "без флажка в фоне — тишина: устройство спит, звуки и сторож его не будят; вернулись — звук снова (" + s.muteAt + ", проснулось " + s.woke + ", после " + s.backState + ")");

  ok(!errs.length, "ошибок страницы нет" + (errs.length ? ": " + errs.join(" | ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "ЕСТЬ ОШИБКИ: " + fails : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
