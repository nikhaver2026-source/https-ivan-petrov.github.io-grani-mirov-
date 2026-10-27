/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — логические головоломки (1.6).
   Не на слух, а на размышление, и все — из жизни комплекса: щит
   автоматики, карантинный шлюз, пробы с перепутанными ярлыками, дозиметр
   и контейнеры, расписание смен, журнал смены. И отложенная шахматная
   партия: мат в один ход. Всё — окнами меню (стрелки, Enter, свайпы и
   двойное касание), без жестов на слух. Условие можно переслушать.
   open(kind, seed, cb, opts) — запустить; cb(true) — решено, cb(false) —
   попытки кончились (прерванная головоломка — cb(false)).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function G() { return LAB.game.G; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { /* */ } } return null; }
function rng(seed, tag) { return LAB.Rng(seed || 1, "pz:" + tag); }
function pl(n, a, b, c) { n = Math.abs(n) % 100; if (n >= 11 && n <= 14) return c; var m = n % 10; return m === 1 ? a : (m >= 2 && m <= 4 ? b : c); }
function lvl() { var g = G(); return g ? g.L : 1; }
function hard() { return Math.min(3, Math.floor(lvl() / 20)); } /* 0–3: глубже — сложнее */

var NAMES = {
  breaker: "щит автоматики", decon: "карантинный шлюз", labels: "пробы с ярлыками", dosim: "дозиметр и контейнеры",
  shifts: "расписание смен", tally: "журнал смены", chess: "отложенная партия"
};
var KINDS = ["breaker", "decon", "labels", "dosim", "shifts", "tally"];

/* Окно условия: прочитать, потом — к решению. Условие всегда можно
   переслушать пунктом «Условие ещё раз». */
function run(name, cond, build, cb) {
  var state = { tries: 0, limit: 3, done: false };
  var finish = function (ok, text) {
    if (state.done) return; state.done = true;
    UIx("closeAll");
    LAB.UI[ok ? "ok" : "error"]();
    say(text);
    if (ok && LAB.tutor) LAB.tutor.ev("puzzle");
    setTimeout(function () { if (cb) cb(ok); }, 30);
  };
  var fail = function (why) {
    state.tries++;
    if (state.tries >= state.limit) { finish(false, why + " Попытки кончились."); return false; }
    LAB.UI.error();
    say(why + " Осталось попыток: " + (state.limit - state.tries) + ".");
    return true;
  };
  var menuItems = function () {
    var items = build(state, finish, fail, menuItems);
    items.push({ label: "Условие ещё раз", keep: true, fn: function () { say(cond, { read: true }); } });
    items.push({ label: "Отойти от задачи", fn: function () { if (!state.done) { state.done = true; say("Вы отходите. Задача ждёт."); if (cb) setTimeout(function () { cb(false); }, 30); } } });
    return items;
  };
  var open = function () { UIx("menu", name, menuItems(), { intro: "", rebuild: menuItems, puzzle: true }); };
  UIx("closeAll");
  UIx("note", name, cond, open, { closeLabel: "К решению", puzzle: true });
  return state;
}

/* ════════ ЩИТ АВТОМАТИКИ: набрать ровно нужный ток ════════
   Автоматы с номиналами; привод двери требует ровно столько ампер: больше —
   выбьет защиту, меньше — не откроется. Решение есть всегда: номиналы
   нужных автоматов задают сумму, остальные — помеха. */
