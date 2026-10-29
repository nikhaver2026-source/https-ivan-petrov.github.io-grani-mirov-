/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — генератор комплекса.
   Уровни по двадцать этажей. Каждый этаж строится из зерна игры заново и
   всегда одинаково: сетка 4×3 ячеек по 56×56 клеток (1.3: прежде 22 —
   коридоры удлинены, чтобы вдоль каждой стены уместилось по десять
   кабинетов, annex.js); в ячейке — помещение (3.6: от девяти до
   пятнадцати шагов в сторону, глубже — больше, SIZE), между соседними —
   прямой коридор шириной в четыре шага и длиной от тридцати. С одной стороны коридор
   открыт в помещение проходом в два шага, с другой — дверь с табличкой.
   Остов этажа — дерево помещений от точки прибытия; замки ставятся на
   рёбра дерева, ключ к замку всегда лежит до замка (в зоне, достижимой без
   него). Лифт этажа — в начальной зоне, поэтому приехавший на лифте никогда
   не заперт. Между уровнями — только гермошлюз вниз на последнем этаже
   уровня; за спиной он запечатывается. Тайная комната — с двумя выходами
   в разные коридоры.
   Без DOM — работает и в Node (проверки проходимости этажей).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

var COLS = 4, ROWS = 3, SLOT = 56, CW = 4;
var W = 1 + COLS * SLOT + 1, H = 1 + ROWS * SLOT + 1;
LAB.W = W; LAB.H = H; LAB.COLS = COLS; LAB.ROWS = ROWS; LAB.CORR_W = CW;
var T_WALL = 0, T_ROOM = 1, T_CORR = 2, T_DOOR = 3;
LAB.T = { WALL: T_WALL, ROOM: T_ROOM, CORR: T_CORR, DOOR: T_DOOR };

/* (3.2, просьба игрока) Чем ниже блок, тем просторнее — с третьего
   («Отражение», с 41-го уровня): помещения больше, коридоры шире (cw) с
   проходом в три шага, вещей обстановки больше (fx — сверх прежнего).
   (3.6, просьба автора: «помещения маленькие — прям расширь») Размеры —
   своя строка у каждого блока, и у верхних тоже (SIZE[1]): главные
   помещения (room — от и до, cap — предел для каждого третьего, sp — у
   прибытия, лифта и лестниц, sec — тайная комната, gate и reactor — зал
   шлюза и реактора), кабинеты у коридоров (aw — ширина вдоль коридора, ad —
   глубина, hall — ширина зала, hd — его глубина, avg — средняя ширина,
   по ней — сколько кабинетов у стены). Прежде главные помещения были от
   пяти до девяти шагов, кабинеты — от трёх на два до пяти на шесть. Сетка
   этажа та же. */
var SIZE = {
  1: { room: [9, 15], cap: 11, sp: [9, 12], sec: 7, gate: 12, reactor: 16, aw: [5, 8], ad: [5, 9], hall: [9, 12], hd: [8, 12], avg: 6.5 },
  3: { room: [11, 17], cap: 13, sp: [11, 14], sec: 8, gate: 13, reactor: 17, aw: [6, 9], ad: [6, 10], hall: [10, 13], hd: [9, 13], avg: 7.5 },
  4: { room: [12, 18], cap: 14, sp: [12, 15], sec: 9, gate: 14, reactor: 18, aw: [7, 10], ad: [7, 11], hall: [11, 14], hd: [10, 14], avg: 8.5 },
  5: { room: [13, 20], cap: 15, sp: [13, 16], sec: 9, gate: 15, reactor: 19, aw: [7, 11], ad: [8, 12], hall: [12, 15], hd: [11, 15], avg: 9 }
};
var GROW = {
  3: { cw: 5, fx: 1 },
  4: { cw: 6, fx: 2 },
  5: { cw: 7, fx: 3 }
};
(function () { for (var b in GROW) for (var k in SIZE[b]) GROW[b][k] = SIZE[b][k]; })();
LAB.floorGrow = function (L) { var b = LAB.blockOf ? LAB.blockOf(L) : 1; return b >= 3 ? GROW[Math.min(5, b)] : null; };
/* Размеры помещений блока (3.6): у первых двух блоков — SIZE[1], ниже — свои. */
LAB.roomSize = function (L) { var b = LAB.blockOf ? LAB.blockOf(L) : 1; return b >= 3 ? SIZE[Math.min(5, b)] : SIZE[1]; };
/* Ширина коридора: у каждого своя (cor.w); у этажей прежних блоков — четыре шага. */
LAB.corrW = function (c) { return (c && c.w) || CW; };

