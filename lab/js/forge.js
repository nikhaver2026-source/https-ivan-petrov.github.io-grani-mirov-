/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — своё оружие, регулятор мощности, ядра (после 4.6).
   По книге Эдуарда Полякова «Квази Эпсилон»: лучшее оружие инженера —
   то, что придумано самим. Конструктор у верстака: пять семейств из узлов —
   рельсовое ружьё (ствол с ресурсом, конденсаторы, питание, прицел,
   сердечник), кумулятивная пика (древко, головка под расходные заряды,
   хват), СВЧ-излучатель (магнетроны, раструб, питание: выжигает электронику
   машин), энергоклинок (кромка, питание, насечка; без заряда — тупая полоса),
   плазмомёт (катушки, сопло, кассета). Семейства открывает мастерство или
   изучение похожих находок (mastery.js), лучшие узлы — изучение находок,
   узлы Нижних — оснастка глубин. Первая своя конструкция — плюс один к
   разуму. «Перебрать конструкцию» — заменить узел, половина деталей старого
   узла возвращается, оружие получает следующую версию.
   Регулятор мощности — у всего оружия на батареях: экономно, обычно, форсаж.
   Ядра: нейроядро с машин, биоядро с тварей; вживлённое ядро с директивами
   растёт за победы до десятой ступени, на пятой перерождается, без побед
   голодает. Блок управления машины — для дрона-спутника (drone.js).
   Новые вещи — свой раздел LAB.ITEMS (kind "eng"): в список деталей,
   на полки, в добычу этажей и в генерацию мира они не попадают.
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
function plural(n, a, b, c) { return gm().plural ? gm().plural(n, a, b, c) : a; }
function W() { return LAB.workshop; }
function MS() { return LAB.mastery; }
function absMin() { var g = G(); return ((g.day || 1) - 1) * 1440 + (g.min || 0); }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

/* ════════ НОВЫЕ ВЕЩИ ════════ */
var ITEMS = {
  kv_ctrl: { n: "Блок управления машины", icon: "🧠", desc: "Мозг и связь небольшого робота ОКО, снятые с обломков: процессор, приёмник, гироскоп. Из него у верстака собирают своего дрона-спутника — машину, которая слушается вас." },
  kv_ncore: { n: "Нейроядро", icon: "💠", desc: "Самообучающийся узел сильной машины ОКО. Вживлённое в оружие у верстака опытной серии, оно растёт вместе с ним — от победы к победе." },
  kv_bcore: { n: "Биоядро", icon: "🫀", desc: "Живой узел сильной твари — сгусток ткани, что не умирает и тянется к металлу. Вживлённое в оружие, растёт и питается победами; голодное — слабеет." },
  kv_hcharge: { n: "Кумулятивный заряд", icon: "💥", desc: "Медная воронка во взрывчатке на контактном взрывателе — головка для кумулятивной пики. Удар с зарядом пробивает почти любую броню; заряд — на один удар." },
  kv_barrel: { n: "Запасной ствол", icon: "🔩", desc: "Ствол рельсового ружья с изолированными рельсами. Выработанный ствол меняют на запасной за три секунды — прямо в бою." }
};
for (var ik in ITEMS) { var it0 = ITEMS[ik]; it0.kind = "eng"; it0.cat = "eng"; it0.nosell = 1; it0.price = { kv_ctrl: 60, kv_ncore: 120, kv_bcore: 120, kv_hcharge: 18, kv_barrel: 25 }[ik]; if (!LAB.ITEMS[ik]) LAB.ITEMS[ik] = it0; }
/* Рецепты: заряды, стволы и сами ядра (дорого, на станке с ПУ). Направление мастерства — forge. */
var RC = [
  { id: "kv_hcharge", n: "Кумулятивный заряд", out: "kv_hcharge", need: { scrap: 1, reagent: 2, wire: 1 }, cls: "spec", forge: "mech", desc: "Головка для кумулятивной пики: воронка, взрывчатка, контактный взрыватель." },
  { id: "kv_barrel", n: "Запасной ствол рельсового ружья", out: "kv_barrel", need: { scrap: 3, magnet: 1, ceramic: 1 }, cls: "spec", forge: "mech", desc: "Изолированные рельсы в кожухе: выработанный ствол меняют на него." },
  { id: "kv_ncore", n: "Нейроядро", out: "kv_ncore", need: { chip: 4, supercond: 1, proto: 1 }, cls: "cnc", forge: "design", minL: 8, desc: "Самообучающийся узел: дорого, но растёт вместе с оружием." },
  { id: "kv_bcore", n: "Биоядро", out: "kv_bcore", need: { gel: 5, reagent: 3, proto: 1 }, cls: "cnc", forge: "design", minL: 8, desc: "Живой узел из геля и реактивов: растёт и питается победами." }
];
RC.forEach(function (rc) { if (!LAB.RECIPES.some(function (r) { return r.id === rc.id; })) LAB.RECIPES.push(rc); });

/* ════════ СЕМЕЙСТВА СВОЕГО ОРУЖИЯ ════════
   База — свой вид в LAB.WEAPONS с src "craft": ни в добычу, ни на прилавок не попадает. */
var BASES = {
  kv_rail: { n: "рельсовое ружьё", g: "n", cls: "gauss", ammo: "energy", dt: "gauss", dmg: 26, rng: 12, spread: 0, cap: 6, cd: 1100, snd: "kv_rail", sndRate: 1, pierce: true, src: "craft", desc: "Своя конструкция: изолированные рельсы, батарея конденсаторов и прицел. Прошивает насквозь всех на линии; перед выстрелом слышна зарядка конденсаторов — её слышат и враги." },
  kv_pike: { n: "кумулятивная пика", g: "f", cls: "melee", ammo: "none", dt: "kinetic", dmg: 13, rng: 1, spread: 1, cap: 0, cd: 800, snd: "w_melee", src: "craft", desc: "Своя конструкция: древко и головка под кумулятивные заряды. Удар с зарядом пробивает почти любую броню и сносит тяжёлую машину; без заряда — просто тяжёлое копьё." },
  kv_mw: { n: "СВЧ-излучатель", g: "m", cls: "magnetron", ammo: "energy", dt: "emp", dmg: 12, rng: 6, spread: 1, cap: 8, cd: 700, snd: "kv_mw", stunMech: 1, src: "craft", desc: "Своя конструкция: магнетроны в общем раструбе. Выжигает электронику машин — глушит и ослепляет их; по живым почти бесполезен, экранированных не берёт." },
  kv_blade: { n: "энергоклинок", g: "m", cls: "melee", ammo: "energy", dt: "energy", dmg: 15, rng: 1, spread: 1, cap: 40, cd: 550, snd: "kv_blade", src: "craft", desc: "Своя конструкция: кромка-излучатель на рукояти. С зарядом гудит и режет броню; без заряда — тупая полоса металла, но бить ею можно." },
  kv_plasma: { n: "плазмомёт", g: "m", cls: "plasma", ammo: "energy", dt: "plasma", dmg: 18, rng: 5, spread: 1, cap: 10, cd: 850, snd: "kv_plasma", src: "craft", desc: "Своя конструкция: катушки разгоняют плазму из кассеты. Жжёт живое, широким соплом задевает соседей; изношенный на двух парах катушек может выбросить плазму на стрелка." }
};
for (var bk in BASES) { if (!LAB.WEAPONS[bk]) LAB.WEAPONS[bk] = BASES[bk]; if (LAB.MODEL && !LAB.MODEL[bk]) LAB.MODEL[bk] = "СК"; }
/* Звук выстрела: новая запись, а пока её нет — близкая из прежних. */
var SND_ALT = { kv_rail: "w_gauss", kv_mw: "w_magnetron", kv_blade: "w_vibro", kv_plasma: "w_plasma" };
function fixSnd() { var S = LAB.SND; if (!S) return; for (var k in SND_ALT) { var b = LAB.WEAPONS[k]; if (b && !S[b.snd]) b.snd = SND_ALT[k]; } }
fixSnd();

/* Узлы: опция — { n, d, need, req, k:{…поправки} }.
   req: tier — ступень оснастки; step — {направление: ступень}; mind — разум; study — изученный узел; deep — оснастка Нижних. */
