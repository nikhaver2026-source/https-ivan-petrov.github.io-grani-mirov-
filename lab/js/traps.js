/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — ловушки и мины (1.5).
   Капканы, шипы, клей, сети, сигнальные растяжки и растяжки с гранатой,
   шоковые пластины, ЭМИ- и магнитные мины, противопехотные и
   направленные мины, зажигательные, газовые, криогенные и кислотные
   ловушки, приманки, заряды на радиосигнале — и свои у каждой глубины:
   гидравлика и буровые заряды «Глубины», смола и звонкая соль Колыбели,
   зеркала и эхо Отражения, шестерни и логические мины Механизма, корни
   и песок безвременья Истока. Их продают пункты снабжения, собирают у
   верстака из деталей, снимают обезвреженными с чужих мест.
   Поставить — инвентарь, «Ловушки и мины» (L на клавиатуре): под ногами
   или на шаг впереди. Ловушка взводится, когда вы отойдёте, и срабатывает
   на того, кто на неё наступит или её заденет, — на тварей, на роботов и
   на вас самих. Свои ловушки «Эхо» помнит: называет при осмотре, рядом с
   ними тихо щёлкает, а ходьба с удержанием останавливается перед ними.
   Старые ловушки прежних жителей и мины робота-сапёра слышно за два шага;
   их можно обезвредить и забрать. Умные машины иногда замечают ловушки и
   обходят их. Таблицы — без DOM: файл читают и игра, и проверки в Node.
   Синтаксис — не новее ES2018.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

/* ════════ ВИДЫ ЛОВУШЕК ════════
   trig — как срабатывает: step — наступили на клетку; wire — задели
   проволоку поперёк прохода (в коридоре — от стены до стены); cone —
   вошли в веер направленной мины; prox — оказались рядом (pr шагов);
   remote — подрывают по вашему сигналу; lure — не срабатывает, а пищит.
   who — на кого: all — на всех; walk — на всех, кто ходит (дроны
   пролетают); mech — только на машины; bio — на живых (и на вас);
   metal — на металл и ток: на машины и на вас с оружием.
   Врагам: dmg и dt — урон (растёт с глубиной) и его вид, r — радиус,
   mk — множитель по машинам; hold, stun (машины), slow, bleed (живые),
   freeze, confuse, deaf, ally — сколько тактов (такт — полсекунды)
   держит, глушит, замедляет, кровит, морозит, сбивает с толку, лишает
   слуха, заставляет машину бить своих; emp — снимает щиты; shred — какую
   долю брони разъедает; zone — огонь или газ вокруг; drain — урон за
   такт, пока держит. uses — сколько раз срабатывает; rearm — сработав,
   ждёт, пока её взведут снова; regrow — сама взводится через столько
   тактов; boom — взрыв: задевает соседние заряды.
   Вам: pd — доля здоровья, adt — вид удара, ph — сколько тактов держит,
   ps, pb — замедление и кровь, ptox, pneuro — токсины и нейронагрузка,
   pdeaf — звон в ушах, pjam — сбитый навигатор, pemp — гаснут импланты,
   parmor — доля защиты брони, которую портит, pnoise — шум.
   loud — шум срабатывания; stealth — насколько трудно умной машине
   заметить ловушку (0 — заметна, 1 — не заметить); cue — чем она выдаёт
   себя вблизи: tick — щелчок, beep — писк. need, cls, bp, minL — сборка у
   верстака (bp — нужна схема). */
