/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — мастерская.
   Верстак бывает трёх уровней: базовый (тиски, ручной инструмент,
   паяльник), специализированный (паяльная станция, станок, тестер) и
   экспериментальный стенд опытной серии. Бывает повреждён — тогда
   работает только ручной инструмент, пока станки не починить; при
   аварийном освещении станки стоят. Рецепты — базовые, специализированные
   и экспериментальные. Новые схемы открываются чертежами: технические
   документы, разговоры с инженерами, разбор устройств, исследование на
   верстаке, установки глубин, разбор редких компонентов.
   Оружие: модули (мощность, точность, дальность, перезарядка, радиатор,
   ёмкость, бронебойность, подавление электроники, глушитель,
   стабилизатор), износ и ремонт, перегрев ствола. У каждой детали —
   где её найти и для чего она нужна.
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
function menu(title, items, opts) { return LAB.ui.menu(title, items, opts); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function h32(s) { return LAB.hash32(s) >>> 0; }
var lastSay = {};
function sayOnce(k, t, gap) { var n = Date.now(); if (lastSay[k] && n - lastSay[k] < (gap || 4000)) return; lastSay[k] = n; sayq(t); }

/* ════════ ДЕТАЛИ: новые, и у каждой — где взять ════════ */
var PARTS_NEW = {
  relay:     { n: "Реле", icon: "🔀", desc: "Электромагнитное реле: щёлкает, переключая цепи. Без него не собрать ни электронную приманку, ни подавитель.", price: 11, depth: 1 },
  cell:      { n: "Аккумуляторная ячейка", icon: "🔋", desc: "Литиевая ячейка из батарей и роботов: держит заряд долго.", price: 12, depth: 1 },
  servo:     { n: "Сервопривод", icon: "⚙️", desc: "Моторчик с редуктором из сустава робота.", price: 15, depth: 2 },
  optic:     { n: "Оптический сенсор", icon: "👁️", desc: "Глаз камеры ОКО: матрица и линза в кожухе.", price: 18, depth: 2 },
  panel:     { n: "Защитная панель", icon: "🛡️", desc: "Броневой лист с кожуха турели или тяжёлого робота.", price: 14, depth: 3 },
  powercell: { n: "Силовой модуль", icon: "⚡", desc: "Блок питания тяжёлого робота: держит большой ток.", price: 30, depth: 4 },
  /* только из особых мест — случайная добыча его не даёт */
  proto:     { n: "Экспериментальный компонент", icon: "🧪", desc: "Узел опытной серии «Ковчега»: непонятно, как сделан, но работает. Основа экспериментальных схем.", price: 70, depth: 99 }
};
var SRC = {
  scrap: "ящики и склады, обломки роботов, разбор оружия, брони и устройств",
  wire: "склады деталей и щитовые, разбор устройств; продают инженеры и кладовщики",
  chip: "склады деталей, обломки роботов, разбор оружия и декодеров",
  cap: "склады деталей, генераторные залы, обломки роботов, разбор приманок и гранат",
  gel: "медпункты и лаборатории, твари",
  reagent: "лаборатории и химические склады, твари",
  lens: "склады деталей со второго уровня, разбор лазеров, бластеров и зондов",
  magnet: "склады деталей со второго уровня, генераторы, обломки роботов",
  ceramic: "склады и оружейные с третьего уровня, роботы с модификациями",
  supercond: "технические склады глубоких уровней, роботы с модификациями",
  relay: "щитовые и склады деталей, обломки охранных роботов; перематывают из провода у верстака",
  cell: "разбор энергобатарей у верстака, обломки роботов, генераторные залы; собирают из конденсаторов",
  servo: "обломки роботов и турелей, сборочные цеха и ремонтные боксы; восстанавливают у верстака",
  optic: "разбитые камеры ОКО и дроны, склады деталей; собирают из линзы и микросхемы",
  panel: "разбитые турели и тяжёлые роботы, склады с третьего уровня; выправляют из металлолома и керамики",
  powercell: "тяжёлые роботы и генераторные залы с четвёртого уровня, разбор тяжёлых турелей",
  proto: "боссы, сейфы глубоких уровней, установки глубин под Ядром, разбор оружия-прототипов"
};
var pk;
for (pk in PARTS_NEW) {
  var pd = PARTS_NEW[pk]; pd.kind = "part";
  LAB.ITEMS[pk] = pd;
  if (LAB.PARTS.indexOf(pk) < 0) LAB.PARTS.push(pk);
  LAB.PART_DEPTH[pk] = pd.depth;
}
function srcOf(k) { return SRC[k] || (LAB.ITEMS[k] && LAB.ITEMS[k].kind === "part" ? "попадается на своей глубине: ящики, склады, обломки машин" : "собирают в мастерской или покупают"); }

/* ════════ ПАТРОНЫ, ОРУЖИЕ, УСТРОЙСТВА ════════ */
/* стальные пули — только из мастерской и у торговцев: в случайной добыче их нет (этажи не меняются) */
LAB.AMMO.slug = { n: "Обойма стальных пуль", icon: "🔩", desc: "Стальные пули для кинетического оружия — пистолета и карабина. Обойму делают из металлолома у любого верстака.", price: 14, depth: 2, loot: false };
var W_NEW = {
  kpistol:    { n: "кинетический пистолет", g: "m", cls: "kinetic", ammo: "slug", dt: "kinetic", dmg: 11, rng: 7, spread: 0, cap: 8, cd: 480, snd: "w_gauss", sndRate: 1.45,
    desc: "Катушечный ускоритель стальных пуль: не греется и не тратит батарей, пули делают из металлолома. Броня гасит его сильнее, чем лучи." },
  suppressor: { n: "ЭМ-подавитель «Тишь»", g: "m", cls: "ion", ammo: "energy", dt: "emp", dmg: 3, rng: 4, spread: 1, cap: 10, cd: 650, snd: "w_ion", sndRate: 0.78, stunMech: 3,
    desc: "Короткий электромагнитный импульс: роботы и турели замирают на несколько тактов. Живому почти не вредит, экранированных машин не берёт." },
  needle:     { n: "бронебойный карабин «Игла»", g: "m", cls: "kinetic", ammo: "slug", dt: "kinetic", dmg: 19, rng: 9, spread: 0, cap: 4, cd: 1000, snd: "w_gauss", sndRate: 1.1, apierce: 0.7,
    desc: "Вольфрамовая игла на магнитном разгоне: броня роботов её почти не держит. Взводится долго, в обойме четыре выстрела." }
};
var wk;
for (wk in W_NEW) LAB.WEAPONS[wk] = W_NEW[wk];
LAB.WEAPON_DEPTH.kpistol = 2; LAB.WEAPON_DEPTH.suppressor = 3; LAB.WEAPON_DEPTH.needle = 4;
LAB.MODEL.kpistol = "КП"; LAB.MODEL.suppressor = "ЭМП"; LAB.MODEL.needle = "БК";

var I_NEW = {
  wrepair:     { n: "Ремонтный набор оружия", icon: "🔧", kind: "use", desc: "Инструмент и запчасти: чинит оружие в руках прямо в коридоре — плюс тридцать пять к состоянию.", price: 45, fx: { wfix: 35 } },
  decoy_e:     { n: "Электронная приманка", icon: "📶", kind: "throw", desc: "Маячок передаёт роботам ваш сигнал: машины ОКО идут к нему, а ОКО отмечает там подозрение. Живых не обманывает.", price: 55, fx: { decoy: 1 } },
  disruptor:   { n: "Сенсорная помеха", icon: "🌫️", kind: "throw", desc: "Граната помех: камеры рядом с местом падения слепнут на двадцать секунд, роботы вблизи на время теряют вас из виду.", price: 70, fx: { blind: 1 } },
  turret_kit2: { n: "Тяжёлая переносная турель", icon: "🔫", kind: "deploy", desc: "Турель на сервоприводах с бронепанелью: шестьдесят выстрелов, бьёт в полтора раза сильнее обычной.", price: 220, fx: { deploy: 60, dmgK: 1.5 } }
};
var ik;
for (ik in I_NEW) LAB.ITEMS[ik] = I_NEW[ik];

/* ════════ МОДУЛИ ОРУЖИЯ ════════ */
var MODS = {
  power:  { item: "m_power", n: "модуль мощности", max: 3, price: 60, desc: "Плюс пятнадцать процентов к урону." },
  acc:    { item: "m_acc", n: "модуль точности", max: 2, price: 55, desc: "Оптический прицел: попадания чаще, особенно издалека и очередью." },
  range:  { item: "m_range", n: "удлинитель ствола", max: 2, price: 50, desc: "Плюс два шага дальности." },
  reload: { item: "m_reload", n: "модуль быстрой перезарядки", max: 2, price: 50, desc: "Перезарядка на треть быстрее, выстрелы чуть чаще." },
  cool:   { item: "m_cool", n: "радиатор", max: 2, price: 45, desc: "Ствол греется медленнее: больше выстрелов подряд без перегрева." },
  cap:    { item: "m_cap", n: "модуль ёмкости", max: 2, price: 55, desc: "Батарея держит на треть больше выстрелов." },
  pierce: { item: "m_pierce", n: "бронебойный модуль", max: 2, price: 60, desc: "Броня роботов гасит удар заметно меньше." },
  emp:    { item: "m_emp", n: "модуль подавления электроники", max: 2, price: 60, desc: "Плюс четверть урона по роботам, турелям и камерам." },
  quiet:  { item: "m_quiet", n: "глушитель", max: 2, price: 50, desc: "Выстрел тише и глуше: враги слышат его только вблизи." },
  stab:   { item: "m_stab", n: "стабилизатор", max: 1, price: 120, desc: "Оружие меньше изнашивается, реже даёт осечки, очередь точнее." }
};
var MOD_ORDER = ["power", "acc", "range", "reload", "cool", "cap", "pierce", "emp", "quiet", "stab"];
MOD_ORDER.forEach(function (k) { var m = MODS[k]; LAB.ITEMS[m.item] = { n: cap1(m.n), icon: "🔩", kind: "wmodule", mod: k, desc: m.desc + " Ставится у верстака: пункт «Установить модуль».", price: m.price }; });

/* ════════ РЕЦЕПТЫ ════════ */
var R_NEW = [
  { id: "bat_s", out: "ammo:slug", n: "Обойма стальных пуль", need: { scrap: 2 }, cls: "base" },
  { id: "wrepair", out: "wrepair", n: "Ремонтный набор оружия", need: { scrap: 2, wire: 1 }, cls: "base" },
  { id: "r_relay", out: "relay", n: "Перемотать реле", need: { scrap: 1, wire: 2 }, cls: "base", group: "restore", desc: "Из обрезков металла и провода — рабочее реле." },
  { id: "r_cell", out: "cell", n: "Собрать аккумуляторную ячейку", need: { cap: 2, wire: 1 }, cls: "base", group: "restore", desc: "Два конденсатора в одной обмотке — ячейка." },
  { id: "r_servo", out: "servo", n: "Восстановить сервопривод", need: { scrap: 2, magnet: 1, wire: 1 }, cls: "base", group: "restore", minL: 2, desc: "Перемотать моторчик и собрать редуктор." },
  { id: "r_optic", out: "optic", n: "Собрать оптический сенсор", need: { lens: 1, chip: 1 }, cls: "spec", group: "restore", minL: 2, desc: "Линза и микросхема — глаз для прицела и помехи." },
  { id: "r_panel", out: "panel", n: "Выправить защитную панель", need: { scrap: 3, ceramic: 1 }, cls: "spec", group: "restore", minL: 3, desc: "Лист металла под прессом и слой керамики." },
  { id: "m_acc", out: "m_acc", n: "Модуль точности", need: { optic: 1, chip: 1, wire: 1 }, cls: "spec", bp: true },
  { id: "m_range", out: "m_range", n: "Удлинитель ствола", need: { lens: 1, magnet: 1, scrap: 2 }, cls: "spec", bp: true, minL: 2 },
  { id: "m_reload", out: "m_reload", n: "Модуль быстрой перезарядки", need: { servo: 1, cap: 1, wire: 1 }, cls: "spec", bp: true, minL: 2 },
  { id: "m_cool", out: "m_cool", n: "Радиатор", need: { scrap: 2, wire: 1, ceramic: 1 }, cls: "spec", bp: true, minL: 3 },
  { id: "m_cap", out: "m_cap", n: "Модуль ёмкости", need: { cell: 2, wire: 1 }, cls: "spec", bp: true },
  { id: "m_pierce", out: "m_pierce", n: "Бронебойный модуль", need: { magnet: 1, panel: 1, scrap: 1 }, cls: "spec", bp: true, minL: 3 },
  { id: "m_emp", out: "m_emp", n: "Модуль подавления электроники", need: { relay: 1, chip: 1, magnet: 1 }, cls: "spec", bp: true, minL: 2 },
  { id: "m_quiet", out: "m_quiet", n: "Глушитель", need: { scrap: 2, gel: 1, wire: 1 }, cls: "spec", bp: true },
  { id: "m_stab", out: "m_stab", n: "Стабилизатор", need: { servo: 1, chip: 1, proto: 1 }, cls: "exp", bp: true, minL: 3 },
  { id: "w_kpistol", out: "weapon:kpistol", n: "Кинетический пистолет", need: { scrap: 3, magnet: 1, cap: 1, servo: 1 }, cls: "spec", bp: true, minL: 2 },
  { id: "w_suppressor", out: "weapon:suppressor", n: "ЭМ-подавитель «Тишь»", need: { chip: 1, relay: 2, cap: 2, wire: 1 }, cls: "spec", bp: true, minL: 3 },
  { id: "w_needle", out: "weapon:needle", n: "Бронебойный карабин «Игла»", need: { scrap: 3, magnet: 2, panel: 1, servo: 1, powercell: 1 }, cls: "spec", bp: true, minL: 4 },
  { id: "decoy_e", out: "decoy_e", n: "Электронная приманка", need: { relay: 1, chip: 1, cell: 1 }, cls: "spec", bp: true },
  { id: "disruptor", out: "disruptor", n: "Сенсорная помеха", need: { optic: 1, relay: 1, cap: 1 }, cls: "spec", bp: true, minL: 2 },
  { id: "turret_kit2", out: "turret_kit2", n: "Тяжёлая переносная турель", need: { turret_kit: 1, servo: 2, panel: 1, powercell: 1 }, cls: "exp", bp: true, minL: 4 },
  { id: "bat_p", out: "ammo:positron", n: "Позитронная ловушка", need: { supercond: 1, proto: 1, cell: 2 }, cls: "exp", bp: true, minL: 7, desc: "Магнитная ловушка с антивеществом — заряд позитронного оружия." }
];
R_NEW.forEach(function (rc) { if (!LAB.RECIPES.some(function (q) { return q.id === rc.id; })) LAB.RECIPES.push(rc); });
/* прежний «модуль усиления» — теперь модуль мощности: собирается в запас и ставится на любое оружие */
LAB.RECIPES.forEach(function (rc) { if (rc.id === "wmod") { rc.out = "m_power"; rc.n = "Модуль мощности"; rc.desc = "Плюс пятнадцать процентов к урону оружия, не больше трёх на одно оружие."; } });

/* Классы рецептов: базовые — у любого верстака, специализированные — на
   паяльной станции, экспериментальные — на стенде опытной серии. */
var BASE_IDS = ["medkit_s", "antidote", "stim", "bandage", "sorbent", "bat_e", "noise", "lockpick", "filter", "w_baton", "a_vest"];
var EXP_IDS = ["w_cryo", "a_exo", "a_bastion", "a_positron", "a_ark"];
function clsRule(rc) {
  if (BASE_IDS.indexOf(rc.id) >= 0) return "base";
  if (EXP_IDS.indexOf(rc.id) >= 0) return "exp";
  if ((rc.minL || 0) > 10 && String(rc.out).indexOf("armor:") === 0) return "exp";
  return "spec";
}
function clsOf(rc) { if (!rc.cls) rc.cls = clsRule(rc); return rc.cls; }
LAB.RECIPES.forEach(clsOf);
var CLS_T = { base: 1, spec: 2, exp: 3 };
var CLS_N = { base: "базовая схема", spec: "специализированная схема", exp: "экспериментальная схема" };

/* ════════ ВЕРСТАК: уровень, состояние, питание ════════ */
var TIER = [null,
  { n: "базовый верстак", d: "тиски, ручной инструмент и паяльник" },
  { n: "специализированный верстак", d: "паяльная станция, токарный станок и тестер" },
  { n: "экспериментальный стенд", d: "стенд опытной серии: печь для сплавов, калибратор и тестер" }];
var GOOD_ROOMS = ["repair", "assembly", "armorlab", "ballistics", "parts", "storage"];
function roomType(o) {
  var fl = CUR().fl; if (!fl || !o) return "";
  var r = fl.room[o.y * LAB.W + o.x];
  return r >= 0 && fl.rooms[r] ? fl.rooms[r].type || "" : "";
}
/* Уровень и поломка — от этажа и места (в ремонтных боксах и сборочных
   цехах оснастка лучше); починка верстака хранится на этаже. */
function bench(o) {
  var fs = CUR().fs, g = G();
  if (!fs) return { tier: 1, dmg: false };
  if (!fs.bench) fs.bench = {};
  var k = o && o.id != null ? String(o.id) : "x";
  if (!fs.bench[k]) {
    var h = h32("bench:" + g.L + "-" + g.F + "-" + k), p = h % 100, L = g.L;
    var b = GOOD_ROOMS.indexOf(roomType(o)) >= 0 ? 15 : 0;
    var tier = L <= 2 ? (p < 55 - b ? 1 : 2) : L <= 5 ? (p < 25 - b ? 1 : p < 88 - b ? 2 : 3) : L <= 10 ? (p < 45 - b ? 2 : 3) : (p < 30 - b ? 2 : 3);
    fs.bench[k] = { tier: tier, dmg: tier > 1 && ((h >>> 9) % 100) < 22 };
  }
  return fs.bench[k];
}
function reserve() { return G().event === "dark"; }
function effTier(b) { return reserve() || b.dmg ? 1 : b.tier; }
function benchLine(b) {
  var t = TIER[b.tier], s = cap1(t.n) + ": " + t.d + ".";
  if (b.dmg) s += " Повреждён: станки не работают, только ручной инструмент. Починить можно здесь же.";
  else if (reserve() && b.tier > 1) s += " На резервном питании: станки стоят, работает только ручной инструмент.";
  else s += " Исправен.";
  return s;
}
/* Верстак, у которого стоит герой: проверки уровня — только у него. */
var cur = null;
function nearBench() {
  if (!cur || !CUR().fl || cur.key !== CUR().key) return null;
  var g = G();
  if (Math.max(Math.abs(cur.o.x - g.x), Math.abs(cur.o.y - g.y)) > 2) return null;
  return bench(cur.o);
}

/* ════════ ЧЕРТЕЖИ ════════ */
function bpList(cls) { return LAB.RECIPES.filter(function (rc) { return rc.bp && (!cls || clsOf(rc) === cls); }); }
function known(rc) { return !rc.bp || !!(G().bp && G().bp[rc.id]); }
function recipe(id) { return LAB.RECIPES.filter(function (rc) { return rc.id === id; })[0] || null; }
/* Выучить схему. how — откуда (для журнала и речи). Возвращает фразу или "". */
function learn(id, how, quiet) {
  var g = G(), rc = recipe(id);
  if (!rc || !rc.bp) return "";
  if (!g.bp) g.bp = {};
  if (g.bp[id]) return "";
  g.bp[id] = 1;
  var t = "Новая схема мастерской: «" + rc.n + "», " + CLS_N[clsOf(rc)] + "." + (how ? " " + how : "");
  if (gm().journal) gm().journal("Схема: «" + rc.n + "»" + (how ? " — " + how.replace(/[.]$/, "") : "") + ".");
  if (!quiet) { A("play", "term_ok"); LAB.say(t, { prio: "event", keep: true }); }
  return t;
}
/* Неизвестная схема класса не выше maxT; seed — чтобы один и тот же
   источник (выживший, документ) давал одно и то же. */
function unknownPick(maxT, seed, only) {
  var g = G(), pool = bpList().filter(function (rc) { return !known(rc) && CLS_T[clsOf(rc)] <= maxT && (!only || clsOf(rc) === only) && (!rc.minL || rc.minL <= Math.max(g.L + 2, 3)); });
  if (!pool.length) return null;
  var i = seed != null ? h32(String(seed)) % pool.length : Math.floor(Math.random() * pool.length);
  return pool[i];
}
/* Документ: технические журналы, сообщения о поломках, протоколы и
   исследовательские заметки иногда несут схему. */
var TECH_CATS = ["Технические журналы", "Сообщения о поломках", "Протоколы экспериментов", "Исследовательские заметки", "Служебные записки"];
function fromDoc(nid, cat) {
  if (TECH_CATS.indexOf(cat) < 0) return "";
  if (h32("bpdoc:" + nid) % 100 >= 35) return "";
  var rc = unknownPick(2, "bpdoc:" + nid, "spec");
  return rc ? learn(rc.id, "Схема была в документе.") : "";
}
/* Выживший-технарь: один раз рассказывает схему и даёт совет. */
var TIPS = [
  "Реле снимай с охранных роботов: у них в груди целая гирлянда. Нет роботов — перемотай из провода, у верстака.",
  "Сервоприводы — в суставах роботов и в ремонтных боксах. Без них ни перезарядки, ни тяжёлой турели.",
  "Камеру ОКО разбей — останется оптический сенсор. На прицел и на гранату помех годится.",
  "Оружие изнашивается: чини его на верстаке, пока не начались осечки. Ремнабор выручит в коридоре.",
  "Лучевое оружие греется. Стреляй короткими очередями, а радиатор продлит очередь.",
  "Экспериментальные компоненты попадаются у боссов, в сейфах глубоко внизу и в установках под Ядром. Не продавай их."
];
function isEng(n) { var p = n && (LAB.PROFS[n.prof] || {}); return p.beacon === "npc_eng" || /инженер|техник|монтажник|механик|электрик/i.test(n && n.prof || ""); }
function npcTip(n) {
  var g = G();
  if (!g.bpNpc) g.bpNpc = {};
  var tip = TIPS[h32("tip:" + n.key) % TIPS.length];
  if (!g.bpNpc[n.key]) {
    var rc = unknownPick(2, "npc:" + n.key, "spec");
    g.bpNpc[n.key] = 1;
    if (rc) { say(n.n + ": «" + tip + " А вот схема, пригодится: " + rc.n.toLowerCase() + "»."); learn(rc.id, "Рассказал выживший: " + n.n + ".", true); gm().later(function () { A("play", "term_ok"); sayq("Новая схема мастерской: «" + rc.n + "»."); }, 400); return true; }
  }
  say(n.n + ": «" + tip + "»");
  return false;
}
/* Установки глубин: исследование открывает схемы и даёт редкие компоненты. */
var DEPTH_BP = { grid: "w_suppressor", incub: "m_quiet", mirror: "m_acc", gate: "m_stab", node: null };
function depthFind(kind, key) {
  var g = G(), wd = g.world || (g.world = {}), sk = kind + ":" + (key || g.L + "-" + g.F);
  if (!wd.wsFind) wd.wsFind = {};
  if (wd.wsFind[sk]) return "";
  wd.wsFind[sk] = 1;
  var out = [], id = DEPTH_BP[kind];
  if (kind === "gate" || kind === "node") { g.inv.proto = (g.inv.proto || 0) + 1; out.push("В механизме уцелел экспериментальный компонент — он у вас."); }
  if (!id && kind === "node") { var rc = unknownPick(3, "node:" + sk); id = rc ? rc.id : null; }
  var t = id ? learn(id, "Её подсказало устройство глубины.", true) : "";
  if (t) out.push(t);
  if (out.length) { A("play", "term_ok"); LAB.say(out.join(" "), { prio: "event", keep: true }); }
  return out.join(" ");
}

/* ════════ ПРОВЕРКИ И ТЕКСТЫ РЕЦЕПТОВ ════════ */
function needText(rc) {
  var g = G(), s = [];
  for (var k in rc.need) {
    var have = g.inv[k] || 0, nm = LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k;
    s.push(nm + " " + have + " из " + rc.need[k] + (have < rc.need[k] ? " (" + srcOf(k) + ")" : ""));
  }
  return s.join(", ");
}
function missText(rc) {
  var g = G(), s = [];
  for (var k in rc.need) { var have = g.inv[k] || 0; if (have < rc.need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + have + " из " + rc.need[k]); }
  return s.join(", ");
}
function tierWhy(b, t) {
  if (b.tier >= t && b.dmg) return "Станки этого верстака разбиты: сейчас работает только ручной инструмент. Сначала почините верстак — пункт «Починить верстак».";
  if (b.tier >= t && reserve()) return "Аварийное освещение: верстак на резервном питании, станки стоят. Дождитесь света — или соберите что-то базовое.";
  return "Здесь не собрать: нужен " + TIER[t].n + (t === 3 ? " — стенды опытной серии стоят глубже, в лабораториях." : " — паяльная станция и тестер; они чаще в ремонтных боксах и сборочных цехах.");
}
/* Можно ли собрать сейчас: "" — да, иначе — почему (вслух). */
function check(rc, b) {
  var g = G();
  if (rc.minL && g.L < rc.minL) return "Это здесь не собрать: чертежей и оснастки на этой глубине нет.";
  if (rc.bp && !known(rc)) return "Схема неизвестна: «" + rc.n + "». Схемы открывают технические документы, разговоры с инженерами, разбор устройств и исследование на верстаке.";
  b = b || nearBench();
  if (b) { var t = CLS_T[clsOf(rc)] || 1; if (effTier(b) < t) return tierWhy(b, t); }
  for (var k in rc.need) if ((g.inv[k] || 0) < rc.need[k]) return "Не хватает: " + needText(rc) + ".";
  return "";
}
function outDesc(rc) {
  var o = String(rc.out);
  if (rc.desc) return rc.desc;
  if (o.indexOf("armor:") === 0) { var ad = LAB.ARMORS[o.slice(6)]; return ad ? ad.desc : ""; }
  if (o.indexOf("weapon:") === 0) { var wd = LAB.WEAPONS[o.slice(7)]; return wd ? wd.desc : ""; }
  if (o.indexOf("ammo:") === 0) { var am = LAB.AMMO[o.slice(5)]; return am ? am.desc : ""; }
  return LAB.ITEMS[o] && LAB.ITEMS[o].desc || "";
}

/* ════════ СОСТОЯНИЕ ОРУЖИЯ, ПЕРЕГРЕВ, МОДУЛИ В БОЮ ════════ */
var QK = [1.6, 1.25, 1, 0.85, 0.7, 0.55];
var HEAVY = { positron: 1, gauss: 1, plasma: 1, magnetron: 1 };
function cond(w) { return w && w.cond != null ? w.cond : 100; }
function md(w, k) { return (w && w.mod && w.mod[k]) || 0; }
function wcls(w) { return (LAB.WEAPONS[w.base] || {}).cls || ""; }
function melee(w) { return (w.rng0 != null ? w.rng0 : w.rng) <= 1; }
function battery(w) { return w.ammo && w.ammo !== "none"; }
function heats(w) { return battery(w) && w.ammo !== "slug" && !melee(w); }
function hmax(w) { return 12 + 6 * md(w, "cool"); }
function cooled(w, now) {
  if (!w.heat) return 0;
  var dt = Math.max(0, now - (w.heatT || now));
  w.heat = Math.max(0, w.heat - dt / 900);
  w.heatT = now;
  return w.heat;
}
/* Перед выстрелом: "hot" — ствол ещё остывает; "misfire" — осечка. */
function beforeShot(w, now) {
  if (!w) return null;
  if (w.hotUntil && now < w.hotUntil) { sayOnce("hot", "Ствол ещё горячий: подождите пару секунд.", 2500); A("play", "w_empty"); return "hot"; }
  if (heats(w)) cooled(w, now);
  var c = cond(w);
  if (c < 30) {
    var ch = (30 - c) / 30 * 0.18 * Math.pow(0.4, md(w, "stab"));
    if (Math.random() < ch) { sayOnce("misfire", "Осечка: оружие изношено. Почините его у верстака или ремнабором.", 5000); return "misfire"; }
  }
  return null;
}
/* После выстрела: нагрев и износ; вслух — когда пора остановиться или чинить. */
function afterShot(w, burst, now) {
  if (!w) return;
  now = now || Date.now();
  if (heats(w)) {
    cooled(w, now);
    w.heat = (w.heat || 0) + (HEAVY[wcls(w)] ? 1.4 : 1) * (burst ? 0.7 : 1);
    w.heatT = now;
    var mx = hmax(w);
    if (w.heat >= mx) {
      w.hotUntil = now + 2500; w.heat = mx * 0.6;
      A("play", "ev_steam", { gain: 0.55, rate: 1.35 });
      sayOnce("overheat", "Перегрев: оружие остывает две с половиной секунды." + (md(w, "cool") ? "" : " Радиатор продлит очередь."), 3000);
      if (LAB.combat && LAB.combat.stopFire) LAB.combat.stopFire();
    } else if (w.heat >= mx * 0.75) { A("play", "ev_steam", { gain: 0.25, rate: 1.5 }); sayOnce("warm", "Ствол горячий — дайте ему остыть.", 6000); }
  }
  var c0 = cond(w), wear = (melee(w) ? 0.12 : 0.22) * (QK[w.qual] || 1) * (HEAVY[wcls(w)] ? 1.3 : 1) * Math.pow(0.45, md(w, "stab"));
  w.cond = Math.max(0, Math.round((c0 - wear) * 100) / 100);
  [50, 25, 10].forEach(function (lv) {
    if (c0 >= lv && w.cond < lv) sayq(lv === 50 ? "Оружие изнашивается: состояние " + lv + " из 100. Почините его у верстака." : lv === 25 ? "Оружие сильно изношено: состояние " + lv + " из 100, начнутся осечки." : "Оружие на пределе: почти каждый пятый выстрел — осечка.");
  });
}
function accBonus(w, burst) { return 0.07 * md(w, "acc") + (md(w, "stab") ? 0.03 + (burst ? 0.1 : 0) : 0); }
function condK(w) { var c = cond(w); return c >= 50 ? 1 : 0.75 + 0.5 * c / 100; }
function dmgK(w, f) { return condK(w) * (f && f.kind === "mech" && md(w, "emp") ? 1 + 0.25 * md(w, "emp") : 1); }
function pierce(w) { return Math.min(0.9, ((LAB.WEAPONS[w.base] || {}).apierce || 0) + 0.35 * md(w, "pierce")); }
function reloadK(w) { return Math.max(0.4, 1 - 0.3 * md(w, "reload")); }
function gapK(w) { return 1 - 0.08 * md(w, "reload"); }
function loud(w, l) {
  if (wcls(w) === "kinetic") l = 7;
  var q = md(w, "quiet");
  return q ? Math.max(1, Math.round(l * (1 - 0.35 * q))) : l;
}

/* Слоты и установка */
function slots(w) { return 3 + ((w.rank || 0) >= 4 || (w.qual || 0) >= 5 ? 1 : 0); }
function used(w) { var m = w.mod || {}, n = 0; for (var k in m) n += m[k] || 0; return n; }
function base(w) {
  if (w.dmg0 != null) return;
  var m = w.mod || {};
  w.dmg0 = w.dmg / Math.pow(1.15, m.power || 0);
  w.rng0 = w.rng - (w.rng > 1 ? 2 * (m.range || 0) : 0);
  w.cap0 = w.cap || 0;
}
function recalc(w) {
  base(w);
  var m = w.mod || {};
  w.dmg = Math.max(1, Math.round(w.dmg0 * Math.pow(1.15, m.power || 0)));
  w.rng = w.rng0 + (w.rng0 > 1 ? 2 * (m.range || 0) : 0);
  if (w.cap0) { w.cap = w.cap0 + Math.ceil(w.cap0 * 0.3) * (m.cap || 0); if (w.charge > w.cap) w.charge = w.cap; }
  w.mods = used(w);
}
/* Почему модуль не встаёт: "" — встаёт. */
function compat(w, mk) {
  var b = LAB.WEAPONS[w.base] || {}, M = MODS[mk];
  if (!M) return "такого модуля нет";
  var n = md(w, mk);
  if (n >= M.max) return M.max === 1 ? M.n + " уже стоит" : M.n + " уже стоит, " + n + " из " + M.max;
  if (used(w) >= slots(w)) return "все гнёзда заняты, " + slots(w) + " из " + slots(w);
  switch (mk) {
    case "range": if (melee(w)) return "ближнему бою дальность не нужна"; break;
    case "acc": if (melee(w)) return "удар вплотную и так точен"; break;
    case "reload": case "cap": if (!battery(w)) return "у этого оружия нет батареи"; break;
    case "cool": if (!heats(w)) return "это оружие не греется"; break;
    case "quiet": if (b.cls === "positron") return "аннигиляцию не заглушить"; if (melee(w) && w.dt !== "shock") return "удар и так тихий"; break;
    case "pierce": if (b.noarmor) return "позитронному пучку броня и так не помеха"; break;
    case "emp": if (w.dt === "ion" || w.dt === "emp") return "этот поток и так выжигает электронику"; break;
  }
  return "";
}
function install(w, mk) {
  var why = compat(w, mk);
  if (why) return why;
  base(w);
  if (!w.mod) w.mod = {};
  w.mod[mk] = (w.mod[mk] || 0) + 1;
  recalc(w);
  return "";
}
function uninstall(w, mk) {
  if (!md(w, mk)) return false;
  base(w);
  w.mod[mk]--; if (!w.mod[mk]) delete w.mod[mk];
  recalc(w);
  var g = G(), it = MODS[mk].item;
  g.inv[it] = (g.inv[it] || 0) + 1;
  return true;
}
function modsLine(w) {
  var m = w.mod || {}, s = [];
  MOD_ORDER.forEach(function (k) { if (m[k]) s.push(MODS[k].n + (m[k] > 1 ? " ×" + m[k] : "")); });
  return s.length ? s.join(", ") : "";
}
/* Профиль оружия: чем оно отличается, кроме урона. */
function profile(w) {
  var b = LAB.WEAPONS[w.base] || {}, s = [];
  s.push(melee(w) ? "ближний бой" : "дальность " + w.rng + " " + gm().plural(w.rng, "шаг", "шага", "шагов"));
  var cd = (w.cd || b.cd || 500) * gapK(w) / 1000;
  s.push((melee(w) ? "удар" : "выстрел") + " раз в " + String(Math.round(cd * 10) / 10).replace(".", ",") + " " + (cd === 1 ? "секунду" : "секунды"));
  if (battery(w)) s.push(w.cap + " " + gm().plural(w.cap, "выстрел", "выстрела", "выстрелов") + " в заряде, питание: " + (LAB.AMMO[w.ammo] ? LAB.AMMO[w.ammo].n.toLowerCase() : w.ammo));
  else s.push("без батарей");
  if (b.noarmor) s.push("броня не помогает");
  else if (pierce(w) >= 0.5) s.push("пробивает броню");
  else if (w.dt === "kinetic") s.push("броня гасит удар заметно");
  var vs = (LAB.DMG_VS.mech || {})[w.dt];
  if (b.stunMech) s.push("останавливает роботов на несколько тактов");
  else if (vs >= 1.6) s.push("сильно против роботов и электроники");
  else if (vs != null && vs < 0.9) s.push("против роботов слабее");
  if (b.pierce) s.push("прошивает всех на линии");
  if (b.area) s.push("задевает соседей цели");
  if (b.freeze) s.push("замораживает");
  if (b.spread) s.push("задевает соседнюю линию");
  s.push(heats(w) ? "греется при долгой стрельбе" : "не греется");
  var l = loud(w, ({ melee: 2, laser: 6, cryo: 5, thermo: 6, gauss: 10, positron: 12, magnetron: 8 })[b.cls] || 8);
  s.push(l <= 3 ? "звучит тихо" : l <= 7 ? "звучит умеренно" : "звучит громко, слышно далеко");
  return s.join(", ") + ".";
}

/* ════════ РЕМОНТ ОРУЖИЯ ════════ */
function repairCost(w, cap) {
  var miss = Math.max(0, cap - cond(w)), need = {};
  if (miss <= 0) return null;
  need.scrap = Math.max(1, Math.ceil(miss / 30));
  if (battery(w)) { need.wire = 1; if (miss > 60 && w.ammo !== "slug") need.chip = 1; }
  if (wcls(w) === "kinetic") need.servo = miss > 60 ? 1 : 0;
  if (!need.servo) delete need.servo;
  return need;
}
function costText(need) { var s = []; for (var k in need) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + need[k]); return s.join(", "); }
function haveAll(need) { var g = G(); for (var k in need) if ((g.inv[k] || 0) < need[k]) return false; return true; }
function take(need) { var g = G(); for (var k in need) g.inv[k] -= need[k]; }
function repairCap(b) { return effTier(b) >= 2 ? 100 : 80; }
function repairWeapon(i, b) {
  var g = G(), w = g.weapons[i];
  if (!w) return false;
  b = b || nearBench() || { tier: 1, dmg: false };
  var capC = repairCap(b), need = repairCost(w, capC);
  if (!need) { say(cond(w) >= capC && capC < 100 ? "Базовый верстак больше не даст: " + cond(w) + " из 100. Дальше нужна паяльная станция." : "Оружие исправно."); return false; }
  if (!haveAll(need)) { LAB.UI.error(); say("Для ремонта не хватает: " + costLack(need) + "."); return false; }
  take(need);
  w.cond = capC; w.heat = 0; w.hotUntil = 0;
  seq([
    { t: "Ремонт, этап 1 из 3: разбираю кожух.", snd: "pry" },
    { t: "Этап 2 из 3: меняю изношенные контакты и пружины.", snd: "craft" },
    { t: "Этап 3 из 3: проверка. " + cap1(w.name) + ": состояние " + capC + " из 100." + (capC < 100 ? " Больше даст только паяльная станция." : ""), snd: "w_switch" }
  ]);
  return true;
}
function costLack(need) { var g = G(), s = []; for (var k in need) { var have = g.inv[k] || 0; if (have < need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + have + " из " + need[k] + " (" + srcOf(k) + ")"); } return s.join(", "); }
/* Ремнабор в поле: плюс 35, не выше 90. */
function fieldRepair() {
  var g = G(), w = gm().curWeapon();
  if (!(g.inv.wrepair > 0)) { say("Ремнаборов нет."); return false; }
  if (!w) { say("Оружия нет."); return false; }
  if (cond(w) >= 90) { say("Оружию в руках ремонт не нужен: состояние " + Math.round(cond(w)) + " из 100."); return false; }
  g.inv.wrepair--;
  w.cond = Math.min(90, cond(w) + 35);
  A("play", "pry"); gm().later(function () { A("play", "w_switch"); }, 700);
  say("Ремнабор: " + w.name + " — состояние " + Math.round(w.cond) + " из 100." + (w.cond >= 90 ? " Полный ремонт — у верстака." : ""));
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  return true;
}

