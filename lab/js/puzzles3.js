/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — логические замки, часть третья (3.3).
   Шесть видов задач про пароли, архивы и взлом подземного комплекса,
   у каждой три сложности (opts.diff: 0 — простая, 1 — средняя, 2 —
   сложная): взлом терминала по словарю, архив по описи, пароль в
   записке, журнал доступа, контрольная сумма, стёртая клавиатура.
   Всё — окнами меню, условие можно переслушать, текущее положение
   всегда слышно в пунктах или в пункте вроде «Что набрано».
   Подключается после puzzles2.js: виды регистрируются через
   LAB.puzzles.register, окно условия и три попытки — его run.
   Генераторы — чистые функции зерна и сложности (без окон и без
   Math.random): решение есть всегда, а где ответ один — он один
   (проверено перебором прямо в генераторе). Взлом терминала: набор
   слов таков, что стратегия «лучшего деления» снимает пароль за три
   попытки при любом пароле (это и проверено, и заложено в plan).
   Для проверок: LAB.puzzles._last = { kind, diff, plan, wrong, ... };
   LAB.puzzles3.plan(вид, зерно, сложность) — тот же план без окон.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
if (!LAB || !LAB.puzzles || !LAB.puzzles.register || !LAB.puzzles.util) {
  if (typeof console !== "undefined") console.warn("puzzles3.js: сначала нужен puzzles.js");
  return;
}
var U = LAB.puzzles.util, run = U.run, pl = U.pl, say = U.say, UIx = U.UIx, A = U.A, perms = U.perms;

/* ════════ ОБЩЕЕ (повторяет стиль puzzles2.js) ════════ */
var HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
var LETTER = /[0-9A-Za-zА-Яа-яЁё]/;
var ABC = "абвгдежзийклмнопрстуфхцчшщъыьэюя".split("");
/* полный алфавит из 33 букв: нужен сдвигу в записке и разбивке фамилий */
var ABC33 = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
function diffOf(opts) {
  var d = opts && opts.diff != null ? Math.floor(Number(opts.diff)) : 1;
  if (d > 2) return 2;
  if (d < 0) return 0;
  return d >= 0 ? d : 1;
}
function rngFor(seed, kind, d, salt) { return U.rng(seed, "p3:" + kind + ":" + d + (salt != null ? ":" + salt : "")); }
function head(opts, d) { return (opts && opts.title ? opts.title + ". " : "") + HEADS[d] + " "; }
function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
function andList(arr) { arr = arr.map(String); if (arr.length < 2) return arr.join(""); return arr.slice(0, -1).join(", ") + " и " + arr[arr.length - 1]; }
function nope(t) { A("play", "code_fail"); say(t); }
function act(label, fn) { return { label: label, keep: true, fn: fn }; }
function fem(name) { return /а$/.test(name) ? "а" : ""; }
function digitSum(v) { v = Math.abs(v); var s = 0; while (v) { s += v % 10; v = Math.floor(v / 10); } return s; }
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

/* ════════════════════════════════════════════════════════════════════
   1. ВЗЛОМ ТЕРМИНАЛА ПО СЛОВАРЮ
   Терминал держит один из N паролей равной длины. На неверное слово
   отвечает, сколько букв совпало на своих местах. Три попытки, и этого
   хватает: набор слов подобран так, что стратегия «лучшего деления»
   (каждый раз брать слово, после которого худшая оставшаяся группа
   наименьшая) снимает любой пароль за три шага. Это и план.
   ════════════════════════════════════════════════════════════════════ */
