#!/usr/bin/env node
/* Перекрёстная проверка глубоких блоков: записки и вехи 20-го этажа называют того стража, что
   движок ставит на этот уровень, и правильно говорят, где шлюзовая ключ-карта (card).
   Запуск: node lab/tools/xref_deep.js [номера блоков] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const only = process.argv.slice(2).map(Number);
const ctx = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp, Proxy, Symbol, Map, Set };
ctx.globalThis = ctx; vm.createContext(ctx);
const blocks = []; for (let n = 6; n <= 15; n++) if (fs.existsSync(path.join(ROOT, "js/d" + n + ".js"))) blocks.push(n);
for (const f of ["js/data.js","js/texts.js","js/lore.js","js/b1.js","js/b2.js","js/b3.js","js/b4.js","js/b5.js","js/deep.js"].concat(blocks.map(n => "js/d" + n + ".js"), ["js/world.js", "js/mutants.js"])) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
const LAB = ctx.LAB;
LAB.LEVELS_N = LAB.blockRange(15).to; /* все блоки, даже если цепочка не сплошная */
let bad = 0, checked = 0;
const stem = w => w.length > 5 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w;
function nameRe(n) { const ws = n.replace(/[«»"]/g, "").split(/\s+/).filter(w => w.length > 2); return new RegExp(ws.map(w => stem(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[а-яё]*\\s+[^\\s]*?\\s*"), "i"); }
function txtOf(v) { return typeof v === "string" ? v : v ? [v.t, v.x].filter(Boolean).join(" ") : ""; }
for (const n of blocks) {
  if (only.length && only.indexOf(n) < 0) continue;
  const D = LAB.DEEP[n], R = LAB.blockRange(n); if (!D || !LAB.deepReady || !LAB.deepReady(n)) { console.log("блок " + n + ": не готов"); continue; }
  if (!LAB.deepLevel(R.from)) { console.log("блок " + n + ": уровни не строятся (LEVELS_N " + LAB.LEVELS_N + ")"); continue; }
  const own = Object.keys(LAB.BOSSES).filter(k => k.indexOf("v" + n + "_") === 0);
  const GEN = /^(главн|старш|младш|больш|мал|перв|последн|страж|нов|стар|верхн|нижн|сам)/i;
  const key1 = n => { const ws = n.replace(/[«»"]/g, "").split(/\s+/).filter(w => w.length > 3); const w = ws.find(x => !GEN.test(x)) || ws[0] || n; return new RegExp(stem(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); };
  const res = own.map(k => ({ k, n: LAB.BOSSES[k].n, re: nameRe(LAB.BOSSES[k].n), k1: key1(LAB.BOSSES[k].n) }));
  const probe = (L, text, where) => {
    if (!text) return; checked++;
    const lv = LAB.deepLevel(L); if (!lv) { console.log(`  ${where}: уровень ${L} не строится`); bad++; return; }
    const named = res.filter(b => b.re.test(text));
    const actual = res.find(b => b.k === lv.boss);
    const words = n => n.replace(/[«»"]/g, " ").split(/\s+/).filter(w => w.length > 3 && !GEN.test(w));
    const actualNamed = actual && (actual.re.test(text) || actual.k1.test(text) || words(actual.n).some(w => new RegExp(stem(w), "i").test(text)));
    if (named.length && !actualNamed) { bad++; console.log(`  ${where} (уровень ${L}): названы ${named.map(b => "«" + b.n + "»").join(", ")}, а стоит «${actual ? actual.n : lv.boss}»`); }
    const t2 = text.replace(/(ни\s+\S+\s+)?(при себе\s+)?не\s+(носит|держит|при себе|у него|у неё)[^.:;,]*/gi, " ").replace(/(при себе|при н[её]м|у него|у неё)\s+(не\s+\S+|нет)[^.:;,]*/gi, " ").replace(/карт\S*\s+(при н[её]м|у него|у неё)\s+нет[^.:;,]*/gi, " ");
    const sayHidden = /спрятал|спрятан|убрал|укрыти|обыщ|ищите|в ящик|в шкаф|тайник|где-то на (этом |том )?этаже|лежит (она|где-то)/i.test(t2), sayBoss = /карт[ауые][^.]{0,60}(у стража|при н[её]м|при себе|носит|в кармане|на поясе|с него|с неё|снимите|заберите у)|(носит|держит)[^.]{0,40}карт/i.test(t2);
    if (lv.card === "boss" && sayHidden && !sayBoss) { bad++; console.log(`  ${where} (уровень ${L}): записка говорит, что карта спрятана, а она у стража`); }
    if (lv.card === "hidden" && sayBoss && !sayHidden) { bad++; console.log(`  ${where} (уровень ${L}): записка говорит, что карта у стража, а она спрятана`); }
  };
  console.log(`Блок ${n}: стражей ${own.length}`);
  for (let a = 0; a <= 3; a++) probe(R.from + a, txtOf(D.milestones["first+" + a + "-20"]), `first+${a}-20`);
  for (let b = 0; b <= 1; b++) probe(R.to - b, txtOf(D.milestones["last-" + b + "-20"]), `last-${b}-20`);
  /* записки секторов на 20-м этаже: первое появление сектора (у первого сектора — пятый уровень) */
  const seen = new Set();
  for (let L = R.from; L <= R.to; L++) {
    const so = LAB.deepSector(L); if (!so) continue;
    const st = LAB.deepStory(L, 20); if (!st) continue;
    if (D.milestones["first+" + (L - R.from) + "-20"] || D.milestones["last-" + (R.to - L) + "-20"]) continue;
    const key = so.s.id; if (seen.has(key + "@" + L)) continue; seen.add(key + "@" + L);
    probe(L, txtOf(st), `sectorStory.${key}[20]`);
  }
}
console.log(`Проверено записок: ${checked}, нелогичностей: ${bad}`);
process.exit(bad ? 1 : 0);
