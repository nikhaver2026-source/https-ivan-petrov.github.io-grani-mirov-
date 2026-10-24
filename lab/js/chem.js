/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — химия и мутагенный туман (3.0, просьба автора).

   СЫРЬЁ. Двадцать два вещества: реактивы лабораторий и складов, жидкости
   машин и ткани тварей, добавки и мутагенный конденсат. У каждого — три
   сорта: технический, очищенный и особой чистоты. Высший сорт получают
   очисткой на столе (вытяжной шкаф — второй сорт, синтез-реактор —
   третий) или находят глубже: чем ниже комплекс, тем чище то, что там
   лежит и растёт. Вещества глубин (хитин и нервный корень «Колыбели»,
   звонкая соль, смола, воск улья, амальгама, нанопаста, клетки Омеги)
   перерабатываются в сырьё высших сортов.
   ТУМАН. Мутаген из вивария ушёл в общую вентиляцию: он тяжелее воздуха
   и стекает вниз. На первом уровне его нет; со второго — редкие лёгкие
   карманы у вивариев и теплиц; ниже — гуще и чаще; плотнее всего — в
   «Колыбели»; на дне — тёплый, живой. Ткани тварей в тумане (и в рюкзаке,
   если вы стоите в густом тумане без защиты) насыщаются мутагеном: они
   сильнее, но составы из них мутагенные. Мутаген выводят щёлочью — он
   оседает конденсатом, из которого делают антимутаген, сыворотку
   адаптации, ингибитор и управляемую мутацию.
   МУТАЦИЯ ГЕРОЯ (0–100) копится в тумане без защиты, от укусов ядовитых
   тварей и мутагенных составов. Четыре стадии: голод сильнее; затем сила
   в руках и «свой запах» для тварей без разума, но лекарства слабеют;
   затем сама собой затягиваются раны, но давят нервы и сводят судороги;
   на сотне — превращение («Эхо» возвращает вас к капсуле, мутация — 60).
   Выводят: антимутаген, целители, долгий сон в капсуле; душ — немного.
   НАПРАВЛЕНИЯ: фармакология, токсикология, энергохимия, пиротехника,
   биотехнология — ступени до пятой; общая ступень химика до десятой;
   специализации (на 4-й и 8-й общей) растут ещё на двух ступенях.
   МОДИФИКАЦИИ СОСТАВА (добавки при синтезе): продлённое действие
   (стабилизатор), усиленное (активатор), без побочного действия (сорбент),
   катализатор поднимает сорт. Мутагенное сырьё даёт состав «на мутагене».
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
function refresh() { if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh(); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function dk() { return LAB.dk ? LAB.dk() : {}; }

/* ════════ СЫРЬЁ: семейства и сорта ════════
   org — ткань твари: в тумане насыщается мутагеном. one — без сортов. */
var FAM = {
  c_solvent:    { n: ["Растворитель", "Очищенный растворитель", "Растворитель особой чистоты"], icon: "🧴", depth: 1, price: 6, br: "energy", desc: "Технический спирт с ацетоном: растворяет, вытягивает и отмывает посуду.", src: "лаборатории и склады химии; перегонка реагента с маслом" },
  c_salt:       { n: ["Минеральные соли", "Очищенные соли", "Химически чистые соли"], icon: "🧂", depth: 1, price: 5, br: "tox", desc: "Соли калия и натрия: основа растворов, буферов и лекарств.", src: "лаборатории, медпункты, кухни и склады; нейтрализация кислоты щёлочью" },
  c_blood:      { n: ["Гемолимфа", "Плазма гемолимфы", "Концентрат антител"], icon: "🩸", depth: 1, price: 7, br: "pharm", org: 1, desc: "Гемолимфа твари: белки свёртывания и антитела для сывороток.", src: "твари; медпункты и криохранилища" },
  c_gland:      { n: ["Железа твари", "Гормональный экстракт", "Чистый гормон"], icon: "🫀", depth: 1, price: 9, br: "pharm", org: 1, desc: "Гормоны, которыми твари гонят себя в бой: основа стимуляторов и обезболивающих.", src: "твари, особенно крупные и быстрые" },
  c_venom:      { n: ["Ядовитый мешочек", "Очищенный токсин", "Кристаллический токсин"], icon: "🦂", depth: 1, price: 11, br: "tox", org: 1, desc: "Яд твари: из него делают и яды, и противоядия.", src: "ядовитые и сосущие кровь твари; виварии" },
  c_coolant:    { n: ["Хладагент", "Криогенный хладагент", "Сверхтекучий хладагент"], icon: "❄️", depth: 1, price: 8, br: "energy", desc: "Хладагент из контура машины: холодит пальцы даже сквозь пластик.", src: "роботы, турели и камеры; насосные, компрессорные, серверные" },
  c_electrolyte:{ n: ["Электролит", "Ёмкий электролит", "Ионный гель"], icon: "⚡", depth: 1, price: 9, br: "energy", desc: "Электролит батарейных отсеков: питает самодельные элементы.", src: "роботы; генераторные и щитовые; кислота с солями" },
  c_oil:        { n: ["Техническое масло", "Очищенное масло", "Синтетическая смазка"], icon: "🛢️", depth: 1, price: 6, br: "energy", desc: "Масло из приводов: смазка, растворитель смол и основа горючих смесей.", src: "роботы; мастерские, сборочные цеха и насосные" },
  c_acidc:      { n: ["Концентрированная кислота", "Дымящая кислота", "Сверхкислота"], icon: "🧪", depth: 2, price: 12, br: "tox", desc: "Кислота под притёртой пробкой: травит металл и плоть.", src: "лаборатории, склады химии, аккумуляторные; кислотные мешки тварей" },
  c_alkali:     { n: ["Щёлочь", "Очищенная щёлочь", "Щёлочь особой чистоты"], icon: "🫙", depth: 2, price: 10, br: "tox", desc: "Едкая щёлочь в гранулах: гасит кислоты, вяжет кровь и выводит мутаген из тканей.", src: "лаборатории, прачечные и склады" },
  c_chitin:     { n: ["Хитиновые пластины", "Хитиновый порошок", "Хитозан"], icon: "🐚", depth: 2, price: 12, br: "bio", org: 1, desc: "Панцирь твари: растёртый в пасту, твердеет на коже и держит удар.", src: "панцирные твари; виварии и инкубаторы; хитин «Колыбели»" },
  c_spores:     { n: ["Споровая пыльца", "Споровый концентрат", "Живые споры"], icon: "🍄", depth: 2, price: 10, br: "bio", org: 1, desc: "Пыльца грибниц: облаком сбивает тварям чутьё.", src: "грибницы, споровые и ползучие твари; оранжереи и теплицы" },
  c_acid:       { n: ["Кислотный мешок", "Кислотный секрет", "Кислотный кристалл"], icon: "🟢", depth: 3, price: 15, br: "tox", org: 1, desc: "Мешок кислотника: шипит, если сжать. Едче лабораторной кислоты.", src: "кислотные и взрывающиеся твари" },
  c_nerve:      { n: ["Нервный узел", "Нейроэкстракт", "Нейромедиатор"], icon: "🧠", depth: 3, price: 18, br: "pharm", org: 1, desc: "Нервный узел разумной твари: успокоительные, ноотропы и нервный газ.", src: "разумные твари, вожаки, жрецы и стражи; нервный корень «Колыбели»" },
  c_fuel:       { n: ["Топливный гель", "Стабилизированное топливо", "Высокоэнергетическое топливо"], icon: "🔥", depth: 3, price: 14, br: "pyro", desc: "Загущённое топливо из баков сварщиков и тяжёлых машин: горит долго и жарко.", src: "сварщики, резчики и тяжёлые роботы; генераторные; смола «Колыбели»" },
  c_phosphor:   { n: ["Белый фосфор", "Красный фосфор", "Фосфорный концентрат"], icon: "✴️", depth: 4, price: 20, br: "pyro", desc: "Фосфор под водой в банке: на воздухе вспыхивает сам. Сердце пиротехники.", src: "склады химии и оружейные с четвёртого уровня" },
  c_enzyme:     { n: ["Ферментная культура", "Активные ферменты", "Чистый фермент"], icon: "🧫", depth: 4, price: 22, br: "bio", org: 1, desc: "Живая культура ферментов: ускоряет любой биосинтез.", src: "биолаборатории, инкубаторы и чаны с четвёртого уровня; клетки Омеги" },
  c_catalyst:   { n: ["Платиновый катализатор", "Палладиевый катализатор", "Наноструктурный катализатор"], icon: "💠", depth: 5, price: 40, br: "energy", desc: "Сетка катализатора: ведёт реакцию куда нужно. Добавка к синтезу поднимает сорт состава.", src: "роботы с модификациями и стражи, склады глубоких уровней; амальгама и нанопаста" },
  c_ecto:       { n: ["Аномальная взвесь", "Сгущённая взвесь", "Кристаллы взвеси"], icon: "🌫️", depth: 6, price: 50, br: "bio", desc: "Светящаяся взвесь аномалий: свойства меняет, пока на неё смотрят.", src: "аномалии и установки глубин" },
  c_cond:       { n: ["Мутагенный конденсат", "Концентрат мутагена", "Чистый мутаген"], icon: "🟣", depth: 2, price: 18, br: "bio", desc: "Капли мутагена, осевшие из тумана: светятся в темноте. Из него делают антимутаген и всё, что с мутагеном спорит.", src: "помещения с мутагенным туманом; вывод мутагена из тканей щёлочью; твари «Колыбели» и глубже" },
  c_stab:       { n: ["Стабилизатор"], one: 1, icon: "⚖️", depth: 3, price: 16, br: "pharm", desc: "Добавка к синтезу: состав действует вдвое дольше.", src: "склады химии с третьего уровня; соли со щёлочью и растворителем; воск улья" },
  c_activ:      { n: ["Активатор"], one: 1, icon: "🔆", depth: 5, price: 20, br: "pharm", desc: "Добавка к синтезу: состав действует на треть сильнее, но и побочное действие сильнее.", src: "склады химии с пятого уровня; железа с электролитом и растворителем" }
};
var FAM_IDS = Object.keys(FAM);
var GRADE_W = [null, "технический сорт", "очищенный сорт", "особая чистота"];
function matId(f, g, sat) { return f + (g > 1 ? "_" + g : "") + (sat ? "_m" : ""); }
var MAT = {}; /* id → { f, g, sat } */
FAM_IDS.forEach(function (f) {
  var F0 = FAM[f], gs = F0.one ? [1] : [1, 2, 3];
  gs.forEach(function (g) {
    [false, true].forEach(function (sat) {
      if (sat && !F0.org) return;
      var id = matId(f, g, sat);
      MAT[id] = { f: f, g: g, sat: sat };
      if (LAB.ITEMS[id]) return;
      LAB.ITEMS[id] = { n: F0.n[g - 1] + (sat ? " с мутагеном" : ""), icon: F0.icon, kind: "chem", cat: "chem", fam: f, g: g, sat: sat ? 1 : 0,
        depth: g === 1 ? F0.depth : Math.max(F0.depth, g === 2 ? 3 : 8), price: Math.round(F0.price * [1, 1, 2.2, 4][g] * (sat ? 1.3 : 1)),
        desc: F0.desc + (F0.one ? "" : " " + cap1(GRADE_W[g]) + (g === 2 ? ": составы из него сильнее, а лекарств выходит больше." : g === 3 ? ": лучшие составы — только из такого." : ".")) + (sat ? " Насыщено мутагеном из тумана: в составе сильнее на сорт, но состав выйдет мутагенным. Мутаген выводят щёлочью на химическом столе." : "") };
    });
  });
});
/* Сорт находки на глубине: чем ниже, тем чище (и тем живее ткани). */
function gradeAt(L, r) {
  var q = r(), g2 = L <= 5 ? 0 : L <= 10 ? 0.1 : L <= 20 ? 0.2 : L <= 40 ? 0.35 : L <= 60 ? 0.45 : L <= 80 ? 0.45 : 0.35;
  var g3 = L <= 20 ? 0 : L <= 40 ? 0.05 : L <= 60 ? 0.15 : L <= 80 ? 0.3 : 0.5;
  return q < g3 ? 3 : q < g3 + g2 ? 2 : 1;
}

/* ════════ СОСТАВЫ ════════
   ce — действие (use), fx — общее действие предмета (game.js, useFx), gren —
   граната (combat.throwGrenade). mods — какие модификации допустимы;
   mut — ткани с мутагеном дают состав «на мутагене» (мутация при приёме). */
var PROD = {
  c_antimut:   { n: "Антимутаген", icon: "💉", kind: "use", cat: "med", br: "pharm", ce: "antimut", price: 70, depth: 2, mods: ["strong", "clean"], desc: "Ингибитор мутагена на щёлочи и конденсате: мутация минус тридцать." },
  c_adapt:     { n: "Сыворотка адаптации", icon: "🧬", kind: "use", cat: "med", br: "bio", ce: "adapt", price: 60, depth: 2, mods: ["long"], desc: "Полторы минуты туман мутагена не берёт вас, а мутация не растёт." },
  c_controlled:{ n: "Сыворотка управляемой мутации", icon: "🧬", kind: "use", cat: "med", br: "bio", ce: "ctrl", price: 140, depth: 5, mods: ["long", "strong"], mut: 1, desc: "Пять минут — сила в руках, тварям без разума вы свой, раны затягиваются; лекарства не слабеют. Мутация плюс пять." },
  c_clarity:   { n: "Ноотроп «Ясность»", icon: "💊", kind: "use", cat: "med", br: "pharm", price: 40, depth: 2, mods: ["strong"], mut: 1, desc: "Нейронагрузка минус 25, бодрость плюс 20, и слух обостряется — «Эхо» прослушивает всё вокруг.", fx: { neuro: -25, wake: 20, scan: 1 } },
  c_regen:     { n: "Регенерирующая сыворотка", icon: "💉", kind: "use", cat: "med", br: "pharm", ce: "regen", price: 60, depth: 3, mods: ["long", "strong"], mut: 1, desc: "Полминуты раны затягиваются сами — около пятидесяти здоровья." },
  c_antitox:   { n: "Универсальный антитоксин", icon: "🧪", kind: "use", cat: "med", br: "tox", price: 45, depth: 2, mods: ["long", "strong"], desc: "Снимает отравление, выводит 60 токсинов, и минуту яды, споры и туман не действуют.", fx: { cure: true, detox: 60, antitox: 120 } },
  c_repel:     { n: "Репеллент", icon: "🧴", kind: "use", br: "tox", ce: "repel", price: 35, depth: 2, mods: ["long"], desc: "Минуту твари без разума не чуют вас дальше шага. Разумных, стражей и машин не обманет." },
  c_coat_tox:  { n: "Ядовитая смазка", icon: "🦂", kind: "use", br: "tox", ce: "coat", price: 40, depth: 1, mods: ["long", "strong"], desc: "Для клинка, дубинки или стальных пуль: пятнадцать попаданий травят тварей и бьют их на пятую часть сильнее." },
  c_coat_acid: { n: "Кислотная смазка", icon: "🟢", kind: "use", br: "tox", ce: "coat", price: 55, depth: 3, mods: ["long", "strong"], desc: "Для оружия ближнего боя и стальных пуль: пятнадцать попаданий сквозь броню, а машин — сильнее." },
  c_toxgren:   { n: "Ядовитая граната", icon: "☠️", kind: "throw", br: "tox", price: 50, depth: 2, mods: ["long", "strong", "clean"], desc: "Травит всех на шаг вокруг, над местом падения долго висит ядовитый туман. Машинам почти не вредит.",
    gren: { dmg: 10, r: 1, dt: "bio", gas: 14, self: true, range: 5, fuse: 900, loud: 5 } },
  c_acidflask: { n: "Кислотная колба", icon: "⚗️", kind: "throw", br: "tox", price: 55, depth: 3, mods: ["long", "strong", "clean"], desc: "Лопается и разъедает панцири и броню всем на шаг вокруг.",
    gren: { dmg: 14, r: 1, dt: "acid", noarmor: true, gas: 6, self: true, range: 5, fuse: 800, loud: 5 } },
  c_nervegas:  { n: "Нервно-паралитический газ", icon: "💀", kind: "throw", br: "tox", price: 110, depth: 5, mods: ["long", "strong", "clean"], desc: "На два шага вокруг твари бьются в судорогах и замирают, а туман держится долго. Машинам — ничего.",
    gren: { dmg: 18, r: 2, dt: "bio", gas: 20, stun: 4, self: true, range: 6, fuse: 1000, loud: 6 } },
  c_inhibit:   { n: "Ингибиторная граната", icon: "🟪", kind: "throw", br: "tox", price: 90, depth: 3, mods: ["long", "strong"], desc: "Облако ингибитора на два шага: мутаген в тварях гаснет — они слабеют, их бьют сильнее, и идут они вяло. Машинам и вам — ничего.",
    gren: { dmg: 6, r: 2, dt: "bio", inhibit: 1, slow: 8, self: false, range: 6, fuse: 900, loud: 4 } },
  c_fuelamp:   { n: "Топливная ампула", icon: "🔋", kind: "use", br: "energy", price: 35, depth: 3, mods: ["strong"], desc: "Энергия имплантов плюс 50, бодрость плюс 5. Нервы не нагружает.", en: 50, wake: 5 },
  c_coolgel:   { n: "Охлаждающий гель", icon: "❄️", kind: "use", br: "energy", ce: "cool", price: 30, depth: 1, mods: ["long"], desc: "Мгновенно остужает оружие в руках, и полминуты оно не греется." },
  c_overcharge:{ n: "Перегрузочная капсула", icon: "⚡", kind: "use", br: "energy", ce: "over", price: 60, depth: 2, mods: ["long", "strong"], desc: "В энергоблок оружия: следующие шесть выстрелов на батареях — в полтора раза сильнее." },
  c_gunoil:    { n: "Оружейная смазка", icon: "🛢️", kind: "use", br: "energy", ce: "oil", price: 30, depth: 1, mods: ["strong"], desc: "Оружие в руках чище и надёжнее: плюс двадцать к состоянию, не выше девяноста." },
  c_smoke:     { n: "Дымовая шашка", icon: "🌫️", kind: "throw", br: "pyro", price: 30, depth: 1, mods: ["long"], desc: "На два шага вокруг враги и камеры вас теряют, а машины путаются. Урона нет.",
    gren: { dmg: 0, r: 2, dt: "kinetic", smoke: true, blind: 16, confuse: 4, self: false, range: 5, fuse: 700, loud: 3 } },
  c_flash:     { n: "Магниевая вспышка", icon: "🎆", kind: "throw", br: "pyro", price: 45, depth: 4, mods: ["long"], desc: "Вспышка слепит всех на два шага вокруг, твари замирают. Урона нет, вас не заденет.",
    gren: { dmg: 0, r: 2, dt: "sonic", blind: 20, stun: 2, self: false, range: 6, fuse: 900, loud: 9 } },
  c_cryo:      { n: "Криосмесь", icon: "🧊", kind: "throw", br: "pyro", price: 45, depth: 2, mods: ["long", "strong", "clean"], desc: "Схватывает инеем всех на шаг вокруг: цели застывают, потом движутся вяло.",
    gren: { dmg: 10, r: 1, dt: "cryo", freeze: 3, slow: 6, self: true, range: 5, fuse: 800, loud: 5 } },
  c_napalm:    { n: "Напалм", icon: "🔥", kind: "throw", br: "pyro", price: 90, depth: 4, mods: ["long", "strong", "clean"], desc: "Огонь на два шага вокруг, и пол горит ещё долго. Бросайте подальше.",
    gren: { dmg: 24, r: 2, dt: "thermo", burn: 16, self: true, range: 5, fuse: 900, loud: 9 } },
  c_thermite:  { n: "Термитный заряд", icon: "🧨", kind: "use", br: "pyro", ce: "thermite", price: 80, depth: 4, mods: [], desc: "Прожигает замок запертой двери под ключ, код или пропуск — и замок сейфа. Громко: ОКО услышит." },
  c_salve:     { n: "Хитиновая мазь", icon: "🐚", kind: "use", br: "bio", ce: "salve", price: 45, depth: 2, mods: ["long", "strong"], mut: 1, desc: "Схватывается на коже коркой: щит на 30 урона, держится полминуты." },
  c_bait:      { n: "Феромонная приманка", icon: "🍖", kind: "use", br: "bio", ce: "bait", price: 30, depth: 1, mods: ["long"], desc: "Бросьте — твари поблизости пойдут на запах, а вы в другую сторону. Машинам всё равно." },
  c_culture:   { n: "Культура регенерации", icon: "🧫", kind: "use", cat: "med", br: "bio", ce: "regen2", price: 90, depth: 4, mods: ["long", "strong"], mut: 1, desc: "Две с половиной минуты здоровье понемногу возвращается — до сотни." },
  c_mutagen:   { n: "Мутагенный стимулятор", icon: "🧬", kind: "use", cat: "med", br: "bio", price: 80, depth: 5, mods: ["long", "strong", "clean"], mut: 1, mutAdd: 10, desc: "Гормоны тварей на конденсате мутагена: здоровье плюс 40, энергия плюс 30 и ускорение. Токсины плюс 25, мутация плюс 10.", fx: { heal: 40, en: 30, haste: 40, tox: 25 } },
  c_ectoserum: { n: "Сыворотка из взвеси", icon: "✨", kind: "use", cat: "med", br: "bio", price: 160, depth: 6, mods: ["strong"], desc: "Здоровье плюс 150, снимает отравление и кровотечение, нейронагрузку и токсины, энергия плюс 50, мутация минус десять.", fx: { heal: 150, cure: true, en: 50, neuro: -50, detox: 50, stopBleed: true }, mutCut: 10 }
};
var MOD = {
  long:   { n: "продлённого действия", add: "c_stab", d: "действует вдвое дольше" },
  strong: { n: "усиленного действия", add: "c_activ", d: "на треть сильнее, но и побочное действие сильнее" },
  clean:  { n: "без побочного действия", add: "sorbent", d: "без токсинов и мутагена; свои гранаты такого состава вас не задевают" },
  mut:    { n: "на мутагене", add: "", d: "сильнее, но прибавляет мутацию" }
};
var GRADE_P = [null, "", ", высокой чистоты", ", особой чистоты"];
function vk(g, mod, base) {
  var mag = [1, 1, 1.3, 1.6][g], dur = [1, 1, 1.2, 1.4][g], side = 1;
  if (mod === "long") dur *= 2;
  if (mod === "strong") { mag *= 1.35; side *= 1.5; }
  if (mod === "clean") side = 0;
  if (mod === "mut") { mag *= 1.25; dur *= 1.15; }
  return { mag: mag, dur: dur, side: side, mutAdd: Math.round(((base.mutAdd || 0) + (mod === "mut" ? 6 : 0)) * (mod === "clean" ? 0 : mod === "strong" ? 1.5 : 1)) };
}
var MAG_FX = { heal: 1, en: 1, shield: 1, detox: 1, wake: 1, neuro: 1 }, DUR_FX = { antitox: 1, haste: 1, cloak: 1 }, SIDE_FX = { tox: 1 };
var MAG_G = { dmg: 1 }, DUR_G = { gas: 1, burn: 1, blind: 1, confuse: 1, stun: 1, freeze: 1, slow: 1 };
function prodId(b, g, mod) { return b + (g > 1 ? "_g" + g : "") + (mod ? "_" + mod : ""); }
var PV = {}; /* id → { b, g, mod } */
function makeVariant(b, g, mod) {
  var P = PROD[b], id = prodId(b, g, mod), k = vk(g, mod, P), d = {}, key;
  for (key in P) if (key !== "mods" && key !== "fx" && key !== "gren") d[key] = P[key];
  d.n = P.n + GRADE_P[g] + (mod ? ", " + MOD[mod].n : "");
  d.base = b; d.g = g; d.mod = mod || ""; d.vk = k;
  d.price = Math.round(P.price * [1, 1, 1.8, 3][g] * (mod ? 1.35 : 1));
  d.depth = P.depth + (g - 1);
  if (P.ce) d.chem = true;
  if (P.en) d.en = Math.round(P.en * k.mag);
  if (P.wake) d.wake = Math.round(P.wake * k.mag);
  if (P.fx) { d.fx = {}; for (key in P.fx) { var v = P.fx[key]; d.fx[key] = typeof v !== "number" ? v : MAG_FX[key] ? Math.round(v * k.mag) : DUR_FX[key] ? Math.round(v * k.dur) : SIDE_FX[key] ? Math.round(v * k.side) : v; } }
  if (P.gren) { var q = {}; for (key in P.gren) { var w = P.gren[key]; q[key] = typeof w !== "number" ? w : MAG_G[key] ? Math.round(w * k.mag) : DUR_G[key] ? Math.round(w * k.dur) : w; } if (mod === "clean") q.self = false; d.fx = { gren: q }; }
  var notes = [];
  if (g > 1) notes.push((g === 2 ? "Высокая чистота" : "Особая чистота") + ": сильнее" + (g === 2 ? " на треть" : " в полтора раза") + ".");
  if (mod) notes.push(cap1(MOD[mod].n) + ": " + MOD[mod].d + ".");
  if (k.mutAdd) notes.push("Мутация плюс " + k.mutAdd + ".");
  d.desc = P.desc + (notes.length ? " " + notes.join(" ") : "");
  PV[id] = { b: b, g: g, mod: mod || "" };
  if (!LAB.ITEMS[id]) LAB.ITEMS[id] = d;
}
Object.keys(PROD).forEach(function (b) {
  var mods = [""].concat(PROD[b].mods || []);
  if (PROD[b].mut && mods.indexOf("mut") < 0) mods.push("mut");
  [1, 2, 3].forEach(function (g) { mods.forEach(function (m) { makeVariant(b, g, m); }); });
});

/* ════════ НАПРАВЛЕНИЯ, СТУПЕНИ, СПЕЦИАЛИЗАЦИИ ════════ */
var BR = {
  pharm:  { n: "фармакология", t: "Фармакология", d: "лекарства, сыворотки и антимутаген" },
  tox:    { n: "токсикология", t: "Токсикология", d: "противоядия, яды, смазки для оружия, газ, кислота, ингибитор и репеллент" },
  energy: { n: "энергохимия", t: "Энергохимия", d: "энергобатареи, топливо для имплантов, охлаждение, перегрузка и смазка оружия" },
  pyro:   { n: "пиротехника", t: "Пиротехника", d: "дым, огонь, холод, вспышка и термит" },
  bio:    { n: "биотехнология", t: "Биотехнология", d: "мази, приманки, культуры, сыворотки и управляемая мутация" }
};
var BR_IDS = ["pharm", "tox", "energy", "pyro", "bio"];
var BR_XP = [0, 25, 70, 150, 270, 440];
var ALL_XP = [0, 40, 110, 220, 380, 600, 880, 1250, 1700, 2300];
/* Специализация растёт вместе с направлением: первая ступень — при выборе,
   вторая — на четвёртой ступени направления, третья — на пятой. */
var SPECS = {
  pharm:  { n: "фармаколог", r: ["лекарства лечат на четверть сильнее", "ваши стимуляторы и мутагены — без передозировки, токсинов от них вдвое меньше", "аптечки, бинты и сыворотки ещё и снимают отравление и кровотечение, антимутаген — в полтора раза сильнее"] },
  tox:    { n: "токсиколог", r: ["смазки держатся вдвое дольше", "яд тварей действует на вас вдвое короче, туман копится на треть медленнее", "отравленные твари вязнут, а кислота снимает щиты машин"] },
  energy: { n: "энергохимик", r: ["батареи и топливные ампулы выходят вдвое", "перегрузочная капсула — на три выстрела больше, охлаждающий гель — вдвое дольше", "оружие на батареях греется на четверть меньше"] },
  pyro:   { n: "пиротехник", r: ["гранаты и шашки выходят вдвое", "свои гранаты вас не задевают", "свои химические гранаты бьют на шаг шире"] },
  bio:    { n: "биотехнолог", r: ["с тварей ткани падают вдвое чаще", "мази, культуры и приманки — вдвое дольше, мутагенные составы и укусы дают вдвое меньше мутации", "ткани тварей падают на сорт чище, а мутация не ослабляет лекарства"] }
};
function ch() { var g = G(); if (!g.chem) g.chem = {}; var c = g.chem; if (!c.xp) c.xp = {}; if (!c.spec) c.spec = []; if (!c.known) c.known = {}; if (!c.seen) c.seen = {}; if (!c.opt) c.opt = { best: false, cat: false, mod: "" }; return c; }
function brXp(b) { return ch().xp[b] || 0; }
function brLv(b) { var x = brXp(b), n = 0; for (var i = 1; i < BR_XP.length; i++) if (x >= BR_XP[i]) n = i; return n; }
function totalXp() { var s = 0, x = ch().xp; for (var k in x) s += x[k] || 0; return s; }
function level() { var x = totalXp(), n = 1; for (var i = 1; i < ALL_XP.length; i++) if (x >= ALL_XP[i]) n = i + 1; return n; }
function spec(b) { return ch().spec.indexOf(b) >= 0; }
function rank(b) { return !spec(b) ? 0 : brLv(b) >= 5 ? 3 : brLv(b) >= 4 ? 2 : 1; }
function specSlots() { var l = level(); return l >= 8 ? 2 : l >= 4 ? 1 : 0; }
function gain(b, n) {
  if (!BR[b] || !n) return;
  var c = ch(), b0 = brLv(b), l0 = level(), r0 = rank(b);
  c.xp[b] = brXp(b) + Math.max(1, Math.round(n * (dk().chemXp || 1))); /* режим сложности */
  var b1 = brLv(b), l1 = level(), r1 = rank(b);
  if (b1 > b0) gm().later(function () { A("play", "ui_levelup"); sayq("Химия, " + BR[b].n + ": ступень " + b1 + ". Составы направления сильнее, чаще выходят с запасом и реже срываются" + (b1 === 1 || b1 === 3 ? ", а сорт состава может быть выше" : "") + "." + (b1 >= 2 ? " Рецептуры до " + (b1 - 1) + "-й ступени вы теперь угадываете сами." : "")); }, 700);
  if (r1 > r0) gm().later(function () { A("play", "ui_levelup"); sayq("Специализация «" + SPECS[b].n + "», ступень " + r1 + ": " + SPECS[b].r[r1 - 1] + "."); }, 1100);
  if (l1 > l0) gm().later(function () { A("play", "ui_levelup"); sayq("Химик: общая ступень " + l1 + ". " + levelPerk(l1)); }, 1500);
}
function levelPerk(n) {
  return ({ 2: "Переработка сырья иногда даёт лишнюю порцию.", 3: "Анализ состава через раз обходится без порчи образца.",
    4: "Можно выбрать специализацию — у химического стола, «Химия: ступени и специализация».", 5: "Синтез на столе ступенью проще нужного — можно, но срывается чаще.",
    6: "Походная химия: простые составы — без стола, в любом месте.", 7: "Срыв синтеза больше не обжигает и не травит.",
    8: "Можно выбрать вторую специализацию.", 9: "Каждый синтез с запасом чаще.", 10: "Мастер химии: все составы сильнее на десятую часть." })[n] || "";
}
/* Предел сорта по ступени направления: со второй ступени — очищенный, с третьей — особый. */
function gradeCap(b) { var l = brLv(b); return l >= 3 ? 3 : l >= 1 ? 2 : 1; }
function potK(b) { return 1 + 0.05 * brLv(b) + (level() >= 10 ? 0.1 : 0) + (b === "pharm" && rank("pharm") >= 1 ? 0.25 : 0); }
/* Лекарства: фармакология сильнее, мутация слабее (game.js, useItem). */
function healK(id, d) { if (!d || !(d.cat === "med" || /^medkit|^bandage|^herb_/.test(id))) return 1; return potK("pharm") * mutHealK(); }
function noOverdose() { return rank("pharm") >= 2; }
function bioDur() { return rank("bio") >= 2 ? 2 : 1; }
function line() {
  var c = ch(), parts = BR_IDS.filter(function (b) { return brLv(b) > 0; }).map(function (b) { return BR[b].n + " " + brLv(b); });
  return "Химия: общая ступень " + level() + (parts.length ? ", направления — " + parts.join(", ") : ", направления ещё не освоены") + (c.spec.length ? ". Специализация: " + c.spec.map(function (s) { return SPECS[s].n + ", ступень " + rank(s); }).join("; ") : "") + "." + (mut() >= 1 ? " " + mutLine() : "");
}

/* ════════ РЕЦЕПТЫ ════════
   need — семейства сырья (любой сорт) и прочие вещи; lv — ступень направления,
   st — ступень стола; f — рецептуру надо узнать (журнал, анализ) или
   дорасти: направление на две ступени выше; minG — только сырьё не ниже сорта. */
var RC = [
  { id: "h_bandage", out: "bandage", br: "pharm", lv: 0, st: 1, need: { c_blood: 1, c_salt: 1 } },
  { id: "h_coagulant", out: "coagulant", br: "pharm", lv: 0, st: 1, need: { c_blood: 1, c_alkali: 1 } },
  { id: "h_medkit", out: "medkit_s", br: "pharm", lv: 0, st: 1, need: { gel: 1, c_blood: 1, c_salt: 1 } },
  { id: "h_painkiller", out: "painkiller", br: "pharm", lv: 0, st: 1, need: { c_gland: 1, c_solvent: 1 } },
  { id: "h_iodine", out: "iodine", br: "pharm", lv: 1, st: 1, need: { c_salt: 2, c_acidc: 1 } },
  { id: "h_eardrops", out: "eardrops", br: "pharm", lv: 1, st: 1, need: { c_salt: 1, c_solvent: 1, gel: 1 } },
  { id: "h_calm", out: "calm", br: "pharm", lv: 1, st: 1, need: { c_nerve: 1, c_salt: 1 } },
  { id: "h_antimut", out: "c_antimut", br: "pharm", lv: 1, st: 2, need: { c_cond: 1, c_alkali: 1, c_salt: 1 } },
  { id: "h_adrenaline", out: "adrenaline", br: "pharm", lv: 1, st: 2, need: { c_gland: 2, c_salt: 1 } },
  { id: "h_stim", out: "stim", br: "pharm", lv: 1, st: 2, need: { c_gland: 1, c_electrolyte: 1, c_solvent: 1 } },
  { id: "h_antirad", out: "antirad", br: "pharm", lv: 2, st: 2, need: { c_salt: 2, c_alkali: 1 } },
  { id: "h_neuroblock", out: "neuroblock", br: "pharm", lv: 2, st: 2, need: { c_nerve: 1, c_solvent: 1, c_salt: 1 } },
  { id: "h_medkit_l", out: "medkit_l", br: "pharm", lv: 2, st: 2, need: { gel: 2, c_blood: 2, c_salt: 1, c_solvent: 1 } },
  { id: "h_clarity", out: "c_clarity", br: "pharm", lv: 2, st: 2, f: 1, need: { c_nerve: 1, c_gland: 1, c_solvent: 1 } },
  { id: "h_regen", out: "c_regen", br: "pharm", lv: 3, st: 3, f: 1, need: { c_blood: 2, c_enzyme: 1, gel: 1 } },
  { id: "h_trauma", out: "trauma", br: "pharm", lv: 3, st: 3, f: 1, need: { gel: 2, c_blood: 2, c_gland: 1, c_salt: 1 } },
  { id: "h_radaway", out: "radaway", br: "pharm", lv: 3, st: 3, f: 1, need: { c_salt: 2, c_solvent: 1, c_enzyme: 1 } },
  { id: "h_nanomed", out: "nanomed", br: "pharm", lv: 5, st: 4, f: 1, minG: 2, need: { c_catalyst: 1, c_enzyme: 1, gel: 2, c_blood: 2 } },
  { id: "t_antidote", out: "antidote", br: "tox", lv: 0, st: 1, need: { c_venom: 1, c_salt: 1 } },
  { id: "t_sorbent", out: "sorbent", br: "tox", lv: 0, st: 1, need: { c_oil: 1, c_salt: 1 } },
  { id: "t_coat", out: "c_coat_tox", br: "tox", lv: 1, st: 1, need: { c_venom: 2, c_oil: 1 } },
  { id: "t_repel", out: "c_repel", br: "tox", lv: 1, st: 1, need: { c_spores: 1, c_gland: 1, c_solvent: 1 } },
  { id: "t_antitox", out: "c_antitox", br: "tox", lv: 2, st: 2, need: { c_venom: 1, c_alkali: 1, c_salt: 1 } },
  { id: "t_toxgren", out: "c_toxgren", br: "tox", lv: 2, st: 2, need: { c_venom: 2, c_spores: 1, scrap: 1 } },
  { id: "t_acidcoat", out: "c_coat_acid", br: "tox", lv: 2, st: 2, f: 1, need: { c_acidc: 1, c_acid: 1, c_oil: 1 } },
  { id: "t_acidflask", out: "c_acidflask", br: "tox", lv: 3, st: 2, f: 1, need: { c_acidc: 1, c_acid: 1, c_solvent: 1 } },
  { id: "t_inhibit", out: "c_inhibit", br: "tox", lv: 3, st: 3, f: 1, need: { c_cond: 1, c_alkali: 2, c_salt: 1 } },
  { id: "t_nervegas", out: "c_nervegas", br: "tox", lv: 5, st: 3, f: 1, minG: 2, need: { c_nerve: 2, c_venom: 2, c_catalyst: 1 } },
  { id: "e_battery", out: "ammo:energy", br: "energy", lv: 0, st: 1, need: { c_electrolyte: 2, c_salt: 1, scrap: 1 } },
  { id: "e_coolgel", out: "c_coolgel", br: "energy", lv: 0, st: 1, need: { c_coolant: 2, gel: 1 } },
  { id: "e_gunoil", out: "c_gunoil", br: "energy", lv: 0, st: 1, need: { c_oil: 2, c_solvent: 1 } },
  { id: "e_fuelamp", out: "c_fuelamp", br: "energy", lv: 1, st: 2, need: { c_fuel: 1, c_electrolyte: 1 } },
  { id: "e_overcharge", out: "c_overcharge", br: "energy", lv: 2, st: 2, f: 1, need: { c_electrolyte: 2, c_acidc: 1, cap: 1 } },
  { id: "e_cells", out: "ammo:energy", qty: 3, n: "Энергобатареи на катализаторе, три", br: "energy", lv: 4, st: 3, f: 1, minG: 2, need: { c_electrolyte: 2, c_catalyst: 1, cap: 1 } },
  { id: "p_smoke", out: "c_smoke", br: "pyro", lv: 0, st: 1, need: { c_salt: 1, c_oil: 1, c_solvent: 1 } },
  { id: "p_firebomb", out: "g_firebomb", br: "pyro", lv: 1, st: 2, need: { c_fuel: 1, c_solvent: 1, scrap: 1 } },
  { id: "p_cryo", out: "c_cryo", br: "pyro", lv: 2, st: 2, need: { c_coolant: 2, c_salt: 1, scrap: 1 } },
  { id: "p_flash", out: "c_flash", br: "pyro", lv: 2, st: 2, f: 1, need: { c_phosphor: 1, c_salt: 1, cap: 1 } },
  { id: "p_thermite", out: "c_thermite", br: "pyro", lv: 3, st: 3, f: 1, need: { c_phosphor: 1, c_fuel: 1, scrap: 2 } },
  { id: "p_napalm", out: "c_napalm", br: "pyro", lv: 4, st: 3, f: 1, need: { c_fuel: 2, c_phosphor: 1, c_solvent: 1 } },
  { id: "b_bait", out: "c_bait", br: "bio", lv: 0, st: 1, need: { c_gland: 1, c_blood: 1 } },
  { id: "b_salve", out: "c_salve", br: "bio", lv: 1, st: 2, need: { c_chitin: 2, gel: 1 } },
  { id: "b_gel", out: "gel", qty: 2, n: "Биогель из гемолимфы, две порции", br: "bio", lv: 1, st: 2, need: { c_blood: 2, c_salt: 1 } },
  { id: "b_adapt", out: "c_adapt", br: "bio", lv: 2, st: 2, need: { c_cond: 1, c_blood: 2, gel: 1 } },
  { id: "b_culture", out: "c_culture", br: "bio", lv: 3, st: 3, f: 1, need: { c_enzyme: 1, c_blood: 2, gel: 1 } },
  { id: "b_mutagen", out: "c_mutagen", br: "bio", lv: 4, st: 4, f: 1, need: { c_gland: 2, c_cond: 1, c_enzyme: 1 } },
  { id: "b_controlled", out: "c_controlled", br: "bio", lv: 4, st: 4, f: 1, minG: 2, need: { c_cond: 1, c_enzyme: 1, c_nerve: 1 } },
  { id: "b_ectoserum", out: "c_ectoserum", br: "bio", lv: 5, st: 4, f: 1, minG: 2, need: { c_ecto: 1, c_enzyme: 1, c_blood: 2, gel: 2 } }
];
var RCBY = {};
RC.forEach(function (rc) { RCBY[rc.id] = rc; });
/* Переработка: превращения, добавки, вещества глубин; need и give — точные вещи. */
var REF = [
  { id: "r_neutral", n: "Нейтрализовать кислоту щёлочью — минеральные соли, три", br: "tox", st: 1, need: { c_acidc: 1, c_alkali: 1 }, give: { c_salt: 3 } },
  { id: "r_acid", n: "Отжать кислотный мешок — концентрированная кислота", br: "tox", st: 1, need: { c_acid: 1 }, give: { c_acidc: 1 } },
  { id: "r_venom", n: "Выпарить яд — реагент, два", br: "tox", st: 1, need: { c_venom: 1 }, give: { reagent: 2 } },
  { id: "r_gland", n: "Экстрагировать железу — реагент, два", br: "pharm", st: 1, need: { c_gland: 1, c_solvent: 1 }, give: { reagent: 2 } },
  { id: "r_solvent", n: "Перегнать реагент с маслом — растворитель, два", br: "energy", st: 1, need: { reagent: 1, c_oil: 1 }, give: { c_solvent: 2 } },
  { id: "r_electro", n: "Развести кислоту с солями — электролит, два", br: "energy", st: 1, need: { c_acidc: 1, c_salt: 1 }, give: { c_electrolyte: 2 } },
  { id: "r_chitin", n: "Растворить хитин щёлочью — биогель и соли", br: "bio", st: 1, need: { c_chitin: 1, c_alkali: 1 }, give: { gel: 1, c_salt: 1 } },
  { id: "r_stab", n: "Сварить стабилизатор — две порции", br: "pharm", st: 2, need: { c_salt: 1, c_alkali: 1, c_solvent: 1 }, give: { c_stab: 2 } },
  { id: "r_activ", n: "Выделить активатор — две порции", br: "pharm", st: 2, need: { c_gland: 1, c_electrolyte: 1, c_solvent: 1 }, give: { c_activ: 2 } },
  /* вещества глубин — в сырьё высших сортов */
  { id: "d_chitin", n: "Растереть хитин «Колыбели» — хитиновый порошок, два", br: "bio", st: 2, need: { k_chitin: 1 }, give: { c_chitin_2: 2 } },
  { id: "d_root", n: "Экстрагировать нервный корень — нейроэкстракт, два", br: "pharm", st: 2, need: { k_root: 1, c_solvent: 1 }, give: { c_nerve_2: 2 } },
  { id: "d_salt", n: "Растолочь звонкую соль — химически чистые соли, два", br: "tox", st: 2, need: { k_salt: 1 }, give: { c_salt_3: 2 } },
  { id: "d_resin", n: "Вытопить смолу — стабилизированное топливо, два", br: "pyro", st: 2, need: { k_resin: 1 }, give: { c_fuel_2: 2 } },
  { id: "d_wax", n: "Растопить воск улья — стабилизатор, два", br: "pharm", st: 1, need: { k_wax: 1 }, give: { c_stab: 2 } },
  { id: "d_silver", n: "Восстановить амальгаму — палладиевый катализатор", br: "energy", st: 3, need: { o_silver: 1, c_acidc: 1 }, give: { c_catalyst_2: 1 } },
  { id: "d_nano", n: "Разложить нанопасту — наноструктурный катализатор", br: "energy", st: 3, need: { m_nanopaste: 1, c_solvent: 1 }, give: { c_catalyst_3: 1 } },
  { id: "d_omega", n: "Развести клетки Омеги — чистый фермент, два", br: "bio", st: 3, need: { i_omegagel: 1, c_salt: 1 }, give: { c_enzyme_3: 2 } },
  { id: "d_fiber", n: "Разварить волокно первого дерева — хитозан, два", br: "bio", st: 3, need: { i_treefiber: 1, c_alkali: 1 }, give: { c_chitin_3: 2 } }
];
/* Очистка: из двух порций сорта ниже — одна сорта выше (растворитель того же сорта). */
FAM_IDS.forEach(function (f) {
  if (FAM[f].one) return;
  var nm = FAM[f].n;
  REF.push({ id: "p2_" + f, n: "Очистить: " + low(nm[0]) + " — " + low(nm[1]), br: FAM[f].br, st: 2, pur: 2, need: f === "c_solvent" ? { c_solvent: 3 } : (function () { var o = {}; o[f] = 2; o.c_solvent = 1; return o; })(), give: (function () { var o = {}; o[matId(f, 2)] = 1; return o; })() });
  REF.push({ id: "p3_" + f, n: "Довести до особой чистоты: " + low(nm[1]) + " — " + low(nm[2]), br: FAM[f].br, st: 3, pur: 3, need: f === "c_solvent" ? { c_solvent_2: 3 } : (function () { var o = {}; o[matId(f, 2)] = 2; o.c_solvent_2 = 1; return o; })(), give: (function () { var o = {}; o[matId(f, 3)] = 1; return o; })() });
});
function refOk(rf) { for (var k in rf.need) if (!LAB.ITEMS[k]) return false; for (var k2 in rf.give) if (!LAB.ITEMS[k2]) return false; return true; }
function outOk(rc) { var o = String(rc.out); return o.indexOf("ammo:") === 0 ? !!LAB.AMMO[o.slice(5)] : !!LAB.ITEMS[o]; }
function outName(rc) { if (rc.n) return rc.n; var o = String(rc.out); return o.indexOf("ammo:") === 0 ? LAB.AMMO[o.slice(5)].n : (PROD[o] ? PROD[o].n : LAB.ITEMS[o].n); }
function known(rc) { return !rc.f || !!ch().known[rc.id] || brLv(rc.br) >= Math.min(5, rc.lv + 2); }
function learn(id, how) {
  var rc = RCBY[id];
  if (!rc || ch().known[id]) return false;
  ch().known[id] = 1;
  sayq("Рецептура записана: «" + outName(rc) + "» — " + BR[rc.br].n + ", ступень " + rc.lv + ", стол не проще ступени " + rc.st + (rc.minG ? ", сырьё не ниже очищенного сорта" : "") + "." + (how ? " " + how : ""));
  return true;
}
function nm(k) { return low(FAM[k] ? FAM[k].n[0] : LAB.ITEMS[k] ? LAB.ITEMS[k].n : k); }
function needText(need) { var s = []; for (var k in need) s.push(nm(k) + " " + need[k]); return s.join(", "); }

/* ════════ СЫРЬЁ В РЮКЗАКЕ: сорт и мутаген ════════ */
function units(f) { var g = G(), out = []; [1, 2, 3].forEach(function (gr) { [false, true].forEach(function (sat) { var id = matId(f, gr, sat); if (MAT[id] && g.inv[id] > 0) out.push({ id: id, g: gr, sat: sat, n: g.inv[id] }); }); }); return out; }
/* План синтеза: что взять (экономно — сначала простое, лучшее — сначала чистое),
   сорт (по слабейшему; мутаген — на сорт выше) и есть ли мутагенное сырьё.
   plain — обычные лекарства: сырьё с мутагеном в них не идёт. */
function plan(need, opt) {
  var g = G(), take = {}, minG = 3, any = false, sat = false;
  for (var k in need) {
    var n = need[k];
    if (FAM[k]) {
      var us = units(k).filter(function (u) { return (!opt.minG || u.g >= opt.minG) && !(opt.plain && u.sat); });
      us.sort(function (a, b) { var ea = a.g + (a.sat ? 0.5 : 0), eb = b.g + (b.sat ? 0.5 : 0); return opt.best ? eb - ea : ea - eb; });
      for (var i = 0; i < us.length && n > 0; i++) {
        var t = Math.min(us[i].n - (take[us[i].id] || 0), n);
        if (t <= 0) continue;
        take[us[i].id] = (take[us[i].id] || 0) + t; n -= t; any = true;
        minG = Math.min(minG, Math.min(3, us[i].g + (us[i].sat ? 1 : 0)));
        if (us[i].sat) sat = true;
      }
      if (n > 0) return { ok: false, lack: k, short: n };
    } else {
      if ((g.inv[k] || 0) - (take[k] || 0) < n) return { ok: false, lack: k, short: n - ((g.inv[k] || 0) - (take[k] || 0)) };
      take[k] = (take[k] || 0) + n;
    }
  }
  return { ok: true, take: take, grade: any ? minG : 1, sat: sat };
}
function lackText(need, opt) {
  var g = G(), s = [];
  for (var k in need) {
    var h = FAM[k] ? units(k).filter(function (u) { return (!opt.minG || u.g >= opt.minG) && !(opt.plain && u.sat); }).reduce(function (a, u) { return a + u.n; }, 0) : (g.inv[k] || 0);
    if (h < need[k]) s.push(nm(k) + " " + h + " из " + need[k] + (FAM[k] && opt.minG ? " (не ниже очищенного сорта)" : "") + (FAM[k] && opt.plain && units(k).some(function (u) { return u.sat; }) ? " (сырьё с мутагеном сюда не идёт — выведите мутаген)" : ""));
  }
  return s.join(", ");
}
function takeMap(m, half) {
  var g = G(), first = true;
  for (var id in m) { var n = half ? Math.floor(m[id] / 2) + (first ? m[id] % 2 : 0) : m[id]; if (half && first) n = Math.max(1, n); g.inv[id] = Math.max(0, (g.inv[id] || 0) - n); if (!g.inv[id]) delete g.inv[id]; first = false; }
}
function give(id, n) {
  var o = String(id);
  if (o.indexOf("ammo:") === 0) { var a = o.slice(5); G().ammo[a] = (G().ammo[a] || 0) + n; return; }
  G().inv[o] = (G().inv[o] || 0) + n;
}
function haveExact(need) { var g = G(); for (var k in need) if ((g.inv[k] || 0) < need[k]) return false; return true; }
function lackExact(need) { var g = G(), s = []; for (var k in need) { var h = g.inv[k] || 0; if (h < need[k]) s.push(low(LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + h + " из " + need[k]); } return s.join(", "); }
function matCount() { var g = G(), n = 0; for (var id in MAT) n += g.inv[id] || 0; return n; }

/* ════════ ХИМИЧЕСКИЙ СТОЛ ════════ */
var ST = [null,
  { n: "химический стол", d: "спиртовка, колбы, весы и вытяжной зонт; чистоты выше технической здесь не добиться" },
  { n: "вытяжной шкаф с реактором", d: "реактор с мешалкой, обратный холодильник и дозаторы; очищает сырьё до второго сорта" },
  { n: "синтез-реактор", d: "реактор высокого давления, хроматограф и термостат; доводит сырьё до особой чистоты" },
  { n: "биореактор", d: "культуральные чаны, ламинарный шкаф и секвенатор; всё, что умеет синтез-реактор, и живые культуры" }];
if (LAB.OBJ && !LAB.OBJ.chemlab) LAB.OBJ.chemlab = { n: "Химический стол", icon: "⚗️", desc: "Лабораторный стол химика: из сырья здесь синтезируют лекарства, яды, смазки, гранаты и сыворотки, очищают вещества и выводят мутаген." };
function station(o) {
  var fs = CUR().fs, g = G();
  if (!fs) return { tier: 1, dirty: false };
  if (!fs.chemSt) fs.chemSt = {};
  var k = String(o.id);
  if (!fs.chemSt[k]) {
    var h = h32("chemst:" + g.L + "-" + g.F + "-" + k), p = h % 100, L = g.L, b = o.good ? 15 : 0;
    var t = L <= 2 ? (p < 75 - b ? 1 : 2) : L <= 10 ? (p < 30 - b ? 1 : p < 85 - b ? 2 : 3) : L <= 30 ? (p < 35 - b ? 2 : p < 85 - b ? 3 : 4) : L <= 60 ? (p < 40 - b ? 3 : 4) : (p < 20 - b ? 3 : 4);
    fs.chemSt[k] = { tier: Math.max(1, Math.min(4, t)), dirty: ((h >>> 9) % 100) < (dk().chemDirty || 25) }; /* режим: в сложных — чаще загрязнён */
  }
  return fs.chemSt[k];
}
function stLine(s) { return cap1(ST[s.tier].n) + " — ступень " + s.tier + ": " + ST[s.tier].d + "." + (s.dirty ? " Загрязнён: на стенках осадок и потёки. Сначала отмойте его растворителем." : " Чистый."); }
var curSt = null;
function open(o) {
  curSt = { o: o, key: CUR().key };
  A("play", "ev_glass");
  var s = station(o);
  menu(cap1(ST[s.tier].n) + ". Химик: ступень " + level(), rootItems(o), { keep: true, rebuild: function () { return rootItems(o); } });
  if (!G().tut.chem) { G().tut.chem = 1; sayq("«Эхо»: химический стол. Сырьё — вещества лабораторий, жидкости машин и ткани тварей — превращается здесь в лекарства, яды, смазки, гранаты и сыворотки. У сырья три сорта чистоты; чем выше ступень химика и стола, тем чище и сильнее составы."); }
}
function rootItems(o) {
  var s = station(o), items = [{ label: stLine(s), info: true, keep: true, fn: function () { say(stLine(station(o))); } }];
  if (s.dirty) items.push({ label: units("c_solvent").length ? "Отмыть стол растворителем" : "Отмыть стол — нужен растворитель", fn: function () { clean(o); } });
  BR_IDS.forEach(function (b) {
    var ready = RC.filter(function (rc) { return rc.br === b && outOk(rc) && !why(rc, s); }).length;
    items.push({ label: "Синтез: " + BR[b].n + ", ступень " + brLv(b) + (ready ? ". Можно сделать сейчас: " + ready : ""), fn: function () { brMenu(o, b); } });
  });
  items.push({ label: "Переработка, очистка и добавки", fn: function () { refMenu(o); } });
  if (Object.keys(G().inv).some(function (k) { return MAT[k] && MAT[k].sat && G().inv[k] > 0; })) items.push({ label: "Вывести мутаген из сырья", fn: function () { purgeMenu(o); } });
  items.push({ label: "Анализ вещества", fn: function () { anaMenu(o); } });
  items.push({ label: "Химия: ступени и специализация", fn: function () { skillMenu(); } });
  items.push({ label: "Сырьё в рюкзаке: " + matCount(), fn: function () { invMenu(); } });
  items.push({ label: "Отойти", fn: function () {} });
  return items;
}
function useOne(f) { var us = units(f).sort(function (a, b) { return a.g - b.g; }); if (!us.length) return false; G().inv[us[0].id]--; if (!G().inv[us[0].id]) delete G().inv[us[0].id]; return true; }
function clean(o) {
  var s = station(o);
  if (!s.dirty) { say("Стол и так чистый."); return; }
  if (!useOne("c_solvent")) { say("Отмыть нечем: нужен растворитель. " + cap1(FAM.c_solvent.src) + "."); return; }
  s.dirty = false;
  A("play", "ev_bubbles");
  say("Вы отмываете стол растворителем: осадок сходит, посуда звенит чистотой. Можно работать.");
  refresh();
}
function stationCap(s) { return !s ? 1 : s.tier >= 3 ? 3 : s.tier; }
/* Почему нельзя (пусто — можно). */
function why(rc, s) {
  if (!outOk(rc)) return "нет в игре";
  if (!known(rc)) return "рецептура неизвестна: найдите её в лабораторных журналах, разгадайте анализом готового состава или дорастите " + BR[rc.br].n + " до ступени " + Math.min(5, rc.lv + 2);
  if (brLv(rc.br) < rc.lv) return "нужна ступень " + rc.lv + " направления «" + BR[rc.br].n + "», у вас " + brLv(rc.br);
  if (!s) { if (!(level() >= 6 && rc.st <= 1 && rc.lv <= 1)) return "нужен химический стол"; }
  else {
    if (s.dirty) return "стол загрязнён — сначала отмойте его растворителем";
    if (s.tier < rc.st && !(level() >= 5 && s.tier === rc.st - 1)) return "нужен стол ступени " + rc.st + ": " + ST[rc.st].n;
  }
  var p = plan(rc.need, popt(rc));
  if (!p.ok) return "не хватает: " + lackText(rc.need, popt(rc));
  return "";
}
function popt(rc) { return { best: !!ch().opt.best, minG: rc.minG || 0, plain: !PROD[rc.out] }; }
function failP(rc, s, mod) {
  var lv = brLv(rc.br), t = s ? s.tier : 1;
  var p = 0.06 + 0.07 * rc.lv - 0.05 * lv - 0.03 * Math.max(0, t - rc.st) + (mod && mod !== "mut" ? 0.04 : 0);
  if (s && s.tier < rc.st) p *= 2;
  if (!s) p += 0.05;
  p *= dk().chemFail || 1; /* режим сложности */
  return Math.max(0.02, Math.min(0.55, p));
}
/* Что выйдет: сорт, модификация, сколько. */
function forecast(rc, s) {
  var c = ch(), p = plan(rc.need, popt(rc)), isP = !!PROD[rc.out];
  if (!p.ok) return null;
  var g = p.grade, cat = c.opt.cat && units("c_catalyst").length > 0;
  if (cat) g = Math.min(3, g + 1);
  g = Math.max(1, Math.min(g, stationCap(s), gradeCap(rc.br)));
  var mod = "";
  if (isP) {
    var want = c.opt.mod || "", allowed = (PROD[rc.out].mods || []);
    if (want && allowed.indexOf(want) >= 0 && haveAdd(want)) mod = want;
    if (!mod && p.sat && PROD[rc.out].mut) mod = "mut";
  }
  var n = rc.qty || 1;
  if (!isP) n += g - 1; /* обычные лекарства и батареи: из чистого сырья их выходит больше */
  return { g: g, mod: mod, n: n, cat: cat, sat: p.sat, take: p.take, id: isP ? prodId(rc.out, g, mod) : rc.out };
}
function haveAdd(mod) { var a = MOD[mod] && MOD[mod].add; return !a || (FAM[a] ? units(a).length > 0 : (G().inv[a] || 0) > 0); }
function useAdd(mod) { var a = MOD[mod] && MOD[mod].add; if (!a) return; if (FAM[a]) useOne(a); else { G().inv[a]--; if (!G().inv[a]) delete G().inv[a]; } }
function outLabel(fc) { var d = LAB.ITEMS[fc.id] || {}, o = String(fc.id); return (o.indexOf("ammo:") === 0 ? LAB.AMMO[o.slice(5)].n : d.n) + (fc.n > 1 ? ", " + fc.n + " " + pl(fc.n, "порция", "порции", "порций") : ""); }
function brMenu(o, b) {
  var build = function () {
    var s = station(o), items = [{ label: BR[b].t + ": " + BR[b].d + ". Ступень " + brLv(b) + ", опыт " + brXp(b) + (brLv(b) < 5 ? " из " + BR_XP[brLv(b) + 1] : "") + ". Предел чистоты: " + GRADE_W[gradeCap(b)] + ".", info: true, keep: true, fn: function () { say(BR[b].t + ", ступень " + brLv(b) + "."); } }];
    RC.filter(function (rc) { return rc.br === b && outOk(rc); }).forEach(function (rc) {
      var w = why(rc, s), fc = !w ? forecast(rc, s) : null;
      items.push({ label: known(rc) ? outName(rc) + ". Нужно: " + needText(rc.need) + (rc.minG ? ", сырьё не ниже очищенного сорта" : "") + "." + (w ? " Нельзя: " + w + "." : " Выйдет: " + low(outLabel(fc)) + ".") : outName(rc) + " — рецептура неизвестна", fn: function () { brewMenu(rc, o); } });
    });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Синтез: " + BR[b].n, build(), { keep: true, rebuild: build });
}
/* Окно синтеза: сырьё, катализатор, модификация, прогноз — и «Синтезировать». */
function brewMenu(rc, o) {
  var c = ch(), build = function () {
    var s = o ? station(o) : null, w = why(rc, s), items = [];
    items.push({ label: outName(rc) + ": " + (PROD[rc.out] ? PROD[rc.out].desc : (LAB.ITEMS[rc.out] || {}).desc || "") + " Нужно: " + needText(rc.need) + ". Направление — " + BR[rc.br].n + ", ступень " + rc.lv + "; стол — не проще ступени " + rc.st + ".", info: true, keep: true, fn: function () { say(outName(rc) + ". Нужно: " + needText(rc.need) + "."); } });
    items.push({ label: "Сырьё", kind: "choice", options: [{ v: false, label: "экономно — сначала простое" }, { v: true, label: "лучшее — сначала чистое" }], get: function () { return !!c.opt.best; }, set: function (v) { c.opt.best = v; refresh(); } });
    if (PROD[rc.out] || units("c_catalyst").length) items.push({ label: "Катализатор", kind: "choice", options: [{ v: false, label: "без катализатора" }, { v: true, label: "с катализатором — чистота на ступень выше" + (units("c_catalyst").length ? "" : ", но катализатора нет") }], get: function () { return !!c.opt.cat; }, set: function (v) { c.opt.cat = v; refresh(); } });
    if (PROD[rc.out] && (PROD[rc.out].mods || []).length) {
      var opts = [{ v: "", label: "без модификации" }].concat(PROD[rc.out].mods.map(function (m) { var a = MOD[m].add; return { v: m, label: MOD[m].n + " — " + MOD[m].d + (a ? ". Добавка: " + low(LAB.ITEMS[a].n) + (haveAdd(m) ? "" : ", её нет") : "") }; }));
      items.push({ label: "Модификация", kind: "choice", options: opts, get: function () { return PROD[rc.out].mods.indexOf(c.opt.mod) >= 0 ? c.opt.mod : ""; }, set: function (v) { c.opt.mod = v; refresh(); } });
    }
    var fc = !w ? forecast(rc, s) : null;
    items.push({ label: w ? "Нельзя: " + w + "." : "Выйдет: " + low(outLabel(fc)) + ". Срыв — " + Math.round(failP(rc, s, fc.mod) * 100) + " из ста." + (fc.sat && fc.mod === "mut" ? " Сырьё с мутагеном: состав прибавит мутацию." : fc.sat && !PROD[rc.out].mut ? " Мутаген в сырье поднял сорт." : ""), info: true, keep: true, fn: function () { say(w ? "Нельзя: " + w + "." : "Выйдет: " + low(outLabel(forecast(rc, o ? station(o) : null))) + "."); } });
    items.push({ label: "Синтезировать", keep: true, fn: function () { brew(rc, o); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Синтез: " + low(outName(rc)), build(), { keep: true, rebuild: build });
}
function brew(rc, o) {
  var s = o ? station(o) : null, w = why(rc, s);
  if (w) { A("play", "ui_error"); say(outName(rc) + ": " + w + "."); return false; }
  if (LAB.combat && LAB.combat.hunted && LAB.combat.hunted()) { say("За вами гонятся — колбы подождут."); return false; }
  var g = G(), fc = forecast(rc, s), p = failP(rc, s, fc.mod);
  A("play", "ev_bubbles");
  if (Math.random() < p) {
    takeMap(fc.take, true);
    gain(rc.br, 3);
    var msg = "Реакция ушла в осадок: часть сырья пропала.";
    if (level() < 7) {
      if (rc.br === "pyro") { var bd = 4 + Math.floor(Math.random() * 7); g.hp = Math.max(1, g.hp - bd); A("play", "hurt_burn"); msg += " Вспышка обожгла руки: здоровье минус " + bd + "."; }
      else if (!(g.st.antitox > 0)) { if (gm().bodyApply) gm().bodyApply({ tox: 8 }, []); A("play", "hurt_chem"); msg += " Едкие пары: токсины плюс 8."; }
      if (fc.sat && !(g.st.antitox > 0)) { addMut(3, "пары"); msg += " Пары с мутагеном: мутация плюс 3."; }
    }
    if (s && Math.random() < 0.2) { s.dirty = true; msg += " Стол загрязнён — отмойте его растворителем."; }
    say(msg);
  } else {
    takeMap(fc.take);
    if (fc.cat) useOne("c_catalyst");
    if (fc.mod && fc.mod !== "mut") useAdd(fc.mod);
    var n = fc.n, extra = 0;
    if (Math.random() < 0.08 * brLv(rc.br) + (level() >= 9 ? 0.2 : 0)) extra++;
    var dbl = (rc.br === "energy" && rank("energy") >= 1 && /^ammo:|^c_fuelamp/.test(rc.out)) || (rc.br === "pyro" && rank("pyro") >= 1 && PROD[rc.out] && PROD[rc.out].kind === "throw");
    if (dbl) n *= 2;
    n += extra;
    give(fc.id, n);
    var first = !ch().seen["b:" + rc.id];
    ch().seen["b:" + rc.id] = 1;
    gain(rc.br, 10 + 6 * rc.lv + 4 * (fc.g - 1) + (fc.mod ? 4 : 0) + (first ? 10 : 0));
    if (LAB.ach && LAB.ach.ev) LAB.ach.ev("craft", 1);
    say("Готово: " + low(outLabel({ id: fc.id, n: n })) + "." + (extra ? " Вышло с запасом." : "") + " В рюкзаке: " + countOut(fc.id) + ".");
    if (LAB.oko && LAB.oko.react) LAB.oko.react("craft");
  }
  if (LAB.combat && LAB.combat.spendTurns) LAB.combat.spendTurns(1, ""); /* (2.6) пошаговый режим: синтез — ход */
  refresh();
  return true;
}
function countOut(out) { var o = String(out); return o.indexOf("ammo:") === 0 ? (G().ammo[o.slice(5)] || 0) : (G().inv[o] || 0); }
function refMenu(o) {
  var build = function () {
    var s = station(o), items = [];
    REF.filter(function (rf) { return refOk(rf) && (!rf.pur || haveExact(rf.need) || s.tier >= rf.st); }).forEach(function (rf) {
      var okT = s.tier >= rf.st, ok = okT && haveExact(rf.need) && !s.dirty;
      if (!ok && !rf.pur && /^d_/.test(rf.id) && !Object.keys(rf.need).some(function (k) { return (G().inv[k] || 0) > 0 && /^[gkomi]_/.test(k); })) return; /* вещества глубин — когда они есть */
      items.push({ label: rf.n + ". Нужно: " + needLine(rf.need) + (ok ? "." : !okT ? ". Нужен стол ступени " + rf.st + "." : s.dirty ? ". Стол загрязнён." : ". Не хватает: " + lackExact(rf.need) + "."), keep: true, fn: function () { refine(rf, o); } });
    });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Переработка, очистка и добавки", build(), { keep: true, rebuild: build });
}
function needLine(need) { var s = []; for (var k in need) s.push(low(LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + need[k]); return s.join(", "); }
function refine(rf, o) {
  var s = station(o);
  if (s.dirty) { say("Стол загрязнён — сначала отмойте его растворителем."); return; }
  if (s.tier < rf.st) { say("Нужен стол ступени " + rf.st + ": " + ST[rf.st].n + "."); return; }
  if (!haveExact(rf.need)) { A("play", "ui_error"); say("Не хватает: " + lackExact(rf.need) + "."); return; }
  takeMap(rf.need);
  var got = [];
  for (var k in rf.give) { var n = rf.give[k] + (level() >= 2 && Math.random() < 0.25 ? 1 : 0); give(k, n); got.push(low(LAB.ITEMS[k].n) + " " + n); }
  gain(rf.br, rf.pur ? 2 + 3 * rf.pur : 3);
  A("play", "ev_bubbles");
  say((rf.pur ? "Очищено: " : "Переработано: ") + got.join(", ") + ".");
  if (LAB.combat && LAB.combat.spendTurns) LAB.combat.spendTurns(1, "");
  refresh();
}
/* Вывод мутагена: ткань той же чистоты, а мутаген оседает конденсатом. */
function purgeMenu(o) {
  var build = function () {
    var s = station(o), g = G(), items = [];
    Object.keys(g.inv).forEach(function (id) {
      if (!MAT[id] || !MAT[id].sat || !(g.inv[id] > 0)) return;
      var clean0 = matId(MAT[id].f, MAT[id].g, false);
      items.push({ label: LAB.ITEMS[id].n + ": " + g.inv[id] + ". Вывести мутаген щёлочью — останется " + low(LAB.ITEMS[clean0].n) + " и капля конденсата" + (s.tier >= 2 ? "" : ". Нужен стол ступени 2"), keep: true, fn: function () { purge(id, o); } });
    });
    if (!items.length) items.push({ label: "Сырья с мутагеном нет", info: true, keep: true, fn: function () { say("Сырья с мутагеном нет."); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Вывести мутаген", build(), { keep: true, rebuild: build });
}
function purge(id, o) {
  var s = station(o), g = G(), m = MAT[id];
  if (s.tier < 2) { say("Мутаген выводят в вытяжном шкафу: нужен стол ступени 2."); return; }
  if (s.dirty) { say("Стол загрязнён — сначала отмойте его растворителем."); return; }
  if (!(g.inv[id] > 0)) return;
  if (!useOne("c_alkali")) { say("Нужна щёлочь: " + FAM.c_alkali.src + "."); return; }
  g.inv[id]--; if (!g.inv[id]) delete g.inv[id];
  give(matId(m.f, m.g, false), 1);
  give(matId("c_cond", Math.max(1, Math.min(3, m.g)), false), 1);
  gain("tox", 4);
  A("play", "ev_bubbles");
  say("Щёлочь шипит, ткань светлеет: мутаген осел на дне колбы фиолетовыми каплями. Конденсат — в рюкзаке.");
  refresh();
}
/* Анализ: готовый состав раскрывает рецептуру (образец тратится — с третьей
   ступени химика через раз нет); сырьё — что из него делают (опыт — впервые). */
function anaMenu(o) {
  var build = function () {
    var g = G(), items = [], seenB = {};
    Object.keys(g.inv).forEach(function (k) {
      if (!(g.inv[k] > 0) || !LAB.ITEMS[k]) return;
      var b = PV[k] ? PV[k].b : k, rcs = RC.filter(function (rc) { return rc.out === b && rc.f && outOk(rc) && !known(rc); });
      if (rcs.length && !seenB[b]) { seenB[b] = 1; items.push({ label: "Разобрать состав: " + LAB.ITEMS[k].n + " — раскроет рецептуру", keep: true, fn: function () { analyze(k, rcs[0], o); } }); }
      else if (MAT[k] && !seenB[MAT[k].f]) { seenB[MAT[k].f] = 1; items.push({ label: "Изучить сырьё: " + FAM[MAT[k].f].n[0] + (ch().seen["a:" + MAT[k].f] ? "" : " — впервые"), keep: true, fn: function () { study(MAT[k].f); } }); }
    });
    if (!items.length) items.push({ label: "Изучать нечего: ни сырья, ни составов с неизвестной рецептурой", info: true, keep: true, fn: function () { say("Изучать нечего."); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Анализ вещества", build(), { keep: true, rebuild: build });
}
function analyze(k, rc, o) {
  var s = station(o);
  if (s.dirty) { say("Стол загрязнён — сначала отмойте его растворителем."); return; }
  var keep = level() >= 3 && Math.random() < 0.5;
  if (!keep) { G().inv[k]--; if (!G().inv[k]) delete G().inv[k]; }
  A("play", "ev_glass");
  gain(rc.br, 12);
  learn(rc.id, keep ? "Образец цел." : "Образец ушёл на анализ.");
  refresh();
}
function study(f) {
  var F0 = FAM[f], uses = RC.filter(function (rc) { return outOk(rc) && rc.need[f]; }).map(function (rc) { return known(rc) ? low(outName(rc)) : "неизвестный состав (" + BR[rc.br].n + ")"; });
  var refs = REF.filter(function (rf) { return refOk(rf) && !rf.pur && Object.keys(rf.need).some(function (k) { return MAT[k] && MAT[k].f === f; }); }).map(function (rf) { return low(rf.n.split(" — ")[0]); });
  if (!ch().seen["a:" + f]) { ch().seen["a:" + f] = 1; gain(F0.br || "pharm", 6); }
  say(F0.n[0] + ". " + F0.desc + (F0.one ? "" : " Сорта: " + F0.n.map(low).join(", ") + ".") + " Где взять: " + F0.src + "." + (uses.length ? " Идёт на: " + uses.join(", ") + "." : "") + (refs.length ? " Переработка: " + refs.join(", ") + "." : "") + (F0.org ? " В тумане мутагена насыщается им." : ""));
}
function skillMenu() {
  var build = function () {
    var c = ch(), items = [{ label: line(), info: true, keep: true, fn: function () { say(line()); } }];
    items.push({ label: "Общая ступень " + level() + ", опыт " + totalXp() + (level() < 10 ? " из " + ALL_XP[level()] : "") + ". " + levelPerk(level()), info: true, keep: true, fn: function () { say("Общая ступень химика " + level() + ". Растёт от всего, что вы синтезируете, очищаете, перерабатываете и изучаете."); } });
    BR_IDS.forEach(function (b) { items.push({ label: BR[b].t + ": ступень " + brLv(b) + ", опыт " + brXp(b) + (brLv(b) < 5 ? " из " + BR_XP[brLv(b) + 1] : "") + ". " + cap1(BR[b].d) + ". Предел чистоты: " + GRADE_W[gradeCap(b)] + ".", info: true, keep: true, fn: function () { say(BR[b].t + ": " + BR[b].d + "."); } }); });
    c.spec.forEach(function (sp) { items.push({ label: "Специализация «" + SPECS[sp].n + "», ступень " + rank(sp) + ": " + SPECS[sp].r.slice(0, rank(sp)).join("; ") + "." + (rank(sp) < 3 ? " Дальше: " + SPECS[sp].r[rank(sp)] + " — на " + (rank(sp) + 3) + "-й ступени направления." : ""), info: true, keep: true, fn: function () { say(SPECS[sp].n + ": " + SPECS[sp].r.slice(0, rank(sp)).join("; ") + "."); } }); });
    if (c.spec.length < specSlots()) BR_IDS.filter(function (b) { return !spec(b); }).forEach(function (b) {
      items.push({ label: "Стать: " + SPECS[b].n + " — " + SPECS[b].r[0] + "; позже: " + SPECS[b].r[1] + "; " + SPECS[b].r[2], fn: function () { c.spec.push(b); A("play", "ui_levelup"); say("Специализация: " + SPECS[b].n + ". " + cap1(SPECS[b].r[0]) + ". На четвёртой ступени направления — " + SPECS[b].r[1] + ", на пятой — " + SPECS[b].r[2] + "."); refresh(); } });
    });
    else if (!c.spec.length) items.push({ label: "Специализацию можно выбрать с четвёртой общей ступени химика, вторую — с восьмой.", info: true, keep: true, fn: function () { say("Специализация — с четвёртой общей ступени, вторая — с восьмой."); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Химия: ступени и специализация", build(), { keep: true, rebuild: build });
}
/* Инвентарь: «Химия: сырьё». */
function invMenu() {
  var g = G(), items = [];
  FAM_IDS.forEach(function (f) { units(f).forEach(function (u) { items.push({ label: LAB.ITEMS[u.id].n + ": " + u.n + ". " + (FAM[f].one ? "" : cap1(GRADE_W[u.g]) + ". ") + FAM[f].desc, keep: true, fn: function () { study(f); } }); }); });
  if (!items.length) items.push({ label: "Сырья нет. Его дают лаборатории и склады, жидкости машин и ткани тварей.", info: true, keep: true, fn: function () { say("Сырья нет."); } });
  if (level() >= 6) items.push({ label: "Походная химия: простые составы без стола", fn: function () { pocketMenu(); } });
  items.push({ label: line(), info: true, keep: true, fn: function () { say(line()); } });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Химия: сырьё", items);
}
function pocketMenu() {
  var build = function () {
    var items = RC.filter(function (rc) { return outOk(rc) && rc.st <= 1 && rc.lv <= 1 && known(rc); }).map(function (rc) { var w = why(rc, null); return { label: outName(rc) + ". Нужно: " + needText(rc.need) + "." + (w ? " Нельзя: " + w + "." : ""), fn: function () { brewMenu(rc, null); } }; });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Походная химия", build(), { keep: true, rebuild: build });
}

/* ════════ МУТАЦИЯ ГЕРОЯ ════════ */
function body() { var g = G(); if (!g.body) g.body = {}; return g.body; }
function mut() { return body().mut || 0; }
function stage() { var m = mut(); return m >= 75 ? 3 : m >= 50 ? 2 : m >= 25 ? 1 : 0; }
function ctrl() { return G().st.ctrlMut > 0; }
var STAGE_N = ["нет", "первые признаки", "мутация идёт", "на грани превращения"];
function mutLine() { var m = Math.round(mut()); return "Мутация " + m + " из 100: " + STAGE_N[stage()] + (ctrl() ? ", управляемая мутация действует" : "") + "."; }
function addMut(x, why0) {
  if (!(x > 0)) return;
  var b = body(), s0 = stage();
  b.mut = Math.min(100, (b.mut || 0) + x);
  var s1 = stage();
  if (s1 > s0) {
    A("play", "hurt_chem");
    sayq(["", "Мутация " + Math.round(b.mut) + ": кожа зудит, во рту сладковатый привкус, голод сильнее. Выводят антимутаген, целители и долгий сон в капсуле.",
      "Мутация " + Math.round(b.mut) + ": в руках чужая сила, твари без разума принимают вас за своего, но лекарства действуют слабее.",
      "Мутация " + Math.round(b.mut) + ": раны затягиваются сами, но нервы на пределе и сводит судороги. «Эхо» тревожится: ещё немного — и тело станет чужим."][s1]);
    if (s1 === 2 && LAB.oko && LAB.oko.react) LAB.oko.react("mutate");
  }
}
function cutMut(x) { var b = body(); b.mut = Math.max(0, (b.mut || 0) - x); }
/* Лекарства слабеют от мутации (у биотехнолога третьей ступени и под управляемой мутацией — нет). */
function mutHealK() { var s = stage(); if (s < 2 || rank("bio") >= 3 || ctrl()) return 1; return s >= 3 ? 0.7 : 0.85; }
/* Удар в ближнем бою: мутация (и управляемая мутация) прибавляет силы. */
function meleeK() { var s = Math.max(stage(), ctrl() ? 2 : 0); return s >= 3 ? 1.3 : s >= 2 ? 1.15 : 1; }
/* Твари без разума не замечают «своего» дальше трёх шагов. */
function kinStealth(f, d) { return f.kind === "bio" && !f.boss && (f.mind == null ? 1 : f.mind) < 2 && d > 3 && (stage() >= 2 || ctrl()); }
/* Укус ядовитой твари — немного мутагена (с третьего уровня). */
function onBite(src) {
  if (!src || src.kind !== "bio" || G().L < 3 || Math.random() > 0.35) return;
  var beh = (src.base && src.base.beh) || [];
  if (beh.indexOf("poison") < 0 && beh.indexOf("leech") < 0) return;
  addMut((dk().mut || 1) * (rank("bio") >= 2 ? 0.5 : 1), "укус");
}

/* ════════ МУТАГЕННЫЙ ТУМАН ════════
   rm.fog — 1 лёгкий, 2 густой, 3 плотный. Копит мутацию без защиты; фильтр,
   респиратор, антитоксин и сыворотка адаптации — полностью; костюм — по
   защите от химии (от сорока процентов — полностью). Вытяжка выгоняет туман.
   В густом тумане без защиты ткани тварей в рюкзаке насыщаются мутагеном. */
var FOG_N = [null, "лёгкий", "густой", "плотный"], FOG_K = [0, 0.08, 0.18, 0.35];
function roomOf() { var c = CUR(); if (!c || !c.fl || !G()) return null; var r = c.fl.room[G().y * LAB.W + G().x]; return r >= 0 ? c.fl.rooms[r] : null; }
function vented(rm) { return !!(LAB.zones && LAB.zones.vented && LAB.zones.vented(rm)); } /* одна проверка на газ и туман — zones.js */
function fogHere() { var rm = roomOf(); return rm && rm.fog && !vented(rm) ? rm.fog : 0; }
function armorChem() { var a = G().armor, d = a ? LAB.ARMORS[a.base] : null; return (d && d.res && d.res.chem) || 0; }
function fogK() {
  var g = G();
  if (g.st.antitox > 0 || g.st.fogImm > 0) return 0;
  var c = armorChem();
  if (c >= 0.4) return 0;
  var k = 1 - c * 1.6;
  if (gm().armorSpecial && gm().armorSpecial("antitox")) k *= 0.5;
  if (rank("tox") >= 2) k *= 0.67;
  return Math.max(0, k) * (dk().mut || 1);
}
var fogKey = "", tickN = 0;
function fogCheck(rm) {
  var key = CUR().key + ":" + (rm && rm.fog && !vented(rm) ? rm.id : -1);
  if (key === fogKey) return;
  var was = fogKey; fogKey = key;
  if (!(rm && rm.fog && !vented(rm))) { if (was && was.split(":")[1] !== "-1" && was.split(":")[0] === CUR().key) sayq("Вы вышли из тумана." + (mut() >= 1 ? " " + mutLine() : "")); return; }
  var k = fogK();
  sayq("Мутагенный туман, " + FOG_N[rm.fog] + ": воздух сладковатый, в горле першит." + (k <= 0 ? " Защита держит: мутация не растёт." : " Без защиты здесь копится мутация" + (rm.fog >= 2 ? ", а ткани в рюкзаке пропитываются мутагеном" : "") + ". Фильтр, респиратор, антитоксин, сыворотка адаптации или костюм химзащиты — спасут."));
  if (!G().tut.fog) { G().tut.fog = 1; gm().later(function () { sayq("«Эхо»: этот туман и превратил часть персонала в тварей. Он тяжелее воздуха и стекает вниз: глубже его больше. Вытяжка в помещении его выгоняет."); }, 2500); }
}
/* Такт (combat.statusTick): регенерация, репеллент, туман, мутация. */
function tick() {
  var g = G(), st = g.st, b = body();
  if (!g || g.dead) return;
  tickN++;
  if (st.regen > 0) {
    st.regen--;
    if (tickN % (st.regenE || 2) === 0 && g.hp < g.hpMax) g.hp = Math.min(g.hpMax, g.hp + (st.regenN || 1));
    if (!st.regen) sayq("Регенерация закончилась: здоровье " + g.hp + " из " + g.hpMax + ".");
  }
  if (st.repel > 0) { st.repel--; if (!st.repel) sayq("Репеллент выветрился: твари снова чуют вас."); }
  if (st.fogImm > 0) { st.fogImm--; if (!st.fogImm) sayq("Сыворотка адаптации отработала: туман снова опасен."); }
  if (st.ctrlMut > 0) { st.ctrlMut--; if (!st.ctrlMut) sayq("Управляемая мутация отступила."); }
  if (rank("tox") >= 2 && st.poison > 1 && tickN % 2 === 0) st.poison--;
  /* туман */
  var rm = roomOf();
  fogCheck(rm);
  var fg = fogHere();
  if (fg) {
    var k = fogK();
    if (k > 0) addMut(FOG_K[fg] * k, "туман");
    if (tickN % 14 === 0) A("play", "ev_steam", { gain: 0.18 + 0.08 * fg, rate: 0.62 });
    if (fg >= 2 && k > 0 && tickN % 40 === 0) saturate();
  } else { /* слабая мутация понемногу уходит сама: насколько слабая и как быстро — по режиму */
    var fade = dk().mutFade == null ? 25 : dk().mutFade, ft = dk().mutFadeT || 100;
    if (fade && (b.mut || 0) > 0 && b.mut < fade && tickN % ft === 0) b.mut = Math.max(0, b.mut - 1);
  }
  /* стадии мутации */
  var s = stage();
  if (s >= 1 && tickN % 20 === 0 && b.food != null) b.food = Math.max(0, b.food - 0.06);
  if ((s >= 3 || ctrl()) && tickN % (ctrl() && s < 3 ? 8 : 6) === 0 && g.hp < g.hpMax) g.hp++;
  if (s >= 3 && !ctrl()) {
    if (tickN % 10 === 0 && b.neuro != null) b.neuro = Math.min(100, b.neuro + 0.4);
    if (tickN % 160 === 80 && Math.random() < (dk().mutSz == null ? 0.6 : dk().mutSz)) { st.slow = Math.max(st.slow || 0, 6); g.hp = Math.max(1, g.hp - 2); A("play", "hurt_chem"); sayq("Судорога сводит тело: шаги вязнут."); }
  }
  if (b.mut >= 100) {
    b.mut = dk().mutRe || 60; /* что остаётся после превращения — по режиму */
    say("Мутаген берёт своё: тело перестаёт слушаться, голос «Эхо» тонет в чужом рычании...");
    gm().later(function () { gm().die(); }, 1200);
  }
}
/* Ткань в рюкзаке пропиталась мутагеном. */
function saturate() {
  var g = G(), c = [];
  for (var id in MAT) { var m = MAT[id]; if (!m.sat && FAM[m.f].org && g.inv[id] > 0) c.push(id); }
  if (!c.length) return;
  var id0 = c[Math.floor(Math.random() * c.length)], m0 = MAT[id0], to = matId(m0.f, m0.g, true);
  g.inv[id0]--; if (!g.inv[id0]) delete g.inv[id0];
  g.inv[to] = (g.inv[to] || 0) + 1;
  if (!g.tut.fogSat) { g.tut.fogSat = 1; sayq("Туман пропитывает ткани в рюкзаке: " + low(LAB.ITEMS[to].n) + ". Такое сырьё сильнее, но составы из него мутагенные; мутаген выводят щёлочью на химическом столе."); }
}
/* Сон в капсуле фильтрует кровь; душ смывает осевшее на коже. */
function capsuleSleep(min) { if (!(mut() > 0) || min < 480) return ""; var x = min >= 720 ? 15 : 8; cutMut(x); return " Капсула отфильтровала часть мутагена: " + mutLine(); }
function decon() { if (!(mut() > 0)) return ""; cutMut(4); return " С кожи смыт осевший мутаген: " + mutLine(); }

/* ════════ ДЕЙСТВИЕ СОСТАВОВ ════════ */
function weapon() { var g = G(); return g.weapons[g.wi] || null; }
function wClass(w) { return (LAB.WEAPONS[w.base] || {}).cls || ""; }
function coatable(w) { return !!w && ((w.rng0 != null ? w.rng0 : w.rng) <= 1 || w.ammo === "slug" || wClass(w) === "kinetic" || wClass(w) === "melee"); }
function batteryGun(w) { return !!w && w.ammo === "energy"; }
function use(id) {
  var g = G(), d = LAB.ITEMS[id], w = weapon(), msg = "";
  if (!d || !(g.inv[id] > 0)) { say("Нет: " + (d ? low(d.n) : id) + "."); return false; }
  var b0 = d.base || id, k = d.vk || { mag: 1, dur: 1, side: 1, mutAdd: 0 }, br = d.br || "pharm", pk = potK(br);
  switch (PROD[b0] ? PROD[b0].ce : "") {
    case "antimut": var cut = Math.round(30 * k.mag * pk * (rank("pharm") >= 3 ? 1.5 : 1)); cutMut(cut); msg = "Мутация минус " + cut + ". " + mutLine(); break;
    case "adapt": g.st.fogImm = Math.max(g.st.fogImm || 0, Math.round(180 * k.dur * bioDur())); msg = "Туман мутагена вас пока не берёт."; break;
    case "ctrl": g.st.ctrlMut = Math.max(g.st.ctrlMut || 0, Math.round(600 * k.dur * bioDur())); msg = "Мутаген послушен: сила в руках, твари без разума принимают вас за своего, раны затягиваются."; break;
    case "regen": g.st.regen = Math.max(g.st.regen || 0, Math.round(30 * k.dur)); g.st.regenN = Math.max(1, Math.round(2 * k.mag * pk * mutHealK())); g.st.regenE = 2; msg = "Тепло растекается по ранам: здоровье возвращается само."; break;
    case "regen2": g.st.regen = Math.max(g.st.regen || 0, Math.round(300 * k.dur * bioDur())); g.st.regenN = Math.max(1, Math.round(1 * k.mag * pk * mutHealK())); g.st.regenE = 3; msg = "Пластырь с культурой прирастает к коже: долго, понемногу здоровье будет возвращаться."; break;
    case "repel": g.st.repel = Math.round(120 * k.dur * bioDur()); msg = "Едкий запах окутывает вас: твари без разума не чуют вас дальше шага."; break;
    case "salve": g.st.shield = Math.max(g.st.shield || 0, Math.round(30 * k.mag * potK("bio"))); g.st.shieldT = Math.round(60 * k.dur * bioDur()); msg = "Хитиновая корка схватывается на коже: щит " + g.st.shield + "."; break;
    case "coat":
      if (!coatable(w)) { say("Смазку наносят на оружие ближнего боя или на стальные пули. Возьмите такое оружие в руки."); return false; }
      w.coat = { k: b0 === "c_coat_tox" ? "tox" : "acid", n: Math.round(15 * k.dur * (rank("tox") >= 1 ? 2 : 1)), m: Math.round(k.mag * 100) / 100 };
      msg = (w.coat.k === "tox" ? "Яд" : "Кислота") + " на оружии: " + w.coat.n + " попаданий."; break;
    case "over":
      if (!batteryGun(w)) { say("Перегрузочную капсулу вставляют в оружие на энергобатареях. Возьмите такое в руки."); return false; }
      w.over = (w.over || 0) + Math.round(6 * k.dur) + (rank("energy") >= 2 ? 3 : 0); w.overK = Math.max(w.overK || 1.5, Math.round((1 + 0.5 * k.mag) * 100) / 100);
      msg = "Капсула в энергоблоке: следующие " + w.over + " " + pl(w.over, "выстрел", "выстрела", "выстрелов") + " — сильнее."; break;
    case "cool":
      if (!w || (w.rng0 != null ? w.rng0 : w.rng) <= 1) { say("Охлаждающий гель — для стреляющего оружия. Возьмите его в руки."); return false; }
      w.heat = 0; w.hotUntil = 0; w.chill = Date.now() + Math.round(30000 * k.dur * (rank("energy") >= 2 ? 2 : 1)); msg = "Гель шипит на стволе: оружие остыло и какое-то время не будет греться."; break;
    case "oil":
      if (!w) { say("Возьмите оружие в руки — смазывают его."); return false; }
      var c0 = w.cond != null ? w.cond : 100;
      if (c0 >= 90) { say("Оружие и так в порядке: состояние " + Math.round(c0) + " из 100."); return false; }
      w.cond = Math.min(90, c0 + Math.round(20 * k.mag * potK("energy"))); msg = "Смазка легла ровно: состояние оружия " + Math.round(w.cond) + " из 100."; break;
    case "bait": return throwBait(id, k);
    case "thermite": say("Термит прожигает замки: встаньте у запертой двери или сейфа и выберите «Прожечь замок термитом»."); return false;
    default: return false;
  }
  g.inv[id]--; if (!g.inv[id]) delete g.inv[id];
  if (k.mutAdd) addMut(k.mutAdd * (rank("bio") >= 2 ? 0.5 : 1), "состав");
  A("play", /coat|oil|gel/.test(id) ? "ev_glass" : "inject");
  say(d.n + ". " + msg + (k.mutAdd ? " Мутация плюс " + Math.round(k.mutAdd * (rank("bio") >= 2 ? 0.5 : 1)) + "." : "") + " Осталось: " + (g.inv[id] || 0) + ".");
  if (LAB.combat && LAB.combat.spendTurns) LAB.combat.spendTurns(1, "");
  refresh();
  return true;
}
/* Общее действие (game.js, useFx/useItem): мутация от составов на мутагене,
   сыворотка из взвеси её снижает. Зовётся после приёма. */
function afterUse(id) {
  var d = LAB.ITEMS[id];
  if (!d || d.chem) return;
  if (d.vk && d.vk.mutAdd) { var x = d.vk.mutAdd * (rank("bio") >= 2 ? 0.5 : 1); addMut(x, "состав"); sayq("Мутация плюс " + Math.round(x) + "."); }
  if (d.mutCut) { cutMut(Math.round(d.mutCut * (d.vk ? d.vk.mag : 1))); }
  if (rank("pharm") >= 3 && (d.cat === "med" || /^medkit|^bandage/.test(id)) && (d.heal || (d.fx && d.fx.heal))) { G().st.poison = 0; G().st.bleed = 0; }
}
/* Приманка: твари в шестнадцати шагах идут на запах к месту падения. */
function throwBait(id, k) {
  var g = G(), C = LAB.combat;
  g.inv[id]--; if (!g.inv[id]) delete g.inv[id];
  var v = LAB.DIRS[g.face] || LAB.DIRS.N, x = g.x, y = g.y, fl = CUR().fl, fs = CUR().fs;
  for (var i = 1; i <= 6; i++) {
    var nx = x + v[0], ny = y + v[1];
    if (!LAB.inb(nx, ny)) break;
    var t = fl.t[ny * LAB.W + nx];
    if (t === LAB.T.WALL || (t === LAB.T.DOOR && fs.doors[fl.doorAt[ny * LAB.W + nx].id] !== 2)) break;
    x = nx; y = ny;
  }
  A("grenade", x, y, { noPin: true, fuse: 400 });
  var n = 0, lure = Math.round(20 * k.dur * bioDur());
  if (C && C.foes) C.foes().forEach(function (f) {
    if (f.dead || f.ally || f.calm || f.kind !== "bio" || f.boss || (f.base && f.base.beh.indexOf("stationary") >= 0)) return;
    if (Math.abs(f.x - x) + Math.abs(f.y - y) > 16) return;
    f.state = "alert"; f.lastKnown = { x: x, y: y }; f.lost = 0; f.lure = lure; f.ambush = false; n++;
  });
  if (C && C.spendTurns) C.spendTurns(1, "throw");
  say("Феромонная приманка " + (LAB.DIRTO ? LAB.DIRTO[g.face] : "") + " лопнула. " + (n ? "Тварей пошло на запах: " + n + "." : "Тварей рядом нет — запах выветрится зря.") + " Осталось: " + (g.inv[id] || 0) + ".");
  refresh();
  return true;
}
/* Твари не чуют: репеллент или «свой» мутант (combat.sees, hears). */
function repels(f, d) {
  if (f.kind !== "bio" || f.boss) return false;
  if (G().st.repel > 0 && (f.mind == null ? 1 : f.mind) < 2 && d > 1) return true;
  return kinStealth(f, d);
}
/* Выстрел и удар (combat.shoot): смазка, перегрузочная капсула, мутация. */
function onShot(w, f, melee) {
  var k = 1, noarmor = false;
  if (w.over > 0 && batteryGun(w) && !melee) { k *= w.overK || 1.5; w.over--; if (!w.over) { w.overK = 0; sayq("Перегрузочная капсула выгорела."); } }
  if (w.coat && w.coat.n > 0) {
    if (w.coat.k === "tox" && f.kind === "bio") k *= 1 + 0.2 * (w.coat.m || 1);
    if (w.coat.k === "acid") { noarmor = true; if (f.kind === "mech") k *= 1 + 0.15 * (w.coat.m || 1); }
  }
  if (melee) k *= meleeK();
  return { k: k, noarmor: noarmor };
}
function afterHit(w, f, dmg) {
  if (!w.coat || !(w.coat.n > 0)) return;
  w.coat.n--;
  if (w.coat.k === "tox" && f.kind === "bio" && !f.dead) { f.bleedT = Math.max(f.bleedT || 0, 8); f.bleedD = Math.max(f.bleedD || 0, Math.max(1, Math.round(dmg * 0.2))); if (rank("tox") >= 3 && !f.boss) f.slowT = Math.max(f.slowT || 0, 4); }
  if (w.coat.k === "acid" && f.kind === "mech" && rank("tox") >= 3) f.shield = 0;
  if (!w.coat.n) { sayq((w.coat.k === "tox" ? "Яд" : "Кислота") + " на оружии кончились."); w.coat = null; }
}
function chilled(w) { return !!(w && w.chill && w.chill > Date.now()); }
function heatK() { return rank("energy") >= 3 ? 0.75 : 1; }
function safeGrenades() { return rank("pyro") >= 2; }
function radiusBonus(id) { var d = LAB.ITEMS[id]; return d && d.base && PROD[d.base] && rank("pyro") >= 3 ? 1 : 0; }
/* Граната задела врага (combat.throwGrenade): ингибитор гасит мутаген в твари. */
function grenHit(q, f) {
  if (!q.inhibit || f.kind !== "bio" || f.dead || f.inhib) return;
  f.inhib = 1;
  f.dmg = Math.max(1, Math.round(f.dmg * 0.75));
  f.maxhp = Math.max(1, Math.round(f.maxhp * 0.85)); f.hp = Math.min(f.hp, f.maxhp);
  f.markT = Math.max(f.markT || 0, 10);
}

/* ════════ ТЕРМИТ: двери и сейфы ════════ */
function thermiteOk() { var g = G(); return Object.keys(g.inv).some(function (k) { return g.inv[k] > 0 && (k === "c_thermite" || (PV[k] && PV[k].b === "c_thermite")); }); }
function useThermite() { var g = G(); for (var k in g.inv) if (g.inv[k] > 0 && (k === "c_thermite" || (PV[k] && PV[k].b === "c_thermite"))) { g.inv[k]--; if (!g.inv[k]) delete g.inv[k]; return true; } return false; }
function burnDoor(d, openFn) {
  if (!useThermite()) return false;
  A("play", "hurt_burn"); A("explosion", d.x, d.y, "fire");
  if (LAB.combat && LAB.combat.noise) LAB.combat.noise(12);
  if (LAB.oko && LAB.oko.report) LAB.oko.report("door", d.x, d.y, "seen", "прожжён замок");
  gain("pyro", 6);
  say("Термит шипит и разгорается белым: замок стекает каплями металла. Дверь открыта — и на весь этаж слышно.");
  if (openFn) openFn();
  return true;
}
function burnSafe(o, openFn) {
  if (!useThermite()) return false;
  A("play", "hurt_burn"); A("explosion", o.x, o.y, "fire");
  if (LAB.combat && LAB.combat.noise) LAB.combat.noise(12);
  gain("pyro", 6);
  var lost = 0;
  if (o.loot && o.loot.length) o.loot = o.loot.filter(function (it) { if ((it.kind === "note" || it.kind === "credits") && Math.random() < 0.5) { lost++; return false; } return true; });
  say("Термит прожигает дверцу сейфа." + (lost ? " Жар испортил часть содержимого." : ""));
  if (openFn) openFn();
  return true;
}

/* ════════ ДОБЫЧА С ВРАГОВ (combat.kill) ════════
   Ткани тварей — по их природе; жидкости машин — по их устройству. Сорт — по
   глубине; тварь, павшая в тумане, — с мутагеном; глубже «Колыбели» в тварях
   бывает и сам конденсат. */
function behOf(f) { return f.beh || (f.base && f.base.beh) || []; }
function famOk(f, L) { return (FAM[f].depth || 1) <= L; }
function pickBio(f, r, L) {
  var beh = behOf(f), has = function (k) { return beh.indexOf(k) >= 0; }, adt = f.adt || (f.base && f.base.adt);
  var c = [];
  if (has("poison") || has("leech") || adt === "chem") c.push("c_venom");
  if ((has("explode") || adt === "acid") && famOk("c_acid", L)) c.push("c_acid");
  if ((f.arm || 0) >= 2 && famOk("c_chitin", L)) c.push("c_chitin");
  if ((has("swarm") || has("spore") || /vine|myc|spore|moss/.test(f.snd || (f.base && f.base.snd) || "")) && famOk("c_spores", L)) c.push("c_spores");
  if (L >= 4 && (has("regen") || (f.base && f.base.caste === "worker"))) c.push("c_enzyme");
  if (c.length && r() < 0.6) return c[Math.floor(r() * c.length)];
  return r() < 0.45 ? "c_gland" : "c_blood";
}
function pickMech(f, r, L) {
  if ((/weld|cutter|flame|titan|loader|foreman/.test(f.type) || (f.arm || 0) >= 6) && famOk("c_fuel", L) && r() < 0.5) return "c_fuel";
  var q = r();
  return q < 0.35 ? "c_coolant" : q < 0.7 ? "c_electrolyte" : "c_oil";
}
function fogAt(x, y) { var fl = CUR().fl, rid = fl.room[y * LAB.W + x], rm = rid >= 0 ? fl.rooms[rid] : null; return rm && rm.fog ? rm.fog : 0; }
function drops(f, list, r, dk0) {
  if (!f || f.ally) return;
  var L = G().L, beh = behOf(f), mk = function (fam, sat) { var gr = Math.min(3, gradeAt(L, r) + (rank("bio") >= 3 && FAM[fam].org ? 1 : 0)); return { kind: "item", item: matId(fam, gr, sat && !!FAM[fam].org), n: 1 }; };
  if (f.kind === "bio") {
    var inFog = fogAt(f.x, f.y) > 0;
    if (r() < Math.min(0.9, 0.42 * dk0 * (rank("bio") >= 1 ? 2 : 1))) list.push(mk(pickBio(f, r, L), inFog || (L >= 21 && r() < 0.25)));
    if (famOk("c_nerve", L) && (f.boss || ((f.mind || 0) >= 2 && r() < 0.18 * dk0))) list.push(mk("c_nerve", inFog));
    if (L >= 21 && r() < (f.boss ? 0.8 : 0.1) * dk0) list.push(mk("c_cond", false));
  } else if (f.kind === "mech") {
    if (beh.indexOf("camera") >= 0 || beh.indexOf("turret") >= 0) { if (r() < 0.2 * dk0) list.push(mk(r() < 0.5 ? "c_coolant" : "c_electrolyte", false)); return; }
    if (r() < 0.3 * dk0) list.push(mk(pickMech(f, r, L), false));
    if (famOk("c_catalyst", L) && ((f.aff && f.aff.length) || f.boss) && r() < (f.boss ? 0.6 : 0.06) * dk0) list.push(mk("c_catalyst", false));
  } else if (f.kind === "anom") {
    if (famOk("c_ecto", L) && r() < 0.3 * dk0) list.push(mk("c_ecto", false));
  }
}

/* ════════ ГЕНЕРАЦИЯ: шаг 25 (world.js) ════════
   Химический стол — почти на каждом этаже (лаборатории, медблоки, биоблоки;
   нет таких — любое помещение). Сырьё — в хранилищах по назначению
   помещения, сорт — по глубине. Туман — со второго уровня, у вивариев и
   теплиц, ниже — гуще и шире; в тумане — капли конденсата и ткани с
   мутагеном. Журнал с рецептурой — изредка. Свой поток случайностей. */
var CHEM_ROOMS = { chem: 1, med: 1, bio: 1 };
var POOL = {
  chem: ["c_solvent", "c_salt", "c_acidc", "c_alkali", "c_solvent", "c_phosphor", "c_enzyme", "c_catalyst", "c_stab", "c_activ"],
  med: ["c_salt", "c_solvent", "c_blood", "c_salt", "c_stab"],
  bio: ["c_spores", "c_chitin", "c_gland", "c_venom", "c_enzyme", "c_blood"],
  parts: ["c_oil", "c_electrolyte", "c_coolant", "c_fuel", "c_oil"],
  tech: ["c_coolant", "c_electrolyte", "c_catalyst"],
  food: ["c_salt"],
  arms: ["c_fuel", "c_phosphor", "c_oil"]
};
var CONT = { crate: 1, locker: 1, desk: 1, cabinet: 1, shelf: 1, fridge: 1, suitlocker: 1 };
function roomDef(rm) { return (LAB.ROOMS && LAB.ROOMS[rm.type]) || (LAB.ANNEX_ROOMS && LAB.ANNEX_ROOMS[rm.type]) || {}; }
function roomTag(fl, rid) { var rm = fl.rooms[rid]; return rm ? roomDef(rm).loot || "" : ""; }
function poolAt(tag, L) { return (POOL[tag] || []).filter(function (k) { return famOk(k, L); }); }
/* Туман по глубине: сколько помещений на этаже (n0–n1, у тварей и растений, потом
   в лабораториях), их плотность (d0–d1) и сколько ещё случайных помещений (extra). */
function fogPlan(L) {
  if (L < 2) return null;
  if (L <= 5) return { p: 0.5, n0: 1, n1: 1, d0: 1, d1: 1, extra: 0 };
  if (L <= 10) return { p: 1, n0: 1, n1: 2, d0: 1, d1: 2, extra: 0 };
  if (L <= 20) return { p: 1, n0: 1, n1: 2, d0: 1, d1: 2, extra: 1 };
  if (L <= 40) return { p: 1, n0: 3, n1: 5, d0: 2, d1: 3, extra: 2 };
  if (L <= 60) return { p: 1, n0: 2, n1: 3, d0: 1, d1: 2, extra: 1 };
  if (L <= 80) return { p: 1, n0: 1, n1: 3, d0: 1, d1: 2, extra: 1 };
  return { p: 1, n0: 3, n1: 4, d0: 2, d1: 3, extra: 1 };
}
function place(ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, r = LAB.Rng(ctx.seed, "chem27:" + L + ":" + F + ":" + ctx.attempt);
  var NS = 12, good = [], other = [], bio = [], s;
  var capRoom = {};
  fl.objs.forEach(function (o) { if ((o.type === "capsule" || o.type === "wake" || o.type === "medvend") && o.room != null) capRoom[o.room] = 1; });
  for (s = 0; s < fl.rooms.length; s++) {
    var rm = fl.rooms[s];
    if (!rm || s === fl.secret || rm.hidden) continue;
    var tag = roomTag(fl, s);
    if (CHEM_ROOMS[tag]) good.push(s);
    if (tag === "bio") bio.push(s);
    else if (s < NS && s !== ctx.U && !roomDef(rm).special) other.push(s);
  }
  r.shuffle(good); r.shuffle(other);
  var placed = 0, want = r.chance(0.8) ? 1 + (r.chance(0.25) ? 1 : 0) : 0;
  var tryAt = function (list, isGood) {
    for (var i = 0; i < list.length && placed < want; i++) { if (ctx.addObj("chemlab", list[i], { good: isGood ? 1 : 0 })) placed++; }
  };
  tryAt(good, true);
  if (placed < want && r.chance(0.6)) tryAt(other, false);
  /* туман */
  var fp = fogPlan(L), fogRooms = [];
  if (fp && r.chance(fp.p)) {
    var setFog = function (rid, d) { var rm2 = fl.rooms[rid]; if (!rm2 || capRoom[rid] || rid === ctx.U || rm2.fog) return false; rm2.fog = d; fogRooms.push(rid); return true; };
    var labs = good.filter(function (rid) { return roomTag(fl, rid) === "chem"; });
    var src = r.shuffle(bio.slice()).concat(r.shuffle(labs));
    for (var fi = 0, want2 = r.int(fp.n0, fp.n1); fi < src.length && fogRooms.length < want2; fi++) setFog(src[fi], r.int(fp.d0, fp.d1));
    var pool2 = other.filter(function (rid) { return !fl.rooms[rid].fog; });
    for (var e = 0; e < fp.extra && pool2.length; e++) setFog(pool2.splice(r.int(0, pool2.length - 1), 1)[0], fp.d0);
  }
  var fogOf = function (rid) { var rm3 = fl.rooms[rid]; return rm3 && rm3.fog ? rm3.fog : 0; };
  var mat = function (fam, rid) { return { kind: "item", item: matId(fam, FAM[fam].one ? 1 : gradeAt(L, function () { return r.next(); }), !!(FAM[fam].org && fogOf(rid))), n: r.chance(0.25) ? 2 : 1 }; };
  /* сырьё в хранилищах */
  fl.objs.forEach(function (o) {
    if (!CONT[o.type] || !o.loot || o.room == null || o.room < 0) return;
    var pool = poolAt(roomTag(fl, o.room), L);
    if (!pool.length || !r.chance(0.32)) return;
    o.loot.push(mat(r.pick(pool), o.room));
  });
  /* склянки на полу лабораторий, конденсат в тумане */
  good.slice(0, 3).forEach(function (rid) { var pool = poolAt(roomTag(fl, rid), L); if (pool.length && r.chance(0.5)) ctx.addItem(mat(r.pick(pool), rid), rid); });
  fogRooms.forEach(function (rid) { if (fogOf(rid) >= 2 || r.chance(0.35)) ctx.addItem({ kind: "item", item: matId("c_cond", Math.min(3, gradeAt(L, function () { return r.next(); }) + (fogOf(rid) >= 3 ? 1 : 0))), n: 1 }, rid); });
  /* журнал с рецептурой */
  var fpool = RC.filter(function (rc) { return rc.f && rc.lv <= 1 + Math.floor(L / 3) && outOk(rc); });
  if (fpool.length && r.chance(0.35)) {
    var rids = good.length ? good : other;
    if (rids.length) ctx.addItem({ kind: "note", note: "formula", f: r.pick(fpool).id, n: r.int(0, 999) }, r.pick(rids));
  }
}

/* ════════ ЗАПИСКИ: лабораторный журнал с рецептурой ════════ */
var LOGS = ["Журнал смены химиков", "Лабораторный журнал", "Протокол синтеза", "Рабочая тетрадь лаборанта", "Методичка для практикантов"];
var WHO = ["лаборант В. Сомова", "старший химик Р. Ганиев", "технолог Л. Пряхина", "практикант Д. Лисицын", "фармацевт О. Лемешко", "химик-аналитик С. Брандт"];
var TIPS = ["Греть медленно, мешать постоянно, вытяжку не выключать.", "Если пошёл бурый дым — бросить всё и выйти. Проверено.", "Осадок не выливать в раковину: раковина потом шипит.", "ОКО просит отчёт о расходе реактивов. Не пишите ему лишнего.", "Ткани из тумана сначала промыть щёлочью. Кто не промыл — тот у нас теперь в вольере."];
function noteText(it, h) {
  var rc = RCBY[it.f], hh = (h || 0) >>> 0;
  if (!rc || !outOk(rc)) return { t: "Лабораторный журнал", x: "Страница залита реактивом: не разобрать." };
  return { t: LOGS[hh % LOGS.length] + ": «" + outName(rc) + "»", a: WHO[(hh >>> 4) % WHO.length],
    x: "Рецептура «" + outName(rc) + "». Направление — " + BR[rc.br].n + ", ступень " + rc.lv + ". Стол — не проще, чем " + ST[rc.st].n + ". Состав: " + needText(rc.need) + (rc.minG ? "; сырьё не ниже очищенного сорта" : "") + ". " + TIPS[(hh >>> 8) % TIPS.length] };
}
function fromNote(it) { if (it && it.note === "formula" && it.f) learn(it.f, "Её записал журнал — она в архиве документов."); }

LAB.chem = {
  FAM: FAM, MAT: MAT, PROD: PROD, PV: PV, RC: RC, REF: REF, BR: BR, SPECS: SPECS, ST: ST, MOD: MOD,
  open: open, place: place, drops: drops, use: use, afterUse: afterUse, tick: tick, repels: repels, onShot: onShot, afterHit: afterHit, chilled: chilled, heatK: heatK,
  safeGrenades: safeGrenades, radiusBonus: radiusBonus, grenHit: grenHit, onBite: onBite,
  healK: healK, noOverdose: noOverdose, potK: potK, line: line, invMenu: invMenu, matCount: matCount, noteText: noteText, fromNote: fromNote,
  thermiteOk: thermiteOk, burnDoor: burnDoor, burnSafe: burnSafe, capsuleSleep: capsuleSleep, decon: decon,
  mut: mut, stage: stage, addMut: addMut, cutMut: cutMut, mutLine: mutLine, fogHere: fogHere, fogPlan: fogPlan, matId: matId, prodId: prodId, gradeAt: gradeAt,
  level: level, brLv: brLv, gain: gain, spec: spec, rank: rank, known: known, learn: learn, station: station,
  brew: function (id, o) { return brew(RCBY[id], o || null); }, forecast: function (id, o) { return forecast(RCBY[id], o ? station(o) : null); }, why: function (id, o) { return why(RCBY[id], o ? station(o) : null); },
  opt: function () { return ch().opt; }
};
})();
