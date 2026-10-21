/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — охрана этажа (2.0).
   • Патрули в коридорах: у каждого свой участок обхода — два-три коридора,
     сходящихся устьями в одно помещение. Патрульный идёт до двери в дальнем
     конце коридора, разворачивается, проходит помещение и уходит в
     следующий коридор — и так туда-обратно. Чем глубже, тем патрулей
     больше; глубже середины комплекса — и парами. Шаги машин слышно
     издалека: коридоры длинные.
   • Машины в кабинетах — по важности и назначению помещения: оружейные,
     посты охраны, серверные и режимные хранилища стерегут стражи;
     щитовые, лаборатории, мастерские — техники и рабочие машины; склады —
     погрузчики и ящики-ловушки; кабинеты и подсобки — курьеры и уборщики.
     Важное охраняется чаще и плотнее, обычное — изредка. Страж кабинета
     держится своего помещения: потерял вас — возвращается на место.
   • Сапёры ОКО: со второго уровня ходят обходом, по приказу ОКО ставят
     ловушки (oko.js: приказ, combat.js: работа сапёра).
   Всё — своим потоком случайностей, после кабинетов (annex.js): прочее на
   этаже от охраны не меняется. Охрана — с самого первого этажа. Наверху
   патрулируют шагающие обходчики и дроны — их слышно издалека.
   (2.0, просьба игрока) Охраны много: машина почти в каждом кабинете, глубже
   — по две-три и твари в части кабинетов; патруль — почти в каждом коридоре,
   глубже больше и парами; у лестниц и лифта — стражи поста. Погибшие машины
   ОКО заменяет (oko.js).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

/* ── назначение кабинета: по виду и названию ── */
var RULES = [
  [/armory|blasting|arsenal|оружей|взрывчат|боеприпас|арсенал|стрельбищ|тир\b/i, "arms"],
  [/guard|booth|dispatch|gatehouse|security|post_|охран|караул|диспетчер|сторожк|пост |проходн|будка/i, "sec"],
  [/server|cable|radio|comm|relay|okonode|вычисл|сервер|кабельн|радиоруб|связ|узел|ретрансл|телефон|коммутат/i, "server"],
  [/classified|archive|vault|safe|isotope|режимн|архив|хранилищ|сейф|касс|бухгалтер|секрет|гриф/i, "vault"],
  [/electric|switch|battery|transform|generator|boiler|power|электрощит|щитов|аккумулятор|трансформ|генератор|котельн|энерг|подстанц|насосн|водоотлив|венткамер/i, "power"],
  [/lab|chem|xray|photolab|dosim|gasroom|радиохим|лаборатор|химреактив|рентген|фотолаб|испыта|проб|анализ|дозиметр|радиационн|сейсмо|керн|геолог/i, "lab"],
  [/repair|workshop|craft|smith|tool|print|sew|weav|pott|мастерск|слесар|ремонт|инструмент|пошивоч|ткацк|гончар|типограф|столяр|сварочн|токарн/i, "work"],
  [/store|stock|barn|shed|lostfound|suit|клад|склад|амбар|находок|спецодежд|сушилк|ламповая|кормов/i, "store"],
  [/firstaid|med|clinic|registry|физкульт|медблок|первой помощи|регистратур|лекарн|процедур|лечебн|изолятор/i, "med"],
  [/office|boss|reception|hr|meeting|кабинет|приёмн|отдел кадров|переговорн|нарядн|канцеляр/i, "office"],
  [/kitchen|buffet|tea|smoke|toilet|wc|shower|bath|locker|janitor|кухн|буфет|чайн|курилк|санузел|душев|раздевал|бан[яи]|подсобк|пекарн|коптильн|колодезн/i, "service"],
  [/music|child|nursery|chess|reading|aquarium|library|phyto|psych|музыкальн|детск|шахмат|читальн|красный уголок|библиотек|аквариум|фитокомн|психолог|класс/i, "leisure"]
];
function category(rm) {
  var key = (rm.type || "") + " " + (rm.name || "");
  for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(key)) return RULES[i][1];
  return "office";
}
/* p — как часто охраняется, n — сколько машин (второе — глубже), roles — кто */
var CAT = {
  arms:    { p: 0.85, n2: 0.55, roles: ["guard", "guard"], imp: 3 },
  sec:     { p: 0.8,  n2: 0.45, roles: ["guard", "guard"], imp: 3 },
  server:  { p: 0.75, n2: 0.4,  roles: ["tech", "guard"], imp: 3 },
  vault:   { p: 0.65, n2: 0.4,  roles: ["guard", "tech"], imp: 3 },
  power:   { p: 0.55, n2: 0.2,  roles: ["tech", "worker"], imp: 2 },
  lab:     { p: 0.4,  n2: 0.15, roles: ["worker", "tech"], imp: 2 },
  work:    { p: 0.45, n2: 0.15, roles: ["worker", "tech"], imp: 2 },
  store:   { p: 0.4,  n2: 0.15, roles: ["loader", "worker"], imp: 2 },
  med:     { p: 0.3,  n2: 0,    roles: ["worker"], imp: 1 },
  office:  { p: 0.18, n2: 0,    roles: ["clerk"], imp: 1 },
  service: { p: 0.22, n2: 0,    roles: ["cleaner"], imp: 0 },
  leisure: { p: 0.1,  n2: 0,    roles: ["cleaner", "clerk"], imp: 0 }
};
var SKIP_KIND = { secret: 1, supply: 1, trial: 1, decon: 1, hazard: 1 };

