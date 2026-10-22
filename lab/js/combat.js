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
function diff() { return LAB.dk(); }
var DIRV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

var TICK = 500;
var foes = [];
var timer = null, tickN = 0;
var hold = null;
var reloadUntil = 0, lastShot = 0, lastEmpty = 0, lastHurtSay = 0, lastSpot = 0;
var hpMark = 100;
var graceT = 0, dangerT = 0, calmT = 0;
/* (2.1) Безопасное пробуждение: в новой игре, пока носитель в капсульном
   отсеке первого этажа (до первого выхода из него), враги его не видят и не
   слышат, не бьют и в отсек не заходят — есть время собраться. Вышел из
   отсека или сам ранил врага — защита снята, «Эхо» предупреждает. */
var safeHero = false, safeRoomId = -1;
function wakeSafeTick() {
  var g = G();
  if (!g.wakeSafe) return false;
  var fl = CUR().fl, cap = null;
  if (g.L === 1 && g.F === 1 && fl && !g.dead) for (var i = 0; i < fl.objs.length; i++) if (fl.objs[i].type === "wake") { cap = fl.objs[i]; break; }
  if (cap && fl.room[idx(g.x, g.y)] === cap.room) { safeRoomId = cap.room; return true; }
  endWakeSafe(cap ? "left" : "");
  return false;
}
function endWakeSafe(why) {
  var g = G();
  if (!g.wakeSafe) return;
  g.wakeSafe = 0; safeHero = false;
  if (why === "left") sayq("«Эхо»: «Вы вышли из капсульного отсека. Дальше машины ОКО вас заметят — держите оружие наготове».");
  else if (why === "fight") sayq("«Эхо»: «Вы начали бой — теперь вас видят и слышат все машины вокруг».");
}
function inSafeRoom(x, y) { return safeHero && safeRoomId >= 0 && CUR().fl.room[idx(x, y)] === safeRoomId; }
/* (2.2, просьба игрока) Убежище. Носитель зачистил помещение — в нём пала
   машина или тварь (fs.cleared), — врагов внутри не осталось, а все входы —
   двери, и они закрыты. Пока он внутри, машины и твари его не видят и не
   слышат, двери этого помещения не открывают и в него не входят; ОКО не
   выводит туда отряды и не шлёт замену охраны, а патруль в коридоре
   сменяется как обычно. Открыл дверь или вышел в коридор — убежища нет.
   Камера ОКО в самом помещении, пока цела, видит и докладывает: ОКО знает,
   где вы, и ждёт у двери, — её стоит разбить. */
var refugeId = -1;
function roomClosable(fl, r) { var rm = fl.rooms[r]; return !!(rm && rm.doors && rm.doors.length && !(rm.mouths && rm.mouths.length)); }
function refugeTick() {
  var g = G(), fl = CUR().fl, fs = CUR().fs, was = refugeId;
  refugeId = -1;
  if (!fl || !fs || g.dead) return;
  var r = fl.room[idx(g.x, g.y)];
  if (r != null && r >= 0 && fs.cleared && fs.cleared[r] && roomClosable(fl, r) &&
      fl.rooms[r].doors.every(function (id) { return fs.doors[id] !== 2; }) &&
      !foes.some(function (f) { return hostile(f) && !has(f, "camera") && fl.room[idx(f.x, f.y)] === r; })) refugeId = r;
  if (refugeId >= 0 && was !== refugeId) {
    var cam = foes.some(function (f) { return isCam(f) && !f.camOff && fl.room[idx(f.x, f.y)] === r; });
    sayOnce("refuge" + r, "«Эхо»: «Помещение зачищено, двери закрыты — здесь можно перевести дух. Машины и твари сюда не войдут, пока вы сами не откроете дверь или не выйдете»." + (cam ? " «Но камера ОКО в этом помещении видит вас: пока она цела, ОКО знает, где вы, и будет ждать у двери. Разбейте её»." : ""), 90000);
  } else if (refugeId < 0 && was >= 0 && r === was) sayOnce("refugeOff", "«Эхо»: «Дверь открыта — из коридора вас видно».", 60000);
}
function inRefuge(x, y) { return refugeId >= 0 && CUR().fl.room[idx(x, y)] === refugeId; }
function refugeDoor(d) { var rm = refugeId >= 0 ? CUR().fl.rooms[refugeId] : null; return !!(rm && rm.doors.indexOf(d.id) >= 0); }
/* носитель укрыт: безопасное пробуждение или убежище */
function sheltered() { return safeHero || refugeId >= 0; }
/* Пал враг: помещение, где он стоял (и которое стерёг), зачищено. */
function markCleared(f) {
  var fl = CUR().fl, fs = CUR().fs, rr = [fl.room[idx(f.x, f.y)]];
  if (f.guard === "room" && f.post) rr.push(fl.room[idx(f.post.x, f.post.y)]);
  rr.forEach(function (r) { if (r != null && r >= 0) { if (!fs.cleared) fs.cleared = {}; fs.cleared[r] = 1; } });
}

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
  /* (2.2) режим сложности: прочность и урон, рост с глубиной (к сотому уровню врага —
     ещё доля grow сверху), обзор, быстрота шага и удара */
  var gk = 1 + (dk.grow || 0) * Math.min(1, Math.max(0, (def.lvl || 1) - 1) / 100), hk = dk.hp * gk, mk = dk.dmg * gk;
  var spd0 = base.spd >= 99 ? base.spd : Math.max(1, base.spd + (dk.spd || 0));
  var acd0 = base.acd >= 99 ? base.acd : dk.acd < 0 ? (base.acd >= 3 ? base.acd + dk.acd : base.acd) : base.acd + (dk.acd || 0);
  var f = {
    id: def.id, type: def.type, base: base, boss: def.boss || null, kind: base.kind, g: bdef ? bdef.g : base.g,
    beh: bdef && bdef.beh ? bdef.beh : base.beh, rng: bdef && bdef.rng ? bdef.rng : base.rng,
    spd: spd0, acd: acd0, det: Math.max(2, base.det + (dk.det || 0)), adt: base.adt || "phys", snd: bdef ? bdef.snd : base.snd,
    x: def.x, y: def.y, lvl: def.lvl, maxhp: Math.round(def.maxhp * hk), dmg: Math.max(1, Math.round(def.dmg * mk)), arm: def.arm,
    aff: def.aff || null, iq: Math.max(0, Math.min(12, (def.iq || 0) + dk.iq)), carry: def.carry || null, room: def.room,
    shieldMax: def.shieldMax ? Math.round(def.shieldMax * hk) : 0,
    state: "idle", mv: 0, at: 0, hitT: 99, seenT: 99, lost: 0, aim: false, frozen: 0, adapt: {}, minesLeft: 3, summonT: 0, blinkT: 0,
    lastKnown: null, ambush: false, calm: false, spawned: !!def.spawned,
    ally: !!def.ally, shots: def.shots || 0, corr: def.corr != null ? def.corr : null, patrol: !!def.patrol || (base.beh.indexOf("patrol") >= 0),
    neutral: base.beh.indexOf("cleaner") >= 0, disguised: base.beh.indexOf("mimic") >= 0, bag: [], camT: 0, buildT: 0, built: 0, screamT: 0, phaseT: 0, phased: false,
    burrowT: 0, burrowed: false, confused: 0, healT: 0, splitGen: def.splitGen || 0, from: def.from || null, task: def.task || null,
    /* машины ОКО: стражи постов, отряды, патрули смены, дроны слежения */
    guard: def.guard || null, post: def.post ? { x: def.post[0], y: def.post[1] } : null, oko: !!(def.oko || def.squad || def.guard), squad: !!def.squad, fresh: !!def.fresh,
    route: null, ri: 0, stuck: 0, exit: null, repT: 0, fixT: 0, heatN: 0, over: 0, nodeT: 0,
    /* (2.0) участок обхода патруля, рабочая машина кабинета, сапёр ОКО */
    beat: def.beat || null, bi: def.bi || 0, bdir: 1, work: !!def.work, garrison: def.garrison || null, sapper: !!def.sapper || base.beh.indexOf("mines") >= 0,
    /* (2.0) страж лестницы, лифта или шлюза (вид объекта) и тварь, обжившая кабинет */
    stairPost: def.stairPost || null, lair: !!def.lair,
    /* (2.2) камера в углу помещения смотрит по комнате — от стены к стене */
    camLook: def.camLook || null
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
    if (st.noCarry) { f.carry = null; f.noCarry = true; }
    if (st.built) f.built = st.built;
    if (st.reported) f.reported = true;
  }
  return f;
}
/* (2.2, просьба игрока) Число врагов по режиму. Кого это касается: охраны
   кабинетов, патрулей, стражей постов, тварей; стражи уровней, носители
   ключей и вещей, турели, камеры, мирные и неподвижные — как есть. Выбор — по
   номеру врага, он один и тот же при каждом входе, поэтому этаж не «пляшет»;
   смена режима действует со следующего входа на этаж. Напарник встаёт рядом,
   в том же помещении или коридоре, и считается присланным: опыта за него
   меньше, добычи нет. */
function countable(def) {
  var b = LAB.FOES[def.type];
  if (!b || def.boss || def.ally || def.spawned || def.task || def.twin || (def.carry && def.carry.length)) return false;
  return !["turret", "camera", "cleaner", "stationary", "mimic", "relay", "observer"].some(function (k) { return b.beh.indexOf(k) >= 0; });
}
function dkRoll(id, salt) { return (LAB.hash32(CUR().key + ":" + salt + ":" + id) >>> 0) % 1000 / 1000; }
var TWIN_AT = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
function twinOf(def) {
  var fl = CUR().fl, r0 = fl.room[idx(def.x, def.y)];
  for (var i = 0; i < TWIN_AT.length; i++) {
    var x = def.x + TWIN_AT[i][0], y = def.y + TWIN_AT[i][1];
    if (!LAB.inb(x, y) || fl.room[idx(x, y)] !== r0) continue;
    var t = fl.t[idx(x, y)];
    if (t === LAB.T.WALL || t === LAB.T.DOOR || LAB.solidAt(fl, x, y)) continue;
    if ((x === G().x && y === G().y) || fl.foes.some(function (d) { return d.x === x && d.y === y; }) || foes.some(function (f) { return f.x === x && f.y === y; })) continue;
    var tw = {}, k;
    for (k in def) tw[k] = def[k];
    tw.id = def.id + "d"; tw.x = x; tw.y = y; tw.twin = true; tw.spawned = true; tw.carry = null;
    if (def.post) tw.post = [x, y];
    return tw;
  }
  return null;
}
function loadFoes() {
  var fl = CUR().fl, fs = CUR().fs;
  foes = [];
  refugeId = -1; /* (2.2) убежище прежнего этажа здесь не действует — до первого такта */
  hold = null;
  shells = []; /* снаряды прошлого этажа сюда не падают */
  if (!fs.foes) fs.foes = {};
  if (!fs.spawned) fs.spawned = [];
  /* (2.2) сколько врагов — по режиму сложности (count): в лёгком часть машин и
     тварей не выходит, в сложных у части — напарник рядом */
  var cnt = diff().count || 1;
  fl.foes.forEach(function (def) {
    if (!LAB.FOES[def.type]) return; /* вид из прежней версии игры */
    var st = fs.foes[def.id], cnt0 = countable(def);
    if (cnt < 1 && cnt0 && dkRoll(def.id, "skip") >= cnt) return;
    if (!(st && st.dead)) foes.push(makeRuntime(def, st));
    if (cnt > 1 && cnt0 && dkRoll(def.id, "twin") < cnt - 1) {
      var tw = twinOf(def), st2 = tw ? fs.foes[tw.id] : null;
      if (tw && !(st2 && st2.dead)) foes.push(makeRuntime(tw, st2));
    }
  });
  fs.spawned = fs.spawned.filter(function (def) { return !!LAB.FOES[def.type]; });
  fs.spawned.forEach(function (def) {
    var st = fs.foes[def.id];
    if (st && st.dead) return;
    foes.push(makeRuntime(def, st));
  });
  foes.forEach(function (f) {
    if (fs.robots && f.kind === "mech" && !f.ally && !f.fresh && !f.boss) { if (f.carry && f.carry.length) dropCarry(f); f.calm = true; }
    if (has(f, "turret") && !f.shots) {
      if (fs.turretMode === "off" || (!fs.turretMode && fs.turrets === false)) f.calm = true;
      if (fs.turretMode === "ours") { f.ally = true; f.calm = false; }
      if (fs.cutT && fs.cutT[f.id]) { f.cut = true; f.calm = true; f.ally = false; }
      if (fs.mineT && fs.mineT[f.id]) { f.mine = true; f.ally = true; f.calm = false; }
    }
    /* камеры: петля записи, снятое питание, чужая прошивка — помнятся на этаже */
    if (has(f, "camera") && fs.camS && fs.camS[f.id]) { var cs0 = fs.camS[f.id]; f.camOff = !!cs0.off; f.camLoop = cs0.loop || 0; f.camOurs = cs0.ours || 0; }
  });
  hpMark = Math.round(100 * G().hp / G().hpMax);
  graceT = tickN + 6; /* три секунды после входа на этаж враги не бьют: осмотреться */
}
function syncFoes() {
  var fs = CUR().fs;
  if (!fs) return;
  if (!fs.foes) fs.foes = {};
  /* (2.0) пишется только то, что изменилось: целая машина на своём месте не
     пишется вовсе — охраны на этажах много, а память браузера не резиновая */
  var defs = {};
  CUR().fl.foes.forEach(function (d) { defs[d.id] = d; });
  (fs.spawned || []).forEach(function (d) { defs[d.id] = d; });
  foes.forEach(function (f) {
    /* павший остаётся павшим: после возвращения на этаж он не встанет */
    if (f.dead) { if (!f.gone) fs.foes[f.id] = { dead: true }; return; }
    var d = defs[f.id], e = {}, n = 0, ak;
    if (f.hp < f.maxhp) { e.hp = f.hp; n++; }
    if (!d || f.x !== d.x || f.y !== d.y) { e.x = f.x; e.y = f.y; n++; }
    if (f.shield !== f.shieldMax) { e.shield = f.shield; n++; }
    if (f.minesLeft !== 3) { e.minesLeft = f.minesLeft; n++; }
    for (ak in f.adapt) { e.adapt = f.adapt; n++; break; }
    if (f.bag && f.bag.length) { e.bag = f.bag; n++; }
    if (!f.neutral && has(f, "cleaner")) { e.neutral = false; n++; }
    if (!f.disguised && has(f, "mimic")) { e.disguised = false; n++; }
    if (f.shots) { e.shots = f.shots; n++; }
    if (f.noCarry) { e.noCarry = true; n++; }
    if (f.built) { e.built = f.built; n++; }
    if (f.reported) { e.reported = true; n++; }
    if (n) fs.foes[f.id] = e; else delete fs.foes[f.id];
  });
}