var FAM = {
  rail: { n: "рельсовое ружьё", base: "kv_rail", tier: 3, why: "открывает конструирование первой ступени или изученная гаусс-винтовка",
    nodes: [
      { id: "barrel", n: "Ствол", opts: [
        { id: "short", n: "короткий", d: "дальность 9, урон чуть меньше, ресурс 60 выстрелов", need: { scrap: 3, magnet: 1 }, k: { rng: 9, dmg: 0.95, res: 60 } },
        { id: "long", n: "длинный", d: "дальность 13, урон больше на двенадцатую часть, ресурс 45 выстрелов", need: { scrap: 4, magnet: 2 }, k: { rng: 13, dmg: 1.08, res: 45 } },
        { id: "spiral", n: "спиральный", d: "дальность 13, урон больше на пятую часть, ресурс 70 выстрелов", need: { scrap: 3, magnet: 2, ceramic: 1 }, req: { study: "spiral" }, k: { rng: 13, dmg: 1.2, res: 70 } },
        { id: "alloy", n: "из сплава Нижних", d: "дальность 14, урон больше на четверть, ресурс 110 выстрелов", need: { dp_alloy: 1, magnet: 2 }, req: { tier: 6 }, k: { rng: 14, dmg: 1.25, res: 110 } }
      ] },
      { id: "caps", n: "Конденсаторы", opts: [
        { id: "small", n: "малый блок", d: "выстрел раз в 1,1 секунды", need: { cap: 4, wire: 1 }, k: { dmg: 1, cd: 1100 } },
        { id: "big", n: "большой блок", d: "урон больше на треть, выстрел раз в 1,7 секунды, выстрелов в заряде меньше", need: { cap: 7, wire: 2 }, k: { dmg: 1.35, cd: 1700, cap: 0.8 } },
        { id: "cascade", n: "каскад", d: "урон больше на две трети, выстрел раз в 2,4 секунды, выстрелов вдвое меньше", need: { cap: 10, wire: 2, supercond: 1 }, req: { step: { design: 3 } }, k: { dmg: 1.65, cd: 2400, cap: 0.6 } }
      ] },
      { id: "power", n: "Питание", opts: [
        { id: "bat", n: "энергобатарея", d: "обычный магазин", need: { cell: 1, wire: 1 }, k: { cap: 1 } },
        { id: "bay", n: "ёмкий отсек", d: "выстрелов в заряде в полтора раза больше", need: { powercell: 1, wire: 1 }, k: { cap: 1.5 } },
        { id: "exo", n: "кабель от каркаса", d: "без батарей: каждый выстрел — четыре единицы заряда каркаса", need: { wire: 3, relay: 1 }, k: { exo: 4 } }
      ] },
      { id: "sight", n: "Прицел", opts: [
        { id: "open", n: "открытый", d: "без прибавок", need: {}, k: {} },
        { id: "laser", n: "целеуказатель", d: "точность выше", need: { lens: 1, chip: 1 }, k: { acc: 0.06 } },
        { id: "psi", n: "упреждающий нейроприцел", d: "точность намного выше и чаще критический удар; нужен интеллект 15", need: { optic: 1, chip: 2 }, req: { mind: 15 }, k: { acc: 0.12, crit: 0.05 } }
      ] },
      { id: "slug", n: "Сердечник", mode: true, opts: [
        { id: "ap", n: "бронебойный", d: "пробивает броню машин, по живым слабее", need: {}, k: { ap: 0.45, bio: 0.85 } },
        { id: "stop", n: "останавливающий", d: "по живым сильнее и отбрасывает, броню почти не пробивает", need: {}, k: { ap: 0.1, bio: 1.15, knock: 1 } }
      ] }
    ] },
  pike: { n: "кумулятивная пика", base: "kv_pike", tier: 2, why: "открыта всегда: самая простая своя конструкция",
    nodes: [
      { id: "shaft", n: "Древко", opts: [
        { id: "pipe", n: "труба", d: "просто и надёжно", need: { scrap: 3 }, k: { dmg: 1 } },
        { id: "comp", n: "композитное", d: "удар сильнее на десятую часть, изнашивается медленнее", need: { scrap: 2, ceramic: 1, panel: 1 }, k: { dmg: 1.1, wear: 0.7 } }
      ] },
      { id: "head", n: "Головка", opts: [
        { id: "cum", n: "под кумулятивные заряды", d: "удар с зарядом — втрое с половиной сильнее и пробивает броню; заряд на удар", need: { scrap: 1, wire: 2, relay: 1 }, k: { cum: 1 } },
        { id: "sting", n: "тройное жало", d: "без зарядов: удар чуть сильнее и пускает кровь живым", need: { scrap: 2 }, k: { dmg: 1.15, bleed: 5 } }
      ] },
      { id: "grip", n: "Хват", opts: [
        { id: "plain", n: "простой", d: "без прибавок", need: {}, k: {} },
        { id: "latch", n: "защёлка и подсумок", d: "удары чаще на шестую часть", need: { servo: 1, scrap: 1 }, k: { cd: 0.85 } },
        { id: "stop", n: "упор", d: "удар отбрасывает врага на шаг", need: { scrap: 2 }, k: { knock: 1 } }
      ] }
    ] },
  mw: { n: "СВЧ-излучатель", base: "kv_mw", tier: 3, why: "открывает электрика второй ступени или изученное магнетронное оружие",
    nodes: [
      { id: "mags", n: "Магнетроны", opts: [
        { id: "m2", n: "два", d: "обычная сила", need: { magnet: 2, cap: 2, wire: 1 }, k: { dmg: 1 } },
        { id: "m4", n: "четыре", d: "сильнее почти в полтора раза, выстрелов в заряде меньше", need: { magnet: 4, cap: 3, wire: 2 }, k: { dmg: 1.45, cap: 0.75 } },
        { id: "m8", n: "восемь", d: "вдвое сильнее, выстрелов вдвое меньше", need: { magnet: 7, cap: 5, wire: 3, supercond: 1 }, req: { study: "m8" }, k: { dmg: 2, cap: 0.5 } },
        { id: "reso", n: "резонансные Нижних", d: "сильнее вдвое с лишним, выстрелов меньше", need: { dp_reed: 1, magnet: 3 }, req: { tier: 6 }, k: { dmg: 2.2, cap: 0.7 } }
      ] },
      { id: "horn", n: "Раструб", opts: [
        { id: "narrow", n: "узкий", d: "дальность 6, одна цель", need: { scrap: 2 }, k: { rng: 6 } },
        { id: "wide", n: "широкий", d: "дальность 3, задевает и машины рядом с целью", need: { scrap: 3, panel: 1 }, k: { rng: 3, area: 1 } }
      ] },
      { id: "power", n: "Питание", opts: [
        { id: "bat", n: "энергобатарея", d: "обычный магазин", need: { cell: 1, wire: 1 }, k: { cap: 1 } },
        { id: "exo", n: "кабель от каркаса", d: "без батарей: каждый выстрел — три единицы заряда каркаса", need: { wire: 3, relay: 1 }, k: { exo: 3 } }
      ] }
    ] },
  blade: { n: "энергоклинок", base: "kv_blade", tier: 3, why: "открывает энергетика второй ступени или изученный энергетический клинок",
    nodes: [
      { id: "edge", n: "Кромка", opts: [
        { id: "short", n: "короткая", d: "удар раз в полсекунды", need: { scrap: 2, ceramic: 1 }, k: { dmg: 1, cd: 500 } },
        { id: "long", n: "длинная", d: "удар сильнее на четверть, реже", need: { scrap: 3, ceramic: 2 }, k: { dmg: 1.25, cd: 700 } }
      ] },
      { id: "power", n: "Питание", opts: [
        { id: "cell", n: "ячейка", d: "сорок ударов на энергобатарее; без заряда — тупая полоса", need: { cell: 1, wire: 2 }, k: { cap: 1 } },
        { id: "exo", n: "кабель от каркаса", d: "удар сильнее; каждый удар — единица заряда каркаса", need: { wire: 3, relay: 1 }, k: { exo: 1, dmg: 1.15 } }
      ] },
      { id: "notch", n: "Насечка", opts: [
        { id: "smooth", n: "гладкая", d: "режет броню", need: {}, k: { ap: 0.35 } },
        { id: "serr", n: "зубчатая", d: "раны живых кровоточат", need: { scrap: 1 }, k: { ap: 0.15, bleed: 5 } },
        { id: "nerve", n: "с нитью Нижних", d: "разряд перескакивает на соседа", need: { dp_nerve: 1 }, req: { tier: 6 }, k: { ap: 0.3, chain: 1 } }
      ] }
    ] },
  plasma: { n: "плазмомёт", base: "kv_plasma", tier: 4, why: "открывает энергетика третьей ступени или изученное плазменное оружие",
    nodes: [
      { id: "coils", n: "Катушки разгона", opts: [
        { id: "c2", n: "две пары", d: "дальность 4, слабее; изношенный может выбросить плазму на стрелка", need: { magnet: 2, wire: 2 }, k: { rng: 4, dmg: 0.9, risk: 1 } },
        { id: "c4", n: "четыре пары", d: "дальность 6, сильнее на десятую часть", need: { magnet: 4, wire: 3 }, k: { rng: 6, dmg: 1.1 } },
        { id: "c4c", n: "четыре пары с охлаждением", d: "дальность 6, сильнее, греется меньше", need: { magnet: 4, wire: 3, ceramic: 1 }, req: { study: "c4c" }, k: { rng: 6, dmg: 1.15, heat: 0.6 } },
        { id: "valve", n: "с клапаном Нижних", d: "дальность 7, сильнее на треть, почти не греется", need: { dp_valve: 1, magnet: 3 }, req: { tier: 6 }, k: { rng: 7, dmg: 1.3, heat: 0.5 } }
      ] },
      { id: "nozzle", n: "Сопло", opts: [
        { id: "narrow", n: "узкое", d: "одна цель", need: { scrap: 1 }, k: {} },
        { id: "wide", n: "широкое", d: "задевает соседей", need: { scrap: 2, ceramic: 1 }, k: { area: 1, dmg: 0.9 } }
      ] },
      { id: "cas", n: "Кассета", opts: [
        { id: "std", n: "обычная", d: "обычный магазин", need: { cell: 1 }, k: { cap: 1 } },
        { id: "dbl", n: "сдвоенная", d: "выстрелов в заряде больше в полтора раза с лишним", need: { powercell: 1 }, k: { cap: 1.6 } }
      ] }
    ] }
};
var FAM_ORDER = ["pike", "rail", "mw", "blade", "plasma"];
var NAMES = {
  rail: ["Струна", "Шило", "Гвоздь", "Спица", "Звон", "Дальний", "Рельс", "Прямой"],
  pike: ["Таран", "Клюв", "Кол", "Бур", "Гарпун", "Пробой"],
  mw: ["Зной", "Марево", "Сушь", "Жар", "Гул", "Морок"],
  blade: ["Резак", "Луч", "Коготь", "Серп", "Полоса", "Кромка"],
  plasma: ["Горн", "Факел", "Зарево", "Вспышка", "Солнце", "Пекло"]
};

