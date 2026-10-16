/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — игра: состояние, этажи, движение, вещи,
   двери, действия у предметов, лифты и лестницы, сохранения, время,
   задания, уровни героя. Бой и враги — combat.js, звук мира — atmos.js,
   окна — ui.js, жесты — input.js.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
var T = LAB.T;
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function atm() { return LAB.atmos || {}; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }

/* ── слова ── */
function plural(n, a, b, c) { n = Math.abs(n) % 100; if (n >= 11 && n <= 14) return c; var m = n % 10; return m === 1 ? a : (m >= 2 && m <= 4 ? b : c); }
function stepsW(n) { return n + " " + plural(n, "шаг", "шага", "шагов"); }
function gv(g, m, f, n) { return g === "f" ? f : g === "n" ? (n || m) : m; }
LAB.plural = plural; LAB.stepsW = stepsW; LAB.gv = gv;
var DIRS = LAB.DIRS;

/* ════════ СОСТОЯНИЕ ════════ */
function newState(seed) {
  return {
    v: 1, seed: seed, L: 1, F: 1, x: 0, y: 0, face: "N",
    hp: 100, hpMax: 100, str: 10, agi: 10, mind: 10, cha: 10,
    en: 30, enMax: 30, lvl: 1, xp: 0, credits: 20,
    weapons: [LAB.makeWeapon("crowbar", 1, 0, 1, "w_start_crowbar")], wi: 0, drawn: false,
    armor: null, armors: [],
    ammo: { energy: 0, magnetron: 0, positron: 0 },
    inv: {}, keys: {}, tier: 0, elev: {}, gate: {}, core: false, codes: {},
    notes: {}, noteList: [], samples: {}, implants: ["scan", "echo"], faction: null, crafted: 0,
    quests: [], journal: [], fs: {}, maxF: { 1: 1 }, visited: { "1-1": 1 },
    checkpoint: null, day: 1, min: 8 * 60, event: "norm", eventUntil: 8 * 60 + 90,
    st: { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0 },
    stats: { kills: 0, steps: 0, secrets: 0, deaths: 0, shots: 0, hits: 0, notes: 0, ms: 0, saves: 0 },
    tut: {}, done: false, noise: 0
  };
}
var G = newState("lab");
var CUR = { fl: null, fs: null, foes: [], key: "", room: -9, seen: null, focus: null, lastBump: 0, lastBumpKey: "" };
var game = {
  get G() { return G; }, CUR: CUR, entered: false, paused: false,
  plural: plural, stepsW: stepsW
};
LAB.game = game;

/* ════════ ЭТАЖ ════════ */
function fsFor(L, F) {
  var k = L + "-" + F;
  if (!G.fs[k]) G.fs[k] = { doors: {}, taken: {}, foes: {}, objs: {}, drops: [], dseq: 0, power: false, rubble: false, lockdown: false, turrets: true, mapped: false, seen: "", secrets: {}, robots: false };
  return G.fs[k];
}
game.fsFor = fsFor;
function idx(x, y) { return y * LAB.W + x; }
function roomAt(x, y) { var r = CUR.fl.room[idx(x, y)]; return r >= 0 ? CUR.fl.rooms[r] : null; }
game.roomAt = roomAt;
function cellType(x, y) { return LAB.inb(x, y) ? CUR.fl.t[idx(x, y)] : T.WALL; }
function objAt(x, y) { return LAB.inb(x, y) ? CUR.fl.objAt[idx(x, y)] || null : null; }
function npcAt(x, y) { var n = CUR.fl.npcs; for (var i = 0; i < n.length; i++) if (n[i].x === x && n[i].y === y) return n[i]; return null; }
function foeAt(x, y) { var f = CUR.foes; for (var i = 0; i < f.length; i++) if (!f[i].dead && f[i].x === x && f[i].y === y) return f[i]; return null; }
function doorAt(x, y) { return cellType(x, y) === T.DOOR ? CUR.fl.doorAt[idx(x, y)] : null; }
game.objAt = objAt; game.npcAt = npcAt; game.foeAt = foeAt; game.doorAt = doorAt;

function doorOpen(d) { return CUR.fs.doors[d.id] === 2; }
function secretFound(d) { return !!CUR.fs.secrets[d.id]; }
/* Проходимость клетки для героя */
function passable(x, y) {
  var tt = cellType(x, y);
  if (tt === T.WALL) return false;
  if (tt === T.DOOR) return doorOpen(CUR.fl.doorAt[idx(x, y)]);
  if (objAt(x, y) || npcAt(x, y)) return false;
  return true;
}
game.passable = passable;

/* Видимые вещи этажа: с пола (если не взяты) и выпавшие. */
function floorItems() {
  var out = [], fs = CUR.fs;
  CUR.fl.items.forEach(function (it) { if (!fs.taken[it.id]) out.push(it); });
  fs.drops.forEach(function (it) { if (!fs.taken[it.id]) out.push(it); });
  return out;
}
game.floorItems = floorItems;
function itemsAt(x, y) { return floorItems().filter(function (it) { return it.x === x && it.y === y; }); }

/* Видели ли клетку (для карты и навигатора). */
function markSeen() {
  if (!CUR.seen) return;
  var fl = CUR.fl, r = roomAt(G.x, G.y);
  CUR.seen[idx(G.x, G.y)] = 1;
  if (r) {
    for (var y = r.y0 - 1; y <= r.y1 + 1; y++) for (var x = r.x0 - 1; x <= r.x1 + 1; x++) if (LAB.inb(x, y)) CUR.seen[idx(x, y)] = 1;
  } else {
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (LAB.inb(G.x + dx, G.y + dy)) CUR.seen[idx(G.x + dx, G.y + dy)] = 1;
  }
}
function encodeSeen(arr) {
  if (!arr) return "";
  var s = "", byte = 0, n = 0;
  for (var i = 0; i < arr.length; i++) { byte |= (arr[i] ? 1 : 0) << (i % 8); if (i % 8 === 7) { s += String.fromCharCode(byte); byte = 0; n++; } }
  if (arr.length % 8) s += String.fromCharCode(byte);
  try { return btoa(s); } catch (e) { return ""; }
}
function decodeSeen(b64) {
  var arr = new Uint8Array(LAB.W * LAB.H);
  if (!b64) return arr;
  try {
    var s = atob(b64);
    for (var i = 0; i < arr.length; i++) arr[i] = (s.charCodeAt(i >> 3) >> (i % 8)) & 1;
  } catch (e) { /* */ }
  return arr;
}
function syncFloorState() {
  if (!CUR.fs) return;
  CUR.fs.seen = encodeSeen(CUR.seen);
  if (LAB.combat && LAB.combat.syncFoes) LAB.combat.syncFoes();
}

/* Свободная клетка рядом с предметом обстановки. */
function freeNear(o, pref) {
  var order = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  if (pref) order.unshift(pref);
  for (var i = 0; i < order.length; i++) {
    var x = o.x + order[i][0], y = o.y + order[i][1];
    if (cellType(x, y) === T.ROOM && !objAt(x, y) && !npcAt(x, y) && !foeAt(x, y)) return [x, y];
  }
  /* в крайнем случае — любая свободная клетка комнаты */
  var r = CUR.fl.rooms[o.room];
  for (var yy = r.y0; yy <= r.y1; yy++) for (var xx = r.x0; xx <= r.x1; xx++) if (!objAt(xx, yy) && !npcAt(xx, yy) && !foeAt(xx, yy)) return [xx, yy];
  return [o.x, o.y];
}
function findObj(type) { var o = CUR.fl.objs; for (var i = 0; i < o.length; i++) if (o[i].type === type) return o[i]; return null; }

/* Вход на этаж. how: start, down (сверху по лестнице), up (снизу), elev, gatedown (через шлюз), load, respawn. */
function enterFloor(L, F, how, silent) {
  if (CUR.fs) syncFloorState();
  G.L = L; G.F = F;
  var fl = LAB.getFloor(G.seed, L, F), fs = fsFor(L, F);
  CUR.fl = fl; CUR.fs = fs; CUR.key = L + "-" + F; CUR.room = -9; CUR.focus = null;
  CUR.seen = decodeSeen(fs.seen);
  if (LAB.combat) LAB.combat.loadFoes();
  var spot = null, o;
  if (how === "down" || how === "start") { o = findObj("stairs_up") || findObj("wake") || findObj("gate_sealed"); spot = freeNear(o); }
  else if (how === "up") { o = findObj("stairs_down"); spot = freeNear(o); }
  else if (how === "elev") { o = findObj("elevator"); spot = freeNear(o); }
  else if (how === "gatedown") { o = findObj("gate_sealed"); spot = freeNear(o); }
  else if (how === "respawn" && G.checkpoint && G.checkpoint.L === L && G.checkpoint.F === F) { spot = [G.checkpoint.x, G.checkpoint.y]; if (!passable(spot[0], spot[1])) { o = findObj("capsule") || findObj("stairs_up") || findObj("gate_sealed") || findObj("elevator"); spot = freeNear(o); } }
  else if (how === "load") { spot = [G.x, G.y]; if (!passable(spot[0], spot[1])) { o = findObj("stairs_up") || findObj("elevator") || findObj("wake") || findObj("gate_sealed"); spot = freeNear(o); } }
  if (!spot) { o = findObj("elevator"); spot = freeNear(o); }
  G.x = spot[0]; G.y = spot[1];
  G.visited[L + "-" + F] = 1;
  G.maxF[L] = Math.max(G.maxF[L] || 0, F);
  markSeen();
  A("enterFloor", L, F);
  if (!silent) {
    var lev = LAB.LEVELS[L];
    var head = (how === "gatedown" || how === "start") ? "Уровень " + L + ", " + lev.name + ". " + lev.desc + " Этаж " + F + "." : "Уровень " + L + ", этаж " + F + ".";
    if (how === "respawn") head = "«Эхо» вернуло вас в капсулу восстановления. Уровень " + L + ", этаж " + F + ".";
    say(head);
    roomCheck(true);
  } else roomCheck(false, false, true);
  if (LAB.combat) LAB.combat.wake();
  UIx("refresh");
  autosave();
}
game.enterFloor = enterFloor;

/* ════════ ОПИСАНИЯ ════════ */
function objName(o) {
  if (!o) return "";
  if (o.type === "terminal") return { sec: "Терминал безопасности", sci: "Научный терминал", eng: "Инженерный терминал" }[o.sub] || "Терминал";
  if (o.type === "hq") return "Штаб: " + LAB.FACTIONS[o.faction].n;
  if (o.type === "stairs_down" && o.blocked) return "Лестница вниз (завалена)";
  if (o.type === "stairs_up" && o.blocked) return "Лестница вверх (завалена)";
  if (o.type === "reactor" && G.done) return "Пульт реактора (выключен)";
  return LAB.OBJ[o.type] ? LAB.OBJ[o.type].n : o.type;
}
game.objName = objName;
function npcName(n) { return n.robot ? n.n : n.prof + " " + n.n; }
game.npcName = npcName;

function lockText(d) {
  var lk = d.lock;
  if (!lk) return "дверь без замка";
  if (lk.type === "card") return "картридер, нужен " + LAB.TIERS[lk.tier].n.toLowerCase();
  if (lk.type === "key") return "замок под ключ: " + lk.keyName.replace("Ключ от двери: ", "ключ от помещения «") + (lk.keyName.indexOf("«") < 0 ? "»" : "");
  if (lk.type === "code") return "кодовый замок на четыре цифры";
  if (lk.type === "power") return "силовой замок, этаж обесточен";
  if (lk.type === "rubble") return "проход завален обломками";
  if (lk.type === "lockdown") return "блокировка охраны";
  if (lk.type === "gate") return LAB.LEVELS_N === G.L ? "гермодверь реактора, нужен ключ доступа к «Истоку»" : "гермодверь шлюза, нужна шлюзовая ключ-карта уровня " + G.L;
  return "заперто";
}
game.lockText = lockText;

/* Почему дверь не открыть (пусто — можно). */
function doorBlock(d) {
  var lk = d.lock, fs = CUR.fs;
  if (!lk || fs.doors[d.id] === 1 || fs.doors[d.id] === 2) return "";
  if (lk.type === "secret") return secretFound(d) ? "" : "стена";
  if (lk.type === "card") return G.tier >= lk.tier ? "" : "Нужен " + LAB.TIERS[lk.tier].n.toLowerCase() + ".";
  if (lk.type === "key") return G.keys[lk.key] ? "" : "Нужен ключ: «" + lk.keyName.replace("Ключ от двери: ", "") + "».";
  if (lk.type === "code") return "Нужен код из четырёх цифр.";
  if (lk.type === "power") return fs.power ? "" : "Нет питания. Запустите магнетронную установку этажа.";
  if (lk.type === "rubble") return fs.rubble ? "" : "Проход завален. Расчистить может аннигиляционный импульс позитронной установки.";
  if (lk.type === "lockdown") return fs.lockdown ? "" : "Блокировка охраны. Снимите её на терминале безопасности этажа.";
  if (lk.type === "gate") return (G.L === LAB.LEVELS_N ? G.core : G.gate[G.L]) ? "" : (G.L === LAB.LEVELS_N ? "Нужен ключ доступа к реактору «Исток»: он у стража Ядра." : "Нужна шлюзовая ключ-карта уровня " + G.L + ": " + (LAB.LEVELS[G.L].card === "hidden" ? "её спрятали где-то на этом этаже — слушайте маяк ключ-карты." : "её носит страж этого этажа."));
  return "Заперто.";
}
game.doorBlock = doorBlock;