/* ── случайные числа с зерном ── */
function hash32(s) {
  var h = 2166136261 >>> 0;
  s = String(s);
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function Rng(seed, tag) {
  var f = mulberry32(hash32(seed + "|" + tag));
  var r = {
    next: f,
    int: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
    chance: function (p) { return f() < p; },
    pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
    shuffle: function (arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; },
    weighted: function (map) {
      var tot = 0, k;
      for (k in map) tot += map[k];
      var x = f() * tot;
      for (k in map) { x -= map[k]; if (x < 0) return k; }
      return k;
    }
  };
  return r;
}
LAB.Rng = Rng;
/* логические замки (1.6): виды задач — в puzzles.js */
var LOGIC_KINDS = ["breaker", "decon", "labels", "dosim", "shifts", "tally"];
LAB.LOGIC_KINDS = LOGIC_KINDS;
/* (2.0) К прежним логическим задачам — новые (puzzles2.js), у каждой три
   ступени: простая, средняя, сложная. Вид и ступень выбирает свой поток
   случайностей — остальное на этаже от них не меняется. Чем глубже, тем
   чаще средние и сложные; на первом уровне — почти всегда простые. */
/* (3.5) и задачи части третьей (puzzles3.js): пароли, архивы, взломы. Вид выбирается своим
   потоком случайностей (pz17) — этажи от этого не меняются */
function logicKinds() { return LOGIC_KINDS.concat(LAB.puzzles2 && LAB.puzzles2.kinds ? LAB.puzzles2.kinds : [], LAB.puzzles3 && LAB.puzzles3.kinds ? LAB.puzzles3.kinds : []); }
function stationKinds() { return ["sort", "relays", "bulls", "riddle"].concat(logicKinds(), ["chess"]); }
var CHEM_PZ = ["titr", "vials", "protocol", "spectr", "chain"]; /* (3.6) химические задачи (chempuz.js, KINDS) */
LAB.logicKinds = logicKinds;
function puzzleDiff(rz, L, F) {
  var x = rz.next(), d0 = LAB.depth(L, F);
  var pH = L === 1 ? 0 : Math.min(0.65, 0.05 + d0 * 0.0012);
  var pM = L === 1 ? Math.min(0.3, F * 0.015) : Math.min(0.5, 0.35 + d0 * 0.0006, 0.95 - pH);
  return x < pH ? 2 : x < pH + pM ? 1 : 0;
}
function pz17(o, seed, L, F, key, pool) {
  var rz = LAB.Rng(seed, "pz17:" + L + ":" + F + ":" + key);
  o.kind = rz.pick(pool);
  o.diff = puzzleDiff(rz, L, F);
}
LAB.puzzleDiff = puzzleDiff;
LAB.hash32 = hash32;

/* ── ячейки сетки ── */
function slotXY(s) { return { i: s % COLS, j: Math.floor(s / COLS) }; }
function slotDist(a, b) { var A = slotXY(a), B = slotXY(b); return Math.abs(A.i - B.i) + Math.abs(A.j - B.j); }
function slotNeighbors(s) {
  var p = slotXY(s), out = [];
  if (p.i > 0) out.push(s - 1);
  if (p.i < COLS - 1) out.push(s + 1);
  if (p.j > 0) out.push(s - COLS);
  if (p.j < ROWS - 1) out.push(s + COLS);
  return out;
}
LAB.slotNeighbors = slotNeighbors;

/* ── ПЛАН КОМПЛЕКСА: где лифты, шлюзы и лестничные клетки ── */
var planCache = {};
LAB.plan = function (seed) {
  var key = seed + "#" + LAB.LEVELS_N;
  if (planCache[key]) return planCache[key];
  var r = Rng(seed, "plan");
  var NL = LAB.LEVELS_N, NF = LAB.FLOORS_N;
  var E = [], G = [], P = [], blocked = [];
  var L, F;
  for (L = 1; L <= NL; L++) E[L] = r.int(0, COLS * ROWS - 1);
  var start = r.int(0, COLS * ROWS - 1);
  while (start === E[1]) start = r.int(0, COLS * ROWS - 1);
  for (L = 1; L <= NL; L++) {
    var g;
    do { g = r.int(0, COLS * ROWS - 1); } while (g === E[L] || (L < NL && g === E[L + 1]));
    G[L] = g; /* шлюз L→L+1 (на уровнях с пультом «Истока» — зал реактора) */
  }
  for (L = 1; L <= NL; L++) {
    P[L] = []; blocked[L] = [];
    for (F = 1; F < NF; F++) {
      var U = F === 1 ? (L === 1 ? start : G[L - 1]) : P[L][F - 1];
      var cand = [];
      for (var s = 0; s < COLS * ROWS; s++) {
        if (s === E[L] || s === U) continue;
        if (F === NF - 1 && s === G[L]) continue;
        /* у шлюза последнего этажа должен быть сосед для зала стража */
        if (F === NF - 1 && !slotNeighbors(G[L]).some(function (n) { return n !== s && n !== E[L]; })) continue;
        cand.push(s);
      }
      cand.sort(function (a, b) { return slotDist(b, U) - slotDist(a, U); });
      var top = cand.slice(0, Math.max(3, Math.ceil(cand.length / 2)));
      P[L][F] = r.pick(top);
      blocked[L][F] = F >= 3 && F <= NF - 2 && !blocked[L][F - 1] && r.chance(0.1);
    }
  }
  var plan = { E: E, G: G, P: P, blocked: blocked, start: start };
  planCache[key] = plan;
  return plan;
};

/* Ячейки входа (сверху), выхода (вниз) и лифта на этаже. */
LAB.floorSlots = function (seed, L, F) {
  var p = LAB.plan(seed), NF = LAB.FLOORS_N;
  var U = F === 1 ? (L === 1 ? p.start : p.G[L - 1]) : p.P[L][F - 1];
  var D = F === NF ? p.G[L] : p.P[L][F];
  return { U: U, D: D, E: p.E[L],
    upBlocked: F > 1 && !!p.blocked[L][F - 1],
    downBlocked: F < NF && !!p.blocked[L][F] };
};

/* ── ОРУЖИЕ ── */
var weaponSeq = 0;
/* Ступень оружия — число после модели в названии («Искра» Б-3): растёт с редкостью и глубиной. */
LAB.weaponMark = function (rank, lvl) { return 1 + (rank || 0) + Math.floor((lvl || 1) / 10); };
LAB.isBlaster = function (b) { return !!b && (b.cls === "blaster" || /бластер/.test(b.n || "")); };
/* (2.2, просьба игрока) Ёмкость — сколько выстрелов даёт одна батарея или
   заряд. Чем оружие лучше, тем больше: «Искра» — тридцать, у вида ёмкость
   растёт с силой выстрела (урон, очередь, свойства, дальность) и с глубиной,
   где он встречается; у экземпляра — ещё с каждой ступенью (плюс восемь
   процентов от ёмкости вида) и с качеством (плюс пять процентов за шаг).
   Так у всех бластеров, лучей и излучателей на батареях и зарядах;
   огнестрел на пулях, дроби, иглах и газе — как прежде: в двустволке два
   патрона. Прежде тяжёлое оружие делало два-восемь выстрелов, а лишь у
   бластеров было плюс восемь за ступень. */
var PHYS_AMMO = { none: 1, slug: 1, buckshot: 1, k_needle: 1, g_gascan: 1 };
/* (2.6) патроны, иглы и баллоны капсула не заряжает: только батареи и заряды */
LAB.physAmmo = function (a) { return !!PHYS_AMMO[a]; };
LAB.chargeGun = function (b) { return !!b && b.cap > 0 && (b.rng || 1) > 1 && !PHYS_AMMO[b.ammo]; };
function shotPower(b) {
  var k = 1 + (b.pierce ? 0.25 : 0) + (b.area ? 0.25 : 0) + (b.noarmor ? 0.3 : 0) + 0.1 * (b.chain || 0) + (b.freeze || b.slow || b.mark || b.stunMech || b.knock ? 0.1 : 0);
  return b.dmg * (b.burst || 1) * k * (1 + ((b.rng || 6) - 6) * 0.03);
}
var capMemo = {};
LAB.capBase = function (base) {
  var b = LAB.WEAPONS[base];
  if (!LAB.chargeGun(b)) return b ? b.cap || 0 : 0;
  if (capMemo[base] == null) capMemo[base] = Math.max(30, Math.round(30 * Math.pow(shotPower(b) / shotPower(LAB.WEAPONS.spark), 0.4) * (1 + ((LAB.WEAPON_DEPTH[base] || 1) - 1) / 300)));
  return capMemo[base];
};
LAB.weaponCap = function (base, rank, lvl, qual) {
  var b = LAB.WEAPONS[base];
  if (!b || !b.cap) return 0;
  if (!LAB.chargeGun(b)) return b.cap + ((rank || 0) >= 3 ? Math.ceil(b.cap * 0.25) : 0);
  var q = qual == null ? 1 : qual;
  return Math.round(LAB.capBase(base) * (1 + 0.08 * (LAB.weaponMark(rank, lvl) - 1)) * (1 + 0.05 * (q - 1)));
};
/* (3.7, просьба игрока) Предел ёмкости — свой у каждого вида. Ёмкость поднимает
   только верстак: расточка отсека, удлинённый магазин или баллон побольше —
   ступень за ступенью. UPG — доля прибавки к своей ёмкости оружия на последней
   ступени и число ступеней: «Искра» Б-1 — с тридцати до пятидесяти за четыре
   ступени; чем сложнее и тяжелее оружие, тем меньше запас, у позитронного —
   одна ступень на четверть. Двустволка, самострел и живое жало ёмкости не
   меняют. Ступень и качество оружия поднимают его ёмкость, а с ней и предел.
   Батареи и модули ёмкости ничего не прибавляют: батарея только заряжает. */
var UPG = {
  blaster: [2 / 3, 4], laser: [0.5, 3], ion: [0.5, 3], bio: [0.5, 3], nano: [0.5, 3], kinetic: [0.5, 2], melee: [0.5, 2],
  plasma: [0.4, 2], thermo: [0.4, 2], cryo: [0.4, 2], magnetron: [0.4, 2], sonic: [0.4, 2],
  gauss: [0.3, 2], phase: [0.3, 2], grav: [0.3, 2], positron: [0.25, 1]
};
var UPG_KIND = { g_twinbarrel: [0, 0], k_bonebow: [0, 0], k_sting: [0, 0], k_eeljar: [0, 0], k_lumen: [0, 0], k_amberwand: [0, 0], zaslon: [1 / 3, 2], k_alphamg: [0.5, 3] };
/* почему ёмкость не меняется — у тех, кому верстак не поможет */
var UPG_NO = { g_twinbarrel: "два ствола — два патрона", k_bonebow: "самострел заряжают по одной игле", k_sting: "живое жало: игл в нём столько, сколько выросло",
  k_eeljar: "живой угорь: разрядов в нём столько, сколько он накопит", k_lumen: "живой орган: его свет не прибавить", k_amberwand: "жезл из цельной смолы: отсека в нём не расточить" };
/* fam: bay — отсек батарей и ячеек, mag — магазин патронов, игл, капсул и картриджей, tank — газовый баллон */
var MAG_AMMO = { slug: 1, buckshot: 1, k_needle: 1, k_capsule: 1, m_nanocart: 1, g_seiscell: 1 };
LAB.capPlan = function (base) {
  var b = LAB.WEAPONS[base];
  if (!b || !b.cap || !b.ammo || b.ammo === "none") return null;
  var k = UPG_KIND[base] || (LAB.isBlaster(b) ? UPG.blaster : UPG[b.cls]) || [0.4, 2];
  return { u: k[0], steps: k[1], fam: b.ammo === "g_gascan" ? "tank" : MAG_AMMO[b.ammo] ? "mag" : "bay", why: UPG_NO[base] || "" };
};
/* ёмкость экземпляра на ступени n — от его собственной ёмкости cap0 (вид, ступень, качество) */
LAB.capAt = function (base, cap0, n) {
  var p = LAB.capPlan(base);
  if (!p || !p.steps || !cap0) return cap0 || 0;
  n = Math.max(0, Math.min(p.steps, n || 0));
  return Math.round(cap0 * (1 + p.u * n / p.steps));
};
/* Оружие из прежней записи — с ёмкостью по новому правилу: база
   пересчитывается, модули и расточка мастерской остаются, заряд — в той же
   доле (полный — полный). */
LAB.fixCap = function (w) {
  if (!w || w.capV === 2 || !LAB.WEAPONS[w.base]) return w;
  var was = w.cap || 0, full = was > 0 && w.charge >= was, nb = LAB.weaponCap(w.base, w.rank, w.lvl, w.qual);
  if (w.cap0 != null && LAB.workshop && LAB.workshop.recalc) { w.cap0 = nb; LAB.workshop.recalc(w); }
  else w.cap = nb;
  if (was > 0) w.charge = full ? w.cap : Math.min(w.cap, Math.round((w.charge || 0) * w.cap / was));
  w.capV = 2;
  return w;
};
LAB.makeWeapon = function (base, lvl, rank, qual, idHint) {
  var b = LAB.WEAPONS[base];
  var k = (1 + 0.14 * (lvl - 1)) * LAB.RANK_MULT[rank] * LAB.QUAL_MULT[qual], mark = LAB.weaponMark(rank, lvl);
  var w = {
    /* счётчик начинается заново при каждом запуске игры — без случайного хвоста стволы
       разных запусков получали одинаковые id, и окно ствола брало (и разбирало) чужой */
    id: idHint || ("w" + (++weaponSeq) + "_" + Math.floor(Math.random() * 1e6).toString(36) + "_" + base),
    base: base, g: b.g, rank: rank, qual: qual, lvl: lvl,
    dmg: Math.max(1, Math.round(b.dmg * k)),
    rng: b.rng, spread: b.spread, cap: LAB.weaponCap(base, rank, lvl, qual), capV: 2,
    cd: b.cd, ammo: b.ammo, dt: b.dt, mods: 0
  };
  w.charge = w.cap;
  w.name = LAB.QUAL[b.g][qual] + " " + b.n + (b.cls === "melee" && base !== "cutter" ? "" : " " + LAB.MODEL[base] + "-" + mark);
  return w;
};
/* (2.1) Пауза между выстрелами и ударами — из таблицы оружия, а не из
   записанного экземпляра: так новая скорость (монтировка — 0,3 с вместо 0,5)
   доходит и до оружия в прежних сохранениях. */
LAB.weaponCd = function (w) { var b = w && LAB.WEAPONS[w.base]; return (b && b.cd) || (w && w.cd) || 500; };
/* Что встречается на этой глубине: чаще — вещи своего блока. */
function recentPool(table, depthOf, L, skip) {
  var pool = [], recent = [], k;
  for (k in table) {
    if (skip && skip(k)) continue;
    var d = depthOf(k);
    if (d > L) continue;
    pool.push(k);
    if (d > L - 20 && (L > 10 || d > L - 6)) recent.push(k);
  }
  return { all: pool, recent: recent };
}
/* (2.0) Канал вещи: у оружия и гранат глубин (arsenal.js) путь один — src
   "craft" (только верстак), "find" (только находка), "buy" (только продажа);
   у вещи без src — любой. Добыча — канал "find", прилавок — "buy". */
LAB.srcOk = function (d, ch) { var s = d && d.src; return !(s === "craft" || s === "find" || s === "buy") || s === ch; };
LAB.genWeapon = function (r, L, F, opts) {
  opts = opts || {};
  var lvl = LAB.foeLevel(L, F), ch = opts.channel || "find";
  var P = recentPool(LAB.WEAPONS, function (k) { return LAB.WEAPON_DEPTH[k] || 99; }, L, function (k) { return k === "crowbar" || !LAB.srcOk(LAB.WEAPONS[k], ch); });
  var base = opts.base || (P.recent.length && r.chance(0.6) ? r.pick(P.recent) : r.pick(P.all));
  var roll = r.next() + Math.min(0.45, L * 0.025) + (opts.bonus || 0);
  var rank = roll < 0.5 ? 0 : roll < 0.76 ? 1 : roll < 0.9 ? 2 : roll < 0.97 ? 3 : roll < 0.995 ? 4 : 5;
  var q = r.next() + Math.min(0.4, L * 0.02) + (opts.bonus || 0) * 0.5;
  var qual = q < 0.2 ? 0 : q < 0.55 ? 1 : q < 0.8 ? 2 : q < 0.93 ? 3 : q < 0.99 ? 4 : 5;
  if (opts.minRank && rank < opts.minRank) rank = opts.minRank;
  return LAB.makeWeapon(base, lvl, Math.min(5, rank), Math.min(5, qual), opts.id);
};

/* ── ЭТАЖ ── */
var floorCache = {};
var cacheOrder = [];
/* (2.0) Твари и машины — на каждом уровне, и чем глубже, тем разнообразнее.
   В списках части уровней одни машины (блоки, где машины взяли верх): туда
   добавляются твари своего семейства (та же приставка имени, что у машин
   уровня), а нет своих — уже встречавшиеся выше. Всем уровням добавляются
   виды прежних глубин: старые модели и твари никуда не делись, список
   растёт с глубиной. Один раз, когда все блоки уже подключены. */
LAB.enrichLevelFoes = function () {
  var N = LAB.LEVELS_N || 0, F0 = LAB.FOES;
  if (LAB._foesRich || !N || !F0) return;
  LAB._foesRich = true;
  var usable = function (id) { var b = F0[id]; return !!b && !b.boss && !(b.beh || []).some(function (k) { return k === "turret" || k === "camera" || k === "stationary"; }); };
  var prefix = function (id) { var m = /^([a-z])_/.exec(id); return m ? m[1] : ""; };
  var fam = {};
  Object.keys(F0).forEach(function (id) { if (F0[id].kind !== "mech" && usable(id)) (fam[prefix(id)] = fam[prefix(id)] || []).push(id); });
  var seenBio = [], seenMech = [];
  for (var L = 1; L <= N; L++) {
    var lev = LAB.LEVELS[L];
    if (!lev || !lev.foes) continue;
    var list = lev.foes.slice(), nBio = list.filter(function (id) { return F0[id] && F0[id].kind !== "mech"; }).length;
    var wantBio = Math.min(6, 2 + Math.ceil(L / 20)), px = "";
    list.forEach(function (id) { if (!px && prefix(id)) px = prefix(id); });
    var cand = (fam[px] || []).concat(seenBio.slice().reverse());
    for (var i = 0; i < cand.length && nBio < wantBio; i++) if (list.indexOf(cand[i]) < 0) { list.push(cand[i]); nBio++; }
    var want = Math.min(16, 6 + Math.ceil(L / 8)), older = seenMech.slice().reverse().concat(seenBio.slice().reverse());
    for (var j = 0; j < older.length && list.length < want; j++) if (list.indexOf(older[j]) < 0) list.push(older[j]);
    /* мутанты — на каждом уровне: где живут одни аномалии («Отражение», «Исток»),
       добираются твари, встреченные выше (самые глубокие — первыми) */
    var flesh = list.filter(function (id) { return F0[id] && F0[id].kind === "bio"; }).length;
    for (var b = seenBio.length - 1; b >= 0 && flesh < 2; b--) if (F0[seenBio[b]].kind === "bio" && list.indexOf(seenBio[b]) < 0) { list.push(seenBio[b]); flesh++; }
    lev.foes = list;
    list.forEach(function (id) {
      if (!usable(id)) return;
      if (F0[id].kind === "mech") { if (seenMech.indexOf(id) < 0) seenMech.push(id); }
      else if (seenBio.indexOf(id) < 0) seenBio.push(id);
    });
  }
};
LAB.getFloor = function (seed, L, F) {
  LAB.enrichLevelFoes();
  var key = seed + ":" + L + ":" + F;
  if (floorCache[key]) return floorCache[key];
  var fl = null;
  for (var attempt = 0; attempt < 60 && !fl; attempt++) fl = genFloor(seed, L, F, attempt);
  if (!fl) throw new Error("этаж не построился: " + key);
  floorCache[key] = fl;
  cacheOrder.push(key);
  /* облегчённый режим — в памяти меньше готовых этажей: недавние строятся заново за доли секунды */
  var keepN = LAB.settings && LAB.settings.lite ? 4 : 16;
  while (cacheOrder.length > keepN) delete floorCache[cacheOrder.shift()];
  return fl;
};
LAB.clearFloorCache = function () { floorCache = {}; cacheOrder = []; };

function idx(x, y) { return y * W + x; }
LAB.idx = idx;

/* Помещение в ячейке: всегда накрывает две средние клетки ячейки по обеим
   осям — так у соседей всегда есть общая полоса для прямого коридора; и
   стоит почти посередине (сдвиг на клетку), чтобы коридоры между
   соседями выходили длинными — от сорока двух шагов. */
function placeRoom(r, s, w, h) {
  var p = slotXY(s), sx = 1 + p.i * SLOT, sy = 1 + p.j * SLOT, mid = SLOT >> 1;
  var cx = sx + mid - (w >> 1), cy = sy + mid - (h >> 1);
  var x0 = r.int(Math.max(sx + mid - w + 1, cx - 1), Math.min(sx + mid - 1, cx + 1));
  var y0 = r.int(Math.max(sy + mid - h + 1, cy - 1), Math.min(sy + mid - 1, cy + 1));
  return { x0: x0, y0: y0, x1: x0 + w - 1, y1: y0 + h - 1 };
}

/* Каких врагов где брать: по поведению. */
function foesWith(list, beh) { return list.filter(function (f) { var d = LAB.FOES[f]; return d && d.beh.indexOf(beh) >= 0; }); }
function turretPool(lev, d0) {
  var own = foesWith(lev.foes, "turret");
  if (own.length) return own;
  return d0 >= 140 ? ["hturret", "pturret"] : d0 >= 80 ? ["pturret", "turret"] : ["turret"];
}

function genFloor(seed, L, F, attempt) {
  var r = Rng(seed, "floor:" + L + ":" + F + ":" + attempt), rMain = r;
  var NF = LAB.FLOORS_N, lev = LAB.LEVELS[L];
  var sl = LAB.floorSlots(seed, L, F);
  var U = sl.U, D = sl.D, E = sl.E;
  var NS = COLS * ROWS, s, i;
  var d0 = LAB.depth(L, F);
  var reactor = F === NF && LAB.isReactorLevel(L);

  /* 1. Какие ячейки заняты помещениями. */
  var active = [];
  for (s = 0; s < NS; s++) active[s] = true;
  var holes = r.int(0, 2);
  for (i = 0; i < holes; i++) {
    var h = r.int(0, NS - 1);
    if (h === U || h === D || h === E) continue;
    active[h] = false;
    if (!connectedActive(active)) active[h] = true;
  }
  /* 2. Тайная комната: лист с двумя соседями, она вне остова этажа. */
  var secret = -1;
  if (attempt < 40 && r.chance(0.6)) {
    var sc = [];
    for (s = 0; s < NS; s++) {
      if (!active[s] || s === U || s === D || s === E) continue;
      var test = active.slice(); test[s] = false;
      if (!connectedActive(test)) continue;
      var nb = slotNeighbors(s).filter(function (n) { return active[n] && n !== D; });
      if (nb.length >= 2) sc.push(s);
    }
    if (sc.length) secret = r.pick(sc);
  }
  var main = [];
  for (s = 0; s < NS; s++) main[s] = active[s] && s !== secret;
  if (!connectedActive(main)) return null;

  /* 3. Остовное дерево от точки прибытия U (случайный поиск в глубину). */
  var parent = [], seen = [], order = [];
  for (s = 0; s < NS; s++) { parent[s] = -1; seen[s] = false; }
  /* на последнем этаже шлюз (D) — лист дерева: за ним ничего нет */
  var leafD = F === NF;
  if (leafD) seen[D] = true;
  (function dfs(u) {
    seen[u] = true; order.push(u);
    var nb = r.shuffle(slotNeighbors(u).filter(function (n) { return main[n] && !seen[n]; }));
    for (var k = 0; k < nb.length; k++) {
      if (seen[nb[k]]) continue;
      parent[nb[k]] = u; dfs(nb[k]);
    }
  })(U);
  if (leafD) {
    var dp = slotNeighbors(D).filter(function (n) { return main[n] && n !== U && n !== E && n !== D; });
    if (!dp.length) return null;
    parent[D] = r.pick(dp);
  }
  for (s = 0; s < NS; s++) if (main[s] && !seen[s]) return null;
  function isAncestor(a, b) { /* a — предок b или сам b */
    for (var x = b; x !== -1; x = parent[x]) if (x === a) return true;
    return false;
  }
  function pathTo(b) { var p = []; for (var x = b; x !== -1; x = parent[x]) p.unshift(x); return p; }
  var pathD = pathTo(D);

  /* 4. Замки на рёбрах дерева (ребро = ребёнок c и его родитель). */
  var tierFloor = F === 1 && (L === 1 || LAB.LEVELS[L - 1].tier < lev.tier);
  var Lb = ((L - 1) % 20) + 1; /* уровень внутри блока */
  var nLocks = 1 + Math.floor((Math.min(L, 10 + Lb) - 1) / 3) + (r.chance(0.5) ? 1 : 0);
  if (nLocks > 5) nLocks = 5;
  if (F === 1) nLocks = Math.max(1, nLocks - 1);
  if (L === 1 && F === 1) nLocks = 1;
  var candEdges = [];
  for (s = 0; s < NS; s++) {
    if (!main[s] || parent[s] === -1) continue;
    if (isAncestor(s, E)) continue;       /* лифт остаётся в начальной зоне */
    candEdges.push(s);
  }
  var locks = {};   /* ребёнок → описание замка */
  var lockList = [];
  if (F === NF) {
    /* шлюз — за залом стража; зал стража — не прибытие и не лифтовой холл */
    if (isAncestor(D, E) || parent[D] === U || parent[D] === E || parent[D] === -1) return null;
    locks[D] = { type: "gate" };
    lockList.push(D);
  }
  var onPath = candEdges.filter(function (c) { return pathD.indexOf(c) >= 0 && !locks[c]; });
  var offPath = candEdges.filter(function (c) { return pathD.indexOf(c) < 0 && !locks[c]; });
  r.shuffle(onPath); r.shuffle(offPath);
  var want = nLocks;
  var usedPower = false, usedRubble = false;
  if (tierFloor && !onPath.length) return null;
  if (tierFloor) {
    var tc = onPath.shift();
    locks[tc] = { type: "card", tier: lev.tier, tierFloor: true };
    lockList.push(tc); want--;
  }
  while (want > 0 && (onPath.length || offPath.length)) {
    var c = (onPath.length && (r.chance(0.6) || !offPath.length)) ? onPath.shift() : offPath.shift();
    var wts = L === 1 ? { card: 35, key: 30, code: 25, lockdown: 10 }
      : L === 2 ? { card: 30, key: 25, code: 25, lockdown: 10, power: 10, riddle: 8, logic: 7 }
      : { card: 25, key: 20, code: 20, lockdown: 10, power: 15, rubble: 10, riddle: 9, circuit: 10, logic: 10 };
    if (L >= 4) wts.melody = 9;
    if (usedPower) delete wts.power;
    if (usedRubble) delete wts.rubble;
    var tp = r.weighted(wts);
    var lk = { type: tp };
    if (tp === "card") lk.tier = Math.max(1, lev.tier - (lev.tier > 1 && r.chance(0.3) && !tierFloor ? 1 : 0));
    if (tp === "card" && tierFloor) lk.tier = lev.tier;
    if (tp === "power") usedPower = true;
    if (tp === "rubble") usedRubble = true;
    locks[c] = lk; lockList.push(c); want--;
  }

  /* Зоны: номер ближайшего замка выше по дереву (−1 — начальная зона). */
  var zone = [];
  for (s = 0; s < NS; s++) {
    zone[s] = -2;
    if (!main[s]) continue;
    var z = -1;
    for (var x = s; x !== -1; x = parent[x]) if (locks[x]) { z = x; break; }
    zone[s] = z;
  }
  /* Где можно положить вещь для замка на ребре lockChild: всё, куда дойти,
     не открывая этот замок и замки, кроме предков lockChild. */
  function keySpots(lockChild) {
    var p = parent[lockChild], out = [];
    for (var n = 0; n < NS; n++) {
      if (!main[n]) continue;
      var ok = true;
      for (var y = n; y !== -1; y = parent[y]) {
        if (locks[y] && !isAncestor(y, p)) { ok = false; break; }
      }
      if (ok) out.push(n);
    }
    return out;
  }

  /* 5. Петли: лишние коридоры только внутри одной зоны. */
  var edges = [];  /* {a, b, child — помещение, в стене которого дверь, tree} */
  for (s = 0; s < NS; s++) if (main[s] && parent[s] !== -1) edges.push({ a: parent[s], b: s, child: s, tree: true });
  for (s = 0; s < NS; s++) {
    if (!main[s]) continue;
    slotNeighbors(s).forEach(function (n) {
      if (n < s || !main[n]) return;
      if (parent[n] === s || parent[s] === n) return;
      if (zone[n] !== zone[s]) return;
      if (r.chance(0.3)) edges.push({ a: s, b: n, child: r.chance(0.5) ? n : s, tree: false });
    });
  }
  /* (3.0) Сколько помещений пройти по коридорам этажа от помещения a (тайные ходы не в счёт). */
  var hopsMemo = {};
  function hopsFrom(a) {
    if (hopsMemo[a]) return hopsMemo[a];
    var dist = [], q = [a], k;
    for (k = 0; k < NS; k++) dist[k] = -1;
    dist[a] = 0;
    while (q.length) {
      var u = q.shift();
      for (k = 0; k < edges.length; k++) {
        var e0 = edges[k], v = e0.secret ? -1 : e0.a === u ? e0.b : e0.b === u ? e0.a : -1;
        if (v >= 0 && dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }
      }
    }
    return (hopsMemo[a] = dist);
  }
  /* (3.0, просьба автора) Записки с кодами и всё, что нужно для замков, — не рядом с замком
     и не в одном помещении друг с другом: из дальней половины доступных помещений. Пусть
     игрок обходит комплекс, а не находит всё за порогом. */
  var reqAt = {};
  function farSpot(pool, from) {
    var dist = hopsFrom(from);
    var c = pool.filter(function (n) { return n !== from && !reqAt[n]; });
    if (!c.length) c = pool.filter(function (n) { return n !== from; });
    if (!c.length) c = pool.slice();
    c.sort(function (a, b) { return dist[b] - dist[a] || a - b; });
    var n = r.pick(c.slice(0, Math.max(1, Math.ceil(c.length / 2))));
    reqAt[n] = 1;
    return n;
  }
  /* (3.0) Пароль компьютера — рядом: в соседнем по коридору помещении (а нет такого — в том же). */
  function nearSpot(pool, from) {
    var dist = hopsFrom(from), c = pool.filter(function (n) { return dist[n] === 1; });
    return c.length ? r.pick(c) : from;
  }
  /* Тайная комната: потайная дверь в стене одного помещения, коридор к
     тайнику и второй коридор — к другому помещению той же зоны; со стороны
     этого помещения дверь тоже потайная, а изнутри коридора её видно. */
  if (secret >= 0) {
    var snb = r.shuffle(slotNeighbors(secret).filter(function (n) { return main[n] && n !== D; }));
    var pairA = -1, pairB = -1;
    for (var sa = 0; sa < snb.length && pairA < 0; sa++)
      for (var sb = 0; sb < snb.length; sb++)
        if (sa !== sb && zone[snb[sa]] === zone[snb[sb]]) { pairA = snb[sa]; pairB = snb[sb]; break; }
    if (pairA < 0) return null;
    edges.push({ a: pairA, b: secret, child: pairA, tree: false, secret: true });
    edges.push({ a: secret, b: pairB, child: pairB, tree: false, secret: true, inner: true });
  }

  /* 6. Геометрия: помещения в ячейках. */
  var t = new Uint8Array(W * H), room = new Int16Array(W * H), corrAt = new Int16Array(W * H); /* помещений с кабинетами — сотни: номер не влезает в байт */
  for (i = 0; i < W * H; i++) { room[i] = -1; corrAt[i] = -1; }
  var rooms = [];
  var bossSlot = F === NF ? parent[D] : -1;
  var gw = LAB.floorGrow(L); /* (3.2) с третьего блока — просторнее */
  var sz = LAB.roomSize(L); /* (3.6) размеры помещений блока — SIZE */
  for (s = 0; s < NS; s++) {
    if (!active[s]) continue;
    var special = s === U || s === D || s === E;
    var w = r.int(sz.room[0], sz.room[1]), hh = r.int(sz.room[0], sz.room[1]);
    if (r.chance(0.35)) { w = Math.min(w, sz.cap); hh = Math.min(hh, sz.cap); }
    if (special) { w = Math.max(sz.sp[0], Math.min(sz.sp[1], w)); hh = Math.max(sz.sp[0], Math.min(sz.sp[1], hh)); }
    if (s === secret) { w = sz.sec; hh = sz.sec; }
    if (s === bossSlot) { w = sz.room[1] - 1 + r.int(0, 1); hh = sz.room[1] - 1 + r.int(0, 1); }
    if (F === NF && s === D) { w = reactor ? sz.reactor : sz.gate; hh = w; }
    var pr = placeRoom(r, s, w, hh);
    var rm = { id: s, x0: pr.x0, y0: pr.y0, x1: pr.x1, y1: pr.y1, zone: zone[s], doors: [], mouths: [] };
    rm.cx = Math.floor((rm.x0 + rm.x1) / 2); rm.cy = Math.floor((rm.y0 + rm.y1) / 2);
    rooms[s] = rm;
    for (var yy = rm.y0; yy <= rm.y1; yy++) for (var xx = rm.x0; xx <= rm.x1; xx++) { t[idx(xx, yy)] = T_ROOM; room[idx(xx, yy)] = s; }
  }

  /* 7. Коридоры: прямая полоса в четыре шага между стенами соседних
     помещений; у помещения-ребёнка — дверь в одну клетку, у другого —
     открытый проход в две клетки. (3.2) С третьего блока коридор шире
     (gw.cw), а проход — в три клетки, посередине полосы. */
  var doors = [], doorAt = {}, corrs = [];
  for (var ei = 0; ei < edges.length; ei++) {
    var e = edges[ei];
    var A = rooms[e.a], B = rooms[e.b];
    var pa = slotXY(e.a), pb = slotXY(e.b);
    var horiz = pa.j === pb.j;
    var lo = horiz ? (pa.i < pb.i ? A : B) : (pa.j < pb.j ? A : B);   /* левое или верхнее */
    var hi = lo === A ? B : A;
    var i0 = horiz ? Math.max(lo.y0, hi.y0) : Math.max(lo.x0, hi.x0);
    var i1 = horiz ? Math.min(lo.y1, hi.y1) : Math.min(lo.x1, hi.x1);
    if (i1 - i0 < 1) return null;
    /* ширина полосы bw, проход mw клеток со сдвигом mo от края полосы: проход
       и дверь — в общем для обоих помещений отрезке i0..i1 */
    var bw = gw ? gw.cw : CW, mw = gw && i1 - i0 >= 2 ? 3 : 2, mo = (bw - mw) >> 1;
    var b0 = r.int(i0 - mo, i1 - mo - mw + 1); /* первая клетка полосы поперёк */
    var a0 = horiz ? lo.x1 + 2 : lo.y1 + 2;     /* первая клетка полосы вдоль */
    var a1 = horiz ? hi.x0 - 2 : hi.y0 - 2;
    if (a1 - a0 + 1 < 10) return null;
    var cor = { id: ei, a: e.a, b: e.b, axis: horiz ? "h" : "v", len: a1 - a0 + 1, door: null, mouth: [] };
    if (gw) cor.w = bw;
    cor.x0 = horiz ? a0 : b0; cor.x1 = horiz ? a1 : b0 + bw - 1;
    cor.y0 = horiz ? b0 : a0; cor.y1 = horiz ? b0 + bw - 1 : a1;
    for (var ya = cor.y0; ya <= cor.y1; ya++) for (var xa = cor.x0; xa <= cor.x1; xa++) {
      var ii = idx(xa, ya);
      if (t[ii] !== T_WALL) return null; /* пересечение — строим заново */
      t[ii] = T_CORR; corrAt[ii] = ei;
    }
    /* концы: стена помещения lo — на a0 − 1, стена hi — на a1 + 1 */
    var childLo = rooms[e.child] === lo;
    var dAlong = childLo ? a0 - 1 : a1 + 1, mAlong = childLo ? a1 + 1 : a0 - 1;
    var dAcross = gw ? b0 + mo + r.int(0, mw - 1) : b0 + 1 + (r.chance(0.5) ? 1 : 0);
    var dx = horiz ? dAlong : dAcross, dy = horiz ? dAcross : dAlong;
    for (var mk = 0; mk < mw; mk++) {
      var mx = horiz ? mAlong : b0 + mo + mk, my = horiz ? b0 + mo + mk : mAlong;
      if (t[idx(mx, my)] !== T_WALL) return null;
      t[idx(mx, my)] = T_CORR; corrAt[idx(mx, my)] = ei;
      cor.mouth.push([mx, my]);
    }
    var mouthRoom = e.child === e.a ? e.b : e.a;
    rooms[mouthRoom].mouths.push(ei);
    cor.mouthRoom = mouthRoom; cor.doorRoom = e.child;
    var dRoom = rooms[e.child];
    var dirFromRoom = dx > dRoom.x1 ? "E" : dx < dRoom.x0 ? "W" : dy > dRoom.y1 ? "S" : "N";
    var lk2 = e.tree ? locks[e.child] : null;
    var door = {
      id: "d" + doors.length, x: dx, y: dy, a: e.a, b: e.b, room: e.child, side: dirFromRoom,
      other: mouthRoom, corr: ei,
      kind: e.secret ? "secret" : lk2 && (lk2.type === "gate" || lk2.type === "power") ? "heavy" : (r.chance(0.8) ? "auto" : "hatch"),
      lock: e.secret ? { type: "secret", inner: !!e.inner } : (lk2 ? JSON.parse(JSON.stringify(lk2)) : null),
      tree: e.tree, lockChild: e.tree && lk2 ? e.child : -1
    };
    if (t[idx(dx, dy)] !== T_WALL) return null;
    t[idx(dx, dy)] = T_DOOR; corrAt[idx(dx, dy)] = ei;
    doors.push(door);
    doorAt[idx(dx, dy)] = door;
    cor.door = door.id;
    corrs.push(cor);
    rooms[e.a].doors.push(door.id); rooms[e.b].doors.push(door.id);
  }
  /* Проверка: без дверей каждая связная часть содержит ровно одно помещение. */
  if (!checkSeparation(t, room)) return null;

  /* 8. Типы помещений. */
  var names = r.shuffle(lev.rooms.slice());
  var ni = 0;
  for (s = 0; s < NS; s++) {
    var rmm = rooms[s];
    if (!rmm) continue;
    var type;
    if (s === secret) type = "secret";
    else if (s === U) type = (L === 1 && F === 1) ? "wake" : (F === 1 ? "gatein" : "stair");
    else if (s === D) type = F === NF ? (reactor ? "reactor" : "gate") : "stair";
    else if (s === E) type = "lift";
    else { type = names[ni % names.length]; ni++; }
    rmm.type = type;
    rmm.name = LAB.ROOMS[type].n;
    rmm.surf = lev.surf; /* у каждого уровня свой пол */
  }
  /* (2.0) Мастерская — на первом этаже уровня и на каждом третьем: ближайшее
     к прибытию помещение начальной зоны, без замков на пути и на дверях
     (ремонтный бокс, сборочный цех или склад по соседству — охотнее). */
  var shopRoom = LAB.shopFloor(F) ? pickShopRoom() : -1;
  if (shopRoom >= 0) { rooms[shopRoom].type = "workshop"; rooms[shopRoom].name = LAB.ROOMS.workshop.n; rooms[shopRoom].shop = true; }
  else if (LAB.shopFloor(F)) {
    /* в начальной зоне свободных помещений нет (дальше всё под замками) —
       мастерская при лифтовом холле, а нет его — в помещении прибытия */
    shopRoom = E >= 0 && rooms[E] ? E : U;
    rooms[shopRoom].shop = true; rooms[shopRoom].name += " с мастерской";
  }
  function pickShopRoom() {
    var ur = rooms[U];
    if (!ur) return -1;
    var dist = new Int32Array(W * H).fill(-1), q = [idx(ur.cx, ur.cy)], qi = 0, v4 = [1, 0, -1, 0, 0, 1, 0, -1];
    dist[q[0]] = 0;
    while (qi < q.length) {
      var c = q[qi++], cx = c % W, cy = (c / W) | 0;
      for (var k = 0; k < 8; k += 2) {
        var nx = cx + v4[k], ny = cy + v4[k + 1];
        if (!LAB.inb(nx, ny)) continue;
        var j = idx(nx, ny);
        if (dist[j] >= 0 || t[j] === T_WALL) continue;
        if (t[j] === T_DOOR && (!doorAt[j] || doorAt[j].lock)) continue;
        dist[j] = dist[c] + 1; q.push(j);
      }
    }
    var best = -1, bestSc = 1e9, near = { repair: 1, assembly: 1, parts: 1, storage: 1 };
    for (var s7 = 0; s7 < NS; s7++) {
      var rm7 = rooms[s7];
      if (!rm7 || !main[s7] || s7 === U || s7 === D || s7 === E || s7 === secret || zone[s7] !== -1) continue;
      if (LAB.ROOMS[rm7.type] && LAB.ROOMS[rm7.type].special) continue;
      /* путь от прибытия — без замков (запертые двери дальше, вглубь, не мешают) */
      var d0s = dist[idx(rm7.cx, rm7.cy)];
      if (d0s < 0) continue;
      var area = (rm7.x1 - rm7.x0 + 1) * (rm7.y1 - rm7.y0 + 1);
      var sc = d0s - (near[rm7.type] ? 30 : 0) + (area < 16 ? 40 : 0);
      if (sc < bestSc) { bestSc = sc; best = s7; }
    }
    return best;
  }
  /* Таблички на дверях: номер помещения на этаже и название; у некоторых —
     ещё строка («Идёт испытание», «Посторонним вход воспрещён»). */
  var rn = 0;
  for (s = 0; s < NS; s++) {
    var rq = rooms[s];
    if (!rq) continue;
    if (rq.type === "secret") { rq.sign = ""; continue; }
    var rdef = LAB.ROOMS[rq.type];
    rn++;
    rq.num = rn;
    rq.sign = (rdef.special ? "" : "Помещение " + rn + ". ") + rq.name + (rdef.sign ? ". " + (typeof rdef.sign === "string" ? rdef.sign : r.pick(rdef.sign)) : "");
  }

  var fl = {
    seed: seed, L: L, F: F, W: W, H: H, t: t, room: room, rooms: rooms, doors: doors, doorAt: doorAt, corrs: corrs, corrAt: corrAt,
    objs: [], objAt: {}, items: [], foes: [], npcs: [], notes: [],
    U: U, D: D, E: E, secret: secret, boss: bossSlot, zone: zone, parent: parent,
    upBlocked: sl.upBlocked, downBlocked: sl.downBlocked, locks: locks, lockList: lockList,
    needPower: usedPower, needRubble: usedRubble
  };
  /* Мебель (терминалы, установки, ящики, лифт, лестницы) и выжившие — непроходимы:
     к ним подходят вплотную. Комната обязана остаться связной: все входы и
     все свободные клетки достижимы в обход мебели. */
  var objCell = {}, itemCell = {};
  function roomOk(s2) {
    var rm2 = rooms[s2], start = -1, total = 0, free = {}, x, y;
    for (y = rm2.y0; y <= rm2.y1; y++) for (x = rm2.x0; x <= rm2.x1; x++) {
      var i = idx(x, y);
      if (objCell[i]) {
        /* клетка у входа в комнату не может быть занята */
        var nb0 = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for (var k0 = 0; k0 < 4; k0++) {
          var tt0 = t[idx(nb0[k0][0], nb0[k0][1])];
          if (tt0 === T_CORR || tt0 === T_DOOR) return false;
        }
        continue;
      }
      free[i] = 1; total++; if (start < 0) start = i;
    }
    if (start < 0) return false;
    /* к каждой вещи обстановки можно подойти: рядом есть свободная клетка комнаты */
    for (y = rm2.y0; y <= rm2.y1; y++) for (x = rm2.x0; x <= rm2.x1; x++) {
      if (!objCell[idx(x, y)]) continue;
      if (!(free[idx(x + 1, y)] || free[idx(x - 1, y)] || free[idx(x, y + 1)] || free[idx(x, y - 1)])) return false;
    }
    var seen2 = {}, st = [start], cnt = 0;
    seen2[start] = 1;
    while (st.length) {
      var u = st.pop(); cnt++;
      var ux = u % W, uy = (u / W) | 0;
      var nb = [idx(ux + 1, uy), idx(ux - 1, uy), idx(ux, uy + 1), idx(ux, uy - 1)];
      for (var k = 0; k < 4; k++) if (free[nb[k]] && !seen2[nb[k]]) { seen2[nb[k]] = 1; st.push(nb[k]); }
    }
    return cnt === total;
  }
  function freeCell(s2) {
    var rm2 = rooms[s2], cand2 = [];
    for (var y3 = rm2.y0; y3 <= rm2.y1; y3++) for (var x3 = rm2.x0; x3 <= rm2.x1; x3++) {
      var k3 = idx(x3, y3);
      if (objCell[k3] || itemCell[k3]) continue;
      cand2.push([x3, y3]);
    }
    r.shuffle(cand2);
    for (var c = 0; c < cand2.length && c < 40; c++) {
      var kk = idx(cand2[c][0], cand2[c][1]);
      objCell[kk] = 1;
      var ok = roomOk(s2);
      objCell[kk] = 0;
      if (ok) return cand2[c];
    }
    return null;
  }
  var objSeq = 0;
  function addObj(type, s2, extra, cell) {
    var c3 = null;
    if (cell) {
      var kc = idx(cell[0], cell[1]);
      if (!objCell[kc] && !itemCell[kc]) { objCell[kc] = 1; if (roomOk(s2)) c3 = cell; objCell[kc] = 0; }
    }
    if (!c3) c3 = freeCell(s2);
    if (!c3) return null;
    var o = { id: "o" + (objSeq++), type: type, x: c3[0], y: c3[1], room: s2 };
    if (extra) for (var k4 in extra) o[k4] = extra[k4];
    objCell[idx(o.x, o.y)] = 1;
    fl.objs.push(o); fl.objAt[idx(o.x, o.y)] = o;
    return o;
  }
  /* (2.6) Переставить предмет обстановки или жителя в другое помещение:
     на свободную клетку, не загородив проходы (medic.js — в помещении с
     капсулой остаются только аптечные автоматы). */
  function moveTo(t, s2, npc) {
    var k0 = idx(t.x, t.y);
    objCell[k0] = 0;
    var c5 = freeCell(s2);
    if (!c5) { objCell[k0] = 1; return false; }
    if (!npc && fl.objAt[k0] === t) delete fl.objAt[k0];
    t.x = c5[0]; t.y = c5[1]; t.room = s2; objCell[idx(t.x, t.y)] = 1;
    if (!npc) fl.objAt[idx(t.x, t.y)] = t;
    return true;
  }
  var itemSeq = 0;
  function addItem(it, s2, cell) {
    var c4 = cell || pickItemCell(s2);
    if (!c4) return null;
    it.id = "i" + (itemSeq++); it.x = c4[0]; it.y = c4[1];
    itemCell[idx(c4[0], c4[1])] = 1;
    fl.items.push(it);
    return it;
  }
  function pickItemCell(s2) {
    var rm3 = rooms[s2], cand3 = [];
    for (var y4 = rm3.y0; y4 <= rm3.y1; y4++) for (var x4 = rm3.x0; x4 <= rm3.x1; x4++) if (!objCell[idx(x4, y4)]) cand3.push([x4, y4]);
    return cand3.length ? r.pick(cand3) : null;
  }
  /* свободная клетка для живого: не мебель, не враг */
  function standCell(s2) {
    var rm5 = rooms[s2], cand5 = [];
    for (var y5 = rm5.y0; y5 <= rm5.y1; y5++) for (var x5 = rm5.x0; x5 <= rm5.x1; x5++) {
      if (objCell[idx(x5, y5)] || itemCell[idx(x5, y5)]) continue;
      if (fl.foes.some(function (q) { return q.x === x5 && q.y === y5; })) continue;
      cand5.push([x5, y5]);
    }
    return cand5.length ? r.pick(cand5) : null;
  }
  function cellFree(x, y) {
    var k = idx(x, y);
    if (t[k] === T_WALL || t[k] === T_DOOR || objCell[k] || itemCell[k]) return false;
    return !fl.foes.some(function (q) { return q.x === x && q.y === y; });
  }
  var foeSeq = 0;

  /* 9. Особые предметы обстановки. */
  var ur = rooms[U], dr = rooms[D], er = rooms[E], okS;
  if (L === 1 && F === 1) okS = addObj("wake", U, null, [ur.cx, ur.cy]);
  else if (F === 1) okS = addObj("gate_sealed", U, null, [ur.cx, ur.cy]);
  else okS = addObj("stairs_up", U, { to: { L: L, F: F - 1 }, blocked: sl.upBlocked }, [ur.cx, ur.cy]);
  if (!okS) return null;
  if (reactor) okS = addObj("reactor", D, { final: LAB.isFinalLevel(L) }, [dr.cx, dr.cy]);
  else if (F === NF) okS = addObj("gate_down", D, { to: { L: L + 1, F: 1 } }, [dr.cx, dr.cy]);
  else okS = addObj("stairs_down", D, { to: { L: L, F: F + 1 }, blocked: sl.downBlocked }, [dr.cx, dr.cy]);
  if (!okS) return null;
  if (!addObj("elevator", E, null, [er.cx, er.cy])) return null;
  /* капсула восстановления — в начальной зоне, у прибытия */
  if (!(L === 1 && F === 1)) addObj("capsule", U);

  /* 10. Всё, что нужно для замков, — до замка. */
  var cardHidden = false;
  for (var li2 = 0; li2 < lockList.length; li2++) {
    var lc = lockList[li2], lock = locks[lc];
    var spots = keySpots(lc).filter(function (n) { return n !== secret; });
    if (!spots.length) return null;
    var same = spots.filter(function (n) { return zone[n] === zone[parent[lc]] && n !== U; });
    var pickSpot = function () { return farSpot(same.length >= 3 && r.chance(0.7) ? same : spots, parent[lc]); };
    var door2 = null;
    for (var di = 0; di < doors.length; di++) if (doors[di].lockChild === lc) door2 = doors[di];
    if (!door2) return null;
    var roomName = rooms[lc].name;
    if (lock.type === "key") {
      var keyId = "k" + L + "_" + F + "_" + li2;
      door2.lock.key = keyId;
      door2.lock.keyName = "Ключ от двери: " + roomName;
      var kitem = { kind: "key", key: keyId, n: "Ключ «" + roomName + "»" };
      placeRequirement(kitem, pickSpot(), lc);
    } else if (lock.type === "code") {
      var code = String(r.int(1000, 9999));
      door2.lock.code = code;
      var sp = pickSpot(), cw = r.next();
      /* код — на терминале безопасности, в почте сотрудника на компьютере или в записке */
      if (cw < 0.25) {
        addObj("terminal", sp, { sub: "sec", codeFor: door2.id, codeRoom: roomName, code: code }) || addItem({ kind: "note", note: "code", code: code, room: roomName }, sp);
      } else if (cw < 0.55) {
        addObj("pc", sp, { own: r.int(0, 99999), codeFor: door2.id, codeRoom: roomName, code: code }) || addItem({ kind: "note", note: "code", code: code, room: roomName }, sp);
      } else addItem({ kind: "note", note: "code", code: code, room: roomName }, sp);
    } else if (lock.type === "card") {
      if (lock.tierFloor) {
        /* новый уровень доступа: пропуск — в начальной зоне, до любых дверей этого цвета */
        var z0s = spots.filter(function (n) { return zone[n] === -1 && n !== U; });
        var pitem = { kind: "pass", tier: lock.tier };
        placeRequirement(pitem, z0s.length ? r.pick(z0s) : U, lc);
      }
    } else if (lock.type === "power") {
      addObj("magnetron", pickSpot(), { req: true });
    } else if (lock.type === "rubble") {
      addObj("positron", pickSpot(), { req: true });
      door2.kind = "rubble";
    } else if (lock.type === "lockdown") {
      addObj("terminal", pickSpot(), { sub: "sec", lockdown: true });
    } else if (lock.type === "riddle") {
      /* голосовой замок: загадка; отгадку иногда подсказывает записка на этаже */
      door2.lock.rid = r.int(0, 99999);
      if (r.chance(0.45)) addItem({ kind: "note", note: "riddle", rid: door2.lock.rid, room: roomName, L: L }, pickSpot());
    } else if (lock.type === "circuit") {
      /* электронный замок: схема реле, которую надо погасить */
      door2.lock.n = Math.min(7, 4 + Math.floor(Lb / 7) + (r.chance(0.3) ? 1 : 0));
      door2.lock.seed = r.int(1, 99999);
    } else if (lock.type === "melody") {
      /* звуковой замок: мелодию проигрывает радиоприёмник где-то до двери */
      var mel = [], nm = Math.min(8, 4 + Math.floor(Lb / 6) + r.int(0, 1)), dirsM = ["U", "D", "L", "R"];
      for (var mi = 0; mi < nm; mi++) mel.push(r.pick(dirsM));
      door2.lock.melody = mel.join("");
      var radio = addObj("radio", pickSpot(), { melodyFor: door2.id, melody: door2.lock.melody, melodyRoom: roomName });
      if (!radio) { door2.lock = { type: "circuit", n: 5, seed: r.int(1, 99999) }; }
    } else if (lock.type === "logic") {
      /* логический замок: задача из жизни комплекса, своя у каждой двери */
      door2.lock.kind = r.pick(LOGIC_KINDS);
      door2.lock.seed = r.int(1, 99999);
      pz17(door2.lock, seed, L, F, "d" + door2.id, logicKinds());
    } else if (lock.type === "gate") {
      /* шлюзовая ключ-карта: у стража в зале перед шлюзом или спрятана на этаже */
      door2.lock.pass = "gate" + L;
      if (!reactor && lev.card === "hidden") {
        var hs = spots.filter(function (n) { return n !== U && n !== E && n !== parent[D]; });
        placeRequirement({ kind: "gatepass", L: L }, hs.length ? r.pick(hs) : r.pick(spots), lc);
        cardHidden = true;
      }
    }
  }
  function placeRequirement(it, spot, lockChild) {
    /* иногда вещь — у врага рядом: «пропуска добываются с монстров»
       (2.0) но не в мастерской этажа: там вещь просто лежит */
    if (r.chance(0.35) && spot !== U && !rooms[spot].shop) {
      var pool = lev.foes.filter(function (fid) { return LAB.FOES[fid] && LAB.FOES[fid].carrier; });
      if (pool.length) {
        var fid = r.pick(pool);
        var f = addFoe(fid, spot, { carry: [it] });
        if (f) return;
      }
    }
    addItem(it, spot);
  }

  /* 11. Пропуск лифта уровня — на втором этаже, в начальной зоне. */
  if (F === 2) {
    var ez = [];
    for (s = 0; s < NS; s++) if (main[s] && zone[s] === -1 && s !== U) ez.push(s);
    if (!ez.length) ez = [U];
    placeRequirement({ kind: "elevpass", L: L }, r.pick(ez), -1);
  }

  /* 12. (2.1) Стартовый набор у капсулы; (2.2) десять энергобатарей и десять
     аптечек — четыре стопки по пять в двух шагах от неё, каждая на своей
     клетке (свой маяк). Бластер и комбинезон сразу у героя (game.js,
     newState). Прежняя комната находок выбирается, как раньше, и случайных
     выборов столько же: остальной первый этаж в прежних записях не
     сдвигается. */
  if (L === 1 && F === 1) {
    var z0 = [];
    for (s = 0; s < NS; s++) if (main[s] && zone[s] === -1 && s !== U) z0.push(s);
    if (z0.length) r.pick(z0);
    var capO = fl.objs.filter(function (o9) { return o9.type === "wake"; })[0];
    var nearCap = function () {
      var c9 = [];
      if (capO && ur) for (var y9 = ur.y0; y9 <= ur.y1; y9++) for (var x9 = ur.x0; x9 <= ur.x1; x9++)
        if (Math.max(Math.abs(x9 - capO.x), Math.abs(y9 - capO.y)) <= 2 && !objCell[idx(x9, y9)] && !itemCell[idx(x9, y9)]) c9.push([x9, y9]);
      return c9.length ? r.pick(c9) : null;
    };
    [{ kind: "ammo", ammo: "energy", n: 5 }, { kind: "ammo", ammo: "energy", n: 5 }, { kind: "item", item: "medkit_s", n: 5 }, { kind: "item", item: "medkit_s", n: 5 }]
      .forEach(function (it9) { addItem(it9, U, nearCap()); });
  }

  /* 13. Обстановка комнат по их типу. */
  for (s = 0; s < NS; s++) {
    var rm4 = rooms[s];
    if (!rm4) continue;
    var def = LAB.ROOMS[rm4.type];
    if (def.special && rm4.type !== "secret") continue;
    var obj = def.obj || {};
    for (var ot in obj) {
      /* компьютеров — один-два на этаж: почта сотрудников не повторяется */
      if (!r.chance(ot === "pc" ? obj[ot] * 0.42 : obj[ot])) continue;
      if ((ot === "magnetron" || ot === "positron") && L < 2) continue;
      if (ot === "positron" && L < 3) continue;
      var extra2 = null;
      if (ot === "terminal") extra2 = { sub: r.pick(["sec", "sci", "eng", "sci"]) };
      if (ot === "safe") extra2 = { code: String(r.int(1000, 9999)), locked: true };
      if (ot === "locker") extra2 = { locked: r.chance(0.25) };
      if (ot === "pc") extra2 = { own: r.int(0, 99999), locked: r.chance(0.18) };
      if (ot === "coffee" || ot === "drinks") extra2 = { broken: r.chance(0.12) };
      if (ot === "puzzle") extra2 = { kind: r.pick(["sort", "relays", "bulls", "riddle"].concat(LOGIC_KINDS, ["chess"])), seed: r.int(1, 99999) };
      if (ot === "radio") extra2 = { band: r.int(0, 999) };
      var o2 = addObj(ot, s, extra2);
      if (o2 && ot === "puzzle") pz17(o2, seed, L, F, o2.id, stationKinds());
      if (o2 && (ot === "crate" || ot === "locker" || ot === "safe" || ot === "desk" || ot === "corpse")) o2.loot = genLoot(r, L, F, ot, def.loot);
      if (o2 && (ot === "pc" || ot === "puzzle")) o2.loot = genLoot(r, L, F, "desk", def.loot);
      /* (3.0) у запертого компьютера — пароль из четырёх цифр; записка с ним — в соседнем помещении */
      if (o2 && ot === "pc" && o2.locked) { o2.pin = String(r.int(1000, 9999)); addItem({ kind: "note", note: "pcpin", code: o2.pin, room: rm4.name }, nearSpot(keySpotsForRoom(s), s)); }
      if (o2 && ot === "safe") {
        /* код сейфа — в записке где-то на этаже, достижимой без замков после сейфа */
        var ss = keySpotsForRoom(s), sPick = farSpot(ss, s);
        /* иногда код сейфа — в письме на компьютере, а не на бумаге */
        var spc = r.chance(0.35) ? addObj("pc", sPick, { own: r.int(0, 99999), safeCode: o2.code, safeRoom: rm4.name }) : null;
        if (!spc) addItem({ kind: "note", note: "safe", code: o2.code, room: rm4.name }, sPick);
      }
    }
  }
  function keySpotsForRoom(s2) {
    var out = [];
    for (var n = 0; n < NS; n++) {
      if (!main[n] || n === secret) continue;
      var ok = true;
      for (var y = n; y !== -1; y = parent[y]) if (locks[y] && !isAncestor(y, s2)) { ok = false; break; }
      if (ok) out.push(n);
    }
    return out.length ? out : [U];
  }

  /* 14. Вещи на полу. */
  var mainRooms = [];
  for (s = 0; s < NS; s++) if (main[s] && s !== U) mainRooms.push(s);
  function anyRoom() { return r.pick(mainRooms); }
  var nb2, ak;
  for (nb2 = r.int(2, 4); nb2 > 0; nb2--) addItem({ kind: "ammo", ammo: "energy", n: 1 + (r.chance(0.3) ? 1 : 0) }, anyRoom());
  for (ak in LAB.AMMO) {
    if (ak === "energy") continue;
    var ad0 = LAB.AMMO[ak].depth || 1;
    if (ad0 > L) continue;
    var recentA = ad0 > L - 20;
    for (nb2 = r.int(recentA ? 1 : 0, recentA ? 2 : 1); nb2 > 0; nb2--) if (recentA || r.chance(0.5)) addItem({ kind: "ammo", ammo: ak, n: 1 }, anyRoom());
  }
  for (nb2 = r.int(1, 3); nb2 > 0; nb2--) addItem({ kind: "item", item: "medkit_s", n: 1 }, anyRoom());
  if (r.chance(Math.min(0.6, 0.25 + L * 0.03))) addItem({ kind: "item", item: "medkit_l", n: 1 }, anyRoom());
  if (r.chance(0.3)) addItem({ kind: "item", item: "stim", n: 1 }, anyRoom());
  if (L >= 3 && r.chance(0.4)) addItem({ kind: "item", item: "antidote", n: 1 }, anyRoom());
  if (r.chance(0.3)) addItem({ kind: "item", item: "energy_d", n: 1 }, anyRoom());
  if (L >= 2 && r.chance(0.35)) addItem({ kind: "item", item: "emp", n: 1 }, anyRoom());
  if (r.chance(0.12)) addItem({ kind: "item", item: "plate", n: 1 }, anyRoom());
  /* предметы блоков: что встречается на этой глубине */
  var bItems = [];
  /* товары пунктов снабжения (с разделом cat) раскладывает по кабинетам annex.js — здесь их нет */
  for (var ik in LAB.ITEMS) { var idf = LAB.ITEMS[ik]; if (idf.kind !== "part" && !idf.cat && idf.depth && idf.depth <= L && idf.depth > L - 25 && LAB.srcOk(idf, "find")) bItems.push(ik); }
  for (nb2 = bItems.length ? r.int(0, 2) : 0; nb2 > 0; nb2--) addItem({ kind: "item", item: r.pick(bItems), n: 1 }, anyRoom());
  for (nb2 = r.int(3, 6); nb2 > 0; nb2--) addItem({ kind: "item", item: partAt(r, L), n: 1 + (r.chance(0.3) ? 1 : 0) }, anyRoom());
  if (r.chance(Math.min(0.2, 0.07 + L * 0.006))) addItem({ kind: "armor", a: LAB.genArmor(r, L, F) }, anyRoom());
  for (nb2 = r.int(2, 4); nb2 > 0; nb2--) addItem({ kind: "credits", n: LAB.credits(8 + r.int(0, 25), L, F) }, anyRoom());
  if (r.chance(0.3) || (F % 5 === 3)) addItem({ kind: "weapon", w: LAB.genWeapon(r, L, F) }, anyRoom());
  /* (2.0) чипы имплантов на полу — своей глубины, и пассивные тоже */
  var impPool = LAB.IMPLANTS.filter(function (im) { return !im.core && im.id !== "scan" && (im.minL || 1) <= L; });
  if (!impPool.length) impPool = LAB.IMPLANTS.slice(1);
  if (r.chance(0.09)) addItem({ kind: "chip", implant: r.pick(impPool).id }, anyRoom());
  /* записки: сюжетные (тексты — texts.js и файлы блоков) и записки персонала */
  addItem({ kind: "note", note: "story", L: L, F: F }, anyRoom());
  if (r.chance(0.5)) addItem({ kind: "note", note: "staff", n: r.int(0, 999) }, anyRoom());
  if (r.chance(0.35)) addItem({ kind: "note", note: "staff", n: r.int(0, 999) }, anyRoom());

  /* 15. Тайная комната: образец и редкая добыча. */
  if (secret >= 0) {
    var sr = rooms[secret];
    addItem({ kind: "sample", sid: d0 }, secret);
    addItem({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.2, minRank: 1 }) }, secret);
    var sAmmo = []; for (ak in LAB.AMMO) if ((LAB.AMMO[ak].depth || 1) <= L && ak !== "energy") sAmmo.push(ak);
    addItem(r.chance(0.5) && sAmmo.length ? { kind: "ammo", ammo: r.pick(sAmmo), n: 1 } : { kind: "item", item: "medkit_l", n: 1 }, secret);
    if (r.chance(0.3)) addItem({ kind: "chip", implant: r.pick(impPool).id }, secret);
    if (r.chance(0.3)) addItem({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.2 }) }, secret);
    /* подсказка о тайнике — в записке на этаже */
    var sd = null;
    for (var dd = 0; dd < doors.length; dd++) if (doors[dd].lock && doors[dd].lock.type === "secret" && !doors[dd].lock.inner) sd = doors[dd];
    if (sd && r.chance(0.6)) addItem({ kind: "note", note: "secret", room: rooms[sd.room].name, side: sd.side }, anyRoom());
    sr.hidden = true;
  } else {
    /* без тайной комнаты образец — в самой глубокой зоне */
    var deep = mainRooms.slice().sort(function (a, b) { return depthOf(b) - depthOf(a); });
    addItem({ kind: "sample", sid: d0 }, deep[0]);
  }
  function depthOf(n) { var k = 0; for (var y = n; y !== -1; y = parent[y]) k++; return k; }

  /* 16. Враги. Во второй половине уровня появляются роботы следующего уровня. */
  var foePool = lev.foes.filter(function (fid) {
    var b0 = LAB.FOES[fid];
    return b0 && b0.beh.indexOf("turret") < 0 && b0.beh.indexOf("camera") < 0 && b0.beh.indexOf("cleaner") < 0;
  });
  if (F > LAB.FLOORS_N / 2 && L < LAB.LEVELS_N && LAB.LEVELS[L + 1]) {
    LAB.LEVELS[L + 1].foes.forEach(function (fid) {
      var b1 = LAB.FOES[fid];
      if (b1 && b1.kind === "mech" && foePool.indexOf(fid) < 0 && b1.beh.indexOf("turret") < 0 && b1.beh.indexOf("camera") < 0 && b1.beh.indexOf("cleaner") < 0 && r.chance(0.5)) foePool.push(fid);
    });
  }
  if (!foePool.length) foePool = ["rat"];
  function makeFoe(fid, x, y, s2, extra, rr) {
    var r = rr || rMain; /* у стражей ОКО — свой поток случайностей */
    var base = LAB.FOES[fid];
    var lvl = Math.max(1, LAB.foeLevel(L, F) + r.int(-1, 1));
    var sc2 = LAB.scaleFoe(base, lvl);
    var f2 = { id: "e" + (foeSeq++), type: fid, x: x, y: y, lvl: lvl, hp: sc2.hp, maxhp: sc2.hp, dmg: sc2.dmg, arm: sc2.arm, room: s2 };
    if (extra) for (var k6 in extra) f2[k6] = extra[k6];
    /* модификации роботов: чем глубже, тем чаще и тем их больше */
    var aff = [];
    if (base.kind === "mech" && !f2.boss && base.beh.indexOf("camera") < 0 && base.beh.indexOf("cleaner") < 0) {
      var pE = Math.min(0.85, 0.05 + d0 * 0.0045);
      if (r.chance(pE)) {
        var nA = 1 + (d0 > 60 && r.chance(0.45) ? 1 : 0) + (d0 > 130 && r.chance(0.4) ? 1 : 0) + (d0 > 700 && r.chance(0.35) ? 1 : 0);
        var apool = [];
        for (var akk in LAB.AFFIX) {
          var adf = LAB.AFFIX[akk];
          if (adf.min > d0) continue;
          if (adf.ranged && base.beh.indexOf("ranged") < 0) continue;
          if ((akk === "fast" || akk === "cloak") && base.beh.indexOf("stationary") >= 0) continue;
          apool.push(akk);
        }
        r.shuffle(apool);
        aff = apool.slice(0, nA);
      }
    }
    if (aff.length) {
      f2.aff = aff;
      if (aff.indexOf("armored") >= 0) f2.arm = Math.round(f2.arm * 1.6) + 3;
      if (aff.indexOf("overclock") >= 0) f2.dmg = Math.round(f2.dmg * 1.3);
      if (aff.indexOf("shielded") >= 0) f2.shield = f2.shieldMax = Math.round(f2.maxhp * 0.35);
      f2.hp = f2.maxhp = Math.round(f2.maxhp * (1 + 0.1 * aff.length));
    }
    /* (2.5) ум твари — от её разумности (mutants.js), машины умнеют с глубиной */
    var miq = LAB.mutants ? LAB.mutants.iqFor(base, d0) : null;
    f2.iq = (miq != null ? miq : LAB.foeIQ(base.kind, d0, aff.length)) + (f2.boss ? 2 : 0);
    fl.foes.push(f2);
    itemCell[idx(x, y)] = 1;
    return f2;
  }
  function roomGuard(fid) {
    var b = LAB.FOES[fid];
    return !!b && b.kind === "mech" && !b.beh.some(function (x) { return /^(stationary|camera|turret|cleaner|mimic|stalker)$/.test(x); });
  }
  function addFoe(fid, s2, extra) {
    var c5 = standCell(s2);
    if (!c5) return null;
    return makeFoe(fid, c5[0], c5[1], s2, extra);
  }
  /* враг в коридоре: свободная клетка полосы (не у самого входа) */
  function corrCell(cor, nearDoor, edge) {
    var cand = [];
    var dObj = doors.filter(function (q) { return q.id === cor.door; })[0];
    for (var y6 = cor.y0; y6 <= cor.y1; y6++) for (var x6 = cor.x0; x6 <= cor.x1; x6++) {
      if (!cellFree(x6, y6)) continue;
      var across = cor.axis === "h" ? y6 - cor.y0 : x6 - cor.x0;
      if (edge && across !== 0 && across !== LAB.corrW(cor) - 1) continue;
      var dd2 = dObj ? Math.abs(dObj.x - x6) + Math.abs(dObj.y - y6) : 0;
      if (nearDoor && dd2 > 3) continue;
      if (!nearDoor && dd2 < 3) continue;
      cand.push([x6, y6]);
    }
    return cand.length ? r.pick(cand) : null;
  }
  for (s = 0; s < NS; s++) {
    var rm6 = rooms[s];
    /* (2.0) в мастерской этажа не сидят: у верстака можно работать */
    if (!rm6 || s === U || s === secret || rm6.shop) continue;
    /* тварей и роботов много: почти в каждом помещении, глубже — стаями;
       (2.0) «мягкого начала» больше нет — и на первом этаже тоже */
    var p6 = Math.min(0.95, 0.75 + 0.02 * Math.min(L, 10) + d0 * 0.0001 + (F === NF ? 0.1 : 0));
    if (s === E) p6 *= 0.5;
    if (!r.chance(p6)) continue;
    var fid2 = r.pick(foePool);
    var beh = LAB.FOES[fid2].beh;
    var big = (rm6.x1 - rm6.x0 + 1) * (rm6.y1 - rm6.y0 + 1) >= 49 ? 1 : 0;
    var cnt = beh.indexOf("swarm") >= 0 ? r.int(3, 4) : 1 + (r.chance(Math.min(0.85, 0.45 + Math.min(L, 10) * 0.03 + d0 * 0.0002)) ? 1 : 0) + (r.chance(Math.min(0.6, 0.1 + Math.min(L, 10) * 0.025 + d0 * 0.0002)) ? 1 : 0) + (big && r.chance(0.3) ? 1 : 0);
    for (var q = 0; q < cnt; q++) {
      var nf = addFoe(q === 0 ? fid2 : (r.chance(0.6) ? fid2 : r.pick(foePool)), s);
      /* (2.0) машина помещения его и стережёт (как охрана кабинетов, garrison.js):
         не уходит обходом в коридор, а погибнет — ОКО пришлёт в помещение новых */
      if (nf && roomGuard(nf.type)) { nf.guard = "room"; nf.post = [nf.x, nf.y]; }
    }
  }
  /* страж последнего этажа: шлюзовая ключ-карта при нём, если не спрятана */
  if (F === NF && bossSlot >= 0) {
    var bdef = LAB.BOSSES[lev.boss];
    var bcarry = reactor ? [{ kind: "gatepass", L: L, core: true }] : cardHidden ? [] : [{ kind: "gatepass", L: L }];
    if (r.chance(0.5)) bcarry.push({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.25 }) });
    var bf = addFoe(bdef.base, bossSlot, { boss: lev.boss, carry: bcarry });
    if (bf) {
      bf.hp = bf.maxhp = Math.round(bf.maxhp * bdef.mult);
      bf.dmg = Math.round(bf.dmg * 1.5);
      bf.arm = Math.round(bf.arm * 1.3) + 2;
      bf.lvl += 2;
    } else return null;
  }
  /* Турели — у дверей в коридорах: бьют вдоль полосы и поперёк. С первого
     уровня (кроме первых этажей), глубже — больше и тяжелее. */
  var turrets = 0;
  if (!(L === 1 && F <= 3)) {
    var tPool = turretPool(lev, d0);
    var nT = r.chance(Math.min(0.92, 0.45 + d0 * 0.004)) ? 1 + (d0 >= 40 && r.chance(0.5) ? 1 : 0) + (d0 >= 100 && r.chance(0.5) ? 1 : 0) + (d0 >= 300 && r.chance(0.4) ? 1 : 0) : 0;
    /* турель стережёт дверь в запертую зону или к выходу вниз */
    var tCors = r.shuffle(corrs.filter(function (cr) {
      var dq = doors.filter(function (q) { return q.id === cr.door; })[0];
      if (!dq || (dq.lock && dq.lock.type === "secret") || cr.doorRoom === U || cr.doorRoom === secret || cr.mouthRoom === secret) return false;
      return zone[cr.doorRoom] !== -1 || cr.doorRoom === D;
    }));
    if (!tCors.length) tCors = r.shuffle(corrs.filter(function (cr) { return cr.doorRoom !== U && cr.doorRoom !== secret && cr.mouthRoom !== secret; }));
    for (var t7 = 0; t7 < nT && tCors.length; t7++) {
      var tc2 = tCors[t7 % tCors.length];
      var cc = corrCell(tc2, true, true);
      if (!cc) continue;
      makeFoe(r.pick(tPool), cc[0], cc[1], -1, { corr: tc2.id });
      turrets++;
    }
    /* настенные турели в помещениях глубже */
    if (d0 >= 60 && r.chance(0.35)) {
      var trs = mainRooms.filter(function (s3) { return s3 !== E && zone[s3] !== -1; });
      if (trs.length) { var tr0 = r.pick(trs); if (addFoe(r.pick(tPool), tr0)) turrets++; }
    }
  }
  /* камеры ОКО: видят героя и поднимают тревогу */
  var camPool = foesWith(lev.foes, "camera");
  if (!camPool.length) camPool = ["cam"];
  if (!(L === 1 && F <= 2) && LAB.FOES[camPool[0]]) {
    var nC = r.int(d0 < 20 ? 0 : 1, Math.min(4, 1 + Math.floor(d0 / 120)));
    var cCors = r.shuffle(corrs.slice());
    for (var c7 = 0; c7 < nC && cCors.length; c7++) {
      var cc2 = corrCell(cCors[c7 % cCors.length], false, true);
      if (cc2) makeFoe(r.pick(camPool), cc2[0], cc2[1], -1, { corr: cCors[c7 % cCors.length].id });
    }
  }
  /* уборщики: мирные, пока не тронешь, подбирают вещи и докладывают ОКО */
  var clPool = foesWith(lev.foes, "cleaner");
  if (!clPool.length) clPool = ["cleaner"];
  if (LAB.FOES[clPool[0]] && !(L === 1 && F === 1)) {
    var clRooms = mainRooms.filter(function (s9) { return !rooms[s9].shop; }); /* (2.0) в мастерской не убирают */
    for (var c8 = r.chance(0.6) ? r.int(1, 2) : 0; c8 > 0 && clRooms.length; c8--) addFoe(r.pick(clPool), r.pick(clRooms));
  }
  /* (2.0) патрули в коридорах — garrison.js: участки обхода, больше и чаще */

  /* 17. Выжившие, дружественные роботы, станции имплантов, штабы фракций. */
  var quietRooms = [];
  for (s = 0; s < NS; s++) {
    if (!rooms[s] || s === U || s === D || s === E || s === secret || !main[s]) continue;
    if (fl.foes.some(function (f3) { return f3.room === s && !LAB.FOES[f3.type].beh.some(function (b) { return b === "cleaner"; }); })) continue;
    quietRooms.push(s);
  }
  r.shuffle(quietRooms);
  /* (3.5) живые — не там, где тела (морги, прозекторские): после перемешивания, чтобы
     поток случайностей этажа не сдвинулся */
  quietRooms = quietRooms.filter(function (q9) { return !fl.objs.some(function (o9) { return o9.type === "corpse" && o9.room === q9; }); });
  /* (3.5, просьба игрока: живых больше) выжившие — чаще и до двоих на этаже: в «Ковчеге» и
     «Подножии» люди прячутся по помещениям, глубже их меньше. У второго — своё зерно и свой
     ключ (L-F-s2): поручения у каждого свои. */
  var survP = L <= 20 ? [0.7, 0.35] : [0.55, 0.22];
  if (quietRooms.length && r.chance(survP[0])) {
    var ns = quietRooms.shift();
    var sv = makeSurvivor(r, L, F, ns, rooms[ns]);
    var cS = freeCell(ns);
    if (cS) { sv.x = cS[0]; sv.y = cS[1]; objCell[idx(sv.x, sv.y)] = 1; fl.npcs.push(sv); }
    var rs2 = Rng(seed, "surv2:" + L + ":" + F + ":" + attempt);
    if (quietRooms.length && rs2.chance(survP[1])) {
      var ns2 = quietRooms.shift(), sv2 = makeSurvivor(rs2, L, F, ns2, rooms[ns2]), cS2 = freeCell(ns2);
      if (cS2) { sv2.id = "n" + fl.npcs.length; sv2.key = L + "-" + F + "-s2"; sv2.x = cS2[0]; sv2.y = cS2[1]; objCell[idx(sv2.x, sv2.y)] = 1; fl.npcs.push(sv2); }
    }
  }
  if (quietRooms.length && r.chance(0.22)) {
    var nr = quietRooms.shift();
    var rtypes = ["helper", "helper", "meddroid", "archivist"];
    for (var rk in LAB.ROBOT_NPC) if (LAB.ROBOT_NPC[rk].block === LAB.blockOf(L)) rtypes.push(rk, rk);
    var rtype = r.pick(rtypes);
    var cR = freeCell(nr);
    if (cR) objCell[idx(cR[0], cR[1])] = 1;
    if (cR) fl.npcs.push({ id: "n" + fl.npcs.length, robot: true, type: rtype, n: LAB.ROBOT_NPC[rtype].n, x: cR[0], y: cR[1], room: nr, key: L + "-" + F + "-r" });
  }
  var implantFloors = { "2-5": 1, "3-12": 1, "4-10": 1, "5-15": 1, "6-5": 1, "7-12": 1, "8-10": 1, "9-6": 1 };
  var implantHere = L <= 10 ? !!implantFloors[L + "-" + F] : (L % 2 === 1 && F === 3 + (hash32("impl" + L) % 15));
  if (implantHere && quietRooms.length) addObj("implantlab", quietRooms[0]);
  var hqFloors = { "2-10": "sec", "3-15": "sci", "5-6": "eng", "4-16": "res", "6-9": "free" };
  if (hqFloors[L + "-" + F] && quietRooms.length > 1) addObj("hq", quietRooms[1], { faction: hqFloors[L + "-" + F] });

  /* торговые терминалы — по расписанию; мастерская — на первом этаже уровня и на каждом третьем */
  var svcRooms = [];
  for (s = 0; s < NS; s++) if (rooms[s] && main[s] && s !== U && s !== D && s !== E && s !== secret && s !== bossSlot) svcRooms.push(s);
  function hasObj(t2) { return fl.objs.some(function (o) { return o.type === t2; }); }
  function addSvc(type, extra, prefer) {
    var list = r.shuffle(svcRooms.slice());
    if (prefer) list.sort(function (a, b) { return (prefer(b) ? 1 : 0) - (prefer(a) ? 1 : 0); });
    for (var k8 = 0; k8 < list.length; k8++) { var o8 = addObj(type, list[k8], extra); if (o8) return o8; }
    return addObj(type, U, extra);
  }
  var startZone = function (s4) { return zone[s4] === -1; };
  if ([1, 5, 10, 15, 19].indexOf(F) >= 0 && !hasObj("vending")) addSvc("vending", null, startZone);
  if (LAB.shopFloor(F)) {
    /* верстак мастерской этажа; не встал в мастерской — в любом помещении начальной зоны */
    var shopO = fl.objs.filter(function (o9) { return o9.type === "workbench" && o9.room === shopRoom; })[0] || (shopRoom >= 0 ? addObj("workbench", shopRoom) : null) || addSvc("workbench", null, startZone);
    if (!shopO) return null;
    shopO.shop = 1; fl.shop = shopO.id;
    /* (2.0) глубже — мастерская богаче: зарядная станция для энергетического оружия */
    if (L >= 26 && shopRoom >= 0) addObj("charger", shopRoom);
  }
  /* компьютер с почтой сотрудников — почти на каждом этаже; кофе или напитки — на многих */
  if (!hasObj("pc") && svcRooms.length && r.chance(0.85)) {
    var pcLock = r.chance(0.15), pcRm = r.pick(svcRooms), pcO = addObj("pc", pcRm, { own: r.int(0, 99999), locked: pcLock });
    /* (3.0) у запертого компьютера — пароль из четырёх цифр, а записка с ним — в соседнем помещении */
    if (pcO && pcLock) { pcO.pin = String(r.int(1000, 9999)); addItem({ kind: "note", note: "pcpin", code: pcO.pin, room: rooms[pcRm].name }, nearSpot(keySpotsForRoom(pcRm), pcRm)); }
  }
  if (!hasObj("coffee") && !hasObj("drinks") && svcRooms.length && r.chance(0.6)) addObj(r.chance(0.55) ? "coffee" : "drinks", r.pick(svcRooms), { broken: r.chance(0.1) });
  /* турели этажа отключаются и взламываются с терминала безопасности: он есть, если есть турели */
  if (turrets && !fl.objs.some(function (o) { return o.type === "terminal" && o.sub === "sec"; })) addSvc("terminal", { sub: "sec" }, startZone);
  /* научный терминал — карта этажа для навигатора; бывает не всегда */
  if (!fl.objs.some(function (o) { return o.type === "terminal" && (o.sub === "sec" || o.sub === "sci"); }) && r.chance(0.55)) addSvc("terminal", { sub: "sci" });
  /* говорящая панель ОКО, стенд с головоломкой, радиоприёмник */
  if (L >= 2 && !hasObj("okoterm") && r.chance(0.3)) addSvc("okoterm", { seed: r.int(1, 99999) });
  if (!hasObj("puzzle") && r.chance(0.28)) { var pz = addSvc("puzzle", { kind: r.pick(["sort", "relays", "bulls", "riddle"].concat(LOGIC_KINDS, ["chess"])), seed: r.int(1, 99999) }); if (pz) pz17(pz, seed, L, F, pz.id, stationKinds()); if (pz) pz.loot = genLoot(r, L, F, "safe", "tech"); }
  if (!hasObj("radio") && r.chance(0.25)) addSvc("radio", { band: r.int(0, 999) });

  /* 17б. Автомат с едой — чаще в столовой, на кухне, в комнате отдыха;
     и немного еды на этаже (галеты в шкафчике, забытый батончик). Ставится
     последним: прежняя обстановка этажа от этого не меняется. */
  var foodRooms = svcRooms.filter(function (s5) { return ["canteen", "kitchen", "lounge", "cafeteria"].indexOf(rooms[s5].type) >= 0; });
  if (!hasObj("snacks") && svcRooms.length && r.chance(foodRooms.length ? 0.7 : 0.4)) addObj("snacks", r.pick(foodRooms.length ? foodRooms : svcRooms), { broken: r.chance(0.08) });
  var rf = Rng(seed, "food:" + L + ":" + F + ":" + attempt);
  var snackIds = ["crackers", "crackers", "choco", "protein", "nuts", "ration", "stew", "glucose"];
  for (var nf = rf.int(0, 2); nf > 0; nf--) addItem({ kind: "item", item: rf.pick(snackIds), n: 1 }, rf.pick(mainRooms));
  if (rf.chance(0.35)) addItem({ kind: "item", item: rf.pick(["bandage", "bandage", "sorbent"]), n: 1 }, rf.pick(mainRooms));

  /* 18. Посты ОКО. Перед лифтом и у лестницы вниз стоят стражи — роботы
     или твари: держат пост, отходят от него недалеко и возвращаются.
     В пустом кабинете с компьютером или терминалом — охранник; терминал
     безопасности часто стерегут. Свой поток случайностей: всё остальное
     на этаже от постов не меняется. */
  var rg = Rng(seed, "posts:" + L + ":" + F + ":" + attempt), gN = 0;
  var guardPool = foePool.filter(function (fid) {
    var b3 = LAB.FOES[fid];
    return b3 && ["stationary", "swarm", "mimic", "cleaner", "camera", "burrow", "blink", "indirect"].every(function (b) { return b3.beh.indexOf(b) < 0; });
  });
  if (!guardPool.length) guardPool = foePool.slice();
  var mechG = guardPool.filter(function (fid) { return LAB.FOES[fid].kind === "mech"; });
  function postCells(s2, ox, oy, d1, d2) {
    var rm7 = rooms[s2], out = [];
    for (var y7 = rm7.y0; y7 <= rm7.y1; y7++) for (var x7 = rm7.x0; x7 <= rm7.x1; x7++) {
      var dd7 = Math.max(Math.abs(x7 - ox), Math.abs(y7 - oy));
      if (dd7 < d1 || dd7 > d2 || !cellFree(x7, y7)) continue;
      /* не в самом входе: проход в помещение остаётся свободным */
      var edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { var tt7 = t[idx(x7 + v[0], y7 + v[1])]; return tt7 === T_DOOR || tt7 === T_CORR; });
      if (!edge) out.push([x7, y7]);
    }
    return out;
  }
  function addGuard(s2, obj, kind) {
    if (!obj || s2 < 0 || !rooms[s2]) return null;
    var cells = postCells(s2, obj.x, obj.y, 2, 3);
    if (!cells.length) cells = postCells(s2, obj.x, obj.y, 1, 4);
    if (!cells.length) return null;
    var c9 = rg.pick(cells);
    var pool = mechG.length && (kind === "office" || rg.chance(0.6)) ? mechG : guardPool;
    return makeFoe(rg.pick(pool), c9[0], c9[1], s2, { id: "g" + (gN++), guard: kind, post: [c9[0], c9[1]] }, rg);
  }
  /* (2.0) стражи у лифта, лестниц и шлюза — в garrison.js (посты охраны
     этажа, с первого этажа); здесь — стражи терминалов безопасности и
     сейфов в главных помещениях, тоже с первого этажа */
  {
    for (s = 0; s < NS; s++) {
      if (!rooms[s] || !main[s] || s === U || s === D || s === E || s === secret || s === bossSlot || rooms[s].shop) continue;
      var key9 = fl.objs.filter(function (o) { return o.room === s && o.type === "terminal" && o.sub === "sec"; })[0];
      var busy9 = fl.foes.some(function (q) { return q.room === s; });
      if (key9 && rg.chance(Math.min(0.8, 0.4 + d0 * 0.002))) { addGuard(s, key9, "office"); continue; }
      if (busy9) continue;
      key9 = fl.objs.filter(function (o) { return o.room === s && (o.type === "terminal" || o.type === "pc" || o.type === "safe"); })[0];
      if (key9 && rg.chance(0.6)) addGuard(s, key9, "office");
    }
  }
  fl.posts = gN;

  /* 19. Установки глубин под Ядром (прессы, щиты, инкубаторы, журналы,
     затворы, древние узлы) — последними и своим потоком случайностей. */
  if (LAB.depths && LAB.depths.place) LAB.depths.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, svcRooms: svcRooms, mainRooms: mainRooms, addObj: addObj, addItem: addItem, makeFoe: makeFoe, freeCell: freeCell });

  /* 20. (1.5) Кабинеты у коридоров, особые зоны и пункт снабжения —
     самыми последними и своим потоком случайностей (annex.js). */
  if (LAB.annex && LAB.annex.place) LAB.annex.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, addObj: addObj, addItem: addItem, makeFoe: makeFoe, freeCell: freeCell });

  /* 20б. (2.0) Стенды с задачами в кабинетах: лаборатории, серверные,
     мастерские, щитовые, кабинеты, классы — своим потоком. В лотке —
     кредиты, детали и припасы, без оружия и брони. */
  if (LAB.garrison && LAB.puzzles2) {
    var rzp = LAB.Rng(seed, "pz17st:" + L + ":" + F + ":" + attempt);
    var wantP = L === 1 ? (F <= 2 ? 0 : 1) : 1 + (rzp.chance(0.6) ? 1 : 0) + (L >= 10 && rzp.chance(0.5) ? 1 : 0);
    var pzRooms = [], NOPZ = { secret: 1, supply: 1, trial: 1, decon: 1, hazard: 1 };
    fl.rooms.forEach(function (rm) { if (rm && rm.annex && !rm.hidden && !NOPZ[((LAB.ANNEX_ROOMS || {})[rm.type] || {}).kind] && /^(lab|server|work|power|office|leisure)$/.test(LAB.garrison.category(rm))) pzRooms.push(rm.id); });
    rzp.shuffle(pzRooms);
    /* (3.6) в лабораториях — чаще химические задачи (chempuz.js; список — здесь, чтобы этаж
       строился одинаково и в игре, и в проверке генератора) */
    var labPool = CHEM_PZ.concat(CHEM_PZ, CHEM_PZ, stationKinds());
    for (var pq = 0; pq < pzRooms.length && wantP > 0; pq++) {
      var st17 = addObj("puzzle", pzRooms[pq], { seed: rzp.int(1, 99999) });
      if (!st17) continue;
      pz17(st17, seed, L, F, st17.id, LAB.garrison.category(fl.rooms[pzRooms[pq]]) === "lab" ? labPool : stationKinds());
      st17.loot = genLoot(rzp, L, F, "desk", "tech").filter(function (it) { return it.kind !== "weapon" && it.kind !== "armor"; });
      wantP--;
    }
  }

  /* 21. (2.0) Охрана этажа: патрули в коридорах, сапёры, машины в кабинетах
     по важности и назначению (garrison.js) — последними, своим потоком. */
  if (LAB.garrison && LAB.garrison.place) LAB.garrison.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, makeFoe: makeFoe });
  /* 22. (2.2) Камеры ОКО в помещениях (garrison.js) — после охраны, своим потоком. */
  if (LAB.garrison && LAB.garrison.placeCams) LAB.garrison.placeCams({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, makeFoe: makeFoe });
  /* 23. (2.5) Отряды тварей: своры, семьи, звенья, ульи, банды (mutants.js) — своим потоком. */
  if (LAB.mutants && LAB.mutants.place) LAB.mutants.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, makeFoe: makeFoe });
  /* 24. (2.6) Лечение и снабжение (medic.js): аптечный автомат у каждой капсулы, энергобатареи у
     капсулы прибытия, лечебные припасы в каждой второй комнате, целитель своей глубины —
     последними, своим потоком случайностей. */
  if (LAB.medic && LAB.medic.place) LAB.medic.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, U: U, addObj: addObj, addItem: addItem, freeCell: freeCell, moveTo: moveTo });
  /* 25. (3.0) Химия (chem.js): химические столы, сырьё в хранилищах лабораторий,
     медпунктов, складов и мастерских, склянки и журналы с рецептурами — своим потоком. */
  if (LAB.chem && LAB.chem.place) LAB.chem.place({ fl: fl, L: L, F: F, seed: seed, attempt: attempt, U: U, addObj: addObj, addItem: addItem });
  /* 25б. (3.5, просьба игрока: живых больше) Выживших меньше задуманного — ещё в помещениях
     и кабинетах, где нет ни машин, ни тварей (уже после охраны и отрядов): люди прячутся
     и в кабинетах у коридоров. Своё зерно, свой ключ у каждого (L-F-s, s2, s3). */
  var rs3 = Rng(seed, "surv3:" + L + ":" + F + ":" + attempt);
  var survWant = (rs3.chance(L <= 20 ? 0.75 : 0.6) ? 1 : 0) + (rs3.chance(L <= 20 ? 0.4 : 0.25) ? 1 : 0);
  var humans = fl.npcs.filter(function (n9) { return !n9.robot && !n9.heal; }).length;
  if (humans < survWant && !(L === 1 && F === 1)) {
    var foeRoom = {}, npcRoom = {}, capRoom = {}, usedKey = {}, calm = [];
    fl.foes.forEach(function (f9) { if (f9.room != null) foeRoom[f9.room] = 1; });
    fl.npcs.forEach(function (n9) { npcRoom[n9.room] = 1; usedKey[n9.key] = 1; });
    /* у капсулы — только аптечный автомат (medic.js уже развёл торговые точки):
       выживший-торговец туда не встаёт */
    fl.objs.forEach(function (o9) { if ((o9.type === "capsule" || o9.type === "wake") && o9.room >= 0) capRoom[o9.room] = 1; });
    /* и не среди тел погибших (annex.js, placeBodies): живые от мёртвых уходят */
    fl.objs.forEach(function (o9) { if (o9.type === "corpse" && o9.room >= 0) capRoom[o9.room] = 1; });
    fl.rooms.forEach(function (m9, s9) {
      if (!m9 || m9.hidden || m9.rad || m9.gas || foeRoom[s9] || npcRoom[s9] || capRoom[s9] || s9 === U || s9 === D || s9 === E || s9 === secret || s9 === bossSlot) return;
      var def9 = LAB.ROOMS[m9.type] || {};
      if (def9.special || (def9.kind && def9.kind !== "locked")) return;
      calm.push(s9);
    });
    rs3.shuffle(calm);
    while (humans < survWant && calm.length) {
      var s9 = calm.shift(), sv9 = makeSurvivor(rs3, L, F, s9, fl.rooms[s9]), c9 = freeCell(s9);
      if (!c9) continue;
      var k9 = ["s", "s2", "s3"].filter(function (k) { return !usedKey[L + "-" + F + "-" + k]; })[0];
      if (!k9) break;
      usedKey[L + "-" + F + "-" + k9] = 1;
      sv9.id = "n" + fl.npcs.length; sv9.key = L + "-" + F + "-" + k9; sv9.x = c9[0]; sv9.y = c9[1];
      objCell[idx(sv9.x, sv9.y)] = 1; fl.npcs.push(sv9); humans++;
    }
  }
  /* 26. (3.0) Заваленная лестница вниз (rubble.js): на этом же этаже — гидравлический
     домкрат или подрывной заряд, там, куда можно дойти, не открывая других замков,
     кроме тех, что и так стоят на пути к лестнице; не в тайной комнате, не у самой
     лестницы и не у прибытия. Последним шагом и своим потоком: прежние вещи этажа,
     их места и номера не сдвигаются — записи «Альфа 3.0» продолжаются, а у тех, кто
     застрял у завала, домкрат или заряд появится на этаже. */
  if (sl.downBlocked) {
    var rr = Rng(seed, "rubble30:" + L + ":" + F + ":" + attempt);
    var kitPool = keySpots(D).filter(function (n) { return n !== secret && n !== D && n !== U; });
    if (!kitPool.length) kitPool = keySpots(D).filter(function (n) { return n !== secret; });
    var kitIt = LAB.ITEMS.c_blast && rr.chance(0.5) ? "c_blast" : "rub_jack";
    /* комната — случайная из подходящих; нет в ней свободной клетки — следующая */
    var kitRooms = rr.shuffle(kitPool.length ? kitPool.slice() : [U]);
    for (var kq = 0; kq < kitRooms.length; kq++) {
      var krm = rooms[kitRooms[kq]], kcells = [];
      for (var ky = krm.y0; ky <= krm.y1; ky++) for (var kx = krm.x0; kx <= krm.x1; kx++) if (!objCell[idx(kx, ky)] && !itemCell[idx(kx, ky)]) kcells.push([kx, ky]);
      if (kcells.length) { addItem({ kind: "item", item: kitIt, n: 1, rub: 1 }, kitRooms[kq], rr.pick(kcells)); break; }
    }
  }

  fl.sample = d0;
  fl.turrets = turrets;
  return fl;
}