/* Состояние: открытые семейства и узлы, черновики. */
function F() { var g = G(); if (!g.forge) g.forge = { unl: {}, node: {}, draft: {}, n: 0 }; var f = g.forge; if (!f.unl) f.unl = {}; if (!f.node) f.node = {}; if (!f.draft) f.draft = {}; return f; }
function step(k) { return MS() ? MS().step(k) : 0; }
function stat(k) { return LAB.heroStat ? LAB.heroStat(k) : (G()[k] || 10); }
function famOpen(id) {
  var fm = FAM[id], f = F();
  if (!fm) return false;
  if (f.unl[id]) return true;
  if (id === "pike") return true;
  if (id === "rail") return step("design") >= 1;
  if (id === "mw") return step("elec") >= 2;
  if (id === "blade") return step("enrg") >= 2;
  if (id === "plasma") return step("enrg") >= 3;
  return false;
}
function benchTier() { var w = W(), b = w && w.near ? w.near() : null; return b && w ? w.effTier(b) : 0; }
/* Почему опция недоступна: "" — доступна. */
function optWhy(o, t) {
  var r = o.req || {};
  if (r.tier && (t == null ? benchTier() : t) < r.tier) return "нужна оснастка Нижних";
  if (r.step) for (var k in r.step) if (step(k) < r.step[k]) return "нужно мастерство: " + MS().DIRS[k].n + ", ступень " + r.step[k];
  if (r.mind && stat("mind") < r.mind) return "нужен интеллект " + r.mind;
  if (r.study && !F().node[r.study]) return "откроет изучение похожей находки";
  return "";
}
/* Изучение находки (mastery.study) открывает семейства и узлы. */
var STUDY_UNLOCK = { gauss: ["rail", "spiral"], magnetron: ["mw", "m8"], plasma: ["plasma", "c4c"] };
function unlockBy(w) {
  var b = LAB.WEAPONS[w.base] || {}, f = F(), out = [];
  var u = STUDY_UNLOCK[b.cls];
  if (b.cls === "melee" && (b.dt === "energy" || b.dt === "phase" || b.dt === "shock")) u = ["blade", ""];
  if (!u) return "";
  if (!f.unl[u[0]]) { f.unl[u[0]] = 1; out.push("своя конструкция «" + FAM[u[0]].n + "»"); }
  if (u[1] && !f.node[u[1]]) { f.node[u[1]] = 1; var nm = ""; FAM[u[0]].nodes.forEach(function (nd) { nd.opts.forEach(function (o) { if (o.id === u[1]) nm = nd.n.toLowerCase() + " — " + o.n; }); }); out.push("узел «" + nm + "»"); }
  return out.length ? "Для своих конструкций открыто: " + out.join(", ") + "." : "";
}

/* ════════ РАСЧЁТ СВОЕЙ КОНСТРУКЦИИ ════════ */
function optOf(fam, nodeId, optId) { var nd = FAM[fam].nodes.filter(function (n) { return n.id === nodeId; })[0]; return nd ? nd.opts.filter(function (o) { return o.id === optId; })[0] || nd.opts[0] : null; }
function defaults(fam) { var d = {}; FAM[fam].nodes.forEach(function (nd) { d[nd.id] = nd.opts[0].id; }); return d; }
function statsOf(fam, nodes) {
  var b = BASES[FAM[fam].base], s = { dmg: 1, rng: b.rng, cd: b.cd, cap: 1, acc: 0, crit: 0, ap: 0, bio: 1, wear: 1, heat: 1, exo: 0 };
  FAM[fam].nodes.forEach(function (nd) {
    var o = optOf(fam, nd.id, nodes[nd.id]); if (!o) return;
    var k = o.k || {};
    if (k.dmg) s.dmg *= k.dmg;
    if (k.rng) s.rng = k.rng;
    if (k.cd) s.cd = k.cd < 2 ? s.cd * k.cd : k.cd;
    if (k.cap) s.cap *= k.cap;
    if (k.acc) s.acc += k.acc;
    if (k.crit) s.crit += k.crit;
    if (k.ap != null) s.ap = k.ap;
    if (k.bio) s.bio = k.bio;
    if (k.wear) s.wear *= k.wear;
    if (k.heat) s.heat *= k.heat;
    if (k.exo) s.exo = k.exo;
    ["res", "knock", "area", "bleed", "chain", "cum", "risk"].forEach(function (f) { if (k[f]) s[f] = k[f]; });
  });
  return s;
}
function needOf(fam, nodes) {
  var n = {};
  FAM[fam].nodes.forEach(function (nd) { var o = optOf(fam, nd.id, nodes[nd.id]); if (o) for (var k in o.need) n[k] = (n[k] || 0) + o.need[k]; });
  n.scrap = (n.scrap || 0) + 2; /* корпус и крепёж */
  return n;
}
/* Применить узлы к экземпляру (урон по уровню, качеству и редкости — как у makeWeapon). */
function apply(w) {
  var o = w.own, fam = o && FAM[o.fam];
  if (!fam) return w;
  var b = BASES[fam.base], st = statsOf(o.fam, o.nodes), lvl = w.lvl || 1;
  var k = (1 + 0.14 * (lvl - 1)) * LAB.RANK_MULT[w.rank || 0] * LAB.QUAL_MULT[w.qual == null ? 2 : w.qual];
  w.dmg0 = b.dmg * k * st.dmg;
  w.rng0 = st.rng;
  w.cdOwn = Math.round(st.cd);
  w.dt = b.dt;
  if (st.exo) { w.ammo = "none"; w.cap0 = 0; w.cap = 0; w.charge = 0; }
  else { w.ammo = b.ammo; w.cap0 = b.cap ? Math.max(1, Math.round(LAB.weaponCap(fam.base, w.rank || 0, lvl, w.qual == null ? 2 : w.qual) * st.cap)) : 0; if (!w.cap0) { w.cap = 0; w.charge = 0; } }
  o.capK = st.cap; o.exo = st.exo || 0;
  w.apierce = st.ap;
  w.crit = (b.crit || 0) + st.crit + (w.core ? coreCrit(w) : 0);
  w.knock = st.knock ? true : undefined;
  w.area = st.area ? true : undefined;
  w.bleed = st.bleed || undefined;
  w.chain = st.chain || undefined;
  if (o.fam === "rail") { o.res = st.res || 50; if (w.barrel == null || w.barrel > o.res) w.barrel = o.res; }
  if (W()) W().recalc(w);
  if (!w.cap0) { w.cap = 0; w.charge = 0; }
  rename(w);
  return w;
}
function capFix(w, cap0) { var o = w.own; return o && o.capK && cap0 ? Math.max(1, Math.round(cap0 * o.capK)) : cap0; }
function rename(w) {
  var o = w.own; if (!o || !FAM[o.fam]) return;
  var b = BASES[FAM[o.fam].base];
  w.name = LAB.QUAL[b.g][w.qual == null ? 2 : w.qual] + " " + b.n + (o.nm ? " «" + o.nm + "»" : "") + (w.core && w.core.lvl > 1 ? ", ядро — ступень " + w.core.lvl : "");
}
function statText(fam, nodes, w) {
  var b = BASES[FAM[fam].base], st = statsOf(fam, nodes), lvl = w ? w.lvl : LAB.foeLevel(G().L, G().F), q = w ? w.qual : 2;
  var d = Math.max(1, Math.round(b.dmg * (1 + 0.14 * (lvl - 1)) * LAB.QUAL_MULT[q] * st.dmg * LAB.wGrowK({ lvl: lvl })));
  var cap = st.exo ? 0 : b.cap ? Math.max(1, Math.round(LAB.weaponCap(FAM[fam].base, 1, lvl, q) * st.cap)) : 0;
  var s = "урон около " + d + " (" + (LAB.DTYPE_N[b.dt] || b.dt) + "), " + (st.rng <= 1 ? "ближний бой" : "дальность " + st.rng) + ", " + (st.cd / 1000).toFixed(1).replace(".", ",") + " с между " + (st.rng <= 1 ? "ударами" : "выстрелами");
  if (st.exo) s += ", питание от каркаса — " + st.exo + " " + plural(st.exo, "единица", "единицы", "единиц") + " заряда на " + (st.rng <= 1 ? "удар" : "выстрел");
  else if (cap) s += ", " + cap + " " + plural(cap, "выстрел", "выстрела", "выстрелов") + " на батарею";
  if (st.res) s += ", ресурс ствола " + st.res + " выстрелов";
  if (st.ap) s += ", бронебойность " + Math.round(st.ap * 100) + "%";
  if (st.acc) s += ", точность выше";
  if (st.cum) s += ", с кумулятивным зарядом — втрое с половиной сильнее и сквозь броню";
  if (st.area) s += ", задевает соседей";
  if (st.bleed) s += ", раны кровоточат";
  if (st.knock) s += ", отбрасывает";
  if (st.chain) s += ", разряд перескакивает";
  return s;
}

