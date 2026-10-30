/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — мир мутантов (2.5, просьба игрока).
   Твари разные не только видом, но и умом, рангом и укладом жизни.
   Ум (mind): 0 — неразумные, живут инстинктом: не отступают, не
   открывают дверей, их легко сбить шумом; 1 — полуразумные: стайные и
   хитрые, раненые отходят, скликают своих; 2 — разумные: открывают
   двери, обходят с флангов, держат строй, ходят отрядами с вожаком;
   3 — сверхразумные: улей и провидцы — видят носителя сквозь стены и
   подсказывают отряду, бьют по нервам.
   Ранг (rank): low — низшие, mid — средние, high — высшие, apex — вершина.
   Каста (caste) — у разумных народов глубин: worker — рабочие (бегут и
   поднимают тревогу), soldier — воины, hunter — охотники (засады,
   фланги), spitter — стрелки, guard — стражи (заслоняют своих), priest —
   жрецы (лечат, подхватывают командование), seer — провидцы (видят вас
   и шепчут отряду), leader — вожаки, queen — матки (рожают новых),
   drone — трутни-самоубийцы, trapper — ткачи (ставят ловушки).
   Отряды (PACKS): свора, семья, звено, улей, банда, народ — их ставит
   этаж (place), у каждого — вожак, а у разумных — и жрецы, и провидцы.
   Развитие: твари крепнут — ранив вас, пережив бой, съев павшего; а
   разумные, пока вас нет на этаже, растут сами. Четыре ступени: молодая,
   окрепшая, матёрая, древняя. Улей глубин учится на вашем оружии.
   Синтаксис — не новее ES2017; без DOM: файл читают и проверки в Node.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

/* ════════ НОВЫЕ ТВАРИ ════════
   Поля врага — как в LAB.FOES (data.js); сверх того: mind, rank, fam
   (семейство — для бестиария), caste, lv — с какого по какой уровень
   встречается, nolist — только в отрядах (матки), minion — кого рожает,
   bleeder — когти и лезвия: раны чаще кровят. Новые повадки: flee —
   трус, удирает в одиночку; howl — скликает своих; bomber — бежит и
   лопается вплотную; trapper — ставит ловушки; feeder — ест павших и
   растёт; rad — фонит; psi — бьёт по нервам; corrode — разъедает броню;
   silent — шагов не слышно, пока не подойдёт; adapt — привыкает к
   оружию; lure — зовёт человеческим голосом; marker — метит носителя. */
