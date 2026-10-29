/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — химические задачи (3.6, просьба автора:
   «добавь различные химические головоломки»). Все — окнами меню, на
   размышление и на слух, у каждой три ступени сложности:
   · Титрование — довести пробу кислоты до нейтрали щёлочью: капли по одной
     и пачками, поправка кислотой, кислотомер пищит грубо, а проверок
     индикатором — наперечёт. Перелили — проба испорчена.
   · Неизвестные склянки — ярлыки смыты: индикатор, запах и пробы «капля к
     капле» (шипит, теплеет, белый осадок, дымок); проб — наперечёт.
   · Ошибка в методике — в протоколе синтеза опасные шаги: найти их все.
   · Хроматограмма — пятна пробы на бумаге и справочник: что в смеси.
   · Цепочка превращений — из исходного вещества получить нужное,
     операциями по одной: тупики и ходы по кругу есть.
   Где: на стендах испытаний в лабораториях (world.js), в шкафах с
   химическим замком и в банке с кислотой (вещь на дне). Решённая задача —
   опыт химика, а иногда и рецептура. Шкаф с реактивами — просто шкаф:
   реактивы для работы руками (chemlab.js).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB); /* и в проверке генератора: стенды знают эти задачи */
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
var U = LAB.puzzles.util, run = U.run, say = U.say, sayq = U.sayq, A = U.A, UIx = U.UIx, pl = U.pl;
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function spend(m) { if (m > 0 && gm().advanceTime) gm().advanceTime(m); }
function ev(name, n) { if (LAB.ach && LAB.ach.ev) LAB.ach.ev(name, n == null ? 1 : n); }
function st(o) { return gm().objState(o); }

/* решено: опыт химика, иногда — рецептура (неизвестная, по силам направлению) */
function reward(kind, diff) {
  var Ch = LAB.chem; if (!Ch) return "";
  var br = { titr: "tox", vials: "tox", protocol: "pharm", spectr: "bio", chain: "energy" }[kind] || "tox";
  Ch.gain(br, 6 + 4 * (diff || 0));
  ev("chempuz", 1);
  var L = G().L, pool = Ch.RC.filter(function (rc) { return rc.f && !Ch.known(rc) && Ch.outOk(rc) && rc.lv <= 1 + Math.floor(L / 3); });
  if (pool.length && h32("cpz:" + kind + ":" + CUR().key + ":" + G().x + ":" + G().y) % 100 < 35 + 15 * (diff || 0)) {
    var rc = pool[h32("cpzr:" + CUR().key + ":" + kind) % pool.length];
    Ch.learn(rc.id, "Её подсказало решение задачи.");
    return " И ещё — рецептура для химического стола.";
  }
  return "";
}
function wrap(kind, diff, cb) { return function (ok, away, fresh) { if (ok) { var t = reward(kind, diff); if (t) sayq(t.trim()); } if (cb) cb(ok, away, fresh); }; } /* away — игрок просто отошёл, fresh — от начатой задачи (puzzles.js, run) */

