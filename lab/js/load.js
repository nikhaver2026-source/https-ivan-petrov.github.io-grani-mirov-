/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — груз (после 4.6).
   У каждой вещи свой вес. Сколько унесёт герой, решают сила (главное),
   телосложение и выносливость (stats.js), а ещё экзокаркас: пока заряжен,
   его приводы держат груз и сам каркас ничего не весит, разряженный —
   мёртвый вес; силовая броня «Атлант». Дрон в воздухе несёт свою долю
   общего груза. Перегружаться сверх своего предела может только герой.
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
var RIGS = [
  { n: "Разгрузочный пояс", kg: 5, tier: 1, con: 10, need: { scrap: 2, rubber: 2, wire: 1 } },
  { n: "Грузовая рама", kg: 10, tier: 2, con: 12, need: { scrap: 4, panel: 1, rubber: 2 } },
  { n: "Усиленная упряжь", kg: 15, tier: 3, con: 14, need: { scrap: 4, servo: 2, ceramic: 1, rubber: 2 } }
];
/* (после 4.6) ключ-карта складской ячейки: без глубины и с разделом — в генерацию этажей не попадает
   (world.js берёт вещи с глубиной и без раздела), не продаётся — на полки пунктов тоже не попадает */
if (!LAB.ITEMS.lockcard) LAB.ITEMS.lockcard = { n: "Ключ-карта складской ячейки", icon: "🗝️", kind: "use", cat: "eng", nosell: 1, price: 40,
  desc: "Карта выбывшего сотрудника. При использовании добавляет в личное хранилище две ячейки. Можно использовать до пяти карт." };
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
  /* надетый каркас: заряжен — несёт себя сам; разряжен — весит вполовину, как надетая броня: вес на плечах и поясе */
  (g.frames || []).forEach(function (f) { if (f === on) { if (!frameLive(f)) p.frames += frameWt(f) * 0.5; } else p.frames += frameWt(f); });
  if (LAB.drone) p.drone = LAB.drone.carriedWeight();
  p.samples = Object.keys(g.samples || {}).length * 0.1;
  return p;
}
function total(extra) {
  var p = parts(), t = extra || 0;
  for (var k in p) t += p[k];
  return Math.round(t * 10) / 10;
}

/* ── ПРЕДЕЛ ── личная нагрузка и помощь снаряжения */
function statCapacity(src, value) {
  if (src === "str") return Math.max(0, value) * 2;
  if (src === "con") return Math.max(0, value - 10) * 0.75;
  return Math.max(0, value) * 0.5;
}
function rig() { return RIGS[G().loadRig - 1] || null; }
function capOf(src) {
  var f, r;
  switch (src) {
    case "base": return 80; /* Стартовая сила 10 даёт ещё 20 кг. */
    case "str":
    case "con": return statCapacity(src, hs(src));
    case "stam": return statCapacity(src, secS(src));
    case "exo": f = wornFrame(); return f && frameLive(f) ? ((FRAME_CAP[f.cls] || 0) + LAB.exo.loadBonus(f)) * (LAB.exo.strOk(f) ? 1 : 0.5) : 0;
    case "rig":
      r = rig();
      return r ? Math.max(Math.min(4, r.kg), r.kg - capOf("exo")) : 0;
    case "armor": return gm().armorSpecial && gm().armorSpecial("strength") ? 15 : 0;
    case "drone": return LAB.drone ? LAB.drone.carryCapacity() : 0;
  }
  return 0;
}
var PERSONAL_SRC = ["base", "str", "con", "stam", "rig", "exo", "armor"];
/* LAB.load.off и window.LAB_TEST_NOLOAD — только для старых наборов проверок (play.test.js и другие):
   их герой носит сотни деталей сразу; груз проверяет hero.test.js. В игре выключатель не используется. */
function offNow() { return !!(LAB.load && LAB.load.off) || !!window.LAB_TEST_NOLOAD; }
function personalCapacity() {
  if (offNow()) return 1e9;
  var c = PERSONAL_SRC.reduce(function (sum, s) { return sum + capOf(s); }, 0);
  return Math.round(c * 10) / 10;
}
function limit(factor) { return personalCapacity() * factor + (offNow() ? 0 : capOf("drone")); }
function capacity() { return limit(1); }
/* Герой держит при себе лёгкий груз. Тяговый блок включается только при нехватке обычной тяги. */
function droneShare(weight, personal) {
  var passive = LAB.drone ? LAB.drone.carryCapacity(false) : 0;
  var share = Math.min(passive, Math.max(0, weight - personal * 0.5));
  var extra = weight - personal - passive;
  return share + (extra > 0 ? Math.min(extra, capOf("drone") - passive) : 0);
}
function ratio() {
  var weight = total(), personal = personalCapacity();
  return (weight - droneShare(weight, personal)) / personal;
}
/* 0 налегке, 1 обычно, 2 перегруз, 3 тяжёлый перегруз, 4 неподъёмно */
function tierOf(r) { return r <= 0.5 ? 0 : r <= 1 ? 1 : r <= 1.25 ? 2 : r <= 1.5 ? 3 : 4; }
function tier() { return tierOf(ratio()); }
var TIER_N = ["налегке", "обычный ход", "перегруз", "тяжёлый перегруз", "неподъёмно"];

/* ── ПОСЛЕДСТВИЯ ── выносливость смягчает замедление */
function stamSoft() { return 1 - Math.min(0.45, secS("stam") * 0.015); }
function gapK() { var t = tier(); return t <= 1 ? 1 : 1 + (t === 2 ? 0.4 : 1) * stamSoft(); }
function stepGap() {
  var t = tier(), base = t === 2 ? 120 : t === 3 ? 260 : 0;
  if (!base) return 0;
  return Math.max(35, Math.round(base * stamSoft()) - (LAB.drone ? LAB.drone.overloadHelp("stride") : 0));
}
function noise() {
  var t = tier(), base = t === 2 ? 2 : t === 3 ? 4 : 0;
  return base ? Math.max(0, base - (LAB.drone ? LAB.drone.overloadHelp("noise") : 0)) : 0;
}
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
function handPen(w) { return w && !offNow() ? Math.min(0.2, Math.max(0, needStr(w) - handStr()) * 0.02) : 0; }
function accPen(w) { var t = tier(); return (t === 2 ? 0.05 : t === 3 ? 0.1 : 0) + handPen(w); }

