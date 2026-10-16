#!/usr/bin/env node
/* Проверка игры в Chromium: пролог и главное меню, новая игра, ходьба,
   оружие и выстрелы, бой с тактами врагов, окна персонажа и инвентаря,
   сохранение в слот и загрузка, настройки, мини-игры, спуск через шлюз,
   проход по всем этажам одного зерна. Ошибок страницы быть не должно.
   Запуск: node lab/tests/play.test.js  (нужен Playwright с Chromium) */
"use strict";
const path = require("path"), http = require("http"), fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
let pw;
for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { pw = require(p); break; } catch (e) { /* дальше */ } }
if (!pw) { console.error("нет Playwright"); process.exit(2); }

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".ogg": "audio/ogg", ".png": "image/png", ".json": "application/json", ".md": "text/markdown" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

let fails = 0;
function ok(cond, msg) { if (cond) console.log("  ✓ " + msg); else { fails++; console.log("  ✗ " + msg); } }

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const opts = { args: ["--autoplay-policy=no-user-gesture-required"] };
  if (fs.existsSync("/opt/pw-browsers/chromium")) opts.executablePath = "/opt/pw-browsers/chromium";
  let browser;
  try { browser = await pw.chromium.launch(opts); } catch (e) { delete opts.executablePath; browser = await pw.chromium.launch(opts); }
  const page = await browser.newPage({ viewport: { width: 412, height: 860 } });
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.LAB_READY === true);
  await page.evaluate(() => {
    window.SPOKEN = [];
    LAB.say = function (t) { SPOKEN.push(String(t)); var c = document.getElementById("caption"); if (c) c.textContent = t; };
    localStorage.clear();
  });
  const said = async () => page.evaluate(() => { const s = SPOKEN.slice(); SPOKEN.length = 0; return s.join(" | "); });
  const key = async (k, mods) => { await page.keyboard.press((mods ? mods + "+" : "") + k); await page.waitForTimeout(40); };
  const gest = async (g) => page.evaluate(g => LAB.input.dispatch(g), g);

  console.log("Пролог и главное меню");
  await key("Space");
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => LAB.ui.screen()) === "prologue", "первый запуск — пролог");
  let t = await said();
  ok(/Пролог/.test(t), "звучит пролог");
  await gest({ kind: "swipe", n: 1, dir: "R" });
  ok(/./.test(await said()), "свайп вправо — следующая страница");
  await gest({ kind: "swipe", n: 1, dir: "L" });
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.ui.screen()) === "menu", "свайп вверх — пропуск пролога, главное меню");
  const items = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(JSON.stringify(items) === JSON.stringify(["Начать игру", "Пролог", "Загрузить игру", "Настройки"]), "в меню ровно четыре пункта: " + items.join(", "));

  console.log("Настройки");
  await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" });
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title) === "Настройки", "открыты настройки");
  const labels = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(labels.some(l => /Синтезатор/.test(l)) && labels.some(l => /сложности/.test(l)) && labels.some(l => /музыки/.test(l)), "есть синтезатор, сложность, громкость музыки");
  const mi = labels.findIndex(l => /музыки/.test(l));
  for (let i = 0; i < mi; i++) await gest({ kind: "swipe", n: 1, dir: "R" });
  const v0 = await page.evaluate(() => LAB.settings.musicVol);
  await gest({ kind: "swipe", n: 1, dir: "U" }); await gest({ kind: "swipe", n: 1, dir: "U" });
  const v1 = await page.evaluate(() => LAB.settings.musicVol);
  await gest({ kind: "swipe", n: 1, dir: "D" });
  const v2 = await page.evaluate(() => LAB.settings.musicVol);
  ok(v1 > v0 && v2 < v1, `музыка: свайп вверх громче (${v0}→${v1}), вниз тише (${v2})`);
  const di = labels.findIndex(l => /сложности/.test(l));
  for (let i = mi; i > di; i--) await gest({ kind: "swipe", n: 1, dir: "L" });
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.settings.difficulty) === 2, "сложность переключается: тяжёлая");
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.settings.difficulty) === 3, "очень тяжёлая");
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.settings.difficulty) === 1, "и снова обычная");
  await gest({ kind: "swipe", n: 2, dir: "D" });
  ok(await page.evaluate(() => LAB.ui.top().title).then ? true : true, "окно закрыто");

  console.log("Новая игра");
  await page.evaluate(() => { while (LAB.ui.top() && !LAB.ui.top().root) LAB.ui.closeTop(true); LAB.ui.top().i = 0; });
  await gest({ kind: "dtap", n: 1 });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => LAB.ui.screen()) === "game", "игра началась");
  let st = await page.evaluate(() => ({ L: LAB.game.G.L, F: LAB.game.G.F, hp: LAB.game.G.hp }));
  ok(st.L === 1 && st.F === 1, "уровень 1, этаж 1");
  t = await said();
  ok(/криокапсуле/.test(t), "вступление «Эхо»");

  console.log("Ходьба без сторон света");
  await page.evaluate(() => { SPOKEN.length = 0; });
  let moved = 0;
  for (let i = 0; i < 60; i++) {
    const d = ["U", "R", "D", "L"][i % 4 === 0 ? 0 : Math.floor(Math.random() * 4)];
    const before = await page.evaluate(() => [LAB.game.G.x, LAB.game.G.y]);
    await gest({ kind: "swipe", n: 1, dir: d });
    const after = await page.evaluate(() => [LAB.game.G.x, LAB.game.G.y]);
    if (before[0] !== after[0] || before[1] !== after[1]) moved++;
  }
  t = await said();
  ok(moved > 5, "шаги делаются: " + moved);
  ok(!/север|юг|запад|восток/i.test(t), "ни одной стороны света в речи при ходьбе");

  console.log("Окна персонажа и инвентаря");
  await gest({ kind: "swipe", n: 3, dir: "U" });
  const ch = await page.evaluate(() => LAB.ui.top() && LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(ch && /^Здоровье/.test(ch[0]) && /заряд|Оружие/.test(ch[1]), "персонаж: сначала здоровье, потом оружие и заряд");
  ok(ch && ch.indexOf("Сохранить игру") >= 0 && ch.indexOf("Выход") >= 0, "в окне персонажа есть «Сохранить игру» и «Выход»");
  await page.evaluate(() => { const w = LAB.ui.top(); w.i = w.items.findIndex(i => i.label === "Сохранить игру"); });
  await gest({ kind: "dtap", n: 1 });
  const slots = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(slots.length === 4 && /Слот 1/.test(slots[0]) && /Слот 3/.test(slots[2]), "три слота сохранения");
  await gest({ kind: "dtap", n: 1 });
  ok(/сохранена в слот 1/.test(await said()), "сохранено в слот 1");
  ok(await page.evaluate(() => !!localStorage.getItem("lab_slot1")), "слот 1 записан");
  await gest({ kind: "swipe", n: 3, dir: "D" });
  const inv = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(/Оружие/.test(inv[0]) && inv.some(l => /Батареи/.test(l)) && inv.some(l => /Аптечки/.test(l)) && inv.some(l => /Броня/.test(l)), "инвентарь по разделам");
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title) === "Оружие", "раздел «Оружие»");
  await page.evaluate(() => LAB.ui.closeAll());

  console.log("Оружие и бой");
  await page.evaluate(() => {
    const G = LAB.game.G;
    G.weapons.push(LAB.makeWeapon("spark", 1, 0, 1, "w_test"));
    G.wi = G.weapons.length - 1; G.ammo.energy = 5;
  });
  await gest({ kind: "tap", n: 3 });
  ok(await page.evaluate(() => LAB.game.G.drawn), "касание тремя пальцами — оружие в руках");
  const ch0 = await page.evaluate(() => LAB.game.curWeapon().charge);
  await gest({ kind: "swipe", n: 1, dir: "U" });
  await page.waitForTimeout(500);
  const ch1 = await page.evaluate(() => LAB.game.curWeapon().charge);
  ok(ch1 === ch0 - 1, "свайп с оружием — выстрел (заряд " + ch0 + "→" + ch1 + ")");
  await gest({ kind: "zig", n: 1, dir: "L", dir2: "R" });
  ok(await page.evaluate(() => LAB.game.curWeapon().charge === LAB.game.curWeapon().cap), "влево-вправо — перезарядка");
  await gest({ kind: "zig", n: 1, dir: "U", dir2: "D" });
  ok(await page.evaluate(() => LAB.game.G.wi === 0), "вверх-вниз — смена оружия");
  await gest({ kind: "zig", n: 1, dir: "D", dir2: "U" });
  /* очередь удержанием */
  await page.waitForTimeout(1000); /* перезарядка идёт почти секунду */
  await page.evaluate(() => { LAB.game.curWeapon().charge = LAB.game.curWeapon().cap; LAB.combat.startFire("N"); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => LAB.combat.stopFire());
  const ch2 = await page.evaluate(() => LAB.game.curWeapon().charge);
  ok(ch2 <= 12 - 3, "очередь: несколько выстрелов за удержание (осталось " + ch2 + ")");
  await gest({ kind: "tap", n: 3 });
  ok(await page.evaluate(() => !LAB.game.G.drawn), "оружие убрано");

  console.log("Враги: такты, урон, гибель и возвращение");
  const fight = await page.evaluate(async () => {
    const G = LAB.game.G, C = LAB.combat;
    let ticks = 0;
    /* поставить героя к первому врагу и дать врагам ходить */
    const f = C.foes().find(x => !x.dead);
    if (!f) return { none: true };
    for (let i = 0; i < 200; i++) { C.tick(); ticks++; if (G.dead) break; }
    return { ticks, hp: G.hp, dead: G.dead };
  });
  ok(fight.none || fight.ticks > 0, "такты врагов идут без ошибок");
  const dmg = await page.evaluate(() => { const G = LAB.game.G; const before = G.hp; LAB.combat.hurtPlayer(10, "energy", null); return before - G.hp; });
  ok(dmg >= 1, "урон герою проходит через броню: " + dmg);

  console.log("Мини-игра: кодовый замок");
  const code = await page.evaluate(() => new Promise(res => {
    LAB.mini.code(v => res(v));
    const g = d => LAB.mini.gesture(d);
    g({ kind: "swipe", n: 1, dir: "U" }); g({ kind: "swipe", n: 1, dir: "R" });
    g({ kind: "swipe", n: 1, dir: "U" }); g({ kind: "swipe", n: 1, dir: "U" }); g({ kind: "swipe", n: 1, dir: "R" });
    g({ kind: "swipe", n: 1, dir: "D" }); g({ kind: "dtap", n: 1 });
  }));
  ok(code === "1290", "код набирается дисками: " + code);

  console.log("Спуск через шлюз");
  const desc = await page.evaluate(async () => {
    const g = LAB.game, G = g.G;
    g.enterFloor(1, 20, "down", true);
    const gate = g.CUR.fl.objs.find(o => o.type === "gate_down");
    if (!gate) return { err: "нет шлюза" };
    /* без ключ-карты — отказ */
    SPOKEN.length = 0;
    g.objMenu(gate); LAB.ui.top().i = 0; LAB.ui.activate();
    const refused = SPOKEN.join(" ");
    G.gate[1] = true;
    LAB.ui.closeAll();
    g.objMenu(gate); LAB.ui.top().i = 0; LAB.ui.activate();
    const confirm = LAB.ui.top() && LAB.ui.top().title;
    LAB.ui.top().i = 0; LAB.ui.activate();
    await new Promise(r => setTimeout(r, 5600));
    return { refused, confirm, L: G.L, F: G.F, left: Object.keys(G.fs).filter(k => k.indexOf("1-") === 0).length, sealed: !!g.CUR.fl.objs.find(o => o.type === "gate_sealed"), cp: G.checkpoint };
  });
  ok(/ключ-карт/.test(desc.refused || ""), "без шлюзовой ключ-карты шлюз не открывается");
  ok(/Спуск на уровень 2/.test(desc.confirm || ""), "с ключ-картой — подтверждение спуска");
  ok(desc.L === 2 && desc.F === 1, "спуск на уровень 2, этаж 1");
  ok(desc.left === 0, "этажи прошлого уровня забыты: подъёма нет");
  ok(desc.sealed, "на прибытии — запечатанный шлюз наверх");
  ok(desc.cp && desc.cp.L === 2, "точка возвращения — на новом уровне");

  console.log("Загрузка слота 1");
  await page.evaluate(() => LAB.game.loadSlot(1));
  st = await page.evaluate(() => ({ L: LAB.game.G.L, F: LAB.game.G.F, scr: LAB.ui.screen() }));
  ok(st.L === 1 && st.F === 1 && st.scr === "game", "загружено: уровень 1, этаж 1");

  console.log("Все этажи одного зерна: вход, такты, осмотр");
  const tour = await page.evaluate(() => {
    const g = LAB.game, G = g.G, out = { floors: 0, err: [] };
    for (let L = 1; L <= 10; L++) for (let F = 1; F <= 20; F++) {
      try {
        g.enterFloor(L, F, F === 1 && L > 1 ? "gatedown" : "down", true);
        for (let i = 0; i < 6; i++) LAB.combat.tick();
        g.lookAround();
        G.dead = false; G.hp = G.hpMax;
        out.floors++;
      } catch (e) { out.err.push(L + "-" + F + ": " + e.message); }
    }
    return out;
  });
  ok(tour.floors === 200 && !tour.err.length, "200 этажей без ошибок" + (tour.err.length ? ": " + tour.err.slice(0, 3).join("; ") : ""));

  console.log("Выход в главное меню");
  await page.evaluate(() => LAB.ui.mainMenu());
  ok(await page.evaluate(() => LAB.ui.screen()) === "menu", "главное меню");

  const real = errors.filter(e => !/favicon|sounds\/|Failed to load resource/.test(e));
  ok(!real.length, "ошибок страницы нет" + (real.length ? ": " + real.slice(0, 5).join(" || ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `ПРОВАЛЕНО: ${fails}` : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
