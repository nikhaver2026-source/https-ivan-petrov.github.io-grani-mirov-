#!/usr/bin/env node
/* Проверка реплик ОКО, часть А (js/oko_lines_a.js): base — уровни 1–10,
   протокол «Стерильность»; b1 — «Подножие», уровни 11–20; b2 — «Колыбель»,
   уровни 21–40.
   Файл загружается в песочнице Node (globalThis.LAB = {}); проверяется:
   • синтаксис не новее ES2018 (acorn, если он есть рядом; иначе — Node);
   • файл дописывает LAB.OKO_LINES и не затирает чужие блоки (вместе с
     oko_lines_b.js в любом порядке); есть блоки base, b1, b2 и только они;
     нет неизвестных видов; виды реакций — те же, что в таблице REACT oko.js;
   • сколько реплик у каждого вида:
       base: тревога, подозрение, потеря цели, отбой, дверь, шум, потери и
       реплики «просто так» — 12–16; прочие виды из BASE — 6–8; новые
       виды (реакции на действия игрока) — 10–12;
       b1, b2: виды, которые блок уже говорит своим голосом, — 3–4;
       подозрение, потеря цели, отбой, дверь и шум — 9–10; прочие виды
       из BASE — 4–5; новые виды — 5–6;
     и на глубине ни один вид не уходит в голос базы (как в lines() oko.js);
   • нет повторов внутри вида, во всём файле и с уже написанными репликами
     (BASE из oko.js, oko-разделы b1–b5.js, oko_lines_b.js, если он есть);
     сравнение — без учёта регистра, «ё» и знаков препинания;
   • подстановки — только {L}, {F} (вид floor) и {room} (вид vault, и
     только внутри «…»); кавычки — только «ёлочки», парные; тире — «—»,
     многоточие — «…»; там, где нужна «ё», нет «е» (частые слова);
   • без «Грани Миров», «Странников», брани и сведений о том, сколько в
     комплексе уровней или этажей; ОКО говорит «вы», а не «ты»;
   • длина — до 160 знаков; одно-два коротких предложения (обрывки сигнала
     «…» в b1 — до четырёх, если строка не длиннее 110 знаков);
   • герой без рода: после «вы», «ты», «носитель» в пределах двух слов той
     же части фразы нет прошедшего времени и прилагательного в мужском или
     женском роде (эвристика с самопроверкой).
   Без ошибок — печатает «ВСЁ ХОРОШО»; с ошибками — выходит с кодом 1.
   Запуск: node lab/tests/oko_lines_a.check.js [-v] (-v — число реплик по видам) */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "js/oko_lines_a.js");
const FILE_B = path.join(ROOT, "js/oko_lines_b.js");
const BLOCKS = ["base", "b1", "b2"];
const VERBOSE = process.argv.indexOf("-v") >= 0;
let fails = 0, warns = 0;
function err(m) { console.error("✗ " + m); fails++; }
function warn(m) { console.warn("⚠ " + m); warns++; }

/* ── синтаксис ── */
const src = fs.readFileSync(FILE, "utf8");
let acorn = null;
for (const p of ["acorn", path.join(ROOT, "node_modules/acorn"), path.join(ROOT, "tools/node_modules/acorn")]) {
  try { acorn = require(p); break; } catch (e) { /* нет — дальше */ }
}
try {
  if (acorn) acorn.parse(src, { ecmaVersion: 2018 });
  else new vm.Script(src, { filename: "oko_lines_a.js" });
} catch (e) { err("синтаксис: " + e.message); finish(); }

/* ── загрузка в песочнице ── */
function load(files) {
  const ctx = { console };
  ctx.globalThis = ctx;
  ctx.LAB = {};
  vm.createContext(ctx);
  files.forEach(function (f) { vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: path.relative(ROOT, f) }); });
  return ctx.LAB.OKO_LINES;
}
let OL;
try { OL = load([FILE]); } catch (e) { err("файл не загрузился: " + e.message); finish(); }
if (!OL || typeof OL !== "object") { err("LAB.OKO_LINES не создан"); finish(); }

