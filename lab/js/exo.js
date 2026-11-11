/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — экзокаркас (после 4.6).
   По книге Эдуарда Полякова «Квази Эпсилон»: экзоскелет — это каркас,
   сервоприводы, аккумулятор и точки подвеса, а броня на нём — по желанию:
   снял броню — быстрее и дольше живёт батарея, но уязвим. Каркас — свой
   слот, он надевается вместе с бронёй. Классы: лёгкий (быстрый и тихий),
   средний, тяжёлый (сильный и шумный; нужна сила, иначе суставы
   перегружены). Узлы у верстака: приводы рук (удар сильнее, отдача
   тяжёлого оружия гасится), приводы ног (бег быстрее), аккумулятор,
   накладки (сталь, керамика, композит, свинец, сплав Нижних), на плечо —
   наплечная турель или СВЧ-раструб, на спину — ростовой щит. Приводы,
   турель, раструб и своё оружие на кабеле едят заряд аккумулятора; сел —
   каркас становится грузом. Подзарядка — энергобатареей или за кредиты
   у капсулы и зарядной станции. Изнашивается от ударов, чинится у верстака.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function menu(title, items, opts) { return LAB.ui.menu(title, items, opts); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
var lastSay = {};
function sayOnce(k, t, gap) { var n = Date.now(); if (lastSay[k] && n - lastSay[k] < (gap || 4000)) return; lastSay[k] = n; sayq(t); }
function snd(id, alt, o) { var S = LAB.SND || {}; A("play", S[id] ? id : (alt || id), o); }
function W() { return LAB.workshop; }
function MS() { return LAB.mastery; }
function step(k) { return MS() ? MS().step(k) : 0; }

var CLS = {
  light: { n: "лёгкий каркас", def: 1, arms: 1, legs: 2, plates: 1, drain: 0.8, str: 0, loud: -1, sh: false, tier: 2,
    need: { scrap: 6, servo: 2, wire: 2, cell: 1 }, d: "быстрый и тихий, почти без защиты; на плечо ничего не встаёт" },
  mid: { n: "средний каркас", def: 3, arms: 2, legs: 2, plates: 2, drain: 1, str: 11, con: 11, loud: 0, sh: true, tier: 3,
    need: { scrap: 8, servo: 4, panel: 2, magnet: 1, cell: 1, wire: 2 }, d: "ровный во всём; нужны сила 11 и телосложение 11" },
  heavy: { n: "тяжёлый каркас", def: 6, arms: 3, legs: 3, plates: 4, drain: 1.3, str: 14, con: 13, loud: 2, sh: true, tier: 4,
    need: { scrap: 10, servo: 6, panel: 4, powercell: 1, magnet: 2, supercond: 1 }, d: "сильный и шумный, держит удары; нужны сила 14 и телосложение 13" }
};
var CLS_ORDER = ["light", "mid", "heavy"];
var CAP = [0, 100, 160, 240];
var PLATES = {
  steel: { n: "стальная накладка", need: { scrap: 3 }, def: 2, res: { phys: 0.04 }, tier: 2 },
  ceramic: { n: "керамическая накладка", need: { ceramic: 2, scrap: 1 }, def: 1, res: { energy: 0.05, therm: 0.05, shock: 0.04 }, tier: 2 },
  composite: { n: "композитная накладка", need: { ceramic: 1, panel: 1, scrap: 1 }, def: 2, res: { phys: 0.025, energy: 0.025, therm: 0.025, shock: 0.025, chem: 0.025 }, tier: 3 },
  lead: { n: "свинцовая накладка", need: { lead: 2, scrap: 1 }, def: 1, res: { rad: 0.15 }, tier: 2 },
  alloy: { n: "накладка из сплава Нижних", need: { dp_alloy: 1 }, def: 4, res: { phys: 0.04, energy: 0.04, therm: 0.04, shock: 0.04 }, tier: 6 }
};
var PLATE_ORDER = ["steel", "ceramic", "composite", "lead", "alloy"];
var MOUNT = {
  turret: { n: "наплечная турель", need: { chip: 1, servo: 1, scrap: 3, optic: 1 }, tier: 3, d: "сама бьёт врагов в бою туда, куда вы повёрнуты; выстрел — полторы единицы заряда" },
  horn: { n: "СВЧ-раструб", need: { magnet: 3, cap: 2, wire: 2 }, tier: 3, d: "по команде глушит и ослепляет машины впереди; залп — пятнадцать единиц заряда" }
};

function X() { var g = G(); if (!g.frames) g.frames = []; return g.frames; }
function frames() { return X(); }
function worn() { var g = G(); if (!g.exoOn) return null; var f = X().filter(function (x) { return x.id === g.exoOn; })[0]; if (!f) g.exoOn = null; return f || null; }
function clsOf(f) { return CLS[f && f.cls] || CLS.light; }
function capOf(f) { return CAP[Math.max(1, Math.min(3, f.cell || 1))]; }
/* (после 4.6) каркасу нужны сила (приводы тянут суставы) и телосложение (кости держат вес и рывки), stats.js */
function hs(k) { return LAB.heroStat ? LAB.heroStat(k) : (G()[k] == null ? 10 : G()[k]); }
function strOk(f) { var c = clsOf(f); return (!c.str || hs("str") >= c.str) && (!c.con || hs("con") >= c.con); }
function lackText(f) {
  var c = clsOf(f), out = [];
  if (c.str && hs("str") < c.str) out.push("сила меньше нужных " + c.str + ": суставы перегружены");
  if (c.con && hs("con") < c.con) out.push("телосложение меньше нужных " + c.con + ": кости не держат вес и рывки приводов");
  return out.join("; ");
}
function live(f) { return !!f && (f.en || 0) > 0; }
function bonusK(f) { return strOk(f) ? 1 : 0.5; }
function condK(f) { var c = f.cond != null ? f.cond : 100; return c >= 50 ? 1 : 0.6 + 0.8 * c / 100; }
function frameName(f) { return (LAB.QUAL.m[f.qual == null ? 2 : f.qual] + " " + clsOf(f).n).replace(/^./, function (c) { return c.toUpperCase(); }); }

/* ════════ ДЕЙСТВИЕ КАРКАСА ════════ */
function drain(n, test) {
  var f = worn();
  if (!f || !(n > 0)) return false;
  if ((f.en || 0) < n) return false;
  if (test) return true;
  var e0 = f.en;
  f.en = Math.max(0, Math.round((f.en - n) * 100) / 100);
  lowWarn(f, e0);
  return true;
}
function lowWarn(f, e0) {
  var cp = capOf(f);
  if (e0 > cp * 0.15 && f.en <= cp * 0.15 && f.en > 0) { snd("exo_low", "w_power_low"); sayq("Аккумулятор каркаса почти пуст."); }
  if (e0 > 0 && f.en <= 0) { snd("exo_low", "w_power_low"); sayq("Аккумулятор каркаса сел: приводы встали, каркас теперь просто груз. Подзарядите энергобатареей или у капсулы."); }
}
/* шаг: приводы едят заряд; шум и темп бега */
function onStep(run) {
  var f = worn(); if (!f || !live(f)) return;
  var e0 = f.en, c = clsOf(f), k = c.drain * (strOk(f) ? 1 : 1.5);
  f.en = Math.max(0, Math.round((f.en - ((0.04 * ((f.arms || 0) + (f.legs || 0)) + 0.03 * (f.plates || []).length) * k * (run ? 1.4 : 1))) * 1000) / 1000);
  lowWarn(f, e0);
  /* сервоприводы слышны в ритме шагов: тяжёлый каркас — через шаг, прочие — реже и тише */
  stepN++;
  if ((f.arms || f.legs) && stepN % (c === CLS.heavy ? 2 : 4) === 0) snd(c === CLS.heavy ? "exo_servo_heavy" : "exo_servo", "repairbot_step", { gain: c === CLS.heavy ? 0.45 : 0.25 });
}
var stepN = 0;
function stepNoise(run) {
  var f = worn(); if (!f) return 0;
  var c = clsOf(f);
  if (c.loud > 0) return c.loud + (live(f) ? 0 : 1);
  if (c.loud < 0 && run && live(f) && (f.legs || 0) > 0) return -1;
  return 0;
}
function runGapK() { var f = worn(); return f && live(f) ? Math.max(0.7, 1 - 0.08 * (f.legs || 0) * bonusK(f)) : 1; }
function meleeK() {
  var f = worn(); if (!f || !live(f)) return 1;
  var k = 1 + (0.15 * (f.arms || 0) + (f.cls === "heavy" ? 0.1 : 0)) * bonusK(f);
  f.en = Math.max(0, (f.en || 0) - 0.6 * (f.arms || 0) * clsOf(f).drain);
  if ((f.arms || 0) > 0) snd(f.cls === "heavy" ? "exo_servo_heavy" : "exo_servo", "repairbot_step", { gain: 0.45 });
  return k;
}
var HEAVY_CLS = { positron: 1, gauss: 1, plasma: 1, magnetron: 1 };
function heavyW(w) { var b = w && LAB.WEAPONS[w.base]; return !!(b && HEAVY_CLS[b.cls] && (w.rng0 != null ? w.rng0 : w.rng) > 1); }
function accK(w) { var f = worn(); return f && live(f) && heavyW(w) ? 0.04 * (f.arms || 0) * bonusK(f) : 0; }
function defBonus() {
  var f = worn(); if (!f) return 0;
  var d = clsOf(f).def; (f.plates || []).forEach(function (p) { d += (PLATES[p] || {}).def || 0; });
  d *= LAB.QUAL_MULT[f.qual == null ? 2 : f.qual] * condK(f) * (MS() ? MS().defK(f) : 1);
  return Math.round(d);
}
function res(t) {
  var f = worn(); if (!f) return 0;
  var r = 0; (f.plates || []).forEach(function (p) { var pr = PLATES[p]; if (pr && pr.res[t]) r += pr.res[t]; });
  return r * condK(f);
}
/* Удар по герою: щит на спине гасит удары сзади; каркас изнашивается. */
var DIRV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
function onHurt(raw, adt, src) {
  var f = worn(); if (!f || !(raw > 0)) return raw;
  var g = G(), out = raw;
  if (f.back === "shield" && src && src.x != null) {
    var v = DIRV[g.face] || DIRV.N, dx = src.x - g.x, dy = src.y - g.y;
    if (dx * v[0] + dy * v[1] < 0) { out = raw * 0.5; snd("exo_shield", "shield_hit"); sayOnce("bshield", "Щит на спине принял удар сзади.", 12000); }
  }
  var wear = Math.min(2, 0.15 + raw * 0.03) * (MS() && MS().flawOf(f) && MS().flawOf(f).k === "play" ? 1.5 : 1);
  var c0 = f.cond != null ? f.cond : 100;
  f.cond = Math.max(0, Math.round((c0 - wear) * 100) / 100);
  if (c0 >= 50 && f.cond < 50) sayq("Каркас изношен: половина состояния, защита слабее. Почините его у верстака.");
  return out;
}
/* Такт: наплечная турель в бою. */
var tN = 0, hornCd = 0;
function tick() {
  tN++;
  if (hornCd > 0) hornCd--;
  var f = worn(), C = LAB.combat;
  if (!f || f.sh !== "turret" || !live(f) || !C || f.turretOff) return;
  if (tN % 5) return;
  if (!C.danger || !C.danger()) return;
  var g = G(), v = DIRV[g.face] || DIRV.N, best = null, bd = 99;
  C.visibleFoes(6).forEach(function (o) {
    if (o.dead || o.calm || o.ally || o.neutral || o.disguised || o.burrowed || o.phased) return;
    var dx = o.x - g.x, dy = o.y - g.y, along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
    if (along <= 0 || perp > 1) return;
    if (along < bd) { bd = along; best = o; }
  });
  if (!best) return;
  if ((f.en || 0) < 1.5) return;
  f.en = Math.max(0, f.en - 1.5);
  var lvl = LAB.foeLevel(g.L, g.F), dmg = Math.max(1, Math.round(5 * (1 + 0.14 * (lvl - 1)) * LAB.QUAL_MULT[f.qual == null ? 2 : f.qual] * bonusK(f)));
  snd("exo_turret", "w_blaster_s", { gain: 0.6 });
  C.damageFoe(best, dmg, "kinetic", { quiet: true, ally: true, by: "ally" });
}
/* СВЧ-раструб: залп по машинам впереди. */
function horn() {
  var f = worn(), C = LAB.combat, g = G();
  if (!f || f.sh !== "horn") { say("На плече каркаса нет СВЧ-раструба."); return false; }
  if (hornCd > 0) { say("Раструб остывает."); return false; }
  if (!drain(15, true)) { snd("exo_low", "w_empty"); say("Аккумулятору каркаса не хватает заряда на залп."); return false; }
  drain(15);
  hornCd = 40;
  snd("mw_hum", "mag_hum_short"); setTimeout(function () { snd("mw_fry", "w_shock_crack"); }, 350);
  var v = DIRV[g.face] || DIRV.N, n = 0, lvl = LAB.foeLevel(g.L, g.F);
  C.foes().forEach(function (o) {
    if (o.dead || o.calm || o.ally || o.kind !== "mech" || o.burrowed) return;
    var dx = o.x - g.x, dy = o.y - g.y, along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
    if (along <= 0 || along > 4 || perp > along) return;
    if (!LAB.los(gm().CUR.fl, gm().CUR.fs, g.x, g.y, o.x, o.y)) return;
    if (o.aff && o.aff.indexOf("hardened") >= 0) return;
    o.frozen = Math.max(o.frozen || 0, o.boss ? 2 : 6); o.blindT = Math.max(o.blindT || 0, 6);
    C.damageFoe(o, Math.max(1, Math.round(4 * (1 + 0.14 * (lvl - 1)))), "emp", { quiet: true });
    n++;
  });
  say(n ? "СВЧ-залп: машин впереди заглушено " + n + ". У них выгорели датчики на несколько секунд." : "СВЧ-залп ушёл впустую: машин впереди нет или они экранированы.");
  return true;
}

/* ════════ НАДЕТЬ, СНЯТЬ, ПОДЗАРЯДИТЬ ════════ */
function equip(f) {
  var g = G();
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Влезать в каркас в бою нельзя."); return false; }
  g.exoOn = f.id;
  snd("exo_on", "armor_on");
  var c = clsOf(f), warn = strOk(f) ? "" : " " + lackText(f).charAt(0).toUpperCase() + lackText(f).slice(1) + " — аккумулятор садится быстрее, прибавки вдвое меньше.";
  say("Каркас надет: " + line(f) + "." + warn);
  if (gm().UIx) gm().UIx("refresh");
  return true;
}
function unequip() {
  var g = G();
  if (!g.exoOn) { say("Каркаса на вас нет."); return false; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Вылезать из каркаса в бою нельзя."); return false; }
  g.exoOn = null; snd("exo_off", "armor_off"); say("Каркас снят.");
  return true;
}
function chargeBat(f) {
  var g = G(); f = f || worn();
  if (!f) { say("Каркаса нет."); return false; }
  var cp = capOf(f);
  if ((f.en || 0) >= cp) { say("Аккумулятор каркаса полон."); return false; }
  if (!(g.ammo.energy > 0)) { say("Энергобатарей нет."); return false; }
  g.ammo.energy--; f.en = Math.min(cp, (f.en || 0) + 60);
  snd("exo_charge", "w_reload_e");
  say("Каркас подзаряжен энергобатареей: " + Math.round(f.en) + " из " + cp + ".");
  return true;
}
function chargeFull(f) { f = f || worn(); if (f) f.en = capOf(f); }
/* Цена зарядки у капсулы и станции: как у энергобатареи за каждые шестьдесят единиц. */
function chargePrice(f) {
  var miss = capOf(f) - (f.en || 0); if (miss <= 0) return 0;
  var pb = LAB.medic && LAB.medic.vendPrice ? LAB.medic.vendPrice("ammo:energy") : 20;
  return Math.max(1, Math.round(pb * miss / 60));
}

/* ════════ СБОРКА И УЗЛЫ У ВЕРСТАКА ════════ */
function tierNow() { var w = W(), b = w && w.near ? w.near() : null; return b && w ? w.effTier(b) : 0; }
function lack(need) { var g = G(), s = []; for (var k in need) { var h = g.inv[k] || 0; if (h < need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + h + " из " + need[k]); } return s.join(", "); }
function canWork(tier, need) {
  if (tierNow() < tier) return "нужен верстак ступени " + tier + " и выше";
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) return "рядом враг";
  if (need && !W().haveAll(need)) return "не хватает: " + lack(need);
  return "";
}
function heavyTier() { return MS() && MS().M().known && MS().M().known["exo:heavy"] ? 3 : 4; }
function build(cls, opts) {
  opts = opts || {};
  var c = CLS[cls], g = G();
  var t = cls === "heavy" ? heavyTier() : c.tier;
  var why = canWork(t, c.need);
  if (why) { LAB.UI.error(); say(cap1(c.n) + ": " + why + "."); return null; }
  W().take(c.need);
  var mins = Math.max(6, Math.round(15 * (1 - 0.05 * step("mech"))));
  if (gm().advanceTime) gm().advanceTime(mins);
  if (g.body) g.body.wake = Math.max(0, g.body.wake - 6);
  var f = { id: "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), cls: cls, qual: 2, arms: 0, legs: 0, cell: 1, en: CAP[1], plates: [], sh: null, back: null, cond: 100, mk: 1, lvl: LAB.foeLevel(g.L, g.F) };
  var rc = { id: "exo_" + cls, n: c.n, out: "armor:exo", forge: "mech", cls: "own" };
  if (MS()) { f.qual = MS().rollQual(rc, 2, "x", W().near(), { dir: "mech", key: "exo:" + cls }); MS().maybeFlaw(f, MS().flawChance(rc, { cls: "own", base: 0.08, dir: "mech", key: "exo:" + cls }), true); }
  f.rcNeed = JSON.parse(JSON.stringify(c.need));
  f.name = frameName(f);
  X().push(f);
  var m = MS() ? MS().M() : null, xp = 12;
  if (m && !m.first["exo:" + cls]) { m.first["exo:" + cls] = 1; xp *= 3; }
  if (MS()) MS().gain("mech", xp);
  if (LAB.ach) LAB.ach.ev("craft", 1); /* ОКО слышит работу у верстака — как любую сборку */
  snd("work_weld", "craft"); if (gm().later) gm().later(function () { snd("work_ratchet", "craft_armor"); }, 900);
  say(cap1(c.n) + " собран за " + mins + " минут: " + frameName(f) + ". Аккумулятор заряжен. Узлы — приводы, накладки, подвес — ставятся здесь же, у верстака. Надеть — в инвентаре, раздел «Инженерное».");
  return f;
}
var NODE = {
  arms: { n: "привод рук", need: function (f) { return (f.arms || 0) >= 2 ? { servo: 2, wire: 1, magnet: 1 } : { servo: 2, wire: 1 }; }, tier: function (f) { return (f.arms || 0) >= 2 ? 3 : 2; }, max: function (f) { return clsOf(f).arms; }, cur: function (f) { return f.arms || 0; } },
  legs: { n: "привод ног", need: function () { return { servo: 2, scrap: 2 }; }, tier: function () { return 2; }, max: function (f) { return clsOf(f).legs; }, cur: function (f) { return f.legs || 0; } },
  cell: { n: "аккумулятор", need: function (f) { return (f.cell || 1) >= 2 ? { powercell: 1, wire: 2 } : { cell: 2, wire: 1 }; }, tier: function (f) { return (f.cell || 1) >= 2 ? 4 : 2; }, max: function () { return 3; }, cur: function (f) { return f.cell || 1; } }
};
function plateMax(f) { return clsOf(f).plates + (MS() && MS().has("armor") ? 1 : 0); }
function upNode(f, k) {
  var nd = NODE[k], cur = nd.cur(f);
  if (cur >= nd.max(f)) { say(cap1(nd.n) + ": предел этого каркаса."); return false; }
  var need = nd.need(f), why = canWork(nd.tier(f), need);
  if (why) { LAB.UI.error(); say(cap1(nd.n) + ": " + why + "."); return false; }
  W().take(need); addNeed(f, need);
  if (k === "arms") f.arms = cur + 1; else if (k === "legs") f.legs = cur + 1; else { f.cell = cur + 1; f.en = Math.min(capOf(f), (f.en || 0) + 40); }
  if (gm().advanceTime) gm().advanceTime(4);
  if (MS()) MS().gain("mech", 4);
  snd("work_ratchet", "craft");
  say(cap1(nd.n) + ": ступень " + nd.cur(f) + " из " + nd.max(f) + ". " + effectText(f));
  return true;
}
function addNeed(f, need) { if (!f.rcNeed) f.rcNeed = {}; for (var k in need) f.rcNeed[k] = (f.rcNeed[k] || 0) + need[k]; }
function addPlate(f, p) {
  var pl = PLATES[p];
  if ((f.plates || []).length >= plateMax(f)) { say("На этот каркас больше накладок не встанет: " + plateMax(f) + "."); return false; }
  var why = canWork(pl.tier, pl.need);
  if (why) { LAB.UI.error(); say(cap1(pl.n) + ": " + why + "."); return false; }
  W().take(pl.need); addNeed(f, pl.need);
  f.plates.push(p);
  if (gm().advanceTime) gm().advanceTime(3);
  if (MS()) MS().gain("mech", 3);
  snd("work_hammer", "craft_armor");
  say("Накладка поставлена: " + pl.n + ". " + effectText(f));
  return true;
}
function dropPlate(f) {
  if (!(f.plates || []).length) return false;
  var p = f.plates.pop(); G().inv.scrap = (G().inv.scrap || 0) + 1;
  snd("work_ratchet", "craft");
  say("Накладка снята: " + PLATES[p].n + ". Каркас легче — аккумулятор садится медленнее. Вернулся лом.");
  return true;
}
function setMount(f, k) {
  var mt = MOUNT[k];
  if (!clsOf(f).sh) { say("На лёгкий каркас на плечо ничего не встаёт."); return false; }
  if (f.sh === k) { say(cap1(mt.n) + " уже стоит."); return false; }
  var why = canWork(mt.tier, mt.need);
  if (why) { LAB.UI.error(); say(cap1(mt.n) + ": " + why + "."); return false; }
  W().take(mt.need); addNeed(f, mt.need);
  f.sh = k;
  if (gm().advanceTime) gm().advanceTime(5);
  if (MS()) MS().gain("elec", 5);
  snd("work_solder", "craft");
  say(cap1(mt.n) + " на плече: " + mt.d + ".");
  return true;
}
function setShield(f) {
  if (f.back === "shield") { say("Щит уже на спине."); return false; }
  var need = { scrap: 4, ceramic: 2, panel: 1 }, why = canWork(2, need);
  if (why) { LAB.UI.error(); say("Ростовой щит: " + why + "."); return false; }
  W().take(need); addNeed(f, need);
  f.back = "shield";
  if (gm().advanceTime) gm().advanceTime(5);
  if (MS()) MS().gain("mech", 4);
  snd("work_hammer", "craft_armor");
  say("Ростовой щит на спине: металл, керамика, металл — удары сзади он гасит вдвое.");
  return true;
}
function repairCost(f) { var miss = 100 - (f.cond != null ? f.cond : 100); if (miss < 1) return null; var n = { scrap: Math.max(1, Math.ceil(miss / 30)) }; if (miss > 50) n.servo = 1; return n; }
function repair(f) {
  var need = repairCost(f);
  if (!need) { say("Каркас исправен."); return false; }
  var why = canWork(2, need);
  if (why) { LAB.UI.error(); say("Ремонт каркаса: " + why + "."); return false; }
  W().take(need); f.cond = 100;
  if (gm().advanceTime) gm().advanceTime(4);
  if (MS()) MS().gain("mech", 3);
  snd("work_hammer", "craft_armor");
  say("Каркас починен: состояние 100 из 100.");
  return true;
}
function scrap(f) {
  var g = G();
  if (g.exoOn === f.id) { say("Сначала снимите каркас."); return false; }
  var back = {}, s = []; for (var k in (f.rcNeed || {})) { var n = Math.floor(f.rcNeed[k] / 2); if (n > 0) { back[k] = n; g.inv[k] = (g.inv[k] || 0) + n; s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + n); } }
  var i = X().indexOf(f); if (i >= 0) X().splice(i, 1);
  if (MS()) MS().ev("salvage");
  snd("work_ratchet", "pry");
  say("Каркас разобран. Вернулось: " + (s.join(", ") || "ничего ценного") + ".");
  return true;
}

/* ════════ СЛОВА ════════ */
function effectText(f) {
  var s = [];
  if (f.arms) s.push("удар сильнее на " + Math.round(((0.15 * f.arms) + (f.cls === "heavy" ? 0.1 : 0)) * 100) + "%, отдача тяжёлого оружия гасится");
  if (f.legs) s.push("бег быстрее");
  s.push("защита плюс " + previewDef(f));
  return cap1(s.join(", ")) + ".";
}
function previewDef(f) { var d = clsOf(f).def; (f.plates || []).forEach(function (p) { d += (PLATES[p] || {}).def || 0; }); return Math.round(d * LAB.QUAL_MULT[f.qual == null ? 2 : f.qual] * condK(f)); }
function line(f) {
  var c = clsOf(f), parts = [frameName(f)];
  parts.push("приводы рук " + (f.arms || 0) + " из " + c.arms + ", ног " + (f.legs || 0) + " из " + c.legs);
  parts.push("аккумулятор " + Math.round(f.en || 0) + " из " + capOf(f));
  parts.push((f.plates || []).length ? "накладки: " + f.plates.map(function (p) { return PLATES[p].n; }).join(", ") : "без накладок");
  if (f.sh) parts.push("на плече " + MOUNT[f.sh].n);
  if (f.back) parts.push("на спине ростовой щит");
  parts.push("защита плюс " + previewDef(f));
  if ((f.cond != null ? f.cond : 100) < 100) parts.push("состояние " + Math.round(f.cond) + " из 100");
  if (MS()) { var fl = MS().flawOf(f); if (fl && fl.seen) parts.push("брак: " + MS().FLAWS[fl.k].n); }
  return parts.join(", ");
}
function charLine() { var f = worn(); return f ? "Каркас: " + line(f) + (strOk(f) ? "." : ". " + lackText(f).charAt(0).toUpperCase() + lackText(f).slice(1) + ".") : ""; }

/* ════════ ОКНА ════════ */
function benchLabel(et) { var n = X().length; return "Каркас: сборка, узлы, накладки, ремонт" + (n ? " — каркасов " + n : ""); }
function benchMenu(et) {
  var build_ = function () {
    var items = CLS_ORDER.map(function (k) {
      var c = CLS[k], t = k === "heavy" ? heavyTier() : c.tier;
      return { label: "Собрать: " + c.n + " — " + c.d + ". Детали: " + W().costText(c.need) + (tierNow() < t ? ". Нужен верстак ступени " + t : ""), keep: true, fn: function () { build(k); } };
    });
    X().forEach(function (f) { items.push({ label: "Узлы: " + line(f), fn: function () { frameBench(f); } }); });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Каркас", build_(), { keep: true, rebuild: build_, intro: "Каркас надевается вместе с бронёй. Узлы — приводы, аккумулятор, накладки, подвес — ставятся здесь." });
}
function frameBench(f) {
  var build_ = function () {
    var items = [];
    ["arms", "legs", "cell"].forEach(function (k) {
      var nd = NODE[k], cur = nd.cur(f), mx = nd.max(f);
      items.push({ label: cap1(nd.n) + ": " + cur + " из " + mx + (cur < mx ? ". Поднять: " + W().costText(nd.need(f)) + (tierNow() < nd.tier(f) ? ", нужен верстак ступени " + nd.tier(f) : "") : ". Предел"), keep: true, fn: function () { upNode(f, k); } });
    });
    items.push({ label: "Накладки: " + (f.plates || []).length + " из " + plateMax(f) + ". Поставить ещё", fn: function () { plateMenu(f); } });
    if ((f.plates || []).length) items.push({ label: "Снять последнюю накладку — облегчить каркас", keep: true, fn: function () { dropPlate(f); } });
    if (clsOf(f).sh) Object.keys(MOUNT).forEach(function (k) { var mt = MOUNT[k]; items.push({ label: "На плечо: " + mt.n + (f.sh === k ? " — стоит" : ". " + mt.d + ". Детали: " + W().costText(mt.need)), keep: true, fn: function () { setMount(f, k); } }); });
    items.push({ label: "На спину: ростовой щит" + (f.back ? " — стоит" : ". Гасит удары сзади вдвое. Детали: лом 4, керамика 2, защитная панель 1"), keep: true, fn: function () { setShield(f); } });
    var rc = repairCost(f);
    if (rc) items.push({ label: "Починить каркас: " + W().costText(rc), keep: true, fn: function () { repair(f); } });
    items.push({ label: "Разобрать каркас: вернётся половина деталей", fn: function () { scrap(f); LAB.ui.closeTop && LAB.ui.closeTop(true); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu(frameName(f), build_(), { keep: true, rebuild: build_, intro: line(f) + "." });
}
function plateMenu(f) {
  var items = PLATE_ORDER.map(function (p) {
    var pl = PLATES[p], rs = []; for (var t in pl.res) rs.push((LAB.ATK_T[t] || (t === "rad" ? "радиация" : t)) + " " + Math.round(pl.res[t] * 100) + "%");
    return { label: cap1(pl.n) + ": защита плюс " + pl.def + ", стойкость " + rs.join(", ") + ". Детали: " + W().costText(pl.need) + (tierNow() < pl.tier ? ". Нужна оснастка ступени " + pl.tier : ""), fn: function () { addPlate(f, p); } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Накладки каркаса", items);
}
/* Инвентарь: каркасы. */
function invItems() {
  var g = G(), items = [];
  X().forEach(function (f) {
    var on = g.exoOn === f.id;
    items.push({ label: (on ? "Надет: " : "Каркас: ") + line(f), fn: function () { frameInv(f); } });
  });
  var f = worn();
  if (f && f.sh === "horn") items.push({ label: "СВЧ-залп раструбом каркаса: глушит машины впереди", fn: function () { horn(); } });
  return items;
}
function frameInv(f) {
  var g = G(), build_ = function () {
    var on = g.exoOn === f.id, items = [];
    items.push(on ? { label: "Снять каркас", fn: function () { unequip(); } } : { label: "Надеть каркас" + (worn() ? " (вместо надетого)" : ""), fn: function () { equip(f); } });
    items.push({ label: "Подзарядить энергобатареей: плюс 60. Аккумулятор " + Math.round(f.en || 0) + " из " + capOf(f) + ", батарей " + (g.ammo.energy || 0), keep: true, fn: function () { chargeBat(f); } });
    if (f.sh === "turret") items.push({ label: "Наплечная турель", kind: "choice", options: [{ v: 0, label: "бьёт сама в бою" }, { v: 1, label: "молчит" }], get: function () { return f.turretOff ? 1 : 0; }, set: function (v) { f.turretOff = v ? 1 : 0; snd("pwr_click", "ui_click"); } });
    items.push({ label: "Осмотреть: " + line(f) + ". " + effectText(f), info: true, keep: true, fn: function () {} });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu(frameName(f), build_(), { keep: true, rebuild: build_ });
}
/* Изучение брони-каркаса (mastery.study) открывает тяжёлый каркас на ступень раньше. */
function unlockBy(a) {
  var d = LAB.ARMORS[a.base] || {};
  if ((d.special === "strength" || d.special === "regshield" || d.special === "harness" || /каркас|экзо/i.test(d.n || "")) && MS()) {
    var m = MS().M(); if (!m.known["exo:heavy"]) { m.known["exo:heavy"] = 1; return "Понятно, как держит нагрузку силовая рама: тяжёлый каркас теперь собирается уже на стенде опытной серии."; }
  }
  return "";
}

LAB.exo = {
  CLS: CLS, PLATES: PLATES, MOUNT: MOUNT, CAP: CAP,
  frames: frames, worn: worn, capOf: capOf, strOk: strOk, live: live, drain: drain, onStep: onStep, stepNoise: stepNoise, runGapK: runGapK,
  meleeK: meleeK, accK: accK, defBonus: defBonus, res: res, onHurt: onHurt, tick: tick, horn: horn,
  equip: equip, unequip: unequip, chargeBat: chargeBat, chargeFull: chargeFull, chargePrice: chargePrice,
  build: build, upNode: upNode, addPlate: addPlate, dropPlate: dropPlate, setMount: setMount, setShield: setShield, repair: repair, scrap: scrap,
  line: line, charLine: charLine, benchLabel: benchLabel, benchMenu: benchMenu, invItems: invItems, unlockBy: unlockBy, frameName: frameName
};
})();
