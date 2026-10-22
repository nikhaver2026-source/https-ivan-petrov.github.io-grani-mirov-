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
/* Версия мира: этажи построены заново (широкие коридоры, тайные комнаты с
   двумя выходами, турели у дверей) — старые записи этажей к ним не подходят. */
var WORLD_V = 3;
/* (2.0) Стартовый набор — с ним носитель выходит из капсулы: монтировка и
   заряженный бластер «Искра» (выбран он), надетый защитный комбинезон
   «Ковчег», бинт, походный ремнабор, сухпаёк и кредиты на первую покупку.
   Две аптечки и две энергобатареи лежат у капсулы (world.js, шаг 12). */
var START_KIT = 2;
function newState(seed) {
  var suit = LAB.makeArmor("suit", 1, 1, "a_start_suit");
  return {
    v: 1, worldV: WORLD_V, seed: seed, L: 1, F: 1, x: 0, y: 0, face: "N",
    hp: 100, hpMax: 100, str: 10, agi: 10, mind: 10, cha: 10,
    en: 30, enMax: 30, lvl: 1, xp: 0, credits: 40,
    weapons: [LAB.makeWeapon("crowbar", 1, 0, 1, "w_start_crowbar"), LAB.makeWeapon("spark", 1, 0, 1, "w_start_spark")], wi: 1, drawn: false,
    armor: suit, armors: [suit],
    ammo: { energy: 0, magnetron: 0, positron: 0 },
    inv: { bandage: 1, fieldkit: 1, ration: 1 }, keys: {}, tier: 0, startKit: START_KIT, elev: {}, gate: {}, core: false, cores: {}, codes: {}, melodies: {}, blockSeen: {},
    notes: {}, noteList: [], samples: {}, implants: ["scan", "echo"], faction: null, crafted: 0, bp: {}, bpNpc: {},
    quests: [], journal: [], fs: {}, maxF: { 1: 1 }, visited: { "1-1": 1 },
    checkpoint: null, day: 1, min: 8 * 60, event: "norm", eventUntil: 8 * 60 + 90,
    st: { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0, jam: 0, deaf: 0, antitox: 0, bleed: 0, navjam: 0 },
    /* тело героя: сытость, бодрость, токсины, нейронагрузка (0–100) */
    /* раствор криокапсулы кормил спящего: герой просыпается сытым (1.5) */
    body: { food: 85, wake: 85, tox: 0, neuro: 0, lv: {} },
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
function foeAt(x, y) { var f = LAB.combat ? LAB.combat.foes() : CUR.foes; for (var i = 0; i < f.length; i++) if (!f[i].dead && f[i].x === x && f[i].y === y) return f[i]; return null; }
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
    var rr = 1 + (LAB.implants ? Math.round(LAB.implants.stat("map")) : 0); /* (2.0) чип картографа */
    for (var dy = -rr; dy <= rr; dy++) for (var dx = -rr; dx <= rr; dx++) if (LAB.inb(G.x + dx, G.y + dy)) CUR.seen[idx(G.x + dx, G.y + dy)] = 1;
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
  G.stair = null;
  G.L = L; G.F = F;
  /* (1.5) достижения: новые этажи и уровни */
  G.visited = G.visited || {};
  var firstVisit = !G.visited[L + "-" + F];
  if (firstVisit) { G.visited[L + "-" + F] = 1; if (LAB.ach) { LAB.ach.ev("floor", 1); LAB.ach.ev("level", L); } }
  var fl = LAB.getFloor(G.seed, L, F), fs = fsFor(L, F);
  CUR.fl = fl; CUR.fs = fs; CUR.key = L + "-" + F; CUR.room = -9; CUR.focus = null; CUR.corr = -1;
  CUR.seen = decodeSeen(fs.seen);
  if (LAB.combat) LAB.combat.loadFoes();
  if (LAB.traps) LAB.traps.enterFloor();
  var spot = null, o;
  if (how === "down" || how === "start") { o = findObj("stairs_up") || findObj("wake") || findObj("gate_sealed"); spot = freeNear(o); }
  else if (how === "up") { o = findObj("stairs_down"); spot = freeNear(o); }
  else if (how === "elev") { o = findObj("elevator"); spot = freeNear(o); }
  else if (how === "gatedown") { o = findObj("gate_sealed"); spot = freeNear(o); }
  else if (how === "restart") { o = findObj("capsule") || findObj("wake") || findObj("gate_sealed") || findObj("stairs_up"); spot = freeNear(o); }
  else if (how === "respawn" && G.checkpoint && G.checkpoint.L === L && G.checkpoint.F === F) { spot = [G.checkpoint.x, G.checkpoint.y]; if (!passable(spot[0], spot[1])) { o = findObj("capsule") || findObj("stairs_up") || findObj("gate_sealed") || findObj("elevator"); spot = freeNear(o); } }
  else if (how === "load") { spot = [G.x, G.y]; if (!passable(spot[0], spot[1])) { o = findObj("stairs_up") || findObj("elevator") || findObj("wake") || findObj("gate_sealed"); spot = freeNear(o); } }
  if (!spot) { o = findObj("elevator"); spot = freeNear(o); }
  G.x = spot[0]; G.y = spot[1];
  G.maxF[L] = Math.max(G.maxF[L] || 0, F);
  navStop(); /* навигатор ведёт только по своему этажу */
  if (firstVisit) { if (L > 10) tutor("seam"); else if (how === "down" || how === "gatedown") tutor("sector"); }
  markSeen();
  A("enterFloor", L, F);
  if (LAB.oko) LAB.oko.event("floor", { how: how });
  if (how === "gatedown" && LAB.oko) LAB.oko.event("enter");
  if (!silent) {
    var lev = LAB.LEVELS[L];
    var head = (how === "gatedown" || how === "start") ? "Уровень " + L + ", " + lev.name + ". " + lev.desc + " Этаж " + F + "." : "Уровень " + L + ", этаж " + F + ".";
    /* (2.0) мастерская этажа — с первого прихода: навигатор знает дорогу */
    if (firstVisit && fl.shop && how !== "respawn" && how !== "restart" && how !== "load") head += " На этаже мастерская: навигатор приведёт к станкам.";
    if (how === "respawn") head = (G.checkpoint && G.checkpoint.cap ? "«Эхо» вернуло вас к капсуле восстановления, к которой вы привязаны." : "«Эхо» вернуло вас к началу уровня.") + " Уровень " + L + ", этаж " + F + ".";
    if (how === "restart") head = "«Эхо» вернуло вас к началу уровня: привязки к капсуле на этом уровне не было. Уровень " + L + ", этаж " + F + ".";
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
  if (o.type === "comp" && LAB.COMPS) return (LAB.COMPS[o.kind] || LAB.COMPS.archive).n;
  if (o.type === "fx" && LAB.FIX && LAB.FIX.T[o.fx]) return LAB.FIX.T[o.fx].n;
  if (o.type === "stairs_down" && o.blocked) return "Лестница вниз (завалена)";
  if (o.type === "stairs_up" && o.blocked) return "Лестница вверх (завалена)";
  if (o.type === "reactor" && (G.done || (!o.final && G.cores && G.cores["used" + G.L]))) return "Пульт реактора (ключ повёрнут)";
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
  if (lk.type === "gate") return LAB.isReactorLevel(G.L) ? "гермодверь реактора, нужен ключ доступа к «Истоку»" : "гермодверь шлюза, нужна шлюзовая ключ-карта уровня " + G.L;
  if (lk.type === "riddle") return "голосовой замок с загадкой";
  if (lk.type === "circuit") return "электронный замок: схема реле";
  if (lk.type === "melody") return "звуковой замок: открывается мелодией";
  if (lk.type === "hazard") return "санпропускник горячей камеры: пускает только в защитном костюме";
  if (lk.type === "logic") return "логический замок: " + (LAB.puzzles ? LAB.puzzles.nameOf(lk.kind) : "задача");
  return "заперто";
}
game.lockText = lockText;

/* Почему дверь не открыть (пусто — можно). */
function okoLockLeft(d) { var fs = CUR.fs, t = fs.okoLock && fs.okoLock[d.id]; return t ? Math.max(0, Math.ceil((t - (fs.okoT || 0)) / 2)) : 0; }
game.okoLockLeft = okoLockLeft;
/* Мелодия замка — своя у каждой двери каждого этажа (номера дверей повторяются от этажа к этажу). */
function melKey(id) { return G.L + "-" + G.F + "-" + id; }
function doorBlock(d) {
  var lk = d.lock, fs = CUR.fs;
  var ol = okoLockLeft(d);
  if (ol > 0 && fs.doors[d.id] !== 2) return "Аварийная блокировка ОКО: ещё " + ol + " " + plural(ol, "секунда", "секунды", "секунд") + ". Замок можно взломать.";
  /* санпропускник проверяет костюм каждый раз, пока дверь закрыта (1.5) */
  if (lk && lk.type === "hazard" && fs.doors[d.id] !== 2) return LAB.zones ? LAB.zones.hazardBlock(d) : "Нужен защитный костюм.";
  if (!lk || fs.doors[d.id] === 1 || fs.doors[d.id] === 2) return "";
  if (lk.type === "secret") return secretFound(d) ? "" : "стена";
  if (lk.type === "card") return G.tier >= lk.tier ? "" : "Нужен " + LAB.TIERS[lk.tier].n.toLowerCase() + ".";
  if (lk.type === "key") return G.keys[lk.key] ? "" : "Нужен ключ: «" + lk.keyName.replace("Ключ от двери: ", "") + "».";
  if (lk.type === "code") return "Нужен код из четырёх цифр.";
  if (lk.type === "power") return fs.power ? "" : "Нет питания. Запустите магнетронную установку этажа.";
  if (lk.type === "rubble") return fs.rubble ? "" : "Проход завален. Расчистить может аннигиляционный импульс позитронной установки.";
  if (lk.type === "lockdown") return fs.lockdown ? "" : "Блокировка охраны. Снимите её на терминале безопасности этажа.";
  if (lk.type === "gate") return (LAB.isReactorLevel(G.L) ? hasCore(G.L) : G.gate[G.L]) ? "" : (LAB.isReactorLevel(G.L) ? "Нужен ключ доступа к реактору «Исток»: он у стража этого этажа." : "Нужна шлюзовая ключ-карта уровня " + G.L + ": " + (LAB.LEVELS[G.L].card === "hidden" ? "её спрятали где-то на этом этаже — слушайте маяк ключ-карты." : "её носит страж этого этажа."));
  if (lk.type === "riddle") return (fs.riddleWait && fs.riddleWait[d.id] > Date.now()) ? "Голосовой замок молчит после неверного ответа. Подождите." : "Голосовой замок задаёт загадку.";
  if (lk.type === "circuit") return "Схема реле горит. Погасите её.";
  if (lk.type === "logic") return "Замок ждёт решения задачи: " + (LAB.puzzles ? LAB.puzzles.nameOf(lk.kind) : "головоломка") + ".";
  if (lk.type === "melody") return G.melodies[melKey(d.id)] ? "Замок ждёт мелодию. «Эхо» её помнит." : "Замок ждёт мелодию. Её проигрывает радиоприёмник где-то на этом этаже.";
  return "Заперто.";
}
game.doorBlock = doorBlock;
game.doorOpen = doorOpen;
/* Ключ «Истока» этого уровня (на 10-м — от стража Ядра, на самом нижнем — свой). */
function hasCore(L) { return !!((G.cores && G.cores[L]) || (L === 10 && G.core)); }
game.hasCore = hasCore;

function itemName(it) {
  switch (it.kind) {
    case "ammo": return LAB.AMMO[it.ammo].n + (it.n > 1 ? ", " + it.n + " шт." : "");
    case "item": return LAB.ITEMS[it.item].n + (it.n > 1 ? ", " + it.n + " шт." : "");
    case "credits": return it.n + " " + plural(it.n, "кредит", "кредита", "кредитов");
    case "weapon": return it.w.name;
    case "pass": return LAB.TIERS[it.tier].n;
    case "elevpass": return "Пропуск лифта уровня " + it.L;
    case "gatepass": return it.core ? (LAB.isFinalLevel(it.L || G.L) && it.L !== 10 ? "Ключ настоящего «Истока»" : "Ключ доступа к реактору «Исток»") : "Шлюзовая ключ-карта уровня " + it.L;
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
  if (it.kind === "ammo") return it.ammo === "energy" ? "bat" : it.ammo === "magnetron" ? "mag" : it.ammo === "positron" ? "pos" : "bat";
  if (it.kind === "item") {
    var k = it.item;
    if (k === "medkit_s" || k === "medkit_l") return "med";
    if (k === "stim" || k === "antidote" || k === "energy_d") return "stim";
    if (k === "emp" || k === "noise") return "gren";
    if (k === "plate" || k === "repairkit" || k === "wrepair" || k === "fieldkit" || k === "engkit") return "plate"; /* ремкомплекты звенят железом */
    if (LAB.ITEMS[k] && LAB.ITEMS[k].kind === "implant") return "chip";
    if (k === "decoder" || k === "lockpick" || /^pick_/.test(k) || k === "jammer" || k === "sonar" || k === "okokey") return "decoder";
    var dd = LAB.ITEMS[k];
    if (dd && dd.kind !== "part") return dd.fx && dd.fx.heal ? "med" : dd.kind === "throw" ? "gren" : "stim";
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

/* Колода текстов: записки и почтовые ящики — без повторов, пока колода не
   кончится; порядок тасуется от зерна игры. */
function deckDraw(key, n) {
  G.decks = G.decks || {};
  var d = G.decks[key];
  if (!d || d.n !== n || d.i >= d.order.length) {
    var round = d && d.n === n ? d.round + 1 : 0, order = [];
    for (var i = 0; i < n; i++) order.push(i);
    LAB.Rng(G.seed, "deck:" + key + ":" + round).shuffle(order);
    d = G.decks[key] = { n: n, i: 0, order: order, round: round };
  }
  return d.order[d.i++];
}
function deckLeft(key, n) { var d = G.decks && G.decks[key]; return !d || d.n !== n ? n : d.order.length - d.i; }
game.deckDraw = deckDraw;
game.deckLeft = deckLeft;
/* Записка персонала: своя для уровня или общая для комплекса — из колоды. */
function staffNote(it, h, L, F) {
  L = L || G.L; F = F || G.F;
  var nid = L + "-" + F + "-" + it.id;
  G.noteIdx = G.noteIdx || {};
  var own = (LAB.NOTES_L && LAB.NOTES_L[L]) || [], gl = staffPool(L > 10 ? LAB.blockOf(L) : 0);
  var gk = "note:g" + (L > 10 ? LAB.blockOf(L) : "");
  if (!G.noteIdx[nid]) {
    var useOwn = own.length && deckLeft("note:" + L, own.length) > 0 && (h % 3 !== 0 || deckLeft(gk, gl.length) <= 0);
    G.noteIdx[nid] = useOwn ? ["L", L, deckDraw("note:" + L, own.length)] : ["g", L > 10 ? LAB.blockOf(L) : 0, deckDraw(gk, gl.length)];
  }
  var ref = G.noteIdx[nid];
  var n = ref[0] === "L" ? ((LAB.NOTES_L[ref[1]] || [])[ref[2]]) : staffPool(ref[1])[ref[2]];
  if (!n) n = gl[h % gl.length];
  return { t: n.t, x: n.x, a: n.a || "" };
}
/* Записки персонала: до Ядра — общие для «Ковчега», глубже — свои у блока. */
function staffPool(b) {
  if (b == null) b = G.L > 10 ? LAB.blockOf(G.L) : 0;
  var B = b ? LAB.BLOCKS[b] : null;
  return B && B.staff && B.staff.length ? B.staff : LAB.STAFF_NOTES;
}
function noteText(it, L, F) {
  L = L || G.L; F = F || G.F;
  var h = LAB.hash32(it.id + ":" + L + ":" + F);
  if (it.note === "story") {
    var s = LAB.STORY[(it.L || L) + "-" + (it.F || F)];
    if (s) return { t: s.t, x: s.x, a: s.a, story: true };
    return staffNote(it, h, L, F);
  }
  if (it.note === "staff") return staffNote(it, h, L, F);
  if (it.note === "code") return LAB.codeNote(it.code, it.room, h);
  if (it.note === "safe") return LAB.safeNote(it.code, it.room, h);
  if (it.note === "secret") return LAB.secretNote(it.room, it.side, h);
  if (it.note === "depth" && LAB.depths) return LAB.depths.noteText(it, L, F);
  if (it.note === "agen" && LAB.agen) return LAB.agen.noteText(it); /* записки кабинетов: из частей, с людьми этажа (1.5) */
  if (it.note === "riddle") { var rd = riddleFor(it.rid, it.L || L); return LAB.riddleNote ? LAB.riddleNote(rd, it.room, h) : { t: "Отгадка", x: "Замок помещения «" + it.room + "»: ответ — «" + rd.a[0] + "»." }; }
  return { t: "Записка", x: "Неразборчиво." };
}
game.noteText = noteText;
/* Записки в записи игры хранятся ссылкой — откуда текст (src), а не самим
   текстом: иначе к глубоким уровням запись разрастается до мегабайт. Текст
   собирается заново по ссылке; письма и старые записи хранят его как есть. */
var noteCache = {};
function noteFull(n) {
  if (n.x != null) return { t: n.t, x: n.x, a: n.a || "" };
  if (noteCache[n.id]) return noteCache[n.id];
  var r = n.src ? noteText(n.src, n.L, n.F) : null;
  if (!r) r = { t: n.t || "Записка", x: "Текст не сохранился.", a: n.a || "" };
  if (!r.a) r.a = n.a || "";
  noteCache[n.id] = r;
  return r;
}
game.noteFull = noteFull;
/* ── АРХИВ ДОКУМЕНТОВ ──
   Всё найденное — записки, письма, документы и журналы компьютеров,
   фрагменты памяти — заносится в архив: название, автор, место, глубина,
   категория. Поиск — по глубине, категории, автору, первой букве. */
var DOC_CATS = ["Личные записи", "Свидетельства", "Технические журналы", "Отчёты безопасности", "Исследовательские заметки", "Протоколы экспериментов", "Приказы", "Служебные записки", "Сообщения о поломках", "Переписка", "Записи переговоров", "Архивы персонала", "Секретные документы", "Противоречащие официальной версии", "Документы", "Журналы терминалов", "Загадки и испытания", "Повреждённые записи", "Фрагменты памяти комплекса", "Записи последовательностей"];
game.DOC_CATS = DOC_CATS;
function docCat(src, nt) {
  var k = src && src.note, a = String((nt && nt.a) || "").toLowerCase(), dk = src && src.dk;
  if (k === "depth" && nt && nt.cat) return nt.cat;
  if (k === "depth") return { cradle: "Протоколы экспериментов", node: "Записи последовательностей", memory: "Фрагменты памяти комплекса", mirror: "Повреждённые записи" }[dk] || "Документы";
  if (k === "story") return "Свидетельства";
  if (k === "code" || k === "safe") return "Служебные записки";
  if (k === "secret") return "Сообщения о поломках";
  if (k === "riddle") return "Загадки и испытания";
  if (/инженер|техник|механик|энергетик|наладчик|монтаж|смен/.test(a)) return "Технические журналы";
  if (/охран|безопасн|пост|караул|вахт/.test(a)) return "Отчёты безопасности";
  if (/директор|руковод|комендант|начальник|приказ/.test(a)) return "Приказы";
  if (/учён|лаборант|биолог|химик|физик|исследов|научн|профессор|доктор|академик|генетик/.test(a)) return "Исследовательские заметки";
  return "Личные записи";
}
game.docCat = docCat;
/* Записать в архив документ с готовым текстом (письмо, документ компьютера, журнал). */
function archiveAdd(id, t, x, a, cat) {
  if (G.notes[id]) return false;
  G.notes[id] = 1;
  G.noteList.push({ id: id, t: t, x: x, a: a || "", L: G.L, F: G.F, pl: placeName(G.x, G.y), cat: cat || "Документы" });
  return true;
}
game.archiveAdd = archiveAdd;
/* Сведения документа для архива: категория (у старых записей — по виду), место, глубина, кратко. */
function docInfo(n) {
  var nf = noteFull(n), cat = n.cat || (n.id && n.id.indexOf("mail:") === 0 ? "Переписка" : docCat(n.src, nf));
  var dpt = LAB.depths ? LAB.depths.depthOf(n.L || 1) : 0, dname = LAB.depths ? LAB.depths.names[dpt] : "";
  var mm = String(nf.x || "").match(/^[\s\S]*?[.!?…](\s|$)/), first = (mm ? mm[0] : String(nf.x || "")).trim();
  if (first.length > 110) first = first.slice(0, 107).replace(/\s+\S*$/, "") + "…";
  return { t: nf.t || n.t, a: nf.a || n.a || "", x: nf.x || "", cat: cat, depth: dpt, dname: dname, pl: n.pl || "", sum: first };
}
game.docInfo = docInfo;
/* Загадка для замка или панели ОКО: из загадок блока, иначе из общих. */
function riddleFor(rid, L) {
  L = L || G.L;
  var b = LAB.blockOf(L);
  var pool = L <= 10 ? (LAB.RIDDLES_BASE || []) : (LAB.RIDDLES || []).filter(function (r) { return r.b === b; });
  if (!pool.length) pool = LAB.RIDDLES_BASE || [];
  if (!pool.length) pool = LAB.RIDDLES || [];
  return pool[(rid >>> 0) % pool.length] || { q: "Что слышно лучше всего в полной тишине?", a: ["своё сердце", "ветер", "шаги", "море"], hint: "Оно стучит у вас в груди." };
}
game.riddleFor = riddleFor;

function curWeapon() { return G.weapons[G.wi] || G.weapons[0] || null; }
game.curWeapon = curWeapon;
function weaponLine(w) {
  if (!w) return "без оружия";
  var c = w.cond != null && w.cond < 70 ? ", состояние " + Math.round(w.cond) + " из 100" : "";
  if (w.ammo === "none") return w.name + c;
  return w.name + ", заряд " + w.charge + " из " + w.cap + c;
}
game.weaponLine = weaponLine;

/* Защита: надетая броня (с пластинами) и опыт героя. */
function armorValue() {
  var a = LAB.armorDef(G.armor) + Math.floor(G.lvl / 3);
  /* (2.0) чип кожного панциря и наноброня */
  if (LAB.implants) a += Math.round(LAB.implants.stat("armor")) + (G.st.nanoT > 0 ? G.st.nano || 0 : 0);
  if (G.faction === "sec") a = Math.round(a * 1.15);
  return a;
}
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
  var c = LAB.armorCond(a);
  return a.name + ": защита " + LAB.armorDef(a) + (c < 100 ? ", состояние " + Math.round(c) + " из 100" + (c < 50 ? " — держит хуже" : "") : "") + (a.up ? ", пластин " + a.up + " из 5" : "") + (res.length ? ", стойкость: " + res.join(", ") : "") + (d.special ? ", особенность: " + LAB.ARMOR_SPECIAL[d.special] : "");
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
function advanceTime(min, asleep) {
  bodyMinutes(min, asleep);
  G.min += min;
  while (G.min >= 24 * 60) { G.min -= 24 * 60; G.day++; G.eventUntil -= 24 * 60; }
  if (G.min >= G.eventUntil) rollEvent();
  /* доставка заказов с поверхности и облучение в особых зонах (1.5) */
  if (LAB.supply) LAB.supply.tick();
  if (LAB.zones && !asleep) LAB.zones.minutes(min);
}
game.advanceTime = advanceTime;

/* ════════ ТЕЛО ГЕРОЯ ════════
   Сытость падает со временем (каждый шаг — минута), но медленно (1.5,
   просьба игрока: прежде голод приходил за этаж-другой): от полной
   сытости до «проголодались» — полторы тысячи шагов, до голода — больше
   двух тысяч; герой просыпается сытым. Голодному импланты не
   восстанавливают энергию, истощение отнимает здоровье. Бодрость падает
   без сна: уставшему труднее целиться; капсула, кофе и стимуляторы бодрят.
   Токсины копятся от ядов, химии, несвежей еды и стимуляторов и понемногу
   выводятся сами; антидот, сорбент и большая аптечка выводят их сразу:
   при сильной интоксикации подташнивает (точность ниже), при тяжёлой —
   токсины отнимают здоровье. Нейронагрузка растёт от нейростимуляторов и
   имплантов и спадает за секунды: при перегрузке импланты дороже, при
   критической — отключаются, пока нагрузка не спадёт.
   Облучение (1.5) копится в радиоактивных помещениях (zones.js), само
   почти не спадает — его выводят антирадин, раствор «Чистота»,
   наноаптечка, дезактивационный душ и сон в капсуле; при лучевой болезни
   мутит и импланты восстанавливаются медленнее, при тяжёлой — облучение
   отнимает здоровье. */
function body() {
  var b = G.body;
  if (!b) b = G.body = { food: 85, wake: 85, tox: 0, neuro: 0, rad: 0, lv: {} };
  if (!b.lv) b.lv = {};
  if (b.rad == null) b.rad = 0;
  return b;
}
function clampBody(b) {
  b.food = Math.max(0, Math.min(100, b.food)); b.wake = Math.max(0, Math.min(100, b.wake));
  b.tox = Math.max(0, Math.min(100, b.tox)); b.neuro = Math.max(0, Math.min(100, b.neuro));
  b.rad = Math.max(0, Math.min(100, b.rad || 0));
}
/* Ступени: [порог, слово, предупреждение при переходе вниз (к худшему)]. */
var BODY_STEPS = {
  food: [[80, "сыты"], [50, "сытость в норме"], [25, "проголодались", "Вы проголодались: энергия имплантов восстанавливается медленнее. Поешьте: еда — в автоматах с едой, на кухнях и в столовых."], [10, "голод", "Голод: энергия имплантов почти не восстанавливается."], [1, "сильный голод", "Сильный голод: энергия имплантов не восстанавливается, скоро голод начнёт отнимать здоровье."], [0, "истощение", "Истощение: голод отнимает здоровье. Срочно поешьте."]],
  wake: [[70, "бодры"], [40, "бодрость в норме"], [20, "устали", "Вы устали: руки дрожат, целиться труднее. Отдохните в капсуле восстановления или выпейте кофе."], [5, "сильная усталость", "Сильная усталость: точность заметно ниже. Нужен сон или стимулятор."], [0, "валитесь с ног", "Вы валитесь с ног от усталости."]],
  tox: [[80, "тяжёлая интоксикация", "Тяжёлая интоксикация: токсины отнимают здоровье. Антидот, сорбент или большая аптечка!"], [50, "интоксикация", "Интоксикация: подташнивает, целиться труднее. Антидот или энтеросорбент выведут токсины."], [20, "лёгкая интоксикация"], [0, "токсинов нет"]],
  neuro: [[85, "критическая нейронагрузка", "Нейроперегрузка: импланты отключились, пока нагрузка не спадёт. Поможет нейроблокатор."], [60, "нейроперегрузка", "Нейронагрузка высокая: импланты тратят больше энергии."], [30, "нейронагрузка повышена"], [0, "нейронагрузка в норме"]],
  rad: [[90, "смертельная доза", "Смертельная доза облучения: здоровье тает. Немедленно антирадин или раствор «Чистота» — и прочь из зоны!"], [70, "тяжёлая лучевая болезнь", "Тяжёлая лучевая болезнь: облучение отнимает здоровье. Выведите его: антирадин, раствор «Чистота», дезактивационный душ."], [45, "лучевая болезнь", "Лучевая болезнь: мутит, руки дрожат, импланты восстанавливаются медленнее. Уходите из зоны облучения."], [20, "лёгкое облучение", "Во рту металлический привкус: лёгкое облучение. В зоне излучения долго не стойте."], [0, "облучения нет"]]
};
/* Ступень параметра: для сытости и бодрости — чем выше, тем лучше; для
   токсинов и нейронагрузки — наоборот (ступени идут от худшей). */
function bodyStep(k) {
  var b = body(), v = Math.round(b[k]), arr = BODY_STEPS[k];
  for (var i = 0; i < arr.length; i++) if (v >= arr[i][0]) return i;
  return arr.length - 1;
}
function bodyWord(k) { return BODY_STEPS[k][bodyStep(k)][1]; }
function bodyBad(k) { var i = bodyStep(k); return k === "food" || k === "wake" ? i >= 2 : k === "rad" ? i <= 2 : i <= 1; }
/* Предупредить, если параметр перешёл на ступень хуже. */
function bodyWarn() {
  var b = body();
  ["food", "wake", "tox", "neuro", "rad"].forEach(function (k) {
    var i = bodyStep(k), was = b.lv[k];
    b.lv[k] = i;
    if (was == null || was === i) return;
    var worse = k === "food" || k === "wake" ? i > was : i < was, msg = BODY_STEPS[k][i][2];
    if (worse && msg) { LAB.say(msg, { prio: "event", keep: true }); if (k === "food" && i >= 3) A("play", "stomach_growl"); if ((k === "tox" && i <= 1) || (k === "rad" && i <= 2)) A("play", "cough"); if (k === "wake" && i >= 3) A("play", "yawn"); }
  });
}
game.bodyWarn = bodyWarn;
var starve = 0;
/* Минут (шагов) на единицу сытости: прежде было 9 — голод приходил слишком быстро. */
var HUNGER_MIN = 30;
game.HUNGER_MIN = HUNGER_MIN;
function bodyMinutes(min, asleep) {
  var b = body();
  if (asleep) { b.tox = Math.max(0, b.tox - min / 4); b.rad = Math.max(0, b.rad - min / 40); return; } /* сон в капсуле: раствор кормит и выводит, предупреждений нет */
  var mk = 1 - (LAB.implants ? LAB.implants.stat("metab") : 0); /* (2.0) чип метаболизма */
  b.food -= min / HUNGER_MIN * mk;
  /* выспались в капсуле (восемь часов и больше) — бодрость какое-то время падает вдвое медленнее */
  b.wake -= min / 12 * (G.st.restedMin > 0 ? 0.5 : 1) * mk;
  if (G.st.restedMin > 0) G.st.restedMin = Math.max(0, G.st.restedMin - min);
  if (b.tox > 0) b.tox -= min / (b.food >= 50 ? 4 : 6);
  if (b.rad > 0) b.rad -= min / 180; /* радионуклиды выводятся сами очень медленно */
  clampBody(b);
  /* истощение: голод отнимает здоровье, но не убивает */
  if (b.food <= 0) { starve += min; while (starve >= 6) { starve -= 6; if (G.hp > 1) { G.hp--; UIx("refresh"); } } } else starve = 0;
  bodyWarn();
}
/* Такт боя (полсекунды; по ходам — ход): нейронагрузка спадает, тяжёлая
   интоксикация отнимает здоровье. */
var bodyTickN = 0;
function bodyTick() {
  var b = body();
  bodyTickN++;
  if (bodyTickN % 4 === 0 && b.neuro > 0) b.neuro = Math.max(0, b.neuro - 1);
  if (b.tox >= 80 && bodyTickN % 6 === 0) {
    G.hp -= b.tox >= 100 ? 2 : 1;
    A("play", "poison_tick");
    if (G.hp <= 0) { G.hp = 0; UIx("refresh"); die(); return; }
  }
  /* тяжёлая лучевая болезнь отнимает здоровье, смертельная доза — вдвое быстрее */
  if (b.rad >= 70 && bodyTickN % (b.rad >= 90 ? 4 : 8) === 0) {
    G.hp -= b.rad >= 90 ? 2 : 1;
    A("play", "poison_tick");
    if (G.hp <= 0) { G.hp = 0; UIx("refresh"); die(); return; }
  }
  if (bodyTickN % 4 === 0) bodyWarn();
}
game.bodyTick = bodyTick;
/* Сколько тактов на единицу энергии имплантов (0 — не восстанавливается). */
function enRegen() {
  var b = body();
  if (b.food < 10 || b.neuro >= 85) return 0;
  var k = b.rad >= 45 ? 2 : 1; /* лучевая болезнь: импланты восстанавливаются вдвое медленнее */
  if (LAB.implants) k *= 1 - LAB.implants.stat("recharge"); /* (2.0) чип рекуперации */
  if (b.food < 25) return Math.max(1, Math.round(16 * k));
  if (b.food < 50) return Math.max(1, Math.round(9 * k));
  return Math.max(1, Math.round((b.food >= 80 ? 5 : 6) * k));
}
game.enRegen = enRegen;
/* Насколько хуже точность: усталость, тошнота, нейроперегрузка. */
function aimPenalty() {
  var b = body(), p = 0;
  if (b.wake < 5) p += 0.12; else if (b.wake < 20) p += 0.06;
  if (b.tox >= 80) p += 0.1; else if (b.tox >= 50) p += 0.06;
  if (b.neuro >= 85) p += 0.05;
  if (b.rad >= 70) p += 0.08; else if (b.rad >= 45) p += 0.04;
  /* тренировки на стрельбище и умение «Твёрдая рука» (1.5) */
  var tr = G.train && G.train.aim ? Math.min(5, Math.floor(G.train.aim / 3)) * 0.01 : 0;
  if (LAB.ach && LAB.ach.has("sharp")) p *= 0.6;
  return p - tr;
}
game.aimPenalty = aimPenalty;
/* Применить к телу: еда, питьё, лекарства. Возвращает фразы итога. */
function bodyApply(d, msg) {
  var b = body(), v;
  if (d.overdose && b.tox >= 70) {
    G.hp = Math.max(1, G.hp - 15); G.st.slow = Math.max(G.st.slow || 0, 6);
    A("play", "heartbeat");
    msg.push("Передозировка: сердце колотится, в глазах темнеет. Минус 15 здоровья, вы замедлены.");
  }
  if (d.shock && b.neuro >= 75) {
    G.hp = Math.max(1, G.hp - 10); G.st.deaf = Math.max(G.st.deaf || 0, 6); b.neuro = 100;
    A("deafen", 3000);
    msg.push("Нейрошок: в ушах звенит, импланты отключились. Минус 10 здоровья.");
  }
  if (d.food) { v = b.food; b.food += d.food; clampBody(b); if (b.food > v) msg.push("Сытость " + Math.round(b.food) + "."); }
  if (d.wake) { v = b.wake; b.wake += d.wake; clampBody(b); if (Math.round(b.wake) !== Math.round(v)) msg.push("Бодрость " + Math.round(b.wake) + "."); }
  if (d.detox && b.tox > 0) { b.tox -= d.detox; clampBody(b); msg.push(b.tox > 0 ? "Токсины " + Math.round(b.tox) + "." : "Токсины выведены."); }
  if (d.tox) {
    if (G.st.antitox > 0 && !d.overdose) msg.push("Фильтр не пропустил токсины.");
    else { b.tox += d.tox * (1 - (LAB.implants ? LAB.implants.stat("antitox") : 0)); clampBody(b); msg.push("Токсины " + Math.round(b.tox) + "."); }
  }
  if (d.neuro) { v = b.neuro; b.neuro += d.neuro; clampBody(b); if (Math.round(b.neuro) !== Math.round(v)) msg.push("Нейронагрузка " + Math.round(b.neuro) + "."); }
  if (d.stopBleed && G.st.bleed) { G.st.bleed = 0; msg.push("Кровотечение остановлено."); }
  if (d.halfPoison && G.st.poison) { G.st.poison = Math.floor(G.st.poison / 2); msg.push("Яд слабеет."); }
  if (d.undeaf && G.st.deaf) { G.st.deaf = 0; msg.push("Звон в ушах стих."); }
  /* облучение: лекарства выводят (rad меньше нуля), фонящие вещи добавляют; йодид калия — защита на время */
  if (d.rad) {
    v = b.rad; b.rad += d.rad; clampBody(b);
    if (d.rad < 0) msg.push(v > 0 ? (b.rad > 0 ? "Облучение " + Math.round(b.rad) + "." : "Облучение выведено.") : "Облучения не было.");
    else msg.push("Облучение " + Math.round(b.rad) + ".");
  }
  if (d.radBlock) { G.st.radBlock = Math.max(G.st.radBlock || 0, d.radBlock); msg.push("Щитовидная железа защищена: облучение вдвое слабее на " + Math.round(d.radBlock / 120) + " " + plural(Math.round(d.radBlock / 120), "минуту", "минуты", "минут") + "."); }
  bodyWarn();
  return msg;
}
game.bodyApply = bodyApply;
/* Кратко о теле: только то, что требует внимания (для окна состояния и T). */
function bodyAlerts() {
  var out = [];
  ["food", "wake", "tox", "neuro", "rad"].forEach(function (k) { if (bodyBad(k)) out.push(bodyWord(k)); });
  if (G.st.bleed) out.push("кровотечение");
  return out;
}
game.bodyAlerts = bodyAlerts;
/* Здоровье и всё тело (1.5): три пальца вправо, K на клавиатуре. Сначала здоровье,
   бодрость и сытость, потом остальное. */
function bodyStatus() {
  if (!game.entered) return;
  var b = body(), st = [];
  if (G.st.poison) st.push("отравление"); if (G.st.bleed) st.push("кровотечение"); if (G.st.slow) st.push("замедление"); if (G.st.deaf) st.push("звон в ушах"); if (G.st.antitox) st.push("фильтр противогаза действует"); if (G.st.radBlock) st.push("йодид калия защищает");
  if (G.st.trapHeld > 0) st.push("нога в ловушке");
  var hpw = G.hp >= G.hpMax * 0.8 ? "в порядке" : G.hp >= G.hpMax * 0.5 ? "ранены" : G.hp >= G.hpMax * 0.25 ? "тяжело ранены" : "при смерти";
  say("Здоровье " + G.hp + " из " + G.hpMax + ": " + hpw + (G.st.shield ? ", щит " + G.st.shield : "") + ". Бодрость " + Math.round(b.wake) + ": " + bodyWord("wake") + ". Сытость " + Math.round(b.food) + ": " + bodyWord("food") + ". Токсины " + Math.round(b.tox) + ": " + bodyWord("tox") + ". Нейронагрузка " + Math.round(b.neuro) + ": " + bodyWord("neuro") + ". Облучение " + Math.round(b.rad) + ": " + bodyWord("rad") + ". Энергия имплантов " + G.en + " из " + G.enMax + "." + (G.armor ? " Броня: " + armorWord() + "." : "") + (st.length ? " Состояние: " + st.join(", ") + "." : ""));
}
game.bodyStatus = bodyStatus;
function armorWord() { var a = G.armor; return a ? a.name + ", защита " + LAB.armorDef(a) : ""; }
/* Кредиты (1.5): три пальца влево, B на клавиатуре. */
function creditsStatus() {
  if (!game.entered) return;
  var n = G.credits || 0, cap = LAB.capsule && LAB.capsule.bindPrice ? LAB.capsule.bindPrice(G.L, G.F) : 0;
  say("Кредиты: " + n + "." + (cap ? " Привязка к капсуле восстановления на этом этаже стоит " + cap + " " + plural(cap, "кредит", "кредита", "кредитов") + "." : ""));
}
game.creditsStatus = creditsStatus;
/* Поесть (G на клавиатуре): еда из рюкзака, которая лучше утолит голод. */
function FOODS() { return Object.keys(LAB.ITEMS).filter(function (k) { return LAB.ITEMS[k].kind === "food"; }); }
function eatBest() {
  if (!game.entered) return;
  var b = body(), have = FOODS().filter(function (k) { return G.inv[k] > 0; });
  if (!have.length) { LAB.UI.error(); say("Еды нет. Еду продают автоматы с едой и повара среди выживших; бывает она в ящиках на кухнях и в столовых."); return; }
  if (b.food >= 90 && G.en >= G.enMax) { say("Вы сыты: сытость " + Math.round(b.food) + "."); return; }
  var need = 100 - b.food, best = null, bs = -1e9;
  have.forEach(function (k) {
    var d = LAB.ITEMS[k], f = d.food || 0;
    /* лучше то, что утолит голод почти без остатка; при полной сытости — то, что даёт энергию */
    var sc = need > 8 ? -Math.abs(need - f) + (d.stale ? -6 : 0) : (d.en || 0) - f;
    if (sc > bs) { bs = sc; best = k; }
  });
  useItem(best);
}
game.eatBest = eatBest;
/* Звук еды: обёртка, хруст, жевание, банка, таблетки. */
function eatSound(kind) {
  if (kind === "wrap") { A("play", "food_wrapper"); setTimeout(function () { A("play", "eat_crunch"); }, 650); }
  else if (kind === "crunch") A("play", "eat_crunch");
  else if (kind === "can") { A("play", "can_open"); setTimeout(function () { A("play", "eat_chew"); }, 700); }
  else if (kind === "pills") A("play", "pills_rattle");
  else if (kind === "gulp" || kind === "sip") A("play", kind === "gulp" ? "drink_gulp" : "drink_sip");
  else A("play", "eat_chew");
}
game.eatSound = eatSound;
function eventList() { var b = LAB.blockOf(G.L); return LAB.EVENTS.concat(G.L > 10 && LAB.EVENTS_B[b] ? LAB.EVENTS_B[b] : []); }
game.eventLike = function (id) { var e = eventList().filter(function (q) { return q.id === id; })[0]; return e ? (e.like || e.id) : id; };
function rollEvent() {
  var w = {}; eventList().forEach(function (e) { w[e.id] = e.w; });
  var tot = 0, k; for (k in w) tot += w[k];
  var x = Math.random() * tot, pick = "norm";
  for (k in w) { x -= w[k]; if (x < 0) { pick = k; break; } }
  G.eventUntil = G.min + 40 + Math.floor(Math.random() * 90);
  if (pick === G.event) return;
  G.event = pick;
  var ev = eventList().filter(function (e) { return e.id === pick; })[0];
  A("setEvent", ev && ev.like ? ev.like : pick);
  if (pick !== "norm" && ev) { LAB.sub("⚠️ " + ev.n); sayq("Обстановка: " + ev.n.toLowerCase() + ". " + (ev.desc || "")); }
  else sayq("Обстановка: штатный режим.");
}
function gainXP(n, why) {
  if (!n) return;
  G.xp += n;
  var lv = false;
  while (G.xp >= LAB.xpNeed(G.lvl)) {
    G.xp -= LAB.xpNeed(G.lvl); G.lvl++; lv = true;
    G.hpMax += 10; G.hp = G.hpMax; G.enMax += G.enMax < 240 ? 3 : 1; G.en = G.enMax;
    /* характеристики растут до сорока: дальше сила героя — в оружии и броне */
    if (G.str < 40) G.str++; if (G.agi < 40) G.agi++; if (G.mind < 40) G.mind++; if (G.cha < 40) G.cha++;
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
      if (it.item === "plate" && !G.tut.plate && hintsOn()) { G.tut.plate = 1; extra = " Пластину вставляют в надетую броню: инвентарь, раздел «Броня»."; }
      break;
    case "armor":
      G.armors.push(it.a);
      if (!G.armor) { G.armor = it.a; extra = " Надето сразу. Защита " + LAB.armorDef(it.a) + "."; }
      else {
        var cur = LAB.armorDef(G.armor), nw = LAB.armorDef(it.a);
        extra = " Защита " + nw + (nw > cur ? ", выше надетой (" + cur + ")" : nw < cur ? ", ниже надетой (" + cur + ")" : ", как у надетой") + ". Надеть — инвентарь, раздел «Броня».";
      }
      break;
    case "credits": if (LAB.implants && LAB.implants.stat("loot")) it.n = Math.round(it.n * (1 + LAB.implants.stat("loot"))); G.credits += it.n; break; /* (2.0) чип старателя */
    case "weapon":
      G.weapons.push(it.w);
      if (LAB.oko && LAB.oko.react) later(function () { LAB.oko.react("weapon"); }, 2500);
      if (!G.tut.weapon && hintsOn()) { G.tut.weapon = 1; extra = LAB.K(" Выбрать оружие — свайп одним пальцем вверх и сразу вниз. Вынуть — касание тремя пальцами.", " Выбрать оружие — Q и E или цифры от 1 до 9. Достать — R."); }
      break;
    case "pass":
      if (it.tier > G.tier) { G.tier = it.tier; extra = " Теперь открываются двери с картридером " + LAB.TIERS[it.tier].short + (it.tier > 1 ? " и ниже." : "."); }
      break;
    case "elevpass": G.elev[it.L] = true; extra = " Лифт уровня " + it.L + " теперь ваш."; break;
    case "gatepass": if (it.core) { G.cores = G.cores || {}; G.cores[it.L || G.L] = true; if ((it.L || G.L) === 10) G.core = true; } else G.gate[it.L] = true; extra = it.core ? " Гермодверь реактора «Исток» откроется." : " Гермошлюз на уровень ниже теперь откроется. Помните: назад пути не будет."; break;
    case "key": G.keys[it.key] = it.n; break;
    case "note": {
      var nt = noteText(it), nid = G.L + "-" + G.F + "-" + it.id;
      if (!G.notes[nid]) {
        G.notes[nid] = 1;
        /* ссылка на текст — само описание записки (без места на полу): по нему текст собирается заново */
        var src = JSON.parse(JSON.stringify(it)); delete src.x; delete src.y; delete src.kind;
        var dcat = docCat(src, nt);
        G.noteList.push({ id: nid, src: src, t: nt.t, a: nt.a || "", story: !!nt.story, L: G.L, F: G.F, code: it.note === "safe" ? it.code : undefined, pl: placeName(G.x, G.y), cat: dcat });
        G.stats.notes++; gainXP(4);
        if (LAB.ach) LAB.ach.ev("note", 1);
        if (LAB.workshop) LAB.workshop.fromDoc(nid, dcat);
        /* записок из кабинетов — тысячи: в архиве хранятся последние шестьсот, чтобы запись игры не разрасталась */
        if (it.note === "agen") {
          var agn = 0; for (var qi = G.noteList.length - 1; qi >= 0; qi--) if (G.noteList[qi].src && G.noteList[qi].src.note === "agen" && ++agn > 600) G.noteList.splice(qi, 1);
        }
      }
      if (it.code) G.codes[it.code] = it.room;
      break;
    }
    case "sample":
      if (!G.samples[it.sid]) { G.samples[it.sid] = 1; G.enMax += 2; G.en = Math.min(G.enMax, G.en + 10); gainXP(20); extra = " Собрано образцов: " + Object.keys(G.samples).length + ". Энергия имплантов выросла."; if (LAB.oko) LAB.oko.event("sample"); }
      break;
    case "chip":
      /* (2.0) вживляется сам, если есть место; иначе — в рюкзак */
      if (LAB.implants) extra = LAB.implants.pickup(it.implant);
      else if (G.implants.indexOf(it.implant) < 0) G.implants.push(it.implant);
      break;
  }
  if (!quiet) { A("pickup", itemKind(it)); if (it.kind !== "note") tutor("pickup"); }
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
    UIx("note", "«" + nt.t + "»", (nt.a ? nt.a + ". " : "") + nt.x + (notes.length > 1 ? " Остальные записки — в инвентаре, «Архив документов»." : ""), null, { queue: true });
  } else if (notes.length) sayq("Прочитать записку — инвентарь, «Архив документов».");
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
game.lastMoveAt = function () { return lastMove; };
function tryMove(dir, run) {
  if (!game.entered || game.paused || G.done) return false;
  if (LAB.ui && LAB.ui.layer()) return false;
  var now = Date.now();
  var minGap = run ? 180 : 0;
  if (G.st.slow > 0) minGap = Math.max(minGap, 420);
  if (now - lastMove < minGap) return false;
  if (G.st.web > 0) { A("play", "web_stuck"); sayq("Вы в паутине. Рвёте её..."); G.st.web = Math.max(0, G.st.web - 1); return false; }
  /* (1.5) ловушка держит: каждый рывок ослабляет её хватку */
  if (G.st.trapHeld > 0) { A("play", "web_stuck"); G.st.trapHeld = Math.max(0, G.st.trapHeld - 2); if (G.st.trapHeld) sayOnce("trapheld", "Ловушка держит. Вырываетесь...", 1500); else sayq("Вы вырвались."); return false; }
  var d = DIRS[dir]; if (!d) return false;
  if (G.stair) return stairStep(dir, run);
  G.face = dir;
  var nx = G.x + d[0], ny = G.y + d[1];
  var tt = cellType(nx, ny);
  /* (1.5) ходьба с удержанием останавливается перед известной ловушкой; отдельный шаг — наступаете */
  if (run && LAB.traps) { var kt = LAB.traps.knownAt(nx, ny); if (kt) { LAB.say("Стоп: впереди " + LAB.traps.nameOf(kt) + ". Шагните отдельно, если хотите на неё наступить.", { prio: "urgent" }); return false; } }
  var f = foeAt(nx, ny);
  /* ящик-ловушка раскрывается, если в него упереться */
  if (f && f.disguised && LAB.combat.unmask) { LAB.combat.unmask(f); return false; }
  /* спокойная машина (перепрошитая, ваша, уборщик) уступает дорогу: меняетесь местами */
  if (f && (f.calm || f.ally || f.neutral) && !(f.beh && f.beh.indexOf("stationary") >= 0)) { f.x = G.x; f.y = G.y; f.room = CUR.fl.room[idx(G.x, G.y)]; f = null; }
  if (f) { bumpFocus({ type: "foe", ref: f, dir: dir }); A("bump"); sayOnce("foe" + f.id, f.name + " вплотную! " + LAB.K("Выньте оружие — касание тремя пальцами.", "Достаньте оружие — R, бейте стрелками.")); return false; }
  if (tt === T.WALL) {
    var sd = hiddenSecretAt(nx, ny);
    A("bumpWall", dir); LAB.vib(25);
    if (sd) { bumpFocus({ type: "secret", ref: sd, dir: dir }); sayOnce("wall" + nx + "," + ny, "Из щели у пола тянет сквозняком. " + LAB.K("Двойное касание — простучать стену.", "Enter — простучать стену.")); }
    else wallDoorHint(dir, nx, ny);
    return false;
  }
  if (tt === T.DOOR) {
    var door = CUR.fl.doorAt[idx(nx, ny)];
    if (door.lock && door.lock.type === "secret" && !secretFound(door)) {
      /* изнутри тайного хода потайная дверь видна: это выход */
      if (cellType(G.x, G.y) === T.CORR && LAB.corrOf(CUR.fl, G.x, G.y) && LAB.corrOf(CUR.fl, G.x, G.y).id === door.corr) {
        CUR.fs.secrets[door.id] = 1; A("play", "secret_open"); bumpFocus({ type: "door", ref: door, dir: dir });
        sayOnce("inner" + door.id, "Изнутри видна потайная дверь — выход из тайного хода. " + LAB.K("Двойное касание — открыть.", "Enter — открыть."));
        return false;
      }
      A("bumpWall", dir); LAB.vib(25); bumpFocus({ type: "secret", ref: door, dir: dir }); sayOnce("wall" + nx + "," + ny, "Из щели у пола тянет сквозняком. " + LAB.K("Двойное касание — простучать стену.", "Enter — простучать стену.")); return false;
    }
    if (!doorOpen(door)) {
      var why = doorBlock(door);
      bumpFocus({ type: "door", ref: door, dir: dir });
      if (!door.lock && S.autoDoors) { openDoor(door, true); }
      else {
        A("play", door.lock ? "door_locked" : "door_knock");
        var txt, sg = doorSign(door);
        if (!door.lock) txt = "Закрытая дверь." + sg + " " + LAB.K("Двойное касание — открыть.", "Enter — открыть.");
        else txt = "Дверь: " + lockText(door) + "." + sg + (why ? " " + why + LAB.K(" Двойное касание — действия.", " Enter — действия.") : LAB.K(" Пропуск есть: двойное касание — открыть.", " Пропуск есть: Enter — открыть."));
        sayOnce("door" + door.id, txt);
        tutor("door");
        if (!G.tut.door && door.lock && hintsOn()) { G.tut.door = 1; sayq(LAB.K("У запертой двери коснитесь экрана одним пальцем дважды: появятся действия.", "У запертой двери нажмите Enter: появятся действия.")); }
        return false;
      }
    }
  }
  var o = objAt(nx, ny), n = npcAt(nx, ny);
  if (o) {
    bumpFocus({ type: "obj", ref: o, dir: dir });
    A("bumpSoft", o);
    sayOnce("obj" + o.id, objName(o) + LAB.K(". Двойное касание — действия.", ". Enter — действия."));
    if (!G.tut.obj && hintsOn()) { G.tut.obj = 1; sayq("К предметам подходят вплотную. " + LAB.K("Двойное касание одним пальцем — список действий.", "Enter — список действий.")); }
    return false;
  }
  if (n) {
    bumpFocus({ type: "npc", ref: n, dir: dir });
    A("npcHello", n);
    sayOnce("npc" + n.id, npcName(n) + LAB.K(". Двойное касание — поговорить.", ". Enter — поговорить."));
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
  if (tt === T.DOOR) tutor("door");
  if (tt === T.DOOR) A("doorPass", CUR.fl.doorAt[idx(nx, ny)]);
  markSeen();
  autoPickup();
  roomCheck(false, run);
  announceNear();
  corridorTurn(dir);
  doorAutoClose();
  checkQuests();
  navFollowStep();
  if (LAB.combat) LAB.combat.afterPlayerMove(from);
  UIx("refresh");
  return true;
}
game.tryMove = tryMove;

var lastSay = {};
/* Подсказки звучат, если в настройках не выбрано «только по запросу». */
function hintsOn() { return LAB.tutor ? LAB.tutor.hintsOn() : true; }
game.hintsOn = hintsOn;
function tutor(id) { if (LAB.tutor) LAB.tutor.ev(id); }
function sayOnce(key, text, gap) {
  var now = Date.now();
  if (lastSay[key] && now - lastSay[key] < (gap || 2500)) { return; }
  lastSay[key] = now;
  say(text);
}
function bumpFocus(f) { CUR.focus = f; CUR.lastBump = Date.now(); }

/* Стена, а дверь в этой же стене рядом: сказать, на сколько шагов она в стороне. */
function wallDoorHint(dir, nx, ny) {
  var d = DIRS[dir], side = d[0] ? ["N", "S"] : ["W", "E"];
  for (var k = 1; k <= 3; k++) {
    for (var j = 0; j < 2; j++) {
      var q = DIRS[side[j]], wx = nx + q[0] * k, wy = ny + q[1] * k;
      var dr = doorAt(wx, wy);
      if (dr && !hiddenSecretAt(wx, wy) && passableRoute(G.x, G.y, side[j], k)) {
        sayOnce("walldoor" + nx + "," + ny, "Стена. Дверь — " + (k === 1 ? "на шаг " : k === 2 ? "на два шага " : "на три шага ") + LAB.DIRTO[side[j]] + ".", 5000);
        return;
      }
    }
  }
}
/* Можно ли пройти вбок на k клеток (до двери в той же стене). */
function passableRoute(x, y, sd, k) {
  var q = DIRS[sd];
  for (var i = 1; i <= k; i++) if (!passable(x + q[0] * i, y + q[1] * i)) return false;
  return true;
}
/* Коридоры прямые, в четыре шага шириной. Входя в коридор, «Эхо» говорит,
   куда он ведёт и что в конце; в самом коридоре — где вы поперёк него. */
function corridorTurn(dir) {
  var cor = LAB.corrOf(CUR.fl, G.x, G.y);
  if (!cor || cellType(G.x, G.y) === T.DOOR) { CUR.corr = -1; return; }
  if (CUR.corr === cor.id) return;
  CUR.corr = cor.id;
  sayq(corridorText(cor, true));
}
function corridorEnds(cor) {
  var d = CUR.fl.doors.filter(function (q) { return q.id === cor.door; })[0];
  var m = cor.mouth[0];
  return { door: d, mouth: m };
}
/* Описание коридора: в какую сторону до двери и до прохода, что за ними. */
function corridorText(cor, entering) {
  var e = corridorEnds(cor), parts = [];
  var hdir = function (x, y) { var dx = x - G.x, dy = y - G.y; return cor.axis === "h" ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N"); };
  var hsteps = function (x, y) { return cor.axis === "h" ? Math.abs(x - G.x) : Math.abs(y - G.y); };
  var across = cor.axis === "h" ? G.y - cor.y0 : G.x - cor.x0;
  var sideA = cor.axis === "h" ? "N" : "W", sideB = cor.axis === "h" ? "S" : "E";
  parts.push(entering ? "Коридор, шириной в четыре шага." : "Коридор.");
  var cap = function (t) { return t.replace(/^./, function (c) { return c.toUpperCase(); }); };
  var doorDir = null;
  if (e.door && !(e.door.lock && e.door.lock.type === "secret" && !secretFound(e.door))) {
    var dr = CUR.fl.rooms[e.door.room], ds = hsteps(e.door.x, e.door.y);
    doorDir = hdir(e.door.x, e.door.y);
    parts.push(ds <= 1 ? "Дверь — рядом" + (dr && dr.sign ? ": «" + dr.sign + "»" : "") + "." : cap(LAB.DIRTO[doorDir]) + " — " + stepsW(ds) + " до двери" + (dr && dr.sign ? " «" + dr.sign + "»" : "") + ".");
  }
  var mr = CUR.fl.rooms[cor.mouthRoom];
  if (e.mouth && mr) {
    var ms = hsteps(e.mouth[0], e.mouth[1]);
    var md = ms === 0 ? (doorDir ? LAB.OPP[doorDir] : null) : hdir(e.mouth[0], e.mouth[1]);
    parts.push(ms <= 1 ? (md ? cap(LAB.DIRN[md]) + " — " : "Рядом — ") + "проход в помещение «" + mr.name + "»." : cap(LAB.DIRTO[md]) + " — " + stepsW(ms) + " до прохода в помещение «" + mr.name + "».");
  }
  /* (1.5) двери кабинетов в стенах коридора */
  if (cor.annex && cor.annex.length && LAB.zones) { var an = LAB.zones.corridorNote(cor); if (an) parts.push(an); }
  if (!entering) parts.push(across === 0 ? "Вы у стены " + LAB.DIRN[sideA] + "." : across === LAB.CORR_W - 1 ? "Вы у стены " + LAB.DIRN[sideB] + "." : "Вы посередине.");
  return parts.join(" ");
}
game.corridorText = corridorText;

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
      var opened = (LAB.CONTAINERS || ["crate", "locker", "desk", "corpse", "safe"]).indexOf(o.type) >= 0 && objState(o).open;
      out.push(objName(o) + (opened ? ", пусто" : "") + " " + LAB.DIRN[k]);
    }
    if (n) {
      var keyn = CUR.key + ":" + n.id, now2 = Date.now();
      if (nearSaid[keyn] && now2 - nearSaid[keyn] < 20000) return;
      nearSaid[keyn] = now2;
      out.push(npcName(n) + " " + LAB.DIRN[k]);
    }
    /* дверь рядом, а вы в коридоре — прочитать табличку */
    var dr = doorAt(x, y);
    if (dr && !hiddenSecretAt(x, y) && cellType(G.x, G.y) === T.CORR) {
      var rm = CUR.fl.rooms[dr.room], keyd = CUR.key + ":sign:" + dr.id, now3 = Date.now();
      if (!rm || !rm.sign || (nearSaid[keyd] && now3 - nearSaid[keyd] < 20000)) return;
      nearSaid[keyd] = now3;
      out.push("Дверь " + LAB.DIRN[k] + (doorOpen(dr) ? ", открыта" : "") + ". Табличка: «" + rm.sign + "»");
    }
  });
  if (!out.length) return;
  A("near");
  sayq(out.join(". ") + "." + (G.tut.near || !hintsOn() ? "" : LAB.K(" Двойное касание — действия.", " Enter — действия.")));
  G.tut.near = 1;
  tutor("object");
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
  if (id === -1) { if (prev !== -1) { A("setRoom", null); tutor("corridor"); } return; }
  A("setRoom", r);
  if (r.type === "secret") CUR.fl.doors.forEach(function (d) { if (d.lock && d.lock.type === "secret" && (d.other === r.id || d.room === r.id)) CUR.fs.secrets[d.id] = 1; });
  var first = !CUR.fs.objs["room" + r.id];
  CUR.fs.objs["room" + r.id] = 1;
  if (first && r.annex && LAB.ach) LAB.ach.ev("room", 1);
  /* (2.0) важное помещение (оружейная, пост охраны, серверная, хранилище) — ОКО это замечает */
  if (first && r.annex && LAB.garrison && LAB.oko && LAB.oko.react && LAB.garrison.CAT[LAB.garrison.category(r)].imp >= 3) LAB.oko.react("vault", { room: r.name });
  var parts = [r.name + "."];
  if (first || full) {
    parts.push(r.desc || LAB.ROOMS[r.type].desc);
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
  /* двери в стенах этого помещения */
  r.doors.forEach(function (did) {
    var d = CUR.fl.doors[parseInt(did.slice(1), 10)];
    if (d.room !== r.id) return;
    if (d.lock && d.lock.type === "secret" && !secretFound(d)) return;
    var st = doorOpen(d) ? "открытая" : d.lock && doorBlock(d) ? "заперта" : "закрыта";
    /* где дверь относительно игрока: сторона и шаги — чтобы идти прямо к ней, а не в стену */
    out.push("дверь " + relDir(d.x, d.y) + ", " + st);
  });
  /* открытые проходы в коридоры */
  (r.mouths || []).forEach(function (ci) {
    var c = CUR.fl.corrs[ci]; if (!c) return;
    var dd = CUR.fl.doors.filter(function (q) { return q.id === c.door; })[0];
    if (dd && dd.lock && dd.lock.type === "secret" && !secretFound(dd) && r.type !== "secret") return;
    var m = c.mouth[0];
    out.push("проход в коридор " + relDir(m[0], m[1]));
  });
  return out.length ? "Выходы: " + out.join("; ") + "." : "";
}
function sideOfDoor(r, d) { return d.x > r.x1 ? "E" : d.x < r.x0 ? "W" : d.y > r.y1 ? "S" : "N"; }
function roomStuff(r, brief, itemsFirst) {
  var objs = brief ? [] : CUR.fl.objs.filter(function (o) { return o.room === r.id; }).map(function (o) { return objName(o) + " " + relDir(o.x, o.y); });
  var npcs = CUR.fl.npcs.filter(function (n) { return n.room === r.id; }).map(function (n) { return npcName(n) + " " + relDir(n.x, n.y); });
  var foes = LAB.combat ? LAB.combat.visibleFoes(8).map(function (f) { return f.name + " " + relDir(f.x, f.y); }) : [];
  var items = floorItems().filter(function (it) { var rr = roomAt(it.x, it.y); return rr && rr.id === r.id; }).map(function (it) { return itemName(it) + " " + relDir(it.x, it.y); });
  var s = [], floor = items.length ? "На полу: " + items.slice(0, 5).join(", ") + (items.length > 5 ? " и ещё " + (items.length - 5) : "") + "." : "";
  /* «Осмотреться»: сначала что лежит на полу, потом что стоит в помещении */
  if (itemsFirst && floor) s.push(floor);
  if (objs.length) s.push("Здесь: " + objs.join(", ") + ".");
  var trapsL = LAB.traps ? LAB.traps.lookList(function (x, y) { var rr = roomAt(x, y); return rr && rr.id === r.id; }) : "";
  if (trapsL) s.push(trapsL);
  if (npcs.length) s.push("Живые: " + npcs.join(", ") + ".");
  if (!itemsFirst && floor) s.push(floor);
  if (foes.length) s.push("Опасность: " + foes.join(", ") + "!");
  return s.join(" ");
}
function relDir(x, y) {
  var dx = x - G.x, dy = y - G.y, d = Math.max(Math.abs(dx), Math.abs(dy));
  if (!d) return "рядом";
  return LAB.dirWord(dx, dy).replace("здесь", "рядом") + ", " + stepsW(d);
}
game.relDir = relDir;
/* Где это на этаже — для журнала безопасности ОКО. */
function placeName(x, y) {
  var r = roomAt(x, y);
  if (r) return "помещение «" + r.name + "»";
  var c = LAB.corrOf(CUR.fl, x, y);
  if (c) { var d = CUR.fl.doors.filter(function (q) { return q.id === c.door; })[0], rr = d ? CUR.fl.rooms[d.room] : null; return "коридор у двери «" + (rr ? rr.name : "помещения") + "»"; }
  return "этаж";
}
game.placeName = placeName;

/* ════════ ОСМОТРЕТЬСЯ (два пальца вверх) ════════ */
function lookAround() {
  if (G.stair) { stairsInfo(); return; }
  if (!game.entered) return;
  /* порядок (1.5): что в помещении и где — потом проходы и двери — потом само помещение,
     в конце уровень и этаж. Любой жест обрывает речь: главное звучит первым. */
  var r = roomAt(G.x, G.y), parts = [];
  if (r) {
    var st = roomStuff(r, false, true);
    parts.push(st || "В помещении пусто.");
    var ex = roomExits(r); parts.push(ex || "Выходов не видно.");
    parts.push("Помещение: " + r.name + ". " + (r.desc || LAB.ROOMS[r.type].desc));
  } else if (LAB.corrOf(CUR.fl, G.x, G.y) && cellType(G.x, G.y) !== T.DOOR) {
    var cor = LAB.corrOf(CUR.fl, G.x, G.y), cs = corrStuff(cor);
    if (cs) parts.push(cs);
    var foesC = LAB.combat ? LAB.combat.visibleFoes(12) : [];
    if (foesC.length) parts.push("Опасность: " + foesC.map(function (f) { return f.name + " " + relDir(f.x, f.y); }).join(", ") + "!");
    parts.push(corridorText(cor, false));
  } else {
    var near = corrStuff(null);
    if (near) parts.push(near);
    var foes = LAB.combat ? LAB.combat.visibleFoes(10) : [];
    if (foes.length) parts.push("Опасность: " + foes.map(function (f) { return f.name + " " + relDir(f.x, f.y); }).join(", ") + "!");
    parts.push(cellType(G.x, G.y) === T.DOOR ? "Дверной проём." : "Коридор.");
    var ways = [];
    ["N", "E", "S", "W"].forEach(function (k) {
      var d = DIRS[k], nx = G.x + d[0], ny = G.y + d[1], tt = cellType(nx, ny);
      if (tt === T.CORR) ways.push(LAB.DIRN[k] + " — коридор");
      else if (tt === T.ROOM) { var rr = roomAt(nx, ny); ways.push(LAB.DIRN[k] + " — " + (rr ? rr.name : "помещение")); }
      else if (tt === T.DOOR) { var dd = CUR.fl.doorAt[idx(nx, ny)]; if (!(dd.lock && dd.lock.type === "secret" && !secretFound(dd))) ways.push(LAB.DIRN[k] + " — дверь" + (doorOpen(dd) ? ", открыта" : "")); }
    });
    parts.push(ways.length ? "Пути: " + ways.join("; ") + "." : "Тупик.");
  }
  /* сквозняк из тайника */
  var sd = nearSecret(2);
  if (sd) parts.push("Тянет сквозняком " + LAB.DIRFROM[sd.dir] + ".");
  if (G.event !== "norm") { var ev = eventList().filter(function (e) { return e.id === G.event; })[0]; if (ev) parts.push("Обстановка: " + ev.n.toLowerCase() + "."); }
  parts.push("Уровень " + G.L + ", этаж " + G.F + ".");
  say(parts.join(" "));
  A("play", "scan_soft");
}
/* Что лежит и стоит в коридоре (или у дверного проёма) рядом с вами: вещи на полу,
   ловушки, о которых вы знаете, выжившие. cor — коридор или null (рядом, до 6 шагов). */
function corrStuff(cor) {
  var inC = function (x, y) { if (cor) { var c2 = LAB.corrOf(CUR.fl, x, y); return c2 === cor; } return Math.max(Math.abs(x - G.x), Math.abs(y - G.y)) <= 6 && !roomAt(x, y); };
  var items = floorItems().filter(function (it) { return inC(it.x, it.y); }).map(function (it) { return itemName(it) + " " + relDir(it.x, it.y); });
  var objs = CUR.fl.objs.filter(function (o) { return o.room == null && inC(o.x, o.y) && Math.max(Math.abs(o.x - G.x), Math.abs(o.y - G.y)) <= 12; }).map(function (o) { return objName(o) + " " + relDir(o.x, o.y); });
  var npcs = CUR.fl.npcs.filter(function (n) { return inC(n.x, n.y); }).map(function (n) { return npcName(n) + " " + relDir(n.x, n.y); });
  var trapsL = LAB.traps ? LAB.traps.lookList(function (x, y) { return inC(x, y); }) : "";
  var s = [];
  if (items.length) s.push("На полу: " + items.slice(0, 5).join(", ") + (items.length > 5 ? " и ещё " + (items.length - 5) : "") + ".");
  if (objs.length) s.push("Здесь: " + objs.slice(0, 6).join(", ") + ".");
  if (trapsL) s.push(trapsL);
  if (npcs.length) s.push("Живые: " + npcs.join(", ") + ".");
  return s.join(" ");
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
    /* (1.5) ловушки вплотную */
    if (LAB.traps) LAB.traps.adjacent(x, y, k).forEach(function (q) { if (!out.some(function (o) { return o.ref === q.ref; })) out.push(q); });
  });
  /* и под ногами: только что поставленная ловушка ждёт, когда вы отойдёте */
  if (LAB.traps) LAB.traps.adjacent(G.x, G.y, null).forEach(function (q) { if (!out.some(function (o) { return o.ref === q.ref; })) out.push(q); });
  return out;
}
game.adjacentTargets = adjacentTargets;
function targetName(t) {
  if (t.type === "obj") return objName(t.ref);
  if (t.type === "npc") return npcName(t.ref);
  if (t.type === "door") return "Дверь: " + lockText(t.ref) + (doorOpen(t.ref) ? ", открыта" : "");
  if (t.type === "secret") return "Стена со сквозняком";
  if (t.type === "foe") return t.ref.name;
  if (t.type === "trap") return LAB.traps.targetName(t.ref);
  if (t.type === "turret") return t.ref.name + (t.ref.cut ? ", кабель перерезан" : t.ref.mine ? ", признала вас по ключу" : t.ref.ally ? ", перехвачена" : t.ref.calm ? ", обесточена" : ", под током");
  if (t.type === "camera") return t.ref.name.split(",")[0] + ", " + camWord(LAB.combat.camState(t.ref));
  return "";
}
/* Турели вплотную — и наискосок: к турели подходят по диагонали, вне её линии огня. */
function turretsNear() {
  var cb = LAB.combat;
  if (!cb || !cb.isTurret) return [];
  return cb.foes().filter(function (f) { return cb.isTurret(f) && Math.max(Math.abs(f.x - G.x), Math.abs(f.y - G.y)) <= 1; });
}
game.turretsNear = turretsNear;
/* Камеры вплотную (и наискосок): кожух и сервисный разъём под рукой. */
function camsNear() {
  var cb = LAB.combat;
  if (!cb || !cb.cams) return [];
  return cb.cams().filter(function (f) { return Math.max(Math.abs(f.x - G.x), Math.abs(f.y - G.y)) <= 1; });
}
game.camsNear = camsNear;
/* У самой камеры: петля через сервисный разъём, снять питание под кожухом,
   перепрошить. Быстрее, чем с терминала, но камеру надо обойти так, чтобы
   она смотрела в другую сторону. */
function cameraSabotage(f) {
  var cb = LAB.combat, k = cb.camState(f), dif = okoDiff(), items = [];
  var spotted = function () { if (LAB.oko) LAB.oko.event("camera", { x: G.x, y: G.y }); if (LAB.combat) LAB.combat.noise(6); };
  if (k !== "off") items.push({ label: "Закольцевать запись: подключить петлю к сервисному разъёму (повторите сигналы)", fn: function () {
    UIx("closeAll");
    LAB.mini.hack(hackLength(1 + Math.floor(Math.min(G.L, 20) / 6) + dif), function (ok) {
      if (!ok && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы отняли руки от разъёма. Камера ничего не заметила."); return; }
      if (!ok) { A("play", "term_err"); say("Разъём щёлкнул и сбросил петлю: камера доложила о вмешательстве."); spotted(); return; }
      var t = camTicks(150); cb.camSet(f, "loop", t); A("play", "term_ok"); gainXP(5);
      say("Петля подключена: примерно " + secs(t) + " эта камера показывает ОКО пустой коридор.");
      if (LAB.oko) LAB.oko.event("cam_loop", { x: f.x, y: f.y });
    }, { title: "Петля камеры" });
  } });
  if (k !== "off") items.push({ label: "Вскрыть кожух и снять питание: камера ослепнет, пока не придёт ремонтник", fn: function () {
    UIx("closeAll");
    LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 5) + dif), function (ok) {
      if (!ok && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы оставили кожух. Камера цела."); return; }
      if (!ok) { A("play", "w_shock_crack"); say("Искра из кожуха — камера дёрнулась и доложила о вмешательстве."); spotted(); return; }
      cb.camSet(f, "off"); A("play", "power_off"); gainXP(6); if (LAB.combat) LAB.combat.noise(4);
      say("Питание снято: камера " + relDir(f.x, f.y) + " ослепла. ОКО это заметит и пришлёт ремонтника.");
      if (LAB.oko) LAB.oko.event("cam_cut", { x: f.x, y: f.y });
    }, { title: "Кожух камеры" });
  } });
  if (k !== "off" && k !== "ours") items.push({ label: "Перепрошить через сервисный разъём: камера будет докладывать «чисто» и подсказывать вам (настройка частот)", fn: function () {
    UIx("closeAll");
    LAB.mini.sortTones(4 + Math.min(2, dif + Math.floor(G.L / 30)), function (ok) {
      if (!ok && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы отключились от разъёма."); return; }
      if (!ok) { A("play", "term_err"); say("Прошивка не встала: камера доложила о сбое."); spotted(); return; }
      var t = camTicks(360); cb.camSet(f, "ours", t); A("play", "term_ok"); gainXP(10);
      say("Камера " + relDir(f.x, f.y) + " перепрошита: примерно " + secs(t) + " она докладывает ОКО «чисто», а вам говорит, кого видит.");
      if (LAB.oko) LAB.oko.event("cam_flash", { x: f.x, y: f.y });
    }, { title: "Прошивка камеры" });
  } });
  items.push({ label: "Осмотреть камеру", keep: true, fn: function () { say(cb.describe(f) + ". Сейчас она " + camWord(cb.camState(f)) + ". Подходить к камере лучше, пока она смотрит в другую сторону: поворот слышно по писку сервопривода."); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", f.name.split(",")[0], items);
}
game.cameraSabotage = cameraSabotage;
/* У самой турели: перерезать кабель питания (быстро, шумно — ОКО пришлёт
   ремонтника) или приложить служебный ключ ОКО. */
function turretSabotage(f) {
  var cb = LAB.combat, items = [];
  var cutter = (G.weapons || []).some(function (w) { return w && w.base === "cutter"; });
  var live = !f.cut && !f.calm && !f.ally;
  if (!f.cut && !f.mine) items.push({ label: "Вскрыть кожух и перерезать кабель питания: повторите сигналы" + (cutter ? " (плазменный резак — короче)" : ""), fn: function () {
    UIx("closeAll");
    var n = hackLength(1 + Math.floor(Math.min(G.L, 20) / 5) + okoDiff() - (cutter ? 1 : 0));
    LAB.mini.hack(n, function (ok) {
      if (!ok && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы отняли руки от кожуха. Турель цела."); return; }
      if (!ok && !live) { say("Не вышло: кабель цел. Турель обесточена — током не ударило."); return; }
      if (cb.cutTurret(f, !!ok)) gainXP(8);
    }, { title: "Кабель турели" });
  } });
  if ((G.inv.okokey || 0) > 0 && !f.cut && !f.mine) items.push({ label: "Приложить служебный ключ ОКО (" + G.inv.okokey + " шт.): турель признает вас своим", fn: function () {
    UIx("closeAll");
    G.inv.okokey--;
    if (!cb.mineTurret(f)) { G.inv.okokey++; say("Турель не принимает ключ."); return; }
    say("Ключ принят: " + f.name + " " + relDir(f.x, f.y) + " считает вас техником сети и бьёт по вашим врагам на своей линии. Контрвзлом её не вернёт — пока ОКО не отзовёт ключ.");
    gainXP(6);
    if (LAB.oko) LAB.oko.event("okokey", { x: f.x, y: f.y });
  } });
  items.push({ label: "Осмотреть турель", keep: true, fn: function () { say(cb.describe(f) + ". Стреляет только по своей линии — по прямой вдоль ряда и столбца; наискосок она вас не достанет. После серии выстрелов перегревается на пару секунд."); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", f.name, items);
}
game.turretSabotage = turretSabotage;
/* Навигатор не ведёт: отражённый сигнал «Отражения» или глушилка робота рядом.
   Всегда с признаками — откуда помеха и как восстановить ориентацию. */
function navJammed() {
  var nj = LAB.depths ? LAB.depths.navJam() : 0;
  if (nj > 0) { A("play", "jam"); say("Навигатор сбит отражённым сигналом: в его сигнале эхо. Ещё " + Math.ceil(nj / 2) + " " + plural(Math.ceil(nj / 2), "секунда", "секунды", "секунд") + ". Маяки и стены не врут — ориентируйтесь по ним."); return true; }
  if (LAB.combat && LAB.combat.jammed()) {
    var jm = LAB.combat.jammer ? LAB.combat.jammer() : null;
    A("play", "jam");
    say("Навигатор глохнет: рядом робот с глушилкой" + (jm ? " — " + relDir(jm.x, jm.y) : "") + ". Отойдите от него дальше шести шагов или разбейте его — навигатор вернётся.");
    return true;
  }
  return false;
}
game.navJammed = navJammed;
function nearbyInfo() {
  if (G.stair) { stairsInfo(); return; }
  var t = adjacentTargets();
  if (!t.length) {
    var r = roomAt(G.x, G.y);
    say((r ? r.name : "Коридор") + ". Рядом пусто. Осмотреться — " + LAB.K("два пальца вверх.", "Tab."));
    return;
  }
  say(t.map(function (q) { return targetName(q) + ", " + (q.dir ? LAB.DIRN[q.dir] : "под ногами"); }).join(". ") + LAB.K(". Двойное касание — действия.", ". Enter — действия."));
}
game.nearbyInfo = nearbyInfo;

/* ════════ ДЕЙСТВИЯ (двойное касание одним пальцем) ════════ */
function interact() {
  if (game.paused || G.dead) return;
  if (G.stair) { stairsInfo(); return; }
  if (!game.entered || G.done && !findObj("express")) { if (G.done) { /* после финала */ } }
  var targets = adjacentTargets();
  var f = CUR.focus;
  if (f && (Date.now() - CUR.lastBump < 60000)) {
    var still = targets.filter(function (q) { return q.ref === f.ref; })[0];
    if (still) targets = [still].concat(targets.filter(function (q) { return q.ref !== f.ref; }));
  }
  targets = targets.filter(function (q) { return q.type !== "foe"; });
  turretsNear().forEach(function (t) { targets.push({ type: "turret", ref: t, dir: null }); });
  camsNear().forEach(function (c) { targets.push({ type: "camera", ref: c, dir: null }); });
  if (!targets.length) {
    var sec = nearSecret(1);
    if (sec) { secretMenu(sec.d); return; }
    say("Рядом ничего, с чем можно что-то сделать. Подойдите вплотную к двери, терминалу или установке.");
    LAB.UI.error();
    return;
  }
  if (targets.length > 1 && !(f && targets[0].ref === f.ref)) {
    UIx("menu", "Что рядом", targets.map(function (q) {
      return { label: targetName(q) + " — " + (q.dir ? LAB.DIRN[q.dir] : q.type === "trap" ? "под ногами" : relDir(q.ref.x, q.ref.y)), fn: function () { openTarget(q); } };
    }), { closeFirst: false });
    return;
  }
  openTarget(targets[0]);
}
game.interact = interact;
function openTarget(q) {
  /* закрытая дверь, которую можно открыть, — открывается сразу, без меню */
  if (q.type === "door" && !doorOpen(q.ref) && !doorBlock(q.ref)) {
    var lk = q.ref.lock;
    if (lk && lk.type === "card") A("play", "card_ok");
    if (lk && lk.type === "key") A("play", "door_unlock");
    if (lk && lk.type === "gate") A("play", "gate_card");
    openDoor(q.ref);
    return;
  }
  if (q.type === "door") doorMenu(q.ref, q.dir);
  else if (q.type === "secret") secretMenu(q.ref);
  else if (q.type === "obj") objMenu(q.ref);
  else if (q.type === "npc") npcMenu(q.ref);
  else if (q.type === "turret") turretSabotage(q.ref);
  else if (q.type === "camera") cameraSabotage(q.ref);
  else if (q.type === "trap" && LAB.traps) LAB.traps.trapMenu(q.ref);
}
game.openTarget = openTarget;

/* ── ДВЕРИ ──
   Все двери закрыты, пока игрок их не откроет. Открытая дверь закрывается
   сама, когда в проёме никого нет и игрок отошёл от неё. На двери со
   стороны коридора — табличка: номер помещения и название. */
function doorSign(d) {
  var r = CUR.fl.rooms[d.room];
  if (!r || !r.sign) return "";
  if (roomAt(G.x, G.y) === r) return " Дверь в коридор.";
  return " Табличка: «" + r.sign + "».";
}
game.doorSign = doorSign;
function doorOpened(d) { CUR.openT = CUR.openT || {}; CUR.openT[d.id] = Date.now(); }
game.doorOpened = doorOpened;
function doorAutoClose() {
  var fl = CUR.fl, fs = CUR.fs;
  if (!fl || !fs || !game.entered) return;
  var now = Date.now(), ot = CUR.openT || {};
  for (var i = 0; i < fl.doors.length; i++) {
    var d = fl.doors[i];
    if (fs.doors[d.id] !== 2 || d.kind === "secret" || d.kind === "rubble" || (d.lock && (d.lock.type === "secret" || d.lock.type === "rubble"))) continue;
    if (now - (ot[d.id] || 0) < 3000) continue;
    if (Math.abs(G.x - d.x) + Math.abs(G.y - d.y) < 2) continue;
    if (foeAt(d.x, d.y) || npcAt(d.x, d.y)) continue;
    fs.doors[d.id] = 1;
    A("doorClose", d);
  }
}
game.doorAutoClose = doorAutoClose;
function openDoor(d, auto) {
  CUR.fs.doors[d.id] = 2;
  doorOpened(d);
  /* запертую дверь открыли впервые — ОКО это отмечает */
  if (d.lock && d.lock.type !== "secret" && LAB.oko) { var od = CUR.fs.okoDoor || (CUR.fs.okoDoor = {}); if (!od[d.id]) { od[d.id] = 1; LAB.oko.event("door", { x: d.x, y: d.y }); } }
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
        if (lk && lk.type === "hazard") { A("play", "ev_steam"); sayq("Рама санпропускника проверила костюм: зелёный свет."); }
        openDoor(d);
        if (lk && lk.type === "card") sayq("Пропуск принят.");
      } else {
        if (lk && lk.type === "card") A("play", "card_fail"); else A("play", "door_locked");
        say("Не открывается. " + w);
        if (lk && lk.type === "code") codeEntry(d);
      }
    } });
    /* Код игрок набирает сам: прочитать его можно в записке (инвентарь, «Архив документов»). */
    if (okoLockLeft(d) > 0) items.push({ label: "Взломать аварийную блокировку ОКО (повторите сигналы)", fn: function () {
      UIx("closeAll");
      LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 5)), function (ok) {
        if (ok) { if (CUR.fs.okoLock) delete CUR.fs.okoLock[d.id]; A("play", "door_unlock"); openDoor(d); sayq("Блокировка ОКО снята. Дверь открыта."); }
        else { A("play", "term_err"); say("Сигналы сбились. Блокировка держится."); if (LAB.oko) LAB.oko.report("door", d.x, d.y, "seen"); }
      }, { title: "Замок двери" });
    } });
    if (lk && lk.type === "code") items.push({ label: "Набрать код", fn: function () { codeEntry(d); } });
    if (lk && lk.type === "riddle" && why) items.push({ label: "Выслушать загадку замка", fn: function () { riddleDoor(d); } });
    if (lk && lk.type === "circuit" && why) items.push({ label: "Погасить схему реле (головоломка)", fn: function () { circuitDoor(d); } });
    if (lk && lk.type === "logic" && why) items.push({ label: "Решить задачу замка: " + (LAB.puzzles ? LAB.puzzles.nameOf(lk.kind) : "головоломка"), fn: function () { logicDoor(d); } });
    if (lk && lk.type === "melody" && why) items.push({ label: G.melodies[melKey(d.id)] ? "Сыграть мелодию" : "Сыграть мелодию — сначала найдите её на радиоприёмнике", fn: function () { melodyDoor(d); } });
    /* отмычка под цвет помещения (1.6): под ключ, код, пропуск и блокировку охраны */
    if (lk && why && ["key", "card", "code", "lockdown"].indexOf(lk.type) >= 0) {
      var pk0 = pickFor(d), havePk = G.inv[pk0] || 0;
      if (havePk > 0) items.push({ label: "Открыть отмычкой — " + PICKS[pk0] + " (" + havePk + " шт.)", fn: function () { usePick(d, pk0); } });
      else { var othersPk = Object.keys(PICKS).filter(function (k) { return (G.inv[k] || 0) > 0; }); if (othersPk.length) items.push({ label: "Отмычка не та: нужна " + PICKS[pk0] + ", у вас — " + othersPk.map(function (k) { return PICKS[k]; }).join(", "), info: true, keep: true, fn: function () { say("Для этой двери нужна " + PICKS[pk0] + " отмычка: " + lockText(d) + "."); } }); }
    }
    if (lk && (lk.type === "card" || lk.type === "code") && why) items.push({ label: "Взломать замок (мини-игра)", fn: function () { hackDoor(d); } });
    if (lk && lk.type === "card" && why && (G.inv.decoder || 0) > 0) items.push({ label: "Использовать декодер пропусков (" + G.inv.decoder + " шт.)", fn: function () { G.inv.decoder--; A("play", "card_ok"); openDoor(d); sayq("Декодер подобрал ключ. Дверь открыта."); } });
    if (lk && why && G.implants.indexOf("hack") >= 0 && ["card", "code", "lockdown", "key"].indexOf(lk.type) >= 0) items.push({ label: "Дистанционный взлом — имплант, " + implantCost("hack") + " энергии", fn: function () { if (spendEnergy("hack")) { A("play", "implant"); openDoor(d); sayq("Имплант открыл замок."); } } });
  }
  items.push({ label: "Осмотреть", fn: function () { say("Дверь " + (dir ? LAB.DIRN[dir] : "рядом") + ". " + capital(lockText(d)) + ". " + (open ? "Открыта." : (why || "Можно открыть."))); } });
  UIx("menu", title, items);
}
/* Голосовой замок: загадка; неверный ответ — тревога и подсказка, замок молчит минуту. */
function riddleDoor(d) {
  var fs = CUR.fs; fs.riddleWait = fs.riddleWait || {};
  if (fs.riddleWait[d.id] > Date.now()) { say("Замок молчит после неверного ответа. Подождите немного."); return; }
  var rd = riddleFor(d.lock.rid, G.L);
  askRiddle(rd, "Голосовой замок", function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Ответ принят. Замок открыт."); gainXP(12); if (LAB.oko) LAB.oko.event("riddle_ok"); }
    else { A("play", "code_fail"); fs.riddleWait[d.id] = Date.now() + 45000; say("Неверно. Замок завыл сиреной. Подсказка: " + rd.hint); if (LAB.oko) LAB.oko.event("riddle_fail"); }
  });
}
/* Загадка: четыре ответа вперемешку. */
function askRiddle(rd, title, cb) {
  var opts = rd.a.map(function (a, i) { return { a: a, ok: i === 0 }; });
  var r = LAB.Rng(G.seed, "rd:" + rd.q);
  r.shuffle(opts);
  A("play", "radio");
  UIx("menu", title + ": «" + rd.q + "»", opts.map(function (o) { return { label: o.a, fn: function () { cb(o.ok); } }; }).concat([{ label: "Отойти, не отвечая", fn: function () { say("Вы отходите. Замок ждёт."); } }]));
}
game.askRiddle = askRiddle;
/* Логический замок (1.6): задача из жизни комплекса, у каждой двери своя. */
function logicDoor(d) {
  UIx("closeAll");
  if (!LAB.puzzles) { say("Замок молчит."); return; }
  LAB.puzzles.open(d.lock.kind, d.lock.seed, function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Замок принял решение. Дверь открыта."); gainXP(14 + 8 * (d.lock.diff || 0)); }
    else { A("play", "term_err"); sayq("Замок не принял решение: можно подойти снова."); if (LAB.combat) LAB.combat.noise(3); }
    if (LAB.oko && LAB.oko.react) LAB.oko.react(ok ? "puzzle_ok" : "puzzle_fail");
  }, { title: "Логический замок", diff: d.lock.diff });
}
/* (1.6) Отмычки — по виду помещения за дверью: жёлтая — служебные, синяя —
   серверные и узлы связи, красная — режимные и посты охраны, зелёная —
   медицинские блоки и лаборатории. Открывают дверь под ключ, код, пропуск
   или блокировку охраны без мини-игры; одна отмычка — одна дверь. */