var T = {
  /* ── «Ковчег»: самоделки из того, что под рукой ── */
  jaw: { n: "капкан", g: "m", depth: 1, price: 30, trig: "step", who: "walk", dmg: 20, dt: "kinetic", hold: 8, uses: 6, rearm: true, loud: 3, stealth: 0.3, cue: "tick", snd: "hit_metal",
    pd: 0.14, ph: 6, need: { scrap: 4, wire: 1 }, cls: "base",
    d: "Стальной капкан на тугой пружине. Кто наступит — того челюсти схватят за ногу или за колесо: тварь или робот несколько секунд бьётся на месте и не может ни идти, ни нападать. Сработавший капкан можно взвести снова. Дронов не ловит: они летают.",
    hit: "Под ногой лязгнуло: капкан защёлкнулся на ноге!" },
  spikes: { n: "шипы", g: "p", depth: 1, price: 18, trig: "step", who: "walk", dmg: 8, dt: "kinetic", slow: 10, bleed: 8, uses: 5, loud: 0, stealth: 0.6, cue: "tick", snd: "debris",
    pd: 0.05, ps: 8, pb: 6, need: { scrap: 3 }, cls: "base",
    d: "Горсть стальных ежей из гнутой арматуры: рассыпьте по полу — твари режут лапы и кровят, роботы сбивают колёса и ползут медленнее. Тихо, без шума; хватает на несколько проходов.",
    hit: "Под ногами хрустнули шипы: ноги изранены!" },
  glue: { n: "клеевая ловушка", g: "f", depth: 1, price: 22, trig: "step", who: "walk", hold: 3, slow: 16, uses: 3, loud: 0, stealth: 0.4, cue: "tick", snd: "web_hit",
    ph: 3, ps: 16, need: { gel: 2, reagent: 1 }, cls: "base",
    d: "Банка строительного клея с отвердителем: разлитый клей хватает того, кто наступит, держит, а потом ещё долго тянется за ногами. Хватает на три раза.",
    hit: "Нога увязла в клее!" },
  alarm: { n: "сигнальная растяжка", g: "f", depth: 1, price: 15, trig: "wire", who: "walk", alarm: true, uses: 99, loud: 0, stealth: 0.5, cue: "tick", snd: "can_drop",
    pnoise: 10, need: { wire: 2, scrap: 1 }, cls: "base",
    d: "Тонкая проволока поперёк прохода и связка пустых консервных банок: кто заденет — банки загремят, и «Эхо» скажет, где. Никого не ранит, но предупредит, что к вам идут. Срабатывает снова и снова.",
    hit: "Вы задели проволоку — банки загремели на весь коридор!" },
  wire: { n: "растяжка с гранатой", g: "f", depth: 2, price: 55, trig: "wire", who: "walk", dmg: 55, dt: "kinetic", r: 1, noarmor: true, boom: true, uses: 1, loud: 10, stealth: 0.5, cue: "tick", snd: "boom",
    pd: 0.4, need: { wire: 2, reagent: 2, cap: 1, scrap: 2 }, cls: "spec",
    d: "Проволока поперёк прохода, на конце — граната в консервной банке. Кто зацепит — подорвётся вместе с соседями. В коридоре проволока идёт от стены до стены: не обойти ни врагу, ни вам.",
    hit: "Нога зацепила проволоку — граната!" },
  shock: { n: "шоковая пластина", g: "f", depth: 1, price: 45, trig: "step", who: "walk", dmg: 30, dt: "shock", stun: 6, slow: 6, uses: 4, loud: 3, stealth: 0.3, cue: "beep", snd: "w_shock_crack",
    pd: 0.18, adt: "shock", ph: 2, need: { cap: 2, wire: 2, scrap: 1 }, cls: "base",
    d: "Резиновый коврик с медной сеткой и конденсаторами: наступивший получает разряд. Роботов замыкает и останавливает на несколько секунд, тварей бьёт и замедляет. Заряда хватает на четыре разряда.",
    hit: "Разряд от пола бьёт в ноги!" },
  mine: { n: "противопехотная мина", g: "f", depth: 2, mine: true, price: 60, trig: "step", who: "walk", dmg: 70, dt: "kinetic", r: 1, noarmor: true, boom: true, uses: 1, loud: 12, stealth: 0.6, cue: "beep", snd: "boom",
    pd: 0.45, need: { reagent: 2, cap: 1, scrap: 2, chip: 1 }, cls: "spec",
    d: "Самодельная мина в стальном корпусе: прикрытая мусором у пола, взрывается под ногой и задевает всех в шаге вокруг. Громкая — на шум сбегутся.",
    hit: "Под ногой щёлкнуло — мина!" },
  net: { n: "сеть-ловушка", g: "f", depth: 2, price: 40, trig: "step", who: "all", dmg: 6, dt: "kinetic", hold: 10, uses: 1, loud: 2, stealth: 0.4, cue: "tick", snd: "web_hit",
    ph: 6, need: { wire: 3, scrap: 1, servo: 1 }, cls: "spec", minL: 2,
    d: "Сеть из стального троса на пружинном выбросе: кто наступит — того накрывает и спутывает. Выбрасывается вверх, поэтому ловит и дронов.",
    hit: "Сеть накрыла вас с головой!" },
  emp: { n: "ЭМИ-мина", g: "f", depth: 2, mine: true, price: 85, trig: "prox", pr: 1, who: "metal", dmg: 60, dt: "emp", r: 2, emp: true, stun: 8, noarmor: true, uses: 1, loud: 6, stealth: 0.2, cue: "beep", snd: "emp",
    pd: 0.05, adt: "shock", pemp: true, need: { emp: 1, chip: 1, magnet: 1 }, cls: "spec",
    d: "ЭМИ-граната в корпусе с магнитным датчиком: срабатывает, когда рядом металл и ток, — робот, дрон или вы с оружием. Импульс снимает щиты, бьёт по электронике и останавливает машины. Живых почти не трогает, но импланты рядом гасит.",
    hit: "ЭМИ-мина среагировала на ваше оружие: импланты гаснут!" },
  lure: { n: "приманка-пищалка", g: "f", depth: 1, price: 25, trig: "lure", who: "none", life: 60, uses: 1, loud: 0, stealth: 1, cue: "beep", snd: "mine_beep",
    need: { noise: 1, cap: 1 }, cls: "base",
    d: "Пищалка на батарейке с часовым механизмом: поставьте — и полминуты она пищит и лязгает, а враги идут на звук. Ставьте её посреди своих ловушек." },
  fire: { n: "зажигательная ловушка", g: "f", depth: 3, price: 55, trig: "step", who: "walk", dmg: 25, dt: "thermo", zone: { k: "fire", r: 1, t: 10, d: 10 }, uses: 1, loud: 5, stealth: 0.5, cue: "tick", snd: "implant_thermal",
    pd: 0.1, adt: "therm", need: { reagent: 2, gel: 1, cap: 1, scrap: 1 }, cls: "spec", minL: 3,
    d: "Бутыль с зажигательной смесью и запалом под нажимной крышкой: вспыхивает под ногой, и пол вокруг горит ещё пять секунд. Тварям страшнее всего; роботы жар терпят лучше. Через огонь не ходите и вы.",
    hit: "Под ногой вспыхнуло пламя!" },
  gas: { n: "газовая ловушка", g: "f", depth: 3, price: 50, trig: "step", who: "walk", zone: { k: "gas", r: 2, t: 20, d: 8 }, uses: 1, loud: 2, stealth: 0.5, cue: "tick", snd: "ev_steam",
    ptox: 25, need: { reagent: 3, gel: 1, scrap: 1 }, cls: "spec", minL: 3,
    d: "Баллон с удушливым газом и клапаном под нажимной пластиной: облако расходится на два шага и держится десять секунд. Живых травит, машинам безразлично. Без противогаза в облако не входите.",
    hit: "Под ногой зашипел газ!" },
  magnet: { n: "магнитный захват", g: "m", depth: 3, price: 70, trig: "prox", pr: 1, who: "metal", dmg: 10, dt: "kinetic", hold: 12, uses: 3, loud: 2, stealth: 0.3, cue: "beep", snd: "mag_on",
    ph: 3, need: { magnet: 3, cell: 1, wire: 1 }, cls: "spec", minL: 3,
    d: "Плита-электромагнит на аккумуляторе: когда рядом металл, она включается и притягивает робота намертво. Тварей не держит. Вас с оружием тоже прихватит — ненадолго. Аккумулятора хватает на три раза.",
    hit: "Магнитная плита притянула ваше оружие — и вас вместе с ним!" },
  remote: { n: "заряд на радиосигнале", g: "m", depth: 3, mine: true, price: 90, trig: "remote", who: "all", dmg: 85, dt: "kinetic", r: 2, noarmor: true, boom: true, uses: 1, loud: 12, stealth: 0.7, cue: "beep", snd: "boom_big",
    pd: 0.5, need: { reagent: 3, chip: 1, cell: 1, scrap: 2 }, cls: "spec", bp: true, minL: 3,
    d: "Заряд с радиодетонатором: молчит, пока вы не подорвёте его сами — из окна «Ловушки и мины», откуда угодно на этаже. Бьёт на два шага вокруг. Не стойте рядом.",
    hit: "Заряд рванул совсем рядом с вами!" },
  claymore: { n: "направленная мина", g: "f", depth: 4, mine: true, price: 95, trig: "cone", who: "walk", dmg: 90, dt: "kinetic", noarmor: true, boom: true, uses: 1, loud: 12, stealth: 0.4, cue: "beep", snd: "boom_big",
    pd: 0.55, need: { reagent: 3, scrap: 4, chip: 1, cap: 1 }, cls: "spec", bp: true, minL: 4,
    d: "Направленная мина: смотрит туда же, куда смотрели вы, когда ставили, и бьёт веером на три шага вперёд. Сзади неё безопасно. Срабатывает, как только кто-то войдёт в веер, — и вы тоже.",
    hit: "Вы вошли в веер направленной мины!" },
  cryo: { n: "криоловушка", g: "f", depth: 5, price: 80, trig: "step", who: "walk", dmg: 30, dt: "cryo", r: 1, freeze: 10, uses: 1, loud: 4, stealth: 0.4, cue: "tick", snd: "implant_freeze",
    pd: 0.12, adt: "therm", ps: 20, need: { reagent: 2, cap: 2, magnet: 1 }, cls: "spec", minL: 5,
    d: "Баллон жидкого азота под нажимной крышкой: облако холода замораживает всех в шаге вокруг на пять секунд.",
    hit: "Ледяное облако обжигает ноги — вас сковывает инеем!" },
  acid: { n: "кислотная ловушка", g: "f", depth: 6, price: 70, trig: "step", who: "walk", dmg: 30, dt: "kinetic", mk: 1.4, r: 1, shred: 0.4, uses: 1, loud: 3, stealth: 0.5, cue: "tick", snd: "acid_burst",
    pd: 0.15, adt: "chem", parmor: 0.1, need: { reagent: 3, ceramic: 1 }, cls: "spec", minL: 6,
    d: "Пакет концентрированной кислоты под тонкой крышкой: разъедает броню роботов и панцири тварей — после неё их легче пробить. Металлу достаётся сильнее, чем живому. Броня на вас тоже портится.",
    hit: "Кислота брызнула на ноги и на броню!" },
  /* ── «Глубина»: снаряжение буровиков сорокалетней давности ── */
  press: { n: "гидравлический капкан", g: "m", depth: 11, price: 160, trig: "step", who: "walk", dmg: 70, dt: "kinetic", hold: 14, uses: 4, rearm: true, loud: 6, stealth: 0.3, cue: "tick", snd: "door_heavy_close",
    pd: 0.25, ph: 10, need: { g_hydrocyl: 1, scrap: 3, wire: 1 }, cls: "spec", minL: 11,
    d: "Капкан буровиков «Глубины» из старого гидроцилиндра: челюсти смыкаются с силой пресса. Держит даже тяжёлые машины, бьёт сильно, взводится снова.",
    hit: "Гидравлические челюсти сомкнулись на ноге!" },
  drill: { n: "буровой заряд", g: "m", depth: 12, mine: true, price: 220, trig: "remote", who: "all", dmg: 160, dt: "kinetic", r: 2, noarmor: true, boom: true, uses: 1, loud: 14, stealth: 0.7, cue: "beep", snd: "boom_big",
    pd: 0.6, need: { g_tube: 1, reagent: 3, cell: 1 }, cls: "spec", bp: true, minL: 12,
    d: "Заряд экспедиции с радиолампой-детонатором: им когда-то дробили породу. Подрывается по вашему сигналу и бьёт на два шага вокруг так, что гудит весь этаж.",
    hit: "Буровой заряд рванул рядом с вами!" },
  quartz: { n: "кварцевая сирена", g: "f", depth: 13, price: 140, trig: "prox", pr: 2, who: "all", dmg: 15, dt: "sonic", r: 2, confuse: 10, deaf: 10, uses: 3, loud: 8, stealth: 0.2, cue: "beep", snd: "ev_ring_whine",
    pdeaf: 20, pneuro: 10, need: { g_quartz: 1, wire: 2, cap: 1 }, cls: "spec", minL: 13,
    d: "Пластина поющего кварца на тонкой ножке: когда рядом кто-то проходит, она звенит так пронзительно, что твари теряют голову, а у машин сбиваются датчики и слух. Звенит три раза. Вам этот звон ударит по ушам и по нервам.",
    hit: "Кварц взвизгнул прямо у вас над ухом!" },
  /* ── Колыбель: смола, соль и кость ── */
  resin: { n: "смоляная ловушка", g: "f", depth: 21, price: 150, trig: "step", who: "walk", hold: 12, slow: 20, uses: 2, loud: 0, stealth: 0.5, cue: "tick", snd: "slug_attack",
    ph: 8, ps: 16, need: { k_resin: 2, gel: 1 }, cls: "spec", minL: 21,
    d: "Ком смолы Колыбели, разогретой и растёкшейся по полу: кто вступит — увязает надолго. Тихо, без шума, хватает на два раза.",
    hit: "Нога увязла в смоле!" },
  salt: { n: "солевой круг", g: "m", depth: 31, price: 200, trig: "step", who: "bio", dmg: 60, dt: "sonic", r: 1, confuse: 10, uses: 3, loud: 5, stealth: 0.6, cue: "tick", snd: "ev_glass",
    pd: 0.04, pneuro: 15, need: { k_salt: 2, k_wax: 1 }, cls: "spec", minL: 32,
    d: "Круг звонкой соли, сцементированный воском улья: твари Колыбели не выносят её звона — ранятся и теряют голову. Машинам соль безразлична. Вам от этого звона заноют зубы.",
    hit: "Солевой круг зазвенел у вас в зубах!" },
  bonebell: { n: "костяной колокол", g: "m", depth: 37, price: 180, trig: "wire", who: "walk", alarm: true, confuse: 6, r: 3, uses: 99, loud: 0, stealth: 0.5, cue: "tick", snd: "ev_ring_whine",
    pneuro: 6, pnoise: 6, need: { k_bone: 1, wire: 2 }, cls: "spec", minL: 37,
    d: "Певчая кость на нитке поперёк прохода: кто заденет — кость запоёт, «Эхо» скажет, где, а твари вокруг на несколько секунд забудут, куда шли. Поёт снова и снова.",
    hit: "Вы задели нитку — кость запела!" },
  /* ── Отражение: зеркало и эхо ── */
  mirror: { n: "зеркальная ловушка", g: "f", depth: 41, price: 240, trig: "step", who: "walk", dmg: 20, dt: "phase", r: 1, confuse: 14, uses: 2, loud: 3, stealth: 0.4, cue: "tick", snd: "phase_out",
    pjam: 20, pneuro: 10, need: { o_glass: 2, o_silver: 1 }, cls: "spec", minL: 41,
    d: "Осколок зеркала Отражения в амальгаме: кто наступит — увидит своё отражение, бросится на него, а потом долго не может понять, где враг. Хватает на два раза.",
    hit: "Из зеркала под ногами на вас посмотрел кто-то ещё — голова кружится!" },
  echo: { n: "эхо-капкан", g: "m", depth: 50, price: 260, trig: "step", who: "walk", dmg: 70, dt: "sonic", r: 1, hold: 8, deaf: 20, uses: 2, rearm: true, loud: 9, stealth: 0.4, cue: "tick", snd: "impact_wave",
    pd: 0.15, adt: "sonic", ph: 4, pdeaf: 20, need: { o_echoshard: 1, o_quartz: 1, wire: 2 }, cls: "spec", minL: 50,
    d: "Осколок эха в кварцевом резонаторе: наступивший слышит свой шаг тысячу раз сразу. Удар звука валит всех вокруг, а потом они долго ничего не слышат. Взводится снова.",
    hit: "Ваш шаг грянул тысячей эхо!" },
  /* ── Механизм: шестерни и реле ── */
  gear: { n: "шестерёнчатый стопор", g: "m", depth: 61, price: 280, trig: "step", who: "walk", dmg: 30, dt: "kinetic", hold: 16, bleed: 10, uses: 3, rearm: true, loud: 4, stealth: 0.3, cue: "tick", snd: "pry",
    pd: 0.12, ph: 4, pb: 6, need: { m_gear: 3, scrap: 2 }, cls: "spec", minL: 61,
    d: "Стопор из шестерён города машин: надолго заклинивает колёса и ноги роботов, а тварям рвёт лапы. Взводится снова.",
    hit: "Шестерни прихватили ногу!" },
  logic: { n: "логическая мина", g: "f", depth: 62, mine: true, price: 340, trig: "step", who: "mech", ally: 30, uses: 1, loud: 2, stealth: 0.9, cue: "beep", snd: "robot_hello",
    need: { m_relay: 2, m_okochip: 1, chip: 1 }, cls: "exp", bp: true, minL: 62,
    d: "Реле с противоречивым приказом и чипом ОКО, похожее на сервисный люк: наступивший робот получает новую прошивку и пятнадцать секунд бьёт своих. Стража уровня не перепрошить — только оглушить. На живых не реагирует." },
  /* ── Исток: корни и время ── */
  roots: { n: "корневая ловушка", g: "f", depth: 86, price: 380, trig: "step", who: "all", r: 1, hold: 14, drain: 6, uses: 3, regrow: 20, loud: 1, stealth: 0.5, cue: "tick", snd: "vine_attack",
    pd: 0.1, ph: 8, need: { i_treefiber: 2, k_root: 1 }, cls: "spec", minL: 86,
    d: "Волокно первого дерева в горсти земли: корни прорастают за миг, держат всех рядом — тварей, машины и даже дроны на взлёте — и тянут из них силы. Отрастают ещё дважды.",
    hit: "Корни обвили ноги!" },
  timeless: { n: "ловушка безвременья", g: "f", depth: 85, price: 460, trig: "prox", pr: 2, who: "all", r: 2, freeze: 16, uses: 1, loud: 0, stealth: 0.3, cue: "beep", snd: "ev_phase",
    ph: 16, need: { i_timesand: 2, i_layerstring: 1, cell: 1 }, cls: "exp", bp: true, minL: 85,
    d: "Песок безвременья в стеклянной колбе на струне слоя: когда кто-то подходит, время на два шага вокруг густеет и почти останавливается. Все, кто внутри, замирают на восемь секунд — и вы, если окажетесь рядом.",
    hit: "Время вокруг вас густеет и останавливается!" }
};
LAB.TRAPS = T;
var ORDER = Object.keys(T);
/* Винительный падеж — «заметил вашу мину». */
var ACC = { glue: "клеевую ловушку", alarm: "сигнальную растяжку", wire: "растяжку с гранатой", shock: "шоковую пластину", mine: "противопехотную мину", net: "сеть-ловушку", emp: "ЭМИ-мину", lure: "приманку-пищалку",
  fire: "зажигательную ловушку", gas: "газовую ловушку", claymore: "направленную мину", cryo: "криоловушку", acid: "кислотную ловушку", quartz: "кварцевую сирену", resin: "смоляную ловушку", mirror: "зеркальную ловушку",
  logic: "логическую мину", roots: "корневую ловушку", timeless: "ловушку безвременья" };