/* ════════ РАЗБОР ════════ */
var SALV = {
  turret_kit: { scrap: 2, servo: 1, optic: 1 }, turret_kit2: { servo: 2, panel: 1, powercell: 1 }, jammer: { chip: 1, relay: 1, wire: 1 },
  noise: { scrap: 1, cap: 1 }, emp: { cap: 1, scrap: 1 }, decoder: { chip: 2, wire: 1 }, sonar: { cap: 1, lens: 1 },
  decoy_e: { relay: 1, cell: 1 }, disruptor: { optic: 1, cap: 1 }, lockpick: { scrap: 1 }, filter: { scrap: 1 }, repairkit: { scrap: 2 },
  wrepair: { scrap: 1, wire: 1 }, plate: { scrap: 2, panel: 1 }, okokey: { chip: 1, relay: 1 }
};
/* что понимаешь, разбирая: оружие и устройства раскрывают схемы */
var ANALYZE = {
  laser: "m_acc", gauss: "m_pierce", ion: "m_emp", pulse: "m_reload", heavy: "m_cool", plasma: "m_cool", thermo: "m_cool", cryo: "m_cool", spark: "m_cap",
  mpistol: "m_range", mrifle: "m_range", cutter: "m_quiet", vibro: "m_quiet", baton: "w_suppressor", mresonator: "m_stab", ppistol: "bat_p", pcannon: "bat_p",
  kpistol: "w_needle", needle: "m_pierce", suppressor: "m_emp",
  noise: "decoy_e", jammer: "disruptor", turret_kit: "turret_kit2", okokey: "m_emp", decoder: "m_acc", sonar: "m_range"
};
function analyzeHint(key, b) {
  var id = ANALYZE[key], rc = id && recipe(id);
  if (!rc || known(rc) || !b || effTier(b) < 2 || CLS_T[clsOf(rc)] > effTier(b)) return null;
  return rc;
}
function give(parts) { var g = G(), s = []; for (var k in parts) { var n = parts[k]; if (!n) continue; g.inv[k] = (g.inv[k] || 0) + n; s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + n); } return s.join(", "); }
/* Разобрать устройство или запасной модуль из инвентаря. */
function salvage(id, b) {
  var g = G(), d = LAB.ITEMS[id];
  if (!d || !(g.inv[id] > 0)) { say("Нет: " + (d ? d.n.toLowerCase() : id) + "."); return false; }
  b = b || nearBench();
  var parts = SALV[id];
  if (!parts && d.kind === "wmodule") { var rc = recipeOut(id); parts = {}; if (rc) for (var k in rc.need) if (rc.need[k] > 1 || k === "proto") parts[k] = Math.max(1, Math.floor(rc.need[k] / 2)); else if (Math.random() < 0.5) parts[k] = 1; }
  if (!parts) { say("Это не разобрать с пользой."); return false; }
  g.inv[id]--;
  var got = give(parts), hint = analyzeHint(id, b), t = "Разобрано: " + d.n.toLowerCase() + ". Получено: " + (got || "ничего ценного") + ".";
  A("play", "pry");
  if (hint) t += " " + learn(hint.id, "Поняли, разбирая устройство.", true);
  say(t);
  return true;
}
function recipeOut(out) { return LAB.RECIPES.filter(function (rc) { return rc.out === out; })[0] || null; }
/* Энергобатарея — на ячейку. */
function salvageBattery() {
  var g = G();
  if (!(g.ammo.energy > 0)) { say("Энергобатарей нет."); return false; }
  g.ammo.energy--; g.inv.cell = (g.inv.cell || 0) + 1; A("play", "pry");
  say("Батарея разобрана: аккумуляторная ячейка у вас. Энергобатарей осталось: " + g.ammo.energy + ".");
  return true;
}
/* Разбор оружия: модули — в запас, детали по классу; у верстака — схема. */
function onScrap(w) {
  var g = G(), out = [], m = w.mod || {}, k;
  for (k in m) if (m[k] && MODS[k]) { g.inv[MODS[k].item] = (g.inv[MODS[k].item] || 0) + m[k]; }
  if (used(w)) out.push("Модули сняты и лежат в запасе: " + modsLine(w) + ".");
  var b = LAB.WEAPONS[w.base] || {}, extra = {};
  if (battery(w) && w.ammo !== "slug") extra.cell = Math.random() < 0.5 + 0.1 * (w.rank || 0) ? 1 : 0;
  if (b.cls === "laser" || b.cls === "blaster") extra.lens = Math.random() < 0.3 ? 1 : 0;
  if (b.cls === "kinetic") extra.servo = Math.random() < 0.5 ? 1 : 0;
  if ((w.rank || 0) >= 4) extra.proto = 1;
  var got = give(extra);
  if (got) out.push("Ещё: " + got + ".");
  var hint = analyzeHint(w.base, nearBench());
  if (hint) out.push(learn(hint.id, "Поняли, разбирая оружие.", true));
  return out.join(" ");
}
/* Разбор редкого компонента на стенде — экспериментальная схема. */
function analyzeProto(b) {
  var g = G();
  b = b || nearBench();
  if (!b || effTier(b) < 3) { LAB.UI.error(); say(b ? tierWhy(b, 3) : "Разбирать опытные узлы можно только на экспериментальном стенде."); return false; }
  if (!(g.inv.proto > 0)) { say("Экспериментальных компонентов нет."); return false; }
  var rc = unknownPick(3, null, "exp");
  if (!rc) { say("Все экспериментальные схемы вам уже известны. Компонент лучше пустить в дело."); return false; }
  g.inv.proto--;
  seq([
    { t: "Разбор опытного узла, этап 1 из 3: вскрываю корпус под вытяжкой.", snd: "pry" },
    { t: "Этап 2 из 3: снимаю схему калибратором.", snd: "term_beep" },
    { t: "Этап 3 из 3: " + learn(rc.id, "Её раскрыл разбор экспериментального компонента.", true), snd: "term_ok" }
  ]);
  return true;
}