var PICKS = { lockpick: "жёлтая", pick_b: "синяя", pick_r: "красная", pick_g: "зелёная" };
function pickFor(d) {
  var ri = d.lockChild != null && d.lockChild >= 0 ? d.lockChild : d.room;
  var rm = (CUR.fl.rooms && CUR.fl.rooms[ri]) || null;
  var t = rm ? String(rm.type || "") : "", nm = rm ? String(rm.name || "") : "";
  if (/server|comms|ailab|sequencer|switchboard|workroom|neuro|accdesk|chiefdesk|powerdesk|radio|telecom|x_serverniche|x_node|x_comms|x_switch|x_relay/.test(t) || /сервер|узел|узлов|связ|вычислит|данн|коммутац|радиорубк|телеметр|диспетч/i.test(nm)) return "pick_b";
  if (/arsenal|bastion|hq|guard|armor|ballistics|security|bunker|range|testbench|x_guardbooth|x_armory|x_security/.test(t) || /охран|арсенал|оружейн|режимн|бункер|стрельбищ|ОКО|безопасност|караул|допуск/i.test(nm)) return "pick_r";
  if (/med|surgery|isolator|genelab|incubator|vivarium|embryo|cloning|regen|sleeplab|lab|quarantine|decon|cryo|samples|x_medrec|x_lab|x_ward/.test(t) || /мед|лазарет|операц|изолятор|карантин|лаборатор|генет|инкубат|вивар|проб|реактив|крио|палат/i.test(nm)) return "pick_g";
  return "lockpick";
}
game.pickFor = pickFor;
game.PICKS = PICKS;
function usePick(d, pk) {
  if (!(G.inv[pk] > 0)) return;
  G.inv[pk]--; if (G.inv[pk] <= 0) delete G.inv[pk];
  A("play", "pry"); CUR.fs.doors[d.id] = 1; openDoor(d);
  sayq("Отмычка " + PICKS[pk] + " сработала: замок открыт." + (G.inv[pk] ? "" : " Отмычек этого цвета больше нет."));
  if (LAB.ach) LAB.ach.ev("pick", 1);
}
function circuitDoor(d) {
  UIx("closeAll");
  LAB.mini.relays(d.lock.n + (LAB.oko ? Math.min(1, LAB.oko.difficulty()) : 0), function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Схема погасла. Замок открыт."); gainXP(12); }
    else { A("play", "alarm_short"); say("Схема перегрелась. Попробуйте ещё раз."); if (LAB.combat) LAB.combat.noise(8); }
  }, { title: "Электронный замок", seed: d.lock.seed, ring: d.lock.n >= 6 });
}
function melodyDoor(d) {
  var m = G.melodies[melKey(d.id)];
  if (!m) { say("Мелодия неизвестна. Где-то на этом этаже радиоприёмник проигрывает её — найдите и прослушайте."); return; }
  UIx("closeAll");
  LAB.mini.melody(m, function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Мелодия совпала. Звуковой замок открыт."); gainXP(14); }
    else { A("play", "code_fail"); say("Замок не узнал мелодию. Ещё раз."); if (LAB.combat) LAB.combat.noise(6); }
  }, { title: "Звуковой замок", mirror: LAB.blockOf(G.L) === 3 });
}
function tryCode(d, code) {
  A("play", "keypad");
  if (code === d.lock.code) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Код принят."); }
  else { A("play", "code_fail"); say("Неверный код."); if (LAB.combat) LAB.combat.noise(5); }
}
function codeEntry(d) {
  UIx("closeAll");
  if (!LAB.mini) return;
  LAB.mini.code(function (code) { if (code) tryCode(d, code); }, { title: "Дверь" });
}
function hackDoor(d) {
  /* есть подходящая отмычка — предложить её вместо мини-игры (1.6) */
  var pk = pickFor(d);
  if ((G.inv[pk] || 0) > 0) {
    UIx("menu", "Взлом замка", [
      { label: "Открыть отмычкой — " + PICKS[pk] + " (" + G.inv[pk] + " шт.)", fn: function () { usePick(d, pk); } },
      { label: "Взламывать вручную: повторить сигналы", fn: function () { hackDoorMini(d); } },
      { label: "Назад", fn: function () {} }
    ]);
    return;
  }
  hackDoorMini(d);
}
function hackDoorMini(d) {
  var lv = d.lock.type === "card" ? d.lock.tier + 1 : 2 + Math.floor(G.L / 3);
  UIx("closeAll");
  LAB.mini.hack(hackLength(lv), function (ok) {
    if (ok) { A("play", "code_ok"); CUR.fs.doors[d.id] = 1; openDoor(d); sayq("Замок взломан."); gainXP(8); }
    else { A("play", "alarm_short"); say("Взлом не удался. Сработала тревога — враги рядом насторожились."); if (LAB.combat) LAB.combat.noise(10); }
  });
}
game.plural = plural;
game.doorMenu = doorMenu;
game.hackDoor = hackDoor;
game.roomAt = function (x, y) { return roomAt(x, y); };
game.hackLength = function (lv) { return hackLength(lv); };
game.autosaveSoon = function () { autosaveSoon(); };
game.openContainer = function (o) { openContainer(o); };
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
  if (LAB.ach) LAB.ach.ev("secret", 1);
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
  if (LAB.depths && LAB.depths.objMenu(o)) return; /* установки глубин под Ядром */
  if (LAB.zones && LAB.zones.objMenu(o)) return; /* кабинеты у коридоров: полки, доски, компьютеры, щиты (1.5) */
  if (o.type === "fx" && LAB.fixtures && LAB.fixtures.menu(o)) return; /* обстановка: диваны, турникеты, плиты… (1.5) */
  if (o.type === "corpse" && LAB.fixtures) { LAB.fixtures.corpseMenu(o); return; } /* тело: осмотреть, карманы, одежда, жетон */
  switch (o.type) {
    case "stairs_down": case "stairs_up": {
      var down = o.type === "stairs_down";
      items.push({ label: down ? "Спуститься по лестнице на этаж " + (G.F + 1) : "Подняться по лестнице на этаж " + (G.F - 1), fn: function () { useStairs(o); } });
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
      items.push({ label: "Отдохнуть в капсуле", fn: function () { if (LAB.capsule) LAB.capsule.menu(o); else rest(o); } });
      break;
    case "capsule":
      if (LAB.capsule) { LAB.capsule.menu(o); return; } /* музыка, чтение, сны (1.5) */
      items.push({ label: "Отдохнуть четыре часа (здоровье и энергия полностью, точка возвращения)", fn: function () { rest(o); } });
      break;
    case "supply": if (LAB.supply) { LAB.supply.postMenu(o); return; } break;
    case "terminal": terminalMenu(o); return;
    case "magnetron": magnetronMenu(o); return;
    case "positron": positronMenu(o); return;
    case "reactor": reactorMenu(o); return;
    case "express":
      items.push({ label: "Подняться на поверхность", fn: function () { UIx("ending", true); } });
      break;
    case "workbench": UIx("craft", o); return;
    case "vending": vendingMenu(o); return;
    case "medst": medMenu(o); return;
    case "charger": chargerMenu(o); return;
    case "implantlab": if (LAB.implants) LAB.implants.station(o); return;
    case "hq": hqMenu(o); return;
    case "crate": case "locker": case "desk": case "corpse": case "safe":
      containerMenu(o); return;
    case "pc": if (LAB.office) { LAB.office.pcMenu(o); return; } break;
    case "radio": radioMenu(o); return;
    case "okoterm": okoMenu(o); return;
    case "puzzle": puzzleMenu(o); return;
    case "coffee": case "drinks": if (LAB.office) { LAB.office.drinkMenu(o); return; } break;
    case "snacks": if (LAB.office) { LAB.office.snackMenu(o); return; } break;
  }
  items.push({ label: "Осмотреть", fn: function () { say(LAB.fixtures ? LAB.fixtures.examine(o) : name + ". " + (LAB.OBJ[o.type] ? LAB.OBJ[o.type].desc : "")); } });
  UIx("menu", name, items);
}
game.objMenu = objMenu;

