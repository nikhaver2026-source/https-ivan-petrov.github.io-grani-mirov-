#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — проверка текстов библиотеки (3.6).
   Исходники — lab/tools/texts_src/lib_*.json (формат — lab/tools/blocks/
   LIB_SPEC.md): книги, документы картотек и архивов, газеты, записи
   магнитофонов, дневники, микрофильмы, таблички витрин, страницы
   лабораторных журналов. Проверяет поля, длины, глубины, подстановки,
   запретные слова, кавычки и числа; печатает ошибки (ERR), замечания
   (WARN) и сводку. Запуск: node lab/tools/check_lib.js [файл…]
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "texts_src");
const KINDS = { book: [900, 4200], doc: [300, 2200], paper: [700, 2600], tape: [350, 1800], diary: [0, 0], film: [400, 1800], exhibit: [150, 700], labbook: [250, 1200],
  specimen: [150, 800], cage: [150, 800], photo: [250, 1100] }; /* (3.6) исследования и опыты: этикетки препаратов, карточки вивария, фотографии */
const HID = [150, 800]; /* (3.6) тайнопись — у документов и страниц журналов */
const CATS = {
  book: ["fiction", "detective", "adventure", "scifi", "humor", "poetry", "children", "songs", "memoir", "history", "nature", "philosophy", "cook",
    "tech", "science", "med", "chem", "rad", "acoustic", "blast", "shoot", "trade", "sleep", "manual"],
  doc: ["order", "protocol", "report", "memo", "personnel", "act", "medcard", "letter", "minutes", "instruction", "incident", "invoice",
    "experiment", "subject", "research", "autopsy"]
};
const ERA_L = { K: [1, 10], P: [11, 20], C: [21, 40], O: [41, 60], M: [61, 80], I: [81, 100] };
const PH = ["имя", "ио", "фам", "фио", "подпись", "пост", "кому_имя", "кому_ио", "кому_фам", "кому_подпись", "кому_пост", "сосед_фио", "сосед_подпись", "сосед_пост",
  "номер", "номер2", "помещение", "время", "вдень", "ребёнок", "сын_дочь", "супруг", "муж_жена"];
/* что нельзя называть вовсе и что нельзя называть выше своей глубины */
const BAN = [[/гран[ьи] миров/i, "«Грань Миров» — последнее слово финала"], [/странник/i, "«Странники» — последнее слово финала"],
  [/(сто|ста|сотн\S*) уровн/i, "общее число уровней"], [/сот(ый|ом|ого) уровн/i, "общее число уровней"], [/двадцат\S* этаж/i, "номер последнего этажа"],
  [/\b(100|20)\s*(уровн|этаж)/i, "общее число уровней или этажей"], [/последн\S* из ста/i, "общее число уровней"]];