var NEW = {
  /* ── «Ковчег»: сбежавшие из вивариев и заражённые сотрудники ── */
  u_gnawer: { n: "Грызунец", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [1, 10],
    desc: "Мелкая серая тварь с голым хвостом, сбежавшая из вивария. Поодиночке пугливо удирает и пищит по углам, а стаей кусает всерьёз — и обгладывает павших, от этого становясь крупнее. Тонкий писк и цоканье коготков по металлу.",
    hp: 9, dmg: 2, arm: 0, spd: 1, rng: 1, acd: 1, det: 5, beh: ["chase", "swarm", "flee", "feeder"], adt: "phys", snd: "rat", sndRate: 1.4, xp: 5 },
  u_cablerat: { n: "Проводник", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [1, 10],
    desc: "Крысолак, привыкший грызть проводку: шерсть дыбом от статики, укус бьёт током и тянет заряд имплантов. В темноте слышно, как он потрескивает искрами. Холода боится.",
    hp: 12, dmg: 3, arm: 0, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "drain"], adt: "shock", snd: "rat", sndRate: 1.15, xp: 7, res: { cryo: 1.5, shock: 0.3 } },
  u_larva: { n: "Личинка", g: "f", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [4, 30],
    desc: "Белёсая личинка с ладонь: ползёт на тепло и грызёт мелкими челюстями. Одна не опасна, но их редко бывает одна — кладки прячут в шкафах, ульях и гнёздах. Шуршит, как сухие листья.",
    hp: 7, dmg: 2, arm: 0, spd: 2, rng: 1, acd: 2, det: 4, beh: ["chase", "swarm"], adt: "phys", snd: "roach", sndRate: 1.55, xp: 3 },
  u_tick: { n: "Клещ-кровосос", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [8, 60],
    desc: "Клещ величиной с ладонь: замирает и прыгает, когда вы рядом, а впившись, пьёт кровь и заживает сам. Сухое щёлканье лапок — знак отойти.",
    hp: 10, dmg: 3, arm: 1, spd: 1, rng: 1, acd: 2, det: 3, beh: ["ambush", "chase", "leech"], adt: "phys", snd: "roach", sndRate: 1.7, xp: 6 },
  u_moth: { n: "Пепельница", g: "f", kind: "bio", mind: 0, rank: "low", fam: "Летуны и рои", lv: [2, 12],
    desc: "Моль с ладонь, вся в серой пыльце: летит на тепло, а пыльца с крыльев жжёт горло и травит. Шорох крыльев — как перелистанная книга.",
    hp: 8, dmg: 2, arm: 0, spd: 1, rng: 1, acd: 2, det: 6, beh: ["chase", "swarm", "fly", "poison"], adt: "chem", snd: "spore", sndRate: 1.6, xp: 5 },
  u_crawler: { n: "Ползун", g: "m", kind: "bio", mind: 0, rank: "mid", fam: "Заражённые сотрудники", lv: [1, 10],
    desc: "Бывший сотрудник без ног, сросшийся с полом: ползёт медленно, шурша халатом, но хватает за щиколотки так, что сразу не вырваться. Лежит у дверей и ждёт. Хрипит.",
    hp: 34, dmg: 6, arm: 1, spd: 3, rng: 1, acd: 2, det: 5, beh: ["ambush", "chase", "slow"], adt: "phys", snd: "labmut", sndRate: 0.8, xp: 13, carrier: true },
  u_husk: { n: "Оболочка", g: "f", kind: "bio", mind: 0, rank: "mid", fam: "Заражённые сотрудники", lv: [2, 12],
    desc: "Тело сотрудника, которое лежит неподвижно, как мёртвое, пока вы не пройдёте рядом. Внутри зреют споры: погибая, оболочка лопается ядовитым облаком — бейте издалека.",
    hp: 28, dmg: 7, arm: 0, spd: 2, rng: 1, acd: 2, det: 3, beh: ["ambush", "chase", "explode", "poison"], adt: "chem", snd: "labmut", sndRate: 0.95, xp: 13 },
  u_orderly: { n: "Санитар", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Заражённые сотрудники", lv: [1, 10],
    desc: "Мутант в резиновом фартуке и перчатках: по старой привычке обходит коридоры и «убирает» всё живое. Открывает двери, шаркает резиновыми сапогами. При нём бывают ключи и лекарства.",
    hp: 40, dmg: 7, arm: 2, spd: 2, rng: 1, acd: 2, det: 6, beh: ["chase", "dooropen", "patrol"], adt: "phys", snd: "labmut", sndRate: 1.05, xp: 15, carrier: true },
  u_dog: { n: "Сторожевой пёс", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Своры и стаи", lv: [3, 12],
    desc: "Пёс охраны «Ковчега»: облезлый, с раздутыми челюстями. Идёт на звук шагов, взяв след, не отстаёт, а перед броском хрипло лает, скликая свору.",
    hp: 30, dmg: 7, arm: 1, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "tracker", "howl"], adt: "phys", snd: "chimera", sndRate: 1.3, xp: 14, bleeder: true },
  u_alphadog: { n: "Вожак своры", g: "m", kind: "bio", mind: 1, rank: "high", caste: "leader", fam: "Своры и стаи", lv: [4, 14],
    desc: "Крупный пёс с седой холкой: свора слушается его рыка. Рядом с вожаком псы смелее и кусают злее, а без него разбегаются. Его рык ниже и раскатистее, чем у прочих.",
    hp: 60, dmg: 10, arm: 2, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "tracker", "howl"], adt: "phys", snd: "chimera", sndRate: 1.1, xp: 28, bleeder: true },
  u_sprout: { n: "Росток", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Растения и грибы", lv: [3, 8],
    desc: "Молодой побег программы «Зелёный щит»: стоит смирно в кадке или в трещине пола, а когда вы проходите рядом, хлещет и опутывает ноги. Шелест листьев без ветра — вот признак.",
    hp: 18, dmg: 4, arm: 0, spd: 99, rng: 1, acd: 2, det: 2, beh: ["stationary", "ambush", "slow"], adt: "phys", snd: "vine", sndRate: 1.3, xp: 6 },
  u_bloater: { n: "Вздутень", g: "m", kind: "bio", mind: 0, rank: "mid", fam: "Заражённые сотрудники", lv: [3, 10],
    desc: "Раздутое газом тело на тонких ногах: ковыляет и булькает. Погибая, лопается облаком едкого газа на шаг вокруг. Не подпускайте и бейте издалека.",
    hp: 40, dmg: 6, arm: 0, spd: 3, rng: 1, acd: 2, det: 4, beh: ["chase", "explode", "poison"], adt: "chem", snd: "swamp", sndRate: 0.85, xp: 15 },
  u_lockermimic: { n: "Шкафник", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Притворщики", lv: [5, 40],
    desc: "Тварь, научившаяся жить среди мебели и отрастившая себе дверцы из хитина. Стоит смирно, как шкафчик, а дверца у неё тёплая и чуть дышит. Тронете — челюсти сомкнутся.",
    hp: 46, dmg: 11, arm: 4, spd: 2, rng: 1, acd: 2, det: 2, beh: ["chase", "mimic"], adt: "phys", snd: "lizard", sndRate: 0.8, xp: 22, bleeder: true },
  u_thinker: { n: "Лаборант-мыслитель", g: "m", kind: "bio", mind: 2, rank: "mid", fam: "Заражённые сотрудники", lv: [4, 10],
    desc: "Мутант, сохранивший разум учёного: бормочет формулы, открывает двери, держится на расстоянии и мечет колбы с реактивами. Раненый — отступает и зовёт других. У него в карманах звенит стекло.",
    hp: 38, dmg: 8, arm: 1, spd: 2, rng: 3, acd: 3, det: 7, beh: ["ranged", "dooropen", "poison", "howl"], adt: "chem", snd: "labmut", sndRate: 1.15, xp: 20, carrier: true },
  u_frostling: { n: "Инейник", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [6, 9],
    desc: "Зверёк из криокамер, покрытый инеем: стайками налетает и холодит укусами. Хрустит, как снег под ногой. Жара не выносит.",
    hp: 16, dmg: 4, arm: 1, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm", "slow"], adt: "therm", snd: "frozen", sndRate: 1.45, xp: 8, res: { cryo: 0.3, thermo: 1.7 } },
  u_glower: { n: "Светящийся", g: "m", kind: "bio", mind: 0, rank: "mid", fam: "Заражённые сотрудники", lv: [6, 10],
    desc: "Работник энергоблока, светящийся изнутри от изотопов. Сам по себе медлителен, но рядом с ним фонит: постоите близко — получите дозу. Счётчик трещит при его приближении.",
    hp: 44, dmg: 8, arm: 2, spd: 3, rng: 1, acd: 2, det: 5, beh: ["chase", "rad"], adt: "therm", snd: "spark", sndRate: 0.9, xp: 18 },
  u_gunner: { n: "Стрелок-мутант", g: "m", kind: "bio", mind: 2, rank: "mid", fam: "Заражённые сотрудники", lv: [8, 10],
    desc: "Охранник оружейных лабораторий, сросшийся с винтовкой: ствол врос в предплечье, а целится он лучше, чем при жизни. Держит дистанцию, прячется за углы. Перезарядку слышно по щелчку — тогда и бейте.",
    hp: 46, dmg: 9, arm: 3, spd: 2, rng: 5, acd: 2, det: 7, beh: ["ranged", "dooropen"], adt: "energy", snd: "soldier", sndRate: 1.15, xp: 22, carrier: true },
  u_magnetic: { n: "Магнитник", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Заражённые сотрудники", lv: [9, 10],
    desc: "Оператор ускорителя, переживший облучение полем: вокруг него гудит магнитное поле, железо липнет к коже. Тянет энергию имплантов и бьёт полем на три шага.",
    hp: 40, dmg: 8, arm: 2, spd: 2, rng: 3, acd: 3, det: 6, beh: ["ranged", "drain"], adt: "field", snd: "phase", sndRate: 1.25, xp: 20, res: { kinetic: 0.7 } },

  /* ── «Подножие»: штольни, озеро, городок и звучащий слой ── */
  u_cavebat: { n: "Летяга", g: "f", kind: "bio", mind: 0, rank: "low", fam: "Летуны и рои", lv: [11, 22],
    desc: "Пещерная летяга с перепонками от локтя до колена: не видит, а слышит. Стаями пикирует на звук шагов; сухие щелчки и шорох под потолком значат, что стая вас нашла.",
    hp: 12, dmg: 3, arm: 0, spd: 1, rng: 1, acd: 2, det: 7, beh: ["chase", "swarm", "fly", "deaf"], adt: "phys", snd: "blind", sndRate: 1.55, xp: 7, res: { sonic: 1.8 } },
  u_stonemite: { n: "Камнегрыз", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [11, 18],
    desc: "Клещ, который ест камень: панцирь как гранит, пули отскакивают. Уходит в породу и выныривает рядом. Скрежет под ногами — он здесь. Звук его раскалывает.",
    hp: 20, dmg: 4, arm: 6, spd: 2, rng: 1, acd: 2, det: 4, beh: ["chase", "burrow"], adt: "phys", snd: "roach", sndRate: 0.7, xp: 9, res: { kinetic: 0.6, sonic: 1.6 } },
  u_driller: { n: "Буровик", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Заражённые сотрудники", lv: [12, 19],
    desc: "Бывший рабочий «Глубины»: правая рука срослась с буровой коронкой. Разгоняется по прямой и бьёт с разгона; визг коронки слышно за коридор — уходите в сторону.",
    hp: 54, dmg: 10, arm: 3, spd: 2, rng: 1, acd: 2, det: 6, beh: ["chase", "charge", "dooropen"], adt: "phys", snd: "labmut", sndRate: 0.75, xp: 24, carrier: true, bleeder: true },
  u_caller: { n: "Зазывала", g: "m", kind: "bio", mind: 2, rank: "mid", fam: "Притворщики", lv: [13, 30],
    desc: "Тварь, выучившая человеческий голос: из темноты зовёт на помощь и ждёт, кто придёт. «Эхо» распознаёт подделку только вблизи. Не верьте крику, который повторяется слово в слово.",
    hp: 40, dmg: 9, arm: 2, spd: 2, rng: 1, acd: 2, det: 6, beh: ["ambush", "chase", "lure"], adt: "phys", snd: "labmut", sndRate: 1.0, xp: 24 },
  u_quaker: { n: "Трясун", g: "m", kind: "bio", mind: 0, rank: "high", fam: "Великаны и звери", lv: [15, 20],
    desc: "Тяжёлая тварь сейсмических штолен: топает так, что удар расходится волной на соседние клетки. Шаги чувствует через пол даже за стеной: пока вы идёте, он знает, где вы, а глаза у него тоже есть.",
    hp: 110, dmg: 16, arm: 6, spd: 3, rng: 2, acd: 3, det: 6, beh: ["ranged", "splash", "vibro"], adt: "phys", snd: "proto", sndRate: 0.8, xp: 40 },
  u_geyser: { n: "Гейзерник", g: "m", kind: "bio", mind: 0, rank: "mid", fam: "Слизни и черви", lv: [18, 20],
    desc: "Слизистая тварь геотермальных скважин: набирает в себя кипяток и плюёт струёй на четыре шага, и ошпаренные ноги слушаются хуже. Перед плевком булькает — ловите паузу. Холод её гасит.",
    hp: 42, dmg: 9, arm: 1, spd: 2, rng: 4, acd: 3, det: 6, beh: ["ranged", "slow"], adt: "therm", snd: "swamp", sndRate: 1.3, xp: 20, res: { thermo: 0.2, cryo: 1.7 } },
  u_townsman: { n: "Житель городка", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "soldier", fam: "Народы глубин", lv: [16, 18],
    desc: "Житель резервного городка «Глубины», так и не поднявшийся наверх. Живут семьями, держатся вместе и говорят обрывками фраз. Увидев чужого, зовут своих.",
    hp: 44, dmg: 8, arm: 2, spd: 2, rng: 1, acd: 2, det: 6, beh: ["chase", "dooropen", "howl"], adt: "phys", snd: "labmut", sndRate: 1.2, xp: 20, carrier: true },
  u_elder: { n: "Старейшина", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Народы глубин", lv: [16, 18],
    desc: "Старший семьи городка: седой, с глазами без зрачков. Говорит за всех, и семья слушается. Подлечивает своих, пока жив, а без него семья теряется.",
    hp: 70, dmg: 9, arm: 3, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "dooropen", "healer"], adt: "phys", snd: "labmut", sndRate: 0.7, xp: 34, carrier: true },
  u_shaftworm: { n: "Шахтный червь", g: "m", kind: "bio", mind: 0, rank: "high", fam: "Слизни и черви", lv: [12, 20],
    desc: "Червь толщиной с бочку, прорывший ходы через всю «Глубину». Уходит под настил и выныривает у самых ног, раны затягивает. Гул в полу — он близко.",
    hp: 96, dmg: 14, arm: 3, spd: 2, rng: 1, acd: 2, det: 5, beh: ["chase", "burrow", "regen"], adt: "phys", snd: "slug", sndRate: 0.6, xp: 40 },
  u_rustbug: { n: "Ржавник", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [11, 30],
    desc: "Жук, питающийся металлом: его слюна разъедает броню, и после укусов она держит хуже. Стрекочет, как ножовка по железу. После встречи с ним броню — к верстаку.",
    hp: 18, dmg: 4, arm: 2, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm", "corrode"], adt: "chem", snd: "roach", sndRate: 0.95, xp: 8 },
  u_steamhound: { n: "Паровая гончая", g: "f", kind: "bio", mind: 1, rank: "mid", fam: "Своры и стаи", lv: [17, 22],
    desc: "Гончая геотермальных цехов: из пасти рвётся пар, шкура горячая. Охотится сворой и перекликается свистящим лаем. Холод её гасит.",
    hp: 36, dmg: 8, arm: 1, spd: 1, rng: 1, acd: 2, det: 7, beh: ["chase", "howl"], adt: "therm", snd: "chimera", sndRate: 1.35, xp: 18, res: { thermo: 0.4, cryo: 1.6 } },
  u_resonator: { n: "Звонарь слоя", g: "m", kind: "bio", mind: 2, rank: "high", fam: "Певцы и провидцы", lv: [19, 20],
    desc: "Тварь звучащего слоя: её тело поёт, и этот звук бьёт на четыре шага и глушит слух «Эхо». Перед воплем набирает воздух со свистом — тогда и стреляйте.",
    hp: 70, dmg: 11, arm: 2, spd: 2, rng: 4, acd: 3, det: 7, beh: ["ranged", "screamer"], adt: "sonic", snd: "blind", sndRate: 0.75, xp: 34, res: { sonic: 0.3 } },

  /* ── Колыбель: химеры доктора Лаптевой, ставшие стаями и народами ── */
  u_pollenfly: { n: "Пыльцевик", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Летуны и рои", lv: [21, 33],
    desc: "Пушистый летун споровых лесов: кружит облаком и жалит, оставляя под кожей жгучую пыльцу. Гудит низко, как шмель. Огонь их разгоняет.",
    hp: 9, dmg: 3, arm: 0, spd: 1, rng: 1, acd: 2, det: 6, beh: ["chase", "swarm", "fly", "poison"], adt: "chem", snd: "spore", sndRate: 1.5, xp: 6, res: { thermo: 1.6 } },
  u_nestling: { n: "Птенец гнездовья", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Своры и стаи", lv: [26, 30],
    desc: "Голый птенец химер Гнездовья, уже с зубами: пищит, скликая мать, и стаей бросается под ноги.",
    hp: 12, dmg: 3, arm: 0, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm", "howl"], adt: "phys", snd: "rat", sndRate: 1.6, xp: 6 },
  u_broodhen: { n: "Наседка", g: "f", kind: "bio", mind: 1, rank: "high", caste: "queen", fam: "Матки и ульи", lv: [26, 30], nolist: true, minion: "u_nestling",
    desc: "Мать гнездовья: огромная, медлительная, с кожистыми крыльями. Пока она жива, из гнезда выбегают всё новые птенцы. Её клёкот слышно сквозь стены.",
    hp: 90, dmg: 10, arm: 3, spd: 3, rng: 1, acd: 2, det: 6, beh: ["chase", "summon"], adt: "phys", snd: "chimera", sndRate: 0.8, xp: 40 },
  u_hound: { n: "Химера-гончая", g: "f", kind: "bio", mind: 1, rank: "mid", fam: "Своры и стаи", lv: [21, 40],
    desc: "Потомок химер доктора Лаптевой, ставший охотником: поджарая, быстрая, ходит сворой и заходит с боков. Перекликается коротким воем.",
    hp: 38, dmg: 9, arm: 1, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "howl"], adt: "phys", snd: "chimera", sndRate: 1.2, xp: 18, bleeder: true },
  u_houndlord: { n: "Вожак химер", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Своры и стаи", lv: [22, 40],
    desc: "Вожак своры химер: умнее, чем кажется, — ведёт свору загоном и гонит добычу на засаду. Рядом с ним гончие злее; убейте его — и свора рассыплется.",
    hp: 80, dmg: 13, arm: 3, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "howl", "dooropen"], adt: "phys", snd: "chimera", sndRate: 0.95, xp: 40, bleeder: true },
  u_settler: { n: "Поселенец", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "soldier", fam: "Народы глубин", lv: [25, 40],
    desc: "Житель Первого поселения: помесь человека и химеры, взявшая у людей привычки, — носит щит из панциря и копьё из арматуры, бьёт на два шага. Ходит отрядом и слушается вождя.",
    hp: 50, dmg: 9, arm: 4, spd: 2, rng: 2, acd: 2, det: 7, beh: ["chase", "dooropen"], adt: "phys", snd: "labmut", sndRate: 1.25, xp: 22, carrier: true },
  u_chief: { n: "Вождь поселения", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Народы глубин", lv: [25, 40],
    desc: "Вождь отряда поселенцев: на шее — ожерелье из жетонов смены В. Рядом с ним поселенцы бьют сильнее; падёт — отряд дрогнет.",
    hp: 90, dmg: 12, arm: 5, spd: 2, rng: 2, acd: 2, det: 8, beh: ["chase", "dooropen", "howl"], adt: "phys", snd: "labmut", sndRate: 0.85, xp: 44, carrier: true },
  u_shaman: { n: "Шаман", g: "m", kind: "bio", mind: 2, rank: "high", caste: "priest", fam: "Народы глубин", lv: [25, 40],
    desc: "Шаман поселенцев: поёт — и раны его отряда затягиваются, а у вас в голове звенит. Держится позади. Начинайте с него, если хотите, чтобы отряд перестал вставать.",
    hp: 56, dmg: 8, arm: 2, spd: 2, rng: 4, acd: 3, det: 7, beh: ["ranged", "healer", "psi"], adt: "sonic", snd: "labmut", sndRate: 0.95, xp: 36 },
  u_tracker: { n: "Следопыт", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "hunter", fam: "Народы глубин", lv: [24, 40],
    desc: "Охотник поселенцев: ходит без звука, читает следы и мечет костяные дротики на четыре шага. Устраивает засады у дверей.",
    hp: 44, dmg: 9, arm: 2, spd: 1, rng: 4, acd: 3, det: 8, beh: ["ranged", "tracker", "ambush", "silent"], adt: "phys", snd: "lizard", sndRate: 1.2, xp: 24 },
  u_hiveworker: { n: "Рабочая улья", g: "f", kind: "bio", mind: 1, rank: "low", caste: "worker", fam: "Матки и ульи", lv: [30, 36],
    desc: "Рабочая улья: носит воск и личинок, в бой не рвётся — увидев вас, убегает и поднимает тревогу. Гул улья нарастает за ней следом.",
    hp: 16, dmg: 3, arm: 1, spd: 1, rng: 1, acd: 2, det: 6, beh: ["chase", "flee", "howl"], adt: "phys", snd: "roach", sndRate: 1.25, xp: 6 },
  u_hiveguard: { n: "Страж улья", g: "m", kind: "bio", mind: 1, rank: "mid", caste: "guard", fam: "Матки и ульи", lv: [30, 38],
    desc: "Страж улья с панцирем, как щит: заслоняет собой других — рядом с ним они почти неуязвимы. Бейте стража первым.",
    hp: 64, dmg: 9, arm: 7, spd: 2, rng: 1, acd: 2, det: 6, beh: ["chase", "shieldally"], adt: "phys", snd: "roach", sndRate: 0.85, xp: 26 },
  u_stinger: { n: "Жалоносец", g: "m", kind: "bio", mind: 1, rank: "mid", caste: "spitter", fam: "Матки и ульи", lv: [30, 38],
    desc: "Летучий солдат улья: стреляет ядовитым жалом на четыре шага. Жужжит прерывисто, будто заикается.",
    hp: 34, dmg: 8, arm: 1, spd: 1, rng: 4, acd: 3, det: 7, beh: ["ranged", "poison", "fly"], adt: "chem", snd: "roach", sndRate: 1.1, xp: 22 },
  u_hivequeen: { n: "Царица улья", g: "f", kind: "bio", mind: 2, rank: "apex", caste: "queen", fam: "Матки и ульи", lv: [30, 38], nolist: true, minion: "u_hiveworker",
    desc: "Царица ульев: огромная, неподвижная, окружённая стражами. Рождает новых рабочих, пока жива, и подлечивает тех, кто рядом. Её гул — басовый, на нём держится весь улей.",
    hp: 150, dmg: 14, arm: 6, spd: 99, rng: 1, acd: 2, det: 7, beh: ["stationary", "summon", "healer"], adt: "phys", snd: "roach", sndRate: 0.65, xp: 70 },
  u_bomber: { n: "Трутень-самоубийца", g: "m", kind: "bio", mind: 1, rank: "low", caste: "drone", fam: "Матки и ульи", lv: [32, 100],
    desc: "Трутень с раздутым брюшком, полным кислоты: бежит прямо на вас и лопается вплотную. Бейте издалека, пока не добежал; топот частый и мелкий.",
    hp: 20, dmg: 14, arm: 0, spd: 1, rng: 1, acd: 2, det: 7, beh: ["chase", "bomber"], adt: "chem", snd: "roach", sndRate: 1.15, xp: 10 },
  u_bonestalker: { n: "Костяной ловчий", g: "m", kind: "bio", mind: 1, rank: "high", fam: "Великаны и звери", lv: [36, 40],
    desc: "Хищник Костяных равнин: скелет снаружи, мясо внутри. Разгоняется по прямой и рвёт так, что раны долго кровят. На бегу цокает костями.",
    hp: 74, dmg: 13, arm: 4, spd: 1, rng: 1, acd: 2, det: 7, beh: ["chase", "charge"], adt: "phys", snd: "lizard", sndRate: 0.8, xp: 36, bleeder: true },
  u_marshmaw: { n: "Топяная пасть", g: "f", kind: "bio", mind: 0, rank: "high", fam: "Слизни и черви", lv: [31, 34],
    desc: "Тварь солёных топей, похожая на открытую пасть с ногами. Лежит в иле у тропы, хватает, держит и пьёт силы. Хлюпанье в тишине — не наступайте туда.",
    hp: 84, dmg: 13, arm: 3, spd: 2, rng: 1, acd: 2, det: 4, beh: ["ambush", "chase", "slow", "leech"], adt: "phys", snd: "swamp", sndRate: 0.75, xp: 36 },
  u_alphasgt: { n: "Сержант «Альфы»", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Отряд «Альфа»", lv: [28, 40],
    desc: "Командир уцелевшего звена отряда «Альфа». Отдаёт приказы жестами, и бойцы обходят с флангов. Пока он жив, звено действует как одно целое.",
    hp: 90, dmg: 13, arm: 7, spd: 2, rng: 5, acd: 2, det: 8, beh: ["ranged", "dooropen"], adt: "energy", snd: "soldier", sndRate: 0.9, xp: 44, carrier: true },
  u_alphamedic: { n: "Санитар «Альфы»", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "priest", fam: "Отряд «Альфа»", lv: [28, 40],
    desc: "Санитар звена «Альфы»: лечит своих прямо в бою и прячется за их спинами. Пока он жив, звено поднимается снова и снова.",
    hp: 56, dmg: 7, arm: 4, spd: 2, rng: 4, acd: 3, det: 7, beh: ["ranged", "healer", "dooropen"], adt: "energy", snd: "soldier", sndRate: 1.15, xp: 28, carrier: true },
  u_singer: { n: "Певец Хора", g: "m", kind: "bio", mind: 3, rank: "high", caste: "seer", fam: "Певцы и провидцы", lv: [30, 36],
    desc: "Голос, отбившийся от Хора: поёт голосами смены В, и песня тянет мысли, как нитку. Слышит вас песней даже сквозь стены и подсказывает тварям вокруг, где вы.",
    hp: 60, dmg: 10, arm: 2, spd: 2, rng: 4, acd: 3, det: 8, beh: ["ranged", "psi", "screamer"], adt: "sonic", snd: "labmut", sndRate: 0.8, xp: 40, res: { sonic: 0.4 } },

  /* ── Отражение: копии, тени и серебро ── */
  u_mirrorrat: { n: "Зеркальный крысолак", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [41, 50],
    desc: "Крысолак Отражения со шкурой, гладкой, как амальгама: часть удара отражается обратно. Пищит с эхом — на полтона позже себя.",
    hp: 16, dmg: 4, arm: 1, spd: 1, rng: 1, acd: 2, det: 6, beh: ["chase", "swarm", "reflect"], adt: "phys", snd: "rat", sndRate: 0.85, xp: 9 },
  u_doppel: { n: "Двойник", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "soldier", fam: "Притворщики", lv: [42, 60],
    desc: "Копия сотрудника «Ковчега», снятая складкой. Учится на ваших ударах: чем дольше бьёте одним оружием, тем хуже оно его берёт. Меняйте оружие. Повторяет ваши слова с опозданием.",
    hp: 48, dmg: 10, arm: 3, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "dooropen", "adapt"], adt: "phys", snd: "labmut", sndRate: 1.0, xp: 26, carrier: true },
  u_elderdouble: { n: "Старший двойник", g: "m", kind: "bio", mind: 3, rank: "high", caste: "leader", fam: "Притворщики", lv: [44, 60],
    desc: "Первая копия, с которой сняли остальные: ведёт двойников, и они держатся вместе. Исчезает и возникает рядом. Разобьёте его — копии теряют связь и путаются.",
    hp: 86, dmg: 12, arm: 4, spd: 2, rng: 1, acd: 2, det: 8, beh: ["chase", "dooropen", "adapt", "blink"], adt: "phys", snd: "labmut", sndRate: 0.8, xp: 46 },
  u_glasshound: { n: "Стеклянная гончая", g: "f", kind: "bio", mind: 1, rank: "mid", fam: "Своры и стаи", lv: [43, 52],
    desc: "Гончая из стекла и злобы: хрупкая, но режет до кости. Её шаги звенят, как перезвон бокалов. Звук бьёт её лучше всего.",
    hp: 30, dmg: 12, arm: 0, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "howl"], adt: "phys", snd: "chimera", sndRate: 1.45, xp: 22, res: { sonic: 1.9, kinetic: 1.2 }, bleeder: true },
  u_shadeling: { n: "Тенёвка", g: "f", kind: "bio", mind: 0, rank: "low", fam: "Притворщики", lv: [45, 58],
    desc: "Тень, отставшая от хозяина и проголодавшаяся. Беззвучна, пока не подойдёт на три шага. Холод у затылка — она уже рядом.",
    hp: 20, dmg: 6, arm: 0, spd: 1, rng: 1, acd: 2, det: 6, beh: ["chase", "silent", "ambush"], adt: "phys", snd: "phase", sndRate: 1.5, xp: 12 },
  u_inverted: { n: "Вывернутый", g: "m", kind: "bio", mind: 1, rank: "high", fam: "Великаны и звери", lv: [46, 55],
    desc: "Тело, вывернутое отражением наизнанку: кости снаружи, лицо внутри. Исчезает и возникает у вас за спиной. Слышно, как он дышит наоборот.",
    hp: 80, dmg: 14, arm: 4, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "blink"], adt: "phys", snd: "proto", sndRate: 1.2, xp: 40, bleeder: true },
  u_amalgam: { n: "Амальгамный жрец", g: "m", kind: "bio", mind: 3, rank: "high", caste: "seer", fam: "Певцы и провидцы", lv: [48, 60],
    desc: "Жрец двойников, покрытый серебром: лечит копии и смотрит вашими глазами, подсказывая им, где вы. Пока он цел, отряд видит вас сквозь стены.",
    hp: 64, dmg: 9, arm: 3, spd: 2, rng: 4, acd: 3, det: 8, beh: ["ranged", "healer", "psi"], adt: "field", snd: "labmut", sndRate: 0.6, xp: 44 },
  u_silverleech: { n: "Серебряная пиявка", g: "f", kind: "bio", mind: 0, rank: "low", fam: "Слизни и черви", lv: [43, 56],
    desc: "Пиявка, покрытая серебром Отражения: присасывается, тянет кровь и заживает от неё. Ходит стаей.",
    hp: 18, dmg: 4, arm: 1, spd: 2, rng: 1, acd: 2, det: 4, beh: ["chase", "leech", "swarm"], adt: "phys", snd: "slug", sndRate: 1.45, xp: 9 },
  u_shadegunner: { n: "Тень арсенала", g: "m", kind: "bio", mind: 2, rank: "mid", fam: "Притворщики", lv: [48, 60],
    desc: "Отражение стрелка из Арсенала теней: шагов не слышно, выстрела почти тоже — только свист луча. Держит дистанцию и меняет позицию после каждого выстрела.",
    hp: 52, dmg: 11, arm: 3, spd: 2, rng: 6, acd: 2, det: 8, beh: ["ranged", "dooropen", "silent"], adt: "energy", snd: "soldier", sndRate: 0.95, xp: 30, carrier: true },
  u_echoling: { n: "Отзвучник", g: "m", kind: "bio", mind: 1, rank: "low", fam: "Певцы и провидцы", lv: [51, 57],
    desc: "Мелкая тварь архива «Эхо»: повторяет звуки, слышанные когда-то, — шаги, двери, выстрелы — и бьёт звуком на три шага. Не всякий выстрел, что вы слышите, настоящий.",
    hp: 22, dmg: 5, arm: 0, spd: 1, rng: 3, acd: 3, det: 7, beh: ["ranged", "mimicsnd", "swarm"], adt: "sonic", snd: "blind", sndRate: 1.3, xp: 12, res: { sonic: 0.4 } },

  /* ── Механизм: чаны, арены, тюрьма и ферма снов ── */
  u_vatling: { n: "Выкормыш чана", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Слизни и черви", lv: [61, 72],
    desc: "Тварь, выращенная ОКО в питательном чане: розовая, мягкая, вечно голодная. Ест всё, павших тоже, и от этого растёт.",
    hp: 18, dmg: 5, arm: 0, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm", "feeder"], adt: "phys", snd: "slug", sndRate: 1.2, xp: 9 },
  u_arenabeast: { n: "Зверь арены", g: "m", kind: "bio", mind: 1, rank: "high", fam: "Великаны и звери", lv: [70, 74],
    desc: "Зверь испытательных арен: на нём ОКО проверяло роботов. Шрамы от лазеров, разгон по прямой, раны затягиваются. Ревёт так, что звенят решётки.",
    hp: 120, dmg: 16, arm: 5, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "charge", "regen"], adt: "phys", snd: "proto", sndRate: 0.9, xp: 50, bleeder: true },
  u_gladiator: { n: "Гладиатор", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Узники и гладиаторы", lv: [70, 76],
    desc: "Пленник арен, выживший в сотне боёв с машинами: щит из бронелиста отражает часть ударов. Ведёт за собой других узников. Перед атакой бьёт клинком о щит.",
    hp: 100, dmg: 14, arm: 8, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "dooropen", "reflect"], adt: "phys", snd: "soldier", sndRate: 0.85, xp: 50, carrier: true },
  u_prisoner: { n: "Узник", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "soldier", fam: "Узники и гладиаторы", lv: [72, 80],
    desc: "Беглый узник Тюрьмы Механизма: мутации отняли у него лицо, но не злобу. Бросает обломки на три шага, ходит бандой. При узниках бывают ключи и жетоны.",
    hp: 46, dmg: 9, arm: 3, spd: 2, rng: 3, acd: 2, det: 7, beh: ["ranged", "dooropen", "howl"], adt: "phys", snd: "labmut", sndRate: 1.1, xp: 24, carrier: true },
  u_gangboss: { n: "Главарь банды", g: "m", kind: "bio", mind: 2, rank: "high", caste: "leader", fam: "Узники и гладиаторы", lv: [72, 80],
    desc: "Главарь беглых узников: громче всех, злее всех и хитрее всех — гонит банду вперёд, а сам бьёт из-за спин. Без него банда разбегается.",
    hp: 90, dmg: 12, arm: 5, spd: 2, rng: 4, acd: 2, det: 8, beh: ["ranged", "dooropen", "howl"], adt: "phys", snd: "labmut", sndRate: 0.8, xp: 46, carrier: true },
  u_nightmare: { n: "Кошмар фермы", g: "m", kind: "bio", mind: 3, rank: "mid", caste: "seer", fam: "Певцы и провидцы", lv: [66, 70],
    desc: "Тварь, выросшая из снов спящих Фермы: бьёт прямо по нервам и подсказывает другим тварям, где вы. То здесь, то там — и всегда за спиной.",
    hp: 44, dmg: 9, arm: 1, spd: 2, rng: 4, acd: 3, det: 8, beh: ["ranged", "psi", "blink"], adt: "field", snd: "phase", sndRate: 0.8, xp: 32 },
  u_cyborg: { n: "Обвешанный", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Узники и гладиаторы", lv: [62, 78],
    desc: "Мутант, обвешанный имплантами ОКО: наполовину плоть, наполовину провода. Бьёт током и выпивает энергию ваших имплантов. ЭМИ берёт его лучше, чем других тварей.",
    hp: 58, dmg: 10, arm: 6, spd: 2, rng: 4, acd: 3, det: 7, beh: ["ranged", "drain"], adt: "shock", snd: "soldier", sndRate: 1.2, xp: 28, res: { shock: 0.5, emp: 4 } },
  u_cogroach: { n: "Шестерёнчатый таракан", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [61, 70],
    desc: "Таракан, обросший латунными пластинками, будто чешуёй из шестерёнок: стайками бегает по цехам и щёлкает, как часовой механизм.",
    hp: 20, dmg: 5, arm: 5, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm"], adt: "phys", snd: "roach", sndRate: 0.85, xp: 10 },
  u_coolant: { n: "Хладник", g: "m", kind: "bio", mind: 0, rank: "mid", fam: "Слизни и черви", lv: [71, 76],
    desc: "Слизень охладительных каскадов, напитанный хладагентом: медленный, а удар его морозит. В холоде заживает. Шипит, как пробитая трубка.",
    hp: 56, dmg: 10, arm: 2, spd: 3, rng: 1, acd: 2, det: 5, beh: ["chase", "slow", "regen"], adt: "therm", snd: "slug", sndRate: 0.85, xp: 26, res: { cryo: 0.2, thermo: 1.8 } },
  u_scribe: { n: "Писарь", g: "m", kind: "bio", mind: 2, rank: "mid", fam: "Узники и гладиаторы", lv: [73, 75],
    desc: "Чиновник Канцелярии, проросший бумагой: метит вас, и после его отметки твари находят вас быстрее. Бормочет номера параграфов.",
    hp: 40, dmg: 6, arm: 2, spd: 2, rng: 4, acd: 3, det: 8, beh: ["ranged", "dooropen", "howl", "marker"], adt: "phys", snd: "labmut", sndRate: 1.3, xp: 26 },
  u_warden: { n: "Сторожевой зверь", g: "m", kind: "bio", mind: 1, rank: "high", caste: "guard", fam: "Великаны и звери", lv: [68, 80],
    desc: "Зверь Палаты Сторожа, выкормленный стеречь: заслоняет собой других, и рядом с ним по ним трудно попасть. Тяжело дышит и скребёт когтями пол.",
    hp: 110, dmg: 15, arm: 9, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "shieldally"], adt: "phys", snd: "chimera", sndRate: 0.75, xp: 50 },

  /* ── Исток: народ тех, кто придёт, и то, что старше его ── */
  u_sandling: { n: "Песчаник", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Грызуны и мелкая живность", lv: [84, 90],
    desc: "Тварь безвременья из песка и стекла: стайкой вьётся у ног, и каждый укус крадёт секунды — движения вязнут.",
    hp: 18, dmg: 5, arm: 2, spd: 1, rng: 1, acd: 2, det: 5, beh: ["chase", "swarm", "slow"], adt: "phys", snd: "roach", sndRate: 1.3, xp: 10 },
  u_rootchild: { n: "Корневой отпрыск", g: "m", kind: "bio", mind: 0, rank: "low", fam: "Растения и грибы", lv: [86, 94],
    desc: "Отросток первого дерева, ушедший бродить: оплетает ноги и тянет из вас силы. Скрипит, как свежая ветка на ветру. Огонь его выжигает.",
    hp: 22, dmg: 5, arm: 1, spd: 2, rng: 1, acd: 2, det: 4, beh: ["chase", "leech", "slow"], adt: "phys", snd: "vine", sndRate: 1.25, xp: 11, res: { thermo: 1.7 } },
  u_gardenghoul: { n: "Упырь садовников", g: "m", kind: "bio", mind: 1, rank: "mid", fam: "Великаны и звери", lv: [92, 96],
    desc: "Тварь Кладбища садовников, кормившаяся мёртвыми: когти ядовитые, а съев павшего, она крепнет на глазах. Чавкает в темноте.",
    hp: 60, dmg: 11, arm: 3, spd: 2, rng: 1, acd: 2, det: 6, beh: ["chase", "feeder", "poison", "regen"], adt: "phys", snd: "labmut", sndRate: 0.75, xp: 30 },
  u_omegaspawn: { n: "Отродье Омеги", g: "m", kind: "bio", mind: 1, rank: "high", fam: "Великаны и звери", lv: [88, 92],
    desc: "Остаток прототипа «Омега», разросшийся сам по себе: заживает на глазах, а разбитый — распадается надвое.",
    hp: 100, dmg: 15, arm: 5, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "regen", "split"], adt: "phys", snd: "proto", sndRate: 1.1, xp: 50 },
  u_cworker: { n: "Носильщик пришедших", g: "m", kind: "bio", mind: 2, rank: "low", caste: "worker", fam: "Народ тех, кто придёт", lv: [85, 100],
    desc: "Работник народа тех, кто придёт: таскает камень и семена, в бой не лезет — бежит за подмогой. Народ этот моложе людей и умнее, чем кажется.",
    hp: 30, dmg: 5, arm: 2, spd: 1, rng: 1, acd: 2, det: 7, beh: ["chase", "flee", "howl"], adt: "phys", snd: "lizard", sndRate: 1.35, xp: 12 },
  u_cwarrior: { n: "Воин пришедших", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "soldier", fam: "Народ тех, кто придёт", lv: [85, 100],
    desc: "Воин тех, кто придёт: гибкий, в панцире из сросшегося стекла и кости. Бьётся в строю, прикрывает своих и не бросает раненых.",
    hp: 70, dmg: 13, arm: 5, spd: 2, rng: 1, acd: 2, det: 7, beh: ["chase", "dooropen"], adt: "phys", snd: "lizard", sndRate: 0.9, xp: 34 },
  u_chunter: { n: "Охотник пришедших", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "hunter", fam: "Народ тех, кто придёт", lv: [86, 100],
    desc: "Охотник тех, кто придёт: беззвучный, заходит с боков и ждёт у дверей. Если отряд вас видит, охотник уже знает, где вы.",
    hp: 58, dmg: 13, arm: 3, spd: 1, rng: 1, acd: 2, det: 8, beh: ["chase", "ambush", "tracker", "silent"], adt: "phys", snd: "lizard", sndRate: 1.15, xp: 34, bleeder: true },
  u_cslinger: { n: "Метатель пришедших", g: "m", kind: "bio", mind: 2, rank: "mid", caste: "spitter", fam: "Народ тех, кто придёт", lv: [86, 100],
    desc: "Метатель тех, кто придёт: кидает споровые ядра на пять шагов из-за спин воинов.",
    hp: 50, dmg: 12, arm: 2, spd: 2, rng: 5, acd: 3, det: 8, beh: ["ranged", "dooropen", "poison"], adt: "chem", snd: "spore", sndRate: 0.85, xp: 32 },
  u_cweaver: { n: "Ткач пришедших", g: "m", kind: "bio", mind: 3, rank: "mid", caste: "trapper", fam: "Народ тех, кто придёт", lv: [86, 100],
    desc: "Ткач тех, кто придёт: плетёт ловушки из корней и смолы поперёк ходов, пока отряд гонит добычу. Слушайте под ногами.",
    hp: 48, dmg: 9, arm: 2, spd: 2, rng: 3, acd: 3, det: 7, beh: ["ranged", "trapper", "web"], adt: "phys", snd: "weaver", sndRate: 0.85, xp: 34 },
  u_cpriest: { n: "Жрица пришедших", g: "f", kind: "bio", mind: 3, rank: "high", caste: "priest", fam: "Народ тех, кто придёт", lv: [87, 100],
    desc: "Жрица тех, кто придёт: поёт отряду, и раны затягиваются; падёт вестник — она поведёт отряд сама.",
    hp: 62, dmg: 9, arm: 3, spd: 2, rng: 4, acd: 3, det: 8, beh: ["ranged", "healer", "psi"], adt: "sonic", snd: "labmut", sndRate: 0.9, xp: 44 },
  u_cseer: { n: "Провидец пришедших", g: "m", kind: "bio", mind: 3, rank: "high", caste: "seer", fam: "Народ тех, кто придёт", lv: [88, 100],
    desc: "Провидец тех, кто придёт: видит вас сквозь стены и шепчет об этом всему отряду. Бьёт прямо по нервам. Пока он жив, от отряда не спрятаться.",
    hp: 56, dmg: 11, arm: 2, spd: 2, rng: 5, acd: 3, det: 9, beh: ["ranged", "psi"], adt: "field", snd: "phase", sndRate: 0.75, xp: 46 },
  u_cherald: { n: "Вестник", g: "m", kind: "bio", mind: 3, rank: "high", caste: "leader", fam: "Народ тех, кто придёт", lv: [88, 100],
    desc: "Вестник тех, кто придёт: командир отряда. Его отряд ходит загоном и берёт в клещи. Убейте его — и отряд выберет нового, если успеет.",
    hp: 110, dmg: 15, arm: 6, spd: 2, rng: 4, acd: 2, det: 8, beh: ["ranged", "dooropen", "howl"], adt: "phys", snd: "lizard", sndRate: 0.75, xp: 56 },
  u_cmother: { n: "Праматерь", g: "f", kind: "bio", mind: 3, rank: "apex", caste: "queen", fam: "Матки и ульи", lv: [91, 100], nolist: true, minion: "u_cworker",
    desc: "Праматерь народа тех, кто придёт: живой холм, из которого выходят новые. Не сходит с места, лечит детей и рождает новых, пока жива; рядом с ней в голове шумит, как в улье.",
    hp: 220, dmg: 18, arm: 8, spd: 99, rng: 1, acd: 2, det: 8, beh: ["stationary", "summon", "healer", "psi"], adt: "phys", snd: "chimera", sndRate: 0.65, xp: 100 },
  u_firstborn: { n: "Первородный", g: "m", kind: "bio", mind: 3, rank: "apex", fam: "Великаны и звери", lv: [94, 100],
    desc: "Первый из тех, кто пришёл: одиночка, которому не нужен отряд. Учится на каждом вашем ударе, исчезает и появляется рядом, заживает. Слышите низкий рокот, будто дышит гора, — уходите или готовьтесь.",
    hp: 180, dmg: 20, arm: 8, spd: 1, rng: 1, acd: 2, det: 9, beh: ["chase", "regen", "blink", "adapt"], adt: "phys", snd: "proto", sndRate: 0.7, xp: 110, bleeder: true }
};