/* ── РАДИОПРИЁМНИК: эфир и мелодии звуковых замков ── */
function radioMenu(o) {
  var st = objState(o), items = [];
  A("play", "radio");
  if (o.melodyFor) items.push({ label: "Прослушать запись на плёнке", fn: function () {
    UIx("closeAll");
    say("Приёмник шипит, потом из него звучит короткая мелодия. Слушайте.");
    var mk0 = melKey(o.melodyFor);
    later(function () {
      var seq = o.melody.split("");
      var done = function () {
        G.melodies[mk0] = o.melody;
        say("«Эхо» запомнило мелодию: это ключ звукового замка двери «" + o.melodyRoom + "». У двери её надо сыграть самому — " + LAB.K("свайпами", "стрелками или цифрами") + ": " + LAB.mini.sigHelp() + ".");
      };
      /* (2.0) каждый звук — вместе со своей цифрой */
      LAB.mini.playSeq(seq, 0.3, function () { later(done, 300); });
    }, 2600);
  } });
  items.push({ label: "Слушать эфир", fn: function () { A("play", "radio"); say("Сквозь шум: " + rumor()); } });
  items.push({ label: "Осмотреть", fn: function () { say(LAB.OBJ.radio.desc); } });
  UIx("menu", "Радиоприёмник", items);
}
/* ── ГОВОРЯЩАЯ ПАНЕЛЬ ОКО: вопрос, разговор, глушение ── */
function okoMenu(o) {
  var st = objState(o), items = [];
  A("play", "term_on");
  items.push({ label: "Слушать ОКО", fn: function () { if (LAB.oko) LAB.oko.speak(Math.random() < 0.5 ? "taunt" : "riddle", true); } });
  if (!st.asked) items.push({ label: "Ответить на вопрос ОКО", fn: function () {
    var rd = riddleFor((o.seed || 7) + G.L * 31 + G.F, G.L);
    askRiddle(rd, "Вопрос ОКО", function (ok) {
      st.asked = true;
      if (ok) {
        A("play", "term_ok");
        if (!CUR.fs.mapped) { mapFloor(); say("ОКО: «Верно». Панель передаёт в «Эхо» карту этажа. Подозрение ОКО к вам снизилось."); }
        else { var cr = LAB.credits(30, G.L, G.F); G.credits += cr; say("ОКО: «Верно». На ваш счёт переведено " + cr + " кредитов. Подозрение ОКО снизилось."); }
        gainXP(15); if (LAB.oko) LAB.oko.event("riddle_ok"); UIx("refresh");
      } else { A("play", "term_err"); say("ОКО: «Нет». Подсказка, которую оно всё же даёт: " + rd.hint); if (LAB.oko) LAB.oko.event("riddle_fail"); }
    });
  } });
  if (!CUR.fs.okoBlind) items.push({ label: "Заглушить ОКО на этаже (взлом панели)", fn: function () {
    UIx("closeAll");
    LAB.mini.chain([
      function (next) { LAB.mini.bulls(3 + Math.min(1, okoDiff()), next, { title: "Ключ панели" }); },
      function (next) { LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 4) + okoDiff()), next, { title: "Глушение" }); }
    ], function (ok) {
      if (!ok) { termFail(o, st, "Панель отвергла ключ."); return; }
      if (LAB.oko) LAB.oko.event("blind");
      A("play", "term_ok"); say("Панель замолчала. Камеры и уборщики этого этажа больше не докладывают ОКО."); gainXP(14);
    });
  } });
  items.push({ label: "Отойти", fn: function () { A("play", "term_off"); } });
  UIx("menu", "Панель ОКО", items);
}
/* ── СТЕНД С ГОЛОВОЛОМКОЙ: испытание на слух, за него — награда ── */
function puzzleMenu(o) {
  var st = objState(o);
  if (st.solved) { say("Стенд погашен: испытание пройдено."); return; }
  var kinds = { sort: "настройка частот", relays: "схема реле", bulls: "подбор ключа", riddle: "загадка" };
  if (LAB.puzzles) for (var pk in LAB.puzzles.NAMES) kinds[pk] = LAB.puzzles.NAMES[pk];
  var dw = o.diff != null && LAB.puzzles && LAB.puzzles.hasDiff && LAB.puzzles.hasDiff(o.kind) ? ", " + ["простая", "средняя", "сложная"][o.diff] : "";
  UIx("menu", "Стенд испытаний: " + (kinds[o.kind] || "головоломка") + dw, [
    { label: "Пройти испытание", fn: function () {
      var done = function (ok) {
        if (LAB.oko && LAB.oko.react) LAB.oko.react(ok ? "puzzle_ok" : "puzzle_fail");
        if (!ok) { A("play", "term_err"); say("Стенд гаснет и снова загорается: можно попробовать ещё раз."); return; }
        st.solved = true; A("play", "term_ok"); LAB.UI.fanfare(); gainXP(18 + 10 * (o.diff || 0));
        var loot = (o.loot || []).slice(); loot.forEach(function (it, k) { if (!it.id) it.id = o.id + "-p" + k; });
        /* (2.0) за среднюю и сложную задачу — премия кредитами */
        var prize = o.diff ? LAB.credits(15 * o.diff, G.L, G.F) : 0;
        if (prize) G.credits += prize;
        say("Испытание пройдено! Лоток стенда открылся. " + (loot.length ? "Найдено: " + loot.map(function (it) { return giveItem(it); }).join(" ") : "Внутри пусто.") + (prize ? " Премия за сложность: " + prize + " " + plural(prize, "кредит", "кредита", "кредитов") + "." : ""));
        UIx("refresh"); autosaveSoon();
      };
      UIx("closeAll");
      var hard = Math.min(3, Math.floor(G.L / 20));
      if (o.kind === "sort") LAB.mini.sortTones(4 + hard, done, { title: "Настройка частот" });
      else if (o.kind === "relays") LAB.mini.relays(4 + hard, done, { title: "Схема реле", seed: o.seed });
      else if (o.kind === "bulls") LAB.mini.bulls(3 + (hard >= 2 ? 1 : 0), done, { title: "Подбор ключа" });
      else if (LAB.puzzles && LAB.puzzles.has(o.kind)) LAB.puzzles.open(o.kind, o.seed || 1, done, { title: "Стенд испытаний", diff: o.diff });
      else askRiddle(riddleFor(o.seed || 1, G.L), "Загадка стенда", done);
    } },
    { label: "Осмотреть", fn: function () { say(LAB.OBJ.puzzle.desc); } }
  ]);
}

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

