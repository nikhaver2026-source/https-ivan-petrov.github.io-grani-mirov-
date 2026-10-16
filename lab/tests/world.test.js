#!/usr/bin/env node
/* Проверка генератора комплекса: все 10 уровней × 20 этажей строятся,
   каждый этаж проходим от прибытия до выхода вниз, лифт в начальной зоне,
   пропуска уровней доступа и пропуск лифта лежат там, где нужны; шлюзовая
   ключ-карта добывается на двадцатом этаже (у стража или спрятана), шлюз
   наверх на первом этаже запечатан; у роботов модификации растут с глубиной.
   Запуск: node lab/tests/world.test.js [число зёрен] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int32Array, Error };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/world.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
const LAB = ctx.LAB;

const seeds = Number(process.argv[2] || 6);
let fails = 0, floors = 0, t0 = Date.now();
const stat = { locks: {}, foes: 0, items: 0, secrets: 0, blocked: 0, npcs: 0, objs: {}, armor: 0, aff: {}, affByL: {}, mechByL: {}, iqByL: {} };
for (let si = 0; si < seeds; si++) {
  const seed = "test" + si;
  let tier = 0, elevpass = {};
  for (let L = 1; L <= LAB.LEVELS_N; L++) {
    for (let F = 1; F <= LAB.FLOORS_N; F++) {
      floors++;
      let fl;
      try { fl = LAB.getFloor(seed, L, F); }
      catch (e) { console.error(`✗ ${seed} ${L}-${F}: ${e.message}`); fails++; continue; }
      const res = LAB.solve(fl, { tier });
      if (!res.down) { console.error(`✗ ${seed} ${L}-${F}: выход вниз недостижим`); fails++; }
      if (!res.elev) { console.error(`✗ ${seed} ${L}-${F}: лифт недостижим`); fails++; }
      if (res.elevpass) elevpass[L] = true;
      if (fl.downBlocked && !elevpass[L]) { console.error(`✗ ${seed} ${L}-${F}: лестница завалена, а пропуска лифта уровня ${L} ещё нет`); fails++; }
      tier = Math.max(tier, res.tier);
      if (tier < LAB.LEVELS[L].tier) { console.error(`✗ ${seed} ${L}-${F}: уровень доступа ${tier} ниже уровня ${LAB.LEVELS[L].tier}`); fails++; }
      if (F === LAB.FLOORS_N && !res.gatepass) { console.error(`✗ ${seed} ${L}-${F}: шлюзовую ключ-карту не добыть`); fails++; }
      if (F === LAB.FLOORS_N && L < LAB.LEVELS_N) {
        const boss = fl.foes.find(f => f.boss);
        const bossCard = boss && (boss.carry || []).some(i => i.kind === "gatepass");
        const hidden = LAB.LEVELS[L].card === "hidden";
        if (!boss) { console.error(`✗ ${seed} ${L}-${F}: нет стража`); fails++; }
        else if (hidden === bossCard) { console.error(`✗ ${seed} ${L}-${F}: ключ-карта ${hidden ? "должна быть спрятана" : "должна быть у стража"}`); fails++; }
      }
      if (F === 1 && L > 1) {
        if (!fl.objs.some(o => o.type === "gate_sealed")) { console.error(`✗ ${seed} ${L}-${F}: нет запечатанного шлюза наверх`); fails++; }
      }
      if (fl.objs.some(o => o.type === "gate_up")) { console.error(`✗ ${seed} ${L}-${F}: остался шлюз наверх`); fails++; }
      for (const f of fl.foes) {
        if (!(f.iq >= 0)) { console.error(`✗ ${seed} ${L}-${F}: у врага ${f.type} нет ума`); fails++; }
        if (LAB.FOES[f.type].kind === "mech") {
          stat.mechByL[L] = (stat.mechByL[L] || 0) + 1;
          stat.iqByL[L] = (stat.iqByL[L] || 0) + f.iq;
          if (f.aff) { stat.affByL[L] = (stat.affByL[L] || 0) + 1; f.aff.forEach(a => stat.aff[a] = (stat.aff[a] || 0) + 1); }
        }
      }
      stat.armor += fl.items.filter(i => i.kind === "armor").length;
      /* у каждой двери с ключом — ключ на этаже */
      for (const d of fl.doors) {
        if (!d.lock) continue;
        stat.locks[d.lock.type] = (stat.locks[d.lock.type] || 0) + 1;
        if (d.lock.type === "key") {
          const has = fl.items.some(i => i.kind === "key" && i.key === d.lock.key) || fl.foes.some(f => (f.carry || []).some(i => i.kind === "key" && i.key === d.lock.key));
          if (!has) { console.error(`✗ ${seed} ${L}-${F}: нет ключа ${d.lock.key}`); fails++; }
        }
      }
      if (fl.secret >= 0) stat.secrets++;
      if (fl.downBlocked) stat.blocked++;
      stat.foes += fl.foes.length; stat.items += fl.items.length; stat.npcs += fl.npcs.length;
      for (const o of fl.objs) stat.objs[o.type] = (stat.objs[o.type] || 0) + 1;
      /* образец этажа есть */
      const sample = fl.items.some(i => i.kind === "sample");
      if (!sample) { console.error(`✗ ${seed} ${L}-${F}: нет образца`); fails++; }
    }
  }
  LAB.clearFloorCache();
}
const ms = Date.now() - t0;
console.log(`этажей: ${floors}, ошибок: ${fails}, время: ${ms} мс (${(ms / floors).toFixed(1)} мс на этаж)`);
console.log("замки:", JSON.stringify(stat.locks));
console.log(`на этаж: врагов ${(stat.foes / floors).toFixed(1)}, вещей ${(stat.items / floors).toFixed(1)}, выживших ${(stat.npcs / floors).toFixed(2)}, тайных комнат ${(stat.secrets / floors).toFixed(2)}, заваленных лестниц ${stat.blocked}`);
console.log("обстановка:", JSON.stringify(stat.objs));
console.log(`броня на полу: ${(stat.armor / floors).toFixed(2)} на этаж; модификации роботов:`, JSON.stringify(stat.aff));
console.log("роботы по уровням (доля с модификациями, средний ум):", Object.keys(stat.mechByL).map(L => `${L}: ${(100 * (stat.affByL[L] || 0) / stat.mechByL[L]).toFixed(0)}%, ${(stat.iqByL[L] / stat.mechByL[L]).toFixed(1)}`).join("; "));
process.exit(fails ? 1 : 0);