/* ════════ ВОСПРИЯТИЕ ════════ */
function heroPos() { return { x: G().x, y: G().y }; }
/* (2.0) рядом с носителем: в одном с ним помещении или в пяти шагах */
function nearHero(f) {
  var rm = CUR().fl.room, fr = rm[idx(f.x, f.y)];
  return (fr >= 0 && fr === rm[idx(G().x, G().y)]) || cheb(f, heroPos()) <= 5;
}
function losTo(f) { return LAB.los(CUR().fl, CUR().fs, f.x, f.y, G().x, G().y); }
/* (2.0) Узлы связи и начальники этажа — список раз в такт: машин на этаже
   сотни, а ум машины спрашивают на каждом шаге и у каждой двери в поиске
   пути — перебирать ради этого весь этаж слишком дорого. */
var specN = -1, specOf = null, relays = [], commanders = [];
function specials() {
  if (specN === tickN && specOf === foes) return;
  specN = tickN; specOf = foes; relays = []; commanders = [];
  for (var i = 0; i < foes.length; i++) {
    var o = foes[i];
    if (o.dead || o.calm) continue;
    if (has(o, "relay")) relays.push(o);
    if (!o.ally && has(o, "commander")) commanders.push(o);
  }
}
function relayNear(f) {
  if (f.kind !== "mech") return false;
  specials();
  for (var i = 0; i < relays.length; i++) { var r = relays[i]; if (!r.dead && !r.calm && r !== f && cheb(r, f) <= 6) return true; }
  return false;
}
/* Начальник рядом: роботы умнее и злее. */
function commanderNear(f) {
  if (f.kind !== "mech") return false;
  specials();
  for (var i = 0; i < commanders.length; i++) { var c = commanders[i]; if (c !== f && !c.dead && !c.calm && !c.ally && cheb(c, f) <= 5) return true; }
  return false;
}
/* ум машины за такт считается один раз: его спрашивают на каждом шаге поиска пути у дверей */
function iqOf(f) {
  if (f.iqN === tickN) return f.iqV;
  f.iqN = tickN;
  return (f.iqV = Math.max(0, f.iq + (relayNear(f) ? 2 : 0) + (commanderNear(f) ? 2 : 0) - (f.confused > 0 ? 3 : 0)));
}
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
  if (safeHero) return false; /* (2.1) безопасное пробуждение */
  if (refugeId >= 0 && !inRefuge(f.x, f.y)) return false; /* (2.2) убежище */
  if (f.blindT > 0) return false; /* сенсорная помеха ослепила */
  if (G().st.mimicT > 0 && f.kind === "mech") return false; /* (2.0) мимикрия: машины принимают за свою */
  /* «тепло»: твари «Колыбели» чуют тепло тела — маскировка их не обманывает, а слепые видят его вблизи */
  if (G().st.cloak > 0 && !has(f, "heat")) return false;
  if (has(f, "deaf") && !(has(f, "heat") && dist(f, heroPos()) <= 3)) return false;
  var d = dist(f, heroPos());
  if (d > detOf(f)) return false;
  return losTo(f);
}
function hears(f) {
  if (safeHero) return false; /* (2.1) безопасное пробуждение */
  if (refugeId >= 0 && !inRefuge(f.x, f.y)) return false; /* (2.2) убежище */
  if (f.deafT > 0) return false; /* (1.5) оглушён ловушкой */
  var n = G().noise;
  if (gm().armorSpecial("stealth")) n = Math.round(n * 0.6);
  if (LAB.ach && LAB.ach.has("quiet")) n -= 1;
  if (G().st.cloak > 0) n = Math.round(n * 0.3);
  /* (2.0) глушитель шагов и чип тишины */
  if (G().st.muteT > 0) n = Math.round(n * 0.3);
  if (LAB.implants) n = Math.round(n * (1 - LAB.implants.stat("quiet")));
  var d = dist(f, heroPos());
  var bonus = has(f, "deaf") ? 3 : has(f, "tracker") ? 5 : 0;
  /* «вибрация»: шаги по настилу чувствуются издалека, даже тихие — но только пока вы идёте */
  if (has(f, "vibro") && gm().lastMoveAt && Date.now() - gm().lastMoveAt() < 900 && d <= 9) return true;
  /* (2.0) дальше, чем слышно и в открытую, — не слышит: прямую видимость не считаем
     (машин на этаже — сотни, такт должен оставаться лёгким) */
  if (d > n + bonus) return false;
  if (!losTo(f)) n -= 2; /* за стеной хуже слышно */
  return d <= n + bonus;
}
function inFireLine(f) {
  var v = DIRV[G().face] || DIRV.N, dx = f.x - G().x, dy = f.y - G().y;
  var along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
  return along > 0 && perp === 0;
}

/* ════════ ДВИЖЕНИЕ ВРАГОВ ════════ */
/* Карта занятых клеток для одного поиска пути: враги (кроме самого) и герой.
   Отмечаем заново перед каждым поиском — дёшево (по числу врагов), а сам поиск
   уже не перебирает всех врагов на каждой клетке. */
var occMap = null, occMarked = [];
function occFor(self) {
  var n = LAB.W * LAB.H;
  if (!occMap || occMap.length !== n) { occMap = new Uint8Array(n); occMarked = []; }
  for (var i = 0; i < occMarked.length; i++) occMap[occMarked[i]] = 0;
  occMarked.length = 0;
  for (var k = 0; k < foes.length; k++) { var o = foes[k]; if (o !== self && !o.dead) { var j = idx(o.x, o.y); occMap[j] = 1; occMarked.push(j); } }
  var hj = idx(G().x, G().y); occMap[hj] = 1; occMarked.push(hj);
  return occMap;
}
function occupied(x, y, self) {
  for (var i = 0; i < foes.length; i++) { var o = foes[i]; if (o !== self && !o.dead && o.x === x && o.y === y) return true; }
  return false;
}
function canStand(f, x, y) {
  var fl = CUR().fl;
  if (!LAB.inb(x, y)) return false;
  if (f && !f.ally && (inSafeRoom(x, y) || inRefuge(x, y))) return false; /* (2.2) капсульный отсек при пробуждении и убежище: враги в них не входят */
  var t = fl.t[idx(x, y)];
  if (t === LAB.T.WALL) return false;
  if (t === LAB.T.DOOR) { var d = fl.doorAt[idx(x, y)]; if (CUR().fs.doors[d.id] !== 2) return false; }
  if (LAB.solidAt(fl, x, y)) return false;
  if (occupied(x, y, f)) return false;
  if (x === G().x && y === G().y) return false;
  /* (1.5) ловушку, о которой знает, враг обходит */
  if (f && LAB.traps && LAB.traps.avoid(f, x, y)) return false;
  return true;
}
/* Машинам ОКО двери открывает само ОКО: отрядам, ремонтникам, стражам,
   патрулям смены и дронам, а по тревоге — всем роботам этажа. Запертые
   двери (карта, ключ, код) и тайные — не открывает. */