/* ════════ ЛЕСТНИЦА: спуск и подъём шагами ════════
   Игрок сам идёт по ступеням: вперёд — дальше по лестнице, назад — обратно
   на этаж. Два пролёта и площадка между ними; сколько ступеней — не
   говорится. Пока игрок на лестнице, этажи ждут: враги не ходят. */
function useStairs(o) {
  if (o.blocked) { A("play", "rubble_hit"); say("Лестница завалена: обломки не сдвинуть. Воспользуйтесь лифтом уровня" + (G.elev[G.L] ? "." : " — пропуск лифта лежит на втором этаже уровня.")); return; }
  var ch = LAB.combat && LAB.combat.chaser();
  if (ch) { say("За вами гонятся вплотную: " + ch.name.split(",")[0].toLowerCase() + " " + relDir(ch.x, ch.y) + ". На лестнице догонит — сначала оторвитесь или отбейтесь."); return; }
  var down = o.type === "stairs_down";
  UIx("closeAll");
  /* один и тот же пролёт сверху и снизу — одинаковой длины */
  var r = LAB.Rng(G.seed, "stair:" + G.L + ":" + (down ? G.F : G.F - 1));
  var f1 = r.int(5, 7), f2 = r.int(5, 7);
  G.stair = { down: down, k: 0, n: f1 + f2, land: f1, x: G.x, y: G.y };
  A("stairEnter", down);
  say((down ? "Вы ступаете на лестницу вниз." : "Вы ступаете на лестницу вверх.") + (G.tut.stairWalk || !hintsOn() ? "" : LAB.K(" Свайп вверх — дальше по ступеням, вниз — обратно. Держите палец — идёте без остановки.", " W — дальше по ступеням, S — обратно. Держите клавишу — идёте без остановки.")));
  G.tut.stairWalk = 1;
}
game.useStairs = useStairs;
function stairStep(dir, run) {
  var s = G.stair, now = Date.now();
  if (now - lastMove < (run ? 240 : 110)) return false;
  if (dir === "W" || dir === "E") { A("bumpRail"); sayOnce("rail", "Перила.", 3000); return false; }
  lastMove = now;
  s.k += dir === "N" ? 1 : -1;
  if (s.k < 0) {
    G.stair = null;
    A("step", surfaceAt(G.x, G.y), run, false);
    say("Вы сошли с лестницы.");
    return false;
  }
  A("stairStep", s.down, s.k, s.n);
  G.stats.steps++;
  if (s.k === s.land && dir === "N") sayOnce("landing", "Площадка. Лестница поворачивает.", 4000);
  if (s.k >= s.n) {
    var down = s.down;
    G.stair = null;
    enterFloor(G.L, down ? G.F + 1 : G.F - 1, down ? "down" : "up");
    if (down && G.F > 1 && !G.tut.stairs && hintsOn()) { G.tut.stairs = 1; sayq("Лестницы на каждом этаже — в разных концах. Навигатор — " + LAB.K("два пальца вправо", "клавиша N") + " — подскажет путь."); }
    return false;
  }
  return true;
}
game.onStairs = function () { return !!G.stair; };
function stairsInfo() { say("Вы на лестнице " + (G.stair.down ? "вниз" : "вверх") + (G.stair.k >= G.stair.land ? ", за площадкой" : "") + ". " + LAB.K("Свайп вверх — дальше, вниз — обратно.", "W — дальше, S — обратно.")); }
/* Шлюз вниз: только с шлюзовой ключ-картой этого уровня, назад — никогда. */
function useGate(o) {
  if (!G.gate[G.L]) {
    A("play", "card_fail");
    say("Считыватель шлюза мигает красным. Нужна шлюзовая ключ-карта уровня " + G.L + ": " + (LAB.LEVELS[G.L].card === "hidden" ? "её спрятали где-то на этом этаже — слушайте маяк ключ-карты." : "её носит страж этого этажа."));
    return;
  }
  var chg = LAB.combat && LAB.combat.chaser();
  if (chg) { say("Шлюз не откроется, пока вплотную враг: " + chg.name.split(",")[0].toLowerCase() + " " + relDir(chg.x, chg.y) + "."); return; }
  UIx("menu", "Спуск на уровень " + (G.L + 1), [
    { label: "Спуститься. Назад пути не будет", fn: function () { descend(o); } },
    { label: "Остаться на этом уровне", fn: function () { say("Ключ-карта при вас. Шлюз подождёт."); } }
  ]);
}
/* Отложенное действие текущей игры: если за это время игрок вышел в меню
   или загрузил другую запись, оно не сработает. */