function has(b, k) { return b.beh.indexOf(k) >= 0; }
var ODD = ["stationary", "turret", "camera", "cleaner", "mimic", "swarm", "stalker", "relay", "observer", "burrow", "indirect", "blink"];
function mobileMech(id) { var b = LAB.FOES[id]; return !!b && b.kind === "mech" && ODD.every(function (k) { return !has(b, k); }); }
function ok(id) { return !!LAB.FOES[id]; }
/* Машины по ролям: на малой глубине — лёгкие, ниже — тяжелее; глубже Ядра —
   и свои машины уровня (с тем же поведением). */
function rolePool(role, L, F) {
  var d0 = LAB.depth(L, F), lev = LAB.LEVELS[L] || {}, own = (lev.foes || []).filter(mobileMech), out;
  var ranged = own.filter(function (id) { return has(LAB.FOES[id], "ranged") || has(LAB.FOES[id], "chase"); });
  switch (role) {
    case "guard":
      out = d0 < 20 ? ["drone", "walker"] : d0 < 40 ? ["drone", "patrolbot"] : d0 < 100 ? ["patrolbot", "drone", "patrolbot"] : d0 < 140 ? ["patrolbot", "guardbot"] : ["guardbot", "patrolbot", "android"];
      if (L > 10 && ranged.length) out = out.concat(ranged, ranged);
      break;
    case "tech":
      out = d0 < 40 ? ["drone"] : d0 < 80 ? ["repairbot", "drone"] : ["repairbot", "installer", "welder"];
      if (L > 10) out = out.concat(own.filter(function (id) { return /repair|install|weld|fix|tech|mend/.test(id) || has(LAB.FOES[id], "builder") || has(LAB.FOES[id], "fixer"); }));
      break;
    case "worker":
      out = d0 < 40 ? ["cleaner"] : d0 < 80 ? ["welder", "cleaner"] : ["welder", "loader", "repairbot"];
      if (L > 10 && ranged.length) out = out.concat(ranged);
      break;
    case "loader":
      out = d0 < 60 ? ["cleaner"] : ["loader", "mimicbox", "loader"];
      break;
    case "clerk":
      out = d0 < 100 ? ["courier", "drone"] : ["courier", "drone", "foreman"];
      break;
    default:
      out = ["cleaner"];
  }
  out = out.filter(ok);
  return out.length ? out : ["cleaner"];
}
/* (2.0) Твари уровня — для кабинетов: подвижные, не стражи этажа */
function bioPool(L) {
  var lev = LAB.LEVELS[L] || {};
  return (lev.foes || []).filter(function (id) { var b = LAB.FOES[id]; return !!b && b.kind !== "mech" && !b.boss && !has(b, "stationary") && !has(b, "burrow"); });
}
/* Патрульные коридоров */
function patrolPool(L, F) {
  var d0 = LAB.depth(L, F), lev = LAB.LEVELS[L] || {}, out;
  var own = (lev.foes || []).filter(function (id) { return mobileMech(id) && (has(LAB.FOES[id], "patrol") || has(LAB.FOES[id], "ranged")); });
  /* (2.0) наверху — шагающие обходчики: их шаги по коридору слышно издалека;
     машины уровня здесь — реже, чтобы обход было слышно */
  out = d0 < 8 ? ["walker", "walker", "walker", "drone", "drone", "courier"] : d0 < 20 ? ["walker", "walker", "patrolbot", "drone", "drone"] : d0 < 60 ? ["patrolbot", "drone", "walker"] : ["patrolbot"];
  out = out.concat(d0 < 20 ? [] : own.concat(own));
  out = out.filter(ok);
  return out.length ? out : ["patrolbot"];
}