function breaker(seed, cb, opts) {
  var r = rng(seed, "breaker"), h = hard();
  var n = 5 + h, pick = 2 + Math.min(2, h), vals = [], i;
  for (i = 0; i < n; i++) vals.push(r.int(3, 9 + h * 3));
  var idx = []; for (i = 0; i < n; i++) idx.push(i); r.shuffle(idx);
  var need = 0; for (i = 0; i < pick; i++) need += vals[idx[i]];
  var dev = r.pick(["Дверной привод", "Электрозамок", "Привод гермостворки", "Магнитный замок"]);
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Щит автоматики. " + dev + " требует ровно " + need + " " + pl(need, "ампер", "ампера", "ампер") +
    ": больше — выбьет защиту, меньше — не откроется. Автоматы на щите: " +
    vals.map(function (v, k) { return "номер " + (k + 1) + " — " + v + " А"; }).join(", ") + ". Включите те, что вместе дают ровно " + need + ".";
  var on = vals.map(function () { return false; });
  run("Щит автоматики", cond, function (st, finish, fail, items) {
    var out = vals.map(function (v, k) {
      return { label: "Автомат " + (k + 1) + ", " + v + " А: " + (on[k] ? "включён" : "выключен"), keep: true, fn: function () {
        on[k] = !on[k]; A("play", on[k] ? "term_beep" : "term_off");
        var sum = 0; vals.forEach(function (vv, j) { if (on[j]) sum += vv; });
        sayq("Автомат " + (k + 1) + (on[k] ? " включён" : " выключен") + ". На шине " + sum + " А.");
      } };
    });
    out.push({ label: "Подать питание на привод", fn: function () {
      var sum = 0; vals.forEach(function (v, j) { if (on[j]) sum += v; });
      if (sum === need) { A("play", "power_on"); finish(true, "Привод загудел ровно: " + need + " А. Щит собран."); return; }
      A("play", "term_err");
      if (sum > need) on = vals.map(function () { return false; }); /* выбило защиту — всё выключилось */
      if (!fail(sum > need ? "На шине " + sum + " А — защита выбила, все автоматы отключились." : "На шине " + sum + " А — приводу мало.")) return;
    } });
    return out;
  }, cb);
}

/* ════════ КАРАНТИННЫЙ ШЛЮЗ: порядок обработки ════════
   Пять шагов обработки, порядок задан инструкцией намёками: «до», «после»,
   «сразу после», «первым», «последним». Порядок единственный. */
var DECON_STEPS = ["снять верхний костюм", "душ с раствором", "ультрафиолетовая камера", "смена фильтра маски", "отметка в журнале", "продувка сжатым воздухом"];
function perms(arr) { if (arr.length <= 1) return [arr.slice()]; var out = []; arr.forEach(function (v, i) { perms(arr.slice(0, i).concat(arr.slice(i + 1))).forEach(function (p) { out.push([v].concat(p)); }); }); return out; }
function decon(seed, cb, opts) {
  var r = rng(seed, "decon"), h = hard();
  var n = 4 + Math.min(1, h), steps = DECON_STEPS.slice(); r.shuffle(steps); steps = steps.slice(0, n);
  var order = steps.slice(); r.shuffle(order); /* истинный порядок */
  var pos = function (o, s) { return o.indexOf(s); };
  /* правила-кандидаты */
  var cand = [];
  for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) if (a !== b) {
    var sa = order[a], sb = order[b];
    if (a < b) cand.push({ t: "«" + sa + "» — раньше, чем «" + sb + "»", ok: function (o) { return pos(o, this.x) < pos(o, this.y); }, x: sa, y: sb });
    if (b === a + 1) cand.push({ t: "«" + sb + "» — сразу после «" + sa + "»", ok: function (o) { return pos(o, this.y) === pos(o, this.x) + 1; }, x: sa, y: sb });
  }
  cand.push({ t: "первым идёт «" + order[0] + "»", ok: function (o) { return o[0] === this.x; }, x: order[0] });
  cand.push({ t: "последним идёт «" + order[n - 1] + "»", ok: function (o) { return o[n - 1] === this.x; }, x: order[n - 1] });
  r.shuffle(cand);
  var all = perms(steps), rules = [];
  var fits = function (o) { return rules.every(function (ru) { return ru.ok(o); }); };
  for (var ci = 0; ci < cand.length; ci++) {
    var cnt = all.filter(fits).length;
    if (cnt <= 1) break;
    rules.push(cand[ci]);
    var cnt2 = all.filter(fits).length;
    if (cnt2 === cnt) rules.pop(); /* правило ничего не сужает — лишнее */
  }
  LAB.puzzles._last = { kind: "decon", sol: all.filter(fits).length, rules: rules.length };
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Карантинный шлюз. Обработка — " + n + " " + pl(n, "шаг", "шага", "шагов") + ": " +
    steps.map(function (s) { return "«" + s + "»"; }).join(", ") + ". Инструкция на стене: " + rules.map(function (ru) { return ru.t; }).join("; ") + ". Соберите порядок обработки.";
  var chosen = [];
  run("Карантинный шлюз", cond, function (st, finish, fail, items) {
    var out = [];
    out.push({ label: "Собрано: " + (chosen.length ? chosen.map(function (s, k) { return (k + 1) + " — " + s; }).join(", ") : "пока ничего"), info: true, keep: true, fn: function () { say(chosen.length ? "Собрано: " + chosen.map(function (s, k) { return (k + 1) + " — " + s; }).join(", ") + "." : "Пока ничего не выбрано."); } });
    steps.forEach(function (s) {
      if (chosen.indexOf(s) >= 0) return;
      out.push({ label: "Шаг " + (chosen.length + 1) + ": " + s, keep: true, fn: function () {
        chosen.push(s); A("play", "term_beep");
        if (chosen.length < n) { sayq("Шаг " + chosen.length + " — " + s + "."); UIx("refresh"); return; }
        var ok = chosen.every(function (v, k) { return v === order[k]; });
        if (ok) { A("play", "code_ok"); finish(true, "Шлюз принял порядок: форсунки зашипели по очереди, табло зелёное."); return; }
        A("play", "term_err");
        var first = -1; for (var k = 0; k < n; k++) if (chosen[k] !== order[k]) { first = k; break; }
        chosen = [];
        fail("Табло красное: порядок неверен, сбой на шаге " + (first + 1) + ". Начните заново.");
        UIx("refresh");
      } });
    });
    if (chosen.length) out.push({ label: "Сбросить и собрать заново", keep: true, fn: function () { chosen = []; say("Сброшено."); UIx("refresh"); } });
    return out;
  }, cb);
}