function itemOf(k) { return "tr_" + k; }
function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ── вещи и схемы ── */
ORDER.forEach(function (k) {
  var d = T[k];
  d.id = k; d.item = itemOf(k);
  if (!LAB.ITEMS[d.item]) LAB.ITEMS[d.item] = { n: cap1(d.n), icon: "🪤", kind: "trap", cat: "trap", trap: k, desc: d.d, price: d.price, depth: d.depth };
  if (LAB.RECIPES && !LAB.RECIPES.some(function (q) { return q.id === "t_" + k; })) {
    var rc = { id: "t_" + k, out: d.item, n: cap1(d.n), need: d.need, cls: d.cls || "spec", desc: d.d.split(". ")[0] + "." };
    if (d.bp) rc.bp = true;
    if (d.minL) rc.minL = d.minL;
    LAB.RECIPES.push(rc);
  }
});
LAB.trapIds = function () { return ORDER.map(itemOf); };

/* Ловушка в добыче: в оружейных, технических ящиках и на складах деталей —
   изредка, своей глубины; без бросков генератора — этаж не меняется. */
LAB.trapLoot = function (L, F, ot, tag) {
  if (tag !== "arms" && tag !== "tech" && tag !== "parts") return null;
  var h = LAB.hash32("trap:" + L + "-" + F + "-" + ot + "-" + tag);
  if (h % 100 >= 9) return null;
  var pool = ORDER.filter(function (k) { return T[k].depth <= L && T[k].depth > L - 30 && T[k].trig !== "remote"; });
  if (!pool.length) return null;
  return { kind: "item", item: itemOf(pool[(h >>> 8) % pool.length]), n: 1 };
};

