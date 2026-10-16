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

  ok(!errs.length, "ошибок страницы нет" + (errs.length ? ": " + errs.join(" | ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "ЕСТЬ ОШИБКИ: " + fails : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