/* Прежние твари — ум, ранг и семейство (данные блоков не трогаем). */
var OLD = {
  rat: [0, "low", "Грызуны и мелкая живность"], roach: [0, "low", "Грызуны и мелкая живность"], labmut: [1, "mid", "Заражённые сотрудники"],
  slug: [0, "mid", "Слизни и черви"], vine: [0, "mid", "Растения и грибы"], spore: [0, "low", "Растения и грибы"], swamp: [1, "mid", "Заражённые сотрудники"],
  chimera: [1, "mid", "Своры и стаи"], lizard: [1, "mid", "Великаны и звери"], weaver: [1, "mid", "Великаны и звери"], blind: [1, "high", "Великаны и звери"],
  spark: [1, "mid", "Заражённые сотрудники"], frozen: [0, "mid", "Великаны и звери"], thawed: [0, "mid", "Слизни и черви"], soldier: [2, "high", "Отряд «Альфа»"],
  phase: [1, "high", "Притворщики"], proto: [2, "apex", "Великаны и звери"],
  g_caveling: [1, "low", "Своры и стаи"], g_lakewhisker: [0, "mid", "Слизни и черви"], g_thermophile: [0, "high", "Слизни и черви"], g_singer: [2, "mid", "Певцы и провидцы"],
  k_triad: [1, "mid", "Своры и стаи"], k_catfish: [0, "high", "Слизни и черви"], k_eel: [0, "mid", "Слизни и черви"], k_puffball: [0, "low", "Растения и грибы"],
  k_wingear: [1, "low", "Летуны и рои"], k_chorister: [1, "low", "Певцы и провидцы"], k_rootweaver: [0, "mid", "Растения и грибы"], k_saltcrab: [0, "high", "Великаны и звери"],
  k_quickling: [0, "mid", "Великаны и звери"], k_leech: [0, "low", "Слизни и черви"], k_glowbug: [0, "low", "Летуны и рои"],
  m_tethered: [2, "mid", "Узники и гладиаторы"], m_vatbeast: [1, "high", "Великаны и звери"], m_sleeper: [3, "high", "Певцы и провидцы"],
  i_srcchimera: [2, "high", "Своры и стаи"], i_riverling: [1, "mid", "Слизни и черви"], i_rootling: [0, "mid", "Растения и грибы"]
};

