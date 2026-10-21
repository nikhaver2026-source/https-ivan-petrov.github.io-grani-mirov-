#!/usr/bin/env node
/* Проверка арсенала глубин (js/arsenal.js): новое оружие, заряды, гранаты
   и рецепты. Модули грузятся так же, как в world.test.js (список берётся
   из него), — сначала без арсенала, потом с ним, и сравниваются таблицы.
   Проверяется: id и названия не заняты, модели оружия уникальны; всё — с
   десятого уровня и глубже (оружие, заряды, гранаты, рецепты, схемы);
   у каждой вещи один канал src и в описании сказано, где её взять; у
   «только у верстака» — ровно один рецепт из существующих деталей своей
   глубины, у остального — ни одного; у «только в продаже» — цена в
   масштабе магазина; звуки существуют; поля гранат fx.gren — нужных
   типов и в своих пределах; тексты без ASCII-кавычек, дефиса вместо тире
   и запретных слов. Затем копия world.test.js с арсеналом в списке
   модулей строит комплекс (1 зерно, шаг 10). В конце — «ВСЁ ХОРОШО».
   Запуск: node lab/tests/arsenal.check.js [--fast — без генерации]
   ACORN=путь/к/acorn — проверить синтаксис по ES2018, если acorn не
   установлен в проекте. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const ARS = "js/arsenal.js";
const WT = path.join(__dirname, "world.test.js");
const FAST = process.argv.indexOf("--fast") >= 0;
let fails = 0;
function err(m) { console.error("✗ " + m); fails++; }
function ok(m) { console.log("✓ " + m); }

/* ── модули: тот же список, что у world.test.js ── */
const FALLBACK = ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/annex_rooms.js", "js/annex_var.js", "js/annex_frag.js", "js/annex_gen.js", "js/fixtures_data.js", "js/annex.js", "js/garrison.js", "js/workshop.js"];
function moduleList() {
  try {
    const m = fs.readFileSync(WT, "utf8").match(/for \(const f of (\[[^\]]*\])\)/);
    if (m) { const list = JSON.parse(m[1]); if (Array.isArray(list) && list.length) return list; }
  } catch (e) { /* список не разобрать — берём запасной */ }
  return FALLBACK;
}
const MODS = moduleList().filter((f) => f !== ARS);
function load(extra) {
  const warns = [];
  const con = { log: console.log.bind(console), error: console.error.bind(console), info: function () {}, debug: function () {}, warn: function () { warns.push(Array.prototype.join.call(arguments, " ")); } };
  const ctx = { console: con, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of MODS.concat(extra || [])) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
  }
  return { LAB: ctx.LAB, warns: warns };
}
/* ── звуки: из sounds.js (window.LAB.SND), а не выйдет — из текста ── */
function soundIds() {
  const p = path.join(ROOT, "js/sounds.js");
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, "utf8");
  try {
    const c = { window: { LAB: {} }, console: { log() {}, warn() {}, error() {} } };
    c.globalThis = c;
    vm.createContext(c);
    vm.runInContext(src, c, { filename: "js/sounds.js" });
    if (c.window.LAB.SND) return new Set(Object.keys(c.window.LAB.SND));
  } catch (e) { /* разберём текст */ }
  const set = new Set(), re = /"([a-z][a-z0-9_]*)":\{"f":/g;
  let m;
  while ((m = re.exec(src))) set.add(m[1]);
  return set.size ? set : null;
}

/* ── 1. синтаксис ── */
(function syntax() {
  const src = fs.readFileSync(path.join(ROOT, ARS), "utf8");
  let acorn = null;
  for (const p of [process.env.ACORN, "acorn"].filter(Boolean)) { try { acorn = require(p); break; } catch (e) { /* дальше */ } }
  if (acorn) {
    try { acorn.parse(src, { ecmaVersion: 2018 }); ok("синтаксис ES2018 (acorn)"); } catch (e) { err("синтаксис ES2018: " + e.message); }
  } else {
    try { new vm.Script(src, { filename: ARS }); ok("синтаксис (acorn не найден — проверено самим Node)"); } catch (e) { err("синтаксис: " + e.message); }
  }
})();

const before = load([]), B = before.LAB;
const after = load([ARS]), LAB = after.LAB;
const A = LAB.ARSENAL17;
if (!A) { err("LAB.ARSENAL17 нет — арсенал не загрузился"); process.exit(1); }

