/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — лица помещений (1.5).
   У каждого коридора — до дюжины дверей с каждой стороны, на этаже —
   сотни кабинетов, на всех глубинах — сотни тысяч. Ни один не должен
   повторять другой: ни табличкой, ни описанием, ни хозяином, ни тем, что
   лежит в ящиках, ни записками. Генератор даёт каждому помещению:
   вариант типа — своё название на двери и своё описание (annex_var.js);
   хозяина, чьего имени больше нет нигде в игре (перестановка номеров на
   всю игру); состояние, одну-две подробности и след хозяина
   (annex_frag.js); записки — из частей одной темы, с именами людей этого
   этажа, номерами помещений и временем; журналы, заявки и слухи.
   Повторы: на одном этаже ни одна часть не встречается дважды (колоды),
   от этажа к этажу колоды глубины сдвигаются; на всю игру неповторимо
   сочетание частей. Без DOM — работает и в Node. Синтаксис — не новее
   ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function eraOf(L) { return L <= 10 ? "K" : L <= 20 ? "P" : L <= 40 ? "C" : L <= 60 ? "O" : L <= 80 ? "M" : "I"; }
function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function FR(e) { var f = LAB.ANNEX_F || {}; return f[e] || f.K || null; }
function NT(e) { var n = LAB.ANNEX_N || {}; return n[e] || null; }
function VR(t) { return (LAB.ANNEX_V || {})[t] || []; }
var ERA_NAME = { K: "«Ковчега»", P: "«Подножия»", C: "«Колыбели»", O: "«Отражения»", M: "«Механизма»", I: "«Истока»" };

/* ════════ ИМЕНА ════════
   Номер человека в игре g = глубина этажа × 512 + номер на этаже; сеть
   Фейстеля на двадцати битах переставляет номера, и из перестановки
   выходят пол, имя (64), отчество (32) и фамилия (256): у двух номеров —
   никогда одно и то же имя. «Подножие» — сорок лет назад: имена старше. */