/* ── уже написанные реплики: BASE и REACT из oko.js, разделы oko блоков ── */
const okoSrc = fs.readFileSync(path.join(ROOT, "js/oko.js"), "utf8");
function extractObj(name) {
  const at = okoSrc.indexOf("var " + name + " = {");
  if (at < 0) throw new Error("в oko.js нет " + name);
  let i = okoSrc.indexOf("{", at), depth = 0, inStr = false;
  const start = i;
  for (; i < okoSrc.length; i++) {
    const c = okoSrc[i];
    if (inStr) { if (c === "\\") i++; else if (c === "\"") inStr = false; continue; }
    if (c === "\"") inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) break;
  }
  return vm.runInNewContext("(" + okoSrc.slice(start, i + 1) + ")");
}
const BASE = extractObj("BASE");
const BASE_KINDS = Object.keys(BASE);
let REACT = null;
try { REACT = extractObj("REACT"); } catch (e) { warn("в oko.js нет таблицы REACT — сверка видов пропущена"); }
const bctx = { console, Math, JSON, Object, Array, String, Number, Error, Date, RegExp };
bctx.globalThis = bctx;
vm.createContext(bctx);
const quietWarn = console.warn; console.warn = function () {};
for (const f of ["js/data.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), bctx, { filename: f });
}
console.warn = quietWarn;
const OWN = {}; /* "b1" → собственные реплики блока (oko в b1.js) */
for (let n = 1; n <= 5; n++) OWN["b" + n] = (bctx.LAB.BLOCKS && bctx.LAB.BLOCKS[n] && bctx.LAB.BLOCKS[n].oko) || {};
let OTHER = null; /* реплики второго файла (b3–b5), если он уже есть */
if (fs.existsSync(FILE_B)) {
  try { OTHER = load([FILE_B]); } catch (e) { warn("oko_lines_b.js не загрузился: " + e.message); }
}

/* ── файл дописывает общую таблицу и не затирает чужое ── */
if (OTHER) {
  [[FILE_B, FILE], [FILE, FILE_B]].forEach(function (order) {
    let both;
    try { both = load(order); } catch (e) { err("вместе с oko_lines_b.js не загрузился: " + e.message); return; }
    const tag = order.map(function (f) { return path.basename(f); }).join(" + ");
    const all = BLOCKS.concat(Object.keys(OTHER));
    all.forEach(function (b) {
      const want = (OL[b] ? Object.keys(OL[b]) : []).concat(OTHER[b] ? Object.keys(OTHER[b]) : []);
      want.forEach(function (k) {
        const n = ((OL[b] && OL[b][k]) || []).length + ((OTHER[b] && OTHER[b][k]) || []).length;
        if (!both[b] || !both[b][k] || both[b][k].length !== n) err(tag + ": " + b + "." + k + " — реплик " + (both[b] && both[b][k] ? both[b][k].length : 0) + ", а должно быть " + n);
      });
    });
  });
}

/* ── виды событий ── */
const BIG = ["alarm", "suspect", "lost", "normal", "door", "check", "kill", "taunt"];
const NEW = ["kill_mech", "kill_bio", "kill_many", "hurt", "low_hp", "heal", "eat", "drink", "rest", "capsule", "bind", "revive",
  "note", "mail", "safe", "pick", "hack_ok", "puzzle_ok", "puzzle_fail", "music", "craft", "buy", "sell", "trap_set", "trap_kill",
  "oko_trap", "oko_trap_off", "mines_order", "grenade", "quiet", "idle", "secret", "zone", "vault", "floor", "weapon", "implant",
  "survivor", "turret_kill", "patrol_slip"];
if (REACT) {
  Object.keys(REACT).forEach(function (k) { if (NEW.indexOf(k) < 0) err("вид реакции «" + k + "» из REACT (oko.js) не покрыт проверкой"); });
  NEW.forEach(function (k) { if (!REACT[k]) warn("вид «" + k + "» есть в проверке, но не в REACT (oko.js)"); });
}
/* частые виды, которых нет в собственных репликах b1 и b2: на глубине звучат только наши */
const BIG_DEEP = ["suspect", "lost", "normal", "door", "check"];
function range(b, k) {
  if (b === "base") return NEW.indexOf(k) >= 0 ? [10, 12] : BIG.indexOf(k) >= 0 ? [12, 16] : [6, 8];
  if (NEW.indexOf(k) >= 0) return [5, 6];
  if (BIG_DEEP.indexOf(k) >= 0) return [9, 10];
  return OWN[b][k] && OWN[b][k].length ? [3, 4] : [4, 5];
}

/* ── нормализация для сравнения ── */
function norm(s) { return s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9{}]+/g, " ").trim(); }
const existing = new Map();
function addExisting(where, arr) { (arr || []).forEach(function (s) { if (typeof s === "string" && !existing.has(norm(s))) existing.set(norm(s), where); }); }
BASE_KINDS.forEach(function (k) { addExisting("oko.js BASE." + k, BASE[k]); });
for (const b in OWN) for (const k in OWN[b]) addExisting(b + ".js oko." + k, OWN[b][k]);
if (OTHER) for (const b in OTHER) for (const k in OTHER[b]) addExisting("oko_lines_b.js " + b + "." + k, OTHER[b][k]);

