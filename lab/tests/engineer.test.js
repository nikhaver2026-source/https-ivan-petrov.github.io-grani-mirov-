#!/usr/bin/env node
/* (после 4.6) Проверка инженерного дела: мастерство, тщательная работа, качество и брак,
   испытание, изучение устройства, своё оружие (конструктор, ресурс ствола, сердечник,
   перебор узла), регулятор мощности, ядро в оружии, экзокаркас, дрон-спутник, запись и
   загрузка. Запуск: node lab/tests/engineer.test.js  (нужен Playwright с Chromium) */
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

  console.log("Инженерное дело: мастерство, качество, брак, испытание, изучение");
  const r1 = await page.evaluate(async () => {
    const g = LAB.game, W = LAB.workshop, C = LAB.combat, M = LAB.mastery, out = {};
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    C.stop(); LAB.ui.closeAll(); g.newGame(); C.stop(); LAB.ui.closeAll();
    g.enterFloor(2, 3, "down", true); C.stop();
    C.foes().forEach(f => { f.dead = true; });
    let G = g.G; G.event = "norm"; G.eventUntil = G.min + 100000; G.hp = G.hpMax = 9999;
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench");
    if (!wb) return { noBench: true };
    G.x = wb.x; G.y = wb.y;
    for (const k of LAB.PARTS) G.inv[k] = 40;
    const b = W.bench(wb); b.tier = 3; b.dmg = false; b.spec = "";
    LAB.ui.craft(wb);
    const root = LAB.ui.top().items.map(i => typeof i.label === "function" ? i.label() : i.label);
    out.rootMode = root.some(l => /^Режим работы/.test(l));
    out.rootLine = root.some(l => /^Мастерство: общая ступень 0/.test(l));
    out.rootEng = root.some(l => /^Инженерное дело/.test(l));
    out.rootTest = root.some(l => /^Испытать изделие/.test(l)) && root.some(l => /^Изучить устройство/.test(l));
    /* обычная работа: мгновенно, качество как прежде; опыт мастерства растёт */
    const rc = LAB.RECIPES.find(r => r.out === "weapon:baton" || r.id === "w_baton") || LAB.RECIPES.find(r => String(r.out).indexOf("weapon:") === 0 && !r.bp && !r.minL);
    out.rcName = rc && rc.n;
    const m0 = G.min, x0 = M.M().xp.mech + M.M().xp.enrg;
    g.craft(rc);
    out.instant = G.min === m0;
    out.xpUp = M.M().xp.mech + M.M().xp.enrg > x0;
    const w1 = G.weapons[G.weapons.length - 1];
    out.mk = w1.mk === 1;
    /* тщательная работа: время идёт, бодрость падает, опыт в полтора раза больше */
    M.M().mode = 1; const m1 = G.min, wk1 = G.body.wake;
    g.craft(rc);
    out.carefulTime = G.min > m1;
    out.carefulWake = G.body.wake < wk1;
    /* под огнём тщательной работы нет */
    const dz = C.danger; C.danger = () => true;
    out.blockDanger = /рядом враг/.test(M.before(rc));
    C.danger = dz;
    M.M().mode = 0;
    /* прогноз — с третьей ступени */
    out.noForecast = !M.forecast(rc, b);
    M.M().xp.mech = 200; M.M().xp.enrg = 200;
    out.forecast = /Прогноз/.test(M.forecast(rc, b));
    /* брак: испытание находит, устранение убирает */
    const w2 = G.weapons[G.weapons.length - 1];
    w2.flaw = { k: "trigger", seen: 0, n: 0 };
    said();
    out.test = M.testItem(w2, "w") && /брак/.test(said()) && w2.flaw.seen === 1;
    out.fix = M.fixFlaw(w2) && !w2.flaw;
    /* люфт спуска даёт осечки */
    w2.flaw = { k: "trigger", seen: 0, n: 0 };
    let mf = 0; for (let i = 0; i < 400; i++) if (M.misfire(w2)) mf++;
    out.misfire = mf > 5 && w2.flaw.seen === 1;
    delete w2.flaw;
    /* изучение: три экземпляра гаусс-винтовки — вид изучен, открыты рельсовое ружьё и спиральный ствол */
    M.M().xp.ident = 0;
    for (let i = 0; i < 3; i++) G.weapons.push(LAB.makeWeapon("gauss", 5, 1, 2));
    const gs = G.weapons.filter(w => w.base === "gauss");
    M.study(gs[0], false); M.study(gs[1], false);
    out.studyHalf = !M.M().known["w:gauss"];
    said();
    M.study(gs[2], false);
    const st = said();
    out.studied = !!M.M().known["w:gauss"] && LAB.forge.F().unl.rail === 1 && LAB.forge.F().node.spiral === 1 && /рельсовое ружьё/.test(st);
    out.restudy = !M.study(gs[0], false);
    /* специализация на третьей общей ступени */
    M.M().xp.design = 300;
    out.specFree = M.specFree() >= 1;
    M.M().spec.push("arms");
    out.specHas = M.has("arms");
    out.charLine = /Мастерство: общая ступень/.test(g.characterText().join(" "));
    return out;
  });
  if (r1.noBench) ok(false, "на этаже 2-3 нет верстака"); else {
    ok(r1.rootMode && r1.rootLine && r1.rootEng && r1.rootTest, "в окне мастерской: режим работы, мастерство, испытание и изучение, инженерное дело");
    ok(r1.instant && r1.xpUp && r1.mk, "обычная работа: мгновенно, собранное помечено своим, опыт мастерства растёт (" + r1.rcName + ")");
    ok(r1.carefulTime && r1.carefulWake, "тщательная работа: идёт игровое время и падает бодрость");
    ok(r1.blockDanger, "под огнём тщательной работы нет");
    ok(r1.noForecast && r1.forecast, "прогноз качества и брака — с третьей ступени направления");
    ok(r1.test && r1.fix, "испытание находит брак, у верстака его устраняют");
    ok(r1.misfire, "брак «люфт спуска» даёт осечки и называется вслух");
    ok(r1.studyHalf && r1.studied && r1.restudy, "изучение: три экземпляра — вид изучен, открыты рельсовое ружьё и спиральный ствол; повтор не идёт");
    ok(r1.specFree && r1.specHas && r1.charLine, "специализация мастера на третьей общей ступени; строка в окне персонажа");
  }

  console.log("Своё оружие: конструктор, ресурс ствола, сердечник, перебор узла, мощность");
  const r2 = await page.evaluate(async () => {
    const g = LAB.game, Fg = LAB.forge, C = LAB.combat, M = LAB.mastery, out = {};
    let G = g.G;
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench"); const b = LAB.workshop.bench(wb); b.tier = 3;
    for (const k of LAB.PARTS) G.inv[k] = 40;
    const mind0 = G.mind, n0 = G.weapons.length;
    Fg.draft("rail").barrel = "spiral"; Fg.draft("rail").caps = "big";
    const w = Fg.build("rail", { name: "Струна" });
    out.built = !!w && G.weapons.length === n0 + 1 && w.own.fam === "rail" && /«Струна»/.test(w.name);
    out.mind = G.mind === mind0 + 1;
    out.stats = w.rng >= 13 && w.cdOwn === 1700 && w.barrel === 70 && LAB.weaponCd(w) === 1700;
    out.dmgVsGauss = w.dmg > LAB.makeWeapon("gauss", w.lvl, 1, 2).dmg;
    /* второй раз тот же экземпляр не даёт разума */
    const mind1 = G.mind; Fg.build("pike", { name: "Таран" }); out.mindOnce = G.mind === mind1;
    /* ресурс ствола: выработан — запасной ставится сам; нет запасного — не стреляет */
    w.barrel = 0; G.inv.kv_barrel = 1;
    out.swap = Fg.beforeShot(w, Date.now()) === "hot" && w.barrel === 70 && G.inv.kv_barrel === 0;
    w.barrel = 0; out.noBarrel = Fg.beforeShot(w, Date.now()) === "hot" && w.barrel === 0;
    w.barrel = 70;
    /* сердечник: останавливающий отбрасывает и сильнее по живым */
    w.own.nodes.slug = "stop"; Fg.apply(w);
    out.slug = w.knock === true && w.apierce < 0.2;
    w.own.nodes.slug = "ap"; Fg.apply(w);
    /* перебор узла: короткий ствол вместо спирального, версия 2, половина деталей назад */
    const sc0 = G.inv.ceramic;
    out.swapNode = Fg.swap(w, "barrel", "short") && w.own.v === 2 && w.rng === 9 && w.own.res === 60;
    /* мощность: форсаж — урон выше; экономно — ниже */
    const fakeF = { kind: "mech" };
    w.pwr = 1; const kHi = Fg.dmgK(w, fakeF); w.pwr = -1; const kLo = Fg.dmgK(w, fakeF); delete w.pwr;
    out.pwr = kHi > 1.2 && kLo < 0.85;
    out.pwrMenu = Fg.weaponExtra(G.weapons.find(x => x.base === "spark")).some(i => i.label === "Мощность");
    /* пика: заряд тратится на удар и пробивает броню */
    const pk = G.weapons.find(x => x.own && x.own.fam === "pike");
    G.inv.kv_hcharge = 2;
    const kc = Fg.dmgK(pk, fakeF);
    out.pike = kc > 3 && G.inv.kv_hcharge === 1 && Fg.pierceK(pk) > 0.5;
    Fg.onHit(pk, { kind: "mech", dead: true }, 1);
    out.pikeReset = Fg.pierceK(pk) === 0;
    /* энергоклинок: без заряда — тупая полоса */
    G.inv.cell = 5; G.inv.ceramic = 9; G.inv.wire = 9; G.inv.scrap = 20;
    M.M().xp.enrg = 200;
    const bl = Fg.build("blade", { name: "Коготь" });
    out.blade = !!bl && Fg.dryOk(bl);
    Fg.setDry(bl, true); out.dry = bl.dt === "kinetic" && Fg.dmgK(bl, fakeF) < 0.4;
    Fg.setDry(bl, false); out.wet = bl.dt === "energy";
    /* ядро: нейроядро с точностью и критом — растёт от побед */
    G.inv.kv_ncore = 1;
    const rnd = Math.random; Math.random = () => 0.01;
    out.core = Fg.implant(w, "n", ["acc", "crit"], { force: true, quiet: true }) && w.core && w.core.d.length === 2 && w.crit > 0;
    Math.random = rnd;
    for (let i = 0; i < 30; i++) Fg.onKill(w, { lvl: 20, kind: "mech" });
    out.coreGrow = w.core.lvl >= 3 && /ядро — ступень/.test(w.name);
    out.coreAcc = Fg.accK(w) > 0.06;
    /* голод: без побед ядро слабеет */
    w.core.fed = -10000; out.hungry = Fg.hungry(w);
    w.core.fed = (G.day - 1) * 1440 + G.min;
    out.weaponMenu = Fg.weaponExtra(w).some(i => /Нейроядро/.test(i.label)) && Fg.weaponExtra(w).some(i => /Ресурс ствола/.test(i.label));
    return out;
  });
  ok(r2.built && r2.mind && r2.stats, "рельсовое ружьё собрано: имя, спиральный ствол, большой блок, ресурс ствола; первая своя конструкция — разум плюс один");
  ok(r2.dmgVsGauss && r2.mindOnce, "своя конструкция сильнее гаусс-винтовки той же ступени; разум прибавляется один раз");
  ok(r2.swap && r2.noBarrel, "выработанный ствол меняется на запасной; без запасного — выстрела нет");
  ok(r2.slug && r2.swapNode, "сердечник переключается; перебор узла — версия 2 с новыми свойствами");
  ok(r2.pwr && r2.pwrMenu, "регулятор мощности: форсаж и экономный режим; переключатель в окне оружия на батареях");
  ok(r2.pike && r2.pikeReset, "кумулятивная пика: заряд на удар, пробивает броню");
  ok(r2.blade && r2.dry && r2.wet, "энергоклинок: без заряда — тупая полоса, с зарядом — энергия");
  ok(r2.core && r2.coreGrow && r2.coreAcc && r2.hungry && r2.weaponMenu, "ядро: директивы прижились, растёт от побед, голодает без них; видно в окне оружия");

  console.log("Экзокаркас и дрон-спутник, запись и загрузка");
  const r3 = await page.evaluate(async () => {
    const g = LAB.game, X = LAB.exo, Dr = LAB.drone, C = LAB.combat, out = {};
    let G = g.G;
    const said = () => { const s = SPOKEN.join(" | "); SPOKEN.length = 0; return s; };
    const wb = g.CUR.fl.objs.find(o => o.type === "workbench"); const b = LAB.workshop.bench(wb); b.tier = 4;
    for (const k of LAB.PARTS) G.inv[k] = 40;
    G.inv.lead = 4;
    const f = X.build("mid");
    out.built = !!f && X.frames().length === 1;
    X.upNode(f, "arms"); X.upNode(f, "arms"); X.upNode(f, "legs"); X.addPlate(f, "steel"); X.addPlate(f, "ceramic"); X.setMount(f, "turret"); X.setShield(f);
    out.nodes = f.arms === 2 && f.legs === 1 && f.plates.length === 2 && f.sh === "turret" && f.back === "shield";
    out.plateMax = !X.addPlate(f, "steel");
    G.str = 20;
    const def0 = g.armorValue();
    X.equip(f);
    out.worn = X.worn() === f && g.armorValue() > def0 && g.armorRes("energy") >= 0.05;
    out.melee = X.meleeK() > 1.25;
    out.heavyAcc = X.accK(LAB.makeWeapon("gauss", 5, 1, 2)) > 0;
    /* щит на спине гасит удары сзади */
    G.face = "N"; const back = { x: G.x, y: G.y + 2 }, front = { x: G.x, y: G.y - 2 };
    out.shield = X.onHurt(10, "phys", back) === 5 && X.onHurt(10, "phys", front) === 10;
    /* аккумулятор садится; сел — приводы не помогают; батарея подзаряжает */
    f.en = 0.01; X.onStep(true);
    out.dead = X.meleeK() === 1;
    G.ammo.energy = 2; out.charge = X.chargeBat(f) && f.en >= 60;
    out.char = /Каркас:/.test(g.characterText().join(" "));
    /* дрон: блок управления, сборка, модули */
    G.inv.kv_ctrl = 1;
    const d = Dr.build({ name: "Жук" });
    out.drone = !!d && Dr.has() && G.inv.kv_ctrl === 0;
    Dr.addMod("gun"); Dr.addMod("screen");
    out.slots = !Dr.addMod("arm") && d.mods.length === 2;
    /* экран берёт четверть урона */
    out.screen = Dr.onHurt(20, "phys", null) === 15 && d.hp < d.hpMax;
    /* опыт: десятая часть опыта героя */
    g.gainXP(300); out.dxp = d.lvl >= 2;
    /* сбит — чинится у верстака */
    Dr.hurt(9999); out.wreck = d.wreck === 1 && !Dr.active();
    out.repair = Dr.repair() && !d.wreck && d.hp > 0;
    /* огонь в бою: враг рядом — дрон бьёт */
    const foe = C.spawnFoe(Object.keys(LAB.FOES).find(k => LAB.FOES[k].kind === "mech" && !(LAB.FOES[k].beh || []).includes("camera") && !LAB.FOES[k].boss), G.x + 2, G.y);
    if (foe) {
      foe.state = "hunt"; const hp0 = foe.hp;
      const vis = C.visibleFoes; C.visibleFoes = r => [foe];
      const dz = C.danger; C.danger = () => true;
      for (let i = 0; i < 12; i++) Dr.tick();
      C.danger = dz; C.visibleFoes = vis;
      out.dfire = foe.hp < hp0 || foe.dead;
      foe.dead = true;
    } else out.dfire = "нет врага";
    /* запись и загрузка */
    g.saveSlot(3);
    const keep = { fr: JSON.stringify(G.frames), on: G.exoOn, dr: JSON.stringify(G.drone), mast: JSON.stringify(G.mast), own: G.weapons.filter(w => w.own).length };
    LAB.ui.closeAll(); g.loadSlot(3); C.stop(); LAB.ui.closeAll();
    G = g.G;
    out.saved = JSON.stringify(G.frames) === keep.fr && G.exoOn === keep.on && JSON.stringify(G.drone) === keep.dr && JSON.stringify(G.mast) === keep.mast && G.weapons.filter(w => w.own).length === keep.own;
    out.ownCd = G.weapons.filter(w => w.own).every(w => LAB.weaponCd(w) === w.cdOwn);
    return out;
  });
  ok(r3.built && r3.nodes && r3.plateMax, "каркас: сборка, приводы, накладки до предела класса, турель на плече, щит на спине");
  ok(r3.worn && r3.melee && r3.heavyAcc, "надетый каркас: защита и стойкость, удар сильнее, отдача тяжёлого оружия гасится");
  ok(r3.shield, "щит на спине гасит удар сзади вдвое, спереди — нет");
  ok(r3.dead && r3.charge && r3.char, "сел аккумулятор — прибавок нет; энергобатарея подзаряжает; строка в окне персонажа");
  ok(r3.drone && r3.slots, "дрон собран из блока управления; два гнезда для модулей");
  ok(r3.screen && r3.dxp && r3.wreck && r3.repair, "экран дрона берёт четверть урона; дрон растёт от опыта героя; сбитый чинится у верстака");
  ok(r3.dfire === true, "дрон со стволом бьёт врага в бою" + (r3.dfire !== true ? ": " + r3.dfire : ""));
  ok(r3.saved && r3.ownCd, "мастерство, своё оружие, каркас и дрон переживают запись и загрузку");

  const errs = errors.filter(e => !/favicon|ERR_FILE_NOT_FOUND|net::/.test(e));
  ok(!errs.length, "ошибок страницы нет" + (errs.length ? ": " + errs.slice(0, 5).join("; ") : ""));
  await browser.close(); server.close();
  console.log(fails ? "\nПРОВАЛОВ: " + fails : "\nВСЁ ХОРОШО");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