var NM = {
  m: "Александр Алексей Анатолий Андрей Антон Аркадий Арсений Артём Богдан Борис Вадим Валентин Валерий Василий Виктор Виталий Владимир Владислав Всеволод Вячеслав Геннадий Георгий Герман Глеб Григорий Даниил Денис Дмитрий Евгений Егор Захар Иван Игнат Игорь Илья Кирилл Константин Лев Леонид Макар Максим Марат Матвей Михаил Назар Никита Николай Олег Павел Пётр Платон Роман Ростислав Руслан Савелий Семён Сергей Станислав Степан Тимофей Фёдор Филипп Юрий Ярослав".split(" "),
  f: "Агата Алевтина Александра Алина Алиса Алла Анастасия Ангелина Анна Антонина Арина Валентина Валерия Варвара Вера Вероника Виктория Галина Дарья Диана Ева Евгения Екатерина Елена Елизавета Жанна Зинаида Злата Инга Инна Ирина Карина Кира Клавдия Ксения Лариса Лидия Лилия Любовь Людмила Маргарита Марина Мария Милана Надежда Наталья Нина Оксана Олеся Ольга Полина Раиса Регина Римма Светлана Серафима София Станислава Таисия Тамара Ульяна Эмилия Юлия Яна".split(" "),
  om: "Аким Антип Артемий Афанасий Венедикт Гавриил Герасим Гордей Демьян Евсей Елизар Емельян Еремей Ерофей Зиновий Игнатий Илларион Ипполит Карп Клим Кондрат Кузьма Лаврентий Лука Митрофан Модест Осип Пантелей Парфён Порфирий Прохор Родион Савва Самсон Сидор Спиридон Терентий Тихон Трофим Устин Фаддей Филат Фома Фрол Харитон Аверьян Анисим Аристарх Власий Гурий Дорофей Евграф Ермолай Ефрем Исай Капитон Корней Лукьян Никанор Никодим Пахом Поликарп Тарас Феофан".split(" "),
  of: "Агафья Аграфена Акулина Анисья Анфиса Василиса Глафира Домна Евдокия Ефросинья Изольда Ираида Капитолина Лукерья Майя Марфа Матрёна Нелли Нонна Олимпиада Пелагея Прасковья Софья Стефанида Татьяна Устинья Фаина Феодосия Фёкла Христина Эльвира Элеонора Юлиана Ядвига Аделаида Аполлинария Ариадна Бронислава Ванда Виринея Гликерия Евпраксия Ия Калерия Клементина Леокадия Мавра Магдалина Мелания Милица Наина Неонила Нинель Павла Руфина Сусанна Фелицата Фотина Эмма Янина Агния Феврония Евлампия Пульхерия".split(" "),
  pat: "Александр:Александрович:Александровна Алексей:Алексеевич:Алексеевна Андрей:Андреевич:Андреевна Анатолий:Анатольевич:Анатольевна Аркадий:Аркадьевич:Аркадьевна Борис:Борисович:Борисовна Василий:Васильевич:Васильевна Виктор:Викторович:Викторовна Владимир:Владимирович:Владимировна Геннадий:Геннадьевич:Геннадьевна Георгий:Георгиевич:Георгиевна Григорий:Григорьевич:Григорьевна Дмитрий:Дмитриевич:Дмитриевна Евгений:Евгеньевич:Евгеньевна Иван:Иванович:Ивановна Игорь:Игоревич:Игоревна Илья:Ильич:Ильинична Константин:Константинович:Константиновна Леонид:Леонидович:Леонидовна Михаил:Михайлович:Михайловна Николай:Николаевич:Николаевна Олег:Олегович:Олеговна Павел:Павлович:Павловна Пётр:Петрович:Петровна Роман:Романович:Романовна Семён:Семёнович:Семёновна Сергей:Сергеевич:Сергеевна Степан:Степанович:Степановна Тимофей:Тимофеевич:Тимофеевна Фёдор:Фёдорович:Фёдоровна Юрий:Юрьевич:Юрьевна Яков:Яковлевич:Яковлевна".split(" ").map(function (s) { return s.split(":"); }),
  sur: ("Агапов Агафонов Акимов Аксёнов Алтухов Анисимов Антипов Архипов Афонин Бабкин Байков Баранов Барсуков Батурин Беляков Бирюков Блинов Бобылёв Болдырев Борисов Бочаров Брагин Бровкин Брусникин Булавин Бурмистров Бурцев Вахрушев Вдовин Веденеев Верёвкин Вишняков Воробьёв Воронин Вострецов Вьюгин Гаврилин Галанин Голованов Головин Голубков Горелов Горшков Грибов Гринёв Губанов Гудков Гуров Гусев Дворников Демьянов Дербенёв Дмитриев Добрынин Должиков Дорофеев Дубинин Дудин Дьячков Евдокимов Елисеев Емельянов Еремеев Ерохин Есипов Жилин Журов Забродин Завьялов Звонарёв Зеленин Зимогоров Золотов Зыков Ивлев Игнатьев Изотов Илюхин Исаков Кабанов Калмыков Камышев Капитонов Караваев Карпухин Касаткин Каштанов Кедров Кирюхин Клеменов Ключников Кобзев Ковригин Кожевников Колосов Колчин Комлев Коновалов Коротков Костров Красильников Кречетов Кругликов Кудинов Кукушкин Кулагин Куприянов Курочкин Лапшин Ларин Латышев Левашов Ледяев Липатов Лобанов Логинов Лукьянов Мазуров Макеев Маркелов Масленников Матвеев Мещеряков Минаев Мишин Молчанов Мордвинов Мурашов Мухин Наумов Носков Овчинников Огнев Одинцов Олейников Ордынцев Осокин Остапов Парамонов Пастухов Пермяков Пивоваров Поляков Полозов Порошин Пряхин Птицын Пушкарёв Радугин Раков Рогачёв Ромашов Рудаков Рыжов Рябцев Савватеев Садовников Самохин Самсонов Сапожников Сафонов Свешников Селиванов Серебряков Синицын Снегирёв Сотников Спиридонов Старостин Стёпин Столяров Стрижов Субботин Суханов Сычёв Тарханов Телегин Темников Терехов Тимохин Тишков Травин Трубников Устюжанин Филимонов Фокин Фурсов Холмогоров Хохлов Чеботарёв Чесноков Чистяков Чугунов Чуканов Шадрин Шалимов Шевелёв Шумилов Щербаков Юрасов Юшков Ягодин Якимов Ямщиков Ясенев " +
    "Полянский Сокольский Ельницкий Яблонский Карельский Боровский Каменский Озерецкий Ракитский Сосновский Ковальский Залесский Подольский Рябинский Верховский Заборский Ветлицкий Кедровский " +
    "Бондаренко Гончаренко Карпенко Левченко Мирошниченко Науменко Остапенко Ткаченко Федоренко Юрченко Ярошенко Демченко Нестеренко Хоменко Павленко Гордиенко Головко Бойко Ковальчук Мельничук Полищук Олейник Гнатюк Данилюк Ткачук Лукашевич Карпович Юркевич Матусевич Седых Черных Долгих Мягких").split(" "),
  kidm: "Петя Ваня Миша Саша Дима Костя Лёша Серёжа Гоша Тёма Федя Стёпа Вова Никита Митя Глеб".split(" "),
  kidf: "Маша Соня Аня Катя Лиза Даша Настя Варя Поля Ася Таня Надя Оля Вера Женя Лена".split(" ")
};
function femSur(s) {
  if (/(ов|ев|ёв|ин|ын)$/.test(s)) return s + "а";
  if (/(ск|цк)ий$/.test(s)) return s.slice(0, -2) + "ая";
  return s; /* -ко, -ук, -юк, -ич, -их, -ых, -ик — не склоняются */
}
function feistel20(x, key) {
  var l = (x >>> 10) & 1023, r = x & 1023;
  for (var i = 0; i < 4; i++) { var f = h32(key + ":" + i + ":" + r) & 1023, nl = r; r = l ^ f; l = nl; }
  return ((l << 10) | r) >>> 0;
}
function gid(L, F, local) { return (LAB.depth(L, F) * 512 + (local & 511)) >>> 0; }
/* Обозначение машины «Механизма»: код по должности и номер. */
var MCODE = [[/регистр/, "РГ"], [/счёт|счет|учёт|учет|сверк/, "СЧ"], [/курьер|доставк|почт/, "КР"], [/штемпел|печат|сургуч/, "ШТ"], [/инспект|контрол|провер/, "ИН"], [/час|врем/, "ЧС"], [/машинопис|набор|пишущ/, "МП"], [/приём|прием|окн/, "ПР"], [/смаз|масл/, "СМ"], [/сторож|охран|караул/, "СТ"], [/архив/, "АР"], [/калибр|настро|эталон/, "КЛ"], [/жалоб|претенз|возраж/, "ЖБ"], [/бланк|форм/, "БЛ"], [/пружин|завод/, "ПЖ"], [/шестер|механик/, "ШС"], [/пломб/, "ПЛ"], [/билет|талон|очеред/, "ТЛ"], [/чернил/, "ЧН"], [/сказ|сон/, "СК"], [/сад|сем/, "СД"]];
var MANY = ["УЗ", "ТК", "РЛ", "ДМ", "ОП", "ВН"];
/* Человек по номеру: имя, отчество, фамилия, дети и супруг; в «Механизме» — машина. */
function person(seed, L, F, local, post, opt) {
  opt = opt || {};
  var era = opt.era || eraOf(L), g = gid(L, F, local), p = feistel20(g, "nm|" + seed);
  if (era === "M") {
    var pst = String(post || ""), code = null;
    for (var i = 0; i < MCODE.length && !code; i++) if (MCODE[i][0].test(pst)) code = MCODE[i][1];
    if (!code) code = MANY[p % MANY.length];
    var num = 100 + (feistel20(g, "mc|" + seed) % 900), des = code + "-" + num;
    return { g: g, m: true, f: false, first: des, sur: des, io: des, fio: des, sign: des, post: pst, era: era };
  }
  var fem = opt.fem != null ? !!opt.fem : (p & 1) === 1, q = p >>> 1;
  var old = era === "P", fi = q & 63, pi = (q >>> 6) & 31, si = (q >>> 11) & 255;
  var first = (old ? (fem ? NM.of : NM.om) : (fem ? NM.f : NM.m))[fi % 64] || "Анна";
  var pa = NM.pat[pi % 32], pat = fem ? pa[2] : pa[1];
  var s0 = NM.sur[si % NM.sur.length], sur = fem ? femSur(s0) : s0;
  var hk = h32("fam|" + seed + "|" + g), kidF = (hk & 1) === 1;
  var kid = (kidF ? NM.kidf : NM.kidm)[(hk >>> 1) % 16];
  var sp = (fem ? NM.m : NM.f)[(hk >>> 5) % 64];
  if (old) sp = (fem ? NM.om : NM.of)[(hk >>> 5) % 64];
  return { g: g, f: fem, first: first, pat: pat, sur: sur, io: first + " " + pat, fio: first + " " + pat + " " + sur, sign: first.charAt(0) + ". " + sur, kid: kid, kidF: kidF, spouse: sp, post: post || "", era: era };
}
/* Должность в женском роде, если она другая. */
function postFor(v, fem) { return fem && v && v.postf ? v.postf : v ? v.post : ""; }

