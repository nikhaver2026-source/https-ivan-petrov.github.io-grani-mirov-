/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — груз (после 4.6).
   У каждой вещи свой вес. Сколько унесёт герой, решают сила (главное),
   телосложение и выносливость (stats.js), а ещё экзокаркас: пока заряжен,
   его приводы держат груз и сам каркас ничего не весит, разряженный —
   мёртвый вес; силовая броня «Атлант»; дрон с грузовым захватом в воздухе.
   Надетая броня весит вполовину: она на теле, а не в рюкзаке.
   Ступени: до половины предела — налегке; до предела — обычный ход;
   на четверть сверх — перегруз: шаг тяжелее и громче, усталость быстрее,
   точность и уклонение ниже; на половину сверх — тяжёлый перегруз, всё
   вдвое; больше — с места не сдвинуться, пока не сбросите лишнее. Такого
   с пола не поднять: «Эхо» скажет, сколько не хватает.
   Тяжёлое оружие ещё и требует силы: не хватает — точность ниже, пока
   нет каркаса (его приводы добавляют силы рукам).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function G() { return LAB.game.G; }
function gm() { return LAB.game; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function snd(id, alt, o) { var S = LAB.SND || {}; A("play", S[id] ? id : (alt || id), o); }
function plural(n, a, b, c) { return gm().plural ? gm().plural(n, a, b, c) : a; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function hs(k) { return LAB.heroStat ? LAB.heroStat(k) : (G()[k] == null ? 10 : G()[k]); }
function secS(k) { return LAB.stats ? LAB.stats.sec(k) : 0; }

/* «1 килограмм», «2,5 килограмма», «12 килограммов» */
function kg(x) {
  var r = Math.round(x * 10) / 10, t = String(r).replace(".", ",");
  return t + " " + (r % 1 ? "килограмма" : plural(Math.abs(r), "килограмм", "килограмма", "килограммов"));
}

/* ── ВЕС ВЕЩЕЙ ── по виду, тяжёлые и лёгкие — отдельно (кило за штуку) */
var KIND_WT = { chem: 0.2, deploy: 5, eng: 1, food: 0.3, implant: 0.05, misc: 0.1, part: 0.25, throw: 0.4, tool: 0.8, trap: 1, use: 0.3, valuable: 0.2, wmodule: 0.3 };
var ID_WT = {
  scrap: 0.6, wire: 0.2, chip: 0.05, cap: 0.05, gel: 0.2, reagent: 0.2, lens: 0.05, magnet: 0.3, ceramic: 0.4, supercond: 0.2, servo: 0.8, panel: 1.5, powercell: 1.5,
  cell: 0.4, relay: 0.1, optic: 0.1, lead: 1, rubber: 0.2, filtercart: 0.2, film: 0.05, c_report: 0.05,
  plate: 2, medkit_s: 0.4, medkit_l: 1, stim: 0.05, antidote: 0.1, bandage: 0.1, sorbent: 0.2, neuroblock: 0.05, okokey: 0.1, lockpick: 0.05, decoder: 0.3, jammer: 0.4, rub_jack: 4, energy_d: 0.3,
  water: 0.6, coldtea: 0.5, mre: 0.6, ration: 0.5, stew: 0.5, vitamins: 0.05, glucose: 0.05, choco: 0.1, nuts: 0.15, crackers: 0.2,
  toolkit: 2.5, splice: 0.5, dosimeter: 0.4, wirecutters: 0.4, g_thermos_e: 1, respirator: 0.5, tape: 0.2,
  goldbar: 1, isotope: 2, flask: 0.3, watch: 0.1, ring: 0.02, pen: 0.03, medal: 0.05, harmonica: 0.2, datachip: 0.02, culture: 0.2, reel_torn: 0.2, badge: 0.05,
  kv_ctrl: 1.2, kv_ncore: 0.6, kv_bcore: 0.6, kv_hcharge: 0.8, kv_barrel: 3.5,
  turret_kit: 7, turret_kit2: 9, i_seedling: 0.5, o_mirrortrap: 2, k_sprinklerkit: 4, m_pockturret: 3, v12_tripod: 6, v8_walkerkit: 6, v6_sparring: 4,
  tr_jaw: 2, tr_mine: 1, tr_net: 1.5, tr_wire: 0.5, tr_glue: 0.8, tr_spikes: 1.5, tr_alarm: 0.3
};
var AMMO_WT = { energy: 0.2, magnetron: 0.35, positron: 0.4 };
var WCLS_WT = { melee: 2, blaster: 1.4, laser: 2.5, ion: 3, plasma: 4, magnetron: 5, positron: 4.5, gauss: 6, cryo: 3.5, thermo: 4, sonic: 3, bio: 2.5, nano: 2, phase: 3, grav: 5.5, kinetic: 3.5 };
var WBASE_WT = { crowbar: 2.5, spark: 1.2 };
var OWN_WT = { rail: 9, pike: 4.5, mw: 6, blade: 1.5, plasma: 7 };
var FRAME_WT = { light: 12, mid: 24, heavy: 40 };
var FRAME_CAP = { light: 10, mid: 25, heavy: 45 };   /* приводы держат груз, пока каркас заряжен */
var FRAME_HAND = { light: 2, mid: 4, heavy: 7 };     /* и добавляют силы рукам с тяжёлым оружием */
var DRONE_WT = 3.5, DRONE_CAP = 12;
/* (после 4.6) ключ-карта складской ячейки: без глубины и с разделом — в генерацию этажей не попадает
   (world.js берёт вещи с глубиной и без раздела), не продаётся — на полки пунктов тоже не попадает */
if (!LAB.ITEMS.lockcard) LAB.ITEMS.lockcard = { n: "Ключ-карта складской ячейки", icon: "🗝️", kind: "use", cat: "eng", nosell: 1, price: 40,
  desc: "Пластиковая карта выбывшего сотрудника с номером его ячейки в сети снабжения. Использованная из инвентаря, присоединяет ту ячейку к вашей: плюс десять килограммов и два места. Всего — до пяти карт." };
ID_WT.lockcard = 0.02;

function itemWt(id) {
  var d = LAB.ITEMS[id];
  if (ID_WT[id] != null) return ID_WT[id];
  if (!d) return 0.3;
  if (d.wt != null) return d.wt;
  if (d.small) return 0.1;
  return KIND_WT[d.kind] != null ? KIND_WT[d.kind] : 0.3;
}
function weaponWt(w) {
  if (!w) return 0;
  if (w.own && OWN_WT[w.own.fam] != null) return OWN_WT[w.own.fam];
  if (WBASE_WT[w.base] != null) return WBASE_WT[w.base];
  var b = LAB.WEAPONS && LAB.WEAPONS[w.base], c = (b && b.cls) || w.cls;
  return WCLS_WT[c] != null ? WCLS_WT[c] : 3;
}
function armorWt(a) {
  if (!a) return 0;
  var b = LAB.ARMORS && LAB.ARMORS[a.base], def = b && b.def != null ? b.def : 4;
  return Math.round((2 + def * 1.2 + 1.5 * (a.up || 0)) * 10) / 10;   /* пластины — по полтора кило */
}
function frameWt(f) { return f ? (FRAME_WT[f.cls] || 20) + 2 * ((f.plates && f.plates.length) || 0) : 0; }
function wornFrame() { return LAB.exo && LAB.exo.worn ? LAB.exo.worn() : null; }
function frameLive(f) { return !!f && (f.en || 0) > 0; }
/* Вес вещи с пола (для отказа поднять): записки, ключи, кредиты, пропуска — ничего не весят. */
function floorWt(it) {
  if (!it) return 0;
  switch (it.kind) {
    case "item": return itemWt(it.item) * (it.n || 1);
    case "ammo": return (AMMO_WT[it.ammo] || 0.4) * (it.n || 1);
    case "weapon": return weaponWt(it.w);
    case "armor": return armorWt(it.a);
    case "frame": return frameWt(it.f);
    case "sample": return 0.1;
  }
  return 0;
}

/* ── СКОЛЬКО НЕСЁТЕ ── по разделам: для окна «Груз» */
function parts() {
  var g = G(), p = { inv: 0, weapons: 0, armor: 0, ammo: 0, frames: 0, drone: 0, samples: 0 }, k;
  for (k in g.inv) if (g.inv[k] > 0) p.inv += itemWt(k) * g.inv[k];
  (g.weapons || []).forEach(function (w) { p.weapons += weaponWt(w); });
  (g.armors || []).forEach(function (a) { p.armor += armorWt(a) * (a === g.armor ? 0.5 : 1); });
  for (k in (g.ammo || {})) p.ammo += (AMMO_WT[k] || 0.4) * (g.ammo[k] || 0);
  var on = wornFrame();
  (g.frames || []).forEach(function (f) { if (!(f === on && frameLive(f))) p.frames += frameWt(f); });
  var d = g.drone; if (d && (!d.out || d.wreck)) p.drone = DRONE_WT;
  p.samples = Object.keys(g.samples || {}).length * 0.1;
  return p;
}
function total() { var p = parts(), t = 0; for (var k in p) t += p[k]; return Math.round(t * 10) / 10; }

/* ── ПРЕДЕЛ ── 20 кило — основа; сила — по два за единицу, телосложение — по 0,75 за единицу
   выше десяти, выносливость — по 0,5; каркас, силовая броня и дрон — свои прибавки */
function capOf(src) {
  var g = G(), f;
  switch (src) {
    case "base": return 10;
    case "str": return Math.max(0, hs("str")) * 2;
    case "con": return Math.max(0, hs("con") - 10) * 0.75;
    case "stam": return secS("stam") * 0.5;
    case "exo": f = wornFrame(); return f && frameLive(f) ? (FRAME_CAP[f.cls] || 0) * (LAB.exo.strOk(f) ? 1 : 0.5) : 0;
    case "armor": return gm().armorSpecial && gm().armorSpecial("strength") ? 15 : 0;
    case "drone": return g.drone && g.drone.out && !g.drone.wreck && g.drone.mods && g.drone.mods.indexOf("cargo") >= 0 ? DRONE_CAP : 0;
  }
  return 0;
}
var SRC = ["base", "str", "con", "stam", "exo", "armor", "drone"];
function capacity() { var c = 0; SRC.forEach(function (s) { c += capOf(s); }); return Math.round(c * 10) / 10; }
function ratio() { var c = capacity(); return c > 0 ? total() / c : 9; }
/* 0 налегке, 1 обычно, 2 перегруз, 3 тяжёлый перегруз, 4 неподъёмно */
function tierOf(r) { return r <= 0.5 ? 0 : r <= 1 ? 1 : r <= 1.25 ? 2 : r <= 1.5 ? 3 : 4; }
function tier() { return tierOf(ratio()); }
var TIER_N = ["налегке", "обычный ход", "перегруз", "тяжёлый перегруз", "неподъёмно"];

/* ── ПОСЛЕДСТВИЯ ── выносливость смягчает замедление */
function stamSoft() { return 1 - Math.min(0.45, secS("stam") * 0.015); }
function gapK() { var t = tier(); return t <= 1 ? 1 : 1 + (t === 2 ? 0.4 : 1) * stamSoft(); }
function stepGap() { var t = tier(); return t === 2 ? 120 : t === 3 ? 260 : 0; }
function noise() { var t = tier(); return t === 2 ? 2 : t === 3 ? 4 : 0; }
function wakeK() { var t = tier(); return t === 2 ? 1.5 : t === 3 ? 2 : 1; }
function dodgePen() { var t = tier(); return t === 2 ? 0.05 : t === 3 ? 0.1 : 0; }
/* тяжёлое оружие: нужна сила; каркас и силовая броня добавляют силы рукам */
function needStr(w) { return Math.min(20, Math.round(6 + weaponWt(w) * 1.6)); }
function handStr() {
  var f = wornFrame(), add = 0;
  if (f && frameLive(f)) add += (FRAME_HAND[f.cls] || 0) * (LAB.exo.strOk(f) ? 1 : 0.5);
  if (gm().armorSpecial && gm().armorSpecial("strength")) add += 4;
  return hs("str") + add;
}
function handPen(w) { return w ? Math.min(0.2, Math.max(0, needStr(w) - handStr()) * 0.02) : 0; }
function accPen(w) { var t = tier(); return (t === 2 ? 0.05 : t === 3 ? 0.1 : 0) + handPen(w); }

/* С места не сдвинуться: предупреждение не чаще раза в три секунды. */
var stuckSaid = 0;
function canMove() {
  if (tier() < 4) return true;
  var t = Date.now();
  if (t - stuckSaid > 3000) {
    stuckSaid = t;
    snd("pack_heavy", "ui_error");
    say("Груз неподъёмный: " + kg(total()) + " при пределе " + kg(capacity()) + ". С места не сдвинуться — сбросьте хотя бы " + kg(total() - capacity() * 1.5) + ": инвентарь, «Выбросить вещь».");
  }
  return false;
}
/* Можно ли поднять ещё столько — не дальше тяжёлого перегруза. */
function canTake(addKg) { return addKg <= 0.05 || (total() + addKg) <= capacity() * 1.5 + 1e-6; }
function lcf(t) { t = String(t || ""); return t.charAt(0).toLowerCase() + t.slice(1); }
function refuseText(it, w) {
  var over = total() + w - capacity() * 1.5;
  return "Не поднять: " + lcf(gm().itemName ? gm().itemName(it) : "вещь") + " — " + kg(w) + ". Груз и так " + kg(total()) + " при пределе " + kg(capacity()) + ", лишнего — " + kg(over) + ".";
}

/* Ступень сменилась — сказать один раз (после подбора, покупки, выброса, смены каркаса). */
var lastTier = -1;
function after(quiet) {
  if (!LAB.game || !gm().entered) return;
  var t = tier();
  if (lastTier < 0) { lastTier = t; return; }
  if (t === lastTier) return;
  var up = t > lastTier; lastTier = t;
  if (quiet) return;
  if (up && t >= 2) snd("pack_heavy", "loot_drop");
  var why = t === 4 ? "с места не сдвинуться, сбросьте лишнее" : t === 3 ? "шаг вдвое тяжелее и громче, усталость вдвое быстрее, точность и уклонение ниже" : t === 2 ? "шаг тяжелее и громче, усталость быстрее, точность чуть ниже" : t === 1 ? (up ? "обычный ход" : "перегруз позади, шаг снова лёгкий") : "налегке";
  sayq("Груз " + kg(total()) + " из " + kg(capacity()) + ": " + TIER_N[t] + (t >= 2 || t === 1 ? " — " + why : "") + ".");
}
/* новая игра, загрузка: ступень — нынешняя, без объявления */
function reset() { lastTier = -1; try { if (LAB.game && G()) lastTier = tier(); } catch (e) { lastTier = -1; } }

/* ── СВЕДЕНИЯ ── */
function heaviest() {
  var g = G(), list = [], k;
  for (k in g.inv) if (g.inv[k] > 0 && LAB.ITEMS[k]) list.push({ n: LAB.ITEMS[k].n + (g.inv[k] > 1 ? ", " + g.inv[k] + " шт." : ""), w: itemWt(k) * g.inv[k] });
  (g.weapons || []).forEach(function (w) { list.push({ n: w.name, w: weaponWt(w) }); });
  (g.armors || []).forEach(function (a) { list.push({ n: a.name + (a === g.armor ? ", на вас" : ""), w: armorWt(a) * (a === g.armor ? 0.5 : 1) }); });
  var on = wornFrame();
  (g.frames || []).forEach(function (f) { if (!(f === on && frameLive(f))) list.push({ n: (LAB.exo && LAB.exo.frameName ? LAB.exo.frameName(f) : "экзокаркас") + (f === on ? ", на вас, без заряда" : ""), w: frameWt(f) }); });
  list.sort(function (a, b) { return b.w - a.w; });
  return list.filter(function (x) { return x.w >= 0.5; }).slice(0, 5);
}
function line() {
  var t = tier();
  return "Груз " + kg(total()) + " из " + kg(capacity()) + ": " + TIER_N[t] + ".";
}
function capText() {
  var names = { base: "основа", str: "сила", con: "телосложение", stam: "выносливость", exo: "приводы каркаса", armor: "силовая броня", drone: "грузовой захват дрона" };
  return SRC.filter(function (s) { return capOf(s) > 0; }).map(function (s) { return names[s] + " " + kg(capOf(s)); }).join(", ");
}
function status() {
  if (!gm().entered) return;
  var h = heaviest(), w = gm().curWeapon ? gm().curWeapon() : null, hp = handPen(w);
  var ln = G().locker ? lockerN() : 0;
  say(line() + " Предел складывают: " + capText() + "." + (ln ? " В ячейке хранения — " + kg(lockerWt()) + "." : "") + (h.length ? " Тяжелее всего: " + h.map(function (x) { return x.n + " — " + kg(x.w); }).join("; ") + "." : "") +
    (hp ? " " + (w ? w.name : "Оружие") + " тяжело для ваших рук: нужна сила " + needStr(w) + ", точность ниже на " + Math.round(hp * 100) + " процентов." : ""));
}
/* оружие в руках тяжело — сказать, когда его берут (draw, смена) */
var handSaid = {};
function handNote(w) {
  if (!w) return "";
  var hp = handPen(w);
  if (!hp || handSaid[w.id]) return "";
  handSaid[w.id] = 1;
  return " Тяжело для ваших рук: нужна сила " + needStr(w) + ", у вас " + Math.round(handStr()) + " — точность ниже на " + Math.round(hp * 100) + " процентов. Каркас добавит силы рукам.";
}
function weaponLine(w) { return "Вес " + kg(weaponWt(w)) + ", нужна сила " + needStr(w) + (handPen(w) ? " — у вас меньше, точность ниже на " + Math.round(handPen(w) * 100) + " процентов" : "") + "."; }


/* ════════ ЯЧЕЙКА ХРАНЕНИЯ ════════
   Своя ячейка в сети снабжения комплекса, как личная ячейка-мастерская в «Квази-эпсилоне»:
   открывается у любой капсулы восстановления, у верстака и у пункта снабжения; что положили
   в одном месте, заберёте в другом — ячейку возят пневмопочта и грузовые лифты снабжения.
   В ячейке вещи ничего не весят, но ячейка не безразмерная: у неё свой предел веса и мест.
   Место занимает каждый вид вещей (стопка любой длины), вид батарей, каждое оружие; броня —
   два места, экзокаркас — четыре. Чем больше ячейка, тем дороже каждое новое место.
   Расширить ячейку можно пятью путями:
   — кредиты у пункта снабжения: восемь ступеней, плюс двадцать килограммов и четыре места за
     ступень; каждая следующая в полтора раза дороже прежней, глубже — дороже;
   — аренда соседней ячейки у пункта снабжения на трое суток: плюс сорок килограммов и восемь
     мест; цена растёт с размером ячейки и с каждой арендой; кончилась — вещи целы, но класть
     нельзя, пока не заберёте лишнее;
   — своими руками у верстака: полки и перегородки (места), усиленное дно (вес) — из деталей,
     нужна ступень механики, каждые следующие полки и дно — из большего числа деталей;
   — ключ-карты складских ячеек выбывших сотрудников: падают с машин ОКО — чаще с охраны и
     начальников смен; карта присоединяет соседнюю ячейку, до пяти карт;
   — харизма: с 20 и с 30 кладовщики снабжения находят лишние места; она же снижает цены.
   Оружие в руках, надетые броня и каркас и стартовая монтировка (ею вскрывают шкафчики)
   в ячейку не кладутся. */
var LOCK_KG = 40, LOCK_SLOTS = 10, LOCK_ADD_KG = 20, LOCK_ADD_SLOTS = 4, LOCK_MAX_LV = 8;
var SLOT_ARMOR = 2, SLOT_FRAME = 4;
var RENT_KG = 40, RENT_SLOTS = 8, RENT_MIN = 3 * 1440;          /* аренда соседней ячейки: трое суток */
var SHELF_SLOTS = 4, FLOOR_KG = 20, CRAFT_MAX = 3;               /* своими руками у верстака */
var CARD_KG = 10, CARD_SLOTS = 2, CARD_MAX = 5;                  /* ключ-карты складских ячеек */
var SHELF_NEED = { scrap: 4, panel: 2, wire: 1 }, FLOOR_NEED = { scrap: 3, servo: 1, magnet: 2 };
function nowAbs() { var g = G(); return ((g.day || 1) - 1) * 1440 + (g.min || 0); }
function rented() { var l = Lk(); return (l.rentUntil || 0) > nowAbs(); }
function chaSlots() { var c = G().cha == null ? 10 : G().cha; return c >= 30 ? 4 : c >= 20 ? 2 : 0; }   /* основа, без плодов: места не мигают */
function chaK() { return gm().chaK ? gm().chaK() : 1; }
function Lk() {
  var g = G();
  if (!g.locker) g.locker = { inv: {}, ammo: {}, weapons: [], armors: [], frames: [], lv: 0 };
  var l = g.locker;
  ["inv", "ammo"].forEach(function (k) { if (!l[k]) l[k] = {}; });
  ["weapons", "armors", "frames"].forEach(function (k) { if (!l[k]) l[k] = []; });
  if (!(l.lv >= 0)) l.lv = 0;
  return l;
}
/* предел: основа + ступени снабжения + полки и дно + ключ-карты + аренда + харизма */
function capParts() {
  var l = Lk(), lv = Math.min(LOCK_MAX_LV, l.lv || 0), sh = Math.min(CRAFT_MAX, l.shelf || 0), fl = Math.min(CRAFT_MAX, l.floor || 0), cd = Math.min(CARD_MAX, l.cards || 0), rt = rented();
  return [
    { n: "основа", kg: LOCK_KG, sl: LOCK_SLOTS },
    { n: "ступени снабжения " + lv + " из " + LOCK_MAX_LV, kg: LOCK_ADD_KG * lv, sl: LOCK_ADD_SLOTS * lv },
    { n: "полки " + sh + " из " + CRAFT_MAX, kg: 0, sl: SHELF_SLOTS * sh },
    { n: "усиленное дно " + fl + " из " + CRAFT_MAX, kg: FLOOR_KG * fl, sl: 0 },
    { n: "ключ-карты " + cd + " из " + CARD_MAX, kg: CARD_KG * cd, sl: CARD_SLOTS * cd },
    { n: "аренда соседней ячейки" + (rt ? " до " + untilText(l.rentUntil) : ""), kg: rt ? RENT_KG : 0, sl: rt ? RENT_SLOTS : 0 },
    { n: "договорённость по харизме", kg: 0, sl: chaSlots() }
  ];
}
function lockCap() { var kgS = 0, sl = 0; capParts().forEach(function (p) { kgS += p.kg; sl += p.sl; }); return { kg: kgS, slots: sl }; }
function untilText(t) { var d = Math.floor(t / 1440) + 1, m = t % 1440, h = Math.floor(m / 60), mm = m % 60; return "дня " + d + ", " + (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
function capWhy() { return capParts().filter(function (p) { return p.kg || p.sl; }).map(function (p) { return p.n + ": " + [p.kg ? kg(p.kg) : "", p.sl ? p.sl + " " + plural(p.sl, "место", "места", "мест") : ""].filter(Boolean).join(" и "); }).join("; "); }
function lockerWt() { var l = Lk(), t = 0, k; for (k in l.inv) t += itemWt(k) * l.inv[k]; for (k in l.ammo) t += (AMMO_WT[k] || 0.4) * l.ammo[k]; l.weapons.forEach(function (w) { t += weaponWt(w); }); l.armors.forEach(function (a) { t += armorWt(a); }); l.frames.forEach(function (f) { t += frameWt(f); }); return Math.round(t * 10) / 10; }
function lockerN() { var l = Lk(), n = 0, k; for (k in l.inv) n += l.inv[k]; for (k in l.ammo) n += l.ammo[k]; return n + l.weapons.length + l.armors.length + l.frames.length; }
function slotsUsed() {
  var l = Lk(), n = 0, k;
  for (k in l.inv) if (l.inv[k] > 0) n++;
  for (k in l.ammo) if (l.ammo[k] > 0) n++;
  return n + l.weapons.length + SLOT_ARMOR * l.armors.length + SLOT_FRAME * l.frames.length;
}
function freeKg() { return Math.max(0, Math.round((lockCap().kg - lockerWt()) * 100) / 100); }
function freeSlots() { return Math.max(0, lockCap().slots - slotsUsed()); }
function capLine() { var c = lockCap(); return "занято " + kg(lockerWt()) + " из " + kg(c.kg) + ", мест " + slotsUsed() + " из " + c.slots; }
/* сколько штук вида влезет: по весу и по месту (новый вид — нужно свободное место) */
function fitN(have, w1, isNew, slots) {
  if (isNew && freeSlots() < (slots || 1)) return 0;
  if (w1 <= 0) return have;
  return Math.max(0, Math.min(have, Math.floor((freeKg() + 1e-6) / w1)));
}
function whyFull(w1, isNew, slots) {
  if (isNew && freeSlots() < (slots || 1)) return "в ячейке нет места: занято " + slotsUsed() + " из " + lockCap().slots + (slots > 1 ? ", а здесь нужно " + slots : "");
  return "в ячейке осталось " + kg(freeKg()) + ", а нужно хотя бы " + kg(w1);
}
var upHint = function () { return (Lk().lv || 0) < LOCK_MAX_LV ? " Ячейку расширяют у пункта снабжения." : ""; };
function itemN(id) { var d = LAB.ITEMS[id]; return d ? d.n : id; }
/* положить n штук; кладётся сколько влезет — сказать, если не всё */
function putItem(id, n, quiet) {
  var g = G(), l = Lk();
  var why = gm().dropWhy ? gm().dropWhy(id) : "";
  if (why) { if (!quiet) { LAB.UI.error(); say(why); } return 0; }
  n = Math.min(n || 1, g.inv[id] || 0);
  if (n <= 0) return 0;
  var w1 = itemWt(id), fit = fitN(n, w1, !(l.inv[id] > 0), 1);
  if (fit <= 0) { if (!quiet) { LAB.UI.error(); say("Не влезет: " + whyFull(w1, !(l.inv[id] > 0), 1) + "." + upHint()); } return 0; }
  n = fit;
  /* собранное своими руками остаётся собранным и в ячейке (скупка собранного — supply.js) */
  var cH = g.craftN && g.craftN[id] ? Math.min(g.craftN[id], g.inv[id]) : 0, cD = Math.max(0, n - (g.inv[id] - cH));
  if (cD) { g.craftN[id] -= cD; l.craft = l.craft || {}; l.craft[id] = (l.craft[id] || 0) + cD; }
  g.inv[id] -= n; if (!(g.inv[id] > 0)) delete g.inv[id];
  l.inv[id] = (l.inv[id] || 0) + n;
  return n;
}
function takeItem(id, n) {
  var g = G(), l = Lk();
  n = Math.min(n || 1, l.inv[id] || 0);
  if (n <= 0) return false;
  if (!canTake(itemWt(id) * n)) { LAB.UI.error(); say("Столько не унести: " + itemN(id).toLowerCase() + ", " + n + " шт. — " + kg(itemWt(id) * n) + ", а груз " + kg(total()) + " при пределе " + kg(capacity()) + "."); return false; }
  l.inv[id] -= n; if (!(l.inv[id] > 0)) delete l.inv[id];
  g.inv[id] = (g.inv[id] || 0) + n;
  var cr = l.craft && l.craft[id] ? Math.min(l.craft[id], n) : 0;
  if (cr) { l.craft[id] -= cr; g.craftN = g.craftN || {}; g.craftN[id] = (g.craftN[id] || 0) + cr; }
  return true;
}
function lockOk(kind, o) {
  var g = G();
  if (kind === "weapon") return o !== g.weapons[g.wi] && o.id !== "w_start_crowbar";
  if (kind === "armor") return o !== g.armor;
  if (kind === "frame") return !(g.exoOn && g.exoOn === o.id);
  return true;
}
function moved(msg) { snd("pack_heavy", "pick_part", { gain: 0.6 }); say(msg); after(); UIx("refresh"); if (gm().autosaveSoon) gm().autosaveSoon(); }
/* «Сдать все детали»: детали из рюкзака — в ячейку, сколько влезет: сначала тяжёлые (они больше всего мешают идти) */
function putParts() {
  var g = G(), n = 0, w = 0, left = 0;
  Object.keys(g.inv).filter(function (id) { var d = LAB.ITEMS[id]; return d && d.kind === "part" && g.inv[id] > 0; })
    .sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; })
    .forEach(function (id) { var c = g.inv[id], put = putItem(id, c, true); n += put; w += itemWt(id) * put; left += c - put; });
  if (!n) { if (left) { LAB.UI.error(); say("Детали не влезают: " + capLine() + "." + upHint()); } else say("Деталей в рюкзаке нет."); return; }
  moved("В ячейку ушли детали: " + n + " шт., " + kg(w) + "." + (left ? " Не влезло ещё " + left + " шт.: " + capLine() + "." + upHint() : "") + " " + line());
}
function takeParts() {
  var l = Lk(), n = 0, w = 0, left = 0;
  Object.keys(l.inv).forEach(function (id) {
    var d = LAB.ITEMS[id]; if (!(d && d.kind === "part")) return;
    var c = l.inv[id], fit = c;
    while (fit > 0 && !canTake(itemWt(id) * fit)) fit--;
    if (fit > 0 && takeItem(id, fit)) { n += fit; w += itemWt(id) * fit; }
    left += c - fit;
  });
  if (!n) { say(left ? "Детали не унести: груз и так тяжёлый." : "Деталей в ячейке нет."); return; }
  moved("Из ячейки взяты детали: " + n + " шт., " + kg(w) + "." + (left ? " Не унести ещё " + left + " шт.: остались в ячейке." : "") + " " + line());
}
function sliderFor(label, max, w1, fn) {
  var v = { n: max };
  return { kind: "slider", label: label, min: 1, max: max, step: 1, get: function () { return v.n; }, set: function (x) { v.n = Math.max(1, Math.min(max, Math.round(x))); },
    fmt: function (x) { return Math.round(x) + " шт., " + kg(w1 * Math.round(x)); }, fn: function () { fn(v.n); } };
}
/* пункт, который не влезает: называет причину и окно не закрывает */
function fullItem(label, why) { return { label: label + " — не влезет", disabled: true, why: "Не влезет: " + why + "." + upHint() }; }
function putGear(list, kind, o, slots, wt, label, msgName) {
  if (!lockOk(kind, o)) return null;
  var w = wt(o), fits = freeSlots() >= slots && freeKg() + 1e-6 >= w;
  if (!fits) return fullItem(label, freeSlots() < slots ? whyFull(w, true, slots) : whyFull(w, false, slots));
  return { label: label, fn: function () {
    if (!(freeSlots() >= slots && freeKg() + 1e-6 >= w)) { LAB.UI.error(); say("Не влезет: " + capLine() + "." + upHint()); return; }
    var i = list.indexOf(o); if (i < 0) return; list.splice(i, 1);
    if (kind === "weapon") { var cur = G().weapons[G().wi]; G().wi = Math.max(0, G().weapons.indexOf(cur)); }
    Lk()[kind === "weapon" ? "weapons" : kind === "armor" ? "armors" : "frames"].push(o);
    moved("В ячейке: " + msgName + ". " + line());
  } };
}
function putMenu() {
  var g = G(), l = Lk(), items = [];
  Object.keys(g.inv).filter(function (id) { return g.inv[id] > 0 && LAB.ITEMS[id]; }).sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; }).forEach(function (id) {
    var c = g.inv[id], w1 = itemWt(id), isNew = !(l.inv[id] > 0), fit = fitN(c, w1, isNew, 1), nm = itemN(id) + (c > 1 ? ": в рюкзаке " + c + ", " : ", ") + kg(w1 * c);
    if (fit <= 0) { items.push(fullItem(nm, whyFull(w1, isNew, 1))); return; }
    if (fit > 1) items.push(sliderFor(nm + (fit < c ? "; влезет " + fit : ""), fit, w1, function (n) { var p = putItem(id, n); if (p) moved("В ячейке: " + itemN(id).toLowerCase() + ", " + p + " шт. " + line()); }));
    else items.push({ label: nm + (fit < c ? "; влезет одна" : ""), fn: function () { if (putItem(id, 1)) moved("В ячейке: " + itemN(id).toLowerCase() + ". " + line()); } });
  });
  Object.keys(g.ammo || {}).filter(function (k) { return g.ammo[k] > 0; }).forEach(function (k) {
    var c = g.ammo[k], w1 = AMMO_WT[k] || 0.4, nm = LAB.AMMO[k] ? LAB.AMMO[k].n : k, isNew = !(l.ammo[k] > 0), fit = fitN(c, w1, isNew, 1), lb = nm + ": " + c + ", " + kg(w1 * c);
    if (fit <= 0) { items.push(fullItem(lb, whyFull(w1, isNew, 1))); return; }
    items.push(sliderFor(lb + (fit < c ? "; влезет " + fit : ""), fit, w1, function (n) {
      n = Math.min(n, g.ammo[k] || 0, fitN(g.ammo[k] || 0, w1, !(Lk().ammo[k] > 0), 1)); if (n <= 0) { LAB.UI.error(); say("Не влезет: " + capLine() + "."); return; }
      g.ammo[k] -= n; Lk().ammo[k] = (Lk().ammo[k] || 0) + n; moved("В ячейке: " + nm.toLowerCase() + ", " + n + " шт. " + line());
    }));
  });
  g.weapons.forEach(function (w) { items.push(putGear(g.weapons, "weapon", w, 1, weaponWt, "Оружие: " + w.name + ", " + kg(weaponWt(w)), w.name)); });
  g.armors.forEach(function (a) { items.push(putGear(g.armors, "armor", a, SLOT_ARMOR, armorWt, "Броня: " + a.name + ", " + kg(armorWt(a)) + ", два места", a.name)); });
  (g.frames || []).forEach(function (f) { var fnm = LAB.exo && LAB.exo.frameName ? LAB.exo.frameName(f) : "экзокаркас"; items.push(putGear(g.frames, "frame", f, SLOT_FRAME, frameWt, "Каркас: " + fnm + ", " + kg(frameWt(f)) + ", четыре места", fnm.toLowerCase())); });
  items = items.filter(Boolean);
  if (!items.length) { say("Класть нечего: в рюкзаке только то, что в руках и на вас."); return; }
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Положить в ячейку", items, { intro: capLine() + ". " + LAB.K("Где вещей несколько — свайп вверх и вниз выбирает, сколько; двойное касание кладёт.", "Где вещей несколько — стрелки вправо и влево выбирают, сколько; Enter кладёт.") });
}
function takeMenu() {
  var g = G(), l = Lk(), items = [];
  Object.keys(l.inv).filter(function (id) { return l.inv[id] > 0; }).forEach(function (id) {
    var c = l.inv[id], w1 = itemWt(id);
    if (c > 1) items.push(sliderFor(itemN(id) + ": в ячейке " + c + ", " + kg(w1 * c), c, w1, function (n) { if (takeItem(id, n)) moved("Взято: " + itemN(id).toLowerCase() + ", " + n + " шт. " + line()); }));
    else items.push({ label: itemN(id) + ", " + kg(w1), fn: function () { if (takeItem(id, 1)) moved("Взято: " + itemN(id).toLowerCase() + ". " + line()); } });
  });
  Object.keys(l.ammo).filter(function (k) { return l.ammo[k] > 0; }).forEach(function (k) {
    var c = l.ammo[k], w1 = AMMO_WT[k] || 0.4, nm = LAB.AMMO[k] ? LAB.AMMO[k].n : k;
    items.push(sliderFor(nm + ": " + c + ", " + kg(w1 * c), c, w1, function (n) { n = Math.min(n, l.ammo[k] || 0); if (n <= 0) return; if (!canTake(w1 * n)) { LAB.UI.error(); say("Столько не унести."); return; } l.ammo[k] -= n; if (!(l.ammo[k] > 0)) delete l.ammo[k]; g.ammo[k] = (g.ammo[k] || 0) + n; moved("Взято: " + nm.toLowerCase() + ", " + n + " шт. " + line()); }));
  });
  var gear = function (list, kind, name, wt, back) {
    list.forEach(function (o) { items.push({ label: kind + ": " + name(o) + ", " + kg(wt(o)), fn: function () { if (!canTake(wt(o))) { LAB.UI.error(); say("Не унести: " + kg(wt(o)) + ", а груз " + kg(total()) + " при пределе " + kg(capacity()) + "."); return; } var i = list.indexOf(o); if (i < 0) return; list.splice(i, 1); back(o); moved("Взято: " + name(o) + ". " + line()); } }); });
  };
  gear(l.weapons, "Оружие", function (w) { return w.name; }, weaponWt, function (w) { g.weapons.push(w); });
  gear(l.armors, "Броня", function (a) { return a.name; }, armorWt, function (a) { g.armors.push(a); });
  gear(l.frames, "Каркас", function (f) { return LAB.exo && LAB.exo.frameName ? LAB.exo.frameName(f) : "экзокаркас"; }, frameWt, function (f) { if (!g.frames) g.frames = []; g.frames.push(f); });
  if (!items.length) { say("Ячейка пуста."); return; }
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Забрать из ячейки", items, { intro: line() });
}
/* расширение — только у пункта снабжения: ячейку перестраивает служба снабжения */
function cr(b) { var g = G(); return Math.max(1, Math.round((LAB.credits ? LAB.credits(b, g.L, g.F) : b) * chaK())); }
function crW(n) { return n + " " + plural(n, "кредит", "кредита", "кредитов"); }
/* ступень снабжения: каждая следующая — в полтора раза дороже; глубже — дороже; харизма — скидка */
function upPrice() { return cr(Math.round(120 * Math.pow(1.5, Lk().lv || 0))); }
/* аренда: чем больше уже ячейка (без самой аренды) и чем чаще арендуют — тем дороже */
function rentPrice() { var l = Lk(), base = lockCap().kg - (rented() ? RENT_KG : 0); return cr(Math.round((60 + 1.2 * base) * (1 + 0.2 * (l.rentN || 0)))); }
function rent() {
  var g = G(), l = Lk(), p = rentPrice();
  if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: аренда стоит " + p + ", у вас " + g.credits + "."); return false; }
  g.credits -= p; l.rentN = (l.rentN || 0) + 1;
  l.rentUntil = Math.max(l.rentUntil || 0, nowAbs()) + RENT_MIN;
  snd("pack_heavy", "vend"); LAB.UI.ok();
  say("Соседняя ячейка ваша до " + untilText(l.rentUntil) + ": плюс " + kg(RENT_KG) + " и " + RENT_SLOTS + " мест. Теперь " + capLine() + ". Списано " + crW(p) + ", осталось " + g.credits + ". Кончится аренда — вещи останутся целы, но класть будет нельзя, пока не заберёте лишнее.");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
/* у верстака: полки (места) и усиленное дно (вес) — из деталей, каждые следующие — из большего числа */
function craftNeed(kind) { var l = Lk(), n = (kind === "shelf" ? l.shelf : l.floor) || 0, base = kind === "shelf" ? SHELF_NEED : FLOOR_NEED, out = {}; for (var k in base) out[k] = Math.ceil(base[k] * (1 + 0.5 * n)); return out; }
function craftStep(kind) { return kind === "shelf" ? 2 : 3; }
function craftLock(kind) { var MS = LAB.mastery; return MS && MS.step && MS.step("mech") < craftStep(kind) ? "нужна ступень механики " + craftStep(kind) + ", у вас " + MS.step("mech") : ""; }
function craftCell(kind) {
  var l = Lk(), W = LAB.workshop, n = (kind === "shelf" ? l.shelf : l.floor) || 0, need = craftNeed(kind), nm = kind === "shelf" ? "Полки и перегородки" : "Усиленное дно";
  if (n >= CRAFT_MAX) { say(nm + " уже в ячейке: " + CRAFT_MAX + " из " + CRAFT_MAX + "."); return false; }
  var lock = craftLock(kind); if (lock) { LAB.UI.error(); say(nm + ": " + lock + "."); return false; }
  if (!W.haveAll(need)) { LAB.UI.error(); say(nm + ": не хватает — " + W.costLack(need) + "."); return false; }
  W.take(need);
  if (kind === "shelf") l.shelf = n + 1; else l.floor = n + 1;
  if (gm().advanceTime) gm().advanceTime(25);
  if (LAB.mastery && LAB.mastery.gain) LAB.mastery.gain("mech", 6);
  snd("work_ratchet", "craft"); LAB.UI.ok();
  say(nm + " собраны и ушли в вашу ячейку по сети снабжения: " + (kind === "shelf" ? "мест плюс " + SHELF_SLOTS : "вес плюс " + kg(FLOOR_KG)) + ". Теперь " + capLine() + ".");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
/* ключ-карта складской ячейки выбывшего сотрудника: присоединяет соседнюю ячейку */
function useCard() {
  var g = G(), l = Lk();
  if (!(g.inv.lockcard > 0)) { say("Ключ-карты нет."); return false; }
  if ((l.cards || 0) >= CARD_MAX) { say("К вашей ячейке и так присоединены " + CARD_MAX + " соседних — больше сеть снабжения не даёт. Лишняя карта не нужна: её можно выбросить."); return false; }
  g.inv.lockcard--; if (!(g.inv.lockcard > 0)) delete g.inv.lockcard;
  l.cards = (l.cards || 0) + 1;
  snd("pack_heavy", "card_ok"); LAB.UI.ok();
  say("Карта считана: ячейка выбывшего сотрудника присоединена к вашей — плюс " + kg(CARD_KG) + " и " + CARD_SLOTS + " места. Присоединено " + l.cards + " из " + CARD_MAX + ". Теперь " + capLine() + ".");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
/* карты падают с машин ОКО (combat.js, добыча): чаще с охраны и начальников смен; не больше, чем ещё нужно */
function drops(f, list, r, dk) {
  if (!f || f.ally || f.calm || f.kind !== "mech" || G().L < 2) return;
  var beh = f.beh || (f.base && f.base.beh) || [], has = function (k) { return beh.indexOf(k) >= 0; };
  if (has("camera") || ((Lk().cards || 0) + (G().inv.lockcard || 0)) >= CARD_MAX) return;
  var pc = f.boss ? 0.3 : has("commander") ? 0.06 : f.guard ? 0.03 : 0.008;
  if (r() < pc * (dk || 1)) list.push({ kind: "item", item: "lockcard", n: 1 });
}
/* аренда кончилась — сказать (game.js, минуты тела) */
var rentSaid = 0;
function minutes() {
  if (!LAB.game || !gm().entered) return;
  var l = G().locker; if (!l || !l.rentUntil || l.rentUntil > nowAbs() || rentSaid === l.rentUntil) return;
  rentSaid = l.rentUntil;
  var over = lockerWt() > lockCap().kg + 1e-6 || slotsUsed() > lockCap().slots;
  sayq("Аренда соседней ячейки кончилась. " + cap1(capLine()) + "." + (over ? " Ячейка переполнена: вещи целы, но класть в неё нельзя, пока не заберёте лишнее." : "") + " Продлить можно у пункта снабжения.");
}
function upgrade() {
  var g = G(), l = Lk();
  if ((l.lv || 0) >= LOCK_MAX_LV) { say("Ячейка и так самая большая: " + capLine() + "."); return false; }
  var p = upPrice();
  if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: расширение стоит " + p + ", у вас " + g.credits + "."); return false; }
  g.credits -= p; l.lv = (l.lv || 0) + 1;
  snd("pack_heavy", "vend"); LAB.UI.ok();
  say("Ячейка расширена: ступень " + l.lv + " из " + LOCK_MAX_LV + ". Теперь " + capLine() + ". Списано " + p + " " + plural(p, "кредит", "кредита", "кредитов") + ", осталось " + g.credits + ".");
  if (gm().journal) gm().journal("Ячейка хранения расширена до ступени " + l.lv + ".");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
function lockerItems(where) {
  var its = [];
  its.push({ label: function () { var n = lockerN(), over = lockerWt() > lockCap().kg + 1e-6 || slotsUsed() > lockCap().slots; return (n ? "В ячейке " + n + " " + plural(n, "вещь", "вещи", "вещей") + ": " + capLine() : "Ячейка пуста: " + capLine()) + "." + (over ? " Ячейка переполнена: класть нельзя, пока не заберёте лишнее." : "") + " " + line(); }, info: true, keep: true, fn: function () {} });
  its.push({ label: "Положить в ячейку: вещи, батареи, оружие, броню, каркас", fn: putMenu });
  its.push({ label: "Забрать из ячейки", fn: takeMenu });
  its.push({ label: "Сдать все детали, сколько влезет", keep: true, fn: putParts });
  its.push({ label: "Забрать все детали, сколько унесёте", keep: true, fn: takeParts });
  if (where === "post") {
    var lv = Lk().lv || 0;
    if (lv < LOCK_MAX_LV) its.push({ label: function () { return "Расширить ячейку: плюс " + kg(LOCK_ADD_KG) + " и " + LOCK_ADD_SLOTS + " места — " + crW(upPrice()) + " (у вас " + G().credits + "). Ступень " + ((Lk().lv || 0) + 1) + " из " + LOCK_MAX_LV + ", каждая следующая в полтора раза дороже"; }, keep: true, fn: upgrade });
    else its.push({ label: "Ступени снабжения — все " + LOCK_MAX_LV + " из " + LOCK_MAX_LV, info: true, keep: true, fn: function () {} });
    its.push({ label: function () { return (rented() ? "Продлить аренду соседней ячейки ещё на трое суток" : "Арендовать соседнюю ячейку на трое суток: плюс " + kg(RENT_KG) + " и " + RENT_SLOTS + " мест") + " — " + crW(rentPrice()) + " (у вас " + G().credits + ")" + (rented() ? ". Сейчас арендована до " + untilText(Lk().rentUntil) : ""); }, keep: true, fn: rent });
  }
  if (where === "bench") {
    ["shelf", "floor"].forEach(function (kind) {
      its.push({ label: function () {
        var l = Lk(), n = (kind === "shelf" ? l.shelf : l.floor) || 0, nm = kind === "shelf" ? "Собрать полки и перегородки для ячейки: мест плюс " + SHELF_SLOTS : "Собрать усиленное дно для ячейки: вес плюс " + kg(FLOOR_KG);
        if (n >= CRAFT_MAX) return (kind === "shelf" ? "Полки" : "Усиленное дно") + " — " + CRAFT_MAX + " из " + CRAFT_MAX;
        var lock = craftLock(kind);
        return nm + ". Сделано " + n + " из " + CRAFT_MAX + ". " + (lock ? cap1(lock) : "Нужно: " + LAB.workshop.costText(craftNeed(kind)));
      }, keep: true, fn: function () { craftCell(kind); } });
    });
  }
  its.push({ label: function () { return "Из чего складывается ячейка: " + capWhy(); }, info: true, keep: true, fn: function () {} });
  its.push({ label: "Как ещё расширить ячейку", fn: function () { UIx("note", "Как расширить ячейку", HOW_GROW()); } });
  its.push({ label: "Назад", fn: function () {} });
  return its;
}
function cap1(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
function HOW_GROW() {
  return "Ячейка растёт пятью путями, и чем она больше, тем дороже каждое новое место. " +
    "У пункта снабжения — ступени за кредиты: плюс " + kg(LOCK_ADD_KG) + " и " + LOCK_ADD_SLOTS + " места, всего " + LOCK_MAX_LV + " ступеней, каждая следующая в полтора раза дороже прежней, а глубже всё дороже. " +
    "Там же — аренда соседней ячейки на трое суток: плюс " + kg(RENT_KG) + " и " + RENT_SLOTS + " мест; цена растёт с размером вашей ячейки и с каждой арендой. Кончилась аренда — вещи целы, но класть нельзя, пока не заберёте лишнее. " +
    "У верстака — своими руками: полки и перегородки дают места, усиленное дно — вес; нужна ступень механики, и каждые следующие полки и дно — из большего числа деталей, до трёх раз. " +
    "С машин ОКО, чаще с охраны и начальников смен, падают ключ-карты складских ячеек выбывших сотрудников: карта, использованная из инвентаря, присоединяет соседнюю ячейку — плюс " + kg(CARD_KG) + " и " + CARD_SLOTS + " места, до " + CARD_MAX + " карт. " +
    "И харизма: с 20 кладовщики снабжения находят вам два лишних места, с 30 — четыре; харизма же снижает цену ступеней и аренды.";
}
function lockerMenu(where) {
  UIx("menu", "Ячейка хранения", lockerItems(where), { rebuild: function () { return lockerItems(where); },
    intro: "Ячейка одна: у капсулы, у верстака и у пункта снабжения — та же самая. В ячейке вещи ничего не весят, но у неё свой предел: " + capLine() + "." });
}
function benchItems(where) { var n = lockerN(); return [{ label: "Ячейка хранения" + (n ? ": " + n + " " + plural(n, "вещь", "вещи", "вещей") + ", " + kg(lockerWt()) + " из " + kg(lockCap().kg) : ": пуста"), fn: function () { lockerMenu(where || "bench"); } }]; }
/* Запись прежней версии: если с новым весом герой не сдвинется — лишние детали и ценности
   уходят в ячейку сами, и «Эхо» об этом говорит. Только здесь ячейка может оказаться сверх
   меры: тогда класть в неё нельзя, пока не заберут лишнее. */
function init(loaded) {
  var g = G(); if (!g || g.loadInit) { reset(); return; }
  g.loadInit = 1; reset();
  if (!loaded || ratio() <= 1.25) return;
  var moveKinds = ["part", "valuable", "chem", "misc", "tool", "deploy", "wmodule"], w0 = total(), l = Lk();
  moveKinds.forEach(function (kd) {
    if (ratio() <= 1) return;
    Object.keys(g.inv).filter(function (id) { var d = LAB.ITEMS[id]; return d && d.kind === kd && g.inv[id] > 0; })
      .sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; })
      .forEach(function (id) { if (ratio() > 1) { var c = g.inv[id]; g.inv[id] = 0; delete g.inv[id]; l.inv[id] = (l.inv[id] || 0) + c; } });
  });
  var gone = Math.round((w0 - total()) * 10) / 10;
  if (gone > 0) setTimeout(function () { LAB.safe(function () { sayq("Теперь у вещей есть вес. Чтобы вы могли идти, лишнее — " + kg(gone) + " — отправлено в вашу ячейку хранения: она открывается у любой капсулы восстановления, у верстака и у пункта снабжения. " + (lockerWt() > lockCap().kg ? "Ячейка переполнена: пока не заберёте лишнее, класть в неё нельзя. " : "") + line()); }); }, 1500);
}

LAB.load = {
  kg: kg, itemWt: itemWt, weaponWt: weaponWt, armorWt: armorWt, frameWt: frameWt, floorWt: floorWt, parts: parts, total: total,
  capOf: capOf, capacity: capacity, ratio: ratio, tier: tier, TIER_N: TIER_N,
  gapK: gapK, stepGap: stepGap, noise: noise, wakeK: wakeK, accPen: accPen, dodgePen: dodgePen, handPen: handPen, needStr: needStr, handStr: handStr,
  canMove: canMove, canTake: canTake, refuseText: refuseText, after: after, reset: reset,
  line: line, status: status, handNote: handNote, weaponLine: weaponLine, heaviest: heaviest, DRONE_CAP: DRONE_CAP,
  locker: Lk, lockerWt: lockerWt, lockCap: lockCap, slotsUsed: slotsUsed, lockerMenu: lockerMenu, benchItems: benchItems, putItem: putItem, takeItem: takeItem, putParts: putParts, takeParts: takeParts,
  upgrade: upgrade, upPrice: upPrice, init: init, rent: rent, rentPrice: rentPrice, rented: rented, craftCell: craftCell, craftNeed: craftNeed,
  useCard: useCard, drops: drops, minutes: minutes, capParts: capParts
};
})();