/* ── клетки ── */
function T() { return LAB.T; }
function freeCell(fl, x, y, busy) {
  if (!LAB.inb(x, y)) return false;
  var i = y * LAB.W + x, t = fl.t[i];
  if (t !== T().ROOM && t !== T().CORR) return false;
  if (fl.objAt[i] || busy[i]) return false;
  return true;
}
function nearDoor(fl, x, y) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { var xx = x + v[0], yy = y + v[1]; return LAB.inb(xx, yy) && fl.t[yy * LAB.W + xx] === T().DOOR; });
}
function busyMap(fl) {
  var b = {}, W = LAB.W;
  fl.items.forEach(function (q) { b[q.y * W + q.x] = 1; });
  fl.foes.forEach(function (q) { b[q.y * W + q.x] = 1; });
  fl.npcs.forEach(function (q) { b[q.y * W + q.x] = 1; });
  return b;
}
/* Точки прибытия: тут никого не ставим рядом — дать осмотреться. */
function arrivals(fl) {
  var out = [];
  fl.objs.forEach(function (o) { if (/^(stairs_up|elevator|wake|gate_sealed|capsule)$/.test(o.type)) out.push([o.x, o.y]); });
  var u = fl.rooms[fl.U]; if (u) out.push([u.cx, u.cy]);
  return out;
}
function farFrom(pts, x, y, d) { return pts.every(function (p) { return Math.abs(p[0] - x) + Math.abs(p[1] - y) > d; }); }

