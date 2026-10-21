/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — арсенал глубин (1.7).
   Сорок один вид оружия, одиннадцать гранат и два новых заряда — всё с
   десятого уровня и глубже: на уровнях с первого по девятый ничего нового
   не появляется. У каждой глубины своё: помповое ружьё «Заслон» охраны
   реакторного зала, багор понтонщика и двустволка сторожа «Подножия»,
   огнемёт «Просека» и сетемёт птицелова Колыбели, бластер «Аркси» и тень
   «Заслона» Отражения, дырокол «Входящий» и пружинное ружьё часовщика
   Механизма, фонограф Ростовцева и нитемёт ткачей Истока.

   src — единственный путь получить вещь:
     "craft" — только у верстака (рецепт ниже; bp — по найденной схеме);
     "find"  — только находка: враги, оружейные стойки, сейфы, тайные
               комнаты, награды; в продаже не бывает;
     "buy"   — только покупка: оружие — на пунктах снабжения, гранаты —
               на торговых терминалах и пунктах снабжения.
   price у оружия «только в продаже» — базовая цена в масштабе LAB.ITEMS:
   на прилавке её умножают на priceK() глубины, как цены предметов; на
   своей глубине это примерно LAB.weaponPrice() · 1,1 обычного «рабочего»
   экземпляра. Свойства оружия — только те, что уже понимает бой
   (combat.js, workshop.js): bleed, chain, knock, slow, mark, drain,
   silent, crit, burst, pierce, area, freeze, stunMech, noarmor, apierce.

   Граната — предмет kind "throw" с fx.gren (бросок — combat.throwGrenade):
     dmg — урон на первом уровне (с глубиной растёт), r — радиус в клетках
     от места падения (0–3), dt — вид урона ("acid" — кислота, бьёт всех
     одинаково), noarmor — броня не помогает, freeze — заморозка, slow —
     замедление, stun — оглушение живых, stunMech — машины замирают
     (только при dmg больше нуля), confuse — теряют голову, deaf — глохнут,
     burn — горит пол, gas — ядовитый пар (всё это — в тактах по полсекунды),
     emp — гаснут щиты машин, knock — отбрасывает от места падения, mark —
     метка, blind — слепнут камеры и датчики роботов, self — задевает
     героя, если он ближе r, range — дальность броска (3–8), fuse —
     задержка взрыва, мс (300–1500), loud — шум (0–14).

   Подключается после workshop.js: рецептам нужны детали из goods.js и
   workshop.js (прорезиненная ткань, сервопривод, ячейка, защитная панель),
   оружию — стальные пули. Чего не хватает, то пропускается и попадает в
   LAB.ARSENAL17.skipped. Сводка для подключения — LAB.ARSENAL17;
   проверка — lab/tests/arsenal.check.js.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

var OUT = LAB.ARSENAL17 = {
  weapons: [], ammo: [], grenades: [], recipes: [], skipped: [],
  /* кто чем добывается: оружие и гранаты по каналам */
  channels: { weapons: { craft: [], find: [], buy: [] }, grenades: { craft: [], find: [], buy: [] } },
  /* как сказать игроку, откуда вещь (для справочника и подсказок) */
  srcText: { craft: "собирается только у верстака", find: "только находка, в продаже не бывает", buy: "только в продаже" },
  /* можно ли этой вещи появиться через данный канал: у вещи без src — любой */
  allows: function (def, ch) { return !def || !SRC[def.src] || def.src === ch; }
};
var HOW = {
  craft: "Собирается только у верстака.",
  bp: "Собирается только у верстака, по найденной схеме.",
  find: "В продаже не бывает — только находка.",
  buy: "Продаётся только на пунктах снабжения.",
  buyT: "Продаётся только на торговых терминалах и пунктах снабжения."
};
var SRC = { craft: 1, find: 1, buy: 1 };

function skip(kind, id, why) {
  OUT.skipped.push(kind + " " + id + ": " + why);
  if (typeof console !== "undefined" && console.warn) console.warn("арсенал: " + kind + " «" + id + "» — " + why);
}
/* Рецепт можно добавить: id свободен, все детали есть. "" — можно. */
function recipeWhy(rc) {
  if (!rc || !rc.id || !rc.need) return "нет рецепта";
  if (LAB.RECIPES.some(function (q) { return q.id === rc.id; })) return "рецепт " + rc.id + " уже есть";
  for (var k in rc.need) if (!LAB.ITEMS[k] || LAB.ITEMS[k].kind !== "part") return "нет детали " + k;
  return "";
}
function addRecipe(rc, out, n, d) {
  var r = { id: rc.id, out: out, n: n, need: rc.need, cls: rc.cls || "spec", minL: Math.max(10, rc.minL || 10) };
  if (rc.bp) r.bp = true;
  if (d) r.desc = d;
  LAB.RECIPES.push(r);
  OUT.recipes.push(r.id);
}
function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* Заряд: d — как в LAB.AMMO, rc — рецепт у верстака. */
function AM(id, d, rc) {
  if (LAB.AMMO[id]) return skip("заряд", id, "уже есть");
  var why = rc ? recipeWhy(rc) : "";
  LAB.AMMO[id] = d;
  OUT.ammo.push(id);
  if (why) skip("рецепт заряда", id, why);
  else if (rc) addRecipe(rc, "ammo:" + id, d.n);
}
/* Оружие: d.d — описание без последней фразы о том, где его взять
   (её добавляет канал src или d.how), d.rec — рецепт для "craft". */
