#!/usr/bin/env node
/* (после 4.6) Проверка героя: характеристики (очки уровня, практика раз в сутки, пороги, вторичные,
   перенос записей), груз (вес, предел, перегруз, неподъёмно, отказ поднять, тяжёлое оружие) и ячейка
   хранения (предел веса и мест, у капсулы, верстака и пункта снабжения, пять путей расширения,
   переполнение без потери вещей, разгрузка прежних записей).
   Запуск: node lab/tests/hero.test.js  (нужен Playwright с Chromium) */
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
  await page.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; localStorage.clear(); });

  console.log("Характеристики: очки уровня, практика, пороги, вторичные");
  const r1 = await page.evaluate(() => {
    const g = LAB.game, C = LAB.combat, ST = LAB.stats, out = {};
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; });
    const G = g.G; said();
    out.start = G.str === 10 && G.agi === 10 && G.con === 10 && G.mind === 10 && G.cha === 10 && ST.S().pts === 0;
    const hp0 = G.hpMax;
    g.gainXP(LAB.xpNeed(G.lvl));
    out.level = G.lvl === 2 && ST.S().pts === 5 && G.str === 10 && G.hpMax === hp0 + 5 && /Очков характеристик: 5/.test(said());
    /* вложить: телосложение даёт здоровье */
    const hp1 = G.hpMax; ST.spend("con", 2);
    out.con = G.con === 12 && G.hpMax === hp1 + 10 && ST.S().pts === 3;
    ST.spread(); out.spread = ST.S().pts === 0 && G.str + G.agi + G.mind + G.cha + G.con === 50 + 5;
    /* практика: раз в сутки */
    const a0 = G.agi;
    for (let i = 0; i < 40; i++) ST.deed("disarm");
    const a1 = G.agi;
    for (let i = 0; i < 40; i++) ST.deed("disarm");
    out.daily = a1 === a0 + 1 && G.agi === a1;
    G.day++; ST.deed("disarm"); out.nextDay = G.agi === a1 + 1;
    out.practiceSaid = /Практика: ловкость выросла/.test(said());
    /* окно и строка персонажа */
    ST.menu(); const w = LAB.ui.top(); const lbl = it => typeof it.label === "function" ? it.label() : it.label;
    out.window = w.title === "Характеристики" && w.items.some(it => /^Телосложение \d+ из 40/.test(lbl(it))) && w.items.some(it => /^Выносливость/.test(lbl(it)));
    LAB.ui.closeAll();
    out.charLine = g.characterText().some(t => /телосложение \d+/.test(t) && /выносливость/.test(t));
    /* пороги: каркас — сила и телосложение; гнездо дрона; клинок */
    G.str = 14; G.con = 12; const f = { cls: "heavy", en: 10 };
    out.frameNeedsCon = !LAB.exo.strOk(f); G.con = 13; out.frameOk = LAB.exo.strOk(f);
    out.flawAgi = (G.agi = 15, ST.K.flaw()) < (G.agi = 14, ST.K.flaw());
    G.cha = 25; const buy25 = g.chaK(); G.cha = 24; const buy24 = g.chaK(); out.cha25 = buy25 < buy24 - 0.02;
    /* вторичные: шаги — выносливость, лечение — регенерация */
    const sx = ST.S().px.stam || 0; ST.step(); out.stamPx = (ST.S().px.stam || 0) > sx;
    const rx = ST.S().px.regen || 0; ST.healed(30); out.regenPx = (ST.S().px.regen || 0) > rx;
    /* запись прежней версии: телосложение — как при ровном росте */
    /* — через настоящую запись и загрузку: migrate раньше подставлял телосложение 10 по умолчанию */
    g.saveSlot(3);
    { const raw = JSON.parse(localStorage.getItem("lab_slot3")); delete raw.g.con; delete raw.g.chs; raw.g.lvl = 9; localStorage.setItem("lab_slot3", JSON.stringify(raw)); }
    g.loadSlot(3); LAB.combat.stop(); LAB.ui.closeAll();
    out.migrate = g.G.con === 18 && ST.S().pts === 0;
    if (!out.migrate) out.migrateDiag = "con " + g.G.con + ", очков " + ST.S().pts;
    return out;
  });
  ok(r1.start, "новый герой: все характеристики 10, очков нет");
  ok(r1.level, "уровень: пять очков, пять здоровья, характеристики сами не растут; «Эхо» говорит про очки");
  ok(r1.con && r1.spread, "очки: телосложение даёт по пять здоровья; «поровну» раскладывает все очки");
  ok(r1.daily && r1.nextDay && r1.practiceSaid, "практика поднимает характеристику не чаще раза в сутки");
  ok(r1.window && r1.charLine, "окно «Характеристики» и строка в окне персонажа");
  ok(r1.frameNeedsCon && r1.frameOk, "тяжёлому каркасу нужны сила 14 и телосложение 13");
  ok(r1.flawAgi && r1.cha25, "пороги: ловкость 15 — меньше брака, харизма 25 — уступки торговцев");
  ok(r1.stamPx && r1.regenPx, "вторичные растут практикой: шаги — выносливость, лечение — регенерация");
  ok(r1.migrate, "запись прежней версии: телосложение по уровню, очков нет" + (r1.migrateDiag ? " (" + r1.migrateDiag + ")" : ""));

  console.log("Груз: вес, предел, перегруз, неподъёмно, тяжёлое оружие");
  const r2 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, L = LAB.load, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; });
    const G = g.G; G.hp = G.hpMax = 9999; said();
    out.start = L.tier() <= 1 && L.capacity() === 30;
    /* перегруз и неподъёмно */
    G.inv.scrap = 45; L.after(); await wait(10);
    out.overTier = L.tier() === 2 && L.gapK() > 1 && L.noise() > 0 && L.wakeK() > 1 && L.dodgePen() > 0 && /перегруз/.test(said());
    G.inv.scrap = 100; L.after(); await wait(10);
    const x0 = G.x, y0 = G.y; said();
    out.stuck = L.tier() === 4 && !g.tryMove("N", false) && !g.tryMove("S", false) && G.x === x0 && G.y === y0 && /С места не сдвинуться/.test(said());
    /* лишнее с пола не поднять */
    const fs = g.CUR.fs; fs.drops = fs.drops || []; fs.drops.push({ kind: "item", item: "panel", n: 5, id: "dHeavy", x: G.x, y: G.y });
    g.autoPickup(); out.refuse = !(G.inv.panel > 0) && /Не поднять/.test(said());
    delete G.inv.scrap; L.after();
    /* сила увеличивает предел; каркас заряженный — несёт себя и груз */
    const c0 = L.capacity(); G.str = 20; out.strCap = L.capacity() === c0 + 20;
    /* надетая броня — вполовину */
    const a = G.armor; out.armorHalf = Math.abs(L.parts().armor - L.armorWt(a) * 0.5) < 0.01;
    /* тяжёлое оружие требует силы */
    const w = LAB.makeWeapon("spark", 1, 0, 1, "railT"); w.own = { fam: "rail", nodes: {} };
    G.str = 10; const p10 = L.handPen(w); G.str = 20; const p20 = L.handPen(w);
    out.hand = p10 > 0 && p20 === 0 && L.needStr(w) === 20;
    /* окна */
    LAB.ui.inventory(); out.invLine = /^Груз .* из .*: /.test(LAB.ui.top().items.slice(-1)[0].label); LAB.ui.closeAll();
    L.status(); out.status = /Предел складывают: основа/.test(said());
    return out;
  });
  ok(r2.start, "в начале: предел 30 кило, налегке или обычный ход");
  ok(r2.overTier, "перегруз: шаг реже и громче, усталость быстрее, уклонение хуже; «Эхо» говорит о перегрузе");
  ok(r2.stuck, "неподъёмно: ни шагу, «Эхо» говорит, сколько сбросить");
  ok(r2.refuse, "лишнего с пола не поднять");
  ok(r2.strCap && r2.armorHalf, "сила поднимает предел; надетая броня весит вполовину");
  ok(r2.hand, "тяжёлое оружие: силы мало — точность ниже, силы хватает — без потерь");
  ok(r2.invLine && r2.status, "груз в инвентаре и подробно — «Груз: сколько несёте»");

  console.log("Ячейка хранения: предел, доступ, пять путей расширения");
  const r3 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, L = LAB.load, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const lbl = it => typeof it.label === "function" ? it.label() : it.label;
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; });
    const G = g.G; said();
    const cap0 = L.lockCap(); out.base = cap0.kg === 40 && cap0.slots === 10;
    /* предел веса: всё не влезает */
    G.inv.scrap = 100; L.putParts(); out.kgLimit = L.lockerWt() <= 40 && G.inv.scrap > 0 && /Не влезло/.test(said());
    /* предел мест */
    const ids = Object.keys(LAB.ITEMS).filter(k => LAB.ITEMS[k].kind === "part" && k !== "scrap").slice(0, 15);
    ids.forEach(k => { G.inv[k] = 1; });
    let put = 0; ids.forEach(k => { put += L.putItem(k, 1, true); });
    out.slotLimit = L.slotsUsed() <= 10 && put < ids.length;
    /* доступ: капсула, верстак, пункт снабжения */
    const post = g.CUR.fl.objs.find(o => o.type === "supply");
    if (post) { LAB.supply.postMenu(post); out.post = LAB.ui.top().items.some(it => /^Ячейка хранения/.test(lbl(it))); LAB.ui.closeAll(); } else out.post = "нет пункта";
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench");
    if (wb) { G.x = wb.x; G.y = wb.y; LAB.ui.craft(wb); out.bench = LAB.ui.top().items.some(it => /^Ячейка хранения/.test(lbl(it))); LAB.ui.closeAll(); } else out.bench = "нет верстака";
    /* 1) ступени за кредиты: каждая дороже */
    G.credits = 1e6; const p0 = L.upPrice(); L.upgrade(); const p1 = L.upPrice(); L.upgrade(); const p2 = L.upPrice();
    out.ladder = p1 > p0 && p2 > p1 && L.locker().lv === 2 && L.lockCap().kg === 80 && L.lockCap().slots === 18;
    /* 2) аренда на трое суток: кончилась — вещи целы, класть нельзя */
    const r0 = L.rentPrice(); L.rent(); out.rent = L.rented() && L.lockCap().kg === 120 && L.rentPrice() > r0;
    G.inv.lead = 30; const putLead = L.putItem("lead", 30, true); /* по кило за штуку */
    G.day += 4; L.minutes(); const w0 = L.lockerWt();
    out.rentEnd = !L.rented() && L.lockCap().kg === 80 && /Аренда соседней ячейки кончилась/.test(said());
    G.inv.wire = 5; const putAfter = L.putItem("wire", 5, true);
    out.overfull = w0 > L.lockCap().kg ? putAfter === 0 && L.lockerWt() === w0 : putLead > 0;
    /* 3) у верстака: полки и дно, нужна механика, детали растут */
    if (LAB.mastery) LAB.mastery.M().xp.mech = 0;
    ["scrap", "panel", "wire", "servo", "magnet"].forEach(k => { G.inv[k] = 80; });
    out.needMech = !L.craftCell("shelf") || !LAB.mastery;
    if (LAB.mastery) LAB.mastery.M().xp.mech = 500;
    const n0 = L.craftNeed("shelf").scrap; L.craftCell("shelf"); const n1 = L.craftNeed("shelf").scrap; L.craftCell("floor");
    out.craft = L.locker().shelf === 1 && L.locker().floor === 1 && n1 > n0;
    /* 4) ключ-карты: с машин, до пяти */
    L.locker().cards = 0; G.inv.lockcard = 6; for (let i = 0; i < 6; i++) L.useCard();
    out.cards = L.locker().cards === 5 && G.inv.lockcard === 1;
    const list = []; delete G.inv.lockcard; L.locker().cards = 0;
    for (let i = 0; i < 3000; i++) L.drops({ kind: "mech", beh: ["guard"], guard: 1 }, list, Math.random, 1);
    out.drops = list.length > 20 && list.every(it => it.item === "lockcard");
    L.locker().cards = 5; const list2 = []; for (let i = 0; i < 500; i++) L.drops({ kind: "mech", beh: [], boss: 1 }, list2, Math.random, 1);
    out.dropsCap = list2.length === 0;
    /* 5) харизма */
    const s0 = L.lockCap().slots; G.cha = 30; out.cha = L.lockCap().slots === s0 + 4;
    /* разгрузка записи прежней версии */
    delete G.loadInit; delete G.locker; G.inv.scrap = 150; G.inv.wire = 80; G.str = 10; G.cha = 10;
    L.init(true); await wait(1700);
    out.relief = L.tier() <= 2 && L.lockerWt() > 0 && /отправлено в вашу ячейку хранения/.test(said());
    /* окна ячейки собираются без ошибок */
    ["capsule", "bench", "post"].forEach(wh => { L.lockerMenu(wh); LAB.ui.top().items.forEach(lbl); LAB.ui.closeAll(); });
    return out;
  });
  ok(r3.base, "ячейка: 40 кило и 10 мест");
  ok(r3.kgLimit && r3.slotLimit, "предел веса и мест: лишнее не влезает, «Эхо» говорит почему");
  ok(r3.post === true && r3.bench === true, "ячейка открывается у пункта снабжения и у верстака (" + r3.post + ", " + r3.bench + ")");
  ok(r3.ladder, "ступени за кредиты: каждая следующая дороже");
  ok(r3.rent && r3.rentEnd && r3.overfull, "аренда на трое суток: дороже с размером и с каждой арендой; кончилась — вещи целы, класть нельзя");
  ok(r3.needMech && r3.craft, "у верстака: полки и дно, нужна ступень механики, детали растут");
  ok(r3.cards && r3.drops && r3.dropsCap, "ключ-карты: с машин ОКО, до пяти, лишние не падают");
  ok(r3.cha, "харизма 30 — четыре лишних места");
  ok(r3.relief, "запись прежней версии: лишнее уходит в ячейку, герой может идти");
  /* ── (после 4.6) находки проверки нелогичностей ── */
  console.log("Нелогичности: ключ-карта, выбросить батареи и каркас, аренда, практика, цены, плоды");
  const r4 = await page.evaluate(async () => {
    const g = LAB.game, C = LAB.combat, L = LAB.load, ST = LAB.stats, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const lbl = it => typeof it.label === "function" ? it.label() : it.label;
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; });
    const G = g.G; said();
    /* ключ-карта: видна в окне ячейки и применяется оттуда; лишнюю можно выбросить */
    G.inv.lockcard = 2; L.lockerMenu("capsule");
    const it = LAB.ui.top().items.find(i => /ключ-карте/.test(lbl(i)));
    out.cardItem = !!it; if (it) it.fn(); out.cardUsed = L.locker().cards === 1 && G.inv.lockcard === 1;
    LAB.ui.closeAll();
    out.cardDrop = g.dropWhy("lockcard") === "" && g.dropItem("lockcard", 1) && !(G.inv.lockcard > 0);
    /* батареи и каркас — в окне «Выбросить вещь», с весом; выброшенный каркас поднимается обратно */
    G.ammo.energy = 6;
    const grs = g.dropGroups(), ga = grs.find(q => q.kind === "ammo" && q.key === "energy");
    out.ammoRow = !!ga && ga.max === 6 && ga.wt > 0;
    out.ammoDrop = g.dropGroup("ammo", "energy", 4) && G.ammo.energy === 2;
    const fr = { id: "frT", cls: "mid", qual: 2, en: 0, plates: [] }; G.frames = G.frames || []; G.frames.push(fr);
    const gf = g.dropGroups().find(q => q.kind === "frame" && q.ids[0] === "frT");
    out.frameRow = !!gf && gf.max === 1;
    g.dropGroup("frame", gf.key, 1); out.frameGone = !G.frames.some(f => f.id === "frT");
    const fs = g.CUR.fs, d = (fs.drops || []).find(q => q.kind === "frame" && q.f.id === "frT");
    if (d) { G.x = d.x; G.y = d.y; g.autoPickup(); }
    out.frameBack = G.frames.some(f => f.id === "frT");
    /* надетый разряженный каркас — вполовину; заряженный — ничего */
    G.str = 20; G.con = 20; G.exoOn = "frT"; fr.en = 0;
    out.frameHalf = Math.abs(L.parts().frames - L.frameWt(fr) * 0.5) < 0.01;
    fr.en = 50; out.frameLive = L.parts().frames === 0;
    G.exoOn = null; G.frames = G.frames.filter(f => f.id !== "frT");
    /* аренда кончилась, ячейка переполнена: плата за хранение копится и списывается у ячейки */
    const lk = L.locker(); G.credits = 100000; L.rent(); G.inv.scrap = 200; L.putParts(); out.over0 = L.lockerWt();
    lk.rentUntil = 1; lk.feeAt = null; L.minutes(); said();
    G.day = (G.day || 1) + 2; L.minutes();
    out.debt = (lk.debt || 0) > 0;
    const c0 = G.credits; L.lockerMenu("capsule"); out.paid = G.credits < c0 && !(lk.debt > 0) && /За хранение сверх предела списано/.test(said()); LAB.ui.closeAll();
    lk.rentSaid = 0; L.minutes(); out.rentSaidOnce = /Аренда соседней ячейки кончилась/.test(said());
    lk.rentSaid = lk.rentUntil; L.minutes(); out.rentQuiet = !/Аренда соседней ячейки кончилась/.test(said());
    /* практика: убийство дроном героя не тренирует; своё — тренирует; торговля — по сумме */
    const S = ST.S(); S.day = {}; S.px = {};
    ST.deed("kill"); out.killAch = !(S.px.str > 0) && !(S.px.agi > 0);
    ST.deed("herokill", { kind: "mech" }); out.killHero = (S.px.str > 0 || S.px.agi > 0) && S.px.mind > 0;
    S.px.cha = 0; ST.deed("bought", 5); const small = S.px.cha; S.px.cha = 0; ST.deed("bought", 200); out.trade = small < S.px.cha;
    /* цена ячейки: на «Лёгком» дешевле, чем на «Очень сложном»; харизма на неё не влияет */
    const d0 = LAB.settings.difficulty; LAB.settings.difficulty = 4; const pEasy = L.upPrice(); LAB.settings.difficulty = 3; const pHard = L.upPrice(); /* 4 — «Лёгкий», 3 — «Очень сложный» */ LAB.settings.difficulty = d0;
    out.priceDiff = pEasy < pHard;
    G.cha = 10; const pc10 = L.upPrice(); G.cha = 35; out.priceCha = L.upPrice() === pc10; G.cha = 10;
    /* плод поднимает выше сорока, если предел выше: ниже Истока — до шестидесяти */
    G.str = 55; const maxF0 = G.maxF; G.maxF = Object.assign({}, G.maxF || {}, { 120: 1 });
    const P = LAB.plants && LAB.plants.st ? LAB.plants.st() : null;
    if (P) { P.fx = P.fx || {}; P.fx.str = { v: 3, until: 1e12 }; out.fruit = LAB.heroStat("str") === 58; delete P.fx.str; } else out.fruit = "нет";
    G.maxF = maxF0; G.str = 10;
    return out;
  });
  ok(r4.cardItem && r4.cardUsed && r4.cardDrop, "ключ-карта: применяется из окна ячейки, лишнюю можно выбросить");
  ok(r4.ammoRow && r4.ammoDrop, "батареи — в «Выбросить вещь», с весом; выбрасываются сколько нужно");
  ok(r4.frameRow && r4.frameGone && r4.frameBack, "каркас выбрасывается и поднимается обратно");
  ok(r4.frameHalf && r4.frameLive, "надетый разряженный каркас весит вполовину, заряженный — ничего");
  ok(r4.debt && r4.paid, "после аренды переполненная ячейка платная: долг копится и списывается у ячейки (в ячейке " + r4.over0 + ")");
  ok(r4.rentSaidOnce && r4.rentQuiet, "«аренда кончилась» — один раз, запись это помнит");
  ok(r4.killAch && r4.killHero && r4.trade, "практика — только за свои победы; торговля — по сумме сделки");
  ok(r4.priceDiff && r4.priceCha, "цена ячейки: на лёгком режиме дешевле; харизме безразлична");
  ok(r4.fruit === true, "плод поднимает характеристику и выше сорока, если предел выше (" + r4.fruit + ")");
  ok(!errors.length, "ошибок страницы нет" + (errors.length ? ": " + errors.slice(0, 3).join(" ; ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "ОШИБОК: " + fails : "ВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