/* ════════ ПРОБЫ С ЯРЛЫКАМИ: все ярлыки перепутаны ════════
   Три контейнера, ярлыки — все до одного не на своём месте. Одна проверка
   показывает, что в одном контейнере на самом деле. Дальше — рассуждение. */
var SUBST = [
  { n: "дистиллят", t: "ничего: не горит, не пахнет, не шипит" }, { n: "спирт", t: "вспыхивает от искры" }, { n: "раствор хлорки", t: "резко пахнет" },
  { n: "кислота", t: "шипит на стальной стружке" }, { n: "щёлочь", t: "мылит пальцы" }, { n: "масло", t: "не смешивается с водой" }
];
function labels(seed, cb, opts) {
  var r = rng(seed, "labels"), h = hard();
  var n = 3 + (h >= 2 ? 1 : 0), subs = SUBST.slice(); r.shuffle(subs); subs = subs.slice(0, n);
  /* истинное содержимое — полный беспорядок относительно ярлыков */
  var truth, guard = 0;
  do { truth = subs.slice(); r.shuffle(truth); guard++; } while (truth.some(function (s, k) { return s === subs[k]; }) && guard < 200);
  var lab = subs; /* ярлык контейнера k — lab[k]; внутри — truth[k] */
  /* проверки, пока решение не станет единственным: берём контейнер и говорим, что в нём */
  var derangements = perms(subs).filter(function (p) { return p.every(function (s, k) { return s !== lab[k]; }); });
  var known = [];
  var fits = function (p) { return known.every(function (kn) { return p[kn.k] === kn.s; }); };
  var ks = []; for (var i = 0; i < n; i++) ks.push(i); r.shuffle(ks);
  for (var ki = 0; ki < ks.length && derangements.filter(fits).length > 1; ki++) known.push({ k: ks[ki], s: truth[ks[ki]] });
  LAB.puzzles._last = { kind: "labels", sol: derangements.filter(fits).length, known: known.length };
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Пробы. " + n + " " + pl(n, "контейнер", "контейнера", "контейнеров") + " с ярлыками: " +
    lab.map(function (s, k) { return "номер " + (k + 1) + " — «" + s.n + "»"; }).join(", ") + ". Лаборант записал: все ярлыки перепутаны, ни один не на своём месте. " +
    "Проверка: " + known.map(function (kn) { return "содержимое контейнера " + (kn.k + 1) + " " + kn.s.t + " — значит, там " + kn.s.n; }).join("; ") + ". Определите, что в каждом контейнере.";
  var ans = lab.map(function () { return null; });
  run("Пробы с ярлыками", cond, function (st, finish, fail, items) {
    var out = lab.map(function (s, k) {
      /* (3.5) подпись читается в миг показа: после выбора звучит выбранное, а не «не определено» */
      return { label: function () { return "Контейнер " + (k + 1) + " (ярлык «" + s.n + "»): " + (ans[k] ? ans[k].n : "не определено"); }, keep: true, fn: function () {
        UIx("menu", "Контейнер " + (k + 1) + ": что внутри?", subs.map(function (sub) { return { label: sub.n, fn: function () { ans[k] = sub; sayq("Контейнер " + (k + 1) + ": " + sub.n + "."); UIx("refresh"); } }; }));
      } };
    });
    out.push({ label: "Сдать ответ", fn: function () {
      if (ans.some(function (a) { return !a; })) { say("Не всё определено."); return; }
      var ok = ans.every(function (a, k) { return a === truth[k]; });
      if (ok) { A("play", "code_ok"); finish(true, "Ярлыки переклеены верно: лаборант был бы доволен."); return; }
      A("play", "term_err"); fail("Хотя бы один ответ неверен.");
    } });
    return out;
  }, cb);
}

