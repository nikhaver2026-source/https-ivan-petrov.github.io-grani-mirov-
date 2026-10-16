/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — генератор комплекса.
   Уровни по двадцать этажей. Каждый этаж строится из зерна игры заново и
   всегда одинаково: сетка 4×3 ячеек по 22×22 клетки; в ячейке — помещение
   от пяти до десяти шагов в сторону, между соседними — прямой коридор
   шириной в четыре шага и длиной от десяти. С одной стороны коридор
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

var COLS = 4, ROWS = 3, SLOT = 22, CW = 4;
var W = 1 + COLS * SLOT + 1, H = 1 + ROWS * SLOT + 1;
LAB.W = W; LAB.H = H; LAB.COLS = COLS; LAB.ROWS = ROWS; LAB.CORR_W = CW;
var T_WALL = 0, T_ROOM = 1, T_CORR = 2, T_DOOR = 3;
LAB.T = { WALL: T_WALL, ROOM: T_ROOM, CORR: T_CORR, DOOR: T_DOOR };

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
LAB.makeWeapon = function (base, lvl, rank, qual, idHint) {
  var b = LAB.WEAPONS[base];
  var k = (1 + 0.14 * (lvl - 1)) * LAB.RANK_MULT[rank] * LAB.QUAL_MULT[qual];
  var w = {
    id: idHint || ("w" + (++weaponSeq) + "_" + base),
    base: base, g: b.g, rank: rank, qual: qual, lvl: lvl,
    dmg: Math.max(1, Math.round(b.dmg * k)),
    rng: b.rng, spread: b.spread, cap: b.cap ? b.cap + (rank >= 3 ? Math.ceil(b.cap * 0.25) : 0) : 0,
    cd: b.cd, ammo: b.ammo, dt: b.dt, mods: 0
  };
  w.charge = w.cap;
  w.name = LAB.QUAL[b.g][qual] + " " + b.n + (b.cls === "melee" && base !== "cutter" ? "" : " " + LAB.MODEL[base] + "-" + (1 + rank + Math.floor(lvl / 10)));
  return w;
};
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
LAB.genWeapon = function (r, L, F, opts) {
  opts = opts || {};
  var lvl = LAB.foeLevel(L, F);
  var P = recentPool(LAB.WEAPONS, function (k) { return LAB.WEAPON_DEPTH[k] || 99; }, L, function (k) { return k === "crowbar"; });
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
LAB.getFloor = function (seed, L, F) {
  var key = seed + ":" + L + ":" + F;
  if (floorCache[key]) return floorCache[key];
  var fl = null;
  for (var attempt = 0; attempt < 60 && !fl; attempt++) fl = genFloor(seed, L, F, attempt);
  if (!fl) throw new Error("этаж не построился: " + key);
  floorCache[key] = fl;
  cacheOrder.push(key);
  if (cacheOrder.length > 16) delete floorCache[cacheOrder.shift()];
  return fl;
};
LAB.clearFloorCache = function () { floorCache = {}; cacheOrder = []; };

function idx(x, y) { return y * W + x; }
LAB.idx = idx;

/* Помещение в ячейке: всегда накрывает две средние клетки ячейки по обеим
   осям — так у соседей всегда есть общая полоса для прямого коридора. */
function placeRoom(r, s, w, h) {
  var p = slotXY(s), sx = 1 + p.i * SLOT, sy = 1 + p.j * SLOT;
  var x0 = r.int(Math.max(sx + 6, sx + 12 - w), Math.min(sx + 10, sx + 16 - w));
  var y0 = r.int(Math.max(sy + 6, sy + 12 - h), Math.min(sy + 10, sy + 16 - h));
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
      : L === 2 ? { card: 30, key: 25, code: 25, lockdown: 10, power: 10, riddle: 8 }
      : { card: 25, key: 20, code: 20, lockdown: 10, power: 15, rubble: 10, riddle: 9, circuit: 10 };
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
  var t = new Uint8Array(W * H), room = new Int8Array(W * H), corrAt = new Int16Array(W * H);
  for (i = 0; i < W * H; i++) { room[i] = -1; corrAt[i] = -1; }
  var rooms = [];
  var bossSlot = F === NF ? parent[D] : -1;
  for (s = 0; s < NS; s++) {
    if (!active[s]) continue;
    var special = s === U || s === D || s === E;
    var w = r.int(5, 9), hh = r.int(5, 9);
    if (r.chance(0.35)) { w = Math.min(w, 7); hh = Math.min(hh, 7); }
    if (special) { w = Math.max(6, Math.min(8, w)); hh = Math.max(6, Math.min(8, hh)); }
    if (s === secret) { w = 5; hh = 5; }
    if (s === bossSlot) { w = 9 + r.int(0, 1); hh = 9 + r.int(0, 1); }
    if (F === NF && s === D) { w = reactor ? 10 : 8; hh = reactor ? 10 : 8; }
    var pr = placeRoom(r, s, w, hh);
    var rm = { id: s, x0: pr.x0, y0: pr.y0, x1: pr.x1, y1: pr.y1, zone: zone[s], doors: [], mouths: [] };
    rm.cx = Math.floor((rm.x0 + rm.x1) / 2); rm.cy = Math.floor((rm.y0 + rm.y1) / 2);
    rooms[s] = rm;
    for (var yy = rm.y0; yy <= rm.y1; yy++) for (var xx = rm.x0; xx <= rm.x1; xx++) { t[idx(xx, yy)] = T_ROOM; room[idx(xx, yy)] = s; }
  }

  /* 7. Коридоры: прямая полоса в четыре шага между стенами соседних
     помещений; у помещения-ребёнка — дверь в одну клетку, у другого —
     открытый проход в две клетки. */
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
    var b0 = r.int(i0 - 1, i1 - 2);            /* первая клетка полосы поперёк */
    var a0 = horiz ? lo.x1 + 2 : lo.y1 + 2;     /* первая клетка полосы вдоль */
    var a1 = horiz ? hi.x0 - 2 : hi.y0 - 2;
    if (a1 - a0 + 1 < 10) return null;
    var cor = { id: ei, a: e.a, b: e.b, axis: horiz ? "h" : "v", len: a1 - a0 + 1, door: null, mouth: [] };
    cor.x0 = horiz ? a0 : b0; cor.x1 = horiz ? a1 : b0 + CW - 1;
    cor.y0 = horiz ? b0 : a0; cor.y1 = horiz ? b0 + CW - 1 : a1;
    for (var ya = cor.y0; ya <= cor.y1; ya++) for (var xa = cor.x0; xa <= cor.x1; xa++) {
      var ii = idx(xa, ya);
      if (t[ii] !== T_WALL) return null; /* пересечение — строим заново */
      t[ii] = T_CORR; corrAt[ii] = ei;
    }
    /* концы: стена помещения lo — на a0 − 1, стена hi — на a1 + 1 */
    var childLo = rooms[e.child] === lo;
    var dAlong = childLo ? a0 - 1 : a1 + 1, mAlong = childLo ? a1 + 1 : a0 - 1;
    var dAcross = b0 + 1 + (r.chance(0.5) ? 1 : 0);
    var dx = horiz ? dAlong : dAcross, dy = horiz ? dAcross : dAlong;
    for (var mk = 1; mk <= 2; mk++) {
      var mx = horiz ? mAlong : b0 + mk, my = horiz ? b0 + mk : mAlong;
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
  var cardHidden = false, needSec = false;
  for (var li2 = 0; li2 < lockList.length; li2++) {
    var lc = lockList[li2], lock = locks[lc];
    var spots = keySpots(lc).filter(function (n) { return n !== secret; });
    if (!spots.length) return null;
    var same = spots.filter(function (n) { return zone[n] === zone[parent[lc]] && n !== U; });
    var pickSpot = function () { return (same.length && r.chance(0.7)) ? r.pick(same) : r.pick(spots); };
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
    /* иногда вещь — у врага рядом: «пропуска добываются с монстров» */
    if (r.chance(0.35) && spot !== U) {
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

  /* 12. Начальное оружие и первый урок. */
  if (L === 1 && F === 1) {
    var z0 = [];
    for (s = 0; s < NS; s++) if (main[s] && zone[s] === -1 && s !== U) z0.push(s);
    var ws = z0.length ? r.pick(z0) : U;
    addItem({ kind: "weapon", w: LAB.makeWeapon("spark", 1, 0, 1, "w_start_spark") }, ws);
    addItem({ kind: "ammo", ammo: "energy", n: 2 }, ws);
    addItem({ kind: "armor", a: LAB.makeArmor("suit", 1, 1, "a_start_suit") }, ws);
    addItem({ kind: "item", item: "medkit_s", n: 1 }, U);
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
      if (ot === "puzzle") extra2 = { kind: r.pick(["sort", "relays", "bulls", "riddle"]), seed: r.int(1, 99999) };
      if (ot === "radio") extra2 = { band: r.int(0, 999) };
      var o2 = addObj(ot, s, extra2);
      if (o2 && (ot === "crate" || ot === "locker" || ot === "safe" || ot === "desk" || ot === "corpse")) o2.loot = genLoot(r, L, F, ot, def.loot);
      if (o2 && (ot === "pc" || ot === "puzzle")) o2.loot = genLoot(r, L, F, "desk", def.loot);
      if (o2 && ot === "safe") {
        /* код сейфа — в записке где-то на этаже, достижимой без замков после сейфа */
        var ss = keySpotsForRoom(s), sPick = r.pick(ss);
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
  for (var ik in LAB.ITEMS) { var idf = LAB.ITEMS[ik]; if (idf.kind !== "part" && idf.depth && idf.depth <= L && idf.depth > L - 25) bItems.push(ik); }
  for (nb2 = bItems.length ? r.int(0, 2) : 0; nb2 > 0; nb2--) addItem({ kind: "item", item: r.pick(bItems), n: 1 }, anyRoom());
  for (nb2 = r.int(3, 6); nb2 > 0; nb2--) addItem({ kind: "item", item: partAt(r, L), n: 1 + (r.chance(0.3) ? 1 : 0) }, anyRoom());
  if (r.chance(Math.min(0.2, 0.07 + L * 0.006))) addItem({ kind: "armor", a: LAB.genArmor(r, L, F) }, anyRoom());
  for (nb2 = r.int(2, 4); nb2 > 0; nb2--) addItem({ kind: "credits", n: LAB.credits(8 + r.int(0, 25), L, F) }, anyRoom());
  if (r.chance(0.3) || (F % 5 === 3)) addItem({ kind: "weapon", w: LAB.genWeapon(r, L, F) }, anyRoom());
  if (r.chance(0.07)) addItem({ kind: "chip", implant: r.pick(LAB.IMPLANTS.slice(1)).id }, anyRoom());
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
    if (r.chance(0.3)) addItem({ kind: "chip", implant: r.pick(LAB.IMPLANTS.slice(1)).id }, secret);
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
    f2.iq = LAB.foeIQ(base.kind, d0, aff.length) + (f2.boss ? 2 : 0);
    fl.foes.push(f2);
    itemCell[idx(x, y)] = 1;
    return f2;
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
      if (edge && across !== 0 && across !== CW - 1) continue;
      var dd2 = dObj ? Math.abs(dObj.x - x6) + Math.abs(dObj.y - y6) : 0;
      if (nearDoor && dd2 > 3) continue;
      if (!nearDoor && dd2 < 3) continue;
      cand.push([x6, y6]);
    }
    return cand.length ? r.pick(cand) : null;
  }
  var soft = L === 1 && F <= 2;
  for (s = 0; s < NS; s++) {
    var rm6 = rooms[s];
    if (!rm6 || s === U || s === secret) continue;
    if (L === 1 && F === 1 && zone[s] === -1 && r.chance(0.6)) continue; /* мягкое начало */
    /* тварей и роботов много: почти в каждом помещении, глубже — стаями */
    var p6 = Math.min(0.93, 0.62 + 0.03 * Math.min(L, 10) + d0 * 0.00008 + (F === NF ? 0.1 : 0));
    if (s === E) p6 *= 0.5;
    if (soft) p6 *= 0.75; /* первые шаги после пробуждения */
    if (!r.chance(p6)) continue;
    var fid2 = r.pick(foePool);
    var beh = LAB.FOES[fid2].beh;
    var big = (rm6.x1 - rm6.x0 + 1) * (rm6.y1 - rm6.y0 + 1) >= 49 ? 1 : 0;
    var cnt = beh.indexOf("swarm") >= 0 ? r.int(3, 4) : 1 + (r.chance(Math.min(0.85, 0.45 + Math.min(L, 10) * 0.03 + d0 * 0.0002)) ? 1 : 0) + (r.chance(Math.min(0.6, 0.1 + Math.min(L, 10) * 0.025 + d0 * 0.0002)) ? 1 : 0) + (big && r.chance(0.3) ? 1 : 0);
    for (var q = 0; q < cnt; q++) addFoe(q === 0 ? fid2 : (r.chance(0.6) ? fid2 : r.pick(foePool)), s);
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
    for (var c8 = r.chance(0.6) ? r.int(1, 2) : 0; c8 > 0; c8--) addFoe(r.pick(clPool), r.pick(mainRooms));
  }
  /* патрули в коридорах: с второго этажа */
  var patPool = foePool.filter(function (fid) { var b2 = LAB.FOES[fid]; return b2.kind === "mech" && (b2.beh.indexOf("patrol") >= 0 || b2.beh.indexOf("ranged") >= 0) && b2.beh.indexOf("stationary") < 0; });
  if (patPool.length && !soft) {
    var nP = r.chance(Math.min(0.85, 0.3 + d0 * 0.003)) ? 1 + (d0 >= 60 && r.chance(0.5) ? 1 : 0) + (d0 >= 300 && r.chance(0.4) ? 1 : 0) : 0;
    var pCors = r.shuffle(corrs.filter(function (cr) { return cr.doorRoom !== U && cr.mouthRoom !== U && cr.doorRoom !== secret && cr.mouthRoom !== secret; }));
    for (var p7 = 0; p7 < nP && pCors.length; p7++) {
      var pc = corrCell(pCors[p7 % pCors.length], false, false);
      if (pc) makeFoe(r.pick(patPool), pc[0], pc[1], -1, { corr: pCors[p7 % pCors.length].id, patrol: true });
    }
  }

  /* 17. Выжившие, дружественные роботы, станции имплантов, штабы фракций. */
  var quietRooms = [];
  for (s = 0; s < NS; s++) {
    if (!rooms[s] || s === U || s === D || s === E || s === secret || !main[s]) continue;
    if (fl.foes.some(function (f3) { return f3.room === s && !LAB.FOES[f3.type].beh.some(function (b) { return b === "cleaner"; }); })) continue;
    quietRooms.push(s);
  }
  r.shuffle(quietRooms);
  if (quietRooms.length && r.chance(L <= 9 ? 0.32 : 0.25)) {
    var ns = quietRooms.shift();
    var sv = makeSurvivor(r, L, F, ns, rooms[ns]);
    var cS = freeCell(ns);
    if (cS) { sv.x = cS[0]; sv.y = cS[1]; objCell[idx(sv.x, sv.y)] = 1; fl.npcs.push(sv); }
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

  /* торговые терминалы, мастерские — по расписанию; верстак — на каждом третьем этаже */
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
  if (F % 3 === 0 && !hasObj("workbench")) { if (!addSvc("workbench", null, startZone)) return null; }
  /* компьютер с почтой сотрудников — почти на каждом этаже; кофе или напитки — на многих */
  if (!hasObj("pc") && svcRooms.length && r.chance(0.85)) addObj("pc", r.pick(svcRooms), { own: r.int(0, 99999), locked: r.chance(0.15) });
  if (!hasObj("coffee") && !hasObj("drinks") && svcRooms.length && r.chance(0.6)) addObj(r.chance(0.55) ? "coffee" : "drinks", r.pick(svcRooms), { broken: r.chance(0.1) });
  /* турели этажа отключаются и взламываются с терминала безопасности: он есть, если есть турели */
  if (turrets && !fl.objs.some(function (o) { return o.type === "terminal" && o.sub === "sec"; })) addSvc("terminal", { sub: "sec" }, startZone);
  /* научный терминал — карта этажа для навигатора; бывает не всегда */
  if (!fl.objs.some(function (o) { return o.type === "terminal" && (o.sub === "sec" || o.sub === "sci"); }) && r.chance(0.55)) addSvc("terminal", { sub: "sci" });
  /* говорящая панель ОКО, стенд с головоломкой, радиоприёмник */
  if (L >= 2 && !hasObj("okoterm") && r.chance(0.3)) addSvc("okoterm", { seed: r.int(1, 99999) });
  if (!hasObj("puzzle") && r.chance(0.28)) { var pz = addSvc("puzzle", { kind: r.pick(["sort", "relays", "bulls", "riddle"]), seed: r.int(1, 99999) }); if (pz) pz.loot = genLoot(r, L, F, "safe", "tech"); }
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
  if (!(L === 1 && F <= 2)) {
    var nPost = function () { return 1 + (rg.chance(Math.min(0.75, 0.2 + d0 * 0.004)) ? 1 : 0) + (d0 >= 120 && rg.chance(0.4) ? 1 : 0); };
    var objOf = function (tp) { return fl.objs.filter(function (o) { return o.type === tp; })[0]; };
    for (var g1 = nPost(); g1 > 0; g1--) addGuard(E, objOf("elevator"), "lift");
    if (F < NF) for (var g2 = nPost(); g2 > 0; g2--) addGuard(D, objOf("stairs_down"), "stairs");
    for (s = 0; s < NS; s++) {
      if (!rooms[s] || !main[s] || s === U || s === D || s === E || s === secret || s === bossSlot) continue;
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

  fl.sample = d0;
  fl.turrets = turrets;
  return fl;
}

function makeSurvivor(r, L, F, s, rm) {
  var female = r.chance(0.5);
  var first = r.pick(female ? LAB.NAMES.f : LAB.NAMES.m);
  var last = r.pick(female ? LAB.NAMES.sf : LAB.NAMES.sm);
  var profs = Object.keys(LAB.PROFS).filter(function (p) { var b = LAB.PROFS[p].block; return !b || b === LAB.blockOf(L); });
  var own = profs.filter(function (p) { return LAB.PROFS[p].block === LAB.blockOf(L); });
  var prof = own.length && r.chance(0.6) ? r.pick(own) : r.pick(profs);
  var c = [r.int(rm.x0, rm.x1), r.int(rm.y0, rm.y1)];
  return { id: "n0", robot: false, n: first + " " + last, first: first, last: last, female: female, prof: prof,
    x: c[0], y: c[1], room: s, tier: 1 + Math.floor(L / 3), key: L + "-" + F + "-s", life: r.int(0, 99), view: r.int(0, 99) };
}

/* Добыча контейнеров: склонность комнаты влияет на состав. */
function genLoot(r, L, F, ot, tag) {
  var out = [];
  var n = ot === "safe" ? 3 : ot === "crate" ? r.int(1, 3) : r.int(0, 2);
  var ammoAt = function () {
    var pool = [];
    for (var k in LAB.AMMO) if ((LAB.AMMO[k].depth || 1) <= L) pool.push(k);
    var recent = pool.filter(function (k) { return (LAB.AMMO[k].depth || 1) > L - 20 && k !== "energy"; });
    return recent.length && r.chance(0.5) ? r.pick(recent) : r.chance(0.7) ? "energy" : r.pick(pool);
  };
  for (var i = 0; i < n; i++) {
    var roll = r.next();
    if (tag === "arms" && roll < 0.35) out.push({ kind: "ammo", ammo: ammoAt(), n: 1 });
    else if (tag === "med" && roll < 0.45) out.push({ kind: "item", item: (function (q) { return q < 0.42 ? "medkit_s" : q < 0.58 ? "bandage" : q < 0.7 ? "sorbent" : q < 0.79 ? "neuroblock" : q < 0.86 ? "antidote" : "medkit_l"; })(r.next()), n: 1 });
    else if (tag === "parts" && roll < 0.5) out.push({ kind: "item", item: L >= 3 && r.chance(0.2) ? "ceramic" : partAt(r, L), n: 1 });
    else if (tag === "tech" && roll < 0.45) out.push({ kind: "item", item: L >= 5 && r.chance(0.15) ? "supercond" : r.chance(0.5) ? r.pick(["chip", "cap", "lens", "wire"]) : partAt(r, L), n: 1 });
    else if (tag === "bio" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.6) ? r.pick(["gel", "reagent", "gel"]) : partAt(r, L), n: 1 });
    else if (tag === "chem" && roll < 0.45) out.push({ kind: "item", item: r.pick(["reagent", "gel", "antidote", "sorbent", "reagent"]), n: 1 });
    else if (tag === "food" && roll < 0.4) out.push({ kind: "item", item: r.pick(["ration", "stew", "crackers", "crackers", "choco", "protein", "nuts", "noodles", "glucose", "stim", "medkit_s"]), n: 1 });
    else if (tag === "paper" && roll < 0.4) out.push({ kind: "note", note: "staff", n: r.int(0, 999) });
    else if (tag === "armor" && roll < 0.2) out.push({ kind: "armor", a: LAB.genArmor(r, L, F) });
    else if (tag === "armor" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.5) ? "plate" : (L >= 3 ? "ceramic" : "scrap"), n: 1 });
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
  }
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

/* Проходима ли клетка (state — состояние этажа: открытые двери). */
LAB.solidAt = function (fl, x, y) {
  var i = idx(x, y);
  if (fl.objAt[i]) return true;
  for (var k = 0; k < fl.npcs.length; k++) if (fl.npcs[k].x === x && fl.npcs[k].y === y) return true;
  return false;
};
LAB.walkable = function (fl, st, x, y, who) {
  if (!LAB.inb(x, y)) return false;
  var i = idx(x, y), tt = fl.t[i];
  if (tt === T_WALL) return false;
  if (LAB.solidAt(fl, x, y)) return false;
  if (tt === T_DOOR) {
    var d = fl.doorAt[i];
    var open = st && st.doors && st.doors[d.id] === 2;
    if (open) return true;
    if (who === "foe") return false;
    return false;
  }
  return true;
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
LAB.los = function (fl, st, x0, y0, x1, y1) {
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
  var x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    if (x === x1 && y === y1) break;
    var i = idx(x, y), tt = fl.t[i];
    if (tt === T_WALL) return false;
    if (tt === T_DOOR) { var d = fl.doorAt[i]; if (!(st && st.doors && st.doors[d.id] === 2)) return false; }
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
    if (lk.type === "riddle" || lk.type === "circuit") return true;
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
    tier: tier, gatepass: gatepass, elevpass: !!got.elevpass, sample: !!got.sample,
    reach: reach
  };
};
})();
