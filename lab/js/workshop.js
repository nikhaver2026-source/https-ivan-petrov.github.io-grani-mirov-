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
   бронебойность, подавление электроники, глушитель, стабилизатор),
   ёмкость у верстака до предела вида, износ и ремонт, перегрев ствола. У каждой детали —
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
if (LAB.armsLate) LAB.armsLate(); /* (3.5) рецепты arms.js, ждавшие этих деталей */
function srcOf(k) { var s0 = LAB.ITEMS[k] && LAB.ITEMS[k].src; if (LAB.ARSENAL17 && LAB.ARSENAL17.srcText[s0]) return LAB.ARSENAL17.srcText[s0]; return SRC[k] || s0 || (LAB.ITEMS[k] && LAB.ITEMS[k].kind === "part" ? "попадается на своей глубине: ящики, склады, обломки машин" : "собирают в мастерской или покупают"); }

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
  wrepair:     { n: "Ремонтный набор оружия", icon: "🔧", kind: "use", desc: "Пружины, контакты и шомпол: чинит оружие прямо в коридоре — плюс тридцать пять к состоянию, не выше девяноста, и остужает ствол.", price: 45 },
  /* (2.0) походные ремкомплекты (repair.js): общий — на три ремонта, инженерный — до полной исправности */
  fieldkit:    { n: "Походный ремнабор", icon: "🪛", kind: "use", depth: 1, desc: "Отвёртки, плоскогубцы, изолента и горсть крепежа в брезентовом свёртке. Три ремонта на свёрток: оружие или броня — плюс двадцать к состоянию, не выше восьмидесяти; оживит и сломанный автомат.", price: 55 },
  engkit:      { n: "Инженерный ремкомплект", icon: "💼", kind: "use", depth: 2, desc: "Кейс инженера: мультиметр, паяльник на батарее, ключи и запас контактов. Три ремонта на кейс: оружие или броня — плюс пятьдесят, до полной исправности; чинит повреждённый верстак и сломанный автомат. Начатый кейс пополняют у верстака.", price: 190 },
  decoy_e:     { n: "Электронная приманка", icon: "📶", kind: "throw", desc: "Маячок передаёт роботам ваш сигнал: машины ОКО идут к нему, а ОКО отмечает там подозрение. Живых не обманывает.", price: 55, fx: { decoy: 1 } },
  disruptor:   { n: "Сенсорная помеха", icon: "🌫️", kind: "throw", desc: "Граната помех: камеры рядом с местом падения слепнут на двадцать секунд, роботы вблизи на время теряют вас из виду.", price: 70, fx: { blind: 1 } },
  turret_kit2: { n: "Тяжёлая переносная турель", icon: "🔫", kind: "deploy", desc: "Турель на сервоприводах с бронепанелью: шестьдесят выстрелов, бьёт в полтора раза сильнее обычной.", price: 220, fx: { deploy: 60, dmgK: 1.5 } }
};
var ik;
for (ik in I_NEW) LAB.ITEMS[ik] = I_NEW[ik];

/* ════════ МОДУЛИ ОРУЖИЯ ════════ */
var MODS = {
  power:  { item: "m_power", n: "модуль мощности", max: 3, price: 60, desc: "Плюс пятнадцать процентов к урону." },
  acc:    { item: "m_acc", n: "модуль точности", max: 2, price: 55, desc: "Оптический прицел: плюс семь процентов к точности за каждый модуль." },
  range:  { item: "m_range", n: "удлинитель ствола", max: 2, price: 50, desc: "Плюс два шага дальности." },
  reload: { item: "m_reload", n: "модуль быстрой перезарядки", max: 2, price: 50, desc: "Перезарядка на треть быстрее, выстрелы чуть чаще." },
  cool:   { item: "m_cool", n: "радиатор", max: 2, price: 45, desc: "Ствол греется медленнее: больше выстрелов подряд без перегрева." },
  pierce: { item: "m_pierce", n: "бронебойный модуль", max: 2, price: 60, desc: "Пробивает броню: каждый модуль — плюс треть пробития (до девяти десятых)." },
  emp:    { item: "m_emp", n: "модуль подавления электроники", max: 2, price: 60, desc: "Плюс четверть урона по роботам, турелям и камерам." },
  quiet:  { item: "m_quiet", n: "глушитель", max: 2, price: 50, desc: "Выстрел тише на треть за каждый модуль: враги слышат его только вблизи." },
  stab:   { item: "m_stab", n: "стабилизатор", max: 1, price: 120, desc: "Износ вдвое меньше, осечек в два с половиной раза меньше, точность плюс три процента, очередь — плюс тринадцать." }
};
var MOD_ORDER = ["power", "acc", "range", "reload", "cool", "pierce", "emp", "quiet", "stab"];
/* (3.7, просьба игрока) Ёмкость оружия поднимает только верстак — расточкой
   отсека, удлинённым магазином или баллоном побольше, ступень за ступенью и до
   предела, своего у каждого вида (world.js, capPlan). Ступень требует оснастки
   не ниже себя: базовый верстак — первую, специализированный — вторую,
   экспериментальный стенд — третью, станок с программным управлением —
   четвёртую. Прежде отсек растачивали на пять ступеней у любого оружия, а
   модуль ёмкости, ёмкая и сверхъёмкая энергобатареи прибавляли сверх того —
   «Искра» доходила до сотни с лишним выстрелов. */
var BAY_COST = [null, { cell: 1, wire: 1, scrap: 1 }, { cell: 2, cap: 1, wire: 1 }, { cell: 2, chip: 1, magnet: 1 }, { powercell: 1, cell: 2, chip: 1 }, { supercond: 1, powercell: 1, chip: 1 }];
var MAG_COST = [null, { scrap: 2, wire: 1 }, { scrap: 3, magnet: 1 }, { scrap: 3, servo: 1, magnet: 1 }];
MOD_ORDER.forEach(function (k) { var m = MODS[k]; LAB.ITEMS[m.item] = { n: cap1(m.n), icon: "🔩", kind: "wmodule", mod: k, desc: m.desc + " Ставится у верстака: пункт «Установить модуль».", price: m.price }; });
/* (3.7) Прежние батареи и модуль ёмкости в оружие больше не встают: с оружия
   прежней записи их снимают (fixUpg), и они лежат в рюкзаке — продать или
   разобрать у верстака на детали. Не продаются и не собираются (src: find). */
var GONE_MODS = {
  cap: { item: "m_cap", n: "Модуль ёмкости", price: 55, parts: { cell: 2, wire: 1 },
    desc: "Плата добавочных ячеек от старых образцов оружия. В оружие не встаёт: отсек рассчитан на свою батарею, а ёмкость поднимает только верстак — расточкой отсека или удлинённым магазином. Её разбирают у верстака на ячейки и провод или продают." },
  bigcell: { item: "m_bigcell", n: "Ёмкая энергобатарея", price: 70, parts: { cell: 2, cap: 2, wire: 1 },
    desc: "Аккумулятор на полторы обычных батареи. В оружие не встаёт: отсек рассчитан на свою батарею, а ёмкость поднимает только верстак — расточкой отсека. Её разбирают у верстака на ячейки и конденсаторы или продают." },
  hugecell: { item: "m_hugecell", n: "Сверхъёмкая энергобатарея", price: 160, parts: { cell: 3, supercond: 1, cap: 2, chip: 1 },
    desc: "Накопитель на сверхпроводнике. В оружие не встаёт: отсек под него не рассчитан, а ёмкость поднимает только верстак — расточкой отсека. Его разбирают у верстака на детали — сверхпроводник в нём дорогой — или продают." }
};
for (var gmk in GONE_MODS) { var gm0 = GONE_MODS[gmk]; LAB.ITEMS[gm0.item] = { n: gm0.n, icon: "🔋", kind: "wmodule", gone: true, src: "find", desc: gm0.desc, price: gm0.price }; }