/* ── 2. сводка ── */
["weapons", "ammo", "grenades", "recipes"].forEach((k) => { if (!Array.isArray(A[k])) err("LAB.ARSENAL17." + k + " — не список"); });
if (A.skipped && A.skipped.length) err("арсенал пропустил: " + A.skipped.join("; "));
after.warns.filter((w) => /арсенал/.test(w)).forEach((w) => err("предупреждение: " + w));
const newWarns = after.warns.length - before.warns.length;
if (newWarns > 0) err("с арсеналом новых предупреждений: " + newWarns + " — " + after.warns.slice(-newWarns).join("; "));
const SRCS = new Set(["craft", "find", "buy"]);

/* ── 3. ничего не занято, счёт сходится ── */
function cmpTable(name, tb, ta, ids) {
  ids.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(tb, id)) err(name + ": «" + id + "» был и до арсенала");
    if (!Object.prototype.hasOwnProperty.call(ta, id)) err(name + ": «" + id + "» не появился");
  });
  const nb = Object.keys(tb).length, na = Object.keys(ta).length;
  if (na - nb !== ids.length) err(name + ": было " + nb + ", стало " + na + ", а новых " + ids.length);
}
cmpTable("оружие", B.WEAPONS, LAB.WEAPONS, A.weapons);
cmpTable("глубина оружия", B.WEAPON_DEPTH, LAB.WEAPON_DEPTH, A.weapons);
cmpTable("модель оружия", B.MODEL, LAB.MODEL, A.weapons);
cmpTable("заряд", B.AMMO, LAB.AMMO, A.ammo);
cmpTable("предмет", B.ITEMS, LAB.ITEMS, A.grenades);
const recB = new Set(B.RECIPES.map((r) => r.id));
A.recipes.forEach((id) => { if (recB.has(id)) err("рецепт «" + id + "» был и до арсенала"); });
if (LAB.RECIPES.length - B.RECIPES.length !== A.recipes.length) err("рецептов было " + B.RECIPES.length + ", стало " + LAB.RECIPES.length + ", а новых " + A.recipes.length);
const seenR = {};
LAB.RECIPES.forEach((r) => { if (seenR[r.id]) err("id рецепта повторяется: " + r.id); seenR[r.id] = 1; });
["FOES", "BOSSES", "ARMORS", "ROOMS", "LEVELS", "PART_DEPTH"].forEach((t) => { if (B[t] && Object.keys(B[t]).length !== Object.keys(LAB[t]).length) err("таблица " + t + " изменилась"); });
if (B.PARTS.length !== LAB.PARTS.length) err("список деталей изменился");
if (B.LEVELS_N !== LAB.LEVELS_N) err("число уровней изменилось");
/* id не повторяют ни один прежний id других таблиц */
const ALLID = new Set([].concat(Object.keys(B.WEAPONS), Object.keys(B.ITEMS), Object.keys(B.AMMO), Object.keys(B.ARMORS), Object.keys(B.FOES), Object.keys(B.BOSSES), B.RECIPES.map((r) => r.id)));
const mineAll = [].concat(A.weapons, A.ammo, A.grenades);
mineAll.forEach((id) => { if (ALLID.has(id)) err("id «" + id + "» уже занят в другой таблице"); });
if (new Set(mineAll.concat(A.recipes)).size !== mineAll.length + A.recipes.length) err("id внутри арсенала повторяются");
/* названия и модели */
const low = (s) => String(s || "").toLowerCase();
const oldWN = new Set(Object.keys(B.WEAPONS).map((k) => low(B.WEAPONS[k].n)));
const oldIN = new Set(Object.keys(B.ITEMS).map((k) => low(B.ITEMS[k].n)));
const oldAN = new Set(Object.keys(B.AMMO).map((k) => low(B.AMMO[k].n)));
const oldModels = new Set(Object.keys(B.MODEL).map((k) => B.MODEL[k]));
const nm = {}, md = {};
A.weapons.forEach((id) => {
  const n = low(LAB.WEAPONS[id].n), m = LAB.MODEL[id];
  if (oldWN.has(n)) err("оружие " + id + ": название «" + n + "» уже есть");
  if (nm[n]) err("оружие " + id + ": название повторяет " + nm[n]); nm[n] = id;
  if (!/^[А-ЯЁ0-9]{1,4}$/.test(m || "")) err("оружие " + id + ": модель «" + m + "» — не короткая кириллица");
  if (oldModels.has(m)) err("оружие " + id + ": модель «" + m + "» уже занята");
  if (md[m]) err("оружие " + id + ": модель «" + m + "» как у " + md[m]); md[m] = id;
});
A.grenades.forEach((id) => { const n = low(LAB.ITEMS[id].n); if (oldIN.has(n)) err("граната " + id + ": название «" + n + "» уже есть"); if (nm[n]) err("граната " + id + ": название повторяет " + nm[n]); nm[n] = id; });
A.ammo.forEach((id) => { const n = low(LAB.AMMO[id].n); if (oldAN.has(n) || oldIN.has(n)) err("заряд " + id + ": название «" + n + "» уже есть"); });

