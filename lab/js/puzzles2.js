/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — логические замки, часть вторая (2.0).
   Тринадцать видов задач из жизни комплекса, у каждой три сложности
   (opts.diff: 0 — простая, 1 — средняя, 2 — сложная): мерные сосуды,
   весы с пробами, щит освещения, перекладка контейнеров, логическая
   плата, двоичный замок, шифр смены, показания датчика, калибровка,
   перевозка через шлюз, программа уборщика, стеллаж реактивов, замок
   с подсказками. Всё — окнами меню, условие можно переслушать, текущее
   положение всегда слышно в пунктах или в пункте «Что сейчас».
   Подключается после puzzles.js: виды регистрируются через
   LAB.puzzles.register, окно условия и три попытки — его run.
   Генераторы — чистые функции зерна и сложности (без окон и без
   Math.random): решение есть всегда, а где ответ один — он один
   (проверено перебором прямо в генераторе).
   Для проверок: LAB.puzzles._last = { kind, diff, plan, wrong, ... } —
   plan — начала надписей пунктов, которые решают задачу из главного
   меню (после окна условия), wrong[k] — путь, который тратит k+1-ю
   попытку; LAB.puzzles2.plan(вид, зерно, сложность) — тот же план без
   окон. Начало надписи совпадает с пунктом, если за ним конец надписи
   или не буква и не цифра (LAB.puzzles2.match); первое совпадение по
   простому startsWith — тот же пункт.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
if (!LAB || !LAB.puzzles || !LAB.puzzles.register || !LAB.puzzles.util) {
  if (typeof console !== "undefined") console.warn("puzzles2.js: сначала нужен puzzles.js");
  return;
}
var U = LAB.puzzles.util, run = U.run, pl = U.pl, say = U.say, UIx = U.UIx, A = U.A;