/* ── словари ── */
const LOW = function (s) { return s.toLowerCase().replace(/ё/g, "е"); };
const FORBID = [/гран[ьиеюя]\s+мир/, /странник/, /(^|[^а-я])(хуй|хуе|пизд|бля|ебат|ебан|еба[лн]|сука|суки|мудак|мудил|говн|дерьм|жоп|сволоч|ублюд|гнид|падл|шлюх|херн|хрен)/];
const COUNTS = [/(^|[^а-я])(\d+|сто|двести|девяносто|восемьдесят|семьдесят|шестьдесят|пятьдесят|сорок|тридцать|двадцать|десять)\s+(уровн|уровен|этаж)/, /последн[а-я]*\s+(уровн|уровен|этаж)/, /сот(ый|ого|ом)\s+(уровн|уровен|этаж)/, /всего\s+(\S+\s+)?(уровн|уровен|этаж)/];
const TY = /(^|[^а-я])(ты|тебя|тебе|тобой|тобою|твой|твоя|твое|твои|твоих|твоим|твоими|твоего|твоей|твоему|твою)(?=[^а-я]|$)/;
/* слова, где без «ё» — ошибка (в тексте реплик они всегда с «ё») */
const ADJ = "(ый|ая|ое|ые|ого|ой|ую|ым|ыми|ых|ому)";
const YO = new RegExp("(^|[^а-яё])(еще|ее|идет|ждет|поет|пьет|растет|найдет|придет|уйдет|зовет|берет|ведет|живет|дает|встает|несет|плывет|" +
  "черн" + ADJ + "|тяжел" + ADJ + "|зелен" + ADJ + "|желт" + ADJ + "|счет|счетчик[а-я]*|учет|учета|учету|учетом|отчет|отчета|отчету|отчетом)(?=[^а-яё]|$)");
/* слова с «родовым» окончанием, которые не говорят о роде героя */
const NOT_GENDER = new Set(("игла сила стрела скала мгла пчела дела тела зола глава смола тишина стена струна волна глубина сторона " +
  "цена машина смена тайна луна весна страна зона стол пол угол зал канал сигнал журнал протокол металл узел пепел котел ангел орел " +
  "домой порой мной тобой собой рукой ногой стеной рекой водой тишиной паузой другой иной той этой одной " +
  "стой постой открой закрой успокой " +
  "здесь тут там уже еще все всё тоже так очень совсем почти снова опять сейчас теперь только").split(" ").map(LOW));
