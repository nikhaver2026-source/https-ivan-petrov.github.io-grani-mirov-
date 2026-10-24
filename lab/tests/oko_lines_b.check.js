#!/usr/bin/env node
/* Проверка реплик ОКО для блоков III–V (js/oko_lines_b.js): «Отражение»
   (b3, уровни 41–60), «Механизм» (b4, 61–80), «Исток» (b5, 81–100).
   Файл загружается в песочнице Node (globalThis.LAB = {}); проверяется:
   • синтаксис не новее ES2018 (acorn, если он есть рядом; иначе — Node);
   • есть блоки b3, b4, b5 и только они; нет неизвестных видов событий;
   • сколько реплик у каждого вида: для видов из BASE (js/oko.js) — 3–4,
     если блок уже говорит этот вид своим голосом, иначе 4–5; для тревоги,
     подозрения, потери цели, двери, проверки на шум и реплик «просто так»
     — 8–10; для новых видов (реакции на действия игрока) — 5–6;
   • нет повторов внутри вида, во всём файле и с уже написанными репликами
     (BASE из oko.js, oko-разделы b1–b5.js, а если есть — oko_lines_a.js);
     сравнение — без учёта регистра, «ё» и знаков препинания;
   • подстановки — только {L}, {F} (вид floor) и {room} (вид vault, и только
     внутри «…»); кавычки — только «ёлочки», и они парные; тире — «—»,
     многоточие — «…»; без «Грани Миров», «Странников», брани и сведений о
     том, сколько в комплексе уровней или этажей;
   • длина — до 170 знаков (в «Отражении» строка с эхом второго голоса — до
     200); одно-два коротких предложения (повторы эха — не в счёт);
   • обращение: в b3 и b5 ОКО говорит «вы», в b4 — «ты»;
   • герой без рода: после «ты», «вы», «седьмой», «носитель» в пределах двух
     слов той же части фразы не должно быть прошедшего времени или
     прилагательного в мужском или женском роде (эвристика).
   Без ошибок — печатает «ВСЁ ХОРОШО»; с ошибками — выходит с кодом 1.
   Запуск: node lab/tests/oko_lines_b.check.js */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "js/oko_lines_b.js");
const BLOCKS = ["b3", "b4", "b5"];
let fails = 0, warns = 0;
function err(m) { console.error("✗ " + m); fails++; }
function warn(m) { console.warn("⚠ " + m); warns++; }

/* ── синтаксис ── */
const src = fs.readFileSync(FILE, "utf8");
let acorn = null;
try { acorn = require("acorn"); } catch (e) { /* нет рядом — проверит Node */ }
try {
  if (acorn) acorn.parse(src, { ecmaVersion: 2018 });
  else new vm.Script(src, { filename: "oko_lines_b.js" });
} catch (e) { err("синтаксис: " + e.message); finish(); }

/* ── наш файл ── */
const ctx = { console };
ctx.globalThis = ctx;
ctx.LAB = {};
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: "js/oko_lines_b.js" });
const OL = ctx.LAB.OKO_LINES;
if (!OL || typeof OL !== "object") { err("LAB.OKO_LINES не создан"); finish(); }

/* ── файл дописывает LAB.OKO_LINES и не затирает чужое (base, b1, b2 из
   oko_lines_a.js или уже лежащие реплики b3–b5) — в любом порядке загрузки ── */
(function () {
  const c2 = { console };
  c2.globalThis = c2;
  c2.LAB = { OKO_LINES: { base: { enter: ["чужая реплика base"] }, b1: { taunt: ["чужая реплика b1"] }, b3: { enter: ["чужая реплика b3"], extra_kind: ["чужой вид"] } } };
  vm.createContext(c2);
  vm.runInContext(src, c2, { filename: "js/oko_lines_b.js" });
  const L2 = c2.LAB.OKO_LINES;
  if (!L2.base || L2.base.enter[0] !== "чужая реплика base") err("файл затёр чужой блок base в LAB.OKO_LINES");
  if (!L2.b1 || L2.b1.taunt[0] !== "чужая реплика b1") err("файл затёр чужой блок b1 в LAB.OKO_LINES");
  if (!L2.b3 || L2.b3.enter[0] !== "чужая реплика b3" || L2.b3.enter.length !== 1 + OL.b3.enter.length) err("файл не дописал, а заменил реплики b3.enter");
  if (!L2.b3 || !L2.b3.extra_kind || L2.b3.extra_kind[0] !== "чужой вид") err("файл затёр чужой вид в b3");
})();

