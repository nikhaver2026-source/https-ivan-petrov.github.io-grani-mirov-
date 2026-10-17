/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — кабинеты у коридоров и особые зоны (1.3).
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

/* ── ПОМЕЩЕНИЯ У КОРИДОРОВ ──
   era — на каких глубинах встречается; w — вес при выборе; obj — что
   стоит (вероятности; comp:вид — компьютер); loot — склонность добычи;
   kind: secret — тайник за потайной дверью; locked — режимное (замок);
   rad — радиоактивное (фон 1–5); gas — загазованное (сила 1–3);
   hazard — «горячая» камера: санпропускник пускает только в защите;
   supply — пункт снабжения; trial — стенд допуска; decon — пост
   дезактивации. size — [ширина вдоль коридора, глубина]: от и до. */
var ROOMS = {
  /* для всех глубин */
  x_store:    { n: "Кладовая", era: "KPCOMI", w: 4, desc: "Тесная кладовая: стеллажи до потолка, коробки, свёртки, пахнет пылью и картоном.", obj: { shelf: 1, crate: .6 }, loot: "store", sign: ["Кладовая", "Хозяйственный инвентарь"] },
  x_stash:    { n: "Тайник", era: "KPCOMI", w: 0, kind: "secret", desc: "Каморка за фальшивой панелью: кто-то устроил здесь схрон и не вернулся за ним.", obj: { crate: 1, safe: .35 }, loot: "stash", size: [3, 3, 3, 4] },
  x_supply:   { n: "Пункт снабжения", era: "KPCOMI", w: 0, kind: "supply", desc: "Прилавок, приёмник капсул с поверхности и возвратный лоток. Над прилавком — табло заказов.", obj: {}, size: [4, 5, 4, 5] },
  x_decon:    { n: "Пост дезактивации", era: "KPCOMI", w: 0.8, kind: "decon", desc: "Кабинка дезактивационного душа, шкаф с защитными костюмами и стойка дозиметров. На полу — жёлтая разметка «Чистая зона».", obj: { decon: 1, suitlocker: .8, sink: .5 }, loot: "protect", sign: "Пост дезактивации. Чистая зона", safe: true },
  x_trial:    { n: "Камера испытаний допуска", era: "KPCOMI", w: 0, kind: "trial", desc: "Белая камера со стендом: три замка-задачи и лоток с наградой. Так когда-то проверяли тех, кому выдавали допуск в горячие зоны.", obj: {}, sign: "Аттестация на допуск. Испытание", size: [4, 5, 4, 5] },
  x_hotcell:  { n: "Горячая камера", era: "KPCOMI", w: 0, kind: "hazard", rad: 5, desc: "Камера за санпропускником: свинцовые стены, манипуляторы, контейнеры с отработанными источниками. Здесь фонит так, что без костюма долго не протянуть.", obj: { crate: 1, safe: .45, comp: .3 }, comp: "main", loot: "hot", sign: "Горячая камера. Вход только в защите", size: [4, 5, 4, 5] },
  x_isotope:  { n: "Хранилище изотопов", era: "KPCOMI", w: 0, kind: "locked", rad: 3, desc: "Свинцовые ячейки в стене, тележка для контейнеров, знак радиационной опасности на каждой дверце.", obj: { safe: .6, crate: .7 }, loot: "isotope", sign: "Радиационная опасность. Хранилище источников" },
  x_classified: { n: "Режимный кабинет", era: "KPCOMI", w: 0, kind: "locked", desc: "Кабинет с грифом «Особой важности»: стальная дверь, сейф и компьютер, который не подключён к общей сети.", obj: { desk: .8, safe: .6, cabinet: .7, comp: .6 }, comp: "main", loot: "classified", sign: ["Режимное помещение. Вход по допуску", "Особый отдел. Посторонним вход воспрещён"] },
  x_armory:   { n: "Оружейная комната", era: "KPCOMI", w: 0, kind: "locked", desc: "Оружейная комната: стойки со стволами, ящики с батареями, верстак оружейника под чехлом.", obj: { rack: 1, locker: .6, crate: .5 }, loot: "armory", sign: "Оружейная. Вход по допуску" },

  /* «Ковчег» и Подножие; в Отражении — их отражения */
  x_engoffice:{ n: "Кабинет инженера", era: "KPO", w: 5, desc: "Чертёжный стол, лампа на гибкой ножке, рулоны схем в углу и кружка с засохшим чаем.", obj: { desk: .9, cabinet: .6, comp: .3, bookshelf: .3 }, comp: "archive", loot: "paper", sign: ["Инженер смены", "Конструкторское бюро", "Главный механик"] },
  x_laboffice:{ n: "Кабинет лаборанта", era: "KPO", w: 4, desc: "Стол с журналом проб, штативы с пробирками, вытяжной шкаф с приоткрытой створкой.", obj: { desk: .8, cabinet: .5, fridge: .4, sink: .4 }, loot: "chem", sign: ["Лаборант", "Препараторская"] },
  x_janitor:  { n: "Подсобка уборщика", era: "KPO", w: 4, desc: "Вёдра, швабры, бутыли с хлоркой и тележка. На крючке — чей-то халат с именем на кармане.", obj: { locker: .8, shelf: .6, sink: .6 }, loot: "janitor", sign: "Хозблок" },
  x_tearoom:  { n: "Чайная комната", era: "KPO", w: 4, desc: "Стол под клеёнкой, чайник, чашки с надписями. На стене — календарь, на котором никто не зачёркивает дни.", obj: { fridge: .8, board: .7, coffee: .35, sink: .4 }, loot: "food", sign: ["Комната приёма пищи", "Чайная. Не курить"], safe: true },
  x_smoke:    { n: "Курилка", era: "KPO", w: 3, desc: "Скамья, жестяная пепельница из консервной банки и стены, исписанные шутками и номерами телефонов.", obj: { board: .6, locker: .3 }, loot: "smoke", sign: "Место для курения" },
  x_shiftboss:{ n: "Кабинет начальника смены", era: "KPO", w: 4, desc: "Тяжёлый стол, график смен под стеклом, сейф в углу и журнал, который начальник заполнял каждый вечер.", obj: { desk: 1, logbook: .9, safe: .45, comp: .4 }, comp: "dispatch", loot: "paper", sign: ["Начальник смены", "Без стука не входить"] },
  x_copy:     { n: "Копировальная", era: "KPO", w: 3, desc: "Копировальный аппарат с застрявшим листом, стопки бумаги и шкаф с папками.", obj: { cabinet: .9, desk: .4, board: .4 }, loot: "paper", sign: "Множительная техника" },
  x_firstaid: { n: "Пункт первой помощи", era: "KPCO", w: 4, desc: "Кушетка, аптечный шкафчик и плакат «Помоги себе сам». Пахнет спиртом и бинтами.", obj: { firstaid: 1, sink: .6, capsule: .12 }, loot: "med", sign: "Первая помощь", safe: true },
  x_guardbooth:{ n: "Будка охраны", era: "KPO", w: 3, desc: "Стеклянная будка поста: стул, шкафчик, мониторы коридора и журнал проходов.", obj: { locker: .8, comp: .6, logbook: .6 }, comp: "cams", loot: "arms", sign: "Пост охраны" },
  x_reading:  { n: "Читальный уголок", era: "KPO", w: 3, desc: "Кресло, торшер и полка книг. Кто-то принёс их сюда из дома, чтобы было что почитать между сменами.", obj: { bookshelf: 1, board: .4, desk: .3 }, loot: "paper", sign: "Библиотека отдела", safe: true },
  x_photolab: { n: "Фотолаборатория", era: "KPO", w: 2, desc: "Красная лампа, ванночки с проявителем и бельевая верёвка с прищепками. На стене — снимки, развешанные сушиться.", obj: { photos: 1, sink: .7, cabinet: .5 }, loot: "chem", sign: ["Фотолаборатория. Не открывать — идёт проявка", "Фотолаборатория"] },
  x_elec:     { n: "Электрощитовая", era: "KPO", w: 3, desc: "Щит с рубильниками, гудящий трансформатор и схема коридоров на стене.", obj: { fusebox: 1, locker: .4 }, loot: "parts", sign: ["Электрощитовая. Опасно", "Не включать — работают люди"] },
  x_archive2: { n: "Архивная кладовая", era: "KPO", w: 3, desc: "Картотечные шкафы в три ряда, коробки с делами и стремянка.", obj: { cabinet: 1, comp: .45, shelf: .5 }, comp: "archive", loot: "paper", sign: "Архив отдела" },
  x_serverniche:{ n: "Серверная ниша", era: "KPO", w: 3, desc: "Стойка сервера гудит вентиляторами, мигают зелёные огоньки, тянет теплом.", obj: { comp: 1, crate: .3 }, comp: "server", loot: "tech", sign: "Серверная. Посторонним вход воспрещён" },
  x_chemstore:{ n: "Склад химреактивов", era: "KPO", w: 3, gas: 1, desc: "Полки с бутылями и канистрами. Несколько разбито: в воздухе едко щиплет глаза.", obj: { shelf: .9, crate: .5 }, loot: "chem", sign: "Химреактивы. Вход в средствах защиты" },
  x_xray:     { n: "Рентгенкабинет", era: "KPO", w: 2, rad: 1, desc: "Рентгеновский аппарат на штативе, свинцовая ширма, фартуки на вешалке. Знак излучения над дверью.", obj: { suitlocker: .5, comp: .5, cabinet: .4 }, comp: "medrec", loot: "rad", sign: "Рентгеновский кабинет. Не входить при горящем табло" },
  x_radchem:  { n: "Радиохимическая лаборатория", era: "KPO", w: 2, rad: 2, desc: "Перчаточный бокс, свинцовые кирпичи, мерные колбы за стеклом. Где-то здесь фонит.", obj: { shelf: .6, desk: .5, comp: .45 }, comp: "dosimetry", loot: "rad", sign: "Радиохимия. Радиационная опасность" },
  x_dispatch: { n: "Диспетчерская этажа", era: "KPO", w: 2, desc: "Пульт с лампами дверей, телефоны без гудка и журнал дежурного диспетчера.", obj: { comp: 1, logbook: .7, board: .5 }, comp: "dispatch", loot: "paper", sign: "Диспетчер этажа" },
  x_medrec:   { n: "Регистратура медблока", era: "KPO", w: 2, desc: "Стойка регистратуры, картотека пациентов и компьютер с медицинскими картами.", obj: { comp: 1, cabinet: .8 }, comp: "medrec", loot: "med", sign: "Регистратура" },
  x_dosimetry:{ n: "Пост радиационного контроля", era: "KPO", w: 2, desc: "Стойка дозиметров, табло фона по этажу и шкаф со спецодеждой.", obj: { comp: 1, suitlocker: .6, shelf: .4 }, comp: "dosimetry", loot: "protect", sign: "Дозиметрический контроль" },
  x_stock:    { n: "Кабинет кладовщика", era: "KPO", w: 3, desc: "Стол с накладными, счёты, полки с образцами и компьютер учёта.", obj: { comp: 1, desk: .6, shelf: .6 }, comp: "stock", loot: "parts", sign: "Кладовщик. Выдача по накладным" },
  x_suitstore:{ n: "Склад спецодежды", era: "KPO", w: 2, desc: "Ряды защитных костюмов на вешалках, коробки респираторов и фильтров.", obj: { suitlocker: 1, shelf: .6 }, loot: "protect", sign: "Спецодежда и СИЗ" },
  x_gaslab:   { n: "Камера газовых испытаний", era: "KPO", w: 1, gas: 3, desc: "Герметичная камера с вентилями. Клапан сорван, и газ всё ещё сочится из трубы с тихим шипением.", obj: { crate: .6, comp: .35 }, comp: "archive", loot: "chem", sign: "Газовые испытания. Без противогаза не входить" },

  /* Подножие (11–20): буровая «Глубины», Шов */
  x_drillhut: { n: "Каморка буровика", era: "P", w: 5, desc: "Нары, железная печка, промасленные рукавицы и календарь шестидесятилетней давности.", obj: { locker: .8, desk: .5, board: .5 }, loot: "parts", sign: ["Буровая бригада", "Каморка мастера"] },
  x_coreshed: { n: "Кернохранилище", era: "P", w: 3, rad: 2, desc: "Ящики с кернами — столбиками породы из скважины. Некоторые поют, если к ним прислониться ухом, а некоторые фонят.", obj: { shelf: 1, crate: .5 }, loot: "rad", sign: "Керновый склад. Образцы руками не брать" },
  x_winchbooth:{ n: "Будка лебёдчика", era: "P", w: 3, desc: "Пульт лебёдки, наушники и журнал спусков. Через окошко видно, как гудит трос.", obj: { logbook: .9, locker: .5, radio: .3 }, loot: "tech", sign: "Лебёдчик" },

  /* Колыбель (21–40): поселение в складке */
  x_pantry:   { n: "Кладовая модуля", era: "C", w: 6, desc: "Полки с банками солений, связки сушёных грибов, мешки с зерном. Всё подписано от руки.", obj: { shelf: .9, fridge: .6 }, loot: "food", sign: ["Кладовая. Брать по нужде", "Общая кладовая"] },
  x_herbdry:  { n: "Сушильня трав", era: "C", w: 4, desc: "Пучки трав под потолком, тёплый воздух и запах мяты и полыни.", obj: { shelf: 1, sink: .3 }, loot: "herbs", sign: "Сушильня" },
  x_craftnook:{ n: "Мастерская жителя", era: "C", w: 4, desc: "Верстачок, ящики с болтами и проводами, недоделанная игрушка из жести на полке.", obj: { crate: .7, locker: .5, bookshelf: .3 }, loot: "parts", sign: "Мастерская" },
  x_listen:   { n: "Комната слушания", era: "C", w: 3, desc: "Мягкие подушки на полу, раковины-рупоры в стенах: сюда приходили слушать песню складки.", obj: { bookshelf: .6, board: .6, photos: .4 }, loot: "paper", sign: "Тише: слушают", safe: true },
  x_sporevault:{ n: "Споровое хранилище", era: "C", w: 2, gas: 2, desc: "Стеллажи с банками спор. Одна лопнула: в воздухе висит сладковатая пыль, от которой першит в горле.", obj: { crate: .8, shelf: .5 }, loot: "bio", sign: "Споры. Без маски не входить" },
  x_school:   { n: "Класс поселения", era: "C", w: 3, desc: "Низкие столы, доска с нарисованными мелом нотами и полка самодельных книжек: детей здесь учили слушать.", obj: { bookshelf: .8, board: .7, desk: .5 }, loot: "paper", sign: "Класс. Тихо: идёт урок", safe: true },
  x_bathhouse:{ n: "Баня модуля", era: "C", w: 3, desc: "Деревянные полки, бочка с водой и запах берёзового веника. Печка ещё тёплая.", obj: { sink: 1, locker: .5 }, loot: "home", sign: "Баня. По четвергам — общий день", safe: true },
  x_settlerroom:{ n: "Комната поселенца", era: "C", w: 5, desc: "Кровать, сундук, вышитая подушка и рисунки на стене: дома без окон и солнце, которого здесь никто не видел.", obj: { locker: .7, photos: .6, bookshelf: .4 }, loot: "home", sign: ["Здесь живут", "Стучите"], safe: true },

  /* Отражение (41–60): зеркальная копия «Ковчега» */
  x_mirrorcloset:{ n: "Зеркальная кладовая", era: "O", w: 4, desc: "Кладовая, где всё повёрнуто наоборот: надписи на коробках задом наперёд, ручки дверц — с другой стороны.", obj: { shelf: 1, crate: .6 }, loot: "store", sign: "Яаводалк" },
  x_echoroom: { n: "Комната эха", era: "O", w: 3, desc: "Пустая комната, где каждый звук возвращается дважды: ваш шаг — и ещё чей-то, чуть позже.", obj: { board: .5, bookshelf: .5 }, loot: "paper", sign: "Комната эха" },

  /* Механизм (61–80): город машин */
  x_registry: { n: "Ячейка картотеки", era: "M", w: 6, desc: "Ящики картотеки в человеческий рост, латунные таблички, запах машинного масла и бумаги.", obj: { cabinet: 1, comp: .5 }, comp: "archive", loot: "paper", sign: ["Картотека. Ячейка", "Учётная ячейка"] },
  x_tubestation:{ n: "Станция пневмопочты", era: "M", w: 5, desc: "Латунные трубы уходят в потолок, окно выдачи посылок, стопки квитанций.", obj: { tubepost: 1, shelf: .5 }, loot: "parts", sign: "Пневмопочта. Выдача" },
  x_stampery: { n: "Штемпельная", era: "M", w: 4, desc: "Столы с печатями и штемпельными подушками, гроздья пломб, журнал выдачи бланков.", obj: { desk: .8, cabinet: .6, logbook: .5 }, loot: "paper", sign: "Штемпельная. Бланки строгой отчётности" },
  x_oilroom:  { n: "Маслостанция", era: "M", w: 3, gas: 1, desc: "Бочки с маслом, насос и лужи на полу. От паров кружится голова.", obj: { shelf: .8, crate: .5 }, loot: "parts", sign: "Смазочная станция. Огнеопасно" },
  x_gearroom: { n: "Шестерёночная", era: "M", w: 4, desc: "Ящики с шестернями, валами и пружинами, рассортированными по размеру. Каждый ящик опломбирован.", obj: { shelf: 1, crate: .6 }, loot: "parts", sign: "Запасные части. Выдача по накладным" },
  x_inspect:  { n: "Кабинет инспектора", era: "M", w: 3, desc: "Стол инспектора, штамп «Принято» и штамп «Отклонено». Второй стёрт сильнее.", obj: { desk: .9, logbook: .7, comp: .4 }, comp: "dispatch", loot: "paper", sign: "Инспектор приёмки" },
  x_clerkcell:{ n: "Кабинет делопроизводителя", era: "M", w: 4, desc: "Стол, счётная машина, лоток «Входящие» и лоток «Исходящие». Оба полны.", obj: { desk: .9, cabinet: .6, comp: .4 }, comp: "stock", loot: "paper", sign: ["Делопроизводитель", "Приём документов"] },

  /* Исток (81+): мир садовника */
  x_gardennook:{ n: "Ниша садовника", era: "I", w: 4, desc: "Лейки, секаторы, мешочки с семенами и тихо жужжащий маленький дрон-садовник на зарядке.", obj: { shelf: .7, fridge: .3, board: .4 }, loot: "bio", sign: "Садовник" },
  x_seedvault:{ n: "Семенное хранилище", era: "I", w: 0, kind: "locked", desc: "Ячейки с семенами под стеклом, ровный холод и табличка: «Для того, что будет после».", obj: { safe: .6, shelf: .8 }, loot: "bio", sign: "Семенное хранилище. Доступ ограничен" },
  x_quietcell:{ n: "Тихая келья", era: "I", w: 3, desc: "Каменная келья: лежанка, полка книг и тишина, в которой слышно собственное сердце.", obj: { bookshelf: .7, capsule: .25 }, loot: "paper", sign: "Тишина", safe: true },
  x_wateryard:{ n: "Водяной дворик", era: "I", w: 3, desc: "Каменная чаша, в которую с потолка капает вода, мох на стенах и тихий плеск.", obj: { sink: 1, board: .4 }, loot: "food", sign: "Вода. Пейте", safe: true },
  x_memoryhall:{ n: "Зал памяти", era: "I", w: 3, desc: "Портреты тех, кто спускался сюда до вас, и подписи: имена, даты, иногда одна фраза.", obj: { photos: 1, bookshelf: .4 }, loot: "paper", sign: "Помним", safe: true },
  x_toolshed: { n: "Сарай садовника", era: "I", w: 4, desc: "Грабли, лопаты, мотки проволоки и ящик с запчастями для дронов.", obj: { locker: .7, shelf: .7 }, loot: "parts", sign: "Инвентарь" },
  x_hive:     { n: "Пасека машин", era: "I", w: 3, desc: "Ульи из жести, в которых гудят крошечные механические пчёлы. На полке — соты с настоящим мёдом.", obj: { shelf: .8, crate: .4 }, loot: "food", sign: "Пасека. Не шуметь" },
  x_machgarden:{ n: "Сад машин", era: "I", w: 3, desc: "Механические цветы на медных стеблях раскрываются, когда вы проходите мимо, и тихо звенят.", obj: { crate: .6, comp: .4 }, comp: "server", loot: "tech", sign: "Сад машин" }
};
for (var rk in ROOMS) { ROOMS[rk].annex = true; if (!LAB.ROOMS[rk]) LAB.ROOMS[rk] = ROOMS[rk]; }