function itemName(it) {
  switch (it.kind) {
    case "ammo": return LAB.AMMO[it.ammo].n + (it.n > 1 ? ", " + it.n + " шт." : "");
    case "item": return LAB.ITEMS[it.item].n + (it.n > 1 ? ", " + it.n + " шт." : "");
    case "credits": return it.n + " " + plural(it.n, "кредит", "кредита", "кредитов");
    case "weapon": return it.w.name;
    case "pass": return LAB.TIERS[it.tier].n;
    case "elevpass": return "Пропуск лифта уровня " + it.L;
    case "gatepass": return it.core ? "Ключ доступа к реактору «Исток»" : "Шлюзовая ключ-карта уровня " + it.L;
    case "armor": return it.a.name + ", защита " + LAB.armorDef(it.a);
    case "key": return it.n;
    case "note": return "Записка «" + noteText(it).t + "»";
    case "sample": return "Образец «Колыбели» номер " + (it.sid + 1);
    case "chip": return "Чип импланта «" + implantDef(it.implant).n + "»";
  }
  return "Вещь";
}
game.itemName = itemName;
function itemKind(it) {
  if (it.kind === "ammo") return it.ammo === "energy" ? "bat" : it.ammo === "magnetron" ? "mag" : "pos";
  if (it.kind === "item") {
    var k = it.item;
    if (k === "medkit_s" || k === "medkit_l") return "med";
    if (k === "stim" || k === "antidote" || k === "energy_d") return "stim";
    if (k === "emp") return "gren";
    if (k === "plate") return "plate";
    if (k === "decoder") return "decoder";
    return "part";
  }
  if (it.kind === "credits") return "cr";
  if (it.kind === "elevpass") return "liftpass";
  if (it.kind === "gatepass") return it.core ? "corekey" : "gatecard";
  return it.kind; /* weapon, armor, pass, key, note, sample, chip */
}
game.itemKind = itemKind;
function implantDef(id) { for (var i = 0; i < LAB.IMPLANTS.length; i++) if (LAB.IMPLANTS[i].id === id) return LAB.IMPLANTS[i]; return LAB.IMPLANTS[0]; }
game.implantDef = implantDef;

function noteText(it) {
  var h = LAB.hash32(it.id + ":" + G.L + ":" + G.F);
  if (it.note === "story") {
    var s = LAB.STORY[(it.L || G.L) + "-" + (it.F || G.F)];
    if (s) return { t: s.t, x: s.x, a: s.a, story: true };
    var sn = LAB.STAFF_NOTES[h % LAB.STAFF_NOTES.length];
    return { t: sn.t, x: sn.x };
  }
  if (it.note === "staff") { var n2 = LAB.STAFF_NOTES[(it.n + h) % LAB.STAFF_NOTES.length]; return { t: n2.t, x: n2.x }; }
  if (it.note === "code") return LAB.codeNote(it.code, it.room, h);
  if (it.note === "safe") return LAB.safeNote(it.code, it.room, h);
  if (it.note === "secret") return LAB.secretNote(it.room, it.side, h);
  return { t: "Записка", x: "Неразборчиво." };
}
game.noteText = noteText;

function curWeapon() { return G.weapons[G.wi] || G.weapons[0] || null; }
game.curWeapon = curWeapon;
function weaponLine(w) {
  if (!w) return "без оружия";
  if (w.ammo === "none") return w.name;
  return w.name + ", заряд " + w.charge + " из " + w.cap;
}
game.weaponLine = weaponLine;

/* Защита: надетая броня (с пластинами) и опыт героя. */
function armorValue() { var a = LAB.armorDef(G.armor) + Math.floor(G.lvl / 3); if (G.faction === "sec") a = Math.round(a * 1.15); return a; }
game.armorValue = armorValue;
/* Какую долю урона этого вида гасит броня. */
function armorRes(t) { if (!G.armor) return 0; var r = LAB.ARMORS[G.armor.base].res; return (r && r[t]) || 0; }
game.armorRes = armorRes;
function armorSpecial(k) { return !!(G.armor && LAB.ARMORS[G.armor.base].special === k); }
game.armorSpecial = armorSpecial;
function armorLine(a) {
  if (!a) return "без брони";
  var d = LAB.ARMORS[a.base], res = [];
  for (var t in d.res) res.push(LAB.ATK_T[t] + " " + Math.round(d.res[t] * 100) + "%");
  return a.name + ": защита " + LAB.armorDef(a) + (a.up ? ", пластин " + a.up + " из 5" : "") + (res.length ? ", стойкость: " + res.join(", ") : "") + (d.special ? ", особенность: " + LAB.ARMOR_SPECIAL[d.special] : "");
}
game.armorLine = armorLine;
function equipArmor(i) {
  var a = G.armors[i];
  if (!a) return;
  if (G.armor && G.armor.id === a.id) { say("Эта броня уже на вас."); return; }
  if (LAB.combat && LAB.combat.danger()) { say("Переодеваться в бою нельзя."); return; }
  G.armor = a;
  A("play", "armor_on");
  say("Надето: " + armorLine(a) + ".");
  UIx("refresh");
  autosaveSoon();
}
game.equipArmor = equipArmor;
function removeArmor() {
  if (!G.armor) { say("Брони на вас нет."); return; }
  G.armor = null;
  A("play", "armor_off");
  say("Броня снята.");
  UIx("refresh");
}
game.removeArmor = removeArmor;
function scrapArmor(i) {
  var a = G.armors[i];
  if (!a) return;
  if (G.armor && G.armor.id === a.id) { say("Сначала снимите эту броню."); return; }
  G.armors.splice(i, 1);
  var d = LAB.ARMORS[a.base];
  G.inv.scrap = (G.inv.scrap || 0) + 2 + Math.floor(d.def / 3);
  if (d.depth >= 3) G.inv.ceramic = (G.inv.ceramic || 0) + 1;
  if (d.depth >= 7) G.inv.supercond = (G.inv.supercond || 0) + 1;
  if (a.up) G.inv.plate = (G.inv.plate || 0) + a.up;
  A("play", "pry");
  say("Разобрано: " + a.name + ". Получены детали" + (a.up ? " и пластины" : "") + ".");
  UIx("refresh");
}
game.scrapArmor = scrapArmor;
/* Вставить бронепластину в надетую броню. */
function installPlate() {
  if (!G.armor) { say("Пластину некуда вставить: наденьте броню."); return false; }
  if ((G.armor.up || 0) >= 5) { say("В этой броне уже пять пластин."); return false; }
  if (!(G.inv.plate > 0)) { say("Бронепластин нет. Их собирают в мастерской из металлолома и керамокомпозита."); return false; }
  G.inv.plate--; G.armor.up = (G.armor.up || 0) + 1;
  A("play", "pick_plate");
  say("Пластина вставлена. Защита " + LAB.armorDef(G.armor) + ".");
  UIx("refresh");
  return true;
}
game.installPlate = installPlate;

