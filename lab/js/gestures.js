/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — таблица жестов (после 4.6).
   Каждый жест в игре делает своё действие, и игрок назначает их сам:
   «Настройки» → «Управление» → «Жесты» → жест → действие из списка.
   Распознаёт жесты input.js (свайпы одним–четырьмя пальцами, свайп
   с удержанием, касания, двойные и тройные, касания с удержанием,
   зигзаги); здесь — что каждый жест делает, меню переназначения и
   слова для подсказок (LAB.gw): подсказки называют жест, на котором
   действие стоит сейчас.
   В окнах жесты прежние и не переназначаются: там они листают пункты,
   и, отдав их другому, можно отнять у себя дорогу назад в настройки.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function S() { return LAB.settings || {}; }
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function say(t, o) { LAB.say(t, o); }
function ui() { return LAB.ui; }
var SCR2GAME = { U: "N", D: "S", L: "W", R: "E" };
var DIRW = { U: "вверх", D: "вниз", L: "влево", R: "вправо" };
var BACKW = { U: "вниз", D: "вверх", L: "вправо", R: "влево" };
var FING = ["", "одним пальцем", "двумя пальцами", "тремя пальцами", "четырьмя пальцами"];
var FGROUP = ["", "Один палец", "Два пальца", "Три пальца", "Четыре пальца"];
var DIRS4 = ["U", "D", "L", "R"];

/* ── ЖЕСТЫ ── порядок — как в меню: свайпы, свайпы с удержанием, касания,
   касания с удержанием, составные (зигзаги одним пальцем) в конце. */
var LIST = [], BY = {};
function add(id, n, name, type, dir) { var g = { id: id, n: n, name: name, type: type, dir: dir || null }; LIST.push(g); BY[id] = g; }
DIRS4.forEach(function (d) { add("s1" + d, 1, "Провести пальцем " + DIRW[d], "swipe", d); });
DIRS4.forEach(function (d) { add("w1" + d, 1, "Провести пальцем " + DIRW[d] + " с удержанием", "hswipe", d); });
add("t1", 1, "Касание одним пальцем", "tap");
add("d1", 1, "Двойное касание одним пальцем", "tap");
add("p1", 1, "Долгое касание одним пальцем", "tap");
["L", "R", "U", "D"].forEach(function (d) { add("z1" + d, 1, "Провести пальцем " + DIRW[d] + ", затем " + BACKW[d], "zig", d); });
[2, 3, 4].forEach(function (n) {
  var f = FING[n];
  DIRS4.forEach(function (d) { add("s" + n + d, n, "Провести " + f + " " + DIRW[d], "swipe", d); });
  add("t" + n, n, "Касание " + f, "tap");
  add("d" + n, n, "Двойное касание " + f, "tap");
  add("r" + n, n, "Тройное касание " + f, "tap");
  add("p" + n, n, "Касание " + f + " с удержанием", "tap");
  add("dp" + n, n, "Двойное касание " + f + " с удержанием", "tap");
  add("rp" + n, n, "Тройное касание " + f + " с удержанием", "tap");
});

/* ── ДЕЙСТВИЯ ── dir: только для свайпов (берут сторону жеста); hold: только для
   свайпа с удержанием (длятся, пока палец на экране). Прочие — на любой жест. */
