/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — облики ОКО (3.2, просьба игрока).
   Чем глубже, тем меньше ОКО похоже на систему безопасности «Ковчега»,
   и меняется оно постепенно — от уровня к уровню (t — сколько пройдено
   в блоке, от 0 до 1). Тексты реплик уже говорят разными голосами по
   блокам (oko_lines_a/b, разделы oko в b1–b5); здесь — как этот голос
   звучит и что ОКО делает иначе:
   • «Ковчег» (1–10) — ОКО по громкой связи, прежний сигнал.
   • «Подножие» (11–20) — голос уходит под землю: «ОКО издалека», затем
     «из-под земли»; сигнал глуше и ниже, сквозь треск старых динамиков
     «Око-0», и чем ближе Звучащий слой, тем глуше.
   • «Колыбель» (21–40) — Садовник, садовая часть ОКО: сигнал — два тихих
     колокола; сигнал ОКО здесь тонет, и колокола всё тише.
   • «Отражение» (41–60) — ОКО двоится. Настоящее далеко: сигнал глухой,
     с отзвуком, а слова доходят с опозданием — чем глубже, тем позже.
     Рядом — Зрачок, его отражение: сигнал вплотную, зеркальный (слева,
     потом справа), слова сразу. Зрачок хочет занять место ОКО и лжёт —
     объявляет отряды, которых нет; чем глубже, тем чаще. Настоящее ОКО
     иногда поправляет его издалека; о настоящих машинах «Эхо» скажет,
     кто вышел и откуда, а в журнале безопасности — только правда.
   • «Механизм» (61–80) — ОКО — город, и у города несколько разумов:
     Сторож (тревоги, отряды, турели — низкий удар), Садовник (капсулы,
     раны, отдых — колокол), с 66-го — Счетовод (кредиты, торг — счёты;
     у терминала безопасности он продаёт передышку и забытое подозрение),
     с 70-го — Сказочник (тишина, записки, музыка — шкатулка). С 79-го
     голоса сходятся в один: ОКО целиком.
   • «Исток» (81–100) — ОКО слабеет и становится союзником: шёпотом,
     прямо в ухо, без громкой связи и сигнала. Машины его больше не
     слушают; о тех, что идут к вам из-за стены, оно предупреждает. Чем
     глубже, тем реже и тише, а на краю, простившись, молчит.
   Каждую перемену «Эхо» объясняет один раз — при входе на уровень.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function G() { return LAB.game && LAB.game.G; }