/* ════════ КОЛОДЫ ════════
   Перестановка набора — одна на уровень; этаж берёт своё окно в ней:
   на этаже нет повторов, соседние этажи начинаются с разных мест. */
var permCache = {}, permKeys = [];
function levelPerm(seed, key, n, weights) {
  var k = seed + "|" + key + "|" + n;
  if (permCache[k]) return permCache[k];
  var r = LAB.Rng(seed, "aperm:" + key), p = [], i;
  if (weights) {
    /* взвешенная перестановка: ключ u^(1/w) — тяжёлые раньше */
    var ks = [];
    for (i = 0; i < n; i++) ks.push([Math.pow(r.next() || 1e-9, 1 / Math.max(0.05, weights[i] || 1)), i]);
    ks.sort(function (a, b) { return b[0] - a[0]; });
    for (i = 0; i < n; i++) p.push(ks[i][1]);
  } else { for (i = 0; i < n; i++) p.push(i); r.shuffle(p); }
  permCache[k] = p; permKeys.push(k);
  if (permKeys.length > 600) delete permCache[permKeys.shift()];
  return p;
}
function Deck(seed, key, n, start) {
  var p = n ? levelPerm(seed, key, n) : [], i = 0;
  start = n ? ((start % n) + n) % n : 0;
  return { n: n, next: function () { if (!n) return -1; var v = p[(start + i) % n]; i++; return v; }, left: function () { return n - i; } };
}

/* ════════ ПОДСТАНОВКИ ════════ */
var HOURS = ["ноль", "час", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать", "двадцать", "двадцать один", "двадцать два", "двадцать три"];
var MINS = ["ровно", "ноль пять", "десять", "пятнадцать", "двадцать", "двадцать пять", "тридцать", "тридцать пять", "сорок", "сорок пять", "пятьдесят", "пятьдесят пять"];
var DAYS = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"];
function timeWords(t) { t = ((t | 0) % 1440 + 1440) % 1440; var h = Math.floor(t / 60), m = Math.floor((t % 60) / 5); return HOURS[h] + " " + MINS[m]; }
function render(tpl, c) {
  c = c || {};
  var au = c.au || {}, s = String(tpl || "");
  s = s.replace(/\[([^\]|]*)\|([^\]]*)\]/g, function (m0, a, b) { return au.f ? b : a; });
  s = s.replace(/\{([^{}]+)\}/g, function (m0, k) {
    var to = c.to || {}, s3 = c.s3 || {};
    switch (k) {
      case "имя": return au.first || "хозяин";
      case "ио": return au.io || au.first || "хозяин";
      case "фам": return au.sur || "";
      case "фио": return au.fio || "";
      case "подпись": return au.sign || "";
      case "пост": return au.post || "сотрудник";
      case "кому_имя": return to.first || "коллега";
      case "кому_ио": return to.io || to.first || "коллега";
      case "кому_фам": return to.sur || "";
      case "кому_подпись": return to.sign || "";
      case "кому_пост": return to.post || "сотрудник";
      case "сосед_фио": return s3.fio || s3.sign || "сосед";
      case "сосед_подпись": return s3.sign || "сосед";
      case "сосед_пост": return s3.post || "сотрудник";
      case "номер": return String(c.n1 || 1);
      case "номер2": return String(c.n2 || c.n1 || 2);
      case "мой_номер": return String(c.mn || c.n1 || 1);
      case "помещение": return c.rn || "Кладовая";
      case "время": return timeWords(c.tm == null ? 480 : c.tm);
      case "вдень": return DAYS[(c.wd || 0) % 7];
      case "ребёнок": return au.kid || "Маша";
      case "сын_дочь": return au.kidF ? "дочь" : "сын";
      case "супруг": return au.spouse || "";
      case "муж_жена": return au.f ? "муж" : "жена";
    }
    return m0;
  });
  /* заглавная в начале и после конца предложения */
  s = s.replace(/^(\s*[«„—\s]*)([а-яё])/, function (m0, a, b) { return a + b.toUpperCase(); });
  s = s.replace(/([.!?…]\s+[«„]?)([а-яё])/g, function (m0, a, b) { return a + b.toUpperCase(); });
  return s;
}