function W(id, depth, model, d) {
  if (LAB.WEAPONS[id]) return skip("оружие", id, "уже есть");
  if (!SRC[d.src]) return skip("оружие", id, "неизвестный канал " + d.src);
  if (d.ammo !== "none" && !LAB.AMMO[d.ammo]) return skip("оружие", id, "нет заряда " + d.ammo);
  var rc = d.rec, why = d.src === "craft" ? recipeWhy(rc) : "";
  if (why) return skip("оружие", id, why);
  var w = {}, k;
  for (k in d) if (k !== "d" && k !== "how" && k !== "rec") w[k] = d[k];
  w.desc = d.d + " " + (d.how || (d.src === "craft" ? (rc.bp ? HOW.bp : HOW.craft) : HOW[d.src]));
  LAB.WEAPONS[id] = w;
  LAB.WEAPON_DEPTH[id] = depth;
  LAB.MODEL[id] = model;
  OUT.weapons.push(id);
  OUT.channels.weapons[w.src].push(id);
  if (rc) addRecipe(rc, "weapon:" + id, cap1(w.n), d.d);
}
/* Граната: предмет kind "throw" с fx.gren. */
function T(id, d) {
  if (LAB.ITEMS[id]) return skip("граната", id, "уже есть");
  if (!SRC[d.src]) return skip("граната", id, "неизвестный канал " + d.src);
  var rc = d.rec, why = d.src === "craft" ? recipeWhy(rc) : "";
  if (why) return skip("граната", id, why);
  LAB.ITEMS[id] = { n: d.n, icon: d.icon, kind: "throw", depth: d.depth, price: d.price, src: d.src,
    desc: d.d + " " + (d.how || (d.src === "craft" ? (rc.bp ? HOW.bp : HOW.craft) : d.src === "buy" ? HOW.buyT : HOW.find)),
    fx: { gren: d.gren } };
  OUT.grenades.push(id);
  OUT.channels.grenades[d.src].push(id);
  if (rc) addRecipe(rc, id, d.n, d.d);
}
/* У гранаты вид урона «кислота» — бой знает его (combat.throwGrenade), справочнику нужно имя. */
if (LAB.DTYPE_N && !LAB.DTYPE_N.acid) LAB.DTYPE_N.acid = "кислота";

/* ════════ ЗАРЯДЫ ════════ */
AM("buckshot", { n: "Пачка картечи", icon: "📦", price: 16, depth: 10,
  desc: "Бумажные патроны со стальной картечью для ружей и двустволок. Собирается у верстака из металлолома и реагента." },
  { id: "r_buckshot", need: { scrap: 2, reagent: 1 }, cls: "base", minL: 10 });
AM("g_gascan", { n: "Газовый баллон", icon: "🧯", price: 40, depth: 17,
  desc: "Баллон сжиженного газа с завода «Глубина» для газовых резаков, паяльных ламп и огнемётов: шипит, если тронуть вентиль. Собирается у верстака из реагента, металлолома и прорезиненной ткани." },
  { id: "g_r_gascan", need: { reagent: 2, scrap: 1, rubber: 1 }, cls: "spec", minL: 17 });

/* ════════ «КОВЧЕГ» И «ПОДНОЖИЕ»: охрана реактора и инструмент «Глубины» ════════ */
W("zaslon", 10, "ЗС", { n: "помповое ружьё «Заслон»", g: "n", cls: "kinetic", ammo: "buckshot", dt: "kinetic",
  dmg: 18, rng: 4, spread: 1, cap: 6, cd: 850, snd: "w_pcannon", sndRate: 1.6, area: true, knock: true, src: "find",
  d: "Ружьё охраны реакторного зала: веер картечи задевает всех рядом с целью, а саму цель отбрасывает на шаг. Хлопок тяжёлый, затвор лязгает после каждого выстрела." });
