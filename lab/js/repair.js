/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — ремонт в походе (2.0).
   Броня изнашивается: каждый удар, который она держит, понемногу её
   разбивает; с половины износа защита слабеет, на нуле — шесть десятых
   прежней (LAB.armorCondK, data.js). Чинят у верстака (workshop.js) и в
   коридоре — походными ремкомплектами:
     походный ремнабор — три ремонта в свёртке: оружие или броня плюс
       двадцать, не выше восьмидесяти; оживит сломанный автомат;
     ремонтный набор оружия — плюс тридцать пять, не выше девяноста,
       остужает ствол;
     ремкомплект брони — плюс сорок, не выше девяноста;
     инженерный ремкомплект — три ремонта в кейсе: плюс пятьдесят, до
       полной исправности; чинит повреждённый верстак и сломанный автомат;
       пустеющий кейс пополняют у верстака;
     маслёнка ремонтника (глубины) — броня как новая.
   Набор инструментов в рюкзаке: каждый походный ремонт — на десять больше,
   предел — на пять выше. Ремонт идёт пару минут по часам комплекса.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function low(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }

/* Что умеет каждый набор: uses — ремонтов в наборе, w и a — прибавка
   оружию и броне, cap — предел, cool — остужает ствол, bench — чинит
   верстак, machine — автомат. */
var KITS = {
  fieldkit:  { uses: 3, w: 20, a: 20, cap: 80, machine: true },
  wrepair:   { uses: 1, w: 35, cap: 90, cool: true },
  repairkit: { uses: 1, a: 40, cap: 90 },
  engkit:    { uses: 3, w: 50, a: 50, cap: 100, cool: true, bench: true, machine: true },
  m_oilcan:  { uses: 1, a: 100, cap: 100 }
};
var ORDER = ["fieldkit", "wrepair", "repairkit", "engkit", "m_oilcan"];
function isKit(id) { return !!KITS[id] && !!LAB.ITEMS[id]; }
function tools() { return (G().inv.toolkit || 0) > 0; }
function gainOf(K, k) { return (K[k] || 0) + (tools() ? 10 : 0) + (LAB.implants ? Math.round(LAB.implants.stat("fix")) : 0); /* чип механика */ }
function capOf(K) { return Math.min(100, K.cap + (tools() && K.cap < 100 ? 5 : 0)); }
function wcond(w) { return LAB.workshop ? LAB.workshop.cond(w) : (w.cond != null ? w.cond : 100); }

/* ════════ РЕМОНТЫ В НАБОРЕ ════════
   В рюкзаке — целые наборы (g.inv); в начатом многоразовом — сколько
   ремонтов осталось (g.kitUse). */
function opened(id) { var g = G(); if (!(g.inv[id] > 0)) { if (g.kitUse) g.kitUse[id] = 0; return 0; } return (g.kitUse && g.kitUse[id]) || 0; }
function left(id) {
  var K = KITS[id], n = G().inv[id] || 0;
  if (!K || n <= 0) return 0;
  var o = opened(id);
  return o ? o + (n - 1) * K.uses : n * K.uses;
}
function spendUse(id) {
  var g = G(), K = KITS[id];
  if (!g.kitUse) g.kitUse = {};
  if (K.uses <= 1) { g.inv[id]--; return; }
  if (!g.kitUse[id]) g.kitUse[id] = K.uses;
  g.kitUse[id]--;
  if (g.kitUse[id] <= 0) { g.kitUse[id] = 0; g.inv[id]--; }
}
/* «Походный ремнабор: 2, ремонтов 5» — для инвентаря. */
function countText(id) {
  var K = KITS[id], n = G().inv[id] || 0;
  if (!K || K.uses <= 1) return String(n);
  var o = opened(id);
  return n + ", ремонтов " + left(id) + (o ? " (в начатом " + o + " из " + K.uses + ")" : "");
}
function leftText(id) {
  var K = KITS[id], d = LAB.ITEMS[id];
  if (K.uses > 1) { var l = left(id); return l ? "Ремонтов в запасе: " + l + "." : "Набор израсходован: " + low(d.n) + " больше нет."; }
  var n = G().inv[id] || 0;
  return n ? "Осталось: " + n + "." : "Это был последний.";
}

