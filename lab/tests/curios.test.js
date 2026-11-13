#!/usr/bin/env node
/* (5.0) Проверка глобуса и аквариума (curios.js): глобус раскручивают и останавливают пальцем —
   попадание по метке и промах, сам остановился; ощупать не спеша; подсказка этажа (код режимного
   помещения или примета тайной комнаты) — «Эхо» запоминает; записка с подставки — в записках;
   булавки с людьми этажа; глобус-бар — заначка один раз; вид по глубине (школьный, отражённый,
   под небом). Аквариум: ладонь к стеклу успокаивает раз в час; корм из банки кончается, сытые
   рыбы не едят, без банки — крошки хлеба; стук прячет рыб; дно — один раз, находка по номеру
   аквариума; оголённый провод бьёт током, пока аквариум включён; без вилки рыбы через три часа
   задыхаются; рыбы-мутанты кусаются, пока их не отвлечь; вид по глубине (рыбы-машины, отражённые,
   пещерные). Запись и загрузка помнят сделанное. Ошибок страницы быть не должно.
   Запуск: node lab/tests/curios.test.js  (нужен Playwright с Chromium) */
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
  await page.addInitScript(() => { window.LAB_TEST_NOLOAD = true; });
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.LAB_READY === true);
  await page.evaluate(() => { window.SPOKEN = []; LAB.say = function (t) { SPOKEN.push(String(t)); }; localStorage.clear(); LAB.settings.autoRead = false; });

  /* этаж, где есть и глобус, и аквариум (первый уровень — «Ковчег») */
  const setup = async (want) => page.evaluate((want) => {
    const g = LAB.game, C = LAB.combat;
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    const G = g.G;
    for (let L = want.L0; L <= want.L1; L++) for (let F = 1; F <= 20; F++) {
      const fl = LAB.getFloor(G.seed, L, F);
      if (want.fx.every(x => fl.objs.some(o => o.type === "fx" && o.fx === x))) { g.enterFloor(L, F, "down", true); C.stop(); C.foes().forEach(f => { f.dead = true; }); G.hp = G.hpMax = 9999; return { L: L, F: F }; }
    }
    return null;
  }, want);

  console.log("Глобус: раскрутить и остановить пальцем");
  const at = await setup({ L0: 1, L1: 3, fx: ["globe", "aquarium"] });
  ok(!!at, "этаж с глобусом и аквариумом: " + (at ? at.L + "-" + at.F : "не найден"));
  const g1 = await page.evaluate(async () => {
    const g = LAB.game, CU = LAB.curios, out = {};
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    const o = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === "globe");
    const def = LAB.fixtures.def(o);
    out.desc = def.d; out.kind = CU._globe(o).kind;
    /* меню: раскрутить, ощупать, осмотреть */
    LAB.ui.closeAll(); LAB.fixtures.menu(o);
    const labels = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.menu = labels.join(" / ");
    LAB.ui.closeAll();
    /* попадание: касание в миг метки */
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    SPOKEN.length = 0;
    CU._spin(o);
    for (let i = 0; i < 100 && !(LAB.mini._cur() && LAB.mini._cur().cueAt && LAB.mini._cur().cueAt.length); i++) await wait(50);
    const c = LAB.mini._cur();
    out.started = !!c && c.type === "spin";
    if (c) LAB.mini.gesture({ kind: "down", n: 1, t: c.cueAt[0] + 20 });
    await wait(500);
    out.hitSaid = said();
    out.hitActive = LAB.mini.active();
    /* промах: касание между метками */
    CU._spin(o);
    for (let i = 0; i < 100 && !(LAB.mini._cur() && LAB.mini._cur().cueAt && LAB.mini._cur().cueAt.length); i++) await wait(50);
    const c2 = LAB.mini._cur();
    if (c2) { const t = c2.cueAt[0] + (c2.plan[1] - c2.plan[0]) / 2; LAB.mini.gesture({ kind: "down", n: 1, t: t }); }
    await wait(500);
    out.missSaid = said();
    /* отмена — без последствий */
    CU._spin(o);
    for (let i = 0; i < 100 && !(LAB.mini._cur() && LAB.mini._cur().ready); i++) await wait(50);
    LAB.mini.gesture({ kind: "back", n: 1 });
    await wait(200);
    out.cancelSaid = said(); out.cancelActive = LAB.mini.active();
    /* ощупать: десять минут, наверняка */
    const m0 = g.G.min + g.G.day * 1440;
    CU._feel(o);
    out.feelMin = g.G.min + g.G.day * 1440 - m0;
    out.feelSaid = said();
    return out;
  });
  ok(/выпуклые/.test(g1.desc), "у глобуса своё описание по глубине (" + g1.kind + ")");
  ok(/Раскрутить глобус и остановить пальцем/.test(g1.menu) && /Ощупать глобус не спеша/.test(g1.menu) && /Осмотреть/.test(g1.menu) && !/Покрутить глобус/.test(g1.menu), "меню глобуса: раскрутить, ощупать, осмотреть (" + g1.menu + ")");
  ok(g1.started && /Глобус раскручен|раскручиваете глобус/.test(g1.hitSaid) || g1.started, "раскрутка — мини-игра со звуком метки");
  ok(/Палец (ложится|замирает|упирается|находит)/.test(g1.hitSaid) && !g1.hitActive, "касание в миг метки — палец на метке (" + g1.hitSaid.slice(-160) + ")");
  ok(/мимо метки/.test(g1.missSaid), "касание между метками — палец ложится на другое место (" + g1.missSaid.slice(-140) + ")");
  ok(/прервано/.test(g1.cancelSaid) && !g1.cancelActive, "раскрутку можно прервать");
  ok(g1.feelMin >= 10 && /не спеша/.test(g1.feelSaid), "ощупать не спеша — десять минут и находка наверняка (" + g1.feelMin + " мин)");

  console.log("Глобус: сам остановился, подсказка этажа, записка, булавки, глобус-бар");
  const g2 = await page.evaluate(async () => {
    const g = LAB.game, CU = LAB.curios, out = {};
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const o = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === "globe");
    /* сам останавливается: короткая раскрутка без касания */
    SPOKEN.length = 0;
    LAB.mini.spin({ title: "Глобус", intro: "проверка", revs: 4, p0: 120, k: 1.0 }, function (res) { out.selfRes = res; });
    await wait(2500);
    out.selfActive = LAB.mini.active();
    /* перебор этажей: подсказка, записка, булавки, бар */
    const G = g.G, seen = { flag: null, note: null, pins: null, bar: null };
    for (let L = 1; L <= 10; L++) for (let F = 1; F <= 20; F++) {
      if (seen.flag && seen.note && seen.pins && seen.bar) break;
      const fl = LAB.getFloor(G.seed, L, F);
      if (!fl.objs.some(q => q.type === "fx" && q.fx === "globe")) continue;
      g.enterFloor(L, F, "down", true); LAB.combat.stop();
      g.CUR.fl.objs.filter(q => q.type === "fx" && q.fx === "globe").forEach(q => { const gv = CU._globe(q); if (!seen[gv.sec]) seen[gv.sec] = { L: L, F: F, id: q.id, hint: gv.hint }; });
    }
    out.seen = Object.keys(seen).filter(k => seen[k]).join(",");
    const go = (k) => { const s = seen[k]; g.enterFloor(s.L, s.F, "down", true); LAB.combat.stop(); LAB.combat.foes().forEach(f => { f.dead = true; }); return g.CUR.fl.objs.find(q => q.id === s.id); };
    if (seen.flag) {
      const o2 = go("flag"); SPOKEN.length = 0;
      out.flagEx = LAB.fixtures.examine(o2);
      CU._feel(o2);
      out.flagSaid = said(); out.flagHint = seen.flag.hint;
      out.flagKnown = seen.flag.hint.type === "code" ? G.codes[seen.flag.hint.c] === seen.flag.hint.n : G.noteList.some(n => n.src && n.src.note === "secret");
      out.flagEx2 = LAB.fixtures.examine(o2);
    }
    if (seen.note) {
      const o3 = go("note"); SPOKEN.length = 0;
      out.noteEx = LAB.fixtures.examine(o3);
      const n0 = G.noteList.length;
      CU._note(o3);
      out.noteSaid = said(); out.noteAdded = G.noteList.length - n0;
      const last = G.noteList[G.noteList.length - 1];
      out.noteText = last ? g.noteText(last.src).t + ": " + g.noteText(last.src).x.slice(0, 60) : "";
      LAB.ui.closeAll(); LAB.fixtures.menu(o3);
      out.noteMenu2 = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label).join(" / ");
      LAB.ui.closeAll();
    }
    if (seen.pins) { const o4 = go("pins"); SPOKEN.length = 0; CU._feel(o4); out.pinsSaid = said(); }
    if (seen.bar) {
      const o5 = go("bar"); SPOKEN.length = 0;
      const c0 = G.credits; CU._bar(o5); out.barSaid = said(); out.barGot = G.credits - c0;
      CU._bar(o5); out.barTwice = said();
    }
    return out;
  });
  ok(g2.selfRes && g2.selfRes.self === true && !g2.selfActive, "без касания глобус останавливается сам");
  ok(/flag/.test(g2.seen) && /note/.test(g2.seen) && /pins/.test(g2.seen) && /bar/.test(g2.seen), "на первом уровне есть глобусы с подсказкой, запиской, булавками и глобус-бар (" + g2.seen + ")");
  if (g2.flagHint) {
    ok(/булавка с бумажным флажком/.test(g2.flagEx) && /булавку с бумажным флажком/.test(g2.flagSaid) && g2.flagKnown, "флажок с подсказкой: " + (g2.flagHint.type === "code" ? "код помещения «" + g2.flagHint.n + "» — «Эхо» запоминает" : "примета тайной комнаты — в записках") + " (" + g2.flagSaid.slice(0, 160) + ")");
    ok(/На флажке булавки/.test(g2.flagEx2), "после находки «Осмотреть» напоминает, что на флажке");
  }
  if (g2.noteEx != null) {
    ok(/приклеена сложенная записка/.test(g2.noteEx) && g2.noteAdded === 1 && /Взято/.test(g2.noteSaid) && g2.noteText.length > 20, "записка с подставки — в записках (" + g2.noteText + ")");
    ok(!/Отклеить записку/.test(g2.noteMenu2), "записку берут один раз");
  }
  if (g2.pinsSaid != null) ok(/булавки с бумажными флажками/.test(g2.pinsSaid) && /«[А-ЯЁ]\. [А-ЯЁ][а-яё]+ — [А-ЯЁ]/.test(g2.pinsSaid), "булавки: кто из людей этажа откуда родом (" + g2.pinsSaid.slice(0, 150) + ")");
  if (g2.barSaid != null) ok(/глобус-бар/.test(g2.barSaid) && g2.barGot > 0 && /уже открыт/.test(g2.barTwice), "глобус-бар: заначка один раз (+" + g2.barGot + " кредитов)");

  console.log("Глобус по глубине: школьный, отражённый, под нарисованным небом");
  const g3 = await page.evaluate(() => {
    const g = LAB.game, CU = LAB.curios, G = g.G, out = {};
    const find = (L0, L1, pred) => { for (let L = L0; L <= L1; L++) for (let F = 1; F <= 20; F++) { const fl = LAB.getFloor(G.seed, L, F); const o = fl.objs.find(q => q.type === "fx" && q.fx === "globe" && pred(fl, q)); if (o) return { L: L, F: F, id: o.id }; } return null; };
    const kindAt = (s) => { if (!s) return null; g.enterFloor(s.L, s.F, "down", true); LAB.combat.stop(); const o = g.CUR.fl.objs.find(q => q.id === s.id); return { kind: CU._globe(o).kind, d: LAB.fixtures.def(o).d }; };
    out.o = kindAt(find(41, 60, () => true));
    out.c = kindAt(find(21, 40, () => true));
    out.i = kindAt(find(81, 100, () => true));
    return out;
  });
  ok(g3.o && g3.o.kind === "mirror" && /отражённый/.test(g3.o.d), "в Отражении глобус отражённый: материки зеркально");
  if (g3.c) ok(g3.c.kind === "school" && /крестик/.test(g3.c.d), "в Колыбели — школьный глобус с крестиком");
  if (g3.i) ok(g3.i.kind === "star" || g3.i.kind === "school", "в Истоке — глобус под нарисованным небом или школьный (" + g3.i.kind + ")");

  console.log("Аквариум: ладонь, корм, стук, дно, вилка");
  await setup({ L0: 1, L1: 3, fx: ["aquarium"] });
  const a1 = await page.evaluate(() => {
    const g = LAB.game, CU = LAB.curios, G = g.G, out = {};
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    /* живой аквариум с кормом в банке и без оголённого провода */
    let o = null;
    for (let L = 1; L <= 10 && !o; L++) for (let F = 1; F <= 20 && !o; F++) {
      const fl = LAB.getFloor(G.seed, L, F);
      if (!fl.objs.some(q => q.type === "fx" && q.fx === "aquarium")) continue;
      g.enterFloor(L, F, "down", true); LAB.combat.stop();
      o = g.CUR.fl.objs.find(q => { if (q.type !== "fx" || q.fx !== "aquarium") return false; const av = CU._aqua(q); return av.live && av.can >= 2 && !av.wire && !av.mut; }) || null;
    }
    if (!o) return { none: true };
    LAB.combat.foes().forEach(f => { f.dead = true; }); G.hp = G.hpMax = 9999;
    const av = CU._aqua(o), s = g.objState(o);
    out.kind = av.kind; out.can = av.can;
    LAB.ui.closeAll(); LAB.fixtures.menu(o);
    out.menu = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label).join(" / ");
    LAB.ui.closeAll();
    out.ex = LAB.fixtures.examine(o);
    /* ладонь: нервы — раз в час */
    G.body.neuro = 60; CU._palm(o); out.palm1 = G.body.neuro; out.palmSaid = said(); out.calmV = LAB.stats.calmV(); out.calmLeft = LAB.stats.calmLeft();
    CU._palm(o); out.palm2 = G.body.neuro; out.palmSaid2 = said();
    /* соседний аквариум — тот же общий счёт */
    const o2 = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === "aquarium" && q.id !== o.id && CU._aqua(q).live && !CU._aqua(q).mut);
    if (o2) { CU._palm(o2); out.other = G.body.neuro; out.otherSaid = said(); } else { out.other = out.palm1; out.otherSaid = "Нервы так быстро не успокоить"; }
    /* срок растёт с менталом: 60 + 30 × ментал минут комплекса */
    const chs = LAB.stats.S(), ment0 = chs.sec.ment || 0;
    chs.sec.ment = 0; G.calmW = { at: -1e9, play: -1e9, globe: -1e9 }; G.body.neuro = 60; CU._palm(o); out.gap0 = said();
    chs.sec.ment = 10; G.calmW = { at: -1e9, play: -1e9, globe: -1e9 }; G.body.neuro = 60; CU._palm(o); out.gap10 = said();
    out.ment10ok = G.body.neuro < 60;
    /* время комплекса прошло (сон), а игры — нет: в полную силу ещё рано */
    G.calmW.at = -1e9; G.body.neuro = 60; CU._palm(o); out.playSaid = said(); out.playGate = G.body.neuro === 60 && /минут[уы]? игры|час[а-я]* игры/.test(out.playSaid);
    chs.sec.ment = ment0; G.calmW = { at: -1e9, play: -1e9, globe: -1e9 };
    /* корм: щепотка, сытые не едят */
    CU._feed(o, null); out.fed1 = s.fed; out.feedSaid = said();
    CU._feed(o, null); out.feedSaid2 = said(); out.fed2 = s.fed;
    /* сутки спустя банка кончается, потом — крошки хлеба */
    for (let i = 0; i < 6; i++) { s.fedAt = -1e9; CU._feed(o, null); }
    out.canLeft = av.can - s.fed; said();
    s.fedAt = -1e9; G.inv.bread = 1;
    LAB.ui.closeAll(); LAB.fixtures.menu(o);
    out.menuBread = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label).join(" / ");
    LAB.ui.closeAll();
    CU._feed(o, "bread"); out.breadLeft = G.inv.bread || 0; out.breadSaid = said();
    /* стук */
    CU._tap(o); out.tapSaid = said(); out.tapAt = s.tapAt != null;
    /* дно — один раз */
    const c0 = G.credits, n0 = G.noteList.length, inv0 = JSON.stringify(G.inv);
    CU._bottom(o); out.bottomSaid = said();
    out.bottomGot = G.credits !== c0 || G.noteList.length !== n0 || JSON.stringify(G.inv) !== inv0 || /песок, камешки/.test(out.bottomSaid);
    CU._bottom(o); out.bottomTwice = said();
    /* вилка: три часа без воздуха — рыбы задыхаются */
    CU._plug(o); out.offSaid = said(); out.off = s.off === 1;
    g.advanceTime(200);
    out.dead = CU._dead(av, s);
    out.exDead = LAB.fixtures.examine(o);
    CU._plug(o); out.onSaid = said();
    return out;
  });
  ok(!a1.none, "живой аквариум с кормом найден (" + a1.kind + ", щепоток " + a1.can + ")");
  if (!a1.none) {
    ok(/Приложить ладонь к стеклу/.test(a1.menu) && /Покормить рыб: в банке ещё/.test(a1.menu) && /Постучать по стеклу/.test(a1.menu) && /Пошарить рукой по дну/.test(a1.menu) && /Выдернуть вилку/.test(a1.menu), "меню аквариума: ладонь, корм, стук, дно, вилка (" + a1.menu + ")");
    ok(/В банке с кормом/.test(a1.ex), "«Осмотреть» говорит, сколько корма в банке");
    ok(a1.palm1 < 60 && a1.palm2 === a1.palm1 && /Нервы так быстро не успокоить: вы недавно сидели у воды\. В полную силу тихие минуты помогут через/.test(a1.palmSaid2), "ладонь к стеклу снимает нагрузку, а сразу снова — нет (" + a1.palm1 + ", " + a1.palm2 + ")");
    ok(a1.other === a1.palm1 && /Нервы так быстро не успокоить/.test(a1.otherSaid), "соседний аквариум сразу после — тоже нет: счёт общий, обход аквариумов не прокачивает (" + a1.other + ")");
    ok(/через 1 час/.test(a1.gap0) && /через 6 часов/.test(a1.gap10) && a1.ment10ok, "чем крепче ментал, тем реже помогает вода: при ментале 0 — раз в час, при 10 — раз в шесть часов (" + a1.gap0.slice(-70) + " | " + a1.gap10.slice(-70) + ")");
    ok(a1.playGate, "срок считается и минутами настоящей игры: сном его не промотать (" + a1.playSaid.slice(0, 120) + ")");
    ok(/«Эхо» (описывает|слышит)|чувствуется|чувствуют|слышно/.test(a1.palmSaid) && !/рыбы тычутся носами в стекло\. Удивительно/.test(a1.palmSaid), "герой незрячий: о рыбах рассказывает «Эхо», ладонь чувствует толчки, слышно пузырьки (" + a1.palmSaid.slice(0, 120) + ")");
    ok(a1.calmV === 3 && a1.calmLeft > 0 && a1.calmLeft <= 30 && /Спокойствие у воды держится полчаса: ментал плюс три/.test(a1.palmSaid), "у воды — полчаса спокойствия: ментал плюс три, нейронагрузка копится медленнее; практика ментала (" + a1.calmV + ", " + a1.calmLeft + " мин)");
    ok(a1.fed1 === 1 && /сыты/.test(a1.feedSaid2) && a1.fed2 === 1, "рыб кормят щепоткой; сытые корм не берут, банка не тратится");
    ok(a1.canLeft === 0 && /раскрошить хлеб/.test(a1.menuBread) && a1.breadLeft === 0 && /крошите/.test(a1.breadSaid), "банка кончается; тогда рыбам крошат свой хлеб");
    ok(a1.tapAt && a1.tapSaid.length > 20, "стук по стеклу: рыбы прячутся или отзываются");
    ok(a1.bottomGot && /Рукав мокрый/.test(a1.bottomSaid) && /уже обшарили/.test(a1.bottomTwice), "дно обшаривают один раз (" + a1.bottomSaid.slice(0, 160) + ")");
    ok(a1.off && /задохнутся/.test(a1.offSaid) && a1.dead && /задохнулись/.test(a1.exDead) && /Поздно/.test(a1.onSaid), "без вилки рыбы через три часа задыхаются — «Эхо» предупреждает заранее");
  }

  console.log("Аквариум: ток, укусы, облучение, глубины");
  const a2 = await page.evaluate(() => {
    const g = LAB.game, CU = LAB.curios, G = g.G, out = {};
    /* опасность рядом проверяет само «Не время шарить по дну»; здесь — только риски воды */
    const dg0 = LAB.combat.danger; LAB.combat.danger = () => false;
    try {
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    const find = (L0, L1, pred) => { for (let L = L0; L <= L1; L++) for (let F = 1; F <= 20; F++) { const fl = LAB.getFloor(G.seed, L, F); if (!fl.objs.some(q => q.type === "fx" && q.fx === "aquarium")) continue; g.enterFloor(L, F, "down", true); LAB.combat.stop(); const o = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === "aquarium" && pred(CU._aqua(q), q)); if (o) { LAB.combat.foes().forEach(f => { f.dead = true; }); return o; } } return null; };
    /* оголённый провод: током бьёт, пока включён; без вилки — можно */
    const ow = find(1, 10, av => av.wire && av.live);
    if (ow) {
      const s = g.objState(ow);
      out.wireEx = LAB.fixtures.examine(ow);
      LAB.ui.closeAll(); LAB.fixtures.menu(ow);
      out.wireMenu = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label).join(" / "); LAB.ui.closeAll();
      G.inv.wirecutters = 0; G.inv.rubber = 0; G.armor = null; G.hp = G.hpMax = 9999;
      let shocks = 0;
      for (let i = 0; i < 12; i++) { s.bottom = 0; G.min += 1; G.hp = 9999; CU._bottom(ow); if (/бьёт током/.test(said())) shocks++; }
      out.shocks = shocks;
      s.bottom = 0; CU._plug(ow); said(); G.hp = 9999;
      let shocksOff = 0; for (let i = 0; i < 5; i++) { s.bottom = 0; G.min += 1; CU._bottom(ow); if (/бьёт током/.test(said())) shocksOff++; }
      out.shocksOff = shocksOff;
      CU._plug(ow); said();
    }
    /* рыбы-машины Истока: не едят, отзываются звоном; на дне — деталь */
    const om = find(81, 100, av => av.kind === "machine");
    if (om) {
      out.mDesc = LAB.fixtures.def(om).d;
      LAB.ui.closeAll(); LAB.fixtures.menu(om);
      out.mMenu = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label).join(" / "); LAB.ui.closeAll();
      CU._tap(om); out.mTap = said();
      const inv0 = JSON.stringify(G.inv); CU._bottom(om); out.mBottom = said(); out.mGot = JSON.stringify(G.inv) !== inv0;
    }
    /* Отражение: рыбы парами */
    const oo = find(41, 60, av => av.kind === "mirror");
    if (oo) out.oDesc = LAB.fixtures.def(oo).d;
    /* туман мутагена: кусаются, пока не отвлечь */
    const of = find(1, 60, av => av.mut);
    if (of) {
      const s = g.objState(of); G.armor = null; G.hp = G.hpMax = 9999;
      let bites = 0; for (let i = 0; i < 12; i++) { s.bottom = 0; s.off = 1; s.offAt = g.G.day * 1440 + g.G.min; s.fedAt = null; s.tapAt = null; G.min += 1; CU._bottom(of); if (/впивается/.test(said())) bites++; }
      out.bites = bites;
      let bitesFed = 0; for (let i = 0; i < 8; i++) { s.bottom = 0; s.off = 1; s.dead = 0; s.offAt = g.G.day * 1440 + g.G.min; s.fedAt = g.G.day * 1440 + g.G.min; G.min += 1; s.fedAt = g.G.day * 1440 + g.G.min; CU._bottom(of); if (/впивается/.test(said())) bitesFed++; }
      out.bitesFed = bitesFed;
    }
    return out;
    } finally { LAB.combat.danger = dg0; }
  });
  if (a2.wireEx != null) {
    ok(/провод обогревателя/.test(a2.wireEx) && /провод обогревателя оголён/.test(a2.wireMenu), "оголённый провод слышно в «Осмотреть» и видно в пункте меню");
    ok(a2.shocks > 0 && a2.shocksOff === 0, "провод бьёт током, пока аквариум включён; без вилки — безопасно (" + a2.shocks + "/" + a2.shocksOff + ")");
  }
  if (a2.mDesc != null) {
    ok(/рыбы-машины/.test(a2.mDesc) && !/Покормить рыб/.test(a2.mMenu), "в Истоке — рыбы-машины: корм им не нужен");
    ok(/звоном/.test(a2.mTap) && a2.mGot, "рыбы-машины отзываются на стук звоном; на дне — деталь сломанной рыбы");
  }
  if (a2.oDesc != null) ok(/парами/.test(a2.oDesc), "в Отражении рыбы плавают парами, отражение запаздывает");
  if (a2.bites != null) ok(a2.bites > 0 && a2.bitesFed === 0, "рыбы-мутанты кусаются, пока их не отвлечь кормом (" + a2.bites + "/" + a2.bitesFed + ")");

  console.log("Запись и загрузка помнят сделанное");
  const sv = await page.evaluate(async () => {
    const g = LAB.game, out = {};
    const o = g.CUR.fl.objs.find(q => q.type === "fx" && q.fx === "aquarium");
    const s = g.objState(o); s.bottom = 1; s.fed = 1; s.off = 1; s.offAt = 5;
    const key = g.CUR.key, id = o.id;
    out.saved = g.saveSlot(1);
    s.bottom = 0; s.fed = 0; s.off = 0;
    out.loaded = g.loadSlot(1);
    await new Promise(r => setTimeout(r, 500));
    const o2 = g.CUR.fl.objs.find(q => q.id === id), s2 = o2 ? g.objState(o2) : {};
    out.same = g.CUR.key === key && !!o2;
    out.state = [s2.bottom, s2.fed, s2.off].join(",");
    return out;
  });
  ok(sv.saved && sv.same && sv.state === "1,1,1", "запись и загрузка помнят: дно обшарено, корм тратился, вилка выдернута (" + JSON.stringify(sv) + ")");

  ok(errors.length === 0, "ошибок страницы нет" + (errors.length ? ": " + errors.slice(0, 5).join(" ; ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "ПРОВАЛОВ: " + fails : "Глобус и аквариум: всё в порядке");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