/* ── 4. оружие ── */
const SND = soundIds();
if (!SND) err("не удалось прочитать звуки из js/sounds.js");
const CLS = new Set(Object.keys(B.WEAPONS).map((k) => B.WEAPONS[k].cls));
const DT = new Set(Object.keys(B.DMG_VS.bio).filter((k) => B.DMG_VS.mech[k] != null && B.DMG_VS.anom[k] != null && B.DTYPE_N[k]));
const BASE_KEYS = new Set(["n", "g", "cls", "ammo", "dt", "dmg", "rng", "spread", "cap", "cd", "snd", "sndRate", "desc", "src", "price"]);
/* свойства, которые бой уже понимает: [мин, макс, целое] или "bool" */
const SPECIAL = { bleed: [1, 10, 1], slow: [1, 10, 1], mark: [1, 10, 1], freeze: [1, 6, 1], stunMech: [1, 4, 1], chain: [1, 5, 1], burst: [2, 4, 1],
  crit: [0.01, 0.5, 0], drain: [0.01, 0.5, 0], apierce: [0.05, 0.9, 0], knock: "bool", silent: "bool", pierce: "bool", area: "bool", noarmor: "bool" };
function inRange(v, spec) { return typeof v === "number" && isFinite(v) && v >= spec[0] && v <= spec[1] && (!spec[2] || Number.isInteger(v)); }
function priceK(L) { return L <= 10 ? 1 + L * 0.12 : 1 + 0.15 * (LAB.wealth(L, 1) - 1); }
for (const id of A.weapons) {
  const w = LAB.WEAPONS[id], d = LAB.WEAPON_DEPTH[id], at = "оружие " + id;
  if (!(Number.isInteger(d) && d >= 10 && d <= LAB.LEVELS_N)) err(at + ": глубина " + d + " (нужно с десятого уровня)");
  if (!SRCS.has(w.src)) err(at + ": канал src «" + w.src + "»");
  if (typeof w.n !== "string" || !/^[а-яё]/.test(w.n)) err(at + ": название — со строчной буквы, в именительном падеже");
  if (["m", "f", "n"].indexOf(w.g) < 0) err(at + ": род g «" + w.g + "»");
  if (!CLS.has(w.cls)) err(at + ": класс «" + w.cls + "» не из существующих");
  if (w.ammo !== "none") {
    if (!LAB.AMMO[w.ammo]) err(at + ": заряда «" + w.ammo + "» нет");
    else if ((LAB.AMMO[w.ammo].depth || 1) > d) err(at + ": заряд «" + w.ammo + "» появляется глубже оружия");
    if (!(Number.isInteger(w.cap) && w.cap >= 1 && w.cap <= 40)) err(at + ": заряд в оружии cap " + w.cap);
  } else if (w.cap !== 0) err(at + ": без батарей, а cap " + w.cap);
  if (!DT.has(w.dt)) err(at + ": вид урона «" + w.dt + "» бой не знает");
  if (!(typeof w.dmg === "number" && w.dmg > 0 && w.dmg <= 80)) err(at + ": урон " + w.dmg);
  if (!(Number.isInteger(w.rng) && w.rng >= 1 && w.rng <= 12)) err(at + ": дальность " + w.rng);
  if (w.cls === "melee" && w.rng !== 1) err(at + ": ближний бой, а дальность " + w.rng);
  if ([0, 1].indexOf(w.spread) < 0) err(at + ": разлёт " + w.spread);
  if (!(Number.isInteger(w.cd) && w.cd >= 250 && w.cd <= 2000)) err(at + ": перезарядка выстрела " + w.cd);
  if (typeof w.snd !== "string" || !/^w_/.test(w.snd) || (SND && !SND.has(w.snd))) err(at + ": звука «" + w.snd + "» нет");
  if (!(typeof w.sndRate === "number" && w.sndRate >= 0.4 && w.sndRate <= 2.5)) err(at + ": sndRate " + w.sndRate);
  if (typeof w.desc !== "string" || w.desc.length < 40) err(at + ": нет описания");
  for (const k in w) if (!BASE_KEYS.has(k) && !SPECIAL[k]) err(at + ": свойство «" + k + "» бой не знает");
  for (const k in SPECIAL) if (w[k] != null && (SPECIAL[k] === "bool" ? w[k] !== true : !inRange(w[k], SPECIAL[k]))) err(at + ": " + k + " = " + w[k]);
  if (w.src === "buy") {
    if (!(Number.isInteger(w.price) && w.price > 0)) err(at + ": только в продаже, а цены нет");
    else {
      const shop = LAB.weaponPrice(LAB.makeWeapon(id, LAB.foeLevel(d, 1), 0, 1)) * 1.1, ratio = w.price * priceK(d) / shop;
      if (ratio < 0.7 || ratio > 1.6) err(at + ": цена " + w.price + " × " + priceK(d).toFixed(2) + " не в ладу с ценой магазина " + Math.round(shop) + " (" + ratio.toFixed(2) + ")");
    }
  } else if (w.price != null) err(at + ": в продаже не бывает, а цена есть");
  try {
    const inst = LAB.makeWeapon(id, LAB.foeLevel(d, 1), 2, 2);
    if (!inst || !inst.name || /undefined|NaN/.test(inst.name) || !(inst.dmg > 0)) err(at + ": экземпляр не собрался (" + (inst && inst.name) + ")");
    else if (!(LAB.weaponPrice(inst) > 0)) err(at + ": нет цены экземпляра");
  } catch (e) { err(at + ": makeWeapon — " + e.message); }
}