W("g_boathook", 14, "БГ", { n: "багор понтонщика", g: "m", cls: "melee", ammo: "none", dt: "kinetic",
  dmg: 20, rng: 1, spread: 1, cap: 0, cd: 650, snd: "w_melee", sndRate: 0.9, bleed: 3, slow: 3, src: "craft",
  d: "Багор с причала гидростанции у подземного озера: крюк впивается и держит — тварь вязнет и истекает.",
  rec: { id: "g_r_boathook", need: { scrap: 4, rubber: 1, wire: 1 }, cls: "base", minL: 14 } });
W("g_twinbarrel", 16, "ДС", { n: "двустволка сторожа", g: "f", cls: "kinetic", ammo: "buckshot", dt: "kinetic",
  dmg: 17, rng: 5, spread: 1, cap: 2, cd: 1000, snd: "w_pcannon", sndRate: 1.8, burst: 2, src: "buy", price: 360,
  d: "Охотничья двустволка сторожа резервного городка: на каждый спуск — дуплет, два выстрела подряд, но патронов в ней мало, и перезаряжать её приходится часто." });
W("g_gastorch", 17, "ГР", { n: "газовый резак сварщика", g: "m", cls: "melee", ammo: "g_gascan", dt: "thermo",
  dmg: 20, rng: 1, spread: 1, cap: 18, cd: 520, snd: "w_cutter", sndRate: 0.7, apierce: 0.5, src: "find",
  d: "Резак из цехов завода «Глубина»: шипящее пламя прожигает броню роботов почти насквозь и жжёт живое. Питается газовыми баллонами." });
W("g_quartzmaul", 20, "КК", { n: "кварцевая кувалда", g: "f", cls: "melee", ammo: "none", dt: "sonic",
  dmg: 30, rng: 1, spread: 1, cap: 0, cd: 850, snd: "w_melee", sndRate: 0.6, knock: true, src: "craft",
  d: "Кувалда с бойком из поющего кварца: удар гудит, как колокол, и сбивает с ног, а всё, что выросло из породы, от него трескается.",
  rec: { id: "g_r_quartzmaul", need: { g_quartz: 2, scrap: 5, g_mica: 1 }, cls: "spec", bp: true, minL: 20 } });

/* ════════ КОЛЫБЕЛЬ: снаряжение смены В и «Альфы» и то, что выросло ════════ */
W("k_splitmaul", 21, "КН", { n: "колун первопроходца", g: "m", cls: "melee", ammo: "none", dt: "kinetic",
  dmg: 28, rng: 1, spread: 1, cap: 0, cd: 800, snd: "w_melee", sndRate: 0.75, knock: true, crit: 0.1, src: "craft",
  d: "Колун смены В, которым у Порога тесали сваи: тяжёлый замах с хрустом отбрасывает цель и чаще обычного выходит сокрушительным.",
  rec: { id: "k_r_splitmaul", need: { scrap: 5, k_resin: 1, wire: 1 }, cls: "base", minL: 21 } });
W("k_flamer", 23, "ОП", { n: "огнемёт «Просека»", g: "m", cls: "thermo", ammo: "g_gascan", dt: "thermo",
  dmg: 13, rng: 3, spread: 1, cap: 14, cd: 460, snd: "w_thermo", sndRate: 0.8, area: true, src: "buy", price: 320,
  d: "Ранцевый огнемёт, которым смена В прорубала просеки в споровых лесах: ревущая струя накрывает цель и всех рядом. Споры и корни горят лучше всего." });
W("k_dartgun", 24, "УС", { n: "усыпляющее ружьё питомника", g: "n", cls: "bio", ammo: "energy", dt: "bio",
  dmg: 8, rng: 7, spread: 0, cap: 4, cd: 900, snd: "w_gauss", sndRate: 2.1, freeze: 3, silent: true, src: "find",
  d: "Пневморужьё ветеринаров питомника: дротик со снотворным вылетает с тихим «пф», и цель цепенеет на пару мгновений." });
W("k_netgun", 27, "СТ", { n: "сетемёт птицелова", g: "m", cls: "kinetic", ammo: "energy", dt: "kinetic",
  dmg: 9, rng: 5, spread: 1, cap: 4, cd: 950, snd: "w_gauss", sndRate: 0.6, slow: 6, freeze: 1, src: "craft",
  d: "Пневматический сетемёт, которым в Гнездовье ловили шептокрылов: сеть из стального троса с шелестом накрывает цель, и та надолго вязнет.",
  rec: { id: "k_r_netgun", need: { wire: 3, k_chitin: 1, rubber: 1, servo: 1 }, cls: "spec", minL: 27 } });
W("k_alphamg", 28, "ПА", { n: "ручной пулемёт «Альфы»", g: "m", cls: "kinetic", ammo: "slug", dt: "kinetic",
  dmg: 9, rng: 8, spread: 0, cap: 24, cd: 600, snd: "w_gauss", sndRate: 1.7, burst: 3, src: "find",
  d: "Пулемёт отряда «Альфа» на стальных пулях: очередь из трёх за спуск, лента длинная, и ствол не греется." });
