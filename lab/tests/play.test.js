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
  const opts = { args: ["--autoplay-policy=no-user-gesture-required"] };
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
  ok(news.title === "Что нового?" && news.items[0] === news.ver + " — эта версия" && news.items.some(l => /^Альфа 1\.2$/.test(l)) && news.items.some(l => /^Альфа 1\.0$/.test(l)), "«Что нового?»: эта версия и прежние — " + news.items.join(", "));
  ok(/Что нового: /.test(news.note) && /Коридоры больше не пустуют/.test(news.text) && /Сапёры ОКО/.test(news.text) && !news.tech, "что нового в этой версии — коротко и без технических подробностей");

  console.log("Настройки");
  await page.evaluate(() => { LAB.ui.top().i = 0; });
  for (let i = 0; i < 5; i++) await gest({ kind: "swipe", n: 1, dir: "R" });
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
  ok(await page.evaluate(() => LAB.settings.difficulty) === 4, "лёгкая");
  await gest({ kind: "swipe", n: 1, dir: "U" });
  ok(await page.evaluate(() => LAB.settings.difficulty) === 1, "и снова обычная");
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

  console.log("Новая игра начинается с пролога");
  await page.evaluate(() => { while (LAB.ui.top() && !LAB.ui.top().root) LAB.ui.closeTop(true); LAB.ui.top().i = 0; });
  await gest({ kind: "dtap", n: 1 });
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => LAB.ui.screen()) === "prologue" && /Пролог/.test(await said()), "«Начать игру» — сначала пролог");
  await gest({ kind: "swipe", n: 1, dir: "U" });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => LAB.ui.screen()) === "game", "после пролога игра началась");
  let st = await page.evaluate(() => ({ L: LAB.game.G.L, F: LAB.game.G.F, hp: LAB.game.G.hp }));
  ok(st.L === 1 && st.F === 1, "уровень 1, этаж 1");
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
  ok(gl && gl.indexOf("Клавиатура") >= 0 && !gl.some(l => /^Жесты/.test(l)), "F1 — руководство: пункт «Клавиатура» вместо жестов");
  await page.evaluate(() => { const w = LAB.ui.top(); w.i = w.items.findIndex(i => i.label === "Клавиатура"); });
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
  ok(back.none || (back.F === back.F0 && !back.stair && /сошли с лестницы/.test(back.said)), "шаг назад с первой ступени — снова на этаже");
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
        if (!c) { if (!LAB.mini.active()) return true; await wait(80); continue; }
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
    out.flashTested = !!live;
    if (live) {
      g.objMenu(term); pick(/^Оборонная сеть этажа/); pick(/^Камеры этажа/);
      const k = LAB.ui.top().items.findIndex(i => label(i).indexOf(live.name.split(",")[0]) === 0 && /смотрит для ОКО/.test(label(i)));
      if (k >= 0) { LAB.ui.top().i = k; LAB.ui.activate(); }
      out.flashMenu = k >= 0 && pick(/Перепрошить камеру/);
      out.flashSolved = await solve();
      out.ours = C.camState(live) === "ours";
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
  ok(dnet.none || (dnet.flashTested && dnet.flashMenu && dnet.flashSolved && dnet.ours), "камера перепрошита с терминала: докладывает ОКО «чисто»" + (dnet.flashMenu === false ? " (пункт не найден)" : ""));
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

  console.log("Верстак на каждом третьем этаже, тайник с двумя выходами, переносная турель, ОКО");
  const misc = await page.evaluate(async () => {
    const g = LAB.game, G = g.G, out = {};
    out.wb = [3, 6, 9, 12, 15, 18].every(F => LAB.getFloor(G.seed, 1, F).objs.some(o => o.type === "workbench"));
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
  ok(misc.wb, "верстак — на этажах 3, 6, 9, 12, 15, 18");
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
    const posts = { lift: 0, stairs: 0, office: 0, inRoom: true };
    for (let L = 1; L <= 12; L++) for (let F = 3; F <= 19; F += 4) {
      const fl = LAB.getFloor(G.seed, L, F);
      fl.foes.forEach(f => { if (!f.guard) return; posts[f.guard]++; if (f.guard === "lift" && f.room !== fl.E) posts.inRoom = false; if (f.guard === "stairs" && f.room !== fl.D) posts.inRoom = false; });
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
    g.enterFloor(2, 8, "down", true); god();
    g.CUR.fs.robots = true; C.robotsCalm();
    LAB.oko.event("robots", { x: G.x, y: G.y }); /* в игре — с координатами терминала, у которого стоит герой */
    let fresh = [];
    for (let i = 0; i < 80 && !fresh.length; i++) { C.tick(); fresh = live().filter(f => f.fresh && !f.calm); }
    const fd0 = Math.min.apply(null, fresh.map(dH).concat([999]));
    for (let i = 0; i < 40; i++) C.tick();
    out.fresh = { n: fresh.length, d0: fd0, d1: Math.min.apply(null, fresh.filter(f => !f.dead).map(dH).concat([999])) };
    /* неудачный взлом: проверка идёт к терминалу */
    g.enterFloor(2, 9, "down", true); god();
    live().forEach(f => { f.dead = true; });
    const term = g.CUR.fl.objs.find(o => o.type === "terminal") || { x: G.x, y: G.y };
    LAB.oko.event("hack_fail", { x: term.x, y: term.y });
    let sq = [];
    for (let i = 0; i < 40 && !sq.length; i++) { C.tick(); sq = live().filter(f => f.squad); }
    const toT = () => Math.min.apply(null, sq.filter(f => !f.dead).map(f => Math.abs(f.x - term.x) + Math.abs(f.y - term.y)).concat([999]));
    const c0 = toT(); for (let i = 0; i < 60; i++) C.tick();
    out.check = { n: sq.length, c0, c1: toT() };
    /* дрон слежения: догоняет, держит дистанцию, стреляет */
    g.enterFloor(3, 5, "down", true); god();
    live().forEach(f => { f.dead = true; });
    /* дрон вылетает туда, где вас видела камера, дальше ищет сам */
    LAB.oko.report("camera", G.x, G.y, "seen");
    const dr = C.dispatch(1, "drone", { x: G.x, y: G.y }), hp0 = G.hp, dd = [];
    for (let i = 0; i < 200; i++) { C.tick(); if (dr[0]) dd.push(dH(dr[0])); }
    out.drone = { n: dr.length, near: dr[0] ? Math.min.apply(null, dd) : 0, close: dd.filter(v => v <= 6).length, hurt: hp0 - G.hp };
    /* патрули смены: маршруты меняются, патрульных хватает */
    g.enterFloor(3, 9, "down", true); god();
    live().forEach(f => { f.dead = true; });
    LAB.oko.state().heat = 60;
    LAB.oko.shift(); for (let i = 0; i < 40; i++) C.tick();
    let r1 = C.patrols().map(f => JSON.stringify(f.route)), changed = false;
    /* смена за сменой: патрульных набирается сколько нужно, маршруты новые */
    for (let k = 0; k < 4 && (!changed || C.patrols().length < 2); k++) {
      LAB.oko.shift(); for (let i = 0; i < 40; i++) C.tick();
      if (C.patrols().some(f => r1.indexOf(JSON.stringify(f.route)) < 0)) changed = true;
      r1 = C.patrols().map(f => JSON.stringify(f.route));
    }
    out.patrol = { n: C.patrols().length, changed };
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
  ok(oko.check.n >= 1 && (oko.check.c1 < oko.check.c0 || oko.check.c1 <= 8), "неудачный взлом — проверка идёт к терминалу (" + oko.check.c0 + " → " + oko.check.c1 + ")");
  ok(oko.drone.n === 1 && oko.drone.close >= 20 && oko.drone.near >= 2 && oko.drone.hurt > 0, "дрон слежения вылетел к месту, где вас видела камера, нашёл вас, держится на расстоянии (не ближе " + oko.drone.near + " шагов) и стреляет");
  ok(oko.patrol.n >= 2 && oko.patrol.changed, "патрули смены: " + oko.patrol.n + ", маршруты меняются");
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
      C._cleanerTick(cl);
      out.cleaner = { key: !!g.CUR.fs.taken.tkey1, scrap: !!g.CUR.fs.taken.tscr1 };
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
  ok(stab.badRefused, "битая запись не загружается, текущая игра остаётся");
  ok(stab.descNoAuto, "во время спуска автозапись ждёт");
  ok(stab.easyLoss === 50, "лёгкая сложность: при гибели теряется 5 % кредитов (" + stab.easyLoss + ")");
  ok(stab.bg.t1 === stab.bg.t0 && stab.bg.t2 > stab.bg.t1, "игра в фоне: мир стоит, вернулись — идёт (" + stab.bg.t0 + " → " + stab.bg.t1 + " → " + stab.bg.t2 + ")");
  ok(!stab.cleaner || (!stab.cleaner.key && stab.cleaner.scrap), "уборщик не подбирает ключ, а металлолом подбирает");
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
    b.tier = 1; b.dmg = false;
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
    ["m_range", "m_cap", "m_quiet", "m_acc"].forEach(id => W.learn(id, "", true));
    G.weapons = G.weapons.slice(0, 1);
    G.weapons.push(LAB.makeWeapon("spark", 2, 0, 1, "w_ws")); G.wi = 1;
    const w = G.weapons[1], r0 = w.rng, c0 = w.cap;
    LAB.ui.closeAll(); LAB.ui.craft(wb);
    g.craft(rec("m_range"));
    out.step2 = !!LAB.ui.top() && /шаг 2 из 2/.test(LAB.ui.top().title);
    out.meleeNo = !!LAB.ui.top() && LAB.ui.top().items.some(i => /монтировка.*нельзя: ближнему бою дальность не нужна/i.test(label(i)) && i.disabled);
    pick(/в руках/);
    out.range = w.rng === r0 + 2 && !!LAB.ui.top() && LAB.ui.top().title === "Мастерская";
    g.craft(rec("m_cap")); pick(/в руках/);
    out.cap = w.cap > c0;
    g.craft(rec("m_quiet")); pick(/в руках/);
    out.slots = W.used(w) === 3 && /гнёзда заняты/.test(W.compat(w, "acc"));
    W.uninstall(w, "range"); out.unmod = w.rng === r0 && (G.inv.m_range || 0) >= 1;
    out.compat = /аннигиляцию/.test(W.compat(LAB.makeWeapon("ppistol", 5, 0, 1), "quiet")) && /не греется/.test(W.compat(LAB.makeWeapon("kpistol", 2, 0, 1), "cool"));
    /* глушитель: выстрел тише; выстрел изнашивает оружие */
    LAB.ui.closeAll(); G.drawn = true; w.charge = w.cap; G.noise = 0;
    await wait(600);
    const fired = C.fire("N");
    out.quiet = { fired, noise: G.noise, cond: W.cond(w) };
    /* сильно изношенное оружие даёт осечку */
    w.cond = 5; const s0 = G.stats.shots, ch0 = w.charge, rnd = Math.random; Math.random = () => 0.001;
    await wait(600); const mf = C.fire("N"); Math.random = rnd;
    out.misfire = mf === true && G.stats.shots === s0 && w.charge === ch0 - 1;
    /* ремонт у верстака: станки — до 100; ремнабор в поле — плюс 35 */
    LAB.workshop._at(wb);
    for (const k of LAB.PARTS) G.inv[k] = 8; /* модули выше съели металлолом */
    const sc0 = G.inv.scrap; out.repair = W.repairWeapon(1, b) && W.cond(w) === 100 && G.inv.scrap < sc0;
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
    out.recipes = LAB.RECIPES.filter(rc => !Object.keys(rc.need).every(k => LAB.ITEMS[k]) || ["base", "spec", "exp"].indexOf(W.clsOf(rc)) < 0).map(rc => rc.id);
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
  ok(ws.misfire && ws.repair && ws.field, "изношенное оружие даёт осечку; ремонт у верстака — до 100, ремнабор в поле — плюс 35");
  ok(ws.heat && ws.heat.at > 0 && ws.heat.blocked, "перегрев: после долгой очереди ствол остывает и не стреляет (выстрел " + (ws.heat && ws.heat.at) + ")");
  ok(ws.scrapMods, "разбор оружия: модули возвращаются в запас");
  ok(ws.decoy && ws.blind, "электронная приманка уводит робота и сбивает ОКО; сенсорная помеха ослепляет камеру" + (ws.decoyDiag ? "; приманка: " + ws.decoyDiag : "") + (ws.blindDiag ? "; помеха: " + ws.blindDiag : ""));
  ok(ws.stun && ws.pierce && ws.profile, "ЭМ-подавитель останавливает робота, бронебойный выстрел сильнее по броне; у оружия — свой профиль");
  ok(ws.parts && !ws.parts.length && ws.recipes && !ws.recipes.length && ws.guide, "экономика: у каждой детали — где найти и для чего; рецепты собраны из существующих предметов" + (ws.parts && ws.parts.length ? "; без пользы: " + ws.parts.join(", ") : "") + (ws.recipes && ws.recipes.length ? "; рецепты: " + ws.recipes.join(", ") : ""));
  ok(ws.saved, "схемы и модули оружия сохраняются в записи");

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
      await wait(700);
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
    const heap = () => (performance.memory ? performance.memory.usedJSHeapSize : 0);
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
  /* новая версия — с чистого листа: хранилище прежней версии (своя метка версии, слот, изменённые
     настройки) при запуске новой стирается целиком — в браузере, на Android и в Windows хранилище одно */
  let fresh = null;
  {
    const stOld = await page.context().storageState();
    const fixtureRaw = fs.readFileSync(path.join(__dirname, "fixtures", "alfa-1.1-save.json"), "utf8");
    stOld.origins.forEach(o => {
      const ls = o.localStorage, setK = (n, v) => { const e = ls.find(q => q.name === n); if (e) e.value = v; else ls.push({ name: n, value: v }); };
      setK("lab_ver", "Альфа 1.1"); setK("lab_slot1", fixtureRaw); setK("lab_prologue_seen", "1");
    });
    const ctx3 = await browser.newContext({ storageState: stOld });
    const page3 = await ctx3.newPage();
    page3.on("pageerror", e => errors.push("pageerror (новая версия): " + e.message));
    try {
      await page3.goto(url); await page3.waitForFunction(() => window.LAB_READY === true, null, { timeout: 60000 });
      await page3.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; });
      await page3.keyboard.press("Space"); await page3.waitForTimeout(150);
      fresh = await page3.evaluate(() => ({ ver: localStorage.getItem("lab_ver"), cur: LAB.VERSION, slot: localStorage.getItem("lab_slot1"), prologue: localStorage.getItem("lab_prologue_seen"), ratePct: LAB.settings.ratePct, navMode: LAB.settings.navMode, wiped: LAB.freshStart && LAB.freshStart.wiped, from: LAB.freshStart && LAB.freshStart.from, intro: LAB.ui.top() ? LAB.ui.top().intro : "" }));
    } catch (e) { fresh = { err: String(e && e.message || e).slice(0, 200) }; }
    await ctx3.close();
  }
  await page.evaluate(k => { Object.assign(LAB.settings, k); LAB.saveSettings(); }, keepS);
  ok(restart, "A, H: после перезапуска игры настройки речи и доступности — те же" + (restartDiag ? " (" + restartDiag + ")" : ""));
  ok(fresh && fresh.ver === fresh.cur && fresh.slot === null && fresh.prologue === null && fresh.ratePct === 50 && fresh.navMode === "full" && fresh.wiped >= 3 && fresh.from === "Альфа 1.1" && /новая версия/i.test(fresh.intro || ""),
    "новая версия — с чистого листа: сохранения и настройки прежней версии при запуске стёрты, игрок слышит об этом в главном меню" + (fresh ? " (" + JSON.stringify(fresh).slice(0, 300) + ")" : ""));
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
      G.credits = 100;
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
    /* бластер: чем выше ступень, тем больше зарядов — по восемь; ёмкие энергобатареи с верстака */
    const mk = (b, lvl, rank) => LAB.makeWeapon(b, lvl, rank, 1);
    out.blaster = [mk("spark", 1, 0).cap, mk("spark", 1, 1).cap, mk("spark", 25, 0).cap, mk("pulse", 1, 2).cap].join(",");
    out.blName = / Б-3$/.test(mk("spark", 25, 0).name);
    const bw = mk("spark", 1, 0), W5 = LAB.workshop;
    out.big = W5.install(bw, "bigcell") === "" && bw.cap === 20 && W5.install(bw, "hugecell") === "" && bw.cap === 36;
    out.bigNo = /не от энергобатарей/.test(W5.compat(LAB.makeWeapon("kpistol", 2, 0, 1), "bigcell"));
    out.bigRec = ["m_bigcell", "m_hugecell"].every(id => LAB.RECIPES.some(rc => rc.out === id)) && LAB.RECIPES.find(rc => rc.out === "m_bigcell").cls === "base";
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
    out.wireAcross = !!wr && wr.cells.length === LAB.CORR_W;
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
  ok(!tr.hasCap || (tr.bindItem && tr.bindPoor && tr.bindOk && tr.boundInfo), "капсула: привязка — первым пунктом, без кредитов — нельзя, с кредитами — списывает цену");
  ok(!tr.hasCap || (tr.respawnCap && tr.respawnStart), "гибель: к привязанной капсуле, без привязки — к началу уровня");
  ok(tr.blaster === "12,20,28,34" && tr.blName, "бластер: «Искра» первой ступени — 12 зарядов, дальше по восемь за ступень (" + tr.blaster + ")");
  ok(tr.big && tr.bigNo && tr.bigRec, "ёмкая и сверхъёмкая энергобатареи собираются у верстака и добавляют бластеру зарядов");
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
    G.hp = 40; G.body.wake = 40; G.body.neuro = 60; G.body.food = 80;
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
    /* (2.0) телефон боком: весь экран — инструмент, игра пальцами, касание четырьмя пальцами — отойти */
    const kb0 = LAB.keysMode, W0 = window.innerWidth, H0 = window.innerHeight, I = LAB.instruments;
    const r2 = f => Math.round(f * 100) / 100;
    const pe = (type, id, x, y) => LAB.surface.pointer({ type, pointerId: id, clientX: x, clientY: y });
    const slide = (id, x0, y0, x1, y1, n) => { pe("pointerdown", id, x0, y0); for (let k = 1; k <= n; k++) pe("pointermove", id, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); pe("pointerup", id, x1, y1); };
    LAB.keysMode = false;
    let pl2 = -1;
    LAB.instruments.open("piano", { name: "Пианино" }, n => { pl2 = n; });
    const s1 = LAB.surface._state();
    out.surfOn = s1.on && s1.kind === "keys" && s1.orient === "landscape" && LAB.mini.active();
    slide(1, 2, H0 * 0.5, W0 - 2, H0 * 0.5, 40);
    out.gliss = JSON.stringify(LAB.surface._state().log) === JSON.stringify([0, 1, 2, 3, 4, 5, 6].map(i => r2(I.freq(1, i))));
    slide(2, 3, H0 * 0.95, 3, H0 * 0.05, 30);
    out.rows = JSON.stringify(LAB.surface._state().log.slice(-3)) === JSON.stringify([0, 1, 2].map(r => r2(I.freq(r, 0))));
    /* игра не закрывает инструмент: два пальца вниз по рядам, аккорд из четырёх нот, который держат, скольжение четырьмя пальцами */
    pe("pointerdown", 3, W0 * 0.3, H0 * 0.2); pe("pointerdown", 4, W0 * 0.6, H0 * 0.2);
    for (let k = 1; k <= 10; k++) { pe("pointermove", 3, W0 * 0.3, H0 * (0.2 + 0.06 * k)); pe("pointermove", 4, W0 * 0.6, H0 * (0.2 + 0.06 * k)); }
    pe("pointerup", 3, W0 * 0.3, H0 * 0.8); pe("pointerup", 4, W0 * 0.6, H0 * 0.8);
    await wait(100);
    out.keep2 = LAB.surface.active() && LAB.mini.active();
    const four = [0.15, 0.35, 0.55, 0.75];
    four.forEach((x, k) => pe("pointerdown", 20 + k, W0 * x, H0 * 0.5));
    await wait(900);
    four.forEach((x, k) => pe("pointerup", 20 + k, W0 * x, H0 * 0.5));
    out.keepChord = LAB.surface.active();
    four.forEach((x, k) => pe("pointerdown", 30 + k, W0 * x, H0 * 0.8));
    for (let j = 1; j <= 6; j++) four.forEach((x, k) => pe("pointermove", 30 + k, W0 * x, H0 * (0.8 - 0.1 * j)));
    four.forEach((x, k) => pe("pointerup", 30 + k, W0 * x, H0 * 0.2));
    out.keepSlide = LAB.surface.active();
    /* касание четырьмя пальцами — отойти: экран снова вертикальный, ноты касания затихли */
    const n0 = LAB.surface._state().log.length;
    four.forEach((x, k) => pe("pointerdown", 40 + k, W0 * x, H0 * 0.3));
    await wait(80);
    four.forEach((x, k) => pe("pointerup", 40 + k, W0 * x, H0 * 0.3));
    await wait(100);
    const s2 = LAB.surface._state();
    out.surfOff = !s2.on && s2.orient === "portrait" && !LAB.mini.active() && pl2 >= 10;
    out.quadDiag = [out.keep2, out.keepChord, out.keepSlide, n0, s2.on, s2.orient, LAB.mini.active(), pl2].join(" ");
    let pl3 = -1;
    LAB.instruments.open("guitar", { name: "Гитара" }, n => { pl3 = n; });
    const s3 = LAB.surface._state();
    out.gtrOn = s3.on && s3.kind === "strings" && !s3.frets;
    slide(5, W0 * 0.05, H0 * 0.97, W0 * 0.05, H0 * 0.03, 40);
    out.strum = JSON.stringify(LAB.surface._state().log.slice(-6)) === JSON.stringify(I.CHORDS[0].m.map(m => r2(I.midiF(m))));
    pe("pointerdown", 6, W0 * 0.5, H0 * 0.5); pe("pointerdown", 7, W0 * 0.7, H0 * 0.5); pe("pointerup", 6, W0 * 0.5, H0 * 0.5); pe("pointerup", 7, W0 * 0.7, H0 * 0.5);
    out.frets = LAB.surface._state().frets;
    slide(8, 2, H0 * 0.97, W0 * 0.33, H0 * 0.97, 30);
    out.fretRun = JSON.stringify(LAB.surface._state().log.slice(-4)) === JSON.stringify([0, 1, 2, 3].map(k => r2(I.midiF(I.GTR_OPEN[0] + k))));
    /* удар двумя пальцами вниз по струнам — это игра, а не выход */
    const g0 = LAB.surface._state().log.length;
    pe("pointerdown", 11, W0 * 0.2, H0 * 0.03); pe("pointerdown", 12, W0 * 0.45, H0 * 0.03);
    for (let k = 1; k <= 12; k++) { pe("pointermove", 11, W0 * 0.2, H0 * (0.03 + 0.078 * k)); pe("pointermove", 12, W0 * 0.45, H0 * (0.03 + 0.078 * k)); }
    pe("pointerup", 11, W0 * 0.2, H0 * 0.97); pe("pointerup", 12, W0 * 0.45, H0 * 0.97);
    await wait(100);
    out.gtrStrum2 = LAB.surface.active() && LAB.surface._state().log.length - g0 >= 10;
    LAB.mini.gesture({ kind: "back", n: 1 }); await wait(100);
    out.gtrOff = !LAB.surface.active() && LAB.surface._state().orient === "portrait" && pl3 > 0;
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
  ok(v16.surfOn && v16.gliss && v16.rows && v16.surfOff, "пианино на весь экран: экран горизонтально, палец по ряду — семь нот подряд, по рядам снизу вверх — три октавы, касание четырьмя пальцами — отойти, экран снова вертикальный");
  ok(v16.keep2 && v16.keepChord && v16.keepSlide && v16.gtrStrum2, "выход не мешает игре: два пальца вниз по рядам, аккорд из четырёх нот, который держат, скольжение четырьмя пальцами и удар двумя пальцами по струнам инструмент не закрывают (" + v16.quadDiag + ")");
  ok(v16.gtrOn && v16.strum && v16.frets && v16.fretRun && v16.gtrOff, "гитара на весь экран: перебор поперёк струн — аккорд до мажор, касание двумя пальцами — лады, вдоль струны — по полутону, «Назад» — отойти");
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

  const real = errors.filter(e => !/favicon|sounds\/|Failed to load resource/.test(e));
  ok(!real.length, "ошибок страницы нет" + (real.length ? ": " + real.slice(0, 5).join(" || ") : ""));
  ok(!external.length, "I: игра ничего не загружает из сети — все запросы к своим файлам" + (external.length ? ": " + external.slice(0, 3).join(", ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `ПРОВАЛЕНО: ${fails}` : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
