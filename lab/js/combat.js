/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — бой.
   Враги этажа живут в реальном времени (такт — полсекунды) или по ходам
   (пошаговый режим): слышат шаги и выстрелы, видят по прямой, гонятся,
   стреляют, отступают. Роботы умнеют с глубиной (ум от 0 до 10): держат
   дистанцию, уходят с линии огня, зовут подмогу, уклоняются, чинятся,
   ждут в засаде, давят, пока вы перезаряжаетесь.
   Герой стреляет свайпом в сторону цели: одиночный — свайп, очередь —
   свайп с удержанием. Импланты, ЭМИ-граната, мины сапёров, снаряды мортир.
   Синтаксис — не новее ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function idx(x, y) { return y * LAB.W + x; }
function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function cheb(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function has(f, b) { return f.beh.indexOf(b) >= 0; }
function aff(f, a) { return !!(f.aff && f.aff.indexOf(a) >= 0); }
function diff() { return LAB.DIFF[S.difficulty || 1] || LAB.DIFF[1]; }
var DIRV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

var TICK = 500;
var foes = [];
var timer = null, tickN = 0;
var hold = null;
var reloadUntil = 0, lastShot = 0, lastEmpty = 0, lastHurtSay = 0, lastSpot = 0;
var hpMark = 100;
var graceT = 0;

/* ════════ ВРАГИ ЭТАЖА ════════ */
function foeName(base, f) {
  var n = f.boss ? LAB.BOSSES[f.boss].n : base.n;
  if (f.aff && f.aff.length) {
    var g = f.boss ? LAB.BOSSES[f.boss].g : base.g;
    var adj = f.aff.map(function (a) { return LAB.AFFIX[a][g === "f" ? "f" : "m"]; });
    n += ", " + (adj.length > 1 ? adj.slice(0, -1).join(", ") + " и " + adj[adj.length - 1] : adj[0]);
  }
  return n;
}
function makeRuntime(def, st) {
  var base = LAB.FOES[def.type];
  var bdef = def.boss ? LAB.BOSSES[def.boss] : null;
  var dk = diff();
  var f = {
    id: def.id, type: def.type, base: base, boss: def.boss || null, kind: base.kind, g: bdef ? bdef.g : base.g,
    beh: bdef && bdef.beh ? bdef.beh : base.beh, rng: bdef && bdef.rng ? bdef.rng : base.rng,
    spd: base.spd, acd: base.acd, det: base.det, adt: base.adt || "phys", snd: bdef ? bdef.snd : base.snd,
    x: def.x, y: def.y, lvl: def.lvl, maxhp: Math.round(def.maxhp * dk.hp), dmg: Math.max(1, Math.round(def.dmg * dk.dmg)), arm: def.arm,
    aff: def.aff || null, iq: Math.min(12, (def.iq || 0) + dk.iq), carry: def.carry || null, room: def.room,
    shieldMax: def.shieldMax ? Math.round(def.shieldMax * dk.hp) : 0,
    state: "idle", mv: 0, at: 0, hitT: 99, seenT: 99, lost: 0, aim: false, frozen: 0, adapt: {}, minesLeft: 3, summonT: 0, blinkT: 0,
    lastKnown: null, ambush: false, calm: false, spawned: !!def.spawned,
    ally: !!def.ally, shots: def.shots || 0, corr: def.corr != null ? def.corr : null, patrol: !!def.patrol || (base.beh.indexOf("patrol") >= 0),
    neutral: base.beh.indexOf("cleaner") >= 0, disguised: base.beh.indexOf("mimic") >= 0, bag: [], camT: 0, buildT: 0, built: 0, screamT: 0, phaseT: 0, phased: false,
    burrowT: 0, burrowed: false, confused: 0, healT: 0, splitGen: def.splitGen || 0, from: def.from || null, task: def.task || null,
    /* машины ОКО: стражи постов, отряды, патрули смены, дроны слежения */
    guard: def.guard || null, post: def.post ? { x: def.post[0], y: def.post[1] } : null, oko: !!(def.oko || def.squad || def.guard), squad: !!def.squad, fresh: !!def.fresh,
    route: null, ri: 0, stuck: 0, exit: null, repT: 0, fixT: 0
  };
  f.hp = f.maxhp; f.shield = f.shieldMax;
  if (aff(f, "fast")) { f.spd = Math.max(1, f.spd - 1); f.acd = Math.max(1, f.acd - 1); }
  if (aff(f, "sniper")) f.rng += 3;
  f.name = foeName(base, f);
  if (st) {
    if (st.hp != null) f.hp = Math.min(f.maxhp, st.hp);
    if (st.x != null) { f.x = st.x; f.y = st.y; }
    if (st.shield != null) f.shield = st.shield;
    if (st.minesLeft != null) f.minesLeft = st.minesLeft;
    if (st.adapt) f.adapt = st.adapt;
    if (st.bag) f.bag = st.bag;
    if (st.neutral === false) f.neutral = false;
    if (st.disguised === false) f.disguised = false;
    if (st.shots != null) f.shots = st.shots;
  }
  return f;
}
function loadFoes() {
  var fl = CUR().fl, fs = CUR().fs;
  foes = [];
  hold = null;
  if (!fs.foes) fs.foes = {};
  if (!fs.spawned) fs.spawned = [];
  if (!fs.mines) fs.mines = [];
  fl.foes.forEach(function (def) {
    var st = fs.foes[def.id];
    if (st && st.dead) return;
    foes.push(makeRuntime(def, st));
  });
  fs.spawned.forEach(function (def) {
    var st = fs.foes[def.id];
    if (st && st.dead) return;
    foes.push(makeRuntime(def, st));
  });
  foes.forEach(function (f) {
    if (fs.robots && f.kind === "mech" && !f.ally && !f.fresh) f.calm = true;
    if (has(f, "turret") && !f.shots) {
      if (fs.turretMode === "off" || (!fs.turretMode && fs.turrets === false)) f.calm = true;
      if (fs.turretMode === "ours") { f.ally = true; f.calm = false; }
    }
  });
  hpMark = Math.round(100 * G().hp / G().hpMax);
  graceT = tickN + 6; /* три секунды после входа на этаж враги не бьют: осмотреться */
}
function syncFoes() {
  var fs = CUR().fs;
  if (!fs) return;
  if (!fs.foes) fs.foes = {};
  foes.forEach(function (f) {
    /* павший остаётся павшим: после возвращения на этаж он не встанет */
    if (f.dead) { if (!f.gone) fs.foes[f.id] = { dead: true }; return; }
    fs.foes[f.id] = { hp: f.hp, x: f.x, y: f.y, shield: f.shield, minesLeft: f.minesLeft, adapt: f.adapt, bag: f.bag && f.bag.length ? f.bag : undefined, neutral: f.neutral ? undefined : false, disguised: f.disguised ? undefined : false, shots: f.shots || undefined };
  });
}

/* ════════ ВОСПРИЯТИЕ ════════ */
function heroPos() { return { x: G().x, y: G().y }; }
function losTo(f) { return LAB.los(CUR().fl, CUR().fs, f.x, f.y, G().x, G().y); }
function relayNear(f) {
  if (f.kind !== "mech") return false;
  for (var i = 0; i < foes.length; i++) { var r = foes[i]; if (!r.dead && !r.calm && r !== f && has(r, "relay") && cheb(r, f) <= 6) return true; }
  return false;
}
/* Начальник рядом: роботы умнее и злее. */
function commanderNear(f) {
  if (f.kind !== "mech") return false;
  for (var i = 0; i < foes.length; i++) { var c = foes[i]; if (c !== f && !c.dead && !c.calm && !c.ally && has(c, "commander") && cheb(c, f) <= 5) return true; }
  return false;
}
function iqOf(f) { return Math.max(0, f.iq + (relayNear(f) ? 2 : 0) + (commanderNear(f) ? 2 : 0) - (f.confused > 0 ? 3 : 0)); }
function detOf(f) {
  var d = f.det;
  if (gm().armorSpecial("stealth")) d -= 3;
  if (G().faction === "free" && f.kind === "mech") d -= 2;
  if (G().event === "dark" && f.kind === "bio") d += 1;
  if (aff(f, "sniper")) d += 2;
  if (has(f, "turret") && CUR().fs.turretAlert) d += 2;
  return Math.max(2, d);
}
function sees(f) {
  if (G().st.cloak > 0) return false;
  if (has(f, "deaf")) return false;
  var d = dist(f, heroPos());
  if (d > detOf(f)) return false;
  return losTo(f);
}
function hears(f) {
  var n = G().noise;
  if (gm().armorSpecial("stealth")) n = Math.round(n * 0.6);
  if (G().st.cloak > 0) n = Math.round(n * 0.3);
  var d = dist(f, heroPos());
  var bonus = has(f, "deaf") ? 3 : has(f, "tracker") ? 5 : 0;
  if (!losTo(f)) n -= 2; /* за стеной хуже слышно */
  return d <= n + bonus;
}
function inFireLine(f) {
  var v = DIRV[G().face] || DIRV.N, dx = f.x - G().x, dy = f.y - G().y;
  var along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
  return along > 0 && perp === 0;
}

/* ════════ ДВИЖЕНИЕ ВРАГОВ ════════ */
function occupied(x, y, self) {
  for (var i = 0; i < foes.length; i++) { var o = foes[i]; if (o !== self && !o.dead && o.x === x && o.y === y) return true; }
  return false;
}
function canStand(f, x, y) {
  var fl = CUR().fl;
  if (!LAB.inb(x, y)) return false;
  var t = fl.t[idx(x, y)];
  if (t === LAB.T.WALL) return false;
  if (t === LAB.T.DOOR) { var d = fl.doorAt[idx(x, y)]; if (CUR().fs.doors[d.id] !== 2) return false; }
  if (LAB.solidAt(fl, x, y)) return false;
  if (occupied(x, y, f)) return false;
  if (x === G().x && y === G().y) return false;
  return true;
}
/* Машинам ОКО двери открывает само ОКО: отрядам, ремонтникам, стражам,
   патрулям смены и дронам, а по тревоге — всем роботам этажа. Запертые
   двери (карта, ключ, код) и тайные — не открывает. */
function okoDoors(f) {
  if (!f || f.kind !== "mech" || f.ally) return false;
  if (f.oko || f.task) return true;
  var fs = CUR().fs;
  return !!(fs && fs.alarmUntil && fs.alarmUntil > Date.now());
}
/* Можно ли врагу открыть эту дверь. */
function foeOpens(f, d) {
  if (!has(f, "dooropen") && !(f.kind === "mech" && iqOf(f) >= 5) && !okoDoors(f)) return false;
  var st = CUR().fs.doors[d.id];
  if (st === 2) return true;
  if (d.lock && d.lock.type === "secret") return false;
  return !d.lock || st === 1;
}
function stepToward(f, tx, ty, opts) {
  opts = opts || {};
  var fl = CUR().fl, fs = CUR().fs;
  var path = LAB.bfs(fl, fs, f.x, f.y, function (x, y) {
    if (opts.near) return Math.max(Math.abs(x - tx), Math.abs(y - ty)) === 1; /* любая из восьми соседних клеток */
    if (opts.adjacent) return Math.abs(x - tx) + Math.abs(y - ty) === 1;
    return x === tx && y === ty;
  }, {
    passDoor: function (d) { return foeOpens(f, d); },
    block: function (x, y) { return occupied(x, y, f) || (x === G().x && y === G().y); },
    maxLen: 6000
  });
  f.pathLen = path ? path.length : 9999;
  if (!path || !path.length) return false;
  var nx = path[0][0], ny = path[0][1];
  var t = fl.t[idx(nx, ny)];
  if (t === LAB.T.DOOR) {
    var d = fl.doorAt[idx(nx, ny)];
    if (fs.doors[d.id] !== 2) {
      if (!foeOpens(f, d)) return false;
      fs.doors[d.id] = 2;
      if (LAB.game.doorOpened) LAB.game.doorOpened(d);
      A("doorOpen", d, true);
      return true; /* дверь открыта — шаг в следующий такт */
    }
  }
  if (occupied(nx, ny, f) || (nx === G().x && ny === G().y)) return false;
  moveFoe(f, nx, ny);
  return true;
}
function moveFoe(f, nx, ny) {
  var px = f.x, py = f.y;
  f.x = nx; f.y = ny;
  var r = CUR().fl.room[idx(nx, ny)];
  f.room = r;
  if (!aff(f, "cloak") || dist(f, heroPos()) <= 3) A("foeStep", f);
  /* сапёр оставляет мины в проходах */
  if (has(f, "mines") && f.minesLeft > 0 && f.state === "hunt" && CUR().fl.room[idx(px, py)] < 0 && Math.random() < 0.25) {
    if (!CUR().fs.mines.some(function (m) { return m.x === px && m.y === py; })) {
      CUR().fs.mines.push({ x: px, y: py, dmg: Math.round(f.dmg * 1.2) });
      f.minesLeft--;
      A("foeSound", f, "mine_set");
    }
  }
}
/* Отойти от героя (держать дистанцию, отступать). */
function stepAway(f) {
  var best = null, bd = dist(f, heroPos());
  ["N", "S", "W", "E"].forEach(function (k) {
    var v = DIRV[k], x = f.x + v[0], y = f.y + v[1];
    if (!canStand(f, x, y)) return;
    var d = Math.abs(x - G().x) + Math.abs(y - G().y);
    if (d > bd) { bd = d; best = [x, y]; }
  });
  if (best) { moveFoe(f, best[0], best[1]); return true; }
  return false;
}
/* Шаг вбок с линии огня героя. */
function sidestep(f) {
  var v = DIRV[G().face] || DIRV.N;
  var opts = [[v[1], v[0]], [-v[1], -v[0]]];
  if (Math.random() < 0.5) opts.reverse();
  for (var i = 0; i < opts.length; i++) {
    var x = f.x + opts[i][0], y = f.y + opts[i][1];
    if (canStand(f, x, y)) { moveFoe(f, x, y); return true; }
  }
  return false;
}
function freeCellNear(x, y, self) {
  var order = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [0, -2], [-2, 0]];
  for (var i = 0; i < order.length; i++) {
    var nx = x + order[i][0], ny = y + order[i][1];
    if (canStand(self || null, nx, ny)) return [nx, ny];
  }
  return null;
}