/* ── ДОБЫЧА КАБИНЕТОВ ── Товары своей глубины: ценности, еда, лекарства,
   защита, инструменты, детали — смотря что за помещение. */
function itemsOf(L, test) {
  var out = [];
  for (var k in LAB.ITEMS) { var d = LAB.ITEMS[k]; if (!d.price || d.surf || d.nosell) continue; if ((d.depth || 1) > L) continue; if (test(d, k)) out.push(k); }
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
function annexLoot(r, L, F, tag, ot) {
  var out = [], n = ot === "safe" ? 3 : ot === "crate" || ot === "shelf" ? r.int(1, 3) : r.int(1, 2);
  var add = function (x) { if (x) out.push(x); };
  var cr = function (b) { return { kind: "credits", n: LAB.credits(b + r.int(0, 12), L, F) }; };
  for (var i = 0; i < n; i++) {
    var q = r.next();
    switch (tag) {
      case "stash": add(q < 0.35 ? it(catPick(r, L, "valuable")) : q < 0.55 ? cr(30) : q < 0.75 ? it(catPick(r, L, "med")) : q < 0.9 ? { kind: "ammo", ammo: "energy", n: 2 } : it(catPick(r, L, "tool"))); break;
      case "hot": add(q < 0.35 ? it(r.chance(0.5) ? "isotope" : "goldbar") : q < 0.6 ? it(catPick(r, L, "valuable")) : q < 0.8 ? it("lead", 2) : it(r.chance(0.5) ? "radaway" : "antirad")); break;
      case "isotope": add(q < 0.4 ? it("lead", r.int(1, 2)) : q < 0.6 ? it(L >= 5 && r.chance(0.5) ? "isotope" : "antirad") : q < 0.8 ? it(catPick(r, L, "valuable")) : it("iodine")); break;
      case "classified": add(q < 0.35 ? it(catPick(r, L, "valuable")) : q < 0.55 ? { kind: "note", note: "staff", n: r.int(0, 999) } : q < 0.75 ? cr(25) : it(r.chance(0.5) ? "decoder" : "jammer")); break;
      case "armory": add(q < 0.45 ? { kind: "ammo", ammo: r.chance(0.7) ? "energy" : (LAB.AMMO.slug && L >= 2 ? "slug" : "energy"), n: 1 + r.int(0, 1) } : q < 0.6 ? it(r.chance(0.5) ? "emp" : "wrepair") : q < 0.8 ? it(partPick(r, L)) : cr(15)); break;
      case "protect": add(q < 0.3 ? it(r.chance(0.6) ? "respirator" : "filter") : q < 0.5 ? it(r.chance(0.5) ? "rubber" : "filtercart") : q < 0.65 ? it(r.chance(0.5) ? "iodine" : "antirad") : q < 0.8 ? it("tape") : it(r.chance(0.15) ? "dosimeter" : "lead")); break;
      case "rad": add(q < 0.35 ? it("lead") : q < 0.55 ? it(r.chance(0.5) ? "antirad" : "iodine") : q < 0.7 ? it(catPick(r, L, "valuable")) : q < 0.85 ? it(partPick(r, L)) : it(r.chance(0.3) ? "dosimeter" : "rubber")); break;
      case "med": case "herbs": add(q < 0.55 ? it(catPick(r, L, "med")) : q < 0.75 ? it(r.chance(0.5) ? "medkit_s" : "bandage") : q < 0.9 ? it(catPick(r, L, "food")) : it("gel")); break;
      case "food": case "home": add(q < 0.6 ? it(catPick(r, L, "food")) : q < 0.75 ? it(catPick(r, L, "valuable")) : q < 0.9 ? cr(8) : it(catPick(r, L, "med"))); break;
      case "smoke": add(q < 0.45 ? it(catPick(r, L, "valuable")) : q < 0.75 ? cr(6) : it(catPick(r, L, "food"))); break;
      case "janitor": add(q < 0.3 ? it("tape") : q < 0.5 ? it(r.chance(0.5) ? "rubber" : "reagent") : q < 0.7 ? it(partPick(r, L)) : q < 0.85 ? it(catPick(r, L, "valuable")) : it("respirator")); break;
      case "chem": add(q < 0.4 ? it(r.chance(0.6) ? "reagent" : "gel") : q < 0.6 ? it(catPick(r, L, "med")) : q < 0.75 ? it(r.chance(0.5) ? "filtercart" : "respirator") : q < 0.9 ? it(partPick(r, L)) : it(catPick(r, L, "valuable"))); break;
      case "paper": add(q < 0.35 ? { kind: "note", note: "staff", n: r.int(0, 999) } : q < 0.6 ? it(catPick(r, L, "valuable")) : q < 0.8 ? cr(10) : it(catPick(r, L, "food"))); break;
      case "tech": add(q < 0.45 ? it(r.chance(0.5) ? "chip" : partPick(r, L)) : q < 0.6 ? it("datachip") : q < 0.8 ? { kind: "ammo", ammo: "energy", n: 1 } : it(catPick(r, L, "tool"))); break;
      case "bio": add(q < 0.5 ? it(r.chance(0.6) ? "gel" : "reagent") : q < 0.7 ? it(catPick(r, L, "food")) : q < 0.85 ? it(catPick(r, L, "med")) : it(L >= 4 ? "culture" : catPick(r, L, "valuable"))); break;
      case "arms": add(q < 0.5 ? { kind: "ammo", ammo: "energy", n: 1 } : q < 0.7 ? it(r.chance(0.5) ? "bandage" : "emp") : q < 0.85 ? it(catPick(r, L, "valuable")) : cr(10)); break;
      default: /* store, parts */ add(q < 0.5 ? it(partPick(r, L), r.chance(0.3) ? 2 : 1) : q < 0.65 ? it(catPick(r, L, "food")) : q < 0.78 ? it(r.chance(0.5) ? "tape" : "rubber") : q < 0.9 ? it(catPick(r, L, "valuable")) : cr(8));
    }
  }
  /* сейф — ценное наверняка; оружейная стойка — ствол; шкаф спецодежды — костюм от излучения */
  if (ot === "safe") out.push(r.chance(0.5) ? it(catPick(r, L, "valuable") || "watch") : { kind: "credits", n: LAB.credits(35, L, F) });
  if (ot === "rack" && LAB.genWeapon) out.push({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.1 }) });
  if (ot === "suitlocker" && r.chance(0.3)) out.push({ kind: "armor", a: LAB.makeArmor(r.chance(0.7) || L < 2 ? "radcape" : "radsuit", LAB.foeLevel(L, F), 1) });
  if (tag === "hot" && ot === "crate" && r.chance(0.35)) out.push({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.3 }) });
  return out.filter(function (x) { return x && (x.kind !== "item" || (x.item && LAB.ITEMS[x.item])); });
}
LAB.annexLoot = annexLoot;