/* ════════ ЖУРНАЛ, ВРЕМЯ, ОПЫТ ════════ */
function clock() { var m = Math.floor(G.min % 60), h = Math.floor(G.min / 60) % 24; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
game.clock = clock;
function journal(t) {
  G.journal.unshift("День " + G.day + ", " + clock() + " — " + t);
  if (G.journal.length > 80) G.journal.pop();
}
game.journal = journal;
function advanceTime(min) {
  G.min += min;
  while (G.min >= 24 * 60) { G.min -= 24 * 60; G.day++; G.eventUntil -= 24 * 60; }
  if (G.min >= G.eventUntil) rollEvent();
}
game.advanceTime = advanceTime;
function rollEvent() {
  var w = {}; LAB.EVENTS.forEach(function (e) { w[e.id] = e.w; });
  var tot = 0, k; for (k in w) tot += w[k];
  var x = Math.random() * tot, pick = "norm";
  for (k in w) { x -= w[k]; if (x < 0) { pick = k; break; } }
  G.eventUntil = G.min + 40 + Math.floor(Math.random() * 90);
  if (pick === G.event) return;
  G.event = pick;
  var ev = LAB.EVENTS.filter(function (e) { return e.id === pick; })[0];
  A("setEvent", pick);
  if (pick !== "norm" && ev) { LAB.sub("⚠️ " + ev.n); sayq("Обстановка: " + ev.n.toLowerCase() + ". " + (ev.desc || "")); }
  else sayq("Обстановка: штатный режим.");
}
function gainXP(n, why) {
  if (!n) return;
  G.xp += n;
  var lv = false;
  while (G.xp >= LAB.xpNeed(G.lvl)) {
    G.xp -= LAB.xpNeed(G.lvl); G.lvl++; lv = true;
    G.hpMax += 10; G.hp = G.hpMax; G.enMax += 3; G.en = G.enMax;
    G.str++; G.agi++; G.mind++; G.cha++;
  }
  if (lv) {
    LAB.UI.fanfare(); LAB.vib([60, 80, 60]);
    sayq("Новый уровень героя: " + G.lvl + ". Здоровье, энергия и характеристики выросли.");
    journal("Уровень героя " + G.lvl + ".");
  }
  UIx("refresh");
}
game.gainXP = gainXP;

/* ════════ ВЕЩИ ════════ */
function giveItem(it, quiet) {
  var phrase = itemName(it), extra = "";
  switch (it.kind) {
    case "ammo": G.ammo[it.ammo] = (G.ammo[it.ammo] || 0) + (it.n || 1); break;
    case "item":
      G.inv[it.item] = (G.inv[it.item] || 0) + (it.n || 1);
      if (it.item === "plate" && !G.tut.plate) { G.tut.plate = 1; extra = " Пластину вставляют в надетую броню: инвентарь, раздел «Броня»."; }
      break;
    case "armor":
      G.armors.push(it.a);
      if (!G.armor) { G.armor = it.a; extra = " Надето сразу. Защита " + LAB.armorDef(it.a) + "."; }
      else {
        var cur = LAB.armorDef(G.armor), nw = LAB.armorDef(it.a);
        extra = " Защита " + nw + (nw > cur ? ", выше надетой (" + cur + ")" : nw < cur ? ", ниже надетой (" + cur + ")" : ", как у надетой") + ". Надеть — инвентарь, раздел «Броня».";
      }
      break;
    case "credits": G.credits += it.n; break;
    case "weapon":
      G.weapons.push(it.w);
      if (!G.tut.weapon) { G.tut.weapon = 1; extra = " Выбрать оружие — свайп одним пальцем вверх и сразу вниз. Вынуть — касание тремя пальцами."; }
      break;
    case "pass":
      if (it.tier > G.tier) { G.tier = it.tier; extra = " Теперь открываются двери с картридером " + LAB.TIERS[it.tier].short + " уровня" + (it.tier > 1 ? " и ниже." : "."); }
      break;
    case "elevpass": G.elev[it.L] = true; extra = " Лифт уровня " + it.L + " теперь ваш."; break;
    case "gatepass": if (it.core) G.core = true; else G.gate[it.L] = true; extra = it.core ? " Гермодверь реактора «Исток» откроется." : " Гермошлюз на уровень ниже теперь откроется. Помните: назад пути не будет."; break;
    case "key": G.keys[it.key] = it.n; break;
    case "note": {
      var nt = noteText(it), nid = G.L + "-" + G.F + "-" + it.id;
      if (!G.notes[nid]) { G.notes[nid] = 1; G.noteList.push({ id: nid, t: nt.t, x: nt.x, a: nt.a || "", story: !!nt.story, L: G.L, F: G.F, code: it.note === "safe" ? it.code : undefined }); G.stats.notes++; gainXP(4); }
      if (it.code) G.codes[it.code] = it.room;
      break;
    }
    case "sample":
      if (!G.samples[it.sid]) { G.samples[it.sid] = 1; G.enMax += 2; G.en = Math.min(G.enMax, G.en + 10); gainXP(20); extra = " Собрано образцов: " + Object.keys(G.samples).length + " из 200. Энергия имплантов выросла."; }
      break;
    case "chip":
      if (G.implants.indexOf(it.implant) < 0) { G.implants.push(it.implant); extra = " Имплант установлен сам: «" + implantDef(it.implant).n + "». Панель имплантов — двойное касание четырьмя пальцами."; }
      else { G.credits += 60; extra = " Такой имплант уже есть — чип продан за 60 кредитов."; }
      break;
  }
  if (!quiet) A("pickup", itemKind(it));
  return phrase + (/[.!?…]$/.test(phrase) ? "" : ".") + extra;
}
game.giveItem = giveItem;

/* Подобрать всё на клетке героя — сразу, без касаний. */
function autoPickup() {
  var here = itemsAt(G.x, G.y);
  if (!here.length) return;
  var parts = [], notes = [];
  here.forEach(function (it) {
    CUR.fs.taken[it.id] = 1;
    parts.push(giveItem(it));
    if (it.kind === "note") notes.push(it);
    if (it.kind === "weapon" && !G.tut.wpnPick) G.tut.wpnPick = 1;
  });
  say("Подобрано: " + parts.join(" "), { interrupt: false });
  LAB.vib(15);
  /* Записка открывается окном: мир ждёт, текст дочитывается до конца. */
  if (notes.length && S.autoRead && !(LAB.combat && LAB.combat.danger())) {
    var nt = noteText(notes[0]);
    UIx("note", "«" + nt.t + "»", (nt.a ? nt.a + ". " : "") + nt.x + (notes.length > 1 ? " Остальные записки — в инвентаре, раздел «Записки»." : ""), null, { queue: true });
  } else if (notes.length) sayq("Прочитать записку — инвентарь, раздел «Записки».");
  checkQuests();
  UIx("refresh");
  autosaveSoon();
}
game.autoPickup = autoPickup;

/* ════════ ДВИЖЕНИЕ ════════
   Шаг — без слов: куда идёте, вы и так знаете. Слышно шаги по полу уровня,
   удар о стену (металл), скрип двери. Речь — только когда есть что сказать:
   дверь заперта, впереди враг, рядом предмет. */
var lastMove = 0;
function tryMove(dir, run) {
  if (!game.entered || game.paused || G.done) return false;
  if (LAB.ui && LAB.ui.layer()) return false;
  var now = Date.now();
  var minGap = run ? 180 : 0;
  if (G.st.slow > 0) minGap = Math.max(minGap, 420);
  if (now - lastMove < minGap) return false;
  if (G.st.web > 0) { A("play", "web_stuck"); sayq("Вы в паутине. Рвёте её..."); G.st.web = Math.max(0, G.st.web - 1); return false; }
  var d = DIRS[dir]; if (!d) return false;
  G.face = dir;
  var nx = G.x + d[0], ny = G.y + d[1];
  var tt = cellType(nx, ny);
  var f = foeAt(nx, ny);
  if (f) { bumpFocus({ type: "foe", ref: f, dir: dir }); A("bump"); sayOnce("foe" + f.id, f.name + " вплотную! Выньте оружие — касание тремя пальцами."); return false; }
  if (tt === T.WALL) {
    var sd = hiddenSecretAt(nx, ny);
    A("bumpWall", dir); LAB.vib(25);
    if (sd) { bumpFocus({ type: "secret", ref: sd, dir: dir }); sayOnce("wall" + nx + "," + ny, "Из щели у пола тянет сквозняком. Двойное касание — простучать стену."); }
    return false;
  }
  if (tt === T.DOOR) {
    var door = CUR.fl.doorAt[idx(nx, ny)];
    if (door.lock && door.lock.type === "secret" && !secretFound(door)) { A("bumpWall", dir); LAB.vib(25); bumpFocus({ type: "secret", ref: door, dir: dir }); sayOnce("wall" + nx + "," + ny, "Из щели у пола тянет сквозняком. Двойное касание — простучать стену."); return false; }
    if (!doorOpen(door)) {
      var why = doorBlock(door);
      bumpFocus({ type: "door", ref: door, dir: dir });
      if (!door.lock && S.autoDoors) { openDoor(door, true); }
      else {
        A("play", door.lock ? "door_locked" : "door_knock");
        var txt;
        if (!door.lock) txt = "Закрытая дверь. Двойное касание — открыть.";
        else txt = "Дверь: " + lockText(door) + "." + (why ? " " + why + " Двойное касание — действия." : " Пропуск есть: двойное касание — открыть.");
        sayOnce("door" + door.id, txt);
        if (!G.tut.door && door.lock) { G.tut.door = 1; sayq("У запертой двери коснитесь экрана одним пальцем дважды: появятся действия."); }
        return false;
      }
    }
  }
  var o = objAt(nx, ny), n = npcAt(nx, ny);
  if (o) {
    bumpFocus({ type: "obj", ref: o, dir: dir });
    A("bumpSoft", o);
    sayOnce("obj" + o.id, objName(o) + ". Двойное касание — действия.");
    if (!G.tut.obj) { G.tut.obj = 1; sayq("К предметам подходят вплотную. Двойное касание одним пальцем — список действий."); }
    return false;
  }
  if (n) {
    bumpFocus({ type: "npc", ref: n, dir: dir });
    A("npcHello", n);
    sayOnce("npc" + n.id, npcName(n) + ". Двойное касание — поговорить.");
    return false;
  }
  /* шаг */
  lastMove = now;
  var from = [G.x, G.y];
  G.x = nx; G.y = ny;
  G.stats.steps++;
  var loud = armorSpecial("strength") ? 2 : 0, quiet = armorSpecial("stealth");
  G.noise = Math.max(G.noise, Math.round(((run ? 6 : 3) + loud) * (quiet ? 0.5 : 1)));
  advanceTime(run ? 0.6 : 1);
  CUR.focus = null;
  A("step", surfaceAt(nx, ny), run, tt === T.DOOR);
  if (tt === T.DOOR) A("doorPass", CUR.fl.doorAt[idx(nx, ny)]);
  markSeen();
  autoPickup();
  roomCheck(false, run);
  announceNear();
  checkQuests();
  if (LAB.combat) LAB.combat.afterPlayerMove(from);
  UIx("refresh");
  return true;
}
game.tryMove = tryMove;

var lastSay = {};
function sayOnce(key, text, gap) {
  var now = Date.now();
  if (lastSay[key] && now - lastSay[key] < (gap || 2500)) { return; }
  lastSay[key] = now;
  say(text);
}
function bumpFocus(f) { CUR.focus = f; CUR.lastBump = Date.now(); }

/* Подошли вплотную к предмету или выжившему — назвать его один раз.
   У лифта, лестницы, терминала, установки — сразу подсказка про действия. */
var nearSaid = {};
function announceNear() {
  var out = [];
  ["N", "E", "S", "W"].forEach(function (k) {
    var dd = DIRS[k], x = G.x + dd[0], y = G.y + dd[1];
    var o = objAt(x, y), n = npcAt(x, y);
    if (o) {
      var key = CUR.key + ":" + o.id, now = Date.now();
      if (nearSaid[key] && now - nearSaid[key] < 20000) return;
      nearSaid[key] = now;
      var opened = (o.type === "crate" || o.type === "locker" || o.type === "desk" || o.type === "corpse" || o.type === "safe") && objState(o).open;
      out.push(objName(o) + (opened ? ", пусто" : "") + " " + LAB.DIRN[k]);
    }
    if (n) {
      var keyn = CUR.key + ":" + n.id, now2 = Date.now();
      if (nearSaid[keyn] && now2 - nearSaid[keyn] < 20000) return;
      nearSaid[keyn] = now2;
      out.push(npcName(n) + " " + LAB.DIRN[k]);
    }
  });
  if (!out.length) return;
  A("near");
  sayq(out.join(". ") + "." + (G.tut.near ? "" : " Двойное касание — действия."));
  G.tut.near = 1;
}
game.announceNear = announceNear;

/* Под ногами — пол уровня: у каждого уровня свой. */
function surfaceAt(x, y) {
  return LAB.LEVELS[G.L].surf;
}
game.surfaceAt = surfaceAt;

function hiddenSecretAt(x, y) {
  var d = doorAt(x, y);
  if (d && d.lock && d.lock.type === "secret" && !secretFound(d)) return d;
  return null;
}

/* Смена помещения: рассказать, куда пришли. */
function roomCheck(full, run, mute) {
  var r = roomAt(G.x, G.y), id = r ? r.id : (cellType(G.x, G.y) === T.DOOR ? -2 : -1);
  if (id === CUR.room && !full) return;
  var prev = CUR.room;
  CUR.room = id;
  if (mute) { A("setRoom", id >= 0 ? r : null); CUR.room = -9; return; }
  if (id === -2) return; /* в дверном проёме */
  if (id === -1) { if (prev !== -1) A("setRoom", null); return; }
  A("setRoom", r);
  var first = !CUR.fs.objs["room" + r.id];
  CUR.fs.objs["room" + r.id] = 1;
  var parts = [r.name + "."];
  if (first || full) {
    parts.push(LAB.ROOMS[r.type].desc);
    var ex = roomExits(r);
    if (ex) parts.push(ex);
  }
  var stuff = roomStuff(r, !(first || full));
  if (stuff) parts.push(stuff);
  if (run && !first) parts = [r.name + "."];
  sayq(parts.join(" "));
}
game.roomCheck = roomCheck;

function roomExits(r) {
  var out = [];
  r.doors.forEach(function (did) {
    var d = CUR.fl.doors[parseInt(did.slice(1), 10)];
    if (d.lock && d.lock.type === "secret" && !secretFound(d)) return;
    var side = sideOfDoor(r, d);
    var st = doorOpen(d) ? "открытая" : d.lock && doorBlock(d) ? "заперта" : "закрыта";
    out.push(LAB.DIRN[side] + " — дверь, " + st);
  });
  /* коридоры без двери у этой комнаты */
  var seenC = {};
  for (var y = r.y0; y <= r.y1; y++) for (var x = r.x0; x <= r.x1; x++) {
    [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]].forEach(function (q) {
      var nx = x + q[1], ny = y + q[2];
      if (cellType(nx, ny) === T.CORR && !seenC[q[0]]) { seenC[q[0]] = 1; out.push(LAB.DIRN[q[0]] + " — проход в коридор"); }
    });
  }
  return out.length ? "Выходы: " + out.join("; ") + "." : "";
}
function sideOfDoor(r, d) { return d.x > r.x1 ? "E" : d.x < r.x0 ? "W" : d.y > r.y1 ? "S" : "N"; }
function roomStuff(r, brief) {
  var objs = brief ? [] : CUR.fl.objs.filter(function (o) { return o.room === r.id; }).map(function (o) { return objName(o) + " " + relDir(o.x, o.y); });
  var npcs = CUR.fl.npcs.filter(function (n) { return n.room === r.id; }).map(function (n) { return npcName(n) + " " + relDir(n.x, n.y); });
  var foes = LAB.combat ? LAB.combat.visibleFoes(8).map(function (f) { return f.name + " " + relDir(f.x, f.y); }) : [];
  var items = floorItems().filter(function (it) { var rr = roomAt(it.x, it.y); return rr && rr.id === r.id; }).map(function (it) { return itemName(it) + " " + relDir(it.x, it.y); });
  var s = [];
  if (objs.length) s.push("Здесь: " + objs.join(", ") + ".");
  if (npcs.length) s.push("Живые: " + npcs.join(", ") + ".");
  if (items.length) s.push("На полу: " + items.slice(0, 5).join(", ") + (items.length > 5 ? " и ещё " + (items.length - 5) : "") + ".");
  if (foes.length) s.push("Опасность: " + foes.join(", ") + "!");
  return s.join(" ");
}
function relDir(x, y) {
  var dx = x - G.x, dy = y - G.y, d = Math.max(Math.abs(dx), Math.abs(dy));
  if (!d) return "рядом";
  return LAB.dirWord(dx, dy).replace("здесь", "рядом") + ", " + stepsW(d);
}
game.relDir = relDir;

/* ════════ ОСМОТРЕТЬСЯ (два пальца вверх) ════════ */
function lookAround() {
  if (!game.entered) return;
  var r = roomAt(G.x, G.y), parts = [];
  parts.push("Уровень " + G.L + ", этаж " + G.F + ".");
  if (r) {
    parts.push(r.name + ". " + LAB.ROOMS[r.type].desc);
    var ex = roomExits(r); if (ex) parts.push(ex);
    var st = roomStuff(r); if (st) parts.push(st);
  } else {
    parts.push(cellType(G.x, G.y) === T.DOOR ? "Дверной проём." : "Коридор.");
    var ways = [];
    ["N", "E", "S", "W"].forEach(function (k) {
      var d = DIRS[k], nx = G.x + d[0], ny = G.y + d[1], tt = cellType(nx, ny);
      if (tt === T.CORR) ways.push(LAB.DIRN[k] + " — коридор");
      else if (tt === T.ROOM) { var rr = roomAt(nx, ny); ways.push(LAB.DIRN[k] + " — " + (rr ? rr.name : "помещение")); }
      else if (tt === T.DOOR) { var dd = CUR.fl.doorAt[idx(nx, ny)]; if (!(dd.lock && dd.lock.type === "secret" && !secretFound(dd))) ways.push(LAB.DIRN[k] + " — дверь" + (doorOpen(dd) ? ", открыта" : "")); }
    });
    parts.push(ways.length ? "Пути: " + ways.join("; ") + "." : "Тупик.");
    var foes = LAB.combat ? LAB.combat.visibleFoes(10) : [];
    if (foes.length) parts.push("Опасность: " + foes.map(function (f) { return f.name + " " + relDir(f.x, f.y); }).join(", ") + "!");
  }
  /* сквозняк из тайника */
  var sd = nearSecret(2);
  if (sd) parts.push("Тянет сквозняком " + LAB.DIRFROM[sd.dir] + ".");
  if (G.event !== "norm") { var ev = LAB.EVENTS.filter(function (e) { return e.id === G.event; })[0]; if (ev) parts.push("Обстановка: " + ev.n.toLowerCase() + "."); }
  say(parts.join(" "));
  A("play", "scan_soft");
}
game.lookAround = lookAround;