function makeSurvivor(r, L, F, s, rm) {
  var female = r.chance(0.5);
  var first = r.pick(female ? LAB.NAMES.f : LAB.NAMES.m);
  var last = r.pick(female ? LAB.NAMES.sf : LAB.NAMES.sm);
  /* (2.6) целители глубин (nosurv) встают на этаже сами — среди случайных выживших их нет */
  var profs = Object.keys(LAB.PROFS).filter(function (p) { var b = LAB.PROFS[p].block; return !LAB.PROFS[p].nosurv && (!b || b === LAB.blockOf(L)); });
  var own = profs.filter(function (p) { return LAB.PROFS[p].block === LAB.blockOf(L); });
  var prof = own.length && r.chance(0.6) ? r.pick(own) : r.pick(profs);
  var c = [r.int(rm.x0, rm.x1), r.int(rm.y0, rm.y1)];
  return { id: "n0", robot: false, n: first + " " + last, first: first, last: last, female: female, prof: prof,
    x: c[0], y: c[1], room: s, tier: 1 + Math.floor(L / 3), key: L + "-" + F + "-s", life: r.int(0, 99), view: r.int(0, 99) };
}

/* Добыча контейнеров: склонность комнаты влияет на состав. */
function genLoot(r, L, F, ot, tag) {
  var out = [];
  /* (2.5, просьба игрока) шкафчик, стол, тело — пусты лишь изредка */
  var n = ot === "safe" ? 3 : ot === "crate" ? r.int(1, 3) : r.chance(0.9) ? r.int(1, 2) : 0;
  var ammoAt = function () {
    var pool = [];
    for (var k in LAB.AMMO) if ((LAB.AMMO[k].depth || 1) <= L && LAB.AMMO[k].loot !== false) pool.push(k);
    var recent = pool.filter(function (k) { return (LAB.AMMO[k].depth || 1) > L - 20 && k !== "energy"; });
    return recent.length && r.chance(0.5) ? r.pick(recent) : r.chance(0.7) ? "energy" : r.pick(pool);
  };
  for (var i = 0; i < n; i++) {
    var roll = r.next();
    if (tag === "arms" && roll < 0.35) out.push({ kind: "ammo", ammo: ammoAt(), n: 1 });
    else if (tag === "med" && roll < 0.45) out.push({ kind: "item", item: (function (q) { return q < 0.42 ? "medkit_s" : q < 0.58 ? "bandage" : q < 0.7 ? "sorbent" : q < 0.79 ? "neuroblock" : q < 0.86 ? "antidote" : "medkit_l"; })(r.next()), n: 1 });
    else if (tag === "parts" && roll < 0.5) out.push({ kind: "item", item: L >= 3 && r.chance(0.2) ? "ceramic" : partAt(r, L), n: 1 });
    /* (2.0) походные ремкомплекты — на складах и в мастерских */
    else if (tag === "parts" && roll < 0.57) out.push({ kind: "item", item: L >= 2 && r.chance(0.12) ? "engkit" : r.chance(0.55) ? "fieldkit" : "wrepair", n: 1 });
    else if (tag === "tech" && roll < 0.45) out.push({ kind: "item", item: L >= 5 && r.chance(0.15) ? "supercond" : r.chance(0.5) ? r.pick(["chip", "cap", "lens", "wire"]) : partAt(r, L), n: 1 });
    else if (tag === "bio" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.6) ? r.pick(["gel", "reagent", "gel"]) : partAt(r, L), n: 1 });
    else if (tag === "chem" && roll < 0.45) out.push({ kind: "item", item: r.pick(["reagent", "gel", "antidote", "sorbent", "reagent"]), n: 1 });
    else if (tag === "food" && roll < 0.4) out.push({ kind: "item", item: r.pick(["ration", "stew", "crackers", "crackers", "choco", "protein", "nuts", "noodles", "glucose", "stim", "medkit_s"]), n: 1 });
    else if (tag === "paper" && roll < 0.4) out.push({ kind: "note", note: "staff", n: r.int(0, 999) });
    else if (tag === "armor" && roll < 0.2) out.push({ kind: "armor", a: LAB.genArmor(r, L, F) });
    else if (tag === "armor" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.5) ? "plate" : (L >= 3 ? "ceramic" : "scrap"), n: 1 });
    else if (tag === "armor" && roll < 0.53) out.push({ kind: "item", item: "repairkit", n: 1 });
    else if (tag === "arms" && roll < 0.42 && r.chance(0.3)) out.push({ kind: "armor", a: LAB.genArmor(r, L, F) });
    else if (roll < 0.6) out.push({ kind: "credits", n: LAB.credits(6 + r.int(0, 20), L, F) });
    else if (roll < 0.8) out.push({ kind: "ammo", ammo: ammoAt(), n: 1 });
    else out.push({ kind: "item", item: partAt(r, L), n: 1 });
  }
  if (ot === "safe") {
    if (r.chance(0.5)) out.push({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.1 }) });
    else out.push({ kind: "credits", n: LAB.credits(40, L, F) * 2 });
    /* служебный ключ ОКО в сейфе — без лишних бросков генератора: этаж не меняется */
    if (LAB.depth(L, F) >= 4 && LAB.hash32("okokey:" + L + "-" + F + "-" + tag) % 100 < 22) out.push({ kind: "item", item: "okokey", n: 1 });
    /* экспериментальный компонент мастерской — в сейфах глубоких уровней, тоже без бросков генератора */
    if (LAB.ITEMS.proto && L >= 5 && LAB.hash32("proto:" + L + "-" + F + "-" + tag) % 100 < 14) out.push({ kind: "item", item: "proto", n: 1 });
  }
  /* (1.5) ловушка в оружейном, техническом ящике или на складе деталей — изредка, без бросков генератора */
  if (LAB.trapLoot) { var tl = LAB.trapLoot(L, F, ot, tag); if (tl) out.push(tl); }
  return out;
}
LAB.genLoot = genLoot;
/* Случайная деталь, какая встречается на этой глубине; чаще — детали своего блока. */
function partAt(r, L) {
  var pool = LAB.PARTS.filter(function (p) { return (LAB.PART_DEPTH[p] || 1) <= L; });
  var recent = L > 10 ? pool.filter(function (p) { return (LAB.PART_DEPTH[p] || 1) > L - 20; }) : [];
  return recent.length && r.chance(0.5) ? r.pick(recent) : r.pick(pool);
}
LAB.partAt = partAt;