/* ════════ В ИГРЕ ════════ */
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function cb() { return LAB.combat; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function urgent(t) { LAB.say(t, { prio: "urgent" }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function rel(x, y) { return gm().relDir(x, y); }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
var DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function idx(x, y) { return LAB.idx(x, y); }
function D(tp) { return T[tp.t]; }
/* Род: капкан сработал, мина сработала, шипы сработали. */
function gv(d, m, f, p) { return d.g === "f" ? f : d.g === "p" ? p : m; }
function cheb(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
function list() { var fs = CUR().fs; if (!fs.traps) fs.traps = []; return fs.traps; }
function fhas(f, b) { return !!(f.beh && f.beh.indexOf(b) >= 0); }
/* Урон врагам растёт с глубиной, как их запас прочности. */
function K() { var g = G(); return 1 + 0.165 * (LAB.foeLevel(g.L, g.F) - 1); }
function sapper() { return !!(LAB.ach && LAB.ach.has("sapper")); }
function cellT(x, y) { return LAB.inb(x, y) ? CUR().fl.t[idx(x, y)] : LAB.T.WALL; }
/* Клетка, на которую можно поставить ловушку: пол помещения или коридора, без вещей. */
function floorOk(x, y) {
  var t = cellT(x, y);
  if (t !== LAB.T.ROOM && t !== LAB.T.CORR) return false;
  return !LAB.solidAt(CUR().fl, x, y);
}
function trapOn(x, y, skip) {
  var ts = list();
  for (var i = 0; i < ts.length; i++) { var tp = ts[i]; if (tp !== skip && onCells(tp, x, y)) return tp; }
  return null;
}
function onCells(tp, x, y) {
  var c = tp.cells;
  if (!c) return tp.x === x && tp.y === y;
  for (var i = 0; i < c.length; i++) if (c[i][0] === x && c[i][1] === y) return true;
  return false;
}
/* Проволока поперёк прохода: в коридоре — от стены до стены, в помещении — на два шага в обе стороны. */
function wireCells(x, y, face) {
  var fl = CUR().fl, cor = cellT(x, y) === LAB.T.CORR ? LAB.corrOf(fl, x, y) : null, out = [];
  if (cor) {
    for (var k = 0; k < LAB.CORR_W; k++) {
      var cx = cor.axis === "h" ? x : cor.x0 + k, cy = cor.axis === "h" ? cor.y0 + k : y;
      if (floorOk(cx, cy) || (cx === x && cy === y)) out.push([cx, cy]);
    }
    if (out.length) return out;
  }
  var v = DV[face] || DV.N, px = v[1] ? 1 : 0, py = v[0] ? 1 : 0;
  out.push([x, y]);
  [1, -1].forEach(function (s) { for (var i = 1; i <= 2; i++) { var qx = x + px * s * i, qy = y + py * s * i; if (!floorOk(qx, qy)) break; out.push([qx, qy]); } });
  return out;
}
/* Веер направленной мины: три шага вперёд, на втором и третьем — шире. */
function coneCells(x, y, face) {
  var v = DV[face] || DV.N, px = v[1] ? 1 : 0, py = v[0] ? 1 : 0, out = [];
  for (var dd = 1; dd <= 3; dd++) {
    var cx = x + v[0] * dd, cy = y + v[1] * dd;
    if (cellT(cx, cy) === LAB.T.WALL) break;
    out.push([cx, cy]);
    if (dd >= 2) [1, -1].forEach(function (s) { var qx = cx + px * s, qy = cy + py * s; if (cellT(qx, qy) !== LAB.T.WALL && cellT(qx, qy) !== LAB.T.DOOR) out.push([qx, qy]); });
  }
  return out;
}
/* Зона, где ловушка достаёт: клетки (step, wire, cone) или радиус (prox). */
function inZone(tp, x, y) {
  var d = D(tp);
  if (d.trig === "prox") return cheb(tp.x, tp.y, x, y) <= (d.pr || 1);
  if (d.trig === "remote" || d.trig === "lure") return false;
  return onCells(tp, x, y);
}
/* Кого берёт: живых, машин, всех, кто ходит. */
function foeOk(d, f) {
  if (!f || f.dead || f.ally || f.calm || f.neutral || f.disguised || f.burrowed || f.phased) return false;
  if (fhas(f, "stationary") && d.trig !== "prox") return false;
  if (d.who === "none") return false;
  if (d.who === "walk" && fhas(f, "fly")) return false;
  if (d.who === "mech" || d.who === "metal") return f.kind === "mech";
  if (d.who === "bio") return f.kind !== "mech";
  return true;
}
function heroOk(d) {
  if (d.who === "none" || d.who === "mech") return false;
  if (d.who === "metal") return (G().weapons || []).length > 0;
  return true;
}
function foeShort(f) { return f.name.split(",")[0]; }
function stateWord(tp) {
  var d = D(tp);
  if (tp.st === "wait") return "ждёт, когда вы отойдёте";
  if (tp.st === "arm") return "взводится";
  if (tp.st === "held") { var f = heldFoe(tp); return f ? "держит: " + foeShort(f).toLowerCase() : gv(d, "сработал", "сработала", "сработали"); }
  if (tp.st === "sprung") return d.regrow ? "отрастает" : gv(d, "сработал", "сработала", "сработали") + ", " + (tp.uses > 0 ? "можно взвести снова" : "изношен" + gv(d, "", "а", "ы"));
  if (d.trig === "remote") return "ждёт вашего сигнала";
  if (d.trig === "lure") return "пищит";
  return gv(d, "взведён", "взведена", "взведены");
}
function nameOf(tp) {
  var d = D(tp);
  if (tp.by === "oko") return d.n + " сапёра ОКО";
  if (!tp.own) return (d.g === "p" ? "старые " : d.g === "f" ? "старая " : "старый ") + d.n;
  return (d.g === "p" ? "ваши " : d.g === "f" ? "ваша " : "ваш ") + d.n;
}
function heldFoe(tp) {
  if (!tp.held || !cb()) return null;
  var fs = cb().foes();
  for (var i = 0; i < fs.length; i++) if (fs[i].id === tp.held && !fs[i].dead) return fs[i];
  return null;
}
function remove(tp) { var ts = list(), i = ts.indexOf(tp); if (i >= 0) ts.splice(i, 1); }
function nextId() { var fs = CUR().fs; fs.trapSeq = (fs.trapSeq || 0) + 1; return "tp" + fs.trapSeq; }

/* ── звук ── */
function sndAt(id, x, y, o) { if (LAB.atmos && LAB.atmos.at) A("at", id, x, y, o || {}); else A("play", id, o || {}); }
function fireSound(d, x, y) {
  if (d.snd === "boom") { A("explosion", x, y, "mine"); return; }
  if (d.snd === "boom_big") { A("explosion", x, y, "shell"); return; }
  if (d.snd === "emp") { A("explosion", x, y, "emp"); return; }
  if (d.id === "wire") { sndAt("grenade_land", x, y); return; }
  sndAt(d.snd || "hit_metal", x, y, { gain: 1, rate: d.id === "bonebell" ? 0.7 : 1 });
}

/* ════════ СРАБАТЫВАНИЕ ════════
   who — { f: враг } или { hero: true } или null (подрыв по сигналу, цепной). */
var pending = [];
var zones = [];
var lastAlarm = {};
function fire(tp, who, at) {
  var d = D(tp), g = G(), x = at ? at[0] : tp.x, y = at ? at[1] : tp.y;
  if (tp.st === "gone") return;
  tp.uses = (tp.uses == null ? (d.uses || 1) : tp.uses) - 1;
  var k = K(), hitF = [], hero = false;
  /* кого задело */
  var foes = cb() ? cb().foes() : [];
  if (d.trig === "cone") {
    foes.forEach(function (f) { if (!f.dead && !f.ally && onCells(tp, f.x, f.y)) hitF.push(f); });
    hero = onCells(tp, g.x, g.y);
  } else if (d.r) {
    foes.forEach(function (f) { if (!f.dead && !f.ally && cheb(f.x, f.y, x, y) <= d.r && (d.boom || foeOk(d, f) || (who && who.f === f))) hitF.push(f); });
    hero = cheb(g.x, g.y, x, y) <= d.r && (d.boom || heroOk(d) || !!(who && who.hero));
  } else {
    if (who && who.f) hitF.push(who.f);
    hero = !!(who && who.hero);
  }
  if (d.alarm) { alarmFire(tp, d, who, x, y); if (who && who.hero) applyHero(tp, d); return finish(tp, d); }
  fireSound(d, x, y);
  if (d.boom) setTimeout(function () { LAB.safe(function () { A("play", "debris", { gain: 0.6 }); }); }, 260);
  if (d.loud && cb()) cb().noise(d.loud);
  /* враги */
  var killed = 0, mech = 0, caught = [];
  hitF.forEach(function (f) {
    var before = f.dead;
    applyFoe(tp, d, f, k);
    if (f.dead && !before) { killed++; if (f.kind === "mech") mech++; }
    else if (!f.dead && (d.hold || d.freeze || d.stun || d.ally)) caught.push(f);
  });
  if (killed && tp.own) { ev("trap_kill", killed); if (mech) ev("trap_mech", mech); }
  /* вы */
  if (hero) { applyHero(tp, d); if (tp.by === "oko" && LAB.oko && LAB.oko.react) LAB.oko.react("oko_trap"); }
  /* огонь и газ остаются на месте */
  if (d.zone) zones.push({ k: d.zone.k, x: x, y: y, r: d.zone.r, t: d.zone.t, d: d.zone.d, own: tp.own });
  /* взрыв задевает соседние заряды */
  if (d.boom) list().forEach(function (o) { if (o !== tp && o.st === "on" && D(o).boom && cheb(o.x, o.y, x, y) <= (d.r || 1) + 1 && pending.indexOf(o) < 0) pending.push(o); });
  /* что сказать */
  if (tp.own && !hero && hitF.length) {
    var nm = cap1(d.n) + " " + gv(d, "сработал", "сработала", "сработали") + ", " + rel(x, y) + ": ";
    if (hitF.length === 1) {
      var f1 = hitF[0], fem = f1.g === "f";
      nm += foeShort(f1).toLowerCase() + " " + (f1.dead ? (fem ? "уничтожена" : "уничтожен") : d.ally ? (fem ? "перепрошита и бьёт своих" : "перепрошит и бьёт своих") : (d.hold || d.freeze) ? (fem ? "попалась" : "попался") : d.confuse ? (fem ? "сбита с толку" : "сбит с толку") : (fem ? "задета" : "задет")) + ".";
    } else nm += "задето " + hitF.length + (killed ? ", уничтожено " + killed : "") + ".";
    LAB.say(nm, { prio: "event" });
  } else if (!tp.own && !hero && hitF.length) sayq(cap1(nameOf(tp)) + " " + gv(d, "сработал", "сработала", "сработали") + " " + rel(x, y) + ".");
  if (d.hold && caught.length && who && who.f && caught.indexOf(who.f) >= 0 && !d.r) { tp.st = "held"; tp.held = who.f.id; }
  finish(tp, d);
}
function finish(tp, d) {
  if (tp.st === "held") return;
  if (tp.uses <= 0 && !d.regrow) { tp.st = "gone"; remove(tp); return; }
  if (d.rearm) { tp.st = "sprung"; return; }
  if (d.regrow) { tp.st = "sprung"; tp.grow = d.regrow; return; }
  tp.st = "on";
}
function applyFoe(tp, d, f, k) {
  var boss = !!f.boss, mechF = f.kind === "mech", hard = !!(f.aff && f.aff.indexOf("hardened") >= 0);
  var half = function (n) { return boss ? Math.ceil(n / 2) : n; };
  if (d.ally) {
    if (!mechF) return;
    if (boss) { f.frozen = Math.max(f.frozen || 0, 6); return; }
    f.ally = true; f.allyT = d.ally; f.state = "idle"; f.aim = false; f.at = 0;
    return;
  }
  var dmg = d.dmg ? d.dmg * k * (mechF && d.mk ? d.mk : 1) : 0;
  if (tp.dmgAbs) dmg = tp.dmgAbs;
  if (dmg > 0 && cb()) cb().damageFoe(f, Math.round(dmg), d.dt || "kinetic", { noarmor: !!d.noarmor, quiet: true });
  if (f.dead) return;
  if (d.emp && mechF && !hard) f.shield = 0;
  if (d.hold && (d.id !== "magnet" || mechF) && (d.id !== "gear" || mechF)) f.frozen = Math.max(f.frozen || 0, half(d.hold));
  if (d.id === "gear" && !mechF) f.frozen = Math.max(f.frozen || 0, half(6));
  if (d.stun && mechF && !hard) f.frozen = Math.max(f.frozen || 0, half(d.stun));
  if (d.freeze) f.frozen = Math.max(f.frozen || 0, half(d.freeze));
  if (d.slow && (!d.stun || !mechF)) f.slowT = Math.max(f.slowT || 0, d.slow);
  if (d.bleed && !mechF) { f.bleedT = Math.max(f.bleedT || 0, d.bleed); f.bleedD = Math.max(f.bleedD || 1, Math.round(2 * k)); }
  if (d.drain) { f.bleedT = Math.max(f.bleedT || 0, half(d.hold || 10)); f.bleedD = Math.max(f.bleedD || 1, Math.round(d.drain * k)); }
  if (d.confuse && (!d.alarm || !mechF)) f.confused = Math.max(f.confused || 0, half(d.confuse));
  if (d.deaf) f.deafT = Math.max(f.deafT || 0, d.deaf);
  if (d.shred) f.arm = Math.round((f.arm || 0) * (1 - d.shred));
  if (!f.dead && f.state === "idle") { f.state = "alert"; f.lastKnown = { x: f.x, y: f.y }; }
}
function applyHero(tp, d) {
  var g = G(), msg = [];
  var soft = tp.own && sapper() ? 0.5 : 1;
  urgent(d.hit || (cap1(nameOf(tp)) + " " + gv(d, "сработал", "сработала", "сработали") + " на вас!"));
  if (tp.own) ev("self_trap", 1);
  if (d.pd || tp.dmgAbs) {
    var raw = tp.dmgAbs ? tp.dmgAbs : Math.max(1, Math.round(g.hpMax * d.pd * soft));
    if (cb()) cb().hurtPlayer(raw, d.adt || "phys", null);
    if (g.dead) return;
  }
  if (d.ph) { g.st.trapHeld = Math.max(g.st.trapHeld || 0, Math.round(d.ph * soft)); }
  if (d.ps) g.st.slow = Math.max(g.st.slow || 0, d.ps);
  if (d.pb) { if (!g.st.bleed) msg.push("Рана кровит."); g.st.bleed = Math.max(g.st.bleed || 0, d.pb * 2); }
  if (d.pemp) { g.en = 0; if (g.st.shield) g.st.shield = 0; msg.push("Энергия имплантов на нуле, щит снят."); }
  if (d.pdeaf) { g.st.deaf = Math.max(g.st.deaf || 0, d.pdeaf); A("deafen", d.pdeaf * 500); }
  if (d.pjam) { g.st.navjam = Math.max(g.st.navjam || 0, d.pjam); msg.push("Навигатор сбит."); }
  if (d.ptox && !(g.st.antitox > 0) && !gm().armorSpecial("antitox")) gm().bodyApply({ tox: d.ptox }, msg);
  if (d.pneuro) gm().bodyApply({ neuro: d.pneuro }, msg);
  if (d.parmor && g.armor) { g.armor.def = Math.max(0, Math.round((g.armor.def || 0) * (1 - d.parmor))); msg.push("Броня разъедена: защита " + LAB.armorDef(g.armor) + "."); }
  if (d.pnoise && cb()) cb().noise(d.pnoise);
  if (d.freeze && !d.ph) g.st.trapHeld = Math.max(g.st.trapHeld || 0, Math.round(d.freeze * soft));
  if (g.st.trapHeld > 0 && d.ph) msg.push(LAB.K("Вырывайтесь — свайпами в любую сторону.", "Вырывайтесь — клавишами ходьбы."));
  if (msg.length) sayq(msg.join(" "));
  UIx("refresh");
}
/* Сигнальная растяжка и костяной колокол: сказать, где задели. */
function alarmFire(tp, d, who, x, y) {
  var now = Date.now();
  fireSound(d, x, y);
  if (who && who.hero) return;
  if (lastAlarm[tp.id] && now - lastAlarm[tp.id] < 2500) return;
  lastAlarm[tp.id] = now;
  LAB.say(cap1(d.n) + " " + (d.id === "bonebell" ? "запел" : "загремела") + ": кто-то идёт, " + rel(x, y) + ".", { prio: "event" });
  if (d.confuse && cb()) cb().foes().forEach(function (f) { if (!f.dead && f.kind !== "mech" && cheb(f.x, f.y, x, y) <= (d.r || 3) && foeOk(d, f)) f.confused = Math.max(f.confused || 0, d.confuse); });
}

/* ════════ ХОДЫ ════════ */
/* Враг сделал шаг (из боя: moveFoe). */
function foeStep(f) {
  if (!CUR() || !CUR().fs) return;
  var ts = list();
  for (var i = 0; i < ts.length; i++) {
    var tp = ts[i];
    if (tp.st !== "on") continue;
    var d = D(tp);
    if (d.trig === "prox" || d.trig === "remote" || d.trig === "lure") continue;
    if (tp.by === "oko" && f.kind === "mech") continue; /* своё машины ОКО знают */
    if (!foeOk(d, f) || !onCells(tp, f.x, f.y)) continue;
    fire(tp, { f: f }, [f.x, f.y]);
    if (f.dead) return;
    break;
  }
}
/* Вы сделали шаг (из боя: afterPlayerMove). */
var warned = {};
function playerStep() {
  if (!CUR() || !CUR().fs) return;
  var g = G(), ts = list().slice();
  for (var i = 0; i < ts.length; i++) {
    var tp = ts[i], d = D(tp);
    if (tp.st === "wait" && !inZone(tp, g.x, g.y) && !(tp.x === g.x && tp.y === g.y)) { tp.st = "arm"; tp.arm = armTicks(d); }
    if (tp.st !== "on" || tp.gone) continue;
    if (d.trig === "remote" || d.trig === "lure") continue;
    if (heroOk(d) && inZone(tp, g.x, g.y)) { fire(tp, { hero: true }, [g.x, g.y]); if (g.dead) return; }
  }
  discover(2);
  nearCue();
}
function armTicks(d) { var a = d.trig === "remote" ? 2 : 4; return sapper() ? Math.ceil(a / 2) : a; }
/* Старые ловушки и мины сапёра слышно за два шага. */
function discover(rad) {
  var g = G(), found = [];
  list().forEach(function (tp) {
    if (tp.known || tp.st !== "on") return;
    var dd = cheb(tp.x, tp.y, g.x, g.y);
    if (dd > rad) return;
    /* ловушку сапёра ОКО за шаг слышно не всегда — вплотную всегда */
    if (tp.by === "oko" && dd >= 2 && Math.random() < 0.45) return;
    tp.known = 1; found.push(tp);
  });
  found.forEach(function (tp) {
    var d = D(tp);
    sndAt(d.cue === "beep" ? "mine_beep" : "near_tick", tp.x, tp.y, { gain: 0.9 });
    urgent("Осторожно: " + nameOf(tp) + " " + rel(tp.x, tp.y) + "!" + (warned.hint ? "" : " Подойдите вплотную — её можно обезвредить."));
    warned.hint = 1;
  });
}
/* Рядом с известной ловушкой — тихий щелчок с её стороны; прямо по пути — предупреждение. */
function nearCue() {
  var g = G(), v = DV[g.face] || DV.N, fx = g.x + v[0], fy = g.y + v[1];
  list().forEach(function (tp) {
    if (!tp.known || (tp.st !== "on" && tp.st !== "arm")) return;
    var d = D(tp);
    if (d.trig === "remote" || d.trig === "lure") return;
    var near = d.trig === "prox" ? cheb(tp.x, tp.y, g.x, g.y) <= (d.pr || 1) + 1 : cellsNear(tp, g.x, g.y);
    if (!near) return;
    sndAt(d.cue === "beep" ? "mine_beep" : "near_tick", tp.x, tp.y, { gain: 0.55 });
    var ahead = d.trig === "prox" ? cheb(tp.x, tp.y, fx, fy) <= (d.pr || 1) : inZone(tp, fx, fy);
    if (ahead) {
      var key = tp.id + ":" + g.x + "," + g.y, now = Date.now();
      if (warned[key] && now - warned[key] < 15000) return;
      warned[key] = now;
      LAB.say("Впереди " + nameOf(tp) + "!", { prio: "urgent" });
    }
  });
}
function cellsNear(tp, x, y) {
  var c = tp.cells || [[tp.x, tp.y]];
  for (var i = 0; i < c.length; i++) if (cheb(c[i][0], c[i][1], x, y) <= 1) return true;
  return false;
}
/* Ходьба с удержанием останавливается перед известной ловушкой. */
function knownAt(x, y) {
  var ts = list();
  for (var i = 0; i < ts.length; i++) {
    var tp = ts[i], d = D(tp);
    if (!tp.known || (tp.st !== "on" && tp.st !== "arm") || d.trig === "remote" || d.trig === "lure") continue;
    if (inZone(tp, x, y) && heroOk(d)) return tp;
  }
  return null;
}
/* Обходят ли враги эту клетку: свои ловушки — те, что заметили; старые — все, кто здесь живёт; мины сапёра — машины. */
function avoid(f, x, y) {
  if (!f || !CUR() || !CUR().fs || !CUR().fs.traps || !CUR().fs.traps.length) return false;
  var ts = CUR().fs.traps;
  for (var i = 0; i < ts.length; i++) {
    var tp = ts[i];
    if (tp.st !== "on" || !onCells(tp, x, y)) continue;
    if (tp.own) { if (tp.seen && tp.seen[f.id]) return true; continue; }
    if (tp.by === "oko") { if (f.kind === "mech") return true; continue; }
    if (!f.spawned) return true;
  }
  return false;
}

/* ════════ ТАКТ ════════ */
function tick() {
  if (!CUR() || !CUR().fs || G().dead) return;
  var g = G(), ts = list();
  /* держит ли вас ловушка */
  if (g.st.trapHeld > 0) { g.st.trapHeld--; if (!g.st.trapHeld) sayq("Вы высвободились."); }
  /* цепные подрывы */
  if (pending.length) { var pq = pending; pending = []; pq.forEach(function (o) { if (list().indexOf(o) >= 0 && o.st === "on") fire(o, null, [o.x, o.y]); }); if (g.dead) return; }
  var foes = cb() ? cb().foes() : [];
  for (var i = ts.length - 1; i >= 0; i--) {
    var tp = ts[i]; if (!tp) continue;
    var d = D(tp);
    if (!d) { ts.splice(i, 1); continue; }
    if (tp.st === "arm") {
      if (--tp.arm > 0) continue;
      if (d.trig !== "remote" && d.trig !== "lure" && heroOk(d) && inZone(tp, g.x, g.y)) { tp.arm = 1; continue; }
      tp.st = "on";
      if (tp.own) { sndAt("mine_beep", tp.x, tp.y, { gain: 0.7 }); sayq(cap1(d.n) + " " + (d.trig === "lure" ? "запищала" : gv(d, "взведён", "взведена", "взведены")) + ", " + rel(tp.x, tp.y) + "."); }
      continue;
    }
    if (tp.st === "held") { if (!heldFoe(tp) || !(heldFoe(tp).frozen > 0)) { tp.held = null; tp.st = "on"; finish(tp, d); } continue; }
    if (tp.st === "sprung" && d.regrow && tp.uses > 0) { if (--tp.grow <= 0) { tp.st = "on"; if (cheb(tp.x, tp.y, g.x, g.y) <= 8) sndAt("vine_idle", tp.x, tp.y, { gain: 0.5 }); } continue; }
    if (tp.st !== "on") continue;
    if (d.trig === "lure") {
      tp.life = (tp.life == null ? d.life : tp.life) - 1;
      if (tp.life % 4 === 0 && cb()) { cb().noiseLure(tp.x, tp.y); }
      if (tp.life <= 0) { remove(tp); if (tp.own) sayq("Приманка-пищалка выдохлась, " + rel(tp.x, tp.y) + "."); }
      continue;
    }
    if (d.trig === "prox") {
      var hit = null;
      for (var j = 0; j < foes.length && !hit; j++) { var f = foes[j]; if (foeOk(d, f) && (tp.own || f.spawned) && cheb(f.x, f.y, tp.x, tp.y) <= (d.pr || 1)) hit = f; }
      if (hit) { fire(tp, { f: hit }, [tp.x, tp.y]); if (g.dead) return; continue; }
      if (heroOk(d) && cheb(g.x, g.y, tp.x, tp.y) <= (d.pr || 1)) { fire(tp, { hero: true }, [tp.x, tp.y]); if (g.dead) return; continue; }
    }
    /* умная машина может заметить вашу ловушку и обойти её */
    if (tp.own && d.stealth < 1) foes.forEach(function (f) {
      if (f.dead || f.kind !== "mech" || f.state === "hunt" || !foeOk(d, f) || (f.iq || 0) < 6 || (tp.seen && tp.seen[f.id])) return;
      if (cheb(f.x, f.y, tp.x, tp.y) > 2) return;
      if (Math.random() < ((f.iq || 0) - 5) * 0.02 * (1 - d.stealth)) {
        tp.seen = tp.seen || {}; tp.seen[f.id] = 1;
        LAB.say(foeShort(f) + " " + (f.g === "f" ? "заметила" : "заметил") + " " + gv(d, "ваш ", "вашу ", "ваши ") + (ACC[d.id] || d.n) + " и обходит " + gv(d, "его", "её", "их") + ", " + rel(tp.x, tp.y) + ".", { prio: "event" });
      }
    });
  }
  /* огонь и газ */
  for (var z = zones.length - 1; z >= 0; z--) {
    var zn = zones[z];
    if (--zn.t <= 0) { zones.splice(z, 1); continue; }
    var kk = K();
    foes.forEach(function (f) {
      if (f.dead || f.ally || cheb(f.x, f.y, zn.x, zn.y) > zn.r) return;
      if (zn.k === "gas" && f.kind === "mech") return;
      if (cb()) cb().damageFoe(f, Math.round(zn.d * kk), zn.k === "fire" ? "thermo" : "bio", { noarmor: true, quiet: true });
      if (f.dead && zn.own) { ev("trap_kill", 1); if (f.kind === "mech") ev("trap_mech", 1); }
    });
    if (cheb(g.x, g.y, zn.x, zn.y) <= zn.r) {
      if (zn.k === "fire") { if (cb()) cb().hurtPlayer(Math.max(1, Math.round(g.hpMax * 0.04)), "therm", null); if (g.dead) return; }
      else if (zn.t % 2 === 0 && !(g.st.antitox > 0) && !gm().armorSpecial("antitox")) gm().bodyApply({ tox: 6 }, []);
    }
    if (zn.t % 4 === 0) sndAt(zn.k === "fire" ? "implant_thermal" : "ev_steam", zn.x, zn.y, { gain: 0.35 });
  }
  /* перепрошитые машины возвращаются к ОКО */
  foes.forEach(function (f) {
    if (f.allyT > 0 && --f.allyT === 0) { f.ally = false; f.state = "alert"; f.lastKnown = { x: g.x, y: g.y }; sayq(foeShort(f) + " " + gv({ g: f.g }, "стряхнул", "стряхнула", "стряхнули") + " чужую прошивку и снова слушает ОКО."); }
    if (f.deafT > 0) f.deafT--;
  });
}

/* ════════ ПОСТАВИТЬ, СНЯТЬ, ПОДОРВАТЬ ════════ */
var MAX_OWN = 12;
function ownCount() { return list().filter(function (tp) { return tp.own; }).length; }
function frontCell() { var g = G(), v = DV[g.face] || DV.N; return [g.x + v[0], g.y + v[1]]; }
function frontOk() {
  var c = frontCell(), g = G();
  if (!floorOk(c[0], c[1]) || trapOn(c[0], c[1])) return false;
  if (gm().foeAt && gm().foeAt(c[0], c[1])) return false;
  return !(c[0] === g.x && c[1] === g.y);
}
function hereOk() { var g = G(); return cellT(g.x, g.y) !== LAB.T.DOOR && !trapOn(g.x, g.y); }
function place(k, where) {
  var g = G(), d = T[k], item = itemOf(k);
  if (!d || !(g.inv[item] > 0)) { say("Нет: " + (d ? d.n : k) + "."); return false; }
  if (g.stair) { say("На лестнице ловушку не поставить."); return false; }
  if (ownCount() >= MAX_OWN) { LAB.UI.error(); say("На этаже уже " + MAX_OWN + " ваших ловушек: больше не уследить. Снимите какую-нибудь."); return false; }
  var c = where === "front" ? frontCell() : [g.x, g.y];
  if (where === "front" ? !frontOk() : !hereOk()) { LAB.UI.error(); say(where === "front" ? "Впереди ловушку не поставить: там стена, дверь, вещь, враг или уже стоит ловушка." : "Здесь ловушку не поставить: дверной проём или тут уже стоит ловушка."); return false; }
  UIx("closeAll");
  var tp = { id: nextId(), t: k, x: c[0], y: c[1], own: 1, known: 1, uses: d.uses || 1, st: where === "front" ? "arm" : "wait", arm: armTicks(d) };
  if (d.trig === "wire") tp.cells = wireCells(c[0], c[1], g.face);
  if (d.trig === "cone") { tp.dir = g.face; tp.cells = coneCells(c[0], c[1], g.face); }
  if (d.trig === "lure") tp.life = d.life;
  if (tp.cells && tp.cells.some(function (q) { return trapOn(q[0], q[1]); })) { LAB.UI.error(); say("Здесь проволоку не натянуть: поперёк уже стоит другая ловушка."); return false; }
  g.inv[item]--;
  list().push(tp);
  A("play", "mine_set");
  if (cb()) cb().noise(2);
  ev("trap_set", 1);
  var where2 = where === "front" ? LAB.DIRN[g.face] : "под ногами";
  var extra = d.trig === "wire" && tp.cells.length > 1 ? " Проволока натянута поперёк, на " + tp.cells.length + " " + pl(tp.cells.length, "шаг", "шага", "шагов") + "." : d.trig === "cone" ? " Веер смотрит " + LAB.DIRTO[g.face] + "." : "";
  var how = d.trig === "remote" ? " Подорвать — окно «Ловушки и мины», «Ваши ловушки на этаже»." : d.trig === "lure" ? " Запищит, когда отойдёте." : tp.st === "wait" ? " Взведётся, когда вы отойдёте." : " Взведётся через пару секунд.";
  say(cap1(d.n) + " " + gv(d, "поставлен", "поставлена", "поставлены") + " " + where2 + "." + extra + how + (g.tut.trap ? "" : " Наступите сами — сработает и на вас. Снять — подойдите вплотную, " + LAB.K("двойное касание", "Enter") + "."));
  g.tut.trap = 1;
  UIx("refresh");
  return true;
}
/* Забрать свою ловушку: целую — вещью, изношенную — на детали. */
/* Быстрая установка жестом (1.6): вверх-вниз — ловушка, вниз-вверх — мина, под ноги (с 1.7 — и с оружием в руках).
   Одна подходящая вещь в рюкзаке — ставится сразу, несколько — короткий выбор. */
function quick(kind) {
  var g = G(), want = kind === "mine";
  var have = Object.keys(T).filter(function (k) { return !!T[k].mine === want && g.inv[itemOf(k)] > 0; });
  if (!have.length) { LAB.UI.error(); say(want ? "Мин в рюкзаке нет: их продают пункты снабжения и собирают у верстака." : "Ловушек в рюкзаке нет: их продают пункты снабжения и собирают у верстака."); return false; }
  if (have.length === 1) return place(have[0], "here");
  UIx("menu", want ? "Поставить мину под ноги" : "Поставить ловушку под ноги", have.map(function (k) {
    return { label: cap1(T[k].n) + " (" + g.inv[itemOf(k)] + ")", fn: function () { place(k, "here"); } };
  }));
  return true;
}
function isMine(k) { return !!(T[k] && T[k].mine); }
function pickUp(tp) {
  var d = D(tp), g = G();
  if (!tp.own) return;
  if (tp.st === "held") { say("Сначала пусть ловушка отпустит того, кого держит."); return; }
  remove(tp);
  A("play", "pry");
  var full = tp.uses >= (d.uses || 1) || d.uses >= 99 || (d.trig === "lure" && tp.st !== "on");
  if (full || tp.st === "wait" || tp.st === "arm") { g.inv[d.item] = (g.inv[d.item] || 0) + 1; say(cap1(d.n) + " " + gv(d, "снят", "снята", "сняты") + " и в рюкзаке."); }
  else { var parts = partsOf(d), got = []; for (var p in parts) { g.inv[p] = (g.inv[p] || 0) + parts[p]; got.push((LAB.ITEMS[p] ? LAB.ITEMS[p].n.toLowerCase() : p) + (parts[p] > 1 ? " — " + parts[p] : "")); } say(cap1(d.n) + " " + gv(d, "изношен", "изношена", "изношены") + ": вы разбираете её на детали. " + (got.length ? "Получено: " + got.join(", ") + "." : "")); }
  UIx("refresh");
}
/* Из чего сделана: половина деталей схемы, но не меньше одной. */
function partsOf(d) {
  var out = {}, n = 0;
  for (var k in d.need) { if (!LAB.ITEMS[k] || LAB.ITEMS[k].kind !== "part") continue; var q = Math.floor(d.need[k] / 2); if (q > 0) { out[k] = q; n++; } }
  if (!n) out.scrap = 1;
  return out;
}
function rearm(tp) {
  var d = D(tp);
  if (tp.uses <= 0) { say(cap1(d.n) + " " + gv(d, "изношен", "изношена", "изношены") + ": взводить больше нельзя. Снимите на детали."); return; }
  tp.st = "wait"; tp.held = null;
  A("play", "mine_set");
  say(cap1(d.n) + " " + gv(d, "взведётся", "взведётся", "взведутся") + ", когда вы отойдёте. Осталось срабатываний: " + tp.uses + ".");
}
function detonate(tp) {
  var g = G();
  if (list().indexOf(tp) < 0) return;
  UIx("closeAll");
  A("play", "term_beep");
  var close = cheb(g.x, g.y, tp.x, tp.y) <= (D(tp).r || 1);
  if (close) sayq("Вы слишком близко!");
  setTimeout(function () { LAB.safe(function () { if (list().indexOf(tp) >= 0) fire(tp, null, [tp.x, tp.y]); UIx("refresh"); }); }, 350);
}
/* Обезвредить чужую ловушку: повторите сигналы. Удалось — она ваша. */
function disarm(tp) {
  var d = D(tp), g = G();
  var len = gm().hackLength(1 + Math.floor(Math.min(g.L, 40) / 8));
  if (g.inv.toolkit > 0) len--;
  if (g.inv.wirecutters > 0 && (d.trig === "wire" || d.cue === "beep")) len--;
  if (sapper()) len--;
  len = Math.max(3, len);
  UIx("closeAll");
  LAB.mini.hack(len, function (ok) {
    if (list().indexOf(tp) < 0) return;
    if (!ok && LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы осторожно убираете руки. " + cap1(nameOf(tp)) + " на месте."); return; }
    if (!ok) { A("play", "term_err"); fire(tp, { hero: true }, [tp.x, tp.y]); return; }
    remove(tp);
    A("play", "term_ok");
    g.inv[d.item] = (g.inv[d.item] || 0) + 1;
    gm().gainXP(6 + Math.floor(g.L / 4));
    ev("disarm", 1);
    if (tp.by === "oko" && LAB.oko && LAB.oko.react) setTimeout(function () { LAB.oko.react("oko_trap_off"); }, 1500);
    say(cap1(nameOf(tp)) + " " + gv(d, "обезврежен", "обезврежена", "обезврежены") + ". " + cap1(d.n) + " теперь ваш" + gv(d, "", "а", "и") + ": в рюкзаке, раздел «Ловушки и мины».");
    UIx("refresh");
  }, { title: "Обезвредить: " + d.n });
}

/* ════════ ОКНА ════════ */
function haveIds() { var g = G(); return ORDER.filter(function (k) { return g.inv[itemOf(k)] > 0; }); }
function count() { var g = G(); return ORDER.reduce(function (a, k) { return a + (g.inv[itemOf(k)] || 0); }, 0); }
function back() { return { label: "Назад", fn: function () { UIx("inventory"); } }; }
/* Что умеет ловушка — для «Осмотреть». */
function effLine(d) {
  var s = [];
  s.push({ step: "срабатывает под ногой", wire: "срабатывает, если задеть проволоку: в коридоре она идёт от стены до стены", cone: "бьёт веером на три шага вперёд", prox: "срабатывает, когда рядом " + (d.pr > 1 ? "в двух шагах" : "в шаге"), remote: "подрывается по вашему сигналу", lure: "полминуты пищит и зовёт врагов" }[d.trig]);
  if (d.who !== "none") s.push({ all: "берёт всех, даже дронов", walk: "берёт всех, кто ходит; дроны пролетают", mech: "только машины", bio: "только живых", metal: "машины и тех, кто с оружием" }[d.who]);
  if (d.r && d.dmg) s.push("задевает всех в " + (d.r > 1 ? d.r + " шагах" : "шаге") + " вокруг");
  if (d.hold) s.push("держит на месте");
  if (d.freeze) s.push("замораживает");
  if (d.stun) s.push("останавливает машины");
  if (d.slow) s.push("замедляет");
  if (d.bleed) s.push("ранит до крови");
  if (d.confuse) s.push("сбивает с толку");
  if (d.deaf) s.push("лишает слуха");
  if (d.emp) s.push("снимает щиты");
  if (d.shred) s.push("разъедает броню");
  if (d.zone) s.push(d.zone.k === "fire" ? "оставляет огонь" : "оставляет облако газа");
  if (d.ally) s.push("перепрошивает робота на вашу сторону");
  if (d.uses > 1 && d.uses < 99) s.push((d.rearm ? "взводится снова, " : "") + "до " + d.uses + " раз");
  else if (d.uses >= 99) s.push("срабатывает сколько угодно");
  if (d.loud >= 8) s.push("громко");
  else if (!d.loud) s.push("бесшумно");
  return cap1(s.join(", ")) + "." + (heroOk(d) || d.who === "metal" ? " На вас тоже сработает." : " На вас не сработает.");
}
function menu() {
  if (!gm().entered) return;
  var g = G(), items = [];
  haveIds().forEach(function (k) {
    var d = T[k];
    items.push({ label: cap1(d.n) + ": " + g.inv[itemOf(k)], fn: function () { itemMenu(k); } });
  });
  if (!items.length) items.push({ label: "Ловушек и мин нет. Их продают пункты снабжения, собирают у верстака, снимают обезвреженными с чужих мест.", info: true, keep: true, fn: function () { say("Ловушек и мин нет. Их продают пункты снабжения на каждом этаже, собирают у верстака из деталей, а чужие ловушки и мины можно обезвредить и забрать."); } });
  var own = list().filter(function (tp) { return tp.own; });
  items.push({ label: "Ваши ловушки на этом этаже: " + own.length, fn: ownMenu });
  items.push({ label: "Как обращаться с ловушками", keep: true, fn: help });
  items.push(back());
  UIx("menu", "Ловушки и мины", items);
}
function itemMenu(k) {
  var d = T[k], g = G(), items = [];
  items.push({ label: "Поставить здесь, под ногами: взведётся, когда отойдёте", fn: function () { place(k, "here"); } });
  if (frontOk()) items.push({ label: "Поставить на шаг впереди, " + LAB.DIRN[g.face], fn: function () { place(k, "front"); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say(cap1(d.n) + ". " + d.d + " " + effLine(d)); } });
  items.push({ label: "Назад", fn: menu });
  UIx("menu", cap1(d.n) + ": " + (g.inv[itemOf(k)] || 0), items);
}
function ownMenu() {
  var own = list().filter(function (tp) { return tp.own; }), items = [];
  own.forEach(function (tp) {
    var d = D(tp);
    items.push({ label: cap1(d.n) + " — " + rel(tp.x, tp.y) + ", " + stateWord(tp), fn: function () { farMenu(tp); } });
  });
  if (!items.length) items.push({ label: "На этом этаже ваших ловушек нет", info: true, keep: true, fn: function () {} });
  items.push({ label: "Назад", fn: menu });
  UIx("menu", "Ваши ловушки на этаже", items);
}
function farMenu(tp) {
  var d = D(tp), items = [];
  if (d.trig === "remote" && tp.st === "on") items.push({ label: "Подорвать" + (cheb(G().x, G().y, tp.x, tp.y) <= (d.r || 1) ? ": вы рядом — заденет и вас!" : ""), fn: function () { detonate(tp); } });
  items.push({ label: "Вести к ней", fn: function () { leadTo(tp); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say(cap1(nameOf(tp)) + ", " + rel(tp.x, tp.y) + ", " + stateWord(tp) + ". " + effLine(d)); } });
  items.push({ label: "Назад", fn: ownMenu });
  UIx("menu", cap1(d.n), items);
}
/* Навигатор — к клетке рядом с ловушкой, но не на неё. */
function leadTo(tp) {
  var best = null, bd = 1e9, g = G();
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (v) {
    var x = tp.x + v[0], y = tp.y + v[1];
    if (!floorOk(x, y) || inZone(tp, x, y) || trapOn(x, y)) return;
    var dd = Math.abs(x - g.x) + Math.abs(y - g.y);
    if (dd < bd) { bd = dd; best = [x, y]; }
  });
  UIx("closeAll");
  if (!best) { say("К этой ловушке не подойти, не задев её."); return; }
  if (gm().navigateTo) gm().navigateTo({ n: D(tp).n, cell: best });
}
function help() {
  say("Ловушку ставят под ногами или на шаг впереди: она взводится, когда вы отойдёте, — щелчок и писк. Срабатывает на того, кто на неё наступит или её заденет: на тварей, на роботов и на вас самих. Рядом со своей ловушкой «Эхо» тихо щёлкает с её стороны, предупреждает, если она прямо по пути, а ходьба с удержанием перед ней останавливается. Отдельный шаг — и вы наступите. Снять — подойдите вплотную, " + LAB.K("двойное касание", "Enter") + ". Сработавший капкан взводят снова. Заряд на радиосигнале подрывают отсюда. Старые ловушки прежних жителей и мины робота-сапёра слышно за два шага: их можно обезвредить и забрать себе. Умные машины иногда замечают ловушки и обходят их. Дроны пролетают над тем, что лежит на полу, — их ловят сети, корни и магнитные мины.");
}
/* Ловушки рядом — для «что рядом» и окна действий: вплотную и под ногами. */
function adjacent(x, y, dir) {
  var out = [], ts = list();
  ts.forEach(function (tp) {
    if (!tp.known) return;
    var hitC = tp.cells ? tp.cells.some(function (q) { return q[0] === x && q[1] === y; }) : (tp.x === x && tp.y === y);
    if (hitC) out.push({ type: "trap", ref: tp, dir: dir });
  });
  return out;
}
function targetName(tp) { var d = D(tp); return cap1(nameOf(tp)) + ", " + stateWord(tp); }
function trapMenu(tp) {
  var d = D(tp), items = [];
  if (tp.own) {
    if (tp.st === "sprung" && d.rearm) items.push({ label: "Взвести снова: срабатываний осталось " + tp.uses, fn: function () { UIx("closeAll"); rearm(tp); } });
    if (d.trig === "remote" && tp.st === "on") items.push({ label: "Подорвать: вы рядом — заденет и вас!", fn: function () { detonate(tp); } });
    items.push({ label: "Снять и забрать", fn: function () { UIx("closeAll"); pickUp(tp); } });
  } else items.push({ label: "Обезвредить: повторите сигналы", fn: function () { disarm(tp); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say(cap1(nameOf(tp)) + ", " + stateWord(tp) + ". " + d.d + (tp.own ? "" : " Обезвредите — заберёте себе. Ошибётесь — сработает на вас.")); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", cap1(nameOf(tp)), items);
}
/* Для «Осмотреться»: известные ловушки в этом помещении или коридоре. */
function lookList(filt) {
  var out = [];
  list().forEach(function (tp) {
    if (!tp.known || tp.st === "gone") return;
    if (filt && !filt(tp.x, tp.y)) return;
    out.push(nameOf(tp) + " " + rel(tp.x, tp.y) + (tp.own ? ", " + stateWord(tp) : ""));
  });
  return out.length ? "Ловушки: " + out.slice(0, 6).join("; ") + "." : "";
}
/* Для сканера: всё в радиусе, и чужое сканер находит сам. */
function scanText(rad) {
  var g = G(), out = [];
  list().forEach(function (tp) {
    if (cheb(tp.x, tp.y, g.x, g.y) > rad || tp.st === "gone") return;
    tp.known = 1;
    out.push(nameOf(tp) + " " + rel(tp.x, tp.y));
  });
  return out.length ? "Ловушки и мины: " + out.join(", ") + "." : "";
}
/* (1.7) Ловушка, поставленная сапёром ОКО по приказу. Машины ОКО знают, где
   она, и её не задевают; живых и вас — берёт. Видно её не сразу: вплотную
   «Эхо» слышит её всегда, за шаг — не всегда; сканер находит все. */
var OKO_KINDS = {
  K: ["alarm", "shock", "net", "glue", "jaw", "mine", "spikes"], P: ["alarm", "mine", "jaw", "net", "press", "shock"],
  C: ["resin", "net", "gas", "glue", "shock", "mine"], O: ["mirror", "echo", "glue", "shock", "mine"],
  M: ["gear", "shock", "magnet", "mine", "glue"], I: ["roots", "glue", "shock", "mine"]
};
function okoKinds(L) {
  var pool = OKO_KINDS[eraOf(L)].filter(function (k) { var d = T[k]; return d && d.depth <= Math.max(L, 2) && d.trig !== "remote" && d.trig !== "lure" && d.trig !== "cone"; });
  /* мины и тяжёлое — не с первых уровней */
  if (L <= 3) pool = pool.filter(function (k) { return !T[k].boom; });
  return pool.length ? pool : ["alarm"];
}
function okoTrap(kind, x, y, o) {
  o = o || {};
  var d = T[kind];
  if (!d || !floorOk(x, y) || trapOn(x, y)) return null;
  var tp = { id: nextId(), t: kind, x: x, y: y, own: 0, by: "oko", known: 0, st: "on", uses: d.uses >= 99 ? 99 : 1 };
  if (o.dmg) tp.dmgAbs = o.dmg;
  if (d.trig === "wire") { tp.cells = wireCells(x, y, o.face || "N"); if (tp.cells.some(function (q) { return trapOn(q[0], q[1], tp); })) return null; }
  list().push(tp);
  return tp;
}
function okoCount() { return list().filter(function (tp) { return tp.by === "oko" && tp.st !== "gone"; }).length; }

/* ════════ СТАРЫЕ ЛОВУШКИ ЭТАЖА ════════
   Прежние жители оборонялись: растяжка у баррикады, капкан за дверью
   кабинета, мина в закрытой зоне. Свои — у каждой глубины. Раскладка —
   по этажу, раз и навсегда; какие обезврежены и сработали — помнит этаж. */
var OLD = { K: ["jaw", "alarm", "wire", "spikes", "shock", "mine", "glue"], P: ["press", "jaw", "mine", "alarm", "net"], C: ["resin", "spikes", "net", "gas", "glue"], O: ["mirror", "echo", "glue", "shock"], M: ["gear", "shock", "magnet", "emp"], I: ["roots", "glue", "timeless"] };
function eraOf(L) { return L <= 10 ? "K" : L <= 20 ? "P" : L <= 40 ? "C" : L <= 60 ? "O" : L <= 80 ? "M" : "I"; }
function worldGen() {
  var fs = CUR().fs, fl = CUR().fl, g = G();
  if (fs.trapGen) return;
  fs.trapGen = 1;
  if (LAB.depth(g.L, g.F) < 2) return;
  var r = LAB.Rng(g.seed, "oldtraps:" + g.L + ":" + g.F);
  var pool = OLD[eraOf(g.L)].filter(function (k) { return T[k] && T[k].depth <= g.L; });
  if (!pool.length) return;
  var max = g.L <= 10 ? 2 : 3, n = 0, used = {};
  var bad = function (x, y) {
    if (!floorOk(x, y) || trapOn(x, y)) return true;
    for (var i = 0; i < fl.objs.length; i++) { var o = fl.objs[i]; if (/^(stairs_down|stairs_up|elevator|gate|gate_sealed|capsule|wake|workbench|supply)$/.test(o.type) && cheb(o.x, o.y, x, y) <= 2) return true; }
    return false;
  };
  var put = function (x, y, kind) {
    if (n >= max || bad(x, y)) return;
    var d = T[kind], tp = { id: nextId(), t: kind, x: x, y: y, own: 0, by: "old", known: 0, st: "on", uses: 1 };
    if (d.trig === "wire") { tp.cells = wireCells(x, y, "N"); if (tp.cells.some(function (q) { return trapOn(q[0], q[1]); })) return; }
    if (d.trig === "cone" || d.trig === "remote" || d.trig === "lure") return;
    list().push(tp); n++;
  };
  fl.rooms.forEach(function (rm) {
    if (n >= max || !rm || used[rm.id]) return;
    var p = rm.state === "barricade" ? 0.75 : rm.state === "hurry" || rm.state === "ransacked" ? 0.18 : rm.type === "secret" ? 0.3 : 0;
    if (!p || !r.chance(p)) return;
    used[rm.id] = 1;
    /* у двери изнутри — там, где ждали гостей */
    var dr = null;
    (rm.doors || []).forEach(function (did) { var dd = fl.doors[parseInt(did.slice(1), 10)]; if (dd && dd.room === rm.id && !dr) dr = dd; });
    var cx, cy;
    if (dr) { var s = dr.x > rm.x1 ? [-1, 0] : dr.x < rm.x0 ? [1, 0] : dr.y > rm.y1 ? [0, -1] : [0, 1]; cx = dr.x + s[0]; cy = dr.y + s[1]; }
    else { cx = r.int(rm.x0, rm.x1); cy = r.int(rm.y0, rm.y1); }
    put(cx, cy, r.pick(pool));
  });
}
function enterFloor() {
  zones = []; pending = []; warned = {};
  if (!CUR() || !CUR().fs) return;
  list().forEach(function (tp) { if (tp.st === "held") { tp.held = null; tp.st = D(tp) && D(tp).rearm ? "sprung" : "on"; } });
  LAB.safe(worldGen);
}

/* (1.7) Огонь и газ на месте падения гранаты — те же зоны, что у ловушек. */
function addZone(k, x, y, r, t, d, own) { zones.push({ k: k, x: x, y: y, r: r || 1, t: t || 10, d: d || 8, own: own == null ? 1 : own }); }
LAB.traps = {
  quick: quick, isMine: isMine, addZone: addZone,
  menu: menu, place: place, pickUp: pickUp, detonate: detonate, disarm: disarm, rearm: rearm,
  foeStep: foeStep, playerStep: playerStep, tick: tick, avoid: avoid, knownAt: knownAt,
  adjacent: adjacent, targetName: targetName, trapMenu: trapMenu, lookList: lookList, scanText: scanText,
  okoTrap: okoTrap, okoKinds: okoKinds, okoCount: okoCount, at: function (x, y) { return trapOn(x, y); }, enterFloor: enterFloor, count: count, list: function () { return list(); },
  nameOf: nameOf, stateWord: stateWord, effLine: effLine, ids: ORDER, T: T,
  use: function (id) { var k = LAB.ITEMS[id] && LAB.ITEMS[id].trap; if (k) itemMenu(k); return false; },
  _fire: fire, _zones: function () { return zones; }, _worldGen: worldGen
};
})();