function nearSecret(rad) {
  var best = null;
  CUR.fl.doors.forEach(function (d) {
    if (!(d.lock && d.lock.type === "secret") || secretFound(d)) return;
    var dx = d.x - G.x, dy = d.y - G.y, dist = Math.abs(dx) + Math.abs(dy);
    if (dist <= rad && (!best || dist < best.dist)) best = { d: d, dist: dist, dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N") };
  });
  return best;
}
game.nearSecret = nearSecret;

/* ════════ ЧТО РЯДОМ (касание одним пальцем) ════════ */
function adjacentTargets() {
  var out = [];
  var order = [G.face, "N", "E", "S", "W"];
  var seen = {};
  order.forEach(function (k) {
    if (seen[k]) return; seen[k] = 1;
    var d = DIRS[k], x = G.x + d[0], y = G.y + d[1];
    var o = objAt(x, y), n = npcAt(x, y), dr = doorAt(x, y), f = foeAt(x, y);
    if (o) out.push({ type: "obj", ref: o, dir: k });
    if (n) out.push({ type: "npc", ref: n, dir: k });
    if (dr) {
      if (dr.lock && dr.lock.type === "secret" && !secretFound(dr)) out.push({ type: "secret", ref: dr, dir: k });
      else out.push({ type: "door", ref: dr, dir: k });
    }
    if (f) out.push({ type: "foe", ref: f, dir: k });
  });
  return out;
}
game.adjacentTargets = adjacentTargets;
function targetName(t) {
  if (t.type === "obj") return objName(t.ref);
  if (t.type === "npc") return npcName(t.ref);
  if (t.type === "door") return "Дверь: " + lockText(t.ref) + (doorOpen(t.ref) ? ", открыта" : "");
  if (t.type === "secret") return "Стена со сквозняком";
  if (t.type === "foe") return t.ref.name;
  return "";
}
function nearbyInfo() {
  var t = adjacentTargets();
  if (!t.length) {
    var r = roomAt(G.x, G.y);
    say((r ? r.name : "Коридор") + ". Рядом пусто. Осмотреться — два пальца вверх.");
    return;
  }
  say(t.map(function (q) { return targetName(q) + ", " + LAB.DIRN[q.dir]; }).join(". ") + ". Двойное касание — действия.");
}
game.nearbyInfo = nearbyInfo;

/* ════════ ДЕЙСТВИЯ (двойное касание одним пальцем) ════════ */
function interact() {
  if (!game.entered || G.done && !findObj("express")) { if (G.done) { /* после финала */ } }
  var targets = adjacentTargets();
  var f = CUR.focus;
  if (f && (Date.now() - CUR.lastBump < 60000)) {
    var still = targets.filter(function (q) { return q.ref === f.ref; })[0];
    if (still) targets = [still].concat(targets.filter(function (q) { return q.ref !== f.ref; }));
  }
  targets = targets.filter(function (q) { return q.type !== "foe"; });
  if (!targets.length) {
    var sec = nearSecret(1);
    if (sec) { secretMenu(sec.d); return; }
    say("Рядом ничего, с чем можно что-то сделать. Подойдите вплотную к двери, терминалу или установке.");
    LAB.UI.error();
    return;
  }
  if (targets.length > 1 && !(f && targets[0].ref === f.ref)) {
    UIx("menu", "Что рядом", targets.map(function (q) {
      return { label: targetName(q) + " — " + LAB.DIRN[q.dir], fn: function () { openTarget(q); } };
    }), { closeFirst: false });
    return;
  }
  openTarget(targets[0]);
}
game.interact = interact;
function openTarget(q) {
  if (q.type === "door") doorMenu(q.ref, q.dir);
  else if (q.type === "secret") secretMenu(q.ref);
  else if (q.type === "obj") objMenu(q.ref);
  else if (q.type === "npc") npcMenu(q.ref);
}
game.openTarget = openTarget;

/* ── ДВЕРИ ── */
function openDoor(d, auto) {
  CUR.fs.doors[d.id] = 2;
  A("doorOpen", d);
  if (!auto) say("Дверь открыта.");
  if (d.lock && d.lock.type === "card" && !auto) gainXP(2);
  if (LAB.combat) LAB.combat.noise(4);
  UIx("refresh");
  autosaveSoon();
}
game.openDoor = openDoor;
function closeDoor(d) {
  if (foeAt(d.x, d.y) || (G.x === d.x && G.y === d.y)) { say("В проёме кто-то стоит."); return; }
  CUR.fs.doors[d.id] = 1;
  A("doorClose", d);
  say("Дверь закрыта.");
}
function doorMenu(d, dir) {
  var items = [], why = doorBlock(d), lk = d.lock, open = doorOpen(d);
  var title = "Дверь: " + lockText(d);
  if (open) {
    items.push({ label: "Закрыть дверь", fn: function () { closeDoor(d); } });
  } else {
    items.push({ label: "Открыть", fn: function () {
      var w = doorBlock(d);
      if (!w) {
        if (lk && lk.type === "card") A("play", "card_ok");
        if (lk && lk.type === "key") A("play", "door_unlock");
        if (lk && lk.type === "gate") A("play", "gate_card");
        openDoor(d);
        if (lk && lk.type === "card") sayq("Пропуск принят.");
      } else {
        if (lk && lk.type === "card") A("play", "card_fail"); else A("play", "door_locked");
        say("Не открывается. " + w);
        if (lk && lk.type === "code") codeEntry(d);
      }
    } });
    if (lk && lk.type === "code") {
      if (G.codes[lk.code]) items.push({ label: "Набрать код из записки (" + lk.code.split("").join(" ") + ")", fn: function () { tryCode(d, lk.code); } });
      items.push({ label: "Ввести код вручную", fn: function () { codeEntry(d); } });
    }
    if (lk && (lk.type === "card" || lk.type === "code") && why) items.push({ label: "Взломать замок (мини-игра)", fn: function () { hackDoor(d); } });
    if (lk && lk.type === "card" && why && (G.inv.decoder || 0) > 0) items.push({ label: "Использовать декодер пропусков (" + G.inv.decoder + " шт.)", fn: function () { G.inv.decoder--; A("play", "card_ok"); openDoor(d); sayq("Декодер подобрал ключ. Дверь открыта."); } });
    if (lk && why && G.implants.indexOf("hack") >= 0 && ["card", "code", "lockdown", "key"].indexOf(lk.type) >= 0) items.push({ label: "Дистанционный взлом — имплант, " + implantCost("hack") + " энергии", fn: function () { if (spendEnergy("hack")) { A("play", "implant"); openDoor(d); sayq("Имплант открыл замок."); } } });
  }
  items.push({ label: "Осмотреть", fn: function () { say("Дверь " + (dir ? LAB.DIRN[dir] : "рядом") + ". " + capital(lockText(d)) + ". " + (open ? "Открыта." : (why || "Можно открыть."))); } });
  UIx("menu", title, items);
}
function tryCode(d, code) {
  A("play", "keypad");
  if (code === d.lock.code) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Код принят."); }
  else { A("play", "code_fail"); say("Неверный код."); if (LAB.combat) LAB.combat.noise(5); }
}
function codeEntry(d) {
  UIx("closeAll");
  if (!LAB.mini) return;
  LAB.mini.code(function (code) { if (code) tryCode(d, code); });
}
function hackDoor(d) {
  var lv = d.lock.type === "card" ? d.lock.tier + 1 : 2 + Math.floor(G.L / 3);
  UIx("closeAll");
  LAB.mini.hack(hackLength(lv), function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Замок взломан."); gainXP(8); }
    else { A("play", "alarm_short"); say("Взлом не удался. Сработала тревога — враги рядом насторожились."); if (LAB.combat) LAB.combat.noise(10); }
  });
}
function hackLength(lv) {
  var n = 3 + lv;
  if (G.mind >= 16) n--;
  if (G.mind >= 24) n--;
  if (G.faction === "eng") n--;
  return Math.max(3, Math.min(9, n));
}
function secretMenu(d) {
  UIx("menu", "Стена со сквозняком", [
    { label: "Простучать стену", fn: function () { revealSecret(d); } },
    { label: "Прислушаться", fn: function () { A("play", "draft"); say("За стеной пустота: звук шагов уходит в неё и возвращается глухим эхом."); } }
  ]);
}
function revealSecret(d) {
  CUR.fs.secrets[d.id] = 1; CUR.fs.doors[d.id] = 2;
  G.stats.secrets++;
  A("play", "secret_open");
  LAB.UI.fanfare();
  say("Панель поддалась — за ней тайный проход! Найдено тайников: " + G.stats.secrets + ".");
  journal("Найден тайник: уровень " + G.L + ", этаж " + G.F + ".");
  gainXP(25);
  UIx("refresh");
}
game.revealSecret = revealSecret;

/* ── ПРЕДМЕТЫ ОБСТАНОВКИ ── */
function objState(o) { var k = o.id; if (!CUR.fs.objs[k] || typeof CUR.fs.objs[k] !== "object") CUR.fs.objs[k] = {}; return CUR.fs.objs[k]; }
game.objState = objState;
function objMenu(o) {
  var st = objState(o), name = objName(o), items = [];
  A("objUse", o);
  switch (o.type) {
    case "stairs_down": case "stairs_up": {
      var down = o.type === "stairs_down";
      items.push({ label: down ? "Спуститься на этаж " + (G.F + 1) : "Подняться на этаж " + (G.F - 1), fn: function () { useStairs(o); } });
      items.push({ label: "Прислушаться к пролёту", fn: function () { listenStairs(o); } });
      break;
    }
    case "gate_down":
      items.push({ label: G.gate[G.L] ? "Вставить шлюзовую ключ-карту и спуститься на уровень " + (G.L + 1) : "Спуститься на уровень " + (G.L + 1) + " — нужна шлюзовая ключ-карта", fn: function () { useGate(o); } });
      items.push({ label: "Прислушаться к шлюзу", fn: function () { A("play", "gate_hum"); say("За створками — гул шахты и далёкий лязг. Уровень " + (G.L + 1) + ": " + LAB.LEVELS[G.L + 1].name + ". Если спуститесь, шлюз за спиной запечатается."); } });
      break;
    case "gate_sealed":
      items.push({ label: "Ощупать створки", fn: function () { A("play", "gate_knock"); say("Створки сведены намертво, засовы вошли в пазы. Наверх пути нет — только вниз."); } });
      break;
    case "elevator":
      items.push({ label: "Вызвать лифт", fn: function () { elevatorMenu(); } });
      break;
    case "wake":
      items.push({ label: "Ощупать капсулу", fn: function () { say("Ваша криокапсула. Крышка откинута, внутри ещё держится холод. На табличке выбито: «Испытуемый номер семь». Выход на поверхность закрыт карантином: путь один — вниз."); } });
      items.push({ label: "Отдохнуть в капсуле", fn: function () { rest(o); } });
      break;
    case "capsule":
      items.push({ label: "Отдохнуть четыре часа (здоровье и энергия полностью, точка возвращения)", fn: function () { rest(o); } });
      break;
    case "terminal": terminalMenu(o); return;
    case "magnetron": magnetronMenu(o); return;
    case "positron": positronMenu(o); return;
    case "reactor": reactorMenu(o); return;
    case "express":
      items.push({ label: "Подняться на поверхность", fn: function () { UIx("ending", true); } });
      break;
    case "workbench": UIx("craft"); return;
    case "vending": vendingMenu(o); return;
    case "medst": medMenu(o); return;
    case "charger": chargerMenu(o); return;
    case "implantlab": implantMenu(o); return;
    case "hq": hqMenu(o); return;
    case "crate": case "locker": case "desk": case "corpse": case "safe":
      containerMenu(o); return;
  }
  items.push({ label: "Осмотреть", fn: function () { say(name + ". " + (LAB.OBJ[o.type] ? LAB.OBJ[o.type].desc : "")); } });
  UIx("menu", name, items);
}
game.objMenu = objMenu;

function listenStairs(o) {
  var L = G.L, F = o.type === "stairs_down" ? G.F + 1 : G.F - 1;
  if (F < 1 || F > LAB.FLOORS_N) { say("Тишина."); return; }
  var fl = LAB.getFloor(G.seed, L, F);
  var n = fl.foes.length, txt;
  if (o.blocked) txt = "Пролёт завален: сквозь обломки едва слышен гул.";
  else if (!n) txt = "Снизу тихо, только вентиляция.";
  else txt = n > 8 ? "Оттуда слышно много шагов и голосов тварей. Там опасно." : n > 4 ? "Слышно движение и рык. Там кто-то есть." : "Еле слышны редкие шорохи.";
  A("play", "draft");
  say(txt);
}

function useStairs(o) {
  if (o.blocked) { A("play", "rubble_hit"); say("Лестница завалена: обломки не сдвинуть. Воспользуйтесь лифтом уровня" + (G.elev[G.L] ? "." : " — пропуск лифта лежит на втором этаже уровня.")); return; }
  if (LAB.combat && LAB.combat.hunted()) { say("За вами гонятся — на лестнице вас догонят. Сначала оторвитесь или отбейтесь."); return; }
  var down = o.type === "stairs_down";
  UIx("closeAll");
  A("stairs", down);
  game.paused = true;
  setTimeout(function () {
    game.paused = false;
    enterFloor(G.L, down ? G.F + 1 : G.F - 1, down ? "down" : "up");
    if (down && G.F > 1 && !G.tut.stairs) { G.tut.stairs = 1; sayq("Лестницы на каждом этаже — в разных концах. Навигатор — два пальца вправо — подскажет путь."); }
  }, 1300);
}
/* Шлюз вниз: только с шлюзовой ключ-картой этого уровня, назад — никогда. */
function useGate(o) {
  if (!G.gate[G.L]) {
    A("play", "card_fail");
    say("Считыватель шлюза мигает красным. Нужна шлюзовая ключ-карта уровня " + G.L + ": " + (LAB.LEVELS[G.L].card === "hidden" ? "её спрятали где-то на этом этаже — слушайте маяк ключ-карты." : "её носит страж этого этажа."));
    return;
  }
  if (LAB.combat && LAB.combat.hunted()) { say("Шлюз не откроется, пока рядом бой."); return; }
  UIx("menu", "Спуск на уровень " + (G.L + 1), [
    { label: "Спуститься. Назад пути не будет", fn: function () { descend(o); } },
    { label: "Остаться на этом уровне", fn: function () { say("Ключ-карта при вас. Шлюз подождёт."); } }
  ]);
}
function descend(o) {
  var L0 = G.L;
  UIx("closeAll");
  A("gate", true);
  game.paused = true;
  say("Ключ-карта принята. Створки расходятся. Вы входите в шлюзовую камеру — и она уходит вниз.");
  setTimeout(function () {
    game.paused = false;
    /* прошлый уровень недостижим: его этажи больше не храним */
    Object.keys(G.fs).forEach(function (k) { if (k.indexOf(L0 + "-") === 0) delete G.fs[k]; });
    var left = G.quests.filter(function (q) { return !q.done && q.type !== "main" && q.L === L0; });
    G.quests = G.quests.filter(function (q) { return q.done || q.type === "main" || q.L !== L0; });
    enterFloor(L0 + 1, 1, "gatedown");
    var c = freeNear(findObj("capsule") || findObj("gate_sealed"));
    G.checkpoint = { L: G.L, F: 1, x: c[0], y: c[1] };
    A("gateSeal");
    sayq("За спиной с грохотом сходятся створки. Засовы входят в пазы. Пути наверх больше нет.");
    if (left.length) sayq("Невыполненные задания уровня " + L0 + " остались наверху.");
    gainXP(60);
    journal("Спуск на уровень " + G.L + ": " + LAB.LEVELS[G.L].name + ". Шлюз наверх запечатан.");
    UIx("levelBanner");
    autosave();
  }, 5200);
}

function elevatorMenu() {
  if (!G.elev[G.L]) { A("play", "card_fail"); say("Панель лифта мигает: «Нужен пропуск лифта уровня " + G.L + "». Пропуск лифта лежит на втором этаже уровня — у кого-то из сотрудников или на полу."); return; }
  var items = [], maxF = Math.min(LAB.FLOORS_N, (G.maxF[G.L] || 1) + 1);
  for (var F = 1; F <= LAB.FLOORS_N; F++) {
    (function (FF) {
      var here = FF === G.F, ok = FF <= maxF;
      var lab = "Этаж " + FF + (here ? " — вы здесь" : ok ? (G.visited[G.L + "-" + FF] ? "" : " — ещё не были") : " — нет доступа");
      items.push({ label: lab, disabled: !ok || here, fn: function () { if (!ok) { say("Лифт не поедет: вы ещё не спустились выше этого этажа."); return; } if (here) { say("Вы на этом этаже."); return; } ride(FF); } });
    })(F);
  }
  A("play", "elev_call");
  UIx("menu", "Лифт уровня " + G.L + " — выберите этаж", items, { focus: Math.min(LAB.FLOORS_N - 1, G.F) });
  if (!G.tut.elev) { G.tut.elev = 1; sayq("Лифт везёт на этажи, где вы уже были, и на этаж ниже самого нижнего. Свайп вправо или влево — выбрать этаж, двойное касание — ехать."); }
}
game.elevatorMenu = elevatorMenu;
function ride(F) {
  if (LAB.combat && LAB.combat.hunted()) { say("Двери лифта не закроются, пока рядом враги."); return; }
  UIx("closeAll");
  var n = Math.abs(F - G.F);
  var ms = Math.min(5000, 1600 + n * 260);
  A("elevRide", ms);
  game.paused = true;
  say("Лифт едет на этаж " + F + ".");
  setTimeout(function () { game.paused = false; enterFloor(G.L, F, "elev"); }, ms);
}

