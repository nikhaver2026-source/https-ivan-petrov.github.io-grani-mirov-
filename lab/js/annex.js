/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — кабинеты у коридоров и особые зоны (1.5).
   В стенах каждого коридора — двери в небольшие помещения: кабинеты,
   кладовые, подсобки, читальни, посты и склады; что в них стоит и что
   можно посмотреть, обыскать и прочитать — своё на каждой глубине.
   Особые зоны: тайники за потайной дверью, режимные помещения под
   замком (код, ключ или пропуск старше вашего), радиоактивные комнаты,
   загазованные склады и «горячие» камеры, куда санпропускник пускает
   только в защитном костюме. На каждом этаже — пункт снабжения.
   Строится последним, своим потоком случайностей: прежняя планировка
   этажа от этого не меняется. Без DOM — работает и в Node (проверки).
   Синтаксис — не новее ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

/* ── ГЛУБИНЫ ── K — «Ковчег» (1–10), P — Подножие (11–20), C — Колыбель
   (21–40), O — Отражение (41–60), M — Механизм (61–80), I — Исток (81+). */
function eraOf(L) { return L <= 10 ? "K" : L <= 20 ? "P" : L <= 40 ? "C" : L <= 60 ? "O" : L <= 80 ? "M" : "I"; }
LAB.annexEra = eraOf;

/* ── ПРЕДМЕТЫ ОБСТАНОВКИ КАБИНЕТОВ ── */
var OBJ = {
  shelf:      { n: "Стеллаж", icon: "🗄️", desc: "Металлический стеллаж до потолка: коробки, банки, свёртки." },
  cabinet:    { n: "Картотечный шкаф", icon: "🗃️", desc: "Шкаф с выдвижными ящиками: папки, личные дела, отчёты, накладные." },
  fridge:     { n: "Холодильник", icon: "🧊", desc: "Небольшой холодильник. Компрессор то затихает, то снова гудит." },
  firstaid:   { n: "Аптечный шкафчик", icon: "🩹", desc: "Белый шкафчик с красным крестом на дверце." },
  suitlocker: { n: "Шкаф спецодежды", icon: "🦺", desc: "Шкаф с защитными костюмами, респираторами и фильтрами." },
  rack:       { n: "Оружейная стойка", icon: "🔫", desc: "Стойка с гнёздами под стволы и ящиком для батарей." },
  bookshelf:  { n: "Книжная полка", icon: "📚", desc: "Полка с книгами: потрёпанные корешки, закладки из обрывков бумаги." },
  board:      { n: "Доска объявлений", icon: "📌", desc: "Пробковая доска: объявления, приказы, записки на кнопках." },
  logbook:    { n: "Журнал смены", icon: "📓", desc: "Толстый журнал на столе, раскрытый на последней записи." },
  photos:     { n: "Стена с фотографиями", icon: "🖼️", desc: "Фотографии в рамках и без: люди, праздники, поверхность." },
  sink:       { n: "Раковина", icon: "🚰", desc: "Раковина с краном. Вода идёт — холодная и чистая." },
  decon:      { n: "Дезактивационный душ", icon: "🚿", desc: "Кабинка с форсунками и решёткой слива: смывает с кожи и одежды радиоактивную пыль." },
  fusebox:    { n: "Электрощит этажа", icon: "⚡", desc: "Щит с рубильниками и автоматами: питание камер, света и дверей коридоров этажа." },
  comp:       { n: "Компьютер", icon: "🖥️", desc: "Служебный компьютер." },
  trial:      { n: "Стенд допуска", icon: "🧩", desc: "Испытательный стенд с тремя замками-задачами: кто решит все три, тому лоток выдаёт награду." },
  supply:     { n: "Пункт снабжения", icon: "📦", desc: "Прилавок, приёмник капсул и возвратный лоток: товар этажа, заказ с поверхности, скупка всего, что вы несёте." },
  tubepost:   { n: "Окно пневмопочты", icon: "📮", desc: "Латунное окно пневмопочты Механизма: накладные, посылки, квитанции." }
};
for (var ok in OBJ) if (!LAB.OBJ[ok]) LAB.OBJ[ok] = OBJ[ok];
/* Какие из них обыскивают: в них добыча. */
LAB.CONTAINERS = ["crate", "locker", "desk", "corpse", "safe", "shelf", "cabinet", "fridge", "firstaid", "suitlocker", "rack", "tubepost"];

/* ── КОМПЬЮТЕРЫ ──
   rank: 1 — рядовой (почитать), 2 — важный (карта зон, склад, двери),
   3 — главный (схемы, протокол отбоя, допуск ко всем режимным). */
LAB.COMPS = {
  archive:   { n: "Архивный компьютер", rank: 1, desc: "Терминал архива: личные дела, отчёты, протоколы происшествий." },
  medrec:    { n: "Медицинский компьютер", rank: 1, desc: "Компьютер медблока: карты пациентов, журнал облучения, обследование." },
  cams:      { n: "Пульт наблюдения коридора", rank: 1, desc: "Мониторы камер и запись тревог: видно, кто ходит по коридорам этажа." },
  dosimetry: { n: "Компьютер радиационного контроля", rank: 2, desc: "Карта фона этажа: где излучение, какое и откуда." },
  stock:     { n: "Терминал складского учёта", rank: 2, desc: "Учёт имущества этажа: что где хранится, накладные, коды складов." },
  dispatch:  { n: "Диспетчерский пульт этажа", rank: 2, desc: "Пульт дверей и замков этажа: блокировки, режимные помещения, журнал проходов." },
  server:    { n: "Сервер отдела", rank: 2, desc: "Стойка сервера отдела: данные исследований, канал в сеть ОКО." },
  main:      { n: "Главный компьютер режимного отдела", rank: 3, desc: "ЭВМ с грифом «Особой важности»: схемы, протоколы ОКО, допуски этажа." }
};

/* ── ПОМЕЩЕНИЯ У КОРИДОРОВ ── таблица — annex_rooms.js (LAB.ANNEX_ROOMS). */
var ROOMS = LAB.ANNEX_ROOMS || {};
for (var rk in ROOMS) { ROOMS[rk].annex = true; if (!LAB.ROOMS[rk]) LAB.ROOMS[rk] = ROOMS[rk]; }

/* ── ДОБЫЧА КАБИНЕТОВ ── Товары своей глубины: ценности, еда, лекарства,
   защита, инструменты, детали — смотря что за помещение. */
