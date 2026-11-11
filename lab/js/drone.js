/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — дрон-спутник (после 4.6).
   По книге Эдуарда Полякова «Квази Эпсилон»: первый большой проект
   инженера — дроид, собранный из хлама и запущенный своими руками, и
   спутник, с которым делишь жизнь и опыт. Блок управления снимают с
   разбитых машин ОКО (чаще — с начальников смены и стражей); из него,
   сервоприводов, ячейки, оптики и лома у верстака собирают своего дрона.
   Он летает рядом и переходит вместе с героем с этажа на этаж. Модули
   (два гнезда; третье — когда дрон вырастет, четвёртое — у дроновода и с
   нервным узлом Нижних): сенсорный блок (разведка: маяки на врагов вокруг,
   предупреждение о тех, кто подкрадывается), разрядник (оглушает, одну
   цель — раз за бой), ствол (сам стреляет по врагам рядом), манипулятор
   (вне боя понемногу чинит оружие, броню и каркас), экран (принимает на
   себя часть урона — «общая жизнь»). Дрон получает десятую часть опыта
   героя и растёт до десятой ступени. Энергию тратит на умения и огонь;
   подзарядка — энергобатареей или у капсулы. Сбитый не пропадает: блок
   цел, дрона чинят у верстака. Свёрнутый молчит и ничего не тратит.
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
function C() { return LAB.combat; }

var NEED = { kv_ctrl: 1, servo: 2, cell: 1, optic: 1, scrap: 4, wire: 2 };
var MODS = {
  sensor: { n: "сенсорный блок", need: { optic: 1, chip: 1 }, d: "разведка: маяки на врагов вокруг; предупреждает, если кто-то подкрадывается" },
  zapper: { n: "разрядник", need: { cap: 2, wire: 2, cell: 1 }, d: "оглушает ближайшего врага на несколько секунд, одну цель — раз за бой" },
  gun: { n: "ствол", need: { scrap: 2, magnet: 1, cap: 1 }, d: "сам стреляет по врагам рядом: бьёт слабо, но отвлекает" },
  arm: { n: "манипулятор", need: { servo: 1, scrap: 2 }, d: "вне боя понемногу чинит оружие, броню и каркас" },
  screen: { n: "экран", need: { panel: 2, ceramic: 1 }, d: "принимает на себя четверть урона по вам" },
  /* (после 4.6) груз: load.js, capOf("drone") */
  cargo: { n: "грузовой захват", need: { servo: 1, magnet: 1, scrap: 2 }, d: "несёт часть груза: предел плюс двенадцать килограммов, пока дрон в воздухе" },
  nerve: { n: "нервный узел Нижних", need: { dp_nerve: 1 }, tier: 6, d: "лишнее гнездо для модуля" }
};
var MOD_ORDER = ["sensor", "zapper", "gun", "arm", "screen", "cargo", "nerve"];
var NAMES = ["Жук", "Шмель", "Сверчок", "Стриж", "Светлячок", "Комар", "Овод", "Чиж"];

function D() { var g = G(); return g.drone || null; }
function has() { return !!D(); }
/* (после 4.6) интеллект 25 (основа, без плодов — гнёзда не мигают) — ещё одно гнездо: stats.js */
function slots(d) { d = d || D(); if (!d) return 0; return 2 + ((d.lvl || 1) >= 5 ? 1 : 0) + (MS() && MS().has("drones") ? 1 : 0) + (d.mods.indexOf("nerve") >= 0 ? 1 : 0) + ((G().mind || 10) >= 25 ? 1 : 0); }
function usedSlots(d) { return d.mods.filter(function (m) { return m !== "nerve"; }).length; }
function hasMod(k) { var d = D(); return !!(d && !d.wreck && d.mods.indexOf(k) >= 0); }
function active() { var d = D(); return !!(d && !d.wreck && d.out); }
function name(d) { d = d || D(); return d ? "дрон" + (d.nm ? " «" + d.nm + "»" : "") : "дрон"; }
function short() { var d = D(); return !d ? "" : d.wreck ? "дрон сбит" : !d.out ? "дрон свёрнут" : "дрон рядом"; }
function cdK() { return MS() && MS().has("drones") ? 0.75 : 1; }
function costK(d) { return d && MS() && MS().flawOf(d) ? 1.3 : 1; }