/* ════════ ТИТРОВАНИЕ ════════ */
function titr(seed, cb, opts) {
  var r = U.rng(seed, "titr"), d = opts.diff || 0;
  var N = d === 0 ? r.int(5, 8) : d === 1 ? r.int(8, 12) : r.int(11, 16), x = 0, checks = [4, 3, 2][d];
  cb = wrap("titr", d, cb);
  last = { kind: "titr", N: function () { return N; } };
  var cond = (opts.title ? opts.title + ". " : "") + (opts.lead || "") + "Титрование. В колбе — проба кислоты неизвестной крепости и индикатор, в бюретке — щёлочь, рядом — пипетка с кислотой для поправки. Нужно довести раствор ровно до нейтрали и сдать пробу. Кислотомер пищит грубо: только «далеко», «ближе» и «рядом». Точно скажет индикатор — но проверок осталось " + checks + ": каждая тратит каплю пробы. Перелили щёлочь — поправьте кислотой, а проверки берегите.";
  run("Титрование", cond, function (st0, finish, fail) {
    var add = function (k, what) {
      x += k; A("play", "ev_glass");
      sayq((k > 0 ? "Щёлочи — " + k + " " + pl(k, "капля", "капли", "капель") : "Кислоты — капля") + ". Всего щёлочи по счёту: " + x + ".");
    };
    var meter = function () {
      var dlt = N - x, band = dlt >= 5 ? 0 : dlt >= 2 ? 1 : dlt >= -1 ? 2 : 3;
      A("play", "term_beep", { rate: [0.6, 0.85, 1.1, 1.45][band] });
      sayq(["Тон низкий: до нейтрали далеко.", "Тон выше: ближе.", "Тон почти ровный: рядом — в капле-другой.", "Тон высокий, резкий: щёлочи больше, чем нужно."][band]);
    };
    var look = function () {
      if (checks <= 0) { A("play", "term_err"); sayq("Проверок не осталось: решайте по кислотомеру."); return; }
      checks--; A("play", "ev_glass");
      sayq((x < N ? "Розовое облачко тает: раствор ещё кислый." : x === N ? "Бледно-розовый цвет держится: нейтраль." : "Раствор ярко-малиновый: щёлочи перелили.") + " Проверок осталось: " + checks + ".");
    };
    return [
      { label: "Капнуть щёлочь: одну каплю", keep: true, fn: function () { add(1); } },
      { label: "Капнуть щёлочь: три капли", keep: true, fn: function () { add(3); } },
      { label: "Капнуть щёлочь: пять капель", keep: true, fn: function () { add(5); } },
      { label: "Поправка: капля кислоты из пипетки", keep: true, fn: function () { add(-1); } },
      { label: "Послушать кислотомер", keep: true, fn: meter },
      { label: function () { return "Перемешать и посмотреть индикатор — проверок " + checks; }, keep: true, fn: look },
      { label: "Сдать пробу: раствор нейтральный", fn: function () {
        if (x === N) { A("play", "code_ok"); finish(true, "Ровно в точке нейтрализации: " + N + " " + pl(N, "капля", "капли", "капель") + " щёлочи. Анализ сошёлся."); return; }
        A("play", "term_err");
        if (fail(x < N ? "Раствор ещё кислый." : "Щёлочи перелили.")) { x = 0; checks = Math.max(1, [4, 3, 2][d] - 1); N = d === 0 ? r.int(5, 8) : d === 1 ? r.int(8, 12) : r.int(11, 16); sayq("Новая проба — другой крепости. Проверок: " + checks + "."); }
      } }
    ];
  }, cb);
}

/* ════════ НЕИЗВЕСТНЫЕ СКЛЯНКИ ════════ */
var VS = [
  { id: "water", n: "дистиллированная вода", ph: 0, sm: "ничем не пахнет" },
  { id: "acid", n: "кислота", ph: -2, sm: "резко и кисло" },
  { id: "base", n: "щёлочь", ph: 2, sm: "почти ничем, пальцы мылит" },
  { id: "salt", n: "раствор соли", ph: 0, sm: "ничем не пахнет" },
  { id: "amm", n: "нашатырь", ph: 1, sm: "бьёт в нос нашатырём" },
  { id: "perox", n: "перекись", ph: 0, sm: "почти ничем, свежестью" },
  { id: "silver", n: "раствор ляписа", ph: 0, sm: "ничем не пахнет" },
  { id: "soda", n: "раствор соды", ph: 1, sm: "ничем не пахнет" },
  { id: "solv", n: "растворитель", ph: 0, sm: "сладковато, спиртом" },
  { id: "blood", n: "гемолимфа", ph: 0, sm: "железом, кровью" }
];
/* что видно, если слить по капле из двух склянок */
function pair(a, b) {
  var has = function (x, y) { return (a === x && b === y) || (a === y && b === x); };
  if (has("acid", "base")) return "смесь теплеет";
  if (has("acid", "soda")) return "смесь шипит пузырьками";
  if (has("acid", "amm")) return "над пробиркой белый дымок";
  if (has("silver", "salt")) return "выпадает белый творожистый осадок";
  if (has("perox", "blood")) return "смесь вспенивается розовым";
  if (has("acid", "silver")) return "ничего не видно";
  if (has("solv", "water")) return "смесь чуть теплеет и пахнет сильнее";
  return "ничего не происходит";
}
function phW(x, d) { return x < 0 ? (d === 0 && x <= -2 ? "кислая, сильно" : "кислая") : x > 0 ? (d === 0 && x >= 2 ? "щелочная, сильно" : "щелочная") : "нейтральная"; }
/* Набор годится, только если пробы различают все склянки: нет иной расстановки веществ по
   склянкам, при которой все пробы — индикатор, запах, капля с каждой другой — ответили бы так
   же. (Проверка перед сборкой.) Прежде сравнивались подписи склянок, а на месте самой склянки в
   подписи стояла пустая строка, и подписи разных склянок не совпадали никогда: неразличимые
   склянки — вода и раствор соли без ляписа в наборе и подобные — попадались в каждой шестой
   задаче, и решить её можно было только наугад. */
