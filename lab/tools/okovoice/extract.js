#!/usr/bin/env node
/* Голос ОКО: все реплики, которые ОКО говорит своими словами, — списком.
   Грузит код игры в песочнице Node (как tools/check_blocks.js) и собирает:
   BASE (oko.js), oko_lines_a/b.js (LAB.OKO_LINES), oko-разделы блоков b1–b5,
   слова Зрачка (каждая ложь — с каждым направлением), поправки настоящего ОКО
   и сделки Счетовода (okoforms.js). Реплики с подстановкой номера этажа или
   названия помещения ({L}, {F}, {room}) записать заранее нельзя — их по-прежнему
   говорит синтезатор; они идут в список отдельно (skip).

     node lab/tools/okovoice/extract.js [ВЫХОД.json]

   Выход — массив { key, text, kind, src, block }; key — отпечаток текста
   (FNV-1a, как в js/okovoice.js), по нему названы записи sounds/oko/<голос>/<key>.mp3. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..", "..");
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, Date, JSON, navigator: { userAgent: "" } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.LAB = {};
vm.createContext(ctx);
for (const f of ["data.js", "texts.js", "lore.js", "b1.js", "b2.js", "b3.js", "b4.js", "b5.js", "oko.js", "oko_lines_a.js", "oko_lines_b.js", "okoforms.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f), "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;

function norm(t) { return String(t || "").replace(/\s+/g, " ").trim(); }
function key(t) {
  t = norm(t);
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ("0000000" + h.toString(16)).slice(-8);
}

const out = [], skip = [], seen = new Map();
function add(text, kind, src, block) {
  text = norm(text);
  if (!text) return;
  if (/\{[A-Za-z]+\}/.test(text)) { skip.push({ text, kind, src }); return; }
  const k = key(text);
  if (seen.has(k)) {
    if (seen.get(k) !== text) throw new Error("совпали отпечатки разных реплик: " + text + " / " + seen.get(k));
    return;
  }
  seen.set(k, text);
  out.push({ key: k, text, kind, src, block });
}
for (const [kind, arr] of Object.entries(LAB.oko.BASE)) arr.forEach(t => add(t, kind, "BASE", 0));
for (const [blk, kinds] of Object.entries(LAB.OKO_LINES || {})) {
  const b = blk === "base" ? 0 : +blk.slice(1);
  for (const [kind, arr] of Object.entries(kinds)) arr.forEach(t => add(t, kind, "OKO_LINES." + blk, b));
}
for (let b = 1; b <= 5; b++) {
  const B = LAB.BLOCKS[b];
  if (!B || !B.oko) continue;
  for (const [kind, arr] of Object.entries(B.oko)) (arr || []).forEach(t => add(t, kind, "b" + b + ".oko", b));
}
const T = LAB.okoForms.TEXTS;
T.FAKE.forEach(t => T.DIRS.forEach(d => add(t.replace(/\{dir\}/g, d), "pupil", "okoforms.FAKE", 3)));
T.CORRECT.forEach(t => add(t, "correct", "okoforms.CORRECT", 3));
for (const [k, v] of Object.entries(T.DEAL)) [].concat(v).forEach(t => add(t, "deal_" + k, "okoforms.DEAL", 4));

const file = process.argv[2] || path.join(__dirname, "lines.json");
fs.writeFileSync(file, JSON.stringify(out, null, 1));
const chars = out.reduce((s, x) => s + x.text.length, 0);
console.log(`реплик для записи: ${out.length} (${chars} знаков); с подстановкой — синтезатор: ${skip.length}`);
console.log("→ " + path.relative(process.cwd(), file));