W("k_chainsaw", 29, "ЦП", { n: "цепная пила корнерезов", g: "f", cls: "melee", ammo: "energy", dt: "kinetic",
  dmg: 18, rng: 1, spread: 1, cap: 20, cd: 420, snd: "w_cutter", sndRate: 1.25, bleed: 4, src: "buy", price: 440,
  d: "Пила, которой в Корневище резали корни толщиной с туннель: визжит, рвёт и оставляет раны, которые долго не закрываются. Питается энергобатареями." });
W("k_acidgland", 31, "КЖ", { n: "кислотная железа химеры", g: "f", cls: "bio", ammo: "none", dt: "bio",
  dmg: 16, rng: 5, spread: 0, cap: 0, cd: 900, snd: "w_plasma", sndRate: 0.6, noarmor: true, slow: 2, src: "find",
  d: "Железа химеры-плевуна на кожаной рукояти: сожмите — и она плюётся кислотой, которая разъедает панцири и шкуры, броня не спасает. Заряжать не нужно: кислота набирается сама." });
W("k_stormrod", 35, "ШГ", { n: "штормовой громоотвод", g: "m", cls: "ion", ammo: "energy", dt: "shock",
  dmg: 20, rng: 6, spread: 0, cap: 4, cd: 1000, snd: "w_ion", sndRate: 0.7, chain: 4, src: "craft",
  d: "Громоотвод с мачты ОКО, который месяцами копил заряд грозы без молний: выпущенный разряд скачет по четырём целям подряд.",
  rec: { id: "k_r_stormrod", need: { k_root: 1, cap: 3, wire: 3, supercond: 1 }, cls: "spec", bp: true, minL: 35 } });
W("k_pilegun", 38, "СВ", { n: "пневмосваебой Стройки", g: "m", cls: "kinetic", ammo: "energy", dt: "kinetic",
  dmg: 34, rng: 2, spread: 0, cap: 5, cd: 1100, snd: "w_pcannon", sndRate: 0.75, knock: true, apierce: 0.6, src: "buy", price: 880,
  d: "Ручной сваебой со Стройки: в упор вгоняет стальной стержень сквозь броню и отбрасывает цель. Бьёт на два шага." });

/* ════════ ОТРАЖЕНИЕ: стекло, амальгама, тени и отзвуки ════════ */
W("o_arksi", 41, "АР", { n: "бластер «Аркси»", g: "m", cls: "blaster", ammo: "energy", dt: "phase",
  dmg: 16, rng: 7, spread: 0, cap: 12, cd: 440, snd: "w_blaster_s", sndRate: 0.8, src: "buy", price: 470,
  d: "Зеркальная копия табельной «Искры»: надпись на корпусе читается задом наперёд, а выстрел звучит наоборот — сначала эхо, потом щелчок. Бьёт фазой, отражениям больнее всего." });
W("o_mirrorflail", 44, "ЗЦ", { n: "зеркальный цеп", g: "m", cls: "melee", ammo: "none", dt: "phase",
  dmg: 26, rng: 1, spread: 1, cap: 0, cd: 750, snd: "w_vibro", sndRate: 1.4, area: true, knock: true, src: "find",
  d: "Цепь из зеркальных звеньев на рукояти: размах звенит, как люстра на сквозняке, задевает всех рядом с целью, а саму цель отбрасывает." });
W("o_amalgamjet", 45, "АМ", { n: "амальгамный распылитель", g: "m", cls: "phase", ammo: "o_phasecell", dt: "phase",
  dmg: 13, rng: 5, spread: 1, cap: 12, cd: 520, snd: "w_plasma", sndRate: 1.5, mark: 5, slow: 3, src: "craft",
  d: "Распылитель серебрильных ванн из Цеха отражений: холодная амальгама оседает на цели — она вязнет, а по помеченной любое оружие бьёт сильнее.",
  rec: { id: "o_r_amalgamjet", need: { o_silver: 2, rubber: 1, servo: 1, wire: 1 }, cls: "spec", minL: 45 } });
W("o_stopframe", 47, "КФ", { n: "камера «Стоп-кадр»", g: "f", cls: "phase", ammo: "o_phasecell", dt: "phase",
  dmg: 14, rng: 6, spread: 1, cap: 6, cd: 900, snd: "w_laser", sndRate: 1.7, freeze: 3, src: "craft",
  d: "Фотокамера из Ледяного зеркала, где застыло время: щелчок затвора — и цель замирает на полушаге, как люди подо льдом.",
  rec: { id: "o_r_stopframe", need: { o_prismpart: 1, o_quartz: 1, lens: 2, cap: 2 }, cls: "spec", bp: true, minL: 47 } });
