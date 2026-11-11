/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — импланты и чипы, кибернетика (2.0).
   Импланты — действия по запросу (панель имплантов, энергия), чипы —
   пассивные: работают сами в нейрогнёздах. Восемь направлений: боевые,
   защитные, сенсорные, нейровзлом, медицинские, движение и скрытность,
   энергетика, ремесло и торговля.
   Кибернетика — опыт каждого направления: вживление, калибровка,
   модификации, сборка, разбор и само применение. Ступень направления
   (до пятой): импланты направления сильнее и дешевле, открываются его
   модификации и сборка сложных чипов, на четвёртой — иногда без затрат,
   на пятой — шире. Общая ступень (до десятой, по всему опыту): больше
   нейрогнёзд для чипов и ёмкости для имплантов, больше модификаций на
   имплант, калибровка второй и третьей ступени, на шестой — извлекать
   самому, без верстака; на десятой — «нейроархитектор».
   Ступень импланта (калибровка, до третьей): сильнее и экономнее, на
   третьей — на шаг дальше. Модификации — по гнёздам импланта.
   Чипы — вещи рюкзака: найти, собрать по схеме у верстака, вживить,
   извлечь, разобрать на детали (разбор раскрывает схему) и продать.
   Сканер и эхолокация — системные импланты «Эхо».
   (после 4.1) Ниже Истока — кибернетика глубин: ступени направлений до
   пятнадцатой и общая до двадцатой (по ступени на глубокий блок), калибровка
   до пятой, двадцать четыре импланта и двадцать четыре чипа Нижних, одиннадцать
   модификаций глубин; выше сотого уровня всё по-прежнему.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function low(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function menu(title, items, opts) { return LAB.ui.menu(title, items, opts); }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function h32(s) { return LAB.hash32(String(s)) >>> 0; }

/* ════════ НАПРАВЛЕНИЯ ════════ */
var CATS = {
  combat:  { n: "боевые", p: "cap", q: "relay" },
  defense: { n: "защитные", p: "cell", q: "panel" },
  sensor:  { n: "сенсорные", p: "optic", q: "lens" },
  hack:    { n: "нейровзлом", p: "chip", q: "relay" },
  med:     { n: "медицинские", p: "gel", q: "reagent" },
  move:    { n: "движение и скрытность", p: "servo", q: "magnet" },
  energy:  { n: "энергетика", p: "cell", q: "cap" },
  craft:   { n: "ремесло и торговля", p: "wire", q: "scrap" }
};
var CAT_ORDER = ["combat", "defense", "sensor", "hack", "med", "move", "energy", "craft"];

/* ════════ ИМПЛАНТЫ И ЧИПЫ ════════
   fx — действие импланта (run), st — что даёт чип. t — ступень сложности
   (1–4): от неё класс верстака, ёмкость и нужная ступень направления. */
var BASE = {
  scan:    { cat: "sensor", t: 1, core: 1 },
  echo:    { cat: "sensor", t: 1, core: 1 },
  regen:   { cat: "med", t: 1, fx: { k: "heal", hp: 30, perL: 4, bleed: 1 } },
  empulse: { cat: "combat", t: 2, fx: { k: "area", r: 3, dmg: 40, perL: 12, dt: "emp", kind: "mech", unshield: 1 } },
  shield:  { cat: "defense", t: 2, fx: { k: "buff", shield: 40, perL: 6 } },
  haste:   { cat: "move", t: 2, fx: { k: "buff", haste: 20 } },
  thermal: { cat: "combat", t: 2, fx: { k: "area", r: 2, dmg: 35, perL: 10, dt: "thermo", kind: "bio", noarmor: 1 } },
  cloak:   { cat: "move", t: 3, fx: { k: "buff", cloak: 16 } },
  tk:      { cat: "energy", t: 1 },
  hack:    { cat: "hack", t: 2 },
  freeze:  { cat: "combat", t: 3, fx: { k: "area", r: 3, freeze: 8 } },
  pbolt:   { cat: "combat", t: 4, fx: { k: "line", rng: 12, dmg: 90, perL: 25, dt: "positron", noarmor: 1 } }
};
var NEW = [
  /* боевые */
  { id: "arc", n: "Дуговой разрядник", cat: "combat", t: 1, cost: 8, price: 140, desc: "Разряд бьёт ближайшего врага в шести шагах и перескакивает ещё на двоих рядом.", fx: { k: "arc", rng: 6, dmg: 22, perL: 6, dt: "shock", jumps: 2 } },
  { id: "acid", n: "Кислотный впрыск", cat: "combat", t: 1, cost: 7, price: 120, desc: "Струя кислоты на четыре шага вперёд: разъедает всех на линии.", fx: { k: "line", rng: 4, dmg: 20, perL: 5, dt: "chem" } },
  { id: "sonic", n: "Звуковой таран", cat: "combat", t: 2, cost: 10, price: 180, desc: "Удар звуком вперёд, конусом на четыре шага: бьёт и отбрасывает на шаг.", fx: { k: "cone", rng: 4, dmg: 18, perL: 5, dt: "sonic", push: 1 } },
  { id: "shrapnel", n: "Осколочный выброс", cat: "combat", t: 2, cost: 11, price: 180, desc: "Подкожный заряд стальной дроби: бьёт всех в двух шагах вокруг.", fx: { k: "area", r: 2, dmg: 28, perL: 8, dt: "kinetic" } },
  { id: "overdrive", n: "Плазменный разгон", cat: "combat", t: 2, cost: 12, price: 200, desc: "Десять секунд оружие в руках бьёт на сорок процентов сильнее.", fx: { k: "buff", over: 20 } },
  { id: "neuroshock", n: "Нейрошок", cat: "combat", t: 2, cost: 12, price: 190, desc: "Импульс по нервам: твари в трёх шагах цепенеют на две секунды.", fx: { k: "area", r: 3, freeze: 4, dmg: 8, perL: 2, dt: "shock", kind: "bio" } },
  { id: "gravwell", n: "Гравитационный узел", cat: "combat", t: 3, cost: 16, price: 300, desc: "Узел тяжести стягивает врагов в четырёх шагах к вам и вязнет их движение.", fx: { k: "pull", r: 4, slow: 8, dmg: 10, perL: 3, dt: "grav" } },
  /* защитные */
  { id: "reflect", n: "Зеркальный контур", cat: "defense", t: 2, cost: 12, price: 210, desc: "Восемь секунд сорок процентов удара уходят обратно в того, кто бьёт.", fx: { k: "buff", reflect: 16 } },
  { id: "nano", n: "Наноброня", cat: "defense", t: 2, cost: 12, price: 200, desc: "Двенадцать секунд облако наночастиц прибавляет к защите.", fx: { k: "buff", nano: 8, perL: 1 } },
  { id: "phase", n: "Фазовый сдвиг", cat: "defense", t: 4, cost: 24, price: 520, desc: "Три секунды вы чуть вне фазы: удары проходят сквозь.", fx: { k: "buff", phase: 6 } },
  /* сенсорные */
  { id: "huntmark", n: "Метка охотника", cat: "sensor", t: 1, cost: 6, price: 110, desc: "Метит врагов в десяти шагах: по ним бьют на четверть сильнее, и их слышно.", fx: { k: "mark", r: 10, mark: 40 } },
  { id: "heat", n: "Термозрение", cat: "sensor", t: 1, cost: 5, price: 100, desc: "Тепло живого сквозь стены: называет тварей в шестнадцати шагах и где они.", fx: { k: "heat", r: 16 } },
  { id: "traps", n: "Детектор ловушек", cat: "sensor", t: 1, cost: 4, price: 90, desc: "Находит ловушки и мины в двенадцати шагах.", fx: { k: "traps", r: 12 } },
  { id: "sonar", n: "Глубинный сонар", cat: "sensor", t: 2, cost: 9, price: 170, desc: "Звуковая волна в четырнадцать шагов: «Эхо» запоминает всё вокруг на карту.", fx: { k: "map", r: 14 } },
  { id: "weak", n: "Анализатор слабостей", cat: "sensor", t: 2, cost: 8, price: 160, desc: "Называет, чем бить врагов в восьми шагах, и метит их.", fx: { k: "weak", r: 8, mark: 20 } },
  { id: "cache", n: "Поиск тайников", cat: "sensor", t: 2, cost: 6, price: 150, desc: "Пустоты за стенами и вещи в восьми шагах.", fx: { k: "secret", r: 8 } },
  /* нейровзлом */
  { id: "camloop", n: "Петля камер", cat: "hack", t: 1, cost: 8, price: 140, desc: "Камеры ОКО в десяти шагах показывают пустой коридор: тридцать секунд они слепы.", fx: { k: "blind", r: 10, cams: 60 } },
  { id: "veil", n: "Ионная завеса", cat: "hack", t: 2, cost: 11, price: 190, desc: "Завеса помех в четырёх шагах: камеры слепнут, роботы теряют вас из виду.", fx: { k: "blind", r: 4, cams: 40, bots: 16 } },
  { id: "trojan", n: "Троянский импульс", cat: "hack", t: 2, cost: 14, price: 230, desc: "Роботы в четырёх шагах получают ложный приказ «объект не найден».", fx: { k: "blind", r: 4, bots: 24, forget: 1 } },
  { id: "spoof", n: "Подмена сигнала", cat: "hack", t: 2, cost: 10, price: 180, desc: "Ваш сигнал — шагах в шести впереди: машины идут туда.", fx: { k: "lure", rng: 6 } },
  { id: "turret", n: "Перехват турели", cat: "hack", t: 3, cost: 18, price: 320, desc: "Ближайшая турель в шести шагах двадцать секунд бьёт по вашим врагам.", fx: { k: "turret", r: 6, ally: 40 } },
  { id: "overload", n: "Замыкание", cat: "hack", t: 3, cost: 16, price: 300, desc: "Перегрузка цепей у роботов в трёх шагах: урон и остановка.", fx: { k: "area", r: 3, dmg: 30, perL: 9, dt: "emp", kind: "mech", freeze: 3 } },
  /* медицинские; (3.6, просьба игрока) «Гемостат» слит с «Регенерацией»: лечилка одна —
     она и лечит, и останавливает кровь (GONE, fixSave) */
  { id: "detox", n: "Детокс-железа", cat: "med", t: 1, cost: 6, price: 110, desc: "Выводит яд и токсины.", fx: { k: "heal", tox: 40, poison: 1 } },
  { id: "adrenal", n: "Адреналиновый насос", cat: "med", t: 2, cost: 9, price: 160, desc: "Подлечивает, бодрит и на четыре секунды ускоряет.", fx: { k: "heal", hp: 12, perL: 2, haste: 8, wake: 25 } },
  { id: "neurodamp", n: "Нейрогаситель", cat: "med", t: 2, cost: 4, price: 150, desc: "Снимает нейронагрузку на сорок.", fx: { k: "heal", neuro: 40 } },
  { id: "stabilize", n: "Экстренная стабилизация", cat: "med", t: 2, cost: 10, price: 170, desc: "Снимает кровотечение, яд и замедление, немного лечит.", fx: { k: "heal", hp: 15, perL: 2, bleed: 1, poison: 1, unslow: 1 } },
  { id: "radpurge", n: "Радиофаг", cat: "med", t: 3, cost: 14, price: 260, desc: "Наноботы собирают радионуклиды: облучение минус тридцать.", fx: { k: "heal", rad: 30 } },
  /* движение и скрытность */
  { id: "mute", n: "Глушитель шагов", cat: "move", t: 1, cost: 6, price: 120, desc: "Двадцать секунд шаги почти не слышны.", fx: { k: "buff", mute: 40 } },
  { id: "dash", n: "Рывок", cat: "move", t: 2, cost: 8, price: 160, desc: "Три шага вперёд мгновенно — уйти из-под удара.", fx: { k: "dash", steps: 3 } },
  { id: "mimic", n: "Мимикрия", cat: "move", t: 3, cost: 14, price: 280, desc: "Десять секунд машины принимают вас за своего.", fx: { k: "buff", mimic: 20 } },
  /* энергетика */
  { id: "siphon", n: "Сифон энергии", cat: "energy", t: 2, cost: 2, price: 170, desc: "Вытягивает заряд из роботов в трёх шагах: им — урон, вам — энергия.", fx: { k: "siphon", r: 3, dmg: 12, perL: 3, en: 6 } },
  { id: "magnet", n: "Магнитный захват", cat: "energy", t: 1, cost: 6, price: 110, desc: "Притягивает вещи в шести шагах вокруг — и сразу в рюкзак.", fx: { k: "magnet", r: 6 } }
];
var CHIPS = [
  { id: "c_aim", n: "Чип прицеливания", cat: "combat", t: 1, price: 140, st: { acc: 0.08 }, desc: "Попадания чаще: плюс восемь процентов к точности." },
  { id: "c_quick", n: "Чип быстрой руки", cat: "combat", t: 1, price: 130, st: { reload: 0.2 }, desc: "Перезарядка на пятую часть быстрее." },
  { id: "c_cool", n: "Чип охлаждения", cat: "combat", t: 1, price: 120, st: { cool: 0.3 }, desc: "Ствол греется на треть медленнее." },
  { id: "c_fury", n: "Чип ярости", cat: "combat", t: 2, price: 220, st: { dmg: 0.1 }, desc: "Оружие бьёт на десять процентов сильнее." },
  { id: "c_ap", n: "Чип бронебойности", cat: "combat", t: 2, price: 210, st: { pierce: 0.15 }, desc: "Броня врагов гасит удар меньше." },
  { id: "c_exec", n: "Чип добивания", cat: "combat", t: 3, price: 300, st: { exec: 0.25 }, desc: "По раненым — на четверть сильнее." },
  { id: "c_dermal", n: "Чип кожного панциря", cat: "defense", t: 1, price: 140, st: { armor: 3 }, desc: "Подкожная сетка: защита плюс три." },
  { id: "c_ground", n: "Чип заземления", cat: "defense", t: 2, price: 190, st: { ground: 0.4 }, desc: "Разряды, импульсы и ионный поток бьют слабее." },
  { id: "c_lead", n: "Чип свинцовой оболочки", cat: "defense", t: 2, price: 200, st: { rad: 0.25 }, desc: "Облучение копится на четверть медленнее." },
  { id: "c_grit", n: "Чип стойкости", cat: "defense", t: 2, price: 230, st: { hpmax: 0.1 }, desc: "Здоровья на десятую часть больше." },
  { id: "c_reflex", n: "Чип рефлекса", cat: "defense", t: 3, price: 320, st: { dodge: 0.08 }, desc: "Иногда тело само уходит от удара." },
  { id: "c_ears", n: "Чип острого слуха", cat: "sensor", t: 1, price: 120, st: { sense: 2 }, desc: "Сенсорные импланты — на два шага дальше." },
  { id: "c_carto", n: "Чип картографа", cat: "sensor", t: 1, price: 120, st: { map: 2 }, desc: "«Эхо» запоминает на два шага шире, где вы прошли." },
  { id: "c_crack", n: "Чип взломщика", cat: "hack", t: 1, price: 160, st: { tries: 1 }, desc: "У взлома на попытку больше." },
  { id: "c_silence", n: "Чип тишины", cat: "move", t: 2, price: 210, st: { quiet: 0.3 }, desc: "Вас слышно на треть хуже." },
  { id: "c_antitox", n: "Чип антитоксина", cat: "med", t: 1, price: 130, st: { antitox: 0.4 }, desc: "Яды и токсины берут слабее." },
  { id: "c_metab", n: "Чип метаболизма", cat: "med", t: 1, price: 120, st: { metab: 0.3 }, desc: "Голод и усталость приходят медленнее." },
  { id: "c_regen", n: "Чип регенерации", cat: "med", t: 2, price: 240, st: { regen: 1 }, desc: "Вне боя понемногу лечит сам." },
  { id: "c_buffer", n: "Чип нейробуфера", cat: "med", t: 2, price: 220, st: { buffer: 0.25 }, desc: "Импланты нагружают нервы на четверть меньше." },
  { id: "c_battery", n: "Чип аккумулятора", cat: "energy", t: 1, price: 150, st: { enmax: 20 }, desc: "Энергии имплантов на двадцать больше." },
  { id: "c_recharge", n: "Чип рекуперации", cat: "energy", t: 2, price: 220, st: { recharge: 0.25 }, desc: "Энергия восстанавливается на четверть быстрее." },
  { id: "c_econ", n: "Чип экономии", cat: "energy", t: 2, price: 230, st: { econ: 0.1 }, desc: "Импланты тратят на десятую часть меньше." },
  { id: "c_mech", n: "Чип механика", cat: "craft", t: 1, price: 130, st: { fix: 10 }, desc: "Походный ремонт — на десять больше." },
  { id: "c_appr", n: "Чип оценщика", cat: "craft", t: 1, price: 140, st: { sell: 0.15 }, desc: "Скупщики платят на пятнадцать процентов больше." },
  { id: "c_prosp", n: "Чип старателя", cat: "craft", t: 2, price: 200, st: { loot: 0.2 }, desc: "Кредитов в находках на пятую часть больше." },
  { id: "c_design", n: "Чип конструктора", cat: "craft", t: 2, price: 230, st: { craft: 0.1 }, desc: "У верстака иногда выходит лишняя вещь." }
];
/* прежние импланты получают направление и ступень сложности */
LAB.IMPLANTS.forEach(function (im) { var b = BASE[im.id]; if (b) for (var k in b) im[k] = b[k]; });
NEW.forEach(function (im) { if (!LAB.IMPLANTS.some(function (q) { return q.id === im.id; })) LAB.IMPLANTS.push(im); });
CHIPS.forEach(function (im) { im.passive = 1; im.cost = 0; if (!LAB.IMPLANTS.some(function (q) { return q.id === im.id; })) LAB.IMPLANTS.push(im); });
/* ════════ (после 4.1) ИМПЛАНТЫ И ЧИПЫ ГЛУБИН ════════
   Двадцать четыре импланта и двадцать четыре чипа Нижних — по три на направление. Открываются по
   глубине: blk — глубокий блок (VI–XV), с первого уровня которого вещь находят, продают и собирают
   (minL); выше сотого уровня их нет. t — класс глубин (5 — Полигон и Институт, 6 — Опытный корпус и
   Лаборатории, 7 — Посёлок, Лечебница, Цеха, 8 — Котёл, Карантин, Основание): от него ёмкость, схема и
   нужная ступень направления. Действия — новые виды fx (run): резонанс, игла переделки, пар, счётный
   щит, последняя перекличка, кордон, перепись, отпечаток эха, предчувствие, ложная перекличка,
   кукловод, перегрев, обратный ток, отложенная боль, промывка, возврат по следу, точка сбора, глухая
   зона, подпитка ствола, конденсаторный выброс, теплоотвод, опись тайников, торг, полевой ремонт. */
function blockFrom(n) { var R = LAB.blockRange && LAB.blockRange(n); return R && R.from ? R.from : 101 + 200 * (Math.pow(2, n - 6) - 1); }
function blockAt(L) { if (L <= 100) return Math.max(1, Math.ceil(L / 20)); if (LAB.DEEP_FIRST && LAB.blockOf) return LAB.blockOf(L); var n = 6; while (n < 15 && L >= blockFrom(n + 1)) n++; return n; }
function tOfBlk(b) { return b >= 13 ? 8 : b >= 10 ? 7 : b >= 8 ? 6 : 5; }
var DEEP_NEW = [
  /* боевые */
  { id: "d_reso", n: "Резонансный разряд", cat: "combat", blk: 7, cost: 13, price: 980, desc: "Нота слоя бьёт всех в трёх шагах вокруг; чем их больше, тем громче звенит — до вдвое сильнее.", fx: { k: "reso", r: 3, dmg: 30, perL: 12, dt: "sonic" } },
  { id: "d_ruin", n: "Игла переделки", cat: "combat", blk: 8, cost: 16, price: 1350, desc: "Игла Опытного корпуса — в ближайшего врага в восьми шагах: удар сквозь броню, и броня его потом вдвое слабее. Живое ещё и кровит.", fx: { k: "ruin", rng: 8, dmg: 50, perL: 26, dt: "kinetic", noarmor: 1 } },
  { id: "d_steam", n: "Паровой выброс", cat: "combat", blk: 13, cost: 22, price: 2500, desc: "Струя пара Котла — конусом на пять шагов: обваривает и машины, и живых, и ещё четыре секунды жжёт.", fx: { k: "steam", rng: 5, dmg: 40, perL: 20, dt: "thermo" } },
  /* защитные */
  { id: "d_absorb", n: "Счётный щит", cat: "defense", blk: 6, cost: 13, price: 950, desc: "Восемь секунд каждый удар засчитывается вполовину, а треть погашенного возвращается энергией.", fx: { k: "absorb", dur: 16 } },
  { id: "d_cordon", n: "Кордон", cat: "defense", blk: 14, cost: 22, price: 2400, desc: "Отталкивает всех в трёх шагах и восемь секунд никого не подпускает вплотную.", fx: { k: "cordon", r: 3, dur: 16 } },
  { id: "d_ward", n: "Последняя перекличка", cat: "defense", blk: 15, cost: 24, price: 2800, desc: "Тридцать секунд смертельный удар не убивает: вы остаётесь при единице здоровья и сразу набираете треть. Один раз за применение.", fx: { k: "ward", dur: 60 } },
  /* сенсорные */
  { id: "d_census", n: "Перепись этажа", cat: "sensor", blk: 6, cost: 10, price: 900, desc: "Как перекличка: считает всех врагов на этаже, живых и машины, называет ближайших и метит тех, кто в двенадцати шагах.", fx: { k: "census", r: 12, mark: 30 } },
  { id: "d_survey", n: "Отпечаток эха", cat: "sensor", blk: 7, cost: 11, price: 950, desc: "«Эхо» обходит звуком двадцать шагов вокруг: всё — на карту, и называет, что там стоит: лестницы, верстаки, столы, хранилища.", fx: { k: "survey", r: 20 } },
  { id: "d_foresee", n: "Предчувствие", cat: "sensor", blk: 10, cost: 18, price: 1800, desc: "Двадцать секунд «Эхо» слышит замах раньше удара: каждый четвёртый удар проходит мимо.", fx: { k: "foresee", dur: 40 } },
  /* нейровзлом */
  { id: "d_shout", n: "Ложная перекличка", cat: "hack", blk: 6, cost: 14, price: 1000, desc: "Голос Переклички из ваших нейрогнёзд: твари в десяти шагах теряют голову на шесть секунд, машины слепнут.", fx: { k: "shout", r: 10, conf: 12, blind: 12 } },
  { id: "d_puppet", n: "Кукловод", cat: "hack", blk: 8, cost: 18, price: 1450, desc: "Ближайшая машина в пяти шагах на двадцать секунд — ваша: бьёт своих. Стража не взять — только сбить с толку.", fx: { k: "puppet", r: 5, ally: 40 } },
  { id: "d_overheat", n: "Перегрев контура", cat: "hack", blk: 12, cost: 20, price: 1900, desc: "Ближайшая машина в шести шагах перегревается: через три секунды она взрывается и задевает всех рядом с собой.", fx: { k: "overheat", rng: 6, dmg: 60, perL: 24, dt: "thermo" } },
  /* медицинские */
  { id: "d_convert", n: "Обратный ток", cat: "med", blk: 9, cost: 12, price: 1300, desc: "Токсины, облучение и нейронагрузку тело пускает в дело: сколько вывели — столько вернулось здоровьем.", fx: { k: "convert", tox: 40, rad: 25, neuro: 30 } },
  { id: "d_defer", n: "Отложенная боль", cat: "med", blk: 11, cost: 18, price: 1850, desc: "Десять секунд удары доходят лишь на треть; остальное приходит потом, понемногу, — и до смерти не доводит.", fx: { k: "defer", dur: 20 } },
  { id: "d_purify", n: "Карантинная промывка", cat: "med", blk: 14, cost: 20, price: 2300, desc: "Снимает яд, кровотечение, вязкость и глухоту, выводит токсины, облучение и часть мутации, и минуту дыхание не боится газа.", fx: { k: "purify", tox: 60, rad: 30, mut: 8, neuro: 20, atox: 120 } },
  /* движение и скрытность */
  { id: "d_rewind", n: "Возврат по следу", cat: "move", blk: 6, cost: 12, price: 950, desc: "Возвращает туда, где вы стояли четыре секунды назад, — если путь туда не перекрыт.", fx: { k: "rewind", back: 8 } },
  { id: "d_anchor", n: "Точка сбора", cat: "move", blk: 10, cost: 10, price: 1700, desc: "Первое применение отмечает место на этаже, второе возвращает вас туда, где бы вы ни были на этом этаже.", fx: { k: "anchor" } },
  { id: "d_hush", n: "Глухая зона", cat: "move", blk: 14, cost: 18, price: 2300, desc: "Звук вокруг глохнет: в шести шагах враги теряют ваш след и полминуты ничего не слышат, а ваших шагов не слышно вовсе.", fx: { k: "hush", r: 6, deaf: 60, mute: 60 } },
  /* энергетика */
  { id: "d_feed", n: "Подпитка ствола", cat: "energy", blk: 6, cost: 15, price: 1000, desc: "Ток имплантов — в оружие в руках: заряд полон, а у оружия на энергобатареях ещё и пять выстрелов на треть сильнее.", fx: { k: "feed", over: 5 } },
  { id: "d_discharge", n: "Конденсаторный выброс", cat: "energy", blk: 8, cost: 8, price: 1400, desc: "Вся оставшаяся энергия — одним разрядом на три шага вокруг: чем больше было, тем сильнее. Машинам — сильнее всех.", fx: { k: "discharge", r: 3, dt: "shock" } },
  { id: "d_heatsink", n: "Теплоотвод Котла", cat: "energy", blk: 13, cost: 16, price: 2400, desc: "Пятнадцать секунд жар и огонь вас не обжигают, а лечат, и оружие в руках не греется.", fx: { k: "heatsink", dur: 30 } },
  /* ремесло и торговля */
  { id: "d_peek", n: "Опись тайников", cat: "craft", blk: 7, cost: 9, price: 900, desc: "Шкафы, ящики и сейфы в десяти шагах: «Эхо» слышит, что в каждом лежит, — до того, как откроете.", fx: { k: "peek", r: 10 } },
  { id: "d_haggle", n: "Торг по спискам", cat: "craft", blk: 10, cost: 10, price: 1700, desc: "Две минуты скупщики платят на четверть больше: «Эхо» подсказывает цены по спискам Нижних.", fx: { k: "haggle", dur: 240 } },
  { id: "d_mend", n: "Полевой ремонт", cat: "craft", blk: 12, cost: 16, price: 1900, desc: "Энергия имплантов — в наносварку: оружию в руках плюс двадцать пять к состоянию, надетой броне — плюс пятнадцать; откалиброванный чинит больше.", fx: { k: "mend", w: 25, a: 15 } }
];
var DEEP_CHIPS = [
  { id: "dc_tally", n: "Чип счёта", cat: "combat", blk: 6, price: 900, st: { streak: 0.5 }, desc: "Третье попадание подряд по одной цели — на половину сильнее." },
  { id: "dc_hunter", n: "Чип ловчего", cat: "combat", blk: 8, price: 1250, st: { bio: 0.2 }, desc: "По живому — на пятую часть сильнее." },
  { id: "dc_breaker", n: "Чип разборщика", cat: "combat", blk: 12, price: 1800, st: { mech: 0.2 }, desc: "По машинам — на пятую часть сильнее." },
  { id: "dc_thorn", n: "Чип колючей кожи", cat: "defense", blk: 7, price: 950, st: { thorns: 0.25 }, desc: "Кто бьёт вплотную, получает четверть своего удара обратно." },
  { id: "dc_lastline", n: "Чип последнего рубежа", cat: "defense", blk: 11, price: 1700, st: { lastline: 0.25 }, desc: "Когда здоровья меньше трети, удары берут на четверть меньше." },
  { id: "dc_aegis", n: "Чип живого щита", cat: "defense", blk: 13, price: 2300, st: { shieldregen: 25 }, desc: "Вне боя щит нарастает сам — до предела, что растёт с глубиной." },
  { id: "dc_ambush", n: "Чип засады", cat: "sensor", blk: 6, price: 900, st: { first: 0.33 }, desc: "По тем, кто вас ещё не преследует, — на треть сильнее." },
  { id: "dc_far", n: "Чип дальнего слуха", cat: "sensor", blk: 9, price: 1250, st: { sense: 4 }, desc: "Сенсорные импланты и сканер — на четыре шага дальше." },
  { id: "dc_cards", n: "Чип карточек Переклички", cat: "sensor", blk: 14, price: 2200, st: { boss: 0.25 }, desc: "По стражам — на четверть сильнее: «Эхо» помнит их карточки." },
  { id: "dc_tries", n: "Чип отмычки глубин", cat: "hack", blk: 7, price: 950, st: { tries: 2 }, desc: "У взлома на две попытки больше." },
  { id: "dc_jam", n: "Чип помех", cat: "hack", blk: 10, price: 1600, st: { mechslow: 1 }, desc: "Машины в шаге от вас вязнут и движутся вдвое медленнее." },
  { id: "dc_backdoor", n: "Чип чёрного хода", cat: "hack", blk: 12, price: 1800, st: { allyk: 1 }, desc: "Перехваченные турели и машины служат вам вдвое дольше." },
  { id: "dc_clot", n: "Чип свёртывания", cat: "med", blk: 6, price: 850, st: { bleedres: 1 }, desc: "Кровотечение проходит вдвое быстрее." },
  { id: "dc_liver", n: "Чип печени Нижних", cat: "med", blk: 9, price: 1200, st: { toxdecay: 1 }, desc: "Токсины выходят сами, понемногу." },
  { id: "dc_marrow", n: "Чип костного мозга", cat: "med", blk: 11, price: 1700, st: { healkill: 0.05 }, desc: "Каждый, кого вы добили оружием, возвращает двадцатую часть здоровья." },
  { id: "dc_soft", n: "Чип мягкого шага", cat: "move", blk: 7, price: 950, st: { quiet: 0.3 }, desc: "Вас слышно на треть хуже." },
  { id: "dc_evade", n: "Чип увёртливости", cat: "move", blk: 10, price: 1600, st: { dodge: 0.08 }, desc: "Тело чаще само уходит от удара." },
  { id: "dc_shade", n: "Чип тени", cat: "move", blk: 14, price: 2200, st: { shade: 1 }, desc: "Импланты движения и скрытности действуют вдвое дольше." },
  { id: "dc_cell", n: "Чип батареи глубин", cat: "energy", blk: 6, price: 1000, st: { enmax: 40 }, desc: "Энергии имплантов на сорок больше." },
  { id: "dc_dynamo", n: "Чип динамо", cat: "energy", blk: 9, price: 1250, st: { enkill: 5 }, desc: "Каждый, кого вы добили оружием, — плюс пять энергии." },
  { id: "dc_coreflow", n: "Чип тока Трещины", cat: "energy", blk: 15, price: 2600, st: { recharge: 0.4 }, desc: "Энергия имплантов восстанавливается на две пятых быстрее." },
  { id: "dc_scrapper", n: "Чип утилизатора", cat: "craft", blk: 8, price: 1200, st: { partfind: 0.4 }, desc: "С машин детали падают на две пятых чаще." },
  { id: "dc_broker", n: "Чип посредника", cat: "craft", blk: 10, price: 1600, st: { sell: 0.25 }, desc: "Скупщики платят на четверть больше." },
  { id: "dc_master", n: "Чип мастера Цехов", cat: "craft", blk: 12, price: 1800, st: { wwear: 0.4 }, desc: "Оружие изнашивается на две пятых медленнее." }
];
DEEP_NEW.concat(DEEP_CHIPS).forEach(function (im) { im.t = tOfBlk(im.blk); im.minL = blockFrom(im.blk); im.deep = im.blk; });
DEEP_NEW.forEach(function (im) { if (!LAB.IMPLANTS.some(function (q) { return q.id === im.id; })) LAB.IMPLANTS.push(im); });
DEEP_CHIPS.forEach(function (im) { im.passive = 1; im.cost = 0; if (!LAB.IMPLANTS.some(function (q) { return q.id === im.id; })) LAB.IMPLANTS.push(im); });
/* ключи чипов глубин: прибавка к прежним (quiet, dodge, sense…) не выводит их за общий потолок — и выше
   сотого уровня, где чипов глубин нет, всё считается по-прежнему */
var DEEP_CAP = { streak: 1.5, bio: 1, mech: 1, boss: 1, first: 1, thorns: 0.8, lastline: 0.6, bleedres: 2, toxdecay: 3, healkill: 0.15, shade: 2, enkill: 15, partfind: 1, wwear: 0.6, allyk: 2, mechslow: 1, quiet: 0.9, recharge: 0.85, dodge: 0.3, sell: 0.8 };
LAB.IMPLANTS.forEach(function (im) { if (!im.cat) im.cat = "energy"; if (!im.t) im.t = 1; im.minL = im.minL || [0, 1, 3, 6, 15][im.t]; });
var DEF = {};
LAB.IMPLANTS.forEach(function (im) { DEF[im.id] = im; });
/* (3.6) снятые импланты прежних версий и чем они стали */
var GONE = { hemostat: "regen" };
function canon(id) { return GONE[id] && DEF[GONE[id]] ? GONE[id] : id; }
for (var gk in GONE) if (!DEF[gk] && DEF[GONE[gk]]) DEF[gk] = DEF[GONE[gk]];
function def(id) { return DEF[id] || LAB.IMPLANTS[0]; }
function isChip(id) { return !!(DEF[id] && DEF[id].passive); }
/* что за действие — для совместимости модификаций */
function tags(id) {
  var d = def(id), fx = d.fx || {}, t = [];
  if (d.passive) return ["passive"];
  if (fx.dmg || fx.k === "arc") t.push("dmg");
  if (fx.r && /^(area|pull|mark|blind|map|heat|weak|traps|secret|turret|siphon|magnet|reso|census|survey|shout|puppet|cordon|hush|discharge|peek)$/.test(fx.k)) t.push("area");
  if (/^(line|cone|arc|lure|ruin|steam|overheat)$/.test(fx.k)) t.push("range");
  if (fx.k === "buff" || fx.freeze || fx.slow || fx.cams || fx.bots || fx.ally || fx.regen || fx.mark || fx.dur || fx.conf || fx.deaf) t.push("dur");
  if (fx.shield || fx.nano || fx.reflect || fx.phase || /^(absorb|ward|cordon)$/.test(fx.k)) t.push("guard");
  if (fx.k === "heal" || /^(convert|purify)$/.test(fx.k)) t.push("heal");
  return t;
}

/* ════════ МОДИФИКАЦИИ ════════
   cat — только для своего направления, tag — для импланта с таким
   действием, need — ступень направления импланта, cost — детали. */
var MODS = {
  eco:       { n: "экономичная", d: "энергии на треть меньше", cost: { chip: 1, relay: 1 } },
  soft:      { n: "щадящая", d: "нервы нагружает вдвое меньше", cost: { chip: 1, gel: 1 } },
  boost:     { n: "форсированная", d: "действует на четверть сильнее, энергии на пятую часть больше", cost: { chip: 1, cell: 1 } },
  twin:      { n: "сдвоенная", d: "каждый четвёртый раз — без затрат энергии", cost: { chip: 1, cap: 2 }, need: 1 },
  reserve:   { n: "резервная", d: "работает и при нейроперегрузке — вдвое дороже", cost: { chip: 2, cell: 1 }, need: 2 },
  quiet:     { n: "тихая", d: "ОКО не замечает применения", cost: { chip: 1, rubber: 1 }, need: 1 },
  resonant:  { n: "отзывчивая", d: "за каждого задетого врага — две энергии обратно", cost: { chip: 1, cap: 1, wire: 1 }, tag: "dmg", need: 1 },
  wide:      { n: "широкая", d: "радиус на шаг больше", cost: { chip: 1, magnet: 1 }, tag: "area", need: 1 },
  long:      { n: "дальнобойная", d: "на три шага дальше", cost: { chip: 1, lens: 1 }, tag: "range", need: 1 },
  lasting:   { n: "продлённая", d: "действует в полтора раза дольше", cost: { chip: 1, cell: 1 }, tag: "dur", need: 1 },
  ap:        { n: "бронебойная", d: "броня врагов удар не гасит", cost: { chip: 1, ceramic: 1 }, cat: "combat", tag: "dmg", need: 1 },
  shock:     { n: "электрическая", d: "урон — разрядом: машины горят", cost: { chip: 1, relay: 1, cap: 1 }, cat: "combat", tag: "dmg", need: 1 },
  thermo:    { n: "термическая", d: "урон — жаром: твари горят", cost: { chip: 1, reagent: 1, ceramic: 1 }, cat: "combat", tag: "dmg", need: 1 },
  cryo:      { n: "криогенная", d: "задетые цепенеют на секунду", cost: { chip: 1, reagent: 2 }, cat: "combat", tag: "dmg", need: 2 },
  chain:     { n: "цепная", d: "удар перескакивает ещё на одного рядом", cost: { chip: 2, wire: 1, relay: 1 }, cat: "combat", tag: "dmg", need: 2 },
  stun:      { n: "оглушающая", d: "задетые замирают на полсекунды", cost: { chip: 1, servo: 1 }, cat: "combat", tag: "dmg", need: 2 },
  bleed:     { n: "рвущая", d: "живые истекают кровью", cost: { chip: 1, scrap: 2 }, cat: "combat", tag: "dmg", need: 3 },
  execute:   { n: "добивающая", d: "по раненым — в полтора раза сильнее", cost: { chip: 2, optic: 1 }, cat: "combat", tag: "dmg", need: 3 },
  mirror:    { n: "зеркальная", d: "пока действует, пятая часть удара уходит обратно", cost: { chip: 1, panel: 1 }, cat: "defense", tag: "guard", need: 1 },
  mending:   { n: "восстанавливающая", d: "ещё и подлечивает пять секунд", cost: { chip: 1, gel: 2 }, cat: "defense", need: 2 },
  grounded:  { n: "заземлённая", d: "пока действует, разряды бьют втрое слабее", cost: { chip: 1, wire: 2 }, cat: "defense", need: 2 },
  tempered:  { n: "закалённая", d: "щит и защита на треть крепче", cost: { chip: 1, panel: 1, ceramic: 1 }, cat: "defense", tag: "guard", need: 3 },
  deep:      { n: "глубинная", d: "на три шага дальше", cost: { chip: 1, lens: 1, optic: 1 }, cat: "sensor", need: 1 },
  marker:    { n: "маркирующая", d: "найденных врагов метит", cost: { chip: 1, optic: 1 }, cat: "sensor", need: 1 },
  mapper:    { n: "картографирующая", d: "всё вокруг — на карту «Эхо»", cost: { chip: 1, lens: 1 }, cat: "sensor", need: 2 },
  analyst:   { n: "аналитическая", d: "называет, чем бить", cost: { chip: 2, optic: 1 }, cat: "sensor", need: 3 },
  ghost:     { n: "бесследная", d: "ОКО не узнаёт о взломе", cost: { chip: 1, relay: 1 }, cat: "hack", need: 1 },
  persist:   { n: "стойкая", d: "взлом держится вдвое дольше", cost: { chip: 2, cell: 1 }, cat: "hack", tag: "dur", need: 2 },
  virus:     { n: "вирусная", d: "перекидывается ещё на одну машину", cost: { chip: 2, relay: 2 }, cat: "hack", need: 3 },
  antisep:   { n: "антисептическая", d: "ещё и останавливает кровь", cost: { gel: 1, reagent: 1 }, cat: "med", need: 1 },
  purge:     { n: "очищающая", d: "ещё и выводит токсины", cost: { reagent: 2 }, cat: "med", need: 1 },
  adren:     { n: "адреналиновая", d: "после лечения — четыре секунды ускорения", cost: { gel: 1, servo: 1 }, cat: "med", need: 2 },
  silent:    { n: "бесшумная", d: "ещё и десять секунд глушит шаги", cost: { rubber: 1, servo: 1 }, cat: "move", need: 1 },
  swift:     { n: "стремительная", d: "дальше и дольше на половину", cost: { servo: 1, magnet: 1 }, cat: "move", need: 2 },
  capacitor: { n: "накопительная", d: "энергии — в полтора раза больше", cost: { cap: 2, cell: 1 }, cat: "energy", need: 1 },
  overclock: { n: "разогнанная", d: "чип работает в полтора раза сильнее, импланты чуть дороже", cost: { chip: 2, cell: 1 }, tag: "passive", need: 2 },
  balanced:  { n: "сбалансированная", d: "чип работает на пятую часть сильнее", cost: { chip: 2, optic: 1 }, tag: "passive", need: 3 }
};
/* (после 4.1) Модификации глубин — одиннадцать, только ниже Истока (deep): нужна ступень направления
   глубин (шестая, восьмая, двенадцатая) и детали Нижних. Выше сотого уровня их нет в списках. */
var DEEP_MODS = {
  vampiric:   { n: "пьющая", d: "десятая часть урона по живым возвращается здоровьем", cost: { chip: 1, dp_nerve: 1, gel: 1 }, cat: "combat", tag: "dmg", need: 6 },
  focused:    { n: "сфокусированная", d: "радиус на шаг меньше, зато удар на две пятых сильнее", cost: { chip: 1, dp_reed: 1 }, tag: "area", need: 6 },
  shielding:  { n: "щитовая", d: "ещё и ставит щит", cost: { chip: 1, dp_alloy: 1, panel: 1 }, cat: "defense", need: 6 },
  numbing:    { n: "обезболивающая", d: "после неё восемь секунд удары берут на треть меньше", cost: { chip: 1, gel: 2, dp_coil: 1 }, cat: "med", need: 6 },
  census:     { n: "перекличная", d: "ещё и считает всех врагов на этаже", cost: { chip: 1, dp_coil: 2 }, cat: "sensor", need: 6 },
  stepping:   { n: "ускользающая", d: "после неё полторы секунды удары проходят сквозь", cost: { chip: 1, servo: 1, dp_reed: 1 }, cat: "move", need: 6 },
  overflow:   { n: "переполненная", d: "энергии тратит на пятую часть меньше, а энергию, что даёт, — в полтора раза больше", cost: { chip: 1, cell: 2, dp_coil: 1 }, cat: "energy", need: 6 },
  echoing:    { n: "отзвучная", d: "через две секунды срабатывает ещё раз, вполсилы и даром", cost: { chip: 2, dp_reed: 2 }, need: 8 },
  network:    { n: "сетевая", d: "достаёт машины на четыре шага дальше и держит их в полтора раза дольше", cost: { chip: 2, dp_coil: 1, dp_nerve: 1 }, cat: "hack", need: 8 },
  tuned:      { n: "настроенная", d: "чип работает на треть сильнее", cost: { chip: 2, dp_reed: 1, dp_nerve: 1 }, tag: "passive", need: 8 },
  weightless: { n: "невесомая", d: "ёмкости занимает на две единицы меньше, нервы нагружает на треть меньше", cost: { chip: 2, dp_nerve: 2, supercond: 1 }, need: 12 }
};
for (var dmk in DEEP_MODS) if (!MODS[dmk]) { DEEP_MODS[dmk].deep = 1; MODS[dmk] = DEEP_MODS[dmk]; }
var MOD_ORDER = Object.keys(MODS);

/* ════════ КИБЕРНЕТИКА: ОПЫТ И СТУПЕНИ ════════ */
/* (после 4.1) ступени глубин: направление — до пятнадцатой, общая — до двадцатой. Каждая следующая
   открывается следующим глубоким блоком (VI — шестая и одиннадцатая … XV — пятнадцатая и двадцатая);
   выше сотого уровня пределы прежние — пятая и десятая, и числа те же. */
var CAT_XP = [0, 30, 90, 190, 340, 550, 800, 1090, 1420, 1790, 2200, 2650, 3140, 3670, 4240, 4850];
var ALL_XP = [0, 40, 110, 220, 380, 600, 880, 1250, 1700, 2300, 2900, 3600, 4400, 5300, 6300, 7400, 8600, 9900, 11300, 12800];
var XP = { install: 12, calib: 15, mod: 10, craft: 20, dismantle: 6, extract: 4, use: 2 };
function cy() { var g = G(); if (!g.cyber) g.cyber = { xp: {} }; if (!g.cyber.xp) g.cyber.xp = {}; return g.cyber; }
function catXp(c) { return cy().xp[c] || 0; }
/* самая большая глубина, где вы были (кэш в записи кибернетики; прежние записи — по maxF) */
function reachL() { var g = G(); if (!g) return 1; var c = cy(); if (c.deepL == null) { var m = 1; if (g.maxF) for (var k in g.maxF) if (+k > m) m = +k; c.deepL = m; } if ((g.L || 1) > c.deepL) c.deepL = g.L || 1; return c.deepL; }
/* сколько глубоких блоков открыто: 0 — выше Истока, 1 — Полигон … 10 — Основание */
function deepStep() { var L = reachL(); return L > 100 ? Math.max(1, Math.min(10, blockAt(L) - 5)) : 0; }
function catCap() { return 5 + deepStep(); }
function lvlCap() { return 10 + deepStep(); }
/* опыт ниже Истока весомее: каждый глубокий блок — плюс четверть (выше сотого — как прежде) */
function xpK() { var g = G(), L = g ? g.L || 1 : 1; return L > 100 ? 1 + 0.25 * Math.max(1, blockAt(L) - 5) : 1; }
function catLv(c) { var x = catXp(c), n = 0, top = catCap(); for (var i = 1; i < CAT_XP.length && i <= top; i++) if (x >= CAT_XP[i]) n = i; return n; }
function totalXp() { var s = 0, x = cy().xp; for (var k in x) s += x[k] || 0; return s; }
function level() { var x = totalXp(), n = 1, top = lvlCap(); for (var i = 1; i < ALL_XP.length && i < top; i++) if (x >= ALL_XP[i]) n = i + 1; return n; }
/* (3.5) опыт за сборку, вживление, извлечение и разбор — один раз на каждый чип (key):
   прежде «собрать — разобрать» и «вживить — извлечь» качали кибернетику без конца */
function once(key) { var s = cy().once || (cy().once = {}); if (s[key]) return false; s[key] = 1; return true; }
function gain(c, how, key) {
  var n = Math.round((XP[how] || 0) * xpK()), before = catLv(c), lb = level();
  if (!n || !CATS[c]) return;
  if (key && !once(how + ":" + key)) return;
  cy().xp[c] = catXp(c) + n;
  var after = catLv(c), la = level();
  if (after > before) gm().later(function () { A("play", "ui_levelup"); LAB.say("Кибернетика, " + CATS[c].n + ": ступень " + after + ". " + catPerk(after), { interrupt: false }); }, 600);
  if (la > lb) { applyStatic(); gm().later(function () { A("play", "ui_levelup"); LAB.say("Кибернетика: общая ступень " + la + ". " + allPerk(la), { interrupt: false }); }, 1400); }
}
function catPerk(n) {
  return ["", "Импланты направления сильнее и дешевле, открыты его модификации и сборка чипов второй ступени сложности.",
    "Ещё сильнее; модификации второго круга, сборка чипов третьей ступени сложности.",
    "Модификации третьего круга, сборка самых сложных чипов направления.",
    "Иногда — без затрат энергии.", "Радиус — на шаг шире.",
    /* (после 4.1) ступени глубин */
    "Схемы глубин: сборка имплантов и чипов направления пятого класса, модификации глубин первого круга.",
    "Без затрат энергии — чаще: каждое четвёртое применение.",
    "Сборка шестого класса; модификации глубин второго круга.",
    "Ещё шаг: радиус и дальность имплантов направления — на шаг больше.",
    "Сборка седьмого класса; нервы от имплантов направления — на треть легче.",
    "Действие имплантов направления — на четверть дольше.",
    "Сборка восьмого класса; модификации глубин третьего круга.",
    "Отклик: каждое применение возвращает три энергии.",
    "Ещё шаг: радиус и дальность — ещё на шаг больше.",
    "Мастер направления: импланты направления на пятую часть сильнее, чипы — на десятую."][n] || "";
}
function slots() { return 2 + Math.floor(level() / 2); }
function capacity() { return 6 + 2 * level(); }
function modSlots() { var l = level(); return l >= 17 ? 5 : l >= 13 ? 4 : l >= 8 ? 3 : l >= 4 ? 2 : 1; }
function maxGrade() { var l = level(); return l >= 16 ? 5 : l >= 12 ? 4 : l >= 5 ? 3 : l >= 2 ? 2 : 1; }
/* ступень калибровки и с какой общей ступени она доступна */
var GRADE_NEED = [0, 0, 2, 5, 12, 16];
function selfSurgery() { return level() >= 6; }
function allPerk(n) {
  var s = [];
  if (n % 2 === 0) s.push("нейрогнёзд для чипов — " + slots());
  s.push("ёмкость имплантов — " + capacity());
  if (n === 2) s.push("калибровка до второй ступени");
  if (n === 4) s.push("по две модификации на имплант");
  if (n === 5) s.push("калибровка до третьей ступени");
  if (n === 6) s.push("извлекать импланты можно самому, без верстака");
  if (n === 8) s.push("по три модификации на имплант");
  if (n === 10) s.push("нейроархитектор: все импланты экономнее и легче для нервов");
  /* (после 4.1) общие ступени глубин */
  if (n === 11) s.push("запас энергии имплантов — плюс десять");
  if (n === 12) s.push("калибровка до четвёртой ступени");
  if (n === 13) s.push("по четыре модификации на имплант");
  if (n === 14) s.push("энергия восстанавливается на пятую часть быстрее");
  if (n === 15) s.push("нейроархитектор глубин: нервы нагружаются ещё на пятую часть меньше");
  if (n === 16) s.push("калибровка до пятой ступени");
  if (n === 17) s.push("по пять модификаций на имплант");
  if (n === 18) s.push("запас энергии — ещё плюс двадцать");
  if (n === 19) s.push("все импланты ещё на десятую часть экономнее");
  if (n === 20) s.push("архитектор Разлома: все импланты на десятую часть сильнее");
  return cap1(s.join(", ")) + ".";
}
function load(id) { var d = def(id); return d.core || d.passive ? 0 : Math.max(1, d.t - (has(id, "weightless") ? 2 : 0)); }
function usedCap() { return G().implants.reduce(function (a, id) { return a + load(id); }, 0); }
function chipsIn() { return G().implants.filter(isChip).length; }
/* (3.6) вживлённых имплантов (без системных «Эхо» и без чипов) — игрок их и считает */
function actIn() { return G().implants.filter(function (id) { return !isChip(id) && !def(id).core; }).length; }
/* (3.7, нелогичность) встроенные в «Эхо» (сканер, эхолокация) — отдельно, и одними словами в инвентаре и в
   «Кибернетике»: прежде в инвентаре «Импланты: 2» (все вместе), а в «Кибернетике» «Имплантов вживлено: 0» */
function coreList() { return G().implants.filter(function (id) { return def(id).core; }); }
function coreIn() { return coreList().length; }
function countText() { var c = coreIn(), p = chipsIn(); return "вживлено " + actIn() + (c ? ", встроенных в «Эхо» " + c : "") + (p ? ", чипов " + p : ""); }

/* ════════ СТУПЕНЬ ИМПЛАНТА И МОДИФИКАЦИИ ════════ */
var PW = [1, 1.35, 1.75, 2.2, 2.7], EK = [1, 0.9, 0.8, 0.72, 0.65]; /* (после 4.1) четвёртая и пятая ступени — ниже Истока */
function lv(id) { var g = G(); return (g.impLv && g.impLv[id]) || 1; }
function mods(id) { var g = G(), m = g.impMod && g.impMod[id]; if (!m) return []; if (typeof m === "string") m = g.impMod[id] = [m]; return m; }
function has(id, m) { return mods(id).indexOf(m) >= 0; }
function installed(id) { return G().implants.indexOf(id) >= 0; }
/* сила импланта: ступень, направление, модификации */
function power(id) { var c = catLv(def(id).cat); return PW[lv(id) - 1] * (1 + 0.06 * c) * (has(id, "boost") ? 1.25 : 1) * (c >= 15 ? 1.2 : 1) * (level() >= 20 ? 1.1 : 1) * (echoK || 1); }
function costK(id) {
  var c = catLv(def(id).cat), k = EK[lv(id) - 1] * (1 - 0.04 * Math.min(5, c) - 0.02 * Math.max(0, c - 5)); /* (после 4.1) ступени глубин — по две сотых */
  if (has(id, "eco")) k *= 0.67;
  if (has(id, "boost")) k *= 1.2;
  if (G().implants.some(function (q) { return has(q, "overclock"); })) k *= 1.05;
  k *= 1 - stat("econ");
  if (level() >= 10) k *= 0.85;
  if (level() >= 19) k *= 0.9;
  if (has(id, "overflow")) k *= 0.8;
  return k;
}
function neuroK(id) { var k = has(id, "soft") ? 0.5 : 1; k *= 1 - stat("buffer"); if (level() >= 10) k *= 0.75; if (level() >= 15) k *= 0.8; if (catLv(def(id).cat) >= 10) k *= 0.67; if (has(id, "weightless")) k *= 0.67; return k; }
function reach(id) { var c = catLv(def(id).cat); return (lv(id) >= 3 ? 1 : 0) + (c >= 5 ? 1 : 0) + (c >= 9 ? 1 : 0) + (c >= 14 ? 1 : 0) + (lv(id) >= 5 ? 1 : 0); }
function compat(id, m) {
  var M = MODS[m], d = def(id), t = tags(id);
  if (!M) return "такой модификации нет";
  if (d.passive ? M.tag !== "passive" : M.tag === "passive") return d.passive ? "чипу подходят только «разогнанная» и «сбалансированная»" : "это модификация для чипов";
  if (M.cat && M.cat !== d.cat) return "только для направления «" + CATS[M.cat].n + "»";
  if (M.tag && M.tag !== "passive" && t.indexOf(M.tag) < 0) return "этому импланту она ни к чему";
  if (!d.passive && !d.fx && ["eco", "soft", "boost", "twin", "reserve", "quiet", "deep", "marker", "mapper", "analyst"].indexOf(m) < 0) return "этому импланту она ни к чему";
  /* (3.6) то, что имплант и так делает, модификацией не удвоить */
  var fx0 = d.fx || {};
  if ((m === "antisep" && fx0.bleed) || (m === "purge" && fx0.tox) || (m === "adren" && fx0.haste) || (m === "mending" && fx0.regen)) return "имплант делает это и без неё";
  /* (после 4.1) модификации глубин: отзвучная — тому, что бьёт или лечит; сфокусированная — удару по площади;
     невесомая — тому, что занимает ёмкость */
  if (m === "echoing" && t.indexOf("dmg") < 0 && t.indexOf("heal") < 0) return "этому импланту она ни к чему";
  if (m === "focused" && !fx0.dmg) return "этому импланту она ни к чему";
  if (m === "weightless" && (d.core || d.passive)) return "этому импланту она ни к чему";
  if ((M.need || 0) > catLv(d.cat)) return "нужна кибернетика «" + CATS[d.cat].n + "» ступени " + M.need;
  if (has(id, m)) return "уже стоит";
  if (mods(id).length >= modSlots()) return "все гнёзда модификаций заняты: " + modSlots() + " из " + modSlots();
  return "";
}

/* ════════ ПАССИВНОЕ: ЧТО ДАЮТ ЧИПЫ ════════ */
function stat(key) {
  var g = G(); if (!g || !g.implants) return 0;
  var s = 0, sd = 0;
  g.implants.forEach(function (id) {
    var d = DEF[id]; if (!d || !d.passive || !d.st || d.st[key] == null) return;
    var k = PW[lv(id) - 1] * (has(id, "overclock") ? 1.5 : 1) * (has(id, "balanced") ? 1.2 : 1) * (has(id, "tuned") ? 1.33 : 1) * (catLv(d.cat) >= 15 ? 1.1 : 1);
    if (d.deep) sd += d.st[key] * k; else s += d.st[key] * k;
  });
  if (key === "econ" || key === "buffer") s = Math.min(0.6, s);
  if (key === "dodge") s = Math.min(0.3, s);
  /* (после 4.1) общие ступени и действия глубин, что работают как чип */
  var st = g.st || {}, l = level();
  if (key === "recharge" && l >= 14) sd += 0.2;
  if (key === "enmax") sd += (l >= 11 ? 10 : 0) + (l >= 18 ? 20 : 0);
  if (key === "sell" && st.haggleT > 0) sd += 0.25;
  if (key === "acc" && st.chemAccT > 0) sd += 0.12;
  if (key === "recharge" && LAB.chem && LAB.chem.rank && LAB.chem.rank("energy") >= 5) sd += 0.25;
  if (sd) s = DEEP_CAP[key] != null ? Math.min(Math.max(s, DEEP_CAP[key]), s + sd) : s + sd;
  return s;
}
/* здоровье и энергия от чипов: прибавка пересчитывается при вживлении и извлечении */
function applyStatic() {
  var g = G(); if (!g) return;
  var hp = Math.round((g.hpMax - (g.chipHp || 0)) * stat("hpmax")), en = Math.round(stat("enmax"));
  var dh = hp - (g.chipHp || 0), de = en - (g.chipEn || 0);
  /* (3.5) прибавка уходит так же, как пришла: прежде вживление добавляло здоровье и
     энергию, а извлечение их не забирало — «вживить и извлечь» лечило */
  if (dh) { g.hpMax += dh; g.hp = Math.max(1, Math.min(g.hpMax, g.hp + dh)); g.chipHp = hp; }
  if (de) { g.enMax += de; g.en = Math.max(0, Math.min(g.enMax, g.en + de)); g.chipEn = en; }
}
/* множитель урона оружия: чипы, разгон, добивание */
function dmgK(f) {
  var g = G(), k = 1 + stat("dmg");
  if (g.st && g.st.overT > 0) k *= 1.4;
  if (f && f.maxhp && f.hp / f.maxhp < 0.3) k *= 1 + stat("exec");
  /* (после 4.1) чипы глубин: по живым, по машинам, по стражам, по не преследующим, счёт попаданий */
  if (f) {
    k *= 1 + (f.kind === "bio" ? stat("bio") : f.kind === "mech" ? stat("mech") : 0);
    if (f.boss) k *= 1 + stat("boss");
    if (f.state !== "hunt") k *= 1 + stat("first");
    var sk = stat("streak");
    if (sk) { if (streak.f === f.id) streak.n++; else { streak.f = f.id; streak.n = 1; } if (streak.n % 3 === 0) k *= 1 + sk; }
  }
  return k;
}
var streak = { f: null, n: 0 };

/* ════════ ДЕЙСТВИЕ ИМПЛАНТОВ ════════ */
/* los — (3.7, нелогичность) удар по площади (дробь, жар, импульс, холод, узел тяжести, сифон) не проходит
   сквозь стену и закрытую дверь, как взрывы врагов; сенсоры (метка, термозрение, анализатор) — как прежде */
function foesNear(r, kind, los) {
  var g = G(), C = LAB.combat; if (!C) return [];
  return C.foes().filter(function (f) {
    if (f.dead || f.calm || f.ally || f.burrowed) return false;
    if (kind && f.kind !== kind) return false;
    if (Math.max(Math.abs(f.x - g.x), Math.abs(f.y - g.y)) > r) return false;
    return !los || LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y);
  });
}
function secW(n) { return n + " " + pl(n, "секунду", "секунды", "секунд"); }
/* параметры применения: сила, радиус, дальность, длительность, вид урона */
function params(id) {
  var d = def(id), fx = d.fx || {}, L = G().L, k = power(id), rx = reach(id), p = {};
  p.k = k;
  p.dmg = fx.dmg ? Math.round((fx.dmg + (fx.perL || 0) * LAB.Le(L)) * k * (has(id, "focused") ? 1.4 : 1)) : 0;
  p.r = (fx.r || 0) + rx + (has(id, "wide") ? 1 : 0) + (has(id, "deep") ? 3 : 0) + (d.cat === "sensor" ? Math.round(stat("sense")) : 0) + (has(id, "network") ? 4 : 0);
  if (has(id, "focused")) p.r = Math.max(1, p.r - 1);
  p.rng = (fx.rng || 0) + rx * 2 + (has(id, "long") ? 3 : 0) + (has(id, "swift") ? 2 : 0);
  p.dur = (has(id, "lasting") ? 1.5 : 1) * (has(id, "swift") ? 1.5 : 1) * (has(id, "persist") ? 2 : 1) * (has(id, "network") ? 1.5 : 1) *
    (catLv(d.cat) >= 11 ? 1.25 : 1) * (d.cat === "move" ? 1 + stat("shade") : 1); /* (после 4.1) ступень глубин и чип тени */
  p.dt = has(id, "shock") ? "emp" : has(id, "thermo") ? "thermo" : fx.dt || "kinetic";
  p.noarmor = !!(fx.noarmor || has(id, "ap"));
  return p;
}
/* сканер «Эхо» (combat.js) спрашивает радиус и что ещё сделать */
function scanR(id) { return 8 + 2 * (lv(id) - 1) + (has(id, "deep") ? 3 : 0) + Math.round(stat("sense")); }
var hits = 0;
function hit(id, f, dmg, p) {
  var C = LAB.combat;
  if (!f || f.dead) return;
  if (C.unhide) C.unhide("Удар импланта выдал вас: укрытия больше нет."); /* (3.5) нападение из укрытия — как выстрел */
  if (has(id, "execute") && f.maxhp && f.hp / f.maxhp < 0.4) dmg = Math.round(dmg * 1.5);
  var hp0 = f.hp;
  C.damageFoe(f, dmg, p.dt, { noarmor: p.noarmor, quiet: true });
  hits++;
  /* (после 4.1) пьющая: десятая часть урона по живому — здоровьем (за одно применение — не больше четверти) */
  if (has(id, "vampiric") && f.kind === "bio" && hp0 > f.hp) vamp += (hp0 - Math.max(0, f.hp)) * 0.1;
  if (f.dead) return;
  if (has(id, "cryo")) f.frozen = Math.max(f.frozen || 0, 2);
  if (has(id, "stun")) f.frozen = Math.max(f.frozen || 0, 1);
  if (has(id, "bleed") && f.kind === "bio") f.bleedT = Math.max(f.bleedT || 0, 6);
  if (has(id, "marker")) f.markT = Math.max(f.markT || 0, 30);
}
var vamp = 0, echoK = 0;
function near3(f0, done) {
  return LAB.combat.foes().filter(function (q) { return !q.dead && !q.calm && !q.ally && done.indexOf(q) < 0 && Math.max(Math.abs(q.x - f0.x), Math.abs(q.y - f0.y)) <= 3; })[0];
}
function lineFoes(rng, cone) {
  var g = G(), v = LAB.DIRS[g.face] || LAB.DIRS.N, out = [];
  LAB.combat.foes().forEach(function (f) {
    if (f.dead || f.calm || f.ally) return;
    var dx = f.x - g.x, dy = f.y - g.y, along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
    if (along < 1 || along > rng || perp > (cone ? Math.ceil(along / 2) : 0)) return;
    if (!LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y)) return;
    out.push(f);
  });
  return out;
}
function dirOf(f) { return gm().relDir ? gm().relDir(f.x, f.y) : ""; }
function fname(f) { return String(f.name || "").split(",")[0]; }
function free(x, y) { return gm().passable(x, y) && !LAB.combat.foes().some(function (q) { return !q.dead && q.x === x && q.y === y; }) && !(G().x === x && G().y === y); }
function healFx(id, fx, p) {
  var g = G(), b = g.body || {}, st = g.st, out = [];
  if (fx.hp) { var hp0 = g.hp; g.hp = Math.min(g.hpMax, g.hp + Math.round((fx.hp + (fx.perL || 0) * LAB.Le(g.L)) * p.k)); if (g.hp > hp0) out.push("здоровье плюс " + (g.hp - hp0) + ", теперь " + g.hp); }
  if ((fx.bleed || has(id, "antisep")) && st.bleed > 0) { st.bleed = 0; out.push("кровь остановлена"); }
  if (fx.poison && st.poison > 0) { st.poison = 0; out.push("яд вышел"); }
  if ((fx.tox || has(id, "purge")) && b.tox > 0) { b.tox = Math.max(0, b.tox - Math.round((fx.tox || 30) * p.k)); out.push("токсины " + Math.round(b.tox)); }
  if (fx.unslow) { st.slow = 0; st.web = 0; }
  if (fx.neuro) { b.neuro = Math.max(0, (b.neuro || 0) - Math.round(fx.neuro * p.k)); out.push("нейронагрузка " + Math.round(b.neuro)); }
  if (fx.rad && b.rad > 0) { b.rad = Math.max(0, b.rad - Math.round(fx.rad * p.k)); out.push("облучение " + Math.round(b.rad)); }
  if (fx.wake) b.wake = Math.min(100, (b.wake || 0) + fx.wake);
  if (fx.haste || has(id, "adren")) { st.haste = Math.max(st.haste || 0, Math.round((fx.haste || 8) * p.dur)); out.push("ускорение"); }
  if (fx.regen || has(id, "mending")) { st.regenT = Math.max(st.regenT || 0, Math.round((fx.regen || 10) * p.dur)); st.regenHp = Math.max(1, Math.round(p.k * 2)); out.push("и ещё подлечит"); }
  return out.length ? cap1(out.join(", ")) + "." : "Помогать было нечему.";
}
function run(id) {
  var g = G(), d = def(id), fx = d.fx || {}, p = params(id), C = LAB.combat, st = g.st, t = "", list;
  hits = 0; vamp = 0;
  switch (fx.k) {
    case "heal": t = d.n + ". " + healFx(id, fx, p); break;
    case "area":
      list = foesNear(p.r, fx.kind, true);
      list.forEach(function (f) {
        if (fx.unshield) f.shield = 0;
        if (p.dmg) hit(id, f, p.dmg, p);
        if (fx.freeze && !f.dead && !f.boss) f.frozen = Math.max(f.frozen || 0, Math.round(fx.freeze * p.k * p.dur));
        if (has(id, "chain") && !f.dead) { var nx0 = near3(f, list); if (nx0) hit(id, nx0, Math.round(p.dmg * 0.6), p); }
      });
      t = d.n + ". " + (fx.freeze && !p.dmg ? "Заморожено" : "Задето") + ": " + list.length + ".";
      break;
    case "line": case "cone":
      list = lineFoes(p.rng, fx.k === "cone");
      list.forEach(function (f) {
        hit(id, f, p.dmg, p);
        if (has(id, "chain") && !f.dead) { var nx1 = near3(f, list); if (nx1) hit(id, nx1, Math.round(p.dmg * 0.6), p); }
        if (fx.push && !f.dead && !f.boss) { var v = LAB.DIRS[g.face], px = f.x + v[0], py = f.y + v[1]; if (free(px, py)) { f.x = px; f.y = py; } }
      });
      t = d.n + " " + (LAB.DIRTO[g.face] || "") + ". Задето: " + list.length + ".";
      break;
    case "arc": {
      list = foesNear(p.rng).filter(function (f) { return LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y); })
        .sort(function (a, b) { return Math.abs(a.x - g.x) + Math.abs(a.y - g.y) - Math.abs(b.x - g.x) - Math.abs(b.y - g.y); });
      if (!list.length) { t = d.n + ": разряду не за что зацепиться."; break; }
      var done = [list[0]], f0 = list[0];
      hit(id, f0, p.dmg, p);
      for (var j = 0; j < (fx.jumps || 0) + (has(id, "chain") ? 1 : 0); j++) {
        var nx2 = near3(f0, done);
        if (!nx2) break;
        done.push(nx2); hit(id, nx2, Math.round(p.dmg * 0.7), p); f0 = nx2;
      }
      t = d.n + ": разряд " + dirOf(list[0]) + ", задето: " + done.length + ".";
      break;
    }
    case "pull":
      list = foesNear(p.r, null, true);
      list.forEach(function (f) {
        if (!f.boss) { var px2 = f.x + Math.sign(g.x - f.x), py2 = f.y + Math.sign(g.y - f.y); if (free(px2, py2)) { f.x = px2; f.y = py2; } f.slowT = Math.max(f.slowT || 0, Math.round(fx.slow * p.dur)); }
        if (p.dmg) hit(id, f, p.dmg, p);
      });
      t = d.n + ": стянуто и увязло — " + list.length + ".";
      break;
    case "mark":
      list = foesNear(p.r);
      list.forEach(function (f) { f.markT = Math.max(f.markT || 0, Math.round(fx.mark * p.dur)); f.mark = Date.now() + 45000; });
      t = d.n + ": помечено " + list.length + (list.length ? ". " + list.slice(0, 5).map(function (f) { return fname(f) + " " + dirOf(f); }).join("; ") : "") + ".";
      break;
    case "heat":
      list = foesNear(p.r, "bio");
      if (has(id, "marker")) list.forEach(function (f) { f.markT = Math.max(f.markT || 0, 30); });
      t = list.length ? d.n + ": тепло живого — " + list.slice(0, 6).map(function (f) { return fname(f) + " " + dirOf(f); }).join("; ") + "." : d.n + ": тёплых тел рядом нет.";
      break;
    case "weak":
      list = foesNear(p.r);
      list.forEach(function (f) { f.markT = Math.max(f.markT || 0, Math.round(fx.mark * p.dur)); });
      t = list.length ? d.n + ": " + list.slice(0, 4).map(function (f) { return fname(f) + " — " + weakText(f); }).join("; ") + "." : d.n + ": врагов рядом нет.";
      break;
    case "traps": {
      var tt = LAB.traps && LAB.traps.scanText ? LAB.traps.scanText(p.r) : "";
      var tc = LAB.stash ? LAB.stash.scanText(p.r) : "";
      t = d.n + ": " + ((tt + (tt && tc ? " " : "") + tc) || "ловушек и мин рядом нет.");
      break;
    }
    case "secret": {
      var sec = gm().nearSecret ? gm().nearSecret(p.r) : null, its = gm().floorItems().filter(function (it) { return Math.abs(it.x - g.x) + Math.abs(it.y - g.y) <= p.r; });
      t = d.n + ": " + (sec ? "пустота за стеной " + LAB.DIRN[sec.dir] + " — тайник. " : "тайников рядом нет. ") + (its.length ? "Вещи: " + its.slice(0, 5).map(function (it) { return gm().itemName(it) + " " + gm().relDir(it.x, it.y); }).join(", ") + "." : "");
      break;
    }
    case "map": {
      mapAround(p.r);
      t = d.n + ": «Эхо» запомнило всё в " + p.r + " шагах вокруг — навигатор знает это место.";
      break;
    }
    case "blind": {
      var cams = 0, bots = 0, extra = has(id, "virus") ? 1 : 0;
      C.foes().forEach(function (f) {
        if (f.dead || f.kind !== "mech" || Math.max(Math.abs(f.x - g.x), Math.abs(f.y - g.y)) > p.r + (extra && bots ? 3 : 0)) return;
        var cam = C.isCam ? C.isCam(f) : (f.base && f.base.beh || []).indexOf("camera") >= 0;
        if (cam && fx.cams) { f.blindT = Math.max(f.blindT || 0, Math.round(fx.cams * p.dur)); cams++; }
        else if (!cam && fx.bots) { f.blindT = Math.max(f.blindT || 0, Math.round(fx.bots * p.dur)); if (f.state === "hunt") { f.state = "alert"; f.lost = 0; } if (fx.forget) f.lastKnown = null; bots++; }
      });
      t = d.n + "." + (cams ? " Камер ослеплено: " + cams + "." : "") + (bots ? " Машин потеряло вас: " + bots + "." : "") + (!cams && !bots ? " Машин рядом нет." : "");
      break;
    }
    case "lure": {
      var v2 = LAB.DIRS[g.face] || LAB.DIRS.N, lx = g.x, ly = g.y;
      for (var s2 = 0; s2 < p.rng; s2++) { if (!gm().passable(lx + v2[0], ly + v2[1])) break; lx += v2[0]; ly += v2[1]; }
      /* (3.7, нелогичность) ложный сигнал — для машин, и идут на него только подвижные, не обезвреженные
         и не мирные (combat.js, signalLure): прежде в счёт шли турели и камеры, а на «сигнал» сбегались
         и твари (шумовая приманка) — теперь звенит только сам сигнал */
      A("noiseLure", lx, ly);
      list = C.signalLure ? C.signalLure(lx, ly, Math.round(20 * p.dur)) : [];
      t = d.n + ": ваш сигнал — " + (LAB.DIRTO[g.face] || "впереди") + ". " + (list.length ? "Машин пошло туда: " + list.length + "." : "Ни одна машина рядом на него не пошла.");
      break;
    }
    case "turret": {
      list = C.foes().filter(function (f) { return !f.dead && !f.ally && C.isTurret && C.isTurret(f) && Math.max(Math.abs(f.x - g.x), Math.abs(f.y - g.y)) <= p.r; })
        .sort(function (a, b) { return Math.abs(a.x - g.x) + Math.abs(a.y - g.y) - Math.abs(b.x - g.x) - Math.abs(b.y - g.y); }).slice(0, has(id, "virus") ? 2 : 1);
      list.forEach(function (f) { f.ally = true; f.allyT = Math.round(fx.ally * p.dur * (1 + stat("allyk"))); f.hackT = 1; }); /* (после 4.1) чип чёрного хода — дольше */
      t = list.length ? d.n + ": турель " + dirOf(list[0]) + " — на вашей стороне" + (list.length > 1 ? ", и ещё одна" : "") + "." : d.n + ": турелей рядом нет.";
      break;
    }
    case "buff": {
      var parts = [];
      if (fx.shield) { st.shield = Math.max(st.shield || 0, Math.round((fx.shield + (fx.perL || 0) * LAB.Le(g.L)) * p.k * (has(id, "tempered") ? 1.3 : 1))); st.shieldT = Math.round(30 * p.dur); parts.push("щит " + st.shield); }
      if (fx.nano) { st.nano = Math.round((fx.nano + (fx.perL || 0) * LAB.Le(g.L)) * p.k * (has(id, "tempered") ? 1.3 : 1)); st.nanoT = Math.round(24 * p.dur); parts.push("защита плюс " + st.nano + " на " + secW(Math.round(st.nanoT / 2))); }
      if (fx.reflect) { st.reflectT = Math.round(fx.reflect * p.dur); parts.push(secW(Math.round(st.reflectT / 2)) + " удар отражается"); }
      if (fx.phase) { st.phaseT = Math.round(fx.phase * p.dur); parts.push(secW(Math.round(st.phaseT / 2)) + " вне фазы"); }
      if (fx.haste) { st.haste = Math.round(fx.haste * p.k * p.dur); parts.push("ускорение на " + secW(Math.round(st.haste / 2))); }
      if (fx.cloak) { st.cloak = Math.round(fx.cloak * p.k * p.dur); C.foes().forEach(function (f) { if (f.state === "hunt") { f.state = "alert"; f.aim = false; } }); parts.push(secW(Math.round(st.cloak / 2)) + " вас не видят"); }
      if (fx.over) { st.overT = Math.round(fx.over * p.dur); parts.push("оружие сильнее на " + secW(Math.round(st.overT / 2))); }
      if (fx.mute) { st.muteT = Math.round(fx.mute * p.dur); parts.push("шаги не слышны " + secW(Math.round(st.muteT / 2))); }
      if (fx.mimic) { st.mimicT = Math.round(fx.mimic * p.dur); C.foes().forEach(function (f) { if (f.kind === "mech" && f.state === "hunt") { f.state = "alert"; f.lastKnown = null; } }); parts.push(secW(Math.round(st.mimicT / 2)) + " машины принимают вас за свою"); }
      if (has(id, "mirror")) st.mirrorT = Math.round(20 * p.dur);
      if (has(id, "grounded")) st.groundT = Math.round(20 * p.dur);
      if (has(id, "mending")) { st.regenT = Math.max(st.regenT || 0, 10); st.regenHp = Math.max(1, Math.round(p.k * 2)); }
      t = d.n + ": " + parts.join(", ") + ".";
      break;
    }
    case "dash": {
      /* (проверка перед сборкой) рывок включают из окна имплантов, а шаг при открытом окне не
         делается — окна закрываются, иначе рывок не срабатывал никогда */
      if (LAB.ui && LAB.ui.closeAll) LAB.ui.closeAll();
      var steps = (fx.steps || 3) + (has(id, "swift") ? 2 : 0), moved = 0;
      for (var q = 0; q < steps; q++) { if (gm().tryMove(g.face, false)) moved++; else break; }
      t = moved ? d.n + ": " + LAB.stepsW(moved) + " " + (LAB.DIRTO[g.face] || "") + "." : d.n + ": впереди не пройти.";
      break;
    }
    case "siphon": {
      list = foesNear(p.r, "mech", true);
      list.forEach(function (f) { hit(id, f, p.dmg, p); });
      var en = Math.round(list.length * (fx.en || 6) * p.k * (has(id, "capacitor") ? 1.5 : 1));
      g.en = Math.min(g.enMax, g.en + en);
      t = d.n + ": " + (list.length ? "заряд вытянут из машин: " + list.length + ", энергия плюс " + en + ", теперь " + g.en : "машин рядом нет") + ".";
      break;
    }
    case "magnet": {
      var got = gm().floorItems().filter(function (it) { return Math.abs(it.x - g.x) + Math.abs(it.y - g.y) <= p.r && LAB.los(CUR().fl, CUR().fs, g.x, g.y, it.x, it.y); });
      got.forEach(function (it) { it.x = g.x; it.y = g.y; });
      if (got.length) { A("play", "tk_pull"); gm().autoPickup(); }
      t = got.length ? "" : d.n + ": вещей рядом нет.";
      break;
    }
    default: t = deepRun(id, d, fx, p) || d.n + " работает.";
  }
  if (has(id, "silent")) st.muteT = Math.max(st.muteT || 0, 20);
  t += deepAfter(id, d, p);
  if (has(id, "mapper") && fx.k !== "map") mapAround(p.r || 8);
  if (has(id, "resonant") && hits) { var back = Math.min(10, hits * 2); g.en = Math.min(g.enMax, g.en + back); t += " Энергия обратно: " + back + "."; }
  if (t) say(echoK ? "Отзвук. " + t : t); /* (после 4.1) отзвучная модификация повторяет вполсилы */
}
function mapAround(r) {
  var g = G(), seen = CUR().seen, W = LAB.W;
  if (!seen) return;
  for (var yy = g.y - r; yy <= g.y + r; yy++) for (var xx = g.x - r; xx <= g.x + r; xx++) if (LAB.inb(xx, yy)) seen[yy * W + xx] = 1;
}
/* (3.7, нелогичность) чем бить — по стойкостям самого врага (combat.js, weakness: природа, его res и экран),
   а не по одной природе: прежде каждому роботу советовались ЭМИ и ионы, даже тем, кого они почти не берут */