/* ════════ ОБЩЕЕ ════════ */
var HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
var FEMW = ["ноль", "одна", "две", "три", "четыре", "пять", "шесть"];
var LETTER = /[0-9A-Za-zА-Яа-яЁё]/;
function diffOf(opts) {
  var d = opts && opts.diff != null ? Math.floor(Number(opts.diff)) : 1;
  if (d > 2) return 2;
  if (d < 0) return 0;
  return d >= 0 ? d : 1;
}
function rngFor(seed, kind, d, salt) { return U.rng(seed, "p2:" + kind + ":" + d + (salt != null ? ":" + salt : "")); }
function head(opts, d) { return (opts && opts.title ? opts.title + ". " : "") + HEADS[d] + " "; }
function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
function intList(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
function popcount(x) { var c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }
function andList(arr) { arr = arr.map(String); if (arr.length < 2) return arr.join(""); return arr.slice(0, -1).join(", ") + " и " + arr[arr.length - 1]; }
function num(v) { return v < 0 ? "минус " + (-v) : String(v); }
function nope(t) { A("play", "code_fail"); say(t); }
function act(label, fn) { return { label: label, keep: true, fn: fn }; }
function rep(arr, n) { var out = []; for (var i = 0; i < n; i++) out.push(arr); return out; }
function match(label, prefix) {
  label = String(label); prefix = String(prefix);
  if (label.indexOf(prefix) !== 0) return false;
  return label.length === prefix.length || !LETTER.test(label.charAt(prefix.length));
}
/* Запуск: запомнить план для проверок и открыть окно условия (run из puzzles.js). */
function start(kind, d, P, title, cond, build, cb) {
  var last = LAB.puzzles._last = { kind: kind, diff: d, plan: P.plan.slice(), wrong: P.wrong.map(function (w) { return w.slice(); }), sol: P.sol == null ? 1 : P.sol, data: P.data || null, cond: cond, st: null };
  last.st = run(title, cond, build, cb);
  return last.st;
}

/* ════════ 1. МЕРНЫЕ СОСУДЫ ════════
   Простая и средняя — два сосуда, кран и слив: отмерить ровно нужное.
   Сложная — три сосуда без крана и слива: разделить реактив поровну.
   Кратчайшее решение ищется поиском в ширину; действий — не больше
   кратчайшего с запасом в четыре. */
var JN = ["А", "Б", "В"];
function jugsMoves(caps, s, tap) {
  var out = [], i, j;
  if (tap) {
    for (i = 0; i < caps.length; i++) if (s[i] < caps[i]) { var f = s.slice(); f[i] = caps[i]; out.push({ m: { t: "fill", i: i }, s: f }); }
    for (i = 0; i < caps.length; i++) if (s[i] > 0) { var e = s.slice(); e[i] = 0; out.push({ m: { t: "empty", i: i }, s: e }); }
  }
  for (i = 0; i < caps.length; i++) for (j = 0; j < caps.length; j++) if (i !== j && s[i] > 0 && s[j] < caps[j]) {
    var p = s.slice(), x = Math.min(s[i], caps[j] - s[j]); p[i] -= x; p[j] += x; out.push({ m: { t: "pour", i: i, j: j }, s: p });
  }
  return out;
}
function jugsGoal(t, split) { return split ? function (s) { return s[0] === t && s[1] === t; } : function (s) { return s.indexOf(t) >= 0; }; }
function jugsBfs(caps, st, tap, goal) {
  var prev = {}, mv = {}, q = [st], k0 = st.join(",");
  prev[k0] = null;
  for (var qi = 0; qi < q.length; qi++) {
    var s = q[qi], ks = s.join(",");
    if (goal(s)) { var path = []; while (prev[ks] !== null) { path.unshift(mv[ks]); ks = prev[ks]; } return path; }
    var nx = jugsMoves(caps, s, tap);
    for (var n = 0; n < nx.length; n++) { var kt = nx[n].s.join(","); if (!Object.prototype.hasOwnProperty.call(prev, kt)) { prev[kt] = ks; mv[kt] = nx[n].m; q.push(nx[n].s); } }
  }
  return null;
}
var jugPools = {};
function jugsPool(d) {
  if (jugPools[d]) return jugPools[d];
  var pool = [], a, b, c, t, p;
  if (d < 2) {
    for (a = 2; a <= 9; a++) for (b = a + 1; b <= 13; b++) for (t = 1; t < b; t++) {
      if (t === a) continue;
      if (d === 0 && (a > 5 || b > 7)) continue;
      if (d === 1 && (a < 3 || b < 7)) continue;
      p = jugsBfs([a, b], [0, 0], true, jugsGoal(t, false));
      if (!p) continue;
      if (d === 0 ? (p.length === 4 || p.length === 6) : (p.length === 6 || p.length === 8)) pool.push([a, b, t]);
    }
  } else {
    /* три сосуда без крана: большой полон, отмерить ровно t в любом из них */
    for (a = 8; a <= 12; a++) for (b = 4; b < a; b++) for (c = 3; c < b; c++) for (t = 1; t < a; t++) {
      if (t === b || t === c) continue;
      p = jugsBfs([a, b, c], [a, 0, 0], false, jugsGoal(t, false));
      if (p && p.length >= 7 && p.length <= 10) pool.push([a, b, c, t]);
    }
  }
  jugPools[d] = pool;
  return pool;
}
function jugPrefix(m) { return m.t === "fill" ? "Наполнить " + JN[m.i] : m.t === "empty" ? "Вылить " + JN[m.i] : "Перелить из " + JN[m.i] + " в " + JN[m.j]; }
function genJugs(seed, d) {
  var r = rngFor(seed, "jugs", d), tap = d < 2, split = false, caps, st, t, c;
  if (tap) { c = r.pick(jugsPool(d)); caps = [c[0], c[1]]; st = [0, 0]; t = c[2]; }
  else if (r.chance(0.4)) { split = true; caps = r.pick([[8, 5, 3], [10, 7, 3], [12, 7, 5]]).slice(); st = [caps[0], 0, 0]; t = caps[0] / 2; }
  else { c = r.pick(jugsPool(2)); caps = [c[0], c[1], c[2]]; st = [c[0], 0, 0]; t = c[3]; }
  var path = jugsBfs(caps, st, tap, jugsGoal(t, split)), limit = path.length + 4, w = [];
  for (var i = 0; i < limit; i++) w.push(tap ? (i % 2 ? "Вылить А" : "Наполнить А") : (i % 2 ? "Перелить из Б в А" : "Перелить из А в Б"));
  return { caps: caps, start: st, t: t, tap: tap, split: split, limit: limit, min: path.length, plan: path.map(jugPrefix), wrong: rep(w, 3), sol: 1,
    data: { caps: caps, start: st, t: t, tap: tap, split: split, limit: limit, min: path.length } };
}
function jugs(seed, cb, opts) {
  var d = diffOf(opts), P = genJugs(seed, d), caps = P.caps, n = caps.length, s = P.start.slice(), used = 0;
  var L = function (v) { return pl(v, "литр", "литра", "литров"); };
  var po = function (v) { return pl(v, "литру", "литра", "литров"); };
  var goalText = P.split ? "Нужно по " + P.t + " " + po(P.t) + " в сосудах А и Б." : "Нужно ровно " + P.t + " " + L(P.t) + " в одном из сосудов.";
  var rules = "переливать из одного сосуда в другой можно, пока первый не опустеет или второй не наполнится.";
  var cond = head(opts, d) + "Мерные сосуды. " + (P.tap ?
    "Дозатору нужно ровно " + P.t + " " + L(P.t) + " реактива. Есть кран с реактивом, слив и два сосуда без делений: А — на " + caps[0] + " " + L(caps[0]) + ", Б — на " + caps[1] + " " + L(caps[1]) +
    ". Сосуд можно наполнить из крана доверху или вылить в слив до дна, а " + rules + " Как только в одном из сосудов окажется ровно " + P.t + " " + L(P.t) + ", дозатор примет реактив." :
    "Сосуды без делений: в А на " + caps[0] + " " + L(caps[0]) + " — реактив до краёв, Б на " + caps[1] + " и В на " + caps[2] + " " + L(caps[2]) + " пусты. Крана и слива нет: " + rules + " " +
    (P.split ? "Разделите реактив поровну: по " + P.t + " " + po(P.t) + " в сосудах А и Б." : "Отмерьте ровно " + P.t + " " + L(P.t) + " — в любом из сосудов, и дозатор примет реактив.")) +
    " Реактив выдыхается: на всё — не больше " + P.limit + " " + pl(P.limit, "действия", "действий", "действий") + ", иначе его придётся слить и начать сначала.";
  var stateText = function () { return s.map(function (v, i) { return JN[i] + " — " + v + " из " + caps[i]; }).join(", ") + "."; };
  var won = function () { return P.split ? (s[0] === P.t && s[1] === P.t) : s.indexOf(P.t) >= 0; };
  var reset = function () { s = P.start.slice(); used = 0; };
  start("jugs", d, P, "Мерные сосуды", cond, function (st, finish, fail) {
    var after = function (what) {
      used++;
      if (won()) {
        A("play", "code_ok");
        finish(true, P.split ? "В сосудах А и Б ровно по " + P.t + " " + po(P.t) + ". Реактив разделён поровну." : "В сосуде " + JN[s.indexOf(P.t)] + " ровно " + P.t + " " + L(P.t) + ". Дозатор принял реактив.");
        return;
      }
      if (used >= P.limit) { reset(); A("play", "term_err"); fail("Реактив выдохся: " + P.limit + " " + pl(P.limit, "действие", "действия", "действий") + " позади, а нужной дозы нет. Сосуды промыты, всё сначала."); return; }
      A("play", "term_beep");
      say(what + " " + stateText() + " Действий: " + used + " из " + P.limit + ".");
    };
    var out = [], i, j;
    if (P.tap) {
      for (i = 0; i < n; i++) (function (i) {
        out.push(act(function () { return "Наполнить " + JN[i] + " из крана: в " + JN[i] + " " + s[i] + " из " + caps[i]; }, function () {
          if (s[i] >= caps[i]) { nope("Сосуд " + JN[i] + " и так полон."); return; }
          s[i] = caps[i]; after("Налито.");
        }));
      })(i);
      for (i = 0; i < n; i++) (function (i) {
        out.push(act(function () { return "Вылить " + JN[i] + " в слив: в " + JN[i] + " " + s[i]; }, function () {
          if (!s[i]) { nope("Сосуд " + JN[i] + " и так пуст."); return; }
          s[i] = 0; after("Вылито.");
        }));
      })(i);
    }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (i !== j) (function (i, j) {
      out.push(act(function () { return "Перелить из " + JN[i] + " в " + JN[j] + ": в " + JN[i] + " " + s[i] + ", в " + JN[j] + " " + s[j] + " из " + caps[j]; }, function () {
        if (!s[i]) { nope("В сосуде " + JN[i] + " пусто — переливать нечего."); return; }
        if (s[j] >= caps[j]) { nope("Сосуд " + JN[j] + " полон — лить некуда."); return; }
        var x = Math.min(s[i], caps[j] - s[j]); s[i] -= x; s[j] += x;
        after((x % 10 === 1 && x % 100 !== 11 ? "Перелит " : "Перелито ") + x + " " + L(x) + ".");
      }));
    })(i, j);
    out.push(act("Что сейчас", function () { say(stateText() + " Действий: " + used + " из " + P.limit + ". " + goalText); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Сосуды промыты, всё сначала. " + stateText()); }));
    return out;
  }, cb);
}

/* ════════ 2. ВЕСЫ С ПРОБАМИ ════════
   Одна проба заражена и отличается по весу; весы отвечают честно, а
   взвешиваний мало. Ошибка — новая партия (заражённая проба другая, по
   тому же зерну), взвешивания заново: угадывать бесполезно. Простая —
   3–5 проб, средняя — 8–9 проб и два взвешивания, сложная — 12 проб,
   тяжелее заражённая или легче — неизвестно, три взвешивания. */
function scalesSolve(n, hl, odd, sign) {
  var steps = [];
  var weigh = function (L, R) {
    var x = 0;
    L.forEach(function (v) { if (v === odd) x += sign; });
    R.forEach(function (v) { if (v === odd) x -= sign; });
    var res = x > 0 ? 1 : x < 0 ? -1 : 0;
    steps.push({ L: L, R: R, res: res });
    return res;
  };
  if (!hl) {
    var cand = []; for (var i = 1; i <= n; i++) cand.push(i);
    while (cand.length > 1) {
      var g = Math.ceil(cand.length / 3), L = cand.slice(0, g), R = cand.slice(g, 2 * g), rest = cand.slice(2 * g);
      var x = weigh(L, R); cand = x > 0 ? L : x < 0 ? R : rest;
    }
    return { steps: steps, answer: cand[0] };
  }
  /* двенадцать проб, тяжелее или легче — неизвестно: классическое решение в три взвешивания */
  var a, r1 = weigh([1, 2, 3, 4], [5, 6, 7, 8]);
  if (r1 === 0) {
    var r2 = weigh([9, 10, 11], [1, 2, 3]);
    if (r2 === 0) a = 12;
    else { var r3 = weigh([9], [10]); a = r3 === 0 ? 11 : (r3 === r2 ? 9 : 10); }
  } else {
    var q2 = weigh([1, 2, 5], [3, 6, 9]);
    if (q2 === r1) { var q3 = weigh([1], [2]); a = q3 === 0 ? 6 : (q3 === r1 ? 1 : 2); }
    else if (q2 === -r1) { var q4 = weigh([3], [9]); a = q4 === 0 ? 5 : 3; }
    else { var q5 = weigh([7], [8]); a = q5 === 0 ? 4 : (q5 === r1 ? 8 : 7); }
  }
  return { steps: steps, answer: a };
}
function genScales(seed, d) {
  var r = rngFor(seed, "scales", d);
  var n = d === 0 ? r.pick([3, 4, 5]) : d === 1 ? r.pick([8, 9]) : 12;
  var K = d === 0 ? (n === 3 ? 1 : 2) : d === 1 ? 2 : 3, hl = d === 2, rounds = [];
  for (var k = 0; k < 4; k++) { var rr = rngFor(seed, "scales", d, "r" + k); rounds.push({ odd: rr.int(1, n), sign: hl ? (rr.chance(0.5) ? 1 : -1) : 1 }); }
  var sv = scalesSolve(n, hl, rounds[0].odd, rounds[0].sign), plan = [];
  sv.steps.forEach(function (stp) {
    plan.push("Левая чаша"); stp.L.forEach(function (x) { plan.push("Проба " + x); }); plan.push("Готово");
    plan.push("Правая чаша"); stp.R.forEach(function (x) { plan.push("Проба " + x); }); plan.push("Готово");
    plan.push("Взвесить"); plan.push("Снять всё с весов");
  });
  plan.push("Назвать пробу"); plan.push("Проба " + sv.answer);
  var wrong = rounds.slice(0, 3).map(function (ro) { return ["Назвать пробу", "Проба " + (ro.odd % n + 1)]; });
  return { n: n, K: K, hl: hl, rounds: rounds, plan: plan, wrong: wrong, sol: sv.answer === rounds[0].odd && sv.steps.length <= K ? 1 : 0,
    data: { n: n, K: K, hl: hl, odd: rounds[0].odd, sign: rounds[0].sign } };
}
function scales(seed, cb, opts) {
  var d = diffOf(opts), P = genScales(seed, d), n = P.n, K = P.K;
  var round = 0, left = [], right = [], hist = [], used = 0;
  var nm = function (arr) { return arr.length ? andList(arr.slice().sort(function (a, b) { return a - b; })) : "пусто"; };
  var where = function (x) { return left.indexOf(x) >= 0 ? "на левой чаше" : right.indexOf(x) >= 0 ? "на правой чаше" : "на столе"; };
  var del = function (arr, x) { var k = arr.indexOf(x); if (k >= 0) arr.splice(k, 1); };
  var resText = function (x) { return x > 0 ? "левая чаша тяжелее" : x < 0 ? "правая чаша тяжелее" : "равновесие"; };
  var cond = head(opts, d) + "Весы с пробами. На столе " + n + " " + pl(n, "проба", "пробы", "проб") + " с номерами от 1 до " + n + " и рычажные весы с двумя чашами. " +
    (P.hl ? "Одна проба заражена и отличается по весу, но тяжелее она или легче — неизвестно; остальные весят одинаково. " : "Одна проба заражена — она чуть тяжелее, остальные весят одинаково. ") +
    "После " + K + " " + pl(K, "взвешивания", "взвешиваний", "взвешиваний") + " весы опечатают. Кладите на чаши поровну проб и взвешивайте: весы скажут, какая чаша тяжелее, или покажут равновесие. Потом назовите номер заражённой пробы. Ошибётесь — придёт новая партия, и взвешивать придётся заново.";
  var pan = function (side) {
    var items = [];
    for (var x = 1; x <= n; x++) (function (x) {
      items.push(act(function () { return "Проба " + x + ": " + where(x); }, function () {
        var mine = side ? right : left, other = side ? left : right;
        if (mine.indexOf(x) >= 0) { del(mine, x); A("play", "term_off"); say("Проба " + x + " — снова на столе."); return; }
        del(other, x); mine.push(x); A("play", "term_beep");
        say("Проба " + x + " — на " + (side ? "правую" : "левую") + " чашу. Слева " + left.length + ", справа " + right.length + ".");
      }));
    })(x);
    items.push({ label: "Готово", close: true, fn: function () {} });
    UIx("menu", side ? "Правая чаша" : "Левая чаша", items);
  };
  start("scales", d, P, "Весы с пробами", cond, function (st, finish, fail) {
    var weigh = function () {
      if (used >= K) { nope("Весы опечатаны: все взвешивания сделаны. Назовите заражённую пробу."); return; }
      if (!left.length || !right.length) { nope("Положите пробы на обе чаши."); return; }
      if (left.length !== right.length) { nope("На чашах должно быть поровну проб: слева " + left.length + ", справа " + right.length + "."); return; }
      var ro = P.rounds[round], x = 0;
      left.forEach(function (v) { if (v === ro.odd) x += ro.sign; });
      right.forEach(function (v) { if (v === ro.odd) x -= ro.sign; });
      used++;
      hist.push("Взвешивание " + used + ": слева " + nm(left) + ", справа " + nm(right) + " — " + resText(x) + ".");
      A("play", "scan");
      say(cap(resText(x)) + ". Осталось взвешиваний: " + (K - used) + ".");
    };
    var answer = function () {
      var items = [];
      for (var x = 1; x <= n; x++) (function (x) {
        items.push({ label: "Проба " + x, fn: function () {
          var ro = P.rounds[round];
          if (x === ro.odd) { A("play", "code_ok"); finish(true, "Верно: заражена проба " + x + ". Её убрали в изолятор, остальные пробы чисты."); return; }
          A("play", "term_err");
          round = Math.min(round + 1, P.rounds.length - 1); left.length = 0; right.length = 0; hist = []; used = 0;
          fail("Мимо: проба " + x + " чистая. Лаборант принёс новую партию — взвешивать придётся заново.");
        } });
      })(x);
      UIx("menu", "Какая проба заражена", items);
    };
    return [
      act(function () { return "Левая чаша: " + nm(left); }, function () { pan(0); }),
      act(function () { return "Правая чаша: " + nm(right); }, function () { pan(1); }),
      act(function () { return "Взвесить: осталось " + (K - used) + " из " + K; }, weigh),
      act("Снять всё с весов", function () { left.length = 0; right.length = 0; A("play", "term_off"); say("Чаши пусты, все пробы на столе."); }),
      act("Журнал взвешиваний", function () { say(hist.length ? hist.join(" ") + " Осталось взвешиваний: " + (K - used) + "." : "Взвешиваний ещё не было. Их можно сделать " + K + "."); }),
      act("Назвать пробу", answer)
    ];
  }, cb);
}

/* ════════ 3. ЩИТ ОСВЕЩЕНИЯ ════════
   Клавиша переключает свою лампу и соседние; зажечь все. Простая — пять
   ламп в ряд, средняя — квадрат три на три (соседи по сторонам), сложная —
   три на три, соседи только по диагонали. Положение строится из горящего
   щита нажатиями — решение есть всегда; кратчайшее ищется перебором. */
function lightMasks(d) {
  var m = [], i, r, c, dr, dc;
  if (d === 0) { for (i = 0; i < 5; i++) { var x = 1 << i; if (i > 0) x |= 1 << (i - 1); if (i < 4) x |= 1 << (i + 1); m.push(x); } return m; }
  for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
    var y = 0;
    for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
      var rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr > 2 || cc > 2) continue;
      var self = !dr && !dc, orth = Math.abs(dr) + Math.abs(dc) === 1, diag = Math.abs(dr) === 1 && Math.abs(dc) === 1;
      if (self || (d === 1 ? orth : diag)) y |= 1 << (rr * 3 + cc);
    }
    m.push(y);
  }
  return m;
}
function lampName(d, i) { return d === 0 ? "Лампа " + (i + 1) : "Ряд " + (Math.floor(i / 3) + 1) + ", лампа " + (i % 3 + 1); }
function genLights(seed, d) {
  var r = rngFor(seed, "lights", d), masks = lightMasks(d), n = masks.length, ALL = (1 << n) - 1;
  var want = d === 0 ? r.int(2, 3) : d === 1 ? r.int(3, 4) : r.int(4, 5), state = ALL, best = 0, guard = 0;
  for (;;) {
    var idx = intList(n); r.shuffle(idx);
    var eff = 0; for (var k = 0; k < want; k++) eff ^= masks[idx[k]];
    state = ALL ^ eff; best = -1;
    for (var s = 0; s <= ALL; s++) {
      var e = 0; for (var i = 0; i < n; i++) if (s >> i & 1) e ^= masks[i];
      if (e === eff && (best < 0 || popcount(s) < popcount(best))) best = s;
    }
    if ((popcount(best) >= Math.min(want, d + 2) && n - popcount(state) >= (d ? 2 : 1)) || ++guard > 60) break;
  }
  var min = popcount(best), limit = 2 * min + 4, plan = [];
  for (var j = 0; j < n; j++) if (best >> j & 1) plan.push(lampName(d, j));
  return { n: n, masks: masks, state: state, min: min, limit: limit, plan: plan, wrong: rep(rep(lampName(d, 0), limit), 3), sol: 1,
    data: { n: n, masks: masks, state: state, min: min, limit: limit } };
}
function lights(seed, cb, opts) {
  var d = diffOf(opts), P = genLights(seed, d), n = P.n, ALL = (1 << n) - 1, state = P.state, used = 0;
  var board = function (sv) {
    var i, on = [], off = [];
    if (d === 0) {
      for (i = 0; i < n; i++) (sv >> i & 1 ? on : off).push(i + 1);
      if (!off.length) return "горят все лампы";
      if (!on.length) return "не горит ни одна лампа";
      if (on.length === 1) return "горит только лампа " + on[0] + ", остальные не горят";
      if (off.length === 1) return "не горит только лампа " + off[0] + ", остальные горят";
      return "горят " + andList(on) + ", не горят " + andList(off);
    }
    var rows = [];
    for (var r = 0; r < 3; r++) {
      var rw = []; for (var c = 0; c < 3; c++) if (sv >> (r * 3 + c) & 1) rw.push(c + 1);
      rows.push("в ряду " + (r + 1) + " — " + (rw.length === 3 ? "все" : rw.length ? andList(rw) : "ни одной"));
    }
    return "горят: " + rows.join("; ");
  };
  var cond = head(opts, d) + "Щит освещения. " + (d === 0 ?
    "Пять ламп в ряд, слева направо, у каждой своя клавиша. Клавиша переключает свою лампу и соседние — слева и справа; у крайних ламп сосед один." :
    "Девять ламп квадратом, три ряда по три. Ряды считаются сверху вниз, лампы в ряду — слева направо; у каждой лампы своя клавиша. " +
    (d === 1 ? "Клавиша переключает свою лампу и соседние по сторонам — сверху, снизу, слева и справа; по диагонали — нет." : "Клавиша переключает свою лампу и соседние только по диагонали; лампы сверху, снизу и по бокам не меняются.")) +
    " Горевшая лампа гаснет, погасшая загорается. Зажгите все лампы. Реле изношены: не больше " + P.limit + " " + pl(P.limit, "нажатия", "нажатий", "нажатий") +
    ", иначе щит перегреется и сбросится. Сейчас " + board(P.state) + ".";
  start("lights", d, P, "Щит освещения", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < n; i++) (function (i) {
      out.push(act(function () { return lampName(d, i) + ": " + (state >> i & 1 ? "горит" : "не горит"); }, function () {
        state ^= P.masks[i]; used++;
        if (state === ALL) { A("play", "power_on"); finish(true, "Все лампы горят: щит освещения в порядке."); return; }
        if (used >= P.limit) { state = P.state; used = 0; A("play", "term_err"); fail("Реле перегрелись: щит сбросился в начальное положение."); return; }
        A("play", state >> i & 1 ? "term_beep" : "term_off");
        say(cap(board(state)) + ". Нажатий: " + used + " из " + P.limit + ".");
      }));
    })(i);
    out.push(act("Что на щите", function () { say(cap(board(state)) + ". Нажатий: " + used + " из " + P.limit + "."); }));
    out.push(act("Начать заново", function () { state = P.state; used = 0; A("play", "term_off"); say("Щит в начальном положении. " + cap(board(state)) + "."); }));
    return out;
  }, cb);
}