/* ════════ ТАКТ ════════ */
function start() {
  if (timer) return;
  timer = setInterval(function () { LAB.safe(realTick); }, TICK);
}
function stop() { if (timer) { clearInterval(timer); timer = null; } stopFire(); }
function realTick() {
  var g = gm();
  if (!g || !g.entered || g.paused || G().done || G().dead) return;
  if (LAB.ui && LAB.ui.layer()) return;      /* открыто окно — мир ждёт */
  if (LAB.mini && LAB.mini.active && LAB.mini.active()) return;
  if (S.turnBased) return;                     /* по ходам: мир движется после действий героя */
  tick();
}
/* Один такт мира. В пошаговом режиме зовётся после каждого действия героя. */
function tick() {
  if (G().stair) return; /* игрок на лестнице: этаж ждёт */
  tickN++;
  statusTick(false);
  var fs = CUR().fs;
  var spotted = [];
  for (var i = 0; i < foes.length; i++) {
    var f = foes[i];
    if (f.dead) continue;
    LAB.safe(function () { foeTick(f, spotted); });
    if (G().dead) return;
  }
  shellsTick();
  if (LAB.oko) LAB.safe(LAB.oko.tick);
  if (LAB.game.doorAutoClose) LAB.safe(LAB.game.doorAutoClose); /* двери закрываются за прошедшими */
  if (spotted.length) announceSpotted(spotted);
  G().noise = Math.max(0, G().noise - 2);
  A("combatLevel", danger() ? (hunted() ? 2 : 1) : 0);
  if (tickN % 10 === 0) syncFoes();
}

/* ── особые машины и твари ── */
function allyTick(f) {
  f.at++;
  if (f.at < f.acd) return;
  var best = null, bd = 99;
  foes.forEach(function (o) {
    if (o === f || !hostile(o) || o.burrowed || o.phased) return;
    if (has(f, "turret") && !(o.x === f.x || o.y === f.y)) return;
    var d = dist(o, f);
    if (d > f.rng || d >= bd) return;
    if (!LAB.los(CUR().fl, CUR().fs, f.x, f.y, o.x, o.y)) return;
    best = o; bd = d;
  });
  if (!best) return;
  f.at = 0;
  A("foeSound", f, "shoot");
  damageFoe(best, f.dmg * (f.shots ? 1.4 : 1), f.adt === "energy" ? "energy" : "kinetic", { quiet: true, ally: true });
  if (f.shots) {
    f.shots--;
    if (f.shots <= 0) { f.dead = true; CUR().fs.foes[f.id] = { dead: true }; A("play", "craft_off"); sayq("Переносная турель разрядилась и сложилась."); }
  }
}
function cameraTick(f) {
  if (f.camT > 0) f.camT--;
  if (G().st.jam > 0 || gm().armorSpecial("okoghost") || CUR().fs.okoBlind) return;
  if (sees(f)) {
    if (f.camT <= 0) {
      f.camT = 40;
      A("foeSound", f, "alert");
      sayOnce("cam", "Камера ОКО " + gm().relDir(f.x, f.y) + " заметила вас!", 5000, "urgent");
      if (LAB.oko) LAB.oko.event("camera");
    }
  } else if (Math.random() < 0.015) A("foeSound", f, "idle");
}
function unmask(f) {
  f.disguised = false; f.state = "hunt"; f.lastKnown = heroPos(); f.at = f.acd;
  A("foeSound", f, "alert");
  say("Ящик рядом раскрылся — это " + f.name.split(",")[0].toLowerCase() + "!");
}
/* Уборщик: собирает вещи с пола, доложит ОКО, если увидит героя. */
function cleanerTick(f) {
  var fs = CUR().fs, here = gm().floorItems().filter(function (it) { return it.x === f.x && it.y === f.y && it.kind !== "note" && it.kind !== "sample"; });
  here.forEach(function (it) { fs.taken[it.id] = 1; var c = JSON.parse(JSON.stringify(it)); delete c.x; delete c.y; f.bag.push(c); });
  if (here.length) A("foeSound", f, "idle");
  if (!f.reported && sees(f) && G().st.jam <= 0 && !gm().armorSpecial("okoghost")) {
    f.reported = true;
    A("foeSound", f, "radio");
    sayOnce("cl" + f.id, f.name.split(",")[0] + " " + gm().relDir(f.x, f.y) + " заметил вас и докладывает ОКО.", 8000);
    if (LAB.oko) LAB.oko.event("cleaner");
  }
  f.mv++;
  if (f.mv < f.spd + 1) return;
  f.mv = 0;
  var near = gm().floorItems().filter(function (it) { return it.kind !== "note" && it.kind !== "sample" && Math.abs(it.x - f.x) + Math.abs(it.y - f.y) <= 6 && LAB.los(CUR().fl, CUR().fs, f.x, f.y, it.x, it.y); })[0];
  if (near) stepToward(f, near.x, near.y);
  else wander(f);
}
/* Патруль: ходит из конца в конец своего коридора. */
function patrolStep(f) {
  var fl = CUR().fl;
  if (f.corr == null) {
    var best = null, bd = 1e9;
    (fl.corrs || []).forEach(function (c) { var cx = (c.x0 + c.x1) >> 1, cy = (c.y0 + c.y1) >> 1, d = Math.abs(cx - f.x) + Math.abs(cy - f.y); if (d < bd) { bd = d; best = c; } });
    if (!best) { wander(f); return; }
    f.corr = best.id;
  }
  var c = fl.corrs[f.corr];
  if (!c) { wander(f); return; }
  if (f.pdir == null) f.pdir = Math.random() < 0.5 ? 1 : -1;
  var tx, ty;
  if (c.axis === "h") { tx = f.pdir > 0 ? c.x1 : c.x0; ty = Math.max(c.y0, Math.min(c.y1, f.y)); }
  else { ty = f.pdir > 0 ? c.y1 : c.y0; tx = Math.max(c.x0, Math.min(c.x1, f.x)); }
  if (f.x === tx && f.y === ty) { f.pdir = -f.pdir; return; }
  if (!stepToward(f, tx, ty)) f.pdir = -f.pdir;
}
/* Ремонтник ОКО идёт к отключённой турели и чинит её — три такта у
   щитка, слышно, как он работает; починил — сеть этажа оживает. Путь
   перекрыт и ремонтник долго не приближается — ОКО выводит его служебным
   ходом ближе к турели (дважды), а потом отзывает и пришлёт другого. */
function repairTask(f, canMove) {
  var t = null, bd = 1e9;
  foes.forEach(function (o) { if (isNetTurret(o) && o.calm) { var d = dist(o, f); if (d < bd) { bd = d; t = o; } } });
  if (!t || CUR().fs.turretMode !== "off") { f.task = null; f.fixT = 0; return false; }
  if (cheb(f, t) <= 1) {
    f.fixT++;
    A("foeSound", f, "repair");
    if (f.fixT === 1) sayOnce("fix" + f.id, f.name.split(",")[0] + " чинит турель " + gm().relDir(t.x, t.y) + "!", 6000, "urgent");
    if (f.fixT < 4) return true;
    f.task = null; f.fixT = 0;
    turretsHostile();
    A("play", "term_err");
    if (LAB.oko) LAB.oko.event("repaired");
    return true;
  }
  f.fixT = 0;
  if (canMove) {
    f.mv = 0;
    stepToward(f, t.x, t.y, { near: true });
    var dt = f.pathLen;
    if (f.repBest == null || dt < f.repBest) { f.repBest = dt; f.stuck = 0; }
    else if (++f.stuck > 16) {
      f.stuck = 0; f.repBest = null;
      var p = (f.hops || 0) < 2 ? okoPoint({ to: t, minHero: 8, dmin: 2, dmax: 16 }) : null;
      if (p) { f.hops = (f.hops || 0) + 1; f.x = p[0]; f.y = p[1]; f.room = CUR().fl.room[idx(p[0], p[1])]; A("foeSound", f, "radio"); }
      else { despawn(f); if (LAB.oko) LAB.oko.event("repair_lost", { quiet: true }); }
    }
  }
  return true;
}
/* Убрать машину с этажа без боя: ушла со смены или ОКО её отозвало. */
function despawn(f) {
  if (f.dead) return;
  f.dead = true;
  var fs = CUR().fs;
  if (f.spawned) { f.gone = true; fs.spawned = fs.spawned.filter(function (sd) { return sd.id !== f.id; }); delete fs.foes[f.id]; }
  else fs.foes[f.id] = { dead: true };
}
/* ── Посты, патрули смены, дроны слежения ── */
/* Куда машина может дойти (по открытым и незапертым дверям): карта шагов. */
function reachMap(f, maxD) {
  var fl = CUR().fl, fs = CUR().fs, W = LAB.W, H = LAB.H;
  var dm = new Int16Array(W * H).fill(-1), s0 = idx(f.x, f.y), q = [s0], qi = 0;
  dm[s0] = 0;
  while (qi < q.length) {
    var u = q[qi++], x = u % W, y = (u / W) | 0;
    if (dm[u] >= maxD) continue;
    for (var k = 0; k < 4; k++) {
      var v = DIRV[["N", "S", "W", "E"][k]], nx = x + v[0], ny = y + v[1];
      if (!LAB.inb(nx, ny)) continue;
      var j = idx(nx, ny);
      if (dm[j] >= 0) continue;
      var tt = fl.t[j];
      if (tt === LAB.T.WALL || fl.objAt[j]) continue;
      if (tt === LAB.T.DOOR) { var d = fl.doorAt[j]; if (fs.doors[d.id] !== 2 && !foeOpens(f, d)) continue; }
      dm[j] = dm[u] + 1; q.push(j);
    }
  }
  return dm;
}
/* Маршрут патруля: три-четыре точки этажа — середины коридоров и помещения,
   куда патрульный может дойти. Пройден маршрут — ОКО даёт новый: патрули
   не ходят одним путём. focus — точка, куда ОКО велит заглянуть первым делом. */
