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
var CABLE = "dr_charge_cable", CABLE_NEED = { wire: 3, cap: 1, rubber: 1 };
LAB.ITEMS[CABLE] = { n: "Полевой кабель питания", kind: "eng", cat: "eng", wt: 0.4, nosell: 1,
  desc: "Переносит заряд между выпущенным дроном и надетым каркасом вне боя. Часть энергии теряется при передаче." };
var CARGO_KG = 12, BOOST_KG = 8, BATTERY = 40, SHELL_HP = 16;
var MODS = {
  sensor: { n: "сенсорный блок", need: { optic: 1, chip: 1 }, wt: 0.3, d: "разведка: маяки на врагов вокруг и предупреждение о приближении врага" },
  zapper: { n: "разрядник", need: { cap: 2, wire: 2, cell: 1 }, wt: 0.6, d: "оглушает ближайшего врага на несколько секунд" },
  gun: { n: "ствол дрона", need: { scrap: 2, magnet: 1, cap: 1 }, wt: 0.9, d: "сам стреляет по врагам рядом" },
  arm: { n: "манипулятор", need: { servo: 1, scrap: 2 }, wt: 1.2, d: "вне боя понемногу чинит оружие, броню и каркас" },
  screen: { n: "защитный экран", need: { panel: 2, ceramic: 1 }, wt: 2, d: "принимает на себя четверть урона по вам" },
  cargo: { n: "грузовой захват", need: { servo: 1, magnet: 1, scrap: 2 }, wt: 1.3, d: "плюс " + CARGO_KG + " килограммов к пределу, пока дрон в воздухе" },
  scanner: { n: "поисковый блок", need: { optic: 2, chip: 1, relay: 1 }, wt: 0.5, d: "называет направление и расстояние до вещей, верстака, снабжения и капсулы по открытой линии" },
  battery: { n: "блок накопителей", need: { cell: 2, cap: 3, wire: 2 }, wt: 1, en: BATTERY, d: "плюс " + BATTERY + " к ёмкости батареи. После монтажа нужна подзарядка" },
  boost: { n: "тяговый блок", need: { servo: 2, magnet: 2, wire: 2, cell: 1 }, wt: 2, tier: 3, requires: "cargo", d: "плюс " + BOOST_KG + " килограммов к захвату. Один заряд за шаг, когда груз превышает предел без тяги" },
  medic: { n: "медицинский блок", need: { servo: 1, chip: 1, gel: 1, rubber: 1 }, wt: 1, tier: 3, d: "вне боя восстанавливает до 24 здоровья и останавливает кровотечение за бинт и энергию" },
  shell: { n: "усиленный кожух", need: { ceramic: 2, panel: 1, scrap: 2 }, wt: 2.2, tier: 3, hp: SHELL_HP, d: "плюс " + SHELL_HP + " к прочности дрона. После монтажа корпус можно залатать" },
  nerve: { n: "нервный узел Нижних", need: { dp_nerve: 1 }, wt: 0.4, tier: 6, d: "добавляет гнездо для модуля и занимает разъём ядра" }
};
var catalog = LAB.droneCatalog;
Object.keys(catalog.existing).forEach(function (k) { Object.assign(MODS[k], catalog.existing[k]); });
Object.assign(MODS, catalog.equipment);
var MOD_ORDER = Object.keys(MODS);
var RANK_EFFECTS = {
  sensor: { n: "Радиус разведки, без прибавки за ступень дрона", v: [12, 15, 18] },
  zapper: { n: "Дополнительные такты оглушения обычной цели", v: [0, 2, 4] },
  gun: { n: "Урон ствола в процентах от базового", v: [100, 122, 144] },
  arm: { n: "Предел восстановления состояния снаряжения", v: [85, 92, 100] },
  screen: { n: "Доля принятого урона в процентах", v: [25, 30, 35] },
  cargo: { n: "Килограммы основной тяги", v: [CARGO_KG, 14, 16] },
  scanner: { n: "Радиус поиска в шагах", v: [10, 12, 14] },
  battery: { n: "Дополнительная ёмкость", v: [BATTERY, 55, 70] },
  boost: { n: "Килограммы дополнительной тяги", v: [BOOST_KG, 10, 12] },
  medic: { n: "Предел лечения за бинт", v: [24, 30, 36] },
  shell: { n: "Дополнительная прочность корпуса", v: [SHELL_HP, 24, 32] }
};
Object.assign(RANK_EFFECTS, catalog.ranks);
var ROLES = catalog.roles;
function directionRank(d, key) {
  var xp = d.training && d.training[key] || 0;
  return xp >= 1200 ? 3 : xp >= 400 ? 2 : 1;
}
function describe(metric, value, model, flag) {
  var info = catalog.metrics[metric], amount = Math.round(value * info[1] * 100) / 100;
  var condition = { armored: "против брони", living: "против живых", machine: "против машин", close: "в пределах двух шагов", dark: "на резервном питании" };
  return info[0] + " " + (amount > 0 ? "+" : "") + String(amount).replace(".", ",") + info[2] +
    (model ? " для «" + MODS[model].n + "»" : "") + (flag ? " " + condition[flag] : "");
}
function policy() { return catalog.difficulty[G().diff] || catalog.difficulty[1]; }
function reached() {
  var g = G();
  return Object.keys(g.maxF || {}).reduce(function (n, k) { return Math.max(n, +k || 0); }, g.L || 1);
}
function unlockDepth(def) {
  if (!def.depth || def.depth === 1) return 1;
  return Math.max(1, Math.min(LAB.LEVELS_N || 100, def.depth + policy().offset));
}
function requirements(def) {
  var depth = unlockDepth(def), d = D(), g = G();
  var heroLevel = def.depth >= 16 ? Math.min(24, 3 + Math.floor(depth / 6)) : 1;
  var bits = [];
  if (depth > 1) bits.push("достичь уровня комплекса " + depth);
  if (heroLevel > 1) bits.push("уровень героя " + heroLevel);
  if (def.level) bits.push("ступень дрона " + def.level);
  if (def.tier) bits.push("верстак ступени " + def.tier);
  var why = reached() < depth ? "сначала посетите уровень комплекса " + depth :
    (g.lvl || 1) < heroLevel ? "нужен уровень героя " + heroLevel :
    def.level && (!d || d.lvl < def.level) ? "нужна ступень дрона " + def.level : "";
  return { text: bits.join(", "), why: why };
}
function materialCost(def) {
  if (!def.need || !def.depth || !policy().cost) return def.need;
  var need = Object.assign({}, def.need);
  need.wire = Math.max(1, (need.wire || 0) + policy().cost);
  return need;
}
function programFor(d, role) {
  return catalog.programs[d.programs && d.programs[role.direction]] || catalog.programs[role.direction];
}
function explain(effects) { return effects.map(function (e) { return describe(e[0], e[1], e[2], e[3]); }).join(". "); }
function adjust(metric, models, flags) {
  var d = D(), role = d && ROLES[d.role], total = 0;
  if (!d || d.wreck) return 0;
  var keys = Array.isArray(models) ? models : models ? [models] : [];
  flags = flags || [];
  function matches(flag) {
    if (!flag) return true;
    if (flag === "dark") return G().event === "dark";
    return flags.indexOf(flag) >= 0;
  }
  function add(e) {
    if (e[0] === metric && (!e[2] || keys.indexOf(e[2]) >= 0) && matches(e[3])) total += e[1];
  }
  if (role) {
    var dir = catalog.directions[role.direction], program = programFor(d, role);
    if (dir.metric === metric) total += dir.points * program.scale * (1 + (directionRank(d, role.direction) - 1) * 0.5);
    role.effects.forEach(add);
    program.effects.forEach(add);
  }
  if (d.tuning) keys.forEach(function (key) {
    var tune = catalog.modifications[d.tuning[key]];
    if (!hasMod(key) || !tune || !matches(tune.flag)) return;
    if (tune.metric === metric) total += tune.points + (d.en <= d.enMax * 0.25 ? tune.reactive || 0 : 0);
    if (tune.side && tune.side[0] === metric) total += tune.side[1];
  });
  return total;
}
function delay(key, base, kind) { return Math.max(kind === "fire" ? 3 : 5, Math.round(base * cdK() * policy().tempo - adjust(kind + "Cycle", key))); }
function markSeconds(k) { return Math.min(60, 20 + Math.floor(adjust("mark", k))); }
function targetFlags(target) {
  var flags = [target.kind === "mech" ? "machine" : "living"];
  if (target.arm >= 3) flags.push("armored");
  if (Math.max(Math.abs(target.x - G().x), Math.abs(target.y - G().y)) <= 2) flags.push("close");
  return flags;
}
function modId(k, rank) { return "dr_mod_" + k + (rank > 1 ? "_r" + rank : ""); }
function mark(k, rank) { return cap1(MODS[k].n) + (RANK_EFFECTS[k] ? ", ступень " + rank : ""); }
MOD_ORDER.forEach(function (k) {
  var md = MODS[k];
  var max = RANK_EFFECTS[k] ? 3 : 1;
  for (var r = 1; r <= max; r++) {
    var effect = RANK_EFFECTS[k];
    LAB.ITEMS[modId(k, r)] = { n: mark(k, r), kind: "eng", cat: "eng", wt: md.wt, nosell: 1,
      desc: (effect ? effect.n + ": " + effect.v[r - 1] : cap1(md.d)) + ". Устанавливается у верстака в меню дрона." };
  }
});
var NAMES = ["Жук", "Шмель", "Сверчок", "Стриж", "Светлячок", "Комар", "Овод", "Чиж"];