function rest(o) {
  if (LAB.combat && LAB.combat.danger()) { say("Нельзя отдыхать: рядом враги."); return; }
  UIx("closeAll");
  A("rest");
  game.paused = true;
  say("Вы ложитесь в капсулу. Гул стихает...");
  setTimeout(function () {
    game.paused = false;
    advanceTime(240);
    G.hp = G.hpMax; G.en = G.enMax; G.st.poison = 0; G.st.slow = 0;
    var c = freeNear(o);
    G.checkpoint = { L: G.L, F: G.F, x: c[0], y: c[1] };
    say("Вы проснулись. Здоровье и энергия полностью восстановлены. «Эхо» запомнило эту капсулу: если погибнете, вернётесь сюда.");
    journal("Отдых в капсуле: уровень " + G.L + ", этаж " + G.F + ".");
    UIx("refresh");
    autosave();
  }, 2800);
}

/* ── ТЕРМИНАЛЫ ── */
function terminalProtected(o) {
  if (o.sub !== "sec" || G.L < 2) return false;
  return (LAB.hash32(o.id + CUR.key) % 3) === 0;
}
function terminalMenu(o) {
  var st = objState(o);
  A("play", "term_on");
  if (terminalProtected(o) && !st.hacked) {
    UIx("menu", objName(o) + " — защищён паролем", [
      { label: "Взломать (повторите сигналы жестами)", fn: function () {
        UIx("closeAll");
        LAB.mini.hack(hackLength(1 + Math.floor(G.L / 2)), function (ok) {
          if (ok) { st.hacked = true; A("play", "term_ok"); gainXP(10); sayq("Доступ получен."); terminalMenu(o); }
          else { A("play", "term_err"); say("Доступ запрещён. Сработала тревога."); if (LAB.combat) LAB.combat.noise(12); }
        });
      } },
      { label: "Отойти", fn: function () {} }
    ]);
    say(objName(o) + ". Терминал защищён паролем.");
    return;
  }
  var items = [];
  items.push({ label: "Журналы и сообщения", fn: function () { terminalLogs(o); } });
  items.push({ label: CUR.fs.mapped ? "Карта этажа (уже загружена)" : "Загрузить карту этажа", fn: function () {
    CUR.fs.mapped = true; CUR.seen = CUR.seen || new Uint8Array(LAB.W * LAB.H);
    for (var i = 0; i < CUR.seen.length; i++) if (CUR.fl.t[i] !== T.WALL) CUR.seen[i] = 1;
    A("play", "term_ok"); say("Карта этажа загружена в «Эхо». Навигатор знает все помещения и лестницы."); UIx("refresh");
  } });
  if (o.sub === "sec") {
    if (CUR.fl.lockList.some(function (c) { return CUR.fl.locks[c] && CUR.fl.locks[c].type === "lockdown"; }))
      items.push({ label: CUR.fs.lockdown ? "Блокировка дверей снята" : "Снять блокировку дверей", fn: function () {
        if (CUR.fs.lockdown) { say("Блокировка уже снята."); return; }
        CUR.fs.lockdown = true; A("play", "term_ok"); A("play", "door_unlock");
        say("Блокировка охраны снята. Двери с блокировкой на этом этаже открываются."); gainXP(6);
      } });
    items.push({ label: CUR.fs.turrets ? "Отключить турели этажа" : "Турели отключены", fn: function () {
      if (!CUR.fs.turrets) { say("Турели уже отключены."); return; }
      CUR.fs.turrets = false; A("play", "term_ok"); say("Турели этажа отключены."); gainXP(6);
      if (LAB.combat) LAB.combat.turretsOff();
    } });
    items.push({ label: CUR.fs.robots ? "Роботы перепрошиты" : "Перепрошить роботов этажа (взлом)", fn: function () {
      if (CUR.fs.robots) { say("Роботы этажа уже не враждебны."); return; }
      UIx("closeAll");
      LAB.mini.hack(hackLength(3 + Math.floor(G.L / 2)), function (ok) {
        if (ok) { CUR.fs.robots = true; if (LAB.combat) LAB.combat.robotsCalm(); A("play", "term_ok"); say("Прошивка ОКО на этом этаже переписана. Роботы этажа вас больше не трогают."); gainXP(20); }
        else { A("play", "term_err"); say("Перепрошивка сорвалась. ОКО знает, где вы."); if (LAB.combat) LAB.combat.noise(14); }
      });
    } });
  }
  if (o.codeFor) items.push({ label: "Коды доступа этажа", fn: function () { G.codes[o.code] = o.codeRoom; A("play", "term_beep"); say("В базе кодов: дверь «" + o.codeRoom + "» — код " + o.code.split("").join(" ") + ". Код запомнен."); } });
  if (o.sub === "sci") items.push({ label: objState(o).data ? "Данные уже скачаны" : "Скачать исследовательские данные", fn: function () {
    if (st.data) { say("Данные уже скачаны."); return; }
    st.data = true; var cr = 15 + G.L * 5; G.credits += cr; A("play", "term_ok"); say("Данные проекта скопированы в «Эхо». За них дадут " + cr + " кредитов — уже начислено."); gainXP(8);
  } });
  if (o.sub === "eng") items.push({ label: "Состояние энергосистемы", fn: function () {
    var t = CUR.fl.needPower ? (CUR.fs.power ? "Питание этажа восстановлено." : "Этаж частично обесточен: силовые двери закрыты. Магнетронная установка ждёт настройки.") : "Питание этажа в норме.";
    if (CUR.fl.needRubble) t += CUR.fs.rubble ? " Завалы расчищены." : " Есть завал: его снесёт аннигиляционный импульс позитронной установки.";
    say(t);
  } });
  items.push({ label: "Связь: перехваченные переговоры", fn: function () { A("play", "radio"); say(rumor()); } });
  items.push({ label: "Выйти из терминала", fn: function () { A("play", "term_off"); } });
  UIx("menu", objName(o), items);
}
function terminalLogs(o) {
  var key = G.L + "-" + G.F;
  var story = LAB.STORY[key];
  var t = [];
  if (story) t.push("Запись: «" + story.t + "». " + story.x);
  if (o.codeFor) { t.push("Служебная запись: код двери «" + o.codeRoom + "» — " + o.code.split("").join(" ") + "."); G.codes[o.code] = o.codeRoom; }
  var sec = CUR.fl.doors.filter(function (d) { return d.lock && d.lock.type === "secret" && !secretFound(d); })[0];
  if (sec && LAB.hash32(o.id) % 2 === 0) t.push("Заявка на ремонт: «В помещении " + CUR.fl.rooms[sec.other].name + " сквозит из стены. Проверить». Заявка не выполнена.");
  if (!t.length) t.push(LAB.STAFF_NOTES[LAB.hash32(o.id + key) % LAB.STAFF_NOTES.length].x);
  A("play", "term_beep");
  UIx("note", "Журналы терминала", t.join(" "));
}
function rumor() {
  var R = [
    "— Седьмой проснулся. — Ты уверен? — Его капсула пуста. — Тогда ОКО скоро узнает.",
    "— Кто-нибудь слышит? Это пост восемь. Нас трое. Двери держат. Батареи кончаются.",
    "— Лифт третьего уровня ходит сам по себе. Кто-то вызывает его ночью.",
    "— Не трогайте синие ящики на складе. В них не детали.",
    "— Зоя, приём. Это Савельев. Магнетрон на шестом опять скачет, держи людей подальше.",
    "— ...повторяю: Ядро не отвечает. Если кто-то слышит — не спускайтесь ниже девятого без чёрного пропуска.",
    "— Они идут на звук. Говорите шёпотом. Шёпотом!",
    "— Я видел его — седьмого. Он идёт вниз. Один."
  ];
  return R[Math.floor(Math.random() * R.length)];
}

/* ── МАГНЕТРОН ── */
function magnetronMenu(o) {
  var st = objState(o), items = [];
  A("play", "mag_hum_short");
  if (!st.tuned) {
    items.push({ label: "Настроить резонатор (мини-игра на слух)", fn: function () {
      UIx("closeAll");
      LAB.mini.tune(function (ok) {
        if (ok) { st.tuned = true; A("play", "mag_on"); gainXP(12); say("Резонатор настроен. Установка вышла на режим."); magnetronMenu(o); }
        else say("Настройка прервана.");
      });
    } });
  } else {
    if (CUR.fl.needPower && !CUR.fs.power) items.push({ label: "Подать питание на этаж", fn: function () {
      CUR.fs.power = true; A("play", "power_on"); say("Питание подано. Силовые двери этажа открываются."); journal("Восстановлено питание этажа " + G.F + "."); gainXP(15); UIx("refresh");
    } });
    items.push({ label: "Зарядить магнетронные ячейки", fn: function () {
      if (st.cool && st.cool > G.min + G.day * 1440) { say("Установка остывает. Зарядить можно позже."); return; }
      st.cool = G.min + G.day * 1440 + 120;
      G.ammo.magnetron += 2; A("play", "pick_mag"); say("Заряжено две магнетронные ячейки. Всего: " + G.ammo.magnetron + ".");
    } });
    items.push({ label: "Перегрузка: ЭМИ-импульс по роботам рядом", fn: function () {
      if (st.over && st.over > G.min + G.day * 1440) { say("Установка ещё не остыла после перегрузки."); return; }
      st.over = G.min + G.day * 1440 + 360;
      A("play", "mag_overload");
      var n = LAB.combat ? LAB.combat.areaDamage(G.x, G.y, 6, 60 + G.L * 18, "emp") : 0;
      G.hp = Math.max(1, G.hp - Math.round(G.hpMax * 0.08));
      say("Импульс! " + (n ? "Задето целей: " + n + "." : "Роботов рядом не было.") + " Вас тоже тряхнуло.");
      UIx("refresh");
    } });
  }
  items.push({ label: "Осмотреть", fn: function () { say(LAB.OBJ.magnetron.desc + (st.tuned ? " Резонатор настроен." : " Резонатор сбит: биения двух тонов слышны даже без прибора.")); } });
  UIx("menu", "Магнетронная установка", items);
}
/* ── ПОЗИТРОН ── */
function positronMenu(o) {
  var st = objState(o), items = [];
  A("play", "pos_hum_short");
  if (!st.stable) {
    items.push({ label: "Стабилизировать ловушку (мини-игра на ритм)", fn: function () {
      UIx("closeAll");
      LAB.mini.rhythm(3, function (ok) {
        if (ok) { st.stable = true; A("play", "pos_ok"); gainXP(14); say("Ловушка стабильна. Антивещество держится ровно."); positronMenu(o); }
        else { A("play", "pos_fail"); G.hp = Math.max(1, G.hp - Math.round(G.hpMax * 0.12)); say("Выброс энергии! Ловушка сорвалась, вас обожгло. Попробуйте ещё раз."); UIx("refresh"); }
      });
    } });
  } else {
    if (CUR.fl.needRubble && !CUR.fs.rubble) items.push({ label: "Аннигиляционный импульс: снести завал", fn: function () {
      CUR.fs.rubble = true; A("play", "pos_pulse"); say("Вспышка без света, удар без звука — и далёкий грохот осыпающихся обломков. Завал на этаже расчищен."); gainXP(15);
    } });
    items.push({ label: "Синтезировать позитронный заряд", fn: function () {
      if (st.cool && st.cool > G.min + G.day * 1440) { say("Ловушка восстанавливается. Позже."); return; }
      st.cool = G.min + G.day * 1440 + 180;
      G.ammo.positron += 1; A("play", "pick_pos"); say("Позитронный заряд готов. Всего: " + G.ammo.positron + ".");
    } });
    items.push({ label: "Позитронная томография этажа", fn: function () {
      CUR.fs.mapped = true;
      for (var i = 0; i < CUR.seen.length; i++) if (CUR.fl.t[i] !== T.WALL) CUR.seen[i] = 1;
      var n = CUR.fl.doors.filter(function (d) { return d.lock && d.lock.type === "secret" && !secretFound(d); }).length;
      var foes = LAB.combat ? LAB.combat.aliveCount() : 0;
      A("play", "scan");
      say("Томография: карта этажа загружена. Живых целей на этаже: " + foes + ". " + (n ? "Есть пустоты за стенами — тайник. Ищите сквозняк." : "Тайных пустот не найдено."));
      UIx("refresh");
    } });
  }
  items.push({ label: "Осмотреть", fn: function () { say(LAB.OBJ.positron.desc + (st.stable ? " Ловушка стабильна." : " Пульс поля неровный: ловушку нужно стабилизировать.")); } });
  UIx("menu", "Позитронная установка", items);
}

/* ── КОНТЕЙНЕРЫ ── */
function containerMenu(o) {
  var st = objState(o), name = objName(o), items = [];
  if (st.open) { say(name + ": пусто."); return; }
  if (o.type === "safe") {
    /* Сейф открывается только кодом, который игрок набирает сам; код — в записке. */
    items.push({ label: "Набрать код", fn: function () { safeCode(o); } });
    var sn = safeNoteFor(o.code);
    if (sn) items.push({ label: "Перечитать записку с кодом: «" + sn.t + "»", keep: true, fn: function () { say(sn.x, { read: true }); } });
    else items.push({ label: "Код неизвестен", keep: true, fn: function () { say("Код сейфа хозяин обычно записывает. Ищите записку на этом этаже: в ней помещение и четыре цифры."); } });
  } else if (o.type === "locker" && o.locked && !st.forced) {
    items.push({ label: "Вскрыть шкафчик силой", fn: function () {
      var hasBar = G.weapons.some(function (w) { return w.base === "crowbar"; });
      A("play", "pry");
      if (hasBar || G.str >= 14 || Math.random() < 0.4) { st.forced = true; openContainer(o); if (LAB.combat) LAB.combat.noise(6); }
      else { say("Не поддаётся. С монтировкой было бы проще."); if (LAB.combat) LAB.combat.noise(4); }
    } });
  } else {
    items.push({ label: o.type === "corpse" ? "Обыскать тело" : "Обыскать", fn: function () { openContainer(o); } });
  }
  items.push({ label: "Осмотреть", fn: function () { say(name + ". " + LAB.OBJ[o.type].desc); } });
  UIx("menu", name, items);
}
/* Набор кода сейфа: четыре диска, свайпы вверх и вниз — цифра. */
function safeCode(o) {
  UIx("closeAll");
  if (!LAB.mini) return;
  LAB.mini.code(function (c) {
    if (!c) return;
    A("play", "keypad");
    if (c === o.code) { A("play", "code_ok"); openContainer(o); return; }
    var st = objState(o);
    st.fails = (st.fails || 0) + 1;
    A("play", "code_fail");
    say("Неверный код." + (st.fails >= 3 ? " Замок громко пищит — шум слышно по этажу." : " Проверьте записку."));
    if (LAB.combat) LAB.combat.noise(st.fails >= 3 ? 8 : 3);
  }, { title: "Сейф" });
}
/* Записка с кодом этого сейфа, если игрок её подобрал. */
function safeNoteFor(code) {
  var sp = String(code).split("").join(" ");
  for (var i = G.noteList.length - 1; i >= 0; i--) {
    var n = G.noteList[i];
    if (n.code === code || (n.x && (n.x.indexOf(sp) >= 0 || n.x.indexOf(code) >= 0))) return n;
  }
  return null;
}
function openContainer(o) {
  var st = objState(o);
  st.open = true;
  A("container", o.type);
  var loot = (o.loot || []).slice();
  if (o.type === "safe") gainXP(10);
  if (!loot.length) { say(objName(o) + ": ничего полезного."); return; }
  var parts = loot.map(function (it) { return giveItem(it); });
  say("Найдено: " + parts.join(" "));
  checkQuests();
  UIx("refresh");
  autosaveSoon();
}