W("o_shadowpump", 48, "ТЗ", { n: "тень «Заслона»", g: "f", cls: "phase", ammo: "o_phasecell", dt: "phase",
  dmg: 20, rng: 4, spread: 1, cap: 6, cd: 850, snd: "w_pcannon", sndRate: 1.3, area: true, knock: true, src: "find",
  d: "Тень помпового ружья со стойки Арсенала теней: стреляет тенью картечи — задевает всех рядом с целью и отбрасывает её, а хлопок слышен на миг раньше выстрела." });
W("o_boomerang", 49, "ДБ", { n: "диск-бумеранг", g: "m", cls: "sonic", ammo: "none", dt: "sonic",
  dmg: 22, rng: 7, spread: 0, cap: 0, cd: 900, snd: "w_resonator", sndRate: 1.7, chain: 2, src: "buy", price: 640,
  d: "Стеклянный диск из Кольца отражений: летит со звоном, перескакивает с цели на две соседние и возвращается в руку из-за спины. Заряжать не нужно." });
W("o_iceaxe", 53, "ЛД", { n: "зеркальный ледоруб", g: "m", cls: "melee", ammo: "none", dt: "phase",
  dmg: 32, rng: 1, spread: 1, cap: 0, cd: 650, snd: "w_melee", sndRate: 1.15, crit: 0.15, bleed: 3, src: "craft",
  d: "Ледоруб с клювом из зеркального стекла, с каким ходят по уступам Тропы Эхо-2: клюв впивается, рвёт и находит слабое место.",
  rec: { id: "o_r_iceaxe", need: { o_glass: 3, o_silver: 1, scrap: 3 }, cls: "base", minL: 53 } });
W("o_etherarc", 54, "ЭФ", { n: "эфирный разрядник", g: "m", cls: "ion", ammo: "o_sonicell", dt: "emp",
  dmg: 18, rng: 7, spread: 1, cap: 8, cd: 700, snd: "w_ion", sndRate: 1.35, stunMech: 2, chain: 2, src: "buy", price: 580,
  d: "Самоделка с радиопоста «Щегол»: в наушниках пищит морзянка, а в цель уходит импульс — он сбивает машине контур и перескакивает на две соседние. Живым почти не вредит." });
W("o_sonarharpoon", 57, "ГА", { n: "гарпун гидроакустика", g: "m", cls: "sonic", ammo: "o_sonicell", dt: "sonic",
  dmg: 34, rng: 9, spread: 0, cap: 3, cd: 1100, snd: "w_gauss", sndRate: 0.75, pierce: true, knock: true, src: "find",
  d: "Гарпун с поста Эхо-6, в наконечнике — гидрофон: летит с долгим звоном, прошивает всех на линии и каждого отбрасывает." });

/* ════════ МЕХАНИЗМ: конвейер, архивы, литейная и канцелярия ════════ */
W("m_impactgun", 62, "ПГВ", { n: "пневмогайковёрт сборщика", g: "m", cls: "melee", ammo: "energy", dt: "kinetic",
  dmg: 24, rng: 1, spread: 1, cap: 24, cd: 460, snd: "w_vibro", sndRate: 1.7, apierce: 0.5, src: "craft",
  d: "Гайковёрт с конвейера Сборочных недр: трещит, как очередь, и откручивает броню прямо на ходу — корпус машины почти не держит удар. Питается энергобатареями.",
  rec: { id: "m_r_impactgun", need: { m_gear: 2, servo: 2, cell: 1, scrap: 3 }, cls: "spec", minL: 62 } });
W("m_degausser", 63, "РМ", { n: "размагничиватель архивариуса", g: "m", cls: "ion", ammo: "m_pulsecell", dt: "emp",
  dmg: 12, rng: 4, spread: 1, cap: 8, cd: 800, snd: "w_magnetron_r", sndRate: 0.7, stunMech: 2, src: "buy", price: 420,
  d: "Катушка, которой на Складах памяти стирают бобины: гудящий импульс стирает машине мысли, и она замирает. Живым почти не вредит." });
W("m_springgun", 64, "ПЧ", { n: "пружинное ружьё часовщика", g: "n", cls: "kinetic", ammo: "slug", dt: "kinetic",
  dmg: 32, rng: 9, spread: 0, cap: 5, cd: 950, snd: "w_gauss", sndRate: 1.95, silent: true, crit: 0.2, apierce: 0.3, src: "find",
  d: "Ружьё на часовой пружине из мастерской часовщика в Городе машин: завод тикает, и стальная пуля уходит без звука — точно и глубоко." });