/* ════════ СБОРКА И УЗЛЫ ════════ */
function tierNow() { var w = W(), b = w && w.near ? w.near() : null; return b && w ? w.effTier(b) : 0; }
function lack(need) { var g = G(), s = []; for (var k in need) { var h = g.inv[k] || 0; if (h < need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + h + " из " + need[k]); } return s.join(", "); }
function canWork(tier, need) {
  if (tierNow() < tier) return "нужен верстак ступени " + tier + " и выше";
  if (C() && C().danger && C().danger()) return "рядом враг";
  if (need && !W().haveAll(need)) return "не хватает: " + lack(need);
  return "";
}
function build(opts) {
  opts = opts || {};
  var g = G();
  if (D()) { say("Дрон уже есть: два блока управления разом не удержать."); return null; }
  var why = canWork(2, NEED);
  if (why) { LAB.UI.error(); say("Дрон-спутник: " + why + (/блок/.test(why) || !(g.inv.kv_ctrl > 0) ? ". Блок управления снимают с разбитых машин ОКО — чаще с начальников смены и стражей" : "") + "."); return null; }
  W().take(NEED);
  var mins = Math.max(6, Math.round(15 * (1 - 0.05 * step("elec"))));
  if (gm().advanceTime) gm().advanceTime(mins);
  if (g.body) g.body.wake = Math.max(0, g.body.wake - 6);
  var d = { lvl: 1, xp: 0, hpMax: 30, hp: 30, enMax: 100, en: 100, mods: [], wreck: 0, out: 1, auto: { scout: 1, stun: 1, gun: 1, arm: 1 }, cd: {}, nm: opts.name || "", mk: 1, rcNeed: JSON.parse(JSON.stringify(NEED)) };
  var rc = { id: "drone", n: "дрон-спутник", out: "drone", forge: "elec", cls: "own" };
  if (MS()) MS().maybeFlaw(d, MS().flawChance(rc, { cls: "own", base: 0.08, dir: "elec", key: "drone" }), true);
  if (d.flaw) d.flaw = { k: "play", seen: 0, n: 0 }; /* у дрона брак — «сбоит привод»: умения дороже */
  g.drone = d;
  var m = MS() ? MS().M() : null, xp = 15;
  if (m && !m.first.drone) { m.first.drone = 1; xp *= 3; }
  if (MS()) MS().gain("elec", xp);
  if (LAB.ach) LAB.ach.ev("craft", 1); /* ОКО слышит работу у верстака — как любую сборку */
  snd("drone_up", "power_on");
  var msg = "Дрон собран за " + mins + " минут. Блок управления ожил, винты раскрутились — дрон принял управление от вас и висит рядом. Гнёзд для модулей: " + slots(d) + "; модули ставят здесь же, у верстака.";
  if (opts.name != null) { say(msg); return d; }
  nameMenu(msg);
  return d;
}
function nameMenu(msg) {
  var pool = NAMES.slice(), opts = [];
  while (pool.length && opts.length < 4) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  var done = function (nm) { var d = D(); if (d) d.nm = nm; if (LAB.ui.closeTop) LAB.ui.closeTop(true); snd("drone_ok", "ui_ok"); say(cap1(name()) + " готов к работе."); if (W() && W().toRoot) W().toRoot(); };
  var items = opts.map(function (nm) { return { label: "«" + nm + "»", fn: function () { done(nm); } }; });
  items.push({ label: "Без имени", fn: function () { done(""); } });
  menu("Имя дрона", items, { intro: msg + " Как назвать?" });
}
function addMod(k) {
  var d = D(), md = MODS[k];
  if (!d) { say("Дрона нет."); return false; }
  if (d.wreck) { say("Дрон сбит: сначала почините."); return false; }
  if (d.mods.indexOf(k) >= 0) { say(cap1(md.n) + " уже стоит."); return false; }
  if (k !== "nerve" && usedSlots(d) >= slots(d)) { say("Все гнёзда заняты: " + slots(d) + "."); return false; }
  var why = canWork(md.tier || 2, md.need);
  if (why) { LAB.UI.error(); say(cap1(md.n) + ": " + why + "."); return false; }
  W().take(md.need);
  for (var nk in md.need) d.rcNeed[nk] = (d.rcNeed[nk] || 0) + md.need[nk];
  d.mods.push(k);
  if (gm().advanceTime) gm().advanceTime(4);
  if (MS()) MS().gain("elec", 4);
  snd("work_solder", "craft"); if (gm().later) gm().later(function () { snd("drone_ok", "ui_ok"); }, 700);
  say(cap1(md.n) + " поставлен: " + md.d + ".");
  return true;
}
function delMod(k) {
  var d = D(); if (!d) return false;
  var i = d.mods.indexOf(k); if (i < 0) return false;
  if (k === "nerve" && usedSlots(d) > slots(d) - 1) { say("Сначала снимите один модуль: без нервного узла гнёзд станет меньше."); return false; }
  d.mods.splice(i, 1);
  var md = MODS[k], g = G(), s = [];
  for (var nk in md.need) { var n = Math.floor(md.need[nk] / 2); if (n > 0) { g.inv[nk] = (g.inv[nk] || 0) + n; s.push((LAB.ITEMS[nk] ? LAB.ITEMS[nk].n.toLowerCase() : nk) + " " + n); } }
  snd("work_ratchet", "craft");
  say(cap1(md.n) + " снят." + (s.length ? " Вернулось: " + s.join(", ") + "." : ""));
  return true;
}
function repairNeed(d) { return d.wreck ? { servo: 1, scrap: 3, wire: 1 } : (d.hp < d.hpMax ? { scrap: 1, wire: 1 } : null); }
function repair() {
  var d = D(); if (!d) { say("Дрона нет."); return false; }
  var need = repairNeed(d);
  if (!need) { say(cap1(name()) + " исправен."); return false; }
  var why = canWork(2, need);
  if (why) { LAB.UI.error(); say("Починка дрона: " + why + "."); return false; }
  W().take(need);
  var was = d.wreck;
  d.wreck = 0; d.hp = was ? Math.round(d.hpMax / 2) : d.hpMax; d.out = 1;
  if (gm().advanceTime) gm().advanceTime(was ? 8 : 3);
  if (MS()) MS().gain("elec", was ? 5 : 2);
  snd("work_solder", "craft"); if (gm().later) gm().later(function () { snd("drone_up", "power_on"); }, 800);
  say(was ? cap1(name()) + " снова в воздухе: корпус собран, блок управления цел. Здоровье дрона " + d.hp + " из " + d.hpMax + "." : cap1(name()) + " залатан: " + d.hp + " из " + d.hpMax + ".");
  return true;
}
function scrapDrone() {
  var d = D(), g = G(); if (!d) return false;
  var s = [];
  for (var k in d.rcNeed) { var n = k === "kv_ctrl" ? 1 : Math.floor(d.rcNeed[k] / 2); if (n > 0) { g.inv[k] = (g.inv[k] || 0) + n; s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + n); } }
  g.drone = null;
  snd("work_ratchet", "pry");
  say("Дрон разобран. Вернулось: " + s.join(", ") + ". Блок управления цел — из него можно собрать дрона заново.");
  return true;
}