/* ── МАГАЗИНЫ И СЛУЖБЫ ── */
function priceK() { var k = 1 + G.L * 0.12; if (G.faction === "res") k *= 0.8; return k; }
/* Торговый терминал: расходники, броня своей глубины, скупка деталей. */
function vendingMenu(o) {
  A("play", "vend");
  UIx("menu", "Торговый терминал", vendingItems(o), { keep: true, rebuild: function () { return vendingItems(o); } });
}
function vendingItems(o) {
  var goods = [["medkit_s", 1], ["ammo:energy", 1], ["stim", 1], ["antidote", 1], ["energy_d", 1], ["ammo:magnetron", 1], ["emp", 1], ["plate", 1]];
  if (G.L >= 3) goods.push(["decoder", 1]);
  if (G.L >= 6) goods.push(["ammo:positron", 1], ["medkit_l", 1]);
  var items = goods.map(function (g) {
    var id = g[0], isAmmo = id.indexOf("ammo:") === 0, name = isAmmo ? LAB.AMMO[id.slice(5)].n : LAB.ITEMS[id].n;
    var base = isAmmo ? ({ energy: 30, magnetron: 55, positron: 140 }[id.slice(5)]) : LAB.ITEMS[id].price;
    var p = Math.round(base * priceK() * (G.faction === "sec" && isAmmo ? 0.85 : 1));
    return { label: name + " — " + p + " кредитов", fn: function () { buy(id, p); } };
  });
  /* броня: у каждого терминала свой выбор, под глубину уровня */
  var st = objState(o);
  if (!st.armor) {
    var r = LAB.Rng(G.seed, "vend:" + CUR.key + ":" + o.id);
    st.armor = [LAB.genArmor(r, G.L, G.F, { id: "va1_" + CUR.key + o.id }), LAB.genArmor(r, G.L, G.F, { min: Math.max(1, G.L - 1), id: "va2_" + CUR.key + o.id })];
  }
  st.armor.forEach(function (a, i) {
    if (!a) return;
    var p = Math.round(LAB.ARMORS[a.base].price * (1 + 0.15 * (G.L - 1)) * LAB.QUAL_MULT[a.qual] * (G.faction === "res" ? 0.8 : 1));
    items.push({ label: "Броня: " + armorLine(a) + " — " + p + " кредитов", fn: function () {
      if (!st.armor[i]) { say("Уже продано."); return; }
      if (G.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G.credits + "."); return; }
      G.credits -= p; var got = st.armor[i]; st.armor[i] = null;
      A("play", "buy");
      say("Куплено. " + giveItem({ kind: "armor", a: got }, true) + " Осталось " + G.credits + " кредитов.");
      UIx("refresh"); autosaveSoon();
    } });
  });
  /* скупка: детали и лишняя броня */
  items.push({ label: "Продать детали и лишнюю броню", keep: false, fn: function () { UIx("closeTop", true); sellMenu(); } });
  items.unshift({ label: "У вас " + G.credits + " кредитов", disabled: true, fn: function () {} });
  return items;
}
function sellMenu() {
  var items = sellItems();
  if (!items.length) { say("Продавать нечего."); return; }
  UIx("menu", "Скупка", items, { keep: true, rebuild: function () { var it = sellItems(); return it.length ? it : [{ label: "Продавать больше нечего", disabled: true, fn: function () {} }]; } });
}
function sellItems() {
  var items = [];
  LAB.PARTS.concat(["plate"]).forEach(function (pid) {
    var have = G.inv[pid] || 0; if (!have) return;
    var sp = Math.max(1, Math.round(LAB.ITEMS[pid].price * 0.5));
    items.push({ label: "Продать: " + LAB.ITEMS[pid].n + " (" + have + ") — " + sp, fn: function () { if (!(G.inv[pid] > 0)) { say("Больше нет."); return; } G.inv[pid]--; G.credits += sp; A("play", "buy"); say("Продано. Кредитов: " + G.credits + "."); } });
  });
  G.armors.forEach(function (a) {
    if (G.armor && G.armor.id === a.id) return;
    var sp = Math.round(LAB.ARMORS[a.base].price * 0.4 * LAB.QUAL_MULT[a.qual]);
    items.push({ label: "Продать броню: " + a.name + " — " + sp, fn: function () {
      var i = G.armors.indexOf(a); if (i < 0) { say("Уже продано."); return; }
      G.armors.splice(i, 1); G.credits += sp + (a.up ? a.up * 30 : 0); A("play", "buy"); say("Продано. Кредитов: " + G.credits + ".");
    } });
  });
  return items;
}
function buy(id, p) {
  if (G.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G.credits + "."); return; }
  G.credits -= p;
  if (id.indexOf("ammo:") === 0) G.ammo[id.slice(5)]++;
  else G.inv[id] = (G.inv[id] || 0) + 1;
  A("play", "buy");
  say("Куплено. Осталось " + G.credits + " кредитов.");
  UIx("refresh");
}
function medMenu(o) {
  var miss = G.hpMax - G.hp, p = Math.max(10, Math.round(miss * 0.6 * priceK()));
  UIx("menu", "Медицинская станция", [
    { label: miss > 0 ? "Лечение до полного — " + p + " кредитов" : "Вы здоровы", fn: function () {
      if (miss <= 0) { say("Сканер: повреждений нет."); return; }
      if (G.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + "."); return; }
      G.credits -= p; G.hp = G.hpMax; G.st.poison = 0; A("play", "heal"); say("Лечение завершено. Здоровье полное."); UIx("refresh");
    } },
    { label: "Снять отравление — 15 кредитов", fn: function () {
      if (!G.st.poison) { say("Отравления нет."); return; }
      if (G.credits < 15) { say("Не хватает кредитов."); return; }
      G.credits -= 15; G.st.poison = 0; A("play", "heal"); say("Отравление снято.");
    } }
  ]);
}
function chargerMenu(o) {
  var w = curWeapon();
  UIx("menu", "Зарядная станция", [
    { label: "Зарядить оружие в руках", fn: function () {
      if (!w || w.ammo !== "energy") { say("Станция заряжает только энергетическое оружие."); return; }
      w.charge = w.cap; A("play", "w_reload_e"); say(w.name + " заряжен полностью.");
    } },
    { label: "Зарядить энергобатарею — 15 кредитов", fn: function () {
      if (G.credits < 15) { say("Не хватает кредитов."); return; }
      G.credits -= 15; G.ammo.energy++; A("play", "pick_bat"); say("Энергобатарея заряжена. Всего: " + G.ammo.energy + ".");
    } }
  ]);
}
function implantCost(id) { var c = implantDef(id).cost; if (G.faction === "sci") c = Math.round(c * 0.8); return c; }
game.implantCost = implantCost;
function spendEnergy(id) {
  var c = implantCost(id);
  if (G.en < c) { LAB.UI.error(); say("Не хватает энергии: нужно " + c + ", есть " + G.en + "."); return false; }
  G.en -= c; UIx("refresh"); return true;
}
game.spendEnergy = spendEnergy;
function implantMenu(o) {
  var items = LAB.IMPLANTS.filter(function (im) { return G.implants.indexOf(im.id) < 0; }).map(function (im) {
    var p = Math.round(im.price * priceK());
    return { label: im.n + " — " + p + " кредитов. " + im.desc, fn: function () {
      if (G.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + "."); return; }
      G.credits -= p; G.implants.push(im.id); A("play", "implant"); say("Имплант «" + im.n + "» установлен. Панель имплантов — двойное касание четырьмя пальцами."); journal("Установлен имплант: " + im.n + "."); UIx("refresh");
    } };
  });
  if (!items.length) { say("Все импланты уже установлены."); return; }
  UIx("menu", "Станция имплантов", items);
}
function hqMenu(o) {
  var f = LAB.FACTIONS[o.faction];
  var items = [{ label: "Узнать о фракции", fn: function () { say(f.n + ". " + f.desc + " Выгода: " + f.perk); } }];
  if (G.faction === o.faction) items.push({ label: "Вы уже в этой фракции", disabled: true, fn: function () {} });
  else items.push({ label: G.faction ? "Перейти во фракцию «" + f.n + "»" : "Вступить во фракцию «" + f.n + "»", fn: function () {
    G.faction = o.faction; if (o.faction === "sci") G.mind += 2; LAB.UI.fanfare(); say("Вы вступили во фракцию «" + f.n + "». " + f.perk); journal("Вступление во фракцию: " + f.n + "."); UIx("refresh");
  } });
  UIx("menu", "Штаб: " + f.n, items);
}

/* ── РЕАКТОР И ФИНАЛ ── */
function reactorMenu(o) {
  var st = objState(o);
  if (G.done) { say("Пульт молчит. «Исток» спит."); return; }
  var steps = [
    { k: "mag", label: "Шаг первый: выровнять магнетронное удержание", run: function (cb) { LAB.mini.tune(cb, { hard: true }); } },
    { k: "pos", label: "Шаг второй: стабилизировать позитронную ловушку", run: function (cb) { LAB.mini.rhythm(4, cb); } },
    { k: "key", label: "Шаг третий: ввести ключ «Эхо»", run: function (cb) { LAB.mini.hack(9, cb, { title: "Ключ «Эхо»" }); } }
  ];
  var items = steps.map(function (s, i) {
    var done = !!st[s.k], allowed = i === 0 || st[steps[i - 1].k];
    return { label: s.label + (done ? " — выполнено" : allowed ? "" : " — сначала предыдущий шаг"), disabled: done || !allowed, fn: function () {
      if (done || !allowed) { say(done ? "Уже выполнено." : "Порядок важен: сначала предыдущий шаг."); return; }
      if (LAB.combat && LAB.combat.danger()) { say("Рядом враги. Пульт требует тишины."); return; }
      UIx("closeAll");
      s.run(function (ok) {
        if (!ok) { A("play", "pos_fail"); G.hp = Math.max(1, G.hp - Math.round(G.hpMax * 0.1)); say("Сбой! Поле «Истока» хлестнуло по пульту. Попробуйте снова."); UIx("refresh"); return; }
        st[s.k] = true;
        A("play", "term_ok");
        if (s.k === "key") finale(o);
        else { say(i === 0 ? "Удержание выровнено. Гул «Истока» стал ровнее." : "Ловушка замерла на вершине пульса. Остался ключ."); reactorMenu(o); }
      });
    } };
  });
  A("play", "reactor_hum_short");
  UIx("menu", "Пульт реактора «Исток»", items);
}
function finale(o) {
  G.done = true;
  journal("Ключ «Эхо» повёрнут.");
  autosave();
  UIx("ending", false);
}
game.finale = finale;

/* ════════ ВЫЖИВШИЕ ════════ */
function npcMenu(n) {
  var items = [];
  if (n.robot) {
    var lines = LAB.ROBOT_LINES[n.type] || ["..."];
    items.push({ label: "Поговорить", fn: function () { say(lines[Math.floor(Math.random() * lines.length)], { robot: true }); } });
    var tr = LAB.ROBOT_NPC[n.type].trade;
    if (tr === "med") items.push({ label: "Лечение", fn: function () { medMenu(null); } });
    if (tr === "ammo") items.push({ label: "Торговля", fn: function () { tradeMenu(n, "ammo"); } });
  } else {
    items.push({ label: "Поговорить", fn: function () {
      var lines = LAB.STORIES[n.prof] || ["..."];
      n.talk = ((n.talk || 0) + 1) % lines.length;
      say(n.n + ": " + lines[n.talk]);
    } });
    items.push({ label: "Спросить о себе", fn: function () { say(n.n + ", " + n.prof.toLowerCase() + ". " + capital(LAB.LIFE[n.life % LAB.LIFE.length]) + ". «" + LAB.VIEW[n.view % LAB.VIEW.length] + "»"); } });
    var q = G.quests.filter(function (qq) { return qq.giver === n.key && !qq.done; })[0];
    if (!q) items.push({ label: "Спросить о задании", fn: function () { takeQuest(n); } });
    else items.push({ label: "Сдать задание: " + q.short, fn: function () { completeQuest(q, n); } });
    var tr2 = LAB.PROFS[n.prof] && LAB.PROFS[n.prof].trade;
    if (tr2) items.push({ label: "Торговля", fn: function () { tradeMenu(n, tr2); } });
    items.push({ label: "Спросить дорогу", fn: function () { navigate(false, true); } });
  }
  items.push({ label: "Попрощаться", fn: function () { say(n.robot ? "До свидания. Протокол помощи ожидает." : "Береги себя, седьмой.", { robot: !!n.robot }); } });
  UIx("menu", npcName(n), items);
}
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function tradeMenu(n, kind) {
  var goods = kind === "med" ? ["medkit_s", "medkit_l", "antidote", "stim"] : kind === "parts" ? ["scrap", "wire", "chip", "cap", "lens", "magnet"] : kind === "ammo" ? ["ammo:energy", "ammo:magnetron", "emp"] : ["medkit_s", "ammo:energy", "chip", "gel", "reagent", "cap"];
  var k = priceK() * (n.robot ? 1 : 0.9);
  var items = goods.map(function (id) {
    var isAmmo = id.indexOf("ammo:") === 0, name = isAmmo ? LAB.AMMO[id.slice(5)].n : LAB.ITEMS[id].n;
    var base = isAmmo ? ({ energy: 30, magnetron: 55, positron: 140 }[id.slice(5)]) : LAB.ITEMS[id].price;
    var p = Math.max(2, Math.round(base * k));
    return { label: "Купить: " + name + " — " + p, fn: function () { buy(id, p); } };
  });
  /* продать детали */
  LAB.PARTS.forEach(function (pid) {
    var have = G.inv[pid] || 0; if (!have) return;
    var sp = Math.max(1, Math.round(LAB.ITEMS[pid].price * 0.5));
    items.push({ label: "Продать: " + LAB.ITEMS[pid].n + " (" + have + ") — " + sp, fn: function () { if (!(G.inv[pid] > 0)) return; G.inv[pid]--; G.credits += sp; A("play", "buy"); say("Продано. Кредитов: " + G.credits + "."); } });
  });
  items.unshift({ label: "У вас " + G.credits + " кредитов", disabled: true, fn: function () {} });
  UIx("menu", "Торговля: " + npcName(n), items, { keep: true });
}