game.session = 0;
function later(fn, ms) { var s0 = game.session; return setTimeout(function () { if (s0 !== game.session || !game.entered) return; fn(); }, ms); }
game.later = later;
/* Новая игра или загрузка: отложенные фразы и история объявлений прежней игры не звучат. */
function freshSession() {
  LAB.safe(function () { LAB.Speech.later = []; LAB.Speech.held = []; clearTimeout(LAB.Speech.heldTimer); LAB.Speech.heldTimer = null; });
  LAB.safe(function () { if (LAB.history && LAB.history.clear) LAB.history.clear(); });
}
function descend(o, seam) {
  var L0 = G.L;
  UIx("closeAll");
  A("gate", true);
  game.paused = true; game.descending = true;
  say(seam ? "Вы спускаетесь по скобам в колодец Шва. Гул обнимает со всех сторон, металл под руками тёплый." : "Ключ-карта принята. Створки расходятся. Вы входите в шлюзовую камеру — и она уходит вниз.");
  later(function () {
    game.paused = false;
    var left = G.quests.filter(function (q) { return !q.done && q.type !== "main" && q.L === L0; });
    var go = function () {
      if (G.L !== L0) return; /* уже спустились */
      /* прошлый уровень недостижим: его этажи больше не храним (только теперь, когда
         герой внизу: автозапись во время страниц истории не вернёт старый уровень) */
      Object.keys(G.fs).forEach(function (k) { if (k.indexOf(L0 + "-") === 0) delete G.fs[k]; });
      G.quests = G.quests.filter(function (q) { return q.done || q.type === "main" || q.L !== L0; });
      game.descending = false;
      enterFloor(L0 + 1, 1, "gatedown");
      var c = freeNear(findObj("capsule") || findObj("gate_sealed"));
      G.checkpoint = { L: G.L, F: 1, x: c[0], y: c[1] };
      A("gateSeal");
      sayq(seam ? "Над головой с гулом сходится край Шва. Наверх пути нет." : "За спиной с грохотом сходятся створки. Засовы входят в пазы. Пути наверх больше нет.");
      if (left.length) sayq("Невыполненные задания уровня " + L0 + " остались наверху.");
      gainXP(60);
      journal("Спуск на уровень " + G.L + ": " + LAB.LEVELS[G.L].name + ". Путь наверх закрыт.");
      mainQuest();
      UIx("levelBanner");
      autosave();
    };
    /* конец блока: прощальные страницы блока и вступление следующего */
    var b0 = LAB.blockOf(L0), b1 = LAB.blockOf(L0 + 1), pages = [];
    if (b1 !== b0) {
      var B0 = LAB.BLOCKS[b0], B1 = LAB.BLOCKS[b1];
      if (B0 && B0.outro && B0.outro.length) pages = pages.concat(B0.outro);
      if (B1 && B1.intro && B1.intro.length) pages = pages.concat(B1.intro);
      G.blockSeen[b1] = 1;
    }
    if (pages.length) UIx("pages", pages, { title: b1 !== b0 && LAB.BLOCKS[b1] ? "Блок " + ["", "I", "II", "III", "IV", "V"][b1] + ". " + LAB.BLOCKS[b1].name : "", done: function () { UIx("showGame"); go(); } });
    else go();
  }, 5200);
}
/* Главная цель: своя для каждой части пути. */
function mainQuest() {
  var q = G.quests.filter(function (x) { return x.type === "main"; })[0];
  if (!q) { q = { id: "main", giver: "main", giverName: "Эхо", type: "main", done: false }; G.quests.unshift(q); }
  var L = G.L, b = LAB.blockOf(L), B = LAB.BLOCKS[b];
  if (L <= 10) { q.short = "спуститься в Ядро и остановить Разлом"; q.text = "Спуститься в Ядро, на самый нижний уровень «Ковчега», и остановить Разлом у пульта реактора «Исток»."; }
  else if (b === 1) { q.short = "спуститься по Шву к корню Разлома"; q.text = "Ключ у пульта «Истока» не заглушил реактор, а раскрыл Шов. Спуститься по нему туда, откуда идёт гул."; }
  else { q.short = "идти вниз: " + (B && B.name ? "«" + B.name + "»" : "глубже"); q.text = "Идти вниз, к Истоку. Сейчас путь лежит через " + (B && B.name ? "«" + B.name + "»" : "неизвестные уровни") + "."; }
  q.L = L; q.F = LAB.FLOORS_N;
}
game.mainQuest = mainQuest;

function elevatorMenu() {
  if (!G.elev[G.L]) { A("play", "card_fail"); say("Панель лифта мигает: «Нужен пропуск лифта уровня " + G.L + "». Пропуск лифта лежит на втором этаже уровня — у кого-то из сотрудников или на полу."); return; }
  /* лифт возит только на этажи, где вы уже были: остальные для него закрыты —
     туда спускаются по лестнице; сколько этажей всего, игрок узнаёт сам */
  var items = [], focus = 0;
  for (var F = 1; F <= LAB.FLOORS_N; F++) {
    (function (FF) {
      if (!liftOk(G.L, FF)) return;
      var here = FF === G.F;
      if (here) focus = items.length;
      items.push({ label: "Этаж " + FF + (here ? " — вы здесь" : ""), disabled: here, why: "Вы на этом этаже.", fn: function () { ride(FF); } });
    })(F);
  }
  items.push({ label: "Другие этажи — недоступно: лифт возит только туда, где вы уже были", info: true, keep: true, fn: function () { LAB.UI.error(); say("Недоступно. На этажах, где вы ещё не были, лифт не останавливается: туда спускаются по лестнице."); } });
  A("play", "elev_call");
  UIx("menu", "Лифт уровня " + G.L + " — выберите этаж", items, { focus: focus });
  if (!G.tut.elev && hintsOn()) { G.tut.elev = 1; sayq("Лифт везёт только на этажи, где вы уже были. Остальные для него недоступны: туда — по лестнице. " + LAB.K("Свайп вправо или влево — выбрать этаж, двойное касание — ехать.", "Стрелки вверх и вниз — выбрать этаж, Enter — ехать.")); }
}
/* Лифт едет только на этаж, где герой уже был. */
function liftOk(L, F) { return !!G.visited[L + "-" + F]; }
game.liftOk = liftOk;
game.elevatorMenu = elevatorMenu;
game.ride = function (F) { return ride(F); };
function ride(F) {
  if (!liftOk(G.L, F)) { LAB.UI.error(); say("Недоступно: на этаже " + F + " вы ещё не были. Лифт туда не поедет — спускайтесь по лестнице."); return false; }
  if (F === G.F) { say("Вы на этом этаже."); return false; }
  var che = LAB.combat && LAB.combat.chaser();
  if (che) { say("Двери лифта не закроются: вплотную " + che.name.split(",")[0].toLowerCase() + " " + relDir(che.x, che.y) + "."); return; }
  UIx("closeAll");
  var n = Math.abs(F - G.F);
  var ms = Math.min(5000, 1600 + n * 260);
  A("elevRide", ms);
  game.paused = true;
  say("Лифт едет на этаж " + F + ".");
  later(function () { game.paused = false; enterFloor(G.L, F, "elev"); }, ms);
}