/* ════════ РЕЦЕПТЫ ════════ */
var R_NEW = [
  { id: "bat_s", out: "ammo:slug", n: "Обойма стальных пуль", need: { scrap: 2 }, cls: "base" },
  { id: "wrepair", out: "wrepair", n: "Ремонтный набор оружия", need: { scrap: 2, wire: 1 }, cls: "base" },
  { id: "fieldkit", out: "fieldkit", n: "Походный ремнабор", need: { scrap: 2, wire: 1, tape: 1 }, cls: "base" },
  { id: "engkit", out: "engkit", n: "Инженерный ремкомплект", need: { servo: 1, chip: 1, relay: 1, scrap: 2, wire: 1 }, cls: "spec", minL: 2 },
  { id: "r_relay", out: "relay", n: "Перемотать реле", need: { scrap: 1, wire: 2 }, cls: "base", group: "restore", desc: "Из обрезков металла и провода — рабочее реле." },
  { id: "r_cell", out: "cell", n: "Собрать аккумуляторную ячейку", need: { cap: 2, wire: 1 }, cls: "base", group: "restore", desc: "Два конденсатора в одной обмотке — ячейка." },
  { id: "r_servo", out: "servo", n: "Восстановить сервопривод", need: { scrap: 2, magnet: 1, wire: 1 }, cls: "base", group: "restore", minL: 2, desc: "Перемотать моторчик и собрать редуктор." },
  { id: "r_optic", out: "optic", n: "Собрать оптический сенсор", need: { lens: 1, chip: 1 }, cls: "spec", group: "restore", minL: 2, desc: "Линза и микросхема — глаз для прицела и помехи." },
  { id: "r_panel", out: "panel", n: "Выправить защитную панель", need: { scrap: 3, ceramic: 1 }, cls: "spec", group: "restore", minL: 3, desc: "Лист металла под прессом и слой керамики." },
  { id: "m_acc", out: "m_acc", n: "Модуль точности", need: { optic: 1, chip: 1, wire: 1 }, cls: "spec", bp: true },
  { id: "m_range", out: "m_range", n: "Удлинитель ствола", need: { lens: 1, magnet: 1, scrap: 2 }, cls: "spec", bp: true, minL: 2 },
  { id: "m_reload", out: "m_reload", n: "Модуль быстрой перезарядки", need: { servo: 1, cap: 1, wire: 1 }, cls: "spec", bp: true, minL: 2 },
  { id: "m_cool", out: "m_cool", n: "Радиатор", need: { scrap: 2, wire: 1, ceramic: 1 }, cls: "spec", bp: true, minL: 3 },
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
  { id: "bat_p", out: "ammo:positron", n: "Позитронная ловушка", need: { supercond: 1, proto: 1, cell: 2 }, cls: "exp", bp: true, minL: 7, desc: "Магнитная ловушка с антивеществом — заряд позитронного оружия." },
  /* (2.0) станок с программным управлением печатает детали, молекулярный синтезатор синтезирует редкие */
  { id: "c_chip", out: "chip", n: "Отпечатать микросхему", need: { wire: 2, scrap: 1, cap: 1 }, cls: "cnc", group: "restore", minL: 11, desc: "Принтер станка наносит дорожки на плату: годная микросхема из провода и обрезков." },
  { id: "c_lens", out: "lens", n: "Отшлифовать линзу", need: { ceramic: 1, reagent: 1 }, cls: "cnc", group: "restore", minL: 11, desc: "Фрезер с программой шлифует стеклокерамику в линзу." },
  { id: "c_magnet", out: "magnet", n: "Намагнитить сердечник", need: { scrap: 2, wire: 2, cell: 1 }, cls: "cnc", group: "restore", minL: 11, desc: "Обмотка и разряд ячейки — постоянный магнит из куска стали." },
  { id: "s_supercond", out: "supercond", n: "Синтез сверхпроводника", need: { magnet: 2, ceramic: 1, chip: 1 }, cls: "syn", group: "restore", minL: 26, desc: "Синтезатор выкладывает ленту сверхпроводника слой за слоем." },
  { id: "s_powercell", out: "powercell", n: "Синтез силового модуля", need: { cell: 3, supercond: 1, wire: 1 }, cls: "syn", group: "restore", minL: 26, desc: "Ячейки в одной оболочке на сверхпроводящей шине — силовой модуль тяжёлого робота." },
  { id: "s_proto", out: "proto", n: "Синтез экспериментального компонента", need: { supercond: 2, powercell: 1, chip: 2, optic: 1 }, cls: "syn", group: "restore", minL: 40, desc: "Узел опытной серии «Ковчега» — повторённый синтезатором по чертежу из его же памяти." }
];
R_NEW.forEach(function (rc) { if (!LAB.RECIPES.some(function (q) { return q.id === rc.id; })) LAB.RECIPES.push(rc); });
/* прежний «модуль усиления» — теперь модуль мощности: собирается в запас и ставится на любое оружие */
LAB.RECIPES.forEach(function (rc) { if (rc.id === "wmod") { rc.out = "m_power"; rc.n = "Модуль мощности"; rc.desc = "Плюс пятнадцать процентов к урону оружия, не больше трёх на одно оружие."; } });

/* Классы рецептов: базовые — у любого верстака, специализированные — на
   паяльной станции, экспериментальные — на стенде опытной серии. */
var BASE_IDS = ["medkit_s", "antidote", "stim", "bandage", "sorbent", "bat_e", "noise", "lockpick", "pick_b", "pick_g", "filter", "w_baton", "a_vest"];
var EXP_IDS = ["w_cryo", "a_exo", "a_bastion", "a_positron", "a_ark"];
function clsRule(rc) {
  if (BASE_IDS.indexOf(rc.id) >= 0) return "base";
  if (EXP_IDS.indexOf(rc.id) >= 0) return "exp";
  if ((rc.minL || 0) > 10 && String(rc.out).indexOf("armor:") === 0) return "exp";
  return "spec";
}
function clsOf(rc) { if (!rc.cls) rc.cls = clsRule(rc); return rc.cls; }
LAB.RECIPES.forEach(clsOf);
var CLS_T = { base: 1, spec: 2, exp: 3, cnc: 4, syn: 5 };
var CLS_N = { base: "базовая схема", spec: "специализированная схема", exp: "экспериментальная схема", cnc: "программа для станка", syn: "схема синтеза" };

/* ════════ ВЕРСТАК: уровень, состояние, питание ════════ */
/* (2.0) Чем глубже, тем совершеннее оснастка: станок с программным
   управлением собирает партиями, печатает детали и модернизирует оружие и
   броню под глубину; молекулярный синтезатор ещё и синтезирует редкие детали
   и перековывает качество. */
var TIER = [null,
  { n: "базовый верстак", d: "тиски, ручной инструмент и паяльник" },
  { n: "специализированный верстак", d: "паяльная станция, токарный станок и тестер" },
  { n: "экспериментальный стенд", d: "стенд опытной серии: печь для сплавов, калибратор и тестер" },
  { n: "станок с программным управлением", d: "фрезер с программой, принтер деталей и стенд калибровки: собирает партиями, печатает микросхемы и линзы, модернизирует оружие и броню под глубину" },
  { n: "молекулярный синтезатор", d: "камера послойного синтеза: всё, что умеют станки, и ещё синтез сверхпроводников, силовых модулей и опытных узлов, перековка качества оружия и брони" }];
/* мастерская этажа в глубине — не хуже ступени своей глубины */
function shopMin(L) { return L >= 61 ? 5 : L >= 26 ? 4 : L >= 11 ? 3 : L >= 3 ? 2 : 1; }
var GOOD_ROOMS = ["repair", "assembly", "armorlab", "ballistics", "parts", "storage"];
function roomType(o) {
  var fl = CUR().fl; if (!fl || !o) return "";
  var r = fl.room[o.y * LAB.W + o.x];
  return r >= 0 && fl.rooms[r] ? fl.rooms[r].type || "" : "";
}
/* (2.0) Профиль верстака — от помещения: у каждого свои сильные стороны.
   Мастерская этажа получает профиль по этажу; в прочих помещениях — общий. */
var SPEC = {
  repair:   { n: "ремонтный", d: "ремонт оружия и брони — на металлолом дешевле, ручной инструмент чинит до девяноста, инженерный кейс пополняется без провода" },
  assembly: { n: "сборочный", d: "батареи, боеприпасы, гранаты, устройства, ловушки и ремкомплекты иногда выходят с запасом — плюс один" },
  arms:     { n: "оружейный", d: "оружие, броня и модули — на металлолом дешевле, собранные оружие и броня — на ступень качества лучше" },
  lab:      { n: "лабораторный", d: "лекарства и стимуляторы иногда выходят с запасом — плюс один" },
  tech:     { n: "электронный", d: "исследование схем — на микросхему дешевле, восстановление деталей иногда даёт лишнюю" }
};
var SPEC_ROOMS = { repair: "repair", assembly: "assembly", parts: "assembly", storage: "assembly", armorlab: "arms", ballistics: "arms", armory: "arms",
  soillab: "lab", genelab: "lab", thaw: "lab", aeroponics: "lab", geneeng: "lab", medbay: "lab",
  sequencer: "tech", supercond: "tech", emplab: "tech", server: "tech", comms: "tech" };
var SPEC_IDS = ["repair", "assembly", "arms", "lab", "tech"];
/* Профили через запятую: у мастерской этажа глубже тридцатого уровня — два,
   глубже семидесятого — три; у прочих верстаков в глубине — иногда второй. */
function specOf(o) {
  var g = G(), rt = roomType(o), shop = rt === "workshop" || !!(o && o.shop), h = h32("spec:" + g.L + "-" + g.F + "-" + (o && o.id));
  var first = shop ? SPEC_IDS[h % SPEC_IDS.length] : (SPEC_ROOMS[rt] || "");
  var n = shop ? (g.L >= 70 ? 3 : g.L >= 30 ? 2 : 1) : first ? (g.L >= 50 && (h >>> 7) % 2 ? 2 : 1) : 0;
  var out = first ? [first] : [];
  for (var i = 1; out.length < n && i < 12; i++) { var p = SPEC_IDS[(h >>> (3 * i)) % SPEC_IDS.length]; if (out.indexOf(p) < 0) out.push(p); }
  return out.join(",");
}
/* Уровень и поломка — от этажа и места (в ремонтных боксах и сборочных
   цехах оснастка лучше); починка верстака хранится на этаже. */