/* ════════ ДОЗИМЕТР: найти горячий контейнер ════════
   Контейнеры стоят сеткой. Дозиметр мерили по рядам и по столбцам: источник
   даёт 10, соседи по стороне — по 3. Где источник? */
function dosim(seed, cb, opts) {
  var r = rng(seed, "dosim"), h = hard();
  var n = 3 + (h >= 1 ? 1 : 0), sx = r.int(0, n - 1), sy = r.int(0, n - 1);
  var val = function (x, y) { var d = Math.abs(x - sx) + Math.abs(y - sy); return d === 0 ? 10 : d === 1 ? 3 : 0; };
  var rows = [], cols = [], y, x;
  for (y = 0; y < n; y++) { var s = 0; for (x = 0; x < n; x++) s += val(x, y); rows.push(s); }
  for (x = 0; x < n; x++) { var s2 = 0; for (y = 0; y < n; y++) s2 += val(x, y); cols.push(s2); }
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Склад контейнеров: " + n + " " + pl(n, "ряд", "ряда", "рядов") + " по " + n + ", ряды считаются от двери, места в ряду — слева направо. Один контейнер горячий: источник даёт дозиметру 10, соседние с ним по стороне — по 3, остальные молчат. " +
    "Замеры по рядам: " + rows.map(function (v, k) { return "ряд " + (k + 1) + " — " + v; }).join(", ") + ". По столбцам: " + cols.map(function (v, k) { return "место " + (k + 1) + " — " + v; }).join(", ") + ". Какой контейнер горячий?";
  run("Дозиметр и контейнеры", cond, function (st, finish, fail, items) {
    var out = [];
    for (var yy = 0; yy < n; yy++) (function (yy) {
      out.push({ label: "Ряд " + (yy + 1), fn: function () {
        var inner = [];
        for (var xx = 0; xx < n; xx++) (function (xx) {
          inner.push({ label: "Ряд " + (yy + 1) + ", место " + (xx + 1), fn: function () {
            if (xx === sx && yy === sy) { A("play", "code_ok"); finish(true, "Дозиметр затрещал у контейнера: ряд " + (yy + 1) + ", место " + (xx + 1) + ". Источник найден и закрыт свинцом."); return; }
            A("play", "term_err"); fail("У контейнера тихо: " + (val(xx, yy) ? "фонит слабо, источник рядом." : "ни щелчка."));
          } });
        })(xx);
        UIx("menu", "Ряд " + (yy + 1), inner);
      } });
    })(yy);
    return out;
  }, cb);
}