/* ════════ ЧТО МОЖНО ПОЧИНИТЬ ════════ */
function near(o) { var g = G(); return Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) <= 2; }
function nearObjs(test) { var c = CUR(); return c && c.fl ? c.fl.objs.filter(function (o) { return near(o) && test(o); }) : []; }
/* (3.7) кофейный автомат не сломан — у него пустой бак: ремнабор воду не заменит (office.js, coffeeDry) */
function brokenMachine(o) { return (o.type === "drinks" || o.type === "snacks") && o.broken && !gm().objState(o).fixed; }
function targets(id) {
  var g = G(), K = KITS[id], cap = capOf(K), out = [];
  if (K.w) g.weapons.forEach(function (w, i) { var c = wcond(w); if (c < cap - 0.5) out.push({ k: "w", w: w, i: i, c: c, on: i === g.wi }); });
  if (K.a) (g.armors || []).forEach(function (a) { var c = LAB.armorCond(a); if (c < cap - 0.5) out.push({ k: "a", a: a, c: c, on: !!(g.armor && g.armor.id === a.id) }); });
  if (K.bench && LAB.workshop) nearObjs(function (o) { return o.type === "workbench" && LAB.workshop.bench(o).dmg; }).forEach(function (o) { out.push({ k: "b", o: o }); });
  if (K.machine) nearObjs(brokenMachine).forEach(function (o) { out.push({ k: "m", o: o }); });
  /* в руках и надетое — первыми */
  out.sort(function (x, y) { return (y.on ? 1 : 0) - (x.on ? 1 : 0); });
  return out;
}
function machineName(o) { return o.type === "snacks" ? "автомат с едой" : o.type === "coffee" ? "кофейный автомат" : "автомат с напитками"; }
function tName(t) {
  if (t.k === "w") return t.w.name + (t.on ? ", в руках" : "");
  if (t.k === "a") return t.a.name + (t.on ? ", на вас" : "");
  if (t.k === "b") return "повреждённый верстак рядом";
  return machineName(t.o) + " рядом, сломан";
}
function tLabel(id, t) {
  var K = KITS[id], cap = capOf(K);
  if (t.k === "w" || t.k === "a") {
    var nc = Math.min(cap, t.c + gainOf(K, t.k));
    return tName(t) + ": состояние " + Math.round(t.c) + " из 100, станет " + Math.round(nc);
  }
  return tName(t) + (t.k === "b" ? ": станки снова заработают" : ": заработает снова");
}
function nothingText(id) {
  var K = KITS[id], cap = capOf(K), s = [], what = [], nb = [];
  if (K.w) what.push("оружие");
  if (K.a) what.push("броня");
  if (what.length) s.push(what.join(" и ") + (cap >= 100 ? (what.length > 1 ? " исправны" : K.w ? " исправно" : " исправна") : " — не ниже " + cap + " из 100"));
  if (K.bench) nb.push("повреждённого верстака");
  if (K.machine) nb.push("сломанного автомата");
  if (nb.length) s.push(nb.join(" и ") + " рядом нет");
  return "Чинить нечего: " + s.join(", ") + "." + (cap < 100 && what.length ? " Больше даст верстак." : "");
}