function itemsOf(L, test) {
  var out = [];
  for (var k in LAB.ITEMS) { var d = LAB.ITEMS[k]; if (!d.price || d.surf || d.nosell || d.cold || d.kit) continue; if ((d.depth || 1) > L) continue; if (test(d, k)) out.push(k); } /* (3.0) cold — только холодильники, kit — только у чайника (kitchen.js) */
  return out;
}
function catPick(r, L, cat) {
  var pool = itemsOf(L, function (d) { return d.cat === cat; });
  if (!pool.length) return null;
  /* свежие товары своей глубины — чаще */
  var fresh = pool.filter(function (k) { return (LAB.ITEMS[k].depth || 1) > L - 15 && (LAB.ITEMS[k].depth || 1) > 1; });
  return fresh.length && r.chance(0.4) ? r.pick(fresh) : r.pick(pool);
}
function partPick(r, L) { return LAB.partAt ? LAB.partAt(r, L) : "scrap"; }
function it(item, n) { return { kind: "item", item: item, n: n || 1 }; }
function annexLoot(r, L, F, tag, ot, lean, only) {
  var out = [], n = ot === "safe" ? 3 : lean ? r.int(1, ot === "crate" || ot === "shelf" ? 2 : 1) : ot === "crate" || ot === "shelf" ? r.int(1, 3) : r.int(1, 2);
  var add = function (x) { if (x) out.push(x); };
  var cr = function (b) { return { kind: "credits", n: LAB.credits(b + r.int(0, 12), L, F) }; };
  /* (3.0) холодильник и холодильная камера — только то, что держат в холоде; котлы, печь,
     бочки, коптильня, лотки раздачи — только съестное (kitchen.js). Вещь подменяется из уже
     вынутого числа q: поток случайностей тот же, этажи прежних записей не меняются. */
  var KI = LAB.kitchen, cold = KI && (only === "cold" || ot === "fridge"), cook = KI && only === "cooked";
  for (var i = 0; i < n; i++) {
    var q = r.next(), k0 = out.length;
    switch (tag) {
      case "stash": add(q < 0.35 ? it(catPick(r, L, "valuable")) : q < 0.55 ? cr(30) : q < 0.75 ? it(catPick(r, L, "med")) : q < 0.9 ? { kind: "ammo", ammo: "energy", n: 2 } : it(catPick(r, L, "tool"))); break;
      case "hot": add(q < 0.35 ? it(r.chance(0.5) ? "isotope" : "goldbar") : q < 0.6 ? it(catPick(r, L, "valuable")) : q < 0.8 ? it("lead", 2) : it(r.chance(0.5) ? "radaway" : "antirad")); break;
      case "isotope": add(q < 0.4 ? it("lead", r.int(1, 2)) : q < 0.6 ? it(L >= 5 && r.chance(0.5) ? "isotope" : "antirad") : q < 0.8 ? it(catPick(r, L, "valuable")) : it("iodine")); break;
      case "classified": add(q < 0.35 ? it(catPick(r, L, "valuable")) : q < 0.55 ? { kind: "note", note: "staff", n: r.int(0, 999) } : q < 0.75 ? cr(25) : it(r.chance(0.5) ? "decoder" : "jammer")); break;
      case "armory": add(q < 0.45 ? { kind: "ammo", ammo: r.chance(0.7) ? "energy" : (LAB.AMMO.slug && L >= 2 ? "slug" : "energy"), n: 1 + r.int(0, 1) } : q < 0.6 ? it(r.chance(0.4) ? "emp" : r.chance(0.5) ? "wrepair" : "fieldkit") : q < 0.8 ? it(partPick(r, L)) : cr(15)); break;
      case "protect": add(q < 0.3 ? it(r.chance(0.6) ? "respirator" : "filter") : q < 0.5 ? it(r.chance(0.5) ? "rubber" : "filtercart") : q < 0.65 ? it(r.chance(0.5) ? "iodine" : "antirad") : q < 0.8 ? it("tape") : it(r.chance(0.15) ? "dosimeter" : "lead")); break;
      case "rad": add(q < 0.35 ? it("lead") : q < 0.55 ? it(r.chance(0.5) ? "antirad" : "iodine") : q < 0.7 ? it(catPick(r, L, "valuable")) : q < 0.85 ? it(partPick(r, L)) : it(r.chance(0.3) ? "dosimeter" : "rubber")); break;
      case "med": case "herbs": add(q < 0.55 ? it(catPick(r, L, "med")) : q < 0.75 ? it(r.chance(0.5) ? "medkit_s" : "bandage") : q < 0.9 ? it(catPick(r, L, "food")) : it("gel")); break;
      case "food": case "home": add(q < 0.6 ? it(catPick(r, L, "food")) : q < 0.75 ? it(catPick(r, L, "valuable")) : q < 0.9 ? cr(8) : it(catPick(r, L, "med"))); break;
      case "smoke": add(q < 0.45 ? it(catPick(r, L, "valuable")) : q < 0.75 ? cr(6) : it(catPick(r, L, "food"))); break;
      case "janitor": add(q < 0.3 ? it(r.chance(0.65) ? "tape" : "fieldkit") : q < 0.5 ? it(r.chance(0.5) ? "rubber" : "reagent") : q < 0.7 ? it(partPick(r, L)) : q < 0.85 ? it(catPick(r, L, "valuable")) : it("respirator")); break;
      case "chem": add(q < 0.4 ? it(r.chance(0.6) ? "reagent" : "gel") : q < 0.6 ? it(catPick(r, L, "med")) : q < 0.75 ? it(r.chance(0.5) ? "filtercart" : "respirator") : q < 0.9 ? it(partPick(r, L)) : it(catPick(r, L, "valuable"))); break;
      case "paper": add(q < 0.35 ? { kind: "note", note: "staff", n: r.int(0, 999) } : q < 0.6 ? it(catPick(r, L, "valuable")) : q < 0.8 ? cr(10) : it(catPick(r, L, "food"))); break;
      case "tech": add(q < 0.45 ? it(r.chance(0.5) ? "chip" : partPick(r, L)) : q < 0.6 ? it("datachip") : q < 0.8 ? { kind: "ammo", ammo: "energy", n: 1 } : it(catPick(r, L, "tool"))); break;
      case "bio": add(q < 0.5 ? it(r.chance(0.6) ? "gel" : "reagent") : q < 0.7 ? it(catPick(r, L, "food")) : q < 0.85 ? it(catPick(r, L, "med")) : it(L >= 4 ? "culture" : catPick(r, L, "valuable"))); break;
      case "arms": add(q < 0.5 ? { kind: "ammo", ammo: "energy", n: 1 } : q < 0.7 ? it(r.chance(0.5) ? "bandage" : "emp") : q < 0.85 ? it(catPick(r, L, "valuable")) : cr(10)); break;
      default: /* store, parts */ add(q < 0.5 ? it(partPick(r, L), r.chance(0.3) ? 2 : 1) : q < 0.65 ? it(catPick(r, L, "food")) : q < 0.78 ? it(r.chance(0.4) ? "tape" : r.chance(0.6) ? "rubber" : "fieldkit") : q < 0.9 ? it(catPick(r, L, "valuable")) : cr(8));
    }
    /* число вещей — прежнее (по нему потом бросают жребий в разграбленных помещениях); негодная вещь так и остаётся негодной */
    var x0 = out[k0];
    if ((cold || cook) && x0 && (x0.kind !== "item" || (x0.item && LAB.ITEMS[x0.item]))) out[k0] = cold ? KI.coldItem(q, L, tag) : KI.cookedItem(q, L);
  }
  /* сейф — ценное наверняка; оружейная стойка — ствол; шкаф спецодежды — костюм от излучения */
  if (ot === "safe") out.push(r.chance(0.5) ? it(catPick(r, L, "valuable") || "watch") : { kind: "credits", n: LAB.credits(35, L, F) });
  if (ot === "rack" && LAB.genWeapon) out.push({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.1 }) });
  if (ot === "suitlocker" && r.chance(0.3)) out.push({ kind: "armor", a: LAB.makeArmor(r.chance(0.7) || L < 2 ? "radcape" : "radsuit", LAB.foeLevel(L, F), 1) });
  if (tag === "hot" && ot === "crate" && r.chance(0.35)) out.push({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.3 }) });
  return out.filter(function (x) { return x && (x.kind !== "item" || (x.item && LAB.ITEMS[x.item])); });
}
LAB.annexLoot = annexLoot;