/* ════════ ИССЛЕДОВАНИЕ СХЕМ ════════ */
var RESEARCH = { spec: { chip: 2, relay: 1 }, exp: { chip: 2, proto: 1 } };
function research(cls, b) {
  var g = G();
  b = b || nearBench();
  var t = CLS_T[cls];
  if (!b || effTier(b) < t) { LAB.UI.error(); say(b ? tierWhy(b, t) : "Исследовать схемы можно только у верстака."); return false; }
  var rc = unknownPick(t, null, cls);
  if (!rc) { say(cls === "exp" ? "Неизвестных экспериментальных схем нет." : "Все специализированные схемы этой глубины вам известны."); return false; }
  var need = RESEARCH[cls];
  if (!haveAll(need)) { LAB.UI.error(); say("Для исследования не хватает: " + costLack(need) + "."); return false; }
  take(need);
  seq([
    { t: "Исследование, этап 1 из 3: разбираю образцы на плате.", snd: "pry" },
    { t: "Этап 2 из 3: прозваниваю цепи тестером.", snd: "term_beep" },
    { t: "Этап 3 из 3: " + learn(rc.id, "Её вы вывели сами, на верстаке.", true), snd: "term_ok" }
  ]);
  return true;
}

/* ════════ ПОЧИНКА ВЕРСТАКА ════════ */
function fixCost(b) { return b.tier >= 3 ? { scrap: 3, servo: 1, chip: 1 } : { scrap: 3, wire: 1, relay: 1 }; }
function fixBench(b) {
  b = b || nearBench();
  if (!b || !b.dmg) { say("Верстак исправен."); return false; }
  var need = fixCost(b);
  if (!haveAll(need)) { LAB.UI.error(); say("Для починки не хватает: " + costLack(need) + "."); return false; }
  take(need); b.dmg = false;
  seq([
    { t: "Починка верстака, этап 1 из 3: меняю перегоревший предохранитель.", snd: "pry" },
    { t: "Этап 2 из 3: перематываю обмотку станка.", snd: "craft" },
    { t: "Этап 3 из 3: пробный пуск — " + TIER[b.tier].n + " работает.", snd: "power_on" }
  ]);
  return true;
}