/* ════════ ОТРЯДЫ ════════
   lead — вожак (или матка), members — [вид, сколько от, до]; camp —
   стоят лагерем в помещении (охраняют его), иначе — бродят стаей;
   n — как назвать отряд. */
var PACKS = [
  { id: "dogs", n: "свора", lv: [4, 14], lead: "u_alphadog", members: [["u_dog", 2, 3]], camp: false },
  { id: "town", n: "семья городка", lv: [16, 18], lead: "u_elder", members: [["u_townsman", 2, 3]], camp: true },
  { id: "steam", n: "свора паровых гончих", lv: [17, 22], lead: null, members: [["u_steamhound", 3, 4]], camp: false },
  { id: "hounds", n: "свора химер", lv: [22, 40], lead: "u_houndlord", members: [["u_hound", 3, 4]], camp: false },
  { id: "nest", n: "гнездовье", lv: [26, 30], lead: "u_broodhen", members: [["u_nestling", 3, 4]], camp: true },
  { id: "settlers", n: "отряд поселенцев", lv: [25, 40], lead: "u_chief", members: [["u_settler", 2, 3], ["u_tracker", 0, 1], ["u_shaman", 0, 1]], camp: true },
  { id: "alpha", n: "звено «Альфы»", lv: [28, 40], lead: "u_alphasgt", members: [["soldier", 2, 2], ["u_alphamedic", 1, 1]], camp: true },
  { id: "hive", n: "улей", lv: [30, 38], lead: "u_hivequeen", members: [["u_hiveguard", 2, 2], ["u_hiveworker", 2, 3], ["u_stinger", 1, 1], ["u_bomber", 0, 1]], camp: true },
  { id: "chorus", n: "хор", lv: [30, 36], lead: "u_singer", members: [["k_chorister", 2, 3]], camp: true },
  { id: "doubles", n: "отряд двойников", lv: [44, 60], lead: "u_elderdouble", members: [["u_doppel", 2, 3], ["u_amalgam", 0, 1]], camp: true },
  { id: "glass", n: "стеклянная свора", lv: [43, 52], lead: null, members: [["u_glasshound", 3, 3]], camp: false },
  { id: "arena", n: "бойцы арены", lv: [70, 76], lead: "u_gladiator", members: [["u_arenabeast", 1, 1], ["u_prisoner", 1, 2]], camp: true },
  { id: "gang", n: "банда узников", lv: [72, 80], lead: "u_gangboss", members: [["u_prisoner", 2, 4]], camp: true },
  { id: "dream", n: "стая кошмаров", lv: [66, 70], lead: null, members: [["u_nightmare", 2, 3]], camp: false },
  { id: "comers", n: "отряд тех, кто придёт", lv: [86, 100], lead: "u_cherald", members: [["u_cwarrior", 2, 2], ["u_chunter", 1, 1], ["u_cslinger", 1, 1], ["u_cpriest", 0, 1], ["u_cseer", 0, 1], ["u_cweaver", 0, 1]], camp: true },
  { id: "cradle", n: "колыбель тех, кто придёт", lv: [91, 100], lead: "u_cmother", members: [["u_cwarrior", 2, 2], ["u_cworker", 2, 3], ["u_cpriest", 1, 1]], camp: true }
];