/* ════════ ТЕМЫ УРОВНЕЙ ════════
   Кабинеты ближе к делу уровня встречаются чаще: на уровне медблока —
   медицинские, в гидропонике — теплицы и склады семян. */
var TAGS = [["med", /мед|врач|лекар|больн|аптек|лазарет|рентген|физиотерап|санит/], ["chem", /хим|реактив|раствор|кислот|газ/], ["bio", /био|ген|клетк|химер|вольер|образц|культур/], ["plant", /тепли|растен|сад|гидропон|грядк|семен|гриб|оранжер|ферм|корм/], ["guard", /охран|пост|караул|досмотр|проходн|оружей|арсенал/], ["office", /офис|кабинет|бухгалт|архив|канцеляр|кадр|совещ|копир/], ["tech", /инжен|техн|мастерск|ремонт|механ|робот|слесар|станк/], ["power", /энерг|реактор|магнетрон|генерат|электр|щит|кабел|аккумул|батаре/], ["comp", /компьют|сервер|вычисл|данн|связ|радио/], ["home", /жил|кают|спальн|кухн|столов|буфет|отдых|душ|прачеч|досуг/], ["store", /склад|кладов|хранил|стеллаж|ящик/], ["water", /вод|насос|бак|труб|колод|река|пруд/], ["mine", /бур|шахт|клет|забой|горизонт|пород|скважин|лебёд|керн|руд/], ["sound", /звук|песн|поют|звон|эхо|слуша|колокол|хор/]];
function tagsOf(text) { var t = String(text || "").toLowerCase(), out = {}; TAGS.forEach(function (q) { if (q[1].test(t)) out[q[0]] = 1; }); return out; }
var levelTagCache = {};
function levelTags(L) {
  if (levelTagCache[L]) return levelTagCache[L];
  var lev = LAB.LEVELS[L] || {}, txt = (lev.name || "") + " " + (lev.desc || "");
  (lev.rooms || []).forEach(function (rt) { var d = LAB.ROOMS[rt]; if (d) txt += " " + d.n; });
  return (levelTagCache[L] = tagsOf(txt));
}
function affinity(L, def, v) {
  var lt = levelTags(L), tt = tagsOf((def.n || "") + " " + (def.desc || "") + " " + (v ? v.n + " " + v.d : "")), k = 0;
  for (var t in tt) if (lt[t]) k++;
  return 1 + 1.2 * Math.min(2, k);
}

/* ════════ ГЕНЕРАТОР ЭТАЖА ════════ */
function Gen(seed, L, F, nSpots) {
  this.seed = seed; this.L = L; this.F = F; this.era = eraOf(L);
  this.n = Math.max(40, nSpots || 200);
  this.r = LAB.Rng(seed, "agen:" + L + ":" + F);
  this.decks = {};
  this.people = [];
  this.usedNames = {};
}
var GP = Gen.prototype;
/* Колода по ключу: per — сколько берут с этажа (сдвиг окна от этажа к этажу). */
GP.deck = function (key, n, per) {
  var d = this.decks[key];
  if (!d) d = this.decks[key] = Deck(this.seed, key + "|L" + this.L, n, (this.F - 1) * Math.max(1, Math.round(per || n / 3)));
  return d;
};
GP.from = function (key, arr, per) {
  if (!arr || !arr.length) return null;
  var i = this.deck(key, arr.length, per).next();
  return i < 0 ? null : arr[i];
};
/* Человек этажа (хозяин помещения, автор, адресат). */
GP.person = function (local, post, opt) {
  var p = person(this.seed, this.L, this.F, local, post, Object.assign({ era: this.era }, opt || {}));
  if (p.m) { var guard = 0; while (this.usedNames[p.sign] && guard++ < 50) { p = person(this.seed, this.L, this.F, local + 97 * guard, post, { era: this.era }); } }
  this.usedNames[p.sign] = 1;
  return p;
};

/* ── Типы и варианты ──
   Колода пар «тип + вариант» своей глубины, взвешенная по теме уровня;
   в «Истоке» к своим добавлены комнаты прошлых глубин — «вшитые». */