function D() { var g = G(); return g.drone || null; }
function has() { return !!D(); }
/* (после 4.6) интеллект 25 (основа, без плодов — гнёзда не мигают) — ещё одно гнездо: stats.js */
function slots(d) { d = d || D(); if (!d) return 0; return 2 + ((d.lvl || 1) >= 5 ? 1 : 0) + (MS() && MS().has("drones") ? 1 : 0) + (d.mods.indexOf("nerve") >= 0 ? 1 : 0) + ((G().mind || 10) >= 25 ? 1 : 0); }
function usedSlots(d) { return d.mods.filter(function (m) { return m !== "nerve"; }).length; }
function hasMod(k) { var d = D(); return !!(d && !d.wreck && d.mods.indexOf(k) >= 0); }
function modRank(d, k) { return d.ranks && d.ranks[k] || 1; }
function effect(k, d) { return RANK_EFFECTS[k].v[modRank(d || D(), k) - 1]; }
function active() { var d = D(); return !!(d && !d.wreck && d.out); }
function name(d) { d = d || D(); return d ? "дрон" + (d.nm ? " «" + d.nm + "»" : "") : "дрон"; }
function short() { var d = D(); return !d ? "" : d.wreck ? "дрон сбит" : !d.out ? "дрон свёрнут" : "дрон рядом"; }
function cdK() { return MS() && MS().has("drones") ? 0.75 : 1; }
function costK(d) { return d && MS() && MS().flawOf(d) ? 1.3 : 1; }
function commandSaving() { var m = G().mind || 10; return m >= 18 ? 2 : m >= 13 ? 1 : 0; }
function energyCost(n, command) {
  var md = MODS[command], kind = md && (md.mount || command === "zapper" ? "fire" : md.group === "sensors" ? "scan" : md.group === "service" ? "service" : "");
  var general = n >= 6 ? commandSaving() + adjust("commandSave", ["battery", "reserve", "nerve", "charger", "regen", "link_amp"]) : 0;
  return Math.max(1, Math.ceil(n * costK(D()) * policy().energy - 1e-8) - Math.floor(general + (kind ? adjust(kind + "Save", command) : 0)));
}
function recorded(event, id, key, place) { if (LAB.droneAudio) LAB.droneAudio.play(event, id, key, place); }
function save() { if (gm().autosaveSoon) gm().autosaveSoon(); }
function loadChanged() { if (LAB.load) LAB.load.after(); }

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
  save();
  snd("drone_up", "power_on");
  var msg = "Дрон собран за " + mins + " минут. Блок управления ожил, винты раскрутились — дрон принял управление от вас и висит рядом. Гнёзд для модулей: " + slots(d) + "; модули ставят здесь же, у верстака.";
  if (opts.name != null) { say(msg); return d; }
  nameMenu(msg);
  return d;
}
function nameMenu(msg) {
  var pool = NAMES.slice(), opts = [];
  while (pool.length && opts.length < 4) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  var done = function (nm) { var d = D(); if (d) { d.nm = nm; save(); } if (LAB.ui.closeTop) LAB.ui.closeTop(true); snd("drone_ok", "ui_ok"); say(cap1(name()) + " готов к работе."); if (W() && W().toRoot) W().toRoot(); };
  var items = opts.map(function (nm) { return { label: "«" + nm + "»", fn: function () { done(nm); } }; });
  items.push({ label: "Без имени", fn: function () { done(""); } });
  menu("Имя дрона", items, { intro: msg + " Как назвать?" });
}
function giveMod(k, rank) {
  var inv = G().inv, id = modId(k, rank);
  inv[id] = (inv[id] || 0) + 1;
}
function moduleError(md, why) {
  LAB.UI.error(); say(cap1(md.n) + ": " + why + "."); return false;
}
function worked(minutes, xp) {
  if (gm().advanceTime) gm().advanceTime(minutes);
  if (xp && MS()) MS().gain("elec", xp);
  if (xp && LAB.ach) LAB.ach.ev("craft", 1);
  save();
}
function craftMod(k) {
  var md = MODS[k];
  if (!md) return false;
  var need = materialCost(md), why = requirements(md).why || canWork(md.tier || 2, need);
  if (why) return moduleError(md, why);
  W().take(need);
  giveMod(k);
  worked(4, 4);
  recorded("craft", k);
  say("В рюкзаке: " + md.n + "."); loadChanged();
  return true;
}
function socketIssue(k, d) {
  var md = MODS[k];
  if (!d) return "сначала соберите дрона";
  if (d.wreck) return "сначала почините дрона";
  if (d.mods.indexOf(k) >= 0) return "уже установлено";
  var conflict = d.mods.find(function (id) {
    var other = MODS[id];
    return other && ((md.mount && other.mount) || (md.exclusive && md.exclusive === other.exclusive));
  });
  if (conflict) return "сначала снимите «" + MODS[conflict].n + "»";
  if (md.requires && d.mods.indexOf(md.requires) < 0) return "сначала установите " + MODS[md.requires].n;
  if (k !== "nerve" && usedSlots(d) >= slots(d)) return "все гнёзда заняты";
  return "";
}
function updateLimits(d, k, change) {
  if (MODS[k].en) { d.enMax += change; d.en = Math.min(d.en, d.enMax); }
  if (MODS[k].hp) { d.hpMax += change; d.hp = Math.min(d.hp, d.hpMax); }
}
function addMod(k, rank) {
  var d = D(), md = MODS[k], inv = G().inv;
  if (!md) return false;
  rank = rank || [3, 2, 1].find(function (r) { return inv[modId(k, r)] > 0; }) || 1;
  if (rank !== 1 && (!RANK_EFFECTS[k] || !RANK_EFFECTS[k].v[rank - 1] || !inv[modId(k, rank)])) return false;
  var id = modId(k, rank);
  var prepared = inv[id] > 0, need = materialCost(md);
  var why = socketIssue(k, d) || (!prepared && requirements(md).why) || canWork(prepared ? 2 : (md.tier || 2), prepared ? null : need);
  if (!why && rank > 1 && d.lvl < (rank === 2 ? 3 : 6)) why = "нужна ступень дрона " + (rank === 2 ? 3 : 6);
  if (why) return moduleError(md, why);
  if (prepared) inv[id]--;
  else W().take(need);
  d.mods.push(k);
  if (rank > 1) { if (!d.ranks) d.ranks = {}; d.ranks[k] = rank; }
  if (md.en || md.hp) updateLimits(d, k, effect(k, d));
  worked(prepared ? 2 : 4, prepared ? 0 : 4);
  recorded("mount", k);
  say("Установлено. " + mark(k, rank) + "."); loadChanged();
  return true;
}
function delMod(k) {
  var d = D(), md = MODS[k];
  if (!d || !md || d.mods.indexOf(k) < 0) return false;
  var why = canWork(2);
  if (why) return moduleError(md, why);
  var dependant = d.mods.find(function (mod) { return MODS[mod] && MODS[mod].requires === k; });
  if (dependant) return moduleError(md, "сначала снимите модуль «" + MODS[dependant].n + "»");
  if (k === "nerve" && usedSlots(d) > slots(d) - 1) return moduleError(md, "сначала освободите одно гнездо");
  var rank = modRank(d, k);
  if (md.en || md.hp) updateLimits(d, k, -effect(k, d));
  d.mods.splice(d.mods.indexOf(k), 1);
  if (d.ranks) delete d.ranks[k];
  giveMod(k, rank);
  worked(2, 0);
  recorded("remove", k);
  say("В рюкзаке. " + mark(k, rank) + "."); loadChanged();
  return true;
}
function upgradeDetails(k, rank) {
  var md = MODS[k], need = Object.assign({}, md.need);
  need.wire = (need.wire || 0) + rank - 1;
  if (rank === 3) need.chip = (need.chip || 0) + 1;
  return { need: need, tier: Math.max(md.tier || 2, rank + 1), level: rank === 2 ? 3 : 6 };
}
function upgradeMod(k) {
  var d = D(), md = MODS[k], stats = RANK_EFFECTS[k];
  if (!d || !stats || d.mods.indexOf(k) < 0 || modRank(d, k) >= 3) return false;
  if (d.wreck) return moduleError(md, "сначала почините дрона");
  var from = modRank(d, k), target = from + 1, upgrade = upgradeDetails(k, target);
  var why = requirements(MODS[k]).why || (d.lvl < upgrade.level ? "нужна ступень дрона " + upgrade.level : canWork(upgrade.tier, upgrade.need));
  if (why) return moduleError(md, why);
  W().take(upgrade.need);
  if (!d.ranks) d.ranks = {};
  d.ranks[k] = target;
  updateLimits(d, k, stats.v[target - 1] - stats.v[from - 1]);
  worked(4 + target * 2, 4 + target);
  recorded("tune", k + "_r" + target, k);
  say(mark(k, target) + ". " + stats.n + ": " + effect(k, d) + "."); loadChanged();
  return true;
}
function setRole(k) {
  var d = D(), role = ROLES[k];
  if (!d || !role || d.role === k) return false;
  var known = d.learned && d.learned[k], need = known ? null : materialCost(role);
  var why = d.wreck ? "сначала почините дрона" : requirements(role).why || canWork(role.tier || 3, need);
  if (why) { say("Специализация дрона. " + cap1(why) + "."); return false; }
  if (need) W().take(need);
  if (!d.learned) { d.learned = {}; if (ROLES[d.role]) d.learned[d.role] = true; }
  d.learned[k] = true;
  d.role = k;
  worked(8, 0);
  recorded("role", k);
  say("Специализация «" + role.n + "». " + explain(role.effects) + ".");
  loadChanged();
  return true;
}
function setProgram(k) {
  var d = D(), role = d && ROLES[d.role], program = catalog.programs[k];
  if (!program) return false;
  if (!role || role.direction !== program.family) { say("Сначала выберите специализацию в области «" + catalog.directions[program.family].n + "»."); return false; }
  if (programFor(d, role) === program) { say("Это направление уже выбрано."); return false; }
  var why = d.wreck ? "сначала почините дрона" : requirements(program).why || canWork(program.tier || 2);
  if (why) { say("Направление. " + cap1(why) + "."); return false; }
  if (!d.programs) d.programs = {};
  d.programs[role.direction] = k;
  worked(4, 0);
  recorded("direction", k);
  say("Выбрано направление «" + program.n + "».");
  loadChanged();
  return true;
}
function tuneModule(k, id) {
  var d = D(), md = MODS[k], change = catalog.modifications[id];
  if (!d || !md || d.mods.indexOf(k) < 0 || (id && (!change || change.fits.indexOf(k) < 0))) return false;
  if (d.wreck) return moduleError(md, "сначала почините дрона");
  var prev = d.tuning && d.tuning[k];
  if ((id || undefined) === prev) return false;
  var need = change && materialCost(change);
  var why = (change && requirements(change).why) || canWork(change ? change.tier : 2, need);
  if (why) return moduleError(md, why);
  if (!d.tuning) d.tuning = {};
  if (change) { W().take(need); d.tuning[k] = id; }
  else delete d.tuning[k];
  worked(6, change ? 3 : 0);
  recorded(change ? "tune" : "remove", id || k, k);
  say(change ? "Установлена модификация «" + change.n + "»." : "Модификация отключена.");
  loadChanged();
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
  save(); loadChanged();
  snd("work_solder", "craft"); if (gm().later) gm().later(function () { snd("drone_up", "power_on"); }, 800);
  say(was ? cap1(name()) + " снова в воздухе: корпус собран, блок управления цел. Здоровье дрона " + d.hp + " из " + d.hpMax + "." : cap1(name()) + " залатан: " + d.hp + " из " + d.hpMax + ".");
  return true;
}
function scrapDrone() {
  var d = D(), g = G(); if (!d) return false;
  var why = canWork(2);
  if (why) { say("Разборка дрона: " + why + "."); return false; }
  var s = [];
  for (var k in NEED) { var n = k === "kv_ctrl" ? 1 : Math.floor(NEED[k] / 2); if (n > 0) { g.inv[k] = (g.inv[k] || 0) + n; s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + n); } }
  d.mods.forEach(function (mod) { if (MODS[mod]) { giveMod(mod, modRank(d, mod)); s.push(mark(mod, modRank(d, mod))); } });
  g.drone = null;
  save();
  snd("work_ratchet", "pry");
  say("Дрон разобран. Вернулось: " + s.join(", ") + ". Блок управления цел — из него можно собрать дрона заново.");
  loadChanged();
  return true;
}