function weakText(f) {
  var w = LAB.combat && LAB.combat.weakness ? LAB.combat.weakness(f.base || f, f) : { bestN: [], worstN: [] };
  return (w.bestN.length ? "бить: " + w.bestN.join(", ") : "особых слабостей нет") + (w.worstN.length ? "; почти не берут: " + w.worstN.slice(0, 2).join(", ") : "");
}
/* сканер с «аналитической» и «маркирующей» модификацией */
function scanExtra(id, list) {
  var out = "";
  if (has(id, "marker")) list.forEach(function (f) { f.markT = Math.max(f.markT || 0, 30); });
  if (has(id, "analyst") && list.length) out = " Чем бить: " + list.slice(0, 3).map(function (f) { return fname(f) + " — " + weakText(f); }).join("; ") + ".";
  if (has(id, "mapper")) mapAround(scanR(id));
  return out;
}
/* После применения: опыт направления; сдвоенная и мастерство — энергия назад. */
function used(id, cost) {
  var d = def(id), g = G(), c = catLv(d.cat);
  gain(d.cat, "use");
  var back = (has(id, "twin") && Math.random() < 0.25) || (c >= 4 && Math.random() < (c >= 7 ? 0.25 : 0.15));
  if (back && cost) { g.en = Math.min(g.enMax, g.en + cost); LAB.say("Энергия не потрачена.", { interrupt: false }); }
  /* (после 4.1) отклик тринадцатой ступени и отзвучная модификация */
  if (c >= 13 && !back) g.en = Math.min(g.enMax, g.en + 3);
  if (has(id, "echoing") && gm().later) gm().later(function () { if (!G() || G().dead || G().implants.indexOf(id) < 0) return; echoK = 0.5; try { run(id); } finally { echoK = 0; } }, 2000);
  if (!has(id, "quiet") && !has(id, "ghost") && LAB.oko && LAB.oko.react && Math.random() < 0.15) LAB.oko.react("implant");
}
/* такт: время баффов, перехваченные турели, лечение со временем, чип регенерации */
var tickN = 0;
function tick() {
  var g = G(); if (!g || !g.st) return;
  var st = g.st;
  tickN++;
  /* (после 4.1) новый глубокий блок поднимает потолок ступеней — «Эхо» говорит об этом один раз на блок */
  if (tickN % 8 === 0) { var ds = deepStep(); if (ds > (cy().stepSeen || 0)) { cy().stepSeen = ds; gm().later(stepNews, 9000); } }
  ["overT", "reflectT", "phaseT", "muteT", "mimicT", "mirrorT", "groundT"].forEach(function (k) { if (st[k] > 0) { st[k]--; if (!st[k]) offSay(k); } });
  if (st.nanoT > 0) { st.nanoT--; if (!st.nanoT) { st.nano = 0; offSay("nanoT"); } }
  if (st.regenT > 0) { st.regenT--; g.hp = Math.min(g.hpMax, g.hp + (st.regenHp || 1)); }
  deepTick(g, st);
  var rg = stat("regen");
  if (rg > 0 && tickN % 4 === 0 && Date.now() - (g.lastHurt || 0) > 6000 && g.hp < g.hpMax) g.hp = Math.min(g.hpMax, g.hp + Math.max(1, Math.round(rg)));
  /* (проверка перед сборкой) срок перепрошивки (allyT) отсчитывает только такт ловушек (traps.js):
     прежде он убавлялся и здесь — вдвое быстрее обещанного, а при нечётном остатке машина
     оставалась союзником навсегда */
}
var OFF = { overT: "Разгон оружия закончился.", reflectT: "Зеркальный контур погас.", phaseT: "Вы снова в фазе.", muteT: "Шаги снова слышны.", mimicT: "Мимикрия спала: машины снова вас узнают.", nanoT: "Наноброня рассеялась.",
  /* (после 4.1) */
  absorbT: "Счётный щит погас.", wardT: "Последняя перекличка смолкла.", foreT: "Предчувствие отпустило.", deferT: "Отложенная боль возвращается — понемногу.", cordonT: "Кордон снят.", heatT: "Теплоотвод остыл.", haggleT: "Торг по спискам окончен.", numbT: "Обезболивание прошло." };
