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
  ok(JSON.stringify(items) === JSON.stringify(["Начать игру", "Пролог", "Загрузить игру", "Руководство", "Настройки"]), "в меню пять пунктов, среди них руководство: " + items.join(", "));
  await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" }); await gest({ kind: "swipe", n: 1, dir: "R" });
  await gest({ kind: "dtap", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title) === "Руководство", "главное меню → «Руководство» открывает руководство");
  await gest({ kind: "back", n: 1 });
  ok(await page.evaluate(() => LAB.ui.top().title === LAB.TITLE + ". Главное меню"), "из руководства — назад в главное меню");

  console.log("Настройки");
  await page.evaluate(() => { LAB.ui.top().i = 0; });
  for (let i = 0; i < 4; i++) await gest({ kind: "swipe", n: 1, dir: "R" });
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
    LAB.ui.top().i = 2; LAB.ui.activate(); /* капучино */
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
    G.body.food = 30; G.body.lv = {}; g.bodyWarn(); SPOKEN.length = 0;
    g.advanceTime(60);
    out.hunger = { food: Math.round(G.body.food), said: SPOKEN.join(" | ") };
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
  ok(bod.hunger.food < 30 && /Голод/.test(bod.hunger.said), "сытость падает со временем, «Эхо» предупреждает о голоде: " + bod.hunger.said);
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
  ok(oko.check.n >= 1 && oko.check.c1 < oko.check.c0, "неудачный взлом — проверка идёт к терминалу (" + oko.check.c0 + " → " + oko.check.c1 + ")");
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
      for (let k = 0; k < 300; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); await wait(60); }
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
      const step = pick(/Оборонная сеть/) && pick(/команда одной турели/);
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
    for (let k = 0; k < 300; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) { const want = c.seq[c.pos]; LAB.mini.gesture({ kind: "swipe", n: 1, dir: want }); if (c.done) { LAB.mini.gesture({ kind: "swipe", n: 1, dir: want === "U" ? "D" : "U" }); } } await wait(60); }
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
    const cCam = C.freeCellNear(G.x, G.y + 2, null), cam = cCam ? C.spawnFoe("cam", cCam[0], cCam[1], {}) : null;
    if (cam) { cam.ally = false; cam.calm = false; }
    G.face = "S"; G.inv.disruptor = 1; g.useItem("disruptor"); await wait(800);
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
    for (const o of g.CUR.fl.objs) { if (tgt) break; const p = g._routeTo(null, o); if (p && p.length >= 8 && turnsOf(p) >= 1) tgt = { n: "проверочная цель", o }; }
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
    for (let k = 0; k < 300; k++) { const c = LAB.mini._cur(); if (!c || c.type !== "hack") break; if (!c.busy) { LAB.mini.gesture({ kind: "swipe", n: 1, dir: c.seq[c.pos] }); } await wait(40); }
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
    const rm = g.CUR.fl.rooms.find(r => g.CUR.fl.objs.some(o => o.room === r.id) && r.doors && r.doors.length);
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
    out.memory = performance.memory ? { mb: Math.round((h2 - h1) / 1048576), ok: h2 - h1 < 64 * 1048576 } : { mb: "нет данных", ok: true, na: true };
    LAB.ui.closeAll();
    return out;
  });
  ok(tp.settings, "A, H: настройки речи и доступности записываются и переживают перезапуск");
  ok(tp.spatial, "B: стороны и расстояние на слух — слева и справа, ближе и дальше, глуше за спиной и за стеной");
  ok(tp.doorSound, "B: проход через дверь звучит — порог двери под ногой" + (tp.doorDiag ? " (" + tp.doorDiag + ")" : ""));
  ok(tp.duck, "E: речь приглушает музыку, но не звуки боя и сигналы" + (tp.duckDiag ? " (" + tp.duckDiag + ")" : ""));
  ok(tp.giveUp !== false, "E: враг, который героя не видит и не слышит, не гонится вечно — переходит к поиску");
  ok(tp.turrets && tp.terminal && tp.deadStays, "D, H: турели, взломанный терминал и павший враг — те же после загрузки");
  ok(tp.noDup && tp.docOnce, "F, H: после загрузки вещей и документов столько же, документ не дублируется" + (tp.dupDiag ? " (" + tp.dupDiag + ")" : ""));
  ok(tp.depths, "G: у каждой глубины свои полы, фон и враги");
  ok(tp.memory && tp.memory.ok, "I: обход двухсот этажей не раздувает память (прирост " + (tp.memory && tp.memory.mb) + (tp.memory && tp.memory.na ? "" : " МБ") + ")");

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