/* ════════ В ДЕЛЕ ════════ */
function carriedWeight() {
  var d = D();
  if (!d || active()) return 0;
  return d.mods.reduce(function (sum, k) { return sum + (MODS[k] ? MODS[k].wt : 0); }, 3.5);
}
function boostCapacity() { var d = D(); return active() && d.en >= 1 && hasMod("cargo") && hasMod("boost") ? effect("boost", d) + Math.floor(adjust("haul", "boost")) : 0; }
function cargoModel() { return hasMod("cargo") ? "cargo" : hasMod("sling") ? "sling" : ""; }
function carryCapacity() { var k = cargoModel(); return active() && k ? effect(k) + Math.floor(adjust("capacity", k)) + boostCapacity() : 0; }
function overloadHelp(metric) {
  if (!active()) return 0;
  var base = metric === "stride" && cargoModel() && hasMod("stabilizer") ? effect("stabilizer") :
    metric === "noise" && hasMod("baffle") ? effect("baffle") : 0;
  return Math.floor(base + adjust(metric, ["cargo","sling","stabilizer","boost","baffle"]));
}
function cargoRecovery() {
  var d = D();
  if (!d || d.wreck || !cargoModel()) return "";
  if (!d.out) return "Можно выпустить дрона через меню команд.";
  return hasMod("boost") && d.en < 1 ? "Можно подзарядить дрона энергобатареей через меню команд." : "";
}
function charge(n) {
  var d = D(); if (!d) return;
  var before = boostCapacity();
  d.en = Math.min(d.enMax, (d.en || 0) + n);
  if (boostCapacity() !== before) loadChanged();
}
function spendCharge(n) {
  var d = D();
  if (!d || (d.en || 0) < n) return false;
  var before = boostCapacity();
  d.en -= n;
  if (d.en <= 10 && d.en + n > 10) sayq(cap1(name()) + ": энергии мало. Подзарядите энергобатареей или у капсулы.");
  if (before && !boostCapacity()) {
    sayq("Тяговый блок разряжен. Грузоподъёмность дрона сейчас " + (LAB.load ? LAB.load.kg(carryCapacity()) : carryCapacity()) + ".");
    loadChanged();
  }
  return true;
}
function spend(n, command) { return spendCharge(energyCost(n, command)); }
function onStep() {
  var bonus = boostCapacity(), l = LAB.load;
  if (bonus && l && l.total() > l.capacity() - bonus) spendCharge(1);
  var d = D(), cur = gm().CUR;
  if (active() && l && l.tier() >= 2 && (hasMod("stabilizer") || hasMod("baffle") || hasMod("sling")) && (G().stats && G().stats.steps % 6 === 0)) recorded("move", "cargo");
  if (!active() || !hasMod("regen") || !cur || !cur.key) return;
  if (!d.recovered) d.recovered = {};
  if (d.recovered[cur.key]) return;
  if (!d.recoveryWalk || d.recoveryWalk.key !== cur.key) d.recoveryWalk = { key: cur.key, steps: 0 };
  d.recoveryWalk.steps = Math.min(20, d.recoveryWalk.steps + 1);
  if (d.recoveryWalk.steps < 20 || d.en >= d.enMax) return;
  var amount = Math.min(d.enMax - d.en, effect("regen") + Math.floor(adjust("recovery", "regen")));
  d.recovered[cur.key] = true;
  charge(amount);
  recorded("energy", "regen");
  sayq("Рекуператор вернул " + amount + " единиц заряда.");
  save();
}
function hostiles(r) {
  var c = C(); if (!c) return [];
  return c.visibleFoes(r).filter(function (o) { return !o.dead && !o.calm && !o.ally && !o.neutral && !o.disguised && !o.burrowed && !o.phased; });
}
function nearest(list) { var g = G(), b = null, bd = 99; list.forEach(function (o) { var d = Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)); if (d < bd) { bd = d; b = o; } }); return b; }
function scout(auto) {
  var d = D(), c = C(), g = G();
  if (!active() || !hasMod("sensor")) { if (!auto) say(d && d.wreck ? "Дрон сбит." : !d ? "Дрона нет." : !d.out ? "Дрон свёрнут." : "Нужен сенсорный блок."); return false; }
  if ((d.cd.scout || 0) > 0) { if (!auto) say("Сенсоры дрона ещё перезаряжаются."); return false; }
  if (!spend(20, "sensor")) { if (!auto) say("Дрону не хватает энергии на разведку."); return false; }
  d.cd.scout = delay("sensor", 90, "scan");
  snd("drone_ping", "scan_soft");
  var R = effect("sensor", d) + Math.floor((d.lvl || 1) / 2) + Math.floor(adjust("scanRange", "sensor")), list = c.foes().filter(function (o) { return !o.dead && !o.calm && !o.ally && !o.neutral && !o.burrowed && Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) <= R; });
  list.forEach(function (o) { o.mark = Math.max(o.mark || 0, Date.now() + markSeconds("sensor") * 1000); });
  var s = list.length ? "Разведка дрона: врагов вокруг " + list.length + " — " + list.slice(0, 5).map(function (o) { return String(o.name || "").split(",")[0] + " " + gm().relDir(o.x, o.y); }).join("; ") + (list.length > 5 ? " и другие" : "") + ". На них включены маяки." : "Разведка дрона: врагов вокруг нет.";
  if (auto) sayq(s); else say(s);
  return true;
}
function scanSupplies() {
  var d = D(), g = G(), cur = gm().CUR;
  if (!active() || !hasMod("scanner") || !cur) { say("Для поиска нужен выпущенный дрон с поисковым блоком."); return false; }
  if (d.cd.scan > 0) { say("Поисковый блок ещё перезаряжается."); return false; }
  if (!spend(12, "scanner")) { say("Дрону не хватает энергии для поиска."); return false; }
  d.cd.scan = delay("scanner", 45, "scan");
  var distance = function (o) { return Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)); };
  var radius = effect("scanner", d) + Math.floor(adjust("scanRange", "scanner"));
  var visible = function (o) { return distance(o) <= radius && LAB.los(cur.fl, cur.fs, g.x, g.y, o.x, o.y); };
  var list = gm().floorItems().filter(visible).map(function (it) { return { o: it, n: gm().itemName(it) }; });
  cur.fl.objs.filter(function (o) { return ["workbench", "supply", "capsule"].indexOf(o.type) >= 0 && visible(o); })
    .forEach(function (o) { list.push({ o: o, n: gm().objName(o) }); });
  list.sort(function (a, b) { return distance(a.o) - distance(b.o); });
  snd("drone_ping", "scan_soft");
  say(list.length ? "Поисковый блок. Ближайшие цели: " + list.slice(0, 5).map(function (x) { return x.n + ", " + gm().relDir(x.o.x, x.o.y); }).join(". ") + "." : "Поисковый блок. В радиусе " + radius + " шагов по открытым линиям подходящих целей нет.");
  save();
  return true;
}
function treat() {
  var d = D(), g = G();
  if (!active() || !hasMod("medic")) { say("Для перевязки нужен выпущенный дрон с медицинским блоком."); return false; }
  if (C() && C().danger()) { say("Перевязка возможна вне боя."); return false; }
  if (d.cd.medic > 0) { say("Медицинский блок ещё готовится к новой перевязке."); return false; }
  var bleeding = g.st && g.st.bleed;
  if (g.hp >= g.hpMax && !bleeding) { say("Здоровье полное."); return false; }
  if (!(g.inv.bandage > 0)) { say("Для перевязки нужен бинт."); return false; }
  if (!spend(10, "medic")) { say("Дрону не хватает энергии на перевязку."); return false; }
  var healed = Math.min(effect("medic", d) + Math.floor(adjust("healPower", "medic")), g.hpMax - g.hp);
  g.inv.bandage--; g.hp += healed;
  if (bleeding) g.st.bleed = 0;
  d.cd.medic = delay("medic", 40, "service");
  if (LAB.stats) LAB.stats.healed(healed);
  snd("drone_fix", "craft");
  say(cap1(name()) + " перевязал раны." + (healed ? " Здоровье плюс " + healed + ", теперь " + g.hp + " из " + g.hpMax + "." : "") + (bleeding ? " Кровотечение остановлено." : ""));
  save(); loadChanged();
  return true;
}
function stun(auto) {
  var d = D();
  if (!active() || !hasMod("zapper")) { if (!auto) say(!d ? "Дрона нет." : d.wreck ? "Дрон сбит." : !d.out ? "Дрон свёрнут." : "Нужен разрядник."); return false; }
  if ((d.cd.stun || 0) > 0) { if (!auto) say("Разрядник дрона ещё копит заряд."); return false; }
  var t = nearest(hostiles(6 + Math.floor(adjust("fireRange", "zapper"))).filter(function (o) { return !o.dStun; }));
  if (!t) { if (!auto) say("Некого оглушать: рядом ни одного врага, которого дрон ещё не бил разрядом."); return false; }
  if (!spend(15, "zapper")) { if (!auto) say("Дрону не хватает энергии на разряд."); return false; }
  d.cd.stun = delay("zapper", 30, "fire");
  t.dStun = 1;
  t.frozen = Math.max(t.frozen || 0, t.boss ? 2 : (t.kind === "mech" ? 9 : 6) + effect("zapper", d) + Math.floor(adjust("status", "zapper")));
  snd("drone_zap", "w_shock_crack");
  (auto ? sayq : say)(cap1(name()) + " бьёт разрядом: " + String(t.name || "").split(",")[0] + " — оглушение на пару секунд.");
  hitBack(t, 0.25);
  return true;
}
/* Цель может ответить дрону. */
function hitBack(f, p) {
  var d = D(); if (!d || !f || f.dead || !(f.dmg > 0) || Math.random() >= p) return;
  hurt(Math.max(1, Math.round(f.dmg * 0.5 / depthK())), f);
}
/* Корпус дрона держит удары своей глубины: урон по нему делится на рост врагов с глубиной. */
function depthK() { var g = G(); return 1 + 0.14 * (LAB.foeLevel(g.L, g.F) - 1); }
function reduction(source) {
  if (!active()) return 0;
  return Math.min(0.45, (hasMod("mesh") ? effect("mesh") / 100 : 0) + adjust("armor", ["hull", "shell", "mesh", "screen"], source ? targetFlags(source) : []));
}
function hurt(n, source) {
  var d = D(); if (!d || d.wreck) return;
  d.hp = Math.max(0, Math.round((d.hp - n * policy().risk * (1 - reduction(source))) * 100) / 100);
  if (hasMod("mesh")) recorded("armor", "mesh");
  else snd("drone_hit", "shield_hit_foe", { gain: 0.5 });
  if (d.hp <= 0) { d.wreck = 1; snd("drone_down", "drone_death"); sayq(cap1(name()) + " сбит. Блок управления цел — дрона можно починить у верстака."); if (LAB.load) setTimeout(function () { LAB.safe(function () { LAB.load.after(); }); }, 0); /* (после 4.6) сбитый — в рюкзаке, и грузовой захват больше не держит */ }
  else if (d.hp <= d.hpMax * 0.3) sayOnce("dronelow", cap1(name()) + " повреждён: " + d.hp + " из " + d.hpMax + ".", 15000);
}
/* Удар по герою: экран берёт четверть на себя. */
function onHurt(raw, adt, src) {
  var d = D();
  if (!active() || !hasMod("screen") || !(raw > 0)) return raw;
  var dk = depthK(), ratio = Math.min(0.5, effect("screen", d) / 100 + adjust("guard", "screen", src ? targetFlags(src) : []));
  var take = Math.min(d.hp * dk / (policy().risk * (1 - reduction(src))), Math.round(raw * ratio * 10) / 10);
  if (take <= 0) return raw;
  hurt(Math.max(0.1, Math.round(take / dk * 10) / 10), src);
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
    if (hasMod("gun") && d.auto.gun && tN % delay("gun", 4, "fire") === 0) {
      var t = nearest(hostiles(6 + Math.floor(adjust("fireRange", "gun"))));
      if (t && spend(1, "gun")) {
        var lvl = LAB.foeLevel(g.L, g.F), dmg = Math.max(1, Math.round(3.2 * (1 + 0.14 * (lvl - 1)) * (1 + 0.06 * ((d.lvl || 1) - 1)) * effect("gun", d) / 100 * (1 + adjust("firePower", "gun", targetFlags(t)))));
        snd("drone_shot", "w_blaster_s", { gain: 0.5 });
        c.damageFoe(t, dmg, "energy", { quiet: true, ally: true, by: "ally" });
        hitBack(t, 0.15);
      }
    }
    if (LAB.droneOps) {
      var mount = d.mods.find(function (id) { return MODS[id] && MODS[id].weapon; });
      if (mount && d.auto[mount]) LAB.droneOps.run(mount, true);
    }
  } else if (hasMod("arm") && d.auto.arm && tN % delay("arm", 20, "service") === 0) {
    /* вне боя: манипулятор чинит понемногу — до 85 */
    var w = gm().curWeapon ? gm().curWeapon() : null, a = g.armor, f = LAB.exo && LAB.exo.worn(), done = false;
    var limit = effect("arm", d);
    var fix = function (x) { if (done || !x) return; var cv = x.cond != null ? x.cond : 100; if (cv < limit && spend(2, "arm")) { x.cond = Math.min(limit, cv + 1 + Math.floor(adjust("repairPower", "arm"))); done = true; if (tN % 200 === 0) snd("drone_fix", "craft", { gain: 0.3 }); } };
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
  var d = D(); if (!d || d.wreck || !(n > 0)) return;
  var role = ROLES[d.role];
  if (role && active()) {
    if (!d.training) d.training = {};
    var before = directionRank(d, role.direction);
    d.training[role.direction] = Math.min(1200, (d.training[role.direction] || 0) + n * 0.1);
    if (directionRank(d, role.direction) > before) {
      recorded("direction", role.direction);
      sayq(catalog.directions[role.direction].n + ". Ступень направления " + directionRank(d, role.direction) + ".");
      loadChanged();
    }
  }
  if ((d.lvl || 1) >= 10) return;
  d.xp = (d.xp || 0) + n * (MS() && MS().has("drones") ? 0.2 : 0.1);
  var start = d.lvl || 1;
  while ((d.lvl || 1) < 10 && d.xp >= 25 * (d.lvl || 1)) {
    d.xp -= 25 * (d.lvl || 1); d.lvl = (d.lvl || 1) + 1; d.hpMax += 8; d.hp = d.hpMax; d.enMax += 5;
  }
  if ((d.lvl || 1) > start) {
    snd("drone_ok", "ui_levelup");
    sayq(cap1(name()) + " вырос: ступень " + d.lvl + "." + (start < 5 && d.lvl >= 5 ? " Открылось ещё одно гнездо для модуля." : ""));
  }
}
function pack(v) {
  var d = D(); if (!d) { say("Дрона нет."); return false; }
  if (d.wreck) { say("Дрон сбит."); return false; }
  d.out = v ? 1 : 0;
  save();
  snd(v ? "drone_up" : "drone_ok", v ? "power_on" : "ui_close");
  say(v ? cap1(name()) + " снова в воздухе." : cap1(name()) + " свёрнут: молчит и ничего не тратит.");
  loadChanged();
  return true;
}
function batteryGain() {
  return 50 + (hasMod("charger") ? effect("charger") : 0) + Math.floor(adjust("charge", ["charger","battery","reserve"]));
}
function chargeBat() {
  var d = D(), g = G(); if (!d) { say("Дрона нет."); return false; }
  if (d.en >= d.enMax) { say("Энергия дрона полна."); return false; }
  if (!(g.ammo.energy > 0)) { say("Энергобатарей нет."); return false; }
  g.ammo.energy--; charge(batteryGain());
  recorded("energy", "charger");
  say(cap1(name()) + " подзаряжен: " + Math.round(d.en) + " из " + d.enMax + ".");
  save(); loadChanged();
  return true;
}
function chargePrice() {
  var d = D(); if (!d) return 0;
  var miss = d.enMax - (d.en || 0); if (miss <= 0) return 0;
  var pb = LAB.medic && LAB.medic.vendPrice ? LAB.medic.vendPrice("ammo:energy") : 20;
  return Math.max(1, Math.round(pb * miss / batteryGain()));
}
function craftCable() {
  var why = canWork(2, CABLE_NEED);
  if (why) { say("Полевой кабель. " + cap1(why) + "."); return false; }
  var inv = G().inv;
  if (inv[CABLE] > 0) { say("Полевой кабель уже в рюкзаке."); return false; }
  W().take(CABLE_NEED);
  inv[CABLE] = 1;
  worked(6, 4); loadChanged();
  recorded("craft", "link_amp");
  say("Полевой кабель питания в рюкзаке. Передача заряда доступна в командах дрона.");
  return true;
}
function transferPlan(toDrone) {
  var x = LAB.exo, frame = x && x.worn(), d = D();
  if (!frame || !active() || !(G().inv[CABLE] > 0)) return null;
  var from = toDrone ? frame : d, to = toDrone ? d : frame;
  var free = (toDrone ? d.enMax : x.capOf(frame)) - (to.en || 0);
  var available = Math.floor((from.en || 0) - 5 + 1e-6);
  var rate = Math.min(0.95, 0.8 + (hasMod("link_amp") ? 0.08 : 0) + adjust("transferLoss", "link_amp"));
  var limit = 16 + (hasMod("link_amp") ? effect("link_amp") : 0) + Math.floor(adjust("transfer", ["link_amp","battery","reserve"]));
  var received = Math.max(0, Math.floor(Math.min(limit, free + 1e-6, available * rate + 1e-6)));
  return { frame: frame, received: received, sent: Math.ceil(received / rate - 1e-6) };
}
function transfer(toDrone) {
  var p = transferPlan(toDrone), x = LAB.exo;
  if (!p) { say("Нужны полевой кабель, выпущенный дрон и надетый каркас."); return false; }
  if (C() && C().danger()) { say("Передача заряда возможна вне боя."); return false; }
  if (p.received <= 0) { say("Передача невозможна. У приёмника должно быть свободное место, у источника — больше пяти единиц заряда."); return false; }
  if (toDrone) {
    if (!x.takeCharge(p.frame, p.sent)) return false;
    charge(p.received);
  } else {
    if (!spendCharge(p.sent)) return false;
    x.addCharge(p.frame, p.received);
  }
  recorded("energy", "link_amp");
  say((toDrone ? "Дрон получил " : "Каркас получил ") + p.received + " единиц заряда. Потери при передаче " + (p.sent - p.received) + ".");
  save(); loadChanged();
  return true;
}