var PERMS = {};
function perms(n) {
  if (n <= 1) return [[0]];
  var out = [];
  perms(n - 1).forEach(function (p) { for (var i = 0; i <= p.length; i++) out.push(p.slice(0, i).concat([n - 1], p.slice(i))); });
  return out;
}
function ambiguous(set, d) {
  var n = set.length, ps = PERMS[n] || (PERMS[n] = perms(n));
  return ps.some(function (p) {
    if (p.every(function (v, i) { return v === i; })) return false;
    for (var k = 0; k < n; k++) {
      var a = set[k], b = set[p[k]];
      if (phW(a.ph, d) !== phW(b.ph, d) || a.sm !== b.sm) return false;
      for (var j = k + 1; j < n; j++) if (pair(a.id, set[j].id) !== pair(b.id, set[p[j]].id)) return false;
    }
    return true;
  });
}
function vials(seed, cb, opts) {
  var r = U.rng(seed, "vials"), d = opts.diff || 0, n = 3 + d, set = null, guard = 0;
  do { var p = VS.slice(); r.shuffle(p); set = p.slice(0, n); guard++; }
  while (guard < 400 && ambiguous(set, d));
  var budget = [3 * n, 2 * n + 1, 2 * n - 1][d], ans = set.map(function () { return null; }), names = set.slice().sort(function (a, b) { return a.n < b.n ? -1 : 1; });
  cb = wrap("vials", d, cb);
  last = { kind: "vials", set: set.map(function (s) { return s.n; }), names: names.map(function (s) { return s.n; }), amb: ambiguous(set, d) };
  var cond = (opts.title ? opts.title + ". " : "") + (opts.lead || "") + "Неизвестные склянки. " + n + " " + pl(n, "склянка", "склянки", "склянок") + " — ярлыки смыты. Известно, что в них: " + names.map(function (s) { return s.n; }).join(", ") + " — каждое по разу. Можно капнуть индикатор, понюхать (помахивая ладонью) или слить по капле из двух склянок в пробирку. Проб — " + budget + ": каждая тратит реактив. Определите, что где.";
  run("Неизвестные склянки", cond, function (st0, finish, fail) {
    var left = function () { return budget; };
    var spendT = function () { if (budget <= 0) { A("play", "term_err"); sayq("Проб больше нет: определяйте по тому, что уже узнали."); return false; } budget--; return true; };
    var items = [];
    set.forEach(function (s, k) {
      items.push({ label: function () { return "Склянка " + (k + 1) + (ans[k] ? ": по-вашему — " + ans[k].n : ": не определена"); }, fn: function () {
        var sub = [
          { label: "Капнуть индикатор — проб осталось " + left(), fn: function () { if (spendT()) { A("play", "term_beep", { rate: 1 + 0.15 * s.ph }); sayq("Склянка " + (k + 1) + ": индикатор — " + phW(s.ph, d) + ". Проб осталось: " + budget + "."); } } },
          { label: "Понюхать — проб осталось " + left(), fn: function () { if (spendT()) sayq("Склянка " + (k + 1) + ": " + s.sm + ". Проб осталось: " + budget + "."); } }
        ];
        set.forEach(function (o, j) { if (j !== k) sub.push({ label: "Слить каплю со склянкой " + (j + 1), fn: function () { if (spendT()) { A("play", "ev_glass"); sayq("Склянки " + (k + 1) + " и " + (j + 1) + ": " + pair(s.id, o.id) + ". Проб осталось: " + budget + "."); } } }); });
        sub.push({ label: "Решить: что в склянке " + (k + 1), fn: function () {
          UIx("menu", "Склянка " + (k + 1) + ": что в ней?", names.map(function (nn) { return { label: nn.n, fn: function () { ans[k] = nn; sayq("Склянка " + (k + 1) + ": " + nn.n + "."); UIx("refresh"); } }; }));
        } });
        UIx("menu", "Склянка " + (k + 1), sub);
      } });
    });
    items.push({ label: "Сдать ответ", fn: function () {
      if (ans.some(function (a) { return !a; })) { say("Не все склянки определены."); return; }
      if (ans.every(function (a, k) { return a.id === set[k].id; })) { A("play", "code_ok"); finish(true, "Все склянки подписаны верно."); return; }
      A("play", "term_err"); fail("Хотя бы одна склянка подписана неверно.");
    } });
    return items;
  }, cb);
}