/* ════════ ЗАДАНИЯ ════════ */
function takeQuest(n) {
  var h = LAB.hash32(n.key + ":" + (n.stage || 0));
  var t = h % 3, q = { id: n.key + ":" + (n.stage || 0), giver: n.key, giverName: n.n, L: G.L, F: G.F, done: false, stage: n.stage || 0 };
  if (t === 0) {
    var part = LAB.PARTS[h % LAB.PARTS.length], need = 2 + (h % 3);
    q.type = "fetch"; q.item = part; q.need = need;
    q.text = n.n + " просит принести " + need + " шт.: «" + LAB.ITEMS[part].n + "». Детали попадаются в ящиках и у роботов.";
    q.short = "принести " + LAB.ITEMS[part].n.toLowerCase() + " (" + need + ")";
  } else if (t === 1) {
    var k = 3 + (h % 4);
    q.type = "kill"; q.need = k; q.kills0 = G.stats.kills;
    q.text = n.n + " просит расчистить путь: уничтожить " + k + " врагов, где угодно.";
    q.short = "уничтожить врагов: " + k;
  } else {
    var tf = Math.min(LAB.FLOORS_N, G.F + 2 + (h % 3));
    if (tf <= G.F) { tf = LAB.FLOORS_N; }
    q.type = "visit"; q.tL = G.L; q.tF = tf;
    q.text = n.n + " просит разведать этаж " + tf + " этого уровня и вернуться с докладом. Вернуться можно по лестницам или на лифте этажей; после шлюза вниз — уже нельзя.";
    q.short = "разведать этаж " + tf;
  }
  var lvlK = 1 + G.L * 0.4;
  q.reward = { cr: Math.round((30 + q.stage * 15) * lvlK), xp: Math.round((30 + q.stage * 10) * lvlK) };
  G.quests.push(q);
  journal("Задание от " + n.n + ": " + q.short + ".");
  LAB.UI.ok();
  say("Задание: " + q.text + " Награда — " + q.reward.cr + " кредитов.");
}
function questProgress(q) {
  if (q.type === "fetch") return Math.min(G.inv[q.item] || 0, q.need) + " из " + q.need;
  if (q.type === "kill") return Math.min(G.stats.kills - q.kills0, q.need) + " из " + q.need;
  if (q.type === "visit") return (G.visited[q.tL + "-" + q.tF] ? "этаж разведан, вернитесь к " + q.giverName : "этаж " + q.tF + " ещё не разведан");
  return "";
}
game.questProgress = questProgress;
function questReady(q) {
  if (q.type === "fetch") return (G.inv[q.item] || 0) >= q.need;
  if (q.type === "kill") return G.stats.kills - q.kills0 >= q.need;
  if (q.type === "visit") return !!G.visited[q.tL + "-" + q.tF];
  return false;
}
function completeQuest(q, n) {
  if (!questReady(q)) { say("Задание ещё не выполнено: " + questProgress(q) + "."); return; }
  if (q.type === "fetch") G.inv[q.item] -= q.need;
  q.done = true;
  n.stage = (n.stage || 0) + 1;
  G.credits += q.reward.cr;
  LAB.UI.fanfare();
  say("Задание выполнено! " + q.giverName + " благодарит. Кредитов: плюс " + q.reward.cr + ".");
  journal("Выполнено задание: " + q.short + ".");
  gainXP(q.reward.xp);
  if (G.faction === "res") { G.inv.medkit_s = (G.inv.medkit_s || 0) + 1; sayq("Сопротивление делится аптечкой."); }
  UIx("refresh");
}
var lastQuestNote = {};
function checkQuests() {
  G.quests.forEach(function (q) {
    if (q.done || lastQuestNote[q.id]) return;
    if (questReady(q)) { lastQuestNote[q.id] = 1; LAB.UI.ok(); sayq("Задание «" + q.short + "» можно сдать: " + q.giverName + ", уровень " + q.L + ", этаж " + q.F + "."); }
  });
}
game.checkQuests = checkQuests;

/* ════════ НАВИГАТОР (два пальца вправо) ════════ */
var navIdx = 0, navLast = 0;
function navTargets() {
  var list = [];
  var down = findObj("stairs_down") || findObj("gate_down") || findObj("reactor");
  var el = findObj("elevator"), up = findObj("stairs_up");
  if (down) list.push({ n: down.type === "stairs_down" ? (down.blocked ? "лестница вниз (завалена)" : "лестница вниз") : down.type === "gate_down" ? "гермошлюз на уровень ниже" : "пульт реактора", o: down });
  if (el) list.push({ n: "лифт этажей", o: el });
  if (up) list.push({ n: "лестница вверх", o: up });
  var gc = floorItems().filter(function (it) { return it.kind === "gatepass" && CUR.seen && CUR.seen[idx(it.x, it.y)]; })[0];
  if (gc) list.push({ n: itemName(gc).toLowerCase(), cell: [gc.x, gc.y] });
  var vend = nearestObj(["vending"]); if (vend) list.push({ n: "торговый терминал", o: vend });
  var wb = nearestObj(["workbench"]); if (wb) list.push({ n: "мастерская", o: wb });
  var cap = findObj("capsule"); if (cap) list.push({ n: "капсула восстановления", o: cap });
  var t = nearestObj(["terminal"]); if (t) list.push({ n: "ближайший терминал", o: t });
  var m = nearestObj(["magnetron"]); if (m && CUR.fl.needPower && !CUR.fs.power) list.push({ n: "магнетронная установка", o: m });
  var p = nearestObj(["positron"]); if (p && CUR.fl.needRubble && !CUR.fs.rubble) list.push({ n: "позитронная установка", o: p });
  var it = nearestItem(); if (it) list.push({ n: "ближайшая вещь: " + itemName(it).toLowerCase(), cell: [it.x, it.y] });
  return list;
}
function nearestObj(types) {
  var best = null, bd = 1e9;
  CUR.fl.objs.forEach(function (o) { if (types.indexOf(o.type) < 0) return; var d = Math.abs(o.x - G.x) + Math.abs(o.y - G.y); if (d < bd) { bd = d; best = o; } });
  return best;
}
function nearestItem() {
  var best = null, bd = 1e9;
  floorItems().forEach(function (it) {
    var r = roomAt(it.x, it.y); if (!r) return;
    var known = CUR.seen && CUR.seen[idx(it.x, it.y)];
    if (!known) return;
    var d = Math.abs(it.x - G.x) + Math.abs(it.y - G.y); if (d < bd) { bd = d; best = it; }
  });
  return best;
}
/* Путь: по открытым дверям и тем, что можно открыть; запертые — до двери. */
function routeTo(cell, goalObj) {
  var fs = CUR.fs;
  var path = LAB.bfs(CUR.fl, fs, G.x, G.y, function (x, y) {
    if (goalObj) return Math.abs(x - goalObj.x) + Math.abs(y - goalObj.y) === 1 && !LAB.solidAt(CUR.fl, x, y);
    return x === cell[0] && y === cell[1];
  }, { passDoor: function (d) { return !doorBlock(d) && !(d.lock && d.lock.type === "secret"); } });
  return path;
}
function navigate(cycle, fromNpc) {
  if (!game.entered) return;
  var list = navTargets();
  if (!list.length) { say("Навигатору не на что указать."); return; }
  var now = Date.now();
  if (cycle && now - navLast < 4000) navIdx = (navIdx + 1) % list.length; else if (!cycle || now - navLast >= 4000) navIdx = 0;
  navLast = now;
  var tgt = list[navIdx % list.length];
  var path = routeTo(tgt.cell, tgt.o);
  if (!path) {
    /* закрыто: путь до ближайшей запертой двери на пути */
    var p2 = LAB.bfs(CUR.fl, CUR.fs, G.x, G.y, function (x, y) { return tgt.o ? (Math.abs(x - tgt.o.x) + Math.abs(y - tgt.o.y) === 1) : (x === tgt.cell[0] && y === tgt.cell[1]); }, { passDoor: function (d) { return !(d.lock && d.lock.type === "secret" && !secretFound(d)); } });
    var blockDoor = null;
    if (p2) for (var i = 0; i < p2.length; i++) { var dd = doorAt(p2[i][0], p2[i][1]); if (dd && doorBlock(dd)) { blockDoor = dd; break; } }
    if (blockDoor) {
      var pd = LAB.bfs(CUR.fl, CUR.fs, G.x, G.y, function (x, y) { return x === blockDoor.x && y === blockDoor.y; }, { goalDoors: true, passDoor: function (d) { return !doorBlock(d) && !(d.lock && d.lock.type === "secret"); } });
      var plain = blockDoor.lock && /^(card|key|code)$/.test(blockDoor.lock.type);
      say("Цель: " + tgt.n + ". Путь перекрыт: " + lockText(blockDoor) + "." + (plain ? "" : " " + doorBlock(blockDoor)) + (pd ? " До этой двери: " + describePath(pd) : ""));
      A("navPing", blockDoor.x, blockDoor.y);
    } else say("Цель: " + tgt.n + ". Пути не видно: возможно, за тайной дверью.");
    return;
  }
  say((fromNpc ? "«Иди так»: " : "") + "Цель: " + tgt.n + ". " + describePath(path) + (list.length > 1 && !fromNpc ? " Ещё раз два пальца вправо — следующая цель." : ""));
  A("navStart", path);
}
game.navigate = navigate;
function describePath(path) {
  if (!path || !path.length) return "Вы на месте.";
  var segs = [], px = G.x, py = G.y, cur = null, n = 0;
  path.forEach(function (c) {
    var d = c[0] > px ? "E" : c[0] < px ? "W" : c[1] > py ? "S" : "N";
    if (d === cur) n++; else { if (cur) segs.push([cur, n]); cur = d; n = 1; }
    px = c[0]; py = c[1];
  });
  if (cur) segs.push([cur, n]);
  var words = segs.slice(0, 4).map(function (s) { return stepsW(s[1]) + " " + LAB.DIRTO[s[0]]; });
  return "Всего " + stepsW(path.length) + ": " + words.join(", затем ") + (segs.length > 4 ? ", и дальше." : ".");
}

/* ════════ АПТЕЧКА, ОРУЖИЕ ════════ */
function useMedkit() {
  if (!game.entered) return;
  if (G.st.poison && (G.inv.antidote || 0) > 0 && G.hp > G.hpMax * 0.35) return useItem("antidote");
  var miss = G.hpMax - G.hp;
  if (miss <= 0 && !G.st.poison) { say("Здоровье полное: " + G.hp + " из " + G.hpMax + "."); return; }
  var pick = null;
  if ((G.inv.medkit_s || 0) > 0 && (miss <= 50 || !(G.inv.medkit_l > 0)) && !G.st.poison) pick = "medkit_s";
  else if ((G.inv.medkit_l || 0) > 0) pick = "medkit_l";
  else if ((G.inv.medkit_s || 0) > 0) pick = "medkit_s";
  else if ((G.inv.stim || 0) > 0) pick = "stim";
  else if (G.st.poison && (G.inv.antidote || 0) > 0) pick = "antidote";
  if (!pick) { LAB.UI.error(); say("Аптечек нет. Ищите их в медпунктах и шкафах или соберите в мастерской из биогеля и реагента."); return; }
  useItem(pick);
}
game.useMedkit = useMedkit;
function useItem(id) {
  var d = LAB.ITEMS[id];
  if (!d || !(G.inv[id] > 0)) { say("Нет: " + (d ? d.n : id) + "."); return false; }
  if (d.kind === "throw") { if (LAB.combat) LAB.combat.throwEmp(); return true; }
  if (id === "plate") return installPlate();
  if (id === "decoder") { say("Декодер применяется у двери с картридером: двойное касание у двери."); return false; }
  if (d.kind === "part") { say("Это деталь для мастерской."); return false; }
  G.inv[id]--;
  var msg = [];
  if (d.heal) { var before = G.hp; G.hp = Math.min(G.hpMax, G.hp + d.heal); msg.push("Здоровье плюс " + (G.hp - before) + ", теперь " + G.hp + " из " + G.hpMax + "."); }
  if (d.en) { G.en = Math.min(G.enMax, G.en + d.en); msg.push("Энергия " + G.en + "."); }
  if (d.cure && G.st.poison) { G.st.poison = 0; msg.push("Отравление снято."); }
  if (d.unslow) { G.st.slow = 0; G.st.web = 0; }
  A("play", id === "antidote" ? "inject" : id === "stim" || id === "energy_d" ? "inject" : "heal");
  say(d.n + ". " + msg.join(" ") + " Осталось: " + (G.inv[id] || 0) + ".");
  UIx("refresh");
  if (LAB.combat && S.turnBased) LAB.combat.tick();
  return true;
}
game.useItem = useItem;