/* ════════ ПОСТРОЕНИЕ ════════
   Вдоль каждой стены каждого коридора — ряд помещений: где больше, где
   меньше (у каждого уровня своя плотность, у каждой стены — своё число,
   чаще около десяти), шириной от трёх шагов, иногда — большой зал на
   полстены; между соседями — стена в клетку; глубина — от двух до семи.
   Дверь — в стене коридора, не ближе двух шагов к его концам и не там,
   где у стены стоит турель или камера. Двери есть и в коридоре к тайной
   комнате: забытое крыло, куда никто давно не заходил. Типы в одном
   коридоре не повторяются, а пара «тип и вариант» — на всём этаже
   (annex_gen.js). */
var T = LAB.T;
/* Помещение вдоль коридора c на стороне side (0 — у меньших координат
   поперёк, 1 — у больших): клетки a0..a1 вдоль, глубина h. Вокруг —
   сплошная стена в клетку (и внутри карты). */
function fits(fl, c, side, a0, a1, h) {
  var W = LAB.W, H = LAB.H, t = fl.t, hz = c.axis === "h";
  var wallA = hz ? (side ? c.y1 + 1 : c.y0 - 1) : (side ? c.x1 + 1 : c.x0 - 1);
  var dir = side ? 1 : -1, b0 = wallA + dir, b1 = wallA + dir * h;
  var lo = Math.min(b0, b1), hi = Math.max(b0, b1);
  for (var a = a0 - 1; a <= a1 + 1; a++) for (var b = lo - 1; b <= hi + 1; b++) {
    var x = hz ? a : b, y = hz ? b : a;
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    var inside = a >= a0 && a <= a1 && b >= lo && b <= hi;
    if (inside && (x < 1 || y < 1 || x > W - 2 || y > H - 2)) return null;
    if (t[y * W + x] !== T.WALL) return null;
  }
  return { x0: hz ? a0 : lo, x1: hz ? a1 : hi, y0: hz ? lo : a0, y1: hz ? hi : a1, wallA: wallA, side: hz ? (side ? "N" : "S") : (side ? "W" : "E") };
}
/* Перед дверью нельзя: турель, камера (стоят у стен намертво), пресс «Подножия». */
function frontBlocked(fl, x, y, still) {
  var i = y * LAB.W + x;
  if (fl.t[i] !== T.CORR) return true;
  if (still[i]) return true;
  return (fl.hazards || []).some(function (h) { return (h.cells || []).some(function (q) { return q[0] === x && q[1] === y; }); });
}
function stillMap(fl) {
  var m = {};
  fl.foes.forEach(function (f) { var b = LAB.FOES[f.type]; if (b && (b.beh.indexOf("turret") >= 0 || b.beh.indexOf("camera") >= 0 || b.beh.indexOf("stationary") >= 0)) m[f.y * LAB.W + f.x] = 1; });
  return m;
}
/* Обычные (не особые) типы глубины. */
function plainPool(era) {
  var out = [];
  for (var k in ROOMS) { var d = ROOMS[k]; if (d.kind || d.era.indexOf(era) < 0) continue; out.push(k); }
  return out;
}
/* Особые зоны этажа: число растёт с размером этажа и с глубиной. */
function specialsFor(r, L, F, n) {
  var d0 = LAB.depth(L, F), e = eraOf(L), out = [], k;
  out.push("x_supply");
  var lockedT = e === "P" ? ["x_classified", "x_armory", "x_blasting"] : e === "C" ? ["x_armory", "x_songvault"] : e === "I" ? ["x_classified", "x_seedvault", "x_armory"] : ["x_classified", "x_armory"];
  var nStash = (L === 1 && F === 1) ? 0 : 1 + (n > 120 && r.chance(0.5) ? 1 : 0) + (r.chance(Math.min(0.5, d0 * 0.003)) ? 1 : 0);
  for (k = 0; k < nStash; k++) out.push("x_stash");
  var nLock = (L === 1 && F <= 2) ? 1 : 2 + (n > 150 ? 1 : 0) + (r.chance(Math.min(0.6, 0.2 + d0 * 0.003)) ? 1 : 0);
  for (k = 0; k < nLock; k++) out.push(r.pick(lockedT));
  if (!(L === 1 && F <= 3)) { var nIso = 1 + (r.chance(Math.min(0.5, d0 * 0.003)) ? 1 : 0); for (k = 0; k < nIso; k++) out.push("x_isotope"); }
  if (L >= 2 || F >= 6) { out.push("x_hotcell"); if (r.chance(Math.min(0.4, d0 * 0.002))) out.push("x_hotcell"); }
  if (!(L === 1 && F <= 2) && r.chance(0.65)) out.push("x_trial");
  return out;
}
function maxNum(fl) { var m = 0; fl.rooms.forEach(function (q) { if (q && q.num > m) m = q.num; }); return m; }

/* Подробности — у каждого помещения свои: в каком оно виде, чем пахнет,
   что звучит, что забыто. */