/* ════════ СЛОВА И ОКНА ════════ */
function line(d) {
  d = d || D(); if (!d) return "";
  var listed = d.mods.filter(function (k) { return !!MODS[k]; }), role = ROLES[d.role];
  var focus = role ? ". Направление «" + programFor(d, role).n + "», ступень " + directionRank(d, role.direction) : "";
  return cap1(name(d)) + ": ступень " + (d.lvl || 1) + ", " + (d.wreck ? "сбит" : (d.out ? "в воздухе" : "свёрнут") + ", здоровье " + Math.round(d.hp) + " из " + d.hpMax) +
    ", энергия " + Math.round(d.en) + " из " + d.enMax + ". Профиль «" + (role ? role.n : "Универсальный") + "»" + focus + ". Занято гнёзд " + usedSlots(d) + " из " + slots(d) + ". Модули: " + (listed.length ? listed.map(function (k) { return mark(k, modRank(d, k)); }).join(". ") : "нет") +
    ((d.mods.indexOf("cargo") >= 0 || d.mods.indexOf("sling") >= 0) && LAB.load ? ". Грузоподъёмность дрона сейчас: " + LAB.load.kg(carryCapacity()) : "");
}
function charLine() { var d = D(); return d ? line(d) + "." : ""; }
function benchLabel() { return D() ? "Дрон-спутник: модули и починка — " + short() : "Дрон-спутник: сборка корпуса и модулей"; }
function back() { return { label: "Назад", close: true, fn: function () {} }; }
function moduleMenu(k) {
  var md = MODS[k];
  var items = function () {
    var d = D(), on = d && d.mods.indexOf(k) >= 0, effectInfo = RANK_EFFECTS[k], rank = on ? modRank(d, k) : 1;
    var ranks = (effectInfo ? [1, 2, 3] : [1]).filter(function (r) { return G().inv[modId(k, r)] > 0; });
    var out = [{ label: cap1(md.d) + ". Масса: " + LAB.load.kg(md.wt) + (on && effectInfo ? ". Стоит ступень " + rank + ". " + effectInfo.n + ": " + effectInfo.v[rank - 1] : "") + ".", info: true, keep: true, fn: function () { say(cap1(md.d) + "."); } }];
    out.push({ label: "Собрать в запас. " + requirementLine(md) + " Детали: " + W().costText(materialCost(md)) + ".", keep: true, fn: function () { craftMod(k); } });
    if (on) {
      if (effectInfo && rank < 3) {
        var next = upgradeDetails(k, rank + 1);
        out.push({ label: "Улучшить до ступени " + (rank + 1) + ". " + effectInfo.n + ": " + effectInfo.v[rank] + ". Дрон ступени " + next.level + ", верстак ступени " + next.tier + ". Детали: " + W().costText(next.need) + ".", keep: true, fn: function () { upgradeMod(k); } });
      }
      if (compatibleTuning(k).length) {
        var tune = d.tuning && catalog.modifications[d.tuning[k]];
        out.push({ label: "Модификации." + (tune ? " Действует «" + tune.n + "»." : ""), fn: function () { tuningMenu(k); } });
      }
      out.push({ label: "Снять и положить в рюкзак.", keep: true, fn: function () { delMod(k); } });
    }
    else if (d) {
      var why = socketIssue(k, d);
      ranks.forEach(function (r) {
        out.push({ label: "Установить из рюкзака. " + mark(k, r) + ", в наличии " + G().inv[modId(k, r)] + (why ? ". Сейчас: " + why : "") + ".", keep: true, fn: function () { addMod(k, r); } });
      });
      if (!ranks.length) out.push({ label: "Собрать и установить" + (why ? ". Сейчас: " + why : "") + ".", keep: true, fn: function () { addMod(k); } });
    }
    return out.concat(back());
  };
  menu(cap1(md.n), items(), { keep: true, rebuild: items });
}
function requirementLine(def) {
  var r = requirements(def);
  return (r.text ? "Требуется " + r.text + ". " : "") + (r.why ? "Недоступно. " + cap1(r.why) + "." : "");
}
function compatibleTuning(k) {
  return Object.keys(catalog.modifications).filter(function (id) { return catalog.modifications[id].fits.indexOf(k) >= 0; });
}
var tuningModes = { standard:"Стандартные", power:"Форсированные", economy:"Бережливые", reserve:"Резервные" };
function tuningMenu(k) {
  var ids = compatibleTuning(k), items = function () {
    var d = D(), rows = Object.keys(tuningModes).map(function (mode) {
      var matches = ids.filter(function (id) { return (catalog.modifications[id].stage || "standard") === mode; });
      return { label:tuningModes[mode] + ", " + matches.length, fn:function () { tuningOptions(k, mode, matches); } };
    });
    if (d.tuning && d.tuning[k]) rows.push({ label:"Отключить модификацию", keep:true, fn:function () { tuneModule(k, null); } });
    return rows.concat(back());
  };
  menu("Модификации узла «" + MODS[k].n + "»", items(), { keep:true, rebuild:items,
    intro:"На модели действует одна настройка. Её запоминает корпус, даже когда вы снимаете узел." });
}
function tuningOptions(k, mode, ids) {
  var items = function () {
    var d = D();
    return ids.map(function (id) {
      var t = catalog.modifications[id];
      var effect = describe(t.metric, t.points, null, t.flag) + ".";
      if (t.side) effect += " " + cap1(describe(t.side[0], t.side[1])) + ".";
      if (t.reactive) effect += " При остатке заряда до четверти: " + describe(t.metric, t.reactive) + " дополнительно.";
      return { label:t.n + ". " + cap1(effect) + " " + requirementLine(t) + " Детали: " + W().costText(materialCost(t)) + "." +
        (d.tuning && d.tuning[k] === id ? " Активна." : ""), keep:true, fn:function () { tuneModule(k, id); } };
    }).concat(back());
  };
  menu(tuningModes[mode] + " настройки узла «" + MODS[k].n + "»", items(), { keep:true, rebuild:items });
}
function roleMenu() {
  var rows = Object.keys(catalog.directions).map(function (key) {
    var dir = catalog.directions[key];
    return { label:dir.n + ", " + dir.roles.length + " специализаций", fn:function () { roleFamily(key); } };
  });
  menu("Специализации дрона", rows.concat(back()), { intro:"Дрон использует одну специализацию. Первый выбор требует деталей. Изученную можно снова включить у верстака." });
}
function roleFamily(key) {
  var dir = catalog.directions[key], rows = [{ label:"Основные специализации", fn:function () { roleOptions(key, dir.roles.slice(0, dir.nativeCount)); } }];
  [0,1,2].forEach(function (block) {
    var ids = dir.roles.slice(dir.nativeCount + 7 * block, block === 2 ? undefined : dir.nativeCount + 7 * (block + 1));
    rows.push({ label:"Специализации для уровней комплекса " + unlockDepth(ROLES[ids[0]]) + " и ниже, группа " + (block + 1), fn:function () { roleOptions(key, ids); } });
  });
  menu(dir.n + ". Специализации", rows.concat(back()));
}
function roleOptions(key, ids) {
  var items = function () {
    var d = D();
    return ids.map(function (id) {
      var r = ROLES[id], trained = d.learned && d.learned[id];
      return { label:r.n + ". " + cap1(explain(r.effects)) + ". " + requirementLine(r) +
        (trained ? " Изучена." : " Детали: " + W().costText(materialCost(r)) + ".") + (d.role === id ? " Активна." : ""),
        keep:true, fn:function () { setRole(id); } };
    }).concat(back());
  };
  menu(catalog.directions[key].n + ". Выбор специализации", items(), { keep:true, rebuild:items });
}
var sections = ["Основное направление", "Верхние уровни", "Середина комплекса", "Глубокие уровни", "Нижние комплексы"];
function directionsMenu() {
  var rows = Object.keys(catalog.directions).map(function (key) {
    return { label:catalog.directions[key].n + ", 40 направлений", fn:function () {
      var ids = Object.keys(catalog.programs).filter(function (id) { return catalog.programs[id].family === key; });
      var groups = sections.map(function (n, index) {
        var group = ids.filter(function (id) { return catalog.programs[id].section === index; });
        return { label:n + ", " + group.length, fn:function () { directionOptions(key, n, group); } };
      });
      menu(catalog.directions[key].n + ". Направления", groups.concat(back()));
    } };
  });
  menu("Направления дрона", rows.concat(back()), { intro:"Чтобы выбрать направление, установите специализацию в той же области. Опыт направления сохраняется при смене. Дрон получает его, пока выпущен и герой набирает опыт." });
}
function directionOptions(key, title, ids) {
  var items = function () {
    var d = D(), role = ROLES[d.role], dir = catalog.directions[key], rank = directionRank(d, key);
    return ids.map(function (id) {
      var r = catalog.programs[id], info = describe(dir.metric, dir.points * r.scale * (1 + (rank - 1) * .5));
      return { label:r.n + ". " + cap1(info) + (r.effects.length ? ". " + cap1(explain(r.effects)) : "") + ". " +
        requirementLine(r) + (role && role.direction === key && programFor(d, role) === r ? " Активно." : ""),
        keep:true, fn:function () { setProgram(id); } };
    }).concat(back());
  };
  menu(catalog.directions[key].n + ". " + title, items(), { keep:true, rebuild:items });
}
function equipmentMenu(title, keys) {
  var items = function () {
    var d = D();
    return keys.map(function (k) {
      var md = MODS[k], count = [1,2,3].reduce(function (n, r) { return n + (G().inv[modId(k, r)] || 0); }, 0), installed = d && d.mods.indexOf(k) >= 0;
      return { label:cap1(md.n) + (installed ? ", установлен" : "") + (count ? ", в рюкзаке " + count : "") + ". " +
        requirementLine(md), fn:function () { moduleMenu(k); } };
    }).concat(back());
  };
  menu(title, items(), { keep:true, rebuild:items });
}
function benchMenu(et) {
  var b_ = function () {
    var d = D(), items = [];
    if (!d) items.push({ label: "Собрать дрона: " + W().costText(NEED), keep: true, fn: function () { build(); } });
    else {
      items.push({ label: line(d), info: true, keep: true, fn: function () { say(line(d) + "."); } });
      items.push({ label:"Специализации, " + Object.keys(ROLES).length, fn:roleMenu });
      items.push({ label:"Направления, " + Object.keys(catalog.programs).length, fn:directionsMenu });
      if (d.mods.length) items.push({ label:"Установленное оборудование, " + d.mods.length, fn:function () {
        equipmentMenu("Установленное оборудование", D().mods.filter(function (k) { return !!MODS[k]; }));
      } });
    }
    Object.keys(catalog.groups).forEach(function (id) {
      var keys = MOD_ORDER.filter(function (k) { return MODS[k].group === id; });
      items.push({ label:"Оборудование. " + catalog.groups[id] + ", " + keys.length, fn:function () { equipmentMenu(catalog.groups[id], keys); } });
    });
    if (d) {
      var rn = repairNeed(d);
      if (rn) items.push({ label: (d.wreck ? "Починить сбитого дрона: " : "Залатать дрона: ") + W().costText(rn), keep: true, fn: function () { repair(); } });
      items.push({ label: "Разобрать корпус. Блок управления и модули вернутся", fn: function () {
        menu("Разборка дрона", [
          { label: "Разобрать. Опыт этого корпуса будет потерян", keep: true, fn: function () { if (scrapDrone()) { LAB.ui.closeTop(true); LAB.ui.rebuildTop(); } } },
          back()
        ]);
      } });
    }
    items.push({ label: "Полевой кабель питания: " + (G().inv[CABLE] > 0 ? "есть в рюкзаке." : "собрать. Детали: " + W().costText(CABLE_NEED) + "."), keep: true, fn: craftCable });
    items.push(back());
    return items;
  };
  menu("Дрон-спутник", b_(), { keep: true, rebuild: b_ });
}
function cmdItems() {
  var d = D(), items = [];
  if (!d) return [{ label: "Дрона нет: его собирают у верстака из блока управления машины.", info: true, keep: true, fn: function () {} }];
  items.push({ label: line(d), info: true, keep: true, fn: function () { say(line(d) + "."); } });
  if (!d.wreck) {
    if (hasMod("sensor")) items.push({ label: "Разведка: маяки на врагов вокруг. Расход " + energyCost(20, "sensor"), keep: true, fn: function () { scout(false); } });
    if (hasMod("zapper")) items.push({ label: "Оглушить ближайшего врага. Расход " + energyCost(15, "zapper"), keep: true, fn: function () { stun(false); } });
    if (hasMod("scanner")) items.push({ label: "Искать припасы и оборудование. Расход " + energyCost(12, "scanner"), keep: true, fn: scanSupplies });
    if (hasMod("medic")) items.push({ label: "Перевязать раны. Расход " + energyCost(10, "medic") + " энергии и один бинт", keep: true, fn: treat });
    if (LAB.droneOps) items = items.concat(LAB.droneOps.items());
    items.push({ label: d.out ? "Свернуть дрона" : "Выпустить дрона", keep: true, fn: function () { pack(!d.out); } });
    items.push({ label: "Подзарядить энергобатареей: плюс " + batteryGain() + ". Батарей " + (G().ammo.energy || 0), keep: true, fn: function () { chargeBat(); } });
    [true, false].forEach(function (toDrone) {
      var p = transferPlan(toDrone);
      if (!p || p.received <= 0) return;
      items.push({ label: "Передать заряд " + (toDrone ? "дрону от каркаса" : "каркасу от дрона") + ". Получит " + p.received + ", источник отдаст " + p.sent + ".", keep: true, fn: function () { transfer(toDrone); } });
    });
    var toggles = [["scout", "Разведка при входе на этаж", "sensor"], ["stun", "Разряд в бою сам", "zapper"],
      ["gun", "Огонь в бою сам", "gun"], ["arm", "Починка вне боя сама", "arm"]];
    var mount = d.mods.find(function (id) { return MODS[id] && MODS[id].weapon; });
    if (mount) toggles.push([mount, "Автоогонь. " + MODS[mount].n, mount]);
    toggles.forEach(function (a) {
      if (!hasMod(a[2])) return;
      items.push({ label: a[1], kind: "choice", options: [{ v: 1, label: "да" }, { v: 0, label: "нет" }], get: function () { return d.auto[a[0]] ? 1 : 0; }, set: function (v) { d.auto[a[0]] = v ? 1 : 0; save(); snd("pwr_click", "ui_click"); } });
    });
  }
  return items;
}
function cmdMenu() {
  var b_ = function () { return cmdItems().concat(back()); };
  menu("Дрон-спутник", b_(), { keep: true, rebuild: b_ });
}
function stockIds() {
  var inv = G().inv;
  return Object.keys(inv).filter(function (id) { return (id === CABLE || /^dr_mod_/.test(id)) && inv[id] > 0 && LAB.ITEMS[id]; });
}
function invItems() {
  var g = G(), items = D() ? [{ label: line(), fn: cmdMenu }] : [];
  stockIds().forEach(function (id) {
    var row = LAB.ITEMS[id].n + ". В рюкзаке " + g.inv[id] + ". " + LAB.ITEMS[id].desc;
    items.push({ label: row, info: true, keep: true, fn: function () { say(row); } });
  });
  return items;
}
function stockCount() { var inv = G().inv; return stockIds().reduce(function (sum, id) { return sum + inv[id]; }, 0); }
/* Alt+D: команды дрону и каркасу. */
function quickItems() {
  var items = D() ? cmdItems() : [];
  var f = LAB.exo && LAB.exo.worn();
  if (f && f.sh === "horn") items.push({ label: "СВЧ-залп раструбом каркаса", fn: function () { LAB.exo.horn(); } });
  return items.concat(back());
}
function quick() {
  var items = quickItems();
  if (items.length === 1) { say("Команды появятся, когда вы соберёте дрона или поставите раструб на каркас. Откройте «Инженерное дело» у верстака."); return; }
  menu("Команды: дрон и каркас", items, { rebuild: quickItems });
}