function rest(o) {
  if (LAB.combat && LAB.combat.danger()) { say("Нельзя отдыхать: рядом враги."); return; }
  UIx("closeAll");
  A("rest");
  game.paused = true;
  say("Вы ложитесь в капсулу. Гул стихает...");
  later(function () {
    game.paused = false;
    /* капсула кормит раствором: во сне голод не растёт; бодрость — полная, токсины выводятся */
    var bd = body(), f0 = bd.food;
    advanceTime(240, true);
    bd.food = Math.min(100, f0 + 10); bd.wake = 100; bd.tox = Math.max(0, bd.tox - 60); bd.neuro = 0; bd.lv = {};
    G.hp = G.hpMax; G.en = G.enMax; G.st.poison = 0; G.st.slow = 0; G.st.bleed = 0; G.st.deaf = 0;
    say("Вы проснулись. Здоровье, энергия и бодрость полностью восстановлены, токсины выведены, раствор капсулы немного утолил голод.");
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
  tutor("terminal");
  var st = objState(o);
  A("play", "term_on");
  if (st.lockUntil && st.lockUntil > Date.now()) { A("play", "term_err"); say(objName(o) + " заблокирован ОКО после неудачного взлома. Экран мигает: «Повторите позже»."); return; }
  if (terminalProtected(o) && !st.hacked) {
    UIx("menu", objName(o) + " — защищён паролем", [
      { label: "Взломать (повторите сигналы жестами)", fn: function () {
        UIx("closeAll");
        LAB.mini.hack(hackLength(1 + Math.floor(Math.min(G.L, 20) / 2) + okoDiff()), function (ok) {
          if (ok) { st.hacked = true; A("play", "term_ok"); gainXP(10); sayq("Доступ получен."); if (LAB.oko) LAB.oko.event("terminal_hack", { x: o.x, y: o.y, o: o }); terminalMenu(o); }
          else termFail(o, st, "Доступ запрещён.");
        });
      } },
      { label: "Отойти", fn: function () {} }
    ]);
    say(objName(o) + ". Терминал защищён паролем.");
    return;
  }
  var items = [];
  var iso = st.isoUntil && st.isoUntil > (CUR.fs.okoT || 0) ? Math.ceil((st.isoUntil - (CUR.fs.okoT || 0)) / 2) : 0;
  items.push({ label: "Журналы и сообщения", fn: function () { terminalLogs(o); } });
  if (o.sub === "sec") items.push({ label: "Журнал безопасности ОКО: режим этажа — " + (LAB.oko ? LAB.oko.levelName() : "?"), fn: function () { UIx("note", "Журнал безопасности ОКО", "Режим этажа: " + (LAB.oko ? LAB.oko.levelName() : "?") + ". " + (LAB.oko ? LAB.oko.logText(14) : "")); } });
  /* карта этажа — только в терминалах безопасности и научных */
  if (o.sub === "sec" || o.sub === "sci") items.push({ label: CUR.fs.mapped ? "Карта этажа (уже загружена)" : "Загрузить карту этажа в навигатор", fn: function () {
    if (CUR.fs.mapped) { say("Карта этажа уже в «Эхо»: навигатор ведёт до лестниц и шлюза."); return; }
    mapFloor();
    A("play", "term_ok"); say("Карта этажа загружена в «Эхо». Теперь навигатор ведёт до лестниц, шлюза и всех помещений, а не только до ближайшей двери."); UIx("refresh");
  } });
  if (o.sub === "sec") {
    if (CUR.fl.lockList.some(function (c) { return CUR.fl.locks[c] && CUR.fl.locks[c].type === "lockdown"; }))
      items.push({ label: CUR.fs.lockdown ? "Блокировка дверей снята" : "Снять блокировку дверей (взлом протокола охраны)", fn: function () {
        if (CUR.fs.lockdown) { say("Блокировка уже снята."); return; }
        UIx("closeAll");
        LAB.mini.hack(hackLength(1 + Math.floor(Math.min(G.L, 20) / 3) + okoDiff()), function (ok) {
          if (!ok) { termFail(o, st, "Протокол охраны отверг команду."); return; }
          CUR.fs.lockdown = true; A("play", "term_ok"); A("play", "door_unlock");
          say("Блокировка охраны снята. Двери с блокировкой на этом этаже открываются."); gainXP(6);
          if (LAB.oko) LAB.oko.event("lockdown", { x: o.x, y: o.y });
        }, { title: "Протокол охраны" });
      } });
    /* (1.5) Оборонная сеть доступна всегда: камеры, турели, тревога. Прежде
       без турелей на этаже пункт был серым, а изоляция сегмента ОКО
       выключала все защитные функции — и казалось, что сеть не работает. */
    if (iso) items.push({ label: "Защитные функции: ОКО изолировало сегмент сети, вернёт его примерно через " + iso + " " + plural(iso, "секунду", "секунды", "секунд") + " игры. Обойти изоляцию", fn: function () { isoMenu(o, st); } });
    else items.push({ label: "Оборонная сеть этажа: " + defenseLine(), fn: function () { defenseMenu(o, st); } });
    if (!iso) items.push({ label: CUR.fs.robots ? "Роботы перепрошиты" : "Перепрошить роботов этажа (настройка частот и взлом)", fn: function () {
      if (CUR.fs.robots) { say("Роботы этажа уже не враждебны."); return; }
      UIx("closeAll");
      var dif = okoDiff();
      LAB.mini.chain([
        function (next) { LAB.mini.sortTones(4 + Math.min(3, Math.floor(G.L / 20) + dif), next, { title: "Частоты прошивки" }); },
        function (next) { LAB.mini.hack(hackLength(3 + Math.floor(Math.min(G.L, 20) / 2) + dif), next, { title: "Перепрошивка" }); }
      ], function (ok) {
        if (ok) {
          CUR.fs.robots = true;
          var rc = LAB.combat ? LAB.combat.robotsCalm() : { boss: 0, dropped: 0 };
          A("play", "term_ok");
          say("Прошивка ОКО на этом этаже переписана. Роботы этажа вас больше не трогают." + (rc.dropped ? " Перепрошитые машины выложили то, что несли: слушайте маяки вещей." : "") + (rc.boss ? " Страж уровня чужую прошивку не принял — он по-прежнему враг." : ""));
          gainXP(20); if (LAB.oko) LAB.oko.event("robots", { x: o.x, y: o.y });
        }
        else termFail(o, st, "Перепрошивка сорвалась.");
      });
    } });
  }
  if (o.codeFor) items.push({ label: "Коды доступа этажа", fn: function () { G.codes[o.code] = o.codeRoom; A("play", "term_beep"); say("В базе кодов: дверь «" + o.codeRoom + "» — код " + o.code.split("").join(" ") + ". Код записан в инвентарь: «Пропуска и ключи», «Известные коды». Набирать его у двери — самому."); } });
  if (o.sub === "sci") items.push({ label: objState(o).data ? "Данные уже скачаны" : "Скачать исследовательские данные", fn: function () {
    if (st.data) { say("Данные уже скачаны."); return; }
    st.data = true; var cr = LAB.credits(15 + Math.min(G.L, 10) * 5, G.L, 1) ; G.credits += cr; A("play", "term_ok"); say("Данные проекта скопированы в «Эхо». За них дадут " + cr + " кредитов — уже начислено."); gainXP(8);
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
function okoDiff() { return LAB.oko ? LAB.oko.difficulty() : 0; }
/* Неудачный взлом: ОКО пеленгует, терминал блокируется на минуту. */
function termFail(o, st, why) {
  if (LAB.mini && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Взлом прерван. Вы отошли от терминала до того, как защита сработала."); if (LAB.oko) LAB.oko.heat(2); return; }
  A("play", "term_err");
  st.lockUntil = Date.now() + 60000;
  say(why + " Сработала тревога: ОКО знает, где вы. Терминал заблокирован на минуту.");
  CUR.fs.turretAlert = true;
  if (LAB.combat) LAB.combat.noise(14);
  if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y });
}
function turretStatus() {
  var m = CUR.fs.turretMode;
  var fixing = CUR.fs.repairAt || (LAB.combat && LAB.combat.repairers && LAB.combat.repairers().length);
  return m === "off" ? "отключены" + (fixing ? ", ОКО шлёт ремонтника" : "") : m === "ours" ? "перехвачены, бьют по врагам" + (CUR.fs.counterAt ? ", ОКО готовит контрвзлом" : "") : "под контролем ОКО";
}
/* Оборонная сеть: отключить (схема реле питания) или перехватить (подбор
   ключа ОКО и схема реле). Сложность растёт с глубиной и с тем, как часто
   вы уже взламывали ОКО. */
function turretMenu(o, st) {
  var mode = CUR.fs.turretMode || "on", dif = okoDiff(), Lb = Math.min(20, ((G.L - 1) % 20) + 1), blk = LAB.blockOf(G.L);
  var nRel = Math.min(8, 4 + Math.floor(Lb / 8) + Math.floor(blk / 2) + (dif > 1 ? 1 : 0)), keyLen = Math.min(5, 3 + (blk >= 3 ? 1 : 0) + (dif >= 3 ? 1 : 0));
  var items = [];
  if (mode !== "off") items.push({ label: "Отключить турели: погасить схему реле питания (" + nRel + " реле)", fn: function () {
    UIx("closeAll");
    LAB.mini.relays(nRel, function (ok) {
      if (!ok) { termFail(o, st, "Схема питания перегрелась."); return; }
      if (LAB.combat) LAB.combat.turretsOff();
      CUR.fs.counterAt = 0;
      A("play", "power_off"); A("play", "term_ok"); say("Питание турелей этажа снято. Турели замолчали." + (LAB.oko && LAB.oko.difficulty() >= 1 ? " ОКО может запустить резервный контур: разомкните его здесь же." : "")); gainXP(10);
      if (LAB.oko) LAB.oko.event("turret_off", { x: o.x, y: o.y });
    }, { title: "Питание турелей", ring: nRel >= 6 });
  } });
  if (mode !== "ours") items.push({ label: "Перехватить турели: подобрать ключ ОКО (" + keyLen + " цифры) и погасить схему", fn: function () {
    UIx("closeAll");
    LAB.mini.chain([
      function (next) { LAB.mini.bulls(keyLen, next, { title: "Ключ оборонной сети" }); },
      function (next) { LAB.mini.relays(Math.max(3, nRel - 1), next, { title: "Схема опознавания своих", ring: nRel >= 7 }); }
    ], function (ok) {
      if (!ok) { termFail(o, st, "Оборонная сеть отвергла ключ."); return; }
      if (LAB.combat) LAB.combat.turretsOurs();
      CUR.fs.repairAt = 0;
      A("play", "term_ok"); say("Турели этажа ваши: теперь они бьют по роботам и тварям на своей линии. ОКО попытается вернуть их — перехват можно закрепить здесь же."); gainXP(18);
      if (LAB.oko) LAB.oko.event("turret_hack", { x: o.x, y: o.y });
    });
  } });
  /* служебный ключ ОКО не отключает оборону целиком: он открывает команды
     отдельным турелям — по одной на ключ */
  if ((G.inv.okokey || 0) > 0 && LAB.combat) items.push({ label: "Служебный ключ ОКО (" + G.inv.okokey + " шт.): команда одной турели", fn: function () { keyTurretList(o); } });
  if (mode === "off" && CUR.fs.backupAt && !CUR.fs.cutHold) items.push({ label: "Разомкнуть резервный контур турелей: удержать ритм реле", fn: function () {
    UIx("closeAll");
    LAB.mini.rhythm(3 + Math.min(2, dif), function (ok) {
      if (!ok) { say("Ритм сбился: резервный контур остался под током."); if (LAB.oko) LAB.oko.heat(4); return; }
      CUR.fs.cutHold = true; A("play", "term_ok"); say("Резервный контур разомкнут: турели не оживут сами. Ремонтников ОКО это не остановит.");
    });
  } });
  if (mode === "ours") items.push({ label: "Закрепить перехват: удержать ритм шифрования", fn: function () {
    UIx("closeAll");
    LAB.mini.rhythm(3 + Math.min(2, dif), function (ok) {
      if (!ok) { say("Ритм сбился. ОКО ближе к своим турелям."); if (LAB.oko) LAB.oko.heat(5); return; }
      A("play", "term_ok"); say("Шифрование удержано: ОКО отложило контрвзлом."); if (LAB.oko) LAB.oko.event("turret_hold");
    });
  } });
  items.push({ label: "Состояние сети", keep: true, fn: function () { say("Турелей на этаже: " + (LAB.combat ? LAB.combat.turretsLeft() : 0) + ". Сейчас: " + turretStatus() + ". " + (dif ? "ОКО усложнило протоколы после прошлых взломов." : "Протоколы обычные.")); } });
  items.push({ label: "Назад", fn: function () { defenseMenu(o, st); } });
  UIx("menu", "Турели этажа", items);
}
/* ── ОБОРОННАЯ СЕТЬ ЭТАЖА (1.5) ──
   Камеры (петля записи, снятое питание, перепрошивка), турели, тревога.
   Всё, что вы делаете с сетью, ОКО потом возвращает: петлю замечает,
   когда она кончается, чужую прошивку стирает проверкой целостности,
   к обесточенной камере шлёт ремонтника, сброшенную тревогу поднимает
   снова, если вас увидят. */
function camWord(k) { return k === "off" ? "обесточена" : k === "ours" ? "перепрошита, докладывает «чисто»" : k === "loop" ? "на петле записи" : "смотрит для ОКО"; }
function camLine() {
  var cb = LAB.combat, cs = cb && cb.cams ? cb.cams() : [];
  if (!cs.length) return "камер нет";
  var by = { on: 0, loop: 0, ours: 0, off: 0 };
  cs.forEach(function (f) { by[cb.camState(f)]++; });
  var p = [];
  if (by.on) p.push("смотрят " + by.on); if (by.loop) p.push("на петле " + by.loop); if (by.ours) p.push("ваших " + by.ours); if (by.off) p.push("обесточено " + by.off);
  return cs.length + " " + plural(cs.length, "камера", "камеры", "камер") + " (" + p.join(", ") + ")";
}
function defenseLine() {
  var nT = LAB.combat ? LAB.combat.turretsLeft() : 0;
  return camLine() + "; " + (nT ? nT + " " + plural(nT, "турель", "турели", "турелей") + ", " + turretStatus() : "турелей нет") + (LAB.oko ? "; режим — " + LAB.oko.levelName() : "");
}
/* Сколько тактов ОКО (полсекунды) держится петля или прошивка: глубже и после частых взломов — меньше. */
function camTicks(base) { var dif = okoDiff(), blk = LAB.blockOf(G.L); return Math.max(40, Math.round(base * (1 - 0.08 * dif - 0.03 * (blk - 1)) + Math.random() * base * 0.25)); }
function secs(t) { var s = Math.round(t / 2); return s + " " + plural(s, "секунду", "секунды", "секунд"); }
function defenseMenu(o, st) {
  var cb = LAB.combat, items = [], nT = cb ? cb.turretsLeft() : 0, cs = cb && cb.cams ? cb.cams() : [];
  if (cs.length) items.push({ label: "Камеры этажа: " + camLine(), fn: function () { camerasMenu(o, st); } });
  else items.push({ label: "Камеры: на этаже их нет", disabled: true, why: "На этом этаже ОКО не повесило камер — или их уже разбили.", fn: function () {} });
  if (nT) items.push({ label: "Турели этажа: " + nT + ", " + turretStatus(), fn: function () { turretMenu(o, st); } });
  else items.push({ label: "Турели: на этаже их нет", disabled: true, why: "Турелей на этом этаже нет — ни отключать, ни перехватывать нечего. Камеры и тревога — здесь же.", fn: function () {} });
  var lv = LAB.oko ? LAB.oko.level() : 0;
  if (lv >= 2 && lv <= 5) items.push({ label: "Сбросить тревогу: подменить доклады сенсоров (подбор ключа и взлом)", fn: function () {
    UIx("closeAll");
    var dif = okoDiff();
    LAB.mini.chain([
      function (next) { LAB.mini.bulls(Math.min(5, 3 + (dif >= 2 ? 1 : 0)), next, { title: "Ключ сенсоров" }); },
      function (next) { LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 4) + dif), next, { title: "Подмена докладов" }); }
    ], function (ok) {
      if (!ok) { termFail(o, st, "Сенсоры отвергли подмену."); return; }
      if (LAB.oko) { LAB.oko.setLevel(6, "доклады сенсоров подменены с терминала"); LAB.oko.event("alarm_reset", { x: o.x, y: o.y }); }
      A("play", "term_ok"); say("Доклады сенсоров подменены: ОКО потеряло вас и проверяет последнее место, где видело. Уходите оттуда — увидят снова, тревога вернётся."); gainXP(12);
    });
  } });
  items.push({ label: "Состояние сети", keep: true, fn: function () { say("Оборонная сеть этажа: " + defenseLine() + ". " + (okoDiff() ? "ОКО усложнило протоколы после прошлых взломов." : "Протоколы обычные.")); } });
  items.push({ label: "Назад", fn: function () { terminalMenu(o); } });
  UIx("menu", "Оборонная сеть этажа", items);
}
/* Изоляция сегмента: подождать или обойти (взлом маршрутизации). */
function isoMenu(o, st) {
  var iso = st.isoUntil && st.isoUntil > (CUR.fs.okoT || 0) ? Math.ceil((st.isoUntil - (CUR.fs.okoT || 0)) / 2) : 0;
  if (!iso) { defenseMenu(o, st); return; }
  UIx("menu", "Сегмент изолирован", [
    { label: "Обойти изоляцию: перехватить маршрутизацию (взлом)", fn: function () {
      UIx("closeAll");
      LAB.mini.hack(hackLength(3 + Math.floor(Math.min(G.L, 20) / 3) + okoDiff()), function (ok) {
        if (!ok) { termFail(o, st, "Маршрутизатор отверг подмену."); return; }
        st.isoUntil = 0; A("play", "term_ok"); gainXP(8);
        if (LAB.oko) LAB.oko.event("iso_bypass", { x: o.x, y: o.y });
        say("Изоляция обойдена: терминал снова в оборонной сети. ОКО это заметило.");
        defenseMenu(o, st);
      }, { title: "Маршрутизация" });
    } },
    { label: "Подождать: ОКО вернёт сегмент примерно через " + iso + " " + plural(iso, "секунду", "секунды", "секунд") + " игры", keep: true, fn: function () { say("Пока открыто окно, время в игре стоит. Отойдите от терминала и вернитесь позже — или найдите другой терминал безопасности."); } },
    { label: "Назад", fn: function () { terminalMenu(o); } }
  ]);
}
/* Камеры этажа с терминала: все сразу или каждая по отдельности. */
function camerasMenu(o, st) {
  var cb = LAB.combat, cs = cb.cams().slice(), dif = okoDiff();
  cs.sort(function (a, b) { return (Math.abs(a.x - G.x) + Math.abs(a.y - G.y)) - (Math.abs(b.x - G.x) + Math.abs(b.y - G.y)); });
  var items = [];
  var live = cs.filter(function (f) { return cb.camState(f) !== "off"; });
  if (live.length) items.push({ label: "Закольцевать запись всех камер: ОКО на время видит пустые коридоры (частоты и взлом)", fn: function () {
    UIx("closeAll");
    LAB.mini.chain([
      function (next) { LAB.mini.sortTones(4 + Math.min(2, dif + Math.floor(G.L / 30)), next, { title: "Частоты видеопотока" }); },
      function (next) { LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 3) + dif), next, { title: "Петля записи" }); }
    ], function (ok) {
      if (!ok) { termFail(o, st, "Видеосервер заметил подмену."); return; }
      var t = camTicks(110);
      cb.cams().forEach(function (f) { if (cb.camState(f) !== "off") cb.camSet(f, "loop", t); });
      A("play", "term_ok"); gainXP(12);
      say("Запись всех камер этажа закольцована: примерно " + secs(t) + " ОКО видит пустые коридоры. Потом заметит петлю и перезапустит камеры.");
      if (LAB.oko) LAB.oko.event("cam_loop", { all: true, x: o.x, y: o.y });
    });
  } });
  if (live.length) items.push({ label: "Перепрошить все камеры этажа: докладывают «чисто» и подсказывают вам о машинах (ключ, частоты и взлом)", fn: function () {
    UIx("closeAll");
    LAB.mini.chain([
      function (next) { LAB.mini.bulls(Math.min(5, 3 + (dif >= 2 ? 1 : 0) + (G.L >= 40 ? 1 : 0)), next, { title: "Ключ видеосервера" }); },
      function (next) { LAB.mini.sortTones(5 + Math.min(2, dif), next, { title: "Частоты прошивки камер" }); },
      function (next) { LAB.mini.hack(hackLength(3 + Math.floor(Math.min(G.L, 20) / 2) + dif), next, { title: "Прошивка камер" }); }
    ], function (ok) {
      if (!ok) { termFail(o, st, "Прошивка камер сорвалась."); return; }
      var t = camTicks(300);
      cb.cams().forEach(function (f) { if (cb.camState(f) !== "off") cb.camSet(f, "ours", t); });
      A("play", "term_ok"); gainXP(20);
      say("Камеры этажа перепрошиты: примерно " + secs(t) + " они докладывают «чисто», а вам говорят, кого видят. Потом проверка целостности ОКО сотрёт прошивку.");
      if (LAB.oko) LAB.oko.event("cam_flash", { all: true, x: o.x, y: o.y });
    });
  } });
  cs.forEach(function (f) {
    items.push({ label: f.name.split(",")[0] + " " + relDir(f.x, f.y) + ": " + camWord(cb.camState(f)), fn: function () { cameraRemote(o, st, f); } });
  });
  items.push({ label: "Назад", fn: function () { defenseMenu(o, st); } });
  UIx("menu", "Камеры этажа", items);
}
/* Одна камера с терминала. */
function cameraRemote(o, st, f) {
  var cb = LAB.combat, dif = okoDiff(), k = cb.camState(f), items = [];
  if (k !== "off") {
    items.push({ label: "Закольцевать её запись (взлом)", fn: function () {
      UIx("closeAll");
      LAB.mini.hack(hackLength(1 + Math.floor(Math.min(G.L, 20) / 4) + dif), function (ok) {
        if (!ok) { termFail(o, st, "Камера сбросила подключение."); return; }
        var t = camTicks(120); cb.camSet(f, "loop", t); A("play", "term_ok"); gainXP(5);
        say("Камера " + relDir(f.x, f.y) + " на петле: примерно " + secs(t) + " ОКО видит через неё пустой коридор.");
        if (LAB.oko) LAB.oko.event("cam_loop", { x: f.x, y: f.y });
      }, { title: "Петля камеры" });
    } });
    items.push({ label: "Снять питание камеры (схема реле): ослепнет, пока не придёт ремонтник", fn: function () {
      UIx("closeAll");
      LAB.mini.relays(Math.min(7, 4 + Math.floor(LAB.blockOf(G.L) / 2) + (dif > 1 ? 1 : 0)), function (ok) {
        if (!ok) { termFail(o, st, "Щиток камеры перегрелся."); return; }
        cb.camSet(f, "off"); A("play", "power_off"); A("play", "term_ok"); gainXP(6);
        say("Питание камеры " + relDir(f.x, f.y) + " снято: она ослепла. ОКО пришлёт ремонтника — его можно встретить.");
        if (LAB.oko) LAB.oko.event("cam_cut", { x: f.x, y: f.y });
      }, { title: "Питание камеры" });
    } });
    if (k !== "ours") items.push({ label: "Перепрошить камеру: докладывает «чисто» и подсказывает вам (частоты и взлом)", fn: function () {
      UIx("closeAll");
      LAB.mini.chain([
        function (next) { LAB.mini.sortTones(4 + Math.min(2, dif), next, { title: "Частоты камеры" }); },
        function (next) { LAB.mini.hack(hackLength(2 + Math.floor(Math.min(G.L, 20) / 3) + dif), next, { title: "Прошивка камеры" }); }
      ], function (ok) {
        if (!ok) { termFail(o, st, "Прошивка камеры сорвалась."); return; }
        var t = camTicks(320); cb.camSet(f, "ours", t); A("play", "term_ok"); gainXP(10);
        say("Камера " + relDir(f.x, f.y) + " перепрошита: примерно " + secs(t) + " она докладывает ОКО «чисто», а вам говорит, кого видит.");
        if (LAB.oko) LAB.oko.event("cam_flash", { x: f.x, y: f.y });
      });
    } });
  }
  items.push({ label: "Состояние", keep: true, fn: function () { say(f.name.split(",")[0] + " " + relDir(f.x, f.y) + ": " + camWord(cb.camState(f)) + "."); } });
  items.push({ label: "Назад", fn: function () { camerasMenu(o, st); } });
  UIx("menu", f.name.split(",")[0] + " " + relDir(f.x, f.y), items);
}
/* Ключ ОКО на терминале: список турелей этажа — выбрать одну и дать ей команду. */
function keyTurretList(o) {
  var cb = LAB.combat, list = cb.foes().filter(function (f) { return cb.isTurret(f) && !f.cut && !f.mine; });
  if (!list.length) { say("Турелей, которым можно дать команду, на этаже нет."); return; }
  list.sort(function (a, b) { return (Math.abs(a.x - G.x) + Math.abs(a.y - G.y)) - (Math.abs(b.x - G.x) + Math.abs(b.y - G.y)); });
  UIx("menu", "Ключ ОКО: выберите турель", list.map(function (f) {
    var d = Math.abs(f.x - G.x) + Math.abs(f.y - G.y);
    return { label: f.name + ", " + stepsW(d) + ", " + (placeName(f.x, f.y) || relDir(f.x, f.y)) + (f.calm ? ", обесточена" : f.ally ? ", перехвачена" : ", под током"), fn: function () { keyTurretCmd(o, f); } };
  }));
}
function keyTurretCmd(o, f) {
  var cb = LAB.combat;
  UIx("menu", f.name + ": команда по ключу", [
    { label: "Перевести на ваши цели: бить тварей и машины, не носителя", fn: function () {
      if (!(G.inv.okokey > 0)) { say("Ключа нет."); return; }
      G.inv.okokey--;
      cb.mineTurret(f);
      A("play", "card_ok"); A("play", "term_ok");
      say("Ключ техника принят: " + f.name + " — " + (placeName(f.x, f.y) || relDir(f.x, f.y)) + " — бьёт по вашим врагам на своей линии. Контрвзлом её не вернёт, пока ОКО не отзовёт ключ."); gainXP(8);
      if (LAB.oko) LAB.oko.event("okokey", { x: f.x, y: f.y });
    } },
    { label: "Тихо снять с неё питание — как плановое обслуживание", fn: function () {
      if (!(G.inv.okokey > 0)) { say("Ключа нет."); return; }
      G.inv.okokey--;
      cb.quietTurret(f);
      A("play", "card_ok"); A("play", "power_off");
      say("Ключ техника принят: " + f.name + " обесточена «на обслуживание». Тревоги нет; ремонтник ОКО придёт нескоро."); gainXP(6);
      if (LAB.oko) LAB.oko.event("turret_quiet", { x: f.x, y: f.y });
    } },
    { label: "Назад", fn: function () { keyTurretList(o); } }
  ]);
}
/* Карта этажа в «Эхо»: навигатор ведёт до цели целиком. */
function mapFloor() {
  CUR.fs.mapped = true; CUR.seen = CUR.seen || new Uint8Array(LAB.W * LAB.H);
  for (var i = 0; i < CUR.seen.length; i++) if (CUR.fl.t[i] !== T.WALL) CUR.seen[i] = 1;
}
game.mapFloor = mapFloor;
function terminalLogs(o) {
  var key = G.L + "-" + G.F;
  var story = LAB.STORY[key];
  var t = [];
  if (story) t.push("Запись: «" + story.t + "». " + story.x);
  if (o.codeFor) { t.push("Служебная запись: код двери «" + o.codeRoom + "» — " + o.code.split("").join(" ") + "."); G.codes[o.code] = o.codeRoom; }
  var sec = CUR.fl.doors.filter(function (d) { return d.lock && d.lock.type === "secret" && !secretFound(d); })[0];
  if (sec && LAB.hash32(o.id) % 2 === 0) t.push("Заявка на ремонт: «В помещении " + CUR.fl.rooms[sec.room].name + " сквозит из стены. Проверить». Заявка не выполнена.");
  if (!t.length) { var sp = staffPool(); t.push(sp[LAB.hash32(o.id + key) % sp.length].x); }
  A("play", "term_beep");
  archiveAdd("term:" + key + ":" + o.id, "Журналы терминала, уровень " + G.L + ", этаж " + G.F, t.join(" "), objName(o), "Журналы терминалов");
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
  var B = G.L > 10 ? LAB.blockData(G.L) : null;
  if (B && B.rumors && B.rumors.length) R = B.rumors;
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
      mapFloor();
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
  items.push({ label: "Осмотреть", fn: function () { say(LAB.fixtures ? LAB.fixtures.examine(o) : name + ". " + LAB.OBJ[o.type].desc); } });
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
    var nx = n.code === code ? "" : noteFull(n).x || "";
    if (n.code === code || nx.indexOf(sp) >= 0 || nx.indexOf(code) >= 0) return n;
  }
  return null;
}
function openContainer(o) {
  var st = objState(o);
  st.open = true;
  A("container", o.type);
  var loot = (o.loot || []).slice();
  loot.forEach(function (it, k) { if (!it.id) it.id = o.id + "-" + k; }); /* у каждой вещи свой номер: записки из ящиков не сливаются */
  if (o.type === "safe") { gainXP(10); if (LAB.ach) LAB.ach.ev("safe", 1); }
  if (!loot.length) { say(objName(o) + ": ничего полезного."); return; }
  var parts = loot.map(function (it) { return giveItem(it); });
  say("Найдено: " + parts.join(" "));
  checkQuests();
  UIx("refresh");
  autosaveSoon();
}

/* ── МАГАЗИНЫ И СЛУЖБЫ ── */
function priceK() { var k = G.L <= 10 ? 1 + G.L * 0.12 : 1 + 0.15 * (LAB.wealth(G.L, G.F) - 1); if (G.faction === "res") k *= 0.8; return k; }
game.priceK = priceK;
/* Торговый терминал: расходники, броня своей глубины, скупка деталей. */
function vendingMenu(o) {
  A("play", "vend");
  UIx("menu", "Торговый терминал", vendingItems(o), { keep: true, rebuild: function () { return vendingItems(o); } });
}
function vendingItems(o) {
  var goods = [["medkit_s", 1], ["bandage", 1], ["ammo:energy", 1], ["stim", 1], ["antidote", 1], ["sorbent", 1], ["energy_d", 1], ["neuroblock", 1], ["ration", 1], ["glucose", 1], ["ammo:magnetron", 1], ["emp", 1], ["plate", 1], ["noise", 1], ["filter", 1]];
  if (G.L >= 3) goods.push(["decoder", 1], ["lockpick", 1], ["pick_b", 1], ["pick_g", 1]);
  if (G.L >= 5) goods.push(["pick_r", 1]);
  if (G.L >= 4) goods.push(["jammer", 1]);
  if (G.L >= 6) goods.push(["ammo:positron", 1], ["medkit_l", 1], ["turret_kit", 1]);
  /* батареи и расходники своей глубины */
  for (var ak in LAB.AMMO) if (["energy", "magnetron", "positron"].indexOf(ak) < 0 && (LAB.AMMO[ak].depth || 1) <= G.L && (LAB.AMMO[ak].depth || 1) > G.L - 25) goods.push(["ammo:" + ak, 1]);
  /* (1.5) товары с разделом cat — еда, лекарства, защита, инструменты, ценности — у пунктов снабжения */
  for (var ik in LAB.ITEMS) { var idf = LAB.ITEMS[ik]; if (idf.kind !== "part" && !idf.cat && idf.depth && idf.depth <= G.L && idf.depth > G.L - 20 && LAB.srcOk(idf, "buy")) goods.push([ik, 1]); }
  var items = goods.map(function (g) {
    var id = g[0], isAmmo = id.indexOf("ammo:") === 0, name = isAmmo ? LAB.AMMO[id.slice(5)].n : LAB.ITEMS[id].n;
    var base = isAmmo ? (LAB.AMMO[id.slice(5)].price || 40) : LAB.ITEMS[id].price;
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
    var p = Math.round(LAB.ARMORS[a.base].price * (G.L <= 10 ? 1 + 0.15 * (G.L - 1) : 0.6 + 0.4 * LAB.wealth(G.L, G.F)) * LAB.QUAL_MULT[a.qual] * (G.faction === "res" ? 0.8 : 1));
    items.push({ label: "Броня: " + armorLine(a) + " — " + p + " кредитов", fn: function () {
      if (!st.armor[i]) { say("Уже продано."); return; }
      if (G.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G.credits + "."); return; }
      G.credits -= p; var got = st.armor[i]; st.armor[i] = null;
      A("play", "buy");
      say("Куплено. " + giveItem({ kind: "armor", a: got }, true) + " Осталось " + G.credits + " кредитов.");
      UIx("refresh"); autosaveSoon();
    } });
  });
  /* скупка (1.5): всё, что несёте, — оружие, броня и комбинезоны, модули, детали, ценности, лекарства, еда */
  items.push({ label: "Продать: оружие, броню, детали, ценности и всё остальное", keep: false, fn: function () { UIx("closeTop", true); if (LAB.supply) LAB.supply.sellMenu({ who: "terminal", name: "Скупка торгового терминала" }, function () { vendingMenu(o); }); else sellMenu(); } });
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
  if (id.indexOf("ammo:") === 0) G.ammo[id.slice(5)] = (G.ammo[id.slice(5)] || 0) + 1;
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
      G.credits -= p; G.hp = G.hpMax; G.st.poison = 0; G.st.bleed = 0; A("play", "heal"); say("Лечение завершено. Здоровье полное, кровотечение остановлено."); UIx("refresh");
    } },
    { label: "Очистка крови от токсинов — 20 кредитов (токсинов " + Math.round(body().tox) + ")", fn: function () {
      if (body().tox < 1) { say("Токсинов нет."); return; }
      if (G.credits < 20) { say("Не хватает кредитов."); return; }
      G.credits -= 20; body().tox = 0; body().lv = {}; A("play", "heal"); say("Кровь очищена: токсинов нет.");
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
function implantCost(id) { var c = implantDef(id).cost; if (G.faction === "sci") c = Math.round(c * 0.8); if (LAB.implants) c = Math.max(1, Math.round(c * LAB.implants.costK(id))); return c; }
game.implantCost = implantCost;
function spendEnergy(id) {
  var c = implantCost(id), b = body();
  var reserveOk = LAB.implants && LAB.implants.has(id, "reserve");
  if (reserveOk && b.neuro >= 85) c *= 2;
  else if (b.neuro >= 85) { LAB.UI.error(); A("play", "jam"); say("Нейроперегрузка: импланты не отвечают. Нагрузка " + Math.round(b.neuro) + " — подождите, пока спадёт ниже 85, или примите нейроблокатор."); return false; }
  if (b.neuro >= 60) c = Math.round(c * 1.5);
  if (G.en < c) { LAB.UI.error(); say("Не хватает энергии: нужно " + c + ", есть " + G.en + "." + (b.neuro >= 60 ? " При нейроперегрузке импланты тратят больше." : "")); return false; }
  G.en -= c;
  /* каждый имплант нагружает нервы */
  b.neuro = Math.min(100, b.neuro + Math.max(1, Math.round(implantDef(id).cost / 2 * (LAB.implants ? LAB.implants.neuroK(id) : 1))));
  bodyWarn();
  UIx("refresh"); return true;
}
game.spendEnergy = spendEnergy;
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
  if (!o.final && st.key) { say("Ключ повёрнут. Под пультом раскрылся Шов: спуск ниже — там, где гул."); seamMenu(o); return; }
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
        if (s.k === "key") { if (o.final) finale(o); else seamOpen(o); }
        else { say(i === 0 ? "Удержание выровнено. Гул «Истока» стал ровнее." : "Ловушка замерла на вершине пульса. Остался ключ."); reactorMenu(o); }
      });
    } };
  });
  A("play", "reactor_hum_short");
  UIx("menu", "Пульт реактора «Исток»", items);
}
/* На 10-м уровне ключ не глушит «Исток», а сшивает: под пультом
   раскрывается Шов — путь глубже. Интерлюдия — из блока I. */
function seamOpen(o) {
  journal("Ключ «Эхо» повёрнут у пульта «Истока». Реактор не заглох — под ним раскрылся Шов.");
  G.cores["used" + G.L] = true;
  autosave();
  var B = LAB.BLOCKS[1], pages = (B && B.interlude && B.interlude[G.L]) || [
    "Ключ поворачивается. «Эхо» замолкает — и вместо тишины приходит гул, но не сверху: снизу.",
    "«Исток» не глохнет. Он сшивает. Пол реакторного зала расходится, и под ним открывается колодец — старая скважина, раздвинутая складкой. Шов.",
    "Где-то наверху оживает скоростной лифт. Но Разлом не закрылся: его корень — глубже. Путь один — вниз."
  ];
  UIx("pages", pages, { title: "Шов", done: function () { UIx("showGame"); seamMenu(o); } });
}
function seamMenu(o) {
  if (LAB.LEVELS_N <= G.L) { finale(o); return; }
  UIx("menu", "Шов под реактором", [
    { label: "Спуститься в Шов. Назад пути не будет", fn: function () { descend(o, true); } },
    { label: "Остаться на этом этаже", fn: function () { say("Шов гудит под ногами и ждёт."); } }
  ]);
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
  /* (2.0) живой человек рядом с носителем — ОКО это не нравится */
  if (!n.robot && !n.okoSaw) { n.okoSaw = 1; if (LAB.oko && LAB.oko.react) later(function () { LAB.oko.react("survivor"); }, 4000); }
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
    items.push({ label: "Спросить о себе", fn: function () {
      var Bk = G.L > 10 ? LAB.blockData(G.L) : null, life = Bk && Bk.life && Bk.life.length ? Bk.life : LAB.LIFE, view = Bk && Bk.view && Bk.view.length ? Bk.view : LAB.VIEW;
      say(n.n + ", " + n.prof.toLowerCase() + ". " + capital(life[n.life % life.length]) + ". «" + view[n.view % view.length] + "»");
    } });
    var q = G.quests.filter(function (qq) { return qq.giver === n.key && !qq.done; })[0];
    if (!q) items.push({ label: "Спросить о задании", fn: function () { takeQuest(n); } });
    else items.push({ label: "Сдать задание: " + q.short, fn: function () { completeQuest(q, n); } });
    var tr2 = LAB.PROFS[n.prof] && LAB.PROFS[n.prof].trade;
    if (tr2) items.push({ label: "Торговля", fn: function () { tradeMenu(n, tr2); } });
    if (LAB.workshop && LAB.workshop.isEng(n)) items.push({ label: "Спросить о мастерской", fn: function () { LAB.workshop.npcTip(n); } });
    var bdg = LAB.fixtures && LAB.fixtures.badgeItem ? LAB.fixtures.badgeItem(n) : null; if (bdg) items.push(bdg);
    items.push({ label: "Спросить дорогу", fn: function () { navigate(false, true); } });
  }
  items.push({ label: "Попрощаться", fn: function () { say(n.robot ? "До свидания. Протокол помощи ожидает." : "Береги себя, седьмой.", { robot: !!n.robot }); } });
  UIx("menu", npcName(n), items);
}
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function tradeMenu(n, kind) {
  var build = function () { return tradeItems(n, kind); };
  UIx("menu", "Торговля: " + npcName(n), build(), { keep: true, rebuild: build });
}
function tradeItems(n, kind) {
  var goods = kind === "med" ? ["medkit_s", "medkit_l", "bandage", "antidote", "sorbent", "stim", "neuroblock", "painkiller", "coagulant", "antirad", "iodine"] : kind === "food" ? ["stew", "ration", "noodles", "crackers", "nuts", "choco", "glucose", "medkit_s", "bread", "porridge", "fishcan", "water"] : kind === "parts" ? ["scrap", "wire", "chip", "cap", "lens", "magnet", "relay", "cell", "servo", "optic", "lead", "rubber"] : kind === "ammo" ? ["ammo:energy", "ammo:magnetron", "ammo:slug", "emp", "wrepair", "fieldkit", "tape"] : ["medkit_s", "bandage", "ration", "ammo:energy", "chip", "gel", "reagent", "cap", "relay", "wrepair", "repairkit", "respirator", "water"];
  goods = goods.filter(function (id) { return id.indexOf("ammo:") === 0 ? !!LAB.AMMO[id.slice(5)] : !!LAB.ITEMS[id] && (LAB.ITEMS[id].depth || 1) <= Math.max(G.L, 1); });
  var k = priceK() * (n.robot ? 1 : 0.9);
  var items = goods.map(function (id) {
    var isAmmo = id.indexOf("ammo:") === 0, name = isAmmo ? LAB.AMMO[id.slice(5)].n : LAB.ITEMS[id].n;
    var base = isAmmo ? (LAB.AMMO[id.slice(5)].price || 40) : LAB.ITEMS[id].price;
    var p = Math.max(2, Math.round(base * k));
    return { label: "Купить: " + name + " — " + p, fn: function () { buy(id, p); } };
  });
  /* (1.5) продать можно всё: выживший своё берёт дороже */
  items.push({ label: "Продать: оружие, броню, детали, ценности и всё остальное", fn: function () {
    if (LAB.supply) LAB.supply.sellMenu({ who: "npc", npc: kind, name: "Скупка: " + npcName(n) }, function () { tradeMenu(n, kind); });
  } });
  items.unshift({ label: "У вас " + G.credits + " кредитов", disabled: true, fn: function () {} });
  return items;
}

