#!/usr/bin/env node
/* Проверка файлов блоков «Подземной лаборатории» (js/b1.js … js/b5.js).
   Формат — lab/tools/blocks/SPEC.md. Запуск:
     node lab/tools/check_blocks.js        — все блоки
     node lab/tools/check_blocks.js 2      — только блок II
   ERR — ошибка (игра сломается или данные неполны), WARN — замечание. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const only = process.argv[2] ? +process.argv[2] : 0;

const ctx = { console: { log() {}, warn: (m) => dup.push(String(m)), error: console.error }, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int32Array, Error, Date, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
const dup = [];
function load(f) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) return false;
  const src = fs.readFileSync(p, "utf8");
  try { vm.runInContext(src, ctx, { filename: f }); }
  catch (e) { console.log(`ERR ${f}: не загружается: ${e.message}`); errs++; return false; }
  return true;
}
let errs = 0, warns = 0;
for (const f of ["js/data.js", "js/texts.js", "js/lore.js"]) load(f);
/* сырьё химии (chem.js, FAM: споровая пыльца и др.) — тоже вещи рюкзака: рецепты верстака берут и его */
const CHEM_FAM = new Set((fs.readFileSync(path.join(ROOT, "js/chem.js"), "utf8").match(/^\s{2}(c_[a-z]+):\s*\{ n: \[/gm) || []).map(m => m.trim().split(":")[0]));
const LAB = ctx.LAB;
const before = {
  rooms: new Set(Object.keys(LAB.ROOMS)), foes: new Set(Object.keys(LAB.FOES)), bosses: new Set(Object.keys(LAB.BOSSES)),
  weapons: new Set(Object.keys(LAB.WEAPONS)), items: new Set(Object.keys(LAB.ITEMS)), armors: new Set(Object.keys(LAB.ARMORS)), ammo: new Set(Object.keys(LAB.AMMO))
};
const loaded = {};
for (let n = 1; n <= 5; n++) {
  const f = `js/b${n}.js`;
  if (fs.existsSync(path.join(ROOT, f))) {
    // синтаксис не новее ES2018, если есть acorn
    try {
      const acorn = require(process.env.ACORN || "acorn");
      acorn.parse(fs.readFileSync(path.join(ROOT, f), "utf8"), { ecmaVersion: 2018, sourceType: "script" });
    } catch (e) { if (e.code !== "MODULE_NOT_FOUND") { console.log(`ERR ${f}: синтаксис новее ES2018 или ошибка: ${e.message}`); errs++; } }
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    [/\?\./, /\?\?/, /`/].forEach(re => { if (re.test(src.replace(/"(?:[^"\\]|\\.)*"/g, '""'))) { console.log(`ERR ${f}: запрещённый синтаксис ${re}`); errs++; } });
    loaded[n] = load(f);
  }
}
dup.forEach(m => { console.log("ERR " + m); errs++; });

const S = (a) => new Set(a);
const OBJ_KEYS = S(["terminal", "workbench", "vending", "medst", "capsule", "charger", "crate", "locker", "safe", "desk", "pc", "coffee", "drinks", "corpse", "magnetron", "positron", "implantlab", "radio", "okoterm", "puzzle"]);
const LOOT = S(["arms", "med", "parts", "tech", "bio", "chem", "food", "paper", "armor"]);
const ROOM_AMB = S(["room_server", "room_radio", "room_generator", "room_transformer", "room_magnetron", "room_electric", "room_hum", "room_cryo", "room_compressor", "room_drip", "room_bubbles", "room_pumps", "room_creatures", "room_incubator", "room_factory", "room_ring", "room_reactor", "room_fridge", "room_fountain", "room_medical"]);
const LEVEL_AMB = S(Array.from({ length: 10 }, (_, i) => "amb_l" + (i + 1)));
const EV = S(["ev_metal_groan", "ev_vent_rattle", "ev_far_door", "ev_far_scream", "ev_pipe_knock", "ev_robot_far", "ev_drip", "ev_skitter", "ev_cry", "ev_bubbles", "ev_rustle", "ev_far_roar", "ev_steam", "ev_glass", "ev_heart", "ev_servo", "ev_factory_clank", "ev_alarm_far", "ev_electric", "ev_transformer", "ev_far_boom", "ev_ice_crack", "ev_wind", "ev_far_shots", "ev_ring_whine", "ev_phase", "ev_rift_pulse", "ev_whisper"]);
const SURF_BASE = S(["plate", "sheet", "wetmetal", "steel", "checker", "grate", "frost", "armor", "catwalk", "deck"]);
const BEH = S(["chase", "ranged", "stationary", "ambush", "deaf", "swarm", "blink", "regen", "poison", "slow", "web", "explode", "dooropen", "turret", "shieldally", "mines", "kamikaze", "tracker", "indirect", "relay", "splash", "summon",
  "commander", "cleaner", "camera", "builder", "drain", "mimic", "patrol", "reflect", "phaseshift", "split", "burrow", "healer", "leech", "charge", "screamer"]);
const ADT = S(["phys", "energy", "shock", "chem", "therm", "field", "sonic"]);
const KIND = S(["bio", "mech", "anom"]);
const FOE_SND = S(["rat", "roach", "labmut", "slug", "vine", "spore", "swamp", "chimera", "lizard", "weaver", "blind", "spark", "frozen", "thawed", "soldier", "phase", "proto", "drone", "spiderbot", "repairbot", "turret", "guardbot", "android", "watcher", "shieldbot", "sapper", "hunter", "mortar", "relay", "micro", "titan"]);
const W_SND = S(["w_melee", "w_shock", "w_vibro", "w_cutter", "w_blaster_s", "w_blaster_p", "w_blaster_h", "w_laser", "w_ion", "w_plasma", "w_magnetron", "w_magnetron_r", "w_resonator", "w_positron", "w_pcannon", "w_gauss", "w_cryo", "w_thermo"]);
const W_CLS = S(["melee", "blaster", "laser", "ion", "plasma", "magnetron", "positron", "gauss", "cryo", "thermo", "sonic", "bio", "phase", "nano", "grav"]);
const DT = S(["kinetic", "shock", "energy", "laser", "ion", "plasma", "magnetron", "positron", "gauss", "cryo", "thermo", "emp", "sonic", "bio", "phase", "nano", "grav"]);
const ARMOR_SPECIAL = S(["antitox", "deflect", "stealth", "frost", "strength", "regshield", "sonicguard", "okoghost", "thorns", "phaseveil"]);
/* (3.7) gren — граната с уроном и действием (combat.throwGrenade), как у арсенала: гравитационная граната блока V */
const ITEM_FX = S(["heal", "en", "cure", "unslow", "shield", "haste", "cloak", "antitox", "map", "scan", "emp", "noise", "deploy", "jam", "pick", "mend", "gren"]);
const ITEM_KIND = S(["use", "throw", "deploy"]);
const TRADE = S(["med", "parts", "ammo", "all"]);
const BEACON = S(["npc_eng", "npc_sci", "npc_guard", "npc_med", "npc_trade", "npc_robot"]);
const EVENT_LIKE = S(["alarm", "dark", "surge", "steam", "quake"]);
const OKO_EVENTS = ["enter", "turret_off", "turret_hack", "counter", "hack_fail", "robots", "lockdown", "alarm", "repair", "boss", "kill", "sample", "riddle", "taunt"];
const PREFIX = { 1: "g_", 2: "k_", 3: "o_", 4: "m_", 5: "i_" };
const RANGE = { 1: [11, 20], 2: [21, 40], 3: [41, 60], 4: [61, 80], 5: [81, 100] };
const TIER_RANGE = { 1: [6, 10], 2: [11, 20], 3: [21, 30], 4: [31, 40], 5: [41, 50] };
const COMMON_ROOMS = S(["cafeteria", "workroom", "headoffice", "storage", "server", "medbay", "office", "archive", "charging", "repair", "lounge", "library", "medpost", "meeting", "comms", "locker", "parts"]);

function E(b, m) { console.log(`ERR [${b}] ${m}`); errs++; }
function W(b, m) { console.log(`WARN [${b}] ${m}`); warns++; }
function str(v) { return typeof v === "string" && v.trim().length > 0; }
function num(v, a, z) { return typeof v === "number" && isFinite(v) && v >= a && v <= z; }
/* правила текстов */
function txt(b, where, s, min, max) {
  if (!str(s)) { E(b, `${where}: пустой текст`); return; }
  if (min && s.length < min) W(b, `${where}: коротко (${s.length} < ${min})`);
  if (max && s.length > max) W(b, `${where}: длинно (${s.length} > ${max})`);
  if (/Гран[ьиейю]\s+[Мм]ир/.test(s)) E(b, `${where}: «Грань Миров» — только в финале`);
  if (/Странник/.test(s)) E(b, `${where}: «Странники» — только в финале`);
  if (/(\d+|сто|двадцат\w*|сот\w*|сотн\w*)\s+(уровн|этаж)/i.test(s) && !/(втор|трет|перв|четв|пят|шест|седьм|восьм|девят|десят)\w*\s+этаж/i.test(s.match(/(\d+|сто|двадцат\w*|сот\w*|сотн\w*)\s+(уровн|этаж)\w*/i)[0])) W(b, `${where}: похоже на число уровней или этажей: «${s.match(/(\S+\s+(уровн|этаж)\w*)/i)[0]}»`);
  if (/"/.test(s)) W(b, `${where}: прямые кавычки — нужны «ёлочки»`);
  if (/[A-Za-z]{2,}/.test(s)) W(b, `${where}: латиница: «${s.match(/[A-Za-z]{2,}/)[0]}»`);
  if (/\s-\s/.test(s)) W(b, `${where}: дефис вместо тире`);
  if (/(север|юг|запад|восток)\w*\s+(от|к)\b/i.test(s)) W(b, `${where}: стороны света как направление`);
}
const stats = {};
const total = { chars: 0 };
function countChars(o) { if (typeof o === "string") return o.length; if (Array.isArray(o)) return o.reduce((a, x) => a + countChars(x), 0); if (o && typeof o === "object") return Object.keys(o).reduce((a, k) => a + countChars(o[k]), 0); return 0; }

for (let n = 1; n <= 5; n++) {
  if (only && n !== only) continue;
  const b = "блок " + n;
  if (!loaded[n]) { if (only) E(b, `нет файла js/b${n}.js или он не загрузился`); continue; }
  const B = LAB.BLOCKS[n];
  if (!B) { E(b, "LAB.addBlock(" + n + ", …) ни разу не вызван"); continue; }
  const [L0, L1] = RANGE[n];
  const st = stats[n] = {};
  /* meta */
  if (!str(B.name)) E(b, "meta.name пусто");
  if (B.from !== L0 || B.to !== L1) E(b, `meta.from/to должны быть ${L0}/${L1}, сейчас ${B.from}/${B.to}`);
  if (n > 1 && (!B.intro || B.intro.length < 4)) E(b, `meta.intro: нужно 5–7 страниц, есть ${(B.intro || []).length}`);
  if (n < 5 && (!B.outro || B.outro.length < 3)) E(b, `meta.outro: нужно 4–6 страниц, есть ${(B.outro || []).length}`);
  (B.intro || []).forEach((p, i) => txt(b, `intro[${i}]`, p, 80, 900));
  (B.outro || []).forEach((p, i) => txt(b, `outro[${i}]`, p, 80, 900));
  if (n === 1) { const it = B.interlude && B.interlude[10]; if (!it || it.length < 4) E(b, "meta.interlude[10]: нужно 5–7 страниц сцены у пульта «Истока»"); else it.forEach((p, i) => txt(b, `interlude[10][${i}]`, p, 80, 900)); }
  /* tiers */
  const [T0, T1] = TIER_RANGE[n];
  for (let t = T0; t <= T1; t++) {
    const T = LAB.TIERS[t];
    if (!T) { E(b, `tiers: нет пропуска ${t}`); continue; }
    if (!str(T.n) || !str(T.short)) E(b, `tiers[${t}]: нужны n и short`);
  }
  /* что блок добавил */
  const own = Object.keys(B._own || {});
  const ownOf = (k) => own.filter(x => x.indexOf(k + ":") === 0).map(x => x.slice(k.length + 1));
  const rooms = ownOf("room"), foes = ownOf("foe"), bosses = ownOf("boss"), weapons = ownOf("weapon"), items = ownOf("item"), armors = ownOf("armor"), ammo = ownOf("ammo"), surfs = ownOf("surface");
  st.rooms = rooms.length; st.foes = foes.length; st.bosses = bosses.length; st.weapons = weapons.length; st.items = items.length; st.armors = armors.length; st.ammo = ammo.length; st.surfaces = surfs.length;
  [["помещение", rooms], ["враг", foes], ["страж", bosses], ["оружие", weapons], ["предмет", items], ["броня", armors], ["батареи", ammo], ["пол", surfs]].forEach(([w, list]) => list.forEach(id => {
    if (!/^[a-z][a-z0-9_]*$/.test(id)) E(b, `${w} «${id}»: идентификатор — латиница в нижнем регистре, цифры, _`);
    if (id.indexOf(PREFIX[n]) !== 0) W(b, `${w} «${id}»: без приставки ${PREFIX[n]}`);
  }));
  surfs.forEach(id => { const s = LAB.SURF[id]; if (!str(s.n)) E(b, `пол ${id}: нет n`); if (!SURF_BASE.has(s.base)) E(b, `пол ${id}: base «${s.base}» не из списка`); if (!num(s.rate, 0.75, 1.3)) E(b, `пол ${id}: rate 0.8–1.25`); });
  rooms.forEach(id => {
    const r = LAB.ROOMS[id];
    txt(b, `room ${id}.n`, r.n, 3, 60); txt(b, `room ${id}.desc`, r.desc, 40, 320);
    for (const k in (r.obj || {})) { if (!OBJ_KEYS.has(k)) E(b, `room ${id}: obj «${k}» не из списка`); if (!num(r.obj[k], 0.01, 1)) E(b, `room ${id}: obj.${k} — вероятность 0.05–1`); }
    if (r.loot && !LOOT.has(r.loot)) E(b, `room ${id}: loot «${r.loot}» не из списка`);
    if (r.amb && !ROOM_AMB.has(r.amb)) E(b, `room ${id}: amb «${r.amb}» не из списка`);
    if (!r.amb) W(b, `room ${id}: нет amb`);
    if (r.sign != null && !(typeof r.sign === "string" || (Array.isArray(r.sign) && r.sign.every(str)))) E(b, `room ${id}: sign — строка или массив строк`);
    if (r.special) E(b, `room ${id}: special — только для служебных помещений игры`);
    const lg = LAB.LORE.logs[id]; if (!lg || lg.length < 2) W(b, `room ${id}: нет двух строк журнала испытаний (logs)`); else lg.forEach((x, i) => txt(b, `logs.${id}[${i}]`, x, 40, 400));
  });
  let mech = 0;
  foes.forEach(id => {
    const f = LAB.FOES[id];
    txt(b, `foe ${id}.n`, f.n, 3, 50); txt(b, `foe ${id}.desc`, f.desc, 40, 360);
    if (!["m", "f", "n"].includes(f.g)) E(b, `foe ${id}: g — m, f или n`);
    if (!KIND.has(f.kind)) E(b, `foe ${id}: kind — bio, mech или anom`);
    if (f.kind === "mech") mech++;
    if (!num(f.hp, 6, 260)) E(b, `foe ${id}: hp 10–180`);
    if (!num(f.dmg, 0, 30)) E(b, `foe ${id}: dmg 3–24`);
    if (!num(f.arm, 0, 22)) E(b, `foe ${id}: arm 0–18`);
    if (!(num(f.spd, 1, 3) || f.spd === 99)) E(b, `foe ${id}: spd 1–3 или 99`);
    if (!num(f.rng, 0, 10)) E(b, `foe ${id}: rng 1–9`);
    if (!(num(f.acd, 1, 4) || f.acd === 99)) E(b, `foe ${id}: acd 1–4`);
    if (!num(f.det, 2, 11)) E(b, `foe ${id}: det 3–10`);
    if (!num(f.xp, 4, 90)) E(b, `foe ${id}: xp 8–70`);
    if (!Array.isArray(f.beh) || !f.beh.length) E(b, `foe ${id}: beh — массив`); else f.beh.forEach(x => { if (!BEH.has(x)) E(b, `foe ${id}: beh «${x}» не из списка`); });
    if (f.beh && f.beh.includes("turret") && !(f.beh.includes("stationary") && f.beh.includes("ranged") && f.kind === "mech")) E(b, `foe ${id}: turret — только с stationary и ranged, kind mech`);
    if (f.beh && f.beh.includes("stationary") && f.spd !== 99) E(b, `foe ${id}: stationary — spd 99`);
    if (f.beh && f.beh.includes("camera") && !f.beh.includes("stationary")) E(b, `foe ${id}: camera — с stationary`);
    if (f.beh && f.beh.includes("ranged") && f.rng < 2) E(b, `foe ${id}: ranged — rng от 2`);
    if (f.beh && f.beh.includes("chase") && f.beh.includes("ranged")) W(b, `foe ${id}: chase и ranged вместе — враг будет стрелком`);
    if (!ADT.has(f.adt)) E(b, `foe ${id}: adt «${f.adt}» не из списка`);
    if (!FOE_SND.has(f.snd)) E(b, `foe ${id}: snd «${f.snd}» не из списка`);
    if (f.sndRate != null && !num(f.sndRate, 0.6, 1.5)) E(b, `foe ${id}: sndRate 0.7–1.4`);
    for (const k in (f.res || {})) { if (!DT.has(k)) E(b, `foe ${id}: res.${k} — не вид урона`); if (!num(f.res[k], 0.1, 2.5)) E(b, `foe ${id}: res.${k} 0.2–2`); }
  });
  if (foes.length && mech < foes.length * (n === 4 ? 0.75 : 0.5)) W(b, `роботов ${mech} из ${foes.length} — нужно ${n === 4 ? "почти все" : "не меньше половины"}`);
  st.mech = mech;
  bosses.forEach(id => {
    const x = LAB.BOSSES[id];
    txt(b, `boss ${id}.n`, x.n, 3, 60); txt(b, `boss ${id}.desc`, x.desc, 40, 420);
    if (!LAB.FOES[x.base]) E(b, `boss ${id}: base «${x.base}» — нет такого врага`);
    if (!["m", "f", "n"].includes(x.g)) E(b, `boss ${id}: g`);
    if (!num(x.mult, 3, 9)) E(b, `boss ${id}: mult 4–8`);
    (x.beh || []).forEach(q => { if (!BEH.has(q)) E(b, `boss ${id}: beh «${q}»`); });
    if (x.snd && !FOE_SND.has(x.snd)) E(b, `boss ${id}: snd «${x.snd}»`);
    if (x.minion && !LAB.FOES[x.minion]) E(b, `boss ${id}: minion «${x.minion}» — нет такого врага`);
    if ((x.beh || []).includes("summon") && !x.minion) W(b, `boss ${id}: summon без minion — позовёт крыс`);
  });
  /* уровни */
  const usedBoss = {};
  for (let L = L0; L <= L1; L++) {
    const lv = LAB.LEVELS[L];
    if (!lv) { E(b, `уровень ${L}: нет`); continue; }
    txt(b, `level ${L}.name`, lv.name, 3, 50); txt(b, `level ${L}.gen`, lv.gen, 3, 60); txt(b, `level ${L}.desc`, lv.desc, 80, 500);
    if (!/Под ногами/.test(lv.desc || "")) W(b, `level ${L}.desc: нет фразы о поле «Под ногами — …»`);
    if (!LAB.SURF[lv.surf]) E(b, `level ${L}: surf «${lv.surf}» — нет такого пола`);
    if (lv.card !== "boss" && lv.card !== "hidden") E(b, `level ${L}: card — boss или hidden`);
    if (!LEVEL_AMB.has(lv.amb)) E(b, `level ${L}: amb — amb_l1 … amb_l10`);
    if (!Array.isArray(lv.ev) || lv.ev.length < 3) E(b, `level ${L}: ev — 4–7 далёких звуков`); else lv.ev.forEach(x => { if (!EV.has(x)) E(b, `level ${L}: ev «${x}» не из списка`); });
    if (!Array.isArray(lv.rooms) || lv.rooms.length < 10) E(b, `level ${L}: rooms — 12–18 типов, есть ${(lv.rooms || []).length}`);
    (lv.rooms || []).forEach(r => { if (!LAB.ROOMS[r]) E(b, `level ${L}: помещения «${r}» нет`); else if (LAB.ROOMS[r].special) E(b, `level ${L}: «${r}» — служебное помещение`); });
    if (!Array.isArray(lv.foes) || lv.foes.length < 5) E(b, `level ${L}: foes — 6–9 врагов`);
    (lv.foes || []).forEach(f => { if (!LAB.FOES[f]) E(b, `level ${L}: врага «${f}» нет`); });
    const lm = (lv.foes || []).filter(f => LAB.FOES[f] && LAB.FOES[f].kind === "mech").length;
    if (lm < 2) W(b, `level ${L}: роботов в списке врагов ${lm}`);
    if (!LAB.BOSSES[lv.boss]) E(b, `level ${L}: стража «${lv.boss}» нет`);
    if (usedBoss[lv.boss]) E(b, `level ${L}: страж «${lv.boss}» уже стоит на уровне ${usedBoss[lv.boss]}`); usedBoss[lv.boss] = L;
    if (lv.tier !== Math.ceil(L / 2)) W(b, `level ${L}: tier ${lv.tier}, ожидается ${Math.ceil(L / 2)}`);
    /* тексты уровня */
    LAB.STORY_FLOORS_B.forEach(F => {
      const s = LAB.STORY[L + "-" + F];
      if (!s) { E(b, `story «${L}-${F}» нет`); return; }
      txt(b, `story ${L}-${F}.t`, s.t, 3, 80); txt(b, `story ${L}-${F}.a`, s.a, 2, 60); txt(b, `story ${L}-${F}.x`, s.x, 200, 1300);
    });
    const nl = (LAB.NOTES_L || {})[L] || [];
    if (nl.length < 5) E(b, `notes[${L}]: 5–6 записок, есть ${nl.length}`);
    nl.forEach((q, i) => { txt(b, `notes[${L}][${i}].t`, q.t, 3, 80); txt(b, `notes[${L}][${i}].a`, q.a, 2, 60); txt(b, `notes[${L}][${i}].x`, q.x, 80, 800); });
    const ml = LAB.LORE.mail[L] || [];
    if (ml.length < 3) E(b, `mail[${L}]: 3 переписки, есть ${ml.length}`);
    ml.forEach((th, i) => {
      if (!str(th.o) || !str(th.s) || !Array.isArray(th.m) || th.m.length < 1) { E(b, `mail[${L}][${i}]: нужны o, s, m`); return; }
      th.m.forEach((mm, j) => { if (!Array.isArray(mm) || mm.length !== 3 || !str(mm[0]) || !(mm[1] === null || str(mm[1]))) E(b, `mail[${L}][${i}].m[${j}]: [от кого, тема или null, текст]`); else txt(b, `mail[${L}][${i}].m[${j}]`, mm[2], 30, 700); });
    });
    const dc = LAB.LORE.docs[L] || [];
    if (dc.length < 2) E(b, `docs[${L}]: 2 документа, есть ${dc.length}`);
    dc.forEach((d, i) => { txt(b, `docs[${L}][${i}].t`, d.t, 3, 80); txt(b, `docs[${L}][${i}].x`, d.x, 60, 900); });
    const cm = LAB.LORE.cams[L] || [];
    if (cm.length < 3) E(b, `cams[${L}]: 3 записи камер, есть ${cm.length}`);
    cm.forEach((c, i) => { txt(b, `cams[${L}][${i}]`, c, 40, 500); if (/^[А-ЯЁ]/.test(c)) W(b, `cams[${L}][${i}]: с маленькой буквы («камера …»)`); });
    const ps = LAB.LORE.posts[L] || [];
    if (ps.length < 4) E(b, `posts[${L}]: 4–6 должностей, есть ${ps.length}`);
  }
  st.levels = Object.keys(usedBoss).length;
  /* оружие и вещи */
  weapons.forEach(id => {
    const w = LAB.WEAPONS[id];
    txt(b, `weapon ${id}.n`, w.n, 3, 60); txt(b, `weapon ${id}.desc`, w.desc, 30, 300);
    if (/^[А-ЯЁ]/.test(w.n)) W(b, `weapon ${id}.n: с маленькой буквы (перед ним встанет «Рабочий», «Добротный»…)`);
    if (!["m", "f", "n"].includes(w.g)) E(b, `weapon ${id}: g`);
    if (!W_CLS.has(w.cls)) E(b, `weapon ${id}: cls «${w.cls}»`);
    if (!(w.ammo === "none" || LAB.AMMO[w.ammo])) E(b, `weapon ${id}: ammo «${w.ammo}» — нет таких батарей`);
    if (!DT.has(w.dt)) E(b, `weapon ${id}: dt «${w.dt}»`);
    if (!num(w.dmg, 5, 70)) E(b, `weapon ${id}: dmg 7–60`);
    if (!num(w.rng, 1, 12)) E(b, `weapon ${id}: rng 1–12`);
    if (!(w.spread === 0 || w.spread === 1)) E(b, `weapon ${id}: spread 0 или 1`);
    if (!num(w.cap, 0, 30)) E(b, `weapon ${id}: cap 0–24`);
    if (w.ammo !== "none" && !w.cap) E(b, `weapon ${id}: с батареями нужен cap`);
    if (!num(w.cd, 250, 1600)) E(b, `weapon ${id}: cd 280–1500`);
    if (!W_SND.has(w.snd)) E(b, `weapon ${id}: snd «${w.snd}»`);
    if (w.sndRate != null && !num(w.sndRate, 0.6, 2.2)) E(b, `weapon ${id}: sndRate`); /* до 2.2 — бесшумные пневмовыстрелы («пф»), как дротики и самострел */
    if (!str(w.model)) E(b, `weapon ${id}: model`);
    if (!num(w.depth, L0, L1)) E(b, `weapon ${id}: depth ${L0}–${L1}`);
  });
  ammo.forEach(id => { const a = LAB.AMMO[id]; txt(b, `ammo ${id}.n`, a.n, 3, 50); txt(b, `ammo ${id}.desc`, a.desc, 20, 300); if (!num(a.price, 5, 900)) E(b, `ammo ${id}: price`); if (!num(a.depth, L0, L1)) E(b, `ammo ${id}: depth`); if (!str(a.icon)) W(b, `ammo ${id}: icon`); });
  items.forEach(id => {
    const it = LAB.ITEMS[id];
    txt(b, `item ${id}.n`, it.n, 3, 50); txt(b, `item ${id}.desc`, it.desc, 15, 300);
    if (!num(it.price, 1, 2000)) E(b, `item ${id}: price`);
    if (it.kind === "part") { if (!num(LAB.PART_DEPTH[id], L0, L1)) E(b, `part ${id}: depth ${L0}–${L1}`); return; }
    if (!ITEM_KIND.has(it.kind)) E(b, `item ${id}: kind — use, throw, deploy`);
    if (!num(it.depth, L0, L1)) E(b, `item ${id}: depth ${L0}–${L1}`);
    if (!it.fx || !Object.keys(it.fx).length) E(b, `item ${id}: нет fx`); else for (const k in it.fx) if (!ITEM_FX.has(k)) E(b, `item ${id}: fx.${k} не из списка`);
    if (it.fx && (it.fx.emp || it.fx.noise) && it.kind !== "throw") E(b, `item ${id}: emp и noise — kind throw`);
    if (it.fx && it.fx.deploy && it.kind !== "deploy") E(b, `item ${id}: deploy — kind deploy`);
    if (it.fx && it.fx.gren && (it.kind !== "throw" || !it.fx.gren.dt || !num(it.fx.gren.dmg, 0, 80) || !num(it.fx.gren.r, 0, 3))) E(b, `item ${id}: gren — kind throw, dt, dmg 0–80, r 0–3`);
  });
  const rcs = LAB.RECIPES.filter(r => (r.minL || 0) >= L0 && (r.minL || 0) <= L1 && r.id.indexOf(PREFIX[n]) === 0);
  st.recipes = rcs.length;
  LAB.RECIPES.filter(r => r.id.indexOf(PREFIX[n]) === 0).forEach(r => {
    if (!str(r.n)) E(b, `recipe ${r.id}: n`);
    const o = String(r.out);
    const ok = o.indexOf("ammo:") === 0 ? !!LAB.AMMO[o.slice(5)] : o.indexOf("armor:") === 0 ? !!LAB.ARMORS[o.slice(6)] : o.indexOf("weapon:") === 0 ? !!LAB.WEAPONS[o.slice(7)] : !!LAB.ITEMS[o] || o === "wmod";
    if (!ok) E(b, `recipe ${r.id}: out «${o}» — нет такой вещи`);
    for (const k in r.need) { if (!LAB.ITEMS[k] && !CHEM_FAM.has(k)) E(b, `recipe ${r.id}: need.${k} — нет такой детали или предмета`); if (!num(r.need[k], 1, 12)) E(b, `recipe ${r.id}: need.${k} 1–12`); }
    if (!num(r.minL || 0, L0, L1)) E(b, `recipe ${r.id}: minL ${L0}–${L1}`);
  });
  armors.forEach(id => {
    const a = LAB.ARMORS[id];
    txt(b, `armor ${id}.n`, a.n, 3, 60); txt(b, `armor ${id}.desc`, a.desc, 30, 300);
    if (/^[А-ЯЁ]/.test(a.n)) W(b, `armor ${id}.n: с маленькой буквы`);
    if (!["m", "f", "n"].includes(a.g)) E(b, `armor ${id}: g`);
    if (!num(a.def, 8, 40)) E(b, `armor ${id}: def`);
    for (const k in (a.res || {})) { if (!ADT.has(k)) E(b, `armor ${id}: res.${k}`); if (!num(a.res[k], 0.04, 0.7)) E(b, `armor ${id}: res.${k} 0.05–0.6`); }
    if (a.special && !ARMOR_SPECIAL.has(a.special)) E(b, `armor ${id}: special «${a.special}»`);
    if (!num(a.depth, L0, L1)) E(b, `armor ${id}: depth ${L0}–${L1}`);
    if (!num(a.price, 50, 5000)) E(b, `armor ${id}: price`);
  });
  /* общие тексты блока */
  st.staff = B.staff.length; if (B.staff.length < (n === 1 ? 15 : 25)) E(b, `staff: ${n === 1 ? 20 : 30} записок, есть ${B.staff.length}`);
  B.staff.forEach((q, i) => { txt(b, `staff[${i}].t`, q.t, 3, 80); txt(b, `staff[${i}].a`, q.a, 2, 60); txt(b, `staff[${i}].x`, q.x, 80, 800); });
  st.mailG = B.mailG.length; if (B.mailG.length < (n === 1 ? 5 : 8)) E(b, `mail.g: ${n === 1 ? 6 : 10} общих переписок, есть ${B.mailG.length}`);
  B.notices.forEach((x, i) => { if (!Array.isArray(x) || x.length !== 3) E(b, `notices[${i}]: [кто, тема, текст]`); else txt(b, `notices[${i}]`, x[2], 40, 600); });
  if (B.notices.length < (n === 1 ? 5 : 7)) E(b, `notices: ${n === 1 ? 6 : 8}, есть ${B.notices.length}`);
  st.riddles = B.riddles.length; if (B.riddles.length < (n === 1 ? 10 : 15)) E(b, `riddles: ${n === 1 ? 12 : 15}–20, есть ${B.riddles.length}`);
  B.riddles.forEach((r, i) => {
    txt(b, `riddles[${i}].q`, r.q, 15, 300);
    if (!Array.isArray(r.a) || r.a.length !== 4 || !r.a.every(str)) E(b, `riddles[${i}].a: четыре варианта, первый — верный`);
    else if (new Set(r.a.map(s => s.toLowerCase())).size !== 4) E(b, `riddles[${i}].a: варианты повторяются`);
    txt(b, `riddles[${i}].hint`, r.hint, 10, 300);
  });
  st.rumors = B.rumors.length; if (B.rumors.length < (n === 1 ? 8 : 10)) E(b, `rumors: 10–12, есть ${B.rumors.length}`);
  B.rumors.forEach((x, i) => txt(b, `rumors[${i}]`, x, 20, 400));
  OKO_EVENTS.forEach(k => { const a = B.oko[k] || []; if (a.length < 3) E(b, `oko.${k}: 3–6 реплик, есть ${a.length}`); a.forEach((x, i) => txt(b, `oko.${k}[${i}]`, x, 10, 400)); });
  const pk = Object.keys(B.profs); st.profs = pk.length; if (pk.length < 2) E(b, `profs: 2–5 профессий`);
  pk.forEach(k => { const p = B.profs[k]; if (p.trade != null && !TRADE.has(p.trade)) E(b, `profs «${k}»: trade`); if (!BEACON.has(p.beacon)) E(b, `profs «${k}»: beacon`); if (!Array.isArray(p.stories) || p.stories.length < 3) E(b, `profs «${k}»: 3–5 реплик`); else p.stories.forEach((x, i) => txt(b, `profs «${k}»[${i}]`, x, 20, 400)); });
  if (B.life.length < 6) E(b, `life: 8`); if (B.view.length < 6) E(b, `view: 8`);
  B.life.forEach((x, i) => { txt(b, `life[${i}]`, x, 10, 160); if (/^[А-ЯЁ]/.test(x)) W(b, `life[${i}]: с маленькой буквы («потерял…»)`); });
  B.view.forEach((x, i) => txt(b, `view[${i}]`, x, 10, 200));
  const rn = Object.keys(LAB.ROBOT_NPC).filter(k => LAB.ROBOT_NPC[k].block === n);
  if (!rn.length) E(b, "robotNpc: 1–2 дружелюбных робота");
  rn.forEach(k => { const r = LAB.ROBOT_NPC[k]; if (r.trade != null && !TRADE.has(r.trade)) E(b, `robotNpc ${k}: trade`); if ((LAB.ROBOT_LINES[k] || []).length < 3) E(b, `robotNpc ${k}: 3+ реплик`); });
  if (B.events.length < 2) E(b, "events: 2–3 события");
  B.events.forEach(e => { if (!str(e.id) || !str(e.n) || !str(e.desc) || !num(e.w, 1, 40) || !EVENT_LIKE.has(e.like)) E(b, `events «${e.id}»: id, n, desc, w, like`); });
  st.chars = countChars(B) + rooms.concat(foes, bosses, weapons, items, armors).reduce((a, id) => a + countChars(LAB.ROOMS[id] || LAB.FOES[id] || LAB.BOSSES[id] || LAB.WEAPONS[id] || LAB.ITEMS[id] || LAB.ARMORS[id]), 0);
  for (let L = L0; L <= L1; L++) st.chars += countChars(LAB.LORE.mail[L]) + countChars(LAB.LORE.docs[L]) + countChars(LAB.LORE.cams[L]) + countChars((LAB.NOTES_L || {})[L]) + LAB.STORY_FLOORS_B.reduce((a, F) => a + countChars(LAB.STORY[L + "-" + F]), 0);
  total.chars += st.chars;
}
console.log("");
for (const n in stats) console.log(`блок ${n}: ` + Object.keys(stats[n]).map(k => k + " " + stats[n][k]).join(", "));
console.log(`\nошибок: ${errs}, замечаний: ${warns}`);
process.exit(errs ? 1 : 0);