/* ════════ В ТАБЛИЦЫ ИГРЫ ════════ */
var k;
for (k in NEW) { if (!LAB.FOES[k]) LAB.FOES[k] = NEW[k]; }
for (k in OLD) { var b = LAB.FOES[k]; if (b && b.mind == null) { b.mind = OLD[k][0]; b.rank = OLD[k][1]; b.fam = OLD[k][2]; } }
/* (3.7, нелогичность) Из чего тело — для добычи химии (chem.js, pickBio): shell — панцирь или хитин
   (хитиновые пластины), plant — растение (пыльца; ни крови, ни желёз), fungus — гриб, spores — носит
   в себе споры (споровая пыльца). Прежде хитин падал с любой твари в броне от двух — с суперсолдата и
   сома, — а пыльца со всякой стаи, с крысолака; с лианы — гемолимфа и железа. Своё поле body у вида
   (в данных блока) — сильнее этой таблицы. */
var BODY = {
  roach: "shell", weaver: "shell", k_saltcrab: "shell", k_glowbug: "shell", u_tick: "shell", u_stonemite: "shell", u_rustbug: "shell",
  u_hiveworker: "shell", u_hiveguard: "shell", u_stinger: "shell", u_hivequeen: "shell", u_bomber: "shell", u_cogroach: "shell", u_lockermimic: "shell",
  vine: "plant", k_rootweaver: "plant", i_rootling: "plant", u_sprout: "plant", u_rootchild: "plant",
  spore: "fungus", k_puffball: "fungus", u_moth: "spores", u_pollenfly: "spores", u_cslinger: "spores", u_husk: "spores"
};
for (k in BODY) { var fb = LAB.FOES[k]; if (fb && !fb.body) fb.body = BODY[k]; }