function offSay(k) { if (OFF[k]) LAB.say(OFF[k], { interrupt: false }); }
/* Удар по герою (combat.js hurtPlayer): фаза, уклонение, отражение, заземление. src — враг. */
function onHurt(fin, adt, src) {
  var g = G(), st = g.st;
  if (st.phaseT > 0) { LAB.say("Удар прошёл сквозь: вы вне фазы.", { interrupt: false }); return 0; }
  if (stat("dodge") > 0 && Math.random() < stat("dodge")) { LAB.say("Увернулись.", { interrupt: false }); return 0; }
  /* (после 4.1) предчувствие и защита глубин */
  if (st.foreT > 0 && Math.random() < 0.25) { LAB.say("«Эхо» услышало замах: удар мимо.", { interrupt: false }); return 0; }
  fin = deepHurt(fin, adt, src);
  if (!fin) return 0;
  if ((st.groundT > 0 || stat("ground") > 0) && /^(emp|shock|ion)$/.test(adt || "")) fin = Math.max(1, Math.round(fin * (st.groundT > 0 ? 0.33 : 1) * (1 - Math.min(0.7, stat("ground")))));
  var refl = st.reflectT > 0 ? 0.4 : st.mirrorT > 0 ? 0.2 : 0;
  if (refl && src && src.hp != null && !src.dead && LAB.combat) LAB.combat.damageFoe(src, Math.max(1, Math.round(fin * refl)), "phys", { quiet: true, noarmor: true });
  return lastWard(fin);
}