var DETAIL = {
  K: ["Свет мигает: лампа под потолком вот-вот перегорит.", "На полу — рассыпанные скрепки и чей-то пропуск без фотографии.", "Пахнет остывшим кофе и озоном.", "На стене — календарь, где обведён день отпуска на поверхности.", "В углу — мокрое пятно: где-то наверху течёт труба.", "На двери изнутри нацарапано: «Не открывать, пока не стихнет».", "Стул опрокинут, будто отсюда уходили бегом.", "На подоконнике фальшивого окна — засохший цветок в банке.", "Где-то за стеной ровно гудит вентилятор.", "Всё стоит на своих местах, аккуратно, будто хозяин вышел на минуту.", "Пахнет хлоркой и пластиком.", "На полке — детский рисунок: солнце, дом и подпись «Папе на работу».", "Под ногами хрустит стекло от разбитой лампы.", "На столе — недопитый стакан чая с ложкой.", "Слышно, как в стене щёлкает реле.", "К двери изнутри придвинута тумбочка, но её потом отодвинули.", "Стены здесь светлее: недавно красили, пахнет краской.", "На крючке — забытый белый халат.", "В воздухе висит пыль, луч фонаря имплантов её не видит, а нос чует.", "На стене — график дежурств, где последние клетки так и не заполнены."],
  P: ["Пахнет мазутом и холодной глиной.", "На стене — пожелтевший плакат: «Даёшь глубину!».", "С потолка капает: где-то сочится вода из породы.", "Половицы скрипят, под ними — пустота.", "На гвозде висит каска с треснувшим козырьком.", "Тянет тёплым воздухом снизу, из Шва.", "Кто-то вырезал на столе: «Седьмая смена здесь была».", "Пахнет табаком, который давно выветрился.", "Слышен далёкий гул лебёдок.", "Пол засыпан мелкой рудой.", "На стене — карта выработок, исчерканная карандашом.", "Порода за стеной тихо поёт, если приложить ухо."],
  C: ["Пахнет хлебом, травами и дымом.", "Пол деревянный, тёплый, чисто выметен.", "Над дверью — оберег из ракушек и перьев.", "Кто-то оставил на столе чашку с недопитым травяным чаем.", "Тихо звенят колокольчики на сквозняке.", "Стены расписаны узорами, которые можно прочесть пальцами.", "Слышно, как далеко за стеной поёт складка.", "Здесь пахнет мокрым деревом и мёдом.", "В углу — вязанка дров для печки.", "На полу — вышитый коврик, по нему мягко ступать.", "На гвоздике — связка сушёных яблок.", "Над столом висит самодельный абажур из бересты."],
  O: ["Надписи читаются задом наперёд.", "Ваши шаги возвращаются чуть позже, чем должны.", "Всё зеркально: ручка двери не с той стороны.", "Запах здесь тот же, что наверху, только холоднее.", "Часы на стене идут назад.", "Где-то рядом кто-то повторяет ваши движения.", "Вещи стоят так же, как в настоящем «Ковчеге», но чуть сдвинуты.", "Воздух звенит, как стекло после удара.", "В углу — отражение двери, которой нет."],
  M: ["Щёлкают реле, стрекочет счётная машинка за стеной.", "Пахнет машинным маслом и бумагой.", "Под потолком проходит латунная труба пневмопочты: в ней иногда шуршит капсула.", "На каждой вещи — бирка с номером накладной.", "На полу ни пылинки: уборщик проходит здесь по графику.", "На стене — табличка «Режим работы: всегда».", "Слышно, как где-то печатает машинка.", "Здесь всё опломбировано, даже мусорная корзина.", "На столе — талон очереди с номером девятьсот девяносто девять.", "Шестерёнки в стене тихо тикают."],
  I: ["Пахнет землёй и тёплым железом.", "По стене вьётся плющ, и в нём жужжат механические пчёлы.", "Мох глушит шаги.", "С потолка капает тёплая вода.", "Где-то совсем рядом тихо гудит реактор, и стены от этого тёплые.", "Тишина здесь живая: в ней шуршат листья.", "На полу — следы маленьких колёс: здесь ездит дрон-садовник.", "Пахнет яблоками.", "Корни пробили стену и спокойно растут дальше.", "На стене — табличка от руки: «Для тех, кто придёт после»."]
};
function detailDeck(r, era) { var d = (DETAIL[era] || DETAIL.K).slice(); r.shuffle(d); return d; }

