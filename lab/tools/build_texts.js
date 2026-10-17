#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — сборка текстовых данных (1.3).
   Исходники — JSON в lab/tools/texts_src: рассказы, сны, радио и видео
   капсул; книги, объявления, журналы и фото кабинетов; варианты типов
   помещений; подробности, следы хозяев, состояния и износ вещей; части
   записок, строки журналов, заявок и слухов. Сборка пишет готовые файлы
   игры: js/capsule_texts.js, js/annex_texts.js, js/annex_var.js,
   js/annex_frag.js. Запуск: node lab/tools/build_texts.js
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), SRC = path.join(__dirname, "texts_src");
const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
const has = (f) => fs.existsSync(path.join(SRC, f));
const q = (s) => JSON.stringify(s);
/* Строки — по одной на строку файла: правки видны в истории по одной. */
function fmt(v, ind) {
  ind = ind || "";
  const n = ind + "  ";
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    if (v.every((x) => typeof x === "string" || typeof x === "number")) return "[\n" + v.map((x) => n + q(x)).join(",\n") + "\n" + ind + "]";
    return "[\n" + v.map((x) => n + fmt(x, n)).join(",\n") + "\n" + ind + "]";
  }
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (!ks.length) return "{}";
    const flat = ks.every((k) => typeof v[k] !== "object" || v[k] === null || (Array.isArray(v[k]) && v[k].every((x) => typeof x !== "object") && JSON.stringify(v[k]).length < 60) || (!Array.isArray(v[k]) && JSON.stringify(v[k]).length < 80));
    if (flat && JSON.stringify(v).length < 900) return "{ " + ks.map((k) => q(k) + ": " + JSON.stringify(v[k])).join(", ") + " }";
    return "{\n" + ks.map((k) => n + q(k) + ": " + fmt(v[k], n)).join(",\n") + "\n" + ind + "}";
  }
  return JSON.stringify(v);
}
function write(file, head, body) {
  const out = head + "\n(function () {\n\"use strict\";\nvar LAB = (typeof window !== \"undefined\" ? window.LAB : globalThis.LAB);\n" + body + "\n})();\n";
  fs.writeFileSync(path.join(ROOT, "js", file), out);
  console.log(file, (out.length / 1024).toFixed(0) + " КБ");
}
const HDR = (what) => "/* «Подземная лаборатория» — " + what + " (1.3).\n   Файл собран из lab/tools/texts_src сборщиком lab/tools/build_texts.js — правьте исходники. */";

/* ── капсулы ── */
const cap = { surface: [], projects: [], dreams: [], radio: [], video: [] };
["surface1", "surface2"].forEach((f) => { if (has(f + ".json")) cap.surface = cap.surface.concat(read(f + ".json")); });
["projects", "dreams", "radio", "video"].forEach((k) => { if (has(k + ".json")) cap[k] = read(k + ".json"); });
cap.surface.sort((a, b) => (a.minL || 1) - (b.minL || 1));
write("capsule_texts.js", HDR("рассказы, сны, радио и видео капсул восстановления"), "LAB.CAPSULE_T = " + fmt(cap) + ";");

/* ── книги, объявления, журналы и фото кабинетов ── */
const at = has("annex_texts.json") ? read("annex_texts.json") : { books: [], notices: [], logs: [], photos: [] };
write("annex_texts.js", HDR("книги, объявления, журналы смен и фотографии кабинетов"), "LAB.ANNEX_T = " + fmt(at) + ";");

/* ── варианты типов помещений и новые типы ── */
const V = {}, NEW = {};
fs.readdirSync(SRC).filter((f) => /^variants_\d+\.json$/.test(f)).sort().forEach((f) => {
  const d = read(f);
  for (const k in d.types || {}) V[k] = (V[k] || []).concat(d.types[k]);
  for (const k in d.new || {}) { const def = Object.assign({}, d.new[k]); const vs = def.v || []; delete def.v; NEW[k] = def; V[k] = (V[k] || []).concat(vs); }
});
write("annex_var.js", HDR("варианты помещений у коридоров: свои название, описание и обстановка"),
  "/* новые типы — в общую таблицу помещений (до annex.js) */\nvar NEW = " + fmt(NEW) + ";\nLAB.ANNEX_ROOMS = LAB.ANNEX_ROOMS || {};\nfor (var k in NEW) if (!LAB.ANNEX_ROOMS[k]) LAB.ANNEX_ROOMS[k] = NEW[k];\nLAB.ANNEX_V = " + fmt(V) + ";");

/* ── подробности и записки по глубинам ── */
const F = {}, N = {};
fs.readdirSync(SRC).filter((f) => /^frag_[KPCOMI]\.json$/.test(f)).sort().forEach((f) => { const d = read(f); const e = d.era; delete d.era; F[e] = d; });
fs.readdirSync(SRC).filter((f) => /^notes_[A-Z]+\.json$/.test(f)).sort().forEach((f) => { [].concat(read(f)).forEach((d) => { const e = d.era; delete d.era; N[e] = d; }); });
write("annex_frag.js", HDR("подробности помещений, следы хозяев, состояния, износ вещей и части записок по глубинам"), "LAB.ANNEX_F = " + fmt(F) + ";\nLAB.ANNEX_N = " + fmt(N) + ";");