/* ════════ ЗАДАНИЯ ════════ */
/* Сколько заданий этого выжившего уже выполнено: этап хранится в записи игры,
   а не на этаже (этажи из кэша перестраиваются — задания не должны повторяться). */
function questStage(n) { var c = 0; G.quests.forEach(function (q) { if (q.giver === n.key && q.done) c++; }); return Math.max(c, n.stage || 0); }
game.questStage = questStage;
game.takeQuest = function (n) { return takeQuest(n); };
function takeQuest(n) {
  var stg = questStage(n);
  if (G.quests.some(function (q) { return q.id === n.key + ":" + stg; })) { say(n.n + ": «Я уже просил вас об этом»."); return; }
  var h = LAB.hash32(n.key + ":" + stg);
  var t = h % 3, q = { id: n.key + ":" + stg, giver: n.key, giverName: n.n, L: G.L, F: G.F, done: false, stage: stg };
  if (t === 0) {
    var pparts = LAB.PARTS.filter(function (p) { return (LAB.PART_DEPTH[p] || 1) <= Math.max(G.L, 1); });
    var part = pparts[h % pparts.length], need = 2 + (h % 3);
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
  if (LAB.ach) LAB.ach.ev("quest", 1);
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

/* ════════ НАВИГАТОР (два пальца вправо) ════════
   Без карты этажа «Эхо» слышит, где лестница или шлюз, и ведёт к ним
   постепенно: до ближайшей двери или прохода на верном пути. Дошли —
   спросите снова. Карта этажа (терминал безопасности или научный терминал,
   позитронная томография, звуковой зонд) — и навигатор ведёт до цели
   целиком. Остальные цели — только те, что вы уже слышали рядом. */
var navIdx = 0, navLast = 0;
function known(o) { return !!(CUR.fs.mapped || (CUR.seen && CUR.seen[idx(o.x, o.y)])); }
function navTargets() {
  var list = [];
  var down = findObj("stairs_down") || findObj("gate_down") || findObj("reactor");
  var el = findObj("elevator"), up = findObj("stairs_up");
  if (down) list.push({ n: down.type === "stairs_down" ? (down.blocked ? "лестница вниз (завалена)" : "лестница вниз") : down.type === "gate_down" ? "гермошлюз на уровень ниже" : "пульт реактора", o: down, main: true });
  if (el && known(el)) list.push({ n: "лифт этажей", o: el });
  if (up && known(up)) list.push({ n: "лестница вверх", o: up });
  var gc = floorItems().filter(function (it) { return it.kind === "gatepass" && CUR.seen && CUR.seen[idx(it.x, it.y)]; })[0];
  if (gc) list.push({ n: itemName(gc).toLowerCase(), cell: [gc.x, gc.y] });
  var vend = nearestObj(["vending"], true); if (vend) list.push({ n: "торговый терминал", o: vend });
  var sn = nearestObj(["snacks"], true); if (sn && body().food < 60) list.push({ n: "автомат с едой", o: sn });
  /* (2.0) мастерскую этажа «Эхо» слышит с прибытия: станки гудят */
  var wb = nearestObj(["workbench"], true), shop = shopObj();
  if (!wb && shop) list.splice(1, 0, { n: "станки мастерской", o: shop, main: true });
  else if (wb) list.splice(wb === shop ? 1 : list.length, 0, { n: "мастерская", o: wb });
  var cap = findObj("capsule"); if (cap && known(cap)) list.push({ n: "капсула восстановления", o: cap });
  var t = nearestObj(["terminal"], true); if (t) list.push({ n: "ближайший терминал", o: t });
  var m = nearestObj(["magnetron"], true); if (m && CUR.fl.needPower && !CUR.fs.power) list.push({ n: "магнетронная установка", o: m });
  var p = nearestObj(["positron"], true); if (p && CUR.fl.needRubble && !CUR.fs.rubble) list.push({ n: "позитронная установка", o: p });
  var rd = nearestObj(["radio"], true); if (rd && rd.melodyFor && !G.melodies[melKey(rd.melodyFor)]) list.push({ n: "радиоприёмник с мелодией", o: rd });
  var it = nearestItem(); if (it) list.push({ n: "ближайшая вещь: " + itemName(it).toLowerCase(), cell: [it.x, it.y] });
  var sup = nearestObj(["supply"], true); if (sup) list.push({ n: "пункт снабжения", o: sup });
  /* (1.5) в коридоре — его двери: кабинетов у стен бывает больше двадцати */
  var cr = LAB.corrOf(CUR.fl, G.x, G.y), cds = cr ? corridorDoors(cr) : [];
  if (cds.length) list.push({ n: "двери этого коридора: " + cds.length, doors: cds });
  return list;
}
/* Двери кабинетов в стенах коридора — ближние первыми; тайные — только найденные. */
function corridorDoors(cr) {
  return (cr.annex || []).map(function (id) { return CUR.fl.doors[parseInt(id.slice(1), 10)]; }).filter(function (d) {
    return d && !(d.lock && d.lock.type === "secret" && !secretFound(d));
  }).sort(function (a, b) { return (Math.abs(a.x - G.x) + Math.abs(a.y - G.y)) - (Math.abs(b.x - G.x) + Math.abs(b.y - G.y)); });
}
function doorFront(d) {
  var v = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var i = 0; i < 4; i++) { var x = d.x + v[i][0], y = d.y + v[i][1]; if (cellType(x, y) === T.CORR) return [x, y]; }
  return [d.x, d.y];
}
function shopObj() { var id = CUR.fl && CUR.fl.shop; if (!id) return null; for (var i = 0; i < CUR.fl.objs.length; i++) if (CUR.fl.objs[i].id === id) return CUR.fl.objs[i]; return null; }
game.shopObj = shopObj;
function nearestObj(types, onlyKnown) {
  var best = null, bd = 1e9;
  CUR.fl.objs.forEach(function (o) { if (types.indexOf(o.type) < 0) return; if (onlyKnown && !known(o)) return; var d = Math.abs(o.x - G.x) + Math.abs(o.y - G.y); if (d < bd) { bd = d; best = o; } });
  return best;
}
function nearestItem() {
  var best = null, bd = 1e9;
  floorItems().forEach(function (it) {
    var r = roomAt(it.x, it.y); if (!r) return;
    var known2 = CUR.seen && CUR.seen[idx(it.x, it.y)];
    if (!known2) return;
    var d = Math.abs(it.x - G.x) + Math.abs(it.y - G.y); if (d < bd) { bd = d; best = it; } });
  return best;
}
/* Путь: по открытым дверям и тем, что можно открыть; запертые — до двери. */
function routeTo(cell, goalObj) {
  var fs = CUR.fs;
  return LAB.route(CUR.fl, fs, G.x, G.y, function (x, y) {
    if (goalObj) return Math.abs(x - goalObj.x) + Math.abs(y - goalObj.y) === 1 && !LAB.solidAt(CUR.fl, x, y);
    return x === cell[0] && y === cell[1];
  }, { passDoor: function (d) { return !doorBlock(d) && !(d.lock && d.lock.type === "secret" && !secretFound(d)); } });
}
/* Ближайшая точка на пути: первая дверь или проход в другое пространство. */
function waypoint(path) {
  var here = spaceAt(G.x, G.y);
  for (var i = 0; i < path.length; i++) {
    var c = path[i], tt = cellType(c[0], c[1]);
    if (tt === T.DOOR) return { k: i + 1, what: "door", d: doorAt(c[0], c[1]) };
    var sp = spaceAt(c[0], c[1]);
    if (sp !== here) return { k: i + 1, what: sp.charAt(0) === "c" ? "corr" : "room", room: roomAt(c[0], c[1]) };
  }
  return null;
}
function spaceAt(x, y) { var r = roomAt(x, y); if (r) return "r" + r.id; var c = LAB.corrOf(CUR.fl, x, y); return c ? "c" + c.id : "x"; }
function navigate(cycle, fromNpc) {
  if (G.stair) { stairsInfo(); return; }
  if (!game.entered) return;
  if (navJammed()) return;
  var list = navTargets();
  if (!list.length) { say("Навигатору не на что указать."); return; }
  var now = Date.now();
  if (cycle && now - navLast < 4000) navIdx = (navIdx + 1) % list.length; else if (!cycle || now - navLast >= 4000) navIdx = 0;
  navLast = now;
  var tgt = list[navIdx % list.length];
  /* двери коридора — ведём к ближайшей; весь список — в окне навигатора */
  if (tgt.doors) {
    var dn = tgt.doors[0], rn = CUR.fl.rooms[dn.room];
    var nd = tgt.doors.length;
    tgt = { n: (rn && rn.sign ? rn.sign : "дверь кабинета") + (nd > 1 ? ", ближайшая из " + nd + " " + plural(nd, "двери", "дверей", "дверей") + " коридора" : ", единственная дверь коридора"), cell: doorFront(dn) };
  }
  var path = routeTo(tgt.cell, tgt.o);
  var more = list.length > 1 && !fromNpc ? LAB.K(" Ещё раз два пальца вправо — следующая цель.", " Ещё раз N — следующая цель.") : "";
  if (!path) {
    /* закрыто: путь до ближайшей запертой двери на пути */
    var p2 = LAB.route(CUR.fl, CUR.fs, G.x, G.y, function (x, y) { return tgt.o ? (Math.abs(x - tgt.o.x) + Math.abs(y - tgt.o.y) === 1) : (x === tgt.cell[0] && y === tgt.cell[1]); }, { passDoor: function (d) { return !(d.lock && d.lock.type === "secret" && !secretFound(d)); } });
    var blockDoor = null;
    if (p2) for (var i = 0; i < p2.length; i++) { var dd = doorAt(p2[i][0], p2[i][1]); if (dd && doorBlock(dd)) { blockDoor = dd; break; } }
    if (blockDoor) {
      var pd = LAB.route(CUR.fl, CUR.fs, G.x, G.y, function (x, y) { return x === blockDoor.x && y === blockDoor.y; }, { goalDoors: true, passDoor: function (d) { return !doorBlock(d) && !(d.lock && d.lock.type === "secret"); } });
      var plain = blockDoor.lock && /^(card|key|code)$/.test(blockDoor.lock.type);
      var full = CUR.fs.mapped || fromNpc;
      var wp = !full && pd ? waypoint(pd) : null;
      if (wp && wp.k < pd.length) { var sub2 = pd.slice(0, wp.k); say("Цель: " + tgt.n + ". Дальше путь перекрыт запертой дверью. Ближайшая точка — " + wpName(wp) + ": " + navText(sub2) + more); A("navStart", sub2); navFollowStart(sub2[sub2.length - 1], null, wpName(wp)); return; }
      say("Цель: " + tgt.n + ". Путь перекрыт: " + lockText(blockDoor) + "." + (plain ? "" : " " + doorBlock(blockDoor)) + (pd ? " До этой двери: " + navText(pd) : ""));
      A("navPing", blockDoor.x, blockDoor.y);
      if (pd && pd.length >= 2) navFollowStart(pd[pd.length - 2], null, "запертая дверь"); /* ведём до клетки перед дверью */
    } else say("Цель: " + tgt.n + ". Пути не видно: возможно, за тайной дверью.");
    return;
  }
  if (!CUR.fs.mapped && !fromNpc && tgt.main) {
    var w = waypoint(path);
    if (w && w.k < path.length) {
      var sub = path.slice(0, w.k);
      say((fromNpc ? "«Иди так»: " : "") + "«Эхо» слышит " + tgt.n + " — дальше. Ближайшая точка — " + wpName(w) + ": " + navText(sub) + " Дойдёте — спросите снова. Всю дорогу покажет карта этажа: терминал безопасности или научный." + more);
      A("navStart", sub);
      navFollowStart(sub[sub.length - 1], null, wpName(w));
      return;
    }
  }
  say((fromNpc ? "«Иди так»: " : "") + "Цель: " + tgt.n + ". " + navText(path) + more);
  A("navStart", path);
  navFollowStart(tgt.cell, tgt.o, tgt.n);
}
/* ── Режимы навигатора ──
   full — подробно: весь путь, потом по шагам — повороты и «цель близко»;
   brief — кратко: сколько шагов и куда сначала, потом только «цель рядом»;
   beacon — по звуку: маяк навигатора звучит впереди на пути, пока не дойдёте;
   free — свободно: путь только по запросу, без ведения. В бою подсказки
   короче. Ведение снимается у цели, на другом этаже и через три минуты. */
function navMode() { var m = S.navMode; return m === "brief" || m === "beacon" || m === "free" ? m : "full"; }
game.navMode = navMode;
function stepDir(c, px, py) { return c[0] > px ? "E" : c[0] < px ? "W" : c[1] > py ? "S" : "N"; }
function firstSeg(path) {
  var d0 = null, n = 0, px = G.x, py = G.y;
  for (var i = 0; i < path.length; i++) { var d = stepDir(path[i], px, py); if (d0 && d !== d0) break; d0 = d; n++; px = path[i][0]; py = path[i][1]; }
  return [d0, n];
}
function navText(path) {
  if (!path || !path.length) return "Вы на месте.";
  var mode = navMode();
  if (mode === "brief") { var sg = firstSeg(path); return "Всего " + stepsW(path.length) + ", сначала " + stepsW(sg[1]) + " " + LAB.DIRTO[sg[0]] + "."; }
  if (mode === "beacon") return "Всего " + stepsW(path.length) + ". Идите на звук маяка навигатора: он звучит впереди на пути.";
  return describePath(path);
}
var navFollow = null, navBeaconT = null;
function navStop() { navFollow = null; if (navBeaconT) { clearInterval(navBeaconT); navBeaconT = null; } }
function navFollowStart(cell, o, name) {
  navStop();
  var mode = navMode();
  if (mode === "free" || (!cell && !o)) return;
  navFollow = { cell: cell || null, o: o || null, name: name, mode: mode, key: CUR.key, t0: Date.now(), dir: firstSeg(routeTo(cell, o) || [])[0], near: false };
  if (mode === "beacon") navBeaconT = setInterval(function () { LAB.safe(navBeaconTick); }, 1300);
}
/* Герой уже у цели: рядом с вещью или на самой точке пути. */
function navAt(nf) {
  if (nf.o) return Math.abs(G.x - nf.o.x) + Math.abs(G.y - nf.o.y) <= 1;
  return !!nf.cell && G.x === nf.cell[0] && G.y === nf.cell[1];
}
function navLive() {
  var nf = navFollow;
  if (!nf || !game.entered || nf.key !== CUR.key || Date.now() - nf.t0 > 180000) { navStop(); return null; }
  return nf;
}
function navBeaconTick() {
  var nf = navLive(); if (!nf) return;
  if (game.paused || G.stair || (LAB.ui && LAB.ui.layer())) return;
  if (navAt(nf)) return;
  var p = routeTo(nf.cell, nf.o);
  if (!p) { navStop(); return; }
  if (!p.length) return;
  var c = p[Math.min(p.length - 1, 4)];
  A("navPing", c[0], c[1]);
}
/* После каждого шага: у цели — сказать; в подробном режиме — повороты. */
function navFollowStep() {
  var nf = navLive(); if (!nf) return;
  if (navAt(nf)) { navStop(); A("navPing", G.x, G.y); sayq("Вы у цели: " + nf.name + "."); return; }
  var p = routeTo(nf.cell, nf.o);
  if (!p) { navStop(); sayq("Путь к цели перекрыт. Спросите навигатор снова."); return; }
  if (!p.length) { navStop(); A("navPing", G.x, G.y); sayq("Вы у цели: " + nf.name + "."); return; }
  if (nf.mode !== "full") { if (p.length <= 2 && !nf.near) { nf.near = true; sayq("Цель рядом."); } return; }
  var sg = firstSeg(p), d0 = sg[0];
  if (d0 !== nf.dir) {
    var fight = LAB.combat && LAB.combat.danger && LAB.combat.danger();
    sayq(fight ? capital(LAB.DIRTO[d0]) + "." : "Теперь " + LAB.DIRTO[d0] + ", " + stepsW(sg[1]) + ".");
    nf.dir = d0;
  } else if (p.length === 3 && !nf.near) { nf.near = true; sayq("Цель близко: " + stepsW(3) + "."); }
}
game.navStop = navStop;
game.navFollow = function () { return navFollow; };
game._routeTo = function (cell, o) { return routeTo(cell, o); };
game.navigateTo = function (t) { return navigateTo(t); };
game._navPath = function () { return navFollow ? routeTo(navFollow.cell, navFollow.o) : null; };
function wpName(w) {
  if (w.what === "door") { var r = w.d && CUR.fl.rooms[w.d.room]; return "дверь" + (r && r.sign && roomAt(G.x, G.y) !== r ? " «" + r.sign + "»" : ""); }
  if (w.what === "corr") return "проход в коридор";
  return "вход в помещение" + (w.room ? " «" + w.room.name + "»" : "");
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
  /* кровотечение — сначала бинт; тяжёлая интоксикация — антидот или сорбент */
  if (G.st.bleed && (G.inv.bandage || 0) > 0 && G.hp > G.hpMax * 0.3) return useItem("bandage");
  if (G.st.poison && (G.inv.antidote || 0) > 0 && G.hp > G.hpMax * 0.35) return useItem("antidote");
  if (body().tox >= 50 && G.hp > G.hpMax * 0.35) { if ((G.inv.antidote || 0) > 0) return useItem("antidote"); if ((G.inv.sorbent || 0) > 0) return useItem("sorbent"); }
  var miss = G.hpMax - G.hp;
  if (miss <= 0 && !G.st.poison && !G.st.bleed) { say("Здоровье полное: " + G.hp + " из " + G.hpMax + "." + (body().neuro >= 60 && (G.inv.neuroblock || 0) > 0 ? " Нейронагрузку снимет нейроблокатор: инвентарь, «Аптечки и лекарства»." : "")); return; }
  var pick = null;
  if ((G.inv.medkit_s || 0) > 0 && (miss <= 50 || !(G.inv.medkit_l > 0)) && !G.st.poison) pick = "medkit_s";
  else if ((G.inv.medkit_l || 0) > 0) pick = "medkit_l";
  else if ((G.inv.medkit_s || 0) > 0) pick = "medkit_s";
  else if ((G.inv.stim || 0) > 0) pick = "stim";
  else if (G.st.poison && (G.inv.antidote || 0) > 0) pick = "antidote";
  else if (G.st.bleed && (G.inv.bandage || 0) > 0) pick = "bandage";
  if (!pick) { LAB.UI.error(); say("Аптечек нет. Ищите их в медпунктах и шкафах или соберите в мастерской из биогеля и реагента."); return; }
  useItem(pick);
}
game.useMedkit = useMedkit;
function useItem(id) {
  var d = LAB.ITEMS[id];
  if (!d || !(G.inv[id] > 0)) { say("Нет: " + (d ? d.n : id) + "."); return false; }
  if (LAB.repair && LAB.repair.isKit(id)) return LAB.repair.use(id); /* (2.0) походные ремкомплекты */
  if (d.kind === "implant" && LAB.implants) return LAB.implants.useChip(id); /* (2.0) чип импланта — вживить */
  if (d.kind === "trap" && LAB.traps) return LAB.traps.use(id);
  if (d.kind === "throw") {
    if (d.fx && d.fx.gren && LAB.combat) return LAB.combat.throwGrenade(id);
    if (id === "emp") { if (LAB.combat) LAB.combat.throwEmp(); return true; }
    if (d.fx && (d.fx.decoy || d.fx.blind) && LAB.workshop) return LAB.workshop.throwDevice(id);
    return throwItem(id, d.fx && d.fx.emp ? "emp" : "noise");
  }
  if (d.kind === "deploy" || (d.fx && d.fx.deploy)) {
    if (!LAB.combat) return false;
    var at = LAB.combat.deployTurret(d.fx && d.fx.deploy || 30, d.fx && d.fx.dmgK);
    if (!at) { say("Здесь турель не встанет: впереди занято."); return false; }
    G.inv[id]--;
    say(d.n + " раскрылась " + relDir(at.x, at.y) + " и ищет цели на своей линии. Выстрелов — " + (d.fx.deploy || 30) + "." + (d.fx.dmgK > 1 ? " Бьёт сильнее обычной." : ""));
    UIx("refresh"); return true;
  }
  if (d.fx && (d.fx.pick || d.fx.map || d.fx.jam || d.fx.antitox || d.fx.scan || d.fx.shield || d.fx.haste || d.fx.cloak || d.fx.heal || d.fx.en || d.fx.cure || d.fx.unslow || d.fx.food || d.fx.wake || d.fx.detox || d.fx.neuro || d.fx.stopBleed)) return useFx(id, d);
  if (id === "plate") return installPlate();
  if (id === "decoder") { say("Декодер применяется у двери с картридером: " + LAB.K("двойное касание у двери.", "Enter у двери.")); return false; }
  if (id === "okokey") { say("Служебный ключ ОКО прикладывают к турели вплотную — подходите наискосок, вне её линии огня — или к терминалу безопасности, раздел «Оборонная сеть»: " + LAB.K("двойное касание рядом.", "Enter рядом.")); return false; }
  if (d.kind === "part") { say("Это деталь для мастерской."); return false; }
  /* (1.5) инструменты не тратятся, ценности — на продажу, изолента — на камеру ОКО */
  if (d.kind === "tool" || d.kind === "valuable" || id === "tape") { if (LAB.zones && LAB.zones.useItem) return LAB.zones.useItem(id, d); say(d.n + ". " + d.desc); return false; }
  var food = d.kind === "food", sip = food && (d.eat === "gulp" || d.eat === "sip");
  /* сытому еда не лезет, а питьё — всегда */
  if (food && !sip && body().food >= 100 && !d.en) { say("Вы сыты: больше не лезет."); return false; }
  G.inv[id]--;
  var msg = [];
  /* несвежая еда — токсины */
  if (food && d.stale && Math.random() < d.stale) { msg.push("Несвежее: подташнивает."); bodyApply({ tox: 15 }, msg); }
  var od = d.overdose && body().tox >= 70; /* передозировка: стимулятор не лечит, а бьёт по сердцу */
  var hv = d.cup ? Math.round(d.heal * (1 + (G.L - 1) * 0.15)) : d.heal; /* стакан из автомата лечит, как сам автомат: с глубиной больше */
  if (d.heal && !od) { var before = G.hp; G.hp = Math.min(G.hpMax, G.hp + (/^medkit|^bandage/.test(id) && LAB.ach && LAB.ach.has("medic") ? Math.round(d.heal * 1.17) : hv)); if (G.hp > before || !food) msg.push("Здоровье плюс " + (G.hp - before) + ", теперь " + G.hp + " из " + G.hpMax + "."); }
  if (d.en) { var e0 = G.en; G.en = Math.min(G.enMax, G.en + d.en); msg.push("Энергия имплантов " + G.en + (G.en > e0 ? "" : ", и так полная") + "."); }
  if (d.cure && G.st.poison) { G.st.poison = 0; msg.push("Отравление снято."); }
  if (d.unslow) { G.st.slow = 0; G.st.web = 0; }
  bodyApply(d, msg);
  if (food) eatSound(d.eat);
  else A("play", id === "bandage" ? "bandage_tear" : id === "sorbent" || id === "neuroblock" ? "pills_rattle" : id === "antidote" || id === "stim" || id === "energy_d" ? "inject" : "heal");
  say((food ? (sip ? "Вы выпили: " : "Вы съели: ") + d.n.charAt(0).toLowerCase() + d.n.slice(1) + ". " : d.n + ". ") + (d.x ? d.x + " " : "") + msg.join(" ") + " Осталось: " + (G.inv[id] || 0) + ".");
  if (LAB.oko && LAB.oko.react) LAB.oko.react(food ? (sip ? "drink" : "eat") : d.heal ? "heal" : "");
  UIx("refresh");
  if (food) autosaveSoon();
  if (LAB.combat && S.turnBased) LAB.combat.tick();
  return true;
}
game.useItem = useItem;
/* Предметы с действием fx (мастерская и блоки). */
function useFx(id, d) {
  var fx = d.fx, msg = [];
  if (fx.pick) { say("Отмычку применяют у двери под ключ: " + LAB.K("двойное касание у двери.", "Enter у двери.")); return false; }
  if (fx.map) { mapFloor(); msg.push("Карта этажа загружена в «Эхо»: навигатор ведёт до целей целиком."); }
  if (fx.jam) { G.st.jam = Math.max(G.st.jam || 0, fx.jam); msg.push("Глушилка включена: камеры и датчики ОКО вас не видят."); }
  if (fx.antitox) { G.st.antitox = Math.max(G.st.antitox || 0, fx.antitox); if (G.st.poison) { G.st.poison = 0; msg.push("Яд вышел."); } msg.push("Яды и споры пока не действуют."); }
  if (fx.shield) { G.st.shield = Math.max(G.st.shield, fx.shield); G.st.shieldT = 40; msg.push("Щит: " + G.st.shield + "."); }
  if (fx.haste) { G.st.haste = Math.max(G.st.haste, fx.haste); msg.push("Ускорение."); }
  if (fx.cloak) { G.st.cloak = Math.max(G.st.cloak, fx.cloak); msg.push("Маскировка."); }
  if (fx.heal) { var b = G.hp; G.hp = Math.min(G.hpMax, G.hp + fx.heal); msg.push("Здоровье плюс " + (G.hp - b) + ", теперь " + G.hp + " из " + G.hpMax + "."); }
  if (fx.en) { G.en = Math.min(G.enMax, G.en + fx.en); msg.push("Энергия " + G.en + "."); }
  if (fx.cure && G.st.poison) { G.st.poison = 0; msg.push("Отравление снято."); }
  if (fx.unslow) { G.st.slow = 0; G.st.web = 0; }
  if (fx.scan && LAB.combat && LAB.combat.useImplantFree) LAB.combat.useImplantFree("scan");
  if (fx.heal >= 30 && G.st.bleed) { G.st.bleed = 0; msg.push("Кровотечение остановлено."); }
  if (fx.cure) bodyApply({ detox: 25 }, msg);
  bodyApply(fx, msg);
  G.inv[id]--;
  A("play", fx.heal ? "heal" : fx.map ? "scan" : "inject");
  say(d.n + ". " + msg.join(" ") + " Осталось: " + (G.inv[id] || 0) + ".");
  UIx("refresh");
  return true;
}
function throwItem(id, kind) {
  if (!LAB.combat) return false;
  if (kind === "emp") { if (!(G.inv[id] > 0)) return false; G.inv.emp = (G.inv.emp || 0) + 1; G.inv[id]--; LAB.combat.throwEmp(); return true; }
  if (id !== "noise") { G.inv.noise = (G.inv.noise || 0) + 1; G.inv[id]--; }
  LAB.combat.throwNoise();
  return true;
}

function toggleDraw() {
  if (!game.entered) return;
  var w = curWeapon();
  if (!w) { say("Оружия нет."); return; }
  G.drawn = !G.drawn;
  A("play", G.drawn ? "w_draw" : "w_holster");
  LAB.vib(G.drawn ? [20, 30, 20] : 15);
  if (G.drawn) say("Оружие наготове: " + weaponLine(w) + "." + ammoTail(w) + (G.tut.draw || !hintsOn() ? "" : LAB.K((w.rng <= 1 ? " Свайп одним пальцем — удар в ту сторону, свайп с удержанием — серия ударов." : " Свайп одним пальцем — выстрел в ту сторону, свайп с удержанием — очередь.") + " Ходить — уберите оружие тем же касанием тремя пальцами.",
    (w.rng <= 1 ? " Стрелки — удар в ту сторону, удержание стрелки — серия ударов." : " Стрелки — выстрел в ту сторону, удержание стрелки — очередь.") + " Ходить можно и с оружием: W A S D. Убрать оружие — снова R.")));
  else say("Оружие убрано. " + LAB.K("Свайп — шаг.", "W A S D — шаг, R — достать оружие."));
  G.tut.draw = 1;
  /* на экране жест с удержанием меняет смысл (шаг ↔ очередь) — удержание сбрасываем;
     на клавиатуре ходьба W A S D не зависит от оружия — только очередь стоп */
  if (LAB.keysMode) { if (LAB.combat && LAB.combat.stopFire) LAB.combat.stopFire(); }
  else if (LAB.input) LAB.input.stopAll();
  UIx("refresh");
}
game.toggleDraw = toggleDraw;
/* Четыре пальца, касание: коротко о главном. */
function quickStatus() {
  if (!game.entered) return;
  var w = curWeapon();
  var al = bodyAlerts();
  say("Здоровье " + G.hp + " из " + G.hpMax + (G.st.shield ? ", щит " + G.st.shield : "") + ". " + weaponLine(w) + "." + ammoTail(w) + (G.st.poison ? " Отравление." : "") + (al.length ? " Тело: " + al.join(", ") + "." : ""));
}
game.quickStatus = quickStatus;
/* Три пальца вправо: окно целей навигатора. */
function navMenu() {
  if (!game.entered) return;
  if (navJammed()) return;
  var list = navTargets();
  if (!list.length) { say("Навигатору не на что указать."); return; }
  UIx("menu", "Навигатор", list.map(function (t) {
    if (t.doors) return { label: t.n, fn: function () {
      UIx("menu", "Двери коридора", t.doors.map(function (d) {
        var rm = CUR.fl.rooms[d.room], fc = doorFront(d), n = Math.abs(fc[0] - G.x) + Math.abs(fc[1] - G.y);
        var nm = rm && rm.sign ? rm.sign : "дверь кабинета";
        return { label: nm + " — " + relDir(d.x, d.y) + ", " + n + " " + plural(n, "шаг", "шага", "шагов") + (CUR.fs.objs["room" + d.room] ? ", вы там были" : ""), fn: function () { navigateTo({ n: nm, cell: fc }); } };
      }));
    } };
    return { label: t.n, fn: function () {
      var path = routeTo(t.cell, t.o);
      if (path && (CUR.fs.mapped || !t.main)) { say("Цель: " + t.n + ". " + describePath(path)); A("navStart", path); }
      else { navIdx = list.indexOf(t); navLast = Date.now(); navigateTo(t); }
    } };
  }));
}
game.navMenu = navMenu;
function navigateTo(t) { var keep = navTargets; navTargets = function () { return [t]; }; try { navigate(false); } finally { navTargets = keep; } }
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
  if (i < G.wi) G.wi--; else if (i === G.wi) G.wi = 0; /* в руках остаётся то же оружие */
  if (G.wi >= G.weapons.length) G.wi = 0;
  var gainP = 1 + w.rank;
  G.inv.scrap = (G.inv.scrap || 0) + 2 + w.rank;
  G.inv.chip = (G.inv.chip || 0) + Math.floor(gainP / 2);
  if (w.ammo !== "none" && w.charge > 0 && w.charge >= w.cap / 2) G.ammo[w.ammo] = (G.ammo[w.ammo] || 0) + 1;
  var more = LAB.workshop ? LAB.workshop.onScrap(w) : "";
  A("play", "pry");
  say("Разобрано: " + w.name + ". Получены детали: металлолом " + (2 + w.rank) + (Math.floor(gainP / 2) ? ", микросхемы " + Math.floor(gainP / 2) : "") + "." + (more ? " " + more : ""));
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
  if (LAB.combat) LAB.combat.reloadPause(Math.round((w.ammo === "positron" ? 1400 : 900) * (LAB.workshop ? LAB.workshop.reloadK(w) : 1)));
  say("Перезаряжено: " + w.cap + " выстрелов. Осталось: " + LAB.AMMO[w.ammo].n.toLowerCase() + " — " + G.ammo[w.ammo] + ".");
  UIx("refresh");
}
game.reload = reload;