GP.typeDeck = function (pool) {
  if (this._td) return this._td;
  var items = [], w = [], self = this, era = this.era;
  var addType = function (t, e, k, sewn) {
    var def = (LAB.ANNEX_ROOMS || {})[t]; if (!def) return;
    var vs = VR(t), any = false;
    vs.forEach(function (v, vi) {
      if (!v || !v.e || v.e.indexOf(e) < 0) return;
      items.push({ t: t, vi: vi, sewn: sewn }); w.push(affinity(self.L, def, v) * k); any = true;
    });
    if (!any) { items.push({ t: t, vi: -1, sewn: sewn }); w.push(affinity(self.L, def, null) * k); }
  };
  pool.forEach(function (t) { addType(t, era === "O" && !VR(t).some(function (v) { return v.e && v.e.indexOf("O") >= 0; }) ? "K" : era, 1, null); });
  if (era === "I") ["K", "P", "C", "M"].forEach(function (e2) {
    for (var t in LAB.ANNEX_ROOMS) { var d = LAB.ANNEX_ROOMS[t]; if (d.kind || !d.era || d.era.indexOf(e2) < 0 || d.era.indexOf("I") >= 0) continue; addType(t, e2, 0.22, e2); }
  });
  var perm = levelPerm(this.seed, "types|" + era + "|L" + this.L, items.length, w);
  var start = ((this.F - 1) * this.n) % Math.max(1, items.length);
  this._td = { items: items, perm: perm, pos: 0, start: start, taken: {}, cnt: 0 };
  return this._td;
};
/* Следующая пара, которой ещё не было на этаже и чей тип не встречался в этом коридоре. */
GP.nextType = function (pool, usedInCorr) {
  var td = this.typeDeck(pool), n = td.items.length;
  if (!n) return null;
  /* все пары этажа разобраны — колода по второму кругу (так бывает только на огромных этажах) */
  if (td.cnt >= n) { td.taken = {}; td.cnt = 0; }
  var spare = -1;
  for (var k = 0; k < n; k++) {
    var j = td.perm[(td.start + td.pos + k) % n];
    if (td.taken[j]) continue;
    if (spare < 0) spare = j;
    if (usedInCorr && usedInCorr[td.items[j].t]) continue;
    return this._take(j);
  }
  return spare >= 0 ? this._take(spare) : null;
};
/* Вариант особого помещения (тайник, режимный кабинет, пост дезактивации, горячая
   камера…): у каждого типа своя колода по уровню — на этаже без повторов. */
GP.variantFor = function (t) {
  this._vd = this._vd || {};
  var vd = this._vd[t];
  if (!vd) {
    var vs = VR(t), era = this.era, idxs = [];
    vs.forEach(function (v, vi) { if (v && v.e && v.e.indexOf(era) >= 0) idxs.push(vi); });
    if (!idxs.length && era === "O") vs.forEach(function (v, vi) { if (v && v.e && v.e.indexOf("K") >= 0) idxs.push(vi); });
    if (!idxs.length) return null;
    vd = this._vd[t] = { idxs: idxs, perm: levelPerm(this.seed, "spec|" + t + "|" + era + "|L" + this.L, idxs.length), pos: ((this.F - 1) * 3) % idxs.length };
  }
  var j = vd.perm[vd.pos % vd.idxs.length]; vd.pos++;
  return { t: t, vi: vd.idxs[j] };
};
GP._take = function (j) {
  var td = this._td, n = td.items.length;
  td.taken[j] = 1; td.cnt++;
  for (var g = 0; g < n && td.taken[td.perm[(td.start + td.pos) % n]]; g++) td.pos++;
  return td.items[j];
};

/* ── Описание помещения ──
   Подробность, которая говорит о мебели (стол, полка, шкаф, койка, диван…),
   берётся, только если такая вещь в помещении есть. */