/* ════════ ОШИБКА В МЕТОДИКЕ ════════ */
var SAFE = ["Надеть перчатки и защитные очки", "Включить вытяжку и проверить тягу", "Налить в стакан дистиллированной воды", "Влить кислоту в воду тонкой струйкой, помешивая", "Перемешать стеклянной палочкой", "Охладить смесь на ледяной бане", "Отфильтровать осадок через бумажный фильтр", "Выпарить фильтрат под вытяжкой", "Набрать раствор пипеткой с грушей", "Подписать склянку: что внутри и когда", "Слить отходы кислот и щелочей в разные ёмкости", "Понюхать, помахивая ладонью к себе", "Нагреть колбу на водяной бане", "Положить фосфор под слой воды", "Вымыть посуду и убрать реактивы в шкаф"];
var BAD = [
  { t: "Влить воду в концентрированную кислоту", w: "воду в кислоту не льют — брызги; наоборот: кислоту в воду" },
  { t: "Нагреть растворитель на открытой спиртовке", w: "растворитель над открытым огнём вспыхивает — только водяная баня и вытяжка" },
  { t: "Насыпать фосфор в сухую колбу", w: "фосфор на воздухе вспыхивает — его держат под водой" },
  { t: "Развести хлорку кислотой для крепости", w: "хлорка с кислотой даёт ядовитый хлор" },
  { t: "Понюхать склянку, наклонившись над горлышком", w: "нюхают, помахивая ладонью к себе, а не над горлышком" },
  { t: "Просушить пиротехническую смесь над огнём", w: "пиротехнику не греют — вспыхнет" },
  { t: "Набрать раствор пипеткой ртом", w: "пипеткой ртом не набирают — только грушей" },
  { t: "Слить остатки нашатыря и хлорки в одно ведро", w: "нашатырь с хлоркой дают удушливые пары" },
  { t: "Плотно закрыть пробкой колбу, где идёт газ", w: "колбу с газом не закупоривают — разорвёт" },
  { t: "Прокипятить гемолимфу для стерильности", w: "белок от кипения сворачивается — живое держат тёплым" },
  { t: "Поднести спиртовку к пробирке с водородом", w: "водород от огня хлопает" },
  { t: "Убрать склянку с перекисью к топливному гелю", w: "перекись — окислитель: подальше от горючего" }
];
function protocol(seed, cb, opts) {
  var r = U.rng(seed, "proto"), d = opts.diff || 0, n = [6, 8, 10][d], bad = [1, 2, 3][d];
  var safe = SAFE.slice(); r.shuffle(safe); var bads = BAD.slice(); r.shuffle(bads); bads = bads.slice(0, bad);
  var steps = safe.slice(0, n - bad).map(function (t) { return { t: t, bad: null }; }).concat(bads.map(function (b) { return { t: b.t, bad: b }; }));
  r.shuffle(steps);
  var mark = steps.map(function () { return false; });
  cb = wrap("protocol", d, cb);
  last = { kind: "protocol", bad: steps.map(function (s, k) { return s.bad ? k : -1; }).filter(function (k) { return k >= 0; }), n: n };
  var cond = (opts.title ? opts.title + ". " : "") + (opts.lead || "") + "Ошибка в методике. Протокол синтеза из " + n + " шагов, и в нём " + (bad === 1 ? "один опасный шаг" : bad + " опасных шага") + ": так в лаборатории не делают. Отметьте все опасные шаги и сдайте протокол. Шаги: " + steps.map(function (s, k) { return (k + 1) + ") " + s.t; }).join("; ") + ".";
  run("Ошибка в методике", cond, function (st0, finish, fail) {
    var items = steps.map(function (s, k) { return { label: function () { return (k + 1) + ") " + s.t + (mark[k] ? " — отмечен как опасный" : ""); }, keep: true, fn: function () { mark[k] = !mark[k]; sayq("Шаг " + (k + 1) + ": " + (mark[k] ? "опасный" : "без отметки") + "."); UIx("refresh"); } }; });
    items.push({ label: "Сдать протокол", fn: function () {
      var miss = steps.filter(function (s, k) { return s.bad && !mark[k]; }).length, extra = steps.filter(function (s, k) { return !s.bad && mark[k]; }).length;
      if (!miss && !extra) { A("play", "code_ok"); finish(true, "Протокол исправлен: " + bads.map(function (b) { return b.w; }).join("; ") + "."); return; }
      A("play", "term_err"); fail(miss && extra ? "Есть и пропущенные опасные шаги, и лишние отметки." : miss ? "Не все опасные шаги отмечены." : "Отмечен шаг, в котором ничего опасного нет.");
    } });
    return items;
  }, cb);
}