function okoDoors(f) {
  if (!f || f.kind !== "mech" || f.ally) return false;
  if (f.oko || f.task) return true;
  var fs = CUR().fs;
  return !!(fs && fs.alarmUntil && fs.alarmUntil < 1e9 && fs.alarmUntil > (fs.okoT || 0));
}
/* Можно ли врагу открыть эту дверь. */
function foeOpens(f, d) {
  if (!f.ally && refugeDoor(d)) return false; /* (2.2) дверь убежища враги не открывают */
  if (!has(f, "dooropen") && !(f.kind === "mech" && iqOf(f) >= 5) && !okoDoors(f)) return false;
  var st = CUR().fs.doors[d.id];
  if (st === 2) return true;
  if (d.lock && d.lock.type === "secret") return false;
  return !d.lock || st === 1;
}
function stepToward(f, tx, ty, opts) {
  opts = opts || {};
  var fl = CUR().fl, fs = CUR().fs, occ = occFor(f), W0 = LAB.W;
  var path = LAB.bfs(fl, fs, f.x, f.y, function (x, y) {
    /* клетка рядом с целью, занятая героем или другой машиной, — не цель: иначе машина идёт к ней и упирается */
    if (opts.near) return Math.max(Math.abs(x - tx), Math.abs(y - ty)) === 1 && occ[y * W0 + x] !== 1; /* любая из восьми соседних клеток */
    if (opts.adjacent) return Math.abs(x - tx) + Math.abs(y - ty) === 1 && occ[y * W0 + x] !== 1;
    return x === tx && y === ty;
  }, {
    passDoor: function (d) { return foeOpens(f, d); },
    block: function (x, y) { return occ[y * W0 + x] === 1; },
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
  if ((inSafeRoom(nx, ny) || inRefuge(nx, ny)) && !f.ally) return; /* (2.2) в капсульный отсек при пробуждении и в убежище не входят */
  var px = f.x, py = f.y;
  f.x = nx; f.y = ny;
  var r = CUR().fl.room[idx(nx, ny)];
  f.room = r;
  if (!aff(f, "cloak") || dist(f, heroPos()) <= 3) A("foeStep", f);
  /* сапёр в погоне оставляет мины в проходах — те же ловушки ОКО, что и по
     приказу (traps.js, okoTrap): их слышно вплотную, их можно обезвредить */
  if (has(f, "mines") && f.minesLeft > 0 && f.state === "hunt" && CUR().fl.room[idx(px, py)] < 0 && Math.random() < 0.25 && LAB.traps && LAB.traps.okoTrap) {
    var mk = LAB.traps.okoKinds(G().L), put = LAB.traps.okoTrap(mk.indexOf("mine") >= 0 ? "mine" : mk[0], px, py, { dmg: Math.round(f.dmg * 1.2) });
    if (put) { f.minesLeft--; A("foeSound", f, "mine_set"); }
  }
  /* (1.5) наступил на ловушку */
  if (LAB.traps) LAB.traps.foeStep(f);
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
function sidestep(f, minD) {
  var v = DIRV[G().face] || DIRV.N;
  var opts = [[v[1], v[0]], [-v[1], -v[0]]];
  if (Math.random() < 0.5) opts.reverse();
  for (var i = 0; i < opts.length; i++) {
    var x = f.x + opts[i][0], y = f.y + opts[i][1];
    /* minD: шаг вбок не ближе этого к герою (дрон держит дистанцию) */
    if (minD && Math.abs(x - G().x) + Math.abs(y - G().y) < minD) continue;
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
  if (LAB.bg) return;                          /* игра в фоне — мир стоит */
  if (LAB.ui && LAB.ui.layer()) return;      /* открыто окно — мир ждёт */
  if (LAB.mini && LAB.mini.active && LAB.mini.active()) return;
  if (S.turnBased) return;                     /* по ходам: мир движется после действий героя */
  tick();
}
/* (2.0) Подробность мира. Машин на этаже сотни, а слышно и видно только
   ближних: спокойная машина далеко от носителя (не гонится, без приказа ОКО,
   не начальник этажа) думает не каждый такт, а через один — или реже, если
   устройству тяжело или включён облегчённый режим. Дальше, чем слышно её
   шаги, разницы не заметить: она так же обходит участок, только медленнее,
   а подойдёте ближе — снова в полную силу. Тревога, погоня, приказ — сразу
   каждый такт. Уровень растёт сам, если такт долго не укладывается в
   бюджет, и опускается, когда снова легко. */
var LOD = [
  { r: 32, k: 2, r2: 56, k2: 4 },
  { r: 26, k: 3, r2: 44, k2: 6 },
  { r: 20, k: 4, r2: 36, k2: 8 },
  { r: 16, k: 6, r2: 28, k2: 12 }
];
var lodAuto = 0, tickEma = 0, lodAt = 0, heavyN = 0, heavyTold = false;
var perfNow = window.performance && performance.now ? function () { return performance.now(); } : function () { return Date.now(); };
function lodBase() { return S.lite ? 2 : 0; }
function lodLevel() { return Math.max(lodBase(), lodAuto); }
/* до какого расстояния машины думают каждый такт — дальше шаги и возню не играем */
function lodR() { return LOD[lodLevel()].r; }
function thinnable(f) { return f.state === "idle" && !f.task && !f.boss && !f.ally && !(f.bleedT > 0) && !has(f, "stalker"); }
function tickBudget(ms) {
  tickEma = tickEma ? tickEma * 0.8 + ms * 0.2 : ms;
  if (tickN - lodAt < 12) return;
  if (tickEma > 110 && lodAuto < LOD.length - 1) { lodAuto++; lodAt = tickN; tickEma = 80; }
  else if (tickEma < 35 && lodAuto > 0 && tickN - lodAt > 40) { lodAuto--; lodAt = tickN; }
  /* устройству тяжело и облегчённого режима нет — подсказать один раз */
  heavyN = tickEma > 200 ? heavyN + 1 : 0;
  if (heavyN >= 30 && !heavyTold && !S.lite) {
    heavyTold = true;
    LAB.say((LAB.desktop ? "Компьютеру" : "Телефону") + " тяжело: на этаже много машин. В настройках есть облегчённый режим — с ним игра пойдёт ровнее.", { interrupt: false, prio: "info" });
  }
}
/* Один такт мира. В пошаговом режиме зовётся после каждого действия героя. */
function tick() {
  if (G().stair) return; /* игрок на лестнице: этаж ждёт */
  /* установки глубин: прессы «Подножия»; навигатор, сбитый «Отражением», оживает */
  if (G().st.navjam > 0 && --G().st.navjam === 0) say("Навигатор снова видит этаж.");
  if (LAB.depths) LAB.safe(function () { LAB.depths.tick(); });
  tickN++;
  var t0 = perfNow();
  safeHero = wakeSafeTick();
  refugeTick();
  statusTick(false);
  var fs = CUR().fs;
  var spotted = [], lod = LOD[lodLevel()], hx = G().x, hy = G().y;
  for (var i = 0; i < foes.length; i++) {
    var f = foes[i];
    if (f.dead) continue;
    if (thinnable(f)) {
      var dd = Math.max(Math.abs(f.x - hx), Math.abs(f.y - hy));
      if (dd > lod.r) {
        if (f.lodP == null) f.lodP = Math.floor(Math.random() * 24);
        if ((tickN + f.lodP) % (dd > lod.r2 ? lod.k2 : lod.k)) continue;
      }
    }
    try { foeTick(f, spotted); } catch (e) { try { console.warn("[Лаборатория]", e); } catch (_) { /* */ } }
    if (G().dead) return;
  }
  shellsTick();
  if (LAB.traps) { LAB.safe(LAB.traps.tick); if (G().dead) return; }
  if (LAB.oko) LAB.safe(LAB.oko.tick);
  if (LAB.game.doorAutoClose) LAB.safe(LAB.game.doorAutoClose); /* двери закрываются за прошедшими */
  if (spotted.length) announceSpotted(spotted);
  else LAB.safe(patrolCue);
  G().noise = Math.max(0, G().noise - 2);
  var dz = danger();
  A("combatLevel", dz ? (hunted() ? 2 : 1) : 0);
  /* бой окончен: короткий сигнал, когда опасность ушла надолго */
  if (dz) { dangerT++; calmT = 0; } else { calmT++; if (dangerT >= 4 && calmT === 4) { A("play", "combat_clear"); dangerT = 0; } if (calmT > 4) dangerT = 0; }
  if (tickN % 10 === 0) syncFoes();
  tickBudget(perfNow() - t0);
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
/* Камера смотрит вдоль своего коридора и переводит взгляд с одного конца на
   другой; при подозрении ОКО — вдвое чаще. Видит конусом: дальше — шире,
   стены и закрытые двери заслоняют, в темноте (аварийное освещение) видит
   на три шага ближе. Край обзора — подозрение, обзор — подтверждение.
   Поворот камеры слышно рядом — можно выждать и пройти, пока она смотрит
   в другую сторону. */
function camDirs(f) {
  if (!f.camDirs) {
    var c = f.corr != null && CUR().fl.corrs ? CUR().fl.corrs[f.corr] : null;
    f.camDirs = f.camLook ? f.camLook.slice() : c ? (c.axis === "h" ? ["W", "E"] : ["N", "S"]) : ["N", "E", "S", "W"];
    f.camI = Math.floor(Math.random() * f.camDirs.length); f.camSw = 0;
  }
  return f.camDirs;
}
function camSees(f, extra) {
  if (safeHero) return false; /* (2.1) безопасное пробуждение */
  var g = G(), v = DIRV[camDirs(f)[f.camI]], dx = g.x - f.x, dy = g.y - f.y;
  var along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
  var range = detOf(f) - (g.event === "dark" ? 3 : 0) + (extra || 0);
  if (along < 1 || along > range || perp > Math.max(1, Math.ceil(along * 0.6))) return false;
  if (g.st.cloak > 0 || gm().armorSpecial("okoghost")) return false;
  return losTo(f);
}
function camFacing(f) { var g = G(), v = DIRV[camDirs(f)[f.camI]]; return (g.x - f.x) * v[0] + (g.y - f.y) * v[1] > 0; }
function cameraTick(f) {
  if (f.camT > 0) f.camT--;
  if (f.glimT > 0) f.glimT--;
  if (f.camOff) return; /* питание снято: камера мертва, сервопривод молчит, пока ремонтник ОКО не придёт */
  if (f.blindT > 0) return; /* сенсорная помеха: объектив засвечен */
  camDirs(f);
  var per = LAB.oko && LAB.oko.level() >= 1 ? 4 : 8;
  if (++f.camSw >= per) { f.camSw = 0; f.camI = (f.camI + 1) % f.camDirs.length; if (dist(f, heroPos()) <= 8) A("camTurn", f); }
  var T0 = LAB.oko ? LAB.oko.T() : 0;
  /* петля записи: камера крутится как прежде, но ОКО смотрит на пустой коридор */
  if (f.camLoop && f.camLoop > T0) return;
  /* перепрошитая камера докладывает «чисто» — и подсказывает вам, кто в её обзоре */
  if (f.camOurs && f.camOurs > T0) { camWarn(f); return; }
  if (G().st.jam > 0 || gm().armorSpecial("okoghost") || CUR().fs.okoBlind) return;
  if (camSees(f)) {
    if (f.camT <= 0) {
      f.camT = 40;
      A("foeSound", f, "alert");
      sayOnce("cam", "Камера ОКО " + gm().relDir(f.x, f.y) + " заметила вас!", 5000, "urgent");
      if (LAB.oko) LAB.oko.event("camera", { x: G().x, y: G().y });
    }
  } else if (f.glimT <= 0 && f.camT <= 0 && camSees(f, 3)) {
    f.glimT = 30;
    A("camTurn", f);
    sayOnce("camg" + f.id, "Камера " + gm().relDir(f.x, f.y) + " повернулась в вашу сторону: вы на краю её обзора.", 6000);
    if (LAB.oko) LAB.oko.event("camera", { x: G().x, y: G().y, glimpse: true });
  } else if (Math.random() < 0.015) A("foeSound", f, "idle");
}
/* Перепрошитая камера: машина или тварь в её обзоре — «Эхо» говорит, где. */
function camWarn(f) {
  if (f.warnT > 0) { f.warnT--; return; }
  var v = DIRV[camDirs(f)[f.camI]], range = detOf(f);
  for (var i = 0; i < foes.length; i++) {
    var o = foes[i];
    if (o === f || !hostile(o) || has(o, "camera") || isNetTurret(o)) continue;
    var dx = o.x - f.x, dy = o.y - f.y, along = dx * v[0] + dy * v[1], perp = Math.abs(dx * v[1] - dy * v[0]);
    if (along < 1 || along > range || perp > Math.max(1, Math.ceil(along * 0.6))) continue;
    if (!LAB.los(CUR().fl, CUR().fs, f.x, f.y, o.x, o.y)) continue;
    f.warnT = 24;
    sayOnce("camw" + o.id, "Ваша камера " + gm().relDir(f.x, f.y) + " видит: " + o.name.split(",")[0].toLowerCase() + " " + gm().relDir(o.x, o.y) + ".", 9000);
    return;
  }
}
/* ── Камеры для взлома: петля записи, снятое питание, перепрошивка ──
   Состояние — у камеры и в записи этажа (fs.camS). ОКО всё возвращает:
   петлю замечает, когда она кончается, чужую прошивку стирает проверкой
   целостности, к обесточенной камере шлёт ремонтника. */
function isCam(f) { return !f.dead && has(f, "camera"); }
function cams() { return foes.filter(isCam); }
function camState(f) {
  var T0 = LAB.oko ? LAB.oko.T() : 0;
  if (f.camOff) return "off";
  if (f.camOurs && f.camOurs > T0) return "ours";
  if (f.camLoop && f.camLoop > T0) return "loop";
  return "on";
}
function camSave(f) {
  var fs = CUR().fs;
  if (!fs.camS) fs.camS = {};
  if (f.camOff || f.camLoop || f.camOurs) fs.camS[f.id] = { off: f.camOff ? 1 : undefined, loop: f.camLoop || undefined, ours: f.camOurs || undefined };
  else delete fs.camS[f.id];
}
function camSet(f, kind, ticks) {
  if (!isCam(f)) return false;
  var T0 = LAB.oko ? LAB.oko.T() : 0;
  if (kind === "loop") { f.camLoop = T0 + ticks; f.camT = 0; f.glimT = 0; f.loopWarned = false; }
  else if (kind === "ours") { f.camOurs = T0 + ticks; f.camLoop = 0; f.camT = 0; f.glimT = 0; f.oursWarned = false; }
  else if (kind === "off") { f.camOff = true; f.camLoop = 0; f.camOurs = 0; }
  camSave(f);
  return true;
}
/* Срок петли или прошивки вышел — камера снова смотрит для ОКО. Возвращает, сколько каких. */
function camExpire() {
  var T0 = LAB.oko ? LAB.oko.T() : 0, out = { loop: 0, ours: 0, loopSoon: 0, oursSoon: 0 };
  foes.forEach(function (f) {
    if (!isCam(f)) return;
    if (f.camLoop && f.camLoop <= T0) { f.camLoop = 0; out.loop++; camSave(f); }
    else if (f.camLoop && !f.loopWarned && f.camLoop - T0 <= 20) { f.loopWarned = true; out.loopSoon++; }
    if (f.camOurs && f.camOurs <= T0) { f.camOurs = 0; out.ours++; camSave(f); }
    else if (f.camOurs && !f.oursWarned && f.camOurs - T0 <= 20) { f.oursWarned = true; out.oursSoon++; }
  });
  return out;
}
function camCount(kind) { return cams().filter(function (f) { return camState(f) === kind; }).length; }
/* (2.2, просьба игрока) Разбить камеру вплотную — монтировкой, прикладом,
   чем угодно: сразу и навсегда (ремонтнику ОКО чинить нечего), но удар
   слышно по коридору, а ОКО заметит, что камера замолчала. */
function smashCam(f) {
  if (!isCam(f) || Math.max(Math.abs(f.x - G().x), Math.abs(f.y - G().y)) > 1) return false;
  A("play", "ev_glass");
  G().noise = Math.max(G().noise, 8);
  damageFoe(f, f.hp + (f.shield || 0) + 1e6, "kinetic", { quiet: true });
  return !!f.dead;
}
/* Разбитые камеры этажа (для терминала и щита). */
function camsBroken() { var fs = CUR().fs, n = 0; CUR().fl.foes.concat(fs.spawned || []).forEach(function (d) { if (fs.foes[d.id] && fs.foes[d.id].dead && LAB.FOES[d.type] && LAB.FOES[d.type].beh.indexOf("camera") >= 0) n++; }); return n; }
function unmask(f) {
  f.disguised = false; f.state = "hunt"; f.lastKnown = heroPos(); f.at = f.acd;
  A("foeSound", f, "alert");
  say("Ящик рядом раскрылся — это " + f.name.split(",")[0].toLowerCase() + "!");
}
/* Что уборщик подбирает: мусор и мелочь — но не записки, образцы, ключи,
   пропуска и ключ-карты (без них этаж не пройти). */
function cleanable(it) { return ["note", "sample", "key", "pass", "elevpass", "gatepass", "chip"].indexOf(it.kind) < 0; }
/* Скрытый наблюдатель «Подножия»: не нападает — увидев носителя, щёлкает
   реле и передаёт ОКО, где он, потом отходит из виду. Его выдаёт сухой
   щелчок передатчика. */
function observerTick(f) {
  f.mv++;
  var see = sees(f);
  if (see) {
    if (!f.obsT || tickN - f.obsT > 30) {
      f.obsT = tickN;
      A("foeSound", f, "radio");
      if (netUp() && LAB.oko) LAB.oko.report("observer", G().x, G().y, "seen");
      sayOnce("obs" + f.id, "Сухой щелчок передатчика " + gm().relDir(f.x, f.y) + ": кто-то следит за вами и докладывает ОКО.", 12000);
    }
    if (f.mv >= f.spd) { f.mv = 0; stepAway(f); }
    return;
  }
  if (f.mv >= f.spd + 1) { f.mv = 0; if (f.route) routeStep(f); else if (f.patrol) patrolStep(f); else wander(f); }
}
/* Ремонтный автомат принимает носителя за неисправный узел: подходит,
   сканирует и пытается обесточить — разряд и онемение. Ударили его или
   ОКО подняло тревогу — понимает, кто перед ним, и бьёт уже всерьёз. */
function fixerTick(f) {
  if (f.hitT <= 12 || (LAB.oko && LAB.oko.level() >= 2) || !sees(f)) return false;
  var d = dist(f, heroPos());
  f.mv++; f.at++;
  if (d > 1) { if (f.mv >= f.spd) { f.mv = 0; stepToward(f, G().x, G().y, { adjacent: true }); } if (d <= 4 && Math.random() < 0.3) A("foeSound", f, "idle"); return true; }
  if (f.at >= 3) {
    f.at = 0;
    A("foeSound", f, "repair"); A("play", "w_shock_crack");
    G().st.slow = Math.max(G().st.slow || 0, 3);
    hurtPlayer(Math.max(2, Math.round(G().hpMax * 0.04)), "shock", f);
    sayOnce("fix" + f.id, f.name.split(",")[0] + " принял вас за неисправный узел: сканирует и пытается обесточить. Отойдите или разбейте его.", 10000, "urgent");
  }
  return true;
}
/* Акустический имитатор «Отражения»: повторяет голоса чужих машин — наводку
   турели, тревогу робота, лязг двери. Выдаёт его отзвук: копия звучит с
   задержкой и глуше настоящего. */
var IMIT = ["turret", "robot", "guardbot", "drone", "spiderbot"];
function imitateTick(f) {
  if (f.state === "hunt" || dist(f, heroPos()) > 12 || Math.random() > 0.08) return;
  var snd = IMIT[Math.floor(Math.random() * IMIT.length)];
  A("foeSound", { x: f.x, y: f.y, id: "im" + f.id, snd: snd, kind: "mech" }, Math.random() < 0.5 ? "aim" : "alert");
  setTimeout(function () { A("foeSound", { x: f.x, y: f.y, id: "im2" + f.id, snd: snd, kind: "mech", gain: 0.4 }, "alert"); }, 400);
}
/* Робот «Механизма», перекрывающий путь: пока другие гонят носителя, он
   встаёт в проём двери того помещения, где носитель, — ближайшей к нему. */
function blockCell(f) {
  var fl = CUR().fl, r = fl.room[idx(G().x, G().y)];
  if (r == null || r < 0 || !fl.rooms[r]) return null;
  /* выход, который можно перекрыть: открытый проём — первым, запертая дверь — последней */
  var best = null, bd = 1e9, fs = CUR().fs;
  fl.doors.forEach(function (d) {
    if ((d.room === r || d.other === r) && !(d.lock && d.lock.type === "secret")) {
      var dd = dist(d, f) + (fs.doors[d.id] === 2 ? 0 : 6) + (d.lock && gm().doorBlock && gm().doorBlock(d) ? 100 : 0);
      if (dd < bd) { bd = dd; best = d; }
    }
  });
  return best ? [best.x, best.y] : null;
}
/* Уборщик: собирает вещи с пола, доложит ОКО, если увидит героя. */
function cleanerTick(f) {
  var fs = CUR().fs, here = gm().floorItems().filter(function (it) { return it.x === f.x && it.y === f.y && cleanable(it); });
  here.forEach(function (it) { fs.taken[it.id] = 1; var c = JSON.parse(JSON.stringify(it)); delete c.x; delete c.y; f.bag.push(c); });
  if (here.length) A("foeSound", f, "idle");
  if (!f.reported && sees(f) && G().st.jam <= 0 && !gm().armorSpecial("okoghost")) {
    f.reported = true;
    A("foeSound", f, "radio");
    sayOnce("cl" + f.id, f.name.split(",")[0] + " " + gm().relDir(f.x, f.y) + " заметил вас и докладывает ОКО.", 8000);
    if (LAB.oko) LAB.oko.event("cleaner", { x: G().x, y: G().y });
  }
  /* обломки машин — след: уборщик сообщает ОКО, где их нашёл */
  var wr = CUR().fs.wrecks;
  if (wr && wr.length && !(G().st.jam > 0)) {
    for (var wi = 0; wi < wr.length; wi++) {
      var w = wr[wi];
      if (w.rep || Math.abs(w.x - f.x) + Math.abs(w.y - f.y) > 2) continue;
      w.rep = 1; A("foeSound", f, "radio");
      if (LAB.oko) LAB.oko.event("cleaner", { x: w.x, y: w.y, trace: "обломки машины" });
      break;
    }
  }
  f.mv++;
  if (f.mv < f.spd + 1) return;
  f.mv = 0;
  var near = gm().floorItems().filter(function (it) { return cleanable(it) && Math.abs(it.x - f.x) + Math.abs(it.y - f.y) <= 6 && LAB.los(CUR().fl, CUR().fs, f.x, f.y, it.x, it.y); })[0];
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
function needsFix(o, off) { return (isNetTurret(o) && (o.cut || (o.calm && off))) || (isCam(o) && o.camOff); }
function repairTask(f, canMove) {
  var t = null, bd = 1e9, off = CUR().fs.turretMode === "off";
  foes.forEach(function (o) { if (needsFix(o, off)) { var d = dist(o, f); if (d < bd) { bd = d; t = o; } } });
  if (!t) { f.task = null; f.fixT = 0; return false; }
  if (cheb(f, t) <= 1) {
    f.fixT++;
    A("foeSound", f, "repair");
    if (f.fixT === 1) sayOnce("fix" + f.id, f.name.split(",")[0] + (isCam(t) ? " чинит камеру " : " чинит турель ") + gm().relDir(t.x, t.y) + "!", 6000, "urgent");
    if (f.fixT < 4) return true;
    f.task = null; f.fixT = 0;
    if (isCam(t)) {
      /* питание камеры подано — она снова смотрит для ОКО */
      t.camOff = false; t.camLoop = 0; t.camOurs = 0; camSave(t);
      A("play", "power_on");
      if (LAB.oko) LAB.oko.event("cam_fixed", { x: t.x, y: t.y });
      if (foes.some(function (o) { return needsFix(o, off); })) f.task = "repair";
      return true;
    }
    if (t.cut) {
      /* перерезанный кабель сращен — турель возвращается в режим сети этажа */
      t.cut = false; if (CUR().fs.cutT) delete CUR().fs.cutT[t.id];
      var m = CUR().fs.turretMode || "on";
      t.calm = m === "off"; t.ally = m === "ours"; if (!t.calm && !t.ally) { t.state = "alert"; t.lastKnown = null; }
      A("play", "power_on");
      if (LAB.oko) LAB.oko.event("repaired", { cut: true });
      if (foes.some(function (o) { return needsFix(o, off); })) f.task = "repair";
      return true;
    }
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
/* Ремонтник в обходе: ищет рядом повреждённую машину или турель, подходит
   и чинит; починил — возвращается к обходу. */
function serviceStep(f, canMove) {
  var t = f.svc && !f.svc.dead && f.svc.hp < f.svc.maxhp ? f.svc : null;
  if (!t) {
    f.svc = null;
    /* кого чинить, ищет раз в несколько тактов: машин на этаже сотни */
    if ((f.svcN || 0) > tickN) return false;
    var bd = 13;
    foes.forEach(function (o) { if (o !== f && hostile(o) && o.kind === "mech" && o.hp < o.maxhp * 0.75 && dist(o, f) < bd) { bd = dist(o, f); t = o; } });
    if (!t) { f.svcN = tickN + 4; return false; }
    f.svc = t;
  }
  if (cheb(f, t) <= 1) {
    t.hp = Math.min(t.maxhp, t.hp + Math.max(1, Math.round(t.maxhp * 0.08)));
    if (Math.random() < 0.4) A("foeSound", f, "repair");
    if (t.hp >= t.maxhp) f.svc = null;
    return true;
  }
  if (canMove) { f.mv = 0; if (!stepToward(f, t.x, t.y, { near: true })) f.svc = null; }
  return true;
}
/* Турель вручную: вскрыть кожух и перерезать кабель питания. Быстро, но
   шумно; ОКО пошлёт ремонтника. Перерезанная турель молчит, пока её не
   починят. */
function isTurret(f) { return isNetTurret(f); }
function cutTurret(f, ok) {
  var fs = CUR().fs;
  noise(12);
  if (!ok) { A("play", "w_shock_crack"); hurtPlayer(Math.max(4, Math.round(G().hpMax * 0.08)), "shock", null); sayq("Искра из кожуха — удар током. Турель цела."); if (LAB.oko) LAB.oko.report("noise", G().x, G().y, "suspect", "искрит щиток турели"); return false; }
  f.cut = true; f.calm = true; f.ally = false; f.state = "idle"; f.aim = false;
  if (!fs.cutT) fs.cutT = {};
  fs.cutT[f.id] = 1;
  A("play", "power_off"); A("foeSound", f, "hurt");
  sayq("Кабель перерезан: турель " + gm().relDir(f.x, f.y) + " обесточена. ОКО это заметит.");
  if (LAB.oko) LAB.oko.event("turret_cut", { x: f.x, y: f.y });
  return true;
}
/* Служебный ключ ОКО: турель принимает носителя за техника сети и бьёт
   по его врагам. Контрвзлом её не возвращает — пока ОКО не отзовёт ключ. */
function mineTurret(f) {
  var fs = CUR().fs;
  if (!isNetTurret(f) || f.cut) return false;
  f.mine = true; f.ally = true; f.calm = false; f.state = "idle"; f.aim = false; f.at = 0; f.lastKnown = null;
  if (!fs.mineT) fs.mineT = {};
  fs.mineT[f.id] = 1;
  A("play", "card_ok"); A("foeSound", f, "aim");
  return true;
}
/* Ключ ОКО на терминале: одна турель обесточена «на обслуживание» — как
   перерезанный кабель, только тихо; чинит её ремонтник ОКО. */
function quietTurret(f) {
  var fs = CUR().fs;
  if (!isNetTurret(f)) return false;
  f.cut = true; f.quiet = true; f.calm = true; f.ally = false; f.state = "idle"; f.aim = false;
  if (!fs.cutT) fs.cutT = {};
  fs.cutT[f.id] = 1;
  return true;
}
/* ОКО отозвало ключ: турели «по ключу» снова его. */
function unmineTurrets() {
  var fs = CUR().fs, n = 0;
  foes.forEach(function (f) { if (isNetTurret(f) && f.mine) { f.mine = false; n++; var m = fs.turretMode || "on"; f.ally = m === "ours"; f.calm = m === "off"; if (!f.ally && !f.calm) { f.state = "alert"; f.lastKnown = null; } } });
  fs.mineT = {};
  return n;
}
/* Фланг: второй и следующий в группе заходят с другой стороны — туда,
   куда герой отступил бы от первого. */
function flankCell(f) {
  var h = heroPos(), lead = null, bd = dist(f, h);
  foes.forEach(function (o) { if (o !== f && hostile(o) && o.kind === "mech" && o.state === "hunt" && dist(o, h) < bd) { bd = dist(o, h); lead = o; } });
  if (!lead || bd > 5) return null;
  var dx = Math.sign(h.x - lead.x), dy = Math.sign(h.y - lead.y);
  var cand = [[h.x + dx, h.y + dy], [h.x + dy, h.y + dx], [h.x - dy, h.y - dx]];
  for (var i = 0; i < cand.length; i++) { var c = cand[i]; if ((c[0] !== h.x || c[1] !== h.y) && (c[0] !== f.x || c[1] !== f.y) && canStand(f, c[0], c[1])) return c; }
  return null;
}
/* Убрать машину с этажа без боя: ушла со смены или ОКО её отозвало. */
function despawn(f) {
  if (f.dead) return;
  if ((f.carry && f.carry.length) || (f.bag && f.bag.length)) dropCarry(f); /* ключи и карты не уходят с этажа */
  f.dead = true;
  var fs = CUR().fs;
  if (f.spawned) { f.gone = true; fs.spawned = fs.spawned.filter(function (sd) { return sd.id !== f.id; }); delete fs.foes[f.id]; }
  else fs.foes[f.id] = { dead: true };
}
/* Всё, что машина несёт (ключи, пропуска, ключ-карта, подобранное), — на
   пол у её ног: когда её уводят с этажа или перепрошивают. */
function dropCarry(f) {
  var fs = CUR().fs, its = (f.carry || []).slice().concat(f.bag || []);
  f.carry = null; f.bag = []; f.noCarry = true;
  if (!its.length) return 0;
  var cx = f.x, cy = f.y;
  if (CUR().fl.t[idx(cx, cy)] === LAB.T.DOOR) { var c = freeCellNear(cx, cy, null); if (c) { cx = c[0]; cy = c[1]; } }
  its.forEach(function (it0) { var it = JSON.parse(JSON.stringify(it0)); it.id = "d" + (fs.dseq = (fs.dseq || 0) + 1); it.x = cx; it.y = cy; fs.drops.push(it); });
  A("dropLoot", cx, cy);
  return its.length;
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
    /* (2.0) у патрульного свой участок: обошёл, что велело ОКО, — назад к нему */
    if (f.ri >= f.route.length && f.beat) { f.route = null; f.ri = 0; return; }
    if (f.ri >= f.route.length) { f.route = makeRoute(f); f.ri = 0; }
    if (Math.random() < 0.2) A("foeSound", f, "idle");
    return;
  }
  if (stepToward(f, p[0], p[1])) f.stuck = 0;
  else if (++f.stuck > 4) { f.stuck = 0; f.ri++; }
}
/* (2.0) Участок обхода: точки вдоль коридоров туда-обратно. Дошёл до
   точки — к следующей; дошёл до края — разворот. Путь перекрыт (дверь,
   машина) — разворот раньше. */
function beatStep(f) {
  var pts = f.beat, n = pts.length;
  if (f.bi >= n) f.bi = n - 1;
  var p = pts[f.bi];
  if (Math.abs(f.x - p[0]) + Math.abs(f.y - p[1]) <= 0 || (f.stuck > 3)) {
    f.stuck = 0;
    if (f.bi + f.bdir >= n || f.bi + f.bdir < 0) f.bdir = -f.bdir;
    f.bi += f.bdir;
    if (Math.random() < 0.15) A("foeSound", f, "idle");
    return;
  }
  if (stepToward(f, p[0], p[1])) f.stuck = 0; else f.stuck++;
}
/* (2.0) Рабочая машина кабинета: возится у своего места, иногда проходит
   по помещению; шум работы слышно из-за двери. */
function workIdle(f, canMove) {
  var p = f.post;
  if (Math.random() < 0.04) A("foeSound", f, Math.random() < 0.5 ? "idle" : "repair");
  if (!canMove) return;
  f.mv = 0;
  if (Math.abs(f.x - p.x) + Math.abs(f.y - p.y) > 3) { if (!stepToward(f, p.x, p.y) && ++f.stuck > 6) { f.stuck = 0; f.post = { x: f.x, y: f.y }; } return; }
  if (Math.random() < 0.3) wander(f);
}
/* (2.0) Сапёр ОКО по приказу: идёт к точке, три такта ставит ловушку —
   слышно лязг и щелчок взвода; потом к следующей; точки кончились — назад
   на свой участок. Видели, как ставит, — ловушка известна. */
function mineTask(f) {
  var q = f.mineAt;
  if (!q || !q.length) { f.task = null; f.mineAt = null; f.plantT = 0; return; }
  var p = q[0], dd = Math.abs(f.x - p[0]) + Math.abs(f.y - p[1]);
  if (dd <= 1) {
    f.plantT = (f.plantT || 0) + 1;
    if (f.plantT === 1) {
      A("foeSound", f, "mine_set");
      var dh = dist(f, heroPos());
      if (dh <= 10 && (dh <= 6 || losTo(f))) sayOnce("plant" + f.id, f.name.split(",")[0] + " что-то ставит на пол " + gm().relDir(p[0], p[1]) + ": лязг и щелчок взвода.", 12000, "event");
    }
    if (f.plantT < 3) return;
    f.plantT = 0; q.shift();
    if (!LAB.traps || !LAB.traps.okoTrap) return;
    var kinds = LAB.traps.okoKinds(G().L), kind = kinds[Math.floor(Math.random() * kinds.length)];
    var tp = LAB.traps.okoTrap(kind, p[0], p[1], { face: G().face });
    if (tp) {
      A("at", "tk_pull", p[0], p[1], { gain: 0.5 });
      var dh2 = dist(f, heroPos());
      if (dh2 <= 6 && losTo(f)) tp.known = 1;
      if (LAB.oko) LAB.oko.log("Сапёр ОКО: ловушка у " + (gm().placeName ? gm().placeName(p[0], p[1]) : "прохода") + ".");
    }
    return;
  }
  if (!stepToward(f, p[0], p[1], { adjacent: true })) { if (++f.stuck > 6) { f.stuck = 0; q.shift(); } } else f.stuck = 0;
}
/* Куда ставить: пороги дверей и проходы вокруг точки at — в 2–14 шагах от
   неё, не на глазах у героя и не вплотную к нему, друг от друга не ближе
   трёх шагов. from — сапёр: только туда, куда он сам дойдёт (точка у
   запертого зала изнутри ему не годится). */
function minePoints(at, n, from) {
  var fl = CUR().fl, fs = CUR().fs, W = LAB.W, H = LAB.H, hp = heroPos();
  if (!at) at = hp;
  var reach = from ? reachMap(from, 9999) : null; /* куда сапёр дойдёт сам: −1 — никак */
  var dm = new Int16Array(W * H).fill(-1), s0 = idx(at.x, at.y), q = [s0], qi = 0, cand = [];
  dm[s0] = 0;
  while (qi < q.length) {
    var u = q[qi++], x = u % W, y = (u / W) | 0;
    if (dm[u] >= 2 && dm[u] <= 14 && fl.t[u] !== LAB.T.DOOR && canStand(null, x, y)) {
      var nearD = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { return LAB.inb(x + v[0], y + v[1]) && fl.t[idx(x + v[0], y + v[1])] === LAB.T.DOOR; });
      var far = Math.abs(x - hp.x) + Math.abs(y - hp.y) >= 5 && !LAB.los(fl, fs, x, y, hp.x, hp.y);
      if (far && (!reach || reach[u] >= 0) && !(LAB.traps && LAB.traps.at && LAB.traps.at(x, y))) cand.push([x, y, nearD ? 0 : 1, dm[u]]);
    }
    if (dm[u] >= 16) continue;
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
  cand.sort(function (a, b) { return a[2] - b[2] || (Math.random() - 0.5); });
  var out = [];
  for (var i = 0; i < cand.length && out.length < n; i++) {
    var c = cand[i];
    if (out.some(function (o) { return Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) < 3; })) continue;
    out.push([c[0], c[1]]);
  }
  return out;
}
function sappers() { return foes.filter(function (f) { return hostile(f) && f.kind === "mech" && (f.sapper || has(f, "mines")) && !f.boss; }); }
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
  /* дрон знает, где вы, только своими глазами и ушами — или от ОКО, если
     вас только что видел другой датчик этажа */
  var see = sees(f), hear = hears(f), d = dist(f, hp);
  var sa = LAB.oko && LAB.oko.state().seenAt, okoT = LAB.oko ? LAB.oko.T() : 0;
  if (see || (hear && !(g.st.cloak > 0))) { f.lastKnown = hp; if (f.state !== "flee") f.state = "hunt"; f.lost = 0; }
  else {
    if (sa && sa.L === g.L && sa.F === g.F && okoT - sa.t < 8 && netUp() && !fs.okoBlind) f.lastKnown = { x: sa.x, y: sa.y };
    if (f.state === "hunt" && ++f.lost > 10) { f.state = "alert"; f.lost = 0; }
    if (f.state === "alert" && f.lastKnown && f.x === f.lastKnown.x && f.y === f.lastKnown.y && !f.searchR) search(f, f.lastKnown);
  }
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
    if (f.dead) return;
    if (canMove && Math.random() < 0.5) { f.mv = 0; if (!sidestep(f, 2)) stepAway(f); }
    return;
  }
  if (!canMove) return;
  f.mv = 0;
  if (!see && f.searchR && f.searchR.length) { var sp0 = f.searchR[0]; if (Math.abs(f.x - sp0[0]) + Math.abs(f.y - sp0[1]) <= 1 || !stepToward(f, sp0[0], sp0[1])) f.searchR.shift(); return; }
  if (!f.lastKnown) { wander(f); return; }
  if (see && d < 3) { stepAway(f); return; }
  /* за углом дрон не лезет вплотную: зависает в паре шагов и ждёт, пока цель покажется */
  if (!see && d <= 2) return;
  if (d > 4 || !see) { if (!stepToward(f, f.lastKnown.x, f.lastKnown.y, { adjacent: true })) wander(f); return; }
  if (Math.random() < 0.3) sidestep(f, 2);
}
/* Есть ли у машин связь с ОКО: глушилка и разбитые узлы связи этажа её рвут. */
function netUp() { return !(G().st.jam > 0) && !CUR().fs.netCut && !CUR().fs.okoBlind; }
/* Поиск потерянной цели: последнее место, потом две-три точки рядом
   (помещения, середины коридоров, двери) — вероятные пути. */
function search(f, p) {
  if (!p) return;
  var fl = CUR().fl, dm = reachMap(f, 40), pts = [];
  var pushNear = function (x, y) { if (LAB.inb(x, y) && dm[idx(x, y)] > 0 && Math.abs(x - p.x) + Math.abs(y - p.y) <= 14) pts.push([x, y]); };
  (fl.rooms || []).forEach(function (rm) { if (rm && !rm.hidden) pushNear(rm.cx, rm.cy); });
  (fl.corrs || []).forEach(function (c) { pushNear((c.x0 + c.x1) >> 1, (c.y0 + c.y1) >> 1); });
  (fl.doors || []).forEach(function (d) { if (!(d.lock && d.lock.type === "secret")) pushNear(d.x, d.y); });
  for (var i = pts.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
  f.searchR = [[p.x, p.y]].concat(pts.slice(0, 3));
  if (f.state === "idle") f.state = "alert";
  f.lastKnown = { x: p.x, y: p.y }; f.lost = 0;
}
function scream(f) {
  A("foeSound", f, "alert");
  /* (2.1) за стеной и закрытой дверью визг слышен глухо: слух не глушит, не ранит */
  if (!losTo(f)) return;
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
  f.hitT++; f.seenT++; f.hearT = (f.hearT == null ? 99 : f.hearT) + 1;
  if (f.blindT > 0) f.blindT--;
  /* (1.5) раны, метка, вязкость от нового оружия */
  if (f.bleedT > 0) { f.bleedT--; damageFoe(f, f.bleedD || 2, "kinetic", { noarmor: true, quiet: true }); if (f.dead) return; }
  if (f.markT > 0) f.markT--;
  if (f.slowT > 0) { f.slowT--; if (f.slowT % 2 === 1) return; }
  if (f.frozen > 0) { f.frozen--; return; }
  if (f.ally) { allyTick(f); return; }
  if (f.calm) { if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
  if (has(f, "camera")) { cameraTick(f); return; }
  if (f.disguised) {
    var dm0 = dist(f, heroPos());
    if (dm0 <= 1) unmask(f);
    /* ящик-ловушка выдаёт себя: внутри тихо гудит мотор — слышно за два-три шага */
    else if (dm0 <= 3 && Math.random() < 0.2) A("mimicHum", f);
    return;
  }
  if (f.nodeT > 0) f.nodeT--;
  if (f.neutral) { cleanerTick(f); return; }
  if (has(f, "observer")) { observerTick(f); return; }
  if (has(f, "fixer") && fixerTick(f)) return;
  if (has(f, "mimicsnd")) imitateTick(f);
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
  /* к звуку из-за стены прохода не нашлось — какое-то время машина его не слушает */
  if (hear && f.wallDeaf > tickN && !see && !losTo(f)) hear = false;
  /* слепые и ищейки охотятся на слух */
  var sense = see || (hear && (has(f, "deaf") || has(f, "tracker")));
  if (see || hear) f.lastKnown = heroPos();
  if (sense) f.seenT = 0;
  if (hear) f.hearT = 0;
  /* неподвижные (узлы, турели, камеры) успокаиваются, если долго ни видят, ни слышат */
  if (has(f, "stationary") && f.state !== "idle" && f.seenT > 60 && f.hearT > 60 && !CUR().fs.turretAlert) { f.state = "idle"; f.lastKnown = null; f.aim = false; }
  /* смена состояния */
  if (sense && f.state !== "hunt" && f.state !== "flee") {
    if (f.state === "idle" || f.state === "alert") spotted.push(f);
    f.state = "hunt"; f.lost = 0;
    /* охранный робот передаёт ОКО, где вы, — если есть связь */
    if (f.kind === "mech" && see && netUp() && LAB.oko && (f.repAt || 0) <= tickN) { f.repAt = tickN + 20; LAB.oko.event("robot", { x: G().x, y: G().y }); }
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
  /* подбитая машина ушла — и передала ОКО, где видела вас последний раз */
  if (f.state === "flee" && f.kind === "mech" && !f.fledRep && f.lastKnown && dist(f, heroPos()) >= 10 && netUp() && LAB.oko) { f.fledRep = true; A("foeSound", f, "radio"); LAB.oko.event("robot", { x: f.lastKnown.x, y: f.lastKnown.y }); }
  /* (2.0) носитель прошёл в двух шагах от патрульного, и тот доложил «чисто» — ОКО не верит */
  if (f.state === "idle" && !sense && (f.beat || f.route) && f.kind === "mech" && cheb(f, heroPos()) <= 2 && (f.slipT || 0) <= tickN && LAB.oko && LAB.oko.react) { f.slipT = tickN + 120; LAB.oko.react("patrol_slip"); }

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
    /* (2.0) машина рядом с носителем — в одном помещении или в нескольких
       шагах — слышна: жужжит, щёлкает приводами (ящик-ловушка и засада молчат) */
    if (f.kind === "mech" && !f.disguised && !f.ambush && !f.burrowed && !aff(f, "cloak") && Math.random() < 0.3 && nearHero(f)) A("foeSound", f, "idle");
    if (f.task === "leave") { if (canMove) { f.mv = 0; leaveStep(f); } return; }
    if (/repair/.test(f.type) && serviceStep(f, canMove)) return;
    if (f.task === "mine" && !has(f, "stationary")) { if (canMove) { f.mv = 0; mineTask(f); } return; }
    if (f.work && f.post && !has(f, "stationary")) { workIdle(f, canMove); return; }
    if (f.guard && f.post && !has(f, "stationary")) { guardIdle(f, canMove); return; }
    if (f.route && canMove && !has(f, "stationary")) { f.mv = 0; routeStep(f); return; }
    if (f.beat && canMove && !has(f, "stationary")) { f.mv = 0; beatStep(f); if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
    if (f.patrol && canMove && !has(f, "stationary")) { f.mv = 0; patrolStep(f); if (Math.random() < 0.02) A("foeSound", f, "idle"); return; }
    if (canMove && !has(f, "ambush") && Math.random() < 0.15) { f.mv = 0; wander(f); }
    if (Math.random() < 0.03 && !aff(f, "cloak")) A("foeSound", f, "idle");
    return;
  }
  if (f.state === "alert") {
    if (f.ambush) { /* засада: не шуметь, ждать, пока герой выйдет на линию */ return; }
    /* поиск: машина ОКО проверяет точки рядом с последним местом */
    if (f.searchR && f.searchR.length) {
      if (canMove) { f.mv = 0; var sp1 = f.searchR[0]; if (Math.abs(f.x - sp1[0]) + Math.abs(f.y - sp1[1]) <= 1 || !stepToward(f, sp1[0], sp1[1])) { f.searchR.shift(); if (!f.searchR.length) { f.state = "idle"; f.lastKnown = null; f.searchR = null; } } }
      return;
    }
    if (canMove && f.lastKnown) {
      f.mv = 0;
      if (f.x === f.lastKnown.x && f.y === f.lastKnown.y) { f.lost++; if (f.lost > 8) { if (f.kind === "mech" && (f.oko || f.patrol || f.route) && !f.searched) { f.searched = true; search(f, f.lastKnown); } else { f.state = "idle"; f.lastKnown = null; f.searched = false; } } else wander(f); }
      else if (!stepToward(f, f.lastKnown.x, f.lastKnown.y)) { f.lost++; if (f.lost > 8) f.state = "idle"; }
    }
    return;
  }
  if (f.state === "flee") {
    /* (2.1) загнанный в угол бьёт, только если видит носителя, и не чаще своей
       перезарядки (прежде — каждый такт и сквозь стену) */
    if (canMove) { f.mv = 0; if (!stepAway(f) && canAct && d <= Math.max(1, f.rng) && (d <= 1 || see)) { f.at = 0; attack(f, true); } }
    return;
  }
  /* ── охота ── */
  if (has(f, "blocker") && (f.blockOff || 0) <= tickN && foes.some(function (o) { return o !== f && hostile(o) && o.kind === "mech" && o.state === "hunt" && dist(o, heroPos()) < d; })) {
    var bc = blockCell(f);
    if (bc && (f.x !== bc[0] || f.y !== bc[1])) {
      if (canMove) {
        f.mv = 0;
        var bd0 = Math.abs(f.x - bc[0]) + Math.abs(f.y - bc[1]);
        stepToward(f, bc[0], bc[1]);
        if (f.x === bc[0] && f.y === bc[1]) sayOnce("blk" + f.id, f.name.split(",")[0] + " перекрыл выход " + gm().relDir(f.x, f.y) + "!", 9000);
        /* к выходу не пробиться (носитель или другие машины на пути) — гонит носителя, как все */
        if (Math.abs(f.x - bc[0]) + Math.abs(f.y - bc[1]) >= bd0) { if (++f.blkStuck > 5) { f.blkStuck = 0; f.blockOff = tickN + 40; } } else f.blkStuck = 0;
      }
      return;
    }
    if (bc && canAct && see && d <= Math.max(1, f.rng)) { f.at = 0; attack(f, true); }
    return;
  }
  var ranged = f.rng > 1;
  var punish = iq >= 7 && Date.now() < reloadUntil;
  if (has(f, "indirect")) {
    /* мортира: навесом туда, где слышала героя, — поверх ящиков и машин, но
       (2.1) не сквозь стену и закрытую дверь: стены комплекса до потолка */
    var mt = f.lastKnown, mClear = !!mt && LAB.los(CUR().fl, CUR().fs, f.x, f.y, mt.x, mt.y);
    if (canAct && mt && d <= f.rng && mClear) { f.at = 0; mortarShell(f, mt.x, mt.y); return; }
    if (canMove && d < 3) { f.mv = 0; stepAway(f); return; }
    if (canMove && mt && !mClear) { f.mv = 0; stepToward(f, mt.x, mt.y, { adjacent: true }); }
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
      if (f.kind === "mech" && iq >= 4 && see && d > 1 && d <= 10) {
        var fc = flankCell(f);
        if (fc && stepToward(f, fc[0], fc[1])) { if (!f.flank) { f.flank = 1; sayOnce("flk" + f.id, f.name.split(",")[0] + " заходит с фланга, " + gm().relDir(f.x, f.y) + "!", 9000); } return; }
      }
      if (!stepToward(f, tgt.x, tgt.y, { adjacent: true })) { if (noPath(f)) return; wander(f); } else f.noPath = 0;
      if (punish && f.spd > 0) stepToward(f, G().x, G().y, { adjacent: true });
    }
    return;
  }
  /* стрелок */
  var line = has(f, "turret") ? (f.x === G().x || f.y === G().y) : true;
  if (see && d <= f.rng && line) {
    if (d <= 1 && iq >= 1 && canMove && !has(f, "stationary") && Math.random() < 0.6) { f.mv = 0; if (stepAway(f)) return; }
    if (!canAct) { if (canMove && iq >= 3 && inFireLine(f) && Math.random() < 0.35) { f.mv = 0; sidestep(f); } return; }
    if (f.over > 0) { f.over--; if (!f.over) A("foeSound", f, "aim"); return; }
    if (!f.aim && !aff(f, "fast") && !punish) { f.aim = true; A("foeSound", f, "aim"); return; }
    f.aim = false; f.at = 0;
    attack(f, true);
    if (f.dead) return;
    /* турель после серии выстрелов перегревается: несколько секунд — окно, чтобы пройти */
    if (has(f, "turret") && ++f.heatN >= 4) { f.heatN = 0; f.over = 4; A("turretHot", f); if (dist(f, heroPos()) <= 8) sayOnce("hot" + f.id, "Турель " + gm().relDir(f.x, f.y) + " перегрелась: пару секунд не стреляет.", 8000); }
    if (iq >= 3 && canMove && !has(f, "stationary") && Math.random() < 0.5) { f.mv = 0; sidestep(f); }
    return;
  }
  f.aim = false;
  if (canMove) {
    f.mv = 0;
    var t2 = f.lastKnown || heroPos();
    if (!stepToward(f, t2.x, t2.y, { adjacent: true })) { if (!noPath(f)) wander(f); } else f.noPath = 0;
  }
}
/* До героя нет прохода — он за стеной, за запертой дверью: машина не бьётся
   о стену вечно. Несколько ходов подряд без пути и без прямой видимости —
   бросает погоню, а звук из-за стены какое-то время её снова не поднимает. */
function noPath(f) {
  if (f.pathLen < 9999 || losTo(f)) { f.noPath = 0; return false; }
  f.noPath = (f.noPath || 0) + 1;
  if (f.noPath < 6) return false;
  f.noPath = 0; f.state = "idle"; f.lastKnown = null; f.lost = 0; f.aim = false; f.wallDeaf = tickN + 40;
  if (dist(f, heroPos()) <= 9) sayOnce("nop" + f.id, f.name.split(",")[0] + " не находит к вам прохода и отстаёт.", 20000);
  return true;
}
function wander(f) {
  var ks = ["N", "S", "W", "E"];
  var k = ks[Math.floor(Math.random() * 4)], v = DIRV[k];
  var x = f.x + v[0], y = f.y + v[1];
  if (canStand(f, x, y) && (f.room < 0 || CUR().fl.room[idx(x, y)] === f.room || f.state !== "idle")) moveFoe(f, x, y);
}

/* Тревога: роботы рядом (или весь этаж) идут на героя. */
function callHelp(f, radius, at) {
  var n = 0, to = at ? { x: at.x, y: at.y } : heroPos();
  if (!netUp()) radius = Math.min(radius, 6); /* без связи — только голосом, рядом */
  foes.forEach(function (o) {
    if (o === f || o.dead || o.calm || o.kind !== "mech") return;
    if (dist(o, f) > radius) return;
    if (o.state === "idle") { o.state = "alert"; o.lastKnown = { x: to.x, y: to.y }; n++; }
  });
  if (n) A("foeSound", f, "radio");
}
function relayCall(f) {
  /* узел передаёт только свежий контакт и то место, где героя засекли, — не живую позицию */
  if ((f.seenT > 12 && f.hearT > 6) || !f.lastKnown) return;
  callHelp(f, 99, f.lastKnown);
  var spawned = CUR().fs.spawned.filter(function (s) { return s.from === f.id && !(CUR().fs.foes[s.id] && CUR().fs.foes[s.id].dead); }).length;
  if (spawned >= 3 || Math.random() < 0.6) return;
  var c = freeCellNear(f.x, f.y, f);
  if (!c) return;
  var lvF = LAB.LEVELS[G().L].foes.filter(function (id) { var b = LAB.FOES[id]; return b && b.kind === "mech" && (b.beh.indexOf("swarm") >= 0 || /drone|micro/.test(b.snd)); });
  var type = lvF.length ? lvF[Math.floor(Math.random() * lvF.length)] : (G().L >= 9 ? "micro" : "drone");
  var sp = spawnFoe(type, c[0], c[1], { from: f.id });
  if (sp) { A("foeSound", f, "summon"); sp.state = "alert"; sp.lastKnown = { x: f.lastKnown.x, y: f.lastKnown.y }; }
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
  if (!(extra && extra.ally) && inRefuge(x, y)) return null; /* (2.2) в убежище ОКО никого не выводит */
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
  /* (2.1) сквозь стену и закрытую дверь не бьёт никто: издалека — только по
     прямой видимости (вплотную — соседняя клетка, стены между ними не бывает).
     Закрытую дверь машина сначала открывает (stepToward), а стреляет уже в
     открытый проём; носитель в проёме виден с обеих сторон. */
  if (ranged && !losTo(f)) { f.aim = false; return; }
  if (sheltered()) { f.aim = false; return; } /* (2.2) безопасное пробуждение и убежище */
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
  if (LAB.implants && g.st.phaseT > 0) return LAB.implants.onHurt(dmg, adt, src); /* (2.0) вне фазы */
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
  if (LAB.implants) { fin = LAB.implants.onHurt(fin, adt, src); if (!fin) { UIx("refresh"); return 0; } } /* (2.0) уклонение, отражение, заземление */
  if (LAB.repair) LAB.repair.armorHit(raw, fin); /* (2.0) броня изнашивается от ударов, которые держит */
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
  /* (2.0) ОКО слышит, что носитель ранен — и злорадствует или «заботится» */
  if (LAB.oko && LAB.oko.react && !opts.quiet) LAB.oko.react(pct <= 30 ? "low_hp" : "hurt");
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
    if (Math.max(Math.abs(s.x - G().x), Math.abs(s.y - G().y)) <= 1 && clearTo(s.x, s.y, G().x, G().y)) hurtPlayer(s.dmg, "phys", s.src);
    if (G().dead) return;
  }
}
/* (2.1) Взрыв и разрыв задевают только тех, кого от них не закрывает стена
   или закрытая дверь. */
function clearTo(x, y, tx, ty) { return LAB.los(CUR().fl, CUR().fs, x, y, tx, ty); }
function explode(f, r, dmg, adt) {
  A("explosion", f.x, f.y, f.kind === "bio" ? "acid" : "bot");
  if (cheb(f, heroPos()) <= r && clearTo(f.x, f.y, G().x, G().y)) hurtPlayer(dmg, adt, f);
  foes.forEach(function (o) { if (o !== f && !o.dead && cheb(o, f) <= r && clearTo(f.x, f.y, o.x, o.y)) damageFoe(o, Math.round(dmg * 0.5), "kinetic", { quiet: true }); });
  kill(f, true);
}

/* ════════ СОСТОЯНИЯ ГЕРОЯ ════════ */
function statusTick(onlyTimers) {
  var g = G(), st = g.st;
  if (st.poison > 0) {
    st.poison--;
    if (st.poison % 2 === 0) { var pd = Math.max(1, Math.round((1 + Math.ceil(g.L / 2)) * (1 - (LAB.implants ? LAB.implants.stat("antitox") : 0)))); g.hp -= pd; A("play", "poison_tick"); if (g.hp <= 0) { g.hp = 0; gm().die(); return; } }
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
  if (st.radBlock > 0) { st.radBlock--; if (!st.radBlock) sayq("Йодид калия больше не защищает от облучения."); }
  if (LAB.zones && LAB.zones.tick) LAB.zones.tick(); /* облучение и газ, пока стоите в особой зоне (1.5) */
  if (LAB.implants) LAB.implants.tick(); /* (2.0) действие имплантов во времени, чип регенерации */
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
function shotGap(w) { var cd = LAB.weaponCd(w); if (G().st.haste > 0) cd *= 0.6; if (LAB.workshop) cd *= LAB.workshop.gapK(w); return cd; }
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
  /* открыто окно или идёт мини-игра — не стреляем (и мир не делает ход) */
  if ((LAB.ui && LAB.ui.layer()) || (LAB.mini && LAB.mini.active && LAB.mini.active())) { if (hold) stopFire(); return false; }
  var now = Date.now();
  if (now - lastShot < shotGap(w) * (burst ? 0.6 : 1)) return false;
  if (now < reloadUntil) { sayOnce("reloading", "Перезарядка..."); return false; }
  g.face = dir;
  /* мастерская: ствол перегрет — ждём; изношенное оружие даёт осечки */
  var wk = LAB.workshop ? LAB.workshop.beforeShot(w, now) : null;
  if (wk === "hot") { stopFire(); return false; }
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
  if (wk === "misfire") { A("play", "w_empty"); if (S.turnBased) tick(); UIx("refresh"); return true; }
  g.stats.shots++;
  var melee = w.rng <= 1;
  var loud = { melee: 2, laser: 6, cryo: 5, thermo: 6, gauss: 10, positron: 12, magnetron: 8 }[LAB.WEAPONS[w.base].cls] || 8;
  if (w.base === "pcannon") loud = 14;
  if (LAB.workshop) loud = LAB.workshop.loud(w, loud);
  if (wf(w, "silent")) loud = Math.min(loud, 2); /* (1.5) бесшумное оружие */
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
    } else if (wf(w, "pierce")) {
      targetsIn(dir, w, true).forEach(function (t) { hits += shoot(w, t.f, t.perp, t.along, burst, false); });
      if (!hits) { var wh2 = wallHit(dir, w.rng); A("shotWall", w, wh2[0], wh2[1]); }
    } else {
      var t0 = list[0];
      hits += shoot(w, t0.f, t0.perp, t0.along, burst, false);
      if (!hits) { var wh3 = wallHit(dir, Math.min(w.rng, t0.along + 3)); A("shotWall", w, wh3[0], wh3[1]); }
    }
  }
  if (hits) g.stats.hits++;
  /* очередь: оружие с burst стреляет несколькими импульсами за спуск — следующие чуть слабее */
  var nb = !melee ? (wf(w, "burst") || 0) : 0;
  for (var bi = 1; bi < nb; bi++) (function (k) {
    setTimeout(function () { LAB.safe(function () {
      if (G().dead || G().weapons[G().wi] !== w || !G().drawn) return;
      var l2 = targetsIn(dir, w, false);
      A("shot", w, dir, true);
      if (l2.length) { var w2 = Object.create(w); w2.dmg = Math.max(1, Math.round(w.dmg * 0.7)); if (shoot(w2, l2[0].f, l2[0].perp, l2[0].along, true, false)) g.stats.hits++; }
    }); }, 110 * k);
  })(bi);
  if (LAB.workshop) LAB.workshop.afterShot(w, burst, now);
  if (LAB.tutor && !melee) LAB.tutor.ev("weapon");
  /* шум выстрела будит этаж */
  if (S.turnBased) tick();
  UIx("refresh");
  return true;
}
/* Свойство оружия: у самого экземпляра или у его вида. (1.5) Прежде бой
   читал «прошивает всех на линии», «броня не помогает», заморозку и урон
   по соседям только у экземпляра, а makeWeapon их туда не переносил —
   у найденного и собранного оружия эти свойства не работали. */
function wf(w, k) { if (w && w[k] != null) return w[k]; var b = w && LAB.WEAPONS[w.base]; return b ? b[k] : undefined; }
function foeAtCell(x, y) { for (var i = 0; i < foes.length; i++) if (!foes[i].dead && !foes[i].burrowed && foes[i].x === x && foes[i].y === y) return foes[i]; return null; }
function shoot(w, f, perp, along, burst, melee) {
  var g = G();
  var acc = (melee ? 0.92 : 0.9) - 0.13 * perp - 0.012 * along + (g.agi - 10) * 0.01 + (w.spread ? 0.08 * perp : 0) - (burst ? 0.1 : 0) - (gm().aimPenalty ? gm().aimPenalty() : 0) + (LAB.workshop ? LAB.workshop.accBonus(w, burst) : 0);
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
  var dmg = w.dmg * LAB.wGrowK(w); /* (2.2) рост оружия — по режиму сложности */
  if (melee) { dmg *= 1 + (g.str - 10) * 0.03; if (gm().armorSpecial("strength")) dmg *= 1.6; }
  var crit = Math.random() < 0.05 + (g.agi - 10) * 0.008 + (wf(w, "crit") || 0);
  if (crit) dmg *= 1.75;
  if (LAB.workshop) dmg *= LAB.workshop.dmgK(w, f);
  var wb = LAB.WEAPONS[w.base] || {};
  var done = damageFoe(f, dmg, dt, { noarmor: !!wf(w, "noarmor"), crit: crit, melee: melee, burst: burst, freeze: wf(w, "freeze"), apierce: LAB.workshop ? LAB.workshop.pierce(w) : 0, stunMech: wb.stunMech || 0 });
  if (wf(w, "area")) foes.forEach(function (o) { if (o !== f && !o.dead && !o.calm && cheb(o, f) <= 1) damageFoe(o, dmg * 0.6, dt, { noarmor: true, quiet: true }); });
  afterHit(w, f, dmg, dt);
  return 1;
}
/* (1.5) Свойства нового оружия (arms.js): кровотечение, метка, замедление,
   отбрасывание, цепной разряд, вытягивание здоровья. */
function afterHit(w, f, dmg, dt) {
  var g = G(), bl = wf(w, "bleed"), mk = wf(w, "mark"), sl = wf(w, "slow"), ch = wf(w, "chain"), dr = wf(w, "drain");
  if (bl && !f.dead && f.kind === "bio") { f.bleedT = Math.max(f.bleedT || 0, bl); f.bleedD = Math.max(1, Math.round(dmg * 0.15)); sayOnce("bleed" + f.id, f.name.split(",")[0] + " истекает: раны не закрываются.", 6000); }
  if (mk && !f.dead) { if (!(f.markT > 0)) sayOnce("mark" + f.id, f.name.split(",")[0] + " помечен: по нему бьют сильнее.", 6000); f.markT = Math.max(f.markT || 0, mk); }
  if (sl && !f.dead && !f.boss) { f.slowT = Math.max(f.slowT || 0, sl); sayOnce("slow" + f.id, f.name.split(",")[0] + " вязнет и движется медленнее.", 6000); }
  if (wf(w, "knock") && !f.dead && !f.boss && !has(f, "stationary") && !has(f, "turret")) knockBack(f);
  if (ch) chainArc(f, dmg * 0.5, dt, ch);
  if (dr && f.kind === "bio" && dmg > 0) { var hv = Math.max(1, Math.round(dmg * dr)); g.hp = Math.min(g.hpMax, g.hp + hv); sayOnce("drain", "Часть силы возвращается вам: плюс " + hv + " здоровья.", 4000); }
}
function knockBack(f) {
  var hp = heroPos(), dx = Math.sign(f.x - hp.x), dy = Math.sign(f.y - hp.y);
  if (Math.abs(f.x - hp.x) >= Math.abs(f.y - hp.y)) dy = 0; else dx = 0;
  var nx = f.x + dx, ny = f.y + dy;
  if ((dx || dy) && canStand(f, nx, ny)) { moveFoe(f, nx, ny); f.frozen = Math.max(f.frozen || 0, 1); A("foeSound", f, "hurt"); sayOnce("knock" + f.id, f.name.split(",")[0] + " отлетает на шаг.", 4000); }
}
/* Разряд перескакивает на ближних — до n раз, каждый слабее. */
function chainArc(f0, d, dt, n) {
  var hit = [f0], cur = f0;
  for (var i = 0; i < n; i++) {
    var nb = null, bd = 99;
    foes.forEach(function (o) { if (hit.indexOf(o) >= 0 || o.dead || o.calm || o.ally || o.burrowed) return; var c = cheb(o, cur); if (c <= 3 && c < bd) { bd = c; nb = o; } });
    if (!nb) break;
    hit.push(nb);
    A("play", "w_shock_crack");
    damageFoe(nb, d, dt, { quiet: true });
    if (i === 0) sayOnce("chain", "Разряд перескакивает дальше!", 4000);
    cur = nb; d *= 0.75;
  }
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
  if (G().wakeSafe && !f.ally) endWakeSafe("fight"); /* (2.1) сам начал бой */
  if (f.phased) { A("foeSound", f, "blink_out"); if (!o.quiet) sayOnce("ph" + f.id, f.name.split(",")[0] + " в фазе: удар проходит сквозь.", 4000); return false; }
  var vs = (LAB.DMG_VS[f.kind] || {})[dt]; if (vs == null) vs = 1;
  var res = f.base.res && f.base.res[dt] != null ? f.base.res[dt] : 1;
  if (aff(f, "hardened") && (dt === "emp" || dt === "ion")) vs *= dt === "emp" ? 0 : 0.5;
  var dmg = raw * vs * res * (1 - (f.adapt[dt] || 0)) * (f.markT > 0 ? 1.25 : 1);
  /* щитоносец прикрывает соседей */
  if (foes.some(function (s) { return s !== f && !s.dead && !s.calm && has(s, "shieldally") && cheb(s, f) <= 2; })) dmg *= 0.6;
  /* тяжёлая машина: разряд по снятому щиту перегружает энергоузел — броня на время не держит */
  if (f.kind === "mech" && f.arm >= 8 && (dt === "shock" || dt === "ion" || dt === "emp") && f.shield <= 0 && !f.nodeT && !has(f, "camera")) {
    f.nodeT = 8; f.frozen = Math.max(f.frozen || 0, 2);
    A("foeSound", f, "hurt"); A("play", "w_shock_crack");
    if (!o.quiet) sayOnce("node" + f.id, "Энергоузел " + (f.name.split(",")[0]).toLowerCase() + " перегружен: броня не держит!", 6000);
  }
  if (!o.noarmor && !(f.nodeT > 0)) dmg -= f.arm * 0.5 * (1 - Math.min(0.9, o.apierce || 0));
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
  /* ЭМ-подавитель: машина замирает на несколько тактов (экранированную и босса не берёт) */
  if (o.stunMech && f.kind === "mech" && !f.boss && !aff(f, "hardened") && !f.dead) { f.frozen = Math.max(f.frozen || 0, o.stunMech); if (!o.quiet) sayOnce("stun" + f.id, f.name.split(",")[0] + " замер: импульс сбил ему контур.", 5000); }
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
var killTimes = [];
function kill(f, quiet) {
  if (f.dead) return;
  f.dead = true;
  var g = G(), fs = CUR().fs;
  fs.foes[f.id] = { dead: true };
  g.stats.kills++;
  if (!f.ally) markCleared(f); /* (2.2) помещение зачищено — в нём можно укрыться */
  if (LAB.ach) { LAB.ach.ev("kill", 1); if (f.kind === "mech") LAB.ach.ev("kill_mech", 1); if (f.boss) LAB.ach.ev("boss", 1); }
  /* (2.0) ОКО отвечает на потери: машина, тварь, турель — или серия подряд */
  if (LAB.oko && LAB.oko.react && !f.ally && !f.boss) {
    var kn = Date.now();
    killTimes = killTimes.filter(function (t) { return kn - t < 20000; }); killTimes.push(kn);
    LAB.oko.react(killTimes.length >= 3 ? "kill_many" : f.kind !== "mech" ? "kill_bio" : isNetTurret(f) ? "turret_kill" : isCam(f) ? "" : "kill_mech");
  }
  A("foeDeath", f);
  LAB.vib(30);
  var xp = Math.round((f.base.xp || 10) * (1 + 0.1 * (f.lvl - 1)) * (f.aff ? 1 + 0.25 * f.aff.length : 1) * (f.boss ? 6 : 1));
  if (f.spawned) xp = Math.round(xp * 0.4);
  /* добыча падает на клетку врага */
  var drops = (f.carry || []).slice().concat(f.bag || []);
  if (f.kind === "mech" && !f.ally && !has(f, "camera")) { if (!fs.wrecks) fs.wrecks = []; fs.wrecks.push({ x: f.x, y: f.y }); if (fs.wrecks.length > 12) fs.wrecks.shift(); }
  /* последний узел связи этажа разбит — машины больше не докладывают ОКО */
  if (has(f, "relay") && !foes.some(function (o) { return o !== f && !o.dead && has(o, "relay"); })) {
    fs.netCut = true; sayq("Последний узел связи этажа разбит: машины здесь больше не докладывают ОКО и не зовут подмогу издалека.");
    /* машины ОКО остались без маршрутов и приказов — растерялись */
    foes.forEach(function (o) { if (o !== f && hostile(o) && o.kind === "mech" && (o.oko || o.patrol || o.route || o.guard)) o.confused = Math.max(o.confused || 0, 12); });
  }
  if (LAB.oko && f.kind === "mech" && !f.ally) LAB.oko.event("kill", { task: f.task, stalker: has(f, "stalker"), camera: has(f, "camera"), guard: f.guard, post: f.post, oko: f.oko, x: f.x, y: f.y,
    beat: f.beat && !f.sapper ? f.beat : null, corr: f.corr, room: f.room, type: f.type, garrison: f.garrison });
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
    if (LAB.workshop) LAB.workshop.drops(f, drops, r, dk);
    if (r() < 0.3) drops.push({ kind: "credits", n: LAB.credits(4 + r() * 12, L, g.F) });
    /* служебный ключ ОКО: у начальника смены, изредка — у стража поста */
    if (f.kind === "mech" && (has(f, "commander") ? r() < 0.45 * dk : f.guard && LAB.depth(L, g.F) >= 6 && r() < 0.08 * dk)) drops.push({ kind: "item", item: "okokey", n: 1 });
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
      if (cheb(self, heroPos()) <= 1 && clearTo(self.x, self.y, G().x, G().y)) hurtPlayer(Math.round(self.dmg * 1.4), self.kind === "bio" ? "chem" : "phys", self);
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
    /* удары вплотную — не чаще чем раз в 0,18 с: звук взмаха не сливается */
    h.t = setTimeout(loop, Math.max(wn.rng <= 1 ? 180 : 110, shotGap(wn) * 0.6));
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
function jammer() { var b = null, bd = 99; foes.forEach(function (f) { if (!f.dead && !f.calm && aff(f, "jammer") && cheb(f, heroPos()) <= 6 && cheb(f, heroPos()) < bd) { bd = cheb(f, heroPos()); b = f; } }); return b; }
function noise(n) { G().noise = Math.max(G().noise, n); }
/* Турели этажа: отключить, перехватить, вернуть ОКО. Переносные — не трогаются. */
function isNetTurret(f) { return !f.dead && has(f, "turret") && !f.shots; }
function turretsLeft() { return foes.filter(isNetTurret).length; }
function turretsOff() { CUR().fs.turretMode = "off"; foes.forEach(function (f) { if (isNetTurret(f) && !f.mine) { f.calm = true; f.ally = false; f.state = "idle"; f.aim = false; } }); }
function turretsOurs() { CUR().fs.turretMode = "ours"; foes.forEach(function (f) { if (isNetTurret(f) && !f.cut) { f.calm = false; f.ally = true; f.state = "idle"; f.aim = false; f.at = 0; } }); }
function turretsHostile() { CUR().fs.turretMode = "on"; foes.forEach(function (f) { if (isNetTurret(f) && !f.cut && !f.mine) { f.calm = false; f.ally = false; f.state = "alert"; f.lastKnown = null; } }); }
/* Перепрошивка этажа: роботы ОКО вас больше не трогают. Страж уровня
   чужую прошивку не принимает; перепрошитые выкладывают то, что несли. */
function robotsCalm() {
  var out = { n: 0, boss: 0, dropped: 0 };
  foes.forEach(function (f) {
    if (f.dead || f.kind !== "mech" || f.ally) return;
    if (f.boss) { out.boss++; return; }
    if ((f.carry && f.carry.length) || (f.bag && f.bag.length)) out.dropped += dropCarry(f);
    f.calm = true; f.state = "idle"; out.n++;
  });
  return out;
}
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
    if (u !== s0 && fl.t[u] !== LAB.T.DOOR && canStand(null, x, y) && !inRefuge(x, y)) {
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
  if (mode === "sapper") { pool = ids.filter(function (id) { var b = LAB.FOES[id]; return b && b.kind === "mech" && b.beh.indexOf("mines") >= 0 && b.beh.indexOf("stationary") < 0; }); return pool.length ? pool : ["sapper"]; }
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
  /* куда идти, ОКО знает только из донесений (at); без них отряд прочёсывает этаж.
     Точка выхода — вне вашего поля зрения: так честнее для игрока. */
  var to = at || null;
  if (mode === "repair") {
    var t = null, bd = 1e9;
    foes.forEach(function (o) { if (isNetTurret(o) && o.calm) { var d = dist(o, hp); if (d < bd) { bd = d; t = o; } } });
    if (!t) return got;
    to = t;
  }
  var p = okoPoint({ to: to || hp, minHero: mode === "drone" ? 9 : 12, dmin: mode === "check" || mode === "hunt" ? 8 : 10 });
  if (!p) return got;
  for (var i = 0; i < n; i++) {
    var c = i === 0 && canStand(null, p[0], p[1]) ? p : freeCellNear(p[0], p[1], null);
    if (!c) break;
    var type = mode === "repair" && i > 0 ? okoPool("hunt")[Math.floor(Math.random() * okoPool("hunt").length)] : pool[Math.floor(Math.random() * pool.length)];
    if (!LAB.FOES[type]) type = "patrolbot";
    var ex = { squad: true, oko: true, fresh: !!fs.robots, task: mode === "repair" && i === 0 ? "repair" : null, patrol: mode === "patrol" };
    if (mode === "post") { ex.guard = to.kind || "post"; ex.post = [to.x, to.y]; }
    var sp = spawnFoe(type, c[0], c[1], ex);
    if (!sp) break;
    sp.task = mode === "repair" && i === 0 ? "repair" : null;
    sp.route = [];
    if (mode === "post") { sp.state = "idle"; sp.route = null; }
    else if (mode === "sapper") { sp.state = "idle"; sp.route = null; sp.sapper = true; sp.task = "mine"; sp.mineAt = minePoints(to || hp, 2, sp); }
    else if (mode === "patrol" || !to) { sp.state = "idle"; sp.route = makeRoute(sp, at || null) || []; } /* патрульный смены — патрульный, какого бы вида ни был (ex.patrol) */
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
/* (2.0) Замена потерь (oko.js). Новый патрульный выходит на участок погибшего
   из дальней от вас точки обхода — не у вас на глазах. Пусто — место на виду,
   ОКО подождёт. При большом нажиме (q.n от трёх) идут тяжёлые машины и сразу
   — к месту потерь. */
function replacePatrol(q) {
  var hp = heroPos(), fl = CUR().fl, fs = CUR().fs, best = null, bd = -1;
  (q.beat || []).forEach(function (pt) {
    var d = Math.abs(pt[0] - hp.x) + Math.abs(pt[1] - hp.y);
    if (d < 12 || d <= bd) return;
    if (d < 24 && LAB.los(fl, fs, hp.x, hp.y, pt[0], pt[1])) return;
    best = pt; bd = d;
  });
  if (!best) return [];
  var heavy = q.n >= 3, pool = heavy ? okoPool("hunt") : (LAB.garrison ? LAB.garrison.patrolPool(G().L, G().F) : okoPool("patrol")), got = [];
  for (var i = 0; i < q.n; i++) {
    var c = i === 0 && canStand(null, best[0], best[1]) ? best : freeCellNear(best[0], best[1], null);
    if (!c) break;
    var type = !heavy && i === 0 && q.type && LAB.FOES[q.type] ? q.type : pool[Math.floor(Math.random() * pool.length)];
    if (!LAB.FOES[type]) type = "patrolbot";
    var sp = spawnFoe(type, c[0], c[1], { patrol: true, beat: q.beat, corr: q.corr, oko: true, squad: q.n > 1 });
    if (!sp) break;
    if (heavy && q.at) { sp.state = "alert"; sp.lastKnown = { x: q.at.x, y: q.at.y }; sp.lost = 0; } else sp.state = "idle";
    got.push(sp);
  }
  if (got.length) A("foeSound", { x: best[0], y: best[1], id: "repl" + got[0].id, snd: "robot", kind: "mech" }, "radio");
  return got;
}
/* Кабинет опустел — ОКО присылает в него машины по назначению помещения
   (при большом нажиме — стражей), пока вас нет ни в нём, ни у его двери.
   null — кабинета нет, ждать нечего. */
function refillRoom(q) {
  var fl = CUR().fl, rm = fl.rooms[q.room], hp = heroPos();
  if (!rm) return null;
  if (fl.room[idx(hp.x, hp.y)] === q.room) return [];
  var door = null;
  for (var di = 0; di < fl.doors.length; di++) if (fl.doors[di].room === q.room) { door = fl.doors[di]; break; }
  if (door && Math.abs(door.x - hp.x) + Math.abs(door.y - hp.y) < 7) return [];
  var cells = [];
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) if (canStand(null, x, y)) cells.push([x, y]);
  for (var k = cells.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = cells[k]; cells[k] = cells[j]; cells[j] = t; }
  var GR = LAB.garrison, cat = (GR && GR.CAT[q.cat]) || { roles: ["guard"] }, got = [];
  for (var i = 0; i < q.n && i < cells.length; i++) {
    var role = q.n >= 3 ? "guard" : cat.roles[Math.min(i, cat.roles.length - 1)];
    var pool = GR ? GR.rolePool(role, G().L, G().F) : ["patrolbot"];
    var type = pool[Math.floor(Math.random() * pool.length)], base = LAB.FOES[type];
    if (!base) continue;
    var ex = { garrison: q.cat, oko: true };
    if (!has(base, "cleaner") && !has(base, "mimic")) { ex.guard = "room"; ex.post = [cells[i][0], cells[i][1]]; }
    var sp = spawnFoe(type, cells[i][0], cells[i][1], ex);
    if (sp) { sp.state = "idle"; got.push(sp); }
  }
  if (got.length && door) A("doorOpen", door, true);
  if (got.length && CUR().fs.cleared) delete CUR().fs.cleared[q.room]; /* (2.2) охрана вернулась — помещение уже не убежище */
  return got;
}
function doorNear(x, y) {
  var fl = CUR().fl;
  for (var k = 0; k < 4; k++) { var v = DIRV[["N", "S", "W", "E"][k]], nx = x + v[0], ny = y + v[1]; if (LAB.inb(nx, ny) && fl.t[idx(nx, ny)] === LAB.T.DOOR) return fl.doorAt[idx(nx, ny)]; }
  return null;
}
/* Живые машины ОКО на этаже: патрули, ремонтники, дроны, стражи. */
function patrols() { return foes.filter(function (f) { return hostile(f) && f.kind === "mech" && !f.guard && !f.boss && !f.sapper && !(f.carry && f.carry.length) && !has(f, "stalker") && f.task !== "repair" && f.task !== "leave" && f.task !== "mine" && (f.route || f.patrol); }); }
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
function dismiss(f) { if (!f || f.dead || f.boss || (f.carry && f.carry.length) || (f.bag && f.bag.length)) return false; f.task = "leave"; f.exit = null; f.stuck = 0; if (f.state === "alert") f.state = "idle"; return true; }
/* Переносная турель игрока: встаёт впереди и бьёт врагов на своей линии. */
function deployTurret(shots, k) {
  var g = G(), v = DIRV[g.face] || DIRV.N, x = g.x + v[0], y = g.y + v[1];
  if (!canStand(null, x, y) || CUR().fl.t[idx(x, y)] === LAB.T.DOOR) { var c = freeCellNear(g.x, g.y, null); if (!c) return false; x = c[0]; y = c[1]; }
  var t = spawnFoe("miniturret", x, y, { ally: true, shots: shots || 30 });
  if (!t) return false;
  t.ally = true; t.shots = shots || 30; t.state = "hunt";
  if (k && k !== 1) t.dmg = Math.round(t.dmg * k);
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
  /* (1.5) ловушки и мины: свои и чужие — все в traps.js */
  if (LAB.traps) LAB.safe(LAB.traps.playerStep);
  if (S.turnBased) tick();
}
/* Описание врага для сканера и окна персонажа. */
function describe(f) {
  var d = dist(f, heroPos());
  var hp = f.hp / f.maxhp, fem = f.g === "f";
  var st = hp > 0.75 ? (fem ? "цела" : "цел") : hp > 0.4 ? (f.kind === "mech" ? (fem ? "повреждена" : "повреждён") : (fem ? "ранена" : "ранен")) : "едва держится";
  if (has(f, "camera")) return f.name + ", " + gm().relDir(f.x, f.y) + ", " + (camDirs(f) && camFacing(f) ? "смотрит в вашу сторону" : "смотрит в другую сторону");
  if (has(f, "observer")) return f.name + ", " + gm().relDir(f.x, f.y) + ", не нападает — следит и докладывает ОКО";
  if (isNetTurret(f) && (f.cut || f.mine)) return f.name + ", " + gm().relDir(f.x, f.y) + ", " + (f.cut ? "кабель перерезан, молчит" : "признала вас по ключу ОКО, бьёт по врагам");
  return f.name + ", " + gm().relDir(f.x, f.y) + ", " + st + (f.shield > 0 ? ", под щитом" : "") + (f.calm ? ", не враждебен" : f.state === "hunt" ? ", охотится" : f.state === "alert" ? ", насторожен" : "") + (f.guard ? ", на посту" : f.task === "repair" ? ", идёт чинить турели" : f.route ? ", патрулирует" : "");
}

/* ════════ ИМПЛАНТЫ И ГРАНАТЫ ════════ */
function useImplant(id, free) {
  var g = G(), IM = LAB.implants;
  if (!free && g.implants.indexOf(id) < 0) { say("Такого импланта нет."); return; }
  /* (2.0) пассивный чип работает сам */
  if (IM && IM.isChip(id)) { say(IM.line(id)); return; }
  if (id === "hack") { say("Дистанционный взлом применяется у запертой двери: " + LAB.K("двойное касание у двери.", "Enter у двери.")); return; }
  if ((id === "scan" || id === "echo") && jammed()) { A("play", "jam"); say("Помехи: глушилка робота рядом забивает сканер."); return; }
  var cost = gm().implantCost(id);
  if (!free && !gm().spendEnergy(id)) return;
  A("implant", id);
  switch (id) {
    case "scan": {
      /* (2.0) радиус и что ещё — от ступени и модификаций (implants.js) */
      var sr = IM ? IM.scanR(id) : 8;
      var list = foes.filter(function (f) { return !f.dead && dist(f, heroPos()) <= sr && !(aff(f, "cloak") && dist(f, heroPos()) > 3); });
      var items = gm().floorItems().filter(function (it) { return Math.abs(it.x - g.x) + Math.abs(it.y - g.y) <= sr; });
      var parts = [];
      parts.push(list.length ? "Враги: " + list.map(describe).join("; ") + "." : "Врагов рядом нет.");
      /* (1.6) на каждого найденного — звуковой маяк: ползёт вместе с ним, пока не отстанет */
      list.forEach(function (f) { f.mark = Date.now() + 45000; });
      if (list.length) parts.push("На них повешены маяки: " + (list.length === 1 ? "он звучит, пока враг рядом." : "они звучат, пока враги рядом."));
      if (items.length) parts.push("Вещи: " + items.slice(0, 6).map(function (it) { return gm().itemName(it) + " " + gm().relDir(it.x, it.y); }).join(", ") + ".");
      var sec = gm().nearSecret(4);
      if (sec) parts.push("Пустота за стеной " + LAB.DIRN[sec.dir] + ": тайник.");
      if (LAB.traps) { var tsx = LAB.traps.scanText(8); if (tsx) parts.push(tsx); }
      say(parts.join(" ") + (IM ? IM.scanExtra(id, list) : ""));
      break;
    }
    case "echo": say(echoText()); break;
    case "tk": telekinesis(); break;
    /* остальные — общий механизм имплантов (implants.js): ступень, направление, модификации */
    default: if (IM) IM.run(id);
  }
  if (IM && !free) IM.used(id, cost);
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
    if (CUR().fl.t[idx(x, y)] === LAB.T.DOOR) { var dd = CUR().fl.doorAt[idx(x, y)]; if (!dd || CUR().fs.doors[dd.id] !== 2) break; }
    if (LAB.solidAt(CUR().fl, x, y)) break;
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
/* (2.0) Патруль поблизости — «Эхо» называет его, пока он вас не заметил: где
   и сколько шагов. На каждого патрульного — раз в минуту; в бою — молчит. */
var cueAt = 0;
function patrolCue() {
  if (tickN % 2) return;
  var now = Date.now(), hero = heroPos(), best = null, bd = 99;
  if (now - cueAt < 8000) return;
  for (var i = 0; i < foes.length; i++) {
    var f = foes[i];
    if (f.dead || f.ally || f.calm || f.disguised || aff(f, "cloak")) continue;
    if (f.state === "hunt" || f.state === "alert") { if (cheb(f, hero) <= 10) return; continue; }
    if (!f.beat || f.kind !== "mech") continue;
    var d = cheb(f, hero);
    if (d > 12 || d < 2 || (f.cueT && now - f.cueT < 60000)) continue;
    if (d < bd) { bd = d; best = f; }
  }
  if (!best) return;
  best.cueT = now; cueAt = now;
  /* летающая машина не шагает — гудит */
  var fly = ((best.base && best.base.beh) || []).indexOf("fly") >= 0;
  LAB.say((fly ? "Гул патруля: " : "Шаги патруля: ") + best.name.split(",")[0] + ", " + gm().relDir(best.x, best.y) + ".", { interrupt: false, prio: "info" });
}
function announceSpotted(list) {
  var now = Date.now();
  var names = list.map(function (f) { return f.name.split(",")[0] + " " + gm().relDir(f.x, f.y); });
  var verb = list.length > 1 ? "заметили вас" : (list[0].g === "f" ? "заметила вас" : "заметил вас");
  if (now - lastSpot < 2500 && list.length === 1) { sayq(names[0] + "."); lastSpot = now; return; }
  lastSpot = now;
  say(names.join(", ") + " — " + verb + "!", { interrupt: false });
  if (LAB.tutor && list.some(function (f) { return f.kind === "mech"; })) LAB.tutor.ev("robot");
  if (!G().drawn && !G().tut.drawHint && (!LAB.tutor || LAB.tutor.hintsOn())) { G().tut.drawHint = 1; sayq(LAB.K("Выньте оружие: одно касание тремя пальцами. Затем свайп в сторону врага — выстрел.", "Достаньте оружие: R. Затем стрелка в сторону врага — выстрел.")); }
}

/* ════════ ГРАНАТЫ (2.0) ════════
   Бросок — жест влево-вправо одним пальцем или клавиша Y: летит выбранная
   граната (вправо-влево или Shift+Y — выбрать), туда, куда вы смотрите.
   В рюкзаке одна граната — выбирать нечего, летит она. ЭМИ-граната,
   шумовая приманка и устройства — как прежде; новые гранаты (fx.gren) —
   здесь: урон и действие по всем в радиусе от места падения. */
function throwables() {
  var g = G(), out = [];
  for (var id in g.inv) { var d = LAB.ITEMS[id]; if (d && d.kind === "throw" && g.inv[id] > 0) out.push(id); }
  out.sort(function (a, b) { return LAB.ITEMS[a].n < LAB.ITEMS[b].n ? -1 : 1; });
  return out;
}
function throwQuick() {
  var g = G(), have = throwables();
  if (!have.length) { LAB.UI.error(); say("Гранат и приманок нет. Их продают торговые терминалы и пункты снабжения, собирают у верстака, находят в ящиках."); return false; }
  var sel = g.gren && have.indexOf(g.gren) >= 0 ? g.gren : (have.length === 1 ? have[0] : null);
  if (!sel) { pickGrenade(true); return false; }
  g.gren = sel;
  return gm().useItem(sel);
}
function pickGrenade(thenThrow) {
  var g = G(), have = throwables();
  if (!have.length) { LAB.UI.error(); say("Гранат и приманок нет."); return; }
  UIx("menu", thenThrow ? "Что бросить" : "Выбор гранаты", have.map(function (id) {
    var d = LAB.ITEMS[id];
    return { label: d.n + ", " + g.inv[id] + " шт." + (g.gren === id ? " Выбрана." : ""), fn: function () {
      g.gren = id;
      if (thenThrow) { UIx("closeAll"); gm().useItem(id); return; }
      say("Выбрано: " + d.n + ". Бросок — " + LAB.K("влево и сразу вправо одним пальцем", "Y") + ".");
    } };
  }), { intro: thenThrow ? "Выбранная граната запомнится." : "" });
}
/* Куда долетит: до range клеток вперёд, до стены, закрытой двери или первого врага. */
function flight(range) {
  var g = G(), v = DIRV[g.face] || DIRV.N, x = g.x, y = g.y, fl = CUR().fl, fs = CUR().fs;
  for (var i = 1; i <= range; i++) {
    var nx = x + v[0], ny = y + v[1];
    if (!LAB.inb(nx, ny)) break;
    var t = fl.t[idx(nx, ny)];
    if (t === LAB.T.WALL || (t === LAB.T.DOOR && fs.doors[fl.doorAt[idx(nx, ny)].id] !== 2)) break;
    x = nx; y = ny;
    if (foeAtCell(nx, ny)) break;
  }
  return { x: x, y: y };
}
function throwGrenade(id) {
  var g = G(), d = LAB.ITEMS[id], q = d && d.fx && d.fx.gren;
  if (!q || !(g.inv[id] > 0)) { say("Нет: " + (d ? d.n : id) + "."); return false; }
  g.inv[id]--;
  var p = flight(q.range || 5), dirW = LAB.DIRTO[g.face] || "";
  A("grenade", p.x, p.y);
  var k = 1 + 0.12 * (LAB.foeLevel(g.L, g.F) - 1), dmg = Math.round((q.dmg || 0) * k), r = q.r == null ? 1 : q.r;
  setTimeout(function () {
    LAB.safe(function () {
      if (!gm().entered || G().dead) return;
      var hit = 0, killed = 0;
      foes.forEach(function (f) {
        if (f.dead || f.ally || f.burrowed || cheb(f, p) > r) return;
        var was = f.dead;
        hit++;
        if (dmg > 0) damageFoe(f, dmg, q.dt || "kinetic", { noarmor: !!q.noarmor, quiet: true, stunMech: q.stunMech || 0 });
        if (f.dead) { if (!was) killed++; return; }
        if (q.emp && f.kind === "mech" && !aff(f, "hardened")) f.shield = 0;
        if (q.freeze && !f.boss) f.frozen = Math.max(f.frozen || 0, q.freeze);
        if (q.slow && !f.boss) f.slowT = Math.max(f.slowT || 0, q.slow);
        if (q.stun && f.kind !== "mech" && !f.boss) f.frozen = Math.max(f.frozen || 0, q.stun);
        if (q.confuse && !f.boss) f.confused = Math.max(f.confused || 0, q.confuse);
        if (q.deaf) f.deafT = Math.max(f.deafT || 0, q.deaf);
        if (q.mark) f.markT = Math.max(f.markT || 0, q.mark);
        if (q.blind) f.blindT = Math.max(f.blindT || 0, q.blind);
        if (q.knock && !f.boss && !has(f, "stationary") && !has(f, "turret")) {
          var dx = Math.sign(f.x - p.x), dy = Math.sign(f.y - p.y);
          if (dx || dy) { var nx = f.x + dx, ny = f.y + (dx ? 0 : dy); if (canStand(f, nx, ny)) moveFoe(f, nx, ny); }
        }
        if (f.state === "idle") { f.state = "alert"; f.lastKnown = heroPos(); f.lost = 0; }
      });
      if (q.blind) foes.forEach(function (f) { if (!f.dead && isCam(f) && cheb(f, p) <= r + 4) f.blindT = Math.max(f.blindT || 0, q.blind); });
      /* огонь и пар — от урона гранаты первого уровня: глубину зона добавляет сама (traps.tick) */
      if (q.burn && LAB.traps && LAB.traps.addZone) LAB.traps.addZone("fire", p.x, p.y, Math.max(1, r), q.burn, Math.max(4, Math.round((q.dmg || 0) * 0.3)), 1);
      if (q.gas && LAB.traps && LAB.traps.addZone) LAB.traps.addZone("gas", p.x, p.y, Math.max(1, r), q.gas, Math.max(4, Math.round((q.dmg || 0) * 0.25)), 1);
      A("explosion", p.x, p.y, q.emp ? "emp" : q.dt === "acid" || q.gas ? "acid" : dmg >= 60 ? "shell" : "mine");
      noise(q.loud == null ? 10 : q.loud);
      var self = q.self !== false && dmg > 0 && cheb(heroPos(), p) <= r;
      if (self) hurtPlayer(Math.round(dmg * 0.5), q.dt === "thermo" ? "therm" : "phys", null);
      say(d.n + " " + dirW + ". " + (hit ? "Задето целей: " + hit + (killed ? ", уничтожено: " + killed : "") + "." : "Рядом с местом падения никого.") + (self ? " Вас задело: слишком близко." : "") + " Осталось: " + (G().inv[id] || 0) + ".");
      if (LAB.ach) LAB.ach.ev("grenade", 1);
      UIx("refresh");
    });
  }, Math.max(250, q.fuse || 700));
  return true;
}

LAB.combat = {
  /* для проверок: подсказку о патруле — заново */
  _cueReset: function () { cueAt = 0; foes.forEach(function (f) { f.cueT = 0; }); },
  throwQuick: throwQuick, pickGrenade: pickGrenade, throwGrenade: throwGrenade, throwables: throwables,
  loadFoes: loadFoes, syncFoes: syncFoes, wake: start, start: start, stop: stop, tick: tick,
  danger: danger, hunted: hunted, visibleFoes: visibleFoes, nearestFoe: nearestFoe, aliveCount: aliveCount, jammed: jammed,
  afterPlayerMove: afterPlayerMove, noise: noise, turretsOff: turretsOff, turretsOurs: turretsOurs, turretsHostile: turretsHostile, turretsLeft: turretsLeft,
  robotsCalm: robotsCalm, calmAll: calmAll, chaser: chaser, alertMech: alertMech, sendSquad: sendSquad, deployTurret: deployTurret, noiseLure: noiseLure, throwNoise: throwNoise,
  dispatch: dispatch, replacePatrol: replacePatrol, refillRoom: refillRoom, okoPoint: okoPoint, patrols: patrols, sappers: sappers, minePoints: minePoints, drones: drones, repairers: repairers, guards: guards, sendCheck: sendCheck, reroute: reroute, dismiss: dismiss, despawn: despawn,
  lastSquad: function () { return lastSquad; }, tickN: function () { return tickN; }, wakeSafe: function () { return safeHero; }, sheltered: sheltered, refuge: function () { return refugeId; },
  lodR: lodR, lodLevel: lodLevel, tickMs: function () { return tickEma; }, search: search, netUp: netUp, camFacing: camFacing,
  quietTurret: quietTurret, jammer: jammer, freeCellNear: freeCellNear, spawnFoe: spawnFoe, damageFoe: damageFoe, unmask: unmask, dropCarry: dropCarry, _relayCall: function (f) { relayCall(f); }, _cleanerTick: function (f) { cleanerTick(f); }, isTurret: isTurret, cutTurret: cutTurret, mineTurret: mineTurret, unmineTurrets: unmineTurrets, flankCell: flankCell,
  mineCount: function () { return foes.filter(function (f) { return isNetTurret(f) && f.mine; }).length; }, cutCount: function () { return foes.filter(function (f) { return (isNetTurret(f) && f.cut) || (isCam(f) && f.camOff); }).length; },
  cams: cams, camState: camState, camSet: camSet, camExpire: camExpire, camCount: camCount, isCam: isCam, smashCam: smashCam, camsBroken: camsBroken,
  areaDamage: areaDamage, throwEmp: throwEmp, reloadPause: reloadPause, fire: fire, startFire: startFire, stopFire: stopFire,
  useImplant: useImplant, useImplantFree: function (id) { useImplant(id, true); }, describe: describe, hurtPlayer: hurtPlayer, foes: function () { return foes; }
};
})();
