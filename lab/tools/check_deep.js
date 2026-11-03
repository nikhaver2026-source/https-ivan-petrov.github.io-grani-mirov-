#!/usr/bin/env node
/* Проверка файлов глубоких блоков «Подземной лаборатории» (js/d6.js … js/d15.js).
   Формат — lab/tools/blocks/DEEP.md (и SPEC.md для общих разделов). Запуск:
     node lab/tools/check_deep.js        — все глубокие блоки, что есть
     node lab/tools/check_deep.js 7      — только блок VII
   ERR — ошибка (игра сломается или данные неполны), WARN — замечание. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const only = process.argv[2] ? +process.argv[2] : 0;
const DIR = process.env.DEEP_DIR || ROOT; /* где лежат js/dN.js (для пробных блоков — другая папка) */
const dup = [];
const ctx = { console: { log() {}, warn: (m) => dup.push(String(m)), error: console.error }, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Error, Date, RegExp, Proxy, isFinite, parseInt, parseFloat };
ctx.globalThis = ctx; ctx.window = ctx;
vm.createContext(ctx);
let errs = 0, warns = 0;
function load(f) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) return false;
  try { vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f }); }
  catch (e) { console.log(`ERR ${f}: не загружается: ${e.message}`); errs++; return false; }
  return true;
}
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/deep.js", "js/mutants.js"]) load(f);
const LAB = ctx.LAB;
/* Списки допустимых значений — из проверки прежних блоков (одни и те же) */
const CB = fs.readFileSync(path.join(ROOT, "tools/check_blocks.js"), "utf8");
function list(name) { const m = new RegExp("const " + name + " = S\\((\\[[\\s\\S]*?\\])\\);").exec(CB); if (!m) throw new Error("нет списка " + name); return new Set(eval(m[1])); }
const OBJ_KEYS = list("OBJ_KEYS"), LOOT = list("LOOT"), ROOM_AMB = list("ROOM_AMB"), EV = list("EV"), SURF_BASE = list("SURF_BASE"),
  BEH0 = list("BEH"), ADT = list("ADT"), KIND = list("KIND"), FOE_SND = list("FOE_SND"), W_SND = list("W_SND"), W_CLS = list("W_CLS"),
  DT = list("DT"), ARMOR_SPECIAL0 = list("ARMOR_SPECIAL"), ITEM_FX0 = list("ITEM_FX"), ITEM_KIND = list("ITEM_KIND"), TRADE = list("TRADE"),
  BEACON = list("BEACON"), EVENT_LIKE = list("EVENT_LIKE"), COMMON_ROOMS = list("COMMON_ROOMS");
const LEVEL_AMB = new Set(Array.from({ length: 10 }, (_, i) => "amb_l" + (i + 1)));
const BEH = new Set([...BEH0, "flee", "howl", "bomber", "trapper", "feeder", "rad", "psi", "corrode", "silent", "adapt", "lure", "marker", "fly"]);
const ARMOR_SPECIAL = new Set([...ARMOR_SPECIAL0, "harness"]);
const ITEM_FX = new Set([...ITEM_FX0, "regen", "stitch", "memory", "antimut"]);
const OKO_EVENTS = ["enter", "turret_off", "turret_hack", "counter", "hack_fail", "robots", "lockdown", "alarm", "repair", "boss", "kill", "sample", "riddle", "taunt"];
const FLOORS = new Set(["concrete", "wood", "carpet", "grass", "sand", "stone", "tile", "rubber", "metal"]);
const SURF_BASE2 = new Set([...SURF_BASE, "concrete", "wood", "carpet", "grass", "sand", "stone", "tile", "rubber"]);
const ROOM_CAT = new Set(["arms", "sec", "server", "vault", "power", "lab", "med", "living", "store", "office", "tech", "any"]);
const CUT_NEED = new Set(["power", "puzzle", "crank", "harness", "code", "none"]);
const NORM_KIND = new Set(["parts", "kills", "samples", "repair", "visit"]);
const TRIAL_KIND = new Set(["survive", "find", "silent", "disarm", "chase", "puzzle"]);
const MIND = new Set([0, 1, 2, 3]), RANK = new Set(["low", "mid", "high", "apex"]);
const CASTE = new Set(["worker", "soldier", "hunter", "spitter", "guard", "priest", "seer", "leader", "queen", "drone", "trapper"]);
const FLOORS6 = [1, 4, 8, 12, 16, 20];