var NEEDS = [
  [/(^|[^а-яё])стол(?!б|иц|ь|ет|овая|овой|овую|овые|овых)/i, ["desk", "table", "labbench", "counter", "dutydesk", "serving", "comp", "pc", "typewriter"]],
  [/(^|[^а-яё])(полк|полоч|стеллаж)/i, ["shelf", "bookshelf", "cabinet", "seedjars", "toolwall", "barrels"]],
  [/(^|[^а-яё])ящик/i, ["desk", "cabinet", "crate", "locker", "nightstand", "table", "counter", "dutydesk"]],
  [/(^|[^а-яё])шкаф/i, ["cabinet", "locker", "suitlocker", "firstaid", "fridge", "coldroom", "rack"]],
  [/(^|[^а-яё])(кроват|койк|матрас|постел|нар[ыа])/i, ["bunk", "couch", "sensorbed", "cradle", "optable"]],
  [/(^|[^а-яё])диван/i, ["sofa"]], [/(^|[^а-яё])кресл/i, ["armchair", "rocking", "neurochair"]], [/(^|[^а-яё])стул/i, ["chair", "table", "desk", "dutydesk"]],
  [/(^|[^а-яё])раковин/i, ["sink"]], [/(^|[^а-яё])чайник/i, ["kettle", "samovar", "stove"]], [/(^|[^а-яё])холодильник/i, ["fridge", "coldroom"]],
  [/(^|[^а-яё])(компьютер|монитор)/i, ["comp", "pc", "screens", "monitors"]], [/(^|[^а-яё])вешалк/i, ["hangers", "suitlocker", "locker"]],
  [/(^|[^а-яё])тумбочк/i, ["nightstand"]], [/(^|[^а-яё])(прилавк|стойк)/i, ["counter", "dutydesk", "serving", "rack", "supply"]]
];
function fitsRoom(text, have) {
  if (!have || !text) return true;
  for (var i = 0; i < NEEDS.length; i++) if (NEEDS[i][0].test(text) && !NEEDS[i][1].some(function (k) { return have[k]; })) return false;
  return true;
}
/* Следующая подходящая к обстановке строка колоды (не больше шести попыток). */
GP.fromFit = function (key, arr, per, have, bad) {
  if (!arr || !arr.length) return null;
  var d = this.deck(key, arr.length, per);
  for (var t = 0; t < 6; t++) {
    if (d.left() <= 0) return null; /* колода этажа кончилась — второго круга нет: лучше без подробности, чем повтор */
    var v = arr[d.next()];
    if (v && fitsRoom(v, have) && !(bad && bad.test(v))) return v;
  }
  return null;
};
/* Сколько строк ещё осталось в колоде этажа. */
GP.left = function (key, arr, per) { return arr && arr.length ? this.deck(key, arr.length, per).left() : 0; };
var CATS = ["smell", "sound", "touch", "floor", "thing", "wall"];
var SEWN = ["Эта комната будто вшита сюда из {era}: стык виден по шву в полу, где один настил переходит в другой.", "«Эхо» говорит, что эта комната — из {era}: её сюда принесло, как приносит река.", "Здесь кончается «Исток» и начинается кусок {era}: даже воздух за порогом другой.", "Стены этой комнаты помнят {era}: под ладонью — их прежняя кладка, сквозь неё проросли корни.", "Комната пришла сюда из {era} целиком, вместе с запахом и тишиной, и ещё не привыкла к новому месту."];
var MIRROR = ["Всё как в настоящем «Ковчеге», только надписи читаются задом наперёд.", "Это отражение кабинета «Ковчега»: «Эхо» переворачивает надписи, прежде чем прочитать.", "Комната повторяет свою копию наверху, но зеркально: дверь открывается не в ту сторону.", "Здесь всё стоит наоборот, как в зеркале, и холоднее, чем должно быть.", "Отражение держится крепко, но шаги в нём возвращаются на полсекунды раньше."];
GP.stateFor = function (rm, def, opt) {
  var r = this.r, fr = FR(this.era), self = this;
  /* состояние берётся, только пока у него на этаже остались свои фразы */
  var ok = function (k) { return !!(fr && fr.state && fr.state[k] && self.left("st:" + self.era + ":" + k, fr.state[k], 3) > 0); };
  var pick = function (w) { for (var k in w) if (!ok(k)) delete w[k]; var any = false; for (var q in w) { any = true; break; } return any ? r.weighted(w) : null; };
  if (opt && opt.secret) return pick({ dust: 7, sealed: 3 });
  if (def.kind === "locked") return r.chance(0.75) ? pick({ sealed: 1, tidy: 1 }) : null;
  if (def.kind === "hazard" || rm.rad >= 3) return r.chance(0.6) ? pick({ sealed: 1, dust: 1 }) : null;
  if (!r.chance(0.32)) return null;
  var w = { tidy: 2, hurry: 3, ransacked: 2, barricade: 1, flooded: 0.7, burnt: 0.7, lived: 1, sealed: 0.6, dust: 1.4, fresh: 0.8, dark: 1 };
  if (rm.zone === -1) { w.hurry += 1; w.fresh += 0.5; }
  if (this.F > 14) { w.dust += 1; w.dark += 0.5; }
  return pick(w);
};
GP.describe = function (rm, def, it, owner, opt) {
  opt = opt || {};
  var fr = FR(this.era), r = this.r, parts = [], v = it && it.vi >= 0 ? VR(it.t)[it.vi] : null, have = opt.have || null;
  parts.push(v ? v.d : def.desc);
  if (owner) parts.push(owner.m ? "На двери — бирка: «" + cap(owner.post) + ", " + owner.sign + "»." : "На двери изнутри — табличка: «" + cap(owner.post) + " " + owner.sign + "».");
  var stt = opt.state !== undefined ? opt.state : this.stateFor(rm, def, opt);
  if (stt && fr && fr.state && fr.state[stt] && fr.state[stt].length) {
    var sp = this.fromFit("st:" + this.era + ":" + stt, fr.state[stt], 3, have);
    if (sp) parts.push(sp);
  }
  if (fr) {
    /* одна-две подробности разных видов; вид — по размеру набора: чем больше, тем чаще */
    var cats = CATS.filter(function (c) { return fr[c] && fr[c].length; }), want = r.chance(0.55) ? 2 : 1, got = 0, used = {};
    for (var tries = 0; got < want && tries < 8 && cats.length; tries++) {
      var tot = 0; cats.forEach(function (c) { if (!used[c]) tot += fr[c].length; });
      var x = r.next() * tot, cat = null;
      for (var ci = 0; ci < cats.length; ci++) { var c = cats[ci]; if (used[c]) continue; x -= fr[c].length; if (x < 0) { cat = c; break; } }
      if (!cat) break;
      used[cat] = 1;
      if (stt === "flooded" && cat === "floor") continue;
      /* без света и вентиляции — не про лампы и тёплый воздух из решётки */
      var ph = this.fromFit("fr:" + this.era + ":" + cat, fr[cat], Math.ceil(this.n * 1.6 * fr[cat].length / Math.max(1, tot)), have, stt === "dark" ? /вентиляц|решётк|ламп|светит|гудит/i : null);
      if (ph) { parts.push(ph); got++; }
    }
    if (owner && fr.trace && fr.trace.length && r.chance(0.45)) {
      var tr = this.fromFit("tr:" + this.era, fr.trace, Math.ceil(this.n * 0.2), have);
      if (tr) parts.push(render(tr, { au: owner }));
    }
  } else if (LAB.annex && LAB.annex.DETAIL) {
    var dl = LAB.annex.DETAIL[this.era] || LAB.annex.DETAIL.K;
    parts.push(this.from("dt:" + this.era, dl, 30));
  }
  /* фразы о «вшитых» комнатах и об отражении — каждая не больше раза на этаже */
  if (it && it.sewn && this.deck("sewn", SEWN.length, SEWN.length).left() > 0 && r.chance(0.5)) parts.push(this.from("sewn", SEWN, SEWN.length).replace("{era}", ERA_NAME[it.sewn] || "прошлых глубин"));
  if (this.era === "O" && def.era && def.era.indexOf("K") >= 0 && this.deck("mirror", MIRROR.length, MIRROR.length).left() > 0 && r.chance(0.1)) parts.push(this.from("mirror", MIRROR, MIRROR.length));
  return parts.filter(Boolean).join(" ");
};
/* Подробность для основного помещения уровня: состояние или одна деталь. */
GP.mainDetail = function (rm, have) {
  var fr = FR(this.era), r = this.r;
  if (!fr) return "";
  if (r.chance(0.3) && fr.state) { var k = r.pick(["tidy", "hurry", "ransacked", "dust", "fresh", "dark"]); if (fr.state[k] && fr.state[k].length) { var sv = this.fromFit("st:" + this.era + ":" + k, fr.state[k], 3, have); if (sv) { rm.state = k; return sv; } } }
  var cat = r.pick(CATS.filter(function (c) { return fr[c] && fr[c].length; }));
  return cat ? this.fromFit("fr:" + this.era + ":" + cat, fr[cat], Math.ceil(this.n * 1.6 / 6), have) || "" : "";
};
/* Износ вещи обстановки: по классу вещи и номеру предмета (без колоды — вещей на этаже сотни). */
GP.wear = function (cls, salt) {
  var fr = FR(this.era); if (!fr || !fr.fxwear || !fr.fxwear[cls] || !fr.fxwear[cls].length) return "";
  var a = fr.fxwear[cls]; return a[h32(salt + "|" + this.L + "|" + this.F) % a.length];
};