const GEN = new Set(("готов готова рад рада прав права жив жива здоров здорова один одна сам сама цел цела должен должна нужен нужна " +
  "уверен уверена свободен свободна похож похожа ранен ранена смог смогла мог могла помог помогла лег легла нес несла донес принес " +
  "вез привез рос вырос достиг проник привык замерз увяз исчез погиб промок стер умер запер отпер вытер спас оба обе " +
  "пришел ушел дошел нашел прошел вошел вышел шел зашел обошел сошел").split(" ").map(LOW));
function gendered(w) {
  w = LOW(w);
  if (!w || NOT_GENDER.has(w)) return false;
  if (GEN.has(w)) return true;
  if (w.length >= 3 && /[аеиоуыэюя]л$/.test(w)) return true;
  if (w.length >= 5 && /[аеиоуыэюя]лся$/.test(w)) return true;
  if (w.length >= 3 && /ла$/.test(w)) return true;
  if (w.length >= 5 && /лась$/.test(w)) return true;
  if (w.length >= 4 && /ен$/.test(w)) return true;
  if (w.length >= 4 && /на$/.test(w)) return true;
  if (w.length >= 4 && /(ый|ий|ой|ая|яя)$/.test(w)) return true;
  return false;
}
/* после «ты/вы/носитель» — два слова до конца части фразы; предлог обрывает
   поиск: за ним — обстоятельство («вы в опасной зоне»), а не сказуемое */
const PREP = new Set("в во на с со к ко у о об обо от до из за под над при по про без для через перед между сквозь".split(" "));
/* глагол настоящего или будущего времени: «вы справитесь», «носитель пьёт»;
   и прошедшего во множественном: «вы нашли обходной путь» — дальше дополнение */
const PRESENT = /(ит|ет|ут|ют|ат|ят|ешь|ишь|ете|ите|ем|им|ется|ится|утся|ются|атся|ятся|ешься|ишься|етесь|итесь)$/;
const PLURAL_PAST = /^[а-я]{2,}(ли|лись)$/;
function genderHits(s) {
  const out = [];
  const t = LOW(s);
  const re = /(^|[^а-я])(ты|вы|носитель)(?=[^а-я]|$)/g;
  let m;
  while ((m = re.exec(t))) {
    const rest = t.slice(m.index + m[0].length);
    const clause = rest.split(/[,.!?…;:()«»]/)[0];
    const words = clause.split(/[\s—]+/).filter(Boolean);
    for (let i = 0; i < words.length && i < 2; i++) {
      if (PREP.has(words[i])) break;
      if (gendered(words[i])) out.push(m[2] + " … " + words[i]);
      else if (PRESENT.test(words[i]) || PLURAL_PAST.test(words[i])) break; /* сказуемое уже есть и рода не знает */
    }
  }
  return out;
}
/* самопроверка эвристики: эти фразы она обязана поймать, а эти — пропустить */
["Вы пришёл вовремя.", "Ты сделала это.", "Вы одна?", "Вы готов, носитель?", "Вы устала.", "Вы первый.", "Носитель обнаружен.", "Вы смогла.", "Вы оба нарушаете."]
  .forEach(function (s) { if (!genderHits(s).length) err("эвристика рода не видит: «" + s + "»"); });
["Вы здесь, носитель.", "Вы ранены?", "Вы справитесь.", "Вы в опасной зоне.", "Вы ушли с камер.", "Вы на этаже {F}.", "Носитель пьёт.", "Вы снова здесь.", "Вы нашли обходной путь."]
  .forEach(function (s) { if (genderHits(s).length) err("эвристика рода ошибается: «" + s + "»"); });
/* существительные, которые сами задают герою род: «нарушитель», «пассажир»,
   «посторонний в секторе», «открыто посторонним» (о чужом шуме и предмете — можно) */
const AGENT = [/(^|[^а-я])(нарушител[ьяюе]|нарушителем|пассажир|пассажира|пассажиру|пассажиром|покупател[ьяюе]|покупателем|взломщи[кц][а-я]*|гост[ьяюе]|гостем)(?=[^а-я]|$)/,
  /посторонний(?=\s*[.,:;!?—]|\s+(в|на|у|внутри)(?=[^а-я]))/, /(открыт|включен|разряжен|вскрыт|снят)[аоы]?\s+посторонним(?=\s*[.,:;!?—]|$)/];