/* ════════ ЧИПЫ — ВЕЩИ РЮКЗАКА, СХЕМЫ МАСТЕРСКОЙ ════════ */
var CLS_BY_T = [null, "spec", "spec", "exp", "syn"];
function recipeNeed(d) {
  var c = CATS[d.cat], n = {};
  if (d.t >= 5) return deepNeed(d, c);
  n[c.p] = 1 + (d.t >= 3 ? 1 : 0); n[c.q] = (n[c.q] || 0) + (d.t >= 2 ? 1 : 0) + 1;
  n.chip = (n.chip || 0) + (d.t >= 2 ? 2 : 1);
  if (d.t === 2) n.cell = (n.cell || 0) + 1;
  if (d.t >= 3) n.supercond = (n.supercond || 0) + 1;
  if (d.t >= 4) { n.proto = 1; n.powercell = 1; n.supercond = 2; }
  return n;
}
var OLD_NEED = { regen: { gel: 3, chip: 2, cell: 1 }, tk: { magnet: 2, chip: 1, servo: 1 }, haste: { servo: 1, chip: 2, cell: 1, reagent: 1 }, shield: { cell: 2, magnet: 1, chip: 2, panel: 1 },
  empulse: { cap: 3, relay: 2, chip: 2 }, thermal: { cell: 2, ceramic: 1, chip: 2, reagent: 1 }, hack: { chip: 3, relay: 1, optic: 1 }, cloak: { optic: 2, chip: 2, supercond: 1 },
  freeze: { supercond: 1, cell: 2, chip: 2, reagent: 2 }, pbolt: { proto: 1, supercond: 2, powercell: 1, chip: 2 } };
