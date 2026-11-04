#!/usr/bin/env node
/* Сколько в игре разных головоломок: по каждому виду и ступени сложности перебираются зёрна и
   считаются разные задачи — по подписи содержания (sig у частей 4–6) или по тексту условия и
   данным задачи (части 2–3). Части 4–6 подключаются, если файлы есть.
   Запуск: node lab/tools/count_puzzles.js [зёрен на вид и ступень, по умолчанию 2000] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(100, Number(process.argv[2]) || 2000);
const ctx = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp, Proxy, Symbol, Map, Set, setTimeout: () => 0, clearTimeout: () => {} };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js", "js/chempuz.js", "js/puzzles4.js", "js/puzzles5.js", "js/puzzles6.js"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) { try { vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f }); } catch (e) { console.error("не загрузился " + f + ": " + e.message); } }
}
const LAB = ctx.LAB;
const rows = [];
let total = 0;
function count(part, mod, sigOf) {
  if (!mod || !mod.kinds) return;
  let sub = 0;
  mod.kinds.forEach(k => {
    const per = [];
    for (let d = 0; d <= 2; d++) {
      const seen = new Set();
      for (let s = 1; s <= SEEDS; s++) { let x; try { x = sigOf(k, s, d); } catch (e) { x = null; } if (x != null) seen.add(x); }
      per.push(seen.size);
    }
    const n = per[0] + per[1] + per[2];
    rows.push({ part, k, name: (mod.names && mod.names[k]) || k, per, n });
    sub += n;
  });
  total += sub;
  console.log(`${part}: видов ${mod.kinds.length}, разных задач ${sub}`);
}
const strip = g => JSON.stringify({ c: g && g.cond, d: g && g.data, p: g && g.plan });
count("часть 2", LAB.puzzles2, (k, s, d) => strip(LAB.puzzles2.gen(k, s, d)));
count("часть 3", LAB.puzzles3, (k, s, d) => strip(LAB.puzzles3.gen(k, s, d)));
["puzzles4", "puzzles5", "puzzles6"].forEach((m, i) => count("часть " + (i + 4), LAB[m], (k, s, d) => LAB[m].sig(k, s, d)));
rows.sort((a, b) => b.n - a.n);
rows.forEach(r => console.log(`  ${r.part.padEnd(8)} ${r.k.padEnd(14)} ${String(r.n).padStart(6)}  (${r.per.join(" / ")})  ${r.name}`));
console.log(`Всего разных головоломок при ${SEEDS} зёрнах на вид и ступень: ${total}`);