W("m_cranemagnet", 65, "МК", { n: "электромагнит крановщика", g: "m", cls: "gauss", ammo: "m_pulsecell", dt: "gauss",
  dmg: 26, rng: 6, spread: 1, cap: 6, cd: 900, snd: "w_magnetron_r", sndRate: 1.3, knock: true, slow: 5, src: "find",
  d: "Ручной электромагнит литейного крана: гудит, рывком отбрасывает цель на шаг и прижимает к полу — она долго не может разогнаться." });
W("m_blowtorch", 69, "ПЛ", { n: "паяльная лампа ремонтника", g: "f", cls: "thermo", ammo: "g_gascan", dt: "thermo",
  dmg: 20, rng: 2, spread: 1, cap: 16, cd: 480, snd: "w_thermo", sndRate: 0.65, area: true, src: "craft",
  d: "Лампа из Цеха ремонтников: гудящее синее пламя на два шага заливает цель и всех рядом. Питается газовыми баллонами.",
  rec: { id: "m_r_blowtorch", need: { m_casting: 1, g_hydrocyl: 1, rubber: 1, scrap: 2 }, cls: "spec", minL: 69 } });
W("m_freonjet", 71, "ФР", { n: "фреоновый распылитель", g: "m", cls: "cryo", ammo: "energy", dt: "cryo",
  dmg: 22, rng: 5, spread: 1, cap: 10, cd: 650, snd: "w_cryo", sndRate: 1.2, freeze: 2, slow: 5, src: "find",
  d: "Распылитель хладагента с Охладительных каскадов: шипящая струя схватывает цель инеем — она застывает, а оттаяв, ещё долго движется вяло." });
W("m_holepunch", 73, "ДК", { n: "дырокол «Входящий»", g: "m", cls: "gauss", ammo: "m_pulsecell", dt: "gauss",
  dmg: 28, rng: 8, spread: 0, cap: 6, cd: 900, snd: "w_gauss", sndRate: 1.05, pierce: true, apierce: 0.4, src: "buy", price: 870,
  d: "Пневматический дырокол Канцелярии: с сухим щелчком пробивает подшивку — и всех на линии, а броня его почти не держит.",
  how: "Продаётся только на пунктах снабжения — под накладную." });
W("m_wardenbaton", 74, "ДН", { n: "дубинка надзирателя", g: "f", cls: "melee", ammo: "none", dt: "shock",
  dmg: 32, rng: 1, spread: 1, cap: 0, cd: 750, snd: "w_shock", sndRate: 0.8, knock: true, src: "craft",
  d: "Дубинка надзирателя Тюрьмы: разряд в бойке трещит и отбрасывает, машинам особенно больно.",
  rec: { id: "m_r_wardenbaton", need: { m_relay: 2, cap: 2, panel: 1, scrap: 3 }, cls: "spec", bp: true, minL: 74 } });
W("m_hailgun", 76, "ГД", { n: "градомёт метеоролога", g: "m", cls: "cryo", ammo: "energy", dt: "cryo",
  dmg: 14, rng: 8, spread: 1, cap: 12, cd: 700, snd: "w_cryo", sndRate: 1.55, burst: 3, slow: 2, src: "buy", price: 520,
  d: "Пушка Вычислителя погоды, на которой проверяли модели гроз: очередь из трёх градин стучит по броне, и цели вязнут." });

/* ════════ ИСТОК: Смена А, корни, тишина и свет ════════ */
W("i_singingpick", 82, "КСА", { n: "поющее кайло Смены А", g: "n", cls: "melee", ammo: "none", dt: "sonic",
  dmg: 40, rng: 1, spread: 1, cap: 0, cd: 800, snd: "w_melee", sndRate: 0.7, knock: true, crit: 0.1, src: "craft",
  d: "Кайло проходчиков Смены А, перекованное на поющей породе: удар гудит в зубах и сбивает с ног, а тени от него рвутся.",
  rec: { id: "i_r_singingpick", need: { i_layerstring: 2, scrap: 5, ceramic: 1 }, cls: "base", minL: 82 } });
W("i_phonograph", 83, "ФН", { n: "фонограф Ростовцева", g: "m", cls: "sonic", ammo: "energy", dt: "sonic",
  dmg: 26, rng: 8, spread: 1, cap: 6, cd: 850, snd: "w_resonator", sndRate: 1.15, chain: 2, mark: 4, src: "find",
  d: "Опытный фонограф из фонотеки академика: игла скребёт по валику, и записанная песня слоя звенит в цели и двух соседних, помечая их.",
  how: "Он такой один — купить нельзя, только найти." });
W("i_stillhand", 85, "СЗ", { n: "стрелка безвременья", g: "f", cls: "phase", ammo: "i_gravcell", dt: "phase",
  dmg: 30, rng: 7, spread: 0, cap: 4, cd: 900, snd: "w_ion", sndRate: 0.6, freeze: 3, src: "craft",
  d: "Часовая стрелка из комнат Безвременья в стеклянном стволе: выстрел дарит цели застывшую секунду, и она стоит на месте.",
  rec: { id: "i_r_stillhand", need: { i_timesand: 2, m_gear: 2, lens: 1, supercond: 1 }, cls: "exp", bp: true, minL: 85 } });
