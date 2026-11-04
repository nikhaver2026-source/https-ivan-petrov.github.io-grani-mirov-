/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — логические замки, часть четвёртая (4.0):
   логика и вывод. Четырнадцать видов задач из жизни комплекса, у каждой
   три ступени (opts.diff: 0 — простая, 1 — средняя, 2 — сложная):
   показания смены, перекличка, родословная списков, минная полоса,
   перфолента, пломбы на шкафчиках, сейф с дисками, шестерни привода,
   маятники смены, сортировочная горка, пятнашки щита, рассадка в
   бункере, таблица испытаний, порядок рубильников.
   Всё — окнами меню; условие переслушивается, положение — в пунктах и в
   пункте «Что сейчас». Вариативные задачи принимают ЛЮБОЕ верное решение
   (проверка ответа, а не сравнение с планом); за лучшее — «образцовое
   решение» в итоговой фразе и LAB.puzzles._last.best = true, число
   верных решений — в _last.sol. Составные объявляют этапы («Этап второй
   из двух»), итог этапа нужен следующему.
   Подключается после puzzles.js (как puzzles2.js и puzzles3.js).
   Генераторы — чистые функции зерна и ступени, без окон и без
   Math.random; решение есть всегда, единственность и число решений
   проверены перебором прямо в генераторе (с жёстким пределом).
   LAB.puzzles4 = { kinds, names, plan(вид, зерно, ступень) — путь по
   пунктам меню, решающий задачу (начала надписей, как в puzzles2.js);
   sig(вид, зерно, ступень) — подпись содержания задачи без косметики
   (имён, постов, вещей): две задачи с одной подписью — одна задача;
   solve(вид, задача, ответ) — проверка ответа: 0 — неверно, 1 — верно,
   2 — верно и образцово (задача — из gen или { seed, diff });
   gen(вид, зерно, ступень) — задача целиком, в ней ans — верный ответ }.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
if (!LAB || !LAB.puzzles || !LAB.puzzles.register || !LAB.puzzles.util) {
  if (typeof console !== "undefined") console.warn("puzzles4.js: сначала нужен puzzles.js");
  return;
}
var U = LAB.puzzles.util, run = U.run, pl = U.pl, say = U.say, UIx = U.UIx, A = U.A;