/* ════════ 4. ПЕРЕКЛАДКА КОНТЕЙНЕРОВ ════════
   Ханойская башня на складе: тяжёлый контейнер нельзя ставить на лёгкий.
   Простая — три контейнера, средняя — четыре, сложная — пять, и они уже
   расставлены по поддонам вразнобой. Перестановок — кратчайшее число
   с небольшим запасом (поиск в ширину по всем расстановкам). */
var PAL = ["А", "Б", "В"], ORDM = { 3: "третий", 4: "четвёртый", 5: "пятый" };
function hTop(pos, peg) { for (var i = 0; i < pos.length; i++) if (pos[i] === peg) return i; return -1; }
function hMoves(pos) {
  var out = [];
  for (var f = 0; f < 3; f++) {
    var tf = hTop(pos, f); if (tf < 0) continue;
    for (var t = 0; t < 3; t++) { if (t === f) continue; var tt = hTop(pos, t); if (tt < 0 || tt > tf) out.push([f, t]); }
  }
  return out;
}
function hanoiBfs(pos0, target) {
  var prev = {}, mv = {}, q = [pos0], k0 = pos0.join("");
  prev[k0] = null;
  for (var qi = 0; qi < q.length; qi++) {
    var p = q[qi], kp = p.join("");
    if (p.every(function (x) { return x === target; })) { var path = []; while (prev[kp] !== null) { path.unshift(mv[kp]); kp = prev[kp]; } return path; }
    var ms = hMoves(p);
    for (var i = 0; i < ms.length; i++) {
      var np = p.slice(); np[hTop(p, ms[i][0])] = ms[i][1];
      var kn = np.join("");
      if (!Object.prototype.hasOwnProperty.call(prev, kn)) { prev[kn] = kp; mv[kn] = ms[i]; q.push(np); }
    }
  }
  return null;
}
function genHanoi(seed, d) {
  var r = rngFor(seed, "hanoi", d), n = 3 + d, target = r.int(0, 2), pos = [], path, guard = 0, i, src = -1;
  /* простая — всегда стопка; средняя — стопка или вразнобой; сложная — вразнобой */
  var tower = d === 0 || (d === 1 && r.chance(0.5)), lo = d === 1 ? 10 : 18;
  if (tower) { src = (target + r.int(1, 2)) % 3; for (i = 0; i < n; i++) pos.push(src); path = hanoiBfs(pos, target); }
  else for (;;) {
    pos = []; for (i = 0; i < n; i++) pos.push(r.int(0, 2));
    path = hanoiBfs(pos, target);
    if ((path.length >= lo && path.length <= Math.pow(2, n) - 1) || ++guard > 300) break;
  }
  var limit = path.length + [3, 4, 5][d], mv = hMoves(pos)[0], w = [];
  for (i = 0; i < limit; i++) w.push(i % 2 ? "С " + PAL[mv[1]] + " на " + PAL[mv[0]] : "С " + PAL[mv[0]] + " на " + PAL[mv[1]]);
  return { n: n, target: target, src: src, tower: tower, start: pos, min: path.length, limit: limit, sol: 1,
    plan: path.map(function (m) { return "С " + PAL[m[0]] + " на " + PAL[m[1]]; }), wrong: rep(w, 3),
    data: { n: n, target: target, tower: tower, start: pos.slice(), min: path.length, limit: limit } };
}
function hanoi(seed, cb, opts) {
  var d = diffOf(opts), P = genHanoi(seed, d), n = P.n, pos = P.start.slice(), used = 0;
  var stackOf = function (p, peg) {
    var arr = []; for (var i = n - 1; i >= 0; i--) if (p[i] === peg) arr.push(i + 1);
    return !arr.length ? "пусто" : arr.length === 1 ? "контейнер " + arr[0] : "снизу вверх " + arr.join(", ");
  };
  var stacks = function (p) { return PAL.map(function (nmP, g) { return "поддон " + nmP + " — " + stackOf(p, g); }).join("; "); };
  var cond = head(opts, d) + "Перекладка контейнеров. Три поддона — А, Б и В. " +
    (P.tower ? "На поддоне " + PAL[P.src] + " стопка из " + n + " контейнеров: снизу самый тяжёлый, сверху самый лёгкий. " : (n === 4 ? "Четыре" : "Пять") + " контейнеров уже расставлены: " + stacks(P.start) + ". ") +
    "Контейнеры пронумерованы по весу: первый — самый лёгкий, " + ORDM[n] + " — самый тяжёлый. Погрузчик берёт только верхний контейнер и ставит его на другой поддон. Тяжёлый контейнер нельзя ставить на более лёгкий — раздавит. " +
    (P.tower ? "Переставьте всю стопку на поддон " : "Соберите все контейнеры одной стопкой на поддоне ") + PAL[P.target] + ". Погрузчик на смене ненадолго: не больше " + P.limit + " " + pl(P.limit, "перестановки", "перестановок", "перестановок") + ".";
  start("hanoi", d, P, "Перекладка контейнеров", cond, function (st, finish, fail) {
    var out = [];
    for (var f = 0; f < 3; f++) for (var t = 0; t < 3; t++) if (f !== t) (function (f, t) {
      out.push(act(function () {
        var tf = hTop(pos, f), tt = hTop(pos, t), h = "С " + PAL[f] + " на " + PAL[t] + ": ";
        if (tf < 0) return h + "на " + PAL[f] + " пусто";
        if (tt < 0) return h + "контейнер " + (tf + 1) + " на пустой поддон";
        return h + "контейнер " + (tf + 1) + " на контейнер " + (tt + 1) + (tt > tf ? "" : " — нельзя");
      }, function () {
        var tf = hTop(pos, f), tt = hTop(pos, t);
        if (tf < 0) { nope("На поддоне " + PAL[f] + " пусто."); return; }
        if (tt >= 0 && tt < tf) { nope("Нельзя: контейнер " + (tf + 1) + " тяжелее контейнера " + (tt + 1) + " — раздавит."); return; }
        pos[tf] = t; used++;
        if (pos.every(function (x) { return x === P.target; })) { A("play", "code_ok"); finish(true, "Все контейнеры на поддоне " + PAL[P.target] + ", тяжёлые внизу. Склад принят."); return; }
        if (used >= P.limit) { pos = P.start.slice(); used = 0; A("play", "term_err"); fail("Перестановок больше нет: смена погрузчика кончилась. Контейнеры вернули на места."); return; }
        A("play", "term_beep");
        say("Контейнер " + (tf + 1) + " — на поддоне " + PAL[t] + ". Перестановок: " + used + " из " + P.limit + ".");
      }));
    })(f, t);
    out.push(act("Что сейчас", function () { say(cap(stacks(pos)) + ". Перестановок: " + used + " из " + P.limit + ". Цель — всё на поддоне " + PAL[P.target] + "."); }));
    out.push(act("Начать заново", function () { pos = P.start.slice(); used = 0; A("play", "term_off"); say("Контейнеры на исходных местах: " + stacks(pos) + "."); }));
    return out;
  }, cb);
}

/* ════════ 5. ЛОГИЧЕСКАЯ ПЛАТА ════════
   Тумблеры — входы, элементы И, ИЛИ, НЕ, исключающее ИЛИ описаны словами
   по порядку; лампа — на выходе. Положение тумблеров, при котором лампа
   горит, — единственное (перебор всех положений; если их несколько —
   защита «ровно k тумблеров» оставляет одно). Простая — два тумблера и
   один-два элемента, средняя — три тумблера и три элемента, сложная —
   четыре тумблера и четыре-пять элементов. Лампа зажигается только при
   подаче питания: перебирать вслепую нельзя. */
var GOP = { and: "логическое И", or: "логическое ИЛИ", xor: "исключающее ИЛИ", not: "логическое НЕ" };
var GRULE = { and: "логическое И горит, когда горят оба его входа", or: "логическое ИЛИ горит, когда горит хотя бы один вход",
  xor: "исключающее ИЛИ горит, когда горит ровно один из двух входов", not: "логическое НЕ переворачивает сигнал: горит, когда его вход не горит" };
function gTree(r, leaves, ops) {
  if (leaves.length === 1) return { k: "in", i: leaves[0] };
  var cut = r.int(1, leaves.length - 1);
  return { k: r.pick(ops), a: gTree(r, leaves.slice(0, cut), ops), b: gTree(r, leaves.slice(cut), ops) };
}
function gNodes(t, out) { out.push(t); if (t.a) gNodes(t.a, out); if (t.b) gNodes(t.b, out); return out; }
function gEval(t, x) {
  var v = t.k === "in" ? (x >> t.i) & 1 : t.k === "and" ? gEval(t.a, x) & gEval(t.b, x) : t.k === "or" ? gEval(t.a, x) | gEval(t.b, x) : gEval(t.a, x) ^ gEval(t.b, x);
  return t.neg ? 1 - v : v;
}
function gNet(t, els) {
  var ref;
  if (t.k === "in") ref = { t: "in", n: t.i + 1 };
  else { var ra = gNet(t.a, els), rb = gNet(t.b, els); els.push({ op: t.k, ins: [ra, rb] }); ref = { t: "el", n: els.length }; }
  if (t.neg) { els.push({ op: "not", ins: [ref] }); ref = { t: "el", n: els.length }; }
  return ref;
}
function gFrom(ins) {
  var w = function (x, many) { return x.t === "in" ? (many ? "тумблеров " : "тумблера ") : (many ? "элементов " : "элемента "); };
  if (ins.length === 1) return w(ins[0]) + ins[0].n;
  var a = ins[0], b = ins[1];
  if (a.t === b.t) return w(a, true) + Math.min(a.n, b.n) + " и " + Math.max(a.n, b.n);
  return w(a) + a.n + " и " + w(b) + b.n;
}
function genGates(seed, d) {
  var r = rngFor(seed, "gates", d), n = d + 2, ops = d === 0 ? ["and", "or"] : ["and", "or", "xor"], tree, need = 0, sol = -1, S = [], guard = 0, k, x;
  for (;;) {
    guard++;
    var leaves = intList(n); r.shuffle(leaves);
    tree = gTree(r, leaves, ops);
    var nodes = gNodes(tree, []), nn = d === 0 ? r.int(0, 1) : d === 1 ? 1 : r.int(1, 2);
    r.shuffle(nodes); for (k = 0; k < nn; k++) nodes[k].neg = true;
    S = []; for (x = 0; x < (1 << n); x++) if (gEval(tree, x)) S.push(x);
    need = 0; sol = -1;
    if (S.length === 1) sol = S[0];
    else if (S.length > 1) {
      var ks = []; for (k = 1; k < n; k++) ks.push(k); r.shuffle(ks);
      for (var q = 0; q < ks.length && sol < 0; q++) {
        var f = S.filter(function (v) { return popcount(v) === ks[q]; });
        if (f.length === 1) { need = ks[q]; sol = f[0]; }
      }
    }
    if (sol <= 0 || sol === (1 << n) - 1) { if (guard < 500) continue; }
    var used = {}; gNodes(tree, []).forEach(function (nd) { if (nd.k !== "in") used[nd.k] = 1; if (nd.neg) used.not = 1; });
    if (d === 2 && !used.xor && !used.or && guard < 500) continue;
    break;
  }
  var els = []; gNet(tree, els);
  var plan = [], i;
  for (i = 0; i < n; i++) if (sol >> i & 1) plan.push("Тумблер " + (i + 1));
  plan.push("Подать питание");
  var w = 0;
  if (need) { for (x = 0; x < (1 << n); x++) if (popcount(x) === need && x !== sol) { w = x; break; } }
  var wp = ["Выключить все тумблеры"];
  for (i = 0; i < n; i++) if (w >> i & 1) wp.push("Тумблер " + (i + 1));
  wp.push("Подать питание");
  var cnt = 0; for (x = 0; x < (1 << n); x++) if (gEval(tree, x) && (!need || popcount(x) === need)) cnt++;
  return { n: n, tree: tree, els: els, need: need, solution: sol, plan: plan, wrong: rep(wp, 3), sol: cnt,
    data: { n: n, tree: tree, need: need, solution: sol, gates: els.length } };
}
function gates(seed, cb, opts) {
  var d = diffOf(opts), P = genGates(seed, d), n = P.n, sw = 0;
  var opsUsed = []; ["and", "or", "xor", "not"].forEach(function (o) { if (P.els.some(function (e) { return e.op === o; })) opsUsed.push(o); });
  var net = P.els.map(function (e, k) { return "Элемент " + (k + 1) + " — " + GOP[e.op] + " от " + gFrom(e.ins) + "."; }).join(" ") + " Лампа подключена к выходу элемента " + P.els.length + ".";
  var needText = P.need ? " Защита платы: питание пройдёт, только если включённых тумблеров ровно " + P.need + "." : "";
  var cond = head(opts, d) + "Логическая плата. На плате " + n + " " + pl(n, "тумблер", "тумблера", "тумблеров") + " — входы схемы, а на выходе — лампа замка. Включённый тумблер даёт горящий сигнал, выключенный — нет. " +
    cap(opsUsed.map(function (o) { return GRULE[o]; }).join("; ")) + ". Схема платы такая. " + net + needText +
    " Включите нужные тумблеры и подайте питание: лампа должна загореться. Подходит только одно положение тумблеров.";
  var onList = function () { var a = []; for (var i = 0; i < n; i++) if (sw >> i & 1) a.push(i + 1); return a; };
  start("gates", d, P, "Логическая плата", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < n; i++) (function (i) {
      out.push(act(function () { return "Тумблер " + (i + 1) + ": " + (sw >> i & 1 ? "включён" : "выключен"); }, function () {
        sw ^= 1 << i; var on = sw >> i & 1;
        A("play", on ? "term_beep" : "term_off");
        say("Тумблер " + (i + 1) + (on ? " включён." : " выключен."));
      }));
    })(i);
    out.push(act("Подать питание", function () {
      var c = popcount(sw);
      if (P.need && c !== P.need) {
        nope("Защита не пускает питание: нужно ровно " + P.need + " " + pl(P.need, "включённый тумблер", "включённых тумблера", "включённых тумблеров") + ", а сейчас " + (c ? "их " + c : "не включено ни одного") + ".");
        return;
      }
      if (gEval(P.tree, sw)) { A("play", "power_on"); finish(true, "Лампа загорелась! Плата отперла замок."); return; }
      A("play", "term_err"); fail("Лампа не загорелась.");
    }));
    out.push(act("Выключить все тумблеры", function () { sw = 0; A("play", "term_off"); say("Все тумблеры выключены."); }));
    out.push(act("Схема платы", function () {
      var on = onList();
      say(net + needText + " Сейчас " + (on.length ? (on.length === 1 ? "включён тумблер " : "включены тумблеры ") + andList(on) : "все тумблеры выключены") + ".");
    }));
    return out;
  }, cb);
}