/* ════════ ПОЧИНИТЬ ════════ */
function apply(id, t) {
  var g = G(), K = KITS[id], d = LAB.ITEMS[id], cap = capOf(K), msg;
  if (!(g.inv[id] > 0)) { say("Нет: " + low(d.n) + "."); return false; }
  if (t.k === "w") {
    t.w.cond = Math.min(cap, wcond(t.w) + gainOf(K, "w"));
    if (K.cool) { t.w.heat = 0; t.w.hotUntil = 0; }
    A("play", "pry"); gm().later(function () { A("play", "w_switch"); }, 700);
    msg = d.n + ": " + t.w.name + " — состояние " + Math.round(t.w.cond) + " из 100." + (K.cool ? " Ствол остужен." : "");
  } else if (t.k === "a") {
    t.a.cond = Math.min(cap, LAB.armorCond(t.a) + gainOf(K, "a"));
    A("play", "pry"); gm().later(function () { A("play", "craft"); }, 700);
    msg = d.n + ": " + t.a.name + " — состояние " + Math.round(t.a.cond) + " из 100, защита " + LAB.armorDef(t.a) + ".";
  } else if (t.k === "b") {
    LAB.workshop.bench(t.o).dmg = false;
    A("play", "pry"); gm().later(function () { A("play", "power_on"); }, 900);
    msg = d.n + ": предохранитель заменён, обмотка перемотана — станки верстака снова работают.";
  } else {
    gm().objState(t.o).fixed = 1;
    A("play", "pry"); gm().later(function () { A("play", "power_on"); }, 900);
    msg = d.n + ": " + machineName(t.o) + " снова работает — контакты зачищены, предохранитель на месте.";
  }
  spendUse(id);
  if (gm().advanceTime) gm().advanceTime(2);
  var top = (t.k === "w" || t.k === "a") && cap < 100 && (t.k === "w" ? t.w.cond : t.a.cond) >= cap ? " Полный ремонт — у верстака." : "";
  say(msg + top + " " + leftText(id));
  if (LAB.ach && LAB.ach.ev) LAB.ach.ev("repair", 1);
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  if (LAB.combat && LAB.settings.turnBased) LAB.combat.tick();
  return true;
}
/* Применить набор: одна цель — сразу; несколько — окно «что чинить». */
function use(id) {
  var g = G(), d = LAB.ITEMS[id];
  if (!isKit(id) || !(g.inv[id] > 0)) { say("Нет: " + (d ? low(d.n) : id) + "."); return false; }
  var list = targets(id);
  if (!list.length) { say(nothingText(id)); return false; }
  if (list.length === 1) return apply(id, list[0]);
  LAB.ui.menu(d.n + ": что чинить", list.map(function (t) { return { label: tLabel(id, t), fn: function () { apply(id, t); } }; }).concat([{ label: "Отмена", fn: function () {} }]),
    { intro: leftText(id) + (tools() ? " Набор инструментов в рюкзаке: ремонт на десять больше." : "") });
  return true;
}
/* Какой набор взять для оружия в руках: первым — тот, что даёт больше. */
function quick() {
  var g = G(), w = gm().curWeapon && gm().curWeapon();
  var ids = ORDER.filter(function (id) { return g.inv[id] > 0 && KITS[id].w; });
  if (!ids.length) { say("Ремкомплектов для оружия нет: их собирают у верстака, раздел «Ремкомплекты»."); return false; }
  if (!w) { say("Оружия нет."); return false; }
  ids.sort(function (a, b) { return capOf(KITS[b]) - capOf(KITS[a]); });
  var id = ids[0], c = wcond(w), K = KITS[id];
  if (c >= capOf(K) - 0.5) { say("Оружию в руках ремонт не нужен: состояние " + Math.round(c) + " из 100."); return false; }
  return apply(id, { k: "w", w: w, i: g.wi, c: c, on: true });
}

/* ════════ ИЗНОС БРОНИ ════════
   raw — удар до брони, fin — что дошло до тела; броня держит разницу. */
function armorHit(raw, fin) {
  var g = G(), a = g.armor;
  if (!a || !(raw > fin)) return;
  var c0 = LAB.armorCond(a), wear = Math.min(2.5, 0.2 + (raw - fin) * 0.12);
  a.cond = Math.max(0, Math.round((c0 - wear) * 100) / 100);
  [50, 25, 10].forEach(function (lv) {
    if (c0 >= lv && a.cond < lv) sayq(lv === 50 ? "Броня изношена: состояние 50 из 100, держит хуже. Почините её у верстака или ремкомплектом." :
      lv === 25 ? "Броня сильно изношена: состояние 25 из 100, защита " + LAB.armorDef(a) + "." : "Броня почти разбита: состояние 10 из 100.");
  });
}
/* Кислота, огонь: броня теряет состояние сразу. */
function corrode(part) {
  var a = G().armor;
  if (!a || !(part > 0)) return "";
  a.cond = Math.max(0, LAB.armorCond(a) - Math.round(part * 100));
  return "Броня разъедена: состояние " + Math.round(a.cond) + " из 100, защита " + LAB.armorDef(a) + ".";
}

LAB.repair = {
  KITS: KITS, ORDER: ORDER, isKit: isKit, use: use, quick: quick, apply: apply, targets: targets, left: left, opened: opened,
  countText: countText, armorHit: armorHit, corrode: corrode, capOf: capOf
};
})();
