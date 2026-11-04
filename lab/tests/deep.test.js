#!/usr/bin/env node
/* Проверка глубоких блоков (VI–XV) в Node: для каждого готового блока — уровни строятся по
   секторам, этажи проходимы от прибытия до выхода вниз, лифт достижим; на сотом уровне прибытие
   прежнее, на 101-м — «Край Разлома»; на самом дне — «Ядро Разлома»; срезы стоят только в тайных
   комнатах и подсобках и ведут вниз, но не мимо двух последних уровней блока; у среза с кодом —
   записка с этим кодом на том же этаже; двери с допуском не отрезают выход и запирают комнату
   по-настоящему (без открытого проёма), хранилища по допуску не прячут нужное для прохода; стенды испытаний —
   в испытательных камерах; полы коридоров бетонные, полы помещений — свои; глубина растёт без
   скачков назад. Уровни 1–100 этой проверкой не меняются (их проверяет world.test.js).
   Запуск: node lab/tests/deep.test.js [уровней на блок, по умолчанию 6]
   Пробные блоки из другой папки: DEEP_DIR=… node lab/tests/deep.test.js */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, ".."), DIR = process.env.DEEP_DIR || ROOT;
const PER = Math.max(2, Number(process.argv[2]) || 6);
const ctx = { console: { log() {}, warn() {}, error: console.error }, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp, Proxy, Symbol, Map, Set };
ctx.globalThis = ctx; vm.createContext(ctx);
const deepFiles = [];
for (let n = 6; n <= 15; n++) { const f = path.join(DIR, "js/d" + n + ".js"); if (fs.existsSync(f)) deepFiles.push(f); }
const files = ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/deep.js", "js/deep_texts.js", "js/deep_floor.js", "DEEP", "js/world.js", "js/mutants.js", "js/depths.js", "js/goods.js", "js/medic.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js", "js/chempuz.js", "js/annex_rooms.js", "js/annex_var.js", "js/annex_frag.js", "js/annex_gen.js", "js/fixtures_data.js", "js/annex_texts.js", "js/library_texts.js", "js/library.js", "js/annex.js", "js/garrison.js", "js/workshop.js", "js/repair.js", "js/implants.js", "js/arsenal.js", "js/chem.js", "js/kitchen.js", "js/floors.js"];
for (const f of files) {
  if (f === "DEEP") { deepFiles.forEach(p => vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: p })); continue; }
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;
if (LAB.deepLevelsN) LAB.deepLevelsN(); /* как main.js: после всех файлов (враги блоков — и из mutants.js) */
let fails = 0, floors = 0;
const t0 = Date.now();
function err(m) { fails++; if (fails <= 40) console.error("✗ " + m); }
function ok(c, m) { if (c) console.log("  ✓ " + m); else err(m); }
if (LAB.LEVELS_N <= 100) {
  console.log("Глубоких блоков ещё нет (LEVELS_N = " + LAB.LEVELS_N + "): проверять нечего.");
  process.exit(0);
}
console.log("Глубоких файлов: " + deepFiles.length + ", дно на уровне " + LAB.LEVELS_N + " (блок " + LAB.roman(LAB.blockOf(LAB.LEVELS_N)) + ")");
/* глубина растёт без скачков назад */
let prev = LAB.depth(100, 20), mono = true;
for (let L = 101; L <= LAB.LEVELS_N; L += Math.max(1, Math.floor((LAB.LEVELS_N - 100) / 3000))) for (const F of [1, 20]) { const d = LAB.depth(L, F); if (d < prev) mono = false; prev = d; }
ok(mono, "глубина растёт без скачков назад от сотого уровня до дна");
const seed = "deepT";
const T = LAB.T, W = LAB.W;
const UTIL_OK = (fl, ri) => ri === fl.secret || (() => { const t = fl.rooms[ri].type, def = LAB.ROOMS[t] || {}; return !!(def.util || { storage: 1, parts: 1, locker: 1, pumps: 1, switchboard: 1, workroom: 1, repair: 1, charging: 1, janitor: 1, boiler: 1, generator: 1, laundry: 1, archive: 1 }[t] || (LAB.floors.CONC && LAB.floors.CONC[t])); })();
function checkFloor(L, F, tag) {
  let fl;
  try { fl = LAB.getFloor(seed, L, F); } catch (e) { err(`${tag} ${L}-${F}: этаж не строится: ${e.message}`); return null; }
  floors++;
  const res = LAB.solve(fl, { tier: 999999 });
  if (!res.down) err(`${L}-${F}: выход вниз недостижим`);
  if (!res.elev) err(`${L}-${F}: лифт недостижим`);
  /* коридоры бетонные */
  for (let c = 0; c < fl.corrs.length; c++) if (LAB.floors.corr(fl, c) !== "concrete") { err(`${L}-${F}: коридор ${c} не бетонный`); break; }
  fl.objs.forEach(o => {
    if (o.type === "srez") {
      const R = LAB.blockRange(LAB.blockOf(L));
      if (!(o.to > L && o.to <= R.to - 2)) err(`${L}-${F}: срез ${o.id} ведёт на ${o.to} (блок ${R.from}–${R.to})`);
      if (!UTIL_OK(fl, o.room)) err(`${L}-${F}: срез не в тайной комнате и не в подсобке (${fl.rooms[o.room].type})`);
      if (o.need === "code" && !fl.items.some(it => it.note === "cutcode" && it.code === o.code)) err(`${L}-${F}: у среза с кодом нет записки с кодом`);
      if (o.need === "code" && fl.items.some(it => it.note === "cutcode" && fl.room[it.y * W + it.x] === o.room)) err(`${L}-${F}: записка с кодом среза — в той же комнате`);
    }
    if (o.type === "trialst" && !(LAB.ROOMS[fl.rooms[o.room].type] || {}).trial) err(`${L}-${F}: стенд испытания не в испытательной камере`);
  });
  fl.doors.forEach(d => { if (d.lock && d.lock.type === "rank" && !(LAB.ROOMS[fl.rooms[d.room].type] || {}).rank) err(`${L}-${F}: допуск на двери не той комнаты`); });
  /* замок допуска что-то значит: без статуса в комнату не войти (нет открытого проёма) */
  if (fl.rooms.some(r => r.rank)) {
    const r0 = LAB.solve(fl, { tier: 999999, gatepass: true, rank: 0 });
    fl.rooms.forEach((r, ri) => {
      if (!r.rank) return;
      let open = false;
      for (let y = r.y0; y <= r.y1 && !open; y++) for (let x = r.x0; x <= r.x1; x++) if (fl.room[y * W + x] === ri && r0.reach[y * W + x]) { open = true; break; }
      if (open) err(`${L}-${F}: дверь с допуском у «${r.type}», а в комнату можно войти и без допуска`);
      if (!r0.down || !r0.elev) err(`${L}-${F}: без допуска этаж не пройти`);
    });
  }
  /* хранилища по допуску: только шкафчики, ящики и столы, и в них нет нужного для прохода */
  fl.objs.forEach(o => {
    if (!o.rankLock) return;
    if (!{ locker: 1, crate: 1, desk: 1 }[o.type]) err(`${L}-${F}: по допуску заперто «${o.type}»`);
    if (!(LAB.ROOMS[fl.rooms[o.room].type] || {}).rank) err(`${L}-${F}: хранилище по допуску в комнате без допуска`);
    if ((o.loot || []).some(it => it.kind === "key" || it.kind === "pass" || it.kind === "gatepass" || it.kind === "elevpass" || it.rub || (it.kind === "note" && it.code))) err(`${L}-${F}: в хранилище по допуску — вещь, нужная для прохода`);
  });
  return fl;
}
/* прибытие и дно */
const f101 = LAB.getFloor(seed, 101, 1);
ok(f101.rooms.some(r => r.type === "riftin"), "на 101-м уровне прибытие — «Край Разлома»");
const f100 = LAB.getFloor(seed, 100, 20);
ok(f100.rooms.some(r => r.type === "source") && f100.objs.some(o => o.type === "reactor" && !o.final), "на сотом — настоящий Исток, и его пульт уже не финал");
const fBot = LAB.getFloor(seed, LAB.LEVELS_N, 20);
ok(fBot.rooms.some(r => r.type === "riftroot") && fBot.objs.some(o => o.type === "reactor" && o.final), "на самом дне — Ядро Разлома и финальный пульт");
ok(LAB.ROOMS.riftroot && LAB.ROOMS.riftroot.n === "Ядро Разлома", "помещение на дне называется «Ядро Разлома»");
/* пропуска глубин (LAB.TIERS[t] для t > 50, deep.js) — описания с именем: модули не перезаписывают LAB.deepTier */
ok([51, 52, Math.ceil(LAB.LEVELS_N / 2)].every(t => LAB.TIERS[t] && typeof LAB.TIERS[t].n === "string" && typeof LAB.TIERS[t].short === "string"), "пропуска глубин названы своими именами (" + (LAB.TIERS[51] && LAB.TIERS[51].n) + ")");
/* каждый готовый блок */
const stat = { srez: 0, trial: 0, dark: 0, rank: 0, boxes: 0, trader: 0 };
for (let n = LAB.DEEP_FIRST; n <= LAB.blockOf(LAB.LEVELS_N); n++) {
  const R = LAB.blockRange(n), D = LAB.DEEP[n];
  if (!D || !LAB.deepReady(n)) { err("блок " + n + " не готов, а дно ниже"); continue; }
  const picks = new Set([R.from, R.from + 4, R.to - 2, R.to]);
  for (let k = 0; picks.size < PER + 4 && k < 400; k++) picks.add(R.from + (LAB.hash32("pick" + n + ":" + k) >>> 0) % R.size);
  let bad = 0;
  [...picks].sort((a, b) => a - b).forEach(L => {
    const lv = LAB.LEVELS[L];
    if (!lv || !lv.name || !LAB.BOSSES[lv.boss]) { bad++; return; }
    for (const F of [1, 2 + (L % 9), 8 + (L % 7), 20]) {
      const fl = checkFloor(L, F, "блок " + n);
      if (!fl) continue;
      fl.objs.forEach(o => { if (o.type === "srez") stat.srez++; if (o.type === "trialst") stat.trial++; if (o.type === "dtrader") stat.trader++; });
      fl.rooms.forEach(r => { if (r.dark) stat.dark++; if (r.rank) stat.rank++; });
      fl.objs.forEach(o => { if (o.rankLock) stat.boxes++; });
    }
  });
  ok(!bad, `блок ${LAB.roman(n)} «${LAB.BLOCKS[n].name}»: уровни строятся по секторам (${picks.size} проверено)`);
  /* срезы: на двух уровнях блока, где они бывают, — каждый этаж со второго по девятнадцатый */
  let cuts = 0;
  for (const L of [R.from + 6, R.from + 7]) for (let F = 2; F <= 19; F++) { const fl = checkFloor(L, F, "блок " + n); if (fl) cuts += fl.objs.filter(o => o.type === "srez").length; }
  stat.srez += cuts;
  ok(cuts >= 1, `блок ${LAB.roman(n)}: срезы вниз есть (${cuts} на 36 этажах)`);
}
/* у каждой детали глубин есть применение не дальше четверти блока от глубины, где она попадается
   (как считает окно «Детали: где найти и для чего», workshop.js) */