/* ════════ 6. ДВОИЧНЫЙ ЗАМОК ════════
   Тумблеры — разряды двоичного числа, старший слева. Простая — четыре
   разряда с подписанными весами, средняя — шесть, сложная — восемь, и
   замок сперва переворачивает тумблеры по маске с таблички. Набранное
   число замок называет только при вводе (ошибка тратит попытку). */
function genBinary(seed, d) {
  var r = rngFor(seed, "binary", d), bits = d === 0 ? 4 : d === 1 ? 6 : 8, target = 0, mask = 0, sw = 0;
  for (var guard = 0; guard < 500; guard++) {
    target = d === 0 ? r.int(3, 15) : d === 1 ? r.int(21, 63) : r.int(70, 250);
    mask = 0;
    if (d === 2) { var mb = intList(8); r.shuffle(mb); var mk = r.int(3, 5); for (var k = 0; k < mk; k++) mask |= 1 << mb[k]; }
    sw = target ^ mask;
    if (popcount(sw) < (d === 0 ? 2 : 3)) continue;
    if (d === 1 && popcount(target) < 3) continue;
    if (d === 2 && popcount(sw) > 6) continue;
    break;
  }
  var plan = [];
  for (var i = 0; i < bits; i++) if (sw >> (bits - 1 - i) & 1) plan.push("Тумблер " + (i + 1));
  plan.push("Ввести код");
  return { bits: bits, target: target, mask: mask, sw: sw, plan: plan, wrong: rep(["Выключить все тумблеры", "Ввести код"], 3), sol: 1,
    data: { bits: bits, target: target, mask: mask, sw: sw } };
}
function binary(seed, cb, opts) {
  var d = diffOf(opts), P = genBinary(seed, d), bits = P.bits, sw = 0;
  var bitOf = function (v, i) { return v >> (bits - 1 - i) & 1; };
  var maskList = []; for (var mi = 0; mi < bits; mi++) maskList.push(bitOf(P.mask, mi));
  var cond = head(opts, d) + "Двоичный замок. " + (d === 0 ?
    "Четыре тумблера в ряд — это двоичное число. Включённый тумблер прибавляет своё значение, выключенный — ноль: первый слева стоит 8, второй — 4, третий — 2, четвёртый — 1. На табло — " + P.target + ". Наберите это число и введите код." :
    d === 1 ? "Шесть тумблеров в ряд — двоичная запись числа, старший разряд — первый слева. Включённый тумблер — единица, выключенный — ноль. Первый тумблер стоит 32, каждый следующий — вдвое меньше, последний — 1. На табло — " + P.target + ". Наберите это число и введите код." :
    "Восемь тумблеров в ряд — двоичная запись числа: первый слева стоит 128, дальше 64, 32, 16, 8, 4, 2, и последний — 1. Но замок с защитой: прежде чем сравнить, он переворачивает тумблеры по маске с таблички. Где в маске единица, включённый тумблер читается как выключенный, а выключенный — как включённый; где ноль — как есть. Маска по тумблерам слева направо: " + maskList.join(", ") + ". На табло — " + P.target + ". Наберите код так, чтобы замок прочитал это число.");
  var onList = function () { var a = []; for (var i = 0; i < bits; i++) if (bitOf(sw, i)) a.push(i + 1); return a; };
  start("binary", d, P, "Двоичный замок", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < bits; i++) (function (i) {
      out.push(act(function () { return "Тумблер " + (i + 1) + ": " + (bitOf(sw, i) ? "включён" : "выключен"); }, function () {
        sw ^= 1 << (bits - 1 - i); var on = bitOf(sw, i);
        A("play", on ? "term_beep" : "term_off");
        say("Тумблер " + (i + 1) + (on ? " включён." : " выключен."));
      }));
    })(i);
    out.push(act("Ввести код", function () {
      var v = sw ^ P.mask;
      if (v === P.target) { A("play", "code_ok"); finish(true, "Замок прочитал " + P.target + " — дверца щёлкнула и открылась."); return; }
      A("play", "term_err"); fail("Замок прочитал " + v + ", а нужно " + P.target + ".");
    }));
    out.push(act("Что набрано", function () { var on = onList(); say(on.length ? (on.length === 1 ? "Включён тумблер " : "Включены тумблеры ") + andList(on) + "." : "Все тумблеры выключены."); }));
    out.push(act("Выключить все тумблеры", function () { sw = 0; A("play", "term_off"); say("Все тумблеры выключены."); }));
    return out;
  }, cb);
}

/* ════════ 7. ШИФР СМЕНЫ ════════
   Пароль в журнале охраны записан шифром. Алфавит — все 33 буквы, Ё
   на своём месте. Простая — сдвиг Цезаря назван, средняя — сдвиг надо
   найти по подписи дежурного, сложная — шифр Виженера с ключом. Буквы
   шифровки звучат названиями («эль», «ха»), ответ — один из шести слов. */
var ABC = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
var ABC_SAY = ["а", "бэ", "вэ", "гэ", "дэ", "е", "ё", "жэ", "зэ", "и", "и краткое", "ка", "эль", "эм", "эн", "о", "пэ", "эр", "эс", "тэ", "у", "эф", "ха", "цэ", "че", "ша", "ща", "твёрдый знак", "ы", "мягкий знак", "э", "ю", "я"];
var CWORDS = {
  4: ["АЗОТ", "НЕОН", "ФТОР", "ХЛОР", "БРОМ", "ДОЗА", "КРАН", "ШЛЮЗ", "СЕЙФ", "ЦИНК", "ХРОМ", "МЕДЬ", "УРАН", "СЕРА", "ОЗОН", "ЯЩИК", "КЛЮЧ", "ШКАФ", "ГЕЛЬ",
    "РЕЛЕ", "ДИОД", "ЗОНД", "СОЛЬ", "ЭФИР", "ЛУПА"],
  5: ["КОЛБА", "ПРОБА", "РТУТЬ", "ФРЕОН", "ГЕЛИЙ", "РАДИЙ", "ЛИТИЙ", "КВАРЦ", "ТИГЛЬ", "ЛАЗЕР", "АМПЕР", "ШТАММ", "ВИРУС", "СПИРТ", "ТИТАН", "ЦЕЗИЙ", "ОСМИЙ", "АРГОН", "ОЛОВО", "РОБОТ", "ПУЛЬТ", "ЩИТОК", "НАСОС", "ОБЪЁМ",
    "КАТОД", "КАНАЛ", "РАДОН", "ТАЛИЙ", "ЛИНЗА", "ПЛАТА", "АСТАТ", "СТЕНД", "ФОТОН", "ГЛЮОН", "ОКСИД", "ИНДИЙ", "БАРИЙ", "ШЛАНГ", "КАЛИЙ", "ШПРИЦ", "РЕНИЙ", "ЛАМПА"],
  6: ["ШТАТИВ", "ФИЛЬТР", "ДАТЧИК", "ЖУРНАЛ", "НАТРИЙ", "МАГНИЙ", "ФОСФОР", "ЗОЛОТО", "ЖЕЛЕЗО", "НИКЕЛЬ", "СВИНЕЦ", "КСЕНОН", "КЛАПАН", "ЯЧЕЙКА", "ЩЁЛОЧЬ", "ПОДЪЁМ", "ПЛАЗМА", "ИЗОТОП", "СИНТЕЗ",
    "КАМЕРА", "КЮВЕТА", "НЕЙРОН", "МИКРОБ", "СКАНЕР", "ПРОТОН", "ПЕПТИД", "ИТТРИЙ", "ТОКСИН", "ТРУБКА", "ГАЛЛИЙ", "ХЛОРИД", "ВАКУУМ", "ЛАТУНЬ", "ЭТАНОЛ", "АНАЛИЗ"]
};
var SIGS = ["ИЛЬИН", "ПЕТРОВА", "КОВАЛЬ", "СЕРОВА", "НАГИЕВ", "БРАГИНА", "ТИХОНОВ", "ЛАПИНА"];
var VKEYS = ["ГАЗ", "ГЕН", "ЙОД", "КОД", "ЛЁД", "БАК", "ИОН"];
function cShift(w, k) { var o = ""; for (var i = 0; i < w.length; i++) o += ABC.charAt(((ABC.indexOf(w.charAt(i)) + k) % 33 + 33) % 33); return o; }
function cVig(w, key, dir) {
  var o = "";
  for (var i = 0; i < w.length; i++) { var k = ABC.indexOf(key.charAt(i % key.length)) + 1; o += ABC.charAt(((ABC.indexOf(w.charAt(i)) + dir * k) % 33 + 33) % 33); }
  return o;
}
function spell(w) { var a = []; for (var i = 0; i < w.length; i++) a.push(ABC_SAY[ABC.indexOf(w.charAt(i))]); return a.join(", "); }
function abcCmp(a, b) {
  for (var i = 0; i < Math.min(a.length, b.length); i++) { var x = ABC.indexOf(a.charAt(i)) - ABC.indexOf(b.charAt(i)); if (x) return x; }
  return a.length - b.length;
}
function genCipher(seed, d) {
  var r = rngFor(seed, "cipher", d), len = d === 0 ? r.pick([4, 5]) : r.pick([5, 6]);
  var words = CWORDS[len].slice(); r.shuffle(words);
  var ans = words[0], rest = words.slice(1);
  /* средняя и сложная: обманки по возможности на ту же букву — одной первой буквы мало */
  if (d >= 1) rest = rest.filter(function (w) { return w.charAt(0) === ans.charAt(0); }).concat(rest.filter(function (w) { return w.charAt(0) !== ans.charAt(0); }));
  var decoys = rest.slice(0, 5), k = 0, key = "", sig = "", encSig = "", enc;
  if (d === 0) { k = r.int(1, 5); enc = cShift(ans, k); }
  else if (d === 1) { k = r.int(3, 30); enc = cShift(ans, k); sig = r.pick(SIGS); encSig = cShift(sig, k); }
  else { key = r.pick(VKEYS); enc = cVig(ans, key, 1); }
  var dec = d === 2 ? cVig(enc, key, -1) : cShift(enc, -k), opts = [ans].concat(decoys).sort(abcCmp);
  var sol = opts.filter(function (w) { return w === dec; }).length;
  return { ans: ans, enc: enc, k: k, key: key, sig: sig, encSig: encSig, opts: opts, sol: sol,
    plan: ["Ввести «" + ans.toLowerCase() + "»"], wrong: rep(["Ввести «" + decoys[0].toLowerCase() + "»"], 3),
    data: { abc: ABC, enc: enc, k: k, key: key, sig: sig, encSig: encSig, opts: opts, ans: ans } };
}
function cipher(seed, cb, opts) {
  var d = diffOf(opts), P = genCipher(seed, d);
  var abcNote = "После Я счёт идёт снова с А; алфавит — все 33 буквы, Ё стоит на своём месте, между «е» и «жэ».";
  var keyShifts = function () { var a = []; for (var i = 0; i < P.key.length; i++) { var v = ABC.indexOf(P.key.charAt(i)) + 1; a.push("«" + ABC_SAY[v - 1] + "» — на " + v + " " + pl(v, "место", "места", "мест")); } return a.join(", "); };
  var encText = d === 1 ? "Подпись дежурного — " + cap(P.sig.toLowerCase()) + ", в шифровке она выглядит так: " + spell(P.encSig) + ". Шифровка пароля: " + spell(P.enc) + "." :
    d === 2 ? "Ключ — «" + P.key.toLowerCase() + "»: " + keyShifts() + ". Шифровка пароля: " + spell(P.enc) + "." : "Сдвиг — на " + P.k + " " + pl(P.k, "место", "места", "мест") + ". Шифровка пароля: " + spell(P.enc) + ".";
  var cond = head(opts, d) + "Шифр смены. " + (d === 0 ?
    "В журнале охраны пароль на сегодня записан шифром сдвига: каждая буква заменена той, что стоит в алфавите на " + P.k + " " + pl(P.k, "место", "места", "мест") + " дальше. " + abcNote + " Шифровка по буквам: " + spell(P.enc) + "." :
    d === 1 ? "В журнале охраны пароль записан шифром сдвига: каждая буква заменена той, что стоит в алфавите на одно и то же число мест дальше, но на сколько — не сказано. " + abcNote +
      " Зато запись подписана той же рукой и тем же шифром: дежурный — " + cap(P.sig.toLowerCase()) + ", а в шифровке подпись выглядит так: " + spell(P.encSig) + ". Шифровка пароля по буквам: " + spell(P.enc) + "." :
    "Пароль записан шифром Виженера с ключом «" + P.key.toLowerCase() + "». У каждой буквы ключа свой сдвиг — на столько мест, каков её номер в алфавите: " + keyShifts() +
      ". Первая буква пароля сдвинута вперёд по алфавиту на первую букву ключа, вторая — на вторую, третья — на третью, а дальше ключ повторяется с начала. " + abcNote + " Шифровка по буквам: " + spell(P.enc) + ".") +
    " Расшифруйте пароль и выберите его из списка.";
  var alphabet = "Алфавит по номерам: " + ABC_SAY.map(function (s, i) { return (i + 1) + " — " + s; }).join(", ") + ".";
  start("cipher", d, P, "Шифр смены", cond, function (st, finish, fail) {
    var out = P.opts.map(function (w) {
      var lw = w.toLowerCase();
      return act("Ввести «" + lw + "»", function () {
        if (w === P.ans) { A("play", "code_ok"); finish(true, "Пароль «" + lw + "» принят. Замок открыт."); return; }
        A("play", "term_err"); fail("Пароль «" + lw + "» не подошёл.");
      });
    });
    out.push(act("Шифровка ещё раз", function () { A("play", "paper_turn"); say(encText); }));
    out.push(act("Алфавит по порядку", function () { say(alphabet); }));
    return out;
  }, cb);
}

