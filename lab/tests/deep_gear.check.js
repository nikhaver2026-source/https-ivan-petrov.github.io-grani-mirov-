#!/usr/bin/env node
/* Проверка снаряжения и прокачки глубин (после 4.1): кибернетика (implants.js), ловушки и ловушечное
   дело (traps.js), химия (chem.js, chemlab.js), модули, детали и оснастка мастерской (workshop.js).
   Проверяется:
   • синтаксис моих файлов — не новее ES2017 (без стрелок, let, const и шаблонных строк);
   • уровни 1–100 не меняются: прежние таблицы и формулы (импланты, чипы, модификации, ловушки, модули,
     ступени оснастки, рецепты, детали, вещи, химия, столы, верстаки, станции, находки) — те же, что до
     глубин (слепок прежних файлов вписан ниже: ids и хэши);
   • всё новое — только ниже сотого уровня, у каждой вещи есть название, описание, цена и глубина
     появления; детали существуют; рецепты собираются из существующих деталей; ступени растут монотонно;
   • каждое действие существует и срабатывает на заглушке героя: импланты (24), чипы (24), модификации
     (11), ловушки (10), капсулы и составы (13), модули (10), оснастка (5 ступеней), ступени глубин;
   • тексты — по-русски: без латиницы, без прямых кавычек, без дефиса вместо тире.
   Запуск: node lab/tests/deep_gear.check.js. В конце — «ВСЁ ХОРОШО». */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const MINE = ["js/arms.js", "js/traps.js", "js/workshop.js", "js/implants.js", "js/arsenal.js", "js/chem.js", "js/chemlab.js"];
let fails = 0;
function err(m) { fails++; if (fails <= 80) console.error("✗ " + m); }
function ok(c, m) { if (c) console.log("  ✓ " + m); else err(m); }