/* ════════ ХРОМАТОГРАММА ════════ */
var REF = [
  { n: "минеральные соли", s: [2] }, { n: "кислота", s: [8] }, { n: "яд твари", s: [3, 6] }, { n: "ферменты", s: [4] },
  { n: "конденсат мутагена", s: [5, 9] }, { n: "растворитель", s: [10] }, { n: "гемолимфа", s: [1, 4] }, { n: "стабилизатор", s: [6] },
  { n: "нервный экстракт", s: [3, 7] }, { n: "споровый концентрат", s: [2, 5] }, { n: "гормон железы", s: [7] }, { n: "катализатор", s: [1, 9] }
];
var NUM = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять"];
function spotsOf(list) { var o = {}; list.forEach(function (x) { x.s.forEach(function (v) { o[v] = 1; }); }); return Object.keys(o).map(Number).sort(function (a, b) { return a - b; }); }
function combos(arr, k) { var out = []; (function go(i, acc) { if (acc.length === k) { out.push(acc.slice()); return; } for (var j = i; j < arr.length; j++) { acc.push(arr[j]); go(j + 1, acc); acc.pop(); } })(0, []); return out; }
function spectr(seed, cb, opts) {
  var r = U.rng(seed, "spectr"), d = opts.diff || 0, k = [2, 3, 3][d], refN = [6, 8, 10][d], ref = null, mix = null, guard = 0;
  do {
    ref = REF.slice(); r.shuffle(ref); ref = ref.slice(0, refN);
    mix = ref.slice(); r.shuffle(mix); mix = mix.slice(0, k);
    var target = spotsOf(mix).join(","), same = combos(ref, k).filter(function (c) { return spotsOf(c).join(",") === target; }).length;
    guard++;
  } while (same !== 1 && guard < 300);
  var pick = ref.map(function () { return false; }), spots = spotsOf(mix);
  cb = wrap("spectr", d, cb);
  last = { kind: "spectr", mix: ref.map(function (x, i) { return mix.indexOf(x) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; }), ref: ref.map(function (x) { return x.s.slice(); }), k: k };
  var cond = (opts.title ? opts.title + ". " : "") + (opts.lead || "") + "Хроматограмма. Капля пробы прошла по бумаге, и на ней " + spots.length + " " + pl(spots.length, "пятно", "пятна", "пятен") + " — на высоте " + spots.map(function (v) { return NUM[v]; }).join(", ") + ". В смеси " + (k === 2 ? "два вещества" : "три вещества") + ". Справочник: " + ref.map(function (x) { return x.n + " — " + x.s.map(function (v) { return NUM[v]; }).join(" и "); }).join("; ") + ". Каждое вещество даёт все свои пятна. Отметьте, что в смеси.";
  run("Хроматограмма", cond, function (st0, finish, fail) {
    var items = ref.map(function (x, i) { return { label: function () { return cap1(x.n) + " — пятна " + x.s.map(function (v) { return NUM[v]; }).join(" и ") + (pick[i] ? ": отмечено" : ""); }, keep: true, fn: function () { pick[i] = !pick[i]; sayq(cap1(x.n) + ": " + (pick[i] ? "в смеси" : "не отмечено") + "."); UIx("refresh"); } }; });
    items.push({ label: "Сдать ответ", fn: function () {
      var chosen = ref.filter(function (x, i) { return pick[i]; });
      if (chosen.length === mix.length && chosen.every(function (x) { return mix.indexOf(x) >= 0; })) { A("play", "code_ok"); finish(true, "Верно: в смеси — " + mix.map(function (x) { return x.n; }).join(", ") + "."); return; }
      A("play", "term_err"); fail(chosen.length !== mix.length ? "Веществ в смеси " + (k === 2 ? "два" : "три") + "." : "Пятна не сходятся.");
    } });
    return items;
  }, cb);
}