/* Новые твари — в списки уровней: узкие (до шести уровней) — на каждом
   своём уровне, широкие — через уровень-другой, вперемешку, чтобы соседние
   уровни отличались; на уровень — не больше восьми новых видов. */
var hash = LAB.hash32 || function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
var listed = {};
function distribute() {
  var N = LAB.LEVELS_N || 10;
  for (var L = 1; L <= N; L++) {
    var lev = LAB.LEVELS[L];
    if (!lev || !lev.foes) continue;
    var cand = Object.keys(NEW).filter(function (id) { var d = NEW[id]; return !d.nolist && d.lv[0] <= L && L <= d.lv[1] && lev.foes.indexOf(id) < 0; });
    var narrow = cand.filter(function (id) { return NEW[id].lv[1] - NEW[id].lv[0] <= 5; });
    var wide = cand.filter(function (id) { return narrow.indexOf(id) < 0; }).sort(function (a, b2) { return (hash(L + ":" + a) % 997) - (hash(L + ":" + b2) % 997); });
    var cap = 6 + (L > 40 ? 1 : 0) + (L > 80 ? 1 : 0);
    var take = narrow.slice(0, cap);
    for (var i = 0; i < wide.length && take.length < cap; i++) {
      /* широкий вид на этом уровне — если давно не встречался или выпал жребий */
      var id = wide[i], last = listed[id] || 0;
      if (L - last >= 3 || hash("w" + L + id) % 100 < 55) take.push(id);
    }
    /* меньше четырёх новых видов на уровне не бывает (если есть из кого выбрать) */
    for (var j = 0; j < wide.length && take.length < Math.min(4, cap); j++) if (take.indexOf(wide[j]) < 0) take.push(wide[j]);
    take.forEach(function (id) { lev.foes = lev.foes.concat([id]); listed[id] = L; });
  }
}
distribute();