/* ════════ ОБЩЕЕ ════════ */
var HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
var LETTER = /[0-9A-Za-zА-Яа-яЁё]/;
function diffOf(opts) {
  var d = opts && opts.diff != null ? Math.floor(Number(opts.diff)) : 1;
  if (d > 2) return 2;
  if (d < 0) return 0;
  return d >= 0 ? d : 1;
}
function rngFor(seed, kind, d, salt) { return U.rng(seed, "p4:" + kind + ":" + d + (salt != null ? ":" + salt : "")); }
function head(opts, d) { return (opts && opts.title ? opts.title + ". " : "") + HEADS[d] + " "; }
function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
function andList(arr) { arr = arr.map(String); if (arr.length < 2) return arr.join(""); return arr.slice(0, -1).join(", ") + " и " + arr[arr.length - 1]; }
function intList(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
function rep(arr, n) { var out = []; for (var i = 0; i < n; i++) out.push(arr.slice()); return out; }
function popcount(x) { var c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
function lcm(a, b) { return a / gcd(a, b) * b; }
function shuffled(r, arr) { var a = arr.slice(); r.shuffle(a); return a; }
function nope(t) { A("play", "code_fail"); say(t); }
function act(label, fn) { return { label: label, keep: true, fn: fn }; }
function lab(x) { return typeof x === "function" ? x() : x; }
function info(label, text) { return { label: label, keep: true, fn: function () { say(text != null ? lab(text) : lab(label)); } }; }
function back(label) { return { label: label || "Назад", close: true, fn: function () {} }; }
function match(label, prefix) {
  label = String(label); prefix = String(prefix);
  if (label.indexOf(prefix) !== 0) return false;
  return label.length === prefix.length || !LETTER.test(label.charAt(prefix.length));
}
/* короткий тон — как в minigames.js: канал «Сигналы головоломок»; без звука (проверки) — молчит */
function tone(f, dur, when) {
  if (!LAB.Sound || typeof LAB.Sound.tone !== "function") return;
  try { LAB.Sound.tone(f, dur, { type: "triangle", pan: 0, vol: 0.16, when: when || 0, attack: 0.01, hold: true, force: true, bus: "puzzle", prio: 4 }); } catch (e) { /* */ }
}
/* Запуск: запомнить план для проверок и открыть окно условия (run из puzzles.js). */
function start(kind, d, P, title, cond, build, cb) {
  var last = LAB.puzzles._last = { kind: kind, diff: d, plan: P.plan.slice(), wrong: P.wrong.map(function (w) { return w.slice(); }),
    alts: (P.alts || []).map(function (a) { return { plan: a.plan.slice(), best: !!a.best }; }), sol: P.sol == null ? 1 : P.sol,
    stages: P.stages || 1, variable: !!P.variable, best: false, data: P.data || null, sig: P.sig, cond: cond, st: null };
  last.st = run(title, cond, build, cb);
  return last;
}
function win(last, finish, text, best, why) {
  if (best) { last.best = true; text += " Образцовое решение" + (why ? ": " + why : "") + "."; }
  A("play", "code_ok");
  finish(true, text);
}

/* ── числительные словами ── */
var ONES = { m: ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
  f: ["ноль", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
  n: ["ноль", "одно", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"] };
var TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
var TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
var HUND = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
function tri(n, g) {
  var o = [], h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
  if (h) o.push(HUND[h]);
  if (t === 1) o.push(TEENS[u]);
  else { if (t) o.push(TENS[t]); if (u) o.push(ONES[g][u]); }
  return o.join(" ");
}
function nw(n, g) {
  n = Math.round(n); g = g || "m";
  if (n < 0) return "минус " + nw(-n, g);
  if (n === 0) return "ноль";
  var th = Math.floor(n / 1000) % 1000, rest = n % 1000, parts = [];
  if (th) parts.push(th === 1 ? "тысяча" : tri(th, "f") + " " + pl(th, "тысяча", "тысячи", "тысяч"));
  if (rest) parts.push(tri(rest, g));
  return parts.join(" ");
}
function cnt(n, one, few, many, g) { return nw(n, g) + " " + pl(n, one, few, many); }
var ORDM = ["нулевой", "первый", "второй", "третий", "четвёртый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый"];
var ORDF = ["нулевая", "первая", "вторая", "третья", "четвёртая", "пятая", "шестая", "седьмая", "восьмая", "девятая", "десятая"];
var ORDN = ["нулевое", "первое", "второе", "третье", "четвёртое", "пятое", "шестое", "седьмое", "восьмое", "девятое", "десятое"];
var ORDP = ["нулевом", "первом", "втором", "третьем", "четвёртом", "пятом", "шестом", "седьмом", "восьмом", "девятом", "десятом"];
var ORDG = ["нулевого", "первого", "второго", "третьего", "четвёртого", "пятого", "шестого", "седьмого", "восьмого", "девятого", "десятого"];
var GENN = ["ноля", "одного", "двух", "трёх", "четырёх", "пяти", "шести", "семи", "восьми", "девяти", "десяти"];
var COLL = ["никто", "один", "двое", "трое", "четверо", "пятеро", "шестеро", "семеро", "восьмеро"];
var COLLA = ["никого", "одного", "двоих", "троих", "четверых", "пятерых", "шестерых", "семерых", "восьмерых"];
function stageHead(k, n) { return "Этап " + ORDM[k] + " из " + GENN[n] + "."; }

/* ── люди комплекса ── */
var MEN = ["Сухов", "Зотов", "Деев", "Глотов", "Ершов", "Волков", "Смагин", "Лунёв", "Гарин", "Орехов", "Ильин", "Нагиев", "Тихонов", "Ростовцев",
  "Котов", "Мальцев", "Фомин", "Рябов", "Карпов", "Осипов", "Жуков", "Седов", "Носов", "Кудрин"];
var WOMEN = ["Ковригина", "Ольховская", "Белозёрова", "Белова", "Агеева", "Ступина", "Чернова", "Петрова", "Серова", "Брагина", "Лапина", "Гущина",
  "Миронова", "Зуева", "Крылова", "Панова", "Егорова", "Шилова", "Тарасова", "Рудая", "Сокольская"];
function people(r, k) {
  var pool = [];
  MEN.forEach(function (n) { pool.push({ n: n, f: false }); });
  WOMEN.forEach(function (n) { pool.push({ n: n, f: true }); });
  r.shuffle(pool);
  return pool.slice(0, k);
}
/* падеж: n — именительный, g — родительный, d — дательный, a — винительный, i — творительный, p — предложный */
function dc(p, c) {
  var n = p.n;
  if (c === "n") return n;
  if (p.forms) return p.forms[c];
  if (!p.f) return n + ({ g: "а", d: "у", a: "а", i: "ым", p: "е" })[c];
  if (/ая$/.test(n)) return n.slice(0, -2) + ({ g: "ой", d: "ой", a: "ую", i: "ой", p: "ой" })[c];
  return n.slice(0, -1) + ({ g: "ой", d: "ой", a: "у", i: "ой", p: "ой" })[c];
}
function gv(p, m, f) { return p.f ? f : m; }
function names(ps, idx) { return idx.map(function (i) { return ps[i].n; }); }

/* Набор числа: подменю цифр, «Стереть всё», «Готово». */
function numMenu(title, get, set, maxLen) {
  var items = [];
  for (var dg = 0; dg <= 9; dg++) (function (dg) {
    items.push(act(String(dg), function () {
      var s = get();
      if (s.length >= maxLen) { nope("Длиннее не бывает: набрано " + s + "."); return; }
      if (s === "0") s = "";
      s += dg; set(s); A("play", "keypad"); say("Набрано: " + s + ".");
    }));
  })(dg);
  items.push(act("Стереть всё", function () { if (!get()) { say("Стирать нечего: ничего не набрано."); return; } set(""); A("play", "term_off"); say("Набор стёрт."); }));
  items.push(back("Готово"));
  UIx("menu", title, items);
}
function numPlan(v) { var p = ["Ответ", "Стереть всё"]; String(v).split("").forEach(function (ch) { p.push(ch); }); p.push("Готово"); p.push("Сдать ответ"); return p; }

/* ════════════════════════════════════════════════════════════════════
   1. ПОКАЗАНИЯ СМЕНЫ
   Каждый подозреваемый либо всегда говорит правду, либо всегда лжёт.
   Простая — трое и ровно один лжец, назвать виновного; средняя —
   четверо, лжецов ровно один или двое, назвать виновного и лжецов;
   сложная — пятеро, сколько лжецов — неизвестно, два этапа: сначала
   по первому допросу (о честности друг друга и о числе лжецов) найти
   лжецов, потом по второму (о вине) — виновного; без итога первого
   этапа второй не решается. Ответ единственный (перебор миров).
   ════════════════════════════════════════════════════════════════════ */
var TS_INC = ["ночью кто-то вскрыл склад пайков", "кто-то сорвал пломбу с насосной", "кто-то выключил вытяжку в виварии", "кто-то унёс ключ от шлюза",
  "кто-то разбил колбу с реактивом", "кто-то стёр запись в журнале смены", "кто-то увёл тележку со склада", "кто-то слил топливо из генератора",
  "кто-то перерезал провод рации", "кто-то открыл клапан на солеварне", "кто-то съел неприкосновенный запас", "кто-то выкрутил лампы в коридоре"];
var TS_TYPES = [{ G: 3, NG: 3, L: 2, T: 2 }, { G: 2, NG: 2, L: 2, T: 2, OR: 2, BL: 1, SM: 1, DF: 1 }, { L: 3, T: 3, BL: 1, SM: 2, DF: 2, CN: 2 }];
var TS_TYPES2 = { G: 2, NG: 3, OR: 2, LC: 1 };
function tsEval(s, c, L) {
  var la = s.a >= 0 ? (L >> s.a) & 1 : 0, lb = s.b >= 0 ? (L >> s.b) & 1 : 0;
  switch (s.t) {
    case "G": return c === s.a;
    case "NG": return c !== s.a;
    case "L": return la === 1;
    case "T": return la === 0;
    case "OR": return c === s.a || c === s.b;
    case "BL": return la === 1 && lb === 1;
    case "SM": return la === lb;
    case "DF": return la !== lb;
    case "CN": return popcount(L) === s.k;
    case "LC": return c >= 0 && ((L >> c) & 1) === 1;
  }
  return false;
}
/* первое показание, которое не сходится с миром (виновный c, лжецы L) */
function tsBad(sts, c, L) { for (var i = 0; i < sts.length; i++) if (tsEval(sts[i], c, L) === (((L >> sts[i].s) & 1) === 1)) return sts[i]; return null; }
function tsWorlds(n, sts, kL, useC) {
  var out = [];
  for (var L = 0; L < (1 << n); L++) {
    if (kL >= 0 && popcount(L) !== kL) continue;
    for (var c = useC ? 0 : -1; c < (useC ? n : 0); c++) if (!tsBad(sts, c, L)) out.push({ c: c, L: L });
  }
  return out;
}
function tsMake(r, n, s, types, c, L) {
  var want = ((L >> s) & 1) === 0, others = intList(n).filter(function (x) { return x !== s; });
  for (var g = 0; g < 60; g++) {
    var t = r.weighted(types), st = { s: s, t: t, a: -1, b: -1, k: -1 };
    if (t === "G" || t === "NG") st.a = r.chance(0.25) ? s : r.pick(others);
    else if (t === "L" || t === "T") st.a = r.pick(others);
    else if (t === "OR" || t === "BL" || t === "SM" || t === "DF") { var o = shuffled(r, others); st.a = Math.min(o[0], o[1]); st.b = Math.max(o[0], o[1]); }
    else if (t === "CN") st.k = r.int(0, n);
    if (tsEval(st, c, L) === want) return st;
  }
  return null;
}
function tsSay(st, ps) {
  var s = ps[st.s], a = st.a >= 0 ? ps[st.a] : null, b = st.b >= 0 ? ps[st.b] : null;
  switch (st.t) {
    case "G": return st.a === st.s ? "Это " + gv(s, "сделал", "сделала") + " я" : "Это " + gv(a, "сделал", "сделала") + " " + a.n;
    case "NG": return st.a === st.s ? "Я этого не " + gv(s, "делал", "делала") : a.n + " этого не " + gv(a, "делал", "делала");
    case "L": return a.n + " лжёт";
    case "T": return a.n + " говорит правду";
    case "OR": return "Это сделал кто-то из двоих: " + a.n + " или " + b.n;
    case "BL": return a.n + " и " + b.n + " — оба лгут";
    case "SM": return a.n + " и " + b.n + " — одного поля ягоды: или оба говорят правду, или оба лгут";
    case "DF": return "Из двоих, " + a.n + " и " + b.n + ", лжёт ровно один";
    case "CN": return st.k === 0 ? "Среди нас нет ни одного лжеца" : "Среди нас ровно " + cnt(st.k, "лжец", "лжеца", "лжецов");
    case "LC": return "Кто это сделал, тот и лжёт";
  }
  return "";
}
function tsArr(sts) { return sts.map(function (s) { return [s.s, s.t, s.a, s.b, s.k]; }); }
function genTestimony(seed, d) {
  var r = rngFor(seed, "testimony", d), n = [3, 4, 5][d], G = null, guilt = { G: 1, NG: 1, OR: 1 };
  for (var at = 0; at < 800 && !G; at++) {
    var c = r.int(0, n - 1), L = 0, kL, i, sts = [], ok = true, ord = shuffled(r, intList(n));
    if (d === 0) { kL = 1; L = 1 << ord[0]; }
    else if (d === 1) { kL = r.int(1, 2); for (i = 0; i < kL; i++) L |= 1 << ord[i]; }
    else { kL = -1; var nl = r.int(1, 3); for (i = 0; i < nl; i++) L |= 1 << ord[i]; }
    for (i = 0; i < n && ok; i++) { var st = tsMake(r, n, i, TS_TYPES[d], d === 2 ? -1 : c, L); if (!st) ok = false; else sts.push(st); }
    if (!ok) continue;
    if (d === 1) {
      var ng = sts.filter(function (s) { return guilt[s.t]; }).length;
      if (!ng || ng === n) continue;
    }
    var ws = tsWorlds(n, sts, kL, d < 2);
    if (ws.length !== 1) continue;
    var sts2 = null;
    if (d === 2) {
      for (var g2 = 0; g2 < 60 && !sts2; g2++) {
        var cand = [];
        for (i = 0; i < n; i++) { var s2 = tsMake(r, n, i, TS_TYPES2, c, L); if (!s2) break; cand.push(s2); }
        if (cand.length !== n) continue;
        var cs = 0; for (var cc = 0; cc < n; cc++) if (!tsBad(cand, cc, L)) cs++;
        if (cs === 1) sts2 = cand;
      }
      if (!sts2) continue;
    }
    G = { c: c, L: L, kL: kL, sts: sts, sts2: sts2 };
  }
  var ps = people(r, n), inc = r.pick(TS_INC), nm = function (i) { return ps[i].n; };
  var liars = intList(n).filter(function (i) { return G.L >> i & 1; }), honest = intList(n).filter(function (i) { return !(G.L >> i & 1); });
  var others = intList(n).filter(function (i) { return i !== G.c; }), plan, wrong;
  if (d === 0) { plan = ["Назвать виновного", nm(G.c)]; wrong = [["Назвать виновного", nm(others[0])], ["Назвать виновного", nm(others[1])], ["Назвать виновного", nm(others[0])]]; }
  else if (d === 1) {
    plan = ["Лжецы"].concat(names(ps, liars), ["Назад", "Виновный", nm(G.c), "Сдать вывод"]);
    wrong = [0, 1, 2].map(function (k) { return ["Виновный", nm(others[k % others.length]), "Сдать вывод"]; });
  } else {
    plan = ["Лжецы"].concat(names(ps, liars), ["Назад", "Сдать вывод о лжецах", "Виновный", nm(G.c), "Сдать вывод"]);
    wrong = rep(["Лжецы", nm(honest[0]), "Назад", "Сдать вывод о лжецах"], 3);
  }
  return { n: n, c: G.c, L: G.L, kL: G.kL, sts: G.sts, sts2: G.sts2, ps: ps, inc: inc, plan: plan, wrong: wrong, sol: 1, stages: d === 2 ? 2 : 1,
    ans: { c: G.c, L: G.L }, data: { n: n, c: G.c, L: G.L, kL: G.kL, sts: tsArr(G.sts), sts2: G.sts2 ? tsArr(G.sts2) : null },
    sig: "testimony|" + d + "|" + JSON.stringify([n, G.kL, tsArr(G.sts), G.sts2 ? tsArr(G.sts2) : 0]) };
}
function testimony(seed, cb, opts) {
  var d = diffOf(opts), P = genTestimony(seed, d), ps = P.ps, n = P.n, marks = 0, culp = -1, stage = 1;
  var nm = function (i) { return ps[i].n; };
  var line = function (s) { return nm(s.s) + ": «" + tsSay(s, ps) + "»"; };
  var lines = function (arr) { return arr.map(function (s) { return line(s) + "."; }).join(" "); };
  var marked = function (mask) { var a = []; for (var i = 0; i < n; i++) if (mask >> i & 1) a.push(nm(i)); return a; };
  var cond = head(opts, d) + "Показания смены. Комендант разбирается: " + P.inc + ". Это сделал кто-то один из " + COLLA[n] + ": " + andList(ps.map(function (p) { return p.n; })) + ". ";
  if (d === 0) cond += "Один из них всегда лжёт, двое других говорят только правду. Показания. " + lines(P.sts) + " Кто виноват?";
  else if (d === 1) cond += "Каждый из них либо всегда говорит правду, либо всегда лжёт; " + (P.kL === 1 ? "лжёт ровно один" : "лгут ровно двое") + ". Показания. " + lines(P.sts) + " Назовите виновного и отметьте лжецов.";
  else cond += "Каждый из них либо всегда говорит правду, либо всегда лжёт; сколько среди них лжецов — неизвестно. " + stageHead(1, 2) + " Кто лжёт. Первый допрос — о честности. " + lines(P.sts) + " Отметьте лжецов; на втором допросе каждый скажет, кто, по его словам, виноват.";
  var stage2 = stageHead(2, 2) + " Кто виноват. Второй допрос. " + (P.sts2 ? lines(P.sts2) : "") + " Лжецы лгут и теперь. Назовите виновного.";
  var liarText = function (mask) { var a = marked(mask); return a.length ? andList(a) : "никто"; };
  var why = function (sts, c, mask) {
    var bad = tsBad(sts, c, mask);
    if (!bad) return "";
    var s = ps[bad.s], hon = !(mask >> bad.s & 1);
    return "по-вашему, " + s.n + (hon ? " говорит правду, но тогда " : " лжёт, но тогда ") + gv(s, "его", "её") + " слова «" + tsSay(bad, ps) + "» — " + (hon ? "неправда." : "правда.");
  };
  var last = start("testimony", d, P, "Показания смены", cond, function (st, finish, fail) {
    var out = [];
    (stage === 1 ? P.sts : P.sts2).forEach(function (s) { out.push(info(line(s))); });
    var culpMenu = function (title, check) {
      UIx("menu", title, ps.map(function (p, i) {
        return { label: p.n, fn: function () { check(i); } };
      }));
    };
    if (d === 0) {
      out.push(act("Назвать виновного", function () {
        culpMenu("Кто виноват", function (i) {
          if (i === P.c) { var li = intList(n).filter(function (x) { return P.L >> x & 1; })[0]; win(last, finish, "Верно: это " + gv(ps[i], "сделал", "сделала") + " " + nm(i) + ". " + nm(li) + " " + gv(ps[li], "лгал", "лгала") + ", остальные говорили правду.", false); return; }
          A("play", "term_err");
          fail("Нет: если это " + gv(ps[i], "сделал", "сделала") + " " + nm(i) + ", ровно одного лжеца среди троих не выходит.");
        });
      }));
      out.push(act("Что сейчас", function () { say("Нужно назвать виновного. Лжёт ровно один из троих. Показания: " + lines(P.sts)); }));
      return out;
    }
    if (stage === 1) {
      out.push(act(function () { return "Лжецы: " + (marks ? andList(marked(marks)) : "никто не отмечен"); }, function () {
        var items = ps.map(function (p, i) {
          return act(function () { return p.n + ": " + (marks >> i & 1 ? "лжёт" : "не отмечен" + gv(p, "", "а")); }, function () {
            marks ^= 1 << i; A("play", marks >> i & 1 ? "term_beep" : "term_off");
            say(p.n + (marks >> i & 1 ? " — отмечен" + gv(p, "", "а") + " лжецом." : " — отметка снята.") + " Лжецы: " + liarText(marks) + ".");
          });
        });
        items.push(back("Назад"));
        UIx("menu", "Кто лжёт", items);
      }));
    } else {
      out.push(info("Первый допрос", function () { return "Первый допрос: " + lines(P.sts) + " Лжецы, это уже установлено: " + liarText(P.L) + "."; }));
    }
    if (d === 1 || stage === 2) {
      out.push(act(function () { return "Виновный: " + (culp >= 0 ? nm(culp) : "не назван"); }, function () {
        culpMenu("Кто виноват", function (i) { culp = i; A("play", "term_beep"); say("Виновным назван" + gv(ps[i], "", "а") + " " + nm(i) + "."); });
      }));
    }
    if (d === 2 && stage === 1) {
      out.push(act("Сдать вывод о лжецах", function () {
        if (marks === P.L) { A("play", "paper_turn"); stage = 2; say("Верно: лгут " + liarText(P.L) + ". " + stage2); return; }
        A("play", "term_err");
        fail("Не сходится: " + (why(P.sts, -1, marks) || "отметки не те."));
      }));
    } else {
      out.push(act("Сдать вывод", function () {
        if (culp < 0) { nope("Сначала назовите виновного."); return; }
        if (d === 1) {
          if (culp === P.c && marks === P.L) { win(last, finish, "Верно: это " + gv(ps[culp], "сделал", "сделала") + " " + nm(culp) + ", а лгут " + liarText(P.L) + ".", false); return; }
          A("play", "term_err");
          var w1 = why(P.sts, culp, marks), mk = popcount(marks);
          if (!w1) w1 = (P.kL === 1 ? "лжёт ровно один" : "лгут ровно двое") + ", а " + (mk === 0 ? "не отмечен никто" : mk === 1 ? "отмечен один" : "отмечено " + COLL[mk]) + ".";
          fail("Не сходится: " + w1);
          return;
        }
        if (culp === P.c) { win(last, finish, "Верно: это " + gv(ps[culp], "сделал", "сделала") + " " + nm(culp) + ". Лгали " + liarText(P.L) + ".", false); return; }
        A("play", "term_err");
        var bad = tsBad(P.sts2, culp, P.L), sp = bad ? ps[bad.s] : ps[0], hon = bad ? !(P.L >> bad.s & 1) : true;
        fail("Нет: если это " + gv(ps[culp], "сделал", "сделала") + " " + nm(culp) + ", то слова " + dc(sp, "g") + " «" + (bad ? tsSay(bad, ps) : "") + "» — " + (hon ? "неправда, а " + sp.n + " говорит правду." : "правда, а " + sp.n + " лжёт."));
      }));
    }
    out.push(act("Что сейчас", function () {
      if (d === 2 && stage === 2) { say("Этап второй из двух. Лжецы: " + liarText(P.L) + ". Виновный: " + (culp >= 0 ? nm(culp) : "не назван") + ". Второй допрос: " + lines(P.sts2)); return; }
      say((d === 2 ? "Этап первый из двух: кто лжёт. " : "") + "Отмечены лжецами: " + liarText(marks) + "." + (d === 1 ? " Виновный: " + (culp >= 0 ? nm(culp) : "не назван") + ". " + (P.kL === 1 ? "Лжёт ровно один." : "Лгут ровно двое.") : ""));
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   2. ПЕРЕКЛИЧКА
   «Перекличка» вызывает всех по списку и записывает, с какого поста
   пришёл ответ «здесь». Кого-то на смене не было: за него ответил другой
   — своим голосом, со своего поста; остальные ответили за себя. По
   турникетам, журналам постов и правилам смены найти, кто не ответил
   сам и кто ответил за него. Простая — пятеро, два поста, турникеты
   всех постов; средняя — шестеро, три поста, часть турникетов, иногда
   правило напарников; сложная — восьмеро, четыре поста и двое
   отсутствующих: две пары, порядок пар любой. Ответ единственный
   (перебор всех гипотез).
   ════════════════════════════════════════════════════════════════════ */
var RC_POSTS = [
  { n: "насосная", g: "насосной", at: "на насосной", fr: "с насосной" }, { n: "шлюз", g: "шлюза", at: "на шлюзе", fr: "со шлюза" },
  { n: "радиорубка", g: "радиорубки", at: "в радиорубке", fr: "из радиорубки" }, { n: "кухня", g: "кухни", at: "на кухне", fr: "с кухни" },
  { n: "склад", g: "склада", at: "на складе", fr: "со склада" }, { n: "буровая", g: "буровой", at: "на буровой", fr: "с буровой" },
  { n: "лазарет", g: "лазарета", at: "в лазарете", fr: "из лазарета" }, { n: "солеварня", g: "солеварни", at: "на солеварне", fr: "с солеварни" },
  { n: "щитовая", g: "щитовой", at: "в щитовой", fr: "из щитовой" }
];
function rcHyps(n, na, ans, part) {
  var out = [], a, i, a2, i2;
  if (na === 1) {
    for (a = 0; a < n; a++) for (i = 0; i < n; i++) if (i !== a && ans[i] === ans[a] && (!part || part[a] === i)) out.push({ abs: [a], imp: [i] });
    return out;
  }
  for (a = 0; a < n; a++) for (a2 = a + 1; a2 < n; a2++) for (i = 0; i < n; i++) {
    if (i === a || i === a2 || ans[i] !== ans[a] || (part && part[a] !== i)) continue;
    for (i2 = 0; i2 < n; i2++) {
      if (i2 === a || i2 === a2 || i2 === i || ans[i2] !== ans[a2] || (part && part[a2] !== i2)) continue;
      out.push({ abs: [a, a2], imp: [i, i2] });
    }
  }
  return out;
}
function rcCount(h, ans, p) { var c = 0; for (var x = 0; x < ans.length; x++) if (ans[x] === p && h.abs.indexOf(x) < 0) c++; return c; }
function rcTrue(c, h, ans) {
  switch (c.t) {
    case "HC": return rcCount(h, ans, c.p) === c.k;
    case "AT": return h.abs.indexOf(c.a) < 0;
    case "VO": return h.imp.indexOf(c.a) < 0;
    case "TG": return h.abs.indexOf(c.a) < 0 && h.abs.indexOf(c.b) < 0;
    case "AP": return h.abs.indexOf(c.a) >= 0 || h.abs.indexOf(c.b) >= 0;
    case "MO": return rcCount(h, ans, c.p) > rcCount(h, ans, c.q);
  }
  return false;
}
function rcSay(c, ps, posts, ans) {
  var a = c.a >= 0 ? ps[c.a] : null, b = c.b >= 0 ? ps[c.b] : null;
  switch (c.t) {
    case "HC": return "турникет " + posts[c.p].g + " насчитал " + (c.k === 1 ? "одного человека" : COLLA[c.k]);
    case "AT": return a.n + " " + gv(a, "расписался", "расписалась") + " в журнале " + posts[ans[c.a]].g;
    case "VO": return a.n + " " + gv(a, "отвечал", "отвечала") + " только за себя";
    case "TG": return a.n + " и " + b.n + " дежурили вместе";
    case "AP": return a.n + " и " + b.n + " вместе не дежурили";
    case "MO": return posts[c.p].at + " было больше людей, чем " + posts[c.q].at;
  }
  return "";
}
function genRollcall(seed, d) {
  var r = rngFor(seed, "rollcall", d), n = [5, 6, 8][d], m = [2, 3, 4][d], na = d === 2 ? 2 : 1, G = null, i, j;
  for (var at = 0; at < 300 && !G; at++) {
    var usePart = d === 1 ? r.chance(0.5) : d === 2 ? r.chance(0.6) : false, part = null, o;
    if (usePart) { o = shuffled(r, intList(n)); part = intList(n); for (i = 0; i < n; i += 2) { part[o[i]] = o[i + 1]; part[o[i + 1]] = o[i]; } }
    var ord = shuffled(r, intList(n)), abs = ord.slice(0, na);
    if (usePart && na === 2 && part[abs[0]] === abs[1]) continue;
    var present = ord.slice(na), imp;
    if (usePart) imp = abs.map(function (a) { return part[a]; });
    else { var pr = shuffled(r, present); imp = abs.map(function (a, k) { return pr[k]; }); }
    var post = intList(n).map(function () { return -1; }), pp = shuffled(r, present);
    for (i = 0; i < pp.length; i++) post[pp[i]] = i < m ? i : r.int(0, m - 1);
    var ans = post.slice(); abs.forEach(function (a, k) { ans[a] = post[imp[k]]; });
    var truth = { abs: abs.slice(), imp: imp.slice() };
    if (na === 2 && truth.abs[0] > truth.abs[1]) { truth.abs.reverse(); truth.imp.reverse(); }
    var hyps = rcHyps(n, na, ans, part), pool = [], forced = [], p, q;
    for (p = 0; p < m; p++) { var hc = { t: "HC", p: p, k: rcCount(truth, ans, p), a: -1, b: -1, q: -1 }; if (d === 0) forced.push(hc); else pool.push(hc); }
    present.forEach(function (x) { pool.push({ t: "AT", a: x, b: -1, p: -1, q: -1, k: -1 }); if (imp.indexOf(x) < 0) pool.push({ t: "VO", a: x, b: -1, p: -1, q: -1, k: -1 }); });
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      if (ans[i] !== ans[j]) continue;
      var ia = abs.indexOf(i) >= 0, ja = abs.indexOf(j) >= 0;
      pool.push({ t: !ia && !ja ? "TG" : "AP", a: i, b: j, p: -1, q: -1, k: -1 });
    }
    if (d > 0) for (p = 0; p < m; p++) for (q = 0; q < m; q++) if (p !== q && rcCount(truth, ans, p) > rcCount(truth, ans, q)) pool.push({ t: "MO", p: p, q: q, a: -1, b: -1, k: -1 });
    r.shuffle(pool);
    var chosen = forced.slice(), alive = hyps.filter(function (h) { return chosen.every(function (c) { return rcTrue(c, h, ans); }); });
    for (i = 0; i < pool.length && alive.length > 1; i++) {
      var c0 = pool[i], nx = alive.filter(function (h) { return rcTrue(c0, h, ans); });
      if (nx.length < alive.length) { chosen.push(c0); alive = nx; }
    }
    if (alive.length !== 1) continue;
    if (d > 0) {
      for (i = chosen.length - 1; i >= 0; i--) {
        var rest = chosen.slice(0, i).concat(chosen.slice(i + 1));
        if (hyps.filter(function (h) { return rest.every(function (c) { return rcTrue(c, h, ans); }); }).length === 1) chosen = rest;
      }
    }
    var lo = [2, 2, 3][d], hi = [6, 6, 8][d];
    if (chosen.length < lo || chosen.length > hi) continue;
    r.shuffle(chosen);
    if (d === 0) chosen.sort(function (x, y) { return (x.t === "HC" ? 0 : 1) - (y.t === "HC" ? 0 : 1); });
    G = { ans: ans, part: part, truth: truth, clues: chosen, hyps: hyps.length };
  }
  var ps = people(r, n), posts = shuffled(r, RC_POSTS).slice(0, m), nm = function (x) { return ps[x].n; }, T = G.truth, plan, wrong, alts = [];
  var others = function (ex) { return intList(n).filter(function (x) { return ex.indexOf(x) < 0; }); };
  if (na === 1) {
    plan = ["Не ответил сам", nm(T.abs[0]), "Ответил за него", nm(T.imp[0]), "Сдать вывод"];
    var wa = others([T.abs[0]]);
    wrong = [0, 1, 2].map(function (k) { var a = wa[k % wa.length], ii = others([a])[0]; return ["Не ответил сам", nm(a), "Ответил за него", nm(ii), "Сдать вывод"]; });
  } else {
    var mk = function (a1, i1, a2, i2) { return ["Первый, кто не ответил", nm(a1), "Ответил за первого", nm(i1), "Второй, кто не ответил", nm(a2), "Ответил за второго", nm(i2), "Сдать вывод"]; };
    plan = mk(T.abs[0], T.imp[0], T.abs[1], T.imp[1]);
    alts.push({ plan: mk(T.abs[1], T.imp[1], T.abs[0], T.imp[0]), best: false });
    var wb = others([T.abs[0], T.abs[1]]);
    wrong = [0, 1, 2].map(function (k) { var a = wb[k % wb.length], ii = others([a, T.abs[1]])[0]; return mk(a, ii, T.abs[1], T.imp[1]); });
  }
  return { n: n, m: m, na: na, rec: G.ans, part: G.part, truth: T, clues: G.clues, ps: ps, posts: posts, plan: plan, wrong: wrong, alts: alts, sol: 1, hyps: G.hyps,
    ans: { abs: T.abs.slice(), imp: T.imp.slice() },
    data: { n: n, m: m, na: na, ans: G.ans.slice(), part: G.part, abs: T.abs.slice(), imp: T.imp.slice(), clues: G.clues.map(function (c) { return [c.t, c.a, c.b, c.p, c.q, c.k]; }) },
    sig: "rollcall|" + d + "|" + JSON.stringify([n, m, na, G.ans, G.part || 0, G.clues.map(function (c) { return [c.t, c.a, c.b, c.p, c.q, c.k]; }).sort()]) };
}
function rcSame(h, T) {
  if (h.abs.length !== T.abs.length) return false;
  var key = function (x) { return x.abs.map(function (a, k) { return a + ":" + x.imp[k]; }).sort().join(","); };
  return key(h) === key(T);
}
function rollcall(seed, cb, opts) {
  var d = diffOf(opts), P = genRollcall(seed, d), ps = P.ps, posts = P.posts, n = P.n, na = P.na;
  var selA = [-1, -1], selI = [-1, -1];
  var nm = function (x) { return ps[x].n; };
  var record = ps.map(function (p, x) { return p.n + " — " + posts[P.rec[x]].fr; }).join(", ");
  var rules = P.clues.map(function (c) { return rcSay(c, ps, posts, P.rec); });
  var partText = "";
  if (P.part) { var pr = []; for (var x0 = 0; x0 < n; x0++) if (P.part[x0] > x0) pr.push(nm(x0) + " и " + nm(P.part[x0])); partText = "За товарища «Перекличка» принимает ответ только от напарника; напарники — " + pr.join(", ") + ". "; }
  var cond = head(opts, d) + "Перекличка. В двадцать ноль-ноль «Перекличка» вызвала по списку всех " + COLLA[n] + ". На каждый вызов кто-нибудь ответил «здесь», а «Перекличка» записала, откуда пришёл голос: " + record + ". " +
    (na === 1 ? "Но одного на смене не было: за него ответил кто-то другой — своим голосом, со своего поста. " : "Но двоих на смене не было: за каждого ответил кто-то другой — своим голосом, со своего поста, и никто не отвечал за двоих. ") +
    "Все, кто был на смене, ответили за себя сами — с того поста, где стояли. " + partText + "Записи постов: " + rules.join("; ") + ". " +
    (na === 1 ? "Кто не ответил сам и кто ответил за него?" : "Кто двое не ответили сами и кто ответил за каждого?");
  var hyp = function () { return na === 1 ? { abs: [selA[0]], imp: [selI[0]] } : { abs: [selA[0], selA[1]], imp: [selI[0], selI[1]] }; };
  var whyNot = function (h) {
    for (var k = 0; k < h.abs.length; k++) {
      var a = h.abs[k], i = h.imp[k], pa = ps[a], pi = ps[i];
      if (h.abs.indexOf(i) >= 0) return pi.n + " и " + gv(pi, "сам", "сама") + " не " + gv(pi, "был", "была") + " на смене — ответить за другого " + gv(pi, "он", "она") + " не " + gv(pi, "мог", "могла") + ".";
      if (P.rec[i] !== P.rec[a]) return pi.n + " " + gv(pi, "отвечал", "отвечала") + " " + posts[P.rec[i]].fr + ", а голос за " + dc(pa, "a") + " пришёл " + posts[P.rec[a]].fr + ": " + gv(pi, "он", "она") + " не " + gv(pi, "мог", "могла") + " ответить за " + dc(pa, "a") + ".";
      if (P.part && P.part[a] !== i) return pi.n + " — не напарник " + dc(pa, "g") + ", а за товарища отвечает только напарник.";
    }
    if (na === 2 && h.imp[0] === h.imp[1]) return "Никто не отвечал за двоих.";
    for (var c = 0; c < P.clues.length; c++) if (!rcTrue(P.clues[c], h, P.rec)) return "Не сходится с записью: «" + rules[c] + "».";
    return "Не сходится с записями.";
  };
  var pick = function (title, set) {
    UIx("menu", title, ps.map(function (p, x) { return { label: p.n, fn: function () { set(x); A("play", "term_beep"); say(title + ": " + p.n + "."); } }; }));
  };
  var slot = function (label, title, get, set) {
    return act(function () { var v = get(); return label + ": " + (v >= 0 ? nm(v) : "не назван"); }, function () { pick(title, set); });
  };
  var last = start("rollcall", d, P, "Перекличка", cond, function (st, finish, fail) {
    var out = [info("Записи переклички", function () { return "Записи переклички: " + record + "."; }), info("Записи постов и правила", function () { return partText + "Записи постов: " + rules.join("; ") + "."; })];
    if (na === 1) {
      out.push(slot("Не ответил сам", "Не ответил сам", function () { return selA[0]; }, function (v) { selA[0] = v; }));
      out.push(slot("Ответил за него", "Ответил за него", function () { return selI[0]; }, function (v) { selI[0] = v; }));
    } else {
      out.push(slot("Первый, кто не ответил", "Первый, кто не ответил", function () { return selA[0]; }, function (v) { selA[0] = v; }));
      out.push(slot("Ответил за первого", "Ответил за первого", function () { return selI[0]; }, function (v) { selI[0] = v; }));
      out.push(slot("Второй, кто не ответил", "Второй, кто не ответил", function () { return selA[1]; }, function (v) { selA[1] = v; }));
      out.push(slot("Ответил за второго", "Ответил за второго", function () { return selI[1]; }, function (v) { selI[1] = v; }));
    }
    out.push(act("Сдать вывод", function () {
      for (var k = 0; k < na; k++) {
        if (selA[k] < 0 || selI[k] < 0) { nope("Назовите и того, кто не ответил, и того, кто ответил за него."); return; }
        if (selA[k] === selI[k]) { nope("Один и тот же человек не мог и не прийти, и ответить за себя чужим голосом."); return; }
      }
      if (na === 2 && selA[0] === selA[1]) { nope("Отсутствующих двое, и это разные люди."); return; }
      var h = hyp();
      if (rcSame(h, P.truth)) {
        win(last, finish, "Верно. " + P.truth.abs.map(function (a, k) { return dc(ps[a], "g") + " на смене не было: за " + gv(ps[a], "него", "неё") + " " + gv(ps[P.truth.imp[k]], "ответил", "ответила") + " " + nm(P.truth.imp[k]); }).join("; ") + ". «Перекличка» исправила журнал.", false);
        return;
      }
      A("play", "term_err");
      fail(whyNot(h));
    }));
    out.push(act("Что сейчас", function () {
      var parts = [];
      for (var k = 0; k < na; k++) parts.push((na === 2 ? (k ? "Второй: " : "Первый: ") : "") + "не ответил сам — " + (selA[k] >= 0 ? nm(selA[k]) : "не назван") + ", ответил за него — " + (selI[k] >= 0 ? nm(selI[k]) : "не назван"));
      say(parts.join(". ") + ".");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   3. РОДОСЛОВНАЯ СПИСКОВ
   Дерево: у каждого, кроме основателя (родоначальника), ровно один
   наставник (родитель) из того же списка. Записи — о прямой связи, о
   числе учеников, об общих наставниках, о «школе» (потомках), о
   поколениях. Простая — четверо-пятеро и основатель назван; средняя —
   шестеро, основателя надо вывести, есть внуки и поколения; сложная —
   семеро, почти без прямых связей: школы, поколения, сравнения. Дерево
   единственное: решатель с отсечениями считает деревья до двух.
   ════════════════════════════════════════════════════════════════════ */
var FIRST_M = ["Глеб", "Егор", "Иван", "Семён", "Тимофей", "Фёдор", "Артём", "Матвей", "Роман", "Степан", "Яков", "Олег", "Борис", "Вадим", "Денис", "Кирилл", "Арсений", "Остап"];
var FIRST_F = ["Анна", "Вера", "Нина", "Зоя", "Мария", "Дарья", "Ольга", "Лидия", "Полина", "Алёна", "Софья", "Ульяна", "Галина", "Майя", "Таисия", "Ксения", "Елена", "Марфа"];
function firstPerson(nm, f) {
  var s = nm.slice(0, -1), fm;
  if (!f) fm = /й$/.test(nm) ? { g: s + "я", d: s + "ю", a: s + "я", i: s + "ем", p: s + "е" } : { g: nm + "а", d: nm + "у", a: nm + "а", i: nm + "ом", p: nm + "е" };
  else if (/ия$/.test(nm)) fm = { g: s + "и", d: s + "и", a: s + "ю", i: s + "ей", p: s + "и" };
  else if (/я$/.test(nm)) fm = { g: s + "и", d: s + "е", a: s + "ю", i: s + "ей", p: s + "е" };
  else fm = { g: s + (/[гкхжшчщ]$/.test(s) ? "и" : "ы"), d: s + "е", a: s + "у", i: s + "ой", p: s + "е" };
  return { n: nm, f: f, forms: fm };
}
var SC_FL = {
  school: {
    intro: "Записи школы наставников: у каждого, кроме основателя, был ровно один наставник — тоже из этого списка. Поколения считаются от основателя: он — первое поколение, его ученики — второе, их ученики — третье. Школа наставника — его ученики, ученики его учеников и так далее.",
    par: function (X, Y) { return X.n + " — " + gv(X, "ученик", "ученица") + " " + dc(Y, "g"); },
    npar: function (X, Y) { return Y.n + " не " + gv(Y, "учил", "учила") + " " + dc(X, "a"); },
    kids: function (Y, k) { return "у " + dc(Y, "g") + (k === 0 ? " учеников не было" : k === 1 ? " был один ученик" : " было " + cnt(k, "ученик", "ученика", "учеников")); },
    sib: function (X, Z) { return X.n + " и " + Z.n + " учились у одного наставника"; },
    nsib: function (X, Z) { return X.n + " и " + Z.n + " учились у разных наставников"; },
    grand: function (X, Y) { return "наставник " + dc(X, "g") + " сам учился у " + dc(Y, "g"); },
    anc: function (X, Y) { return X.n + " — из школы " + dc(Y, "g"); },
    nanc: function (X, Y) { return X.n + " — не из школы " + dc(Y, "g"); },
    root: function (X) { return X.n + " — " + gv(X, "основатель школы: сам он ни у кого не учился", "основательница школы: сама она ни у кого не училась"); },
    gen: function (X, k) { return X.n + " — из " + ORDG[k] + " поколения школы"; },
    same: function (X, Z) { return X.n + " и " + Z.n + " — из одного поколения"; },
    more: function (Y, Z) { return "у " + dc(Y, "g") + " учеников больше, чем у " + dc(Z, "g"); },
    item: function (X, Y) { return X.n + ": " + (Y === undefined ? "наставник не указан" : Y === null ? gv(X, "основатель школы", "основательница школы") : "наставник — " + Y.n); },
    ask: function (X) { return X.n + ": кто наставник"; },
    rootOpt: "Без наставника — основатель школы", rootPre: "Без наставника", noun: "школа", submit: "Сдать список школы",
    two: "основателей выходит двое", none: "основателя нет", done: "Список школы восстановлен"
  },
  family: {
    intro: "Родословная Нижних: в списках у каждого, кроме родоначальника, записан ровно один родитель — тоже из этого списка. Поколения считаются от родоначальника: он — первое поколение, его дети — второе, внуки — третье. Потомки — дети, внуки, правнуки и так далее.",
    par: function (X, Y) { return X.n + " — " + gv(X, "сын", "дочь") + " " + dc(Y, "g"); },
    npar: function (X, Y) { return Y.n + " — не " + gv(Y, "отец", "мать") + " " + dc(X, "g"); },
    kids: function (Y, k) { return "у " + dc(Y, "g") + (k === 0 ? " детей нет" : k === 1 ? " один ребёнок" : " " + COLL[k] + " детей"); },
    sib: function (X, Z) { return X.n + " и " + Z.n + " — " + (!X.f && !Z.f ? "братья" : X.f && Z.f ? "сёстры" : "брат и сестра") + ": родитель у них один"; },
    nsib: function (X, Z) { return "у " + dc(X, "g") + " и " + dc(Z, "g") + " разные родители"; },
    grand: function (X, Y) { return X.n + " — " + gv(X, "внук", "внучка") + " " + dc(Y, "g"); },
    anc: function (X, Y) { return X.n + " — из потомков " + dc(Y, "g"); },
    nanc: function (X, Y) { return X.n + " — не из потомков " + dc(Y, "g"); },
    root: function (X) { return X.n + " — " + gv(X, "родоначальник: его", "родоначальница: её") + " родителя в списках нет"; },
    gen: function (X, k) { return X.n + " — из " + ORDG[k] + " поколения"; },
    same: function (X, Z) { return X.n + " и " + Z.n + " — из одного поколения"; },
    more: function (Y, Z) { return "у " + dc(Y, "g") + " детей больше, чем у " + dc(Z, "g"); },
    item: function (X, Y) { return X.n + ": " + (Y === undefined ? "родитель не указан" : Y === null ? gv(X, "родоначальник", "родоначальница") : "родитель — " + Y.n); },
    ask: function (X) { return X.n + ": кто родитель"; },
    rootOpt: "Без родителя — родоначальник рода", rootPre: "Без родителя", noun: "род", submit: "Сдать родословную",
    two: "родоначальников выходит двое", none: "родоначальника нет", done: "Родословная восстановлена"
  }
};
var SC_W = [{ PAR: 3, NPAR: 2, KIDS: 3, SIB: 2 }, { PAR: 1, NPAR: 2, KIDS: 3, SIB: 2, NSIB: 1, GRAND: 2, GEN: 2, ROOT: 1 },
  { PAR: 1, NPAR: 1, KIDS: 2, SIB: 2, NSIB: 1, GRAND: 2, ANC: 2, NANC: 1, GEN: 2, SAME: 2, MORE: 1 }];
function scDepth(par, x) { var dd = 1, z = x, g = 0; while (par[z] >= 0 && g++ < 20) { z = par[z]; dd++; } return dd; }
function scKids(par, y) { var c = 0; for (var i = 0; i < par.length; i++) if (par[i] === y) c++; return c; }
/* частичная оценка записи: 1 — верна, 0 — ложна, 2 — пока неизвестно (-2 — у узла ещё нет родителя) */
function scDep(par, x) { var dd = 1, z = x, g = 0; for (;;) { var p = par[z]; if (p === -2) return -dd; if (p === -1) return dd; z = p; dd++; if (g++ > par.length) return 99; } }
function scPart(s, par) {
  var n = par.length, i, c, u, z, px, pz;
  switch (s.t) {
    case "PAR": return par[s.x] === -2 ? 2 : par[s.x] === s.y ? 1 : 0;
    case "NPAR": return par[s.x] === -2 ? 2 : par[s.x] !== s.y ? 1 : 0;
    case "ROOT": return par[s.x] === -2 ? 2 : par[s.x] === -1 ? 1 : 0;
    case "KIDS":
      c = 0; u = 0; for (i = 0; i < n; i++) { if (par[i] === s.y) c++; else if (par[i] === -2 && i !== s.y) u++; }
      if (c > s.k || c + u < s.k) return 0;
      return u === 0 ? 1 : 2;
    case "SIB": case "NSIB":
      px = par[s.x]; pz = par[s.z];
      if (px === -1 || pz === -1) return 0;
      if (px === -2 || pz === -2) return 2;
      return (px === pz) === (s.t === "SIB") ? 1 : 0;
    case "GRAND":
      px = par[s.x]; if (px === -2) return 2; if (px === -1) return 0;
      z = par[px]; if (z === -2) return 2; return z === s.y ? 1 : 0;
    case "ANC": case "NANC":
      z = par[s.x];
      for (i = 0; i <= n; i++) {
        if (z === -2) return 2;
        if (z === -1) return s.t === "ANC" ? 0 : 1;
        if (z === s.y) return s.t === "ANC" ? 1 : 0;
        z = par[z];
      }
      return 0;
    case "GEN": c = scDep(par, s.x); if (c > 0) return c === s.k ? 1 : 0; return -c > s.k ? 0 : 2;
    case "SAME": c = scDep(par, s.x); u = scDep(par, s.z); if (c > 0 && u > 0) return c === u ? 1 : 0; if (c > 0 && u < 0 && -u > c) return 0; if (u > 0 && c < 0 && -c > u) return 0; return 2;
    case "MORE":
      var cy = 0, cz = 0; u = 0;
      for (i = 0; i < n; i++) { if (par[i] === s.y) cy++; else if (par[i] === s.z) cz++; else if (par[i] === -2) u++; }
      if (cy + u <= cz) return 0;
      if (cy > cz + u) return 1;
      return u === 0 ? (cy > cz ? 1 : 0) : 2;
  }
  return 0;
}
function scCount(n, sts, limit, cap) {
  cap = cap || 200000;
  var dom = [], x, y, k;
  for (x = 0; x < n; x++) { dom.push([-1]); for (y = 0; y < n; y++) if (y !== x) dom[x].push(y); }
  sts.forEach(function (s) {
    if (s.t === "PAR") dom[s.x] = dom[s.x].filter(function (v) { return v === s.y; });
    else if (s.t === "NPAR") dom[s.x] = dom[s.x].filter(function (v) { return v !== s.y; });
    else if (s.t === "ROOT" || (s.t === "GEN" && s.k === 1)) dom[s.x] = dom[s.x].filter(function (v) { return v === -1; });
    else if (s.t === "GEN" || s.t === "SIB" || s.t === "NSIB" || s.t === "GRAND" || s.t === "ANC") { dom[s.x] = dom[s.x].filter(function (v) { return v !== -1; }); if (s.t === "SIB" || s.t === "NSIB") dom[s.z] = dom[s.z].filter(function (v) { return v !== -1; }); }
  });
  var deg = intList(n).map(function () { return 0; });
  sts.forEach(function (s) { [s.x, s.y, s.z].forEach(function (v) { if (v >= 0) deg[v]++; }); });
  var order = intList(n).sort(function (a, b) { return dom[a].length - dom[b].length || deg[b] - deg[a] || a - b; });
  var par = intList(n).map(function () { return -2; }), roots = 0, count = 0, sol = null, nodes = 0;
  var okNow = function () { for (var i = 0; i < sts.length; i++) if (scPart(sts[i], par) === 0) return false; return true; };
  var cyc = function (x0, v) { var z = v, g = 0; while (z >= 0 && g++ <= n) { if (z === x0) return true; z = par[z]; } return false; };
  var rec = function (kk) {
    if (count >= limit || nodes > cap) return;
    nodes++;
    if (kk === n) {
      if (roots !== 1) return;
      for (var i = 0; i < sts.length; i++) if (scPart(sts[i], par) !== 1) return;
      count++; if (!sol) sol = par.slice(); return;
    }
    var xx = order[kk], dm = dom[xx];
    for (var j = 0; j < dm.length && count < limit; j++) {
      var v = dm[j];
      if (v === -1) { if (roots) continue; roots = 1; par[xx] = -1; if (okNow()) rec(kk + 1); roots = 0; par[xx] = -2; }
      else { if (cyc(xx, v)) continue; par[xx] = v; if (okNow()) rec(kk + 1); par[xx] = -2; }
    }
  };
  rec(0);
  return { count: nodes > cap ? limit : count, sol: sol };
}
function scTree(r, n, maxDep, minDep) {
  for (var g = 0; g < 200; g++) {
    var ord = shuffled(r, intList(n)), par = intList(n).map(function () { return -1; }), dep = intList(n).map(function () { return 0; }), kids = dep.slice(), ok = true;
    dep[ord[0]] = 1;
    for (var k = 1; k < n && ok; k++) {
      var x = ord[k], cand = ord.slice(0, k).filter(function (y) { return dep[y] < maxDep && kids[y] < 3; });
      if (!cand.length) { ok = false; break; }
      var y = r.pick(cand); par[x] = y; dep[x] = dep[y] + 1; kids[y]++;
    }
    if (!ok) continue;
    var md = Math.max.apply(null, dep);
    if (md < minDep) continue;
    return { par: par, root: ord[0] };
  }
  return null;
}
function scPool(par, root, d) {
  var n = par.length, pool = [], x, y, z, w = SC_W[d];
  var add = function (s) { if (w[s.t]) pool.push(s); };
  for (x = 0; x < n; x++) for (y = 0; y < n; y++) {
    if (x === y) continue;
    if (par[x] === y) add({ t: "PAR", x: x, y: y, z: -1, k: -1 }); else add({ t: "NPAR", x: x, y: y, z: -1, k: -1 });
    if (par[x] >= 0 && par[par[x]] === y) add({ t: "GRAND", x: x, y: y, z: -1, k: -1 });
    var anc = false, q = par[x]; while (q >= 0) { if (q === y) anc = true; q = par[q]; }
    if (y !== root) add({ t: anc ? "ANC" : "NANC", x: x, y: y, z: -1, k: -1 });
  }
  for (y = 0; y < n; y++) add({ t: "KIDS", x: -1, y: y, z: -1, k: scKids(par, y) });
  for (x = 0; x < n; x++) for (z = x + 1; z < n; z++) {
    if (par[x] >= 0 && par[z] >= 0) add({ t: par[x] === par[z] ? "SIB" : "NSIB", x: x, y: -1, z: z, k: -1 });
    if (scDepth(par, x) === scDepth(par, z)) add({ t: "SAME", x: x, y: -1, z: z, k: -1 });
  }
  for (x = 0; x < n; x++) add({ t: "GEN", x: x, y: -1, z: -1, k: scDepth(par, x) });
  add({ t: "ROOT", x: root, y: -1, z: -1, k: -1 });
  for (y = 0; y < n; y++) for (z = 0; z < n; z++) if (y !== z && scKids(par, y) > scKids(par, z)) add({ t: "MORE", x: -1, y: y, z: z, k: -1 });
  return pool;
}
function scSay(s, ps, fl) {
  var X = s.x >= 0 ? ps[s.x] : null, Y = s.y >= 0 ? ps[s.y] : null, Z = s.z >= 0 ? ps[s.z] : null;
  switch (s.t) {
    case "PAR": return fl.par(X, Y); case "NPAR": return fl.npar(X, Y); case "KIDS": return fl.kids(Y, s.k);
    case "SIB": return fl.sib(X, Z); case "NSIB": return fl.nsib(X, Z); case "GRAND": return fl.grand(X, Y);
    case "ANC": return fl.anc(X, Y); case "NANC": return fl.nanc(X, Y); case "ROOT": return fl.root(X);
    case "GEN": return fl.gen(X, s.k); case "SAME": return fl.same(X, Z); case "MORE": return fl.more(Y, Z);
  }
  return "";
}
function scArr(s) { return [s.t, s.x, s.y, s.z, s.k]; }
function genSuccession(seed, d) {
  var r = rngFor(seed, "succession", d), n = d === 0 ? r.int(4, 5) : 6, G = null, i;
  var maxPar = [n - 2, 2, 1][d], lo = [2, 4, 5][d], hi = [7, 9, 11][d];
  for (var at = 0; at < 60 && !G; at++) {
    var tr = scTree(r, n, [3, 4, 5][d], [2, 3, 4][d]);
    if (!tr) continue;
    var pool = scPool(tr.par, tr.root, d), w = SC_W[d];
    pool.forEach(function (s) { s.key = -Math.log(1 - r.next() * 0.999999) / w[s.t]; });
    pool.sort(function (a, b) { return a.key - b.key; });
    var CAPN = [20000, 20000, 20000][d];
    var chosen = d === 0 ? [{ t: "ROOT", x: tr.root, y: -1, z: -1, k: -1 }] : [], npar = 0, res = scCount(n, chosen, 2, CAPN), step = d === 0 ? 1 : 2, added = 0;
    for (i = 0; i < pool.length && res.count > 1; i++) {
      var s = pool[i];
      if (s.t === "ROOT" && d === 0) continue;
      if (s.t === "PAR" && npar >= maxPar) continue;
      chosen.push(s); if (s.t === "PAR") npar++; added++;
      if (added % step === 0 || i === pool.length - 1) res = scCount(n, chosen, 2, CAPN);
    }
    if (res.count !== 1) continue;
    var ordP = shuffled(r, intList(chosen.length).slice(d === 0 ? 1 : 0));
    for (var oi = 0; oi < ordP.length; oi++) {
      var drop = chosen[ordP[oi]];
      var rest = chosen.filter(function (x) { return x !== drop; });
      if (scCount(n, rest, 2, CAPN).count === 1) chosen = rest;
    }
    if (chosen.length < lo || chosen.length > hi) continue;
    var body = chosen.slice(d === 0 ? 1 : 0); r.shuffle(body);
    G = { par: tr.par, root: tr.root, sts: (d === 0 ? chosen.slice(0, 1) : []).concat(body) };
  }
  var flk = r.chance(0.5) ? "school" : "family", fl = SC_FL[flk], ps;
  if (flk === "school") ps = people(r, n);
  else { var pool2 = FIRST_M.map(function (m) { return firstPerson(m, false); }).concat(FIRST_F.map(function (f) { return firstPerson(f, true); })); r.shuffle(pool2); ps = pool2.slice(0, n); }
  var nm = function (x) { return ps[x].n; }, opt = function (x) { return G.par[x] === -1 ? fl.rootPre : nm(G.par[x]); };
  var mk = function (sub) { var p = []; for (var x = 0; x < n; x++) { p.push(nm(x)); p.push(sub && sub.x === x ? sub.v : opt(x)); } p.push(fl.submit); return p; };
  var nonroot = intList(n).filter(function (x) { return G.par[x] >= 0; }), wrong = [];
  for (var k = 0; k < 3; k++) {
    var x = nonroot[k % nonroot.length], cand = intList(n).filter(function (y) { return y !== x && y !== G.par[x]; });
    wrong.push(mk({ x: x, v: k === 2 ? fl.rootPre : nm(cand[k % cand.length]) }));
  }
  var stsA = G.sts.map(scArr);
  return { n: n, par: G.par, root: G.root, sts: G.sts, ps: ps, flk: flk, plan: mk(null), wrong: wrong, sol: 1, ans: G.par.slice(),
    data: { n: n, par: G.par.slice(), root: G.root, sts: stsA, rootGiven: d === 0 },
    sig: "succession|" + d + "|" + JSON.stringify([n, G.par, stsA.map(String).sort()]) };
}
function succession(seed, cb, opts) {
  var d = diffOf(opts), P = genSuccession(seed, d), ps = P.ps, n = P.n, fl = SC_FL[P.flk];
  var cur = intList(n).map(function () { return -2; });
  var lines = P.sts.map(function (s) { return scSay(s, ps, fl); });
  var cond = head(opts, d) + "Родословная списков. Страница списка истлела, остались обрывки. " + fl.intro + " В списке " + COLL[n] + ": " + andList(ps.map(function (p) { return p.n; })) +
    ". Записи: " + lines.join("; ") + ". Восстановите, у кого кто " + (P.flk === "school" ? "наставник" : "родитель") + ".";
  var itemOf = function (x) { return fl.item(ps[x], cur[x] === -2 ? undefined : cur[x] === -1 ? null : ps[cur[x]]); };
  var whyNot = function () {
    var roots = cur.filter(function (v) { return v === -1; }).length;
    if (roots > 1) return "Так не бывает: " + fl.two + ".";
    if (roots === 0) return "Так не бывает: " + fl.none + ".";
    for (var x = 0; x < n; x++) { var z = cur[x], g = 0; while (z >= 0 && g++ <= n) { if (z === x) return "Так не бывает: получился круг — " + ps[x].n + " в своей же цепочке."; z = cur[z]; } }
    for (var i = 0; i < P.sts.length; i++) if (scPart(P.sts[i], cur) !== 1) return "Не сходится с записью: «" + lines[i] + "».";
    return "Не сходится с записями.";
  };
  var last = start("succession", d, P, "Родословная списков", cond, function (st, finish, fail) {
    var out = [];
    for (var x = 0; x < n; x++) (function (x) {
      out.push(act(function () { return itemOf(x); }, function () {
        var items = [];
        for (var y = 0; y < n; y++) if (y !== x) (function (y) { items.push({ label: ps[y].n, fn: function () { cur[x] = y; A("play", "term_beep"); say(itemOf(x) + "."); } }); })(y);
        items.push({ label: fl.rootOpt, fn: function () { cur[x] = -1; A("play", "term_beep"); say(itemOf(x) + "."); } });
        items.push(back("Назад"));
        UIx("menu", fl.ask(ps[x]), items);
      }));
    })(x);
    out.push(info("Записи", function () { return "Записи: " + lines.join("; ") + "."; }));
    out.push(act(fl.submit, function () {
      var left = cur.filter(function (v) { return v === -2; }).length;
      if (left) { nope("Не указано ещё у " + COLLA[left].replace("одного", "одного человека") + "."); return; }
      if (cur.every(function (v, i) { return v === P.par[i]; })) { win(last, finish, fl.done + ": все записи сходятся.", false); return; }
      A("play", "term_err"); fail(whyNot());
    }));
    out.push(act("Что сейчас", function () { say(intList(n).map(itemOf).join("; ") + "."); }));
    out.push(act("Начать заново", function () { cur = intList(n).map(function () { return -2; }); A("play", "term_off"); say("Все связи стёрты, список чистый."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   4. МИННАЯ ПОЛОСА
   Плиты полосой 1×N, 2×N или 3×N; под некоторыми — мины, их число
   известно. Щуп на безопасной плите показывает, сколько мин в соседних
   (по сторонам и по диагонали). Ходить можно только наверняка: плиту
   открывает лишь тот ход, что следует из чисел (проверяет точный
   решатель по столбцам); ход наугад — ошибка с объяснением. Полоса
   решается без догадок простыми правилами (одно число, пара чисел,
   общее число мин) — по ним же подсказка сапёра объясняет следующий
   ход. Простая — полоса в ряд, средняя — два ряда, сложная — три ряда,
   и без сравнения двух чисел или подсчёта всех мин не обойтись. Порядок
   ходов любой; образцово — без подсказок и без ошибок.
   ════════════════════════════════════════════════════════════════════ */
var MN_ROW = ["в первом ряду", "во втором ряду", "в третьем ряду"];
function mnNb(R, C, i) {
  var r0 = Math.floor(i / C), c0 = i % C, out = [];
  for (var dr = -1; dr <= 1; dr++) for (var dcol = -1; dcol <= 1; dcol++) {
    if (!dr && !dcol) continue;
    var rr = r0 + dr, cc = c0 + dcol;
    if (rr >= 0 && rr < R && cc >= 0 && cc < C) out.push(rr * C + cc);
  }
  return out;
}
/* точный решатель: какие закрытые плиты могут быть миной и какие — пустыми при открытых числах и общем числе мин */
function mnExact(R, C, M, num) {
  var S = 1 << R, Mx = M + 1, c, r0, p, q, b, m, key;
  var colZ = [], nbm = [];
  for (c = 0; c < C; c++) { var z = 0; for (r0 = 0; r0 < R; r0++) if (num[r0 * C + c] >= 0) z |= 1 << r0; colZ.push(z); }
  for (r0 = 0; r0 < R; r0++) { var mk = 0; for (var rr = r0 - 1; rr <= r0 + 1; rr++) if (rr >= 0 && rr < R) mk |= 1 << rr; nbm.push(mk); }
  var colOk = function (cc, pp, qq, bb) {
    for (var r1 = 0; r1 < R; r1++) {
      var v = num[r1 * C + cc]; if (v < 0) continue;
      var mm = nbm[r1];
      if (popcount(pp & mm) + popcount(qq & mm & ~(1 << r1)) + popcount(bb & mm) !== v) return false;
    }
    return true;
  };
  var F = [], G = [], sz = S * S * Mx;
  F[0] = new Uint8Array(sz);
  for (q = 0; q < S; q++) if (!(q & colZ[0]) && popcount(q) <= M) F[0][q * Mx + popcount(q)] = 1;
  for (c = 0; c + 1 < C; c++) {
    F[c + 1] = new Uint8Array(sz);
    for (p = 0; p < S; p++) for (q = 0; q < S; q++) for (m = 0; m <= M; m++) {
      if (!F[c][(p * S + q) * Mx + m]) continue;
      for (b = 0; b < S; b++) { if (b & colZ[c + 1]) continue; var m2 = m + popcount(b); if (m2 > M || !colOk(c, p, q, b)) continue; F[c + 1][(q * S + b) * Mx + m2] = 1; }
    }
  }
  G[C - 1] = new Uint8Array(sz);
  for (p = 0; p < S; p++) for (q = 0; q < S; q++) if (colOk(C - 1, p, q, 0)) G[C - 1][(p * S + q) * Mx + M] = 1;
  for (c = C - 2; c >= 0; c--) {
    G[c] = new Uint8Array(sz);
    for (p = 0; p < S; p++) for (q = 0; q < S; q++) for (m = 0; m <= M; m++) {
      key = (p * S + q) * Mx + m;
      for (b = 0; b < S; b++) { if (b & colZ[c + 1]) continue; var m3 = m + popcount(b); if (m3 > M || !colOk(c, p, q, b)) continue; if (G[c + 1][(q * S + b) * Mx + m3]) { G[c][key] = 1; break; } }
    }
  }
  var canMine = [], canSafe = [], any = false;
  for (var i = 0; i < R * C; i++) { canMine.push(false); canSafe.push(false); }
  for (c = 0; c < C; c++) for (p = 0; p < S; p++) for (q = 0; q < S; q++) for (m = 0; m <= M; m++) {
    key = (p * S + q) * Mx + m;
    if (!F[c][key] || !G[c][key]) continue;
    any = true;
    for (r0 = 0; r0 < R; r0++) { if (q >> r0 & 1) canMine[r0 * C + c] = true; else canSafe[r0 * C + c] = true; }
  }
  return { canMine: canMine, canSafe: canSafe, any: any };
}
/* правила сапёра: один шаг вывода — список новых фактов { i, v: 1 мина / 2 пусто, why, rule } */
function mnRules(R, C, M, num, known, names) {
  var N = R * C, facts = [], seen = {}, i, j;
  var push = function (cell, v, why, rule) { if (seen[cell] || known[cell] || num[cell] >= 0) return; seen[cell] = 1; facts.push({ i: cell, v: v, why: why, rule: rule }); };
  var info0 = [];
  for (i = 0; i < N; i++) {
    if (num[i] < 0) continue;
    var nb = mnNb(R, C, i), K = [], Un = [];
    nb.forEach(function (x) { if (known[x] === 1) K.push(x); else if (num[x] < 0 && known[x] !== 2) Un.push(x); });
    info0.push({ y: i, K: K, Un: Un, rem: num[i] - K.length });
  }
  info0.forEach(function (f) {
    if (!f.Un.length) return;
    if (f.rem === 0) f.Un.forEach(function (x) { push(x, 2, num[f.y] === 0 ? "у " + names(f.y, "g") + " число ноль: рядом с ней мин нет" : "у " + names(f.y, "g") + " число " + nw(num[f.y]) + ", и все её мины уже известны: " + andList(f.K.map(function (k) { return names(k, "n"); })), 1); });
    else if (f.rem === f.Un.length) f.Un.forEach(function (x) { push(x, 1, "у " + names(f.y, "g") + " число " + nw(num[f.y]) + ", а закрытых соседей, где может лежать мина, у неё ровно столько", 1); });
  });
  if (facts.length) return facts;
  for (i = 0; i < info0.length; i++) for (j = 0; j < info0.length; j++) {
    if (i === j) continue;
    var a = info0[i], b = info0[j];
    if (!a.Un.length || a.Un.length >= b.Un.length) continue;
    if (!a.Un.every(function (x) { return b.Un.indexOf(x) >= 0; })) continue;
    var diff = b.Un.filter(function (x) { return a.Un.indexOf(x) < 0; }), base = "сравните " + names(a.y, "a") + " и " + names(b.y, "a") + ": все закрытые соседи " + names(a.y, "g") + " — соседи и " + names(b.y, "g");
    if (b.rem === a.rem) diff.forEach(function (x) { push(x, 2, base + ", а мин не хватает обеим поровну — значит, у " + names(b.y, "g") + " вне общих соседей мин нет", 2); });
    else if (b.rem - a.rem === diff.length) diff.forEach(function (x) { push(x, 1, base + ", а у " + names(b.y, "g") + " мин не хватает больше ровно на число её остальных закрытых соседей", 2); });
  }
  if (facts.length) return facts;
  var mines = 0, unk = [];
  for (i = 0; i < N; i++) { if (known[i] === 1) mines++; else if (num[i] < 0 && known[i] !== 2) unk.push(i); }
  if (unk.length) {
    if (mines === M) unk.forEach(function (x) { push(x, 2, "все " + cnt(M, "мина", "мины", "мин", "f") + " уже найдены — остальные плиты пусты", 3); });
    else if (M - mines === unk.length) unk.forEach(function (x) { push(x, 1, "мин осталось ровно столько, сколько закрытых плит без вывода", 3); });
  }
  return facts;
}
/* полный вывод из открытого: известные мины и пустые плиты */
function mnClose(R, C, M, num, names, maxRule) {
  var N = R * C, known = [], used = 0, steps = 0, reason = {};
  for (var i = 0; i < N; i++) known.push(0);
  for (;;) {
    var f = mnRules(R, C, M, num, known, names);
    if (!f.length || steps++ > 60) break;
    var rl = f[0].rule;
    if (maxRule && rl > maxRule) break;
    used |= 1 << rl;
    f.forEach(function (x) { known[x.i] = x.v; reason[x.i] = x.why; });
  }
  return { known: known, used: used, reason: reason };
}
function mnName(R, C) {
  return function (i, c) {
    var w = { n: "плита", g: "плиты", a: "плиту", i: "плитой" }[c || "n"];
    return w + " " + (i % C + 1) + (R > 1 ? " " + MN_ROW[Math.floor(i / C)] : "");
  };
}
function mnWords(v) { return v === 0 ? "мин нет" : cnt(v, "мина", "мины", "мин", "f"); }
function genMines(seed, d) {
  var r = rngFor(seed, "mines", d), R = d + 1, G = null, i;
  for (var at = 0; at < 900 && !G; at++) {
    var C = d === 0 ? r.int(7, 12) : d === 1 ? r.int(5, 7) : r.int(5, 6), M = d === 0 ? r.int(2, 4) : d === 1 ? r.int(3, 4) : r.int(4, 6), N = R * C;
    var cells = shuffled(r, intList(N)), mine = intList(N).map(function () { return false; });
    for (i = 0; i < M; i++) mine[cells[i]] = true;
    var safe = cells.slice(M), ns = d === 0 ? r.int(1, 2) : r.int(1, 3), startC = safe.slice(0, ns).sort(function (a, b) { return a - b; });
    var count = function (x) { return mnNb(R, C, x).filter(function (y) { return mine[y]; }).length; };
    var num = intList(N).map(function () { return -1; });
    startC.forEach(function (x) { num[x] = count(x); });
    var nmf = mnName(R, C), order = [], batches = [], used = 0, rounds = 0, stuck = false;
    for (var g = 0; g < 40; g++) {
      var cl = mnClose(R, C, M, num, nmf, 0);
      used |= cl.used;
      var batch = []; for (i = 0; i < N; i++) if (cl.known[i] === 2 && num[i] < 0) batch.push(i);
      if (!batch.length) { stuck = safe.some(function (x) { return num[x] < 0; }); break; }
      batch.forEach(function (x) { num[x] = count(x); });
      batches.push(batch); rounds++;
      if (!safe.some(function (x) { return num[x] < 0; })) break;
    }
    if (stuck || !batches.length) continue;
    if (safe.some(function (x) { return num[x] < 0; })) continue;
    var usedB = !!(used & 4), usedC = !!(used & 8);
    if (d === 0 && (usedB || rounds < 2)) continue;
    if (d === 1 && rounds < 2) continue;
    if (d === 2 && (!(usedB || usedC) || rounds < 3)) continue;
    var ways = 1; batches.forEach(function (bt) { for (var f = 2; f <= bt.length; f++) ways *= f; });
    if (ways < 2) continue;
    G = { C: C, M: M, mine: mine, start: startC, batches: batches, rounds: rounds, used: used, ways: ways };
  }
  var C2 = G.C, toPlan = function (ord) {
    var p = [], row = -1;
    ord.forEach(function (x) {
      var rr = Math.floor(x / C2);
      if (rr !== row) { if (row >= 0) p.push("Назад"); p.push(R > 1 ? "Ряд " + (rr + 1) : "Полоса"); row = rr; }
      p.push("Плита " + (x % C2 + 1));
    });
    return p;
  };
  var ord1 = [], ord2 = [];
  G.batches.forEach(function (bt) { ord1 = ord1.concat(bt); ord2 = ord2.concat(bt.slice().reverse()); });
  var mines = []; G.mine.forEach(function (v, x) { if (v) mines.push(x); });
  var wm = mines[0], wp = [R > 1 ? "Ряд " + (Math.floor(wm / C2) + 1) : "Полоса", "Плита " + (wm % C2 + 1), "Назад"];
  return { R: R, C: C2, M: G.M, mine: G.mine, start: G.start, batches: G.batches, plan: toPlan(ord1), wrong: rep(wp, 3),
    alts: [{ plan: toPlan(ord2), best: true }, { plan: ["Подсказка сапёра"].concat(toPlan(ord1)), best: false }], variable: true, sol: G.ways,
    ans: ord1.slice(), data: { R: R, C: C2, M: G.M, mines: mines, start: G.start.slice(), rounds: G.rounds, used: G.used },
    sig: "mines|" + d + "|" + JSON.stringify([R, C2, mines, G.start]) };
}
function minesKind(seed, cb, opts) {
  var d = diffOf(opts), P = genMines(seed, d), R = P.R, C = P.C, N = R * C, M = P.M, nmf = mnName(R, C);
  var cntAround = function (x) { return mnNb(R, C, x).filter(function (y) { return P.mine[y]; }).length; };
  var num = intList(N).map(function () { return -1; }), flag = intList(N).map(function () { return false; }), flagMode = false, hints = 0;
  P.start.forEach(function (x) { num[x] = cntAround(x); });
  var safeLeft = function () { var k = 0; for (var x = 0; x < N; x++) if (!P.mine[x] && num[x] < 0) k++; return k; };
  var cellWord = function (x) { return num[x] >= 0 ? (num[x] === 0 ? "ноль" : nw(num[x])) : flag[x] ? "флажок" : "закрыта"; };
  var rowText = function (rr) { var a = []; for (var c = 0; c < C; c++) a.push(cellWord(rr * C + c)); return a.join(", "); };
  var board = function () { if (R === 1) return "Полоса: " + rowText(0) + "."; var a = []; for (var rr = 0; rr < R; rr++) a.push("ряд " + (rr + 1) + " — " + rowText(rr)); return cap(a.join("; ")) + "."; };
  var opened = P.start.map(function (x) { return nmf(x) + " — рядом " + mnWords(num[x]); });
  var cond = head(opts, d) + "Минная полоса. Перед шлюзом — полоса плит: " + (R === 1 ? cnt(C, "плита", "плиты", "плит", "f") + " в ряд, слева направо" : cnt(R, "ряд", "ряда", "рядов") + " по " + cnt(C, "плите", "плиты", "плит", "f") + ", ряды сверху вниз, плиты слева направо") +
    ". На полосе " + cnt(M, "мина", "мины", "мин", "f") + ". Щуп на безопасной плите показывает, сколько мин в соседних плитах — " + (R === 1 ? "слева и справа" : "по сторонам и по диагонали") +
    ". Уже открыто: " + opened.join("; ") + ". Откройте все безопасные плиты. Ходить можно только наверняка: если из чисел не следует, что плита пуста, это ход наугад — ошибка. Флажками можно помечать мины для себя.";
  var hintText = function () {
    var cl = mnClose(R, C, M, num, nmf, 0), k = -1;
    for (var x = 0; x < N; x++) if (cl.known[x] === 2 && num[x] < 0) { k = x; break; }
    if (k < 0) { var ex = mnExact(R, C, M, num); for (var y = 0; y < N; y++) if (num[y] < 0 && !ex.canMine[y]) return "Подсказка: " + nmf(y) + " пуста — это следует из всех чисел вместе."; return "Подсказка: выводить больше нечего."; }
    return "Подсказка: " + nmf(k) + " пуста: " + cl.reason[k] + ".";
  };
  var last;
  var probe = function (x, finish, fail, st) {
    if (num[x] >= 0) { nope(cap(nmf(x)) + " уже открыта: рядом " + mnWords(num[x]) + "."); return; }
    if (flagMode) { flag[x] = !flag[x]; A("play", flag[x] ? "mine_click" : "term_off"); say(flag[x] ? "Флажок: " + nmf(x) + "." : "Флажок снят: " + nmf(x) + "."); return; }
    if (flag[x]) { nope("На этой плите флажок. Снимите его в режиме флажков, если уверены, что мины нет."); return; }
    var ex = mnExact(R, C, M, num);
    if (!ex.canMine[x]) {
      num[x] = cntAround(x);
      if (!safeLeft()) { win(last, finish, "Полоса пройдена: все безопасные плиты открыты, мины остались под флажками сапёров.", hints === 0 && st.tries === 0, "ни одной подсказки и ни одного хода наугад"); return; }
      A("play", "scan_soft");
      say(cap(nmf(x)) + " открыта: рядом " + mnWords(num[x]) + ". Безопасных закрытых плит осталось: " + safeLeft() + ".");
      return;
    }
    A("play", "term_err");
    fail("Ход наугад: из открытых чисел не следует, что " + nmf(x) + " пуста." + (P.mine[x] ? " Щуп звякнул о металл — там мина." : ""));
  };
  var cellItem = function (x, finish, fail, st) {
    return act(function () { return "Плита " + (x % C + 1) + ": " + (num[x] >= 0 ? "открыта, рядом " + mnWords(num[x]) : flag[x] ? "флажок" : "закрыта"); }, function () { probe(x, finish, fail, st); });
  };
  last = start("mines", d, P, "Минная полоса", cond, function (st, finish, fail) {
    var out = [];
    for (var rr = 0; rr < R; rr++) (function (rr) {
      var nmR = R > 1 ? "Ряд " + (rr + 1) : "Полоса";
      out.push(act(function () { return nmR + ": " + rowText(rr); }, function () {
        var items = [];
        for (var c = 0; c < C; c++) items.push(cellItem(rr * C + c, finish, fail, st));
        items.push(back("Назад"));
        UIx("menu", nmR, items);
      }));
    })(rr);
    out.push(act(function () { return "Щуп или флажок: " + (flagMode ? "флажок" : "щуп"); }, function () { flagMode = !flagMode; A("play", "pc_click"); say(flagMode ? "Теперь выбор плиты ставит или снимает флажок." : "Теперь выбор плиты опускает на неё щуп."); }));
    out.push(act("Подсказка сапёра", function () { hints++; A("play", "paper_turn"); say(hintText()); }));
    out.push(act("Что сейчас", function () { say(board() + " Мин на полосе: " + nw(M, "f") + ". Безопасных закрытых плит: " + safeLeft() + ". Режим: " + (flagMode ? "флажок" : "щуп") + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   5. ПЕРФОЛЕНТА
   Японский кроссворд на ленте перфоратора: подсказка ряда — группы
   пробивок слева направо. Простая — три ряда по шесть позиций, у рядов
   видно по нескольку уцелевших позиций; средняя — четыре ряда по
   восемь, видно мало: нужны наложения групп; сложная — пять рядов по
   шесть с подсказками и рядов, и столбцов, без уцелевших позиций: ряд
   выводится только через пересечения. Решение единственное (перебор
   раскладок ряда; сложная — построчный вывод до конца, без догадок).
   ════════════════════════════════════════════════════════════════════ */
function ptRuns(row) { var out = [], k = 0; for (var i = 0; i < row.length; i++) { if (row[i]) k++; else if (k) { out.push(k); k = 0; } } if (k) out.push(k); return out; }
function ptLines(runs, L, known) {
  var out = [], row = [];
  var rec = function (ri, pos) {
    var i;
    if (ri === runs.length) { for (i = pos; i < L; i++) if (known[i] === 1) return; var full = row.slice(); while (full.length < L) full.push(0); out.push(full); return; }
    var need = 0; for (var k = ri; k < runs.length; k++) need += runs[k] + (k > ri ? 1 : 0);
    for (var s = pos; s + need <= L; s++) {
      if (s > pos && known[s - 1] === 1) break;
      var ok = true;
      for (i = s; i < s + runs[ri] && ok; i++) if (known[i] === 0) ok = false;
      if (ok && s + runs[ri] < L && known[s + runs[ri]] === 1) ok = false;
      if (!ok) continue;
      var save = row.length;
      for (i = pos; i < s; i++) row.push(0);
      for (i = 0; i < runs[ri]; i++) row.push(1);
      if (s + runs[ri] < L) row.push(0);
      rec(ri + 1, row.length);
      row.length = save;
    }
  };
  rec(0, 0);
  return out;
}
function ptClue(runs) { return runs.length ? runs.map(function (v) { return nw(v, "f"); }).join(", ") : "без пробивок"; }
function ptSolveGrid(rows, cols, R, L) {
  var g = [], i, j, passes = 0;
  for (i = 0; i < R; i++) { g.push([]); for (j = 0; j < L; j++) g[i].push(-1); }
  var line = function (runs, cells) {
    var pls = ptLines(runs, cells.length, cells);
    if (!pls.length) return null;
    return cells.map(function (v, k) { if (v >= 0) return v; var a = pls[0][k]; for (var q = 1; q < pls.length; q++) if (pls[q][k] !== a) return -1; return a; });
  };
  for (var guard = 0; guard < 30; guard++) {
    var ch = false; passes++;
    for (i = 0; i < R; i++) { var nr = line(rows[i], g[i]); if (!nr) return null; for (j = 0; j < L; j++) if (nr[j] !== g[i][j]) { g[i][j] = nr[j]; ch = true; } }
    for (j = 0; j < L; j++) { var colv = g.map(function (rw) { return rw[j]; }), nc = line(cols[j], colv); if (!nc) return null; for (i = 0; i < R; i++) if (nc[i] !== g[i][j]) { g[i][j] = nc[i]; ch = true; } }
    if (!ch) break;
  }
  return { g: g, passes: passes, done: g.every(function (rw) { return rw.every(function (v) { return v >= 0; }); }) };
}
function ptRow(r, L, dens, maxKnown) {
  for (var g = 0; g < 200; g++) {
    var row = intList(L).map(function () { return r.chance(dens) ? 1 : 0; }), runs = ptRuns(row);
    if (!runs.length || runs.length > 3 || row.every(function (v) { return v; })) continue;
    var known = intList(L).map(function () { return -1; }), ord = shuffled(r, intList(L)), k = 0;
    while (ptLines(runs, L, known).length > 1 && k < L) { known[ord[k]] = row[ord[k]]; k++; }
    shuffled(r, intList(L)).forEach(function (p) { if (known[p] < 0) return; var sv = known[p]; known[p] = -1; if (ptLines(runs, L, known).length !== 1) known[p] = sv; });
    var nk = known.filter(function (v) { return v >= 0; }).length;
    if (nk > maxKnown) continue;
    if (!row.some(function (v, i) { return v && known[i] < 0; })) continue;
    return { row: row, runs: runs, known: known };
  }
  return null;
}
function genPunchtape(seed, d) {
  var r = rngFor(seed, "punchtape", d), R = [3, 4, 5][d], L = [6, 8, 6][d], rows = [], G = null, i;
  if (d < 2) {
    for (var at = 0; at < 50 && !G; at++) {
      rows = [];
      for (i = 0; i < R; i++) { var rw = ptRow(r, L, d === 0 ? 0.5 : 0.55, d === 0 ? 3 : 2); if (!rw) break; rows.push(rw); }
      if (rows.length !== R) continue;
      if (d === 1 && rows.filter(function (x) { return x.known.every(function (v) { return v < 0; }); }).length > 2) continue;
      G = { grid: rows.map(function (x) { return x.row; }), runs: rows.map(function (x) { return x.runs; }), known: rows.map(function (x) { return x.known; }), cols: null, passes: 1 };
    }
  } else {
    for (var at2 = 0; at2 < 400 && !G; at2++) {
      var grid = []; for (i = 0; i < R; i++) grid.push(intList(L).map(function () { return r.chance(0.55) ? 1 : 0; }));
      if (grid.some(function (rw) { return !ptRuns(rw).length || rw.every(function (v) { return v; }); })) continue;
      var rr = grid.map(ptRuns), cc = intList(L).map(function (j) { return ptRuns(grid.map(function (rw) { return rw[j]; })); });
      if (cc.some(function (x) { return !x.length; })) continue;
      var sv = ptSolveGrid(rr, cc, R, L);
      if (!sv || !sv.done || sv.passes < 3) continue;
      G = { grid: grid, runs: rr, known: grid.map(function () { return intList(L).map(function () { return -1; }); }), cols: cc, passes: sv.passes };
    }
  }
  var plan = [], wrong;
  G.grid.forEach(function (rw, ri) {
    var ps = []; rw.forEach(function (v, j) { if (v && G.known[ri][j] < 0) ps.push("Позиция " + (j + 1)); });
    if (ps.length) plan = plan.concat(["Ряд " + (ri + 1)], ps, ["Назад"]);
  });
  plan.push("Сдать ленту");
  var free = -1; for (i = 0; i < L; i++) if (G.known[0][i] < 0) { free = i; break; }
  wrong = rep(["Ряд 1", "Позиция " + (free + 1), "Назад", "Сдать ленту"], 3);
  return { R: R, L: L, grid: G.grid, runs: G.runs, known: G.known, cols: G.cols, plan: plan, wrong: wrong, sol: 1, ans: G.grid.map(function (x) { return x.slice(); }),
    data: { R: R, L: L, grid: G.grid, known: G.known, cols: G.cols, passes: G.passes },
    sig: "punchtape|" + d + "|" + JSON.stringify([R, L, G.grid, G.known]) };
}
function punchtape(seed, cb, opts) {
  var d = diffOf(opts), P = genPunchtape(seed, d), R = P.R, L = P.L;
  var cur = P.known.map(function (rw) { return rw.map(function (v) { return v === 1 ? 1 : 0; }); });
  var fixed = P.known.map(function (rw) { return rw.map(function (v) { return v >= 0; }); });
  var seen = function (ri) { var a = []; P.known[ri].forEach(function (v, j) { if (v >= 0) a.push("позиция " + (j + 1) + (v ? " пробита" : " цела")); }); return a.length ? ", видно: " + a.join(", ") : ""; };
  var rowClues = P.runs.map(function (rn, ri) { return "ряд " + (ri + 1) + " — " + ptClue(rn) + seen(ri); });
  var colClues = P.cols ? P.cols.map(function (cn, j) { return "столбец " + (j + 1) + " — " + ptClue(cn); }) : [];
  var punched = function (rw) { var a = []; rw.forEach(function (v, j) { if (v) a.push(j + 1); }); return a.length ? (a.length === 1 ? "пробита " + a[0] : "пробиты " + andList(a)) : "пробивок нет"; };
  var cond = head(opts, d) + "Перфолента. Старый перфоратор насосной читал программу с ленты; лента истлела, её надо пробить заново. В ленте " + cnt(R, "ряд", "ряда", "рядов") + " по " + nw(L) + " " + pl(L, "позиции", "позиции", "позиций") +
    ", ряды сверху вниз, позиции слева направо. Подсказка — группы пробивок по порядку: «три, одна» значит три пробивки подряд, потом хотя бы одна целая позиция, потом ещё одна пробивка; больше пробивок в ряду нет. " +
    (P.cols ? "Подсказки есть и у столбцов — позиций с одним номером во всех рядах, сверху вниз. Подсказки рядов: " + rowClues.join("; ") + ". Подсказки столбцов: " + colClues.join("; ") + "." : "Подсказки рядов: " + rowClues.join("; ") + ".") + " Пробейте ленту.";
  var clueAll = function () { return "Подсказки рядов: " + rowClues.join("; ") + "." + (P.cols ? " Подсказки столбцов: " + colClues.join("; ") + "." : ""); };
  var whyNot = function () {
    for (var ri = 0; ri < R; ri++) { var a = ptRuns(cur[ri]); if (a.join() !== P.runs[ri].join()) return "В ряду " + (ri + 1) + " группы пробивок — " + ptClue(a) + ", а нужно — " + ptClue(P.runs[ri]) + "."; }
    if (P.cols) for (var j = 0; j < L; j++) { var b = ptRuns(cur.map(function (rw) { return rw[j]; })); if (b.join() !== P.cols[j].join()) return "В столбце " + (j + 1) + " группы пробивок — " + ptClue(b) + ", а нужно — " + ptClue(P.cols[j]) + "."; }
    return "Лента не сходится с подсказками.";
  };
  var last = start("punchtape", d, P, "Перфолента", cond, function (st, finish, fail) {
    var out = [];
    for (var ri = 0; ri < R; ri++) (function (ri) {
      out.push(act(function () { return "Ряд " + (ri + 1) + ", " + ptClue(P.runs[ri]) + ": " + punched(cur[ri]); }, function () {
        var items = [];
        for (var j = 0; j < L; j++) (function (j) {
          items.push(act(function () { return "Позиция " + (j + 1) + ": " + (cur[ri][j] ? "пробита" : "цела") + (fixed[ri][j] ? ", видна на ленте" : ""); }, function () {
            if (fixed[ri][j]) { nope("Эту позицию видно на старой ленте — её не меняют."); return; }
            cur[ri][j] = 1 - cur[ri][j]; A("play", cur[ri][j] ? "pc_click" : "term_off");
            say("Позиция " + (j + 1) + (cur[ri][j] ? " пробита." : " снова цела.") + " Ряд " + (ri + 1) + ": " + punched(cur[ri]) + ".");
          }));
        })(j);
        items.push(back("Назад"));
        UIx("menu", "Ряд " + (ri + 1), items);
      }));
    })(ri);
    out.push(info("Подсказки", clueAll));
    out.push(act("Сдать ленту", function () {
      if (cur.every(function (rw, ri2) { return rw.join() === P.grid[ri2].join(); })) { win(last, finish, "Лента пробита верно: перфоратор насосной застучал по программе.", false); return; }
      A("play", "term_err"); fail(whyNot());
    }));
    out.push(act("Что сейчас", function () { say(cur.map(function (rw, ri2) { return "ряд " + (ri2 + 1) + ": " + punched(rw); }).join("; ") + "."); }));
    out.push(act("Начать заново", function () { cur = P.known.map(function (rw) { return rw.map(function (v) { return v === 1 ? 1 : 0; }); }); A("play", "term_off"); say("Лента чистая: пробито только то, что видно на старой."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   6. ПЛОМБЫ НА ШКАФЧИКАХ
   «Зебра»: шкафчики в ряд от двери, у каждого — хозяин, вещь внутри,
   смена и (на сложной) номер пломбы. Простая — три шкафчика и три
   признака, щедрые записи; средняя — четыре шкафчика, три или четыре
   признака, записи сокращены до необходимых; сложная — пять шкафчиков
   и четыре признака, все виды записей. Опись единственная: решатель
   с масками мест и перебором считает описи до двух.
   ════════════════════════════════════════════════════════════════════ */
var LK_CAT = ["Хозяин", "Вещь", "Смена", "Пломба"];
var LK_ITEMS = [{ n: "фонарь", g: "фонаря", i: "фонарём" }, { n: "рация", g: "рации", i: "рацией" }, { n: "противогаз", g: "противогаза", i: "противогазом" },
  { n: "аптечка", g: "аптечки", i: "аптечкой" }, { n: "термос", g: "термоса", i: "термосом" }, { n: "дозиметр", g: "дозиметра", i: "дозиметром" },
  { n: "респиратор", g: "респиратора", i: "респиратором" }, { n: "компас", g: "компаса", i: "компасом" }, { n: "каска", g: "каски", i: "каской" }, { n: "бинокль", g: "бинокля", i: "биноклем" }];
var LK_SH = ["А", "Б", "В", "Г", "Д"];
var LK_W = [{ same: 4, nsame: 2, pos: 3, npos: 1, imm: 2, adj: 1 }, { same: 3, nsame: 2, pos: 1, npos: 1, imm: 2, left: 1, adj: 2, nadj: 1, edge: 1 },
  { same: 3, nsame: 2, pos: 1, npos: 1, imm: 2, left: 2, adj: 2, nadj: 1, edge: 1, dist2: 1 }];
function lkSingle(x) { return x !== 0 && (x & (x - 1)) === 0; }
function lkBit(x) { return 31 - Math.clz32(x); }
function lkTrue(cl, pos, n) {
  var pa = pos[cl.a[0]][cl.a[1]], pb = cl.b ? pos[cl.b[0]][cl.b[1]] : -1;
  switch (cl.t) {
    case "same": return pa === pb; case "nsame": return pa !== pb; case "pos": return pa === cl.k; case "npos": return pa !== cl.k;
    case "imm": return pb === pa + 1; case "left": return pa < pb; case "adj": return Math.abs(pa - pb) === 1; case "nadj": return Math.abs(pa - pb) > 1;
    case "edge": return pa === 0 || pa === n - 1; case "dist2": return Math.abs(pa - pb) === 2;
  }
  return false;
}
function lkNarrow(cl, M, n, full) {
  var ia = cl.a[0] * n + cl.a[1], ib = cl.b ? cl.b[0] * n + cl.b[1] : -1, a = M[ia], b = ib >= 0 ? M[ib] : 0, na = a, nb = b, lo, hi;
  switch (cl.t) {
    case "same": na = a & b; nb = na; break;
    case "nsame": if (lkSingle(a)) nb = b & ~a; if (lkSingle(b)) na = a & ~b; break;
    case "pos": na = a & (1 << cl.k); break;
    case "npos": na = a & ~(1 << cl.k); break;
    case "imm": na = a & (b >> 1); nb = b & ((a << 1) & full); break;
    case "left": hi = b ? lkBit(b) : 0; na = a & ((1 << hi) - 1); lo = a ? lkBit(a & -a) : n; nb = b & full & ~((1 << (lo + 1)) - 1); break;
    case "adj": na = a & ((b << 1) | (b >> 1)) & full; nb = b & ((a << 1) | (a >> 1)) & full; break;
    case "nadj": if (lkSingle(a)) nb = b & ~(a | (a << 1) | (a >> 1)); if (lkSingle(b)) na = a & ~(b | (b << 1) | (b >> 1)); break;
    case "edge": na = a & (1 | (1 << (n - 1))); break;
    case "dist2": na = a & ((b << 2) | (b >> 2)) & full; nb = b & ((a << 2) | (a >> 2)) & full; break;
  }
  var ch = na !== a || (ib >= 0 && nb !== b);
  M[ia] = na; if (ib >= 0) M[ib] = nb;
  return ch;
}
function lkCount(n, K, clues, limit) {
  var full = (1 << n) - 1, count = 0, sol = null, nodes = 0, c, v, p;
  var prop = function (M) {
    for (var guard = 0; guard < 60; guard++) {
      var ch = false, i;
      for (i = 0; i < clues.length; i++) if (lkNarrow(clues[i], M, n, full)) ch = true;
      for (c = 0; c < K; c++) {
        for (v = 0; v < n; v++) { var mv = M[c * n + v]; if (!mv) return false; if (lkSingle(mv)) for (var w = 0; w < n; w++) if (w !== v && (M[c * n + w] & mv)) { M[c * n + w] &= ~mv; ch = true; } }
        for (p = 0; p < n; p++) { var who = -1, k = 0; for (v = 0; v < n; v++) if (M[c * n + v] >> p & 1) { who = v; k++; } if (!k) return false; if (k === 1 && M[c * n + who] !== 1 << p) { M[c * n + who] = 1 << p; ch = true; } }
      }
      if (!ch) return true;
    }
    return true;
  };
  var rec = function (M) {
    if (count >= limit || nodes++ > 20000) return;
    if (!prop(M)) return;
    var best = -1, bp = 99;
    for (var i = 0; i < M.length; i++) { var pc = popcount(M[i]); if (pc > 1 && pc < bp) { bp = pc; best = i; } }
    if (best < 0) {
      var pos = []; for (c = 0; c < K; c++) { pos.push([]); for (v = 0; v < n; v++) pos[c].push(lkBit(M[c * n + v])); }
      if (clues.every(function (cl) { return lkTrue(cl, pos, n); })) { count++; if (!sol) sol = pos; }
      return;
    }
    var m = M[best];
    while (m && count < limit) { var bt = m & -m; m ^= bt; var M2 = M.slice(); M2[best] = bt; rec(M2); }
  };
  var M0 = []; for (var i0 = 0; i0 < K * n; i0++) M0.push(full);
  rec(M0);
  return { count: nodes > 20000 ? limit : count, sol: sol };
}
function lkRef(E, e, cs) {
  var w = { n: "шкафчик", g: "шкафчика", i: "шкафчиком", p: "шкафчике" }[cs || "n"];
  switch (e[0]) { case 0: return w + " " + dc(E.own[e[1]], "g"); case 1: return w + " с " + E.item[e[1]].i; case 2: return w + " смены " + E.shift[e[1]]; }
  return w + " с пломбой " + E.seal[e[1]];
}
function lkPair(E, x, y, neg) {
  var a = x, b = y; if (a[0] > b[0]) { a = y; b = x; }
  var ca = a[0], cb = b[0];
  if (ca === 0 && cb === 1) return neg ? "в " + lkRef(E, a, "p") + " " + E.item[b[1]].g + " нет" : "в " + lkRef(E, a, "p") + " лежит " + E.item[b[1]].n;
  if (ca === 0 && cb === 2) return E.own[a[1]].n + " работает " + (neg ? "не " : "") + "в смене " + E.shift[b[1]];
  if (ca === 0 && cb === 3) return "на " + lkRef(E, a, "p") + (neg ? " не" : " —") + " пломба " + E.seal[b[1]];
  if (ca === 1 && cb === 2) return E.item[a[1]].n + " лежит " + (neg ? "не " : "") + "в шкафчике смены " + E.shift[b[1]];
  if (ca === 1 && cb === 3) return E.item[a[1]].n + " лежит " + (neg ? "не " : "") + "в шкафчике с пломбой " + E.seal[b[1]];
  return "на шкафчике смены " + E.shift[a[1]] + (neg ? " не" : " —") + " пломба " + E.seal[b[1]];
}
function lkSay(cl, E) {
  var a = cl.a, b = cl.b;
  switch (cl.t) {
    case "same": return lkPair(E, a, b, false); case "nsame": return lkPair(E, a, b, true);
    case "pos": return lkRef(E, a) + " — " + ORDM[cl.k + 1] + " от двери"; case "npos": return lkRef(E, a) + " — не " + ORDM[cl.k + 1] + " от двери";
    case "imm": return lkRef(E, a) + " стоит сразу левее " + lkRef(E, b, "g"); case "left": return lkRef(E, a) + " стоит где-то левее " + lkRef(E, b, "g");
    case "adj": return lkRef(E, a) + " и " + lkRef(E, b) + " стоят рядом"; case "nadj": return lkRef(E, a) + " и " + lkRef(E, b) + " стоят не рядом";
    case "edge": return lkRef(E, a) + " стоит с краю ряда"; case "dist2": return "между " + lkRef(E, a, "i") + " и " + lkRef(E, b, "i") + " стоит ровно один шкафчик";
  }
  return "";
}
function lkKey(cl) { return [cl.t, cl.a.join("."), cl.b ? cl.b.join(".") : "", cl.k].join(":"); }
function genLockers(seed, d) {
  var r = rngFor(seed, "lockers", d), n = [3, 4, 5][d], K = d === 0 ? 3 : d === 1 ? r.pick([3, 4]) : 4, G = null, i, c;
  var lo = [3, 5, 7][d], hi = [8, 10, 14][d];
  for (var at = 0; at < 60 && !G; at++) {
    var pos = []; for (c = 0; c < K; c++) pos.push(shuffled(r, intList(n)));
    var ent = function () { return [r.int(0, K - 1), r.int(0, n - 1)]; };
    var pool = [], seen = {};
    for (var g = 0; g < 400 && pool.length < 160; g++) {
      var t = r.weighted(LK_W[d]), cl = { t: t, a: ent(), b: null, k: -1 };
      if (t === "same" || t === "nsame") { var cb = r.int(0, K - 2); if (cb >= cl.a[0]) cb++; cl.b = [cb, r.int(0, n - 1)]; if (t === "same") cl.b[1] = pos[cb].indexOf(pos[cl.a[0]][cl.a[1]]); }
      else if (t === "pos" || t === "npos") cl.k = t === "pos" ? pos[cl.a[0]][cl.a[1]] : r.int(0, n - 1);
      else if (t !== "edge") { cl.b = ent(); if (cl.b[0] === cl.a[0] && cl.b[1] === cl.a[1]) continue; }
      if (!lkTrue(cl, pos, n)) continue;
      var key = lkKey(cl); if (seen[key]) continue; seen[key] = 1; pool.push(cl);
    }
    var chosen = [], res = { count: 2 };
    for (i = 0; i < pool.length && res.count > 1; i++) { chosen.push(pool[i]); if (chosen.length >= 3 || i === pool.length - 1) res = lkCount(n, K, chosen, 2); }
    if (res.count !== 1) continue;
    for (i = chosen.length - 1; i >= 0; i--) { var rest = chosen.slice(0, i).concat(chosen.slice(i + 1)); if (lkCount(n, K, rest, 2).count === 1) chosen = rest; }
    if (chosen.length < lo || chosen.length > hi) continue;
    r.shuffle(chosen);
    G = { pos: pos, clues: chosen };
  }
  var E = { own: people(r, n), item: shuffled(r, LK_ITEMS).slice(0, n), shift: LK_SH.slice(0, n), seal: [] };
  var sealPool = shuffled(r, intList(89).map(function (x) { return x + 11; })); E.seal = sealPool.slice(0, n).sort(function (a, b) { return a - b; });
  var at0 = function (c0, p0) { return G.pos[c0].indexOf(p0); };
  var valLabel = function (c0, v) { return c0 === 0 ? E.own[v].n : c0 === 1 ? cap(E.item[v].n) : c0 === 2 ? "Смена " + E.shift[v] : "Пломба " + E.seal[v]; };
  var mkPlan = function (swap) {
    var p = [];
    for (var q = 0; q < n; q++) {
      p.push("Шкафчик " + (q + 1));
      for (var c1 = 0; c1 < K; c1++) { var v = at0(c1, q); if (swap && c1 === 0) v = at0(0, q === 0 ? 1 : q === 1 ? 0 : q); p.push(LK_CAT[c1]); p.push(valLabel(c1, v)); }
      p.push("Назад");
    }
    p.push("Сдать опись");
    return p;
  };
  var clA = G.clues.map(function (cl) { return lkKey(cl); }).sort();
  return { n: n, K: K, pos: G.pos, clues: G.clues, E: E, valLabel: valLabel, plan: mkPlan(false), wrong: rep(mkPlan(true), 3), sol: 1, ans: G.pos.map(function (x) { return x.slice(); }),
    data: { n: n, K: K, pos: G.pos, clues: G.clues.map(function (cl) { return { t: cl.t, a: cl.a.slice(), b: cl.b ? cl.b.slice() : null, k: cl.k }; }) },
    sig: "lockers|" + d + "|" + JSON.stringify([n, K, G.pos, clA]) };
}
function lockers(seed, cb, opts) {
  var d = diffOf(opts), P = genLockers(seed, d), n = P.n, K = P.K, E = P.E;
  var cur = []; for (var c0 = 0; c0 < K; c0++) cur.push(intList(n).map(function () { return -1; })); /* cur[c][место] — значение */
  var lines = P.clues.map(function (cl) { return lkSay(cl, E); });
  var catList = ["хозяин", "вещь внутри", "смена хозяина", "номер пломбы"].slice(0, K);
  var vals = function (c1) { return intList(n).map(function (v) { return c1 === 0 ? E.own[v].n : c1 === 1 ? E.item[v].n : c1 === 2 ? "смена " + E.shift[v] : "пломба " + E.seal[v]; }); };
  var cond = head(opts, d) + "Пломбы на шкафчиках. После аварии раздевалку опечатали, опись пропала. " + cap(cnt(n, "шкафчик", "шкафчика", "шкафчиков")) + " стоят в ряд, первый — у двери; «левее» значит ближе к двери. У каждого шкафчика свой " + andList(catList) +
    ". Хозяева: " + andList(vals(0)) + ". Вещи: " + andList(vals(1)) + ". Смены: " + andList(E.shift) + (K > 3 ? ". Пломбы: " + andList(E.seal.map(String)) : "") + ". У каждого шкафчика всё своё, без повторов. Записи: " + lines.join("; ") + ". Восстановите опись.";
  var lockerText = function (q) { var a = []; for (var c1 = 0; c1 < K; c1++) if (cur[c1][q] >= 0) a.push(c1 === 0 ? E.own[cur[c1][q]].n : c1 === 1 ? E.item[cur[c1][q]].n : c1 === 2 ? "смена " + E.shift[cur[c1][q]] : "пломба " + E.seal[cur[c1][q]]); return a.length ? a.join(", ") : "не заполнен"; };
  var whyNot = function () {
    var pos = []; for (var c1 = 0; c1 < K; c1++) { pos.push([]); for (var v = 0; v < n; v++) pos[c1].push(cur[c1].indexOf(v)); }
    for (var i = 0; i < P.clues.length; i++) if (!lkTrue(P.clues[i], pos, n)) return "Не сходится с записью: «" + lines[i] + "».";
    return "Опись не сходится с записями.";
  };
  var last = start("lockers", d, P, "Пломбы на шкафчиках", cond, function (st, finish, fail) {
    var out = [];
    for (var q = 0; q < n; q++) (function (q) {
      out.push(act(function () { return "Шкафчик " + (q + 1) + ": " + lockerText(q); }, function () {
        var items = [];
        for (var c1 = 0; c1 < K; c1++) (function (c1) {
          items.push(act(function () { var v = cur[c1][q]; return LK_CAT[c1] + ": " + (v >= 0 ? vals(c1)[v] : "не указан" + (c1 === 0 ? "" : "а")); }, function () {
            var vi = [];
            for (var v = 0; v < n; v++) (function (v) {
              vi.push({ label: P.valLabel(c1, v), fn: function () {
                var was = cur[c1].indexOf(v), moved = was >= 0 && was !== q ? " Из шкафчика " + (was + 1) + " это убрано." : "";
                if (was >= 0) cur[c1][was] = -1;
                cur[c1][q] = v; A("play", "term_beep");
                say("Шкафчик " + (q + 1) + ": " + vals(c1)[v] + "." + moved);
              } });
            })(v);
            if (cur[c1][q] >= 0) vi.push({ label: "Убрать", fn: function () { cur[c1][q] = -1; A("play", "term_off"); say("Шкафчик " + (q + 1) + ": " + LK_CAT[c1].toLowerCase() + " убран" + (c1 === 0 ? "" : "а") + "."); } });
            vi.push(back("Назад"));
            UIx("menu", "Шкафчик " + (q + 1) + ": " + LK_CAT[c1].toLowerCase(), vi);
          }));
        })(c1);
        items.push(back("Назад"));
        UIx("menu", "Шкафчик " + (q + 1), items);
      }));
    })(q);
    out.push(info("Записи", function () { return "Записи: " + lines.join("; ") + "."; }));
    out.push(act("Сдать опись", function () {
      var left = 0; cur.forEach(function (row) { row.forEach(function (v) { if (v < 0) left++; }); });
      if (left) { nope("Опись не заполнена: пустых граф — " + nw(left, "f") + "."); return; }
      var ok = true; for (var c1 = 0; c1 < K; c1++) for (var q1 = 0; q1 < n; q1++) if (P.pos[c1][cur[c1][q1]] !== q1) ok = false;
      if (ok) { win(last, finish, "Опись сошлась со всеми записями: пломбы сняты, вещи вернули хозяевам.", false); return; }
      A("play", "term_err"); fail(whyNot());
    }));
    out.push(act("Что сейчас", function () { say(intList(n).map(function (q1) { return "шкафчик " + (q1 + 1) + ": " + lockerText(q1); }).join("; ") + "."); }));
    out.push(act("Начать заново", function () { cur = []; for (var c1 = 0; c1 < K; c1++) cur.push(intList(n).map(function () { return -1; })); A("play", "term_off"); say("Опись стёрта, все графы пусты."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   7. СЕЙФ С ДИСКАМИ
   Кнопка диска поворачивает его на деление вперёд и заодно — связанные
   диски. Привести диски к коду. Простая — три диска по четыре деления;
   средняя — четыре диска по шесть делений, связи вперёд и назад, два
   этапа: наружная дверца, потом внутренняя на тех же дисках (они стоят,
   как остались); сложная — четыре диска, связи на два деления и муфта:
   пока один диск стоит на своём делении, кнопка цепляет ещё один диск
   — порядок нажатий важен. Кратчайшее и число кратчайших — поиском в
   ширину; любое решение в пределах нажатий принимается, кратчайшее —
   образцовое.
   ════════════════════════════════════════════════════════════════════ */
function rgEnc(st, m) { var x = 0; for (var i = st.length - 1; i >= 0; i--) x = x * m + st[i]; return x; }
function rgDec(x, k, m) { var st = []; for (var i = 0; i < k; i++) { st.push(x % m); x = Math.floor(x / m); } return st; }
function rgStep(st, i, R) {
  var s2 = st.slice(), e = R.eff[i], j;
  for (j = 0; j < R.k; j++) s2[j] = ((s2[j] + e[j]) % R.m + R.m) % R.m;
  if (R.cl && R.cl.i === i && st[R.cl.c] === R.cl.z) s2[R.cl.j] = ((s2[R.cl.j] + R.cl.dl) % R.m + R.m) % R.m;
  return s2;
}
function rgTable(R) {
  if (R.tab) return R.tab;
  var N = Math.pow(R.m, R.k), k = R.k, T = new Int32Array(N * k), x, i;
  for (x = 0; x < N; x++) { var st = rgDec(x, k, R.m); for (i = 0; i < k; i++) T[x * k + i] = rgEnc(rgStep(st, i, R), R.m); }
  var deg = new Int32Array(N + 1); for (x = 0; x < N * k; x++) deg[T[x] + 1]++;
  for (x = 0; x < N; x++) deg[x + 1] += deg[x];
  var fill = deg.slice(0, N), src = new Int32Array(N * k);
  for (x = 0; x < N; x++) for (i = 0; i < k; i++) { var y = T[x * k + i]; src[fill[y]++] = x; }
  R.tab = { N: N, T: T, off: deg, src: src };
  return R.tab;
}
function rgBfs(R, from) {
  var tb = rgTable(R), N = tb.N, k = R.k, T = tb.T, dist = new Int16Array(N), ways = new Float64Array(N), prev = new Int32Array(N), mv = new Int8Array(N), q = new Int32Array(N), i;
  for (i = 0; i < N; i++) { dist[i] = -1; prev[i] = -1; }
  var s0 = typeof from === "number" ? from : rgEnc(from, R.m), h = 0, t = 0; q[t++] = s0; dist[s0] = 0; ways[s0] = 1;
  while (h < t) {
    var x = q[h++];
    for (i = 0; i < k; i++) {
      var y = T[x * k + i];
      if (dist[y] < 0) { dist[y] = dist[x] + 1; ways[y] = ways[x]; prev[y] = x; mv[y] = i; q[t++] = y; }
      else if (dist[y] === dist[x] + 1) ways[y] += ways[x];
    }
  }
  return { dist: dist, ways: ways, prev: prev, mv: mv };
}
function rgToGoal(R, g) {
  var tb = rgTable(R), N = tb.N, D = new Int16Array(N), q = new Int32Array(N), h = 0, t = 0, i;
  for (i = 0; i < N; i++) D[i] = -1;
  D[g] = 0; q[t++] = g;
  while (h < t) { var y = q[h++]; for (var e = tb.off[y]; e < tb.off[y + 1]; e++) { var x = tb.src[e]; if (D[x] < 0) { D[x] = D[y] + 1; q[t++] = x; } } }
  return D;
}
function rgPath(B, to) { var p = [], x = to; while (B.prev[x] >= 0) { p.unshift(B.mv[x]); x = B.prev[x]; } return p; }
function rgDescend(R, D, x) { var tb = rgTable(R), p = [], g = 0; while (D[x] > 0 && g++ < 60) { for (var i = 0; i < R.k; i++) { var y = tb.T[x * R.k + i]; if (D[y] === D[x] - 1) { p.push(i); x = y; break; } } } return p; }
function rgStage(R, from, slack, lo, hi, r) {
  var tb = rgTable(R), k = R.k, s0 = rgEnc(from, R.m), B = rgBfs(R, s0), cands = [], x, i, j;
  for (x = 0; x < tb.N; x++) if (B.dist[x] >= lo && B.dist[x] <= hi && B.ways[x] >= 2) cands.push(x);
  if (!cands.length) return null;
  r.shuffle(cands);
  for (var c = 0; c < Math.min(8, cands.length); c++) {
    var g = cands[c], min = B.dist[g], limit = min + slack, D = rgToGoal(R, g), alt = null, wrong = -1;
    for (i = 0; i < k && !alt; i++) { var s1 = tb.T[s0 * k + i]; if (s1 === g) continue; var d1 = D[s1]; if (d1 >= 0 && 1 + d1 > min && 1 + d1 <= limit) alt = [i].concat(rgDescend(R, D, s1)); }
    for (i = 0; i < k && wrong < 0; i++) { var y = s0, hit = false; for (j = 0; j < limit && !hit; j++) { y = tb.T[y * k + i]; if (y === g) hit = true; } if (!hit) wrong = i; }
    if (!alt || wrong < 0) continue;
    return { from: from.slice(), to: rgDec(g, k, R.m), min: min, limit: limit, ways: B.ways[g], path: rgPath(B, g), alt: alt, wrong: wrong };
  }
  return null;
}
function rgStepWords(v) { return v === 1 ? "одно деление вперёд" : v === -1 ? "одно деление назад" : v === 2 ? "два деления вперёд" : "два деления назад"; }
function genRings(seed, d) {
  var r = rngFor(seed, "rings", d), k = [3, 4, 4][d], m = [4, 6, 6][d], G = null, i, j;
  for (var at = 0; at < 300 && !G; at++) {
    var eff = [];
    for (i = 0; i < k; i++) {
      var e = intList(k).map(function () { return 0; }); e[i] = 1;
      var oth = shuffled(r, intList(k).filter(function (x) { return x !== i; }));
      if (d === 0) { if (r.chance(0.8)) e[oth[0]] = 1; }
      else { var nl = r.int(1, 2); for (j = 0; j < nl; j++) e[oth[j]] = d === 1 ? r.pick([1, -1]) : r.pick([1, -1, 2]); }
      eff.push(e);
    }
    var cl = null;
    if (d === 2) { var ci = r.int(0, k - 1), cc = r.int(0, k - 1), cj = r.pick(intList(k).filter(function (x) { return x !== ci; })); cl = { c: cc, z: r.int(0, m - 1), i: ci, j: cj, dl: r.pick([1, -1]) }; }
    var R = { k: k, m: m, eff: eff, cl: cl };
    var s0 = intList(k).map(function () { return r.int(0, m - 1); }), st1 = rgStage(R, s0, [4, 3, 2][d], [3, 3, 6][d], [6, 6, 10][d], r);
    if (!st1) continue;
    var stages = [st1];
    if (d === 1) { var st2 = rgStage(R, st1.to, 3, 3, 6, r); if (!st2) continue; stages.push(st2); }
    G = { R: R, stages: stages };
  }
  var lbl = function (i) { return "Кнопка " + (i + 1); };
  var plan = [], alt = [];
  G.stages.forEach(function (s) { plan = plan.concat(s.path.map(lbl)); });
  alt = G.stages[0].alt.map(lbl); if (G.stages[1]) alt = alt.concat(G.stages[1].path.map(lbl));
  var st0 = G.stages[0], wrong = rep(intList(st0.limit).map(function () { return lbl(st0.wrong); }), 3), sol = 1;
  G.stages.forEach(function (s) { sol *= s.ways; });
  var R2 = G.R; delete R2.tab;
  return { R: R2, stages: G.stages, plan: plan, wrong: wrong, alts: [{ plan: alt, best: false }], variable: true, sol: sol, ans: G.stages.map(function (s) { return s.path.slice(); }),
    data: { k: R2.k, m: R2.m, eff: R2.eff, cl: R2.cl, stages: G.stages.map(function (s) { return { from: s.from, to: s.to, min: s.min, limit: s.limit }; }) },
    sig: "rings|" + d + "|" + JSON.stringify([R2.k, R2.m, R2.eff, R2.cl || 0, G.stages.map(function (s) { return [s.from, s.to]; })]) };
}
function rings(seed, cb, opts) {
  var d = diffOf(opts), P = genRings(seed, d), R = P.R, k = R.k, ns = P.stages.length, si = 0, S = P.stages[0];
  var s = S.from.slice(), used = 0, total = 0, clean = true;
  var effText = function (i) {
    var parts = [];
    for (var j = 0; j < k; j++) if (j !== i && R.eff[i][j]) parts.push("диск " + (j + 1) + " — на " + rgStepWords(R.eff[i][j]));
    return "кнопка " + (i + 1) + " поворачивает диск " + (i + 1) + " на одно деление вперёд" + (parts.length ? ", а заодно " + andList(parts) : "");
  };
  var rules = intList(k).map(effText).join("; ") + "." + (R.cl ? " Муфта: пока диск " + (R.cl.c + 1) + " стоит на делении " + R.cl.z + ", кнопка " + (R.cl.i + 1) + " цепляет ещё и диск " + (R.cl.j + 1) + " и поворачивает его на " + rgStepWords(R.cl.dl) + "." : "");
  var code = function (a) { return a.join(", "); };
  var discs = function () { return s.map(function (v, i) { return "диск " + (i + 1) + " — " + v; }).join(", "); };
  var cond = head(opts, d) + "Сейф с дисками. На дверце " + cnt(k, "диск", "диска", "дисков") + " с делениями от 0 до " + (R.m - 1) + "; после деления " + (R.m - 1) + " снова идёт 0. Под каждым диском — кнопка. " + cap(rules) +
    " Сейчас: " + code(S.from) + ". " + (ns === 2 ? stageHead(1, 2) + " Наружная дверца откроется, когда диски покажут " + code(S.to) + "; за ней внутренняя дверца на тех же дисках — её код станет известен потом." : "Сейф откроется, когда диски покажут " + code(S.to) + ".") +
    " Механизм старый: на " + (ns === 2 ? "дверцу" : "всё") + " — " + cnt(S.limit, "нажатие", "нажатия", "нажатий", "n") + ", не больше, иначе его заест, и диски вернутся, как были.";
  var last = start("rings", d, P, "Сейф с дисками", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < k; i++) (function (i) {
      out.push(act(function () { return "Кнопка " + (i + 1) + ": диск " + (i + 1) + " на делении " + s[i]; }, function () {
        var was = s.slice(); s = rgStep(s, i, R); used++; total++;
        if (s.join() === S.to.join()) {
          if (total !== S.min) clean = false;
          if (si + 1 < ns) {
            si++; S = P.stages[si]; used = 0; total = 0; A("play", "door_unlock");
            say("Щёлкнул замок: наружная дверца открыта. " + stageHead(si + 1, ns) + " Внутренняя дверца: нужно " + code(S.to) + ", диски стоят, как остались: " + code(s) + ". На эту дверцу — " + cnt(S.limit, "нажатие", "нажатия", "нажатий", "n") + ", не больше.");
            return;
          }
          win(last, finish, "Диски показывают " + code(s) + ": замок щёлкнул, сейф открыт.", clean && st.tries === 0, "меньше нажатий не бывает");
          return;
        }
        if (used >= S.limit) { s = S.from.slice(); used = 0; A("play", "term_err"); fail("Механизм заело: нажатий больше нет. Диски вернулись к " + code(S.from) + "."); return; }
        var ch = []; for (var j = 0; j < k; j++) if (s[j] !== was[j]) ch.push("диск " + (j + 1) + " — на " + s[j]);
        A("play", "pc_click");
        say(cap(andList(ch)) + ". Нажатий: " + used + " из " + S.limit + ".");
      }));
    })(i);
    out.push(info("Как связаны кнопки", function () { return cap(rules); }));
    out.push(act("Что сейчас", function () { say((ns === 2 ? stageHead(si + 1, ns) + " " : "") + cap(discs()) + ". Нужно: " + code(S.to) + ". Нажатий: " + used + " из " + S.limit + "."); }));
    out.push(act("Начать заново", function () { s = S.from.slice(); used = 0; A("play", "term_off"); say("Диски вернулись к " + code(S.from) + ". Нажатий: ноль из " + S.limit + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   8. ШЕСТЕРНИ ПРИВОДА
   Сцепленные шестерни крутятся в разные стороны, скорость ведомой во
   столько раз меньше, во сколько у неё больше зубьев; шестерни на одном
   валу крутятся вместе; паразитная шестерня меняет направление, но не
   скорость. Простая — цепочка, одно гнездо на выходном валу и место
   для паразитной (ловушка: промежуточные шестерни скорость не меняют);
   средняя — двойной вал и два гнезда: подходят несколько пар, лучшая —
   самая лёгкая (меньше зубьев); сложная — три гнезда, два места для
   паразитной и предел оборотов промежуточного вала. Все верные наборы —
   перебором ящика.
   ════════════════════════════════════════════════════════════════════ */
var GR_T = [10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60];
var GR_S = [60, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720, 900, 1200];
var GR_SH = ["вал мотора", "второй вал", "третий вал", "четвёртый вал", "пятый вал"];
var GR_SHG = ["вала мотора", "второго вала", "третьего вала", "четвёртого вала", "пятого вала"];
var GR_SHI = ["валом мотора", "вторым валом", "третьим валом", "четвёртым валом", "пятым валом"];
var GR_SL = ["А", "Б", "В"];
function grTeeth(t) { return nw(t) + " " + pl(t, "зуб", "зуба", "зубьев"); }
function grSpeed(num, den) { var ex = num % den === 0, v = Math.round(num / den); return (ex ? "" : "около ") + nw(v) + " " + pl(v, "оборот", "оборота", "оборотов") + " в минуту"; }
function grDir(dir) { return dir > 0 ? "по часовой стрелке" : "против часовой стрелки"; }
/* привод: sh[j] = { i: зубья входной шестерни или «гнездо», o: выходной }; гнездо — { s: номер }; сокеты — номера зацеплений для паразитной */
function grEval(G, fill, idl) {
  var num = G.S, den = 1, dir = 1, sp = [{ num: num, den: den }];
  var t = function (g) { return g.s != null ? fill[g.s] : g.t; };
  for (var j = 1; j < G.sh.length; j++) {
    num *= t(G.sh[j - 1].o); den *= t(G.sh[j].i); dir = -dir;
    G.sock.forEach(function (sk, k) { if (sk === j && idl[k]) dir = -dir; });
    var g0 = gcd(num, den); num /= g0; den /= g0;
    sp.push({ num: num, den: den });
  }
  return { num: num, den: den, dir: dir, sp: sp };
}
function grPerms(box, k) {
  var out = [], cur = [], used = box.map(function () { return false; });
  var rec = function () { if (cur.length === k) { out.push(cur.slice()); return; } for (var i = 0; i < box.length; i++) if (!used[i]) { used[i] = true; cur.push(i); rec(); cur.pop(); used[i] = false; } };
  rec();
  return out;
}
function grValid(G) {
  var ns = G.nslots, list = [], minSum = 1e9, minI = 0;
  var needOdd = 0, base = (G.sh.length - 1) % 2 === 0 ? 1 : -1;
  if (base !== G.D) needOdd = 1;
  grPerms(G.box, ns).forEach(function (p) {
    var fill = p.map(function (bi) { return G.box[bi]; });
    var ev = grEval(G, fill, G.sock.map(function () { return false; }));
    if (ev.num !== G.X * ev.den) return;
    if (G.vmax && ev.sp[G.vshaft].num > G.vmax * ev.sp[G.vshaft].den) return;
    var sum = fill.reduce(function (a, b) { return a + b; }, 0);
    list.push({ p: p, fill: fill, sum: sum });
    if (sum < minSum) minSum = sum;
  });
  minI = needOdd;
  return { list: list, minSum: minSum, minIdl: minI, needOdd: needOdd };
}
function genGears(seed, d) {
  var r = rngFor(seed, "gears", d), G = null, i;
  for (var at = 0; at < 400 && !G; at++) {
    var S = r.pick(GR_S), t0 = r.pick(GR_T), sh, nslots, sock, box, X, D = r.chance(0.5) ? 1 : -1, vmax = 0, vshaft = -1, tg;
    if (d === 0) {
      var q = r.int(2, 4); sh = [{ i: 0, o: { t: t0 } }];
      for (i = 1; i < q; i++) { var gg = { t: r.pick(GR_T) }; sh.push({ i: gg, o: gg }); }
      var cands = GR_T.filter(function (t) { return (S * t0) % t === 0 && S * t0 / t !== S && S * t0 / t >= 10 && S * t0 / t <= 3000; });
      if (!cands.length) continue;
      tg = r.pick(cands); sh.push({ i: { s: 0 }, o: null }); X = S * t0 / tg; nslots = 1; sock = [r.int(1, q)];
      box = [tg].concat(shuffled(r, GR_T.filter(function (t) { return t !== tg; })).slice(0, 4));
    } else if (d === 1) {
      var g1 = r.pick(GR_T), g2 = { t: r.pick(GR_T) };
      sh = [{ i: 0, o: { t: t0 } }, { i: { t: g1 }, o: { s: 0 } }, { i: g2, o: g2 }, { i: { s: 1 }, o: null }];
      var A0 = r.pick(GR_T), B0 = r.pick(GR_T.filter(function (t) { return t !== A0; }));
      if ((S * t0 * A0) % (g1 * B0) !== 0) continue;
      X = S * t0 * A0 / (g1 * B0); if (X < 10 || X > 3000 || X === S) continue;
      var sib = []; GR_T.forEach(function (a) { GR_T.forEach(function (b) { if (a !== b && a * B0 === b * A0 && !(a === A0 && b === B0)) sib.push([a, b]); }); });
      if (!sib.length) continue;
      var pr = r.pick(sib), bx = [A0, B0];
      [pr[0], pr[1]].forEach(function (t) { if (bx.indexOf(t) < 0) bx.push(t); });
      shuffled(r, GR_T).forEach(function (t) { if (bx.length < 6 && bx.indexOf(t) < 0) bx.push(t); });
      box = bx; nslots = 2; sock = [r.int(1, 3)];
    } else {
      var h1 = r.pick(GR_T), h2 = { t: r.pick(GR_T) }, h3 = { t: r.pick(GR_T) };
      sh = [{ i: 0, o: { t: t0 } }, { i: { t: h1 }, o: { s: 0 } }, { i: { s: 1 }, o: h2 }, { i: h3, o: h3 }, { i: { s: 2 }, o: null }];
      var tri = shuffled(r, GR_T).slice(0, 3), num = S * t0 * tri[0] * h2.t, den = h1 * tri[1] * tri[2];
      if (num % den !== 0) continue;
      X = num / den; if (X < 10 || X > 3000) continue;
      box = tri.slice(); shuffled(r, GR_T).forEach(function (t) { if (box.length < 7 && box.indexOf(t) < 0) box.push(t); });
      var s1 = r.int(1, 4), s2 = r.int(1, 4); if (s1 === s2) continue;
      sock = [Math.min(s1, s2), Math.max(s1, s2)]; nslots = 3; vshaft = 2;
      var G0 = { S: S, sh: sh, sock: sock, box: box, X: X, D: D, nslots: 3, vmax: 0, vshaft: 2 }, all = grValid(G0).list;
      if (all.length < 3) continue;
      var vs = all.map(function (v) { var ev = grEval(G0, v.fill, [false, false]); return ev.sp[2].num / ev.sp[2].den; }).sort(function (a, b) { return a - b; });
      var uniq = vs.filter(function (v, k2) { return !k2 || v !== vs[k2 - 1]; });
      if (uniq.length < 2) continue;
      var cut = -1;
      for (var u = uniq.length - 2; u >= 0 && cut < 0; u--) { var cnt2 = vs.filter(function (v) { return v <= uniq[u]; }).length, vm = Math.ceil(uniq[u]); if (cnt2 >= 2 && vm < uniq[u + 1]) cut = vm; }
      if (cut < 0) continue;
      vmax = cut;
    }
    var GG = { S: S, t0: t0, sh: sh, sock: sock, box: box, X: X, D: D, nslots: nslots, vmax: vmax, vshaft: vshaft };
    var V = grValid(GG);
    if (d === 0 && V.list.length !== 1) continue;
    if (d > 0 && (V.list.length < 2 || V.list.length > 8)) continue;
    GG.V = V; G = GG;
  }
  var gl = function (t) { return "Шестерня на " + t + " " + pl(t, "зуб", "зуба", "зубьев"); };
  var mk = function (fill, idl) {
    var p = [];
    fill.forEach(function (t, k) { p.push("Гнездо " + GR_SL[k]); p.push(gl(t)); });
    idl.forEach(function (on, k) { if (on) p.push("Паразитная шестерня" + (G.sock.length > 1 ? " " + (k + 1) : "")); });
    p.push("Запустить привод");
    return p;
  };
  var V2 = G.V, bestL = V2.list.filter(function (v) { return v.sum === V2.minSum; }), worse = V2.list.filter(function (v) { return v.sum > V2.minSum; });
  var idlBest = G.sock.map(function (sk, k) { return V2.needOdd === 1 && k === 0; });
  var plan = mk(bestL[0].fill, idlBest), alts = [];
  if (d > 0) {
    if (worse.length) alts.push({ plan: mk(worse[0].fill, idlBest), best: false });
    else if (bestL.length > 1) alts.push({ plan: mk(bestL[1].fill, idlBest), best: true });
    if (G.sock.length > 1) alts.push({ plan: mk(bestL[0].fill, V2.needOdd ? [false, true] : [true, true]), best: !!V2.needOdd });
  }
  var bad = [];
  grPerms(G.box, G.nslots).forEach(function (p) { if (bad.length < 3) { var f = p.map(function (bi) { return G.box[bi]; }); var ev = grEval(G, f, G.sock.map(function () { return false; })); if (ev.num !== G.X * ev.den) bad.push(f); } });
  var wrong = [0, 1, 2].map(function (k) { return mk(bad[k % bad.length], G.sock.map(function () { return false; })); });
  var nvar = d > 0 ? V2.list.length * (G.sock.length > 1 && V2.needOdd ? 2 : 1) : 1;
  return { G: G, plan: plan, wrong: wrong, alts: alts, variable: d > 0, sol: nvar, ans: { fill: bestL[0].fill.slice(), idl: idlBest.slice() },
    data: { S: G.S, sh: G.sh, sock: G.sock, box: G.box, X: G.X, D: G.D, vmax: G.vmax, vshaft: G.vshaft, valid: V2.list.map(function (v) { return v.fill; }), minSum: V2.minSum, needOdd: V2.needOdd },
    sig: "gears|" + d + "|" + JSON.stringify([G.S, G.sh, G.sock, G.box.slice().sort(function (a, b) { return a - b; }), G.X, G.D, G.vmax]) };
}
function grDesc(G) {
  var ref = function (g, cs) { return g.s != null ? "гнездо " + GR_SL[g.s] : (cs === "a" ? "шестерню на " : "шестерня на ") + grTeeth(g.t); };
  var parts = ["мотор крутит " + grDir(1) + " свою шестерню на " + grTeeth(G.sh[0].o.t) + ", " + grSpeed(G.S, 1)];
  for (var j = 1; j < G.sh.length; j++) {
    var prev = G.sh[j - 1].o, cur = G.sh[j].i, last = j === G.sh.length - 1;
    parts.push((j === 1 ? "шестерня мотора" : ref(prev)) + " цепляет " + ref(cur, "a") + (last ? " выходного вала" : " — она на " + (j === 1 ? "втором" : j === 2 ? "третьем" : "четвёртом") + " валу"));
    if (!last && G.sh[j].o !== G.sh[j].i) parts.push("на том же валу вместе с ней крутится " + ref(G.sh[j].o));
  }
  var sk = G.sock.map(function (s) { return "между " + GR_SHI[s - 1] + " и " + (s === G.sh.length - 1 ? "выходным валом" : GR_SHI[s]); });
  return cap(parts.join("; ")) + ". Место для паразитной шестерни — " + andList(sk) + ": паразитная меняет направление, но не скорость.";
}
function gears(seed, cb, opts) {
  var d = diffOf(opts), P = genGears(seed, d), G = P.G, ns = G.nslots, fill = intList(ns).map(function () { return 0; }), idl = G.sock.map(function () { return false; });
  var boxText = "В ящике шестерни на " + andList(G.box.slice().sort(function (a, b) { return a - b; }).map(function (t) { return nw(t); })) + " " + pl(G.box.slice().sort(function (a, b) { return a - b; })[G.box.length - 1], "зуб", "зуба", "зубьев") + ", каждая в одном экземпляре.";
  var need = "Выходной вал должен крутиться " + grDir(G.D) + ", " + grSpeed(G.X, 1) + "." + (G.vmax ? " Подшипник третьего вала держит не больше " + grSpeed(G.vmax, 1) + "." : "");
  var cond = head(opts, d) + "Шестерни привода. Правила: сцепленные шестерни крутятся в разные стороны; скорость ведомой шестерни во столько раз меньше скорости ведущей, во сколько у неё больше зубьев; шестерни на одном валу крутятся вместе. Привод: " + grDesc(G) + " " + need + " " + boxText +
    " Поставьте шестерни в " + (ns === 1 ? "гнездо" : "гнёзда") + " и решите, нужна ли паразитная." + (d > 0 ? " Подходящих наборов может быть несколько; лучший — самый лёгкий, с наименьшим числом зубьев." : "");
  var gl = function (t) { return "шестерня на " + t + " " + pl(t, "зуб", "зуба", "зубьев"); };
  var state = function () {
    var a = fill.map(function (t, k) { return "гнездо " + GR_SL[k] + " — " + (t ? gl(t) : "пусто"); });
    idl.forEach(function (on, k) { a.push("паразитная" + (idl.length > 1 ? " " + (k + 1) : "") + " — " + (on ? "стоит" : "не стоит")); });
    return cap(a.join("; ")) + ".";
  };
  var last = start("gears", d, P, "Шестерни привода", cond, function (st, finish, fail) {
    var out = [];
    fill.forEach(function (t0, k) {
      out.push(act(function () { return "Гнездо " + GR_SL[k] + ": " + (fill[k] ? gl(fill[k]) : "пусто"); }, function () {
        var items = G.box.slice().sort(function (a, b) { return a - b; }).map(function (t) {
          var where = fill.indexOf(t);
          return { label: cap(gl(t)) + (where >= 0 && where !== k ? " — стоит в гнезде " + GR_SL[where] : where === k ? " — стоит здесь" : ""), fn: function () {
            var w = fill.indexOf(t); if (w >= 0) fill[w] = 0;
            fill[k] = t; A("play", "craft");
            say("В гнезде " + GR_SL[k] + " — " + gl(t) + "." + (w >= 0 && w !== k ? " Гнездо " + GR_SL[w] + " теперь пусто." : ""));
          } };
        });
        if (fill[k]) items.push({ label: "Оставить пустым", fn: function () { fill[k] = 0; A("play", "term_off"); say("Гнездо " + GR_SL[k] + " пусто."); } });
        items.push(back("Назад"));
        UIx("menu", "Гнездо " + GR_SL[k], items);
      }));
    });
    idl.forEach(function (on0, k) {
      out.push(act(function () { return "Паразитная шестерня" + (idl.length > 1 ? " " + (k + 1) : "") + ": " + (idl[k] ? "стоит" : "не стоит"); }, function () {
        idl[k] = !idl[k]; A("play", idl[k] ? "craft" : "term_off");
        say("Паразитная шестерня" + (idl.length > 1 ? " " + (k + 1) : "") + (idl[k] ? " поставлена." : " снята."));
      }));
    });
    out.push(info("Схема привода", function () { return grDesc(G) + " " + need + " " + boxText; }));
    out.push(act("Запустить привод", function () {
      if (fill.some(function (t) { return !t; })) { nope("Сначала поставьте шестерни во все гнёзда."); return; }
      var ev = grEval(G, fill, idl);
      if (G.vmax && ev.sp[G.vshaft].num > G.vmax * ev.sp[G.vshaft].den) { A("play", "term_err"); fail("Подшипник третьего вала взвыл: вал разогнался до " + grSpeed(ev.sp[G.vshaft].num, ev.sp[G.vshaft].den) + ", а держит не больше " + grSpeed(G.vmax, 1) + ". Привод остановлен."); return; }
      if (ev.num === G.X * ev.den && ev.dir === G.D) {
        var sum = fill.reduce(function (a, b) { return a + b; }, 0), ni = idl.filter(Boolean).length;
        A("play", "power_on");
        win(last, finish, "Привод загудел ровно: выходной вал крутится " + grDir(G.D) + ", " + grSpeed(G.X, 1) + ".", d > 0 && sum === G.V.minSum && ni === G.V.minIdl, "самая лёгкая передача, без лишних шестерён");
        return;
      }
      A("play", "term_err");
      fail("Выходной вал крутится " + grDir(ev.dir) + ", " + grSpeed(ev.num, ev.den) + ", а нужно " + grDir(G.D) + ", " + grSpeed(G.X, 1) + ".");
    }));
    out.push(act("Что сейчас", function () { say(state() + " " + need); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   9. МАЯТНИКИ СМЕНЫ
   Простая — два-три маятника ударили вместе; когда снова вместе (НОК),
   сколько ударов до встречи, сколько встреч за время. Средняя — сигналы
   смены со своим началом: когда впервые (или во второй раз) сработают
   вместе, сколько раз за смену. Сложная — два этапа: найти первую общую
   минуту трёх сигналов, потом подобрать период отбоя, который впервые
   совпадёт с ними ровно тогда и не раньше совпадёт с насосом; верных
   периодов несколько, лучший — самый редкий.
   ════════════════════════════════════════════════════════════════════ */
var PD_SIG = [{ n: "насос", v: "включается", i: "насосом" }, { n: "вентилятор", v: "включается", i: "вентилятором" }, { n: "компрессор", v: "включается", i: "компрессором" }, { n: "маяк", v: "мигает", i: "маяком" }, { n: "сирена", v: "гудит", i: "сиреной" }];
var PD_ORD = ["первый", "второй", "третий"];
function pdCommon(ps, ss, from, to) { var out = []; for (var t = from; t <= to; t++) { var ok = true; for (var i = 0; i < ps.length && ok; i++) if (t < ss[i] || (t - ss[i]) % ps[i] !== 0) ok = false; if (ok) out.push(t); } return out; }
function pdSec(v) { return pl(v, "секунду", "секунды", "секунд"); }
function pdMin(v) { return pl(v, "минуту", "минуты", "минут"); }
function genPendulums(seed, d) {
  var r = rngFor(seed, "pendulums", d), G = null, i;
  for (var at = 0; at < 400 && !G; at++) {
    if (d === 0) {
      var m = r.chance(0.6) ? 2 : 3, ps = shuffled(r, intList(19).map(function (x) { return x + 2; })).slice(0, m).sort(function (a, b) { return a - b; }), L = ps.reduce(lcm, 1);
      if (L > (m === 2 ? 200 : 300) || L === ps[m - 1]) continue;
      var q = r.pick(["first", "count", "within"]), who = r.int(0, m - 1), T = 0, ans;
      if (q === "first") ans = L;
      else if (q === "count") ans = L / ps[who];
      else { T = r.pick([60, 90, 120, 180, 240, 300, 360, 600]); ans = Math.floor(T / L); if (ans < 1 || ans > 20) continue; }
      G = { ps: ps, ss: ps.map(function () { return 0; }), q: q, who: who, T: T, ans: ans, L: L };
    } else {
      var m2 = d === 2 ? 3 : (r.chance(0.5) ? 2 : 3), pp = shuffled(r, intList(13).map(function (x) { return x + 3; })).slice(0, m2), ss = pp.map(function (p) { return r.int(1, p); });
      var com = pdCommon(pp, ss, 1, 1000);
      if (!com.length || com[0] > 480 || com[0] <= Math.max.apply(null, ss) + 2) continue;
      var q2 = d === 2 ? "first" : r.pick(["first", "first", "second", "count"]), ans2;
      if (q2 === "first") ans2 = com[0];
      else if (q2 === "second") { if (com.length < 2 || com[1] > 1000) continue; ans2 = com[1]; }
      else { ans2 = com.filter(function (t) { return t <= 480; }).length; if (ans2 < 2) continue; }
      var sigs = shuffled(r, intList(PD_SIG.length)).slice(0, m2);
      var g2 = { ps: pp, ss: ss, q: q2, ans: ans2, sigs: sigs, T: com[0] };
      if (d === 2) {
        var Tt = com[0], r0 = r.int(1, Math.max(1, Tt - 4)), valid = [];
        for (var p = 2; p <= 30; p++) {
          if ((Tt - r0) % p !== 0) continue;
          var bad = false; for (var t = r0; t < Tt && !bad; t += p) if (t >= ss[0] && (t - ss[0]) % pp[0] === 0) bad = true;
          if (!bad) valid.push(p);
        }
        var nonv = intList(29).map(function (x) { return x + 2; }).filter(function (x) { return valid.indexOf(x) < 0 && (Tt - r0) % x === 0; });
        if (valid.length < 2 || valid.length > 6 || !nonv.length) continue;
        g2.r0 = r0; g2.valid = valid; g2.trap = nonv;
      }
      G = g2;
    }
  }
  var plan = numPlan(G.ans), wrongV = [], alts = [];
  for (var k = 1; wrongV.length < 3 && k < 50; k++) { var w = G.ans + (k % 2 ? k : -k); if (w > 0 && wrongV.indexOf(w) < 0) wrongV.push(w); }
  if (d === 2) {
    var bestP = Math.max.apply(null, G.valid), other = G.valid.filter(function (x) { return x !== bestP; })[0];
    alts.push({ plan: plan.concat(numPlan(other)), best: false });
    plan = plan.concat(numPlan(bestP));
  }
  var sigArr = d === 0 ? [G.ps, G.q, G.q === "count" ? G.who : -1, G.q === "within" ? G.T : 0] : [G.ps, G.ss, G.q, G.r0 || 0];
  return { G: G, plan: plan, wrong: wrongV.map(numPlan), alts: alts, variable: d === 2, stages: d === 2 ? 2 : 1, sol: d === 2 ? G.valid.length : 1,
    ans: d === 2 ? { t: G.ans, p: Math.max.apply(null, G.valid) } : { t: G.ans },
    data: { ps: G.ps, ss: G.ss, q: G.q, who: G.who, T: G.T, ans: G.ans, r0: G.r0, valid: G.valid },
    sig: "pendulums|" + d + "|" + JSON.stringify(sigArr) };
}
function pendulums(seed, cb, opts) {
  var d = diffOf(opts), P = genPendulums(seed, d), G = P.G, stage = 1, cur = "";
  var m = G.ps.length, sn = function (i) { return d === 0 ? PD_ORD[i] + " маятник" : PD_SIG[G.sigs[i]].n; };
  var desc, ask;
  if (d === 0) {
    desc = G.ps.map(function (p, i) { return (i ? PD_ORD[i] : "Первый маятник") + " бьёт каждые " + nw(p, "f") + " " + pdSec(p); }).join(", ") + ". " + (m === 2 ? "Оба" : "Все три") + " только что ударили вместе.";
    ask = G.q === "first" ? "Через сколько секунд они впервые снова ударят вместе?" : G.q === "count" ? "Сколько раз ударит " + PD_ORD[G.who] + " маятник до первой новой встречи, считая и удар встречи?" :
      "Сколько раз за " + nw(G.T, "f") + " " + pdSec(G.T) + " они ударят вместе, не считая самого начала?";
  } else {
    desc = G.ps.map(function (p, i) { return cap(sn(i)) + " " + PD_SIG[G.sigs[i]].v + " каждые " + nw(p, "f") + " " + pdMin(p) + ", впервые — через " + nw(G.ss[i], "f") + " " + pdMin(G.ss[i]) + " после начала смены"; }).join("; ") + ".";
    var both = m === 2 ? "оба" : "все три";
    ask = G.q === "first" ? "Через сколько минут после начала смены " + both + " впервые сработают вместе?" : G.q === "second" ? "Через сколько минут после начала смены " + both + " сработают вместе во второй раз?" :
      "Сколько раз за смену в четыреста восемьдесят минут " + both + " сработают вместе?";
  }
  var ask2 = "", pump = d === 2 ? PD_SIG[G.sigs[0]].n : "";
  if (d === 2) ask2 = "Нужен отбой — сигнал, который включится через " + nw(G.r0, "f") + " " + pdMin(G.r0) + " после начала смены и дальше будет бить с постоянным периодом от двух до тридцати минут. Он должен впервые совпасть со всеми тремя ровно в ту минуту, что вы нашли, а с " + PD_SIG[G.sigs[0]].i + " до неё не совпадать ни разу. Какой период поставить? Подходит не один; лучший — самый редкий.";
  var cond = head(opts, d) + "Маятники смены. " + desc + " " + (d === 2 ? stageHead(1, 2) + " " : "") + ask + (d === 2 ? " Потом — второй этап: по найденной минуте настроить новый сигнал." : "");
  var fires = function (i, t) { return t >= G.ss[i] && (t - G.ss[i]) % G.ps[i] === 0; };
  var unit = d === 0 ? function (v) { return nw(v, "f") + " " + pdSec(v); } : function (v) { return nw(v, "f") + " " + pdMin(v); };
  var whyNot = function (v) {
    if (G.q === "first" || G.q === "second") {
      var miss = -1; for (var i = 0; i < m; i++) if (!fires(i, v)) { miss = i; break; }
      if (miss >= 0) return "Нет: через " + unit(v) + " " + sn(miss) + (d === 0 ? " не бьёт" : " не срабатывает") + ".";
      return v < G.ans ? "Нет: вместе они сработают и тогда, но спрашивают " + (G.q === "second" ? "о втором разе." : "о первом.") : "Нет: вместе они сойдутся раньше.";
    }
    return G.q === "count" ? (d === 0 ? "Нет. Сначала найдите, когда они впервые снова ударят вместе." : "Нет. Найдите, через сколько минут совпадения повторяются, и пересчитайте их до конца смены.") : "Нет. Совпадения идут через равные промежутки — найдите этот промежуток.";
  };
  var why2 = function (p) {
    if (p < 2 || p > 30) return "Период — от двух до тридцати минут.";
    if ((G.T - G.r0) % p !== 0) return "Нет: отбой с периодом " + unit(p) + " в нужную минуту не бьёт.";
    for (var t = G.r0; t < G.T; t += p) if (fires(0, t)) return "Нет: такой отбой совпал бы с " + PD_SIG[G.sigs[0]].i + " раньше — через " + unit(t) + " после начала смены.";
    return "Нет.";
  };
  var listen = function () {
    var span = d === 0 ? Math.min(G.L || 16, 16) : Math.min(G.T || 30, 30), step = d === 0 ? 0.3 : 0.15, F = [523, 659, 784];
    for (var t = 0; t <= span; t++) for (var i = 0; i < m; i++) if (d === 0 ? t % G.ps[i] === 0 : fires(i, t)) tone(F[i], 0.08, t * step + i * 0.02);
    say("Слушайте первые " + unit(span) + ", ускоренно: у каждого " + (d === 0 ? "маятника" : "сигнала") + " свой тон, низкий — " + sn(0) + ".");
  };
  var last = start("pendulums", d, P, "Маятники смены", cond, function (st, finish, fail) {
    return [
      act(function () { return "Ответ: " + (cur || "не набран"); }, function () { numMenu(stage === 1 ? "Набор ответа" : "Период отбоя", function () { return cur; }, function (v) { cur = v; }, 4); }),
      act("Сдать ответ", function () {
        if (!cur) { nope("Сначала наберите число."); return; }
        var v = Number(cur);
        if (stage === 1) {
          if (v === G.ans) {
            if (d === 2) { stage = 2; cur = ""; A("play", "paper_turn"); say("Верно: все три сойдутся через " + unit(G.ans) + " после начала смены. " + stageHead(2, 2) + " " + ask2); return; }
            win(last, finish, "Верно: " + v + ". Журнал маятников сошёлся.", false); return;
          }
          A("play", "term_err"); fail(whyNot(v)); return;
        }
        if (G.valid.indexOf(v) >= 0) { win(last, finish, "Отбой с периодом " + unit(v) + " впервые совпадёт со всеми тремя ровно через " + unit(G.T) + ".", v === Math.max.apply(null, G.valid), "реже этот отбой бить не может"); return; }
        A("play", "term_err"); fail(why2(v));
      }),
      act("Послушать удары", listen),
      act("Что сейчас", function () { say((stage === 2 ? stageHead(2, 2) + " " + ask2 : (d === 2 ? stageHead(1, 2) + " " : "") + desc + " " + ask) + " Набрано: " + (cur || "ничего") + "."); })
    ];
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   10. СОРТИРОВОЧНАЯ ГОРКА
   Вагонетки с разными грузами стоят на подъездном пути; на выход их
   надо отдать группами в заданном порядке грузов (внутри группы —
   любой порядок). Пути: прямо на выход, тупик (стек: последней зашла —
   первой выйдет) и, на сложной, разъезд (очередь: первой зашла —
   первой выйдет). Простая — тупик без предела; средняя — тупик на две
   вагонетки и мало запаса ходов; сложная — тупик и разъезд по две
   вагонетки, запас — один ход. Кратчайшее и число кратчайших — поиском
   в ширину; любое решение в пределах ходов принимается.
   ════════════════════════════════════════════════════════════════════ */
var SH_CARGO = [{ n: "руда", i: "с рудой" }, { n: "соль", i: "с солью" }, { n: "уголь", i: "с углём" }, { n: "вода", i: "с водой" }, { n: "крепёж", i: "с крепежом" }, { n: "щебень", i: "со щебнем" }];
var SH_LBL = { IO: "С подъездного прямо на выход", IS: "С подъездного в тупик", SO: "Из тупика на выход", IQ: "С подъездного на разъезд", QO: "С разъезда на выход" };
function shKey(s) { return s.i + "|" + s.st.join(",") + "|" + s.qu.join(","); }
/* ход: { s — новое положение } или { err — вагонетка ушла на выход не в свою очередь } или { no — ход невозможен } */
function shApply(T, s, mv) {
  var n = T.grp.length, w = -1, ns = { i: s.i, st: s.st.slice(), qu: s.qu.slice(), out: s.out };
  if (mv === "IO" || mv === "IS" || mv === "IQ") { if (s.i >= n) return { no: "in" }; w = s.i; }
  if (mv === "SO") { if (!s.st.length) return { no: "st" }; w = s.st[s.st.length - 1]; }
  if (mv === "QO") { if (!s.qu.length) return { no: "qu" }; w = s.qu[0]; }
  if (mv === "IS") { if (s.st.length >= T.cap) return { no: "stfull" }; ns.i++; ns.st.push(w); return { s: ns }; }
  if (mv === "IQ") { if (s.qu.length >= T.capQ) return { no: "qufull" }; ns.i++; ns.qu.push(w); return { s: ns }; }
  for (var x = 0; x < n; x++) {
    if (x === w || T.grp[x] >= T.grp[w]) continue;
    if (x >= s.i || s.st.indexOf(x) >= 0 || s.qu.indexOf(x) >= 0) return { err: w, before: x };
  }
  if (mv === "IO") ns.i++; else if (mv === "SO") ns.st.pop(); else ns.qu.shift();
  ns.out++;
  return { s: ns };
}
function shGraph(T, from) {
  var mvs = T.moves, q = [from], idx = {}, st = [], dist = [], ways = [], prev = [], pm = [], adj = [], goal = -1, i, j;
  idx[shKey(from)] = 0; st.push(from); dist.push(0); ways.push(1); prev.push(-1); pm.push(null);
  for (i = 0; i < st.length; i++) {
    var s = st[i]; adj.push([]);
    if (s.out === T.grp.length) { if (goal < 0) goal = i; continue; }
    for (j = 0; j < mvs.length; j++) {
      var res = shApply(T, s, mvs[j]); if (!res.s) continue;
      var kn = shKey(res.s), y = idx[kn];
      if (y == null) { y = st.length; idx[kn] = y; st.push(res.s); dist.push(dist[i] + 1); ways.push(ways[i]); prev.push(i); pm.push(mvs[j]); }
      else if (dist[y] === dist[i] + 1) ways[y] += ways[i];
      adj[i].push([mvs[j], y]);
    }
  }
  if (goal < 0) return null;
  var toG = st.map(function () { return -1; }), rev = st.map(function () { return []; }), q2 = [goal];
  adj.forEach(function (a, x) { a.forEach(function (e) { rev[e[1]].push(x); }); });
  toG[goal] = 0;
  for (i = 0; i < q2.length; i++) rev[q2[i]].forEach(function (x) { if (toG[x] < 0) { toG[x] = toG[q2[i]] + 1; q2.push(x); } });
  var path = [], x0 = goal; while (prev[x0] >= 0) { path.unshift(pm[x0]); x0 = prev[x0]; }
  var down = function (x) { var p = [], g = 0; while (toG[x] > 0 && g++ < 80) { for (var e = 0; e < adj[x].length; e++) if (toG[adj[x][e][1]] === toG[x] - 1) { p.push(adj[x][e][0]); x = adj[x][e][1]; break; } } return p; };
  return { min: dist[goal], ways: ways[goal], path: path, adj: adj, toG: toG, down: down, st: st };
}
function shBfs(T, from) { var g = shGraph(T, from); return g ? { min: g.min, ways: g.ways, path: g.path } : null; }
function shAlt(Gr, limit, wantWorse) {
  var x = 0, pre = [];
  for (var step = 0; step <= Gr.path.length; step++) {
    var nextMv = Gr.path[step];
    for (var e = 0; e < Gr.adj[x].length; e++) {
      var mv = Gr.adj[x][e][0], y = Gr.adj[x][e][1];
      if (mv === nextMv || Gr.toG[y] < 0) continue;
      var len = step + 1 + Gr.toG[y];
      if (wantWorse ? (len > Gr.min && len <= limit) : len === Gr.min) return pre.concat([mv], Gr.down(y));
    }
    if (step === Gr.path.length) break;
    pre.push(nextMv);
    for (var e2 = 0; e2 < Gr.adj[x].length; e2++) if (Gr.adj[x][e2][0] === nextMv) { x = Gr.adj[x][e2][1]; break; }
  }
  return null;
}
function genShunting(seed, d) {
  var r = rngFor(seed, "shunting", d), G = null, i;
  for (var at = 0; at < 300 && !G; at++) {
    var n = d === 0 ? r.int(5, 8) : d === 1 ? r.int(6, 8) : r.int(7, 8), k = d === 0 ? r.int(2, 3) : d === 1 ? r.int(3, 4) : r.int(3, 4);
    var grp = intList(n).map(function (x) { return x < k ? x : r.int(0, k - 1); }); r.shuffle(grp);
    var T = { grp: grp, cap: d === 0 ? n : 2, capQ: d === 2 ? 2 : 0, moves: d === 2 ? ["IO", "IS", "SO", "IQ", "QO"] : ["IO", "IS", "SO"] };
    var s0 = { i: 0, st: [], qu: [], out: 0 }, Gr = shGraph(T, s0);
    if (!Gr || Gr.min < n + [2, 2, 4][d] || Gr.ways < 2) continue;
    if (d === 2) { var B2 = shBfs({ grp: grp, cap: 2, capQ: 0, moves: ["IO", "IS", "SO"] }, s0); if (B2 && B2.min <= Gr.min) continue; }
    var limit = Gr.min + [4, 2, 1][d], altP = shAlt(Gr, limit, true), altBest = false;
    if (!altP) { altP = shAlt(Gr, limit, false); altBest = true; }
    if (!altP) continue;
    var wrong = null, seqs = [[]];
    for (var dep = 0; dep < 4 && !wrong; dep++) {
      var nx = [];
      seqs.forEach(function (sq) {
        if (wrong) return;
        var st = s0; for (var z = 0; z < sq.length; z++) st = shApply(T, st, sq[z]).s;
        ["IO", "SO", "QO"].forEach(function (om) { if (!wrong && T.moves.indexOf(om) >= 0 && shApply(T, st, om).err != null) wrong = sq.concat([om]); });
        ["IS", "IQ"].forEach(function (pm2) { if (T.moves.indexOf(pm2) >= 0 && shApply(T, st, pm2).s) nx.push(sq.concat([pm2])); });
      });
      seqs = nx;
    }
    if (!wrong) continue;
    G = { T: T, min: Gr.min, ways: Gr.ways, path: Gr.path, limit: limit, alt: { plan: altP, best: altBest }, wrong: wrong };
  }
  var lb = function (m) { return SH_LBL[m]; };
  var order = shuffled(r, intList(SH_CARGO.length)).slice(0, Math.max.apply(null, G.T.grp) + 1);
  return { T: G.T, order: order, min: G.min, limit: G.limit, plan: G.path.map(lb), wrong: rep(G.wrong.map(lb), 3), alts: [{ plan: G.alt.plan.map(lb), best: G.alt.best }], variable: true, sol: G.ways,
    ans: G.path.slice(), data: { grp: G.T.grp, cap: G.T.cap, capQ: G.T.capQ, min: G.min, limit: G.limit },
    sig: "shunting|" + d + "|" + JSON.stringify([G.T.grp, G.T.cap, G.T.capQ]) };
}
function shunting(seed, cb, opts) {
  var d = diffOf(opts), P = genShunting(seed, d), T = P.T, n = T.grp.length;
  var s = { i: 0, st: [], qu: [], out: 0 }, used = 0, total = 0;
  var cg = function (w) { return SH_CARGO[P.order[T.grp[w]]]; };
  var wn = function (w) { return "вагонетка " + (w + 1) + " " + cg(w).i; };
  var list = function (arr) { return arr.length ? arr.map(function (w) { return (w + 1) + " " + cg(w).i; }).join(", ") : "пусто"; };
  var groups = P.order.map(function (o) { return SH_CARGO[o].i; });
  var where = function () {
    var inc = []; for (var x = s.i; x < n; x++) inc.push(x);
    return "На подъездном пути, от горки: " + list(inc) + ". В тупике" + (s.st.length ? ", сверху вниз: " + list(s.st.slice().reverse()) : ": пусто") + "." + (T.capQ ? " На разъезде" + (s.qu.length ? ", от выхода: " + list(s.qu) : ": пусто") + "." : "") + " На выходе вагонеток: " + s.out + " из " + n + ".";
  };
  var cond = head(opts, d) + "Сортировочная горка. " + cap(cnt(n, "вагонетка", "вагонетки", "вагонеток", "f")) + " стоят на подъездном пути; первой к горке стоит вагонетка 1: " + list(intList(n)) + ". На выход их надо отдать по грузам: сначала все вагонетки " + groups[0] + ", потом " + groups.slice(1).join(", потом ") +
    "; внутри одного груза — в любом порядке. Пути: с подъездного прямо на выход; в тупик, где последняя зашедшая выходит первой" + (T.cap < n ? ", а помещаются только две" : "") +
    (T.capQ ? "; на разъезд, где первая зашедшая первой и выходит, тоже на две" : "") + ". Отдать на выход вагонетку раньше её очереди нельзя: сцепщик остановит горку. На всё — " + cnt(P.limit, "ход", "хода", "ходов") + ", не больше.";
  var reset = function () { s = { i: 0, st: [], qu: [], out: 0 }; used = 0; };
  var last = start("shunting", d, P, "Сортировочная горка", cond, function (st, finish, fail) {
    var out = [];
    var front = function (m) { return m === "SO" ? (s.st.length ? wn(s.st[s.st.length - 1]) : "тупик пуст") : m === "QO" ? (s.qu.length ? wn(s.qu[0]) : "разъезд пуст") : (s.i < n ? wn(s.i) : "путь пуст"); };
    T.moves.forEach(function (m) {
      out.push(act(function () { return SH_LBL[m] + ": " + front(m); }, function () {
        var res = shApply(T, s, m);
        if (res.no) { nope(res.no === "in" ? "Подъездной путь пуст." : res.no === "st" ? "В тупике пусто." : res.no === "qu" ? "На разъезде пусто." : res.no === "stfull" ? "Тупик полон: в нём помещаются только две вагонетки." : "Разъезд полон: на нём помещаются только две вагонетки."); return; }
        if (res.err != null) {
          reset(); total++; A("play", "term_err");
          fail("Сцепщик остановил горку: " + wn(res.err) + " пошла на выход раньше, чем " + wn(res.before) + ". Состав вернули на подъездной путь.");
          return;
        }
        var w = m === "SO" ? s.st[s.st.length - 1] : m === "QO" ? s.qu[0] : s.i;
        s = res.s; used++; total++;
        if (s.out === n) { A("play", "gate_ride"); win(last, finish, "Состав собран: грузы идут по порядку — " + andList(groups) + ".", total === P.min && st.tries === 0, "меньше ходов не бывает"); return; }
        if (used >= P.limit) { reset(); A("play", "term_err"); fail("Смена горки кончилась: ходов больше нет. Состав вернули на подъездной путь."); return; }
        A("play", "robot_step");
        say(cap(wn(w)) + (m === "IS" ? " — в тупике." : m === "IQ" ? " — на разъезде." : " — на выходе.") + " Ходов: " + used + " из " + P.limit + ".");
      }));
    });
    out.push(act("Что сейчас", function () { say(where() + " Ходов: " + used + " из " + P.limit + ". Порядок грузов: " + andList(groups) + "."); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Состав вернули на подъездной путь. " + where()); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   11. ПЯТНАШКИ ЩИТА
   Плитки с номерами контуров в рамке, одна ячейка пуста; соседняя
   плитка сдвигается в пустую. Простая — рамка два на три, средняя —
   три на три, сложная — три на три, глубокая перестановка и запас
   всего в два хода. Цель — номера по порядку рядов, пустая ячейка там,
   где сказано. Кратчайшее — поиском с оценкой (IDA*); любое решение в
   пределах ходов принимается, кратчайшее — образцовое.
   ════════════════════════════════════════════════════════════════════ */
/* двунаправленный поиск в ширину: точное кратчайшее, число кратчайших и один кратчайший путь (номера сдвигаемых плиток) */
function slBi(R, C, st, goal, maxD) {
  var N = R * C, nb = [], i;
  for (i = 0; i < N; i++) { var a = []; if (i >= C) a.push(i - C); if (i + C < N) a.push(i + C); if (i % C) a.push(i - 1); if (i % C < C - 1) a.push(i + 1); nb.push(a); }
  var key = function (x) { var v = 0; for (var j = N - 1; j >= 0; j--) v = v * 9 + x[j]; return v; }, sk = key(st), gk = key(goal);
  if (sk === gk) return { min: 0, count: 1, path: [] };
  var mk = function (root, k) { var S = { d: new Map(), w: new Map(), p: new Map(), m: new Map(), front: [root], depth: 0 }; S.d.set(k, 0); S.w.set(k, 1); return S; };
  var F = mk(st, sk), B = mk(goal, gk);
  for (var guard = 0; guard < 60; guard++) {
    if (F.depth + B.depth >= (maxD || 40)) return null;
    var S = F.front.length <= B.front.length ? F : B, O = S === F ? B : F, nf = [];
    S.front.forEach(function (x) {
      var kx = key(x), b = x.indexOf(0), dx = S.d.get(kx), wx = S.w.get(kx);
      nb[b].forEach(function (q) {
        var t = x.slice(); t[b] = t[q]; t[q] = 0; var kt = key(t), dt = S.d.get(kt);
        if (dt == null) { S.d.set(kt, dx + 1); S.w.set(kt, wx); S.p.set(kt, kx); S.m.set(kt, x[q]); nf.push(t); }
        else if (dt === dx + 1) S.w.set(kt, S.w.get(kt) + wx);
      });
    });
    S.front = nf; S.depth++;
    if (!nf.length) return null;
    var best = 1e9, meet = [];
    nf.forEach(function (t) { var kt = key(t), od = O.d.get(kt); if (od != null) { var tot = S.depth + od; if (tot < best) { best = tot; meet = [kt]; } else if (tot === best && meet.indexOf(kt) < 0) meet.push(kt); } });
    if (!meet.length) continue;
    var count = 0; meet.forEach(function (kt) { count += S.w.get(kt) * O.w.get(kt); });
    var x0 = meet[0], head = [], tail = [], z = x0;
    while (F.p.has(z)) { head.unshift(F.m.get(z)); z = F.p.get(z); }
    z = x0; while (B.p.has(z)) { tail.push(B.m.get(z)); z = B.p.get(z); }
    return { min: best, count: count, path: head.concat(tail) };
  }
  return null;
}
function genSlider(seed, d) {
  var r = rngFor(seed, "slider", d), R = d === 0 ? r.pick([2, 3]) : 3, C = d === 0 ? 5 - R : 3, N = R * C, G = null;
  var lo = [5, 8, 14][d], hi = [12, 13, 18][d];
  for (var at = 0; at < 200 && !G; at++) {
    var gb = r.int(0, N - 1), goal = [], t = 1, i;
    for (i = 0; i < N; i++) goal.push(i === gb ? 0 : t++);
    var s = goal.slice(), b = gb, prev = -1, W = [r.int(6, 24), r.int(9, 18), r.int(15, 26)][d];
    for (var k = 0; k < W; k++) {
      var opts2 = []; if (b >= C) opts2.push(b - C); if (b + C < N) opts2.push(b + C); if (b % C) opts2.push(b - 1); if (b % C < C - 1) opts2.push(b + 1);
      opts2 = opts2.filter(function (x) { return x !== prev; });
      var p = r.pick(opts2); s[b] = s[p]; s[p] = 0; prev = b; b = p;
    }
    var sv = slBi(R, C, s, goal, hi + 1);
    if (!sv || sv.min < lo || sv.min > hi || (d > 0 && sv.count < 2)) continue;
    G = { goal: goal, start: s, min: sv.min, count: sv.count, path: sv.path, limit: sv.min + [4, 4, 2][d] };
  }
  var b0 = G.start.indexOf(0), mvT = -1;
  [b0 - C, b0 + C, b0 % C ? b0 - 1 : -1, b0 % C < C - 1 ? b0 + 1 : -1].forEach(function (p) { if (mvT < 0 && p >= 0 && p < N) mvT = G.start[p]; });
  var tl = function (t) { return "Плитка " + t; };
  return { R: R, C: C, goal: G.goal, start: G.start, min: G.min, limit: G.limit, plan: G.path.map(tl), wrong: rep(intList(G.limit).map(function () { return tl(mvT); }), 3),
    alts: [{ plan: [tl(mvT), tl(mvT)].concat(G.path.map(tl)), best: false }], variable: true, sol: G.count, ans: G.path.slice(),
    data: { R: R, C: C, goal: G.goal, start: G.start, min: G.min, limit: G.limit },
    sig: "slider|" + d + "|" + JSON.stringify([R, G.goal, G.start]) };
}
function slider(seed, cb, opts) {
  var d = diffOf(opts), P = genSlider(seed, d), R = P.R, C = P.C, N = R * C, s = P.start.slice(), used = 0, total = 0;
  var rowOf = function (arr, rr) { var a = []; for (var c = 0; c < C; c++) { var v = arr[rr * C + c]; a.push(v ? String(v) : "пусто"); } return a.join(", "); };
  var field = function (arr) { var a = []; for (var rr = 0; rr < R; rr++) a.push("ряд " + (rr + 1) + " — " + rowOf(arr, rr)); return a.join("; "); };
  var cond = head(opts, d) + "Пятнашки щита. На щите управления — рамка в " + cnt(R, "ряд", "ряда", "рядов") + " по " + cnt(C, "ячейка", "ячейки", "ячеек", "f") + "; в ячейках плитки с номерами контуров, одна ячейка пуста. Ряды считаются сверху вниз, ячейки — слева направо. Плитку, соседнюю с пустой ячейкой сверху, снизу или сбоку, можно сдвинуть в неё. Сейчас: " +
    field(P.start) + ". Нужно: " + field(P.goal) + ". Защёлки рамки изношены: на всё — " + cnt(P.limit, "сдвиг", "сдвига", "сдвигов") + ", не больше, иначе рамка сбросится.";
  var last = start("slider", d, P, "Пятнашки щита", cond, function (st, finish, fail) {
    var out = [];
    for (var rr = 0; rr < R; rr++) (function (rr) { out.push(info(function () { return "Ряд " + (rr + 1) + ": " + rowOf(s, rr); })); })(rr);
    var b = s.indexOf(0), mv = [];
    if (b >= C) mv.push({ p: b - C, w: "вниз" });
    if (b + C < N) mv.push({ p: b + C, w: "вверх" });
    if (b % C) mv.push({ p: b - 1, w: "вправо" });
    if (b % C < C - 1) mv.push({ p: b + 1, w: "влево" });
    mv.sort(function (x, y) { return s[x.p] - s[y.p]; });
    mv.forEach(function (m) {
      out.push(act("Плитка " + s[m.p] + " — " + m.w, function () {
        var t = s[m.p], bb = s.indexOf(0);
        if (Math.abs(bb - m.p) !== C && Math.abs(bb - m.p) !== 1) { nope("Эта плитка не у пустой ячейки."); return; }
        s[bb] = t; s[m.p] = 0; used++; total++;
        if (s.join() === P.goal.join()) { A("play", "power_on"); win(last, finish, "Плитки встали по порядку: щит управления ожил.", total === P.min && st.tries === 0, "меньше сдвигов не бывает"); return; }
        if (used >= P.limit) { s = P.start.slice(); used = 0; A("play", "term_err"); fail("Защёлки щёлкнули: рамка сбросилась в начальное положение."); return; }
        A("play", "term_beep");
        say("Плитка " + t + " — " + m.w + ". Пустая ячейка: ряд " + (Math.floor(m.p / C) + 1) + ", место " + (m.p % C + 1) + ". Сдвигов: " + used + " из " + P.limit + ".");
      }));
    });
    out.push(act("Что сейчас", function () { say(cap(field(s)) + ". Нужно: " + field(P.goal) + ". Сдвигов: " + used + " из " + P.limit + "."); }));
    out.push(act("Начать заново", function () { s = P.start.slice(); used = 0; A("play", "term_off"); say("Рамка в начальном положении: " + field(s) + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   12. РАССАДКА В БУНКЕРЕ
   Расселить людей по нарам в ряд (у двери — первые) или за круглым
   столом по условиям. Условия оставляют несколько верных рассадок —
   принимается любая; пожелание коменданта выполняется не во всех, и
   рассадка с ним — образцовая. Простая — пятеро на нарах, средняя —
   шестеро, условия с промежутками и «ближе к двери»; сложная — два
   этапа: нары, потом ужин за круглым столом, и условия стола ссылаются
   на соседей по нарам — каждая верная рассадка первого этапа годится,
   но задача второго этапа у каждой своя.
   ════════════════════════════════════════════════════════════════════ */
var BK_W = [{ ADJ: 3, NADJ: 2, POS: 2, EDGE: 2, LEFT: 2 }, { ADJ: 2, NADJ: 2, POS: 1, NPOS: 1, EDGE: 1, NEDGE: 1, LEFT: 2, GAP: 2 }];
var BK_W2 = { ADJ: 2, NADJ: 2, OPP: 2, SEAT: 1, CW: 2 };
function bkPerms(n) { return U.perms(intList(n)); }
var bkPermCache = {};
function bkAll(n) { if (!bkPermCache[n]) bkPermCache[n] = bkPerms(n); return bkPermCache[n]; }
/* p[чел] — место; ref — места на нарах (для условий стола) */
function bkTrue(c, p, n, circ, ref) {
  var dist = function (x, y) { var dd = Math.abs(x - y); return circ ? Math.min(dd, n - dd) : dd; }, i, j, pa = c.a >= 0 ? p[c.a] : -1, pb = c.b >= 0 ? p[c.b] : -1;
  switch (c.t) {
    case "ADJ": return dist(pa, pb) === 1; case "NADJ": return dist(pa, pb) !== 1;
    case "POS": case "SEAT": return pa === c.k; case "NPOS": return pa !== c.k;
    case "EDGE": return pa === 0 || pa === n - 1; case "NEDGE": return pa !== 0 && pa !== n - 1;
    case "LEFT": return pa < pb; case "GAP": return Math.abs(pa - pb) === c.k + 1;
    case "OPP": return dist(pa, pb) === n / 2; case "CW": return pb === (pa + 1) % n;
    case "DOORHEAD": return p[ref.indexOf(0)] === 0;
    case "FARHEAD": return p[ref.indexOf(n - 1)] === n / 2;
    case "APART": for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (ref[j] === ref[i] + 1 && dist(p[i], p[j]) === 1) return false; return true;
    case "NEXT": for (j = 0; j < n; j++) if (Math.abs(ref[j] - ref[c.a]) === 1 && dist(p[c.a], p[j]) === 1) return true; return false;
  }
  return false;
}
function bkSay(c, ps, n) {
  var X = c.a >= 0 ? ps[c.a] : null, Y = c.b >= 0 ? ps[c.b] : null;
  switch (c.t) {
    case "ADJ": return X.n + " и " + Y.n + (c.circ ? " сидят рядом" : " спят рядом");
    case "NADJ": return X.n + " и " + Y.n + (c.circ ? " рядом не сидят" : " рядом не спят");
    case "POS": return X.n + " спит " + (c.k === 0 ? "у самой двери" : "на " + ORDP[c.k + 1] + " месте от двери");
    case "NPOS": return X.n + " спит не на " + ORDP[c.k + 1] + " месте от двери";
    case "EDGE": return X.n + " спит с краю"; case "NEDGE": return X.n + " спит не с краю";
    case "LEFT": return X.n + " спит ближе к двери, чем " + Y.n;
    case "GAP": return "между " + dc(X, "i") + " и " + dc(Y, "i") + (c.k === 1 ? " спит ровно один человек" : " спят ровно " + COLL[c.k]);
    case "OPP": return X.n + " сидит напротив " + dc(Y, "g");
    case "SEAT": return X.n + " сидит " + (c.k === 0 ? "во главе стола" : "на " + ORDP[c.k + 1] + " месте");
    case "CW": return Y.n + " сидит сразу по часовой стрелке от " + dc(X, "g");
    case "DOORHEAD": return "тот, кто спит у двери, садится во главе стола";
    case "FARHEAD": return "тот, кто спит дальше всех от двери, садится напротив главы стола";
    case "APART": return "соседи по нарам за столом рядом не садятся";
    case "NEXT": return X.n + " садится рядом хотя бы с одним из своих соседей по нарам";
  }
  return "";
}
function bkRand(r, w, n, circ) {
  var t = r.weighted(w), a = r.int(0, n - 1), b = r.int(0, n - 2); if (b >= a) b++;
  var c = { t: t, a: a, b: -1, k: -1, circ: circ };
  if (t === "ADJ" || t === "NADJ" || t === "LEFT" || t === "OPP" || t === "CW") c.b = b;
  else if (t === "GAP") { c.b = b; c.k = r.int(1, 2); }
  else if (t === "POS" || t === "NPOS" || t === "SEAT") c.k = r.int(0, n - 1);
  return c;
}
function bkArr(c) { return [c.t, c.a, c.b, c.k]; }
function bkPick(r, w, n, circ, sols, ref, lo, hi, H) {
  var chosen = [], cur = sols;
  for (var g = 0; g < 300 && cur.length > hi; g++) {
    var c = bkRand(r, w, n, circ);
    if (!bkTrue(c, H, n, circ, ref)) continue;
    if (chosen.some(function (x) { return bkArr(x).join() === bkArr(c).join(); })) continue;
    var nx = cur.filter(function (p) { return bkTrue(c, p, n, circ, ref); });
    if (nx.length < cur.length && nx.length >= lo) { chosen.push(c); cur = nx; }
  }
  return cur.length >= lo && cur.length <= hi ? { conds: chosen, sols: cur } : null;
}
function bkWish(r, w, n, circ, sols, ref) {
  for (var g = 0; g < 200; g++) {
    var c = bkRand(r, w, n, circ), k = sols.filter(function (p) { return bkTrue(c, p, n, circ, ref); }).length;
    if (k >= 1 && k < sols.length) return c;
  }
  return null;
}
function genBunker(seed, d) {
  var r = rngFor(seed, "bunker", d), n = d === 0 ? 5 : 6, G = null;
  for (var at = 0; at < 200 && !G; at++) {
    var H = shuffled(r, intList(n)), all = bkAll(n);
    var st1 = bkPick(r, BK_W[d === 0 ? 0 : 1], n, false, all, null, 2, d === 0 ? 4 : d === 1 ? 6 : 4, H);
    if (!st1 || st1.conds.length < 3) continue;
    if (d < 2) {
      var wish = bkWish(r, BK_W[d], n, false, st1.sols, null);
      if (!wish) continue;
      G = { st1: st1, wish: wish };
      continue;
    }
    var ref0 = st1.sols[0], H2 = shuffled(r, intList(n)), refc = [];
    var pool = [{ t: "DOORHEAD", a: -1, b: -1, k: -1, circ: true }, { t: "FARHEAD", a: -1, b: -1, k: -1, circ: true }, { t: "APART", a: -1, b: -1, k: -1, circ: true }, { t: "NEXT", a: r.int(0, n - 1), b: -1, k: -1, circ: true }];
    r.shuffle(pool);
    refc = pool.filter(function (c) { return bkTrue(c, H2, n, true, ref0); }).slice(0, 2);
    if (!refc.length) continue;
    var circAll = all.filter(function (p) { return refc.every(function (c) { return bkTrue(c, p, n, true, ref0); }); });
    var st2 = bkPick(r, BK_W2, n, true, circAll, ref0, 2, 4, H2);
    if (!st2) continue;
    var conds2 = refc.concat(st2.conds), okAll = true, per = [];
    st1.sols.forEach(function (rf) { var ss = all.filter(function (p) { return conds2.every(function (c) { return bkTrue(c, p, n, true, rf); }); }); if (!ss.length) okAll = false; per.push(ss); });
    if (!okAll) continue;
    var wish2 = bkWish(r, BK_W2, n, true, per[0], ref0);
    if (!wish2) continue;
    G = { st1: st1, conds2: conds2, per: per, wish: wish2 };
  }
  var ps = people(r, n), nm = function (x) { return ps[x].n; };
  var seatPlan = function (p, lbl) { var q = []; for (var s = 0; s < n; s++) { q.push(lbl + " " + (s + 1)); q.push(nm(p.indexOf(s))); } return q; };
  var plan, alts = [], wrong, sol;
  if (d < 2) {
    var good = G.st1.sols.filter(function (p) { return bkTrue(G.wish, p, n, false, null); }), badw = G.st1.sols.filter(function (p) { return !bkTrue(G.wish, p, n, false, null); });
    plan = seatPlan(good[0], "Нары").concat(["Рассадить"]);
    alts.push({ plan: seatPlan(badw[0], "Нары").concat(["Рассадить"]), best: false });
    if (good.length > 1) alts.push({ plan: seatPlan(good[1], "Нары").concat(["Рассадить"]), best: true });
    sol = G.st1.sols.length;
  } else {
    var g2 = G.per[0].filter(function (p) { return bkTrue(G.wish, p, n, true, G.st1.sols[0]); });
    plan = seatPlan(G.st1.sols[0], "Нары").concat(["Рассадить"], seatPlan(g2[0], "Место"), ["Рассадить за столом"]);
    alts.push({ plan: seatPlan(G.st1.sols[1], "Нары").concat(["Рассадить"], seatPlan(G.per[1][0], "Место"), ["Рассадить за столом"]), best: bkTrue(G.wish, G.per[1][0], n, true, G.st1.sols[1]) });
    sol = 0; G.per.forEach(function (x) { sol += x.length; });
  }
  var allN = bkAll(n), bad = null;
  for (var i = 0; i < allN.length && !bad; i++) if (!G.st1.conds.every(function (c) { return bkTrue(c, allN[i], n, false, null); })) bad = allN[i];
  wrong = rep(seatPlan(bad, "Нары").concat(["Рассадить"]), 3);
  return { n: n, ps: ps, conds: G.st1.conds, sols1: G.st1.sols, conds2: G.conds2 || null, per: G.per || null, wish: G.wish, plan: plan, wrong: wrong, alts: alts, variable: true, sol: sol, stages: d === 2 ? 2 : 1,
    ans: d < 2 ? { row: G.st1.sols.filter(function (p) { return bkTrue(G.wish, p, n, false, null); })[0] } : { row: G.st1.sols[0], table: G.per[0].filter(function (p) { return bkTrue(G.wish, p, n, true, G.st1.sols[0]); })[0] },
    data: { n: n, conds: G.st1.conds.map(bkArr), conds2: G.conds2 ? G.conds2.map(bkArr) : null, wish: bkArr(G.wish), nsol: sol },
    sig: "bunker|" + d + "|" + JSON.stringify([n, G.st1.conds.map(bkArr), G.conds2 ? G.conds2.map(bkArr) : 0, bkArr(G.wish)]) };
}
function bunker(seed, cb, opts) {
  var d = diffOf(opts), P = genBunker(seed, d), ps = P.ps, n = P.n, stage = 1, rowRef = null;
  var seat = intList(n).map(function () { return -1; }); /* seat[место] — человек */
  var lines = P.conds.map(function (c) { return bkSay(c, ps, n); }), lines2 = P.conds2 ? P.conds2.map(function (c) { return bkSay(c, ps, n); }) : [];
  var wishText = bkSay(P.wish, ps, n);
  var cond = head(opts, d) + "Рассадка в бункере. В спальном отсеке " + cnt(n, "место", "места", "мест", "n") + " на нарах в ряд, первое — у двери. Расселить нужно " + COLLA[n] + ": " + andList(ps.map(function (p) { return p.n; })) + ". Условия: " + lines.join("; ") + "." +
    (d < 2 ? " Пожелание коменданта, если получится: " + wishText + ". Верных рассадок несколько — годится любая." : " " + stageHead(1, 2) + " Нары. Верных рассадок несколько — годится любая. Потом — ужин за круглым столом, и там условия будут о соседях по нарам.");
  var stage2Text = function () { return stageHead(2, 2) + " Ужин за круглым столом на " + nw(n, "n") + " мест; место 1 — во главе стола, дальше места по часовой стрелке. Условия стола: " + lines2.join("; ") + ". Пожелание коменданта, если получится: " + wishText + "."; };
  var lbl = function () { return stage === 1 ? "Нары" : "Место"; };
  var pos = function () { var p = intList(n).map(function () { return -1; }); seat.forEach(function (x, s) { if (x >= 0) p[x] = s; }); return p; };
  var seatText = function () { return seat.map(function (x, s) { return (stage === 1 ? "нары " : "место ") + (s + 1) + " — " + (x >= 0 ? ps[x].n : stage === 1 ? "свободны" : "свободно"); }).join("; "); };
  var last = start("bunker", d, P, "Рассадка в бункере", cond, function (st, finish, fail) {
    var out = [];
    for (var s0 = 0; s0 < n; s0++) (function (s0) {
      out.push(act(function () { return lbl() + " " + (s0 + 1) + ": " + (seat[s0] >= 0 ? ps[seat[s0]].n : stage === 1 ? "свободны" : "свободно"); }, function () {
        var items = ps.map(function (p, x) {
          var at = seat.indexOf(x);
          return { label: p.n + (at >= 0 && at !== s0 ? ": сейчас — " + lbl().toLowerCase() + " " + (at + 1) : at === s0 ? ": здесь" : ""), fn: function () {
            var was = seat.indexOf(x); if (was >= 0) seat[was] = -1;
            seat[s0] = x; A("play", "chair_sit");
            say(p.n + " — " + lbl().toLowerCase() + " " + (s0 + 1) + "." + (was >= 0 && was !== s0 ? " " + cap(lbl().toLowerCase()) + " " + (was + 1) + " теперь " + (stage === 1 ? "свободны." : "свободно.") : ""));
          } };
        });
        if (seat[s0] >= 0) items.push({ label: "Освободить", fn: function () { seat[s0] = -1; A("play", "chair_up"); say(lbl() + " " + (s0 + 1) + (stage === 1 ? " свободны." : " свободно.")); } });
        items.push(back("Назад"));
        UIx("menu", lbl() + " " + (s0 + 1), items);
      }));
    })(s0);
    out.push(info("Условия", function () { return stage === 1 ? "Условия: " + lines.join("; ") + "." + (d < 2 ? " Пожелание: " + wishText + "." : "") : stage2Text(); }));
    out.push(act(stage === 1 ? "Рассадить" : "Рассадить за столом", function () {
      if (seat.some(function (x) { return x < 0; })) { nope("Сначала займите все " + (stage === 1 ? "нары." : "места.")); return; }
      var p = pos(), conds = stage === 1 ? P.conds : P.conds2, txt = stage === 1 ? lines : lines2, circ = stage === 2;
      for (var i = 0; i < conds.length; i++) if (!bkTrue(conds[i], p, n, circ, rowRef)) { A("play", "term_err"); fail("Не выходит: нарушено условие «" + txt[i] + "»."); return; }
      if (stage === 1 && d === 2) { rowRef = p; stage = 2; seat = intList(n).map(function () { return -1; }); A("play", "paper_turn"); say("Нары распределены. " + stage2Text()); return; }
      var wishOk = bkTrue(P.wish, p, n, circ, rowRef);
      win(last, finish, (stage === 2 ? "Ужин прошёл мирно: все условия стола выполнены." : "Все разместились: условия выполнены.") + (wishOk ? "" : " Пожелание коменданта на этот раз не учтено."), wishOk, "учтено и пожелание коменданта");
    }));
    out.push(act("Что сейчас", function () { say((d === 2 ? stageHead(stage, 2) + " " : "") + cap(seatText()) + "."); }));
    out.push(act("Начать заново", function () { seat = intList(n).map(function () { return -1; }); A("play", "term_off"); say("Все встали: " + (stage === 1 ? "нары" : "места") + " свободны."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   13. ТАБЛИЦА ИСПЫТАНИЙ
   Круговой турнир испытателей: каждый с каждым по одному испытанию; за
   победу — два очка, за ничью — одно. Часть результатов смыта —
   восстановить по итоговым очкам и записям. Простая — четверо, два
   пропуска, очки всех; средняя — пятеро, три-четыре пропуска, очки не
   у всех, бывают записи о ничьих и победах; сложная — два этапа:
   восстановить результаты, потом расставить места по правилам: при
   равенстве очков выше победитель личной встречи, при ничьей в ней —
   тот, у кого больше побед. Ответ единственный (перебор пропусков).
   ════════════════════════════════════════════════════════════════════ */
function lgPts(n, ms, vals) { var p = intList(n).map(function () { return 0; }); ms.forEach(function (m, k) { var v = vals[k]; p[m[0]] += v; p[m[1]] += 2 - v; }); return p; }
function lgWins(n, ms, vals) { var w = intList(n).map(function () { return 0; }); ms.forEach(function (m, k) { if (vals[k] === 2) w[m[0]]++; else if (vals[k] === 0) w[m[1]]++; }); return w; }
function lgClue(c, n, ms, vals) {
  var p, w;
  switch (c.t) {
    case "PTS": return lgPts(n, ms, vals)[c.a] === c.k;
    case "DRAWS": return vals.filter(function (v) { return v === 1; }).length === c.k;
    case "NOLOSS": return ms.every(function (m, k) { return !((m[0] === c.a && vals[k] === 0) || (m[1] === c.a && vals[k] === 2)); });
    case "WINS": w = lgWins(n, ms, vals); return w[c.a] === c.k;
  }
  return false;
}
function lgOrder(n, ms, vals) {
  var p = lgPts(n, ms, vals), w = lgWins(n, ms, vals), ok = true;
  var h2h = function (a, b) { for (var k = 0; k < ms.length; k++) { var m = ms[k]; if (m[0] === a && m[1] === b) return vals[k] - 1; if (m[0] === b && m[1] === a) return 1 - vals[k]; } return 0; };
  var ord = intList(n).sort(function (a, b) {
    if (p[a] !== p[b]) return p[b] - p[a];
    var h = h2h(a, b); if (h) return -h;
    if (w[a] !== w[b]) return w[b] - w[a];
    ok = false; return a - b;
  });
  for (var i = 0; i + 2 < n; i++) if (p[ord[i]] === p[ord[i + 1]] && p[ord[i]] === p[ord[i + 2]]) ok = false;
  return ok ? ord : null;
}
function genLeague(seed, d) {
  var r = rngFor(seed, "league", d), n = d === 0 ? 4 : 5, G = null, i, j;
  var ms = []; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) ms.push([i, j]);
  for (var at = 0; at < 400 && !G; at++) {
    var vals = ms.map(function () { return r.weighted({ 0: 2, 1: 1, 2: 2 }) | 0; });
    var nm = d === 0 ? 2 : d === 1 ? r.int(3, 4) : r.int(4, 5), miss = shuffled(r, intList(ms.length)).slice(0, nm).sort(function (a, b) { return a - b; });
    var pts = lgPts(n, ms, vals), clues = [];
    var hide = d === 0 ? [] : shuffled(r, intList(n)).slice(0, d === 1 ? 1 : r.int(1, 2));
    for (i = 0; i < n; i++) if (hide.indexOf(i) < 0) clues.push({ t: "PTS", a: i, k: pts[i] });
    if (d > 0) {
      var extra = [{ t: "DRAWS", a: -1, k: vals.filter(function (v) { return v === 1; }).length }];
      var wins = lgWins(n, ms, vals);
      for (i = 0; i < n; i++) { extra.push({ t: "WINS", a: i, k: wins[i] }); if (lgClue({ t: "NOLOSS", a: i }, n, ms, vals)) extra.push({ t: "NOLOSS", a: i, k: -1 }); }
      r.shuffle(extra);
      var ne = d === 1 ? r.int(0, 1) : r.int(1, 2); for (i = 0; i < ne; i++) clues.push(extra[i]);
    }
    var count = 0, combos = Math.pow(3, nm), sol = null;
    for (var c = 0; c < combos; c++) {
      var v2 = vals.slice(), x = c;
      for (i = 0; i < nm; i++) { v2[miss[i]] = x % 3; x = Math.floor(x / 3); }
      if (clues.every(function (cl) { return lgClue(cl, n, ms, v2); })) { count++; sol = v2; }
    }
    if (count !== 1) continue;
    var ord = null;
    if (d === 2) {
      ord = lgOrder(n, ms, vals); if (!ord) continue;
      var tie = false; for (i = 0; i + 1 < n; i++) if (pts[ord[i]] === pts[ord[i + 1]]) tie = true;
      if (!tie) continue;
    }
    G = { vals: vals, miss: miss, clues: clues, ord: ord };
  }
  var ps = people(r, n), nmx = function (x) { return ps[x].n; };
  var outLbl = function (k, v) { var m = ms[k]; return v === 1 ? "Ничья" : v === 2 ? gv(ps[m[0]], "Победил ", "Победила ") + nmx(m[0]) : gv(ps[m[1]], "Победил ", "Победила ") + nmx(m[1]); };
  var mk = function (wrongK) {
    var p = [];
    G.miss.forEach(function (k, q) { var v = G.vals[k]; if (q === wrongK) v = (v + 1) % 3; p.push(nmx(ms[k][0]) + " — " + nmx(ms[k][1])); p.push(outLbl(k, v)); });
    p.push("Сдать таблицу");
    return p;
  };
  var plan = mk(-1);
  if (d === 2) { G.ord.forEach(function (x, q) { plan.push("Место " + (q + 1)); plan.push(nmx(x)); }); plan.push("Сдать места"); }
  return { n: n, ms: ms, vals: G.vals, miss: G.miss, clues: G.clues, ord: G.ord, ps: ps, plan: plan, wrong: rep(mk(0), 3), sol: 1, stages: d === 2 ? 2 : 1,
    ans: { res: G.miss.map(function (k) { return G.vals[k]; }), places: G.ord ? G.ord.slice() : null },
    data: { n: n, vals: G.vals, miss: G.miss, clues: G.clues, ord: G.ord },
    sig: "league|" + d + "|" + JSON.stringify([n, G.vals, G.miss, G.clues.map(function (c) { return [c.t, c.a, c.k]; })]) };
}
function league(seed, cb, opts) {
  var d = diffOf(opts), P = genLeague(seed, d), ps = P.ps, n = P.n, ms = P.ms, stage = 1;
  var cur = P.vals.map(function (v, k) { return P.miss.indexOf(k) >= 0 ? -1 : v; }), place = intList(n).map(function () { return -1; });
  var nm = function (x) { return ps[x].n; };
  var resText = function (k, v) { var m = ms[k], a = ps[m[0]], b = ps[m[1]]; return v === 1 ? a.n + " и " + b.n + " — ничья" : v === 2 ? a.n + " " + gv(a, "выиграл", "выиграла") + " у " + dc(b, "g") : b.n + " " + gv(b, "выиграл", "выиграла") + " у " + dc(a, "g"); };
  var known = []; ms.forEach(function (m, k) { if (P.miss.indexOf(k) < 0) known.push(resText(k, P.vals[k])); });
  var clueText = function (c) {
    var X = c.a >= 0 ? ps[c.a] : null;
    switch (c.t) {
      case "PTS": return X.n + " — " + cnt(c.k, "очко", "очка", "очков", "n");
      case "DRAWS": return c.k === 0 ? "ничьих в турнире не было" : "ничьих в турнире было ровно " + nw(c.k, "f");
      case "NOLOSS": return X.n + " не " + gv(X, "проиграл", "проиграла") + " ни разу";
      case "WINS": return c.k === 0 ? X.n + " не " + gv(X, "выиграл", "выиграла") + " ни одного испытания" : X.n + " " + gv(X, "выиграл", "выиграла") + " ровно " + cnt(c.k, "испытание", "испытания", "испытаний", "n");
    }
    return "";
  };
  var pts = P.clues.filter(function (c) { return c.t === "PTS"; }).map(clueText), notes = P.clues.filter(function (c) { return c.t !== "PTS"; }).map(clueText);
  var rules = "За победу — два очка, за ничью — одно, за поражение — ноль.";
  var placeRule = "При равенстве очков выше тот, кто выиграл личную встречу; если и она — ничья, выше тот, у кого больше побед.";
  var cond = head(opts, d) + "Таблица испытаний. " + cap(COLL[n]) + " испытателей — " + andList(ps.map(function (p) { return p.n; })) + " — прошли круговой турнир на тренажёрах: каждый с каждым по одному испытанию. " + rules +
    " Часть таблицы смыло водой. Уцелели результаты: " + known.join("; ") + ". Итоговые очки: " + pts.join("; ") + "." + (notes.length ? " Ещё записано: " + notes.join("; ") + "." : "") +
    (d === 2 ? " " + stageHead(1, 2) + " Восстановите смытые результаты. Потом — расставить места: " + placeRule : " Восстановите смытые результаты.");
  var allVals = function () { return cur.slice(); };
  var whyNot = function () {
    var v = allVals(), p = lgPts(n, ms, v);
    for (var i = 0; i < P.clues.length; i++) {
      var c = P.clues[i];
      if (lgClue(c, n, ms, v)) continue;
      if (c.t === "PTS") return "Не сходится: у " + dc(ps[c.a], "g") + " тогда выходит " + cnt(p[c.a], "очко", "очка", "очков", "n") + ", а записано " + cnt(c.k, "очко", "очка", "очков", "n") + ".";
      return "Не сходится с записью: «" + clueText(c) + "».";
    }
    return "Не сходится с таблицей.";
  };
  var whyPlace = function () {
    var p = lgPts(n, ms, P.vals), w = lgWins(n, ms, P.vals);
    for (var q = 0; q < n; q++) {
      var x = place[q], y = P.ord[q];
      if (x === y) continue;
      if (p[y] > p[x]) return "Не так: у " + dc(ps[y], "g") + " очков больше, чем у " + dc(ps[x], "g") + ".";
      if (p[y] === p[x]) {
        var k = -1; ms.forEach(function (m, kk) { if ((m[0] === x && m[1] === y) || (m[0] === y && m[1] === x)) k = kk; });
        var hv = P.vals[k];
        if (hv !== 1) return "Не так: очков у " + dc(ps[x], "g") + " и " + dc(ps[y], "g") + " поровну, но личную встречу " + gv(ps[y], "выиграл", "выиграла") + " " + nm(y) + ".";
        return "Не так: очков поровну, личная встреча — ничья, а побед больше у " + dc(ps[y], "g") + ".";
      }
      return "Не так: " + nm(x) + " стоит выше, чем " + gv(ps[x], "ему", "ей") + " положено.";
    }
    return "Не так.";
  };
  var last = start("league", d, P, "Таблица испытаний", cond, function (st, finish, fail) {
    var out = [];
    if (stage === 1) {
      P.miss.forEach(function (k) {
        var m = ms[k];
        out.push(act(function () { return nm(m[0]) + " — " + nm(m[1]) + ": " + (cur[k] < 0 ? "не вписано" : cur[k] === 1 ? "ничья" : "победа " + dc(ps[cur[k] === 2 ? m[0] : m[1]], "g")); }, function () {
          var items = [2, 1, 0].map(function (v) {
            var lab0 = v === 1 ? "Ничья" : gv(ps[v === 2 ? m[0] : m[1]], "Победил ", "Победила ") + nm(v === 2 ? m[0] : m[1]);
            return { label: lab0, fn: function () { cur[k] = v; A("play", "paper_turn"); say(resText(k, v) + "."); } };
          });
          items.push(back("Назад"));
          UIx("menu", nm(m[0]) + " — " + nm(m[1]), items);
        }));
      });
      out.push(info("Уцелевшие результаты", function () { return "Уцелели результаты: " + known.join("; ") + "."; }));
      out.push(info("Очки и записи", function () { return rules + " Итоговые очки: " + pts.join("; ") + "." + (notes.length ? " Ещё записано: " + notes.join("; ") + "." : ""); }));
      out.push(act("Сдать таблицу", function () {
        if (cur.some(function (v) { return v < 0; })) { nope("Впишите все смытые результаты."); return; }
        if (cur.join() === P.vals.join()) {
          if (d === 2) { stage = 2; A("play", "paper_turn"); var p0 = lgPts(n, ms, P.vals); say("Таблица сошлась. " + stageHead(2, 2) + " Места. Очки: " + ps.map(function (q, x) { return q.n + " — " + cnt(p0[x], "очко", "очка", "очков", "n"); }).join("; ") + ". " + placeRule); return; }
          win(last, finish, "Таблица восстановлена: все очки и записи сходятся.", false); return;
        }
        A("play", "term_err"); fail(whyNot());
      }));
      out.push(act("Что сейчас", function () { say(P.miss.map(function (k) { return cur[k] < 0 ? nm(ms[k][0]) + " — " + nm(ms[k][1]) + ": не вписано" : resText(k, cur[k]); }).join("; ") + "."); }));
      return out;
    }
    for (var q = 0; q < n; q++) (function (q) {
      out.push(act(function () { return "Место " + (q + 1) + ": " + (place[q] >= 0 ? nm(place[q]) : "не названо"); }, function () {
        UIx("menu", "Место " + (q + 1), ps.map(function (p, x) {
          return { label: p.n, fn: function () { var was = place.indexOf(x); if (was >= 0) place[was] = -1; place[q] = x; A("play", "term_beep"); say("Место " + (q + 1) + ": " + p.n + "."); } };
        }));
      }));
    })(q);
    out.push(info("Таблица", function () { var p0 = lgPts(n, ms, P.vals); return "Очки: " + ps.map(function (q2, x) { return q2.n + " — " + cnt(p0[x], "очко", "очка", "очков", "n"); }).join("; ") + ". Результаты: " + ms.map(function (m, k) { return resText(k, P.vals[k]); }).join("; ") + ". " + placeRule; }));
    out.push(act("Сдать места", function () {
      if (place.some(function (x) { return x < 0; })) { nope("Назовите всех, на каждое место."); return; }
      if (place.join() === P.ord.join()) { win(last, finish, "Места расставлены верно: первое — у " + dc(ps[P.ord[0]], "g") + ".", false); return; }
      A("play", "term_err"); fail(whyPlace());
    }));
    out.push(act("Что сейчас", function () { say(stageHead(2, 2) + " " + place.map(function (x, q2) { return "место " + (q2 + 1) + " — " + (x >= 0 ? nm(x) : "не названо"); }).join("; ") + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   14. ПОРЯДОК РУБИЛЬНИКОВ
   Узлы пускают по одному; правила щита задают, что после чего. Бросок
   при пуске — пусковой ток узла плюс то, что уже работает. Любой
   порядок по правилам принимается; лучший — с наименьшим самым большим
   броском. Простая — четыре узла; средняя — пять-шесть и запрет «не
   сразу после»; сложная — семь узлов, запреты и предел щита: часть
   порядков по правилам выбьет автомат. Все порядки — перебором.
   ════════════════════════════════════════════════════════════════════ */
var SW_NODES = [{ n: "вентиляция", a: "вентиляцию", g: "вентиляции" }, { n: "насос охлаждения", a: "насос охлаждения", g: "насоса охлаждения" }, { n: "освещение", a: "освещение", g: "освещения" },
  { n: "компрессор", a: "компрессор", g: "компрессора" }, { n: "рация", a: "рацию", g: "рации" }, { n: "подъёмник", a: "подъёмник", g: "подъёмника" },
  { n: "холодильник", a: "холодильник", g: "холодильника" }, { n: "печь", a: "печь", g: "печи" }, { n: "насос откачки", a: "насос откачки", g: "насоса откачки" },
  { n: "фильтры воздуха", a: "фильтры воздуха", g: "фильтров воздуха" }, { n: "водогрей", a: "водогрей", g: "водогрея" }, { n: "дробилка", a: "дробилку", g: "дробилки" },
  { n: "лебёдка", a: "лебёдку", g: "лебёдки" }, { n: "прожектор", a: "прожектор", g: "прожектора" }];
function swPeak(T, ord) { var load = 0, pk = 0; ord.forEach(function (v) { pk = Math.max(pk, load + T.s[v]); load += T.w[v]; }); return pk; }
function swOk(T, ord) {
  var at = []; ord.forEach(function (v, i) { at[v] = i; });
  for (var i = 0; i < T.deps.length; i++) if (at[T.deps[i][0]] > at[T.deps[i][1]]) return false;
  for (i = 0; i < T.nadj.length; i++) if (at[T.nadj[i][0]] === at[T.nadj[i][1]] + 1) return false;
  return !T.lim || swPeak(T, ord) <= T.lim;
}
function genSwitchorder(seed, d) {
  var r = rngFor(seed, "switchorder", d), n = d === 0 ? 4 : d === 1 ? r.int(5, 6) : 7, G = null, i, j;
  for (var at = 0; at < 300 && !G; at++) {
    var H = shuffled(r, intList(n)), deps = [], nadj = [];
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (r.chance(d === 0 ? 0.4 : 0.33)) deps.push([H[i], H[j]]);
    if (deps.length < [2, 4, 5][d] || deps.length > [3, 7, 9][d]) continue;
    var s = intList(n).map(function () { return r.int(4, 16); }), w = intList(n).map(function () { return r.int(1, 6); });
    var T = { n: n, deps: deps, nadj: nadj, s: s, w: w, lim: 0 };
    for (i = 0; i < [0, 1, r.int(1, 2)][d]; i++) { var x = r.int(0, n - 1), y = r.int(0, n - 2); if (y >= x) y++; nadj.push([x, y]); }
    var all = bkAll(n).filter(function (o) { return swOk(T, o); });
    if (d === 2) {
      var pk = all.map(function (o) { return swPeak(T, o); }).sort(function (a, b) { return a - b; }), lim = -1;
      for (i = pk.length - 1; i >= 1 && lim < 0; i--) if (pk[i] > pk[i - 1] && i >= 2) lim = pk[i - 1];
      if (lim < 0) continue;
      T.lim = lim; all = all.filter(function (o) { return swOk(T, o); });
    }
    var lo = [2, 3, 2][d], hi = [8, 40, 60][d];
    if (all.length < lo || all.length > hi) continue;
    var peaks = all.map(function (o) { return swPeak(T, o); }), minP = Math.min.apply(null, peaks);
    var bestO = all.filter(function (o, k) { return peaks[k] === minP; }), worse = all.filter(function (o, k) { return peaks[k] > minP; });
    if (!worse.length) continue;
    var hasPre = intList(n).filter(function (v) { return deps.some(function (dp) { return dp[1] === v; }); });
    if (!hasPre.length) continue;
    G = { T: T, all: all, minP: minP, bestO: bestO, worse: worse, pre: hasPre[0] };
  }
  var nodes = shuffled(r, SW_NODES).slice(0, n), lbl = function (v) { return "Включить " + nodes[v].a; };
  var alts = [{ plan: G.worse[0].map(lbl), best: false }];
  if (G.bestO.length > 1) alts.push({ plan: G.bestO[1].map(lbl), best: true });
  var T2 = G.T;
  return { T: T2, nodes: nodes, minP: G.minP, plan: G.bestO[0].map(lbl), wrong: rep([lbl(G.pre)], 3), alts: alts, variable: true, sol: G.all.length, ans: G.bestO[0].slice(),
    data: { n: T2.n, deps: T2.deps, nadj: T2.nadj, s: T2.s, w: T2.w, lim: T2.lim, minP: G.minP, nvalid: G.all.length },
    sig: "switchorder|" + d + "|" + JSON.stringify([T2.n, T2.deps.map(String).sort(), T2.nadj, T2.s, T2.w, T2.lim]) };
}
function switchorder(seed, cb, opts) {
  var d = diffOf(opts), P = genSwitchorder(seed, d), T = P.T, nodes = P.nodes, n = T.n, on = [], load = 0, peak = 0;
  var kw = function (v) { return cnt(v, "киловатт", "киловатта", "киловатт"); };
  var depText = T.deps.map(function (dp) { return nodes[dp[1]].n + " — только после " + nodes[dp[0]].g; });
  var nadjText = T.nadj.map(function (dp) { return nodes[dp[0]].a + " нельзя пускать сразу после " + nodes[dp[1]].g; });
  var loads = nodes.map(function (nd, v) { return nd.n + " — пуск " + T.s[v] + ", работа " + T.w[v]; });
  var scheme = "Правила щита: " + depText.concat(nadjText).join("; ") + ". Нагрузка в киловаттах: " + loads.join("; ") + "." + (T.lim ? " Щит держит бросок не больше " + kw(T.lim) + "." : "");
  var cond = head(opts, d) + "Порядок рубильников. После обесточки нужно пустить " + cnt(n, "узел", "узла", "узлов") + ": " + andList(nodes.map(function (nd) { return nd.n; })) + ". Узлы пускают по одному. Бросок при пуске — пусковой ток узла плюс то, что уже работает. " + scheme +
    " Нарушите правило — щит выбьет, и всё начнётся сначала. Верных порядков несколько, годится любой; лучший — тот, где самый большой бросок меньше всего.";
  var reset = function () { on = []; load = 0; peak = 0; };
  var last = start("switchorder", d, P, "Порядок рубильников", cond, function (st, finish, fail) {
    var out = [];
    for (var v0 = 0; v0 < n; v0++) (function (v) {
      if (on.indexOf(v) >= 0) return;
      out.push(act("Включить " + nodes[v].a + ": пуск " + T.s[v] + ", работа " + T.w[v], function () {
        var miss = T.deps.filter(function (dp) { return dp[1] === v && on.indexOf(dp[0]) < 0; })[0];
        if (miss) { reset(); A("play", "term_err"); fail("Щит выбило: " + nodes[v].n + " — только после " + nodes[miss[0]].g + ". Все рубильники разомкнуты, начните сначала."); return; }
        var nj = T.nadj.filter(function (dp) { return dp[0] === v && on.length && on[on.length - 1] === dp[1]; })[0];
        if (nj) { reset(); A("play", "term_err"); fail("Щит выбило: " + nodes[v].a + " нельзя пускать сразу после " + nodes[nj[1]].g + ". Все рубильники разомкнуты, начните сначала."); return; }
        var surge = load + T.s[v];
        if (T.lim && surge > T.lim) { reset(); A("play", "term_err"); fail("Сработал автомат щита: бросок " + kw(surge) + ", а щит держит не больше " + kw(T.lim) + ". Все рубильники разомкнуты, начните сначала."); return; }
        on.push(v); load += T.w[v]; peak = Math.max(peak, surge);
        if (on.length === n) { A("play", "power_on"); win(last, finish, "Все узлы под током. Самый большой бросок за пуск — " + kw(peak) + ".", peak === P.minP, "меньшего броска добиться нельзя"); return; }
        A("play", "power_on");
        say("Пущено: " + nodes[v].n + ". Бросок — " + kw(surge) + ", на щите теперь " + kw(load) + ".");
      }));
    })(v0);
    out.push(info("Схема щита", scheme));
    out.push(act("Что сейчас", function () { say(on.length ? "Пущено: " + andList(on.map(function (v) { return nodes[v].n; })) + ". На щите " + kw(load) + ", самый большой бросок пока — " + kw(peak) + "." : "Всё обесточено, ни один узел не пущен."); }));
    out.push(act("Начать заново", function () { reset(); A("play", "term_off"); say("Все рубильники разомкнуты."); }));
    return out;
  }, cb);
}

/* ════════ РЕГИСТРАЦИЯ ════════ */
var KINDS4 = ["testimony", "rollcall", "succession", "mines", "punchtape", "lockers", "rings", "gears", "pendulums", "shunting", "slider", "bunker", "league", "switchorder"];
var NAMES4 = {
  testimony: "показания смены", rollcall: "перекличка", succession: "родословная списков", mines: "минная полоса", punchtape: "перфолента",
  lockers: "пломбы на шкафчиках", rings: "сейф с дисками", gears: "шестерни привода", pendulums: "маятники смены", shunting: "сортировочная горка",
  slider: "пятнашки щита", bunker: "рассадка в бункере", league: "таблица испытаний", switchorder: "порядок рубильников"
};
var GEN = { testimony: genTestimony, rollcall: genRollcall, succession: genSuccession, mines: genMines, punchtape: genPunchtape, lockers: genLockers, rings: genRings,
  gears: genGears, pendulums: genPendulums, shunting: genShunting, slider: genSlider, bunker: genBunker, league: genLeague, switchorder: genSwitchorder };
var UIF = { testimony: testimony, rollcall: rollcall, succession: succession, mines: minesKind, punchtape: punchtape, lockers: lockers, rings: rings,
  gears: gears, pendulums: pendulums, shunting: shunting, slider: slider, bunker: bunker, league: league, switchorder: switchorder };
KINDS4.forEach(function (k) { LAB.puzzles.register(k, NAMES4[k], UIF[k], { diffs: true }); });
function genFull(kind, seed, diff) {
  var g = GEN[kind]; if (!g) return null;
  var d = diffOf({ diff: diff }), P = g(seed || 1, d);
  P.kind = kind; P.d = d;
  return P;
}
/* Проверка ответа без окон: 0 — неверно, 1 — верно, 2 — верно и образцово. */
function solveAns(kind, task, a) {
  var P = task && task.sig && task.kind === kind ? task : genFull(kind, task && task.seed, task && task.diff), d = P.d, i, j;
  if (a == null) return 0;
  switch (kind) {
    case "testimony": return a.c === P.c && (d === 0 || a.L === P.L) ? 1 : 0;
    case "rollcall": return a.abs && a.imp && rcSame({ abs: a.abs, imp: a.imp }, P.truth) ? 1 : 0;
    case "succession": return a.join && a.join() === P.par.join() ? 1 : 0;
    case "punchtape": return JSON.stringify(a) === JSON.stringify(P.grid) ? 1 : 0;
    case "lockers": return JSON.stringify(a) === JSON.stringify(P.pos) ? 1 : 0;
    case "league": return a.res && a.res.join() === P.miss.map(function (k) { return P.vals[k]; }).join() && (d < 2 || (a.places && a.places.join() === P.ord.join())) ? 1 : 0;
    case "pendulums":
      if (a.t !== P.G.ans) return 0;
      if (d < 2) return 1;
      return P.G.valid.indexOf(a.p) < 0 ? 0 : a.p === Math.max.apply(null, P.G.valid) ? 2 : 1;
    case "mines": {
      var R = P.R, C = P.C, N = R * C, num = intList(N).map(function () { return -1; }), cntA = function (x) { return mnNb(R, C, x).filter(function (y) { return P.mine[y]; }).length; };
      P.start.forEach(function (x) { num[x] = cntA(x); });
      for (i = 0; i < a.length; i++) { var x = a[i]; if (num[x] >= 0 || mnExact(R, C, P.M, num).canMine[x]) return 0; num[x] = cntA(x); }
      for (i = 0; i < N; i++) if (!P.mine[i] && num[i] < 0) return 0;
      return 2;
    }
    case "rings": {
      var flat = [].concat.apply([], a), si = 0, S = P.stages[0], s = S.from.slice(), used = 0, clean = true;
      for (i = 0; i < flat.length; i++) {
        if (si >= P.stages.length) return 0;
        s = rgStep(s, flat[i], P.R); used++;
        if (s.join() === S.to.join()) { if (used !== S.min) clean = false; si++; if (si < P.stages.length) { S = P.stages[si]; used = 0; } continue; }
        if (used >= S.limit) return 0;
      }
      return si === P.stages.length ? (clean ? 2 : 1) : 0;
    }
    case "gears": {
      var G = P.G, fill = a.fill || [], idl = a.idl || [];
      if (fill.length !== G.nslots || idl.length !== G.sock.length) return 0;
      var box = G.box.slice(); for (i = 0; i < fill.length; i++) { j = box.indexOf(fill[i]); if (j < 0) return 0; box.splice(j, 1); }
      var ev = grEval(G, fill, idl);
      if (G.vmax && ev.sp[G.vshaft].num > G.vmax * ev.sp[G.vshaft].den) return 0;
      if (ev.num !== G.X * ev.den || ev.dir !== G.D) return 0;
      var sum = fill.reduce(function (p, q) { return p + q; }, 0), ni = idl.filter(Boolean).length;
      return d > 0 && sum === G.V.minSum && ni === G.V.minIdl ? 2 : 1;
    }
    case "shunting": {
      var T = P.T, st = { i: 0, st: [], qu: [], out: 0 };
      if (a.length > P.limit) return 0;
      for (i = 0; i < a.length; i++) { var res = shApply(T, st, a[i]); if (!res.s) return 0; st = res.s; }
      return st.out === T.grp.length ? (a.length === P.min ? 2 : 1) : 0;
    }
    case "slider": {
      var sl = P.start.slice(), Cc = P.C;
      if (a.length > P.limit) return 0;
      for (i = 0; i < a.length; i++) { var b = sl.indexOf(0), p = sl.indexOf(a[i]); if (p < 0 || !(Math.abs(b - p) === Cc || (Math.abs(b - p) === 1 && Math.floor(b / Cc) === Math.floor(p / Cc)))) return 0; sl[b] = a[i]; sl[p] = 0; if (sl.join() === P.goal.join() && i < a.length - 1) return 0; }
      return sl.join() === P.goal.join() ? (a.length === P.min ? 2 : 1) : 0;
    }
    case "bunker": {
      var n = P.n, row = a.row;
      if (!row || !P.conds.every(function (c) { return bkTrue(c, row, n, false, null); })) return 0;
      if (d < 2) return bkTrue(P.wish, row, n, false, null) ? 2 : 1;
      var tab = a.table;
      if (!tab || !P.conds2.every(function (c) { return bkTrue(c, tab, n, true, row); })) return 0;
      return bkTrue(P.wish, tab, n, true, row) ? 2 : 1;
    }
    case "switchorder": {
      var T2 = P.T;
      if (!a.length || a.length !== T2.n || !swOk(T2, a)) return 0;
      return swPeak(T2, a) === P.minP ? 2 : 1;
    }
  }
  return 0;
}
LAB.puzzles4 = {
  kinds: KINDS4.slice(), names: NAMES4, match: match,
  plan: function (kind, seed, diff) { var P = genFull(kind, seed, diff); return P ? P.plan.slice() : null; },
  sig: function (kind, seed, diff) { var P = genFull(kind, seed, diff); return P ? P.sig : null; },
  gen: genFull,
  solve: function (kind, task, answer) { if (!GEN[kind]) return 0; try { return solveAns(kind, task, answer); } catch (e) { return 0; } },
  _mnExact: mnExact, _scCount: scCount, _lkCount: lkCount, _ptLines: ptLines, _slBi: slBi, _tsWorlds: tsWorlds, _rcHyps: rcHyps, _rcTrue: rcTrue,
  _bkTrue: bkTrue, _lgClue: lgClue, _lgOrder: lgOrder, _grEval: grEval, _rgStep: rgStep, _shApply: shApply, _swOk: swOk, _swPeak: swPeak, _num: nw
};
})();