/* ── участок обхода: точки вдоль коридоров ── */
function corrPoints(fl, c, lane, busy) {
  var door = null;
  for (var i = 0; i < fl.doors.length; i++) if (fl.doors[i].id === c.door) { door = fl.doors[i]; break; }
  var h = c.axis === "h";
  var lo = h ? c.x0 : c.y0, hi = h ? c.x1 : c.y1, acrossLo = h ? c.y0 : c.x0;
  var dpos = door ? (h ? door.x : door.y) : hi + 1;
  var endA = dpos < lo ? lo + 1 : hi - 1, mouthA = dpos < lo ? hi - 1 : lo + 1;
  var ac = acrossLo + 1 + (lane % 2);
  var pick = function (along) {
    for (var k = 0; k < 6; k++) {
      var aa = along + (dpos < lo ? 1 : -1) * (endA === along ? k : -k);
      for (var j = 0; j < 4; j++) {
        var cc = acrossLo + ((ac - acrossLo + j) % 4);
        var x = h ? aa : cc, y = h ? cc : aa;
        if (freeCell(fl, x, y, busy) && !nearDoor(fl, x, y)) return [x, y];
      }
    }
    return null;
  };
  var e = pick(endA), m = pick(mouthA);
  return e && m ? { end: e, mouth: m } : null;
}
function beatFor(fl, r, c0, lane, busy) {
  var room = c0.mouthRoom, same = fl.corrs.filter(function (c) { return c !== c0 && c.mouthRoom === room && !c.hidden; });
  r.shuffle(same);
  var chain = [c0].concat(same.slice(0, r.chance(0.5) ? 2 : 1));
  var pts = [], first = true;
  for (var i = 0; i < chain.length; i++) {
    var cp = corrPoints(fl, chain[i], lane, busy);
    if (!cp) continue;
    if (first) { pts.push(cp.end, cp.mouth); first = false; }
    else { pts.push(cp.mouth, cp.end); if (i < chain.length - 1) pts.push(cp.mouth); }
  }
  return pts.length >= 2 ? pts : null;
}
/* клетка старта на участке: между двумя первыми точками */
function startOn(fl, pts, busy, r) {
  var a = pts[0], b = pts[1];
  var n = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  for (var k = 0; k < 8; k++) {
    var t = r.next(), x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t);
    if (n && freeCell(fl, x, y, busy) && !nearDoor(fl, x, y)) return [x, y];
  }
  return freeCell(fl, a[0], a[1], busy) ? a : null;
}