LAB.annex = { ROOMS: ROOMS, eraOf: eraOf, loot: annexLoot, DETAIL: DETAIL };
/* Сколько помещений вдоль одной стены: чаще около десяти, бывает шесть, бывает тринадцать. */
var COUNT_W = { 5: 1, 6: 3, 7: 5, 8: 8, 9: 12, 10: 15, 11: 12, 12: 8, 13: 4 };
LAB.annex.place = function (ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F;
  var r = LAB.Rng(ctx.seed, "annex:" + L + ":" + F + ":" + ctx.attempt);
  var era = eraOf(L), lev = LAB.LEVELS[L], secret = fl.secret, still = stillMap(fl);
  /* плотность уровня: где-то кабинеты теснятся, где-то стоят реже */
  var dens = 0.82 + 0.36 * LAB.Rng(ctx.seed, "adens:" + L).next();
  /* (3.2) с третьего блока кабинеты шире и глубже, залы больше (world.js, GROW) */
  var gw = LAB.floorGrow ? LAB.floorGrow(L) : null, aw0 = gw ? gw.aw[0] : 3, aw1 = gw ? gw.aw[1] : 5;
  /* 1. Ряды помещений вдоль стен коридоров */
  var spots = [], byCorr = {};
  fl.corrs.forEach(function (c) {
    var wing = c.a === secret || c.b === secret;
    var hz = c.axis === "h", end0 = hz ? c.x0 : c.y0, end1 = hz ? c.x1 : c.y1;
    [0, 1].forEach(function (side) {
      var lo = end0 + 1, hi = end1 - 1, sp0 = hi - lo + 1;
      var capN = Math.floor((sp0 + 1) / (aw0 + 1));
      var want = wing ? r.int(1, 3) : Math.round(parseInt(r.weighted(COUNT_W), 10) * dens);
      var n = Math.max(0, Math.min(capN, want));
      if (n <= 0) return;
      var widths = [], k;
      for (k = 0; k < n; k++) widths.push(aw0);
      var extra = sp0 - (aw0 * n + (n - 1)), guard = 0;
      /* большой зал на полстены — если вдоль стены есть запас */
      if (extra >= 5 && !wing && r.chance(0.4)) { var q0 = r.int(0, n - 1), add = Math.min(extra - 1, gw ? r.int(gw.hall[0], gw.hall[1]) - aw0 : r.int(3, 5)); widths[q0] += add; extra -= add; }
      while (extra > 1 && guard++ < 60) { var q = r.int(0, n - 1); if (widths[q] < aw1) { widths[q]++; extra--; } }
      var pos = lo + r.int(0, Math.max(0, extra));
      for (k = 0; k < n; k++) {
        var a0 = pos, a1 = pos + widths[k] - 1;
        pos = a1 + 2;
        if (a1 > hi) break;
        var big = widths[k] >= (gw ? gw.hall[0] : 6), h = gw ? (big ? r.int(gw.ad[0] + 2, gw.ad[1] + 2) : r.int(gw.ad[0], gw.ad[1])) : big ? r.int(5, 7) : r.int(2, 6), g = null;
        if (h === 2 && widths[k] > 3) h = 3;
        for (var hh = h; hh >= 2 && !g; hh--) g = fits(fl, c, side, a0, a1, hh);
        if (!g) continue;
        /* дверь: где-нибудь по ширине помещения, не у концов коридора, перед ней свободно */
        var cand = [];
        for (var a = Math.max(a0, end0 + 2); a <= Math.min(a1, end1 - 2); a++) cand.push(a);
        r.shuffle(cand);
        var door = null;
        for (var ci = 0; ci < cand.length && !door; ci++) {
          var al = cand[ci], dx = hz ? al : g.wallA, dy = hz ? g.wallA : al;
          var fx = hz ? al : (side ? c.x1 : c.x0), fy = hz ? (side ? c.y1 : c.y0) : al;
          if (!frontBlocked(fl, fx, fy, still)) door = [dx, dy];
        }
        if (!door) continue;
        var sp = { c: c, side: side, door: door, x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, dside: g.side, zone: fl.zone[c.mouthRoom] != null ? fl.zone[c.mouthRoom] : -1, id: fl.rooms.length, wing: wing, big: big };
        reserve(fl, sp);
        spots.push(sp);
        (byCorr[c.id] = byCorr[c.id] || []).push(sp);
      }
    });
  });
  var gen = LAB.agen ? new LAB.agen.Gen(ctx.seed, L, F, spots.length) : null;
  if (!spots.length) { fallbackSupply(ctx, r); placeMainFixtures(ctx, r, gen); return; }
  /* 2. Особые зоны: пункт снабжения — у начальной зоны; тайники, режимные
     и горячие — подальше от начала; у радиоактивных — пост дезактивации
     в том же коридоре. В забытом крыле особых зон нет. */
  var free = spots.filter(function (q) { return !q.wing; }), types = {};
  var take = function (pref) {
    var list = free.filter(pref || function () { return true; });
    if (!list.length) list = free;
    if (!list.length) return null;
    var sp2 = r.pick(list); free.splice(free.indexOf(sp2), 1); return sp2;
  };
  var picks = {};
  specialsFor(r, L, F, spots.length).forEach(function (ty) {
    var def = ROOMS[ty]; if (!def) return;
    var big = def.size && def.size[0] >= 4;
    var sp2 = ty === "x_supply" ? take(function (q) { return q.zone === -1 && span(q) >= 4; }) || take(function (q) { return q.zone === -1; })
      : (def.kind === "secret" || def.kind === "locked" || def.kind === "hazard") ? take(function (q) { return (q.zone !== -1 || q.c.doorRoom === fl.D) && (!big || span(q) >= 4); })
      : take(function (q) { return !big || span(q) >= 4; });
    if (!sp2) return;
    types[sp2.id] = ty;
    /* (1.5) у особых помещений — свои варианты, на этаже без повторов */
    if (gen && gen.variantFor) { var sv = gen.variantFor(ty); if (sv) picks[sp2.id] = sv; }
    if (def.rad >= 3) {
      var near = free.filter(function (q) { return q.c === sp2.c; })[0];
      if (near && r.chance(0.75)) { free.splice(free.indexOf(near), 1); types[near.id] = "x_decon"; if (gen && gen.variantFor) { var dv = gen.variantFor("x_decon"); if (dv) picks[near.id] = dv; } }
    }
  });
  /* 3. Остальное: колода пар «тип + вариант» своей глубины — без повторов на этаже,
     тип в одном коридоре не повторяется */
  var pool = plainPool(era);
  Object.keys(byCorr).forEach(function (cid) {
    var used = {};
    byCorr[cid].forEach(function (sp2) {
      if (types[sp2.id]) { used[types[sp2.id]] = 1; return; }
      var it2 = gen ? gen.nextType(pool, used) : null;
      if (!it2) it2 = { t: r.pick(pool), vi: -1 };
      types[sp2.id] = it2.t; picks[sp2.id] = it2; used[it2.t] = 1;
    });
  });
  /* 4. Помещения, двери, хозяева, описания, обстановка */
  var num = maxNum(fl), details = detailDeck(r, era), dk = 0, usedNames = {};
  spots.forEach(function (sp2) {
    var ty = types[sp2.id] || "x_store", def = ROOMS[ty] || ROOMS.x_store, it2 = picks[sp2.id] || null;
    var v = it2 && it2.vi >= 0 && LAB.ANNEX_V && LAB.ANNEX_V[ty] ? LAB.ANNEX_V[ty][it2.vi] : null;
    var rm = fl.rooms[sp2.id];
    /* табличка на этаже не повторяется (1.6): колода кончилась — берём другой
       вариант того же типа, а если и они разобраны — номер на табличке */
    var nm = v ? v.n : def.n;
    if (usedNames[nm]) {
      var alts = (LAB.ANNEX_V && LAB.ANNEX_V[ty]) || [], alt = -1;
      for (var ai = 0; ai < alts.length; ai++) if (!usedNames[alts[ai].n]) { alt = ai; break; }
      if (alt >= 0) { v = alts[alt]; it2 = { t: ty, vi: alt }; nm = v.n; }
      else { usedNames[nm]++; nm = nm + " № " + usedNames[nm]; }
    }
    usedNames[nm] = (usedNames[nm] || 0) + 1;
    rm.type = ty; rm.name = nm; rm.surf = lev.surf; rm.vi = it2 ? it2.vi : -1;
    if (it2 && it2.sewn) rm.sewn = it2.sewn;
    if (sp2.wing) rm.wing = true;
    if (def.rad) rm.rad = Math.min(5, def.rad + (def.rad >= 3 && r.chance(0.35) ? 1 : 0) + (L > 40 && def.rad < 3 && r.chance(0.3) ? 1 : 0));
    if (def.gas) rm.gas = Math.min(3, def.gas + (def.gas < 3 && r.chance(0.25) ? 1 : 0));
    var d = fl.doorAt[sp2.door[1] * LAB.W + sp2.door[0]];
    var post = v && v.post ? v.post : def.owner, owner = null;
    if (post && gen) {
      owner = gen.person(sp2.id, post, null);
      if (!owner.m && v && v.postf && owner.f) owner.post = v.postf;
      rm.owner = { n: owner.fio, short: owner.sign, f: owner.f, post: owner.post, g: owner.g, m: !!owner.m };
      gen.people.push({ p: owner, rm: rm });
    } else if (post) {
      var fem = r.chance(0.5), fn = r.pick(fem ? LAB.NAMES.f : LAB.NAMES.m), sn = r.pick(fem ? LAB.NAMES.sf : LAB.NAMES.sm);
      rm.owner = { n: fn + " " + sn, short: fn.charAt(0) + ". " + sn, f: fem, post: post };
    }
    /* состояние — до обстановки (баррикада, жилая койка), описание — после: подробности по тому, что стоит */
    if (gen) { var stt0 = gen.stateFor(rm, def, { secret: sp2.wing }); if (stt0) rm.state = stt0; }
    else {
      if (dk >= details.length) { details = detailDeck(r, era); dk = 0; }
      rm.desc = def.desc + (rm.owner ? " На двери изнутри — табличка: «" + cap(rm.owner.post) + " " + rm.owner.short + "»." : "") + " " + details[dk++];
    }
    if (def.kind === "secret") { d.kind = "secret"; d.lock = { type: "secret", inner: false }; rm.hidden = true; rm.sign = ""; }
    else {
      num++; rm.num = num;
      /* у варианта своя надпись; от надписи типа остаётся только предупреждение («Тишина!», «Не входить при горящем табло») */
      var sg0 = v && v.sign ? v.sign : def.sign, sg = sg0 ? (typeof sg0 === "string" ? sg0 : r.pick(sg0)) : "";
      if (v && !v.sign && sg) { var sgp = sg.split(/\.\s+/); sg = sgp.length > 1 ? sgp.slice(1).join(". ") : ""; }
      rm.sign = "Помещение " + num + ". " + rm.name + (rm.owner ? ", " + rm.owner.short : "") + (sg && sg !== rm.name ? ". " + sg : "");
      if (rm.rad) rm.sign += ". Знак радиационной опасности";
      if (rm.gas) rm.sign += ". Знак химической опасности";
      d.kind = def.kind === "hazard" || def.kind === "locked" ? "heavy" : r.chance(0.7) ? "auto" : "hatch";
      if (def.kind === "hazard") d.lock = { type: "hazard", need: "rad", min: 0.5 };
      if (def.kind === "locked") d.lock = lockFor(ctx, r, sp2, rm);
    }
    furnish(ctx, r, sp2, rm, def, v, gen);
    if (gen) rm.desc = gen.describe(rm, def, it2, owner, { secret: sp2.wing, state: rm.state || null, have: holds(fl, rm) });
  });
  /* 4б. «Ковчег»: тела тех, кто не успел уйти три недели назад — чаще там, где держали
     оборону, бежали или горело; при них — вещи, жетон и, бывает, записка */
  if (era === "K" && !(L === 1 && F <= 2)) {
    var bodyRooms = spots.filter(function (q) { var m = fl.rooms[q.id]; return m && m.num && !(ROOMS[m.type] || {}).kind; });
    var pref = bodyRooms.filter(function (q) { var stt = fl.rooms[q.id].state; return stt === "barricade" || stt === "hurry" || stt === "burnt" || stt === "lived" || stt === "dark"; });
    var nb = r.int(1, 3) + (L >= 5 && r.chance(0.5) ? 1 : 0);
    for (var bi = 0; bi < nb && bodyRooms.length; bi++) {
      var bq = pref.length && r.chance(0.7) ? pref.splice(r.int(0, pref.length - 1), 1)[0] : bodyRooms[r.int(0, bodyRooms.length - 1)];
      var bo = ctx.addObj("corpse", bq.id, null);
      if (bo) bo.loot = annexLoot(r, L, F, r.pick(["home", "smoke", "med", "paper"]), "desk", true);
    }
  }
  /* 5. Записки: в ящиках, карманах и на полу — из частей, с людьми и помещениями этажа */
  if (gen) placeNotes(ctx, r, gen, spots);
  /* 6. Пункт снабжения обязателен; обстановка и подробности основных помещений, люди на телах */
  if (!fl.objs.some(function (o) { return o.type === "supply"; })) fallbackSupply(ctx, r);
  placeMainFixtures(ctx, r, gen);
  var kc = 0;
  /* номера людей на этаже: помещения — до 360, тела — 360–419, прочие — с 420 */
  var notedRooms = spots.map(function (q) { return fl.rooms[q.id]; }).filter(function (m) { return m && m.num; });
  fl.objs.forEach(function (o) {
    if (o.type !== "corpse") return;
    o.who = 360 + (kc++ % 60);
    /* в карманах — записка, которую этот человек так и не отдал */
    if (gen && LAB.agen.corpse && r.chance(0.55)) {
      var who = LAB.agen.corpse(ctx.seed, L, F, o).p, to = gen.people.length ? r.pick(gen.people).p : null;
      var src = gen.noteSrc(who, to, null, notedRooms, 0);
      if (src) o.notes = [src];
    }
  });
  fl.annexN = spots.length;
};
/* Что стоит в помещении: виды предметов и вещей обстановки. */
function holds(fl, rm) {
  var h = {};
  fl.objs.forEach(function (o) { if (o.room === rm.id) { h[o.type] = 1; if (o.fx) h[o.fx] = 1; } });
  return h;
}
function span(sp) { return sp.c.axis === "h" ? sp.x1 - sp.x0 + 1 : sp.y1 - sp.y0 + 1; }
function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
/* Вырезать помещение и дверь (тип — потом). */
function reserve(fl, s) {
  var W = LAB.W, id = s.id;
  var rm = { id: id, x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, zone: s.zone, doors: [], mouths: [], annex: true, corr: s.c.id, type: "x_store", name: "Кладовая" };
  rm.cx = Math.floor((rm.x0 + rm.x1) / 2); rm.cy = Math.floor((rm.y0 + rm.y1) / 2);
  fl.rooms[id] = rm;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) { fl.t[y * W + x] = T.ROOM; fl.room[y * W + x] = id; }
  var di = s.door[1] * W + s.door[0];
  var door = { id: "d" + fl.doors.length, x: s.door[0], y: s.door[1], a: s.c.a, b: s.c.b, room: id, side: s.dside, other: -1, corr: -1, acorr: s.c.id, annex: true, kind: "auto", lock: null, tree: false, lockChild: -1 };
  fl.t[di] = T.DOOR; fl.corrAt[di] = s.c.id;
  fl.doors.push(door); fl.doorAt[di] = door;
  rm.doors.push(door.id);
  (s.c.annex = s.c.annex || []).push(door.id);
}
/* (3.0, просьба автора) Записка с кодом — в дальней половине помещений этажа, считая от
   кабинета: пусть игрок обходит комплекс. Случайный выбор один, как раньше. */