/* ════════ 8. ПОКАЗАНИЯ ДАТЧИКА ════════
   Последнее показание стёрлось; выбрать его из шести. Простая — шаг
   постоянный, средняя — умножение, квадраты, чередование шагов, сложная —
   вторые разности, сумма двух предыдущих, два ряда вперемешку, удвоение
   с прибавкой, кубы. Ответ проверяется набором правил: ни одно простое
   правило не даёт другого варианта из списка. */
function seriesPredict(t) {
  var n = t.length, out = [], i;
  var add = function (v) { if (v === Math.round(v) && out.indexOf(v) < 0) out.push(v); };
  var diffs = function (a) { var o = []; for (var j = 1; j < a.length; j++) o.push(a[j] - a[j - 1]); return o; };
  var allEq = function (a) { for (var j = 1; j < a.length; j++) if (a[j] !== a[0]) return false; return a.length > 0; };
  var d1 = diffs(t), d2 = diffs(d1), d3 = diffs(d2);
  if (allEq(d1)) add(t[n - 1] + d1[0]);
  if (allEq(d2)) add(t[n - 1] + d1[d1.length - 1] + d2[0]);
  if (d3.length >= 2 && allEq(d3)) add(t[n - 1] + d1[d1.length - 1] + d2[d2.length - 1] + d3[0]);
  if (t[0] !== 0) { var geo = true; for (i = 1; i < n; i++) if (t[i] * t[0] !== t[1] * t[i - 1]) geo = false; if (geo) add(t[n - 1] * t[1] / t[0]); }
  var fib = n >= 4; for (i = 2; i < n; i++) if (t[i] !== t[i - 1] + t[i - 2]) fib = false; if (fib) add(t[n - 1] + t[n - 2]);
  if (t[1] !== t[0]) {
    var p = (t[2] - t[1]) / (t[1] - t[0]);
    if (p === Math.round(p)) { var q = t[1] - p * t[0], rec = true; for (i = 1; i < n; i++) if (t[i] !== p * t[i - 1] + q) rec = false; if (rec) add(p * t[n - 1] + q); }
  }
  if (d1.length >= 4) { var alt = true; for (i = 2; i < d1.length; i++) if (d1[i] !== d1[i - 2]) alt = false; if (alt) add(t[n - 1] + d1[d1.length - 2]); }
  if (n >= 6) {
    var ev = [], od = []; for (i = 0; i < n; i++) (i % 2 ? od : ev).push(t[i]);
    var de = diffs(ev), dd = diffs(od);
    if (allEq(de) && allEq(dd)) add(n % 2 ? od[od.length - 1] + dd[0] : ev[ev.length - 1] + de[0]);
  }
  return out;
}
function seq(len, f) { var a = []; for (var i = 0; i < len; i++) a.push(f(i)); return a; }
function genSeries(seed, d) {
  var r = rngFor(seed, "series", d), L = d === 2 ? 6 : 5, t, fam, shown, ans, preds, options, decoys, guard = 0;
  for (;;) {
    guard++;
    if (d === 0) {
      fam = r.pick(["ari", "ari", "arid"]);
      if (fam === "ari") { var a0 = r.int(2, 20), s0 = r.int(2, 9); t = seq(L + 1, function (i) { return a0 + s0 * i; }); }
      else { var a1 = r.int(55, 99), s1 = r.int(3, 9); t = seq(L + 1, function (i) { return a1 - s1 * i; }); }
    } else if (d === 1) {
      fam = r.pick(["geo", "sq", "alt"]);
      if (fam === "geo") { var qg = r.pick([2, 2, 3]), ag = qg === 2 ? r.int(1, 6) : r.int(1, 3); t = seq(L + 1, function (i) { return ag * Math.pow(qg, i); }); }
      else if (fam === "sq") { var ss = r.int(1, 5), cs = r.int(-1, 5); t = seq(L + 1, function (i) { return (i + ss) * (i + ss) + cs; }); }
      else { var aa = r.int(5, 20), pa = r.int(4, 9), qa = r.int(1, pa - 1); t = seq(L + 1, function (i) { return aa + Math.ceil(i / 2) * pa - Math.floor(i / 2) * qa; }); }
    } else {
      fam = r.pick(["quad", "fib", "inter", "rec", "cube"]);
      if (fam === "quad") { var aq = r.int(1, 10), sq2 = r.int(1, 6), eq = r.int(2, 5); t = seq(L + 1, function (i) { return aq + sq2 * i + eq * i * (i - 1) / 2; }); }
      else if (fam === "fib") { var fa = r.int(1, 6), fb = fa + r.int(1, 6); t = [fa, fb]; while (t.length < L + 1) t.push(t[t.length - 1] + t[t.length - 2]); }
      else if (fam === "inter") {
        var x0 = r.int(1, 9), dx = r.int(2, 6), y0 = r.int(20, 60), dy = r.pick([-5, -4, -3, -2, 3, 4, 5, 7, 8]);
        if (dy === dx) continue;
        t = seq(L + 1, function (i) { return i % 2 ? y0 + (i - 1) / 2 * dy : x0 + i / 2 * dx; });
      } else if (fam === "rec") { var c0 = r.pick([-1, 1, 2, 3]), tr = r.int(2, 6); t = [tr]; while (t.length < L + 1) t.push(2 * t[t.length - 1] + c0); }
      else { var sc = r.int(1, 2); t = seq(L + 1, function (i) { return (i + sc) * (i + sc) * (i + sc); }); }
    }
    if (t.some(function (v) { return v <= 0; }) || t[L] > 999) continue;
    shown = t.slice(0, L); ans = t[L]; preds = seriesPredict(shown);
    if (preds.length !== 1 || preds[0] !== ans) continue;
    /* обманки: рядом с ответом и ошибки «не того правила»; ответ — на случайном месте по величине */
    var last = shown[L - 1], dl = last - shown[L - 2], pool = [];
    for (var off = 1; off <= 12; off++) { pool.push(ans + off); pool.push(ans - off); }
    pool.push(last + dl, last + 2 * dl, ans + dl, ans - dl, ans + (ans - last), 2 * last, 2 * ans, Math.round(ans * 1.5));
    var seen = {};
    pool = pool.filter(function (v) {
      if (!(v > 0) || v === ans || seen[v] || shown.indexOf(v) >= 0 || preds.indexOf(v) >= 0) return false;
      seen[v] = 1; return true;
    });
    /* все показания одной чётности — обманки той же чётности, иначе ответ видно сразу */
    if (shown.every(function (v) { return v % 2 === shown[0] % 2; })) { var same = pool.filter(function (v) { return v % 2 === ans % 2; }); if (same.length >= 5) pool = same; }
    var below = pool.filter(function (v) { return v < ans; }), above = pool.filter(function (v) { return v > ans; });
    r.shuffle(below); r.shuffle(above);
    var kb = Math.min(r.int(0, 5), below.length);
    if (5 - kb > above.length) kb = 5 - above.length;
    if (kb < 0 || kb > below.length) continue;
    decoys = below.slice(0, kb).concat(above.slice(0, 5 - kb));
    options = [ans].concat(decoys).sort(function (x, y) { return x - y; });
    var strs = options.map(String), clash = false;
    strs.forEach(function (s1, i1) { strs.forEach(function (s2, i2) { if (i1 !== i2 && s2.indexOf(s1) === 0) clash = true; }); });
    if (clash && guard < 400) continue;
    break;
  }
  var sol = options.filter(function (v) { return v === ans; }).length === 1 && options.every(function (v) { return v === ans || seriesPredict(shown).indexOf(v) < 0; }) ? 1 : 0;
  return { fam: fam, shown: shown, ans: ans, options: options, sol: sol,
    plan: ["Показание " + ans], wrong: rep(["Показание " + decoys[0]], 3),
    data: { fam: fam, shown: shown, ans: ans, options: options } };
}
function series(seed, cb, opts) {
  var d = diffOf(opts), P = genSeries(seed, d), r = rngFor(seed, "series", d, "s");
  var sens = r.pick(["давления", "температуры", "радиации", "влажности", "напряжения"]);
  var cond = head(opts, d) + "Показания датчика. Самописец датчика " + sens + " пишет по числу в час; последнее показание стёрлось. Записано по порядку: " + P.shown.join(", ") +
    ". Все числа подчиняются одному правилу. Каким должно быть следующее показание? Замок примет только его.";
  start("series", d, P, "Показания датчика", cond, function (st, finish, fail) {
    var out = P.options.map(function (v) {
      return act("Показание " + v, function () {
        if (v === P.ans) { A("play", "code_ok"); finish(true, "Показание " + v + " принято: правило найдено, замок открыт."); return; }
        A("play", "term_err"); fail("Показание " + v + " не подошло.");
      });
    });
    out.push(act("Показания ещё раз", function () { say("Записано по порядку: " + P.shown.join(", ") + ". Какое следующее?"); }));
    return out;
  }, cb);
}

/* ════════ 9. КАЛИБРОВКА ════════
   Между числами — знаки плюс, минус, умножение; умножение раньше сложения
   и вычитания. Простая — два знака, средняя — три, сложная — четыре.
   Подходит ровно один набор знаков (перебор всех наборов). */