/* ── уже написанные реплики: BASE из oko.js и разделы oko блоков ── */
function extractBase() {
  const t = fs.readFileSync(path.join(ROOT, "js/oko.js"), "utf8");
  const at = t.indexOf("var BASE = {");
  if (at < 0) throw new Error("в oko.js нет BASE");
  let i = t.indexOf("{", at), depth = 0, inStr = false;
  const start = i;
  for (; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (c === "\\") i++; else if (c === "\"") inStr = false; continue; }
    if (c === "\"") inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) break;
  }
  return vm.runInNewContext("(" + t.slice(start, i + 1) + ")");
}
const BASE = extractBase();
const BASE_KINDS = Object.keys(BASE);
const bctx = { console, Math, JSON, Object, Array, String, Number, Error, Date, RegExp };
bctx.globalThis = bctx;
vm.createContext(bctx);
const quiet = console.warn; console.warn = function () {};
for (const f of ["js/data.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), bctx, { filename: f });
}
console.warn = quiet;
const OWN = {}; /* "b3" → собственные реплики блока (oko в b3.js) */
for (let n = 1; n <= 5; n++) OWN["b" + n] = (bctx.LAB.BLOCKS[n] && bctx.LAB.BLOCKS[n].oko) || {};
let OTHER = null; /* реплики второго файла (base, b1, b2), если он уже есть */
const fileA = path.join(ROOT, "js/oko_lines_a.js");
if (fs.existsSync(fileA)) {
  const actx = { console }; actx.globalThis = actx; actx.LAB = {};
  vm.createContext(actx);
  try { vm.runInContext(fs.readFileSync(fileA, "utf8"), actx, { filename: "js/oko_lines_a.js" }); OTHER = actx.LAB.OKO_LINES || null; }
  catch (e) { warn("oko_lines_a.js не загрузился: " + e.message); }
}

/* ── виды событий ── */
const BIG = ["alarm", "suspect", "lost", "door", "check", "taunt"];
const NEW = ["kill_mech", "kill_bio", "kill_many", "hurt", "low_hp", "heal", "eat", "drink", "rest", "capsule", "bind", "revive",
  "note", "mail", "safe", "pick", "hack_ok", "puzzle_ok", "puzzle_fail", "music", "craft", "buy", "sell", "trap_set", "trap_kill",
  "oko_trap", "oko_trap_off", "mines_order", "grenade", "quiet", "idle", "secret", "zone", "vault", "floor", "weapon", "implant",
  "survivor", "turret_kill", "patrol_slip", "mutate"]; /* (3.0) mutate — носитель мутирует */
function range(b, k) {
  if (NEW.indexOf(k) >= 0) return [5, 6];
  if (BIG.indexOf(k) >= 0) return [8, 10];
  return OWN[b][k] && OWN[b][k].length ? [3, 4] : [4, 5];
}

/* ── нормализация для сравнения ── */
function norm(s) { return s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9{}]+/g, " ").trim(); }
const existing = new Map();
function addExisting(where, arr) { (arr || []).forEach(function (s) { if (typeof s === "string" && !existing.has(norm(s))) existing.set(norm(s), where); }); }
BASE_KINDS.forEach(function (k) { addExisting("oko.js BASE." + k, BASE[k]); });
for (const b in OWN) for (const k in OWN[b]) addExisting(b + ".js oko." + k, OWN[b][k]);
if (OTHER) for (const b in OTHER) for (const k in OTHER[b]) addExisting("oko_lines_a.js " + b + "." + k, OTHER[b][k]);