function need(fn) { return function (g) { if (!gm().entered) return; fn(g); }; }
function cmb() { return LAB.combat; }
function drawnSay() { LAB.UI.error(); say("Оружие убрано. Достать — " + word("draw", "касание тремя пальцами") + "."); }
var ACT = {}, ORDER = [];
function act(id, grp, n, fn, o) { var a = { id: id, grp: grp, n: n, fn: fn }; if (o) for (var k in o) a[k] = o[k]; ACT[id] = a; ORDER.push(id); }
/* Ходьба и бой */
act("auto", 0, "Шаг или выстрел в сторону жеста: с оружием в руках — выстрел", function (g) { var d = SCR2GAME[g.dir]; if (!d) return; if (G().drawn) cmb().fire(d, false); else gm().tryMove(d, false); }, { dir: 1 });
act("step", 0, "Шаг в сторону жеста, и с оружием в руках", function (g) { var d = SCR2GAME[g.dir]; if (d) gm().tryMove(d, false); }, { dir: 1 });
act("shoot", 0, "Выстрел в сторону жеста", function (g) { var d = SCR2GAME[g.dir]; if (!d) return; if (!G().drawn) { drawnSay(); return; } cmb().fire(d, false); }, { dir: 1 });
act("autoHold", 0, "Идти, пока держите палец; с оружием в руках — очередь", null, { hold: 1 });
act("walk", 0, "Идти, пока держите палец, и с оружием в руках", null, { hold: 1 });
act("burst", 0, "Очередь в сторону жеста, пока держите палец", null, { hold: 1 });
act("draw", 0, "Достать или убрать оружие", need(function () { gm().toggleDraw(); }));
act("reload", 0, "Перезарядить", need(function () { gm().reload(); }));
act("nextW", 0, "Следующее оружие", need(function () { gm().switchWeapon(1); }));
act("prevW", 0, "Предыдущее оружие", need(function () { gm().switchWeapon(-1); }));
act("throw", 0, "Бросить гранату", need(function () { if (cmb() && cmb().throwQuick) cmb().throwQuick(); }));
act("pickGren", 0, "Выбрать гранату", need(function () { if (cmb() && cmb().pickGrenade) cmb().pickGrenade(false); }));
act("trap", 0, "Ловушка под ноги", need(function () { if (LAB.traps && LAB.traps.quick) LAB.traps.quick("trap"); }));
act("mine", 0, "Мина под ноги", need(function () { if (LAB.traps && LAB.traps.quick) LAB.traps.quick("mine"); }));
act("traps", 0, "Ловушки и мины: поставить, снять", need(function () { if (LAB.traps) LAB.traps.menu(); }));
act("medkit", 0, "Аптечка: «Эхо» само выберет, чем лечить", need(function () { gm().useMedkit(); }));
act("drone", 0, "Команды дрону и каркасу", need(function () { if (LAB.drone) LAB.drone.quick(); }));
act("interact", 0, "Действие у двери, терминала, установки, ящика, выжившего", need(function () { gm().interact(); }));
act("eat", 0, "Поесть", need(function () { gm().eatBest(); }));
/* Сведения */
act("nearby", 1, "Что рядом", need(function () { gm().nearbyInfo(); }));
act("look", 1, "Осмотреться", need(function () { gm().lookAround(); }));
act("scan", 1, "Сканер; без сканера — осмотреться", need(function () { if (G().implants.indexOf("scan") >= 0) cmb().useImplant("scan"); else gm().lookAround(); }));
act("nav", 1, "Навигатор: путь к цели, ещё раз — следующая цель", need(function () { gm().navigate(true); }));
act("navMenu", 1, "Список целей навигатора", need(function () { if (gm().navMenu) gm().navMenu(); else gm().navigate(true); }));
act("where", 1, "Где вы и который час", need(function () { whereAmI(); }));
act("status", 1, "Здоровье и заряд", need(function () { gm().quickStatus(); }));
act("body", 1, "Здоровье и всё тело", need(function () { gm().bodyStatus(); }));
act("credits", 1, "Кредиты", need(function () { gm().creditsStatus(); }));
act("load", 1, "Груз: сколько несёте и сколько можете", need(function () { if (LAB.load) LAB.load.status(); else say("Груз не считается."); }));
act("histBack", 1, "Прошлые объявления ОКО", function () { LAB.history.show(-1); });
act("histFwd", 1, "Следующие объявления ОКО", function () { LAB.history.show(1); });
act("repeat", 1, "Повторить последнюю фразу", function () { if (LAB.input && LAB.input.repeat) LAB.input.repeat(); });
act("hush", 1, "Тишина: прервать речь", function () { LAB.Speech.hush(); LAB.vib(20); });
/* Окна */
act("char", 2, "Персонаж", need(function () { ui().character(); }));
act("inv", 2, "Инвентарь", need(function () { ui().inventory(); }));
act("stats", 2, "Характеристики: сила, ловкость, телосложение, интеллект, харизма", need(function () { if (LAB.stats) LAB.stats.menu(); else ui().character(); }));
act("quests", 2, "Задания и журнал", need(function () { if (ui().quests) ui().quests(); else ui().inventory("Задания"); }));
act("implants", 2, "Импланты", need(function () { ui().implants(); }));
act("gestList", 2, "Жесты: что на каком жесте", function () { gesturesMenu(); });
act("save", 2, "Сохранить игру", need(function () { ui().saveMenu(); }));
act("settings", 2, "Настройки", function () { ui().settings(); });
act("guide", 2, "Руководство", function () { if (LAB.guide) LAB.guide.open(); });
act("none", 3, "Ничего: жест свободен", function () {});
var GRP = ["Ходьба и бой", "Сведения", "Окна", "Ничего"];