const SPOIL = {
  K: [[/Ростовцев/, "Ростовцев — с «Подножия»"], [/[Сс]мен\S* А\b/, "Смена А — с «Подножия»"], [/«?Око-0/, "«Око-0» — с «Подножия»"], [/«Глубин[аыеуо]»/, "объект «Глубина» — с «Подножия»"],
    [/Зрачок|Зрачк/, "«Зрачок» — с «Отражения»"], [/«?Механизм[аеуо]?»/, "«Механизм» — нижний блок"], [/«Отражени/, "«Отражение» — нижний блок"], [/«Подножи/, "«Подножие» — нижний блок"],
    [/Эхо-[1-6]\b/, "носители Эхо-1…6 по именам — с «Отражения»"], [/Сказочник|Счетовод/, "подразумы ОКО — с «Механизма»"]],
  P: [[/Зрачок|Зрачк/, "«Зрачок» — с «Отражения»"], [/«?Механизм[аеуо]?»/, "«Механизм» — нижний блок"], [/«Отражени/, "«Отражение» — нижний блок"], [/Сказочник|Счетовод/, "подразумы ОКО — с «Механизма»"]],
  C: [[/Зрачок|Зрачк/, "«Зрачок» — с «Отражения»"], [/«Механизм/, "«Механизм» — нижний блок"], [/Сказочник|Счетовод/, "подразумы ОКО — с «Механизма»"]],
  O: [[/Сказочник|Счетовод/, "подразумы ОКО — с «Механизма»"]],
  M: [], I: []
};
let errs = 0, warns = 0;
const err = (f, id, m) => { errs++; console.log(`ERR  ${f} ${id}: ${m}`); };
const warn = (f, id, m) => { warns++; console.log(`WARN ${f} ${id}: ${m}`); };
const files = process.argv.slice(2).length ? process.argv.slice(2).map((f) => path.resolve(f)) : fs.readdirSync(SRC).filter((f) => /^lib_.*\.json$/.test(f)).sort().map((f) => path.join(SRC, f));
const seen = {}, stat = { kind: {}, era: {}, cat: {}, chars: 0, n: 0 };
/* все файлы — ради повторов номеров между файлами */
const all = fs.readdirSync(SRC).filter((f) => /^lib_.*\.json$/.test(f)).map((f) => path.join(SRC, f));
for (const f of all) {
  try { (JSON.parse(fs.readFileSync(f, "utf8")).items || []).forEach((q) => { if (q && q.id) (seen[q.id] = seen[q.id] || []).push(path.basename(f)); }); } catch (e) { /* ниже */ }
}
function textCheck(f, id, s, tpl, eras) {
  if (typeof s !== "string" || !s.trim()) { err(f, id, "пустой текст"); return; }
  if (/"/.test(s)) err(f, id, "прямые кавычки в тексте — только «ёлочки» и „лапки“");
  if (/\d{4,}/.test(s)) err(f, id, "число из четырёх и больше цифр (коды замков — дело игры): " + s.match(/\d{4,}/)[0]);
  else if (/\d{3}/.test(s)) warn(f, id, "трёхзначное число цифрами — лучше словами: " + s.match(/\d{3,}/)[0]);
  if (/[A-Za-z]{2,}/.test(s)) warn(f, id, "латиница: " + s.match(/[A-Za-z]{2,}/)[0]);
  if (/ - /.test(s)) warn(f, id, "дефис вместо тире « — »");
  if (/\.\.\./.test(s)) warn(f, id, "три точки вместо многоточия «…»");
  BAN.forEach((b) => { if (b[0].test(s)) err(f, id, b[1]); });
  const top = eras.replace(/[^KPCOMI]/g, "");
  /* запрет — по самой верхней глубине, где текст встречается */
  const first = "KPCOMI".split("").filter((e) => top.indexOf(e) >= 0)[0];
  (SPOIL[first] || []).forEach((b) => { if (b[0].test(s)) err(f, id, "спойлер для глубины " + first + ": " + b[1]); });
  const ph = s.match(/\{[^{}]*\}/g) || [];
  if (ph.length && !tpl) err(f, id, "подстановки " + ph.join(" ") + " — только в документах с \"tpl\": true");
  ph.forEach((p) => { if (PH.indexOf(p.slice(1, -1)) < 0) err(f, id, "неизвестная подстановка " + p); });
  if (/\[[^\]|]*\|[^\]]*\]/.test(s) && !tpl) err(f, id, "[м|ж] — только в документах с \"tpl\": true");
}
for (const fp of files) {
  const f = path.basename(fp);
  let d;
  try { d = JSON.parse(fs.readFileSync(fp, "utf8")); } catch (e) { err(f, "-", "не JSON: " + e.message); continue; }
  if (!d || !Array.isArray(d.items)) { err(f, "-", "нет массива items"); continue; }
  d.items.forEach((q, i) => {
    const id = q && q.id ? q.id : "#" + i;
    if (!q || typeof q !== "object") { err(f, id, "не объект"); return; }
    if (!/^[a-z][a-z0-9_]{2,40}$/.test(q.id || "")) err(f, id, "номер — латиница в нижнем регистре, цифры и _");
    if ((seen[q.id] || []).length > 1) err(f, id, "номер повторяется: " + seen[q.id].join(", "));
    if (!KINDS[q.kind]) { err(f, id, "неизвестный вид " + q.kind); return; }
    if (typeof q.t !== "string" || q.t.length < 2 || q.t.length > 90) err(f, id, "название — от двух до девяноста знаков");
    else if (/[«»"]/.test(q.t.charAt(0)) || /[«»"]$/.test(q.t)) warn(f, id, "название без внешних кавычек — их ставит игра");
    if (q.a != null && (typeof q.a !== "string" || q.a.length > 90)) err(f, id, "автор — строка до девяноста знаков");
    if (typeof q.era !== "string" || !/^[KPCOMI]+$/.test(q.era)) err(f, id, "глубины era — буквы K P C O M I");
    const eras = String(q.era || "");
    if (q.minL != null) {
      if (!Number.isInteger(q.minL) || q.minL < 1 || q.minL > 100) err(f, id, "minL — целое от 1 до 100");
      else if (!eras.split("").some((e) => ERA_L[e] && q.minL <= ERA_L[e][1])) err(f, id, "minL " + q.minL + " глубже всех глубин текста " + eras);
    }
    if (CATS[q.kind]) { if (CATS[q.kind].indexOf(q.cat) < 0) err(f, id, "раздел cat " + q.cat + " — не из списка для " + q.kind); }
    else if (q.cat != null) warn(f, id, "раздел cat у " + q.kind + " не нужен");
    if (q.tpl && q.kind !== "doc") err(f, id, "\"tpl\" — только у документов");
    let len = 0;
    if (q.kind === "diary") {
      if (!Array.isArray(q.pages) || q.pages.length < 4 || q.pages.length > 10) err(f, id, "у дневника pages — от четырёх до десяти записей");
      else q.pages.forEach((p, k) => { textCheck(f, id + "/" + (k + 1), p, false, eras); len += String(p).length; if (String(p).length < 120 || String(p).length > 900) warn(f, id, "запись " + (k + 1) + " — " + String(p).length + " знаков (лучше 150–700)"); });
      if (q.x != null) err(f, id, "у дневника текст — в pages, без x");
    } else {
      textCheck(f, id, q.x, !!q.tpl, eras);
      len = String(q.x || "").length;
      const lim = KINDS[q.kind];
      if (len < lim[0]) err(f, id, "текст короткий: " + len + " знаков, нужно от " + lim[0]);
      if (len > lim[1]) warn(f, id, "текст длинный: " + len + " знаков, лучше до " + lim[1]);
    }
    if (q.hid != null) {
      if (q.kind !== "doc" && q.kind !== "labbook") err(f, id, "тайнопись hid — только у документов и страниц журналов");
      else { textCheck(f, id + "/hid", q.hid, !!q.tpl, eras); const hl = String(q.hid || "").length; if (hl < HID[0] || hl > HID[1]) warn(f, id, "тайнопись — " + hl + " знаков (лучше " + HID[0] + "–" + HID[1] + ")"); stat.hid = (stat.hid || 0) + 1; }
    }
    if (q.kind === "photo" && !/^На снимке/.test(String(q.x || ""))) warn(f, id, "фотография начинается со слов «На снимке…»");
    if (q.kind === "photo" && !/(^|\n\n)На обороте:/.test(String(q.x || ""))) warn(f, id, "у фотографии последний абзац — «На обороте: …»");
    stat.n++; stat.chars += len;
    stat.kind[q.kind] = (stat.kind[q.kind] || 0) + 1;
    eras.split("").forEach((e) => { stat.era[e] = (stat.era[e] || 0) + 1; });
    if (q.cat) stat.cat[q.kind + ":" + q.cat] = (stat.cat[q.kind + ":" + q.cat] || 0) + 1;
  });
}
console.log(`текстов ${stat.n}, знаков ${stat.chars}`);
console.log("виды:", JSON.stringify(stat.kind));
console.log("глубины:", JSON.stringify(stat.era));
console.log("разделы:", JSON.stringify(stat.cat));
if (stat.hid) console.log("с тайнописью:", stat.hid);
console.log(errs ? `ОШИБОК: ${errs}, замечаний: ${warns}` : `ошибок нет, замечаний: ${warns}`);
process.exit(errs ? 1 : 0);