/* ════════ ПОСЛЕДОВАТЕЛЬНОСТЬ ЭТАПОВ (вслух, со звуками) ════════ */
function seq(lines, done) {
  lines.forEach(function (ln, i) {
    var run = function () { if (ln.snd) A("play", ln.snd); LAB.say(ln.t, { interrupt: i === 0 }); if (i === lines.length - 1 && done) done(); };
    if (i === 0) run(); else gm().later(run, i * 1300);
  });
}
/* После сборки: опытные изделия — по этапам; модуль — сразу предложить, куда поставить. */
function afterCraft(rc, msg) {
  var it = LAB.ITEMS[String(rc.out)];
  if (it && it.kind === "wmodule") { pickWeapon(it.mod, msg + " Шаг 2 из 2: выберите оружие для установки или оставьте модуль в запасе."); return; }
  if (clsOf(rc) === "exp") {
    seq([
      { t: "Опытная сборка, этап 1 из 3: корпус и крепёж.", snd: "pry" },
      { t: "Этап 2 из 3: пайка узлов и калибровка.", snd: "craft" },
      { t: "Этап 3 из 3: проверка на стенде. " + msg, snd: "craft_armor" }
    ]);
    return;
  }
  say(msg);
}

/* ════════ ПРИМАНКИ И ПОМЕХИ ════════ */
function behOf(f) { return f.beh || (f.base && f.base.beh) || []; }
function landing() {
  var g = G(), v = LAB.DIRS[g.face] || LAB.DIRS.N, x = g.x, y = g.y, fl = CUR().fl, fs = CUR().fs;
  for (var i = 1; i <= 6; i++) {
    var nx = x + v[0], ny = y + v[1];
    if (!LAB.inb(nx, ny)) break;
    var t = fl.t[ny * LAB.W + nx];
    if (t === LAB.T.WALL || (t === LAB.T.DOOR && fs.doors[fl.doorAt[ny * LAB.W + nx].id] !== 2)) break;
    x = nx; y = ny;
  }
  return { x: x, y: y };
}
function decoyAt(x, y) {
  var n = 0, C = LAB.combat;
  C.foes().forEach(function (f) {
    if (f.dead || f.ally || f.calm || f.kind !== "mech" || behOf(f).indexOf("stationary") >= 0) return;
    if (Math.abs(f.x - x) + Math.abs(f.y - y) > 16) return;
    f.state = "alert"; f.lastKnown = { x: x, y: y }; f.lost = 0; f.lure = 20; n++;
  });
  if (LAB.oko) LAB.oko.report("robot", x, y, "suspect", "сигнал носителя у электронной приманки");
  return n;
}
function blindAt(x, y) {
  var cams = 0, bots = 0, C = LAB.combat;
  C.foes().forEach(function (f) {
    if (f.dead || f.ally || f.kind !== "mech") return;
    var d = Math.max(Math.abs(f.x - x), Math.abs(f.y - y)), cam = behOf(f).indexOf("camera") >= 0;
    if (cam && d <= 8) { f.blindT = 40; cams++; }
    else if (!cam && d <= 5) { f.blindT = 16; if (f.state === "hunt") { f.state = "alert"; f.lost = 0; } bots++; }
  });
  return { cams: cams, bots: bots };
}
function throwDevice(id) {
  var g = G(), d = LAB.ITEMS[id];
  if (!d || !(g.inv[id] > 0)) { say("Нет: " + (d ? d.n.toLowerCase() : id) + "."); return false; }
  g.inv[id]--;
  var p = landing(), dir = LAB.DIRTO ? LAB.DIRTO[g.face] : "";
  A("grenade", p.x, p.y);
  gm().later(function () {
    if (d.fx.decoy) {
      A("mineBeep", p.x, p.y); A("noiseLure", p.x, p.y);
      var n = decoyAt(p.x, p.y);
      say("Электронная приманка " + dir + " передаёт ваш сигнал." + (n ? " Машин пошло к ней: " + n + "." : " Машин рядом нет — ОКО всё равно отметит там подозрение."));
    } else if (d.fx.blind) {
      A("explosion", p.x, p.y, "emp");
      var r = blindAt(p.x, p.y);
      say("Сенсорная помеха " + dir + "." + (r.cams ? " Камер ослеплено: " + r.cams + "." : "") + (r.bots ? " Роботов потеряло вас из виду: " + r.bots + "." : "") + (!r.cams && !r.bots ? " Рядом с местом падения машин не было." : ""));
    }
    if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  }, 600);
  return true;
}