/* ════════ ЦЕПОЧКА ПРЕВРАЩЕНИЙ ════════ */
var CH_ST = ["мутная взвесь", "прозрачный раствор", "белый осадок", "тёмный осадок", "голубые кристаллы", "жёлтая пена", "густой сироп", "серый порошок", "бесцветные иглы", "розовый раствор"];
var CH_OP = ["добавить щёлочь", "добавить кислоту", "нагреть", "охладить", "отфильтровать", "выпарить", "добавить растворитель"];
function chain(seed, cb, opts) {
  var r = U.rng(seed, "chain"), d = opts.diff || 0, nS = [5, 7, 9][d], nO = [4, 5, 6][d], states = CH_ST.slice(), ops = CH_OP.slice();
  r.shuffle(states); r.shuffle(ops); states = states.slice(0, nS); ops = ops.slice(0, nO);
  /* переходы: из каждого состояния каждой операцией — в другое или «испорчено» (-1).
     (3.6) Кратчайший путь — ровно m шагов: у состояний «ступени» от начала, операция
     ведёт не дальше чем на ступень вперёд, а к цели — только с последней ступени
     (прежде переходы были случайными, и сложная цепочка порой решалась в один ход) */
  var T = null, path = null, m = Math.min(nS - 1, [2, 3, 4][d] + (r.chance(0.5) ? 1 : 0));
  var bfs = function () { var prev = {}, q = [0]; prev[0] = null; while (q.length) { var s = q.shift(); if (s === nS - 1) break; for (var o = 0; o < nO; o++) { var t = T[s][o]; if (t >= 0 && !(t in prev)) { prev[t] = [s, o]; q.push(t); } } } if (!((nS - 1) in prev)) return null; var p = [], c = nS - 1; while (prev[c]) { p.unshift(prev[c][1]); c = prev[c][0]; } return p; };
  var lay = [0], mid = []; for (var i0 = 1; i0 < nS - 1; i0++) mid.push(i0);
  r.shuffle(mid);
  var spine = [0].concat(mid.slice(0, m - 1), [nS - 1]); /* цепочка ступеней 0…m */
  spine.forEach(function (st, k) { lay[st] = k; });
  mid.slice(m - 1).forEach(function (st) { lay[st] = r.int(0, m - 1); });
  T = [];
  for (var s = 0; s < nS; s++) {
    T.push([]);
    for (var o = 0; o < nO; o++) {
      if (s === nS - 1 || r.chance(0.22)) { T[s].push(-1); continue; }
      var ok = []; for (var t = 0; t < nS; t++) if (t !== s && (t === nS - 1 ? lay[s] === m - 1 : lay[t] <= lay[s] + 1)) ok.push(t);
      T[s].push(ok.length ? ok[r.int(0, ok.length - 1)] : -1);
    }
  }
  for (var k = 0; k < m; k++) T[spine[k]][r.int(0, nO - 1)] = spine[k + 1];
  path = bfs();
  var limit = path ? path.length + [3, 2, 2][d] : 6, curS = 0, used = 0, hist = [];
  cb = wrap("chain", d, cb);
  last = { kind: "chain", path: (path || []).map(function (oi) { return ops[oi]; }), limit: limit };
  var cond = (opts.title ? opts.title + ". " : "") + (opts.lead || "") + "Цепочка превращений. В колбе — " + states[0] + ". Нужно получить: " + states[nS - 1] + ". Операции: " + ops.join(", ") + ". Что даёт каждая — узнаёте, делая; некоторые портят пробу, и тогда — с начала. Операций в запасе — " + limit + ".";
  run("Цепочка превращений", cond, function (st0, finish, fail) {
    var items = [{ label: function () { return "Сейчас в колбе: " + states[curS] + ". Операций осталось: " + (limit - used) + "."; }, info: true, keep: true, fn: function () { sayq("Сейчас: " + states[curS] + ". Было: " + (hist.length ? hist.join("; ") : "ничего") + "."); } }];
    ops.forEach(function (op, oi) {
      items.push({ label: cap1(op), keep: true, fn: function () {
        used++; A("play", "ev_bubbles");
        var t = T[curS][oi];
        if (t < 0) { hist.push(op + " → испорчено"); curS = 0; sayq(cap1(op) + ": проба испорчена — бурая пена. Начинаете с новой: " + states[0] + "."); }
        else { hist.push(op + " → " + states[t]); curS = t; sayq(cap1(op) + ": теперь в колбе — " + states[t] + "."); }
        if (curS === nS - 1) { A("play", "code_ok"); finish(true, "Получено: " + states[nS - 1] + ". Цепочка: " + hist.join("; ") + "."); return; }
        if (used >= limit) { A("play", "term_err"); if (fail("Операций в запасе не осталось.")) { used = 0; curS = 0; hist = []; limit = path.length + 2; sayq("Новая проба: " + states[0] + ". Операций в запасе — " + limit + ". Что узнали — пригодится."); } }
        UIx("refresh");
      } });
    });
    return items;
  }, cb);
}