/* ── 1. синтаксис ── */
console.log("Синтаксис");
let acorn = null;
for (const p of [process.env.ACORN, "acorn", "/opt/node-tools/node_modules/acorn"].filter(Boolean)) { try { acorn = require(p); break; } catch (e) { /* дальше */ } }
MINE.forEach(f => {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  try { if (acorn) acorn.parse(src, { ecmaVersion: 2017 }); else new vm.Script(src, { filename: f }); } catch (e) { err(f + ": " + e.message); return; }
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  if (/=>/.test(code)) err(f + ": стрелочная функция");
  if (/`/.test(code)) err(f + ": шаблонная строка");
  if (/(^|[^\w$.])(let|const)\s+[\w$[{]/m.test(code)) err(f + ": let или const");
});
ok(!fails, "мои файлы — ES2017 без стрелок, let, const и шаблонных строк" + (acorn ? " (acorn)" : " (Node)"));
/* имена в LAB: мои файлы не перезаписывают того, что заводят другие (как было с LAB.deepTier — пропуска глубин) */
{
  const names = f => { const s = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, ""), out = new Set(); let m; const re = /\bLAB\.([A-Za-z_$][\w$]*)\s*=(?!=)/g; while ((m = re.exec(s))) out.add(m[1]); return out; };
  const mine = new Set(); MINE.forEach(f => names(f).forEach(n => mine.add(n)));
  const clash = [];
  fs.readdirSync(path.join(ROOT, "js")).filter(f => /\.js$/.test(f) && MINE.indexOf("js/" + f) < 0).forEach(f => names("js/" + f).forEach(n => { if (mine.has(n)) clash.push(n + " (" + f + ")"); }));
  ok(!clash.length, "мои файлы не заводят в LAB имён, которые уже заводят другие" + (clash.length ? ": " + clash.join(", ") : ""));
}

/* ── 2. загрузка ── */
function seeded(s) { return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
const M = Object.create(Math); M.random = seeded(20261104);
function load(over) {
  const ctx = { console: { log() {}, warn() {}, info() {}, debug() {}, error: console.error }, Math: M, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp, Proxy, Symbol, Map, Set, setTimeout() {}, clearTimeout() {} };
  ctx.globalThis = ctx; ctx.window = ctx; vm.createContext(ctx);
  const deep = [];
  for (let n = 6; n <= 15; n++) { const f = "js/d" + n + ".js"; if (fs.existsSync(path.join(ROOT, f))) deep.push(f); }
  const files = ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/deep.js", "js/deep_texts.js", "js/deep_floor.js"].concat(deep, ["js/world.js", "js/mutants.js", "js/depths.js", "js/goods.js", "js/medic.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js", "js/chempuz.js", "js/annex_rooms.js", "js/annex_var.js", "js/annex_frag.js", "js/annex_gen.js", "js/fixtures_data.js", "js/annex_texts.js", "js/library_texts.js", "js/library.js", "js/annex.js", "js/garrison.js", "js/workshop.js", "js/repair.js", "js/implants.js", "js/arsenal.js", "js/chem.js", "js/chemlab.js", "js/kitchen.js", "js/floors.js"]);
  const owned = { items: new Set(), recipes: new Set(), parts: new Set() };
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const L0 = ctx.LAB, mine = MINE.indexOf(f) >= 0 && L0;
    const bi = mine ? new Set(Object.keys(L0.ITEMS)) : null, br = mine ? new Set(L0.RECIPES.map(r => r.id)) : null, bp = mine ? new Set(L0.PARTS) : null;
    vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
    if (bi) {
      Object.keys(ctx.LAB.ITEMS).forEach(k => { if (!bi.has(k)) owned.items.add(k); });
      ctx.LAB.RECIPES.forEach(r => { if (!br.has(r.id)) owned.recipes.add(r.id); });
      ctx.LAB.PARTS.forEach(k => { if (!bp.has(k)) owned.parts.add(k); });
    }
  }
  ctx.LAB._owned = owned;
  return ctx.LAB;
}
const LAB = load();
const IM = LAB.implants, TR = LAB.traps, C = LAB.chem, W = LAB.workshop;
ok(IM && TR && C && W && LAB.chemlab, "загружены кибернетика, ловушки, химия, работа руками и мастерская");
ok(LAB.LEVELS_N <= 100 || (LAB.TIERS[51] && typeof LAB.TIERS[51].n === "string" && typeof LAB.deepTier === "function"), "пропуска глубин (LAB.deepTier, LAB.TIERS выше пятидесятой ступени) целы");

/* ── 3. уровни 1–100 не меняются: слепок прежних таблиц ── */
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
function canon(v) {
  if (v === null || typeof v !== "object") return typeof v === "function" ? "ƒ" : JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}
function pick(o, keys) { const r = {}; keys.forEach(k => { if (o && o[k] !== undefined) r[k] = o[k]; }); return r; }
const said = [];
function stubGame(g) {
  const cur = { fl: null, fs: {}, key: "x", seen: null };
  LAB.say = function (t) { said.push(String(t)); };
  if (!LAB.safe) LAB.safe = function (fn) { return fn(); }; /* engine.js в проверке не грузится */
  LAB.ui = { menu() {}, refresh() {}, closeAll() {}, closeTop() {}, top() { return null; } }; LAB.UI = { error() {}, fanfare() {} };
  LAB.game = { G: g, CUR: cur, plural: (n, a, b, c) => { n = Math.abs(n) % 100; const m = n % 10; return n >= 11 && n <= 14 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; }, priceK: () => 1, later(fn) { laterQ.push(fn); }, relDir: () => "впереди", implantCost: id => Math.max(1, Math.round((IM.def(id).cost || 1) * IM.costK(id))), passable: () => true, floorItems: () => [], journal() {}, autoPickup() {}, roomCheck() {}, announceNear() {}, objName: o => o.type, itemName: it => it.item || it.kind, objState(o) { cur.fs.objs = cur.fs.objs || {}; return (cur.fs.objs[o.id] = cur.fs.objs[o.id] || {}); }, nearSecret: () => null, gainXP() {}, armorSpecial: () => false, hackLength: n => n, tryMove: () => false,
    bodyApply(d, msg) { const b = g.body; ["wake", "neuro", "tox", "rad"].forEach(k => { if (d[k]) b[k] = Math.max(0, Math.min(100, (b[k] || 0) + d[k])); }); if (d.detox) b.tox = Math.max(0, b.tox - d.detox); if (msg) msg.push("тело"); } };
  return cur;
}
const laterQ = [];
function heroState(L, F) { return { L: L, F: F, seed: "gear", x: 30, y: 30, face: "N", hp: 500, hpMax: 500, en: 100, enMax: 100, credits: 0, inv: {}, ammo: {}, implants: ["scan", "echo"], weapons: [], wi: 0, armors: [], armor: null, st: { poison: 0, slow: 0, shield: 0, haste: 0, cloak: 0, web: 0, jam: 0, deaf: 0, antitox: 0, bleed: 0, navjam: 0 }, body: { food: 80, wake: 80, tox: 0, neuro: 0, rad: 0 }, tut: {}, maxF: {}, stats: { kills: 0 }, bp: {} }; }
const BASE = {"ids":{"imods":["eco","soft","boost","twin","reserve","quiet","resonant","wide","long","lasting","ap","shock","thermo","cryo","chain","stun","bleed","execute","mirror","mending","grounded","tempered","deep","marker","mapper","analyst","ghost","persist","virus","antisep","purge","adren","silent","swift","capacitor","overclock","balanced"],"traps":["jaw","spikes","glue","alarm","wire","shock","mine","net","emp","lure","fire","gas","magnet","remote","claymore","cryo","acid","press","drill","quartz","resin","salt","bonebell","mirror","echo","gear","logic","roots","timeless"],"wmods":["power","acc","range","reload","cool","pierce","emp","quiet","stab"],"fam":["c_solvent","c_salt","c_blood","c_gland","c_venom","c_coolant","c_electrolyte","c_oil","c_acidc","c_alkali","c_chitin","c_spores","c_acid","c_nerve","c_fuel","c_phosphor","c_enzyme","c_catalyst","c_ecto","c_cond","c_stab","c_activ","c_perox","c_ammonia","c_bleach","c_soda","c_silver","c_iodine"],"prod":["c_antimut","c_adapt","c_controlled","c_clarity","c_regen","c_antitox","c_repel","c_coat_tox","c_coat_acid","c_toxgren","c_acidflask","c_nervegas","c_inhibit","c_fuelamp","c_coolgel","c_overcharge","c_gunoil","c_smoke","c_flash","c_cryo","c_napalm","c_thermite","c_blast","c_salve","c_bait","c_culture","c_mutagen","c_ectoserum","c_lockpaste","c_fogspray","c_corrode","c_smelling","c_antisept","c_reveal","c_devel","c_fixer"],"rc":["h_bandage","h_coagulant","h_medkit","h_painkiller","h_iodine","h_eardrops","h_calm","h_antimut","h_adrenaline","h_stim","h_antirad","h_neuroblock","h_medkit_l","h_clarity","h_regen","h_trauma","h_radaway","h_nanomed","t_antidote","t_sorbent","t_coat","t_repel","t_antitox","t_toxgren","t_acidcoat","t_acidflask","t_inhibit","t_nervegas","e_battery","e_coolgel","e_gunoil","e_fuelamp","e_overcharge","e_cells","p_smoke","p_firebomb","p_cryo","p_flash","p_thermite","p_blast","p_napalm","b_bait","b_salve","b_gel","b_adapt","b_culture","b_mutagen","b_controlled","b_ectoserum","l_smelling","l_antisept","l_reveal","l_fogspray","l_lockpaste","l_corrode","l_fixer","l_devel"],"ref":["r_neutral","r_acid","r_venom","r_gland","r_solvent","r_electro","r_chitin","r_stab","r_activ","d_chitin","d_root","d_salt","d_resin","d_wax","d_silver","d_nano","d_omega","d_fiber","p2_c_solvent","p3_c_solvent","p2_c_salt","p3_c_salt","p2_c_blood","p3_c_blood","p2_c_gland","p3_c_gland","p2_c_venom","p3_c_venom","p2_c_coolant","p3_c_coolant","p2_c_electrolyte","p3_c_electrolyte","p2_c_oil","p3_c_oil","p2_c_acidc","p3_c_acidc","p2_c_alkali","p3_c_alkali","p2_c_chitin","p3_c_chitin","p2_c_spores","p3_c_spores","p2_c_acid","p3_c_acid","p2_c_nerve","p3_c_nerve","p2_c_fuel","p3_c_fuel","p2_c_phosphor","p3_c_phosphor","p2_c_enzyme","p3_c_enzyme","p2_c_catalyst","p3_c_catalyst","p2_c_ecto","p3_c_ecto","p2_c_cond","p3_c_cond"]},"hash":{"implants":"b643fd70","implantMods":"08b0ed1b","implantItems":"01a2d42d","traps":"d894cc57","wmods":"b2a7a14c","tiers":"53d54dfd","recipes":"8d1c5c5c","parts":"e3890115","items":"37776bc2","chemFam":"1424c31a","chemProd":"51350e45","chemRC":"afd14303","chemREF":"1ed822f0","chemST":"f8515c5a","bench":"b5062e04","station":"9dbfb789","stock":"8f186dfa","trapLoot":"54fdbe63","implantMath":"153aa5a7","chemMath":"e24773df"}};
function snapshot() {
  const out = {}, ids = BASE.ids, T = (name, v) => { out[name] = fnv(canon(v)); };
  const old = (list, key) => list.filter(x => ids[key].indexOf(x) >= 0), own = LAB._owned;
  T("implants", LAB.IMPLANTS.filter(im => (im.minL || 1) <= 100).map(im => pick(im, ["id", "n", "cat", "t", "cost", "price", "minL", "fx", "st", "passive", "core", "desc"])));
  T("implantMods", old(Object.keys(IM.MODS), "imods").map(k => [k, IM.MODS[k]]));
  T("implantItems", Object.keys(LAB.ITEMS).filter(k => /^imp_/.test(k) && LAB.IMPLANTS.some(im => "imp_" + im.id === k && (im.minL || 1) <= 100)).map(k => [k, pick(LAB.ITEMS[k], ["n", "price", "desc", "kind", "cat"])]));
  T("traps", old(Object.keys(LAB.TRAPS), "traps").map(k => [k, LAB.TRAPS[k]]));
  T("wmods", old(Object.keys(W.MODS), "wmods").map(k => [k, W.MODS[k]]));
  T("tiers", W.TIER.slice(0, 6));
  T("recipes", LAB.RECIPES.filter(rc => own.recipes.has(rc.id) && (!rc.minL || rc.minL <= 100)).map(rc => pick(rc, ["id", "out", "n", "need", "cls", "minL", "bp", "cyb", "cybN", "group", "desc"])));
  T("parts", LAB.PARTS.filter(p => own.parts.has(p) && (LAB.PART_DEPTH[p] || 1) <= 100).map(p => [p, LAB.PART_DEPTH[p], pick(LAB.ITEMS[p], ["n", "price", "desc", "depth"])]));
  T("items", Object.keys(LAB.ITEMS).filter(k => { const d = LAB.ITEMS[k]; return own.items.has(k) && !(d.depth > 100) && !(LAB.PART_DEPTH[k] > 100) && !/^imp_/.test(k) && !/^v\d+_/.test(k); }).map(k => [k, pick(LAB.ITEMS[k], ["n", "price", "depth", "kind", "cat", "src", "fx"])]));
  T("chemFam", old(Object.keys(C.FAM), "fam").map(k => [k, C.FAM[k]]));
  T("chemProd", old(Object.keys(C.PROD), "prod").map(k => [k, C.PROD[k]]));
  T("chemRC", C.RC.filter(rc => ids.rc.indexOf(rc.id) >= 0));
  T("chemREF", C.REF.filter(rf => ids.ref.indexOf(rf.id) >= 0));
  T("chemST", C.ST.slice(0, 5));
  const g = { L: 1, F: 1, seed: "snap", x: 5, y: 5, face: "N", hp: 100, hpMax: 100, en: 30, enMax: 30, credits: 0, inv: {}, ammo: {}, implants: ["scan", "echo"], weapons: [], armors: [], st: {}, body: { food: 80, wake: 80, tox: 0, neuro: 0 }, tut: {}, maxF: { 1: 1 } }, cur = stubGame(g);
  const bench = [], stat = [], stock = [], tl = [];
  for (let L = 1; L <= 100; L += 3) for (const F of [1, 7, 14, 20]) {
    g.L = L; g.F = F; cur.fs = {};
    for (const id of [1, 5, 9]) { const b = W.bench({ id: id, x: 1, y: 1, type: "workbench" }); bench.push([L, F, id, b.tier, b.dmg, b.spec]); }
    for (const id of [2, 6]) { const s = C.station({ id: id, x: 1, y: 1 }); stat.push([L, F, id, s.tier, s.dirty]); }
    stock.push([L, F, IM.stock({ id: 3 }).map(im => im.id).join(",")]);
    for (const tag of ["arms", "tech", "parts"]) { const r = LAB.trapLoot(L, F, 7, tag); tl.push([L, F, tag, r ? r.item : ""]); }
    tl.push([L, "shop", W.shopMin(L)]);
  }
  T("bench", bench); T("station", stat); T("stock", stock); T("trapLoot", tl);
  const pw = [];
  g.L = 50; g.F = 1; g.maxF = { 1: 1 }; g.implants = ["scan", "echo"]; g.cyber = { xp: {} }; g.impLv = {}; g.impMod = {};
  for (const xp of [0, 30, 90, 190, 340, 550, 900, 3000]) {
    IM.CAT_ORDER.forEach(c => { g.cyber.xp[c] = xp; });
    pw.push([xp, IM.level(), IM.slots(), IM.capacity(), IM.modSlots(), IM.maxGrade(), IM.selfSurgery()]);
    ["arc", "shield", "heat", "veil", "detox", "dash", "siphon", "magnet"].forEach(id => { pw.push([id, IM.catLv(IM.def(id).cat), +IM.power(id).toFixed(6), +IM.costK(id).toFixed(6), +IM.neuroK(id).toFixed(6), IM.reach(id)]); });
  }
  T("implantMath", pw);
  const ch = [];
  g.chem = { xp: {}, spec: ["pharm", "pyro"], known: {}, seen: {}, opt: {} };
  for (const xp of [0, 25, 70, 150, 270, 440, 800, 3000]) {
    ["pharm", "tox", "energy", "pyro", "bio"].forEach(b => { g.chem.xp[b] = xp; });
    ch.push([xp, C.level(), C.brLv("pharm"), C.rank("pharm"), C.rank("pyro"), +C.potK("pharm").toFixed(6), C.gradeCap("tox"), C.noOverdose()]);
  }
  T("chemMath", ch);
  return out;
}
console.log("Уровни 1–100");
{
  const s = snapshot(), diff = Object.keys(BASE.hash).filter(k => BASE.hash[k] !== s[k]);
  ok(!diff.length, "прежние таблицы и формулы до сотого — те же, что до глубин (" + Object.keys(BASE.hash).length + " слепков)" + (diff.length ? ": иначе " + diff.join(", ") : ""));
}

/* ── 4. новое: только ниже сотого, всё названо, описано, оценено ── */
console.log("Новое снаряжение");
const bad = [];
function textOk(where, t) {
  t = String(t || "");
  if (!t) { bad.push(where + ": пусто"); return; }
  if (/[A-Za-z]/.test(t)) bad.push(where + ": латиница — " + t.slice(0, 60));
  if (/"/.test(t)) bad.push(where + ": прямые кавычки");
  if (/ - /.test(t)) bad.push(where + ": дефис вместо тире");
}
const DN = IM.DEEP_NEW, DC = IM.DEEP_CHIPS;
ok(DN.length >= 24 && DC.length >= 24, "имплантов глубин " + DN.length + ", чипов глубин " + DC.length);
const cats = {};
DN.concat(DC).forEach(im => {
  cats[im.cat] = (cats[im.cat] || 0) + 1;
  textOk("имплант " + im.id, im.n); textOk("имплант " + im.id, im.desc);
  if (!(im.price > 0) || !(im.minL > 100) || im.minL !== IM.blockFrom(im.blk)) bad.push("имплант " + im.id + ": цена " + im.price + ", глубина " + im.minL);
  const it = LAB.ITEMS["imp_" + im.id];
  if (!it || !(it.price > 0) || !(it.depth > 100) || !it.desc) bad.push("вещь импланта " + im.id);
  const rc = LAB.RECIPES.find(r => r.id === "imp_" + im.id);
  if (!rc) bad.push("нет схемы импланта " + im.id);
  else {
    if (!(rc.minL >= im.minL) || !rc.deep || rc.cls !== "syn" || !(rc.deepT >= 6) || !rc.bp) bad.push("схема " + rc.id + ": " + JSON.stringify(pick(rc, ["minL", "deep", "cls", "deepT", "bp"])));
    for (const k in rc.need) if (!LAB.ITEMS[k]) bad.push("схема " + rc.id + ": нет детали " + k); else if ((LAB.PART_DEPTH[k] || LAB.ITEMS[k].depth || 1) > rc.minL) bad.push("схема " + rc.id + ": деталь " + k + " глубже схемы");
  }
});
ok(Object.keys(IM.CATS).every(c => (cats[c] || 0) >= 6), "по всем восьми направлениям — по три импланта и по три чипа и больше");
const MODS = Object.keys(IM.DEEP_MODS);
ok(MODS.length >= 10, "модификаций глубин: " + MODS.length);
MODS.forEach(m => { const M0 = IM.MODS[m]; textOk("модификация " + m, M0.n); textOk("модификация " + m, M0.d); if (!(M0.need >= 6)) bad.push("модификация " + m + ": ступень " + M0.need); for (const k in M0.cost) if (!LAB.ITEMS[k]) bad.push("модификация " + m + ": нет детали " + k); });
const TD = TR.DEEP_T;
ok(Object.keys(TD).length >= 10, "ловушек глубин: " + Object.keys(TD).length);
Object.keys(TD).forEach(k => {
  const d = LAB.TRAPS[k], it = LAB.ITEMS["tr_" + k], rc = LAB.RECIPES.find(r => r.id === "t_" + k);
  textOk("ловушка " + k, d.n); textOk("ловушка " + k, d.d); if (d.hit) textOk("ловушка " + k, d.hit);
  if (!(d.depth > 100) || !(d.price > 0) || !it || !(it.depth > 100)) bad.push("ловушка " + k + ": глубина или цена");
  if (!rc || !(rc.minL > 100) || !rc.trapN || !rc.deep) bad.push("ловушка " + k + ": схема");
  else for (const p in rc.need) if (!LAB.ITEMS[p]) bad.push("ловушка " + k + ": нет детали " + p);
});
const DP = C.DEEP_PROD, DF = C.DEEP_FAM;
ok(Object.keys(DF).length >= 6 && Object.keys(DP).length >= 12, "сырья глубин " + Object.keys(DF).length + ", капсул и составов глубин " + Object.keys(DP).length + " (капсул " + Object.keys(DP).filter(k => DP[k].cat === "med").length + ")");
Object.keys(DF).forEach(f => {
  textOk("сырьё " + f, DF[f].desc); textOk("сырьё " + f, DF[f].src); DF[f].n.forEach(n => textOk("сырьё " + f, n));
  [1, 2, 3].forEach(gr => { const id = C.matId(f, gr, false), it = LAB.ITEMS[id]; if (!it || !(it.price > 0) || !(it.depth > 100)) bad.push("сырьё " + id); });
  if (!C.RC.some(rc => rc.need[f]) && !C.REF.some(rf => rf.need[f] && !rf.pur)) bad.push("сырьё " + f + ": ни во что не идёт");
});
Object.keys(DP).forEach(b => {
  const P = DP[b]; textOk("состав " + b, P.n);
  [1, 2, 3].forEach(gr => { const it = LAB.ITEMS[C.prodId(b, gr, "")]; if (!it || !(it.price > 0) || !(it.depth > 100)) bad.push("состав " + b + " сорт " + gr); else textOk("состав " + b, it.desc); });
  if (!C.RC.some(rc => rc.out === b && rc.deep)) bad.push("состав " + b + ": нет рецептуры");
});
C.DEEP_RC.forEach(rc => { if (!C.outOk(rc)) bad.push("рецептура " + rc.id); for (const k in rc.need) if (!LAB.ITEMS[k] && !C.FAM[k]) bad.push("рецептура " + rc.id + ": нет " + k); if (!(rc.lv >= 5)) bad.push("рецептура " + rc.id + ": ступень " + rc.lv); });
C.DEEP_REF.forEach(rf => { for (const k in rf.need) if (!LAB.ITEMS[k]) bad.push("переработка " + rf.id + ": нет " + k); for (const k in rf.give) if (!LAB.ITEMS[k]) bad.push("переработка " + rf.id + ": нет " + k); });
const DPA = W.DEEP_PARTS, DMO = W.DEEP_MODS;
ok(Object.keys(DPA).length >= 6 && Object.keys(DMO).length >= 10, "деталей Нижних " + Object.keys(DPA).length + ", модулей оружия глубин " + Object.keys(DMO).length);
Object.keys(DPA).forEach(k => {
  const it = LAB.ITEMS[k], pd = LAB.PART_DEPTH[k];
  textOk("деталь " + k, it && it.n); textOk("деталь " + k, it && it.desc); textOk("деталь " + k, W.srcOf(k));
  if (!it || it.kind !== "part" || !(pd > 100) || !(it.price > 0)) bad.push("деталь " + k);
  if (!LAB.RECIPES.some(rc => rc.out === k)) bad.push("деталь " + k + ": её не собрать");
  const R = LAB.blockRange(LAB.blockOf(pd)), ahead = Math.max(5, Math.round(R.size / 4));
  if (!LAB.RECIPES.some(rc => rc.need && rc.need[k] && !(rc.minL > pd + ahead))) bad.push("деталь " + k + ": не нужна в своём блоке");
});
Object.keys(DMO).forEach(k => {
  const M0 = W.MODS[k], it = LAB.ITEMS[M0.item], rc = LAB.RECIPES.find(r => r.out === M0.item);
  textOk("модуль " + k, M0.n); textOk("модуль " + k, M0.desc);
  if (!it || !(it.depth > 100) || !(it.price > 0) || it.kind !== "wmodule") bad.push("модуль " + k);
  if (!rc || !(rc.minL > 100) || rc.cls !== "syn" || !(rc.deepT >= 6)) bad.push("модуль " + k + ": схема");
  else for (const p in rc.need) if (!LAB.ITEMS[p]) bad.push("модуль " + k + ": нет детали " + p);
});
for (let t = 6; t <= 10; t++) { const T0 = W.TIER[t]; if (!T0) bad.push("нет ступени оснастки " + t); else { textOk("оснастка " + t, T0.n); textOk("оснастка " + t, T0.d); } }
/* всё, что добавили мои файлы ниже сотого: рецепты с minL > 100, вещи с глубиной > 100 */
LAB.RECIPES.filter(rc => rc.deep).forEach(rc => { if (!(rc.minL > 100)) bad.push("рецепт глубин " + rc.id + " выше сотого"); if (["base", "spec", "exp", "cnc", "syn"].indexOf(W.clsOf(rc)) < 0 || !(W.tierOf(rc) >= 6)) bad.push("рецепт " + rc.id + ": класс " + rc.cls + ", оснастка " + rc.deepT); for (const k in rc.need) if (!LAB.ITEMS[k]) bad.push("рецепт " + rc.id + ": нет " + k); });
[...LAB._owned.items].forEach(k => { const d = LAB.ITEMS[k]; if (d.depth > 100 || LAB.PART_DEPTH[k] > 100) { if (!(d.price > 0)) bad.push("вещь " + k + " без цены"); textOk("вещь " + k, d.n); textOk("вещь " + k, d.desc); } });
ok(!bad.length, "у каждой вещи — название, описание, цена и глубина ниже сотого; рецепты — из существующих деталей; тексты по-русски" + (bad.length ? ":\n    " + bad.slice(0, 25).join("\n    ") : ""));

/* ── 5. ступени ── */
console.log("Ступени");
const mono = a => a.every((v, i) => i === 0 || v > a[i - 1]);
ok(mono(IM.CAT_XP) && IM.CAT_XP.length === 16 && mono(IM.ALL_XP) && IM.ALL_XP.length === 20, "кибернетика: направление до пятнадцатой, общая до двадцатой, опыт растёт");
ok(mono(C.BR_XP) && C.BR_XP.length === 11 && mono(C.ALL_XP) && C.ALL_XP.length === 15, "химия: направление до десятой, общая до пятнадцатой, опыт растёт");
ok(mono(TR.TRAP_XP) && TR.TRAP_XP.length === 11 && TR.TRAP_PERK.slice(1).every(Boolean), "ловушечное дело: десять ступеней, опыт растёт, у каждой — своя польза");
{
  const perksOk = [];
  for (let n = 6; n <= 15; n++) if (!IM.catPerk(n)) perksOk.push("направление " + n);
  for (let n = 11; n <= 20; n++) if (!/\S/.test(IM.allPerk(n))) perksOk.push("общая " + n);
  for (let n = 11; n <= 15; n++) if (!C.levelPerk(n)) perksOk.push("химия " + n);
  ok(!perksOk.length, "у каждой ступени глубин — понятная польза" + (perksOk.length ? ": нет у " + perksOk.join(", ") : ""));
  const g = heroState(50, 1); stubGame(g); g.cyber = { xp: {} }; IM.CAT_ORDER.forEach(c => { g.cyber.xp[c] = 99999; }); g.chem = { xp: { pharm: 99999, tox: 99999, energy: 99999, pyro: 99999, bio: 99999 }, spec: ["pharm", "bio"], known: {}, seen: {}, opt: {} }; g.trapSk = { xp: 99999 };
  const lv = [];
  for (const L of [50, 100, 101, 301, 1501, 3101, 25501, 102301, 204000]) { g.L = L; g.maxF = {}; g.maxF[L] = 1; delete g.cyber.deepL; delete g.chem.deepL; delete g.trapSk.deepL; lv.push([L, IM.catLv("combat"), IM.level(), C.brLv("pharm"), C.level(), C.rank("pharm"), TR.stage(), IM.maxGrade(), IM.modSlots()]); }
  const want = [[50, 5, 10, 5, 10, 3, 0, 3, 3], [100, 5, 10, 5, 10, 3, 0, 3, 3], [101, 6, 11, 6, 11, 3, 1, 3, 3], [301, 7, 12, 7, 12, 4, 2, 4, 3], [1501, 9, 14, 9, 14, 5, 4, 4, 4], [3101, 10, 15, 10, 15, 5, 5, 4, 4], [25501, 13, 18, 10, 15, 5, 8, 5, 5], [102301, 15, 20, 10, 15, 5, 10, 5, 5], [204000, 15, 20, 10, 15, 5, 10, 5, 5]];
  ok(JSON.stringify(lv) === JSON.stringify(want), "ступени открываются по глубине: выше сотого — прежние пределы, каждый блок — следующая" + (JSON.stringify(lv) === JSON.stringify(want) ? "" : "\n    " + JSON.stringify(lv)));
}

/* ── 6. действия на заглушке героя ── */
console.log("Действия");
const Wd = LAB.W, Hd = LAB.H;
function floor() {
  const t = new Uint8Array(Wd * Hd).fill(LAB.T.ROOM);
  for (let x = 0; x < Wd; x++) { t[x] = LAB.T.WALL; t[(Hd - 1) * Wd + x] = LAB.T.WALL; }
  for (let y = 0; y < Hd; y++) { t[y * Wd] = LAB.T.WALL; t[y * Wd + Wd - 1] = LAB.T.WALL; }
  return { t: t, doorAt: [], objAt: [], npcs: [], room: new Int32Array(Wd * Hd).fill(0), rooms: [{ id: 0, type: "lab", x0: 1, y0: 1, x1: Wd - 2, y1: Hd - 2 }], objs: [], items: [], corrs: [], doors: [] };
}
let foes = [];
function combat(g) {
  LAB.combat = {
    foes: () => foes,
    damageFoe(f, d, dt) { if (f.dead) return false; f.hp -= Math.max(1, Math.round(d)); f.lastDt = dt; if (f.hp <= 0) { f.hp = 0; f.dead = true; } return true; },
    canStand(f, x, y) { return LAB.inb(x, y) && LAB.game.CUR.fl.t[y * Wd + x] !== LAB.T.WALL && !foes.some(q => !q.dead && q !== f && q.x === x && q.y === y) && !(g.x === x && g.y === y); },
    isCam: f => (f.beh || []).indexOf("camera") >= 0, isTurret: f => (f.beh || []).indexOf("turret") >= 0,
    areaDamage(x, y, r, dmg, dt) { let n = 0; foes.forEach(f => { if (!f.dead && Math.max(Math.abs(f.x - x), Math.abs(f.y - y)) <= r) { LAB.combat.damageFoe(f, dmg, dt); n++; } }); return n; },
    hurtPlayer(d) { g.hp -= d; g.lastHurt = Date.now(); return d; },
    signalLure: () => [], unhide() {}, noise() {}, noiseLure() { lured++; }, afterPlayerMove() {}, spendTurns() {}
  };
}
let lured = 0;
function foe(id, kind, dx, dy, extra) { const f = Object.assign({ id: id, type: id, name: kind === "mech" ? "машина" : "тварь", g: "f", kind: kind, x: 30 + dx, y: 30 + dy, hp: 5000, maxhp: 5000, dmg: 50, arm: 10, state: "hunt", beh: [], frozen: 0, adapt: {} }, extra || {}); foes.push(f); return f; }
function world(L) {
  const g = heroState(L, 1); g.maxF[L] = 1;
  const cur = stubGame(g); cur.fl = floor(); cur.fs = { doors: {}, objs: {}, traps: [], bench: {}, chemSt: {} }; cur.key = L + "-1"; cur.seen = new Uint8Array(Wd * Hd);
  g.cyber = { xp: {} }; IM.CAT_ORDER.forEach(c => { g.cyber.xp[c] = 99999; }); g.impLv = {}; g.impMod = {};
  g.chem = { xp: { pharm: 99999, tox: 99999, energy: 99999, pyro: 99999, bio: 99999 }, spec: ["pharm", "tox"], known: {}, seen: {}, opt: {} };
  g.trapSk = { xp: 99999 };
  g.weapons = [LAB.makeWeapon("spark", 300, 1, 2)]; g.wi = 0;
  combat(g); foes = []; laterQ.length = 0; said.length = 0;
  return g;
}
const sig = (g) => JSON.stringify([g.hp, g.en, g.x, g.y, g.st, g.body, g.cyber.anchor || null, foes.map(f => [f.hp, f.x, f.y, f.frozen, f.markT, f.slowT, f.confused, f.blindT, f.ally, f.allyT, f.deafT, f.bleedT, f.arm, f.dgBoom, f.state, f.shield]), g.weapons.map(w => [w.charge, w.cond, w.over, w.chill ? 1 : 0, w.heat, w.coat || null])]);
{
  const fx = [];
  DN.forEach(im => {
    const g = world(Math.max(im.minL, 3200));
    foe("a", "bio", 0, -2); foe("b", "mech", 1, -3); foe("c", "mech", -1, 2, { state: "idle" }); foe("d", "bio", 2, 1);
    g.body.tox = 30; g.body.neuro = 40; g.body.rad = 20; g.st.bleed = 6; g.st.poison = 4;
    g.weapons[0].charge = 0; g.weapons[0].cond = 50;
    LAB.game.CUR.fl.objs.push({ id: 7, type: "locker", x: 32, y: 32, loot: [{ kind: "item", item: "medkit_s" }] }, { id: 8, type: "workbench", x: 28, y: 33 });
    for (let i = 0; i < 10; i++) { g.y = 30 + (i < 5 ? 0 : 1); IM.deepTick(); }
    g.y = 31; g.x = 30;
    if (im.fx.k === "anchor") { g.implants = ["scan", "echo", im.id]; IM.run(im.id); g.x = 33; }
    g.implants = ["scan", "echo", im.id];
    const s0 = sig(g); said.length = 0;
    try { IM.run(im.id); } catch (e) { fx.push(im.id + ": " + e.message); return; }
    for (let i = 0; i < 8; i++) IM.deepTick();
    const s1 = sig(g), t = said.join(" ");
    if (s0 === s1 && !/: /.test(t)) fx.push(im.id + ": ничего не изменилось — " + t);
    if (/работает\.$/.test(t) || !t) fx.push(im.id + ": без слов");
  });
  ok(!fx.length, "у каждого импланта глубин действие существует и срабатывает (" + DN.length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
}
{
  /* защита глубин: последняя перекличка, отложенная боль, счётный щит, теплоотвод, капсула последнего вдоха */
  const g = world(102301);
  g.st.wardT = 10; g.hp = 50; let f = IM.onHurt(500, "phys", null);
  const wardOk = f === 49;
  g.st.wardT = 0; g.st.deferT = 10; g.hp = 400; f = IM.onHurt(300, "phys", null);
  const deferOk = f === 100 && g.st.deferPool === 200;
  g.st.deferT = 0; g.st.absorbT = 10; g.en = 0; f = IM.onHurt(90, "phys", null);
  const absorbOk = f === 45 && g.en === 15;
  g.st.absorbT = 0; g.st.heatT = 10; const hp0 = g.hp; f = IM.onHurt(100, "therm", null);
  const heatOk = f === 0 && g.hp > hp0;
  g.st.heatT = 0; g.st.lastT = 10; g.hp = 30; f = IM.onHurt(200, "phys", null);
  ok(wardOk && deferOk && absorbOk && heatOk && f === 29, "удар по герою: последняя перекличка, отложенная боль, счётный щит, теплоотвод, последний вдох");
}
{
  const fx = [];
  DC.forEach(im => {
    const g = world(Math.max(im.minL, 3200));
    g.implants = ["scan", "echo", im.id];
    const key = Object.keys(im.st)[0];
    if (!(IM.stat(key) > 0)) fx.push(im.id + ": stat(" + key + ") = 0");
  });
  /* чипы, что меняют бой: проверяем действие */
  let g = world(3200); g.implants = ["dc_hunter"]; const fb = foe("x", "bio", 0, -1);
  if (!(IM.dmgK(fb) > 1.19)) fx.push("чип ловчего не усиливает");
  g.implants = ["dc_tally"]; const k1 = IM.dmgK(fb), k2 = IM.dmgK(fb), k3 = IM.dmgK(fb); if (!(k3 > k1 && k1 === k2)) fx.push("чип счёта: " + [k1, k2, k3]);
  g.implants = ["dc_thorn"]; const src = foe("y", "bio", 1, 0); IM.onHurt(100, "phys", src); if (!(src.hp < 5000)) fx.push("чип колючей кожи не отвечает");
  g.implants = ["dc_lastline"]; g.hp = 100; if (!(IM.onHurt(100, "phys", null) < 100)) fx.push("чип последнего рубежа");
  g.implants = ["dc_aegis"]; g.st.shield = 0; g.lastHurt = 0; for (let i = 0; i < 6; i++) IM.tick(); if (!(g.st.shield > 0)) fx.push("чип живого щита");
  g.implants = ["dc_jam"]; const mj = foe("z", "mech", 1, 1); IM.tick(); if (!(mj.slowT > 0)) fx.push("чип помех");
  g.implants = ["dc_clot"]; g.st.bleed = 20; for (let i = 0; i < 4; i++) IM.tick(); if (!(g.st.bleed < 20)) fx.push("чип свёртывания");
  g.implants = ["dc_liver"]; g.body.tox = 30; for (let i = 0; i < 8; i++) IM.tick(); if (!(g.body.tox < 30)) fx.push("чип печени");
  g.implants = ["dc_dynamo", "dc_marrow"]; g.en = 10; g.hp = 100; const dead = foe("k", "bio", 0, 2, { dead: true, hp: 0 }); IM.onHit(null, dead, 10); if (!(g.en > 10 && g.hp > 100)) fx.push("чипы динамо и костного мозга");
  g.implants = ["dc_cell"]; const e0 = g.enMax; IM.applyStatic(); if (!(g.enMax > e0)) fx.push("чип батареи глубин");
  g.implants = ["dc_shade", "d_hush"]; if (!(IM.params("d_hush").dur > 1.5)) fx.push("чип тени");
  g.implants = ["dc_far", "d_census"]; if (!(IM.params("d_census").r >= 16)) fx.push("чип дальнего слуха");
  ok(!fx.length, "у каждого чипа глубин действие существует и срабатывает (" + DC.length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
}
{
  const fx = [];
  const g = world(102301);
  const pairs = { vampiric: "d_reso", focused: "d_reso", shielding: "d_absorb", numbing: "d_convert", census: "d_survey", stepping: "d_rewind", overflow: "d_discharge", echoing: "d_reso", network: "d_puppet", tuned: "dc_ambush", weightless: "d_steam" };
  Object.keys(pairs).forEach(m => {
    const id = pairs[m]; g.implants = ["scan", "echo", id]; g.impMod = {};
    const why = IM.compat(id, m); if (why) { fx.push(m + " → " + id + ": " + why); return; }
    const p0 = IM.params(id), c0 = IM.costK(id), l0 = IM.load(id), s0 = IM.stat("first");
    g.impMod[id] = [m];
    const p1 = IM.params(id);
    foes = []; foe("a", "bio", 0, -1); foe("b", "mech", 1, -1);
    g.hp = 300; g.st = { shield: 0, phaseT: 0 }; said.length = 0; laterQ.length = 0;
    for (let i = 0; i < 10; i++) IM.deepTick();
    IM.run(id); IM.used(id, 5);
    const t = said.join(" ");
    const okm = { vampiric: g.hp > 300, focused: p1.r < p0.r && p1.dmg > p0.dmg, shielding: g.st.shield > 0, numbing: g.st.numbT > 0, census: /На этаже врагов/.test(t), stepping: g.st.phaseT > 0, overflow: IM.costK(id) < c0, echoing: laterQ.length > 0, network: p1.r === p0.r + 4, tuned: IM.stat("first") > s0, weightless: IM.load(id) < l0 }[m];
    if (!okm) fx.push(m + ": не сработала (" + t.slice(0, 80) + ")");
  });
  ok(!fx.length, "у каждой модификации глубин действие существует и срабатывает (" + Object.keys(pairs).length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
}
{
  /* ловушки: поставить, взвести, дать врагу наступить или подойти — и посмотреть, что вышло */
  const fx = [];
  Object.keys(TD).forEach(k => {
    const d = LAB.TRAPS[k], g = world(Math.max(d.depth, 3200));
    g.inv["tr_" + k] = 1; g.en = 10; g.hp = 300;
    if (!TR.place(k, "here")) { fx.push(k + ": не ставится — " + said.join(" ")); return; }
    const tp = TR.list()[0];
    g.x = 40; g.y = 40; TR.playerStep(); lured = 0;
    for (let i = 0; i < 6; i++) TR.tick();
    if (tp.st !== "on") { fx.push(k + ": не взвёлся (" + tp.st + ")"); return; }
    const kind = d.who === "mech" || d.harvest ? "mech" : "bio";
    const f = foe("t", kind, 0, 0, { x: tp.x, y: tp.y, state: "idle" }), f2 = foe("u", kind, 0, 0, { x: tp.x + 2, y: tp.y, state: "hunt" }), f3 = foe("v", kind, 0, 0, { x: tp.x - 1, y: tp.y + 1, state: "hunt" });
    const s0 = JSON.stringify([g.en, g.hp, foes.map(q => [q.hp, q.x, q.y, q.frozen, q.markT, q.slowT, q.maxhp, q.deafT, q.confused, q.blindT, q.shield])]);
    if (d.trig === "prox") TR.tick(); else TR.foeStep(f);
    for (let i = 0; i < 8; i++) TR.tick();
    const s1 = JSON.stringify([g.en, g.hp, foes.map(q => [q.hp, q.x, q.y, q.frozen, q.markT, q.slowT, q.maxhp, q.deafT, q.confused, q.blindT, q.shield])]);
    const want = { rollcall: f.markT > 0, cluster: TR._shards().length === 0 && f2.hp < 5000, gravwell: f2.x !== tp.x + 2, remake: f.maxhp < 5000, baitbomb: lured > 0, donor: g.hp > 300, harvester: g.en > 10, steamvalve: f.hp < 5000, hushwire: f.deafT > 0 || f2.deafT > 0, countmine: f.hp < 5000 }[k];
    if (s0 === s1 || !want) fx.push(k + ": не сработала как обещано — " + said.slice(-2).join(" "));
  });
  ok(!fx.length, "у каждой ловушки глубин своё действие, и оно срабатывает (" + Object.keys(TD).length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
  /* старые ловушки этажа и сапёры Переклички ниже Истока — и ловушками Нижних */
  const okoDeep = TR.okoKinds(25600), okoTop = TR.okoKinds(50);
  ok(okoDeep.some(k => TD[k]) && !okoTop.some(k => TD[k]), "сапёры Переклички ниже Истока ставят и ловушки глубин, выше — прежние (" + okoDeep.filter(k => TD[k]).join(", ") + ")");
  let genOk = true, deepOld = 0;
  if (LAB.LEVELS_N > 100) for (const L of [120, 140, 180, 260]) for (let F = 2; F <= 19; F++) {
    const gw = world(L); gw.F = F;
    let fl; try { fl = LAB.getFloor("gear", L, F); } catch (e) { continue; }
    LAB.game.CUR.fl = fl; LAB.game.CUR.fs = { doors: {}, objs: {}, traps: [], secrets: {} }; LAB.game.CUR.key = L + "-" + F;
    try { TR.enterFloor(); } catch (e) { genOk = false; err("старые ловушки " + L + "-" + F + ": " + e.message); break; }
    TR.list().forEach(tp => { if (!LAB.TRAPS[tp.t] || LAB.TRAPS[tp.t].depth > L) genOk = false; if (TD[tp.t]) deepOld++; });
  }
  ok(genOk, "старые ловушки на этажах глубин ставятся без ошибок и не глубже своего уровня (ловушек Нижних среди них: " + deepOld + ")");
  const g = world(150); g.trapSk = { xp: 0 }; TR.gainSkill(30);
  ok(TR.stage() === 1 && TR.maxOwn() === 12, "ловушечное дело растёт от своих ловушек и открывается глубиной (ступень " + TR.stage() + ")");
  const g2 = world(50); g2.trapSk = { xp: 99999 };
  ok(TR.stage() === 0 && TR.maxOwn() === 12 && TR.craftWhy({ trapN: 1 }) !== "", "выше Истока ловушечного дела нет: всё по-прежнему");
}
{
  /* химия: капсулы и составы, работа руками, переработка */
  const fx = [];
  Object.keys(DP).forEach(b => {
    const P = DP[b];
    if (P.kind === "throw") { const q = LAB.ITEMS[b].fx && LAB.ITEMS[b].fx.gren; if (!q || !(q.r >= 1) || !q.dt || !(q.range >= 3)) fx.push(b + ": граната без действия"); return; }
    const g = world(Math.max(P.depth, 3200));
    g.body.mut = 40; g.body.tox = 50; g.body.rad = 20; g.en = 10; g.hp = 200; g.st.poison = 6;
    g.weapons = [LAB.makeWeapon("crowbar", 300, 1, 2)]; g.wi = 0;
    g.inv[b] = 1;
    const s0 = sig(g);
    let r; try { r = C.use(b); } catch (e) { fx.push(b + ": " + e.message); return; }
    if (!r || g.inv[b]) fx.push(b + ": не применилась — " + said.join(" "));
    else if (s0 === sig(g)) fx.push(b + ": ничего не изменилось");
  });
  const g = world(102301);
  g.st.heatRes = 10; let f = C.hurtK(100, "therm"); g.st.heatRes = 0;
  g.st.hushImm = 10; const f2 = C.hurtK(100, "sonic"); g.st.hushImm = 0;
  g.st.payT = 2; C.hurtK(100, "phys"); C.tick(); C.tick(); const pay = g.st.payHeal > 0;
  g.body.mut = 20; g.st.mutImm = 10; C.addMut(30); const imm = g.body.mut === 20;
  if (!(f === 30 && f2 === 50 && pay && imm)) fx.push("защита капсул: " + [f, f2, pay, imm]);
  ok(!fx.length, "у каждой капсулы и состава глубин действие существует и срабатывает (" + Object.keys(DP).length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
  /* синтез у стола и руками */
  const fx2 = [];
  C.DEEP_RC.forEach(rc => {
    const g2 = world(Math.max(LAB.blockRange ? LAB.blockRange(rc.deep).from : 101, 3200)); g2.chem.known[rc.id] = 1;
    const o = { id: 77, x: 31, y: 30 }; LAB.game.CUR.fs.chemSt[77] = { tier: 5, dirty: false };
    for (const k in rc.need) { if (C.FAM[k]) g2.inv[C.matId(k, rc.minG || 1, false)] = (g2.inv[C.matId(k, rc.minG || 1, false)] || 0) + rc.need[k] + 1; else g2.inv[k] = (g2.inv[k] || 0) + rc.need[k] + 1; }
    const why = C.why(rc.id, o); if (why) { fx2.push(rc.id + ": " + why); return; }
    const before = Object.keys(g2.inv).filter(k => k.indexOf(rc.out) === 0).length;
    C.brew(rc.id, o);
    const after = Object.keys(g2.inv).filter(k => k.indexOf(rc.out) === 0 && g2.inv[k] > 0).length;
    if (!(after >= 1) && !/осадок/.test(said.join(" "))) fx2.push(rc.id + ": ничего не вышло " + before + "/" + after);
  });
  ok(!fx2.length, "рецептуры глубин синтезируются у стола (" + C.DEEP_RC.length + ")" + (fx2.length ? ":\n    " + fx2.join("\n    ") : ""));
  ok(C.DEEP_RC.every(rc => { for (const k in rc.need) if (!C.FAM[k] && ["gel", "scrap", "wire", "cap", "bandage", "reagent", "sorbent"].indexOf(k) < 0) return false; return true; }), "рецептуры глубин можно делать и руками: всё их сырьё есть у стола");
  const g3 = world(50);
  ok(!C.DEEP_RC.some(rc => C.rcOn(rc)) && !C.DEEP_REF.some(rf => C.rcOn(rf)), "выше Истока рецептур и переработки глубин нет ни в одном списке");
}
{
  /* мастерская: модули глубин в бою, оснастка, детали */
  const fx = [];
  const g = world(102301);
  const w = LAB.makeWeapon("spark", 300, 1, 2); g.weapons = [w]; g.wi = 0;
  const q = foe("m", "bio", 0, -1), mq = foe("n", "mech", 1, -1, { boss: true });
  Object.keys(DMO).forEach(k => {
    w.mod = {}; W.recalc(w);
    const why = W.compat(w, k); if (why) { fx.push(k + ": не встаёт — " + why); return; }
    W.install(w, k);
    q.hp = 5000; q.markT = 0; q.bleedT = 0; q.slowT = 0; q.x = 30; q.y = 29; mq.hp = 5000; g.en = 0;
    let okm = false;
    if (k === "tally") { const a = W.deepK(w, q), b = W.deepK(w, q), c = W.deepK(w, q); okm = c > a && a === b; }
    else if (k === "rift") okm = W.deepK(w, mq) > 1.3 && W.pierce(w) >= 0.25;
    else if (k === "recoil") okm = W.gapK(w) < 1 && W.accBonus(w, true) > W.accBonus(w, false);
    else if (k === "econ") { let back = 0; for (let i = 0; i < 400; i++) { w.charge = 5; W.afterShot(w, false, Date.now() + i * 5000); if (w.charge > 5) back++; } okm = back > 40 && back < 200; }
    else if (k === "chill") { w.heat = 0; w.heatT = Date.now(); W.afterShot(w, false, w.heatT); const h1 = w.heat; w.mod = {}; W.recalc(w); w.heat = 0; W.afterShot(w, false, w.heatT); okm = h1 < w.heat; W.install(w, k); W.onHit(w, q, 100); okm = okm && q.slowT > 0; }
    else { W.onHit(w, q, 1000); okm = { mark: q.markT > 0, notch: q.bleedT > 0, reso: mq.hp < 5000, leech: true, ram: q.y !== 29 }[k]; if (k === "leech") { W.onHit(w, mq, 1000); okm = g.en > 0; } }
    if (!okm) fx.push(k + ": не сработал");
  });
  ok(!fx.length, "у каждого модуля глубин действие существует и срабатывает (" + Object.keys(DMO).length + ")" + (fx.length ? ":\n    " + fx.join("\n    ") : ""));
  /* оснастка глубин: ступени по блокам и что они умеют */
  const tiers = [];
  for (const L of [150, 500, 1000, 2000, 4000, 9000, 20000, 30000, 60000, 150000]) {
    const g2 = world(L); LAB.game.CUR.fs.bench = {};
    const ts = new Set(); for (let id = 0; id < 40; id++) ts.add(W.bench({ id: id, x: 1, y: 1 }).tier);
    const top = W.deepTop(L);
    if ([...ts].some(t => t < top - 1 || t > top) || W.shopMin(L) !== top) tiers.push(L + ": " + [...ts] + " / " + top);
  }
  ok(!tiers.length, "верстаки глубин — ступени 6–10 по блокам, мастерская этажа — не ниже своей" + (tiers.length ? ": " + tiers.join("; ") : ""));
  const g4 = world(150000), b = { tier: 10, dmg: false, spec: "" };
  const w4 = LAB.makeWeapon("spark", 300, 2, 2); g4.weapons = [w4];
  ["dp_alloy", "dp_coil", "chip", "dp_reed", "supercond", "dp_shard", "dp_valve", "proto", "dp_nerve"].forEach(k => { g4.inv[k] = 9; });
  const s0 = W.slots(w4), d0 = LAB.weaponDmg ? LAB.weaponDmg(w4) : w4.dmg, r0 = w4.rank;
  ["slot", "temper", "rank", "anvil"].forEach(k => W.deepSvc(k, w4, true, b));
  ok(W.slots(w4) === s0 + 1 && w4.tempered && w4.rank === r0 + 1 && w4.anvil && w4.dmg > d0, "оснастка глубин: расточка гнезда, закалка звуком, перековка редкости, ковка на звук");
  const rc = LAB.RECIPES.find(r => r.id === "t_countmine"), g5 = world(150000); g5.trapSk = { xp: 0 }; g5.bp = { t_countmine: 1 };
  ok(/ловушечного дела/.test(W.check(rc, b) || ""), "ловушку глубин без ловушечного дела не собрать");
  g5.trapSk = { xp: 99999 }; for (const k in rc.need) g5.inv[k] = 9;
  ok(W.check(rc, b) === "", "с ловушечным делом и деталями — собирается");
  const rcI = LAB.RECIPES.find(r => r.id === "imp_d_ward"); for (const k in rcI.need) g5.inv[k] = 9; g5.bp = { imp_d_ward: 1 };
  ok(W.check(rcI, b) === "", "имплант глубин по схеме собирается на наковальне Основания при нужной ступени направления");
  ok(W.check(rcI, { tier: 6, dmg: false, spec: "" }) !== "", "а на стапеле Нижних — нет: нужна оснастка своего круга");
}
console.log(fails ? "ПРОВАЛЕНО: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