/* ════════ ДОБЫЧА С МАШИН ════════ */
function drops(f, list, r, dk) {
  if (!f || f.kind !== "mech" || f.spawned) return;
  var L = G().L, beh = behOf(f);
  var avail = ["relay", "cell", "servo", "optic"].filter(function (k) { return (LAB.PART_DEPTH[k] || 1) <= L; });
  if (beh.indexOf("camera") >= 0) { if (r() < 0.55 * dk && L >= 2) list.push({ kind: "item", item: "optic", n: 1 }); return; }
  if (beh.indexOf("turret") >= 0) { if (r() < 0.35 * dk && L >= 3) list.push({ kind: "item", item: "panel", n: 1 }); if (r() < 0.25 * dk && L >= 2) list.push({ kind: "item", item: "servo", n: 1 }); return; }
  if (avail.length && r() < 0.35 * dk) list.push({ kind: "item", item: avail[Math.floor(r() * avail.length)], n: 1 });
  if ((f.arm || 0) >= 8 && L >= 4 && r() < 0.22 * dk) list.push({ kind: "item", item: "powercell", n: 1 });
  if (f.boss) list.push({ kind: "item", item: "proto", n: 1 });
  if (L >= 2 && r() < 0.08 * dk) list.push({ kind: "ammo", ammo: "slug", n: 1 });
}