var OPW = ["плюс", "минус", "умножить"], OPN = ["плюс", "минус", "умножить на"];
function calc(nums, ops) {
  var sum = 0, term = nums[0], sign = 1;
  for (var i = 0; i < ops.length; i++) {
    var o = ops[i], v = nums[i + 1];
    if (o === 2) term *= v; else { sum += sign * term; sign = o === 0 ? 1 : -1; term = v; }
  }
  return sum + sign * term;
}
function calcCount(nums, k, target) {
  var cnt = 0, tot = Math.pow(3, k);
  for (var m = 0; m < tot; m++) { var ops = [], x = m; for (var i = 0; i < k; i++) { ops.push(x % 3); x = Math.floor(x / 3); } if (calc(nums, ops) === target) cnt++; }
  return cnt;
}
function genCalib(seed, d) {
  var r = rngFor(seed, "calib", d), k = d + 2, nums = [], ops = [], target = 0, i;
  for (var guard = 0; guard < 3000; guard++) {
    nums = []; for (i = 0; i <= k; i++) nums.push(r.int(d === 2 ? 1 : 2, 9));
    ops = []; for (i = 0; i < k; i++) ops.push(r.int(0, 2));
    if (d >= 1 && (ops.indexOf(2) < 0 || (ops.indexOf(0) < 0 && ops.indexOf(1) < 0))) continue;
    target = calc(nums, ops);
    if (target < 1) continue;
    if (calcCount(nums, k, target) === 1) break;
  }
  var plan = [], w = [], wp = ["Начать заново"];
  for (i = 0; i < k; i++) for (var j = 0; j <= ops[i]; j++) plan.push("Знак " + (i + 1));
  plan.push("Проверить калибровку");
  for (i = 0; i < k; i++) w.push(0);
  if (w.join() === ops.join()) for (i = 0; i < k; i++) w[i] = 1;
  for (i = 0; i < k; i++) for (var q = 0; q <= w[i]; q++) wp.push("Знак " + (i + 1));
  wp.push("Проверить калибровку");
  return { k: k, nums: nums, ops: ops, target: target, plan: plan, wrong: rep(wp, 3), sol: calcCount(nums, k, target),
    data: { nums: nums, ops: ops, target: target } };
}
function calib(seed, cb, opts) {
  var d = diffOf(opts), P = genCalib(seed, d), k = P.k, cur = [];
  for (var i0 = 0; i0 < k; i0++) cur.push(-1);
  var cond = head(opts, d) + "Калибровка анализатора. На табло числа по порядку: " + P.nums.join(", ") + ". Между соседними числами — пустые места для знаков, всего их " + k +
    ". В каждое место поставьте плюс, минус или умножение, чтобы вышло эталонное значение — " + P.target + ". Умножение выполняется раньше сложения и вычитания, как обычно в арифметике. Подходит только один набор знаков.";
  var expr = function () { var s = String(P.nums[0]); for (var i = 0; i < k; i++) s += (cur[i] < 0 ? ", пустое место, " : " " + OPN[cur[i]] + " ") + P.nums[i + 1]; return s; };
  start("calib", d, P, "Калибровка", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < k; i++) (function (i) {
      out.push(act(function () { return "Знак " + (i + 1) + " между " + P.nums[i] + " и " + P.nums[i + 1] + ": " + (cur[i] < 0 ? "не выбран" : OPW[cur[i]]); }, function () {
        cur[i] = (cur[i] + 1) % 3; A("play", "keypad"); say("Знак " + (i + 1) + " — " + OPW[cur[i]] + ".");
      }));
    })(i);
    out.push(act("Проверить калибровку", function () {
      if (cur.some(function (v) { return v < 0; })) { nope("Не все знаки выбраны."); return; }
      var v = calc(P.nums, cur);
      if (v === P.target) { A("play", "code_ok"); finish(true, "Анализатор показывает " + P.target + " — ровно эталон. Калибровка закончена."); return; }
      A("play", "term_err"); fail("Анализатор показывает " + num(v) + ", а эталон — " + P.target + ".");
    }));
    out.push(act("Что на табло", function () { say("На табло: " + expr() + ". Эталон — " + P.target + "."); }));
    out.push(act("Начать заново", function () { for (var j = 0; j < k; j++) cur[j] = -1; A("play", "term_off"); say("Знаки стёрты."); }));
    return out;
  }, cb);
}

/* ════════ 10. ПЕРЕВОЗКА ЧЕРЕЗ ШЛЮЗ ════════
   Простая — мутант, крыса и корм (тележка везёт вас и ещё одного),
   средняя — четверо лаборантов и один фонарь в тёмном коридоре, сложная —
   трое охранников и трое мутантов, тележка на двоих. Проигрышное
   положение тратит попытку и возвращает всех к началу. */