/* ── КАК ЗАДАНО ИЗНАЧАЛЬНО ── прежние жесты — на прежних местах;
   новые (тройные касания, касания с удержанием, двойное касание тремя
   пальцами) получили то, что раньше было только на клавиатуре и в окнах. */
var DEF = {
  s1U: "auto", s1D: "auto", s1L: "auto", s1R: "auto",
  w1U: "autoHold", w1D: "autoHold", w1L: "autoHold", w1R: "autoHold",
  t1: "nearby", d1: "interact", p1: "repeat",
  z1L: "throw", z1R: "pickGren", z1U: "trap", z1D: "mine",
  s2U: "look", s2D: "scan", s2L: "medkit", s2R: "nav",
  t2: "reload", d2: "nextW", r2: "prevW", p2: "drone", dp2: "traps", rp2: "throw",
  s3U: "char", s3D: "inv", s3L: "credits", s3R: "body",
  t3: "draw", d3: "quests", r3: "stats", p3: "eat", dp3: "save", rp3: "guide",
  s4U: "navMenu", s4D: "hush", s4L: "histBack", s4R: "histFwd",
  t4: "status", d4: "implants", r4: "load", p4: "where", dp4: "gestList", rp4: "settings"
};

function fits(gid, a) {
  var g = BY[gid], A = ACT[a];
  if (!g || !A) return false;
  if (A.hold) return g.type === "hswipe";
  if (A.dir) return g.type === "swipe" || g.type === "hswipe";
  return true;
}
function actionOf(gid) {
  if (!BY[gid]) return null;
  var m = S().gest, a = m && m[gid];
  return a && ACT[a] && fits(gid, a) ? a : DEF[gid] || "none";
}
function bound(gid) { var a = actionOf(gid); return !!a && a !== "none"; }
function setAction(gid, a) {
  if (!BY[gid] || !fits(gid, a)) return false;
  var s = S();
  if (!s.gest || typeof s.gest !== "object") s.gest = {};
  if (DEF[gid] === a) delete s.gest[gid]; else s.gest[gid] = a;
  if (!Object.keys(s.gest).length) delete s.gest;
  LAB.saveSettings();
  return true;
}
function resetAll() { delete S().gest; LAB.saveSettings(); }
function changedCount() { var m = S().gest; return m ? Object.keys(m).filter(function (k) { return BY[k] && actionOf(k) !== DEF[k]; }).length : 0; }
function actName(a) { return ACT[a] ? ACT[a].n : "ничего"; }
function lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
function gestsWith(a) { return LIST.filter(function (g) { return actionOf(g.id) === a; }); }

/* Жест для подсказки: пока на исходном жесте действия стоит оно само — исходные слова
   (def); переназначили — имя жеста, где оно теперь; нигде нет — так и сказать. */
function word(a, def, tmpl) {
  if (LAB.kb && LAB.kb()) return def;
  var home = LIST.filter(function (g) { return DEF[g.id] === a; });
  if (home.length && home.every(function (g) { return actionOf(g.id) === a; })) return def;
  /* (после 4.6) действие по стороне (шаг, выстрел, ходьба, очередь): часть сторон переназначили —
     прежние слова и какие стороны больше не годятся; иначе «выстрел — свайп вниз» сбивал бы с толку */
  if (ACT[a] && (ACT[a].dir || ACT[a].hold) && home.length > 1) {
    var lost = home.filter(function (g) { return actionOf(g.id) !== a; });
    if (lost.length < home.length) return def + " (кроме: " + lost.map(function (g) { return DIRW[g.id.slice(-1)] || ""; }).filter(Boolean).join(", ") + ")";
  }
  var cur = gestsWith(a)[0], nm = cur ? lowerFirst(cur.name) : "жест не назначен: «Настройки», «Управление», «Жесты»";
  return tmpl ? tmpl.replace("%", nm) : nm;
}
var DIRW = { U: "вверх", D: "вниз", L: "влево", R: "вправо" };