/* ════════ ПОСТРОЕНИЕ ════════ */
var T = LAB.T;
/* Где можно вырезать помещение у коридора c: сторона side (0 — меньшие
   координаты поперёк, 1 — большие), дверь на шаге along вдоль коридора.
   Вокруг помещения — сплошная стена толщиной в клетку, кроме двери. */
function carveSpot(fl, c, side, along, w, h, off) {
  var W = LAB.W, H = LAB.H, t = fl.t;
  var hz = c.axis === "h";
  var wallA = hz ? (side ? c.y1 + 1 : c.y0 - 1) : (side ? c.x1 + 1 : c.x0 - 1); /* линия стены с дверью */
  var dir = side ? 1 : -1;
  var a0 = along - off, a1 = a0 + w - 1;                 /* вдоль коридора */
  var b0 = wallA + dir, b1 = wallA + dir * h;            /* вглубь от коридора */
  var lo = Math.min(b0, b1), hi = Math.max(b0, b1);
  var cell = function (a, b) { return hz ? [a, b] : [b, a]; };
  /* помещение и стена вокруг — только стена, внутри карты */
  for (var a = a0 - 1; a <= a1 + 1; a++) for (var b = lo - 1; b <= hi + 1; b++) {
    var p = cell(a, b), x = p[0], y = p[1];
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    var inside = a >= a0 && a <= a1 && b >= lo && b <= hi;
    if (inside && (x < 1 || y < 1 || x > W - 2 || y > H - 2)) return null;
    if (t[y * W + x] !== T.WALL) return null;
  }
  var d = cell(along, wallA), front = cell(along, hz ? (side ? c.y1 : c.y0) : (side ? c.x1 : c.x0));
  return { x0: hz ? a0 : lo, x1: hz ? a1 : hi, y0: hz ? lo : a0, y1: hz ? hi : a1, door: d, front: front, side: hz ? (side ? "N" : "S") : (side ? "W" : "E") };
}
function blockedFront(fl, x, y) {
  var i = y * LAB.W + x;
  if (fl.t[i] !== T.CORR) return true;
  if (fl.foes.some(function (f) { return f.x === x && f.y === y; })) return true;
  if ((fl.hazards || []).some(function (h) { return (h.cells || []).some(function (q) { return q[0] === x && q[1] === y; }); })) return true;
  return false;
}
function pickType(r, era, L) {
  var pool = [], tot = 0;
  for (var k in ROOMS) { var d = ROOMS[k]; if (!d.w || d.era.indexOf(era) < 0) continue; pool.push(k); tot += d.w; }
  var x = r.next() * tot;
  for (var i = 0; i < pool.length; i++) { x -= ROOMS[pool[i]].w; if (x <= 0) return pool[i]; }
  return pool[pool.length - 1] || "x_store";
}
/* Особые зоны этажа: сколько и каких. Глубже — больше. */
function specialsFor(r, L, F) {
  var d0 = LAB.depth(L, F), out = [];
  out.push("x_supply");
  if (r.chance(Math.min(0.55, 0.3 + d0 * 0.002))) out.push("x_stash");
  if (!(L === 1 && F <= 2) && r.chance(Math.min(0.75, 0.35 + d0 * 0.003))) out.push(eraOf(L) === "I" && r.chance(0.5) ? "x_seedvault" : r.pick(["x_classified", "x_classified", "x_armory"]));
  if (!(L === 1 && F <= 3) && r.chance(Math.min(0.6, 0.2 + d0 * 0.003))) out.push("x_isotope");
  if ((L >= 2 || F >= 6) && r.chance(Math.min(0.5, 0.18 + d0 * 0.002))) out.push("x_hotcell");
  if (!(L === 1 && F <= 2) && r.chance(0.3)) out.push("x_trial");
  return out;
}
/* Номер следующего помещения на табличках этажа. */
function maxNum(fl) { var m = 0; fl.rooms.forEach(function (q) { if (q && q.num > m) m = q.num; }); return m; }