function connectedActive(active) {
  var NS = COLS * ROWS, start = -1, cnt = 0, s;
  for (s = 0; s < NS; s++) if (active[s]) { cnt++; if (start < 0) start = s; }
  if (start < 0) return false;
  var seen = {}, st = [start]; seen[start] = 1; var k = 0;
  while (st.length) {
    var u = st.pop(); k++;
    slotNeighbors(u).forEach(function (n) { if (active[n] && !seen[n]) { seen[n] = 1; st.push(n); } });
  }
  return k === cnt;
}

/* Без дверей: из каждой комнаты можно дойти только по своим коридорам. */
function checkSeparation(t, room) {
  var comp = new Int32Array(W * H);
  var cid = 0;
  for (var i = 0; i < W * H; i++) {
    if (comp[i] || (t[i] !== T_ROOM && t[i] !== T_CORR)) continue;
    cid++;
    var st = [i]; comp[i] = cid; var rooms = {}; var nRooms = 0;
    while (st.length) {
      var u = st.pop();
      if (room[u] >= 0 && !rooms[room[u]]) { rooms[room[u]] = 1; nRooms++; }
      var x = u % W, y = (u / W) | 0;
      var nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (var k = 0; k < 4; k++) {
        var nx = nb[k][0], ny = nb[k][1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        var j = ny * W + nx;
        if (comp[j] || (t[j] !== T_ROOM && t[j] !== T_CORR)) continue;
        comp[j] = cid; st.push(j);
      }
    }
    if (nRooms > 1) return false;
  }
  return true;
}

/* ── ЗАПРОСЫ К ЭТАЖУ ── */
LAB.inb = function (x, y) { return x >= 0 && y >= 0 && x < W && y < H; };
LAB.DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
/* Направления — относительно экрана: свайп вверх — вперёд, вниз — назад,
   влево и вправо — в стороны. Сторон света игра не называет. */
LAB.DIRN = { N: "впереди", S: "сзади", W: "слева", E: "справа" };
LAB.DIRTO = { N: "вперёд", S: "назад", W: "влево", E: "вправо" };
LAB.DIRFROM = { N: "спереди", S: "сзади", W: "слева", E: "справа" };
LAB.OPP = { N: "S", S: "N", E: "W", W: "E" };

/* Где точка относительно героя: «впереди», «справа», «впереди справа». */
LAB.dirWord = function (dx, dy) {
  var ns = dy < 0 ? "впереди" : dy > 0 ? "сзади" : "", ew = dx > 0 ? "справа" : dx < 0 ? "слева" : "";
  if (ns && ew) {
    if (Math.abs(dx) > 2 * Math.abs(dy)) return ew;
    if (Math.abs(dy) > 2 * Math.abs(dx)) return ns;
    return ns + " " + ew;
  }
  return ns || ew || "здесь";
};

/* Коридор, в котором клетка (или −1). */
LAB.corrOf = function (fl, x, y) { var c = fl.corrAt ? fl.corrAt[idx(x, y)] : -1; return c >= 0 ? fl.corrs[c] : null; };

/* Занята ли клетка предметом обстановки или жителем. */
LAB.solidAt = function (fl, x, y) {
  var i = idx(x, y);
  if (fl.objAt[i]) return true;
  for (var k = 0; k < fl.npcs.length; k++) if (fl.npcs[k].x === x && fl.npcs[k].y === y) return true;
  return false;
};

/* Поиск пути в ширину; doorsAsOpen — считать закрытые незапертые двери проходимыми. */
/* Буферы поиска пути — одни на все вызовы (враги ищут путь каждый такт):
   «посещено» отмечается номером поиска, без заливки всего массива. */
var bfsPrev = null, bfsSeen = null, bfsDepA = null, bfsQ = null, bfsGen = 0;
LAB.bfs = function (fl, st, sx, sy, goal, opts) {
  opts = opts || {};
  if (!bfsPrev || bfsPrev.length !== W * H) { bfsPrev = new Int32Array(W * H); bfsSeen = new Int32Array(W * H); bfsDepA = new Int16Array(W * H); bfsQ = new Int32Array(W * H); bfsGen = 0; }
  if (++bfsGen > 2000000000) { bfsSeen.fill(0); bfsGen = 1; }
  var prev = bfsPrev, seen = bfsSeen, gen = bfsGen;
  var s0 = idx(sx, sy);
  prev[s0] = -1; seen[s0] = gen;
  var q = bfsQ, qn = 1, qi = 0;
  q[0] = s0;
  var isGoal = typeof goal === "function" ? goal : function (x, y) { return x === goal[0] && y === goal[1]; };
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  /* maxDist — искать не дальше стольких шагов */
  var dep = opts.maxDist ? bfsDepA : null;
  if (dep) dep[s0] = 0;
  while (qi < qn) {
    var u = q[qi++];
    var x = u % W, y = (u / W) | 0;
    if (u !== s0 && isGoal(x, y)) {
      var path = [];
      for (var v = u; v !== s0; v = prev[v]) path.unshift([v % W, (v / W) | 0]);
      return path;
    }
    if (dep && dep[u] >= opts.maxDist) continue;
    for (var k = 0; k < 4; k++) {
      var nx = x + dirs[k][0], ny = y + dirs[k][1];
      if (!LAB.inb(nx, ny)) continue;
      var j = idx(nx, ny);
      if (seen[j] === gen) continue;
      var tt = fl.t[j];
      if (tt === T_WALL) continue;
      if (tt === T_DOOR) {
        var d = fl.doorAt[j];
        var openD = st && st.doors && st.doors[d.id] === 2;
        if (!openD) {
          if (!opts.passDoor || !opts.passDoor(d)) {
            if (!(opts.goalDoors && isGoal(nx, ny))) continue;
          }
        }
      }
      if (!isGoal(nx, ny) && (fl.objAt[j] || (opts.npcs !== false && LAB.solidAt(fl, nx, ny)))) continue;
      if (opts.block && opts.block(nx, ny) && !isGoal(nx, ny)) continue;
      prev[j] = u; seen[j] = gen; q[qn++] = j;
      if (dep) dep[j] = dep[u] + 1;
      if (opts.maxLen && qn > opts.maxLen) return null;
    }
  }
  return null;
};

/* Путь с наименьшим числом поворотов среди кратчайших — для навигатора:
   «двенадцать шагов вперёд, затем пять вправо», а не лесенкой. */
LAB.route = function (fl, st, sx, sy, goal, opts) {
  opts = opts || {};
  var N = W * H, INF = 1e9;
  var dist = new Float64Array(N * 4).fill(INF), prev = new Int32Array(N * 4).fill(-1);
  var isGoal = typeof goal === "function" ? goal : function (x, y) { return x === goal[0] && y === goal[1]; };
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  /* очередь по корзинам: стоимость шага — 1000, поворота — 1 */
  var buckets = {}, keys = [], s0 = idx(sx, sy);
  function push(state, c) { if (!buckets[c]) { buckets[c] = []; keys.push(c); keys.sort(function (a, b) { return a - b; }); } buckets[c].push(state); }
  for (var d0 = 0; d0 < 4; d0++) { dist[s0 * 4 + d0] = 0; }
  push(s0 * 4 + 0, 0); push(s0 * 4 + 1, 0); push(s0 * 4 + 2, 0); push(s0 * 4 + 3, 0);
  var found = -1, guard = 0;
  while (keys.length && guard++ < 400000) {
    var c = keys[0], bucket = buckets[c];
    var stt = bucket.pop();
    if (!bucket.length) { delete buckets[c]; keys.shift(); }
    if (dist[stt] < c) continue;
    var cell = (stt / 4) | 0, dir = stt % 4, x = cell % W, y = (cell / W) | 0;
    if (cell !== s0 && isGoal(x, y)) { found = stt; break; }
    for (var k = 0; k < 4; k++) {
      var nx = x + dirs[k][0], ny = y + dirs[k][1];
      if (!LAB.inb(nx, ny)) continue;
      var j = idx(nx, ny), tt = fl.t[j];
      if (tt === T_WALL) continue;
      if (tt === T_DOOR) {
        var dd = fl.doorAt[j];
        if (!(st && st.doors && st.doors[dd.id] === 2) && !(opts.passDoor && opts.passDoor(dd)) && !(opts.goalDoors && isGoal(nx, ny))) continue;
      }
      if (!isGoal(nx, ny) && (fl.objAt[j] || LAB.solidAt(fl, nx, ny))) continue;
      if (opts.block && opts.block(nx, ny) && !isGoal(nx, ny)) continue;
      var nc = c + 1000 + (cell === s0 || k === dir ? 0 : 1);
      var ns = j * 4 + k;
      if (nc < dist[ns]) { dist[ns] = nc; prev[ns] = stt; push(ns, nc); }
    }
  }
  if (found < 0) return null;
  var path = [];
  for (var v = found; v >= 0 && ((v / 4) | 0) !== s0; v = prev[v]) { var cc = (v / 4) | 0; path.unshift([cc % W, (cc / W) | 0]); }
  return path;
};

/* Прямая видимость по Брезенхэму: стены и закрытые двери заслоняют. */
/* Клетка закрывает обзор: стена или закрытая дверь (открытая — 2). */
function losBlock(fl, st, x, y) {
  var i = idx(x, y), tt = fl.t[i];
  if (tt === T_WALL) return true;
  if (tt === T_DOOR) { var d = fl.doorAt[i]; return !(st && st.doors && st.doors[d.id] === 2); }
  return false;
}
LAB.los = function (fl, st, x0, y0, x1, y1) {
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
  var x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    var e2 = 2 * err, mx = e2 > -dy, my = e2 < dx;
    /* (2.1) шаг по диагонали между двумя стенами (закрытыми дверями) — это
       угол: взгляд и выстрел его не огибают, иначе бьют «сквозь угол» */
    if (mx && my && losBlock(fl, st, x + sx, y) && losBlock(fl, st, x, y + sy)) return false;
    if (mx) { err -= dy; x += sx; }
    if (my) { err += dx; y += sy; }
    if (x === x1 && y === y1) break;
    if (losBlock(fl, st, x, y)) return false;
  }
  return true;
};