/* ════════ РАСПИСАНИЕ СМЕН: кто где дежурил ════════
   Трое дежурных, три поста. Из журнала известны обрывки. Вопрос: кто был
   на посту, который спрашивает замок. Решение единственное. */
var STAFF = ["Ильин", "Петрова", "Коваль", "Серова", "Нагиев", "Брагина", "Тихонов", "Лапина"];
var POSTS = ["на проходной", "на складе", "в серверной", "в виварии", "у реактора", "в медблоке"];
function shifts(seed, cb, opts) {
  var r = rng(seed, "shifts"), h = hard();
  var n = 3 + (h >= 2 ? 1 : 0), people = STAFF.slice(), posts = POSTS.slice(); r.shuffle(people); r.shuffle(posts);
  people = people.slice(0, n); posts = posts.slice(0, n);
  var truth = people.slice(); r.shuffle(truth); /* truth[j] дежурил на posts[j] */
  var all = perms(people), cand = [];
  for (var j = 0; j < n; j++) for (var p = 0; p < n; p++) if (truth[j] !== people[p]) cand.push({ t: people[p] + " не дежурил" + (/а$/.test(people[p]) ? "а" : "") + " " + posts[j], ok: function (o) { return o[this.j] !== this.who; }, j: j, who: people[p] });
  /* «смена X кончилась раньше смены того, кто дежурил Y» — значит, X дежурил не Y */
  for (var j2 = 0; j2 < n; j2++) for (var j3 = 0; j3 < n; j3++) if (j2 !== j3) cand.push({ t: "смена " + truth[j2] + " кончилась раньше смены того, кто дежурил " + posts[j3], ok: function (o) { return o[this.j] !== this.who; }, j: j3, who: truth[j2] });
  r.shuffle(cand);
  var rules = [], fits = function (o) { return rules.every(function (ru) { return ru.ok(o); }); };
  for (var ci = 0; ci < cand.length; ci++) {
    var cnt = all.filter(fits).length; if (cnt <= 1) break;
    rules.push(cand[ci]); if (all.filter(fits).length === cnt) rules.pop();
  }
  var ask = r.int(0, n - 1);
  LAB.puzzles._last = { kind: "shifts", sol: all.filter(fits).length, rules: rules.length };
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Журнал дежурств за прошлую смену порван. Дежурили " + people.join(", ") + " — по одному " + posts.join(", ") + ". Уцелело: " +
    rules.map(function (ru) { return ru.t; }).join("; ") + ". Замок спрашивает: кто дежурил " + posts[ask] + "?";
  run("Расписание смен", cond, function (st, finish, fail, items) {
    return people.map(function (who) {
      return { label: who, fn: function () {
        if (who === truth[ask]) { A("play", "code_ok"); finish(true, "Верно: " + posts[ask] + " дежурил" + (/а$/.test(who) ? "а" : "") + " " + who + ". Замок открыт."); return; }
        A("play", "term_err"); fail("Не сходится с журналом.");
      } };
    });
  }, cb);
}

/* ════════ ЖУРНАЛ СМЕНЫ: сколько осталось ════════
   Пароль — число, которое получится, если пройти по записям журнала:
   получено, выдано, списано, возвращено. */