var last = null; /* для проверок: решение последней задачи */
var KINDS = ["titr", "vials", "protocol", "spectr", "chain"];
var NAMES = { titr: "титрование", vials: "неизвестные склянки", protocol: "ошибка в методике", spectr: "хроматограмма", chain: "цепочка превращений" };
var FN = { titr: titr, vials: vials, protocol: protocol, spectr: spectr, chain: chain };
KINDS.forEach(function (k) { LAB.puzzles.register(k, NAMES[k], FN[k], { diffs: true }); });

/* ════════ ВЕЩИ ════════ */
var RG = ["c_perox", "c_ammonia", "c_bleach", "c_soda", "c_silver", "c_iodine", "c_acidc", "c_alkali", "c_solvent", "c_salt", "c_salt", "c_soda"];
var RG_DEEP = ["c_catalyst", "c_enzyme", "c_phosphor", "c_stab", "c_activ"];
function rng(o, tag) { return LAB.Rng(G().seed, "cpz:" + tag + ":" + CUR().key + ":" + o.id); }
function give(id, n) { return gm().giveItem({ kind: "item", item: id, n: n || 1 }); }
function reagentsOf(r, n, deep) {
  var L = G().L, Ch = LAB.chem, out = [];
  var ok = function (f) { return Ch.FAM[f] && (Ch.FAM[f].depth || 1) <= Math.max(1, L); };
  for (var i = 0; i < n; i++) {
    /* редкие реактивы — по глубине; на мелких этажах их нет, и берутся обычные */
    var pool = deep && r.chance(0.35) ? RG_DEEP.filter(ok) : [];
    if (!pool.length) pool = RG.filter(ok);
    var f = pool[r.int(0, pool.length - 1)];
    out.push(Ch.FAM[f].one ? f : Ch.matId(f, Ch.gradeAt(L, function () { return r.next(); }), false));
  }
  return out;
}
/* шкаф с реактивами: один раз; иногда — на висячем замке */
function reagents(o) {
  var s = st(o), g = G();
  if (s.rgTaken) { say("Полки шкафа пусты: всё полезное вы уже взяли."); return; }
  var r = rng(o, "rg");
  if (s.rgLock == null) s.rgLock = r.chance(0.25) ? 1 : 0;
  var take = function (how) {
    s.rgTaken = 1; s.rgLock = 0; spend(2); A("play", "ev_glass");
    var got = reagentsOf(r, r.int(2, 4), G().L >= 4).map(function (id) { return give(id); });
    say(how + "Вы перебираете склянки по описи и берёте нужное: " + got.join(" ") + " Работать с этим — у химического стола, руками.");
    ev("reagents", 1);
  };
  if (!s.rgLock) { take(""); return; }
  var items = [];
  if ((g.inv.lockpick || 0) > 0) items.push({ label: "Открыть висячий замок отмычкой — отмычек " + g.inv.lockpick, fn: function () { g.inv.lockpick--; take("Замок щёлкает. "); } });
  var paste = LAB.chem && LAB.chem.pasteOk && LAB.chem.pasteOk();
  if (paste) items.push({ label: "Разъесть замок кислотной пастой — тихо", fn: function () { LAB.chem.usePaste(); take("Паста шипит полминуты, дужка замка рассыпается ржавой крошкой. "); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", "Шкаф с реактивами заперт", items, { intro: "На дверцах — висячий замок: ценные реактивы держат под ключом. Отмычка или кислотная паста — и шкаф ваш." });
}
/* шкаф с химическим замком: задача — и ценное внутри */
function chemsafe(o) {
  var s = st(o);
  if (s.csOpen) { say("Шкаф открыт и пуст: ценные реактивы вы уже забрали."); return; }
  var kinds = ["titr", "vials", "spectr", "protocol"], k = kinds[h32(o.id + ":" + CUR().key) % kinds.length], d = Math.min(2, Math.floor(G().L / 12) + (h32("csd:" + o.id) % 2));
  LAB.puzzles.open(k, (h32("cs:" + o.id + ":" + CUR().key + ":" + (s.pzN || 0)) % 99991) + 1, function (ok, away, fresh) {
    if (!ok && away) { if (fresh) s.pzN = (s.pzN || 0) + 1; return; } /* отошли: нетронутая задача ждёт, начатая сменится */
    if (!ok) { s.pzN = (s.pzN || 0) + 1; say("Датчик замка гаснет: ячейку нужно промыть и заправить заново — задача будет другой. Попробуйте ещё раз, когда будете готовы."); return; }
    s.csOpen = 1;
    var r = rng(o, "cs"), got = reagentsOf(r, r.int(2, 3), true).map(function (id) { return give(id); });
    var L = G().L, F = G().F, cr = LAB.credits(15 + 3 * Math.min(L, 30), L, F);
    G().credits += cr;
    A("play", "door_unlock");
    say("Ячейка щёлкает, замок отпускает дверцу. Внутри: " + got.join(" ") + " И конверт с премией лаборанту: " + cr + " " + pl(cr, "кредит", "кредита", "кредитов") + ".");
    ev("chemsafe", 1);
  }, { title: "Химический замок", lead: "Замок откроется, если показать, что вы химик. ", diff: d });
}
/* банка с кислотой: вещь на дне — сначала нейтрализовать */
function acidjar(o) {
  var s = st(o);
  if (s.ajDone) { say("В банке — нейтральная вода с солью. На дне пусто: вещь вы уже достали."); return; }
  var d = Math.min(2, Math.floor(G().L / 15));
  LAB.puzzles.open("titr", (h32("aj:" + o.id + ":" + CUR().key + ":" + (s.pzN || 0)) % 99991) + 1, function (ok, away, fresh) {
    if (!ok && away) { if (fresh) s.pzN = (s.pzN || 0) + 1; return; }
    if (!ok) { s.pzN = (s.pzN || 0) + 1; say("Кислота всё ещё едкая: лезть туда рукой нельзя. Попробуйте ещё раз — с новой порцией щёлочи."); return; }
    s.ajDone = 1;
    var r = rng(o, "aj"), L = G().L, F = G().F, loot = LAB.annexLoot ? LAB.annexLoot(r, L, F, "stash", "desk", true).filter(function (x) { return x.kind !== "weapon" && x.kind !== "armor"; }).slice(0, 2) : [];
    if (!loot.length) loot.push({ kind: "credits", n: LAB.credits(25, L, F) });
    if (r.chance(0.3)) loot.push({ kind: "item", item: "film", n: 1 });
    var got = loot.map(function (it) { return gm().giveItem(it); });
    A("play", "pick_part");
    say("Раствор нейтрален: вы засучиваете рукав и достаёте со дна: " + got.join(" "));
    ev("acidjar", 1);
  }, { title: "Банка с кислотой", lead: "Чтобы достать вещь со дна, кислоту нужно погасить щёлочью — ровно до нейтрали, иначе обожжёт и щёлочью. ", diff: d });
}
function act(o, def, kind, p) {
  if (kind === "reagents") { reagents(o); return true; }
  if (kind === "chemsafe") { chemsafe(o); return true; }
  if (kind === "acidjar") { acidjar(o); return true; }
  return false;
}

LAB.chempuz = { KINDS: KINDS, NAMES: NAMES, act: act, reward: reward, _pair: pair, _amb: ambiguous, _VS: VS, _last: function () { return last; } };
})();