function E(b, m) { console.log(`ERR [${b}] ${m}`); errs++; }
function W(b, m) { console.log(`WARN [${b}] ${m}`); warns++; }
function str(v) { return typeof v === "string" && v.trim().length > 0; }
function num(v, a, z) { return typeof v === "number" && isFinite(v) && v >= a && v <= z; }
function txt(b, where, s, min, max) {
  if (!str(s)) { E(b, `${where}: пустой текст`); return; }
  if (min && s.length < min) W(b, `${where}: коротко (${s.length} < ${min})`);
  if (max && s.length > max) W(b, `${where}: длинно (${s.length} > ${max})`);
  if (/Гран[ьиейю]\s+[Мм]ир/.test(s)) E(b, `${where}: «Грань Миров» — только в финале`);
  if (/Странник/.test(s)) E(b, `${where}: «Странники» — только в финале`);
  if (/(сот\w*|тысяч\w*|сотн\w*)\s+(уровн|этаж)|(уровн\w*|этаж\w*)\s+(в|из)\s+(блоке|комплексе)\b|последн\w+\s+из\s+\d/i.test(s)) W(b, `${where}: похоже на общее число уровней или этажей`);
  if (/"/.test(s)) W(b, `${where}: прямые кавычки — нужны «ёлочки»`);
  if (/[A-Za-z]{2,}/.test(s)) W(b, `${where}: латиница: «${s.match(/[A-Za-z]{2,}/)[0]}»`);
  if (/\s-\s/.test(s)) W(b, `${where}: дефис вместо тире`);
  if (/\bОКО\b/.test(s) && /oko\[/.test(where)) W(b, `${where}: в глубоких блоках по громкой связи говорит Перекличка, а не ОКО`);
}
function countIn(o, min, max, b, what) { const n = o ? (Array.isArray(o) ? o.length : Object.keys(o).length) : 0; if (n < min) E(b, `${what}: нужно ${min}–${max}, есть ${n}`); else if (max && n > max) W(b, `${what}: больше нормы (${n} > ${max})`); return n; }

const before = { rooms: new Set(Object.keys(LAB.ROOMS)), foes: new Set(Object.keys(LAB.FOES)), bosses: new Set(Object.keys(LAB.BOSSES)), weapons: new Set(Object.keys(LAB.WEAPONS)), items: new Set(Object.keys(LAB.ITEMS)), armors: new Set(Object.keys(LAB.ARMORS)), ammo: new Set(Object.keys(LAB.AMMO)) };
const PARTS0 = new Set(LAB.PARTS);
dup.length = 0;
const nums = only ? [only] : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const loaded = {};
for (const n of nums) {
  const f = `js/d${n}.js`;
  if (!fs.existsSync(path.join(DIR, f))) { if (only) E("блок " + n, `нет файла ${f}`); continue; }
  const src = fs.readFileSync(path.join(DIR, f), "utf8");
  try { const acorn = require(process.env.ACORN || "acorn"); acorn.parse(src, { ecmaVersion: 2017, sourceType: "script" }); }
  catch (e) { if (e.code !== "MODULE_NOT_FOUND") { console.log(`ERR ${f}: синтаксис новее ES2017 или ошибка: ${e.message}`); errs++; } }
  [/\?\./, /\?\?/, /`/, /=>/, /\blet\b/, /\bconst\b/].forEach(re => { if (re.test(src.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\*[\s\S]*?\*\//g, ""))) { console.log(`ERR ${f}: запрещённый синтаксис ${re}`); errs++; } });
  loaded[n] = DIR === ROOT ? load(f) : (function () { try { vm.runInContext(src, ctx, { filename: f }); return true; } catch (e) { console.log(`ERR ${f}: не загружается: ${e.message}`); errs++; return false; } })();
}
dup.forEach(m => { console.log("ERR " + m); errs++; });
const total = {};
for (const n of nums) {
  if (!loaded[n]) continue;
  const b = "блок " + n, B = LAB.BLOCKS[n], D = LAB.DEEP && LAB.DEEP[n], R = LAB.blockRange(n), px = "v" + n + "_";
  if (!B || !D) { E(b, "LAB.addDeep(" + n + ", …) ни разу не вызван"); continue; }
  /* meta */
  if (!str(B.name)) E(b, "meta.name пусто");
  if (!(B.intro && B.intro.length >= 5)) E(b, `meta.intro: нужно 5–7 страниц, есть ${(B.intro || []).length}`);
  if (n < 15 && !(B.outro && B.outro.length >= 4)) E(b, `meta.outro: нужно 4–6 страниц, есть ${(B.outro || []).length}`);
  (B.intro || []).forEach((p, i) => txt(b, `intro[${i}]`, p, 80, 900));
  (B.outro || []).forEach((p, i) => txt(b, `outro[${i}]`, p, 80, 900));
  /* deep */
  if (D.era && "KPCOMI".indexOf(D.era) < 0) E(b, "deep.era — одна из K P C O M I (нужна P)");
  if (D.surf && !FLOORS.has(D.surf) && !LAB.SURF[D.surf]) E(b, `deep.surf: неизвестный пол ${D.surf}`);
  for (const k in D.roomSurf) { if (!ROOM_CAT.has(k)) E(b, `deep.roomSurf: неизвестный род ${k}`); if (!FLOORS.has(D.roomSurf[k]) && !LAB.SURF[D.roomSurf[k]]) E(b, `deep.roomSurf.${k}: неизвестный пол ${D.roomSurf[k]}`); }
  if (!D.pass || !str(D.pass.n) || !str(D.pass.short)) E(b, "deep.pass: нужны n и short");
  if (!D.corr || !str(D.corr.gallery) || !str(D.corr.passage)) E(b, "deep.corr: нужны gallery и passage");
  if (!D.stairs || !str(D.stairs.n)) E(b, "deep.stairs: нужно n");
  countIn(D.cuts, 3, 5, b, "deep.cuts");
  (D.cuts || []).forEach((c, i) => { if (!str(c.id) || c.id.indexOf(px) !== 0) E(b, `deep.cuts[${i}].id: нужна приставка ${px}`); if (!CUT_NEED.has(c.need)) E(b, `deep.cuts[${i}].need: ${c.need}`); txt(b, `deep.cuts[${i}].n`, c.n); txt(b, `deep.cuts[${i}].desc`, c.desc, 40, 400); txt(b, `deep.cuts[${i}].ride`, c.ride, 40, 400); });
  if (!D.ai || !str(D.ai.n)) E(b, "deep.ai: нужно n (облик Переклички)");
  if (n === 6) { countIn(D.rent, 3, 4, b, "deep.rent (прокатный комплект)"); (D.rent || []).forEach((m, i) => { if (!str(m.id) || !str(m.n) || !num(m.fee, 1, 500)) E(b, `deep.rent[${i}]: нужны id, n, fee`); txt(b, `deep.rent[${i}].desc`, m.desc, 30, 300); }); }
  countIn(D.norms, 4, 6, b, "deep.norms");
  (D.norms || []).forEach((q, i) => { if (!str(q.id) || !str(q.n) || !NORM_KIND.has(q.kind) || !num(q.need, 1, 40)) E(b, `deep.norms[${i}]: нужны id, n, kind (${[...NORM_KIND].join(", ")}), need`); txt(b, `deep.norms[${i}].task`, q.task, 20, 300); });
  countIn(D.trials, n === 6 ? 8 : 3, n === 6 ? 10 : 5, b, "deep.trials");
  (D.trials || []).forEach((q, i) => { if (!str(q.id) || !str(q.n) || !TRIAL_KIND.has(q.kind)) E(b, `deep.trials[${i}]: нужны id, n, kind (${[...TRIAL_KIND].join(", ")})`); txt(b, `deep.trials[${i}].desc`, q.desc, 30, 400); });
  if (!D.market || !str(D.market.n) || !(D.market.lines || []).length) E(b, "deep.market: нужны n и lines");
  countIn(D.memories, 6, 10, b, "deep.memories");
  (D.memories || []).forEach((q, i) => { txt(b, `deep.memories[${i}].t`, q.t); txt(b, `deep.memories[${i}].x`, q.x, 150, 700); });
  /* свои таблицы блока */
  const ownRooms = (B.rooms || []).filter(r => r.indexOf(px) === 0), ownFoes = (B.foes || []).filter(r => r.indexOf(px) === 0);
  const ownBoss = Object.keys(LAB.BOSSES).filter(k => k.indexOf(px) === 0 && !before.bosses.has(k));
  /* секторы */
  const secN = countIn(D.sectors, 8, 12, b, "sectors");
  const usedR = new Set(), usedF = new Set(), usedB = new Set(), ids = new Set();
  let ends = 0;
  (D.sectors || []).forEach((s, i) => {
    const w = `sectors[${i}]${s.id ? " " + s.id : ""}`;
    if (!str(s.id) || ids.has(s.id)) E(b, `${w}: нужен уникальный id`); ids.add(s.id);
    txt(b, `${w}.name`, s.name); txt(b, `${w}.desc`, s.desc, 80, 600);
    if (s.end) ends++;
    if (!(s.rooms && s.rooms.length >= 10)) E(b, `${w}.rooms: нужно 12–18`);
    (s.rooms || []).forEach(r => { if (!LAB.ROOMS[r]) E(b, `${w}: нет помещения ${r}`); usedR.add(r); });
    if (!(s.foes && s.foes.length >= 5)) E(b, `${w}.foes: нужно 6–9`);
    (s.foes || []).forEach(f => { if (!LAB.FOES[f]) E(b, `${w}: нет врага ${f}`); usedF.add(f); });
    if (!(s.bosses && s.bosses.length >= 1)) E(b, `${w}.bosses: нужно 2–3`);
    (s.bosses || []).forEach(x => { if (!LAB.BOSSES[x]) E(b, `${w}: нет стража ${x}`); usedB.add(x); });
    if (s.amb && !LEVEL_AMB.has(s.amb)) E(b, `${w}.amb: ${s.amb}`);
    (s.ev || []).forEach(e => { if (!EV.has(e)) E(b, `${w}.ev: ${e}`); });
    if (s.surf && !FLOORS.has(s.surf) && !LAB.SURF[s.surf]) E(b, `${w}.surf: ${s.surf}`);
    if (!D.sectorStory[s.id]) E(b, `sectorStory.${s.id}: нет записок сектора`);
    else FLOORS6.filter(F => F === 1 || F === 8 || F === 20).forEach(F => { const st = D.sectorStory[s.id][F]; if (!st) E(b, `sectorStory.${s.id}[${F}]: нет записки`); else { txt(b, `sectorStory.${s.id}[${F}].x`, st.x, 250, 900); if (!str(st.t) || !str(st.a)) E(b, `sectorStory.${s.id}[${F}]: нужны t и a`); } });
  });
  if (ends !== 1) E(b, `sectors: сектор с end: true должен быть один, есть ${ends}`);
  ownRooms.forEach(r => { if (!usedR.has(r)) W(b, `помещение ${r} не стоит ни в одном секторе`); });
  ownFoes.forEach(f => { if (!usedF.has(f)) W(b, `враг ${f} не стоит ни в одном секторе`); });
  ownBoss.forEach(x => { if (!usedB.has(x)) W(b, `страж ${x} не стоит ни в одном секторе`); });
  /* помещения */
  countIn(ownRooms, 24, 36, b, "rooms (свои)");
  let darkN = 0, rankN = 0, trialN = 0;
  ownRooms.forEach(id => {
    const r = LAB.ROOMS[id], w = "rooms." + id;
    txt(b, w + ".n", r.n); txt(b, w + ".desc", r.desc, 60, 450);
    for (const k in (r.obj || {})) { if (!OBJ_KEYS.has(k)) E(b, `${w}.obj: ${k}`); else if (!num(r.obj[k], 0.05, 1)) E(b, `${w}.obj.${k}: 0.05–1`); }
    if (r.loot && !LOOT.has(r.loot)) E(b, `${w}.loot: ${r.loot}`);
    if (r.amb && !ROOM_AMB.has(r.amb)) E(b, `${w}.amb: ${r.amb}`);
    if (r.fl && !FLOORS.has(r.fl) && !LAB.SURF[r.fl]) E(b, `${w}.fl: ${r.fl}`);
    if (r.dark) darkN++; if (r.rank) { rankN++; if (!num(r.rank, 1, 6)) E(b, `${w}.rank: 1–6`); } if (r.trial) trialN++;
    const lg = LAB.LORE.logs[id]; if (!lg || lg.length < 2) W(b, `logs.${id}: нужно 2 строки журнала`);
  });
  if (darkN < 2) W(b, `помещений вне надзора (dark) — ${darkN}, нужно 2–4`);
  if (rankN < 1) W(b, `помещений с допуском (rank) — ${rankN}, нужно 1–3`);
  if (trialN < (n === 6 ? 5 : 1)) W(b, `испытательных камер (trial) — ${trialN}, нужно ${n === 6 ? "5–8" : "1–3"}`);
  /* враги */
  countIn(ownFoes, 18, 26, b, "foes (свои)");
  let mech = 0; const minds = new Set();
  ownFoes.forEach(id => {
    const f = LAB.FOES[id], w = "foes." + id;
    txt(b, w + ".n", f.n); txt(b, w + ".desc", f.desc, 60, 400);
    if (!KIND.has(f.kind)) E(b, `${w}.kind: ${f.kind}`);
    if (!"mfn".includes(f.g || "")) E(b, `${w}.g: m, f, n`);
    if (!num(f.hp, 10, 200)) E(b, `${w}.hp: ${f.hp}`); if (!num(f.dmg, 0, 26)) E(b, `${w}.dmg: ${f.dmg}`); if (!num(f.arm, 0, 20)) E(b, `${w}.arm: ${f.arm}`);
    const still = (f.beh || []).indexOf("stationary") >= 0 && !f.dmg; /* камеры, слуховые окна, узлы: не бьют — rng 0, acd 99 */
    if (!num(f.spd, 1, 99)) E(b, `${w}.spd`); if (!(still ? num(f.rng, 0, 9) : num(f.rng, 1, 9))) E(b, `${w}.rng`); if (!(still ? (num(f.acd, 1, 4) || f.acd === 99) : num(f.acd, 1, 4))) E(b, `${w}.acd`); if (!num(f.det, 2, 10)) E(b, `${w}.det`); if (!num(f.xp, 5, 80)) E(b, `${w}.xp`);
    (f.beh || []).forEach(k => { if (!BEH.has(k)) E(b, `${w}.beh: неизвестная повадка ${k}`); });
    if (!ADT.has(f.adt)) E(b, `${w}.adt: ${f.adt}`);
    if (!FOE_SND.has(f.snd)) E(b, `${w}.snd: ${f.snd}`);
    if (f.sndRate != null && !num(f.sndRate, 0.6, 1.5)) E(b, `${w}.sndRate: 0.7–1.4`);
    if (f.kind === "mech") mech++;
    if (f.kind === "bio") { if (!MIND.has(f.mind)) E(b, `${w}.mind: 0–3 у тварей`); else minds.add(f.mind); if (!RANK.has(f.rank)) E(b, `${w}.rank: low, mid, high, apex`); if (!str(f.fam)) W(b, `${w}.fam: семейство для бестиария`); if (f.caste && !CASTE.has(f.caste)) E(b, `${w}.caste: ${f.caste}`); }
    if (!D.cards || !str(D.cards[id])) W(b, `deep.cards.${id}: нет карточки твари`);
  });
  if (ownFoes.length && mech < ownFoes.length / 2) W(b, `роботов ${mech} из ${ownFoes.length} — меньше половины`);
  [0, 1, 2, 3].forEach(m => { if (!minds.has(m)) W(b, `нет тварей с разумом ${m}`); });
  /* стражи */
  countIn(ownBoss, 16, 24, b, "bosses (свои)");
  ownBoss.forEach(id => {
    const x = LAB.BOSSES[id], w = "bosses." + id;
    if (!LAB.FOES[x.base]) E(b, `${w}.base: нет врага ${x.base}`);
    txt(b, w + ".n", x.n); txt(b, w + ".desc", x.desc, 60, 500);
    if (!num(x.mult, 4, 8)) E(b, `${w}.mult: 4–8`);
    (x.beh || []).forEach(k => { if (!BEH.has(k)) E(b, `${w}.beh: ${k}`); });
    if (x.minion && !LAB.FOES[x.minion]) E(b, `${w}.minion: нет врага ${x.minion}`);
    if (x.snd && !FOE_SND.has(x.snd)) E(b, `${w}.snd: ${x.snd}`);
  });
  /* оружие, патроны, детали, предметы, броня, рецепты */
  const ownW = Object.keys(LAB.WEAPONS).filter(k => k.indexOf(px) === 0), ownA = Object.keys(LAB.AMMO).filter(k => k.indexOf(px) === 0);
  const ownI = Object.keys(LAB.ITEMS).filter(k => k.indexOf(px) === 0), ownAr = Object.keys(LAB.ARMORS).filter(k => k.indexOf(px) === 0);
  countIn(ownW, 5, 8, b, "weapons");
  ownW.forEach(id => { const x = LAB.WEAPONS[id], w = "weapons." + id; txt(b, w + ".n", x.n); txt(b, w + ".desc", x.desc, 40, 400);
    if (!W_CLS.has(x.cls)) E(b, `${w}.cls: ${x.cls}`); if (!DT.has(x.dt)) E(b, `${w}.dt: ${x.dt}`); if (!W_SND.has(x.snd)) E(b, `${w}.snd: ${x.snd}`);
    if (!num(x.dmg, 5, 70)) E(b, `${w}.dmg`); if (!num(x.rng, 1, 12)) E(b, `${w}.rng`); if (!num(x.cap, 0, 30)) E(b, `${w}.cap`); if (!num(x.cd, 250, 1600)) E(b, `${w}.cd`);
    if (x.ammo !== "none" && x.ammo !== "energy" && x.ammo !== "magnetron" && x.ammo !== "positron" && !LAB.AMMO[x.ammo]) E(b, `${w}.ammo: нет ${x.ammo}`);
    if (x.at != null && !num(x.at, 0, 1)) E(b, `${w}.at: 0–1`); if (x.rank != null && !num(x.rank, 1, 6)) E(b, `${w}.rank: 1–6`); if (!str(x.model)) W(b, `${w}.model`); });
  countIn(ownA, 1, 2, b, "ammo");
  const ownP = ownI.filter(k => LAB.ITEMS[k].kind === "part"), ownU = ownI.filter(k => LAB.ITEMS[k].kind !== "part");
  countIn(ownP, 3, 5, b, "parts"); countIn(ownU, 5, 8, b, "items");
  ownU.forEach(id => { const x = LAB.ITEMS[id], w = "items." + id; txt(b, w + ".n", x.n); txt(b, w + ".desc", x.desc, 30, 400); if (!ITEM_KIND.has(x.kind)) E(b, `${w}.kind: ${x.kind}`); for (const k in (x.fx || {})) if (!ITEM_FX.has(k)) E(b, `${w}.fx: ${k}`); if (!num(x.price, 5, 5000)) E(b, `${w}.price`); });
  countIn(ownAr, 4, 6, b, "armors");
  ownAr.forEach(id => { const x = LAB.ARMORS[id], w = "armors." + id; txt(b, w + ".n", x.n); txt(b, w + ".desc", x.desc, 40, 400); if (!num(x.def, 10, 60)) E(b, `${w}.def`); if (x.special && !ARMOR_SPECIAL.has(x.special)) E(b, `${w}.special: ${x.special}`); for (const k in (x.res || {})) { if (!ADT.has(k)) E(b, `${w}.res: ${k}`); else if (!num(x.res[k], 0.05, 0.7)) E(b, `${w}.res.${k}`); } });
  const ownRec = LAB.RECIPES.filter(rc => String(rc.id).indexOf(px) === 0);
  countIn(ownRec, 10, 14, b, "recipes");
  ownRec.forEach(rc => { const w = "recipes." + rc.id; const o = String(rc.out || ""); const [kind, id] = o.indexOf(":") > 0 ? o.split(":") : ["item", o];
    const tbl = { item: LAB.ITEMS, ammo: LAB.AMMO, armor: LAB.ARMORS, weapon: LAB.WEAPONS }[kind]; if (!tbl || !tbl[id]) E(b, `${w}.out: нет ${o}`);
    for (const k in (rc.need || {})) if (!LAB.ITEMS[k] && LAB.PARTS.indexOf(k) < 0) E(b, `${w}.need: нет детали или предмета ${k}`); });
  /* вехи */
  const ms = D.milestones || {};
  let mf = 0, ml = 0;
  for (let a = 0; a <= 3; a++) FLOORS6.forEach(F => { const s = ms["first+" + a + "-" + F]; if (!s) E(b, `milestones["first+${a}-${F}"]: нет записки`); else { mf++; txt(b, `milestones.first+${a}-${F}`, s.x, 250, 900); if (!str(s.t) || !str(s.a)) E(b, `milestones.first+${a}-${F}: нужны t и a`); } });
  for (let a = 0; a <= 1; a++) FLOORS6.forEach(F => { const s = ms["last-" + a + "-" + F]; if (!s) E(b, `milestones["last-${a}-${F}"]: нет записки`); else { ml++; txt(b, `milestones.last-${a}-${F}`, s.x, 250, 900); } });
  for (const k in ms) if (!/^(first\+[0-3]|last-[01])-(1|4|8|12|16|20)$/.test(k)) E(b, `milestones: неизвестный ключ ${k}`);
  /* тексты на весь блок */
  countIn(B.staff, 30, 40, b, "staff"); (B.staff || []).forEach((s, i) => { txt(b, `staff[${i}].x`, s.x, 120, 700); if (!str(s.t)) E(b, `staff[${i}].t`); });
  const LORE = LAB.LORE, key = "b" + n;
  countIn(LORE.mail[key], 18, 24, b, "mail"); (LORE.mail[key] || []).forEach((th, i) => { if (!str(th.o) || !str(th.s) || !(th.m && th.m.length >= 2)) E(b, `mail[${i}]: нужны o, s и 2–4 письма`); (th.m || []).forEach((m, j) => { if (!Array.isArray(m) || m.length !== 3) E(b, `mail[${i}].m[${j}]: [от, тема, текст]`); else txt(b, `mail[${i}].m[${j}]`, m[2], 30, 600); }); });
  countIn(LORE.docs[key], 16, 24, b, "docs"); (LORE.docs[key] || []).forEach((d, i) => { if (!str(d.t)) E(b, `docs[${i}].t`); txt(b, `docs[${i}].x`, d.x, 150, 900); });
  countIn(LORE.cams[key], 12, 16, b, "cams"); (LORE.cams[key] || []).forEach((c, i) => txt(b, `cams[${i}]`, c, 60, 400));
  countIn(LORE.posts[key], 8, 12, b, "posts");
  countIn(B.notices, 8, 12, b, "notices");
  countIn(B.riddles, 15, 20, b, "riddles"); (B.riddles || []).forEach((r, i) => { txt(b, `riddles[${i}].q`, r.q, 20, 400); if (!(r.a && r.a.length === 4)) E(b, `riddles[${i}].a: верный и три неверных`); });
  countIn(B.rumors, 12, 16, b, "rumors");
  OKO_EVENTS.forEach(ev => { const a = (B.oko || {})[ev]; if (!a || a.length < 3) E(b, `oko.${ev}: нужно 3–6 реплик Переклички`); else a.forEach((t, i) => txt(b, `oko[${ev}][${i}]`, t, 15, 300)); });
  countIn(B.profs, 3, 5, b, "profs"); for (const k in (B.profs || {})) { const p = B.profs[k]; if (p.trade && !TRADE.has(p.trade)) E(b, `profs.${k}.trade`); if (!BEACON.has(p.beacon)) E(b, `profs.${k}.beacon`); if (!(p.stories && p.stories.length >= 3)) E(b, `profs.${k}.stories: 3–5`); }
  countIn(B.life, 8, 12, b, "life"); countIn(B.view, 8, 12, b, "view");
  const rn = Object.keys(LAB.ROBOT_NPC).filter(k => k.indexOf(px) === 0); if (rn.length < 1) E(b, "robotNpc: нужно 1–2");
  countIn(B.events, 2, 3, b, "events"); (B.events || []).forEach((e, i) => { if (!EVENT_LIKE.has(e.like)) E(b, `events[${i}].like: ${e.like}`); });
  /* уровни блока строятся. Блоки пишутся вразнобой: если блоки выше ещё не готовы, дно игры (LEVELS_N)
     до этого блока не дотягивается — на время проверки оно опускается до конца этого блока */
  const N0 = LAB.LEVELS_N;
  if (!LAB.deepReady(n)) E(b, "блок не готов: у какого-то сектора нет помещений, врагов или стражей из таблиц");
  else {
    LAB.LEVELS_N = Math.max(N0, R.to);
    const L0 = R.from, L1 = Math.min(R.to, L0 + 400);
    let bad = 0;
    const probe = [];
    for (let L = L0; L <= L1; L++) probe.push(L);
    for (let k = 0; k < 200; k++) probe.push(R.from + Math.floor((R.size - 1) * k / 199));
    probe.forEach(L => { const lv = LAB.LEVELS[L]; if (!lv || !lv.rooms || !lv.foes || !LAB.BOSSES[lv.boss] || !str(lv.name)) bad++; });
    if (bad) E(b, `уровни блока не строятся: ${bad} из ${probe.length}`);
    const secSeen = new Set(); for (let L = R.from; L <= R.to; L += Math.max(1, Math.round(R.size / 40))) { const s = LAB.deepSector(L); if (s) secSeen.add(s.s.id); }
    (D.sectors || []).forEach(s => { if (!secSeen.has(s.id)) W(b, `сектор ${s.id} ни разу не выпал в полосах блока`); });
    LAB.LEVELS_N = N0;
  }
  total[n] = { rooms: ownRooms.length, foes: ownFoes.length, mech, bosses: ownBoss.length, sectors: secN, weapons: ownW.length, armors: ownAr.length, items: ownU.length, milestones: mf + ml, staff: (B.staff || []).length };
}
console.log("\nИтог:");
for (const n in total) console.log(`  блок ${n}: ` + Object.keys(total[n]).map(k => k + " " + total[n][k]).join(", "));
console.log(`ERR: ${errs}, WARN: ${warns}`);
process.exit(errs ? 1 : 0);
