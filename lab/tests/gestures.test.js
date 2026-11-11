#!/usr/bin/env node
/* (после 4.6) Проверка жестов: настоящие касания по игровому полю (PointerEvent) —
   свайпы, касания одним–четырьмя пальцами, двойные и тройные, касания с удержанием,
   двойные и тройные с удержанием; таблица жестов по умолчанию; переназначение через
   «Настройки» → «Управление» → «Жесты»; окна не переназначаются; подсказки называют
   жест, на котором действие стоит сейчас; настройки касаний (пауза, удержание).
   Запуск: node lab/tests/gestures.test.js  (нужен Playwright с Chromium) */
"use strict";
const path = require("path"), http = require("http"), fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
let pw;
for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { pw = require(p); break; } catch (e) { /* дальше */ } }
if (!pw) { console.error("нет Playwright"); process.exit(2); }
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".ogg": "audio/ogg", ".png": "image/png", ".json": "application/json" };
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
  await page.evaluate(() => { localStorage.clear(); });
  await page.keyboard.press("Shift"); /* звук разбужен клавишей: первое касание не проглатывается */
  await page.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; LAB.keysMode = false; });

  console.log("Жесты: распознавание и таблица по умолчанию");
  const r1 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, GS = LAB.gestures, out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(1, 2, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; });
    g.paused = false; LAB.keysMode = false;
    const G = g.G; G.hp = G.hpMax = 9999;
    /* что выполнилось: подменяем выполнение действий записью (сами действия проверяет play.test.js) */
    const log = [], ex0 = GS.exec;
    GS.exec = function (a, gg) { log.push(a); return true; };
    const pad = document.getElementById("pad");
    const ev = (type, id, x, y) => pad.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: "touch", bubbles: true, cancelable: true, isPrimary: id === 1 }));
    let pid = 10;
    const fingers = n => { const ids = []; for (let k = 0; k < n; k++) ids.push(pid++); return ids; };
    const press = (ids) => ids.forEach((id, k) => ev("pointerdown", id, 80 + 60 * k, 400));
    const release = (ids) => ids.forEach((id, k) => ev("pointerup", id, 80 + 60 * k, 400));
    const tapN = async (n, hold) => { const ids = fingers(n); press(ids); await wait(hold || 50); release(ids); };
    const taps = async (n, count, lastHold) => { for (let i = 0; i < count; i++) { await tapN(n, i === count - 1 && lastHold ? lastHold : 50); if (i < count - 1) await wait(90); } };
    const swipe = async (n, dx, dy) => { const ids = fingers(n); press(ids); for (let s = 1; s <= 8; s++) { ids.forEach((id, k) => ev("pointermove", id, 80 + 60 * k + dx * s / 8, 400 + dy * s / 8)); await wait(8); } ids.forEach((id, k) => ev("pointerup", id, 80 + 60 * k + dx, 400 + dy)); };
    const take = () => { const l = log.slice(); log.length = 0; return l.join(","); };
    const GAP = 380, HOLD = 600;
    /* одиночное касание двумя пальцами ждёт паузу (вдруг двойное или тройное) — и перезаряжает */
    await tapN(2); out.t2early = take(); await wait(GAP + 80); out.t2 = take();
    await taps(2, 2); await wait(GAP + 80); out.d2 = take();
    await taps(2, 3); out.r2 = take(); /* тройное — сразу, дольше ждать нечего */
    /* касания с удержанием срабатывают, пока пальцы на экране; отпускание ничего не добавляет */
    { const ids = fingers(2); press(ids); await wait(HOLD + 150); out.p2held = take(); release(ids); await wait(GAP + 80); out.p2after = take(); }
    await taps(2, 2, HOLD + 150); await wait(GAP + 80); out.dp2 = take();
    await taps(2, 3, HOLD + 150); await wait(GAP + 80); out.rp2 = take();
    /* три пальца: касание — оружие (после паузы), двойное — задания, тройное — характеристики */
    await tapN(3); await wait(GAP + 80); out.t3 = take();
    await taps(3, 2); await wait(GAP + 80); out.d3 = take();
    await taps(3, 3); out.r3 = take();
    await tapN(3, HOLD + 150); await wait(GAP + 80); out.p3 = take();
    await taps(3, 2, HOLD + 150); await wait(GAP + 80); out.dp3 = take();
    await taps(3, 3, HOLD + 150); await wait(GAP + 80); out.rp3 = take();
    /* четыре пальца */
    await tapN(4); await wait(GAP + 80); out.t4 = take();
    await taps(4, 2); await wait(GAP + 80); out.d4 = take();
    await taps(4, 3); out.r4 = take();
    await tapN(4, HOLD + 150); await wait(GAP + 80); out.p4 = take();
    await taps(4, 2, HOLD + 150); await wait(GAP + 80); out.dp4 = take();
    await taps(4, 3, HOLD + 150); await wait(GAP + 80); out.rp4 = take();
    /* один палец: касание, двойное, долгое; свайпы */
    await tapN(1); await wait(GAP + 80); out.t1 = take();
    await taps(1, 2); out.d1 = take();
    await tapN(1, 1000); await wait(50); out.p1 = take();
    await swipe(1, 0, -150); await wait(50); out.s1U = take();
    await swipe(3, 0, 150); await wait(50); out.s3D = take();
    await swipe(2, 150, 0); await wait(50); out.s2R = take();
    await swipe(4, -150, 0); await wait(50); out.s4L = take();
    /* четыре пальца вниз — тишина (до выполнения действий: работает и пока мир ждёт) */
    const h0 = LAB.Speech.hush; let hushed = 0; LAB.Speech.hush = function () { hushed++; };
    await swipe(4, 0, 150); await wait(50); out.s4D = take() === "" && hushed === 1;
    LAB.Speech.hush = h0;
    /* все жесты таблицы, кроме составных, заняты */
    out.allBound = GS.list.filter(x => x.type !== "zig").every(x => GS.bound(x.id));
    out.count = GS.list.length;
    GS.exec = ex0;
    return out;
  });
  ok(r1.t2early === "" && r1.t2 === "reload", "касание двумя пальцами — перезарядка, после паузы двойного касания (" + r1.t2early + "/" + r1.t2 + ")");
  ok(r1.d2 === "nextW", "двойное касание двумя пальцами — следующее оружие (" + r1.d2 + ")");
  ok(r1.r2 === "prevW", "тройное касание двумя пальцами — предыдущее оружие, сразу (" + r1.r2 + ")");
  ok(r1.p2held === "drone" && r1.p2after === "", "касание двумя пальцами с удержанием срабатывает, пока пальцы на экране, — дрон и каркас (" + r1.p2held + "/" + r1.p2after + ")");
  ok(r1.dp2 === "traps", "двойное касание двумя пальцами с удержанием — ловушки и мины (" + r1.dp2 + ")");
  ok(r1.rp2 === "throw", "тройное касание двумя пальцами с удержанием — граната (" + r1.rp2 + ")");
  ok(r1.t3 === "draw" && r1.d3 === "quests" && r1.r3 === "stats", "три пальца: касание — оружие, двойное — задания, тройное — характеристики (" + [r1.t3, r1.d3, r1.r3] + ")");
  ok(r1.p3 === "eat" && r1.dp3 === "save" && r1.rp3 === "guide", "три пальца с удержанием: поесть, сохранить, руководство (" + [r1.p3, r1.dp3, r1.rp3] + ")");
  ok(r1.t4 === "status" && r1.d4 === "implants" && r1.r4 === "load", "четыре пальца: здоровье, импланты, груз (" + [r1.t4, r1.d4, r1.r4] + ")");
  ok(r1.p4 === "where" && r1.dp4 === "gestList" && r1.rp4 === "settings", "четыре пальца с удержанием: где вы, список жестов, настройки (" + [r1.p4, r1.dp4, r1.rp4] + ")");
  ok(r1.t1 === "nearby" && r1.d1 === "interact" && r1.p1 === "repeat", "один палец: что рядом, действие, повторить фразу (" + [r1.t1, r1.d1, r1.p1] + ")");
  ok(r1.s1U === "auto" && r1.s3D === "inv" && r1.s2R === "nav" && r1.s4L === "histBack", "свайпы: шаг или выстрел, инвентарь, навигатор, объявления ОКО (" + [r1.s1U, r1.s3D, r1.s2R, r1.s4L] + ")");
  ok(r1.s4D, "четыре пальца вниз — тишина");
  ok(r1.allBound && r1.count === 45, "все несоставные жесты заняты действиями; жестов в таблице — " + r1.count);

  console.log("Переназначение: «Настройки» → «Управление» → «Жесты»");
  const r2 = await page.evaluate(async () => {
    const GS = LAB.gestures, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const lbl = it => typeof it.label === "function" ? it.label() : it.label;
    const pickTop = re => { const w = LAB.ui.top(); const i = w.items.findIndex(it => re.test(lbl(it))); if (i < 0) return false; w.i = i; LAB.ui.activate(); return true; };
    SPOKEN.length = 0;
    LAB.ui.closeAll(); LAB.ui.settings();
    out.ctl = pickTop(/^Управление: жесты/);
    out.ctlTitle = LAB.ui.top().title;
    out.gest = pickTop(/^Жесты: какое действие/);
    out.two = pickTop(/^Два пальца/);
    out.listTitle = LAB.ui.top().title;
    out.itemBefore = lbl(LAB.ui.top().items.find(it => /^Касание двумя пальцами:/.test(lbl(it))));
    out.open = pickTop(/^Касание двумя пальцами:/);
    out.actTitle = LAB.ui.top().title;
    const acts = LAB.ui.top().items.map(lbl);
    out.noDir = !acts.some(l => /в сторону жеста/.test(l)) && acts.some(l => /^Перезарядить — сейчас/.test(l));
    out.focusCur = /— сейчас/.test(lbl(LAB.ui.top().items[LAB.ui.top().i]));
    out.pick = pickTop(/^Поесть/);
    out.after = LAB.ui.top().title;
    out.itemAfter = lbl(LAB.ui.top().items.find(it => /^Касание двумя пальцами:/.test(lbl(it))));
    out.said = SPOKEN.join(" | ");
    out.bound = GS.actionOf("t2");
    out.saved = /"t2":"eat"/.test(localStorage.getItem("lab_settings") || "");
    /* подсказки называют жест, где действие теперь: перезарядку поставили на тройное касание тремя пальцами */
    GS.set("r3", "reload");
    out.word = LAB.gw("reload", "касание двумя пальцами");
    out.wordDraw = LAB.gw("draw", "касание тремя пальцами");
    /* свайпам — шаг и выстрел; касаниям их не дают */
    out.dirOnSwipe = GS.set("s2U", "shoot") && GS.actionOf("s2U") === "shoot";
    out.dirOnTap = !GS.set("t4", "shoot") && GS.actionOf("t4") === "status";
    out.holdOnSwipe = !GS.set("s3U", "walk") && GS.set("w1U", "walk");
    /* «Вернуть все жесты» */
    LAB.ui.closeAll(); GS.controlsMenu();
    out.reset = pickTop(/^Вернуть все жесты/) && pickTop(/^Да, вернуть/);
    out.clean = GS.actionOf("t2") === "reload" && GS.actionOf("r3") === "stats" && GS.actionOf("s2U") === "look" && !LAB.settings.gest;
    LAB.ui.closeAll();
    return out;
  });
  ok(r2.ctl && r2.ctlTitle === "Управление" && r2.gest && r2.two && r2.listTitle === "Жесты: два пальца", "путь «Настройки» → «Управление» → «Жесты» → «Два пальца» (" + r2.listTitle + ")");
  ok(r2.open && r2.actTitle === "Касание двумя пальцами" && r2.noDir && r2.focusCur, "жест открывает список действий; текущее отмечено и в фокусе; шага и выстрела у касания нет");
  ok(r2.pick && r2.after === "Жесты: два пальца" && /поесть\. Изменён/.test(r2.itemAfter) && r2.bound === "eat", "выбор назначает действие и возвращает к списку жестов (" + r2.itemAfter + ")");
  ok(/Касание двумя пальцами — теперь поесть/.test(r2.said) && /«перезарядить» больше ни на каком жесте/.test(r2.said), "игра говорит, что назначено и что осталось без жеста");
  ok(r2.saved, "назначение записано в настройки");
  ok(r2.word === "тройное касание тремя пальцами" && r2.wordDraw === "касание тремя пальцами", "подсказки называют текущий жест (" + r2.word + ")");
  ok(r2.dirOnSwipe && r2.dirOnTap && r2.holdOnSwipe, "шаг и выстрел — только на свайпы, ходьба и очередь — только на свайп с удержанием");
  ok(r2.reset && r2.clean, "«Вернуть все жесты, как было задано» возвращает таблицу");

  console.log("Окна, свободные жесты, удержание без назначения, настройки касаний");
  const r3 = await page.evaluate(async () => {
    const GS = LAB.gestures, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const pad = document.getElementById("pad");
    const ev = (type, id, x, y) => pad.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: "touch", bubbles: true, cancelable: true }));
    let pid = 500;
    const tapN = async (n, hold) => { const ids = []; for (let k = 0; k < n; k++) ids.push(pid++); ids.forEach((id, k) => ev("pointerdown", id, 80 + 60 * k, 400)); await wait(hold || 50); ids.forEach((id, k) => ev("pointerup", id, 80 + 60 * k, 400)); };
    const GAP = 380, HOLD = 600;
    const taps = async (n, count, lastHold) => { for (let i = 0; i < count; i++) { await tapN(n, i === count - 1 && lastHold ? lastHold : 50); if (i < count - 1) await wait(90); } };
    const log = [], ex0 = GS.exec; GS.exec = function (a) { log.push(a); return true; };
    const take = () => { const l = log.slice(); log.length = 0; return l.join(","); };
    /* в окне жесты прежние: касание двумя пальцами — тишина, не перезарядка */
    LAB.ui.character();
    const h0 = LAB.Speech.hush; let hushed = 0; LAB.Speech.hush = function () { hushed++; };
    await tapN(2); await wait(450);
    out.winHush = hushed === 1 && take() === "";
    LAB.Speech.hush = h0; LAB.ui.closeAll();
    /* удержание без назначения — касание остаётся касанием */
    GS.set("p2", "none");
    await tapN(2, 800); await wait(450); out.noHoldTap = take();
    /* «ничего» на двойное и тройное — касание срабатывает сразу */
    GS.set("d3", "none"); GS.set("r3", "none"); GS.set("dp3", "none"); GS.set("rp3", "none");
    await tapN(3); out.t3now = take();
    /* (после 4.6) двойного касания нет, а двойное с удержанием есть — первое касание ждёт, удержание — своё */
    GS.set("d2", "none"); GS.set("r2", "none");
    await taps(2, 2, HOLD + 150); await wait(GAP + 80); out.dpNoD = take();
    await tapN(2); await wait(GAP + 80); out.t2wait = take();
    GS.set("d2", "nextW"); GS.set("r2", "prevW");
    /* пауза двойного касания короче — касание раньше */
    LAB.settings.gTapGap = 250;
    await tapN(2); await wait(300); out.gap250 = take();
    LAB.settings.gTapGap = 380;
    /* удержание дольше — короткое удержание ещё касание */
    LAB.settings.gHold = 1000; GS.set("p2", "drone");
    { const ids = [pid++, pid++]; ids.forEach((id, k) => ev("pointerdown", id, 80 + 60 * k, 400)); await wait(700); out.hold1000early = take(); await wait(450); out.hold1000 = take(); ids.forEach((id, k) => ev("pointerup", id, 80 + 60 * k, 400)); await wait(450); out.hold1000after = take(); }
    LAB.settings.gHold = 600;
    GS.reset();
    GS.exec = ex0;
    /* действия, которых раньше не было на жестах, работают */
    SPOKEN.length = 0; GS.exec("where", {}); out.where = SPOKEN.join(" ");
    GS.exec("gestList", {}); out.gl = LAB.ui.top() && LAB.ui.top().title; LAB.ui.closeAll();
    return out;
  });
  ok(r3.winHush, "в окне касание двумя пальцами — тишина, как прежде (окна не переназначаются)");
  ok(r3.noHoldTap === "reload", "долгое касание без назначенного удержания — обычное касание (" + r3.noHoldTap + ")");
  ok(r3.t3now === "draw", "без двойного и тройного касания тремя пальцами касание срабатывает сразу (" + r3.t3now + ")");
  ok(r3.dpNoD === "traps" && r3.t2wait === "reload", "двойное касание с удержанием срабатывает, даже если на двойное касание ничего не назначено (" + r3.dpNoD + "; " + r3.t2wait + ")");
  ok(r3.gap250 === "reload", "пауза двойного касания 0,25 секунды — касание раньше");
  ok(r3.hold1000early === "" && r3.hold1000 === "drone" && r3.hold1000after === "", "удержание через секунду: раньше не срабатывает, потом — один раз");
  ok(/Уровень 1, этаж 2\. День \d+, \d\d:\d\d/.test(r3.where), "«Где вы и который час» (" + r3.where.slice(0, 80) + ")");
  ok(r3.gl === "Жесты", "«Жесты: что на каком жесте» открывает список");
  ok(!errors.length, "ошибок страницы нет" + (errors.length ? ": " + errors.slice(0, 3).join(" ; ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "ОШИБОК: " + fails : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