/* ════════ В ДЕЛЕ ════════ */
function charge(n) { var d = D(); if (!d) return; d.en = Math.min(d.enMax, (d.en || 0) + n); }
function spend(n) { var d = D(); n = Math.ceil(n * costK(d)); if (!d || (d.en || 0) < n) return false; d.en -= n; if (d.en <= 10 && d.en + n > 10) { sayq(cap1(name()) + ": энергии мало. Подзарядите энергобатареей или у капсулы."); } return true; }
function hostiles(r) {
  var c = C(); if (!c) return [];
  return c.visibleFoes(r).filter(function (o) { return !o.dead && !o.calm && !o.ally && !o.neutral && !o.disguised && !o.burrowed && !o.phased; });
}
function nearest(list) { var g = G(), b = null, bd = 99; list.forEach(function (o) { var d = Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)); if (d < bd) { bd = d; b = o; } }); return b; }
function scout(auto) {
  var d = D(), c = C(), g = G();
  if (!active() || !hasMod("sensor")) { if (!auto) say(d && d.wreck ? "Дрон сбит." : !d ? "Дрона нет." : !d.out ? "Дрон свёрнут." : "Нужен сенсорный блок."); return false; }
  if ((d.cd.scout || 0) > 0) { if (!auto) say("Сенсоры дрона ещё перезаряжаются."); return false; }
  if (!spend(20)) { if (!auto) say("Дрону не хватает энергии на разведку."); return false; }
  d.cd.scout = Math.round(90 * cdK());
  snd("drone_ping", "scan_soft");
  var R = 12 + Math.floor((d.lvl || 1) / 2), list = c.foes().filter(function (o) { return !o.dead && !o.calm && !o.ally && !o.neutral && !o.burrowed && Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) <= R; });
  list.forEach(function (o) { o.mark = Date.now() + 20000; });
  var s = list.length ? "Разведка дрона: врагов вокруг " + list.length + " — " + list.slice(0, 5).map(function (o) { return String(o.name || "").split(",")[0] + " " + gm().relDir(o.x, o.y); }).join("; ") + (list.length > 5 ? " и другие" : "") + ". На них маяки на двадцать секунд." : "Разведка дрона: врагов вокруг нет.";
  if (auto) sayq(s); else say(s);
  return true;
}
function stun(auto) {
  var d = D();
  if (!active() || !hasMod("zapper")) { if (!auto) say(!d ? "Дрона нет." : d.wreck ? "Дрон сбит." : !d.out ? "Дрон свёрнут." : "Нужен разрядник."); return false; }
  if ((d.cd.stun || 0) > 0) { if (!auto) say("Разрядник дрона ещё копит заряд."); return false; }
  var t = nearest(hostiles(6).filter(function (o) { return !o.dStun; }));
  if (!t) { if (!auto) say("Некого оглушать: рядом ни одного врага, которого дрон ещё не бил разрядом."); return false; }
  if (!spend(15)) { if (!auto) say("Дрону не хватает энергии на разряд."); return false; }
  d.cd.stun = Math.round(30 * cdK());
  t.dStun = 1;
  t.frozen = Math.max(t.frozen || 0, t.boss ? 2 : t.kind === "mech" ? 9 : 6);
  snd("drone_zap", "w_shock_crack");
  (auto ? sayq : say)(cap1(name()) + " бьёт разрядом: " + String(t.name || "").split(",")[0] + " — оглушение на пару секунд.");
  hitBack(t, 0.25);
  return true;
}
/* Цель может ответить дрону. */
function hitBack(f, p) {
  var d = D(); if (!d || !f || f.dead || !(f.dmg > 0) || Math.random() >= p) return;
  hurt(Math.max(1, Math.round(f.dmg * 0.5 / depthK())));
}
/* Корпус дрона держит удары своей глубины: урон по нему делится на рост врагов с глубиной. */
function depthK() { var g = G(); return 1 + 0.14 * (LAB.foeLevel(g.L, g.F) - 1); }
function hurt(n) {
  var d = D(); if (!d || d.wreck) return;
  d.hp = Math.max(0, d.hp - n);
  snd("drone_hit", "shield_hit_foe", { gain: 0.5 });
  if (d.hp <= 0) { d.wreck = 1; snd("drone_down", "drone_death"); sayq(cap1(name()) + " сбит. Блок управления цел — дрона можно починить у верстака."); if (LAB.load) setTimeout(function () { LAB.safe(function () { LAB.load.after(); }); }, 0); /* (после 4.6) сбитый — в рюкзаке, и грузовой захват больше не держит */ }
  else if (d.hp <= d.hpMax * 0.3) sayOnce("dronelow", cap1(name()) + " повреждён: " + d.hp + " из " + d.hpMax + ".", 15000);
}
/* Удар по герою: экран берёт четверть на себя. */
function onHurt(raw, adt, src) {
  var d = D();
  if (!active() || !hasMod("screen") || !(raw > 0)) return raw;
  var dk = depthK(), take = Math.min(d.hp * dk, Math.round(raw * 0.25 * 10) / 10);
  if (take <= 0) return raw;
  hurt(Math.max(0.1, Math.round(take / dk * 10) / 10));
  return raw - take;
}
var tN = 0, lastKey = "", warned = {};
function tick() {
  var d = D(); if (!d) return;
  tN++;
  for (var k in d.cd) if (d.cd[k] > 0) d.cd[k]--;
  if (d.wreck || !d.out) return;
  var c = C(), g = G(), key = gm().CUR && gm().CUR.key;
  if (key !== lastKey) { lastKey = key; warned = {}; if (hasMod("sensor") && d.auto.scout && tN > 2) setTimeout(function () { LAB.safe(function () { scout(true); }); }, 1500); }
  var fight = c && c.danger && c.danger();
  /* бой: разряд и огонь */
  if (fight) {
    if (hasMod("zapper") && d.auto.stun && !(d.cd.stun > 0)) stun(true);
    if (hasMod("gun") && d.auto.gun && tN % 4 === 0) {
      var t = nearest(hostiles(6));
      if (t && spend(1)) {
        var lvl = LAB.foeLevel(g.L, g.F), dmg = Math.max(1, Math.round(3.2 * (1 + 0.14 * (lvl - 1)) * (1 + 0.06 * ((d.lvl || 1) - 1))));
        snd("drone_shot", "w_blaster_s", { gain: 0.5 });
        c.damageFoe(t, dmg, "energy", { quiet: true, ally: true, by: "ally" });
        hitBack(t, 0.15);
      }
    }
  } else if (hasMod("arm") && d.auto.arm && tN % 20 === 0) {
    /* вне боя: манипулятор чинит понемногу — до 85 */
    var w = gm().curWeapon ? gm().curWeapon() : null, a = g.armor, f = LAB.exo && LAB.exo.worn(), done = false;
    var fix = function (x) { if (done || !x) return; var cv = x.cond != null ? x.cond : 100; if (cv < 85 && spend(2)) { x.cond = Math.min(85, cv + 1); done = true; if (tN % 200 === 0) snd("drone_fix", "craft", { gain: 0.3 }); } };
    fix(w); fix(a); fix(f);
  }
  /* сенсоры: кто подкрадывается */
  if (hasMod("sensor") && tN % 3 === 0 && c) {
    c.foes().forEach(function (o) {
      if (warned[o.id] || o.dead || o.calm || o.ally || o.neutral || o.state !== "hunt") return;
      var dd = Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y));
      if (dd > 6 || LAB.los(gm().CUR.fl, gm().CUR.fs, g.x, g.y, o.x, o.y)) return;
      warned[o.id] = 1;
      snd("drone_ok", "ui_move", { gain: 0.6 });
      sayq(cap1(name()) + ": " + String(o.name || "").split(",")[0] + " " + gm().relDir(o.x, o.y) + ", за преградой.");
    });
  }
}
/* Опыт: десятая часть опыта героя (дроноводу — пятая). */
function onXP(n) {
  var d = D(); if (!d || d.wreck || (d.lvl || 1) >= 10) return;
  d.xp = (d.xp || 0) + n * (MS() && MS().has("drones") ? 0.2 : 0.1);
  var need = 25 * (d.lvl || 1);
  if (d.xp >= need) {
    d.xp -= need; d.lvl = (d.lvl || 1) + 1; d.hpMax += 8; d.hp = d.hpMax; d.enMax += 5;
    snd("drone_ok", "ui_levelup");
    sayq(cap1(name()) + " вырос: ступень " + d.lvl + "." + (d.lvl === 5 ? " Открылось третье гнездо для модуля." : ""));
  }
}
function pack(v) {
  var d = D(); if (!d) { say("Дрона нет."); return false; }
  if (d.wreck) { say("Дрон сбит."); return false; }
  d.out = v ? 1 : 0;
  if (LAB.load) setTimeout(function () { LAB.safe(function () { LAB.load.after(); }); }, 0); /* (после 4.6) свёрнутый дрон — в рюкзаке, захват не держит груз */
  snd(v ? "drone_up" : "drone_ok", v ? "power_on" : "ui_close");
  say(v ? cap1(name()) + " снова в воздухе." : cap1(name()) + " свёрнут: молчит и ничего не тратит.");
  return true;
}
function chargeBat() {
  var d = D(), g = G(); if (!d) { say("Дрона нет."); return false; }
  if (d.en >= d.enMax) { say("Энергия дрона полна."); return false; }
  if (!(g.ammo.energy > 0)) { say("Энергобатарей нет."); return false; }
  g.ammo.energy--; charge(50);
  snd("exo_charge", "w_reload_e");
  say(cap1(name()) + " подзаряжен: " + Math.round(d.en) + " из " + d.enMax + ".");
  return true;
}
function chargePrice() {
  var d = D(); if (!d) return 0;
  var miss = d.enMax - (d.en || 0); if (miss <= 0) return 0;
  var pb = LAB.medic && LAB.medic.vendPrice ? LAB.medic.vendPrice("ammo:energy") : 20;
  return Math.max(1, Math.round(pb * miss / 50));
}