function makeRoute(f, focus) {
  var fl = CUR().fl, dm = reachMap(f, 120), pts = [];
  var near = function (x, y) {
    for (var r = 0; r <= 2; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      var nx = x + dx, ny = y + dy;
      if (LAB.inb(nx, ny) && dm[idx(nx, ny)] > 3) return [nx, ny];
    }
    return null;
  };
  (fl.corrs || []).forEach(function (c) { var p = near((c.x0 + c.x1) >> 1, (c.y0 + c.y1) >> 1); if (p) pts.push(p); });
  (fl.rooms || []).forEach(function (rm, s) { if (!rm || rm.hidden || s === fl.U || s === fl.secret) return; var p = near(rm.cx, rm.cy); if (p) pts.push(p); });
  for (var i = pts.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
  var route = pts.slice(0, 3 + (Math.random() < 0.5 ? 1 : 0));
  if (focus) { var pf = near(focus.x, focus.y); if (pf) route.unshift(pf); }
  return route.length ? route : null;
}
function routeStep(f) {
  if (!f.route || !f.route.length) { f.route = makeRoute(f); f.ri = 0; if (!f.route) { wander(f); return; } }
  var p = f.route[f.ri];
  if (!p || Math.abs(f.x - p[0]) + Math.abs(f.y - p[1]) <= 1) {
    f.ri++; f.stuck = 0;
    if (f.ri >= f.route.length) { f.route = makeRoute(f); f.ri = 0; }
    if (Math.random() < 0.2) A("foeSound", f, "idle");
    return;
  }
  if (stepToward(f, p[0], p[1])) f.stuck = 0;
  else if (++f.stuck > 4) { f.stuck = 0; f.ri++; }
}
/* Новый маршрут патрулю (смена маршрутов ОКО); focus — куда заглянуть. */
function reroute(f, focus) { f.route = makeRoute(f, focus); f.ri = 0; f.stuck = 0; if (focus && f.state === "idle") A("foeSound", f, "radio"); }
/* Страж держит пост: стоит у лифта, лестницы или терминала, озирается;
   отошёл — возвращается. */
function guardIdle(f, canMove) {
  var p = f.post;
  if (f.x === p.x && f.y === p.y) { if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
  if (!canMove) return;
  f.mv = 0;
  if (!stepToward(f, p.x, p.y) && ++f.stuck > 6) { f.stuck = 0; f.post = { x: f.x, y: f.y }; }
}
/* Смена караула: патрульный уходит к дальнему выходу и пропадает из виду. */
function leaveStep(f) {
  if (!f.exit) { f.exit = okoPoint({ minHero: 16, from: f }); if (!f.exit) { f.task = null; return; } }
  var d = dist(f, heroPos());
  if ((Math.abs(f.x - f.exit[0]) + Math.abs(f.y - f.exit[1]) <= 1) || (d > 18 && !losTo(f) && ++f.stuck > 40)) { despawn(f); return; }
  if (!stepToward(f, f.exit[0], f.exit[1]) && ++f.stuck > 60) despawn(f);
}
/* Дрон слежения: ОКО всё время знает, где вы, — дрон держится в трёх-пяти
   шагах, стреляет, когда вы на прямой, докладывает ОКО и уходит из-под
   огня. Маскировка, глушилка и «Слепое пятно» сбивают его со следа. */
function stalkerTick(f) {
  var g = G(), hp = heroPos(), fs = CUR().fs;
  var tracked = !(g.st.cloak > 0) && !(g.st.jam > 0) && !gm().armorSpecial("okoghost") && !fs.okoBlind;
  var see = sees(f), d = dist(f, hp);
  if (tracked || see) { f.lastKnown = hp; if (f.state !== "flee") f.state = "hunt"; f.lost = 0; }
  else if (f.state === "hunt" && ++f.lost > 10) { f.state = "alert"; f.lost = 0; }
  f.mv++; f.at++;
  var canMove = f.mv >= f.spd, canAct = f.at >= f.acd;
  if (see && ++f.repT >= 14) { f.repT = 0; A("foeSound", f, "radio"); if (LAB.oko) LAB.oko.event("drone", { x: hp.x, y: hp.y }); }
  if (f.state !== "flee" && f.hp < f.maxhp * 0.35) { f.state = "flee"; A("foeSound", f, "retreat"); }
  if (f.state === "flee") {
    if (f.hitT > 6 && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + Math.max(1, Math.round(f.maxhp * 0.04)));
    if (f.hp >= f.maxhp * 0.7) f.state = "hunt";
    if (canMove) { f.mv = 0; stepAway(f); }
    return;
  }
  if (see && d <= f.rng && canAct) {
    if (!f.aim) { f.aim = true; A("foeSound", f, "aim"); return; }
    f.aim = false; f.at = 0;
    attack(f, true);
    if (canMove && Math.random() < 0.5) { f.mv = 0; if (!sidestep(f)) stepAway(f); }
    return;
  }
  if (!canMove || !f.lastKnown) return;
  f.mv = 0;
  if (d < 3) { stepAway(f); return; }
  if (d > 4 || !see) { if (!stepToward(f, f.lastKnown.x, f.lastKnown.y, { adjacent: true })) wander(f); return; }
  if (Math.random() < 0.3) sidestep(f);
}
function scream(f) {
  A("foeSound", f, "alert");
  if (gm().armorSpecial("sonicguard")) { sayOnce("scrG", "Визг — защита слуха гасит его.", 6000); return; }
  G().st.deaf = 6;
  A("deafen", 3000);
  sayOnce("scr", "Визг! Слух «Эхо» заложило.", 5000);
  hurtPlayer(Math.max(1, Math.round(f.dmg * 0.4)), "sonic", f, { quiet: true });
}
/* Разгон по прямой: до трёх клеток за такт, удар с разгона. */
function chargeAt(f) {
  var hp = heroPos(), v = f.x === hp.x ? [0, hp.y > f.y ? 1 : -1] : [hp.x > f.x ? 1 : -1, 0];
  A("foeSound", f, "attack");
  sayOnce("chg" + f.id, f.name.split(",")[0] + " разгоняется " + LAB.DIRFROM[v[0] > 0 ? "W" : v[0] < 0 ? "E" : v[1] > 0 ? "N" : "S"] + "!", 5000);
  for (var i = 0; i < 3; i++) {
    var nx = f.x + v[0], ny = f.y + v[1];
    if (!canStand(f, nx, ny)) break;
    moveFoe(f, nx, ny);
  }
  if (dist(f, hp) <= 1) { f.at = 0; f.chargeHit = true; attack(f, true); f.chargeHit = false; }
}

function foeTick(f, spotted) {
  f.hitT++; f.seenT++;
  if (f.frozen > 0) { f.frozen--; return; }
  if (f.ally) { allyTick(f); return; }
  if (f.calm) { if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
  if (has(f, "camera")) { cameraTick(f); return; }
  if (f.disguised) { if (dist(f, heroPos()) <= 1) unmask(f); return; }
  if (f.neutral) { cleanerTick(f); return; }
  if (f.confused > 0) { f.confused--; if (Math.random() < 0.4 && !has(f, "stationary")) wander(f); return; }
  if (f.lure > 0) f.lure--;
  if (has(f, "stalker")) { stalkerTick(f); return; }
  /* зарылся под настил — выныривает рядом с героем */
  if (f.burrowed) {
    f.burrowT++;
    if (f.burrowT >= 3) {
      var cb = freeCellNear(G().x, G().y, f);
      if (cb) { f.x = cb[0]; f.y = cb[1]; f.room = CUR().fl.room[idx(cb[0], cb[1])]; }
      f.burrowed = false; f.burrowT = 0; f.at = f.acd;
      A("foeSound", f, "blink_in");
      sayOnce("brw" + f.id, f.name.split(",")[0] + " вынырнул " + gm().relDir(f.x, f.y) + "!", 4000);
    }
    return;
  }
  /* фаза: на пару тактов неуязвим */
  if (has(f, "phaseshift") && f.state === "hunt") {
    f.phaseT++;
    if (!f.phased && f.phaseT >= 6) { f.phased = true; f.phaseT = 0; A("foeSound", f, "blink_out"); }
    else if (f.phased && f.phaseT >= 2) { f.phased = false; f.phaseT = 0; A("foeSound", f, "blink_in"); }
  }
  if (f.task === "repair") { f.mv++; if (repairTask(f, f.mv >= f.spd)) return; }
  var iq = iqOf(f);
  /* починка и щит */
  if ((has(f, "regen") || aff(f, "repair")) && f.hitT > 2 && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + Math.max(1, Math.round(f.maxhp * (f.state === "flee" ? 0.06 : 0.03))));
  if (f.shieldMax && f.hitT > 4 && f.shield < f.shieldMax) { var was = f.shield; f.shield = Math.min(f.shieldMax, f.shield + Math.round(f.shieldMax * 0.15)); if (!was) A("foeSound", f, "shield_up"); }
  /* ремонтник чинит соседей */
  if (f.type === "repairbot" && f.state !== "idle") foes.forEach(function (o) { if (o !== f && !o.dead && o.kind === "mech" && cheb(o, f) <= 1 && o.hp < o.maxhp) { o.hp = Math.min(o.maxhp, o.hp + Math.round(o.maxhp * 0.05)); if (Math.random() < 0.3) A("foeSound", f, "repair"); } });
  var see = sees(f);
  var hear = hears(f);
  /* слепые и ищейки охотятся на слух */
  var sense = see || (hear && (has(f, "deaf") || has(f, "tracker")));
  if (see || hear) f.lastKnown = heroPos();
  if (sense) f.seenT = 0;
  /* смена состояния */
  if (sense && f.state !== "hunt" && f.state !== "flee") {
    if (f.state === "idle" || f.state === "alert") spotted.push(f);
    f.state = "hunt"; f.lost = 0;
    if (f.ambush) { f.aim = true; f.ambush = false; }
    A("foeSound", f, "alert");
    if (f.kind === "mech" && (iq >= 4 || aff(f, "linked"))) callHelp(f, aff(f, "linked") ? 99 : 10);
  } else if (hear && f.state === "idle") {
    f.state = "alert"; f.lost = 0;
    if (f.kind === "mech" && iq >= 6 && !has(f, "stationary") && Math.random() < 0.5) f.ambush = true;
    if (Math.random() < 0.5) A("foeSound", f, "idle");
  }
  if (f.state === "hunt" && !sense) { f.lost++; if (f.lost > 14) { f.state = "alert"; f.lost = 0; } }
  else if (f.state === "hunt") f.lost = 0;
  /* страж далеко не уходит: потерял вас вдали от поста — назад, на пост */
  if (f.guard && f.post && !sense && f.state !== "idle" && f.state !== "flee") {
    var away = Math.abs(f.x - f.post.x) + Math.abs(f.y - f.post.y), tgtFar = f.lastKnown ? Math.abs(f.lastKnown.x - f.post.x) + Math.abs(f.lastKnown.y - f.post.y) : 0;
    if ((f.state === "alert" && tgtFar > 12) || (f.state === "hunt" && away > 10 && f.lost > 4)) { f.state = "idle"; f.lastKnown = null; f.lost = 0; f.aim = false; }
  }
  /* отступление: умные роботы уходят чиниться */
  if (f.state === "hunt" && iq >= 2 && !f.boss && !has(f, "swarm") && !has(f, "stationary") && f.hp < f.maxhp * 0.3 && !has(f, "kamikaze")) { f.state = "flee"; A("foeSound", f, "retreat"); }
  if (f.state === "flee" && f.hp > f.maxhp * 0.6) f.state = "hunt";

  f.mv++; f.at++;
  var canMove = f.mv >= f.spd && !has(f, "stationary");
  var canAct = f.at >= f.acd;
  var d = dist(f, heroPos());

  /* особые умения */
  if (has(f, "relay") && f.state !== "idle" && canAct) { relayCall(f); f.at = 0; return; }
  if (has(f, "summon") && f.state === "hunt") { f.summonT++; if (f.summonT >= 8) { f.summonT = 0; summon(f); } }
  if (has(f, "blink") && f.state === "hunt" && d > 2) { f.blinkT++; if (f.blinkT >= 5) { f.blinkT = 0; if (blink(f)) return; } }
  if (has(f, "kamikaze") && f.state === "hunt" && f.hp < f.maxhp * 0.4) {
    if (d <= 1) { explode(f, 1, Math.round(f.dmg * 1.8), "phys"); return; }
    if (canMove) { f.mv = 0; stepToward(f, G().x, G().y, { adjacent: true }); if (f.mv === 0 && f.spd > 1) f.mv = 1; }
    return;
  }

  if (has(f, "healer") && f.state !== "idle") {
    f.healT++;
    if (f.healT >= 3) {
      f.healT = 0;
      var healed = 0;
      foes.forEach(function (o) { if (o !== f && hostile(o) && o.kind === f.kind && cheb(o, f) <= 2 && o.hp < o.maxhp) { o.hp = Math.min(o.maxhp, o.hp + Math.round(o.maxhp * 0.06)); healed++; } });
      if (healed) A("foeSound", f, "repair");
    }
  }
  if (has(f, "screamer") && f.state === "hunt" && d <= 6) { f.screamT++; if (f.screamT >= 10) { f.screamT = 0; scream(f); return; } }
  if (has(f, "builder") && f.state === "hunt" && f.built < 2) {
    f.buildT++;
    if (f.buildT >= 10) {
      f.buildT = 0;
      var cbd = freeCellNear(f.x, f.y, f);
      var tt = cbd && LAB.FOES.miniturret ? spawnFoe("miniturret", cbd[0], cbd[1], { from: f.id }) : null;
      if (tt) { f.built++; tt.state = "hunt"; tt.lastKnown = heroPos(); A("foeSound", f, "summon"); sayOnce("bld" + f.id, f.name.split(",")[0] + " ставит турель " + gm().relDir(tt.x, tt.y) + "!", 8000); }
    }
  }
  if (has(f, "burrow") && f.state === "hunt" && d >= 3) { f.burrowT++; if (f.burrowT >= 8) { f.burrowT = 0; f.burrowed = true; A("foeSound", f, "blink_out"); sayOnce("brd" + f.id, f.name.split(",")[0] + " ушёл под настил.", 6000); return; } }
  if (has(f, "charge") && f.state === "hunt" && canMove && (f.x === G().x || f.y === G().y) && d >= 2 && d <= 5 && losTo(f)) { f.mv = 0; chargeAt(f); return; }

  if (f.state === "idle") {
    if (f.task === "leave") { if (canMove) { f.mv = 0; leaveStep(f); } return; }
    if (f.guard && f.post && !has(f, "stationary")) { guardIdle(f, canMove); return; }
    if (f.route && canMove && !has(f, "stationary")) { f.mv = 0; routeStep(f); return; }
    if (f.patrol && canMove && !has(f, "stationary")) { f.mv = 0; patrolStep(f); if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
    if (canMove && !has(f, "ambush") && Math.random() < 0.15) { f.mv = 0; wander(f); }
    if (Math.random() < 0.03 && !aff(f, "cloak")) A("foeSound", f, "idle");
    return;
  }
  if (f.state === "alert") {
    if (f.ambush) { /* засада: не шуметь, ждать, пока герой выйдет на линию */ return; }
    if (canMove && f.lastKnown) {
      f.mv = 0;
      if (f.x === f.lastKnown.x && f.y === f.lastKnown.y) { f.lost++; if (f.lost > 8) { f.state = "idle"; f.lastKnown = null; } else wander(f); }
      else if (!stepToward(f, f.lastKnown.x, f.lastKnown.y)) { f.lost++; if (f.lost > 8) f.state = "idle"; }
    }
    return;
  }
  if (f.state === "flee") {
    if (canMove) { f.mv = 0; if (!stepAway(f) && canAct && d <= Math.max(1, f.rng)) attack(f, see); }
    return;
  }
  /* ── охота ── */
  var ranged = f.rng > 1;
  var punish = iq >= 7 && Date.now() < reloadUntil;
  if (has(f, "indirect")) {
    /* мортира: навесом туда, где слышала героя, стены не мешают */
    if (canAct && f.lastKnown && d <= f.rng) { f.at = 0; mortarShell(f, f.lastKnown.x, f.lastKnown.y); return; }
    if (canMove && d < 3) { f.mv = 0; stepAway(f); }
    return;
  }
  if (!ranged) {
    if (d <= 1) {
      if (canAct) { f.at = 0; attack(f, true); }
      return;
    }
    if (canMove) {
      f.mv = 0;
      if (iq >= 3 && see && inFireLine(f) && d > 2 && Math.random() < 0.45 && sidestep(f)) return;
      var tgt = f.lastKnown || heroPos();
      if (!stepToward(f, tgt.x, tgt.y, { adjacent: true })) wander(f);
      if (punish && f.spd > 0) stepToward(f, G().x, G().y, { adjacent: true });
    }
    return;
  }
  /* стрелок */
  var line = has(f, "turret") ? (f.x === G().x || f.y === G().y) : true;
  if (see && d <= f.rng && line) {
    if (d <= 1 && iq >= 1 && canMove && !has(f, "stationary") && Math.random() < 0.6) { f.mv = 0; if (stepAway(f)) return; }
    if (!canAct) { if (canMove && iq >= 3 && inFireLine(f) && Math.random() < 0.35) { f.mv = 0; sidestep(f); } return; }
    if (!f.aim && !aff(f, "fast") && !punish) { f.aim = true; A("foeSound", f, "aim"); return; }
    f.aim = false; f.at = 0;
    attack(f, true);
    if (iq >= 3 && canMove && !has(f, "stationary") && Math.random() < 0.5) { f.mv = 0; sidestep(f); }
    return;
  }
  f.aim = false;
  if (canMove) {
    f.mv = 0;
    var t2 = f.lastKnown || heroPos();
    if (!stepToward(f, t2.x, t2.y, { adjacent: true })) wander(f);
  }
}
function wander(f) {
  var ks = ["N", "S", "W", "E"];
  var k = ks[Math.floor(Math.random() * 4)], v = DIRV[k];
  var x = f.x + v[0], y = f.y + v[1];
  if (canStand(f, x, y) && (f.room < 0 || CUR().fl.room[idx(x, y)] === f.room || f.state !== "idle")) moveFoe(f, x, y);
}

/* Тревога: роботы рядом (или весь этаж) идут на героя. */
function callHelp(f, radius) {
  var n = 0;
  foes.forEach(function (o) {
    if (o === f || o.dead || o.calm || o.kind !== "mech") return;
    if (dist(o, f) > radius) return;
    if (o.state === "idle") { o.state = "alert"; o.lastKnown = heroPos(); n++; }
  });
  if (n) A("foeSound", f, "radio");
}
function relayCall(f) {
  callHelp(f, 99);
  var spawned = CUR().fs.spawned.filter(function (s) { return s.from === f.id && !(CUR().fs.foes[s.id] && CUR().fs.foes[s.id].dead); }).length;
  if (spawned >= 3 || Math.random() < 0.6) return;
  var c = freeCellNear(f.x, f.y, f);
  if (!c) return;
  var lvF = LAB.LEVELS[G().L].foes.filter(function (id) { var b = LAB.FOES[id]; return b && b.kind === "mech" && (b.beh.indexOf("swarm") >= 0 || /drone|micro/.test(b.snd)); });
  var type = lvF.length ? lvF[Math.floor(Math.random() * lvF.length)] : (G().L >= 9 ? "micro" : "drone");
  var sp = spawnFoe(type, c[0], c[1], { from: f.id });
  if (sp) { A("foeSound", f, "summon"); sp.state = "hunt"; sp.lastKnown = heroPos(); }
}
function summon(f) {
  var bd = f.boss && LAB.BOSSES[f.boss];
  var minion = (bd && bd.minion && LAB.FOES[bd.minion]) ? bd.minion : ({ b_brood: "roach", b_root: "vine" }[f.boss] || "rat");
  var n = foes.filter(function (o) { return !o.dead && o.spawned && o.from === f.id; }).length;
  if (n >= 4) return;
  var c = freeCellNear(f.x, f.y, f);
  if (!c) return;
  var sp = spawnFoe(minion, c[0], c[1], { from: f.id });
  if (sp) { sp.from = f.id; sp.state = "hunt"; sp.lastKnown = heroPos(); A("foeSound", f, "summon"); }
}
function spawnFoe(type, x, y, extra) {
  var base = LAB.FOES[type];
  var L = G().L, F = G().F, d0 = LAB.depth(L, F);
  var lvl = LAB.foeLevel(L, F), sc = LAB.scaleFoe(base, lvl);
  var fs = CUR().fs;
  var def = { id: "s" + (fs.sseq = (fs.sseq || 0) + 1), type: type, x: x, y: y, lvl: lvl, hp: sc.hp, maxhp: sc.hp, dmg: sc.dmg, arm: sc.arm, room: CUR().fl.room[idx(x, y)], iq: LAB.foeIQ(base.kind, d0, 0), spawned: true };
  if (fs.spawned.length > 60) fs.spawned = fs.spawned.filter(function (sd) { return !(fs.foes[sd.id] && fs.foes[sd.id].dead); });
  if (extra) for (var k in extra) def[k] = extra[k];
  fs.spawned.push(def);
  var f = makeRuntime(def, null);
  foes.push(f);
  return f;
}
function blink(f) {
  var c = freeCellNear(G().x, G().y, f);
  if (!c || Math.random() < 0.3) return false;
  A("foeSound", f, "blink_out");
  f.x = c[0]; f.y = c[1]; f.room = CUR().fl.room[idx(c[0], c[1])];
  A("foeSound", f, "blink_in");
  f.at = Math.max(0, f.acd - 1);
  return true;
}

/* ════════ АТАКИ ВРАГОВ ════════ */
function attack(f, seen) {
  var g = G();
  var d = dist(f, heroPos());
  var ranged = d > 1;
  /* только что вошли на этаж: враг наводится, но не бьёт */
  if (tickN < graceT) { A("foeSound", f, ranged ? "aim" : "alert"); return; }
  A("foeSound", f, ranged ? "shoot" : "attack");
  var acc = 0.72 + 0.025 * iqOf(f) + (aff(f, "sniper") ? 0.12 : 0) - (g.agi - 10) * 0.01 - (g.st.haste > 0 ? 0.12 : 0) - (ranged ? 0.015 * d : 0);
  if (ranged && gm().armorSpecial("deflect") && Math.random() < 0.15) { A("play", "deflect"); sayOnce("defl", "Экран отклонил выстрел."); return; }
  if (Math.random() > Math.max(0.2, Math.min(0.95, acc))) { A("foeMiss", f, ranged); return; }
  var dmg = f.dmg;
  if (has(f, "splash")) dmg = Math.round(dmg * 1.1);
  if (commanderNear(f)) dmg = Math.round(dmg * 1.2);
  if (f.chargeHit) dmg = Math.round(dmg * 1.5);
  if (gm().armorSpecial("phaseveil") && Math.random() < 0.15) { A("play", "phase_out"); sayOnce("pveil", "Удар прошёл сквозь вас."); return; }
  var fin = hurtPlayer(dmg, f.adt, f);
  if (G().dead) return;
  if (has(f, "leech") && fin > 0) f.hp = Math.min(f.maxhp, f.hp + Math.round(fin * 0.5));
  if (has(f, "drain") && g.en > 0) { var dr = 6 + Math.floor(g.L / 3); g.en = Math.max(0, g.en - dr); sayOnce("drain", "Энергия имплантов утекает: минус " + dr + "."); }
  if (!ranged && gm().armorSpecial("thorns") && !f.dead) damageFoe(f, Math.max(1, Math.round(dmg * 0.3)), "kinetic", { quiet: true });
  if (has(f, "poison") && Math.random() < 0.5) poison(6 + Math.floor(G().L / 2));
  if (!ranged) bleed(f, fin);
  if (f.adt === "chem" && fin > 0) toxins(2 + Math.round(fin / 6));
  if ((has(f, "slow") || f.adt === "therm" && f.kind === "bio") && Math.random() < 0.5 && !gm().armorSpecial("frost")) { if (!g.st.slow) sayq("Холод сковывает: вы замедлены."); g.st.slow = 6; }
  if (has(f, "web") && ranged && Math.random() < 0.4) { g.st.web = 2; A("play", "web_hit"); sayq(LAB.K("Паутина! Свайп — рвать её.", "Паутина! Шаг в любую сторону — рвать её.")); }
}
function poison(t) {
  var g = G();
  if (g.st.antitox > 0) { sayOnce("atox", "Фильтр не пропустил яд."); return; }
  if (gm().armorSpecial("antitox")) t = Math.ceil(t / 2);
  if (!g.st.poison) { sayq("Вы отравлены. Антидот или большая аптечка снимут яд, сорбент ослабит его."); A("play", "poisoned"); }
  g.st.poison = Math.max(g.st.poison, t);
  /* яд копится в крови токсинами */
  toxins(3 + Math.round(t / 3));
}
function toxins(n) {
  var g = G();
  if (!g.body || g.st.antitox > 0 || n <= 0) return;
  if (gm().armorSpecial("antitox")) n = Math.ceil(n / 2);
  g.body.tox = Math.min(100, g.body.tox + n);
  if (gm().bodyWarn) gm().bodyWarn();
}
/* Кровотечение: когти, лезвия, пилы. Бинт, аптечка — останавливают. */
var BLEEDERS = { chimera: 1, lizard: 1, proto: 1, weaver: 1, labmut: 1, blind: 1, rat: 1, spiderbot: 1, micro: 1, repairbot: 1, gardenbot: 1, b_hydra: 1, b_omega: 1 };
function bleed(f, fin) {
  var g = G();
  if (!g.body || fin <= 0) return;
  var p = (BLEEDERS[f.type] || (f.boss && BLEEDERS[f.boss]) ? 0.3 : f.kind === "bio" ? 0.1 : 0.05) + Math.min(0.15, fin / g.hpMax);
  if (Math.random() > p) return;
  var t = 10 + Math.floor(Math.random() * 10) + Math.floor(g.L / 10);
  if (!g.st.bleed) { sayq("Кровотечение: рана кровит. Бинт или аптечка остановят кровь."); A("play", "hurt_phys"); }
  g.st.bleed = Math.max(g.st.bleed || 0, t);
}
var lastSayOnce = {};
/* prio "urgent" — опасность: звучит раньше ждущих событий (единый обработчик речи) */
function sayOnce(k, t, gap, prio) { var n = Date.now(); if (lastSayOnce[k] && n - lastSayOnce[k] < (gap || 4000)) return; lastSayOnce[k] = n; if (prio) LAB.say(t, { prio: prio }); else sayq(t); }

/* Урон герою: щит, броня, стойкость к виду урона. */
function hurtPlayer(dmg, adt, src, opts) {
  var g = G();
  if (g.dead || g.done) return 0;
  opts = opts || {};
  var raw = dmg;
  if (g.st.shield > 0) {
    var ab = Math.min(g.st.shield, raw);
    g.st.shield -= ab; raw -= ab;
    A("play", "shield_hit");
    if (g.st.shield <= 0) { g.st.shield = 0; sayOnce("shieldgone", "Щит пробит."); }
    if (raw <= 0) return 0;
  }
  var res = gm().armorRes(adt || "phys");
  var cut = gm().armorValue() * 0.35;
  var fin = Math.max(1, Math.round(raw * (1 - res) - cut));
  g.hp -= fin;
  g.lastHurt = Date.now();
  A("hurt", adt, fin, src);
  LAB.vib(fin > g.hpMax * 0.15 ? [80, 40, 80] : 40);
  if (g.hp <= 0) { g.hp = 0; UIx("refresh"); gm().die(); return fin; }
  var pct = Math.round(100 * g.hp / g.hpMax);
  var marks = [75, 50, 30, 15];
  for (var i = 0; i < marks.length; i++) {
    if (hpMark > marks[i] && pct <= marks[i]) { sayq("Здоровье " + g.hp + "."); if (marks[i] <= 30 && !(g.inv.medkit_s > 0 || g.inv.medkit_l > 0)) sayq("Аптечек нет — отступайте."); break; }
  }
  hpMark = pct;
  UIx("refresh");
  return fin;
}

/* Мортира: снаряд падает через полторы секунды — можно уйти. */
var shells = [];
function mortarShell(f, x, y) {
  A("foeSound", f, "mortar_fire");
  shells.push({ x: x, y: y, t: 3, dmg: f.dmg, src: f });
  A("shellIncoming", x, y);
}
function shellsTick() {
  for (var i = shells.length - 1; i >= 0; i--) {
    var s = shells[i];
    s.t--;
    if (s.t > 0) continue;
    shells.splice(i, 1);
    A("explosion", s.x, s.y, "shell");
    if (Math.max(Math.abs(s.x - G().x), Math.abs(s.y - G().y)) <= 1) hurtPlayer(s.dmg, "phys", s.src);
    if (G().dead) return;
  }
}
function explode(f, r, dmg, adt) {
  A("explosion", f.x, f.y, f.kind === "bio" ? "acid" : "bot");
  if (cheb(f, heroPos()) <= r) hurtPlayer(dmg, adt, f);
  foes.forEach(function (o) { if (o !== f && !o.dead && cheb(o, f) <= r) damageFoe(o, Math.round(dmg * 0.5), "kinetic", { quiet: true }); });
  kill(f, true);
}

/* ════════ СОСТОЯНИЯ ГЕРОЯ ════════ */
function statusTick(onlyTimers) {
  var g = G(), st = g.st;
  if (st.poison > 0) {
    st.poison--;
    if (st.poison % 2 === 0) { var pd = 1 + Math.ceil(g.L / 2); g.hp -= pd; A("play", "poison_tick"); if (g.hp <= 0) { g.hp = 0; gm().die(); return; } }
    if (!st.poison) sayq("Яд выветрился.");
  }
  if (st.bleed > 0) {
    st.bleed--;
    if (st.bleed % 2 === 0) { var bdm = 1 + Math.floor(g.L / 4); g.hp -= bdm; if (g.hp <= 0) { g.hp = 0; gm().die(); return; } }
    if (!st.bleed) sayq("Кровотечение остановилось само.");
  }
  if (gm().bodyTick) { gm().bodyTick(); if (G().dead) return; }
  if (st.slow > 0) st.slow--;
  if (st.deaf > 0) st.deaf--;
  if (st.antitox > 0) { st.antitox--; if (!st.antitox) sayq("Фильтр противогаза отработал."); }
  if (st.haste > 0) { st.haste--; if (!st.haste) sayq("Ускорение закончилось."); }
  if (st.cloak > 0) { st.cloak--; if (!st.cloak) { sayq("Маскировка спала."); A("play", "cloak_off"); } }
  if (st.shieldT > 0) { st.shieldT--; if (!st.shieldT && !gm().armorSpecial("regshield")) st.shield = 0; }
  /* броня с восстанавливающимся щитом */
  if (gm().armorSpecial("regshield") && Date.now() - (g.lastHurt || 0) > 3000) {
    var cap = 10 + Math.round(LAB.armorDef(g.armor) * 0.6);
    if (st.shield < cap) { st.shield = Math.min(cap, st.shield + 2); if (st.shield === cap) A("play", "shield_full"); }
  }
  /* понемногу набирается энергия имплантов — если герой не голоден и нервы не перегружены */
  var rg0 = gm().enRegen ? gm().enRegen() : 6;
  if (rg0 && tickN % rg0 === 0 && g.en < g.enMax) g.en++;
  if (onlyTimers) return;
}

/* ════════ ВЫСТРЕЛЫ ГЕРОЯ ════════ */
function weapon() { return gm().curWeapon(); }
function shotGap(w) { var cd = w.cd; if (G().st.haste > 0) cd *= 0.6; return cd; }
/* Кто на линии выстрела: конус вдоль направления. */
function targetsIn(dir, w, exact) {
  var v = DIRV[dir], out = [];
  foes.forEach(function (f) {
    if (f.dead || f.calm || f.ally || f.burrowed) return;
    var dx = f.x - G().x, dy = f.y - G().y;
    var along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
    if (along < 1 || along > w.rng) return;
    var cone = exact ? (w.spread || 0) : (w.spread || 0) + 1 + (along >= 4 ? 1 : 0);
    if (perp > cone) return;
    if (!LAB.los(CUR().fl, CUR().fs, G().x, G().y, f.x, f.y)) return;
    out.push({ f: f, along: along, perp: perp });
  });
  out.sort(function (a, b) { return a.along - b.along || a.perp - b.perp; });
  return out;
}
/* Куда ушёл выстрел: первая стена по направлению. */
function wallHit(dir, rng) {
  var v = DIRV[dir], x = G().x, y = G().y;
  for (var i = 1; i <= rng; i++) {
    var nx = x + v[0] * i, ny = y + v[1] * i;
    if (!LAB.inb(nx, ny)) return [nx - v[0], ny - v[1], i];
    var t = CUR().fl.t[idx(nx, ny)];
    if (t === LAB.T.WALL) return [nx, ny, i];
    if (t === LAB.T.DOOR && CUR().fs.doors[CUR().fl.doorAt[idx(nx, ny)].id] !== 2) return [nx, ny, i];
  }
  return [x + v[0] * rng, y + v[1] * rng, rng];
}
function fire(dir, burst) {
  var g = G(), w = weapon();
  if (!w || !g.drawn || g.dead || gm().paused) return false;
  var now = Date.now();
  if (now - lastShot < shotGap(w) * (burst ? 0.6 : 1)) return false;
  if (now < reloadUntil) { sayOnce("reloading", "Перезарядка..."); return false; }
  g.face = dir;
  if (w.ammo !== "none" || w.cap) {
    if (w.charge <= 0) {
      A("play", "w_empty");
      if (now - lastEmpty > 2500) { lastEmpty = now; say("Заряд пуст. Перезарядка — один палец влево и сразу вправо." + (g.ammo[w.ammo] > 0 ? "" : " Запаса нет: " + LAB.AMMO[w.ammo].n.toLowerCase() + " кончились.")); }
      stopFire();
      return false;
    }
    w.charge--;
  }
  lastShot = now;
  g.stats.shots++;
  var melee = w.rng <= 1;
  var loud = { melee: 2, laser: 6, cryo: 5, thermo: 6, gauss: 10, positron: 12, magnetron: 8 }[LAB.WEAPONS[w.base].cls] || 8;
  if (w.base === "pcannon") loud = 14;
  g.noise = Math.max(g.noise, loud);
  A("shot", w, dir, burst);
  var hits = 0;
  if (melee) {
    var v = DIRV[dir];
    var cands = [[G().x + v[0], G().y + v[1]], [G().x + v[0] + v[1], G().y + v[1] + v[0]], [G().x + v[0] - v[1], G().y + v[1] - v[0]]];
    var tf = null;
    for (var i = 0; i < cands.length && !tf; i++) tf = foeAtCell(cands[i][0], cands[i][1]);
    if (tf && !tf.calm) { hits += shoot(w, tf, 0, 1, burst, true); }
    else A("swingMiss", w);
  } else {
    var list = targetsIn(dir, w, false);
    if (!list.length) {
      var wh = wallHit(dir, w.rng);
      A("shotWall", w, wh[0], wh[1]);
      if (!burst) sayOnce("nobody", "Мимо: там никого.", 2500);
    } else if (w.pierce) {
      targetsIn(dir, w, true).forEach(function (t) { hits += shoot(w, t.f, t.perp, t.along, burst, false); });
      if (!hits) { var wh2 = wallHit(dir, w.rng); A("shotWall", w, wh2[0], wh2[1]); }
    } else {
      var t0 = list[0];
      hits += shoot(w, t0.f, t0.perp, t0.along, burst, false);
      if (!hits) { var wh3 = wallHit(dir, Math.min(w.rng, t0.along + 3)); A("shotWall", w, wh3[0], wh3[1]); }
    }
  }
  if (hits) g.stats.hits++;
  /* шум выстрела будит этаж */
  if (S.turnBased) tick();
  UIx("refresh");
  return true;
}
function foeAtCell(x, y) { for (var i = 0; i < foes.length; i++) if (!foes[i].dead && !foes[i].burrowed && foes[i].x === x && foes[i].y === y) return foes[i]; return null; }
function shoot(w, f, perp, along, burst, melee) {
  var g = G();
  var acc = (melee ? 0.92 : 0.9) - 0.13 * perp - 0.012 * along + (g.agi - 10) * 0.01 + (w.spread ? 0.08 * perp : 0) - (burst ? 0.1 : 0) - (gm().aimPenalty ? gm().aimPenalty() : 0);
  /* умный робот уходит с линии огня */
  var iq = iqOf(f);
  if (!melee && f.kind === "mech" && iq >= 5 && !has(f, "stationary") && f.frozen <= 0) {
    var dodge = Math.min(0.35, 0.035 * iq) + (aff(f, "fast") ? 0.08 : 0);
    if (Math.random() < dodge && sidestep(f)) { A("foeSound", f, "dodge"); if (!burst) sayOnce("dodge" + f.id, f.name.split(",")[0] + " уходит с линии огня!", 3000); wake(f); return 0; }
  }
  if (Math.random() > Math.max(0.1, Math.min(0.97, acc))) {
    A("shotMiss", w, f);
    wake(f);
    return 0;
  }
  var dt = w.dt;
  var dmg = w.dmg;
  if (melee) { dmg *= 1 + (g.str - 10) * 0.03; if (gm().armorSpecial("strength")) dmg *= 1.6; }
  var crit = Math.random() < 0.05 + (g.agi - 10) * 0.008;
  if (crit) dmg *= 1.75;
  var done = damageFoe(f, dmg, dt, { noarmor: !!w.noarmor, crit: crit, melee: melee, burst: burst, freeze: w.freeze });
  if (w.area) foes.forEach(function (o) { if (o !== f && !o.dead && !o.calm && cheb(o, f) <= 1) damageFoe(o, dmg * 0.6, dt, { noarmor: true, quiet: true }); });
  return 1;
}
function wake(f) {
  if (f.ally) return;
  if (f.disguised) { unmask(f); return; }
  if (f.neutral) { f.neutral = false; A("foeSound", f, "alert"); sayOnce("clh" + f.id, f.name.split(",")[0] + " больше не мирный!", 5000); if (LAB.oko && !f.reported) { f.reported = true; LAB.oko.event("cleaner"); } }
  if (f.state !== "hunt" && !f.calm) { f.state = "hunt"; f.lastKnown = heroPos(); }
}

/* Урон врагу. */
function damageFoe(f, raw, dt, o) {
  o = o || {};
  if (f.dead || f.burrowed) return false;
  if (f.phased) { A("foeSound", f, "blink_out"); if (!o.quiet) sayOnce("ph" + f.id, f.name.split(",")[0] + " в фазе: удар проходит сквозь.", 4000); return false; }
  var vs = (LAB.DMG_VS[f.kind] || {})[dt]; if (vs == null) vs = 1;
  var res = f.base.res && f.base.res[dt] != null ? f.base.res[dt] : 1;
  if (aff(f, "hardened") && (dt === "emp" || dt === "ion")) vs *= dt === "emp" ? 0 : 0.5;
  var dmg = raw * vs * res * (1 - (f.adapt[dt] || 0));
  /* щитоносец прикрывает соседей */
  if (foes.some(function (s) { return s !== f && !s.dead && !s.calm && has(s, "shieldally") && cheb(s, f) <= 2; })) dmg *= 0.6;
  if (!o.noarmor) dmg -= f.arm * 0.5;
  dmg = Math.max(1, dmg);
  if (f.shield > 0) {
    var mult = (dt === "shock" || dt === "ion" || dt === "emp") ? 2.5 : 1;
    var ab = Math.min(f.shield, dmg * mult);
    f.shield -= ab; dmg -= ab / mult;
    if (f.shield <= 0) { f.shield = 0; A("foeSound", f, "shield_break"); if (!o.quiet) sayOnce("sb" + f.id, "Щит пробит: " + f.name.split(",")[0].toLowerCase() + ".", 3000); }
    else A("foeSound", f, "shield_hit");
  }
  dmg = Math.round(Math.max(0, dmg));
  if (aff(f, "adaptive") && dmg > 0) {
    var before = f.adapt[dt] || 0;
    f.adapt[dt] = Math.min(0.6, before + 0.12);
    if (before < 0.36 && f.adapt[dt] >= 0.36 && !o.quiet) sayOnce("adapt" + f.id, f.name.split(",")[0] + " привыкает к этому оружию. Смените оружие.", 6000);
  }
  if (o.freeze) f.frozen = o.freeze;
  if (has(f, "reflect") && !o.ally && dmg > 0 && Math.random() < 0.5) { var back = Math.max(1, Math.round(dmg * 0.2)); A("play", "deflect"); sayOnce("rfl" + f.id, f.name.split(",")[0] + " отражает часть удара!", 6000); hurtPlayer(back, "field", f, { quiet: true }); }
  f.hp -= dmg; f.hitT = 0;
  wake(f);
  if (f.hp <= 0) { kill(f); return true; }
  A("foeHit", f, dt, dmg, o.crit);
  if (!o.burst && !o.quiet) {
    var pct = f.hp / f.maxhp;
    if (o.crit) sayOnce("crit", o.melee ? "Сокрушительный удар!" : "Точно в цель!", 1500);
    else if (pct < 0.25) sayOnce("hp" + f.id + "a", f.name.split(",")[0] + " едва держится.", 5000);
    else if (pct < 0.55) sayOnce("hp" + f.id + "b", f.name.split(",")[0] + " " + (f.kind === "mech" ? (f.g === "f" ? "повреждена" : "повреждён") : (f.g === "f" ? "ранена" : "ранен")) + ".", 5000);
  }
  return true;
}
function kill(f, quiet) {
  if (f.dead) return;
  f.dead = true;
  var g = G(), fs = CUR().fs;
  fs.foes[f.id] = { dead: true };
  g.stats.kills++;
  A("foeDeath", f);
  LAB.vib(30);
  var xp = Math.round((f.base.xp || 10) * (1 + 0.1 * (f.lvl - 1)) * (f.aff ? 1 + 0.25 * f.aff.length : 1) * (f.boss ? 6 : 1));
  if (f.spawned) xp = Math.round(xp * 0.4);
  /* добыча падает на клетку врага */
  var drops = (f.carry || []).slice().concat(f.bag || []);
  if (LAB.oko && f.kind === "mech" && !f.ally) LAB.oko.event("kill", { task: f.task, stalker: has(f, "stalker"), camera: has(f, "camera"), guard: f.guard, post: f.post, x: f.x, y: f.y });
  if (LAB.oko && f.boss) LAB.oko.event("boss");
  if (has(f, "commander")) {
    var lost = 0;
    foes.forEach(function (o) { if (o !== f && hostile(o) && o.kind === "mech" && cheb(o, f) <= 8) { o.confused = 10; lost++; } });
    if (lost && !quiet) sayq("Роботы рядом потеряли начальника и растерялись.");
  }
  var r = Math.random, L = g.L, dk = diff().loot;
  if (!f.spawned) {
    if (f.kind === "mech") {
      if (r() < 0.6 * dk) drops.push({ kind: "item", item: LAB.partAt({ pick: function (a) { return a[Math.floor(r() * a.length)]; }, chance: function (p) { return r() < p; } }, L), n: 1 });
      if (r() < 0.25 * dk) drops.push({ kind: "ammo", ammo: L >= 3 && r() < 0.3 ? "magnetron" : "energy", n: 1 });
      if (f.aff && r() < 0.35) drops.push({ kind: "item", item: L >= 5 && r() < 0.4 ? "supercond" : L >= 3 ? "ceramic" : "chip", n: 1 });
    } else if (f.kind === "anom") {
      if (r() < 0.45 * dk) drops.push({ kind: "item", item: LAB.partAt({ pick: function (a) { return a[Math.floor(r() * a.length)]; }, chance: function (p) { return r() < p; } }, L), n: 1 });
      if (r() < 0.12 * dk) drops.push({ kind: "item", item: "energy_d", n: 1 });
    } else {
      if (r() < 0.35 * dk) drops.push({ kind: "item", item: r() < 0.6 ? "gel" : "reagent", n: 1 });
      if (r() < 0.12 * dk) drops.push({ kind: "item", item: "medkit_s", n: 1 });
      if (r() < 0.15 * dk) drops.push({ kind: "ammo", ammo: "energy", n: 1 }); /* батарея из кармана бывшего сотрудника */
    }
    if (r() < 0.3) drops.push({ kind: "credits", n: LAB.credits(4 + r() * 12, L, g.F) });
  }
  if (drops.length) {
    var cx = f.x, cy = f.y;
    if (CUR().fl.t[idx(cx, cy)] === LAB.T.DOOR) { var c = freeCellNear(cx, cy, null); if (c) { cx = c[0]; cy = c[1]; } }
    drops.forEach(function (it) { it.id = "d" + (fs.dseq = (fs.dseq || 0) + 1); it.x = cx; it.y = cy; fs.drops.push(it); });
    A("dropLoot", cx, cy);
  }
  if (has(f, "split") && !f.splitGen && !quiet) {
    for (var si = 0; si < 2; si++) {
      var sc = freeCellNear(f.x, f.y, null);
      if (!sc) break;
      var half = spawnFoe(f.type, sc[0], sc[1], { splitGen: 1, from: f.id });
      if (half) { half.hp = half.maxhp = Math.max(4, Math.round(half.maxhp * 0.45)); half.state = "hunt"; half.lastKnown = heroPos(); }
    }
    sayq(f.name.split(",")[0] + " распадается надвое!");
  }
  if (!quiet) {
    var verb = f.kind === "mech" ? (f.g === "f" ? "уничтожена" : "уничтожен") : f.kind === "anom" ? (f.g === "f" ? "развеяна" : "развеян") : (f.g === "f" ? "убита" : "убит");
    sayq(f.name.split(",")[0] + " " + verb + "." + (drops.length ? " Что-то упало." : ""));
  }
  if (f.boss) {
    LAB.UI.fanfare();
    sayq("Страж повержен: " + LAB.BOSSES[f.boss].n + ".");
    gm().journal("Повержен страж: " + LAB.BOSSES[f.boss].n + ".");
  }
  if ((has(f, "explode") || aff(f, "volatile")) && !quiet) {
    var self = f;
    setTimeout(function () {
      A("explosion", self.x, self.y, self.kind === "bio" ? "acid" : "bot");
      if (cheb(self, heroPos()) <= 1) hurtPlayer(Math.round(self.dmg * 1.4), self.kind === "bio" ? "chem" : "phys", self);
    }, 350);
  }
  gm().gainXP(xp);
  gm().checkQuests();
  syncFoes();
}

/* Очередь: удержание после свайпа. */
function startFire(dir) {
  stopFire();
  var w = weapon();
  if (!w || !G().drawn) return;
  hold = { dir: dir };
  var h = hold;
  var loop = function () {
    if (hold !== h) return;
    var wn = weapon();
    if (!wn) { stopFire(); return; }
    fire(h.dir, true);
    if (hold !== h) return;
    h.t = setTimeout(loop, Math.max(110, shotGap(wn) * 0.6));
  };
  loop();
}
function stopFire() { if (hold) { clearTimeout(hold.t); hold = null; } }

/* ════════ ПРОЧЕЕ ════════ */
function hostile(f) { return !f.dead && !f.calm && !f.ally && !f.neutral && !f.disguised; }
function danger() {
  return foes.some(function (f) { return hostile(f) && !has(f, "camera") && f.state === "hunt" && dist(f, heroPos()) <= 9; });
}
/* Кто гонится вплотную: подвижный враг, которому до героя по настоящему
   пути (с дверями, которые он умеет открывать) не больше четырёх шагов.
   Турели, камеры и враги за стеной без прохода — не в счёт. */
function chaser() {
  var hp = heroPos(), fl = CUR().fl, fs = CUR().fs, best = null;
  foes.forEach(function (f) {
    if (best || !hostile(f) || f.burrowed || f.state !== "hunt" || has(f, "stationary") || f.frozen > 0) return;
    var d = dist(f, hp);
    if (d > 5) return;
    if (d <= 1) { best = f; return; }
    var p = LAB.bfs(fl, fs, f.x, f.y, function (x, y) { return Math.abs(x - hp.x) + Math.abs(y - hp.y) <= 1; }, { passDoor: function (dd) { return foeOpens(f, dd); }, maxDist: 4 });
    if (p && p.length <= 4) best = f;
  });
  return best;
}
function hunted() { return !!chaser(); }
function visibleFoes(r) {
  return foes.filter(function (f) {
    if (f.dead || f.disguised || f.burrowed) return false;
    var d = dist(f, heroPos());
    if (d > r) return false;
    if (aff(f, "cloak") && d > 3) return false;
    return LAB.los(CUR().fl, CUR().fs, G().x, G().y, f.x, f.y);
  }).map(function (f) { return f; });
}
function nearestFoe(r) {
  var v = visibleFoes(r || 10).filter(function (f) { return !f.calm; });
  v.sort(function (a, b) { return dist(a, heroPos()) - dist(b, heroPos()); });
  return v[0] || null;
}
function aliveCount() { return foes.filter(function (f) { return hostile(f); }).length; }
function jammed() { return foes.some(function (f) { return !f.dead && !f.calm && aff(f, "jammer") && cheb(f, heroPos()) <= 6; }); }
function noise(n) { G().noise = Math.max(G().noise, n); }
/* Турели этажа: отключить, перехватить, вернуть ОКО. Переносные — не трогаются. */
function isNetTurret(f) { return !f.dead && has(f, "turret") && !f.shots; }
function turretsLeft() { return foes.filter(isNetTurret).length; }
function turretsOff() { CUR().fs.turretMode = "off"; foes.forEach(function (f) { if (isNetTurret(f)) { f.calm = true; f.ally = false; f.state = "idle"; f.aim = false; } }); }
function turretsOurs() { CUR().fs.turretMode = "ours"; foes.forEach(function (f) { if (isNetTurret(f)) { f.calm = false; f.ally = true; f.state = "idle"; f.aim = false; f.at = 0; } }); }
function turretsHostile() { CUR().fs.turretMode = "on"; foes.forEach(function (f) { if (isNetTurret(f)) { f.calm = false; f.ally = false; f.state = "alert"; f.lastKnown = heroPos(); } }); }
function robotsCalm() { foes.forEach(function (f) { if (f.kind === "mech" && !f.ally) { f.calm = true; f.state = "idle"; } }); }
/* Тревога: роботы этажа идут на след. */
function alertMech(x, y, radius) {
  foes.forEach(function (f) {
    if (!hostile(f) || f.kind !== "mech" || has(f, "stationary")) return;
    if (Math.abs(f.x - x) + Math.abs(f.y - y) > radius) return;
    if (f.state === "idle" || f.state === "alert") { f.state = "alert"; f.lastKnown = { x: x, y: y }; f.lost = 0; }
  });
}
/* Откуда выйти машине ОКО: клетка, от которой можно дойти до цели (по
   открытым и незапертым дверям), не на виду у героя и не ближе minHero
   шагов к нему; лучше — у двери, будто машина вошла с другого этажа. */
function okoPass(d) { var st = CUR().fs.doors[d.id]; if (d.lock && d.lock.type === "secret") return false; return st === 2 || !d.lock || st === 1; }
function okoPoint(o) {
  o = o || {};
  var fl = CUR().fl, fs = CUR().fs, W = LAB.W, H = LAB.H, hp = heroPos();
  var src = o.from || o.to || hp, minH = o.minHero != null ? o.minHero : 12;
  var dmin = o.dmin != null ? o.dmin : 10, dmax = o.dmax || 48;
  var dm = new Int16Array(W * H).fill(-1), s0 = idx(src.x, src.y), q = [s0], qi = 0, band = [], doorAdj = [], any = [];
  dm[s0] = 0;
  while (qi < q.length) {
    var u = q[qi++], x = u % W, y = (u / W) | 0;
    if (u !== s0 && fl.t[u] !== LAB.T.DOOR && canStand(null, x, y)) {
      var dh = Math.abs(x - hp.x) + Math.abs(y - hp.y);
      if (dh >= minH && (o.hidden === false || !LAB.los(fl, fs, x, y, hp.x, hp.y))) {
        any.push([x, y, dm[u]]);
        if (dm[u] >= dmin && dm[u] <= dmax) {
          band.push([x, y]);
          if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { return LAB.inb(x + v[0], y + v[1]) && fl.t[idx(x + v[0], y + v[1])] === LAB.T.DOOR; })) doorAdj.push([x, y]);
        }
      }
    }
    if (dm[u] >= 160) continue;
    for (var k = 0; k < 4; k++) {
      var v = DIRV[["N", "S", "W", "E"][k]], nx = x + v[0], ny = y + v[1];
      if (!LAB.inb(nx, ny)) continue;
      var j = idx(nx, ny);
      if (dm[j] >= 0) continue;
      var tt = fl.t[j];
      if (tt === LAB.T.WALL || fl.objAt[j]) continue;
      if (tt === LAB.T.DOOR) { var d = fl.doorAt[j]; if (fs.doors[d.id] !== 2 && !okoPass(d)) continue; }
      dm[j] = dm[u] + 1; q.push(j);
    }
  }
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  if (doorAdj.length && Math.random() < 0.7) return pick(doorAdj);
  if (band.length) return pick(band);
  if (!any.length) return null;
  any.sort(function (a, b) { return a[2] - b[2]; });
  var c = any[Math.min(any.length - 1, Math.floor(any.length / 3))];
  return [c[0], c[1]];
}
function okoPool(mode) {
  var lev = LAB.LEVELS[G().L], ids = lev.foes, pool;
  var mobile = function (id) { var b = LAB.FOES[id]; return b && b.kind === "mech" && ["stationary", "cleaner", "mimic", "camera", "turret", "swarm"].every(function (k) { return b.beh.indexOf(k) < 0; }); };
  if (mode === "repair") { pool = ids.filter(function (id) { return /repair/.test(id) && LAB.FOES[id] && LAB.FOES[id].kind === "mech"; }); if (!pool.length) pool = ["repairbot"]; return pool; }
  if (mode === "drone") return ["okodrone"];
  if (mode === "patrol") {
    pool = ids.filter(function (id) { var b = LAB.FOES[id]; return mobile(id) && (b.beh.indexOf("patrol") >= 0 || b.beh.indexOf("ranged") >= 0); });
    if (pool.length) return pool;
  }
  pool = ids.filter(mobile);
  return pool.length ? pool : ["patrolbot"];
}
/* Отряд ОКО. mode: hunt — на ваш след; check — проверить точку (терминал,
   камеру, шум); repair — ремонтник к турелям; patrol — патрульный новой
   смены; drone — дрон слежения; post — смена на опустевший пост (at — пост
   и его вид). Двери отряду открывает ОКО; кто вас не нашёл — остаётся на
   этаже патрулём. Возвращает вышедших. */
var lastSquad = null;
function dispatch(n, mode, at) {
  var fs = CUR().fs, hp = heroPos(), pool = okoPool(mode), got = [];
  var to = at || hp;
  if (mode === "repair") {
    var t = null, bd = 1e9;
    foes.forEach(function (o) { if (isNetTurret(o) && o.calm) { var d = dist(o, hp); if (d < bd) { bd = d; t = o; } } });
    if (!t) return got;
    to = t;
  }
  var p = okoPoint({ to: to, minHero: mode === "drone" ? 9 : 12, dmin: mode === "check" || mode === "hunt" ? 8 : 10 });
  if (!p) return got;
  for (var i = 0; i < n; i++) {
    var c = i === 0 && canStand(null, p[0], p[1]) ? p : freeCellNear(p[0], p[1], null);
    if (!c) break;
    var type = mode === "repair" && i > 0 ? okoPool("hunt")[Math.floor(Math.random() * okoPool("hunt").length)] : pool[Math.floor(Math.random() * pool.length)];
    if (!LAB.FOES[type]) type = "patrolbot";
    var ex = { squad: true, oko: true, fresh: !!fs.robots, task: mode === "repair" && i === 0 ? "repair" : null };
    if (mode === "post") { ex.guard = to.kind || "post"; ex.post = [to.x, to.y]; }
    var sp = spawnFoe(type, c[0], c[1], ex);
    if (!sp) break;
    sp.task = mode === "repair" && i === 0 ? "repair" : null;
    sp.route = [];
    if (mode === "post") { sp.state = "idle"; sp.route = null; }
    else if (mode === "patrol") { sp.state = "idle"; sp.route = makeRoute(sp, at || null) || []; }
    else if (mode === "repair" && i > 0) { sp.state = "idle"; sp.route = makeRoute(sp, { x: to.x, y: to.y }) || []; }
    else if (mode === "check") { sp.state = "alert"; sp.lastKnown = { x: to.x, y: to.y }; }
    else if (mode === "repair") { sp.state = "alert"; sp.lastKnown = { x: to.x, y: to.y }; }
    else { sp.state = "hunt"; sp.lastKnown = { x: to.x, y: to.y }; }
    sp.lost = 0;
    got.push(sp);
  }
  if (got.length) {
    A("foeSound", { x: p[0], y: p[1], id: "squad" + got[0].id, snd: mode === "drone" ? "drone" : "robot", kind: "mech" }, mode === "drone" ? "alert" : "radio");
    var dn = doorNear(p[0], p[1]);
    if (dn) A("doorOpen", dn, true);
  }
  lastSquad = got.length ? { x: p[0], y: p[1], n: got.length, mode: mode } : null;
  return got;
}
function sendSquad(n, mode) { return dispatch(n, mode).length; }
function doorNear(x, y) {
  var fl = CUR().fl;
  for (var k = 0; k < 4; k++) { var v = DIRV[["N", "S", "W", "E"][k]], nx = x + v[0], ny = y + v[1]; if (LAB.inb(nx, ny) && fl.t[idx(nx, ny)] === LAB.T.DOOR) return fl.doorAt[idx(nx, ny)]; }
  return null;
}
/* Живые машины ОКО на этаже: патрули, ремонтники, дроны, стражи. */
function patrols() { return foes.filter(function (f) { return hostile(f) && f.kind === "mech" && !f.guard && !has(f, "stalker") && f.task !== "repair" && f.task !== "leave" && (f.route || f.patrol); }); }
function drones() { return foes.filter(function (f) { return hostile(f) && has(f, "stalker"); }); }
function repairers() { return foes.filter(function (f) { return hostile(f) && f.task === "repair"; }); }
function guards() { return foes.filter(function (f) { return hostile(f) && f.guard; }); }
/* Ближайшие спокойные патрули — проверить точку. */
function sendCheck(x, y, n) {
  var list = patrols().filter(function (f) { return f.state === "idle"; });
  list.sort(function (a, b) { return (Math.abs(a.x - x) + Math.abs(a.y - y)) - (Math.abs(b.x - x) + Math.abs(b.y - y)); });
  list.slice(0, n || 1).forEach(function (f) { reroute(f, { x: x, y: y }); });
  return Math.min(list.length, n || 1);
}
function dismiss(f) { if (!f || f.dead) return false; f.task = "leave"; f.exit = null; f.stuck = 0; if (f.state === "alert") f.state = "idle"; return true; }
/* Переносная турель игрока: встаёт впереди и бьёт врагов на своей линии. */
function deployTurret(shots) {
  var g = G(), v = DIRV[g.face] || DIRV.N, x = g.x + v[0], y = g.y + v[1];
  if (!canStand(null, x, y) || CUR().fl.t[idx(x, y)] === LAB.T.DOOR) { var c = freeCellNear(g.x, g.y, null); if (!c) return false; x = c[0]; y = c[1]; }
  var t = spawnFoe("miniturret", x, y, { ally: true, shots: shots || 30 });
  if (!t) return false;
  t.ally = true; t.shots = shots || 30; t.state = "hunt";
  A("play", "craft");
  return { x: x, y: y };
}
/* Шумовая приманка: враги рядом идут на звук. */
function noiseLure(x, y) {
  var n = 0;
  foes.forEach(function (f) {
    if (!hostile(f) || has(f, "stationary")) return;
    if (Math.abs(f.x - x) + Math.abs(f.y - y) > 14) return;
    if (f.state === "hunt" && sees(f)) return;
    f.state = "alert"; f.lastKnown = { x: x, y: y }; f.lost = 0; f.lure = 14; n++;
  });
  A("noiseLure", x, y);
  return n;
}
function throwNoise() {
  var g = G();
  if (!(g.inv.noise > 0)) { say("Приманок нет."); return; }
  g.inv.noise--;
  var v = DIRV[g.face] || DIRV.N, x = g.x, y = g.y;
  for (var i = 1; i <= 6; i++) {
    var nx = x + v[0], ny = y + v[1];
    if (!LAB.inb(nx, ny)) break;
    var t = CUR().fl.t[idx(nx, ny)];
    if (t === LAB.T.WALL || (t === LAB.T.DOOR && CUR().fs.doors[CUR().fl.doorAt[idx(nx, ny)].id] !== 2)) break;
    x = nx; y = ny;
  }
  A("grenade", x, y);
  setTimeout(function () { var n = noiseLure(x, y); say("Приманка " + LAB.DIRTO[g.face] + " лязгает и пищит." + (n ? " Слышно, как враги идут к ней: " + n + "." : "")); UIx("refresh"); }, 600);
}
function calmAll() { foes.forEach(function (f) { if (f.state !== "idle") { f.state = "idle"; f.lastKnown = null; f.aim = false; } }); shells = []; hpMark = 100; }
function areaDamage(x, y, r, dmg, dt) {
  var n = 0;
  foes.forEach(function (f) { if (!f.dead && !f.calm && Math.max(Math.abs(f.x - x), Math.abs(f.y - y)) <= r) { if (damageFoe(f, dmg, dt, { noarmor: true, quiet: true })) n++; } });
  return n;
}
function reloadPause(ms) { reloadUntil = Date.now() + ms; stopFire(); }
function afterPlayerMove(from) {
  var g = G(), fs = CUR().fs;
  /* мина под ногой */
  for (var i = 0; i < fs.mines.length; i++) {
    var m = fs.mines[i];
    if (m.x === g.x && m.y === g.y) {
      fs.mines.splice(i, 1);
      A("explosion", m.x, m.y, "mine");
      say("Мина!");
      hurtPlayer(m.dmg, "phys", null);
      break;
    }
  }
  /* мина рядом пищит */
  fs.mines.forEach(function (m2) { if (Math.abs(m2.x - g.x) + Math.abs(m2.y - g.y) <= 2) A("mineBeep", m2.x, m2.y); });
  if (S.turnBased) tick();
}
/* Описание врага для сканера и окна персонажа. */
function describe(f) {
  var d = dist(f, heroPos());
  var hp = f.hp / f.maxhp, fem = f.g === "f";
  var st = hp > 0.75 ? (fem ? "цела" : "цел") : hp > 0.4 ? (f.kind === "mech" ? (fem ? "повреждена" : "повреждён") : (fem ? "ранена" : "ранен")) : "едва держится";
  return f.name + ", " + gm().relDir(f.x, f.y) + ", " + st + (f.shield > 0 ? ", под щитом" : "") + (f.calm ? ", не враждебен" : f.state === "hunt" ? ", охотится" : f.state === "alert" ? ", насторожен" : "");
}

/* ════════ ИМПЛАНТЫ И ГРАНАТЫ ════════ */
function useImplant(id) {
  var g = G();
  if (g.implants.indexOf(id) < 0) { say("Такого импланта нет."); return; }
  if (id === "hack") { say("Дистанционный взлом применяется у запертой двери: " + LAB.K("двойное касание у двери.", "Enter у двери.")); return; }
  if ((id === "scan" || id === "echo") && jammed()) { A("play", "jam"); say("Помехи: глушилка робота рядом забивает сканер."); return; }
  if (!gm().spendEnergy(id)) return;
  A("implant", id);
  var L = g.L, n;
  switch (id) {
    case "scan": {
      var list = foes.filter(function (f) { return !f.dead && dist(f, heroPos()) <= 8 && !(aff(f, "cloak") && dist(f, heroPos()) > 3); });
      var items = gm().floorItems().filter(function (it) { return Math.abs(it.x - g.x) + Math.abs(it.y - g.y) <= 8; });
      var parts = [];
      parts.push(list.length ? "Враги: " + list.map(describe).join("; ") + "." : "Врагов рядом нет.");
      if (items.length) parts.push("Вещи: " + items.slice(0, 6).map(function (it) { return gm().itemName(it) + " " + gm().relDir(it.x, it.y); }).join(", ") + ".");
      var sec = gm().nearSecret(4);
      if (sec) parts.push("Пустота за стеной " + LAB.DIRN[sec.dir] + ": тайник.");
      var mines = CUR().fs.mines.filter(function (m) { return Math.abs(m.x - g.x) + Math.abs(m.y - g.y) <= 8; });
      if (mines.length) parts.push("Мины: " + mines.map(function (m) { return gm().relDir(m.x, m.y); }).join(", ") + ".");
      say(parts.join(" "));
      break;
    }
    case "regen": { var b = g.hp; g.hp = Math.min(g.hpMax, g.hp + 30 + L * 4); var bl = g.st.bleed > 0; g.st.bleed = 0; say("Регенерация: плюс " + (g.hp - b) + ". Здоровье " + g.hp + "." + (bl ? " Кровотечение остановлено." : "")); hpMark = Math.round(100 * g.hp / g.hpMax); break; }
    case "empulse": n = areaDamage(g.x, g.y, 3, 40 + L * 12, "emp"); foes.forEach(function (f) { if (!f.dead && f.kind === "mech" && cheb(f, heroPos()) <= 3 && !aff(f, "hardened")) f.shield = 0; }); say("ЭМИ-импульс. Задето роботов: " + n + "."); break;
    case "shield": g.st.shield = Math.max(g.st.shield, 40 + L * 6); g.st.shieldT = 30; say("Силовой щит: " + g.st.shield + "."); break;
    case "haste": g.st.haste = 20; say("Ускорение: десять секунд."); break;
    case "thermal": n = 0; foes.forEach(function (f) { if (!f.dead && !f.calm && f.kind === "bio" && cheb(f, heroPos()) <= 2) { damageFoe(f, 35 + L * 10, "thermo", { noarmor: true, quiet: true }); n++; } }); say("Термоимпульс. Обожжено тварей: " + n + "."); break;
    case "cloak": g.st.cloak = 16; foes.forEach(function (f) { if (f.state === "hunt") { f.state = "alert"; f.aim = false; } }); say("Маскировка: восемь секунд вас не видят."); break;
    case "echo": say(echoText()); break;
    case "tk": telekinesis(); break;
    case "freeze": n = 0; foes.forEach(function (f) { if (!f.dead && !f.calm && cheb(f, heroPos()) <= 3) { f.frozen = 8; n++; } }); say("Криостаз. Заморожено: " + n + "."); break;
    case "pbolt": {
      var v = DIRV[g.face] || DIRV.N, hit = 0;
      foes.forEach(function (f) {
        if (f.dead || f.calm) return;
        var dx = f.x - g.x, dy = f.y - g.y, along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
        if (along > 0 && along <= 12 && perp === 0 && LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y)) { damageFoe(f, 90 + L * 25, "positron", { noarmor: true, quiet: true }); hit++; }
      });
      say("Позитронный разряд " + LAB.DIRTO[g.face] + ". Задето: " + hit + ".");
      break;
    }
  }
  UIx("refresh");
}
function echoText() {
  var g = G(), out = [];
  ["N", "E", "S", "W"].forEach(function (k) {
    var v = DIRV[k], n = 0, what = "стена";
    for (var i = 1; i <= 12; i++) {
      var x = g.x + v[0] * i, y = g.y + v[1] * i;
      if (!LAB.inb(x, y)) break;
      var t = CUR().fl.t[idx(x, y)];
      if (t === LAB.T.WALL) { what = "стена"; break; }
      if (t === LAB.T.DOOR) { var d = CUR().fl.doorAt[idx(x, y)]; if (d.lock && d.lock.type === "secret" && !CUR().fs.secrets[d.id]) { what = "стена, за ней пустота"; break; } if (CUR().fs.doors[d.id] !== 2) { what = "дверь"; n = i - 1; break; } }
      var o = CUR().fl.objAt[idx(x, y)];
      if (o) { what = gm().objName(o).toLowerCase(); break; }
      n = i;
    }
    out.push(LAB.DIRN[k] + ": " + (n ? LAB.stepsW(n) + ", дальше " + what : what + " вплотную"));
  });
  return "Эхолокация. " + out.join("; ") + ".";
}
function telekinesis() {
  var g = G(), v = DIRV[g.face] || DIRV.N;
  for (var i = 1; i <= 5; i++) {
    var x = g.x + v[0] * i, y = g.y + v[1] * i;
    if (!LAB.inb(x, y) || CUR().fl.t[idx(x, y)] === LAB.T.WALL) break;
    var its = gm().floorItems().filter(function (it) { return it.x === x && it.y === y; });
    if (its.length) {
      its.forEach(function (it) { it.x = g.x; it.y = g.y; });
      A("play", "tk_pull");
      gm().autoPickup();
      return;
    }
  }
  say("Телекинез " + LAB.DIRTO[g.face] + ": на пять шагов вещей нет.");
}
function throwEmp() {
  var g = G();
  if (!(g.inv.emp > 0)) { say("ЭМИ-гранат нет."); return; }
  g.inv.emp--;
  var v = DIRV[g.face] || DIRV.N, x = g.x, y = g.y;
  for (var i = 1; i <= 4; i++) {
    var nx = x + v[0], ny = y + v[1];
    if (!LAB.inb(nx, ny)) break;
    var t = CUR().fl.t[idx(nx, ny)];
    if (t === LAB.T.WALL || (t === LAB.T.DOOR && CUR().fs.doors[CUR().fl.doorAt[idx(nx, ny)].id] !== 2) || foeAtCell(nx, ny)) { if (foeAtCell(nx, ny)) { x = nx; y = ny; } break; }
    x = nx; y = ny;
  }
  A("grenade", x, y);
  var n = 0;
  setTimeout(function () {
    foes.forEach(function (f) {
      if (f.dead || Math.max(Math.abs(f.x - x), Math.abs(f.y - y)) > 2) return;
      if (f.kind === "mech" && !aff(f, "hardened")) f.shield = 0;
      if (damageFoe(f, 50 + g.L * 15, "emp", { noarmor: true, quiet: true })) n++;
    });
    A("explosion", x, y, "emp");
    say("ЭМИ-граната " + LAB.DIRTO[g.face] + ". Задето целей: " + n + ". Осталось гранат: " + (g.inv.emp || 0) + ".");
    noise(10);
    UIx("refresh");
  }, 700);
}

/* Кто заметил героя: одна фраза на всех. */
function announceSpotted(list) {
  var now = Date.now();
  var names = list.map(function (f) { return f.name.split(",")[0] + " " + gm().relDir(f.x, f.y); });
  var verb = list.length > 1 ? "заметили вас" : (list[0].g === "f" ? "заметила вас" : "заметил вас");
  if (now - lastSpot < 2500 && list.length === 1) { sayq(names[0] + "."); lastSpot = now; return; }
  lastSpot = now;
  say(names.join(", ") + " — " + verb + "!", { interrupt: false });
  if (!G().drawn && !G().tut.drawHint) { G().tut.drawHint = 1; sayq(LAB.K("Выньте оружие: одно касание тремя пальцами. Затем свайп в сторону врага — выстрел.", "Достаньте оружие: R. Затем стрелка в сторону врага — выстрел.")); }
}

LAB.combat = {
  loadFoes: loadFoes, syncFoes: syncFoes, wake: start, start: start, stop: stop, tick: tick,
  danger: danger, hunted: hunted, visibleFoes: visibleFoes, nearestFoe: nearestFoe, aliveCount: aliveCount, jammed: jammed,
  afterPlayerMove: afterPlayerMove, noise: noise, turretsOff: turretsOff, turretsOurs: turretsOurs, turretsHostile: turretsHostile, turretsLeft: turretsLeft,
  robotsCalm: robotsCalm, calmAll: calmAll, chaser: chaser, alertMech: alertMech, sendSquad: sendSquad, deployTurret: deployTurret, noiseLure: noiseLure, throwNoise: throwNoise,
  dispatch: dispatch, okoPoint: okoPoint, patrols: patrols, drones: drones, repairers: repairers, guards: guards, sendCheck: sendCheck, reroute: reroute, dismiss: dismiss, despawn: despawn,
  lastSquad: function () { return lastSquad; }, tickN: function () { return tickN; },
  areaDamage: areaDamage, throwEmp: throwEmp, reloadPause: reloadPause, fire: fire, startFire: startFire, stopFire: stopFire,
  useImplant: useImplant, describe: describe, hurtPlayer: hurtPlayer, foes: function () { return foes; }
};
})();