var ZONE_P = ["грязной зоне", "чистой зоне"];
var WGC = [
  { n: ["мутант", "крыса", "мешок корма"], acc: ["мутанта", "крысу", "мешок корма"], ab: ["мутант набросится на крысу", "мутант набросился на крысу"], bc: ["крыса прогрызёт мешок корма", "крыса прогрызла мешок корма"] },
  { n: ["хищная лиана в кадке", "кролик", "кочан капусты"], acc: ["хищную лиану", "кролика", "кочан капусты"], ab: ["лиана схватит кролика", "лиана схватила кролика"], bc: ["кролик сгрызёт капусту", "кролик сгрыз капусту"] }
];
var STAFF2 = ["Ильин", "Петрова", "Коваль", "Серова", "Нагиев", "Брагина", "Тихонов", "Лапина"];
var LOADS = [[2, 0], [1, 1], [0, 2], [1, 0], [0, 1]];
var LOADN = ["Отправить двух охранников", "Отправить охранника и мутанта", "Отправить двух мутантов", "Отправить одного охранника", "Отправить одного мутанта"];
function bfsGeneric(startKey, nexts, isGoal) {
  var prev = {}, mv = {}, q = [startKey];
  prev[startKey] = null;
  for (var qi = 0; qi < q.length; qi++) {
    var k = q[qi];
    if (isGoal(k)) { var path = []; while (prev[k] !== null) { path.unshift(mv[k]); k = prev[k]; } return path; }
    var nx = nexts(k);
    for (var i = 0; i < nx.length; i++) if (!Object.prototype.hasOwnProperty.call(prev, nx[i].k)) { prev[nx[i].k] = k; mv[nx[i].k] = nx[i].m; q.push(nx[i].k); }
  }
  return null;
}
/* мутант, крыса, корм: ключ — стороны трёх и ваша, «0000» — все в грязной зоне */
function wgcLose(p, h) { var o = 1 - h; return (p[0] === o && p[1] === o) ? "ab" : (p[1] === o && p[2] === o) ? "bc" : ""; }
function wgcNext(key) {
  var p = key.split("").map(Number), h = p[3], out = [];
  for (var x = -1; x < 3; x++) {
    if (x >= 0 && p[x] !== h) continue;
    var q = p.slice(); q[3] = 1 - h; if (x >= 0) q[x] = 1 - h;
    if (wgcLose(q, q[3])) continue;
    out.push({ k: q.join(""), m: x });
  }
  return out;
}
/* мост и фонарь: кратчайшее время (Дейкстра по 32 положениям) */
function bridgeBest(times) {
  var n = times.length, full = (1 << n) - 1, dist = {}, done = {}, key = function (m, l) { return m + ":" + l; };
  dist[key(0, 0)] = 0;
  for (;;) {
    var bk = null, bv = Infinity;
    for (var kk in dist) if (!done[kk] && dist[kk] < bv) { bv = dist[kk]; bk = kk; }
    if (bk === null) return -1;
    var parts = bk.split(":"), m = +parts[0], l = +parts[1];
    if (m === full) return bv;
    done[bk] = 1;
    var here = []; for (var i = 0; i < n; i++) if (((m >> i) & 1) === l) here.push(i);
    for (var a = 0; a < here.length; a++) for (var b = a; b < here.length; b++) {
      var mm = m ^ (1 << here[a]); if (b !== a) mm ^= 1 << here[b];
      var t = Math.max(times[here[a]], times[here[b]]), nk = key(mm, 1 - l);
      if (!done[nk] && (dist[nk] == null || dist[nk] > bv + t)) dist[nk] = bv + t;
    }
  }
}
/* охранники и мутанты: ключ — охранников и мутантов в грязной зоне, сторона тележки */
function gmBad(g, m) { return g > 0 && m > g; }
function gmNext(key) {
  var p = key.split("").map(Number), g = p[0], m = p[1], c = p[2], out = [];
  for (var i = 0; i < LOADS.length; i++) {
    var lg = LOADS[i][0], lm = LOADS[i][1], hg = c ? 3 - g : g, hm = c ? 3 - m : m;
    if (lg > hg || lm > hm) continue;
    var ng = c ? g + lg : g - lg, nm = c ? m + lm : m - lm;
    if (gmBad(ng, nm) || gmBad(3 - ng, 3 - nm)) continue;
    out.push({ k: "" + ng + nm + (1 - c), m: i });
  }
  return out;
}
function genCrossing(seed, d) {
  var r = rngFor(seed, "crossing", d), plan, wrong, data;
  if (d === 0) {
    var T = WGC[r.int(0, WGC.length - 1)];
    var path = bfsGeneric("0000", wgcNext, function (k) { return k === "1111"; });
    plan = path.map(function (x) { return x < 0 ? "Ехать без груза" : "Везти " + T.acc[x]; });
    wrong = rep(["Везти " + T.acc[2]], 3);
    data = { theme: T, min: path.length };
  } else if (d === 1) {
    var names = STAFF2.slice(); r.shuffle(names); names = names.slice(0, 4);
    var a = r.int(1, 2), b = a + r.int(1, 2), c = Math.max(2 * b - a + 1, b + 2) + r.int(0, 3), dd = c + r.int(1, 5), times = [a, b, c, dd];
    var best = bridgeBest(times);
    plan = [names[0], names[1], "Отправить с фонарём", names[0], "Отправить с фонарём", names[2], names[3], "Отправить с фонарём", names[1], "Отправить с фонарём", names[0], names[1], "Отправить с фонарём"];
    var mcount = Math.ceil(best / dd), w = [];
    for (var i = 0; i < mcount; i++) { w.push(names[3]); w.push("Отправить с фонарём"); }
    wrong = rep(w, 3);
    data = { names: names, times: times, limit: best, trick: a + 3 * b + dd, naive: 2 * a + b + c + dd };
  } else {
    var p2 = bfsGeneric("330", gmNext, function (k) { return k === "001"; });
    plan = p2.map(function (i2) { return LOADN[i2]; });
    wrong = rep([LOADN[0]], 3);
    data = { min: p2.length };
  }
  return { d: d, plan: plan, wrong: wrong, sol: 1, data: data };
}
function crossing(seed, cb, opts) {
  var d = diffOf(opts), P = genCrossing(seed, d);
  if (d === 0) crossWgc(d, P, cb, opts);
  else if (d === 1) crossBridge(d, P, cb, opts);
  else crossGuards(d, P, cb, opts);
}
function crossWgc(d, P, cb, opts) {
  var T = P.data.theme, pos = [0, 0, 0], h = 0;
  var zoneText = function () {
    var z = [[], []]; for (var i = 0; i < 3; i++) z[pos[i]].push(T.n[i]);
    return "Вы в " + ZONE_P[h] + ". В грязной зоне: " + (z[0].length ? andList(z[0]) : "пусто") + ". В чистой зоне: " + (z[1].length ? andList(z[1]) : "пусто") + ".";
  };
  var cond = head(opts, d) + "Перевозка через шлюз. В грязной зоне карантина — вы, " + andList(T.n) + ". Перебраться в чистую зону можно только на тележке шлюза: в ней место для вас и ещё для кого-то одного или для одного груза. " +
    "Без вас " + T.ab[0] + ", а " + T.bc[0] + "; при вас все ведут себя смирно. Перевезите всех в чистую зону.";
  var reset = function () { pos = [0, 0, 0]; h = 0; };
  start("crossing", d, P, "Перевозка через шлюз", cond, function (st, finish, fail) {
    var go = function (x) {
      if (x >= 0 && pos[x] !== h) { nope(cap(T.n[x]) + " на другой стороне: сперва вернитесь туда."); return; }
      h = 1 - h; if (x >= 0) pos[x] = h;
      A("play", "door_auto_open");
      var lose = wgcLose(pos, h);
      if (lose) { reset(); A("play", "term_err"); fail("Пока вас не было, " + (lose === "ab" ? T.ab[1] : T.bc[1]) + ". Всех вернули в грязную зону."); return; }
      if (pos[0] === 1 && pos[1] === 1 && pos[2] === 1) { A("play", "code_ok"); finish(true, "Все в чистой зоне, и все целы. Шлюз закрыт."); return; }
      say(zoneText());
    };
    var out = [];
    for (var x = 0; x < 3; x++) (function (x) {
      out.push(act(function () { return "Везти " + T.acc[x] + ": " + (pos[x] === h ? "рядом с вами" : "на другой стороне"); }, function () { go(x); }));
    })(x);
    out.push(act("Ехать без груза", function () { go(-1); }));
    out.push(act("Что сейчас", function () { say(zoneText()); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Все снова в грязной зоне, и вы вместе с ними."); }));
    return out;
  }, cb);
}
function crossBridge(d, P, cb, opts) {
  var D = P.data, names = D.names, times = D.times, limit = D.limit, side = [0, 0, 0, 0], lamp = 0, sel = [], time = 0;
  var mins = function (v) { return pl(v, "минута", "минуты", "минут"); };
  var minsAcc = function (v) { return pl(v, "минуту", "минуты", "минут"); };
  var at = function (s) { return s ? "у выхода" : "у входа"; };
  var stateText = function () {
    var z = [[], []]; for (var i = 0; i < 4; i++) z[side[i]].push(names[i]);
    return "Фонарь " + at(lamp) + ". У входа: " + (z[0].length ? andList(z[0]) : "никого") + ". У выхода: " + (z[1].length ? andList(z[1]) : "никого") + ". Прошло " + time + " из " + limit + " " + pl(limit, "минуты", "минут", "минут") + ".";
  };
  var cond = head(opts, d) + "Перевозка через шлюз. Тележка шлюза сломалась, и четверым лаборантам придётся идти тёмным техническим коридором от входа к выходу. Идут не больше двоих сразу и только с фонарём, а фонарь один — его приходится носить обратно. " +
    "Каждому на переход нужно своё время: " + names.map(function (nmB, i) { return nmB + " — " + times[i] + " " + mins(times[i]); }).join(", ") + ". Пара идёт со скоростью того, кто медленнее. Батареи фонаря хватит на " + limit + " " + minsAcc(limit) + ". Выведите всех к выходу.";
  var reset = function () { side = [0, 0, 0, 0]; lamp = 0; sel = []; time = 0; };
  start("crossing", d, P, "Перевозка через шлюз", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < 4; i++) (function (i) {
      out.push(act(function () { return names[i] + ", " + times[i] + " " + mins(times[i]) + ": " + at(side[i]) + (sel.indexOf(i) >= 0 ? ", идёт" : ""); }, function () {
        if (side[i] !== lamp) { nope(names[i] + " " + at(side[i]) + ", а фонарь " + at(lamp) + "."); return; }
        var k = sel.indexOf(i);
        if (k >= 0) { sel.splice(k, 1); A("play", "term_off"); say(names[i] + " остаётся."); return; }
        if (sel.length >= 2) { nope("Идут не больше двоих."); return; }
        sel.push(i); A("play", "term_beep"); say(names[i] + " идёт.");
      }));
    })(i);
    out.push(act(function () { return "Отправить с фонарём: " + (sel.length ? "идут " + andList(sel.map(function (j) { return names[j]; })) : "никто не выбран"); }, function () {
      if (!sel.length) { nope("Никто не выбран: отметьте одного или двоих у фонаря."); return; }
      var t = 0; sel.forEach(function (j) { t = Math.max(t, times[j]); side[j] = 1 - lamp; });
      lamp = 1 - lamp; sel = []; time += t;
      A("play", "door_auto_open");
      var all = side.every(function (s) { return s === 1; });
      if (all && time <= limit) { A("play", "code_ok"); finish(true, "Все у выхода за " + time + " " + minsAcc(time) + ". Фонарь ещё светит."); return; }
      if (time >= limit) {
        var why = time > limit ? "Фонарь погас на полпути: батарея на " + limit + " " + minsAcc(limit) + ", а прошло " + time + "." : "Батарея фонаря села: прошло " + limit + " " + minsAcc(limit) + ", а у выхода не все.";
        reset(); A("play", "term_err"); fail(why + " Всех вернули ко входу."); return;
      }
      say("Переход занял " + t + " " + minsAcc(t) + ". " + stateText());
    }));
    out.push(act("Что сейчас", function () { say(stateText()); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Все снова у входа, фонарь у входа и заряжен на " + limit + " " + minsAcc(limit) + "."); }));
    return out;
  }, cb);
}
function crossGuards(d, P, cb, opts) {
  var g = 3, m = 3, c = 0;
  var zone = function (gg, mm) {
    var parts = [];
    if (gg) parts.push(gg + " " + pl(gg, "охранник", "охранника", "охранников"));
    if (mm) parts.push(mm + " " + pl(mm, "мутант", "мутанта", "мутантов"));
    return parts.length ? parts.join(" и ") : "никого";
  };
  var stateText = function () { return "Тележка в " + ZONE_P[c] + ". В грязной зоне: " + zone(g, m) + ". В чистой зоне: " + zone(3 - g, 3 - m) + "."; };
  var cond = head(opts, d) + "Перевозка через шлюз. В грязной зоне трое охранников и трое мутантов, всех нужно перевезти в чистую зону. Тележка шлюза берёт одного или двоих и пустой не ездит. " +
    "Если в какой-то зоне — считая тех, кто только что приехал, — мутантов окажется больше, чем охранников, а охрана там есть, мутанты набросятся на неё. Где охраны нет совсем, мутанты смирные. Перевезите всех.";
  var reset = function () { g = 3; m = 3; c = 0; };
  start("crossing", d, P, "Перевозка через шлюз", cond, function (st, finish, fail) {
    var out = LOADS.map(function (ld, i) {
      return act(LOADN[i], function () {
        var hg = c ? 3 - g : g, hm = c ? 3 - m : m;
        if (ld[0] > hg) { nope("Тележка в " + ZONE_P[c] + ", а там " + (hg ? "только один охранник" : "нет охранников") + "."); return; }
        if (ld[1] > hm) { nope("Тележка в " + ZONE_P[c] + ", а там " + (hm ? "только один мутант" : "нет мутантов") + "."); return; }
        if (c) { g += ld[0]; m += ld[1]; } else { g -= ld[0]; m -= ld[1]; }
        c = 1 - c;
        A("play", "door_auto_open");
        var badZ = gmBad(g, m) ? 0 : gmBad(3 - g, 3 - m) ? 1 : -1;
        if (badZ >= 0) { reset(); A("play", "term_err"); fail("В " + ZONE_P[badZ] + " мутантов больше, чем охранников, — мутанты набросились на охрану. Всех вернули в грязную зону."); return; }
        if (!g && !m) { A("play", "code_ok"); finish(true, "Все шестеро в чистой зоне, охрана цела. Шлюз закрыт."); return; }
        say(stateText());
      });
    });
    out.push(act("Что сейчас", function () { say(stateText()); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Все снова в грязной зоне, тележка тоже там."); }));
    return out;
  }, cb);
}

/* ════════ 11. ПРОГРАММА УБОРЩИКА ════════
   Робот смотрит на север; программа — «вперёд», «налево», «направо».
   Простая — поле три на три, средняя — четыре на четыре и два шкафа,
   сложная — пять на пять, четыре-пять шкафов и программа не длиннее
   кратчайшей. Кратчайшая программа ищется поиском в ширину. */
var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1], CMDN = ["вперёд", "налево", "направо"];
function robotBfs(N, blk, sr, sc, tr, tc) {
  var key = function (r, c, h) { return r * 100 + c * 10 + h; };
  var prev = {}, mv = {}, q = [[sr, sc, 0]], k0 = key(sr, sc, 0);
  prev[k0] = null;
  for (var qi = 0; qi < q.length; qi++) {
    var s = q[qi], ks = key(s[0], s[1], s[2]);
    if (s[0] === tr && s[1] === tc) { var path = []; while (prev[ks] !== null) { path.unshift(mv[ks]); ks = prev[ks]; } return path; }
    var nx = [];
    var nr = s[0] + DR[s[2]], nc = s[1] + DC[s[2]];
    if (nr >= 0 && nc >= 0 && nr < N && nc < N && !blk[nr * N + nc]) nx.push([nr, nc, s[2], 0]);
    nx.push([s[0], s[1], (s[2] + 3) % 4, 1]); nx.push([s[0], s[1], (s[2] + 1) % 4, 2]);
    for (var i = 0; i < nx.length; i++) {
      var kn = key(nx[i][0], nx[i][1], nx[i][2]);
      if (!Object.prototype.hasOwnProperty.call(prev, kn)) { prev[kn] = ks; mv[kn] = nx[i][3]; q.push(nx[i].slice(0, 3)); }
    }
  }
  return null;
}
function genRobot(seed, d) {
  var r = rngFor(seed, "robot", d), N = d + 3, obsN = d === 0 ? 0 : d === 1 ? 2 : r.int(4, 5);
  var lo = [3, 5, 7][d], hi = [5, 8, 11][d], slack = [2, 1, 0][d], sr = 0, sc = 0, tr = 0, tc = 0, blk = [], path = null;
  for (var guard = 0; guard < 2000; guard++) {
    sr = r.int(0, N - 1); sc = r.int(0, N - 1); tr = r.int(0, N - 1); tc = r.int(0, N - 1);
    if (sr === tr && sc === tc) continue;
    blk = []; for (var i = 0; i < N * N; i++) blk.push(0);
    var cells = intList(N * N).filter(function (x) { return x !== sr * N + sc && x !== tr * N + tc; }); r.shuffle(cells);
    for (var k = 0; k < obsN; k++) blk[cells[k]] = 1;
    path = robotBfs(N, blk, sr, sc, tr, tc);
    if (path && path.length >= lo && path.length <= hi) break;
  }
  var limit = path.length + slack;
  var plan = path.map(function (c) { return "Добавить «" + CMDN[c] + "»"; }); plan.push("Запустить робота");
  return { N: N, blk: blk, sr: sr, sc: sc, tr: tr, tc: tc, min: path.length, limit: limit, plan: plan,
    wrong: rep(["Очистить программу", "Добавить «налево»", "Запустить робота"], 3), sol: 1,
    data: { N: N, blk: blk, sr: sr, sc: sc, tr: tr, tc: tc, min: path.length, limit: limit } };
}
function robot(seed, cb, opts) {
  var d = diffOf(opts), P = genRobot(seed, d), N = P.N, prog = [];
  var cell = function (r, c) { return "в ряду " + (r + 1) + " на клетке " + (c + 1); };
  var obs = []; for (var x = 0; x < N * N; x++) if (P.blk[x]) obs.push("ряд " + (Math.floor(x / N) + 1) + ", клетка " + (x % N + 1));
  var cmds = pl(P.limit, "команды", "команд", "команд");
  var cond = head(opts, d) + "Программа уборщика. Поле — " + N + " " + pl(N, "ряд", "ряда", "рядов") + " по " + N + " " + pl(N, "клетке", "клетки", "клеток") +
    ": ряды считаются с севера на юг, клетки в ряду — с запада на восток. Робот-уборщик стоит " + cell(P.sr, P.sc) + " и смотрит на север. Пятно реактива — " + cell(P.tr, P.tc) + ". " +
    (obs.length ? "Шкафы стоят: " + obs.join("; ") + ". " : "Препятствий на поле нет. ") + "За краем поля — стены. Команды: «вперёд» — шаг на соседнюю клетку туда, куда смотрит робот; «налево» и «направо» — поворот на месте на четверть оборота. " +
    "Составьте программу не длиннее " + P.limit + " " + cmds + ": робот выполнит её целиком и должен остановиться ровно на пятне. Врезался в стену" + (obs.length ? " или шкаф" : "") + " — программа срывается.";
  var progText = function () { return prog.length ? prog.map(function (c) { return CMDN[c]; }).join(", ") : "пусто"; };
  var add = function (c) {
    if (prog.length >= P.limit) { nope("Программа полна: не больше " + P.limit + " " + cmds + "."); return; }
    prog.push(c); A("play", "pc_click"); say(cap(CMDN[c]) + ". Команд: " + prog.length + " из " + P.limit + ".");
  };
  start("robot", d, P, "Программа уборщика", cond, function (st, finish, fail) {
    return [
      act(function () { return "Добавить «вперёд»: команд " + prog.length + " из " + P.limit; }, function () { add(0); }),
      act("Добавить «налево»", function () { add(1); }),
      act("Добавить «направо»", function () { add(2); }),
      act("Убрать последнюю команду", function () {
        if (!prog.length) { nope("Программа пуста."); return; }
        var c = prog.pop(); A("play", "term_off"); say("Убрано: " + CMDN[c] + ". Команд: " + prog.length + ".");
      }),
      act(function () { return "Программа: " + progText(); }, function () { say("Программа: " + progText() + ". Команд " + prog.length + " из " + P.limit + "."); }),
      act("Запустить робота", function () {
        if (!prog.length) { nope("Программа пуста: добавьте команды."); return; }
        var rr = P.sr, cc = P.sc, h = 0;
        for (var i = 0; i < prog.length; i++) {
          var c = prog[i];
          if (c === 1) h = (h + 3) % 4;
          else if (c === 2) h = (h + 1) % 4;
          else {
            var nr = rr + DR[h], nc = cc + DC[h], wall = nr < 0 || nc < 0 || nr >= N || nc >= N;
            if (wall || P.blk[nr * N + nc]) { A("play", "bump_device"); fail("Робот врезался в " + (wall ? "стену" : "шкаф") + " на команде " + (i + 1) + ". Программа сорвалась, робот вернулся на место."); return; }
            rr = nr; cc = nc;
          }
        }
        A("play", "robot_step");
        if (rr === P.tr && cc === P.tc) { A("play", "code_ok"); finish(true, "Робот встал ровно на пятно и затёр его. Уборка закончена."); return; }
        fail("Робот остановился " + cell(rr, cc) + ", а пятно — " + cell(P.tr, P.tc) + ". Робот вернулся на место.");
      }),
      act("Очистить программу", function () { prog = []; A("play", "term_off"); say("Программа очищена."); })
    ];
  }, cb);
}

/* ════════ 12. СТЕЛЛАЖ РЕАКТИВОВ ════════
   Латинский квадрат четыре на четыре: на каждой полке и в каждом столбце
   каждый реактив по разу. Простая — три-четыре пустых гнезда, средняя —
   шесть-семь, сложная — девять-десять; заполнение единственное (решатель
   считает варианты). Выбор: полка, гнездо, реактив. */
var REAG = ["кислота", "щёлочь", "спирт", "эфир", "аммиак", "йод", "глицерин", "формалин", "ацетон", "бензол"];
function latOk(g, row, col, v) {
  for (var i = 0; i < 4; i++) { if (i !== col && g[row * 4 + i] === v) return false; if (i !== row && g[i * 4 + col] === v) return false; }
  return true;
}
function latinRandom(r) {
  var g = []; for (var i = 0; i < 16; i++) g.push(-1);
  var fill = function (k) {
    if (k === 16) return true;
    var vals = [0, 1, 2, 3]; r.shuffle(vals);
    for (var j = 0; j < 4; j++) { if (latOk(g, k >> 2, k & 3, vals[j])) { g[k] = vals[j]; if (fill(k + 1)) return true; g[k] = -1; } }
    return false;
  };
  fill(0);
  return g;
}
function latinCount(g, limit) {
  var k = g.indexOf(-1); if (k < 0) return 1;
  var cnt = 0;
  for (var v = 0; v < 4 && cnt < limit; v++) if (latOk(g, k >> 2, k & 3, v)) { g[k] = v; cnt += latinCount(g, limit - cnt); g[k] = -1; }
  return cnt;
}
function genLatin(seed, d) {
  var r = rngFor(seed, "latin", d), names = REAG.slice(); r.shuffle(names); names = names.slice(0, 4);
  var lo = [3, 6, 9][d], hi = [4, 7, 10][d], sq = [], grid = [], removed = 0;
  for (var guard = 0; guard < 400; guard++) {
    sq = latinRandom(r); grid = sq.slice(); removed = 0;
    var want = r.int(lo, hi), order = intList(16); r.shuffle(order);
    for (var i = 0; i < 16 && removed < want; i++) {
      var c = order[i], v = grid[c]; grid[c] = -1;
      if (latinCount(grid.slice(), 2) === 1) removed++; else grid[c] = v;
    }
    if (removed === want) break;
  }
  var plan = [], wp = [];
  for (var row = 0; row < 4; row++) {
    var em = []; for (var col = 0; col < 4; col++) if (grid[row * 4 + col] < 0) em.push(col);
    if (!em.length) continue;
    plan.push("Полка " + (row + 1)); wp.push("Полка " + (row + 1));
    em.forEach(function (col2) {
      plan.push("Гнездо " + (col2 + 1)); plan.push(cap(names[sq[row * 4 + col2]]));
      wp.push("Гнездо " + (col2 + 1)); wp.push(cap(names[(sq[row * 4 + col2] + 1) % 4]));
    });
    plan.push("Назад"); wp.push("Назад");
  }
  plan.push("Сдать стеллаж"); wp.push("Сдать стеллаж");
  return { names: names, sq: sq, grid: grid, empty: removed, plan: plan, wrong: rep(wp, 3), sol: latinCount(grid.slice(), 3),
    data: { names: names, grid: grid.slice(), sq: sq.slice(), empty: removed } };
}
function latin(seed, cb, opts) {
  var d = diffOf(opts), P = genLatin(seed, d), names = P.names, val = P.grid.slice();
  var fixed = P.grid.map(function (v) { return v >= 0; });
  var shelf = function (g, row) { var a = []; for (var c = 0; c < 4; c++) a.push(g[row * 4 + c] >= 0 ? names[g[row * 4 + c]] : "пусто"); return a.join(", "); };
  var cond = head(opts, d) + "Стеллаж реактивов. Четыре полки по четыре гнезда; полки считаются сверху вниз, гнёзда — слева направо. Реактивы: " + andList(names) +
    ". Правило склада: на каждой полке каждый реактив стоит ровно один раз, и в каждом столбце — в гнёздах с одним номером на всех полках — тоже по одному разу. Часть гнёзд уже занята: " +
    [0, 1, 2, 3].map(function (row) { return "полка " + (row + 1) + " — " + shelf(P.grid, row); }).join("; ") + ". Заполните пустые гнёзда — расстановка выходит единственная.";
  var conflict = function () {
    for (var i = 0; i < 4; i++) for (var a = 0; a < 4; a++) for (var b = a + 1; b < 4; b++) {
      if (val[i * 4 + a] === val[i * 4 + b]) return "На полке " + (i + 1) + " повторяется " + names[val[i * 4 + a]] + ".";
      if (val[a * 4 + i] === val[b * 4 + i]) return "В столбце гнёзд номер " + (i + 1) + " повторяется " + names[val[a * 4 + i]] + ".";
    }
    return "";
  };
  var reagMenu = function (row, col) {
    var k = row * 4 + col, items = names.map(function (nmR, j) {
      return { label: cap(nmR), fn: function () { val[k] = j; A("play", "term_beep"); say("Полка " + (row + 1) + ", гнездо " + (col + 1) + ": " + nmR + "."); } };
    });
    if (val[k] >= 0) items.push({ label: "Убрать реактив", fn: function () { val[k] = -1; A("play", "term_off"); say("Гнездо " + (col + 1) + " снова пусто."); } });
    UIx("menu", "Полка " + (row + 1) + ", гнездо " + (col + 1), items);
  };
  var shelfMenu = function (row) {
    var items = [];
    for (var c = 0; c < 4; c++) (function (col) {
      items.push(act(function () { var v = val[row * 4 + col]; return "Гнездо " + (col + 1) + ": " + (fixed[row * 4 + col] ? names[v] + ", стоит с начала" : v >= 0 ? names[v] : "пусто"); }, function () {
        if (fixed[row * 4 + col]) { nope("Это гнездо занято с самого начала — его не трогают."); return; }
        reagMenu(row, col);
      }));
    })(c);
    items.push({ label: "Назад, к стеллажу", close: true, fn: function () {} });
    UIx("menu", "Полка " + (row + 1), items);
  };
  start("latin", d, P, "Стеллаж реактивов", cond, function (st, finish, fail) {
    var out = [];
    for (var row = 0; row < 4; row++) (function (row) {
      out.push(act(function () { return "Полка " + (row + 1) + ": " + shelf(val, row); }, function () { shelfMenu(row); }));
    })(row);
    out.push(act("Сдать стеллаж", function () {
      var empty = val.filter(function (v) { return v < 0; }).length;
      if (empty) { nope("Пусто ещё в " + empty + " " + pl(empty, "гнезде", "гнёздах", "гнёздах") + "."); return; }
      var bad = conflict();
      if (!bad) { A("play", "code_ok"); finish(true, "Стеллаж собран: каждый реактив по разу на каждой полке и в каждом столбце."); return; }
      A("play", "term_err"); fail(bad);
    }));
    out.push(act("Начать заново", function () { val = P.grid.slice(); A("play", "term_off"); say("Расставленное убрано, на стеллаже — только то, что стояло с начала."); }));
    return out;
  }, cb);
}

/* ════════ 13. ЗАМОК С ПОДСКАЗКАМИ ════════
   «682 — одна цифра верна и стоит на своём месте»… Цифры кода не
   повторяются. Простая — три цифры и щедрые подсказки (есть «ни одна не
   верна»), средняя — три цифры и самый скупой набор, сложная — четыре
   цифры. Код единственный (перебор всех кодов). Набор — по цифрам. */
var clueCodes = {};
function allCodes(L) {
  if (clueCodes[L]) return clueCodes[L];
  var out = [], pre = [];
  var rec = function () { if (pre.length === L) { out.push(pre.slice()); return; } for (var dg = 0; dg < 10; dg++) if (pre.indexOf(dg) < 0) { pre.push(dg); rec(); pre.pop(); } };
  rec();
  clueCodes[L] = out;
  return out;
}
function cScore(g, s) { var e = 0, m = 0; for (var i = 0; i < g.length; i++) { if (g[i] === s[i]) e++; else if (s.indexOf(g[i]) >= 0) m++; } return e * 10 + m; }
function cluesCount(clues, codes) { var n = 0; for (var i = 0; i < codes.length; i++) if (clues.every(function (c) { return cScore(c.g, codes[i]) === c.s; })) n++; return n; }
function clueText(sc) {
  var e = Math.floor(sc / 10), m = sc % 10, t = e + m;
  if (!t) return "ни одна цифра не верна";
  if (!m) return t === 1 ? "одна цифра верна и стоит на своём месте" : FEMW[t] + " цифры верны и стоят на своих местах";
  if (!e) return t === 1 ? "одна цифра верна, но стоит не на своём месте" : FEMW[t] + " цифры верны, но " + (t === 2 ? "обе" : "все") + " стоят не на своих местах";
  return FEMW[t] + " цифры верны: " + FEMW[e] + " — на " + (e === 1 ? "своём месте" : "своих местах") + ", " + (t === 2 ? "другая" : FEMW[m]) + " — нет";
}
function genClues(seed, d) {
  var r = rngFor(seed, "clues", d), L = d === 2 ? 4 : 3, codes = allCodes(L), minC = [4, 3, 4][d], maxC = [7, 5, 6][d], secret = [], clues = [];
  for (var guard = 0; guard < 400; guard++) {
    secret = r.pick(codes).slice(); clues = [];
    var cands = codes, tries = 0;
    while (cands.length > 1 && tries++ < 80) {
      var inS = secret.slice(), outS = [], dg;
      for (dg = 0; dg < 10; dg++) if (secret.indexOf(dg) < 0) outS.push(dg);
      r.shuffle(inS); r.shuffle(outS);
      var k = r.int(d === 0 ? 0 : 1, Math.min(L - 1, d === 2 ? 3 : 2));
      var g = inS.slice(0, k).concat(outS.slice(0, L - k)); r.shuffle(g);
      var sc = cScore(g, secret);
      if (d === 1 && sc === 0) continue;
      if (clues.some(function (c) { return c.g.join("") === g.join(""); })) continue;
      var nc = cands.filter(function (c) { return cScore(g, c) === sc; });
      if (nc.length === cands.length) continue;
      clues.push({ g: g, s: sc }); cands = nc;
    }
    if (cands.length !== 1) continue;
    if (d >= 1) for (var i = clues.length - 1; i >= 0; i--) { var c2 = clues.slice(0, i).concat(clues.slice(i + 1)); if (cluesCount(c2, codes) === 1) clues = c2; }
    if (d === 0 && !clues.some(function (c) { return c.s === 0; })) {
      var none = []; for (dg = 0; dg < 10 && none.length < L; dg++) if (secret.indexOf(dg) < 0) none.push(dg);
      r.shuffle(none); clues.splice(r.int(0, clues.length), 0, { g: none, s: 0 });
    }
    if (clues.length < minC || clues.length > maxC) continue;
    if (cluesCount(clues, codes) !== 1) continue;
    break;
  }
  var plan = [], w = [];
  secret.forEach(function (v, i2) { plan.push("Цифра " + (i2 + 1)); plan.push(String(v)); });
  plan.push("Открыть замок");
  var rot = secret.slice(1).concat(secret.slice(0, 1));
  rot.forEach(function (v, i3) { w.push("Цифра " + (i3 + 1)); w.push(String(v)); });
  w.push("Открыть замок");
  return { L: L, secret: secret, clues: clues, plan: plan, wrong: rep(w, 3), sol: cluesCount(clues, codes),
    data: { L: L, secret: secret.slice(), clues: clues.map(function (c) { return { g: c.g.slice(), e: Math.floor(c.s / 10), m: c.s % 10 }; }) } };
}
function clues(seed, cb, opts) {
  var d = diffOf(opts), P = genClues(seed, d), L = P.L, code = [];
  for (var i0 = 0; i0 < L; i0++) code.push(-1);
  var hints = P.clues.map(function (c) { return "«" + c.g.join(" ") + "» — " + clueText(c.s) + "."; }).join(" ");
  var cond = head(opts, d) + "Замок с подсказками. Код — " + FEMW[L] + " разные цифры от 0 до 9: ни одна в нём не повторяется. На дверце нацарапаны подсказки. " + hints + " Наберите код.";
  var digitMenu = function (i) {
    var items = [];
    for (var dg = 0; dg < 10; dg++) (function (dg) {
      items.push({ label: String(dg), fn: function () { code[i] = dg; A("play", "keypad"); say("Цифра " + (i + 1) + ": " + dg + "."); } });
    })(dg);
    UIx("menu", "Цифра " + (i + 1) + " кода", items);
  };
  start("clues", d, P, "Замок с подсказками", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < L; i++) (function (i) {
      out.push(act(function () { return "Цифра " + (i + 1) + ": " + (code[i] < 0 ? "не набрана" : code[i]); }, function () { digitMenu(i); }));
    })(i);
    out.push(act("Открыть замок", function () {
      if (code.some(function (v) { return v < 0; })) { nope("Наберите все цифры кода."); return; }
      if (code.some(function (v, j) { return code.indexOf(v) !== j; })) { nope("Цифры в коде не повторяются."); return; }
      if (code.join("") === P.secret.join("")) { A("play", "code_ok"); finish(true, "Код " + code.join(" ") + " подошёл: замок открыт."); return; }
      A("play", "term_err"); fail("Код " + code.join(" ") + " не подошёл.");
    }));
    out.push(act("Подсказки ещё раз", function () { A("play", "paper_turn"); say(hints); }));
    out.push(act("Начать заново", function () { for (var j = 0; j < L; j++) code[j] = -1; A("play", "term_off"); say("Набор стёрт."); }));
    return out;
  }, cb);
}

/* ════════ РЕГИСТРАЦИЯ ════════ */
var KINDS2 = ["jugs", "scales", "lights", "hanoi", "gates", "binary", "cipher", "series", "calib", "crossing", "robot", "latin", "clues"];
var NAMES2 = {
  jugs: "мерные сосуды", scales: "весы с пробами", lights: "щит освещения", hanoi: "перекладка контейнеров", gates: "логическая плата",
  binary: "двоичный замок", cipher: "шифр смены", series: "показания датчика", calib: "калибровка", crossing: "перевозка через шлюз",
  robot: "программа уборщика", latin: "стеллаж реактивов", clues: "замок с подсказками"
};
var GEN = { jugs: genJugs, scales: genScales, lights: genLights, hanoi: genHanoi, gates: genGates, binary: genBinary, cipher: genCipher,
  series: genSeries, calib: genCalib, crossing: genCrossing, robot: genRobot, latin: genLatin, clues: genClues };
var UIF = { jugs: jugs, scales: scales, lights: lights, hanoi: hanoi, gates: gates, binary: binary, cipher: cipher,
  series: series, calib: calib, crossing: crossing, robot: robot, latin: latin, clues: clues };
KINDS2.forEach(function (k) { LAB.puzzles.register(k, NAMES2[k], UIF[k], { diffs: true }); });
LAB.puzzles2 = {
  kinds: KINDS2.slice(), names: NAMES2, match: match,
  plan: function (kind, seed, diff) { var g = GEN[kind]; return g ? g(seed || 1, diffOf({ diff: diff })).plan.slice() : null; },
  gen: function (kind, seed, diff) { var g = GEN[kind]; return g ? g(seed || 1, diffOf({ diff: diff })) : null; },
  _scalesSolve: scalesSolve, _seriesPredict: seriesPredict, _words: CWORDS
};
})();