var GOODS = ["пробирок", "ампул", "фильтров", "датчиков", "ключ-карт", "пайков"];
function tally(seed, cb, opts) {
  var r = rng(seed, "tally"), h = hard();
  var what = r.pick(GOODS), start = r.int(12, 40), cur = start, lines = [], n = 4 + h;
  for (var i = 0; i < n; i++) {
    var kind = r.int(0, 3), q = r.int(2, 9);
    if (kind === 0) { cur += q; lines.push("получено со склада " + q); }
    else if (kind === 1) { q = Math.min(q, cur - 1); cur -= q; lines.push("выдано в смену " + q); }
    else if (kind === 2) { q = Math.min(q, cur - 1); cur -= q; lines.push("списано " + q); }
    else { cur += q; lines.push("возвращено " + q); }
  }
  var cond = (opts && opts.title ? opts.title + ". " : "") + "Журнал смены. Пароль замка — сколько " + what + " осталось к концу смены. В начале смены " + what + " было " + start + ". Записи по порядку: " +
    lines.join("; ") + ". Сколько осталось?";
  var opts2 = [cur]; var guard = 0;
  while (opts2.length < 5 && guard++ < 100) { var v = cur + r.int(-9, 9); if (v > 0 && opts2.indexOf(v) < 0) opts2.push(v); }
  r.shuffle(opts2);
  run("Журнал смены", cond, function (st, finish, fail, items) {
    return opts2.map(function (v) {
      return { label: String(v), fn: function () {
        if (v === cur) { A("play", "code_ok"); finish(true, "Пароль принят: " + cur + ". Замок открыт."); return; }
        A("play", "term_err"); fail("Пароль не подошёл.");
      } };
    });
  }, cb);
}

/* ════════ ШАХМАТЫ: отложенная партия, мат в один ход ════════
   Маленький движок: ходы фигур, шах, мат. Позиции — из жизни комнаты
   отдыха: партия отложена на ход белых, и ход этот — матующий. */
