/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — генератор комплекса.
   10 уровней × 20 этажей. Каждый этаж строится из зерна игры заново и
   всегда одинаково: сетка 4×3 ячеек по 8×8 клеток, в ячейках — комнаты,
   между соседними — коридоры с дверью. Остов этажа — дерево комнат от
   точки прибытия; замки ставятся на рёбра дерева, ключ к замку всегда
   лежит до замка (в зоне, достижимой без него). Лифт этажа — в начальной
   зоне, поэтому приехавший на лифте никогда не заперт. Между уровнями —
   только гермошлюз вниз на двадцатом этаже; за спиной он запечатывается.
   Без DOM — работает и в Node (проверки проходимости всех 200 этажей).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

var COLS = 4, ROWS = 3, SLOT = 8;
var W = 1 + COLS * SLOT + 1, H = 1 + ROWS * SLOT + 1;
LAB.W = W; LAB.H = H; LAB.COLS = COLS; LAB.ROWS = ROWS;
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
  if (planCache[seed]) return planCache[seed];
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
    G[L] = g; /* шлюз L→L+1 (на 10-м уровне — зал реактора) */
  }
  for (L = 1; L <= NL; L++) {
    P[L] = []; blocked[L] = [];
    for (F = 1; F < NF; F++) {
      var U = F === 1 ? (L === 1 ? start : G[L - 1]) : P[L][F - 1];
      var cand = [];
      for (var s = 0; s < COLS * ROWS; s++) {
        if (s === E[L] || s === U) continue;
        if (F === NF - 1 && s === G[L]) continue;
        /* у шлюза двадцатого этажа должен быть сосед для зала босса */
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
  planCache[seed] = plan;
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
LAB.genWeapon = function (r, L, F, opts) {
  opts = opts || {};
  var lvl = LAB.foeLevel(L, F);
  var pool = [], k;
  for (k in LAB.WEAPON_DEPTH) if (LAB.WEAPON_DEPTH[k] <= L && k !== "crowbar") pool.push(k);
  var base = opts.base || r.pick(pool);
  var roll = r.next() + L * 0.025 + (opts.bonus || 0);
  var rank = roll < 0.5 ? 0 : roll < 0.76 ? 1 : roll < 0.9 ? 2 : roll < 0.97 ? 3 : roll < 0.995 ? 4 : 5;
  var q = r.next() + L * 0.02 + (opts.bonus || 0) * 0.5;
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
  for (var attempt = 0; attempt < 40 && !fl; attempt++) fl = genFloor(seed, L, F, attempt);
  if (!fl) throw new Error("этаж не построился: " + key);
  floorCache[key] = fl;
  cacheOrder.push(key);
  if (cacheOrder.length > 24) delete floorCache[cacheOrder.shift()];
  return fl;
};
LAB.clearFloorCache = function () { floorCache = {}; cacheOrder = []; };

function idx(x, y) { return y * W + x; }
LAB.idx = idx;

function genFloor(seed, L, F, attempt) {
  var r = Rng(seed, "floor:" + L + ":" + F + ":" + attempt);
  var NF = LAB.FLOORS_N, lev = LAB.LEVELS[L];
  var sl = LAB.floorSlots(seed, L, F);
  var U = sl.U, D = sl.D, E = sl.E;
  var NS = COLS * ROWS, s, i;
  var d0 = LAB.depth(L, F);

  /* 1. Какие ячейки заняты комнатами. */
  var active = [];
  for (s = 0; s < NS; s++) active[s] = true;
  var holes = r.int(0, 2);
  for (i = 0; i < holes; i++) {
    var h = r.int(0, NS - 1);
    if (h === U || h === D || h === E) continue;
    active[h] = false;
    if (!connectedActive(active)) active[h] = true;
  }
  /* 2. Тайная комната: лист, соединённый с остальными одной тайной дверью. */
  var secret = -1;
  if (r.chance(0.6)) {
    var sc = [];
    for (s = 0; s < NS; s++) {
      if (!active[s] || s === U || s === D || s === E) continue;
      var test = active.slice(); test[s] = false;
      if (!connectedActive(test)) continue;
      var nb = slotNeighbors(s).filter(function (n) { return active[n]; });
      if (nb.length) sc.push(s);
    }
    if (sc.length) secret = r.pick(sc);
  }
  var main = [];
  for (s = 0; s < NS; s++) main[s] = active[s] && s !== secret;
  if (!connectedActive(main)) return null;

  /* 3. Остовное дерево от точки прибытия U (случайный поиск в глубину). */
  var parent = [], seen = [], order = [];
  for (s = 0; s < NS; s++) { parent[s] = -1; seen[s] = false; }
  /* на двадцатом этаже шлюз (D) — лист дерева: за ним ничего нет */
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
  var nLocks = 1 + Math.floor((L - 1) / 3) + (r.chance(0.5) ? 1 : 0);
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
    /* шлюз — за залом босса; зал босса — не прибытие и не лифтовой холл */
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
      : L === 2 ? { card: 30, key: 25, code: 25, lockdown: 10, power: 10 }
      : { card: 25, key: 20, code: 20, lockdown: 10, power: 15, rubble: 10 };
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
  /* Можно ли пройти из корня к узлу n, не открывая замок на ребре lockChild
     и вообще никаких замков, кроме предков lockChild. */
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
  var edges = [];  /* {a, b, child, tree} */
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
  if (secret >= 0) {
    var snb = slotNeighbors(secret).filter(function (n) { return main[n]; });
    var sa = r.pick(snb);
    edges.push({ a: sa, b: secret, child: secret, tree: false, secret: true });
  }

  /* 6. Геометрия: комнаты в ячейках. */
  var t = new Uint8Array(W * H), room = new Int8Array(W * H);
  for (i = 0; i < W * H; i++) room[i] = -1;
  var rooms = [];
  var bossSlot = F === NF ? parent[D] : -1;
  for (s = 0; s < NS; s++) {
    if (!active[s]) continue;
    var p2 = slotXY(s), sx = 1 + p2.i * SLOT, sy = 1 + p2.j * SLOT;
    var special = s === U || s === D || s === E;
    var w = r.int(3, 5), hh = r.int(3, 5);
    if (s === secret) { w = r.int(2, 3); hh = r.int(2, 3); }
    if (s === bossSlot || (F === NF && s === D)) { w = 5; hh = 5; }
    if (special && w < 4 && r.chance(0.5)) w = 4;
    var x0 = r.int(sx + 1, sx + 6 - w), y0 = r.int(sy + 1, sy + 6 - hh);
    var rm = { id: s, x0: x0, y0: y0, x1: x0 + w - 1, y1: y0 + hh - 1, zone: zone[s], doors: [] };
    rm.cx = Math.floor((rm.x0 + rm.x1) / 2); rm.cy = Math.floor((rm.y0 + rm.y1) / 2);
    rooms[s] = rm;
    for (var yy = rm.y0; yy <= rm.y1; yy++) for (var xx = rm.x0; xx <= rm.x1; xx++) { t[idx(xx, yy)] = T_ROOM; room[idx(xx, yy)] = s; }
  }

  /* 7. Коридоры и двери. */
  var doors = [], doorAt = {};
  var corrOf = {}; /* клетка коридора → номер двери (ребра) */
  for (var ei = 0; ei < edges.length; ei++) {
    var e = edges[ei];
    var A = rooms[e.a], B = rooms[e.b];
    var pa = slotXY(e.a), pb = slotXY(e.b);
    var cells = [];
    if (pa.j === pb.j) { /* по горизонтали */
      var Lr = pa.i < pb.i ? A : B, Rr = pa.i < pb.i ? B : A;
      var li = Math.min(pa.i, pb.i);
      var gx = 1 + li * SLOT + 7;
      var ya = r.int(Lr.y0, Lr.y1), yb = r.int(Rr.y0, Rr.y1);
      var xq;
      for (xq = Lr.x1 + 1; xq <= gx; xq++) cells.push([xq, ya]);
      var st = ya < yb ? 1 : -1;
      for (var yq = ya + st; yb !== ya && yq !== yb + st; yq += st) cells.push([gx, yq]);
      for (xq = gx + 1; xq <= Rr.x0 - 1; xq++) cells.push([xq, yb]);
      e.ends = pa.i < pb.i ? { a: cells[0], b: cells[cells.length - 1] } : { a: cells[cells.length - 1], b: cells[0] };
    } else { /* по вертикали */
      var Tr = pa.j < pb.j ? A : B, Br = pa.j < pb.j ? B : A;
      var tj = Math.min(pa.j, pb.j);
      var gy = 1 + tj * SLOT + 7;
      var xa = r.int(Tr.x0, Tr.x1), xb = r.int(Br.x0, Br.x1);
      var yq2;
      for (yq2 = Tr.y1 + 1; yq2 <= gy; yq2++) cells.push([xa, yq2]);
      var st2 = xa < xb ? 1 : -1;
      for (var xq2 = xa + st2; xb !== xa && xq2 !== xb + st2; xq2 += st2) cells.push([xq2, gy]);
      for (yq2 = gy + 1; yq2 <= Br.y0 - 1; yq2++) cells.push([xb, yq2]);
      e.ends = pa.j < pb.j ? { a: cells[0], b: cells[cells.length - 1] } : { a: cells[cells.length - 1], b: cells[0] };
    }
    for (var ci = 0; ci < cells.length; ci++) {
      var ii = idx(cells[ci][0], cells[ci][1]);
      if (t[ii] !== T_WALL) return null; /* пересечение — строим заново */
      t[ii] = T_CORR; corrOf[ii] = ei;
    }
    var dEnd = e.child === e.a ? e.ends.a : e.ends.b;
    var dRoom = rooms[e.child];
    var dirFromRoom = dEnd[0] > dRoom.x1 ? "E" : dEnd[0] < dRoom.x0 ? "W" : dEnd[1] > dRoom.y1 ? "S" : "N";
    var lk2 = e.tree ? locks[e.child] : null;
    var door = {
      id: "d" + doors.length, x: dEnd[0], y: dEnd[1], a: e.a, b: e.b, room: e.child, side: dirFromRoom,
      other: e.child === e.a ? e.b : e.a,
      kind: e.secret ? "secret" : lk2 && (lk2.type === "gate" || lk2.type === "power") ? "heavy" : (r.chance(0.8) ? "auto" : "hatch"),
      lock: e.secret ? { type: "secret" } : (lk2 ? JSON.parse(JSON.stringify(lk2)) : null),
      tree: e.tree, lockChild: e.tree && lk2 ? e.child : -1
    };
    t[idx(door.x, door.y)] = T_DOOR;
    doors.push(door);
    doorAt[idx(door.x, door.y)] = door;
    rooms[e.a].doors.push(door.id); rooms[e.b].doors.push(door.id);
  }
  /* Проверка: без дверей каждая связная часть содержит ровно одну комнату. */
  if (!checkSeparation(t, room)) return null;

  /* 8. Типы комнат. */
  var names = r.shuffle(lev.rooms.slice());
  var ni = 0;
  for (s = 0; s < NS; s++) {
    var rmm = rooms[s];
    if (!rmm) continue;
    var type;
    if (s === secret) type = "secret";
    else if (s === U) type = (L === 1 && F === 1) ? "wake" : (F === 1 ? "gatein" : "stair");
    else if (s === D) type = F === NF ? (L === LAB.LEVELS_N ? "reactor" : "gate") : "stair";
    else if (s === E) type = "lift";
    else { type = names[ni % names.length]; ni++; }
    rmm.type = type;
    rmm.name = LAB.ROOMS[type].n;
    rmm.surf = lev.surf; /* у каждого уровня свой пол */
  }

  var fl = {
    seed: seed, L: L, F: F, W: W, H: H, t: t, room: room, rooms: rooms, doors: doors, doorAt: doorAt,
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
    for (var c = 0; c < cand2.length; c++) {
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
      if (objCell[idx(x5, y5)]) continue;
      if (fl.foes.some(function (q) { return q.x === x5 && q.y === y5; })) continue;
      cand5.push([x5, y5]);
    }
    return cand5.length ? r.pick(cand5) : null;
  }
  var foeSeq = 0;

  /* 9. Особые предметы обстановки. */
  var ur = rooms[U], dr = rooms[D], er = rooms[E], okS;
  if (L === 1 && F === 1) okS = addObj("wake", U, null, [ur.cx, ur.cy]);
  else if (F === 1) okS = addObj("gate_sealed", U, null, [ur.cx, ur.cy]);
  else okS = addObj("stairs_up", U, { to: { L: L, F: F - 1 }, blocked: sl.upBlocked }, [ur.cx, ur.cy]);
  if (!okS) return null;
  if (F === NF && L === LAB.LEVELS_N) okS = addObj("reactor", D, null, [dr.cx, dr.cy]);
  else if (F === NF) okS = addObj("gate_down", D, { to: { L: L + 1, F: 1 } }, [dr.cx, dr.cy]);
  else okS = addObj("stairs_down", D, { to: { L: L, F: F + 1 }, blocked: sl.downBlocked }, [dr.cx, dr.cy]);
  if (!okS) return null;
  if (!addObj("elevator", E, null, [er.cx, er.cy])) return null;
  /* капсула восстановления — в начальной зоне, у прибытия */
  if (!(L === 1 && F === 1)) addObj("capsule", U);

  /* 10. Всё, что нужно для замков, — до замка. */
  var codeSeq = 0, cardHidden = false;
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
      var sp = pickSpot();
      if (r.chance(0.3)) {
        addObj("terminal", sp, { sub: "sec", codeFor: door2.id, codeRoom: roomName, code: code }) || addItem({ kind: "note", note: "code", code: code, room: roomName }, sp);
      } else addItem({ kind: "note", note: "code", code: code, room: roomName }, sp);
      codeSeq++;
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
    } else if (lock.type === "gate") {
      /* шлюзовая ключ-карта: у стража в зале перед шлюзом или спрятана на этаже */
      door2.lock.pass = "gate" + L;
      if (L < LAB.LEVELS_N && lev.card === "hidden") {
        var hs = spots.filter(function (n) { return n !== U && n !== E && n !== parent[D]; });
        placeRequirement({ kind: "gatepass", L: L }, hs.length ? r.pick(hs) : r.pick(spots), lc);
        cardHidden = true;
      }
    }
  }
  function placeRequirement(it, spot, lockChild) {
    /* иногда вещь — у врага рядом: «пропуска добываются с монстров» */
    if (r.chance(0.35) && spot !== U) {
      var pool = lev.foes.filter(function (fid) { return LAB.FOES[fid].carrier; });
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
      if (!r.chance(obj[ot])) continue;
      if ((ot === "magnetron" || ot === "positron") && L < 2) continue;
      if (ot === "positron" && L < 3) continue;
      var extra2 = null;
      if (ot === "terminal") extra2 = { sub: r.pick(["sec", "sci", "eng", "sci"]) };
      if (ot === "safe") extra2 = { code: String(r.int(1000, 9999)), locked: true };
      if (ot === "locker") extra2 = { locked: r.chance(0.25) };
      var o2 = addObj(ot, s, extra2);
      if (o2 && (ot === "crate" || ot === "locker" || ot === "safe" || ot === "desk" || ot === "corpse")) o2.loot = genLoot(r, L, F, ot, def.loot);
      if (o2 && ot === "safe") {
        /* код сейфа — в записке где-то на этаже, достижимой без замков после сейфа */
        var ss = keySpotsForRoom(s);
        addItem({ kind: "note", note: "safe", code: o2.code, room: rm4.name }, r.pick(ss));
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
  var nb2;
  for (nb2 = r.int(2, 4); nb2 > 0; nb2--) addItem({ kind: "ammo", ammo: "energy", n: 1 + (r.chance(0.3) ? 1 : 0) }, anyRoom());
  if (L >= 2) for (nb2 = r.int(0, 2); nb2 > 0; nb2--) addItem({ kind: "ammo", ammo: "magnetron", n: 1 }, anyRoom());
  if (L >= 5) for (nb2 = r.int(0, 1); nb2 > 0; nb2--) addItem({ kind: "ammo", ammo: "positron", n: 1 }, anyRoom());
  for (nb2 = r.int(1, 3); nb2 > 0; nb2--) addItem({ kind: "item", item: "medkit_s", n: 1 }, anyRoom());
  if (r.chance(0.25 + L * 0.03)) addItem({ kind: "item", item: "medkit_l", n: 1 }, anyRoom());
  if (r.chance(0.3)) addItem({ kind: "item", item: "stim", n: 1 }, anyRoom());
  if (L >= 3 && r.chance(0.4)) addItem({ kind: "item", item: "antidote", n: 1 }, anyRoom());
  if (r.chance(0.3)) addItem({ kind: "item", item: "energy_d", n: 1 }, anyRoom());
  if (L >= 2 && r.chance(0.35)) addItem({ kind: "item", item: "emp", n: 1 }, anyRoom());
  if (r.chance(0.12)) addItem({ kind: "item", item: "plate", n: 1 }, anyRoom());
  for (nb2 = r.int(3, 6); nb2 > 0; nb2--) addItem({ kind: "item", item: partAt(r, L), n: 1 + (r.chance(0.3) ? 1 : 0) }, anyRoom());
  if (r.chance(0.07 + L * 0.006)) addItem({ kind: "armor", a: LAB.genArmor(r, L, F) }, anyRoom());
  for (nb2 = r.int(2, 4); nb2 > 0; nb2--) addItem({ kind: "credits", n: Math.round((8 + r.int(0, 25)) * (1 + d0 / 25)) }, anyRoom());
  if (r.chance(0.3) || (F % 5 === 3)) addItem({ kind: "weapon", w: LAB.genWeapon(r, L, F) }, anyRoom());
  if (r.chance(0.07)) addItem({ kind: "chip", implant: r.pick(LAB.IMPLANTS.slice(1)).id }, anyRoom());
  /* записки: сюжетные (тексты — texts.js) и записки персонала */
  addItem({ kind: "note", note: "story", L: L, F: F }, anyRoom());
  if (r.chance(0.5)) addItem({ kind: "note", note: "staff", n: r.int(0, 999) }, anyRoom());

  /* 15. Тайная комната: образец и редкая добыча. */
  if (secret >= 0) {
    var sr = rooms[secret];
    addItem({ kind: "sample", sid: d0 }, secret);
    addItem({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.2, minRank: 1 }) }, secret);
    addItem({ kind: r.chance(0.5) ? "ammo" : "item", ammo: L >= 5 ? "positron" : "magnetron", item: "medkit_l", n: 1 }, secret);
    if (r.chance(0.3)) addItem({ kind: "chip", implant: r.pick(LAB.IMPLANTS.slice(1)).id }, secret);
    if (r.chance(0.3)) addItem({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.2 }) }, secret);
    /* подсказка о тайнике — в записке на этаже */
    var sd = null;
    for (var dd = 0; dd < doors.length; dd++) if (doors[dd].lock && doors[dd].lock.type === "secret") sd = doors[dd];
    if (sd && r.chance(0.6)) addItem({ kind: "note", note: "secret", room: rooms[sd.other].name, side: sd.side }, anyRoom());
    sr.hidden = true;
  } else {
    /* без тайной комнаты образец — в самой глубокой зоне */
    var deep = mainRooms.slice().sort(function (a, b) { return depthOf(b) - depthOf(a); });
    addItem({ kind: "sample", sid: d0 }, deep[0]);
  }
  function depthOf(n) { var k = 0; for (var y = n; y !== -1; y = parent[y]) k++; return k; }

  /* 16. Враги. Во второй половине уровня появляются роботы следующего уровня. */
  var foePool = lev.foes.slice();
  if (F > LAB.FLOORS_N / 2 && L < LAB.LEVELS_N) {
    LAB.LEVELS[L + 1].foes.forEach(function (fid) {
      if (LAB.FOES[fid].kind === "mech" && foePool.indexOf(fid) < 0 && LAB.FOES[fid].beh.indexOf("turret") < 0 && r.chance(0.5)) foePool.push(fid);
    });
  }
  function addFoe(fid, s2, extra) {
    var c5 = standCell(s2);
    if (!c5) return null;
    itemCell[idx(c5[0], c5[1])] = 1;
    var base = LAB.FOES[fid];
    var lvl = Math.max(1, LAB.foeLevel(L, F) + r.int(-1, 1));
    var sc2 = LAB.scaleFoe(base, lvl);
    var f2 = { id: "e" + (foeSeq++), type: fid, x: c5[0], y: c5[1], lvl: lvl, hp: sc2.hp, maxhp: sc2.hp, dmg: sc2.dmg, arm: sc2.arm, room: s2 };
    if (extra) for (var k6 in extra) f2[k6] = extra[k6];
    /* модификации роботов: чем глубже, тем чаще и тем их больше */
    var aff = [];
    if (base.kind === "mech" && !f2.boss) {
      var pE = Math.min(0.85, 0.05 + d0 * 0.0045);
      if (r.chance(pE)) {
        var nA = 1 + (d0 > 60 && r.chance(0.45) ? 1 : 0) + (d0 > 130 && r.chance(0.4) ? 1 : 0);
        var apool = [];
        for (var ak in LAB.AFFIX) {
          var ad = LAB.AFFIX[ak];
          if (ad.min > d0) continue;
          if (ad.ranged && base.beh.indexOf("ranged") < 0) continue;
          if ((ak === "fast" || ak === "cloak") && base.beh.indexOf("stationary") >= 0) continue;
          apool.push(ak);
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
    return f2;
  }
  for (s = 0; s < NS; s++) {
    var rm6 = rooms[s];
    if (!rm6 || s === U || s === secret) continue;
    if (L === 1 && F === 1 && zone[s] === -1 && r.chance(0.6)) continue; /* мягкое начало */
    /* тварей и роботов много: почти в каждом помещении, глубже — стаями */
    var p6 = Math.min(0.95, 0.62 + 0.03 * L + (F === NF ? 0.1 : 0));
    if (s === E) p6 *= 0.5;
    if (L === 1 && F <= 2) p6 *= 0.75; /* первые шаги после пробуждения */
    if (!r.chance(p6)) continue;
    var fid2 = r.pick(foePool);
    var beh = LAB.FOES[fid2].beh;
    var cnt = beh.indexOf("swarm") >= 0 ? r.int(3, 4) : 1 + (r.chance(0.45 + L * 0.03) ? 1 : 0) + (r.chance(0.1 + L * 0.025) ? 1 : 0);
    for (var q = 0; q < cnt; q++) addFoe(q === 0 ? fid2 : (r.chance(0.6) ? fid2 : r.pick(foePool)), s);
  }
  /* страж двадцатого этажа: шлюзовая ключ-карта при нём, если не спрятана */
  if (F === NF && bossSlot >= 0) {
    var bdef = LAB.BOSSES[lev.boss];
    var bcarry = L === LAB.LEVELS_N ? [{ kind: "gatepass", L: L, core: true }] : cardHidden ? [] : [{ kind: "gatepass", L: L }];
    if (r.chance(0.5)) bcarry.push({ kind: "armor", a: LAB.genArmor(r, L, F, { bonus: 0.25 }) });
    var bf = addFoe(bdef.base, bossSlot, { boss: lev.boss, carry: bcarry });
    if (bf) {
      bf.hp = bf.maxhp = Math.round(bf.maxhp * bdef.mult);
      bf.dmg = Math.round(bf.dmg * 1.5);
      bf.arm = Math.round(bf.arm * 1.3) + 2;
      bf.lvl += 2;
    } else return null;
  }

  /* 17. Выжившие, дружественные роботы, станции имплантов, штабы фракций. */
  var quietRooms = [];
  for (s = 0; s < NS; s++) {
    if (!rooms[s] || s === U || s === D || s === E || s === secret || !main[s]) continue;
    if (fl.foes.some(function (f3) { return f3.room === s; })) continue;
    quietRooms.push(s);
  }
  r.shuffle(quietRooms);
  if (quietRooms.length && r.chance(L <= 9 ? 0.32 : 0.15)) {
    var ns = quietRooms.shift();
    var sv = makeSurvivor(r, L, F, ns, rooms[ns]);
    var cS = freeCell(ns);
    if (cS) { sv.x = cS[0]; sv.y = cS[1]; objCell[idx(sv.x, sv.y)] = 1; fl.npcs.push(sv); }
  }
  if (quietRooms.length && r.chance(0.22)) {
    var nr = quietRooms.shift();
    var rtype = r.pick(["helper", "helper", "meddroid", "archivist"]);
    var cR = freeCell(nr);
    if (cR) objCell[idx(cR[0], cR[1])] = 1;
    if (cR) fl.npcs.push({ id: "n" + fl.npcs.length, robot: true, type: rtype, n: LAB.ROBOT_NPC[rtype].n, x: cR[0], y: cR[1], room: nr, key: L + "-" + F + "-r" });
  }
  var implantFloors = { "2-5": 1, "3-12": 1, "4-10": 1, "5-15": 1, "6-5": 1, "7-12": 1, "8-10": 1, "9-6": 1 };
  if (implantFloors[L + "-" + F] && quietRooms.length) addObj("implantlab", quietRooms[0]);
  var hqFloors = { "2-10": "sec", "3-15": "sci", "5-6": "eng", "4-16": "res", "6-9": "free" };
  if (hqFloors[L + "-" + F] && quietRooms.length > 1) addObj("hq", quietRooms[1], { faction: hqFloors[L + "-" + F] });

  /* торговые терминалы и мастерские — на каждом уровне по расписанию */
  var svcRooms = [];
  for (s = 0; s < NS; s++) if (rooms[s] && main[s] && s !== U && s !== D && s !== E && s !== secret && s !== bossSlot) svcRooms.push(s);
  function hasObj(t2) { return fl.objs.some(function (o) { return o.type === t2; }); }
  if ([1, 5, 10, 15, 19].indexOf(F) >= 0 && !hasObj("vending") && svcRooms.length) addObj("vending", r.pick(svcRooms));
  if ([3, 8, 13, 18].indexOf(F) >= 0 && !hasObj("workbench") && svcRooms.length) addObj("workbench", r.pick(svcRooms));

  /* турели в коридорах (с 2-го уровня) */
  if (L >= 2) {
    var tur = lev.foes.filter(function (fid3) { return LAB.FOES[fid3].beh.indexOf("turret") >= 0; });
    if (tur.length && r.chance(0.7)) {
      var cand7 = [];
      for (s = 0; s < NS; s++) if (rooms[s] && s !== U && s !== E && main[s] && zone[s] !== -1) cand7.push(s);
      var nT = 1 + (L >= 5 && r.chance(0.5) ? 1 : 0);
      for (var t7 = 0; t7 < nT && cand7.length; t7++) addFoe(r.pick(tur), r.pick(cand7));
    }
  }

  fl.sample = d0;
  return fl;
}

function makeSurvivor(r, L, F, s, rm) {
  var female = r.chance(0.5);
  var first = r.pick(female ? LAB.NAMES.f : LAB.NAMES.m);
  var last = r.pick(female ? LAB.NAMES.sf : LAB.NAMES.sm);
  var profs = Object.keys(LAB.PROFS);
  var prof = r.pick(profs);
  var c = [r.int(rm.x0, rm.x1), r.int(rm.y0, rm.y1)];
  return { id: "n0", robot: false, n: first + " " + last, first: first, last: last, female: female, prof: prof,
    x: c[0], y: c[1], room: s, tier: 1 + Math.floor(L / 3), key: L + "-" + F + "-s", life: r.int(0, 99), view: r.int(0, 99) };
}

/* Добыча контейнеров: склонность комнаты влияет на состав. */
function genLoot(r, L, F, ot, tag) {
  var out = [];
  var n = ot === "safe" ? 3 : ot === "crate" ? r.int(1, 3) : r.int(0, 2);
  for (var i = 0; i < n; i++) {
    var roll = r.next();
    if (tag === "arms" && roll < 0.35) out.push({ kind: "ammo", ammo: r.chance(0.7) ? "energy" : (L >= 2 ? "magnetron" : "energy"), n: 1 });
    else if (tag === "med" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.75) ? "medkit_s" : "medkit_l", n: 1 });
    else if (tag === "parts" && roll < 0.5) out.push({ kind: "item", item: L >= 3 && r.chance(0.2) ? "ceramic" : r.pick(["scrap", "wire", "cap", "chip", "magnet"]), n: 1 });
    else if (tag === "tech" && roll < 0.45) out.push({ kind: "item", item: L >= 5 && r.chance(0.15) ? "supercond" : r.pick(["chip", "cap", "lens", "wire"]), n: 1 });
    else if (tag === "bio" && roll < 0.45) out.push({ kind: "item", item: r.pick(["gel", "reagent", "gel"]), n: 1 });
    else if (tag === "chem" && roll < 0.45) out.push({ kind: "item", item: r.pick(["reagent", "gel", "antidote"]), n: 1 });
    else if (tag === "food" && roll < 0.4) out.push({ kind: "item", item: r.pick(["stim", "medkit_s"]), n: 1 });
    else if (tag === "paper" && roll < 0.4) out.push({ kind: "note", note: "staff", n: r.int(0, 999) });
    else if (tag === "armor" && roll < 0.2) out.push({ kind: "armor", a: LAB.genArmor(r, L, F) });
    else if (tag === "armor" && roll < 0.45) out.push({ kind: "item", item: r.chance(0.5) ? "plate" : (L >= 3 ? "ceramic" : "scrap"), n: 1 });
    else if (tag === "arms" && roll < 0.42 && r.chance(0.3)) out.push({ kind: "armor", a: LAB.genArmor(r, L, F) });
    else if (roll < 0.6) out.push({ kind: "credits", n: Math.round((6 + r.int(0, 20)) * (1 + LAB.depth(L, F) / 25)) });
    else if (roll < 0.8) out.push({ kind: "ammo", ammo: "energy", n: 1 });
    else out.push({ kind: "item", item: partAt(r, L), n: 1 });
  }
  if (ot === "safe") {
    if (r.chance(0.5)) out.push({ kind: "weapon", w: LAB.genWeapon(r, L, F, { bonus: 0.1 }) });
    else out.push({ kind: "credits", n: Math.round(40 * (1 + LAB.depth(L, F) / 20)) });
  }
  return out;
}
LAB.genLoot = genLoot;
/* Случайная деталь, какая встречается на этой глубине. */
function partAt(r, L) {
  var pool = LAB.PARTS.filter(function (p) { return (LAB.PART_DEPTH[p] || 1) <= L; });
  return r.pick(pool);
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
LAB.bfs = function (fl, st, sx, sy, goal, opts) {
  opts = opts || {};
  var prev = new Int32Array(W * H).fill(-2);
  var s0 = idx(sx, sy);
  prev[s0] = -1;
  var q = [s0], qi = 0;
  var isGoal = typeof goal === "function" ? goal : function (x, y) { return x === goal[0] && y === goal[1]; };
  while (qi < q.length) {
    var u = q[qi++];
    var x = u % W, y = (u / W) | 0;
    if (u !== s0 && isGoal(x, y)) {
      var path = [];
      for (var v = u; v !== s0; v = prev[v]) path.unshift([v % W, (v / W) | 0]);
      return path;
    }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var k = 0; k < 4; k++) {
      var nx = x + dirs[k][0], ny = y + dirs[k][1];
      if (!LAB.inb(nx, ny)) continue;
      var j = idx(nx, ny);
      if (prev[j] !== -2) continue;
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
      prev[j] = u; q.push(j);
      if (opts.maxLen && q.length > opts.maxLen) return null;
    }
  }
  return null;
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
   ключ; запускает установки и терминалы. Возвращает, дошёл ли он до
   выхода вниз и до лифта, и что он нашёл. */
LAB.solve = function (fl, have) {
  have = have || {};
  var tier = have.tier || 0, keys = {}, gatepass = !!have.gatepass, power = false, rubble = false, lockdown = false;
  var codes = {};
  var opened = {};
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
      if (o.type === "terminal" && o.code && !codes[o.code]) { codes[o.code] = 1; changed = true; }
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