LAB.IMPLANTS.forEach(function (im) {
  if (im.core) return;
  var id = "imp_" + im.id;
  LAB.ITEMS[id] = { n: im.passive ? im.n : "Чип импланта «" + im.n + "»", icon: im.passive ? "🔷" : "💠", kind: "implant", cat: "implant", implant: im.id, price: Math.max(80, im.price || 0),
    desc: im.desc + (im.passive ? " Пассивный: работает сам в нейрогнезде." : " Имплант: применяется с панели.") + " Направление — " + CATS[im.cat].n + "." };
  /* (3.7, нелогичность) схема — не раньше своих деталей (PART_DEPTH; экспериментальный компонент — особый, его
     дают сейфы и синтезатор): прежде «Чип кожного панциря» собирался с первого уровня из бронепанели третьего */
  var need0 = OLD_NEED[im.id] || recipeNeed(im), pd = im.minL || 1;
  for (var pk0 in need0) if (pk0 !== "proto") pd = Math.max(pd, LAB.PART_DEPTH[pk0] || 1);
  if (im.deep) { LAB.ITEMS[id].depth = im.minL; LAB.ITEMS[id].price = im.price; }
  if (!LAB.RECIPES.some(function (q) { return q.id === id; })) {
    var rcI = { id: id, out: id, n: LAB.ITEMS[id].n, need: need0, cls: im.deep ? "syn" : CLS_BY_T[im.t], bp: true, minL: pd, cyb: im.cat, cybN: im.deep ? ({ 5: 6, 6: 8, 7: 10, 8: 12 })[im.t] : Math.max(0, im.t - 1), desc: im.desc };
    if (im.deep) { rcI.deep = im.blk; rcI.deepT = deepTierI(im.blk); }
    LAB.RECIPES.push(rcI);
  }
});
function chipOf(id) { return "imp_" + id; }
/* мастерская спрашивает: хватает ли кибернетики, чтобы собрать */
function craftWhy(rc) {
  if (!rc || !rc.cyb) return "";
  return catLv(rc.cyb) < (rc.cybN || 0) ? "Не хватает кибернетики: «" + CATS[rc.cyb].n + "», нужна ступень " + rc.cybN + ", у вас " + catLv(rc.cyb) + ". Ступень растёт от вживления, калибровки, модификаций, разбора и применения имплантов этого направления." : "";
}
function crafted(rc) { if (rc && rc.cyb) gain(rc.cyb, "craft", rc.id); }