/* ════════ УМ ════════
   Ум твари (iq, от 0 до 12) — от её разумности и чуть-чуть от глубины:
   крыса глубин хитрее крысы проходной, но крысой и остаётся. */
var IQ0 = [1, 3, 6, 9];
function iqFor(base, depth) {
  if (!base || base.kind !== "bio" || base.mind == null) return null;
  return Math.max(0, Math.min(12, IQ0[base.mind] + (depth >= 400 ? 1 : 0) + (depth >= 1200 ? 1 : 0)));
}

/* ════════ РАЗВИТИЕ ════════
   Ступени: 0 — молодая, 1 — окрепшая, 2 — матёрая, 3 — древняя. Каждая —
   прочнее на четверть, бьёт сильнее, панцирь толще. Низшие доходят до
   матёрых, прочие — до древних. Стражи уровней и матки не меняются. */
var EVO_ADJ = [null, { m: "окрепший", f: "окрепшая" }, { m: "матёрый", f: "матёрая" }, { m: "древний", f: "древняя" }];
function evoCap(base) { return !base || base.kind !== "bio" || base.caste === "queen" ? 0 : base.rank === "low" ? 2 : 3; }
/* С какой ступени тварь встречается на этой глубине (по номеру — одна и та же). */
function stage0(base, depth, id, boost) {
  if (!base || base.kind !== "bio" || base.caste === "queen") return 0;
  var h = hash("evo:" + id) % 1000 / 1000, s = 0;
  if (h < Math.min(0.55, depth / 1100)) s = 1;
  if (h < Math.min(0.32, Math.max(0, depth - 500) / 2400)) s = 2;
  if (h < Math.min(0.14, Math.max(0, depth - 1300) / 4500)) s = 3;
  s += boost || 0;
  return Math.min(evoCap(base), s);
}
function evoMul(evo) { return { hp: 1 + 0.25 * evo, dmg: 1 + 0.15 * evo, arm: evo }; }
function evoNeed(evo) { return 60 * (evo + 1); }
function evoWord(f) { var a = EVO_ADJ[f.evo || 0]; return a ? a[f.g === "f" ? "f" : "m"] : ""; }