/* С места не сдвинуться: предупреждение не чаще раза в три секунды. */
var stuckSaid = 0;
function releaseKg(weight) { return Math.ceil((Math.max(0, weight - limit(1.5)) - 1e-8) * 10) / 10; }
function canMove() {
  if (tier() < 4) return true;
  var t = Date.now();
  if (t - stuckSaid > 3000) {
    stuckSaid = t;
    snd("strain_stuck", "ui_error"); /* ремни трещат под грузом */
    var boost = LAB.drone && LAB.drone.cargoRecovery();
    say("Груз неподъёмный: " + kg(total()) + " при пределе " + kg(capacity()) + ". С места не сдвинуться. Сбросьте хотя бы " + kg(releaseKg(total())) + " через инвентарь." + (boost ? " " + boost : ""));
  }
  return false;
}
/* Можно ли поднять ещё столько — не дальше тяжёлого перегруза. */
function canTake(addKg) { return addKg <= 0 || total(addKg) <= limit(1.5) + 1e-6; }
function lcf(t) { t = String(t || ""); return t.charAt(0).toLowerCase() + t.slice(1); }
function refuseText(it, w) {
  var over = releaseKg(total(w));
  return "Не поднять: " + lcf(gm().itemName ? gm().itemName(it) : "вещь") + " — " + kg(w) + ". Груз и так " + kg(total()) + " при пределе " + kg(capacity()) + ", лишнего — " + kg(over) + ".";
}

/* Ступень сменилась — сказать один раз (после подбора, покупки, выброса, смены каркаса). */
var lastTier = -1;
function after(quiet) {
  if (!LAB.game || !gm().entered) return;
  var t = tier();
  if (lastTier < 0) { lastTier = t; return; }
  if (t === lastTier) return;
  var prev = lastTier, up = t > prev; lastTier = t;
  if (quiet) return;
  if (t <= 1 && prev <= 1) return; /* налегке и обычный ход — не помеха: без объявлений */
  if (up && t >= 2) snd("pack_heavy", "loot_drop");
  else if (!up && prev >= 2 && t <= 1) snd("pack_light", "pick_part"); /* перегруз прошёл — лямки ослабли */
  var why = t === 4 ? "с места не сдвинуться, сбросьте лишнее" : t === 3 ? "шаг вдвое тяжелее и громче, усталость вдвое быстрее, точность и уклонение ниже" : t === 2 ? "шаг тяжелее и громче, усталость быстрее, точность чуть ниже" : "перегруз позади, шаг снова лёгкий";
  sayq("Груз " + kg(total()) + " из " + kg(capacity()) + ": " + TIER_N[t] + " — " + why + ".");
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
  (g.frames || []).forEach(function (f) { if (!(f === on && frameLive(f))) list.push({ n: (LAB.exo && LAB.exo.frameName ? LAB.exo.frameName(f) : "экзокаркас") + (f === on ? ", на вас, без заряда" : ""), w: frameWt(f) * (f === on ? 0.5 : 1) }); });
  /* (после 4.6) и батареи, дрон, образцы: «сбросьте три кило» — видно, из чего */
  for (k in (g.ammo || {})) if (g.ammo[k] > 0 && LAB.AMMO[k]) list.push({ n: LAB.AMMO[k].n + ", " + g.ammo[k] + " шт.", w: (AMMO_WT[k] || 0.4) * g.ammo[k] });
  var pd = parts(); if (pd.drone) list.push({ n: g.drone && g.drone.wreck ? "сбитый дрон" : "свёрнутый дрон", w: pd.drone });
  if (pd.samples) list.push({ n: "образцы", w: pd.samples });
  list.sort(function (a, b) { return b.w - a.w; });
  return list.filter(function (x) { return x.w >= 0.5; }).slice(0, 5);
}
function line() {
  var t = tier();
  return "Груз " + kg(total()) + " из " + kg(capacity()) + ": " + TIER_N[t] + ".";
}
function capText() {
  var names = { base: "основа", str: "сила", con: "телосложение", stam: "выносливость", rig: "грузовое снаряжение", exo: "приводы каркаса", armor: "силовая броня", drone: "опора дрона" };
  return PERSONAL_SRC.concat("drone").filter(function (s) { return capOf(s) > 0; }).map(function (s) { return names[s] + " " + kg(capOf(s)); }).join(", ");
}
function status() {
  if (!gm().entered) return;
  var h = heaviest(), w = gm().curWeapon ? gm().curWeapon() : null, hp = handPen(w);
  var ln = G().locker ? lockerN() : 0;
  var weight = total(), personal = personalCapacity(), share = droneShare(weight, personal);
  var split = capOf("drone") > 0 ? " На герое " + kg(weight - share) + " из " + kg(personal) + ". На дроне " + kg(share) + " из " + kg(capOf("drone")) + "." : "";
  say(line() + split + " Предел складывают: " + capText() + "." + (ln ? " В личном хранилище — " + kg(lockerWt()) + "." : "") + (h.length ? " Тяжелее всего: " + h.map(function (x) { return x.n + " — " + kg(x.w); }).join("; ") + "." : "") +
    (hp ? " " + (w ? w.name : "Оружие") + " тяжело для ваших рук: нужна сила " + needStr(w) + ", точность ниже на " + pcW(Math.round(hp * 100)) + "." : ""));
}
/* оружие в руках тяжело — сказать, когда его берут (draw, смена) */
var handSaid = {};
function handNote(w) {
  if (!w) return "";
  var hp = handPen(w);
  if (!hp || handSaid[w.id]) return "";
  handSaid[w.id] = 1;
  return " Тяжело для ваших рук: нужна сила " + needStr(w) + ", у вас " + Math.round(handStr()) + " — точность ниже на " + pcW(Math.round(hp * 100)) + ". Каркас добавит силы рукам.";
}
function pcW(n) { return n + " " + plural(n, "процент", "процента", "процентов"); }
function weaponLine(w) { return "Вес " + kg(weaponWt(w)) + ", нужна сила " + needStr(w) + (handPen(w) ? " — у вас меньше, точность ниже на " + pcW(Math.round(handPen(w) * 100)) : "") + "."; }


/* Личное хранилище доступно из любой капсулы, мастерской и пункта снабжения.
   В сохранении остаются прежние списки вещей, плюс назначение и ступень каждой ячейки. */