/* ════════ ВЖИВИТЬ, ИЗВЛЕЧЬ, РАЗОБРАТЬ, КАЛИБРОВАТЬ ════════ */
function roomFor(id) {
  var d = def(id);
  if (d.passive) return chipsIn() < slots() ? "" : "все нейрогнёзда заняты: " + chipsIn() + " из " + slots() + ". Извлеките чип или поднимите кибернетику";
  return usedCap() + load(id) <= capacity() ? "" : "не хватает ёмкости: занято " + usedCap() + " из " + capacity() + ", этому нужно " + load(id) + ". Извлеките имплант или поднимите кибернетику";
}
function install(id, how, quiet) {
  var g = G(), d = def(id);
  if (installed(id)) { say("«" + d.n + "» у вас уже есть. Чип можно продать или разобрать у верстака — и узнать схему."); return false; }
  var why = roomFor(id);
  if (why) { LAB.UI.error(); say("Не вживить «" + d.n + "»: " + why + "."); return false; }
  g.implants.push(id);
  var b = g.body; if (b) b.neuro = Math.min(100, (b.neuro || 0) + 12);
  A("play", "implant");
  applyStatic();
  gain(d.cat, "install", id);
  var msg = (how || "Вживлено") + ": «" + d.n + "»" + (tagText(id) ? ", " + tagText(id) : "") + ". " + (d.passive ? "Пассивный чип: работает сам. Гнёзд занято " + chipsIn() + " из " + slots() + "." : "Панель имплантов — " + LAB.K(LAB.gw("implants", "двойное касание четырьмя пальцами") + ".", "клавиша U.") + " Имплантов вживлено: " + actIn() + ", ёмкость: " + usedCap() + " из " + capacity() + ".");
  if (!quiet) say(msg);
  if (LAB.oko && LAB.oko.react) gm().later(function () { LAB.oko.react("implant"); }, 3000);
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  return quiet ? msg : true;
}
function useChip(itemId) {
  var g = G(), d = LAB.ITEMS[itemId];
  if (!d || d.kind !== "implant" || !(g.inv[itemId] > 0)) { say("Такого чипа нет."); return false; }
  if (installed(d.implant) || roomFor(d.implant)) return install(d.implant);
  g.inv[itemId]--;
  return install(d.implant, "Вы вживляете чип из рюкзака");
}
/* Подобрали чип с пола: вживляется сам, если есть место, иначе — в рюкзак. */
function pickup(id) {
  id = canon(id);
  var g = G(), it = chipOf(id), d = def(id);
  if (!LAB.ITEMS[it]) return "";
  if (!installed(id) && !roomFor(id)) return " " + install(id, "Чип вживился сам", true);
  g.inv[it] = (g.inv[it] || 0) + 1;
  return " " + (installed(id) ? "Такой уже есть" : "Места нет — " + roomFor(id)) + ": «" + d.n + "» в рюкзаке. Его можно вживить позже, продать или разобрать у верстака.";
}
function extract(id, how) {
  var g = G(), d = def(id);
  if (d.core) { say("«" + d.n + "» — системный имплант «Эхо»: его не извлечь."); return false; }
  if (!installed(id)) { say("Такого импланта нет."); return false; }
  g.implants.splice(g.implants.indexOf(id), 1);
  g.inv[chipOf(id)] = (g.inv[chipOf(id)] || 0) + 1;
  applyStatic();
  var self = how === "self", pain = self ? 14 : 8;
  g.hp = Math.max(1, g.hp - pain);
  var b = g.body; if (b) b.neuro = Math.min(100, (b.neuro || 0) + (self ? 18 : 10));
  gain(d.cat, "extract", id);
  A("play", "inject");
  say((self ? "Вы сами вскрываете гнездо. " : "") + "«" + d.n + "» извлечён: чип — в рюкзаке. Больно: здоровье " + g.hp + ". Ступень и модификации «Эхо» запомнило.");
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  return true;
}
function dismantle(id, tier) {
  var g = G(), it = chipOf(id), d = def(id);
  if (!(g.inv[it] > 0)) { say("Чипа нет."); return false; }
  g.inv[it]--;
  var c = CATS[d.cat], parts = { chip: 1 + (d.t >= 2 ? 1 : 0) }, got = [];
  parts[c.p] = (parts[c.p] || 0) + 1;
  if (d.t >= 3) parts.supercond = (parts.supercond || 0) + 1;
  if (d.t >= 5) parts.dp_coil = (parts.dp_coil || 0) + 1; /* (после 4.1) чип глубин — и счётная катушка */
  for (var k in parts) { g.inv[k] = (g.inv[k] || 0) + parts[k]; got.push(low(LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + parts[k]); }
  A("play", "pry");
  gain(d.cat, "dismantle", id);
  var t = "«" + d.n + "» разобран. Получено: " + got.join(", ") + ".", W = LAB.workshop;
  if (W && (tier || 0) >= 2) { var lt = W.learn(it, "Поняли, разбирая чип.", true); if (lt) t += " " + lt; }
  else if (W && !W.known({ id: it, bp: true })) t += " Схему поймёте, если разбирать у верстака со станками.";
  say(t);
  return true;
}
var UP_COST = [null, null, { chip: 2, cell: 1, optic: 1 }, { chip: 3, supercond: 1, powercell: 1 }, { chip: 3, dp_coil: 2, powercell: 1 }, { chip: 4, dp_nerve: 2, supercond: 2 }];
var UP_TIER = [0, 0, 2, 4, 6, 7]; /* (после 4.1) четвёртая — стапель Нижних, пятая — резонансный станок */
function upPrice(id) { var d = def(id), base = Math.max(120, d.price || 0), n = lv(id); return Math.round(base * (n === 1 ? 0.8 : n === 2 ? 1.6 : n === 3 ? 2.4 : 3.2) * (gm().priceK ? gm().priceK() : 1)); }
/* выше третьей ступени — только ниже Истока (выше сотого уровня всё по-прежнему) */
function topGrade() { return deepStep() > 0 ? 5 : 3; }
function upgradable(id) { return id !== "echo" && lv(id) < topGrade(); }
function lvWord(n) { return ["первая", "вторая", "третья", "четвёртая", "пятая"][n - 1]; }
var LV_GEN = ["", "", "второй", "третьей", "четвёртой", "пятой"];
var LV_POW = ["", "", "1,35", "1,75", "2,2", "2,7"];
function upgrade(id, how, tier) {
  var g = G(), d = def(id), n = lv(id) + 1;
  if (!installed(id)) { say("Такого импланта нет."); return false; }
  if (!upgradable(id)) { say("«" + d.n + "»: " + (id === "echo" ? "эхолокацию не улучшить." : topGrade() > 3 ? "выше пятой ступени не бывает." : "выше третьей ступени не бывает.")); return false; }
  if (n > maxGrade()) { LAB.UI.error(); say("Калибровка до " + LV_GEN[n] + " ступени — с общей ступени кибернетики " + GRADE_NEED[n] + ". Сейчас — " + level() + "."); return false; }
  if (how === "bench") {
    if ((tier || 0) < UP_TIER[n]) { LAB.UI.error(); say(n === 5 ? "Пятую ступень даёт резонансный станок Нижних — или станция имплантов." : n === 4 ? "Четвёртую ступень даёт стапель Нижних — или станция имплантов." : n === 3 ? "Третью ступень даёт станок с программным управлением или молекулярный синтезатор — или станция имплантов." : "Вторую ступень даёт верстак со станками или станция имплантов."); return false; }
    var need = UP_COST[n], lack = lackOf(need);
    if (lack) { LAB.UI.error(); say("Для калибровки не хватает: " + lack + "."); return false; }
    take(need);
  } else {
    var p = upPrice(id);
    if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + g.credits + "."); return false; }
    g.credits -= p;
  }
  if (!g.impLv) g.impLv = {};
  g.impLv[id] = n;
  applyStatic();
  gain(d.cat, "calib");
  A("play", "implant");
  say("Калибровка: «" + d.n + "» — " + lvWord(n) + " ступень. Сильнее" + (d.passive ? "" : ", энергии меньше" + (n === 3 || n === 5 ? ", и на шаг дальше" : "") + ". Сейчас — " + gm().implantCost(id) + " энергии") + ".");
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  return true;
}
function lackOf(need) { var g = G(), s = []; for (var k in need) if ((g.inv[k] || 0) < need[k]) s.push(low(LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + (g.inv[k] || 0) + " из " + need[k]); return s.join(", "); }
function take(need) { var g = G(); for (var k in need) g.inv[k] -= need[k]; }
function addMod(id, m) {
  var g = G(), d = def(id), M = MODS[m];
  if (!installed(id)) { say("Такого импланта нет."); return false; }
  var why = compat(id, m);
  if (why) { LAB.UI.error(); say("Нельзя: " + why + "."); return false; }
  var lack = lackOf(M.cost);
  if (lack) { LAB.UI.error(); say("Для модификации не хватает: " + lack + "."); return false; }
  take(M.cost);
  if (!g.impMod) g.impMod = {};
  g.impMod[id] = mods(id).concat([m]);
  applyStatic();
  gain(d.cat, "mod", id + "/" + m); /* (3.6) снять и поставить ту же модификацию снова — опыта уже не даст */
  A("play", "term_ok");
  say("Модификация: «" + d.n + "» — " + M.n + ": " + M.d + "." + (d.passive ? "" : " Сейчас — " + gm().implantCost(id) + " энергии."));
  return true;
}
function delMod(id, m) {
  var g = G(); if (!has(id, m)) return false;
  g.impMod[id] = mods(id).filter(function (x) { return x !== m; });
  applyStatic();
  A("play", "pry"); say("Модификация «" + MODS[m].n + "» снята. Её детали спеклись в гнезде — не вернуть.");
  return true;
}
function tagText(id) { var s = []; if (lv(id) > 1) s.push("ступень " + lv(id)); mods(id).forEach(function (m) { if (MODS[m]) s.push(MODS[m].n); }); return s.join(", "); }
function costTxt(need) { var s = []; for (var k in need) s.push(low(LAB.ITEMS[k] ? LAB.ITEMS[k].n : k) + " " + need[k]); return s.join(", "); }
function chips() { var g = G(); return Object.keys(g.inv).filter(function (k) { return g.inv[k] > 0 && LAB.ITEMS[k] && LAB.ITEMS[k].kind === "implant"; }); }
/* (3.6) запись прежней версии: гемостат становится регенерацией. Вживлённый — регенерацией
   (если она уже стоит — чипом регенерации в рюкзак); чипы, ступень, подходящие модификации,
   схемы и опыт «раз на чип» переходят к ней. */
var MOD_REGEN = ["eco", "soft", "boost", "twin", "reserve", "quiet", "purge", "adren"];
function fixSave(g) {
  if (!g) return;
  for (var from in GONE) {
    var to = GONE[from], fc = chipOf(from), tc = chipOf(to);
    g.inv = g.inv || {};
    if (g.implants && g.implants.indexOf(from) >= 0) {
      g.implants = g.implants.filter(function (id) { return id !== from; });
      if (g.implants.indexOf(to) < 0) g.implants.push(to); else g.inv[tc] = (g.inv[tc] || 0) + 1;
    }
    if (g.inv[fc]) { g.inv[tc] = (g.inv[tc] || 0) + g.inv[fc]; delete g.inv[fc]; }
    if (g.impLv && g.impLv[from]) { g.impLv[to] = Math.max(g.impLv[to] || 1, g.impLv[from]); delete g.impLv[from]; }
    if (g.impMod && g.impMod[from]) {
      var old = [].concat(g.impMod[from]);
      if (!(g.impMod[to] && g.impMod[to].length)) g.impMod[to] = old.filter(function (m) { return MOD_REGEN.indexOf(m) >= 0; });
      delete g.impMod[from];
    }
    if (g.bp && g.bp[fc]) { g.bp[tc] = 1; delete g.bp[fc]; }
    var once = g.cyber && g.cyber.once;
    if (once) Object.keys(once).forEach(function (k) { var i = k.indexOf(":" + from); if (i > 0 && i + from.length + 1 === k.length) { once[k.slice(0, i) + ":" + to] = 1; delete once[k]; } });
  }
}
function line(id) { var d = def(id), tg = tagText(id); return d.n + (tg ? ", " + tg : "") + (d.passive ? ", чип" : ", " + gm().implantCost(id) + " энергии") + ". " + d.desc; }

/* ════════ ОКНА ════════ */
function cyberText() {
  var l = level(), x = totalXp(), nx = l < lvlCap() ? ALL_XP[l] : null;
  return "Кибернетика: общая ступень " + l + (nx != null ? ", до следующей " + (nx - x) + " опыта" : l < ALL_XP.length && deepStep() > 0 ? ", высшая на этой глубине: следующая откроется в следующем блоке" : ", высшая") + ". Имплантов вживлено: " + actIn() + ", ёмкость занята: " + usedCap() + " из " + capacity() + (coreIn() ? "; и ещё встроенных в «Эхо»: " + coreIn() + " — " + coreList().map(function (id) { return low(def(id).n); }).join(" и ") + ", ёмкости они не занимают" : "") + ". Чипов в нейрогнёздах: " + chipsIn() + " из " + slots() + ". Модификаций на имплант — до " + modSlots() + ". Калибровка — до " + ["первой", "второй", "третьей", "четвёртой", "пятой"][maxGrade() - 1] + " ступени." + (selfSurgery() ? " Извлекать можно самому." : "");
}
function cyberItems() {
  var items = [{ label: cyberText(), info: true, keep: true, fn: function () { say(cyberText()); } }];
  CAT_ORDER.forEach(function (c) {
    var n = catLv(c), x = catXp(c), top = catCap(), nx = n < top ? CAT_XP[n + 1] : null;
    items.push({ label: cap1(CATS[c].n) + ": ступень " + n + (nx != null ? ", до следующей " + (nx - x) + " опыта" : n < 15 && deepStep() > 0 ? ", высшая на этой глубине: следующая откроется в следующем блоке" : ", высшая") + ". Сила плюс " + 6 * n + " процентов, энергии минус " + (4 * Math.min(5, n) + 2 * Math.max(0, n - 5)) + " процентов." + (n < top ? " Дальше: " + catPerk(n + 1) : n < 15 && deepStep() > 0 ? " Дальше: " + catPerk(n + 1) : ""), info: true, keep: true, fn: function () {} });
  });
  items.push({ label: "Как растёт: вживление, калибровка, модификации, сборка и разбор чипов, применение имплантов — каждый в своём направлении.", info: true, keep: true, fn: function () {} });
  if (selfSurgery()) G().implants.forEach(function (id) { if (!def(id).core) items.push({ label: "Извлечь самому: «" + def(id).n + "» — больнее, чем у верстака", keep: true, fn: function () { extract(id, "self"); } }); });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function cyberMenu() { menu("Кибернетика", cyberItems(), { keep: true, rebuild: cyberItems }); }
/* Мастерская: калибровка, модификации, извлечение, разбор и вживление. tier — оснастка верстака. */
function benchItems(tier) {
  var g = G(), items = [{ label: cyberText(), fn: function () { cyberMenu(); } }];
  g.implants.forEach(function (id) {
    var d = def(id), n = lv(id) + 1;
    if (!upgradable(id)) return;
    var why = n > maxGrade() ? "нужна общая ступень кибернетики " + GRADE_NEED[n] : tier < UP_TIER[n] ? (n === 5 ? "нужен резонансный станок Нижних" : n === 4 ? "нужен стапель Нижних" : n === 3 ? "нужен станок с программным управлением" : "нужны станки") : "";
    items.push({ label: "Калибровка: «" + d.n + "» — " + lvWord(n) + " ступень: сила в " + LV_POW[n] + " раза больше первой, энергии на " + (["", "", "десятую часть", "пятую часть", "четверть с лишним", "треть"])[n] + " меньше. " + (why ? cap1(why) : "Нужно: " + costTxt(UP_COST[n])), keep: true, disabled: !!why, info: !!why, why: why ? cap1(why) + "." : "", fn: function () { upgrade(id, "bench", tier); } }); /* (3.7, нелогичность) info: причина уже в строке — без «— недоступно» */
  });
  if (tier >= 2) g.implants.forEach(function (id) {
    if (id === "echo") return;
    items.push({ label: "Модификации: «" + def(id).n + "» — " + (mods(id).length ? mods(id).map(function (m) { return MODS[m].n; }).join(", ") : "нет") + ", гнёзд " + mods(id).length + " из " + modSlots(), fn: function () { modMenu(id); } });
  });
  if (tier >= 2 || selfSurgery()) g.implants.forEach(function (id) {
    if (def(id).core) return;
    items.push({ label: "Извлечь: «" + def(id).n + "» — чип в рюкзак, больно", keep: true, fn: function () { extract(id); } });
  });
  chips().forEach(function (k) {
    var id = LAB.ITEMS[k].implant;
    if (!installed(id)) items.push({ label: "Вживить: " + low(LAB.ITEMS[k].n) + " (" + g.inv[k] + ")" + (roomFor(id) ? " — " + roomFor(id) : ""), keep: true, fn: function () { useChip(k); } });
    items.push({ label: "Разобрать: " + low(LAB.ITEMS[k].n) + " (" + g.inv[k] + ") — детали" + (tier >= 2 ? ", схема чипа" : ""), keep: true, fn: function () { dismantle(id, tier); } });
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function benchMenu(tier) {
  menu("Импланты у верстака", benchItems(tier), { keep: true, rebuild: function () { return benchItems(tier); }, intro: "Ступени и модификации хранит «Эхо». Имплантов вживлено: " + actIn() + ", чипов в нейрогнёздах: " + chipsIn() + ". Чипов в рюкзаке: " + chips().reduce(function (a, k) { return a + G().inv[k]; }, 0) + "." });
}
function modItems(id) {
  var items = [];
  mods(id).forEach(function (m) { items.push({ label: "Стоит: " + MODS[m].n + " — " + MODS[m].d + ". Снять — детали не вернутся", keep: true, fn: function () { delMod(id, m); } }); });
  MOD_ORDER.forEach(function (m) {
    if (has(id, m)) return;
    var M = MODS[m], why = compat(id, m);
    if (M.deep && !deepStep()) return; /* (после 4.1) модификации глубин — только ниже Истока */
    if (/ни к чему|только для направления|чипу подходят|для чипов/.test(why)) return; /* чужие не показываем */
    items.push({ label: M.n + " — " + M.d + ". " + (why ? "Нельзя: " + why : "Нужно: " + costTxt(M.cost) + (lackOf(M.cost) ? " — не хватает" : "")), keep: true, disabled: !!why, info: !!why, why: why ? "Нельзя: " + why + "." : "", fn: function () { addMod(id, m); } }); /* (3.7, нелогичность) info: «Нельзя: …» уже в строке — без «— недоступно» */
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function modMenu(id) { menu("Модификации: «" + def(id).n + "»", modItems(id), { keep: true, rebuild: function () { return modItems(id); }, intro: "Гнёзд модификаций: " + mods(id).length + " из " + modSlots() + ". Направление — " + CATS[def(id).cat].n + ", ступень " + catLv(def(id).cat) + "." }); }
/* Станция имплантов: свой набор на продажу, калибровка за кредиты, извлечь, вживить чип. */
function stock(o) {
  var g = G(), L = g.L, seed = h32("stock:" + g.seed + ":" + g.L + "-" + g.F + ":" + (o && o.id));
  var pool = LAB.IMPLANTS.filter(function (im) { return !im.core && (im.price || 0) > 0 && (im.minL || 1) <= L + 2 && !(im.deep && L <= 100); }); /* (после 4.1) импланты глубин — только ниже Истока */
  pool.sort(function (a, b) { return (h32(seed + a.id) % 1000) - (h32(seed + b.id) % 1000); });
  return pool.filter(function (im) { return !im.passive; }).slice(0, 5).concat(pool.filter(function (im) { return im.passive; }).slice(0, 4));
}
function stationItems(o) {
  var g = G(), items = [], k = gm().priceK ? gm().priceK() : 1;
  items.push({ label: cyberText(), fn: function () { cyberMenu(); } });
  stock(o).forEach(function (im) {
    if (installed(im.id)) return;
    var p = Math.round(im.price * k), why = roomFor(im.id);
    items.push({ label: (im.passive ? "Чип" : "Имплант") + ": «" + im.n + "» — " + p + " " + pl(p, "кредит", "кредита", "кредитов") + ". " + im.desc + (why ? " Сейчас нельзя: " + why + "." : ""), keep: true, fn: function () {
      if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + "."); return; }
      if (roomFor(im.id)) { LAB.UI.error(); say("Не вживить: " + roomFor(im.id) + "."); return; }
      g.credits -= p; install(im.id, "Вживлено на станции");
    } });
  });
  g.implants.forEach(function (id) {
    if (!upgradable(id)) return;
    var n = lv(id) + 1, p = upPrice(id);
    items.push({ label: "Калибровка: «" + def(id).n + "» — " + lvWord(n) + " ступень, " + p + " " + pl(p, "кредит", "кредита", "кредитов") + (n > maxGrade() ? ". Нужна общая ступень кибернетики " + GRADE_NEED[n] : ""), keep: true, fn: function () { upgrade(id, "station"); } });
  });
  g.implants.forEach(function (id) { if (!def(id).core) items.push({ label: "Извлечь: «" + def(id).n + "» — чип в рюкзак", keep: true, fn: function () { extract(id); } }); });
  chips().forEach(function (c) { var id = LAB.ITEMS[c].implant; if (!installed(id)) items.push({ label: "Вживить чип из рюкзака: «" + def(id).n + "»", keep: true, fn: function () { useChip(c); } }); });
  items.push({ label: "Отойти", fn: function () {} });
  return items;
}
function station(o) {
  A("play", "implant");
  menu("Станция имплантов", stationItems(o), { keep: true, rebuild: function () { return stationItems(o); }, intro: "Кредитов " + G().credits + ". Продать чип — в пункте снабжения или торговому терминалу." });
}

/* ════════ (после 4.1) ДЕЙСТВИЯ ИМПЛАНТОВ ГЛУБИН ════════ */
function deepTierI(blk) { return LAB.deepBenchTier ? LAB.deepBenchTier(blk) : blk >= 15 ? 10 : blk >= 13 ? 9 : blk >= 10 ? 8 : blk >= 7 ? 7 : 6; }
/* схема импланта или чипа глубин: детали направления и детали Нижних по классу (катушка, нервная нить,
   резонансная пластина, кристалл слоя; Цехам — паровой клапан) */
function deepNeed(d, c) {
  var n = {};
  n[c.p] = 2; n[c.q] = (n[c.q] || 0) + 2; n.chip = (n.chip || 0) + 3;
  n.dp_coil = d.t >= 6 ? 2 : 1;
  if (d.t >= 6) n.dp_nerve = 1;
  if (d.t >= 7) { n.dp_reed = 1; n.supercond = (n.supercond || 0) + 1; }
  if (d.t >= 8) { n.dp_shard = 1; n.powercell = (n.powercell || 0) + 1; }
  if (d.blk === 12) n.dp_valve = 1;
  return n;
}
function foeOn(x, y) { var C = LAB.combat; return !!(C && C.foes().some(function (q) { return !q.dead && q.x === x && q.y === y; })); }
function cheb2(f) { var g = G(); return Math.max(Math.abs(f.x - g.x), Math.abs(f.y - g.y)); }
function byDist(a, b) { return cheb2(a) - cheb2(b); }
/* перенос героя (возврат по следу, точка сбора): как шаг — карта, подбор, помещение, ловушки */
function blink(x, y) {
  var g = G(), from = [g.x, g.y];
  if (LAB.ui && LAB.ui.closeAll) LAB.ui.closeAll();
  g.x = x; g.y = y;
  A("play", "phase_out");
  mapAround(1);
  try {
    if (gm().autoPickup) gm().autoPickup();
    if (gm().roomCheck) gm().roomCheck(false, false);
    if (gm().announceNear) gm().announceNear();
    if (LAB.combat && LAB.combat.afterPlayerMove) LAB.combat.afterPlayerMove(from);
  } catch (e) { console.warn(e); }
}
/* оттолкнуть от героя на шаги (кордон): неподвижных, турели и камеры — нет */
function shove(f, steps) {
  var g = G(), C = LAB.combat, moved = 0, beh = f.beh || (f.base && f.base.beh) || [];
  if (beh.indexOf("stationary") >= 0 || beh.indexOf("turret") >= 0 || beh.indexOf("camera") >= 0) return false;
  var can = function (x, y) { return C && C.canStand ? C.canStand(f, x, y) : free(x, y); };
  for (var i = 0; i < steps; i++) {
    var dx = Math.sign(f.x - g.x), dy = Math.sign(f.y - g.y), nx, ny;
    if (!dx && !dy) dx = 1;
    if (can(f.x + dx, f.y + dy)) { nx = f.x + dx; ny = f.y + dy; }
    else if (dx && can(f.x + dx, f.y)) { nx = f.x + dx; ny = f.y; }
    else if (dy && can(f.x, f.y + dy)) { nx = f.x; ny = f.y + dy; }
    else break;
    f.x = nx; f.y = ny; moved++;
  }
  return moved > 0;
}
function censusText() {
  var C = LAB.combat, all = C ? C.foes().filter(function (f) { return !f.dead && !f.ally && !f.calm && !f.neutral && !f.burrowed; }) : [];
  var bio = all.filter(function (f) { return f.kind === "bio"; }).length, mech = all.filter(function (f) { return f.kind === "mech"; }).length, other = all.length - bio - mech;
  return "На этаже врагов: " + all.length + (all.length ? " — живых " + bio + ", машин " + mech + (other ? ", прочих " + other : "") : "") + ".";
}
var SURVEY = { stairs_down: 1, stairs_up: 1, elevator: 1, gate: 1, gate_sealed: 1, workbench: 1, chemlab: 1, supply: 1, implantlab: 1, capsule: 1, safe: 1, terminal: 1, medvend: 1, srez: 1, trialst: 1, comp: 1 };
var trailA = [];
function deepRun(id, d, fx, p) {
  var g = G(), C = LAB.combat, st = g.st, list, n, i;
  switch (fx.k) {
    case "reso": {
      list = foesNear(p.r, null, true); n = list.length;
      var kr = Math.min(2, 1 + 0.2 * Math.max(0, n - 1));
      list.forEach(function (f) { hit(id, f, Math.round(p.dmg * kr), p); });
      var pc = Math.round((kr - 1) * 100);
      return d.n + ": " + (n ? "задето " + n + (pc ? ", звон сильнее на " + pc + " " + pl(pc, "процент", "процента", "процентов") : "") : "рядом никого") + ".";
    }
    case "ruin": {
      list = foesNear(p.rng).filter(function (f) { return LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y); }).sort(byDist);
      if (!list.length) return d.n + ": целей в " + p.rng + " шагах нет.";
      var f0 = list[0];
      hit(id, f0, p.dmg, p);
      if (!f0.dead) {
        if (!f0.ruined) { f0.ruined = 1; f0.arm = Math.floor((f0.arm || 0) / 2); }
        f0.markT = Math.max(f0.markT || 0, 20);
        if (f0.kind === "bio") { f0.bleedT = Math.max(f0.bleedT || 0, 10); f0.bleedD = Math.max(f0.bleedD || 1, Math.round(p.dmg * 0.05)); }
      }
      return d.n + ": игла " + dirOf(f0) + (f0.dead ? ", цель уничтожена." : ", броня цели вдвое слабее" + (f0.kind === "bio" ? ", и она кровит" : "") + ".");
    }
    case "steam":
      list = lineFoes(p.rng, true);
      list.forEach(function (f) { hit(id, f, p.dmg, p); if (!f.dead) { f.bleedT = Math.max(f.bleedT || 0, 8); f.bleedD = Math.max(f.bleedD || 1, Math.round(p.dmg * 0.08)); } });
      return d.n + " " + (LAB.DIRTO[g.face] || "") + ". Обварено: " + list.length + ".";
    case "absorb": st.absorbT = Math.round(fx.dur * p.dur); return d.n + ": " + secW(Math.round(st.absorbT / 2)) + " удары засчитываются вполовину.";
    case "ward": st.wardT = Math.round(fx.dur * p.dur); return d.n + ": " + secW(Math.round(st.wardT / 2)) + " смертельный удар вас не возьмёт.";
    case "cordon": {
      list = foesNear(p.r, null, true); n = 0;
      list.forEach(function (f) { if (f.boss) return; if (shove(f, 2)) n++; f.frozen = Math.max(f.frozen || 0, 3); });
      st.cordonT = Math.round(fx.dur * p.dur);
      return d.n + ": отброшено " + n + ". " + cap1(secW(Math.round(st.cordonT / 2))) + " никто не подойдёт вплотную.";
    }
    case "census": {
      var near = foesNear(p.r);
      near.forEach(function (f) { f.markT = Math.max(f.markT || 0, Math.round(fx.mark * p.dur)); f.mark = Date.now() + 45000; });
      var all = C.foes().filter(function (f) { return !f.dead && !f.ally && !f.calm && !f.neutral && !f.burrowed; }).sort(byDist);
      return d.n + ". " + censusText() + (all.length ? " Ближе всех: " + all.slice(0, 3).map(function (f) { return fname(f) + " " + dirOf(f); }).join("; ") + "." : "") + (near.length ? " Помечено: " + near.length + "." : "");
    }
    case "survey": {
      mapAround(p.r);
      var rows = [];
      (CUR().fl.objs || []).forEach(function (o) {
        if (!SURVEY[o.type] || Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) > p.r) return;
        rows.push({ d: Math.abs(o.x - g.x) + Math.abs(o.y - g.y), t: (gm().objName ? gm().objName(o) : o.type) + " " + gm().relDir(o.x, o.y) });
      });
      rows.sort(function (a, b) { return a.d - b.d; });
      return d.n + ": всё в " + p.r + " шагах — на карте «Эхо»." + (rows.length ? " Рядом: " + rows.slice(0, 6).map(function (r) { return r.t; }).join("; ") + "." : " Приметного рядом ничего.");
    }
    case "foresee": st.foreT = Math.round(fx.dur * p.dur); return d.n + ": " + secW(Math.round(st.foreT / 2)) + " каждый четвёртый удар — мимо.";
    case "shout": {
      var cn = 0, bn = 0;
      C.foes().forEach(function (f) {
        if (f.dead || f.ally || f.calm || f.burrowed || cheb2(f) > p.r) return;
        if (f.kind === "mech") { f.blindT = Math.max(f.blindT || 0, Math.round(fx.blind * p.dur)); if (f.state === "hunt") { f.state = "alert"; f.lost = 0; } bn++; }
        else if (!f.boss) { f.confused = Math.max(f.confused || 0, Math.round(fx.conf * p.dur)); cn++; }
      });
      return d.n + ": «Все здесь?» — " + (cn ? "тварей сбито с толку: " + cn : "тварей рядом нет") + (bn ? ", машин ослеплено: " + bn : "") + ".";
    }
    case "puppet": {
      list = C.foes().filter(function (f) { return !f.dead && !f.ally && !f.calm && f.kind === "mech" && cheb2(f) <= p.r && !(C.isCam && C.isCam(f)); }).sort(byDist);
      if (!list.length) return d.n + ": машин рядом нет.";
      var took = list.slice(0, has(id, "network") ? 2 : 1);
      took.forEach(function (f) {
        if (f.boss) { f.confused = Math.max(f.confused || 0, 6); f.frozen = Math.max(f.frozen || 0, 2); return; }
        f.ally = true; f.allyT = Math.round(fx.ally * p.dur * (1 + stat("allyk"))); f.hackT = 1; f.state = "idle"; f.aim = false; f.at = 0;
      });
      var t0 = took[0];
      return d.n + ": " + fname(t0) + " " + dirOf(t0) + (t0.boss ? " — страж: только сбит с толку." : " — теперь ваш, " + secW(Math.round(t0.allyT / 2)) + ".") + (took.length > 1 ? " И ещё одна машина." : "");
    }
    case "overheat": {
      list = foesNear(p.rng, "mech").filter(function (f) { return LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y); }).sort(byDist);
      if (!list.length) return d.n + ": машин в " + p.rng + " шагах нет.";
      var f1 = list[0];
      f1.dgBoom = 6; f1.dgBoomD = p.dmg; f1.dgBoomDt = p.dt;
      return d.n + ": " + fname(f1) + " " + dirOf(f1) + " греется — через три секунды рванёт. Не стойте рядом.";
    }
    case "convert": {
      var b = g.body || {}, got = 0, parts = [];
      var tx = Math.min(Math.round(b.tox || 0), Math.round(fx.tox * p.k)); if (tx > 0) { b.tox -= tx; got += tx; parts.push("токсины минус " + tx); }
      var rd = Math.min(Math.round(b.rad || 0), Math.round(fx.rad * p.k)); if (rd > 0) { b.rad -= rd; got += rd; parts.push("облучение минус " + rd); }
      var nr = Math.min(Math.round(b.neuro || 0), Math.round(fx.neuro * p.k)); if (nr > 0) { b.neuro -= nr; got += nr; parts.push("нейронагрузка минус " + nr); }
      if (!got) return d.n + ": выводить нечего — ни токсинов, ни облучения, ни нейронагрузки.";
      var hp0 = g.hp; g.hp = Math.min(g.hpMax, g.hp + Math.round(got * (1 + LAB.Le(g.L) / 50)));
      return d.n + ": " + parts.join(", ") + "; здоровье плюс " + (g.hp - hp0) + ", теперь " + g.hp + ".";
    }
    case "defer": st.deferT = Math.round(fx.dur * p.dur); return d.n + ": " + secW(Math.round(st.deferT / 2)) + " удары доходят лишь на треть.";
    case "purify": {
      var b2 = g.body || {}, out = [];
      if (st.poison > 0) { st.poison = 0; out.push("яд вышел"); }
      if (st.bleed > 0) { st.bleed = 0; out.push("кровь остановлена"); }
      if (st.parasite > 0) { st.parasite = 0; out.push("клещ отвалился"); }
      st.slow = 0; st.web = 0; st.deaf = 0;
      if (b2.tox > 0) { b2.tox = Math.max(0, b2.tox - Math.round(fx.tox * p.k)); out.push("токсины " + Math.round(b2.tox)); }
      if (b2.rad > 0) { b2.rad = Math.max(0, b2.rad - Math.round(fx.rad * p.k)); out.push("облучение " + Math.round(b2.rad)); }
      if (b2.neuro > 0) b2.neuro = Math.max(0, b2.neuro - Math.round(fx.neuro * p.k));
      if (LAB.chem && LAB.chem.mut && LAB.chem.mut() > 0) { LAB.chem.cutMut(Math.round(fx.mut * p.k)); out.push("мутация " + Math.round(LAB.chem.mut())); }
      var at = Math.round(fx.atox * p.dur);
      st.antitox = Math.max(st.antitox || 0, at); st.atoxSrc = "drug";
      out.push(secW(Math.round(at / 2)) + " газ и споры не страшны");
      return d.n + ": " + out.join(", ") + ".";
    }
    case "rewind": {
      var key = CUR().key, pts = trailA.filter(function (q) { return q.k === key; });
      if (pts.length < 2) return d.n + ": следа ещё нет — пройдите немного.";
      var tg = pts[Math.max(0, pts.length - 1 - (fx.back || 8))];
      if (tg.x === g.x && tg.y === g.y) return d.n + ": четыре секунды назад вы стояли здесь же.";
      if (!gm().passable(tg.x, tg.y) || foeOn(tg.x, tg.y)) return d.n + ": на прежнем месте кто-то стоит или путь закрыт.";
      blink(tg.x, tg.y);
      return d.n + ": вы там, где стояли четыре секунды назад.";
    }
    case "anchor": {
      var c = cy(), an = c.anchor, k2 = CUR().key;
      if (!an || an.k !== k2) { c.anchor = { k: k2, x: g.x, y: g.y }; return d.n + ": место отмечено. Второе применение вернёт вас сюда, пока вы на этом этаже."; }
      if (an.x === g.x && an.y === g.y) return d.n + ": вы и так на отмеченном месте.";
      if (!gm().passable(an.x, an.y) || foeOn(an.x, an.y)) return d.n + ": отмеченное место занято — подождите.";
      c.anchor = null;
      blink(an.x, an.y);
      return d.n + ": вы на отмеченном месте. Отметка снята.";
    }
    case "hush": {
      st.muteT = Math.max(st.muteT || 0, Math.round(fx.mute * p.dur));
      n = 0;
      foesNear(p.r).forEach(function (f) { f.deafT = Math.max(f.deafT || 0, Math.round(fx.deaf * p.dur)); if (f.state === "hunt") { f.state = "alert"; f.lastKnown = null; f.aim = false; n++; } });
      return d.n + ": " + (n ? "потеряли ваш след: " + n + ". " : "") + "Вокруг глохнет звук, ваших шагов не слышно.";
    }
    case "feed": {
      var w = g.weapons[g.wi];
      if (!w) return d.n + ": в руках нет оружия.";
      if (!w.cap || w.ammo === "none" || (LAB.physAmmo && LAB.physAmmo(w.ammo))) return d.n + ": " + w.name + " — без батарей и зарядов, подпитывать нечего.";
      w.charge = w.cap;
      var ov = "";
      if (w.ammo === "energy") { w.over = (w.over || 0) + (fx.over || 5); w.overK = Math.max(w.overK || 0, 1.33); ov = " Следующие " + w.over + " " + pl(w.over, "выстрел", "выстрела", "выстрелов") + " — сильнее."; }
      return d.n + ": " + w.name + " — заряд полон, " + w.charge + " из " + w.cap + "." + ov;
    }
    case "discharge": {
      var e0 = Math.round(g.en || 0);
      if (e0 <= 0) return d.n + ": энергии не осталось — разряжать нечего.";
      list = foesNear(p.r, null, true);
      var base = Math.round(e0 * (4 + LAB.Le(g.L) / 10) * p.k * (has(id, "overflow") ? 1.5 : 1));
      list.forEach(function (f) { hit(id, f, f.kind === "mech" ? Math.round(base * 1.5) : base, p); });
      g.en = 0;
      return d.n + ": вся энергия, " + e0 + ", — одним разрядом. Задето: " + list.length + ".";
    }
    case "heatsink": {
      st.heatT = Math.round(fx.dur * p.dur);
      var w2 = g.weapons[g.wi];
      if (w2) { w2.heat = 0; w2.hotUntil = 0; w2.chill = Date.now() + st.heatT * 500; }
      return d.n + ": " + secW(Math.round(st.heatT / 2)) + " жар вас лечит, а оружие не греется.";
    }
    case "peek": {
      var rows2 = [], objs = CUR().fs.objs || {};
      (CUR().fl.objs || []).forEach(function (o) {
        if (!o.loot || Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) > p.r) return;
        var os = objs[o.id]; if (os && os.looted) return;
        var nm = o.loot.map(function (it) { return gm().itemName ? gm().itemName(it) : it.item || it.kind; });
        rows2.push({ d: Math.abs(o.x - g.x) + Math.abs(o.y - g.y), t: (gm().objName ? gm().objName(o) : o.type) + " " + gm().relDir(o.x, o.y) + ": " + (nm.length ? nm.slice(0, 4).join(", ") + (nm.length > 4 ? " и ещё " + (nm.length - 4) : "") : "пусто") });
      });
      rows2.sort(function (a, b) { return a.d - b.d; });
      return rows2.length ? d.n + ". " + rows2.slice(0, 6).map(function (r) { return r.t; }).join("; ") + "." : d.n + ": нетронутых хранилищ рядом нет.";
    }
    case "haggle": st.haggleT = Math.round(fx.dur * p.dur); return d.n + ": " + secW(Math.round(st.haggleT / 2)) + " скупщики платят на четверть больше.";
    case "mend": {
      var w3 = g.weapons[g.wi], a3 = g.armor, out3 = [], c3;
      if (w3 && (c3 = w3.cond == null ? 100 : w3.cond) < 100) { w3.cond = Math.min(100, c3 + Math.round(fx.w * p.k)); out3.push(w3.name + " — " + Math.round(w3.cond)); }
      if (a3 && (c3 = a3.cond == null ? 100 : a3.cond) < 100) { a3.cond = Math.min(100, c3 + Math.round(fx.a * p.k)); out3.push(a3.name + " — " + Math.round(a3.cond)); }
      return out3.length ? d.n + ": " + out3.join(", ") + " из 100." : d.n + ": оружие в руках и броня и так исправны.";
    }
  }
  return "";
}
/* модификации глубин после применения: пьющая, щитовая, обезболивающая, ускользающая, перекличная */
function deepAfter(id, d, p) {
  var g = G(), st = g.st, out = "";
  if (vamp > 0) { var hv = Math.min(Math.round(g.hpMax * 0.25), Math.round(vamp)), h0 = g.hp; vamp = 0; if (hv > 0) { g.hp = Math.min(g.hpMax, g.hp + hv); if (g.hp > h0) out += " Здоровье плюс " + (g.hp - h0) + "."; } }
  if (echoK) return out;
  if (has(id, "shielding")) { st.shield = Math.max(st.shield || 0, Math.round((20 + 2 * LAB.Le(g.L)) * p.k)); st.shieldT = Math.max(st.shieldT || 0, 30); out += " Щит " + st.shield + "."; }
  if (has(id, "numbing")) st.numbT = Math.max(st.numbT || 0, 16);
  if (has(id, "stepping")) st.phaseT = Math.max(st.phaseT || 0, 3);
  if (has(id, "census") && !(d.fx && d.fx.k === "census")) out += " " + censusText();
  return out;
}
/* такт: время действий глубин, след, отложенная боль, перегретые машины, кордон, чипы глубин */
function deepTick(g, st) {
  ["absorbT", "wardT", "foreT", "deferT", "cordonT", "heatT", "haggleT", "numbT"].forEach(function (k) { if (st[k] > 0) { st[k]--; if (!st[k]) offSay(k); } });
  var c0 = CUR();
  if (c0 && c0.key) { trailA.push({ k: c0.key, x: g.x, y: g.y }); if (trailA.length > 24) trailA.shift(); }
  if (!(st.deferT > 0) && st.deferPool > 0) { var dr = Math.max(1, Math.round(st.deferPool * 0.1)); st.deferPool = Math.max(0, st.deferPool - dr); g.hp = Math.max(1, g.hp - dr); }
  var C = LAB.combat;
  if (!C || !C.foes) return;
  var fs = C.foes();
  for (var i = 0; i < fs.length; i++) { var f = fs[i]; if (f.dgBoom > 0 && !f.dead) { f.dgBoom--; if (!f.dgBoom) boom(f); } }
  if (st.cordonT > 0) fs.forEach(function (f) { if (!f.dead && !f.ally && !f.calm && !f.boss && cheb2(f) <= 1) { shove(f, 1); f.slowT = Math.max(f.slowT || 0, 2); } });
  if (stat("mechslow") > 0) fs.forEach(function (f) { if (!f.dead && !f.ally && f.kind === "mech" && cheb2(f) <= 1) f.slowT = Math.max(f.slowT || 0, 2); });
  var br = stat("bleedres"); if (br > 0 && st.bleed > 0 && Math.random() < br) st.bleed--;
  var td = stat("toxdecay"); if (td > 0 && tickN % 4 === 0 && g.body && g.body.tox > 0) g.body.tox = Math.max(0, g.body.tox - td);
  var sr = stat("shieldregen");
  if (sr > 0 && tickN % 2 === 0 && Date.now() - (g.lastHurt || 0) > 5000) { var capS = Math.round(sr * (1 + LAB.Le(g.L) / 50)); if ((st.shield || 0) < capS) st.shield = Math.min(capS, (st.shield || 0) + 1 + Math.floor(capS / 40)); }
}
function boom(f) {
  var C = LAB.combat, g = G(), dmg = f.dgBoomD || 100, dt = f.dgBoomDt || "thermo", x = f.x, y = f.y;
  A("explosion", x, y, "bot");
  C.damageFoe(f, Math.round(dmg * 1.5), dt, { noarmor: true, quiet: true });
  var n = C.areaDamage ? C.areaDamage(x, y, 2, dmg, dt) : 0;
  if (Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= 1 && LAB.los(CUR().fl, CUR().fs, x, y, g.x, g.y) && C.hurtPlayer) C.hurtPlayer(Math.round(dmg * 0.3), "therm", null);
  LAB.say(fname(f) + " взрывается от перегрева" + (n ? ": задето ещё " + n : "") + ".", { interrupt: false });
}
/* удар по герою: теплоотвод, обезболивание, счётный щит, последний рубеж, отложенная боль, колючая кожа */
function deepHurt(fin, adt, src) {
  var g = G(), st = g.st;
  if (st.heatT > 0 && /^(therm|thermo|fire|heat)$/.test(adt || "")) { var hh = Math.max(1, Math.round(fin * 0.5)); g.hp = Math.min(g.hpMax, g.hp + hh); return 0; }
  var th = stat("thorns");
  if (th > 0 && src && src.hp != null && !src.dead && !src.ally && cheb2(src) <= 1 && LAB.combat) LAB.combat.damageFoe(src, Math.max(1, Math.round(fin * th)), "phys", { quiet: true, noarmor: true });
  if (st.numbT > 0) fin = Math.max(1, Math.round(fin * 0.7));
  if (st.absorbT > 0) { var ab = Math.round(fin * 0.5); fin -= ab; if (ab > 0) g.en = Math.min(g.enMax, g.en + Math.max(1, Math.round(ab / 3))); }
  var ll = stat("lastline"); if (ll > 0 && g.hp < g.hpMax / 3) fin = Math.max(1, Math.round(fin * (1 - ll)));
  if (st.deferT > 0 && fin > 0) { var now = Math.max(1, Math.round(fin / 3)); st.deferPool = (st.deferPool || 0) + (fin - now); fin = now; }
  if (LAB.chem && LAB.chem.hurtK) fin = LAB.chem.hurtK(fin, adt, src);
  return fin;
}
/* «Эхо» о потолке ступеней глубин: кибернетика, химия, ловушечное дело — сколько можно и сколько есть */
function stepNews() {
  var g = G(); if (!g || g.dead) return;
  var Ch = LAB.chem, Tr = LAB.traps, best = 0;
  CAT_ORDER.forEach(function (c) { best = Math.max(best, catLv(c)); });
  var t = "«Эхо»: глубже — и умения глубже. Кибернетика растёт теперь до ступени " + catCap() + " по направлению и до " + lvlCap() + " общей" +
    (Ch && Ch.brCap ? ", химия — до " + Ch.brCap() + " по направлению" : "") + (Tr && Tr.stageCap ? ", ловушечное дело — до " + Tr.stageCap() : "") + ". Сейчас: кибернетика — общая " + level() + ", лучшее направление — " + best +
    (Ch && Ch.level ? "; химия — общая " + Ch.level() : "") + (Tr && Tr.stage ? "; ловушечное дело — " + Tr.stage() : "") + ".";
  LAB.say(t, { interrupt: false });
}
/* последняя перекличка (и капсула последнего вдоха, chem.js): смертельный удар оставляет единицу */
function lastWard(fin) {
  var g = G(), st = g.st;
  if (fin >= g.hp && st.wardT > 0) {
    st.wardT = 0;
    var hv = Math.round(g.hpMax / 3);
    gm().later(function () { var g2 = G(); if (!g2 || g2.dead) return; g2.hp = Math.min(g2.hpMax, g2.hp + hv); A("play", "heal"); LAB.say("Последняя перекличка: «Седьмой — здесь». Здоровье " + g2.hp + ".", { prio: "urgent" }); }, 50);
    return Math.max(0, g.hp - 1);
  }
  if (LAB.chem && LAB.chem.lastStand) fin = LAB.chem.lastStand(fin);
  return fin;
}
/* после попадания оружием (chem.afterHit): добили — чипы динамо и костного мозга */
function onHit(w, f, dmg) {
  var g = G();
  if (!g || !f || !f.dead || f.dgKilled) return;
  f.dgKilled = 1;
  var ek = stat("enkill"); if (ek > 0) g.en = Math.min(g.enMax, g.en + Math.round(ek));
  var hk = stat("healkill"); if (hk > 0) g.hp = Math.min(g.hpMax, g.hp + Math.max(1, Math.round(g.hpMax * hk)));
}

LAB.implants = {
  CATS: CATS, CAT_ORDER: CAT_ORDER, MODS: MODS, DEF: DEF, def: def, isChip: isChip, tags: tags, chipOf: chipOf, lv: lv, mods: mods, has: has,
  power: power, costK: costK, neuroK: neuroK, reach: reach, stat: stat, dmgK: dmgK, applyStatic: applyStatic, run: run, used: used, tick: tick, onHurt: onHurt,
  scanR: scanR, scanExtra: scanExtra, level: level, catLv: catLv, catXp: catXp, gain: gain, slots: slots, capacity: capacity, modSlots: modSlots, maxGrade: maxGrade, selfSurgery: selfSurgery,
  install: install, useChip: useChip, pickup: pickup, extract: extract, dismantle: dismantle, upgrade: upgrade, addMod: addMod, delMod: delMod, compat: compat,
  tag: tagText, line: line, chips: chips, fixSave: fixSave, actIn: actIn, countText: countText, canon: canon, craftWhy: craftWhy, crafted: crafted, benchMenu: benchMenu, station: station, cyberMenu: cyberMenu, cyberText: cyberText, upPrice: upPrice, stock: stock,
  /* (после 4.1) глубины: ступени, данные, действия */
  deepStep: deepStep, catCap: catCap, lvlCap: lvlCap, CAT_XP: CAT_XP, ALL_XP: ALL_XP, catPerk: catPerk, allPerk: allPerk, load: load, params: params,
  DEEP_NEW: DEEP_NEW, DEEP_CHIPS: DEEP_CHIPS, DEEP_MODS: DEEP_MODS, onHit: onHit, deepTick: function () { var g = G(); if (g && g.st) deepTick(g, g.st); }, blockFrom: blockFrom
};
})();