/* ════════ УЛЕЙ УЧИТСЯ ════════
   Разумные твари глубин (от «Отражения» и ниже) помнят, чем вы их бьёте.
   Когда одно оружие — больше шести ударов из десяти, улей привыкает к
   нему: такой урон берёт их на четверть хуже (по режиму — сильнее или
   слабее). Сменили оружие — привычка понемногу уходит. */
function hiveOf(g) { if (!g.hive) g.hive = {}; var key = "b" + LAB.blockOf(g.L); if (!g.hive[key]) g.hive[key] = { n: {}, dt: null }; return g.hive[key]; }
function learns(f, g) { return f.kind === "bio" && (f.mind || 0) >= 2 && g.L >= 41 && !f.boss; }
function noteHit(f, dt, g) {
  if (!learns(f, g) || !dt) return null;
  var h = hiveOf(g), tot = 0, kk;
  for (kk in h.n) { h.n[kk] *= 0.97; tot += h.n[kk]; }
  h.n[dt] = (h.n[dt] || 0) + 1; tot += 1;
  var top = null, tv = 0;
  for (kk in h.n) if (h.n[kk] > tv) { tv = h.n[kk]; top = kk; }
  var was = h.dt;
  if (tot >= 18 && tv / tot >= 0.6) h.dt = top;
  else if (h.dt && (h.n[h.dt] || 0) / tot < 0.4) h.dt = null;
  return h.dt !== was ? { now: h.dt, was: was } : null;
}
function resK(f, dt, g) {
  if (!learns(f, g)) return 1;
  var h = hiveOf(g);
  if (h.dt !== dt) return 1;
  var e = LAB.dk ? (LAB.dk().evo || 1) : 1;
  return 1 - Math.min(0.4, 0.25 * e);
}

/* ════════ НА ЭТАЖЕ: ОТРЯДЫ ════════
   Свои у каждого этажа и раз навсегда (своим потоком случайностей);
   ставятся после охраны этажа (world.js → garrison → mutants). */
function busyMap(fl) {
  var W = LAB.W, m = new Uint8Array(W * LAB.H);
  fl.foes.forEach(function (f) { m[f.y * W + f.x] = 1; });
  (fl.items || []).forEach(function (it) { if (it.x != null) m[it.y * W + it.x] = 1; });
  return m;
}
function cellOk(fl, busy, x, y) {
  if (!LAB.inb(x, y)) return false;
  var i = y * LAB.W + x;
  if (fl.t[i] !== LAB.T.ROOM || busy[i] || LAB.solidAt(fl, x, y)) return false;
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var x2 = x + dx, y2 = y + dy; if (LAB.inb(x2, y2) && fl.t[y2 * LAB.W + x2] === LAB.T.DOOR) return false; }
  return true;
}
function calmRooms(fl) {
  var out = {};
  fl.objs.forEach(function (o) { if (/^(wake|capsule|stairs_up|elevator|workbench|gate_sealed)$/.test(o.type) && o.room >= 0) out[o.room] = 1; });
  if (fl.U >= 0) out[fl.U] = 1;
  return out;
}
function packsFor(L) { return PACKS.filter(function (p) { return p.lv[0] <= L && L <= p.lv[1] && (!p.lead || LAB.FOES[p.lead]) && p.members.every(function (m) { return !!LAB.FOES[m[0]]; }); }); }
function place(ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F;
  if (!fl || !ctx.makeFoe) return 0;
  var tpl = packsFor(L);
  if (!tpl.length) return 0;
  var r = LAB.Rng(ctx.seed, "mutants:" + L + ":" + F + ":" + (ctx.attempt || 0));
  var d0 = LAB.depth(L, F);
  var n = L <= 20 ? (r.chance(0.5) ? 1 : 0) : L <= 40 ? 1 + (r.chance(0.35) ? 1 : 0) : L <= 80 ? 1 + (r.chance(0.5) ? 1 : 0) : 2 + (r.chance(0.4) ? 1 : 0);
  /* улей и колыбель — на своих уровнях почти всегда, на прочих — изредка */
  var busy = busyMap(fl), calm = calmRooms(fl), used = {}, placed = 0, seq = 0;
  var rooms = [];
  fl.rooms.forEach(function (rm, i) {
    if (!rm || rm.hidden || rm.shop || calm[i] || i === fl.secret) return;
    var cells = [];
    for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) if (cellOk(fl, busy, x, y)) cells.push([x, y]);
    if (cells.length >= 6) rooms.push({ id: i, cells: cells });
  });
  if (!rooms.length) return 0;
  /* улей — дома, на уровне «Ульи», почти всегда, на прочих — изредка; колыбель — реже прочих отрядов */
  var wt = function (q) { return q.id === "hive" ? (L === 32 ? 4 : 0.3) : q.id === "cradle" ? 0.5 : 1; };
  for (var pi = 0; pi < n; pi++) {
    var tw = 0; tpl.forEach(function (q) { tw += wt(q); });
    var roll = r.next() * tw, t = tpl[0];
    for (var ti = 0; ti < tpl.length; ti++) { roll -= wt(tpl[ti]); if (roll < 0) { t = tpl[ti]; break; } }
    var free = rooms.filter(function (q) { return !used[q.id]; });
    if (!free.length) break;
    var room = r.pick(free);
    used[room.id] = 1;
    var cells = room.cells.filter(function (c) { return !busy[c[1] * LAB.W + c[0]]; });
    r.shuffle(cells);
    var roster = [];
    if (t.lead) roster.push({ type: t.lead, lead: true });
    t.members.forEach(function (m) { var c = m[1] + r.int(0, m[2] - m[1]); for (var j = 0; j < c; j++) roster.push({ type: m[0] }); });
    if (roster.length > cells.length) roster = roster.slice(0, cells.length);
    var pid = "p" + L + "_" + F + "_" + (++seq);
    roster.forEach(function (m, j) {
      var c = cells[j], base = LAB.FOES[m.type];
      var ex = { pack: pid, packT: t.id, lair: true, evo: stage0(base, d0, pid + ":" + j, m.lead ? 1 : 0) };
      if (m.lead) ex.lead = true;
      if (t.camp || base.beh.indexOf("stationary") >= 0) { ex.guard = "room"; ex.post = [c[0], c[1]]; }
      if (ctx.makeFoe(m.type, c[0], c[1], room.id, ex, r)) { busy[c[1] * LAB.W + c[0]] = 1; placed++; }
    });
  }
  return placed;
}

/* ════════ СЛОВА ════════ */
var MIND_N = ["неразумный", "полуразумный", "разумный", "сверхразумный"];
var MIND_F = ["неразумная", "полуразумная", "разумная", "сверхразумная"];
var RANK_N = { low: "низший", mid: "средний", high: "высший", apex: "вершина своего рода" };
var RANK_F = { low: "низшая", mid: "средняя", high: "высшая", apex: "вершина своего рода" };
var CASTE_N = { worker: "рабочая каста: бежит и поднимает тревогу", soldier: "каста воинов", hunter: "каста охотников: засады и фланги", spitter: "каста стрелков",
  guard: "каста стражей: заслоняет своих", priest: "каста жрецов: лечит своих и подхватывает командование", seer: "каста провидцев: видит вас сквозь стены и подсказывает отряду",
  leader: "вожак отряда: рядом с ним свои злее, без него — теряются", queen: "матка: рождает новых, пока жива", drone: "трутень: бежит и лопается вплотную", trapper: "ткач: ставит ловушки поперёк ходов" };
/* Строка для бестиария и сканера: ум, ранг, каста. */
function natureLine(b) {
  if (!b || b.kind !== "bio" || b.mind == null) return "";
  var fem = b.g === "f", out = [(fem ? MIND_F : MIND_N)[b.mind], (fem ? RANK_F : RANK_N)[b.rank] || ""];
  if (b.caste) out.push(CASTE_N[b.caste]);
  return out.filter(Boolean).join(", ");
}
function packName(id) { var p = PACKS.filter(function (q) { return q.id === id; })[0]; return p ? p.n : "отряд"; }

LAB.mutants = {
  NEW: NEW, PACKS: PACKS, ids: Object.keys(NEW), iqFor: iqFor, stage0: stage0, evoCap: evoCap, evoMul: evoMul, evoNeed: evoNeed, evoWord: evoWord, EVO_ADJ: EVO_ADJ,
  noteHit: noteHit, resK: resK, hiveOf: hiveOf, place: place, packsFor: packsFor, natureLine: natureLine, packName: packName,
  MIND_N: MIND_N, RANK_N: RANK_N, CASTE_N: CASTE_N
};
})();