/* ── словари ── */
const LOW = function (s) { return s.toLowerCase().replace(/ё/g, "е"); };
const FORBID = [/гран[ьиеюя]\s+мир/, /странник/, /(^|[^а-я])(хуй|хуе|хуё|пизд|бля|ебат|ебан|ёбан|еба[лн]|сука|суки|мудак|мудил|говн|дерьм|жоп|сволоч|ублюд|гнид|падл|шлюх|херн|хрен)/];
const COUNTS = [/(^|[^а-я])(\d+|сто|двести|девяносто|восемьдесят|семьдесят|шестьдесят|пятьдесят|сорок|тридцать|двадцать|десять)\s+(уровн|уровен|этаж)/, /последн[а-я]*\s+(уровн|уровен|этаж)/, /сот(ый|ого|ом)\s+(уровн|уровен|этаж)/, /всего\s+(\S+\s+)?(уровн|уровен|этаж)/];
const TY = /(^|[^а-я])(ты|тебя|тебе|тобой|тобою|твой|твоя|твое|твои|твоих|твоим|твоими|твоего|твоей|твоему|твою)(?=[^а-я]|$)/;
const VY = /(^|[^а-я])(вы|вас|вам|вами|ваш|ваша|ваше|ваши|вашего|вашей|вашему|вашим|вашими|ваших|вашу)(?=[^а-я]|$)/;
/* слова с «родовым» окончанием, которые не говорят о роде героя */
const NOT_GENDER = new Set(("игла сила стрела скала мгла пчела дела тела зола глава смола тишина стена струна волна глубина сторона " +
  "цена машина смена тайна луна весна страна зона стол пол угол зал канал сигнал журнал протокол металл узел пепел котел ангел орел " +
  "домой порой мной тобой собой рукой ногой стеной рекой водой тишиной паузой другой иной той этой одной " +
  "стой постой открой закрой успокой " +
  "здесь тут там уже еще все всё тоже так очень совсем почти снова опять сейчас теперь только").split(" ").map(LOW));
