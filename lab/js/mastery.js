/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — мастерство (после 4.6).
   Механики переработаны из книги Эдуарда Полякова «Квази Эпсилон»: герой —
   инженер-механик, сила которого растёт из рук. Навык мастерской растёт
   только от дела — сборки, ремонта, разбора, изучения и испытаний, — и от
   того, что своя самоделка побеждает в бою. Пять направлений: механика,
   электрика, энергетика, опознание, конструирование. Над Истоком у каждого
   пять ступеней, ниже Истока — до восьми; общая ступень — до десяти, на
   третьей и шестой — специализация мастера.
   Тщательная работа у верстака занимает игровое время и бодрость, но
   оружие, броня и каркасы чаще выходят на ступень качества лучше и реже —
   со скрытым браком. Скрытый брак бывает только у собранного своими руками
   (опытные вещи со станков, свои конструкции, каркасы, дроны) и проявляется
   в деле; испытание на стенде находит его заранее, у верстака его устраняют.
   Изучение устройства — без разбора: изученный вид открывает свою схему,
   копии по нему выходят лучше, а изученные находки дают узлы для своих
   конструкций (forge.js).
   Обычная работа — как прежде: мгновенно и без брака у простых и средних вещей.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function menu(title, items, opts) { return LAB.ui.menu(title, items, opts); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
var lastSay = {};
function sayOnce(k, t, gap) { var n = Date.now(); if (lastSay[k] && n - lastSay[k] < (gap || 4000)) return; lastSay[k] = n; sayq(t); }
/* Звук: новая запись, а пока её нет в банке — близкая из прежних. */
function snd(id, alt, o) { var S = LAB.SND || {}; A("play", S[id] ? id : (alt || id), o); }
function plural(n, a, b, c) { return gm().plural ? gm().plural(n, a, b, c) : a; }

/* ════════ НАПРАВЛЕНИЯ, СТУПЕНИ, СПЕЦИАЛИЗАЦИИ ════════ */
var DIRS = {
  mech: { n: "механика", d: "оружие ближнего боя и на пулях, броня, каркасы, ремонт, восстановление деталей" },
  elec: { n: "электрика", d: "модули оружия, гранаты и устройства, турели, ловушки, дроны" },
  enrg: { n: "энергетика", d: "батареи и заряды, энергетическое оружие, ёмкость, регулятор мощности" },
  ident: { n: "опознание", d: "разбор, изучение устройств, исследование схем, испытания" },
  design: { n: "конструирование", d: "свои конструкции, ядра в оружии, модернизация и перековка" }
};
var ORDER = ["mech", "elec", "enrg", "ident", "design"];
/* опыт до ступени направления (0–8; шестая и выше — только ниже Истока) */
var STEP_XP = [0, 25, 70, 150, 280, 460, 700, 1000, 1400];
/* опыт до общей ступени (0–10) — сумма по всем направлениям */
var ALL_XP = [0, 30, 90, 180, 320, 520, 780, 1100, 1500, 2000, 2600];
var SPECS = {
  arms: { n: "оружейник", d: "оружие чаще выходит на ступень лучше; ремонт оружия — на пять выше обычного предела" },
  armor: { n: "бронник", d: "броня и каркасы чаще выходят на ступень лучше; на каркас встаёт лишняя накладка" },
  energy: { n: "энергетик", d: "батареи и заряды иногда выходят с запасом; оружие меньше греется; экономный режим выгоднее" },
  drones: { n: "дроновод", d: "у дрона лишнее гнездо, умения перезаряжаются быстрее, опыта ему вдвое больше" },
  inventor: { n: "изобретатель", d: "в своих конструкциях вдвое меньше брака; директивы ядер приживаются лучше" },
  thrift: { n: "рачительный", d: "после сборки иногда остаётся одна деталь; разбор даёт больше" }
};
var SPEC_ORDER = ["arms", "armor", "energy", "drones", "inventor", "thrift"];

function M() {
  var g = G();
  if (!g.mast) g.mast = { xp: { mech: 0, elec: 0, enrg: 0, ident: 0, design: 0 }, spec: [], mode: 0, day: -1, rep: {}, studied: {}, known: {}, first: {}, kday: -1, kxp: 0 };
  var m = g.mast;
  ORDER.forEach(function (k) { if (m.xp[k] == null) m.xp[k] = 0; });
  if (!m.spec) m.spec = []; if (!m.rep) m.rep = {}; if (!m.studied) m.studied = {}; if (!m.known) m.known = {}; if (!m.first) m.first = {};
  return m;
}
/* был ли герой ниже Истока: тогда ступени направлений — до восьми */
function below() { var g = G(); if (g.L > 100) return true; for (var k in (g.maxF || {})) if (+k > 100) return true; return false; }
function stepAt(x) { var s = 0; for (var i = 1; i < STEP_XP.length; i++) if (x >= STEP_XP[i]) s = i; return s; }
function step(k) { return Math.min(stepAt(M().xp[k] || 0), below() ? 8 : 5); }
function total() { var m = M(), t = 0; ORDER.forEach(function (k) { t += m.xp[k] || 0; }); return t; }
function overall() { var t = total(), s = 0; for (var i = 1; i < ALL_XP.length; i++) if (t >= ALL_XP[i]) s = i; return s; }
function has(sp) { return M().spec.indexOf(sp) >= 0; }
function specFree() { var o = overall(); return (o >= 3 ? 1 : 0) + (o >= 6 ? 1 : 0) - M().spec.length; }
function dayNow() { return G().day || 1; }

/* Опыт направлению: вслух — новая ступень направления и общая ступень. */
function gain(k, n, quiet) {
  if (!n || !DIRS[k]) return 0;
  var m = M(), s0 = step(k), o0 = overall();
  if (n > 0 && LAB.stats) n *= LAB.stats.K.xp(); /* (после 4.6) интеллект: опыт мастерства больше */
  m.xp[k] = Math.round(((m.xp[k] || 0) + n) * 10) / 10;
  var s1 = step(k), o1 = overall();
  if (s1 > s0 && !quiet) { snd("skill_up", "ui_levelup"); /* (после 4.6) свой перезвон: мастерство, а не проверка детали */ sayq("Мастерство растёт: " + DIRS[k].n + " — ступень " + s1 + "."); if (gm().journal) gm().journal("Мастерство: " + DIRS[k].n + ", ступень " + s1 + "."); }
  if (o1 > o0 && !quiet) {
    sayq("Общее мастерство — ступень " + o1 + "." + (specFree() > 0 ? " Можно выбрать специализацию мастера — у верстака." : ""));
    if (gm().journal) gm().journal("Общее мастерство — ступень " + o1 + ".");
  }
  return n;
}

/* ════════ КАКОЕ НАПРАВЛЕНИЕ У РЕЦЕПТА ════════ */
var KIT_OUT = { fieldkit: 1, wrepair: 1, repairkit: 1, engkit: 1, m_oilcan: 1, toolkit: 1 };
function isMed(d) { return !!(d && (d.heal || (d.fx && (d.fx.heal || d.fx.en || d.fx.cure)) || d.en || d.cure || d.detox || d.neuro || d.stopBleed)); }
function dirOf(rc) {
  if (!rc) return "";
  if (rc.forge) return rc.forge;
  var o = String(rc.out), d = LAB.ITEMS[o];
  if (rc.group === "restore") return "mech";
  if (KIT_OUT[o] || o === "plate" || /^pick_|lockpick/.test(o)) return "mech";
  if (o.indexOf("armor:") === 0) return "mech";
  if (o.indexOf("weapon:") === 0) { var wb = LAB.WEAPONS[o.slice(7)] || {}; return wb.rng <= 1 || LAB.physAmmo(wb.ammo) ? "mech" : "enrg"; }
  if (o.indexOf("ammo:") === 0 || o === "bat_e" || /^bat_|cell$/.test(o)) return "enrg";
  if (d && (d.kind === "wmodule" || d.kind === "implant" || d.kind === "trap" || d.kind === "deploy" || d.kind === "throw")) return "elec";
  if (isMed(d)) return ""; /* лекарства — дело химии и медицины, не мастерской */
  return "elec";
}
/* класс работы для опыта, времени и брака */
function workCls(rc) {
  if (!rc) return "spec";
  if (rc.forge) return "own";
  if (rc.deepT) return "deep";
  var W = LAB.workshop;
  return W && W.clsOf ? W.clsOf(rc) : "spec";
}
var XP_CLS = { base: 2, spec: 4, exp: 7, cnc: 6, syn: 9, deep: 9, own: 15 };
var MIN_CLS = { base: 3, spec: 5, exp: 9, cnc: 6, syn: 10, deep: 9, own: 12 };
var FLAW_CLS = { base: 0, spec: 0, exp: 0.04, cnc: 0.02, syn: 0.03, deep: 0.04, own: 0.12 };
function inst(rc) { var o = String(rc && rc.out); return o.indexOf("weapon:") === 0 || o.indexOf("armor:") === 0; }
function baseKey(rc) { var o = String(rc.out); return o.indexOf("weapon:") === 0 ? "w:" + o.slice(7) : o.indexOf("armor:") === 0 ? "a:" + o.slice(6) : ""; }
function studiedKey(k) { return !!(k && M().known[k]); }
function careful() { return M().mode === 1; }
function tired() { var b = G().body; return !!(b && b.wake < 20); }

/* ════════ КАЧЕСТВО И БРАК СОБРАННОГО ════════ */
function benchNow() { var W = LAB.workshop; return W && W.near ? W.near() : null; }
function tierNow(b) { var W = LAB.workshop; b = b || benchNow(); return b && W ? W.effTier(b) : 1; }
/* шанс выйти на ступень лучше (0–1) */
function upChance(rc, kind, b, opts) {
  opts = opts || {};
  var dk = opts.dir || dirOf(rc) || "mech", s = step(dk), t = tierNow(b);
  var p = 0.06 * s + 0.04 * Math.max(0, t - 1) + (opts.careful != null ? (opts.careful ? 0.2 : 0) : (careful() ? 0.2 : 0));
  if (opts.key ? studiedKey(opts.key) : studiedKey(baseKey(rc))) p += 0.25;
  if ((kind === "w" && has("arms")) || ((kind === "a" || kind === "x") && has("armor"))) p += 0.15;
  if (tired()) p -= 0.1;
  return Math.max(0, Math.min(0.9, p));
}
function qualCap(b) { return tierNow(b) >= 5 ? 5 : 4; }
function rollQual(rc, q0, kind, b, opts) {
  var p = upChance(rc, kind, b, opts), q = q0, s = step((opts && opts.dir) || dirOf(rc) || "mech");
  if (Math.random() < p) { q++; if (s >= 4 && tierNow(b) >= 4 && Math.random() < p / 2) q++; }
  return Math.max(q0, Math.min(Math.max(q0, qualCap(b)), q));
}
function flawChance(rc, opts) {
  opts = opts || {};
  var c = opts.cls || workCls(rc), p = opts.base != null ? opts.base : (FLAW_CLS[c] || 0);
  if (!p) return 0;
  var s = step(opts.dir || dirOf(rc) || "mech");
  p *= Math.max(0.1, 1 - 0.12 * s);
  if (opts.careful != null ? opts.careful : careful()) p *= 0.3;
  if (tired()) p *= 1.6;
  if (opts.key ? studiedKey(opts.key) : studiedKey(baseKey(rc))) p *= 0.5;
  if (c === "own" && has("inventor")) p *= 0.5;
  if (LAB.stats) p *= LAB.stats.K.flaw(); /* (после 4.6) ловкость: «чтобы не ронять инструмент» */
  return Math.min(0.5, p);
}
var FLAWS = {
  crack: { n: "трещина в стволе", d: "износ вдвое быстрее", fix: { scrap: 2, ceramic: 1 }, w: 1 },
  trigger: { n: "люфт спуска", d: "осечки", fix: { servo: 1, scrap: 1 }, w: 1 },
  contact: { n: "слабый контакт", d: "урон на восьмую часть меньше", fix: { wire: 2, chip: 1 }, w: 1 },
  sight: { n: "сбитый прицел", d: "точность хуже", fix: { lens: 1, chip: 1 }, w: 1 },
  balance: { n: "плохая балансировка", d: "удар на десятую часть слабее", fix: { scrap: 2, wire: 1 }, m: 1 },
  blade: { n: "трещина в клинке", d: "износ вдвое быстрее", fix: { scrap: 2, ceramic: 1 }, m: 1 },
  seam: { n: "слабый шов", d: "защита на шестую часть ниже", fix: { scrap: 2, panel: 1 }, a: 1 },
  play: { n: "люфт креплений", d: "износ в полтора раза быстрее", fix: { scrap: 2, servo: 1 }, a: 1 }
};
function flawKinds(kind, x) {
  var out = [];
  for (var k in FLAWS) { var f = FLAWS[k]; if (kind === "a" ? f.a : kind === "m" ? f.m : f.w) out.push(k); }
  return out;
}
function kindOf(x, isArmor) { if (isArmor) return "a"; var wb = LAB.WEAPONS[x.base] || {}; return (x.rng0 != null ? x.rng0 : x.rng) <= 1 || wb.rng <= 1 ? "m" : "w"; }
/* Поставить скрытый брак экземпляру с шансом p. */
function maybeFlaw(x, p, isArmor) {
  if (!x || !(p > 0) || Math.random() >= p) return false;
  var ks = flawKinds(kindOf(x, isArmor), x);
  x.flaw = { k: ks[Math.floor(Math.random() * ks.length)], seen: 0, n: 0 };
  return true;
}
function flawOf(x) { return x && x.flaw && FLAWS[x.flaw.k] ? x.flaw : null; }
function flawName(x) { var f = flawOf(x); return f ? FLAWS[f.k].n : ""; }
/* Брак проявился в деле — назвать один раз. */
function reveal(x, how) {
  var f = flawOf(x);
  if (!f || f.seen) return;
  f.seen = 1;
  snd("work_flaw", "w_empty");
  sayq(how + " " + cap1(x.name || "") + ": похоже, брак сборки — " + FLAWS[f.k].n + " (" + FLAWS[f.k].d + "). Устранить можно у верстака.");
}
/* Влияние брака: на износ, осечки, урон, точность, защиту. */
function wearK(x) { var f = flawOf(x); if (!f) return 1; if (f.k === "crack" || f.k === "blade") { if ((x.cond != null ? x.cond : 100) < 70) reveal(x, "Износ идёт вдвое быстрее."); return 2; } if (f.k === "play") return 1.5; return 1; }
function misfire(x) { var f = flawOf(x); if (!f || f.k !== "trigger") return false; if (Math.random() < 0.06) { reveal(x, "Осечка, хотя оружие исправно."); return true; } return false; }
function dmgK(x) {
  var f = flawOf(x); if (!f) return 1;
  if (f.k === "contact" || f.k === "balance") { f.n = (f.n || 0) + 1; if (f.n >= 20) reveal(x, f.k === "contact" ? "Выстрел слабее, чем должен." : "Удар выходит слабее, чем должен."); return f.k === "contact" ? 0.88 : 0.9; }
  return 1;
}
function accK(x) { var f = flawOf(x); if (!f || f.k !== "sight") return 0; f.n = (f.n || 0) + 1; if (f.n >= 20) reveal(x, "Пули уходят мимо прицела."); return -0.06; }
function defK(a) { var f = flawOf(a); if (!f || f.k !== "seam") return 1; f.n = (f.n || 0) + 1; if (f.n >= 12) reveal(a, "Шов расходится под ударами."); return 0.85; }

/* ════════ ПОСЛЕ СБОРКИ (game.craft) ════════
   Возвращает поправки к собранному: качество, брак, время; опыт — здесь же. */
function before(rc, b) {
  /* тщательная работа — только когда есть время */
  if (careful() && inst(rc) && LAB.combat && LAB.combat.danger && LAB.combat.danger()) return "Не до тщательной работы: рядом враг. Переключите режим работы на обычный или отойдите.";
  return "";
}
/* Каждый собранный экземпляр — до того, как он ляжет в рюкзак: качество и брак. */
function begin(rc) { return { msg: "", better: 0, flaw: 0 }; }
function item(rc, x, isA, b, ms) {
  if (!x) return;
  ms = ms || {};
  var q0 = x.qual;
  x.mk = 1; /* собрано своими руками: испытание, брак */
  var q = rollQual(rc, q0, isA ? "a" : "w", b);
  if (q > q0) { upQual(x, q, isA); ms.better = Math.max(ms.better || 0, q); ms.betterName = x.name; }
  if (maybeFlaw(x, flawChance(rc), isA)) ms.flaw = 1;
}
/* После сборки: время и усталость тщательной работы, опыт, рачительность. Возвращает слова. */
function finish(rc, b, ms) {
  ms = ms || {};
  var m = M(), c = workCls(rc), dk = dirOf(rc), t0 = careful() && inst(rc), msg = "";
  if (t0) {
    var mins = Math.max(2, Math.round((MIN_CLS[c] || 5) * (1 - 0.05 * step(dk || "mech"))));
    if (gm().advanceTime) gm().advanceTime(mins);
    var body = G().body; if (body) body.wake = Math.max(0, body.wake - (c === "exp" || c === "syn" || c === "deep" ? 4 : 3));
    workSound(dk);
    msg += " Тщательная работа: " + mins + " " + plural(mins, "минута", "минуты", "минут") + ".";
  }
  if (ms.better) msg += " Вышло лучше обычного: " + ms.betterName + ".";
  if (tired() && inst(rc)) msg += " Руки дрожат от усталости: брак вероятнее. Отдохните.";
  /* опыт мастерства: новое — втрое, повтор за сутки — всё меньше */
  if (dk) {
    if (m.day !== dayNow()) { m.day = dayNow(); m.rep = {}; }
    var n = (m.rep[rc.id] = (m.rep[rc.id] || 0) + 1);
    var xp = (XP_CLS[c] || 4) * Math.max(0.2, 1 - 0.2 * (n - 1));
    if (!m.first["rc:" + rc.id]) { m.first["rc:" + rc.id] = 1; xp *= 3; }
    if (t0) xp *= 1.5;
    gain(dk, Math.round(xp * 10) / 10);
  }
  /* рачительный: одна деталь осталась; энергетик: батареи и заряды с запасом */
  if (has("thrift") && Math.random() < 0.2) {
    var need = LAB.workshop ? LAB.workshop.needOf(rc, b) : rc.need, ks = Object.keys(need || {});
    if (ks.length) { var pk = ks[Math.floor(Math.random() * ks.length)]; G().inv[pk] = (G().inv[pk] || 0) + 1; msg += " Рачительный мастер: осталась одна деталь — " + (LAB.ITEMS[pk] ? LAB.ITEMS[pk].n.toLowerCase() : pk) + "."; }
  }
  var o = String(rc.out);
  if (has("energy") && (o.indexOf("ammo:") === 0 || /^bat_/.test(o)) && Math.random() < 0.25) {
    if (o.indexOf("ammo:") === 0) G().ammo[o.slice(5)] = (G().ammo[o.slice(5)] || 0) + 1; else G().inv[o] = (G().inv[o] || 0) + 1;
    msg += " Энергетик: вышло с запасом — плюс одна.";
  }
  return msg;
}
function isArmorRc(rc) { return String(rc.out).indexOf("armor:") === 0; }
/* поднять качество собранного экземпляра (урон или защиту — по множителю качества) */
function upQual(x, q, isA) {
  var q0 = x.qual, k = LAB.QUAL_MULT[q] / LAB.QUAL_MULT[q0];
  if (isA) { x.def = Math.max(1, Math.round(x.def * k)); x.qual = q; var d = LAB.ARMORS[x.base]; if (d) x.name = LAB.QUAL[d.g][q] + " " + d.n; return; }
  var W = LAB.workshop, wb = LAB.WEAPONS[x.base];
  if (x.dmg0 != null) x.dmg0 = x.dmg0 * k;
  x.dmg = Math.max(1, Math.round(x.dmg * k)); x.qual = q;
  if (x.cap0) x.cap0 = LAB.weaponCap(x.base, x.rank, x.lvl, q);
  else if (x.cap) { var c1 = LAB.weaponCap(x.base, x.rank, x.lvl, q); if (c1 > x.cap) x.cap = c1; }
  if (W && x.dmg0 != null) W.recalc(x);
  if (x.own && LAB.forge) LAB.forge.rename(x);
  else if (wb) x.name = LAB.QUAL[wb.g][q] + " " + wb.n + (wb.cls === "melee" && x.base !== "cutter" ? "" : " " + LAB.MODEL[x.base] + "-" + LAB.weaponMark(x.rank, x.lvl));
}
/* звуки работы у верстака: по направлению */
function workSound(dk) {
  var seqS = dk === "elec" || dk === "enrg" ? ["work_solder", "work_weld"] : dk === "design" ? ["work_ratchet", "work_weld"] : ["work_hammer", "work_file"];
  snd(seqS[0], "pry");
  if (gm().later) gm().later(function () { snd(seqS[1], "craft"); }, 700);
}

/* Прогноз у строки рецепта (с третьей ступени нужного направления). */
function forecast(rc, b) {
  if (!inst(rc)) return "";
  var dk = dirOf(rc) || "mech";
  if (step(dk) < 3) return "";
  var W = LAB.workshop, q0 = W ? W.craftQual() : 2, p = upChance(rc, isArmorRc(rc) ? "a" : "w", b), fp = flawChance(rc);
  var d = isArmorRc(rc) ? LAB.ARMORS[String(rc.out).slice(6)] : LAB.WEAPONS[String(rc.out).slice(7)];
  if (!d || !LAB.QUAL[d.g]) return "";
  var q1 = Math.min(qualCap(b), q0 + 1);
  var s = " Прогноз: " + LAB.QUAL[d.g][q0].toLowerCase() + (q1 > q0 && p > 0.05 ? (p >= 0.5 ? ", скорее " + LAB.QUAL[d.g][q1].toLowerCase() : ", бывает и " + LAB.QUAL[d.g][q1].toLowerCase()) : "");
  s += fp <= 0 ? ", брака не будет." : fp < 0.03 ? ", брак редок." : fp < 0.08 ? ", брак возможен." : ", брак вероятен.";
  return s;
}

/* ════════ ОПЫТ ЗА ПРОЧЕЕ ДЕЛО ════════ */
function ev(kind, x) {
  var w = x;
  switch (kind) {
    case "repair": gain(w && LAB.workshop && w.ammo && w.ammo !== "none" && !LAB.physAmmo(w.ammo) ? "enrg" : "mech", 2); break;
    case "repairArmor": gain("mech", 2); break;
    case "salvage": gain("ident", has("thrift") ? 2.5 : 2); break;
    case "research": gain("ident", 5); break;
    case "modernize": gain("design", 6); break;
    case "reforge": gain("design", 8); break;
    case "bay": gain("enrg", 4); break;
    case "module": gain("elec", 2); break;
    default: break;
  }
}
/* Победа своей самоделкой: опыт мастерства, но за сутки — немного. */
function onKill(w, f) {
  if (!w || !(w.mk || w.own) || !f || f.ally || f.calm) return;
  var m = M();
  if (m.kday !== dayNow()) { m.kday = dayNow(); m.kxp = 0; }
  if (m.kxp >= 30) return;
  var n = w.own ? 2 : 1;
  m.kxp += n;
  var wb = LAB.WEAPONS[w.base] || {};
  gain(w.own ? "design" : (wb.rng <= 1 || LAB.physAmmo(w.ammo) ? "mech" : "enrg"), n);
}

/* ════════ ИСПЫТАНИЕ НА СТЕНДЕ И УСТРАНЕНИЕ БРАКА ════════ */
function made() {
  var g = G(), out = [];
  (g.weapons || []).forEach(function (w) { if (w.mk || w.own) out.push({ x: w, k: "w" }); });
  (g.armors || []).forEach(function (a) { if (a.mk) out.push({ x: a, k: "a" }); });
  if (LAB.exo) LAB.exo.frames().forEach(function (fr) { out.push({ x: fr, k: "x" }); });
  return out;
}
function testItem(x, kind) {
  var b = benchNow();
  if (tierNow(b) < 2) { LAB.UI.error(); say("Испытать можно только у верстака со станками: стенд, тестер и нагрузка."); return false; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { LAB.UI.error(); say("Не до испытаний: рядом враг."); return false; }
  if (gm().advanceTime) gm().advanceTime(4);
  snd("work_study", "pry");
  var f = flawOf(x), first = !x.tested;
  x.tested = 1;
  if (first) gain("ident", 3);
  if (f) {
    f.seen = 1;
    if (gm().later) gm().later(function () { snd("work_flaw", "w_empty"); }, 900);
    say("Испытание, четыре минуты. " + cap1(x.name) + ": найден брак — " + FLAWS[f.k].n + " (" + FLAWS[f.k].d + "). Устранить: " + costText(FLAWS[f.k].fix) + ".");
  } else {
    if (gm().later) gm().later(function () { snd("work_pass", "w_switch"); }, 900);
    say("Испытание, четыре минуты. " + cap1(x.name) + ": брака нет, всё держит.");
  }
  return true;
}
function costText(need) { var s = []; for (var k in need) s.push((LAB.ITEMS[k] ? LAB.ITEMS[k].n.toLowerCase() : k) + " " + need[k]); return s.join(", "); }
function haveAll(need) { var g = G(); for (var k in need) if ((g.inv[k] || 0) < need[k]) return false; return true; }
function take(need) { var g = G(); for (var k in need) g.inv[k] -= need[k]; }
function fixFlaw(x) {
  var f = flawOf(x);
  if (!f) { say(cap1(x.name) + ": брака нет."); return false; }
  if (!f.seen) { say("Сначала испытайте: брак ещё не найден."); return false; }
  if (tierNow() < 2) { LAB.UI.error(); say("Брак устраняют у верстака со станками."); return false; }
  var need = FLAWS[f.k].fix;
  if (!haveAll(need)) { LAB.UI.error(); say("Не хватает: " + costText(need) + "."); return false; }
  take(need);
  if (gm().advanceTime) gm().advanceTime(5);
  workSound(f.k === "contact" || f.k === "sight" ? "elec" : "mech");
  delete x.flaw;
  gain(f.k === "contact" || f.k === "sight" ? "elec" : "mech", 4);
  say("Брак устранён: " + FLAWS[f.k].n + ". " + cap1(x.name) + " — как задумано.");
  return true;
}

/* ════════ ИЗУЧЕНИЕ УСТРОЙСТВА (без разбора) ════════ */
function studyNeed() { var s = step("ident"); return s >= 4 ? 1 : s >= 2 ? 2 : 3; }
function studyKey(x, isA) { return (isA ? "a:" : "w:") + x.base; }
function studyList() {
  var g = G(), out = [];
  (g.weapons || []).forEach(function (w) { if (!w.mk && !w.own && !w.stud && w.id !== "w_start_crowbar" && w.id !== "w_start_spark" && LAB.WEAPONS[w.base]) out.push({ x: w, a: false }); });
  (g.armors || []).forEach(function (a) { if (!a.mk && !a.stud && a.id !== "a_start_suit" && LAB.ARMORS[a.base]) out.push({ x: a, a: true }); });
  return out.filter(function (o) { return !M().known[studyKey(o.x, o.a)]; });
}
function study(x, isA) {
  var b = benchNow(), m = M();
  if (tierNow(b) < 2) { LAB.UI.error(); say("Изучить устройство можно только у верстака со станками: тестер, лупа, схемы."); return false; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { LAB.UI.error(); say("Не до изучения: рядом враг."); return false; }
  var key = studyKey(x, isA);
  if (m.known[key]) { say("Это устройство уже изучено."); return false; }
  if (x.stud) { say("Этот экземпляр уже изучен: нужен другой такой же."); return false; }
  var mins = Math.max(3, Math.round(8 * (1 - 0.06 * step("ident"))));
  if (gm().advanceTime) gm().advanceTime(mins);
  snd("work_study", "pry");
  x.stud = 1;
  var n = (m.studied[key] = (m.studied[key] || 0) + 1), need = studyNeed();
  gain("ident", n === 1 ? 9 : 6);
  var nm = isA ? (LAB.ARMORS[x.base] || {}).n : (LAB.WEAPONS[x.base] || {}).n;
  if (n < need) { say("Изучение, " + mins + " " + plural(mins, "минута", "минуты", "минут") + ". Устройство «" + nm + "» понятно наполовину: нужен ещё " + (need - n === 1 ? "один экземпляр" : (need - n) + " экземпляра") + " того же вида."); return true; }
  m.known[key] = 1;
  var parts = ["Изучение, " + mins + " " + plural(mins, "минута", "минуты", "минут") + ". Устройство «" + nm + "» изучено целиком: собранные копии будут чаще выходить лучше."];
  /* схема сборки, если она есть и ещё не известна */
  var W = LAB.workshop, out = (isA ? "armor:" : "weapon:") + x.base;
  var rc = LAB.RECIPES.filter(function (r) { return r.out === out && r.bp; })[0];
  if (rc && W && !W.known(rc)) { var lt = W.learn(rc.id, "изучение устройства", true); parts.push(lt || ("Открыта схема: «" + rc.n + "»")); }
  /* узлы для своих конструкций */
  if (!isA && LAB.forge && LAB.forge.unlockBy) { var u = LAB.forge.unlockBy(x); if (u) parts.push(u); }
  if (isA && LAB.exo && LAB.exo.unlockBy) { var ue = LAB.exo.unlockBy(x); if (ue) parts.push(ue); }
  say(parts.join(" "));
  if (gm().journal) gm().journal("Изучено устройство: «" + nm + "».");
  return true;
}

/* ════════ ОКНА У ВЕРСТАКА ════════ */
function line() {
  var m = M(), s = "Мастерство: общая ступень " + overall() + ". " + ORDER.map(function (k) { return cap1(DIRS[k].n) + " " + step(k); }).join(", ") + ".";
  if (m.spec.length) s += " Специализация: " + m.spec.map(function (k) { return SPECS[k].n; }).join(" и ") + ".";
  if (specFree() > 0) s += " Можно выбрать специализацию.";
  return s;
}
function next(k) { var x = M().xp[k] || 0, s = stepAt(x); return s + 1 < STEP_XP.length ? Math.ceil(STEP_XP[s + 1] - x) : 0; }
function infoList() {
  var items = ORDER.map(function (k) {
    var s = step(k), cap = below() ? 8 : 5, nx = next(k);
    return { label: cap1(DIRS[k].n) + ": ступень " + s + " из " + cap + (s < cap && nx ? ", до следующей — " + nx + " опыта" : "") + ". " + cap1(DIRS[k].d) + ".", info: true, keep: true, fn: function () {} };
  });
  items.unshift({ label: "Общая ступень мастерства: " + overall() + " из 10. Специализация выбирается на третьей и шестой.", info: true, keep: true, fn: function () {} });
  items.push({ label: "Как растёт: от сборки (новое — втрое больше, повтор за сутки — всё меньше), ремонта, разбора, изучения, испытаний и побед своей самоделкой.", info: true, keep: true, fn: function () {} });
  if (specFree() > 0) items.push({ label: "Выбрать специализацию мастера", fn: specMenu });
  items.push({ label: "Назад", close: true, fn: function () {} });
  return items;
}
function infoMenu() { menu("Мастерство", infoList(), { rebuild: infoList }); }
function specMenu() {
  if (specFree() <= 0) { say("Специализацию можно выбрать на третьей и шестой общей ступени мастерства."); return; }
  var items = SPEC_ORDER.filter(function (k) { return !has(k); }).map(function (k) {
    return { label: cap1(SPECS[k].n) + ": " + SPECS[k].d + ".", fn: function () {
      M().spec.push(k);
      snd("skill_up", "ui_levelup");
      say("Специализация мастера — " + SPECS[k].n + ". " + cap1(SPECS[k].d) + ".");
      if (gm().journal) gm().journal("Специализация мастера: " + SPECS[k].n + ".");
      if (LAB.workshop && LAB.workshop.toRoot) LAB.workshop.toRoot();
    } };
  });
  items.push({ label: "Назад", close: true, fn: function () {} });
  menu("Специализация мастера", items);
}
function testMenu() { menu("Испытание изделий", testItemsList(), { keep: true, rebuild: testItemsList }); }
function testItemsList() {
  var items = made().map(function (o) {
    var x = o.x, f = flawOf(x);
    return { label: cap1(x.name) + (f && f.seen ? ": брак — " + FLAWS[f.k].n + ". Устранить: " + costText(FLAWS[f.k].fix) : x.tested ? ": испытано, брака нет" : ": не испытано"), keep: true, fn: function () { if (f && f.seen) fixFlaw(x); else testItem(x, o.k); } };
  });
  if (!items.length) items.push({ label: "Испытывать нечего: брак бывает только у собранного своими руками — оружия, брони, каркасов и своих конструкций.", info: true, keep: true, fn: function () {} });
  return items.concat([{ label: "Назад", close: true, fn: function () {} }]);
}
function studyMenu() {
  var build = function () {
    var items = studyList().map(function (o) {
      var key = studyKey(o.x, o.a), n = M().studied[key] || 0;
      return { label: cap1(o.x.name) + (n ? ": изучено " + n + " из " + studyNeed() : ""), keep: true, fn: function () { study(o.x, o.a); } };
    });
    if (!items.length) items.push({ label: "Изучать нечего: нужно найденное оружие или броня, чьё устройство ещё не изучено.", info: true, keep: true, fn: function () {} });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  menu("Изучение устройства", build(), { keep: true, rebuild: build, intro: "Без разбора: вещь остаётся у вас. Нужно экземпляров одного вида: " + studyNeed() + ". Изученный вид открывает свою схему, если она есть, копии по нему выходят лучше, а изученные находки дают узлы для своих конструкций." });
}
/* Строки в окно мастерской (workshop.rootItems). */
function benchItems(b, et) {
  var m = M(), items = [];
  items.push({ label: "Режим работы", kind: "choice", options: [{ v: 0, label: "обычная работа — сразу, как прежде" }, { v: 1, label: "тщательная работа — дольше и утомительнее, зато лучше и без спешки" }],
    get: function () { return M().mode || 0; }, set: function (v) { M().mode = v ? 1 : 0; snd("pwr_click", "ui_click"); } });
  items.push({ label: line(), fn: infoMenu });
  if (specFree() > 0) items.push({ label: "Выбрать специализацию мастера: доступно " + specFree(), fn: specMenu });
  if (et >= 2) {
    var nl = made().filter(function (o) { var f = flawOf(o.x); return (f && f.seen) || !o.x.tested; }).length;
    items.push({ label: "Испытать изделие или устранить брак" + (nl ? ": есть что проверить" : ""), fn: testMenu });
    var sl = studyList().length;
    items.push({ label: "Изучить устройство без разбора" + (sl ? ": можно изучить " + sl : ""), fn: studyMenu });
  }
  return items;
}

/* Окно персонажа. */
function charLine() { var t = total(); return t > 0 || M().spec.length ? line() : ""; }

LAB.mastery = {
  DIRS: DIRS, ORDER: ORDER, SPECS: SPECS, FLAWS: FLAWS, STEP_XP: STEP_XP, ALL_XP: ALL_XP,
  M: M, step: step, overall: overall, gain: gain, has: has, specFree: specFree, dirOf: dirOf, workCls: workCls,
  careful: careful, tired: tired, before: before, begin: begin, item: item, finish: finish, upQual: upQual, rollQual: rollQual, flawChance: flawChance, upChance: upChance,
  maybeFlaw: maybeFlaw, flawOf: flawOf, flawName: flawName, reveal: reveal, wearK: wearK, misfire: misfire, dmgK: dmgK, accK: accK, defK: defK,
  forecast: forecast, ev: ev, onKill: onKill, testItem: testItem, fixFlaw: fixFlaw, study: study, studyList: studyList, studyNeed: studyNeed,
  studiedKey: studiedKey, benchItems: benchItems, infoMenu: infoMenu, specMenu: specMenu, testMenu: testMenu, studyMenu: studyMenu,
  charLine: charLine, line: line, workSound: workSound, snd: snd, made: made
};
})();