function agentHit(s) { const t = LOW(s); for (const re of AGENT) { const m = t.match(re); if (m) return m[0].trim(); } return ""; }
["Внимание: нарушитель «Эхо».", "Пост, проверить пассажира.", "Посторонний в секторе.", "Сейф открыт посторонним.", "В саду новый гость."]
  .forEach(function (s) { if (!agentHit(s)) err("проверка родовых существительных не видит: «" + s + "»"); });
["Посторонний шум в секторе.", "Оружие не выдаётся посторонним.", "Дверь открыта посторонним инструментом.", "Помещение не для посторонних."]
  .forEach(function (s) { if (agentHit(s)) err("проверка родовых существительных ошибается: «" + s + "»"); });
function sentences(s) { const m = s.match(/[.!?…]+»?(?=\s|$)/g); return m ? m.length : 0; }

/* ── проверка одной реплики ── */
function checkLine(b, k, s, where) {
  if (typeof s !== "string" || !s.length) { err(where + ": пустая или не строка"); return; }
  if (s !== s.trim()) err(where + ": пробел в начале или в конце");
  if (/\s{2,}/.test(s)) err(where + ": двойной пробел");
  const ph = s.match(/\{[^{}]*\}/g) || [];
  ph.forEach(function (p) { if (["{L}", "{F}", "{room}"].indexOf(p) < 0) err(where + ": чужая подстановка " + p); });
  if (/[{}]/.test(s.replace(/\{(L|F|room)\}/g, ""))) err(where + ": лишняя фигурная скобка");
  if (s.indexOf("{room}") >= 0 && k !== "vault") err(where + ": {room} — только в виде vault");
  if (s.indexOf("{F}") >= 0 && k !== "floor") err(where + ": {F} — только в виде floor");
  if (s.split("«{room}»").join("").indexOf("{room}") >= 0) err(where + ": {room} должен стоять внутри «…»");
  if (/["„“”'`]/.test(s)) err(where + ": прямые или «лапки»-кавычки вместо «ёлочек»");
  let depth = 0, bad = false;
  for (const c of s) { if (c === "«") depth++; else if (c === "»") { depth--; if (depth < 0) bad = true; } }
  if (bad || depth !== 0) err(where + ": непарные «ёлочки»");
  if (/ - |–|--/.test(s)) err(where + ": дефис или короткое тире вместо «—»");
  if (/\.\.\./.test(s)) err(where + ": три точки вместо «…»");
  if (!/[.!?…»]$/.test(s)) err(where + ": нет знака в конце");
  if (/^[a-zа-яё]/.test(s)) err(where + ": начинается со строчной буквы");
  if (/[a-z]/i.test(s.replace(/\{(L|F|room)\}/g, ""))) err(where + ": латиница в реплике");
  const L = LOW(s);
  FORBID.forEach(function (re) { if (re.test(L)) err(where + ": запретное слово (" + re + ")"); });
  COUNTS.forEach(function (re) { if (re.test(L)) err(where + ": похоже на число уровней или этажей (" + re + ")"); });
  if (TY.test(L)) err(where + ": ОКО говорит «вы», а в реплике «ты»");
  const yo = s.toLowerCase().match(YO);
  if (yo) err(where + ": нужна «ё»: «" + yo[2] + "»");
  genderHits(s).forEach(function (h) { err(where + ": род героя? «" + h + "»"); });
  const ag = agentHit(s);
  if (ag) err(where + ": слово задаёт герою род: «" + ag + "»");
  if (s.length > 160) err(where + ": длина " + s.length + " > 160");
  const n = sentences(s);
  if (n > 4 || (n > 2 && s.length > 110)) err(where + ": предложений " + n + " при длине " + s.length);
  else if (n > 2 && b !== "b1") warn(where + ": " + n + " коротких предложения — не больше ли двух?");
}

/* ── обход ── */
const seen = new Map(); /* нормализованная реплика → где впервые */
const total = {}, table = {};
for (const b in OL) if (BLOCKS.indexOf(b) < 0) err("лишний блок «" + b + "»: этот файл — только для base, b1, b2");
BLOCKS.forEach(function (b) {
  const P = OL[b];
  total[b] = 0; table[b] = [];
  if (!P) { err("нет блока " + b); return; }
  for (const k in P) if (BASE_KINDS.indexOf(k) < 0 && NEW.indexOf(k) < 0) err(b + ": неизвестный вид «" + k + "»");
  BASE_KINDS.concat(NEW).forEach(function (k) {
    const arr = P[k] || [], r = range(b, k);
    if (!Array.isArray(arr)) { err(b + "." + k + ": не массив"); return; }
    if (arr.length < r[0] || arr.length > r[1]) err(b + "." + k + ": реплик " + arr.length + ", нужно " + r[0] + "–" + r[1]);
    total[b] += arr.length;
    table[b].push(k + " " + arr.length);
    arr.forEach(function (s, i) {
      const where = b + "." + k + "[" + i + "]";
      checkLine(b, k, s, where);
      if (typeof s !== "string") return;
      const key = norm(s);
      if (seen.has(key)) err(where + ": повтор реплики " + seen.get(key));
      else seen.set(key, where);
      if (existing.has(key)) err(where + ": уже есть в " + existing.get(key));
    });
    /* начало реплик: не больше половины вида — с одного слова */
    if (arr.length >= 5) {
      const first = {};
      arr.forEach(function (s) { const w = LOW(String(s)).replace(/^[^а-яa-z0-9{]+/, "").split(/[^а-яa-z0-9{}]+/)[0]; first[w] = (first[w] || 0) + 1; });
      for (const w in first) if (first[w] > arr.length / 2) warn(b + "." + k + ": " + first[w] + " из " + arr.length + " реплик начинаются со слова «" + w + "»");
    }
  });
  /* вид vault без названия помещения не должен замолчать */
  if (P.vault && !P.vault.some(function (s) { return s.indexOf("{room}") < 0; })) warn(b + ".vault: нет реплик без {room}");
});

/* ── на глубине ни один вид не уходит в голос базы (как lines() в oko.js) ── */
["b1", "b2"].forEach(function (b) {
  BASE_KINDS.concat(NEW).forEach(function (k) {
    const own = (OWN[b][k] || []).length, more = ((OL[b] || {})[k] || []).length;
    if (!own && !more) err(b + "." + k + ": нет ни своих реплик блока, ни дополнительных — прозвучит голос базы");
  });
});

/* ── похожие реплики внутри блока (предупреждение, не ошибка) ── */
function words(s) { return new Set(norm(s).split(" ").filter(function (w) { return w.length > 3; })); }
BLOCKS.forEach(function (b) {
  const P = OL[b] || {}, all = [];
  for (const k in P) P[k].forEach(function (s, i) { if (typeof s === "string") all.push({ w: words(s), at: b + "." + k + "[" + i + "]" }); });
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const A = all[i].w, B = all[j].w;
    if (A.size < 4 || B.size < 4) continue;
    let inter = 0; A.forEach(function (w) { if (B.has(w)) inter++; });
    if (inter / (A.size + B.size - inter) >= 0.6) warn("похожие реплики: " + all[i].at + " и " + all[j].at);
  }
});

finish();
function finish() {
  if (VERBOSE) BLOCKS.forEach(function (b) { if (table[b]) console.log(b + ": " + table[b].join(", ")); });
  if (Object.keys(total).length) console.log("Реплик: " + BLOCKS.map(function (b) { return b + " — " + (total[b] || 0); }).join(", ") +
    ", всего " + BLOCKS.reduce(function (a, b) { return a + (total[b] || 0); }, 0) + (warns ? "; предупреждений: " + warns : "") + ".");
  if (fails) { console.error("Ошибок: " + fails + "."); process.exit(1); }
  console.log("ВСЁ ХОРОШО");
  process.exit(0);
}