W("i_podlauncher", 86, "СТР", { n: "стручковый метатель", g: "m", cls: "bio", ammo: "none", dt: "bio",
  dmg: 30, rng: 6, spread: 0, cap: 0, cd: 1100, snd: "w_plasma", sndRate: 0.7, area: true, slow: 5, src: "craft",
  d: "Росток первого дерева на прикладе: стручок с треском лопается у цели, семена задевают всех рядом, а саму цель оплетают корни. Заряжать не нужно — стручки зреют сами.",
  rec: { id: "i_r_podlauncher", need: { i_treefiber: 2, k_root: 1, k_resin: 1, scrap: 2 }, cls: "spec", bp: true, minL: 86 } });
W("i_omegaclaw", 89, "КОМ", { n: "клешня Омеги", g: "f", cls: "melee", ammo: "none", dt: "bio",
  dmg: 42, rng: 1, spread: 1, cap: 0, cd: 600, snd: "w_vibro", sndRate: 0.55, bleed: 4, drain: 0.25, src: "find",
  d: "Костяная клешня того, что осталось от Омеги, на ремне вместо рукояти: щёлкает, рвёт раны, которые не закрываются, и тянет из живого силу вам." });
W("i_threadgun", 91, "НТ", { n: "нитемёт ткачей", g: "m", cls: "grav", ammo: "i_gravcell", dt: "grav",
  dmg: 32, rng: 10, spread: 0, cap: 6, cd: 900, snd: "w_gauss", sndRate: 1.35, freeze: 2, slow: 6, src: "buy", price: 1060,
  d: "Челнок ткачей Сплетения на прикладе: нить мира со свистом опутывает цель издали — та застывает, а потом еле переставляет ноги." });
W("i_vortexgun", 93, "ВМ", { n: "вихревой метатель", g: "m", cls: "grav", ammo: "i_gravcell", dt: "grav",
  dmg: 40, rng: 7, spread: 1, cap: 4, cd: 1100, snd: "w_resonator", sndRate: 0.6, area: true, knock: true, src: "buy", price: 1310,
  d: "Ловушка для вихрей Бури складки: выпущенный вихрь с воем бьёт цель и всех рядом и отшвыривает её." });
W("i_annihsickle", 94, "АС", { n: "аннигиляционный серп", g: "m", cls: "melee", ammo: "none", dt: "positron",
  dmg: 46, rng: 1, spread: 1, cap: 0, cd: 620, snd: "w_cutter", sndRate: 0.55, noarmor: true, src: "find",
  d: "Серп машины-садовника, павшей на Кладбище садовников: кромка из антивещества в магнитной ловушке гудит низко и ровно, и броня перед ней не держит." });
W("i_stitchgun", 98, "СЖ", { n: "стежковый пистолет «Заглушки»", g: "m", cls: "gauss", ammo: "energy", dt: "gauss",
  dmg: 40, rng: 8, spread: 0, cap: 5, cd: 950, snd: "w_gauss", sndRate: 0.9, pierce: true, slow: 6, src: "buy", price: 1320,
  d: "Ручной стежковый пистолет с машин «Заглушки»: стальной стежок прошивает всех на линии и пришивает к полу — цели еле движутся." });

/* ════════ ГРАНАТЫ ════════ */
T("gren_frag", { n: "Осколочная граната", icon: "💣", depth: 10, price: 60, src: "buy",
  d: "Ручная граната охраны «Ковчега»: стальная рубашка разлетается осколками на шаг вокруг места падения. Под ноги не бросайте — заденет и вас.",
  gren: { dmg: 30, r: 1, dt: "kinetic", self: true, range: 5, fuse: 900, loud: 12 } });
T("g_firebomb", { n: "Зажигательная граната", icon: "🔥", depth: 18, price: 55, src: "craft",
  d: "Бутылка огнесмеси со слюдяным запалом: лопается с глухим хлопком, и пол на шаг вокруг горит ещё пять секунд. Твари и лианы горят охотнее машин.",
  gren: { dmg: 14, r: 1, dt: "thermo", burn: 10, self: true, range: 5, fuse: 800, loud: 8 },
  rec: { id: "g_r_firebomb", need: { reagent: 2, g_mica: 1, cap: 1, scrap: 1 }, cls: "spec", minL: 18 } });