/* ════════ ЗАПИСКИ ════════
   Ссылка на записку (src) хранит номера частей, людей и помещений:
   текст собирается заново где угодно, без этажа под рукой. */
GP.noteSrc = function (author, to, s3, rooms, myNum, opt) {
  opt = opt || {};
  var nt = NT(this.era), r = this.r;
  if (!nt || !nt.topics || !nt.topics.length) return null;
  var ti = opt.topic != null ? opt.topic : this.deck("nt:" + this.era, nt.topics.length, Math.ceil(this.n / 8)).next();
  var tp = nt.topics[ti];
  if (!tp) return null;
  var key = "np:" + this.era + ":" + ti + ":";
  var pick = function (self, part, arr) { return arr && arr.length ? self.deck(key + part, arr.length, 3).next() : -1; };
  var o = pick(this, "o", tp.open), b = pick(this, "b", tp.body), x = r.chance(0.6) ? pick(this, "x", tp.extra) : -1, c = pick(this, "c", tp.close);
  var t = tp.t && tp.t.length ? r.int(0, tp.t.length - 1) : 0;
  var r1 = rooms && rooms.length ? r.pick(rooms) : null, r2 = rooms && rooms.length > 1 ? r.pick(rooms) : r1;
  if (r2 === r1 && rooms && rooms.length > 1) r2 = rooms[(rooms.indexOf(r1) + 1) % rooms.length];
  return { note: "agen", e: this.era, k: ti, p: [o, b, x, c, t], a: author ? author.g : 0, ap: author ? author.post : "", af: author && author.f ? 1 : 0, ae: author && author.era !== this.era ? author.era : undefined,
    to: to ? to.g : 0, tp: to ? to.post : "", s: s3 ? s3.g : 0, sp: s3 ? s3.post : "", n1: r1 ? r1.num : 0, n2: r2 ? r2.num : 0, rn: r1 ? r1.name : "", mn: myNum || 0,
    tm: (6 * 60 + r.int(0, 17 * 12) * 5), wd: r.int(0, 6), L: this.L, F: this.F };
};
/* Человек по ссылке записки (номер g хранит и этаж, и место на нём). */
function personByG(seed, g, post, era, fem) {
  var d = Math.floor(g / 512), local = g % 512, L = Math.floor(d / LAB.FLOORS_N) + 1, F = (d % LAB.FLOORS_N) + 1;
  return person(seed, L, F, local, post, { era: era, fem: fem });
}
function seedNow() { var gm = LAB.game; return gm && gm.G ? gm.G.seed : "s"; }
function noteText(src) {
  var nt = NT(src.e), tp = nt && nt.topics ? nt.topics[src.k] : null;
  if (!tp) return { t: "Записка", x: "Буквы расплылись: не прочитать.", a: "" };
  var seed = seedNow();
  var au = src.a ? personByG(seed, src.a, src.ap, src.ae || src.e, src.af ? true : null) : null;
  var to = src.to ? personByG(seed, src.to, src.tp, src.e) : null;
  var s3 = src.s ? personByG(seed, src.s, src.sp, src.e) : null;
  var c = { au: au || {}, to: to || {}, s3: s3 || {}, n1: src.n1, n2: src.n2, mn: src.mn, rn: src.rn, tm: src.tm, wd: src.wd };
  var p = src.p || [], seg = [];
  if (p[0] >= 0 && tp.open) seg.push(tp.open[p[0]]);
  if (p[1] >= 0 && tp.body) seg.push(tp.body[p[1]]);
  if (p[2] >= 0 && tp.extra) seg.push(tp.extra[p[2]]);
  if (p[3] >= 0 && tp.close) seg.push(tp.close[p[3]]);
  var title = tp.t && tp.t.length ? tp.t[(p[4] || 0) % tp.t.length] : "Записка";
  return { t: render(title, c), x: render(seg.filter(Boolean).join(" "), c), a: au ? cap(au.post || "сотрудник") + " " + au.sign : "" };
}
/* Журнал, заявки, слухи: строки из наборов глубины, с людьми и номерами этажа. */
GP.lines = function (kind, n, ctxs) {
  var nt = NT(this.era), arr = nt && nt[kind];
  if (!arr || !arr.length) return [];
  var out = [], self = this;
  for (var i = 0; i < n; i++) {
    var ln = this.from("ln:" + this.era + ":" + kind, arr, Math.ceil(this.n / 4));
    if (!ln) break;
    var c = ctxs[i % ctxs.length] || {};
    out.push(render(ln, c));
  }
  return out;
};