/* ── ПРОВЕРКА ПРОХОДИМОСТИ (для наборов проверок) ──
   Игрок приходит в U с пропусками прежних этажей; подбирает всё, что
   достижимо (вещи на полу и у врагов), открывает двери, к которым есть
   ключ; запускает установки и терминалы, слушает радиоприёмники. Загадки
   и схемы реле решает сам. Возвращает, дошёл ли он до выхода вниз и до
   лифта, и что он нашёл. */
LAB.solve = function (fl, have) {
  have = have || {};
  var tier = have.tier || 0, keys = {}, gatepass = !!have.gatepass, power = false, rubble = false, lockdown = false;
  var codes = {}, melodies = {};
  var got = { items: 0 };
  var changed = true, reach = null;
  var solid = new Uint8Array(W * H);
  fl.objs.forEach(function (o) { solid[idx(o.x, o.y)] = 1; });
  fl.npcs.forEach(function (n) { solid[idx(n.x, n.y)] = 1; });
  /* старт — свободная клетка рядом с объектом прибытия */
  var arrive = fl.objs.filter(function (o) { return o.type === "stairs_up" || o.type === "gate_sealed" || o.type === "wake"; })[0];
  var startX = -1, startY = -1;
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
    if (startX >= 0 || !arrive) return;
    var nx = arrive.x + d[0], ny = arrive.y + d[1];
    if (LAB.inb(nx, ny) && fl.t[idx(nx, ny)] === T_ROOM && !solid[idx(nx, ny)]) { startX = nx; startY = ny; }
  });
  function near(o) {
    var ds = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var k2 = 0; k2 < 4; k2++) { var nx = o.x + ds[k2][0], ny = o.y + ds[k2][1]; if (LAB.inb(nx, ny) && reach[idx(nx, ny)]) return true; }
    return false;
  }
  function canOpen(d) {
    var lk = d.lock;
    if (!lk) return true;
    if (lk.type === "secret") return false;
    if (lk.type === "card") return tier >= lk.tier;
    if (lk.type === "key") return !!keys[lk.key];
    if (lk.type === "code") return !!codes[lk.code];
    if (lk.type === "power") return power;
    if (lk.type === "rubble") return rubble;
    if (lk.type === "lockdown") return lockdown;
    if (lk.type === "gate") return gatepass;
    if (lk.type === "riddle" || lk.type === "circuit" || lk.type === "logic") return true;
    if (lk.type === "melody") return !!melodies[d.id];
    return false;
  }
  var guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    /* досягаемые клетки */
    reach = new Uint8Array(W * H);
    var q = [idx(startX, startY)]; reach[q[0]] = 1;
    while (q.length) {
      var u = q.pop(), x = u % W, y = (u / W) | 0;
      var nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (var k = 0; k < 4; k++) {
        var nx = nb[k][0], ny = nb[k][1];
        if (!LAB.inb(nx, ny)) continue;
        var j = idx(nx, ny);
        if (reach[j] || fl.t[j] === T_WALL || solid[j]) continue;
        if (fl.t[j] === T_DOOR && !canOpen(fl.doorAt[j])) continue;
        reach[j] = 1; q.push(j);
      }
    }
    var take = function (it) {
      if (it.kind === "key" && !keys[it.key]) { keys[it.key] = 1; changed = true; }
      if (it.kind === "pass" && it.tier > tier) { tier = it.tier; changed = true; }
      if (it.kind === "gatepass" && !gatepass) { gatepass = true; changed = true; }
      if (it.kind === "note" && it.code && !codes[it.code]) { codes[it.code] = 1; changed = true; }
      if (it.kind === "elevpass") got.elevpass = true;
      if (it.kind === "sample") got.sample = true;
      if (it.rub) got.rubbleKit = true; /* (3.0) домкрат или заряд для завала на лестнице */
    };
    fl.items.forEach(function (it) { if (reach[idx(it.x, it.y)]) take(it); });
    fl.foes.forEach(function (f) { if (reach[idx(f.x, f.y)] && f.carry) f.carry.forEach(take); });
    fl.objs.forEach(function (o) {
      if (!near(o)) return;
      if (o.type === "magnetron" && !power) { power = true; changed = true; }
      if (o.type === "positron" && !rubble) { rubble = true; changed = true; }
      if (o.type === "terminal" && o.lockdown && !lockdown) { lockdown = true; changed = true; }
      if ((o.type === "terminal" || o.type === "pc") && o.code && !codes[o.code]) { codes[o.code] = 1; changed = true; }
      if (o.type === "pc" && o.safeCode && !codes[o.safeCode]) { codes[o.safeCode] = 1; changed = true; }
      if (o.type === "radio" && o.melodyFor && !melodies[o.melodyFor]) { melodies[o.melodyFor] = 1; changed = true; }
      if (o.loot) o.loot.forEach(take);
    });
  }
  var downObj = fl.objs.filter(function (o) { return o.type === "stairs_down" || o.type === "gate_down" || o.type === "reactor"; })[0];
  var elevObj = fl.objs.filter(function (o) { return o.type === "elevator"; })[0];
  return {
    start: [startX, startY],
    down: !!downObj && near(downObj),
    elev: !!elevObj && near(elevObj),
    tier: tier, gatepass: gatepass, elevpass: !!got.elevpass, sample: !!got.sample, rubbleKit: !!got.rubbleKit,
    reach: reach
  };
};
})();
