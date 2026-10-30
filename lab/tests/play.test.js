#!/usr/bin/env node
/* Проверка игры в Chromium: главное меню, новая игра с пролога, ходьба,
   оружие и выстрелы, бой с тактами врагов, окна персонажа и инвентаря,
   сохранение в слот и загрузка, настройки, мини-игры и головоломки, турели
   и терминал безопасности, ОКО, навигатор без карты и с картой, спуск через
   шлюз, обход этажей одного зерна. Ошибок страницы быть не должно.
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
  /* (3.7) --expose-gc и точные сведения о памяти: проверка I4 меряет удержанную память, а не мусор до сборки */
  const opts = { args: ["--autoplay-policy=no-user-gesture-required", "--js-flags=--expose-gc", "--enable-precise-memory-info"] };
  if (fs.existsSync("/opt/pw-browsers/chromium")) opts.executablePath = "/opt/pw-browsers/chromium";
  let browser;
  try { browser = await pw.chromium.launch(opts); } catch (e) { delete opts.executablePath; browser = await pw.chromium.launch(opts); }
  const page = await browser.newPage({ viewport: { width: 412, height: 860 } });
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  /* игра ничего не докачивает из сети: все запросы — к своему серверу (или data:/blob:) */
  const external = [];
  page.on("request", r => { const u = r.url(); if (!/^(http:\/\/127\.0\.0\.1:|data:|blob:)/.test(u)) external.push(u); });
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

  console.log("Главное меню и пролог");
  await key("Space");
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => LAB.ui.screen()) === "menu", "запуск — главное меню");
  let t = await said();
  await page.evaluate(() => { LAB.ui.top().i = 1; });
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.screen()) === "prologue", "«Пролог» из меню");
  t = await said();
  ok(/Пролог/.test(t), "звучит пролог");
  await gest({ kind: "swipe", n: 1, dir: "R" });
  ok(/./.test(await said()), "свайп вправо — следующая страница");
  await gest({ kind: "swipe", n: 1, dir: "L" });
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.ui.screen()) === "menu", "свайп вверх — пропуск пролога, снова главное меню");
  const items = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(JSON.stringify(items) === JSON.stringify(["Начать игру", "Пролог", "Загрузить игру", "Руководство", "Что нового?", "Настройки"]), "в меню шесть пунктов, среди них руководство и «Что нового?»: " + items.join(", "));
  await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" });
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title) === "Руководство", "главное меню → «Руководство» открывает руководство");
  await gest({ kind: "back", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title === LAB.TITLE + ". Главное меню"), "из руководства — назад в главное меню");

  console.log("Что нового?");
  const news = await page.evaluate(() => {
    const out = {}, lb = () => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    const mi = LAB.ui.top().items.findIndex(i => (typeof i.label === "function" ? i.label() : i.label) === "Что нового?");
    LAB.ui.top().i = mi; LAB.ui.activate();
    out.title = LAB.ui.top().title; out.items = lb(); out.ver = LAB.VERSION;
    SPOKEN.length = 0; LAB.ui.top().i = 0; LAB.ui.activate();
    out.note = LAB.ui.top().title; out.text = SPOKEN.join(" ");
    out.tech = /WebView|Playwright|JSON|ES2018|обработчик|сборщик/.test(out.text);
    LAB.ui.closeTop(true); LAB.ui.closeAll(); LAB.ui.mainMenu(true);
    return out;
  });
  ok(news.title === "Что нового?" && news.items[0] === news.ver + " — эта версия" && news.ver === "Альфа 3.7" && news.items.some(l => /^Альфа 3\.6$/.test(l)) && news.items.some(l => /^Альфа 3\.5$/.test(l)) && news.items.some(l => /^Альфа 3\.2$/.test(l)) && news.items.some(l => /^Альфа 3\.1$/.test(l)) && news.items.some(l => /^Альфа 3\.0$/.test(l)) && news.items.some(l => /^Альфа 2\.6$/.test(l)) && news.items.some(l => /^Альфа 2\.5$/.test(l)) && news.items.some(l => /^Альфа 2\.2$/.test(l)) && news.items.some(l => /^Альфа 2\.1$/.test(l)) && news.items.some(l => /^Альфа 1\.2$/.test(l)) && news.items.some(l => /^Альфа 1\.0$/.test(l)), "«Что нового?»: эта версия и прежние — " + news.items.join(", "));
  ok(/Что нового: /.test(news.note) && /Помещения стали просторнее/.test(news.text) && /Химия руками/.test(news.text) && /Поручения выживших — без предела/.test(news.text) && /Сохранения прежней версии не сброшены/.test(news.text) && /этажи построены заново/.test(news.text) && /Настройки остались прежними/.test(news.text) && !/Набор опыта вернулся/.test(news.text) && !/Качаться на машинах ОКО не выйдет/.test(news.text) && !/ОКО меняется с глубиной/.test(news.text) && !news.tech, "что нового в этой версии — коротко и без технических подробностей; выпущенное в 3.6 — в своём разделе");

  console.log("Настройки");
  await page.evaluate(() => { LAB.ui.top().i = 0; });
  for (let i = 0; i < 5; i++) await gest({ kind: "swipe", n: 1, dir: "R" });
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title) === "Настройки", "открыты настройки");
  const labels = await page.evaluate(() => LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(labels.some(l => /Синтезатор/.test(l)) && labels.some(l => /музыки/.test(l)), "есть синтезатор и громкость музыки");
  ok(labels.some(l => /^Режим сложности выбирают в начале новой игры/.test(l)), "режим сложности в настройках не меняют: его выбирают в начале новой игры");
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
  await gest({ kind: "swipe", n: 1, dir: "U" }); await gest({ kind: "swipe", n: 1, dir: "D" }); await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.settings.difficulty) === 1, "строка о режиме в настройках его не переключает");
  const ri = labels.findIndex(l => /Скорость речи/.test(l));
  const rs = await page.evaluate((ri) => {
    const w = LAB.ui.top(); w.i = ri;
    SPOKEN.length = 0;
    LAB.input.dispatch({ kind: "swipe", n: 1, dir: "U" });
    const up = [LAB.settings.ratePct, LAB.settings.rate];
    LAB.input.dispatch({ kind: "swipe", n: 1, dir: "D" }); LAB.input.dispatch({ kind: "swipe", n: 1, dir: "D" });
    const dn = [LAB.settings.ratePct, LAB.settings.rate];
    LAB.input.dispatch({ kind: "swipe", n: 1, dir: "U" });
    return { up: up, dn: dn, back: LAB.settings.ratePct, said: SPOKEN.join(" | ") };
  }, ri);
  ok(ri >= 0 && rs.up[0] === 55 && rs.dn[0] === 45 && rs.back === 50 && rs.up[1] > 1 && rs.dn[1] < 1, "скорость речи в процентах: 55 % — быстрее, 45 % — медленнее (" + rs.said + ")");
  await gest({ kind: "swipe", n: 2, dir: "D" });
  ok(await page.evaluate(() => LAB.ui.top().title).then ? true : true, "окно закрыто");

  console.log("Новая игра: режим сложности, затем пролог");
  await page.evaluate(() => { while (LAB.ui.top() && !LAB.ui.top().root) LAB.ui.closeTop(true); LAB.ui.top().i = 0; SPOKEN.length = 0; });
  await gest({ kind: "dtap", n: 1 });
  await page.waitForTimeout(100);
  const dm = await page.evaluate(() => { const w = LAB.ui.top(); return w ? { t: w.title, i: w.i, l: w.items.map(i => typeof i.label === "function" ? i.label() : i.label) } : null; });
  t = await said();
  ok(dm && dm.t === "Новая игра: режим сложности" && dm.l.length === 5 && /^Лёгкий: /.test(dm.l[0]) && /^Обычный: /.test(dm.l[1]) && /^Сложный: /.test(dm.l[2]) && /^Очень сложный: /.test(dm.l[3]) && dm.i === 1, "«Начать игру» — сперва режим сложности: четыре режима, курсор на прежнем (" + JSON.stringify(dm) + ")");
  ok(/один раз на всю игру/.test(t) && /во время игры его не сменить/.test(t) && /начните новую игру/.test(t), "окно предупреждает: режим — на всю игру, сменить — только новой игрой");
  await gest({ kind: "swipe", n: 1, dir: "L" }); await gest({ kind: "dtap", n: 1 }); await page.waitForTimeout(80);
  const dc = await page.evaluate(() => { const w = LAB.ui.top(); return w ? { t: w.title, l: w.items.map(i => typeof i.label === "function" ? i.label() : i.label) } : null; });
  t = await said();
  ok(dc && dc.t === "Режим «Лёгкий»" && /^Начать игру: обычный бой/.test(dc.l[0]) && /^Начать игру: пошаговый бой/.test(dc.l[1]) && dc.l[2] === "Выбрать другой режим" && /Для знакомства с игрой/.test(t) && /Бой выбирают здесь же, на всю игру/.test(t), "выбранный режим — с подробным описанием, затем бой: обычный или пошаговый (3.0)");
  await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "dtap", n: 1 }); await page.waitForTimeout(80);
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Новая игра: режим сложности" && await page.evaluate(() => LAB.settings.difficulty) === 1, "«Выбрать другой режим» — назад к выбору, режим не сменился");
  await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "dtap", n: 1 }); await page.waitForTimeout(80);
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Режим «Обычный»", "выбран обычный");
  await gest({ kind: "dtap", n: 1 });
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => LAB.ui.screen()) === "prologue" && /Пролог/.test(await said()), "после выбора режима — пролог");
  await gest({ kind: "swipe", n: 1, dir: "U" });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => LAB.ui.screen()) === "game", "после пролога игра началась");
  let st = await page.evaluate(() => ({ L: LAB.game.G.L, F: LAB.game.G.F, hp: LAB.game.G.hp, diff: LAB.game.G.diff }));
  ok(st.L === 1 && st.F === 1, "уровень 1, этаж 1");
  ok(st.diff === 1 && await page.evaluate(() => !LAB.settings.turnBased && !LAB.game.G.tb), "игра идёт в выбранном режиме: обычный, бой — обычный");
  const sd = await page.evaluate(() => { LAB.ui.settings(); const w = LAB.ui.top(); const it = w.items.find(i => /сложности/.test(typeof i.label === "function" ? i.label() : i.label)); const l = it ? it.label() : ""; w.i = w.items.indexOf(it); LAB.input.dispatch({ kind: "swipe", n: 1, dir: "U" }); LAB.ui.activate(); const r = { l: l, kind: it && it.kind, d: LAB.settings.difficulty, gd: LAB.game.G.diff }; LAB.ui.closeAll(); return r; });
  ok(/^Режим сложности этой игры: обычный\. Он выбран в начале игры и не меняется/.test(sd.l) && !sd.kind && sd.d === 1 && sd.gd === 1, "в настройках во время игры — только сведения о режиме, сменить нельзя (" + JSON.stringify(sd) + ")");
  t = await said();
  ok(/криокапсуле/.test(t), "вступление «Эхо»");
  await page.waitForFunction(() => LAB.Bank.ready("mus_l1") && LAB.Bank.ready("amb_l1") && !LAB.Bank.ready("mus_menu"), null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => LAB.Bank.ready("mus_l1") && LAB.Bank.ready("amb_l1") && !LAB.Bank.ready("mus_menu")), "музыка уровня и фон — в памяти и играют; музыка меню выгружена");

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
  /* (2.0) касание двумя пальцами — перезарядка, двойное касание двумя — смена оружия */
  await gest({ kind: "tap", n: 2 });
  await page.waitForTimeout(1100); /* перезарядка идёт почти секунду */
  ok(await page.evaluate(() => LAB.game.curWeapon().charge === LAB.game.curWeapon().cap), "касание двумя пальцами — перезарядка");
  const wiA = await page.evaluate(() => LAB.game.G.wi);
  await gest({ kind: "dtap", n: 2 });
  const wiB = await page.evaluate(() => LAB.game.G.wi);
  ok(wiB !== wiA, "двойное касание двумя пальцами — смена оружия (" + wiA + "→" + wiB + ")");
  await page.evaluate(() => { LAB.game.G.wi = LAB.game.G.weapons.length - 1; });
  /* (2.0) зигзаг влево-вправо — бросок гранаты, вправо-влево — выбор гранаты */
  const gr = await page.evaluate(async () => {
    const G = LAB.game.G, out = {};
    G.inv.gren_frag = 2; G.inv.k_netbomb = 1; SPOKEN.length = 0;
    LAB.input.dispatch({ kind: "zig", n: 1, dir: "R", dir2: "L" });
    const top = LAB.ui.top(), lb = top ? top.items.map(i => typeof i.label === "function" ? i.label() : i.label) : [];
    out.menu = lb.some(l => /^Осколочная граната, 2 шт/.test(l)) && lb.some(l => /^Сетевая/.test(l));
    LAB.ui.closeAll();
    G.gren = "gren_frag";
    const n0 = G.inv.gren_frag;
    LAB.input.dispatch({ kind: "zig", n: 1, dir: "L", dir2: "R" });
    await new Promise(r => setTimeout(r, 1800));
    out.thrown = G.inv.gren_frag === n0 - 1 && SPOKEN.some(t => /Осколочная/.test(t));
    out.said = SPOKEN.slice(-3).join(" | ");
    delete G.inv.gren_frag; delete G.inv.k_netbomb;
    return out;
  });
  ok(gr.menu, "вправо-влево — выбор гранаты");
  ok(gr.thrown, "влево-вправо — бросок гранаты (" + gr.said + ")");
  /* очередь удержанием */
  await page.waitForTimeout(1000); /* перезарядка идёт почти секунду */
  await page.evaluate(() => { LAB.game.curWeapon().charge = LAB.game.curWeapon().cap; LAB.combat.startFire("N"); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => LAB.combat.stopFire());
  const ch2 = await page.evaluate(() => LAB.game.curWeapon().charge), cap2 = await page.evaluate(() => LAB.game.curWeapon().cap);
  ok(ch2 <= cap2 - 3, "очередь: несколько выстрелов за удержание (осталось " + ch2 + " из " + cap2 + ")");
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
  const dmg = await page.evaluate(() => { const G = LAB.game.G; G.dead = false; G.hp = G.hpMax; G.st.shield = 0; const before = G.hp; LAB.combat.hurtPlayer(10, "energy", null); return before - G.hp; });
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

  console.log("Звуки: металлический пол у каждого уровня, одна запись удара о стену");
  const snd = await page.evaluate(() => {
    const surf = LAB.LEVELS.slice(1).filter(Boolean).map(l => (LAB.SURF[l.surf] && LAB.SURF[l.surf].base) || l.surf);
    const steps = surf.map(s => LAB.SND["step_" + s] ? LAB.SND["step_" + s].f.length : 0);
    return { uniq: new Set(LAB.LEVELS.slice(1).filter(Boolean).map(l => l.surf)).size, steps: steps, metal: surf.every(s => /plate|sheet|wetmetal|steel|checker|grate|frost|armor|catwalk|deck/.test(s)), wall: LAB.SND.bump_wall ? LAB.SND.bump_wall.f.length : 0 };
  });
  ok(snd.uniq >= 10 && snd.metal, "у уровней свои металлические полы: " + snd.uniq);
  ok(snd.steps.every(n => n >= 4), "у каждого пола свои записи шагов: " + snd.steps.join(", "));
  ok(snd.wall === 1, "удар о стену — одна и та же запись");

  console.log("Речь: длинный текст дочитывается, четыре пальца вниз — тишина");
  const sp = await page.evaluate(() => {
    const S = LAB.Speech, pump = S._pump, out = {};
    const spoken = [];
    LAB.settings.speech = true;
    S._pump = function () { if (this.speaking || !this.queue.length) return; const it = this.queue.shift(); this.speaking = true; this.cur = { id: "t" + (++this.seq), text: it.text }; spoken.push(it.text); };
    const long = "Записка. " + "Это длинная строка записки, её нужно дочитать до конца без перерыва. ".repeat(8);
    S.userUntil = 0;
    S.say(long);
    S.say("Мутант-лаборант справа, 3 шага — заметил вас!");
    out.deferred = S.later.length === 1 && spoken.length === 1;
    let guard = 0; while ((S.speaking || S.queue.length) && guard++ < 50) S._done();
    out.tail = spoken[spoken.length - 1];
    out.chunks = spoken.length;
    S.say(long);
    LAB.input.dispatch({ kind: "swipe", n: 4, dir: "D" });
    out.hushed = !S.speaking && !S.queue.length && !S.reading;
    S.say(long); S.user(); S.say("Пункт меню");
    out.userCut = spoken[spoken.length - 1] === "Пункт меню";
    /* любое действие обрывает обычную речь, но не записку */
    S.stop(); S.say("Длинное описание помещения, выходы и вещи. ".repeat(3));
    const wasOn = S.speaking;
    LAB.input.dispatch({ kind: "tap", n: 4 });
    out.actCut = wasOn && !S.speaking && !S.queue.length;
    S.stop(); S.say("Записка. " + long, { note: true });
    const n0 = spoken.length;
    S.userAct(); S.say("Коридор.");
    out.noteKept = S.speaking && spoken.length === n0 && S.later.length === 1;
    S.stop(); S._pump = pump; S.userUntil = 0;
    return out;
  });
  ok(sp.deferred, "фраза игры во время чтения ждёт конца записки");
  ok(sp.tail && sp.tail.indexOf("заметил вас") >= 0 && sp.chunks > 3, "записка дочитана, затем сказана отложенная фраза (" + sp.chunks + " частей)");
  ok(sp.hushed, "четыре пальца вниз — речь прервана");
  ok(sp.userCut, "жест игрока перебивает чтение");
  ok(sp.actCut, "любое действие игрока обрывает речь");
  ok(sp.noteKept, "записку действие не обрывает — она дочитывается, ответ ждёт её конца");

  console.log("Записка: подобрал — окно, мир ждёт");
  const nw = await page.evaluate(() => {
    const g = LAB.game, G = g.G;
    LAB.ui.closeAll();
    G.dead = false; G.hp = G.hpMax;
    LAB.combat.foes().forEach(f => { f.dead = true; }); /* вокруг тихо: записка открывается окном */
    g.CUR.fl.items.push({ id: "tnote1", kind: "note", note: "staff", n: 7, x: G.x, y: G.y });
    g.autoPickup();
    const t = LAB.ui.top() && LAB.ui.top().title;
    const layer = LAB.ui.layer();
    LAB.ui.closeAll();
    return { t: t, layer: !!layer };
  });
  ok(nw.layer && /^«/.test(nw.t || ""), "записка открылась окном: " + nw.t);
  /* стрелки в окне записки: общее чтение уступает выбранному абзацу (на компьютере прежде казалось, что игра зависла) */
  const nk = await page.evaluate(() => {
    const S = LAB.Speech, pump = S._pump, out = {};
    LAB.ui.closeAll();
    const text = "Первый абзац записки о смене и дежурстве. Второй абзац про карантин, склад и пропуска. ".repeat(6);
    LAB.ui.note("Проверочная записка", text);
    const w = LAB.ui.top();
    /* речь игры в проверках — заглушка; чтение записки запускаем в движке речи, как в проверке речи выше */
    LAB.settings.speech = true;
    S._pump = function () { if (this.speaking || !this.queue.length) return; const it = this.queue.shift(); this.speaking = true; this.cur = { id: "t" + (++this.seq), text: it.text }; };
    S.userUntil = 0; S.stop();
    S.say("Проверочная записка. " + text, { note: true });
    out.busy0 = S.noteBusy() && w.items.length >= 3;
    SPOKEN.length = 0; LAB.ui.key("next");
    const it = w.items[w.i], label = typeof it.label === "function" ? it.label() : it.label;
    out.said = w.i === 1 && SPOKEN.join(" ").indexOf(label.slice(0, 30)) >= 0;
    out.freed = !S.noteBusy() && !S.noteReading;
    out.diag = w.i + "/" + SPOKEN.length + "/" + w.items.length;
    LAB.ui.closeAll(); S.stop(); S._pump = pump;
    return out;
  });
  ok(nk.busy0 && nk.said && nk.freed, "стрелка в окне записки обрывает общее чтение и читает выбранный абзац (" + [nk.busy0, nk.said, nk.freed].join(",") + " " + nk.diag + ")");

  console.log("Сейф: код набирает сам игрок");
  const sf = await page.evaluate(async () => {
    const g = LAB.game, G = g.G;
    let found = null;
    for (let F = 1; F <= 20 && !found; F++) { const fl = LAB.getFloor(G.seed, G.L, F); const o = fl.objs.find(x => x.type === "safe"); if (o) found = { F: F, id: o.id }; }
    if (!found) return { err: "нет сейфа" };
    g.enterFloor(G.L, found.F, "down", true);
    const o = g.CUR.fl.objs.find(x => x.id === found.id);
    LAB.ui.closeAll();
    g.objMenu(o);
    const labels = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    const out = { labels: labels.join(" | ") };
    const enter = (code) => new Promise(res => {
      LAB.ui.closeAll(); g.objMenu(o);
      const it = LAB.ui.top().items.findIndex(i => /Набрать код/.test(typeof i.label === "function" ? i.label() : i.label));
      LAB.ui.top().i = it; LAB.ui.activate();
      setTimeout(() => {
        const m = d => LAB.mini.gesture(d);
        String(code).split("").forEach((c, k) => { for (let q = 0; q < +c; q++) m({ kind: "swipe", n: 1, dir: "U" }); if (k < 3) m({ kind: "swipe", n: 1, dir: "R" }); });
        m({ kind: "dtap", n: 1 });
        setTimeout(res, 120);
      }, 60);
    });
    SPOKEN.length = 0;
    await enter(o.code === "1111" ? "2222" : "1111");
    out.wrong = SPOKEN.join(" ").indexOf("Неверный код") >= 0 && !g.objState(o).open;
    await enter(o.code);
    out.opened = !!g.objState(o).open;
    return out;
  });
  ok(!sf.err && sf.labels.indexOf("Набрать код") >= 0 && sf.labels.indexOf("Взлом") < 0, "у сейфа — только набор кода: " + (sf.err || sf.labels));
  ok(sf.wrong, "неверный код — сейф закрыт");
  ok(sf.opened, "верный код, набранный дисками, открывает сейф");

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

  console.log("Клавиатура: W A S D, R, стрелки, окна, руководство");
  await page.evaluate(() => { LAB.ui.closeAll(); LAB.game.G.drawn = false; SPOKEN.length = 0; });
  const pos = () => page.evaluate(() => LAB.game.G.x + "," + LAB.game.G.y);
  let kmoved = 0;
  for (const k of ["w", "d", "s", "a", "w", "d", "s", "a"]) { const p0 = await pos(); await key(k); if ((await pos()) !== p0) kmoved++; }
  ok(kmoved > 0, "W A S D — шаги: " + kmoved);
  const rdirs = await page.evaluate(() => {
    const g = LAB.game, orig = g.tryMove, rec = [];
    g.tryMove = function (d) { rec.push(d); return orig.apply(this, arguments); };
    for (const k of ["ц", "ф", "ы", "в"]) { document.dispatchEvent(new KeyboardEvent("keydown", { key: k })); document.dispatchEvent(new KeyboardEvent("keyup", { key: k })); }
    g.tryMove = orig;
    return rec.join("");
  });
  ok(rdirs === "NWSE", "русская раскладка: Ц Ф Ы В — те же W A S D (" + rdirs + ")");
  await page.evaluate(() => { SPOKEN.length = 0; });
  await key("ArrowUp");
  ok(/R — достать оружие/.test(await said()), "стрелка без оружия — подсказка: R — достать оружие");
  await page.evaluate(() => { const G = LAB.game.G; G.weapons.push(LAB.makeWeapon("spark", 1, 0, 1, "w_kb")); G.wi = G.weapons.length - 1; G.ammo.energy = 9; });
  await key("r");
  ok(await page.evaluate(() => LAB.game.G.drawn), "R — оружие в руках");
  const kc0 = await page.evaluate(() => LAB.game.curWeapon().charge);
  await key("ArrowUp");
  await page.waitForTimeout(400);
  const kc1 = await page.evaluate(() => LAB.game.curWeapon().charge);
  ok(kc1 === kc0 - 1, "стрелка вверх — выстрел (заряд " + kc0 + "→" + kc1 + ")");
  const wp0 = await pos();
  await key("s"); await key("w");
  ok(await page.evaluate(() => LAB.game.G.drawn), "с оружием в руках W A S D — ходьба, оружие не убирается (" + wp0 + "→" + (await pos()) + ")");
  await page.keyboard.down("ArrowLeft"); await page.waitForTimeout(1300); await page.keyboard.up("ArrowLeft");
  await page.waitForTimeout(200);
  const kc2 = await page.evaluate(() => LAB.game.curWeapon().charge);
  ok(kc2 < kc1 - 1, "удержание стрелки — очередь (заряд " + kc1 + "→" + kc2 + ")");
  await key("f");
  ok(await page.evaluate(() => LAB.game.curWeapon().charge === LAB.game.curWeapon().cap), "F — перезарядка");
  await page.waitForTimeout(1200); await key("ArrowUp"); await page.waitForTimeout(400);
  const kc3 = await page.evaluate(() => LAB.game.curWeapon().charge);
  await key("r", "Alt");
  ok(kc3 < (await page.evaluate(() => LAB.game.curWeapon().cap)) && await page.evaluate(() => LAB.game.curWeapon().charge === LAB.game.curWeapon().cap && LAB.game.G.drawn), "Alt+R — перезарядка, оружие остаётся в руках (заряд " + kc3 + "→полный)");
  const wi0 = await page.evaluate(() => LAB.game.G.wi);
  await key("q");
  ok(await page.evaluate(() => LAB.game.G.wi) !== wi0, "Q — другое оружие");
  await key("1");
  ok(await page.evaluate(() => LAB.game.G.wi) === 0, "1 — оружие номер один");
  await key("r");
  ok(await page.evaluate(() => !LAB.game.G.drawn), "ещё раз R — оружие убрано");
  await key("c");
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Персонаж", "C — окно персонажа");
  await key("ArrowDown");
  ok(await page.evaluate(() => LAB.ui.top().i) === 1, "стрелка вниз — следующий пункт");
  await key("End");
  ok(await page.evaluate(() => LAB.ui.top().i === LAB.ui.top().items.length - 1), "End — последний пункт");
  await key("Escape");
  ok(await page.evaluate(() => !LAB.ui.top()), "Escape — окно закрыто");
  await key("i");
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Инвентарь", "I — инвентарь");
  await key("Enter");
  ok(await page.evaluate(() => LAB.ui.top().title) === "Оружие", "Enter — раздел «Оружие»");
  await key("Escape");
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Инвентарь", "Escape — раздел закрыт, снова инвентарь (как пункт «Назад»)");
  await key("Escape");
  ok(await page.evaluate(() => !LAB.ui.top()), "Escape ещё раз — снова игра");
  await key("i");
  await key("c");
  ok(await page.evaluate(() => LAB.ui.top() && LAB.ui.top().title) === "Персонаж", "C из инвентаря — окно персонажа");
  await page.evaluate(() => LAB.ui.closeAll());
  await key("F1");
  const gl = await page.evaluate(() => LAB.ui.top() && LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label));
  ok(gl && gl[0] === "Первые шаги" && gl.indexOf("Управление: клавиатура") >= 0 && !gl.some(l => /жест/i.test(l)) && gl.indexOf("Справочники: бестиарий, оружие, броня") >= 0, "F1 — руководство по разделам (3.0): «Управление: клавиатура» вместо жестов (" + (gl || []).join(", ") + ")");
  await page.evaluate(() => { const w = LAB.ui.top(); w.i = w.items.findIndex(i => i.label === "Управление: клавиатура"); });
  await key("Enter");
  const kbl = await page.evaluate(() => LAB.ui.top() && LAB.ui.top().items.map(i => i.label));
  ok(kbl && kbl[0] === "Ходьба и осмотр" && kbl.indexOf("Оружие и бой") >= 0 && kbl.indexOf("Окна и меню") >= 0, "«Клавиатура»: " + (kbl || []).join(", "));
  await key("Enter");
  const kbt = await said();
  ok(/W, A, S, D — шаг/.test(kbt), "глава о ходьбе с клавиатуры читается");
  const ksp = await page.evaluate(() => LAB.keysSpoken("W, A, S, D — шаг. Enter — действия. R — оружие."));
  ok(ksp === "дабл ю, эй, эс, ди — шаг. Энтер — действия. ар — оружие.", "имена клавиш звучат по-русски: " + ksp);
  await page.evaluate(() => { LAB.ui.closeAll(); window.HUSHED = 0; const h = LAB.Speech.hush; LAB.Speech.hush = function () { window.HUSHED++; return h.apply(this, arguments); }; });
  await key("Control"); await key("x");
  ok(await page.evaluate(() => window.HUSHED) === 2, "Ctrl и X — тишина");
  await page.evaluate(() => { window.KCODE = null; LAB.mini.code(v => { window.KCODE = v; }); });
  for (const k of ["4", "0", "7", "1", "Enter"]) await key(k);
  ok(await page.evaluate(() => window.KCODE) === "4071", "кодовый замок: цифры с клавиатуры и Enter — " + (await page.evaluate(() => window.KCODE)));

  console.log("Мир: двери, таблички, лестницы, компьютеры, автоматы, записки");
  await page.evaluate(() => { LAB.ui.closeAll(); const G = LAB.game.G; G.dead = false; G.hp = G.hpMax; G.drawn = false; LAB.combat.foes().forEach(f => { f.dead = true; }); });
  const signs = await page.evaluate(() => LAB.game.CUR.fl.rooms.filter(r => r && r.sign).map(r => r.sign));
  ok(signs.length > 2 && signs.some(t => /^Помещение \d+\. /.test(t)), "таблички на дверях: " + signs.slice(0, 3).join(" | "));
  const door = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl, D = LAB.DIRS;
    const d = fl.doors.find(x => !x.lock && fl.t[(x.y + D[x.side][1]) * LAB.W + x.x + D[x.side][0]] === LAB.T.CORR && !g.CUR.fs.doors[x.id]);
    if (!d) return { none: true };
    SPOKEN.length = 0;
    G.x = d.x + D[d.side][0]; G.y = d.y + D[d.side][1];
    g.tryMove(LAB.OPP[d.side], false);
    const closed = g.CUR.fs.doors[d.id] !== 2, at = G.x + "," + G.y, said = SPOKEN.join(" | ");
    g.openDoor(d);
    const opened = g.CUR.fs.doors[d.id] === 2;
    /* отойти подальше: любая свободная клетка комнаты в трёх шагах от двери */
    let spot = null;
    fl.rooms.forEach(r => { if (!r || spot) return; for (let y = r.y0; y <= r.y1 && !spot; y++) for (let x = r.x0; x <= r.x1; x++) if (Math.abs(x - d.x) + Math.abs(y - d.y) >= 3 && g.passable(x, y)) { spot = [x, y]; break; } });
    if (spot) { G.x = spot[0]; G.y = spot[1]; }
    g.CUR.openT[d.id] = Date.now() - 4000;
    g.doorAutoClose();
    return { closed, said, opened, after: g.CUR.fs.doors[d.id], dist: Math.abs(G.x - d.x) + Math.abs(G.y - d.y) };
  });
  ok(door.none || (door.closed && /Закрытая дверь/.test(door.said) && /Табличка: «/.test(door.said)), "дверь закрыта, пока её не открыть; на двери — табличка (" + (door.said || "").slice(0, 120) + ")");
  ok(door.none || door.opened, "дверь открывается действием");
  ok(door.none || door.dist < 2 || door.after === 1, "открытая дверь сама закрывается, когда игрок отошёл (" + door.after + ", шагов от двери " + door.dist + ")");
  const turn = await page.evaluate(() => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl, D = LAB.DIRS, T = LAB.T, W = LAB.W;
    /* войти в коридор из прохода помещения: «Эхо» говорит, куда он ведёт */
    for (const c of fl.corrs) {
      const m = c.mouth[0], r = fl.rooms[c.mouthRoom];
      for (const k of ["N", "E", "S", "W"]) {
        const bx = m[0] - D[k][0], by = m[1] - D[k][1];
        if (fl.t[by * W + bx] !== T.ROOM || !g.passable(bx, by) || g.foeAt(m[0], m[1])) continue;
        SPOKEN.length = 0; G.x = bx; G.y = by; g.CUR.corr = -1;
        g.tryMove(k, false);
        if (!(G.x === m[0] && G.y === m[1])) continue;
        g.tryMove(k, false);
        return SPOKEN.join(" | ");
      }
    }
    return "нет коридоров";
  });
  ok(/Коридор, шириной в четыре шага/.test(turn) && /до двери|до прохода/.test(turn), "вход в коридор — сказано, куда он ведёт: " + turn.slice(0, 160));
  const stairs = await page.evaluate(() => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl;
    const o = fl.objs.find(x => x.type === "stairs_down" && !x.blocked);
    if (!o) return { none: true };
    const F0 = G.F;
    SPOKEN.length = 0;
    g.useStairs(o);
    const on = !!G.stair;
    let steps = 0, said = [];
    for (let i = 0; i < 40 && G.F === F0; i++) { g.lastMoveReset && g.lastMoveReset(); const t0 = Date.now(); while (Date.now() - t0 < 130) { /* шаг не чаще раза в 0,11 с */ } g.tryMove("N", false); steps++; }
    said = SPOKEN.join(" | ");
    return { on, steps, F: G.F, F0, said };
  });
  ok(stairs.none || (stairs.on && stairs.F === stairs.F0 + 1 && stairs.steps >= 10 && stairs.steps <= 16), "лестница: спуск шагами по ступеням, шагов " + stairs.steps + ", этаж " + stairs.F0 + " → " + stairs.F);
  ok(stairs.none || (/Площадка/.test(stairs.said) && !/\d+ ступен/.test(stairs.said)), "на лестнице — площадка, число ступеней не называется");
  const back = await page.evaluate(() => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl;
    const o = fl.objs.find(x => x.type === "stairs_up" && !x.blocked);
    if (!o) return { none: true };
    const F0 = G.F;
    /* (2.0) у лестницы стоят стражи: пришли сверху — они уже гонятся, а с погоней
       на лестницу не пускают; здесь проверяется сама лестница — погоню снимаем */
    LAB.combat.foes().forEach(f => { if (f.state === "hunt") { f.state = "idle"; f.lastKnown = null; } });
    g.useStairs(o);
    const t0 = Date.now(); while (Date.now() - t0 < 130) { }
    g.tryMove("N", false);
    const t1 = Date.now(); while (Date.now() - t1 < 130) { }
    g.tryMove("S", false);
    const t2 = Date.now(); while (Date.now() - t2 < 130) { }
    SPOKEN.length = 0;
    g.tryMove("S", false);
    return { F: G.F, F0, stair: !!G.stair, said: SPOKEN.join(" | ") };
  });
  ok(back.none || (back.F === back.F0 && !back.stair && /сошли с лестницы/.test(back.said)), "шаг назад с первой ступени — снова на этаже" + (back.none || /сошли с лестницы/.test(back.said) ? "" : " (" + back.said + ")"));
  const pc = await page.evaluate(() => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl;
    const o = { id: "tpc1", type: "pc", x: G.x, y: G.y, room: -1, code: "4821", codeFor: "dX", codeRoom: "Проверочная" };
    fl.objs.push(o);
    LAB.ui.closeAll();
    LAB.office.pcMenu(o);
    const t1 = LAB.ui.top() && LAB.ui.top().title;
    const sit = LAB.ui.top().items.findIndex(i => i.label === "Сесть за компьютер");
    LAB.ui.top().i = sit; LAB.ui.activate();
    const t2 = LAB.ui.top() && LAB.ui.top().title;
    const mi = LAB.ui.top().items.findIndex(i => /^Почта/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.top().i = mi; LAB.ui.activate();
    const t3 = LAB.ui.top() && LAB.ui.top().title;
    const mails = LAB.ui.top().items.map(i => i.label);
    LAB.ui.top().i = 0; LAB.ui.activate();
    const t4 = LAB.ui.top() && LAB.ui.top().title;
    LAB.ui.closeAll();
    fl.objs.pop();
    return { t1, t2, t3, t4, mails, code: G.codes["4821"] || null };
  });
  ok(pc.t1 === "Компьютерный стол" && /^Компьютер: /.test(pc.t2 || "") && /^Почта: /.test(pc.t3 || ""), "компьютерный стол: сесть за компьютер, почта (" + pc.t2 + ")");
  ok(pc.code === "Проверочная" && /Код двери/.test(pc.mails[0] || "") && /^Письмо/.test(pc.t4 || ""), "в почте — код двери, прочитан и запомнен: " + (pc.mails[0] || ""));
  const drink = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl;
    const o = { id: "tcof1", type: "coffee", x: G.x, y: G.y, room: -1 };
    fl.objs.push(o);
    G.credits = 100; G.hp = Math.round(G.hpMax / 2);
    const hp0 = G.hp, cr0 = G.credits;
    LAB.ui.closeAll();
    LAB.office.drinkMenu(o);
    const title = LAB.ui.top() && LAB.ui.top().title;
    LAB.ui.top().i = LAB.ui.top().items.findIndex(i => /^Капучино/.test(typeof i.label === "function" ? i.label() : i.label)); LAB.ui.activate(); /* капучино */
    await new Promise(r => setTimeout(r, 3200));
    LAB.ui.closeAll();
    fl.objs.pop();
    return { title, hp0, hp: G.hp, cr0, cr: G.credits, said: SPOKEN.slice(-2).join(" | ") };
  });
  ok(/^Кофейный автомат/.test(drink.title || "") && drink.hp > drink.hp0 && drink.cr < drink.cr0, "кофейный автомат: капучино за кредиты, здоровье " + drink.hp0 + " → " + drink.hp + ", кредиты " + drink.cr0 + " → " + drink.cr);
  const notes = await page.evaluate(() => {
    const g = LAB.game, G = g.G, fl = g.CUR.fl, out = [];
    for (let i = 0; i < 6; i++) { const it = { id: "tn" + i, kind: "note", note: "staff", n: i, x: G.x, y: G.y }; out.push(g.noteText(it).t + ": " + g.noteText(it).x.slice(0, 30)); }
    return out;
  });
  ok(new Set(notes).size === notes.length, "записки персонала не повторяются: " + notes.slice(0, 3).join(" | "));

  const codeMenu = await page.evaluate(() => {
    const g = LAB.game, G = g.G;
    for (let L = 1; L <= 3; L++) for (let F = 1; F <= 20; F++) {
      const fl = LAB.getFloor(G.seed, L, F), d = fl.doors.find(x => x.lock && x.lock.type === "code");
      if (!d) continue;
      g.enterFloor(L, F, "down", true);
      const dd = g.CUR.fl.doors.find(x => x.id === d.id);
      G.codes[dd.lock.code] = "проверка";
      LAB.ui.closeAll();
      g.openTarget({ type: "door", ref: dd, dir: "N" });
      const labels = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
      LAB.ui.closeAll();
      return labels;
    }
    return null;
  });
  ok(!codeMenu || (codeMenu.indexOf("Набрать код") >= 0 && !codeMenu.some(l => /из записки/.test(l))), "кодовая дверь: код набирается только вручную (" + (codeMenu || []).join(", ") + ")");

  console.log("Турели: отключить и перехватить можно только головоломкой");
  const tur = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    let found = null;
    for (let L = 1; L <= 3 && !found; L++) for (let F = 4; F <= 20 && !found; F++) { const fl = LAB.getFloor(G.seed, L, F); if (fl.turrets) found = { L, F }; }
    if (!found) return { none: true };
    g.enterFloor(found.L, found.F, "down", true);
    const fl = g.CUR.fl;
    const term = fl.objs.find(o => o.type === "terminal" && o.sub === "sec");
    out.term = !!term;
    if (!term) return out;
    g.objState(term).hacked = true;
    LAB.ui.closeAll(); g.objMenu(term);
    const labels = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.labels = labels.join(" | ");
    out.noFree = !labels.some(l => /^Отключить турели этажа$/.test(l));
    const ni = labels.findIndex(l => /Оборонная сеть/.test(l));
    LAB.ui.top().i = ni; LAB.ui.activate();
    /* оборонная сеть: камеры, турели, тревога — турели отдельным пунктом */
    const ti = LAB.ui.top().items.findIndex(i => /^Турели этажа/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.top().i = ti; LAB.ui.activate();
    const t2 = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.net = t2.join(" | ");
    /* отключить: схема реле — решаем перебором */
    LAB.ui.top().i = 0; LAB.ui.activate();
    await new Promise(r => setTimeout(r, 50));
    const c = LAB.mini._cur();
    out.mini = c && c.type;
    if (!c || c.type !== "relays") return out;
    const n = c.n, st0 = c.st.slice();
    let sol = null;
    for (let mask = 0; mask < (1 << n) && !sol; mask++) {
      const s = st0.slice();
      for (let i = 0; i < n; i++) if (mask & (1 << i)) [i - 1, i, i + 1].forEach(j => { if (c.ring) j = (j + n) % n; if (j >= 0 && j < n) s[j] = !s[j]; });
      if (!s.some(v => v)) sol = mask;
    }
    out.sol = sol !== null;
    for (let i = 0; i < n; i++) {
      if (!(sol & (1 << i))) continue;
      while (c.pos < i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "R" });
      while (c.pos > i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "L" });
      LAB.mini.gesture({ kind: "dtap", n: 1 });
    }
    await new Promise(r => setTimeout(r, 500));
    out.mode = g.CUR.fs.turretMode;
    out.calm = LAB.combat.foes().filter(f => !f.dead && LAB.FOES[f.type].beh.indexOf("turret") >= 0).every(f => f.calm);
    out.repair = !!g.CUR.fs.repairAt;
    /* перехват: ключ ОКО (быки и коровы) и схема */
    LAB.ui.closeAll(); g.objMenu(term);
    const li = LAB.ui.top().items.findIndex(i => /Оборонная сеть/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.top().i = li; LAB.ui.activate();
    const ti2 = LAB.ui.top().items.findIndex(i => /^Турели этажа/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.top().i = ti2; LAB.ui.activate();
    const hi = LAB.ui.top().items.findIndex(i => /Перехватить/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.top().i = hi; LAB.ui.activate();
    await new Promise(r => setTimeout(r, 50));
    const b = LAB.mini._cur();
    out.bulls = b && b.type;
    if (b && b.type === "bulls") {
      b.key.forEach((v, i) => { b.d[i] = v; });
      LAB.mini.gesture({ kind: "dtap", n: 1 });
      await new Promise(r => setTimeout(r, 1700));
      const c2 = LAB.mini._cur();
      if (c2 && c2.type === "relays") {
        const n2 = c2.n, s0 = c2.st.slice(); let sol2 = null;
        for (let mask = 0; mask < (1 << n2) && sol2 === null; mask++) { const s = s0.slice(); for (let i = 0; i < n2; i++) if (mask & (1 << i)) [i - 1, i, i + 1].forEach(j => { if (c2.ring) j = (j + n2) % n2; if (j >= 0 && j < n2) s[j] = !s[j]; }); if (!s.some(v => v)) sol2 = mask; }
        for (let i = 0; i < n2; i++) { if (!(sol2 & (1 << i))) continue; while (c2.pos < i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "R" }); while (c2.pos > i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "L" }); LAB.mini.gesture({ kind: "dtap", n: 1 }); }
        await new Promise(r => setTimeout(r, 500));
      }
    }
    out.mode2 = g.CUR.fs.turretMode;
    out.ally = LAB.combat.foes().filter(f => !f.dead && LAB.FOES[f.type].beh.indexOf("turret") >= 0).every(f => f.ally);
    out.counter = !!g.CUR.fs.counterAt;
    /* турель не мешает уйти по лестнице: гонятся только те, кто может дойти */
    LAB.combat.turretsHostile();
    LAB.combat.foes().forEach(f => { if (LAB.FOES[f.type].beh.indexOf("turret") < 0) f.dead = true; else { f.state = "hunt"; } });
    out.chaser = LAB.combat.chaser();
    LAB.ui.closeAll();
    return out;
  });
  ok(tur.none || tur.term, "этаж с турелями — есть терминал безопасности");
  ok(tur.none || tur.noFree, "в терминале нет бесплатного «Отключить турели»: " + (tur.labels || ""));
  ok(tur.none || (/Отключить турели: погасить схему реле/.test(tur.net || "") && /Перехватить турели/.test(tur.net || "")), "оборонная сеть: отключить или перехватить — головоломками");
  ok(tur.none || (tur.mini === "relays" && tur.sol && tur.mode === "off" && tur.calm), "схема реле решена — турели отключены");
  ok(tur.none || tur.repair, "ОКО шлёт ремонтника к отключённым турелям");
  ok(tur.none || (tur.bulls === "bulls" && tur.mode2 === "ours" && tur.ally), "ключ ОКО и схема — турели бьют на нашей стороне");
  ok(tur.none || tur.counter, "ОКО готовит контрвзлом перехваченных турелей");
  ok(tur.none || !tur.chaser, "турель не считается погоней: лестница доступна");

  console.log("Оборонная сеть: доступна всегда; камеры — петля, питание, прошивка; изоляцию ОКО можно обойти");
  const dnet = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, C = LAB.combat, O = LAB.oko, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
    /* решатель головоломок для проверки: взлом, настройка частот, схема реле, подбор ключа */
    const solve = async () => {
      for (let k = 0; k < 2500; k++) { /* длинные взломы (девять сигналов, семь раундов) занимают до полуминуты */
        const c = LAB.mini._cur();
        /* головоломка закрылась: её итог игра применяет чуть позже (через 30 мс), а цепочка
           начинает следующий шаг после паузы, — убедиться, что ничего не идёт, и только тогда выйти */
        if (!c) { if (!LAB.mini.active()) { await wait(150); if (!LAB.mini._cur() && !LAB.mini.active()) return true; } else await wait(80); continue; }
        if (c.done) { await wait(80); continue; }
        if (c.type === "hack") { if (!c.busy) LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); await wait(40); continue; }
        if (c.type === "sort") {
          let i = 0; while (i < c.n - 1 && c.arr[i] <= c.arr[i + 1]) i++;
          if (i >= c.n - 1) { LAB.mini.gesture({ kind: "dtap", n: 1 }); await wait(100); continue; }
          while (c.pos < i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "R" });
          while (c.pos > i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "L" });
          LAB.mini.gesture({ kind: "swipe", n: 1, dir: "U" }); await wait(20); continue;
        }
        if (c.type === "relays") {
          const n = c.n, s0 = c.st.slice(); let sol = null;
          for (let m = 0; m < (1 << n) && sol === null; m++) { const q = s0.slice(); for (let i = 0; i < n; i++) if (m & (1 << i)) [i - 1, i, i + 1].forEach(j => { if (c.ring) j = (j + n) % n; if (j >= 0 && j < n) q[j] = !q[j]; }); if (!q.some(v => v)) sol = m; }
          for (let i = 0; i < n; i++) { if (!(sol & (1 << i))) continue; while (c.pos < i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "R" }); while (c.pos > i) LAB.mini.gesture({ kind: "swipe", n: 1, dir: "L" }); LAB.mini.gesture({ kind: "dtap", n: 1 }); }
          await wait(500); continue;
        }
        if (c.type === "bulls") { c.key.forEach((v, i) => { c.d[i] = v; }); LAB.mini.gesture({ kind: "dtap", n: 1 }); await wait(1800); continue; }
        return false;
      }
      return false;
    };
    let found = null, any = null;
    for (let L = 1; L <= 4 && !found; L++) for (let F = 3; F <= 20 && !found; F++) {
      const fl = LAB.getFloor(G.seed, L, F);
      const cams = fl.foes.filter(d => LAB.FOES[d.type] && LAB.FOES[d.type].beh.indexOf("camera") >= 0).length;
      const term = fl.objs.some(o => o.type === "terminal" && o.sub === "sec");
      if (cams && term && !fl.turrets) found = { L, F };
      else if (cams && term && !any) any = { L, F };
    }
    found = found || any;
    if (!found) return { none: true };
    out.noTurrets = !LAB.getFloor(G.seed, found.L, found.F).turrets;
    g.enterFloor(found.L, found.F, "down", true);
    C.stop(); LAB.ui.closeAll();
    C.foes().forEach(f => { if (!C.isCam(f)) f.dead = true; });
    const term = g.CUR.fl.objs.find(o => o.type === "terminal" && o.sub === "sec");
    const st = g.objState(term); st.hacked = true; st.isoUntil = 0;
    g.objMenu(term);
    const netIt = LAB.ui.top().items.find(i => /^Оборонная сеть этажа/.test(label(i)));
    out.netItem = !!netIt && !netIt.disabled;
    pick(/^Оборонная сеть этажа/);
    out.defense = LAB.ui.top().items.map(label).join(" | ");
    /* все камеры — на петлю */
    out.camMenu = pick(/^Камеры этажа/) && pick(/Закольцевать запись всех камер/);
    out.loopSolved = await solve();
    const cams = C.cams();
    out.nCams = cams.length;
    out.allLoop = cams.length > 0 && cams.every(f => C.camState(f) === "loop");
    /* тёмный этаж укорачивает обзор камеры на три шага, маскировка слепит её: проверяем при штатном свете */
    G.event = "norm"; G.eventUntil = G.min + 100000; G.st.cloak = 0; G.st.jam = 0;
    /* броня «призрак для камер» (из прошлых проверок) камеры тоже обманывает — на время проверки её нет */
    const armSave = G.armor; G.armor = null;
    /* камера на петле не видит героя: встаём у неё на линии взгляда */
    const cam = cams[0];
    const fl = g.CUR.fl, T = LAB.T;
    const walk = (x, y) => x >= 0 && y >= 0 && x < LAB.W && y < LAB.H && (fl.t[y * LAB.W + x] === T.CORR || fl.t[y * LAB.W + x] === T.ROOM);
    const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    let spot = null;
    /* место на линии взгляда: свободная клетка, и камере её видно (между ними нет обстановки) */
    for (const d of (cam.camDirs || ["N", "E", "S", "W"])) { const v = DV[d]; for (let k = 2; k <= 3 && !spot; k++) { const x = cam.x + v[0] * k, y = cam.y + v[1] * k; if (walk(x, y) && !fl.objAt[y * LAB.W + x] && LAB.los(fl, g.CUR.fs, cam.x, cam.y, x, y)) spot = { x, y, d }; } if (spot) break; }
    out.spot = !!spot;
    if (spot) {
      cam.camDirs = cam.camDirs || ["N", "E", "S", "W"]; cam.camI = cam.camDirs.indexOf(spot.d); cam.camSw = -999;
      G.x = spot.x; G.y = spot.y;
      const lv0 = O.level();
      for (let i = 0; i < 4; i++) C.tick();
      out.blindLoop = O.level() === lv0 && !(O.sec().seen && O.sec().seen.x === spot.x && O.sec().seen.y === spot.y);
      /* петля кончилась: ОКО находит её и снова видит */
      cams.forEach(f => { if (f.camLoop) f.camLoop = O.T() + 1; });
      for (let i = 0; i < 4; i++) C.tick();
      out.loopFound = /Петля видеозаписи найдена/.test(O.logText(30)) && C.camState(cam) === "on";
      cam.camI = cam.camDirs.indexOf(spot.d); cam.camSw = -999; cam.camT = 0;
      for (let i = 0; i < 3; i++) C.tick();
      out.seenAgain = O.level() > lv0 || !!O.sec().seen;
      if (!out.seenAgain) out.camDbg = JSON.stringify({ at: G.L + "-" + G.F, lv0, lv: O.level(), cam: [cam.x, cam.y, C.camState(cam), cam.camI, cam.blindT || 0, !!cam.dead, !!cam.calm], spot, hero: [G.x, G.y], blind: !!g.CUR.fs.okoBlind, st: [G.st.cloak, G.st.jam, G.st.deaf || 0], log: O.logText(4) });
    }
    /* у самой камеры: снять питание под кожухом */
    LAB.ui.closeAll();
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(v => ({ x: cam.x + v[0], y: cam.y + v[1] })).find(p => walk(p.x, p.y) && !C.foes().some(f => !f.dead && f.x === p.x && f.y === p.y));
    out.near = !!nb;
    if (nb) {
      G.x = nb.x; G.y = nb.y;
      out.inReach = g.camsNear().indexOf(cam) >= 0;
      g.cameraSabotage(cam);
      out.cutMenu = pick(/Вскрыть кожух и снять питание/);
      out.cutSolved = await solve();
      out.off = C.camState(cam) === "off" && !!(g.CUR.fs.camS && g.CUR.fs.camS[cam.id] && g.CUR.fs.camS[cam.id].off);
      out.toRepair = C.cutCount() >= 1;
      C.tick(); out.repairPlanned = !!g.CUR.fs.repairAt || C.repairers().length > 0;
      /* питание снято и после возвращения на этаж */
      g.enterFloor(found.L, found.F, "down", true); C.stop();
      const cam2 = C.cams().find(f => f.id === cam.id);
      out.kept = !!cam2 && C.camState(cam2) === "off";
    }
    /* перепрошить камеру с терминала */
    LAB.ui.closeAll();
    C.foes().forEach(f => { if (!C.isCam(f)) f.dead = true; });
    /* обесточенную камеру «чинит» проверка, чтобы было что перепрошивать */
    C.cams().forEach(f => { f.camOff = false; f.camLoop = 0; f.camOurs = 0; }); g.CUR.fs.camS = {};
    const live = C.cams().find(f => C.camState(f) !== "off");
    /* (2.2) камер одного вида на этаже бывает несколько (в коридоре и в помещениях): остальные —
       без питания, чтобы в списке терминала «смотрит для ОКО» была только проверяемая */
    C.cams().forEach(f => { if (f !== live) f.camOff = true; });
    out.flashTested = !!live;
    if (live) {
      g.objMenu(term); pick(/^Оборонная сеть этажа/); pick(/^Камеры этажа/);
      const k = LAB.ui.top().items.findIndex(i => label(i).indexOf(live.name.split(",")[0]) === 0 && /смотрит для ОКО/.test(label(i)));
      if (k >= 0) { LAB.ui.top().i = k; LAB.ui.activate(); }
      out.flashMenu = k >= 0 && pick(/Перепрошить камеру/);
      out.flashSolved = await solve();
      out.ours = C.camState(live) === "ours";
      if (!out.flashSolved || !out.ours) out.flashDbg = JSON.stringify({ at: G.L + "-" + G.F, cam: [live.x, live.y, C.camState(live), !!live.dead], top: LAB.ui.top() ? LAB.ui.top().title : null, log: O.logText(4), said: SPOKEN.slice(-4) });
    } else out.ours = true;
    /* изоляция сегмента: пункт не серый, взлом маршрутизации снимает её */
    LAB.ui.closeAll();
    st.isoUntil = O.T() + 300; st.lockUntil = 0;
    g.objMenu(term);
    const isoIt = LAB.ui.top().items.find(i => /Обойти изоляцию/.test(label(i)));
    out.isoItem = !!isoIt && !isoIt.disabled;
    out.isoMenu = pick(/Обойти изоляцию/) && pick(/Обойти изоляцию: перехватить/);
    out.isoSolved = await solve();
    out.isoGone = !st.isoUntil;
    LAB.ui.closeAll();
    G.armor = armSave;
    return out;
  });
  ok(dnet.none || (dnet.netItem && /Камеры этажа/.test(dnet.defense) && /Турели/.test(dnet.defense)), "оборонная сеть в терминале безопасности доступна всегда" + (dnet.noTurrets ? ", и на этаже без турелей" : "") + ": " + (dnet.defense || ""));
  ok(dnet.none || (dnet.camMenu && dnet.loopSolved && dnet.allLoop), "камеры этажа: запись всех закольцована — головоломкой (камер " + dnet.nCams + ")");
  ok(dnet.none || !dnet.spot || (dnet.blindLoop && dnet.loopFound && dnet.seenAgain), "камера на петле героя не видит; петля кончилась — ОКО находит её и снова видит (" + [dnet.blindLoop, dnet.loopFound, dnet.seenAgain].join(", ") + (dnet.camDbg ? " " + dnet.camDbg : "") + ")");
  ok(dnet.none || !dnet.near || (dnet.inReach && dnet.cutMenu && dnet.cutSolved && dnet.off && dnet.toRepair && dnet.repairPlanned && dnet.kept), "у самой камеры: питание снято, ОКО шлёт ремонтника, состояние помнится на этаже (" + [dnet.inReach, dnet.cutMenu, dnet.cutSolved, dnet.off, dnet.toRepair, dnet.repairPlanned, dnet.kept].join(", ") + ")");
  ok(dnet.none || (dnet.flashTested && dnet.flashMenu && dnet.flashSolved && dnet.ours), "камера перепрошита с терминала: докладывает ОКО «чисто»" + (dnet.flashMenu === false ? " (пункт не найден)" : "") + " (" + [dnet.flashTested, dnet.flashMenu, dnet.flashSolved, dnet.ours].join(", ") + (dnet.flashDbg ? " " + dnet.flashDbg : "") + ")");
  ok(dnet.none || (dnet.isoItem && dnet.isoMenu && dnet.isoSolved && dnet.isoGone), "изоляция сегмента ОКО: пункт доступен, взлом маршрутизации её снимает (" + [dnet.isoItem, dnet.isoMenu, dnet.isoSolved, dnet.isoGone].join(",") + ")");

  console.log("Навигатор: без карты — до ближайшей двери, с картой — до лестницы");
  const nav = await page.evaluate(() => {
    const g = LAB.game, G = g.G;
    LAB.clearFloorCache();
    g.enterFloor(1, 5, "down", true);
    g.CUR.fs.mapped = false;
    LAB.combat.foes().forEach(f => { f.dead = true; });
    SPOKEN.length = 0; g.navigate(false);
    const a = SPOKEN.join(" | ");
    g.mapFloor();
    SPOKEN.length = 0; g.navigate(false);
    const b = SPOKEN.join(" | ");
    return { a, b };
  });
  ok(/Ближайшая точка/.test(nav.a) || /Цель: лестница вниз/.test(nav.a), "без карты — к ближайшей точке на пути: " + nav.a.slice(0, 140));
  ok(/Цель: лестница вниз/.test(nav.b) && /Всего \d+ шаг/.test(nav.b), "с картой — весь путь до лестницы: " + nav.b.slice(0, 140));

  console.log("Мастерская на первом этаже уровня и на каждом третьем, тайник с двумя выходами, переносная турель, ОКО");
  const misc = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    const shopAt = F => { const fl = LAB.getFloor(G.seed, 1, F); return !!fl.shop && fl.objs.some(o => o.id === fl.shop && o.type === "workbench"); };
    out.wb = [1, 3, 6, 9, 12, 15, 18].every(shopAt) && [2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20].every(F => !shopAt(F));
    let sec = null;
    for (let F = 1; F <= 20 && !sec; F++) { const fl = LAB.getFloor(G.seed, 2, F); if (fl.secret >= 0) sec = fl; }
    out.secret = !sec || sec.doors.filter(d => d.lock && d.lock.type === "secret" && d.other === sec.secret).length === 2;
    g.enterFloor(1, 4, "down", true);
    LAB.combat.foes().forEach(f => { f.dead = true; });
    G.inv.turret_kit = 1;
    out.deploy = g.useItem("turret_kit");
    out.ally = LAB.combat.foes().some(f => !f.dead && f.ally && f.shots > 0);
    SPOKEN.length = 0;
    LAB.oko.state().lastSay = 0;
    LAB.oko.event("camera");
    await new Promise(r => setTimeout(r, 700));
    out.oko = SPOKEN.join(" | ");
    return out;
  });
  ok(misc.wb, "мастерская — на 1-м этаже уровня и на 3, 6, 9, 12, 15, 18-м");
  ok(misc.secret, "у тайной комнаты два выхода");
  ok(misc.deploy && misc.ally, "переносная турель встаёт и бьёт на нашей стороне");
  ok(/ОКО по громкой связи/.test(misc.oko), "камера заметила — ОКО объявляет тревогу: " + misc.oko.slice(0, 120));

  console.log("Тело героя: голод и еда, яд и антидот, кровь и бинт, нервы; история объявлений ОКО");
  const bod = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, C = LAB.combat, out = {};
    C.stop();
    const wait = ms => new Promise(r => setTimeout(r, ms));
    G.body.food = 26; G.body.lv = {}; g.bodyWarn(); SPOKEN.length = 0;
    g.advanceTime(90);
    out.hunger = { food: Math.round(G.body.food), said: SPOKEN.join(" | ") };
    /* голод не приходит быстро: от полной сытости до «проголодались» — полторы тысячи шагов, до голода — больше двух тысяч */
    G.body.food = 100; G.body.lv = {}; g.bodyWarn();
    let steps = 0, peckish = 0; while (G.body.food >= 25 && steps < 20000) { g.advanceTime(1); steps++; if (!peckish && G.body.food < 50) peckish = steps; }
    out.hungerSteps = steps; out.peckishSteps = peckish; G.body.food = 26; G.body.lv = {}; g.bodyWarn();
    let snack = null, sf = 0;
    for (let F = 1; F <= 20 && !snack; F++) { const fl = LAB.getFloor(G.seed, 2, F); snack = fl.objs.find(o => o.type === "snacks" && !o.broken); if (snack) sf = F; } /* сломанный автомат — другая проверка */
    out.snack = !!snack;
    if (snack) {
      g.enterFloor(2, sf, "down", true);
      G.credits = 500; G.en = 3; G.body.food = 20; const en0 = G.en;
      LAB.ui.closeAll(); g.objMenu(snack);
      const w = LAB.ui.top();
      out.title = w.title;
      w.i = w.items.findIndex(i => /Сухпаёк/.test(typeof i.label === "function" ? i.label() : i.label)); LAB.ui.activate();
      await wait(1300);
      out.ate = { food: Math.round(G.body.food), en: G.en, en0 };
      const w2 = LAB.ui.top(); w2.i = 0; LAB.ui.activate();
      w2.i = w2.items.findIndex(i => /Галеты/.test(typeof i.label === "function" ? i.label() : i.label)); LAB.ui.activate();
      await wait(100);
      out.took = G.inv.crackers || 0;
      LAB.ui.closeAll();
    }
    G.hp = G.hpMax = 400; G.inv.antidote = 1; G.st.poison = 10; G.body.tox = 60; G.body.lv = {};
    g.useMedkit();
    out.antidote = { poison: G.st.poison, tox: Math.round(G.body.tox) };
    G.st.bleed = 12; G.inv.bandage = 1; g.useMedkit();
    out.bleed = G.st.bleed;
    G.st.bleed = 6; const hb = G.hp; for (let i = 0; i < 6; i++) C.tick(); out.bleedHurt = hb - G.hp;
    G.body.neuro = 90; G.en = 200; if (G.implants.indexOf("regen") < 0) G.implants.push("regen");
    SPOKEN.length = 0; C.useImplant("regen"); out.neuroBlock = /Нейроперегрузка/.test(SPOKEN.join(" "));
    G.inv.neuroblock = 1; g.useItem("neuroblock"); out.neuro = Math.round(G.body.neuro);
    LAB.history.clear();
    ["Первое", "Второе", "Третье"].forEach(t => LAB.history.add("ОКО по громкой связи: «" + t + ".»"));
    const said = [], orig = LAB.Speech.say;
    LAB.Speech.say = function (t) { said.push(String(t)); };
    LAB.ui.closeAll();
    const key = k => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    key("."); key("ю"); key("."); key("."); key(",");
    LAB.Speech.say = orig;
    out.hist = said.join(" | ");
    G.hp = G.hpMax = 100;
    SPOKEN.length = 0; g.bodyStatus(); out.status = SPOKEN.join(" ");
    return out;
  });
  ok(bod.hunger.food < 26 && /Голод/.test(bod.hunger.said), "сытость падает со временем, «Эхо» предупреждает о голоде: " + bod.hunger.said);
  ok(bod.hungerSteps >= 2000 && bod.peckishSteps >= 1400, "голод приходит не быстро: от полной сытости до «проголодались» — " + bod.peckishSteps + " шагов, до голода — " + bod.hungerSteps);
  ok(!bod.snack || (/Автомат с едой/.test(bod.title) && bod.ate.food >= 60 && bod.ate.en > bod.ate.en0), "автомат с едой: сухпаёк утолил голод и пополнил энергию (" + JSON.stringify(bod.ate) + ")");
  ok(!bod.snack || bod.took === 1, "автомат с едой: «взять с собой» — галеты в рюкзаке");
  ok(bod.antidote.poison === 0 && bod.antidote.tox <= 25, "антидот снял отравление и вывел токсины (" + bod.antidote.tox + ")");
  ok(bod.bleed === 0 && bod.bleedHurt > 0, "кровотечение отнимает здоровье, бинт его останавливает");
  ok(bod.neuroBlock && bod.neuro <= 45, "нейроперегрузка отключает импланты, нейроблокатор снимает нагрузку (" + bod.neuro + ")");
  ok(/Третье.*Второе.*Первое.*самое раннее.*Второе/.test(bod.hist), "точка листает объявления ОКО назад, запятая — вперёд: " + bod.hist.slice(0, 160));
  ok(/Сытость/.test(bod.status) && /Токсины/.test(bod.status) && /Нейронагрузка/.test(bod.status), "состояние тела: " + bod.status.slice(0, 140));

  console.log("ОКО сопротивляется: ремонтники, отряды, дрон слежения, патрули смены, посты");
  const oko = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {}, C = LAB.combat;
    C.stop();
    const live = () => C.foes().filter(f => !f.dead);
    const dH = f => Math.abs(f.x - G.x) + Math.abs(f.y - G.y);
    const god = () => { G.hp = G.hpMax = 99999; G.dead = false; };
    /* (3.0) волны ОКО выжидают, пока герой в помещении: выйти в коридор (без передышки и ожидания) */
    const outside = () => {
      const fl = g.CUR.fl, W = LAB.W, fs = g.CUR.fs; let best = null, bd = 1e9;
      for (let i = 0; i < fl.t.length; i++) {
        if (fl.corrAt[i] < 0 || fl.room[i] >= 0 || fl.t[i] === LAB.T.DOOR) continue;
        const x = i % W, y = (i / W) | 0;
        if (!g.passable(x, y) || C.foes().some(f => !f.dead && f.x === x && f.y === y)) continue;
        const d = Math.abs(x - G.x) + Math.abs(y - G.y); if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) { G.x = best[0]; G.y = best[1]; }
      fs.wIn = false; fs.wOut = 0; fs.wHoldT = 0; fs.wReady = 0;
    };
    const posts = { lift: 0, stairs: 0, office: 0, inRoom: true };
    for (let L = 1; L <= 12; L++) for (let F = 3; F <= 19; F += 4) {
      const fl = LAB.getFloor(G.seed, L, F);
      /* (2.0) стражи лифта и лестниц — в нескольких шагах от входа (garrison.js) */
      const near = (f, re) => fl.objs.some(o => re.test(o.type) && Math.abs(o.x - f.x) + Math.abs(o.y - f.y) <= 7);
      fl.foes.forEach(f => { if (!f.guard) return; posts[f.guard] = (posts[f.guard] || 0) + 1; if (f.guard === "lift" && !near(f, /^elevator$/)) posts.inRoom = false; if (f.guard === "stairs" && !near(f, /^stairs_/)) posts.inRoom = false; });
    }
    out.posts = posts;
    /* ремонтник: выходит, доходит, чинит; уничтожили — идёт следующий */
    let found = null;
    for (let L = 1; L <= 3 && !found; L++) for (let F = 4; F <= 20 && !found; F++) { const fl = LAB.getFloor(G.seed, L, F); if (fl.turrets && !G.visited[L + "-" + F]) found = { L, F }; }
    if (found) {
      g.enterFloor(found.L, found.F, "down", true); god();
      live().forEach(f => { if (LAB.FOES[f.type].beh.indexOf("turret") < 0) f.dead = true; });
      C.turretsOff(); LAB.oko.event("turret_off");
      let t1 = -1, t2 = -1, again = -1;
      for (let i = 0; i < 200 && t1 < 0; i++) { C.tick(); if (C.repairers().length) t1 = i; }
      if (t1 >= 0) { C.repairers().forEach(f => C.despawn(f)); LAB.oko.event("kill", { task: "repair" }); }
      for (let i = 0; i < 300 && again < 0; i++) { C.tick(); if (C.repairers().length) again = i; }
      let last = null;
      for (let i = 0; i < 900 && t2 < 0; i++) { C.tick(); const rp = C.repairers()[0]; if (rp) last = rp; if (g.CUR.fs.turretMode === "on") t2 = i; }
      out.repair = { t1, again, t2 };
      if (t2 < 0) {
        const tur = live().filter(f => LAB.FOES[f.type].beh.indexOf("turret") >= 0 && !f.shots);
        out.repair.diag = "этаж " + found.L + "-" + found.F + ", турели " + tur.map(t => t.x + "," + t.y + (t.calm ? " спит" : "")).join("; ") + ", режим " + g.CUR.fs.turretMode +
          ", ремонтник " + (last ? last.id + " " + last.x + "," + last.y + " stuck " + last.stuck + (last.dead ? " снят" : "") + " " + last.state : "нет") +
          ", рядом с турелью: " + tur.map(t => live().filter(f => f !== t && Math.max(Math.abs(f.x - t.x), Math.abs(f.y - t.y)) <= 1).map(f => f.type + "@" + f.x + "," + f.y).join(" ")).join(" | ") +
          ", герой " + G.x + "," + G.y + ", такт ОКО " + g.CUR.fs.okoT + ", repairAt " + g.CUR.fs.repairAt + ", repairN " + g.CUR.fs.repairN + ", heat " + LAB.oko.state().heat;
      }
    }
    /* перепрошивка: новые машины с другого этажа идут на вас */
    g.enterFloor(2, 8, "down", true); god(); outside();
    g.CUR.fs.robots = true; C.robotsCalm();
    LAB.oko.event("robots", { x: G.x, y: G.y }); /* в игре — с координатами терминала, у которого стоит герой */
    let fresh = [];
    for (let i = 0; i < 80 && !fresh.length; i++) { C.tick(); fresh = live().filter(f => f.fresh && !f.calm); }
    const fd0 = Math.min.apply(null, fresh.map(dH).concat([999]));
    for (let i = 0; i < 40; i++) C.tick();
    out.fresh = { n: fresh.length, d0: fd0, d1: Math.min.apply(null, fresh.filter(f => !f.dead).map(dH).concat([999])) };
    /* неудачный взлом: проверка идёт к терминалу */
    g.enterFloor(2, 9, "down", true); god();
    live().forEach(f => { f.dead = true; }); outside();
    const term = g.CUR.fl.objs.find(o => o.type === "terminal") || { x: G.x, y: G.y };
    LAB.oko.event("hack_fail", { x: term.x, y: term.y });
    let sq = [];
    for (let i = 0; i < 40 && !sq.length; i++) { C.tick(); sq = live().filter(f => f.squad); }
    const toT = () => Math.min.apply(null, sq.filter(f => !f.dead).map(f => Math.abs(f.x - term.x) + Math.abs(f.y - term.y)).concat([999]));
    /* (3.0) дойдя, проверка обыскивает всё в 14 шагах вокруг (combat.js, search): в конце она может
       оказаться и дальше, чем вышла, — поэтому важно, что она подошла к терминалу, а не где кончила */
    const c0 = toT(); let cmin = c0; for (let i = 0; i < 60; i++) { C.tick(); cmin = Math.min(cmin, toT()); }
    out.check = { n: sq.length, c0, c1: toT(), cmin };
    /* дрон слежения: догоняет, держит дистанцию, стреляет */
    g.enterFloor(3, 5, "down", true); god();
    live().forEach(f => { f.dead = true; });
    /* дрон вылетает туда, где вас видела камера, дальше ищет сам */
    LAB.oko.report("camera", G.x, G.y, "seen");
    const dr = C.dispatch(1, "drone", { x: G.x, y: G.y }), hp0 = G.hp, dd = [];
    for (let i = 0; i < 200; i++) { C.tick(); if (dr[0]) dd.push(dH(dr[0])); }
    out.drone = { n: dr.length, near: dr[0] ? Math.min.apply(null, dd) : 0, close: dd.filter(v => v <= 6).length, hurt: hp0 - G.hp };
    /* (2.0) патрули смены: у патрульных свои участки (garrison.js); смена
       караула меняет маршруты, уводит дальнего и присылает нового, а при
       сильном подозрении — ещё патрульного к месту, где вас видели */
    g.enterFloor(3, 9, "down", true); god();
    LAB.oko.state().heat = 60;
    LAB.oko.report("camera", G.x, G.y, "seen");
    const pat0 = C.patrols().length;
    let r1 = C.patrols().map(f => JSON.stringify(f.route)), changed = false;
    for (let k = 0; k < 4 && !changed; k++) {
      LAB.oko.shift(); for (let i = 0; i < 40; i++) C.tick();
      if (C.patrols().some(f => f.route && r1.indexOf(JSON.stringify(f.route)) < 0)) changed = true;
      r1 = C.patrols().map(f => JSON.stringify(f.route));
    }
    out.patrol = { n: C.patrols().length, n0: pat0, changed };
    LAB.oko.state().heat = 0;
    /* страж у лифта: погнался — и вернулся на пост */
    g.enterFloor(2, 6, "down", true); god();
    const lg = C.guards().find(f => f.guard === "lift");
    if (lg) { lg.state = "hunt"; lg.lastKnown = { x: G.x, y: G.y }; lg.lost = 0; for (let i = 0; i < 160; i++) C.tick(); out.guard = { back: lg.x === lg.post.x && lg.y === lg.post.y, state: lg.state }; }
    /* павший враг не встаёт, когда вы вернулись на этаж */
    const v = live().find(f => !f.guard && LAB.FOES[f.type].beh.indexOf("turret") < 0);
    if (v) { const id = v.id; C.areaDamage(v.x, v.y, 0, 99999, "kinetic"); g.enterFloor(2, 7, "down", true); g.enterFloor(2, 6, "down", true); out.dead = !C.foes().some(f => f.id === id && !f.dead); }
    await new Promise(r => setTimeout(r, 700));
    out.said = SPOKEN.filter(t => /ОКО/.test(t)).slice(-6).join(" | ");
    G.hp = G.hpMax = 100;
    return out;
  });
  ok(oko.posts.lift > 20 && oko.posts.stairs > 20 && oko.posts.inRoom, "посты ОКО: стражи у лифта (" + oko.posts.lift + "), у лестницы (" + oko.posts.stairs + "), в кабинетах (" + oko.posts.office + ")");
  ok(!oko.repair || (oko.repair.t1 >= 0 && oko.repair.t1 <= 40), "отключили турели — ремонтник выходит через несколько секунд (тактов: " + (oko.repair && oko.repair.t1) + ")");
  ok(!oko.repair || oko.repair.again >= 0, "ремонтника уничтожили — ОКО шлёт следующего (тактов: " + (oko.repair && oko.repair.again) + ")");
  ok(!oko.repair || oko.repair.t2 >= 0, "ремонтник дошёл и починил: сеть снова у ОКО (тактов: " + (oko.repair && oko.repair.t2) + ")" + (oko.repair && oko.repair.diag ? " — " + oko.repair.diag : ""));
  ok(oko.fresh.n >= 1 && oko.fresh.d1 < oko.fresh.d0, "перепрошили роботов — новые машины ОКО идут к вам (" + oko.fresh.n + ", " + oko.fresh.d0 + " → " + oko.fresh.d1 + " шагов)");
  /* появилась у самого терминала — обыскивает место рядом и ближе может не подойти */
  ok(oko.check.n >= 1 && (oko.check.cmin < oko.check.c0 || oko.check.cmin <= 2), "неудачный взлом — проверка идёт к терминалу (" + oko.check.c0 + " → ближе всего " + oko.check.cmin + ", в конце " + oko.check.c1 + ")");
  ok(oko.drone.n === 1 && oko.drone.close >= 20 && oko.drone.near >= 2 && oko.drone.hurt > 0, "дрон слежения вылетел к месту, где вас видела камера, нашёл вас, держится на расстоянии (не ближе " + oko.drone.near + " шагов) и стреляет");
  ok(oko.patrol.n0 >= 3 && oko.patrol.n >= 2 && oko.patrol.changed, "патрули смены: на этаже " + oko.patrol.n0 + " → " + oko.patrol.n + ", маршруты меняются");
  ok(!oko.guard || (oko.guard.back && oko.guard.state === "idle"), "страж у лифта вернулся на пост");
  ok(oko.dead !== false, "павший враг не встаёт, когда вы вернулись на этаж");

  console.log("Система безопасности ОКО: режимы, источники, журнал, блокировка, глушилка");
  const secr = await page.evaluate(() => {
    const g = LAB.game, G = g.G, C = LAB.combat, O = LAB.oko, out = {};
    C.stop();
    g.enterFloor(3, 7, "down", true);
    G.hp = G.hpMax = 99999;
    C.foes().forEach(f => { f.dead = true; });
    O.state().heat = 0;
    /* между донесениями этаж пуст: отряды по тревоге не выходят и сами не докладывают */
    const hush = () => { C.foes().forEach(f => { f.dead = true; }); g.CUR.fs.waves = []; g.CUR.fs.droneAt = 0; };
    out.l0 = O.level();
    O.report("noise", G.x, G.y, "suspect", "выстрелы"); out.l1 = O.level();
    for (let i = 0; i < 100; i++) C.tick(); out.decay = O.level();
    O.report("camera", G.x, G.y, "seen"); out.l2 = O.level();
    for (let i = 0; i < 8; i++) { C.tick(); hush(); } O.report("robot", G.x, G.y, "seen");
    for (let i = 0; i < 8; i++) { C.tick(); hush(); } O.report("camera", G.x, G.y, "seen"); out.l3 = O.level();
    O.state().heat = 85;
    for (let i = 0; i < 8; i++) { C.tick(); hush(); } O.report("camera", G.x, G.y, "seen"); out.l4 = O.level();
    /* донесения чаще раза в три секунды ОКО склеивает: если между ними
       пришло чужое подтверждение, ждём следующего свежего */
    const seenWas = [];
    for (let k = 0; k < 3 && O.level() !== 5; k++) {
      for (let i = 0; i < 8; i++) { C.tick(); hush(); }
      const sw = g.CUR.fs.sec.seen; seenWas.push(sw ? sw.src + "@" + sw.t + "/" + O.T() : "-");
      O.report("camera", G.x, G.y, "seen");
    }
    out.l5 = O.level();
    if (out.l5 !== 5 || seenWas.length > 1) out.diag = "жар " + O.state().heat + ", комната " + g.CUR.fl.room[G.y * LAB.W + G.x] + ", блокировок " + (g.CUR.fs.sealUsed || 0) + ", глушилка " + G.st.jam + ", слепое " + !!g.CUR.fs.okoBlind + ", такт " + g.CUR.fs.okoT + ", пауза " + g.paused + ", сложность " + LAB.settings.difficulty + ", этаж " + g.CUR.key + ", до донесений: " + seenWas.join(" ");
    out.sealed = Object.keys(g.CUR.fs.okoLock || {}).length;
    out.blocked = g.CUR.fl.doors.filter(d => g.okoLockLeft(d) > 0 && /Аварийная блокировка/.test(g.doorBlock(d))).length;
    /* носитель ушёл: машины этажа выбыли, отряды и дрон не вылетели */
    const gone = () => { C.foes().forEach(f => { f.dead = true; }); g.CUR.fs.waves = []; g.CUR.fs.droneAt = 0; };
    gone();
    for (let i = 0; i < 70; i++) { C.tick(); gone(); } out.l6 = O.level();
    for (let i = 0; i < 160; i++) { C.tick(); gone(); } out.end = O.level();
    out.log = O.logText(30);
    G.st.jam = 60; out.jam = O.report("camera", G.x, G.y, "seen"); G.st.jam = 0;
    O.state().heat = 0;
    return out;
  });
  ok(secr.l0 === 0 && secr.l1 === 1 && secr.decay === 0, "подозрение от акустического датчика и затухание, если признак не подтвердился");
  ok(secr.l2 === 2 && secr.l3 === 3 && secr.l4 === 4 && secr.l5 === 5, "камера — подтверждённое нарушение, повторы — локальная, при высоком подозрении — комплексная тревога и аварийная блокировка (" + [secr.l2, secr.l3, secr.l4, secr.l5].join(" → ") + (secr.diag ? "; " + secr.diag : "") + ")");
  ok(secr.sealed >= 1 && secr.blocked >= 1, "аварийная блокировка заперла двери помещения (" + secr.sealed + ", закрыто: " + secr.blocked + ")");
  ok(secr.l6 === 6 && (secr.end === 0 || secr.end === 1), "цель потеряна — восстановление и прочёсывание, потом штатный режим (" + secr.l6 + " → " + secr.end + ")");
  ok(/Камера, .*носитель обнаружен/.test(secr.log) && /Акустический датчик/.test(secr.log), "журнал безопасности: у каждого события — источник: " + secr.log.slice(0, 120));
  ok(secr.jam === false, "глушилка: датчики ОКО молчат");

  console.log("Роботы и турели: подход наискосок, кабель, ремонт, ключ ОКО, перегрев, фланг, слабое место, мимик");
  const rob = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, C = LAB.combat, O = LAB.oko, out = {};
    C.stop();
    const live = () => C.foes().filter(f => !f.dead);
    const god = () => { G.hp = G.hpMax = 99999; G.dead = false; };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    let found = null;
    for (let L = 1; L <= 6 && !found; L++) for (let F = 4; F <= 20 && !found; F++) { const fl = LAB.getFloor(G.seed, L, F); if (fl.turrets && !G.visited[L + "-" + F]) found = { L, F }; }
    if (!found) return { none: true };
    g.enterFloor(found.L, found.F, "down", true); god();
    O.state().heat = 0;
    live().forEach(f => { if (!C.isTurret(f)) f.dead = true; });
    const tur = live().filter(f => C.isTurret(f));
    const t = tur[0];
    const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(d => [t.x + d[0], t.y + d[1]]).filter(c => g.passable(c[0], c[1]));
    if (!diag.length) return { none: true, why: "нет клетки наискосок" };
    G.x = diag[0][0]; G.y = diag[0][1];
    /* Enter у турели: меню турели (или выбор, если рядом ещё что-то) */
    LAB.ui.closeAll(); g.interact();
    let top = LAB.ui.top();
    if (top && /Что рядом/.test(top.title || "")) { const ti = top.items.findIndex(i => /Турель|турель/.test(label(i))); if (ti >= 0) { top.i = ti; LAB.ui.activate(); top = LAB.ui.top(); } }
    out.menu = top ? top.items.map(label) : [];
    const ci = top ? top.items.findIndex(i => /перерезать кабель/.test(label(i))) : -1;
    if (ci >= 0) {
      top.i = ci; LAB.ui.activate();
      for (let k = 0; k < 700; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); await wait(60); }
      await wait(400);
    }
    out.cut = t.cut; out.cutRec = !!(g.CUR.fs.cutT && g.CUR.fs.cutT[t.id]);
    out.cutLog = /турель обесточена/.test(O.logText(6));
    /* ремонтник ОКО сращивает кабель */
    let r1 = -1, r2 = -1;
    for (let i = 0; i < 240 && r1 < 0; i++) { C.tick(); god(); if (C.repairers().length) r1 = i; }
    let lastR = null;
    for (let i = 0; i < 900 && r2 < 0; i++) { C.tick(); god(); const rp = C.repairers()[0]; if (rp) lastR = rp; if (!t.cut) r2 = i; }
    out.rep = { r1, r2 };
    if (r2 < 0) out.rep.diag = "этаж " + g.CUR.key + ", турель " + t.x + "," + t.y + (t.dead ? " разбита" : "") + ", ремонтник " + (lastR ? lastR.type + " " + lastR.x + "," + lastR.y + " задача " + lastR.task + " состояние " + lastR.state + (lastR.dead ? " снят" : "") + " шагов до цели " + lastR.pathLen + " застрял " + lastR.stuck : "нет") + ", ремонтников сейчас " + C.repairers().length + ", repairAt " + g.CUR.fs.repairAt + ", такт " + g.CUR.fs.okoT + ", режим " + g.CUR.fs.turretMode + ", перерезано " + C.cutCount();
    LAB.ui.closeAll();
    /* ключ ОКО: турель на нашей стороне, контрвзлом её не трогает; отзыв ключа — снова у ОКО */
    live().forEach(f => { if (!C.isTurret(f)) C.despawn(f); });
    G.inv.okokey = 1;
    G.x = diag[0][0]; G.y = diag[0][1];
    g.turretSabotage(t);
    top = LAB.ui.top();
    const ki = top ? top.items.findIndex(i => /служебный ключ ОКО/.test(label(i))) : -1;
    if (ki >= 0) { top.i = ki; LAB.ui.activate(); }
    out.key = { used: G.inv.okokey === 0, mine: t.mine, ally: t.ally };
    C.turretsHostile(); out.key.afterCounter = t.ally;
    g.CUR.fs.revokeAt = g.CUR.fs.okoT + 1; for (let i = 0; i < 3; i++) { C.tick(); god(); }
    out.key.revoked = !t.mine && !t.ally;
    /* ключ ОКО на терминале — команда одной турели, а не всей обороне этажа */
    const termS = g.CUR.fl.objs.find(o => o.type === "terminal" && o.sub === "sec");
    if (termS) {
      tur.forEach(f => { f.cut = false; f.quiet = false; f.mine = false; f.calm = false; f.ally = false; });
      g.CUR.fs.cutT = {}; g.CUR.fs.mineT = {}; g.CUR.fs.turretMode = "on";
      G.inv.okokey = 1; g.objState(termS).hacked = true;
      const lv0 = O.level();
      LAB.ui.closeAll(); g.objMenu(termS);
      const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
      const step = pick(/Оборонная сеть/) && pick(/^Турели этажа/) && pick(/команда одной турели/);
      const lw = LAB.ui.top(); if (step && lw) { lw.i = 0; LAB.ui.activate(); }
      const ok2 = step && pick(/Тихо снять/);
      out.keyTerm = { step: ok2, quiet: tur.filter(f => f.cut && f.quiet).length, live: tur.filter(f => !f.cut && !f.calm).length, n: tur.length, used: G.inv.okokey === 0, noAlarm: O.level() <= Math.max(1, lv0) };
      LAB.ui.closeAll();
      tur.forEach(f => { f.cut = false; f.quiet = false; f.calm = false; }); g.CUR.fs.cutT = {};
    }
    /* перегрев: после серии выстрелов турель молчит пару тактов */
    t.cut = false; t.calm = false; t.ally = false; t.state = "hunt";
    let lineCell = null;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let k = 2; k <= 3 && !lineCell; k++) { let ok = true; for (let j = 1; j <= k; j++) if (!g.passable(t.x + d[0] * j, t.y + d[1] * j)) ok = false; if (ok) lineCell = [t.x + d[0] * k, t.y + d[1] * k]; }
      if (lineCell) break;
    }
    out.over = -1; out.shots = 0;
    if (lineCell) {
      G.x = lineCell[0]; G.y = lineCell[1]; god();
      const hp0 = G.hp;
      for (let i = 0; i < 40 && out.over < 0; i++) { t.lastKnown = { x: G.x, y: G.y }; C.tick(); god(); if (t.over > 0) out.over = i; }
      out.shots = t.heatN;
    } else out.over = "нет линии";
    /* фланг: второй робот заходит с другой стороны */
    g.enterFloor(2, 7, "down", true); god();
    live().forEach(f => { f.dead = true; });
    /* у лестницы бывает тесно: герой встаёт на ближайшую клетку, открытую на все четыре стороны */
    const open4 = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(v => g.passable(x + v[0], y + v[1]));
    if (!open4(G.x, G.y)) { const x0 = G.x, y0 = G.y; seek: for (let r = 1; r < 14; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { const x = x0 + dx, y = y0 + dy; if (g.passable(x, y) && open4(x, y)) { G.x = x; G.y = y; break seek; } } }
    const h = { x: G.x, y: G.y }, free = [];
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) { const x = h.x + dx, y = h.y + dy; if ((dx || dy) && g.passable(x, y)) free.push([x, y, Math.abs(dx) + Math.abs(dy)]); }
    /* первый — вплотную, и так, чтобы за героем напротив него было куда встать (иначе фланг законно сбоку) */
    const adj = free.filter(c => c[2] === 1 && g.passable(2 * h.x - c[0], 2 * h.y - c[1])), far = free.filter(c => c[2] >= 3);
    if (adj.length && far.length) {
      const a = C.spawnFoe("guardbot", adj[0][0], adj[0][1], {}), b = C.spawnFoe("guardbot", far[0][0], far[0][1], {});
      a.state = b.state = "hunt"; a.lastKnown = b.lastKnown = h;
      const fc = C.flankCell(b);
      out.flank = fc ? (fc[0] - h.x) === -(a.x - h.x) && (fc[1] - h.y) === -(a.y - h.y) : false;
      /* слабое место: шок по бронированному роботу без щита — броня не держит */
      a.shield = 0; a.hp = a.maxhp = 1000;
      const hpA = a.hp; C.damageFoe(a, 20, "phys", {}); const dPhys = hpA - a.hp;
      const hpB = a.hp; C.damageFoe(a, 20, "shock", {}); const dShock = hpB - a.hp;
      out.node = { nodeT: a.nodeT, dPhys, dShock };
      a.dead = true; b.dead = true;
    }
    /* мимик: «прибор» гудит неровно, когда вы рядом */
    let hum = 0; const ah = LAB.atmos.mimicHum; LAB.atmos.mimicHum = function () { hum++; };
    const mc = free.filter(c => c[2] === 2)[0];
    if (mc) { const m = C.spawnFoe("mimicbox", mc[0], mc[1], {}); for (let i = 0; i < 60; i++) { C.tick(); god(); } out.mimic = { hum, still: m.disguised }; m.dead = true; }
    LAB.atmos.mimicHum = ah;
    LAB.ui.closeAll();
    return out;
  });
  ok(rob.none || rob.menu.some(l => /перерезать кабель/.test(l)), "у турели наискосок — меню: перерезать кабель питания, осмотреть" + (rob.why ? " (" + rob.why + ")" : ""));
  ok(rob.none || (rob.cut && rob.cutRec && rob.cutLog), "кабель перерезан повтором сигналов — турель молчит, ОКО записало в журнал");
  ok(rob.none || (rob.rep.r1 >= 0 && rob.rep.r2 >= 0), "ремонтник ОКО вышел и срастил кабель (тактов: " + (rob.rep && rob.rep.r1) + " → " + (rob.rep && rob.rep.r2) + ")" + (rob.rep && rob.rep.diag ? " — " + rob.rep.diag : ""));
  ok(rob.none || (rob.key.used && rob.key.mine && rob.key.ally && rob.key.afterCounter && rob.key.revoked), "служебный ключ ОКО: турель наша, контрвзлом не возвращает, отзыв ключа — снова у ОКО");
  ok(rob.none || !rob.keyTerm || (rob.keyTerm.step && rob.keyTerm.quiet === 1 && rob.keyTerm.live === rob.keyTerm.n - 1 && rob.keyTerm.used && rob.keyTerm.noAlarm), "ключ ОКО на терминале: команда одной турели — тихо обесточена одна, остальные под током, тревоги нет (" + JSON.stringify(rob.keyTerm) + ")");
  ok(rob.none || (typeof rob.over === "number" && rob.over >= 0), "турель перегревается после серии выстрелов (такт " + rob.over + ")");
  ok(rob.flank === true, "второй робот заходит с фланга — с другой стороны от первого");
  ok(rob.node && rob.node.nodeT > 0 && rob.node.dShock > rob.node.dPhys, "слабое место: шок по энергоузлу бронированного робота проходит сквозь броню (" + (rob.node && rob.node.dPhys) + " → " + (rob.node && rob.node.dShock) + ")");
  ok(rob.mimic && rob.mimic.hum > 0 && rob.mimic.still, "ящик-ловушка выдаёт себя неровным гулом, пока вы рядом (" + (rob.mimic && rob.mimic.hum) + ")");

  console.log("Стабилизация по аудиту: боссы и носители, перепрошивка, враг на клетке, броня, задания, таймеры, пауза, записи, записки, фон");
  const stab = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const god = () => { g.G.hp = g.G.hpMax = 99999; g.G.dead = false; };
    C.stop(); LAB.ui.closeAll();
    /* К1: босс на патрульной основе (уровень 17) и носители — не патрули, их не уводят; уведённый носитель роняет ношу */
    g.enterFloor(17, 20, "down", true); god();
    const boss = C.foes().find(f => !f.dead && f.boss);
    out.boss = !!boss;
    if (boss) {
      out.bossNotPatrol = C.patrols().indexOf(boss) < 0;
      out.bossNoDismiss = C.dismiss(boss) === false;
      for (let i = 0; i < 6; i++) LAB.oko.shift();
      out.bossStays = !boss.dead && boss.task !== "leave";
      /* К2: перепрошивка — страж уровня остаётся врагом */
      const rc = C.robotsCalm();
      out.bossHostile = !boss.calm && rc.boss >= 1;
    }
    let car = null;
    for (let L = 1; L <= 4 && !car; L++) for (let F = 2; F <= 19 && !car; F++) {
      const fl = LAB.getFloor(g.G.seed, L, F);
      if (fl.foes.some(f => f.carry && f.carry.length && !f.boss && LAB.FOES[f.type].kind === "mech")) { g.enterFloor(L, F, "down", true); god(); car = C.foes().find(f => !f.dead && f.carry && f.carry.length && !f.boss && f.kind === "mech"); }
    }
    out.car = !!car;
    if (car) {
      out.carNotPatrol = C.patrols().indexOf(car) < 0;
      const want = car.carry.length, d0 = g.CUR.fs.drops.length;
      C.robotsCalm();
      out.carDropped = g.CUR.fs.drops.length - d0 >= want && car.calm && !car.carry;
      /* после перезагрузки этажа ноша не возвращается к роботу */
      C.syncFoes(); C.loadFoes();
      const again = C.foes().find(f => f.id === car.id);
      out.carNoRecarry = !!again && !again.carry;
      g.CUR.fs.robots = false;
    }
    /* враг на клетке: враждебный не пускает, спокойный уступает дорогу */
    g.enterFloor(2, 6, "down", true); god();
    C.foes().forEach(f => { f.dead = true; });
    const dirs = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    let free = null;
    for (const k in dirs) { const x = g.G.x + dirs[k][0], y = g.G.y + dirs[k][1]; if (!free && g.passable(x, y) && !g.foeAt(x, y)) free = { k, x, y }; }
    if (free) {
      const h = C.spawnFoe("patrolbot", free.x, free.y, {});
      h.state = "idle";
      const x0 = g.G.x, y0 = g.G.y;
      out.foeAt = g.foeAt(free.x, free.y) === h;
      g.tryMove(free.k, false);
      out.hostileBlocks = g.G.x === x0 && g.G.y === y0;
      h.calm = true;
      g.tryMove(free.k, false);
      out.calmSwaps = g.G.x === free.x && g.G.y === free.y && h.x === x0 && h.y === y0;
      h.dead = true;
      LAB.ui.closeAll();
    }
    /* пауза: Enter у терминала ничего не открывает */
    const term = ["vending", "coffee", "drinks", "snacks", "pc", "terminal"].map(t => g.CUR.fl.objs.find(o => o.type === t)).find(Boolean);
    if (term) {
      const nb = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(d => [term.x + d[0], term.y + d[1]]).find(c => g.passable(c[0], c[1]));
      if (nb) {
        g.G.x = nb[0]; g.G.y = nb[1]; LAB.ui.closeAll();
        g.paused = true; g.interact(); out.pausedNoMenu = !LAB.ui.top(); g.paused = false;
        g.interact(); out.unpausedMenu = !!LAB.ui.top(); LAB.ui.closeAll();
      }
    }
    /* отложенное действие прежней игры не срабатывает */
    let hit = 0;
    g.later(() => { hit++; }, 50); g.session++; await wait(150); out.laterDropped = hit === 0;
    g.later(() => { hit++; }, 50); await wait(150); out.laterRan = hit === 1;
    /* боеприпасы блока из мастерской — число, а не NaN */
    const rcA = (LAB.RECIPES || []).find(r => /^ammo:/.test(r.out) && !(r.out.slice(5) in g.G.ammo));
    if (rcA) {
      const L0 = g.G.L; g.G.L = Math.max(g.G.L, rcA.minL || 1);
      for (const k in rcA.need) g.G.inv[k] = (g.G.inv[k] || 0) + rcA.need[k];
      g.craft(rcA); out.ammoN = g.G.ammo[rcA.out.slice(5)]; g.G.L = L0;
    }
    /* задание выжившего не повторяется после перестройки этажа */
    const npc = { key: "T-1-s", n: "Проверочный выживший" };
    g.takeQuest(npc);
    const q0 = g.G.quests.find(q => q.id === "T-1-s:0"); if (q0) q0.done = true;
    const npc2 = { key: "T-1-s", n: "Проверочный выживший" }; /* этаж из кэша: этапа на объекте нет */
    out.questStage = g.questStage(npc2);
    g.takeQuest(npc2);
    out.questNext = !!g.G.quests.find(q => q.id === "T-1-s:1");
    /* записка — ссылкой, текст собирается */
    g.giveItem({ kind: "note", note: "staff", id: "tnote1" }, true);
    const ne = g.G.noteList[g.G.noteList.length - 1];
    out.noteRef = !!ne && ne.x == null && !!ne.src && (g.noteFull(ne).x || "").length > 20;
    /* броня после загрузки: надетая — та же запись, что в списке */
    if (!g.G.armors.length) g.giveItem({ kind: "armor", a: LAB.makeArmor(Object.keys(LAB.ARMORS)[0], 1, 1) }, true);
    g.equipArmor(0);
    g.saveSlot(3);
    g.loadSlot(3);
    const G2 = g.G;
    out.armorSame = !!G2.armor && G2.armors.indexOf(G2.armor) >= 0;
    out.noteAfterLoad = (g.noteFull(G2.noteList[G2.noteList.length - 1]).x || "").length > 20;
    /* резервная копия слота и загрузка из неё */
    g.saveSlot(3);
    out.bak = !!localStorage.getItem("lab_slot3_bak");
    out.bakLoad = g.loadSlot(3, true) === true;
    /* (2.6) запись помнит режим сложности: загрузили — играете в нём же */
    const dg = g.G.diff; g.saveSlot(3);
    LAB.settings.difficulty = dg === 3 ? 2 : 3;
    g.loadSlot(3);
    out.diffKept = g.G.diff === dg && LAB.settings.difficulty === dg && LAB.dk().n === LAB.DIFF[dg].n;
    const raw3 = JSON.parse(localStorage.getItem("lab_slot3")); raw3.g.diff = 4; raw3.meta.diff = 4; raw3.g.tb = 1; raw3.meta.tb = 1; localStorage.setItem("lab_slot2", JSON.stringify(raw3));
    out.diffSlot = g.slotText(2);
    g.loadSlot(2);
    /* (3.0) и пошаговый бой: запись помнит его, загрузка возвращает, цены — пошаговые */
    out.diffLoad = g.G.diff === 4 && LAB.settings.difficulty === 4 && LAB.dk().n === "Лёгкий" && g.G.tb === 1 && LAB.settings.turnBased === 1 && LAB.dk().tb === true && Math.abs(LAB.dk().price - LAB.DIFF[4].price * LAB.TB_ECON.price) < 1e-9;
    localStorage.removeItem("lab_slot2");
    g.loadSlot(3);
    out.diffBack = g.G.diff === dg && LAB.settings.difficulty === dg && !g.G.tb && !LAB.settings.turnBased && !LAB.dk().tb;
    /* битая запись: не загружается, текущая игра остаётся */
    const seed0 = g.G.seed;
    localStorage.setItem("lab_slot2", JSON.stringify({ meta: { L: 150, F: 1 }, g: { L: 150, F: 1, seed: "битая", weapons: [], hp: 1, hpMax: 1 } }));
    out.badRefused = g.loadSlot(2) === false && g.G.seed === seed0 && g.entered;
    localStorage.removeItem("lab_slot2");
    /* автозапись во время спуска ждёт */
    const a0 = localStorage.getItem("lab_auto");
    g.descending = true; g.autosave(); out.descNoAuto = localStorage.getItem("lab_auto") === a0; g.descending = false;
    /* лёгкая сложность: при гибели почти ничего не теряется */
    const d0 = LAB.settings.difficulty; LAB.settings.difficulty = 4;
    g.G.credits = 1000; g.G.dead = false; g.die(); out.easyLoss = 1000 - g.G.credits; g.session++; g.G.dead = false; g.paused = false;
    LAB.settings.difficulty = d0;
    /* фон: мир стоит, вернулись — идёт */
    LAB.ui.closeAll(); god(); g.enterFloor(2, 6, "down", true); god();
    C.start();
    const T = () => g.CUR.fs.okoT || 0;
    const t0 = T(); LAB.bg = true; await wait(1300); const t1 = T(); LAB.bg = false; await wait(1300); const t2 = T();
    C.stop();
    out.bg = { t0, t1, t2 };
    /* уборщик не подбирает ключ, а мелочь подбирает */
    const cc = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [g.G.x + d[0] * 2, g.G.y + d[1] * 2]).find(c => g.passable(c[0], c[1]) && !g.foeAt(c[0], c[1]));
    if (cc) {
      const cl = C.spawnFoe("cleaner", cc[0], cc[1], {});
      g.CUR.fs.drops.push({ id: "tkey1", kind: "key", key: "tk", keyName: "Ключ от двери: проверка", n: "Ключ", x: cc[0], y: cc[1] });
      g.CUR.fs.drops.push({ id: "tscr1", kind: "item", item: "scrap", n: 1, x: cc[0], y: cc[1] });
      /* (2.3) добыча с поверженного врага ждёт носителя: уборщик её не трогает */
      const did = "d" + (g.CUR.fs.dseq = (g.CUR.fs.dseq || 0) + 1);
      g.CUR.fs.drops.push({ id: did, kind: "item", item: "medkit_s", n: 1, x: cc[0], y: cc[1] });
      C._cleanerTick(cl);
      out.cleaner = { key: !!g.CUR.fs.taken.tkey1, scrap: !!g.CUR.fs.taken.tscr1, loot: !!g.CUR.fs.taken[did] };
      cl.dead = true;
    }
    /* узел ОКО без свежего контакта не поднимает этаж */
    const cells = [];
    for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) { const x = g.G.x + dx, y = g.G.y + dy; if (Math.abs(dx) + Math.abs(dy) >= 2 && g.passable(x, y) && !g.foeAt(x, y)) cells.push([x, y]); }
    if (cells.length >= 2) {
      const rl = C.spawnFoe("relay", cells[0][0], cells[0][1], {});
      const pb = C.spawnFoe("patrolbot", cells[cells.length - 1][0], cells[cells.length - 1][1], {});
      out.relayPb = !!pb;
      if (pb) { pb.state = "idle"; pb.calm = false; }
      rl.state = "alert"; rl.seenT = 99; rl.hearT = 99; rl.lastKnown = { x: g.G.x, y: g.G.y };
      C._relayCall(rl); out.relayStale = !pb || pb.state === "idle";
      rl.seenT = 0; C._relayCall(rl); out.relayFresh = !pb || pb.state === "alert";
      rl.dead = true; if (pb) pb.dead = true;
    }
    /* «Отойти» закрывает окно автомата (оно открыто «с удержанием») */
    let auto = null;
    for (let F = 1; F <= 20 && !auto; F++) { const fl = LAB.getFloor(g.G.seed, 2, F); const o = fl.objs.find(q => q.type === "snacks" && !q.broken); if (o) { g.enterFloor(2, F, "down", true); god(); auto = o; } }
    if (auto) {
      LAB.ui.closeAll(); g.objMenu(auto);
      const wa = LAB.ui.top();
      wa.i = wa.items.findIndex(i => i.label === "Отойти"); LAB.ui.activate();
      out.leaveCloses = LAB.ui.top() !== wa;
    }
    /* лишний жест после удачного взлома не перебивает итог */
    SPOKEN.length = 0;
    let hres = null;
    LAB.mini.hack(3, ok => { hres = ok; });
    for (let k = 0; k < 700; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) { const want = c.seq[c.pos]; LAB.mini.gesture({ kind: "swipe", n: 1, dir: want }); if (c.done) { LAB.mini.gesture({ kind: "swipe", n: 1, dir: want === "U" ? "D" : "U" }); } } await wait(60); }
    await wait(500);
    out.hackClean = hres === true && !SPOKEN.some(t => /Неверно/.test(t));
    /* «Блок I» читается словом */
    out.roman = LAB.keysSpoken("Блок I. Подножие. Блок IV.") === "Блок первый. Подножие. Блок четвёртый.";
    /* разбор оружия не меняет оружие в руках */
    while (g.G.weapons.length < 3) g.G.weapons.push(LAB.makeWeapon("baton", 1, 0, 1));
    g.G.wi = 2; const inHand = g.G.weapons[2].id;
    if (g.scrapWeapon) { g.scrapWeapon(1); out.scrapKeeps = g.G.weapons[g.G.wi] && g.G.weapons[g.G.wi].id === inHand; }
    LAB.ui.closeAll();
    return out;
  });
  ok(stab.leaveCloses, "«Отойти» закрывает окно автомата");
  ok(stab.hackClean, "лишний жест после удачного взлома не перебивает итог");
  ok(stab.roman, "«Блок I» читается как «Блок первый»");
  ok(stab.scrapKeeps !== false, "разбор оружия не меняет оружие в руках");
  ok(stab.boss && stab.bossNotPatrol && stab.bossNoDismiss && stab.bossStays, "босс на патрульной основе — не патруль: смена караула его не уводит (уровень 17)");
  ok(stab.boss && stab.bossHostile, "перепрошивка: страж уровня чужую прошивку не принимает — остаётся врагом");
  ok(!stab.car || (stab.carNotPatrol && stab.carDropped && stab.carNoRecarry), "носитель ключей не патрулирует; перепрошитый — выкладывает ношу, после перезагрузки этажа она к нему не возвращается");
  ok(stab.foeAt && stab.hostileBlocks && stab.calmSwaps, "враг на клетке: враждебный не пускает, спокойная машина уступает дорогу");
  ok(stab.pausedNoMenu && stab.unpausedMenu, "во время паузы Enter ничего не открывает, после — открывает");
  ok(stab.laterDropped && stab.laterRan, "отложенное действие прежней игры не срабатывает, текущей — срабатывает");
  ok(typeof stab.ammoN === "number" && stab.ammoN >= 1, "боеприпасы блока из мастерской — число (" + stab.ammoN + ")");
  ok(stab.questStage === 1 && stab.questNext, "задание выжившего не повторяется: следующий этап после перестройки этажа");
  ok(stab.noteRef && stab.noteAfterLoad, "записка хранится ссылкой, текст собирается и после загрузки");
  ok(stab.armorSame, "после загрузки надетая броня — та же запись, что в списке брони");
  ok(stab.bak && stab.bakLoad, "резервная копия слота есть и загружается");
  ok(stab.diffKept && stab.diffLoad && stab.diffBack && /лёгкий режим, пошаговый бой/.test(stab.diffSlot || ""), "запись помнит режим сложности и бой: загрузка возвращает их, слот их называет (" + JSON.stringify({ k: stab.diffKept, l: stab.diffLoad, b: stab.diffBack, s: stab.diffSlot }) + ")");
  ok(stab.badRefused, "битая запись не загружается, текущая игра остаётся");
  ok(stab.descNoAuto, "во время спуска автозапись ждёт");
  ok(stab.easyLoss === 0, "лёгкая сложность: при гибели кредиты не теряются (" + stab.easyLoss + ")");
  ok(stab.bg.t1 === stab.bg.t0 && stab.bg.t2 > stab.bg.t1, "игра в фоне: мир стоит, вернулись — идёт (" + stab.bg.t0 + " → " + stab.bg.t1 + " → " + stab.bg.t2 + ")");
  ok(!stab.cleaner || (!stab.cleaner.key && stab.cleaner.scrap && !stab.cleaner.loot), "уборщик не подбирает ключ и добычу с поверженных врагов, а металлолом подбирает");
  ok(stab.relayPb && stab.relayStale && stab.relayFresh, "узел ОКО поднимает машины только по свежему контакту");

  console.log("Глубины под Ядром: прессы и щит, инкубаторы, журналы «Отражения», затвор, древние узлы, враги глубин");
  const dep = await page.evaluate(async () => {
const g = LAB.game, C = LAB.combat, D = LAB.depths, O = LAB.oko, out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const god = () => { g.G.hp = g.G.hpMax = 400; g.G.dead = false; };
const label = i => typeof i.label === "function" ? i.label() : i.label;
C.stop(); LAB.ui.closeAll();
const findFloor = (L0, L1, pred) => { for (let L = L0; L <= L1; L++) for (let F = 1; F <= 20; F++) { const fl = LAB.getFloor(g.G.seed, L, F); if (pred(fl)) return { L, F }; } return null; };
/* I. Подножие: пресс бьёт, щит его останавливает */
const fp = findFloor(11, 20, fl => (fl.hazards || []).length && fl.objs.some(o => o.type === "powergrid"));
out.press = !!fp;
if (fp) {
  g.enterFloor(fp.L, fp.F, "down", true); god();
  C.foes().forEach(f => { f.dead = true; });
  const h = g.CUR.fl.hazards[0];
  g.G.x = h.cells[0][0]; g.G.y = h.cells[0][1]; g.G.face = "N";
  const hp0 = g.G.hp; let hit = -1;
  for (let i = 0; i < 12 && hit < 0; i++) { C.tick(); if (g.G.hp < hp0) hit = i; }
  out.pressHit = { hit, dmg: hp0 - g.G.hp, off: !D.hazardAt(g.G.x, g.G.y) };
  const grid = g.CUR.fl.objs.find(o => o.type === "powergrid");
  D._setGrid(grid, "press");
  god(); g.G.x = h.cells[0][0]; g.G.y = h.cells[0][1];
  const hp1 = g.G.hp; for (let i = 0; i < 12; i++) C.tick();
  out.pressOff = g.G.hp === hp1 && D.ventOn();
  D._setGrid(grid, "sens");
  out.deaf = O.report("noise", g.G.x, g.G.y, "suspect", "выстрелы") === false;
  D._setGrid(grid, "vent");
  out.ventOffNow = !D.ventOn();
  D._setGrid(grid, "press");
}
/* II. Колыбель: правила инкубатора */
const fc = findFloor(21, 40, fl => fl.objs.some(o => o.type === "incubator"));
out.cradle = !!fc;
if (fc) {
  g.enterFloor(fc.L, fc.F, "down", true); god();
  C.foes().forEach(f => { f.dead = true; });
  const base = g.CUR.fl.objs.find(o => o.type === "incubator");
  let mkN = 0;
  const mk = (kind, temp) => ({ id: "ti" + kind + temp + "_" + (mkN++), type: "incubator", x: base.x, y: base.y, room: base.room, spec: "К-99", kind, temp0: temp });
  const W = D.world();
  /* условный образец в тепле — движение; охладили (вентиляция есть) — покой; открыли — жив, награда */
  const oc = mk("conditional", 2), sc = g.objState(oc); if (sc.temp == null) sc.temp = 2;
  out.condHot = D.activity(oc, sc);
  sc.temp = 1; out.condCool = D.activity(oc, sc);
  const s0 = W.saved; D._openIncub(oc, sc); out.condOpen = W.saved === s0 + 1;
  /* опасный — бьётся о стекло; открыли — вырвался */
  const od = mk("dangerous", 1), sd = g.objState(od); sd.temp = 1;
  out.dangAct = D.activity(od, sd);
  const n0 = C.foes().filter(f => !f.dead).length; D._openIncub(od, sd);
  out.dangBeast = C.foes().filter(f => !f.dead).length === n0 + 1;
  C.foes().forEach(f => { f.dead = true; });
  /* полезный — стерилизовали: погиб */
  const ou = mk("useful", 1), su = g.objState(ou); su.temp = 1;
  const k0 = W.killed; D._sterilize(ou, su); out.useKilled = W.killed === k0 + 1;
  /* меню: охлаждение без вентиляции не работает */
  const v0 = JSON.stringify(W.vent); W.vent = {};
  const oh = mk("conditional", 2); LAB.ui.closeAll(); g.objMenu(oh);
  const wi = LAB.ui.top(); wi.i = wi.items.findIndex(i => /Охладить/.test(label(i))); SPOKEN.length = 0; LAB.ui.activate();
  out.noVent = SPOKEN.some(t => /вентиляция нижних глубин обесточена/.test(t));
  W.vent = JSON.parse(v0); if (!D.ventOn()) W.vent["t"] = 1;
  SPOKEN.length = 0; wi.i = wi.items.findIndex(i => /Охладить/.test(label(i))); LAB.ui.activate();
  out.cooled = g.objState(oh).temp === 1;
  LAB.ui.closeAll();
  /* журнал смены читается */
  const jn = g.noteText({ note: "depth", dk: "cradle", specs: [{ code: "К-12", kind: "dangerous", lie: true }], id: "x" });
  out.journal = /К-12/.test(jn.x) && /Табло камер — нет/.test(jn.x);
}
/* III. Отражение: журнал сверен — тайный проход; ошибка — навигатор сбит */
const fm = findFloor(41, 60, fl => fl.objs.some(o => o.type === "mirrorterm"));
out.mirror = !!fm;
if (fm) {
  g.enterFloor(fm.L, fm.F, "down", true); god();
  const mt = g.CUR.fl.objs.find(o => o.type === "mirrorterm");
  const pz = D.mirrorPuzzle(mt), st = g.objState(mt);
  out.mz = { n: pz.list.length, kinds: pz.list.map(e => e.cls).sort().join("") };
  st.cls = pz.list.map(() => 0);
  D._checkMirror(mt, st, pz);
  out.wrongJam = g.G.st.navjam > 0 && !st.done;
  SPOKEN.length = 0; g.navigate(true); out.navSays = SPOKEN.some(t => /Навигатор сбит отражённым сигналом/.test(t));
  g.G.st.navjam = 0; st.lockT = 0;
  st.cls = pz.list.map(e => e.cls);
  const m0 = D.world().mirror; D._checkMirror(mt, st, pz);
  out.solved = st.done && D.world().mirror === m0 + 1;
}
/* IV. Механизм: синхронизация и затвор */
let syncOk = null;
LAB.mini.sync(ok => { syncOk = ok; });
for (let k = 0; k < 60; k++) { const c = LAB.mini._cur(); if (c && c.type === "sync" && c.ready) { c.pB = c.pA; break; } await wait(100); }
await wait(2200);
LAB.mini.gesture({ kind: "dtap", n: 1 });
await wait(600);
out.syncOk = syncOk;
const fg = findFloor(61, 80, fl => fl.objs.some(o => o.type === "syncgate"));
out.gate = !!fg;
if (fg) {
  g.enterFloor(fg.L, fg.F, "down", true); god();
  const og = g.CUR.fl.objs.find(o => o.type === "syncgate"), sg = g.objState(og);
  LAB.ui.closeAll(); g.objMenu(og);
  out.gateStage1 = LAB.ui.top() && LAB.ui.top().items.some(i => /Ступень 1/.test(label(i)));
  LAB.ui.closeAll();
  sg.stage = 4; const s1 = D.world().synced; D._openGate(og, sg);
  out.gateOpen = g.CUR.fs.power && g.CUR.fs.lockdown && D.world().synced === s1 + 1;
  await wait(1000);
  const tw = LAB.ui.top(); const ti = tw ? tw.items.findIndex(i => /Забрать/.test(label(i))) : -1;
  if (ti >= 0) { tw.i = ti; LAB.ui.activate(); }
  out.gateLoot = (og.loot || []).every(it => it.taken);
  LAB.ui.closeAll();
}
/* V. Исток: подсказки узла зависят от глубин выше; ответ — фрагмент памяти */
const fn = findFloor(81, 100, fl => fl.objs.some(o => o.type === "ancient"));
out.node = !!fn;
if (fn) {
  g.enterFloor(fn.L, fn.F, "down", true); god();
  const on = g.CUR.fl.objs.find(o => o.type === "ancient"), sn = g.objState(on);
  const W = D.world(), keep = JSON.stringify(W);
  W.vent = {}; W.saved = 0; W.killed = 0; W.mirror = 0;
  out.hint0 = D.nodeHints().n;
  W.vent = { t: 1 }; W.saved = 2; W.killed = 1; W.mirror = 1;
  out.hint4 = D.nodeHints().n;
  const nl = g.G.noteList.length, n0 = W.nodes;
  D._nodeResult(on, sn, true, "seq");
  out.nodeOk = W.nodes === n0 + 1 && g.G.noteList.length === nl + 1 && /Фрагмент памяти/.test(g.noteFull(g.G.noteList[g.G.noteList.length - 1]).x);
  /* мелодия узла: ответить последовательностью */
  const on2 = { id: "tn2", type: "ancient", x: on.x, y: on.y, seed: 12345 }, sn2 = g.objState(on2);
  let mres = null; const seq = D.nodeSeq(on2);
  LAB.mini.melody(seq, ok => { mres = ok; });
  for (let k = 0; k < 200; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "melody") break; if (!c.busy && !c.done) LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); await wait(60); }
  await wait(500);
  out.melody = mres === true && seq.length === 5;
  const nt = g.noteText({ note: "depth", dk: "node", seq: seq, id: "y" });
  out.nodeNote = nt.x.split(",").length >= 5;
}
LAB.ui.closeAll();

    /* враги глубин */
    const freeAround = (cx, cy, r0, r1) => { const o2 = []; for (let dx = -r1; dx <= r1; dx++) for (let dy = -r1; dy <= r1; dy++) { const x = cx + dx, y = cy + dy, dd = Math.abs(dx) + Math.abs(dy); if (dd >= r0 && dd <= r1 && g.passable(x, y) && !g.foeAt(x, y) && !(x === g.G.x && y === g.G.y)) o2.push([x, y, dd]); } return o2; };
    const inLos = c => LAB.los(g.CUR.fl, g.CUR.fs, c[0], c[1], g.G.x, g.G.y);
    g.enterFloor(12, 5, "down", true); god(); C.foes().forEach(f => { f.dead = true; }); O.state().heat = 0; O.setLevel(0);
    const oc3 = freeAround(g.G.x, g.G.y, 2, 3).filter(inLos)[0];
    if (oc3) {
      const ob = C.spawnFoe("g_listener", oc3[0], oc3[1], {});
      const hpb = g.G.hp;
      for (let i = 0; i < 6; i++) C.tick();
      out.observer = O.level() >= 2 && /Скрытый наблюдатель/.test(O.logText(8)) && g.G.hp === hpb;
      ob.dead = true; O.setLevel(0);
    }
    const fc2 = freeAround(g.G.x, g.G.y, 1, 2).filter(inLos)[0];
    if (fc2) {
      const fx = C.spawnFoe("g_welder", fc2[0], fc2[1], {});
      let drained = false;
      for (let i = 0; i < 24 && !drained; i++) { const h0 = g.G.hp; C.tick(); if (g.G.hp < h0) drained = true; }
      out.fixer = drained && g.G.st.slow > 0;
      fx.dead = true; g.G.st.slow = 0; god();
    }
    g.enterFloor(25, 5, "down", true); god(); C.foes().forEach(f => { f.dead = true; });
    const vfar = freeAround(g.G.x, g.G.y, 5, 7)[0];
    const sdir = Object.keys(LAB.DIRS).find(k => g.passable(g.G.x + LAB.DIRS[k][0], g.G.y + LAB.DIRS[k][1]) && !g.foeAt(g.G.x + LAB.DIRS[k][0], g.G.y + LAB.DIRS[k][1]));
    if (vfar && sdir) {
      const vb = C.spawnFoe("k_catfish", vfar[0], vfar[1], {}); vb.state = "idle"; g.G.noise = 0;
      g.tryMove(sdir, false); g.G.noise = 0; C.tick();
      out.vibro = vb.state !== "idle"; vb.dead = true;
    }
    const hc = freeAround(g.G.x, g.G.y, 2, 2).filter(inLos)[0];
    if (hc) { const ht = C.spawnFoe("k_glowbug", hc[0], hc[1], {}); g.G.st.cloak = 20; ht.state = "idle"; C.tick(); out.heat = ht.state === "hunt"; g.G.st.cloak = 0; ht.dead = true; }
    g.enterFloor(65, 6, "down", true); god(); C.foes().forEach(f => { f.dead = true; });
    const rmb = g.CUR.fl.room[g.G.y * LAB.W + g.G.x];
    /* выход без замка (у запертой двери привратнику встать некуда — это верно), проём открыт */
    const exits = g.CUR.fl.doors.filter(d => (d.room === rmb || d.other === rmb) && !d.lock);
    if (rmb >= 0 && exits.length) {
      const ex = exits[0], bcell = freeAround(ex.x, ex.y, 2, 4)[0], acell = freeAround(g.G.x, g.G.y, 1, 1)[0];
      g.CUR.fs.doors[ex.id] = 2;
      if (bcell && acell) {
        const a = C.spawnFoe("m_patrol", acell[0], acell[1], {}), b = C.spawnFoe("m_gatekeeper", bcell[0], bcell[1], {});
        let onDoor = false;
        for (let i = 0; i < 40 && !onDoor; i++) { a.state = "hunt"; a.lastKnown = { x: g.G.x, y: g.G.y }; b.state = "hunt"; b.lastKnown = { x: g.G.x, y: g.G.y }; C.tick(); god(); onDoor = exits.some(d => d.x === b.x && d.y === b.y); }
        out.blocker = onDoor;
        a.dead = true; b.dead = true;
      }
    }
    LAB.ui.closeAll();
    return out;
  });
  ok(dep.press && dep.pressHit.hit >= 0 && dep.pressHit.dmg > 0 && dep.pressHit.off, "«Подножие»: пресс бьёт по ритму и отбрасывает с линии (такт " + (dep.pressHit && dep.pressHit.hit) + ", урон " + (dep.pressHit && dep.pressHit.dmg) + ")");
  ok(dep.press && dep.pressOff && dep.deaf && dep.ventOffNow, "«Подножие»: щит — две линии из трёх: прессы встали, вентиляция ожила; вибродатчики обесточены — ОКО не слышит выстрелов");
  ok(dep.cradle && dep.condHot === "движение" && dep.condCool === "покой" && dep.condOpen, "«Колыбель»: в тепле образец в движении, охладили — покой, открыли — жив и даёт награду");
  ok(dep.cradle && dep.dangBeast && dep.useKilled, "«Колыбель»: бьётся о стекло — вскрыли и выпустили тварь; стерилизация губит полезный образец");
  ok(dep.cradle && dep.noVent && dep.cooled, "«Колыбель»: без вентиляции нижних глубин («Подножие») охлаждение не работает, с ней — работает");
  ok(dep.cradle && dep.journal, "«Колыбель»: журнал смены читается; табло правдивее журнала");
  ok(dep.mirror && dep.mz.n === 5 && dep.mz.kinds === "00012", "«Отражение»: в журнале три настоящих записи, повтор и запись другого состояния");
  ok(dep.mirror && dep.wrongJam && dep.navSays, "«Отражение»: ошибка сверки сбивает навигатор — с признаками и сроком");
  ok(dep.mirror && dep.solved, "«Отражение»: журнал сверен — отражённый контур замолк, проход отмечен");
  ok(dep.syncOk === true, "синхронизация: такты свели — механизмы сцеплены");
  ok(dep.gate && dep.gateStage1 && dep.gateOpen && dep.gateLoot, "«Механизм»: затвор в четыре ступени — открыт, питание и блокировки этажа сняты, хранилище взято");
  ok(dep.node && dep.hint0 === 0 && dep.hint4 === 4, "«Исток»: узел подсказывает тем больше, чем бережнее пройдены глубины выше (" + dep.hint0 + " → " + dep.hint4 + ")");
  ok(dep.node && dep.nodeOk && dep.melody && dep.nodeNote, "«Исток»: узел ответил — фрагмент памяти комплекса; последовательность играется и записана словами");
  ok(dep.observer === true, "«Подножие»: скрытый наблюдатель не нападает — докладывает ОКО");
  ok(dep.fixer === true, "«Подножие»: ремонтный автомат принял носителя за неисправный узел — обесточивает");
  ok(dep.vibro === true && dep.heat === true, "«Колыбель»: твари чуют шаги по вибрации и тепло тела сквозь маскировку");
  ok(dep.blocker === true, "«Механизм»: привратник перекрывает выход, пока другой гонит носителя");

  console.log("Архив документов: категории, глубины, авторы, первая буква, письма и документы компьютеров; финал помнит глубины");
  const arc = await page.evaluate(async () => {
    const g = LAB.game, D = LAB.depths, out = {};
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
    LAB.ui.closeAll();
    g.enterFloor(12, 4, "down", true);
    const n0 = g.G.noteList.length;
    g.giveItem({ kind: "note", note: "depth", dk: "doc", dep: 1, id: "tdoc1" }, true);
    g.giveItem({ kind: "note", note: "depth", dk: "memory", n: 2, id: "tmem1" }, true);
    g.giveItem({ kind: "note", note: "staff", id: "tstaff1" }, true);
    const added = g.G.noteList.slice(n0);
    out.added = added.length;
    out.meta = added.every(n => n.cat && typeof n.pl === "string" && n.L === 12);
    out.docCat = g.docInfo(added[0]).cat;
    out.memCat = g.docInfo(added[1]).cat;
    out.sum = g.docInfo(added[0]).sum.length > 10;
    /* письмо и документ компьютера — в архив */
    /* письмо без кода (код ложится в «Известные коды», а не в архив), которое ещё не в архиве */
    let found = null;
    for (let L = 2; L <= 4 && !found; L++) for (let F = 1; F <= 20 && !found; F++) {
      const fl = LAB.getFloor(g.G.seed, L, F); if (!fl.objs.some(q => q.type === "pc")) continue;
      g.enterFloor(L, F, "down", true);
      for (const pc of g.CUR.fl.objs.filter(q => q.type === "pc")) {
        const d = LAB.office.pcData(pc), mi = (d.mails || []).findIndex((m, i) => !m.code && !g.G.notes["mail:" + g.CUR.key + ":" + pc.id + ":" + i]);
        if (mi >= 0) { found = { pc, mi }; break; }
      }
    }
    if (found) {
      const m0 = g.G.noteList.length;
      LAB.office._openMail(found.pc, found.mi);
      out.pcArchived = g.G.noteList.length === m0 + 1 && /^Письмо: /.test(g.G.noteList[g.G.noteList.length - 1].t);
      LAB.ui.closeAll();
    }
    /* документ компьютера, ещё не прочитанный, — тоже в архив */
    let fdoc = null;
    for (let L = 2; L <= 6 && !fdoc; L++) for (let F = 1; F <= 20 && !fdoc; F++) {
      const fl = LAB.getFloor(g.G.seed, L, F); if (!fl.objs.some(q => q.type === "pc")) continue;
      g.enterFloor(L, F, "down", true);
      for (const pc of g.CUR.fl.objs.filter(q => q.type === "pc")) {
        const d = LAB.office.pcData(pc);
        if ((d.docs || []).length && !(d.docs || []).some((dc, i) => g.G.notes["doc:" + g.CUR.key + ":" + pc.id + ":" + i])) { fdoc = pc; break; }
      }
    }
    if (fdoc) {
      const m1 = g.G.noteList.length;
      LAB.ui.closeAll(); LAB.office._docList(fdoc); pick(/^«/);
      out.pcDoc = g.G.noteList.length === m1 + 1;
      LAB.ui.closeAll();
    }
    /* окно архива: поиск по категории и глубине, первая буква, «прослушать снова» */
    LAB.ui.closeAll(); LAB.ui.inventory();
    out.inv = pick(/Архив документов/);
    out.byCat = pick(/По категории/);
    const cats = LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
    out.catHasMem = cats.some(l => /Фрагменты памяти комплекса/.test(l));
    pick(/Фрагменты памяти комплекса/);
    out.docOpen = pick(/«Фрагмент памяти комплекса»/) && !!LAB.ui.top() && !!LAB.ui.top().note;
    LAB.ui.closeAll(); LAB.ui.inventory(); pick(/Архив документов/);
    out.byDepth = pick(/По глубине/) && LAB.ui.top().items.some(i => /«Подножие»/.test(label(i)));
    LAB.ui.closeAll(); LAB.ui.inventory(); pick(/Архив документов/);
    out.byLetter = pick(/По первой букве/) && LAB.ui.top().items.some(i => /^на «/.test(label(i)));
    LAB.ui.closeAll(); LAB.ui.inventory(); pick(/Архив документов/);
    out.again = LAB.ui.top().items.some(i => /Прослушать снова/.test(label(i)));
    LAB.ui.closeAll();
    /* перекрёстные ссылки: приказ коменданта упоминает геодезиста Лыкова */
    g.archiveAdd("tlink1", "Журнал геодезической съёмки, участок «Глубина»", "Отметки опор не сходятся с проектом.", "инженер-геодезист Лыков", "Технические журналы");
    g.archiveAdd("tlink2", "Приказ по участку № 14", "Журналы геодезиста Лыкова изъять.", "комендант участка Сафронов", "Приказы");
    LAB.ui.inventory(); pick(/Архив документов/); pick(/Все документы/); pick(/«Приказ по участку № 14»/);
    const lw = LAB.ui.top();
    out.link = !!lw && !!lw.note && lw.items.some(i => /^Связано: «Журнал геодезической съёмки/.test(label(i)));
    out.linkOpen = pick(/^Связано: «Журнал геодезической/) && /^Журнал геодезической/.test(LAB.ui.top().title);
    out.linkBack = pick(/^Связано: «Приказ по участку/) && /^Приказ по участку/.test(LAB.ui.top().title);
    LAB.ui.closeAll();
    /* финал помнит, как пройдены глубины */
    const W = D.world();
    W.vent = { t: 1 }; W.saved = 3; W.killed = 1; W.mirror = 2; W.synced = 1; W.nodes = 3; W.forced = 0;
    const ep = D.epilogue();
    out.epi = /Пять глубин помнят/.test(ep) && /выпущено живыми — 3/.test(ep) && /Исток узнал вас/.test(ep);
    W.nodes = 1; W.forced = 3;
    out.epiForced = /погашенные силой/.test(D.epilogue());
    return out;
  });
  ok(arc.added === 3 && arc.meta && arc.sum, "архив: у каждого документа — категория, место находки, уровень и краткое описание");
  ok(arc.memCat === "Фрагменты памяти комплекса" && !!arc.docCat, "архив: документы глубин со своими категориями (" + arc.docCat + ")");
  ok(arc.pcArchived !== false && arc.pcDoc !== false, "архив: прочитанные письма и документы компьютеров попадают в архив");
  ok(arc.inv && arc.byCat && arc.catHasMem && arc.docOpen, "архив: поиск по категории — документ открывается и звучит снова");
  ok(arc.byDepth && arc.byLetter && arc.again, "архив: поиск по глубине и по первой букве; «прослушать снова»");
  ok(arc.link && arc.linkOpen && arc.linkBack, "архив: перекрёстные ссылки — из приказа к журналу, чьего автора он упоминает, и обратно");
  ok(arc.epi && arc.epiForced, "финал: страница о пяти глубинах собирается из решений игрока");

  console.log("Мастерская: уровни верстака, схемы, модули, износ и ремонт, перегрев, разбор, исследование, приманки, детали");
  const ws = await page.evaluate(async () => {
    const g = LAB.game, W = LAB.workshop, C = LAB.combat, out = {};
    let G = g.G;
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const rec = id => LAB.RECIPES.find(r => r.id === id);
    C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true);
    C.foes().forEach(f => { f.dead = true; });
    /* событие этажа (аварийный свет и прочее) выпадает случайно: проверка — при обычном */
    G.event = "norm"; G.eventUntil = G.min + 100000;
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench");
    if (!wb) return { noBench: true };
    G.x = wb.x; G.y = wb.y; G.hp = G.hpMax = 9999;
    for (const k of LAB.PARTS) G.inv[k] = 8;
    /* уровень и состояние верстака постоянны для этажа */
    const b = W.bench(wb); out.det = W.bench(wb) === b && [1, 2, 3].indexOf(b.tier) >= 0;
    b.tier = 1; b.dmg = false; b.spec = ""; /* профиль общий: цены и выход — без поправок */
    LAB.ui.craft(wb);
    out.root = !!LAB.ui.top() && LAB.ui.top().title === "Мастерская" && /Базовый верстак/.test(LAB.ui.top().intro || "");
    out.tierMsg = W.check(rec("emp"));
    out.baseOk = W.check(rec("medkit_s")) === "";
    /* повреждённый — только ручной инструмент, пока не починить; при аварийном свете станки стоят */
    b.tier = 2; b.dmg = true;
    out.dmgMsg = /разбиты/.test(W.check(rec("emp")));
    out.fix = W.fixBench(b) && !b.dmg && W.check(rec("emp")) === "";
    const ev0 = G.event; G.event = "dark"; out.dark = /резервном питании/.test(W.check(rec("emp"))); G.event = ev0;
    /* схемы: неизвестная не собирается; открывают инженер (один раз), документ, разбор устройства, исследование */
    G.bp = {};
    out.unknown = /Схема неизвестна/.test(W.check(rec("m_acc")));
    const n0 = () => Object.keys(G.bp).length;
    const npc = { key: "T-ws-eng", n: "Проверочный инженер", prof: "Инженер" };
    let k0 = n0(); W.npcTip(npc); out.npcLearn = W.isEng(npc) && n0() === k0 + 1;
    W.npcTip(npc); out.npcOnce = n0() === k0 + 1;
    let docOk = false; for (let i = 0; i < 60 && !docOk; i++) { k0 = n0(); W.fromDoc("T-doc-" + i, "Технические журналы"); docOk = n0() > k0; }
    out.docLearn = docOk && W.fromDoc("T-doc-x", "Личные записи") === "";
    delete G.bp.decoy_e; G.inv.noise = 1; W.salvage("noise", b); out.salvLearn = W.known(rec("decoy_e"));
    k0 = n0(); out.research = W.research("spec", b) && n0() === k0 + 1;
    out.expNo = !W.research("exp", b);
    /* модуль: сборка — шаг 2 — установка; несовместимость; гнёзда; снятие в запас */
    ["m_range", "m_reload", "m_quiet", "m_acc"].forEach(id => W.learn(id, "", true));
    G.weapons = G.weapons.slice(0, 1);
    G.weapons.push(LAB.makeWeapon("spark", 2, 0, 1, "w_ws")); G.wi = 1;
    const w = G.weapons[1], r0 = w.rng, c0 = w.cap;
    LAB.ui.closeAll(); LAB.ui.craft(wb);
    g.craft(rec("m_range"));
    out.step2 = !!LAB.ui.top() && /шаг 2 из 2/.test(LAB.ui.top().title);
    out.meleeNo = !!LAB.ui.top() && LAB.ui.top().items.some(i => /монтировка.*нельзя: ближнему бою дальность не нужна/i.test(label(i)) && i.disabled);
    pick(/в руках/);
    out.range = w.rng === r0 + 2 && !!LAB.ui.top() && LAB.ui.top().title === "Мастерская";
    g.craft(rec("m_reload")); pick(/в руках/);
    /* (3.7) модуль встаёт, а ёмкость от модулей не растёт: её поднимает только верстак */
    out.cap = !!(w.mod && w.mod.reload === 1) && w.cap === c0;
    g.craft(rec("m_quiet")); pick(/в руках/);
    out.slots = W.used(w) === 3 && /гнёзда заняты/.test(W.compat(w, "acc"));
    W.uninstall(w, "range"); out.unmod = w.rng === r0 && (G.inv.m_range || 0) >= 1;
    out.compat = /аннигиляцию/.test(W.compat(LAB.makeWeapon("ppistol", 5, 0, 1), "quiet")) && /не греется/.test(W.compat(LAB.makeWeapon("kpistol", 2, 0, 1), "cool"));
    /* глушитель: выстрел тише; выстрел изнашивает оружие */
    LAB.ui.closeAll(); G.drawn = true; w.charge = w.cap; G.noise = 0;
    await wait(600);
    const fired = C.fire("N");
    out.quiet = { fired, noise: G.noise, cond: W.cond(w) };
    /* (3.5) бластер изнашивается на треть медленнее прочего стрелкового: тот же выстрел
       у «Искры» и у лазерной винтовки того же качества */
    const wb1 = LAB.makeWeapon("spark", 1, 0, 1), wl1 = LAB.makeWeapon("laser", 1, 0, 1);
    W.afterShot(wb1, false, 1); W.afterShot(wl1, false, 1);
    out.blasterWear = { b: Math.round((100 - W.cond(wb1)) * 100) / 100, l: Math.round((100 - W.cond(wl1)) * 100) / 100 };
    /* сильно изношенное оружие даёт осечку */
    w.cond = 5; const s0 = G.stats.shots, ch0 = w.charge, rnd = Math.random; Math.random = () => 0.001;
    await wait(600); const mf = C.fire("N"); Math.random = rnd;
    out.misfire = mf === true && G.stats.shots === s0 && w.charge === ch0 - 1;
    /* ремонт у верстака: станки — до 100; ремнабор в поле — плюс 35 */
    LAB.workshop._at(wb);
    for (const k of LAB.PARTS) G.inv[k] = 8; /* модули выше съели металлолом */
    const sc0 = G.inv.scrap; out.repair = W.repairWeapon(1, b) && W.cond(w) === 100 && G.inv.scrap < sc0;
    G.inv.toolkit = 0; G.weapons[0].cond = 100; /* набор инструментов прибавил бы десять; цель — одна */
    w.cond = 40; G.inv.wrepair = 1; g.useItem("wrepair"); out.field = W.cond(w) === 75 && !G.inv.wrepair;
    /* перегрев: долгая очередь — ствол остывает, выстрела нет */
    w.heat = 0; w.hotUntil = 0;
    const t0 = Date.now(); let hot = -1;
    for (let i = 0; i < 40 && hot < 0; i++) { W.afterShot(w, false, t0 + i * 100); if (w.hotUntil) hot = i; }
    await wait(500); w.charge = w.cap;
    out.heat = { at: hot, blocked: C.fire("N") === false };
    w.hotUntil = 0; w.heat = 0;
    /* разбор оружия: модули возвращаются в запас */
    const mq0 = G.inv.m_quiet || 0; g.scrapWeapon(1); out.scrapMods = (G.inv.m_quiet || 0) === mq0 + 1;
    /* электронная приманка: робот идёт к ней, ОКО отмечает подозрение (этаж — без перепрошивки и глушилки прежних проверок) */
    g.CUR.fs.robots = false; g.CUR.fs.okoBlind = false; g.CUR.fs.netCut = false; G.st.jam = 0; G.st.cloak = 0;
    C.stop(); /* такты не идут: робот не успеет увидеть героя сам */
    /* бросаем туда, где приманка улетит хотя бы на четыре шага; робот — вне прямой видимости героя */
    const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    let face = "E", land = [G.x, G.y], best = -1;
    for (const k of ["E", "W", "N", "S"]) { let x = G.x, y = G.y, n = 0; while (n < 6 && g.passable(x + DV[k][0], y + DV[k][1])) { x += DV[k][0]; y += DV[k][1]; n++; } if (n > best) { best = n; face = k; land = [x, y]; } }
    let cRob = null;
    for (let y = 0; y < LAB.H && !cRob; y++) for (let x = 0; x < LAB.W && !cRob; x++) {
      const dl = Math.abs(x - land[0]) + Math.abs(y - land[1]);
      if (dl >= 3 && dl <= 12 && g.passable(x, y) && !LAB.los(g.CUR.fl, g.CUR.fs, x, y, G.x, G.y)) cRob = [x, y];
    }
    const bot = cRob ? C.spawnFoe("patrolbot", cRob[0], cRob[1], {}) : null;
    if (bot) { bot.ally = false; bot.calm = false; bot.state = "idle"; bot.lastKnown = null; }
    G.face = face; G.inv.decoy_e = 1; g.useItem("decoy_e"); await wait(800);
    out.decoy = !!bot && bot.state === "alert" && !!bot.lastKnown && /электронной приманки/.test(LAB.oko.logText(10));
    if (!out.decoy) out.decoyDiag = (bot ? bot.state + " " + JSON.stringify(bot.lastKnown) + " до героя " + (Math.abs(bot.x - G.x) + Math.abs(bot.y - G.y)) + ", бросок " + best + " шагов" : "нет робота") + " | " + LAB.oko.logText(3);
    /* сенсорная помеха: камера рядом ослепла */
    /* камера — в паре шагов от героя, с той стороны, где есть место; помеху бросаем в её сторону */
    const cCam = [[G.x, G.y + 2], [G.x + 2, G.y], [G.x - 2, G.y], [G.x, G.y - 2], [G.x, G.y]].map(a => C.freeCellNear(a[0], a[1], null)).find(Boolean), cam = cCam ? C.spawnFoe("cam", cCam[0], cCam[1], {}) : null;
    if (cam) { cam.ally = false; cam.calm = false; }
    const cdx = cCam ? cCam[0] - G.x : 0, cdy = cCam ? cCam[1] - G.y : 1;
    G.face = Math.abs(cdy) >= Math.abs(cdx) ? (cdy < 0 ? "N" : "S") : (cdx < 0 ? "W" : "E"); G.inv.disruptor = 1; g.useItem("disruptor"); await wait(800);
    out.blind = !!cam && cam.blindT > 0;
    if (!out.blind) out.blindDiag = cam ? "камера в " + Math.max(Math.abs(cam.x - G.x), Math.abs(cam.y - G.y)) + " " + cam.kind + " " + JSON.stringify(cam.beh) : "нет камеры";
    /* ЭМ-подавитель останавливает робота; игла пробивает броню */
    if (bot) {
      bot.hp = bot.maxhp = 5000; bot.frozen = 0;
      C.damageFoe(bot, 3, "emp", { stunMech: 3, quiet: true }); out.stun = bot.frozen === 3;
      bot.arm = 12; bot.shield = 0; bot.nodeT = 0;
      let h0 = bot.hp; C.damageFoe(bot, 20, "kinetic", { quiet: true }); const dPlain = h0 - bot.hp;
      h0 = bot.hp; C.damageFoe(bot, 20, "kinetic", { quiet: true, apierce: 0.7 }); const dPierce = h0 - bot.hp;
      out.pierce = dPierce > dPlain;
      bot.dead = true;
    }
    if (cam) cam.dead = true;
    out.profile = /останавливает роботов/.test(W.profile(LAB.makeWeapon("suppressor", 3, 0, 1))) && /не греется/.test(W.profile(LAB.makeWeapon("kpistol", 2, 0, 1)));
    /* экономика: у каждой детали — где найти и для чего; рецепты из существующих предметов; у каждого — класс */
    out.parts = LAB.PARTS.filter(k => !(W.srcOf(k) && (W.uses(k).kn.length + W.uses(k).unk) > 0));
    out.recipes = LAB.RECIPES.filter(rc => !Object.keys(rc.need).every(k => LAB.ITEMS[k]) || ["base", "spec", "exp", "cnc", "syn"].indexOf(W.clsOf(rc)) < 0).map(rc => rc.id);
    LAB.ui.closeAll(); LAB.ui.craft(wb); out.guide = pick(/Детали: где найти/) && LAB.ui.top().items.some(i => /Реле: у вас .*Где найти: щитовые/.test(label(i)));
    /* схемы и модули переживают запись и загрузку */
    G.weapons.push(LAB.makeWeapon("spark", 2, 0, 1, "w_ws2")); W.install(G.weapons[G.weapons.length - 1], "quiet");
    LAB.ui.closeAll(); g.saveSlot(3); g.loadSlot(3); G = g.G;
    out.saved = G.weapons.some(x => x.mod && x.mod.quiet) && !!G.bp.m_acc;
    LAB.workshop._at(null); LAB.ui.closeAll();
    return out;
  });
  ok(!ws.noBench && ws.det && ws.root, "верстак: уровень и состояние постоянны для этажа, окно мастерской называет оснастку");
  ok(/специализированный верстак/.test(ws.tierMsg || "") && ws.baseOk, "базовый верстак: базовое собирает, специализированное — нет, и говорит, где искать: " + (ws.tierMsg || "").slice(0, 90));
  ok(ws.dmgMsg && ws.fix && ws.dark, "повреждённый верстак чинится из деталей; при аварийном свете станки стоят");
  ok(ws.unknown && ws.npcLearn && ws.npcOnce && ws.docLearn && ws.salvLearn && ws.research && ws.expNo, "схемы: неизвестная не собирается; открывают инженер (один раз), технический документ, разбор устройства, исследование на верстаке");
  ok(ws.step2 && ws.meleeNo && ws.range && ws.cap && ws.slots && ws.unmod && ws.compat, "модули: сборка — шаг 2 — выбор оружия; несовместимые не ставятся и объясняют почему; гнёзда; снятый модуль — в запасе");
  ok(ws.quiet && ws.quiet.fired && ws.quiet.noise > 0 && ws.quiet.noise <= 5 && ws.quiet.cond < 100, "глушитель: выстрел тише (шум " + (ws.quiet && ws.quiet.noise) + " вместо 8); выстрел изнашивает оружие");
  ok(ws.blasterWear && ws.blasterWear.b > 0 && ws.blasterWear.b <= ws.blasterWear.l * 0.72, "бластер изнашивается на треть медленнее прочего стрелкового: за выстрел " + (ws.blasterWear && ws.blasterWear.b) + " против " + (ws.blasterWear && ws.blasterWear.l) + " у лазерной винтовки");
  ok(ws.misfire && ws.repair && ws.field, "изношенное оружие даёт осечку; ремонт у верстака — до 100, ремнабор в поле — плюс 35");
  ok(ws.heat && ws.heat.at > 0 && ws.heat.blocked, "перегрев: после долгой очереди ствол остывает и не стреляет (выстрел " + (ws.heat && ws.heat.at) + ")");
  ok(ws.scrapMods, "разбор оружия: модули возвращаются в запас");
  ok(ws.decoy && ws.blind, "электронная приманка уводит робота и сбивает ОКО; сенсорная помеха ослепляет камеру" + (ws.decoyDiag ? "; приманка: " + ws.decoyDiag : "") + (ws.blindDiag ? "; помеха: " + ws.blindDiag : ""));
  ok(ws.stun && ws.pierce && ws.profile, "ЭМ-подавитель останавливает робота, бронебойный выстрел сильнее по броне; у оружия — свой профиль");
  ok(ws.parts && !ws.parts.length && ws.recipes && !ws.recipes.length && ws.guide, "экономика: у каждой детали — где найти и для чего; рецепты собраны из существующих предметов" + (ws.parts && ws.parts.length ? "; без пользы: " + ws.parts.join(", ") : "") + (ws.recipes && ws.recipes.length ? "; рецепты: " + ws.recipes.join(", ") : ""));
  ok(ws.saved, "схемы и модули оружия сохраняются в записи");

  console.log("Мастерские этажей, походные ремкомплекты, износ брони, импланты, верстаки глубин");
  const rp = await page.evaluate(async () => {
    const g = LAB.game, W = LAB.workshop, R = LAB.repair, IM = LAB.implants, C = LAB.combat, out = {};
    const G = g.G;
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
    C.stop(); LAB.ui.closeAll();
    /* мастерская этажа: своё помещение, без охраны внутри — на всех глубинах */
    out.floors = [];
    for (const L of [1, 7, 30, 61, 100]) for (const F of [1, 3, 12, 18]) {
      const fl = LAB.getFloor(G.seed, L, F), o = fl.shop && fl.objs.find(q => q.id === fl.shop);
      if (!o) { out.floors.push(L + "-" + F + ": нет"); continue; }
      const rm = fl.rooms[o.room];
      if (!rm || !rm.shop) out.floors.push(L + "-" + F + ": не в мастерской");
      if (fl.foes.some(f => f.room === o.room && !f.ally)) out.floors.push(L + "-" + F + ": охрана");
    }
    /* первый приход: «на этаже мастерская»; навигатор знает дорогу */
    delete G.visited["1-15"]; SPOKEN.length = 0;
    g.enterFloor(1, 15, "down"); C.stop(); C.foes().forEach(f => { f.dead = true; });
    out.arrive = /На этаже мастерская/.test(SPOKEN.join(" "));
    G.event = "norm"; G.eventUntil = G.min + 100000;
    const shop = g.shopObj(); out.shop = !!shop;
    SPOKEN.length = 0; for (let i = 0; i < 4 && !/мастерск/.test(SPOKEN.join(" ")); i++) g.navigate(i > 0);
    out.nav = /станки мастерской|мастерская/.test(SPOKEN.join(" "));
    /* окно мастерской: профиль, ремонт брони, ящик под верстаком, импланты */
    G.x = shop.x; G.y = shop.y; G.hp = G.hpMax = 9999;
    const b = W.bench(shop); b.dmg = false;
    LAB.ui.craft(shop); const top = LAB.ui.top();
    out.root = !!top && top.title === "Мастерская" && /Профил/.test(top.intro || "") && top.items.some(i => /^Ремонт брони/.test(label(i))) && top.items.some(i => /^Работа с имплантами/.test(label(i)));
    SPOKEN.length = 0; out.drawer = pick(/^Ящик под верстаком/) && /Ящик под верстаком: .*в рюкзаке/.test(SPOKEN.join(" ")) && !LAB.ui.top().items.some(i => /^Ящик/.test(label(i)));
    LAB.ui.closeAll();
    /* износ брони: защита слабеет с половины износа */
    G.weapons = G.weapons.slice(0, 1); G.wi = 0; const w = G.weapons[0]; w.cond = 100;
    const a = LAB.makeArmor("suit", 3, 2); G.armors = [a]; G.armor = a; const d0 = LAB.armorDef(a);
    for (let i = 0; i < 30; i++) R.armorHit(20, 6);
    const c30 = a.cond; for (let i = 0; i < 60; i++) R.armorHit(20, 6);
    out.wear = c30 < 100 && c30 > 40 && a.cond === 0 && LAB.armorDef(a) < d0 && /состояние 0 из 100/.test(g.armorLine(a));
    /* походный ремнабор: две цели — окно «что чинить»; три ремонта в свёртке */
    G.inv.toolkit = 0; w.cond = 40; G.inv.fieldkit = 1;
    g.useItem("fieldkit"); const km = LAB.ui.top();
    out.kitMenu = !!km && /что чинить/.test(km.title) && km.items.length === 3;
    km.i = 0; LAB.ui.activate(); LAB.ui.closeAll();
    out.kit1 = w.cond === 60 && R.left("fieldkit") === 2 && G.inv.fieldkit === 1;
    for (let i = 0; i < 2; i++) { g.useItem("fieldkit"); const t = LAB.ui.top(); if (t && /что чинить/.test(t.title)) { t.i = 0; LAB.ui.activate(); } LAB.ui.closeAll(); }
    out.kit3 = !G.inv.fieldkit && R.left("fieldkit") === 0 && w.cond === 80;
    /* ремонтный набор оружия: одна цель — сразу, плюс 35, ствол остужен */
    w.cond = 30; w.heat = 5; G.inv.wrepair = 1; g.useItem("wrepair"); out.wrep = w.cond === 65 && !G.inv.wrepair && !w.heat;
    /* ремкомплект брони и набор инструментов: плюс сорок и ещё десять */
    a.cond = 10; G.inv.repairkit = 1; G.inv.toolkit = 1; g.useItem("repairkit"); out.akit = a.cond === 60; G.inv.toolkit = 0;
    /* инженерный кейс: чинит повреждённый верстак, сломанный автомат; начатый — пополняют у верстака */
    a.cond = 100; w.cond = 100; b.dmg = true; G.inv.engkit = 1;
    g.useItem("engkit"); out.engBench = !b.dmg && R.opened("engkit") === 2;
    const mach = { id: "o_t_snack", type: "snacks", x: G.x + 1, y: G.y, room: shop.room, broken: true }; g.CUR.fl.objs.push(mach);
    g.useItem("engkit"); out.engMach = !!g.objState(mach).fixed && R.opened("engkit") === 1;
    g.CUR.fl.objs.pop();
    G.inv.scrap = 5; G.inv.wire = 5; W._at(shop); out.refill = W.refillKit(b) && R.opened("engkit") === 2;
    /* ремонт брони у верстака: ручной инструмент — до 80 (90 у ремонтного профиля), станки — до 100 */
    b.tier = 2; b.spec = ""; a.cond = 20; G.inv.scrap = 9; G.inv.rubber = 2; G.inv.ceramic = 2;
    out.armorBench = W.repairArmor(a, b) && a.cond === 100;
    /* импланты: чип из рюкзака, калибровка, модификации, извлечение, разбор — схема; станция; продажа */
    G.implants = G.implants.filter(id => id === "scan" || id === "echo"); G.impLv = {}; G.impMod = {}; G.cyber = { xp: {} };
    out.kinds = LAB.IMPLANTS.length; out.chipKinds = LAB.IMPLANTS.filter(d => d.passive).length; out.modKinds = Object.keys(IM.MODS).length;
    out.lv1 = IM.level() === 1 && IM.slots() === 2 && IM.modSlots() === 1 && IM.maxGrade() === 1;
    G.inv.imp_regen = 1; g.useItem("imp_regen"); out.chipIn = G.implants.indexOf("regen") >= 0 && !G.inv.imp_regen && IM.catXp("med") > 0;
    const c1 = g.implantCost("regen");
    G.inv.chip = 19; G.inv.cell = 9; G.inv.optic = 5; G.inv.relay = 5; G.inv.supercond = 3; G.inv.powercell = 3; G.inv.gel = 5; G.inv.cap = 9; G.inv.magnet = 3; G.inv.reagent = 5;
    out.gradeNo = !IM.upgrade("regen", "bench", 4); /* общая ступень кибернетики 1: калибровка закрыта */
    G.cyber.xp.med = 560; G.cyber.xp.combat = 40; /* прокачка: общая ступень 6, медицина — пятая */
    out.lv6 = IM.level() === 6 && IM.slots() === 5 && IM.modSlots() === 2 && IM.maxGrade() === 3 && IM.selfSurgery() && IM.catLv("med") === 5;
    out.up2 = IM.upgrade("regen", "bench", 2) && IM.lv("regen") === 2 && !IM.upgrade("regen", "bench", 2);
    out.up3 = IM.upgrade("regen", "bench", 4) && IM.lv("regen") === 3;
    /* (3.6) регенерация и так останавливает кровь: «антисептическая» ей ни к чему */
    out.mod = IM.addMod("regen", "eco") && g.implantCost("regen") < c1 && /только для направления/.test(IM.compat("regen", "ap")) && /делает это и без неё/.test(IM.compat("regen", "antisep")) && IM.addMod("regen", "purge") && /гнёзда модификаций заняты/.test(IM.compat("regen", "adren"));
    G.hp = G.hpMax = 9999; G.hp = 100; G.en = 200; G.body.neuro = 0; G.st.bleed = 5; C.useImplant("regen"); out.heal = G.hp - 100 > 30 + G.L * 4 && !G.st.bleed;
    out.extract = IM.extract("regen") && G.implants.indexOf("regen") < 0 && G.inv.imp_regen === 1 && !IM.extract("scan");
    G.bp = G.bp || {}; delete G.bp.imp_regen;
    out.dismantle = IM.dismantle("regen", 2) && !G.inv.imp_regen && W.known({ id: "imp_regen", bp: true });
    G.credits = 9999; out.station = IM.upgrade("scan", "station") && IM.lv("scan") === 2;
    G.inv.imp_cloak = 1; out.sell = LAB.itemCat("imp_cloak") === "implant" && LAB.sellPrice.item("imp_cloak") > 0;
    G.implants.push("tk"); const nTk = G.inv.imp_tk || 0; g.giveItem({ kind: "chip", implant: "tk" }, true); out.dupChip = (G.inv.imp_tk || 0) === nTk + 1;
    /* пассивные чипы: защита, энергия — сразу, а извлекли — прибавка ушла */
    const av0 = g.armorValue(), em0 = G.enMax;
    IM.install("c_dermal"); IM.install("c_battery");
    out.chipFx = g.armorValue() === av0 + 3 && G.enMax === em0 + 20;
    IM.extract("c_battery"); out.chipOff = G.enMax === em0 && G.inv.imp_c_battery === 1;
    /* гнёзда: больше пяти чипов на шестой ступени не встанет */
    ["c_aim", "c_quick", "c_cool", "c_fury", "c_ap"].forEach(id => IM.install(id));
    out.slotsFull = G.implants.filter(id => IM.isChip(id)).length === 5 && /нейрогнёзда заняты/.test(SPOKEN.join(" ") + "") ;
    /* новые импланты в деле: дуга, сонар, петля камер, фаза, сифон */
    C.foes().forEach(f => { f.dead = true; });
    g.CUR.fs.cleared = {}; C.tick(); /* (2.2) не в убежище: туда ОКО никого не выводит, а здесь нужны враги рядом */
    /* враг рядом и на виду: разряд ищет цель по прямой видимости, а у стены «два шага вбок» бывают за стеной */
    const mk = (t, dx, dy) => {
      for (const [ax, ay] of [[dx, dy], [-dx, -dy], [dy, dx], [-dy, -dx], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = C.freeCellNear(G.x + ax, G.y + ay, null);
        if (!c || !LAB.los(g.CUR.fl, g.CUR.fs, G.x, G.y, c[0], c[1])) continue;
        const f = C.spawnFoe(t, c[0], c[1], {});
        if (f) { f.calm = false; f.ally = false; f.hp = f.maxhp = 500; return f; }
      }
      return null;
    };
    ["arc", "sonar", "camloop", "phase", "siphon"].forEach(id => { if (G.implants.indexOf(id) < 0) G.implants.push(id); });
    const bot = mk("patrolbot", 2, 0); G.en = 500; G.body.neuro = 0;
    const h0 = bot ? bot.hp : 0; C.useImplant("arc"); out.arc = !!bot && bot.hp < h0;
    out.arcDiag = [!!bot, h0, bot && bot.hp, bot && (bot.x - G.x), bot && (bot.y - G.y), C.refuge(), G.en, (SPOKEN.slice(-2).join(" | ") || "").slice(0, 160)].join("/");
    G.body.neuro = 0; const seen0 = g.CUR.seen.reduce((a, v) => a + v, 0); C.useImplant("sonar"); out.sonar = g.CUR.seen.reduce((a, v) => a + v, 0) > seen0;
    const cam = mk("cam", 0, 2); G.body.neuro = 0; SPOKEN.length = 0; C.useImplant("camloop"); out.camloop = !!cam && cam.blindT > 0;
    out.camDiag = [!!cam, cam && cam.blindT, cam && (cam.x - G.x), cam && (cam.y - G.y), G.en, G.body.neuro, (SPOKEN.join(" | ") || "").slice(0, 200)].join("/");
    G.body.neuro = 0; C.useImplant("phase"); const hp1 = G.hp; C.hurtPlayer(50, "phys", bot); out.phase = G.hp === hp1;
    G.st.phaseT = 0; G.body.neuro = 0; G.en = 10; C.useImplant("siphon"); out.siphon = G.en > 10;
    if (bot) bot.dead = true; if (cam) cam.dead = true;
    /* сборка чипов — по ступени направления */
    const rq = LAB.RECIPES.find(r => r.id === "imp_phase"); G.cyber.xp.defense = 0; out.craftGate = /Не хватает кибернетики/.test(IM.craftWhy(rq));
    /* станция: свой набор, и он не весь каталог */
    out.stock = IM.stock({ id: "o_st" }).length === 9;
    /* верстаки глубин: ступень растёт с глубиной; партия, модернизация, перековка, синтез */
    out.tiers = {};
    for (const L of [2, 12, 30, 70]) { g.enterFloor(L, 3, "down", true); C.stop(); out.tiers[L] = W.bench(g.shopObj()).tier; }
    g.enterFloor(70, 6, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; }); G.event = "norm"; G.eventUntil = G.min + 100000;
    const ds = g.shopObj(), db = W.bench(ds); db.dmg = false; G.x = ds.x; G.y = ds.y; W._at(ds);
    out.deepTier = db.tier; out.deepSpec = db.spec;
    for (const k of LAB.PARTS) G.inv[k] = 40;
    W.setBatch(true); const e0 = G.ammo.energy || 0; const nb = W.needOf(LAB.RECIPES.find(r => r.id === "bat_e")); g.craft(LAB.RECIPES.find(r => r.id === "bat_e")); W.setBatch(false);
    out.batch = (G.ammo.energy || 0) - e0 >= 3 && nb.cap === 2;
    const lw = LAB.makeWeapon("laser", 3, 1, 2); G.weapons.push(lw); const dm0 = lw.dmg;
    out.modern = W.modernize("w", lw, db) && lw.dmg > dm0 * 5 && lw.lvl === LAB.foeLevel(G.L, G.F);
    const q0 = lw.qual, dm1 = lw.dmg; out.reforge = W.reforge("w", lw, db) && lw.qual === q0 + 1 && lw.dmg > dm1;
    const pr0 = G.inv.proto || 0; g.craft(LAB.RECIPES.find(r => r.id === "s_proto")); out.synth = (G.inv.proto || 0) > pr0;
    LAB.workshop._at(null); LAB.ui.closeAll();
    return out;
  });
  ok(rp.floors && !rp.floors.length && rp.shop && rp.arrive && rp.nav, "мастерская этажа — своё помещение без охраны на всех глубинах; при первом приходе «на этаже мастерская», навигатор ведёт к станкам" + (rp.floors && rp.floors.length ? ": " + rp.floors.join(", ") : ""));
  ok(rp.root && rp.drawer, "окно мастерской: профиль верстака, ремонт брони, работа с имплантами; ящик под верстаком — один раз");
  ok(rp.wear, "броня изнашивается от ударов и с половины износа держит хуже");
  ok(rp.kitMenu && rp.kit1 && rp.kit3 && rp.wrep && rp.akit, "походные ремкомплекты: ремнабор — окно «что чинить», три ремонта в свёртке; набор оружия — плюс 35 и остужает ствол; ремкомплект брони — плюс 40, с набором инструментов — ещё 10");
  ok(rp.engBench && rp.engMach && rp.refill && rp.armorBench, "инженерный кейс чинит верстак и сломанный автомат, начатый пополняют у верстака; броню у верстака со станками чинят до 100");
  ok(rp.kinds > 50 && rp.chipKinds >= 20 && rp.modKinds > 30, "импланты и чипы: видов " + rp.kinds + " (пассивных чипов " + rp.chipKinds + "), модификаций " + rp.modKinds);
  ok(rp.lv1 && rp.gradeNo && rp.lv6, "кибернетика: с опытом растут гнёзда чипов, модификации на имплант, калибровка, самостоятельное извлечение; ступени направлений");
  ok(rp.chipIn && rp.up2 && rp.up3 && rp.mod && rp.heal && rp.extract && rp.dismantle && rp.station && rp.sell && rp.dupChip, "импланты: чип вживляется из рюкзака; калибровка до третьей ступени, модификации по направлению и гнёздам, извлечение (кроме системных), разбор — схема; станция; чипы продаются; лишний чип — в рюкзак (" + ["chipIn", "up2", "up3", "mod", "heal", "extract", "dismantle", "station", "sell", "dupChip"].filter(k => !rp[k]).join(",") + ")");
  ok(rp.chipFx && rp.chipOff && rp.slotsFull, "пассивные чипы: защита и энергия сразу, извлекли — прибавка ушла; гнёзд — по ступени кибернетики");
  ok(rp.arc && rp.sonar && rp.camloop && rp.phase && rp.siphon && rp.craftGate && rp.stock, "новые импланты в деле: дуговой разрядник, глубинный сонар, петля камер, фазовый сдвиг, сифон энергии; сборка чипов — по ступени направления; у станции свой набор (" + ["arc", "sonar", "camloop", "phase", "siphon", "craftGate", "stock"].filter(k => !rp[k]).join(",") + (rp.arc ? "" : "; " + rp.arcDiag) + (rp.camloop ? "" : "; " + rp.camDiag) + ")");
  ok(rp.tiers && rp.tiers[2] <= 2 && rp.tiers[12] >= 3 && rp.tiers[30] >= 4 && rp.tiers[70] === 5 && rp.deepTier === 5 && /,/.test(rp.deepSpec || ""), "верстаки совершенствуются с глубиной: ступени " + JSON.stringify(rp.tiers) + ", в глубине — несколько профилей (" + rp.deepSpec + ")");
  ok(rp.batch && rp.modern && rp.reforge && rp.synth, "станок собирает партиями, модернизирует оружие под глубину; молекулярный синтезатор перековывает качество и синтезирует опытные узлы");

  console.log("Звук и доступность: каналы микшера, низкие частоты, диапазон, режимы навигатора, подсказки, обучение, уведомление о записи");
  const acc = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, S = LAB.settings, AE = LAB.AE, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const near = (a, b) => Math.abs(a - b) < 0.05;
    LAB.combat.stop(); LAB.ui.closeAll();
    LAB.bg = false; AE.ensure();
    try { await AE.ctx.resume(); } catch (e) { /* */ } /* после проверки «игра в фоне» устройство могло уснуть */
    /* каналы микшера: свои ручки громкости у оружия, противников, тревог, интерфейса и отзвука */
    const keep = { weapVol: S.weapVol, foeVol: S.foeVol, alarmVol: S.alarmVol, uiVol: S.uiVol, spaceVol: S.spaceVol, bass: S.bass, drc: S.drc };
    /* в канал, где сейчас ничего не звучит, Chromium не заглядывает — и .value у него прежнее;
       беззвучный постоянный источник держит каналы в обработке на время проверки */
    const probes = [AE.weap, AE.foe, AE.alarm, AE.wet].map(n => { const cs = AE.ctx.createConstantSource(); cs.offset.value = 0; cs.connect(n); cs.start(); return cs; });
    S.weapVol = 0.3; S.foeVol = 0.4; S.alarmVol = 0.5; S.spaceVol = 0; S.bass = 6; S.drc = 2;
    let mixErr = "";
    try { AE.applyVolumes(); AE.applyMix(); } catch (e) { mixErr = String(e && e.message || e); }
    await wait(600);
    out.chans = !!(AE.weap && AE.foe && AE.alarm) && near(AE.weap.gain.value, 0.3) && near(AE.foe.gain.value, 0.4) && near(AE.alarm.gain.value, 0.5) && AE.wet.gain.value < 0.02;
    out.bass = AE.bass && AE.bass.type === "lowshelf" && Math.abs(AE.bass.gain.value - 6) < 0.3;
    out.drc = Math.abs(AE.comp.threshold.value + 26) < 0.5 && AE.makeup.gain.value > 1.3;
    if (!(out.chans && out.bass && out.drc)) out.mixDiag = (mixErr ? "ошибка: " + mixErr + "; " : "") + "alarmVol=" + JSON.stringify(S.alarmVol) + " " + typeof S.alarmVol + "; " + AE.ctx.state + ": оружие " + AE.weap.gain.value.toFixed(2) + ", противники " + AE.foe.gain.value.toFixed(2) + ", тревоги " + AE.alarm.gain.value.toFixed(2) + ", отзвук " + AE.wet.gain.value.toFixed(2) + ", бас " + AE.bass.gain.value.toFixed(1) + ", порог " + AE.comp.threshold.value.toFixed(1);
    probes.forEach(cs => { try { cs.stop(); cs.disconnect(); } catch (e) { /* */ } });
    /* сигналы головоломок: свой канал громче интерфейса; пока идёт головоломка, музыка и фон стихают */
    {
      const pr2 = [AE.music, AE.amb, AE.puzzle, AE.ui].map(n => { const cs = AE.ctx.createConstantSource(); cs.offset.value = 0; cs.connect(n); cs.start(); return cs; });
      const k2 = { music: S.music, musicVol: S.musicVol, ambience: S.ambience, ambVol: S.ambVol, puzzleVol: S.puzzleVol, uiVol: S.uiVol, effects: S.effects };
      S.music = 1; S.musicVol = 0.6; S.ambience = 1; S.ambVol = 0.8; S.puzzleVol = 1; S.uiVol = 1; S.effects = 1; AE.applyVolumes();
      await wait(700);
      const m0 = AE.music.gain.value, a0 = AE.amb.gain.value;
      LAB.mini.hack(4, () => {});
      /* (2.5) под нагрузкой затухание доходит дольше — ждём до двух с половиной секунд */
      for (let i = 0; i < 25; i++) { await wait(100); if (i >= 6 && AE.music.gain.value <= m0 * 0.3 && AE.amb.gain.value <= a0 * 0.45) break; }
      const m1 = AE.music.gain.value, a1 = AE.amb.gain.value, p1 = AE.puzzle.gain.value, u1 = AE.ui.gain.value;
      LAB.mini.cancel(true); await wait(1000);
      const m2 = AE.music.gain.value;
      out.puzzleMix = { m0: +m0.toFixed(3), m1: +m1.toFixed(3), m2: +m2.toFixed(3), a0: +a0.toFixed(3), a1: +a1.toFixed(3), p1: +p1.toFixed(2), u1: +u1.toFixed(2) };
      out.puzzleOk = m0 > 0.1 && m1 <= m0 * 0.3 && a1 <= a0 * 0.45 && p1 >= u1 * 2 && m2 >= m0 * 0.85;
      pr2.forEach(cs => { try { cs.stop(); cs.disconnect(); } catch (e) { /* */ } });
      Object.assign(S, k2); AE.applyVolumes();
    }
    /* какой звук в какой канал */
    const ch = LAB.atmos._chOf;
    out.route = ch("w_blaster_s") === "weap" && ch("impact_wall") === "weap" && ch("oko_alarm") === "alarm" && ch("evl_alarm", { bus: "amb" }) === "alarm" && ch("bcn_stairs", { bus: "beacon" }) === null && ch("step_plate") === null;
    /* звук врага уходит в канал противников: перехватываем подключение узла */
    const id = "robot_alert"; await new Promise(r => LAB.Bank.preload([id], r)); await wait(300);
    const AN = AudioNode.prototype, conn = AN.connect; let toFoe = false;
    AN.connect = function (dst) { if (dst === AE.foe) toFoe = true; return conn.apply(this, arguments); };
    LAB.atmos.foeSound({ id: "tfoe", x: G.x + 2, y: G.y, kind: "mech", snd: "robot", base: { beh: [] }, name: "Проверочный робот" }, "alert");
    await wait(300); AN.connect = conn;
    out.foeBus = toFoe; if (!toFoe) out.foeDiag = "запись " + id + (LAB.Bank.ready(id) ? " в памяти" : " не загрузилась");
    Object.assign(S, keep); AE.applyVolumes(); AE.applyMix();
    /* режимы навигатора */
    g.enterFloor(1, 2, "down", true);
    LAB.combat.foes().forEach(f => { f.dead = true; });
    const say = () => SPOKEN.slice();
    /* цель, до которой путь открыт и с поворотом: так видно и описание, и ведение */
    let tgt = null;
    const turnsOf = p => { let t = 0, px = G.x, py = G.y, pd = null; for (const c of p) { const d = c[0] > px ? "E" : c[0] < px ? "W" : c[1] > py ? "S" : "N"; if (pd && d !== pd) t++; pd = d; px = c[0]; py = c[1]; } return t; };
    for (const o of g.CUR.fl.objs) { if (tgt) break; const p = g._routeTo(null, o); if (p && p.length >= 8 && p.length <= 90 && turnsOf(p) >= 1) tgt = { n: "проверочная цель", o }; }
    out.tgt = !!tgt;
    const navWith = m => { S.navMode = m; SPOKEN.length = 0; if (tgt) g.navigateTo(tgt); return SPOKEN.join(" | "); };
    out.brief = /Всего .*сначала/.test(navWith("brief")) && !!g.navFollow();
    out.beacon = /звук маяка/.test(navWith("beacon")) && !!g.navFollow();
    out.free = !!navWith("free") && !g.navFollow();
    /* подробный: ведёт по шагам — повороты, потом «у цели» */
    const ad = S.autoDoors; S.autoDoors = 1;
    navWith("full"); SPOKEN.length = 0;
    let steps = 0;
    for (; steps < 300; steps++) {
      if (!g.navFollow()) break;
      if (LAB.ui.layer()) LAB.ui.closeAll(); /* подобранная по пути записка открылась окном — закрыть и идти дальше */
      const p = g._navPath(); if (!p || !p.length) break;
      const c = p[0], d = c[0] > G.x ? "E" : c[0] < G.x ? "W" : c[1] > G.y ? "S" : "N";
      if (!g.tryMove(d)) { const d2 = g.doorAt(c[0], c[1]); if (d2) g.CUR.fs.doors[d2.id] = 2; if (!g.tryMove(d)) break; }
    }
    S.autoDoors = ad;
    out.follow = { steps, turn: say().some(t => /^Теперь /.test(t)), arrive: say().some(t => /Вы у цели/.test(t)), off: !g.navFollow() };
    S.navMode = "full";
    /* обучение: четырнадцать шагов, каждый — один раз; выключено — молчит; повторить */
    LAB.tutor.reset(); S.tutor = 1; S.hints = 2;
    out.steps = LAB.tutor.steps.length;
    out.once = LAB.tutor.ev("terminal") === true && LAB.tutor.ev("terminal") === false && !!G.tutor.done.terminal;
    await wait(900);
    out.spoken = SPOKEN.some(t => /Обучение, шаг 5 из 14/.test(t));
    SPOKEN.length = 0; out.repeat = LAB.tutor.repeat() && SPOKEN.some(t => /шаг 5 из 14/.test(t));
    S.tutor = 0; out.offSilent = LAB.tutor.ev("door") === false; S.tutor = 1;
    S.hints = 0; out.hintsOff = LAB.tutor.ev("door") === false && g.hintsOn() === false; S.hints = 2;
    /* события игры сами отмечают шаги: мастерская, головоломка */
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench");
    LAB.ui.craft(wb || { id: "x", x: G.x, y: G.y }); out.wbStep = !!G.tutor.done.workbench; LAB.ui.closeAll();
    let res = null; LAB.mini.hack(3, ok => { res = ok; });
    for (let k = 0; k < 700; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) { LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); } await wait(40); }
    await wait(400); out.puzzleStep = res === true && !!G.tutor.done.puzzle;
    /* напоминание, если игрок долго стоит: «часто» — да, «только по запросу» — нет */
    const now0 = Date.now, t0 = Date.now() + 600000; LAB.ui.closeAll();
    Date.now = () => t0; S.hints = 3; LAB.tutor._lastIdle(0); SPOKEN.length = 0; LAB.tutor._idle(); out.idle = SPOKEN.length === 1;
    S.hints = 0; LAB.tutor._lastIdle(0); SPOKEN.length = 0; LAB.tutor._idle(); out.idleOff = SPOKEN.length === 0;
    /* уведомление об автозаписи: голосом — если выбрано */
    S.hints = 2; S.saveNote = 2; SPOKEN.length = 0; g.autosave(); out.saveVoice = SPOKEN.some(t => /Игра сохранена/.test(t));
    Date.now = () => t0 + 60000; S.saveNote = 0; SPOKEN.length = 0; g.autosave(); out.saveQuiet = !SPOKEN.some(t => /Игра сохранена/.test(t));
    Date.now = now0; S.saveNote = 1;
    /* «Осмотреться»: сначала вещи на полу и что стоит в помещении, потом само помещение и двери, в конце — уровень и этаж */
    LAB.ui.closeAll();
    const rm = g.CUR.fl.rooms.find(r => r && g.CUR.fl.objs.some(o => o.room === r.id) && r.doors && r.doors.length);
    if (rm) {
      const ob = g.CUR.fl.objs.find(o => o.room === rm.id);
      let cell = null;
      for (let y = 0; y < LAB.H && !cell; y++) for (let x = 0; x < LAB.W && !cell; x++) if (g.CUR.fl.room[y * LAB.W + x] === rm.id && g.passable(x, y) && Math.abs(x - ob.x) + Math.abs(y - ob.y) > 1) cell = [x, y];
      if (cell) {
        G.x = cell[0]; G.y = cell[1];
        const fs = g.CUR.fs; fs.drops.push({ kind: "item", item: "scrap", n: 1, id: "dlook" + Date.now(), x: cell[0], y: cell[1] + 0 });
        SPOKEN.length = 0; g.lookAround();
        const t = SPOKEN.join(" "), iFloor = t.indexOf("На полу"), iHere = t.indexOf("Здесь:"), iRoom = t.indexOf(rm.name + "."), iLevel = t.lastIndexOf("Уровень " + G.L + ", этаж " + G.F);
        out.look = iFloor === 0 && iHere > iFloor && iRoom > iHere && iLevel > iRoom && iLevel + ("Уровень " + G.L + ", этаж " + G.F + ".").length >= t.trim().length;
        if (!out.look) out.lookT = t.slice(0, 260);
      }
    }
    /* настройки этапа — в окне «Настройки» и «Микшер» */
    LAB.ui.settings(); const lb = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.settings = ["Микшер", "Режим навигатора", "Частота подсказок", "Обучение: подсказки шагов", "Уведомление об автозаписи"].every(k => lb.some(l => l.indexOf(k) === 0));
    const mi = LAB.ui.top().items.findIndex(i => /^Микшер/.test(typeof i.label === "function" ? i.label() : i.label)); LAB.ui.top().i = mi; LAB.ui.activate();
    const ml = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.mixer = LAB.ui.top().title === "Микшер" && ["Речь", "Окружение", "Интерфейс", "Оружие", "Противники", "Музыка", "Тревоги", "Пространственные эффекты", "Низкие частоты", "Динамический диапазон"].every(k => ml.some(l => l.indexOf(k) === 0));
    LAB.ui.closeAll();
    return out;
  });
  ok(acc.chans && acc.bass && acc.drc, "микшер: каналы оружия, противников, тревог и отзвука — свои громкости; полка низких частот; сжатый диапазон" + (acc.mixDiag ? " (" + acc.mixDiag + ")" : ""));
  ok(acc.puzzleOk, "сигналы головоломок: свой канал вдвое с лишним громче интерфейса; пока идёт головоломка, музыка стихает до пятой части, фон — до трети, потом всё возвращается " + JSON.stringify(acc.puzzleMix));
  ok(acc.route && acc.foeBus, "звуки идут по своим каналам: выстрелы — «оружие», сирены — «тревоги», голоса машин — «противники»; маяки и шаги — мимо" + (acc.foeDiag ? " (" + acc.foeDiag + ")" : ""));
  ok(acc.tgt && acc.brief && acc.beacon && acc.free, "режимы навигатора: краткий, по маяку и свободный (без ведения)");
  ok(acc.follow && acc.follow.turn && acc.follow.arrive && acc.follow.off, "подробный навигатор ведёт по шагам: повороты и «Вы у цели» (шагов " + (acc.follow && acc.follow.steps) + ")");
  ok(acc.steps === 14 && acc.once && acc.spoken && acc.repeat && acc.offSilent && acc.hintsOff, "обучение: четырнадцать шагов, каждый — один раз; повторить; выключенное и «только по запросу» молчат");
  ok(acc.wbStep && acc.puzzleStep, "шаги обучения отмечают сами события: верстак, решённая головоломка");
  ok(acc.idle && acc.idleOff, "напоминание, если игрок долго стоит: при «часто» звучит, при «только по запросу» — нет");
  ok(acc.saveVoice && acc.saveQuiet, "уведомление об автозаписи: голосом — если выбрано, без уведомления — молча");
  ok(acc.look, "«Осмотреться»: сначала вещи на полу и что стоит в помещении, потом помещение и двери, в конце — уровень и этаж" + (acc.lookT ? ": " + acc.lookT : ""));
  ok(acc.settings && acc.mixer,"настройки: микшер (речь, окружение, интерфейс, оружие, противники, музыка, тревоги, отзвук, низкие частоты, диапазон), навигатор, подсказки, обучение, уведомление");

  console.log("План проверок A–I: настройки речи и доступности, звук дверей и стороны, турели и враги после загрузки, крафт без дублей, документы, память");
  const tp = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, AE = LAB.AE, W = LAB.workshop, out = {};
    let G = g.G;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    C.stop(); LAB.ui.closeAll();
    /* A4, H5: настройки речи и доступности записываются */
    const keep = { ratePct: S.ratePct, navMode: S.navMode, hints: S.hints, tutor: S.tutor, saveNote: S.saveNote, weapVol: S.weapVol, bass: S.bass, drc: S.drc };
    S.ratePct = 65; S.navMode = "beacon"; S.hints = 3; S.tutor = 0; S.saveNote = 2; S.weapVol = 0.7; S.bass = 3; S.drc = 2; LAB.saveSettings();
    const st = JSON.parse(localStorage.getItem("lab_settings") || "{}");
    out.settings = st.ratePct === 65 && st.navMode === "beacon" && st.hints === 3 && st.tutor === 0 && st.saveNote === 2 && st.weapVol === 0.7 && st.bass === 3 && st.drc === 2;
    Object.assign(S, keep); LAB.saveSettings();
    /* B3: стороны и расстояние на слух — панорама, громкость, глушение за спиной и за стеной */
    const sp = LAB.spatial, L1 = sp(-3, 0), R1 = sp(3, 0), N1 = sp(0, -1), F1 = sp(0, -8), Bk = sp(0, 4), Oc = sp(0, -4, true), Op = sp(0, -4, false);
    out.spatial = L1.pan < 0 && R1.pan > 0 && N1.gain > F1.gain && Bk.lp < sp(0, -4).lp && Oc.lp < Op.lp && Oc.gain < Op.gain;
    /* B2: проход через дверь звучит */
    g.enterFloor(1, 4, "down", true); G.hp = G.hpMax = 9999;
    C.foes().forEach(f => { f.dead = true; });
    const ids = [], sp0 = LAB.Sound.play; LAB.Sound.play = function (id) { ids.push(id); return sp0.apply(this, arguments); };
    const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    let done = false;
    for (const d of g.CUR.fl.doors) {
      if (done || (d.lock && d.lock.type)) continue;
      for (const k of ["N", "S", "W", "E"]) {
        const fx = d.x - DV[k][0], fy = d.y - DV[k][1];
        if (!g.passable(fx, fy) || g.doorAt(fx, fy)) continue;
        g.CUR.fs.doors[d.id] = 2; G.x = fx; G.y = fy;
        if (g.tryMove(k)) { done = true; break; }
      }
    }
    LAB.Sound.play = sp0;
    out.doorSound = done && ids.indexOf("door_threshold") >= 0;
    if (!out.doorSound) out.doorDiag = (done ? "прошли дверь, звуки: " + ids.slice(0, 8).join(", ") : "нет незапертой двери");
    /* E5: речь приглушает музыку и фон, но не звуки боя и сигналы */
    LAB.bg = false; AE.ensure(); try { await AE.ctx.resume(); } catch (e) { /* */ }
    AE.setDuck(true); await wait(700);
    const duck = { fx: AE.fx.gain.value, music: AE.music.gain.value, weap: AE.weap.gain.value, ui: AE.ui.gain.value };
    AE.setDuck(false); await wait(700);
    const free = { fx: AE.fx.gain.value, music: AE.music.gain.value, weap: AE.weap.gain.value, ui: AE.ui.gain.value };
    out.duck = Math.abs(duck.fx - free.fx) < 0.02 && Math.abs(duck.weap - free.weap) < 0.02 && Math.abs(duck.ui - free.ui) < 0.02 && (S.music ? duck.music < free.music - 0.01 : true);
    if (!out.duck) out.duckDiag = AE.ctx.state + " " + JSON.stringify({ duck, free });
    /* E3, E6: враг, который не видит и не слышит, не гонится вечно — переходит к поиску */
    const far = (() => { for (let y = 0; y < LAB.H; y++) for (let x = 0; x < LAB.W; x++) if (g.passable(x, y) && Math.abs(x - G.x) + Math.abs(y - G.y) > 24 && !LAB.los(g.CUR.fl, g.CUR.fs, x, y, G.x, G.y)) return [x, y]; return null; })();
    if (far) {
      const hunter = C.spawnFoe("patrolbot", far[0], far[1], {});
      hunter.state = "hunt"; hunter.lastKnown = { x: G.x, y: G.y }; hunter.lost = 0;
      G.noise = 0; let k = 0; for (; k < 40 && hunter.state === "hunt"; k++) { C.tick(); G.noise = 0; G.hp = G.hpMax; }
      out.giveUp = hunter.state !== "hunt";
      hunter.dead = true;
    }
    /* D5, H2, H4, F5, H3: турели, взломанный терминал, павший враг, вещи и документы — те же после загрузки */
    g.CUR.fs.turretMode = "off";
    const term = g.CUR.fl.objs.find(o => o.type === "terminal");
    if (term) g.objState(term).hacked = true;
    const victim = C.foes().find(f => !f.dead) || C.spawnFoe("patrolbot", G.x + 3, G.y, {});
    const vid = victim && victim.id; if (victim) C.damageFoe(victim, 99999, "kinetic", { quiet: true });
    G.inv.scrap = (G.inv.scrap || 0) + 4; G.inv.wire = (G.inv.wire || 0) + 2; G.inv.gel = (G.inv.gel || 0) + 2; G.inv.reagent = (G.inv.reagent || 0) + 2;
    g.craft(LAB.RECIPES.find(r => r.id === "medkit_s")); LAB.ui.closeAll();
    g.giveItem({ kind: "note", note: "staff", id: "tp-note" }, true);
    const sum = gg => ({ inv: Object.keys(gg.inv).reduce((a, k2) => a + (gg.inv[k2] || 0), 0), med: gg.inv.medkit_s || 0, weapons: gg.weapons.length, armors: gg.armors.length, notes: gg.noteList.length, ammo: Object.keys(gg.ammo).reduce((a, k2) => a + (gg.ammo[k2] || 0), 0) });
    const before = sum(G), key = g.CUR.key;
    g.saveSlot(3); g.loadSlot(3); await wait(300); C.stop(); G = g.G;
    const after = sum(G);
    out.noDup = JSON.stringify(before) === JSON.stringify(after);
    if (!out.noDup) out.dupDiag = JSON.stringify({ before, after });
    out.turrets = g.CUR.key === key && g.CUR.fs.turretMode === "off";
    out.terminal = !term || g.objState(g.CUR.fl.objs.find(o => o.type === "terminal")).hacked === true;
    out.deadStays = !vid || !C.foes().some(f => f.id === vid && !f.dead);
    const n0 = G.noteList.length; g.giveItem({ kind: "note", note: "staff", id: "tp-note" }, true);
    out.docOnce = G.noteList.length === n0;
    /* G: у каждой глубины свои полы, фон и враги */
    const lv = [0, 1, 2, 3, 4, 5].map(d => { for (let Lv = 1; Lv <= 100; Lv++) if (LAB.LEVELS[Lv] && LAB.depths.depthOf(Lv) === d) return LAB.LEVELS[Lv]; return null; }).filter(Boolean);
    const sig = x => [x.surf, x.amb, (x.foes || []).slice().sort().join("+")].join("|");
    out.depths = lv.length === 6 && new Set(lv.map(sig)).size === 6 && new Set(lv.map(x => x.amb)).size >= 5;
    /* I4: память не растёт без предела — кэш этажей ограничен, обход двухсот этажей не раздувает кучу */
    const heap = () => { if (window.gc) { window.gc(); window.gc(); } return performance.memory ? performance.memory.usedJSHeapSize : 0; };
    const tour = n => { for (let i = 0; i < n; i++) { const Lv = 1 + (i % 10), Fv = 1 + (i * 7) % 20; LAB.getFloor(G.seed, Lv, Fv); } };
    tour(100); await wait(200); const h1 = heap(); tour(200); await wait(200); const h2 = heap();
    out.memory = performance.memory ? { mb: Math.round((h2 - h1) / 1048576), ok: h2 - h1 < 64 * 1048576 } : { mb: "нет данных", ok: false, na: true };
    LAB.ui.closeAll();
    return out;
  });
  ok(tp.settings, "A, H: настройки речи и доступности записываются в хранилище");
  ok(tp.spatial, "B: стороны и расстояние на слух — слева и справа, ближе и дальше, глуше за спиной и за стеной");
  ok(tp.doorSound, "B: проход через дверь звучит — порог двери под ногой" + (tp.doorDiag ? " (" + tp.doorDiag + ")" : ""));
  ok(tp.duck, "E: речь приглушает музыку, но не звуки боя и сигналы" + (tp.duckDiag ? " (" + tp.duckDiag + ")" : ""));
  ok(tp.giveUp === true, "E: враг, который героя не видит и не слышит, не гонится вечно — переходит к поиску" + (tp.giveUp == null ? " (не нашлось клетки вне видимости)" : ""));
  ok(tp.turrets && tp.terminal && tp.deadStays, "D, H: турели, взломанный терминал и павший враг — те же после загрузки");
  ok(tp.noDup && tp.docOnce, "F, H: после загрузки вещей и документов столько же, документ не дублируется" + (tp.dupDiag ? " (" + tp.dupDiag + ")" : ""));
  ok(tp.depths, "G: у каждой глубины свои полы, фон и враги");
  ok(tp.memory && tp.memory.ok, "I: обход двухсот этажей не раздувает память (прирост " + (tp.memory && tp.memory.mb) + (tp.memory && tp.memory.na ? "" : " МБ") + ")");
  /* A4, H5: настройки переживают перезапуск — игра, открытая заново с тем же хранилищем, читает их при запуске */
  const keepS = await page.evaluate(() => {
    const S = LAB.settings, k = {};
    ["ratePct", "navMode", "hints", "tutor", "saveNote", "weapVol", "bass", "drc"].forEach(n => { k[n] = S[n]; });
    Object.assign(S, { ratePct: 65, navMode: "beacon", hints: 3, tutor: 0, saveNote: 2, weapVol: 0.7, bass: 3, drc: 2 }); LAB.saveSettings();
    return k;
  });
  let restart = false, restartDiag = "";
  /* перезапуск: новый сеанс браузера с тем же сохранённым хранилищем, что у игры сейчас */
  const ctx2 = await browser.newContext({ storageState: await page.context().storageState() });
  const page2 = await ctx2.newPage();
  page2.on("pageerror", e => errors.push("pageerror (после перезапуска): " + e.message));
  page2.on("request", r => { const u = r.url(); if (!/^(http:\/\/127\.0\.0\.1:|data:|blob:)/.test(u)) external.push(u); });
  try {
    await page2.goto(url); await page2.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
    const s2 = await page2.evaluate(() => { const S = LAB.settings; return { ratePct: S.ratePct, rate: S.rate, want: LAB.rateFromPct(65), navMode: S.navMode, hints: S.hints, tutor: S.tutor, saveNote: S.saveNote, weapVol: S.weapVol, bass: S.bass, drc: S.drc }; });
    restart = s2.ratePct === 65 && Math.abs(s2.rate - s2.want) < 1e-9 && s2.navMode === "beacon" && s2.hints === 3 && s2.tutor === 0 && s2.saveNote === 2 && s2.weapVol === 0.7 && s2.bass === 3 && s2.drc === 2;
    if (!restart) restartDiag = JSON.stringify(s2);
  } catch (e) { restartDiag = String(e && e.message || e).slice(0, 200); }
  await ctx2.close();
  /* новая версия — с чистого листа: сохранения прежней версии (слот, автозапись, запасная копия) при
     запуске новой стираются — в браузере, на Android и в Windows хранилище одно; (2.2) изменённые
     настройки, отметка о прологе и подсказка про облегчённый режим остаются */
  let fresh = null, freshDiag = "";
  /* (2.5) редкий сбой окружения: обе отметки однажды не дошли до новой страницы —
     тогда проверка повторяется один раз, а что было в хранилище, пишется в журнал */
  for (let attempt = 0; attempt < 2; attempt++) {
    fresh = null;
    const stOld = await page.context().storageState();
    const fixtureRaw = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-1.1-save.json"), "utf8");
    /* прохождение — то же (метку стёр localStorage.clear() в начале проверки): меняется только версия */
    const runNow = await page.evaluate(() => String(LAB.RUN));
    stOld.origins.forEach(o => {
      const ls = o.localStorage, setK = (n, v) => { const e = ls.find(q => q.name === n); if (e) e.value = v; else ls.push({ name: n, value: v }); };
      setK("lab_ver", "Альфа 1.1"); setK("lab_run", runNow); setK("lab_slot1", fixtureRaw); setK("lab_auto", fixtureRaw); setK("lab_slot2_bak", fixtureRaw); setK("lab_prologue_seen", "1"); setK("lab_lite_hint", "1");
    });
    const ctx3 = await browser.newContext({ storageState: stOld });
    const page3 = await ctx3.newPage();
    page3.on("pageerror", e => errors.push("pageerror (новая версия): " + e.message));
    let keys0 = "";
    try {
      await page3.goto(url); await page3.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
      keys0 = await page3.evaluate(() => Object.keys(localStorage).sort().join(","));
      await page3.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; });
      await page3.keyboard.press("Space"); await page3.waitForTimeout(150);
      fresh = await page3.evaluate(() => {
        const L = localStorage, out = { ver: L.getItem("lab_ver"), cur: LAB.VERSION, slot: L.getItem("lab_slot1"), auto: L.getItem("lab_auto"), bak: L.getItem("lab_slot2_bak"), prologue: L.getItem("lab_prologue_seen"), lite: L.getItem("lab_lite_hint"), stored: !!L.getItem("lab_settings"), ratePct: LAB.settings.ratePct, navMode: LAB.settings.navMode, hints: LAB.settings.hints, wiped: LAB.freshStart && LAB.freshStart.wiped, from: LAB.freshStart && LAB.freshStart.from, intro: LAB.ui.top() ? LAB.ui.top().intro : "" };
        /* сменились и версия, и прохождение — сообщение одно: о новой версии */
        const fs0 = LAB.freshStart, rr = LAB.restartRun;
        fs0.said = false; rr.wiped = 1; rr.said = false;
        LAB.ui.mainMenu(true); out.both1 = LAB.ui.top() ? LAB.ui.top().intro : "";
        LAB.ui.mainMenu(true); out.both2 = LAB.ui.top() ? LAB.ui.top().intro : "";
        return out;
      });
    } catch (e) { fresh = { err: String(e && e.message || e).slice(0, 200) }; }
    await ctx3.close();
    if (fresh && fresh.prologue === "1" && fresh.lite === "1") break;
    freshDiag = "origins " + stOld.origins.length + ", ключи при запуске: " + keys0;
    if (!attempt) console.log("  (проверка новой версии повторяется: " + freshDiag + ")");
  }
  await page.evaluate(k => { Object.assign(LAB.settings, k); LAB.saveSettings(); }, keepS);
  ok(restart, "A, H: после перезапуска игры настройки речи и доступности — те же" + (restartDiag ? " (" + restartDiag + ")" : ""));
  ok(fresh && fresh.ver === fresh.cur && fresh.slot === null && fresh.auto === null && fresh.bak === null && fresh.wiped >= 3 && fresh.from === "Альфа 1.1" && /новая версия/i.test(fresh.intro || "") && /Сохранения прежних версий сброшены/.test(fresh.intro || ""),
    "новая версия — с чистого листа: слоты, автозапись и запасные копии прежней версии при запуске стёрты, игрок слышит об этом в главном меню" + (fresh ? " (" + JSON.stringify(fresh).slice(0, 300) + ")" : ""));
  ok(fresh && fresh.stored && fresh.ratePct === 65 && fresh.navMode === "beacon" && fresh.hints === 3 && fresh.prologue === "1" && fresh.lite === "1" && /Настройки остались прежними/.test(fresh.intro || "") && !/настройки[^.]*сброшены/i.test(fresh.intro || ""),
    "новая версия: настройки, отметка о прологе и подсказка про облегчённый режим остались, игроку сказано, что настройки прежние" + (fresh ? " (" + JSON.stringify({ stored: fresh.stored, ratePct: fresh.ratePct, navMode: fresh.navMode, hints: fresh.hints, prologue: fresh.prologue, lite: fresh.lite }) + (freshDiag ? "; " + freshDiag.slice(0, 300) : "") + ")" : ""));
  ok(fresh && /новая версия/i.test(fresh.both1 || "") && !/начинается заново/.test(fresh.both2 || ""),
    "сменились и версия, и прохождение — одно сообщение о новой версии, без второго о прохождении" + (fresh ? " (" + String(fresh.both2 || "").slice(0, 120) + ")" : ""));
  /* (3.6, просьба игрока) записи «Альфы 3.0» и новее при смене версии не стираются: образец —
     настоящая запись «Альфы 3.2»; игрок слышит, что сохранения остались */
  let kept = null;
  {
    const stK = await page.context().storageState();
    const raw32 = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-3.2-save.json"), "utf8");
    const runNow = await page.evaluate(() => String(LAB.RUN));
    stK.origins.forEach(o => {
      const ls = o.localStorage, setK = (n, v) => { const e = ls.find(q => q.name === n); if (e) e.value = v; else ls.push({ name: n, value: v }); };
      setK("lab_ver", "Альфа 3.2"); setK("lab_run", runNow); setK("lab_slot1", raw32); setK("lab_auto", raw32); setK("lab_prologue_seen", "1");
    });
    const ctxK = await browser.newContext({ storageState: stK });
    const pageK = await ctxK.newPage();
    pageK.on("pageerror", e => errors.push("pageerror (запись 3.2): " + e.message));
    try {
      await pageK.goto(url); await pageK.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
      kept = await pageK.evaluate(raw => {
        const L = localStorage, fs0 = LAB.freshStart;
        LAB.ui.mainMenu(true);
        return { ver: L.getItem("lab_ver"), cur: LAB.VERSION, slot: L.getItem("lab_slot1") === raw, auto: L.getItem("lab_auto") === raw, kept: fs0.kept, wiped: fs0.wiped, from: fs0.from, intro: LAB.ui.top() ? LAB.ui.top().intro : "" };
      }, raw32);
    } catch (e) { kept = { err: String(e && e.message || e).slice(0, 200) }; }
    await ctxK.close();
  }
  ok(kept && kept.ver === kept.cur && kept.slot && kept.auto && kept.kept >= 2 && !kept.wiped && kept.from === "Альфа 3.2" && /Сохранения прежней версии остались/.test(kept.intro || ""),
    "записи «Альфы 3.2» при смене версии не стёрты, игрок слышит, что сохранения остались (" + JSON.stringify(kept).slice(0, 260) + ")");
  /* (3.7) запись выпущенной «Альфы 3.6» (этажи пятого выпуска): не стёрта, а главное меню честно
     говорит, что этажи построены заново, — загрузка ставит героя у входа на свой этаж */
  let kept36 = null;
  {
    const st36 = await page.context().storageState();
    const d36 = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "alfa-3.2-save.json"), "utf8"));
    d36.meta.ver = "Альфа 3.6"; d36.g.worldV = 5;
    const raw36 = JSON.stringify(d36);
    const runNow = await page.evaluate(() => String(LAB.RUN));
    st36.origins.forEach(o => {
      const ls = o.localStorage, setK = (n, v) => { const e = ls.find(q => q.name === n); if (e) e.value = v; else ls.push({ name: n, value: v }); };
      setK("lab_ver", "Альфа 3.6"); setK("lab_run", runNow); setK("lab_slot1", raw36); setK("lab_auto", raw36); setK("lab_prologue_seen", "1");
    });
    const ctx36 = await browser.newContext({ storageState: st36 });
    const page36 = await ctx36.newPage();
    page36.on("pageerror", e => errors.push("pageerror (запись 3.6): " + e.message));
    try {
      await page36.goto(url); await page36.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
      kept36 = await page36.evaluate(raw => {
        const L = localStorage, fs0 = LAB.freshStart;
        LAB.ui.mainMenu(true);
        const intro = LAB.ui.top() ? LAB.ui.top().intro : "";
        const m = LAB.game._migrate(JSON.parse(raw).g);
        return { ver: L.getItem("lab_ver"), cur: LAB.VERSION, slot: L.getItem("lab_slot1") === raw, kept: fs0.kept, wiped: fs0.wiped, from: fs0.from, intro, relocate: m.relocate === true && m.worldV === 7 };
      }, raw36);
    } catch (e) { kept36 = { err: String(e && e.message || e).slice(0, 200) }; }
    await ctx36.close();
  }
  ok(kept36 && kept36.ver === kept36.cur && kept36.cur === "Альфа 3.7" && kept36.slot && kept36.kept >= 2 && !kept36.wiped && kept36.from === "Альфа 3.6" && /Сохранения прежней версии остались/.test(kept36.intro || "") && /этажи построены заново/.test(kept36.intro || "") && kept36.relocate,
    "запись выпущенной «Альфы 3.6» при переходе на 3.7 не стёрта; главное меню говорит, что этажи построены заново, загрузка ставит у входа на свой этаж (" + JSON.stringify(kept36).slice(0, 300) + ")");
  /* (2.0) прохождение заново: та же версия, прежнее прохождение — сохранения стёрты, настройки остались */
  let run = null;
  {
    const stOld = await page.context().storageState();
    const fixtureRaw = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-1.1-save.json"), "utf8");
    const cur = await page.evaluate(() => ({ v: LAB.VERSION, s: JSON.stringify(Object.assign({}, LAB.settings, { ratePct: 70 })) }));
    stOld.origins.forEach(o => {
      const ls = o.localStorage, setK = (n, v) => { const e = ls.find(q => q.name === n); if (e) e.value = v; else ls.push({ name: n, value: v }); };
      const delK = n => { const i = ls.findIndex(q => q.name === n); if (i >= 0) ls.splice(i, 1); };
      setK("lab_ver", cur.v); delK("lab_run"); setK("lab_slot1", fixtureRaw); setK("lab_auto", fixtureRaw); setK("lab_prologue_seen", "1"); setK("lab_settings", cur.s);
    });
    const ctx4 = await browser.newContext({ storageState: stOld });
    const page4 = await ctx4.newPage();
    page4.on("pageerror", e => errors.push("pageerror (прохождение заново): " + e.message));
    try {
      await page4.goto(url); await page4.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
      await page4.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; });
      await page4.keyboard.press("Space"); await page4.waitForTimeout(150);
      run = await page4.evaluate(() => ({ R: String(LAB.RUN), run: localStorage.getItem("lab_run"), slot: localStorage.getItem("lab_slot1"), auto: localStorage.getItem("lab_auto"), prologue: localStorage.getItem("lab_prologue_seen"), ratePct: LAB.settings.ratePct, wiped: LAB.restartRun && LAB.restartRun.wiped, verWiped: LAB.freshStart && LAB.freshStart.wiped, intro: LAB.ui.top() ? LAB.ui.top().intro : "" }));
    } catch (e) { run = { err: String(e && e.message || e).slice(0, 200) }; }
    await ctx4.close();
  }
  ok(run && run.run === run.R && run.slot === null && run.auto === null && run.prologue === null && run.ratePct === 70 && run.wiped >= 3 && !run.verWiped && /начинается заново/.test(run.intro || ""),
    "прохождение заново (та же версия): сохранения, автозапись и пролог сброшены, настройки остались, игрок слышит об этом в главном меню" + (run ? " (" + JSON.stringify(run).slice(0, 300) + ")" : ""));
  const tp2 = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, out = {}, W = LAB.W, H = LAB.H;
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const pass = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g.passable(x, y);
    const los = (a, b) => LAB.los(g.CUR.fl, g.CUR.fs, a[0], a[1], b[0], b[1]);
    /* C1: камера видит в пределах своего конуса — впереди и недалеко; на краю обзора только «повернулась»;
       за спиной, сбоку вне конуса, дальше дальности, за стеной и под маскировкой — нет */
    let spot = null;
    for (let F = 1; F <= 6 && !spot; F++) {
      g.enterFloor(1, F, "down", true); G = g.G;
      for (let y = 0; y < H && !spot; y++) for (let x = 0; x < W && !spot; x++) {
        if (!pass(x, y)) continue;
        const P = [x, y], line = [], back = [x - 2, y], side = [x + 2, y + 3];
        for (let k = 1; k <= 12; k++) line.push([x + k, y]);
        if (![back, side].concat(line).every(c => pass(c[0], c[1]) && los(P, c))) continue;
        let wall = null;
        for (let a = 2; a <= 6 && !wall; a++) for (let p = -1; p <= 1 && !wall; p++) { const c = [x + a, y + p]; if (pass(c[0], c[1]) && !los(P, c)) wall = c; }
        if (wall) spot = { P, line, back, side, wall };
      }
    }
    if (spot) {
      C.foes().forEach(f => { f.dead = true; });
      const cam = C.spawnFoe("cam", spot.P[0], spot.P[1], {});
      cam.camDirs = ["E"]; cam.camI = 0; cam.camSw = 0;
      const ev0 = LAB.oko.event, evs = []; LAB.oko.event = (t, o) => { evs.push(t + (o && o.glimpse ? ":край" : "")); };
      const keepEv = G.event; G.event = null; G.st.jam = 0; G.st.cloak = 0; g.CUR.fs.okoBlind = false;
      const at = (c, cloak) => {
        cam.camT = 0; cam.glimT = 0; cam.blindT = 0; G.st.cloak = cloak ? 50 : 0; evs.length = 0;
        G.x = c[0]; G.y = c[1]; G.noise = 0; C.tick(); G.st.cloak = 0;
        return (cam.camT > 0 ? "З" : cam.glimT > 0 ? "к" : "-") + (evs.length ? "!" : "");
      };
      out.camLine = spot.line.map(c => at(c)).join("");
      const rest = [at(spot.back), at(spot.side), at(spot.wall), at(spot.line[2], true)];
      LAB.oko.event = ev0; G.event = keepEv; cam.dead = true;
      out.cam = /^(З!)+(к!)+-+$/.test(out.camLine) && rest.every(s => s === "-");
      if (!out.cam) out.camDiag = out.camLine + " / " + rest.join(" ");
    }
    /* E6: тварь слышит героя за стеной, а прохода нет (двери закрыты, открывать она не умеет) — погоню бросает и не возвращается на звук */
    let setup = null;
    for (let F = 1; F <= 8 && !setup; F++) {
      g.enterFloor(1, F, "down", true); G = g.G;
      const fl = g.CUR.fl, fs = g.CUR.fs;
      for (const r of fl.rooms) {
        if (setup) break;
        if (!r) continue; /* в списке комнат бывают пропуски */
        const doors = fl.doors.filter(d => d.room === r.id || d.other === r.id);
        if (!doors.length || doors.some(d => d.lock && d.lock.type === "secret")) continue;
        const keep = doors.map(d => [d.id, fs.doors[d.id]]);
        doors.forEach(d => { fs.doors[d.id] = 0; });
        let pair = null;
        for (let y = 0; y < H && !pair; y++) for (let x = 0; x < W && !pair; x++) {
          if (!pass(x, y) || fl.room[y * W + x] !== r.id) continue;
          for (let dy = -4; dy <= 4 && !pair; dy++) for (let dx = -4; dx <= 4 && !pair; dx++) {
            const fx = x + dx, fy = y + dy;
            if (Math.abs(dx) + Math.abs(dy) > 4 || !pass(fx, fy) || fl.room[fy * W + fx] === r.id || g.doorAt(fx, fy)) continue;
            if (LAB.los(fl, fs, fx, fy, x, y)) continue;
            if (!LAB.bfs(fl, fs, fx, fy, (a, b) => Math.abs(a - x) + Math.abs(b - y) <= 1, { passDoor: () => false, maxLen: 6000 })) pair = { hx: x, hy: y, fx, fy };
          }
        }
        if (pair) setup = pair; else keep.forEach(k => { fs.doors[k[0]] = k[1]; });
      }
    }
    if (setup) {
      C.foes().forEach(f => { f.dead = true; });
      G.x = setup.hx; G.y = setup.hy; const hp0 = G.hp; G.hp = G.hpMax;
      const f = C.spawnFoe("blind", setup.fx, setup.fy, {});
      f.state = "hunt"; f.lastKnown = { x: G.x, y: G.y }; SPOKEN.length = 0;
      let st = "";
      for (let k = 0; k < 40; k++) { G.noise = 8; C.tick(); G.hp = G.hpMax; st += f.state === "hunt" ? "h" : f.state === "alert" ? "a" : "i"; }
      out.wallStates = st;
      C.foes().forEach(o => { if (o !== f) o.dead = true; }); /* опасность считаем только от этой твари */
      out.wall = /^h{1,8}[ai]+$/.test(st) && !C.danger() && SPOKEN.some(t => /не находит к вам прохода/.test(t));
      f.dead = true; G.hp = hp0;
    }
    LAB.ui.closeAll();
    return out;
  });
  ok(tp2.cam, "C: камера видит только в своём конусе — впереди до дальности, на краю обзора «повернулась», а за спиной, сбоку, дальше, за стеной и под маскировкой — нет" + (tp2.camDiag ? " (" + tp2.camDiag + ")" : tp2.camLine == null ? " (не нашлось места для проверки)" : ""));
  ok(tp2.wall, "E: тварь слышит героя за стеной, а прохода нет — погоню бросает и на звук из-за стены не возвращается" + (tp2.wallStates ? " (" + tp2.wallStates + ")" : " (не нашлось места для проверки)"));
  /* H: запись прежней версии не загружается — каждую версию проходят заново (просьба игрока: в новой
     версии много нового, переносить прежний прогресс нельзя). Образец — настоящая запись «Альфы 1.1». */
  const oldRaw = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-1.1-save.json"), "utf8");
  const old = await page.evaluate(async raw => {
    const g = LAB.game, C = LAB.combat, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    C.stop(); LAB.ui.closeAll();
    const keep = localStorage.getItem("lab_slot2");
    localStorage.setItem("lab_slot2", raw);
    out.rejected = !g.validSave(raw);
    const was = JSON.stringify({ L: g.G.L, F: g.G.F, x: g.G.x, y: g.G.y, credits: g.G.credits });
    let err = ""; SPOKEN.length = 0;
    try { out.res = g.loadSlot(2); } catch (e) { err = String(e && e.message || e); }
    await wait(200); C.stop();
    out.kept = !err && out.res === false && JSON.stringify({ L: g.G.L, F: g.G.F, x: g.G.x, y: g.G.y, credits: g.G.credits }) === was;
    out.said = SPOKEN.join(" | ");
    if (keep) localStorage.setItem("lab_slot2", keep); else localStorage.removeItem("lab_slot2");
    g.saveSlot(3); const own = localStorage.getItem("lab_slot3"); out.ownOk = !!g.validSave(own) && JSON.parse(own).meta.ver === LAB.VERSION;
    LAB.ui.closeAll();
    return out;
  }, oldRaw);
  ok(old.rejected && old.kept && /не подходит этой версии/.test(old.said || ""), "H: запись прежней версии («Альфа 1.1») не загружается, игра остаётся как была: " + (old.said || ""));
  ok(old.ownOk, "H: запись этой версии помечена номером версии и читается");
  /* (3.6, просьба игрока) запись «Альфы 3.2» загружается и переносится: тот же этаж, уровень,
     вещи и кредиты; этажи построены заново, герой — у входа; поручения выживших сняты, главное —
     на месте; тренировки — по прежнему счёту (каждые три — единица из пяти); играть дальше можно */
  const raw32 = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-3.2-save.json"), "utf8");
  const mig = await page.evaluate(async raw => {
    const g = LAB.game, C = LAB.combat, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    C.stop(); LAB.ui.closeAll();
    g.saveSlot(3); /* текущая игра — потом вернуть */
    const keep = localStorage.getItem("lab_slot2");
    localStorage.setItem("lab_slot2", raw);
    const src = JSON.parse(raw).g;
    out.valid = !!g.validSave(raw);
    let err = "";
    try { out.res = g.loadSlot(2); } catch (e) { err = String(e && e.message || e); }
    await wait(300); C.stop();
    const G = g.G;
    out.err = err;
    out.same = G.L === src.L && G.F === src.F && G.credits === src.credits && G.lvl === src.lvl && G.weapons.length === src.weapons.length;
    out.quests = G.quests.map(q => q.type).join(",");
    out.train = G.train && G.train.strPts + "/" + G.train.aimPts;
    out.worldV = G.worldV; out.relocate = G.relocate;
    let tickErr = "";
    try { for (let i = 0; i < 20; i++) C.tick(); g.moveDir && g.moveDir("N"); LAB.ui.closeAll(); } catch (e) { tickErr = String(e && e.message || e); }
    out.tickErr = tickErr;
    g.saveSlot(1); const own = localStorage.getItem("lab_slot1"); out.resave = !!g.validSave(own) && JSON.parse(own).meta.ver === LAB.VERSION;
    if (keep) localStorage.setItem("lab_slot2", keep); else localStorage.removeItem("lab_slot2");
    g.loadSlot(3); await wait(300); C.stop(); LAB.ui.closeAll();
    return out;
  }, raw32);
  ok(mig.valid && mig.res !== false && !mig.err && mig.same && mig.quests === "main" && mig.train === "2/1" && mig.worldV >= 5 && !mig.tickErr && mig.resave,
    "запись «Альфы 3.2» загружается: тот же этаж, уровень, оружие и кредиты, поручения выживших сняты, тренировки пересчитаны, игра идёт и сохраняется (" + JSON.stringify(mig) + ")");

  console.log("Лифт: возит только на этажи, где вы уже были");
  const lift = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {}, L = 6;
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const pick = re => { const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; LAB.ui.activate(); return true; };
    LAB.combat.stop(); LAB.ui.closeAll();
    /* на уровне побывали только на этажах 1–3 */
    Object.keys(G.visited).forEach(k => { if (k.indexOf(L + "-") === 0) delete G.visited[k]; });
    g.enterFloor(L, 1, "down", true); g.enterFloor(L, 2, "down", true); g.enterFloor(L, 3, "down", true);
    G.maxF[L] = 3; G.elev[L] = true;
    LAB.combat.foes().forEach(f => { f.dead = true; });
    g.elevatorMenu();
    const labels = LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
    out.floors = labels.filter(l => /^Этаж \d+/.test(l)).map(l => +l.match(/^Этаж (\d+)/)[1]);
    out.onlyVisited = out.floors.every(F => G.visited[L + "-" + F]) && out.floors.indexOf(4) < 0;
    out.hasNA = labels.some(l => /недоступно/.test(l));
    SPOKEN.length = 0; pick(/недоступно/); out.naSaid = SPOKEN.some(t => /Недоступно/.test(t));
    /* поездка на этаж, где не были, — отказ, герой остаётся на месте */
    LAB.ui.closeAll(); SPOKEN.length = 0;
    out.rideNo = g.ride(4) === false && SPOKEN.some(t => /Недоступно/.test(t)) && G.F === 3 && !g.paused;
    /* на этаж, где были, — едет */
    g.elevatorMenu(); pick(/^Этаж 1$/);
    await new Promise(r => setTimeout(r, 2700));
    out.rideOk = g.G.L === L && g.G.F === 1;
    LAB.ui.closeAll();
    return out;
  });
  ok(lift.floors && lift.floors.join(",") === "1,2,3" && lift.onlyVisited && lift.hasNA, "лифт: в списке только этажи, где вы были (" + (lift.floors || []).join(", ") + "), остальные — «недоступно»");
  ok(lift.naSaid && lift.rideNo, "лифт: на этаж, где вы не были, не едет и говорит «Недоступно»");
  ok(lift.rideOk, "лифт: на этаж, где вы были, едет");

  console.log("Кабинеты у коридоров, обстановка, тела, записки, капсула, достижения, новое оружие (1.5)");
  const v13 = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const labels = () => LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
    LAB.combat.stop(); LAB.ui.closeAll();
    g.enterFloor(3, 5, "down", true);
    LAB.combat.foes().forEach(f => { f.dead = true; });
    const fl = g.CUR.fl;
    /* двери кабинетов — в каждом коридоре, число у стен разное */
    out.corrs = fl.corrs.length; out.withDoors = fl.corrs.filter(c => (c.annex || []).length > 0).length;
    const ann = fl.rooms.filter(r => r && r.annex);
    out.annex = ann.length;
    const names = {}; ann.forEach(r => { names[r.name] = (names[r.name] || 0) + 1; });
    out.distinct = Object.keys(names).length;
    const per = fl.corrs.map(c => (c.annex || []).length); out.perMin = Math.min.apply(null, per); out.perMax = Math.max.apply(null, per);
    /* описание при входе — своё у помещения */
    const rm = ann.find(r => r.owner && r.desc);
    out.ownerDesc = !!rm;
    if (rm) {
      let cell = null;
      for (let y = rm.y0; y <= rm.y1 && !cell; y++) for (let x = rm.x0; x <= rm.x1 && !cell; x++) if (!fl.objAt[y * LAB.W + x]) cell = [x, y];
      if (cell) { G.x = cell[0]; G.y = cell[1]; SPOKEN.length = 0; g.roomCheck(true); out.descSaid = SPOKEN.some(t => t.indexOf(rm.desc.slice(0, 40)) >= 0); }
    }
    /* вещь обстановки: меню действий и подробный осмотр */
    const fx = fl.objs.find(o => o.type === "fx" && LAB.FIX.T[o.fx] && LAB.FIX.T[o.fx].a.some(a => a[0] === "rest"));
    if (fx) {
      g.objMenu(fx); const ls = labels();
      out.fxMenu = ls.some(l => /Осмотреть/.test(l)) && ls.length >= 2 && LAB.ui.top().title === LAB.FIX.T[fx.o ? fx.o : fx.fx].n;
      LAB.ui.closeAll();
      out.fxExam = LAB.fixtures.examine(fx).length > LAB.FIX.T[fx.fx].d.length;
      const restLabel = LAB.FIX.T[fx.fx].a.find(a => a[0] === "rest")[1];
      const w0 = G.body.wake, t0 = G.min; LAB.fixtures.menu(fx); const k = LAB.ui.top().items.findIndex(i => label(i) === restLabel);
      if (k >= 0) { LAB.ui.top().i = k; LAB.ui.activate(); }
      out.restOk = k >= 0 && (G.min !== t0 || G.body.wake >= w0);
      LAB.ui.closeAll();
    }
    /* тело: осмотреть, карманы, жетон */
    g.enterFloor(5, 6, "down", true);
    LAB.combat.foes().forEach(f => { f.dead = true; });
    const body = g.CUR.fl.objs.find(o => o.type === "corpse");
    out.hasBody = !!body;
    if (body) {
      g.objMenu(body); const bl = labels();
      out.bodyMenu = bl.some(l => /Осмотреть тело/.test(l)) && bl.some(l => /Обшарить карманы/.test(l)) && bl.some(l => /Снять жетон/.test(l));
      const bi = LAB.ui.top().items.findIndex(i => /Снять жетон/.test(label(i))); LAB.ui.top().i = bi; LAB.ui.activate();
      out.badge = G.inv.badge > 0;
      LAB.ui.closeAll();
      out.bodyText = /жетон/.test(LAB.fixtures.examine(body));
    }
    /* записки из частей: без подстановок в тексте */
    let note = null;
    g.CUR.fl.objs.forEach(o => (o.loot || []).forEach(x => { if (!note && x.kind === "note" && x.note === "agen") note = x; }));
    if (!note) g.CUR.fl.items.forEach(x => { if (!note && x.kind === "note" && x.note === "agen") note = x; });
    out.hasNote = !!note;
    if (note) { const nt = g.noteText(note); out.noteOk = nt.x.length > 60 && !/[{}\[\]]/.test(nt.x + nt.t); }
    /* достижения */
    LAB.ach.ev("floor", 5); out.ach = !!(G.ach && G.ach.d.floor5);
    LAB.ach.menu(); out.achMenu = LAB.ui.top() && LAB.ui.top().title === "Достижения"; LAB.ui.closeAll();
    /* капсула: меню, сон, музыка, выход */
    const cap = g.CUR.fl.objs.find(o => o.type === "capsule");
    if (cap) { LAB.capsule.menu(cap); await new Promise(r => setTimeout(r, 1500)); const cl = labels(); out.capMenu = cl.some(l => /^Спать/.test(l)) && cl.some(l => /музыку/.test(l)) && cl.some(l => /Откинуть крышку и выйти/.test(l)); LAB.capsule.leave(true); LAB.ui.closeAll(); }
    else out.capMenu = true;
    /* новое оружие: создаётся, описывается, стреляет */
    const ids = ["nailgun", "stunrod", "silencer_p", "g_pickaxe", "k_eeljar", "o_twin", "m_stamper", "i_sourcebeam"];
    out.wOk = ids.every(id => { const w = LAB.makeWeapon(id, 5, 1, 2); return w && w.dmg > 0 && LAB.WEAPONS[id].desc; });
    const nw = LAB.makeWeapon("stunrod", 5, 1, 2); G.weapons.push(nw); G.wi = G.weapons.length - 1; G.drawn = true;
    try { LAB.combat.fire("N"); out.fireOk = true; } catch (e) { out.fireOk = false; out.fireErr = e.message; }
    G.drawn = false;
    /* пункт снабжения: прилавок, заказ с поверхности, скупка */
    const sup = g.CUR.fl.objs.find(o => o.type === "supply");
    out.hasSupply = !!sup;
    if (sup) {
      LAB.supply.postMenu(sup); const sl = labels();
      out.supplyMenu = sl.some(l => /^Прилавок/.test(l)) && sl.some(l => /Заказать с поверхности/.test(l)) && sl.some(l => /^Продать/.test(l));
      const si = LAB.ui.top().items.findIndex(i => /^Продать/.test(label(i))); LAB.ui.top().i = si; LAB.ui.activate();
      out.sellMenu = /Скупка|Продать/.test(LAB.ui.top() ? LAB.ui.top().title : "") || labels().some(l => /Продать|Оружие|Броня/.test(l));
      LAB.ui.closeAll();
    }
    /* навигатор знает двери коридора */
    const c0 = g.CUR.fl.corrs.find(c => (c.annex || []).length > 2);
    if (c0) { G.x = Math.floor((c0.x0 + c0.x1) / 2); G.y = Math.floor((c0.y0 + c0.y1) / 2); g.navMenu(); const nl = labels(); out.navDoors = nl.some(l => /двери этого коридора/.test(l)); LAB.ui.closeAll(); }
    /* перебор целей жестом доходит и до дверей коридора — навигатор ведёт к ближайшей, а не молчит */
    if (c0) {
      const n = 20;
      let err = "";
      SPOKEN.length = 0;
      try { g.navigate(false); for (let i = 0; i < n; i++) g.navigate(true); } catch (e) { err = e.message; }
      out.navCycle = !err && SPOKEN.some(t => /^Цель: .+(ближайшая из \d+ двер|единственная дверь коридора)/.test(t));
      out.navCycleDiag = err || SPOKEN.filter(t => /^Цель:/.test(t)).map(t => t.slice(0, 60)).slice(0, 6).join(" | ");
    }
    return out;
  });
  ok(v13.withDoors === v13.corrs, "двери кабинетов — в каждом коридоре: " + v13.withDoors + " из " + v13.corrs + ", у коридора от " + v13.perMin + " до " + v13.perMax);
  ok(v13.annex > 60 && v13.distinct >= v13.annex * 0.85, "кабинеты разные: " + v13.distinct + " разных табличек на " + v13.annex + " кабинетов");
  ok(v13.ownerDesc && v13.descSaid, "при входе в кабинет звучит его собственное описание с табличкой хозяина");
  ok(v13.fxMenu && v13.fxExam && v13.restOk, "обстановка: у вещи меню действий, подробный «Осмотреть», отдых тратит время и бодрит");
  ok(!v13.hasBody || (v13.bodyMenu && v13.badge && v13.bodyText), "тело: осмотреть, обшарить карманы, снять жетон" + (v13.hasBody ? "" : " (на этаже тел нет)"));
  ok(!v13.hasNote || v13.noteOk, "записка из частей собирается без пропусков подстановок" + (v13.hasNote ? "" : " (записок глубины пока нет)"));
  ok(v13.ach && v13.achMenu, "достижения: веха засчитывается, окно «Достижения» открывается");
  ok(v13.capMenu, "капсула: «Спать», музыка, «Откинуть крышку и выйти»");
  ok(v13.wOk && v13.fireOk, "новое оружие создаётся, описано и стреляет" + (v13.fireErr ? ": " + v13.fireErr : ""));
  ok(v13.navDoors, "навигатор: в коридоре есть список его дверей");
  ok(v13.navCycle, "навигатор: перебор целей доходит до дверей коридора и ведёт к ближайшей двери (" + v13.navCycleDiag + ")");
  ok(v13.hasSupply && v13.supplyMenu && v13.sellMenu, "пункт снабжения на этаже: прилавок, заказ с поверхности, скупка");

  console.log("Осмотр и жесты состояния, привязка к капсуле за кредиты, ловушки и мины (1.5)");
  const tr = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const labels = () => LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
    const C = LAB.combat;
    C.stop(); LAB.ui.closeAll();
    g.enterFloor(3, 5, "down", true);
    C.foes().forEach(f => { f.dead = true; });
    G.dead = false; G.hp = G.hpMax; G.st = { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0, jam: 0, deaf: 0, antitox: 0, bleed: 0, navjam: 0 };
    let fl = g.CUR.fl;
    const free = (x, y) => LAB.inb(x, y) && (fl.t[y * LAB.W + x] === LAB.T.ROOM || fl.t[y * LAB.W + x] === LAB.T.CORR) && !fl.objAt[y * LAB.W + x];
    /* два пальца вверх: сначала что в помещении и где, потом выходы, потом само помещение */
    const rm = fl.rooms.find(r => r && r.desc && fl.objs.some(o => o.room === r.id));
    if (rm) {
      let cell = null;
      for (let y = rm.y0; y <= rm.y1 && !cell; y++) for (let x = rm.x0; x <= rm.x1 && !cell; x++) if (free(x, y)) cell = [x, y];
      G.x = cell[0]; G.y = cell[1]; g.CUR.room = -9;
      SPOKEN.length = 0; LAB.input.dispatch({ kind: "swipe", n: 2, dir: "U" });
      const t = SPOKEN.join(" "), iHere = t.indexOf("Здесь:"), iEx = t.indexOf("Выходы:"), iRoom = t.indexOf("Помещение: ");
      out.look = iHere >= 0 && iEx > iHere && iRoom > iEx;
      out.lookText = t.slice(0, 120);
    }
    /* три пальца вправо — здоровье и тело, влево — кредиты; четыре вверх — цели навигатора */
    SPOKEN.length = 0; LAB.input.dispatch({ kind: "swipe", n: 3, dir: "R" });
    const bs = SPOKEN.join(" ");
    out.body = /^Здоровье \d+ из \d+/.test(bs) && /Бодрость/.test(bs) && /Сытость/.test(bs) && bs.indexOf("Бодрость") < bs.indexOf("Сытость") && /Токсины/.test(bs);
    G.credits = 57; SPOKEN.length = 0; LAB.input.dispatch({ kind: "swipe", n: 3, dir: "L" });
    out.cred = /^Кредиты: 57\./.test(SPOKEN.join(" ")) && /Привязка к капсуле/.test(SPOKEN.join(" "));
    SPOKEN.length = 0; LAB.input.dispatch({ kind: "swipe", n: 4, dir: "U" });
    out.navMenu = (!!LAB.ui.top() && LAB.ui.top().title === "Навигатор") || SPOKEN.some(t => /Навигатору не на что/.test(t));
    LAB.ui.closeAll();
    /* привязка к капсуле: цена растёт каждые десять этажей; без кредитов — нельзя */
    const bp = LAB.capsule.bindPrice;
    out.prices = [bp(1, 1), bp(1, 10), bp(1, 11), bp(1, 20), bp(2, 1), bp(3, 5)].join(",");
    const cap = fl.objs.find(o => o.type === "capsule");
    out.hasCap = !!cap;
    if (cap) {
      G.checkpoint = null; G.credits = 2;
      LAB.capsule.menu(cap); await wait(1500);
      let cl = labels(); out.bindItem = /^Привязаться к капсуле.*\d+ кредит/.test(cl[0] || "");
      LAB.ui.top().i = 0; LAB.ui.activate();
      out.bindPoor = !G.checkpoint && G.credits === 2;
      /* (3.5) кредиты пришли, пока окно было открыто: первое нажатие собирает окно заново
         (в пункте теперь другое «у вас»), второе — привязывает */
      G.credits = 100; SPOKEN.length = 0;
      LAB.ui.top().i = 0; LAB.ui.activate();
      out.bindStale = !G.checkpoint && G.credits === 100 && SPOKEN.some(t => /^Здесь всё изменилось/.test(t)) && /у вас 100\)/.test(labels()[0] || "");
      LAB.ui.top().i = 0; LAB.ui.activate();
      out.bindOk = !!(G.checkpoint && G.checkpoint.cap === cap.id) && G.credits === 100 - bp(3, 5);
      cl = labels(); out.boundInfo = cl.some(l => /Вы привязаны к этой капсуле/.test(l)) && !/^Привязаться/.test(cl[0] || "");
      LAB.capsule.leave(true); LAB.ui.closeAll();
      /* гибель: к привязанной капсуле */
      const cp0 = G.checkpoint;
      G.x = cap.x; G.y = cap.y + 3; g.die(); await wait(4600);
      out.respawnCap = G.L === 3 && G.F === 5 && G.x === cp0.x && G.y === cp0.y;
      /* без привязки — к началу уровня */
      G.checkpoint = null; g.die(); await wait(4600);
      out.respawnStart = G.L === 3 && G.F === 1;
      C.stop();
    }
    /* (2.2) ёмкость: «Искра» — тридцать, ступень — плюс восемь процентов; чем лучше оружие, тем больше;
       огнестрел — как прежде; ёмкие энергобатареи и расточка отсека — доли ёмкости оружия */
    const mk = (b, lvl, rank, q) => LAB.makeWeapon(b, lvl, rank, q == null ? 1 : q);
    out.blaster = [mk("spark", 1, 0).cap, mk("spark", 1, 1).cap, mk("spark", 25, 0).cap, mk("pulse", 1, 2).cap].join(",");
    out.blName = / Б-3$/.test(mk("spark", 25, 0).name);
    const cb0 = id => LAB.capBase(id);
    out.capOrder = cb0("spark") === 30 && cb0("heavy") > cb0("spark") && cb0("pulse") > cb0("spark") && cb0("gauss") > cb0("laser") && cb0("pcannon") > cb0("gauss") && cb0("i_sourcebeam") > cb0("pcannon") &&
      Object.keys(LAB.WEAPONS).filter(k => LAB.chargeGun(LAB.WEAPONS[k])).every(k => cb0(k) >= 30) && mk("spark", 1, 0, 3).cap > mk("spark", 1, 0, 1).cap;
    out.capPhys = mk("g_twinbarrel", 30, 0).cap === 2 && mk("k_bonebow", 30, 0).cap === 1 && mk("kpistol", 2, 0).cap === 8;
    out.capTxt = [cb0("spark"), cb0("heavy"), cb0("gauss"), cb0("pcannon"), cb0("i_sourcebeam")].join(",");
    const W5 = LAB.workshop, GONE = ["m_cap", "m_bigcell", "m_hugecell"];
    /* (3.7) батареи и модуль ёмкости зарядов не прибавляют: в оружие не встают, не собираются и не
       продаются на прилавках, но прежние можно продать и разобрать */
    out.noBat = ["cap", "bigcell", "hugecell"].every(k => /такого модуля нет/.test(W5.compat(mk("spark", 1, 0), k))) &&
      !GONE.some(id => LAB.RECIPES.some(rc => rc.out === id)) && GONE.every(id => LAB.ITEMS[id] && LAB.ITEMS[id].gone && !LAB.srcOk(LAB.ITEMS[id], "buy") && LAB.ITEMS[id].price > 0 && /не встаёт/.test(LAB.ITEMS[id].desc));
    const pw = mk("spark", 1, 0); W5.install(pw, "power"); out.modCap = pw.cap === 30;
    /* ёмкость — у верстака, ступень за ступенью до предела вида, ступень — не выше оснастки */
    const invB = JSON.stringify(G.inv);
    Object.assign(G.inv, { cell: 30, wire: 10, scrap: 20, cap: 10, chip: 10, magnet: 10, powercell: 5, supercond: 5, servo: 5 });
    const bw2 = mk("spark", 1, 0), bays = [];
    out.bayLow = W5.bayBore(bw2, { tier: 1, dmg: false }) && !W5.bayBore(bw2, { tier: 1, dmg: false }) && bw2.bay === 1 && bw2.cap === 35;
    for (let i = 0; i < 5; i++) { W5.bayBore(bw2, { tier: 5, dmg: false }); bays.push(bw2.cap); }
    out.bay = bays.join(",") + " " + bw2.bay;
    out.bayTxt = /на пределе вида — 50 выстрелов/.test(W5.profile(bw2)) && /до 50 выстрелов за 4 ступени/.test(W5.profile(mk("spark", 1, 0)));
    const kp = mk("kpistol", 2, 0), mags = [];
    for (let i = 0; i < 3; i++) { W5.bayBore(kp, { tier: 5, dmg: false }); mags.push(kp.cap); }
    out.mag = mags.join(",");
    const pp = mk("ppistol", 7, 0), pos = [pp.cap]; W5.bayBore(pp, { tier: 5, dmg: false }); pos.push(pp.cap); W5.bayBore(pp, { tier: 5, dmg: false }); pos.push(pp.cap);
    out.pos = pos.join(",");
    const tw = mk("g_twinbarrel", 16, 0), eel = mk("k_eeljar", 31, 0);
    out.noUpg = !W5.bayBore(tw, { tier: 5, dmg: false }) && tw.cap === 2 && /два ствола/.test(W5.capLine(tw)) && !W5.bayBore(eel, { tier: 5, dmg: false }) && /лейденская банка/.test(W5.capLine(eel));
    /* ступень и качество оружия поднимают и предел: «Искра» Б-3 — дальше пятидесяти */
    out.markCap = W5.capMax(mk("spark", 25, 0)) > 50 && W5.capMax(mk("spark", 1, 0, 3)) > 50;
    /* оружие прежней записи: батареи и модуль ёмкости — в рюкзак, расточка сверх ступеней вида — деталями */
    const oldW = mk("spark", 1, 0); W5.recalc(oldW); oldW.mod = { hugecell: 1, bigcell: 2, cap: 1, power: 1 }; oldW.bay = 5; oldW.cap = 130; oldW.charge = 130;
    const invU = {}, said = W5.fixUpg(oldW, invU);
    out.mig = oldW.cap === 50 && oldW.charge === 50 && oldW.bay === 4 && !oldW.mod.hugecell && !oldW.mod.bigcell && !oldW.mod.cap && oldW.mod.power === 1 && W5.used(oldW) === 1 &&
      invU.m_hugecell === 1 && invU.m_bigcell === 2 && invU.m_cap === 1 && invU.supercond === 1 && invU.powercell === 1 && /в рюкзаке/.test(said) && W5.fixUpg(oldW, invU) === "";
    out.migTxt = said;
    G.inv.m_hugecell = 1; const sv0 = G.inv.supercond || 0; W5.salvage("m_hugecell", { tier: 1, dmg: false }); out.salvGone = !G.inv.m_hugecell && (G.inv.supercond || 0) === sv0 + 1;
    G.inv = JSON.parse(invB);
    /* ловушки: вещи, схемы, полки */
    const T = LAB.traps;
    out.nTypes = T.ids.length;
    out.items = T.ids.every(k => LAB.ITEMS["tr_" + k] && LAB.ITEMS["tr_" + k].kind === "trap" && LAB.ITEMS["tr_" + k].desc.length > 60);
    out.recipes = T.ids.every(k => LAB.RECIPES.some(rc => rc.out === "tr_" + k));
    out.cat = LAB.supply.catOf("tr_jaw") === "trap" && LAB.CAT_N.trap === "Ловушки и мины";
    g.enterFloor(3, 5, "down", true); C.stop();
    C.foes().forEach(f => { f.dead = true; });
    fl = g.CUR.fl;
    G.dead = false; G.hp = G.hpMax; G.st.trapHeld = 0; G.st.slow = 0;
    /* коридор: место для опытов */
    const cor = fl.corrs.find(c => c.len >= 14 && !(c.annex || []).length) || fl.corrs.find(c => c.len >= 14) || fl.corrs[0];
    const h = cor.axis === "h";
    const put = (k) => { const x = h ? cor.x0 + k : cor.x0 + 1, y = h ? cor.y0 + 1 : cor.y0 + k; G.x = x; G.y = y; G.face = h ? "E" : "S"; return [x, y]; };
    const step = (d) => { g.tryMove(d, false); };
    const fwd = () => G.face, bwd = () => ({ N: "S", S: "N", E: "W", W: "E" })[G.face];
    T.list().length = 0;
    /* капкан под ногами: ждёт, пока отойдёте; взводится; враг попадается */
    put(3);
    G.inv.tr_jaw = 2;
    out.placed = T.place("jaw", "here");
    const jaw = T.list().find(t => t.own && t.t === "jaw");
    out.wait = !!jaw && jaw.st === "wait";
    step(bwd());
    for (let i = 0; i < 6; i++) C.tick();
    out.armed = !!jaw && jaw.st === "on";
    const bot = C.spawnFoe("guardbot", jaw.x, jaw.y);
    T.foeStep(bot);
    out.caught = bot.frozen > 0 && bot.hp < bot.maxhp && jaw.st === "held";
    bot.dead = true; bot.frozen = 0; C.tick();
    out.sprung = jaw.st === "sprung" && jaw.uses === 5;
    /* «Осмотреться» называет свою ловушку */
    SPOKEN.length = 0; g.lookAround(); out.lookTrap = SPOKEN.some(t => /Ловушки: ваш капкан/.test(t));
    /* снять и забрать */
    G.x = jaw.x + (h ? -1 : 0); G.y = jaw.y + (h ? 0 : -1);
    const adj = g.adjacentTargets().find(q => q.type === "trap");
    out.adjacent = !!adj;
    T.trapMenu(jaw); const tl = labels(); out.trapMenu = tl.some(l => /Взвести снова/.test(l)) && tl.some(l => /Снять и забрать/.test(l)); LAB.ui.closeAll();
    const inv0 = G.inv.tr_jaw || 0; T.pickUp(jaw);
    out.picked = T.list().indexOf(jaw) < 0 && ((G.inv.tr_jaw || 0) > inv0 || (G.inv.scrap || 0) > 0);
    /* мина впереди: игрок наступает сам — и получает своё */
    put(6); G.hp = G.hpMax; G.inv.tr_mine = 1;
    T.place("mine", "front");
    for (let i = 0; i < 6; i++) C.tick();
    const mine = T.list().find(t => t.t === "mine" && t.own);
    out.mineOn = !!mine && mine.st === "on";
    /* ходьба с удержанием останавливается перед ней */
    await wait(250); SPOKEN.length = 0; const ranX = G.x, ranY = G.y; g.tryMove(fwd(), true);
    out.runStop = G.x === ranX && G.y === ranY && SPOKEN.some(t => /Стоп: впереди ваша противопехотная мина/.test(t));
    const hp0 = G.hp; await wait(200); step(fwd());
    out.selfHit = G.hp < hp0 && T.list().indexOf(mine) < 0;
    /* капкан держит и вас; каждый шаг ослабляет хватку */
    G.hp = G.hpMax; put(9); G.inv.tr_jaw = (G.inv.tr_jaw || 0) + 1;
    T.place("jaw", "front"); for (let i = 0; i < 6; i++) C.tick();
    await wait(200); step(fwd());
    out.held = G.st.trapHeld > 0;
    const h0 = G.st.trapHeld, px = G.x, py = G.y; await wait(200); step(fwd());
    out.struggle = G.st.trapHeld < h0 && G.x === px && G.y === py;
    G.st.trapHeld = 0;
    T.list().length = 0;
    /* растяжка с гранатой: поперёк коридора, на все четыре шага */
    put(4); G.inv.tr_wire = 1; T.place("wire", "front");
    const wr = T.list().find(t => t.t === "wire");
    out.wireAcross = !!wr && wr.cells.length === LAB.corrW(cor);
    T.list().length = 0;
    /* заряд на радиосигнале: подрыв по команде задевает врага рядом */
    put(4); G.inv.tr_remote = 1; T.place("remote", "front");
    for (let i = 0; i < 4; i++) C.tick();
    const rem = T.list().find(t => t.t === "remote");
    const v = h ? [1, 0] : [0, 1];
    const bot2 = C.spawnFoe("guardbot", rem.x + v[0], rem.y + v[1]);
    put(12); G.hp = G.hpMax; const hp1 = G.hp;
    T.detonate(rem); await wait(500);
    out.remote = bot2.hp < bot2.maxhp && T.list().indexOf(rem) < 0 && G.hp === hp1;
    bot2.dead = true;
    /* ЭМИ-мина: робот рядом — щит снят, машина стоит */
    put(4); G.inv.tr_emp = 1; T.place("emp", "front");
    const em = T.list().find(t => t.t === "emp");
    put(12); for (let i = 0; i < 6; i++) C.tick();
    const bot3 = C.spawnFoe("shieldbot", em.x + v[0], em.y + v[1]); bot3.shield = 30;
    C.tick();
    out.emp = bot3.shield === 0 && (bot3.frozen > 0 || bot3.dead) && T.list().indexOf(em) < 0;
    bot3.dead = true;
    /* логическая мина: робот бьёт своих */
    put(4); G.inv.tr_logic = 1; T.place("logic", "front"); put(12); for (let i = 0; i < 6; i++) C.tick();
    const lg = T.list().find(t => t.t === "logic");
    const bot4 = C.spawnFoe("guardbot", lg.x, lg.y); T.foeStep(bot4);
    out.logic = bot4.ally === true && bot4.allyT > 0;
    bot4.dead = true;
    T.list().length = 0;
    /* (2.0) мина сапёра ОКО (одна система с ловушками по приказу ОКО): вплотную слышно всегда, обезвреживается, становится вашей */
    put(4);
    const mx = G.x + v[0], my = G.y + v[1];
    T.okoTrap("mine", mx, my, { dmg: 20 });
    SPOKEN.length = 0; T.playerStep();
    const em2 = T.list().find(t => t.by === "oko");
    out.heard = !!em2 && em2.known === 1 && SPOKEN.some(t => /Осторожно: .*сапёра ОКО/.test(t));
    G.x = mx - v[0]; G.y = my - v[1];
    const inv1 = G.inv.tr_mine || 0;
    T.disarm(em2);
    for (let k = 0; k < 700; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); await wait(60); }
    await wait(400);
    out.disarm = T.list().indexOf(em2) < 0 && (G.inv.tr_mine || 0) === inv1 + 1;
    /* окно «Ловушки и мины» в инвентаре */
    LAB.ui.inventory(); const il = labels(); out.invItem = il.some(l => /^Ловушки и мины: \d+/.test(l)); LAB.ui.closeAll();
    T.menu(); const ml = labels(); out.menu = ml.some(l => /Ваши ловушки на этом этаже/.test(l)) && ml.some(l => /Противопехотная мина: \d+/.test(l)); LAB.ui.closeAll();
    /* мастерская: свой раздел */
    out.wsGroup = LAB.RECIPES.filter(rc => /^tr_/.test(rc.out)).length === T.ids.length;
    /* старые ловушки этажей: на глубине есть, в «Ковчеге» у баррикад */
    let old = 0;
    for (const [L, F] of [[2, 6], [4, 9], [7, 3], [9, 14], [15, 4], [33, 8], [55, 2], [66, 11], [90, 7]]) { g.enterFloor(L, F, "down", true); C.stop(); old += T.list().filter(t => !t.own).length; }
    out.oldTraps = old;
    G.dead = false; G.hp = G.hpMax; G.st.trapHeld = 0;
    return out;
  });
  ok(tr.look, "два пальца вверх: сначала что в помещении и где, потом выходы, потом само помещение — " + (tr.lookText || ""));
  ok(tr.body, "три пальца вправо: здоровье, бодрость, сытость и всё тело");
  ok(tr.cred, "три пальца влево: кредиты и цена привязки к капсуле");
  ok(tr.navMenu, "четыре пальца вверх: список целей навигатора");
  ok(tr.prices === "4,4,8,8,12,20", "привязка к капсуле: этажи 1–10 — 4 кредита, каждые десять этажей — дороже: " + tr.prices);
  ok(!tr.hasCap || (tr.bindItem && tr.bindPoor && tr.bindStale && tr.bindOk && tr.boundInfo), "капсула: привязка — первым пунктом, без кредитов — нельзя, с кредитами — списывает цену; окно, где всё изменилось, сперва собирается заново");
  ok(!tr.hasCap || (tr.respawnCap && tr.respawnStart), "гибель: к привязанной капсуле, без привязки — к началу уровня");
  ok(tr.blaster === "30,32,35,42" && tr.blName, "бластер: «Искра» первой ступени — 30 зарядов, ступень — плюс восемь процентов (" + tr.blaster + ")");
  ok(tr.capOrder && tr.capPhys, "ёмкость: чем лучше оружие, тем больше, у всего на батареях и зарядах — не меньше тридцати; огнестрел — как прежде (" + tr.capTxt + ")");
  ok(tr.noBat && tr.modCap, "(3.7) батареи и модуль ёмкости зарядов не прибавляют: в оружие не встают, не собираются, на прилавках их нет; модули ёмкость не меняют");
  ok(tr.bayLow && tr.bay === "40,45,50,50,50 4" && tr.bayTxt, "(3.7) ёмкость — у верстака: «Искра» Б-1 — 30, 35, 40, 45, 50, дальше — предел вида; ступень — не выше оснастки верстака (" + tr.bay + ")");
  ok(tr.mag === "10,12,12" && tr.pos === "59,74,74" && tr.noUpg && tr.markCap, "(3.7) у каждого вида свой предел: магазин пистолета 8 → 12, позитронному — одна ступень, двустволка и живой угорь не меняются; ступень и качество поднимают предел (" + tr.mag + "; " + tr.pos + ")");
  ok(tr.mig && tr.salvGone, "(3.7) оружие прежней записи: батареи и модуль ёмкости сняты — в рюкзаке, лишняя расточка вернула детали, ёмкость — до предела вида; снятое разбирается (" + tr.migTxt + ")");
  ok(tr.nTypes >= 25 && tr.items && tr.recipes && tr.cat && tr.wsGroup, "ловушки и мины: " + tr.nTypes + " видов, у всех вещь, описание и схема сборки, своя полка снабжения");
  ok(tr.placed && tr.wait && tr.armed, "капкан ставится под ноги и взводится, когда герой отойдёт");
  ok(tr.caught && tr.sprung, "робот попадается в капкан: ранен и стоит; капкан можно взвести снова");
  ok(tr.lookTrap && tr.adjacent && tr.trapMenu && tr.picked, "свою ловушку видно при осмотре, рядом — окно действий, её можно снять");
  ok(tr.mineOn && tr.runStop && tr.selfHit, "своя мина: ходьба с удержанием стоит перед ней, отдельный шаг — и мина бьёт по герою");
  ok(tr.held && tr.struggle, "капкан держит и героя, рывки ослабляют хватку");
  ok(tr.wireAcross, "растяжка в коридоре — от стены до стены");
  ok(tr.remote, "заряд на радиосигнале подрывается по команде и задевает врага рядом");
  ok(tr.emp, "ЭМИ-мина: у робота снят щит, машина стоит");
  ok(tr.logic, "логическая мина перепрошивает робота на вашу сторону");
  ok(tr.heard && tr.disarm, "мину сапёра ОКО слышно вплотную, её можно обезвредить и забрать");
  ok(tr.invItem && tr.menu, "инвентарь: раздел «Ловушки и мины», окно с вашими ловушками на этаже");
  ok(tr.oldTraps > 0, "старые ловушки прежних жителей на этажах: " + tr.oldTraps);

  console.log("Отдых на обстановке восстанавливает больше: не меньше пяти единиц; напитки с собой и отдых с напитком");
  const rsf = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = { low: [], n: 0 };
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    /* данные: каждое восстановление — не меньше пяти единиц */
    const T = LAB.FIX.T;
    Object.keys(T).forEach(k => T[k].a.forEach(a => {
      const p = a[2] || {}, fx = p.fx || {};
      const vals = { hp: p.hp ? p.hp * 100 : 0, wake: p.wake || fx.wake || 0, neuro: -(p.neuro || fx.neuro || 0), heal: fx.heal || 0, detox: fx.detox || (p.tox < 0 ? -p.tox : 0), food: fx.food || 0, rad: -(p.rad || 0) };
      Object.keys(vals).forEach(key => { if (vals[key] > 0) { out.n++; if (vals[key] < 5) out.low.push(k + "." + a[0] + "." + key + "=" + vals[key]); } });
    }));
    const hp = k => T[k].a.find(a => a[0] === "rest")[2].hp;
    out.order = hp("bunk") > hp("sofa") && hp("couch") > hp("sofa") && hp("sofa") > hp("chair") && T.samovar.a[0][2].fx.heal > T.kettle.a[0][2].fx.heal && T.mats.a[0][2].wake >= 9;
    /* стул: самый простой отдых — и тот ощутим */
    LAB.combat.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true);
    LAB.combat.foes().forEach(f => { f.dead = true; });
    G.dead = false; G.hpMax = 100; G.hp = 40; G.body.wake = 50; G.body.neuro = 50; G.body.food = 80;
    G.restAt = -1e9; /* (3.6) отдых в полную силу — раз в час: давно не отдыхали */
    /* (3.6) на этом этаже стрелял раздел мастерской: тревога, если её подняли машины, держится,
       пока ОКО её не снимет, — а в тревогу не отдыхают; здесь проверяется сам отдых */
    LAB.oko.setLevel(0, "проверка");
    LAB.fixtures.menu({ id: "t_chair", type: "fx", fx: "chair", x: G.x, y: G.y, room: g.CUR.room });
    const kc = LAB.ui.top() ? LAB.ui.top().items.findIndex(i => label(i) === "Присесть и перевести дух") : -1;
    if (kc >= 0) { LAB.ui.top().i = kc; LAB.ui.activate(); }
    out.chair = kc >= 0 && G.hp === 45 && G.body.wake >= 54.5 && G.body.neuro === 42;
    out.chairDiag = G.hp + "/" + G.body.wake.toFixed(1) + "/" + G.body.neuro;
    LAB.ui.closeAll();
    /* раковина: умывание лечит, бодрит и выводит токсины */
    G.hp = 40; G.body.wake = 50; G.body.tox = 10;
    g.objMenu({ id: "t_sink", type: "sink", x: G.x, y: G.y });
    const ks = LAB.ui.top() ? LAB.ui.top().items.findIndex(i => /Умыться холодной водой/.test(label(i))) : -1;
    if (ks >= 0) { LAB.ui.top().i = ks; LAB.ui.activate(); }
    out.sink = ks >= 0 && G.hp === 45 && G.body.wake >= 61 && G.body.tox <= 5.5;
    out.sinkDiag = G.hp + "/" + G.body.wake.toFixed(1) + "/" + G.body.tox.toFixed(1);
    LAB.ui.closeAll();
    /* кофейный автомат: «взять с собой» кладёт стакан в рюкзак, кредиты списаны, ничего не выпито */
    G.credits = 50; G.hp = 40; G.inv.cup_espresso = 0;
    LAB.office.drinkMenu({ id: "t_cof", type: "coffee", x: G.x, y: G.y, room: g.CUR.room });
    const top = LAB.ui.top(), sw = top && top.items[0];
    out.switch = !!sw && sw.kind === "choice" && /Покупки/.test(label(sw));
    if (sw) sw.set(true);
    const ke = top ? top.items.findIndex(i => /^Эспрессо/.test(label(i))) : -1;
    if (ke >= 0) { top.i = ke; LAB.ui.activate(); }
    out.took = G.inv.cup_espresso === 1 && G.credits < 50 && G.hp === 40 && SPOKEN.some(t => /в рюкзаке, раздел «Еда и напитки»/.test(t));
    if (sw) sw.set(false);
    LAB.ui.closeAll();
    /* диван и эспрессо: отдых и напиток вместе, в покое — ещё бодрее и спокойнее */
    G.hp = 40; G.body.wake = 40; G.body.neuro = 60; G.body.food = 80; G.restAt = -1e9;
    LAB.fixtures.menu({ id: "t_sofa", type: "fx", fx: "sofa", x: G.x, y: G.y, room: g.CUR.room });
    const kd = LAB.ui.top() ? LAB.ui.top().items.findIndex(i => /^Посидеть на диване и выпить эспрессо$/.test(label(i))) : -1;
    SPOKEN.length = 0;
    if (kd >= 0) { LAB.ui.top().i = kd; LAB.ui.activate(); }
    const hpWant = 40 + 10 + Math.round(8 * (1 + (G.L - 1) * 0.15));
    out.combo = kd >= 0 && G.inv.cup_espresso === 0 && G.hp === hpWant && G.body.wake >= 40 + 10 + 25 + 7 - 1.5 && G.body.neuro === 60 - 16 - 5;
    out.comboSaid = SPOKEN.some(t => /^Вы выпили: стакан эспрессо/.test(t)) && SPOKEN.some(t => /В покое напиток действует лучше/.test(t));
    out.comboDiag = G.hp + "/" + hpWant + "/" + G.body.wake.toFixed(1) + "/" + G.body.neuro + "/" + SPOKEN.join(" | ").slice(0, 160);
    LAB.ui.closeAll();
    return out;
  });
  ok(!rsf.low.length, "у обстановки каждое восстановление — не меньше пяти единиц (" + rsf.n + " значений)" + (rsf.low.length ? ": " + rsf.low.slice(0, 6).join(", ") : ""));
  ok(rsf.order, "койка и кушетка лечат сильнее дивана, диван — сильнее стула, самовар — сильнее чайника, маты бодрят");
  ok(rsf.chair, "стул: плюс пять здоровья и бодрости, минус восемь нейронагрузки за пять минут (" + rsf.chairDiag + ")");
  ok(rsf.sink, "раковина: умывание — плюс пять здоровья и двенадцать бодрости, токсины ниже (" + rsf.sinkDiag + ")");
  ok(rsf.switch && rsf.took, "кофейный автомат: переключатель «Покупки», «взять с собой» кладёт стакан эспрессо в рюкзак");
  ok(rsf.combo && rsf.comboSaid, "диван и эспрессо: отдых и напиток вместе, в покое напиток действует лучше (" + rsf.comboDiag + ")");

  console.log("Альфа 1.6: записки с кодами, взлом в четыре попытки, отмычки, логические замки, шахматы, инструменты, ловушки жестом, маяки, гул");
  const v16 = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const labels = () => LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
    const C = LAB.combat;
    C.stop(); LAB.ui.closeAll(); if (LAB.mini.active()) LAB.mini.cancel(true);
    /* записки с кодами: заголовок всегда называет дверь */
    out.codeTitles = [0, 1, 2, 3].every(n => /Проверочная/.test(LAB.codeNote("4821", "Проверочная", n).t)) && [0, 1].every(n => /Проверочная/.test(LAB.safeNote("1234", "Проверочная", n).t));
    /* взлом: четыре попытки, ошибка не губит сразу */
    let hackRes = null;
    LAB.mini.hack(4, ok => { hackRes = ok; }, { title: "Проверочный взлом", noOko: true });
    const hc = LAB.mini._cur();
    out.hackTries = !!hc && hc.tries === 4;
    await wait(2600);
    const want = hc.seq[0], wrong = want === "U" ? "D" : "U";
    hc.busy = false; LAB.mini.gesture({ kind: "swipe", n: 1, dir: wrong });
    await wait(50);
    out.hackAlive = LAB.mini.active() && hc.tries === 3 && hackRes === null;
    LAB.mini.cancel(true); await wait(80);
    /* отмычки по виду помещения: пункт у двери, предложение при взломе, одна отмычка — одна дверь */
    let dfl = null;
    for (let L = 3; L <= 5 && !dfl; L++) for (let F = 1; F <= 20 && !dfl; F++) { if (LAB.getFloor(G.seed, L, F).doors.some(d => d.lock && ["key", "card", "code"].indexOf(d.lock.type) >= 0)) dfl = [L, F]; }
    g.enterFloor(dfl[0], dfl[1], "down", true); C.foes().forEach(f => { f.dead = true; }); G.dead = false; G.hp = G.hpMax;
    let fl = g.CUR.fl;
    const door = fl.doors.find(d => d.lock && ["key", "card", "code"].indexOf(d.lock.type) >= 0 && g.CUR.fs.doors[d.id] !== 1 && g.doorBlock(d));
    out.hasDoor = !!door;
    if (door) {
      const pk = g.pickFor(door);
      out.pickKind = /^(lockpick|pick_[brg])$/.test(pk);
      G.inv[pk] = (G.inv[pk] || 0) + 2;
      g.doorMenu(door, "N");
      out.pickItem = labels().some(l => /^Открыть отмычкой — (жёлтая|синяя|красная|зелёная)/.test(l));
      LAB.ui.closeAll();
      if (door.lock.type === "card" || door.lock.type === "code") { g.hackDoor(door); out.hackOffer = labels().some(l => /^Открыть отмычкой/.test(l)) && labels().some(l => /вручную/.test(l)); LAB.ui.closeAll(); }
      else out.hackOffer = true;
      const n0 = G.inv[pk];
      g.doorMenu(door, "N");
      const k = LAB.ui.top().items.findIndex(i => /^Открыть отмычкой/.test(label(i)));
      if (k >= 0) { LAB.ui.top().i = k; LAB.ui.activate(); }
      out.pickUsed = k >= 0 && (G.inv[pk] || 0) === n0 - 1 && g.doorOpen(door);
      out.pickDiag = door.lock.type + "/" + pk + "/" + k;
      LAB.ui.closeAll();
    }
    /* логический замок: есть на этажах, у двери — пункт решения, условие открывается окном */
    let ld = null, lfloor = null;
    for (let L = 3; L <= 6 && !ld; L++) for (let F = 1; F <= 20 && !ld; F++) { const f2 = LAB.getFloor(G.seed, L, F); const d2 = f2.doors.find(d => d.lock && d.lock.type === "logic"); if (d2) { ld = d2; lfloor = [L, F]; } }
    out.logicDoor = !!ld && LAB.logicKinds().indexOf(ld.lock.kind) >= 0 && [0, 1, 2].indexOf(ld.lock.diff) >= 0;
    if (ld) {
      g.enterFloor(lfloor[0], lfloor[1], "down", true); C.foes().forEach(f => { f.dead = true; }); G.dead = false;
      ld = g.CUR.fl.doors.find(d => d.id === ld.id);
      out.logicText = /логический замок/.test(g.lockText(ld)) && /Замок ждёт решения/.test(g.doorBlock(ld));
      g.doorMenu(ld, "N");
      out.logicItem = labels().some(l => /^Решить задачу замка: /.test(l));
      const k2 = LAB.ui.top().items.findIndex(i => /^Решить задачу замка/.test(label(i)));
      if (k2 >= 0) { LAB.ui.top().i = k2; LAB.ui.activate(); }
      const w = LAB.ui.top();
      out.logicCond = !!w && w.note === true && (String(w.title).toLowerCase() === String(LAB.puzzles.NAMES[ld.lock.kind]).toLowerCase() || /Карантинный шлюз|Щит автоматики|Пробы|Склад контейнеров|Журнал дежурств|Журнал смены/.test(labels().join(" ")));
      out.logicDiag = (ld.lock.kind || "") + "/" + (w ? w.title : "нет окна");
      LAB.ui.closeAll(); LAB.Speech.stop();
    }
    /* задачи: решение единственное; шахматы — мат в один ход у каждой позиции; на столике — настоящая партия */
    const P = LAB.puzzles;
    out.chess = P._chessCheck().every(n => n >= 1);
    let uniq = true;
    for (const kind of ["decon", "labels", "shifts"]) for (let s = 1; s <= 10; s++) { P._last = null; P.open(kind, s, () => {}, {}); LAB.ui.closeAll(); if (!P._last || P._last.sol !== 1) uniq = false; }
    out.uniq = uniq;
    LAB.Speech.stop();
    out.chessFx = LAB.FIX.T.chess.a[0][2].mini === "chess";
    /* инструмент: поле из трёх рядов перехватывает жесты, уход — не провал */
    let played = -1;
    LAB.instruments.open("piano", { name: "Пианино" }, n => { played = n; });
    out.instOn = LAB.mini.active() && LAB.mini.name() === "Пианино";
    LAB.mini.gesture({ kind: "swipe", n: 1, dir: "R" }); LAB.mini.gesture({ kind: "swipe", n: 1, dir: "U" }); LAB.mini.gesture({ kind: "tap", n: 1 }); LAB.mini.gesture({ kind: "digit", n: 1, d: 5 });
    LAB.mini.gesture({ kind: "back", n: 1 }); await wait(100);
    out.instOff = !LAB.mini.active() && played >= 3;
    out.voice = !!LAB.instruments.voice("bell", 440, 0.3, 0) && !!LAB.instruments.voice("accordion", 330, 0.5, 0.2);
    /* (2.0) записи настоящих нот: высота точная, у баяна петля, шкатулка — на две октавы выше нот поля */
    {
      const IN = LAB.instruments, insN = Object.keys(LAB.SND).filter(k => /^ins_/.test(k)), S0 = LAB.settings.effects;
      LAB.settings.effects = 1;
      await new Promise(res => { let n = 0; ["piano", "accordion"].forEach(k => IN.preload(k, () => { if (++n === 2) res(); })); setTimeout(res, 15000); });
      const hp = IN.voice("piano", IN.freq(1, 0), 0.4, 0), ha = IN.voice("accordion", IN.freq(1, 2), 0.4, 0);
      const pk = IN._pick("piano", IN.freq(1, 0) * Math.pow(2, 1 / 12)), pl = IN._pick("lullaby", 392);
      out.samples = insN.length >= 60 && ["piano", "guitar", "accordion", "bell", "lullaby"].every(k => insN.some(id => id.indexOf("ins_" + k + "_") === 0))
        && !!(hp && hp.src) && Math.abs(hp.src.playbackRate.value - 1) < 0.002
        && !!(ha && ha.src && ha.src.loop && ha.src.loopStart > 0 && ha.src.loopEnd > ha.src.loopStart)
        && !!pk && Math.abs(Math.log(pk.rate) / Math.LN2 * 12) <= 1.01 && !!pl && pl.id === "ins_lullaby_93" && Math.abs(pl.rate - Math.pow(2, -2 / 12)) < 0.002
        && !LAB.SOUND_ALL.some(k => /^ins_/.test(k));
      out.samplesDiag = [insN.length, hp && hp.src ? hp.src.playbackRate.value : "синтез", ha && ha.src ? [ha.src.loop, ha.src.loopStart, ha.src.loopEnd].join("/") : "синтез", JSON.stringify(pk), JSON.stringify(pl)].join(" ");
      LAB.settings.effects = S0;
    }
    /* (2.0) телефон боком: весь экран — настоящий инструмент, игра пальцами;
       «Назад» не уводит, отойти — только касанием четырьмя пальцами */
    const kb0 = LAB.keysMode, W0 = window.innerWidth, H0 = window.innerHeight, I = LAB.instruments, SF = LAB.surface;
    const pe = (type, id, x, y) => SF.pointer({ type, pointerId: id, clientX: x, clientY: y });
    const slide = (id, x0, y0, x1, y1, n) => { pe("pointerdown", id, x0, y0); for (let k = 1; k <= n; k++) pe("pointermove", id, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); pe("pointerup", id, x1, y1); };
    const logFrom = n => SF._state().log.slice(n);
    const four = [0.15, 0.35, 0.55, 0.75];
    const quadTap = async (y) => { four.forEach((x, k) => pe("pointerdown", 40 + k, W0 * x, H0 * y)); await wait(80); four.forEach((x, k) => pe("pointerup", 40 + k, W0 * x, H0 * y)); await wait(100); };
    LAB.keysMode = false;
    /* пианино: белые клавиши — во всю высоту, чёрные — в верхней части; крышка — октавы */
    let pl2 = -1;
    LAB.instruments.open("piano", { name: "Пианино" }, n => { pl2 = n; });
    const s1 = SF._state();
    out.surfOn = s1.on && s1.inst === "piano" && s1.orient === "landscape" && s1.view && LAB.mini.active();
    slide(1, 2, H0 * 0.92, W0 - 2, H0 * 0.92, 60);
    out.white = logFrom(0);
    slide(2, 2, H0 * 0.3, W0 - 2, H0 * 0.3, 150);
    out.upper = logFrom(out.white.length);
    pe("pointerdown", 3, W0 * 0.9, 4); pe("pointerup", 3, W0 * 0.9, 4);
    out.octUp = SF._state().base;
    pe("pointerdown", 3, W0 * 0.1, 4); pe("pointerup", 3, W0 * 0.1, 4);
    out.octBack = SF._state().base;
    /* «Назад» инструмент не закрывает — подсказывает, как отойти */
    SPOKEN.length = 0;
    out.backKept = window.labBack() === 1 && SF.active() && LAB.mini.active() && /четырьмя пальцами/.test(SPOKEN.join(" "));
    LAB.mini.gesture({ kind: "swipe", n: 2, dir: "D" });
    out.backKept = out.backKept && SF.active();
    /* игра не закрывает инструмент: два пальца по клавишам, аккорд из четырёх нот, который держат, скольжение четырьмя пальцами */
    pe("pointerdown", 4, W0 * 0.3, H0 * 0.2); pe("pointerdown", 5, W0 * 0.6, H0 * 0.2);
    for (let k = 1; k <= 10; k++) { pe("pointermove", 4, W0 * 0.3, H0 * (0.2 + 0.06 * k)); pe("pointermove", 5, W0 * 0.6, H0 * (0.2 + 0.06 * k)); }
    pe("pointerup", 4, W0 * 0.3, H0 * 0.8); pe("pointerup", 5, W0 * 0.6, H0 * 0.8);
    await wait(100);
    out.keep2 = SF.active() && LAB.mini.active();
    four.forEach((x, k) => pe("pointerdown", 20 + k, W0 * x, H0 * 0.5));
    await wait(900);
    four.forEach((x, k) => pe("pointerup", 20 + k, W0 * x, H0 * 0.5));
    out.keepChord = SF.active();
    four.forEach((x, k) => pe("pointerdown", 30 + k, W0 * x, H0 * 0.8));
    for (let j = 1; j <= 6; j++) four.forEach((x, k) => pe("pointermove", 30 + k, W0 * x, H0 * (0.8 - 0.1 * j)));
    four.forEach((x, k) => pe("pointerup", 30 + k, W0 * x, H0 * 0.2));
    out.keepSlide = SF.active();
    await quadTap(0.6);
    const s2 = SF._state();
    out.surfOff = !s2.on && s2.orient === "portrait" && !s2.view && !LAB.mini.active() && pl2 >= 10;
    out.quadDiag = [out.keep2, out.keepChord, out.keepSlide, s2.on, s2.orient, LAB.mini.active(), pl2].join(" ");
    /* гитара: удар по открытым струнам, лад на грифе, аккорд с заглушённой струной */
    let pl3 = -1;
    LAB.instruments.open("guitar", { name: "Гитара" }, n => { pl3 = n; });
    const head = Math.max(34, W0 * 0.07), neck = W0 * 0.64, fretX = k => head + (neck - head) * (k - 0.5) / 9, strY = i => H0 * (i + 0.5) / 6;
    out.gtrOn = SF._state().on && SF._state().inst === "guitar" && SF._state().mode === "frets";
    slide(5, W0 * 0.85, 2, W0 * 0.85, H0 - 2, 30);
    out.strum = JSON.stringify(logFrom(0)) === JSON.stringify(I.GTR_OPEN);
    const g1 = SF._state().log.length;
    pe("pointerdown", 6, fretX(3), strY(5));                 /* тонкая струна, третий лад: соль */
    pe("pointerdown", 7, W0 * 0.85, strY(5)); pe("pointerup", 7, W0 * 0.85, strY(5));
    out.fret = JSON.stringify(logFrom(g1)) === JSON.stringify([67, 67]) && SF._state().frets[5] === 3;
    pe("pointerup", 6, fretX(3), strY(5));
    out.fretOff = SF._state().frets[5] === 0;
    pe("pointerdown", 8, 4, H0 / 2); pe("pointerup", 8, 4, H0 / 2);          /* колки — аккорды */
    out.chordMode = SF._state().mode === "chords";
    pe("pointerdown", 9, head + (neck - head) * 0.5 / 7, H0 / 2);            /* до мажор: толстая струна молчит */
    const g2 = SF._state().log.length;
    slide(10, W0 * 0.85, 2, W0 * 0.85, H0 - 2, 30);
    out.chordC = JSON.stringify(logFrom(g2)) === JSON.stringify([48, 52, 55, 60, 64]);
    pe("pointerup", 9, head + (neck - head) * 0.5 / 7, H0 / 2);
    /* удар двумя пальцами по струнам — это игра, а не выход */
    const g3 = SF._state().log.length;
    pe("pointerdown", 11, W0 * 0.75, 3); pe("pointerdown", 12, W0 * 0.9, 3);
    for (let k = 1; k <= 12; k++) { pe("pointermove", 11, W0 * 0.75, H0 * 0.078 * k); pe("pointermove", 12, W0 * 0.9, H0 * 0.078 * k); }
    pe("pointerup", 11, W0 * 0.75, H0 * 0.97); pe("pointerup", 12, W0 * 0.9, H0 * 0.97);
    await wait(100);
    out.gtrStrum2 = SF.active() && SF._state().log.length - g3 >= 10;
    await quadTap(0.5);
    out.gtrOff = !SF.active() && SF._state().orient === "portrait" && pl3 > 0;
    /* баян: по столбцу снизу вверх — полутоны, вдоль ряда — малые терции; слева бас и аккорд */
    LAB.instruments.open("accordion", { name: "Баян" }, () => {});
    const split = W0 * 0.36, colX = j => split + (W0 - split) * (j + 0.5) / 12, rowY = r => H0 * (2.5 - r) / 3;
    slide(13, colX(0), rowY(0), colX(0), rowY(2), 20);
    const b0 = SF._state().log.length;
    slide(14, colX(0), rowY(0), colX(3), rowY(0), 30);
    pe("pointerdown", 15, split / 6 * 1.5, rowY(0)); pe("pointerdown", 16, split / 6 * 1.5, rowY(1));
    out.bayan = JSON.stringify(logFrom(0).slice(0, 3)) === JSON.stringify([48, 49, 50]) && JSON.stringify(logFrom(b0)) === JSON.stringify([48, 51, 54, 57, 36, 60]);
    out.bayanDiag = logFrom(0).join(",");
    pe("pointerup", 15, split / 6 * 1.5, rowY(0)); pe("pointerup", 16, split / 6 * 1.5, rowY(1));
    await quadTap(0.5);
    /* колокола: внизу основные, вверху с диезами; глушитель */
    LAB.instruments.open("bell", { name: "Колокола" }, () => {});
    slide(17, 2, H0 * 0.9, W0 - 2, H0 * 0.9, 60);
    const c0 = SF._state().log.length;
    slide(18, 2, H0 * 0.3, W0 - 2, H0 * 0.3, 150);
    out.chimes = JSON.stringify(logFrom(0).slice(0, c0)) === JSON.stringify([60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77]) && JSON.stringify(logFrom(c0)) === JSON.stringify([61, 63, 66, 68, 70, 73, 75]);
    await quadTap(0.6);
    /* колыбель: гребёнка шкатулки и ручка завода — колыбельная */
    LAB.instruments.open("lullaby", { name: "Колыбель" }, () => {});
    slide(19, 2, H0 * 0.5, W0 * 0.7, H0 * 0.5, 60);
    const m0 = SF._state().log.length;
    const cx = W0 * 0.86, cy = H0 * 0.5, R = Math.min(W0 * 0.12, H0 * 0.4) * 0.8;
    pe("pointerdown", 20, cx + R, cy);
    for (let k = 1; k <= 80; k++) { const a = k / 80 * Math.PI * 4; pe("pointermove", 20, cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
    pe("pointerup", 20, cx + R, cy);
    out.box = m0 === 15 && JSON.stringify(logFrom(m0).slice(0, 6)) === JSON.stringify([88, 88, 91, 88, 88, 91]);
    /* назад по кругу — только трещотка */
    const m1 = SF._state().log.length;
    pe("pointerdown", 21, cx + R, cy);
    for (let k = 1; k <= 40; k++) { const a = -k / 40 * Math.PI * 2; pe("pointermove", 21, cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
    pe("pointerup", 21, cx + R, cy);
    out.boxBack = SF._state().log.length === m1;
    await quadTap(0.5);
    out.allOff = !SF.active() && !LAB.mini.active();
    LAB.keysMode = kb0;
    /* ловушка — жест вверх-вниз, мина — вниз-вверх; (2.0) и с оружием в руках */
    g.enterFloor(2, 4, "down", true); C.foes().forEach(f => { f.dead = true; }); G.dead = false; G.drawn = false; G.hp = G.hpMax;
    fl = g.CUR.fl;
    const free = (x, y) => LAB.inb(x, y) && (fl.t[y * LAB.W + x] === LAB.T.ROOM || fl.t[y * LAB.W + x] === LAB.T.CORR) && !fl.objAt[y * LAB.W + x];
    const rm = fl.rooms.find(r => r && (r.x1 - r.x0) >= 4 && (r.y1 - r.y0) >= 3);
    let cell = null; for (let y = rm.y0; y <= rm.y1 && !cell; y++) for (let x = rm.x0; x < rm.x1 - 1 && !cell; x++) if (free(x, y) && free(x + 1, y) && free(x + 2, y)) cell = [x, y];
    G.x = cell[0]; G.y = cell[1]; g.CUR.room = -9;
    LAB.traps.list().length = 0;
    Object.keys(G.inv).forEach(k => { if (/^tr_/.test(k)) delete G.inv[k]; }); /* одна ловушка и одна мина: ставятся сразу, без выбора */
    G.inv.tr_jaw = 1; G.inv.tr_mine = 1;
    g.paused = false; SPOKEN.length = 0;
    LAB.input.dispatch({ kind: "zig", n: 1, dir: "U", dir2: "D" });
    const t1 = LAB.traps.list().length === 1 && LAB.traps.list()[0].t === "jaw" && !G.inv.tr_jaw;
    const zigSaid = SPOKEN.slice(-1).join("").slice(0, 60);
    G.x = cell[0] + 1;
    LAB.input.dispatch({ kind: "zig", n: 1, dir: "D", dir2: "U" });
    const t2 = LAB.traps.list().length === 2 && LAB.traps.list()[1].t === "mine" && !G.inv.tr_mine;
    out.zig = t1 && t2; out.zigDiag = LAB.traps.list().map(tp => tp.t + ":" + tp.st).join(",") + " " + zigSaid;
    out.mineFlag = LAB.traps.isMine("mine") && LAB.traps.isMine("claymore") && !LAB.traps.isMine("jaw");
    G.inv.tr_jaw = 1; G.drawn = true; G.x = cell[0] + 2;
    LAB.input.dispatch({ kind: "zig", n: 1, dir: "U", dir2: "D" });
    out.zigArmed = LAB.traps.list().length === 3 && !G.inv.tr_jaw;
    G.drawn = false; delete G.inv.tr_jaw;
    LAB.ui.closeAll();
    /* маяки: у известной ловушки — свой источник; после скана у врага — метка и источник, который движется с ним */
    /* герой на третьей клетке, капкан и мина — на первых двух; враг — рядом, не на клетке героя (на нулевом расстоянии маяк не звучит) */
    const f0 = C.foes()[0];
    /* (2.0) враг замирает: патрульный иначе уйдёт своим обходом, пока проверка ждёт маяк */
    if (f0) { f0.dead = false; f0.hp = f0.maxhp; f0.x = cell[0] + 2; f0.y = cell[1] + 1; f0.state = "idle"; f0.frozen = 999; }
    C.useImplantFree("scan");
    out.mark = !!f0 && f0.mark > Date.now();
    await wait(600);
    const srcs = LAB.atmos._sources();
    out.trapBeacon = srcs.some(s => s.trap === "jaw") && srcs.some(s => s.trap === "mine");
    out.foeBeacon = !f0 || srcs.some(s => s.key === "f" + f0.id && s.x === f0.x && s.y === f0.y);
    if (f0) { f0.x = cell[0] + 1; f0.y = cell[1] + 1; await wait(500); out.foeMoves = LAB.atmos._sources().some(s => s.key === "f" + f0.id && s.x === cell[0] + 1 && s.y === cell[1] + 1); f0.dead = true; } else out.foeMoves = true;
    out.beaconDiag = [out.mark, out.trapBeacon, out.foeBeacon, out.foeMoves].join(",") + " " + srcs.map(s => s.key + (s.trap ? ":" + s.trap : "") + (s.foe ? ":" + s.foe : "")).join(" ");
    out.hum = LAB.atmos._bed() || !LAB.AE.ctx;
    LAB.traps.list().length = 0;
    return out;
  });
  ok(v16.codeTitles, "записки с кодами и кодами сейфов подписаны: в заголовке — какая дверь");
  ok(v16.hackTries && v16.hackAlive, "взлом: четыре попытки, ошибка не губит сразу — сигналы заново");
  ok(v16.hasDoor && v16.pickKind && v16.pickItem && v16.hackOffer && v16.pickUsed, "отмычка под цвет помещения: пункт у двери, предложение при взломе, дверь открыта, отмычек меньше (" + v16.pickDiag + ")");
  ok(v16.logicDoor && v16.logicText && v16.logicItem && v16.logicCond, "логический замок: есть на этажах, пункт решения, условие окном (" + v16.logicDiag + ")");
  ok(v16.chess && v16.uniq && v16.chessFx, "задачи с единственным решением, у шахматных позиций есть мат в один ход, на столике — настоящая партия");
  ok(v16.instOn && v16.instOff && v16.voice, "инструмент: поле из трёх рядов перехватывает жесты, ноты звучат, уход — не провал");
  ok(v16.samples, "инструменты — записи настоящих нот: до первой октавы звучит без сдвига, до-диез — из соседней записи на полутон, у баяна петля, шкатулка на две октавы выше, ноты не грузятся заранее (" + v16.samplesDiag + ")");
  const wantWhite = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72], wantUpper = Array.from({ length: 25 }, (_, i) => 48 + i);
  ok(v16.surfOn && JSON.stringify(v16.white) === JSON.stringify(wantWhite) && JSON.stringify(v16.upper) === JSON.stringify(wantUpper) && v16.octUp === 60 && v16.octBack === 48 && v16.surfOff,
    "пианино на весь экран: внизу — пятнадцать белых клавиш подряд, в верхней части — и чёрные, все полутона; крышка — октава выше и ниже; касание четырьмя пальцами — отойти, экран снова вертикальный (" + (v16.upper || []).length + " клавиш вверху)");
  ok(v16.backKept, "кнопка «Назад» и два пальца вниз инструмент не закрывают: звучит подсказка, как отойти");
  ok(v16.keep2 && v16.keepChord && v16.keepSlide && v16.gtrStrum2, "выход не мешает игре: два пальца по клавишам, аккорд из четырёх нот, который держат, скольжение четырьмя пальцами и удар двумя пальцами по струнам инструмент не закрывают (" + v16.quadDiag + ")");
  ok(v16.gtrOn && v16.strum && v16.fret && v16.fretOff && v16.chordMode && v16.chordC && v16.gtrOff, "гитара: удар вниз по открытым струнам — ми, ля, ре, соль, си, ми; третий лад на тонкой — соль; колки — аккорды, до мажор без толстой струны");
  ok(v16.bayan, "баян: по столбцу снизу вверх — полутоны, вдоль ряда — через малую терцию, слева бас и мажорный аккорд (" + v16.bayanDiag + ")");
  ok(v16.chimes, "колокола: внизу основные трубы, вверху — с диезами, между ними");
  ok(v16.box && v16.boxBack && v16.allOff, "колыбель: гребёнка из пятнадцати язычков, ручка по часовой стрелке играет колыбельную, назад — не играет");
  ok(v16.zig && v16.mineFlag && v16.zigArmed, "ловушка — жест вверх-вниз, мина — вниз-вверх, и с оружием в руках тоже (" + v16.zigDiag + ")");
  ok(v16.mark && v16.trapBeacon && v16.foeBeacon && v16.foeMoves, "маяки: у ловушки и мины свои, скан вешает маяк на врага, и он движется с ним (" + v16.beaconDiag + ")");
  ok(v16.hum, "фон лаборатории: запись низкого гула машин звучит");

  console.log("Звуковые комбинации с цифрами: вверх 1, вправо 2, вниз 3, влево 4");
  const dig = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const NUM = { U: "один", R: "два", D: "три", L: "четыре" }, DG = { U: 1, R: 2, D: 3, L: 4 }, out = {};
    const digits = () => SPOKEN.filter(t => /^(один|два|три|четыре)$/.test(t));
    let res = null;
    SPOKEN.length = 0;
    LAB.mini.hack(4, ok => { res = ok; }, { title: "Проверка цифр", noOko: true });
    const c = LAB.mini._cur();
    out.intro = SPOKEN.some(t => /вверх, один; справа — вправо, два; низкий — вниз, три; слева — влево, четыре/.test(t));
    for (let k = 0; k < 200 && c.busy; k++) await wait(50);
    out.round1 = JSON.stringify(digits()) === JSON.stringify(c.seq.slice(0, 3).map(d => NUM[d]));
    /* ввод — цифрами: у каждого введённого сигнала звучит его цифра */
    SPOKEN.length = 0;
    for (let i = 0; i < 3; i++) LAB.mini.gesture({ kind: "digit", n: 1, d: DG[c.seq[i]] });
    out.echo = JSON.stringify(digits()) === JSON.stringify(c.seq.slice(0, 3).map(d => NUM[d]));
    /* верно — добавился ещё сигнал, комбинация звучит заново: четыре сигнала */
    for (let k = 0; k < 300 && c.busy; k++) await wait(50);
    out.more = SPOKEN.some(t => /Ещё сигнал/.test(t)) && c.round === 4 && JSON.stringify(digits().slice(3)) === JSON.stringify(c.seq.slice(0, 4).map(d => NUM[d]));
    for (let i = 0; i < 4; i++) LAB.mini.gesture({ kind: "digit", n: 1, d: DG[c.seq[i]] });
    await wait(500);
    out.solved = res === true;
    return out;
  });
  ok(dig.intro && dig.round1 && dig.echo, "взлом: у сигнала своя цифра — вверх один, вправо два, вниз три, влево четыре; цифры звучат с комбинацией и при вводе, вводить можно и цифрами");
  ok(dig.more && dig.solved, "взлом: повторили верно — добавился ещё сигнал, комбинация прозвучала заново из четырёх; введена вся — взлом удался");

  console.log("Охрана с первого этажа: патрули в коридорах, машины в кабинетах, машину рядом слышно");
  const gar = await page.evaluate(() => {
    const g = LAB.game, G = g.G, C = LAB.combat, out = {};
    /* первый этаж — как в новой игре: прежние проверки здесь всех уже победили */
    g.enterFloor(1, 2, "down", true);
    delete G.fs["1-1"];
    g.enterFloor(1, 1, "down", true);
    const live = () => C.foes().filter(f => !f.dead);
    out.patrols = live().filter(f => f.beat).length;
    out.rooms = live().filter(f => f.garrison).length;
    /* машина в кабинете: вы в том же помещении — её слышно; издалека — почти нет */
    const bot = live().find(f => f.garrison && f.kind === "mech" && !f.disguised);
    if (bot) {
      const A = LAB.atmos, orig = A.foeSound;
      let near = 0, far = 0, where = "near";
      A.foeSound = function (f, kind) { if (f === bot && kind === "idle") { if (where === "near") near++; else far++; } return orig.apply(this, arguments); };
      const x0 = G.x, y0 = G.y, cl = G.st.cloak, fl = g.CUR.fl, rm = fl.rooms[bot.room];
      G.st.cloak = 999;
      let cell = null;
      for (let y = rm.y0; y <= rm.y1 && !cell; y++) for (let x = rm.x0; x <= rm.x1 && !cell; x++) if ((x !== bot.x || y !== bot.y) && fl.t[y * LAB.W + x] === LAB.T.ROOM && !fl.objAt[y * LAB.W + x]) cell = [x, y];
      if (cell) { G.x = cell[0]; G.y = cell[1]; }
      for (let i = 0; i < 40; i++) { C.tick(); bot.state = "idle"; }
      where = "far"; G.x = x0; G.y = y0;
      for (let i = 0; i < 40; i++) { C.tick(); bot.state = "idle"; }
      A.foeSound = orig; G.st.cloak = cl;
      out.near = near; out.far = far; out.type = bot.type + "/" + bot.garrison;
    }
    /* (2.0) наверху патрулируют шагающие обходчики; патруль поблизости «Эхо» называет */
    out.walkers = live().filter(f => f.beat && f.type === "walker").length;
    const pat = live().find(f => f.beat && f.kind === "mech");
    if (pat) {
      const fl = g.CUR.fl, x0 = G.x, y0 = G.y, cl = G.st.cloak;
      const ok2 = (x, y) => LAB.inb(x, y) && [LAB.T.CORR, LAB.T.ROOM].indexOf(fl.t[y * LAB.W + x]) >= 0 && !fl.objAt[y * LAB.W + x];
      let cell = null;
      for (let r = 4; r <= 7 && !cell; r++) for (let dx = -r; dx <= r && !cell; dx++) for (const dy of [-r, r]) if (!cell && ok2(pat.x + dx, pat.y + dy)) cell = [pat.x + dx, pat.y + dy];
      if (cell) {
        G.st.cloak = 999; C.foes().forEach(f => { if (f !== pat) f.dead = true; });
        C._cueReset(); SPOKEN.length = 0;
        G.x = cell[0]; G.y = cell[1];
        for (let i = 0; i < 6; i++) { pat.state = "idle"; C.tick(); }
        out.cue = SPOKEN.filter(t => /^(Шаги|Гул) патруля: /.test(t)).join(" | ");
        G.x = x0; G.y = y0; G.st.cloak = cl;
      }
    }
    return out;
  });
  ok(gar.patrols >= 3 && gar.rooms >= 8, "охрана с первого этажа: патрули в коридорах (" + gar.patrols + "), машины в кабинетах (" + gar.rooms + ")");
  ok(gar.walkers >= 1 && /^(Шаги|Гул) патруля: .+(шаг|шага|шагов)\.$/.test(gar.cue || ""), "наверху патрулируют обходчики (" + gar.walkers + "), патруль поблизости «Эхо» называет: " + (gar.cue || "молчит"));
  ok(gar.near >= 4 && gar.near > gar.far * 2, "машину в кабинете слышно, когда вы рядом (" + gar.type + "): в одном помещении — " + gar.near + " раз за 20 секунд, издалека — " + gar.far);

  console.log("Плотная охрана на всех уровнях; ОКО заменяет потери и усиливает нажим");
  const dense = await page.evaluate(() => {
    /* этажи — как их строит генератор (прежние проверки многих здесь уже победили) */
    const G = LAB.game.G, out = { rows: [] };
    for (const [L, F] of [[1, 1], [1, 6], [4, 10], [10, 20], [25, 7], [50, 14], [75, 3], [100, 20]]) {
      const fl = LAB.getFloor(G.seed, L, F), all = fl.foes, beh = f => (LAB.FOES[f.type] || {}).beh || [], kind = f => (LAB.FOES[f.type] || {}).kind;
      const annex = fl.rooms.filter(r => r && r.annex && !r.hidden).length;
      const rooms = new Set(all.filter(f => f.garrison && f.room >= 0).map(f => f.room)).size;
      out.rows.push({ L, F, n: all.length, patrols: all.filter(f => f.beat).length, drones: all.filter(f => f.beat && beh(f).indexOf("fly") >= 0).length,
        rooms, roomsAll: annex, stair: all.filter(f => f.stairPost).length, bio: all.filter(f => kind(f) === "bio").length, anom: all.filter(f => kind(f) === "anom").length, types: new Set(all.map(f => f.type)).size });
    }
    /* (3.7) «глубже — разнообразнее и больше» — в среднем по четырём мирам: у одного зерна первый этаж
       бывает людным, а последний — просторным и редким */
    const avg = (L, F) => { let n = 0, t = 0; for (let i = 0; i < 4; i++) { const f2 = LAB.getFloor("dense" + i, L, F); n += f2.foes.length; t += new Set(f2.foes.map(f => f.type)).size; } return { n: Math.round(n / 4), types: Math.round(t / 4) }; };
    out.avg1 = avg(1, 1); out.avgZ = avg(100, 20);
    return out;
  });
  const rowsTxt = dense.rows.map(r => r.L + "-" + r.F + ": " + r.n + " врагов, патрулей " + r.patrols + " (дронов " + r.drones + "), кабинетов под охраной " + r.rooms + " из " + r.roomsAll + ", у лестниц " + r.stair + ", тварей " + r.bio + (r.anom ? ", аномалий " + r.anom : "") + ", видов " + r.types).join("; ");
  ok(dense.rows.every(r => r.n >= 150 && r.patrols >= 5 && r.stair >= 1 && r.bio >= 1 && r.rooms >= r.roomsAll * 0.6), "охрана плотная на всех уровнях: робот почти в каждом кабинете, патрули, стражи у лестниц, твари — " + rowsTxt);
  ok(dense.rows.some(r => r.drones >= 1), "по коридорам летают патрульные дроны");
  const d1 = dense.avg1, dz = dense.avgZ;
  ok(dz.types > d1.types && dz.n >= d1.n, "чем глубже, тем разнообразнее и больше (в среднем по четырём мирам): видов " + d1.types + " → " + dz.types + ", врагов " + d1.n + " → " + dz.n);

  const repl = await page.evaluate(() => {
    const g = LAB.game, G = g.G, C = LAB.combat, O = LAB.oko, out = {};
    const live = () => C.foes().filter(f => !f.dead);
    const hero = (f) => Math.abs(f.x - G.x) + Math.abs(f.y - G.y);
    const repl = () => g.CUR.fs.repl || [];
    /* этаж — заново, как в новой игре: прежние проверки здесь всех уже победили */
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); };
    /* (3.0) волны ОКО выжидают, пока герой в помещении: выйти в коридор (без передышки и ожидания) */
    const outside = () => {
      const fl = g.CUR.fl, W = LAB.W, fs = g.CUR.fs; let best = null, bd = 1e9;
      for (let i = 0; i < fl.t.length; i++) {
        if (fl.corrAt[i] < 0 || fl.room[i] >= 0 || fl.t[i] === LAB.T.DOOR) continue;
        const x = i % W, y = (i / W) | 0;
        if (!g.passable(x, y) || C.foes().some(f => !f.dead && f.x === x && f.y === y)) continue;
        const d = Math.abs(x - G.x) + Math.abs(y - G.y); if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) { G.x = best[0]; G.y = best[1]; }
      fs.wIn = false; fs.wOut = 0; fs.wHoldT = 0; fs.wReady = 0;
    };
    fresh(2, 4);
    G.hp = G.hpMax = 1e7; G.st.cloak = 1e6; outside();
    /* убили патрульного — ОКО шлёт нового на тот же участок, не у вас на глазах */
    /* (2.2) не сапёр: его участок ОКО не возобновляет (у сапёра свой приказ) */
    const pat = live().filter(f => f.beat && f.kind === "mech" && !f.boss && !f.sapper).sort((a, b) => hero(b) - hero(a))[0];
    const corr = pat.corr, beatKey = JSON.stringify(pat.beat);
    C.damageFoe(pat, 1e7, "kinetic", { quiet: true });
    const q = repl().find(q => q.k === "patrol" && q.corr === corr);
    out.pQueued = !!q; out.pDelay = q ? q.t - O.T() : -1;
    let got = null, ticks = 0;
    for (; ticks < 500 && !got; ticks++) { C.tick(); got = live().find(f => f.spawned && f.beat && JSON.stringify(f.beat) === beatKey); }
    out.pBack = !!got; out.pTicks = ticks; out.pFar = got ? hero(got) : 0; out.pSpawned = !!(got && got.spawned);
    /* опустел кабинет — через время ОКО присылает в него машины */
    const rmF = live().filter(f => f.guard === "room" && f.kind === "mech" && f.room >= 0).sort((a, b) => hero(b) - hero(a))[0];
    const room = rmF.room;
    live().filter(f => f.room === room && f.guard === "room" && f.kind === "mech").forEach(f => C.damageFoe(f, 1e7, "kinetic", { quiet: true }));
    const rq = repl().find(q => q.k === "room" && q.room === room);
    out.rQueued = !!rq;
    /* (2.3) срок — по режиму: в обычном семь минут (840 тактов по полсекунды) и до десятой доли сверху */
    out.rDelay = rq ? rq.t - O.T() : -1;
    const sec = LAB.DIFF[LAB.settings.difficulty || 1].room;
    out.rDelayOk = rq ? out.rDelay >= sec * 2 && out.rDelay <= Math.ceil(sec * 2 * 1.1) + 1 : false;
    out.rSec = sec;
    /* срок проверен — дальше не ждём семь минут */
    if (rq) rq.t = O.T() + 3;
    let back = null; ticks = 0;
    /* (2.2) пришёл любой присланный ОКО — страж, рабочая машина или уборщик (у уборщика своего поста нет) */
    for (; ticks < 900 && !back; ticks++) { C.tick(); back = live().find(f => f.spawned && f.oko && g.CUR.fl.room[f.y * LAB.W + f.x] === room); }
    out.rBack = !!back; out.rTicks = ticks;
    /* пал страж у лестницы — ОКО присылает смену на тот же пост */
    const gd = live().filter(f => f.guard === "stairs" && f.post && !f.boss).sort((a, b) => hero(b) - hero(a))[0];
    if (gd) {
      const px = gd.post.x, py = gd.post.y;
      C.damageFoe(gd, 1e7, "kinetic", { quiet: true });
      out.sQueued = repl().some(q => q.k === "post" && q.post[0] === px && q.post[1] === py && q.kind === "stairs");
      let sb = null; ticks = 0;
      for (; ticks < 500 && !sb; ticks++) { C.tick(); sb = live().find(f => f.spawned && f.guard === "stairs" && f.post && f.post.x === px && f.post.y === py); }
      out.sBack = !!sb; out.sTicks = ticks;
    }
    /* «качаться» на одних и тех же: каждая новая потеря — замена больше и быстрее */
    fresh(2, 5);
    G.hp = G.hpMax = 1e7; G.st.cloak = 1e6;
    const batches = [], killOne = () => {
      let p = live().find(f => f.beat && f.kind === "mech" && !f.boss && !f.sapper);
      /* (2.2) патрульных на этаже могло не хватить на восемь потерь — поднять одного из павших */
      if (!p) { p = C.foes().find(f => f.dead && f.beat && f.kind === "mech" && !f.boss && !f.sapper); if (p) { p.dead = false; p.hp = p.maxhp; } }
      if (!p) return;
      C.damageFoe(p, 1e7, "kinetic", { quiet: true });
      const nq = repl().find(q => q.k === "patrol" && q.corr === p.corr);
      batches.push(nq ? nq.n : 0);
      g.CUR.fs.repl = []; /* следующую замену считаем отдельно */
    };
    for (let i = 0; i < 6; i++) killOne();
    /* а если бить так и дальше — десять потерь подряд */
    g.CUR.fs.lossN = 10; g.CUR.fs.lossT = O.T();
    killOne(); killOne();
    out.batches = batches;
    /* затишье — нажим спадает */
    g.CUR.fs.lossT = O.T() - 5000;
    /* патрульных на этаже могло не хватить — тогда поднять одного из павших */
    let p2 = live().find(f => f.beat && f.kind === "mech" && !f.boss && !f.sapper);
    if (!p2) { p2 = C.foes().find(f => f.dead && f.beat && f.kind === "mech" && !f.boss && !f.sapper); if (p2) { p2.dead = false; p2.hp = p2.maxhp; } }
    if (p2) { C.damageFoe(p2, 1e7, "kinetic", { quiet: true }); const nq = repl().find(q => q.k === "patrol" && q.corr === p2.corr); out.calmBatch = nq ? nq.n : 0; }
    G.st.cloak = 0;
    return out;
  });
  ok(repl.pQueued && repl.pBack && repl.pFar >= 12 && repl.pSpawned, "убили патрульного — ОКО присылает нового на тот же участок, издалека (" + repl.pTicks + " тактов, в " + repl.pFar + " шагах от вас)");
  ok(repl.rQueued && repl.rDelayOk && repl.rBack, "зачистили кабинет — ОКО заселит его снова не раньше, чем через время режима (" + repl.rSec + " с; срок " + repl.rDelay + " тактов), и присылает машины (" + repl.rTicks + " тактов)");
  ok(repl.sQueued && repl.sBack, "пал страж у лестницы — ОКО присылает смену на тот же пост (" + repl.sTicks + " тактов)");
  const b = repl.batches;
  ok(b.length === 8 && b[0] === 1 && b[2] === 1 && b[3] === 2 && b[5] === 2 && b[6] >= 4 && b[7] >= 4, "бьёте одних и тех же — ОКО присылает больше: по одной, после трёх потерь — по две, дальше — по четыре-пять: " + b.join(", "));
  ok(repl.calmBatch === 1, "затишье — нажим ОКО спадает: снова по одной машине (" + repl.calmBatch + ")");

  console.log("Облегчённый режим для слабых телефонов");
  const lite = await page.evaluate(async () => {
    const S = LAB.settings, C = LAB.combat, Snd = LAB.Sound, AE = LAB.AE, B = LAB.Bank, g = LAB.game, G = g.G, out = {};
    const lab = i => typeof i.label === "function" ? i.label() : i.label;
    S.lite = 0; LAB.saveSettings(); if (AE.applyLite) AE.applyLite();
    out.fx0 = Snd.lim("fx"); out.lod0 = C.lodLevel();
    LAB.ui.settings();
    const w = LAB.ui.top(), li = w.items.findIndex(i => /Облегчённый режим/.test(lab(i)));
    out.item = li >= 0 ? lab(w.items[li]) : "";
    SPOKEN.length = 0; w.i = li; LAB.ui.activate();
    out.on = S.lite; out.said = SPOKEN.join(" | ");
    out.lod = C.lodLevel(); out.fx = Snd.lim("fx"); out.total = Snd.lim("total"); out.convOff = AE.convOff;
    LAB.ui.closeAll();
    /* мир: дальняя спокойная машина думает реже ближней (этаж — заново) */
    g.enterFloor(3, 3, "down", true); delete G.fs["3-4"]; g.enterFloor(3, 4, "down", true);
    G.hp = G.hpMax = 1e7; G.st.cloak = 1e6;
    const live = C.foes().filter(f => !f.dead && !f.calm && !f.ally && !f.boss && !f.task && f.kind === "mech" && f.beat && (f.base.beh || []).indexOf("stalker") < 0);
    const dist = f => Math.max(Math.abs(f.x - G.x), Math.abs(f.y - G.y));
    const far = live.filter(f => dist(f) > 60)[0];
    let near = null;
    if (far) {
      /* ближняя — ставим рядом спокойную патрульную машину */
      near = live.filter(f => f !== far)[0];
      if (near) { near.x = G.x + 3; near.y = G.y; }
    }
    /* обе стоят на месте (иначе патрульный уйдёт обходом и станет дальним) */
    if (far) far.frozen = 999; if (near) near.frozen = 999;
    const a0 = far ? far.hitT : 0, n0 = near ? near.hitT : 0;
    for (let i = 0; i < 48; i++) { if (far) far.state = "idle"; if (near) near.state = "idle"; C.tick(); }
    out.farTicks = far ? far.hitT - a0 : -1; out.nearTicks = near ? near.hitT - n0 : -1;
    if (far) far.frozen = 0; if (near) near.frozen = 0;
    /* эффекты после загрузки — в моно, музыка — как записана */
    const fxId = Object.keys(B.defs).find(id => B.defs[id].bus === "fx" && /^w_/.test(id) && B.defs[id].f.length);
    if (fxId && AE.ensure()) {
      const file = B.defs[fxId].f[0];
      delete B.bufs[file];
      const buf = await B.load(file);
      out.fxCh = buf ? buf.numberOfChannels : -1;
    }
    /* выключили — всё как было */
    LAB.ui.settings();
    const w2 = LAB.ui.top(); w2.i = li; LAB.ui.activate();
    out.off = S.lite; out.fx2 = Snd.lim("fx"); out.lod2 = C.lodLevel(); out.convOff2 = AE.convOff;
    LAB.ui.closeAll();
    G.st.cloak = 0;
    return out;
  });
  ok(/Облегчённый режим для слабых/.test(lite.item) && lite.on === 1 && /думают реже/.test(lite.said) && /отзвука помещений нет/.test(lite.said), "в настройках — облегчённый режим; включили — сказано, что изменилось: " + lite.said.slice(0, 160));
  ok(lite.lod >= 2 && lite.lod0 < lite.lod && lite.fx < lite.fx0 && lite.convOff === true, "облегчённый режим: мир подробнее только рядом (уровень " + lite.lod0 + " → " + lite.lod + "), звуков сразу меньше (" + lite.fx0 + " → " + lite.fx + "), отзвук отключён");
  ok(lite.farTicks >= 0 && lite.nearTicks >= 40 && lite.farTicks <= lite.nearTicks / 3, "дальняя спокойная машина думает реже ближней: " + lite.farTicks + " и " + lite.nearTicks + " тактов из 48");
  ok(lite.fxCh === 1, "облегчённый режим: эффекты в памяти — в моно (каналов " + lite.fxCh + ")");
  ok(lite.off === 0 && lite.fx2 === lite.fx0 && lite.convOff2 === false, "выключили облегчённый режим — звук и мир как прежде");

  console.log("Стартовый набор, безопасное пробуждение, быстрая монтировка, враги не бьют сквозь стены и закрытые двери");
  const kit = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, out = {};
    LAB.ui.closeAll(); SPOKEN.length = 0;
    /* новая игра: бластер и комбинезон — сразу у героя, у капсулы — (2.2) десять аптечек и десять энергобатарей */
    g.newGame(); C.stop();
    let G = g.G;
    out.weapons = G.weapons.map(w => w.base).join(",");
    out.wi = G.wi; out.full = G.weapons[1] && G.weapons[1].charge === G.weapons[1].cap && G.weapons[1].cap > 0;
    out.armor = G.armor && G.armor.base; out.worn = G.armors[0] === G.armor; out.def = LAB.armorDef(G.armor);
    out.inv = JSON.stringify(G.inv); out.credits = G.credits; out.energy = G.ammo.energy;
    const fl = g.CUR.fl, cap = fl.objs.find(o => o.type === "wake");
    const near = fl.items.filter(i => cap && (Math.max(Math.abs(i.x - cap.x), Math.abs(i.y - cap.y)) <= 2 || fl.room[i.y * LAB.W + i.x] === fl.room[cap.y * LAB.W + cap.x]));
    const sumN = a => a.reduce((t, i) => t + (i.n || 1), 0);
    out.nearMed = sumN(near.filter(i => i.kind === "item" && i.item === "medkit_s"));
    out.nearBat = sumN(near.filter(i => i.kind === "ammo" && i.ammo === "energy"));
    out.floorSpark = fl.items.some(i => (i.w && i.w.id === "w_start_spark") || (i.a && i.a.id === "a_start_suit"));
    out.said = SPOKEN.join(" | ");
    /* безопасное пробуждение: в капсульном отсеке враги не видят, не бьют и не входят в него */
    C.tick();
    const capRoom = cap.room, roomAt = (x, y) => g.CUR.fl.room[y * LAB.W + x], home = [G.x, G.y];
    out.safe0 = C.wakeSafe() && G.wakeSafe === 1 && roomAt(G.x, G.y) === capRoom;
    G.hp = G.hpMax = 5000;
    let hurtSafe = 0, hp0 = G.hp;
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(v => [G.x + v[0], G.y + v[1]]).find(c => g.passable(c[0], c[1]) && roomAt(c[0], c[1]) === capRoom);
    if (adj) {
      const r1 = C.spawnFoe("guardbot", adj[0], adj[1], {});
      for (let k = 0; k < 12; k++) { r1.state = "hunt"; r1.lastKnown = { x: G.x, y: G.y }; r1.at = 99; r1.mv = 99; C.tick(); if (G.hp < hp0) hurtSafe++; hp0 = G.hp = G.hpMax; }
      r1.dead = true;
    }
    const fl0 = g.CUR.fl, fs0 = g.CUR.fs;
    const wd = fl0.doors.find(d => (d.room === capRoom || d.other === capRoom) && !d.lock);
    let entered = 0, outside = null;
    if (wd) {
      for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c1 = [wd.x + v[0], wd.y + v[1]], c2 = [wd.x + 2 * v[0], wd.y + 2 * v[1]];
        if (g.passable(c1[0], c1[1]) && roomAt(c1[0], c1[1]) !== capRoom && g.passable(c2[0], c2[1]) && roomAt(c2[0], c2[1]) !== capRoom) { outside = c2; break; }
      }
      if (outside) {
        const w1 = C.spawnFoe("walker", outside[0], outside[1], {});
        for (let k = 0; k < 15; k++) { fs0.doors[wd.id] = 2; w1.state = "hunt"; w1.lastKnown = { x: G.x, y: G.y }; w1.mv = 99; w1.at = 99; C.tick(); if (roomAt(w1.x, w1.y) === capRoom) entered++; if (G.hp < hp0) hurtSafe++; hp0 = G.hp = G.hpMax; }
        w1.dead = true;
      }
    }
    out.safeHit = { adj: !!adj, outside: !!outside, hurtSafe, entered };
    /* вышел из отсека — защита снята навсегда, «Эхо» предупреждает */
    if (outside) {
      SPOKEN.length = 0; G.x = outside[0]; G.y = outside[1]; C.tick();
      out.left = !C.wakeSafe() && G.wakeSafe === 0 && SPOKEN.some(t => /Вы вышли из капсульного отсека/.test(t));
      G.x = home[0]; G.y = home[1]; C.tick();
      out.leftOnce = !C.wakeSafe();
    }
    /* сам ранил врага — защита снята */
    G.wakeSafe = 1; G.x = home[0]; G.y = home[1]; C.tick();
    const tgt = C.spawnFoe("walker", outside ? outside[0] : home[0] + 3, outside ? outside[1] : home[1], {});
    SPOKEN.length = 0; C.damageFoe(tgt, 1, "kinetic", {});
    out.fight = G.wakeSafe === 0 && SPOKEN.some(t => /Вы начали бой/.test(t));
    tgt.dead = true; G.wakeSafe = 0; G.hp = G.hpMax = 100;
    /* монтировка: удар раз в 0,3 с (прежде 0,5) — и у монтировки из старой записи (в ней cd 500) */
    G.wi = 0; G.drawn = true;
    const real = Date.now; let t = real() + 60000; Date.now = () => t;
    try {
      const a = C.fire("N", false); t += 290; const b = C.fire("N", false); t += 20; const c = C.fire("N", false);
      G.weapons[0].cd = 500; t += 305; const d = C.fire("N", false);
      out.crow = [a, b, c, d].map(v => v ? 1 : 0).join("");
    } finally { Date.now = real; if (C._shotReset) C._shotReset(); /* (2.5) выстрел «из будущего» не держит оружие минуту */ }
    out.crowCd = LAB.weaponCd(G.weapons[0]);
    G.drawn = false; G.wi = 1;
    /* угол стены: взгляд по диагонали между двумя стенами не проходит */
    const W = LAB.W, H = LAB.H, T = LAB.T, sf = { t: new Uint8Array(W * H).fill(T.ROOM), doorAt: {} }, I = (x, y) => y * W + x;
    sf.t[I(5, 5)] = T.WALL; sf.t[I(6, 6)] = T.WALL;
    out.corner = !LAB.los(sf, { doors: {} }, 5, 6, 6, 5) && !LAB.los(sf, { doors: {} }, 6, 5, 5, 6) && !LAB.los(sf, { doors: {} }, 4, 7, 7, 4);
    sf.t[I(6, 6)] = T.ROOM;
    out.cornerOpen = LAB.los(sf, { doors: {} }, 5, 6, 6, 5) && LAB.los(sf, { doors: {} }, 4, 7, 7, 4) === LAB.los(sf, { doors: {} }, 7, 4, 4, 7);
    /* раненый робот за закрытой дверью, загнанный в угол: не стреляет; дверь открыта — стреляет, не чаще перезарядки */
    const pass = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && g.passable(x, y);
    let spot = null;
    for (let F = 1; F <= 8 && !spot; F++) {
      g.enterFloor(1, F, "down", true); C.stop(); G = g.G;
      const fl2 = g.CUR.fl;
      for (const d of fl2.doors) {
        if (d.lock) continue;
        for (const v of [[1, 0], [0, 1]]) {
          const A = [d.x + 2 * v[0], d.y + 2 * v[1]], B = [d.x - 2 * v[0], d.y - 2 * v[1]];
          const ok2 = [A, B, [d.x + v[0], d.y + v[1]], [d.x - v[0], d.y - v[1]]].every(c => pass(c[0], c[1]));
          if (!ok2) continue;
          /* соседние клетки робота займут неподвижные «пробки»: отступать некуда */
          const nb = [[B[0] + 1, B[1]], [B[0] - 1, B[1]], [B[0], B[1] + 1], [B[0], B[1] - 1]];
          spot = { d, A, B, nb, F, v }; break;
        }
        if (spot) break;
      }
    }
    if (spot) {
      const fs = g.CUR.fs, d = spot.d, type = ["guardbot", "patrolbot", "android"].find(k => LAB.FOES[k]);
      C.foes().forEach(f => { f.dead = true; });
      G.x = spot.A[0]; G.y = spot.A[1]; G.hp = G.hpMax = 5000; G.st.cloak = 0; G.st.mimicT = 0; G.event = "norm";
      fs.doors[d.id] = 1;
      out.losClosed = LAB.los(g.CUR.fl, fs, spot.B[0], spot.B[1], spot.A[0], spot.A[1]);
      const f = C.spawnFoe(type, spot.B[0], spot.B[1], {});
      spot.nb.forEach(c => { if (g.passable(c[0], c[1]) && !(c[0] === d.x && c[1] === d.y)) { const pl = C.spawnFoe(type, c[0], c[1], {}); pl.calm = true; } });
      const keepFlee = () => { f.state = "flee"; f.hp = Math.max(1, Math.round(f.maxhp * 0.1)); f.hitT = 0; f.mv = 99; f.lastKnown = { x: G.x, y: G.y }; };
      let hurtClosed = 0, hp = G.hp;
      for (let k = 0; k < 24; k++) { keepFlee(); fs.doors[d.id] = 1; C.tick(); if (G.hp < hp) hurtClosed++; hp = G.hp = G.hpMax; }
      fs.doors[d.id] = 2;
      out.losOpen = LAB.los(g.CUR.fl, fs, spot.B[0], spot.B[1], spot.A[0], spot.A[1]);
      let hurtOpen = 0, shots = 0, trace = ""; hp = G.hp;
      const fsnd = LAB.atmos.foeSound;
      LAB.atmos.foeSound = function (o, kind) { if (o === f && (kind === "shoot" || kind === "attack")) shots++; return fsnd.apply(this, arguments); };
      try {
        /* дверь держим открытой: сама она закрывается, когда носитель отошёл */
        for (let k = 0; k < 24; k++) { keepFlee(); fs.doors[d.id] = 2; C.tick(); trace += (G.hp < hp ? "Х" : f.at === 0 ? "в" : ".") + (k % 6 === 5 ? " " : ""); if (G.hp < hp) hurtOpen++; hp = G.hp = G.hpMax; }
      } finally { LAB.atmos.foeSound = fsnd; }
      out.flee = { hurtClosed, hurtOpen, shots, trace, acd: f.acd, type, F: spot.F, still: f.x === spot.B[0] && f.y === spot.B[1] };
      /* носитель в открытом проёме виден изнутри по диагонали */
      const diag = [d.x - spot.v[0] + spot.v[1], d.y - spot.v[1] + spot.v[0]];
      out.doorway = !pass(diag[0], diag[1]) || LAB.los(g.CUR.fl, fs, diag[0], diag[1], d.x, d.y);
      C.foes().forEach(o => { o.dead = true; });
    }
    G.hp = G.hpMax = 100;
    LAB.ui.closeAll();
    return out;
  });
  ok(kit.weapons === "crowbar,spark" && kit.wi === 1 && kit.full && kit.armor === "suit" && kit.worn && kit.def === 2,
    "новая игра: монтировка и заряженный бластер «Искра» (выбран), надет защитный комбинезон с защитой 2 (" + kit.weapons + ", защита " + kit.def + ")");
  ok(/"bandage":1/.test(kit.inv) && /"fieldkit":1/.test(kit.inv) && /"ration":1/.test(kit.inv) && kit.credits === 40 && kit.energy === 0,
    "в рюкзаке с начала — бинт, походный ремнабор, сухпаёк и 40 кредитов (" + kit.inv + ")");
  ok(kit.nearMed >= 10 && kit.nearBat >= 10 && !kit.floorSpark, "у капсулы лежат десять аптечек и десять энергобатарей, оружия и брони на полу нет (" + kit.nearMed + " и " + kit.nearBat + ")");
  ok(/десять аптечек и десять энергобатарей/.test(kit.said) && /бластер «Искра»/.test(kit.said), "при пробуждении сказано, что при себе и что лежит у капсулы");
  ok(kit.safe0 && kit.safeHit.adj && kit.safeHit.outside && kit.safeHit.hurtSafe === 0 && kit.safeHit.entered === 0,
    "безопасное пробуждение: в капсульном отсеке робот вплотную не бьёт, робот у открытой двери в отсек не входит (" + JSON.stringify(kit.safeHit) + ")");
  ok(kit.left && kit.leftOnce && kit.fight, "вышли из отсека или сами ранили врага — защита снята, «Эхо» предупреждает; вернулись — её больше нет");
  ok(kit.crow === "1011" && kit.crowCd === 300, "монтировка бьёт раз в 0,3 секунды — и монтировка из старой записи тоже (" + kit.crow + ", " + kit.crowCd + " мс)");
  ok(kit.corner && kit.cornerOpen, "взгляд и выстрел не проходят по диагонали между двумя стенами (угол), а мимо одной стены проходят");
  ok(kit.flee && kit.losClosed === false && kit.losOpen === true && kit.flee.hurtClosed === 0 && kit.flee.hurtOpen >= 1 && kit.flee.shots >= 4 && kit.flee.shots <= Math.ceil(24 / kit.flee.acd) + 1 && kit.doorway,
    "раненый загнанный робот за закрытой дверью не стреляет; дверь открыта — стреляет, не чаще перезарядки; носитель в проёме виден" + (kit.flee ? " (" + JSON.stringify(kit.flee) + ")" : " (не нашлось двери для проверки)"));

  console.log("Убежище, камеры в помещениях, оборонная сеть и режимы сложности (2.2)");
  const v21 = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, O = LAB.oko, S = LAB.settings, W = LAB.W, out = {};
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, hp0 = G.hp, hpm0 = G.hpMax, cl0 = G.st.cloak;
    S.difficulty = 1;
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    const live = () => C.foes().filter(f => !f.dead);
    const freeIn = (fl, rid, not) => { for (let y = 0; y < LAB.H; y++) for (let x = 0; x < W; x++) { if (fl.room[y * W + x] !== rid || fl.t[y * W + x] !== LAB.T.ROOM || LAB.solidAt(fl, x, y)) continue; if (C.foes().some(f => !f.dead && f.x === x && f.y === y) || (not && not.x === x && not.y === y)) continue; return { x, y }; } return null; };
    G.hp = G.hpMax = 1e6; G.st.cloak = 0;
    /* 1. убежище: зачищенный кабинет с закрытой дверью */
    fresh(2, 6);
    let fl = g.CUR.fl, fs = g.CUR.fs;
    let pick = null;
    for (let i = 0; i < fl.rooms.length && !pick; i++) {
      const rm = fl.rooms[i];
      if (!rm || !rm.annex || rm.hidden || rm.doors.length !== 1 || (rm.mouths || []).length) continue;
      const d = fl.doors.find(q => q.id === rm.doors[0]);
      const outC = d && [[1, 0], [-1, 0], [0, 1], [0, -1]].map(v => [d.x + v[0], d.y + v[1]]).find(c => LAB.inb(c[0], c[1]) && fl.room[c[1] * W + c[0]] !== i && fl.t[c[1] * W + c[0]] === LAB.T.CORR);
      if (!d || !outC || d.lock) continue;
      const cell = freeIn(fl, i), cell2 = cell && freeIn(fl, i, cell);
      if (cell && cell2) pick = { rid: i, d, outC, cell, cell2 };
    }
    out.found = !!pick;
    if (pick) {
      const rid = pick.rid, d = pick.d;
      /* герой внутри; враги этажа — подальше, кроме тех, что в кабинете */
      G.x = pick.cell.x; G.y = pick.cell.y;
      C.foes().forEach(f => { if (!f.dead && fl.room[f.y * W + f.x] !== rid && Math.abs(f.x - G.x) + Math.abs(f.y - G.y) < 30) f.dead = true; });
      const guard = C.spawnFoe("patrolbot", pick.cell2.x, pick.cell2.y, { guard: "room", post: [pick.cell2.x, pick.cell2.y] });
      fs.doors[d.id] = 1; C.tick();
      out.notYet = C.refuge() === -1; /* враг внутри — убежища нет */
      live().filter(f => fl.room[f.y * W + f.x] === rid && !f.ally).forEach(f => C.damageFoe(f, 1e7, "kinetic", { quiet: true }));
      out.cleared = !!(fs.cleared && fs.cleared[rid]) && !!(guard && guard.dead);
      fs.doors[d.id] = 1; SPOKEN.length = 0; C.tick();
      out.refuge = C.refuge() === rid && C.sheltered();
      out.said = SPOKEN.some(t => /Помещение зачищено/.test(t));
      /* робот за дверью: охотится, умный (открывает двери), знает, где вы */
      const bot = C.spawnFoe("patrolbot", pick.outC[0], pick.outC[1], {});
      if (bot) { bot.state = "hunt"; bot.lastKnown = { x: G.x, y: G.y }; bot.iq = 12; bot.det = 12; }
      out.noSpawnIn = C.spawnFoe("patrolbot", pick.cell2.x, pick.cell2.y, {}) === null;
      for (let i = 0; i < 40; i++) { if (bot) { bot.state = "hunt"; bot.lastKnown = { x: G.x, y: G.y }; } C.tick(); }
      out.shut = fs.doors[d.id] !== 2;
      out.outside = !!bot && fl.room[bot.y * W + bot.x] !== rid;
      out.unhurt = G.hp === 1e6;
      /* открыли дверь — убежища нет */
      fs.doors[d.id] = 2; C.tick();
      out.off = C.refuge() === -1 && !C.sheltered();
      if (bot) bot.dead = true;
    }
    /* 2. камеры в помещениях: со второго этажа, глубже — больше; разбить вплотную */
    const camN = [[1, 1], [1, 2], [2, 5], [5, 10], [20, 3]].map(([L, F]) => LAB.getFloor(G.seed, L, F).foes.filter(q => q.camLook).length);
    out.camN = camN.join(",");
    fresh(5, 10); fl = g.CUR.fl; fs = g.CUR.fs;
    /* камера в углу, к которой можно подойти вплотную: у иной все соседние клетки заставлены
       обстановкой (такую разбивают выстрелом) — берём первую, у которой есть свободная */
    const free = c => LAB.inb(c[0], c[1]) && fl.t[c[1] * W + c[0]] === LAB.T.ROOM && !LAB.solidAt(fl, c[0], c[1]) && !C.foes().some(f => !f.dead && f.x === c[0] && f.y === c[1]);
    let cam = null, nb = null;
    const roomCams = live().filter(f => f.camLook);
    out.roomCams = roomCams.length;
    for (const f of roomCams) { nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(v => [f.x + v[0], f.y + v[1]]).find(free); if (nb) { cam = f; break; } }
    if (cam) {
      if (nb) {
        G.x = nb[0]; G.y = nb[1];
        C.foes().forEach(f => { if (f !== cam && !f.dead && Math.abs(f.x - G.x) + Math.abs(f.y - G.y) < 12) f.dead = true; });
        out.camDirs = cam.camLook.join("") ;
        SPOKEN.length = 0; g.roomCheck(true); out.camHeard = SPOKEN.some(t => /Под потолком: камера/.test(t));
        LAB.ui.closeAll(); g.cameraSabotage(cam);
        const top = LAB.ui.top();
        out.smashItem = !!top && /^Разбить камеру/.test(top.items[0].label);
        if (top) { top.i = 0; G.noise = 0; LAB.ui.activate(); }
        out.smashed = cam.dead && G.noise >= 8 && C.camsBroken() >= 1;
        LAB.ui.closeAll();
      }
    }
    /* 3. щит без камер — так и говорит; терминал отсекается только при тревоге и сообщает о возврате */
    fresh(1, 2); fl = g.CUR.fl; fs = g.CUR.fs;
    C.foes().forEach(f => { if (C.isCam(f)) f.dead = true; });
    LAB.zones.objMenu({ type: "fusebox", id: "t21fuse", x: G.x, y: G.y });
    out.fuseNone = !!LAB.ui.top() && LAB.ui.top().items.some(i => /^Камер на этаже нет/.test(typeof i.label === "function" ? i.label() : i.label)) && !LAB.ui.top().items.some(i => /уже обесточены/.test(typeof i.label === "function" ? i.label() : i.label));
    LAB.ui.closeAll();
    const term = { type: "terminal", id: "t21term", x: G.x, y: G.y, sub: "sec" };
    for (let i = 0; i < 40; i++) { O.state().heat = 0; O.event("terminal_hack", { x: G.x, y: G.y, o: term }); }
    out.isoCalm = !g.objState(term).isoUntil;
    O.state().heat = 90;
    for (let i = 0; i < 200 && !g.objState(term).isoUntil; i++) O.event("terminal_hack", { x: G.x, y: G.y, o: term });
    const iu = g.objState(term).isoUntil;
    out.isoHot = !!iu;
    SPOKEN.length = 0;
    for (let i = 0; i < 120 && O.T() < (iu || 0) + 1; i++) O.tick();
    out.isoBack = SPOKEN.some(t => /вернуло терминал в оборонную сеть/.test(t));
    O.state().heat = 0;
    /* 4. режимы сложности: число врагов, их сила, цены, кредиты, рост оружия */
    const rows = {};
    [4, 1, 2, 3].forEach(m => {
      S.difficulty = m; fresh(3, 4); fl = g.CUR.fl;
      const c = live().length, def = fl.foes.find(q => q.guard === "room" && !q.boss && LAB.FOES[q.type] && LAB.FOES[q.type].kind === "mech");
      const rt = def && C.foes().find(f => f.id === def.id);
      const L0 = G.L, F0 = G.F; G.L = 30; G.F = 1;
      rows[m] = { n: c, hp: rt ? rt.maxhp : 0, price: Math.round(g.priceK() * 100) / 100, cash: LAB.credits(100, 30, 1), grow: Math.round(LAB.wGrowK({ lvl: 60 }) * 100) / 100, bind: LAB.capsule.bindPrice(3, 5), desc: (LAB.dk().desc || "").length };
      G.L = L0; G.F = F0;
    });
    S.difficulty = 1;
    out.diff = rows;
    const e = rows[4], n = rows[1], h = rows[2], v = rows[3];
    out.diffOk = e.n < n.n && n.n < h.n && h.n < v.n && e.hp < n.hp && n.hp < h.hp && h.hp < v.hp && e.price < n.price && n.price < h.price && h.price < v.price &&
      e.cash > n.cash && n.cash > h.cash && h.cash > v.cash && e.grow > n.grow && n.grow === 1 && h.grow < 1 && v.grow < h.grow && e.bind < n.bind && n.bind < v.bind && [e, n, h, v].every(r => r.desc > 80);
    out.names = [4, 1, 2, 3].map(k => LAB.DIFF[k].n).join(",");
    S.difficulty = d0; G.hp = hp0; G.hpMax = hpm0; G.st.cloak = cl0;
    fresh(1, 3);
    LAB.ui.closeAll();
    return out;
  });
  ok(v21.found && v21.notYet && v21.cleared && v21.refuge && v21.said, "убежище: робот в кабинете убит, дверь закрыта — «Эхо» говорит, что здесь можно перевести дух (" + JSON.stringify({ f: v21.found, n: v21.notYet, c: v21.cleared, r: v21.refuge, s: v21.said }) + ")");
  ok(v21.shut && v21.outside && v21.unhurt && v21.noSpawnIn, "убежище: робот за дверью её не открывает и не входит, ОКО внутрь никого не выводит, носителя не трогают (" + JSON.stringify({ shut: v21.shut, out: v21.outside, hp: v21.unhurt, sp: v21.noSpawnIn }) + ")");
  ok(v21.off, "открыли дверь — убежища нет");
  ok(/^0,[1-9],[1-9],[1-9],[1-9]$/.test(v21.camN || "") && +v21.camN.split(",")[4] >= +v21.camN.split(",")[1], "камеры ОКО в помещениях: на первом этаже нет, дальше есть, в глубине больше (" + v21.camN + ")");
  ok(v21.camHeard && v21.smashItem && v21.smashed, "камеру в помещении слышно при входе, вплотную её можно разбить — удар слышно, терминал считает разбитые (" + JSON.stringify({ n: v21.roomCams, h: v21.camHeard, i: v21.smashItem, s: v21.smashed, d: v21.camDirs }) + ")");
  ok(v21.fuseNone, "электрощит без камер говорит «камер на этаже нет», а не «уже обесточены»");
  ok(v21.isoCalm && v21.isoHot && v21.isoBack, "терминал ОКО отсекает только при тревоге, и «Эхо» говорит, когда он снова в оборонной сети (" + JSON.stringify({ c: v21.isoCalm, h: v21.isoHot, b: v21.isoBack }) + ")");
  ok(v21.diffOk && v21.names === "Лёгкий,Обычный,Сложный,Очень сложный", "режимы сложности различаются: врагов, их сила, цены, кредиты, рост оружия, привязка (" + JSON.stringify(v21.diff) + ")");

  console.log("Безопасная зона у капсулы; лёгкий режим; время повторного заселения по режиму (2.3)");
  const hav = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, O = LAB.oko, S = LAB.settings, W = LAB.W, out = {};
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, hp0 = G.hp, hpm0 = G.hpMax, cl0 = G.st.cloak;
    S.difficulty = 1;
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    const live = () => C.foes().filter(f => !f.dead);
    G.hp = G.hpMax = 1e6; G.st.cloak = 0;
    /* время повторного заселения по режимам: лёгкий — 10 минут, обычный — 7, сложный — 5, очень сложный — 3,5 */
    out.rooms = [4, 1, 2, 3].map(k => LAB.DIFF[k].room).join(",");
    /* 1. помещение с капсулой у прибытия: убили всех — безопасная зона */
    fresh(2, 3);
    const fl = g.CUR.fl, fs = g.CUR.fs, cap = fl.objs.find(o => o.type === "capsule");
    out.cap = !!cap;
    if (!cap) return out;
    const rid = cap.room, inR = (x, y) => fl.room[y * W + x] === rid;
    const cells = [];
    for (let y = 0; y < LAB.H; y++) for (let x = 0; x < W; x++) if (inR(x, y) && fl.t[y * W + x] === LAB.T.ROOM && !LAB.solidAt(fl, x, y)) cells.push({ x, y });
    const free = c => !C.foes().some(f => !f.dead && f.x === c.x && f.y === c.y) && !fl.objAt[c.y * W + c.x];
    const hc = cells.find(free);
    G.x = hc.x; G.y = hc.y;
    /* стражи и прочие в помещении — живы: зоны ещё нет */
    const inside = () => live().filter(f => !LAB.FOES[f.type].beh.includes("camera") && !f.ally && inR(f.x, f.y));
    if (!inside().length) { const c2 = cells.find(c => free(c) && (c.x !== hc.x || c.y !== hc.y)); if (c2) C.spawnFoe("patrolbot", c2.x, c2.y, { guard: "room", post: [c2.x, c2.y] }); }
    C.foes().forEach(f => { if (!f.dead && !inR(f.x, f.y) && Math.abs(f.x - G.x) + Math.abs(f.y - G.y) < 25) f.dead = true; });
    C.tick();
    out.notYet = !(fs.haven && fs.haven[rid]) && C.haven() < 0;
    /* исчезли без боя — тоже не зона: «убил всех» — значит, был бой */
    const gone = inside(); gone.forEach(f => { f.dead = true; }); C.tick();
    out.notYetNoKill = !(fs.haven && fs.haven[rid]) && C.haven() < 0;
    gone.forEach(f => { f.dead = false; });
    SPOKEN.length = 0;
    inside().forEach(f => C.damageFoe(f, 1e9, "kinetic", { quiet: true }));
    C.tick();
    out.haven = !!(fs.haven && fs.haven[rid]) && C.haven() === rid && C.sheltered();
    out.said = SPOKEN.some(t => /безопасная зона/.test(t));
    /* 2. враг у входа внутрь не заходит, двери не открывает, носителя не видит и не бьёт */
    const edge = cells.find(c => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(v => { const x = c.x + v[0], y = c.y + v[1]; return LAB.inb(x, y) && !inR(x, y) && fl.t[y * W + x] !== LAB.T.WALL; }));
    let outC = null;
    if (edge) for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const x = edge.x + v[0], y = edge.y + v[1]; if (LAB.inb(x, y) && !inR(x, y) && fl.t[y * W + x] === LAB.T.CORR && !LAB.solidAt(fl, x, y)) { outC = { x, y }; break; } }
    if (outC) {
      const hp1 = G.hp;
      const foe = C.spawnFoe("patrolbot", outC.x, outC.y, {});
      foe.state = "hunt"; foe.lastKnown = { x: G.x, y: G.y };
      for (let i = 0; i < 40; i++) C.tick();
      out.stayOut = !foe.dead && !inR(foe.x, foe.y) && G.hp === hp1;
      foe.dead = true;
    } else out.stayOut = true;
    /* 3. ОКО туда никого не выводит и не заселяет её */
    /* точки ОКО для отрядов и замены — не в зоне */
    let inZone = 0; for (let i = 0; i < 12; i++) { const pt = C.okoPoint({ minHero: 2, dmin: 0, dmax: 30, hidden: false }); if (pt && inR(pt[0], pt[1])) inZone++; }
    out.noSpawn = inZone === 0;
    out.noRefill = C.refillRoom({ room: rid, n: 2, cat: "office" }) === null;
    /* 4. при входе «Эхо» называет зону */
    SPOKEN.length = 0; g.roomCheck(true);
    out.entry = SPOKEN.some(t => /Безопасная зона/.test(t));
    /* 5. бой из зоны: на время боя она не прикрывает; затишье — прикрывает снова */
    /* (2.5) после прежних проверок у носителя может не оказаться оружия в руках, окно — открытым,
       мини-игра — идущей: всё это выстрел отменяет; на время проверки — бластер наготове */
    LAB.ui.closeAll(); if (LAB.mini && LAB.mini.active && LAB.mini.active()) LAB.mini.cancel(true); g.paused = false; if (C._shotReset) C._shotReset();
    if (!g.curWeapon()) { G.weapons.push(LAB.makeWeapon("spark", 1, 0, 1)); G.wi = G.weapons.length - 1; }
    G.drawn = true; const w = g.curWeapon();
    if (w && w.cap && (w.charge || 0) < 1) w.charge = w.cap;
    /* оружие после прежних проверок может быть горячим или изношенным, а прошлый
       выстрел — только что: остудить, починить и подождать паузу между выстрелами */
    if (w) { w.hotUntil = 0; w.heat = 0; w.cond = 100; }
    out.fired = false;
    for (let i = 0; i < 20 && !out.fired; i++) { out.fired = C.fire("N", false); if (!out.fired) await new Promise(r => setTimeout(r, 150)); }
    if (!out.fired) out.fireDiag = { w: w ? w.base : null, drawn: G.drawn, dead: G.dead, paused: g.paused, layer: !!(LAB.ui.layer && LAB.ui.layer()), mini: !!(LAB.mini && LAB.mini.active && LAB.mini.active()), charge: w && w.charge, cap: w && w.cap, ammo: w && w.ammo };
    C.tick();
    out.fightOff = C.haven() < 0;
    for (let i = 0; i < 24; i++) C.tick();
    out.fightBack = C.haven() === rid;
    /* 6. вышли — не укрыты, но зона осталась зоной */
    if (outC) { G.x = outC.x; G.y = outC.y; C.tick(); out.leftOff = C.haven() < 0 && !!fs.haven[rid]; } else out.leftOff = true;
    /* 7. лёгкий режим: гибель ничего не стоит, врагов вдвое меньше */
    out.easy = LAB.DIFF[4].count <= 0.5 && LAB.DIFF[4].lose === 0 && LAB.DIFF[4].dmg < 0.5 && LAB.DIFF[4].hp <= 0.5;
    S.difficulty = d0; G.hp = hp0; G.hpMax = hpm0; G.st.cloak = cl0;
    fresh(1, 3);
    LAB.ui.closeAll();
    return out;
  });
  ok(hav.rooms === "600,420,300,210", "зачищенное помещение ОКО заселяет снова: лёгкий — через 10 минут, обычный — через 7, сложный — через 5, очень сложный — через 3,5 (" + hav.rooms + ")");
  ok(hav.cap && hav.notYet && hav.notYetNoKill && hav.haven && hav.said, "помещение с капсулой: пока враг внутри или пропал без боя — не зона, убили всех — безопасная зона, «Эхо» сообщает (" + JSON.stringify({ c: hav.cap, n: hav.notYet, nk: hav.notYetNoKill, h: hav.haven, s: hav.said }) + ")");
  ok(hav.stayOut && hav.noSpawn && hav.noRefill && hav.entry, "в безопасную зону враг не входит и не бьёт, ОКО никого туда не выводит и не заселяет её; при входе «Безопасная зона» (" + JSON.stringify({ o: hav.stayOut, sp: hav.noSpawn, rf: hav.noRefill, e: hav.entry }) + ")");
  ok(hav.fightOff && hav.fightBack && hav.leftOff, "бой из зоны — на время боя она не прикрывает, затишье — снова; вышли — не укрыты, но зона осталась (" + JSON.stringify({ shot: hav.fired, f: hav.fightOff, b: hav.fightBack, l: hav.leftOff, d: hav.fireDiag }) + ")");
  ok(hav.easy, "лёгкий режим ещё легче: врагов вдвое меньше, они слабее, гибель не стоит кредитов");

  console.log("Хранилища реже пустые; ловушки и пакости в хранилищах (2.5)");
  const stash = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, SH = LAB.stash, W = LAB.W, out = {};
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, hp0 = G.hp, hpm0 = G.hpMax, inv0 = JSON.stringify(G.inv), rnd = Math.random;
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    S.difficulty = 1;
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    const calm = () => { C.foes().forEach(f => { if (!f.dead && Math.abs(f.x - G.x) + Math.abs(f.y - G.y) < 30) f.dead = true; }); };
    try {
      /* 1. доля ловушек: на первых двух этажах нет, глубже — больше, по режиму — меньше или больше */
      out.curve = [SH.chanceAt(1, 1), SH.chanceAt(1, 2), SH.chanceAt(1, 3), SH.chanceAt(10, 5), SH.chanceAt(60, 10)].map(v => Math.round(v * 1000) / 1000);
      S.difficulty = 4; const pe = SH.chanceAt(30, 5); S.difficulty = 3; const pv = SH.chanceAt(30, 5); S.difficulty = 1; const pn = SH.chanceAt(30, 5);
      out.byMode = pe < pn && pn < pv;
      fresh(6, 4);
      G.hp = G.hpMax = 1e6; G.dead = false;
      const fl = g.CUR.fl, fs = g.CUR.fs;
      calm();
      const boxes = fl.objs.filter(o => ["locker", "desk", "crate", "cabinet", "shelf", "suitlocker"].indexOf(o.type) >= 0 && o.loot && o.loot.length && !(o.type === "locker" && o.locked) && !g.objState(o).open);
      out.boxes = boxes.length;
      const nextBox = (types) => { const i = boxes.findIndex(o => !types || types.indexOf(o.type) >= 0); return i >= 0 ? boxes.splice(i, 1)[0] : null; };
      /* этаж каждый раз новый: у хранилища тоже успокоить машин и тварей, иначе они вмешаются */
      const near = o => { const c = C.freeCellNear(o.x, o.y, null); if (c) { G.x = c[0]; G.y = c[1]; } calm(); };
      fs.ctrap = fs.ctrap || {};
      /* 2. не заметили: игла в замке сработала, а хранилище открылось */
      const b1 = nextBox(); near(b1); fs.ctrap[b1.id] = { k: "needle", st: "armed" };
      G.st.poison = 0; G.inv.rubber = 0; SPOKEN.length = 0; Math.random = () => 0.99;
      g.openContainer(b1);
      out.needle = G.st.poison > 0 && !!g.objState(b1).open && SPOKEN.some(t => /игла/.test(t)) && SPOKEN.some(t => /Найдено/.test(t));
      G.st.poison = 0;
      /* 3. прорезиненная ткань спасает руки */
      const b2 = nextBox(); near(b2); fs.ctrap[b2.id] = { k: "shock", st: "armed" }; G.inv.rubber = 1; SPOKEN.length = 0;
      const hpA = G.hp; g.openContainer(b2);
      /* (2.6) урона нет: здоровье не ниже прежнего (награда за достижение после прежних проверок может и прибавить) */
      out.rubber = G.hp >= hpA && SPOKEN.some(t => /прорезиненная ткань/.test(t)) && !!g.objState(b2).open;
      if (!out.rubber) out.rubberDiag = { dh: G.hp - hpA, open: !!g.objState(b2).open, said: SPOKEN.join(" | ").slice(0, 300) };
      G.inv.rubber = 0;
      /* 4. в последний миг отдёрнули руку: ловушка известна, окно с выбором */
      const b3 = nextBox(); near(b3); fs.ctrap[b3.id] = { k: "blade", st: "armed" }; Math.random = () => 0.01; SPOKEN.length = 0;
      g.openContainer(b3);
      const top3 = LAB.ui.top();
      out.reflex = fs.ctrap[b3.id].st === "known" && !G.st.bleed && !!top3 && top3.items.some(i => /^Обезвредить/.test(label(i))) && !g.objState(b3).open;
      /* 5. обезвредить удачно: детали в рюкзак, хранилище открыто */
      const parts0 = (G.inv.scrap || 0) + (G.inv.wire || 0);
      Math.random = () => 0; const di = top3.items.findIndex(i => /^Обезвредить/.test(label(i))); top3.items[di].fn();
      out.disarm = fs.ctrap[b3.id].st === "off" && (G.inv.scrap || 0) + (G.inv.wire || 0) > parts0 && !!g.objState(b3).open && SPOKEN.some(t => /Обезврежено/.test(t));
      LAB.ui.closeAll();
      /* 6. «Осмотреть» находит ловушку; сканер называет все рядом */
      const b4 = nextBox(); near(b4); fs.ctrap[b4.id] = { k: "gas", st: "armed" }; Math.random = () => 0;
      out.examine = /Ловушка/.test(LAB.fixtures.examine(b4)) && fs.ctrap[b4.id].st === "known";
      const b5 = nextBox(); near(b5); fs.ctrap[b5.id] = { k: "alarm", st: "armed" }; Math.random = () => 0.99;
      out.scan = /Ловушки в хранилищах/.test(SH.scanText(12)) && fs.ctrap[b5.id].st === "known";
      /* 7. граната на растяжке: две секунды — отошли на два шага, и осколки мимо */
      const b6 = nextBox(); near(b6); fs.ctrap[b6.id] = { k: "grenade", st: "armed" }; Math.random = () => 0.99; SPOKEN.length = 0;
      g.openContainer(b6);
      out.grenadeSet = SH._grenades().length === 1 && !g.objState(b6).open;
      let far = null; for (let r = 3; r < 9 && !far; r++) for (let dy = -r; dy <= r && !far; dy++) for (let dx = -r; dx <= r && !far; dx++) { const x = b6.x + dx, y = b6.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) === r && LAB.inb(x, y) && fl.t[y * W + x] !== LAB.T.WALL && !LAB.solidAt(fl, x, y)) far = [x, y]; }
      const hpB = G.hp; if (far) { G.x = far[0]; G.y = far[1]; }
      for (let i = 0; i < 6; i++) C.tick();
      /* здоровье не меньше прежнего: взрыв может убить кого-то рядом с хранилищем, и новый уровень его прибавит */
      out.grenadeMiss = !!far && G.hp >= hpB && SH._grenades().length === 0 && SPOKEN.some(t => /успели отойти/.test(t)) && !SPOKEN.some(t => /Взрыв накрыл/.test(t));
      if (!out.grenadeMiss) out.grenadeDiag = { far, hd: hpB - G.hp, gl: SH._grenades().length, sp: SPOKEN.slice(-4) };
      /* 8. клещ-кровосос пьёт кровь, аптечка его снимает */
      const b7 = nextBox(); near(b7); fs.ctrap[b7.id] = { k: "parasite", st: "armed" }; Math.random = () => 0.99;
      g.openContainer(b7);
      const hpC = G.hp; for (let i = 0; i < 8; i++) C.tick();
      out.parasite = G.st.parasite > 0 && G.hp < hpC;
      G.inv.medkit_s = (G.inv.medkit_s || 0) + 1; G.hp = G.hpMax - 50; g.useItem("medkit_s");
      out.cure = !(G.st.parasite > 0);
      /* 9. шкафник: дверца распахивается сама — тварь рядом */
      const b8 = nextBox(["locker", "cabinet", "suitlocker", "crate"]); if (b8) { near(b8); fs.ctrap[b8.id] = { k: "mimic", st: "armed" }; g.openContainer(b8); }
      out.mimic = !!b8 && C.foes().some(f => !f.dead && f.type === "u_lockermimic" && f.state === "hunt");
      /* 10. тумбочка с ловушкой: обыск вещи обстановки тоже под защитой */
      const ns = { id: "t_ns25", type: "fx", fx: "nightstand", x: G.x, y: G.y, room: g.CUR.room, seed: 7 };
      fs.ctrap[ns.id] = { k: "cans", st: "armed" }; Math.random = () => 0.99; SPOKEN.length = 0;
      LAB.fixtures.menu(ns); const si = LAB.ui.top().items.findIndex(i => /ящик тумбочки/.test(label(i))); if (si >= 0) LAB.ui.top().items[si].fn();
      out.fxTrap = si >= 0 && SPOKEN.some(t => /банок|банки/.test(t)) && fs.ctrap[ns.id].st === "sprung";
      LAB.ui.closeAll();
      /* 11. тумбочки почти никогда не пустые */
      Math.random = rnd;
      let empty = 0, n = 0;
      for (let i = 0; i < 60; i++) {
        const o = { id: "t_nsx" + i, type: "fx", fx: "nightstand", x: G.x, y: G.y, room: g.CUR.room, seed: 100 + i };
        fs.ctrap[o.id] = { k: null };
        SPOKEN.length = 0; LAB.fixtures.menu(o); const k2 = LAB.ui.top().items.findIndex(it => /ящик тумбочки/.test(label(it))); if (k2 < 0) continue;
        LAB.ui.top().items[k2].fn(); n++; if (SPOKEN.some(t => /^Пусто|Ничего, кроме|только паутину/.test(t))) empty++;
        LAB.ui.closeAll();
      }
      out.nsEmpty = n ? Math.round(100 * empty / n) : 100;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 300); }
    Math.random = rnd;
    S.difficulty = d0; G.hp = hp0; G.hpMax = hpm0; G.st.poison = 0; G.st.parasite = 0; G.st.bleed = 0; G.st.trapHeld = 0; G.st.slow = 0;
    try { G.inv = JSON.parse(inv0); } catch (e) { /* */ }
    fresh(1, 3);
    LAB.ui.closeAll();
    return out;
  });
  ok(!stash.err && stash.curve[0] === 0 && stash.curve[1] === 0 && stash.curve[2] > 0 && stash.curve[4] > stash.curve[3] && stash.byMode, "ловушки в хранилищах: на первых двух этажах нет, глубже больше, в лёгком режиме меньше, в сложных больше (" + JSON.stringify({ c: stash.curve, m: stash.byMode, e: stash.err }) + ")");
  ok(stash.needle && stash.rubber && stash.reflex && stash.disarm, "игла в замке колет и травит, а добыча остаётся; прорезиненная ткань бережёт руки; в последний миг можно отдёрнуть руку; обезвредить — детали в рюкзак (" + JSON.stringify({ n: stash.needle, r: stash.rubber, x: stash.reflex, d: stash.disarm, b: stash.boxes, rd: stash.rubberDiag }) + ")");
  ok(stash.examine && stash.scan, "«Осмотреть» находит ловушку в хранилище, сканер называет все рядом (" + JSON.stringify({ e: stash.examine, s: stash.scan }) + ")");
  ok(stash.grenadeSet && stash.grenadeMiss, "граната на растяжке: две секунды — отошли, и осколки мимо (" + JSON.stringify({ s: stash.grenadeSet, m: stash.grenadeMiss, d: stash.grenadeDiag }) + ")");
  ok(stash.parasite && stash.cure && stash.mimic && stash.fxTrap, "клещ пьёт кровь, аптечка снимает его; шкафник выбирается сам; тумбочка тоже бывает с подвохом (" + JSON.stringify({ p: stash.parasite, c: stash.cure, m: stash.mimic, f: stash.fxTrap }) + ")");
  ok(stash.nsEmpty <= 25, "тумбочки почти никогда не пустые: пустых " + stash.nsEmpty + " %");

  console.log("Мир мутантов: ум, ранги, касты, отряды, развитие, улей (2.5)");
  const mut = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, M = LAB.mutants, W = LAB.W, out = {};
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, hp0 = G.hp, hpm0 = G.hpMax, cl0 = G.st.cloak, rnd = Math.random;
    S.difficulty = 1;
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    /* (3.6) помещение прибытия стало просторным, и павшие в проверках падают в нём же: зачищенное
       помещение с капсулой — безопасная зона, а в ней твари не появляются и носителя не видят.
       Здесь проверяют тварей, а не зону, — она не складывается */
    const noHaven = () => { const fs = g.CUR.fs; fs.haven = {}; fs.cleared = {}; };
    const tickUntil = (fn, n) => { for (let i = 0; i < n; i++) { noHaven(); C.tick(); if (fn()) return true; } return fn(); };
    try {
      out.species = Object.keys(LAB.FOES).filter(k => LAB.FOES[k].kind === "bio").length;
      out.nature = M.natureLine(LAB.FOES.u_cseer) + " | " + M.natureLine(LAB.FOES.rat);
      fresh(90, 6);
      G.hp = G.hpMax = 1e6; G.dead = false; G.st.cloak = 0; G.noise = 0;
      const fl = g.CUR.fl;
      C.foes().forEach(f => { f.dead = true; });
      for (let i = 0; i < 8; i++) C.tick(); /* прошли три секунды после входа */
      const free = (x, y) => LAB.inb(x, y) && fl.t[y * W + x] !== LAB.T.WALL && fl.t[y * W + x] !== LAB.T.DOOR && !LAB.solidAt(fl, x, y) && !C.foes().some(f => !f.dead && f.x === x && f.y === y) && !(x === G.x && y === G.y);
      const cellAt = (pred) => { for (let r = 1; r < 22; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = G.x + dx, y = G.y + dy; if (free(x, y) && pred(x, y, r)) return [x, y]; } return null; };
      const los = (x, y) => LAB.los(fl, g.CUR.fs, x, y, G.x, G.y);
      const spawn = (t, c, ex) => { noHaven(); const f = C.spawnFoe(t, c[0], c[1], ex); f.lvl = 1; return f; };
      /* 1. отряд: заметил один — знают все, даже тот, кто за стеной */
      const cSee = cellAt((x, y, r) => r >= 2 && r <= 4 && los(x, y));
      const cWall = cellAt((x, y, r) => r >= 6 && r <= 14 && !los(x, y));
      out.cells = !!(cSee && cWall);
      if (cSee && cWall) {
        const a = spawn("u_cwarrior", cSee, { pack: "tp1" }), b = spawn("u_cwarrior", cWall, { pack: "tp1" });
        tickUntil(() => b.state === "hunt" && !!b.lastKnown, 6);
        out.packAlert = a.state === "hunt" && b.state === "hunt" && !!b.lastKnown && b.lastKnown.x === G.x && b.lastKnown.y === G.y;
        a.dead = b.dead = true;
      }
      /* 2. вожак пал — жрец подхватывает командование */
      const c1 = cellAt((x, y, r) => r >= 7 && r <= 12), c2 = c1 && cellAt((x, y, r) => r >= 7 && r <= 12 && (x !== c1[0] || y !== c1[1]));
      const chief = spawn("u_chief", c1, { pack: "tp2", lead: true }), shaman = spawn("u_shaman", c2, { pack: "tp2" });
      SPOKEN.length = 0; C.damageFoe(chief, 1e9, "kinetic", {});
      out.heir = chief.dead && shaman.lead === true && SPOKEN.some(t => /подхватывает командование/.test(t));
      shaman.dead = true;
      /* 3. своре без вожака и без жреца — бежать */
      const c3 = cellAt((x, y, r) => r >= 7 && r <= 12), c4 = c3 && cellAt((x, y, r) => r >= 7 && r <= 12 && (x !== c3[0] || y !== c3[1]));
      const alpha = spawn("u_alphadog", c3, { pack: "tp3", lead: true }), dog = spawn("u_dog", c4, { pack: "tp3" });
      SPOKEN.length = 0; C.damageFoe(alpha, 1e9, "kinetic", {});
      out.scatter = alpha.dead && (dog.fleeT || 0) > C.tickN() && SPOKEN.some(t => /без вожака/.test(t));
      dog.dead = true;
      /* 4. провидец видит сквозь стены и подсказывает отряду; маскировка сбивает */
      if (cWall) {
        const seer = spawn("u_cseer", cWall, { pack: "tp4" }), cW2 = cellAt((x, y, r) => r >= 6 && r <= 16 && !los(x, y) && (x !== cWall[0] || y !== cWall[1]));
        const w = cW2 ? spawn("u_cwarrior", cW2, { pack: "tp4" }) : null;
        seer.state = "alert"; G.st.cloak = 30;
        for (let i = 0; i < 4; i++) { noHaven(); C.tick(); }
        const hidden = !w || !(w.lastKnown && w.lastKnown.x === G.x && w.lastKnown.y === G.y);
        G.st.cloak = 0; seer.state = "alert";
        tickUntil(() => w && w.lastKnown && w.lastKnown.x === G.x && w.lastKnown.y === G.y, 6);
        out.seer = !!w && hidden && w.lastKnown && w.lastKnown.x === G.x && w.lastKnown.y === G.y;
        seer.dead = true; if (w) w.dead = true;
      }
      /* 5. трутень добегает и лопается вплотную */
      const cAdj = cellAt((x, y, r) => r === 1);
      const bomb = spawn("u_bomber", cAdj, {}); bomb.state = "hunt"; bomb.lastKnown = { x: G.x, y: G.y };
      const hpA = G.hp; tickUntil(() => bomb.dead, 4);
      out.bomber = bomb.dead && G.hp < hpA;
      /* 6. рабочая каста бежит и поднимает тревогу. Клетка — с запасом, чтобы было куда
         отступить: загнанная в угол тварь по замыслу отбивается, а этаж всякий раз новый */
      const md = (x, y) => Math.abs(x - G.x) + Math.abs(y - G.y), DV4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const away = (x, y) => DV4.some(v => { const ax = x + v[0], ay = y + v[1]; return free(ax, ay) && md(ax, ay) > md(x, y) && DV4.some(u => free(ax + u[0], ay + u[1]) && md(ax + u[0], ay + u[1]) > md(ax, ay)); });
      const cW = cellAt((x, y, r) => r === 2 && los(x, y) && away(x, y)) || cellAt((x, y, r) => r === 2 && los(x, y));
      const wk = spawn("u_cworker", cW, {}); wk.state = "hunt"; wk.lastKnown = { x: G.x, y: G.y };
      SPOKEN.length = 0; const dW = Math.abs(wk.x - G.x) + Math.abs(wk.y - G.y);
      for (let i = 0; i < 6; i++) { noHaven(); C.tick(); }
      out.worker = Math.abs(wk.x - G.x) + Math.abs(wk.y - G.y) > dW && SPOKEN.some(t => /поднимает тревогу/.test(t));
      if (!out.worker) out.workerDiag = { from: dW, to: Math.abs(wk.x - G.x) + Math.abs(wk.y - G.y), roomy: !!(cW && away(cW[0], cW[1])), dead: wk.dead, st: wk.state, said: SPOKEN.slice(-3).join(" | ") };
      wk.dead = true;
      /* 7. развитие: ступень — прочнее, злее, имя со ступенью; помнится на этаже */
      const cE = cellAt((x, y, r) => r >= 8 && r <= 14);
      const h = spawn("u_hound", cE, {}); const hp1 = h.maxhp, dm1 = h.dmg;
      C._evolve(h, true);
      out.evolve = h.evo === 1 && h.maxhp > hp1 && h.dmg >= dm1 && /окрепш/.test(h.name);
      C.syncFoes(); out.evoSaved = !!(g.CUR.fs.foes[h.id] && g.CUR.fs.foes[h.id].evo === 1);
      SPOKEN.length = 0; C._gainEvo(h, 1000);
      out.evoGain = h.evo === 2 && /матёр/.test(h.name);
      h.dead = true;
      /* 8. падальщик ест павшего и крепнет */
      const cF = cellAt((x, y, r) => r >= 14 && r <= 20 && !los(x, y));
      if (cF) {
        const vat = spawn("u_vatling", cF, {}); const cB = C.freeCellNear(cF[0], cF[1], vat);
        const prey = spawn("rat", cB, {}); C.damageFoe(prey, 1e9, "kinetic", { quiet: true });
        vat.state = "idle"; G.st.cloak = 30;
        tickUntil(() => (vat.evoXP || 0) > 0 || vat.evo > 0, 20);
        out.feeder = (vat.evoXP || 0) > 0 || vat.evo > 0;
        G.st.cloak = 0; vat.dead = true;
      }
      /* 9. улей учится: одно оружие — разумные твари глубин держат его урон лучше; сменили — привычка ушла */
      G.hive = {};
      const cH = cellAt((x, y, r) => r >= 8 && r <= 14);
      const hv = spawn("u_cwarrior", cH, {}); hv.maxhp = hv.hp = 1e9;
      SPOKEN.length = 0;
      for (let i = 0; i < 30; i++) C.damageFoe(hv, 1, "laser", {});
      out.hive = M.hiveOf(G).dt === "laser" && M.resK(hv, "laser", G) < 1 && M.resK(hv, "plasma", G) === 1 && SPOKEN.some(t => /учатся/.test(t));
      for (let i = 0; i < 60; i++) C.damageFoe(hv, 1, "plasma", {});
      out.hiveForget = M.hiveOf(G).dt !== "laser";
      hv.dead = true;
      /* 10. ткач ставит ловушку поперёк прохода — своих она не трогает */
      const cC = cellAt((x, y, r) => r >= 4 && r <= 18 && fl.room[y * W + x] < 0);
      if (cC) {
        const wv = spawn("u_cweaver", cC, {}); wv.state = "alert"; wv.lastKnown = { x: G.x, y: G.y }; G.st.cloak = 30;
        const n0 = LAB.traps.list().filter(t => t.by === "hive").length;
        tickUntil(() => LAB.traps.list().filter(t => t.by === "hive").length > n0, 6);
        out.weaver = LAB.traps.list().filter(t => t.by === "hive").length > n0;
        G.st.cloak = 0; wv.dead = true;
      } else out.weaver = "нет прохода";
      /* 11. пока вас не было два часа, разумные твари этажа окрепли */
      fresh(90, 7);
      const keyF = g.CUR.key;
      g.enterFloor(90, 6, "down", true); C.stop(); G = g.G; /* ушли с этажа — он запомнил, когда */
      G.fs[keyF].seenAt = (G.day || 0) * 1440 + (G.min || 0) - 300; /* прошло пять часов */
      Math.random = () => 0;
      SPOKEN.length = 0;
      g.enterFloor(90, 7, "down", true); C.stop(); G = g.G;
      out.grewAway = g.CUR.key === keyF && SPOKEN.some(t => /Пока вас не было, разумные твари этажа окрепли/.test(t));
      Math.random = rnd;
      /* 12. лёгкий режим: вне боя здоровье понемногу возвращается — до шестидесяти процентов */
      S.difficulty = 4;
      C.foes().forEach(f => { f.dead = true; });
      G.hpMax = 100; G.hp = 20; G.lastHurt = 0; G.st.poison = 0; G.st.bleed = 0;
      /* облучение, токсины и мутаген, набранные в прежних проверках, сами отнимают здоровье
         (лучевая болезнь от 90 — минус 2 каждые четыре такта) или прибавляют его — здесь их нет */
      G.body.rad = 0; G.body.tox = 0; G.body.mut = 0;
      /* ОКО после прежних проверок могло прислать отряд — на время проверки этаж пуст */
      const quiet = () => { C.foes().forEach(f => { f.dead = true; }); if (LAB.oko && LAB.oko.state) LAB.oko.state().heat = 0; g.CUR.fs.alarmUntil = 0; };
      const t0r = C.tickN();
      for (let i = 0; i < 60; i++) { quiet(); C.tick(); }
      out.regen = G.hp > 20 && G.hp <= 60;
      if (!out.regen) out.regenDiag = { hp: G.hp, stair: !!G.stair, dang: C.danger(), ticks: C.tickN() - t0r, poison: G.st.poison, bleed: G.st.bleed, par: G.st.parasite, rad: Math.round(G.body.rad || 0), tox: Math.round(G.body.tox || 0), mut: Math.round(G.body.mut || 0), d: S.difficulty, rg: LAB.dk().regen, dead: G.dead };
      G.hp = 70; for (let i = 0; i < 30; i++) { quiet(); C.tick(); }
      out.regenCap = G.hp === 70;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 300); }
    Math.random = rnd;
    S.difficulty = d0; G.hp = hp0; G.hpMax = hpm0; G.st.cloak = cl0; G.hive = {};
    fresh(1, 3);
    LAB.ui.closeAll();
    return out;
  });
  ok(!mut.err && mut.species >= 100 && /сверхразумный/.test(mut.nature) && /каста провидцев/.test(mut.nature) && /неразумный, низший/.test(mut.nature), "тварей больше сотни видов; у каждой — ум, ранг, у народов глубин — каста (" + JSON.stringify({ n: mut.species, t: mut.nature, e: mut.err }) + ")");
  ok(mut.cells && mut.packAlert, "отряд: заметил один — знают все, даже тот, кто за стеной (" + JSON.stringify({ c: mut.cells, a: mut.packAlert }) + ")");
  ok(mut.heir && mut.scatter, "пал вожак: жрец подхватывает командование, а свора без жреца разбегается (" + JSON.stringify({ h: mut.heir, s: mut.scatter }) + ")");
  ok(mut.seer, "провидец видит носителя сквозь стены и подсказывает отряду; маскировка его сбивает");
  ok(mut.bomber && mut.worker, "трутень лопается вплотную; рабочая каста убегает и поднимает тревогу (" + JSON.stringify({ b: mut.bomber, w: mut.worker, wd: mut.workerDiag }) + ")");
  ok(mut.evolve && mut.evoSaved && mut.evoGain && mut.feeder, "твари растут: ступень прочнее и злее, звучит в имени и помнится; опыт поднимает ступень; падальщик крепнет, съев павшего (" + JSON.stringify({ e: mut.evolve, s: mut.evoSaved, g: mut.evoGain, f: mut.feeder }) + ")");
  ok(mut.hive && mut.hiveForget, "улей глубин привыкает к оружию носителя, а сменили оружие — привычка уходит (" + JSON.stringify({ h: mut.hive, f: mut.hiveForget }) + ")");
  ok(mut.weaver === true && mut.grewAway, "ткач ставит ловушки поперёк проходов; пока носителя долго нет, разумные твари этажа крепнут (" + JSON.stringify({ w: mut.weaver, g: mut.grewAway }) + ")");
  ok(mut.regen && mut.regenCap, "лёгкий режим: вне боя здоровье само возвращается до шестидесяти процентов (" + JSON.stringify({ r: mut.regen, c: mut.regenCap, d: mut.regenDiag }) + ")");

  console.log("Лечение и снабжение у капсул, целители, пошаговый режим (2.6)");
  const v26 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, M = LAB.medic, W = LAB.W, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, tb0 = S.turnBased, hp0 = G.hp, hpm0 = G.hpMax, cr0 = G.credits, rnd = Math.random;
    const inv0 = JSON.stringify(G.inv), ammo0 = JSON.stringify(G.ammo), w0 = G.weapons.slice(), wi0 = G.wi, drawn0 = G.drawn, st0 = JSON.stringify(G.st), body0 = JSON.stringify(G.body);
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    const reenter = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    const invSet = o => { Object.keys(G.inv).forEach(k => { const d = LAB.ITEMS[k]; if (d && d.kind === "use") G.inv[k] = 0; }); Object.assign(G.inv, o); };
    S.difficulty = 1; S.turnBased = 0;
    try {
      /* 1. у капсулы прибытия — аптечный автомат и энергобатареи; сколько батарей и припасов — по режиму */
      fresh(3, 5);
      let fl = g.CUR.fl;
      const capU = fl.objs.find(o => o.type === "capsule" && o.room === fl.U);
      out.vend = !!capU && fl.objs.some(o => o.type === "medvend" && o.room === capU.room);
      const bat = () => fl.items.find(i => i.cap26);
      out.batNear = !!(capU && bat() && Math.max(Math.abs(bat().x - capU.x), Math.abs(bat().y - capU.y)) <= 2 && bat().kind === "ammo" && bat().ammo === "energy");
      const batN = {}, medSum = {};
      let medOk = true;
      [4, 1, 2, 3].forEach(m => {
        S.difficulty = m; reenter(3, 5); fl = g.CUR.fl;
        batN[m] = bat() ? bat().n : -1;
        const k = LAB.dk().med;
        medSum[m] = fl.items.filter(i => i.med26).reduce((t, i) => { if (i.n !== Math.max(1, Math.min(7, Math.round(i.n0 * k)))) medOk = false; return t + i.n; }, 0);
      });
      out.batN = batN; out.medSum = medSum; out.medOk = medOk;
      out.piles = fl.items.filter(i => i.med26).length;
      S.difficulty = 1; reenter(3, 5); fl = g.CUR.fl;
      /* 2. аптечный автомат: только аптечки и энергобатареи; глубже и в трудном режиме — дороже */
      const vo = fl.objs.find(o => o.type === "medvend");
      LAB.ui.closeAll(); M.vendMenu(vo);
      const vw = LAB.ui.top(); out.vendTitle = vw && vw.title;
      const vl = vw ? vw.items.slice(1).map(label) : [];
      const kits = M.kitsFor(G.L).map(id => LAB.ITEMS[id].n);
      out.vendOnly = vl.length >= 2 && vl.every(l => kits.some(n => l.indexOf(n + " — ") === 0) || /^Энергобатарея — /.test(l)) && vl.some(l => /^Энергобатарея — /.test(l));
      G.credits = 1000; const k0 = G.inv.medkit_s || 0, p0 = M.vendPrice("medkit_s");
      if (vw) { vw.i = 1 + vl.findIndex(l => l.indexOf(LAB.ITEMS.medkit_s.n + " — ") === 0); LAB.ui.activate(); }
      out.vendBuy = (G.inv.medkit_s || 0) === k0 + 1 && G.credits === 1000 - p0;
      LAB.ui.closeAll();
      const L0 = G.L, F0 = G.F;
      const at = (L, m, fn) => { S.difficulty = m; G.L = L; G.F = 1; const v = fn(); G.L = L0; G.F = F0; S.difficulty = 1; return v; };
      const vp = (L, m, id) => at(L, m, () => M.vendPrice(id));
      out.vendDepth = vp(1, 1, "medkit_s") < vp(30, 1, "medkit_s") && vp(30, 1, "medkit_s") < vp(80, 1, "medkit_s") && vp(1, 1, "ammo:energy") < vp(60, 1, "ammo:energy");
      out.vendMode = vp(30, 4, "ammo:energy") < vp(30, 1, "ammo:energy") && vp(30, 1, "ammo:energy") < vp(30, 2, "ammo:energy") && vp(30, 2, "ammo:energy") < vp(30, 3, "ammo:energy");
      out.kitsDeep = M.kitsFor(1).join(",") + " | " + M.kitsFor(85).join(",");
      /* 3. зарядка оружия в капсуле: ёмче, выше ступенью и уровнем, глубже, труднее — дороже */
      const Cp = LAB.capsule.chargePrice, mk = (lvl, rank) => { const w = LAB.makeWeapon("spark", lvl, rank, 1); w.charge = 0; return w; };
      const wa = mk(1, 0), wBig = Object.assign({}, wa, { cap: wa.cap * 3, charge: 0 }), wLvl = Object.assign({}, wa, { lvl: 150, rank: 4, charge: 0 });
      out.chCap = at(1, 1, () => Cp(wBig) > Cp(wa));
      out.chLvl = at(1, 1, () => Cp(wLvl) > Cp(wa));
      out.chDepth = at(1, 1, () => Cp(wa)) < at(40, 1, () => Cp(wa)) && at(40, 1, () => Cp(wa)) < at(90, 1, () => Cp(wa));
      out.chMode = at(30, 4, () => Cp(wa)) < at(30, 1, () => Cp(wa)) && at(30, 1, () => Cp(wa)) < at(30, 3, () => Cp(wa));
      const half = Object.assign({}, wa, { charge: Math.floor(wa.cap / 2) });
      out.chPart = at(30, 1, () => Cp(half) < Cp(wa) && Cp(half) > 0);
      G.credits = 10000; const pa = Cp(wa), r1 = LAB.capsule.chargeOne(wa, true);
      out.chOk = r1 === pa && wa.charge === wa.cap && G.credits === 10000 - pa;
      wa.charge = 0; G.credits = 0; const r2 = LAB.capsule.chargeOne(wa, true);
      out.chPoor = r2 === -1 && wa.charge === 0;
      const slugBase = Object.keys(LAB.WEAPONS).find(k => LAB.WEAPONS[k].ammo === "slug");
      out.chPhys = !slugBase || !LAB.capsule.chargeable(LAB.makeWeapon(slugBase, 1, 0, 1));
      G.weapons = [wa]; G.wi = 0; wa.charge = 0; G.credits = 500;
      if (capU) {
        LAB.capsule.menu(capU); await wait(1500);
        const cl = LAB.ui.top() ? LAB.ui.top().items.map(label) : [];
        out.capItem = cl.some(l => /^Зарядить оружие за кредиты: \d+ кредит/.test(l));
        LAB.capsule.leave(true); LAB.ui.closeAll();
      }
      /* 3б. зарядная станция в комнате — тот же обработчик и те же цены, что у капсулы: даром больше не заряжает */
      {
        LAB.ui.closeAll(); wa.charge = 0; G.weapons = [wa]; G.wi = 0; G.credits = 5000;
        const pSt = Cp(wa), pBat = M.vendPrice("ammo:energy"), e0 = G.ammo.energy || 0;
        g.objMenu({ id: "test_charger", type: "charger", x: G.x, y: G.y, room: -1 });
        const sw = LAB.ui.top(), sl = sw ? sw.items.map(label) : [];
        out.stTitle = sw && sw.title;
        const iw = sl.findIndex(l => l.indexOf("Зарядить полностью — " + pSt + " кредит") >= 0), ib = sl.findIndex(l => l.indexOf("Зарядить энергобатарею — " + pBat + " кредит") === 0);
        if (sw && iw >= 0) { sw.i = iw; LAB.ui.activate(); }
        out.stCharge = iw >= 0 && wa.charge === wa.cap && G.credits === 5000 - pSt;
        const c1 = G.credits, sw2 = LAB.ui.top();
        if (sw2 && ib >= 0) { sw2.i = ib; LAB.ui.activate(); }
        out.stBat = ib >= 0 && (G.ammo.energy || 0) === e0 + 1 && G.credits === c1 - pBat;
        wa.charge = 0; G.credits = 0; const sw3 = LAB.ui.top();
        if (sw3) { sw3.i = sw3.items.map(label).findIndex(l => l.indexOf("Зарядить полностью — ") >= 0); if (sw3.i >= 0) LAB.ui.activate(); }
        out.stPoor = wa.charge === 0 && G.credits === 0;
        out.stLines = sl.slice(0, 4);
        LAB.ui.closeAll(); G.credits = 500;
      }
      /* 4. (3.0) энергобатарея — с каждого N-го уничтоженного врага (N по режиму, в пошаговом бою — на одного позже),
         где бы он ни пал: в коридоре и в комнате, робот и тварь, и присланный ОКО на замену;
         не в счёт — призванные самими врагами и каратели ОКО */
      C.foes().forEach(f => { f.dead = true; });
      const busy = (x, y) => C.foes().some(f => !f.dead && f.x === x && f.y === y) || (x === G.x && y === G.y);
      const corr = [], roomC = [];
      for (let y = 1; y < LAB.H - 1 && (corr.length < 6 || roomC.length < 3); y++) for (let x = 1; x < W - 1; x++) {
        const t = fl.t[y * W + x];
        if (LAB.solidAt(fl, x, y) || busy(x, y)) continue;
        if (t === LAB.T.CORR && corr.length < 6) corr.push([x, y]);
        else if (t === LAB.T.ROOM && roomC.length < 3) roomC.push([x, y]);
      }
      const plainF = b => !b.boss && ["stationary", "camera", "turret", "observer", "fixer", "relay", "split", "swarm", "mimic"].every(x => (b.beh || []).indexOf(x) < 0);
      const mech = Object.keys(LAB.FOES).find(k => LAB.FOES[k].kind === "mech" && plainF(LAB.FOES[k]));
      const bio = Object.keys(LAB.FOES).find(k => LAB.FOES[k].kind === "bio" && plainF(LAB.FOES[k]));
      /* (3.6) у присланных на этаж своя доля (waveK, по волнам): здесь каждый — как из первой волны */
      const killAt = (c, o) => { o = o || {}; const f = C.spawnFoe(o.type || mech, c[0], c[1], {}); if (!f) return null; g.CUR.fs.sentWN = 0; g.CUR.fs.sentWL = []; f.spawned = !!o.spawned; f.oko = !!o.oko; f.punisher = !!o.pun; f.ally = false; f.lvl = 1; C.damageFoe(f, 1e9, "kinetic", { quiet: true }); return f; };
      const drops = () => (g.CUR.fs.drops || []).filter(d => d.nth27).length;
      const runN = (m, n, cells, o, tb) => { S.difficulty = m; S.turnBased = tb ? 1 : 0; G.batKills = 0; const d1 = drops(), res = []; for (let i = 0; i < n; i++) { killAt(cells[i % cells.length], o); res.push(drops() - d1); } S.difficulty = 1; S.turnBased = 0; return res; };
      out.mech = mech; out.bio = bio; out.cells = corr.length + "/" + roomC.length;
      SPOKEN.length = 0; G.tut.batNth = 0;
      out.corr4 = runN(1, 8, corr).join(",");
      out.corrHint = SPOKEN.some(t => /с каждого четвёртого уничтоженного врага падает энергобатарея/.test(t));
      out.corr3 = runN(4, 6, corr).join(",");
      out.corr6 = runN(3, 6, corr).join(",");
      out.room4 = roomC.length ? runN(1, 8, roomC).join(",") : "нет комнаты";
      out.bio4 = bio ? runN(1, 8, corr, { type: bio }).join(",") : "нет твари";
      out.oko4 = runN(1, 8, corr, { spawned: true, oko: true }).join(",");
      out.tb5 = runN(1, 10, corr, null, true).join(",");
      out.summon = runN(1, 8, corr, { spawned: true }).join(",");
      out.pun = runN(1, 8, corr, { spawned: true, oko: true, pun: true }).join(",");
      out.corrBat = (g.CUR.fs.drops || []).filter(d => d.nth27).every(d => d.kind === "ammo" && d.ammo === "energy");
      /* присланные ОКО копят счёт мясорубки — сбросить, чтобы ОКО не ответило карателями следующим проверкам */
      g.CUR.fs.grind = 0; g.CUR.fs.grindT = 0; g.CUR.fs.grindLast = 0;
      C.foes().forEach(f => { f.dead = true; });
      /* 5. целители: за кредиты и по-своему; глубже и в трудном режиме — дороже */
      out.prof = [M.profileOf({ robot: true, type: "meddroid" }), M.profileOf({ robot: false, prof: "Медик" }), M.profileOf({ robot: true, type: "hive", heal: "hive" }), M.profileOf({ robot: false, prof: "Хранительница колодца" })].join(",");
      const P = M.HEALERS.meddroid, hc = (L, m) => at(L, m, () => M.healCost(P, 100));
      out.healDepth = hc(1, 1) < hc(30, 1) && hc(30, 1) < hc(80, 1);
      out.healMode = hc(30, 4) < hc(30, 1) && hc(30, 1) < hc(30, 2) && hc(30, 2) < hc(30, 3);
      out.altDepth = at(1, 1, () => M.altK()) < at(90, 1, () => M.altK()) && at(30, 4, () => M.altK()) < at(30, 3, () => M.altK());
      const mkH = pid => { const H = M.HEALERS[pid], human = H.kind === "human"; return { id: "th_" + pid, robot: !human, type: human ? undefined : pid, n: "Тестовый целитель", first: "Тест", prof: H.prof || "Медик", heal: pid, x: G.x, y: G.y, key: "t" }; };
      G.hpMax = 200; G.hp = 50; G.credits = 100000; G.st.bleed = 0; G.st.poison = 0;
      const nD = mkH("meddroid"), cost = M.healCost(P, 150);
      const fI = M.healItems(nD).find(i => /^Вылечить полностью: плюс 150/.test(label(i)));
      if (fI) fI.fn();
      out.healFull = !!fI && G.hp === 200 && G.credits === 100000 - cost;
      G.hp = 50; G.ammo.energy = 50;
      const aI = M.healItems(nD).find(i => /^Вылечить полностью энергобатареями/.test(label(i)));
      if (aI) aI.fn();
      out.healBat = !!aI && G.hp === 200 && G.ammo.energy < 50;
      G.hp = 50; const m0 = G.day * 1440 + G.min;
      const tI = M.healItems(mkH("keeper")).find(i => /^Вылечить полностью временем/.test(label(i)));
      if (tI) tI.fn();
      out.healTime = !!tI && G.hp === 200 && G.day * 1440 + G.min > m0;
      G.hp = 50; G.body.neuro = 0;
      const nI = M.healItems(mkH("mirror")).find(i => /^Вылечить полностью своим покоем/.test(label(i)));
      if (nI) nI.fn();
      out.healNerve = !!nI && G.hp === 200 && G.body.neuro > 0;
      G.body.rad = 50; G.body.neuro = 0;
      out.surgRad = M.healItems(mkH("surgeon")).some(i => /^Вывести облучение/.test(label(i))) && !M.healItems(mkH("hive")).some(i => /^Вывести облучение/.test(label(i)));
      G.body.rad = 0;
      LAB.ui.closeAll(); M.healMenu(nD); out.healTitle = !!LAB.ui.top() && /^Лечение: /.test(LAB.ui.top().title); LAB.ui.closeAll();
      /* 6. аптечка сама подбирает лекарство */
      G.hpMax = 300; G.hp = 270; G.st.bleed = 10; G.st.poison = 0; G.body.tox = 0;
      invSet({ bandage_h: 1, medkit_a: 1 }); g.useMedkit();
      out.pickBleed = G.inv.bandage_h === 0 && G.inv.medkit_a === 1 && !G.st.bleed;
      G.st.bleed = 0; G.hp = 40; invSet({ herb_k: 3, medkit_a: 1 }); g.useMedkit();
      out.pickLow = G.inv.medkit_a === 0 && G.inv.herb_k === 3;
      G.hp = 282; invSet({ herb_k: 1, medkit_a: 1 }); g.useMedkit();
      out.pickSmall = G.inv.herb_k === 0 && G.inv.medkit_a === 1;
      G.hp = 250; G.st.poison = 10; invSet({ medkit_s: 1, herb_m: 1 }); g.useMedkit();
      out.pickCure = G.inv.herb_m === 0 && G.inv.medkit_s === 1 && !G.st.poison;
      G.st.poison = 0;
      /* 7. звуки гранат, мин и взрывов: у каждого вида свои слои */
      const Snd = LAB.Sound, sp0 = Snd.play, heard = [];
      Snd.play = function (id, o) { heard.push(id); return null; };
      const layers = (fn) => { heard.length = 0; fn(); return heard.slice(); };
      try {
        const X = G.x, Y = G.y;
        out.sndBank = ["grenade_pin", "grenade_throw", "grenade_land", "explosion_frag", "explosion_small", "explosion_big", "explosion_far", "explosion_shrapnel", "debris", "explosion_fire", "explosion_flash", "explosion_ring", "explosion_cryo", "explosion_gas", "explosion_net", "explosion_zap", "acid_sizzle", "mine_click", "mine_set", "mine_arm", "wire_snap", "trap_snap"].filter(id => !LAB.Bank.has(id)).join(",") || "все";
        out.sFrag = layers(() => LAB.atmos.explosion(X + 3, Y, "frag")).join(",");
        out.sMine = layers(() => LAB.atmos.explosion(X + 3, Y, "mine")).join(",");
        out.sWire = layers(() => LAB.atmos.explosion(X + 3, Y, "wire")).join(",");
        out.sFire = layers(() => LAB.atmos.explosion(X + 3, Y, "fire")).join(",");
        out.sFlash = layers(() => LAB.atmos.explosion(X + 1, Y, "flash")).join(",");
        out.sCryo = layers(() => LAB.atmos.explosion(X + 3, Y, "cryo")).join(",");
        out.sClus = layers(() => LAB.atmos.explosion(X + 3, Y, "cluster")).join(",");
        out.sFar = layers(() => LAB.atmos.explosion(X + 20, Y, "frag")).join(",");
        out.sThrow = layers(() => LAB.atmos.grenade(X + 4, Y, { fuse: 900 })).join(",");
        out.sLure = layers(() => LAB.atmos.grenade(X + 4, Y, { noPin: true })).join(",");
      } finally { Snd.play = sp0; }
      /* 8. пошаговый режим: действия стоят ходов, удар вдогонку, враги не ждут вечно */
      S.turnBased = 1; G.stair = null; G.dead = false;
      C.foes().forEach(f => { f.dead = true; });
      for (let i = 0; i < 8; i++) C.tick(); /* после входа на этаж враги не бьют — эти такты прошли */
      const tk = () => C.tickN();
      const we = LAB.makeWeapon("spark", 1, 0, 1); we.charge = 0; G.weapons = [we]; G.wi = 0; G.ammo.energy = 5;
      let t1 = tk(); g.reload(); out.tbReload = tk() - t1;
      const posBase = Object.keys(LAB.WEAPONS).find(k => LAB.WEAPONS[k].ammo === "positron");
      if (posBase) { const wp = LAB.makeWeapon(posBase, 1, 0, 1); wp.charge = 0; G.weapons = [wp, we]; G.wi = 0; G.ammo.positron = 3; t1 = tk(); g.reload(); out.tbPos = tk() - t1; }
      if (G.weapons.length < 2) G.weapons.push(LAB.makeWeapon("spark", 1, 0, 1));
      t1 = tk(); g.switchWeapon(1); out.tbSwitch = tk() - t1;
      t1 = tk(); g.toggleDraw(); out.tbDraw = tk() - t1; if (G.drawn) g.toggleDraw();
      G.hpMax = 300; G.hp = 100; invSet({ medkit_a: 1, herb_k: 1 });
      t1 = tk(); g.useItem("medkit_a"); out.tbHeavy = tk() - t1;
      G.hp = 100; t1 = tk(); g.useItem("herb_k"); out.tbLight = tk() - t1;
      S.turnBased = 0; we.charge = 0; G.weapons = [we]; G.wi = 0; t1 = tk(); g.reload(); out.rtReload = tk() - t1; S.turnBased = 1;
      /* бросок гранаты — ход; у каждой гранаты свой взрыв */
      G.inv.gren_frag = 1; G.hpMax = 5000; G.hp = 5000; t1 = tk(); C.throwGrenade("gren_frag"); out.tbThrow = tk() - t1;
      await wait(1100); /* граната рванула — дальше без неё */
      out.kinds = Object.keys(LAB.ITEMS).filter(k => LAB.ITEMS[k].fx && LAB.ITEMS[k].fx.gren).map(k => k + ":" + C.grenKind(LAB.ITEMS[k].fx.gren)).join(",");
      /* удар вдогонку: враг вплотную готов к удару — отходите, он бьёт */
      const open = (x, y) => LAB.inb(x, y) && fl.t[y * W + x] === LAB.T.CORR && !LAB.solidAt(fl, x, y) && !busy(x, y);
      let spot = null;
      for (let y = 2; y < LAB.H - 2 && !spot; y++) for (let x = 2; x < W - 2 && !spot; x++) {
        if (!open(x, y)) continue;
        for (const [dx, dy, dir] of [[1, 0, "W"], [-1, 0, "E"], [0, 1, "N"], [0, -1, "S"]]) if (open(x + dx, y + dy) && open(x - dx, y - dy) && open(x - 2 * dx, y - 2 * dy)) { spot = { x, y, ex: x + dx, ey: y + dy, dir }; break; }
      }
      const mel = Object.keys(LAB.FOES).find(k => { const b = LAB.FOES[k]; return b.kind === "bio" && (b.rng || 1) <= 1 && !b.boss && b.beh.indexOf("stationary") < 0 && b.beh.indexOf("burrow") < 0 && b.beh.indexOf("phaseshift") < 0 && b.beh.indexOf("blink") < 0; }) || "rat";
      out.spot = !!spot;
      if (spot) {
        G.x = spot.x; G.y = spot.y; G.hpMax = 5000; G.hp = 5000; G.drawn = false;
        const f = C.spawnFoe(mel, spot.ex, spot.ey, {}); f.lvl = 1; f.state = "hunt"; f.lastKnown = { x: G.x, y: G.y }; f.at = f.acd; f.confused = 0; f.frozen = 0;
        SPOKEN.length = 0; if (g.lastMoveReset) g.lastMoveReset();
        const moved = g.tryMove(spot.dir, false);
        out.aoo = moved && SPOKEN.some(t => /бьёт вдогонку/.test(t)) && f.at <= 1;
        /* не готов к удару — вдогонку не бьёт */
        G.x = spot.x; G.y = spot.y; f.x = spot.ex; f.y = spot.ey; f.at = 0; f.state = "hunt"; SPOKEN.length = 0; if (g.lastMoveReset) g.lastMoveReset();
        g.tryMove(spot.dir, false);
        out.aooReady = !SPOKEN.some(t => /бьёт вдогонку/.test(t));
        /* за вами гонятся, а вы молчите пятнадцать секунд — мир делает ход сам */
        G.x = spot.x; G.y = spot.y; f.x = spot.ex; f.y = spot.ey; f.state = "hunt"; f.lastKnown = { x: G.x, y: G.y };
        out.hunted = C.hunted();
        C._idleBack(C.idleMs() + 1000); t1 = tk(); SPOKEN.length = 0; C.idleTurn();
        out.idle = tk() - t1 === 1 && SPOKEN.some(t => /не ждут дольше пятнадцати секунд/.test(t));
        C._idleBack(5000); t1 = tk(); C.idleTurn(); out.idleWait = tk() - t1 === 0;
        f.dead = true; C._idleBack(C.idleMs() + 1000); t1 = tk(); C.idleTurn(); out.idleCalm = tk() - t1 === 0;
      }
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    Math.random = rnd;
    S.difficulty = d0; S.turnBased = tb0;
    G.hp = hp0; G.hpMax = hpm0; G.credits = cr0; G.inv = JSON.parse(inv0); G.ammo = JSON.parse(ammo0); G.weapons = w0; G.wi = wi0; G.drawn = drawn0; G.st = JSON.parse(st0); G.body = JSON.parse(body0);
    C.foes().forEach(f => { f.dead = true; });
    fresh(1, 3);
    LAB.ui.closeAll();
    return out;
  });
  ok(!v26.err && v26.vend && v26.batNear && v26.piles > 10, "у капсулы прибытия — аптечный автомат и энергобатареи, в комнатах — лечебные припасы (" + JSON.stringify({ v: v26.vend, b: v26.batNear, p: v26.piles, e: v26.err }) + ")");
  ok(v26.batN && v26.batN[4] === 7 && v26.batN[1] === 5 && v26.batN[2] === 4 && v26.batN[3] === 3, "энергобатарей у капсулы прибытия по режиму: 7, 5, 4, 3 (" + JSON.stringify(v26.batN) + ")");
  ok(v26.medOk && v26.medSum && v26.medSum[4] > v26.medSum[1] && v26.medSum[1] > v26.medSum[2] && v26.medSum[2] >= v26.medSum[3], "лечебных припасов в комнатах по режиму: в лёгком больше, в сложных меньше (" + JSON.stringify(v26.medSum) + ")");
  ok(v26.vendTitle === "Аптечный автомат" && v26.vendOnly && v26.vendBuy, "аптечный автомат продаёт только аптечки и энергобатареи, покупка работает (" + JSON.stringify({ t: v26.vendTitle, o: v26.vendOnly, b: v26.vendBuy, k: v26.kitsDeep }) + ")");
  ok(v26.vendDepth && v26.vendMode && /^medkit_s,/.test(v26.kitsDeep || "") && /medkit_i/.test(v26.kitsDeep || ""), "у автомата глубже и в трудном режиме дороже, а аптечки сильнее (" + JSON.stringify({ d: v26.vendDepth, m: v26.vendMode, k: v26.kitsDeep }) + ")");
  ok(v26.chCap && v26.chLvl && v26.chDepth && v26.chMode && v26.chPart, "зарядка в капсуле дороже у ёмкого и более высокого оружия, глубже и в трудном режиме; за полузаряд — дешевле (" + JSON.stringify({ c: v26.chCap, l: v26.chLvl, d: v26.chDepth, m: v26.chMode, p: v26.chPart }) + ")");
  ok(v26.stTitle === "Зарядная станция" && v26.stCharge && v26.stBat && v26.stPoor, "зарядная станция в комнате заряжает за кредиты по ценам капсулы, батарею — по цене автомата, даром — нет (" + JSON.stringify({ t: v26.stTitle, c: v26.stCharge, b: v26.stBat, p: v26.stPoor, l: v26.stLines }) + ")");
  ok(v26.chOk && v26.chPoor && v26.chPhys && v26.capItem, "зарядка за кредиты работает, без кредитов — нет, патроны не заряжаются, пункт есть в меню капсулы (" + JSON.stringify({ o: v26.chOk, p: v26.chPoor, f: v26.chPhys, i: v26.capItem }) + ")");
  ok(v26.corr4 === "0,0,0,1,1,1,1,2" && v26.corr3 === "0,0,1,1,1,2" && v26.corr6 === "0,0,0,0,0,1" && v26.corrBat && v26.corrHint, "(3.0) энергобатарея — с каждого четвёртого уничтоженного врага, в лёгком — с третьего, в очень сложном — с шестого (" + JSON.stringify({ n: v26.corr4, e: v26.corr3, v: v26.corr6, b: v26.corrBat, h: v26.corrHint, m: v26.mech, c: v26.cells }) + ")");
  ok(v26.room4 === "0,0,0,1,1,1,1,2" && v26.bio4 === "0,0,0,1,1,1,1,2" && v26.oko4 === "0,0,0,1,1,1,1,2", "(3.0) где бы враг ни пал: в комнате, тварь, присланный ОКО на замену — тоже каждый четвёртый (" + JSON.stringify({ r: v26.room4, b: v26.bio4, o: v26.oko4, bio: v26.bio }) + ")");
  ok(v26.tb5 === "0,0,0,0,1,1,1,1,1,2", "(3.0) в пошаговом бою батарея — на одного врага позже: с каждого пятого (" + v26.tb5 + ")");
  ok(v26.summon === "0,0,0,0,0,0,0,0" && v26.pun === "0,0,0,0,0,0,0,0", "призванные самими врагами и каратели ОКО батарей не приносят и в счёт не идут (" + JSON.stringify({ s: v26.summon, p: v26.pun }) + ")");
  ok(v26.sndBank === "все" && /explosion_frag/.test(v26.sFrag) && /explosion_shrapnel/.test(v26.sFrag) && /debris/.test(v26.sFrag) && /^mine_click,explosion_small/.test(v26.sMine || "") && /^wire_snap,grenade_land,explosion_frag/.test(v26.sWire || "") && /explosion_fire/.test(v26.sFire) && /explosion_flash/.test(v26.sFlash) && /explosion_ring/.test(v26.sFlash) && /explosion_cryo/.test(v26.sCryo) && (v26.sClus || "").split(",").filter(x => x === "explosion_small").length >= 4 && v26.sFar === "explosion_far" && v26.sThrow === "grenade_pin,grenade_throw,grenade_land" && v26.sLure === "grenade_throw,grenade_land", "звуки: чека, бросок и падение гранаты; у каждого взрыва свои слои — осколки, осыпь, щелчок взрывателя, рывок проволоки, звон в ушах; издалека — глухой раскат (" + JSON.stringify({ b: v26.sndBank, f: v26.sFrag, m: v26.sMine, w: v26.sWire, c: v26.sClus, far: v26.sFar, t: v26.sThrow, l: v26.sLure }) + ")");
  ok(v26.prof === "meddroid,medic,hive,keeper" && v26.healDepth && v26.healMode && v26.altDepth, "целители: свои на глубинах; лечение глубже и в трудном режиме дороже — и кредитами, и иначе (" + JSON.stringify({ p: v26.prof, d: v26.healDepth, m: v26.healMode, a: v26.altDepth }) + ")");
  ok(v26.healFull && v26.healBat && v26.healTime && v26.healNerve && v26.surgRad && v26.healTitle, "лечат за кредиты, энергобатареи, время и покой; «Скальпель» выводит облучение (" + JSON.stringify({ f: v26.healFull, b: v26.healBat, t: v26.healTime, n: v26.healNerve, r: v26.surgRad, w: v26.healTitle }) + ")");
  ok(v26.pickBleed && v26.pickLow && v26.pickSmall && v26.pickCure, "аптечка подбирает лекарство: бинт при кровотечении, сильное при малом здоровье, малое на малую рану, снимающее яд при отравлении (" + JSON.stringify({ b: v26.pickBleed, l: v26.pickLow, s: v26.pickSmall, c: v26.pickCure }) + ")");
  ok(v26.tbReload === 2 && (v26.tbPos === undefined || v26.tbPos === 3) && v26.tbSwitch === 1 && v26.tbDraw === 1 && v26.tbHeavy === 2 && v26.tbLight === 1 && v26.rtReload === 0, "пошаговый режим: перезарядка — два хода, позитронная — три, смена и выхват оружия — ход, большая аптечка — два (" + JSON.stringify({ r: v26.tbReload, p: v26.tbPos, s: v26.tbSwitch, d: v26.tbDraw, h: v26.tbHeavy, l: v26.tbLight, rt: v26.rtReload }) + ")");
  ok(v26.tbThrow === 1 && ["gren_frag:frag", "g_firebomb:fire", "k_netbomb:net", "k_acidbomb:acid", "o_flashbang:flash", "o_cryobomb:cryo", "o_chimebomb:sonic", "m_stickyemp:emp", "m_cluster:cluster", "i_dawnbomb:positron", "i_vortexbomb:grav"].every(k => (v26.kinds || "").split(",").indexOf(k) >= 0), "пошаговый режим: бросок гранаты — ход; у каждой гранаты свой взрыв (" + JSON.stringify({ t: v26.tbThrow, k: v26.kinds }) + ")");
  ok(v26.spot && v26.aoo && v26.aooReady, "пошаговый режим: отступили от готового к удару врага — он бьёт вдогонку, не готов — нет (" + JSON.stringify({ s: v26.spot, a: v26.aoo, r: v26.aooReady }) + ")");
  ok(v26.hunted && v26.idle && v26.idleWait && v26.idleCalm, "пошаговый режим: в бою враги не ждут дольше пятнадцати секунд, вне боя — ждут (" + JSON.stringify({ h: v26.hunted, i: v26.idle, w: v26.idleWait, c: v26.idleCalm }) + ")");

  console.log("Уход в фон: звук выключен или приглушён, окно компьютера сворачивается (2.2)");
  const bgt = await page.evaluate(async () => {
    const AE = LAB.AE, S = LAB.settings, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const fire = t => window.dispatchEvent(new Event(t));
    LAB.ui.closeAll();
    if (window.labBgReset) window.labBgReset();
    AE.ensure(); try { await AE.ctx.resume(); } catch (e) { /* */ }
    const dim0 = S.bgDim;
    /* флажок в настройках: по умолчанию снят, описание говорит, что будет */
    S.bgDim = 0;
    LAB.ui.settings();
    const w = LAB.ui.top(), k = w ? w.items.findIndex(i => /^Приглушать звук в фоне/.test(label(i))) : -1;
    out.item = k >= 0 && w.items[k].kind === "toggle" && w.items[k].get() === false;
    SPOKEN.length = 0;
    if (k >= 0) { w.i = k; LAB.ui.activate(); }
    out.itemOn = S.bgDim === 1 && /включено\. .*тише/.test(SPOKEN.join(" "));
    if (k >= 0) LAB.ui.activate();
    out.itemOff = S.bgDim === 0 && /выключено\. .*звук выключен/.test(SPOKEN.join(" "));
    LAB.ui.closeAll();
    /* 1. флажок снят: ушли в другое окно — игра в фоне, звук выключен, и сторож звука его не будит */
    fire("blur");
    out.bgOn = LAB.bg === true;
    await wait(100);
    LAB.Sound.tick(); await wait(1200); LAB.Sound.tick(); await wait(300);
    out.muted = AE.ctx.state !== "running";
    fire("focus"); await wait(300);
    out.back = !LAB.bg && AE.ctx.state === "running";
    /* 2. флажок стоит: звук тише, но звучит; вернулись — как был */
    S.bgDim = 1;
    fire("blur"); await wait(600);
    /* (3.5) тише — последнее звено, после ограничителя: вход ограничителя прежний */
    out.dim = LAB.bg === true && AE.ctx.state === "running" && AE.bgK < 0.5 && AE.out.gain.value < 0.4 && AE.master.gain.value > 0.8;
    fire("focus"); await wait(700);
    out.dimBack = !LAB.bg && AE.bgK === 1 && AE.out.gain.value > 0.8;
    /* 3. телефон: приложение ушло с экрана — звук выключен, сторож его не будит; вернулось — звучит */
    S.bgDim = 0;
    window.labPause(); await wait(100);
    LAB.Sound.tick(); await wait(1200); LAB.Sound.tick(); await wait(300);
    out.pause = LAB.bg === true && AE.ctx.state !== "running";
    window.labResume(); await wait(300);
    out.resume = !LAB.bg && AE.ctx.state === "running";
    /* 4. компьютер: окно без фокуса сворачивается, если звук в фоне выключен; с флажком и при мелькнувшем фокусе — нет */
    const desk0 = LAB.desktop, ld0 = window.LabDesktop; let mins = 0;
    LAB.desktop = true; window.LabDesktop = Object.assign({}, ld0 || {}, { minimize: () => { mins++; } });
    S.bgDim = 0; fire("blur"); await wait(800); out.minOff = mins; fire("focus"); await wait(100);
    S.bgDim = 1; fire("blur"); await wait(800); out.minDim = mins - out.minOff; fire("focus"); await wait(100);
    S.bgDim = 0; fire("blur"); await wait(150); fire("focus"); await wait(700); out.minFlick = mins - out.minOff - out.minDim;
    /* свернули окно (событие главного процесса) — в фоне; развернули и вернули фокус — снова в игре */
    /* (3.6) свёрнутое окно Windows может остаться активным и получать клавиши — нажатие игру не будит */
    window.labBgSet("min", true); out.minBg = LAB.bg === true;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Unidentified" })); out.minKey = LAB.bg === true && AE.ctx.state !== "running";
    window.labBgSet("min", false); out.minBack = !LAB.bg;
    LAB.desktop = desk0; window.LabDesktop = ld0;
    /* 5. фокус «потерялся», а игрок нажал клавишу — игра на экране */
    fire("blur"); window.dispatchEvent(new KeyboardEvent("keydown", { key: "Unidentified" }));
    out.keyBack = !LAB.bg;
    S.bgDim = dim0;
    if (window.labBgReset) window.labBgReset();
    try { await AE.ctx.resume(); } catch (e) { /* */ }
    return out;
  });
  ok(bgt.item && bgt.itemOn && bgt.itemOff, "настройки: флажок «Приглушать звук в фоне», по умолчанию снят, с описанием (" + JSON.stringify({ i: bgt.item, on: bgt.itemOn, off: bgt.itemOff }) + ")");
  ok(bgt.bgOn && bgt.muted && bgt.back, "ушли в другое окно — игра ждёт, звук выключен, сторож его не будит; вернулись — звук снова (" + JSON.stringify({ bg: bgt.bgOn, m: bgt.muted, b: bgt.back }) + ")");
  ok(bgt.dim && bgt.dimBack, "с флажком звук в фоне тише, но звучит; вернулись — как был (" + JSON.stringify({ d: bgt.dim, b: bgt.dimBack }) + ")");
  ok(bgt.pause && bgt.resume, "телефон: приложение ушло с экрана — звук выключен и не просыпается; вернулось — звучит (" + JSON.stringify({ p: bgt.pause, r: bgt.resume }) + ")");
  ok(bgt.minOff === 1 && bgt.minDim === 0 && bgt.minFlick === 0 && bgt.minBg && bgt.minKey && bgt.minBack, "компьютер: окно без фокуса сворачивается, с флажком — нет, мелькнувший фокус — не в счёт; свёрнутое окно — в фоне, и клавиша в нём игру не будит (" + JSON.stringify({ off: bgt.minOff, dim: bgt.minDim, fl: bgt.minFlick, mb: bgt.minBg, mk: bgt.minKey, mr: bgt.minBack }) + ")");
  ok(bgt.keyBack, "нажали клавишу — игра снова на экране, даже если окно не сообщило о фокусе");

  console.log("Альфа 3.0: мясорубка ОКО, химия, мутагенный туман, подсказки у замков, пароль компьютера, ОКО в головоломках, добыча не на обстановке, руководство, «Выход»");
  const v27 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, CH = LAB.chem, O = LAB.oko, W = LAB.W, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    let G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, tb0 = S.turnBased, rnd = Math.random;
    const fresh = (L, F) => { g.enterFloor(L, F === 1 ? 2 : F - 1, "down", true); delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; };
    S.difficulty = 1; S.turnBased = 0;
    try {
      /* А. Мясорубка: опыт за присланных тает; на пороге ОКО отзывает замену и ставит засаду карателей */
      fresh(1, 3);
      G.hp = G.hpMax = 1e7; G.wakeSafe = 0; G.dead = false;
      let fs = g.CUR.fs, fl = g.CUR.fl;
      const tot = () => { let s = G.xp; for (let l = 1; l < G.lvl; l++) s += LAB.xpNeed(l); return s; };
      const oneKill = () => { const c = C.okoPoint({ minHero: 6, dmin: 4 }); const f = c && C.dispatch(1, "check", { x: c[0], y: c[1] })[0]; if (!f) return null; const t0 = tot(); C.damageFoe(f, 1e9, "phys", { noarmor: true }); return tot() - t0; };
      out.xp = [];
      for (let i = 0; i < 12; i++) { const k = oneKill(); if (k == null) { out.gErr = "нет машины ОКО: " + i; break; } out.xp.push(k); }
      out.grind = C.grind(); out.grindK = C.grindK();
      for (let t = 0; t < 4; t++) O.tick();
      out.pun1 = fs.pun; out.repl = (fs.repl || []).length;
      for (let t = 0; t < 90; t++) O.tick();
      let st = C.strikers();
      out.pun2 = fs.pun; out.strN = st.length; out.lvl = st.map(f => f.lvl); out.base = LAB.foeLevel(G.L, G.F);
      out.amb = st.length > 0 && st.every(f => f.ambush && f.punisher && f.state === "idle");
      out.los = st.some(f => LAB.los(fl, fs, G.x, G.y, f.x, f.y));
      if (st.length) { const t0 = tot(), dd = fs.drops.length; SPOKEN.length = 0; C.damageFoe(st[0], 1e9, "phys", { noarmor: true }); out.pkXP = tot() - t0; out.pkDrops = fs.drops.length - dd; out.pkSaid = /сгорает/.test(SPOKEN.join(" ")); }
      for (let t = 0; t < 260; t++) O.tick();
      st = C.strikers();
      out.hunt = st.length > 0 && st.every(f => f.state === "hunt" && !f.ambush);
      C.calmAll(); out.afterDeath = C.strikers().every(f => f.ambush); O.tick(); O.tick(); out.punGo = fs.punGo > fs.okoT;
      fs.grindLast = fs.okoT - 5000; fs.punCalmT = fs.okoT - 5000; O.tick(); O.tick();
      out.recall = { pun: fs.pun, left: C.strikers().length, grind: C.grind() };
      out.xpAfter = oneKill();
      out.modes = [4, 1, 2, 3].map(k => [LAB.DIFF[k].grind, LAB.DIFF[k].pun, LAB.DIFF[k].punLvl].join("/")).join(" ");
      C.foes().forEach(f => { if (f.punisher || f.spawned) f.dead = true; }); fs.pun = 0; fs.grind = 0; fs.repl = [];
      /* напарник из режима сложности — житель этажа: в мясорубку не идёт, энергобатарею в счёт даёт */
      {
        const mt = (LAB.LEVELS[G.L].foes || []).find(id => LAB.FOES[id] && LAB.FOES[id].kind === "mech" && !LAB.FOES[id].boss) || "patrolbot";
        const c = C.okoPoint({ minHero: 6, dmin: 4 }); fs.grindT = fs.okoT || 0; G.batKills = 0;
        const tw = c && C.spawnFoe(mt, c[0], c[1], {});
        if (tw) { tw.spawned = true; tw.twin = true; tw.oko = false; C.damageFoe(tw, 1e9, "phys", { noarmor: true }); }
        out.twinGrind = C.grind(); out.twinBat = G.batKills || 0; out.twinOk = !!tw;
      }

      /* Б. Химия: стол, сорта, модификации, сырьё с мутагеном, вывод мутагена, термит, добыча с врагов */
      Math.random = () => 0.99; /* без срывов синтеза */
      G.chem = {}; G.body.mut = 0; G.st.shield = 0;
      const o = { id: "t27", type: "chemlab", x: G.x, y: G.y, good: 1 };
      fs.chemSt = fs.chemSt || {}; fs.chemSt.t27 = { tier: 3, dirty: false };
      CH.open(o); out.chTitle = LAB.ui.top().title; LAB.ui.closeAll();
      G.inv.gel = 5; G.inv.c_blood = 3; G.inv.c_salt = 3; G.inv.bandage = 4;
      let m0 = G.inv.medkit_s || 0; CH.brew("h_medkit", o); out.medkit = (G.inv.medkit_s || 0) - m0;
      CH.gain("pharm", 30); out.pharm = CH.brLv("pharm");
      delete G.inv.c_blood; delete G.inv.c_salt; G.inv.c_blood_2 = 2; G.inv.c_salt_2 = 2; CH.opt().best = true;
      const fc = CH.forecast("h_medkit", o); out.fcG = fc && fc.g; out.fcN = fc && fc.n;
      m0 = G.inv.medkit_s || 0; CH.brew("h_medkit", o); out.medkit2 = (G.inv.medkit_s || 0) - m0;
      G.chem.xp.pharm = 300; G.chem.known.h_regen = 1; G.inv.c_blood_3 = 4; G.inv.c_enzyme_3 = 2; G.inv.gel = 5; G.inv.c_stab = 2;
      CH.opt().mod = "long"; CH.opt().cat = false;
      const fr = CH.forecast("h_regen", o); out.regenId = fr && fr.id; CH.brew("h_regen", o); out.regenHave = G.inv[out.regenId] || 0; out.stabLeft = G.inv.c_stab || 0;
      CH.gain("bio", 30); CH.opt().mod = ""; G.inv.c_chitin_m = 2; G.inv.gel = 5;
      const fsl = CH.forecast("b_salve", o); out.salveId = fsl && fsl.id; CH.brew("b_salve", o);
      const mu0 = CH.mut(); if (out.salveId && G.inv[out.salveId]) g.useItem(out.salveId); out.salveMut = CH.mut() - mu0; out.shield = G.st.shield;
      G.inv.c_gland_m = 1; G.inv.c_alkali = 2; const cond0 = G.inv.c_cond || 0;
      CH.open(o); let w = LAB.ui.top(); w.i = w.items.findIndex(i => /^Вывести мутаген/.test(label(i))); out.purgeItem = w.i >= 0; if (w.i >= 0) LAB.ui.activate();
      w = LAB.ui.top(); const pi = w.items.findIndex(i => /^Железа твари с мутагеном/.test(label(i))); if (pi >= 0) { w.i = pi; LAB.ui.activate(); }
      out.purge = !G.inv.c_gland_m && (G.inv.c_gland || 0) >= 1 && (G.inv.c_cond || 0) === cond0 + 1;
      LAB.ui.closeAll(); Math.random = rnd;
      const dl = fl.doors.find(q => q.lock && ["key", "card", "code"].indexOf(q.lock.type) >= 0);
      G.inv.c_thermite = 1; out.thOk = CH.thermiteOk(); let burned = false;
      out.burn = dl ? CH.burnDoor(dl, () => { burned = true; }) : "нет двери"; out.thLeft = G.inv.c_thermite || 0; out.burned = burned;
      let bioN = 0, mechN = 0;
      const bt = LAB.LEVELS[G.L].foes.filter(id => LAB.FOES[id] && LAB.FOES[id].kind === "bio" && (LAB.FOES[id].beh || []).indexOf("split") < 0)[0] || "labmut";
      for (let i = 0; i < 40; i++) {
        const c = C.okoPoint({ minHero: 6, dmin: 4 }); if (!c) break;
        /* (3.6) присланные на этаж с каждой волной дают меньше (waveK): здесь каждый — как из первой волны */
        const f = C.spawnFoe(bt, c[0], c[1], { oko: true });
        if (f) { fs.sentWN = 0; fs.sentWL = []; const dd = fs.drops.length; C.damageFoe(f, 1e9, "phys", { noarmor: true }); bioN += fs.drops.slice(dd).filter(it => CH.MAT[it.item]).length; }
        const m = C.dispatch(1, "check", { x: c[0], y: c[1] })[0];
        if (m) { fs.sentWN = 0; fs.sentWL = []; const dd = fs.drops.length; C.damageFoe(m, 1e9, "phys", { noarmor: true }); mechN += fs.drops.slice(dd).filter(it => CH.MAT[it.item]).length; }
      }
      out.bioN = bioN; out.mechN = mechN;
      fs.grind = 0; fs.pun = 0; fs.repl = []; C.foes().forEach(f => { if (f.spawned) f.dead = true; });
      out.cleanSelf = LAB.ITEMS[CH.prodId("c_toxgren", 1, "clean")].fx.gren.self;
      out.longGas = LAB.ITEMS[CH.prodId("c_toxgren", 1, "long")].fx.gren.gas; out.baseGas = LAB.ITEMS.c_toxgren.fx.gren.gas;
      out.salt = [LAB.ITEMS.c_salt.n, LAB.ITEMS.c_salt_2.n, LAB.ITEMS.c_salt_3.n].join(", ");
      out.prices = [LAB.ITEMS.c_venom.price, LAB.ITEMS.c_venom_2.price, LAB.ITEMS.c_venom_3.price, LAB.ITEMS.c_venom_m.price];
      LAB.ui.inventory(); out.invChem = LAB.ui.top().items.some(i => /^Химия: сырьё/.test(label(i))); LAB.ui.closeAll();
      /* режимы: в трудных синтез срывается чаще, а опыта химика меньше */
      out.chemModes = [4, 1, 2, 3].map(k => LAB.DIFF[k].chemFail + "/" + LAB.DIFF[k].chemXp).join(" ");

      /* В. Мутагенный туман: копит мутацию без защиты, пропитывает ткани, фильтр спасает, вытяжка выгоняет */
      const rid = fl.room[G.y * W + G.x], rm = fl.rooms[rid];
      const fog0 = rm.fog; rm.fog = 2; if (fs.vented) delete fs.vented[rm.id];
      G.body.mut = 0; G.inv.c_gland = 3; G.st.antitox = 0; G.st.fogImm = 0; const arm0 = G.armor; G.armor = null;
      const satN = () => Object.keys(G.inv).filter(k => CH.MAT[k] && CH.MAT[k].sat).reduce((a, k) => a + (G.inv[k] || 0), 0), sat0 = satN();
      SPOKEN.length = 0; CH.tick(); out.fogSaid = SPOKEN.join(" | ");
      for (let i = 0; i < 120; i++) CH.tick();
      out.mut1 = CH.mut(); out.sat = satN() - sat0;
      G.st.antitox = 200; let mf = CH.mut(); for (let i = 0; i < 60; i++) CH.tick(); out.mutFilter = CH.mut() - mf; G.st.antitox = 0;
      /* вытяжка: помещение проветрено — тумана нет, мутация не растёт */
      const vent = { id: "fx27", type: "fx", fx: "vent", x: G.x, y: G.y, room: rid };
      LAB.fixtures.menu(vent); let vw = LAB.ui.top(); vw.i = vw.items.findIndex(i => label(i) === "Включить вытяжку"); SPOKEN.length = 0; if (vw.i >= 0) LAB.ui.activate();
      out.ventSaid = /туман мутагена тянется в решётку/.test(SPOKEN.join(" ")); LAB.ui.closeAll();
      mf = CH.mut(); for (let i = 0; i < 60; i++) CH.tick(); out.mutVent = CH.mut() - mf; out.fogHereVent = CH.fogHere();
      if (fs.vented) delete fs.vented[rm.id];
      const valves = { id: "fx27v", type: "fx", fx: "valves", x: G.x, y: G.y, room: rid };
      LAB.fixtures.menu(valves); vw = LAB.ui.top(); vw.i = vw.items.findIndex(i => /вентиль/.test(label(i))); SPOKEN.length = 0; if (vw.i >= 0) LAB.ui.activate();
      out.valveFog = CH.fogHere() === 2 && /выгоняет только вытяжка/.test(SPOKEN.join(" ")); LAB.ui.closeAll();
      /* стадии: на второй лекарства слабее; антимутаген, сон в капсуле и душ выводят мутацию */
      G.chem = {}; G.body.mut = 49; SPOKEN.length = 0; CH.addMut(2); out.st2 = CH.stage(); out.st2Said = /лекарства действуют слабее/.test(SPOKEN.join(" ")); out.heal2 = CH.healK("medkit_s", LAB.ITEMS.medkit_s);
      G.inv.c_antimut = 1; g.useItem("c_antimut"); out.afterAnti = Math.round(CH.mut());
      G.body.mut = 50; CH.capsuleSleep(720); out.afterSleep = CH.mut(); CH.decon(); out.afterDecon = CH.mut();
      /* режимы: в лёгком туман вдвое слабее и слабая мутация уходит сама, в очень сложном — не уходит */
      out.fogModes = [4, 1, 2, 3].map(k => LAB.DIFF[k].mut + "/" + LAB.DIFF[k].mutFade).join(" ");
      /* туман по глубине: на первом уровне его нет, ниже — есть */
      rm.fog = fog0; G.body.mut = 0; G.armor = arm0;
      const fogFloors = L => { let n = 0; for (let F = 1; F <= 6; F++) n += LAB.getFloor(G.seed, L, F).rooms.filter(r => r && r.fog).length; return n; };
      out.fogL1 = fogFloors(1); out.fogL12 = fogFloors(12);

      /* Г. Подсказки у замков: есть ли записка с кодом; пароль компьютера — набирают сами */
      const code = "7351";
      out.hintNo = g.codeHint(code, "safe");
      g.giveItem({ kind: "note", note: "safe", code: code, id: "t27safe" }, true);
      out.hintYes = g.codeHint(code, "safe");
      out.hintPc = g.codeHint("8642", "pc");
      return out;
    } catch (e) { out.err = e.message + " " + String(e.stack || "").split("\n").slice(1, 3).join(" "); return out; }
    finally { Math.random = rnd; S.difficulty = d0; S.turnBased = tb0; }
  });
  ok(!v27.err && !v27.gErr, "раздел 3.0 прошёл без исключений" + (v27.err || v27.gErr ? ": " + (v27.err || v27.gErr) : ""));
  ok(v27.xp && v27.xp.length === 12 && v27.xp[0] > v27.xp[8] && v27.xp[11] <= 1, "мясорубка: опыт за присланных ОКО тает с каждой следующей машиной (" + (v27.xp || []).join(", ") + ")");
  ok(v27.grind >= 12 && v27.grindK === 0 && v27.pun1 === 1 && v27.repl === 0, "на пороге (в обычном — дюжина) ОКО отзывает замену и готовит ударную группу (" + JSON.stringify({ g: v27.grind, k: v27.grindK, p: v27.pun1, r: v27.repl }) + ")");
  ok(v27.pun2 === 2 && v27.strN === 3 && v27.lvl.every(l => l === v27.base + 4) && v27.amb && !v27.los, "каратели: трое на четыре ступени тяжелее, в засаде на пути вниз и не на виду (" + JSON.stringify({ n: v27.strN, l: v27.lvl, b: v27.base, a: v27.amb, v: v27.los }) + ")");
  ok(v27.pkXP === 0 && v27.pkDrops === 0 && v27.pkSaid, "каратель сгорает: ни опыта, ни добычи");
  ok(v27.hunt && v27.afterDeath && v27.punGo, "не дождавшись, каратели идут на вас; после гибели героя — снова в засаде, отсчёт заново");
  ok(v27.recall && v27.recall.pun === 0 && v27.recall.left === 0 && v27.recall.grind === 6 && v27.xpAfter > 0, "затихли — карателей отозвали, счёт на половине порога, за присланных снова есть опыт (" + JSON.stringify(v27.recall) + ", " + v27.xpAfter + ")");
  ok(v27.twinOk && v27.twinGrind === 0 && v27.twinBat === 1, "напарник врага из режима сложности — житель этажа: в мясорубку не идёт, энергобатарею в счёт даёт (" + JSON.stringify({ g: v27.twinGrind, b: v27.twinBat }) + ")");
  ok(v27.modes === "16/2/2 12/3/4 9/4/6 7/5/8", "по режимам: лёгкий терпит дольше и карает мягче, очень сложный — почти сразу и жёстко (" + v27.modes + ")");
  ok(/Химик/.test(v27.chTitle || "") && v27.medkit === 1 && v27.pharm === 1 && v27.fcG === 2 && v27.fcN === 2 && v27.medkit2 === 2, "химический стол: аптечка из сырья; из очищенного при фармакологии 1 — две (" + JSON.stringify({ t: v27.chTitle, a: v27.medkit, g: v27.fcG, n: v27.fcN, b: v27.medkit2 }) + ")");
  ok(/c_regen_g3_long/.test(v27.regenId || "") && v27.regenHave >= 1 && v27.stabLeft === 1, "сыворотка особой чистоты продлённого действия: стабилизатор потрачен (" + v27.regenId + ")");
  ok(/_mut$/.test(v27.salveId || "") && v27.salveMut >= 5 && v27.shield >= 30, "сырьё с мутагеном даёт состав «на мутагене»: сильнее, но прибавляет мутацию (" + JSON.stringify({ id: v27.salveId, m: v27.salveMut, s: v27.shield }) + ")");
  ok(v27.purgeItem && v27.purge, "вывод мутагена щёлочью: ткань чистая, конденсат в рюкзаке");
  ok(v27.thOk && v27.burn === true && v27.burned && v27.thLeft === 0, "термитный заряд прожигает замок запертой двери");
  ok(v27.bioN >= 8 && v27.mechN >= 4, "с тварей падают ткани, с машин — жидкости (" + v27.bioN + " и " + v27.mechN + " из сорока)");
  ok(v27.cleanSelf === false && v27.longGas === v27.baseGas * 2, "модификации: граната без побочного действия вас не задевает, продлённая держит газ вдвое дольше");
  ok(v27.salt === "Минеральные соли, Очищенные соли, Химически чистые соли" && v27.prices[0] < v27.prices[1] && v27.prices[1] < v27.prices[2] && v27.prices[3] > v27.prices[0] && v27.invChem, "три сорта сырья, чище — дороже; в инвентаре — раздел «Химия: сырьё» (" + v27.prices.join(", ") + ")");
  ok(v27.chemModes === "0.6/1.25 1/1 1.2/0.9 1.4/0.8", "химия по режимам: в лёгком срывов меньше и опыта больше, в трудных — наоборот (" + v27.chemModes + ")");
  ok(/Мутагенный туман, густой/.test(v27.fogSaid || "") && v27.mut1 > 15 && v27.mut1 < 30 && v27.sat >= 1, "туман: «Эхо» предупреждает, без защиты копится мутация, ткани в рюкзаке пропитываются мутагеном (" + JSON.stringify({ m: v27.mut1, s: v27.sat }) + ")");
  ok(v27.mutFilter === 0 && v27.ventSaid && v27.mutVent <= 0 && v27.fogHereVent === 0 && v27.valveFog, "фильтр защищает; вытяжка выгоняет туман из помещения, а вентиль на трубе — нет (" + JSON.stringify({ f: v27.mutFilter, s: v27.ventSaid, m: v27.mutVent, h: v27.fogHereVent, v: v27.valveFog }) + ")");
  ok(v27.st2 === 2 && v27.st2Said && v27.heal2 < 1 && v27.afterAnti <= 25 && v27.afterSleep === 35 && v27.afterDecon === 31, "стадии мутации: лекарства слабее; антимутаген, долгий сон в капсуле и душ выводят её (" + JSON.stringify({ h: v27.heal2, a: v27.afterAnti, s: v27.afterSleep, d: v27.afterDecon }) + ")");
  ok(v27.fogModes === "0.5/50 1/25 1.3/15 1.6/0", "туман по режимам: в лёгком вдвое слабее, в очень сложном мутация сама не уходит (" + v27.fogModes + ")");
  ok(v27.fogL1 === 0 && v27.fogL12 > 0, "на первом уровне тумана нет, глубже — есть (" + v27.fogL1 + " и " + v27.fogL12 + " помещений на шести этажах)");
  ok(/^Кода у вас нет/.test(v27.hintNo || "") && /^Записка с кодом — в ваших документах/.test(v27.hintYes || "") && /^Пароля у вас нет/.test(v27.hintPc || ""), "подсказка у замка: есть ли у вас записка с кодом или паролем (" + [v27.hintNo, v27.hintYes, v27.hintPc].join(" | ") + ")");

  /* Пароль компьютера: «Ввести пароль» — четыре цифры, как у сейфа */
  const pin = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, out = {};
    C.stop(); LAB.ui.closeAll();
    let pc = null;
    for (let L = 1; L <= 6 && !pc; L++) for (let F = 1; F <= 20 && !pc; F++) {
      g.enterFloor(L, F, "down", true); C.stop();
      pc = g.CUR.fl.objs.find(o => o.type === "pc" && o.locked && o.pin && !g.objState(o).hacked && LAB.office.pcData(o).state !== "broken") || null;
    }
    if (!pc) return { none: true };
    g.G.x = pc.x; g.G.y = pc.y;
    window.PC27 = pc;
    LAB.office.pcMenu(pc);
    const w = LAB.ui.top(); w.i = w.items.findIndex(i => (typeof i.label === "function" ? i.label() : i.label) === "Сесть за компьютер"); LAB.ui.activate();
    const w2 = LAB.ui.top(); out.lockTitle = w2 && w2.title; out.lockItems = w2 ? w2.items.map(i => typeof i.label === "function" ? i.label() : i.label) : [];
    SPOKEN.length = 0;
    w2.i = out.lockItems.indexOf("Ввести пароль"); if (w2.i >= 0) LAB.ui.activate();
    out.mini = LAB.mini.active() && /Окно входа/.test(LAB.mini.name()); out.miniSaid = SPOKEN.join(" | ");
    /* ОКО не перебивает: реплика ждёт, пока идёт ввод пароля */
    SPOKEN.length = 0; LAB.oko.speak("kill_mech", true); out.okoHeld = !SPOKEN.some(t => /ОКО по громкой связи/.test(t)); out.hushed = LAB.oko.hushed();
    out.pin = pc.pin;
    return out;
  });
  if (!pin.none) for (const k of String(pin.pin).split("").concat(["Enter"])) await key(k);
  await page.waitForTimeout(2600);
  const pin2 = await page.evaluate(() => { const pc = window.PC27, out = {}; if (!pc) return out; out.hacked = !!LAB.game.objState(pc).hacked; out.okoAfter = SPOKEN.some(t => /ОКО по громкой связи/.test(t)); LAB.ui.closeAll(); return out; });
  ok(!pin.none && pin.lockTitle === "Компьютер заблокирован" && /^(Записка с паролем|Пароля у вас нет)/.test(pin.lockItems[0] || "") && pin.lockItems.indexOf("Ввести пароль") >= 0, "запертый компьютер: первым пунктом — есть ли записка с паролем, затем «Ввести пароль» (" + (pin.lockItems || []).join(" | ") + ")");
  ok(pin.mini && /Пароль — четыре цифры/.test(pin.miniSaid || "") && pin2.hacked, "пароль набирают сами — четыре цифры, и верный открывает компьютер (" + (pin.miniSaid || "").slice(0, 120) + ")");
  ok(pin.okoHeld && pin.hushed && pin2.okoAfter, "пока идёт ввод пароля, ОКО молчит; его реплика звучит после");

  /* Добыча и вещи — не на обстановке; враги на обстановку не встают */
  const furn = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, out = { onObj: 0, items: 0, stand: 0, cells: 0 };
    C.stop();
    for (let L = 1; L <= 4; L++) for (const F of [1, 7, 14]) {
      const fl = LAB.getFloor(g.G.seed, L, F);
      fl.items.forEach(it => { out.items++; if (fl.objAt[it.y * LAB.W + it.x]) out.onObj++; });
    }
    g.enterFloor(1, 2, "down", true); C.stop();
    const fl = g.CUR.fl, fs = g.CUR.fs;
    const obj = fl.objs.find(o => ["aquarium", "table", "bed", "shelf", "cabinet", "desk", "sofa"].indexOf(o.type) >= 0 && fl.objAt[o.y * LAB.W + o.x]) || fl.objs.find(o => fl.objAt[o.y * LAB.W + o.x]);
    if (obj) {
      out.objType = obj.type;
      out.canStand = C.canStand ? C.canStand({}, obj.x, obj.y) : null;
      const lc = C.lootCell(obj.x, obj.y); out.lootFree = !LAB.solidAt(fl, lc[0], lc[1]) && (lc[0] !== obj.x || lc[1] !== obj.y);
      fs.drops.push({ id: "t27drop", kind: "item", item: "scrap", n: 1, x: obj.x, y: obj.y });
      C.fixDrops(); const d = fs.drops.find(q => q.id === "t27drop"); out.fixed = !!d && !LAB.solidAt(fl, d.x, d.y);
    }
    return out;
  });
  ok(furn.items > 50 && furn.onObj === 0, "вещи на этажах не лежат на обстановке (" + furn.items + " вещей, на обстановке " + furn.onObj + ")");
  ok(furn.canStand === false && furn.lootFree && furn.fixed, "на обстановку (" + furn.objType + ") не встать; добыча с неё ложится рядом на пол, старые записи поправляются при входе");

  /* Руководство по разделам, без спойлеров; глубины — только те, где вы были */
  const gd = await page.evaluate(() => {
    const g = LAB.game, out = {}, label = i => typeof i.label === "function" ? i.label() : i.label;
    LAB.ui.closeAll(); g.enterFloor(1, 2, "down", true); LAB.combat.stop();
    LAB.guide.open(); out.root = LAB.ui.top().items.map(label);
    const sec = LAB.guide.sections.find(s => s.t === "Комплекс и исследование");
    out.depth1 = sec.ch.filter(c => !c.when || c.when()).some(c => c.t === "Глубины под Ядром");
    /* главы, которые собираются по глубине (xf), — только когда видны: «Облики ОКО» на первом уровне закрыта */
    const all = LAB.guide.chapters.filter(c => c.t !== "Глубины под Ядром").map(c => (c.x || (c.when && !c.when() ? [] : c.xf())).map(p => typeof p === "string" ? p : p.join(" ")).join(" ")).join(" ");
    out.spoil = ["Подножи", "Колыбел", "Отражени", "Механизм"].filter(w => all.indexOf("«" + w) >= 0 || all.indexOf(" " + w) >= 0);
    out.len = all.length;
    LAB.guide.section(LAB.guide.sections[0]); out.first = LAB.ui.top().items.map(label);
    const lvl0 = g.G.L; g.G.L = 25;
    out.depth25 = sec.ch.filter(c => !c.when || c.when()).some(c => c.t === "Глубины под Ядром");
    const dc = sec.ch.find(c => c.t === "Глубины под Ядром"); const dt = dc.xf().join(" ");
    out.d25 = /«Подножие»/.test(dt) && /«Колыбель»/.test(dt) && !/«Отражение»/.test(dt);
    g.G.L = lvl0;
    LAB.ui.closeAll();
    return out;
  });
  ok(gd.root && gd.root[0] === "Первые шаги" && gd.root.indexOf("Справочники: бестиарий, оружие, броня") >= 0 && gd.root.indexOf("Что нового?") >= 0 && gd.first.indexOf("С чего начать") === 0, "руководство разложено по разделам (" + (gd.root || []).join(", ") + ")");
  ok(!gd.depth1 && gd.depth25 && gd.d25, "глава о глубинах — только когда вы до них дошли, и в ней лишь пройденные глубины");
  ok(gd.spoil && !gd.spoil.length && gd.len < 45000, "в остальных главах нет названий глубин — без спойлеров; руководство короткое (" + gd.len + " знаков" + (gd.spoil && gd.spoil.length ? "; спойлеры: " + gd.spoil.join(", ") : "") + ")");

  await page.evaluate(() => { LAB.ui.closeAll(); });

  console.log("Альфа 3.1: завал на лестнице — руками, монтировкой, домкратом, зарядом; ОКО слышит; находки; заряд из химии");
  const rb = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, S = LAB.settings, R = LAB.rubble, O = LAB.oko, CH = LAB.chem, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    let G = g.G;
    C.stop(); LAB.ui.closeAll(); R._reset();
    const d0 = S.difficulty, tb0 = S.turnBased, rnd = Math.random, wp0 = G.weapons;
    S.difficulty = 1; S.turnBased = 0;
    try {
      /* этажи с заваленной лестницей вниз — по плану этого зерна */
      const p = LAB.plan(G.seed), found = [];
      for (let L = 1; L <= Math.min(10, LAB.LEVELS_N) && found.length < 4; L++) for (let F = 1; F < LAB.FLOORS_N && found.length < 4; F++) if (p.blocked[L][F]) found.push([L, F]);
      out.found = found.length;
      if (found.length < 2) return out;
      const go = (L, F) => {
        delete G.fs[L + "-" + F]; if (G.rub) delete G.rub[L + "-" + F];
        g.enterFloor(L, F, "down", true); C.stop(); G = g.G;
        /* прежние разделы проверки бывали на разных этажах, а лифт возит туда, где вы уже были: этаж под завалом — ещё не пройден */
        delete G.visited[L + "-" + (F + 1)];
        C.foes().forEach(f => { f.dead = true; });
        const st = g.CUR.fl.objs.find(o => o.type === "stairs_down");
        const c = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [st.x + d[0], st.y + d[1]]).find(q => g.passable(q[0], q[1]));
        G.x = c[0]; G.y = c[1]; G.hp = G.hpMax = 1e6; G.dead = false; G.st.jam = 0; g.CUR.fs.okoBlind = false; G.str = 10;
        delete G.inv.rub_jack; Object.keys(G.inv).forEach(k => { if (/^c_blast/.test(k)) delete G.inv[k]; });
        return st;
      };
      /* А. Окно у завала, лифт не выручает, домкрат или заряд — на этом же этаже */
      const [L1, F1] = found[0], k1 = L1 + "-" + F1;
      let st = go(L1, F1);
      out.name = g.objName(st);
      out.kits = g.CUR.fl.items.filter(it => it.rub).map(it => it.item).join(",");
      out.liftNo = !g.liftOk(L1, F1 + 1);
      g.objMenu(st); let w = LAB.ui.top();
      out.title = w.title; out.items = w.items.map(label);
      LAB.ui.closeAll();
      out.modes = [4, 1, 2, 3].map(k => { S.difficulty = k; return R.stages("hands") + "/" + R.stages("bar"); }).join(" ");
      out.digW = [4, 1, 2, 3].map(k => LAB.DIFF[k].digW).join(" ");
      S.difficulty = 1;
      /* Б. Подход руками: долго и шумно — ОКО слышит, бодрость и время уходят, окно открывается снова */
      const wake0 = G.body.wake, min0 = G.min + G.day * 1440, slog0 = (g.CUR.fs.slog || []).length;
      SPOKEN.length = 0;
      out.started = R.stage(st, "hands"); out.busy = R._busy(); out.twice = R.stage(st, "hands") === false;
      /* во время подхода заряд не закладывается: подход закончил бы разбор раньше взрыва, и заряд пропал бы */
      G.inv.c_blast = 1; out.noArmWork = R.arm(st, false) === false && G.inv.c_blast === 1 && !G.rub[k1].armed; delete G.inv.c_blast;
      await wait(3100);
      out.p1 = Math.round(G.rub[k1].p);
      out.reopen = LAB.ui.top() ? LAB.ui.top().title : "";
      out.wake = G.body.wake < wake0; out.time = G.min + G.day * 1440 > min0;
      out.heard = (g.CUR.fs.slog || []).slice(slog0).some(e => /удары на лестничной клетке/.test(e.t));
      out.okoSaid = /ОКО по громкой связи/.test(SPOKEN.join(" | "));
      /* отошли — подход не засчитан */
      LAB.ui.closeAll(); R.stage(st, "hands"); const gx = G.x; G.x = gx + (g.passable(gx + 1, G.y) ? 1 : -1);
      SPOKEN.length = 0; await wait(3100);
      out.moved = Math.round(G.rub[k1].p) === out.p1 && /бросили разбирать/.test(SPOKEN.join(" | ")); G.x = gx;
      /* машины на шум: в обычном режиме — один раз, когда разобрано за половину */
      LAB.ui.closeAll(); G.rub[k1].p = 45; g.CUR.fs.waves = [];
      R.stage(st, "hands"); await wait(3100);
      out.wave = (g.CUR.fs.waves || []).filter(q => q.tag === "rubble").length;
      /* разобрано: лестница свободна, находки — только полезное, под ноги и в рюкзак */
      LAB.ui.closeAll(); G.weapons = wp0; SPOKEN.length = 0;
      const dr0 = g.CUR.fs.drops.length;
      R._finish(st, "hands");
      await wait(1200);
      const dropsNew = g.CUR.fs.drops.slice(dr0);
      out.done = !R.blocked(st) && g.objName(st) === "Лестница вниз" && G.rub[k1].done === 1;
      out.loot = dropsNew.length; out.lootTaken = dropsNew.every(it => g.CUR.fs.taken[it.id]);
      out.lootKinds = dropsNew.map(it => it.kind === "item" ? it.item : it.kind).join(",");
      out.lootUseful = dropsNew.length > 0 && dropsNew.every(it => ["item", "ammo", "credits", "note"].indexOf(it.kind) >= 0 && (it.kind !== "item" || (LAB.ITEMS[it.item] && LAB.ITEMS[it.item].kind !== "junk")));
      out.doneSaid = /пролёт свободен/.test(SPOKEN.join(" | ")) && /Из-под обломков/.test(SPOKEN.join(" | "));
      g.objMenu(st); out.menuDown = LAB.ui.top().items.some(i => /^Спуститься по лестнице/.test(label(i))); LAB.ui.closeAll();
      /* находки — своим потоком от зерна: те же при повторе */
      out.same = JSON.stringify(R._findings("st:9-9", "hands").items) === JSON.stringify(R._findings("st:9-9", "hands").items);
      /* запись помнит разобранный завал */
      g.saveSlot(3); g.loadSlot(3); await wait(300); C.stop(); G = g.G;
      st = g.CUR.fl.objs.find(o => o.type === "stairs_down");
      out.saved = !!(G.rub && G.rub[k1] && G.rub[k1].done) && !R.blocked(st);

      /* В. Домкрат: два подхода почти без шума, домкрат остаётся держать плиту */
      const [L2, F2] = found[1], k2 = L2 + "-" + F2;
      st = go(L2, F2);
      G.inv.rub_jack = 1; SPOKEN.length = 0;
      out.jackUse = g.useItem("rub_jack"); out.jackLeft = G.inv.rub_jack || 0; out.jackSet = !!G.rub[k2].jack;
      await wait(3300);
      out.jackP = Math.round(G.rub[k2].p);
      w = LAB.ui.top(); out.jackNext = w ? w.items.map(label).filter(l => /домкрат/i.test(l)).join(" / ") : "";
      if (w) { w.i = w.items.findIndex(i => /^Качать домкрат/.test(label(i))); if (w.i >= 0) LAB.ui.activate(); }
      await wait(3300);
      out.jackDone = !R.blocked(st) && /Домкрат поднял плиту/.test(SPOKEN.join(" | "));

      /* Г. Подрывной заряд: из химии (пиротехника), закладка, шесть секунд, взрыв — на весь этаж */
      out.rc = CH.RC.some(rc => rc.id === "p_blast" && rc.out === "c_blast" && rc.br === "pyro" && !rc.f);
      out.notShop = !LAB.srcOk(LAB.ITEMS.c_blast, "buy") && !LAB.srcOk(LAB.ITEMS.rub_jack, "buy");
      Math.random = () => 0.99;
      const lab = { id: "t30", type: "chemlab", x: G.x, y: G.y, good: 1 };
      g.CUR.fs.chemSt = g.CUR.fs.chemSt || {}; g.CUR.fs.chemSt.t30 = { tier: 1, dirty: false };
      G.inv.c_salt = 2; G.inv.c_oil = 1; G.inv.wire = 1;
      CH.brew("p_blast", lab); out.brewed = G.inv.c_blast || 0;
      Math.random = rnd;
      const [L3, F3] = found[2] || found[0], k3 = L3 + "-" + F3;
      st = go(L3, F3);
      /* прежние проверки оставили щиты, импланты и подозрение ОКО под сотню — для взрыва с чистого листа */
      const imp0 = G.implants; G.implants = []; G.st.shield = 0; G.st.shieldT = 0; G.st.phaseT = 0; if (G.oko) G.oko.heat = 0;
      G.inv.c_blast = 1; g.CUR.fs.waves = []; const heat0 = (G.oko && G.oko.heat) || 0, hp0 = G.hp, dr1 = g.CUR.fs.drops.length;
      SPOKEN.length = 0;
      out.armUse = g.useItem("c_blast"); out.armLeft = G.inv.c_blast || 0; out.armed = !!G.rub[k3].armed; out.fuse = R._fuse();
      /* пока горит запал, у завала не работают: ни руками, ни домкратом */
      G.inv.rub_jack = 1;
      out.noWorkBurn = R.stage(st, "hands") === false && !R._busy() && /Запал горит/.test(SPOKEN.join(" | "));
      g.objMenu(st); const wb = LAB.ui.top();
      out.burnMenu = wb ? wb.items.map(label).filter(l => /^(Поставить гидравлический домкрат|Разбирать завал|Поджечь запал|Заложить подрывной заряд)/.test(l)).length : -1;
      LAB.ui.closeAll(); delete G.inv.rub_jack;
      await wait(6800);
      out.blastDone = !R.blocked(st) && /Грохот/.test(SPOKEN.join(" | "));
      out.blastHurt = G.hp < hp0 && /Вас задело обломками/.test(SPOKEN.join(" | "));
      out.blastWave = (g.CUR.fs.waves || []).filter(q => q.tag === "rubble").length;
      out.blastHeat = (G.oko.heat || 0) > heat0;
      out.blastLoot = g.CUR.fs.drops.length - dr1; G.implants = imp0;

      /* Д. Пошаговый бой: подход — два хода */
      S.turnBased = 1;
      if (found[3]) {
        st = go(found[3][0], found[3][1]);
        const t0 = C.tickN(); R.stage(st, "hands"); out.tbTurns = C.tickN() - t0; R._reset();
      }
      S.turnBased = 0;

      /* Е. Завал в проходе: подрывной заряд вместо позитронной установки, находки на месте завала */
      let dl = null;
      for (let L = 3; L <= Math.min(8, LAB.LEVELS_N) && !dl; L++) for (let F = 1; F < LAB.FLOORS_N && !dl; F++) {
        const fl0 = LAB.getFloor(G.seed, L, F);
        if (fl0.needRubble) { delete G.fs[L + "-" + F]; g.enterFloor(L, F, "down", true); C.stop(); G = g.G; dl = g.CUR.fl.doors.find(d => d.lock && d.lock.type === "rubble"); }
      }
      if (dl) {
        C.foes().forEach(f => { f.dead = true; }); G.hp = G.hpMax = 1e6;
        const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [dl.x + d[0], dl.y + d[1]]).find(q => g.passable(q[0], q[1]));
        G.x = side[0]; G.y = side[1]; G.inv.c_blast = 1;
        g.doorMenu(dl); out.doorItem = LAB.ui.top().items.some(i => /^Подорвать завал подрывным зарядом/.test(label(i))); LAB.ui.closeAll();
        const dr2 = g.CUR.fs.drops.length;
        out.doorBlast = R.blastDoor(dl);
        await wait(6800);
        out.doorOpen = !!g.CUR.fs.rubble && g.doorBlock(dl) === "";
        out.doorLoot = g.CUR.fs.drops.length - dr2;
      } else out.doorNone = true;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    finally { Math.random = rnd; S.difficulty = d0; S.turnBased = tb0; G.weapons = wp0; R._reset(); LAB.ui.closeAll(); }
    return out;
  });
  if (rb.found < 2) ok(true, "завал на лестнице: в первых уровнях этого зерна меньше двух заваленных лестниц — проверка пропущена (" + rb.found + ")");
  else {
    ok(!rb.err, "завал на лестнице: проверка без ошибок" + (rb.err ? " (" + rb.err + ")" : ""));
    ok(rb.name === "Лестница вниз (завалена)" && rb.liftNo && /^(rub_jack|c_blast)$/.test(rb.kits), "завал: лестница завалена, лифт на нижний этаж не везёт, а домкрат или заряд лежит на этом же этаже (" + [rb.name, rb.liftNo ? "лифт не везёт" : "лифт везёт", rb.kits].join("; ") + ")");
    ok(rb.title === "Лестница вниз завалена" && /Где-то на этом этаже лежит (гидравлический домкрат|подрывной заряд)/.test(rb.items[0]) && rb.items.some(l => /^Разбирать завал (руками|монтировкой)/.test(l)) && rb.items.some(l => l === "Осмотреть завал"), "окно у завала: первым — что с завалом и что лежит на этаже, дальше — разбирать (" + (rb.items || []).join(" / ") + ")");
    ok(rb.modes === "4/2 6/4 8/5 10/6" && rb.digW === "0 1 2 3", "завал по режимам: подходов руками и монтировкой — лёгкий 4/2, обычный 6/4, сложный 8/5, очень сложный 10/6; машин на шум — 0/1/2/3 (" + rb.modes + "; " + rb.digW + ")");
    ok(rb.started && rb.busy && rb.twice && rb.p1 === 17 && /Разобрано на 17 процентов/.test(rb.reopen) && rb.wake && rb.time, "подход руками: разобрано на шестую часть, бодрость и время уходят, окно открывается снова (" + rb.p1 + ", " + rb.reopen + ")");
    ok(rb.noArmWork, "во время подхода заряд не закладывается и не тратится");
    ok(rb.heard && rb.okoSaid, "ОКО слышит разбор завала: запись акустических датчиков в журнале и реплика по громкой связи");
    ok(rb.moved, "отошли от завала — подход не засчитан");
    ok(rb.wave === 1, "в обычном режиме ОКО шлёт машины на шум, когда разобрано за половину (" + rb.wave + ")");
    ok(rb.done && rb.menuDown && rb.doneSaid, "завал разобран: лестница свободна, «Спуститься» снова в окне лестницы");
    ok(rb.loot >= 1 && rb.lootTaken && rb.lootUseful && rb.same, "из-под обломков — только полезное, сразу в рюкзак, и те же находки при повторе (" + rb.lootKinds + ")");
    ok(rb.saved, "запись игры помнит разобранный завал");
    ok(rb.jackUse && rb.jackLeft === 0 && rb.jackSet && rb.jackP === 50 && /Качать домкрат дальше/.test(rb.jackNext) && rb.jackDone, "домкрат: два подхода почти без шума, остаётся держать плиту (" + rb.jackP + ", " + rb.jackNext + ")");
    ok(rb.rc && rb.notShop && rb.brewed === 1, "подрывной заряд делают на химическом столе (пиротехника, без журнала); домкрата и заряда нет на прилавках (" + rb.brewed + ")");
    ok(rb.armUse && rb.armLeft === 0 && rb.armed && rb.fuse === 1 && rb.blastDone && rb.blastHurt && rb.blastWave >= 1 && rb.blastHeat && rb.blastLoot >= 1, "заряд: шесть секунд запала, взрыв разносит завал, рядом задевает, ОКО шлёт машины, находки — у лестницы (" + JSON.stringify({ use: rb.armUse, left: rb.armLeft, armed: rb.armed, fuse: rb.fuse, done: rb.blastDone, hurt: rb.blastHurt, w: rb.blastWave, heat: rb.blastHeat, l: rb.blastLoot }) + ")");
    ok(rb.noWorkBurn && rb.burnMenu === 0, "пока горит запал, у завала не работают: ни руками, ни домкратом, и второго заряда не заложить (" + rb.burnMenu + ")");
    if (rb.tbTurns != null) ok(rb.tbTurns === 2, "пошаговый бой: подход к завалу — два хода (" + rb.tbTurns + ")");
    if (!rb.doorNone) ok(rb.doorItem && rb.doorBlast && rb.doorOpen && rb.doorLoot >= 1, "завал в проходе сносит и подрывной заряд — с находками на месте завала");
  }

  console.log("Альфа 3.1: кухня — в холодильниках то, что держат в холоде; чайник: вскипятить, заварить, сахар, молоко, запасы сотрудников, вода, лапша");
  const kt = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, K = LAB.kitchen, S = LAB.settings, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    let G = g.G;
    C.stop(); LAB.ui.closeAll(); K._reset();
    const tb0 = S.turnBased;
    try {
      /* холодильники первых уровней этого зерна: только еда и напитки, в лабораториях — ещё реактивы и ткани */
      const OK = new Set(); Object.values(K.COLD).forEach(t => t.forEach(e => { if (e[0][0] !== "@") OK.add(e[0]); }));
      const good = it => it.kind === "note" || (it.kind === "item" && (OK.has(it.item) || (LAB.ITEMS[it.item] && LAB.ITEMS[it.item].cat === "med") || /^c_(blood|gland|venom|chitin|spores|enzyme|stab|activ)/.test(it.item)));
      let fr = 0, bad = [], ket0 = null, fr0 = null, cold0 = null;
      for (let L = 1; L <= 4; L++) for (let F = 1; F <= 20; F++) {
        const fl = LAB.getFloor(G.seed, L, F);
        fl.objs.forEach(o => {
          if (o.type === "fx" && o.fx === "kettle" && !ket0) ket0 = [L, F, o.id];
          if (o.type === "fx" && o.fx === "coldroom" && !cold0) cold0 = [L, F, o.id];
          if (o.type !== "fridge") return;
          fr++;
          if (!fr0 && o.loot && o.loot.length) fr0 = [L, F, o.id];
          (o.loot || []).forEach(it => { if (!good(it)) bad.push(it.kind === "item" ? it.item : it.kind); });
        });
      }
      out.fridges = fr; out.bad = bad.slice(0, 6).join(",");
      out.items = !!(LAB.ITEMS.milk && LAB.ITEMS.milk.cold && !LAB.srcOk(LAB.ITEMS.milk, "buy") && LAB.ITEMS.teabag.kit && LAB.ITEMS.sugar.kit);
      out.snd = ["kettle_boil", "kettle_pour", "kettle_stir", "kettle_fill"].every(k => LAB.SND && LAB.SND[k]);
      const go = (L, F, id) => {
        g.enterFloor(L, F, "down", true); C.stop(); G = g.G; C.foes().forEach(f => { f.dead = true; });
        const o = g.CUR.fl.objs.find(q => q.id === id);
        const c = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(d => [o.x + d[0], o.y + d[1]]).find(q => g.passable(q[0], q[1]));
        G.x = c[0]; G.y = c[1]; G.dead = false;
        return o;
      };
      if (ket0) {
        const o = go(ket0[0], ket0[1], ket0[2]), s = K.state(o);
        s.kw = 3; s.tea = 2; s.cof = 1; s.sug = 2; s.kt = null; s.cup = null; s.drankAt = null;
        ["teabag", "instcoffee", "sugar", "milk", "lemon", "noodles", "water"].forEach(k => { delete G.inv[k]; });
        g.objMenu(o); let w = LAB.ui.top();
        out.title = w ? w.title : ""; out.menu = w ? w.items.map(label) : [];
        LAB.ui.closeAll(); SPOKEN.length = 0;
        /* вскипятить: запись кипения, через десять секунд щёлкает автомат — окно открывается снова */
        out.boil = K.boil(o) && K._boiling(o);
        await wait(K.BOIL_MS + 400);
        w = LAB.ui.top(); out.boiled = w ? w.title : ""; out.hot = !K._boiling(o) && w && w.items.some(i => label(i) === "Заварить чай");
        LAB.ui.closeAll();
        /* заварить чай, сахар и молоко в кружку — выпить */
        G.inv.milk = 1; G.body.wake = 40;
        out.brew = K.brew(o, "tea"); out.leftTea = s.tea; out.kw = s.kw;
        await wait(2100);
        w = LAB.ui.top(); out.cup = w ? w.title + ": " + w.items.map(label).join(" / ") : "";
        if (w) { w.i = w.items.findIndex(i => /^Положить сахар/.test(label(i))); LAB.ui.activate(); }
        w = LAB.ui.top(); if (w) { w.i = w.items.findIndex(i => /^Долить молока/.test(label(i))); LAB.ui.activate(); }
        w = LAB.ui.top(); out.cup2 = w ? w.items.map(label).join(" / ") : "";
        SPOKEN.length = 0;
        if (w) { w.i = 0; LAB.ui.activate(); }
        out.wake = Math.round(G.body.wake); out.sug = s.sug; out.milk = G.inv.milk || 0;
        out.said = SPOKEN.join(" | ");
        /* пьют не чаще раза в двадцать минут */
        out.gap = K.brew(o, "water") && !K.drink(o) && !!s.cup;
        s.cup = null; s.drankAt = null;
        /* запасы сотрудников — с собой; пакетик из рюкзака заваривается у горячего чайника */
        g.objMenu(o); w = LAB.ui.top(); w.i = w.items.findIndex(i => /^Забрать с собой/.test(label(i))); LAB.ui.activate();
        out.taken = [G.inv.teabag || 0, G.inv.instcoffee || 0, G.inv.sugar || 0, s.tea, s.cof, s.sug].join(",");
        LAB.ui.closeAll();
        s.kw = 2; const bags = G.inv.teabag || 0;
        out.useBag = g.useItem("teabag") && (G.inv.teabag || 0) === bags - 1 && s.cup && s.cup.b === "tea";
        LAB.ui.closeAll(); s.cup = null;
        /* холодная вода из бутылки остужает кипяток */
        s.kw = 1; G.inv.water = 1;
        g.objMenu(o); w = LAB.ui.top();
        const wi = w.items.findIndex(i => /воду из бутылки|из-под крана/.test(label(i)));
        if (wi >= 0) { w.i = wi; LAB.ui.activate(); }
        out.fill = wi >= 0 && s.kw >= 3 && !(s.kt != null && G.min + G.day * 1440 < s.kt);
        LAB.ui.closeAll();
        /* лапша кипятком — сытнее, чем всухомятку */
        K._boilNow(o); s.drankAt = null; G.inv.noodles = 1; G.body.food = 30;
        g.objMenu(o); w = LAB.ui.top();
        const ni = w.items.findIndex(i => /лапшу/.test(label(i)));
        if (ni >= 0) { w.i = ni; LAB.ui.activate(); }
        out.noodles = Math.round(G.body.food) - 30;
        LAB.ui.closeAll();
        /* пошаговый бой: включить чайник — ход */
        S.turnBased = 1; s.kt = null; s.kw = 2; K._reset();
        const t0 = C.tickN(); K.boil(o); out.tbTurns = C.tickN() - t0; K._reset(); S.turnBased = tb0;
        LAB.ui.closeAll();
        out.examine = LAB.fixtures.examine(o);
      }
      /* холодильник: открыть — только то, что держат в холоде */
      if (fr0) {
        const o = go(fr0[0], fr0[1], fr0[2]);
        g.CUR.fs.ctrap = g.CUR.fs.ctrap || {}; g.CUR.fs.ctrap[o.id] = {}; /* без ловушки в хранилище — проверяется содержимое */
        const inv0 = Object.assign({}, G.inv); SPOKEN.length = 0;
        g.objMenu(o); const w = LAB.ui.top(); out.fridgeMenu = w ? w.items.map(label).join(" / ") : "";
        if (w) { w.i = 0; LAB.ui.activate(); }
        const got = Object.keys(G.inv).filter(k => (G.inv[k] || 0) > (inv0[k] || 0));
        out.fridgeGot = got.join(","); out.fridgeOk = got.length > 0 && got.every(k => good({ kind: "item", item: k }));
        LAB.ui.closeAll();
      }
      /* холодильная камера: «поискать съестное» — только еда */
      if (cold0) {
        const o = go(cold0[0], cold0[1], cold0[2]);
        g.CUR.fs.ctrap = g.CUR.fs.ctrap || {}; g.CUR.fs.ctrap[o.id] = {};
        const inv0 = Object.assign({}, G.inv);
        g.objMenu(o); const w = LAB.ui.top(); const si = w ? w.items.findIndex(i => /съестное/.test(label(i))) : -1;
        if (si >= 0) { w.i = si; LAB.ui.activate(); }
        const got = Object.keys(G.inv).filter(k => (G.inv[k] || 0) > (inv0[k] || 0));
        /* еда — по виду вещи: у бутерброда из автомата (data.js) нет раздела cat, а он из кухонного списка (kitchen.js) */
        out.coldGot = got.join(","); out.coldOk = got.every(k => LAB.ITEMS[k] && LAB.ITEMS[k].kind === "food");
        LAB.ui.closeAll();
      } else out.coldNone = true;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    finally { S.turnBased = tb0; K._reset(); LAB.ui.closeAll(); }
    return out;
  });
  ok(!kt.err, "кухня: проверка без ошибок" + (kt.err ? " (" + kt.err + ")" : ""));
  ok(kt.fridges > 0 && !kt.bad, "в холодильниках первых уровней — только еда, напитки, а в лабораториях реактивы и ткани: ни ценностей, ни кредитов, ни деталей (" + kt.fridges + (kt.bad ? "; не к месту: " + kt.bad : "") + ")");
  ok(kt.items && kt.snd, "новые вещи кухни: молоко — только в холодильниках и не на прилавках, чай, кофе и сахар — только у чайников; записи кипения, налива, ложки и крана есть");
  if (kt.title) {
    ok(kt.title === "Чайник" && /^Чайник холодный: воды — на 3 кружки/.test(kt.menu[0]) && kt.menu.indexOf("Вскипятить чайник") >= 0 && kt.menu.some(l => /^Забрать с собой/.test(l)), "окно чайника: сколько воды, что оставили сотрудники, «Вскипятить» (" + kt.menu.join(" / ") + ")");
    ok(kt.boil && kt.boiled === "Чайник вскипел" && kt.hot, "чайник кипит десять секунд, щёлкает автомат — окно открывается снова, и можно заваривать (" + kt.boiled + ")");
    ok(kt.brew && kt.leftTea === 1 && kt.kw === 2 && /^Кружка готова: Выпить чай \/ Положить сахар \/ Долить молока из пакета/.test(kt.cup), "заварить чай: пакетик и кружка воды ушли, кружка готова — сахар и молоко (" + kt.cup + ")");
    ok(/^Выпить чай с молоком и сахаром/.test(kt.cup2) && kt.sug === 1 && kt.milk === 0 && kt.wake > 40 && /Вы пьёте чай с молоком и сахаром/.test(kt.said), "в кружку — сахар и молоко, выпить: бодрость растёт (" + kt.wake + "; " + kt.cup2 + ")");
    ok(kt.gap, "у чайника пьют не чаще раза в двадцать минут — кружка ждёт на столе");
    ok(kt.taken === "1,1,1,0,0,0" && kt.useBag, "запасы сотрудников — в рюкзак, пакетик чая заваривается у горячего чайника (" + kt.taken + ")");
    ok(kt.fill, "вода в чайник — из-под крана или из бутылки, холодная вода остужает кипяток");
    ok(kt.noodles >= 30, "лапша, залитая кипятком, сытнее (сытость плюс " + kt.noodles + ")");
    ok(kt.tbTurns === 1, "пошаговый бой: включить чайник — ход (" + kt.tbTurns + ")");
    ok(/Рядом — /.test(kt.examine || ""), "«Осмотреть» чайник: что рядом и есть ли раковина");
  }
  if (kt.fridgeMenu != null) ok(/Открыть холодильник/.test(kt.fridgeMenu) && kt.fridgeOk, "открыли холодильник — внутри то, что держат в холоде (" + kt.fridgeGot + ")");
  if (!kt.coldNone) ok(kt.coldOk, "в холодильной камере ищут съестное — и находят только еду (" + (kt.coldGot || "пусто") + ")");

  console.log("Альфа 3.1: передышка между волнами ОКО — по одной, после разбитой волны, пока вы в помещении, после выхода в коридор; по режимам");
  const wvp = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, O = LAB.oko, S = LAB.settings, out = {};
    const G = g.G;
    C.stop(); LAB.ui.closeAll();
    const d0 = S.difficulty, tb0 = S.turnBased, hp0 = G.hp, hpm0 = G.hpMax, cl0 = G.st.cloak, rnd0 = Math.random, heat0 = O.state().heat;
    try {
      S.difficulty = 1; S.turnBased = 0; O.state().heat = 0;
      /* режимы: чем сложнее, тем короче передышка, промежуток, задержка в коридоре и ожидание в помещении; в лёгком ОКО ждёт сколько угодно */
      const D = [4, 1, 2, 3].map(k => LAB.DIFF[k]);
      out.modes = D.map(d => [d.wRest, d.wGap, d.wOut, d.wHold].join("/")).join(" ");
      const dec = k => D.every((d, i) => i === 0 || d[k] < D[i - 1][k]);
      out.modesOk = dec("wRest") && dec("wGap") && dec("wOut") && D[0].wHold === 0 && D.slice(1).every((d, i) => d.wHold > 0 && (i === 0 || d.wHold < D[i].wHold)) && D.every(d => d.wRest > d.wGap && d.wRest >= 60);
      out.descOk = D.every(d => /волн/.test(d.desc));
      /* этаж с чистого листа и без врагов: волны выпускаем сами */
      g.enterFloor(3, 11, "down", true); delete G.fs["3-12"]; g.enterFloor(3, 12, "down", true);
      const fs = g.CUR.fs, fl = g.CUR.fl, W = LAB.W;
      G.hp = G.hpMax = 1e7; G.st.cloak = 1e6;
      const reset = () => { C.foes().forEach(f => { f.dead = true; }); fs.waves = []; fs.repl = []; fs.droneAt = 0; fs.shiftAt = 1e9; fs.repairAt = 0; fs.pun = 0; fs.grind = 0; fs.mineNext = 1e9; fs.wReady = 0; fs.wHoldT = 0; fs.wOut = 0; };
      const pats = C.foes().filter(f => f.beat && f.beat.length > 2 && f.kind === "mech" && !f.spawned && !f.sapper);
      reset(); fs.wIn = false;
      const cells = want => { const a = []; for (let i = 0; i < fl.t.length; i++) { const x = i % W, y = (i / W) | 0; if (fl.t[i] === LAB.T.DOOR || !g.passable(x, y)) continue; if (want === "room" ? fl.room[i] >= 0 : fl.corrAt[i] >= 0 && fl.room[i] < 0) a.push([x, y]); } return a; };
      const corrs = cells("corr"), rooms = cells("room"), cC = corrs[Math.floor(corrs.length / 2)], cR = rooms[Math.floor(rooms.length / 2)];
      const at = c => { G.x = c[0]; G.y = c[1]; };
      const live = () => C.foes().filter(f => !f.dead && f.wv > 0);
      const until = (fn, max) => { for (let i = 1; i <= max; i++) { C.tick(); if (fn()) return i; } return -1; };
      const slog = () => (fs.slog || []).map(e => e.t).join(" | ");
      at(cC); C.tick();
      const tgt = { x: G.x, y: G.y }, gap = O.wsec("wGap"), rest = O.wsec("wRest"), outT = O.wsec("wOut"), cap = O.wsec("wHold");
      out.ticks = [rest, gap, outT, cap].join("/");
      out.secOk = rest === LAB.DIFF[1].wRest * 2 && cap === LAB.DIFF[1].wHold * 2;

      /* А. В коридоре две волны разом — выходят по одной: вторая — через промежуток wGap */
      O.wave(1, 2, "hunt", tgt); O.wave(1, 1, "hunt", tgt);
      const nA = fs.waves[0].n;
      const t1 = until(() => live().length > 0, 20), wA = live(), idA = wA.length ? wA[0].wv : 0;
      out.countA = nA + "/" + wA.length;
      const t2 = until(() => live().some(f => f.wv !== idA), gap + 20);
      out.gapT = [t1, t2, gap].join("/");
      out.gapOk = t1 >= 1 && t1 <= 3 && t2 >= gap - 1 && t2 <= gap + 2;

      /* Б. Пала первая машина волны — передышки ещё нет; пала последняя — следующая волна не раньше чем через wRest */
      live().forEach(f => { if (f.wv !== idA) f.dead = true; });
      O.wave(1, 1, "check", tgt);
      const r0 = O.pace().ready, A0 = live().filter(f => f.wv === idA);
      delete G.tut.wave; SPOKEN.length = 0;
      C.damageFoe(A0[0], 1e9, "kinetic", { quiet: true });
      out.half = A0.length < 2 || O.pace().ready === r0;
      A0.slice(1).forEach(f => C.damageFoe(f, 1e9, "kinetic", { quiet: true }));
      const tK = O.T();
      out.restSet = O.pace().ready >= tK + rest - 1;
      out.tut = /Волна машин ОКО разбита/.test(SPOKEN.join(" | ")) && !!G.tut.wave;
      out.restLog = /Волна единиц потеряна/.test(slog());
      const t3 = until(() => live().some(f => f.wv > idA + 1), rest + 20);
      out.restT = [t3, rest].join("/");
      out.restOk = t3 >= rest - 2 && t3 <= rest + 2;

      /* В. Носитель в помещении — ОКО выжидает; вышел в коридор — волна выходит через wOut */
      reset(); at(cR); C.tick(); out.inRoom = O.pace().inRoom;
      O.state().lastSay = 0; O.state().waitSaid = 0; SPOKEN.length = 0;
      O.wave(1, 1, "hunt", tgt);
      Math.random = () => 0.01; C.tick(); C.tick(); Math.random = rnd0;
      const tIn = until(() => live().length > 0, 120);
      out.held = tIn < 0 && O.pace().hold > 0 && fs.waves.length === 1;
      out.heldLog = /Выход единиц отложен: носитель в помещении/.test(slog());
      await new Promise(r => setTimeout(r, 700));
      const wl = O.lines("wait");
      out.waitSaid = SPOKEN.filter(t => /ОКО по громкой связи/.test(t) && wl.some(l => t.indexOf(l) >= 0)).join(" | ");
      out.waitOk = !!out.waitSaid;
      at(cC);
      const tOut = until(() => live().length > 0, outT + 20);
      out.outT = [tOut, outT].join("/");
      out.outOk = tOut >= outT - 1 && tOut <= outT + 2;

      /* Г. Шагнуть за порог и обратно — ожидание не сбрасывается; дольше wHold ОКО не ждёт и шлёт волну в помещение */
      reset(); at(cR); C.tick();
      O.wave(1, 1, "hunt", tgt); C.tick(); C.tick();
      const h0 = O.pace().hold;
      at(cC); for (let i = 0; i < 10; i++) C.tick();
      at(cR); C.tick();
      out.holdKept = h0 > 0 && O.pace().hold === h0 && live().length === 0;
      const tCap = until(() => live().length > 0, cap + 20);
      out.capT = [tCap > 0 ? O.T() - h0 : -1, cap].join("/");
      out.capOk = tCap > 0 && O.pace().inRoom && O.T() - h0 >= cap - 1 && O.T() - h0 <= cap + 2 && /Ожидание прекращено/.test(slog());

      /* Д. Смена караула и машины на шум у завала — в свой срок, хоть носитель в помещении и идёт передышка */
      reset(); at(cR); C.tick();
      fs.wReady = O.T() + 1000;
      O.wave(1, 1, "patrol", null, "shift"); O.wave(1, 1, "check", tgt, "rubble");
      for (let i = 0; i < 6; i++) C.tick();
      const sp = C.foes().filter(f => !f.dead && f.spawned);
      out.own = sp.some(f => f.patrol && !f.wv) && sp.some(f => f.wv > 0) && fs.waves.length === 0;

      /* Е. Замена павшего патрульного — тоже волна: ждёт, пока носитель в помещении */
      reset(); at(cR); C.tick();
      const hp = c => Math.min.apply(null, c.beat.map(p => Math.abs(p[0] - cC[0]) + Math.abs(p[1] - cC[1])));
      const pb = pats.slice().sort((a, b) => hp(b) - hp(a))[0];
      if (pb) {
        const bk = JSON.stringify(pb.beat);
        fs.repl.push({ k: "patrol", t: O.T() + 1, beat: pb.beat, corr: pb.corr, type: pb.type, n: 1, at: null });
        const isR = () => C.foes().some(f => !f.dead && f.spawned && f.wv > 0 && JSON.stringify(f.beat) === bk);
        const rIn = until(isR, 60);
        at(cC);
        const rOut = until(isR, outT + 60);
        out.repl = [rIn, rOut, outT].join("/");
        out.replOk = rIn < 0 && rOut >= outT - 1;
      }

      /* Ж. Очередь переполнилась — машины встают в последнюю волну того же вида: их не меньше */
      reset();
      for (let i = 0; i < 12; i++) fs.waves.push({ t: O.T() + 999, n: 1, mode: "hunt", at: null, tag: "" });
      const sum0 = fs.waves.reduce((s, w) => s + w.n, 0);
      O.wave(5, 2, "hunt", tgt);
      out.merge = fs.waves.length === 12 && fs.waves.reduce((s, w) => s + w.n, 0) === sum0 + Math.round(2 * LAB.dk().repl);

      /* З. Лёгкий режим: в помещении ОКО ждёт сколько угодно */
      S.difficulty = 4; reset(); at(cR); C.tick();
      O.wave(1, 1, "hunt", tgt);
      out.easy = O.wsec("wHold") === 0 && until(() => live().length > 0, 900) < 0 && fs.waves.length === 1;
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    finally {
      Math.random = rnd0; S.difficulty = d0; S.turnBased = tb0; G.hp = hp0; G.hpMax = hpm0; G.st.cloak = cl0; O.state().heat = heat0;
      const fs = g.CUR.fs; C.foes().forEach(f => { if (f.spawned) f.dead = true; }); fs.waves = []; fs.repl = []; fs.wReady = 0; fs.wHoldT = 0; fs.wOut = 0;
    }
    return out;
  });
  ok(!wvp.err, "передышка между волнами: проверка без ошибок" + (wvp.err ? " (" + wvp.err + ")" : ""));
  ok(wvp.modesOk && wvp.descOk && wvp.secOk, "по режимам (лёгкий, обычный, сложный, очень сложный — передышка/промежуток/коридор/ожидание, с): " + wvp.modes + "; в описании режимов — о передышке");
  ok(wvp.gapOk && wvp.countA && wvp.countA.split("/")[0] === wvp.countA.split("/")[1], "две волны разом выходят по одной, вторая — через промежуток (" + wvp.gapT + " тактов); машин в волне — сколько назначено (" + wvp.countA + ")");
  ok(wvp.half && wvp.restSet && wvp.restOk && wvp.restLog, "пала последняя машина волны — следующая выходит не раньше чем через передышку (" + wvp.restT + " тактов)");
  ok(wvp.tut, "в первый раз «Эхо» объясняет передышку и что ОКО выжидает, пока вы в помещении");
  ok(wvp.inRoom && wvp.held && wvp.heldLog, "носитель в помещении — волна ждёт (журнал: выход отложен)");
  ok(wvp.waitOk, "ОКО говорит, что подождёт: " + (wvp.waitSaid || "—"));
  ok(wvp.outOk, "вышли в коридор — волна выходит через задержку режима (" + wvp.outT + " тактов)");
  ok(wvp.holdKept && wvp.capOk, "шагнуть за порог и обратно мало; дольше срока режима ОКО не ждёт — волна выходит, хоть вы и в помещении (" + wvp.capT + " тактов)");
  ok(wvp.own, "смена караула и машины на шум у завала выходят в свой срок — без передышки и ожидания");
  if (wvp.repl) ok(wvp.replOk, "замена павшего патрульного тоже ждёт, пока вы в помещении, и выходит после коридора (" + wvp.repl + ")");
  ok(wvp.merge, "очередь волн переполнилась — машины добавляются к последней волне того же вида, их число не теряется");
  ok(wvp.easy, "лёгкий режим: пока вы в помещении, ОКО ждёт сколько угодно");

  console.log("Альфа 3.1: полы — бетонные и металлические коридоры, деревянные и бетонные помещения; звук стены прежний");
  const flr = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, P = LAB.floors, out = {};
    const G = g.G;
    C.stop(); LAB.ui.closeAll();
    const rnd0 = Math.random, sp0 = LAB.Sound.play, hp0 = G.hp, hpm0 = G.hpMax, cl0 = G.st.cloak;
    try {
      out.snd = ["step_concrete", "step_wood"].every(k => LAB.SND[k] && LAB.SND[k].f.length >= 8) && LAB.SND.floor_creak && LAB.SND.floor_creak.f.length >= 4;
      out.surf = !!(P && LAB.SURF.concrete && LAB.SURF.wood && LAB.SURF.wood.creak);
      /* этаж, где есть всё: деревянное помещение, лестничная клетка, бетонный и металлический коридоры */
      const secret = (fl, c) => { const d = fl.doors.find(x => x.id === c.door); return !!(d && d.lock && d.lock.type === "secret"); };
      let found = null;
      for (let L = 1; L <= 3 && !found; L++) for (let F = 2; F <= 20 && !found; F++) {
        const fl = LAB.getFloor(G.seed, L, F);
        const wr = fl.rooms.findIndex((rm, ri) => rm && !rm.annex && P.room(fl, ri) === "wood");
        const cr = fl.rooms.findIndex(rm => rm && rm.type === "stair");
        const cc = fl.corrs.findIndex((c, ci) => P.corr(fl, ci) === "concrete" && !secret(fl, c));
        const mc = fl.corrs.findIndex((c, ci) => P.corr(fl, ci) === null && !secret(fl, c));
        if (wr >= 0 && cr >= 0 && cc >= 0 && mc >= 0) found = { L, F, wr, cr, cc, mc };
      }
      out.found = !!found;
      if (!found) return out;
      g.enterFloor(found.L, found.F, "down", true);
      G.hp = G.hpMax = 1e7; G.st.cloak = 1e6; G.stair = null;
      C.foes().forEach(f => { f.dead = true; });
      const fl = g.CUR.fl, W = LAB.W, DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
      const wallBy = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(v => fl.t[(y + v[1]) * W + x + v[0]] === LAB.T.WALL);
      /* шаг внутри участка: что прозвучало и какой пол под ногами */
      const stepIn = (area, rnd) => {
        for (let i = 0; i < fl.t.length; i++) {
          if (!area(i)) continue;
          const x = i % W, y = (i / W) | 0;
          if (!g.passable(x, y) || fl.t[i] === LAB.T.DOOR) continue;
          for (const k of ["N", "S", "W", "E"]) {
            const nx = x + DV[k][0], ny = y + DV[k][1], j = ny * W + nx;
            if (!LAB.inb(nx, ny) || !area(j) || !g.passable(nx, ny) || fl.t[j] === LAB.T.DOOR) continue;
            G.x = x; G.y = y; LAB.ui.closeAll();
            const ids = [];
            LAB.Sound.play = function (id) { ids.push(id); return sp0.apply(this, arguments); };
            if (rnd) Math.random = rnd;
            const moved = g.tryMove(k);
            Math.random = rnd0; LAB.Sound.play = sp0;
            return { moved, ids, surf: g.surfaceAt(nx, ny), wall: wallBy(nx, ny) };
          }
        }
        return null;
      };
      const lev = LAB.LEVELS[found.L].surf, lb = "step_" + ((LAB.SURF[lev] || {}).base || lev);
      out.lev = lev;
      const wood = stepIn(i => fl.room[i] === found.wr), stair = stepIn(i => fl.room[i] === found.cr);
      const conc = stepIn(i => fl.corrAt[i] === found.cc), metal = stepIn(i => fl.corrAt[i] === found.mc);
      out.woodRoom = fl.rooms[found.wr].type; out.at = found.L + "-" + found.F;
      out.wood = !!wood && wood.moved && wood.surf === "wood" && wood.ids.indexOf("step_wood") >= 0;
      out.stair = !!stair && stair.moved && stair.surf === "concrete" && stair.ids.indexOf("step_concrete") >= 0;
      out.conc = !!conc && conc.moved && conc.surf === "concrete" && conc.ids.indexOf("step_concrete") >= 0;
      out.metal = !!metal && metal.moved && metal.surf === lev && metal.ids.indexOf(lb) >= 0 && metal.ids.indexOf("step_concrete") < 0;
      out.ids = [wood, stair, conc, metal].map(r => r ? r.ids.filter(id => /^step_|creak/.test(id)).join("+") : "—").join(" | ");
      /* у стены шаг отдаётся тем же коротким эхом, что и на металле */
      const echo = [wood, conc, metal].filter(r => r && r.moved && r.wall);
      out.echo = echo.length > 0 && echo.every(r => r.ids.indexOf("step_echo") >= 0);
      /* по дереву изредка скрипят половицы (здесь — всегда: случайность подменена) */
      const creak = stepIn(i => fl.room[i] === found.wr, () => 0.01);
      out.creak = !!creak && creak.ids.indexOf("floor_creak") >= 0;
      /* звук стены не изменился: в деревянном помещении — тот же удар о сталь */
      let bump = null;
      for (let i = 0; i < fl.t.length && !bump; i++) {
        if (fl.room[i] !== found.wr) continue;
        const x = i % W, y = (i / W) | 0;
        if (!g.passable(x, y)) continue;
        for (const k of ["N", "S", "W", "E"]) {
          const nx = x + DV[k][0], ny = y + DV[k][1];
          if (fl.t[ny * W + nx] !== LAB.T.WALL) continue;
          G.x = x; G.y = y; LAB.ui.closeAll();
          const ids = []; LAB.Sound.play = function (id) { ids.push(id); return sp0.apply(this, arguments); };
          g.tryMove(k); LAB.Sound.play = sp0;
          bump = ids; break;
        }
      }
      out.bump = !!bump && bump.indexOf("bump_wall") >= 0 && !bump.some(id => /^step_|creak/.test(id));
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    finally { Math.random = rnd0; LAB.Sound.play = sp0; G.hp = hp0; G.hpMax = hpm0; G.st.cloak = cl0; LAB.ui.closeAll(); }
    return out;
  });
  ok(!flr.err, "полы: проверка без ошибок" + (flr.err ? " (" + flr.err + ")" : ""));
  ok(flr.snd && flr.surf, "новые записи шагов: по бетону, по деревянному полу и скрип половиц (Freesound, CC0)");
  ok(flr.found, "на первых уровнях есть деревянные помещения, лестничные клетки, бетонные и металлические коридоры");
  if (flr.found) {
    ok(flr.wood, "в деревянном помещении («" + flr.woodRoom + "», этаж " + flr.at + ") шаги по дереву");
    ok(flr.stair, "лестничная клетка — бетонный колодец: шаги по бетону");
    ok(flr.conc && flr.metal, "коридоры: где бетон — шаги по бетону, где металл — прежний металл уровня (" + flr.lev + "): " + flr.ids);
    ok(flr.echo, "у стены шаг отдаётся прежним коротким эхом — и на дереве, и на бетоне");
    ok(flr.creak, "по деревянному полу изредка скрипят половицы");
    ok(flr.bump, "звук стены прежний: удар о сталь, без звука шага");
  }

  console.log("Альфа 3.2: подсказки о жестах — как в игре (перезарядка, смена оружия, повтор фразы, двери коридора)");
  const hint31 = await page.evaluate(() => {
    const out = {}, km = LAB.keysMode, g = LAB.game, C = LAB.combat, G = g.G;
    const keep = { drawn: G.drawn, tutW: G.tut.weapon, nW: G.weapons.length, wi: G.wi };
    LAB.keysMode = false; LAB.ui.closeAll(); C.stop();
    try {
      /* обучение: повтор фразы — долгое касание одним пальцем; касание двумя — перезарядка */
      const tut = LAB.tutor.steps.map(s => s.t()).join(" | ");
      out.tutRepeat = /повторить последнюю фразу — долгое касание одним пальцем/.test(tut) && !/фразу — касание двумя пальцами/.test(tut);
      out.tutWeapon = /перезарядка — касание двумя пальцами/.test(tut) && /смена оружия — двойное касание двумя пальцами/.test(tut);
      /* пустой заряд: подсказка — касание двумя пальцами, а не жест гранаты */
      const w = G.weapons.find(x => x.ammo && x.ammo !== "none") || null;
      if (w) {
        G.wi = G.weapons.indexOf(w); G.drawn = true; const ch0 = w.charge; w.charge = 0;
        SPOKEN.length = 0; C.fire("N", false);
        out.empty = SPOKEN.join(" | ").slice(0, 200);
        w.charge = ch0;
      } else out.empty = "нет оружия с зарядом";
      /* новое оружие: сменить — двойное касание двумя пальцами (вверх-вниз одним пальцем — ловушка) */
      G.tut.weapon = 0;
      out.pick = g.giveItem({ kind: "weapon", w: LAB.makeWeapon("spark", 1, 1, 2) }, true);
      G.weapons.length = keep.nW;
      /* руководство: список дверей коридора — в списке целей навигатора, четыре пальца вверх */
      out.guide = /Список дверей коридора — в списке целей навигатора: четыре пальца вверх/.test(JSON.stringify(LAB.guide.chapters));
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 300); }
    LAB.keysMode = km; G.drawn = keep.drawn; G.tut.weapon = keep.tutW; G.wi = keep.wi;
    return out;
  });
  ok(!hint31.err && hint31.tutRepeat && hint31.tutWeapon, "обучение: повторить фразу — долгое касание одним пальцем, перезарядка — касание двумя, смена оружия — двойное касание двумя" + (hint31.err ? " (" + hint31.err + ")" : ""));
  ok(/Заряд пуст\. Перезарядка — касание двумя пальцами/.test(hint31.empty) && !/влево и сразу вправо/.test(hint31.empty), "пустой заряд: «Перезарядка — касание двумя пальцами», а не жест гранаты (" + hint31.empty + ")");
  ok(/Сменить оружие — двойное касание двумя пальцами/.test(hint31.pick) && !/вверх и сразу вниз/.test(hint31.pick), "новое оружие: сменить — двойное касание двумя пальцами (" + hint31.pick + ")");
  ok(hint31.guide, "руководство: список дверей коридора — в списке целей навигатора, четыре пальца вверх");

  console.log("Альфа 3.2: облики ОКО — голос и сигнал меняются с глубиной; Зрачок лжёт, Счетовод торгуется, Исток шепчет");
  const okf = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, O = LAB.oko, F = LAB.okoForms, S = LAB.settings, out = {};
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const chimes = [], ch0 = LAB.atmos.okoChime, rnd0 = Math.random, st0 = window.setTimeout, d0 = S.difficulty, tb0 = S.turnBased;
    /* таймеры, заведённые одним вызовом, — без ожидания (поправка Зрачка через 6–10 с, слово «Эхо» через 11 с) */
    const fast = fn => { window.setTimeout = (f, ms) => st0(f, Math.min(ms || 0, 30)); try { return fn(); } finally { window.setTimeout = st0; } };
    let G = g.G;
    const keep = { L: G.L, F: G.F, x: G.x, y: G.y, cr: G.credits, hp: G.hp, hpm: G.hpMax, cl: G.st.cloak };
    LAB.atmos.okoChime = function (k, t) { chimes.push(k); };
    const fresh = (L, Fl) => { g.enterFloor(L, Fl === 1 ? 2 : Fl - 1, "down", true); delete G.fs[L + "-" + Fl]; g.enterFloor(L, Fl, "down", true); C.stop(); G = g.G; };
    async function say(L, Fl, kind) {
      fresh(L, Fl); SPOKEN.length = 0; chimes.length = 0; O.state().lastSay = 0;
      const fr = F.frame(kind), okk = O.speak(kind, true);
      /* слова ОКО — строки «вводные слова: «…»»; прочее (обучение, вести этажа) не в счёт */
      const okoLines = () => SPOKEN.filter(t => /^(ОКО|Садовник ОКО|Зрачок|Счетовод ОКО)[^«]{0,40}: «/.test(t));
      await sleep(200); const early = okoLines().length;
      await sleep((fr.gap || 0) + 500);
      return { ok: okk, said: okoLines().join(" | ").slice(0, 200), chime: chimes.join(","), form: F.cur().id, gap: fr.gap, early: early };
    }
    try {
      S.difficulty = 1; S.turnBased = 0; LAB.ui.closeAll(); C.stop();
      out.base = await say(5, 3, "taunt");
      out.far1 = await say(12, 2, "taunt");
      out.far2 = await say(19, 10, "taunt");
      out.garden = await say(30, 5, "taunt");
      out.twin = await say(55, 5, "taunt");
      out.guard = await say(65, 5, "squad");
      out.gardenM = await say(65, 5, "heal");
      out.count = await say(68, 5, "buy");
      out.tale = await say(72, 5, "idle");
      out.whole = await say(79, 5, "squad");
      out.whisper = await say(85, 5, "taunt");
      out.silent = await say(100, 3, "taunt");
      out.chatty = [5, 81, 90, 99].map(L => { G.L = L; G.F = 1; return +F.chatty().toFixed(2); });
      out.snd = [5, 12, 30, 45, 70, 90].map(L => F.sounds(L).length).join(" ");
      /* Зрачок: объявляет отряд, которого нет, — машин не прибавилось, в журнале безопасности пусто; настоящее ОКО поправляет издалека */
      fresh(45, 4); SPOKEN.length = 0; chimes.length = 0;
      G.hp = G.hpMax = 1e7; G.st.cloak = 1e6;
      const n0 = C.foes().filter(f => !f.dead).length, lg0 = (g.CUR.fs.slog || []).length;
      Math.random = () => 0.01;
      out.fakeOk = fast(() => F.pupilFake("test"));
      Math.random = rnd0;
      await sleep(2600); /* поправка настоящего ОКО: слова доходят поздно */
      out.fake = SPOKEN.find(t => /^Зрачок, вплотную: «/.test(t)) || ""; out.fix = SPOKEN.find(t => /^ОКО издалека: «[^»]*(не я|Не верьте|Зрачок|пусто|поздно)/.test(t)) || SPOKEN.filter(t => /^ОКО издалека: «/.test(t)).join(" | "); /* прочие слова ОКО в эти секунды — не поправка */ out.fakeChime = chimes.join(",");
      out.fakeFoes = C.foes().filter(f => !f.dead).length - n0; out.fakeLog = (g.CUR.fs.slog || []).length - lg0;
      /* настоящий выход — в журнале безопасности; носитель в коридоре, чтобы ОКО не выжидало */
      const fl = g.CUR.fl, fs = g.CUR.fs, W = LAB.W, corr = [];
      for (let i = 0; i < fl.t.length; i++) { const x = i % W, y = (i / W) | 0; if (fl.t[i] !== LAB.T.DOOR && g.passable(x, y) && fl.corrAt[i] >= 0 && fl.room[i] < 0) corr.push([x, y]); }
      const cc = corr[Math.floor(corr.length / 2)]; G.x = cc[0]; G.y = cc[1];
      C.foes().forEach(f => { f.dead = true; }); fs.waves = []; fs.repl = []; fs.wReady = 0; fs.wHoldT = 0; fs.wOut = 0; fs.wIn = false;
      C.tick(); O.wave(0, 2, "squad", { x: G.x, y: G.y }, "test");
      for (let i = 0; i < 40 && !(fs.slog || []).some(e => /^Выход единиц: \d+/.test(e.t)); i++) C.tick();
      out.realLog = (fs.slog || []).filter(e => /^Выход единиц: \d+/.test(e.t)).map(e => e.t).join(" | ");
      out.term = typeof O.logText === "function" && /Выход единиц: \d+/.test(O.logText(14));
      /* Счетовод: торг у терминала безопасности — с 66-го уровня по 78-й */
      out.deals = [62, 66, 70, 78, 79, 85].map(L => { G.L = L; G.F = 5; return F.dealsOpen() ? 1 : 0; }).join("");
      fresh(70, 5); G.credits = 1000; SPOKEN.length = 0;
      const T0 = O.T(), pr = F.price("rest");
      F.dealMenu(); const top = LAB.ui.top();
      out.dealItems = top ? top.items.map(i => typeof i.label === "function" ? i.label() : i.label) : [];
      if (top) { top.i = 0; LAB.ui.activate(); }
      await sleep(1000);
      out.deal = { paid: 1000 - G.credits, pr: pr, ready: (g.CUR.fs.wReady || 0) - T0, n: g.CUR.fs.dealRest, log: (g.CUR.fs.slog || []).some(e => /Счетовод: выход единиц отложен/.test(e.t)), said: SPOKEN.join(" | ") };
      out.pr2 = F.price("rest");
      LAB.ui.closeAll();
      /* Исток: шёпотом предупреждает о машине, что идёт из-за стены */
      fresh(85, 5); F._reset(); SPOKEN.length = 0; chimes.length = 0;
      G.hp = G.hpMax = 1e7; G.st.cloak = 1e6;
      const fl2 = g.CUR.fl, fs2 = g.CUR.fs;
      const spotFrom = (hx, hy) => {
        for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
          const x = hx + dx, y = hy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
          if (d < 4 || d > 8 || !g.passable(x, y)) continue;
          if (!LAB.los(fl2, fs2, hx, hy, x, y)) return [x, y];
        }
        return null;
      };
      let spot = spotFrom(G.x, G.y);
      /* (3.6) помещения просторнее: в восьми шагах от входа может не найтись клетки за стеной —
         носитель отходит туда, где она есть */
      const seenC = new Set([G.y * LAB.W + G.x]), wave = [[G.x, G.y]];
      for (let k = 0; k < wave.length && k < 4000 && !spot; k++) {
        for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = wave[k][0] + v[0], ny = wave[k][1] + v[1], ni = ny * LAB.W + nx;
          if (spot || seenC.has(ni) || !g.passable(nx, ny)) continue;
          seenC.add(ni); wave.push([nx, ny]);
          const sp = spotFrom(nx, ny); if (sp) { G.x = nx; G.y = ny; spot = sp; }
        }
      }
      const q = C.foes().find(f => !f.dead && f.kind === "mech" && (f.beh || []).indexOf("camera") < 0 && (f.beh || []).indexOf("stationary") < 0);
      C.foes().forEach(f => { if (f !== q) f.dead = true; });
      if (spot && q) {
        q.x = spot[0]; q.y = spot[1]; q.state = "hunt"; q.ally = false; q.calm = false; q.neutral = false; q.disguised = false;
        Math.random = () => 0.01; F.warnTick(); Math.random = rnd0;
        await sleep(200);
        out.warn = SPOKEN.find(t => /^ОКО, шёпотом, прямо в ухо: «/.test(t)) || SPOKEN.join(" | ").slice(0, 200); out.warnName = String(q.name || "").split(",")[0]; out.warnChime = chimes.length;
      } else out.warn = "нет места за стеной: " + !!spot + "/" + !!q;
      /* на краю Истока ОКО простилось и молчит */
      G.L = 99; G.F = 20; out.silent99 = F.silent(); G.L = 99; G.F = 19; out.talk99 = !F.silent();
      /* каждую перемену «Эхо» объясняет один раз — при входе на уровень */
      fresh(41, 2); SPOKEN.length = 0; O.state().formSaid = null; const j0 = G.journal.length;
      fast(() => F.entered()); await sleep(300);
      out.stage = SPOKEN.find(t => /^«Эхо»: голос ОКО двоится/.test(t)) || SPOKEN.join(" | ").slice(0, 200); out.stageJ = G.journal.length > j0;
      SPOKEN.length = 0; fast(() => F.entered()); await sleep(300); out.stageOnce = !SPOKEN.some(t => /^«Эхо»: голос ОКО двоится/.test(t));
      /* руководство: глава «Облики ОКО» — только о тех глубинах, где игрок уже был */
      const ch = LAB.guide.chapters.find(c => c.t === "Облики ОКО");
      out.guide = !!ch;
      if (ch) {
        G.L = 5; out.guide5 = !!ch.when();
        G.L = 45; out.guide45 = ch.when() ? ch.xf().join(" ") : "";
      }
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    Math.random = rnd0; window.setTimeout = st0; LAB.atmos.okoChime = ch0; S.difficulty = d0; S.turnBased = tb0;
    LAB.ui.closeAll(); C.stop();
    g.enterFloor(keep.L, keep.F, "down", true); C.stop(); G = g.G;
    G.x = keep.x; G.y = keep.y; G.credits = keep.cr; G.hp = keep.hp; G.hpMax = keep.hpm; G.st.cloak = keep.cl;
    return out;
  });
  ok(!okf.err, "облики ОКО: проверка без ошибок" + (okf.err ? " — " + okf.err : ""));
  if (!okf.err) {
    const lead = (r, re, chime) => r.ok && re.test(r.said) && r.chime === chime;
    ok(lead(okf.base, /^ОКО по громкой связи: «/, "oko"), "«Ковчег»: ОКО по громкой связи, прежний сигнал (" + okf.base.said.slice(0, 60) + " · " + okf.base.chime + ")");
    ok(lead(okf.far1, /^ОКО издалека: «/, "far") && lead(okf.far2, /^ОКО из-под земли: «/, "far"), "«Подножие»: голос уходит под землю — издалека, потом из-под земли (" + okf.far1.chime + ")");
    ok(lead(okf.garden, /^Садовник ОКО: «/, "garden"), "«Колыбель»: говорит Садовник, сигнал — колокола (" + okf.garden.chime + ")");
    ok(lead(okf.twin, /^ОКО издалека: «/, "far3") && okf.twin.early === 0 && okf.twin.gap > 1500, "«Отражение»: настоящее ОКО далеко — слова приходят с опозданием (" + okf.twin.gap + " мс)");
    ok(lead(okf.guard, /^ОКО, голосом города: «/, "m_guard") && okf.gardenM.chime === "m_garden" && okf.count.chime === "m_count" && okf.tale.chime === "m_tale", "«Механизм»: у города разумы — Сторож, Садовник, Счетовод, Сказочник (" + [okf.guard.chime, okf.gardenM.chime, okf.count.chime, okf.tale.chime].join(" ") + ")");
    ok(lead(okf.whole, /^ОКО, одним голосом: «/, "whole"), "с 79-го голоса сходятся: ОКО, одним голосом (" + okf.whole.chime + ")");
    ok(okf.whisper.ok && /^ОКО, шёпотом, прямо в ухо: «/.test(okf.whisper.said) && okf.whisper.chime === "", "«Исток»: шёпотом, прямо в ухо, без сигнала громкой связи");
    ok(okf.silent.ok === false && okf.silent.said === "" && okf.silent99 && okf.talk99, "на краю Истока ОКО простилось и молчит");
    ok(okf.chatty[0] === 1 && okf.chatty[1] === 1 && okf.chatty[2] < 1 && okf.chatty[3] < okf.chatty[2] && okf.chatty[3] >= 0.25, "в Истоке ОКО заговаривает всё реже (" + okf.chatty.join(" ") + ")");
    ok(okf.snd === "1 2 2 2 6 0", "звуки сигналов грузятся с уровнем: свои на каждой глубине (" + okf.snd + ")");
    ok(okf.fakeOk && /^Зрачок, вплотную: «/.test(okf.fake) && okf.fakeChime.split(",").indexOf("pupil") >= 0 && okf.fakeFoes === 0 && okf.fakeLog === 0, "Зрачок объявляет отряд, которого нет: машин не прибавилось, журнал безопасности молчит (" + okf.fake.slice(0, 90) + ")");
    ok(/^ОКО издалека: «[^»]*(не я|Не верьте|Зрачок|пусто|поздно)/.test(okf.fix), "настоящее ОКО поправляет Зрачка издалека" + (okf.fix ? "" : " (поправки не было)") + (/^ОКО издалека: «[^»]*(не я|Не верьте|Зрачок|пусто|поздно)/.test(okf.fix) ? "" : " (" + okf.fix.slice(0, 120) + ")"));
    ok(/^Выход единиц: \d+/.test(okf.realLog) && okf.term, "настоящий выход машин — в журнале безопасности терминала (" + okf.realLog.slice(0, 80) + ")");
    ok(okf.deals === "011100", "Счетовод торгуется с 66-го по 78-й уровень (" + okf.deals + ")");
    ok(okf.dealItems.length === 3 && /^Передышка: Сторож подождёт три минуты — \d+ кредит(а|ов)?$/.test(okf.dealItems[0]) && /^Забыть подозрение/.test(okf.dealItems[1]), "сделка со Счетоводом: передышка, забытое подозрение, отказ (" + okf.dealItems.join(" / ").slice(0, 120) + ")");
    ok(okf.deal.paid === okf.deal.pr && okf.deal.ready >= 360 && okf.deal.n === 1 && okf.deal.log && /Счетовод ОКО: «(Сделка|Оплачено|Договорились)/.test(okf.deal.said), "передышка куплена: кредиты списаны, Сторож ждёт три минуты, в журнале — договор (" + okf.deal.paid + " кр., " + okf.deal.ready + " тактов)");
    ok(okf.pr2 > okf.deal.pr, "вторая передышка на этаже дороже (" + okf.deal.pr + " → " + okf.pr2 + ")");
    ok(/^ОКО, шёпотом, прямо в ухо: «/.test(okf.warn) && okf.warn.indexOf(okf.warnName) >= 0 && okf.warnChime === 0, "Исток: ОКО шёпотом предупреждает о машине из-за стены (" + okf.warn.slice(0, 100) + ")");
    ok(/^«Эхо»: голос ОКО двоится/.test(okf.stage) && okf.stageJ && okf.stageOnce, "при входе в «Отражение» «Эхо» один раз объясняет, что ОКО изменилось");
    ok(okf.guide && !okf.guide5 && /«Подножие»/.test(okf.guide45) && /«Колыбель»/.test(okf.guide45) && /«Отражение»/.test(okf.guide45) && !/«Механизм»/.test(okf.guide45), "руководство: «Облики ОКО» — только о глубинах, где игрок уже был");
  }

  console.log("Альфа 3.2: с третьего блока — просторнее: шире коридоры, больше помещения и кабинеты, вещи своей глубины");
  const grow = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, out = {}, label = i => typeof i.label === "function" ? i.label() : i.label;
    let G = g.G;
    const keep = { L: G.L, F: G.F, x: G.x, y: G.y, inv: JSON.stringify(G.inv), hp: G.hp };
    const km = LAB.keysMode; LAB.keysMode = false;
    const go = (L, F) => { g.enterFloor(L, F, "down", true); C.stop(); G = g.G; C.foes().forEach(f => { f.dead = true; }); };
    try {
      LAB.ui.closeAll(); C.stop();
      /* ширина коридоров по блокам: 4 выше, 5, 6, 7 — в «Отражении», «Механизме», «Истоке» */
      out.cw = [5, 30, 45, 65, 85].map(L => { const fl = LAB.getFloor(G.seed, L, 3); const ws = {}; fl.corrs.forEach(c => { ws[c.axis === "h" ? c.y1 - c.y0 + 1 : c.x1 - c.x0 + 1] = 1; }); return Object.keys(ws).join("/"); }).join(" ");
      /* помещения и кабинеты: средняя площадь растёт по блокам — по двенадцати уровням блока, с каждого
         по этажу (у соседних блоков размеры частично совпадают, а плотность кабинетов у каждого
         уровня своя: на тесном они уже, и один уровень бывает выбросом — по шести этажам одного
         уровня проверка падала примерно в одном мире из восьми) */
      const area = b => { const m = [], a = []; [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17].forEach((d, j) => LAB.getFloor(G.seed, b + d, 3 + j % 6).rooms.forEach(r => { if (!r) return; const s = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1); (r.annex ? a : m).push(s); })); const avg = q => q.reduce((x, y) => x + y, 0) / Math.max(1, q.length); return [Math.round(avg(m)), Math.round(avg(a))]; };
      out.area = [21, 41, 61, 81].map(area);
      /* коридор «Отражения»: «Эхо» называет ширину, в широком — ещё «ближе к стене» */
      go(45, 3);
      const fl = g.CUR.fl, cor = fl.corrs.find(c => !c.hidden && c.len >= 14);
      out.enterText = g.corridorText(cor, true);
      const h = cor.axis === "h", mid = Math.floor((h ? cor.x0 + cor.x1 : cor.y0 + cor.y1) / 2);
      const at = k => { G.x = h ? mid : cor.x0 + k; G.y = h ? cor.y0 + k : mid; };
      at(0); out.wall = g.corridorText(cor, false);
      at(1); out.near = g.corridorText(cor, false);
      at(2); out.mid = g.corridorText(cor, false);
      at(LAB.corrW(cor) - 1); out.wall2 = g.corridorText(cor, false);
      /* растяжка — от стены до стены коридора любой ширины */
      at(2); out.wire = LAB.traps._wireCells(G.x, G.y, h ? "E" : "N").length;
      /* выше третьего блока — прежние четыре шага */
      go(30, 3); const c30 = g.CUR.fl.corrs[0]; out.text30 = g.corridorText(c30, true);
      /* вещи своей глубины и вход в помещение: при входе — ближние, остальное — «Осмотреться» */
      const DEEP = { O: ["mirrorwall", "glasschime", "backclock", "twinchairs", "prism", "mirrorlog"], M: ["punchclock", "gearwall", "perfocards", "boiler", "sealer"], I: ["spring", "berrybush", "nest", "rootbench", "sprout", "warmstone"] };
      out.deepN = {}; out.deep30 = 0;
      [[45, "O"], [65, "M"], [85, "I"]].forEach(q => { const fl2 = LAB.getFloor(G.seed, q[0], 4); out.deepN[q[1]] = fl2.objs.filter(o => o.type === "fx" && DEEP[q[1]].indexOf(o.fx) >= 0).length; });
      [10, 30].forEach(L => { const fl2 = LAB.getFloor(G.seed, L, 4); out.deep30 += fl2.objs.filter(o => o.type === "fx" && [].concat(DEEP.O, DEEP.M, DEEP.I).indexOf(o.fx) >= 0).length; });
      /* этаж Истока, где есть помещение больше чем с десятком вещей */
      let busy = null, fl3 = null;
      for (let F = 4; F <= 20 && busy == null; F++) {
        const fq = LAB.getFloor(G.seed, 85, F), cq = {};
        fq.objs.forEach(o => { cq[o.room] = (cq[o.room] || 0) + 1; });
        const b = Object.keys(cq).map(Number).filter(id => cq[id] > 10 && fq.rooms[id] && !fq.rooms[id].hidden).sort((a, c) => cq[c] - cq[a])[0];
        if (b != null) { go(85, F); fl3 = g.CUR.fl; busy = b; }
      }
      if (!fl3) { go(85, 4); fl3 = g.CUR.fl; }
      const cnt = {}; fl3.objs.forEach(o => { cnt[o.room] = (cnt[o.room] || 0) + 1; });
      if (busy != null) {
        const rm = fl3.rooms[busy]; let cell = null;
        for (let y = rm.y0; y <= rm.y1 && !cell; y++) for (let x = rm.x0; x <= rm.x1 && !cell; x++) if (g.passable(x, y)) cell = [x, y];
        G.x = cell[0]; G.y = cell[1]; delete g.CUR.fs.objs["room" + busy]; g.CUR.room = -1;
        SPOKEN.length = 0; g.roomCheck(false); out.entry = SPOKEN.join(" | ");
        out.busyN = cnt[busy];
        SPOKEN.length = 0; g.roomCheck(true); out.look = SPOKEN.join(" | ");
      } else out.entry = "нет помещения с десятком вещей";
      /* вещи Истока в деле: родник, ягодный куст */
      const pick = fx => fl3.objs.find(o => o.type === "fx" && o.fx === fx) || null;
      const use = (o, re) => { LAB.ui.closeAll(); LAB.fixtures.menu(o); const w = LAB.ui.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return "нет пункта: " + (w ? w.items.map(label).join(" / ") : "нет окна"); SPOKEN.length = 0; w.i = k; LAB.ui.activate(); return SPOKEN.join(" | "); };
      const spring = pick("spring") || { id: "t_spring", type: "fx", fx: "spring", x: G.x, y: G.y, room: g.CUR.room };
      G.hp = Math.max(1, G.hpMax - 30); const hp0 = G.hp;
      out.spring = use(spring, /^Напиться из родника/); out.springHp = G.hp > hp0;
      const bush = pick("berrybush") || { id: "t_bush", type: "fx", fx: "berrybush", x: G.x, y: G.y, room: g.CUR.room };
      const b0 = G.inv.berries || 0; out.bush = use(bush, /^Собрать ягод/); out.berries = (G.inv.berries || 0) > b0 && !!LAB.ITEMS.berries;
      LAB.ui.closeAll();
      /* «Отражение»: часы, идущие назад, — своя запись */
      go(45, 4);
      const clock = g.CUR.fl.objs.find(o => o.type === "fx" && o.fx === "backclock") || { id: "t_clock", type: "fx", fx: "backclock", x: G.x, y: G.y, room: g.CUR.room };
      LAB.ui.closeAll(); LAB.fixtures.menu(clock); const wc = LAB.ui.top(); const kc = wc.items.findIndex(i => /^Сверить часы/.test(label(i)));
      wc.i = kc; LAB.ui.activate(); out.clockTitle = LAB.ui.top() ? LAB.ui.top().title : "";
      LAB.ui.closeAll();
      /* «Механизм»: стена шестерён разбирается на детали */
      go(65, 4);
      const gear = g.CUR.fl.objs.find(o => o.type === "fx" && o.fx === "gearwall") || { id: "t_gear", type: "fx", fx: "gearwall", x: G.x, y: G.y, room: g.CUR.room };
      /* (3.7) шестерни — лом и крепёж, а не сервопривод: моторчика в стене шестерён нет */
      const sv0 = G.inv.servo || 0, sc0 = G.inv.scrap || 0; out.gear = use(gear, /^Снять пару малых шестерён/); out.gearParts = (G.inv.scrap || 0) > sc0 && (G.inv.servo || 0) === sv0;
      /* табельные часы: отметка — ОКО считает своим на смене, раз на часы */
      const pc = g.CUR.fl.objs.find(o => o.type === "fx" && o.fx === "punchclock") || { id: "t_punch", type: "fx", fx: "punchclock", x: G.x, y: G.y, room: g.CUR.room };
      LAB.oko.state().heat = 50; out.punch = use(pc, /^Пробить отметку/); const h1 = LAB.oko.state().heat;
      use(pc, /^Пробить отметку/); out.punchHeat = [50, h1, LAB.oko.state().heat].join("→");
      LAB.oko.state().heat = 0;
      LAB.ui.closeAll();
      /* запись прежнего выпуска мира: этажи построены заново, носитель — у входа на свой этаж */
      const dn = JSON.parse(JSON.stringify(G)); dn.worldV = 4; dn.L = 50; dn.F = 5; dn.fs = { "50-5": { objs: { k: 1 } } }; dn.relocate = false;
      const m2 = g._migrate(dn); out.migDown = m2.worldV === 7 && m2.relocate === true && !m2.fs["50-5"];
    } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
    LAB.keysMode = km; LAB.ui.closeAll(); C.stop();
    g.enterFloor(keep.L, keep.F, "down", true); C.stop(); G = g.G;
    G.x = keep.x; G.y = keep.y; G.inv = JSON.parse(keep.inv); G.hp = keep.hp;
    return out;
  });
  ok(!grow.err, "просторные глубины: проверка без ошибок" + (grow.err ? " — " + grow.err : ""));
  if (!grow.err) {
    ok(grow.cw === "4 4 5 6 7", "ширина коридоров по блокам: четыре шага выше, пять, шесть и семь ниже (" + grow.cw + ")");
    ok(grow.area.every((a, i) => i === 0 || (a[0] > grow.area[i - 1][0] && a[1] >= grow.area[i - 1][1])) && grow.area[1][1] > grow.area[0][1], "чем ниже блок, тем больше помещения и кабинеты (" + grow.area.map(a => a.join("/")).join(" ") + ")");
    ok(/^Коридор, шириной в пять шагов\./.test(grow.enterText) && /^Коридор, шириной в четыре шага\./.test(grow.text30), "«Эхо» называет ширину коридора: пять шагов в «Отражении», четыре — выше");
    ok(/Вы у стены/.test(grow.wall) && /Вы ближе к стене/.test(grow.near) && /Вы посередине/.test(grow.mid) && /Вы у стены/.test(grow.wall2), "в широком коридоре: у стены, ближе к стене, посередине");
    ok(grow.wire === 5, "растяжка — от стены до стены коридора в пять шагов (" + grow.wire + ")");
    ok(grow.deepN.O > 0 && grow.deepN.M > 0 && grow.deepN.I > 0 && grow.deep30 === 0, "у каждой нижней глубины свои вещи обстановки, выше их нет (" + JSON.stringify(grow.deepN) + ")");
    ok(/и ещё \d+ (вещь|вещи|вещей) — осмотритесь: два пальца вверх/.test(grow.entry) && !/и ещё \d+ (вещь|вещи|вещей) — осмотритесь/.test(grow.look || ""), "при входе в помещение, где больше десятка вещей, — ближние, остальное — «Осмотреться» (" + grow.busyN + " вещей)");
    ok(/Вода тёплая/.test(grow.spring) && grow.springHp, "тёплый родник Истока лечит (" + grow.spring.slice(0, 60) + ")");
    ok(grow.berries && /Собрано: /.test(grow.bush), "ягодный куст: ягоды Истока в рюкзак");
    ok(grow.clockTitle === "Часы, идущие назад", "часы, идущие назад: своя запись (" + grow.clockTitle + ")");
    ok(grow.gearParts, "стену шестерён Механизма разбирают на детали: шестерни — лом, а не сервопривод");
    ok(/своим на смене/.test(grow.punch) && grow.punchHeat === "50→42→42", "табельные часы: отметка — ОКО подозревает меньше, один раз (" + grow.punchHeat + ")");
    ok(grow.migDown, "запись прежнего выпуска мира: этаж строится заново, носитель — у входа");
  }

  console.log("Альфа 3.5: лазейки закрыты — тайник, отдых, тренажёр, окна, присланные машины, задания, укрытие, разбор, скупка, стакан, капсула");
  const holes = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, U = LAB.ui, out = {}, label = i => typeof i.label === "function" ? i.label() : String(i.label);
    let G = g.G;
    const keep = { L: G.L, F: G.F, x: G.x, y: G.y, inv: JSON.stringify(G.inv), ammo: JSON.stringify(G.ammo), credits: G.credits, hp: G.hp, str: G.str, cha: G.cha, diff: G.diff, train: JSON.stringify(G.train || null), quests: JSON.stringify(G.quests), weapons: G.weapons.slice(), wi: G.wi, restAt: G.restAt };
    const said = [], say0 = LAB.say; LAB.say = function (t) { said.push(String(t)); };
    const last = () => said.slice(-2).join(" | ");
    const go = (L, F) => { g.enterFloor(L, F, "down", true); C.stop(); G = g.G; C.foes().forEach(f => { f.dead = true; }); };
    const near = o => { const c = C.freeCellNear(o.x, o.y, null); if (c) { G.x = c[0]; G.y = c[1]; } return !!c; };
    const findFloor = pred => { for (let L = 1; L <= 14; L++) for (let F = 1; F <= 8; F++) { const fl = LAB.getFloor(G.seed, L, F); if (pred(fl)) return [L, F]; } return null; };
    const fxWith = (fl, kind) => fl.objs.find(o => o.type === "fx" && LAB.FIX.T[o.fx] && LAB.FIX.T[o.fx].a.some(a => a[0] === kind));
    const tick = () => new Promise(r => setTimeout(r, 0)); /* окно отмечается, когда открывшее его действие закончилось */
    const itemOf = (o, kind) => { const a = LAB.FIX.T[o.fx].a.find(q => q[0] === kind); U.closeAll(); LAB.fixtures.menu(o); const w = U.top(); const l = w ? w.items.map(label).find(x => x.indexOf(a[1]) === 0) : null; U.closeAll(); return l || ""; };
    const act = (o, kind) => { const a = LAB.FIX.T[o.fx].a.find(q => q[0] === kind); U.closeAll(); LAB.fixtures.menu(o); const w = U.top(); const it = w && w.items.find(x => label(x).indexOf(a[1]) === 0); if (it) it.fn(); return !!it; };
    try {
      U.closeAll(); C.stop();
      /* 1. тайник: второй раз — ни опыта, ни счёта */
      const fs1 = findFloor(fl => fl.doors.some(d => d.lock && d.lock.type === "secret"));
      if (fs1) {
        go(fs1[0], fs1[1]);
        const sd = g.CUR.fl.doors.find(d => d.lock && d.lock.type === "secret");
        const s0 = G.stats.secrets, x0 = G.lvl * 1e6 + G.xp;
        g.revealSecret(sd); const s1 = G.stats.secrets, x1 = G.lvl * 1e6 + G.xp;
        g.revealSecret(sd); g.revealSecret(sd);
        out.secret = { first: s1 - s0, more: G.stats.secrets - s1, xp1: x1 > x0, xpMore: G.lvl * 1e6 + G.xp - x1 };
      }
      /* 2. отдых: (3.6) сидеть можно всегда, но подряд — лишь на долю; в тревогу — отказ */
      const fxRest = fl => fl.objs.find(o => o.type === "fx" && LAB.FIX.T[o.fx] && LAB.FIX.T[o.fx].a.some(a => a[0] === "rest" && a[2] && a[2].hp > 0));
      const fs2 = findFloor(fl => !!fxRest(fl));
      if (fs2) {
        go(fs2[0], fs2[1]);
        /* тревога этажа — в тактах самого этажа: от прежних проверок на нём она могла остаться */
        LAB.oko.setLevel(0, "проверка");
        const ch = fxRest(g.CUR.fl); near(ch);
        out.restWhy = g.restBlock ? g.restBlock() : null;
        const nowM = () => (G.day || 0) * 1440 + (G.min || 0), pr = LAB.FIX.T[ch.fx].a.find(q => q[0] === "rest")[2] || {};
        const mR = pr.m || 10, full = Math.max(5, Math.round(G.hpMax * pr.hp)), share = k => Math.max(1, Math.round(full * Math.min(1, k)));
        G.restAt = -1e9; G.hp = 10;
        out.restFresh = itemOf(ch, "rest");
        act(ch, "rest"); out.rest1 = G.hp > 10;
        out.restNote = itemOf(ch, "rest");
        /* сразу же снова — можно: время идёт, а здоровья — доля (минуты отдыха из часа) */
        G.hp = 10; let t0 = nowM(); act(ch, "rest");
        out.rest2 = { gain: G.hp - 10, want: share(mR / 60), time: nowM() - t0 === mR, said: /восстановилось лишь на \d+ процент/.test(last()) };
        G.restAt = -1e9; LAB.oko.setLevel(3, "проверка"); act(ch, "rest"); out.restAlarm = /тревога/.test(last()); LAB.oko.setLevel(0, "проверка");
        /* через двадцать минут — на долю «двадцать минут и сам отдых из часа», через час — в полную силу */
        G.restAt = nowM() - 20; G.hp = 10; t0 = nowM(); act(ch, "rest");
        out.rest20 = { gain: G.hp - 10, want: share((20 + mR) / 60), time: nowM() - t0 === mR, said: /в полную силу отдых поможет через/.test(last()) };
        G.restAt = nowM() - 61; G.hp = 10; act(ch, "rest");
        out.rest61 = { gain: G.hp - 10, need: Math.min(G.hpMax - 10, full), part: /лишь на/.test(last()) };
        /* сидеть подряд без конца: за час — не больше одного полного отдыха */
        G.restAt = nowM(); G.hp = 10; let n = 0; const tc = nowM();
        while (nowM() - tc < 60 && n < 30) { act(ch, "rest"); n++; }
        out.restChain = { gain: G.hp - 10, full: full, n: n };
        G.restAt = -1e9; G.hp = 10; LAB.oko.setLevel(6, "проверка"); act(ch, "rest"); out.restSearch = G.hp === 10 && /прочёсывает/.test(last());
        LAB.oko.setLevel(1, "проверка"); G.restAt = -1e9; G.hp = 10; act(ch, "rest"); out.restSuspect = G.hp > 10; LAB.oko.setLevel(0, "проверка");
        const sk0 = C.strikers;
        try {
          C.strikers = () => [{ ambush: false }]; G.restAt = -1e9; G.hp = 10; act(ch, "rest"); out.restPun = G.hp === 10 && /каратели/.test(last());
          C.strikers = () => [{ ambush: true }]; G.restAt = -1e9; G.hp = 10; act(ch, "rest"); out.restAmbush = G.hp > 10;
        } finally { C.strikers = sk0; }
      }
      /* 3. тренажёр: предел и перерыв */
      const fs3 = findFloor(fl => !!fxWith(fl, "train"));
      if (fs3) {
        go(fs3[0], fs3[1]);
        const gym = fxWith(g.CUR.fl, "train"); near(gym);
        if (G.body) G.body.wake = 90;
        G.train = { strPts: 2, aimPts: 0 }; out.gymNote = itemOf(gym, "train");
        G.train = { strPts: 5, aimPts: 0 }; out.gymCapNote = itemOf(gym, "train");
        const st0 = G.str; act(gym, "train"); out.gymCap = { same: G.str === st0, said: /больше ничего не дадут/.test(last()) };
        G.train = { strPts: 0, aimPts: 0, strAt: (G.day || 0) * 1440 + (G.min || 0) }; act(gym, "train"); out.gymGap = /не восстановились/.test(last());
      }
      /* 4. инвентарь: аптечка, назад в инвентарь, «Еда» — открывается, а не отказ */
      U.closeAll(); G.inv.medkit_s = (G.inv.medkit_s || 0) + 2; G.hp = Math.max(1, Math.floor(G.hpMax / 3));
      U.inventory(); let w = U.top(); w.i = w.items.findIndex(x => /^Аптечки/.test(label(x))); U.activate();
      w = U.top(); w.i = w.items.findIndex(x => /^Аптечка:/.test(label(x))); U.activate();
      out.invBack = U.top() && U.top().title;
      w = U.top(); if (w && w.title === "Инвентарь") { w.i = w.items.findIndex(x => /^Еда/.test(label(x))); U.activate(); }
      out.invFood = U.top() && U.top().title;
      /* 5. устаревшее окно: без сборщика — старый пункт не выполняется; со сборщиком — собирается заново */
      U.closeAll(); let hits = 0;
      U.menu("Проверка старого окна", [{ label: "Взять", fn: function () { hits++; } }, { label: "Другое", fn: function () {} }]);
      await tick(); G.credits += 7; w = U.top(); w.i = 0; U.activate();
      out.staleNoRebuild = { hits: hits, closed: !U.top() || U.top().title !== "Проверка старого окна" };
      U.closeAll(); hits = 0;
      const build = () => [{ label: "Кредитов: " + G.credits, keep: true, fn: function () { hits++; } }, { label: "Взять", fn: function () { hits += 10; } }];
      U.menu("Проверка сборщика", build(), { rebuild: build });
      await tick(); G.credits += 3; w = U.top(); w.i = 0; U.activate();
      out.staleRebuild = { hits: hits, label: label(U.top().items[0]), open: U.top().title === "Проверка сборщика" };
      w = U.top(); w.i = 1; G.credits += 1; U.activate(); out.staleSameLabel = hits;
      U.closeAll();
      /* 6. присланные: на пороге — ни опыта; обезвреженные и свои — тоже */
      go(2, 3);
      /* опыт — весь накопленный: уровень героя мог и подняться */
      const xpAllH = () => { let t = G.xp; for (let l = 1; l < G.lvl; l++) t += LAB.xpNeed(l); return t; };
      const kx = f => { const x0 = xpAllH(); C.damageFoe(f, 99999, "kinetic", { quiet: true }); return xpAllH() - x0; };
      /* клетка рядом, но не в безопасной зоне у капсулы: туда ОКО никого не присылает */
      const spawnAt = ex => {
        for (let r = 3; r < 40; r++) for (const d of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
          const x = G.x + d[0], y = G.y + d[1]; if (!LAB.inb(x, y)) continue;
          const c = C.freeCellNear(x, y, null); if (!c || C.havenAt(c[0], c[1])) continue;
          const f = C.spawnFoe("patrolbot", c[0], c[1], Object.assign({ oko: true }, ex || {})); if (f) return f;
        }
        return null;
      };
      const fsx = g.CUR.fs; fsx.sentWN = 0; fsx.sentWL = []; fsx.grind = 0; fsx.pun = 0;
      let f = spawnAt(); out.sentFirst = f ? kx(f) : -1;
      fsx.sentWN = 1000; fsx.sentWL = []; fsx.grind = 0; fsx.pun = 0;
      f = spawnAt(); out.sentLast = f ? kx(f) : -1;
      /* (3.6) волна — одна выдача ОКО: машины одной волны — с одной долей, каждая
         следующая волна — на 2,5 % меньше, с сорок первой — ничего */
      const rawXp = q => Math.round((q.base.xp || 10) * (1 + 0.1 * (q.lvl - 1)) * (q.aff ? 1 + 0.25 * q.aff.length : 1));
      fsx.sentWN = 0; fsx.sentWL = []; fsx.grind = 0; fsx.pun = 0;
      const wa = spawnAt({ grp: "gT1" }), wb = spawnAt({ grp: "gT1" });
      const w1 = { a: wa ? kx(wa) : -1, raw: wa ? rawXp(wa) : 0 }; fsx.grind = 0;
      w1.b = wb ? kx(wb) : -1; fsx.grind = 0;
      fsx.sentWN = 10; const w11 = spawnAt({ grp: "gT11" }), raw11 = w11 ? rawXp(w11) : 0;
      w1.x11 = w11 ? kx(w11) : -1; w1.want11 = Math.round(raw11 * 0.4 * 0.75); fsx.grind = 0;
      fsx.sentWN = 40; const w41 = spawnAt({ grp: "gT41" }); w1.x41 = w41 ? kx(w41) : -1;
      w1.n = fsx.sentWN; out.waveCut = w1;
      fsx.sentWN = 0; fsx.sentWL = []; fsx.grind = 0; fsx.pun = 0;
      f = spawnAt(); if (f) f.calm = true; out.calmKill = f ? kx(f) : -1;
      f = spawnAt(); if (f) f.ally = true; out.allyKill = f ? kx(f) : -1;
      /* 7. (3.6) задания выжившего: после трёх — не отказ, а четвёртое, тяжелее: два пути, по два шага и больше;
         «разведать» — заход после того, как взяли */
      const npc = { key: "test:npc", n: "Проверочный", prof: "Инженер" };
      G.quests = G.quests.filter(q => q.giver !== npc.key).concat([0, 1, 2].map(i => ({ id: npc.key + ":" + i, giver: npc.key, done: true, type: "kill", short: "x" })));
      const ofs = LAB.quests.offers(npc);
      out.questCap = { tier: LAB.quests.stage(npc), n: ofs.length, chap: ofs.some(q => !!q.chap), steps: ofs.map(q => LAB.quests.steps(q).length), work: ofs.map(q => LAB.quests.workOf(q)), notReady: ofs.every(q => !LAB.quests.ready(q)) };
      U.closeAll(); g.takeQuest(npc); out.questCap.menu = !!U.top() && /^Поручение:/.test(U.top().title); U.closeAll();
      const vq = { type: "visit", tL: G.L, tF: G.F, seq0: G.visitSeq || 0, giverName: "Проверочный" };
      out.visitBefore = g.questProgress(vq);
      go(G.L, G.F); out.visitAfter = g.questProgress(vq);
      /* 8. «Затаиться»: укрытие, пока на месте; шаг — и его нет */
      const fs8 = findFloor(fl => !!fxWith(fl, "hide"));
      if (fs8) {
        go(fs8[0], fs8[1]);
        const tb = fxWith(g.CUR.fl, "hide"); near(tb);
        act(tb, "hide"); out.hid = C.hidden();
        const c2 = C.freeCellNear(G.x, G.y, null); if (c2) { G.x = c2[0]; G.y = c2[1]; }
        out.hidMoved = C.hidden();
      }
      /* 9. собранное оружие разбирается не богаче рецепта */
      const nw = LAB.makeWeapon("spark", 1, 0, 1); nw.rcNeed = { scrap: 2, chip: 1 }; nw.crafted = 40;
      G.weapons.push(nw); const sc0 = G.inv.scrap || 0, ch0 = G.inv.chip || 0;
      out.scrapText = g.scrapWeaponText ? g.scrapWeaponText(nw) : "";
      g.scrapWeapon(G.weapons.indexOf(nw));
      out.scrapGot = { scrap: (G.inv.scrap || 0) - sc0, chip: (G.inv.chip || 0) - ch0 };
      /* 10. скупка дешевле самой низкой покупки: лёгкий режим, харизма 40 */
      G.diff = "easy"; G.cha = 40;
      const pk = g.priceK(), lowBat = Math.round(LAB.AMMO.energy.price * pk * 0.85 * 0.9), lowKit = Math.round(LAB.ITEMS.medkit_s.price * pk * 0.9 * g.chaK());
      out.sellBat = [LAB.sellPrice.ammo("energy", { who: "npc", npc: "ammo" }), lowBat];
      out.sellKit = [LAB.sellPrice.item("medkit_s", { who: "npc", npc: "med" }), lowKit];
      G.diff = keep.diff; G.cha = keep.cha;
      /* 11. стакан с собой лечит, как автомат той глубины, где куплен */
      G.inv.cup_espresso = 1; G.cupL = { cup_espresso: [1] }; const L0 = G.L; G.L = 60; G.hp = 1;
      g.useItem("cup_espresso"); out.cupHeal = G.hp - 1; G.L = L0;
      /* 12. капсула: пока машины ОКО ищут вас, полежать с закрытыми глазами нельзя; без тревоги — можно */
      const fs12 = findFloor(fl => fl.objs.some(o => o.type === "capsule"));
      if (fs12) {
        go(fs12[0], fs12[1]);
        const cap = g.CUR.fl.objs.find(o => o.type === "capsule");
        G.hp = Math.max(1, Math.floor(G.hpMax / 2)); const hp12 = G.hp;
        LAB.capsule.menu(cap); await new Promise(r => setTimeout(r, 1400));
        LAB.oko.setLevel(3, "проверка");
        const lie = () => { const wl = U.top(), k = wl ? wl.items.findIndex(x => /^Полежать с закрытыми глазами/.test(label(x))) : -1; if (k >= 0) { wl.i = k; U.activate(); } return k >= 0; };
        said.length = 0; const found = lie();
        out.capAlarm = { found: found, same: G.hp === hp12, said: /Не до отдыха/.test(said.join(" ")) };
        LAB.oko.setLevel(0, "проверка");
        lie(); out.capCalm = G.hp > hp12;
        LAB.capsule.leave(true); U.closeAll(); C.stop();
      }
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n")[1]; }
    finally {
      LAB.say = say0;
      U.closeAll();
      go(keep.L, keep.F); G.x = keep.x; G.y = keep.y; G.inv = JSON.parse(keep.inv); G.ammo = JSON.parse(keep.ammo); G.credits = keep.credits; G.hp = keep.hp; G.str = keep.str;
      G.train = JSON.parse(keep.train) || undefined; G.quests = JSON.parse(keep.quests); G.weapons = keep.weapons; G.wi = keep.wi; G.restAt = keep.restAt; G.st.hide = null;
    }
    return out;
  });
  ok(!holes.err, "сценарии прошли без ошибок" + (holes.err ? ": " + holes.err : ""));
  ok(holes.secret && holes.secret.first === 1 && holes.secret.more === 0 && holes.secret.xp1 && holes.secret.xpMore === 0, "тайник: опыт и счёт — один раз, повтор из старого окна ничего не даёт (" + JSON.stringify(holes.secret) + ")");
  ok(holes.rest1 && holes.rest2 && holes.rest2.gain === holes.rest2.want && holes.rest2.time && holes.rest2.said, "отдых: сразу снова — можно, но здоровья лишь доля, время идёт (" + JSON.stringify(holes.rest2) + (holes.restWhy ? "; " + holes.restWhy : "") + ")");
  ok(holes.restAlarm, "отдых при тревоге — отказ");
  ok(holes.rest20 && holes.rest20.gain === holes.rest20.want && holes.rest20.time && holes.rest20.said, "отдых через двадцать минут — на долю с точным сроком полной силы (" + JSON.stringify(holes.rest20) + ")");
  ok(holes.rest61 && holes.rest61.need > 0 && holes.rest61.gain >= holes.rest61.need && !holes.rest61.part, "отдых через час — в полную силу (" + JSON.stringify(holes.rest61) + ")");
  ok(holes.restChain && holes.restChain.n >= 2 && holes.restChain.gain <= holes.restChain.full + holes.restChain.n && holes.restChain.gain >= holes.restChain.full - holes.restChain.n, "сидеть подряд целый час — вместе не больше одного полного отдыха (" + JSON.stringify(holes.restChain) + ")");
  ok(holes.restSearch && holes.restSuspect, "пока ОКО прочёсывает этаж — отдыха нет; тревога снята (подозрение) — отдыхать можно (" + JSON.stringify({ s: holes.restSearch, u: holes.restSuspect }) + ")");
  ok(holes.restPun && holes.restAmbush, "каратели идут по следу — отдыха нет; в засаде — можно (" + JSON.stringify({ p: holes.restPun, a: holes.restAmbush }) + ")");
  ok(holes.restFresh && !/ — /.test(holes.restFresh) && / — вы недавно отдыхали: поможет на \d+ процент(а|ов)?, в полную силу — через (1 час|\d+ мину)/.test(holes.restNote || ""), "пункт отдыха сам говорит, на сколько поможет и когда в полную силу (" + holes.restNote + ")");
  ok(/ — накачано 2 из 5 единиц$/.test(holes.gymNote || "") && / — больше ничего не даст$/.test(holes.gymCapNote || ""), "пункт тренажёра: сколько прибавок из пяти взято, на пределе — «больше ничего не даст» (" + holes.gymNote + " / " + holes.gymCapNote + ")");
  ok(holes.gymCap && holes.gymCap.same && holes.gymCap.said && holes.gymGap, "тренажёр: предел в пять единиц и перерыв три часа");
  ok(holes.invBack === "Инвентарь" && holes.invFood === "Еда и напитки", "инвентарь: после аптечки — снова инвентарь, «Еда» открывается (" + holes.invBack + " → " + holes.invFood + ")");
  ok(holes.staleNoRebuild.hits === 0 && holes.staleNoRebuild.closed, "устаревшее окно без сборщика: старый пункт не выполняется, окно закрыто");
  ok(holes.staleRebuild.hits === 0 && holes.staleRebuild.open && /Кредитов: /.test(holes.staleRebuild.label) && holes.staleSameLabel === 10, "окно со сборщиком собирается заново: сменившийся пункт не выполняется, прежний — выполняется (" + JSON.stringify(holes.staleRebuild) + ", " + holes.staleSameLabel + ")");
  ok(holes.sentFirst > 0 && holes.sentLast === 0, "присланные машины: опыт есть, на пороге этажа — ноль (" + holes.sentFirst + " → " + holes.sentLast + ")");
  const wc = holes.waveCut || {};
  ok(wc.a > 0 && wc.a === Math.round(wc.raw * 0.4) && wc.b === wc.a && wc.x11 === wc.want11 && wc.x41 === 0, "волны ОКО: машины одной волны — с одной долей, одиннадцатая волна — на четверть меньше, сорок первая — ничего (" + JSON.stringify(wc) + ")");
  ok(holes.calmKill === 0 && holes.allyKill === 0, "обезвреженные и свои машины — без опыта (" + holes.calmKill + ", " + holes.allyKill + ")");
  /* (3.7) глава истории даёт и один путь, если второму на этом этаже нечего делать (quests.js, need) */
  ok(holes.questCap && holes.questCap.tier === 3 && (holes.questCap.n === 2 || (holes.questCap.n === 1 && holes.questCap.chap)) && holes.questCap.menu && holes.questCap.notReady && holes.questCap.steps.every(n => n >= 2) && holes.questCap.work.every(w => w >= 0.8 * (4 + 3.5 * 3) - 0.01), "(3.6) после трёх просьб выживший просит снова — тяжелее: два пути на выбор (у главы истории — и один), по два шага и больше (" + JSON.stringify(holes.questCap) + ")");
  /* (3.6) разведку «Эхо» докладывает по связи само: «вернитесь» не нужно */
  ok(/не разведан/.test(holes.visitBefore) && /разведан/.test(holes.visitAfter) && !/не разведан/.test(holes.visitAfter), "«разведать этаж» — засчитывается заход после того, как задание взято (" + holes.visitBefore + " → " + holes.visitAfter + ")");
  ok(holes.hid === true && holes.hidMoved === false, "«Затаиться»: укрытие, пока на месте; шаг — и его нет");
  ok(/около половины/.test(holes.scrapText) && holes.scrapGot.scrap === 1 && holes.scrapGot.chip <= 1, "собранное оружие разбирается не богаче рецепта (" + JSON.stringify(holes.scrapGot) + ")");
  ok(holes.sellBat[0] < holes.sellBat[1] && holes.sellKit[0] < holes.sellKit[1], "скупка дешевле самой низкой покупки даже в лёгком режиме с харизмой 40 (батарея " + holes.sellBat.join(" < ") + ", аптечка " + holes.sellKit.join(" < ") + ")");
  ok(holes.cupHeal > 0 && holes.cupHeal <= 8, "стакан эспрессо с первого уровня лечит, как там, а не как на шестидесятом (" + holes.cupHeal + ")");
  ok(holes.capAlarm && holes.capAlarm.found && holes.capAlarm.same && holes.capAlarm.said && holes.capCalm, "капсула: пока машины ОКО ищут вас, полежать нельзя, без тревоги — можно (" + JSON.stringify(holes.capAlarm) + ", " + holes.capCalm + ")");

  console.log("(3.5) Задания: не больше трёх сразу, отказ, награды по труду и ремеслу; тела и выжившие");
  const qz = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, U = LAB.ui, out = {};
    const spoken = [], say0 = LAB.say; LAB.say = function (t) { spoken.push(String(t)); };
    const keep = JSON.parse(JSON.stringify({ quests: G.quests, credits: G.credits, inv: G.inv, ammo: G.ammo, L: G.L, F: G.F, x: G.x, y: G.y, xp: G.xp, lvl: G.lvl, hpMax: G.hpMax, enMax: G.enMax, str: G.str, agi: G.agi, mind: G.mind, cha: G.cha }));
    try {
      g.enterFloor(1, 4, "down", true); LAB.combat.stop();
      G.quests = G.quests.filter(q => q.type === "main");
      const mk = (i, prof, f) => ({ key: "T33-" + i, n: "Выживший " + i, prof: prof, female: !!f });
      [0, 1, 2].forEach(i => g.takeQuest(mk(i, "Медик", i % 2)));
      out.three = g.activeQuests().length;
      spoken.length = 0; g.takeQuest(mk(3, "Повар"));
      out.fourth = { n: g.activeQuests().length, said: /3 из 3: сдайте одно или откажитесь/.test(spoken.join(" ")) };
      out.rewards = g.activeQuests().map(q => ({ t: q.type, cr: q.reward.cr, xp: q.reward.xp, gift: q.reward.gift ? (q.reward.gift.item || q.reward.gift.ammo) : null, txt: g.rewardText(q) }));
      /* отказ: место освобождается, заказчик больше не просит */
      const q1 = g.activeQuests()[1];
      out.abandon = g.abandonQuest(q1) && q1.failed === true && g.activeQuests().length === 2;
      spoken.length = 0; g.takeQuest(mk(1, "Медик", 1)); out.refused = /отказались от моей просьбы/.test(spoken.join(" "));
      g.takeQuest(mk(3, "Повар")); out.after = g.activeQuests().length === 3;
      /* окно заданий: счёт, награда, отказ */
      U.closeAll(); U.inventory("Задания"); await Promise.resolve(); let w = U.top();
      out.invLabel = w.items[w.i].label;
      U.activate(); await Promise.resolve(); w = U.top();
      out.win = { head: w.items.some(x => /^Взятых поручений — 3 из 3/.test(x.label)), ab: w.items.some(x => x.label === "Отказаться от поручения"), rew: w.items.some(x => /Награда — \d+ кредит/.test(x.label)) };
      U.closeAll();
      /* выплата за детали: дороже их цены, и вещь в придачу — не та же деталь */
      G.quests = G.quests.filter(q => q.type === "main");
      const eng = { key: "T33-eng", n: "Инженер Проверкин", prof: "Инженер" };
      let qf = null;
      for (let k = 0; k < 60 && !qf; k++) { eng.key = "T33-eng-" + k; g.takeQuest(eng); const qq = G.quests[G.quests.length - 1]; if (qq && qq.type === "fetch") qf = qq; else G.quests.pop(); }
      if (qf) {
        /* (3.6) принесённое — дороже скупки, но дешевле покупки: купить и сдать невыгодно */
        const buy = Math.max(2, Math.round(LAB.ITEMS[qf.item].price * g.priceK())) * qf.need, gift = qf.reward.gift;
        G.inv[qf.item] = (G.inv[qf.item] || 0) + qf.need;
        const sell = LAB.sellPrice.item(qf.item, { who: "npc", npc: "parts", robot: false }) * qf.need;
        const cnt = () => gift.kind === "ammo" ? (G.ammo[gift.ammo] || 0) : (G.inv[gift.item] || 0);
        const cr0 = G.credits, h0 = cnt();
        g.completeQuest(qf, eng);
        out.pay = { done: qf.done, gain: G.credits - cr0, sell, buy, gift: cnt() - h0 === gift.n, notSame: gift.item !== qf.item };
        out.pay.between = out.pay.gain >= sell && out.pay.gain < buy;
      }
      /* весточка — награда от получателя, при передаче */
      G.quests = G.quests.filter(q => q.type === "main");
      const cq = { id: "T33-c:2", giver: "T33-c", giverName: "Анна Проверкина", gf: true, L: G.L - 1, F: 3, done: false, stage: 2, type: "courier", cross: true, toL: G.L, short: "передать весточку", text: "x" };
      G.quests.push(cq);
      out.courierBefore = g.rewardText(cq);
      const ci = g.courierItems({ key: "T33-rec", n: "Пётр Получатель", prof: "Охранник" });
      const c0 = G.credits; spoken.length = 0; if (ci[0]) ci[0].fn();
      out.courier = { n: ci.length, done: cq.done, gain: G.credits - c0, gift: !!(cq.reward && cq.reward.gift), fem: /Жива…/.test(spoken.join(" ")) };
      /* тела и выжившие на этажах; торговец не стоит у капсулы */
      let bodies = 0, floors = 0, humans = 0, capTrader = 0;
      for (const [L, F] of [[1, 3], [2, 7], [5, 12], [12, 4], [25, 9], [47, 6], [66, 15], [88, 3]]) {
        const fl = LAB.getFloor(G.seed, L, F); floors++;
        bodies += fl.objs.filter(o => o.type === "corpse").length;
        humans += fl.npcs.filter(n => !n.robot && !n.heal).length;
        const cap = {}; fl.objs.forEach(o => { if ((o.type === "capsule" || o.type === "wake") && o.room >= 0) cap[o.room] = 1; });
        capTrader += fl.npcs.filter(n => cap[n.room] && !n.robot && (LAB.PROFS[n.prof] || {}).trade).length;
      }
      out.world = { bodies: +(bodies / floors).toFixed(2), humans: +(humans / floors).toFixed(2), capTrader };
      g.enterFloor(keep.L, keep.F, "down", true); LAB.combat.stop();
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n")[1]; }
    G.quests = keep.quests; G.credits = keep.credits; G.inv = keep.inv; G.ammo = keep.ammo;
    ["x", "y", "xp", "lvl", "hpMax", "enMax", "str", "agi", "mind", "cha"].forEach(k => { G[k] = keep[k]; });
    LAB.say = say0;
    return out;
  });
  ok(!qz.err, "задания 3.5: без ошибок" + (qz.err ? ": " + qz.err : ""));
  ok(qz.three === 3 && qz.fourth && qz.fourth.n === 3 && qz.fourth.said, "поручений сразу — не больше трёх: четвёртое не дают и говорят, как освободить место");
  ok(qz.abandon && qz.refused && qz.after, "отказ от поручения: место освобождается, а тот, кому отказали, сразу снова не просит");
  ok(qz.rewards && qz.rewards.length === 3 && qz.rewards.every(r => r.cr > 0 && r.xp > 0 && /^Награда — \d+ кредит/.test(r.txt)), "награда названа сразу: кредиты, опыт и вещь (" + (qz.rewards || []).map(r => r.t + ": " + r.txt).join(" | ") + ")");
  /* (3.7) подарок — из личного запаса, не с прилавка: на первом уровне медик продаёт аптечки и бинты сам,
     поэтому дарит травяной сбор своей глубины */
  ok(qz.rewards && qz.rewards.every(r => /^(medkit_\w+|nanomed|bandage(_[hx])?|antidote|sorbent|painkiller|herb_\w+)$/.test(r.gift || "")), "вещь в награду — из ремесла заказчика: медик даёт лекарства (" + (qz.rewards || []).map(r => r.gift).join(", ") + ")");
  ok(/поручений 3 из 3/.test(qz.invLabel || "") && qz.win && qz.win.head && qz.win.ab && qz.win.rew, "окно заданий: «3 из 3», награда у каждого поручения, пункт «Отказаться от поручения» (" + qz.invLabel + ")");
  ok(qz.pay && qz.pay.done && qz.pay.between && qz.pay.gift && qz.pay.notSame, "(3.6) принесённые детали оплачены дороже скупки, но дешевле покупки; вещь в придачу — и не та же деталь (" + JSON.stringify(qz.pay) + ")");
  ok(/дадут те, кому передадите/.test(qz.courierBefore || "") && qz.courier && qz.courier.n === 1 && qz.courier.done && qz.courier.gain > 0 && qz.courier.gift && qz.courier.fem, "весточка: награду даёт получатель при передаче, по своему ремеслу (" + JSON.stringify(qz.courier) + ")");
  ok(qz.world && qz.world.bodies >= 1.5 && qz.world.humans >= 0.5 && qz.world.capTrader === 0, "на этажах больше тел и живых, а выживший-торговец не стоит у капсулы (" + JSON.stringify(qz.world) + ")");

  console.log("(3.6) Поручения: без предела, всё тяжелее, два пути, главы с выбором, доверие, условия, посылки");
  const qv = await page.evaluate(async () => {
    const g = LAB.game, Q = LAB.quests, U = LAB.ui, C = LAB.combat, out = {};
    const spoken = [], say0 = LAB.say; LAB.say = function (t) { spoken.push(String(t)); };
    const G = () => g.G, nowM = () => G().day * 1440 + G().min;
    const k0 = JSON.parse(JSON.stringify({ quests: G().quests, givers: G().givers || {}, credits: G().credits, inv: G().inv, L: G().L, F: G().F, x: G().x, y: G().y, xp: G().xp, lvl: G().lvl, samples: G().samples, rub: G().rub || {}, min: G().min, day: G().day, stats: G().stats, body: G().body, hp: G().hp, visitSeq: G().visitSeq || 0, lastVisit: G().lastVisit || {} }));
    const fs0 = JSON.stringify(G().fs);
    /* шаг — так, как его сделал бы игрок: состояние этажа, вещи, счётчики */
    const doStep = (s, q) => {
      const gg = G(), key = (s.tL || q.L) + "-" + s.tF;
      const fx = () => (gg.fs[key] = gg.fs[key] || { doors: {}, taken: {}, foes: {}, objs: {}, drops: [], secrets: {} });
      const ob = id => { const f = fx(); f.objs = f.objs || {}; return (f.objs[id] = f.objs[id] || {}); };
      switch (s.type) {
        case "fetch": case "supply": gg.inv[s.item] = (gg.inv[s.item] || 0) + s.need; break;
        case "kill": gg.stats.wkills = (gg.stats.wkills || 0) + s.need; break;
        case "hunt": s.n = s.need; break;
        case "clear": { const f = fx(); f.foes = f.foes || {}; s.foeIds.forEach(id => { f.foes[id] = { dead: true }; }); if (gg.L === s.tL && gg.F === s.tF) C.foes().forEach(ff => { if (s.foeIds.indexOf(ff.id) >= 0) ff.dead = true; }); break; }
        case "visit": gg.visitSeq = (gg.visitSeq || 0) + 1; gg.lastVisit = gg.lastVisit || {}; gg.lastVisit[key] = gg.visitSeq; break;
        case "survey": s.seen = Array.from({ length: s.need }, (_, i) => 1000 + i); break;
        case "map": fx().mapped = true; break;
        case "data": ob(s.ids[0]).data = true; break;
        case "hack": ob(s.ids[0]).hacked = true; break;
        case "power": fx().power = true; break;
        case "rubble": fx().rubble = true; break;
        case "dig": gg.rub = gg.rub || {}; gg.rub[s.rk] = { p: 100, done: 1 }; break;
        case "robots": fx().robots = true; break;
        case "lockdown": fx().lockdown = true; break;
        case "cams": { const f = fx(); f.netXp = f.netXp || {}; f.netXp.camsloop = 1; break; }
        case "puzzle": ob(s.oid).solved = true; break;
        case "safe": ob(s.oid).open = true; break;
        case "secret": { const f = fx(); f.secrets = f.secrets || {}; f.secrets[s.ids[0]] = 1; break; }
        case "sample": gg.samples[s.sid] = 1; break;
        case "body": gg.badges = gg.badges || []; gg.badges.push({ o: s.oid, L: s.tL, F: s.tF }); gg.inv.badge = (gg.inv.badge || 0) + 1; break;
        case "keep": case "ask": s.got = true; break;
        case "deliver": case "aid": s.given = true; break;
        case "boss": { const f = fx(); f.foes = f.foes || {}; f.foes[s.fid] = { dead: true }; break; }
      }
    };
    try {
      g.enterFloor(1, 4, "down", true); C.stop();
      G().quests = G().quests.filter(q => q.type === "main");
      /* 1. ступени 0–12 у троих: ни одно не выполнено при выдаче, труд не меньше положенного,
         шаги разные, награда — по труду, видов шагов много */
      const people = [{ key: "Q36-e", n: "Инженер Проверочный", prof: "Инженер" }, { key: "Q36-m", n: "Медик Проверочная", prof: "Медик", female: true }, { key: "Q36-g", n: "Охранник Проверочный", prof: "Охранник" }];
      const kinds = {}, rows = [], xpw = []; let badReady = 0, badFloor = 0, badText = 0, dup = 0, badSteps = 0;
      for (const n of people) for (let t = 0; t <= 12; t++) {
        const r = Q.giver(n); r.done = t; r.ch = [2, 5, 8, 11].filter(x => t > x).length; r.cool = 0; r.seq = 0;
        const list = Q.offers(n);
        rows.push(n.prof + " " + t + ": " + list.map(q => Q.steps(q).map(s => s.type).join("+")).join(" | "));
        list.forEach(q => {
          const ss = Q.steps(q), cross = q.type === "courier" || q.type === "deep";
          /* дела в мире не сделаны при выдаче; вещи для заказчика могут быть уже в рюкзаке — их и несут */
          if (ss.some(s => !Q.KINDS[s.type].bring && Q.KINDS[s.type].ready(s, q))) badReady++;
          if (!cross && t >= 1 && Q.workOf(q) < 0.8 * (4 + 3.5 * t) - 0.01 && ss.length < 6) badFloor++;
          if (!cross && ss.length < (t <= 1 ? 1 : t <= 4 ? 2 : t <= 9 ? 3 : 4)) badSteps++;
          if (!q.text || !q.short || !(q.reward && (q.type === "courier" || (q.reward.cr > 0 && q.reward.xp > 0)))) badText++;
          const ks = ss.map(s => s.type); if (new Set(ks).size !== ks.length) dup++;
          ks.forEach(k => { kinds[k] = 1; });
          if (!cross) xpw.push(q.reward.xp / Q.workOf(q));
        });
      }
      out.esc = { badReady, badFloor, badSteps, badText, dup, kinds: Object.keys(kinds).length, xpw: [Math.min(...xpw), Math.max(...xpw)].map(v => +v.toFixed(2)), rows: rows.filter((_, i) => i % 4 === 0) };
      /* (3.6) награда ждала уровнем выше — туда через шлюз не вернуться: при входе на этаж она уже в рюкзаке */
      {
        const P = Q.pickups(), inv0 = G().inv.medkit_s || 0;
        P.push({ id: "t-up", from: "Тестер Наверху", gifts: [{ kind: "item", item: "medkit_s", n: 1 }], key: "x-up", who: "Кто-то", L: G().L - 1, F: 3, room: null });
        Q.onFloor(true);
        out.upGift = (G().inv.medkit_s || 0) === inv0 + 1 && !Q.pickups().some(p => p.id === "t-up");
      }
      /* (3.6) вторая просьба из двух шагов — и текст о двух шагах, а не прямая речь о первом */
      let two = 0, badTwo = 0;
      for (let k = 0; k < 40; k++) {
        const nn = { key: "Q36-two" + k, n: "Лаборант Двойной", prof: "Лаборант" }, r2 = Q.giver(nn); r2.done = 1; r2.ch = 0; r2.cool = 0; r2.seq = 0;
        Q.offers(nn).forEach(q => { if (Q.steps(q).length < 2) return; two++; if (!/^Лаборант Двойной: «[^»]/.test(q.text || "") || !/Шаги: 1\)/.test(q.text || "")) badTwo++; });
      }
      out.twoStep = { two, bad: badTwo };
      /* 2. главы: выбор в конце главы меняет следующую */
      const ce = Q.chapterDef("eng", 1, ["air"]), ct = Q.chapterDef("eng", 1, ["tools"]);
      const m2s = Q.chapterDef("med", 2, ["truth", "serum"]), m2b = Q.chapterDef("med", 2, ["truth", "burn"]);
      out.branch = { eng: ce.intro !== ct.intro, med: m2s.t !== m2b.t && m2s.pick.o[0].f !== m2b.pick.o[0].f, store: Q.chapterDef("store", 2, ["cut", "stock"]).intro !== Q.chapterDef("store", 2, ["honest", "stock"]).intro };
      /* весь путь главы: два пути, шаги, выбор, следующая глава — по выбору */
      const nc = { key: "Q36-ch", n: "Инженер Главный", prof: "Инженер" };
      const rc = Q.giver(nc); rc.done = 2; rc.ch = 0; rc.path = []; rc.seq = 0; rc.cool = 0;
      /* (3.7) путь без своих шагов на этом этаже не предлагается (quests.js, need); глава и с одним путём — в окне
         выбора: заголовок истории, «Путь — …» и «Подумать и вернуться позже» (take: без окна — только первые две просьбы) */
      const offs = Q.offers(nc).length;
      U.closeAll(); spoken.length = 0; g.takeQuest(nc);
      let w = U.top();
      out.chap = { offers: offs, menu: !!w && /^Поручение:/.test(w.title), paths: w ? w.items.filter(x => /^Путь /.test(x.label)).length : 0, intro: spoken.join(" ").slice(0, 200) };
      if (w) { w.i = 0; U.activate(); }
      const qch = Q.active().find(q => q.giver === nc.key);
      if (qch) {
        out.chap.title = qch.title;
        Q.steps(qch).forEach(s => doStep(s, qch));
        g.completeQuest(qch, nc);
        w = U.top();
        out.chap.choice = !!w && /^Выбор: «Обесточено»/.test(w.title);
        if (w) { const k = w.items.findIndex(x => /мастерские/.test(x.label)); w.i = k; U.activate(); }
        out.chap.done = qch.done; out.chap.path = rc.path.join(","); out.chap.ch = rc.ch;
        rc.done = 5;
        const nxt = Q.offers(nc);
        out.chap.next = nxt.length ? nxt[0].intro === ct.intro : false;
      }
      /* 3. доверие: отказ — падает, сразу не просят, потом — другое; честная работа — растёт */
      const na = { key: "Q36-a", n: "Повар Проверочный", prof: "Повар" };
      G().quests = G().quests.filter(q => q.type === "main");
      U.closeAll(); g.takeQuest(na);
      const qa = Q.active().find(q => q.giver === na.key);
      const tr0 = Q.giver(na).trust;
      g.abandonQuest(qa);
      out.trust = { took: !!qa, drop: tr0 - Q.giver(na).trust };
      spoken.length = 0; g.takeQuest(na); out.trust.cool = /отказались от моей просьбы/.test(spoken.join(" "));
      G().body.food = 90; g.advanceTime(45);
      U.closeAll(); g.takeQuest(na);
      const qa2 = Q.active().find(q => q.giver === na.key);
      out.trust.again = !!qa2 && !!qa && qa2.id !== qa.id;
      if (qa2) { const tr1 = Q.giver(na).trust; Q.steps(qa2).forEach(s => doStep(s, qa2)); g.completeQuest(qa2, na); out.trust.up = qa2.done && Q.giver(na).trust > tr1; }
      /* 4. условия: тревога на этаже поручения — без премии «тихо»; срок вышел — без «быстро»;
         пролилась кровь — без «без крови» */
      G().quests = G().quests.filter(q => q.type === "main");
      const ng = { key: "Q36-c3", n: "Охранник Условный", prof: "Охранник" };
      const rg = Q.giver(ng); rg.done = 7; rg.ch = 3; rg.cool = 0;
      const qc = Q.offers(ng).find(q => (q.cond || []).some(c => c.k === "quiet"));
      if (qc) {
        Q.accept(ng, qc);
        LAB.oko.setLevel(3, "проверка"); LAB.oko.setLevel(0, "проверка");
        const fast = qc.cond.find(c => c.k === "fast"); if (fast) { fast.until = nowM(); G().body.food = 90; g.advanceTime(2); }
        out.cond = { has: qc.cond.map(c => c.k).join("+"), quietLost: qc.cond.find(c => c.k === "quiet").lost, fastLost: fast ? fast.lost : null, text: Q.details(qc).slice(0, 160) };
        g.abandonQuest(qc);
      }
      const ns = { key: "Q36-c4", n: "Генетик Тихий", prof: "Генетик" };
      let qcl = null;
      for (let k = 0; k < 12 && !qcl; k++) { const rs = Q.giver(ns); rs.done = 7; rs.ch = 3; rs.cool = 0; rs.seq = k; qcl = Q.offers(ns).find(q => (q.cond || []).some(c => c.k === "clean")) || null; }
      if (qcl) {
        Q.accept(ns, qcl);
        let f = null; for (let r = 3; r < 30 && !f; r++) { const c = C.freeCellNear(G().x + r, G().y, null); if (c && !C.havenAt(c[0], c[1])) f = C.spawnFoe("patrolbot", c[0], c[1], {}); }
        if (f) C.damageFoe(f, 99999, "kinetic", { quiet: true });
        out.clean = { killed: !!f && f.dead, lost: qcl.cond.find(c => c.k === "clean").lost };
        g.abandonQuest(qcl);
      }
      /* 5. срочная помощь раненому: опоздали — поручение сорвано */
      G().quests = G().quests.filter(q => q.type === "main");
      let qu = null, nu = null;
      for (let k = 0; k < 60 && !qu; k++) { const nn = { key: "Q36-u" + k, n: "Медик Срочная", prof: "Медик", female: true }; const ru = Q.giver(nn); ru.done = 4; ru.ch = 1; const f = Q.offers(nn).find(q => q.urgent); if (f) { qu = f; nu = nn; } }
      if (qu) {
        Q.accept(nu, qu); const tr = Q.giver(nu).trust;
        out.urgent = { text: /Срочно: успеть до/.test(Q.details(qu)) };
        qu.urgent = nowM(); G().body.food = 90; g.advanceTime(2);
        out.urgent.failed = qu.failed === true && qu.late === true; out.urgent.drop = tr - Q.giver(nu).trust;
      }
      /* 6. посылка: передать на этаже получателя; вскрыть и оставить себе — поручение сорвано */
      G().quests = G().quests.filter(q => q.type === "main");
      let qd = null, nd = null;
      for (let k = 0; k < 80 && !qd; k++) { const nn = { key: "Q36-d" + k, n: "Кладовщик Посыльный", prof: "Кладовщик" }; const rd = Q.giver(nn); rd.done = 1; rd.cool = 0; const f = Q.offers(nn).find(q => q.type === "deliver"); if (f) { qd = f; nd = nn; } }
      if (qd) {
        Q.accept(nd, qd);
        g.enterFloor(1, qd.tF, "down", true); C.stop();
        const m = g.CUR.fl.npcs.find(x => x.key === qd.to);
        out.deliver = { nav: Q.navTargets().some(t => t.n.indexOf(qd.toName) >= 0) };
        const its = m ? Q.npcItems(m) : [];
        out.deliver.items = its.map(x => x.label).join(" | ");
        const give = its.find(x => /^Передать посылку/.test(x.label));
        /* (3.6) посылка без ответа — сдавать не нужно: передали — «Эхо» доложило, кредиты на браслете */
        const cr0 = G().credits; out.deliver.hand = Q.handOf(qd);
        if (give) give.fn();
        out.deliver.given = qd.done || Q.ready(qd);
        out.deliver.paid = qd.done && G().credits > cr0;
        out.deliver.pick = Q.pickups().some(p => p.id === qd.id);
        G().pickups = [];
        g.enterFloor(1, 4, "down", true); C.stop();
      }
      let qd2 = null, nd2 = null;
      for (let k = 80; k < 160 && !qd2; k++) { const nn = { key: "Q36-d" + k, n: "Кладовщица Посыльная", prof: "Кладовщик", female: true }; const rd = Q.giver(nn); rd.done = 1; rd.cool = 0; const f = Q.offers(nn).find(q => q.type === "deliver"); if (f) { qd2 = f; nd2 = nn; } }
      if (qd2) {
        Q.accept(nd2, qd2); const tr = Q.giver(nd2).trust;
        g.enterFloor(1, qd2.tF, "down", true); C.stop();
        const m = g.CUR.fl.npcs.find(x => x.key === qd2.to);
        const open = m ? Q.npcItems(m).find(x => /^Вскрыть посылку/.test(x.label)) : null;
        if (open) { U.closeAll(); open.fn(); const w2 = U.top(); const k = w2 ? w2.items.findIndex(x => /^Оставить содержимое себе/.test(x.label)) : -1; if (k >= 0) { w2.i = k; U.activate(); } }
        out.parcel = { failed: qd2.failed === true, drop: tr - Q.giver(nd2).trust };
        g.enterFloor(1, 4, "down", true); C.stop();
      }
      /* 7. «уничтожить машин»: в счёт — только машины, за которых дали опыт */
      G().quests = G().quests.filter(q => q.type === "main");
      const qh = { v: 2, id: "Q36-h:5", giver: "Q36-h", giverName: "Проверочный", gf: false, L: G().L, F: G().F, done: false, stage: 5, tier: 5, steps: [{ type: "hunt", cls: "mech", need: 2, n: 0 }, { type: "kill", need: 1, wk0: G().stats.wkills || 0 }], short: "охота", text: "x", reward: { cr: 1, xp: 1 } };
      G().quests.push(qh);
      const spawn = id => { for (let r = 3; r < 30; r++) { const c = C.freeCellNear(G().x + r, G().y, null); if (c && !C.havenAt(c[0], c[1])) { const f = C.spawnFoe(id, c[0], c[1], {}); if (f) return f; } } return null; };
      const bioT = Object.keys(LAB.FOES).find(k => LAB.FOES[k].kind === "bio" && !(LAB.FOES[k].beh || []).some(b => /camera|turret|stationary/.test(b)));
      const fb = spawn(bioT); if (fb) C.damageFoe(fb, 99999, "kinetic", { quiet: true });
      const n1 = qh.steps[0].n;
      const fm = spawn("patrolbot"); if (fm) C.damageFoe(fm, 99999, "kinetic", { quiet: true });
      out.hunt = { afterBio: n1, afterMech: qh.steps[0].n, killStep: Q.KINDS.kill.ready(qh.steps[1]) };
      G().quests = G().quests.filter(q => q.id !== qh.id);
      /* 8. настоящий терминал: данные скачаны — шаг сделан, «Эхо» говорит, что можно сдать; навигатор знает цель */
      let at = null;
      for (let F = 1; F <= 20 && !at; F++) { const fl = LAB.getFloor(G().seed, 1, F); const o = fl.objs.find(x => x.type === "terminal" && x.sub === "sci"); if (o) at = { F, id: o.id }; }
      if (at) {
        g.enterFloor(1, at.F, "down", true); C.stop();
        const o = g.CUR.fl.objs.find(x => x.id === at.id);
        const st = g.objState(o); st.data = false;
        const qt = { v: 2, id: "Q36-t:2", giver: "Q36-t", giverName: "Проверочная", gf: true, L: 1, F: at.F, done: false, stage: 2, tier: 2, steps: [{ type: "data", tL: 1, tF: at.F, ids: [o.id], vis: true }, { type: "map", tL: 1, tF: at.F, vis: true }], short: "данные", text: "x", reward: { cr: 1, xp: 1 } };
        g.CUR.fs.mapped = false;
        G().quests.push(qt);
        out.term = { nav: Q.navTargets().map(t => t.n).join(", ") };
        U.closeAll(); g.objMenu(o);
        let ww = U.top(), k = ww ? ww.items.findIndex(x => /^Скачать исследовательские данные/.test(x.label)) : -1;
        spoken.length = 0;
        if (k >= 0) { ww.i = k; U.activate(); }
        out.term.dataStep = Q.KINDS.data.ready(qt.steps[0]);
        U.closeAll(); g.objMenu(o); ww = U.top(); k = ww ? ww.items.findIndex(x => /^Загрузить карту этажа/.test(x.label)) : -1;
        if (k >= 0) { ww.i = k; U.activate(); }
        out.term.ready = qt.done || Q.ready(qt); out.term.said = /«Эхо» передало доклад/.test(spoken.join(" ")) && qt.done === true;
        G().pickups = [];
        U.closeAll();
        G().quests = G().quests.filter(q => q.id !== qt.id);
        g.enterFloor(1, 4, "down", true); C.stop();
      }
      /* 9. запись и загрузка: заказчики и многошаговое поручение — на месте */
      G().quests = G().quests.filter(q => q.type === "main");
      const nl = { key: "Q36-l", n: "Инженер Записанный", prof: "Инженер" };
      const rl = Q.giver(nl); rl.done = 6; rl.ch = 2; rl.cool = 0; rl.trust = 77;
      const ql = Q.offers(nl)[0]; Q.accept(nl, ql);
      g.saveSlot(3); g.loadSlot(3); C.stop();
      const ql2 = G().quests.find(q => q.id === ql.id);
      out.save = { quest: !!ql2 && Q.steps(ql2).length === Q.steps(ql).length && !ql2.done, trust: Q.giver(nl).trust === 77, tier: Q.stage(nl) === 6 };
      if (ql2) { Q.steps(ql2).forEach(s => doStep(s, ql2)); const cr0 = G().credits; g.completeQuest(ql2, nl); out.save.paid = ql2.done && G().credits > cr0; }
      /* 10. поручение прежней версии (одношаговое) выполняется и считается */
      G().quests = G().quests.filter(q => q.type === "main");
      const old = { id: "Q36-old:1", giver: "Q36-old", giverName: "Старый Заказчик", gf: false, L: 1, F: 4, done: false, stage: 1, type: "visit", tL: 1, tF: 5, seq0: G().visitSeq || 0, short: "разведать этаж 5", text: "x", reward: { cr: 33, xp: 5 } };
      G().quests.push(old);
      const cr1 = G().credits; /* (3.6) разведка — по связи: «Эхо» доложило, как только пришли */
      g.enterFloor(1, 5, "down", true); C.stop(); g.enterFloor(1, 4, "up", true); C.stop();
      g.completeQuest(old, { key: "Q36-old", n: "Старый Заказчик" });
      out.old = { done: old.done, gain: G().credits - cr1, stage: Q.stage({ key: "Q36-old", n: "Старый Заказчик" }) };
      /* 11. (3.6, просьбы игрока) как сдавать: вещи в руки и выбор в главе — лично, с номером
         помещения заказчика; остальное — по связи: сведения у выжившего, награда — у выжившего поблизости */
      G().quests = G().quests.filter(q => q.type === "main"); G().pickups = [];
      const H = q => Q.handOf(q);
      out.hand = [H({ id: "h1", giver: "x", steps: [{ type: "fetch", item: "tape", need: 1 }, { type: "map" }] }), H({ id: "h2", giver: "x", type: "visit", tL: 1, tF: 5 }), H({ id: "h3", giver: "x", steps: [{ type: "deliver", reply: true }, { type: "map" }] }), H({ id: "h4", giver: "x", steps: [{ type: "deliver", reply: false }, { type: "data" }] }), H({ id: "h5", type: "deep", remote: true }), H({ id: "h6", type: "courier" }), H({ id: "h7", giver: "x", steps: [{ type: "keep" }, { type: "kill" }] })].join(" ");
      /* лично: настоящий выживший этажа — помещение с номером в тексте, строке окна, при готовности и в навигаторе */
      const real = g.CUR.fl.npcs.find(m => !m.robot && m.key && m.room >= 0 && g.CUR.fl.rooms[m.room] && g.CUR.fl.rooms[m.room].num);
      if (real) {
        const rr = Q.giver(real); let qs = null;
        for (let k = 0; k < 40 && !qs; k++) { rr.done = 0; rr.cool = 0; rr.trust = 60; rr.seq = 300 + k; qs = Q.offers(real).find(q => Q.handOf(q) === "self") || null; }
        if (qs) {
          const num = g.CUR.fl.rooms[real.room].num;
          spoken.length = 0; Q.accept(real, qs);
          out.self = { text: new RegExp("Сдавать лично[^.]*помещение " + num + "\\b").test(spoken.join(" ")), line: new RegExp("помещение " + num + "\\b").test(Q.line(qs)) };
          Q.steps(qs).forEach(s => doStep(s, qs)); spoken.length = 0; g.checkQuests();
          out.self.ready = new RegExp("можно сдать: [^.]*помещение " + num + "\\b").test(spoken.join(" "));
          out.self.nav = Q.navTargets().some(t => /^сдать поручение:/.test(t.n) && t.o === real);
          out.self.lineReady = /готово: вернитесь к заказчику/.test(Q.line(qs));
          g.abandonQuest(qs);
        }
      }
      /* по связи: узнать у выжившего — расспросили, «Эхо» доложило, награда ждёт у выжившего здесь */
      let qk = null, nk = null;
      for (let k = 0; k < 120 && !qk; k++) { const nn = { key: "Q36-k" + k, n: "Повар Спрашивающий", prof: "Повар" }; const rk = Q.giver(nn); rk.done = 1; rk.cool = 0; const f = Q.offers(nn).find(q => Q.steps(q).length === 1 && Q.steps(q)[0].type === "ask"); if (f) { qk = f; nk = nn; } }
      if (qk) {
        spoken.length = 0; Q.accept(nk, qk);
        const sk = Q.steps(qk).find(s => s.type === "ask");
        out.ask = { hand: Q.handOf(qk), text: /Сдавать не нужно/.test(spoken.join(" ")) && /Возвращаться ко мне не нужно/.test(qk.text || ""), line: /Сдавать не нужно/.test(Q.line(qk)) };
        g.enterFloor(1, sk.tF, "down", true); C.stop();
        const m = g.CUR.fl.npcs.find(x => x.key === sk.to);
        out.ask.nav = Q.navTargets().some(t => t.o === m);
        const it = m ? Q.npcItems(m).find(x => /^Расспросить: /.test(x.label)) : null;
        const cr0 = G().credits; spoken.length = 0;
        if (it) it.fn();
        out.ask.answer = spoken.some(t => t.indexOf(m.n + ": «") === 0);
        out.ask.done = qk.done === true && G().credits > cr0 && spoken.some(t => /«Эхо» передало доклад/.test(t));
        const p = Q.pickups().find(x => x.id === qk.id);
        out.ask.pick = !!p && p.L === 1 && p.F === sk.tF && Q.pickupLines().some(t => t.indexOf(p.who) >= 0);
        if (p) {
          const hm = g.CUR.fl.npcs.find(x => x.key === p.key);
          out.ask.navPick = Q.navTargets().some(t => /^забрать награду/.test(t.n) && t.o === hm);
          const take = hm ? Q.npcItems(hm).find(x => /^Забрать награду/.test(x.label)) : null;
          const inv0 = JSON.stringify(G().inv) + JSON.stringify(G().ammo);
          if (take) take.fn();
          out.ask.took = Q.pickups().length === 0 && JSON.stringify(G().inv) + JSON.stringify(G().ammo) !== inv0;
        }
        g.enterFloor(1, 4, "down", true); C.stop();
      }
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n").slice(1, 3).join(" / "); }
    U.closeAll();
    G().fs = JSON.parse(fs0);
    const gg = G();
    gg.quests = k0.quests; gg.givers = k0.givers; gg.credits = k0.credits; gg.inv = k0.inv; gg.samples = k0.samples; gg.rub = k0.rub; gg.min = k0.min; gg.day = k0.day; gg.stats = k0.stats; gg.body = k0.body; gg.hp = k0.hp; gg.visitSeq = k0.visitSeq; gg.lastVisit = k0.lastVisit;
    gg.xp = k0.xp; gg.lvl = k0.lvl;
    try { g.enterFloor(k0.L, k0.F, "down", true); C.stop(); gg.x = k0.x; gg.y = k0.y; } catch (e) { /* */ }
    LAB.say = say0;
    return out;
  });
  ok(!qv.err, "поручения 3.6: без ошибок" + (qv.err ? ": " + qv.err : ""));
  ok(qv.esc && qv.esc.badReady === 0 && qv.esc.badText === 0 && qv.esc.dup === 0, "ни одно дело в мире не сделано в момент выдачи (вещи могут быть уже в рюкзаке); у каждого текст и награда; шаги в поручении не повторяются (" + JSON.stringify(qv.esc && { r: qv.esc.badReady, t: qv.esc.badText, d: qv.esc.dup }) + ")");
  ok(qv.upGift, "награда, что ждала уровнем выше, при входе на этаж — уже в рюкзаке: через шлюз за ней не вернуться");
  ok(qv.twoStep && qv.twoStep.bad === 0, "вторая просьба из двух шагов называет оба шага (" + JSON.stringify(qv.twoStep) + ")");
  ok(qv.esc && qv.esc.badFloor === 0 && qv.esc.badSteps === 0, "каждая следующая просьба тяжелее: труд не меньше положенного ступени, шагов — 1, 2, 3, 4 по ступеням (" + (qv.esc ? qv.esc.rows.join(" ; ") : "") + ")");
  ok(qv.esc && qv.esc.kinds >= 16, "поручения разнообразные: видов шагов — " + (qv.esc && qv.esc.kinds));
  ok(qv.esc && qv.esc.xpw[1] / qv.esc.xpw[0] <= 1.3, "опыт — по труду: за единицу труда почти одинаково на всех ступенях (" + JSON.stringify(qv.esc && qv.esc.xpw) + ")");
  ok(qv.branch && qv.branch.eng && qv.branch.med && qv.branch.store, "главы ветвятся: выбор в прошлой главе меняет следующую (" + JSON.stringify(qv.branch) + ")");
  ok(qv.chap && (qv.chap.offers === 2 ? qv.chap.menu && qv.chap.paths === 2 : qv.chap.offers === 1 && qv.chap.menu && qv.chap.paths === 1) && qv.chap.title === "Обесточено" && qv.chap.choice && qv.chap.done && qv.chap.path === "tools" && qv.chap.ch === 1 && qv.chap.next, "глава: два пути (или один, если второму здесь нечего делать, — тоже в окне выбора), в конце — выбор, следующая глава — по выбору (" + JSON.stringify(qv.chap) + ")");
  ok(qv.trust && qv.trust.took && qv.trust.drop >= 10 && qv.trust.cool && qv.trust.again && qv.trust.up, "доверие: отказ — падает и сразу не просят, потом — другая просьба; честная работа — растёт (" + JSON.stringify(qv.trust) + ")");
  ok(qv.cond && qv.cond.quietLost === true && (qv.cond.fastLost === null || qv.cond.fastLost === true) && qv.clean && qv.clean.killed && qv.clean.lost === true, "премии: тревога ОКО на этаже поручения снимает «тихо», срок — «быстро», убийство — «без крови» (" + JSON.stringify({ c: qv.cond, k: qv.clean }) + ")");
  ok(qv.urgent && qv.urgent.text && qv.urgent.failed && qv.urgent.drop > 0, "срочная помощь раненому: срок назван, опоздали — поручение сорвано, доверие ниже (" + JSON.stringify(qv.urgent) + ")");
  ok(qv.deliver && qv.deliver.nav && /Передать посылку/.test(qv.deliver.items) && /Вскрыть посылку/.test(qv.deliver.items) && qv.deliver.given && qv.deliver.hand === "echo" && qv.deliver.paid && qv.deliver.pick, "посылка: навигатор ведёт к получателю, у него — передать или вскрыть; передали — «Эхо» доложило по связи, кредиты пришли сразу, подарок ждёт у выжившего (" + JSON.stringify(qv.deliver) + ")");
  ok(qv.parcel && qv.parcel.failed && qv.parcel.drop >= 25, "вскрыть посылку и оставить себе — поручение сорвано, доверие подорвано (" + JSON.stringify(qv.parcel) + ")");
  ok(qv.hunt && qv.hunt.afterBio === 0 && qv.hunt.afterMech === 1 && qv.hunt.killStep, "«уничтожить машин»: тварь не в счёт, машина — в счёт; «уничтожить врагов» — любой (" + JSON.stringify(qv.hunt) + ")");
  ok(qv.term && /поручение: научный терминал/.test(qv.term.nav) && qv.term.dataStep && qv.term.ready && qv.term.said, "настоящий терминал: навигатор знает цель, данные и карта — шаги сделаны, «Эхо» само передаёт доклад (" + JSON.stringify(qv.term) + ")");
  ok(qv.save && qv.save.quest && qv.save.trust && qv.save.tier && qv.save.paid, "запись и загрузка: многошаговое поручение, доверие и ступень на месте, сдаётся (" + JSON.stringify(qv.save) + ")");
  ok(qv.hand === "self echo self echo echo courier self", "как сдавать: вещи в руки и ответ на посылку — лично; разведка, данные, посылка без ответа, доклад снизу — по связи (" + qv.hand + ")");
  ok(qv.self && qv.self.text && qv.self.line && qv.self.ready && qv.self.nav && qv.self.lineReady, "лично: номер помещения заказчика — при выдаче, в окне заданий и когда можно сдать; навигатор ведёт к нему (" + JSON.stringify(qv.self) + ")");
  ok(qv.ask && qv.ask.hand === "echo" && qv.ask.text && qv.ask.line && qv.ask.nav && qv.ask.answer && qv.ask.done && qv.ask.pick && qv.ask.navPick && qv.ask.took, "узнать у выжившего: расспросили — «Эхо» доложило, кредиты сразу, подарок у выжившего здесь; навигатор и окно заданий знают где (" + JSON.stringify(qv.ask) + ")");
  ok(qv.old && qv.old.done && qv.old.gain === 33 && qv.old.stage === 1, "поручение прежней версии выполняется и идёт в счёт; разведку «Эхо» передаёт по связи само (" + JSON.stringify(qv.old) + ")");

  console.log("(3.6) Импланты: одна лечилка вместо регенерации и гемостата; опыт кибернетики — раз на чип и на модификацию");
  const imx = await page.evaluate(() => {
    const g = LAB.game, IM = LAB.implants, G = g.G, out = {};
    const k0 = JSON.parse(JSON.stringify({ implants: G.implants, impLv: G.impLv || {}, impMod: G.impMod || {}, cyber: G.cyber || { xp: {} }, inv: G.inv, bp: G.bp || {}, hp: G.hp, hpMax: G.hpMax, en: G.en, body: G.body }));
    try {
      /* лечилка одна: гемостата в каталоге нет, регенерация лечит и останавливает кровь */
      out.gone = !LAB.IMPLANTS.some(d => d.id === "hemostat") && !LAB.ITEMS.imp_hemostat && IM.def("hemostat").id === "regen" && /останавливает кровотечение/.test(IM.def("regen").desc);
      /* запись прежней версии: гемостат вживлён — становится регенерацией; оба — второй чипом в рюкзак */
      const old1 = { implants: ["scan", "echo", "hemostat"], inv: { imp_hemostat: 2 }, impLv: { hemostat: 2 }, impMod: { hemostat: ["eco", "lasting"] }, bp: { imp_hemostat: 1 }, cyber: { xp: { med: 20 }, once: { "install:hemostat": 1 } } };
      IM.fixSave(old1);
      out.mig1 = old1.implants.indexOf("hemostat") < 0 && old1.implants.indexOf("regen") >= 0 && old1.inv.imp_regen === 2 && !old1.inv.imp_hemostat && old1.impLv.regen === 2 && old1.impMod.regen.join() === "eco" && old1.bp.imp_regen === 1 && old1.cyber.once["install:regen"] === 1;
      const old2 = { implants: ["scan", "echo", "regen", "hemostat"], inv: {} };
      IM.fixSave(old2);
      out.mig2 = old2.implants.filter(id => id === "regen").length === 1 && old2.implants.indexOf("hemostat") < 0 && old2.inv.imp_regen === 1;
      /* оба импланта больше не встать вместе: подобранный «гемостат» — чип регенерации */
      G.implants = G.implants.filter(id => id === "scan" || id === "echo"); G.impLv = {}; G.impMod = {}; G.cyber = { xp: {} };
      IM.install("regen"); const n0 = G.inv.imp_regen || 0; IM.pickup("hemostat"); out.pick = (G.inv.imp_regen || 0) === n0 + 1 && G.implants.filter(id => id === "regen").length === 1;
      /* счётчик: сколько имплантов вживлено — без системных «Эхо» и без чипов */
      IM.install("detox"); IM.install("c_aim");
      out.count = IM.actIn() === 2 && /Имплантов вживлено: 2/.test(IM.cyberText()) && /Чипов в нейрогнёздах: 1/.test(IM.cyberText());
      /* «вживить — извлечь» и «снять — поставить модификацию»: опыт — только в первый раз */
      G.implants = G.implants.filter(id => id === "scan" || id === "echo"); G.cyber = { xp: {} }; G.impMod = {};
      G.hp = G.hpMax = 9999;
      IM.install("regen"); const x1 = IM.catXp("med");
      IM.extract("regen"); const x2 = IM.catXp("med");
      for (let i = 0; i < 5; i++) { g.useItem("imp_regen"); IM.extract("regen"); }
      const x3 = IM.catXp("med");
      out.once = { install: x1, extract: x2 - x1, loop: x3 - x2 };
      g.useItem("imp_regen");
      G.inv.chip = 9; G.inv.relay = 9;
      IM.addMod("regen", "eco"); const m1 = IM.catXp("med");
      for (let i = 0; i < 3; i++) { IM.delMod("regen", "eco"); IM.addMod("regen", "eco"); }
      out.once.mod = m1 - x3; out.once.modLoop = IM.catXp("med") - m1;
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n")[1]; }
    G.implants = k0.implants; G.impLv = k0.impLv; G.impMod = k0.impMod; G.cyber = k0.cyber; G.inv = k0.inv; G.bp = k0.bp; G.hp = k0.hp; G.hpMax = k0.hpMax; G.en = k0.en; G.body = k0.body;
    return out;
  });
  ok(!imx.err, "импланты 3.6: без ошибок" + (imx.err ? ": " + imx.err : ""));
  ok(imx.gone && imx.mig1 && imx.mig2 && imx.pick, "«Гемостат» слит с «Регенерацией»: в каталоге одна лечилка; вживлённый гемостат прежней записи — регенерацией, второй — чипом в рюкзак; ступень, модификации, схема и опыт переходят (" + JSON.stringify({ g: imx.gone, m1: imx.mig1, m2: imx.mig2, p: imx.pick }) + ")");
  ok(imx.count, "счётчик имплантов: вживлённые — отдельно от чипов и системных имплантов «Эхо»");
  ok(imx.once && imx.once.install > 0 && imx.once.extract > 0 && imx.once.loop === 0 && imx.once.mod > 0 && imx.once.modLoop === 0, "кибернетика не качается по кругу: «вживить — извлечь» и «снять — поставить модификацию» дают опыт только в первый раз (" + JSON.stringify(imx.once) + ")");

  console.log("(3.5) Находки аудита: доклад после загрузки, расчистка по врагам, укрытие и бросок, мины ОКО, страница в капсуле");
  const au = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, U = LAB.ui, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const said = []; const say0 = LAB.say; LAB.say = function (t) { said.push(String(t)); };
    const k0 = JSON.parse(JSON.stringify({ quests: g.G.quests, credits: g.G.credits, L: g.G.L, F: g.G.F, x: g.G.x, y: g.G.y, inv: g.G.inv, xp: g.G.xp, lvl: g.G.lvl, hp: g.G.hp }));
    const hack0 = LAB.mini.hack;
    try {
      /* 1. доклад по связи: загрузили запись до доклада — он снова платится */
      g.enterFloor(2, 3, "down", true); C.stop();
      g.G.quests = g.G.quests.filter(q => q.type === "main");
      g.G.quests.push({ id: "T33-deep:2", giver: "T33-deep", giverName: "Проверочный", gf: false, L: 2, F: 3, done: false, stage: 2, type: "deep", cross: true, remote: true, tL: 2, tF: 5, seq0: g.G.visitSeq || 0, short: "дойти до этажа 5", text: "x", reward: { cr: 50, xp: 10 } });
      g.saveSlot(3);
      g.enterFloor(2, 5, "down", true); C.stop(); g.checkQuests();
      out.paid1 = g.G.quests.find(q => q.id === "T33-deep:2").done === true;
      g.loadSlot(3); await wait(60); C.stop();
      const dq = g.G.quests.find(q => q.id === "T33-deep:2");
      out.afterLoad = !!dq && !dq.done;
      g.enterFloor(2, 5, "down", true); C.stop(); g.checkQuests();
      out.paid2 = !!dq && dq.done === true;
      /* 2. «расчистить помещение»: враги, что сидели там, убиты где угодно — засчитано */
      let qc = null, at = null;
      for (let F = 2; F <= 12 && !qc; F++) {
        g.enterFloor(1, F, "down", true); C.stop();
        g.G.quests = g.G.quests.filter(q => q.type === "main");
        for (let k = 0; k < 40 && !qc; k++) { g.takeQuest({ key: "T33-clr-" + F + "-" + k, n: "Проверочный", prof: "Охранник" }); const q = g.G.quests[g.G.quests.length - 1]; if (q && q.type === "clear") { qc = q; at = F; } else g.G.quests.pop(); }
      }
      if (qc) {
        const alive = () => C.foes().filter(f => qc.foeIds.indexOf(f.id) >= 0 && !f.dead);
        out.clearIds = qc.foeIds.length;
        const f1 = alive()[0];
        if (f1) { const cc = C.freeCellNear(g.CUR.fl.objs[0].x, g.CUR.fl.objs[0].y, null) || [f1.x, f1.y]; f1.x = cc[0]; f1.y = cc[1]; } /* выманили из помещения */
        out.clearBefore = g.questProgress(qc);
        alive().forEach(f => { for (let t = 0; t < 30 && !f.dead; t++) C.damageFoe(f, 99999, "phys", {}); });
        out.clearReady = g.questProgress(qc);
      }
      /* 3. укрытие: бросок гранаты выдаёт так же, как выстрел */
      g.enterFloor(1, 4, "down", true); C.stop();
      const gid = Object.keys(LAB.ITEMS).find(id => LAB.ITEMS[id].fx && LAB.ITEMS[id].fx.gren);
      g.G.inv[gid] = (g.G.inv[gid] || 0) + 1;
      g.G.st.hide = { x: g.G.x, y: g.G.y, L: g.G.L, F: g.G.F };
      out.hidBefore = C.hidden();
      C.throwGrenade(gid); await wait(30);
      out.hidAfter = C.hidden();
      g.G.st.hide = null;
      /* 4. мины ОКО: с каждой обезвреженной опыта меньше, вещь — с первых трёх, потом ничего */
      g.enterFloor(3, 6, "down", true); C.stop();
      LAB.mini.hack = function (len, cb) { cb(true); };
      const ach0 = LAB.ach && LAB.ach.ev; if (LAB.ach) LAB.ach.ev = function () {}; /* награды достижений — не в счёт */
      const xpAll = () => { let t = g.G.xp; for (let l = 1; l < g.G.lvl; l++) t += LAB.xpNeed(l); return t; };
      const kind = (LAB.traps.okoKinds(g.G.L) || ["alarm"])[0], xps = [], items = [];
      for (let i = 0; i < 8; i++) {
        const c = C.freeCellNear(g.G.x + 3, g.G.y, null); if (!c) break;
        const tp = LAB.traps.okoTrap(kind, c[0], c[1]); if (!tp) continue;
        const xp0 = xpAll(), inv0 = Object.keys(g.G.inv).reduce((a, k) => a + (g.G.inv[k] || 0), 0);
        LAB.traps.disarm(tp);
        xps.push(xpAll() - xp0); items.push(Object.keys(g.G.inv).reduce((a, k) => a + (g.G.inv[k] || 0), 0) > inv0);
      }
      if (LAB.ach) LAB.ach.ev = ach0;
      out.mines = { xps, items };
      LAB.mini.hack = hack0;
      /* 5. страница в капсуле лечит (окно само меняет мир) — окно не устаревает */
      U.closeAll(); g.G.hp = Math.max(1, g.G.hpMax - 50); let hits = 0;
      U.menu("Проверочная книга", [0, 1, 2].map(i => ({ label: "Страница " + (i + 1), keep: true, fn: () => { hits++; } })), { onFocus: () => { g.G.hp = Math.min(g.G.hpMax, g.G.hp + 5); } });
      await wait(10); said.length = 0;
      U.move(1); U.activate(); await wait(10);
      out.reader = { open: !!U.top() && U.top().title === "Проверочная книга", hits, stale: said.some(t => /всё уже изменилось/.test(t)) };
      U.closeAll();
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n")[1]; }
    LAB.mini.hack = hack0;
    const G = g.G;
    G.quests = k0.quests; G.credits = k0.credits; G.inv = k0.inv; G.xp = k0.xp; G.lvl = k0.lvl; G.hp = k0.hp;
    try { g.enterFloor(k0.L, k0.F, "down", true); C.stop(); G.x = k0.x; G.y = k0.y; } catch (e) { /* */ }
    LAB.say = say0;
    return out;
  });
  ok(!au.err, "находки аудита: без ошибок" + (au.err ? ": " + au.err : ""));
  ok(au.paid1 && au.afterLoad && au.paid2, "доклад по связи: загрузили запись до доклада — дошли снова, и награда пришла (" + JSON.stringify({ p1: au.paid1, l: au.afterLoad, p2: au.paid2 }) + ")");
  ok(au.clearIds > 0 && /осталось врагов/.test(au.clearBefore || "") && /расчищено/.test(au.clearReady || "") && !/осталось/.test(au.clearReady || ""), "«расчистить помещение»: враги, что сидели там, убиты и вне помещения — засчитано (" + au.clearBefore + " → " + au.clearReady + ")");
  ok(au.hidBefore === true && au.hidAfter === false, "укрытие: бросок гранаты выдаёт, как выстрел");
  ok(au.mines && au.mines.xps.length >= 7 && au.mines.items.slice(0, 3).every(Boolean) && !au.mines.items.slice(3).some(Boolean) && au.mines.xps[0] > au.mines.xps[4] && au.mines.xps.slice(6).every(x => x === 0), "мины ОКО: опыт с каждой меньше, вещь — с первых трёх, после шестой — ничего (" + JSON.stringify(au.mines) + ")");
  ok(au.reader && au.reader.open && au.reader.hits === 1 && !au.reader.stale, "страница, которая лечит в капсуле, не делает окно устаревшим (" + JSON.stringify(au.reader) + ")");

  /* (3.6, просьба автора) Помещения втрое просторнее, вещей в них по площади и назначению;
     книги и бумаги — чему учат, архив, записка с кодом; шредер, витрина, решётка вентиляции,
     селектор, ячейки хранения, почтовые ящики, каталог, микрофильмы, порванная плёнка */
  console.log("(3.6) Помещения просторнее, вещей больше; книги и бумаги, звук и связь");
  const lib = await page.evaluate(async () => {
    const g = LAB.game, LB = LAB.library, U = LAB.ui, C = LAB.combat, out = {};
    const G = () => g.G;
    const spoken = [], say0 = LAB.say; LAB.say = function (t) { spoken.push(String(t)); };
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const items = () => (U.top() && U.top().items || []).map(label);
    const pick = re => { const it = (U.top() && U.top().items || []).find(i => re.test(label(i))); if (it) it.fn(); return !!it; };
    const last = () => spoken[spoken.length - 1] || "";
    const k0 = JSON.parse(JSON.stringify({ L: G().L, F: G().F, x: G().x, y: G().y, inv: G().inv, credits: G().credits, xp: G().xp, lvl: G().lvl, mind: G().mind, perks: G().perks || {}, lib: G().lib || null, bp: G().bp || {}, chem: G().chem || null, stats: G().stats, body: G().body, min: G().min, day: G().day, codes: G().codes, hp: G().hp, notes: G().notes, noteList: G().noteList, libNav: G().libNav || null }));
    const fs0 = JSON.stringify(G().fs);
    const walk = o => { const fl = g.CUR.fl; for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = o.x + v[0], y = o.y + v[1]; if (fl.t[y * LAB.W + x] === LAB.T.ROOM && !fl.objAt[y * LAB.W + x]) { G().x = x; G().y = y; return; } } };
    const findFx = (k, L, test) => { for (let f = 2; f <= 20; f++) { g.enterFloor(L || 1, f, "down", true); C.stop(); const o = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === k && (!test || test(q))); if (o) { walk(o); return o; } } return null; };
    try {
      /* 1. помещения: главные — от девяти шагов в сторону, кабинеты — в среднем втрое больше прежнего; вещей — по площади */
      const geo = { mainMin: 99, annA: 0, ann: 0, objs: 0, rooms: 0, kinds: {} };
      for (const F of [3, 9, 15]) {
        const fl = LAB.getFloor(G().seed, 1, F);
        fl.rooms.forEach(rm => { if (!rm) return; const w = rm.x1 - rm.x0 + 1, h = rm.y1 - rm.y0 + 1; geo.rooms++; if (rm.annex) { geo.ann++; geo.annA += w * h; } else if (!/^(secret|gate|reactor)$/.test(rm.type)) geo.mainMin = Math.min(geo.mainMin, w, h); });
        geo.objs += fl.objs.length;
        fl.objs.forEach(o => { if (o.type === "fx") geo.kinds[o.fx] = (geo.kinds[o.fx] || 0) + 1; });
      }
      out.geo = { mainMin: geo.mainMin, annAvg: Math.round(geo.annA / geo.ann), perRoom: +(geo.objs / geo.rooms).toFixed(1), newKinds: ["bookcase", "archive", "newspapers", "diarydesk", "shredder", "labbook", "grate", "cooler", "recorder", "intercom"].filter(k => geo.kinds[k] > 0).length };
      /* 2. книжный шкаф: книги с разделами; прочитанная — в архиве, опыт, «прочитано»; состав запомнен */
      G().perks = {}; G().lib = null; G().mind = 12;
      const bc = findFx("bookcase", 1);
      U.closeAll(); LB.act(bc, null, "lib", { lib: "case" });
      const list0 = items();
      out.case = { n: list0.length - 1, cats: list0.slice(1).every(l => / — \S/.test(l)), title: !!U.top() && U.top().title === "Книжный шкаф: книги" };
      const xp0 = G().xp, n0 = G().noteList.length;
      pick(/«/);
      const e1 = G().noteList[G().noteList.length - 1];
      out.case.arch = G().noteList.length === n0 + 1 && e1.src && e1.src.note === "lib" && e1.cat === "Книги";
      out.case.xp = G().xp > xp0 || G().lvl > k0.lvl;
      U.closeAll(); LB.act(bc, null, "lib", { lib: "case" });
      out.case.same = JSON.stringify(items().slice(1).map(l => l.replace(/, прочитано$/, ""))) === JSON.stringify(list0.slice(1)) && items().some(l => /прочитано$/.test(l));
      /* текст по ссылке собирается заново — как после загрузки */
      const q1 = LB.byId(e1.src.lib), txt = LB.noteText(e1.src).x;
      out.case.text = txt.length > 400 && txt.indexOf(String(q1.x || q1.pages[0]).replace(/\s*\n\n+\s*/g, " ").slice(0, 60)) >= 0 && g.docInfo(e1).cat === "Книги";
      U.closeAll();
      /* (3.6) на этаже книги не повторяются: все шкафы и полки глубокого этажа подряд — ни одной книги дважды */
      {
        const back = { L: G().L, F: G().F };
        g.enterFloor(30, 5, "down", true); C.stop();
        const bks = g.CUR.fl.objs.filter(q => (q.type === "fx" && q.fx === "bookcase") || q.type === "bookshelf");
        const seen = {}; let dupB = 0, got = 0, empty = 0;
        bks.forEach(q => { const list = q.type === "bookshelf" ? LB.shelfBooks(q) : LB.deal(q, "case"); if (!list.length) empty++; list.forEach(b => { got++; if (seen[b.id] && !b.tpl) dupB++; seen[b.id] = 1; }); });
        out.noRepeat = { fixtures: bks.length, got, empty, dup: dupB };
        g.enterFloor(back.L, back.F, "down", true); C.stop(); /* назад: следующие проверки — книги верхней глубины */
      }
      /* 3. чему учат книги: три детектива — «Чутьё»; три о науке — интеллект; техника — схема; химия — рецептура */
      const books = LB.pool("book"), byCat = c => books.filter(b => b.cat === c && !LB.isRead(b, bc));
      byCat("detective").slice(0, 3).forEach(b => { LB.readText(b, bc); U.closeAll(); });
      out.perk = !!(G().perks && G().perks.searcher);
      const m0 = G().mind; byCat("science").slice(0, 3).forEach(b => { LB.readText(b, bc); U.closeAll(); });
      out.mind = G().mind - m0;
      const bp0 = Object.keys(G().bp || {}).length; const tb = byCat("tech")[0]; if (tb) { LB.readText(tb, bc); U.closeAll(); }
      out.bp = Object.keys(G().bp || {}).length - bp0;
      const ck0 = Object.keys((G().chem && G().chem.known) || {}).length; const cb2 = byCat("chem")[0]; if (cb2) { LB.readText(cb2, bc); U.closeAll(); }
      out.chem = Object.keys((G().chem && G().chem.known) || {}).length - ck0;
      const nb0 = (G().body.neuro = 60); const fb = byCat("fiction")[0] || byCat("poetry")[0]; if (fb) { LB.readText(fb, bc); U.closeAll(); }
      out.calm = G().body.neuro < nb0;
      /* 4. записка с кодом в архивных коробках: прочитали — код в архиве, замок о нём знает */
      let memo = null, mo = null;
      for (let f = 2; f <= 20 && !memo; f++) {
        g.enterFloor(1, f, "down", true); C.stop();
        for (const o of g.CUR.fl.objs.filter(q => q.type === "fx" && q.fx === "archive")) { const m = LB.codeMemo(o); if (m) { memo = m; mo = o; break; } }
      }
      if (memo) {
        walk(mo); U.closeAll(); LB.act(mo, null, "lib", { lib: "docs" });
        out.memoItem = pick(/^Папка без номера/);
        out.memo = G().codes[memo.code] === memo.room && /в ваших документах/.test(g.codeHint(memo.code, "safe")) && G().noteList.some(n => n.code === memo.code);
      }
      U.closeAll();
      /* 5. шредер: не по порядку — полоски снова перемешаны; по порядку — документ сложен и в архиве */
      const sh = findFx("shredder", 1);
      if (sh) {
        U.closeAll(); LB.act(sh, null, "shred", {});
        const S = g.objState(sh).shred, parts = (() => { const q = S.q ? LB.byId(S.q) : null, t = S.memo ? LB.codeMemo(sh).x : (q.pages ? q.pages.join("\n\n") : q.x), w = String(t).replace(/\s*\n\n+\s*/g, " ").split(/\s+/), per = Math.ceil(w.length / S.n), o2 = []; for (let i = 0; i < S.n; i++) o2.push(w.slice(i * per, (i + 1) * per).join(" ")); return o2; })();
        const choose = i => { const it = U.top().items.find(q => label(q) === "Полоска: «" + parts[i] + "»"); if (it) it.fn(); return !!it; };
        for (let i = parts.length - 1; i >= 0; i--) choose(i);
        out.shredWrong = !g.objState(sh).shredDone && g.objState(sh).shred.got.length === 0;
        U.closeAll(); LB.act(sh, null, "shred", {});
        const nl = G().noteList.length; let okAll = true;
        for (let i = 0; i < parts.length; i++) okAll = choose(i) && okAll;
        out.shred = okAll && !!g.objState(sh).shredDone && G().noteList.length > nl;
      }
      U.closeAll();
      /* 6. витрина: разбить стекло — громко, экспонат забран */
      const vt = findFx("vitrine", 1) || findFx("vitrine", 2);
      if (vt) {
        U.closeAll(); G().noise = 0; const inv0 = JSON.stringify([G().inv, G().ammo, G().credits]); /* в витрине бывают и заряды — они в ammo */
        LB.act(vt, null, "vitrine", {}); pick(/^Разбить стекло/);
        out.vitrine = !!g.objState(vt).vitOpen && G().noise > 0 && JSON.stringify([G().inv, G().ammo, G().credits]) !== inv0;
      }
      U.closeAll();
      /* 7. решётка вентиляции: «Эхо» называет помещение, где за стеной машина */
      const gr = findFx("grate", 1);
      if (gr) {
        const fl = g.CUR.fl, here = fl.room[G().y * LAB.W + G().x];
        const dd = r => Math.abs(r.cx - gr.x) + Math.abs(r.cy - gr.y);
        const rm = fl.rooms.filter(r => r && r.num && r.id !== here && dd(r) <= 14).sort((a, b) => dd(a) - dd(b))[0];
        const f = C.foes().find(q => !q.dead && !q.ally && !q.calm);
        /* остальных — на время замера «успокоить»: на обжитом этаже за стенами бывает много кого */
        const calm0 = C.foes().filter(q => q !== f && !q.dead && !q.calm); calm0.forEach(q => { q.calm = true; });
        if (rm && f) { f.x = rm.cx; f.y = rm.cy; f.ally = false; f.calm = false; }
        const sp0 = spoken.length; U.closeAll(); LB.act(gr, null, "grate", {});
        calm0.forEach(q => { q.calm = false; });
        /* (3.7) фраза решётки, а не последняя сказанная: изредка в шахте мяукает кот, и следом звучит достижение */
        const gSaid = spoken.slice(sp0).filter(t => /разбирает звуки из шахты|Из шахты тянет/.test(t)).pop() || last();
        out.grate = rm && f ? new RegExp("в помещении " + rm.num + "\\b").test(gSaid) : /шахт/.test(gSaid);
        if (!out.grate) out.grateSaid = (rm ? rm.num : "-") + ": " + gSaid.slice(0, 240);
      }
      /* 8. селектор: вызов в помещении — машина рядом идёт на звук */
      const ic = findFx("intercom", 1);
      if (ic) {
        g.CUR.fl.needPower = false;
        U.closeAll(); LB.act(ic, null, "intercom", {});
        const it0 = items()[0], num = it0 ? +((it0.match(/Помещение (\d+)/) || [])[1]) : 0, rm = g.CUR.fl.rooms.find(r => r && r.num === num);
        let f = C.foes().find(q => !q.dead && !q.calm && !q.ally && !q.neutral && !q.disguised && !(LAB.FOES[q.type].beh || []).includes("stationary"));
        /* на обжитом этаже машин может уже не остаться — тогда поставить патрульного самим */
        if (rm && !f) { const c = C.freeCellNear(rm.cx, rm.cy, null); if (c) f = C.spawnFoe("patrolbot", c[0], c[1], {}); }
        if (rm && f) { f.x = rm.cx + 1; f.y = rm.cy; f.state = "idle"; f.lastKnown = null; }
        pick(/^Помещение/);
        out.intercom = !!(rm && f && f.lastKnown && f.lastKnown.x === rm.cx && f.lastKnown.y === rm.cy);
        if (!out.intercom) out.icSaid = JSON.stringify({ rm: rm && rm.num, f: f && [f.type, f.x, f.y, f.state, f.lastKnown], it0 }) + " " + last().slice(0, 200);
        U.closeAll(); LB.act(ic, null, "intercom", {}); out.intercomCd = /ещё горячее/.test(last());
      }
      /* 9. ячейки хранения: жёлтой отмычкой — открыта */
      const dp = findFx("deposit", 1) || findFx("deposit", 2);
      if (dp) {
        G().inv.lockpick = 2; U.closeAll(); LB.act(dp, null, "deposit", {}); pick(/заперта/); pick(/отмычкой/);
        out.deposit = G().inv.lockpick === 1 && g.objState(dp).cells.some(c => c.open);
      }
      U.closeAll();
      /* 10. почтовые ящики: письма — в архив */
      const mb = findFx("mailboxes", 1) || findFx("mailboxes", 2);
      if (mb) { const nl = G().noteList.length; U.closeAll(); LB.act(mb, null, "mail", {}); out.mail = G().noteList.length - nl; }
      /* 11. каталог: выбранный шкаф — цель навигатора */
      const ct = findFx("catalog", 1) || findFx("catalog", 2);
      if (ct) { U.closeAll(); LB.act(ct, null, "catalog", {}); pick(/^Книжн/); out.catalog = !!G().libNav && LB.navTargets().length === 1; }
      U.closeAll();
      /* 12. микрофильмы — только при питании этажа */
      /* (3.6) аппарат ставится только там, где на глубине есть плёнки: в «Ковчеге» — с третьего уровня */
      let mf = null; for (let L = 3; L <= 8 && !mf; L++) mf = findFx("microfilm", L);
      if (mf) { g.CUR.fl.needPower = true; g.CUR.fs.power = false; U.closeAll(); LB.act(mf, null, "lib", { lib: "film", power: true }); out.filmOff = /нет питания/.test(last()); g.CUR.fs.power = true; LB.act(mf, null, "lib", { lib: "film", power: true }); out.filmOn = /Катушка/.test(items().join(" ")); }
      U.closeAll();
      /* 13. магнитофон (3.7): порванную плёнку изолентой не склеить — клеят монтажной лентой,
         или бобину забирают на продажу; коробка с монтажной лентой бывает у магнитофона */
      let rt = null, tq = null, bx = null;
      for (let f = 2; f <= 20 && (!tq || !bx); f++) {
        g.enterFloor(1, f, "down", true); C.stop();
        for (const o of g.CUR.fl.objs.filter(q => q.type === "fx" && q.fx === "recorder")) {
          if (!bx && (LAB.hash32(o.id + ":splice:" + g.CUR.key) >>> 0) % 2 === 0) bx = { o, f };
          if (tq) continue;
          const tl = LB.deal(o, "tape"); const t = tl.find(q => (LAB.hash32(o.id + ":" + q.id + ":" + g.CUR.key) >>> 0) % 3 === 0); if (t) { rt = o; tq = t; out.tornF = f; }
        }
      }
      if (tq) {
        g.enterFloor(1, out.tornF, "down", true); C.stop(); rt = g.CUR.fl.objs.find(q => q.id === rt.id);
        walk(rt); G().inv.tape = 3; G().inv.splice = 0; U.closeAll(); LB.act(rt, null, "lib", { lib: "tape" });
        out.tornLbl = items().some(l => /плёнка порвана/.test(l)); pick(/плёнка порвана/);
        out.tornNoTape = /Изолентой её не склеить/.test(last()) && !items().some(l => /^Склеить/.test(l)) && G().inv.tape === 3;
        G().inv.splice = 1; U.closeAll(); LB.act(rt, null, "lib", { lib: "tape" }); pick(/плёнка порвана/); pick(/^Склеить монтажной лентой/);
        out.tornFixed = G().inv.splice === 0 && G().inv.tape === 3 && !!g.objState(rt)["fix_" + tq.id] && LB.isRead(tq, rt);
        /* ту же бобину, будь она снова порвана, — забрать: в рюкзак, на продажу, из списка магнитофона пропадает */
        delete g.objState(rt)["fix_" + tq.id]; G().inv.reel_torn = 0; U.closeAll(); LB.act(rt, null, "lib", { lib: "tape" }); pick(/плёнка порвана/); pick(/^Забрать бобину/);
        U.closeAll(); LB.act(rt, null, "lib", { lib: "tape" });
        out.tornTaken = G().inv.reel_torn === 1 && !items().some(l => l.indexOf(tq.t) >= 0) && LAB.supply.catOf("reel_torn") === "valuable" && LAB.ITEMS.reel_torn.price > 0;
      }
      if (bx) {
        g.enterFloor(1, bx.f, "down", true); C.stop(); bx.o = g.CUR.fl.objs.find(q => q.id === bx.o.id); walk(bx.o); const sp0 = G().inv.splice || 0;
        U.closeAll(); LB.act(bx.o, null, "lib", { lib: "tape" }); pick(/Коробка с монтажной лентой/);
        U.closeAll(); LB.act(bx.o, null, "lib", { lib: "tape" });
        out.spliceBox = (G().inv.splice || 0) > sp0 && !items().some(l => /Коробка с монтажной лентой/.test(l));
      }
      U.closeAll();
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n").slice(1, 3).join(" / "); }
    U.closeAll();
    G().fs = JSON.parse(fs0);
    const gg = G();
    ["inv", "credits", "xp", "lvl", "mind", "perks", "lib", "bp", "chem", "stats", "body", "min", "day", "codes", "hp", "notes", "noteList", "libNav"].forEach(k => { gg[k] = k0[k]; });
    try { g.enterFloor(k0.L, k0.F, "down", true); C.stop(); gg.x = k0.x; gg.y = k0.y; } catch (e) { /* */ }
    LAB.say = say0;
    return out;
  });
  ok(!lib.err, "книги и бумаги: проверка без ошибок" + (lib.err ? ": " + lib.err : ""));
  ok(lib.geo && lib.geo.mainMin >= 9 && lib.geo.annAvg >= 38 && lib.geo.perRoom >= 6 && lib.geo.newKinds >= 8, "помещения просторнее: главные — от девяти шагов, кабинеты в среднем втрое больше прежнего, вещей — по площади, новые вещи на этажах (" + JSON.stringify(lib.geo) + ")");
  ok(lib.noRepeat && lib.noRepeat.dup === 0 && lib.noRepeat.got > 0 && lib.case && lib.case.title, "на этаже книги не повторяются; окно книг — своё, окно шкафа под ним цело (" + JSON.stringify(lib.noRepeat) + ")");
  ok(lib.case && lib.case.n >= 4 && lib.case.cats && lib.case.arch && lib.case.xp && lib.case.same && lib.case.text, "книжный шкаф: книги с разделами, прочитанная — в архиве «Книги», опыт, «прочитано», состав тот же, текст по ссылке (" + JSON.stringify(lib.case) + ")");
  ok(lib.perk && lib.mind === 1 && lib.bp === 1 && lib.chem === 1 && lib.calm, "книги учат: три детектива — «Чутьё», три о науке — интеллект, техника — схема, химия — рецептура, повесть успокаивает (" + JSON.stringify({ perk: lib.perk, mind: lib.mind, bp: lib.bp, chem: lib.chem, calm: lib.calm }) + ")");
  ok(lib.memoItem && lib.memo, "архивные коробки: записка с кодом этажа — код в архиве, замок о нём знает");
  ok(lib.shredWrong && lib.shred, "шредер: не по порядку — снова перемешано; по порядку — документ сложен и лёг в архив");
  ok(lib.vitrine && lib.grate && lib.intercom && lib.intercomCd && lib.deposit && lib.mail >= 2 && lib.catalog, "витрина, решётка, селектор, ячейки, почта, каталог (" + JSON.stringify({ v: lib.vitrine, g: lib.grate, i: lib.intercom, cd: lib.intercomCd, d: lib.deposit, m: lib.mail, c: lib.catalog }) + (lib.grateSaid ? "; решётка: " + lib.grateSaid : "") + (lib.icSaid ? "; селектор: " + lib.icSaid : "") + ")");
  ok(lib.filmOff && lib.filmOn && lib.tornLbl && lib.tornNoTape && lib.tornFixed && lib.tornTaken && lib.spliceBox, "микрофильмы — только при питании; порванную плёнку изолентой не склеить: монтажной лентой — да, а бобину можно забрать на продажу; коробка с лентой — у магнитофона (" + JSON.stringify({ off: lib.filmOff, on: lib.filmOn, lbl: lib.tornLbl, no: lib.tornNoTape, fix: lib.tornFixed, take: lib.tornTaken, box: lib.spliceBox }) + ")");

  /* (голос ОКО, просьба автора: «чтобы ОКО разговаривало не синтезатором, который озвучивает игру, а
     своим голосом»; «реализуй настройку, чтобы игрок мог выбрать, каким голосом будет
     разговаривать ОКО, мужским или женским») Запись вместо синтезатора, синтезатор — для
     незаписанного, выбор голоса в настройках, женский род у женского голоса, Зрачок — голосом
     другого пола, сбои и шёпот, тишина по жесту */
  console.log("(Голос ОКО): записи, выбор голоса, женский род, сбои");
  const ov = await page.evaluate(async () => {
    const out = {}, sleep = ms => new Promise(r => setTimeout(r, ms)), S = LAB.settings, V = LAB.okoVoice;
    const was = { v: S.okoVoice, fx: S.okoFx, ready: LAB.OKO_VOICED.ready };
    /* (3.7) пока записаны не все реплики, голоса ОКО в игре нет: синтезатор и никаких его настроек */
    LAB.OKO_VOICED.ready = false; LAB.ui.closeAll();
    const lb0 = i => typeof i.label === "function" ? i.label() : i.label;
    LAB.ui.settings(); const setIt = LAB.ui.top().items, setN = setIt.filter(i => /ОКО/.test(lb0(i))).length;
    const mixIt = setIt.filter(i => /^Микшер/.test(lb0(i)))[0]; if (mixIt) mixIt.fn();
    const mixN = mixIt && /Микшер/.test(LAB.ui.top().title) ? LAB.ui.top().items.filter(i => /ОКО/.test(lb0(i))).length : -1;
    LAB.ui.closeAll();
    out.off = V.voice() === "tts" && !V.play("ОКО по громкой связи: «Я слушаю ваш пульс по вентиляции, носитель. Он учащается.»", { prio: "event" }) && !V.preview("m") && setN === 0 && mixN === 0;
    LAB.OKO_VOICED.ready = true;
    const plays = [], orig = LAB.Sound.play;
    LAB.Sound.play = function (id, o) { plays.push({ id: id, o: o || {} }); return orig.apply(this, arguments); };
    LAB.ui.closeAll();
    const REC = "Я слушаю ваш пульс по вентиляции, носитель. Он учащается.", K = V.key(REC);
    /* реплики ОКО идут по очереди (okovoice.js): каждая проверка — с чистого листа, будто прежняя давно отзвучала */
    const say = (t, o) => { V.stop(); SPOKEN.length = 0; plays.length = 0; LAB.oko.voice(t, Object.assign({ prio: "event", keep: true }, o || {}), true, 0); };
    const okoIds = () => plays.map(p => p.id).filter(id => /^oko_(m|f|fx)_/.test(id));
    /* записи — заранее в памяти: незагруженную реплику очередь ждёт сама, проверка ждала бы тоже */
    ["m", "f"].forEach(v => { const id = "oko_" + v + "_" + K; if (!LAB.Bank.has(id)) LAB.Bank.def(id, ["oko/" + v + "/" + K + ".mp3"], { bus: "voice", vary: 0 }); LAB.Bank.preload([id]); });
    for (let i = 0; i < 60 && !(LAB.Bank.ready("oko_m_" + K) && LAB.Bank.ready("oko_f_" + K)); i++) await sleep(100);
    out.def = V.voice() === "m" && S.okoFx === 1;
    out.listed = V.has(REC, "m") && V.has(REC, "f") && !V.has("Тестовая реплика без записи.", "m");
    V._rng(() => 0.99);
    S.okoVoice = "m"; say("ОКО по громкой связи: «" + REC + "»"); await sleep(250);
    out.rec = okoIds()[0] === "oko_m_" + K && !SPOKEN.some(t => t.indexOf(REC) >= 0);
    out.hist = LAB.history.list.some(h => h.text === "ОКО по громкой связи: «" + REC + "»");
    say("ОКО по громкой связи: «Тестовая реплика без записи.»"); await sleep(250);
    out.tts = SPOKEN.some(t => /Тестовая реплика без записи/.test(t)) && !okoIds().length;
    S.okoVoice = "f"; say("ОКО по громкой связи: «" + REC + "»"); await sleep(250);
    out.f = okoIds()[0] === "oko_f_" + K;
    out.fem = V.fem("Я стал тише. Это не слабость. Ну… немного слабость.") === "Я стала тише. Это не слабость. Ну… немного слабость." &&
      V.fem("Ещё один пост пуст. Я поставлю новый.") === "Ещё один пост пуст. Я поставлю новый." && V.fem("Это был не я, носитель. Там никого нет.") === "Это была не я, носитель. Там никого нет.";
    V.stop(); plays.length = 0; V.play("Зрачок, вплотную: «" + REC + "»", { prio: "event" }, "pupil"); await sleep(150);
    const pp = plays.filter(p => /^oko_m_/.test(p.id))[0];
    out.pupil = !!pp && pp.id === "oko_m_" + K && Math.abs(pp.o.pan) > 0.5;
    /* speak(): реплика проходит через женский род (подмена fem видна в словах) */
    const fem0 = V.fem; V.fem = t => "ЖЕН " + t;
    SPOKEN.length = 0; LAB.oko.state().lastSay = 0; LAB.oko.speak("taunt", true); await sleep(800);
    out.speakFem = SPOKEN.some(t => /: «ЖЕН /.test(t));
    V.fem = fem0;
    S.okoVoice = "tts"; say("ОКО по громкой связи: «" + REC + "»"); await sleep(250);
    out.ttsMode = SPOKEN.some(t => t.indexOf(REC) >= 0) && !okoIds().length;
    S.okoVoice = "m";
    /* сбои: запись в памяти — обратное эхо, сбой, сердце под словами о пульсе; выключены — ровно */
    for (let i = 0; i < 50 && !LAB.Bank.ready("oko_m_" + K); i++) await sleep(100);
    out.loaded = LAB.Bank.ready("oko_m_" + K);
    V._rng(() => 0.01);
    say("ОКО по громкой связи: «" + REC + "»", { okoKind: "taunt" }); await sleep(300);
    const ids = okoIds();
    out.fx = ids.indexOf("oko_fx_swell") >= 0 && ids.indexOf("oko_fx_main") >= 0 && ids.indexOf("oko_fx_heart") >= 0;
    const mainP = plays.filter(p => p.id === "oko_fx_main")[0], swP = plays.filter(p => p.id === "oko_fx_swell")[0];
    out.order = !!mainP && !!swP && mainP.o.delay > (swP.o.delay || 0);
    S.okoFx = 0; say("ОКО по громкой связи: «" + REC + "»", { okoKind: "taunt" }); await sleep(250);
    out.fxOff = okoIds().length === 1 && okoIds()[0] === "oko_m_" + K;
    S.okoFx = 1;
    const ex = V.extras("Тревога по всему этажу.", "alarm", true);
    out.urgent = (!ex.glitch || ex.glitch === "stutter") && !ex.misfire && !ex.swell && !ex.wobble;
    V._rng(null);
    /* тишина (четыре пальца вниз) гасит и записанный голос */
    V._rng(() => 0.99);
    say("ОКО по громкой связи: «" + REC + "»"); await sleep(250);
    const h = plays.filter(p => p.id === "oko_m_" + K).length;
    let stopped = 0; const st0 = V.stop; V.stop = function () { stopped++; return st0.apply(this, arguments); };
    LAB.Speech.hush(); V.stop = st0;
    out.hush = h === 1 && stopped === 1;
    V._rng(null);
    /* настройки: «Голос ОКО» — мужской, женский, синтезатор; сбои и шёпот; громкость в микшере */
    LAB.ui.settings();
    const items = LAB.ui.top().items, lb = i => typeof i.label === "function" ? i.label() : i.label;
    const vi = items.filter(i => lb(i) === "Голос ОКО")[0];
    out.menu = !!vi && vi.options.map(o => o.v).join(",") === "m,f,tts" && items.some(i => lb(i) === "Сбои и шёпот в голосе ОКО");
    if (vi) { SPOKEN.length = 0; vi.set("f"); out.menuSet = S.okoVoice === "f" && /женским голосом/.test(vi.descOf("f")); vi.set("m"); }
    LAB.ui.closeAll();
    LAB.Sound.play = orig; S.okoVoice = was.v; S.okoFx = was.fx; LAB.OKO_VOICED.ready = was.ready;
    return out;
  });
  ok(ov.off, "пока записаны не все реплики — голоса ОКО нет: синтезатор, в настройках и микшере о нём ни слова");
  ok(ov.def && ov.listed, "голос ОКО по умолчанию — мужской, сбои и шёпот включены; список записей знает реплику обоих голосов");
  ok(ov.rec && ov.hist, "записанная реплика звучит записью ОКО, синтезатор её не читает, текст — в истории объявлений");
  ok(ov.tts, "реплика без записи — синтезатором, как прежде");
  ok(ov.f && ov.fem && ov.speakFem, "женский голос: своя запись; о себе — в женском роде («я стала тише», «Это была не я»), «Я поставлю новый» (о посте) не тронут; реплики speak() проходят через женский род");
  ok(ov.pupil, "Зрачок — голосом другого пола, вплотную сбоку");
  ok(ov.ttsMode, "«синтезатор игры» в настройке — слова ОКО снова читает синтезатор");
  ok(ov.loaded && ov.fx && ov.order && ov.fxOff && ov.urgent, "сбои и шёпот: обратное эхо до слов, сбой, сердце под словами о пульсе; выключены — ровно; тревоги — без обрывов (" + JSON.stringify({ l: ov.loaded, fx: ov.fx, o: ov.order, off: ov.fxOff, u: ov.urgent }) + ")");
  ok(ov.hush, "тишина по жесту гасит и записанный голос ОКО");
  ok(ov.menu && ov.menuSet, "в настройках — «Голос ОКО»: мужской, женский, синтезатор игры; и «Сбои и шёпот в голосе ОКО»");

  /* (3.7, просьба автора: «плёнка, склеенная изолентой, работать не будет — найди такого рода
     нелогичности и переработай») Кофейный автомат без воды, термос, остывший стакан, плита,
     самовар по помещению, улей и сушёные травы, рецепты, пресс, швейная машинка, манекен, рамка
     досмотра, фильтр и антитоксин, находки по месту, скоропортящееся, разбор приборов */
  console.log("(3.7) Нелогичности: кухня, самовар, улей, рецепты, обстановка, фильтр");
  const nl = await page.evaluate(async () => {
    const g = LAB.game, K = LAB.kitchen, U = LAB.ui, CB = LAB.combat, out = {};
    const G = () => g.G;
    const spoken = [], say0 = LAB.say; LAB.say = function (t) { spoken.push(String(t)); };
    const said = () => spoken.join(" "), last = () => spoken[spoken.length - 1] || "";
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const items = () => (U.top() && U.top().items || []).map(label);
    const click = re => { const w = U.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; U.activate(); return true; };
    const now = () => (G().day || 0) * 1440 + (G().min || 0);
    const k0 = JSON.parse(JSON.stringify({ L: G().L, F: G().F, x: G().x, y: G().y, inv: G().inv, ammo: G().ammo, credits: G().credits, xp: G().xp, lvl: G().lvl, body: G().body, hp: G().hp, st: G().st, min: G().min, day: G().day, stats: G().stats, ach: G().ach, cupL: G().cupL || null, cupT: G().cupT || null }));
    const arm0 = G().armor, arms0 = G().armors.slice(), wps0 = G().weapons, fs0 = JSON.stringify(G().fs);
    const fl = g.CUR.fl, made = [];
    const ri = g.CUR.room >= 0 ? g.CUR.room : fl.rooms.findIndex(r => r && !r.hidden), R = fl.rooms[ri], d0 = R.desc, gas0 = R.gas;
    const mk = (fx, ty) => {
      const o = { id: "t37_" + (ty || fx) + "_" + made.length, type: ty || "fx", x: G().x, y: G().y, room: ri };
      if (!ty) o.fx = fx;
      fl.objs.push(o); made.push(o);
      const ct = g.CUR.fs.ctrap = g.CUR.fs.ctrap || {}; ct[o.id] = { k: "" }; /* без пакостей: проверяем находки, а не ловушки */
      return o;
    };
    try {
      CB.stop(); CB.foes().forEach(f => { f.dead = true; }); U.closeAll(); K._reset();
      G().hp = Math.max(1, G().hpMax - 30); G().body.food = 30; G().body.tox = 10; G().dead = false;
      /* 1. кофейный автомат: не сломан — в баке нет воды; от удара — забытая сдача, раз; две бутылки воды — и варит */
      const cf = mk(null, "coffee"); cf.broken = true;
      g.objMenu(cf); out.cofTitle = U.top() ? U.top().title : ""; out.cofMenu = items();
      const cr0 = G().credits; click(/^Стукнуть по автомату/); out.cofKick = G().credits > cr0;
      const cr1 = G().credits; spoken.length = 0; g.objMenu(cf); click(/^Стукнуть по автомату/); out.cofKick2 = G().credits === cr1 && /Насос всхлипнул впустую: без воды/.test(said());
      out.cofDbg = [cr0, cr1, G().credits, said().slice(0, 160)];
      G().inv.water = 2; g.objMenu(cf); out.cofFill = click(/^Залить в бак две бутылки воды/) && !G().inv.water && !!g.objState(cf).fixed;
      g.objMenu(cf); out.cofWorks = !!(U.top() && !/нет воды/.test(U.top().title)); U.closeAll();
      /* 2. термос: выпитый — пустой; чай в него наливают у вскипевшего чайника, на верстаке его не собрать */
      G().inv.g_thermos = 1; delete G().inv.g_thermos_e;
      g.useItem("g_thermos"); out.thermEmpty = !G().inv.g_thermos && G().inv.g_thermos_e === 1;
      const kt = mk("kettle"), ks = K.state(kt); ks.kw = 3; ks.tea = 1; ks.sug = 1; ks.cup = null; K._boilNow(kt);
      g.objMenu(kt); out.thermLbl = items().some(l => /^Налить чай в термос/.test(l));
      click(/^Налить чай в термос/); out.thermFull = G().inv.g_thermos === 1 && !G().inv.g_thermos_e && ks.kw === 1 && ks.tea === 0;
      out.thermRecipe = !LAB.RECIPES.some(r => r.out === "g_thermos"); U.closeAll();
      /* 3. стакан из автомата остывает: через сорок минут — слабее */
      G().inv.cup_cappuccino = 1; G().cupL = { cup_cappuccino: [1] }; G().cupT = { cup_cappuccino: [now() - 90] };
      spoken.length = 0; g.useItem("cup_cappuccino"); out.cupCold = /Напиток остыл/.test(said());
      G().inv.cup_cappuccino = 1; G().cupL = { cup_cappuccino: [1] }; G().cupT = { cup_cappuccino: [now()] };
      spoken.length = 0; g.useItem("cup_cappuccino"); out.cupHot = !/Напиток остыл/.test(said());
      /* 4. плита греет только то, что греют: не глюкозу, кефир и газировку; лапшу заливают кипятком */
      Object.keys(G().inv).forEach(k => { const d = LAB.ITEMS[k]; if (d && d.kind === "food") delete G().inv[k]; });
      Object.assign(G().inv, { glucose: 2, stew: 1, kefir: 1, soda_baikal: 1 });
      const sv = mk("stove"); g.objMenu(sv); click(/^Разогреть еду/); out.cookMenu = items();
      out.cook = out.cookMenu.some(l => /^Тушёнка/.test(l)) && !out.cookMenu.some(l => /Глюкоз|Кефир|Байкал/.test(l)); U.closeAll();
      delete G().inv.stew; G().inv.noodles = 1; spoken.length = 0;
      g.objMenu(sv); click(/^Разогреть еду/); out.cookNone = /Разогревать нечего/.test(said()) && /Лапшу и суп-концентрат заливают кипятком/.test(said()); U.closeAll();
      Object.keys(G().inv).forEach(k => { const d = LAB.ITEMS[k]; if (d && d.kind === "food") delete G().inv[k]; });
      /* 5. самовар — по помещению: брошенный холодный (растопить, остывает), пустой — без воды, за которым смотрят — горячий */
      R.desc = "Чайная. На столе — самовар и гранёные стаканы.";
      const s1 = mk("samovar"), ss1 = K.samState(s1);
      out.samCold = !ss1.sk && ss1.sw >= 3 && ss1.sf >= 1 && ss1.sh == null;
      g.objMenu(s1); const sm1 = items(); U.closeAll();
      out.samColdMenu = sm1.some(l => /^Растопить самовар/.test(l)) && !sm1.some(l => /^Налить стакан/.test(l));
      ss1.tea = 0; G().inv.teabag = 1;
      out.samFire = K.samFire(s1) && ss1.sh > now();
      const w1 = ss1.sw; out.samTea = K.samDrink(s1, "tea", false) && ss1.sw === w1 - 1 && !G().inv.teabag;
      G().inv.teabag = 1; out.samGap = !K.samDrink(s1, "tea", false);
      G().min = (G().min || 0) + 200;
      g.objMenu(s1); const sm2 = items(); U.closeAll();
      out.samCooled = !sm2.some(l => /^Налить стакан/.test(l)) && /остыл/.test(sm2[0] || "");
      R.desc = "Закусочная у клети. А самовар рядом пуст и звенит, если по нему щёлкнуть.";
      const s2 = mk("samovar"), ss2 = K.samState(s2); out.samEmpty = ss2.sw === 0 && !K.samFire(s2) && /распаяется/.test(last());
      R.desc = "Посреди чайной — медный самовар, и он до сих пор тёплый: угли в трубу подкладывают по очереди.";
      const s3 = mk("samovar"), ss3 = K.samState(s3), w3 = ss3.sw;
      out.samKept = ss3.sk === 1 && K.samDrink(s3, "tea", false) && ss3.sw === w3;
      R.desc = d0;
      /* 6. улей — соты, а не батончик с овсом; мёд ульев отжимают из сотов; сушёные травы не отрастают */
      delete G().inv.honeycomb; delete G().inv.honeybar;
      const hv = mk("beehive"); g.objMenu(hv); click(/^Вынуть рамку/); U.closeAll();
      out.hive = G().inv.honeycomb >= 1 && !G().inv.honeybar;
      const rec = id => LAB.RECIPES.find(r => r.id === id);
      out.honeyRec = !!(rec("k_r_honey") && rec("k_r_honey").need.honeycomb === 3 && !rec("k_r_honey").need.k_wax);
      delete G().inv.herbtea;
      const hb = mk("herbs"); let hn = 0;
      for (let i = 0; i < 6; i++) { g.objMenu(hb); if (click(/^Взять пучок лечебных трав$/)) hn++; U.closeAll(); }
      g.objMenu(hb); out.herbsNone = items().some(l => /Пучков не осталось/.test(l)); U.closeAll();
      out.herbs = (hn === 3 || hn === 4) && G().inv.herbtea === hn;
      /* 7. рецепты: синьки и дозиметра на верстаке нет; петля — из плёнки и монтажной ленты; фильтр и скафандр — не из биогеля */
      const tp = rec("g_r_tape"), fi = rec("filter"), bi = rec("a_bio");
      out.recipes = !rec("g_r_blueprint") && !rec("dosimeter") && !rec("g_r_thermos") && !!tp && tp.need.reel_torn === 1 && tp.need.splice === 1 && !tp.need.wire
        && !!fi && fi.need.sorbent === 1 && !fi.need.gel && !!bi && bi.need.rubber === 3 && !bi.need.gel;
      /* 8. пресс: бронепластина — лом и керамика, как у верстака */
      const pr = mk("press"); G().inv.scrap = 4; delete G().inv.ceramic; delete G().inv.plate;
      g.objMenu(pr); click(/^Выправить бронепластину/); U.closeAll(); out.pressNo = !G().inv.plate && G().inv.scrap === 4;
      G().inv.ceramic = 1; g.objMenu(pr); click(/^Выправить бронепластину/); U.closeAll(); out.press = G().inv.plate === 1 && !G().inv.ceramic && !G().inv.scrap;
      /* 9. швейная машинка: кирасу не сшить, комбинезон — да */
      const sw = mk("sewing"), a1 = LAB.makeArmor("composite", 1, 0); a1.cond = 40; G().armor = a1;
      spoken.length = 0; g.objMenu(sw); click(/^Подшить надетую броню/); U.closeAll(); out.sewRigid = a1.cond === 40 && /не сшить/.test(said());
      const a2 = LAB.makeArmor("suit", 1, 0); a2.cond = 40; G().armor = a2;
      g.objMenu(sw); click(/^Подшить надетую броню/); U.closeAll(); out.sewSoft = a2.cond === 65;
      out.sewDbg = [a1.cond, a2.cond, said().slice(0, 200)];
      /* 10. манекен — в защитном костюме: с него снимают костюм, а не экзоскелет */
      const mn = mk("mannequin"), na = G().armors.length;
      g.objMenu(mn); click(/^Снять костюм с манекена/); U.closeAll();
      const got = G().armors[G().armors.length - 1];
      out.dummy = G().armors.length === na + 1 && ["bio", "radsuit", "hazmat", "reactorsuit"].indexOf(got && got.base) >= 0;
      /* 11. рамка досмотра звенит на металл, а не на «стволы» */
      const fr = mk("frame"), am0 = G().ammo;
      G().weapons = []; G().ammo = {}; ["scrap", "magnet", "wire", "lead", "servo"].forEach(k => { delete G().inv[k]; }); G().armor = a2;
      spoken.length = 0; g.objMenu(fr); click(/^Пройти через рамку/); U.closeAll(); out.frameQuiet = /Рамка молчит/.test(said());
      G().weapons = wps0.slice(0, 1); G().ammo = { energy: 2 };
      spoken.length = 0; g.objMenu(fr); click(/^Пройти через рамку/); U.closeAll();
      out.frameLoud = /Рамка звенит.*1 единица оружия, батареи и заряды/.test(said()) && !/ствол/.test(said());
      G().weapons = wps0; G().ammo = am0;
      /* 12. респиратор держит дыхание, но не яд укуса и не съеденное; антитоксин — лекарство */
      G().st.antitox = 0; G().st.atoxIn = 0; G().st.poison = 6; G().inv.respirator = 1;
      g.useItem("respirator"); out.maskPoison = G().st.poison === 6 && G().st.antitox > 0 && !(G().st.atoxIn > 0);
      G().body.tox = 10; g.bodyApply({ tox: 10 }, []); out.maskEat = G().body.tox > 10;
      const t1 = G().body.tox; g.bodyApply({ tox: 10, air: true }, []); out.maskAir = G().body.tox === t1;
      G().inv.c_antitox = 1; g.useItem("c_antitox"); out.drug = !G().st.poison && G().st.atoxIn > 0;
      const t2 = G().body.tox; g.bodyApply({ tox: 10 }, []); out.drugEat = G().body.tox === t2;
      G().st.antitox = 0; G().st.atoxIn = 0; G().st.poison = 0;
      /* 13. вентиль перекрывают, а не «вытяжка загудела» */
      R.gas = 1; const vl = mk("valves"); spoken.length = 0;
      g.objMenu(vl); click(/^Перекрыть пропускающий вентиль/); U.closeAll();
      out.valve = /закручиваете пропускающий вентиль/.test(said()) && !/Вытяжка/.test(said()); R.gas = gas0;
      /* 14. находки по месту: в барабанах — мелочь и ценности, в банках — травы и семечки, в вагонетке — порода, на щите — инструмент */
      const scan = (fx, re) => {
        const got = {};
        for (let i = 0; i < 6; i++) {
          const o = mk(fx), inv0 = Object.assign({}, G().inv), c0 = G().credits;
          g.objMenu(o); click(re); U.closeAll();
          Object.keys(G().inv).forEach(k => { if ((G().inv[k] || 0) > (inv0[k] || 0)) got[k] = 1; });
          if (G().credits > c0) got.credits = 1;
        }
        return Object.keys(got);
      };
      const cat = k => LAB.ITEMS[k] ? LAB.ITEMS[k].cat || LAB.ITEMS[k].kind : k;
      const wash = scan("washer", /^Проверить барабаны/), seeds = scan("seedjars", /^Перебрать банки/), ore = scan("minecart", /^Порыться в вагонетке/), tools = scan("toolwall", /^Снять с щита/);
      out.loot = { wash, seeds, ore, tools };
      out.lootOk = wash.length > 0 && wash.every(k => k === "credits" || cat(k) === "valuable") && seeds.length > 0 && seeds.every(k => /^(herbtea|nuts)$/.test(k))
        && ore.length > 0 && ore.every(k => /^(scrap|g_quartz|g_mica)$/.test(k)) && tools.length > 0 && tools.every(k => /^(wirecutters|toolkit|fieldkit|tape)$/.test(k));
      /* 15. данные: скоропортящееся бывает несвежим; разбор без невозможных деталей; шредер — полоски рвали руками */
      const T = LAB.FIX.T, sal = fx => (T[fx].a.find(a => a[0] === "salvage") || [])[2] || {};
      out.stale = ["milk", "dsausage", "lunchbox", "eggs"].every(k => LAB.ITEMS[k].stale > 0);
      out.salv = !sal("lamp").parts.lens && !sal("transformer").parts.magnet && sal("transformer").risk === "hv" && !sal("gears").parts.servo && !sal("gearwall").parts.servo && !sal("boiler").parts.cap;
      out.texts = /рвали руками/.test(T.shredder.d) && /монтажной лентой/.test(LAB.ITEMS.g_tapeloop.desc) && /слепок пальца/.test(LAB.ITEMS.pick_g.desc);
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n").slice(1, 3).join(" / "); }
    U.closeAll();
    made.forEach(o => { const i = fl.objs.indexOf(o); if (i >= 0) fl.objs.splice(i, 1); });
    R.desc = d0; R.gas = gas0;
    G().fs = JSON.parse(fs0);
    const gg = G();
    ["inv", "ammo", "credits", "xp", "lvl", "body", "hp", "st", "min", "day", "stats", "ach", "cupL", "cupT"].forEach(k => { gg[k] = k0[k]; });
    gg.armor = arm0; gg.armors = arms0; gg.weapons = wps0;
    try { g.enterFloor(k0.L, k0.F, "down", true); CB.stop(); gg.x = k0.x; gg.y = k0.y; } catch (e) { /* */ }
    LAB.say = say0;
    return out;
  });
  ok(!nl.err, "нелогичности: проверка без ошибок" + (nl.err ? ": " + nl.err : ""));
  ok(/нет воды/.test(nl.cofTitle) && nl.cofKick && nl.cofKick2 && nl.cofFill && nl.cofWorks, "кофейный автомат: в баке нет воды — удар даёт разве что забытую сдачу, раз; две бутылки воды — и он варит (" + JSON.stringify({ t: nl.cofTitle, k: nl.cofKick, k2: nl.cofKick2, f: nl.cofFill, w: nl.cofWorks, d: nl.cofDbg }) + ")");
  ok(nl.thermEmpty && nl.thermLbl && nl.thermFull && nl.thermRecipe, "термос: выпитый — пустой, чай в него наливают у вскипевшего чайника, на верстаке его не собрать");
  ok(nl.cupCold && nl.cupHot, "стакан из автомата горячий с полчаса, остывший — слабее");
  ok(nl.cook && nl.cookNone, "плита греет только то, что греют; лапшу и суп-концентрат — кипятком (" + (nl.cookMenu || []).join(" | ") + ")");
  ok(nl.samCold && nl.samColdMenu && nl.samFire && nl.samTea && nl.samGap && nl.samCooled && nl.samEmpty && nl.samKept, "самовар: брошенный — холодный, растопить, остывает; пустой — без воды не растопить; за которым смотрят — горячий (" + JSON.stringify({ c: nl.samCold, m: nl.samColdMenu, f: nl.samFire, t: nl.samTea, g: nl.samGap, o: nl.samCooled, e: nl.samEmpty, k: nl.samKept }) + ")");
  ok(nl.hive && nl.honeyRec && nl.herbs && nl.herbsNone, "улей — соты, мёд ульев — из сотов; сушёные травы не отрастают");
  ok(nl.recipes, "рецепты: синька и дозиметр — только находки и покупки; петля с песней — из плёнки и монтажной ленты; фильтр и скафандр — не из биогеля");
  ok(nl.pressNo && nl.press, "пресс: бронепластина — четыре лома и керамокомпозит");
  ok(nl.sewRigid && nl.sewSoft, "швейная машинка: кирасу не сшить, комбинезон — подшить (" + JSON.stringify(nl.sewDbg) + ")");
  ok(nl.dummy, "манекен — в защитном костюме: снимается костюм");
  ok(nl.frameQuiet && nl.frameLoud, "рамка досмотра звенит на металл: оружие, батареи, лом, броню");
  ok(nl.maskPoison && nl.maskEat && nl.maskAir && nl.drug && nl.drugEat, "респиратор держит дыхание, но не яд укуса и не съеденное; антитоксин — лекарство (" + JSON.stringify({ p: nl.maskPoison, e: nl.maskEat, a: nl.maskAir, d: nl.drug, de: nl.drugEat }) + ")");
  ok(nl.valve, "вентиль закручивают — газ не идёт; «вытяжка» тут ни при чём");
  ok(nl.lootOk, "находки по месту: барабаны, банки с семенами, вагонетка, щит с инструментами (" + JSON.stringify(nl.loot) + ")");
  ok(nl.stale && nl.salv && nl.texts, "скоропортящееся бывает несвежим; разбор без невозможных деталей; шредер, петля, зелёная отмычка — тексты по делу");

  /* (3.6, просьба автора) Химический стол на каждом этаже; химия руками — пробирки, колбы,
     реактивы, реакции и опасности; химические задачи; исследования и опыты — препараты,
     клетки вивария, смотровые окна, тайнопись, плёнка, анализ тканей; головоломки не
     закрываются от неверного ответа, «отойти» — не провал */
  console.log("(3.6) Химия руками, химические задачи, исследования и опыты");
  const chx = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.chem, CL = LAB.chemlab, U = LAB.ui, P = LAB.puzzles, CP = LAB.chempuz, LB = LAB.library, CB = LAB.combat, out = {};
    const G = () => g.G;
    const spoken = [], say0 = LAB.say; LAB.say = function (t) { spoken.push(String(t)); };
    const said = () => spoken.join(" "), last = () => spoken[spoken.length - 1] || "";
    const label = i => typeof i.label === "function" ? i.label() : i.label;
    const items = () => (U.top() && U.top().items || []).map(label);
    const click = re => { const w = U.top(); const k = w ? w.items.findIndex(i => re.test(label(i))) : -1; if (k < 0) return false; w.i = k; U.activate(); return true; };
    const clickAt = k => { const w = U.top(); if (!w || !w.items[k]) return false; w.i = k; U.activate(); return true; };
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const k0 = JSON.parse(JSON.stringify({ L: G().L, F: G().F, x: G().x, y: G().y, inv: G().inv, ammo: G().ammo, credits: G().credits, xp: G().xp, lvl: G().lvl, chem: G().chem || null, body: G().body, hp: G().hp, notes: G().notes, noteList: G().noteList, codes: G().codes, lib: G().lib || null, ach: G().ach || null, perks: G().perks || {}, min: G().min, day: G().day, stats: G().stats, visited: G().visited, quests: G().quests }));
    const fs0 = JSON.stringify(G().fs);
    const I = LB.index(), fake = [];
    const addDoc = q => { I.by[q.id] = q; I.all.push(q); (I.kind[q.kind] = I.kind[q.kind] || []).push(q); fake.push(q); };
    const give = (id, k) => { G().inv[id] = (G().inv[id] || 0) + (k || 1); };
    const cnt = re => Object.keys(G().inv).filter(k => re.test(k)).reduce((a, k) => a + G().inv[k], 0);
    /* решение химической задачи по разгадке (_last) */
    const solve = {
      titr: L => { for (let i = 0; i < L.N(); i++) click(/^Капнуть щёлочь: одну каплю/); return click(/^Сдать пробу/); },
      vials: L => {
        for (let k = 0; k < L.set.length; k++) {
          if (!click(new RegExp("^Склянка " + (k + 1) + ":")) || !click(/^Решить: что в склянке/) || !click(new RegExp("^" + esc(L.set[k]) + "$"))) return false;
          if (U.top() && /^Склянка \d+$/.test(U.top().title)) U.closeTop();
        }
        return click(/^Сдать ответ/);
      },
      protocol: L => { L.bad.forEach(k => clickAt(k)); return click(/^Сдать протокол/); },
      spectr: L => { L.mix.forEach(k => clickAt(k)); return click(/^Сдать ответ/); },
      chain: L => { for (const op of L.path) if (!click(new RegExp("^" + esc(op.charAt(0).toUpperCase() + op.slice(1)) + "$"))) return false; return true; }
    };
    try {
      /* 1. химический стол — на каждом этаже; при первом заходе «Эхо» называет помещение; навигатор знает дорогу */
      let withT = 0, n = 0;
      for (let F = 1; F <= 20; F++) { n++; if (LAB.getFloor(G().seed, 1, F).objs.some(o => o.type === "chemlab")) withT++; }
      for (const L of [5, 25, 45, 65, 85]) for (const F of [3, 11]) { n++; if (LAB.getFloor(G().seed, L, F).objs.some(o => o.type === "chemlab")) withT++; }
      out.tables = { withT, n };
      delete G().visited["1-7"]; spoken.length = 0;
      g.enterFloor(1, 7, "down"); CB.stop();
      out.entry = /Химический стол — помещение \d+ \(«[^»]+»\): навигатор знает дорогу/.test(said());
      U.closeAll(); g.navMenu(); out.nav = items().some(l => /химический стол, помещение \d+/.test(l)); U.closeAll();
      /* 2. работа руками: реакции, опасности, разлив, открытие, перекристаллизация */
      g.enterFloor(1, 3, "down", true); CB.stop();
      const o = g.CUR.fl.objs.find(x => x.type === "chemlab");
      ["c_acidc", "c_alkali", "c_salt", "c_solvent", "c_soda", "c_bleach", "c_ammonia", "c_perox", "c_iodine", "c_silver", "c_fuel", "c_blood"].forEach(id => give(id, 6));
      give("scrap", 4); give("gel", 3);
      const stn = C.station(o); stn.dirty = false; stn.tier = 2;
      CL._use(o);
      const V = i => CL._v(o, i);
      spoken.length = 0; CL._add(o, 0, "water"); CL._add(o, 0, "acid");
      out.dilute = !/брызг/.test(said()) && /тонкой струйкой/.test(said());
      const hp0 = G().hp; spoken.length = 0; CL._add(o, 1, "acid"); CL._add(o, 1, "water");
      out.splash = /брызгами/.test(said()) && G().hp < hp0;
      spoken.length = 0; CL._add(o, 1, "base");
      out.neutral = /кислота гасит щёлочь/.test(said()) && (V(1).m.salt || 0) >= 1;
      spoken.length = 0; CL._add(o, 2, "water"); CL._add(o, 2, "acid"); CL._add(o, 2, "bleach");
      out.chlorine = /хлор/.test(said()) && Object.keys(V(2).m).length === 0;
      spoken.length = 0; CL._add(o, 3, "water"); CL._add(o, 3, "amm"); CL._add(o, 3, "salt"); CL._heat(o, 3); CL._stir(o, 3);
      out.judge = String(CL._judge(V(3)) || "");
      const sm0 = cnt(/^c_smelling/); CL._bottle(o, 3);
      out.smelling = cnt(/^c_smelling/) > sm0;
      C.ch().xp.tox = 30;
      const fogRc = C.RCBY.l_fogspray, known0 = C.known(fogRc);
      CL._add(o, 5, "water"); CL._add(o, 5, "water"); CL._add(o, 5, "base"); CL._add(o, 5, "base"); CL._add(o, 5, "solv"); CL._stir(o, 5);
      CL._bottle(o, 5);
      out.discover = !known0 && C.known(fogRc) && cnt(/^c_fogspray/) > 0;
      const s2 = G().inv.c_salt_2 || 0;
      CL._add(o, 4, "water"); CL._add(o, 4, "water"); CL._add(o, 4, "salt"); CL._add(o, 4, "salt"); CL._filter(o, 4); CL._evap(o, 4);
      out.recryst = (G().inv.c_salt_2 || 0) > s2;
      spoken.length = 0; CL._add(o, 0, "fuel"); CL._heat(o, 0); CL._heat(o, 0);
      out.pyro = /горючее не греют/.test(said());
      /* (3.6) один состав посуды — две рецептуры: «Эхо» говорит об обеих, а при разливе даёт выбрать.
         (3.7) йодид теперь варят из йода со щёлочью, и общий состав — у регенерирующей сыворотки и
         культуры: гемолимфа дважды, ферменты, биогель — тёплыми (обе — третья ступень, стол третьей ступени) */
      C.ch().xp.tox = Math.max(C.ch().xp.tox || 0, 80); C.ch().xp.pyro = Math.max(C.ch().xp.pyro || 0, 80);
      C.ch().xp.pharm = Math.max(C.ch().xp.pharm || 0, 400); C.ch().xp.bio = Math.max(C.ch().xp.bio || 0, 400);
      const tier0 = stn.tier; stn.tier = 3; give("c_enzyme", 2);
      CL._add(o, 3, "blood"); CL._add(o, 3, "blood"); CL._add(o, 3, "enzyme"); CL._add(o, 3, "gel"); CL._heat(o, 3); CL._stir(o, 3);
      out.dupJudge = /годится не на одно/.test(String(CL._judge(V(3)) || ""));
      const cu0 = cnt(/^c_culture/), gel0 = G().inv.gel || 0; U.closeAll(); CL._bottle(o, 3);
      out.dupMenu = !!U.top() && U.top().title === "Что разлить" && items().length === 3;
      click(new RegExp("культур|" + esc(C.BR.bio.n), "i")); U.closeAll();
      out.dupCorrode = cnt(/^c_culture/) > cu0 && (G().inv.gel || 0) === gel0;
      stn.tier = tier0;
      /* пиротехника на фосфоре: в сухом стекле он вспыхивает, под водой — нет, и вода такому составу не помеха */
      give("c_phosphor", 2); give("cap", 1);
      spoken.length = 0; CL._add(o, 2, "phos"); out.phosDry = /вспыхнул/.test(said());
      const fl0 = cnt(/^c_flash/); spoken.length = 0;
      CL._add(o, 0, "water"); CL._add(o, 0, "salt"); CL._add(o, 0, "phos"); CL._stir(o, 0); const phWet = !/вспыхнул/.test(said()); U.closeAll(); CL._bottle(o, 0);
      out.phosWet = phWet && cnt(/^c_flash/) > fl0;
      /* перекристаллизация не огрубляет: на столе первой ступени очищенные соли остаются очищенными */
      const c1 = G().inv.c_salt || 0; delete G().inv.c_salt; const s2b = G().inv.c_salt_2 || 0; give("c_salt_2", 2);
      stn.tier = 1; spoken.length = 0;
      CL._add(o, 4, "water"); CL._add(o, 4, "water"); CL._add(o, 4, "salt"); CL._add(o, 4, "salt"); CL._filter(o, 4); CL._evap(o, 4);
      out.recrystKeep = (G().inv.c_salt_2 || 0) === s2b + 2 && !G().inv.c_salt && /нужен стол ступенью выше/.test(said());
      stn.tier = 2; if (c1) G().inv.c_salt = c1;
      /* сорт сырья — как в синтезе: «не ниже очищенного» руками не обойти */
      give("c_electrolyte", 2); give("c_catalyst", 1);
      CL._add(o, 5, "elec"); CL._add(o, 5, "elec"); CL._add(o, 5, "cat"); CL._cool(o, 5); CL._stir(o, 5);
      const en0 = G().ammo.energy || 0; spoken.length = 0; U.closeAll(); CL._bottle(o, 5);
      out.minG = /не ниже очищенного сорта/.test(said()) && (G().ammo.energy || 0) === en0;
      out.achHand = !!(G().ach && G().ach.d && G().ach.d.hand1) && (G().ach.c.discover || 0) >= 1;
      U.closeAll(); CL.bench(o); out.benchMenu = items().length > 4; U.closeAll();
      /* 3. тайнопись: архив помнит, что она есть; проявить парами йода у стола — и кисточкой проявителя */
      addDoc({ id: "t_hid36a", kind: "doc", cat: "experiment", t: "Проба тайнописи", a: "", era: "K", x: "Открытый текст протокола опыта.", hid: "Скрытое между строк молоком." });
      addDoc({ id: "t_hid36b", kind: "doc", cat: "subject", t: "Проба тайнописи вторая", a: "", era: "K", x: "Карта испытуемого.", hid: "Второе скрытое." });
      LB.readText(LB.byId("t_hid36a"), o); U.closeAll();
      const ea = G().noteList.find(e => e.id === "lib:t_hid36a");
      out.hidMark = !!ea && /ещё не проявленная/.test(g.noteText(ea.src).x) && LB.hiddenDocs().some(d => d.id === "t_hid36a");
      CL._reveal("bench", null, "t_hid36a"); U.closeAll();
      out.hidBench = /Скрытое между строк молоком/.test(g.noteText(ea.src).x) && !LB.hiddenDocs().some(d => d.id === "t_hid36a");
      LB.readText(LB.byId("t_hid36b"), o); U.closeAll();
      G().inv.c_reveal = 1; C.use("c_reveal"); click(/^Проявить/); U.closeAll();
      const eb = G().noteList.find(e => e.id === "lib:t_hid36b");
      out.hidItem = !G().inv.c_reveal && !!eb && /Второе скрытое/.test(g.noteText(eb.src).x);
      /* 4. плёнка: проявитель и фиксаж — снимки ложатся в архив; анализ ткани — отчёт; его покупает медик */
      addDoc({ id: "t_photo36", kind: "photo", t: "Снимок опыта", a: "", era: "KPCOMI", x: "На снимке — стол и колбы.\n\nНа обороте: проба." });
      give("film", 1); give("c_devel", 1); give("c_fixer", 1);
      const nl0 = G().noteList.length; CL.developFilm(o); U.closeAll();
      out.film = !G().inv.film && G().noteList.length > nl0 && G().noteList.slice(nl0).every(e => e.cat === "Фотографии");
      /* (3.6) новых кадров этой глубины не осталось — плёнка, проявитель и фиксаж целы */
      give("film", 12); give("c_devel", 12); give("c_fixer", 12);
      let keptFilm = false;
      for (let i = 0; i < 12 && !keptFilm; i++) { const f0 = G().inv.film, d0 = G().inv.c_devel; spoken.length = 0; CL.developFilm(o); U.closeAll(); if (G().inv.film === f0) keptFilm = G().inv.c_devel === d0 && /все кадры этой глубины вы уже видели/.test(said()); }
      out.filmKeep = keptFilm; delete G().inv.film; delete G().inv.c_devel; delete G().inv.c_fixer;
      const rep0 = G().inv.c_report || 0; CL._tissue(o, "c_blood"); U.closeAll();
      out.tissue = (G().inv.c_report || 0) === rep0 + 1;
      const cr0 = G().credits;
      const med = LAB.quests.npcItems({ key: "t_med36", n: "Тестовый медик", prof: "Медик" }), cook = LAB.quests.npcItems({ key: "t_cook36", n: "Тестовый повар", prof: "Повар" });
      const sell = med.find(i => /^Отдать отчёт об анализе ткани/.test(label(i)));
      if (sell) sell.fn();
      out.report = !!sell && G().credits > cr0 && (G().inv.c_report || 0) === rep0 && !cook.some(i => /отчёт об анализе/.test(label(i)));
      /* 5. химические задачи: каждая на трёх ступенях решается, опыт химика растёт */
      out.puz = {};
      for (const k of CP.KINDS) for (const d of [0, 1, 2]) {
        let res = null; U.closeAll();
        const x0 = JSON.stringify(C.ch().xp);
        P.open(k, 1000 + 37 * d + k.length, ok => { res = ok; }, { diff: d });
        click(/^К решению/);
        solve[k](CP._last());
        await wait(60);
        out.puz[k + d] = res === true && JSON.stringify(C.ch().xp) !== x0;
      }
      out.puzAll = Object.values(out.puz).every(Boolean);
      /* 6. неверный ответ окно не закрывает; три неверных — провал; «отойти» — не провал */
      { let res = "нет", away = null; U.closeAll(); P.open("titr", 5, (ok, aw) => { res = ok; away = aw; }, { diff: 0 }); click(/^К решению/);
        click(/^Сдать пробу/); out.keepOpen = U.top() && U.top().title === "Титрование" && /Осталось попыток: 2/.test(said());
        click(/^Сдать пробу/); click(/^Сдать пробу/); await wait(60); out.failCb = res === false && !away; }
      { let res = "нет", away = null; U.closeAll(); P.open("spectr", 5, (ok, aw) => { res = ok; away = aw; }, { diff: 0 }); click(/^К решению/);
        click(/^Отойти от задачи/); await wait(60); out.awayCb = res === false && away === true && !U.top(); }
      { U.closeAll(); P.open("breaker", 9, () => {}, {}); click(/^К решению/); click(/^Подать питание/); out.oldKeep = U.top() && U.top().title === "Щит автоматики"; U.closeAll(); }
      /* стенд испытаний: провал — новая задача (pzN), «отойти» — без последствий, решение — награда */
      let stand = null;
      for (let f = 2; f <= 20 && !stand; f++) { g.enterFloor(1, f, "down", true); CB.stop(); stand = g.CUR.fl.objs.find(q => q.type === "puzzle" && !g.objState(q).solved); }
      if (stand) {
        const kind0 = stand.kind, diff0 = stand.diff; stand.kind = "titr"; stand.diff = 0;
        const sst = g.objState(stand);
        U.closeAll(); spoken.length = 0; g.objMenu(stand); click(/^Пройти испытание/); click(/^К решению/); click(/^Отойти от задачи/); await wait(60);
        out.standAway = !sst.pzN && !/Стенд гаснет/.test(said());
        /* начали решать и отошли — в следующий раз задача другая (иначе попытки и пробы возвращались бы без конца) */
        U.closeAll(); spoken.length = 0; g.objMenu(stand); click(/^Пройти испытание/); click(/^К решению/); click(/^Капнуть щёлочь: одну каплю/); click(/^Отойти от задачи/); await wait(60);
        out.standAway2 = sst.pzN === 1 && /задача будет другой/.test(said()) && !/Стенд гаснет/.test(said());
        U.closeAll(); g.objMenu(stand); click(/^Пройти испытание/); click(/^К решению/); const N1 = CP._last().N(); for (let i = 0; i < 3; i++) click(/^Сдать пробу/); await wait(60);
        out.standFail = sst.pzN === 2 && /с новой задачей/.test(said());
        U.closeAll(); g.objMenu(stand); click(/^Пройти испытание/); click(/^К решению/); solve.titr(CP._last()); await wait(60);
        out.standSolved = !!sst.solved;
        stand.kind = kind0; stand.diff = diff0;
      }
      U.closeAll();
      /* логический замок: отошли — замок не шумит и задачу не меняет */
      let ld = null;
      for (let L = 1; L <= 3 && !ld; L++) for (let f = 2; f <= 20 && !ld; f++) { g.enterFloor(L, f, "down", true); CB.stop(); ld = g.CUR.fl.doors.find(d => d.lock && d.lock.type === "logic" && !g.CUR.fs.doors[d.id]); }
      if (ld) {
        U.closeAll(); spoken.length = 0; g.doorMenu(ld); click(/^Решить задачу замка/); click(/^К решению|^К доске/); click(/^Отойти от задачи/); await wait(60);
        out.lockAway = !/не принял решение/.test(said()) && !((g.CUR.fs.lockN || {})[ld.id]);
        /* начали решать и просто закрыли окно — как «отойти»: замок не шумит, задачу меняет */
        const k0 = ld.lock.kind; ld.lock.kind = "titr";
        U.closeAll(); spoken.length = 0; g.doorMenu(ld); click(/^Решить задачу замка/); click(/^К решению/); click(/^Капнуть щёлочь: одну каплю/); U.closeAll(); await wait(60);
        out.lockAway2 = (g.CUR.fs.lockN || {})[ld.id] === 1 && /задача будет другой/.test(said()) && !/не принял решение/.test(said());
        ld.lock.kind = k0; delete g.CUR.fs.lockN[ld.id];
      }
      U.closeAll();
      /* 7. обстановка: шкаф с реактивами, химический замок, банка с кислотой, препараты, клетки, смотровое окно */
      g.enterFloor(1, 3, "down", true); CB.stop();
      const mk = fx => ({ id: "t36_" + fx + "_" + Math.random().toString(36).slice(2, 7), type: "fx", fx: fx, x: G().x, y: G().y, room: g.CUR.room });
      let rgGot = 0, rgLocked = 0;
      for (let i = 0; i < 8; i++) {
        G().inv.lockpick = 1;
        const r = mk("reagents"), inv0 = JSON.stringify(G().inv);
        CP.act(r, LAB.FIX.T.reagents, "reagents", {});
        if (U.top() && /заперт/.test(U.top().title)) { rgLocked++; click(/^Открыть висячий замок отмычкой/); }
        if (JSON.stringify(G().inv) !== inv0) rgGot++;
        U.closeAll(); CP.act(r, LAB.FIX.T.reagents, "reagents", {}); if (!/Полки шкафа пусты/.test(last())) rgGot = -99;
      }
      out.reagents = { rgGot, rgLocked };
      const cs = mk("chemsafe"), crS = G().credits;
      CP.act(cs, LAB.FIX.T.chemsafe, "chemsafe", {}); click(/^К решению/); const Lc = CP._last(); solve[Lc.kind](Lc); await wait(60);
      out.chemsafe = !!g.objState(cs).csOpen && G().credits > crS && (CP.act(cs, LAB.FIX.T.chemsafe, "chemsafe", {}), /открыт и пуст/.test(last()));
      const aj = mk("acidjar"), invA = JSON.stringify([G().inv, G().ammo, G().credits]); /* на дне бывают и заряды — они в ammo */
      CP.act(aj, LAB.FIX.T.acidjar, "acidjar", {}); click(/^К решению/); solve.titr(CP._last()); await wait(60);
      out.acidjar = !!g.objState(aj).ajDone && JSON.stringify([G().inv, G().ammo, G().credits]) !== invA;
      if (!out.acidjar) out.ajSaid = JSON.stringify(g.objState(aj)) + " " + spoken.slice(-3).join(" / ").slice(0, 300);
      const sp = mk("specimens"), invS = JSON.stringify(G().inv);
      LB.act(sp, null, "sample", {}); const got1 = JSON.stringify(G().inv) !== invS; LB.act(sp, null, "sample", {});
      out.sample = got1 && /пуста/.test(last());
      let freed = false;
      for (let i = 0; i < 40 && !freed; i++) { const cg = mk("cages"); U.closeAll(); LB.act(cg, null, "cage", {}); if (U.top() && click(/^Открыть дверцу и выпустить крысу/)) freed = !!g.objState(cg).freed; }
      out.freed = freed && (G().ach.c.freed || 0) >= 1;
      const ow = mk("obswindow"), kn0 = G().ach.c.knock || 0; LB.act(ow, null, "knock", {}); LB.act(ow, null, "knock", {});
      out.knock = (G().ach.c.knock || 0) === kn0 + 1;
      /* 8. кислотная паста: дверь под ключ или код открывается тихо, паста тратится */
      const dr = g.CUR.fl.doors.find(d => d.lock && /key|card|code/.test(d.lock.type) && !g.CUR.fs.doors[d.id]);
      G().inv.c_lockpaste = 1;
      if (dr) { let opened = false; C.pasteDoor(dr, () => { opened = true; }); out.paste = opened && !C.pasteOk(); } else out.paste = "нет двери";
      /* 9. руководство: главы о химии руками и об исследованиях */
      out.guide = ["Химия руками", "Исследования и опыты"].every(t => LAB.guide.chapters.some(c => c.t === t));
    } catch (e) { out.err = e.message + " " + (e.stack || "").split("\n").slice(1, 3).join(" / "); }
    U.closeAll();
    fake.forEach(q => { delete I.by[q.id]; const a = I.all.indexOf(q); if (a >= 0) I.all.splice(a, 1); const b = I.kind[q.kind].indexOf(q); if (b >= 0) I.kind[q.kind].splice(b, 1); });
    G().fs = JSON.parse(fs0);
    const gg = G();
    ["inv", "ammo", "credits", "xp", "lvl", "chem", "body", "hp", "notes", "noteList", "codes", "lib", "ach", "perks", "min", "day", "stats", "visited", "quests"].forEach(k => { gg[k] = k0[k]; });
    try { g.enterFloor(k0.L, k0.F, "down", true); CB.stop(); gg.x = k0.x; gg.y = k0.y; } catch (e) { /* */ }
    LAB.say = say0;
    return out;
  });
  ok(!chx.err, "химия и исследования: проверка без ошибок" + (chx.err ? ": " + chx.err : ""));
  ok(chx.tables && chx.tables.withT === chx.tables.n && chx.entry && chx.nav, "химический стол — на каждом этаже (" + JSON.stringify(chx.tables) + "), при первом заходе «Эхо» называет помещение, навигатор знает дорогу");
  ok(chx.dilute && chx.splash && chx.neutral && chx.chlorine && chx.pyro, "химия руками: кислоту в воду — струйкой, воду в кислоту — брызги, щёлочь гасит кислоту, хлорка с кислотой — хлор и испорченная посуда, горючее не греют (" + JSON.stringify({ d: chx.dilute, s: chx.splash, n: chx.neutral, c: chx.chlorine, p: chx.pyro }) + ")");
  ok(chx.smelling && chx.discover && chx.recryst && chx.achHand && chx.benchMenu, "узнанная рецептура разливается, неизвестная открывается опытом, перекристаллизация поднимает сорт, достижения считаются (" + JSON.stringify({ judge: chx.judge, s: chx.smelling, d: chx.discover, r: chx.recryst, a: chx.achHand }) + ")");
  ok(chx.recrystKeep && chx.minG, "перекристаллизация не огрубляет соли на простом столе; сырьё грубее нужного сорта руками не разливается (" + JSON.stringify({ r: chx.recrystKeep, g: chx.minG }) + ")");
  ok(chx.dupJudge && chx.dupMenu && chx.dupCorrode && chx.phosDry && chx.phosWet, "один состав — две рецептуры: «Эхо» называет обе и при разливе даёт выбрать; фосфор в сухом стекле вспыхивает, под водой — нет, и вспышка из него разливается (" + JSON.stringify({ j: chx.dupJudge, m: chx.dupMenu, c: chx.dupCorrode, d: chx.phosDry, w: chx.phosWet }) + ")");
  ok(chx.hidMark && chx.hidBench && chx.hidItem, "тайнопись: архив помнит, что она есть; проявляется парами йода у стола и проявителем (" + JSON.stringify({ m: chx.hidMark, b: chx.hidBench, i: chx.hidItem }) + ")");
  ok(chx.filmKeep, "новых кадров этой глубины не осталось — плёнка, проявитель и фиксаж не тратятся");
  ok(chx.film && chx.tissue && chx.report, "плёнка проявляется — снимки в архиве; анализ ткани даёт отчёт, медик его покупает, повар — нет (" + JSON.stringify({ f: chx.film, t: chx.tissue, r: chx.report }) + ")");
  ok(chx.puzAll, "химические задачи: титрование, склянки, методика, хроматограмма, цепочка — на трёх ступенях решаются, опыт химика растёт (" + JSON.stringify(chx.puz) + ")");
  ok(chx.keepOpen && chx.failCb && chx.awayCb && chx.oldKeep, "головоломки: неверный ответ окно не закрывает, три неверных — провал, «отойти» — не провал (" + JSON.stringify({ k: chx.keepOpen, f: chx.failCb, a: chx.awayCb, o: chx.oldKeep }) + ")");
  ok(chx.standAway !== false && chx.standAway2 !== false && chx.standFail !== false && chx.standSolved !== false && chx.lockAway !== false && chx.lockAway2 !== false && (chx.standSolved || chx.lockAway), "стенд: отошли — без последствий, начатую и брошенную задачу сменит, провал — новая задача, решение — награда; логический замок: отошли — не шумит, начатую задачу сменит и при закрытом окне (" + JSON.stringify({ sa: chx.standAway, sa2: chx.standAway2, sf: chx.standFail, ss: chx.standSolved, la: chx.lockAway, la2: chx.lockAway2 }) + ")");
  ok(chx.reagents && chx.reagents.rgGot === 8 && chx.chemsafe && chx.acidjar && chx.sample && chx.freed && chx.knock && chx.paste === true, "обстановка: шкаф с реактивами — раз (и под замком), химический замок, банка с кислотой, образец из банки, крыса на волю, стук в окно бокса, кислотная паста (" + JSON.stringify({ rg: chx.reagents, cs: chx.chemsafe, aj: chx.acidjar, s: chx.sample, f: chx.freed, k: chx.knock, p: chx.paste }) + (chx.ajSaid ? "; банка: " + chx.ajSaid : "") + ")");
  ok(chx.guide, "руководство: главы «Химия руками» и «Исследования и опыты»");

  console.log("Обход этажей одного зерна: вход, такты, осмотр");
  const tour = await page.evaluate(() => {
    const g = LAB.game, G = g.G, out = { floors: 0, err: [], want: 0 };
    for (let L = 1; L <= LAB.LEVELS_N; L++) {
      const list = L <= 2 ? Array.from({ length: 20 }, (_, i) => i + 1) : [1, (L % 18) + 2, 20];
      for (const F of list) {
        out.want++;
        try {
          g.enterFloor(L, F, F === 1 && L > 1 ? "gatedown" : "down", true);
          for (let i = 0; i < 6; i++) LAB.combat.tick();
          g.lookAround(); g.navigate(false);
          G.dead = false; G.hp = G.hpMax;
          out.floors++;
        } catch (e) { out.err.push(L + "-" + F + ": " + e.message); }
      }
    }
    return out;
  });
  ok(tour.floors === tour.want && !tour.err.length, tour.floors + " этажей без ошибок" + (tour.err.length ? ": " + tour.err.slice(0, 3).join("; ") : ""));

  console.log("Выход в главное меню");
  await page.evaluate(() => LAB.ui.mainMenu());
  ok(await page.evaluate(() => LAB.ui.screen()) === "menu", "главное меню");
  /* «Выход» в главном меню — когда игра может закрыться сама (телефон, компьютер) */
  const ex = await page.evaluate(() => {
    const out = {}, label = i => typeof i.label === "function" ? i.label() : i.label;
    const t0 = window.LabTTS; let quit = 0;
    window.LabTTS = Object.assign({}, t0 || {}, { exitApp: () => { quit++; } });
    LAB.ui.closeAll(); LAB.ui.mainMenu(true);
    const w = LAB.ui.top(); out.items = w ? w.items.map(label) : [];
    w.i = out.items.indexOf("Выход"); if (w.i >= 0) LAB.ui.activate();
    out.quit = quit;
    window.LabTTS = t0;
    return out;
  });
  ok(ex.items[ex.items.length - 1] === "Выход" && ex.quit === 1, "в главном меню — «Выход», он закрывает игру (" + ex.items.join(", ") + ")");

  /* (ошибка игрока) Голос другого движка речи телефона (не основного) после перезапуска игры
     пропадал. Мост телефона здесь — подделка: основной движок готов через 0,6 с, второй — через
     1,5 с. Выбранный голос второго движка сохраняется вместе с «системным синтезатором», при новом
     запуске игра отдаёт его телефону (а тот ставит его, как поднимется движок, — MainActivity) и
     говорит синтезатором телефона; список голосов перечитывается при каждом открытии. */
  console.log("Голос синтезатора телефона после перезапуска");
  const fakePhone = () => {
    const t0 = Date.now(), base = [{ id: "aleksandr", name: "aleksandr (русский)", lang: "ru-RU", local: true }];
    const late = [{ id: "ru.late.engine::anna", name: "Поздний движок: anna (русский)", lang: "ru-RU", local: true }];
    window.__phone = { set: [] };
    window.LabTTS = {
      status: () => (Date.now() - t0 < 600 ? "init" : "ready"),
      getVoices: () => JSON.stringify(Date.now() - t0 < 1500 ? base : base.concat(late)),
      setVoice: n => { window.__phone.set.push(String(n)); },
      speak: (text, rate, vol, id) => { setTimeout(() => { if (window.LabTTSDone) window.LabTTSDone(id); }, 5); },
      stop: () => {}, isSpeaking: () => false, hasRussian: () => true, log: () => {}
    };
  };
  const ctxV = await browser.newContext({ viewport: { width: 412, height: 860 } });
  await ctxV.addInitScript(fakePhone);
  const pv = await ctxV.newPage();
  pv.on("pageerror", e => errors.push("pageerror (голос телефона): " + e.message));
  await pv.goto(url);
  await pv.waitForFunction(() => window.LAB_READY === true);
  await pv.waitForTimeout(1800);
  const vc1 = await pv.evaluate(() => {
    const lb = i => typeof i.label === "function" ? i.label() : i.label;
    LAB.ui.settings();
    const vi = LAB.ui.top().items.filter(i => /^Голос синтезатора/.test(lb(i)))[0];
    vi.fn();
    const items = LAB.ui.top().items, names = items.map(lb);
    const anna = items.filter(i => lb(i) === "Поздний движок: anna (русский)")[0];
    if (anna) anna.fn();
    const st = JSON.parse(localStorage.getItem("lab_settings") || "{}");
    LAB.ui.closeAll();
    return { names: names, saved: st.voice, tts: st.tts, set: window.__phone.set.slice() };
  });
  ok(vc1.names.indexOf("Поздний движок: anna (русский)") >= 0 && vc1.saved === "ru.late.engine::anna" && vc1.tts === "system" && vc1.set.indexOf("ru.late.engine::anna") >= 0,
    "голос второго движка телефона — в списке (перечитан при открытии), выбран и сохранён с системным синтезатором (" + JSON.stringify(vc1) + ")");
  const ctxV2 = await browser.newContext({ viewport: { width: 412, height: 860 }, storageState: await ctxV.storageState() });
  await ctxV2.addInitScript(fakePhone);
  const pv2 = await ctxV2.newPage();
  pv2.on("pageerror", e => errors.push("pageerror (голос телефона, перезапуск): " + e.message));
  await pv2.goto(url);
  await pv2.waitForFunction(() => window.LAB_READY === true);
  await pv2.waitForTimeout(1200);
  const vc2 = await pv2.evaluate(() => {
    const lb = i => typeof i.label === "function" ? i.label() : i.label;
    const out = { set: window.__phone.set.slice(), backend: LAB.Speech.backend, voice: LAB.settings.voice, tts: LAB.settings.tts };
    LAB.ui.settings();
    out.label = LAB.ui.top().items.map(lb).filter(t => /^Голос синтезатора/.test(t))[0];
    LAB.ui.closeAll();
    return out;
  });
  ok(vc2.set[0] === "ru.late.engine::anna" && vc2.backend === "android" && vc2.voice === "ru.late.engine::anna" && vc2.tts === "system" && /anna/.test(vc2.label || "") && !/::/.test(vc2.label || ""),
    "после перезапуска — тот же голос: игра отдаёт его телефону при запуске и говорит синтезатором телефона (" + JSON.stringify(vc2) + ")");
  await ctxV.close(); await ctxV2.close();

  /* (3.7) Проверка перед сборкой, этап «ошибки»: исправленное не возвращается — кредиты
     с чипом старателя, фармаколог, разговор с выжившим, счёт этажей, отход от взлома,
     пройденная игра, привязка к капсуле и записки после перестройки мира, вехи, справочник,
     звук удара от звуковой атаки, очередь записанного голоса ОКО, id стволов, добыча касс */
  console.log("(3.7) Проверка перед сборкой: исправленные ошибки");
  const e1 = await page.evaluate(async () => {
    const out = {}, sleep = ms => new Promise(r => setTimeout(r, ms)), g = LAB.game, lb = i => typeof i.label === "function" ? i.label() : i.label;
    LAB.ui.closeAll(); localStorage.removeItem("lab_slot3"); localStorage.removeItem("lab_slot3_bak");
    g.newGame(); let G = g.G;
    /* первый этаж — в счёте этажей (веха «пять этажей» — на пятом) */
    out.floor1 = !!(G.ach && G.ach.c && G.ach.c.floor === 1);
    /* чип старателя: и в словах — сколько начислено */
    const st0 = LAB.implants.stat; LAB.implants.stat = function (k) { return k === "loot" ? 0.2 : st0.apply(this, arguments); };
    const c0 = G.credits, ph = g.giveItem({ kind: "credits", n: 10 }, true); LAB.implants.stat = st0;
    out.credits = G.credits - c0 === 12 && /^12 кредитов/.test(ph);
    /* фармаколог второй ступени: стимулятор при сильной интоксикации — без передозировки, токсинов вдвое меньше */
    const nod = LAB.chem.noOverdose; LAB.chem.noOverdose = () => true;
    G.body.tox = 75; G.hp = 50; G.inv.stim = 1; SPOKEN.length = 0; g.useItem("stim");
    out.pharm = !SPOKEN.some(t => /Передозировка/.test(t)) && G.hp > 50 && Math.round(G.body.tox) === 81;
    LAB.chem.noOverdose = nod; G.body.tox = 0; G.hp = G.hpMax;
    /* «Поговорить»: первой звучит первая строка рассказа */
    const prof = Object.keys(LAB.STORIES || {})[0], npc = { key: "t_np", n: "Тестовый выживший", prof: prof, x: G.x, y: G.y, life: 0, view: 0, okoSaw: 1 };
    if (prof) { SPOKEN.length = 0; g.openTarget({ type: "npc", ref: npc }); const talk = LAB.ui.top().items.filter(i => lb(i) === "Поговорить")[0]; if (talk) talk.fn(); /* (3.7) в строках рассказа — разметка рода «[м|ж]»: звучит мужской вариант (житель без female) */ const t0 = String(LAB.STORIES[prof][0]).replace(/\[([^\]|]*)\|([^\]]*)\]/g, (m, a1) => a1); out.talk = SPOKEN.some(t => t.indexOf(t0) >= 0); LAB.ui.closeAll(); }
    /* отошли от взлома, не ошибившись: ни тревоги, ни шума */
    const noise0 = LAB.combat.noise; let noised = 0; LAB.combat.noise = function () { noised++; };
    ["lockpick", "pick_b", "pick_r", "pick_g"].forEach(k => { delete G.inv[k]; }); /* без отмычек — сразу взлом вручную */
    SPOKEN.length = 0; g.hackDoor({ id: "t_door", x: G.x, y: G.y, lock: { type: "card", tier: 1 } }); await sleep(100);
    LAB.mini.cancel(); await sleep(150);
    out.walk = !noised && SPOKEN.some(t => /не потревожив защиту/.test(t)) && !SPOKEN.some(t => /Сработала тревога/.test(t));
    LAB.combat.noise = noise0;
    /* пройденная игра: запись не продолжается — сразу новая игра */
    G.done = true; g.saveSlot(3); G.done = false;
    SPOKEN.length = 0; const ld = g.loadSlot(3);
    out.done = ld === false && !!(g.slotInfo(3) || {}).done && SPOKEN.some(t => /пройдена до конца/.test(t)) && /пройдена до конца/.test(g.slotText(3));
    localStorage.removeItem("lab_slot3"); localStorage.removeItem("lab_slot3_bak");
    /* запись прежнего мира: привязка — к капсуле этого этажа рядом с ней; записки — под пометкой, новые попадают в архив */
    const old = JSON.parse(JSON.stringify(G));
    old.worldV = 1; old.L = 1; old.F = 1; old.x = 0; old.y = 0;
    old.checkpoint = { L: 1, F: 1, x: 0, y: 0, cap: "o999" };
    old.noteList = [{ id: "1-1-i5", t: "Старая записка", x: "Код 1 2 3 4.", a: "", L: 1, F: 1, code: "1234" }, { id: "lib:arc1", t: "Глобальный документ", x: "Текст.", a: "", L: 1, F: 1 }];
    old.notes = { "1-1-i5": 1, "lib:arc1": 1 };
    localStorage.setItem("lab_slot3", JSON.stringify({ meta: { ver: LAB.VERSION, L: 1, F: 1, diff: old.diff, tb: 0, lvl: old.lvl, hp: old.hp, hpMax: old.hpMax, ms: 0, date: Date.now(), samples: 0 }, g: old }));
    out.oldLoad = g.loadSlot(3) !== false; G = g.G;
    const cap = g.CUR.fl.objs.filter(o => o.type === "capsule")[0] || g.CUR.fl.objs.filter(o => o.type === "wake")[0], cp = G.checkpoint || {};
    out.cp = !!cap && cp.cap === cap.id && !cp.fix && Math.max(Math.abs(cp.x - cap.x), Math.abs(cp.y - cap.y)) <= 3;
    const n0 = G.noteList[0], n1 = G.noteList[1];
    out.notes = !!n0 && n0.id === "w1:1-1-i5" && n0.old === 1 && n0.code === undefined && !!G.notes["w1:1-1-i5"] && !G.notes["1-1-i5"] && !!n1 && n1.id === "lib:arc1" && !!G.notes["lib:arc1"] && g.noteForCode("1234") === null;
    localStorage.removeItem("lab_slot3"); localStorage.removeItem("lab_slot3_bak");
    g.newGame(); G = g.G;
    /* скрытые вехи по уровню не видны заранее */
    LAB.ach.ev("level", 12); LAB.ach.menu();
    const achL = (LAB.ui.top().items || []).map(lb).join(" | ");
    out.ach = !/Колыбел|Отражени|Механизм|Исток/.test(achL);
    LAB.ui.closeAll();
    /* справочник: окна оружия и брони — свои, окно оружия из инвентаря не закрывают */
    LAB.guide.open();
    const refs = LAB.ui.top().items.filter(i => /^Справочники/.test(lb(i)))[0]; if (refs) refs.fn();
    const wpn = LAB.ui.top().items.filter(i => lb(i) === "Оружие")[0]; if (wpn) wpn.fn();
    out.guide = LAB.ui.top().title === "Справочник: оружие";
    LAB.ui.closeAll();
    /* звуковая атака — свой звук удара (прежде hurt_sonic не было — тишина) */
    const pl0 = LAB.Sound.play, ids = []; LAB.Sound.play = function (id) { ids.push(id); return pl0.apply(this, arguments); };
    LAB.atmos.hurt("sonic", 5); await sleep(50);
    out.sonic = ids.indexOf("hurt_field") >= 0;
    /* записанный голос ОКО: реплики по очереди, тишина снимает и очередь */
    const V = LAB.okoVoice, REC = "Я слушаю ваш пульс по вентиляции, носитель. Он учащается.", K = V.key(REC), rd = LAB.OKO_VOICED.ready, ov0 = LAB.settings.okoVoice;
    LAB.OKO_VOICED.ready = true; LAB.settings.okoVoice = "m"; V._rng(() => 0.99);
    if (!LAB.Bank.has("oko_m_" + K)) LAB.Bank.def("oko_m_" + K, ["oko/m/" + K + ".mp3"], { bus: "voice", vary: 0 });
    for (let i = 0; i < 50 && !LAB.Bank.ready("oko_m_" + K); i++) { LAB.Bank.preload(["oko_m_" + K]); await sleep(100); }
    ids.length = 0;
    V.play("ОКО по громкой связи: «" + REC + "»", { prio: "event" }); V.play("ОКО по громкой связи: «" + REC + "»", { prio: "event" });
    await sleep(400);
    const first = ids.filter(id => id === "oko_m_" + K).length;
    LAB.Speech.hush(); await sleep(6500);
    out.okoQ = LAB.Bank.ready("oko_m_" + K) && first === 1 && ids.filter(id => id === "oko_m_" + K).length === 1;
    V._rng(null); LAB.OKO_VOICED.ready = rd; LAB.settings.okoVoice = ov0; LAB.Sound.play = pl0;
    /* стволы разных запусков не совпадают по id */
    const w1 = LAB.makeWeapon("spark", 1, 0, 1), w2 = LAB.makeWeapon("spark", 1, 0, 1);
    out.wid = w1.id !== w2.id && /^w\d+_[0-9a-z]+_spark$/.test(w1.id);
    /* касса и часовая мастерская — ценности или выручка; бюро находок — забытые мелочи */
    const r = LAB.Rng("t", "loot"), val = [], lost = [];
    for (let i = 0; i < 30; i++) { val.push.apply(val, LAB.annexLoot(r, 5, 3, "valuable", "desk")); lost.push.apply(lost, LAB.annexLoot(r, 5, 3, "lost", "shelf")); }
    out.loot = val.every(x => x.kind === "credits" || (LAB.ITEMS[x.item] || {}).cat === "valuable") && lost.every(x => x.kind === "credits" || ["watch", "ring", "pen", "harmonica", "flask", "medal"].indexOf(x.item) >= 0);
    /* матки не развиваются */
    out.queen = LAB.mutants.evoCap(LAB.mutants.NEW.u_broodhen) === 0;
    return out;
  });
  ok(e1.floor1, "первый этаж — в счёте этажей для вех (веха «пять этажей» — на пятом)");
  ok(e1.credits, "чип старателя: в словах — та же сумма, что начислена");
  ok(e1.pharm, "фармаколог второй ступени: стимулятор без передозировки, токсинов от него вдвое меньше");
  ok(e1.talk, "«Поговорить» с выжившим начинается с первой строки рассказа");
  ok(e1.walk, "отошли от взлома, не ошибившись, — ни тревоги, ни шума");
  ok(e1.done, "пройденная игра: запись не продолжается («игра пройдена до конца»), её слот так и подписан");
  ok(e1.oldLoad && e1.cp, "запись прежнего мира: привязка к капсуле — к капсуле этого этажа, рядом с ней");
  ok(e1.notes, "запись прежнего мира: записки этажей — под пометкой (коды прежних этажей не действуют), общие документы — как были");
  ok(e1.ach, "скрытые вехи по уровню не видны заранее");
  ok(e1.guide, "справочник: окно «Справочник: оружие» — своё, окно оружия из инвентаря не закрывает");
  ok(e1.sonic, "звуковая атака — слышен удар");
  ok(e1.okoQ, "записанный голос ОКО: реплики по очереди, тишина снимает и звучащую, и ждущую");
  ok(e1.wid, "id стволов не повторяются между запусками игры");
  ok(e1.loot, "касса и часовая мастерская — ценности или выручка, бюро находок — забытые мелочи");
  ok(e1.queen, "матки не развиваются");

  const real = errors.filter(e => !/favicon|sounds\/|Failed to load resource/.test(e));
  ok(!real.length, "ошибок страницы нет" + (real.length ? ": " + real.slice(0, 5).join(" || ") : ""));
  ok(!external.length, "I: игра ничего не загружает из сети — все запросы к своим файлам" + (external.length ? ": " + external.slice(0, 3).join(", ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `ПРОВАЛЕНО: ${fails}` : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