/* ════════ ТЕЛА ════════
   Кто это был: должность по глубине, одежда (что можно снять), поза,
   что рядом. Номер человека — тот, что дал этаж (o.who), поэтому имя на
   жетоне неповторимо. */
var POSTS = {
  K: [["лаборант", "coat"], ["охранник", "vest"], ["техник", "suit"], ["инженер", "suit"], ["уборщик", "suit"], ["повар", "coat"], ["врач", "coat"], ["программист", "none"], ["генетик", "coat"], ["связист", "suit"], ["дозиметрист", "radcape"], ["химик", "coat"], ["монтажник", "suit"], ["оператор реактора", "radsuit"]],
  P: [["буровик", "robe"], ["помощник бурильщика", "robe"], ["машинист лебёдки", "robe"], ["горный мастер", "robe"], ["взрывник", "robe"], ["геофизик", "coat"], ["ламповщик", "robe"], ["стволовой", "robe"]],
  C: [["поселенец смены В", "none"], ["садовник смены В", "none"], ["разведчик отряда «Альфа»", "vest"], ["связист смены В", "suit"]],
  O: [["лаборант", "coat"], ["охранник", "vest"], ["техник", "suit"], ["инженер", "suit"], ["дозиметрист", "radcape"]],
  M: [["разведчик отряда «Альфа»", "vest"], ["механик отряда «Альфа»", "suit"]],
  I: [["садовник", "none"], ["инженер", "suit"], ["разведчик", "vest"]]
};
var OUTFIT = { suit: ["рабочий комбинезон", "снять рабочий комбинезон", "suit"], vest: ["бронежилет", "снять бронежилет", "vest"], radcape: ["свинцовый фартук", "снять свинцовый фартук", "radcape"], radsuit: ["противорадиационный комбинезон", "снять противорадиационный комбинезон", "radsuit"], robe: ["брезентовая роба", "снять брезентовую робу", "g_rigrobe"], coat: ["белый халат", "", ""], none: ["простая одежда", "", ""] };
var POSE = ["лежит лицом к двери, будто шёл навстречу", "сидит, привалившись к стене, руки сложены на коленях", "лежит на боку, подтянув колени", "лежит у стола, рядом — опрокинутый стул", "лежит у батареи, где теплее", "лежит на спине, одна рука откинута в сторону", "сидит в углу, обняв рюкзак", "лежит поперёк прохода, лицом вниз"];
var NEAR = ["Рядом — погасший фонарь.", "Рядом — кружка, давно высохшая.", "Под рукой — карандаш и смятый листок.", "Рядом лежит рация, батарея села.", "У ног — аптечка, открытая и пустая.", "Рядом — ботинок со шнурком, завязанным бантиком.", "Рядом — кусок хлеба в обёртке, нетронутый.", "Под ладонью — ключи на кольце с брелоком.", "Рядом — очки с треснувшим стеклом.", "На полу — шарф, аккуратно сложенный, как будто его собирались кому-то отдать."];
function corpse(seed, L, F, o) {
  var e = eraOf(L), list = POSTS[e] || POSTS.K, k = h32(o.id + "|" + L + "-" + F);
  var pp = list[k % list.length];
  var p = person(seed, L, F, o.who != null ? o.who : 360 + (k % 60), pp[0], { era: e === "M" ? "K" : e });
  return { p: p, post: pp[0], outfit: OUTFIT[pp[1]] || OUTFIT.none, pose: POSE[(k >>> 4) % POSE.length], near: NEAR[(k >>> 8) % NEAR.length] };
}

LAB.agen = {
  Gen: Gen, person: person, personByG: personByG, render: render, noteText: noteText, timeWords: timeWords,
  eraOf: eraOf, postFor: postFor, corpse: corpse, fitsRoom: fitsRoom, tagsOf: tagsOf, feistel20: feistel20, NAMES: NM, femSur: femSur, DAYS: DAYS
};
})();