/* ════════ ОКНА МАСТЕРСКОЙ ════════ */
var GROUPS = ["Лечение и стимуляторы", "Батареи и боеприпасы", "Гранаты и устройства", "Оружие", "Броня", "Улучшения", "Модули оружия", "Восстановление деталей"];
function groupOf(rc) {
  var o = String(rc.out), d = LAB.ITEMS[o];
  if (rc.group === "restore") return "Восстановление деталей";
  if (d && d.kind === "wmodule") return "Модули оружия";
  if (o.indexOf("armor:") === 0) return "Броня";
  if (o.indexOf("weapon:") === 0) return "Оружие";
  if (o.indexOf("ammo:") === 0) return "Батареи и боеприпасы";
  if (o === "plate" || o === "repairkit" || o === "wrepair") return "Улучшения";
  if (d && (d.heal || (d.fx && (d.fx.heal || d.fx.en || d.fx.cure)) || d.en || d.cure || d.detox || d.neuro || d.stopBleed)) return "Лечение и стимуляторы";
  return "Гранаты и устройства";
}
function avail() { var g = G(); return LAB.RECIPES.filter(function (rc) { return !rc.minL || rc.minL <= g.L; }); }
function partsTotal() { var g = G(); return LAB.PARTS.reduce(function (a, k) { return a + (g.inv[k] || 0); }, 0); }
function spareMods() { var g = G(); return MOD_ORDER.filter(function (k) { return (g.inv[MODS[k].item] || 0) > 0; }); }
function back() { return { label: "Назад", fn: function () { open(); } }; }
function open(o) {
  var g = G();
  if (o) cur = { o: o, key: CUR().key };
  if (!cur) { say("Мастерская — у верстака."); return; }
  var b = bench(cur.o), et = effTier(b);
  var list = avail(), kn = list.filter(known), unk = list.length - kn.length;
  var items = GROUPS.map(function (nm) {
    var gl = kn.filter(function (rc) { return groupOf(rc) === nm; }), gu = list.filter(function (rc) { return !known(rc) && groupOf(rc) === nm; }).length;
    if (!gl.length && !gu) return null;
    var ready = gl.filter(function (rc) { return !check(rc, b); }).length;
    return { label: nm + ": можно собрать " + ready + " из " + gl.length + (gu ? ", неизвестных схем " + gu : ""), fn: function () { groupMenu(nm); } };
  }).filter(Boolean);
  if (spareMods().length) items.push({ label: "Установить модуль в оружие: в запасе " + spareMods().reduce(function (a, k) { return a + g.inv[MODS[k].item]; }, 0), fn: pickModule });
  if (g.weapons.some(function (w) { return used(w) > 0; })) items.push({ label: "Снять модуль с оружия", fn: unModMenu });
  items.push({ label: "Ремонт оружия" + (g.weapons.some(function (w) { return cond(w) < 100; }) ? ": есть изношенное" : ""), fn: repairMenu });
  items.push({ label: "Разбор предметов на детали", fn: salvMenu });
  items.push({ label: "Исследование схем" + (et < 2 ? ": нужны станки" : ""), fn: researchMenu });
  if (b.dmg) items.push({ label: "Починить верстак: " + costText(fixCost(b)), fn: function () { if (fixBench(b)) open(); } });
  items.push({ label: "Детали: где найти и для чего", fn: function () { partsGuide(open); } });
  items.push({ label: "Уйти от верстака", fn: function () { A("play", "craft_off"); } });
  A("play", "workbench");
  menu("Мастерская", items, { intro: benchLine(b) + " Деталей у вас: " + partsTotal() + ". Рецептов: " + kn.length + (unk ? ", неизвестных схем: " + unk : "") + "." });
}
function recLabel(rc, b) {
  var why = check(rc, b), g = G();
  var st = !why ? "можно собрать" : rc.minL && g.L < rc.minL ? "с уровня " + rc.minL : /^Не хватает/.test(why) ? "нужно: " + missText(rc) : CLS_T[clsOf(rc)] > effTier(b) ? (b.dmg || reserve() ? "станки не работают" : "нужен " + TIER[CLS_T[clsOf(rc)]].n) : "нельзя";
  var ds = outDesc(rc);
  return rc.n + " — " + st + ". " + cap1(CLS_N[clsOf(rc)]) + "." + (ds ? " " + ds : "");
}
function groupItems(nm) {
  var b = bench(cur.o), list = avail().filter(function (rc) { return known(rc) && groupOf(rc) === nm; });
  var unk = avail().filter(function (rc) { return !known(rc) && groupOf(rc) === nm; }).length;
  var items = list.map(function (rc) { return { label: recLabel(rc, b), keep: true, fn: function () { gm().craft(rc); } }; });
  if (unk) items.push({ label: "Неизвестных схем в разделе: " + unk + ". Их открывают технические документы, разговоры с инженерами, разбор устройств, исследование на верстаке и установки глубин.", info: true, keep: true, fn: function () {} });
  items.push(back());
  return items;
}
function groupMenu(nm) { menu(nm, groupItems(nm), { keep: true, rebuild: function () { return groupItems(nm); } }); }
function pickModule() {
  var g = G(), list = spareMods();
  if (!list.length) { say("Модулей в запасе нет. Их собирают здесь же, раздел «Модули оружия»."); return; }
  menu("Установка модуля, шаг 1 из 2: модуль", list.map(function (k) {
    return { label: cap1(MODS[k].n) + ": " + g.inv[MODS[k].item] + ". " + MODS[k].desc, fn: function () { pickWeapon(k); } };
  }).concat([back()]));
}
function pickWeapon(mk, intro) {
  var g = G(), M = MODS[mk];
  var items = g.weapons.map(function (w, i) {
    var why = compat(w, mk);
    return { label: gm().weaponLine(w) + (i === g.wi ? ", в руках" : "") + (why ? " — нельзя: " + why : " — можно, свободных гнёзд " + (slots(w) - used(w)) + " из " + slots(w)),
      disabled: !!why, why: why ? "Нельзя: " + why + "." : "",
      fn: function () {
        if (!(g.inv[M.item] > 0)) { say("Модуля в запасе нет."); return; }
        var r = install(w, mk);
        if (r) { LAB.UI.error(); say("Нельзя: " + r + "."); return; }
        g.inv[M.item]--;
        A("play", "craft");
        say("Шаг 2 из 2 выполнен: " + M.n + " — на оружии «" + w.name + "». Свободных гнёзд: " + (slots(w) - used(w)) + " из " + slots(w) + ". " + M.desc);
        if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
        if (nearBench()) open();
      } };
  });
  items.push({ label: "Оставить модуль в запасе", fn: function () { say(cap1(M.n) + " — в запасе. Установить — у верстака, пункт «Установить модуль в оружие»."); if (nearBench()) open(); } });
  menu("Установка модуля, шаг 2 из 2: оружие", items, { intro: intro || cap1(M.n) + "." });
}
function unModMenu() {
  var g = G();
  var items = g.weapons.map(function (w) {
    if (!used(w)) return null;
    return { label: w.name + ": " + modsLine(w), fn: function () {
      var mi = MOD_ORDER.filter(function (k) { return md(w, k); }).map(function (k) {
        return { label: "Снять: " + MODS[k].n, fn: function () { uninstall(w, k); A("play", "pry"); say(cap1(MODS[k].n) + " снят и лежит в запасе."); open(); } };
      });
      menu("Снять модуль: " + w.name, mi.concat([back()]));
    } };
  }).filter(Boolean);
  menu("Снять модуль с оружия", items.concat([back()]));
}
function repairItems(b) {
  var g = G(), capC = repairCap(b);
  return g.weapons.map(function (w, i) {
    var need = repairCost(w, capC), c = Math.round(cond(w));
    return { label: w.name + ": состояние " + c + " из 100" + (need ? ". Ремонт до " + capC + ": " + costText(need) + (haveAll(need) ? "" : " — не хватает") : capC < 100 && c < 100 ? ". Больше даст только паяльная станция" : ". Исправно"),
      keep: true, fn: function () { repairWeapon(i, b); } };
  }).concat([back()]);
}
function repairMenu() {
  var b = bench(cur.o);
  menu("Ремонт оружия", repairItems(b), { keep: true, intro: effTier(b) >= 2 ? "Станки чинят до 100." : "Ручной инструмент чинит до 80.", rebuild: function () { return repairItems(b); } });
}
function salvItems() {
  var g = G(), b = bench(cur.o), items = [];
  Object.keys(SALV).concat(MOD_ORDER.map(function (k) { return MODS[k].item; })).forEach(function (id) {
    if (!(g.inv[id] > 0) || !LAB.ITEMS[id]) return;
    var parts = SALV[id], hint = analyzeHint(id, b);
    items.push({ label: "Разобрать: " + LAB.ITEMS[id].n.toLowerCase() + " (" + g.inv[id] + ")" + (parts ? " — даст " + costText(parts) : " — вернёт часть деталей") + (hint ? "; разбор раскроет схему «" + hint.n + "»" : ""), keep: true, fn: function () { salvage(id, b); } });
  });
  if (g.ammo.energy > 0) items.push({ label: "Разобрать энергобатарею (" + g.ammo.energy + ") — даст аккумуляторную ячейку", keep: true, fn: salvageBattery });
  g.weapons.forEach(function (w, i) {
    if (w.id === "w_start_crowbar" || g.weapons.length <= 1) return;
    var hint = analyzeHint(w.base, b);
    items.push({ label: "Разобрать оружие: " + w.name + (used(w) ? "; модули вернутся в запас" : "") + (hint ? "; разбор раскроет схему «" + hint.n + "»" : ""), keep: true, fn: function () { gm().scrapWeapon(g.weapons.indexOf(w)); } });
  });
  if (g.inv.proto > 0) items.push({ label: "Разобрать экспериментальный компонент (" + g.inv.proto + ")" + (effTier(b) >= 3 ? " — раскроет экспериментальную схему" : " — только на экспериментальном стенде"), keep: true, fn: function () { analyzeProto(b); } });
  if (!items.length) items.push({ label: "Разбирать нечего: устройств, запасных модулей и лишнего оружия нет.", info: true, keep: true, fn: function () {} });
  items.push(back());
  return items;
}
function salvMenu() { menu("Разбор предметов", salvItems(), { keep: true, rebuild: salvItems }); }
function researchMenu() {
  var b = bench(cur.o), et = effTier(b), g = G();
  var us = bpList("spec").filter(function (rc) { return !known(rc); }).length, ue = bpList("exp").filter(function (rc) { return !known(rc); }).length;
  var items = [
    { label: "Специализированная схема: " + costText(RESEARCH.spec) + ". Неизвестных: " + us + (et < 2 ? ". Нужны станки" : ""), keep: true, fn: function () { research("spec", b); } },
    { label: "Экспериментальная схема: " + costText(RESEARCH.exp) + ". Неизвестных: " + ue + (et < 3 ? ". Нужен экспериментальный стенд" : ""), keep: true, fn: function () { research("exp", b); } },
    back()
  ];
  menu("Исследование схем", items, { intro: "Известно схем: " + bpList().filter(known).length + " из " + bpList().length + ". Новые схемы дают и документы, и инженеры, и разбор устройств, и установки глубин." });
}
/* Справочник деталей: сколько есть, где взять, для каких схем. */
function uses(k) {
  var kn = [], unk = 0;
  LAB.RECIPES.forEach(function (rc) { if (!rc.need || !rc.need[k]) return; if (known(rc)) kn.push(rc.n.toLowerCase()); else unk++; });
  return { kn: kn, unk: unk };
}
function partLine(k) {
  var g = G(), d = LAB.ITEMS[k], u = uses(k);
  return d.n + ": у вас " + (g.inv[k] || 0) + ". " + (u.kn.length ? "Нужна для: " + u.kn.slice(0, 6).join(", ") + (u.kn.length > 6 ? " и ещё " + (u.kn.length - 6) : "") + (u.unk ? "; и для неизвестных пока схем: " + u.unk : "") + "." : u.unk ? "Нужна для схем, которые вы ещё не знаете: " + u.unk + "." : "Продаётся торговцам.") + " Где найти: " + srcOf(k) + ".";
}
function partsGuide(backFn) {
  var g = G();
  var list = LAB.PARTS.filter(function (k) { return LAB.ITEMS[k] && ((g.inv[k] || 0) > 0 || (LAB.PART_DEPTH[k] || 1) <= g.L); });
  menu("Детали: где найти и для чего", list.map(function (k) { return { label: partLine(k), keep: true, fn: function () { say(partLine(k)); } }; }).concat([{ label: "Назад", fn: function () { (backFn || open)(); } }]));
}

LAB.workshop = {
  open: open, bench: bench, effTier: effTier, benchLine: benchLine, check: check, clsOf: clsOf, known: known, learn: learn, unknownPick: unknownPick,
  fromDoc: fromDoc, npcTip: npcTip, isEng: isEng, depthFind: depthFind, needText: needText, afterCraft: afterCraft,
  beforeShot: beforeShot, afterShot: afterShot, accBonus: accBonus, dmgK: dmgK, pierce: pierce, reloadK: reloadK, gapK: gapK, loud: loud,
  cond: cond, compat: compat, install: install, uninstall: uninstall, slots: slots, used: used, modsLine: modsLine, profile: profile,
  repairWeapon: repairWeapon, repairCost: repairCost, fieldRepair: fieldRepair, salvage: salvage, salvageBattery: salvageBattery, onScrap: onScrap,
  analyzeProto: analyzeProto, research: research, fixBench: fixBench, throwDevice: throwDevice, drops: drops, partLine: partLine, partsGuide: partsGuide,
  srcOf: srcOf, uses: uses, heats: heats, hmax: hmax, MODS: MODS, MOD_ORDER: MOD_ORDER, TIER: TIER,
  _at: function (o) { cur = o ? { o: o, key: CUR().key } : null; }
};
})();