/* ── 5. заряды ── */
for (const id of A.ammo) {
  const a = LAB.AMMO[id], at = "заряд " + id;
  if (typeof a.n !== "string" || !/^[А-ЯЁ]/.test(a.n)) err(at + ": название с заглавной");
  if (!a.icon) err(at + ": нет значка");
  if (typeof a.desc !== "string" || a.desc.length < 30) err(at + ": нет описания");
  if (!(Number.isInteger(a.price) && a.price > 0)) err(at + ": цена " + a.price);
  if (!(Number.isInteger(a.depth) && a.depth >= 10 && a.depth <= LAB.LEVELS_N)) err(at + ": глубина " + a.depth);
  if (!Object.keys(LAB.WEAPONS).some((k) => LAB.WEAPONS[k].ammo === id)) err(at + ": ни одно оружие его не тратит");
}

/* ── 6. гранаты ── */
const TICK = [1, 40, 1];
const GKEYS = { dmg: [0, 80, 0], r: [0, 3, 1], dt: "dt", noarmor: "bool", emp: "bool", knock: "bool", self: "bool",
  freeze: TICK, slow: TICK, stun: TICK, stunMech: TICK, confuse: TICK, deaf: TICK, burn: TICK, gas: TICK, mark: TICK, blind: TICK,
  range: [3, 8, 1], fuse: [300, 1500, 1], loud: [0, 14, 1] };
const GREQ = ["dmg", "r", "dt", "self", "range", "fuse", "loud"];
const GEFF = ["freeze", "slow", "stun", "stunMech", "confuse", "deaf", "burn", "gas", "emp", "knock", "mark", "blind"];
for (const id of A.grenades) {
  const it = LAB.ITEMS[id], at = "граната " + id;
  if (it.kind !== "throw") err(at + ": kind «" + it.kind + "»");
  if (!(Number.isInteger(it.depth) && it.depth >= 10 && it.depth <= LAB.LEVELS_N)) err(at + ": глубина " + it.depth);
  if (!SRCS.has(it.src)) err(at + ": канал src «" + it.src + "»");
  if (typeof it.n !== "string" || !/^[А-ЯЁ]/.test(it.n)) err(at + ": название с заглавной");
  if (!it.icon) err(at + ": нет значка");
  if (typeof it.desc !== "string" || it.desc.length < 40) err(at + ": нет описания");
  if (!(Number.isInteger(it.price) && it.price > 0)) err(at + ": цена " + it.price);
  if (!it.fx || Object.keys(it.fx).join(",") !== "gren") { err(at + ": в fx должно быть только gren"); continue; }
  const q = it.fx.gren;
  for (const k in q) if (!GKEYS[k]) err(at + ": поле fx.gren." + k + " бросок не знает");
  GREQ.forEach((k) => { if (q[k] == null) err(at + ": нет fx.gren." + k); });
  for (const k in GKEYS) {
    if (q[k] == null) continue;
    const s = GKEYS[k];
    if (s === "bool") { if (typeof q[k] !== "boolean") err(at + ": fx.gren." + k + " — не да/нет"); }
    else if (s === "dt") { if (typeof q[k] !== "string" || (q[k] !== "acid" && !DT.has(q[k]))) err(at + ": вид урона «" + q[k] + "»"); }
    else if (!inRange(q[k], s)) err(at + ": fx.gren." + k + " = " + q[k] + " (нужно " + s[0] + "–" + s[1] + ")");
  }
  if (q.stunMech && !(q.dmg > 0)) err(at + ": stunMech без урона не сработает (бой оглушает машину через damageFoe)");
  if (q.self && !(q.dmg > 0)) err(at + ": self без урона ничего не значит");
  if (!(q.dmg > 0) && !GEFF.some((k) => q[k])) err(at + ": граната ничего не делает");
}