function bench(o) {
  var fs = CUR().fs, g = G();
  if (!fs) return { tier: 1, dmg: false, spec: "" };
  if (!fs.bench) fs.bench = {};
  var k = o && o.id != null ? String(o.id) : "x";
  if (!fs.bench[k]) {
    var h = h32("bench:" + g.L + "-" + g.F + "-" + k), p = h % 100, L = g.L;
    var b = GOOD_ROOMS.indexOf(roomType(o)) >= 0 || (o && o.shop) ? 15 : 0;
    var tier = L <= 2 ? (p < 55 - b ? 1 : 2) : L <= 5 ? (p < 25 - b ? 1 : p < 88 - b ? 2 : 3) : L <= 10 ? (p < 45 - b ? 2 : 3) :
      L <= 25 ? (p < 25 - b ? 2 : p < 75 - b ? 3 : 4) : L <= 50 ? (p < 35 - b ? 3 : p < 90 - b ? 4 : 5) : L <= 75 ? (p < 45 - b ? 4 : 5) : (p < 25 - b ? 4 : 5);
    if (o && o.shop) tier = Math.max(tier, shopMin(L));
    fs.bench[k] = { tier: tier, dmg: tier > 1 && ((h >>> 9) % 100) < 22 };
  }
  var bb = fs.bench[k];
  if (bb.spec == null) bb.spec = o ? specOf(o) : "";
  return bb;
}
function profs(b) { return b && b.spec ? String(b.spec).split(",") : []; }
function hasP(b, p) { return profs(b).indexOf(p) >= 0; }
function reserve() { return G().event === "dark"; }
function effTier(b) { return reserve() || b.dmg ? 1 : b.tier; }
function benchLine(b) {
  var t = TIER[b.tier], ps = profs(b).filter(function (p) { return SPEC[p]; }), s = cap1(t.n) + ": " + t.d + ".";
  if (!ps.length) s += " Профиль общий.";
  else s += (ps.length > 1 ? " Профили — " : " Профиль — ") + ps.map(function (p) { return SPEC[p].n + ": " + SPEC[p].d; }).join("; ") + ".";
  if (b.dmg) s += " Повреждён: станки не работают, только ручной инструмент. Починить можно здесь же — деталями или инженерным ремкомплектом.";
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
/* (2.0) Сколько деталей на самом деле: оружейный профиль верстака
   экономит металлолом на оружии, броне и модулях. */
function needOf(rc, b) {
  b = b || nearBench();
  var n = {}, k, o = String(rc.out), d = LAB.ITEMS[o];
  for (k in rc.need) n[k] = rc.need[k];
  if (hasP(b, "arms") && (n.scrap || 0) >= 2 && (o.indexOf("weapon:") === 0 || o.indexOf("armor:") === 0 || (d && d.kind === "wmodule"))) n.scrap--;
  /* партия из трёх на станке: деталей на треть меньше (по одной-две — ровно вдвое на три вещи) */
  if (batchOn(rc, b)) for (k in n) n[k] = Math.max(n[k] * 2, Math.floor(n[k] * 3 * 0.8));
  return n;
}
/* (2.0) Серийная сборка: станок с программным управлением и синтезатор —
   партия из трёх вещей (не оружие и не броня). */
var batch = false;
function batchable(rc) { var o = String(rc.out); return o.indexOf("weapon:") !== 0 && o.indexOf("armor:") !== 0; }
function batchOn(rc, b) { return batch && !!b && effTier(b) >= 4 && batchable(rc); }
function craftTimes(rc) { return batchOn(rc, nearBench()) ? 3 : 1; }
function needText(rc) {
  var g = G(), s = [], need = needOf(rc);
  for (var k in need) {
    var have = g.inv[k] || 0, nm = LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k;
    s.push(nm + " " + have + " из " + need[k] + (have < need[k] ? " (" + srcOf(k) + ")" : ""));
  }
  return s.join(", ");
}
function missText(rc) {
  var g = G(), s = [], need = needOf(rc);
  for (var k in need) { var have = g.inv[k] || 0; if (have < need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + have + " из " + need[k]); }
  return s.join(", ");
}
function tierWhy(b, t) {
  if (b.tier >= t && b.dmg) return "Станки этого верстака разбиты: сейчас работает только ручной инструмент. Сначала почините верстак — пункт «Починить верстак».";
  if (b.tier >= t && reserve()) return "Аварийное освещение: верстак на резервном питании, станки стоят. Дождитесь света — или соберите что-то базовое.";
  return "Здесь не собрать: нужен " + TIER[t].n + (t === 5 ? " — такие стоят только в самой глубине, в мастерских этажей." : t === 4 ? " — такие стоят глубже десятого уровня, чаще в мастерских этажей." : t === 3 ? " — стенды опытной серии стоят глубже, в лабораториях." : " — паяльная станция и тестер; они чаще в ремонтных боксах и сборочных цехах.");
}
/* Можно ли собрать сейчас: "" — да, иначе — почему (вслух). */
function check(rc, b) {
  var g = G();
  if (rc.minL && g.L < rc.minL) return "Это здесь не собрать: чертежей и оснастки на этой глубине нет.";
  if (rc.bp && !known(rc)) return "Схема неизвестна: «" + rc.n + "». Схемы открывают технические документы, разговоры с инженерами, разбор устройств и исследование на верстаке.";
  var cw = LAB.implants ? LAB.implants.craftWhy(rc) : ""; if (cw) return cw; /* (2.0) сборка чипов — по ступени кибернетики */
  b = b || nearBench();
  if (b) { var t = CLS_T[clsOf(rc)] || 1; if (effTier(b) < t) return tierWhy(b, t); }
  var need = needOf(rc, b);
  for (var k in need) if ((g.inv[k] || 0) < need[k]) return "Не хватает: " + needText(rc) + ".";
  return "";
}
/* (2.0) Профиль верстака при сборке: «с запасом» — ещё одна вещь;
   оружейный — оружие и броня на ступень качества лучше. */
var BONUS = { assembly: { g: ["Батареи и боеприпасы", "Гранаты и устройства", "Ловушки и мины", "Ремкомплекты"], p: 0.3 },
  lab: { g: ["Лечение и стимуляторы"], p: 0.35 }, tech: { g: ["Восстановление деталей"], p: 0.3 } };
function craftBonus(rc) {
  var b = nearBench(), o = String(rc.out), p = 0, who = "";
  if (o.indexOf("weapon:") === 0 || o.indexOf("armor:") === 0) return 0;
  profs(b).forEach(function (k) { var bo = BONUS[k]; if (bo && bo.g.indexOf(groupOf(rc)) >= 0 && bo.p > p) { p = bo.p; who = k; } });
  bonusBy = who;
  return p && Math.random() < p ? 1 : 0;
}
var bonusBy = "";
function craftQual() { return hasP(nearBench(), "arms") ? 3 : 2; }
function specName() { var sp = SPEC[bonusBy] || SPEC[profs(nearBench())[0]]; return sp ? cap1(sp.n) + " профиль верстака" : "Верстак"; }
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
/* бластеры: «Искра», импульсный, тяжёлый, «Аркси» — и ионный бластер из своего класса */
function blaster(w) { return wcls(w) === "blaster" || w.base === "ion"; }
function battery(w) { return w.ammo && w.ammo !== "none"; }
/* (3.5) греются только стволы на заряде: картечь, иглы и стальные пули — нет */
function heats(w) { return battery(w) && !LAB.physAmmo(w.ammo) && !melee(w); }
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
  if (heats(w) && !(LAB.chem && LAB.chem.chilled(w))) { /* (3.0) охлаждающий гель: не греется */
    cooled(w, now);
    w.heat = (w.heat || 0) + (HEAVY[wcls(w)] ? 1.4 : 1) * (burst ? 0.7 : 1) * (1 - (LAB.implants ? Math.min(0.6, LAB.implants.stat("cool")) : 0)) * (LAB.chem ? LAB.chem.heatK(w) : 1); /* (3.0) энергохимик */
    w.heatT = now;
    var mx = hmax(w);
    if (w.heat >= mx) {
      w.hotUntil = now + 2500; w.heat = mx * 0.6;
      A("play", "ev_steam", { gain: 0.55, rate: 1.35 });
      sayOnce("overheat", "Перегрев: оружие остывает две с половиной секунды." + (md(w, "cool") ? "" : " Радиатор продлит очередь."), 3000);
      if (LAB.combat && LAB.combat.stopFire) LAB.combat.stopFire();
    } else if (w.heat >= mx * 0.75) { A("play", "ev_steam", { gain: 0.25, rate: 1.5 }); sayOnce("warm", "Ствол горячий — дайте ему остыть.", 6000); }
  }
  /* (3.6, просьба игрока) бластеры изнашиваются на треть медленнее прочего стрелкового:
     «Искра» доходит до половины износа примерно за 270 выстрелов, а не за 180 */
  var c0 = cond(w), wear = (melee(w) ? 0.12 : blaster(w) ? 0.15 : 0.22) * (QK[w.qual] || 1) * (HEAVY[wcls(w)] ? 1.3 : 1) * Math.pow(0.45, md(w, "stab"));
  w.cond = Math.max(0, Math.round((c0 - wear) * 100) / 100);
  [50, 25, 10].forEach(function (lv) {
    if (c0 >= lv && w.cond < lv) sayq(lv === 50 ? "Оружие изнашивается: состояние " + lv + " из 100. Почините его у верстака." : lv === 25 ? "Оружие сильно изношено: состояние " + lv + " из 100, начнутся осечки." : "Оружие на пределе: почти каждый пятый выстрел — осечка.");
  });
}
function accBonus(w, burst) { return 0.07 * md(w, "acc") + (md(w, "stab") ? 0.03 + (burst ? 0.1 : 0) : 0) + (LAB.implants ? LAB.implants.stat("acc") : 0); }
function condK(w) { var c = cond(w); return c >= 50 ? 1 : 0.75 + 0.5 * c / 100; }
/* (2.0) чипы и импланты (implants.js): ярость, добивание, разгон, бронебойность, быстрая рука */
function dmgK(w, f) { return condK(w) * (f && f.kind === "mech" && md(w, "emp") ? 1 + 0.25 * md(w, "emp") : 1) * (LAB.implants ? LAB.implants.dmgK(f) : 1); }
function pierce(w) { return Math.min(0.9, ((LAB.WEAPONS[w.base] || {}).apierce || 0) + 0.35 * md(w, "pierce") + (LAB.implants ? LAB.implants.stat("pierce") : 0)); }
function reloadK(w) { return Math.max(0.3, (1 - 0.3 * md(w, "reload")) * (1 - (LAB.implants ? LAB.implants.stat("reload") : 0))); }
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
  if (w.cap0) { w.cap = LAB.capAt(w.base, w.cap0, w.bay); if (w.charge > w.cap) w.charge = w.cap; }
  w.mods = used(w);
}
/* (3.7) Ёмкость — своя ёмкость оружия (w.cap0: вид, ступень и качество) и ступени
   ёмкости у верстака, до предела вида (world.js, capAt). Модули и батареи её не меняют. */
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
    case "reload": if (!battery(w)) return "у этого оружия нет батареи"; break;
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
  var cd = LAB.weaponCd(w) * gapK(w) / 1000;
  s.push((melee(w) ? "удар" : "выстрел") + " раз в " + String(Math.round(cd * 10) / 10).replace(".", ",") + " " + (cd === 1 ? "секунду" : "секунды"));
  if (battery(w)) { s.push(w.cap + " " + gm().plural(w.cap, "выстрел", "выстрела", "выстрелов") + " в заряде, питание: " + (LAB.AMMO[w.ammo] ? LAB.AMMO[w.ammo].n.toLowerCase() : w.ammo)); if (capLine(w)) s.push(capLine(w)); }
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
  /* (1.5) свойства нового оружия */
  if (b.bleed) s.push("живое истекает после удара");
  if (b.chain) s.push("разряд перескакивает на соседей: до " + b.chain + " " + gm().plural(b.chain, "цели", "целей", "целей"));
  if (b.knock) s.push("отбрасывает на шаг");
  if (b.slow) s.push("замедляет");
  if (b.mark) s.push("метит цель: по ней бьют на четверть сильнее");
  if (b.drain) s.push("часть урона по живому возвращается здоровьем");
  if (b.crit) s.push("чаще бьёт точно в цель");
  if (b.burst) s.push("очередь из " + b.burst);
  s.push(heats(w) ? "греется при долгой стрельбе" : "не греется");
  var l = b.silent ? 2 : loud(w, ({ melee: 2, laser: 6, cryo: 5, thermo: 6, gauss: 10, positron: 12, magnetron: 8 })[b.cls] || 8);
  s.push(l <= 3 ? "звучит тихо" : l <= 7 ? "звучит умеренно" : "звучит громко, слышно далеко");
  return s.join(", ") + ".";
}

