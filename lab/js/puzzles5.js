/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — логические замки, часть пятая (5.0):
   числа, мера и вариативные решения. Четырнадцать видов задач из жизни
   комплекса, у каждой три ступени (opts.diff: 0 — простая, 1 — средняя,
   2 — сложная): аварийная мощность, разменная касса, укладка контейнера,
   резисторная цепь, частоты узлов, маршрут обхода, клапаны давления,
   смесь по пропорции, делёж пайков, магический щит, расстановка ламп,
   трубопровод, отражатели, наряды бригад.
   У каждой задачи несколько верных решений: принимается любое верное
   (проверяется сам ответ, а не сходство с одним планом), а лучшее —
   короче, дешевле, ровнее — отмечается в итоговой фразе словами
   «Образцовое решение» и в LAB.puzzles._last.best = true. Сколько верных
   решений — в _last.sol (где их больше 999, счёт останавливается на 999:
   «не меньше»). Сложная смесь и сложная резисторная цепь — в два этапа:
   итог первого этапа нужен второму, этапы объявляются.
   Всё — окнами меню, условие можно переслушать, текущее положение — в
   пунктах и в пункте «Что сейчас» (или похожем). Подключается после
   puzzles.js (окно условия и три попытки — его run); виды регистрируются
   через LAB.puzzles.register.
   Генераторы — чистые функции зерна и сложности (без окон и без
   Math.random), каждая задача — меньше миллисекунды на компьютере.
   Для проверок: LAB.puzzles._last = { kind, diff, plan, wrong, alts,
   altBest, answers, sol, best, stage, stages, data, sig, cond, st };
   plan — начала надписей пунктов, которые решают задачу образцово из
   главного окна (после окна условия); alts — несколько разных верных
   решений тем же способом (alts[0] — образцовое), altBest[k] — образцово
   ли решение k; wrong[k] — путь, который тратит одну попытку.
   LAB.puzzles5 = { kinds, names, plan(вид, зерно, ступень), sig(...),
   gen(...), solve(вид, задача, ответ), match } — план без окон,
   каноническая подпись содержания задачи (одна подпись — одна задача) и
   проверка ответа: задача — то, что вернул gen (или { seed, diff }),
   ответ — в своей для вида записи (её примеры — в gen(...).answers);
   solve отвечает { ok, best, why }.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
if (!LAB || !LAB.puzzles || !LAB.puzzles.register || !LAB.puzzles.util) {
  if (typeof console !== "undefined") console.warn("puzzles5.js: сначала нужен puzzles.js");
  return;
}
var U = LAB.puzzles.util, run = U.run, pl = U.pl, say = U.say, sayq = U.sayq, UIx = U.UIx, A = U.A;