var FILES = "abcdefgh", FILE_SAY = { a: "а", b: "бэ", c: "цэ", d: "дэ", e: "е", f: "эф", g: "жэ", h: "аш" };
var PIECE_RU = { K: "король", Q: "ферзь", R: "ладья", B: "слон", N: "конь", P: "пешка" };
var POSITIONS = [
  "wKg1 wRa1 bKg8 bPf7 bPg7 bPh7",
  "wKg6 wQa1 bKg8",
  "wKg1 wNe5 bKh8 bRg8 bPg7 bPh7",
  "wKg1 wRa7 wRb1 bKd8",
  "wKe6 wRh1 bKe8",
  "wKe1 wQh5 wBc4 bKe8 bQd8 bBf8 bPd7 bPf7 bPg7 bPe5",
  "wKg6 wQd1 bKh8",
  "wKg1 wQc3 wNf5 bKh8 bPg7 bPh7 bRf8",
  "wKb6 wRh1 bKa8",
  "wKh1 wQe4 wBb2 bKg8 bPf7 bPg7 bPh7 bRa8"
];
function parsePos(s) {
  var board = {};
  s.split(/\s+/).forEach(function (tok) { if (!tok) return; board[tok.slice(2)] = { c: tok[0], t: tok[1] }; });
  return board;
}
function sqOk(f, r) { return f >= 0 && f < 8 && r >= 1 && r <= 8; }
function sqName(f, r) { return FILES[f] + r; }
function sqParse(sq) { return [FILES.indexOf(sq[0]), +sq[1]]; }
function saySq(sq) { return FILE_SAY[sq[0]] + " " + sq[1]; }
/* псевдоходы фигуры (без проверки шаха) */
function moves(board, sq) {
  var p = board[sq], out = [], fr = sqParse(sq), f = fr[0], r = fr[1];
  if (!p) return out;
  var add = function (ff, rr) { if (!sqOk(ff, rr)) return false; var q = board[sqName(ff, rr)]; if (q && q.c === p.c) return false; out.push(sqName(ff, rr)); return !q; };
  var slide = function (dirs) { dirs.forEach(function (d) { var ff = f + d[0], rr = r + d[1]; while (add(ff, rr)) { ff += d[0]; rr += d[1]; } }); };
  if (p.t === "N") [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(function (d) { add(f + d[0], r + d[1]); });
  else if (p.t === "K") [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { add(f + d[0], r + d[1]); });
  else if (p.t === "R") slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (p.t === "B") slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  else if (p.t === "Q") slide([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  else if (p.t === "P") {
    var dir = p.c === "w" ? 1 : -1, start = p.c === "w" ? 2 : 7;
    if (sqOk(f, r + dir) && !board[sqName(f, r + dir)]) { out.push(sqName(f, r + dir)); if (r === start && !board[sqName(f, r + 2 * dir)]) out.push(sqName(f, r + 2 * dir)); }
    [[-1, dir], [1, dir]].forEach(function (d) { var ff = f + d[0], rr = r + d[1]; if (sqOk(ff, rr)) { var q = board[sqName(ff, rr)]; if (q && q.c !== p.c) out.push(sqName(ff, rr)); } });
  }
  return out;
}
/* атакует ли сторона c поле sq (пешка бьёт наискосок) */
function attacked(board, sq, c) {
  for (var s in board) {
    var p = board[s]; if (p.c !== c) continue;
    if (p.t === "P") { var fr = sqParse(s), dir = c === "w" ? 1 : -1; if ((sqName(fr[0] - 1, fr[1] + dir) === sq && sqOk(fr[0] - 1, fr[1] + dir)) || (sqName(fr[0] + 1, fr[1] + dir) === sq && sqOk(fr[0] + 1, fr[1] + dir))) return true; continue; }
    if (moves(board, s).indexOf(sq) >= 0) return true;
  }
  return false;
}
function kingSq(board, c) { for (var s in board) if (board[s].c === c && board[s].t === "K") return s; return null; }
function apply(board, from, to) { var b = {}; for (var s in board) b[s] = board[s]; var p = b[from]; delete b[from]; b[to] = (p.t === "P" && (to[1] === "8" || to[1] === "1")) ? { c: p.c, t: "Q" } : p; return b; }
function legal(board, c) {
  var out = [];
  for (var s in board) { if (board[s].c !== c) continue; moves(board, s).forEach(function (to) { var b2 = apply(board, s, to); var k = kingSq(b2, c); if (k && !attacked(b2, k, c === "w" ? "b" : "w")) out.push({ from: s, to: to }); }); }
  return out;
}
function inCheck(board, c) { var k = kingSq(board, c); return !!k && attacked(board, k, c === "w" ? "b" : "w"); }
function isMate(board, c) { return inCheck(board, c) && legal(board, c).length === 0; }
function matingMoves(board) { return legal(board, "w").filter(function (m) { return isMate(apply(board, m.from, m.to), "b"); }); }
/* самопроверка позиций: у каждой есть мат в один ход (для тестов) */
function chessCheck() { return POSITIONS.map(function (p) { return matingMoves(parsePos(p)).length; }); }
function describePos(board) {
  var side = function (c) { var arr = []; for (var s in board) if (board[s].c === c) arr.push({ s: s, t: board[s].t }); arr.sort(function (a, b) { return "KQRBNP".indexOf(a.t) - "KQRBNP".indexOf(b.t); }); return arr.map(function (p) { return PIECE_RU[p.t] + " " + saySq(p.s); }).join(", "); };
  return "Белые: " + side("w") + ". Чёрные: " + side("b") + ".";
}
function chess(cb, opts) {
  opts = opts || {};
  var g = G(), r = rng(opts.seed || (g ? g.seed + g.L * 7 + g.F : 1), "chess");
  var pos = POSITIONS[r.int(0, POSITIONS.length - 1)], board = parsePos(pos);
  var mates = matingMoves(board);
  if (!mates.length) { board = parsePos(POSITIONS[0]); mates = matingMoves(board); }
  var cond = "Отложенная партия, ход белых. " + describePos(board) + " По записи на листке — белые ставят мат в один ход. Найдите его: сначала фигура, потом поле.";
  var name = opts.title || "Отложенная партия";
  var tries = 0, limit = 2, done = false;
  var finish = function (ok, text) { if (done) return; done = true; UIx("closeAll"); LAB.UI[ok ? "ok" : "error"](); say(text); if (ok && LAB.tutor) LAB.tutor.ev("puzzle"); setTimeout(function () { if (cb) cb(ok); }, 30); };
  var open = function () {
    /* белые фигуры, у которых есть ход; король — в конце списка */
    var lm0 = legal(board, "w"), pieces = [];
    for (var s in board) if (board[s].c === "w" && lm0.some(function (m) { return m.from === s; })) pieces.push(s);
    pieces.sort(function (a, b) { return "QRBNPK".indexOf(board[a].t) - "QRBNPK".indexOf(board[b].t); });
    var items = pieces.map(function (s) {
      return { label: PIECE_RU[board[s].t].charAt(0).toUpperCase() + PIECE_RU[board[s].t].slice(1) + " " + saySq(s), fn: function () {
        var lm = legal(board, "w").filter(function (m) { return m.from === s; });
        if (!lm.length) { say("У этой фигуры нет ходов."); return; }
        UIx("menu", PIECE_RU[board[s].t] + " " + saySq(s) + ": куда?", lm.map(function (m) {
          var cap = board[m.to] ? " — взятие: " + PIECE_RU[board[m.to].t] : "";
          return { label: "На " + saySq(m.to) + cap, fn: function () {
            var b2 = apply(board, m.from, m.to);
            if (isMate(b2, "b")) { A("play", "code_ok"); finish(true, PIECE_RU[board[s].t] + " " + saySq(m.from) + " — " + saySq(m.to) + ". Мат! Чёрный король не уходит. Партия за вами."); return; }
            tries++;
            var why = inCheck(b2, "b") ? "Шах, но не мат: у чёрного короля есть выход." : "Это не шах: чёрные спокойно продолжают.";
            if (tries >= limit) { finish(false, why + " Партия снова отложена."); return; }
            LAB.UI.error(); say(why + " Осталась попытка. Подумайте ещё.");
            UIx("closeTop", true);
          } };
        }));
      } };
    });
    items.push({ label: "Позиция ещё раз", keep: true, fn: function () { say(cond, { read: true }); } });
    items.push({ label: "Отойти от доски", fn: function () { if (!done) { done = true; say("Вы отходите: партия ждёт."); if (cb) setTimeout(function () { cb(false); }, 30); } } });
    UIx("menu", name, items, { puzzle: true });
  };
  UIx("closeAll");
  A("play", "paper");
  UIx("note", name, cond, open, { closeLabel: "К доске", puzzle: true });
}

var FN = { breaker: breaker, decon: decon, labels: labels, dosim: dosim, shifts: shifts, tally: tally };
/* (2.0) Новые виды задач подключаются отдельными модулями (puzzles2.js):
   register(вид, название, fn) — fn(seed, cb, opts); opts.diff — сложность
   0 простая, 1 средняя, 2 сложная (её задаёт этаж; без неё — по глубине). */
var DIFFS = {};
function register(kind, name, fn, o) {
  FN[kind] = fn; NAMES[kind] = name;
  if (KINDS.indexOf(kind) < 0) KINDS.push(kind);
  if (o && o.diffs) DIFFS[kind] = true;
}
function open(kind, seed, cb, opts) {
  if (kind === "chess") { chess(cb, Object.assign({ seed: seed }, opts || {})); return true; }
  if (!FN[kind]) return false;
  opts = opts || {};
  if (DIFFS[kind] && opts.diff == null) opts.diff = Math.min(2, Math.floor(lvl() / 10));
  FN[kind](seed || 1, cb, opts);
  return true;
}
LAB.puzzles = { KINDS: KINDS, NAMES: NAMES, open: open, chess: chess, register: register, hasDiff: function (k) { return !!DIFFS[k]; },
  has: function (k) { return !!FN[k] || k === "chess"; }, nameOf: function (k) { return NAMES[k] || "головоломка"; },
  util: { run: run, rng: rng, pl: pl, say: say, sayq: sayq, UIx: UIx, A: A, perms: perms },
  _chessCheck: chessCheck, _matingMoves: function (s) { return matingMoves(parsePos(s)); }, _perms: perms };
})();