/* ════════ РЕМОНТ ОРУЖИЯ ════════ */
function repairCost(w, cap, b) {
  var miss = Math.max(0, cap - cond(w)), need = {};
  if (miss <= 0) return null;
  need.scrap = Math.max(1, Math.ceil(miss / 30));
  if (battery(w)) { need.wire = 1; if (miss > 60 && w.ammo !== "slug") need.chip = 1; }
  if (wcls(w) === "kinetic") need.servo = miss > 60 ? 1 : 0;
  if (!need.servo) delete need.servo;
  if (hasP(b, "repair") && need.scrap > 1) need.scrap--;
  return need;
}
function costText(need) { var s = []; for (var k in need) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + need[k]); return s.join(", "); }
function haveAll(need) { var g = G(); for (var k in need) if ((g.inv[k] || 0) < need[k]) return false; return true; }
function take(need) { var g = G(); for (var k in need) g.inv[k] -= need[k]; }
function repairCap(b) { return effTier(b) >= 2 ? 100 : hasP(b, "repair") ? 90 : 80; }
function repairWeapon(i, b) {
  var g = G(), w = g.weapons[i];
  if (!w) return false;
  b = b || nearBench() || { tier: 1, dmg: false };
  var capC = repairCap(b), need = repairCost(w, capC, b);
  if (!need) { say(cond(w) >= capC && capC < 100 ? "Ручной инструмент больше не даст: " + Math.round(cond(w)) + " из 100. Дальше нужна паяльная станция." : "Оружие исправно."); return false; }
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
/* походные ремкомплекты — repair.js */

/* ════════ РЕМОНТ БРОНИ (2.0) ════════
   Станки — до 100, ручной инструмент — до 80 (у ремонтного профиля — до 90). */
function armorCost(a, cap, b) {
  var miss = Math.max(0, cap - LAB.armorCond(a)), need = {};
  if (miss <= 0.5) return null;
  need.scrap = Math.max(1, Math.ceil(miss / 30));
  if (miss > 50) need[G().L >= 3 ? "ceramic" : "rubber"] = 1;
  if (hasP(b, "repair") && need.scrap > 1) need.scrap--;
  return need;
}
function repairArmor(a, b) {
  if (!a) return false;
  b = b || nearBench() || { tier: 1, dmg: false };
  var capC = repairCap(b), need = armorCost(a, capC, b), c = LAB.armorCond(a);
  if (!need) { say(c >= capC && capC < 100 ? "Ручной инструмент больше не даст: " + Math.round(c) + " из 100. Дальше нужны станки." : "Броня исправна."); return false; }
  if (!haveAll(need)) { LAB.UI.error(); say("Для ремонта брони не хватает: " + costLack(need) + "."); return false; }
  take(need);
  a.cond = capC;
  seq([
    { t: "Ремонт брони, этап 1 из 3: снимаю разбитые накладки и крепления.", snd: "pry" },
    { t: "Этап 2 из 3: правлю вмятины, клею и проклёпываю швы.", snd: "craft" },
    { t: "Этап 3 из 3: примерка. " + cap1(a.name) + ": состояние " + capC + " из 100, защита " + LAB.armorDef(a) + "." + (capC < 100 ? " Больше дадут только станки." : ""), snd: "craft_armor" }
  ]);
  return true;
}
/* Инженерный кейс: пополнить начатый — плюс один ремонт. (3.5) С микросхемой: ремонт кейсом
   стоит не дешевле ремонта у верстака (прежде кусок лома давал «плюс пятьдесят» оружию или
   починку целого верстака); и у повреждённого верстака кейс не пополнить. */
function refillCost(b) { return hasP(b, "repair") ? { scrap: 1, wire: 1, chip: 1 } : { scrap: 2, wire: 1, chip: 1 }; }
function refillKit(b) {
  var g = G(), R = LAB.repair, o = R ? R.opened("engkit") : 0, uses = R ? R.KITS.engkit.uses : 3;
  if (!o || o >= uses) { say("Пополнять нечего: начатого инженерного кейса нет."); return false; }
  if (b && b.dmg) { LAB.UI.error(); say("Верстак повреждён: сначала почините его — пополнять кейс не на чем."); return false; }
  var need = refillCost(b);
  if (!haveAll(need)) { LAB.UI.error(); say("Для пополнения кейса не хватает: " + costLack(need) + "."); return false; }
  take(need);
  g.kitUse.engkit = o + 1;
  A("play", "craft");
  say("Инженерный кейс пополнен: контакты и припой на месте. В начатом кейсе ремонтов " + g.kitUse.engkit + " из " + uses + ".");
  return true;
}
/* Ящик под верстаком: обрезки и крепёж — один раз на верстак. */
function drawerGot(o) {
  var g = G(), L = g.L, h = h32("drawer:" + L + "-" + g.F + "-" + (o && o.id)), out = { scrap: 1 + h % 2 + Math.floor(L / 25) };
  if ((h >>> 3) % 3) out.wire = 1 + (L >= 30 ? 1 : 0);
  if ((h >>> 9) % 100 < 30) out.tape = 1;
  if ((h >>> 6) % 100 < 22 + Math.min(20, L / 3)) out.fieldkit = 1;
  if (L >= 10 && (h >>> 16) % 100 < 12) out.engkit = 1;
  /* глубже — детали дороже */
  var pp = ["relay", "cell", "servo", "optic"].concat(L >= 20 ? ["chip", "magnet"] : [], L >= 40 ? ["supercond", "powercell"] : []).filter(function (k) { return (LAB.PART_DEPTH[k] || 1) <= L; });
  if (pp.length && (h >>> 13) % 100 < 25 + Math.min(35, L / 2)) out[pp[(h >>> 20) % pp.length]] = 1;
  return out;
}

/* ════════ МОДЕРНИЗАЦИЯ И ПЕРЕКОВКА (2.0) ════════
   Станок с программным управлением подгоняет оружие и броню под глубину,
   где вы сейчас; молекулярный синтезатор поднимает качество на ступень. */
function lvlNow() { return LAB.foeLevel(G().L, G().F); }
function wGen(w, q, mark) { var b = LAB.WEAPONS[w.base] || {}; return LAB.QUAL[b.g] ? LAB.QUAL[b.g][q] + " " + b.n + (b.cls === "melee" && w.base !== "cutter" ? "" : " " + LAB.MODEL[w.base] + "-" + mark) : w.name; }
function aGen(a, q) { var d = LAB.ARMORS[a.base] || {}; return LAB.QUAL[d.g] ? LAB.QUAL[d.g][q] + " " + d.n : a.name; }
/* имя меняется, только если оно обычное (у именного оружия — своё) */
function wRename(w, q0, m0) { if (w.name === wGen(w, q0, m0)) w.name = wGen(w, w.qual, LAB.weaponMark(w.rank, w.lvl)); }
function aRename(a, q0) { if (a.name === aGen(a, q0)) a.name = aGen(a, a.qual); }
function modCost(gap, kind) {
  var n = { scrap: 2 + Math.min(4, Math.ceil(gap / 15)) };
  if (kind === "w") { n.chip = gap > 20 ? 2 : 1; if (gap > 10) n.magnet = 1; }
  else { n.wire = 1; if (G().L >= 3) n.ceramic = gap > 20 ? 2 : 1; }
  if (gap > 60) n.supercond = 1;
  return n;
}
function modGain(x, kind) { var nl = lvlNow(), ol = x.lvl || 1, k = kind === "w" ? 0.14 : 0.12; return (1 + k * (nl - 1)) / (1 + k * (ol - 1)); }
function modernize(kind, x, b) {
  var nl = lvlNow(), ol = x.lvl || 1;
  if (ol >= nl) { say(cap1(x.name) + " и так под эту глубину."); return false; }
  b = b || nearBench();
  if (!b || effTier(b) < 4) { LAB.UI.error(); say(b ? tierWhy(b, 4) : "Модернизация — только у станка с программным управлением."); return false; }
  var need = modCost(nl - ol, kind), k = modGain(x, kind);
  if (!haveAll(need)) { LAB.UI.error(); say("Для модернизации не хватает: " + costLack(need) + "."); return false; }
  take(need);
  if (kind === "w") {
    var q0 = x.qual, m0 = LAB.weaponMark(x.rank, ol);
    base(x);
    x.dmg0 = x.dmg0 * k; x.lvl = nl;
    /* (2.2) ёмкость — по новой ступени, как у нового оружия этой глубины */
    if (x.cap0) x.cap0 = LAB.weaponCap(x.base, x.rank, nl, x.qual);
    recalc(x); wRename(x, q0, m0);
  } else { x.def = Math.max(1, Math.round(x.def * k)); x.lvl = nl; }
  seq([
    { t: "Модернизация, этап 1 из 3: станок снимает старые узлы.", snd: "pry" },
    { t: "Этап 2 из 3: фрезер по программе вытачивает новые, под эту глубину.", snd: "craft" },
    { t: "Этап 3 из 3: калибровка. " + cap1(x.name) + (kind === "w" ? ": урон " + LAB.weaponDmg(x) + capWord(x) : ": защита " + LAB.armorDef(x)) + ".", snd: kind === "w" ? "w_switch" : "craft_armor" }
  ]);
  return true;
}
function reforgeCost(q) { return q < 3 ? { supercond: 1, chip: 2, scrap: 3 } : { supercond: 2, proto: 1, chip: 2 }; }
function qualName(x, kind, q) { var d = kind === "w" ? LAB.WEAPONS[x.base] : LAB.ARMORS[x.base]; return d && LAB.QUAL[d.g] ? LAB.QUAL[d.g][q].toLowerCase() : ""; }
function reforge(kind, x, b) {
  var q = x.qual == null ? 1 : x.qual;
  if (q >= 5) { say(cap1(x.name) + ": выше качества не бывает."); return false; }
  b = b || nearBench();
  if (!b || effTier(b) < 5) { LAB.UI.error(); say(b ? tierWhy(b, 5) : "Перековка — только у молекулярного синтезатора."); return false; }
  var need = reforgeCost(q);
  if (!haveAll(need)) { LAB.UI.error(); say("Для перековки не хватает: " + costLack(need) + "."); return false; }
  take(need);
  var k = LAB.QUAL_MULT[q + 1] / LAB.QUAL_MULT[q];
  if (kind === "w") { var m0 = LAB.weaponMark(x.rank, x.lvl); base(x); x.dmg0 = x.dmg0 * k; x.qual = q + 1; if (x.cap0) x.cap0 = LAB.weaponCap(x.base, x.rank, x.lvl, x.qual); recalc(x); wRename(x, q, m0); }
  else { x.def = Math.max(1, Math.round(x.def * k)); x.qual = q + 1; aRename(x, q); }
  seq([
    { t: "Перековка, этап 1 из 3: синтезатор разбирает изделие до структуры.", snd: "pry" },
    { t: "Этап 2 из 3: слой за слоем — плотнее и чище прежнего.", snd: "craft" },
    { t: "Этап 3 из 3: " + cap1(x.name) + ", качество — " + qualName(x, kind, x.qual) + (kind === "w" ? ", урон " + LAB.weaponDmg(x) + capWord(x) : ", защита " + LAB.armorDef(x)) + ".", snd: kind === "w" ? "w_switch" : "craft_armor" }
  ]);
  return true;
}
function capWord(w) { return battery(w) && w.cap ? ", " + w.cap + " " + gm().plural(w.cap, "выстрел", "выстрела", "выстрелов") + " в заряде" : ""; }
/* ════════ ЁМКОСТЬ ОРУЖИЯ (2.2; 3.7 — до предела вида) ════════
   Отсек батарей и ячеек растачивают, магазин патронов, игл, капсул и картриджей
   удлиняют, газовый баллон ставят побольше. Ступень за ступенью — до предела
   вида; ступень — не выше оснастки верстака. */
var FAM = {
  bay: { job: "расточка отсека", stepN: "ступень расточки", cost: BAY_COST,
    t1: "Расточка, этап 1 из 2: старый отсек вскрыт, контакты сняты.", t2: "Этап 2 из 2: отсек под батарею побольше, контакты на месте." },
  mag: { job: "удлинённый магазин", stepN: "ступень магазина", cost: MAG_COST,
    t1: "Магазин, этап 1 из 2: подаватель и пружина сняты, корпус разрезан.", t2: "Этап 2 из 2: вставка вварена, пружина длиннее и туже." },
  tank: { job: "баллон побольше", stepN: "ступень баллона", cost: MAG_COST,
    t1: "Баллон, этап 1 из 2: вентиль перекрыт, старый баллон снят.", t2: "Этап 2 из 2: баллон побольше на месте, штуцер затянут, утечки нет." }
};
function shots(n) { return n + " " + gm().plural(n, "выстрел", "выстрела", "выстрелов"); }
function plan(w) { return w && w.cap > 0 ? LAB.capPlan(w.base) : null; }
function bayOk(w) { var p = plan(w); return !!(p && p.steps > 0); }
/* предел этого экземпляра — его ёмкость на последней ступени */
function capMax(w) { var p = plan(w); if (!p) return 0; base(w); return LAB.capAt(w.base, w.cap0, p.steps); }
/* сколько выстрелов станет после следующей ступени */
function bayNext(w) { base(w); return LAB.capAt(w.base, w.cap0, (w.bay || 0) + 1); }
/* о ёмкости — для профиля оружия */
function capLine(w) {
  var p = plan(w); if (!p) return "";
  if (!p.steps) return "ёмкость не меняется" + (p.why ? ": " + p.why : "");
  var n = Math.min(p.steps, w.bay || 0), mx = capMax(w);
  if (n >= p.steps) return "ёмкость на пределе вида — " + shots(mx);
  return "у верстака ёмкость поднимается до " + shots(mx) + (n ? ", пройдено ступеней " + n + " из " + p.steps : " за " + p.steps + " " + gm().plural(p.steps, "ступень", "ступени", "ступеней"));
}
function bayBore(w, b) {
  var p = plan(w);
  if (!p) { say(cap1(w.name) + ": ни батареи, ни магазина — поднимать нечего."); return false; }
  if (!p.steps) { say(cap1(w.name) + ": ёмкость не меняется — " + p.why + "."); return false; }
  var F = FAM[p.fam] || FAM.bay, n = (w.bay || 0) + 1;
  if (n > p.steps) { say(cap1(w.name) + ": " + shots(w.cap) + " — предел этого вида, больше в него не войдёт."); return false; }
  b = b || nearBench();
  if (!b || effTier(b) < n) { LAB.UI.error(); say(b ? tierWhy(b, n) : cap1(F.job) + " — у верстака."); return false; }
  var need = F.cost[n];
  if (!haveAll(need)) { LAB.UI.error(); say(cap1(F.job) + ": не хватает " + costLack(need) + "."); return false; }
  take(need);
  base(w);
  var c0 = w.cap, full = w.charge >= c0;
  w.bay = n; recalc(w);
  if (full) w.charge = w.cap;
  seq([
    { t: F.t1, snd: "pry" },
    { t: F.t2 + " " + cap1(w.name) + ": " + c0 + " → " + shots(w.cap) + ", " + F.stepN + " " + n + " из " + p.steps + (n >= p.steps ? " — предел этого вида." : "."), snd: "craft" }
  ]);
  return true;
}
function bayItems(b) {
  var g = G(), et = effTier(b), items = [];
  g.weapons.forEach(function (w) {
    var p = plan(w); if (!p) return;
    if (!p.steps) { items.push({ label: w.name + ": " + shots(w.cap) + ", ёмкость не меняется — " + p.why, info: true, keep: true, fn: function () {} }); return; }
    var n = (w.bay || 0) + 1, F = FAM[p.fam] || FAM.bay;
    if (n > p.steps) { items.push({ label: w.name + ": " + shots(w.cap) + " — предел этого вида", info: true, keep: true, fn: function () {} }); return; }
    var need = F.cost[n], lack = et < n ? " — нужен " + TIER[n].n : haveAll(need) ? "" : " — не хватает";
    items.push({ label: w.name + ": " + w.cap + " → " + shots(bayNext(w)) + ", " + F.job + ", ступень " + n + " из " + p.steps + ", предел — " + capMax(w) + ". Нужно: " + costText(need) + lack, keep: true, fn: function () { bayBore(w, b); } });
  });
  if (!items.length) items.push({ label: "Поднимать нечего: у вас нет оружия на батареях, зарядах или патронах.", info: true, keep: true, fn: function () {} });
  return items.concat([back()]);
}
function bayMenu() {
  var b = bench(cur.o), et = effTier(b);
  menu("Ёмкость оружия", bayItems(b), { keep: true, intro: "Ёмкость поднимает только верстак: батареи и модули зарядов не прибавляют, батарея только заряжает. У каждого вида свой предел и своё число ступеней. Ступень — не выше оснастки верстака: этот поднимает до ступени " + Math.min(4, et) + ".", rebuild: function () { return bayItems(b); } });
}
/* (3.7) Оружие прежней записи: модуль ёмкости и ёмкие батареи снимаются и ложатся в
   рюкзак — продать или разобрать; ступени расточки сверх ступеней вида возвращают свои
   детали; ёмкость — по новому правилу. Один раз на оружие. Что сказать — или "". */
function fixUpg(w, inv) {
  if (!w || w.upgV === 3 || !LAB.WEAPONS[w.base]) return "";
  w.upgV = 3;
  var m = w.mod || {}, off = [], back = {}, k, i;
  for (k in GONE_MODS) if (m[k]) {
    off.push(GONE_MODS[k].n.toLowerCase() + (m[k] > 1 ? " ×" + m[k] : ""));
    if (inv) inv[GONE_MODS[k].item] = (inv[GONE_MODS[k].item] || 0) + m[k];
    delete m[k];
  }
  var p = LAB.capPlan(w.base), top = p ? p.steps : 0, was = w.bay || 0;
  if (was > top) { for (i = top + 1; i <= was; i++) for (k in BAY_COST[i]) back[k] = (back[k] || 0) + BAY_COST[i][k]; w.bay = top; }
  if (!off.length && was === (w.bay || 0)) { if (w.dmg0 != null) recalc(w); return ""; }
  if (inv) for (k in back) inv[k] = (inv[k] || 0) + back[k];
  recalc(w);
  var s = [];
  if (off.length) s.push("снято: " + off.join(", ") + " — в рюкзаке");
  if (Object.keys(back).length) s.push("ступени расточки сверх предела вида возвращены деталями: " + costText(back));
  var top2 = p && p.steps && (w.bay || 0) >= p.steps;
  return cap1(w.name) + ": " + s.join("; ") + ". Теперь " + shots(w.cap) + (top2 ? " — предел этого вида." : ", " + capLine(w) + ".");
}
function upgItems(b) {
  var g = G(), nl = lvlNow(), et = effTier(b), items = [];
  function add(kind, x) {
    var gap = nl - (x.lvl || 1), q = x.qual == null ? 1 : x.qual;
    if (gap > 0) {
      var nm = modCost(gap, kind), est = kind === "w" ? "урон станет около " + Math.round(x.dmg * modGain(x, kind) * LAB.wGrowK({ lvl: nl })) : "защита станет около " + Math.round(LAB.armorDef(x) * modGain(x, kind));
      items.push({ label: "Модернизировать под эту глубину: " + x.name + " — " + est + ". Нужно: " + costText(nm) + (haveAll(nm) ? "" : " — не хватает"), keep: true, fn: function () { modernize(kind, x, b); } });
    }
    if (et >= 5 && q < 5) {
      var rn = reforgeCost(q);
      items.push({ label: "Перековать: " + x.name + " — качество станет «" + qualName(x, kind, q + 1) + "». Нужно: " + costText(rn) + (haveAll(rn) ? "" : " — не хватает"), keep: true, fn: function () { reforge(kind, x, b); } });
    }
  }
  g.weapons.forEach(function (w) { add("w", w); });
  (g.armors || []).forEach(function (a) { add("a", a); });
  if (!items.length) items.push({ label: "Нечего: оружие и броня — под эту глубину" + (et >= 5 ? " и лучшего качества." : "."), info: true, keep: true, fn: function () {} });
  return items.concat([back()]);
}
function upgMenu() {
  var b = bench(cur.o);
  menu(effTier(b) >= 5 ? "Модернизация и перековка" : "Модернизация", upgItems(b), { keep: true, intro: effTier(b) >= 5 ? "Станок подгоняет оружие и броню под эту глубину, синтезатор поднимает качество на ступень." : "Станок подгоняет оружие и броню под эту глубину: урон и защита — как у нового.", rebuild: function () { return upgItems(b); } });
}
function takeDrawer(b, o) {
  if (b.drawer) { say("Ящик под верстаком пуст: вы его уже выгребли."); return false; }
  b.drawer = 1;
  var got = give(drawerGot(o));
  A("play", "pick_part");
  say("Ящик под верстаком: " + (got || "только стружка") + ". Всё — в рюкзаке.");
  return true;
}

/* ════════ РАЗБОР ════════ */
var SALV = {
  turret_kit: { scrap: 2, servo: 1, optic: 1 }, turret_kit2: { servo: 2, panel: 1, powercell: 1 }, jammer: { chip: 1, relay: 1, wire: 1 },
  noise: { scrap: 1, cap: 1 }, emp: { cap: 1, scrap: 1 }, decoder: { chip: 2, wire: 1 }, sonar: { cap: 1, lens: 1 },
  decoy_e: { relay: 1, cell: 1 }, disruptor: { optic: 1, cap: 1 }, lockpick: { scrap: 1 }, filter: { scrap: 1 }, repairkit: { scrap: 2 },
  wrepair: { scrap: 1, wire: 1 }, plate: { scrap: 2, panel: 1 }, okokey: { chip: 1, relay: 1 }
};
for (var gsk in GONE_MODS) SALV[GONE_MODS[gsk].item] = GONE_MODS[gsk].parts; /* (3.7) прежние батареи и модуль ёмкости */
/* что понимаешь, разбирая: оружие и устройства раскрывают схемы */
var ANALYZE = {
  laser: "m_acc", gauss: "m_pierce", ion: "m_emp", pulse: "m_reload", heavy: "m_cool", plasma: "m_cool", thermo: "m_cool", cryo: "m_cool", spark: "m_reload",
  mpistol: "m_range", mrifle: "m_range", cutter: "m_quiet", vibro: "m_quiet", baton: "w_suppressor", mresonator: "m_stab", ppistol: "bat_p", pcannon: "bat_p",
  kpistol: "w_needle", needle: "m_pierce", suppressor: "m_emp",
  noise: "decoy_e", jammer: "disruptor", turret_kit: "turret_kit2", okokey: "m_emp", decoder: "m_acc", sonar: "m_range"
};
function analyzeHint(key, b) {
  var id = ANALYZE[key], rc = id && recipe(id);
  if (!rc || known(rc) || !b || effTier(b) < 2 || CLS_T[clsOf(rc)] > effTier(b)) return null;
  return rc;
}
/* (3.5) Что вернёт разбор: у того, что собирают у верстака, — не больше половины рецепта
   (деталь по две и больше — половина, одиночная — через раз; экспериментальный компонент —
   тоже через раз). Прежде модуль всегда возвращал свой компонент, а у устройств был свой
   набор, иногда богаче рецепта: «партия из трёх — разобрать» плодила детали без конца. */
function salvParts(id) {
  var rc = recipeOut(id), sure = {}, maybe = {}, k;
  if (rc) { for (k in rc.need) { if (rc.need[k] > 1) sure[k] = Math.floor(rc.need[k] / 2); else maybe[k] = 1; } return { sure: sure, maybe: maybe }; }
  if (SALV[id]) return { sure: SALV[id], maybe: {} };
  return null;
}
function salvText(id) {
  var sp = salvParts(id); if (!sp) return "";
  var a = costText(sp.sure), m = Object.keys(sp.maybe).map(function (k) { return LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k; });
  return (a ? "даст " + a : "") + (m.length ? (a ? "; " : "") + "может найтись: " + m.join(", ") : "");
}
function give(parts) { var g = G(), s = []; for (var k in parts) { var n = parts[k]; if (!n) continue; g.inv[k] = (g.inv[k] || 0) + n; s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + n); } return s.join(", "); }
/* Разобрать устройство или запасной модуль из инвентаря. */
function salvage(id, b) {
  var g = G(), d = LAB.ITEMS[id];
  if (!d || !(g.inv[id] > 0)) { say("Нет: " + (d ? d.n.toLowerCase() : id) + "."); return false; }
  b = b || nearBench();
  var sp = salvParts(id), parts = null;
  if (sp) { parts = {}; var k; for (k in sp.sure) parts[k] = sp.sure[k]; for (k in sp.maybe) if (Math.random() < 0.5) parts[k] = (parts[k] || 0) + 1; }
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
function onScrap(w, crafted) {
  var g = G(), out = [], m = w.mod || {}, k;
  for (k in m) if (m[k] && MODS[k]) { g.inv[MODS[k].item] = (g.inv[MODS[k].item] || 0) + m[k]; }
  if (used(w)) out.push("Модули сняты и лежат в запасе: " + modsLine(w) + ".");
  var b = LAB.WEAPONS[w.base] || {}, extra = {};
  /* (3.5) собранное своими руками — без находок сверх рецепта (game.js, scrapWeapon) */
  if (!crafted) {
    if (battery(w) && w.ammo !== "slug") extra.cell = Math.random() < 0.5 + 0.1 * (w.rank || 0) ? 1 : 0;
    if (b.cls === "laser" || b.cls === "blaster") extra.lens = Math.random() < 0.3 ? 1 : 0;
    if (b.cls === "kinetic") extra.servo = Math.random() < 0.5 ? 1 : 0;
    if ((w.rank || 0) >= 4) extra.proto = 1;
  }
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
/* электронный профиль верстака — на микросхему дешевле */
function researchCost(cls, b) { var n = {}, k; for (k in RESEARCH[cls]) n[k] = RESEARCH[cls][k]; if (hasP(b, "tech") && n.chip > 1) n.chip--; return n; }
function research(cls, b) {
  var g = G();
  b = b || nearBench();
  var t = CLS_T[cls];
  if (!b || effTier(b) < t) { LAB.UI.error(); say(b ? tierWhy(b, t) : "Исследовать схемы можно только у верстака."); return false; }
  var rc = unknownPick(t, null, cls);
  if (!rc) { say(cls === "exp" ? "Неизвестных экспериментальных схем нет." : "Все специализированные схемы этой глубины вам известны."); return false; }
  var need = researchCost(cls, b);
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
function fixCost(b) { return b.tier >= 4 ? { scrap: 4, servo: 1, chip: 2 } : b.tier >= 3 ? { scrap: 3, servo: 1, chip: 1 } : { scrap: 3, wire: 1, relay: 1 }; }
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
  if (LAB.tutor && (rc.out === "noise" || rc.out === "decoy_e")) LAB.tutor.ev("decoy");
  if (it && it.kind === "wmodule" && !it.gone) { pickWeapon(it.mod, msg + " Шаг 2 из 2: выберите оружие для установки или оставьте модуль в запасе."); return; }
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
  A("grenade", p.x, p.y, { noPin: true, fuse: 600 });
  if (LAB.combat && LAB.combat.spendTurns) LAB.combat.spendTurns(1, "throw"); /* (2.6) пошаговый режим: бросок — ход */
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
  if (!f || f.kind !== "mech" || (f.spawned && !f.oko)) return; /* (3.0) присланные ОКО — как обычные */
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
var GROUPS = ["Лечение и стимуляторы", "Батареи и боеприпасы", "Гранаты и устройства", "Ловушки и мины", "Оружие", "Броня", "Ремкомплекты", "Улучшения", "Модули оружия", "Чипы имплантов", "Восстановление деталей"];
var KIT_OUT = { fieldkit: 1, wrepair: 1, repairkit: 1, engkit: 1, m_oilcan: 1 };
function groupOf(rc) {
  var o = String(rc.out), d = LAB.ITEMS[o];
  if (rc.group === "restore") return "Восстановление деталей";
  if (KIT_OUT[o]) return "Ремкомплекты";
  if (d && d.kind === "implant") return "Чипы имплантов";
  if (d && d.kind === "wmodule") return "Модули оружия";
  if (d && d.kind === "trap") return "Ловушки и мины";
  if (o.indexOf("armor:") === 0) return "Броня";
  if (o.indexOf("weapon:") === 0) return "Оружие";
  if (o.indexOf("ammo:") === 0) return "Батареи и боеприпасы";
  if (o === "plate") return "Улучшения";
  if (d && (d.heal || (d.fx && (d.fx.heal || d.fx.en || d.fx.cure)) || d.en || d.cure || d.detox || d.neuro || d.stopBleed)) return "Лечение и стимуляторы";
  return "Гранаты и устройства";
}
function avail() { var g = G(); return LAB.RECIPES.filter(function (rc) { return !rc.minL || rc.minL <= g.L; }); }
function partsTotal() { var g = G(); return LAB.PARTS.reduce(function (a, k) { return a + (g.inv[k] || 0); }, 0); }
function spareMods() { var g = G(); return MOD_ORDER.filter(function (k) { return (g.inv[MODS[k].item] || 0) > 0; }); }
/* «Назад» — в окно, из которого пришли (оно само обновится) */
function back() { return { label: "Назад", close: true, fn: function () {} }; }
/* В окно мастерской: закрыть то, что открыто поверх, и обновить его. */
function toRoot() {
  var ui = LAB.ui, n = 0;
  while (ui.top() && ui.top().title !== "Мастерская" && n++ < 8) if (!ui.closeTop(true)) break;
  var t = ui.top();
  if (t && t.title === "Мастерская") { if (t.rebuild) { t.items = t.rebuild(); t.i = Math.min(t.i, t.items.length - 1); } ui.render(); }
  else open();
}
function rootItems(b) {
  var g = G(), et = effTier(b), R = LAB.repair;
  var list = avail(), kn = list.filter(known);
  var items = GROUPS.map(function (nm) {
    var gl = kn.filter(function (rc) { return groupOf(rc) === nm; }), gu = list.filter(function (rc) { return !known(rc) && groupOf(rc) === nm; }).length;
    if (!gl.length && !gu) return null;
    var ready = gl.filter(function (rc) { return !check(rc, b); }).length;
    return { label: nm + ": можно собрать " + ready + " из " + gl.length + (gu ? ", неизвестных схем " + gu : ""), fn: function () { groupMenu(nm); } };
  }).filter(Boolean);
  if (spareMods().length) items.push({ label: "Установить модуль в оружие: в запасе " + spareMods().reduce(function (a, k) { return a + g.inv[MODS[k].item]; }, 0), fn: pickModule });
  if (g.weapons.some(function (w) { return used(w) > 0; })) items.push({ label: "Снять модуль с оружия", fn: unModMenu });
  items.push({ label: "Ремонт оружия" + (g.weapons.some(function (w) { return cond(w) < 100; }) ? ": есть изношенное" : ""), fn: repairMenu });
  items.push({ label: "Ремонт брони" + ((g.armors || []).some(function (a) { return LAB.armorCond(a) < 100; }) ? ": есть изношенная" : ""), fn: armorMenu });
  if (R && R.opened("engkit") > 0 && R.opened("engkit") < R.KITS.engkit.uses) items.push({ label: "Пополнить инженерный кейс: " + costText(refillCost(b)) + ". В начатом ремонтов " + R.opened("engkit") + " из " + R.KITS.engkit.uses, keep: true, fn: function () { refillKit(b); } });
  if (!b.drawer) items.push({ label: "Ящик под верстаком: обрезки и крепёж — забрать", keep: true, fn: function () { takeDrawer(b, cur.o); } });
  if (g.weapons.some(plan)) items.push({ label: "Ёмкость оружия: расточить отсек, удлинить магазин — до предела каждого вида", fn: bayMenu });
  if (et >= 4) items.push({ label: et >= 5 ? "Модернизация и перековка оружия и брони" : "Модернизация оружия и брони под глубину", fn: upgMenu });
  if (LAB.implants) items.push({ label: "Работа с имплантами: " + (et >= 2 ? "калибровка, настройка, извлечение, " : "") + "разбор чипов", fn: function () { LAB.implants.benchMenu(et); } });
  items.push({ label: "Разбор предметов на детали", fn: salvMenu });
  items.push({ label: "Исследование схем" + (et < 2 ? ": нужны станки" : ""), fn: researchMenu });
  if (b.dmg) items.push({ label: "Починить верстак: " + costText(fixCost(b)) + (g.inv.engkit > 0 ? ", или инженерным ремкомплектом — из инвентаря" : ""), keep: true, fn: function () { fixBench(b); } });
  items.push({ label: "Детали: где найти и для чего", fn: function () { partsGuide(); } });
  items.push({ label: "Уйти от верстака", fn: function () { A("play", "craft_off"); } });
  return items;
}
function open(o) {
  if (o) cur = { o: o, key: CUR().key };
  if (!cur) { say("Мастерская — у верстака."); return; }
  var b = bench(cur.o);
  var list = avail(), kn = list.filter(known), unk = list.length - kn.length;
  A("play", "workbench");
  if (LAB.tutor) LAB.tutor.ev("workbench");
  menu("Мастерская", rootItems(b), { intro: benchLine(b) + " Деталей у вас: " + partsTotal() + ". Рецептов: " + kn.length + (unk ? ", неизвестных схем: " + unk : "") + ".", rebuild: function () { return rootItems(b); } });
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
  var items = [];
  if (effTier(b) >= 4 && list.some(batchable)) items.push({ label: "Сборка", kind: "choice", options: [{ v: false, label: "по одной" }, { v: true, label: "партией из трёх, деталей на треть меньше" }],
    get: function () { return batch; }, set: function (v) { batch = v; var t = LAB.ui.top(); if (t && t.rebuild) { var i0 = t.i; t.items = t.rebuild(); t.i = i0; } } });
  items = items.concat(list.map(function (rc) { return { label: recLabel(rc, b), keep: true, fn: function () { gm().craft(rc); } }; }));
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
        if (nearBench()) toRoot();
      } };
  });
  items.push({ label: "Оставить модуль в запасе", fn: function () { say(cap1(M.n) + " — в запасе. Установить — у верстака, пункт «Установить модуль в оружие»."); if (nearBench()) toRoot(); } });
  menu("Установка модуля, шаг 2 из 2: оружие", items, { intro: intro || cap1(M.n) + "." });
}
function unModMenu() {
  var g = G();
  var items = g.weapons.map(function (w) {
    if (!used(w)) return null;
    return { label: w.name + ": " + modsLine(w), fn: function () {
      var mi = MOD_ORDER.filter(function (k) { return md(w, k); }).map(function (k) {
        return { label: "Снять: " + MODS[k].n, fn: function () { uninstall(w, k); A("play", "pry"); say(cap1(MODS[k].n) + " снят и лежит в запасе."); toRoot(); } };
      });
      menu("Снять модуль: " + w.name, mi.concat([back()]));
    } };
  }).filter(Boolean);
  menu("Снять модуль с оружия", items.concat([back()]));
}
function repairItems(b) {
  var g = G(), capC = repairCap(b);
  return g.weapons.map(function (w, i) {
    var need = repairCost(w, capC, b), c = Math.round(cond(w));
    return { label: w.name + ": состояние " + c + " из 100" + (need ? ". Ремонт до " + capC + ": " + costText(need) + (haveAll(need) ? "" : " — не хватает") : capC < 100 && c < 100 ? ". Больше даст только паяльная станция" : ". Исправно"),
      keep: true, fn: function () { repairWeapon(i, b); } };
  }).concat([back()]);
}
function repairMenu() {
  var b = bench(cur.o);
  menu("Ремонт оружия", repairItems(b), { keep: true, intro: effTier(b) >= 2 ? "Станки чинят до 100." : "Ручной инструмент чинит до " + repairCap(b) + ".", rebuild: function () { return repairItems(b); } });
}
function armorItems(b) {
  var g = G(), capC = repairCap(b);
  var items = (g.armors || []).map(function (a) {
    var need = armorCost(a, capC, b), c = Math.round(LAB.armorCond(a)), on = !!(g.armor && g.armor.id === a.id);
    return { label: a.name + (on ? ", на вас" : "") + ": состояние " + c + " из 100" + (need ? ". Ремонт до " + capC + ": " + costText(need) + (haveAll(need) ? "" : " — не хватает") : capC < 100 && c < 100 ? ". Больше дадут только станки" : ". Исправна"),
      keep: true, fn: function () { repairArmor(a, b); } };
  });
  if (!items.length) items.push({ label: "Брони у вас нет.", info: true, keep: true, fn: function () {} });
  return items.concat([back()]);
}
function armorMenu() {
  var b = bench(cur.o);
  menu("Ремонт брони", armorItems(b), { keep: true, intro: effTier(b) >= 2 ? "Станки чинят броню до 100." : "Ручной инструмент чинит броню до " + repairCap(b) + ".", rebuild: function () { return armorItems(b); } });
}
function salvItems() {
  var g = G(), b = bench(cur.o), items = [];
  Object.keys(SALV).concat(MOD_ORDER.map(function (k) { return MODS[k].item; })).forEach(function (id) {
    if (!(g.inv[id] > 0) || !LAB.ITEMS[id]) return;
    var st0 = salvText(id), hint = analyzeHint(id, b);
    items.push({ label: "Разобрать: " + LAB.ITEMS[id].n.toLowerCase() + " (" + g.inv[id] + ")" + (st0 ? " — " + st0 : " — вернёт часть деталей") + (hint ? "; разбор раскроет схему «" + hint.n + "»" : ""), keep: true, fn: function () { salvage(id, b); } });
  });
  if (g.ammo.energy > 0) items.push({ label: "Разобрать энергобатарею (" + g.ammo.energy + ") — даст аккумуляторную ячейку", keep: true, fn: salvageBattery });
  g.weapons.forEach(function (w, i) {
    if (w.id === "w_start_crowbar" || g.weapons.length <= 1) return;
    var hint = analyzeHint(w.base, b);
    /* (3.5) оружие в руках — с пометкой и вопросом, как при продаже: одно нажатие его не разберёт */
    var inHand = i === g.wi;
    items.push({ label: "Разобрать оружие: " + w.name + (inHand ? " (оно в руках)" : "") + " — даст " + (gm().scrapWeaponText ? gm().scrapWeaponText(w) : "детали") + (hint ? "; разбор раскроет схему «" + hint.n + "»" : ""), keep: !inHand, fn: function () {
      if (!inHand) { gm().scrapWeapon(g.weapons.indexOf(w)); return; }
      menu("Разобрать оружие в руках?", [
        { label: "Да, разобрать: " + w.name, fn: function () { gm().scrapWeapon(g.weapons.indexOf(w)); } },
        { label: "Нет, оставить", close: true, fn: function () {} }
      ]);
    } });
  });
  /* (3.5) и броня — здесь же, со всем, что даст разбор; надетую сначала снимают */
  g.armors.forEach(function (a) {
    if (g.armor && g.armor.id === a.id) return;
    items.push({ label: "Разобрать броню: " + a.name + " — даст " + (gm().scrapArmorText ? gm().scrapArmorText(a) : "детали"), keep: true, fn: function () { var i = g.armors.indexOf(a); if (i >= 0) gm().scrapArmor(i); } });
  });
  if (g.inv.proto > 0) items.push({ label: "Разобрать экспериментальный компонент (" + g.inv.proto + ")" + (effTier(b) >= 3 ? " — раскроет экспериментальную схему" : " — только на экспериментальном стенде"), keep: true, fn: function () { analyzeProto(b); } });
  if (!items.length) items.push({ label: "Разбирать нечего: устройств, запасных модулей, лишнего оружия и снятой брони нет.", info: true, keep: true, fn: function () {} });
  items.push(back());
  return items;
}
function salvMenu() { menu("Разбор предметов", salvItems(), { keep: true, rebuild: salvItems }); }
function researchMenu() {
  var b = bench(cur.o), et = effTier(b), g = G();
  var near = function (rc) { return !rc.minL || rc.minL <= Math.max(g.L + 2, 3); };
  var us = bpList("spec").filter(function (rc) { return !known(rc) && near(rc); }).length, ue = bpList("exp").filter(function (rc) { return !known(rc) && near(rc); }).length;
  var items = [
    { label: "Специализированная схема: " + costText(researchCost("spec", b)) + ". Неизвестных: " + us + (et < 2 ? ". Нужны станки" : ""), keep: true, fn: function () { research("spec", b); } },
    { label: "Экспериментальная схема: " + costText(researchCost("exp", b)) + ". Неизвестных: " + ue + (et < 3 ? ". Нужен экспериментальный стенд" : ""), keep: true, fn: function () { research("exp", b); } },
    back()
  ];
  menu("Исследование схем", items, { intro: "Известно схем: " + bpList().filter(known).length + " из " + bpList().filter(function (rc) { return known(rc) || near(rc); }).length + ". Новые схемы дают и документы, и инженеры, и разбор устройств, и установки глубин." });
}
/* Справочник деталей: сколько есть, где взять, для каких схем. */
function uses(k) {
  /* (2.0) только схемы своей глубины — вашей или самой детали (и чуть глубже);
     до десятого уровня о рецептах глубин для простых деталей — ни слова */
  var kn = [], unk = 0, L0 = G().L, pd = LAB.PART_DEPTH[k] || 1, L = Math.max(L0, pd + 5);
  if (L0 < 10 && pd < 10) L = Math.min(L, 9);
  LAB.RECIPES.forEach(function (rc) { if (!rc.need || !rc.need[k] || (rc.minL && rc.minL > L)) return; if (known(rc)) kn.push(rc.n.toLowerCase()); else unk++; });
  return { kn: kn, unk: unk };
}
function partLine(k) {
  var g = G(), d = LAB.ITEMS[k], u = uses(k);
  return d.n + ": у вас " + (g.inv[k] || 0) + ". " + (u.kn.length ? "Нужна для: " + u.kn.slice(0, 6).join(", ") + (u.kn.length > 6 ? " и ещё " + (u.kn.length - 6) : "") + (u.unk ? "; и для неизвестных пока схем: " + u.unk : "") + "." : u.unk ? "Нужна для схем, которые вы ещё не знаете: " + u.unk + "." : "Продаётся торговцам.") + " Где найти: " + srcOf(k) + ".";
}
function partsGuide() {
  var g = G();
  var list = LAB.PARTS.filter(function (k) { return LAB.ITEMS[k] && ((g.inv[k] || 0) > 0 || (LAB.PART_DEPTH[k] || 1) <= g.L); });
  menu("Детали: где найти и для чего", list.map(function (k) { return { label: partLine(k), keep: true, fn: function () { say(partLine(k)); } }; }).concat([back()]));
}