LAB.annex = { ROOMS: ROOMS, eraOf: eraOf, loot: annexLoot };
LAB.annex.place = function (ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, W = LAB.W;
  var r = LAB.Rng(ctx.seed, "annex:" + L + ":" + F + ":" + ctx.attempt);
  var era = eraOf(L), lev = LAB.LEVELS[L];
  var secret = fl.secret;
  /* 1. Места у коридоров: от одного до трёх у каждого (кроме тайного хода). */
  var cors = r.shuffle(fl.corrs.filter(function (c) { return c.a !== secret && c.b !== secret; }));
  var spots = [], used = {};
  cors.forEach(function (c) {
    var want = 1 + (r.chance(0.6) ? 1 : 0) + (c.len >= 15 && r.chance(0.45) ? 1 : 0);
    var got = 0;
    for (var tries = 0; tries < 14 && got < want; tries++) {
      var side = r.int(0, 1), w = r.int(3, 5), h = r.int(3, 5);
      var lo = (c.axis === "h" ? c.x0 : c.y0) + 2, hi = (c.axis === "h" ? c.x1 : c.y1) - 2;
      if (hi < lo) break;
      var along = r.int(lo, hi), off = r.int(0, w - 1);
      var sp = carveSpot(fl, c, side, along, w, h, off);
      if (!sp) continue;
      if (blockedFront(fl, sp.front[0], sp.front[1])) continue;
      /* не вплотную к другой двери этого коридора */
      var key = c.id + ":" + side;
      if ((used[key] || []).some(function (a2) { return Math.abs(a2 - along) < 3; })) continue;
      (used[key] = used[key] || []).push(along);
      /* занять сразу: следующие места проверяются уже с этим помещением */
      sp.c = c; sp.zone = fl.zone[c.mouthRoom] != null ? fl.zone[c.mouthRoom] : -1;
      sp.id = fl.rooms.length;
      reserve(fl, sp);
      spots.push(sp); got++;
    }
  });
  if (!spots.length) { fallbackSupply(ctx, r); return; }
  /* 2. Особые зоны: пункт снабжения — у начальной зоны, если можно;
     тайник и режимные — подальше от начала; горячая камера — с постом
     дезактивации поблизости. */
  var free = spots.slice();
  var takeSpot = function (pref) {
    var list = free.filter(pref || function () { return true; });
    if (!list.length) list = free;
    if (!list.length) return null;
    var s = r.pick(list);
    free.splice(free.indexOf(s), 1);
    return s;
  };
  var types = {};
  specialsFor(r, L, F).forEach(function (ty) {
    var def = ROOMS[ty], s = null;
    if (ty === "x_supply") s = takeSpot(function (q) { return q.zone === -1; });
    else if (def.kind === "secret" || def.kind === "locked" || def.kind === "hazard") s = takeSpot(function (q) { return q.zone !== -1 || q.c.doorRoom === fl.D; });
    else s = takeSpot();
    if (s) types[s.id] = ty;
  });
  var hasHot = Object.keys(types).some(function (k) { var d = ROOMS[types[k]]; return d.rad >= 3; });
  if (hasHot && free.length && r.chance(0.7)) { var dc = takeSpot(); if (dc) types[dc.id] = "x_decon"; }
  free.forEach(function (s) { types[s.id] = pickType(r, era, L); });
  /* 3. Помещения, двери, обстановка. */
  var num = maxNum(fl);
  spots.forEach(function (s) {
    var ty = types[s.id] || "x_store", def = ROOMS[ty];
    var rm = fl.rooms[s.id];
    rm.type = ty; rm.name = def.n; rm.surf = lev.surf;
    if (def.rad) rm.rad = def.rad === 3 ? 3 + (r.chance(0.35) ? 1 : 0) : def.rad === 2 ? 2 + (r.chance(0.25) ? 1 : 0) : def.rad;
    if (def.gas) rm.gas = def.gas + (def.gas < 3 && r.chance(0.25) ? 1 : 0);
    /* дверь */
    var d = fl.doorAt[s.door[1] * W + s.door[0]];
    if (def.kind === "secret") { d.kind = "secret"; d.lock = { type: "secret", inner: false }; rm.hidden = true; rm.sign = ""; }
    else {
      num++; rm.num = num;
      var sg = def.sign ? (typeof def.sign === "string" ? def.sign : r.pick(def.sign)) : "";
      rm.sign = "Помещение " + num + ". " + def.n + (sg && sg !== def.n ? ". " + sg : "");
      if (rm.rad) rm.sign += ". Знак радиационной опасности";
      if (rm.gas) rm.sign += ". Знак химической опасности";
      d.kind = def.kind === "hazard" ? "heavy" : def.kind === "locked" ? "heavy" : r.chance(0.7) ? "auto" : "hatch";
      if (def.kind === "hazard") d.lock = { type: "hazard", need: "rad", min: 0.5 };
      if (def.kind === "locked") d.lock = lockFor(ctx, r, s, rm);
    }
    /* обстановка */
    furnish(ctx, r, s, rm, def);
  });
  /* 4. Пункт снабжения обязателен: если места у коридоров не нашлось — в помещении начальной зоны. */
  if (!fl.objs.some(function (o) { return o.type === "supply"; })) fallbackSupply(ctx, r);
  fl.annexN = spots.length;
};
/* Вырезать помещение и дверь сразу (до выбора типа). */
function reserve(fl, s) {
  var W = LAB.W, id = s.id;
  var rm = { id: id, x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, zone: s.zone, doors: [], mouths: [], annex: true, corr: s.c.id, type: "x_store", name: ROOMS.x_store.n };
  rm.cx = Math.floor((rm.x0 + rm.x1) / 2); rm.cy = Math.floor((rm.y0 + rm.y1) / 2);
  fl.rooms[id] = rm;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) { fl.t[y * W + x] = T.ROOM; fl.room[y * W + x] = id; }
  var di = s.door[1] * W + s.door[0];
  var door = { id: "d" + fl.doors.length, x: s.door[0], y: s.door[1], a: s.c.a, b: s.c.b, room: id, side: s.side, other: -1, corr: -1, acorr: s.c.id, annex: true, kind: "auto", lock: null, tree: false, lockChild: -1 };
  fl.t[di] = T.DOOR; fl.corrAt[di] = s.c.id;
  fl.doors.push(door); fl.doorAt[di] = door;
  rm.doors.push(door.id);
  (s.c.annex = s.c.annex || []).push(door.id);
}
/* Замок режимного помещения: код (в записке, письме или журнале смены
   на этаже), ключ (у кого-то на этаже) или пропуск на ступень старше
   вашего — его не найти, но замок взламывают, а декодер открывает. */