/* ════════ МАСТЕРСКАЯ ════════ */
function needOf(rc) { return LAB.workshop ? LAB.workshop.needOf(rc) : rc.need; }
function canCraft(rc) { if (rc.minL && G.L < rc.minL) return false; var need = needOf(rc); for (var k in need) if ((G.inv[k] || 0) < need[k]) return false; return true; }
function craft(rc) {
  var why = LAB.workshop ? LAB.workshop.check(rc) : "";
  if (!why && rc.minL && G.L < rc.minL) why = "Это здесь не собрать: чертежей и оснастки на этой глубине нет.";
  if (!why && !canCraft(rc)) why = "Не хватает деталей: " + needText(rc) + ".";
  if (why) { LAB.UI.error(); say(why); return false; }
  var out = rc.out === "wmod" ? "m_power" : rc.out; /* прежний модуль усиления */
  var need = needOf(rc), W = LAB.workshop;
  for (var k in need) G.inv[k] -= need[k];
  G.crafted++;
  if (LAB.ach) LAB.ach.ev("craft", 1);
  var armorMsg = "";
  var bonus = G.faction === "eng" && G.crafted % 3 === 0;
  /* (2.0) профиль верстака: «с запасом» и качество оружия и брони */
  var extra = W ? W.craftBonus(rc) : 0, qual = W ? W.craftQual() : 2, batchN = W ? W.craftTimes(rc) : 1;
  if (LAB.implants && LAB.implants.stat("craft") && Math.random() < LAB.implants.stat("craft") && !/^(armor|weapon):/.test(out)) extra++; /* (2.0) чип конструктора */
  if (LAB.implants) LAB.implants.crafted(rc);
  var times = batchN + (bonus ? 1 : 0) + extra;
  for (var i = 0; i < times; i++) {
    if (out.indexOf("ammo:") === 0) G.ammo[out.slice(5)] = (G.ammo[out.slice(5)] || 0) + 1;
    else if (out.indexOf("armor:") === 0) { var na = LAB.makeArmor(out.slice(6), LAB.foeLevel(G.L, G.F), qual); armorMsg = giveItem({ kind: "armor", a: na }, true); }
    else if (out.indexOf("weapon:") === 0) { var nw = LAB.makeWeapon(out.slice(7), LAB.foeLevel(G.L, G.F), 1, qual); armorMsg = giveItem({ kind: "weapon", w: nw }, true); }
    else G.inv[out] = (G.inv[out] || 0) + 1;
  }
  A("play", out.indexOf("armor:") === 0 || out.indexOf("weapon:") === 0 ? "craft_armor" : "craft");
  var msg = "Собрано: " + rc.n + (batchN > 1 ? " — партия из " + batchN : "") + (bonus ? " — и ещё одно, инженерная смекалка!" : "") + "." + (extra ? " " + W.specName() + ": вышло с запасом — плюс одно." : "") + (qual > 2 && (out.indexOf("armor:") === 0 || out.indexOf("weapon:") === 0) ? " Оружейный верстак: качество на ступень лучше." : "") + (armorMsg ? " " + armorMsg : "");
  if (LAB.workshop) LAB.workshop.afterCraft(rc, msg); else say(msg);
  gainXP(3);
  UIx("refresh");
  return true;
}
game.craft = craft;
function needText(rc) { if (LAB.workshop) return LAB.workshop.needText(rc); var s = []; for (var k in rc.need) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + (G.inv[k] || 0) + " из " + rc.need[k]); return s.join(", "); }
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
  var lost = Math.round(G.credits * ((LAB.DIFF[S.difficulty || 1] || LAB.DIFF[1]).lose || 0.15));
  G.credits -= lost;
  say("Вы погибли. «Эхо» удерживает сознание... Потеряно кредитов: " + lost + ".");
  journal("Гибель на уровне " + G.L + ", этаж " + G.F + ".");
  game.paused = true;
  later(function () {
    G.dead = false; game.paused = false;
    G.hp = Math.round(G.hpMax * 0.6); G.st = { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0, jam: 0, deaf: 0, antitox: 0, bleed: 0, navjam: 0 };
    var bd = body(); bd.tox = 0; bd.neuro = 0; bd.food = Math.max(bd.food, 60); bd.wake = Math.max(bd.wake, 50); bd.lv = {};
    /* (1.5) привязались к капсуле — возрождение у неё; нет — у начала уровня */
    var cp = G.checkpoint;
    if (cp && cp.L === G.L) enterFloor(cp.L, cp.F, "respawn");
    else enterFloor(G.L, 1, "restart");
    if (LAB.combat) LAB.combat.calmAll();
    /* (2.0) ОКО видело, как носитель вернулся */
    later(function () { if (LAB.oko && LAB.oko.react) LAB.oko.react("revive"); }, 5000);
  }, 4200);
}
game.die = die;

/* ════════ СОХРАНЕНИЯ: три слота и автозапись ════════ */
var SLOT_KEYS = { 1: "lab_slot1", 2: "lab_slot2", 3: "lab_slot3", auto: "lab_auto" };
function snapshot() {
  syncFloorState();
  G.stats.ms += Date.now() - (game.t0 || Date.now()); game.t0 = Date.now();
  return JSON.stringify({ meta: { ver: LAB.VERSION, L: G.L, F: G.F, lvl: G.lvl, hp: G.hp, hpMax: G.hpMax, ms: G.stats.ms, date: Date.now(), samples: Object.keys(G.samples).length }, g: G });
}
function saveSlot(n) {
  if (!game.entered || game.loading) return false;
  var snap = snapshot(), key = SLOT_KEYS[n];
  /* прежняя запись слота — в резервную копию (если место есть) */
  var prev = LAB.store.get(key);
  if (prev && prev !== snap && validSave(prev)) LAB.store.set(key + "_bak", prev);
  var ok = LAB.store.set(key, snap);
  if (!ok && prev) { LAB.store.del(key + "_bak"); ok = LAB.store.set(key, snap); } /* не хватило места — копией жертвуем */
  if (!ok && n === "auto" && Date.now() - (game.autoFailSaid || 0) > 120000) { game.autoFailSaid = Date.now(); sayq("Автозапись не удалась: память устройства переполнена. Сохранитесь в слот вручную."); }
  if (n !== "auto") {
    G.stats.saves++;
    if (ok) { LAB.UI.ok(); say("Игра сохранена в слот " + n + "."); }
    else { LAB.UI.error(); say("Не удалось сохранить: память устройства переполнена."); }
  }
  return ok;
}
game.saveSlot = saveSlot;
/* Запись игры цела и подходит этой версии: проверяем до того, как заменить текущую игру. */
function validSave(raw) {
  var d;
  try { d = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return null; }
  var g = d && d.g;
  if (!g || typeof g !== "object") return null;
  /* сохранение другой версии игры не загружается: каждую версию проходят заново */
  if (!d.meta || d.meta.ver !== LAB.VERSION) return null;
  if (!(g.L >= 1 && g.L <= LAB.LEVELS_N && g.F >= 1 && g.F <= LAB.FLOORS_N)) return null;
  if (!Array.isArray(g.weapons) || !g.weapons.length || typeof g.seed !== "string") return null;
  if (typeof g.hp !== "number" || typeof g.hpMax !== "number" || !(g.hpMax > 0)) return null;
  if (g.fs && typeof g.fs !== "object") return null;
  return d;
}
game.validSave = validSave;
function slotInfo(n, bak) {
  var raw = LAB.store.get(SLOT_KEYS[n] + (bak ? "_bak" : ""));
  if (!raw) return null;
  try { var d = JSON.parse(raw); return d.meta; } catch (e) { return null; }
}
game.slotInfo = slotInfo;
function slotText(n, bak) {
  var m = slotInfo(n, bak);
  var name = (n === "auto" ? "Автозапись" : "Слот " + n) + (bak ? ", резервная копия" : "");
  if (!m) return bak ? "" : name + ": пусто";
  var mins = Math.round((m.ms || 0) / 60000), h = Math.floor(mins / 60), mm = mins % 60;
  var dt = new Date(m.date);
  var dd = dt.getDate() + "." + (dt.getMonth() + 1 < 10 ? "0" : "") + (dt.getMonth() + 1) + ", " + dt.getHours() + ":" + (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes();
  return name + ": уровень " + m.L + ", этаж " + m.F + ", герой " + m.lvl + "-го уровня, здоровье " + m.hp + ", в игре " + (h ? h + " ч " : "") + mm + " мин, записано " + dd;
}
game.slotText = slotText;
function loadSlot(n, fromBak) {
  var key = SLOT_KEYS[n] + (fromBak ? "_bak" : "");
  var raw = LAB.store.get(key);
  if (!raw) { LAB.UI.error(); say(fromBak ? "Резервной копии нет." : "Слот пуст."); return false; }
  var d = validSave(raw);
  if (!d) { LAB.UI.error(); say("Запись повреждена или не подходит этой версии игры." + (!fromBak && LAB.store.get(SLOT_KEYS[n] + "_bak") ? " Есть резервная копия: «Загрузить игру», пункт «Резервная копия»." : "")); return false; }
  /* загрузка с откатом: если запись не поднимется, прежняя игра остаётся как была */
  var prevG = G, prevEntered = game.entered, prevCUR = { fl: CUR.fl, fs: CUR.fs, key: CUR.key, seen: CUR.seen };
  game.loading = true;
  try {
    G = migrate(d.g);
    game.session++; game.paused = false; game.descending = false;
    if (LAB.office && LAB.office.clear) LAB.office.clear();
    noteCache = {};
    freshSession();
    LAB.clearFloorCache();
    game.t0 = Date.now();
    game.entered = true;
    UIx("showGame");
    var how = G.relocate ? (G.L === 1 && G.F === 1 ? "start" : (G.F === 1 ? "gatedown" : "down")) : "load";
    G.relocate = false;
    enterFloor(G.L, G.F, how, true);
  } catch (e) {
    console.warn(e);
    game.loading = false;
    G = prevG; game.entered = prevEntered; CUR.fl = prevCUR.fl; CUR.fs = prevCUR.fs; CUR.key = prevCUR.key; CUR.seen = prevCUR.seen;
    LAB.clearFloorCache();
    if (prevEntered && CUR.fl && LAB.combat) { try { LAB.combat.loadFoes(); } catch (e2) { /* */ } }
    if (!prevEntered) UIx("mainMenu");
    LAB.UI.error(); say("Эту запись не удалось загрузить: она повреждена." + (!fromBak && LAB.store.get(SLOT_KEYS[n] + "_bak") ? " Попробуйте резервную копию слота." : ""));
    return false;
  }
  game.loading = false;
  autosave();
  var lev = LAB.LEVELS[G.L];
  say("Игра загружена. Уровень " + G.L + ", " + lev.name + ", этаж " + G.F + ". Здоровье " + G.hp + " из " + G.hpMax + ". " + weaponLine(curWeapon()) + ".");
  roomCheck(true);
  return true;
}
game.loadSlot = loadSlot;
/* Запись до стартового набора: бластер и комбинезон лежали в соседнем
   помещении первого этажа, а теперь их там нет — недостающее выдаётся. */
function fillStartKit(g) {
  if (!(g.weapons || []).some(function (w) { return w && (w.rng || 1) > 1; })) g.weapons.push(LAB.makeWeapon("spark", 1, 0, 1, "w_start_spark"));
  if (!g.armor && !(g.armors && g.armors.length)) { var a = LAB.makeArmor("suit", 1, 1, "a_start_suit"); g.armors = [a]; g.armor = a; }
}
function migrate(g) {
  var oldKit = g.startKit == null;
  var base = newState(g.seed || "lab");
  for (var k in base) if (g[k] === undefined) g[k] = base[k];
  if (oldKit) fillStartKit(g);
  if (!g.st) g.st = base.st;
  for (var k2 in base.st) if (g.st[k2] === undefined) g.st[k2] = 0;
  if (!g.body) g.body = base.body;
  for (var k3 in base.body) if (g.body[k3] === undefined) g.body[k3] = base.body[k3];
  g.dead = false;
  g.stair = null; /* запись на лестнице — снова у лестницы */
  if (!g.cores) g.cores = {};
  if (g.core) g.cores[10] = true;
  if (!g.melodies) g.melodies = {};
  for (var mk in g.melodies) if (!/^\d+-\d+-/.test(mk)) delete g.melodies[mk];
  if (!g.blockSeen) g.blockSeen = {};
  /* модули усиления прежних версий — модули мощности */
  (g.weapons || []).forEach(function (w) { if (w && w.mods > 0 && !w.mod) w.mod = { power: w.mods }; });
  /* надетая броня — та же запись, что в списке брони (после загрузки это были копии) */
  if (g.armor && g.armors) {
    var am = g.armors.filter(function (a) { return a && a.id === g.armor.id; })[0];
    if (am) { for (var ak in g.armor) am[ak] = g.armor[ak]; g.armor = am; }
    else g.armors.push(g.armor);
  }
  if (g.worldV !== WORLD_V) {
    /* запись прежней версии: этажи построены заново — их состояние, ключи и коды
       сбрасываются, герой встаёт у входа на свой этаж; пропуска, оружие,
       броня, кредиты и прочитанные записки остаются */
    /* тексты записок-ссылок — собрать, пока колоды прежние */
    var G0 = G; G = g; noteCache = {};
    (g.noteList || []).forEach(function (n) { if (n.x == null && n.src) { try { var r = noteFull(n); n.t = r.t; n.x = r.x; n.a = r.a; } catch (e) { /* */ } } });
    G = G0; noteCache = {};
    g.fs = {}; g.keys = {}; g.codes = {}; g.decks = {}; g.noteIdx = {}; g.melodies = {};
    g.worldV = WORLD_V; g.relocate = true;
  }
  return g;
}
game._migrate = migrate; /* для проверок: перенос прежней записи */
var autoTimer = null;
var autoNoteAt = 0;
function autosave() {
  if (!game.entered || G.dead || game.descending) return;
  var ok = saveSlot("auto");
  /* понятное уведомление: мягкий двойной сигнал, а если выбрано — и голосом; не чаще раза в двадцать секунд */
  var mode = S.saveNote == null ? 1 : +S.saveNote, now = Date.now();
  if (ok && mode > 0 && now - autoNoteAt > 20000) {
    autoNoteAt = now;
    LAB.UI.blip(880, 0.05, 0.035); setTimeout(function () { LAB.UI.blip(1175, 0.07, 0.035); }, 90);
    if (mode >= 2) sayq("Игра сохранена.");
  }
  return ok;
}
function autosaveSoon() { clearTimeout(autoTimer); autoTimer = setTimeout(autosave, 1500); }
game.autosave = autosave;

function newGame() {
  var seed = "lab-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
  G = newState(seed);
  G.wakeSafe = 1; /* (2.0) безопасное пробуждение: в капсульном отсеке никто не тронет (combat.js) */
  game.session++; game.paused = false; game.descending = false;
  if (LAB.office && LAB.office.clear) LAB.office.clear();
  freshSession();
  G.min = 6 * 60 + 40;
  LAB.clearFloorCache();
  game.t0 = Date.now();
  game.entered = true;
  UIx("showGame");
  enterFloor(1, 1, "start", true);
  say("Вы просыпаетесь в криокапсуле. Холод отпускает. «Эхо» включается: «Носитель номер семь, слышите меня? Зрение не восстановлено. Я буду вашими глазами. " + LAB.K("Шагайте свайпами. Осмотреться — два пальца вверх. Двойное касание у предмета — действия", "Шагайте клавишами W A S D. Осмотреться — Tab. Enter у предмета — действия. Все клавиши — в руководстве, F1") + "»." );
  /* (2.0) стартовый набор: что при себе и что лежит у капсулы */
  var kitHint = hintsOn() ? LAB.K(" Достать оружие — касание тремя пальцами, сменить — двойное касание двумя пальцами.", " Достать оружие — R, сменить — Q и E.") : "";
  if (kitHint) G.tut.weapon = 1;
  sayq("При вас монтировка и бластер «Искра» с полным зарядом, на вас защитный комбинезон «Ковчег». В рюкзаке бинт, походный ремнабор и сухпаёк. У капсулы лежат две аптечки и две энергобатареи — заберите их." + kitHint + " Пока вы в капсульном отсеке, машины вас не тронут: соберитесь, прежде чем выходить.");
  tutor("start");
  roomCheck(true);
  journal("Пробуждение. Уровень 1, этаж 1.");
  mainQuest();
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
  var bb = body();
  lines.push("Сытость " + Math.round(bb.food) + " из 100: " + bodyWord("food") + ". Бодрость " + Math.round(bb.wake) + ": " + bodyWord("wake") + ". Токсины " + Math.round(bb.tox) + ": " + bodyWord("tox") + ". Нейронагрузка " + Math.round(bb.neuro) + ": " + bodyWord("neuro") + ".");
  lines.push("Аптечки " + (G.inv.medkit_s || 0) + ", большие аптечки " + (G.inv.medkit_l || 0) + ", бинты " + (G.inv.bandage || 0) + ", стимуляторы " + (G.inv.stim || 0) + ", антидоты " + (G.inv.antidote || 0) + ", сорбенты " + (G.inv.sorbent || 0) + ", еды " + FOODS().reduce(function (a, k) { return a + (G.inv[k] || 0); }, 0) + ".");
  var st = [];
  if (G.st.poison) st.push("отравление"); if (G.st.bleed) st.push("кровотечение"); if (G.st.slow) st.push("замедление"); if (G.st.deaf) st.push("звон в ушах"); if (G.st.antitox) st.push("фильтр противогаза"); if (G.st.shield) st.push("силовой щит " + G.st.shield); if (G.st.haste) st.push("ускорение"); if (G.st.cloak) st.push("маскировка");
  if (st.length) lines.push("Состояние: " + st.join(", ") + ".");
  lines.push("Энергия имплантов " + G.en + " из " + G.enMax + ". Уровень героя " + G.lvl + ", опыт " + G.xp + " из " + LAB.xpNeed(G.lvl) + ". Сила " + G.str + ", ловкость " + G.agi + ", интеллект " + G.mind + ", харизма " + G.cha + ". Кредиты " + G.credits + ".");
  lines.push("Комплекс: уровень " + G.L + " «" + LAB.LEVELS[G.L].name + "», этаж " + G.F + ". Пропуск: " + (G.tier ? LAB.TIERS[G.tier].n.toLowerCase() : "нет") + ". Лифт этажей: " + (G.elev[G.L] ? "есть пропуск" : "нет пропуска") + ". " + (!LAB.isReactorLevel(G.L) ? "Шлюзовая ключ-карта уровня " + G.L + ": " + (G.gate[G.L] ? "есть" : "нет") : "Ключ доступа к «Истоку»: " + (hasCore(G.L) ? "есть" : "нет")) + ".");
  lines.push("Образцов " + Object.keys(G.samples).length + ", тайников " + G.stats.secrets + ", записок " + G.stats.notes + ", побеждено врагов " + G.stats.kills + ". Сложность: " + LAB.DIFF[S.difficulty || 1].n.toLowerCase() + ".");
  if (G.faction) lines.push("Фракция: " + LAB.FACTIONS[G.faction].n + ".");
  return lines;
}
game.characterText = characterText;
})();