LAB.drone = {
  MODS: MODS, NEED: NEED, D: D, has: has, slots: slots, active: active, hasMod: hasMod, short: short,
  build: build, craftMod: craftMod, addMod: addMod, delMod: delMod, upgradeMod: upgradeMod, modRank: modRank, setRole: setRole, repair: repair, scrap: scrapDrone, scout: scout, scanSupplies: scanSupplies, treat: treat,
  craftCable: craftCable, transfer: transfer, tuneModule: tuneModule, setProgram: setProgram,
  effect: effect, adjust: adjust, delay: delay, spend: spend, hostiles: hostiles, targetFlags: targetFlags, hitBack: hitBack,
  recorded: recorded, save: save, markSeconds: markSeconds, overloadHelp: overloadHelp, directionRank: directionRank, unlockDepth: unlockDepth,
  hurt: hurt, onHurt: onHurt, onStep: onStep, tick: tick, onXP: onXP, commandSaving: commandSaving, energyCost: energyCost,
  carriedWeight: carriedWeight, carryCapacity: carryCapacity, cargoRecovery: cargoRecovery,
  pack: pack, charge: charge, chargeBat: chargeBat, chargePrice: chargePrice, line: line, charLine: charLine, benchLabel: benchLabel, benchMenu: benchMenu,
  cmdMenu: cmdMenu, invItems: invItems, stockCount: stockCount, quick: quick
};
})();