function farMain(r, fl, mains, rm) {
  var d = function (i) { var m = fl.rooms[i]; return Math.abs(m.cx - rm.cx) + Math.abs(m.cy - rm.cy); };
  var c = mains.slice().sort(function (a, b) { return d(b) - d(a) || a - b; });
  return r.pick(c.slice(0, Math.max(1, Math.ceil(c.length / 2))));
}
/* Замок режимного помещения: код (в записке или письме на этаже), ключ
   (у кого-то на этаже) или пропуск на ступень старше вашего — его не
   найти, но замок взламывают, а декодер открывает. */
function lockFor(ctx, r, s, rm) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, lev = LAB.LEVELS[L];
  var q = r.next();
  var mains = fl.rooms.filter(function (m, i) { return m && i < 12 && i !== fl.secret && i !== fl.U; }).map(function (m) { return m.id; });
  if (!mains.length) mains = [fl.U];
  if (q < 0.5) {
    var code = String(r.int(1000, 9999)), sp = farMain(r, fl, mains, rm), cw = r.next();
    rm.codeAt = sp;
    if (cw < 0.35) ctx.addObj("pc", sp, { own: r.int(0, 99999), codeFor: "", codeRoom: rm.name, code: code }) || ctx.addItem({ kind: "note", note: "code", code: code, room: rm.name }, sp);
    else ctx.addItem({ kind: "note", note: "code", code: code, room: rm.name }, sp);
    return { type: "code", code: code };
  }
  if (q < 0.78) {
    var keyId = "ka" + L + "_" + F + "_" + rm.id;
    var kname = "Ключ «" + rm.name + "»";
    var spot = r.pick(mains), done = false;
    if (r.chance(0.35)) {
      var f = fl.foes.filter(function (q2) { return !q2.boss && q2.room === spot && !(q2.carry && q2.carry.length); })[0];
      if (f) { f.carry = [{ kind: "key", key: keyId, n: kname }]; done = true; }
    }
    if (!done) ctx.addItem({ kind: "key", key: keyId, n: kname }, spot);
    return { type: "key", key: keyId, keyName: "Ключ от двери: " + rm.name };
  }
  var tier = Math.min(Math.max(1, lev.tier + 1), Math.max(1, Object.keys(LAB.TIERS).length - 1));
  if (!LAB.TIERS[tier]) tier = lev.tier;
  return { type: "card", tier: tier, over: true };
}
/* Обстановка кабинета: хранилища, устройства, вещи обстановки (fixtures),
   мелочь на полу; в горячих и режимных — твари или охрана. В обычных
   кабинетах добычи немного: их сотни на этаже. */