var LOCK_SLOTS = 10, LOCK_ADD_SLOTS = 4, LOCK_MAX_LV = 8;
var CELL_BASE = 300, CELL_ADD = 100, CELL_MAX_LV = 8;
var RENT_SLOTS = 8, RENT_MIN = 3 * 1440;
var SHELF_SLOTS = 4, FLOOR_ADD = 50, CRAFT_MAX = 3;
var CARD_SLOTS = 2, CARD_MAX = 5;
var SHELF_NEED = { scrap: 4, panel: 2, wire: 1 }, FLOOR_NEED = { scrap: 3, servo: 1, magnet: 2 };
var CELL_NAMES = {
  part: "Детали", ammo: "Боеприпасы", med: "Медицина", food: "Еда", drink: "Напитки",
  tool: "Инструменты", access: "Ключи и средства доступа", repair: "Ремонт и защита",
  chem: "Химические составы", trap: "Ловушки", throw: "Метательные предметы", deploy: "Развёртываемые устройства",
  implant: "Импланты", eng: "Инженерные узлы", wmodule: "Оружейные модули", valuable: "Ценности",
  weapons: "Оружие", armors: "Броня", frames: "Экзокаркасы", misc: "Прочее"
};
function itemType(id) {
  var d = LAB.ITEMS[id] || {};
  var fx = d.fx || {};
  if (/^(lockcard|okokey|decoder|m_falsepass|v10_forgedslip)$/.test(id) || fx.pick) return "access";
  if (id === "plate" || d.cat === "protect" || fx.mend || (LAB.repair && LAB.repair.isKit(id))) return "repair";
  if (d.kind === "food" && (d.brew || d.eat === "sip" || d.eat === "gulp")) return "drink";
  if (/^(g_thermos|v10_tea|v10_waterflask|v13_thermos)$/.test(id)) return "drink";
  if (/^(k_honey|v15_kasha)$/.test(id)) return "food";
  if (Object.prototype.hasOwnProperty.call(CELL_NAMES, d.kind) && d.kind !== "misc") return d.kind;
  if (d.cat === "med" || (LAB.itemCat && LAB.itemCat(id) === "med")) return "med";
  if (d.br) return "chem";
  if (fx.shield || fx.antitox || fx.cloak || id === "v6_harness") return "repair";
  if (d.rubble || fx.jam || fx.scan || fx.map) return "tool";
  if (fx.heal || fx.regen || fx.stitch || fx.haste) return "med";
  return Object.prototype.hasOwnProperty.call(CELL_NAMES, d.cat) ? d.cat : "misc";
}
function nowAbs() { var g = G(); return ((g.day || 1) - 1) * 1440 + (g.min || 0); }
function rented() { return (Lk().rentUntil || 0) > nowAbs(); }
function chaSlots() { var c = G().cha == null ? 10 : G().cha; return c >= 30 ? 4 : c >= 20 ? 2 : c >= 14 ? 1 : 0; }
function Lk() {
  var g = G();
  if (!g.locker) g.locker = { inv: {}, ammo: {}, weapons: [], armors: [], frames: [], lv: 0 };
  var l = g.locker;
  ["inv", "ammo"].forEach(function (k) { if (!l[k]) l[k] = {}; });
  ["weapons", "armors", "frames"].forEach(function (k) { if (!l[k]) l[k] = []; });
  if (!(l.lv >= 0)) l.lv = 0;
  if (!Array.isArray(l.cells)) l.cells = [];
  return l;
}
function permanentSlots() {
  var l = Lk();
  return LOCK_SLOTS + LOCK_ADD_SLOTS * Math.min(LOCK_MAX_LV, l.lv) + SHELF_SLOTS * Math.min(CRAFT_MAX, l.shelf || 0) + CARD_SLOTS * Math.min(CARD_MAX, l.cards || 0) + chaSlots();
}
function capParts() {
  var l = Lk();
  return [
    { n: "основа", sl: LOCK_SLOTS },
    { n: "ступени снабжения", sl: LOCK_ADD_SLOTS * Math.min(LOCK_MAX_LV, l.lv) },
    { n: "полки", sl: SHELF_SLOTS * Math.min(CRAFT_MAX, l.shelf || 0) },
    { n: "ключ-карты", sl: CARD_SLOTS * Math.min(CARD_MAX, l.cards || 0) },
    { n: "аренда до " + untilText(l.rentUntil || 0), sl: rented() ? RENT_SLOTS : 0 },
    { n: "договорённость по харизме", sl: chaSlots() }
  ];
}
function lockCap() { return { slots: permanentSlots() + (rented() ? RENT_SLOTS : 0), perCell: cellCap() }; }
function cellCap(cell) { return CELL_BASE + CELL_ADD * (cell && cell.lv || 0) + FLOOR_ADD * Math.min(CRAFT_MAX, Lk().floor || 0); }
function untilText(t) { var d = Math.floor(t / 1440) + 1, m = t % 1440, h = Math.floor(m / 60), mm = m % 60; return "дня " + d + ", " + (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
function capWhy() { return capParts().filter(function (p) { return p.sl; }).map(function (p) { return p.n + " — " + p.sl; }).join(", "); }
function lockerWt() { var l = Lk(), t = 0, k; for (k in l.inv) t += itemWt(k) * l.inv[k]; for (k in l.ammo) t += (AMMO_WT[k] || 0.4) * l.ammo[k]; l.weapons.forEach(function (w) { t += weaponWt(w); }); l.armors.forEach(function (a) { t += armorWt(a); }); l.frames.forEach(function (f) { t += frameWt(f); }); return Math.round(t * 10) / 10; }
function storedCounts(l) {
  var counts = {};
  Object.keys(l.inv).forEach(function (id) { var type = itemType(id); if (l.inv[id] > 0) counts[type] = (counts[type] || 0) + l.inv[id]; });
  ["ammo", "weapons", "armors", "frames"].forEach(function (type) {
    var n = type === "ammo" ? Object.keys(l.ammo).reduce(function (sum, id) { return sum + Math.max(0, l.ammo[id]); }, 0) : l[type].length;
    if (n > 0) counts[type] = n;
  });
  return counts;
}
function lockerN() { var c = storedCounts(Lk()); return Object.keys(c).reduce(function (sum, k) { return sum + c[k]; }, 0); }
function storageView() {
  var l = Lk(), counts = storedCounts(l), byType = Object.create(null), slots = lockCap().slots;
  l.cells.forEach(function (c, i) {
    if (!c || !c.type) return;
    if (counts[c.type] && byType[c.type] == null) byType[c.type] = i;
    else { delete c.type; delete c.leased; }
  });
  var free = 0;
  function findFree() { while (l.cells[free] && l.cells[free].type) free++; }
  /* Старые записи и автоматическая разгрузка. Даже лишние вещи остаются доступны. */
  Object.keys(CELL_NAMES).forEach(function (type) {
    if (!counts[type] || byType[type] != null) return;
    findFree();
    var cell = l.cells[free] || (l.cells[free] = {});
    cell.type = type; byType[type] = free;
  });
  findFree();
  return { counts: counts, byType: byType, free: free, slots: slots };
}
function slotsUsed() { return Object.keys(storedCounts(Lk())).length; }
function capLine(view) {
  view = view || storageView();
  var occupied = Object.keys(view.byType).filter(function (k) { return view.byType[k] < view.slots; }).length;
  return "занято " + occupied + " из " + view.slots + " ячеек";
}
function fitInfo(type, view, chosen) {
  view = view || storageView();
  var assigned = view.byType[type] != null;
  var index = assigned ? view.byType[type] : chosen == null ? view.free : chosen;
  if (chosen != null && assigned && index !== chosen) return { fit: 0, why: "для «" + CELL_NAMES[type] + "» уже назначена ячейка " + (index + 1) };
  var cell = Lk().cells[index];
  if (!assigned && cell && cell.type) return { fit: 0, why: "ячейка уже назначена для «" + CELL_NAMES[cell.type] + "»" };
  if (index < 0 || index % 1 !== 0 || index >= view.slots) return { fit: 0, why: assigned ? "ячейка «" + CELL_NAMES[type] + "» сейчас доступна только на выдачу" : "нет свободной ячейки. " + cap1(capLine(view)) };
  var n = view.counts[type] || 0, cap = cellCap(cell);
  return { index: index, fit: Math.max(0, cap - n), why: "ячейка «" + CELL_NAMES[type] + "» заполнена. Предметов " + n + " из " + cap };
}
function assignCell(type, index) {
  var cells = Lk().cells, cell = cells[index] || (cells[index] = {});
  cell.type = type;
  if (index >= permanentSlots()) cell.leased = true;
}
function upHint() { return " Расширить хранилище можно у пункта снабжения."; }
function itemN(id) { var d = LAB.ITEMS[id]; return d ? d.n : id; }
function moveItemToLocker(id, n) {
  var g = G(), l = Lk();
  var crafted = g.craftN && g.craftN[id] ? Math.min(g.craftN[id], g.inv[id]) : 0;
  var movedCrafted = Math.max(0, n - (g.inv[id] - crafted));
  if (movedCrafted) {
    g.craftN[id] -= movedCrafted;
    l.craft = l.craft || {};
    l.craft[id] = (l.craft[id] || 0) + movedCrafted;
  }
  g.inv[id] -= n; if (!(g.inv[id] > 0)) delete g.inv[id];
  l.inv[id] = (l.inv[id] || 0) + n;
}
function putItem(id, n, quiet, chosen) {
  var g = G(), why = gm().dropWhy ? gm().dropWhy(id) : "";
  if (why) { if (!quiet) { LAB.UI.error(); say(why); } return 0; }
  var have = gm().dropMax ? gm().dropMax(id) : (g.inv[id] || 0);
  var type = itemType(id), fit = fitInfo(type, null, chosen);
  n = Math.min(n || 1, have, fit.fit);
  if (n <= 0) {
    if (!quiet && have > 0) { LAB.UI.error(); say("Не влезет: " + fit.why + "." + upHint()); }
    return 0;
  }
  assignCell(type, fit.index);
  moveItemToLocker(id, n);
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
function moved(msg, put) {
  snd(put ? "locker_put" : "locker_take", "pick_part", { gain: 0.8 });
  say(msg); after(); UIx("refresh");
  if (gm().autosaveSoon) gm().autosaveSoon();
}
/* Для выдачи ползунок предлагает столько, сколько сейчас можно унести. */
function carryFit(have, unitWt) {
  var lo = 0, hi = have;
  while (lo < hi) {
    var mid = Math.ceil((lo + hi) / 2);
    if (canTake(mid * unitWt)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function putParts() {
  var g = G(), n = 0, w = 0, left = 0;
  Object.keys(g.inv).filter(function (id) { return itemType(id) === "part" && g.inv[id] > 0; })
    .sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; })
    .forEach(function (id) { var c = g.inv[id], put = putItem(id, c, true); n += put; w += itemWt(id) * put; left += c - put; });
  if (!n) {
    if (left) { LAB.UI.error(); say("Детали не влезают: " + fitInfo("part").why + "." + upHint()); }
    else say("Деталей в рюкзаке нет.");
    return;
  }
  moved("В хранилище сданы детали: " + n + " шт., " + kg(w) + "." + (left ? " В рюкзаке осталось ещё " + left + " шт." : "") + " " + line(), true);
}
function takeParts() {
  var l = Lk(), n = 0, w = 0, left = 0;
  Object.keys(l.inv).filter(function (id) { return itemType(id) === "part"; }).forEach(function (id) {
    var c = l.inv[id], fit = carryFit(c, itemWt(id));
    if (fit > 0 && takeItem(id, fit)) { n += fit; w += itemWt(id) * fit; }
    left += c - fit;
  });
  if (!n) { say(left ? "Детали не унести: груз и так тяжёлый." : "Деталей в хранилище нет."); return; }
  moved("Из хранилища взяты детали: " + n + " шт., " + kg(w) + "." + (left ? " В хранилище осталось ещё " + left + " шт." : "") + " " + line());
}
function quantityItem(label, max, w1, fn) {
  if (max === 1) return { label: label, keep: true, fn: function () { fn(1); } };
  var v = max;
  return { kind: "slider", label: label, keep: true, min: 1, max: max, step: 1, get: function () { return v; }, set: function (x) { v = Math.max(1, Math.min(max, Math.round(x))); },
    fmt: function (x) { return Math.round(x) + " шт., " + kg(w1 * Math.round(x)); }, fn: function () { fn(v); } };
}
function unavailable(label, why) { return { label: label + " — недоступно", disabled: true, why: why }; }
var STORAGE_GEAR = {
  weapons: { name: function (w) { return w.name; }, wt: weaponWt, kind: "weapon" },
  armors: { name: function (a) { return a.name; }, wt: armorWt, kind: "armor" },
  frames: { name: function (f) { return LAB.exo && LAB.exo.frameName ? LAB.exo.frameName(f) : "Экзокаркас"; }, wt: frameWt, kind: "frame" }
};
function putGear(type, o, view, chosen) {
  var def = STORAGE_GEAR[type];
  if (!lockOk(def.kind, o)) return null;
  var fit = fitInfo(type, view, chosen), name = def.name(o), label = CELL_NAMES[type] + ". " + name + ", " + kg(def.wt(o));
  if (!fit.fit) return unavailable(label, "Не влезет: " + fit.why + "." + upHint());
  return { label: label, keep: true, fn: function () {
    var g = G(), list = g[type], i = list.indexOf(o), current = g.weapons[g.wi], next = fitInfo(type, null, chosen);
    if (i < 0 || !lockOk(def.kind, o)) { LAB.UI.error(); say("Снаряжение уже перемещено или надето."); return; }
    if (!next.fit) { LAB.UI.error(); say("Не влезет: " + next.why + "." + upHint()); return; }
    assignCell(type, next.index);
    list.splice(i, 1);
    if (type === "weapons") g.wi = Math.max(0, g.weapons.indexOf(current));
    Lk()[type].push(o);
    moved("В хранилище: " + name + ". " + line(), true);
  } };
}
function ammoName(k) { return LAB.AMMO[k] ? LAB.AMMO[k].n : k; }
function putAmmo(k, n, chosen) {
  var g = G(), l = Lk(), fit = fitInfo("ammo", null, chosen);
  n = Math.min(n, g.ammo[k] || 0, fit.fit);
  if (n <= 0) { LAB.UI.error(); say(fit.fit ? "Боеприпасов в рюкзаке уже нет." : "Не влезет: " + fit.why + "." + upHint()); return; }
  assignCell("ammo", fit.index);
  g.ammo[k] -= n; l.ammo[k] = (l.ammo[k] || 0) + n;
  moved("В хранилище: " + ammoName(k).toLowerCase() + ", " + n + " шт. " + line(), true);
}
function putItems(chosen) {
  var g = G(), view = storageView(), items = [];
  Object.keys(g.inv).filter(function (id) { return g.inv[id] > 0 && LAB.ITEMS[id]; })
    .sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; }).forEach(function (id) {
      var c = g.inv[id], w1 = itemWt(id), type = itemType(id), fit = fitInfo(type, view, chosen);
      var label = CELL_NAMES[type] + ". " + itemN(id) + ", в рюкзаке " + c + " шт.";
      var why = gm().dropWhy(id), max = Math.min(gm().dropMax(id), fit.fit);
      if (why || !max) { items.push(unavailable(label, why || "Не влезет: " + fit.why + "." + upHint())); return; }
      items.push(quantityItem(label + (max < c ? " Можно положить " + max + " шт." : ""), max, w1, function (n) {
        var put = putItem(id, n, false, chosen);
        if (put) moved("В хранилище: " + itemN(id).toLowerCase() + ", " + put + " шт. " + line(), true);
      }));
    });
  Object.keys(g.ammo || {}).filter(function (k) { return g.ammo[k] > 0; }).forEach(function (k) {
    var c = g.ammo[k], fit = fitInfo("ammo", view, chosen), max = Math.min(c, fit.fit);
    var label = "Боеприпасы. " + ammoName(k) + ", в рюкзаке " + c + " шт.";
    items.push(max ? quantityItem(label + (max < c ? " Можно положить " + max + " шт." : ""), max, AMMO_WT[k] || 0.4, function (n) { putAmmo(k, n, chosen); }) : unavailable(label, "Не влезет: " + fit.why + "." + upHint()));
  });
  Object.keys(STORAGE_GEAR).forEach(function (type) {
    (g[type] || []).forEach(function (o) { var item = putGear(type, o, view, chosen); if (item) items.push(item); });
  });
  if (!items.length) items.push({ label: "В рюкзаке нет вещей для хранения.", info: true, fn: function () {} });
  return items.concat({ label: "Назад", close: true });
}
function putMenu(chosen) {
  var items = function () { return putItems(chosen); };
  UIx("menu", chosen == null ? "Положить в хранилище" : "Положить в ячейку " + (chosen + 1), items(), { rebuild: items,
    intro: cap1(capLine()) + ". " + LAB.K("У нескольких предметов свайп вверх или вниз выбирает количество, двойное касание кладёт.", "Стрелки вправо и влево меняют количество, Enter кладёт.") });
}
function takeAmmo(k, n) {
  var g = G(), l = Lk(), w1 = AMMO_WT[k] || 0.4;
  n = Math.min(n, l.ammo[k] || 0);
  if (n <= 0) return;
  if (!canTake(w1 * n)) { LAB.UI.error(); say("Столько не унести. " + line()); return; }
  l.ammo[k] -= n; if (!(l.ammo[k] > 0)) delete l.ammo[k];
  g.ammo[k] = (g.ammo[k] || 0) + n;
  moved("Взято: " + ammoName(k).toLowerCase() + ", " + n + " шт. " + line());
}
function takeStack(label, have, w1, fn) {
  var max = carryFit(have, w1);
  label += ", в ячейке " + have + " шт.";
  if (!max) return unavailable(label, "Груз слишком тяжёлый. " + line());
  return quantityItem(label + (max < have ? " Можно унести " + max + " шт." : ""), max, w1, fn);
}
function takeGear(type, o) {
  var l = Lk(), g = G(), def = STORAGE_GEAR[type], i = l[type].indexOf(o);
  if (i < 0) return;
  if (!canTake(def.wt(o))) { LAB.UI.error(); say("Не унести: " + kg(def.wt(o)) + ". " + line()); return; }
  l[type].splice(i, 1);
  if (!g[type]) g[type] = [];
  g[type].push(o);
  moved("Взято: " + def.name(o) + ". " + line());
}
function contentsItems(type) {
  var l = Lk();
  if (type === "ammo") return Object.keys(l.ammo).filter(function (k) { return l.ammo[k] > 0; }).map(function (k) {
    return takeStack(ammoName(k), l.ammo[k], AMMO_WT[k] || 0.4, function (n) { takeAmmo(k, n); });
  });
  if (STORAGE_GEAR[type]) {
    var def = STORAGE_GEAR[type];
    return l[type].map(function (o) {
      var label = def.name(o) + ", " + kg(def.wt(o));
      return canTake(def.wt(o)) ? { label: label, keep: true, fn: function () { takeGear(type, o); } } : unavailable(label, "Груз слишком тяжёлый. " + line());
    });
  }
  return Object.keys(l.inv).filter(function (id) { return l.inv[id] > 0 && itemType(id) === type; }).map(function (id) {
    return takeStack(itemN(id), l.inv[id], itemWt(id), function (n) {
      if (takeItem(id, n)) moved("Взято: " + itemN(id).toLowerCase() + ", " + n + " шт. " + line());
    });
  });
}
/* Цены снабжения зависят от глубины и сложности. Ступени дорожают в полтора раза. */
function cr(b) { return Math.max(1, Math.round(b * (gm().priceK ? gm().priceK() : 1))); }
function crW(n) { return n + " " + plural(n, "кредит", "кредита", "кредитов"); }
function upPrice() { return cr(Math.round(120 * Math.pow(1.5, Lk().lv))); }
function cellPrice(index) { var cell = Lk().cells[index]; return cr(Math.round(120 * Math.pow(1.5, cell && cell.lv || 0))); }
function rentPrice() { return cr(Math.round((60 + 4.8 * permanentSlots()) * (1 + 0.2 * (Lk().rentN || 0)))); }
function pay(p, service) {
  var g = G();
  if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов. " + service + " стоит " + crW(p) + ", у вас " + g.credits + "."); return false; }
  g.credits -= p;
  return true;
}
function paid(p) { return " Списано " + crW(p) + ", осталось " + G().credits + "."; }
function saveStorage() { if (gm().autosaveSoon) gm().autosaveSoon(); }
function expanded() { snd("locker_expand", "vend"); LAB.UI.ok(); saveStorage(); }
function rent() {
  var l = Lk(), p = rentPrice();
  if (!pay(p, "Аренда")) return false;
  feeTick();
  l.rentN = (l.rentN || 0) + 1;
  l.rentUntil = Math.max(l.rentUntil || 0, nowAbs()) + RENT_MIN;
  l.feeAt = nowAbs();
  snd("rent_ok", "vend"); LAB.UI.ok();
  say("Открыто " + RENT_SLOTS + " дополнительных ячеек до " + untilText(l.rentUntil) + ". " + cap1(capLine()) + "." + paid(p));
  saveStorage();
  return true;
}
function craftNeed(kind) { var l = Lk(), n = l[kind] || 0, base = kind === "shelf" ? SHELF_NEED : FLOOR_NEED, out = {}; for (var k in base) out[k] = Math.ceil(base[k] * (1 + 0.5 * n)); return out; }
function craftStep(kind) { return kind === "shelf" ? 2 : 3; }
function craftLock(kind) { var MS = LAB.mastery; return MS && MS.step && MS.step("mech") < craftStep(kind) ? "нужна ступень механики " + craftStep(kind) + ", у вас " + MS.step("mech") : ""; }
var STORAGE_CRAFT = {
  shelf: { n: "Полки и перегородки", gain: "+" + SHELF_SLOTS + " ячейки" },
  floor: { n: "Усиленное дно", gain: "+" + FLOOR_ADD + " предметов к вместимости каждой ячейки" }
};
function craftCell(kind) {
  var def = STORAGE_CRAFT[kind], l = Lk(), W = LAB.workshop, n = l[kind] || 0, need = craftNeed(kind);
  if (!def) return false;
  if (n >= CRAFT_MAX) { say(def.n + ". Уже установлено " + CRAFT_MAX + " из " + CRAFT_MAX + "."); return false; }
  var lock = craftLock(kind);
  if (lock) { LAB.UI.error(); say(def.n + ". " + cap1(lock) + "."); return false; }
  if (!W.haveAll(need)) { LAB.UI.error(); say(def.n + ". Не хватает деталей: " + W.costLack(need) + "."); return false; }
  W.take(need);
  l[kind] = n + 1;
  if (gm().advanceTime) gm().advanceTime(25);
  if (LAB.mastery && LAB.mastery.gain) LAB.mastery.gain("mech", 6);
  snd("work_ratchet", "craft"); LAB.UI.ok();
  if (gm().later) gm().later(function () { snd("locker_expand", "craft"); }, 900);
  say("В хранилище установлено улучшение «" + def.n + "». " + def.gain + ". " + cap1(capLine()) + ".");
  saveStorage();
  return true;
}
function useCard() {
  var g = G(), l = Lk();
  if (!(g.inv.lockcard > 0)) { say("Ключ-карты нет."); return false; }
  if ((l.cards || 0) >= CARD_MAX) { say("По ключ-картам уже добавлено " + CARD_MAX * CARD_SLOTS + " ячеек. Лишнюю карту можно выбросить."); return false; }
  g.inv.lockcard--; if (!(g.inv.lockcard > 0)) delete g.inv.lockcard;
  l.cards = (l.cards || 0) + 1;
  snd("card_ok", "ui_ok"); LAB.UI.ok();
  if (gm().later) gm().later(function () { snd("locker_expand", "card_ok"); }, 700);
  say("Карта считана. Добавлено " + CARD_SLOTS + " ячейки. Использовано карт " + l.cards + " из " + CARD_MAX + ". " + cap1(capLine()) + ".");
  saveStorage();
  return true;
}
function drops(f, list, r, dk) {
  if (!f || f.ally || f.calm || f.kind !== "mech" || G().L < 2) return;
  var beh = f.beh || (f.base && f.base.beh) || [], has = function (k) { return beh.indexOf(k) >= 0; };
  var l = Lk();
  if (has("camera") || ((l.cards || 0) + (G().inv.lockcard || 0) + (l.inv.lockcard || 0)) >= CARD_MAX) return;
  var pc = f.boss ? 0.3 : has("commander") ? 0.06 : f.guard ? 0.03 : 0.008;
  if (r() < pc * (dk || 1)) list.push({ kind: "item", item: "lockcard", n: 1 });
}
/* Доплата действует только на занятые арендованные ячейки после истечения срока. */
function leasedOver() {
  var start = permanentSlots();
  if (!Lk().cells.some(function (c, i) { return i >= start && c && c.leased; })) return false;
  var view = storageView();
  return Object.keys(view.byType).some(function (type) { var i = view.byType[type]; return i >= start && Lk().cells[i].leased; });
}
function feeDay() { return Math.max(5, Math.round(rentPrice() / 3)); }
function feeTick() {
  var l = Lk(), now = nowAbs();
  if (!l.rentUntil || rented() || !leasedOver() || l.feeAt == null) { l.feeAt = now; return; }
  var dm = now - Math.max(l.feeAt, l.rentUntil);
  if (dm <= 0) return;
  l.feeAt = now;
  l.feeF = (l.feeF || 0) + feeDay() * dm / 1440;
  if (l.feeF >= 1) { var n = Math.floor(l.feeF); l.feeF -= n; l.debt = (l.debt || 0) + n; }
}
function collect() {
  var l = Lk(), g = G();
  feeTick();
  if (!(l.debt > 0)) return "";
  var n = Math.min(g.credits || 0, l.debt);
  if (n <= 0) return " Долг за хранение — " + crW(l.debt) + ".";
  g.credits -= n; l.debt -= n;
  saveStorage();
  return " За хранение списано " + crW(n) + (l.debt > 0 ? ", долг ещё " + crW(l.debt) : "") + ".";
}
function minutes() {
  if (!LAB.game || !gm().entered) return;
  after();
  var l = G().locker; if (!l || !l.rentUntil) return;
  feeTick();
  if (l.rentUntil > nowAbs() || l.rentSaid === l.rentUntil) return;
  l.rentSaid = l.rentUntil;
  sayq("Аренда ячеек закончилась. " + cap1(capLine()) + "." + (leasedOver() ? " Вещи из бывших арендованных ячеек можно забрать. До выдачи хранение стоит " + crW(feeDay()) + " в сутки." : " Продлить аренду можно у пункта снабжения."));
}
function upgrade() {
  var l = Lk();
  if (l.lv >= LOCK_MAX_LV) { say("Все ступени расширения куплены. " + cap1(capLine()) + "."); return false; }
  var p = upPrice();
  if (!pay(p, "Расширение хранилища")) return false;
  l.lv++;
  say("В хранилище добавлено " + LOCK_ADD_SLOTS + " ячейки. " + cap1(capLine()) + "." + paid(p));
  if (gm().journal) gm().journal("Хранилище расширено до ступени " + l.lv + ".");
  expanded();
  return true;
}
function upgradeCell(index) {
  if (index < 0 || index >= permanentSlots() || index % 1 !== 0) return false;
  var cells = Lk().cells, cell = cells[index];
  if (cell && (cell.lv || 0) >= CELL_MAX_LV) { say("Достигнута максимальная вместимость ячейки " + (index + 1) + "."); return false; }
  var p = cellPrice(index);
  if (!pay(p, "Увеличение вместимости")) return false;
  if (!cell) cell = cells[index] = {};
  cell.lv = (cell.lv || 0) + 1;
  say("Ячейка " + (index + 1) + " теперь вмещает " + cellCap(cell) + " предметов." + paid(p));
  expanded();
  return true;
}
function cellLabel(index, view) {
  var c = Lk().cells[index], type = c && c.type;
  var label = "Ячейка " + (index + 1) + ". " + (type ? CELL_NAMES[type] : "Свободна") + ". " + (view.counts[type] || 0) + " из " + cellCap(c) + " предметов.";
  if (index >= view.slots) return label + " Только выдача.";
  if (type && view.counts[type] > cellCap(c)) return label + " Сверх вместимости. Сначала заберите лишнее.";
  if (index >= permanentSlots()) return label + " В аренде.";
  return label;
}
function cellMenu(index, where) {
  function items() {
    var view = storageView(), c = Lk().cells[index], type = c && c.type;
    var out = [{ label: cellLabel(index, view), info: true, fn: function () {} }];
    if (index < view.slots) out.push({ label: type ? "Положить ещё" : "Назначить ячейку и положить предметы", fn: function () { putMenu(index); } });
    if (type) out = out.concat(contentsItems(type));
    if (where === "post" && index < permanentSlots()) {
      if ((c && c.lv || 0) >= CELL_MAX_LV) out.push({ label: "Вместимость максимальная.", info: true, fn: function () {} });
      else out.push({ label: "Увеличить вместимость на " + CELL_ADD + " предметов за " + crW(cellPrice(index)) + ". У вас " + crW(G().credits) + ".", keep: true, fn: function () { upgradeCell(index); } });
    }
    return out.concat({ label: "Назад", close: true });
  }
  UIx("menu", "Ячейка " + (index + 1), items(), { rebuild: items });
}
function cellsMenu(where, onlyFilled) {
  function items() {
    var view = storageView(), cells = Lk().cells, out = [];
    for (var i = 0; i < Math.max(cells.length, view.slots); i++) {
      if ((onlyFilled || i >= view.slots) && !(cells[i] && cells[i].type)) continue;
      out.push({ id: "storage-cell-" + i, label: cellLabel(i, view), fn: cellMenu.bind(null, i, where) });
    }
    if (!out.length) out.push({ label: "Хранилище пусто.", info: true, fn: function () {} });
    return out.concat({ label: "Назад", close: true });
  }
  UIx("menu", onlyFilled ? "Забрать из хранилища" : "Ячейки хранилища", items(), { rebuild: items });
}
function lockerItems(where) {
  var view = storageView(), n = lockerN(), debt = Lk().debt || 0;
  var onlyTake = Object.keys(view.byType).filter(function (type) { return view.byType[type] >= view.slots; }).length;
  var its = [
    { label: (n ? "Предметов в хранилище: " + n + ". " : "Хранилище пусто. ") + cap1(capLine(view)) + "." + (onlyTake ? " Ячеек только на выдачу: " + onlyTake + "." : "") + (debt ? " Долг за хранение — " + crW(debt) + "." : "") + " " + line(), info: true, fn: function () {} },
    { label: "Положить в хранилище", fn: putMenu },
    { label: "Забрать из хранилища", fn: function () { cellsMenu(where, true); } },
    { label: "Ячейки хранилища" + (where === "post" ? ". Просмотр и улучшение вместимости" : ""), fn: function () { cellsMenu(where, false); } },
    { label: "Сдать все детали, сколько влезет", keep: true, fn: putParts },
    { label: "Забрать все детали, сколько унесёте", keep: true, fn: takeParts }
  ];
  if ((G().inv.lockcard || 0) > 0) its.push({ label: "Добавить " + CARD_SLOTS + " ячейки по ключ-карте. Карт у вас " + G().inv.lockcard + ".", keep: true, fn: useCard });
  if (where === "post") {
    var lv = Lk().lv;
    if (lv < LOCK_MAX_LV) its.push({ label: "Расширить хранилище на " + LOCK_ADD_SLOTS + " ячейки за " + crW(upPrice()) + ". Ступень " + (lv + 1) + " из " + LOCK_MAX_LV + ". У вас " + crW(G().credits) + ".", keep: true, fn: upgrade });
    its.push({ label: (rented() ? "Продлить аренду на трое суток" : "Арендовать " + RENT_SLOTS + " ячеек на трое суток") + " за " + crW(rentPrice()) + "." + (rented() ? " Срок до " + untilText(Lk().rentUntil) + "." : ""), keep: true, fn: rent });
  }
  if (where === "bench") {
    Object.keys(STORAGE_CRAFT).forEach(function (kind) {
      var def = STORAGE_CRAFT[kind], n = Lk()[kind] || 0;
      var label = def.n + ". " + def.gain + ". Сделано " + n + " из " + CRAFT_MAX + ".";
      if (n < CRAFT_MAX) its.push({ label: label + " " + (craftLock(kind) || "Нужно: " + LAB.workshop.costText(craftNeed(kind))) + ".", keep: true, fn: function () { craftCell(kind); } });
    });
  }
  its.push({ label: "Количество ячеек. " + capWhy() + ".", info: true, fn: function () {} });
  its.push({ label: "Как устроено хранилище", fn: function () {
    UIx("note", "Как устроено хранилище", "Назначение ячейки определяется первой положенной вещью. Например, провода и металлолом хранятся вместе в ячейке для деталей. Для одного назначения используется одна ячейка. Пустая ячейка может принять другое назначение и сохраняет купленную вместимость. Чтобы выбрать ячейку вручную, откройте её через список ячеек. Сначала в хранилище 10 ячеек, по 300 предметов в каждой. Пункт снабжения продаёт дополнительные ячейки и увеличивает вместимость выбранной ячейки на 100 предметов за ступень. Когда аренда заканчивается, содержимое временных ячеек остаётся доступным на выдачу.");
  } });
  return its.concat({ label: "Назад", close: true });
}
function cap1(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
function lockerMenu(where) {
  snd("locker_open", "ui_open");
  var paidNow = collect();
  UIx("menu", "Личное хранилище", lockerItems(where), { rebuild: function () { return lockerItems(where); }, onClose: function () { snd("locker_close", "ui_close"); },
    intro: "Вещи доступны у капсулы, верстака и пункта снабжения. " + cap1(capLine()) + "." + paidNow });
}
function rigGate(def) {
  var w = LAB.workshop, b = w && w.near();
  if (!b || w.effTier(b) < def.tier) return "нужен верстак ступени " + def.tier;
  if (LAB.combat && LAB.combat.danger()) return "рядом враг";
  if (LAB.stats.base("con") < def.con) return "нужно телосложение " + def.con;
  if (!w.haveAll(def.need)) return "не хватает деталей: " + w.costText(def.need);
  return "";
}
function fitRig() {
  var g = G(), level = g.loadRig || 0, next = RIGS[level];
  if (!next) return false;
  var why = rigGate(next);
  if (why) { say(next.n + ": " + why + "."); return false; }
  LAB.workshop.take(next.need);
  g.loadRig = level + 1;
  if (LAB.mastery) LAB.mastery.gain("mech", 4 + 2 * level);
  if (LAB.ach) LAB.ach.ev("craft", 1);
  if (gm().advanceTime) gm().advanceTime(5 + 3 * level);
  if (gm().autosaveSoon) gm().autosaveSoon();
  snd("work_ratchet", "craft");
  say("Грузовое снаряжение готово. Установлен комплект «" + next.n + "». " + line());
  after(true);
  return true;
}
function rigMenu() {
  var items = function () {
    var r = rig(), next = RIGS[G().loadRig || 0], out = [
      { label: r ? r.n + ". Вклад в текущий предел: " + kg(capOf("rig")) + "." : "Грузовое снаряжение ещё не собрано.", info: true, keep: true, fn: status },
      { label: "Пояс даёт 5, рама 10, упряжь 15 килограммов. Каждый следующий комплект использует предыдущий. С приводами каркаса нижняя опора общая, поэтому их прибавки складываются частично.", info: true, keep: true, fn: function () { say(capText() + "."); } }
    ];
    if (next) out.push({ label: "Подогнать: " + next.n + ". Верстак ступени " + next.tier + ", телосложение " + next.con + ". Детали: " + LAB.workshop.costText(next.need) + ".", keep: true, fn: fitRig });
    return out.concat({ label: "Назад", close: true, fn: function () {} });
  };
  UIx("menu", "Грузовое снаряжение", items(), { keep: true, rebuild: items });
}
function benchItems(where) {
  var items = [{ label: function () { return "Личное хранилище. " + cap1(capLine()) + "."; }, fn: function () { lockerMenu(where || "bench"); } }];
  if (!where || where === "bench") items.push({ label: "Грузовое снаряжение: пояс, рама и упряжь", fn: rigMenu });
  return items;
}
/* Запись прежней версии: если с новым весом герой не сдвинется — лишние детали и ценности
   уходят в личное хранилище. Вещи сверх нового предела остаются доступны на выдачу. */
function init(loaded) {
  var g = G();
  if (g && g.locker) storageView();
  if (!g || g.loadInit) { reset(); return; }
  g.loadInit = 1; reset();
  if (!loaded || ratio() <= 1.25) return;
  /* (после 4.6, нелогичность) не уносятся: то, что не выбрасывается (жетоны погибших ждут выжившие),
     инструменты (набором вскрывают шкафчики, респиратор спасает от газа); если вещей не хватило —
     лишнее оружие (не в руках и не монтировка), броня и каркасы (не надетые), батареи не для оружия в руках */
  var moveKinds = ["part", "valuable", "chem", "misc", "deploy", "wmodule"], w0 = total(), l = Lk(), moved = { inv: 0, w: 0, a: 0, f: 0, am: 0 };
  var keep = function (id) { return gm().dropWhy && gm().dropWhy(id); };
  moveKinds.forEach(function (kd) {
    if (ratio() <= 1) return;
    Object.keys(g.inv).filter(function (id) { var d = LAB.ITEMS[id]; return d && d.kind === kd && g.inv[id] > 0 && !keep(id); })
      .sort(function (a, b) { return itemWt(b) * g.inv[b] - itemWt(a) * g.inv[a]; })
      .forEach(function (id) { if (ratio() > 1) { var c = g.inv[id]; moveItemToLocker(id, c); moved.inv += c; } });
  });
  var hand = g.weapons[g.wi];
  (g.weapons || []).slice().sort(function (a, b) { return weaponWt(b) - weaponWt(a); }).forEach(function (w) {
    if (ratio() <= 1 || w === hand || w.id === "w_start_crowbar") return;
    g.weapons.splice(g.weapons.indexOf(w), 1); l.weapons.push(w); moved.w++;
  });
  if (hand) g.wi = Math.max(0, g.weapons.indexOf(hand));
  (g.armors || []).slice().forEach(function (a) { if (ratio() <= 1 || a === g.armor) return; g.armors.splice(g.armors.indexOf(a), 1); l.armors.push(a); moved.a++; });
  var on = wornFrame();
  (g.frames || []).slice().forEach(function (f) { if (ratio() <= 1 || f === on) return; g.frames.splice(g.frames.indexOf(f), 1); l.frames.push(f); moved.f++; });
  Object.keys(g.ammo || {}).forEach(function (k) { if (ratio() <= 1 || !(g.ammo[k] > 0) || (hand && hand.ammo === k)) return; l.ammo[k] = (l.ammo[k] || 0) + g.ammo[k]; moved.am += g.ammo[k]; g.ammo[k] = 0; });
  storageView();
  var gone = Math.round((w0 - total()) * 10) / 10;
  var what = [moved.inv ? "вещи и детали, " + moved.inv + " шт." : "", moved.w ? "оружие, " + moved.w + " шт." : "", moved.a ? "броня, " + moved.a + " шт." : "", moved.f ? "каркасы, " + moved.f + " шт." : "", moved.am ? "батареи и заряды, " + moved.am + " шт." : ""].filter(Boolean).join("; ");
  if (gone > 0) setTimeout(function () { LAB.safe(function () { sayq("Теперь у вещей есть вес. " + (ratio() <= 1.5 ? "Чтобы вы могли идти, лишнее" : "Лишнее") + " — " + kg(gone) + " — отправлено в ваше личное хранилище. " + what + ". Хранилище открывается у капсулы восстановления, верстака и пункта снабжения. " + line()); }); }, 1500);
}

LAB.load = {
  kg: kg, itemWt: itemWt, weaponWt: weaponWt, armorWt: armorWt, frameWt: frameWt, ammoWt: function (k) { return AMMO_WT[k] || 0.4; }, floorWt: floorWt, parts: parts, total: total,
  capOf: capOf, statCapacity: statCapacity, personalCapacity: personalCapacity, capacity: capacity, ratio: ratio, tier: tier, TIER_N: TIER_N,
  gapK: gapK, stepGap: stepGap, noise: noise, wakeK: wakeK, accPen: accPen, dodgePen: dodgePen, handPen: handPen, needStr: needStr, handStr: handStr,
  canMove: canMove, canTake: canTake, refuseText: refuseText, after: after, reset: reset,
  line: line, status: status, handNote: handNote, weaponLine: weaponLine, heaviest: heaviest,
  locker: Lk, lockerWt: lockerWt, lockCap: lockCap, slotsUsed: slotsUsed, lockerMenu: lockerMenu, benchItems: benchItems, putItem: putItem, takeItem: takeItem, putParts: putParts, takeParts: takeParts,
  upgrade: upgrade, upPrice: upPrice, init: init, rent: rent, rentPrice: rentPrice, rented: rented, craftCell: craftCell, craftNeed: craftNeed,
  useCard: useCard, drops: drops, minutes: minutes, capParts: capParts, fitRig: fitRig
};
})();