/* ── 7. рецепты ── */
const myRec = LAB.RECIPES.filter((r) => A.recipes.indexOf(r.id) >= 0);
if (myRec.length !== A.recipes.length) err("не все рецепты арсенала в LAB.RECIPES");
function targetDepth(out) {
  const o = String(out);
  if (o.indexOf("weapon:") === 0) return LAB.WEAPONS[o.slice(7)] ? LAB.WEAPON_DEPTH[o.slice(7)] || 1 : null;
  if (o.indexOf("ammo:") === 0) return LAB.AMMO[o.slice(5)] ? LAB.AMMO[o.slice(5)].depth || 1 : null;
  if (o.indexOf("armor:") === 0) return LAB.ARMORS[o.slice(6)] ? LAB.ARMORS[o.slice(6)].depth || 1 : null;
  return LAB.ITEMS[o] ? LAB.ITEMS[o].depth || 1 : null;
}
for (const r of myRec) {
  const at = "рецепт " + r.id;
  if (!(Number.isInteger(r.minL) && r.minL >= 10)) err(at + ": minL " + r.minL + " (нужно с десятого уровня)");
  if (r.bp && !(r.minL >= 12)) err(at + ": схема с minL " + r.minL + " может открыться на девятом уровне и раньше (workshop.js предлагает схемы с minL до уровня + 2)");
  if (["base", "spec", "exp"].indexOf(r.cls) < 0) err(at + ": класс «" + r.cls + "»");
  if (typeof r.n !== "string" || !/^[А-ЯЁ]/.test(r.n)) err(at + ": название с заглавной");
  const td = targetDepth(r.out);
  if (td == null) err(at + ": собирает несуществующее «" + r.out + "»");
  else if (r.minL < Math.max(10, td)) err(at + ": minL " + r.minL + " раньше глубины вещи " + td);
  const ks = Object.keys(r.need || {});
  if (!ks.length) err(at + ": нет деталей");
  ks.forEach((k) => {
    const it = LAB.ITEMS[k];
    if (!it || it.kind !== "part") err(at + ": детали «" + k + "» нет");
    else if ((LAB.PART_DEPTH[k] || 1) > r.minL) err(at + ": деталь «" + k + "» появляется на " + LAB.PART_DEPTH[k] + "-м, глубже рецепта (" + r.minL + ")");
    if (!(Number.isInteger(r.need[k]) && r.need[k] >= 1 && r.need[k] <= 8)) err(at + ": «" + k + "» × " + r.need[k]);
  });
}
/* любой рецепт, который собирает новое, — с десятого уровня */
const mineSet = new Set(mineAll);
LAB.RECIPES.forEach((r) => {
  const o = String(r.out), t = o.indexOf("weapon:") === 0 ? o.slice(7) : o.indexOf("ammo:") === 0 ? o.slice(5) : o;
  if (mineSet.has(t) && !(r.minL >= 10)) err("рецепт " + r.id + " собирает новое «" + t + "» раньше десятого уровня");
});
/* «только у верстака» — ровно один рецепт, остальное не собирается вовсе */
A.weapons.forEach((id) => { const n = LAB.RECIPES.filter((r) => r.out === "weapon:" + id).length, s = LAB.WEAPONS[id].src; if (s === "craft" ? n !== 1 : n !== 0) err("оружие " + id + " (" + s + "): рецептов " + n); });
A.grenades.forEach((id) => { const n = LAB.RECIPES.filter((r) => r.out === id).length, s = LAB.ITEMS[id].src; if (s === "craft" ? n !== 1 : n !== 0) err("граната " + id + " (" + s + "): рецептов " + n); });