function toggleDraw() {
  if (!game.entered) return;
  var w = curWeapon();
  if (!w) { say("Оружия нет."); return; }
  G.drawn = !G.drawn;
  A("play", G.drawn ? "w_draw" : "w_holster");
  LAB.vib(G.drawn ? [20, 30, 20] : 15);
  if (G.drawn) say("Оружие наготове: " + weaponLine(w) + "." + ammoTail(w) + (G.tut.draw ? "" : (w.rng <= 1 ? " Свайп одним пальцем — удар в ту сторону, свайп с удержанием — серия ударов." : " Свайп одним пальцем — выстрел в ту сторону, свайп с удержанием — очередь.") + " Ходить — уберите оружие тем же касанием тремя пальцами."));
  else say("Оружие убрано. Свайп — шаг.");
  G.tut.draw = 1;
  if (LAB.input) LAB.input.stopAll();
  UIx("refresh");
}
game.toggleDraw = toggleDraw;
/* Четыре пальца, касание: коротко о главном. */
function quickStatus() {
  if (!game.entered) return;
  var w = curWeapon();
  say("Здоровье " + G.hp + " из " + G.hpMax + (G.st.shield ? ", щит " + G.st.shield : "") + ". " + weaponLine(w) + "." + ammoTail(w) + (G.st.poison ? " Отравление." : ""));
}
game.quickStatus = quickStatus;
/* Три пальца вправо: окно целей навигатора. */
function navMenu() {
  if (!game.entered) return;
  if (LAB.combat && LAB.combat.jammed()) { A("play", "jam"); say("Навигатор глохнет: рядом робот с глушилкой."); return; }
  var list = navTargets();
  if (!list.length) { say("Навигатору не на что указать."); return; }
  UIx("menu", "Навигатор", list.map(function (t) {
    return { label: t.n, fn: function () { var path = routeTo(t.cell, t.o); if (path) { say("Цель: " + t.n + ". " + describePath(path)); A("navStart", path); } else navigate(false); } };
  }));
}
game.navMenu = navMenu;
function ammoTail(w) {
  if (!w || w.ammo === "none") return "";
  return " Запас: " + LAB.AMMO[w.ammo].n.toLowerCase() + " — " + (G.ammo[w.ammo] || 0) + ".";
}
function switchWeapon(step) {
  if (!game.entered) return;
  if (G.weapons.length < 2) { say("Другого оружия нет. " + weaponLine(curWeapon()) + "."); return; }
  G.wi = (G.wi + (step || 1) + G.weapons.length) % G.weapons.length;
  var w = curWeapon();
  A("play", "w_switch");
  say(weaponLine(w) + "." + ammoTail(w));
  UIx("refresh");
}
game.switchWeapon = switchWeapon;
function equipWeapon(i) {
  if (!G.weapons[i]) return;
  G.wi = i;
  A("play", "w_switch");
  say("В руках: " + weaponLine(curWeapon()) + "." + ammoTail(curWeapon()));
  UIx("refresh");
}
game.equipWeapon = equipWeapon;
function scrapWeapon(i) {
  var w = G.weapons[i];
  if (!w) return;
  if (G.weapons.length <= 1) { say("Это последнее оружие."); return; }
  if (w.id === "w_start_crowbar") { say("Монтировку лучше оставить: она открывает шкафчики."); return; }
  G.weapons.splice(i, 1);
  if (G.wi >= G.weapons.length) G.wi = 0;
  var gainP = 1 + w.rank;
  G.inv.scrap = (G.inv.scrap || 0) + 2 + w.rank;
  G.inv.chip = (G.inv.chip || 0) + Math.floor(gainP / 2);
  if (w.ammo !== "none" && w.charge > 0 && G.ammo[w.ammo] != null && w.charge >= w.cap / 2) G.ammo[w.ammo]++;
  A("play", "pry");
  say("Разобрано: " + w.name + ". Получены детали.");
  UIx("refresh");
}
game.scrapWeapon = scrapWeapon;
function reload() {
  if (!game.entered) return;
  var w = curWeapon();
  if (!w) return;
  if (w.ammo === "none") { say(capital(w.name) + " не требует батарей."); return; }
  if (w.charge >= w.cap) { say("Заряд полный: " + w.charge + " из " + w.cap + "."); return; }
  if (!(G.ammo[w.ammo] > 0)) { LAB.UI.error(); say("Нет запаса: " + LAB.AMMO[w.ammo].n.toLowerCase() + ". " + LAB.AMMO[w.ammo].desc); return; }
  G.ammo[w.ammo]--;
  w.charge = w.cap;
  A("play", w.ammo === "energy" ? "w_reload_e" : w.ammo === "magnetron" ? "w_reload_m" : "w_reload_p");
  if (LAB.combat) LAB.combat.reloadPause(w.ammo === "positron" ? 1400 : 900);
  say("Перезаряжено: " + w.cap + " выстрелов. Осталось: " + LAB.AMMO[w.ammo].n.toLowerCase() + " — " + G.ammo[w.ammo] + ".");
  UIx("refresh");
}
game.reload = reload;

/* ════════ МАСТЕРСКАЯ ════════ */
function canCraft(rc) { if (rc.minL && G.L < rc.minL) return false; for (var k in rc.need) if ((G.inv[k] || 0) < rc.need[k]) return false; return true; }
game.canCraft = canCraft;
function craft(rc) {
  if (rc.minL && G.L < rc.minL) { LAB.UI.error(); say("Такую броню здесь не собрать: чертежи и оснастка — начиная с уровня " + rc.minL + "."); return; }
  if (!canCraft(rc)) { LAB.UI.error(); say("Не хватает деталей: " + needText(rc) + "."); return; }
  if (rc.out === "wmod") {
    var w = curWeapon();
    if (!w || w.mods >= 3) { say("Оружие в руках уже несёт три модуля."); return; }
  }
  for (var k in rc.need) G.inv[k] -= rc.need[k];
  G.crafted++;
  var armorMsg = "";
  var bonus = G.faction === "eng" && G.crafted % 3 === 0;
  var times = bonus ? 2 : 1;
  for (var i = 0; i < times; i++) {
    if (rc.out.indexOf("ammo:") === 0) G.ammo[rc.out.slice(5)]++;
    else if (rc.out === "wmod") { curWeapon().mods++; curWeapon().dmg = Math.round(curWeapon().dmg * 1.15); }
    else if (rc.out.indexOf("armor:") === 0) { var na = LAB.makeArmor(rc.out.slice(6), LAB.foeLevel(G.L, G.F), 2); armorMsg = giveItem({ kind: "armor", a: na }, true); }
    else G.inv[rc.out] = (G.inv[rc.out] || 0) + 1;
  }
  A("play", rc.out.indexOf("armor:") === 0 ? "craft_armor" : "craft");
  say("Собрано: " + rc.n + (bonus ? " — и ещё одно, инженерная смекалка!" : "") + "." + (armorMsg ? " " + armorMsg : ""));
  gainXP(3);
  UIx("refresh");
}
game.craft = craft;
function needText(rc) { var s = []; for (var k in rc.need) s.push(LAB.ITEMS[k].n + " " + (G.inv[k] || 0) + " из " + rc.need[k]); return s.join(", "); }
game.needText = needText;

/* ════════ СМЕРТЬ ════════ */
function die() {
  if (G.dead) return;
  G.dead = true;
  G.stats.deaths++;
  G.drawn = false;
  if (LAB.input) LAB.input.stopAll();
  A("death");
  LAB.vib([200, 100, 300]);
  var lost = Math.round(G.credits * [0, 0.15, 0.25, 0.35][S.difficulty || 1]);
  G.credits -= lost;
  say("Вы погибли. «Эхо» удерживает сознание... Потеряно кредитов: " + lost + ".");
  journal("Гибель на уровне " + G.L + ", этаж " + G.F + ".");
  game.paused = true;
  setTimeout(function () {
    G.dead = false; game.paused = false;
    G.hp = Math.round(G.hpMax * 0.6); G.st = { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0 };
    var cp = G.checkpoint;
    if (cp && cp.L === G.L) enterFloor(cp.L, cp.F, "respawn");
    else enterFloor(G.L, G.F, G.F === 1 && G.L === 1 ? "start" : G.F === 1 ? "gatedown" : "down");
    if (LAB.combat) LAB.combat.calmAll();
  }, 4200);
}
game.die = die;

/* ════════ СОХРАНЕНИЯ: три слота и автозапись ════════ */
var SLOT_KEYS = { 1: "lab_slot1", 2: "lab_slot2", 3: "lab_slot3", auto: "lab_auto" };
function snapshot() {
  syncFloorState();
  G.stats.ms += Date.now() - (game.t0 || Date.now()); game.t0 = Date.now();
  return JSON.stringify({ meta: { L: G.L, F: G.F, lvl: G.lvl, hp: G.hp, hpMax: G.hpMax, ms: G.stats.ms, date: Date.now(), samples: Object.keys(G.samples).length }, g: G });
}
function saveSlot(n) {
  if (!game.entered) return false;
  var ok = LAB.store.set(SLOT_KEYS[n], snapshot());
  if (n !== "auto") {
    G.stats.saves++;
    if (ok) { LAB.UI.ok(); say("Игра сохранена в слот " + n + "."); }
    else { LAB.UI.error(); say("Не удалось сохранить: память устройства переполнена."); }
  }
  return ok;
}
game.saveSlot = saveSlot;
function slotInfo(n) {
  var raw = LAB.store.get(SLOT_KEYS[n]);
  if (!raw) return null;
  try { var d = JSON.parse(raw); return d.meta; } catch (e) { return null; }
}
game.slotInfo = slotInfo;
function slotText(n) {
  var m = slotInfo(n);
  var name = n === "auto" ? "Автозапись" : "Слот " + n;
  if (!m) return name + ": пусто";
  var mins = Math.round((m.ms || 0) / 60000), h = Math.floor(mins / 60), mm = mins % 60;
  var dt = new Date(m.date);
  var dd = dt.getDate() + "." + (dt.getMonth() + 1 < 10 ? "0" : "") + (dt.getMonth() + 1) + ", " + dt.getHours() + ":" + (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes();
  return name + ": уровень " + m.L + ", этаж " + m.F + ", герой " + m.lvl + "-го уровня, здоровье " + m.hp + ", в игре " + (h ? h + " ч " : "") + mm + " мин, записано " + dd;
}
game.slotText = slotText;
function loadSlot(n) {
  var raw = LAB.store.get(SLOT_KEYS[n]);
  if (!raw) { LAB.UI.error(); say("Слот пуст."); return false; }
  var d;
  try { d = JSON.parse(raw); } catch (e) { say("Запись повреждена."); return false; }
  if (!d || !d.g) { say("Запись повреждена."); return false; }
  G = migrate(d.g);
  LAB.clearFloorCache();
  game.t0 = Date.now();
  game.entered = true;
  UIx("showGame");
  enterFloor(G.L, G.F, "load", true);
  var lev = LAB.LEVELS[G.L];
  say("Игра загружена. Уровень " + G.L + ", " + lev.name + ", этаж " + G.F + ". Здоровье " + G.hp + " из " + G.hpMax + ". " + weaponLine(curWeapon()) + ".");
  roomCheck(true);
  return true;
}
game.loadSlot = loadSlot;
function migrate(g) {
  var base = newState(g.seed || "lab");
  for (var k in base) if (g[k] === undefined) g[k] = base[k];
  if (!g.st) g.st = base.st;
  for (var k2 in base.st) if (g.st[k2] === undefined) g.st[k2] = 0;
  g.dead = false;
  return g;
}
var autoTimer = null;
function autosave() { if (game.entered && !G.dead) saveSlot("auto"); }
function autosaveSoon() { clearTimeout(autoTimer); autoTimer = setTimeout(autosave, 1500); }
game.autosave = autosave;

function newGame() {
  var seed = "lab-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
  G = newState(seed);
  G.min = 6 * 60 + 40;
  LAB.clearFloorCache();
  game.t0 = Date.now();
  game.entered = true;
  UIx("showGame");
  enterFloor(1, 1, "start", true);
  say("Вы просыпаетесь в криокапсуле. Холод отпускает. «Эхо» включается: «Носитель номер семь, слышите меня? Зрение не восстановлено. Я буду вашими глазами. Шагайте свайпами. Осмотреться — два пальца вверх. Двойное касание у предмета — действия»." );
  roomCheck(true);
  journal("Пробуждение. Уровень 1, этаж 1.");
  G.quests.push({ id: "main", giver: "main", giverName: "Эхо", L: 10, F: 20, type: "main", done: false, short: "спуститься в Ядро и остановить Разлом", text: "Спуститься на десятый уровень, в Ядро, и остановить Разлом у пульта реактора «Исток»." });
}
game.newGame = newGame;

/* Состояние для меню персонажа: сначала здоровье и заряд оружия. */
function characterText() {
  var w = curWeapon();
  var lines = [];
  lines.push("Здоровье " + G.hp + " из " + G.hpMax + ".");
  lines.push("Оружие" + (G.drawn ? " в руках" : " убрано") + ": " + weaponLine(w) + "." + ammoTail(w));
  lines.push("Броня: " + (G.armor ? armorLine(G.armor) : "нет") + ". Общая защита " + armorValue() + ".");
  lines.push("Батареи: энергобатареи " + (G.ammo.energy || 0) + ", магнетронные ячейки " + (G.ammo.magnetron || 0) + ", позитронные заряды " + (G.ammo.positron || 0) + ".");
  lines.push("Аптечки " + (G.inv.medkit_s || 0) + ", большие аптечки " + (G.inv.medkit_l || 0) + ", стимуляторы " + (G.inv.stim || 0) + ", антидоты " + (G.inv.antidote || 0) + ".");
  var st = [];
  if (G.st.poison) st.push("отравление"); if (G.st.slow) st.push("замедление"); if (G.st.shield) st.push("силовой щит " + G.st.shield); if (G.st.haste) st.push("ускорение"); if (G.st.cloak) st.push("маскировка");
  if (st.length) lines.push("Состояние: " + st.join(", ") + ".");
  lines.push("Энергия имплантов " + G.en + " из " + G.enMax + ". Уровень героя " + G.lvl + ", опыт " + G.xp + " из " + LAB.xpNeed(G.lvl) + ". Сила " + G.str + ", ловкость " + G.agi + ", интеллект " + G.mind + ", харизма " + G.cha + ". Кредиты " + G.credits + ".");
  lines.push("Комплекс: уровень " + G.L + " «" + LAB.LEVELS[G.L].name + "», этаж " + G.F + ". Пропуск: " + (G.tier ? LAB.TIERS[G.tier].n.toLowerCase() : "нет") + ". Лифт этажей: " + (G.elev[G.L] ? "есть пропуск" : "нет пропуска") + ". " + (G.L < LAB.LEVELS_N ? "Шлюзовая ключ-карта уровня " + G.L + ": " + (G.gate[G.L] ? "есть" : "нет") : "Ключ доступа к «Истоку»: " + (G.core ? "есть" : "нет")) + ".");
  lines.push("Образцов " + Object.keys(G.samples).length + " из 200, тайников " + G.stats.secrets + ", записок " + G.stats.notes + ", побеждено врагов " + G.stats.kills + ". Сложность: " + LAB.DIFF[S.difficulty || 1].n.toLowerCase() + ".");
  if (G.faction) lines.push("Фракция: " + LAB.FACTIONS[G.faction].n + ".");
  return lines;
}
game.characterText = characterText;
})();