/* Вещи, которые встречаются где угодно: часы, плакат, телефон, цветок… — у каждой глубины свои. */
var GENERIC = {
  K: ["clock", "poster", "phone", "plants", "kettle", "chair", "armchair", "hangers", "nightstand", "globe", "drawings", "awards", "graffiti", "thermometer", "scales", "aquarium", "guitar"],
  P: ["clock", "poster", "phone", "abacus", "bench", "stove", "lamprack", "hangers", "awards", "graffiti", "samovar", "accordion", "thermometer", "chess"],
  C: ["pillows", "bench", "plants", "drawings", "samovar", "rocking", "lanterns", "metronome", "barrels"],
  O: ["clock", "poster", "phone", "chair", "graffiti", "drawings", "globe", "metronome", "thermometer", "armchair"],
  M: ["stamps", "queue", "clock", "typewriter", "abacus", "scales", "poster", "speaker", "metronome", "counting"],
  I: ["moss", "plants", "roots", "beehive", "mechflowers", "birdcage", "drone", "bench", "lanterns", "appletree"]
};
/* (3.2) Вещи нижних глубин (fixtures_data.js): с третьего блока их в помещениях больше —
   сверх прежнего столько, сколько велит GROW.fx (world.js). */
var DEEP_FX = {
  O: ["mirrorwall", "glasschime", "backclock", "twinchairs", "prism", "mirrorlog", "mirror", "metronome", "clock", "armchair"],
  M: ["punchclock", "gearwall", "tubehub", "perfocards", "boiler", "sealer", "stamps", "typewriter", "counting", "abacus", "queue"],
  I: ["spring", "berrybush", "nest", "rootbench", "sprout", "warmstone", "moss", "mechflowers", "beehive", "roots", "lanterns"]
};
function deepFx(r, era, rm, n, have, ctx) {
  var pool = (DEEP_FX[era] || []).filter(function (q) { return LAB.FIX && LAB.FIX.T[q] && !have[q]; }), put = 0;
  for (var i = 0; i < n && pool.length; i++) {
    var q = pool.splice(r.int(0, pool.length - 1), 1)[0];
    if (ctx.addObj("fx", rm.id, { fx: q, seed: r.int(1, 99999) })) { have[q] = 1; put++; }
  }
  return put;
}
function furnish(ctx, r, s, rm, def, v, gen) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, special = !!def.kind, era = eraOf(L), gw = LAB.floorGrow ? LAB.floorGrow(L) : null, more = gw ? gw.fx : 0;
  if (def.kind === "supply") { ctx.addObj("supply", rm.id, { prof: null }); return; }
  if (def.kind === "trial") { ctx.addObj("trial", rm.id, { seed: r.int(1, 99999), prize: r.pick(["suit", "suit", "bp", "kit"]) }); return; }
  var area = (rm.x1 - rm.x0 + 1) * (rm.y1 - rm.y0 + 1), maxObj = Math.max(2, Math.floor(area / 3)), placed = 0;
  var lootTag = (v && v.loot) || def.loot || "store";
  var objs = {}, k0;
  for (k0 in def.obj) objs[k0] = def.obj[k0];
  if (v && v.obj) for (k0 in v.obj) objs[k0] = v.obj[k0];
  for (var ot in objs) {
    if (placed >= maxObj) break;
    if (!r.chance(objs[ot])) continue;
    var extra = null;
    if (ot === "comp") extra = { kind: def.comp || r.pick(["archive", "medrec", "stock"]), seed: r.int(1, 99999), locked: r.chance((LAB.COMPS[def.comp] || {}).rank >= 2 ? 0.5 : 0.15) };
    if (ot === "safe") extra = { code: String(r.int(1000, 9999)), locked: true };
    if (ot === "locker") extra = { locked: r.chance(0.2) };
    if (ot === "coffee") extra = { broken: r.chance(0.12) };
    if (ot === "radio") extra = { band: r.int(0, 999) };
    if (ot === "bookshelf" || ot === "board" || ot === "logbook" || ot === "photos") extra = { seed: r.int(1, 99999) };
    if (ot === "capsule" && L === 1 && F === 1) continue;
    var o = ctx.addObj(ot, rm.id, extra);
    if (!o) continue;
    placed++;
    /* (2.5, просьба игрока) пустое хранилище — редкость: одно из десяти */
    if (LAB.CONTAINERS.indexOf(ot) >= 0) o.loot = special || ot === "safe" || r.chance(0.9) ? annexLoot(r, L, F, lootTag, ot, !special) : [];
    if (ot === "safe") {
      var mains = fl.rooms.filter(function (m, i) { return m && i < 12 && i !== fl.secret; }).map(function (m) { return m.id; });
      ctx.addItem({ kind: "note", note: "safe", code: o.code, room: rm.name }, farMain(r, fl, mains, rm));
    }
    if (ot === "comp" && extra.kind === "main") o.loot = annexLoot(r, L, F, "classified", "desk");
  }
  /* вещи обстановки, с которыми можно что-то сделать: свои у типа, у варианта и у состояния */
  var fxs = {}, fk;
  if (def.fx) for (fk in def.fx) fxs[fk] = def.fx[fk];
  if (v && v.fx) for (fk in v.fx) fxs[fk] = v.fx[fk];
  if (rm.state === "lived" && !fxs.bunk) fxs.bunk = 0.8;
  if (rm.state === "barricade") fxs.barricade = 1;
  var have = {};
  if (LAB.FIX) for (fk in fxs) {
    if (placed >= maxObj + 1 + more) break;
    if (LAB.FIX.T[fk] && r.chance(fxs[fk])) { if (ctx.addObj("fx", rm.id, { fx: fk, seed: r.int(1, 99999) })) { placed++; have[fk] = 1; } }
  }
  /* одна-две вещи «откуда угодно» — у каждого помещения своя мелочь */
  var gl = (GENERIC[era] || GENERIC.K).filter(function (q) { return LAB.FIX && LAB.FIX.T[q] && !have[q]; });
  var nG = special ? 0 : (r.chance(0.6) ? 1 : 0) + (s.big && r.chance(0.6) ? 1 : 0);
  for (var gi = 0; gi < nG && gl.length && placed < maxObj + 1; gi++) {
    var gq = gl.splice(r.int(0, gl.length - 1), 1)[0];
    if (ctx.addObj("fx", rm.id, { fx: gq, seed: r.int(1, 99999) })) { placed++; have[gq] = 1; }
  }
  /* (3.2) нижние глубины: ещё вещи своей глубины — в зале больше */
  if (gw && def.kind !== "hazard" && def.kind !== "decon") placed += deepFx(r, era, rm, more + (s.big ? 1 : 0), have, ctx);
  if (!placed) { var o2 = ctx.addObj(def.kind === "hazard" ? "crate" : "shelf", rm.id, null); if (o2) o2.loot = annexLoot(r, L, F, lootTag, "shelf", !special); }
  /* состояние: обысканное — почти пустое; брошенное в спешке — с забытыми вещами */
  if (rm.state === "ransacked") fl.objs.forEach(function (q) { if (q.room === rm.id && q.loot && q.loot.length) q.loot = q.loot.filter(function () { return r.chance(0.5); }); });
  if (rm.state === "hurry" && r.chance(0.7)) { var hv = annexLoot(r, L, F, r.pick(["home", "smoke", "food", "paper"]), "floor", true)[0]; if (hv && hv.kind !== "weapon" && hv.kind !== "armor") ctx.addItem(hv, rm.id); }
  if (r.chance(special ? 0.4 : 0.15)) { var x = annexLoot(r, L, F, lootTag, "floor", !special)[0]; if (x && x.kind !== "weapon" && x.kind !== "armor") ctx.addItem(x, rm.id); }
  /* (3.2) кабинетов в нижних глубинах меньше, зато они просторнее: находок на полу — чаще */
  if (gw && r.chance(0.2 + 0.05 * more)) { var x2 = annexLoot(r, L, F, lootTag, "floor", !special)[0]; if (x2 && x2.kind !== "weapon" && x2.kind !== "armor") ctx.addItem(x2, rm.id); }
  var lev = LAB.LEVELS[L];
  if ((rm.rad >= 3 || def.kind === "locked") && r.chance(def.kind === "hazard" ? 0.7 : 0.4)) {
    var pool = (lev.foes || []).filter(function (fid) {
      var b = LAB.FOES[fid];
      return b && b.beh.indexOf("turret") < 0 && b.beh.indexOf("camera") < 0 && b.beh.indexOf("cleaner") < 0 && b.beh.indexOf("swarm") < 0 && b.beh.indexOf("stationary") < 0 && (def.kind === "locked" ? b.kind === "mech" : true);
    });
    var c = standIn(fl, rm);
    if (pool.length && c) ctx.makeFoe(r.pick(pool), c[0], c[1], rm.id, { annex: true }, r);
  }
}
/* Записки помещений: у хозяина кабинета — чаще; лежат в ящиках и шкафах,
   в карманах одежды на вешалке, под подушками и просто на полу. */