function lockFor(ctx, r, s, rm) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, lev = LAB.LEVELS[L];
  var q = r.next();
  var mains = fl.rooms.filter(function (m, i) { return m && i < 12 && i !== fl.secret && i !== fl.U; }).map(function (m) { return m.id; });
  if (!mains.length) mains = [fl.U];
  if (q < 0.5) {
    var code = String(r.int(1000, 9999)), sp = r.pick(mains), cw = r.next();
    rm.codeAt = sp;
    if (cw < 0.35) ctx.addObj("pc", sp, { own: r.int(0, 99999), codeFor: "", codeRoom: rm.name, code: code }) || ctx.addItem({ kind: "note", note: "code", code: code, room: rm.name }, sp);
    else ctx.addItem({ kind: "note", note: "code", code: code, room: rm.name }, sp);
    return { type: "code", code: code };
  }
  if (q < 0.78) {
    var keyId = "ka" + L + "_" + F + "_" + rm.id;
    var kname = "Ключ «" + rm.name + "»";
    var spot = r.pick(mains), done = false;
    /* иногда ключ носит охранник или тварь этажа */
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
function furnish(ctx, r, s, rm, def) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F;
  if (def.kind === "supply") { ctx.addObj("supply", rm.id, { prof: null }); return; }
  if (def.kind === "trial") { ctx.addObj("trial", rm.id, { seed: r.int(1, 99999), prize: r.pick(["suit", "suit", "bp", "kit"]) }); return; }
  var placed = 0;
  for (var ot in def.obj) {
    if (!r.chance(def.obj[ot])) continue;
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
    if (LAB.CONTAINERS.indexOf(ot) >= 0) o.loot = annexLoot(r, L, F, def.loot || "store", ot);
    if (ot === "safe") {
      /* код сейфа — в записке где-то на этаже */
      var mains = fl.rooms.filter(function (m, i) { return m && i < 12 && i !== fl.secret; }).map(function (m) { return m.id; });
      ctx.addItem({ kind: "note", note: "safe", code: o.code, room: rm.name }, r.pick(mains));
    }
    if (ot === "comp" && extra.kind === "main") o.loot = annexLoot(r, L, F, "classified", "desk");
  }
  /* пустой кабинет — хотя бы стеллаж */
  if (!placed) { var o2 = ctx.addObj(def.kind === "hazard" ? "crate" : "shelf", rm.id, null); if (o2) o2.loot = annexLoot(r, L, F, def.loot || "store", "shelf"); }
  /* на полу — мелочь своей глубины */
  if (r.chance(0.35)) { var x = annexLoot(r, L, F, def.loot || "store", "floor")[0]; if (x && x.kind !== "weapon" && x.kind !== "armor") ctx.addItem(x, rm.id); }
  /* в радиоактивных и горячих зонах — твари, которых изменило излучение; у режимных — охрана */
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
function standIn(fl, rm) {
  var cand = [], W = LAB.W;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) {
    if (fl.objAt[y * W + x]) continue;
    if (fl.items.some(function (q) { return q.x === x && q.y === y; })) continue;
    if (fl.foes.some(function (q) { return q.x === x && q.y === y; })) continue;
    /* не у самой двери */
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