LAB.workshop = {
  salvText: salvText, /* (3.5) что вернёт разбор вещи — словами */
  open: open, bench: bench, effTier: effTier, benchLine: benchLine, check: check, clsOf: clsOf, known: known, learn: learn, unknownPick: unknownPick,
  fromDoc: fromDoc, npcTip: npcTip, isEng: isEng, depthFind: depthFind, needText: needText, afterCraft: afterCraft,
  beforeShot: beforeShot, afterShot: afterShot, accBonus: accBonus, dmgK: dmgK, pierce: pierce, reloadK: reloadK, gapK: gapK, loud: loud,
  cond: cond, compat: compat, install: install, uninstall: uninstall, slots: slots, used: used, modsLine: modsLine, profile: profile,
  repairWeapon: repairWeapon, repairCost: repairCost, repairArmor: repairArmor, armorCost: armorCost, refillKit: refillKit, takeDrawer: takeDrawer,
  needOf: needOf, craftBonus: craftBonus, craftQual: craftQual, craftTimes: craftTimes, specName: specName, SPEC: SPEC, shopMin: shopMin,
  modernize: modernize, reforge: reforge, recalc: recalc, bayBore: bayBore, capMax: capMax, capLine: capLine, fixUpg: fixUpg, GONE_MODS: GONE_MODS, setBatch: function (v) { batch = !!v; }, salvage: salvage, salvageBattery: salvageBattery, onScrap: onScrap,
  analyzeProto: analyzeProto, research: research, fixBench: fixBench, throwDevice: throwDevice, drops: drops, partLine: partLine, partsGuide: partsGuide,
  srcOf: srcOf, uses: uses, heats: heats, hmax: hmax, MODS: MODS, MOD_ORDER: MOD_ORDER, TIER: TIER,
  _at: function (o) { cur = o ? { o: o, key: CUR().key } : null; }
};
})();