var NOTE_FX = { table: 1, nightstand: 1, dutydesk: 1, hangers: 1, mailbag: 1, sofa: 1, bunk: 1, counter: 1, ledger: 1 };
function placeNotes(ctx, r, gen, spots) {
  var fl = ctx.fl, rooms = spots.map(function (q) { return fl.rooms[q.id]; }).filter(function (m) { return m && m.num; });
  var people = gen.people, extraK = 0;
  var anyone = function (not) {
    var list = people.filter(function (q) { return q.p !== not; });
    if (list.length && r.chance(0.8)) return r.pick(list).p;
    return gen.person(420 + (extraK++ % 90), r.pick(["инженер", "лаборант", "техник", "оператор", "охранник", "диспетчер"]));
  };
  spots.forEach(function (sp) {
    var rm = fl.rooms[sp.id], def = ROOMS[rm.type] || {};
    if (!rm || def.kind === "supply" || def.kind === "trial" || def.kind === "decon") return;
    var own = people.filter(function (q) { return q.rm === rm; })[0];
    var n = own ? (r.chance(0.5) ? 0 : r.chance(0.8) ? 1 : 2) : (r.chance(0.88) ? 0 : 1);
    if (rm.state === "lived" && n < 2) n++;
    for (var i = 0; i < n; i++) {
      var au = own && (i === 0 || r.chance(0.5)) ? own.p : anyone(null);
      var to = anyone(au), s3 = anyone(au);
      var others = rooms.filter(function (m) { return m !== rm; });
      var src = gen.noteSrc(au, to, s3, others, rm.num || 0);
      if (!src) return;
      /* куда положить: ящик, шкаф, карман, под подушку — или на пол */
      var holders = fl.objs.filter(function (o) { return o.room === rm.id && ((o.loot && o.type !== "safe" && o.type !== "rack") || (o.type === "fx" && NOTE_FX[o.fx])); });
      if (holders.length && r.chance(0.75)) {
        var hd = r.pick(holders);
        if (hd.type === "fx") (hd.notes = hd.notes || []).push(src);
        else hd.loot.push(Object.assign({ kind: "note" }, src));
      } else ctx.addItem(Object.assign({ kind: "note" }, src), rm.id);
    }
  });
}
/* Обстановка основных помещений этажа — по словам их описаний (fixtures_data.js);
   и у каждого основного помещения своя подробность. */
function placeMainFixtures(ctx, r, gen) {
  var fl = ctx.fl;
  for (var s = 0; s < fl.rooms.length; s++) {
    var rm = fl.rooms[s];
    if (!rm || rm.annex) continue;
    if (LAB.FIX && LAB.FIX.forRoom) {
      var gw = LAB.floorGrow ? LAB.floorGrow(ctx.L) : null;
      var list = LAB.FIX.forRoom(rm.type, r, gw ? 3 + gw.fx : 3), have = {};
      for (var i = 0; i < list.length; i++) if (ctx.addObj("fx", rm.id, { fx: list[i], seed: r.int(1, 99999) })) have[list[i]] = 1;
      /* (3.2) нижние глубины: в больших помещениях — и вещи своей глубины */
      if (gw && rm.type !== "secret" && LAB.ROOMS[rm.type] && !LAB.ROOMS[rm.type].special) deepFx(r, eraOf(ctx.L), rm, gw.fx + 1, have, ctx);
    }
    if (gen && rm.type !== "secret" && LAB.ROOMS[rm.type]) {
      var dt = gen.mainDetail(rm, holds(fl, rm));
      rm.desc = LAB.ROOMS[rm.type].desc + (dt ? " " + dt : "");
    }
  }
}
function standIn(fl, rm) {
  var cand = [], W = LAB.W, busy = {};
  fl.items.forEach(function (q) { if (q.x >= rm.x0 && q.x <= rm.x1 && q.y >= rm.y0 && q.y <= rm.y1) busy[q.y * W + q.x] = 1; });
  fl.foes.forEach(function (q) { if (q.x >= rm.x0 && q.x <= rm.x1 && q.y >= rm.y0 && q.y <= rm.y1) busy[q.y * W + q.x] = 1; });
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) {
    var i = y * W + x;
    if (fl.objAt[i] || busy[i]) continue;
    var nearDoor = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { return fl.t[(y + v[1]) * W + x + v[0]] === T.DOOR; });
    if (!nearDoor) cand.push([x, y]);
  }
  return cand.length ? cand[Math.floor(cand.length / 2)] : null;
}
/* Пункт снабжения в помещении начальной зоны — если у коридоров места нет. */
function fallbackSupply(ctx, r) {
  var fl = ctx.fl;
  var start = [];
  for (var s = 0; s < 12; s++) if (fl.rooms[s] && s !== fl.secret && fl.zone[s] === -1) start.push(s);
  r.shuffle(start);
  for (var i = 0; i < start.length; i++) if (ctx.addObj("supply", start[i], { prof: null })) return;
  ctx.addObj("supply", fl.U, { prof: null });
}
})();