T("k_netbomb", { n: "Сетевая граната", icon: "🕸️", depth: 27, price: 65, src: "find",
  d: "Граната птицеловов из Гнездовья: с шелестом раскрывается сетью из стального троса и накрывает всех на шаг вокруг — твари бьются в ячейках, машины путаются колёсами. Вас не заденет.",
  gren: { dmg: 4, r: 1, dt: "kinetic", slow: 8, stun: 3, stunMech: 2, self: false, range: 6, fuse: 600, loud: 4 } });
T("k_acidbomb", { n: "Кислотная граната", icon: "🧪", depth: 32, price: 75, src: "craft",
  d: "Восковая колба с кислотой солёных топей: лопается, разъедает панцири и броню всем на шаг вокруг, а над местом падения ещё шесть секунд висит едкий пар.",
  gren: { dmg: 18, r: 1, dt: "acid", noarmor: true, gas: 12, self: true, range: 5, fuse: 900, loud: 6 },
  rec: { id: "k_r_acidbomb", need: { reagent: 3, k_salt: 1, k_wax: 1 }, cls: "spec", minL: 32 } });
T("o_flashbang", { n: "Светошумовая граната", icon: "🔆", depth: 41, price: 70, src: "buy",
  d: "Вспышка и удар звука на два шага вокруг: все, кто рядом, глохнут и теряют голову, живые замирают, а камеры и датчики роботов слепнут. Урона нет, вас не заденет, но слышно её на весь этаж.",
  gren: { dmg: 0, r: 2, dt: "sonic", stun: 3, confuse: 8, deaf: 10, blind: 20, self: false, range: 6, fuse: 1200, loud: 14 } });
T("o_cryobomb", { n: "Криограната", icon: "❄️", depth: 47, price: 80, src: "find",
  d: "Колба с холодом Ледяного зеркала: лопается со звоном и схватывает инеем всех на шаг вокруг — цели застывают на две секунды, а оттаяв, движутся вяло.",
  gren: { dmg: 12, r: 1, dt: "cryo", freeze: 4, slow: 6, self: true, range: 5, fuse: 800, loud: 6 } });
T("o_chimebomb", { n: "Звуковая граната", icon: "🔔", depth: 52, price: 85, src: "craft",
  d: "Кварцевый резонатор в стеклянной рубашке: лопается одной чистой нотой на два шага вокруг — отражения и тени рвутся, а все, кто слышит, глохнут и теряют голову. Бросайте подальше — заденет и вас.",
  gren: { dmg: 26, r: 2, dt: "sonic", deaf: 8, confuse: 6, self: true, range: 6, fuse: 700, loud: 13 },
  rec: { id: "o_r_chimebomb", need: { o_quartz: 1, o_glass: 2, cap: 1 }, cls: "spec", bp: true, minL: 52 } });
T("m_stickyemp", { n: "Липкая ЭМИ-граната", icon: "🧲", depth: 62, price: 95, src: "buy",
  d: "ЭМИ-граната на магнитной присоске: держится там, куда упала, и через полторы секунды гасит щиты машин на шаг вокруг и сбивает им контур на две секунды. Живым почти не вредит.",
  gren: { dmg: 22, r: 1, dt: "emp", emp: true, stunMech: 4, self: false, range: 5, fuse: 1500, loud: 9 } });
T("m_cluster", { n: "Кассетная граната", icon: "🎇", depth: 72, price: 120, src: "find",
  d: "Кассета с Испытательных арен ОКО: в полёте раскрывается россыпью малых зарядов и накрывает всё на два шага вокруг, отбрасывая уцелевших. Бросайте подальше — заденет и вас.",
  gren: { dmg: 42, r: 2, dt: "kinetic", knock: true, self: true, range: 6, fuse: 1100, loud: 14 } });
T("i_dawnbomb", { n: "Граната «Рассвет»", icon: "☀️", depth: 90, price: 110, src: "buy",
  d: "Капля света Истока в позитронной ловушке: вспыхивает на шаг вокруг и жжёт сквозь любую броню, слепит камеры и датчики, а уцелевших метит — по ним бьют сильнее.",
  gren: { dmg: 24, r: 1, dt: "positron", noarmor: true, blind: 16, mark: 8, self: true, range: 6, fuse: 800, loud: 8 } });
T("i_vortexbomb", { n: "Вихревая граната", icon: "🌀", depth: 93, price: 110, src: "craft",
  d: "Пойманный вихрь Бури складки в стеклянной колбе: вырвавшись, с воем бьёт всех на два шага вокруг, разбрасывает и прижимает к полу. Бросайте подальше — заденет и вас.",
  gren: { dmg: 34, r: 2, dt: "grav", knock: true, slow: 5, self: true, range: 6, fuse: 900, loud: 10 },
  rec: { id: "i_r_vortexbomb", need: { i_timesand: 1, i_soundlump: 1, magnet: 2, cap: 1 }, cls: "spec", bp: true, minL: 93 } });
})();