/* ════════ КОНСТРУКТОР У ВЕРСТАКА ════════ */
function draft(fam) { var f = F(); if (!f.draft[fam]) f.draft[fam] = defaults(fam); var d = f.draft[fam]; FAM[fam].nodes.forEach(function (nd) { if (!d[nd.id] || !optOf(fam, nd.id, d[nd.id])) d[nd.id] = nd.opts[0].id; }); return d; }
function famWhy(id) {
  var fm = FAM[id], t = benchTier();
  if (!famOpen(id)) return "закрыто: " + fm.why;
  if (t < fm.tier) return "нужен верстак ступени " + fm.tier + " и выше";
  return "";
}
function constructMenu() {
  var items = FAM_ORDER.map(function (id) {
    var why = famWhy(id);
    return { label: cap1(FAM[id].n) + (why ? " — " + why : " — собрать свою"), fn: function () { if (why && !famOpen(id)) { LAB.UI.error(); say(cap1(FAM[id].n) + ": " + why + "."); return; } famMenu(id); } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Своё оружие: конструктор", items, { intro: "Своя конструкция собирается из узлов. Выберите семейство, затем узлы; итог и детали звучат перед сборкой." });
}
function famItems(fam) {
  var d = draft(fam), t = benchTier(), need = needOf(fam, d), items = [];
  FAM[fam].nodes.forEach(function (nd) {
    var o = optOf(fam, nd.id, d[nd.id]);
    items.push({ label: nd.n + ": " + o.n + " — " + o.d + (nd.mode ? ". Переключается и после сборки" : ""), fn: function () { optMenu(fam, nd); } });
  });
  var lack = W() ? lackText(need) : "";
  items.push({ label: "Итог: " + statText(fam, d) + "." + forecastOwn(fam), info: true, keep: true, fn: function () {} });
  items.push({ label: "Собрать: " + W().costText(need) + (lack ? ". Не хватает: " + lack : "") + (t < FAM[fam].tier ? ". Нужен верстак ступени " + FAM[fam].tier : ""), keep: true, fn: function () { build(fam); } });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function famMenu(fam) { menu(cap1(FAM[fam].n) + ": узлы", famItems(fam), { keep: true, rebuild: function () { return famItems(fam); } }); }
function optMenu(fam, nd) {
  var d = draft(fam), items = nd.opts.map(function (o) {
    var why = optWhy(o);
    return { label: o.n + (d[nd.id] === o.id ? " — выбрано" : "") + ": " + o.d + (W().costText(o.need) ? ". Детали: " + W().costText(o.need) : "") + (why ? ". Сейчас нельзя: " + why : ""), fn: function () {
      if (why) { LAB.UI.error(); say(o.n + ": " + why + "."); return; }
      d[nd.id] = o.id; snd("pwr_click", "ui_click"); say(nd.n + ": " + o.n + ".");
    } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu(nd.n, items);
}
/* Прогноз своей конструкции — с третьей ступени конструирования. */
function forecastOwn(fam) {
  if (!MS() || step("design") < 3) return "";
  var rc = { id: "own_" + fam, n: FAM[fam].n, out: "weapon:" + FAM[fam].base, forge: "design", cls: "own" }, o = { dir: "design", key: "own:" + fam, cls: "own" };
  var p = MS().upChance(rc, "w", W().near(), o), fp = MS().flawChance(rc, o), g = BASES[FAM[fam].base].g;
  return " Прогноз: " + LAB.QUAL[g][2].toLowerCase() + (p > 0.05 ? (p >= 0.5 ? ", скорее " : ", бывает и ") + LAB.QUAL[g][3].toLowerCase() : "") + (fp < 0.03 ? ", брак редок." : fp < 0.08 ? ", брак возможен." : ", брак вероятен.");
}
function lackText(need) { var g = G(), s = []; for (var k in need) { var h = g.inv[k] || 0; if (h < need[k]) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + h + " из " + need[k]); } return s.join(", "); }
/* Собрать свою конструкцию. */
function build(fam, opts) {
  opts = opts || {};
  var fm = FAM[fam], d = draft(fam), t = benchTier(), g = G();
  if (!famOpen(fam)) { LAB.UI.error(); say(cap1(fm.n) + ": " + fm.why + "."); return null; }
  if (t < fm.tier) { LAB.UI.error(); say(cap1(fm.n) + " собирается только у верстака ступени " + fm.tier + " и выше."); return null; }
  for (var nk in d) { var o = optOf(fam, nk, d[nk]), why = optWhy(o, t); if (why) { LAB.UI.error(); say("Узел «" + o.n + "»: " + why + "."); return null; } }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { LAB.UI.error(); say("Не до своей конструкции: рядом враг."); return null; }
  var need = needOf(fam, d), Wk = W();
  if (!Wk.haveAll(need)) { LAB.UI.error(); say("Не хватает: " + lackText(need) + "."); return null; }
  Wk.take(need);
  var ds = step("design"), mins = Math.max(5, Math.round(12 * (1 - 0.05 * ds))), b0 = Wk.near();
  if (gm().advanceTime) gm().advanceTime(mins);
  var body = g.body; if (body) body.wake = Math.max(0, body.wake - 6);
  var w = LAB.makeWeapon(fm.base, LAB.foeLevel(g.L, g.F), 1, 2);
  w.own = { fam: fam, nodes: JSON.parse(JSON.stringify(d)), v: 1, nm: "" };
  w.mk = 1;
  /* качество и брак — по конструированию */
  var rc = { id: "own_" + fam, n: fm.n, out: "weapon:" + fm.base, forge: "design", cls: "own" };
  var q = MS() ? MS().rollQual(rc, 2, "w", b0, { dir: "design", key: "own:" + fam }) : 2;
  w.qual = q;
  apply(w);
  if (MS()) MS().maybeFlaw(w, MS().flawChance(rc, { cls: "own", dir: "design", key: "own:" + fam }), false);
  w.rcNeed = need; var pv = 0; for (var pk in need) pv += ((LAB.ITEMS[pk] && LAB.ITEMS[pk].price) || 5) * need[pk]; w.crafted = pv;
  if (w.cap) w.charge = 0;
  if (fam === "rail") w.barrel = w.own.res;
  var f = F(); f.n = (f.n || 0) + 1;
  /* опыт: новое семейство — втрое; первая своя конструкция — плюс один к интеллекту (предел — как у очков, stats.js) */
  var m = MS() ? MS().M() : null, xp = 15;
  if (m && !m.first["own:" + fam]) { m.first["own:" + fam] = 1; xp *= 3; }
  if (MS()) MS().gain("design", xp);
  var firstAll = m && !m.first.own;
  var mind0 = LAB.stats ? LAB.stats.base("mind") : (g.mind || 10);
  if (firstAll) { m.first.own = 1; if (LAB.stats) LAB.stats.raise("mind", 1); else if (g.mind < 40) g.mind++; }
  var mindUp = firstAll && (LAB.stats ? LAB.stats.base("mind") : (g.mind || 10)) > mind0; /* на пределе — без слов о прибавке */
  if (LAB.ach) LAB.ach.ev("craft", 1);
  snd("work_weld", "craft"); if (gm().later) gm().later(function () { snd("work_ratchet", "craft_armor"); }, 900);
  var msg = "Своя конструкция собрана за " + mins + " " + plural(mins, "минуту", "минуты", "минут") + ": " + statText(fam, d, w) + "." + (q > 2 ? " Вышло лучше обычного: " + LAB.QUAL[BASES[fm.base].g][q].toLowerCase() + " качество." : "") + (mindUp ? " Первая своя конструкция: интеллект плюс один." : "") + (w.cap ? " Магазин пуст — перезарядите." : "");
  if (opts.name != null) { w.own.nm = opts.name; rename(w); give(w); say(msg); return w; }
  nameMenu(w, msg);
  return w;
}
function give(w) { var g = G(); if (g.weapons.indexOf(w) < 0) g.weapons.push(w); if (gm().UIx) gm().UIx("refresh"); }
function nameMenu(w, msg) {
  var fam = w.own.fam, pool = NAMES[fam].slice(), used = {}, opts = [];
  G().weapons.forEach(function (x) { if (x.own && x.own.nm) used[x.own.nm] = 1; });
  pool = pool.filter(function (n) { return !used[n]; });
  while (pool.length && opts.length < 4) { var i = Math.floor(Math.random() * pool.length); opts.push(pool.splice(i, 1)[0]); }
  var done = function (nm) { w.own.nm = nm; rename(w); give(w); LAB.ui.closeTop && LAB.ui.closeTop(true); say("Готово: " + w.name + ". Оно в рюкзаке."); if (W() && W().toRoot) W().toRoot(); };
  var items = opts.map(function (nm) { return { label: "«" + nm + "»", fn: function () { done(nm); } }; });
  items.push({ label: "Без имени", fn: function () { done(""); } });
  give(w); /* в рюкзаке сразу — даже если окно закроют */
  menu("Имя своей конструкции", items, { intro: msg + " Как назвать?" });
}

/* Перебрать конструкцию: заменить узел. */
function ownList() { return G().weapons.filter(function (w) { return w.own && FAM[w.own.fam]; }); }
function rebuildMenu() {
  var items = ownList().map(function (w) { return { label: cap1(w.name) + ", версия " + (w.own.v || 1), fn: function () { rebuildOne(w); } }; });
  if (!items.length) items.push({ label: "Своих конструкций нет.", info: true, keep: true, fn: function () {} });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Перебрать конструкцию", items, { intro: "Замена узла: нужны детали нового узла, половина деталей старого возвращается; оружие получает следующую версию." });
}
function rebuildOne(w) {
  var fam = w.own.fam, items = FAM[fam].nodes.map(function (nd) {
    var cur = optOf(fam, nd.id, w.own.nodes[nd.id]);
    return { label: nd.n + ": " + cur.n + (nd.mode ? " — переключается в окне оружия" : ""), fn: function () { if (nd.mode) { say("Сердечник переключается в окне оружия, без верстака."); return; } swapMenu(w, nd); } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu(cap1(w.name) + ": узлы", items);
}
function swapMenu(w, nd) {
  var fam = w.own.fam, items = nd.opts.filter(function (o) { return o.id !== w.own.nodes[nd.id]; }).map(function (o) {
    var why = optWhy(o);
    return { label: o.n + ": " + o.d + ". Детали: " + (W().costText(o.need) || "не нужны") + (why ? ". Сейчас нельзя: " + why : ""), fn: function () { swap(w, nd.id, o.id); } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu(nd.n + ": заменить на", items);
}
function swap(w, nodeId, optId) {
  var fam = w.own.fam, o = optOf(fam, nodeId, optId), old = optOf(fam, nodeId, w.own.nodes[nodeId]), why = optWhy(o), Wk = W();
  if (why) { LAB.UI.error(); say(o.n + ": " + why + "."); return false; }
  if (benchTier() < FAM[fam].tier) { LAB.UI.error(); say("Перебрать можно у верстака ступени " + FAM[fam].tier + " и выше."); return false; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { LAB.UI.error(); say("Не до переборки: рядом враг."); return false; }
  if (!Wk.haveAll(o.need)) { LAB.UI.error(); say("Не хватает: " + lackText(o.need) + "."); return false; }
  Wk.take(o.need);
  var back = {}, g = G(); for (var k in old.need) { var n = Math.floor(old.need[k] / 2); if (n > 0) { back[k] = n; g.inv[k] = (g.inv[k] || 0) + n; } }
  w.own.nodes[nodeId] = optId; w.own.v = (w.own.v || 1) + 1;
  if (w.rcNeed) { for (var nk in o.need) w.rcNeed[nk] = (w.rcNeed[nk] || 0) + o.need[nk]; }
  var mins = 6;
  if (gm().advanceTime) gm().advanceTime(mins);
  apply(w);
  if (MS()) MS().gain("design", 6);
  snd("work_ratchet", "craft");
  say(cap1(w.name) + ": " + o.n + " вместо «" + old.n + "», версия " + w.own.v + ". " + cap1(statText(fam, w.own.nodes, w)) + "." + (W().costText(back) ? " Вернулось: " + W().costText(back) + "." : ""));
  return true;
}

/* ════════ В БОЮ: ресурс ствола, мощность, ядро, заряды ════════ */
function own(w) { return !!(w && w.own && FAM[w.own.fam]); }
function famOfW(w) { return own(w) ? w.own.fam : ""; }
function battery(w) { return !!(w && w.ammo && w.ammo !== "none" && !LAB.physAmmo(w.ammo)); }
function ranged(w) { return !!w && (w.rng0 != null ? w.rng0 : w.rng) > 1; }
var exoNeed = 0;
function beforeShot(w, now) {
  if (!w) return null;
  /* питание от каркаса */
  if (own(w) && w.own.exo) {
    if (!LAB.exo || !LAB.exo.drain(w.own.exo, true)) { sayOnce("noexo", cap1(w.name) + " питается от каркаса, а " + (LAB.exo && LAB.exo.worn() ? "аккумулятор каркаса пуст. Подзарядите каркас." : "каркаса на вас нет."), 4000); A("play", "w_empty"); return "hot"; }
    exoNeed = w.own.exo;
  } else exoNeed = 0;
  /* ресурс ствола рельсового ружья */
  if (famOfW(w) === "rail" && w.barrel != null && w.barrel <= 0) {
    var g = G();
    if ((g.inv.kv_barrel || 0) > 0) {
      g.inv.kv_barrel--; w.barrel = w.own.res || 50; w.hotUntil = now + 3000;
      snd("rail_barrel", "w_reload_m");
      sayq("Ствол выработан — ставлю запасной: три секунды. Запасных осталось " + g.inv.kv_barrel + ".");
      return "hot";
    }
    sayOnce("nobarrel", "Ствол выработан, запасного нет. Запасной ствол собирают у верстака.", 5000);
    A("play", "w_empty");
    return "hot";
  }
  /* своенравное нейроядро упрямится, когда голодно */
  if (w.core && w.core.side === "wilful" && hungry(w) && Math.random() < 0.05) { sayOnce("wilful", "Голодное ядро упрямится: выстрела нет.", 6000); return "misfire"; }
  return null;
}
function afterShot(w, burst, now) {
  if (!w) return;
  if (exoNeed && LAB.exo) { LAB.exo.drain(exoNeed); exoNeed = 0; }
  if (famOfW(w) === "rail" && w.barrel != null) {
    w.barrel = Math.max(0, w.barrel - 1);
    if (w.barrel === 5) sayq("Ресурс ствола: пять выстрелов.");
    else if (w.barrel === 0) sayq("Ствол выработан." + ((G().inv.kv_barrel || 0) > 0 ? " Следующий выстрел — замена на запасной." : " Запасного нет."));
  }
  /* мощность: экономный режим иногда не тратит заряд, форсаж тратит лишний */
  var p = w.pwr || 0;
  if (p && battery(w) && ranged(w) && w.cap) {
    if (p < 0 && Math.random() < (MS() && MS().has("energy") ? 0.45 : 0.3)) w.charge = Math.min(w.cap, (w.charge || 0) + 1);
    if (p > 0 && w.charge > 0) w.charge--;
    if (p > 0 && (w.cond != null ? w.cond : 100) < 35 && Math.random() < 0.04) {
      snd("pwr_overload", "w_power_crack");
      w.cond = Math.max(0, (w.cond || 0) - 8);
      var hd = Math.max(3, Math.round(3 + (w.lvl || 1) / 3));
      if (LAB.combat && LAB.combat.hurtPlayer) LAB.combat.hurtPlayer(hd, "shock", null, { quiet: true });
      sayq("Пробой на форсаже: изношенное оружие ударило разрядом. Минус " + hd + " здоровья.");
    }
  }
  /* плазма на двух парах катушек: изношенная может выбросить плазму на стрелка */
  if (own(w) && statsOf(w.own.fam, w.own.nodes).risk && (w.cond != null ? w.cond : 100) < 40 && Math.random() < 0.05) {
    var hp = Math.max(4, Math.round(4 + (w.lvl || 1) / 2));
    snd("pwr_overload", "w_power_crack");
    if (LAB.combat && LAB.combat.hurtPlayer) LAB.combat.hurtPlayer(hp, "therm", null, { quiet: true });
    sayq("Плазма прорвалась мимо изношенных катушек и обожгла руку. Минус " + hp + " здоровья. Почините плазмомёт.");
  }
  /* голодное биоядро-паразит тянет здоровье */
  if (w.core && w.core.side === "parasite" && hungry(w)) {
    var g = G(); if (g.hp > 2) { g.hp--; sayOnce("parasite", "Голодное ядро тянет из вас силы: минус здоровье с каждым выстрелом, пока не будет победы.", 15000); }
  }
}
function wearK(w) { var p = w && w.pwr || 0, k = p < 0 ? 0.8 : p > 0 ? 1.6 : 1; if (own(w)) k *= statsOf(w.own.fam, w.own.nodes).wear; if (w && w.core && coreHas(w, "regen")) k *= 0.8; return k; }
function heatK(w) { var p = w && w.pwr || 0, k = p < 0 ? 0.7 : p > 0 ? 1.6 : 1; if (own(w)) k *= statsOf(w.own.fam, w.own.nodes).heat; if (MS() && MS().has("energy")) k *= 0.85; return k; }
function accK(w) { var a = 0; if (own(w)) a += statsOf(w.own.fam, w.own.nodes).acc; if (w && w.core) a += coreAcc(w); return a; }
var dryW = null;
function setDry(w, dry) {
  if (!own(w) || w.own.fam !== "blade") { dryW = null; return; }
  if (dry) { if (!w._dt0) w._dt0 = w.dt; w.dt = "kinetic"; dryW = w; sayOnce("dryblade", "Клинок без заряда: бьёт тупой полосой. Перезарядите.", 8000); }
  else { if (w._dt0) { w.dt = w._dt0; delete w._dt0; } dryW = null; }
}
function dryOk(w) { return own(w) && w.own.fam === "blade" && !w.own.exo; }
var cumHit = null;
function dmgK(w, f) {
  var k = 1;
  if (w && w.pwr) k *= w.pwr < 0 ? 0.8 : 1.25;
  if (own(w)) {
    var st = statsOf(w.own.fam, w.own.nodes);
    if (f && f.kind === "bio" && st.bio) k *= st.bio;
    if (dryW === w) k *= 0.35;
    /* (после 4.6) ловкость 20: энергоклинок как влитой (stats.js) */
    else if (w.own.fam === "blade" && (LAB.heroStat ? LAB.heroStat("agi") : G().agi) >= 20) k *= 1.15;
    if (st.cum) {
      var g = G();
      if ((g.inv.kv_hcharge || 0) > 0) {
        g.inv.kv_hcharge--; cumHit = w;
        k *= 3.5 * (f && f.kind === "mech" ? 1.3 : 1);
        snd("pike_blast", "w_explosion");
        if (g.inv.kv_hcharge === 0) sayq("Кумулятивные заряды кончились: пика бьёт без них.");
        else if (g.inv.kv_hcharge <= 2) sayOnce("cumlow", "Кумулятивных зарядов: " + g.inv.kv_hcharge + ".", 8000);
      } else { k *= 0.6; sayOnce("nocum", "Зарядов нет: пика бьёт как простое копьё.", 10000); }
    }
  }
  if (w && w.core) k *= coreDmgK(w);
  return k;
}
function pierceK(w) { return cumHit === w ? 0.85 : 0; }
function loud(w, l) {
  if (!own(w)) return l;
  var fm = w.own.fam;
  if (fm === "rail") return Math.max(l, 10); /* зарядка конденсаторов и хлопок слышны далеко */
  if (fm === "blade" && dryW !== w) return Math.max(l, 4); /* включённый клинок гудит */
  if (fm === "pike" && cumHit === w) return Math.max(l, 12); /* кумулятивный подрыв */
  return l;
}
function onHit(w, f, dmg) {
  var C = LAB.combat;
  if (cumHit === w) cumHit = null;
  if (own(w) && w.own.fam === "mw" && f && f.kind === "mech" && !f.dead) {
    /* СВЧ выжигает внешнюю электронику: машина слепнет */
    if (!(f.aff && f.aff.indexOf("hardened") >= 0) && Math.random() < 0.3) { f.blindT = Math.max(f.blindT || 0, 4); snd("mw_fry", "w_shock_crack"); sayOnce("mwblind" + f.id, String(f.name || "").split(",")[0] + ": датчики выгорели — машина ослепла на пару секунд.", 6000); }
    if (w.area && C) C.foes().forEach(function (o) { if (o === f || o.dead || o.calm || o.ally || o.kind !== "mech" || Math.max(Math.abs(o.x - f.x), Math.abs(o.y - f.y)) > 1) return; C.damageFoe(o, Math.max(1, Math.round(dmg * 0.6)), "emp", { quiet: true }); });
  }
  if (w && w.core && f && !f.dead) coreHit(w, f, dmg);
}
function onKill(w, f) {
  if (!w || !w.core || !f) return;
  coreFeed(w, f);
}

/* ════════ РЕГУЛЯТОР МОЩНОСТИ ════════ */
var PWR = { "-1": "экономно", "0": "обычно", "1": "форсаж" };
function pwrOk(w) { return battery(w) && ranged(w); }
function pwrItem(w) {
  return { label: "Мощность", kind: "choice", options: [{ v: -1, label: "экономно: урон ниже, заряд бережётся, греется и изнашивается меньше" }, { v: 0, label: "обычно" }, { v: 1, label: "форсаж: урон выше, заряд тратится вдвое, нагрев и износ сильнее; изношенное может пробить разрядом" }],
    get: function () { return w.pwr || 0; }, set: function (v) { w.pwr = v || 0; if (!w.pwr) delete w.pwr; snd("pwr_click", "ui_click"); } };
}
/* Строки в окно оружия (ui.weaponItems). */
function weaponExtra(w) {
  var items = [];
  if (pwrOk(w)) items.push(pwrItem(w));
  if (own(w) && w.own.fam === "rail") {
    items.push({ label: "Сердечник", kind: "choice", options: [{ v: "ap", label: "бронебойный: против машин" }, { v: "stop", label: "останавливающий: против живых" }],
      get: function () { return w.own.nodes.slug || "ap"; }, set: function (v) { w.own.nodes.slug = v; apply(w); snd("rail_barrel", "w_reload_m"); } });
    items.push({ label: "Ресурс ствола: " + (w.barrel != null ? w.barrel : "?") + " из " + (w.own.res || "?") + ", запасных стволов " + (G().inv.kv_barrel || 0), info: true, keep: true, fn: function () {} });
  }
  if (own(w) && statsOf(w.own.fam, w.own.nodes).cum) items.push({ label: "Кумулятивных зарядов в рюкзаке: " + (G().inv.kv_hcharge || 0), info: true, keep: true, fn: function () {} });
  if (w.core) items.push({ label: coreLine(w), info: true, keep: true, fn: function () {} });
  if (MS()) { var fl = MS().flawOf(w); if (fl && fl.seen) items.push({ label: "Брак сборки: " + MS().FLAWS[fl.k].n + " — " + MS().FLAWS[fl.k].d + ". Устранить — у верстака.", info: true, keep: true, fn: function () {} }); }
  if (own(w)) items.push({ label: "Конструкция: " + FAM[w.own.fam].nodes.map(function (nd) { return nd.n.toLowerCase() + " — " + optOf(w.own.fam, nd.id, w.own.nodes[nd.id]).n; }).join(", ") + ". Версия " + (w.own.v || 1) + ".", info: true, keep: true, fn: function () {} });
  return items;
}

/* ════════ ЯДРА В ОРУЖИИ ════════ */
var DIR_N = {
  n: [
    { id: "acc", n: "точность", d: "оружие точнее", evo: "ясность" },
    { id: "crit", n: "критический удар", d: "чаще критический удар", evo: "рассечение" },
    { id: "chain", n: "разряд", d: "разряд перескакивает на соседа", evo: "цепь" },
    { id: "mark", n: "метка", d: "по задетой цели все бьют сильнее", evo: "клеймо" },
    { id: "stun", n: "оглушение машин", d: "машину иногда клинит на миг", evo: "замыкание" }
  ],
  b: [
    { id: "poison", n: "яд", d: "раны живых гниют", evo: "кислота" },
    { id: "vamp", n: "вампиризм", d: "часть урона по живым возвращает здоровье", evo: "кровопийца" },
    { id: "visc", n: "вязкость", d: "задетый вязнет и замедляется", evo: "трясина" },
    { id: "regen", n: "самопочинка", d: "оружие медленнее изнашивается и чинится от побед", evo: "живая сталь" },
    { id: "grow", n: "быстрый рост", d: "ядро растёт быстрее", evo: "буйный рост" }
  ]
};
function dirDef(k, id) { return DIR_N[k].filter(function (d) { return d.id === id; })[0]; }
function coreHas(w, id) { return !!(w && w.core && w.core.d && w.core.d.indexOf(id) >= 0); }
function coreM(w) { var c = w.core; return (1 + 0.08 * ((c.lvl || 1) - 1)) * (hungry(w) ? 0.5 : 1) * (c.evo ? 1.5 : 1); }
function hungry(w) { var c = w && w.core; return !!(c && c.fed != null && absMin() - c.fed > 180); }
function coreAcc(w) { return coreHas(w, "acc") ? 0.06 * coreM(w) : 0; }
function coreCrit(w) { return coreHas(w, "crit") ? 0.05 * (1 + 0.08 * ((w.core.lvl || 1) - 1)) * (w.core.evo ? 1.5 : 1) : 0; }
function coreDmgK(w) { var c = w.core; return 1 + 0.025 * ((c.lvl || 1) - 1); }
function coreHit(w, f, dmg) {
  var c = w.core, m = coreM(w), C = LAB.combat, g = G();
  if (c.hungerSaid !== c.fed && hungry(w)) { c.hungerSaid = c.fed; sayq("Ядро в «" + w.name + "» голодает: оружие слабеет, пока не будет победы."); }
  if (coreHas(w, "poison") && f.kind === "bio") { f.bleedT = Math.max(f.bleedT || 0, 5); f.bleedD = Math.max(f.bleedD || 1, Math.max(1, Math.round(dmg * 0.12 * m))); }
  if (coreHas(w, "poison") && c.evo && f.kind === "mech" && f.arm > 0) { if (f.arm0 == null) f.arm0 = f.arm; if (f.arm > f.arm0 * 0.5) f.arm = Math.max(0, f.arm - 1); sayOnce("acid" + f.id, String(f.name || "").split(",")[0] + ": кислота разъедает броню.", 8000); }
  if (coreHas(w, "vamp") && f.kind === "bio" && dmg > 0) { var hv = Math.max(1, Math.round(dmg * (c.evo ? 0.1 : 0.06) * (hungry(w) ? 0.5 : 1))); g.hp = Math.min(g.hpMax, g.hp + hv); }
  if (coreHas(w, "visc") && !f.boss) f.slowT = Math.max(f.slowT || 0, c.evo ? 5 : 3);
  if (coreHas(w, "mark")) f.markT = Math.max(f.markT || 0, c.evo ? 8 : 4);
  if (coreHas(w, "stun") && f.kind === "mech" && !f.boss && Math.random() < 0.15 * m) { f.frozen = Math.max(f.frozen || 0, 2); }
  if (coreHas(w, "chain") && C && Math.random() < 0.35 * Math.min(1.5, m)) {
    var jumps = c.evo ? 2 : 1, cur = f, hit = [f], d = dmg * 0.4;
    for (var i = 0; i < jumps; i++) {
      var nb = null, bd = 99;
      C.foes().forEach(function (o) { if (hit.indexOf(o) >= 0 || o.dead || o.calm || o.ally || o.burrowed) return; var dd = Math.max(Math.abs(o.x - cur.x), Math.abs(o.y - cur.y)); if (dd <= 3 && dd < bd) { bd = dd; nb = o; } });
      if (!nb) break;
      hit.push(nb); C.damageFoe(nb, Math.max(1, Math.round(d)), "shock", { quiet: true }); cur = nb; d *= 0.75;
    }
  }
}
function coreFeed(w, f) {
  var c = w.core;
  c.fed = absMin();
  if (coreHas(w, "regen")) w.cond = Math.min(100, (w.cond != null ? w.cond : 100) + 3);
  if ((c.lvl || 1) >= 10) return;
  var xp = (1 + Math.floor((f.lvl || 1) / 10)) * (f.boss ? 5 : 1) * (coreHas(w, "grow") ? 1.6 : 1);
  c.xp = (c.xp || 0) + xp;
  var need = 8 + 6 * (c.lvl || 1);
  if (c.xp >= need) {
    c.xp -= need; c.lvl = (c.lvl || 1) + 1;
    snd("core_grow", "ui_levelup");
    var evoNow = c.lvl >= 5 && !c.evo;
    if (evoNow) c.evo = 1;
    if (own(w)) apply(w); else { w.crit = (LAB.WEAPONS[w.base].crit || 0) + coreCrit(w); renameCore(w); }
    sayq("Ядро растёт: «" + w.name + "», ступень " + c.lvl + "." + (evoNow ? " Ядро переродилось: " + c.d.map(function (id) { var dd = dirDef(c.k, id); return dd.n + " — теперь " + dd.evo; }).join(", ") + "." : ""));
  }
}
function renameCore(w) {
  if (own(w)) { rename(w); return; }
  var b = LAB.WEAPONS[w.base]; if (!b) return;
  var base = String(w.name || "").replace(/, ядро — ступень \d+$/, "");
  w.name = base + (w.core && w.core.lvl > 1 ? ", ядро — ступень " + w.core.lvl : "");
}
function coreLine(w) {
  var c = w.core, k = c.k === "n" ? "нейроядро" : "биоядро";
  return cap1(k) + ", ступень " + (c.lvl || 1) + " из 10" + (c.evo ? ", переродилось" : "") + ". Директивы: " + (c.d.length ? c.d.map(function (id) { var dd = dirDef(c.k, id); return c.evo ? dd.evo : dd.n; }).join(", ") : "не прижились") + "." + (c.side ? " Побочное: " + (c.side === "parasite" ? "паразит — голодное тянет здоровье" : "своенравие — голодное иногда не стреляет") + "." : "") + (hungry(w) ? " Сейчас голодает." : "");
}
var pick = { w: null, k: "", d: [] };
function coreMenu() {
  var g = G(), cores = (g.inv.kv_ncore > 0 ? 1 : 0) + (g.inv.kv_bcore > 0 ? 1 : 0);
  if (benchTier() < 3) { LAB.UI.error(); say("Ядро вживляют только у стенда опытной серии — верстак третьей ступени и выше."); return; }
  if (!cores) { say("Ядер нет. Нейроядро снимают с сильных машин ОКО, биоядро — с сильных тварей; на станке с ПУ их можно собрать самим."); return; }
  var items = g.weapons.filter(function (w) { return !w.core; }).map(function (w) { return { label: cap1(w.name), fn: function () { pick = { w: w, k: "", d: [] }; coreKind(); } }; });
  if (!items.length) items.push({ label: "Нет оружия без ядра.", info: true, keep: true, fn: function () {} });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Вживить ядро: оружие", items, { intro: "Ядро растёт вместе с оружием от побед. Вживление отнимает бодрость и шесть минут." });
}
function coreKind() {
  var g = G(), items = [];
  if (g.inv.kv_ncore > 0) items.push({ label: "Нейроядро: точность, критический удар, разряд, метка, оглушение машин. В рюкзаке " + g.inv.kv_ncore, fn: function () { pick.k = "n"; pick.d = []; dirMenu(); } });
  if (g.inv.kv_bcore > 0) items.push({ label: "Биоядро: яд, вампиризм, вязкость, самопочинка, быстрый рост. В рюкзаке " + g.inv.kv_bcore, fn: function () { pick.k = "b"; pick.d = []; dirMenu(); } });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Какое ядро", items);
}
function dirChance(n) { var p = 0.78 - 0.12 * (n - 1) + 0.04 * step("design") + (MS() && MS().has("inventor") ? 0.1 : 0); return Math.max(0.2, Math.min(0.95, p)); }
function sideChance(n) { return Math.max(0, 0.06 * n - 0.015 * step("design")); }
function dirItems() {
  var items = DIR_N[pick.k].map(function (dd) {
    var on = pick.d.indexOf(dd.id) >= 0;
    return { label: dd.n + (on ? " — выбрано" : "") + ": " + dd.d, keep: true, fn: function () {
      var i = pick.d.indexOf(dd.id);
      if (i >= 0) pick.d.splice(i, 1); else if (pick.d.length < 3) pick.d.push(dd.id); else { say("Не больше трёх директив."); return; }
      snd("pwr_click", "ui_click"); say(dd.n + (i >= 0 ? " — снято." : " — выбрано."));
    } };
  });
  var n = pick.d.length;
  items.push({ label: n ? "Вживить: директив " + n + ", каждая приживётся с шансом около " + Math.round(dirChance(n) * 100) + "%, риск побочного — " + Math.round(sideChance(n) * 100) + "%" : "Выберите от одной до трёх директив", keep: true, fn: function () { if (pick.d.length) implant(pick.w, pick.k, pick.d.slice()); } });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function dirMenu() { menu("Директивы ядра", dirItems(), { keep: true, rebuild: dirItems, intro: "Простое намерение приживается легко, три сразу — труднее. Мастерство конструирования поднимает шанс." }); }
function implant(w, k, dirs, opts) {
  opts = opts || {};
  var g = G(), item = k === "n" ? "kv_ncore" : "kv_bcore";
  if (!w || w.core) { say("В этом оружии уже есть ядро."); return false; }
  if (!(g.inv[item] > 0)) { LAB.UI.error(); say("Ядра нет."); return false; }
  if (!opts.force && benchTier() < 3) { LAB.UI.error(); say("Ядро вживляют у стенда опытной серии."); return false; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { LAB.UI.error(); say("Не до вживления: рядом враг."); return false; }
  g.inv[item]--;
  var p = dirChance(dirs.length), took = dirs.filter(function () { return Math.random() < p; }), side = Math.random() < sideChance(dirs.length) ? (k === "b" ? "parasite" : "wilful") : null;
  w.core = { k: k, d: took, lvl: 1, xp: 0, fed: absMin(), side: side, evo: 0 };
  if (gm().advanceTime) gm().advanceTime(6);
  var body = g.body; if (body) body.wake = Math.max(0, body.wake - 8);
  if (own(w)) apply(w); else { w.crit = (LAB.WEAPONS[w.base].crit || 0) + coreCrit(w); }
  var m = MS() ? MS().M() : null, xp = 12;
  if (m && !m.first.core) { m.first.core = 1; xp *= 3; }
  if (MS()) MS().gain("design", xp);
  snd(k === "b" ? "core_bio" : "core_neuro", "pry");
  var lost = dirs.filter(function (id) { return took.indexOf(id) < 0; });
  say("Ядро вживлено за шесть минут — руки дрожат, бодрость ушла. " + (took.length ? "Прижилось: " + took.map(function (id) { return dirDef(k, id).n; }).join(", ") + "." : "Ни одна директива не прижилась — ядро растёт, но без свойств.") + (lost.length ? " Не прижилось: " + lost.map(function (id) { return dirDef(k, id).n; }).join(", ") + "." : "") + (side ? " Побочное: " + (side === "parasite" ? "паразит — голодное ядро будет тянуть из вас здоровье" : "своенравие — голодное ядро иногда не даст выстрелить") + "." : "") + " Ядро растёт от побед; без побед голодает и слабеет.");
  if (W() && W().toRoot && !opts.quiet) W().toRoot();
  return true;
}

/* ════════ ДОБЫЧА: блок управления и ядра — с сильных ════════ */
function has(f, b) { var beh = f.beh || (f.base && f.base.beh) || []; return beh.indexOf(b) >= 0; }
function drops(f, list, r, dk) {
  if (!f || f.ally || f.calm) return;
  var L = G().L, strong = f.boss || has(f, "commander") || f.guard || (f.aff && f.aff.length);
  if (f.kind === "mech" && !has(f, "camera") && L >= 2) {
    var pc = f.boss ? 0.4 : has(f, "commander") ? 0.15 : f.guard ? 0.12 : f.aff && f.aff.length ? 0.06 : 0.025;
    if (r() < pc * dk) list.push({ kind: "item", item: "kv_ctrl", n: 1 });
    if (L >= 4 && strong && r() < (f.boss ? 0.5 : has(f, "commander") ? 0.08 : 0.04) * dk) list.push({ kind: "item", item: "kv_ncore", n: 1 });
  } else if (f.kind === "bio" && L >= 4 && (strong || f.lead || (f.mind || 0) >= 2)) {
    if (r() < (f.boss ? 0.5 : f.lead ? 0.06 : f.aff && f.aff.length ? 0.04 : 0.02) * dk) list.push({ kind: "item", item: "kv_bcore", n: 1 });
  }
}

/* ════════ ОКНА ════════ */
/* Строка в окно мастерской (workshop.rootItems). */
function benchItems(b, et) {
  var n = ownList().length;
  return [{ label: "Инженерное дело: своё оружие" + (n ? " (своих конструкций " + n + ")" : "") + ", ядра, каркас и дрон", fn: function () { engMenu(et); } }];
}
function engMenu(et) {
  var g = G(), items = [];
  items.push({ label: "Своё оружие: конструктор", fn: constructMenu });
  if (ownList().length) items.push({ label: "Перебрать конструкцию: заменить узел", fn: rebuildMenu });
  items.push({ label: "Вживить ядро в оружие" + (et < 3 ? ": нужен стенд опытной серии" : "") + ". Ядер: нейро " + (g.inv.kv_ncore || 0) + ", био " + (g.inv.kv_bcore || 0), fn: coreMenu });
  if (LAB.exo) items.push({ label: LAB.exo.benchLabel(et), fn: function () { LAB.exo.benchMenu(et); } });
  if (LAB.drone) items.push({ label: LAB.drone.benchLabel(et), fn: function () { LAB.drone.benchMenu(et); } });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Инженерное дело", items);
}
/* Строка и окно в инвентаре: инженерные вещи, каркас, дрон. */
function invLine() {
  var g = G(), n = (g.inv.lockcard || 0); for (var k in ITEMS) n += g.inv[k] || 0; /* (после 4.6) и ключ-карта ячейки */
  var parts = [];
  if (LAB.exo && LAB.exo.worn()) parts.push("каркас надет"); else if (LAB.exo && LAB.exo.frames().length) parts.push("каркасов " + LAB.exo.frames().length);
  if (LAB.drone && LAB.drone.has()) parts.push(LAB.drone.short());
  if (n) parts.push("вещей " + n);
  return { label: "Инженерное: каркас, дрон, ядра и заряды" + (parts.length ? ": " + parts.join(", ") : ""), fn: invMenu };
}
function invItems() {
  var g = G(), items = [];
  if (LAB.exo) items = items.concat(LAB.exo.invItems());
  if (LAB.drone) items = items.concat(LAB.drone.invItems());
  for (var k in ITEMS) if ((g.inv[k] || 0) > 0) (function (id) { items.push({ label: ITEMS[id].n + ": " + g.inv[id] + ". " + ITEMS[id].desc, info: true, keep: true, fn: function () {} }); })(k);
  /* (после 4.6) ключ-карта складской ячейки (load.js): применяется отсюда и из окна ячейки хранения */
  if ((g.inv.lockcard || 0) > 0 && LAB.load && LAB.load.useCard) items.push({ label: "Ключ-карта складской ячейки: " + g.inv.lockcard + ". Присоединить ячейку выбывшего сотрудника к вашей", keep: true, fn: function () { LAB.load.useCard(); } });
  if (!items.length) items.push({ label: "Пусто. Каркас и дрон собирают у верстака; блок управления, ядра — добыча с сильных машин и тварей.", info: true, keep: true, fn: function () {} });
  items.push({ label: "Назад", fn: function () { if (LAB.ui.inventory) LAB.ui.inventory(); } });
  return items;
}
function invMenu() { menu("Инженерное", invItems(), { rebuild: invItems }); }
function charLine() {
  var n = ownList().length, c = G().weapons.filter(function (w) { return w.core; }).length;
  return n || c ? "Своих конструкций " + n + (c ? ", оружия с ядром " + c : "") + "." : "";
}

LAB.forge = {
  FAM: FAM, FAM_ORDER: FAM_ORDER, BASES: BASES, ITEMS: ITEMS, DIR_N: DIR_N, NAMES: NAMES,
  F: F, famOpen: famOpen, optWhy: optWhy, unlockBy: unlockBy, statsOf: statsOf, needOf: needOf, apply: apply, capFix: capFix, rename: rename, statText: statText,
  draft: draft, build: build, swap: swap, own: own, ownList: ownList,
  beforeShot: beforeShot, afterShot: afterShot, wearK: wearK, heatK: heatK, accK: accK, dmgK: dmgK, pierceK: pierceK, loud: loud, onHit: onHit, onKill: onKill,
  setDry: setDry, dryOk: dryOk, pwrOk: pwrOk, weaponExtra: weaponExtra,
  implant: implant, coreLine: coreLine, hungry: hungry, drops: drops,
  benchItems: benchItems, engMenu: engMenu, constructMenu: constructMenu, rebuildMenu: rebuildMenu, coreMenu: coreMenu, invLine: invLine, invMenu: invMenu, charLine: charLine, fixSnd: fixSnd
};
})();