/* Где вы: уровень, этаж, помещение или коридор, время. */
function whereAmI() {
  var g = G(), r = gm().roomAt ? gm().roomAt(g.x, g.y) : null;
  var here = g.stair ? "На лестнице" : r ? "Помещение: " + r.name : "Коридор";
  say(here + ". Уровень " + g.L + ", этаж " + g.F + ". " + "День " + g.day + ", " + gm().clock() + ".");
}

/* ── МЕНЮ ── «Настройки» → «Управление»: жесты и чувствительность касаний. */
var GAPS = [250, 300, 380, 450, 550, 700], HOLDS = [400, 600, 800, 1000, 1300], SWK = [0.7, 1, 1.35];
function msW(ms) { var s = ms / 1000; return (s === Math.floor(s) ? String(s) : String(s).replace(".", ",")) + " " + (s === 1 ? "секунда" : s < 1 || s % 1 ? "секунды" : "секунд"); }
function controlsMenu() {
  var s = S(), n = changedCount();
  var items = [
    { label: function () { var c = changedCount(); return "Жесты: какое действие на каком жесте" + (c ? ". Изменено жестов: " + c : ""); }, fn: gesturesMenu },
    { kind: "choice", label: "Пауза для двойного и тройного касания", options: GAPS.map(function (v) { return { v: v, label: msW(v) + (v === 380 ? ", обычная" : v < 380 ? ", быстрее" : ", дольше ждать") }; }),
      get: function () { return +s.gTapGap || 380; }, set: function (v) { s.gTapGap = v; LAB.saveSettings(); },
      descOf: function () { return "Столько игра ждёт следующего касания, прежде чем решить, что касание одно. Короче — одиночные касания срабатывают быстрее, но двойное и тройное касание нужно делать быстрее."; } },
    { kind: "choice", label: "Удержание срабатывает через", options: HOLDS.map(function (v) { return { v: v, label: msW(v) + (v === 600 ? ", обычно" : "") }; }),
      get: function () { return +s.gHold || 600; }, set: function (v) { s.gHold = v; LAB.saveSettings(); },
      descOf: function () { return "Столько держать пальцы на экране, чтобы касание двумя, тремя или четырьмя пальцами стало касанием с удержанием. Сработало — короткая вибрация и тик, пальцы можно отпускать. Одним пальцем долгое касание считается по отпусканию, когда палец продержали около секунды."; } },
    { kind: "choice", label: "Длина свайпа", options: [{ v: 0.7, label: "короткая: свайп засчитывается раньше" }, { v: 1, label: "обычная" }, { v: 1.35, label: "длинная: случайное движение пальца не станет свайпом" }],
      get: function () { var v = +s.gSwipe || 1; return SWK.indexOf(v) >= 0 ? v : 1; }, set: function (v) { s.gSwipe = v; LAB.saveSettings(); } },
    { label: "Вернуть все жесты, как было задано", fn: function () {
      if (!changedCount()) { say("Все жесты и так заданы, как было."); return; }
      ui().menu("Вернуть все жесты?", [
        { label: "Да, вернуть все жесты, как было задано", fn: function () { resetAll(); LAB.UI.ok(); say("Жесты снова такие, как были заданы."); controlsMenu(); } },
        { label: "Нет, оставить мои жесты", close: true, fn: function () {} }
      ], { intro: "Изменено жестов: " + changedCount() + "." });
    } },
    { label: "Назад", fn: function () { ui().settings(); } }
  ];
  ui().menu("Управление", items, { intro: (n ? "Изменено жестов: " + n + ". " : "") + "Жесты в игре можно переназначить. В окнах жесты прежние: они листают пункты." });
}
function gesturesMenu() {
  var items = [1, 2, 3, 4].map(function (n) {
    return { label: function () { return FGROUP[n] + ": " + LIST.filter(function (g) { return g.n === n; }).length + " " + LAB.plural(LIST.filter(function (g) { return g.n === n; }).length, "жест", "жеста", "жестов"); }, fn: function () { groupMenu(n); } };
  });
  items.push({ label: "Все жесты подряд", fn: function () { groupMenu(0); } });
  items.push({ label: "Назад", fn: controlsMenu });
  ui().menu("Жесты", items, { intro: "Выберите жест — откроется список действий для него." });
}
function gestItem(g) {
  return { label: function () { return g.name + ": " + lowerFirst(actName(actionOf(g.id))) + (actionOf(g.id) !== DEF[g.id] ? ". Изменён" : ""); }, fn: function () { actionMenu(g.id); } };
}
function groupItems(n) {
  var items = LIST.filter(function (g) { return !n || g.n === n; }).map(gestItem);
  items.push({ label: "Назад", fn: gesturesMenu });
  return items;
}
function groupMenu(n) {
  var title = n ? "Жесты: " + FGROUP[n].toLowerCase() : "Все жесты";
  ui().menu(title, groupItems(n), { rebuild: function () { return groupItems(n); }, intro: n === 1 ? "Составные жесты — в конце списка." : "" });
}
function actionMenu(gid) {
  var g = BY[gid]; if (!g) return;
  var cur = actionOf(gid), list = ORDER.filter(function (a) { return fits(gid, a); });
  var items = list.map(function (a) {
    var A = ACT[a];
    return { label: function () { return A.n + (a === actionOf(gid) ? " — сейчас" : "") + (a === DEF[gid] && a !== actionOf(gid) ? " — как было задано" : ""); }, fn: function () { choose(gid, a); } };
  });
  items.push({ label: "Назад", fn: function () {} });
  ui().menu(g.name, items, { focus: Math.max(0, list.indexOf(cur)), intro: "Сейчас: " + lowerFirst(actName(cur)) + "." + (g.type === "swipe" ? " Шаг и выстрел берут сторону жеста." : "") });
}
function choose(gid, a) {
  var g = BY[gid], old = actionOf(gid);
  if (a === old) { ui().closeTop(true); say(g.name + " — и так " + lowerFirst(actName(a)) + "."); return; }
  setAction(gid, a);
  /* своё «щёлк» переназначения; пока записи нет — обычное подтверждение окна */
  if (LAB.SND && LAB.SND.rebind_ok && LAB.atmos && LAB.atmos.play) LAB.atmos.play("rebind_ok"); else LAB.UI.ok();
  var msg = g.name + " — теперь " + lowerFirst(actName(a)) + ".";
  if (old && old !== "none" && !gestsWith(old).length) msg += " Действие «" + lowerFirst(actName(old)) + "» больше ни на каком жесте: его можно назначить на другой.";
  /* двойное или тройное касание (и они же с удержанием) заняли или освободили — касание и двойное
     касание того же числа пальцев ждут продолжения или срабатывают сразу (input.js, wantMore) */
  var m = /^(d|r|dp|rp)([1-4])$/.exec(gid);
  if (m && (old === "none" || !old) !== (a === "none")) {
    var nn = +m[2], f = FING[nn], TAP = ["", "t", "d", "r"], HLD = ["", "p", "dp", "rp"];
    var waits = function (taps, on) { for (var k = taps + 1; k <= 3; k++) { var ids = [TAP[k] + nn, HLD[k] + nn]; for (var q = 0; q < 2; q++) if (ids[q] === gid ? on : bound(ids[q])) return true; } return false; };
    [[1, "Касание "], [2, "Двойное касание "]].forEach(function (p) {
      if (TAP[p[0]] + nn === gid || !bound(TAP[p[0]] + nn)) return;
      var w0 = waits(p[0], old && old !== "none"), w1 = waits(p[0], a !== "none");
      if (!w0 && w1) msg += " " + p[1] + f + " теперь срабатывает чуть позже: игра ждёт, не будет ли ещё касания.";
      else if (w0 && !w1) msg += " " + p[1] + f + " теперь срабатывает сразу.";
    });
  }
  ui().closeTop(true);
  say(msg);
}

LAB.gestures = {
  list: LIST, byId: BY, actions: ACT, defaults: DEF,
  actionOf: actionOf, bound: bound, set: setAction, reset: resetAll, fits: fits, word: word, actName: actName,
  exec: function (a, g) { var A = ACT[a]; if (!A || !A.fn) return false; A.fn(g || {}); return true; },
  controlsMenu: controlsMenu, menu: gesturesMenu, where: whereAmI
};
/* Слова жеста для подсказок: LAB.gw("reload", "касание двумя пальцами"); tmpl — фраза, где «%» —
   имя переназначенного жеста (когда исходные слова целой фразой: «коснитесь дважды…»). */
LAB.gw = function (a, def, tmpl) { return word(a, def, tmpl); };
})();