const GEN = new Set(("готов готова рад рада прав права жив жива здоров здорова один одна сам сама цел цела должен должна нужен нужна " +
  "уверен уверена свободен свободна похож похожа ранен ранена смог смогла мог могла помог помогла лег легла нес несла донес принес " +
  "вез привез рос вырос достиг проник привык замерз увяз исчез погиб промок стер умер запер отпер вытер спас " +
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
/* после «ты/вы/седьмой/носитель» — два слова до конца части фразы; предлог
   обрывает поиск: за ним — обстоятельство («вы в зеркальной коробке»), а
   не сказуемое */
const PREP = new Set("в во на с со к ко у о об обо от до из за под над при по про без для через перед между сквозь".split(" "));
/* глагол настоящего или будущего времени: «ты справишься», «носитель получит второй шанс» */
const PRESENT = /(ит|ет|ут|ют|ат|ят|ешь|ишь|ете|ите|ем|им|ется|ится|утся|ются|атся|ятся|ешься|ишься|етесь|итесь)$/;
function genderHits(s) {
  const out = [];
  const t = LOW(s);
  const re = /(^|[^а-я])(ты|вы|седьмой|носитель)(?=[^а-я]|$)/g;
  let m;
  while ((m = re.exec(t))) {
    const rest = t.slice(m.index + m[0].length);
    const clause = rest.split(/[,.!?…;:()«»]/)[0];
    const words = clause.split(/[\s—]+/).filter(Boolean);
    for (let i = 0; i < words.length && i < 2; i++) {
      if (PREP.has(words[i])) break;
      if (gendered(words[i])) out.push(m[2] + " … " + words[i]);
      else if (PRESENT.test(words[i])) break; /* сказуемое уже есть и рода не знает */
    }
  }
  return out;
}
/* самопроверка эвристики: эти фразы она обязана поймать, а эти — пропустить */
["Ты сделал это.", "Ты пришла вовремя.", "Вы одна?", "Ты готов, седьмой?", "Ты устал.", "Ты первый.", "Седьмой справился.", "Носитель обнаружен.", "Ты смог."]
  .forEach(function (s) { if (!genderHits(s).length) err("эвристика рода не видит: «" + s + "»"); });
["Ты здесь, седьмой.", "Вы целы?", "Ты справишься.", "Вы в зеркальной коробке.", "У тебя получилось.", "Вы ушли из стекла.", "Ты на этаже {F}."]
  .forEach(function (s) { if (genderHits(s).length) err("эвристика рода ошибается: «" + s + "»"); });
function sentences(s) { const m = s.match(/[.!?…]+»?(?=\s|$)/g); return m ? m.length : 0; }
function isEcho(s) { return /— /.test(s) && /(голос|повтор|подхват|втори|отзыва|передразн|отклика|эхом|договарива)/.test(LOW(s)); }

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
  if (/["„“”']/.test(s)) err(where + ": прямые или «лапки»-кавычки вместо «ёлочек»");
  let depth = 0, bad = false;
  for (const c of s) { if (c === "«") depth++; else if (c === "»") { depth--; if (depth < 0) bad = true; } }
  if (bad || depth !== 0) err(where + ": непарные «ёлочки»");
  if (/ - |–|--/.test(s)) err(where + ": дефис или короткое тире вместо «—»");
  if (/\.\.\./.test(s)) err(where + ": три точки вместо «…»");
  if (!/[.!?…»]$/.test(s)) err(where + ": нет знака в конце");
  if (/^[a-zа-яё]/.test(s)) err(where + ": начинается со строчной буквы");
  const L = LOW(s);
  FORBID.forEach(function (re) { if (re.test(L)) err(where + ": запретное слово (" + re + ")"); });
  COUNTS.forEach(function (re) { if (re.test(L)) err(where + ": похоже на число уровней или этажей (" + re + ")"); });
  if (b === "b4") { if (VY.test(L)) err(where + ": в «Механизме» ОКО говорит «ты», а здесь «вы»"); }
  else if (TY.test(L)) err(where + ": здесь ОКО говорит «вы», а в реплике «ты»");
  genderHits(s).forEach(function (h) { err(where + ": род героя? «" + h + "»"); });
  const max = b === "b3" && isEcho(s) ? 200 : 170;
  if (s.length > max) err(where + ": длина " + s.length + " > " + max);
  const n = sentences(s);
  if (b === "b3") { if (n > 7) err(where + ": предложений " + n + " (даже с повторами эха много)"); }
  else if (b === "b4") { if (n > 3 || (n === 3 && s.length > 120)) err(where + ": предложений " + n + " при длине " + s.length); }
  else if (n > 4 || (n > 2 && s.length > 110)) err(where + ": предложений " + n + " при длине " + s.length);
}

/* ── обход ── */
const seen = new Map(); /* нормализованная реплика → где впервые */
const total = {};
for (const b in OL) if (BLOCKS.indexOf(b) < 0) err("лишний блок «" + b + "»: этот файл — только для b3, b4, b5");
BLOCKS.forEach(function (b) {
  const P = OL[b];
  total[b] = 0;
  if (!P) { err("нет блока " + b); return; }
  for (const k in P) if (BASE_KINDS.indexOf(k) < 0 && NEW.indexOf(k) < 0) err(b + ": неизвестный вид «" + k + "»");
  BASE_KINDS.concat(NEW).forEach(function (k) {
    const arr = P[k] || [], r = range(b, k);
    if (!Array.isArray(arr)) { err(b + "." + k + ": не массив"); return; }
    if (arr.length < r[0] || arr.length > r[1]) err(b + "." + k + ": реплик " + arr.length + ", нужно " + r[0] + "–" + r[1]);
    total[b] += arr.length;
    arr.forEach(function (s, i) {
      const where = b + "." + k + "[" + i + "]";
      checkLine(b, k, s, where);
      if (typeof s !== "string") return;
      const key = norm(s);
      if (seen.has(key)) err(where + ": повтор реплики " + seen.get(key));
      else seen.set(key, where);
      if (existing.has(key)) err(where + ": уже есть в " + existing.get(key));
    });
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
  if (Object.keys(total).length) console.log("Реплик: " + BLOCKS.map(function (b) { return b + " — " + (total[b] || 0); }).join(", ") + (warns ? "; предупреждений: " + warns : "") + ".");
  if (fails) { console.error("Ошибок: " + fails + "."); process.exit(1); }
  console.log("ВСЁ ХОРОШО");
  process.exit(0);
}