function CUR() { return LAB.game && LAB.game.CUR; }
function C() { return LAB.combat; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function okoSt() { return LAB.oko && LAB.oko.state ? LAB.oko.state() : {}; }

/* ── ОБЛИК ПО ГЛУБИНЕ ── */
var IDS = ["oko", "far", "garden", "twin", "city", "whisper"];
function blockN(L) { return L <= 10 ? 0 : LAB.blockOf(L); }
function first(b) { return b === 0 ? 1 : b === 1 ? 11 : (b - 1) * 20 + 1; }
function span(b) { return b <= 1 ? 10 : 20; }
function form(L, F) {
  L = L || 1; F = F || 1;
  var b = blockN(L), t = (L - first(b) + (F - 1) / 20) / span(b);
  return { id: IDS[b], b: b, t: Math.max(0, Math.min(1, t)), L: L, F: F };
}
function cur() { var g = G(); return form(g ? g.L : 1, g ? g.F : 1); }

/* Разумы города (Механизм): кто отвечает за реплику какого вида. */
var MIND_OF = {
  buy: "count", sell: "count", craft: "count", safe: "count", pick: "count", vault: "count", kill_many: "count", kill: "count",
  heal: "garden", eat: "garden", drink: "garden", rest: "garden", capsule: "garden", bind: "garden", revive: "garden",
  mutate: "garden", survivor: "garden", zone: "garden", hurt: "garden", low_hp: "garden",
  quiet: "tale", idle: "tale", note: "tale", mail: "tale", music: "tale", puzzle_ok: "tale", puzzle_fail: "tale",
  secret: "tale", floor: "tale", taunt: "tale", weapon: "tale", implant: "tale"
};
function minds(L) {
  if (L < 61 || L >= 79) return [];
  var m = ["guard", "garden"];
  if (L >= 66) m.push("count");
  if (L >= 70) m.push("tale");
  return m;
}
function mind(kind, L) {
  var ms = minds(L);
  if (!ms.length) return null;
  var m = MIND_OF[kind] || "guard";
  if (ms.indexOf(m) < 0) m = m === "count" ? "guard" : "garden";
  return m;
}

/* Как звучит реплика: вводные слова, сигнал (atmos.okoChime) и через
   сколько миллисекунд после сигнала идут слова. who: "pupil" — Зрачок,
   "count" — Счетовод сам от себя (торг). */
function frame(kind, who) {
  var f = cur();
  if (who === "count") return { lead: "Счетовод ОКО", chime: "m_count", gap: 650, t: f.t };
  switch (f.id) {
    case "far": return { lead: f.t < 0.5 ? "ОКО издалека" : "ОКО из-под земли", chime: "far", gap: 600 + Math.round(400 * f.t), t: f.t };
    case "garden": return { lead: "Садовник ОКО", chime: "garden", gap: 650, t: f.t };
    case "twin":
      if (who === "pupil") return { lead: "Зрачок, вплотную", chime: "pupil", gap: 180, t: f.t };
      /* слова настоящего ОКО доходят поздно: «если слова приходят быстро, это не я» */
      return { lead: "ОКО издалека", chime: "far3", gap: 1100 + Math.round(1300 * f.t), t: f.t };
    case "city":
      var m = mind(kind, f.L);
      return { lead: m ? "ОКО, голосом города" : "ОКО, одним голосом", chime: m ? "m_" + m : "whole", gap: 500, t: f.t, mind: m };
    case "whisper": return { lead: "ОКО, шёпотом, прямо в ухо", chime: null, gap: 0, t: f.t, soft: true };
  }
  return { lead: "ОКО по громкой связи", chime: "oko", gap: 450, t: f.t };
}
/* Как часто ОКО заговаривает само: в Истоке — всё реже. */
function chatty() { var f = cur(); return f.id === "whisper" ? 1 - 0.75 * f.t : 1; }
/* На краю Истока, простившись, ОКО молчит. */
function silent() { var g = G(); return !!g && (g.L >= 100 || (g.L === 99 && g.F >= 20)); }
/* Звуки сигналов этой глубины — грузятся с уровнем (atmos.idsFor). */
var SND = {
  far: ["oko_chime", "radio"], garden: ["ins_bell_72", "ins_bell_77"], twin: ["oko_chime", "ev_glass"],
  city: ["oko_chime", "pc_click", "ins_bell_67", "ins_lullaby_86", "ins_lullaby_93", "ins_lullaby_98"], whisper: [], oko: ["oko_chime"]
};
function sounds(L) { return (SND[form(L, 1).id] || []).slice(); }

/* ── ЗРАЧОК: ЛОЖНЫЕ ОБЪЯВЛЕНИЯ (Отражение) ── */
var DIRS = ["слева", "справа", "впереди", "за спиной"];
var FAKE = [
  "Говорит ОКО. Отряд на ваш след — {dir}. Уже {dir}, уже рядом.",
  "Высылаю проверку. Проверка {dir}. Проверка, проверка.",
  "Новый патруль {dir}, носитель. Не стойте. Стойте. Не стойте.",
  "Тревога, носитель. Это я, настоящее. Идут {dir}, их много. Много. Много.",
  "Внимание: машины {dir}. — Машины, машины, — повторяет он сам за собой.",
  "Сапёр вышел {dir}. Там мины. И там, где вы стоите, тоже.",
  "Отряд, отряд на ваш след. Я сам его послал. Я — ОКО. — Я — ОКО, — повторяет он.",
  "Охрана {dir}. Не оборачивайтесь, носитель. Обернитесь."
];
var CORRECT = [
  "Это был не я, носитель. Там никого нет.",
  "Не верьте ему. Я никого не посылал.",
  "Он говорит быстро — значит, это он. Там пусто.",
  "Это Зрачок. Мои машины не там. Слушайте, откуда приходят шаги, а не слова.",
  "Мои слова доходят поздно, его — сразу. Это был он."
];
/* Направление, где сейчас никого нет: ложь Зрачка правдоподобна, но пуста.
   Стороны — как везде в игре, относительно экрана (LAB.DIRN), а не взгляда. */
function emptyDir() {
  var g = G(), cb = C(), busy = {};
  (cb && cb.foes ? cb.foes() : []).forEach(function (q) {
    if (q.dead || Math.max(Math.abs(q.x - g.x), Math.abs(q.y - g.y)) > 14) return;
    var fwd = g.y - q.y, side = q.x - g.x;
    busy[Math.abs(fwd) >= Math.abs(side) ? (fwd >= 0 ? "впереди" : "за спиной") : (side > 0 ? "справа" : "слева")] = 1;
  });
  var free = DIRS.filter(function (d) { return !busy[d]; });
  return pick(free.length ? free : DIRS);
}
function fakeChance(t) { return 0.15 + 0.35 * t; }
function pupilFake() {
  var g = G(), f = cur();
  if (!g || g.dead || f.id !== "twin" || silent()) return false;
  if (LAB.oko && LAB.oko.hushed && LAB.oko.hushed()) return false;
  var dir = emptyDir(), t = pick(FAKE).replace(/\{dir\}/g, dir);
  var fr = frame("squad", "pupil");
  if (LAB.oko && LAB.oko.voice) LAB.oko.voice(fr.lead + ": «" + t + "»", { prio: "event", keep: true, okoKind: "pupil" }, fr.chime, fr.gap);
  var o = okoSt(); o.pupilN = (o.pupilN || 0) + 1;
  /* настоящее ОКО поправляет издалека — тем реже, чем глубже */
  if (Math.random() < 0.6 - 0.35 * f.t) {
    var L0 = g.L, F0 = g.F;
    setTimeout(function () {
      var g2 = G();
      if (!LAB.game.entered || !g2 || g2.dead || g2.L !== L0 || g2.F !== F0) return;
      var fr2 = frame("check");
      if (LAB.oko && LAB.oko.voice) LAB.oko.voice(fr2.lead + ": «" + fem(pick(CORRECT)) + "»", { prio: "event", keep: true, okoKind: "correct" }, fr2.chime, fr2.gap);
    }, 6000 + Math.round(Math.random() * 4000));
  }
  return true;
}
/* Настоящие машины вышли (oko.js, sendWave): Зрачок может тут же солгать о
   других — тех, что якобы идут с пустой стороны. */
function dispatched(got) {
  var f = cur();
  if (f.id !== "twin" || !got || !got.length) return;
  if (Math.random() >= fakeChance(f.t)) return;
  var L0 = G().L, F0 = G().F;
  setTimeout(function () { var g = G(); if (LAB.game.entered && g && g.L === L0 && g.F === F0) pupilFake(); }, 3000 + Math.round(Math.random() * 5000));
}

/* ── СЧЕТОВОД: ТОРГ У ТЕРМИНАЛА (Механизм, 66–78) ── */
function dealsOpen() { var f = cur(); return f.id === "city" && minds(f.L).indexOf("count") >= 0; }
function price(kind) {
  var g = G(), fs = CUR().fs, dk = LAB.dk ? LAB.dk() : {}, n = kind === "rest" ? (fs.dealRest || 0) : (fs.dealHeat || 0);
  var base = kind === "rest" ? 40 + (g.L - 61) * 4 : 60 + (g.L - 61) * 5;
  return Math.round(base * (dk.price || 1) * Math.pow(1.6, n));
}
/* Слова Счетовода в сделке — одним списком (их озвучивает и конвейер голоса ОКО, tools/okovoice). */
var DEAL = {
  rest: ["Сделка. Сторож подождёт три минуты — и ни секундой больше. Счёт закрыт.", "Оплачено. Три минуты тишины записаны на твоё имя. Сторож ворчит, но подписал.", "Договорились. Сторож отходит на три минуты. Время — тоже товар, и ты его купил."],
  heat: ["Списано. Четверть того, что я о тебе думал, — в архив. Остальное оставлю себе.", "Готово: я забыл. Не всё, конечно. Забыть всё стоит дороже, чем у тебя есть."],
  no: ["Как знаешь. Цены растут быстрее тебя.", "Без сделки так без сделки. Я записал и это."],
  poor: "Мало. Забвение дорогое — дороже памяти."
};
function countSay(t) {
  var fr = frame("buy", "count");
  if (LAB.oko && LAB.oko.voice) LAB.oko.voice(fr.lead + ": «" + fem(t) + "»", { prio: "event", keep: true, okoKind: "deal" }, fr.chime, fr.gap);
}
/* (голос ОКО) женский голос ОКО говорит о себе в женском роде (oko_fem.js) */
function fem(t) { return LAB.okoVoice ? LAB.okoVoice.fem(t) : t; }
function dealMenu() {
  var g = G(), fs = CUR().fs;
  if (!dealsOpen()) { LAB.say("Счетовод молчит: торговаться здесь не с кем."); return; }
  var items = [];
  var pr = price("rest"), ph = price("heat");
  if ((fs.dealRest || 0) < 2) items.push({ label: "Передышка: Сторож подождёт три минуты — " + pr + " кредитов", fn: function () {
    if ((g.credits || 0) < pr) { if (LAB.UI) LAB.UI.error(); countSay("Не хватает " + (pr - (g.credits || 0)) + ". Я считаю точно — и ты считай."); return; }
    g.credits -= pr; fs.dealRest = (fs.dealRest || 0) + 1;
    var T = LAB.oko && LAB.oko.T ? LAB.oko.T() : 0;
    fs.wReady = Math.max(fs.wReady || 0, T) + 360; /* такты по полсекунды: три минуты */
    if (LAB.oko && LAB.oko.log) LAB.oko.log("Счетовод: выход единиц отложен по договору.");
    A("play", "vend_coin");
    countSay(pick(DEAL.rest));
    if (LAB.ui && LAB.ui.closeAll) LAB.ui.closeAll();
  } });
  if (!fs.dealHeat) items.push({ label: "Забыть подозрение: ОКО забудет четверть — " + ph + " кредитов", fn: function () {
    if ((g.credits || 0) < ph) { if (LAB.UI) LAB.UI.error(); countSay(DEAL.poor); return; }
    g.credits -= ph; fs.dealHeat = 1;
    var o = okoSt(); o.heat = Math.max(0, (o.heat || 0) - 25);
    if (LAB.oko && LAB.oko.log) LAB.oko.log("Счетовод: часть подозрений списана.");
    A("play", "vend_coin");
    countSay(pick(DEAL.heat));
    if (LAB.ui && LAB.ui.closeAll) LAB.ui.closeAll();
  } });
  items.push({ label: "Отказаться", fn: function () { countSay(pick(DEAL.no)); if (LAB.ui && LAB.ui.closeTop) LAB.ui.closeTop(); } });
  if (LAB.ui && LAB.ui.menu) LAB.ui.menu("Сделка со Счетоводом", items, { intro: "Счетовод ОКО торгуется: кредиты — за время или за забытое подозрение. На этом этаже передышку можно купить дважды, забвение — один раз." });
}
/* Волна встала в очередь — Счетовод напоминает, что время продаётся. */
function offerDeal() {
  var fs = CUR().fs, o = okoSt();
  if (!dealsOpen() || fs.dealOffered || silent()) return;
  if (Date.now() - (o.dealSaid || 0) < 240000) return;
  fs.dealOffered = 1; o.dealSaid = Date.now();
  countSay("Волна в очереди. Хочешь передышки — договоримся у терминала безопасности. Три минуты — " + price("rest") + " кредитов.");
}

/* ── ИСТОК: ОКО ПРЕДУПРЕЖДАЕТ ШЁПОТОМ ── */
/* (3.7, нелогичность) о машине — что она больше не слушает ОКО, о твари — что живое ОКО никогда и не
   держало; без «она» и «моя»: имя бывает любого рода (прежде — «Она меня не слушает» о любом враге) */
var WARN = {
  mech: [
    "{dir} — {name}. Эта машина уже не моя. Осторожно.",
    "Идёт к вам: {name}, {dir}. Эту машину я больше не держу.",
    "Тише. {name} — {dir}. Слышите? Я слышу.",
    "{name}, {dir}. Моих приказов эта машина не слушает. Ваших — тем более."
  ],
  bio: [
    "{dir} — {name}. Живое здесь не моё. Осторожно.",
    "Идёт к вам: {name}, {dir}. Над живым у меня власти нет и не было.",
    "Тише. {name} — {dir}. Слышите? Я слышу.",
    "{name}, {dir}. Живое меня никогда не слушало. Вас — тем более."
  ]
};
var lastWarn = 0;
function warnTick() {
  var f = cur(), g = G(), cb = C(), fl = CUR() && CUR().fl;
  if (f.id !== "whisper" || silent() || !cb || !fl || g.dead) return;
  var now = Date.now();
  if (now - lastWarn < (60 + 120 * f.t) * 1000) return;
  var near = null;
  cb.foes().forEach(function (q) {
    if (near || q.dead || q.ally || q.calm || q.neutral || q.disguised || q.state !== "hunt") return;
    if ((q.beh || []).indexOf("camera") >= 0 || (q.beh || []).indexOf("stationary") >= 0) return;
    var d = Math.max(Math.abs(q.x - g.x), Math.abs(q.y - g.y));
    if (d < 3 || d > 9) return;
    var seen = true;
    try { seen = LAB.los(fl, CUR().fs, g.x, g.y, q.x, q.y); } catch (e) { seen = true; }
    if (!seen) near = q;
  });
  if (!near) return;
  lastWarn = now;
  if (Math.random() > 0.85 - 0.6 * f.t) return;
  var nm = String(near.name || "машина").split(",")[0];
  var t = pick(WARN[near.kind === "mech" ? "mech" : "bio"]).replace(/\{dir\}/g, LAB.game.relDir(near.x, near.y)).replace(/\{name\}/g, nm);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  var fr = frame("check");
  if (LAB.oko && LAB.oko.voice) LAB.oko.voice(fr.lead + ": «" + t + "»", { prio: "urgent", keep: true }, null, 0);
}

/* ── ТАКТ: Зрачок лжёт и сам по себе, когда вокруг тихо; Исток — шёпот ── */
var nextFake = 0;
function tick() {
  var f = cur(), now = Date.now();
  if (f.id === "twin") {
    if (!nextFake) nextFake = now + (240 - 120 * f.t) * 1000;
    if (now >= nextFake) {
      nextFake = now + (240 - 120 * f.t + Math.random() * 120) * 1000;
      if (!(C() && C().danger && C().danger()) && Math.random() < 0.5 + 0.4 * f.t) pupilFake();
    }
  } else nextFake = 0;
  warnTick();
}

/* ── ПЕРЕМЕНЫ — «Эхо» объясняет один раз ── */
var STAGES = [
  { key: "far", g: "«Подножие»: голос ОКО уходит под землю — сначала «издалека», потом «из-под земли»; сигнал всё глуше и ниже, сквозь треск старых динамиков «Око-0».", at: function (L) { return L >= 11; }, t: "«Эхо»: голос ОКО ушёл под землю — глуше, дальше и сквозь треск старых динамиков «Око-0». Это всё ещё ОКО, но слышно его хуже, и чем ниже, тем глуше." },
  { key: "garden", g: "«Колыбель»: говорит Садовник, садовая часть ОКО; сигнал — два тихих колокола, и чем глубже, тем тише: сигнал ОКО здесь тонет.", at: function (L) { return L >= 21; }, t: "«Эхо»: сигнал ОКО здесь тонет. Говорит Садовник — садовая часть ОКО; его сигнал — два тихих колокола." },
  { key: "twin", g: "«Отражение»: ОКО двоится. Настоящее — «ОКО издалека»: сигнал глухой, с отзвуком, слова приходят с опозданием, и чем глубже, тем позже. «Зрачок, вплотную» — его отражение: сигнал зеркальный, слева и справа, слова сразу. Зрачок объявляет отряды, которых нет, — чем глубже, тем чаще; настоящее ОКО иногда поправляет его издалека. Когда машины выходят на самом деле, «Эхо» называет, кто и откуда, а в журнале безопасности терминала — только настоящий выход.", at: function (L) { return L >= 41; }, t: "«Эхо»: голос ОКО двоится. Настоящее ОКО — далеко: сигнал глухой, с отзвуком, а слова приходят с опозданием. Рядом — Зрачок, его отражение: сигнал вплотную и зеркальный, слева и справа, слова сразу. Зрачок лжёт — объявляет отряды, которых нет. Когда машины выходят на самом деле, я называю, кто и откуда; а в журнале безопасности — только правда." },
  { key: "city", g: "«Механизм»: ОКО говорит голосом города, и разумов у него несколько: Сторож — тревоги и отряды, сигнал — низкий удар; Садовник — раны, отдых и капсулы, сигнал — колокол.", at: function (L) { return L >= 61; }, t: "«Эхо»: ОКО здесь — целый город, и разумов у него несколько. Сторож — тревоги и отряды, его сигнал — низкий удар; Садовник — раны, отдых и капсулы, сигнал — колокол. Глубже заговорят и другие." },
  { key: "count", g: "С 66-го уровня — Счетовод: сигнал щёлкает, как счёты. У терминала безопасности он продаёт передышку — Сторож три минуты не шлёт волну, дважды за этаж, — и забытое подозрение, раз за этаж; цена растёт с глубиной.", at: function (L) { return L >= 66; }, t: "«Эхо»: заговорил Счетовод — его сигнал щёлкает, как счёты. Он торгуется: у терминала безопасности можно купить передышку от волн или забытое подозрение." },
  { key: "tale", g: "С 70-го — Сказочник: сигнал музыкальной шкатулки; он говорит, когда вокруг тихо.", at: function (L) { return L >= 70; }, t: "«Эхо»: Сказочник — сигнал музыкальной шкатулки. Он говорит, когда вокруг тихо, и рассказывает истории ОКО." },
  { key: "whole", g: "С 79-го голоса сходятся в один — «ОКО, одним голосом»: сигнал ниже и шире.", at: function (L) { return L >= 79; }, t: "«Эхо»: голоса ОКО сходятся в один. Теперь говорит ОКО целиком — его сигнал ниже и шире." },
  { key: "whisper", g: "«Исток»: ОКО — «шёпотом, прямо в ухо», без громкой связи и сигнала. Машины его больше не слушают; о тех, что идут к вам из-за стены, оно предупреждает. Чем глубже, тем реже и тише.", at: function (L) { return L >= 81; }, t: "«Эхо»: ОКО больше не говорит по громкой связи — шёпотом, прямо в ухо, без сигнала. Машины его больше не слушают; о тех, что идут к вам из-за стены, оно предупреждает. Чем глубже, тем тише." }
];
function stageOf(L) { var s = null; STAGES.forEach(function (q) { if (q.at(L)) s = q; }); return s; }
/* Вход на новый уровень (oko.js, event "enter"): после приветствия ОКО —
   слово «Эхо» о новом облике, если он сменился. */
/* (3.5) отметка «сказано» ставится, когда фраза прозвучала: погибли, вышли или
   загрузили другую запись за эти секунды — «Эхо» скажет при следующем входе */
function later(fn, ms) { return LAB.game.later ? LAB.game.later(fn, ms) : setTimeout(function () { if (LAB.game.entered) fn(); }, ms); }
function entered() {
  var g = G(), o = okoSt(), s = stageOf(g.L);
  if (!s || o.formSaid === s.key) return;
  var L0 = g.L;
  later(function () {
    var g2 = G(), o2 = okoSt();
    if (!g2 || g2.dead || g2.L !== L0 || o2.formSaid === s.key) return;
    o2.formSaid = s.key;
    LAB.say(s.t, { prio: "event", keep: true });
    if (LAB.game.journal) LAB.game.journal("Облик ОКО: " + s.t.replace(/^«Эхо»: /, ""));
  }, 11000);
}
/* Прощание на краю Истока — один раз, на двадцатом этаже предпоследнего уровня. */
function floorIn() {
  var g = G(), o = okoSt();
  if (!g || g.L !== 99 || g.F < 20 || o.farewell) return;
  later(function () {
    var g2 = G(), o2 = okoSt();
    if (!g2 || g2.dead || g2.L !== 99 || g2.F < 20 || o2.farewell) return;
    o2.farewell = 1;
    LAB.say("ОКО, шёпотом, прямо в ухо: «Дальше я не пойду, носитель. Слушайте сами — вы умеете лучше меня. Я берёг росток. Теперь — вы. Прощайте.»", { prio: "event", keep: true });
    later(function () { if (!G().dead) LAB.say("«Эхо»: ОКО замолчало. Кажется, насовсем.", { prio: "event", keep: true }); }, 9000);
    if (LAB.game.journal) LAB.game.journal("ОКО простилось и замолчало.");
  }, 6000);
}
/* Для руководства: облики ОКО тех глубин, куда игрок уже дошёл. */
function guideLines(maxL) {
  var out = ["Чем глубже, тем меньше ОКО похоже на систему безопасности «Ковчега»: голос, сигнал и повадки меняются постепенно, от уровня к уровню, и при каждой перемене «Эхо» объясняет, что изменилось."];
  STAGES.forEach(function (s) { if (s.at(maxL)) out.push(s.g); });
  return out;
}

LAB.okoForms = {
  cur: cur, frame: frame, chatty: chatty, silent: silent, sounds: sounds,
  dispatched: dispatched, pupilFake: pupilFake, dealsOpen: dealsOpen, dealMenu: dealMenu, price: price, offerDeal: offerDeal,
  tick: tick, warnTick: warnTick, entered: entered, floorIn: floorIn, guideLines: guideLines,
  /* тексты для конвейера голоса ОКО (tools/okovoice) */
  TEXTS: { FAKE: FAKE, CORRECT: CORRECT, DEAL: DEAL, DIRS: DIRS },
  _reset: function () { nextFake = 0; lastWarn = 0; }
};
})();