function place(ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F;
  if (!fl || !ctx.makeFoe) return;
  var r = LAB.Rng(ctx.seed, "garrison:" + L + ":" + F + ":" + (ctx.attempt || 0));
  var d0 = LAB.depth(L, F), busy = busyMap(fl), arr = arrivals(fl), W = LAB.W;
  var mark = function (x, y) { busy[y * W + x] = 1; };
  var stats = { patrols: 0, sappers: 0, rooms: 0 };

  /* 1. Патрули в коридорах */
  var corrs = fl.corrs.filter(function (c) {
    if (c.mouthRoom === fl.secret || c.doorRoom === fl.secret || c.mouthRoom === fl.U || c.doorRoom === fl.U) return false;
    var d = null; for (var i = 0; i < fl.doors.length; i++) if (fl.doors[i].id === c.door) { d = fl.doors[i]; break; }
    return !(d && d.lock && d.lock.type === "secret");
  });
  r.shuffle(corrs);
  /* (2.0) патруль — почти в каждом коридоре; глубже — больше, чем коридоров */
  var nP = Math.round(corrs.length * (L === 1 ? (F <= 2 ? 0.85 : 0.95) : Math.min(1.6, 1 + 0.04 * Math.min(L, 10) + d0 * 0.0003)));
  var pPool = patrolPool(L, F);
  for (var p = 0; p < nP && corrs.length; p++) {
    var c = corrs[p % corrs.length];
    var pts = beatFor(fl, r, c, p, busy);
    if (!pts) continue;
    var st = startOn(fl, pts, busy, r);
    if (!st || !farFrom(arr, st[0], st[1], 5)) continue;
    var fid = r.pick(pPool);
    /* (2.0) наверху первый патруль этажа — всегда обходчик: обход слышно */
    if (p === 0 && d0 < 20 && ok("walker")) fid = "walker";
    var f = ctx.makeFoe(fid, st[0], st[1], -1, { corr: c.id, patrol: true, beat: pts, oko: true }, r);
    if (!f) continue;
    mark(st[0], st[1]); stats.patrols++;
    /* напарник: глубже — патрули парами */
    if (d0 >= 60 && r.chance(Math.min(0.45, 0.15 + d0 * 0.0008))) {
      var st2 = null;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { if (freeCell(fl, st[0] + v[0], st[1] + v[1], busy) && !nearDoor(fl, st[0] + v[0], st[1] + v[1])) { st2 = [st[0] + v[0], st[1] + v[1]]; return true; } return false; });
      if (st2) { var f2 = ctx.makeFoe(r.pick(pPool), st2[0], st2[1], -1, { corr: c.id, patrol: true, beat: pts, bi: 0, oko: true }, r); if (f2) { mark(st2[0], st2[1]); stats.patrols++; } }
    }
  }
  /* 2. Сапёр ОКО: со второго уровня ходит обходом и минирует по приказу */
  if (L >= 2 && LAB.FOES.sapper && corrs.length) {
    var nS = r.chance(L <= 3 ? 0.45 : L <= 9 ? 0.65 : 0.8) ? 1 + (L >= 10 && r.chance(0.4) ? 1 : 0) : 0;
    for (var s = 0; s < nS; s++) {
      var cs = corrs[(nP + s) % corrs.length], ps = beatFor(fl, r, cs, s + 1, busy);
      if (!ps) continue;
      var ss = startOn(fl, ps, busy, r);
      if (!ss || !farFrom(arr, ss[0], ss[1], 12)) continue;
      if (ctx.makeFoe("sapper", ss[0], ss[1], -1, { corr: cs.id, patrol: true, beat: ps, oko: true, sapper: true }, r)) { mark(ss[0], ss[1]); stats.sappers++; }
    }
  }
  /* 3. Машины в кабинетах — по важности и назначению. (2.0) Почти в каждом
     кабинете: обычный кабинет — машина с вероятностью от 0,85 наверху до
     0,97 в глубине, важный — чаще; вторая и третья машина — глубже и в
     важных; в части кабинетов — твари уровня (в лабораториях, медблоках и
     на складах чаще). Предела на этаж нет. */
  var pOcc = L === 1 ? 0.85 : Math.min(0.97, 0.88 + 0.005 * L);
  var pBio = Math.min(0.4, 0.06 + 0.004 * L), bios = bioPool(L);
  var rooms = [];
  fl.rooms.forEach(function (rm, i) { if (rm && rm.annex && !rm.hidden) rooms.push(i); });
  r.shuffle(rooms);
  /* важные — первыми: при упоре в предел охраняются они */
  rooms.sort(function (a, b) { return CAT[category(fl.rooms[b])].imp - CAT[category(fl.rooms[a])].imp; });
  var placed = 0;
  for (var ri = 0; ri < rooms.length; ri++) {
    var id = rooms[ri], rm = fl.rooms[id], def = (LAB.ANNEX_ROOMS || {})[rm.type] || {};
    if (SKIP_KIND[def.kind]) continue;
    var cname = category(rm), cat = CAT[cname];
    var dr = null; for (var di = 0; di < fl.doors.length; di++) if (fl.doors[di].room === id && fl.doors[di].annex) { dr = fl.doors[di]; break; }
    if (dr && !farFrom(arr, dr.x, dr.y, 3)) continue;
    /* в кабинете уже кто-то есть (annex.js: режимные и с радиацией) */
    var already = fl.foes.some(function (q) { return q.room === id; });
    var pr = Math.max(pOcc, cat.imp >= 2 ? Math.min(0.98, cat.p + 0.2) : 0) * (already ? 0.5 : 1);
    var cells = [];
    for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) if (freeCell(fl, x, y, busy) && !nearDoor(fl, x, y)) cells.push([x, y]);
    if (!cells.length) continue;
    r.shuffle(cells);
    var ci = 0;
    /* твари уровня: сбежавшие из лабораторий, гнёзда в подсобках и на складах */
    if (bios.length && r.chance(pBio + (/^(lab|med|store|service)$/.test(cname) ? 0.08 : 0))) {
      var bt = r.pick(bios), nb = has(LAB.FOES[bt], "swarm") ? 2 + (r.chance(0.4) ? 1 : 0) : 1;
      for (var b2 = 0; b2 < nb && ci < cells.length; b2++, ci++) {
        if (ctx.makeFoe(bt, cells[ci][0], cells[ci][1], id, { garrison: cname, lair: true, guard: "room", post: [cells[ci][0], cells[ci][1]] }, r)) { mark(cells[ci][0], cells[ci][1]); placed++; }
      }
    }
    if (!r.chance(pr)) { if (ci) stats.rooms++; continue; }
    var n = 1 + (r.chance(Math.min(0.85, cat.n2 + 0.1 + 0.025 * Math.min(L, 10) + d0 * 0.0003)) ? 1 : 0) + (d0 >= 40 && (cat.imp >= 2 || cells.length >= 20) && r.chance(Math.min(0.5, 0.05 + d0 * 0.0004)) ? 1 : 0);
    for (var q = 0; q < n && ci < cells.length; q++, ci++) {
      var role = q < cat.roles.length ? cat.roles[q] : "guard", pool = rolePool(role, L, F), fid2 = r.pick(pool), cc = cells[ci];
      var base = LAB.FOES[fid2];
      var ex = { garrison: category(rm), oko: true };
      /* уборщик и ящик-ловушка живут по своим правилам; прочие держатся кабинета */
      if (!has(base, "cleaner") && !has(base, "mimic")) { ex.guard = "room"; ex.post = [cc[0], cc[1]]; if (role === "worker" || role === "tech" || role === "loader") ex.work = true; }
      if (ctx.makeFoe(fid2, cc[0], cc[1], id, ex, r)) { mark(cc[0], cc[1]); placed++; }
    }
    stats.rooms++;
  }
  /* 4. (2.0) Стражи поста у лестниц, лифта и шлюза: встречают и провожают
     (вид поста — lift, stairs, gate: ОКО по нему поднимает стражу, когда
     прибыл лифт, и присылает смену на опустевший пост). У места пробуждения
     и у капсул — никого: там приходят в себя. */
  var posts = 0, calm = [];
  fl.objs.forEach(function (o) { if (o.type === "wake" || o.type === "capsule") calm.push([o.x, o.y]); });
  fl.objs.forEach(function (o) {
    if (!/^(stairs_up|stairs_down|elevator|gate_sealed|gate_down)$/.test(o.type)) return;
    var kind = o.type === "elevator" ? "lift" : /^gate/.test(o.type) ? "gate" : "stairs";
    var want = (o.type === "stairs_down" || o.type === "gate_down" ? 1 : 0) + (L === 1 ? 1 : 2 + (d0 >= 100 && r.chance(0.5) ? 1 : 0));
    var cand = [];
    for (var y2 = o.y - 6; y2 <= o.y + 6; y2++) for (var x2 = o.x - 6; x2 <= o.x + 6; x2++) {
      var dd = Math.abs(x2 - o.x) + Math.abs(y2 - o.y);
      if (dd >= 3 && dd <= 7 && freeCell(fl, x2, y2, busy) && !nearDoor(fl, x2, y2) && farFrom(calm, x2, y2, 10)) cand.push([x2, y2]);
    }
    r.shuffle(cand);
    for (var w = 0; w < want && w < cand.length; w++) {
      var gp = rolePool("guard", L, F), gfid = r.pick(gp), gc = cand[w];
      if (ctx.makeFoe(gfid, gc[0], gc[1], fl.room ? fl.room[gc[1] * W + gc[0]] : -1, { guard: kind, post: [gc[0], gc[1]], oko: true, stairPost: o.type }, r)) { mark(gc[0], gc[1]); posts++; }
    }
  });
  stats.posts = posts;
  fl.garrison = { patrols: stats.patrols, sappers: stats.sappers, rooms: stats.rooms, posts: posts, robots: placed + posts };
}

LAB.garrison = { place: place, category: category, CAT: CAT, rolePool: rolePool, patrolPool: patrolPool, bioPool: bioPool };
})();