/* ── 8. тексты ── */
const TXT = [];
A.weapons.forEach((id) => { TXT.push(["оружие " + id, LAB.WEAPONS[id].n], ["оружие " + id, LAB.WEAPONS[id].desc]); });
A.ammo.forEach((id) => { TXT.push(["заряд " + id, LAB.AMMO[id].n], ["заряд " + id, LAB.AMMO[id].desc]); });
A.grenades.forEach((id) => { TXT.push(["граната " + id, LAB.ITEMS[id].n], ["граната " + id, LAB.ITEMS[id].desc]); });
myRec.forEach((r) => { TXT.push(["рецепт " + r.id, r.n]); if (r.desc) TXT.push(["рецепт " + r.id, r.desc]); });
/* правила текстов — те же, что у tools/check_blocks.js и tests/oko_lines_b.check.js */
const NUMW = "(?:\\d+|один|одна|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|двадцать|тридцать|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяносто|сто|двести)";
const COUNTS = [new RegExp("(?:^|[^а-яё])" + NUMW + "\\s+(?:уровн|уровен|этаж)", "i"), /последн[а-яё]*\s+(уровн|уровен|этаж)/i, /сот(ый|ого|ом)\s+(уровн|уровен|этаж)/i, /всего\s+(\S+\s+)?(уровн|уровен|этаж)/i];
const FORBID = [/гран[ьиеюя]\s+мир/i, /странник/i, /(^|[^а-яё])(хуй|хуе|хуё|пизд|бля|ебат|ебан|ёбан|сука|суки|мудак|говн|дерьм|жоп|сволоч|ублюд|шлюх)/i];
const TY = /(^|[^а-яё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоих|твоим|твоего|твоей|твоему|твою)(?=[^а-яё]|$)/i;
for (const [at, s] of TXT) {
  if (typeof s !== "string" || !s) { err(at + ": пустой текст"); continue; }
  if (/["'`„“”]/.test(s)) err(at + ": прямые кавычки, «лапки» или апостроф вместо «ёлочек» — «" + s + "»");
  if (FORBID.some((re) => re.test(s))) err(at + ": запретное слово — «" + s + "»");
  if (COUNTS.some((re) => re.test(s))) err(at + ": говорит, сколько уровней или этажей — «" + s + "»");
  let depth = 0, bad = false;
  for (const c of s) { if (c === "«") depth++; else if (c === "»") { depth--; if (depth < 0) bad = true; } }
  if (bad || depth !== 0) err(at + ": непарные «ёлочки» — «" + s + "»");
  if (/ - |–|--|\s—\S|\S— /.test(s.replace(/«[^»]*»/g, "x"))) err(at + ": тире — длинное «—», с пробелами — «" + s + "»");
  if (/\.\.\./.test(s)) err(at + ": три точки вместо «…» — «" + s + "»");
  if (/\s{2,}|^\s|\s$/.test(s)) err(at + ": лишние пробелы — «" + s + "»");
  if (/(^|[^а-яё])(еще|ее|все-таки)([^а-яё]|$)/i.test(s)) err(at + ": нужна «ё» — «" + s + "»");
  if (/[A-Za-z]/.test(s)) err(at + ": латиница в тексте — «" + s + "»");
  if (TY.test(s)) err(at + ": к герою — на «вы» — «" + s + "»");
  if (/(^|[^а-яё])вы\s+[а-яё]+(л|ла|лся|лась)(?=[^а-яё]|$)/i.test(s)) err(at + ": род героя в глаголе — «" + s + "»");
}
/* в описании сказано, где вещь взять */
const CH = { craft: /верстак/, find: /находк|только найти/, buy: /[Пп]рода[её]тся только/ };
A.weapons.forEach((id) => { const w = LAB.WEAPONS[id]; if (CH[w.src] && !CH[w.src].test(w.desc)) err("оружие " + id + ": в описании не сказано, где его взять (" + w.src + ")"); if (!/[.!?…»]$/.test(w.desc)) err("оружие " + id + ": описание без знака в конце"); });
A.grenades.forEach((id) => { const it = LAB.ITEMS[id]; if (CH[it.src] && !CH[it.src].test(it.desc)) err("граната " + id + ": в описании не сказано, где её взять (" + it.src + ")"); if (!/[.!?…»]$/.test(it.desc)) err("граната " + id + ": описание без знака в конце"); });
A.ammo.forEach((id) => { if (!/[.!?…»]$/.test(LAB.AMMO[id].desc)) err("заряд " + id + ": описание без знака в конце"); });

/* ── 9. на уровнях с первого по девятый нового нет ── */
for (let L = 1; L <= 9; L++) {
  A.weapons.forEach((id) => { if ((LAB.WEAPON_DEPTH[id] || 99) <= L) err("оружие " + id + " попадёт на уровень " + L); });
  A.ammo.forEach((id) => { if ((LAB.AMMO[id].depth || 1) <= L) err("заряд " + id + " попадёт на уровень " + L); });
  A.grenades.forEach((id) => { if ((LAB.ITEMS[id].depth || 1) <= L) err("граната " + id + " попадёт на уровень " + L); });
  myRec.forEach((r) => {
    if (!r.minL || r.minL <= L) err("рецепт " + r.id + " виден у верстака на уровне " + L);
    if (r.bp && r.minL <= Math.max(L + 2, 3)) err("схема " + r.id + " может открыться на уровне " + L);
  });
  const rg = LAB.Rng("arsenal-check", "L" + L);
  for (let i = 0; i < 400; i++) { const w = LAB.genWeapon(rg, L, 1 + (i % LAB.FLOORS_N)); if (mineSet.has(w.base)) { err("genWeapon дал «" + w.base + "» на уровне " + L); break; } }
}

/* ── 10. замечания для подключения: где канал src пока не учитывают ──
   Это не ошибки арсенала — проверка их не валит, а показывает, что ещё
   осталось сделать в чужом коде; когда фильтры появятся, строки исчезнут. */
const notes = [];
(function integration() {
  const deny = (def, ch) => !!(def && def.src && def.src !== ch);
  /* случайное оружие (находки: этажи, тайные комнаты, сейфы, стойки) */
  const bad = {};
  [15, 33, 52, 70, 93].forEach((L) => { const rg = LAB.Rng("arsenal-note", "W" + L); for (let i = 0; i < 1500; i++) { const w = LAB.genWeapon(rg, L, 1 + (i % LAB.FLOORS_N)); if (mineSet.has(w.base) && deny(LAB.WEAPONS[w.base], "find")) bad[w.base] = 1; } });
  const nb = Object.keys(bad).length;
  if (nb) notes.push("LAB.genWeapon (world.js) берёт и оружие «только у верстака» и «только в продаже» — для находок нужен фильтр по src; таких в выборке: " + nb + " (например, " + Object.keys(bad).slice(0, 4).join(", ") + ")");
  /* вещи на полу этажа (world.js: предметы с depth) */
  const onFloor = {};
  [[33, 3], [52, 5], [62, 8], [93, 11]].forEach((p) => {
    try { const fl = LAB.getFloor("arsenal-note", p[0], p[1]); (fl.items || []).forEach((it) => { if (it.kind === "item" && mineSet.has(it.item) && deny(LAB.ITEMS[it.item], "find")) onFloor[it.item] = 1; if (it.kind === "weapon" && it.w && mineSet.has(it.w.base) && deny(LAB.WEAPONS[it.w.base], "find")) onFloor[it.w.base] = 1; }); } catch (e) { /* этаж не построился — это скажет генерация ниже */ }
  });
  if (LAB.clearFloorCache) LAB.clearFloorCache();
  if (Object.keys(onFloor).length) notes.push("на полу этажей лежат вещи не «находки»: " + Object.keys(onFloor).join(", ") + " — world.js (предметы с depth и genWeapon) не смотрит на src");
  /* справочник деталей у верстака (workshop.js uses) не должен называть рецепты глубже текущего уровня */
  const early = new Set();
  const usesBody = (() => { try { const s0 = fs.readFileSync(path.join(ROOT, "js/workshop.js"), "utf8"), i = s0.indexOf("function uses("); return i < 0 ? "" : s0.slice(i, s0.indexOf("\nfunction ", i + 10)); } catch (e) { return ""; } })();
  if (!/minL/.test(usesBody)) LAB.PARTS.forEach((k) => {
    const kn = [];
    LAB.RECIPES.forEach((rc) => { if (rc.need && rc.need[k] && !rc.bp) kn.push(rc); });
    kn.slice(0, 6).forEach((rc) => { if (A.recipes.indexOf(rc.id) >= 0 && (LAB.PART_DEPTH[k] || 1) <= 9) early.add(rc.n); });
  });
  if (early.size) notes.push("workshop.js uses() («Детали: где найти и для чего») перебирает все рецепты без фильтра minL — на уровнях 1–9 прозвучат: " + Array.from(early).join(", ") + "; нужен фильтр, как в avail()");
  /* продажа и подсказки — по тексту кода: смотрит ли функция на src */
  const body = (file, fn) => { try { const s = fs.readFileSync(path.join(ROOT, file), "utf8"), i = s.indexOf("function " + fn + "("); if (i < 0) return null; const j = s.indexOf("\nfunction ", i + 10); return s.slice(i, j < 0 ? s.length : j); } catch (e) { return null; } };
  const usesSrc = (b) => b != null && /\.src\b|ARSENAL17|srcOk|channel:\s*["']buy["']/.test(b);
  [["js/game.js", "vendingItems", "торговый терминал продаёт все предметы своей глубины — гранатам «только у верстака» и «находка» нужен фильтр src"],
    ["js/supply.js", "shelfPool", "полка пункта снабжения берёт все предметы своей глубины — гранатам «только у верстака» и «находка» нужен фильтр src"],
    ["js/supply.js", "makeStock", "оружие пункта снабжения — из genWeapon: сюда — «только в продаже» и обычное, без «находок» и «только у верстака»"],
    ["js/workshop.js", "srcOf", "srcOf() читает ITEMS[k].src как текст подсказки, а у гранат там теперь craft, find или buy (см. LAB.ARSENAL17.srcText)"]
  ].forEach((t) => { const b = body(t[0], t[1]); if (b != null && !(t[1] === "srcOf" ? /ARSENAL17|srcText|["']craft["']/.test(b) : usesSrc(b))) notes.push(t[0] + " " + t[1] + ": " + t[2]); });
})();

/* ── 11. генерация комплекса с арсеналом: копия world.test.js ── */
if (!FAST) {
  const src = fs.readFileSync(WT, "utf8");
  /* world.test.js уже подключает арсенал — проверяем его как есть; иначе — копия с арсеналом */
  const already = /"js\/arsenal\.js"/.test(src);
  let mod = already ? src : src.replace(/for \(const f of \[([^\]]*)\]\)/, (m0, inner) => "for (const f of [" + inner + ", " + JSON.stringify(ARS) + "])");
  const rootLine = 'const ROOT = path.resolve(__dirname, "..");';
  let tmp;
  if (mod.indexOf(rootLine) >= 0) { mod = mod.replace(rootLine, "const ROOT = " + JSON.stringify(ROOT) + ";"); tmp = path.join(os.tmpdir(), "arsenal_world_" + process.pid + ".js"); }
  else tmp = path.join(__dirname, ".arsenal_world_" + process.pid + ".tmp.js"); /* рядом с оригиналом: __dirname тот же */
  if (!already && (mod === src || mod.indexOf(JSON.stringify(ARS)) < 0)) err("не удалось добавить арсенал в копию world.test.js");
  else {
    fs.writeFileSync(tmp, mod);
    try {
      const t0 = Date.now();
      const res = cp.spawnSync(process.execPath, [tmp, "1", "10"], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
      const out = (res.stdout || "") + (res.stderr || "");
      const line = out.split("\n").filter((l) => /^уровней:/.test(l))[0] || "";
      if (res.status !== 0) err("генерация с арсеналом не прошла: " + (line || "") + "\n" + out.split("\n").filter((l) => /✗|Error|at /.test(l)).slice(0, 20).join("\n"));
      else ok("генерация с арсеналом (world.test.js 1 10, " + Math.round((Date.now() - t0) / 1000) + " с): " + line);
    } finally { try { fs.unlinkSync(tmp); } catch (e) { /* уже нет */ } }
  }
}

/* ── итог ── */
const C = A.channels || {};
function chan(t) { return ["craft", "find", "buy"].map((s) => s + " " + ((C[t] && C[t][s]) || []).length).join(", "); }
notes.forEach((n) => console.log("⚠ подключение: " + n));
console.log("арсенал: оружия " + A.weapons.length + " (" + chan("weapons") + "), гранат " + A.grenades.length + " (" + chan("grenades") + "), зарядов " + A.ammo.length + ", рецептов " + A.recipes.length + ", звуков в sounds.js " + (SND ? SND.size : 0));
if (fails) { console.error("ошибок: " + fails); process.exit(1); }
console.log("ВСЁ ХОРОШО");