const useless = [];
LAB.PARTS.forEach(k => {
  const pd = LAB.PART_DEPTH[k] || 1; if (pd <= 100) return;
  const R = LAB.blockRange(LAB.blockOf(pd)), ahead = Math.max(5, Math.round(R.size / 4));
  if (!LAB.RECIPES.some(rc => rc.need && rc.need[k] && !(rc.minL && rc.minL > pd + ahead))) useless.push(k);
});
ok(!useless.length, "у каждой детали глубин есть применение в её блоке" + (useless.length ? ": без пользы " + useless.join(", ") : ""));
/* (4.5, нелогичность) живая деталь, которую описание велит снимать с тварей, с них и падает: хозяева —
   твари секторов её блока (deep.js, DEEP_BIO_FROM), с чужих тварей и машин живая деталь не падает */
{
  const bad = [], T = LAB.DEEP_BIO_FROM || {};
  Object.keys(T).forEach(p => {
    const dL = LAB.PART_DEPTH[p], n = dL ? LAB.blockOf(dL) : 0, D = LAB.DEEP[n];
    if (!LAB.ITEMS[p] || !D || !/ bio /.test(" " + (LAB.PART_FROM[p] || "") + " ")) { bad.push(p + ": нет живой детали глубин"); return; }
    const sec = new Set([].concat(...D.sectors.map(s => s.foes || [])));
    T[p].forEach(t => { if (!LAB.FOES[t] || !sec.has(t)) bad.push(p + " ← " + t + ": нет такой твари в секторах блока"); else if (LAB.deepBioParts(t, LAB.blockRange(n).to).indexOf(p) < 0) bad.push(p + " с " + t + " не падает"); });
  });
  if (LAB.FOES.v7_mockbird && LAB.deepBioParts("v7_mockbird", LAB.blockRange(7).to).length) bad.push("с пересмешника падает живая деталь, хотя описания этого не говорят");
  ok(!bad.length && Object.keys(T).length >= 10, "живые детали глубин снимают с тех тварей, кого называет их описание (" + Object.keys(T).length + " деталей" + (bad.length ? "; " + bad.join("; ") : "") + ")");
}
console.log("  срезов " + stat.srez + ", стендов " + stat.trial + ", помещений вне надзора " + stat.dark + ", с допуском " + stat.rank + ", хранилищ по допуску " + stat.boxes + ", теневых торговцев " + stat.trader);
ok(stat.srez > 0, "срезы есть");
console.log(`Этажей: ${floors}, ${((Date.now() - t0) / 1000).toFixed(1)} с`);
if (fails) { console.log("ПРОВАЛЕНО: " + fails); process.exit(1); }
console.log("Все проверки пройдены.");