/* ════════ ОБЩЕЕ ════════ */
var HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
var LETTER = /[0-9A-Za-zА-Яа-яЁё]/;
var CAPN = 999; /* потолок счёта решений */
var NW = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать", "двадцать"];
var ORDM = ["нулевой", "первый", "второй", "третий", "четвёртый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый"];
var ORDF = ["нулевая", "первая", "вторая", "третья", "четвёртая", "пятая", "шестая", "седьмая", "восьмая", "девятая", "десятая"];
var GENW = ["ноля", "одного", "двух", "трёх", "четырёх", "пяти", "шести", "семи", "восьми", "девяти", "десяти"];
var DIRN = ["север", "восток", "юг", "запад"];
var DIRA = ["на север", "на восток", "на юг", "на запад"];
var DIRF = ["с севера", "с востока", "с юга", "с запада"];
var DIRADJ = ["северной", "восточной", "южной", "западной"];
var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
function diffOf(opts) {
  var d = opts && opts.diff != null ? Math.floor(Number(opts.diff)) : 1;
  if (!(d >= 0)) return d < 0 ? 0 : 1;
  return d > 2 ? 2 : d;
}
function rngFor(seed, kind, d, salt) { return U.rng(seed, "p5:" + kind + ":" + d + (salt != null ? ":" + salt : "")); }
function head(opts, d) { return (opts && opts.title ? opts.title + ". " : "") + HEADS[d] + " "; }
function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { s = String(s); return s.charAt(0).toLowerCase() + s.slice(1); }
function andList(arr) { arr = arr.map(String); if (arr.length < 2) return arr.join(""); return arr.slice(0, -1).join(", ") + " и " + arr[arr.length - 1]; }
function nw(n, g) {
  if (n !== Math.floor(n) || n < 0 || n > 20) return String(n);
  if (g === "f") { if (n === 1) return "одна"; if (n === 2) return "две"; }
  if (g === "n" && n === 1) return "одно";
  return NW[n];
}
function cnt(n, g, one, few, many) { return nw(n, g) + " " + pl(n, one, few, many); }
function nope(t) { A("play", "code_fail"); say(t); }
function act(label, fn) { return { label: label, keep: true, fn: fn }; }
function pick(label, fn) { return { label: label, fn: fn }; }
function backItem(label) { return { label: label || "Назад", close: true, fn: function () {} }; }
function intList(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
function popcount(x) { var c = 0; x = x >>> 0; while (x) { c += x & 1; x >>>= 1; } return c; }
function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
function sl(a) { return a.slice(); }
function rep(x, n) { var o = []; for (var i = 0; i < n; i++) o.push(x); return o; }
function match(label, prefix) {
  label = String(label); prefix = String(prefix);
  if (label.indexOf(prefix) !== 0) return false;
  return label.length === prefix.length || !LETTER.test(label.charAt(prefix.length));
}
/* окно поверх главного: прежнее подменю закрывается молча, новое открывается */
function swapMenu(title, items) { UIx("closeTop", true); UIx("menu", title, items); }
function closeSub() { UIx("closeTop", true); }
/* короткий тон синтезатора (как в мини-играх); без звука — молча */
function tone(f, dur, when) {
  var S = LAB.Sound;
  if (!S || typeof S.tone !== "function") return;
  try { S.tone(f, dur || 0.2, { type: "triangle", vol: 0.15, when: when || 0, attack: 0.015, hold: true, force: true, bus: "puzzle", prio: 4 }); } catch (e) { /* */ }
}
function stageText(k, of) { return "Этап " + ORDM[k] + " из " + GENW[of]; }
/* Запуск: запомнить план и решения для проверок и открыть окно условия (run из puzzles.js). */
function start(kind, d, P, title, cond, build, cb) {
  var last = LAB.puzzles._last = { kind: kind, diff: d, plan: P.plan.slice(), wrong: P.wrong.map(sl), alts: (P.alts || [P.plan]).map(sl),
    altBest: (P.altBest || [true]).slice(), answers: P.answers || null, sol: P.sol == null ? 1 : P.sol, best: false, stage: 1, stages: P.stages || 1,
    data: P.data || null, sig: P.sig, cond: cond, st: null };
  last.st = run(title, cond, build, cb);
  return last;
}
/* верное решение: образцовое или просто верное (и что было бы образцовым) */
function win(last, finish, text, best, note) {
  last.best = !!best;
  A("play", "code_ok");
  finish(true, text + " " + (best ? "Образцовое решение." : "Решение верное, но не образцовое: " + note + "."));
}
/* число со знаком словами для речи: «минус 3» */
function sgn(v) { return v < 0 ? "минус " + (-v) : "плюс " + v; }
/* выбор k разных номеров из n */
function choose(r, n, k) { var a = intList(n); r.shuffle(a); return a.slice(0, k); }
/* ступени по сетке: «ряд 2, клетка 3» */
function rc(r, c) { return "ряд " + (r + 1) + ", клетка " + (c + 1); }

/* ════════════════════════════════════════════════════════════════════
   1. АВАРИЙНАЯ МОЩНОСТЬ
   Блоки питания показывают числа; сумматор соединяет два числа знаком
   (плюс, минус, умножить, разделить) — вместо них на столе остаётся
   связка. Нужное число подают на шину. Простая — четыре блока, без
   деления; средняя — четыре блока и деление нацело; сложная — пять
   блоков, шина держит не больше 100, сумматор делает три соединения
   подряд, и один блок обязателен (без него — ловушка: число верное, а
   насос не запустится). Решение — формула; одинаковые формулы (с
   точностью до перестановок и скобок при сложении и умножении) — одно
   решение. Образцовое — с наименьшим числом соединений.
   ════════════════════════════════════════════════════════════════════ */
var BLK = ["А", "Б", "В", "Г", "Д"];
var POW_LBL = { "+": "Плюс", "-": "Минус", "*": "Умножить", "/": "Разделить" };
var POW_SAY = { "+": "плюс", "-": "минус", "*": "умножить на", "/": "разделить на" };
function kw(v) { return pl(v, "киловатт", "киловатта", "киловатт"); }
/* узел формулы: v — число, t — вид («n» блок, «s» сумма, «p» произведение), key — канонический
   вид: суммы и произведения раскрыты, слагаемые и множители упорядочены */
function pwLeaf(i, v) { return { v: v, t: "n", key: String(v), mask: 1 << i, ops: 0, leaf: i, a: null, b: null, op: "", P: null, M: null }; }
function pwRaw(x, y, op) { return op === "+" ? x + y : op === "-" ? x - y : op === "*" ? x * y : x / y; }
function pwComb(x, y, op, capv) {
  var v;
  if (op === "+") v = x.v + y.v;
  else if (op === "-") { if (x.v <= y.v) return null; v = x.v - y.v; }
  else if (op === "*") v = x.v * y.v;
  else { if (x.v % y.v) return null; v = x.v / y.v; }
  if (v > capv) return null;
  var z = { v: v, t: "", key: "", mask: x.mask | y.mask, ops: x.ops + y.ops + 1, leaf: -1, a: x, b: y, op: op, P: null, M: null };
  var lin = op === "+" || op === "-", tt = lin ? "s" : "p";
  var P = (x.t === tt ? x.P : [x.key]).slice(), M = (x.t === tt ? x.M : []).slice();
  var yP = y.t === tt ? y.P : [y.key], yM = y.t === tt ? y.M : [];
  if (op === "+" || op === "*") { P = P.concat(yP); M = M.concat(yM); } else { P = P.concat(yM); M = M.concat(yP); }
  P.sort(); M.sort();
  z.t = tt; z.P = P; z.M = M;
  z.key = lin ? "(" + P.join("+") + (M.length ? "-" + M.join("-") : "") + ")" : "[" + P.join("*") + (M.length ? "/" + M.join("/") : "") + "]";
  return z;
}
/* все формулы на наборах блоков до maxL штук (с ключами), по маскам */
function pwLevels(vals, ops, capv, maxL) {
  var n = vals.length, E = {}, i, masks = [];
  for (i = 0; i < n; i++) E[1 << i] = [pwLeaf(i, vals[i])];
  for (var m = 1; m < (1 << n); m++) { var pc = popcount(m); if (pc >= 2 && pc <= maxL) masks.push(m); }
  masks.sort(function (a, b) { return popcount(a) - popcount(b) || a - b; });
  masks.forEach(function (mk) {
    var seen = {}, out = [];
    var add = function (z) { if (z && !seen[z.key]) { seen[z.key] = 1; out.push(z); } };
    for (var sa = (mk - 1) & mk; sa > 0; sa = (sa - 1) & mk) {
      var sb = mk ^ sa; if (sa > sb) continue;
      var XA = E[sa], XB = E[sb];
      for (var p = 0; p < XA.length; p++) for (var q = 0; q < XB.length; q++) for (var o = 0; o < ops.length; o++) {
        add(pwComb(XA[p], XB[q], ops[o], capv));
        if (ops[o] === "-" || ops[o] === "/") add(pwComb(XB[q], XA[p], ops[o], capv));
      }
    }
    E[mk] = out;
  });
  return E;
}
/* верхний ярус (ровно top блоков): только числа, формулы — по запросу */
function pwTopEach(E, n, top, ops, capv, mustBit, fn) {
  for (var mk = 1; mk < (1 << n); mk++) {
    if (popcount(mk) !== top || (mustBit && !(mk & mustBit))) continue;
    for (var sa = (mk - 1) & mk; sa > 0; sa = (sa - 1) & mk) {
      var sb = mk ^ sa; if (sa > sb) continue;
      var XA = E[sa], XB = E[sb];
      for (var p = 0; p < XA.length; p++) for (var q = 0; q < XB.length; q++) {
        var x = XA[p], y = XB[q];
        for (var o = 0; o < ops.length; o++) {
          var op = ops[o];
          if (op === "+") { if (x.v + y.v <= capv) fn(x, y, op, x.v + y.v); }
          else if (op === "*") { if (x.v * y.v <= capv) fn(x, y, op, x.v * y.v); }
          else if (op === "-") { if (x.v > y.v) fn(x, y, op, x.v - y.v); else if (y.v > x.v) fn(y, x, op, y.v - x.v); }
          else { if (x.v % y.v === 0) fn(x, y, op, x.v / y.v); if (y.v % x.v === 0) fn(y, x, op, y.v / x.v); }
        }
      }
    }
  }
}
function pwSolutions(E, n, ops, capv, mustBit, T) {
  var seen = {}, list = [], mk;
  for (mk in E) {
    var m = +mk;
    if (popcount(m) < 2 || (mustBit && !(m & mustBit))) continue;
    E[mk].forEach(function (x) { if (x.v === T && !seen[x.key]) { seen[x.key] = 1; list.push(x); } });
  }
  pwTopEach(E, n, 4, ops, capv, mustBit, function (x, y, op, v) {
    if (v !== T) return;
    var z = pwComb(x, y, op, capv);
    if (z && !seen[z.key]) { seen[z.key] = 1; list.push(z); }
  });
  return list;
}
/* формула → путь по пунктам меню и ответ в записи solve */
function pwPath(root) {
  var path = [], steps = [], k = 0;
  var walk = function (x) {
    if (x.leaf >= 0) return { nm: "Блок " + BLK[x.leaf], ref: "b" + x.leaf };
    var a = walk(x.a), b = walk(x.b);
    k++; path.push("Соединить", a.nm, POW_LBL[x.op], b.nm); steps.push([a.ref, x.op, b.ref]);
    return { nm: "Связка " + k, ref: "s" + (k - 1) };
  };
  var R = walk(root); path.push("Подать на шину", R.nm);
  return { path: path, answer: { steps: steps, submit: R.ref } };
}
function genPower(seed, d, depth) {
  var r = rngFor(seed, "power", d), n = d === 2 ? 5 : 4, ops = d === 0 ? ["+", "-", "*"] : ["+", "-", "*", "/"];
  var capv = d === 2 ? 100 : 999, hi = [9, 12, 15][d], tLo = 10, tHi = [99, 150, 100][d];
  var vals = [], must = -1, mustBit = 0, T = 0, sols = null, guard, i;
  for (guard = 0; guard < 200 && !sols; guard++) {
    vals = []; for (i = 0; i < n; i++) vals.push(r.int(2, hi));
    must = -1; mustBit = 0;
    if (d === 2) {
      var uniq = intList(n).filter(function (k) { return vals.filter(function (v) { return v === vals[k]; }).length === 1; });
      if (!uniq.length) continue;
      must = r.pick(uniq); mustBit = 1 << must;
    }
    var E = pwLevels(vals, ops, capv, 3), easy = {}, low3 = {}, trap = {}, top = {}, mk;
    for (mk in E) {
      var m = +mk, pc = popcount(m), okm = !mustBit || (m & mustBit);
      for (var e = 0; e < E[mk].length; e++) {
        var x = E[mk][e];
        if (pc <= 2 && okm) easy[x.v] = 1;
        if (pc === 3 && okm) low3[x.v] = (low3[x.v] || 0) + 1;
        if (mustBit && !okm && pc >= 2) trap[x.v] = 1;
      }
    }
    pwTopEach(E, n, 4, ops, capv, mustBit, function (x, y, op, v) { top[v] = (top[v] || 0) + 1; });
    var blockVal = {}; vals.forEach(function (v) { blockVal[v] = 1; });
    var all = [], pref = [], v;
    for (v = tLo; v <= tHi; v++) {
      if (easy[v] || blockVal[v]) continue;
      var c3 = low3[v] || 0, c4 = top[v] || 0;
      if (c3 + c4 < 2) continue;
      all.push(v);
      if (c3 >= 1 && c4 >= 1 && (!mustBit || trap[v])) pref.push(v);
    }
    var pool = pref.length && r.chance(0.75) ? pref : all;
    for (var tries = 0; tries < 6 && pool.length; tries++) {
      var ti = r.int(0, pool.length - 1), t = pool[ti];
      var list = pwSolutions(E, n, ops, capv, mustBit, t);
      if (list.length >= 2) { T = t; sols = list; break; }
      pool = pool.slice(0, ti).concat(pool.slice(ti + 1));
    }
  }
  if (!sols) return genPower(seed + 7919, d, (depth || 0) + 1);
  var minOps = 9; sols.forEach(function (x) { if (x.ops < minOps) minOps = x.ops; });
  var bestL = sols.filter(function (x) { return x.ops === minOps; }), other = sols.filter(function (x) { return x.ops !== minOps; });
  r.shuffle(bestL); r.shuffle(other);
  var altN = [bestL[0]].concat(other.length ? [other[0]] : [bestL[1]]);
  if (other.length > 1 && bestL.length > 1) altN.push(bestL[1]);
  var built = altN.map(pwPath);
  var wrong = [0, 1, 2].map(function (k) { return ["Разъединить всё", "Подать на шину", "Блок " + BLK[k]]; });
  var sorted = vals.slice().sort(function (a, b) { return a - b; });
  return { plan: built[0].path, alts: built.map(function (b) { return b.path; }), altBest: altN.map(function (x) { return x.ops === minOps; }),
    answers: built.map(function (b) { return b.answer; }), wrong: wrong, sol: Math.min(CAPN, sols.length),
    sig: "power|" + d + "|" + sorted.join(",") + "|" + T + (must >= 0 ? "|" + vals[must] : ""),
    data: { vals: vals, T: T, ops: ops, cap: capv, must: must, maxSteps: d === 2 ? 3 : 0, minOps: minOps, sol: Math.min(CAPN, sols.length), keys: sols.map(function (x) { return x.key; }).sort() } };
}
function checkPower(P, ans) {
  var D = P.data, parts = {}, gone = {}, i, made = 0;
  if (!ans || !ans.steps || ans.submit == null) return { ok: false, best: false, why: "нет ответа" };
  for (i = 0; i < D.vals.length; i++) parts["b" + i] = pwLeaf(i, D.vals[i]);
  if (D.maxSteps && ans.steps.length > D.maxSteps) return { ok: false, best: false, why: "соединений больше, чем делает сумматор" };
  for (i = 0; i < ans.steps.length; i++) {
    var s = ans.steps[i], a = parts[s[0]], b = parts[s[2]];
    if (!a || !b || a === b || gone[s[0]] || gone[s[2]] || D.ops.indexOf(s[1]) < 0) return { ok: false, best: false, why: "соединение " + (i + 1) + " невозможно" };
    var z = pwComb(a, b, s[1], D.cap);
    if (!z) return { ok: false, best: false, why: "соединение " + (i + 1) + " сумматор не делает" };
    gone[s[0]] = gone[s[2]] = 1; parts["s" + made] = z; made++;
  }
  var x = parts[ans.submit];
  if (!x || gone[ans.submit]) return { ok: false, best: false, why: "на шину нечего подать" };
  if (x.v !== D.T) return { ok: false, best: false, why: "на шине " + x.v + ", а нужно " + D.T };
  if (D.must >= 0 && !(x.mask & (1 << D.must))) return { ok: false, best: false, why: "нет обязательного блока" };
  return { ok: true, best: x.ops === D.minOps, why: "", key: x.key };
}
function power(seed, cb, opts) {
  var d = diffOf(opts), P = genPower(seed, d), D = P.data, n = D.vals.length;
  var parts = [], made = 0, used = 0;
  var reset = function () { parts = D.vals.map(function (v, i) { var x = pwLeaf(i, v); x.name = "блок " + BLK[i]; return x; }); made = 0; used = 0; };
  reset();
  var label = function (x) { return cap(x.name) + ": " + x.v + " " + kw(x.v); };
  var table = function () { return parts.map(function (x) { return x.name + " — " + x.v; }).join(", "); };
  var listTxt = D.vals.map(function (v, i) { return "блок " + BLK[i] + " — " + v + (i ? "" : " " + kw(v)); });
  var signs = d === 0 ? "плюс, минус или умножить" : "плюс, минус, умножить или разделить";
  var cond = head(opts, d) + "Аварийная мощность. Насосу аварийной откачки нужно ровно " + D.T + " " + kw(D.T) + ". На щите " + cnt(n, "m", "блок", "блока", "блоков") +
    " питания: " + andList(listTxt) + ". Сумматор соединяет два числа знаком — " + signs + ", — и вместо них на столе остаётся одно новое число, связка; её тоже можно соединять дальше. Минус — только из большего меньшее" +
    (d === 0 ? "" : ", делить — только нацело") + ". Задействовать все блоки не обязательно. Получив нужное число, подайте его на шину." +
    /* (после 4.5, нелогичность) предел шины назван на всех ступенях: на простой и средней сумматор
       тоже не собирает больше 999 и говорит об этом, а в условии предела не было */
    " Шина держит не больше " + D.cap + " " + kw(D.cap) + ": больше сумматор не соберёт." +
    (d === 2 ? " Сумматор делает не больше трёх соединений подряд, потом его надо разрядить — разъединить всё. Блок " + BLK[D.must] + " обязателен: через него идёт защита насоса, без него запуск не засчитают." : "") +
    " Решений несколько, годится любое; образцовое — с наименьшим числом соединений.";
  var last = start("power", d, P, "Аварийная мощность", cond, function (st, finish, fail) {
    var listOf = function (arr, fn) { var items = arr.map(function (x) { return pick(label(x), function () { fn(x); }); }); items.push(backItem()); return items; };
    var combine = function (x, op, y) {
      var z = pwComb(x, y, op, D.cap);
      if (!z) {
        var raw = pwRaw(x.v, y.v, op);
        if (op === "-") nope("Из " + x.v + " нельзя вычесть " + y.v + ": мощность не бывает нулевой или меньше нуля. Ничего не соединено.");
        else if (op === "/") nope(x.v + " на " + y.v + " нацело не делится. Ничего не соединено.");
        else nope("Вышло бы " + raw + " " + kw(raw) + ", а шина держит не больше " + D.cap + ". Ничего не соединено.");
        return;
      }
      made++; used++;
      z.name = "связка " + made;
      parts = parts.filter(function (p) { return p !== x && p !== y; }); parts.push(z);
      A("play", "term_beep"); tone(220 + Math.min(z.v, 300) * 3, 0.25);
      say(cap(z.name) + ": " + x.v + " " + POW_SAY[op] + " " + y.v + " — " + z.v + " " + kw(z.v) + ". На столе: " + table() + "." + (D.maxSteps ? " Соединений осталось " + (D.maxSteps - used) + "." : ""));
    };
    var submit = function (x) {
      if (x.v !== D.T) { A("play", "term_err"); fail("На шину ушло " + x.v + " " + kw(x.v) + ", а насосу нужно " + D.T + ". Защита сбросила нагрузку."); return; }
      if (D.must >= 0 && !(x.mask & (1 << D.must))) { A("play", "term_err"); fail("Мощность верная, но блок " + BLK[D.must] + " в ней не участвует, а без него защита насоса не даст запуска."); return; }
      A("play", "power_on");
      win(last, finish, "Шина приняла ровно " + D.T + " " + kw(D.T) + ", " + cnt(x.ops, "n", "соединение", "соединения", "соединений") + ". Насос загудел.", x.ops === D.minOps,
        "хватило бы " + GENW[D.minOps] + " " + (D.minOps === 1 ? "соединения" : "соединений"));
    };
    return [
      act(function () { return "Соединить два числа" + (D.maxSteps ? ": соединений осталось " + (D.maxSteps - used) + " из " + D.maxSteps : ""); }, function () {
        if (parts.length < 2) { nope("Соединять нечего: на столе одно число. Подайте его на шину или разъедините всё."); return; }
        if (D.maxSteps && used >= D.maxSteps) { nope("Сумматор сделал три соединения и греется: разъедините всё, тогда соединять можно снова."); return; }
        UIx("menu", "Первое число", listOf(parts, function (x) {
          var sg = D.ops.map(function (op) {
            return pick(POW_LBL[op], function () {
              swapMenu("Второе число", listOf(parts.filter(function (y) { return y !== x; }), function (y) { closeSub(); combine(x, op, y); }));
            });
          });
          sg.push(backItem());
          swapMenu("Знак", sg);
        }));
      }),
      act("Подать на шину", function () { UIx("menu", "Что подать на шину", listOf(parts, function (x) { closeSub(); submit(x); })); }),
      act(function () { return "Что сейчас: на столе " + cnt(parts.length, "n", "число", "числа", "чисел"); }, function () {
        say("На столе: " + table() + ". Нужно ровно " + D.T + " " + kw(D.T) + "." + (D.maxSteps ? " Соединений осталось " + (D.maxSteps - used) + " из " + D.maxSteps + "." : "") + (D.must >= 0 ? " Блок " + BLK[D.must] + " обязателен." : ""));
      }),
      act("Разъединить всё", function () {
        if (!made) { say("Всё и так разъединено. На столе: " + table() + "."); return; }
        reset(); A("play", "term_off"); say("Всё разъединено, сумматор разряжен. На столе: " + table() + ".");
      })
    ];
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   2. РАЗМЕННАЯ КАССА
   Выдать ровно нужную сумму жетонами ограниченного запаса. Простая —
   три номинала; средняя — четыре «неудобных» номинала, где жадный
   способ (сначала крупные) подводит; сложная — расплатиться своими
   жетонами и взять сдачу из кассы: через руки должно пройти как можно
   меньше жетонов. Образцовое — меньше всего жетонов. Расчёт, где один
   номинал и отдан, и взят сдачей, тоже верный, но в счёт решений (sol)
   не идёт: это то же решение с лишним обменом.
   ════════════════════════════════════════════════════════════════════ */
function gcnt(n, g1, g2) { return (n <= 10 ? GENW[n] : String(n)) + " " + (n % 10 === 1 && n % 100 !== 11 ? g1 : g2); }
function cr(v) { return pl(v, "кредит", "кредита", "кредитов"); }
function crPo(v) { return pl(v, "кредиту", "кредита", "кредитов"); }
function tillVecs(dens, stock) {
  var out = [], x = dens.map(function () { return 0; });
  var rec = function (i, s, c) {
    if (i === dens.length) { out.push({ x: x.slice(), s: s, c: c }); return; }
    for (var k = 0; k <= stock[i]; k++) { x[i] = k; rec(i + 1, s + k * dens[i], c + k); }
    x[i] = 0;
  };
  rec(0, 0, 0);
  return out;
}
function tillGreedy(dens, stock, S) {
  var rem = S, c = 0;
  for (var i = dens.length - 1; i >= 0; i--) { var t = Math.min(stock[i], Math.floor(rem / dens[i])); rem -= t * dens[i]; c += t; }
  return rem ? -1 : c;
}
function tillKey(sol) { return sol.pay ? sol.pay.join(",") + "/" + sol.chg.join(",") : sol.x.join(","); }
function genTill(seed, d, depth) {
  var r = rngFor(seed, "till", d), guard, i;
  var dens = [], stock = [], dens2 = [], stock2 = [], S = 0, sols = null;
  for (guard = 0; guard < 300 && !sols; guard++) {
    if (d < 2) {
      var k = d === 0 ? 3 : 4, pool = intList(d === 0 ? 10 : 15).map(function (v) { return v + 1; });
      r.shuffle(pool); dens = pool.slice(0, k).sort(function (a, b) { return a - b; });
      stock = dens.map(function () { return d === 0 ? r.int(2, 5) : r.int(1, 4); });
      var vecs = tillVecs(dens, stock), by = {};
      vecs.forEach(function (v) { if (v.c) (by[v.s] = by[v.s] || []).push(v); });
      var lo = d === 0 ? 8 : 12, hi = d === 0 ? 30 : 45, all = [], pref = [];
      for (var s = lo; s <= hi; s++) {
        var L = by[s]; if (!L || L.length < 2 || L.length > (d === 0 ? 8 : 10) || dens.indexOf(s) >= 0) continue;
        var mn = Math.min.apply(null, L.map(function (v) { return v.c; }));
        if (mn < (d === 0 ? 2 : 3)) continue;
        all.push(s);
        var g = tillGreedy(dens, stock, s);
        if (g < 0 || g > mn) pref.push(s);
      }
      var src = d === 1 && pref.length ? pref : (pref.length && r.chance(0.4) ? pref : all);
      if (!src.length) continue;
      S = r.pick(src); sols = by[S].map(function (v) { return { x: v.x, c: v.c }; });
    } else {
      var pp = intList(17).map(function (v) { return v + 4; }); r.shuffle(pp);
      dens = pp.slice(0, 3).sort(function (a, b) { return a - b; }); stock = dens.map(function () { return r.int(1, 3); });
      var rp = intList(9).map(function (v) { return v + 1; }); r.shuffle(rp);
      dens2 = rp.slice(0, 3).sort(function (a, b) { return a - b; }); stock2 = dens2.map(function () { return r.int(1, 4); });
      var pays = tillVecs(dens, stock).filter(function (v) { return v.c > 0; }), chgs = tillVecs(dens2, stock2), byC = {};
      chgs.forEach(function (v) { (byC[v.s] = byC[v.s] || []).push(v); });
      S = r.int(7, 40);
      if (dens.indexOf(S) >= 0) continue;
      var list = [], direct = 99;
      pays.forEach(function (p) {
        var need = p.s - S; if (need < 0) return;
        (byC[need] || []).forEach(function (c) {
          var clash = false;
          for (var a = 0; a < dens.length; a++) if (p.x[a]) for (var b = 0; b < dens2.length; b++) if (c.x[b] && dens2[b] === dens[a]) clash = true;
          if (clash) return;
          list.push({ pay: p.x, chg: c.x, c: p.c + c.c });
          if (!c.c && p.c < direct) direct = p.c;
        });
      });
      if (list.length < 2 || list.length > 14) continue;
      var mn2 = Math.min.apply(null, list.map(function (v) { return v.c; }));
      if (mn2 < 2) continue;
      if (direct <= mn2 && r.chance(0.8)) continue; /* ловушка: без сдачи выходит хуже или не выходит вовсе */
      sols = list;
    }
  }
  if (!sols) return genTill(seed + 7919, d, (depth || 0) + 1);
  var minC = Math.min.apply(null, sols.map(function (v) { return v.c; }));
  var best = sols.filter(function (v) { return v.c === minC; }), other = sols.filter(function (v) { return v.c !== minC; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (v) {
    var p = [], j, t;
    if (d < 2) { for (j = 0; j < dens.length; j++) for (t = 0; t < v.x[j]; t++) p.push("Жетон " + dens[j]); p.push("Выдать"); return p; }
    if (sum(v.pay)) { p.push("Отдать в кассу"); for (j = 0; j < dens.length; j++) for (t = 0; t < v.pay[j]; t++) p.push("Жетон " + dens[j]); p.push("Готово"); }
    if (sum(v.chg)) { p.push("Взять сдачу"); for (j = 0; j < dens2.length; j++) for (t = 0; t < v.chg[j]; t++) p.push("Жетон " + dens2[j]); p.push("Готово"); }
    p.push("Расплатиться"); return p;
  };
  var alts = altS.map(pathOf);
  var wrong = d < 2 ? [0, 1, 2].map(function (j) { return ["Начать заново", "Жетон " + dens[j], "Выдать"]; }) :
    [0, 1, 2].map(function (j) { return ["Начать заново", "Отдать в кассу", "Жетон " + dens[j], "Готово", "Расплатиться"]; });
  var sigOf = function (ds, st) { return ds.map(function (v, j) { return v + "x" + st[j]; }).join(","); };
  return { plan: alts[0], alts: alts, altBest: altS.map(function (v) { return v.c === minC; }),
    answers: altS.map(function (v) { return d < 2 ? { give: v.x.slice() } : { pay: v.pay.slice(), change: v.chg.slice() }; }),
    wrong: wrong, sol: Math.min(CAPN, sols.length),
    sig: "till|" + d + "|" + sigOf(dens, stock) + (d === 2 ? "|" + sigOf(dens2, stock2) : "") + "|" + S,
    data: { dens: dens, stock: stock, dens2: dens2, stock2: stock2, S: S, min: minC, sol: Math.min(CAPN, sols.length), two: d === 2,
      sols: sols.map(function (v) { return v.pay ? { pay: v.pay, change: v.chg, c: v.c } : { give: v.x, c: v.c }; }) } };
}
function checkTill(P, ans) {
  var D = P.data, j;
  if (!ans) return { ok: false, best: false, why: "нет ответа" };
  if (!D.two) {
    var x = ans.give; if (!x || x.length !== D.dens.length) return { ok: false, best: false, why: "нет выдачи" };
    var s = 0, c = 0;
    for (j = 0; j < x.length; j++) { if (!(x[j] >= 0) || x[j] > D.stock[j] || x[j] !== Math.floor(x[j])) return { ok: false, best: false, why: "столько жетонов нет" }; s += x[j] * D.dens[j]; c += x[j]; }
    if (s !== D.S) return { ok: false, best: false, why: "выдано " + s + ", а нужно " + D.S };
    return { ok: true, best: c === D.min, why: "" };
  }
  var p = ans.pay, q = ans.change;
  if (!p || !q || p.length !== D.dens.length || q.length !== D.dens2.length) return { ok: false, best: false, why: "нет расчёта" };
  var ps = 0, qs = 0, n = 0;
  for (j = 0; j < p.length; j++) { if (!(p[j] >= 0) || p[j] > D.stock[j]) return { ok: false, best: false, why: "столько жетонов в кармане нет" }; ps += p[j] * D.dens[j]; n += p[j]; }
  for (j = 0; j < q.length; j++) { if (!(q[j] >= 0) || q[j] > D.stock2[j]) return { ok: false, best: false, why: "столько жетонов в кассе нет" }; qs += q[j] * D.dens2[j]; n += q[j]; }
  if (ps - qs !== D.S) return { ok: false, best: false, why: "заплачено " + (ps - qs) + ", а нужно " + D.S };
  return { ok: true, best: n === D.min, why: "" };
}
function till(seed, cb, opts) {
  var d = diffOf(opts), P = genTill(seed, d), D = P.data, two = D.two;
  var x = [], hist = [], y = [], hist2 = [];
  var reset = function () { x = D.dens.map(function () { return 0; }); y = D.dens2.map(function () { return 0; }); hist = []; hist2 = []; };
  reset();
  var stockTxt = function (ds, st) { return andList(ds.map(function (v, j) { return "по " + v + " " + crPo(v) + " — " + cnt(st[j], "f", "штука", "штуки", "штук"); })); };
  var sumOf = function (ds, v) { var s = 0; for (var j = 0; j < ds.length; j++) s += ds[j] * v[j]; return s; };
  var tokens = function () { return sum(x) + sum(y); };
  var listOf = function (ds, v) { var a = []; for (var j = 0; j < ds.length; j++) if (v[j]) a.push(v[j] + " по " + ds[j]); return a.length ? andList(a) : "ничего"; };
  var cond = head(opts, d) + "Разменная касса. " + (two ?
    "На складе вы берёте фильтр за " + D.S + " " + cr(D.S) + ". В кармане жетоны: " + stockTxt(D.dens, D.stock) + ". В кассе для сдачи: " + stockTxt(D.dens2, D.stock2) +
    ". Отдайте кассиру жетоны и, если нужно, возьмите сдачу: отдано минус сдача должно быть ровно " + D.S + ". Кассир ленив: чем меньше жетонов пройдёт через руки, туда и обратно, тем лучше." :
    "Рабочему надо выдать ровно " + D.S + " " + cr(D.S) + " жетонами. В кассе жетоны: " + stockTxt(D.dens, D.stock) + ". Больше, чем есть, не выдать.") +
    " Решений несколько, годится любое; образцовое — с наименьшим числом жетонов.";
  var last = start("till", d, P, "Разменная касса", cond, function (st, finish, fail) {
    var status = function () {
      if (!two) return sum(x) ? "В выдаче " + listOf(D.dens, x) + ": " + sumOf(D.dens, x) + " " + cr(sumOf(D.dens, x)) + " из " + D.S + ", жетонов " + sum(x) + "." : "В выдаче пусто, а нужно " + D.S + " " + cr(D.S) + ".";
      var a = sumOf(D.dens, x), b = sumOf(D.dens2, y);
      return (a ? "Отдано " + a + " (" + listOf(D.dens, x) + ")" : "Пока ничего не отдано") + (b ? ", сдача " + b + " (" + listOf(D.dens2, y) + ")" : ", сдачи нет") +
        ". Итого заплачено " + (a - b) + " из " + D.S + ", жетонов через руки " + tokens() + ".";
    };
    var addTo = function (ds, st0, v, h, j, what) {
      if (v[j] >= st0[j]) { nope("Жетонов по " + ds[j] + " больше нет."); return; }
      v[j]++; h.push(j); A("play", "vend_coin");
      sayq("Жетон " + ds[j] + " " + what + ". " + status());
    };
    var undo = function (ds, v, h, what) {
      if (!h.length) { nope("Возвращать нечего."); return; }
      var j = h.pop(); v[j]--; A("play", "term_off");
      sayq("Жетон " + ds[j] + " " + what + ". " + status());
    };
    var tokenItems = function (ds, st0, v, h, verb, left) {
      return ds.map(function (dv, j) { return act(function () { return "Жетон " + dv + ": " + verb + " " + v[j] + ", " + left + " " + (st0[j] - v[j]); }, function () { addTo(ds, st0, v, h, j, two ? (v === x ? "отдан" : "взят") : "в выдаче"); }); });
    };
    var check = function () {
      if (!tokens()) { nope(two ? "Вы ещё ничего не отдали." : "В выдаче пусто: добавьте жетоны."); return; }
      var paid = sumOf(D.dens, x) - sumOf(D.dens2, y), c = tokens();
      if (paid !== D.S) { A("play", "term_err"); fail(two ? "Выходит " + paid + " " + cr(paid) + ", а фильтр стоит " + D.S + ". Кассир качает головой." : "В выдаче " + paid + " " + cr(paid) + ", а нужно ровно " + D.S + "."); return; }
      A("play", "vend");
      win(last, finish, (two ? "Расчёт сошёлся: заплачено ровно " + D.S + " " + cr(D.S) + ", через руки прошло " : "Выдано ровно " + D.S + " " + cr(D.S) + ", ") + cnt(c, "m", "жетон", "жетона", "жетонов") + ".", c === D.min, "хватило бы " + gcnt(D.min, "жетона", "жетонов"));
    };
    var out;
    if (!two) {
      out = tokenItems(D.dens, D.stock, x, hist, "в выдаче", "в кассе ещё");
      out.push(act("Вернуть последний жетон", function () { undo(D.dens, x, hist, "вернулся в кассу"); }));
      out.push(act(function () { return "Что сейчас: в выдаче " + sumOf(D.dens, x) + " из " + D.S; }, function () { say(status()); }));
      out.push(act("Выдать", check));
    } else {
      out = [
        act(function () { return "Отдать в кассу: отдано " + sumOf(D.dens, x); }, function () {
          var it = tokenItems(D.dens, D.stock, x, hist, "отдано", "в кармане");
          it.push(act("Забрать последний назад", function () { undo(D.dens, x, hist, "снова в кармане"); }));
          it.push(backItem("Готово"));
          UIx("menu", "Отдать в кассу", it);
        }),
        act(function () { return "Взять сдачу: взято " + sumOf(D.dens2, y); }, function () {
          var it = tokenItems(D.dens2, D.stock2, y, hist2, "взято", "в кассе ещё");
          it.push(act("Вернуть последний в кассу", function () { undo(D.dens2, y, hist2, "вернулся в кассу"); }));
          it.push(backItem("Готово"));
          UIx("menu", "Сдача", it);
        }),
        act(function () { return "Что сейчас: заплачено " + (sumOf(D.dens, x) - sumOf(D.dens2, y)) + " из " + D.S; }, function () { say(status()); }),
        act("Расплатиться", check)
      ];
    }
    out.push(act("Начать заново", function () {
      if (!tokens()) { say("И так ничего не выдано."); return; }
      reset(); A("play", "term_off"); say("Все жетоны на своих местах. " + status());
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   3. УКЛАДКА КОНТЕЙНЕРА
   Рюкзак: набрать груз ценностью не меньше порога и не тяжелее предела.
   Простая — пять вещей; средняя — семь, и «сначала самое ценное»
   подводит; сложная — восемь вещей, ещё и мест в контейнере мало, и две
   вещи вместе нельзя. Образцовое — самая большая ценность из возможных.
   ════════════════════════════════════════════════════════════════════ */
var CARGO = ["Насос", "Генератор", "Аптечка", "Канистра воды", "Мешок сухарей", "Кислородный баллон", "Катушка кабеля", "Ящик фильтров", "Рация", "Палатка",
  "Аккумулятор", "Ящик инструментов", "Дозиметр", "Запасные лампы", "Трос", "Медикаменты", "Реактивы", "Респираторы", "Спальники", "Сварочный аппарат"];
function kg(v) { return pl(v, "килограмм", "килограмма", "килограммов"); }
function kgGen(v) { return pl(v, "килограмма", "килограммов", "килограммов"); }
function ctEval(D, m) {
  var w = 0, v = 0, k = 0;
  for (var i = 0; i < D.w.length; i++) if (m >> i & 1) { w += D.w[i]; v += D.v[i]; k++; }
  var why = "";
  if (w > D.W) why = "перегруз: " + w + " " + kg(w) + " при пределе " + D.W;
  else if (D.K && k > D.K) why = "мест в контейнере " + D.K + ", а вещей " + k;
  else if (D.bad && (m >> D.bad[0] & 1) && (m >> D.bad[1] & 1)) why = low(D.names[D.bad[0]]) + " и " + low(D.names[D.bad[1]]) + " вместе нельзя";
  else if (v < D.V) why = "ценность " + v + ", а нужно не меньше " + D.V;
  return { w: w, v: v, k: k, ok: !why, why: why };
}
function genContainer(seed, d, depth) {
  var r = rngFor(seed, "container", d), n = [5, 7, 8][d], guard, i, D = null, sols = null;
  for (guard = 0; guard < 300 && !sols; guard++) {
    var idx = choose(r, CARGO.length, n), names = idx.map(function (k) { return CARGO[k]; });
    var w = [], v = [];
    for (i = 0; i < n; i++) { w.push(r.int(2, d === 0 ? 9 : 14)); v.push(r.int(2, d === 0 ? 9 : 15)); }
    var tw = sum(w), W = Math.round(tw * (d === 0 ? r.int(45, 60) : r.int(40, 55)) / 100);
    var K = d === 2 ? r.int(3, 4) : 0, bad = null;
    if (d === 2) bad = choose(r, n, 2).sort(function (a, b) { return a - b; });
    D = { names: names, w: w, v: v, W: W, K: K, bad: bad, V: 0 };
    var feas = [], vmax = 0, m;
    for (m = 1; m < (1 << n); m++) { var e = ctEval(D, m); if (e.ok) { feas.push({ m: m, v: e.v }); if (e.v > vmax) vmax = e.v; } }
    if (feas.length < 3) continue;
    var vs = feas.map(function (f) { return f.v; }).sort(function (a, b) { return b - a; });
    /* порог: столько решений, сколько нужно ступени */
    var lim = [8, 6, 6][d], V = 0;
    for (var t = 1; t < vs.length; t++) { var c = vs.filter(function (x) { return x >= vs[t]; }).length; if (c >= 2 && c <= lim) V = vs[t]; }
    if (!V || V < 6) continue;
    D.V = V;
    var ok = feas.filter(function (f) { return f.v >= V; });
    if (ok.length < 2) continue;
    /* ловушки: «сначала самое ценное» (средняя) и лучший набор без правил (сложная) нарушают условие */
    if (d >= 1) {
      var ord = intList(n).sort(function (a, b) { return v[b] - v[a] || w[a] - w[b]; }), gm = 0, gw = 0;
      ord.forEach(function (k) { if (gw + w[k] <= W) { gw += w[k]; gm |= 1 << k; } });
      if (ctEval(D, gm).ok && r.chance(0.85)) continue;
    }
    if (d === 2) {
      var free = { names: names, w: w, v: v, W: W, K: 0, bad: null, V: 0 }, fm = 0, fv = -1;
      for (m = 1; m < (1 << n); m++) { var e2 = ctEval(free, m); if (e2.ok && e2.v > fv) { fv = e2.v; fm = m; } }
      if (ctEval(D, fm).ok && r.chance(0.8)) continue;
    }
    sols = ok;
  }
  if (!sols) return genContainer(seed + 7919, d, (depth || 0) + 1);
  var vmx = Math.max.apply(null, sols.map(function (f) { return f.v; }));
  var best = sols.filter(function (f) { return f.v === vmx; }), other = sols.filter(function (f) { return f.v !== vmx; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (m) { var p = []; for (var j = 0; j < n; j++) if (m >> j & 1) p.push(D.names[j]); p.push("Закрыть контейнер"); return p; };
  var all = []; for (i = 0; i < n; i++) all.push(D.names[i]); all.push("Закрыть контейнер");
  var wrong = rep(["Выгрузить всё"].concat(all), 3);
  var items = intList(n).map(function (j) { return D.w[j] + ":" + D.v[j]; });
  return { plan: pathOf(altS[0].m), alts: altS.map(function (f) { return pathOf(f.m); }), altBest: altS.map(function (f) { return f.v === vmx; }),
    answers: altS.map(function (f) { var a = []; for (var j = 0; j < n; j++) if (f.m >> j & 1) a.push(j); return { take: a }; }),
    wrong: wrong, sol: sols.length,
    sig: "container|" + d + "|" + items.slice().sort().join(",") + "|" + D.W + "|" + D.V + (d === 2 ? "|" + D.K + "|" + items[D.bad[0]] + "+" + items[D.bad[1]] : ""),
    data: { names: D.names, w: D.w, v: D.v, W: D.W, K: D.K, bad: D.bad, V: D.V, vmax: vmx, sol: sols.length, masks: sols.map(function (f) { return f.m; }) } };
}
function checkContainer(P, ans) {
  var D = P.data, m = 0;
  if (!ans || !ans.take || !ans.take.length) return { ok: false, best: false, why: "контейнер пуст" };
  for (var i = 0; i < ans.take.length; i++) { var j = ans.take[i]; if (!(j >= 0 && j < D.w.length) || (m >> j & 1)) return { ok: false, best: false, why: "такой вещи нет" }; m |= 1 << j; }
  var e = ctEval(D, m);
  return { ok: e.ok, best: e.ok && e.v === D.vmax, why: e.why };
}
function container(seed, cb, opts) {
  var d = diffOf(opts), P = genContainer(seed, d), D = P.data, n = D.w.length, m = 0;
  var desc = function (j) { return D.names[j] + ": " + D.w[j] + " " + kg(D.w[j]) + ", ценность " + D.v[j]; };
  var cond = head(opts, d) + "Укладка контейнера. Экспедиция Нижних уходит в дальний штрек; контейнер выдержит не больше " + D.W + " " + kgGen(D.W) +
    (D.K ? ", и мест в нём — всего " + nw(D.K, "n") : "") + ". Груз должен быть ценностью не меньше " + D.V + ". На складе: " +
    intList(n).map(function (j) { return low(desc(j)); }).join("; ") + "." + (D.bad ? " " + D.names[D.bad[0]] + " и " + low(D.names[D.bad[1]]) + " вместе не везут: опасно." : "") +
    " Решений несколько, годится любое; образцовое — с самой большой ценностью, какая возможна.";
  var last = start("container", d, P, "Укладка контейнера", cond, function (st, finish, fail) {
    var status = function () { var e = ctEval(D, m); return "В контейнере " + (e.k ? andList(intList(n).filter(function (j) { return m >> j & 1; }).map(function (j) { return low(D.names[j]); })) : "пусто") + ": " + e.w + " " + kg(e.w) + " из " + D.W + ", ценность " + e.v + " из нужных " + D.V + (D.K ? ", мест занято " + e.k + " из " + D.K : "") + "."; };
    var out = intList(n).map(function (j) {
      return act(function () { return desc(j) + " — " + (m >> j & 1 ? "в контейнере" : "на складе"); }, function () {
        m ^= 1 << j; A("play", m >> j & 1 ? "open_crate" : "term_off");
        sayq(D.names[j] + (m >> j & 1 ? " — в контейнере. " : " — снова на складе. ") + status());
      });
    });
    out.push(act(function () { var e = ctEval(D, m); return "Что в контейнере: " + e.w + " " + kg(e.w) + ", ценность " + e.v; }, function () { say(status()); }));
    out.push(act("Закрыть контейнер", function () {
      if (!m) { nope("Контейнер пуст."); return; }
      var e = ctEval(D, m);
      if (!e.ok) { A("play", "term_err"); fail("Приёмщик не подписал: " + e.why + "."); return; }
      win(last, finish, "Контейнер опечатан: " + e.w + " " + kg(e.w) + ", ценность " + e.v + ".", e.v === D.vmax, "можно было набрать ценность " + D.vmax);
    }));
    out.push(act("Выгрузить всё", function () { if (!m) { say("Контейнер и так пуст."); return; } m = 0; A("play", "term_off"); say("Всё снова на складе."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   4. РЕЗИСТОРНАЯ ЦЕПЬ
   Из набора резисторов собрать нужное сопротивление: две детали
   соединяются последовательно (сопротивления складываются) или
   параллельно (произведение, делённое на сумму); сборка — тоже деталь.
   Простая — четыре резистора; средняя — пять, и одного соединения не
   хватит, а в одну сборку — не больше четырёх резисторов (больше плата
   не держит); сложная — две нагрузки по очереди из шести: первая
   впаивается насовсем, вторая — из того, что осталось (если после первой
   вторую не собрать, первую возвращают — это ошибка). Образцовое — из
   наименьшего числа резисторов. Дроби считаются точно.
   ════════════════════════════════════════════════════════════════════ */
var RS_POOL = [[1, 2, 3, 4, 5, 6, 8, 9, 10, 12], [1, 2, 3, 4, 5, 6, 8, 10, 12, 15], [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]];
function rq(n, d) { var g = gcd(n, d); return { n: n / g, d: d / g }; }
function rsSer(a, b) { return rq(a.n * b.d + b.n * a.d, a.d * b.d); }
function rsPar(a, b) { return rq(a.n * b.n, a.n * b.d + b.n * a.d); }
function qEq(a, b) { return a.n === b.n && a.d === b.d; }
function qKey(q) { return q.n + "/" + q.d; }
/* число словами для речи: целое, конечная дробь через запятую, иначе — «около» */
function qText(q) {
  if (q.d === 1) return String(q.n);
  var d = q.d, k = 0; while (d % 2 === 0) { d /= 2; k++; } var k5 = 0; while (d % 5 === 0) { d /= 5; k5++; }
  var digits = Math.max(k, k5), v = q.n / q.d;
  if (d === 1 && digits <= 3) return v.toFixed(digits).replace(".", ",");
  return "около " + (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}
function ohm(q) { return q.d === 1 ? pl(q.n, "ом", "ома", "ом") : "ома"; }
function qSay(q) { return qText(q) + " " + ohm(q); }
function rsLeaf(i, v) { return { q: { n: v, d: 1 }, t: "n", key: String(v), mask: 1 << i, leaves: 1, leaf: i, a: null, b: null, op: "", L: null }; }
function rsMerge(A, B) { var out = [], i = 0, j = 0; while (i < A.length && j < B.length) out.push(A[i] <= B[j] ? A[i++] : B[j++]); while (i < A.length) out.push(A[i++]); while (j < B.length) out.push(B[j++]); return out; }
function rsComb(x, y, op) {
  var q = op === "s" ? rsSer(x.q, y.q) : rsPar(x.q, y.q);
  var L = rsMerge(x.t === op ? x.L : [x.key], y.t === op ? y.L : [y.key]);
  return { q: q, t: op, key: (op === "s" ? "S(" : "P(") + L.join(",") + ")", mask: x.mask | y.mask, leaves: x.leaves + y.leaves, leaf: -1, a: x, b: y, op: op, L: L };
}
function rsLevels(vals, maxL) {
  var n = vals.length, E = {}, i, masks = [];
  for (i = 0; i < n; i++) E[1 << i] = [rsLeaf(i, vals[i])];
  for (var m = 1; m < (1 << n); m++) if (popcount(m) >= 2 && popcount(m) <= (maxL || n)) masks.push(m);
  masks.sort(function (a, b) { return popcount(a) - popcount(b) || a - b; });
  masks.forEach(function (mk) {
    var seen = {}, out = [];
    for (var sa = (mk - 1) & mk; sa > 0; sa = (sa - 1) & mk) {
      var sb = mk ^ sa; if (sa > sb) continue;
      for (var p = 0; p < E[sa].length; p++) for (var q = 0; q < E[sb].length; q++) {
        var x = E[sa][p], y = E[sb][q];
        for (var o = 0; o < 2; o++) {
          var op = o ? "p" : "s", L = rsMerge(x.t === op ? x.L : [x.key], y.t === op ? y.L : [y.key]), key = (o ? "P(" : "S(") + L.join(",") + ")";
          if (seen[key]) continue;
          seen[key] = 1;
          out.push({ q: o ? rsPar(x.q, y.q) : rsSer(x.q, y.q), t: op, key: key, mask: x.mask | y.mask, leaves: x.leaves + y.leaves, leaf: -1, a: x, b: y, op: op, L: L });
        }
      }
    }
    E[mk] = out;
  });
  return E;
}
/* формулы по значению: ключ — само число (дробь как частное: равные дроби дают одно и то же число) */
function rsByValue(E) {
  /* в одной маске формулы и так разные, а разные маски — разные наборы резисторов */
  var by = new Map();
  for (var mk in E) E[mk].forEach(function (x) {
    if (x.leaves < 2) return;
    var k = x.q.n / x.q.d, l = by.get(k);
    if (l) l.push(x); else by.set(k, [x]);
  });
  return by;
}
function rsMixed(x) { var s = false, p = false; var walk = function (z) { if (z.leaf >= 0) return; if (z.op === "s") s = true; else p = true; walk(z.a); walk(z.b); }; walk(x); return s && p; }
function rsNice(q) { var d = q.d, v = q.n / d; return (d === 1 || d === 2 || d === 5 || d === 10) && v >= 0.5 && v <= 60; }
function rsWalk(root, k0) {
  var path = [], steps = [], k = k0;
  var walk = function (x) {
    if (x.leaf >= 0) return { nm: "Резистор " + (x.leaf + 1), ref: "r" + x.leaf };
    var a = walk(x.a), b = walk(x.b);
    k++; path.push("Соединить", a.nm, x.op === "s" ? "Последовательно" : "Параллельно", b.nm); steps.push([a.ref, x.op, b.ref]);
    return { nm: "Сборка " + k, ref: "c" + (k - 1) };
  };
  var R = walk(root); path.push("Подключить нагрузку", R.nm);
  return { path: path, ans: { steps: steps, submit: R.ref }, k: k };
}
/* верхний ярус (ровно L резисторов) — только значения; формулы строятся по запросу */
function rsTopBy(E, n, L) {
  var top = new Map(), tq = new Map();
  for (var mk = 1; mk < (1 << n); mk++) {
    if (popcount(mk) !== L) continue;
    for (var sa = (mk - 1) & mk; sa > 0; sa = (sa - 1) & mk) {
      var sb = mk ^ sa; if (sa > sb) continue;
      var XA = E[sa], XB = E[sb];
      for (var p = 0; p < XA.length; p++) for (var q = 0; q < XB.length; q++) for (var o = 0; o < 2; o++) {
        var a = XA[p].q, b = XB[q].q, nn = o ? a.n * b.n : a.n * b.d + b.n * a.d, dd = o ? a.n * b.d + b.n * a.d : a.d * b.d, k = nn / dd, l = top.get(k);
        if (!l) { l = []; top.set(k, l); var g = gcd(nn, dd); tq.set(k, { n: nn / g, d: dd / g }); }
        l.push([XA[p], XB[q], o ? "p" : "s"]);
      }
    }
  }
  return { top: top, tq: tq };
}
function rsUniq(L) { var seen = {}; return L.filter(function (x) { if (seen[x.key]) return false; seen[x.key] = 1; return true; }); }
function rsSols(by, top, k) {
  var seen = {}, out = [];
  (by.get(k) || []).forEach(function (x) { out.push(x); });
  (top.get(k) || []).forEach(function (t) { var z = rsComb(t[0], t[1], t[2]), sk = z.key + "@" + z.mask; if (!seen[sk]) { seen[sk] = 1; out.push(z); } });
  return out;
}
function genResistors(seed, d, depth) {
  var r = rngFor(seed, "resistors", d), n = [4, 5, 6][d], maxL = 4, guard, i, vals = [], T = null, T2 = null, sols = null, second = null;
  var minReq = d === 1 ? 3 : 2;
  for (guard = 0; guard < 300 && !sols; guard++) {
    vals = []; for (i = 0; i < n; i++) vals.push(r.pick(RS_POOL[d]));
    var E = rsLevels(vals, maxL - 1), by = rsByValue(E), TB = rsTopBy(E, n, maxL), top = TB.top, single = {}, memo = {};
    var solsOf = function (k) { return memo[k] || (memo[k] = rsSols(by, top, k)); };
    vals.forEach(function (v) { single[v] = 1; });
    var keys = []; by.forEach(function (v, k) { keys.push(k); }); top.forEach(function (v, k) { if (!by.has(k)) keys.push(k); });
    var cands = [], pref = [];
    keys.forEach(function (k) {
      var bk = by.get(k), tk = top.get(k), q0 = bk ? bk[0].q : TB.tq.get(k);
      if (!rsNice(q0) || single[k]) return;
      var raw = (bk ? bk.length : 0) + (tk ? tk.length : 0);
      var mn = maxL; if (bk) for (var j = 0; j < bk.length; j++) if (bk[j].leaves < mn) mn = bk[j].leaves;
      if (mn < minReq || raw < (d < 2 ? 2 : 1)) return;
      cands.push(k);
      if (d < 2 && bk && tk && (d === 0 || bk.some(function (x) { return x.leaves === mn && rsMixed(x); }))) pref.push(k);
    });
    if (d < 2) {
      var src = pref.length && r.chance(0.8) ? pref : cands;
      for (var tr = 0; tr < 6 && src.length && !sols; tr++) {
        var ti = r.int(0, src.length - 1), L = rsUniq(solsOf(src[ti]));
        if (L.length >= 2 && L.length <= 40) { T = L[0].q; sols = L; }
        else src = src.slice(0, ti).concat(src.slice(ti + 1));
      }
    } else {
      if (cands.length < 2) continue;
      var ck = cands.slice(); r.shuffle(ck); ck = ck.slice(0, 20);
      var found = [];
      for (var ia = 0; ia < ck.length && found.length < 6; ia++) for (var ib = 0; ib < ck.length && found.length < 6; ib++) {
        if (ia === ib) continue;
        var k1 = ck[ia], k2 = ck[ib], ps = [], seenP = {}, dead = false, L1 = solsOf(k1), L2 = solsOf(k2);
        if (L1.length > 40 || L2.length > 40) continue;
        L1.forEach(function (x) {
          var any = false;
          L2.forEach(function (y) { if (x.mask & y.mask) return; any = true; var pk = x.key + "|" + y.key; if (!seenP[pk]) { seenP[pk] = 1; ps.push({ x: x, y: y, leaves: x.leaves + y.leaves }); } });
          if (!any) dead = true;
        });
        if (ps.length >= 2 && ps.length <= 40) found.push({ k1: k1, k2: k2, ps: ps, dead: dead });
      }
      if (!found.length) continue;
      var fd = found.filter(function (f) { return f.dead; }), fsel = fd.length && r.chance(0.8) ? r.pick(fd) : r.pick(found);
      T = solsOf(fsel.k1)[0].q; T2 = solsOf(fsel.k2)[0].q; sols = fsel.ps; second = solsOf(fsel.k2).map(function (y) { return y.mask; });
    }
  }
  if (!sols) return genResistors(seed + 7919, d, (depth || 0) + 1);
  var minL = Math.min.apply(null, sols.map(function (x) { return x.leaves; }));
  var best = sols.filter(function (x) { return x.leaves === minL; }), other = sols.filter(function (x) { return x.leaves !== minL; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]), alts = [], answers = [];
  altS.forEach(function (s) {
    if (d < 2) { var w = rsWalk(s, 0); alts.push(w.path); answers.push(w.ans); return; }
    var w1 = rsWalk(s.x, 0), w2 = rsWalk(s.y, w1.k);
    alts.push(w1.path.concat(w2.path)); answers.push({ stages: [w1.ans, w2.ans] });
  });
  var wrong = [0, 1, 2].map(function (j) { return ["Разобрать всё", "Подключить нагрузку", "Резистор " + (j + 1)]; });
  var sorted = vals.slice().sort(function (a, b) { return a - b; });
  return { plan: alts[0], alts: alts, altBest: altS.map(function (x) { return x.leaves === minL; }), answers: answers, wrong: wrong, sol: sols.length,
    stages: d === 2 ? 2 : 1,
    sig: "resistors|" + d + "|" + sorted.join(",") + "|" + qKey(T) + (T2 ? "|" + qKey(T2) : ""),
    data: { vals: vals, T: T, T2: T2, minL: minL, maxL: maxL, sol: sols.length,
      keys: d < 2 ? sols.map(function (x) { return x.key; }).sort() : sols.map(function (x) { return x.x.key + "|" + x.y.key; }).sort(),
      second: second } };
}
function rsRun(D, parts, stage, made) {
  /* parts — словарь ссылок; stage.steps — соединения этапа; возвращает деталь или текст ошибки */
  for (var i = 0; i < stage.steps.length; i++) {
    var s = stage.steps[i], a = parts[s[0]], b = parts[s[2]];
    if (!a || !b || a === b || a.gone || b.gone || (s[1] !== "s" && s[1] !== "p")) return "соединение " + (i + 1) + " невозможно";
    if (a.leaves + b.leaves > D.maxL) return "в сборке больше " + D.maxL + " резисторов";
    var z = rsComb(a, b, s[1]); a.gone = b.gone = true; parts["c" + made.k] = z; made.k++;
  }
  var x = parts[stage.submit];
  if (!x || x.gone) return "подключать нечего";
  return x;
}
function checkResistors(P, ans) {
  var D = P.data, parts = {}, made = { k: 0 }, i;
  if (!ans) return { ok: false, best: false, why: "нет ответа" };
  for (i = 0; i < D.vals.length; i++) parts["r" + i] = rsLeaf(i, D.vals[i]);
  var stages = D.T2 ? ans.stages : [ans];
  if (!stages || stages.length !== (D.T2 ? 2 : 1)) return { ok: false, best: false, why: "этапов не столько" };
  var x = rsRun(D, parts, stages[0], made);
  if (typeof x === "string") return { ok: false, best: false, why: x };
  if (!qEq(x.q, D.T)) return { ok: false, best: false, why: "вышло " + qText(x.q) + ", а нужно " + qText(D.T) };
  if (!D.T2) return { ok: true, best: x.leaves === D.minL, why: "" };
  x.gone = true;
  for (i = 0; i < D.vals.length; i++) if (x.mask >> i & 1) parts["r" + i].gone = true;
  var y = rsRun(D, parts, stages[1], made);
  if (typeof y === "string") return { ok: false, best: false, why: y };
  if (y.mask & x.mask) return { ok: false, best: false, why: "резистор взят дважды" };
  if (!qEq(y.q, D.T2)) return { ok: false, best: false, why: "вторая нагрузка — " + qText(y.q) + ", а нужно " + qText(D.T2) };
  return { ok: true, best: x.leaves + y.leaves === D.minL, why: "" };
}
function resistors(seed, cb, opts) {
  var d = diffOf(opts), P = genResistors(seed, d), D = P.data, n = D.vals.length;
  var parts = [], made = 0, stage = 1, fixed = null;
  var reset = function () { parts = []; D.vals.forEach(function (v, i) { if (fixed && (fixed.mask >> i & 1)) return; var x = rsLeaf(i, v); x.name = "резистор " + (i + 1); parts.push(x); }); };
  reset();
  var label = function (x) { return cap(x.name) + ": " + qSay(x.q); };
  var table = function () { return parts.map(function (x) { return x.name + " — " + qText(x.q); }).join(", "); };
  var need = function () { return stage === 1 ? D.T : D.T2; };
  var listTxt = D.vals.map(function (v, i) { return "резистор " + (i + 1) + " — " + v + " " + pl(v, "ом", "ома", "ом"); });
  /* (после 4.5, нелогичность) правило проверки названо в условии: первая нагрузка, после которой
     вторую из оставшихся не собрать, — ошибка (прежде о ней узнавали, только потеряв попытку) */
  var cond = head(opts, d) + "Резисторная цепь. " + (D.T2 ? "Работа в два этапа. " + stageText(1, 2) + ": собрать и подключить первую нагрузку — ровно " + qSay(D.T) + "; её резисторы впаяют насовсем. " + stageText(2, 2) + ": из оставшихся — вторую нагрузку, ровно " + qSay(D.T2) + "; если после первой вторую из оставшихся не собрать, первую сборку вернут на стол, и это ошибка." : "Нагрузке нужно ровно " + qSay(D.T) + ".") +
    " На столе " + cnt(n, "m", "резистор", "резистора", "резисторов") + ": " + andList(listTxt) + ". Две детали можно соединить последовательно — сопротивления складываются, или параллельно — тогда общее сопротивление равно произведению, делённому на сумму: 6 и 3 ома параллельно дают 2. Готовая сборка — тоже деталь, её можно соединять дальше. Задействовать все резисторы не обязательно." + (n > 4 ? " В одну сборку — не больше четырёх резисторов: больше плата не держит." : "") +
    (D.T2 ? " Решений несколько, годится любое; образцовое — когда на обе нагрузки ушло меньше всего резисторов." : " Решений несколько, годится любое; образцовое — из наименьшего числа резисторов.");
  var last = start("resistors", d, P, "Резисторная цепь", cond, function (st, finish, fail) {
    var listOf = function (arr, fn) { var items = arr.map(function (x) { return pick(label(x), function () { fn(x); }); }); items.push(backItem()); return items; };
    var combine = function (x, op, y) {
      if (x.leaves + y.leaves > D.maxL) { nope("В одной сборке — не больше четырёх резисторов: больше плата не держит. Ничего не соединено."); return; }
      var z = rsComb(x, y, op); made++;
      z.name = "сборка " + made;
      parts = parts.filter(function (p) { return p !== x && p !== y; }); parts.push(z);
      A("play", "pick_part");
      say(cap(z.name) + ": " + qText(x.q) + " и " + qText(y.q) + (op === "s" ? " последовательно" : " параллельно") + " — " + qSay(z.q) + ". На столе: " + table() + ".");
    };
    var submit = function (x) {
      var t = need();
      if (!qEq(x.q, t)) { A("play", "term_err"); fail("Сопротивление " + qSay(x.q) + ", а " + (D.T2 ? (stage === 1 ? "первой" : "второй") + " нагрузке" : "нагрузке") + " нужно " + qSay(t) + ". Нагрузка не включилась."); return; }
      if (D.T2 && stage === 1) {
        var ok2 = D.second.some(function (m2) { return !(m2 & x.mask); });
        if (!ok2) { A("play", "term_err"); fail("Первая нагрузка собрана верно, но из оставшихся резисторов вторую не собрать. Сборку вернули на стол."); return; }
        fixed = x; stage = 2; last.stage = 2;
        /* (после 4.5, нелогичность) условие второго этапа называет, какие резисторы остались (прежде —
           только «из оставшихся»: на слух их было не восстановить без «Что на столе») */
        var restR = []; for (var ri = 0; ri < n; ri++) if (!(x.mask >> ri & 1)) restR.push(listTxt[ri]);
        st.cond = cond + " Первый этап пройден: первая нагрузка — ровно " + qSay(t) + ", в ней " + cnt(x.leaves, "m", "резистор", "резистора", "резисторов") + ". " + stageText(2, 2) + ": второй нагрузке нужно ровно " + qSay(D.T2) + " из оставшихся резисторов: " + andList(restR) + ".";
        parts = parts.filter(function (p) { return p !== x; });
        A("play", "power_on");
        say(stageText(1, 2) + " готов: первая нагрузка — ровно " + qSay(t) + ", её резисторы впаяны. " + stageText(2, 2) + ": второй нагрузке нужно ровно " + qSay(D.T2) + ". На столе: " + (parts.length ? table() : "пусто") + ".");
        return;
      }
      A("play", "power_on");
      var tot = x.leaves + (fixed ? fixed.leaves : 0);
      win(last, finish, (D.T2 ? "Обе нагрузки включились, ушло " : "Нагрузка включилась: ровно " + qSay(t) + ", ушло ") + cnt(tot, "m", "резистор", "резистора", "резисторов") + ".", tot === D.minL,
        "хватило бы " + gcnt(D.minL, "резистора", "резисторов"));
    };
    return [
      act("Соединить две детали", function () {
        if (parts.length < 2) { nope("Соединять нечего: на столе меньше двух деталей." + (parts.length ? "" : " Разберите всё.")); return; }
        UIx("menu", "Первая деталь", listOf(parts, function (x) {
          swapMenu("Как соединить", [
            pick("Последовательно", function () { swapMenu("Вторая деталь", listOf(parts.filter(function (y) { return y !== x; }), function (y) { closeSub(); combine(x, "s", y); })); }),
            pick("Параллельно", function () { swapMenu("Вторая деталь", listOf(parts.filter(function (y) { return y !== x; }), function (y) { closeSub(); combine(x, "p", y); })); }),
            backItem()
          ]);
        }));
      }),
      act(function () { return "Подключить нагрузку" + (D.T2 ? ": сейчас " + (stage === 1 ? "первая" : "вторая") : ""); }, function () {
        if (!parts.length) { nope("На столе пусто: разберите всё."); return; }
        UIx("menu", "Что подключить", listOf(parts, function (x) { closeSub(); submit(x); }));
      }),
      act(function () { return "Что на столе: " + cnt(parts.length, "f", "деталь", "детали", "деталей"); }, function () {
        say((D.T2 ? stageText(stage, 2) + ". " : "") + "На столе: " + (parts.length ? table() : "пусто") + ". Нужно ровно " + qSay(need()) + ".");
      }),
      act("Разобрать всё", function () {
        if (parts.every(function (p) { return p.leaf >= 0; })) { say("Всё и так разобрано. На столе: " + (parts.length ? table() : "пусто") + "."); return; }
        reset(); made = 0; A("play", "term_off"); say("Сборки разобраны. На столе: " + table() + ".");
      })
    ];
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   5. ЧАСТОТЫ УЗЛОВ
   Узлы связи слышат соседей: соседям одну частоту нельзя. Последняя
   частота — резервная, её занимать как можно реже. Простая — шесть
   узлов и три частоты, один узел настроен заранее; средняя — восемь
   узлов, два настроены, и кое-где частоты запрещены; сложная — десять
   узлов, четыре частоты, без резервной не обойтись, а занять её можно
   не больше чем на одном узле сверх необходимого. Образцовое — когда на
   резервной частоте меньше всего узлов.
   ════════════════════════════════════════════════════════════════════ */
var FREQ_HZ = [0, 392, 494, 587, 740];
var FQ_WHY = ["рядом шахтный лифт", "рядом трансформатор", "рядом насосная", "рядом сварочный пост", "рядом вентиляторы"];
function fqSearch(G, limitR, capn, keep) {
  var n = G.n, col = rep(0, n), out = [], count = 0, R = G.k;
  var rec = function (i, rc) {
    if (count >= capn) return;
    if (i === n) { count++; if (keep) out.push(col.slice()); return; }
    for (var c = 1; c <= G.k; c++) {
      if (G.fix[i] && G.fix[i] !== c) continue;
      if (G.forb[i] && G.forb[i].indexOf(c) >= 0) continue;
      var rr = rc + (c === R ? 1 : 0); if (rr > limitR) continue;
      var ok = true; for (var t = 0; t < G.adj[i].length; t++) { var j = G.adj[i][t]; if (j < i && col[j] === c) { ok = false; break; } }
      if (!ok) continue;
      col[i] = c; rec(i + 1, rr); col[i] = 0;
    }
  };
  rec(0, 0);
  return { count: count, list: out };
}
function fqMin(G) { for (var L = 0; L <= G.n; L++) if (fqSearch(G, L, 1, false).count) return L; return -1; }
function fqReserve(G, col) { var c = 0; for (var i = 0; i < col.length; i++) if (col[i] === G.k) c++; return c; }
function fqConflicts(G, col) { var out = []; G.edges.forEach(function (e) { if (col[e[0]] && col[e[0]] === col[e[1]]) out.push(e); }); return out; }
function genFrequencies(seed, d, depth) {
  var r = rngFor(seed, "frequencies", d), n = [6, 8, 10][d], k = d === 2 ? 4 : 3, guard, i, G = null, sols = null, minR = 0, limitR = n;
  for (guard = 0; guard < 300 && !sols; guard++) {
    var adj = [], edges = [], has = {}, degCap = d === 2 ? 5 : 4;
    for (i = 0; i < n; i++) adj.push([]);
    var addE = function (a, b) {
      if (a === b) return false;
      var key = Math.min(a, b) + "-" + Math.max(a, b);
      if (has[key] || adj[a].length >= degCap || adj[b].length >= degCap) return false;
      has[key] = 1; adj[a].push(b); adj[b].push(a); edges.push([Math.min(a, b), Math.max(a, b)]); return true;
    };
    var okT = true;
    for (i = 1; i < n && okT; i++) { var tries = 0; while (!addE(i, r.int(0, i - 1)) && ++tries < 20) { /* */ } if (tries >= 20) okT = false; }
    if (!okT) continue;
    if (d === 2) { var q4 = choose(r, n, 4); for (var a = 0; a < 4; a++) for (var b = a + 1; b < 4; b++) addE(q4[a], q4[b]); }
    var extra = r.int([1, 3, 3][d], [2, 4, 5][d]), et = 0;
    while (extra > 0 && et++ < 60) if (addE(r.int(0, n - 1), r.int(0, n - 1))) extra--;
    adj.forEach(function (l) { l.sort(function (x, y) { return x - y; }); });
    edges.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
    G = { n: n, k: k, adj: adj, edges: edges, fix: rep(0, n), forb: rep(null, n) };
    var m0 = fqMin(G);
    if (m0 < 0 || (d === 2 && m0 < 1)) continue;
    if (d < 2 && m0 === 0 && r.chance(0.7)) continue; /* двудольные — скучно: резервная не нужна вовсе */
    var base = fqSearch(G, m0, 300, true).list; if (!base.length) continue;
    var H = r.pick(base);
    limitR = d === 2 ? m0 + 1 : n;
    /* заранее настроенные узлы и запреты — из скрытого решения */
    var order = intList(n); r.shuffle(order);
    var nFix = [1, 2, 2][d], nForb = [0, r.int(1, 2), 2][d], fx = 0, fb = 0, oi = 0;
    for (oi = 0; oi < n && fx < nFix; oi++) { var u = order[oi]; if (H[u] === k && r.chance(0.7)) continue; G.fix[u] = H[u]; fx++; }
    for (oi = 0; oi < n && fb < nForb; oi++) {
      var v = order[n - 1 - oi]; if (G.fix[v]) continue;
      var bad = intList(k).map(function (x) { return x + 1; }).filter(function (c) { return c !== H[v]; });
      G.forb[v] = [r.pick(bad)]; fb++;
    }
    var maxC = [24, 20, 40][d], res = fqSearch(G, limitR, maxC + 1, true), more = 0;
    while (res.count > maxC && more++ < 4) {
      var free = intList(n).filter(function (x) { return !G.fix[x]; }); if (!free.length) break;
      var w = r.pick(free); G.fix[w] = H[w]; G.forb[w] = null;
      res = fqSearch(G, limitR, maxC + 1, true);
    }
    if (res.count < 2 || res.count > maxC) continue;
    minR = Math.min.apply(null, res.list.map(function (c) { return fqReserve(G, c); }));
    if (minR !== m0) continue;
    if (!res.list.some(function (c) { return fqReserve(G, c) > minR; }) && r.chance(0.6)) continue;
    sols = res.list;
  }
  if (!sols) return genFrequencies(seed + 7919, d, (depth || 0) + 1);
  var best = sols.filter(function (c) { return fqReserve(G, c) === minR; }), other = sols.filter(function (c) { return fqReserve(G, c) !== minR; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var groups = d === 2 ? [[0, 4], [5, 9]] : null;
  var gName = ["Узлы с первого по пятый", "Узлы с шестого по десятый"];
  var pathOf = function (col) {
    var p = [];
    var one = function (u) { if (!G.fix[u]) p.push("Узел " + (u + 1), "Частота " + col[u]); };
    if (!groups) for (var u = 0; u < n; u++) one(u);
    else groups.forEach(function (g, gi) { p.push(gName[gi]); for (var u2 = g[0]; u2 <= g[1]; u2++) one(u2); p.push("Назад"); });
    p.push("Включить связь"); return p;
  };
  /* неверно: то же образцовое, но один узел на частоте соседа */
  var wcol = best[0].slice(), done = false;
  for (i = 0; i < n && !done; i++) {
    if (G.fix[i]) continue;
    for (var t = 0; t < G.adj[i].length && !done; t++) { var c2 = best[0][G.adj[i][t]]; if (!(G.forb[i] && G.forb[i].indexOf(c2) >= 0)) { wcol[i] = c2; done = true; } }
  }
  if (!done) return genFrequencies(seed + 7919, d, (depth || 0) + 1);
  var wrong = rep(pathOf(wcol), 3);
  var fixS = [], forbS = [];
  for (i = 0; i < n; i++) { if (G.fix[i]) fixS.push((i + 1) + "=" + G.fix[i]); if (G.forb[i]) forbS.push((i + 1) + "!" + G.forb[i][0]); }
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (c) { return fqReserve(G, c) === minR; }),
    answers: altS.map(function (c) { return { f: c.slice() }; }), wrong: wrong, sol: sols.length,
    sig: "frequencies|" + d + "|" + n + "|" + G.edges.map(function (e) { return e[0] + "-" + e[1]; }).join(",") + "|" + fixS.join(",") + "|" + forbS.join(","),
    data: { n: n, k: k, edges: G.edges, adj: G.adj, fix: G.fix, forb: G.forb, minR: minR, limitR: limitR, sol: sols.length, groups: groups,
      why: intList(n).map(function (x) { return FQ_WHY[(x + seed) % FQ_WHY.length]; }) } };
}
function checkFrequencies(P, ans) {
  var D = P.data, f = ans && ans.f;
  if (!f || f.length !== D.n) return { ok: false, best: false, why: "не всем узлам дана частота" };
  for (var i = 0; i < D.n; i++) {
    if (!(f[i] >= 1 && f[i] <= D.k)) return { ok: false, best: false, why: "узел " + (i + 1) + " без частоты" };
    if (D.fix[i] && f[i] !== D.fix[i]) return { ok: false, best: false, why: "узел " + (i + 1) + " настроен заранее" };
    if (D.forb[i] && D.forb[i].indexOf(f[i]) >= 0) return { ok: false, best: false, why: "узлу " + (i + 1) + " эта частота запрещена" };
  }
  var G = { k: D.k, edges: D.edges };
  if (fqConflicts(G, f).length) return { ok: false, best: false, why: "помехи у соседей" };
  var rv = fqReserve(G, f);
  if (rv > D.limitR) return { ok: false, best: false, why: "резервная занята сверх предела" };
  return { ok: true, best: rv === D.minR, why: "" };
}
function frequencies(seed, cb, opts) {
  var d = diffOf(opts), P = genFrequencies(seed, d), D = P.data, n = D.n, k = D.k, G = { k: k, edges: D.edges };
  var col = D.fix.slice();
  var fname = function (c) { return "частота " + c + (c === k ? ", резервная" : ""); };
  var neighTxt = [];
  for (var i0 = 0; i0 < n; i0++) {
    var hi = D.adj[i0].filter(function (j) { return j > i0; }).map(function (j) { return j + 1; });
    if (hi.length) neighTxt.push("узел " + (i0 + 1) + " — с " + (hi.length === 1 ? "узлом " : "узлами ") + andList(hi));
  }
  var fixTxt = [], forbTxt = [];
  for (i0 = 0; i0 < n; i0++) {
    if (D.fix[i0]) fixTxt.push("узел " + (i0 + 1) + " — частота " + D.fix[i0]);
    if (D.forb[i0]) forbTxt.push("узлу " + (i0 + 1) + " нельзя частоту " + D.forb[i0][0] + ": " + D.why[i0]);
  }
  var cond = head(opts, d) + "Частоты узлов. " + cap(cnt(n, "m", "узел", "узла", "узлов")) + " связи, номера с первого по " + ORDM[n] + ". Соседние узлы слышат друг друга, и на одной частоте им нельзя: будут помехи. Соседи: " +
    neighTxt.join("; ") + ". Частот " + nw(k) + "; " + ORDF[k] + " — резервная, её лучше занимать как можно реже" + (d === 2 ? ": без неё здесь не обойтись, но больше чем на " + pcnt(D.limitR, "узле", "узлах") + " её не дадут" : "") + ". " + (fixTxt.length === 1 ? "Уже настроен: " : "Уже настроены: ") +
    fixTxt.join(", ") + "." + (forbTxt.length ? " " + cap(forbTxt.join("; ")) + "." : "") + " Раздайте частоты всем узлам. Решений несколько, годится любое без помех; образцовое — когда на резервной частоте меньше всего узлов.";
  var last = start("frequencies", d, P, "Частоты узлов", cond, function (st, finish, fail) {
    var nodeLabel = function (u) { return "Узел " + (u + 1) + ": " + (col[u] ? fname(col[u]) : "без частоты") + (D.fix[u] ? ", настроен заранее" : ""); };
    var conflictsOf = function (u) { return D.adj[u].filter(function (j) { return col[j] && col[j] === col[u]; }).map(function (j) { return j + 1; }); };
    var setF = function (u, c) {
      if (c && D.forb[u] && D.forb[u].indexOf(c) >= 0) { nope("Узлу " + (u + 1) + " частоту " + c + " нельзя: " + D.why[u] + "."); return; }
      col[u] = c;
      if (!c) { A("play", "term_off"); sayq("Узел " + (u + 1) + " без частоты."); return; }
      A("play", "radio"); tone(FREQ_HZ[c], 0.3);
      var cf = conflictsOf(u);
      sayq("Узел " + (u + 1) + " — " + fname(c) + "." + (cf.length ? " Помехи с " + (cf.length === 1 ? "узлом " : "узлами ") + andList(cf) + "!" : ""));
    };
    var picker = function (u) {
      if (D.fix[u]) { nope("Узел " + (u + 1) + " настроен заранее: частота " + D.fix[u] + ", её не менять."); return; }
      var items = [act(function () { return "Соседи: " + D.adj[u].map(function (j) { return "узел " + (j + 1) + " — " + (col[j] ? "частота " + col[j] : "без частоты"); }).join(", "); },
        function () { say("Соседи узла " + (u + 1) + ": " + D.adj[u].map(function (j) { return "узел " + (j + 1) + " — " + (col[j] ? "частота " + col[j] : "без частоты"); }).join(", ") + "."); })];
      for (var c = 1; c <= k; c++) (function (c) { items.push(pick("Частота " + c + (c === k ? ", резервная" : ""), function () { setF(u, c); })); })(c);
      items.push(pick("Без частоты", function () { setF(u, 0); }));
      items.push(backItem());
      UIx("menu", "Частота узла " + (u + 1), items);
    };
    var nodeItem = function (u) { return act(function () { return nodeLabel(u); }, function () { picker(u); }); };
    var status = function () {
      var none = intList(n).filter(function (u) { return !col[u]; }).map(function (u) { return u + 1; }), cf = fqConflicts(G, col);
      return intList(n).map(function (u) { return (u + 1) + " — " + (col[u] || "нет"); }).join(", ") + ". " + (none.length ? "Без частоты: " + andList(none) + ". " : "") +
        (cf.length ? "Помехи: " + cf.map(function (e) { return (e[0] + 1) + " и " + (e[1] + 1); }).join("; ") + ". " : "Помех нет. ") + "На резервной: " + cnt(fqReserve(G, col), "m", "узел", "узла", "узлов") + ".";
    };
    var out = [];
    if (!D.groups) for (var u = 0; u < n; u++) out.push(nodeItem(u));
    else D.groups.forEach(function (g, gi) {
      var title = gi ? "Узлы с шестого по десятый" : "Узлы с первого по пятый";
      out.push(act(function () { var c = 0; for (var x = g[0]; x <= g[1]; x++) if (col[x]) c++; return title + ": с частотой " + c + " из 5"; }, function () {
        var items = []; for (var x = g[0]; x <= g[1]; x++) items.push(nodeItem(x));
        items.push(backItem());
        UIx("menu", title, items);
      }));
    });
    out.push(act("Что сейчас", function () { say("Частоты узлов: " + status()); }));
    out.push(act("Включить связь", function () {
      var none = intList(n).filter(function (u) { return !col[u]; }).map(function (u) { return u + 1; });
      if (none.length) { nope("Без частоты " + (none.length === 1 ? "узел " : "узлы ") + andList(none) + "."); return; }
      var cf = fqConflicts(G, col);
      if (cf.length) { A("play", "jam"); fail("В эфире треск: помехи у " + cf.map(function (e) { return "узлов " + (e[0] + 1) + " и " + (e[1] + 1) + " на частоте " + col[e[0]]; }).join("; ") + "."); return; }
      var rv = fqReserve(G, col);
      if (rv > D.limitR) { A("play", "term_err"); fail("Резервная частота занята на " + pcnt(rv, "узле", "узлах") + ", а дают не больше чем на " + pcnt(D.limitR, "узле", "узлах") + "."); return; }
      A("play", "radio");
      /* (после 4.5, нелогичность) без резервной можно было обойтись — было «можно было занять ни разу» */
      win(last, finish, "Связь чистая: все узлы слышат друг друга без помех. На резервной частоте — " + cnt(rv, "m", "узел", "узла", "узлов") + ".", rv === D.minR,
        D.minR ? "резервную можно было занять всего на " + pcnt(D.minR, "узле", "узлах") : "резервную можно было не занимать вовсе");
    }));
    out.push(act("Сбросить частоты", function () {
      if (col.every(function (c, u) { return c === D.fix[u]; })) { say("Сбрасывать нечего: заданы только заранее настроенные узлы."); return; }
      col = D.fix.slice(); A("play", "term_off"); say("Частоты сброшены, кроме заранее настроенных узлов.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   6. МАРШРУТ ОБХОДА
   Обойти все помещения по разу, выйдя из дежурки, по схеме переходов
   (гамильтонов путь). Простая — пять помещений, переходы двусторонние;
   средняя — шесть, есть переходы «только туда», и кончить надо у
   выхода; сложная — семь, переходы «только туда», одно помещение надо
   пройти раньше другого, а заряда фонаря — на ограниченное время.
   Образцовое — самый быстрый обход.
   ════════════════════════════════════════════════════════════════════ */
var ROOMS = ["склад", "насосная", "медблок", "виварий", "щитовая", "архив", "кухня", "прачечная", "мастерская", "радиорубка", "оранжерея", "котельная", "библиотека", "столовая", "гараж", "душевая", "кладовая", "лаборатория"];
function mins(v) { return pl(v, "минута", "минуты", "минут"); }
function minsAcc(v) { return pl(v, "минуту", "минуты", "минут"); }
/* (после 4.5, нелогичность) g === "f" — женский род: «в одной клетке» (было «в одном клетке») */
function pcnt(n, one, many, g) { return (n === 1 ? (g === "f" ? "одной" : "одном") : n <= 10 ? GENW[n] : String(n)) + " " + (n % 10 === 1 && n % 100 !== 11 ? one : many); }
function rtPaths(n, out, capn) {
  var res = [], path = [0];
  var rec = function (mask, t) {
    if (res.length >= capn) return;
    if (mask === (1 << n) - 1) { res.push({ p: path.slice(), t: t }); return; }
    var cur = path[path.length - 1];
    for (var i = 0; i < out[cur].length; i++) { var e = out[cur][i]; if (mask >> e.to & 1) continue; path.push(e.to); rec(mask | (1 << e.to), t + e.t); path.pop(); }
  };
  rec(1, 0);
  return res;
}
function rtValid(D, p, t) {
  if (D.end >= 0 && p[p.length - 1] !== D.end) return false;
  if (D.pre && p.indexOf(D.pre[0]) > p.indexOf(D.pre[1])) return false;
  if (D.L && t > D.L) return false;
  return true;
}
function genRoute(seed, d, depth) {
  var r = rngFor(seed, "route", d), n = [5, 6, 7][d], guard, i, D = null, sols = null;
  for (guard = 0; guard < 300 && !sols; guard++) {
    var names = ["дежурка"].concat(choose(r, ROOMS.length, n - 1).map(function (k) { return ROOMS[k]; }));
    var edges = [], has = {};
    var addE = function (a, b) { var key = Math.min(a, b) + "-" + Math.max(a, b); if (a === b || has[key]) return false; has[key] = 1; edges.push({ a: a, b: b, t: r.int(2, 9), one: false }); return true; };
    for (i = 1; i < n; i++) addE(r.int(0, i - 1), i);
    var extra = r.int([2, 3, 4][d], [3, 4, 6][d]), et = 0;
    while (extra > 0 && et++ < 60) if (addE(r.int(0, n - 1), r.int(0, n - 1))) extra--;
    var nOne = [0, 2, r.int(2, 3)][d], ones = choose(r, edges.length, Math.min(nOne, edges.length));
    ones.forEach(function (k) { var e = edges[k]; e.one = true; if (r.chance(0.5)) { var x = e.a; e.a = e.b; e.b = x; } });
    var out = []; for (i = 0; i < n; i++) out.push([]);
    edges.forEach(function (e) { out[e.a].push({ to: e.b, t: e.t }); if (!e.one) out[e.b].push({ to: e.a, t: e.t }); });
    var all = rtPaths(n, out, 1000);
    if (all.length < 2) continue;
    D = { n: n, names: names, edges: edges, out: out, end: -1, pre: null, L: 0 };
    if (d === 1) {
      var ends = {}; all.forEach(function (x) { var e = x.p[n - 1]; ends[e] = (ends[e] || 0) + 1; });
      var okE = Object.keys(ends).filter(function (e) { return ends[e] >= 2 && ends[e] <= 10 && ends[e] < all.length; });
      if (!okE.length) continue;
      D.end = +r.pick(okE);
    }
    if (d === 2) {
      var hp = r.pick(all).p, a = r.int(1, n - 2), b = r.int(a + 1, n - 1);
      D.pre = [hp[a], hp[b]];
      var tl = all.filter(function (x) { return rtValid(D, x.p, x.t); }).map(function (x) { return x.t; }).sort(function (x, y) { return x - y; });
      if (tl.length < 2) continue;
      var Lc = 0; for (var q = 1; q < tl.length; q++) { var c = tl.filter(function (t) { return t <= tl[q]; }).length; if (c >= 2 && c <= 6 && c < tl.length) Lc = tl[q]; }
      if (!Lc) continue;
      D.L = Lc;
    }
    var ok = all.filter(function (x) { return rtValid(D, x.p, x.t); });
    if (ok.length < 2 || ok.length > [12, 10, 8][d] || ok.length === all.length && d === 2) continue;
    var mt = Math.min.apply(null, ok.map(function (x) { return x.t; }));
    if (!ok.some(function (x) { return x.t > mt; }) && r.chance(0.7)) continue;
    sols = ok;
  }
  if (!sols) return genRoute(seed + 7919, d, (depth || 0) + 1);
  var minT = Math.min.apply(null, sols.map(function (x) { return x.t; }));
  var best = sols.filter(function (x) { return x.t === minT; }), other = sols.filter(function (x) { return x.t !== minT; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (x) { var p = []; for (var j = 1; j < x.p.length; j++) p.push("Дальше", cap(D.names[x.p[j]])); p.push("Сдать маршрут"); return p; };
  var es = D.edges.map(function (e) { return e.a + (e.one ? ">" : "-") + e.b + ":" + e.t; }).sort();
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (x) { return x.t === minT; }),
    answers: altS.map(function (x) { return { path: x.p.slice() }; }), wrong: rep(["Начать заново", "Сдать маршрут"], 3), sol: sols.length,
    sig: "route|" + d + "|" + n + "|" + es.join(",") + "|" + D.end + "|" + (D.pre ? D.pre.join(">") : "") + "|" + D.L,
    data: { n: n, names: D.names, edges: D.edges.map(function (e) { return { a: e.a, b: e.b, t: e.t, one: e.one }; }), end: D.end, pre: D.pre, L: D.L, minT: minT, sol: sols.length,
      paths: sols.map(function (x) { return x.p.join(","); }).sort() } };
}
function checkRoute(P, ans) {
  var D = P.data, p = ans && ans.path, t = 0, seen = {};
  if (!p || p[0] !== 0 || p.length !== D.n) return { ok: false, best: false, why: "обойдены не все помещения" };
  seen[0] = 1;
  for (var i = 1; i < p.length; i++) {
    var a = p[i - 1], b = p[i], e = null;
    if (seen[b]) return { ok: false, best: false, why: "помещение дважды" };
    seen[b] = 1;
    D.edges.forEach(function (x) { if ((x.a === a && x.b === b) || (!x.one && x.a === b && x.b === a)) e = x; });
    if (!e) return { ok: false, best: false, why: "перехода нет" };
    t += e.t;
  }
  if (!rtValid(D, p, t)) return { ok: false, best: false, why: "не по условию" };
  return { ok: true, best: t === D.minT, why: "" };
}
function route(seed, cb, opts) {
  var d = diffOf(opts), P = genRoute(seed, d), D = P.data, n = D.n, nm = D.names;
  var out = []; for (var i0 = 0; i0 < n; i0++) out.push([]);
  D.edges.forEach(function (e) { out[e.a].push({ to: e.b, t: e.t }); if (!e.one) out[e.b].push({ to: e.a, t: e.t }); });
  out.forEach(function (l) { l.sort(function (x, y) { return x.to - y.to; }); });
  var path = [0], time = 0, steps = [];
  var q = function (k) { return "«" + nm[k] + "»"; };
  var edgeTxt = D.edges.slice().sort(function (x, y) { return Math.min(x.a, x.b) - Math.min(y.a, y.b) || Math.max(x.a, x.b) - Math.max(y.a, y.b); })
    .map(function (e) { return nm[e.a] + " — " + nm[e.b] + ", " + e.t + " " + mins(e.t) + (e.one ? ", только туда" : ""); });
  var cond = head(opts, d) + "Маршрут обхода. Обходчик выходит из дежурки и должен побывать во всех помещениях, в каждом — ровно один раз" +
    (D.end >= 0 ? "; закончить надо в помещении " + q(D.end) + ": там выход" : ", а закончить можно где угодно") + ". Помещения: " + andList(nm) + ". Переходы и время на них: " + edgeTxt.join("; ") + ". " +
    (d === 0 ? "Все переходы двусторонние." : "Переходы двусторонние, кроме отмеченных «только туда»: по ним можно лишь от первого помещения ко второму.") +
    /* (после 4.5, нелогичность) «только после «склад»» — падеж: «после помещения «склад»» */
    (D.pre ? " В помещении " + q(D.pre[0]) + " висит ключ от помещения " + q(D.pre[1]) + ": туда — только после помещения " + q(D.pre[0]) + "." : "") +
    (D.L ? " Заряда фонаря — на " + D.L + " " + minsAcc(D.L) + "." : "") + " Решений несколько, годится любое; образцовое — самый быстрый обход.";
  var last = start("route", d, P, "Маршрут обхода", cond, function (st, finish, fail) {
    var cur = function () { return path[path.length - 1]; };
    var left = function () { return intList(n).filter(function (k) { return path.indexOf(k) < 0; }); };
    var exits = function () { return out[cur()].filter(function (e) { return path.indexOf(e.to) < 0; }); };
    var routeTxt = function () { return path.map(function (k) { return nm[k]; }).join(", ") + " — " + time + " " + mins(time); };
    var go = function (e) {
      if (D.pre && e.to === D.pre[1] && path.indexOf(D.pre[0]) < 0) { nope("Помещение " + q(D.pre[1]) + " заперто: ключ от него висит в помещении " + q(D.pre[0]) + "."); return; }
      path.push(e.to); steps.push(e.t); time += e.t; A("play", "step_concrete");
      var lf = left();
      sayq(cap(nm[e.to]) + ". Пройдено: " + routeTxt() + "." + (lf.length ? " Осталось: " + andList(lf.map(function (k) { return nm[k]; })) + "." + (exits().length ? "" : " Отсюда хода в необойдённые помещения нет.") : " Обойдено всё."));
    };
    return [
      act(function () { return "Маршрут: " + routeTxt(); }, function () { var lf = left(); say("Маршрут: " + routeTxt() + "." + (lf.length ? " Не обойдены: " + andList(lf.map(function (k) { return nm[k]; })) + "." : " Обойдено всё.")); }),
      act(function () { return "Дальше: сейчас " + nm[cur()] + ", обойдено " + path.length + " из " + n; }, function () {
        var ex = exits();
        if (!left().length) { nope("Обойдено всё: сдайте маршрут."); return; }
        if (!ex.length) { nope("Из помещения " + q(cur()) + " хода в необойдённые помещения нет. Уберите шаг или начните заново."); return; }
        var items = ex.map(function (e) { return pick(cap(nm[e.to]) + ", " + e.t + " " + mins(e.t), function () { go(e); }); });
        items.push(backItem());
        UIx("menu", "Куда дальше", items);
      }),
      act("Убрать последний шаг", function () {
        if (path.length < 2) { nope("Убирать нечего: вы в дежурке."); return; }
        var k = path.pop(); time -= steps.pop(); A("play", "term_off");
        say("Шаг в помещение " + q(k) + " убран. Маршрут: " + routeTxt() + ".");
      }),
      act("Сдать маршрут", function () {
        var lf = left();
        if (lf.length) { A("play", "term_err"); fail("Маршрут обходит не всё: нет " + (lf.length === 1 ? "помещения " : "помещений ") + andList(lf.map(q)) + "."); return; }
        if (D.end >= 0 && cur() !== D.end) { A("play", "term_err"); fail("Обход кончается в помещении " + q(cur()) + ", а выход — в помещении " + q(D.end) + "."); return; }
        if (D.pre && path.indexOf(D.pre[0]) > path.indexOf(D.pre[1])) { A("play", "term_err"); fail("В помещение " + q(D.pre[1]) + " без ключа не попасть, а ключ висит в помещении " + q(D.pre[0]) + ", которое по маршруту позже."); return; }
        if (D.L && time > D.L) { A("play", "term_err"); fail("Обход займёт " + time + " " + minsAcc(time) + ", а фонаря хватит на " + D.L + "."); return; }
        A("play", "door_unlock");
        win(last, finish, "Обход утверждён: " + time + " " + mins(time) + ".", time === D.minT, "можно было за " + D.minT + " " + minsAcc(D.minT));
      }),
      act("Начать заново", function () {
        if (path.length < 2) { say("Маршрут и так начинается в дежурке."); return; }
        path = [0]; time = 0; steps = []; A("play", "term_off"); say("Маршрут стёрт: вы снова в дежурке.");
      })
    ];
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   7. КЛАПАНЫ ДАВЛЕНИЯ
   Каждый клапан меняет давление в одном-двух баках; открыть набор
   клапанов, чтобы во всех баках стало нужное давление. Ниже нуля
   давление не опускается: такой клапан не откроется. Простая — два бака
   и четыре клапана; средняя — три бака и шесть клапанов; сложная — три
   бака, семь клапанов и предел сверху: перескочит — аварийный сброс (это
   ошибка), так что важен порядок. Образцовое — меньше всего клапанов.
   ════════════════════════════════════════════════════════════════════ */
var TANK = ["А", "Б", "В", "Г"];
function vlDesc(e) { var a = []; for (var i = 0; i < e.length; i++) if (e[i]) a.push("в баке " + TANK[i] + " " + sgn(e[i])); return a.join(", "); }
function vlSafe(D, S) {
  /* есть ли порядок открыть все клапаны S, не выходя за пределы; возвращает порядок или null */
  var ks = [], i; for (i = 0; i < D.eff.length; i++) if (S >> i & 1) ks.push(i);
  var m = D.p0.length, full = (1 << ks.length) - 1, prev = {}, seen = {}, q = [0];
  var pres = function (mask) { var p = D.p0.slice(); for (var a = 0; a < ks.length; a++) if (mask >> a & 1) for (var t = 0; t < m; t++) p[t] += D.eff[ks[a]][t]; return p; };
  seen[0] = 1;
  for (var qi = 0; qi < q.length; qi++) {
    var mk = q[qi];
    if (mk === full) { var ord = []; while (mk) { var pr = prev[mk]; ord.unshift(ks[pr.a]); mk = pr.from; } return ord; }
    var p = pres(mk);
    for (var a = 0; a < ks.length; a++) {
      if (mk >> a & 1) continue;
      var nm = mk | (1 << a); if (seen[nm]) continue;
      var ok = true;
      for (var t = 0; t < m; t++) { var v = p[t] + D.eff[ks[a]][t]; if (v < 0 || (D.cap && v > D.cap)) { ok = false; break; } }
      if (!ok) continue;
      seen[nm] = 1; prev[nm] = { from: mk, a: a }; q.push(nm);
    }
  }
  return null;
}
function vlFinal(D, S) { var p = D.p0.slice(); for (var k = 0; k < D.eff.length; k++) if (S >> k & 1) for (var t = 0; t < p.length; t++) p[t] += D.eff[k][t]; return p; }
function genValves(seed, d, depth) {
  var r = rngFor(seed, "valves", d), m = [2, 3, 3][d], nv = [4, 6, 7][d], capP = d === 2 ? 12 : 0, guard, k, t, D = null, sols = null;
  for (guard = 0; guard < 400 && !sols; guard++) {
    var p0 = []; for (t = 0; t < m; t++) p0.push(r.int(1, d === 2 ? 7 : 5));
    var eff = [];
    for (k = 0; k < nv; k++) {
      var e = rep(0, m), i = r.int(0, m - 1), kind = r.int(0, d === 0 ? 1 : 3), a = r.int(1, 4);
      if (kind === 0) e[i] = a;
      else if (kind === 1) { var j = (i + r.int(1, m - 1)) % m; e[i] = -a; e[j] = a; }
      else if (kind === 2) e[i] = -a;
      else { var j2 = (i + r.int(1, m - 1)) % m; e[i] = a; e[j2] = r.chance(0.5) ? a : -r.int(1, 3); }
      eff.push(e);
    }
    var H = choose(r, nv, r.int(2, d === 0 ? 3 : 4)), Hm = 0;
    H.forEach(function (h) { Hm |= 1 << h; });
    D = { p0: p0, eff: eff, cap: capP, target: null };
    var tg = vlFinal(D, Hm);
    if (tg.join() === p0.join()) continue;
    D.target = tg;
    if (!vlSafe(D, Hm)) continue;
    var count = function () { var out = []; for (var S = 1; S < (1 << nv); S++) { if (vlFinal(D, S).join() !== tg.join()) continue; var ord = vlSafe(D, S); if (ord) out.push({ S: S, ord: ord, n: popcount(S) }); } return out; };
    var list = count();
    if (list.length < 2 && H.length >= 2) {
      /* второй путь: клапан, который делает то же, что два клапана решения вместе */
      var h1 = H[0], h2 = H[1], comb = eff[h1].map(function (x, q) { return x + eff[h2][q]; });
      var nz = comb.filter(function (x) { return x; }).length, big = comb.some(function (x) { return Math.abs(x) > 6; });
      var spare = intList(nv).filter(function (x) { return !(Hm >> x & 1); });
      if (nz >= 1 && nz <= 2 && !big && spare.length) { eff[r.pick(spare)] = comb; list = count(); }
    }
    if (list.length < 2 || list.length > 12) continue;
    var mn = Math.min.apply(null, list.map(function (x) { return x.n; }));
    if (mn < 2) continue;
    var dup = {}; if (eff.some(function (x) { var s = x.join(); if (dup[s] || !x.some(function (y) { return y; })) return true; dup[s] = 1; return false; })) continue;
    if (d === 2) {
      /* ловушка: открывать образцовые клапаны просто по номерам — сорвёт мембрану */
      var bestS = list.filter(function (x) { return x.n === mn; })[0].S, p = p0.slice(), bad = false;
      for (k = 0; k < nv; k++) if (bestS >> k & 1) { for (t = 0; t < m; t++) { p[t] += eff[k][t]; if (p[t] < 0 || p[t] > capP) bad = true; } }
      if (!bad && r.chance(0.5)) continue;
    }
    sols = list;
  }
  if (!sols) return genValves(seed + 7919, d, (depth || 0) + 1);
  var minV = Math.min.apply(null, sols.map(function (x) { return x.n; }));
  var best = sols.filter(function (x) { return x.n === minV; }), other = sols.filter(function (x) { return x.n !== minV; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (x) { return x.ord.map(function (k2) { return "Клапан " + (k2 + 1); }).concat(["Пустить в работу"]); };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (x) { return x.n === minV; }),
    answers: altS.map(function (x) { return { open: x.ord.slice() }; }), wrong: rep(["Закрыть все клапаны", "Пустить в работу"], 3), sol: sols.length,
    sig: "valves|" + d + "|" + D.p0.join(",") + "|" + D.target.join(",") + "|" + D.eff.map(function (x) { return x.join(","); }).sort().join(";"),
    data: { p0: D.p0, eff: D.eff, cap: D.cap, target: D.target, minV: minV, sol: sols.length, sets: sols.map(function (x) { return x.S; }).sort(function (a, b) { return a - b; }) } };
}
function checkValves(P, ans) {
  var D = P.data, p = D.p0.slice(), open = {}, o = ans && ans.open;
  if (!o || !o.length) return { ok: false, best: false, why: "ни один клапан не открыт" };
  for (var i = 0; i < o.length; i++) {
    var k = o[i]; if (!(k >= 0 && k < D.eff.length) || open[k]) return { ok: false, best: false, why: "такого клапана нет или он уже открыт" };
    open[k] = 1;
    for (var t = 0; t < p.length; t++) { p[t] += D.eff[k][t]; if (p[t] < 0 || (D.cap && p[t] > D.cap)) return { ok: false, best: false, why: "давление вышло за предел" }; }
  }
  if (p.join() !== D.target.join()) return { ok: false, best: false, why: "давление не то" };
  return { ok: true, best: o.length === D.minV, why: "" };
}
function valves(seed, cb, opts) {
  var d = diffOf(opts), P = genValves(seed, d), D = P.data, m = D.p0.length, nv = D.eff.length;
  var p = D.p0.slice(), open = rep(false, nv);
  var tanks = function (arr) { return andList(arr.map(function (v, t) { return "в баке " + TANK[t] + " — " + v; })); };
  var cond = head(opts, d) + "Клапаны давления. " + cap(cnt(m, "m", "бак", "бака", "баков")) + ": " + andList(TANK.slice(0, m)) + ". Давление по манометрам сейчас: " + tanks(D.p0) + ". Нужно: " + tanks(D.target) +
    ". Клапаны: " + D.eff.map(function (e, k) { return "клапан " + (k + 1) + " — " + vlDesc(e); }).join("; ") + ". Открытый клапан действует сразу; закрыть его — вернуть, как было. Ниже нуля давление не опускается: такой клапан просто не сработает." +
    (D.cap ? " А выше " + D.cap + " — срыв мембраны: сработает аварийный сброс, все клапаны закроются, давление вернётся к началу, и это ошибка. Так что важен порядок." : "") +
    " Решений несколько, годится любое; образцовое — с наименьшим числом открытых клапанов.";
  var last = start("valves", d, P, "Клапаны давления", cond, function (st, finish, fail) {
    var openList = function () { var a = []; for (var k = 0; k < nv; k++) if (open[k]) a.push(k + 1); return a; };
    var status = function () { var ol = openList(); return "Давление: " + p.map(function (v, t) { return "бак " + TANK[t] + " — " + v + ", нужно " + D.target[t]; }).join("; ") + ". " + (ol.length ? (ol.length === 1 ? "Открыт клапан " : "Открыты клапаны ") + andList(ol) : "Все клапаны закрыты") + "."; };
    var out = intList(nv).map(function (k) {
      return act(function () { return "Клапан " + (k + 1) + ": " + vlDesc(D.eff[k]) + " — " + (open[k] ? "открыт" : "закрыт"); }, function () {
        var sg = open[k] ? -1 : 1, np = p.map(function (v, t) { return v + sg * D.eff[k][t]; });
        var low0 = -1, high = -1;
        np.forEach(function (v, t) { if (v < 0 && low0 < 0) low0 = t; if (D.cap && v > D.cap && high < 0) high = t; });
        if (low0 >= 0) { nope("Клапан не " + (open[k] ? "закрыть" : "открыть") + ": в баке " + TANK[low0] + " всего " + p[low0] + ", ниже нуля давление не опустить."); return; }
        if (high >= 0) {
          p = D.p0.slice(); open = rep(false, nv); A("play", "alarm_short");
          fail("Бак " + TANK[high] + ": давление " + np[high] + " при пределе " + D.cap + ". Сработал аварийный сброс: все клапаны закрыты, давление как в начале.");
          return;
        }
        p = np; open[k] = !open[k]; A("play", open[k] ? "ev_steam" : "term_off");
        sayq("Клапан " + (k + 1) + (open[k] ? " открыт. " : " закрыт. ") + "Давление: " + p.map(function (v, t) { return TANK[t] + " — " + v; }).join(", ") + ".");
      });
    });
    out.push(act(function () { return "Давление в баках: " + p.map(function (v, t) { return TANK[t] + " " + v + " из " + D.target[t]; }).join(", "); }, function () { say(status()); }));
    out.push(act("Пустить в работу", function () {
      var badT = -1; p.forEach(function (v, t) { if (v !== D.target[t] && badT < 0) badT = t; });
      if (badT >= 0) { A("play", "term_err"); fail("Бак " + TANK[badT] + ": давление " + p[badT] + ", а нужно " + D.target[badT] + ". Насосы не запустились."); return; }
      var c = openList().length; A("play", "room_pumps");
      win(last, finish, "Давление во всех баках как надо, насосы пошли. Открыто " + cnt(c, "m", "клапан", "клапана", "клапанов") + ".", c === D.minV, "хватило бы " + gcnt(D.minV, "клапана", "клапанов"));
    }));
    out.push(act("Закрыть все клапаны", function () {
      if (!openList().length) { say("Все клапаны и так закрыты. " + status()); return; }
      p = D.p0.slice(); open = rep(false, nv); A("play", "term_off"); say("Все клапаны закрыты, давление как в начале.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   8. СМЕСЬ ПО ПРОПОРЦИИ
   Из воды и растворов разной крепости налить ровно нужный объём нужной
   крепости, по литру. Простая — вода и два раствора, запаса хватает;
   средняя — вода и три раствора, запас мал, и очевидной пары не хватит;
   сложная — в два этапа: смесь первого бака идёт во второй, а запас
   общий, так что выбор на первом этапе меняет второй. Образцовое — где
   самого крепкого (дефицитного) раствора ушло меньше всего.
   ════════════════════════════════════════════════════════════════════ */
function lit(v) { return pl(v, "литр", "литра", "литров"); }
function pct(v) { return pl(v, "процент", "процента", "процентов"); }
/* (после 4.5, нелогичность) родительный падеж — после «из» и «около»: «из 4 литров», «около 3 процентов»
   (было «из 4 литра», «около 3 процента», «около 51 процент») */
function litGen(v) { return pl(v, "литра", "литров", "литров"); }
function pctGen(v) { return pl(v, "процента", "процентов", "процентов"); }
function mxComps(comps, V, C, needLast) {
  /* все наборы по литру: сумма V, вещества C·V, не больше запаса; needLast — последний компонент хотя бы литр */
  var out = [], v = rep(0, comps.length), k = comps.length;
  var rec = function (i, left, sub) {
    if (i === k - 1) {
      if (left > comps[i].s) return;
      if (needLast && left < 1) return;
      if (sub + left * comps[i].c !== C * V) return;
      v[i] = left; out.push(v.slice()); v[i] = 0; return;
    }
    for (var x = 0; x <= Math.min(left, comps[i].s); x++) { v[i] = x; rec(i + 1, left - x, sub + x * comps[i].c); }
    v[i] = 0;
  };
  rec(0, V, 0);
  return out;
}
function mxName(c) { return c ? "раствор " + c + " " + pct(c) : "вода"; }
function genMixture(seed, d, depth) {
  var r = rngFor(seed, "mixture", d), guard, i, comps = null, V = 0, C = 0, V2 = 0, C2 = 0, sols = null, strong = 0;
  for (guard = 0; guard < 400 && !sols; guard++) {
    var k = d === 1 ? 3 : 2, cs = choose(r, 9, k).map(function (x) { return (x + 1) * 10; }).sort(function (a, b) { return a - b; });
    comps = [{ c: 0, s: 0 }].concat(cs.map(function (c) { return { c: c, s: 0 }; }));
    comps.forEach(function (x) { x.s = d === 0 ? r.int(6, 12) : d === 1 ? r.int(2, 8) : r.int(4, 10); });
    strong = comps.length - 1;
    var top = comps[strong].c;
    /* цель — из случайного набора по литру: крепость кратна пяти и не совпадает с готовым раствором */
    var aim = function (cs2, Vx, needLast, avoid) {
      for (var t = 0; t < 25; t++) {
        var v = rep(0, cs2.length), left = Vx, g = 0;
        if (needLast) { if (cs2[cs2.length - 1].s < 1) return -1; v[cs2.length - 1] = 1; left--; }
        while (left > 0 && g++ < 200) { var j = r.int(0, cs2.length - 1); if (v[j] < cs2[j].s) { v[j]++; left--; } }
        if (left) continue;
        var sub = 0; for (var q = 0; q < v.length; q++) sub += v[q] * cs2[q].c;
        if (sub % Vx || (sub / Vx) % 5) continue;
        var Cx = sub / Vx;
        if (Cx <= 0 || Cx >= top || cs2.some(function (x) { return x.c === Cx; }) || Cx === avoid) continue;
        return Cx;
      }
      return -1;
    };
    if (d < 2) {
      V = d === 0 ? r.int(5, 10) : r.int(8, 14);
      if (sum(comps.map(function (x) { return x.s; })) < V) continue;
      C = aim(comps, V, false, -1);
      if (C < 0) continue;
      var L = mxComps(comps, V, C, false);
      if (L.length < 2 || L.length > (d === 0 ? 8 : 10)) continue;
      if (d === 1) {
        /* ловушка: смеси из воды и одного раствора (или из двух растворов) не хватает запаса */
        var two = L.filter(function (v) { return v.filter(function (x) { return x; }).length <= 2; }).length;
        if (two === L.length && r.chance(0.6)) continue;
      }
      var mnS = Math.min.apply(null, L.map(function (v) { return v[strong]; }));
      if (!L.some(function (v) { return v[strong] > mnS; }) && r.chance(0.6)) continue;
      sols = L.map(function (v) { return { v: v, cost: v[strong] }; });
    } else {
      V = r.int(6, 10); V2 = r.int(4, 8);
      if (sum(comps.map(function (x) { return x.s; })) < V + V2) continue;
      C = aim(comps, V, false, -1);
      if (C < 0) continue;
      var S1 = mxComps(comps, V, C, false);
      if (!S1.length || S1.length > 12) continue;
      var h1 = r.pick(S1), rest0 = comps.map(function (x, j) { return { c: x.c, s: x.s - h1[j] }; }).concat([{ c: C, s: V }]);
      C2 = aim(rest0, V2, true, C);
      if (C2 < 0) continue;
      var pairs = [], fair = true;
      for (i = 0; i < S1.length && fair; i++) {
        var rest = comps.map(function (x, j) { return { c: x.c, s: x.s - S1[i][j] }; }).concat([{ c: C, s: V }]);
        var S2 = mxComps(rest, V2, C2, true);
        if (!S2.length) fair = false;
        S2.forEach(function (v2) { pairs.push({ v: S1[i], v2: v2, cost: S1[i][strong] + v2[strong] }); });
      }
      if (!fair || pairs.length < 2 || pairs.length > 40) continue;
      var mnc = Math.min.apply(null, pairs.map(function (p) { return p.cost; }));
      if (!pairs.some(function (p) { return p.cost > mnc; }) && r.chance(0.6)) continue;
      sols = pairs;
    }
  }
  if (!sols) return genMixture(seed + 7919, d, (depth || 0) + 1);
  var minC = Math.min.apply(null, sols.map(function (x) { return x.cost; }));
  var best = sols.filter(function (x) { return x.cost === minC; }), other = sols.filter(function (x) { return x.cost !== minC; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pref = function (j, n2) { return j === n2 ? "Смесь из бака А" : cap(comps[j].c ? "раствор " + comps[j].c : "вода"); };
  var pours = function (v, n2) { var p = []; for (var j = 0; j < v.length; j++) for (var t = 0; t < v[j]; t++) p.push(pref(j, n2)); p.push("Сдать смесь"); return p; };
  var pathOf = function (x) { return d < 2 ? pours(x.v, -1) : pours(x.v, -1).concat(pours(x.v2, comps.length)); };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (x) { return x.cost === minC; }),
    answers: altS.map(function (x) { return d < 2 ? { v: x.v.slice() } : { stages: [{ v: x.v.slice() }, { v: x.v2.slice() }] }; }),
    wrong: rep(["Слить всё", "Вода", "Сдать смесь"], 3), sol: sols.length, stages: d === 2 ? 2 : 1,
    sig: "mixture|" + d + "|" + comps.map(function (x) { return x.c + ":" + x.s; }).join(",") + "|" + V + ":" + C + (d === 2 ? "|" + V2 + ":" + C2 : ""),
    data: { comps: comps, V: V, C: C, V2: V2, C2: C2, strong: strong, min: minC, sol: sols.length, two: d === 2,
      sols: sols.map(function (x) { return x.v.join(",") + (x.v2 ? "/" + x.v2.join(",") : ""); }).sort() } };
}
function checkMixture(P, ans) {
  var D = P.data, stock = D.comps.map(function (x) { return x.s; });
  var one = function (comps, v, V, C, needA) {
    if (!v || v.length !== comps.length) return "нет набора";
    var vol = 0, sub = 0;
    for (var j = 0; j < v.length; j++) { if (!(v[j] >= 0) || v[j] > comps[j].s || v[j] !== Math.floor(v[j])) return "столько нет в запасе"; vol += v[j]; sub += v[j] * comps[j].c; }
    if (vol !== V) return "объём " + vol + ", а нужно " + V;
    if (sub !== C * V) return "крепость не та";
    if (needA && v[v.length - 1] < 1) return "смесь из бака А не использована";
    return "";
  };
  if (!ans) return { ok: false, best: false, why: "нет ответа" };
  if (!D.two) { var w = one(D.comps, ans.v, D.V, D.C, false); return { ok: !w, best: !w && ans.v[D.strong] === D.min, why: w }; }
  if (!ans.stages || ans.stages.length !== 2) return { ok: false, best: false, why: "этапов два" };
  var a = ans.stages[0].v, b = ans.stages[1].v, w1 = one(D.comps, a, D.V, D.C, false);
  if (w1) return { ok: false, best: false, why: "первый этап: " + w1 };
  var rest = D.comps.map(function (x, j) { return { c: x.c, s: stock[j] - a[j] }; }).concat([{ c: D.C, s: D.V }]);
  var w2 = one(rest, b, D.V2, D.C2, true);
  if (w2) return { ok: false, best: false, why: "второй этап: " + w2 };
  return { ok: true, best: a[D.strong] + b[D.strong] === D.min, why: "" };
}
function mixture(seed, cb, opts) {
  var d = diffOf(opts), P = genMixture(seed, d), D = P.data, two = D.two;
  var stage = 1, comps = D.comps.map(function (x) { return { c: x.c, s: x.s, name: mxName(x.c) }; }), tank = rep(0, comps.length), hist = [], usedStrong = 0;
  var needV = function () { return stage === 1 ? D.V : D.V2; }, needC = function () { return stage === 1 ? D.C : D.C2; };
  var vol = function () { return sum(tank); };
  var conc = function () { var v = vol(); if (!v) return ""; var s = 0; for (var j = 0; j < tank.length; j++) s += tank[j] * comps[j].c; return s % v ? "около " + Math.round(s / v) + " " + pctGen(Math.round(s / v)) : "ровно " + (s / v) + " " + pct(s / v); };
  var stockTxt = function (arr) { return andList(arr.map(function (x) { return x.name + " — " + (x.s ? x.s + " " + lit(x.s) : x.c ? "кончился" : "кончилась"); })); };
  var cond = head(opts, d) + "Смесь по пропорции. " + (two ?
    "Работа в два этапа, запас на оба — общий: " + stockTxt(comps) + ". " + stageText(1, 2) + ": в бак А нужно ровно " + D.V + " " + lit(D.V) + " по " + D.C + " " + pct(D.C) + ". " +
    stageText(2, 2) + ": в бак Б — ровно " + D.V2 + " " + lit(D.V2) + " по " + D.C2 + " " + pct(D.C2) + ", и смесь из бака А должна пойти в дело — хотя бы литр." :
    "Для промывки фильтров нужно ровно " + D.V + " " + lit(D.V) + " раствора крепостью " + D.C + " " + pct(D.C) + ". Есть: " + stockTxt(comps) + ".") +
    " Наливать можно по литру; мерный бак — ровно на нужный объём, больше не нальёшь. Крепость смеси — сколько процентов вещества во всём её объёме: например, 2 литра 50-процентного раствора и 2 литра воды дают 4 литра по 25 процентов." +
    " Решений несколько, годится любое; образцовое — где раствора " + D.comps[D.strong].c + " " + pct(D.comps[D.strong].c) + " ушло меньше всего: он дефицитный.";
  var last = start("mixture", d, P, "Смесь по пропорции", cond, function (st, finish, fail) {
    var status = function () { return (two ? stageText(stage, 2) + ". " : "") + "В баке " + (stage === 1 ? (two ? "А " : "") : "Б ") + vol() + " " + lit(vol()) + (vol() ? ", крепость " + conc() : "") + ". Нужно " + needV() + " " + lit(needV()) + " по " + needC() + " " + pct(needC()) + "."; };
    var out = comps.map(function (x, j) {
      var lbl = j === D.comps.length ? "Смесь из бака А, " + x.c + " " + pct(x.c) : cap(x.name);
      return act(function () { return lbl + ": в баке " + tank[j] + ", в запасе " + (x.s - tank[j]); }, function () {
        if (tank[j] >= x.s) { nope("Этого больше нет: запас кончился."); return; }
        if (vol() >= needV()) { nope("Бак полон: в нём уже " + vol() + " " + lit(vol()) + ", больше нужного не налить."); return; }
        tank[j]++; hist.push(j); A("play", "kettle_pour");
        sayq("Литр: " + (j === D.comps.length ? "смесь из бака А" : x.name) + ". В баке " + vol() + " " + lit(vol()) + ", крепость " + conc() + ".");
      });
    });
    out.push(act("Отлить последний литр", function () {
      if (!hist.length) { nope("Бак пуст."); return; }
      var j = hist.pop(); tank[j]--; A("play", "term_off");
      say("Литр вернули в запас. В баке " + vol() + " " + lit(vol()) + (vol() ? ", крепость " + conc() : "") + ".");
    }));
    out.push(act(function () { return "Что в баке: " + vol() + " из " + needV() + " " + litGen(needV()); }, function () { say(status()); }));
    out.push(act("Сдать смесь", function () {
      var v = vol(), s = 0; for (var j = 0; j < tank.length; j++) s += tank[j] * comps[j].c;
      if (!v) { nope("Бак пуст."); return; }
      if (v !== needV()) { A("play", "term_err"); fail("В баке " + v + " " + lit(v) + ", а нужно " + needV() + ". Лаборант не принял."); return; }
      if (s !== needC() * v) { A("play", "term_err"); fail("Крепость " + conc() + ", а нужно " + needC() + ". Смесь забракована."); return; }
      if (two && stage === 2 && tank[D.comps.length] < 1) { A("play", "term_err"); fail("Смесь из бака А не пошла в дело, а должна — хотя бы литр."); return; }
      usedStrong += tank[D.strong];
      if (two && stage === 1) {
        comps.forEach(function (x, q) { x.s -= tank[q]; });
        comps.push({ c: D.C, s: D.V, name: "смесь из бака А" });
        tank = rep(0, comps.length); hist = []; stage = 2; last.stage = 2;
        A("play", "ev_glass");
        var t2 = stageText(2, 2) + ": в бак Б нужно " + D.V2 + " " + lit(D.V2) + " по " + D.C2 + " " + pct(D.C2) + ", смесь из бака А — в дело, хотя бы литр. В запасе: " + stockTxt(comps.slice(0, D.comps.length)) + ".";
        st.cond = cond + " Первый этап пройден: в баке А " + D.V + " " + lit(D.V) + " по " + D.C + " " + pct(D.C) + ". " + t2;
        say(stageText(1, 2) + " готов: в баке А " + D.V + " " + lit(D.V) + " по " + D.C + " " + pct(D.C) + ". " + t2);
        return;
      }
      A("play", "ev_glass");
      win(last, finish, (two ? "Оба бака готовы. " : "Смесь принята: ровно " + D.V + " " + lit(D.V) + " по " + D.C + " " + pct(D.C) + ". ") + "Раствора " + D.comps[D.strong].c + " " + pct(D.comps[D.strong].c) + " ушло " + usedStrong + " " + lit(usedStrong) + ".", usedStrong === D.min,
        D.min ? "хватило бы " + gcnt(D.min, "литра", "литров") : "можно было обойтись вовсе без него");
    }));
    out.push(act("Слить всё", function () {
      if (!vol()) { say("Бак и так пуст."); return; }
      tank = rep(0, comps.length); hist = []; A("play", "term_off"); say("Бак слит, всё вернулось в запас.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   9. ДЕЛЁЖ ПАЙКОВ
   Ящики с порциями раздать бригадам по едокам: каждому человеку
   поровну, ящики не вскрывать. Простая — две бригады, доли названы;
   средняя — три бригады, доли считает игрок, и одно правило; сложная —
   три бригады, восемь ящиков и два-три правила (кому что нельзя, какие
   ящики вместе или порознь, кому хотя бы ящик воды). Образцовое — когда
   и ящиков у бригад как можно поровну.
   ════════════════════════════════════════════════════════════════════ */
var RT_TYPES = [{ n: "консервы", g: "консервов", a: "консервы", lo: 4, hi: 8 }, { n: "сухари", g: "сухарей", a: "сухари", lo: 3, hi: 6 }, { n: "крупа", g: "крупы", a: "крупу", lo: 5, hi: 9 },
  { n: "сгущёнка", g: "сгущёнки", a: "сгущёнку", lo: 2, hi: 5 }, { n: "вода", g: "воды", a: "воду", lo: 2, hi: 6 }, { n: "галеты", g: "галет", a: "галеты", lo: 3, hi: 7 }];
var BRIG = ["Ильина", "Коваля", "Серовой", "Нагиева", "Брагиной", "Тихонова", "Лапиной", "Петровой"];
/* почему бригаде нельзя такой ящик — своё для каждого вида; (после 4.5, нелогичность) без второго
   двоеточия в правиле: было «не давать галеты: в их штреке сыро: галеты отсыреют» */
var RT_NO = [["у них нет консервного ножа", "консервы они уже получили на неделе"], ["сухарей у них и так с запасом", "сухари им по норме не положены"],
  ["им негде варить, их печка сломана", "у них нет котла"], ["сгущёнку им по норме не положено", "сгущёнку они уже получили на неделе"],
  ["у них свой фильтр и своя вода", "воду им носят из своего колодца"], ["галет у них и так с запасом", "в их штреке сыро, галеты отсыреют"]];
function porc(v) { return pl(v, "порция", "порции", "порций"); }
function rtOk(D, to, full) {
  /* to[i] — бригада ящика i или -1; full — всё роздано и проверить доли */
  var load = rep(0, D.m), i, ru;
  for (i = 0; i < to.length; i++) if (to[i] >= 0) load[to[i]] += D.boxes[i].p;
  for (var k = 0; k < D.rules.length; k++) {
    ru = D.rules[k];
    if (ru.t === "no") { for (i = 0; i < to.length; i++) if (to[i] === ru.b && D.boxes[i].t === ru.ty) return { ok: false, why: "бригаде " + BRIG[D.names[ru.b]] + " не дают " + RT_TYPES[ru.ty].a }; }
    else if (ru.t === "with") { if (to[ru.x] >= 0 && to[ru.y] >= 0 && to[ru.x] !== to[ru.y]) return { ok: false, why: "ящики " + (ru.x + 1) + " и " + (ru.y + 1) + " должны быть у одной бригады" }; }
    else if (ru.t === "apart") { if (to[ru.x] >= 0 && to[ru.x] === to[ru.y]) return { ok: false, why: "ящики " + (ru.x + 1) + " и " + (ru.y + 1) + " должны быть у разных бригад" }; }
    else if (ru.t === "each" && full) {
      for (var b = 0; b < D.m; b++) { var has = false; for (i = 0; i < to.length; i++) if (to[i] === b && D.boxes[i].t === ru.ty) has = true; if (!has) return { ok: false, why: "бригаде " + BRIG[D.names[b]] + " не досталось ни ящика " + RT_TYPES[ru.ty].g }; }
    }
  }
  if (full) for (var j = 0; j < D.m; j++) if (load[j] !== D.need[j]) return { ok: false, why: "бригаде " + BRIG[D.names[j]] + " " + load[j] + " " + porc(load[j]) + ", а положено " + D.need[j], j: j };
  return { ok: true, why: "" };
}
function rtAll(D, capn) {
  var nb = D.boxes.length, to = rep(-1, nb), load = rep(0, D.m), out = [];
  var rec = function (i) {
    if (out.length >= capn) return;
    if (i === nb) { if (rtOk(D, to, true).ok) out.push(to.slice()); return; }
    for (var b = 0; b < D.m; b++) {
      if (load[b] + D.boxes[i].p > D.need[b]) continue;
      to[i] = b; load[b] += D.boxes[i].p;
      if (rtOk(D, to, false).ok) rec(i + 1);
      load[b] -= D.boxes[i].p; to[i] = -1;
    }
  };
  rec(0);
  return out;
}
function rtSpread(D, to) { var c = rep(0, D.m); to.forEach(function (b) { c[b]++; }); return Math.max.apply(null, c) - Math.min.apply(null, c); }
function genRations(seed, d, depth) {
  var r = rngFor(seed, "rations", d), m = d === 0 ? 2 : 3, nb = [6, 7, 8][d], guard, i, D = null, sols = null;
  for (guard = 0; guard < 400 && !sols; guard++) {
    var names = choose(r, BRIG.length, m), sizes = choose(r, 5, m).map(function (x) { return x + 2; });
    var q = r.int(2, d === 0 ? 4 : 3), need = sizes.map(function (s) { return s * q; });
    var per = rep(Math.floor(nb / m), m); for (i = 0; i < nb % m; i++) per[r.int(0, m - 1)]++;
    var boxes = [], hidden = [], okB = true;
    for (var b = 0; b < m && okB; b++) {
      var left = need[b];
      for (var c = 0; c < per[b]; c++) {
        var rest = per[b] - c - 1, lo = Math.max(2, left - rest * 9), hi = Math.min(9, left - rest * 2);
        if (lo > hi) { okB = false; break; }
        var p = c === per[b] - 1 ? left : r.int(lo, hi);
        var tys = intList(RT_TYPES.length).filter(function (t) { return RT_TYPES[t].lo <= p && p <= RT_TYPES[t].hi; });
        if (!tys.length) { okB = false; break; }
        boxes.push({ t: r.pick(tys), p: p }); hidden.push(b); left -= p;
      }
    }
    if (!okB) continue;
    var ord = intList(nb); r.shuffle(ord);
    boxes = ord.map(function (k) { return boxes[k]; }); hidden = ord.map(function (k) { return hidden[k]; });
    D = { m: m, names: names, sizes: sizes, q: q, need: need, boxes: boxes, rules: [] };
    var base = rtAll(D, 400);
    if (base.length < 2) continue;
    /* правила — из скрытого расклада, и каждое должно что-то отсекать */
    var nr = [0, 1, r.int(2, 3)][d], tries = 0, cur = base;
    while (D.rules.length < nr && tries++ < 30) {
      var kind = r.pick(d === 2 ? ["no", "with", "apart", "each"] : ["no", "with", "apart"]), ru = null;
      if (kind === "no") { var bb = r.int(0, m - 1), ty = r.pick(boxes.map(function (x) { return x.t; })); if (boxes.some(function (x, k) { return hidden[k] === bb && x.t === ty; })) continue; ru = { t: "no", b: bb, ty: ty, why: r.int(0, 1) }; }
      else if (kind === "with" || kind === "apart") { var xy = choose(r, nb, 2).sort(function (a, z) { return a - z; }); if ((hidden[xy[0]] === hidden[xy[1]]) !== (kind === "with")) continue; ru = { t: kind, x: xy[0], y: xy[1] }; }
      else { var ty2 = r.pick(boxes.map(function (x) { return x.t; })); var okE = true; for (var b2 = 0; b2 < m; b2++) if (!boxes.some(function (x, k) { return hidden[k] === b2 && x.t === ty2; })) okE = false; if (!okE) continue; ru = { t: "each", ty: ty2 }; }
      if (D.rules.some(function (z) { return JSON.stringify(z) === JSON.stringify(ru); })) continue;
      D.rules.push(ru);
      var nxt = cur.filter(function (to) { return rtOk(D, to, true).ok; });
      if (nxt.length === cur.length || nxt.length < 2) { D.rules.pop(); continue; }
      cur = nxt;
    }
    if (D.rules.length < nr) continue;
    if (D.rules.length) cur = rtAll(D, 31); /* счёт заново: прежний список мог упереться в потолок */
    if (cur.length < 2 || cur.length > 30) continue;
    var mnS = Math.min.apply(null, cur.map(function (to) { return rtSpread(D, to); }));
    if (!cur.some(function (to) { return rtSpread(D, to) > mnS; }) && r.chance(0.7)) continue;
    sols = cur;
  }
  if (!sols) return genRations(seed + 7919, d, (depth || 0) + 1);
  var minS = Math.min.apply(null, sols.map(function (to) { return rtSpread(D, to); }));
  var best = sols.filter(function (to) { return rtSpread(D, to) === minS; }), other = sols.filter(function (to) { return rtSpread(D, to) !== minS; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var bn = function (b) { return "Бригада " + BRIG[D.names[b]]; };
  var allowed = function (i2, b) { return !D.rules.some(function (ru) { return ru.t === "no" && ru.b === b && D.boxes[i2].t === ru.ty; }); };
  var pathOf = function (to) { var p = []; to.forEach(function (b, i2) { p.push("Ящик " + (i2 + 1), bn(b)); }); p.push("Раздать"); return p; };
  /* неверно: каждый ящик — первой бригаде, которой можно */
  var wt = D.boxes.map(function (x, i2) { for (var b = 0; b < D.m; b++) if (allowed(i2, b)) return b; return 0; });
  if (rtOk(D, wt, true).ok) wt = D.boxes.map(function (x, i2) { for (var b = D.m - 1; b >= 0; b--) if (allowed(i2, b)) return b; return 0; });
  if (rtOk(D, wt, true).ok) return genRations(seed + 7919, d, (depth || 0) + 1);
  var ruleSig = D.rules.map(function (ru) { return ru.t + ":" + (ru.b != null ? ru.b : "") + ":" + (ru.ty != null ? ru.ty : "") + ":" + (ru.x != null ? ru.x + "," + ru.y : ""); }).sort().join(";");
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (to) { return rtSpread(D, to) === minS; }),
    answers: altS.map(function (to) { return { to: to.slice() }; }), wrong: rep(pathOf(wt), 3), sol: sols.length,
    sig: "rations|" + d + "|" + D.sizes.join(",") + "|" + D.boxes.map(function (x) { return x.t + ":" + x.p; }).join(",") + "|" + ruleSig,
    data: { m: D.m, names: D.names, sizes: D.sizes, q: D.q, need: D.need, boxes: D.boxes, rules: D.rules, minS: minS, sol: sols.length,
      sols: sols.map(function (to) { return to.join(""); }).sort() } };
}
function checkRations(P, ans) {
  var D = P.data, to = ans && ans.to;
  if (!to || to.length !== D.boxes.length || to.some(function (b) { return !(b >= 0 && b < D.m); })) return { ok: false, best: false, why: "не все ящики розданы" };
  var e = rtOk(D, to, true);
  return { ok: e.ok, best: e.ok && rtSpread(D, to) === D.minS, why: e.why };
}
function rations(seed, cb, opts) {
  var d = diffOf(opts), P = genRations(seed, d), D = P.data, nb = D.boxes.length, to = rep(-1, nb);
  var bname = function (b) { return "бригада " + BRIG[D.names[b]]; };
  var boxTxt = function (i) { var x = D.boxes[i]; return RT_TYPES[x.t].n + ", " + x.p + " " + porc(x.p); };
  var people = sum(D.sizes), total = people * D.q;
  var ruleTxt = D.rules.map(function (ru) {
    if (ru.t === "no") return "бригаде " + BRIG[D.names[ru.b]] + " не давать " + RT_TYPES[ru.ty].a + ": " + RT_NO[ru.ty][ru.why];
    if (ru.t === "with") return "ящики " + (ru.x + 1) + " и " + (ru.y + 1) + " — одной бригаде: они в одной связке";
    if (ru.t === "apart") return "ящики " + (ru.x + 1) + " и " + (ru.y + 1) + " — разным бригадам: " + ["это неприкосновенный запас, его не держат в одних руках", "по описи они у разных бригадиров", "их понесут разными штреками"][(ru.x + ru.y) % 3];
    return "каждой бригаде — хотя бы один ящик " + RT_TYPES[ru.ty].g;
  });
  var cond = head(opts, d) + "Делёж пайков. " + cap(cnt(D.m, "f", "бригада", "бригады", "бригад")) + ": " + andList(intList(D.m).map(function (b) { return bname(b) + " — " + cnt(D.sizes[b], "m", "человек", "человека", "человек"); })) +
    ". Делить по едокам: каждому человеку поровну. На складе ящики: " + intList(nb).map(function (i) { return "ящик " + (i + 1) + " — " + boxTxt(i); }).join("; ") + ". " +
    (d === 0 ? "Всего " + total + " " + porc(total) + ", по " + D.q + " на человека: " + andList(intList(D.m).map(function (b) { return bname(b) + " — " + D.need[b]; })) + "." :
      "Всего " + total + " " + porc(total) + " — посчитайте, сколько положено каждой бригаде.") +
    " Ящики не вскрывают: каждый — целиком одной бригаде. Раздайте все." + (ruleTxt.length ? " " + (ruleTxt.length === 1 ? "Правило" : "Правила") + ": " + ruleTxt.join("; ") + "." : "") +
    " Решений несколько, годится любое; образцовое — когда и ящиков у бригад как можно поровну.";
  var last = start("rations", d, P, "Делёж пайков", cond, function (st, finish, fail) {
    var load = function (b) { var s = 0; for (var i = 0; i < nb; i++) if (to[i] === b) s += D.boxes[i].p; return s; };
    var boxesOf = function (b) { var c = 0; for (var i = 0; i < nb; i++) if (to[i] === b) c++; return c; };
    var status = function () {
      var free = intList(nb).filter(function (i) { return to[i] < 0; }).map(function (i) { return i + 1; });
      return intList(D.m).map(function (b) { return cap(bname(b)) + ": " + load(b) + " " + porc(load(b)) + (d === 0 ? " из " + D.need[b] : "") + ", " + cnt(boxesOf(b), "m", "ящик", "ящика", "ящиков"); }).join("; ") + ". " +
        (free.length ? "На складе: " + (free.length === 1 ? "ящик " : "ящики ") + andList(free) + "." : "На складе пусто.");
    };
    var give = function (i, b) {
      if (b >= 0 && D.rules.some(function (ru) { return ru.t === "no" && ru.b === b && D.boxes[i].t === ru.ty; })) { nope("Бригаде " + BRIG[D.names[b]] + " " + RT_TYPES[D.boxes[i].t].a + " не дают."); return; }
      to[i] = b; A("play", b >= 0 ? "open_crate" : "term_off");
      sayq("Ящик " + (i + 1) + (b >= 0 ? " — " + bname(b) + ": у неё теперь " + load(b) + " " + porc(load(b)) + "." : " — снова на складе."));
    };
    var out = intList(nb).map(function (i) {
      return act(function () { return "Ящик " + (i + 1) + ", " + boxTxt(i) + ": " + (to[i] >= 0 ? bname(to[i]) : "на складе"); }, function () {
        var items = intList(D.m).map(function (b) { return pick("Бригада " + BRIG[D.names[b]] + ": " + load(b) + " " + porc(load(b)) + ", ящиков " + boxesOf(b), function () { give(i, b); }); });
        items.push(pick("Оставить на складе", function () { give(i, -1); }));
        items.push(backItem());
        UIx("menu", "Кому ящик " + (i + 1), items);
      });
    });
    out.push(act("Что у бригад", function () { say(status()); }));
    out.push(act("Раздать", function () {
      var free = intList(nb).filter(function (i) { return to[i] < 0; }).map(function (i) { return i + 1; });
      if (free.length) { nope("На складе ещё " + (free.length === 1 ? "ящик " : "ящики ") + andList(free) + ": раздать надо всё."); return; }
      var e = rtOk(D, to, true);
      if (!e.ok) { A("play", "term_err"); fail("Бригадиры спорят: " + e.why + "."); return; }
      var sp = rtSpread(D, to); A("play", "open_locker");
      win(last, finish, "Пайки розданы без обиды: каждому едоку по " + D.q + " " + porc(D.q) + ".", sp === D.minS,
        D.minS ? "ящики можно было раздать ровнее: разница в " + cnt(D.minS, "m", "ящик", "ящика", "ящиков") : "ящиков можно было дать всем поровну");
    }));
    out.push(act("Собрать всё на склад", function () {
      if (to.every(function (b) { return b < 0; })) { say("Всё и так на складе."); return; }
      to = rep(-1, nb); A("play", "term_off"); say("Все ящики снова на складе.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   10. МАГИЧЕСКИЙ ЩИТ
   Щит предохранителей: в пустые гнёзда вставить номиналы от 1 до 9,
   чтобы суммы рядов и столбцов (а на средней и сложной — и диагоналей)
   совпали с табличками. Простая — три на три, четыре пустых гнезда
   углами прямоугольника; средняя — три на три с диагоналями, заполнена
   только одна линия через центр (иначе решение было бы одно); сложная —
   четыре на четыре с диагоналями, семь-восемь пустых. Образцовое —
   когда ни в одном ряду и ни в одном столбце номиналы не повторяются.
   ════════════════════════════════════════════════════════════════════ */
function mgLines(N, diag) {
  var L = [], i, j;
  for (i = 0; i < N; i++) { var row = []; for (j = 0; j < N; j++) row.push(i * N + j); L.push({ k: "r", i: i, cells: row }); }
  for (j = 0; j < N; j++) { var col = []; for (i = 0; i < N; i++) col.push(i * N + j); L.push({ k: "c", i: j, cells: col }); }
  if (diag) { var a = [], b = []; for (i = 0; i < N; i++) { a.push(i * N + i); b.push(i * N + (N - 1 - i)); } L.push({ k: "d", i: 0, cells: a }); L.push({ k: "d", i: 1, cells: b }); }
  return L;
}
function mgClean(N, g) {
  for (var i = 0; i < N; i++) { var rs = {}, cs = {}; for (var j = 0; j < N; j++) { var a = g[i * N + j], b = g[j * N + i]; if (rs[a] || cs[b]) return false; rs[a] = cs[b] = 1; } }
  return true;
}
function mgSolve(D, capn) {
  /* все заполнения пустых гнёзд; пустые — по порядку D.empty */
  var g = D.grid.slice(), E = D.empty, out = [], lines = D.lines.map(function (l, k) { return { cells: l.cells, t: D.sums[k] }; });
  var ofCell = {}; lines.forEach(function (l, k) { l.cells.forEach(function (c) { (ofCell[c] = ofCell[c] || []).push(k); }); });
  var fits = function (l) {
    var s = 0, free = 0; for (var q = 0; q < l.cells.length; q++) { var v = g[l.cells[q]]; if (v) s += v; else free++; }
    return free ? (s + free <= l.t && s + 9 * free >= l.t) : s === l.t;
  };
  var rec = function (i) {
    if (out.length >= capn) return;
    if (i === E.length) { out.push(E.map(function (c) { return g[c]; })); return; }
    var c = E[i], lo = 1, hi = 9;
    for (var f = 0; f < ofCell[c].length; f++) {
      var l = lines[ofCell[c][f]], s = 0, free = 0;
      for (var q2 = 0; q2 < l.cells.length; q2++) { var w = g[l.cells[q2]]; if (w) s += w; else if (l.cells[q2] !== c) free++; }
      if (!free) { lo = Math.max(lo, l.t - s); hi = Math.min(hi, l.t - s); }
      else { lo = Math.max(lo, l.t - s - 9 * free); hi = Math.min(hi, l.t - s - free); }
    }
    for (var v = lo; v <= hi; v++) {
      g[c] = v;
      var ok = true; for (var q = 0; q < ofCell[c].length; q++) if (!fits(lines[ofCell[c][q]])) { ok = false; break; }
      if (ok) rec(i + 1);
    }
    g[c] = 0;
  };
  rec(0);
  return out;
}
function mgLineName(l, N) { return l.k === "r" ? "ряд " + (l.i + 1) : l.k === "c" ? "столбец " + (l.i + 1) : (l.i ? "диагональ от правого верхнего угла" : "диагональ от левого верхнего угла"); }
function genMagic(seed, d, depth) {
  var r = rngFor(seed, "magic", d), N = d === 2 ? 4 : 3, guard, i, D = null, sols = null;
  for (guard = 0; guard < 400 && !sols; guard++) {
    var full = rep(0, N * N), okF = true;
    for (i = 0; i < N * N && okF; i++) {
      var rr = Math.floor(i / N), cc = i % N, can = [];
      for (var v = 1; v <= 9; v++) { var bad = false; for (var t = 0; t < N; t++) { if (full[rr * N + t] === v || full[t * N + cc] === v) bad = true; } if (!bad) can.push(v); }
      if (!can.length) okF = false; else full[i] = r.pick(can);
    }
    if (!okF) continue;
    var lines = mgLines(N, d >= 1), sums = lines.map(function (l) { var s = 0; l.cells.forEach(function (c) { s += full[c]; }); return s; });
    var empty;
    if (d === 0) { var rr2 = choose(r, 3, 2), cc2 = choose(r, 3, 2); empty = [rr2[0] * 3 + cc2[0], rr2[0] * 3 + cc2[1], rr2[1] * 3 + cc2[0], rr2[1] * 3 + cc2[1]]; }
    else if (d === 1) { var keepL = r.pick([[3, 4, 5], [1, 4, 7], [0, 4, 8], [2, 4, 6]]); empty = intList(9).filter(function (x) { return keepL.indexOf(x) < 0; }); }
    else empty = choose(r, N * N, r.int(7, 8));
    empty.sort(function (a, b) { return a - b; });
    var grid = full.slice(); empty.forEach(function (c) { grid[c] = 0; });
    D = { N: N, grid: grid, empty: empty, lines: lines, sums: sums, full: full };
    var L = mgSolve(D, 60);
    if (L.length < 2 || L.length > 40) continue;
    var cleanOf = function (fill) { var g2 = grid.slice(); empty.forEach(function (c, k) { g2[c] = fill[k]; }); return mgClean(N, g2); };
    if (!L.some(function (f) { return !cleanOf(f); }) && r.chance(0.8)) continue;
    var ones = empty.map(function () { return 1; });
    if (L.some(function (f) { return f.join() === ones.join(); })) continue;
    sols = L.map(function (f) { return { f: f, clean: cleanOf(f) }; });
  }
  if (!sols) return genMagic(seed + 7919, d, (depth || 0) + 1);
  var best = sols.filter(function (x) { return x.clean; }), other = sols.filter(function (x) { return !x.clean; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var cellP = function (c) { return "Ряд " + (Math.floor(c / N) + 1) + ", место " + (c % N + 1); };
  var pathOf = function (f) { var p = []; D.empty.forEach(function (c, k) { p.push(cellP(c), "Номинал " + f[k]); }); p.push("Проверить щит"); return p; };
  return { plan: pathOf(altS[0].f), alts: altS.map(function (x) { return pathOf(x.f); }), altBest: altS.map(function (x) { return x.clean; }),
    answers: altS.map(function (x) { return { fill: x.f.slice() }; }), wrong: rep(pathOf(D.empty.map(function () { return 1; })), 3), sol: sols.length,
    sig: "magic|" + d + "|" + N + "|" + D.grid.join(",") + "|" + D.sums.join(","),
    data: { N: N, grid: D.grid, empty: D.empty, lines: D.lines.map(function (l) { return { k: l.k, i: l.i, cells: l.cells }; }), sums: D.sums, sol: sols.length,
      fills: sols.map(function (x) { return x.f.join(","); }).sort(), clean: sols.filter(function (x) { return x.clean; }).length } };
}
function checkMagic(P, ans) {
  var D = P.data, f = ans && ans.fill, g = D.grid.slice();
  if (!f || f.length !== D.empty.length) return { ok: false, best: false, why: "не все гнёзда заполнены" };
  for (var k = 0; k < f.length; k++) { if (!(f[k] >= 1 && f[k] <= 9 && f[k] === Math.floor(f[k]))) return { ok: false, best: false, why: "номинал не от 1 до 9" }; g[D.empty[k]] = f[k]; }
  for (var q = 0; q < D.lines.length; q++) { var s = 0; D.lines[q].cells.forEach(function (c) { s += g[c]; }); if (s !== D.sums[q]) return { ok: false, best: false, why: mgLineName(D.lines[q], D.N) + ": сумма " + s + ", а нужно " + D.sums[q] }; }
  return { ok: true, best: mgClean(D.N, g), why: "" };
}
function magic(seed, cb, opts) {
  var d = diffOf(opts), P = genMagic(seed, d), D = P.data, N = D.N, g = D.grid.slice();
  var rowTxt = function (arr) { var o = []; for (var i = 0; i < N; i++) { var a = []; for (var j = 0; j < N; j++) a.push(arr[i * N + j] || "пусто"); o.push("Ряд " + (i + 1) + ": " + a.join(", ")); } return o.join(". "); };
  var sumsBy = function (k) { var a = []; D.lines.forEach(function (l, q) { if (l.k === k) a.push(D.sums[q]); }); return a; };
  var cond = head(opts, d) + "Магический щит. Щит предохранителей " + (N === 3 ? "три на три" : "четыре на четыре") + ": ряды сверху вниз, места в ряду слева направо; номиналы — от 1 до 9. " + rowTxt(D.grid) +
    ". Таблички: суммы рядов — " + andList(sumsBy("r")) + "; суммы столбцов — " + andList(sumsBy("c")) + (d >= 1 ? "; диагональ от левого верхнего угла — " + sumsBy("d")[0] + ", от правого верхнего — " + sumsBy("d")[1] : "") +
    ". Вставьте предохранители в пустые гнёзда, чтобы все суммы совпали с табличками. Решений несколько, годится любое; образцовое — когда ни в одном ряду и ни в одном столбце номиналы не повторяются.";
  var last = start("magic", d, P, "Магический щит", cond, function (st, finish, fail) {
    var lineNow = function (l, q) { var s = 0, free = 0; l.cells.forEach(function (c) { if (g[c]) s += g[c]; else free++; }); return mgLineName(l, N) + " — " + s + " из " + D.sums[q] + (free ? ", пустых " + free : ""); };
    var cellName = function (c) { return "Ряд " + (Math.floor(c / N) + 1) + ", место " + (c % N + 1); };
    var out = D.empty.map(function (c) {
      return act(function () { return cellName(c) + ": " + (g[c] || "пусто"); }, function () {
        var items = [];
        for (var v = 1; v <= 9; v++) (function (v) { items.push(pick("Номинал " + v, function () { g[c] = v; A("play", "keypad"); sayq(cellName(c) + " — номинал " + v + ". " + cap(D.lines.map(function (l, q) { return l.cells.indexOf(c) >= 0 ? lineNow(l, q) : ""; }).filter(Boolean).join("; ")) + "."); })); })(v);
        items.push(pick("Убрать", function () { if (!g[c]) { nope("Гнездо и так пустое."); return; } g[c] = 0; A("play", "term_off"); sayq(cellName(c) + " — пусто."); }));
        items.push(backItem());
        UIx("menu", "Номинал: " + low(cellName(c)), items);
      });
    });
    out.push(act("Суммы сейчас", function () { say(rowTxt(g) + ". Суммы: " + D.lines.map(lineNow).join("; ") + "."); }));
    out.push(act("Проверить щит", function () {
      var free = D.empty.filter(function (c) { return !g[c]; });
      if (free.length) { nope("Пустых гнёзд ещё " + free.length + ": " + free.map(function (c) { return low(cellName(c)); }).join("; ") + "."); return; }
      for (var q = 0; q < D.lines.length; q++) {
        var s = 0; D.lines[q].cells.forEach(function (c) { s += g[c]; });
        if (s !== D.sums[q]) { A("play", "term_err"); fail(cap(mgLineName(D.lines[q], N)) + ": сумма " + s + ", а на табличке " + D.sums[q] + ". Щит не включился."); return; }
      }
      A("play", "power_on");
      var clean = mgClean(N, g);
      win(last, finish, "Все суммы сошлись: щит под током.", clean, "кое-где номиналы повторяются в ряду или столбце, а можно было без повторов");
    }));
    out.push(act("Очистить всё", function () {
      if (D.empty.every(function (c) { return !g[c]; })) { say("Пустые гнёзда и так пусты."); return; }
      g = D.grid.slice(); A("play", "term_off"); say("Вставленные предохранители вынуты.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   11. РАССТАНОВКА ЛАМП
   План коридоров со стенами; лампа освещает свою клетку и коридор по
   прямой во все четыре стороны — до стены или края плана. Осветить все
   клетки, ламп — не больше предела. Простая — четыре на четыре; средняя
   — пять на пять; сложная — шесть на шесть, и лампы не должны видеть
   друг друга (слепят). Образцовое — с наименьшим числом ламп.
   ════════════════════════════════════════════════════════════════════ */
function lampsW(v) { return pl(v, "лампа", "лампы", "ламп"); }
function lmBuild(R, walls) {
  var idx = rep(-1, R * R), cells = [], i;
  for (i = 0; i < R * R; i++) if (!walls[i]) { idx[i] = cells.length; cells.push(i); }
  var light = cells.map(function (c) {
    var out = [idx[c]], r0 = Math.floor(c / R), c0 = c % R;
    for (var dd = 0; dd < 4; dd++) { var rr = r0 + DR[dd], cc = c0 + DC[dd]; while (rr >= 0 && cc >= 0 && rr < R && cc < R && !walls[rr * R + cc]) { out.push(idx[rr * R + cc]); rr += DR[dd]; cc += DC[dd]; } }
    return out;
  });
  return { R: R, idx: idx, cells: cells, light: light };
}
function lmCount(M, limit, rule, capn, budget) {
  /* расстановки не больше limit ламп, освещающие всё; rule — лампы не видят друг друга */
  var K = M.cells.length, lit = rep(0, K), chosen = [], out = [], nodes = 0, i;
  var last = rep(0, K); /* последняя клетка, лампа в которой ещё может осветить x */
  for (i = 0; i < K; i++) M.light[i].forEach(function (x) { if (i > last[x]) last[x] = i; });
  var due = []; for (i = 0; i < K; i++) due.push([]);
  for (i = 0; i < K; i++) due[last[i]].push(i);
  var over = false;
  var rec = function (i) {
    if (out.length >= capn || over) return;
    if (++nodes > budget) { over = true; return; }
    if (i === K) { out.push(chosen.slice()); return; }
    var ok = function () { for (var q = 0; q < due[i].length; q++) if (!lit[due[i][q]]) return false; return true; };
    if (chosen.length < limit && !(rule && lit[i])) {
      chosen.push(i); M.light[i].forEach(function (x) { lit[x]++; });
      if (ok()) rec(i + 1);
      M.light[i].forEach(function (x) { lit[x]--; }); chosen.pop();
    }
    if (ok()) rec(i + 1);
  };
  rec(0);
  return { list: out, over: over };
}
function genLamps(seed, d, depth) {
  var r = rngFor(seed, "lamps", d), R = [4, 5, 6][d], guard, i, M = null, sols = null, min = 0, limit = 0, walls = null, rule = d === 2;
  var kr = [[8, 12], [12, 19], [17, 26]][d], mr = [[2, 3], [3, 4], [4, 5]][d];
  for (guard = 0; guard < 400 && !sols; guard++) {
    walls = rep(0, R * R); var pw = [0.3, 0.3, 0.32][d];
    for (i = 0; i < R * R; i++) if (r.chance(pw)) walls[i] = 1;
    M = lmBuild(R, walls);
    var K = M.cells.length; if (K < kr[0] || K > kr[1]) continue;
    /* связность коридоров */
    var seen = {}, q = [M.cells[0]]; seen[M.cells[0]] = 1;
    for (var qi = 0; qi < q.length; qi++) { var c = q[qi], r0 = Math.floor(c / R), c0 = c % R; for (var dd = 0; dd < 4; dd++) { var rr = r0 + DR[dd], cc = c0 + DC[dd], nc = rr * R + cc; if (rr >= 0 && cc >= 0 && rr < R && cc < R && !walls[nc] && !seen[nc]) { seen[nc] = 1; q.push(nc); } } }
    if (q.length !== K) continue;
    min = 0;
    var minSol = null;
    for (var L = 1; L <= mr[1]; L++) { var t = lmCount(M, L, rule, 1, 15000); if (t.over) break; if (t.list.length) { min = L; minSol = t.list[0]; break; } }
    if (!min || min < mr[0]) continue;
    limit = min + 1;
    var all = lmCount(M, limit, rule, CAPN, 40000);
    if (all.over || all.list.length < 2) continue;
    sols = all.list;
    /* счёт мог остановиться на потолке раньше, чем дошёл до образцовых: одна образцовая — из поиска наименьшего */
    if (!sols.some(function (s2) { return s2.length === min; })) sols = [minSol].concat(sols.slice(0, sols.length - 1));
  }
  if (!sols) return genLamps(seed + 7919, d, (depth || 0) + 1);
  var best = sols.filter(function (s) { return s.length === min; }), other = sols.filter(function (s) { return s.length !== min; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (s) {
    var p = [], byRow = {};
    s.forEach(function (k) { var c = M.cells[k]; (byRow[Math.floor(c / R)] = byRow[Math.floor(c / R)] || []).push(c % R); });
    Object.keys(byRow).map(Number).sort(function (a, b) { return a - b; }).forEach(function (row) { p.push("Ряд " + (row + 1)); byRow[row].sort(function (a, b) { return a - b; }).forEach(function (cc) { p.push("Клетка " + (cc + 1)); }); p.push("Назад"); });
    p.push("Включить свет"); return p;
  };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (s) { return s.length === min; }),
    answers: altS.map(function (s) { return { lamps: s.map(function (k) { var c = M.cells[k]; return [Math.floor(c / R), c % R]; }) }; }),
    wrong: rep(["Снять все лампы", "Включить свет"], 3), sol: sols.length,
    sig: "lamps|" + d + "|" + R + "|" + walls.join(""),
    data: { R: R, walls: walls, min: min, limit: limit, rule: rule, sol: sols.length, K: M.cells.length,
      sets: sols.map(function (s) { return s.map(function (k) { return M.cells[k]; }).join(","); }).sort() } };
}
function checkLamps(P, ans) {
  var D = P.data, R = D.R, M = lmBuild(R, D.walls), lit = rep(0, M.cells.length), put = {};
  var L = ans && ans.lamps;
  if (!L || !L.length) return { ok: false, best: false, why: "ламп нет" };
  if (L.length > D.limit) return { ok: false, best: false, why: "ламп больше предела" };
  for (var i = 0; i < L.length; i++) {
    var c = L[i][0] * R + L[i][1], k = M.idx[c];
    if (!(L[i][0] >= 0 && L[i][0] < R && L[i][1] >= 0 && L[i][1] < R) || k < 0 || put[k]) return { ok: false, best: false, why: "лампу туда не поставить" };
    if (D.rule && lit[k]) return { ok: false, best: false, why: "лампы видят друг друга" };
    put[k] = 1; M.light[k].forEach(function (x) { lit[x]++; });
  }
  if (lit.some(function (v) { return !v; })) return { ok: false, best: false, why: "есть тёмные клетки" };
  return { ok: true, best: L.length === D.min, why: "" };
}
function lamps(seed, cb, opts) {
  var d = diffOf(opts), P = genLamps(seed, d), D = P.data, R = D.R, M = lmBuild(R, D.walls), K = M.cells.length;
  var lamp = rep(false, K), lit = rep(0, K);
  var count = function () { return lamp.filter(Boolean).length; };
  var wallsTxt = []; for (var r0 = 0; r0 < R; r0++) { var ws = []; for (var c0 = 0; c0 < R; c0++) if (D.walls[r0 * R + c0]) ws.push(c0 + 1); wallsTxt.push("ряд " + (r0 + 1) + ": " + (ws.length ? (ws.length === 1 ? "стена на клетке " : "стены на клетках ") + andList(ws) : "стен нет")); }
  var sizeW = ["", "", "", "", "четыре на четыре", "пять на пять", "шесть на шесть"][R];
  var cond = head(opts, d) + "Расстановка ламп. План коридоров " + sizeW + ": ряды с севера на юг, клетки в ряду с запада на восток. " + cap(wallsTxt.join("; ")) +
    ". Всё, что не стена, — коридор. Лампа освещает свою клетку и коридор по прямой во все четыре стороны — до стены или края плана. Осветите все клетки коридоров, ламп — не больше " + GENW[D.limit] + "." +
    (D.rule ? " Лампы не должны видеть друг друга — по прямой без стены между ними они слепят; такую лампу просто не поставить." : "") + " Решений несколько, годится любое; образцовое — с наименьшим числом ламп.";
  var last = start("lamps", d, P, "Расстановка ламп", cond, function (st, finish, fail) {
    var darkList = function () { var a = []; for (var k = 0; k < K; k++) if (!lit[k]) { var c = M.cells[k]; a.push(rc(Math.floor(c / R), c % R)); } return a; };
    var toggle = function (k) {
      var c = M.cells[k], where = rc(Math.floor(c / R), c % R);
      /* (после 4.5, нелогичность) снятая лампа могла оставить всё освещённым — было «Темно в ноля клетках» */
      if (lamp[k]) { lamp[k] = false; M.light[k].forEach(function (x) { lit[x]--; }); A("play", "term_off"); var dk = darkList().length; sayq("Лампа снята: " + where + ". " + (dk ? "Темно в " + pcnt(dk, "клетке", "клетках", "f") : "Тёмных клеток нет") + "."); return; }
      if (count() >= D.limit) { nope("Ламп всего " + D.limit + ": сначала снимите какую-нибудь."); return; }
      if (D.rule && lit[k]) {
        var from = -1; for (var j = 0; j < K; j++) if (lamp[j] && M.light[j].indexOf(k) >= 0) from = j;
        nope("Отсюда видна лампа: " + rc(Math.floor(M.cells[from] / R), M.cells[from] % R) + ". Они будут слепить друг друга."); return;
      }
      lamp[k] = true; M.light[k].forEach(function (x) { lit[x]++; }); A("play", "power_on");
      var dl = darkList().length;
      sayq("Лампа: " + where + ". " + (dl ? "Темно ещё в " + pcnt(dl, "клетке", "клетках", "f") : "Тёмных клеток нет") + ". Ламп " + count() + " из " + D.limit + ".");
    };
    var rowItems = function (row) {
      var items = [];
      for (var cc = 0; cc < R; cc++) (function (cc) {
        var c = row * R + cc, k = M.idx[c];
        if (k < 0) { items.push(act("Клетка " + (cc + 1) + ": стена", function () { say("Клетка " + (cc + 1) + " ряда " + (row + 1) + " — стена: лампу не поставить."); })); return; }
        items.push(act(function () { return "Клетка " + (cc + 1) + ": " + (lamp[k] ? "лампа" : lit[k] ? "светло" : "темно"); }, function () { toggle(k); }));
      })(cc);
      items.push(backItem());
      return items;
    };
    var out = [];
    for (var row = 0; row < R; row++) (function (row) {
      out.push(act(function () { var l = 0, dk = 0; for (var cc = 0; cc < R; cc++) { var k = M.idx[row * R + cc]; if (k < 0) continue; if (lamp[k]) l++; if (!lit[k]) dk++; } return "Ряд " + (row + 1) + ": ламп " + l + ", темно " + dk; },
        function () { UIx("menu", "Ряд " + (row + 1) + " плана", rowItems(row)); }));
    })(row);
    out.push(act("Что темно", function () { var dl = darkList(); say(dl.length ? "Темно: " + dl.join("; ") + ". Ламп " + count() + " из " + D.limit + "." : "Всё освещено. Ламп " + count() + " из " + D.limit + "."); }));
    out.push(act("Включить свет", function () {
      var dl = darkList();
      if (dl.length) { A("play", "term_err"); fail("Обход с фонарём нашёл темноту: " + dl.slice(0, 4).join("; ") + (dl.length > 4 ? " и ещё " + cnt(dl.length - 4, "f", "клетка", "клетки", "клеток") : "") + "."); return; }
      A("play", "power_on");
      win(last, finish, "Свет горит во всех коридорах: " + cnt(count(), "f", "лампа", "лампы", "ламп") + ".", count() === D.min, "хватило бы " + (D.min === 1 ? "одной лампы" : GENW[D.min] + " ламп"));
    }));
    out.push(act("Снять все лампы", function () {
      if (!count()) { say("Ламп и так нет."); return; }
      lamp = rep(false, K); lit = rep(0, K); A("play", "term_off"); say("Все лампы сняты, коридоры темны.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   12. ТРУБОПРОВОД
   Поле колен и прямых труб; каждую можно повернуть по часовой стрелке
   на четверть оборота. Вода от насоса должна дойти до стока. Простая —
   три на три; средняя — четыре на четыре; сложная — пять на пять, с
   завалами и приваренными трубами. Решение — путь воды; образцовое —
   с наименьшим числом поворотов (лишние повороты тоже считаются).
   ════════════════════════════════════════════════════════════════════ */
function ppOpen(t, rot) { return t === "s" ? (rot % 2 ? [1, 3] : [0, 2]) : [rot % 4, (rot + 1) % 4].sort(function (a, b) { return a - b; }); }
function ppNeed(t, a, b) {
  /* поворот, при котором у трубы открыты стороны a и b; -1 — нельзя */
  if (t === "s") { if ((a + 2) % 4 !== b) return -1; return a % 2 ? 1 : 0; }
  if ((a + 2) % 4 === b || a === b) return -1;
  return (a + 1) % 4 === b ? a : b;
}
function ppTiles(t) { return t === "s" ? 2 : 4; }
function ppDesc(t, rot) { if (t === "w") return "завал"; var o = ppOpen(t, rot); return (t === "s" ? "прямая, " : "колено, ") + DIRN[o[0]] + " и " + DIRN[o[1]]; }
function ppTrace(D, rot) {
  var R = D.R, r0 = D.pump.r, c0 = D.pump.c, entry = D.pump.side, seen = {}, path = [];
  for (var g = 0; g < R * R + 2; g++) {
    var i = r0 * R + c0, T = D.tiles[i];
    if (seen[i]) return { ok: false, path: path, end: "loop", r: r0, c: c0 };
    seen[i] = 1; path.push(i);
    if (T.t === "w") return { ok: false, path: path, end: "wall", r: r0, c: c0, side: entry };
    var o = ppOpen(T.t, rot[i]);
    if (o.indexOf(entry) < 0) return { ok: false, path: path, end: "leak", r: r0, c: c0, side: entry };
    var ex = o[0] === entry ? o[1] : o[0];
    if (r0 === D.drain.r && c0 === D.drain.c && ex === D.drain.side) return { ok: true, path: path };
    var nr = r0 + DR[ex], nc = c0 + DC[ex];
    if (nr < 0 || nc < 0 || nr >= R || nc >= R) return { ok: false, path: path, end: "out", r: r0, c: c0, side: ex };
    r0 = nr; c0 = nc; entry = (ex + 2) % 4;
  }
  return { ok: false, path: path, end: "loop", r: r0, c: c0 };
}
function ppCost(D, rot) { var c = 0; for (var i = 0; i < D.tiles.length; i++) { var T = D.tiles[i]; if (T.t === "w" || T.fix) continue; c += ((rot[i] - T.rot) % ppTiles(T.t) + ppTiles(T.t)) % ppTiles(T.t); } return c; }
function ppPaths(D, capn, budget) {
  var R = D.R, out = [], seen = {}, req = {}, nodes = 0, over = false;
  var rec = function (r0, c0, entry, cost) {
    if (out.length >= capn || over) return;
    if (++nodes > budget) { over = true; return; }
    var i = r0 * R + c0, T = D.tiles[i];
    if (seen[i] || T.t === "w") return;
    var exits = T.t === "s" ? [(entry + 2) % 4] : [(entry + 1) % 4, (entry + 3) % 4];
    seen[i] = 1;
    for (var k = 0; k < exits.length; k++) {
      var ex = exits[k], need = ppNeed(T.t, entry, ex);
      if (need < 0) continue;
      if (T.fix && ppOpen(T.t, T.rot).join() !== ppOpen(T.t, need).join()) continue;
      var cc = T.fix ? 0 : ((need - T.rot) % ppTiles(T.t) + ppTiles(T.t)) % ppTiles(T.t);
      req[i] = need;
      if (r0 === D.drain.r && c0 === D.drain.c && ex === D.drain.side) { var sol = {}; for (var key in req) sol[key] = req[key]; out.push({ req: sol, cost: cost + cc }); }
      else { var nr = r0 + DR[ex], nc = c0 + DC[ex]; if (nr >= 0 && nc >= 0 && nr < R && nc < R) rec(nr, nc, (ex + 2) % 4, cost + cc); }
      delete req[i];
    }
    seen[i] = 0;
  };
  rec(D.pump.r, D.pump.c, D.pump.side, 0);
  return { list: out, over: over };
}
function ppBorder(R, side, k) { return side === 0 ? { r: 0, c: k, side: 0 } : side === 1 ? { r: k, c: R - 1, side: 1 } : side === 2 ? { r: R - 1, c: k, side: 2 } : { r: k, c: 0, side: 3 }; }
function genPipes(seed, d, depth) {
  var r = rngFor(seed, "pipes", d), R = d + 3, guard, i, D = null, sols = null, minC = 0;
  var lenMin = [3, 5, 7][d], costMin = [2, 3, 4][d];
  for (guard = 0; guard < 400 && !sols; guard++) {
    var ps = r.int(0, 3), pump = ppBorder(R, ps, r.int(0, R - 1));
    var ds = r.chance(0.6) ? (ps + 2) % 4 : (ps + r.pick([1, 3])) % 4, drain = ppBorder(R, ds, r.int(0, R - 1));
    if (pump.r === drain.r && pump.c === drain.c) continue;
    /* пути воды: случайные блуждания без повторов от насоса к стоку; второй путь — запасной,
       и где пути пересекаются, вид трубы у них должен совпасть */
    var walk = function () {
      for (var w = 0; w < 30; w++) {
        var cur = [pump.r, pump.c], vis = {}, pth = [cur[0] * R + cur[1]];
        vis[pth[0]] = 1;
        for (var st = 0; st < R * R; st++) {
          if (cur[0] === drain.r && cur[1] === drain.c) break;
          var nb = [];
          for (var dd = 0; dd < 4; dd++) { var rr = cur[0] + DR[dd], cc = cur[1] + DC[dd]; if (rr >= 0 && cc >= 0 && rr < R && cc < R && !vis[rr * R + cc]) nb.push(rr * R + cc); }
          if (!nb.length) break;
          var nx = r.pick(nb); vis[nx] = 1; pth.push(nx); cur = [Math.floor(nx / R), nx % R];
        }
        if (cur[0] === drain.r && cur[1] === drain.c && pth.length >= lenMin) return pth;
      }
      return null;
    };
    var shape = function (pth) {
      var out = {};
      for (var k = 0; k < pth.length; k++) {
        var c = pth[k], pr = Math.floor(c / R), pc = c % R, entry, ex;
        if (k === 0) entry = pump.side; else { var p0 = pth[k - 1]; entry = dirTo(pr, pc, Math.floor(p0 / R), p0 % R); }
        if (k === pth.length - 1) ex = drain.side; else { var n0 = pth[k + 1]; ex = dirTo(pr, pc, Math.floor(n0 / R), n0 % R); }
        if (entry === ex) return null;
        out[c] = { t: (entry + 2) % 4 === ex ? "s" : "e", need: -1 };
        out[c].need = ppNeed(out[c].t, entry, ex);
      }
      return out;
    };
    var path = walk(); if (!path) continue;
    var sh1 = shape(path); if (!sh1) continue;
    /* запасной путь: от колена основного пути уйти в другую сторону и вернуться в другое его колено */
    var sh2 = null, onP1 = {};
    path.forEach(function (c) { onP1[c] = 1; });
    var elb = []; for (i = 0; i < path.length; i++) if (sh1[path[i]].t === "e") elb.push(i);
    for (var tr = 0; tr < 10 && !sh2 && elb.length >= 2; tr++) {
      var ia = r.int(0, elb.length - 2), ib = r.int(ia + 1, elb.length - 1), ka = elb[ia], kb = elb[ib], ca = path[ka], cb = path[kb];
      var xa = ka + 1 < path.length ? dirTo(Math.floor(ca / R), ca % R, Math.floor(path[ka + 1] / R), path[ka + 1] % R) : drain.side;
      var eb = kb > 0 ? dirTo(Math.floor(cb / R), cb % R, Math.floor(path[kb - 1] / R), path[kb - 1] % R) : pump.side;
      var xa2 = (xa + 2) % 4, eb2 = (eb + 2) % 4;
      var sr = Math.floor(ca / R) + DR[xa2], sc = ca % R + DC[xa2], tr2 = Math.floor(cb / R) + DR[eb2], tc = cb % R + DC[eb2];
      if (sr < 0 || sc < 0 || sr >= R || sc >= R || tr2 < 0 || tc < 0 || tr2 >= R || tc >= R) continue;
      if (onP1[sr * R + sc] || onP1[tr2 * R + tc]) continue;
      for (var wv = 0; wv < 8 && !sh2; wv++) {
        var cur = [sr, sc], vis = {}, det = [sr * R + sc]; vis[det[0]] = 1;
        for (var st2 = 0; st2 < R * R && !(cur[0] === tr2 && cur[1] === tc); st2++) {
          var nb = [];
          for (var dd = 0; dd < 4; dd++) { var rr = cur[0] + DR[dd], cc = cur[1] + DC[dd], nc = rr * R + cc; if (rr >= 0 && cc >= 0 && rr < R && cc < R && !vis[nc] && !onP1[nc]) nb.push(nc); }
          if (!nb.length) break;
          var nx = r.pick(nb); vis[nx] = 1; det.push(nx); cur = [Math.floor(nx / R), nx % R];
        }
        if (!(cur[0] === tr2 && cur[1] === tc)) continue;
        var p2 = path.slice(0, ka + 1).concat(det, path.slice(kb));
        var s2 = shape(p2);
        if (s2) sh2 = s2;
      }
    }
    var tiles = [], onPath = {};
    for (i = 0; i < R * R; i++) tiles.push({ t: r.chance(0.35) ? "s" : "e", rot: 0, fix: false });
    var key2;
    for (key2 in sh1) { tiles[key2].t = sh1[key2].t; onPath[key2] = sh1[key2].need; }
    var spare = {};
    if (sh2) for (key2 in sh2) { tiles[key2].t = sh2[key2].t; if (onPath[key2] == null) spare[key2] = 1; }
    var free = intList(R * R).filter(function (x) { return onPath[x] == null && !spare[x]; });
    r.shuffle(free);
    var fi = 0;
    if (d === 2) { var nw2 = r.int(2, 3); for (var q = 0; q < nw2 && fi < free.length; q++) tiles[free[fi++]].t = "w"; }
    for (i = 0; i < R * R; i++) if (tiles[i].t !== "w") tiles[i].rot = r.int(0, ppTiles(tiles[i].t) - 1);
    if (d === 2) {
      var pk = r.pick(path); tiles[pk].fix = true; tiles[pk].rot = onPath[pk];
      if (fi < free.length) tiles[free[fi]].fix = true;
    }
    D = { R: R, tiles: tiles, pump: pump, drain: drain };
    var rot0 = tiles.map(function (T) { return T.rot; });
    if (ppTrace(D, rot0).ok) continue;
    var res = ppPaths(D, CAPN, 40000);
    if (res.over || res.list.length < 2 || res.list.length >= CAPN) continue;
    minC = Math.min.apply(null, res.list.map(function (x) { return x.cost; }));
    if (minC < costMin) continue;
    if (d && !res.list.some(function (x) { return x.cost > minC; }) && r.chance(0.6)) continue;
    sols = res.list;
  }
  if (!sols) return genPipes(seed + 7919, d, (depth || 0) + 1);
  var best = sols.filter(function (x) { return x.cost === minC; }), other = sols.filter(function (x) { return x.cost !== minC; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var turnsOf = function (x) { return D.tiles.map(function (T, j) { if (x.req[j] == null || T.fix || T.t === "w") return 0; return ((x.req[j] - T.rot) % ppTiles(T.t) + ppTiles(T.t)) % ppTiles(T.t); }); };
  var pathOf = function (x) {
    var tn = turnsOf(x), p = [];
    for (var row = 0; row < D.R; row++) {
      var any = false; for (var col = 0; col < D.R; col++) if (tn[row * D.R + col]) any = true;
      if (!any) continue;
      p.push("Ряд " + (row + 1));
      for (col = 0; col < D.R; col++) for (var k = 0; k < tn[row * D.R + col]; k++) p.push("Клетка " + (col + 1));
      p.push("Назад");
    }
    p.push("Пустить воду"); return p;
  };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (x) { return x.cost === minC; }),
    answers: altS.map(function (x) { return { turns: turnsOf(x) }; }), wrong: rep(["Вернуть как было", "Пустить воду"], 3), sol: sols.length,
    sig: "pipes|" + d + "|" + R + "|" + [D.pump.r, D.pump.c, D.pump.side, D.drain.r, D.drain.c, D.drain.side].join(",") + "|" + D.tiles.map(function (T) { return T.t + T.rot + (T.fix ? "f" : ""); }).join(""),
    data: { R: R, tiles: D.tiles.map(function (T) { return { t: T.t, rot: T.rot, fix: T.fix }; }), pump: D.pump, drain: D.drain, minC: minC, sol: sols.length,
      paths: sols.map(function (x) { return Object.keys(x.req).map(function (k2) { return k2 + ":" + x.req[k2]; }).sort().join(","); }).sort() } };
}
function dirTo(r0, c0, r1, c1) { return r1 < r0 ? 0 : c1 > c0 ? 1 : r1 > r0 ? 2 : 3; }
function checkPipes(P, ans) {
  var D = P.data, tn = ans && ans.turns;
  if (!tn || tn.length !== D.tiles.length) return { ok: false, best: false, why: "нет поворотов" };
  var rot = D.tiles.map(function (T, i) { if ((T.fix || T.t === "w") && tn[i]) return -1; return T.t === "w" ? 0 : T.rot + (tn[i] || 0); });
  if (rot.some(function (v) { return v < 0; })) return { ok: false, best: false, why: "приваренное не повернуть" };
  var tr = ppTrace(D, rot);
  if (!tr.ok) return { ok: false, best: false, why: "вода не дошла до стока" };
  return { ok: true, best: ppCost(D, rot) === D.minC, why: "" };
}
function pipes(seed, cb, opts) {
  var d = diffOf(opts), P = genPipes(seed, d), D = P.data, R = D.R;
  var rot = D.tiles.map(function (T) { return T.rot; });
  var sizeW = ["", "", "", "три на три", "четыре на четыре", "пять на пять"][R];
  var where = function (i) { return rc(Math.floor(i / R), i % R); };
  var tileTxt = function (i, rr) { var T = D.tiles[i]; return ppDesc(T.t, rr[i]) + (T.fix ? (T.t === "s" ? ", приварена" : ", приварено") : ""); };
  var rowsTxt = []; for (var r0 = 0; r0 < R; r0++) { var a = []; for (var c0 = 0; c0 < R; c0++) a.push(tileTxt(r0 * R + c0, rot)); rowsTxt.push("Ряд " + (r0 + 1) + ": " + a.join("; ")); }
  var cond = head(opts, d) + "Трубопровод. Поле труб " + sizeW + ": ряды с севера на юг, клетки в ряду с запада на восток. Насос подаёт воду в ряд " + (D.pump.r + 1) + ", клетку " + (D.pump.c + 1) + " " + DIRF[D.pump.side] +
    ". Сток — у " + "ряда " + (D.drain.r + 1) + ", клетки " + (D.drain.c + 1) + ": вода должна уйти туда " + DIRA[D.drain.side] + ". В клетках — колена и прямые трубы: прямая соединяет две противоположные стороны, колено — две соседние. Каждую можно повернуть по часовой стрелке на четверть оборота." +
    (d === 2 ? " Завал — клетка без трубы; приваренные трубы не поворачиваются." : "") + " " + rowsTxt.join(". ") +
    ". Поверните трубы так, чтобы вода от насоса дошла до стока; вода, ударившая из стыка, — авария. Решений несколько, годится любое; образцовое — с наименьшим числом поворотов: считается, на сколько четвертей каждая труба в итоге повёрнута от начала.";
  var last = start("pipes", d, P, "Трубопровод", cond, function (st, finish, fail) {
    var traceTxt = function (t) {
      var cells = t.path.map(where), head2 = "Вода входит в ряд " + (D.pump.r + 1) + ", клетку " + (D.pump.c + 1) + " " + DIRF[D.pump.side];
      var mid = cells.length > 1 ? "; дальше: " + (cells.length > 9 ? cells.slice(1, 8).join("; ") + " и ещё " + cnt(cells.length - 8, "f", "клетка", "клетки", "клеток") : cells.slice(1).join("; ")) : "";
      var at = "ряду " + (t.r + 1) + ", клетке " + (t.c + 1);
      var end = t.ok ? " и уходит в сток." : t.end === "out" ? " и выливается за край поля " + DIRA[t.side] + " у ряда " + (t.r + 1) + ", клетки " + (t.c + 1) + "." :
        t.end === "wall" ? " и упирается в завал в " + at + "." : t.end === "loop" ? " и ходит по кругу." : " и бьёт из стыка: в " + at + " трубы " + DIRF[t.side] + " нет.";
      return head2 + mid + end;
    };
    var rowItems = function (row) {
      var items = [];
      for (var cc = 0; cc < R; cc++) (function (cc) {
        var i = row * R + cc, T = D.tiles[i];
        items.push(act(function () { return "Клетка " + (cc + 1) + ": " + tileTxt(i, rot); }, function () {
          if (T.t === "w") { say("Клетка " + (cc + 1) + " — завал, трубы нет."); return; }
          if (T.fix) { nope("Эта труба приварена: не повернуть."); return; }
          rot[i] = (rot[i] + 1) % 4; A("play", "tk_pull");
          sayq("Клетка " + (cc + 1) + " повёрнута: " + ppDesc(T.t, rot[i]) + ".");
        }));
      })(cc);
      items.push(backItem());
      return items;
    };
    var out = [];
    for (var row = 0; row < R; row++) (function (row) {
      out.push(act(function () { var a = []; for (var cc = 0; cc < R; cc++) a.push(D.tiles[row * R + cc].t === "w" ? "завал" : D.tiles[row * R + cc].t === "s" ? "прямая" : "колено"); return "Ряд " + (row + 1) + ": " + a.join(", "); },
        function () { UIx("menu", "Ряд " + (row + 1) + " труб", rowItems(row)); }));
    })(row);
    out.push(act("Куда идёт вода", function () { say(traceTxt(ppTrace(D, rot))); }));
    out.push(act("Пустить воду", function () {
      var t = ppTrace(D, rot);
      if (!t.ok) { A("play", "ev_steam"); fail("Авария. " + traceTxt(t)); return; }
      A("play", "room_pumps");
      var c = ppCost(D, rot);
      win(last, finish, "Вода прошла от насоса до стока через " + cnt(t.path.length, "f", "клетку", "клетки", "клеток") + ". Поворотов от начального положения: " + c + ".", c === D.minC, "хватило бы " + gcnt(D.minC, "поворота", "поворотов"));
    }));
    out.push(act("Вернуть как было", function () {
      if (rot.every(function (v, i) { return v === D.tiles[i].rot; })) { say("Трубы и так стоят как в начале."); return; }
      rot = D.tiles.map(function (T) { return T.rot; }); A("play", "term_off"); say("Все трубы вернули как было.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   13. ОТРАЖАТЕЛИ
   Луч излучателя должен дойти до приёмника. Отражатель ставится в
   пустую клетку и поворачивает луч на четверть оборота — налево или
   направо по ходу луча. Простая — четыре на четыре, одна-две колонны;
   средняя — пять на пять; сложная — шесть на шесть, колонн больше, и
   есть закреплённые отражатели, которые сбивают луч. Ставить можно на
   один отражатель больше, чем нужно. Образцовое — с наименьшим числом
   отражателей.
   ════════════════════════════════════════════════════════════════════ */
var DIRI = ["северным", "восточным", "южным", "западным"];
function mrTurn(dir, t) { return t === "L" ? (dir + 3) % 4 : (dir + 1) % 4; }
function mrStart(D) { var s = D.em.side, k = D.em.k, R = D.R; return s === 0 ? { r: 0, c: k, dir: 2 } : s === 1 ? { r: k, c: R - 1, dir: 3 } : s === 2 ? { r: R - 1, c: k, dir: 0 } : { r: k, c: 0, dir: 1 }; }
function mrSim(D, put) {
  var R = D.R, s = mrStart(D), r0 = s.r, c0 = s.c, dir = s.dir, vis = {}, turns = [];
  for (var g = 0; g < R * R * 4 + 4; g++) {
    if (r0 < 0 || c0 < 0 || r0 >= R || c0 >= R) return { ok: false, end: "out", r: r0 - DR[dir], c: c0 - DC[dir], dir: dir, turns: turns };
    var i = r0 * R + c0, key = i * 4 + dir;
    if (vis[key]) return { ok: false, end: "loop", turns: turns };
    vis[key] = 1;
    if (D.grid[i] === 1) return { ok: false, end: "col", r: r0, c: c0, turns: turns };
    if (D.grid[i] === 2) return { ok: true, turns: turns };
    var t = D.fixed[i] || put[i];
    if (t) { dir = mrTurn(dir, t); turns.push({ r: r0, c: c0, dir: dir }); }
    r0 += DR[dir]; c0 += DC[dir];
  }
  return { ok: false, end: "loop", turns: turns };
}
function mrSolve(D, limit, capn, budget) {
  var R = D.R, out = [], dec = {}, vis = {}, nodes = 0, over = false, used = 0, seenS = {};
  var go = function (r0, c0, dir) {
    if (out.length >= capn || over) return;
    if (++nodes > budget) { over = true; return; }
    var addV = [], addD = [];
    var clean = function () { addV.forEach(function (k) { delete vis[k]; }); addD.forEach(function (k) { delete dec[k]; }); };
    for (var g = 0; g < R * R * 4 + 4; g++) {
      if (r0 < 0 || c0 < 0 || r0 >= R || c0 >= R) break;
      var i = r0 * R + c0, key = i * 4 + dir;
      if (vis[key]) break;
      vis[key] = 1; addV.push(key);
      if (D.grid[i] === 1) break;
      if (D.grid[i] === 2) {
        var sk = Object.keys(dec).filter(function (k) { return dec[k]; }).map(function (k) { return k + dec[k]; }).sort().join(",");
        if (!seenS[sk]) { seenS[sk] = 1; var sol = {}; for (var k2 in dec) if (dec[k2]) sol[k2] = dec[k2]; out.push({ put: sol, n: used }); }
        break;
      }
      if (D.fixed[i]) dir = mrTurn(dir, D.fixed[i]);
      else if (dec[i] !== undefined) { if (dec[i]) dir = mrTurn(dir, dec[i]); }
      else {
        if (used < limit) {
          for (var q = 0; q < 2; q++) {
            var t = q ? "R" : "L", nd = mrTurn(dir, t);
            dec[i] = t; used++;
            go(r0 + DR[nd], c0 + DC[nd], nd);
            used--; delete dec[i];
            if (over) break;
          }
        }
        dec[i] = 0; addD.push(i);
      }
      r0 += DR[dir]; c0 += DC[dir];
    }
    clean();
  };
  var s = mrStart(D);
  go(s.r, s.c, s.dir);
  return { list: out, over: over };
}
function genMirrors(seed, d, depth) {
  var r = rngFor(seed, "mirrors", d), R = d + 4, guard, i, D = null, sols = null, min = 0;
  var nCol = [[1, 2], [3, 4], [4, 6]][d], bestR = [[1, 2], [2, 3], [2, 3]][d];
  for (guard = 0; guard < 400 && !sols; guard++) {
    var grid = rep(0, R * R), cells = intList(R * R); r.shuffle(cells);
    var nc = r.int(nCol[0], nCol[1]), ci = 0;
    for (i = 0; i < nc; i++) grid[cells[ci++]] = 1;
    var fixed = {};
    if (d === 2) { var nf = r.int(1, 2); for (i = 0; i < nf; i++) fixed[cells[ci++]] = r.chance(0.5) ? "L" : "R"; }
    D = { R: R, grid: grid, fixed: fixed, em: { side: r.int(0, 3), k: r.int(0, R - 1) } };
    var st = mrStart(D), first = st.r * R + st.c;
    if (grid[first] || fixed[first]) continue;
    /* приёмник — в конце случайного пути луча с нужным числом поворотов */
    var want = r.int(bestR[0], bestR[1]), pr = st.r, pc = st.c, pd = st.dir, okP = true, usedC = {}, rcv = -1;
    for (var tt = 0; tt <= want && okP; tt++) {
      var run = [], rr = pr, cc = pc;
      while (rr >= 0 && cc >= 0 && rr < R && cc < R && !grid[rr * R + cc] && !usedC[rr * R + cc] && !fixed[rr * R + cc]) { run.push([rr, cc]); rr += DR[pd]; cc += DC[pd]; }
      if (!run.length) { okP = false; break; }
      var at = run[r.int(tt ? 0 : 0, run.length - 1)];
      for (var u = 0; u < run.length; u++) { usedC[run[u][0] * R + run[u][1]] = 1; if (run[u] === at) break; }
      if (tt === want) { rcv = at[0] * R + at[1]; break; }
      pd = mrTurn(pd, r.chance(0.5) ? "L" : "R"); pr = at[0] + DR[pd]; pc = at[1] + DC[pd];
    }
    if (!okP || rcv < 0 || rcv === first) continue;
    grid[rcv] = 2;
    if (mrSim(D, {}).ok) continue;
    min = 0;
    for (var L = 1; L <= bestR[1]; L++) { var t = mrSolve(D, L, 1, 20000); if (t.over) break; if (t.list.length) { min = L; break; } }
    if (!min || min < bestR[0]) continue;
    var all = mrSolve(D, min + 1, CAPN, 60000);
    if (all.over || all.list.length < 2) continue;
    sols = all.list;
  }
  if (!sols) return genMirrors(seed + 7919, d, (depth || 0) + 1);
  var limit = min + 1;
  var best = sols.filter(function (x) { return x.n === min; }), other = sols.filter(function (x) { return x.n !== min; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (x) {
    var p = [], byRow = {};
    Object.keys(x.put).forEach(function (k) { var c = +k; (byRow[Math.floor(c / R)] = byRow[Math.floor(c / R)] || []).push(c); });
    Object.keys(byRow).map(Number).sort(function (a, b) { return a - b; }).forEach(function (row) {
      p.push("Ряд " + (row + 1));
      byRow[row].sort(function (a, b) { return a - b; }).forEach(function (c) { p.push("Клетка " + (c % R + 1)); if (x.put[c] === "R") p.push("Клетка " + (c % R + 1)); });
      p.push("Назад");
    });
    p.push("Включить луч"); return p;
  };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (x) { return x.n === min; }),
    answers: altS.map(function (x) { return { put: Object.keys(x.put).map(function (k) { var c = +k; return [Math.floor(c / R), c % R, x.put[k]]; }) }; }),
    wrong: rep(["Снять все отражатели", "Включить луч"], 3), sol: sols.length,
    sig: "mirrors|" + d + "|" + R + "|" + D.grid.join("") + "|" + Object.keys(D.fixed).sort().map(function (k) { return k + D.fixed[k]; }).join(",") + "|" + D.em.side + ":" + D.em.k,
    data: { R: R, grid: D.grid, fixed: D.fixed, em: D.em, min: min, limit: limit, sol: sols.length,
      sets: sols.map(function (x) { return Object.keys(x.put).sort().map(function (k) { return k + x.put[k]; }).join(","); }).sort() } };
}
function checkMirrors(P, ans) {
  var D = P.data, R = D.R, put = {}, L = ans && ans.put;
  if (!L) return { ok: false, best: false, why: "нет отражателей" };
  if (L.length > D.limit) return { ok: false, best: false, why: "отражателей больше, чем есть" };
  for (var i = 0; i < L.length; i++) {
    var c = L[i][0] * R + L[i][1];
    if (!(L[i][0] >= 0 && L[i][0] < R && L[i][1] >= 0 && L[i][1] < R) || D.grid[c] || D.fixed[c] || put[c] || (L[i][2] !== "L" && L[i][2] !== "R")) return { ok: false, best: false, why: "туда отражатель не поставить" };
    put[c] = L[i][2];
  }
  if (!mrSim(D, put).ok) return { ok: false, best: false, why: "луч не дошёл до приёмника" };
  return { ok: true, best: L.length === D.min, why: "" };
}
function mirrors(seed, cb, opts) {
  var d = diffOf(opts), P = genMirrors(seed, d), D = P.data, R = D.R, put = {};
  var count = function () { return Object.keys(put).length; };
  var sizeW = ["", "", "", "", "четыре на четыре", "пять на пять", "шесть на шесть"][R];
  var em = D.em, st0 = mrStart(D);
  var emTxt = "Излучатель стоит за " + DIRI[em.side] + " краем у " + (em.side % 2 ? "ряда " : "клетки ") + (em.k + 1) + " и бьёт " + DIRA[st0.dir];
  var cols = [], fx = [], rcv = -1;
  for (var i0 = 0; i0 < R * R; i0++) { if (D.grid[i0] === 1) cols.push(rc(Math.floor(i0 / R), i0 % R)); if (D.grid[i0] === 2) rcv = i0; if (D.fixed[i0]) fx.push(rc(Math.floor(i0 / R), i0 % R) + " — " + (D.fixed[i0] === "L" ? "налево" : "направо")); }
  var turnW = function (t) { return t === "L" ? "налево" : "направо"; };
  var cond = head(opts, d) + "Отражатели. Поле " + sizeW + ": ряды с севера на юг, клетки в ряду с запада на восток. " + emTxt + ". Приёмник — " + rc(Math.floor(rcv / R), rcv % R) + ". " +
    (cols.length === 1 ? "Колонна" : "Колонны") + ": " + cols.join("; ") + "." + (fx.length ? " Закреплённые отражатели, их не снять: " + fx.join("; ") + "." : "") +
    " Отражатель ставится в пустую клетку и поворачивает луч на четверть оборота — налево или направо по ходу луча. Луч, ушедший за край поля или в колонну, пропадает. Отражателей у вас — не больше " + GENW[D.limit] + ". Решений несколько, годится любое; образцовое — с наименьшим числом отражателей.";
  var last = start("mirrors", d, P, "Отражатели", cond, function (st, finish, fail) {
    var beamTxt = function (res) {
      var t = res.turns.map(function (x) { return "в " + rc(x.r, x.c).replace("ряд ", "ряду ").replace("клетка ", "клетке ") + " — " + DIRA[x.dir]; });
      var hd = "Луч пошёл " + DIRA[st0.dir] + (t.length ? ", поворачивал: " + t.join("; ") : ", никуда не сворачивая");
      if (res.ok) return hd + ", и попал в приёмник.";
      if (res.end === "col") return hd + ", и упёрся в колонну: " + rc(res.r, res.c) + ".";
      if (res.end === "loop") return hd + ", и закольцевался.";
      return hd + ", и ушёл за край поля " + DIRA[res.dir] + " у ряда " + (res.r + 1) + ", клетки " + (res.c + 1) + ".";
    };
    var cellLabel = function (i) {
      if (D.grid[i] === 1) return "колонна";
      if (D.grid[i] === 2) return "приёмник";
      if (D.fixed[i]) return "закреплённый отражатель " + turnW(D.fixed[i]);
      return put[i] ? "отражатель " + turnW(put[i]) : "пусто";
    };
    var cycle = function (i) {
      var where = rc(Math.floor(i / R), i % R);
      if (D.grid[i] === 1) { say(cap(where) + " — колонна: туда не поставить."); return; }
      if (D.grid[i] === 2) { say(cap(where) + " — приёмник."); return; }
      if (D.fixed[i]) { nope("Этот отражатель закреплён: не снять и не повернуть."); return; }
      if (!put[i]) { if (count() >= D.limit) { nope("Отражателей всего " + D.limit + ": сначала снимите какой-нибудь."); return; } put[i] = "L"; }
      else if (put[i] === "L") put[i] = "R";
      else delete put[i];
      A("play", put[i] ? "pick_part" : "term_off");
      sayq(cap(where) + ": " + cellLabel(i) + ". Отражателей " + count() + " из " + D.limit + ".");
    };
    var out = [];
    for (var row = 0; row < R; row++) (function (row) {
      out.push(act(function () { var n = 0; for (var c = 0; c < R; c++) if (put[row * R + c]) n++; return "Ряд " + (row + 1) + ": отражателей " + n; }, function () {
        var items = [];
        for (var c = 0; c < R; c++) (function (c) { var i = row * R + c; items.push(act(function () { return "Клетка " + (c + 1) + ": " + cellLabel(i); }, function () { cycle(i); })); })(c);
        items.push(backItem());
        UIx("menu", "Ряд " + (row + 1) + " поля", items);
      }));
    })(row);
    out.push(act("Что на поле", function () {
      var a = Object.keys(put).map(function (k) { var i = +k; return rc(Math.floor(i / R), i % R) + " — " + turnW(put[k]); });
      say((a.length ? "Ваши отражатели: " + a.join("; ") + "." : "Своих отражателей нет.") + " Можно поставить ещё " + (D.limit - count()) + ". " + emTxt + "; приёмник — " + rc(Math.floor(rcv / R), rcv % R) + ".");
    }));
    out.push(act("Включить луч", function () {
      var res = mrSim(D, put);
      if (!res.ok) { A("play", "w_laser"); fail(beamTxt(res)); return; }
      A("play", "scan");
      win(last, finish, beamTxt(res) + " Отражателей поставлено: " + count() + ".", count() === D.min, "хватило бы " + gcnt(D.min, "отражателя", "отражателей"));
    }));
    out.push(act("Снять все отражатели", function () {
      if (!count()) { say("Своих отражателей на поле нет."); return; }
      put = {}; A("play", "term_off"); say("Все ваши отражатели сняты.");
    }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   14. НАРЯДЫ БРИГАД
   Распределить работы между бригадами: у каждой — допуски (к каким
   работам) и смена (сколько часов). Простая — две бригады, четыре
   работы; средняя — три бригады, пять-шесть работ; сложная — три-четыре
   бригады, семь работ и правила «одной бригаде» или «разным бригадам».
   Бригады работают одновременно. Образцовое — когда последняя бригада
   освободится раньше всего.
   ════════════════════════════════════════════════════════════════════ */
var JOB_T = ["сварка", "электрика", "насосы", "вентиляция", "крепь", "связь"];
var JOB_W = [["шов на трубе", "заплата на баке", "кронштейн насоса"], ["щит освещения", "кабель к лифту", "проводка в мастерской"], ["замена сальника", "чистка фильтра", "перебор насоса"],
  ["чистка вентиляции", "замена вентилятора", "заслонка в шахте"], ["крепь в штреке", "стойки в шахте", "распорки в забое"], ["антенна", "кабель связи", "ретранслятор"]];
function hrs(v) { return pl(v, "час", "часа", "часов"); }
/* (после 4.5, нелогичность) после «из» — родительный падеж: «0 из 3 часов» (было «0 из 3 часа») */
function hrsGen(v) { return pl(v, "часа", "часов", "часов"); }
/* «Не назначена работа 4» / «Не назначены работы 3 и 4» (было «Не назначены работа 4») */
function unassigned(free) { return (free.length === 1 ? "Не назначена работа " : "Не назначены работы ") + andList(free) + "."; }
function cwLoads(D, to) { var l = rep(0, D.m); to.forEach(function (b, j) { if (b >= 0) l[b] += D.jobs[j].h; }); return l; }
function cwCheck(D, to) {
  var j, l = cwLoads(D, to);
  for (j = 0; j < to.length; j++) if (to[j] >= 0 && D.br[to[j]].ok.indexOf(D.jobs[j].t) < 0) return "у бригады " + BRIG[D.br[to[j]].n] + " нет допуска: " + JOB_T[D.jobs[j].t];
  for (var b = 0; b < D.m; b++) if (l[b] > D.br[b].lim) return "у бригады " + BRIG[D.br[b].n] + " " + l[b] + " " + hrs(l[b]) + " при смене " + D.br[b].lim;
  for (var q = 0; q < D.rules.length; q++) {
    var ru = D.rules[q];
    if (to[ru.x] < 0 || to[ru.y] < 0) continue;
    if (ru.t === "with" && to[ru.x] !== to[ru.y]) return "работы " + (ru.x + 1) + " и " + (ru.y + 1) + " должна делать одна бригада";
    if (ru.t === "apart" && to[ru.x] === to[ru.y]) return "работы " + (ru.x + 1) + " и " + (ru.y + 1) + " должны делать разные бригады";
  }
  return "";
}
function cwAll(D, capn, strict) {
  var k = D.jobs.length, to = rep(-1, k), out = [];
  var rec = function (j) {
    if (out.length >= capn) return;
    if (j === k) { if (!strict || !cwCheck(D, to)) out.push(to.slice()); return; }
    for (var b = 0; b < D.m; b++) {
      if (D.br[b].ok.indexOf(D.jobs[j].t) < 0) continue;
      to[j] = b;
      if (!strict || !cwCheck(D, to)) rec(j + 1);
      to[j] = -1;
    }
  };
  rec(0);
  return out;
}
function cwSpan(D, to) { return Math.max.apply(null, cwLoads(D, to)); }
function genCrews(seed, d, depth) {
  var r = rngFor(seed, "crews", d), guard, j, b, D = null, sols = null, wrongTo = null;
  for (guard = 0; guard < 400 && !sols; guard++) {
    var m = d === 0 ? 2 : d === 1 ? 3 : r.int(3, 4), k = d === 0 ? 4 : d === 1 ? r.int(5, 6) : 7;
    var names = choose(r, BRIG.length, m), jobs = [], hid = [];
    for (j = 0; j < k; j++) { var t = r.int(0, JOB_T.length - 1); jobs.push({ t: t, w: r.int(0, 2), h: r.int(1, d === 0 ? 4 : 5) }); hid.push(r.int(0, m - 1)); }
    var br = [];
    for (b = 0; b < m; b++) {
      var ok = []; for (j = 0; j < k; j++) if (hid[j] === b && ok.indexOf(jobs[j].t) < 0) ok.push(jobs[j].t);
      var want = r.int(2, 3), pool = intList(JOB_T.length); r.shuffle(pool);
      for (var q = 0; q < pool.length && ok.length < want; q++) if (ok.indexOf(pool[q]) < 0) ok.push(pool[q]);
      ok.sort(function (x, y) { return x - y; });
      var load = 0; for (j = 0; j < k; j++) if (hid[j] === b) load += jobs[j].h;
      br.push({ n: names[b], ok: ok, lim: Math.max(3, load + r.int(0, 2)) });
    }
    if (br.some(function (x) { return x.lim > 10; })) continue;
    D = { m: m, br: br, jobs: jobs, rules: [] };
    var cur = cwAll(D, 200, true);
    if (cur.length < 2) continue;
    if (d === 2) {
      var nr = r.int(1, 2), tries = 0;
      while (D.rules.length < nr && tries++ < 20) {
        var xy = choose(r, k, 2).sort(function (x, y) { return x - y; }), kind = hid[xy[0]] === hid[xy[1]] ? "with" : "apart";
        if (D.rules.some(function (z) { return z.x === xy[0] && z.y === xy[1]; })) continue;
        D.rules.push({ t: kind, x: xy[0], y: xy[1] });
        var nxt = cur.filter(function (to) { return !cwCheck(D, to); });
        if (nxt.length === cur.length || nxt.length < 2) { D.rules.pop(); continue; }
        cur = nxt;
      }
      if (!D.rules.length) continue;
      cur = cwAll(D, 31, true); /* счёт заново: прежний список мог упереться в потолок */
    }
    if (cur.length < 2 || cur.length > 30) continue;
    var mn = Math.min.apply(null, cur.map(function (to) { return cwSpan(D, to); }));
    if (!cur.some(function (to) { return cwSpan(D, to) > mn; }) && r.chance(0.7)) continue;
    /* неверный наряд: с допусками, но с перегрузом или против правила */
    var loose = cwAll(D, 400, false), bad = loose.filter(function (to) { return cwCheck(D, to); });
    if (!bad.length) continue;
    wrongTo = r.pick(bad);
    sols = cur;
  }
  if (!sols) return genCrews(seed + 7919, d, (depth || 0) + 1);
  var minS = Math.min.apply(null, sols.map(function (to) { return cwSpan(D, to); }));
  var best = sols.filter(function (to) { return cwSpan(D, to) === minS; }), other = sols.filter(function (to) { return cwSpan(D, to) !== minS; });
  r.shuffle(best); r.shuffle(other);
  var altS = [best[0]].concat(other.length ? [other[0]] : [best[1]]);
  var pathOf = function (to) { var p = []; to.forEach(function (b2, j2) { p.push("Работа " + (j2 + 1), "Бригада " + BRIG[D.br[b2].n]); }); p.push("Утвердить наряд"); return p; };
  return { plan: pathOf(altS[0]), alts: altS.map(pathOf), altBest: altS.map(function (to) { return cwSpan(D, to) === minS; }),
    answers: altS.map(function (to) { return { to: to.slice() }; }), wrong: rep(pathOf(wrongTo), 3), sol: sols.length,
    sig: "crews|" + d + "|" + D.br.map(function (x) { return x.lim + ":" + x.ok.join("."); }).join(",") + "|" + D.jobs.map(function (x) { return x.t + ":" + x.h; }).join(",") + "|" +
      D.rules.map(function (ru) { return ru.t + ru.x + "," + ru.y; }).join(";"),
    data: { m: D.m, br: D.br, jobs: D.jobs, rules: D.rules, minS: minS, sol: sols.length, sols: sols.map(function (to) { return to.join(""); }).sort() } };
}
function checkCrews(P, ans) {
  var D = P.data, to = ans && ans.to;
  if (!to || to.length !== D.jobs.length || to.some(function (b) { return !(b >= 0 && b < D.m); })) return { ok: false, best: false, why: "не все работы назначены" };
  var w = cwCheck(D, to);
  return { ok: !w, best: !w && cwSpan(D, to) === D.minS, why: w };
}
function crews(seed, cb, opts) {
  var d = diffOf(opts), P = genCrews(seed, d), D = P.data, k = D.jobs.length, to = rep(-1, k);
  var bname = function (b) { return "бригада " + BRIG[D.br[b].n]; };
  var okTxt = function (b) { return andList(D.br[b].ok.map(function (t) { return JOB_T[t]; })); };
  var jobTxt = function (j) { var x = D.jobs[j]; return JOB_T[x.t] + ", " + JOB_W[x.t][x.w] + ", " + x.h + " " + hrs(x.h); };
  var ruleTxt = D.rules.map(function (ru) {
    return ru.t === "with" ? "работы " + (ru.x + 1) + " и " + (ru.y + 1) + " делает одна бригада: это одно место" : "работы " + (ru.x + 1) + " и " + (ru.y + 1) + " — разным бригадам: их надо вести одновременно, в разных концах шахты";
  });
  var cond = head(opts, d) + "Наряды бригад. " + cap(cnt(D.m, "f", "бригада", "бригады", "бригад")) + ": " + intList(D.m).map(function (b) { return bname(b) + " — смена " + D.br[b].lim + " " + hrs(D.br[b].lim) + ", допуск: " + okTxt(b); }).join("; ") +
    ". Работы: " + intList(k).map(function (j) { return "работа " + (j + 1) + " — " + jobTxt(j); }).join("; ") + ". Каждую работу — одной бригаде с допуском к ней; часы бригады — не больше её смены. Бригады работают одновременно." +
    (ruleTxt.length ? " " + (ruleTxt.length === 1 ? "Правило" : "Правила") + ": " + ruleTxt.join("; ") + "." : "") + " Решений несколько, годится любое; образцовое — когда последняя бригада освободится раньше всего.";
  var last = start("crews", d, P, "Наряды бригад", cond, function (st, finish, fail) {
    var loads = function () { return cwLoads(D, to); };
    var status = function () {
      var l = loads(), free = intList(k).filter(function (j) { return to[j] < 0; }).map(function (j) { return j + 1; });
      return intList(D.m).map(function (b) { return cap(bname(b)) + ": " + l[b] + " из " + D.br[b].lim + " " + hrsGen(D.br[b].lim); }).join("; ") + ". " +
        (free.length ? unassigned(free) : "Все работы назначены.");
    };
    var assign = function (j, b) {
      if (b >= 0 && D.br[b].ok.indexOf(D.jobs[j].t) < 0) { nope("У бригады " + BRIG[D.br[b].n] + " нет допуска: " + JOB_T[D.jobs[j].t] + "."); return; }
      to[j] = b; A("play", b >= 0 ? "paper" : "term_off");
      var l = loads();
      sayq("Работа " + (j + 1) + (b >= 0 ? " — " + bname(b) + ": у неё " + l[b] + " из " + D.br[b].lim + " " + hrsGen(D.br[b].lim) + (l[b] > D.br[b].lim ? ", перебор!" : ".") : " снята, никому не назначена."));
    };
    var out = intList(k).map(function (j) {
      return act(function () { return "Работа " + (j + 1) + ", " + JOB_T[D.jobs[j].t] + ", " + D.jobs[j].h + " " + hrs(D.jobs[j].h) + ": " + (to[j] >= 0 ? bname(to[j]) : "не назначена"); }, function () {
        var l = loads();
        var items = intList(D.m).map(function (b) { return pick("Бригада " + BRIG[D.br[b].n] + ": " + l[b] + " из " + D.br[b].lim + " " + hrsGen(D.br[b].lim) + ", допуск: " + okTxt(b), function () { assign(j, b); }); });
        items.push(pick("Снять назначение", function () { if (to[j] < 0) { nope("Работа и так никому не назначена."); return; } assign(j, -1); }));
        items.push(backItem());
        UIx("menu", "Кому работа " + (j + 1), items);
      });
    });
    out.push(act("Загрузка бригад", function () { say(status()); }));
    out.push(act("Утвердить наряд", function () {
      var free = intList(k).filter(function (j) { return to[j] < 0; }).map(function (j) { return j + 1; });
      if (free.length) { nope(unassigned(free)); return; }
      var w = cwCheck(D, to);
      if (w) { A("play", "term_err"); fail("Начальник смены вернул наряд: " + w + "."); return; }
      var sp = cwSpan(D, to); A("play", "paper_turn");
      win(last, finish, "Наряд утверждён: последняя бригада освободится через " + sp + " " + hrs(sp) + ".", sp === D.minS, "можно было управиться за " + D.minS + " " + hrs(D.minS));
    }));
    out.push(act("Начать заново", function () {
      if (to.every(function (b) { return b < 0; })) { say("Работы и так никому не назначены."); return; }
      to = rep(-1, k); A("play", "term_off"); say("Наряд стёрт: работы никому не назначены.");
    }));
    return out;
  }, cb);
}

/* ════════ РЕГИСТРАЦИЯ ════════ */
var KINDS5 = ["power", "till", "container", "resistors", "frequencies", "route", "valves", "mixture", "rations", "magic", "lamps", "pipes", "mirrors", "crews"];
var NAMES5 = {
  power: "аварийная мощность", till: "разменная касса", container: "укладка контейнера", resistors: "резисторная цепь", frequencies: "частоты узлов",
  route: "маршрут обхода", valves: "клапаны давления", mixture: "смесь по пропорции", rations: "делёж пайков", magic: "магический щит",
  lamps: "расстановка ламп", pipes: "трубопровод", mirrors: "отражатели", crews: "наряды бригад"
};
var GEN5 = { power: genPower, till: genTill, container: genContainer, resistors: genResistors, frequencies: genFrequencies, route: genRoute, valves: genValves,
  mixture: genMixture, rations: genRations, magic: genMagic, lamps: genLamps, pipes: genPipes, mirrors: genMirrors, crews: genCrews };
var UIF5 = { power: power, till: till, container: container, resistors: resistors, frequencies: frequencies, route: route, valves: valves,
  mixture: mixture, rations: rations, magic: magic, lamps: lamps, pipes: pipes, mirrors: mirrors, crews: crews };
var CHK5 = { power: checkPower, till: checkTill, container: checkContainer, resistors: checkResistors, frequencies: checkFrequencies, route: checkRoute, valves: checkValves,
  mixture: checkMixture, rations: checkRations, magic: checkMagic, lamps: checkLamps, pipes: checkPipes, mirrors: checkMirrors, crews: checkCrews };
KINDS5.forEach(function (k) { LAB.puzzles.register(k, NAMES5[k], UIF5[k], { diffs: true }); });
function gen5(kind, seed, diff) { var g = GEN5[kind]; return g ? g(seed || 1, diffOf({ diff: diff })) : null; }
LAB.puzzles5 = {
  kinds: KINDS5.slice(), names: NAMES5, match: match, gen: gen5,
  plan: function (kind, seed, diff) { var P = gen5(kind, seed, diff); return P ? P.plan.slice() : null; },
  sig: function (kind, seed, diff) { var P = gen5(kind, seed, diff); return P ? P.sig : null; },
  /* задача — то, что вернул gen, или его data, или { seed, diff }; ответ — в записи вида (примеры — gen(...).answers) */
  solve: function (kind, task, answer) {
    var c = CHK5[kind];
    if (!c || !task) return { ok: false, best: false, why: "нет такой задачи" };
    var P = task.data ? task : task.seed != null ? gen5(kind, task.seed, task.diff) : { data: task };
    try { return c(P, answer); } catch (e) { return { ok: false, best: false, why: "ответ не разобран" }; }
  }
};
})();
