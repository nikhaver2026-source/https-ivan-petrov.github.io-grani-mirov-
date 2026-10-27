#!/usr/bin/env node
/* Проверка генератора комплекса: все уровни × 20 этажей строятся, каждый
   этаж проходим от прибытия до выхода вниз, лифт в начальной зоне, пропуска
   уровней доступа и пропуск лифта лежат там, где нужны; шлюзовая ключ-карта
   добывается на последнем этаже (у стража или спрятана), шлюз наверх на
   первом этаже запечатан; у роботов модификации растут с глубиной.
   Коридоры — прямые, в четыре шага шириной (3.2: с третьего блока — пять,
   шесть и семь, а помещения, кабинеты и обстановка — больше) и от десяти в длину; у тайной
   комнаты — два потайных выхода в разные коридоры; на первом этаже уровня
   и на каждом третьем — мастерская с верстаком недалеко от прибытия, без
   замков на пути и без охраны внутри; если на этаже есть турели — есть и
   терминал безопасности, а у звукового замка — радиоприёмник с мелодией.
   (3.0) На этаже с заваленной лестницей вниз лежит гидравлический домкрат
   или подрывной заряд — там, куда можно дойти, не открывая лишних замков,
   не в тайной комнате и не у самой лестницы.
   Запуск: node lab/tests/world.test.js [число зёрен] [шаг по уровням] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/mutants.js", "js/depths.js", "js/goods.js", "js/medic.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/annex_rooms.js", "js/annex_var.js", "js/annex_frag.js", "js/annex_gen.js", "js/fixtures_data.js", "js/annex.js", "js/garrison.js", "js/workshop.js", "js/repair.js", "js/implants.js", "js/arsenal.js", "js/chem.js", "js/kitchen.js", "js/floors.js"]) {
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
      /* (3.0) лифт возит только туда, где вы уже были: завал разбирают на месте — домкрат или заряд на этом же этаже */
      if (fl.downBlocked) {
        const kits = fl.items.filter(it => it.rub);
        if (kits.length !== 1 || ["rub_jack", "c_blast"].indexOf(kits[0].item) < 0) err(`${at}: лестница завалена, а домкрата или заряда на этаже нет (${kits.map(k => k.item).join(", ")})`);
        else {
          const kr = fl.room[kits[0].y * LAB.W + kits[0].x];
          if (!res.rubbleKit) err(`${at}: домкрат или заряд для завала недостижим`);
          if (kr === fl.secret) err(`${at}: домкрат или заряд — в тайной комнате`);
          if (fl.objs.some(o => o.type === "stairs_down" && fl.room[o.y * LAB.W + o.x] === kr) && fl.rooms.filter(rm => rm && !rm.hidden).length > 3) err(`${at}: домкрат или заряд — у самой лестницы`);
          stat.kits = stat.kits || {}; stat.kits[kits[0].item] = (stat.kits[kits[0].item] || 0) + 1;
        }
      } else if (fl.items.some(it => it.rub)) err(`${at}: домкрат или заряд для завала там, где завала нет`);
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
      /* коридоры: прямые, ширина 4 (3.2: с третьего блока — шире, GROW.cw), длина от 10 */
      const gw = LAB.floorGrow(L), cwWant = gw ? gw.cw : LAB.CORR_W;
      for (const c of fl.corrs) {
        const wdt = c.axis === "h" ? c.y1 - c.y0 + 1 : c.x1 - c.x0 + 1;
        if (wdt !== cwWant || LAB.corrW(c) !== wdt) err(`${at}: коридор ${c.id} шириной ${wdt} (ждали ${cwWant})`);
        if (c.len < 10) err(`${at}: коридор ${c.id} длиной ${c.len}`);
        /* проход в помещение — посередине полосы, в общем отрезке обоих помещений; у дверного конца — дверь в стене */
        if (c.mouth.length !== (gw ? 3 : 2) && !(gw && c.mouth.length === 2)) err(`${at}: у коридора ${c.id} проход в ${c.mouth.length} клетки`);
        stat.corrMin = Math.min(stat.corrMin, c.len); stat.corrMax = Math.max(stat.corrMax, c.len);
        const sw = stat.cwBy || (stat.cwBy = {}); sw[wdt] = (sw[wdt] || 0) + 1;
      }
      /* (3.2) чем ниже блок, тем просторнее: помещения, кабинеты и вещи обстановки */
      {
        const blk = L <= 10 ? 0 : Math.min(5, LAB.blockOf(L)), sz = stat.sz || (stat.sz = {});
        const z = sz[blk] || (sz[blk] = { n: 0, main: 0, mainA: 0, ann: 0, annA: 0, fx: 0, maxSide: 0, minSide: 99 });
        z.n++;
        fl.rooms.forEach(rm => {
          if (!rm) return;
          const w = rm.x1 - rm.x0 + 1, h = rm.y1 - rm.y0 + 1;
          if (rm.annex) { z.ann++; z.annA += w * h; return; }
          z.main++; z.mainA += w * h;
          if (rm.type !== "secret" && rm.type !== "gate" && rm.type !== "reactor") { z.maxSide = Math.max(z.maxSide, w, h); z.minSide = Math.min(z.minSide, w, h); }
          if (gw && rm.type !== "secret" && rm.type !== "gate" && rm.type !== "reactor" && (Math.max(w, h) > gw.room[1] || Math.min(w, h) < Math.min(gw.room[0], gw.sp[0]))) err(`${at}: помещение ${rm.id} ${w}×${h} вне ${gw.room.join("–")}`);
        });
        z.fx += fl.objs.filter(o => o.type === "fx").length;
        if (gw) {
          const deep = fl.objs.filter(o => o.type === "fx" && ["mirrorwall", "glasschime", "backclock", "twinchairs", "prism", "mirrorlog", "punchclock", "gearwall", "perfocards", "boiler", "sealer", "spring", "berrybush", "nest", "rootbench", "sprout", "warmstone"].indexOf(o.fx) >= 0);
          stat.deepFx = (stat.deepFx || 0) + deep.length;
          deep.forEach(o => { if (!LAB.FIX.T[o.fx]) err(`${at}: вещь ${o.fx} без описания`); });
        }
      }
      /* (3.0) полы (floors.js): лестничная клетка и тайный ход — бетон; помещения — дерево, бетон или
         металл уровня; ответ одинаков при повторной постройке этажа */
      if (LAB.floors) {
        const blk = L <= 10 ? 0 : Math.min(5, LAB.blockOf(L)), P = LAB.floors;
        const s3 = stat.fl3 || (stat.fl3 = { corr: [0, 0, 0, 0, 0, 0], conc: [0, 0, 0, 0, 0, 0], rooms: 0, wood: 0, rconc: 0, types: {} });
        const cs = fl.corrs.map((c, ci) => P.corr(fl, ci)), rs = fl.rooms.map((rm, ri) => rm ? P.room(fl, ri) : null);
        cs.forEach(v => { s3.corr[blk]++; if (v === "concrete") s3.conc[blk]++; else if (v !== null) err(`${at}: коридор с полом «${v}»`); });
        fl.rooms.forEach((rm, ri) => { if (!rm) return; s3.rooms++; if (rs[ri] === "wood") { s3.wood++; s3.types[rm.type] = 1; } else if (rs[ri] === "concrete") s3.rconc++; });
        [fl.U, fl.D].forEach(ri => { const rm = fl.rooms[ri]; if (rm && rm.type === "stair" && rs[ri] !== "concrete") err(`${at}: лестничная клетка не бетонная`); });
        fl.corrs.forEach((c, ci) => { const d = fl.doors.find(x => x.id === c.door); if (d && d.lock && d.lock.type === "secret" && cs[ci] !== "concrete") err(`${at}: тайный ход ${ci} не бетонный`); });
        const probe = fl.corrs.length ? fl.corrs[0] : null;
        if (probe && P.at(fl, probe.x0, probe.y0) !== cs[0]) err(`${at}: пол клетки коридора не совпадает с полом коридора`);
        if (F === 7) {
          LAB.clearFloorCache();
          const fl2 = LAB.getFloor(seed, L, F);
          if (fl2.corrs.some((c, ci) => P.corr(fl2, ci) !== cs[ci]) || fl2.rooms.some((rm, ri) => rm && P.room(fl2, ri) !== rs[ri])) err(`${at}: полы при повторной постройке этажа другие`);
        }
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
      /* (2.0) стартовый набор у капсулы пробуждения: (2.2) десять аптечек и десять
         энергобатарей в двух шагах от неё (или хотя бы в её помещении); бластера и
         брони на полу нет */
      if (L === 1 && F === 1) {
        const cap = fl.objs.find(o => o.type === "wake");
        const at2 = i => cap && (Math.max(Math.abs(i.x - cap.x), Math.abs(i.y - cap.y)) <= 2 || fl.room[i.y * LAB.W + i.x] === cap.room);
        const sumN = a => a.reduce((t, i) => t + (i.n || 1), 0);
        const med = sumN(fl.items.filter(i => at2(i) && i.kind === "item" && i.item === "medkit_s"));
        const bat = sumN(fl.items.filter(i => at2(i) && i.kind === "ammo" && i.ammo === "energy"));
        if (!cap || med < 10 || bat < 10) err(`${at}: у капсулы аптечек ${med}, энергобатарей ${bat}`);
        if (fl.items.some(i => (i.w && i.w.id === "w_start_spark") || (i.a && i.a.id === "a_start_suit"))) err(`${at}: стартовый бластер или комбинезон лежит на полу`);
        stat.kitNear = (stat.kitNear || 0) + fl.items.filter(i => cap && Math.max(Math.abs(i.x - cap.x), Math.abs(i.y - cap.y)) <= 2 && ((i.kind === "item" && i.item === "medkit_s") || (i.kind === "ammo" && i.ammo === "energy"))).length;
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
      /* (2.5) хранилища пусты лишь изредка */
      for (const o of fl.objs) if (o.type !== "safe" && (LAB.CONTAINERS || []).indexOf(o.type) >= 0 && o.loot) { stat.box = (stat.box || 0) + 1; if (!o.loot.length) stat.boxEmpty = (stat.boxEmpty || 0) + 1; }
      /* (2.5) отряды тварей: один вожак на отряд, все — в одном помещении, не у капсулы, не в мастерской */
      if (LAB.mutants) {
        const packs = {};
        for (const f of fl.foes) if (f.pack) (packs[f.pack] = packs[f.pack] || []).push(f);
        const calmR = {};
        for (const o of fl.objs) if (/^(wake|capsule|workbench)$/.test(o.type)) calmR[o.room] = 1;
        for (const id in packs) {
          const m = packs[id];
          stat.packs = (stat.packs || 0) + 1; stat.packFoes = (stat.packFoes || 0) + m.length;
          if (m.filter(f => f.lead).length > 1) err(`${at}: в отряде ${id} больше одного вожака`);
          if (m.some(f => f.room !== m[0].room)) err(`${at}: отряд ${id} разбросан по помещениям`);
          if (calmR[m[0].room]) err(`${at}: отряд ${id} стоит у капсулы или в мастерской`);
        }
        for (const f of fl.foes) { const b = LAB.FOES[f.type]; if (b && b.kind === "bio") { stat.bio = (stat.bio || 0) + 1; const st = f.evo != null ? f.evo : LAB.mutants.stage0(b, LAB.depth(L, F), f.id, 0); stat.evo = stat.evo || [0, 0, 0, 0]; stat.evo[st]++; } }
      }
      /* (2.6) лечение и снабжение (medic.js): аптечный автомат у капсул, энергобатареи
         у капсулы прибытия, лечебные припасы в каждой второй комнате, целители */
      if (LAB.medic) {
        const md = stat.med26 = stat.med26 || { capRooms: 0, vend: 0, piles: 0, pileN: {}, pileB: {}, pileBN: {}, healers: {}, arrBat: 0, floors: 0 };
        md.floors++;
        const capR = {};
        for (const o of fl.objs) if ((o.type === "capsule" || o.type === "wake") && o.room >= 0) capR[o.room] = 1;
        for (const rid in capR) { md.capRooms++; if (fl.objs.some(o => o.type === "medvend" && o.room === +rid)) md.vend++; }
        if (fl.objs.some(o => o.type === "medvend" && !capR[o.room])) err(`${at}: аптечный автомат не у капсулы`);
        /* в помещении с капсулой — только аптечные автоматы: прочие торговые точки переходят в соседние помещения */
        const shopIn = fl.objs.filter(o => capR[o.room] && ["vending", "coffee", "snacks", "drinks"].indexOf(o.type) >= 0).map(o => o.type)
          .concat(fl.npcs.filter(n => capR[n.room] && (n.robot ? (LAB.ROBOT_NPC[n.type] || {}).trade === "ammo" : !!(LAB.PROFS[n.prof] || {}).trade)).map(n => "торговец"));
        if (shopIn.length) err(`${at}: в помещении с капсулой — другая торговая точка: ${shopIn.join(", ")}`);
        for (const o of fl.objs) if (fl.objAt[o.y * LAB.W + o.x] !== o) err(`${at}: предмет обстановки ${o.type} не на своей клетке`);
        const bat = fl.items.filter(i => i.cap26);
        if (!(L === 1 && F === 1)) {
          const capU = fl.objs.find(o => o.type === "capsule" && o.room === fl.U);
          if (capU && !bat.some(i => i.kind === "ammo" && i.ammo === "energy" && Math.max(Math.abs(i.x - capU.x), Math.abs(i.y - capU.y)) <= 2)) err(`${at}: у капсулы прибытия нет энергобатарей`);
          if (bat.length) md.arrBat++;
        } else if (bat.length) err(`${at}: на первом этаже — лишние батареи у капсулы (там свой набор)`);
        const B = LAB.blockOf(L);
        for (const it of fl.items) {
          if (!it.med26) continue;
          const d = LAB.ITEMS[it.item];
          if (!d || d.kind !== "use" || !(d.heal > 0)) { err(`${at}: лечебный припас ${it.item} — не лекарство`); continue; }
          if ((d.depth || 1) > L) err(`${at}: ${it.item} лежит выше своей глубины (${d.depth})`);
          if (!(it.n0 >= 1 && it.n0 <= 7)) err(`${at}: в комнате ${it.n0} шт. ${it.item}`);
          if (fl.t[it.y * LAB.W + it.x] !== LAB.T.ROOM) err(`${at}: припас ${it.item} не в комнате`);
          if (capR[fl.room[it.y * LAB.W + it.x]]) err(`${at}: припас ${it.item} в помещении с капсулой`);
          md.piles++; md.pileN[it.n0] = (md.pileN[it.n0] || 0) + 1;
          md.pileB[B] = (md.pileB[B] || 0) + it.n0; md.pileBN[B] = (md.pileBN[B] || 0) + 1;
        }
        for (const n of fl.npcs) {
          if (!n.heal) continue;
          const P = LAB.medic.HEALERS[n.heal];
          if (!P) { err(`${at}: целитель неизвестного вида ${n.heal}`); continue; }
          if (n.robot ? !LAB.ROBOT_NPC[n.type] : !LAB.PROFS[n.prof]) err(`${at}: целитель ${n.heal} без описания`);
          if (fl.t[n.y * LAB.W + n.x] !== LAB.T.ROOM) err(`${at}: целитель ${n.heal} стоит не в комнате`);
          md.healers[n.heal] = (md.healers[n.heal] || 0) + 1;
        }
      }
    }
    LAB.clearFloorCache();
  }
}
/* (3.2) Этажи «Ковчега», «Подножия» и «Колыбели» не меняются: их состояние лежит в
   сохранениях (game.js, WORLD_V). Отпечаток — клетки, помещения, вещи, предметы и
   враги этажа. Изменили этажи выше 41-го уровня нарочно — поднимите WORLD_V и
   обновите отпечатки; ненарочно — верните прежний поток случайностей генератора. */
{
  const crypto = require("crypto");
  /* (3.3) пятый выпуск мира (WORLD_V 5): тела погибших в помещениях (annex.js) и выжившие
     чаще (world.js, шаги 17 и 26) — отпечатки новые */
  const FP = { "fpA 1-1": "f03f88aae83208ea", "fpA 10-13": "bf00c1ba63cf5a44", "fpB 20-20": "3a4f6336c26921ce", "fpB 21-7": "e4cfc44a5ab3b83e", "fpC 30-2": "a469748a1ae62721", "fpC 40-13": "b3cd37805c459756" };
  for (const k in FP) {
    const m = k.match(/^(\S+) (\d+)-(\d+)$/), fl = LAB.getFloor(m[1], +m[2], +m[3]), h = crypto.createHash("sha1");
    h.update(Buffer.from(fl.t.buffer)); h.update(Buffer.from(fl.room.buffer)); h.update(Buffer.from(fl.corrAt.buffer));
    h.update(JSON.stringify(fl.objs.map(o => [o.type, o.x, o.y, o.room, o.fx || "", o.loot ? o.loot.length : -1])));
    h.update(JSON.stringify(fl.items.map(i => [i.x, i.y, i.item || i.kind || ""])));
    h.update(JSON.stringify(fl.foes.map(f => [f.type, f.x, f.y, f.room])));
    h.update(JSON.stringify(fl.rooms.map(r => r ? [r.type, r.x0, r.y0, r.x1, r.y1, r.name] : null)));
    h.update(JSON.stringify((fl.npcs || []).map(n => [n.x, n.y, n.type || ""])));
    const got = h.digest("hex").slice(0, 16);
    if (got !== FP[k]) err(`этаж ${k} изменился (${got}): прежние этажи и сохранения расходятся`);
  }
  LAB.clearFloorCache();
  console.log("этажи блоков 1–2 прежние: проверено " + Object.keys(FP).length + " отпечатков");
}
const ms = Date.now() - t0;
console.log(`уровней: ${LAB.LEVELS_N}, этажей: ${floors}, ошибок: ${fails}, время: ${ms} мс (${(ms / floors).toFixed(1)} мс на этаж)`);
console.log("замки:", JSON.stringify(stat.locks));
console.log(`охрана на этаж: патрулей ${((stat.patrols || 0) / floors).toFixed(1)}, машин в кабинетах ${((stat.guards || 0) / floors).toFixed(1)}, сапёров ${((stat.sappers || 0) / floors).toFixed(2)}; стендов с задачами ${((stat.pz || 0) / floors).toFixed(2)}`);
console.log(`мастерских: ${stat.shopN || 0} (при лифтовом холле или у прибытия: ${stat.shopLift || 0}), путь от прибытия в среднем ${stat.shopN ? Math.round(stat.shopD / stat.shopN) : 0}, самый длинный ${stat.shopMax || 0} шагов`);
console.log(`стартовый набор у капсулы (аптечки и энергобатареи в двух шагах): ${stat.kitNear || 0}`);
console.log(`на этаж: врагов ${(stat.foes / floors).toFixed(1)}, турелей ${(stat.turrets / floors).toFixed(2)}, камер ${(stat.cams / floors).toFixed(2)}, вещей ${(stat.items / floors).toFixed(1)}, выживших ${(stat.npcs / floors).toFixed(2)}, тайных комнат ${(stat.secrets / floors).toFixed(2)}, заваленных лестниц ${stat.blocked} (домкратов ${(stat.kits || {}).rub_jack || 0}, зарядов ${(stat.kits || {}).c_blast || 0}); коридоры от ${stat.corrMin} до ${stat.corrMax} шагов`);
console.log("обстановка:", JSON.stringify(stat.objs));
/* (3.2) чем ниже блок, тем просторнее */
if (stat.sz) {
  const B = Object.keys(stat.sz).map(Number).sort((a, b) => a - b);
  console.log("просторность по блокам:", B.map(b => { const z = stat.sz[b]; return `${b}: помещения ${(z.mainA / z.main).toFixed(0)} кл. (${z.minSide}–${z.maxSide}), кабинетов ${(z.ann / z.n).toFixed(0)} по ${(z.annA / z.ann).toFixed(1)} кл., обстановки ${(z.fx / z.n).toFixed(0)}`; }).join("; "), "; ширина коридоров:", JSON.stringify(stat.cwBy), "; вещей нижних глубин:", stat.deepFx || 0);
  for (let i = 1; i < B.length; i++) {
    const a = stat.sz[B[i - 1]], b = stat.sz[B[i]];
    if (B[i] >= 3 && !(b.mainA / b.main > a.mainA / a.main && b.annA / b.ann > a.annA / a.ann)) err(`блок ${B[i]}: помещения и кабинеты не больше, чем в блоке ${B[i - 1]}`);
  }
  if (B.some(b => b >= 3) && !(stat.deepFx > 0)) err("в нижних глубинах нет их вещей обстановки");
}
console.log("прессов «Подножия»:", stat.press || 0);
console.log(`броня на полу: ${(stat.armor / floors).toFixed(2)} на этаж; модификации роботов:`, JSON.stringify(stat.aff));
console.log("роботы по уровням (доля с модификациями, средний ум):", Object.keys(stat.mechByL).map(L => `${L}: ${(100 * (stat.affByL[L] || 0) / stat.mechByL[L]).toFixed(0)}%, ${(stat.iqByL[L] / stat.mechByL[L]).toFixed(1)}`).join("; "));
/* (2.5) хранилища и мир мутантов */
if (stat.box) {
  const share = (stat.boxEmpty || 0) / stat.box;
  console.log(`хранилищ на этаж: ${(stat.box / floors).toFixed(1)}, пустых: ${(100 * share).toFixed(1)} %`);
  if (share > 0.2) err(`пустых хранилищ слишком много: ${(100 * share).toFixed(1)} %`);
}
if (LAB.mutants) {
  const M = LAB.mutants, SND = new Set(["rat", "roach", "labmut", "slug", "vine", "spore", "swamp", "chimera", "lizard", "weaver", "blind", "spark", "frozen", "thawed", "soldier", "phase", "proto"]);
  const BEH = new Set(["chase", "ranged", "stationary", "ambush", "deaf", "swarm", "blink", "regen", "poison", "slow", "web", "explode", "dooropen", "shieldally", "kamikaze", "tracker", "splash", "summon", "drain", "mimic", "patrol", "reflect", "phaseshift", "split", "burrow", "healer", "leech", "charge", "screamer", "fly", "vibro", "mimicsnd", "heat",
    "flee", "howl", "bomber", "trapper", "feeder", "rad", "psi", "corrode", "silent", "adapt", "lure", "marker"]);
  const CASTE = new Set(["worker", "soldier", "hunter", "spitter", "guard", "priest", "seer", "leader", "queen", "drone", "trapper"]);
  const RANK = new Set(["low", "mid", "high", "apex"]);
  const onLevel = {};
  for (let L = 1; L <= LAB.LEVELS_N; L++) (LAB.LEVELS[L].foes || []).forEach(id => { onLevel[id] = 1; });
  for (const id of M.ids) {
    const b = LAB.FOES[id];
    if (!b || b.kind !== "bio") { err(`тварь ${id}: нет в таблице врагов`); continue; }
    if (!SND.has(b.snd)) err(`тварь ${id}: неизвестный звук ${b.snd}`);
    b.beh.forEach(k => { if (!BEH.has(k)) err(`тварь ${id}: неизвестная повадка ${k}`); });
    if (b.caste && !CASTE.has(b.caste)) err(`тварь ${id}: неизвестная каста ${b.caste}`);
    if (!RANK.has(b.rank) || [0, 1, 2, 3].indexOf(b.mind) < 0 || !b.fam) err(`тварь ${id}: нет ума, ранга или семейства`);
    if (!["m", "f"].includes(b.g)) err(`тварь ${id}: род ${b.g}`);
    ["hp", "dmg", "arm", "spd", "rng", "acd", "det", "xp"].forEach(k => { if (!(typeof b[k] === "number" && b[k] >= 0)) err(`тварь ${id}: поле ${k}`); });
    if (!(b.lv && b.lv[0] >= 1 && b.lv[1] >= b.lv[0])) err(`тварь ${id}: глубина ${b.lv}`);
    if (!b.nolist && !onLevel[id]) err(`тварь ${id}: нет ни на одном уровне`);
    if (!/[.!?»]$/.test(b.desc) || b.desc.length < 60 || /"/.test(b.desc) || /\.\./.test(b.desc)) err(`тварь ${id}: описание`);
    if (b.minion && !LAB.FOES[b.minion]) err(`тварь ${id}: рождает неизвестного ${b.minion}`);
  }
  for (const id in LAB.FOES) { const b = LAB.FOES[id]; if (b.kind === "bio" && (b.mind == null || !b.rank || !b.fam)) err(`тварь ${id}: в бестиарии без ума, ранга или семейства`); }
  for (const p of M.PACKS) { if (p.lead && !LAB.FOES[p.lead]) err(`отряд ${p.id}: нет вожака ${p.lead}`); p.members.forEach(m => { if (!LAB.FOES[m[0]]) err(`отряд ${p.id}: нет вида ${m[0]}`); }); }
  const nb = Object.keys(LAB.FOES).filter(id => LAB.FOES[id].kind === "bio").length;
  console.log(`твари: видов ${nb}, новых ${M.ids.length}; отрядов на этаж ${((stat.packs || 0) / floors).toFixed(2)} (в них ${((stat.packFoes || 0) / floors).toFixed(1)}), тварей на этаж ${((stat.bio || 0) / floors).toFixed(1)}; ступени развития: ${(stat.evo || []).join("/")}`);
  if (nb < 100) err(`тварей меньше сотни: ${nb}`);
}
/* (3.0) полы: доля бетонных коридоров по глубине — в «Подножии» больше всего, в «Отражении» меньше всего;
   в части помещений — дерево; таблицы полов — только известные помещения */
if (LAB.floors && stat.fl3) {
  const s3 = stat.fl3, sh = s3.corr.map((n, i) => n ? s3.conc[i] / n : null);
  console.log("полы: бетонных коридоров по глубине (Ковчег, Подножие, Колыбель, Отражение, Механизм, Исток):", sh.map(v => v == null ? "—" : (100 * v).toFixed(0) + " %").join(", ") +
    `; помещений с деревянным полом ${(100 * s3.wood / s3.rooms).toFixed(1)} %, с бетонным ${(100 * s3.rconc / s3.rooms).toFixed(1)} %; деревянных видов на этажах: ${Object.keys(s3.types).length}`);
  ["WOOD", "CONC"].forEach(t => Object.keys(LAB.floors[t]).forEach(k => { if (!LAB.ROOMS[k]) err(`полы: в таблице ${t} неизвестное помещение ${k}`); if (t === "WOOD" && LAB.floors.CONC[k]) err(`полы: ${k} и деревянное, и бетонное`); }));
  if (sh[0] != null && (sh[0] < 0.2 || sh[0] > 0.75)) err(`полы: бетонных коридоров «Ковчега» ${(100 * sh[0]).toFixed(0)} %`);
  if (sh[1] != null && sh[3] != null && !(sh[1] > sh[3])) err("полы: в «Подножии» бетона не больше, чем в «Отражении»");
  if (sh[1] != null && sh[1] < 0.5) err(`полы: в штольнях «Подножия» бетонных коридоров ${(100 * sh[1]).toFixed(0)} %`);
  if (s3.wood / s3.rooms < 0.04) err(`полы: помещений с деревянным полом мало: ${(100 * s3.wood / s3.rooms).toFixed(1)} %`);
}
/* (2.6) лечение и снабжение */
if (stat.med26) {
  const md = stat.med26, share = md.capRooms ? md.vend / md.capRooms : 1;
  const avgB = Object.keys(md.pileB).map(b => [+b, md.pileB[b] / md.pileBN[b]]);
  console.log(`аптечные автоматы у капсул: ${md.vend} из ${md.capRooms} (${(100 * share).toFixed(0)} %); батареи у капсулы прибытия — на ${md.arrBat} этажах; лечебных припасов на этаж ${(md.piles / md.floors).toFixed(1)}, по числу в стопке:`, JSON.stringify(md.pileN));
  console.log("в среднем в стопке по блокам:", avgB.map(a => a[0] + ": " + a[1].toFixed(2)).join(", "), "; целители:", JSON.stringify(md.healers));
  if (share < 0.8) err(`аптечных автоматов у капсул мало: ${(100 * share).toFixed(0)} %`);
  if (md.piles / md.floors < 20) err(`лечебных припасов мало: ${(md.piles / md.floors).toFixed(1)} на этаж`);
  for (let i = 1; i < avgB.length; i++) if (avgB[i][1] + 0.05 < avgB[i - 1][1]) err(`глубже по блокам припасов меньше: блок ${avgB[i][0]}`);
  if (!Object.keys(md.healers).length) err("целителей на этажах нет");
}
process.exit(fails ? 1 : 0);