/* ════════ СЛОВА И ОКНА ════════ */
function line(d) {
  d = d || D(); if (!d) return "";
  return cap1(name(d)) + ": ступень " + (d.lvl || 1) + ", " + (d.wreck ? "сбит" : (d.out ? "в воздухе" : "свёрнут") + ", здоровье " + Math.round(d.hp) + " из " + d.hpMax) + ", энергия " + Math.round(d.en) + " из " + d.enMax + ", модули: " + (d.mods.length ? d.mods.map(function (k) { return MODS[k].n; }).join(", ") : "нет") + " (гнёзд " + slots(d) + ")";
}
function charLine() { var d = D(); return d ? line(d) + "." : ""; }
function benchLabel(et) { var d = D(); return d ? "Дрон-спутник: модули и починка — " + short() : "Дрон-спутник: собрать — нужен блок управления машины" + (G().inv.kv_ctrl > 0 ? " (есть)" : ""); }
function benchMenu(et) {
  var b_ = function () {
    var d = D(), items = [];
    if (!d) items.push({ label: "Собрать дрона: " + W().costText(NEED), keep: true, fn: function () { build(); } });
    else {
      items.push({ label: line(d), info: true, keep: true, fn: function () {} });
      MOD_ORDER.forEach(function (k) {
        var md = MODS[k], on = d.mods.indexOf(k) >= 0;
        items.push({ label: cap1(md.n) + (on ? " — стоит. Снять" : ": " + md.d + ". Детали: " + W().costText(md.need) + (md.tier && tierNow() < md.tier ? ". Нужна оснастка Нижних" : "")), keep: true, fn: function () { if (on) delMod(k); else addMod(k); } });
      });
      var rn = repairNeed(d);
      if (rn) items.push({ label: (d.wreck ? "Починить сбитого дрона: " : "Залатать дрона: ") + W().costText(rn), keep: true, fn: function () { repair(); } });
      items.push({ label: "Разобрать дрона: блок управления вернётся", fn: function () { scrapDrone(); if (LAB.ui.closeTop) LAB.ui.closeTop(true); } });
    }
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Дрон-спутник", b_(), { keep: true, rebuild: b_ });
}
function cmdItems() {
  var d = D(), items = [];
  if (!d) return [{ label: "Дрона нет: его собирают у верстака из блока управления машины.", info: true, keep: true, fn: function () {} }];
  items.push({ label: line(d), info: true, keep: true, fn: function () {} });
  if (!d.wreck) {
    if (hasMod("sensor")) items.push({ label: "Разведка: маяки на врагов вокруг", fn: function () { scout(false); } });
    if (hasMod("zapper")) items.push({ label: "Оглушить ближайшего врага", fn: function () { stun(false); } });
    items.push({ label: d.out ? "Свернуть дрона" : "Выпустить дрона", keep: true, fn: function () { pack(!d.out); } });
    items.push({ label: "Подзарядить энергобатареей: плюс 50. Батарей " + (G().ammo.energy || 0), keep: true, fn: function () { chargeBat(); } });
    [["scout", "Разведка при входе на этаж", "sensor"], ["stun", "Разряд в бою сам", "zapper"], ["gun", "Огонь в бою сам", "gun"], ["arm", "Починка вне боя сама", "arm"]].forEach(function (a) {
      if (!hasMod(a[2])) return;
      items.push({ label: a[1], kind: "choice", options: [{ v: 1, label: "да" }, { v: 0, label: "нет" }], get: function () { return d.auto[a[0]] ? 1 : 0; }, set: function (v) { d.auto[a[0]] = v ? 1 : 0; snd("pwr_click", "ui_click"); } });
    });
  }
  return items;
}
function cmdMenu() {
  var b_ = function () { return cmdItems().concat([{ label: "Назад", close: true, fn: function () {} }]); };
  menu("Дрон-спутник", b_(), { keep: true, rebuild: b_ });
}
function invItems() { return D() ? [{ label: line(), fn: cmdMenu }] : []; }
/* Alt+D: команды дрону и каркасу. */
function quick() {
  var items = [];
  if (D()) items = items.concat(cmdItems());
  var f = LAB.exo && LAB.exo.worn();
  if (f && f.sh === "horn") items.push({ label: "СВЧ-залп раструбом каркаса", fn: function () { LAB.exo.horn(); } });
  if (!items.length) { say("Ни дрона, ни каркаса с раструбом нет. Их собирают у верстака: «Инженерное дело»."); return; }
  menu("Команды: дрон и каркас", items.concat([{ label: "Назад", close: true, fn: function () {} }]));
}

LAB.drone = {
  MODS: MODS, NEED: NEED, D: D, has: has, slots: slots, active: active, hasMod: hasMod, short: short,
  build: build, addMod: addMod, delMod: delMod, repair: repair, scrap: scrapDrone, scout: scout, stun: stun, hurt: hurt, onHurt: onHurt, tick: tick, onXP: onXP,
  pack: pack, charge: charge, chargeBat: chargeBat, chargePrice: chargePrice, line: line, charLine: charLine, benchLabel: benchLabel, benchMenu: benchMenu,
  cmdMenu: cmdMenu, invItems: invItems, quick: quick
};
})();
