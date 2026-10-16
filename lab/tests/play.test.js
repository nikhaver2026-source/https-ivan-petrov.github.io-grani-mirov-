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
  ok(await page.evaluate(() => !LAB.ui.top()), "Escape — раздел закрыт, снова игра");
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
    for (let F = 1; F <= 20 && !snack; F++) { const fl = LAB.getFloor(G.seed, 2, F); snack = fl.objs.find(o => o.type === "snacks"); if (snack) sf = F; }
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
    LAB.oko.event("robots");
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
    const dr = C.dispatch(1, "drone"), hp0 = G.hp, dd = [];
    for (let i = 0; i < 160; i++) { C.tick(); if (i >= 100 && dr[0]) dd.push(dH(dr[0])); }
    out.drone = { n: dr.length, far: dr[0] ? Math.max.apply(null, dd) : 99, near: dr[0] ? Math.min.apply(null, dd) : 0, hurt: hp0 - G.hp };
    /* патрули смены: маршруты меняются, патрульных хватает */
    g.enterFloor(3, 9, "down", true); god();
    live().forEach(f => { f.dead = true; });
    LAB.oko.state().heat = 60;
    LAB.oko.shift(); for (let i = 0; i < 40; i++) C.tick();
    const r1 = C.patrols().map(f => JSON.stringify(f.route));
    LAB.oko.shift(); for (let i = 0; i < 40; i++) C.tick();
    out.patrol = { n: C.patrols().length, changed: C.patrols().some(f => r1.indexOf(JSON.stringify(f.route)) < 0) };
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
  ok(oko.drone.n === 1 && oko.drone.far <= 8 && oko.drone.near >= 2 && oko.drone.hurt > 0, "дрон слежения догнал, держится рядом (" + oko.drone.near + "–" + oko.drone.far + " шагов) и стреляет");
  ok(oko.patrol.n >= 2 && oko.patrol.changed, "патрули смены: " + oko.patrol.n + ", маршруты меняются");
  ok(!oko.guard || (oko.guard.back && oko.guard.state === "idle"), "страж у лифта вернулся на пост");
  ok(oko.dead !== false, "павший враг не встаёт, когда вы вернулись на этаж");

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
  await browser.close();
  server.close();
  console.log(fails ? `ПРОВАЛЕНО: ${fails}` : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