var HACK = {
  5: ["архив", "опись", "отсек", "карта", "пульт", "экран", "модем", "вирус", "логин", "токен", "штамп", "бланк", "досье", "замок", "засов", "насос", "колба", "лампа", "щиток", "плата", "канал", "линия", "сетка", "маска", "шприц", "штамм", "спирт", "склад", "отдел", "смена", "связь", "ангар", "бирка", "метка", "номер", "почта", "радар", "лазер", "робот", "фреон", "титан", "кварц", "катод", "ротор", "шахта", "цифра", "буква", "слово", "текст", "схема", "стенд", "дозор", "рычаг", "шланг", "заряд", "зажим", "проба", "агент", "шпион", "сеанс", "вахта", "взрыв", "пожар"],
  6: ["пароль", "доступ", "допуск", "сервер", "бункер", "датчик", "кнопка", "клапан", "кабель", "фильтр", "штатив", "мутант", "анализ", "осадок", "журнал", "реестр", "запрос", "печать", "пломба", "сигнал", "сектор", "корпус", "ячейка", "модуль", "прибор", "сканер", "камера", "курсор", "символ", "строка", "разряд", "вектор", "запись", "оттиск", "приказ", "сирена", "охрана", "караул", "турель", "вакуум", "плазма", "изотоп", "нейрон", "микроб", "токсин", "протон", "фонарь", "провод", "пинцет", "сверло", "секрет", "листок", "бумага", "доклад", "сводка", "проект", "объект", "задача", "проход", "подвал", "техник", "биолог", "хирург", "патрон", "авария", "утечка", "выброс", "синтез", "маркер", "затвор", "доцент"],
  7: ["реактор", "дозатор", "куратор", "монитор", "дисплей", "клавиша", "регистр", "подпись", "справка", "туннель", "стеллаж", "шкафчик", "тумблер", "раствор", "реагент", "образец", "вакцина", "капсула", "тревога", "станция", "функция", "позиция", "реакция", "мутация", "виварий", "лазарет", "инженер", "механик", "генетик", "пропуск", "паспорт", "кассета", "дискета", "конверт", "реактив", "антенна", "уровень", "коридор", "граната", "патруль", "вентиль", "контакт", "сегмент", "процесс", "команда", "аппарат", "агрегат", "каталог", "записка", "частота", "дежурка", "щитовая", "энергия", "пипетка", "горелка", "шпатель", "линейка", "цилиндр", "кабинет", "убежище"]
};
function hackLike(a, b) { var c = 0; for (var i = 0; i < a.length; i++) if (a.charAt(i) === b.charAt(i)) c++; return c; }
/* слово из кандидатов, у которого худшая оставшаяся группа наименьшая */
function hackBest(cands, words) {
  var best = cands[0], bw = 1e9, bi = 1e9, gi, gj;
  for (gi = 0; gi < cands.length; gi++) {
    var g = cands[gi], buckets = {}, worst = 0;
    for (gj = 0; gj < cands.length; gj++) {
      var k = hackLike(words[g], words[cands[gj]]);
      buckets[k] = (buckets[k] || 0) + 1;
      if (buckets[k] > worst) worst = buckets[k];
    }
    if (worst < bw || (worst === bw && g < bi)) { bw = worst; best = g; bi = g; }
  }
  return best;
}
/* последовательность догадок до пароля secret (индексы в words) */
function hackSolve(words, secret) {
  var cands = [], i; for (i = 0; i < words.length; i++) cands.push(i);
  var seq = [], guard = 0;
  while (guard++ < 12) {
    var g = hackBest(cands, words); seq.push(g);
    if (g === secret) return seq;
    var k = hackLike(words[g], words[secret]);
    cands = cands.filter(function (x) { return x !== g && hackLike(words[g], words[x]) === k; });
    if (!cands.length) return null;
  }
  return null;
}
function hackOk(words, limit) {
  for (var s = 0; s < words.length; s++) { var sq = hackSolve(words, s); if (!sq || sq.length > limit) return false; }
  return true;
}
function genTermhack(seed, d) {
  var len = [5, 6, 7][d], N = [6, 8, 10][d], r = rngFor(seed, "termhack", d);
  var words = null, guard = 0;
  while (guard++ < 80) {
    var pool = HACK[len].slice(); r.shuffle(pool);
    var set = [], i;
    for (i = 0; i < pool.length && set.length < N; i++) {
      var trial = set.concat([pool[i]]);
      if (hackOk(trial, 3)) set.push(pool[i]);
    }
    if (set.length === N) { words = set; break; }
  }
  if (!words) { words = HACK[len].slice(0, N); } /* страховка: длины/буквы всё равно верны */
  var secret = r.int(0, N - 1);
  var plan = hackSolve(words, secret).map(function (ix) { return "Слово «" + words[ix] + "»"; });
  var wrong = [];
  for (var w = 1; w <= 3; w++) wrong.push(["Слово «" + words[(secret + w) % N] + "»"]);
  return { words: words, secret: secret, len: len, plan: plan, wrong: wrong, sol: 1,
    data: { words: words.slice(), secret: words[secret], len: len, N: N } };
}
function termhack(seed, cb, opts) {
  var d = diffOf(opts), P = genTermhack(seed, d), words = P.words, sx = P.secret;
  var cond = head(opts, d) + "Взлом терминала по словарю. Терминал пускает по паролю: это одно из слов списка, все длиной " + P.len + " " +
    pl(P.len, "буква", "буквы", "букв") + ". На неверное слово терминал отвечает, сколько букв совпало с паролем на своих местах. Попыток три — и этого хватает, если рассуждать. Слова: " +
    words.join(", ") + ". Какой из них пароль?";
  var log = [];
  start("termhack", d, P, "Взлом терминала по словарю", cond, function (st, finish, fail) {
    var out = words.map(function (w, i) {
      return act("Слово «" + w + "»", function () {
        if (i === sx) { A("play", "code_ok"); finish(true, "Пароль «" + w + "» принят. Терминал разблокирован."); return; }
        var k = hackLike(w, words[sx]);
        log.push("«" + w + "» — совпадений " + k);
        A("play", "term_err");
        fail("Слово «" + w + "» — не пароль. Совпадений на своих местах: " + k + ".");
      });
    });
    out.push(act("Журнал попыток", function () { say(log.length ? "Журнал: " + log.join("; ") + "." : "Попыток ещё не было."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   2. АРХИВ ПО ОПИСИ
   Карточка запроса (дело, автор, отдел, дата) и правила описи. Шкаф —
   по сумме цифр (простая и средняя — года, сложная — всей даты), полка —
   номер месяца, папка — по первой букве фамилии (4 группы, сложная — 6).
   Место единственное; обманки правдоподобные (похожие числа).
   ════════════════════════════════════════════════════════════════════ */
var SURN = ["Антонов", "Громов", "Денисов", "Ершов", "Жуков", "Зайцев", "Игнатов", "Карпов", "Лебедев", "Морозов", "Никитин", "Орлов", "Панин", "Рыбаков", "Соколов", "Тарасов", "Устинов", "Фомин", "Харитонов", "Цветков", "Чернов", "Шубин", "Юдин", "Яковлев"];
var DEPT = ["отдел режима", "лаборатория генетики", "химический склад", "биостанция", "архив проб", "узел связи", "виварий", "медблок", "отдел кадров", "служба дозиметрии"];
var DOCT = ["протокол вскрытия", "отчёт по образцу", "акт списания", "журнал наблюдений", "заявка на реактивы", "сводка по смене", "опись имущества", "донесение охраны", "карта пациента", "схема узла"];
var GRP4 = [[0, 7, "А–Ж"], [8, 14, "З–Н"], [15, 20, "О–У"], [21, 32, "Ф–Я"]];
var GRP6 = [[0, 4, "А–Д"], [5, 11, "Е–К"], [12, 15, "Л–О"], [16, 18, "П–С"], [19, 22, "Т–Х"], [23, 32, "Ц–Я"]];
function grpOf(groups, surname) { var idx = ABC33.indexOf(surname.charAt(0).toLowerCase()); for (var i = 0; i < groups.length; i++) if (idx >= groups[i][0] && idx <= groups[i][1]) return i; return 0; }
/* две подписи «число» не должны начинаться одна с другой (иначе меню «34» и «3»
   путают простую проверку начала надписи) */
function numClash(a, b) { a = String(a); b = String(b); return a !== b && (a.indexOf(b) === 0 || b.indexOf(a) === 0); }
function pushUniq(arr, v, no, lo) { if (v > (lo || 0) && v !== no && arr.indexOf(v) < 0 && !arr.some(function (u) { return numClash(u, v); })) arr.push(v); }
function genArchive(seed, d) {
  var r = rngFor(seed, "archive", d);
  var surname = r.pick(SURN), dept = r.pick(DEPT), doc = r.pick(DOCT);
  var day = r.int(1, 28), month = r.int(1, 12), year = r.int(1962, 2009);
  var groups = d === 2 ? GRP6 : GRP4;
  var cab = d === 2 ? digitSum(day) + digitSum(month) + digitSum(year) : digitSum(year);
  var shelf = month, gi = grpOf(groups, surname), folderLbl = groups[gi][2];
  /* обманки шкафа — правдоподобные ошибки чтения правила */
  var cabOpts = [cab];
  pushUniq(cabOpts, digitSum(year % 100), cab); pushUniq(cabOpts, day + month, cab);
  pushUniq(cabOpts, digitSum(day) + digitSum(month), cab); pushUniq(cabOpts, digitSum(year) + digitSum(day), cab);
  pushUniq(cabOpts, cab + r.int(1, 3), cab); pushUniq(cabOpts, cab - r.int(1, 3), cab);
  var cabN = [4, 5, 6][d]; cabOpts = cabOpts.slice(0, cabN);
  var gc = cab + cabN; while (cabOpts.length < cabN) { gc++; pushUniq(cabOpts, gc, cab); }
  r.shuffle(cabOpts);
  /* обманки полки — другие числа месяца */
  var shelfOpts = [shelf];
  pushUniq(shelfOpts, (day % 12) + 1, shelf); pushUniq(shelfOpts, ((month + 5) % 12) + 1, shelf);
  pushUniq(shelfOpts, ((month + 6) % 12) + 1, shelf); pushUniq(shelfOpts, digitSum(year) % 12 + 1, shelf);
  var shN = [4, 5, 6][d]; var sm = 0; while (shelfOpts.length < shN && sm < 40) { sm++; pushUniq(shelfOpts, (sm % 12) + 1, shelf); }
  shelfOpts = shelfOpts.slice(0, shN); r.shuffle(shelfOpts);
  var folderOpts = groups.map(function (g) { return g[2]; });
  var badCab = cabOpts.filter(function (v) { return v !== cab; })[0];
  var badShelf = shelfOpts.filter(function (v) { return v !== shelf; })[0];
  var badFolder = folderOpts.filter(function (v) { return v !== folderLbl; })[0];
  var good = ["Шкаф", "Шкаф " + cab, "Полка", "Полка " + shelf, "Папка", "Папка «" + folderLbl + "»", "Достать дело"];
  var plan = good.slice();
  var wrong = [
    ["Шкаф", "Шкаф " + badCab, "Полка", "Полка " + shelf, "Папка", "Папка «" + folderLbl + "»", "Достать дело"],
    ["Шкаф", "Шкаф " + cab, "Полка", "Полка " + badShelf, "Папка", "Папка «" + folderLbl + "»", "Достать дело"],
    ["Шкаф", "Шкаф " + cab, "Полка", "Полка " + shelf, "Папка", "Папка «" + badFolder + "»", "Достать дело"]
  ];
  return { surname: surname, dept: dept, doc: doc, day: day, month: month, year: year, groups: groups,
    cab: cab, shelf: shelf, folderLbl: folderLbl, cabOpts: cabOpts, shelfOpts: shelfOpts, folderOpts: folderOpts,
    plan: plan, wrong: wrong, sol: 1,
    data: { day: day, month: month, year: year, surname: surname, d: d, cab: cab, shelf: shelf, folder: folderLbl,
      cabOpts: cabOpts, shelfOpts: shelfOpts, folderOpts: folderOpts, size: cabN + shN + folderOpts.length } };
}
function archive(seed, cb, opts) {
  var d = diffOf(opts), P = genArchive(seed, d);
  var card = "Дело «" + P.doc + "», " + P.surname + ", " + P.dept + ", дата " + P.day + "." + P.month + "." + P.year + ".";
  var ruleCab = d === 2 ? "сумма всех цифр даты" : "сумма цифр года";
  var cond = head(opts, d) + "Архив по описи. Запрос: " + card + " Опись архива: номер шкафа — " + ruleCab +
    "; номер полки — номер месяца; папка — по первой букве фамилии: " + P.folderOpts.join(", ") + ". Выберите шкаф, полку и папку и достаньте дело.";
  var cab = null, shelf = null, folder = null;
  var pickMenu = function (title, label, optsArr, set) {
    var items = optsArr.map(function (v) { return { label: label + " " + v, fn: function () { set(v); A("play", "keypad"); say(label + " " + v + " выбран" + (/Папка/.test(label) ? "а" : "") + "."); } }; });
    items.push({ label: "Назад", close: true, fn: function () {} });
    UIx("menu", title, items);
  };
  start("archive", d, P, "Архив по описи", cond, function (st, finish, fail) {
    return [
      act(function () { return "Шкаф: " + (cab == null ? "не выбран" : cab); }, function () { pickMenu("Выбор шкафа", "Шкаф", P.cabOpts, function (v) { cab = v; }); }),
      act(function () { return "Полка: " + (shelf == null ? "не выбрана" : shelf); }, function () { pickMenu("Выбор полки", "Полка", P.shelfOpts, function (v) { shelf = v; }); }),
      act(function () { return "Папка: " + (folder == null ? "не выбрана" : "«" + folder + "»"); }, function () {
        var items = P.folderOpts.map(function (lbl) { return { label: "Папка «" + lbl + "»", fn: function () { folder = lbl; A("play", "keypad"); say("Папка «" + lbl + "» выбрана."); } }; });
        items.push({ label: "Назад", close: true, fn: function () {} });
        UIx("menu", "Выбор папки", items);
      }),
      act("Достать дело", function () {
        if (cab == null || shelf == null || folder == null) { nope("Сначала выберите шкаф, полку и папку."); return; }
        if (cab === P.cab && shelf === P.shelf && folder === P.folderLbl) { A("play", "code_ok"); finish(true, "Дело на месте: шкаф " + P.cab + ", полка " + P.shelf + ", папка «" + P.folderLbl + "». Папка у вас в руках."); return; }
        A("play", "term_err"); fail("В этой ячейке нет такого дела. Сверьтесь с описью.");
      }),
      act("Карточка ещё раз", function () { A("play", "paper_turn"); say("Запрос: " + card); })
    ];
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   3. ПАРОЛЬ В ЗАПИСКЕ
   В записке пароль спрятан. Простая — первые буквы строк; средняя —
   первые буквы каждого второго слова; сложная — первые буквы строк,
   сдвинутые вперёд по алфавиту на K. Игрок собирает пароль по буквам
   из коротких меню и вводит его.
   ════════════════════════════════════════════════════════════════════ */
var ACRO_POOL = (function () {
  var all = [].concat(HACK[5], HACK[6], HACK[7],
    ["файл", "байт", "порт", "узел", "диск", "винт", "болт", "ядро", "зона", "игла", "фаза", "жила", "ниша", "муфта", "лоток", "труба", "гайка", "кожух", "розетка", "цинк", "чип", "шина", "эхо", "юла", "щуп", "ось", "луч", "вал", "печь", "стык"]);
  var m = {}, i;
  for (i = 0; i < all.length; i++) { var c = all[i].charAt(0); (m[c] = m[c] || []).push(all[i]); }
  return m;
})();
var PASSW = { 4: ["азот", "неон", "фтор", "хлор", "бром", "доза", "кран", "шлюз", "сейф", "цинк", "хром", "уран", "сера", "озон", "ключ", "шкаф", "реле", "диод", "зонд", "соль", "лупа", "файл", "байт", "порт", "узел"],
  5: HACK[5], 6: HACK[6] };
var LETTERS = "абвгдежзиклмнопрстуфхцчшэюя".split("");
function shiftL(ch, k) { var i = ABC33.indexOf(ch); if (i < 0) return ch; return ABC33.charAt(((i + k) % 33 + 33) % 33); }
function carrierFor(r, letter, avoid) {
  var list = (ACRO_POOL[letter] || []).filter(function (w) { return w !== avoid; });
  if (!list.length) return null;
  return list[r.int(0, list.length - 1)];
}
function genAcrostic(seed, d) {
  var L = [4, 5, 6][d], r = rngFor(seed, "acrostic", d);
  var SUFF = ["в описи", "под охраной", "на учёте", "в списке", "за печатью", "в работе", "на складе", "в архиве", "под замком", "на проверке"];
  var VERBS = ["взять", "сверить", "закрыть", "открыть", "внести", "убрать", "занести", "проверить", "отметить", "сдать", "снять", "вписать"];
  var pass = "", K = d === 2 ? r.int(1, 3) : 0, lines = [], words = [], guard = 0, ok = false;
  while (guard++ < 120 && !ok) {
    pass = r.pick(PASSW[L]);
    var acro = ""; for (var i = 0; i < L; i++) acro += d === 2 ? shiftL(pass.charAt(i), -K) : pass.charAt(i);
    var carriers = [], good = true;
    for (i = 0; i < L; i++) { var cw = carrierFor(r, acro.charAt(i), pass); if (!cw) { good = false; break; } carriers.push(cw); }
    if (!good) continue;
    lines = []; words = [];
    if (d === 1) { for (i = 0; i < L; i++) { words.push(r.pick(VERBS)); words.push(carriers[i]); } }
    else { for (i = 0; i < L; i++) lines.push(carriers[i] + " — " + r.pick(SUFF)); }
    ok = true;
  }
  var opts3 = [];
  for (var p = 0; p < L; p++) {
    var correct = pass.charAt(p), set = [correct], bag = LETTERS.slice(); r.shuffle(bag);
    for (var b = 0; b < bag.length && set.length < 4; b++) if (bag[b] !== correct && set.indexOf(bag[b]) < 0) set.push(bag[b]);
    r.shuffle(set); opts3.push(set);
  }
  var plan = [], w, wrong = [];
  for (var q = 0; q < L; q++) { plan.push("Буква " + (q + 1)); plan.push("Буква " + pass.charAt(q)); }
  plan.push("Ввести пароль");
  for (var kk = 0; kk < 3; kk++) {
    var seq = [], badPos = kk % L;
    for (var z = 0; z < L; z++) {
      seq.push("Буква " + (z + 1));
      var ch = pass.charAt(z);
      if (z === badPos) { var alt = opts3[z].filter(function (x) { return x !== pass.charAt(badPos); })[0]; ch = alt; }
      seq.push("Буква " + ch);
    }
    seq.push("Ввести пароль"); wrong.push(seq);
  }
  return { L: L, pass: pass, K: K, rule: d, lines: lines, words: words, opts: opts3, plan: plan, wrong: wrong, sol: 1,
    data: { L: L, pass: pass, K: K, rule: d, lines: lines.slice(), words: words.slice(), opts: opts3 } };
}
function acrostic(seed, cb, opts) {
  var d = diffOf(opts), P = genAcrostic(seed, d);
  var note = d === 1 ? P.words.join(", ") : P.lines.map(function (l) { return "«" + l + "»"; }).join("; ");
  var ruleTxt = d === 0 ? "его буквы — первые буквы строк, сверху вниз" :
    d === 1 ? "его буквы — первые буквы каждого второго слова" :
    "его буквы — первые буквы строк, сверху вниз, но каждую сдвиньте вперёд по алфавиту на " + P.K + ". После «я» счёт идёт снова с «а»";
  var cond = head(opts, d) + "Пароль в записке. В записке лаборанта спрятан пароль из " + P.L + " " + pl(P.L, "буквы", "букв", "букв") +
    ": " + ruleTxt + ". Записка: " + note + ". Соберите пароль по буквам и введите его.";
  var set = []; for (var z = 0; z < P.L; z++) set.push(null);
  var letterMenu = function (i) {
    var items = P.opts[i].map(function (ch) { return { label: "Буква " + ch, fn: function () { set[i] = ch; A("play", "keypad"); say("Буква " + (i + 1) + " — «" + ch + "»."); } }; });
    items.push({ label: "Назад", close: true, fn: function () {} });
    UIx("menu", "Буква " + (i + 1) + " пароля", items);
  };
  start("acrostic", d, P, "Пароль в записке", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < P.L; i++) (function (i) {
      out.push(act(function () { return "Буква " + (i + 1) + ": " + (set[i] == null ? "не выбрана" : "«" + set[i] + "»"); }, function () { letterMenu(i); }));
    })(i);
    out.push(act("Ввести пароль", function () {
      if (set.some(function (v) { return v == null; })) { nope("Выбраны ещё не все буквы."); return; }
      if (set.join("") === P.pass) { A("play", "code_ok"); finish(true, "Пароль «" + P.pass + "» принят. Замок открыт."); return; }
      A("play", "term_err"); fail("Пароль «" + set.join("") + "» не подошёл.");
    }));
    out.push(act("Записка ещё раз", function () { A("play", "paper_turn"); say("Записка: " + note + "."); }));
    if (d === 2) out.push(act("Алфавит по порядку", function () { say("Алфавит: " + ABC33.split("").join(", ") + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   4. ЖУРНАЛ ДОСТУПА
   За смену N человек открыли по одной двери (у каждой — отметка
   времени). Обрывки журнала и показания сужают, кто где был; вопрос —
   кто открыл названную дверь. Ответ единственный (перебор перестановок
   прямо в генераторе; обманок-имён хватает).
   ════════════════════════════════════════════════════════════════════ */
var STAFF3 = ["Ильин", "Петрова", "Коваль", "Серова", "Нагиев", "Брагина", "Тихонов", "Лапина"];
var ROOMS3 = ["серверная", "архив", "склад", "виварий", "реактор", "лаборатория", "медблок", "щитовая"];
function alFits(perm, clues, times, truth) {
  for (var c = 0; c < clues.length; c++) {
    var cl = clues[c];
    if (cl.t === "not") { if (perm[cl.j] === cl.p) return false; }
    else if (cl.t === "is") { if (perm[cl.j] !== cl.p) return false; }
    else { var dp = perm.indexOf(cl.p), dq = perm.indexOf(cl.q); if (!(times[dp] < times[dq])) return false; }
  }
  return true;
}
function alCount(all, clues, times) { var n = 0; for (var i = 0; i < all.length; i++) if (alFits(all[i], clues, times)) n++; return n; }
function genAccesslog(seed, d) {
  var N = [3, 4, 5][d], r = rngFor(seed, "accesslog", d);
  var names = STAFF3.slice(); r.shuffle(names); names = names.slice(0, N);
  var rooms = ROOMS3.slice(); r.shuffle(rooms); rooms = rooms.slice(0, N);
  var times = [], t0 = r.int(8, 10) * 60 + r.int(0, 3) * 5; for (var i = 0; i < N; i++) { times.push(t0); t0 += r.int(2, 6) * 5; }
  var ask = 0, truth = [], clues = [], all = perms(names.map(function (_, k) { return k; })), guard = 0, okg = false;
  while (guard++ < 160 && !okg) {
    truth = []; for (i = 0; i < N; i++) truth.push(i); r.shuffle(truth); /* truth[door]=person */
    ask = r.int(0, N - 1);
    var cand = [];
    for (var p = 0; p < N; p++) for (var j = 0; j < N; j++) if (truth[j] !== p && j !== ask) cand.push({ t: "not", p: p, j: j });
    for (p = 0; p < N; p++) for (var q = 0; q < N; q++) if (p !== q) { var dp = truth.indexOf(p), dq = truth.indexOf(q); if (times[dp] < times[dq]) cand.push({ t: "earlier", p: p, q: q }); }
    if (d === 2) for (j = 0; j < N; j++) if (j !== ask) cand.push({ t: "is", p: truth[j], j: j }); /* «кто-то был именно тут» — для истории с чужой картой */
    r.shuffle(cand);
    clues = [];
    var fitsAsk = function (perm) { return alFits(perm, clues, times); };
    for (var ci = 0; ci < cand.length; ci++) {
      var cnt = all.filter(fitsAsk).length; if (cnt <= 1) break;
      clues.push(cand[ci]); if (all.filter(fitsAsk).length === cnt) clues.pop();
    }
    if (all.filter(fitsAsk).length !== 1) continue;
    for (i = clues.length - 1; i >= 0; i--) { var c2 = clues.slice(0, i).concat(clues.slice(i + 1)); if (alCount(all, c2, times) === 1) clues = c2; }
    if (clues.length < 2) continue;
    okg = true;
  }
  var answer = truth[ask];
  var plan = [names[answer]];
  /* неверные имена — только не ответ (при N=3 их два, один повторяется) */
  var wrongIdx = []; for (var wi = 0; wi < N; wi++) if (wi !== answer) wrongIdx.push(wi);
  var wrong = [];
  for (var w = 0; w < 3; w++) wrong.push([names[wrongIdx[w % wrongIdx.length]]]);
  return { names: names, rooms: rooms, times: times, clues: clues, ask: ask, answer: answer, truth: truth,
    plan: plan, wrong: wrong, sol: 1,
    data: { names: names.slice(), rooms: rooms.slice(), times: times.slice(), clues: clues.map(function (c) { return { t: c.t, p: c.p, j: c.j, q: c.q }; }), ask: ask, answer: answer, truth: truth.slice() } };
}
function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ":" + (mm < 10 ? "0" + mm : mm); }
function genAccesslogText(P, d) {
  var names = P.names, rooms = P.rooms, times = P.times;
  var clueTxt = P.clues.map(function (c) {
    if (c.t === "not") return names[c.p] + " не открывал" + fem(names[c.p]) + " " + rooms[c.j];
    if (c.t === "is") return names[c.p] + " открывал" + fem(names[c.p]) + " " + rooms[c.j];
    return names[c.p] + " прош" + (fem(names[c.p]) ? "ла" : "ёл") + " раньше, чем " + names[c.q];
  });
  var intro = d === 2 ? "Одной картой воспользовался не её владелец, но журнал всё равно можно распутать. " : "";
  return { clueTxt: clueTxt, intro: intro };
}
function accesslog(seed, cb, opts) {
  var d = diffOf(opts), P = genAccesslog(seed, d), T = genAccesslogText(P, d);
  var cond = head(opts, d) + "Журнал доступа. За смену " + P.names.length + " " + pl(P.names.length, "человек", "человека", "человек") + " — " + P.names.join(", ") +
    " — открыли по одной двери: " + P.rooms.join(", ") + ". Отметки времени: " + P.rooms.map(function (rm, j) { return rm + " в " + hhmm(P.times[j]); }).join(", ") +
    ". Известно: " + T.clueTxt.join("; ") + ". " + T.intro + "Кто открыл " + P.rooms[P.ask] + " в " + hhmm(P.times[P.ask]) + "?";
  start("accesslog", d, P, "Журнал доступа", cond, function (st, finish, fail) {
    var out = P.names.map(function (nm, i) {
      return act(nm, function () {
        if (i === P.answer) { A("play", "code_ok"); finish(true, nm + " — верно. " + cap(P.rooms[P.ask]) + " открыл" + fem(nm) + " " + nm + ". Замок признал."); return; }
        A("play", "term_err"); fail("Не сходится с журналом.");
      });
    });
    out.push(act("Журнал ещё раз", function () { A("play", "paper_turn"); say("Известно: " + T.clueTxt.join("; ") + ". Вопрос: кто открыл " + P.rooms[P.ask] + "?"); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   5. КОНТРОЛЬНАЯ СУММА
   Номер пропуска с нечитаемой цифрой и правилом контроля. Простая —
   сумма цифр кончается на ноль; средняя — взвешенная сумма (вес 1 и 3)
   кончается на ноль; сложная — две цифры и два правила. Ответ один
   (перебор цифр или пар прямо в генераторе).
   ════════════════════════════════════════════════════════════════════ */
function csEval(digits, weights) { var s = 0; for (var i = 0; i < digits.length; i++) s += weights[i] * digits[i]; return s % 10; }
function genChecksum(seed, d) {
  var len = [6, 7, 8][d], r = rngFor(seed, "checksum", d);
  var digits = [], i; for (i = 0; i < len; i++) digits.push(r.int(0, 9));
  var ones = []; for (i = 0; i < len; i++) ones.push(1);
  var rules, gaps, answer;
  if (d === 0) {
    var g = r.int(0, len - 1); gaps = [g];
    var rest = 0; for (i = 0; i < len; i++) if (i !== g) rest += digits[i];
    var x = (10 - rest % 10) % 10; digits[g] = x; answer = [x];
    rules = [{ weights: ones, name: "sum" }];
  } else if (d === 1) {
    var w1 = []; for (i = 0; i < len; i++) w1.push(i % 2 === 0 ? 1 : 3);
    var g1 = r.int(0, len - 1); gaps = [g1];
    var rest1 = 0; for (i = 0; i < len; i++) if (i !== g1) rest1 += w1[i] * digits[i];
    var wv = w1[g1], inv = wv === 1 ? 1 : 7; var xv = (inv * ((10 - rest1 % 10) % 10)) % 10;
    digits[g1] = xv; answer = [xv];
    rules = [{ weights: w1, name: "weighted" }];
  } else {
    var w2 = []; for (i = 0; i < len; i++) w2.push(i % 2 === 0 ? 1 : 2);
    var evenIdx = [], oddIdx = []; for (i = 0; i < len; i++) (i % 2 === 0 ? evenIdx : oddIdx).push(i);
    var ga = evenIdx[r.int(0, evenIdx.length - 1)], gb = oddIdx[r.int(0, oddIdx.length - 1)];
    gaps = [ga, gb].sort(function (a, b) { return a - b; });
    var sA = 0, sB = 0;
    for (i = 0; i < len; i++) if (i !== ga && i !== gb) { sA += digits[i]; sB += w2[i] * digits[i]; }
    var Aeq = (10 - sA % 10) % 10, Beq = (10 - sB % 10) % 10; /* x+y=Aeq ; wa*x+wb*y=Beq (wa,wb — веса на ga,gb) */
    var wa = w2[ga], wb = w2[gb];
    /* решаем 2x2 перебором (det=1 обеспечивает единственность) */
    var solX = 0, solY = 0;
    for (var xx = 0; xx < 10; xx++) for (var yy = 0; yy < 10; yy++) if ((xx + yy) % 10 === Aeq && (wa * xx + wb * yy) % 10 === Beq) { solX = xx; solY = yy; }
    digits[ga] = solX; digits[gb] = solY;
    answer = gaps.map(function (g) { return digits[g]; }); /* порядок — как в gaps (отсортированы) */
    rules = [{ weights: ones, name: "sum" }, { weights: w2, name: "weighted" }];
  }
  var plan = [], wrong = [[], [], []], k;
  for (k = 0; k < gaps.length; k++) { plan.push("Пропуск " + (k + 1)); plan.push("Цифра " + answer[k]); }
  plan.push("Проверить номер");
  for (var wi = 0; wi < 3; wi++) {
    var seq = [];
    for (k = 0; k < gaps.length; k++) {
      seq.push("Пропуск " + (k + 1));
      var val = answer[k];
      if ((gaps.length === 1 && wi >= 0) || (gaps.length > 1 && k === wi % gaps.length)) { if (gaps.length === 1) val = (answer[0] + 1 + wi) % 10; else val = (answer[k] + 1) % 10; }
      seq.push("Цифра " + val);
    }
    seq.push("Проверить номер"); wrong[wi] = seq;
  }
  return { len: len, digits: digits, gaps: gaps, rules: rules, answer: answer, d: d, plan: plan, wrong: wrong, sol: 1,
    data: { len: len, digits: digits.slice(), gaps: gaps.slice(), rules: rules.map(function (ru) { return { weights: ru.weights.slice(), name: ru.name }; }), answer: answer.slice() } };
}
function checksum(seed, cb, opts) {
  var d = diffOf(opts), P = genChecksum(seed, d);
  var gi = 0, render = P.digits.map(function (v, i) { if (P.gaps.indexOf(i) >= 0) { gi++; return P.gaps.length > 1 ? (gi === 1 ? "первый пропуск" : "второй пропуск") : "пропуск"; } return String(v); }).join(", ");
  var ruleTxt = d === 0 ? "Правило: сумма всех цифр номера оканчивается на ноль." :
    d === 1 ? "Правило: цифры на нечётных местах берут с весом один, на чётных — с весом три; эта взвешенная сумма оканчивается на ноль." :
    "Два правила. Первое: обычная сумма всех цифр оканчивается на ноль. Второе: на нечётных местах вес один, на чётных — вес два, и эта взвешенная сумма тоже оканчивается на ноль.";
  var cond = head(opts, d) + "Контрольная сумма. Номер пропуска: " + render + ". " + ruleTxt + " Восстановите " +
    (P.gaps.length > 1 ? "пропущенные цифры" : "пропущенную цифру") + ".";
  var vals = P.gaps.map(function () { return null; });
  var digitMenu = function (u) {
    var items = []; for (var dg = 0; dg < 10; dg++) (function (dg) { items.push({ label: "Цифра " + dg, fn: function () { vals[u] = dg; A("play", "keypad"); say("Пропуск " + (u + 1) + " — цифра " + dg + "."); } }); })(dg);
    items.push({ label: "Назад", close: true, fn: function () {} });
    UIx("menu", "Пропуск " + (u + 1), items);
  };
  var full = function () { var a = P.digits.slice(); for (var k = 0; k < P.gaps.length; k++) a[P.gaps[k]] = vals[k]; return a; };
  start("checksum", d, P, "Контрольная сумма", cond, function (st, finish, fail) {
    var out = [];
    for (var u = 0; u < P.gaps.length; u++) (function (u) {
      out.push(act(function () { return "Пропуск " + (u + 1) + ": " + (vals[u] == null ? "не выбрана" : vals[u]); }, function () { digitMenu(u); }));
    })(u);
    out.push(act("Проверить номер", function () {
      if (vals.some(function (v) { return v == null; })) { nope("Выберите цифру для каждого пропуска."); return; }
      var a = full(), ok = P.rules.every(function (ru) { return csEval(a, ru.weights) === 0; });
      if (ok) { A("play", "code_ok"); finish(true, "Контроль сошёлся: номер " + a.join("") + " принят."); return; }
      A("play", "term_err"); fail("Контроль не сходится: номер отвергнут.");
    }));
    out.push(act("Номер ещё раз", function () { A("play", "paper_turn"); say("Номер пропуска: " + render + "."); }));
    return out;
  }, cb);
}

/* ════════════════════════════════════════════════════════════════════
   6. СТЁРТАЯ КЛАВИАТУРА
   На замке стёрты клавиши — значит, в пин-коде ровно эти цифры, каждая
   по разу. Подсказки (чёт-нечет, порядок, сумма пары, где самая большая
   или маленькая) задают порядок. Код единственный (перебор перестановок
   прямо в генераторе).
   ════════════════════════════════════════════════════════════════════ */
function pwFits(perm, clues) {
  for (var c = 0; c < clues.length; c++) {
    var cl = clues[c];
    if (cl.t === "parity") { if ((perm[cl.i] % 2 === 0) !== cl.even) return false; }
    else if (cl.t === "cmp") { if (cl.lt ? !(perm[cl.i] < perm[cl.j]) : !(perm[cl.i] > perm[cl.j])) return false; }
    else if (cl.t === "max") { if (perm[cl.i] !== cl.v) return false; }
    else if (cl.t === "min") { if (perm[cl.i] !== cl.v) return false; }
    else if (cl.t === "pair") { if (perm[cl.i] + perm[cl.j] !== cl.s) return false; }
  }
  return true;
}
function pwCount(all, clues) { var n = 0; for (var i = 0; i < all.length; i++) if (pwFits(all[i], clues)) n++; return n; }
function genPinwear(seed, d) {
  var L = [3, 4, 5][d], r = rngFor(seed, "pinwear", d);
  var worn = [], pin = [], clues = [], all = [], mx = 0, mn = 0, guard = 0, okg = false;
  while (guard++ < 160 && !okg) {
    var pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; r.shuffle(pool); worn = pool.slice(0, L).sort(function (a, b) { return a - b; });
    mx = Math.max.apply(null, worn); mn = Math.min.apply(null, worn);
    pin = worn.slice(); r.shuffle(pin);
    all = perms(worn.slice());
    var cand = [], i, j;
    for (i = 0; i < L; i++) cand.push({ t: "parity", i: i, even: pin[i] % 2 === 0 });
    for (i = 0; i < L; i++) for (j = 0; j < L; j++) if (i !== j) cand.push({ t: "cmp", i: i, j: j, lt: pin[i] < pin[j] });
    for (i = 0; i < L; i++) if (pin[i] === mx) cand.push({ t: "max", i: i, v: mx });
    for (i = 0; i < L; i++) if (pin[i] === mn) cand.push({ t: "min", i: i, v: mn });
    for (i = 0; i < L; i++) for (j = i + 1; j < L; j++) cand.push({ t: "pair", i: i, j: j, s: pin[i] + pin[j] });
    r.shuffle(cand);
    clues = [];
    var fitsC = function (perm) { return pwFits(perm, clues); };
    for (var ci = 0; ci < cand.length; ci++) {
      var cnt = all.filter(fitsC).length; if (cnt <= 1) break;
      clues.push(cand[ci]); if (all.filter(fitsC).length === cnt) clues.pop();
    }
    if (all.filter(fitsC).length !== 1) continue;
    for (i = clues.length - 1; i >= 0; i--) { var c2 = clues.slice(0, i).concat(clues.slice(i + 1)); if (pwCount(all, c2) === 1) clues = c2; }
    if (clues.length < 2) continue;
    okg = true;
  }
  var plan = [], k;
  for (k = 0; k < L; k++) { plan.push("Место " + (k + 1)); plan.push("Цифра " + pin[k]); }
  plan.push("Открыть замок");
  var mk = function (arr) { var s = []; for (var z = 0; z < L; z++) { s.push("Место " + (z + 1)); s.push("Цифра " + arr[z]); } s.push("Открыть замок"); return s; };
  var w0 = pin.slice(); var t = w0[0]; w0[0] = w0[1]; w0[1] = t;
  var w1 = pin.slice().reverse();
  var w2 = pin.slice(); var t2 = w2[L - 1]; w2[L - 1] = w2[L - 2]; w2[L - 2] = t2;
  var cands3 = [w0, w1, w2].filter(function (a) { return a.join("") !== pin.join(""); });
  while (cands3.length < 3) cands3.push(pin.slice().reverse());
  var wrong = [mk(cands3[0]), mk(cands3[1]), mk(cands3[2])];
  return { L: L, worn: worn, pin: pin, clues: clues, mx: mx, mn: mn, plan: plan, wrong: wrong, sol: 1,
    data: { L: L, worn: worn.slice(), pin: pin.slice(), clues: clues.map(function (c) { return { t: c.t, i: c.i, j: c.j, even: c.even, lt: c.lt, v: c.v, s: c.s }; }) } };
}
function pinwear(seed, cb, opts) {
  var d = diffOf(opts), P = genPinwear(seed, d);
  var clueTxt = P.clues.map(function (c) {
    if (c.t === "parity") return "цифра на месте " + (c.i + 1) + " — " + (c.even ? "чётная" : "нечётная");
    if (c.t === "cmp") return "цифра на месте " + (c.i + 1) + (c.lt ? " меньше" : " больше") + " цифры на месте " + (c.j + 1);
    if (c.t === "max") return "самая большая цифра — на месте " + (c.i + 1);
    if (c.t === "min") return "самая маленькая цифра — на месте " + (c.i + 1);
    return "сумма цифр на местах " + (c.i + 1) + " и " + (c.j + 1) + " равна " + c.s;
  });
  var cond = head(opts, d) + "Стёртая клавиатура. На замке стёрты клавиши — значит, в пин-коде из " + P.L + " " + pl(P.L, "цифры", "цифр", "цифр") +
    " только эти цифры, каждая по одному разу, без повторов: " + P.worn.join(", ") + ". Подсказки: " + clueTxt.join("; ") + ". Наберите код.";
  var code = []; for (var z = 0; z < P.L; z++) code.push(null);
  var digitMenu = function (i) {
    var items = P.worn.map(function (dg) { return { label: "Цифра " + dg, fn: function () { code[i] = dg; A("play", "keypad"); say("Место " + (i + 1) + " — цифра " + dg + "."); } }; });
    items.push({ label: "Назад", close: true, fn: function () {} });
    UIx("menu", "Место " + (i + 1) + " кода", items);
  };
  start("pinwear", d, P, "Стёртая клавиатура", cond, function (st, finish, fail) {
    var out = [];
    for (var i = 0; i < P.L; i++) (function (i) {
      out.push(act(function () { return "Место " + (i + 1) + ": " + (code[i] == null ? "не набрано" : code[i]); }, function () { digitMenu(i); }));
    })(i);
    out.push(act("Открыть замок", function () {
      if (code.some(function (v) { return v == null; })) { nope("Наберите цифру на каждом месте."); return; }
      if (code.join("") === P.pin.join("")) { A("play", "code_ok"); finish(true, "Код " + code.join(" ") + " подошёл: замок открыт."); return; }
      A("play", "term_err"); fail("Код " + code.join(" ") + " не подошёл.");
    }));
    out.push(act("Что набрано", function () { say("Набрано: " + code.map(function (v, i) { return (i + 1) + " — " + (v == null ? "пусто" : v); }).join(", ") + "."); }));
    out.push(act("Подсказки ещё раз", function () { A("play", "paper_turn"); say("Стёрты клавиши: " + P.worn.join(", ") + ". Подсказки: " + clueTxt.join("; ") + "."); }));
    return out;
  }, cb);
}

/* ════════ РЕГИСТРАЦИЯ ════════ */
var KINDS3 = ["termhack", "archive", "acrostic", "accesslog", "checksum", "pinwear"];
var NAMES3 = {
  termhack: "взлом терминала по словарю", archive: "архив по описи", acrostic: "пароль в записке",
  accesslog: "журнал доступа", checksum: "контрольная сумма", pinwear: "стёртая клавиатура"
};
var GEN = { termhack: genTermhack, archive: genArchive, acrostic: genAcrostic, accesslog: genAccesslog, checksum: genChecksum, pinwear: genPinwear };
var UIF = { termhack: termhack, archive: archive, acrostic: acrostic, accesslog: accesslog, checksum: checksum, pinwear: pinwear };
KINDS3.forEach(function (k) { LAB.puzzles.register(k, NAMES3[k], UIF[k], { diffs: true }); });
LAB.puzzles3 = {
  kinds: KINDS3.slice(), names: NAMES3, match: match,
  plan: function (kind, seed, diff) { var g = GEN[kind]; return g ? g(seed || 1, diffOf({ diff: diff })).plan.slice() : null; },
  gen: function (kind, seed, diff) { var g = GEN[kind]; return g ? g(seed || 1, diffOf({ diff: diff })) : null; },
  _hackSolve: hackSolve, _hackLike: hackLike, _words: HACK
};
})();
