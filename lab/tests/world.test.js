#!/usr/bin/env node
/* Проверка генератора комплекса: все уровни × 20 этажей строятся, каждый
   этаж проходим от прибытия до выхода вниз, лифт в начальной зоне, пропуска
   уровней доступа и пропуск лифта лежат там, где нужны; шлюзовая ключ-карта
   добывается на последнем этаже (у стража или спрятана), шлюз наверх на
   первом этаже запечатан; у роботов модификации растут с глубиной.
   Коридоры — прямые, в четыре шага шириной и от десяти в длину; у тайной
   комнаты — два потайных выхода в разные коридоры; на первом этаже уровня
   и на каждом третьем — мастерская с верстаком недалеко от прибытия, без
   замков на пути и без охраны внутри; если на этаже есть турели — есть и
   терминал безопасности, а у звукового замка — радиоприёмник с мелодией.
   Запуск: node lab/tests/world.test.js [число зёрен] [шаг по уровням] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/annex_rooms.js", "js/annex_var.js", "js/annex_frag.js", "js/annex_gen.js", "js/fixtures_data.js", "js/annex.js", "js/garrison.js", "js/workshop.js", "js/repair.js", "js/implants.js", "js/arsenal.js"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;

const seeds = Number(process.argv[2] || 6);
const stepL = Math.max(1, Number(process.argv[3] || 1));
let fails = 0, floors = 0, t0 = Date.now();
const stat = { locks: {}, foes: 0, items: 0, secrets: 0, blocked: 0, npcs: 0, objs: {}, armor: 0, aff: {}, affByL: {}, mechByL: {}, iqByL: {}, turrets: 0, cams: 0, corrMin: 99, corrMax: 0 };
function err(m) { console.error("✗ " + m); fails++; }
for (let si = 0; si < seeds; si++) {
  const seed = "test" + si;
  let tier = 0, elevpass = {};
  for (let L = 1; L <= LAB.LEVELS_N; L++) {
    /* при шаге по уровням проверяются первый, десятый, последний и каждый stepL-й */
    const full = stepL === 1 || L === 1 || L === 10 || L === LAB.LEVELS_N || L % stepL === 0;
    for (let F = 1; F <= LAB.FLOORS_N; F++) {
      if (!full) { if (F === 1) tier = Math.max(tier, LAB.LEVELS[L].tier); continue; }
      floors++;
      let fl;
      try { fl = LAB.getFloor(seed, L, F); }
      catch (e) { err(`${seed} ${L}-${F}: ${e.message}`); continue; }
      const res = LAB.solve(fl, { tier });
      const at = `${seed} ${L}-${F}`;
      if (!res.down) err(`${at}: выход вниз недостижим`);
      if (!res.elev) err(`${at}: лифт недостижим`);
      if (res.elevpass) elevpass[L] = true;
      if (fl.downBlocked && !elevpass[L]) err(`${at}: лестница завалена, а пропуска лифта уровня ${L} ещё нет`);
      tier = Math.max(tier, res.tier);
      if (tier < LAB.LEVELS[L].tier) err(`${at}: уровень доступа ${tier} ниже уровня ${LAB.LEVELS[L].tier}`);
      if (F === LAB.FLOORS_N && !res.gatepass) err(`${at}: шлюзовую ключ-карту не добыть`);
      if (F === LAB.FLOORS_N) {
        const boss = fl.foes.find(f => f.boss);
        const reactor = LAB.isReactorLevel(L);
        if (!boss) err(`${at}: нет стража`);
        if (reactor) {
          if (!fl.objs.some(o => o.type === "reactor")) err(`${at}: нет пульта «Истока»`);
          if (boss && !(boss.carry || []).some(i => i.kind === "gatepass" && i.core)) err(`${at}: у стража нет ключа «Истока»`);
        } else {
          const bossCard = boss && (boss.carry || []).some(i => i.kind === "gatepass");
          const hidden = LAB.LEVELS[L].card === "hidden";
          if (boss && hidden === bossCard) err(`${at}: ключ-карта ${hidden ? "должна быть спрятана" : "должна быть у стража"}`);
        }
      }
      if (F === 1 && L > 1 && !fl.objs.some(o => o.type === "gate_sealed")) err(`${at}: нет запечатанного шлюза наверх`);
      /* (2.0) охрана этажа — с самого первого этажа: патрули в коридорах, машины в кабинетах */
      const gar = fl.garrison || { patrols: 0, robots: 0, sappers: 0 };
      if (gar.patrols < 1) err(`${at}: в коридорах нет патрулей`);
      if (gar.robots < 1) err(`${at}: кабинеты без охраны`);
      if (fl.foes.some(f => f.beat && (!f.beat.length || f.beat.some(p => fl.t[p[1] * LAB.W + p[0]] === LAB.T.WALL)))) err(`${at}: участок обхода патруля задевает стену`);
      stat.patrols = (stat.patrols || 0) + gar.patrols; stat.guards = (stat.guards || 0) + gar.robots; stat.sappers = (stat.sappers || 0) + gar.sappers;
      /* (2.0) головоломки: вид известен, ступень — 0, 1 или 2 */
      for (const o of fl.objs) if (o.type === "puzzle" && (!LAB.puzzles.has(o.kind) && ["sort", "relays", "bulls", "riddle"].indexOf(o.kind) < 0 || [0, 1, 2].indexOf(o.diff) < 0)) err(`${at}: стенд с неизвестной задачей ${o.kind}/${o.diff}`);
      for (const d of fl.doors) if (d.lock && d.lock.type === "logic" && (!LAB.puzzles.has(d.lock.kind) || [0, 1, 2].indexOf(d.lock.diff) < 0)) err(`${at}: логический замок с неизвестной задачей ${d.lock.kind}/${d.lock.diff}`);
      stat.pz = (stat.pz || 0) + fl.objs.filter(o => o.type === "puzzle").length;
      /* коридоры: прямые, ширина 4, длина от 10 */
      for (const c of fl.corrs) {
        const wdt = c.axis === "h" ? c.y1 - c.y0 + 1 : c.x1 - c.x0 + 1;
        if (wdt !== LAB.CORR_W) err(`${at}: коридор ${c.id} шириной ${wdt}`);
        if (c.len < 10) err(`${at}: коридор ${c.id} длиной ${c.len}`);
        stat.corrMin = Math.min(stat.corrMin, c.len); stat.corrMax = Math.max(stat.corrMax, c.len);
      }
      /* тайная комната — два потайных выхода в разные помещения */
      if (fl.secret >= 0) {
        const sd = fl.doors.filter(d => d.lock && d.lock.type === "secret" && d.other === fl.secret);
        if (sd.length !== 2) err(`${at}: у тайной комнаты выходов ${sd.length}`);
        else if (sd[0].room === sd[1].room) err(`${at}: оба выхода тайной комнаты — в одно помещение`);
        stat.secrets++;
      }
      /* (2.0) мастерская — на первом этаже уровня и на каждом третьем: верстак в
         мастерской, путь от прибытия без замков, охраны внутри нет */
      const nearReach = (o) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => res.reach[(o.y + d[1]) * LAB.W + o.x + d[0]]);
      if (LAB.shopFloor(F)) {
        const wb = fl.shop && fl.objs.find(o => o.id === fl.shop);
        if (!wb) err(`${at}: нет мастерской`);
        else {
          const rm = fl.rooms[wb.room];
          /* мастерская — своё помещение; если в начальной зоне свободных нет — при лифтовом холле или у прибытия */
          if (!rm || !rm.shop || (rm.type !== "workshop" && wb.room !== fl.E && wb.room !== fl.U)) err(`${at}: верстак мастерской не в мастерской (${rm && rm.type})`);
          if (rm && rm.type !== "workshop") stat.shopLift = (stat.shopLift || 0) + 1;
          if (fl.foes.some(f => f.room === wb.room && !f.ally)) err(`${at}: в мастерской охрана`);
          /* путь без замков: только открытые двери */
          const arr = fl.objs.find(o => o.type === "stairs_up" || o.type === "gate_sealed" || o.type === "wake");
          const dist = new Int32Array(LAB.W * LAB.H).fill(-1), q = [arr.y * LAB.W + arr.x]; dist[q[0]] = 0;
          for (let i = 0; i < q.length; i++) { const c = q[i], x = c % LAB.W, y = (c / LAB.W) | 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (y + dy) * LAB.W + x + dx, t = fl.t[n];
              if (dist[n] >= 0 || t === LAB.T.WALL || (t === LAB.T.DOOR && fl.doorAt[n].lock)) continue; dist[n] = dist[c] + 1; q.push(n); } }
          let dmin = -1; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = dist[(wb.y + dy) * LAB.W + wb.x + dx]; if (v >= 0 && (dmin < 0 || v < dmin)) dmin = v; }
          if (dmin < 0) err(`${at}: до мастерской не дойти без ключей`);
          else { stat.shopN = (stat.shopN || 0) + 1; stat.shopD = (stat.shopD || 0) + dmin; stat.shopMax = Math.max(stat.shopMax || 0, dmin); }
        }
      }
      /* турели — значит, есть терминал безопасности, до которого можно дойти.
         Поведение — как в бою (combat.js): у стража своё, даже если его
         основа — турель (Метроном «Сначала» терминалом не отключается). */
      const behOf = (f) => { const bd = f.boss && LAB.BOSSES[f.boss]; return bd && bd.beh ? bd.beh : LAB.FOES[f.type].beh; };
      const tur = fl.foes.filter(f => behOf(f).indexOf("turret") >= 0);
      stat.turrets += tur.length;
      stat.cams += fl.foes.filter(f => behOf(f).indexOf("camera") >= 0).length;
      if (tur.length && !fl.objs.some(o => o.type === "terminal" && o.sub === "sec" && nearReach(o))) err(`${at}: турели есть, а терминала безопасности не достать`);
      /* звуковой замок — радиоприёмник с мелодией */
      for (const d of fl.doors) {
        if (!d.lock) continue;
        stat.locks[d.lock.type] = (stat.locks[d.lock.type] || 0) + 1;
        if (d.lock.type === "key") {
          const has = fl.items.some(i => i.kind === "key" && i.key === d.lock.key) || fl.foes.some(f => (f.carry || []).some(i => i.kind === "key" && i.key === d.lock.key));
          if (!has) err(`${at}: нет ключа ${d.lock.key}`);
        }
        if (d.lock.type === "melody" && !fl.objs.some(o => o.type === "radio" && o.melodyFor === d.id)) err(`${at}: у звукового замка нет радиоприёмника`);
      }
      for (const f of fl.foes) {
        if (!(f.iq >= 0)) err(`${at}: у врага ${f.type} нет ума`);
        if (LAB.FOES[f.type].kind === "mech") {
          stat.mechByL[L] = (stat.mechByL[L] || 0) + 1;
          stat.iqByL[L] = (stat.iqByL[L] || 0) + f.iq;
          if (f.aff) { stat.affByL[L] = (stat.affByL[L] || 0) + 1; f.aff.forEach(a => stat.aff[a] = (stat.aff[a] || 0) + 1); }
        }
      }
      stat.armor += fl.items.filter(i => i.kind === "armor").length;
      if (fl.downBlocked) stat.blocked++;
      stat.foes += fl.foes.length; stat.items += fl.items.length; stat.npcs += fl.npcs.length;
      for (const o of fl.objs) stat.objs[o.type] = (stat.objs[o.type] || 0) + 1;
      /* установки глубин: до каждой можно дойти; пресс — поперёк коридора */
      for (const o of fl.objs) if (["powergrid", "incubator", "mirrorterm", "syncgate", "ancient"].indexOf(o.type) >= 0 && !nearReach(o)) err(`${at}: до установки «${o.type}» не дойти`);
      for (const h of (fl.hazards || [])) { stat.press = (stat.press || 0) + 1; if (!h.cells.every(c => fl.t[c[1] * LAB.W + c[0]] === LAB.T.CORR)) err(`${at}: пресс не на клетках коридора`); }
      if (!fl.items.some(i => i.kind === "sample")) err(`${at}: нет образца`);
    }
    LAB.clearFloorCache();
  }
}
const ms = Date.now() - t0;
console.log(`уровней: ${LAB.LEVELS_N}, этажей: ${floors}, ошибок: ${fails}, время: ${ms} мс (${(ms / floors).toFixed(1)} мс на этаж)`);
console.log("замки:", JSON.stringify(stat.locks));
console.log(`охрана на этаж: патрулей ${((stat.patrols || 0) / floors).toFixed(1)}, машин в кабинетах ${((stat.guards || 0) / floors).toFixed(1)}, сапёров ${((stat.sappers || 0) / floors).toFixed(2)}; стендов с задачами ${((stat.pz || 0) / floors).toFixed(2)}`);
console.log(`мастерских: ${stat.shopN || 0} (при лифтовом холле или у прибытия: ${stat.shopLift || 0}), путь от прибытия в среднем ${stat.shopN ? Math.round(stat.shopD / stat.shopN) : 0}, самый длинный ${stat.shopMax || 0} шагов`);
console.log(`на этаж: врагов ${(stat.foes / floors).toFixed(1)}, турелей ${(stat.turrets / floors).toFixed(2)}, камер ${(stat.cams / floors).toFixed(2)}, вещей ${(stat.items / floors).toFixed(1)}, выживших ${(stat.npcs / floors).toFixed(2)}, тайных комнат ${(stat.secrets / floors).toFixed(2)}, заваленных лестниц ${stat.blocked}; коридоры от ${stat.corrMin} до ${stat.corrMax} шагов`);
console.log("обстановка:", JSON.stringify(stat.objs));
console.log("прессов «Подножия»:", stat.press || 0);
console.log(`броня на полу: ${(stat.armor / floors).toFixed(2)} на этаж; модификации роботов:`, JSON.stringify(stat.aff));
console.log("роботы по уровням (доля с модификациями, средний ум):", Object.keys(stat.mechByL).map(L => `${L}: ${(100 * (stat.affByL[L] || 0) / stat.mechByL[L]).toFixed(0)}%, ${(stat.iqByL[L] / stat.mechByL[L]).toFixed(1)}`).join("; "));
process.exit(fails ? 1 : 0);
