/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — поручения выживших (3.6).
   Поручений у выжившего сколько угодно, но каждое следующее тяжелее
   прежнего: ступень — сколько вы уже сделали для этого человека.
   Первая просьба — здесь, на этом этаже, в один шаг; вторая — на
   соседнем этаже; дальше — два, три, четыре шага на разных этажах, всё
   дальше от заказчика, врагов больше, цели труднее: питание этажа,
   данные научных терминалов, взлом защищённых терминалов, перепрошивка
   роботов и камер, блокировка дверей, завалы, сейфы, тайные ходы,
   стенды испытаний, образцы «Колыбели», посылки и помощь раненым на
   других этажах, страж уровня.
   Плата — по труду (work): за единицу труда одна и та же, так что
   лёгкие просьбы по кругу ничего не дают, а долгие платят за долгое.
   Детали и припасы оплачиваются дороже скупки, но дешевле покупки:
   купить и сдать — убыток.
   С третьей просьбы заказчик предлагает два пути — силой, через сеть и
   установки, поисками или руками; выбираете вы. У каждого ремесла —
   своя история в четыре главы (quests_texts.js); в конце главы — выбор,
   и он меняет следующие главы.
   Доверие (trust) растёт от честной работы и падает от отказов, обмана
   и опозданий: от него — плата и то, станет ли человек просить снова.
   Премии — за условия: тихо (ОКО не подняло тревогу на этажах
   поручения), быстро (до срока по часам «Эхо»), без крови (никого не
   убив). Срочная помощь раненому — с настоящим сроком: опоздали —
   поручение сорвано.
   Записи прежних версий: их поручения — одношаговые, как и были, и
   выполняются по-прежнему; счёт сделанного у каждого заказчика —
   по сданным поручениям.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function TX() { return LAB.QTEXT || { ARCS: {}, OPEN: {}, TROUBLE: {}, WHY: {} }; }
/* [м|ж] — по полу заказчика */
function gx(s, fem) { return String(s || "").replace(/\[([^\]|]*)\|([^\]]*)\]/g, function (m, a, b) { return fem ? b : a; }); }
function nowMin() { var g = G(); return (g.day || 0) * 1440 + (g.min || 0); }
function journal(t) { if (gm().journal) gm().journal(t); }
function rot(a, n) { if (!a || !a.length) return []; var k = (n >>> 0) % a.length; return a.slice(k).concat(a.slice(0, k)); }

var ACTIVE = 3;        /* взятых сразу — не больше трёх (3.5) */
var DONE_KEEP = 80;    /* сданных поручений в записи — последние восемьдесят; счёт — у заказчика */
var ARC_TIERS = [2, 5, 8, 11]; /* главы истории — с третьей, шестой, девятой и двенадцатой просьбы */

/* ════════ ЭТАЖИ И ИХ СОСТОЯНИЕ ════════ */
function fdef(L, F) { var g = G(), c = CUR(); return L === g.L && F === g.F && c.fl ? c.fl : LAB.getFloor(g.seed, L, F); }
function fst(L, F) { return G().fs[L + "-" + F] || null; }
function ost(L, F, id) { var s = fst(L, F); return (s && s.objs && s.objs[id]) || null; }
function vis(L, F) { var v = G().visited; return !!(v && v[L + "-" + F]); }
function onIt(s) { var g = G(); return s.tF != null && s.tL === g.L && s.tF === g.F; }
function idx(x, y) { return y * LAB.W + x; }
function roomLabel(rm) { return rm ? (rm.num ? "помещение " + rm.num + " («" + rm.name + "»)" : "«" + rm.name + "»") : "помещение"; }
function inRoom(label) { return String(label).replace(/^помещение/, "помещении"); }
/* где: от лица заказчика — «здесь, на этом этаже», «на этаже 7», «на этаже 3 уровня 4» */
function where(s, q) { if (s.tF == null) return ""; if (s.tL === q.L && s.tF === q.F) return "здесь, на этом этаже"; return "на этаже " + s.tF + (s.tL !== q.L ? " уровня " + s.tL : ""); }
function whereS(s, q) { if (s.tF == null || (s.tL === q.L && s.tF === q.F)) return ""; return ", этаж " + s.tF + (s.tL !== q.L ? " уровня " + s.tL : ""); }

/* ════════ ЗАКАЗЧИКИ: ступень, доверие, история ════════ */
function recs() { var g = G(); if (!g.givers || typeof g.givers !== "object") g.givers = {}; return g.givers; }
function doneOf(key) { var c = 0; G().quests.forEach(function (q) { if (q.giver === key && q.done && !q.failed) c++; }); return c; }
function giver(n) {
  var all = recs(), r = all[n.key];
  if (!r) {
    /* запись прежней версии: сделанное и отказы — по её поручениям */
    var d = 0, f = 0;
    G().quests.forEach(function (q) { if (q.giver === n.key && q.done) { if (q.failed) f++; else d++; } });
    r = all[n.key] = { done: d, fails: f, trust: clamp(50 + 3 * d - 12 * f, 15, 85), seq: 0, cool: 0, last: [], ch: 0, path: [] };
  }
  if (n.n) r.n = n.n;
  r.f = !!n.female;
  if (n.prof) r.prof = n.prof;
  if (n.heal) r.heal = 1;
  if (!r.path) r.path = [];
  if (!r.last) r.last = [];
  return r;
}
function recOf(key) { return recs()[key] || null; }
/* ступень — сколько поручений этого человека уже сдано (n.stage — объект этажа прежних версий) */
function tierOf(n) { var r = giver(n); return Math.max(r.done || 0, doneOf(n.key), n.stage || 0); }
var ARC_PROF = { "Медик": "med", "Инженер": "eng", "Техник": "eng", "Охранник": "guard", "Повар": "cook", "Кладовщик": "store" };
var ARC_TRADE = { med: "med", parts: "eng", ammo: "guard", food: "cook", all: "store" };
function arcOf(n) {
  if (n.heal) return "med";
  if (ARC_PROF[n.prof]) return ARC_PROF[n.prof];
  var pr = LAB.PROFS && LAB.PROFS[n.prof];
  return (pr && ARC_TRADE[pr.trade]) || "sci";
}
function trustWord(v, fem) { return v >= 80 ? "доверяет вам безоговорочно" : v >= 60 ? "доверяет вам" : v >= 40 ? "присматривается к вам" : v >= 20 ? (fem ? "насторожена" : "насторожен") : "вам не доверяет"; }
/* плата по доверию: от девяти десятых до одиннадцати — и не больше */
function trustK(r) { return 0.9 + 0.002 * clamp(r ? r.trust : 50, 0, 100); }
/* глава истории, если до неё дошло: вступление и пути — по прежним выборам */
function chapterOf(n, r, t) {
  var arcId = arcOf(n), arc = TX().ARCS[arcId];
  if (!arc) return null;
  var i = r.ch || 0;
  if (i >= arc.ch.length || t < ARC_TIERS[Math.min(i, ARC_TIERS.length - 1)]) return null;
  return chapterDef(arcId, i, r.path);
}
function chapterDef(arcId, i, path) {
  var arc = TX().ARCS[arcId]; if (!arc || !arc.ch[i]) return null;
  var c = arc.ch[i], v = null, k;
  if (c.v) for (var j = (path || []).length - 1; j >= 0 && !v; j--) if (path[j] && c.v[path[j]]) v = c.v[path[j]];
  if (c.v && !v) v = c.v[""] || null;
  var d = {};
  for (k in c) if (k !== "v") d[k] = c[k];
  if (v) for (k in v) d[k] = v[k];
  d.i = i; d.arc = arcId; d.arcN = arc.n; d.last = i === arc.ch.length - 1; d.n = arc.ch.length;
  return d;
}

/* ════════ ВИДЫ ШАГОВ ════════
   st — к какому пути шаг ближе; free — без этажа (принести, уничтожить);
   away — только на другом этаже; bring — вещи сдаются заказчику;
   gen(c) — собрать шаг или null, если здесь такого нет: c.L, c.F — этаж
   заказчика, c.tF — этаж цели, c.t — ступень, c.h — зерно, c.n — заказчик;
   ready, prog, does, short — сделано ли, как продвигается, что сделать,
   коротко; w — труд; nav — цель навигатора на этом этаже. */
var KINDS = {};
function K(id, d) { d.id = id; KINDS[id] = d; }
function oObj(s, test) { var fl = CUR().fl; return fl ? fl.objs.filter(test)[0] || null : null; }
function nearObj(test) {
  var fl = CUR().fl, g = G(), best = null, bd = 1e9;
  if (!fl) return null;
  fl.objs.forEach(function (o) { if (!test(o)) return; var d = Math.abs(o.x - g.x) + Math.abs(o.y - g.y); if (d < bd) { bd = d; best = o; } });
  return best;
}
function roomCell(rid) {
  var fl = CUR().fl, rm = fl && fl.rooms[rid]; if (!rm) return null;
  var cx = Math.round((rm.x0 + rm.x1) / 2), cy = Math.round((rm.y0 + rm.y1) / 2), best = null, bd = 1e9;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) {
    if (!gm().passable(x, y)) continue;
    var d = Math.abs(x - cx) + Math.abs(y - cy); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function isSec(o) { return o.type === "terminal" && o.sub === "sec"; }

/* — принести детали — */
K("fetch", { st: "trade", free: true, bring: true,
  gen: function (c) {
    var parts = LAB.PARTS.filter(function (p) { return LAB.ITEMS[p] && (LAB.PART_DEPTH[p] || 1) <= Math.max(c.L, 1) && p !== c.avoid; });
    if (!parts.length) return null;
    parts.sort(function (a, b) { return (LAB.ITEMS[a].price || 0) - (LAB.ITEMS[b].price || 0) || (a < b ? -1 : 1); });
    /* чем дальше, тем деталь реже и дороже */
    var lo = Math.min(parts.length - 1, Math.floor(c.t * parts.length / 14)), span = Math.max(1, Math.min(4, parts.length - lo));
    var p = parts[lo + c.h % span], need = c.t === 0 ? 2 + c.h % 3 : Math.min(9, 2 + Math.floor(c.t / 2) + (c.h >>> 4) % 2);
    return { type: "fetch", item: p, need: need };
  },
  ready: function (s) { return (G().inv[s.item] || 0) >= s.need; },
  prog: function (s) { return Math.min(G().inv[s.item] || 0, s.need) + " из " + s.need; },
  does: function (s) { return "принести «" + LAB.ITEMS[s.item].n + "» — " + s.need + " шт.: детали попадаются в ящиках, на телах и у роботов"; },
  short: function (s) { return "принести «" + LAB.ITEMS[s.item].n + "», " + s.need + " " + pl(s.need, "штуку", "штуки", "штук"); },
  w: function (s) { return 0.5 * s.need; },
  grow: function (s, t) { if (s.need >= Math.min(12, 4 + t)) return false; s.need++; return true; },
  take: function (s) { G().inv[s.item] = Math.max(0, (G().inv[s.item] || 0) - s.need); } });

/* — принести припасы по ремеслу заказчика — */
var SUPPLY = { med: ["medkit_s", "bandage", "antidote", "sorbent", "painkiller"], eng: ["tape", "fieldkit", "wrepair", "repairkit"], guard: ["emp", "wrepair", "tape"], cook: ["ration", "stew", "noodles", "water", "crackers"], store: ["medkit_s", "ration", "filter", "tape"], sci: ["filter", "iodine", "antidote", "reagent"] };
K("supply", { st: "trade", free: true, bring: true,
  gen: function (c) {
    var list = (SUPPLY[c.arc] || SUPPLY.store).filter(function (id) { var d = LAB.ITEMS[id]; return d && (d.depth || 1) <= Math.max(c.L, 1) && id !== c.avoid; });
    if (!list.length) return null;
    var id = list[(c.h >>> 2) % list.length], need = Math.min(5, 2 + Math.floor(c.t / 3) + (c.h >>> 5) % 2);
    return { type: "supply", item: id, need: need };
  },
  ready: function (s) { return (G().inv[s.item] || 0) >= s.need; },
  prog: function (s) { return Math.min(G().inv[s.item] || 0, s.need) + " из " + s.need; },
  does: function (s) { return "принести «" + LAB.ITEMS[s.item].n + "» — " + s.need + " шт."; },
  short: function (s) { return "принести «" + LAB.ITEMS[s.item].n + "», " + s.need + " " + pl(s.need, "штуку", "штуки", "штук"); },
  w: function (s) { return 0.7 * s.need; },
  grow: function (s, t) { if (s.need >= Math.min(6, 3 + Math.ceil(t / 2))) return false; s.need++; return true; },
  take: function (s) { G().inv[s.item] = Math.max(0, (G().inv[s.item] || 0) - s.need); } });

/* — уничтожить врагов где угодно — */
function killsOf(s) { return (G().stats.wkills || 0) - (s.wk0 || 0); }
K("kill", { st: "force", free: true,
  gen: function (c) {
    /* (3.5) в счёт — враги, за которых дают опыт: присланных ОКО, когда с них уже нечего взять, нет */
    var k = c.t === 0 ? 3 + c.h % 4 : Math.min(30, 3 + Math.floor(1.5 * c.t) + c.h % 3);
    return { type: "kill", need: k, wk0: G().stats.wkills || 0 };
  },
  ready: function (s) { return killsOf(s) >= s.need; },
  prog: function (s) { return Math.min(killsOf(s), s.need) + " из " + s.need; },
  does: function (s) { return "уничтожить " + s.need + " " + pl(s.need, "врага", "врагов", "врагов") + " где угодно; присланные ОКО на замену, когда с них уже нечего взять, не в счёт"; },
  short: function (s) { return "уничтожить врагов: " + s.need; },
  w: function (s) { return 0.9 * s.need; },
  grow: function (s, t) { if (s.need >= Math.min(40, 7 + 2 * t)) return false; s.need++; return true; } });

/* — уничтожить врагов одного рода: машин, тварей, патрульных, стражей, машин с усилениями — */
var CLS = {
  mech: { g: "машин", w: 1.2, ok: function (f) { return f.kind === "mech"; } },
  bio: { g: "тварей", w: 1.2, ok: function (f) { return f.kind === "bio"; } },
  anom: { g: "аномалий", w: 1.4, ok: function (f) { return f.kind === "anom"; } },
  patrol: { g: "патрульных", w: 1.3, ok: function (f) { return !!f.patrol; } },
  guard: { g: "стражей постов и помещений", w: 2.2, ok: function (f) { return !!f.guard; } },
  elite: { g: "машин с усилениями", w: 2.8, ok: function (f) { return !!(f.aff && f.aff.length); } }
};
function classesAt(L) {
  var lev = LAB.LEVELS[L] || {}, kinds = {}, out = [];
  (lev.foes || []).forEach(function (t) { var b = LAB.FOES[t]; if (b) kinds[b.kind] = 1; });
  ["mech", "bio", "anom"].forEach(function (k) { if (kinds[k]) out.push(k); });
  out.push("patrol", "guard");
  if (LAB.depth(L, 1) >= 15) out.push("elite"); /* машины с усилениями — со второго уровня: выше их почти нет */
  return out;
}
K("hunt", { st: "force", free: true,
  gen: function (c) {
    var list = classesAt(c.L); if (!list.length) return null;
    var cls = list[(c.h >>> 3) % list.length];
    var need = cls === "elite" ? Math.min(6, 1 + Math.floor(c.t / 4)) : cls === "guard" ? Math.min(8, 1 + Math.floor(c.t / 3)) : cls === "patrol" ? Math.min(10, 2 + Math.floor(c.t / 2)) : Math.min(18, 2 + c.t);
    return { type: "hunt", cls: cls, need: need, n: 0 };
  },
  ready: function (s) { return (s.n || 0) >= s.need; },
  prog: function (s) { return Math.min(s.n || 0, s.need) + " из " + s.need; },
  does: function (s) { return "уничтожить " + (CLS[s.cls] ? CLS[s.cls].g : "врагов") + ": " + s.need + " — где угодно; в счёт те, за кого дают опыт"; },
  short: function (s) { return "уничтожить " + (CLS[s.cls] ? CLS[s.cls].g : "врагов") + ": " + s.need; },
  w: function (s) { return (CLS[s.cls] ? CLS[s.cls].w : 1.2) * s.need; },
  grow: function (s, t) { var cap = Math.min({ elite: 8, guard: 10, patrol: 14 }[s.cls] || 25, 2 + Math.ceil(1.3 * t)); if (s.need >= cap) return false; s.need++; return true; } });

/* — расчистить помещение: враги, что в нём сидели, убиты где угодно — */
function sitDef(d) {
  var b = LAB.FOES[d.type];
  if (!b || d.boss || d.spawned || d.ally || d.beat || d.patrol) return false;
  return !["turret", "camera", "cleaner", "stationary", "mimic", "relay", "observer", "patrol"].some(function (k) { return (b.beh || []).indexOf(k) >= 0; });
}
function roomFoes(rid) {
  var C = LAB.combat; if (!C || !C.foes) return [];
  return C.foes().filter(function (f) {
    if (f.dead || f.ally || f.calm || f.boss) return false;
    if (C.isTurret && C.isTurret(f)) return false;
    var beh = (f.base && f.base.beh) || [];
    if (beh.indexOf("camera") >= 0 || beh.indexOf("stationary") >= 0) return false;
    return CUR().fl.room[idx(f.x, f.y)] === rid;
  });
}
/* (3.5) патрули и идущие по маршруту не в счёт — они там проходом */
function sitters(rid) { return roomFoes(rid).filter(function (f) { return !f.patrol && !f.route; }); }
function busyRoom(h, want) {
  var cnt = {}, fl = CUR().fl;
  fl.rooms.forEach(function (m, i) { if (m && !m.hidden && i !== fl.U) { var n = sitters(i).length; if (n) cnt[i] = n; } });
  var ids = Object.keys(cnt).map(Number);
  if (!ids.length) return null;
  var good = ids.filter(function (i) { return cnt[i] >= (want || 1); });
  if (good.length) ids = good;
  var rid = ids[h % ids.length], list = sitters(rid);
  return { id: rid, n: cnt[rid], ids: list.map(function (f) { return f.id; }), mech: list.filter(function (f) { return f.kind === "mech"; }).map(function (f) { return f.id; }), label: roomLabel(fl.rooms[rid]) };
}
/* сколько из тех, кто сидел в помещении, ещё на ногах; перепрошитые и усмирённые не в счёт */
function clearLeft(s) {
  var g = G(), on = g.L === s.tL && g.F === s.tF, fx = fst(s.tL, s.tF), all = on && LAB.combat ? LAB.combat.foes() : [], left = 0;
  (s.foeIds || []).forEach(function (id) {
    if (on) { var f = all.filter(function (x) { return x.id === id; })[0]; if (f && !f.dead && !f.ally && !f.calm) left++; return; }
    var st = fx && fx.foes && fx.foes[id];
    if (st && st.dead) return;
    if (fx && fx.robots && (s.mech || []).indexOf(id) >= 0) return; /* роботы этажа перепрошиты */
    left++;
  });
  return left;
}
K("clear", { st: "force",
  gen: function (c) {
    var want = 1 + Math.floor(c.t / 4), g = G();
    if (c.L === g.L && c.tF === g.F) {
      var b = busyRoom(c.h, want); if (!b) return null;
      return { type: "clear", room: b.id, roomName: b.label, foes: b.n, foeIds: b.ids, mech: b.mech };
    }
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF), ids = {}, mech = [];
    fl.foes.forEach(function (d) {
      if (d.room == null || d.room < 0 || !sitDef(d)) return;
      if (fx && fx.foes && fx.foes[d.id] && fx.foes[d.id].dead) return;
      var rm = fl.rooms[d.room]; if (!rm || rm.hidden || d.room === fl.U) return;
      (ids[d.room] = ids[d.room] || []).push(d.id);
      if (LAB.FOES[d.type].kind === "mech") mech.push(d.id);
    });
    var rs = Object.keys(ids).map(Number); if (!rs.length) return null;
    var good = rs.filter(function (r) { return ids[r].length >= want; }); if (good.length) rs = good;
    var rid = rs[c.h % rs.length];
    return { type: "clear", room: rid, roomName: roomLabel(fl.rooms[rid]), foes: ids[rid].length, foeIds: ids[rid].slice(), mech: mech.filter(function (id) { return ids[rid].indexOf(id) >= 0; }) };
  },
  ready: function (s) { return clearLeft(s) === 0; },
  prog: function (s) { var l = clearLeft(s); return l ? "осталось врагов: " + l + " из " + s.foeIds.length : "расчищено"; },
  does: function (s, q) { return "расчистить " + s.roomName + " " + where(s, q) + ": там засели " + (s.foes === 1 ? "машина или тварь" : "машины и твари") + "; выманить их и добить в коридоре — тоже расчистка"; },
  short: function (s, q) { return "расчистить " + s.roomName + whereS(s, q); },
  w: function (s) { return 1.6 * Math.max(1, (s.foeIds || []).length) + 1; },
  nav: function (s) { var c = roomCell(s.room); return c ? { n: s.roomName, cell: c } : null; } });

/* — дойти до этажа (засчитывается заход после того, как поручение взято) — */
function visitDone(s) { return ((G().lastVisit || {})[s.tL + "-" + s.tF] || 0) > s.seq0; }
K("visit", { st: "search", away: true,
  gen: function (c) { return { type: "visit", seq0: G().visitSeq || 0 }; },
  ready: visitDone,
  prog: function (s) { return visitDone(s) ? "этаж " + s.tF + " разведан" : "этаж " + s.tF + " ещё не разведан"; },
  does: function (s, q) { return (s.vis ? "сходить на этаж " + s.tF : "разведать этаж " + s.tF + ", где вы ещё не были") + (s.tL !== q.L ? " уровня " + s.tL : " этого уровня"); },
  short: function (s) { return "разведать этаж " + s.tF; },
  w: function (s) { return s.vis ? 2.5 : 5; } });

/* — осмотреть помещения этажа — */
K("survey", { st: "search",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), n = 0;
    fl.rooms.forEach(function (m, i) { if (m && !m.hidden && i !== fl.secret) n++; });
    var need = Math.min(10, Math.floor(n * 0.6), 3 + Math.floor(c.t / 2));
    return need >= 2 ? { type: "survey", need: need, max: Math.min(16, Math.floor(n * 0.8)), seen: [] } : null;
  },
  ready: function (s) { return (s.seen || []).length >= s.need; },
  prog: function (s) { return "осмотрено помещений: " + Math.min((s.seen || []).length, s.need) + " из " + s.need; },
  does: function (s, q) { return "осмотреть " + s.need + " " + pl(s.need, "помещение", "помещения", "помещений") + " " + where(s, q) + " — войдите внутрь, «Эхо» отметит"; },
  short: function (s, q) { return "осмотреть помещения" + whereS(s, q) + ": " + s.need; },
  w: function (s) { return 1.0 * s.need; },
  grow: function (s, t) { if (s.need >= Math.min(s.max || s.need, 4 + t)) return false; s.need++; return true; } });

/* — карта этажа в «Эхо» — */
function mapper(o) { return (o.type === "terminal" && (o.sub === "sec" || o.sub === "sci")) || o.type === "positron"; }
K("map", { st: "tech",
  gen: function (c) {
    var fx = fst(c.L, c.tF); if (fx && fx.mapped) return null;
    return fdef(c.L, c.tF).objs.some(mapper) ? { type: "map" } : null;
  },
  ready: function (s) { return !!(fst(s.tL, s.tF) || {}).mapped; },
  prog: function (s) { return KINDS.map.ready(s) ? "карта у «Эхо»" : "карты этажа " + s.tF + " ещё нет"; },
  does: function (s, q) { return "загрузить в «Эхо» карту этажа " + (s.tL === q.L && s.tF === q.F ? "— этого" : s.tF) + ": с терминала безопасности или научного, или позитронной томографией"; },
  short: function (s) { return "карта этажа " + s.tF; },
  w: function () { return 3.5; },
  nav: function () { var o = nearObj(mapper); return o ? { n: o.type === "positron" ? "позитронная установка" : "терминал с картой этажа", o: o } : null; } });

/* — исследовательские данные научного терминала — */
K("data", { st: "tech",
  gen: function (c) {
    var ids = fdef(c.L, c.tF).objs.filter(function (o) { return o.type === "terminal" && o.sub === "sci" && !(ost(c.L, c.tF, o.id) || {}).data; }).map(function (o) { return o.id; });
    return ids.length ? { type: "data", ids: ids } : null;
  },
  ready: function (s) { return (s.ids || []).some(function (id) { return !!(ost(s.tL, s.tF, id) || {}).data; }); },
  prog: function (s) { return KINDS.data.ready(s) ? "данные скачаны" : "данные ещё не скачаны"; },
  does: function (s, q) { return "скачать исследовательские данные с научного терминала " + where(s, q); },
  short: function (s, q) { return "данные научного терминала" + whereS(s, q); },
  w: function () { return 4.5; },
  nav: function (s) { var o = nearObj(function (o) { return (s.ids || []).indexOf(o.id) >= 0 && !(ost(s.tL, s.tF, o.id) || {}).data; }); return o ? { n: "научный терминал", o: o } : null; } });

/* — взломать защищённый терминал безопасности (тот же признак, что в game.js) — */
function protectedIds(L, F) {
  var key = L + "-" + F;
  return fdef(L, F).objs.filter(function (o) { return isSec(o) && L >= 2 && (LAB.hash32(o.id + key) % 3) === 0; }).map(function (o) { return o.id; });
}
K("hack", { st: "tech",
  gen: function (c) {
    if (c.L < 2) return null;
    var ids = protectedIds(c.L, c.tF).filter(function (id) { return !(ost(c.L, c.tF, id) || {}).hacked; });
    return ids.length ? { type: "hack", ids: ids } : null;
  },
  ready: function (s) { return (s.ids || []).some(function (id) { return !!(ost(s.tL, s.tF, id) || {}).hacked; }); },
  prog: function (s) { return KINDS.hack.ready(s) ? "терминал взломан" : "терминал ещё под паролем"; },
  does: function (s, q) { return "взломать защищённый терминал безопасности " + where(s, q) + " — сигналами или подбором пароля"; },
  short: function (s, q) { return "взломать терминал" + whereS(s, q); },
  w: function () { return 6; },
  nav: function (s) { var o = nearObj(function (o) { return (s.ids || []).indexOf(o.id) >= 0; }); return o ? { n: "защищённый терминал безопасности", o: o } : null; } });

/* — питание этажа: магнетронная установка — */
K("power", { st: "tech",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF);
    if (!fl.needPower || (fx && fx.power) || !fl.objs.some(function (o) { return o.type === "magnetron"; })) return null;
    return { type: "power" };
  },
  ready: function (s) { return !!(fst(s.tL, s.tF) || {}).power; },
  prog: function (s) { return KINDS.power.ready(s) ? "питание подано" : "этаж " + s.tF + " обесточен"; },
  does: function (s, q) { return "подать питание " + (s.tL === q.L && s.tF === q.F ? "на этот этаж" : "на этаж " + s.tF) + ": настроить резонатор магнетронной установки и дать ток"; },
  short: function (s) { return "питание этажа " + s.tF; },
  w: function () { return 6.5; },
  nav: function () { var o = nearObj(function (o) { return o.type === "magnetron"; }); return o ? { n: "магнетронная установка", o: o } : null; } });

/* — завал этажа: позитронная установка — */
K("rubble", { st: "tech",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF);
    if (!fl.needRubble || (fx && fx.rubble) || !fl.objs.some(function (o) { return o.type === "positron"; })) return null;
    return { type: "rubble" };
  },
  ready: function (s) { return !!(fst(s.tL, s.tF) || {}).rubble; },
  prog: function (s) { return KINDS.rubble.ready(s) ? "завал снесён" : "завал на месте"; },
  does: function (s, q) { return "снести завал " + where(s, q) + " аннигиляционным импульсом позитронной установки"; },
  short: function (s) { return "завал этажа " + s.tF; },
  w: function () { return 6.5; },
  nav: function () { var o = nearObj(function (o) { return o.type === "positron"; }); return o ? { n: "позитронная установка", o: o } : null; } });

/* — завал на лестнице (rubble.js: ключ — верхний этаж пролёта) — */
function rubKey(L, F, o) { return L + "-" + (o.type === "stairs_down" ? F : F - 1); }
function rubDone(k) { var r = G().rub && G().rub[k]; return !!(r && r.done); }
K("dig", { st: "search",
  gen: function (c) {
    var o = fdef(c.L, c.tF).objs.filter(function (o) { return (o.type === "stairs_down" || o.type === "stairs_up") && o.blocked && !rubDone(rubKey(c.L, c.tF, o)); })[0];
    return o ? { type: "dig", rk: rubKey(c.L, c.tF, o), down: o.type === "stairs_down" } : null;
  },
  ready: function (s) { return rubDone(s.rk); },
  prog: function (s) { return rubDone(s.rk) ? "пролёт расчищен" : "лестница ещё завалена"; },
  does: function (s, q) { return "разобрать завал на лестнице " + (s.down ? "вниз" : "вверх") + " " + where(s, q) + " — руками, домкратом или зарядом"; },
  short: function (s, q) { return "завал на лестнице" + whereS(s, q); },
  w: function () { return 6; },
  nav: function (s) { var o = nearObj(function (o) { return o.type === (s.down ? "stairs_down" : "stairs_up"); }); return o ? { n: "заваленная лестница", o: o } : null; } });

/* — перепрошить роботов этажа — */
K("robots", { st: "tech",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF);
    if ((fx && fx.robots) || !fl.objs.some(isSec)) return null;
    if (!fl.foes.some(function (d) { return LAB.FOES[d.type] && LAB.FOES[d.type].kind === "mech" && !d.boss; })) return null;
    return { type: "robots" };
  },
  ready: function (s) { return !!(fst(s.tL, s.tF) || {}).robots; },
  prog: function (s) { return KINDS.robots.ready(s) ? "роботы перепрошиты" : "роботы ещё служат ОКО"; },
  does: function (s, q) { return "перепрошить роботов " + where(s, q) + " с терминала безопасности: частоты и взлом"; },
  short: function (s) { return "перепрошить роботов этажа " + s.tF; },
  w: function () { return 9; },
  nav: function () { var o = nearObj(isSec); return o ? { n: "терминал безопасности", o: o } : null; } });

/* — снять блокировку дверей — */
K("lockdown", { st: "tech",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF);
    if ((fx && fx.lockdown) || !(fl.lockList || []).some(function (k) { return fl.locks[k] && fl.locks[k].type === "lockdown"; })) return null;
    return { type: "lockdown" };
  },
  ready: function (s) { return !!(fst(s.tL, s.tF) || {}).lockdown; },
  prog: function (s) { return KINDS.lockdown.ready(s) ? "блокировка снята" : "двери заблокированы"; },
  does: function (s, q) { return "снять блокировку дверей " + where(s, q) + ": протокол охраны в терминале безопасности"; },
  short: function (s) { return "блокировка дверей этажа " + s.tF; },
  w: function () { return 5; },
  nav: function () { var o = nearObj(function (o) { return isSec(o) && o.lockdown; }) || nearObj(isSec); return o ? { n: "терминал безопасности", o: o } : null; } });

/* — ослепить камеры этажа: петля, прошивка (game.js, netXp) или разбить все — */
function camDefs(fl) { return fl.foes.filter(function (d) { var b = LAB.FOES[d.type]; return b && (b.beh || []).indexOf("camera") >= 0; }).map(function (d) { return d.id; }); }
function camsDone(s) {
  var fx = fst(s.tL, s.tF); if (!fx) return false;
  if (fx.netXp && (fx.netXp.camsloop || fx.netXp.camsours)) return true;
  return (s.ids || []).length > 0 && s.ids.every(function (id) { return fx.foes && fx.foes[id] && fx.foes[id].dead; });
}
K("cams", { st: "tech",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), ids = camDefs(fl);
    if (!ids.length || !fl.objs.some(isSec)) return null;
    var s = { type: "cams", ids: ids, tL: c.L, tF: c.tF };
    return camsDone(s) ? null : s;
  },
  ready: camsDone,
  prog: function (s) { return camsDone(s) ? "камеры ослеплены" : "камеры смотрят"; },
  does: function (s, q) { return "ослепить камеры " + where(s, q) + ": закольцевать или перепрошить их с терминала безопасности — или разбить все"; },
  short: function (s) { return "камеры этажа " + s.tF; },
  w: function () { return 6; },
  nav: function () { var o = nearObj(isSec); return o ? { n: "терминал безопасности", o: o } : null; } });

/* — стенд испытаний — */
K("puzzle", { st: "search",
  gen: function (c) {
    var list = fdef(c.L, c.tF).objs.filter(function (o) { return o.type === "puzzle" && !(ost(c.L, c.tF, o.id) || {}).solved; });
    if (!list.length) return null;
    var want = Math.min(2, Math.floor(c.t / 4)), good = list.filter(function (o) { return (o.diff || 0) >= want; });
    if (good.length) list = good;
    var o = list[c.h % list.length];
    return { type: "puzzle", oid: o.id, diff: o.diff || 0 };
  },
  ready: function (s) { return !!(ost(s.tL, s.tF, s.oid) || {}).solved; },
  prog: function (s) { return KINDS.puzzle.ready(s) ? "стенд пройден" : "стенд ждёт"; },
  does: function (s, q) { return "пройти стенд испытаний " + where(s, q) + (s.diff ? " — задача " + ["простая", "средняя", "сложная"][s.diff] : ""); },
  short: function (s, q) { return "стенд испытаний" + whereS(s, q); },
  w: function (s) { return 5 + 3 * (s.diff || 0); },
  nav: function (s) { var o = oObj(s, function (o) { return o.id === s.oid; }); return o ? { n: "стенд испытаний", o: o } : null; } });

/* — сейф: код — в записках этажа — */
K("safe", { st: "search",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), list = fl.objs.filter(function (o) { return o.type === "safe" && !(ost(c.L, c.tF, o.id) || {}).open; });
    if (!list.length) return null;
    var o = list[c.h % list.length];
    return { type: "safe", oid: o.id, roomName: o.room >= 0 && fl.rooms[o.room] ? roomLabel(fl.rooms[o.room]) : "" };
  },
  ready: function (s) { return !!(ost(s.tL, s.tF, s.oid) || {}).open; },
  prog: function (s) { return KINDS.safe.ready(s) ? "сейф вскрыт" : "сейф заперт"; },
  does: function (s, q) { return "вскрыть сейф" + (s.roomName ? " в " + inRoom(s.roomName) : "") + " " + where(s, q) + " — код ищите в записках"; },
  short: function (s, q) { return "сейф" + whereS(s, q); },
  w: function () { return 7; },
  nav: function (s) { var o = oObj(s, function (o) { return o.id === s.oid; }); return o ? { n: "сейф", o: o } : null; } });

/* — тайный проход — */
K("secret", { st: "search",
  gen: function (c) {
    var fl = fdef(c.L, c.tF), fx = fst(c.L, c.tF);
    var ids = fl.doors.filter(function (d) { return d.lock && d.lock.type === "secret" && !(fx && fx.secrets && fx.secrets[d.id]); }).map(function (d) { return d.id; });
    return ids.length ? { type: "secret", ids: ids } : null;
  },
  ready: function (s) { var fx = fst(s.tL, s.tF); return !!(fx && fx.secrets) && (s.ids || []).some(function (id) { return !!fx.secrets[id]; }); },
  prog: function (s) { return KINDS.secret.ready(s) ? "тайный ход найден" : "тайный ход не найден"; },
  does: function (s, q) { return "найти тайный проход " + where(s, q) + ": простукивайте стены, слушайте сквозняк, читайте заявки на ремонт в терминалах"; },
  short: function (s, q) { return "тайный ход" + whereS(s, q); },
  w: function () { return 7; } });

/* — образец «Колыбели» — */
K("sample", { st: "search",
  gen: function (c) {
    var fx = fst(c.L, c.tF);
    var it = fdef(c.L, c.tF).items.filter(function (it) { return it.kind === "sample" && !G().samples[it.sid] && !(fx && fx.taken && fx.taken[it.id]); })[0];
    return it ? { type: "sample", sid: it.sid } : null;
  },
  ready: function (s) { return !!G().samples[s.sid]; },
  prog: function (s) { return G().samples[s.sid] ? "образец у вас" : "образец не найден"; },
  does: function (s, q) { return "добыть образец «Колыбели» " + where(s, q) + " — его прячут в тайной или особой комнате"; },
  short: function (s, q) { return "образец «Колыбели»" + whereS(s, q); },
  w: function () { return 9; } });

/* — тело коллеги: принести жетон — */
function bodyOn(L, F, h) {
  var fl = fdef(L, F); if (!fl || !LAB.agen || !LAB.agen.corpse) return null;
  var fsx = fst(L, F), list = fl.objs.filter(function (o) {
    var st = fsx && fsx.objs && fsx.objs[o.id];
    /* (3.5) тело, которое уже ищут по другому поручению, второму заказчику не достаётся */
    return o.type === "corpse" && !wantedBody(L, F, o.id) && !(st && st.badge) && fl.rooms[o.room] && !fl.rooms[o.room].hidden;
  });
  if (!list.length) return null;
  var o = list[h % list.length], id = LAB.agen.corpse(G().seed, L, F, o);
  return { o: o, who: id.p.fio, sign: id.p.sign, post: id.post, f: !!id.p.f, room: roomLabel(fl.rooms[o.room]) };
}
function wantedBody(L, F, oid) { return allSteps().some(function (x) { return x.s.type === "body" && !x.q.done && x.s.tL === L && x.s.tF === F && x.s.oid === oid; }); }
function badgeTaken(s) {
  if ((G().badges || []).some(function (b) { return b.o === s.oid && b.L === s.tL && b.F === s.tF; })) return true;
  var st = ost(s.tL, s.tF, s.oid);
  return !!(st && st.badge);
}
K("body", { st: "search", bring: true,
  gen: function (c) {
    var b = bodyOn(c.L, c.tF, c.h); if (!b) return null;
    return { type: "body", who: b.who, sign: b.sign, oid: b.o.id, bf: b.f, post: b.post, roomName: b.room };
  },
  ready: function (s) { return badgeTaken(s) && (G().inv.badge || 0) > 0; },
  prog: function (s) { return KINDS.body.ready(s) ? "жетон у вас" : "тело ещё не найдено"; },
  does: function (s, q) { return "найти тело: " + (s.post ? s.post + " " : "") + s.who + ", " + s.roomName + " " + where(s, q) + " — и принести жетон"; },
  short: function (s, q) { return "жетон " + (s.bf ? "погибшей" : "погибшего") + " — " + s.sign + whereS(s, q); },
  w: function (s, q) { return s.tF === q.F && s.tL === q.L ? 4 : 5.5; },
  take: function () { G().inv.badge = Math.max(0, (G().inv.badge || 0) - 1); },
  nav: function (s) { var o = oObj(s, function (o) { return o.id === s.oid; }); return o ? { n: "тело — " + s.who, o: o } : null; } });

/* — забрать оставленную вещь — */
var KEEPSAKE = ["фотоальбом в синей обложке", "рабочий журнал с закладкой", "шкатулку с письмами", "связку ключей от дома", "детский рисунок в рамке", "старые наручные часы", "термос с вмятиной", "тетрадь со стихами", "губную гармошку", "вязаный шарф"];
/* помещение для вещи: обычное, не тайное, не у прибытия и лестниц; (3.5) и не то, где стоит сам заказчик */
function keepRoom(L, F, h, avoid) {
  var fl = fdef(L, F); if (!fl) return null;
  var list = [];
  fl.rooms.forEach(function (m, i) {
    if (!m || m.hidden || m.rad || m.gas || i === fl.U || i === fl.D || i === fl.E || i === fl.secret || i === avoid) return;
    var def = LAB.ROOMS[m.type] || {};
    if (def.special || (def.kind && def.kind !== "locked")) return;
    list.push(i);
  });
  if (!list.length) return null;
  var rid = list[h % list.length];
  return { id: rid, label: roomLabel(fl.rooms[rid]) };
}
K("keep", { st: "search",
  gen: function (c) {
    var kr = keepRoom(c.L, c.tF, c.h, c.tF === c.F ? c.n.room : -1); if (!kr) return null;
    return { type: "keep", room: kr.id, roomName: kr.label, what: KEEPSAKE[(c.h >>> 3) % KEEPSAKE.length], got: false };
  },
  ready: function (s) { return !!s.got; },
  prog: function (s) { return s.got ? "вещь у вас" : "вещь ещё не найдена"; },
  does: function (s, q) { return "забрать " + s.what + " — " + s.roomName + " " + where(s, q) + "; загляните туда — «Эхо» услышит, где лежит"; },
  short: function (s, q) { return "забрать " + s.what + whereS(s, q); },
  w: function (s, q) { return s.tF === q.F && s.tL === q.L ? 4 : 5.5; },
  nav: function (s) { var c = roomCell(s.room); return c ? { n: s.roomName, cell: c } : null; } });

/* — посылка выжившему на другом этаже; со ступени шестой — и ответ назад — */
function survivorOn(L, F, h, notKey) {
  var list = fdef(L, F).npcs.filter(function (m) { return !m.robot && m.key && m.key !== notKey; });
  return list.length ? list[h % list.length] : null;
}
K("deliver", { st: "trade", away: true,
  gen: function (c) {
    var m = survivorOn(c.L, c.tF, c.h, c.n.key); if (!m) return null;
    return { type: "deliver", to: m.key, toName: m.n, toF: !!m.female, toProf: (m.prof || "").toLowerCase(), toPr: m.prof || "", given: false, reply: c.t >= 5 };
  },
  ready: function (s) { return !!s.given; },
  prog: function (s) { return s.given ? (s.reply ? "ответ у вас" : "посылка передана") : "посылка у вас"; },
  does: function (s, q) { return "передать посылку: " + s.toName + (s.toProf ? ", " + s.toProf : "") + ", " + where(s, q) + (s.reply ? " — и принести ответ" : ""); },
  short: function (s, q) { return "посылка — " + s.toName + whereS(s, q); },
  w: function (s) { return 4.5 + (s.reply ? 2 : 0); },
  nav: function (s) { var m = CUR().fl.npcs.filter(function (x) { return x.key === s.to; })[0]; return m ? { n: m.n, o: m } : null; } });

/* — помощь раненому: отнести лекарство или еду, отдать из своего — */
var AID = { med: ["medkit_s", "antidote", "bandage"], cook: ["ration", "stew"], any: ["medkit_s", "bandage"] };
K("aid", { st: "trade", away: true,
  gen: function (c) {
    var m = survivorOn(c.L, c.tF, c.h >>> 1, c.n.key); if (!m) return null;
    var list = (AID[c.arc] || AID.any).filter(function (id) { var d = LAB.ITEMS[id]; return d && (d.depth || 1) <= Math.max(c.L, 1); });
    if (!list.length) return null;
    return { type: "aid", to: m.key, toName: m.n, toF: !!m.female, item: list[c.h % list.length], given: false };
  },
  ready: function (s) { return !!s.given; },
  prog: function (s) { return s.given ? "помощь оказана" : "«" + LAB.ITEMS[s.item].n + "» ещё не отдан" + (LAB.ITEMS[s.item].n.slice(-1) === "а" ? "а" : ""); },
  does: function (s, q) { return "отнести «" + LAB.ITEMS[s.item].n + "»: " + s.toName + " " + where(s, q) + " " + (s.toF ? "ранена" : "ранен") + " и ждёт помощи; отдайте из своих запасов"; },
  short: function (s, q) { return "помощь — " + s.toName + whereS(s, q); },
  w: function (s) { return 4 + (LAB.ITEMS[s.item].price || 20) / 40; },
  nav: function (s) { var m = CUR().fl.npcs.filter(function (x) { return x.key === s.to; })[0]; return m ? { n: m.n + " — " + (s.toF ? "раненая" : "раненый"), o: m } : null; } });

/* — страж уровня, на последнем этаже — */
K("boss", { st: "force", late: true,
  gen: function (c) {
    if (c.t < 6) return null;
    var FN = LAB.FLOORS_N, fl = fdef(c.L, FN), d = fl.foes.filter(function (x) { return x.boss; })[0];
    if (!d) return null;
    var fx = fst(c.L, FN);
    if (fx && fx.foes && fx.foes[d.id] && fx.foes[d.id].dead) return null;
    return { type: "boss", tL: c.L, tF: FN, fid: d.id, bn: LAB.BOSSES[d.boss] ? LAB.BOSSES[d.boss].n : "страж уровня" };
  },
  ready: function (s) { var fx = fst(s.tL, s.tF); return !!(fx && fx.foes && fx.foes[s.fid] && fx.foes[s.fid].dead); },
  prog: function (s) { return KINDS.boss.ready(s) ? "страж повержен" : "страж на посту"; },
  does: function (s) { return "одолеть стража уровня — " + s.bn + " — на этаже " + s.tF; },
  short: function (s) { return "страж уровня — " + s.bn; },
  w: function () { return 25; } });

/* — весточка и доклад с нижнего уровня (3.5): только целым поручением — */
K("courier", { st: "trade", legacy: true,
  ready: function () { return false; },
  prog: function (q) { return G().L > q.L ? "передайте любому выжившему здесь" : "выжившие — уровнем ниже"; },
  does: function () { return "передать весточку выжившим уровнем ниже"; },
  short: function () { return "передать весточку выжившим уровнем ниже"; },
  w: function () { return 12; } });
K("deep", { st: "search", legacy: true,
  ready: function (s) { return ((G().lastVisit || {})[s.tL + "-" + s.tF] || 0) > s.seq0; },
  prog: function (s) { return KINDS.deep.ready(s) ? "доклад передан" : "этаж " + s.tF + " уровня " + s.tL + " ещё не разведан"; },
  does: function (s) { return "дойти до этажа " + s.tF + " уровня " + s.tL; },
  short: function (s) { return "дойти до этажа " + s.tF + " уровня " + s.tL; },
  w: function () { return 14; } });

/* ════════ ПОРУЧЕНИЕ: ШАГИ ════════ */
function steps(q) { return q.steps && q.steps.length ? q.steps : [q]; }
function allSteps() {
  var out = [];
  G().quests.forEach(function (q) { if (q.type === "main") return; steps(q).forEach(function (s) { out.push({ q: q, s: s }); }); });
  return out;
}
function stepReady(s, q) {
  if (s.ok) return true;
  var Kd = KINDS[s.type];
  var r = !!(Kd && Kd.ready && Kd.ready(s, q));
  /* сделанное в мире не отменить: шаг запоминается; вещи для заказчика — только пока они у вас */
  if (r && Kd && !Kd.bring && q.steps) s.ok = true;
  return r;
}
function ready(q) { return steps(q).every(function (s) { return stepReady(s, q); }); }
function curStep(q) { var ss = steps(q); for (var i = 0; i < ss.length; i++) if (!stepReady(ss[i], q)) return i; return -1; }
function sDoes(s, q) { var Kd = KINDS[s.type]; return Kd && Kd.does ? Kd.does(s, q) : ""; }
function sShort(s, q) { var Kd = KINDS[s.type]; return Kd && Kd.short ? Kd.short(s, q) : s.type; }
function sProg(s, q) { var Kd = KINDS[s.type]; return Kd && Kd.prog ? Kd.prog(s, q) : ""; }
function progress(q) {
  var ss = steps(q);
  if (q.type === "courier") return KINDS.courier.prog(q);
  if (ss.length === 1) { var s = ss[0], p = sProg(s, q); return stepReady(s, q) && !q.remote ? p + ", вернитесь за наградой" : p; }
  var i = curStep(q);
  if (i < 0) return "всё сделано, вернитесь за наградой";
  return "шаг " + (i + 1) + " из " + ss.length + ": " + sShort(ss[i], q) + " — " + sProg(ss[i], q);
}

/* ════════ ПЛАТА ════════ */
function travelW(s, q) { if (s.tF == null) return 0; return 0.45 * Math.abs(s.tF - q.F) + (s.tL !== q.L ? 6 : 0) + (s.vis ? 0.8 : 2.5); }
function stepW(s, q) { var Kd = KINDS[s.type]; return (Kd && Kd.w ? Kd.w(s, q) : 3) + travelW(s, q); }
function workOf(q) { var w = 0; steps(q).forEach(function (s) { w += stepW(s, q); }); return w; }
/* вещи для заказчика: дороже скупки, но не дороже семи десятых покупки — купить и сдать невыгодно */
function goodsCr(s, q, k) {
  var d = LAB.ITEMS[s.item]; if (!d) return 0;
  var trade = q.trade || "all", sell = 0;
  try { sell = LAB.sellPrice ? LAB.sellPrice.item(s.item, { who: "npc", npc: trade, robot: false }) : Math.round(d.price * 0.4); } catch (e) { sell = Math.round((d.price || 10) * 0.4); }
  var buy = Math.max(2, Math.round((d.price || 10) * (gm().priceK ? gm().priceK() : 1)));
  var cr = sell * s.need + LAB.credits(8 * stepW(s, q) * k, q.L, q.F);
  return Math.max(sell * s.need, Math.min(cr, Math.floor(buy * 0.7) * s.need));
}
var GIFTS = {
  med: ["medkit_s", "bandage", "antidote", "sorbent", "painkiller", "medkit_l"],
  ammo: ["@ammo", "@ammo", "emp", "wrepair"],
  parts: ["@part", "@part", "fieldkit", "tape"],
  food: ["ration", "stew", "protein", "noodles"],
  all: ["medkit_s", "ration", "@ammo", "repairkit", "filter", "@part"],
  sci: ["filter", "antidote", "neuroblock", "lockpick", "sonar", "iodine"]
};
/* Ценность вещи — по ступени (в базовых ценах, глубина её не меняет). Дорогое, что не по
   ступени, заказчик не отдаёт — даёт следующее из своего; заряды к вашему оружию — всегда.
   Деталь, которую просили принести, обратно в подарок не отдают. */
var GIFT_VAL = [30, 50, 80, 120, 170, 240];
function questGift(n, h, stage, avoid) {
  var pr = (n && LAB.PROFS[n.prof]) || {}, list = GIFTS[(n && n.heal) ? "med" : (pr.trade || "sci")] || GIFTS.all;
  var g = G(), val = GIFT_VAL[clamp(stage, 0, GIFT_VAL.length - 1)], start = (h >>> 7) % list.length, d = null, id = null;
  for (var i = 0; i < list.length && !d; i++) {
    var pick = list[(start + i) % list.length];
    if (pick === "@ammo") {
      var w = gm().curWeapon(), am = w && w.ammo && LAB.AMMO[w.ammo] ? w.ammo : "energy";
      return { kind: "ammo", ammo: am, n: Math.max(1, Math.min(6, Math.round(val / (LAB.AMMO[am].price || 30)))) };
    }
    if (pick === "@part") {
      var parts = LAB.PARTS.filter(function (p) { return (LAB.PART_DEPTH[p] || 1) <= Math.max(g.L, 1) && p !== avoid; });
      pick = parts[(h >>> 11) % parts.length];
    }
    var dd = LAB.ITEMS[pick];
    if (dd && pick !== avoid && (dd.depth || 1) <= Math.max(g.L, 1) && (dd.price || 20) <= val * 1.75) { id = pick; d = dd; }
  }
  if (!d) { id = "medkit_s"; d = LAB.ITEMS[id]; }
  return { kind: "item", item: id, n: Math.max(1, Math.min(6, Math.round(val / (d.price || 20)))) };
}
function giftName(it) { return gm().itemName(it).replace(/\.$/, "").replace(/^[А-ЯЁ](?=[а-яё])/, function (c) { return c.toLowerCase(); }); }
/* (3.5) награда прежних поручений и весточки — по виду (её платит получатель) */
var REW = { fetch: [12, 12], kill: [12, 8], visit: [40, 28], clear: [24, 16], body: [40, 28], keep: [34, 22], courier: [55, 36], deep: [70, 42] };
function legacyReward(q, n, h, L, F) {
  var b = REW[q.type] || [30, 30], cr = b[0], xp = b[1], st = q.stage || 0;
  var r = { cr: LAB.credits(cr * (1 + 0.15 * st), L, F), xp: Math.round(xp * (1 + 0.4 * L) * (1 + 0.1 * st)) };
  if (q.type !== "deep") r.gift = questGift(n, h, Math.min(st, 2), q.item);
  return r;
}
function rewardOf(q, n, h) {
  /* за единицу труда плата почти не растёт: долгая история с заказчиком — не больше пятой части сверху */
  var t = q.tier || 0, r = recOf(q.giver), tk = 1 + 0.01 * Math.min(20, t), k = tk * trustK(r), cr = 0, xp = 0, avoid = null;
  steps(q).forEach(function (s) {
    var Kd = KINDS[s.type], w = stepW(s, q);
    xp += 5 * w;
    if (Kd && Kd.bring && s.item) { cr += goodsCr(s, q, k); avoid = s.item; }
    else cr += LAB.credits(8 * w * k, q.L, q.F);
    /* помощь раненому — из ваших запасов: отданное возмещается по цене покупки */
    if (s.type === "aid" && LAB.ITEMS[s.item]) cr += Math.round((LAB.ITEMS[s.item].price || 20) * (gm().priceK ? gm().priceK() : 1));
  });
  var out = { cr: Math.round(cr), xp: Math.round(xp * (1 + 0.4 * q.L) * tk) };
  if (!q.remote) out.gift = questGift(n, h, Math.floor(t / 3) + (q.chap ? 1 : 0), avoid);
  return out;
}
function condK(q) { var k = 1; (q.cond || []).forEach(function (c) { if (!c.lost) k += 0.25; }); return k; }
function rewardText(q) {
  var r = q.reward || {};
  if (q.type === "courier" && !q.done) return "Награду дадут те, кому передадите весточку.";
  var t = "Награда — " + r.cr + " " + pl(r.cr, "кредит", "кредита", "кредитов") + (r.gift ? " и " + giftName(r.gift) : "") + (q.remote ? ", переводом на браслет." : ".");
  var c = condText(q);
  return c ? t + " " + c : t;
}

/* ════════ УСЛОВИЯ И СРОКИ ════════ */
function clockAt(abs) {
  var g = G(), d = Math.floor(abs / 1440) - (g.day || 0), m = ((abs % 1440) + 1440) % 1440, hh = Math.floor(m / 60), mm = Math.floor(m % 60);
  var t = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  return d <= 0 ? t : d === 1 ? "завтра, " + t : "через " + d + " " + pl(d, "сутки", "суток", "суток") + ", " + t;
}
var COND_N = { quiet: "тихо: ОКО не поднимает тревогу на этажах поручения", fast: "быстро", clean: "без крови: никого не убивать" };
function condText(q) {
  var cs = (q.cond || []).filter(function (c) { return !c.lost; });
  var t = cs.length ? "Премия по четверти — " + cs.map(function (c) { return c.k === "fast" ? "быстро: до " + clockAt(c.until) + " по часам «Эхо»" : COND_N[c.k]; }).join("; ") + "." : "";
  if (q.urgent && !q.done) t += (t ? " " : "") + "Срочно: успеть до " + clockAt(q.urgent) + " по часам «Эхо» — иначе будет поздно.";
  return t;
}
function questFloors(q) {
  var out = {}; out[q.L + "-" + q.F] = 1;
  steps(q).forEach(function (s) { if (s.tF != null) out[(s.tL || q.L) + "-" + s.tF] = 1; });
  return out;
}

/* ════════ СБОРКА ПОРУЧЕНИЯ ════════ */
var STYLE = {
  force: ["hunt", "clear", "kill", "boss"],
  tech: ["power", "data", "hack", "map", "robots", "cams", "rubble", "lockdown"],
  search: ["body", "keep", "safe", "secret", "sample", "survey", "puzzle", "visit", "dig"],
  trade: ["deliver", "aid", "fetch", "supply"]
};
var STYLE_N = { force: "силой", tech: "через сеть и установки", search: "поисками", trade: "руками и вещами" };
var ARC_LIKE = {
  med: ["supply", "aid", "body", "sample", "deliver", "data"], eng: ["power", "rubble", "fetch", "map", "robots", "dig"],
  guard: ["clear", "hunt", "cams", "hack", "lockdown", "kill"], cook: ["supply", "fetch", "deliver", "survey", "keep", "aid"],
  store: ["keep", "safe", "fetch", "survey", "deliver", "secret"], sci: ["data", "map", "hack", "sample", "puzzle", "secret"]
};
var ARC_STYLE = { med: "trade", eng: "tech", guard: "force", cook: "trade", store: "search", sci: "tech" };
var TIER0 = ["clear", "body", "keep", "fetch", "survey", "supply"];
var TIER1 = ["visit", "body", "keep", "kill", "survey", "map", "data", "deliver"];
function stepsFor(t) { return t <= 1 ? 1 : t <= 4 ? 2 : t <= 9 ? 3 : t <= 16 ? 4 : 5; }
function scopesFor(t, n) {
  if (t === 0) return ["here"];
  if (t === 1) return ["near"];
  var s = [t <= 3 ? "here" : "near"];
  for (var i = 1; i < n; i++) s.push(i >= 3 ? "any" : t <= 3 ? "near" : "far");
  return s;
}
/* этажи для цели: здесь; рядом — на один-три этажа; дальше — на четыре и больше, тем дальше,
   чем выше ступень; где угодно — сначала непосещённые. Занятые другими шагами — в конце. */
function floorCands(scope, c, used) {
  var F = c.F, N = LAB.FLOORS_N, out = [], d;
  if (scope === "here") return [F];
  var lo = scope === "far" ? 4 : 1, hi = scope === "near" ? 3 : scope === "far" ? 4 + Math.min(12, c.t) : N;
  for (d = lo; d <= hi; d++) { if (F + d <= N) out.push(F + d); if (F - d >= 1) out.push(F - d); }
  if (!out.length) for (d = 1; d <= N; d++) { if (F + d <= N) out.push(F + d); if (F - d >= 1) out.push(F - d); }
  var hh = c.h;
  out.sort(function (a, b) {
    return (used[a] ? 1 : 0) - (used[b] ? 1 : 0) || (scope === "any" ? (vis(c.L, a) ? 1 : 0) - (vis(c.L, b) ? 1 : 0) : 0) || h32(hh + ":" + a) - h32(hh + ":" + b);
  });
  return out.slice(0, 4);
}
function tryKind(kind, c, scope, used) {
  var Kd = KINDS[kind];
  if (!Kd || !Kd.gen || Kd.legacy) return null;
  var s = null;
  if (Kd.free) {
    try { s = Kd.gen(c); } catch (e) { console.warn(e); s = null; }
    if (s) s.type = kind;
    return s;
  }
  if (kind === "boss") {
    try { s = Kd.gen(c); } catch (e2) { console.warn(e2); s = null; }
    if (s) { s.type = kind; s.vis = vis(s.tL, s.tF); }
    return s;
  }
  var cands = floorCands(scope, c, used);
  for (var i = 0; i < cands.length && !s; i++) {
    if (Kd.away && cands[i] === c.F) continue;
    var cc = Object.assign({}, c, { tF: cands[i] });
    try { s = Kd.gen(cc); } catch (e3) { console.warn(e3); s = null; }
    if (s) { s.type = kind; if (s.tL == null) s.tL = c.L; if (s.tF == null) s.tF = cands[i]; s.vis = vis(s.tL, s.tF); }
  }
  return s;
}
function poolFor(i, t, style, arc, kinds, h) {
  var base;
  if (t === 0) base = rot(TIER0, h);
  else if (t === 1) base = rot(TIER1, h);
  else {
    var pref = (kinds || []).slice(i).concat((kinds || []).slice(0, i));
    base = i === 0 ? pref.concat(rot(STYLE[style] || [], h), rot(ARC_LIKE[arc] || [], h >>> 3))
      : pref.concat(rot(ARC_LIKE[arc] || [], h >>> (i + 2)), rot(STYLE[style] || [], h >>> (i + 5)), rot(Object.keys(KINDS), h >>> (i + 7)));
  }
  var seen = {}, out = [];
  base.forEach(function (k) { if (!seen[k] && KINDS[k] && !KINDS[k].legacy) { seen[k] = 1; out.push(k); } });
  return out;
}
/* Сколько труда — не меньше, чем положено ступени: каждая следующая просьба тяжелее прежней. */
function minW(t) { return t <= 0 ? 2 : 0.8 * (4 + 3.5 * t); }
/* Одно предложение: ступень t, путь style, глава chap (или null), зерно h. */
function build(n, t, h, style, chap, path) {
  var g = G(), r = giver(n), arc = arcOf(n);
  var pr = (LAB.PROFS[n.prof] || {});
  var q = { v: 2, id: n.key + ":" + t + (r.seq ? ":" + r.seq : "") + (path === "b" ? "b" : ""), giver: n.key, giverName: n.n, gf: !!n.female, L: g.L, F: g.F, done: false, stage: t, tier: t, arc: arc, trade: n.heal ? "med" : (pr.trade || "all") };
  if (chap) q.chap = { arc: chap.arc, i: chap.i };
  var nS = stepsFor(t), scopes = scopesFor(t, nS), used = {}, kinds = {}, free = 0, out = [], recent = r.last || [];
  var kinds0 = path && chap ? ((chap[path] || {}).kinds || []) : [];
  var add = function (i, scope, total) {
    var pool = poolFor(i, t, style, arc, kinds0, h >>> (i * 2)), s = null, pass, k;
    for (pass = 0; pass < 2 && !s; pass++) {
      for (k = 0; k < pool.length && !s; k++) {
        var kind = pool[k], Kd = KINDS[kind];
        if (kinds[kind]) continue;
        if (Kd.free && free >= (total > 1 ? 1 : 9)) continue;
        if (Kd.late && i < 2) continue;
        if (pass === 0 && t >= 2 && recent.indexOf(kind) >= 0) continue; /* то, что просили в прошлый раз, — во вторую очередь */
        s = tryKind(kind, { n: n, t: t, h: h32(h + ":" + i + ":" + kind), L: g.L, F: g.F, arc: arc }, scope, used);
      }
    }
    /* запасное — выполнимо всегда */
    if (!s && !kinds.kill && !free) s = tryKind("kill", { n: n, t: t, h: h32(h + ":k" + i), L: g.L, F: g.F, arc: arc }, scope, used);
    if (!s && !kinds.visit) s = tryKind("visit", { n: n, t: t, h: h32(h + ":z" + i), L: g.L, F: g.F, arc: arc }, scope === "here" ? "near" : scope, used);
    if (!s) return null;
    if (KINDS[s.type].free) free++;
    kinds[s.type] = 1; if (s.tF != null) used[s.tF] = 1;
    out.push(s);
    return s;
  };
  for (var i = 0; i < nS; i++) add(i, scopes[i], nS);
  if (!out.length) return null;
  /* труд — не меньше положенного ступени: сначала растут числа (враги, детали, помещения),
     не хватит — ещё шаг, дальше от заказчика */
  var target = minW(t), tmp = { L: g.L, F: g.F, steps: out }, guard = 0;
  while (workOf(tmp) < target && guard++ < 400) {
    var grown = false;
    for (var j = 0; j < out.length && workOf(tmp) < target; j++) { var Kg = KINDS[out[j].type]; if (Kg.grow && Kg.grow(out[j], t)) grown = true; }
    if (!grown) break;
  }
  while (t >= 2 && workOf(tmp) < target && out.length < 6) if (!add(out.length, out.length >= 3 ? "any" : "far", out.length + 1)) break;
  if (out.length === 1 && !chap) { for (var key in out[0]) q[key] = out[0][key]; }
  else q.steps = out;
  /* условия премии: с четвёртой просьбы — одно, с восьмой — два */
  var force = out.some(function (s) { return KINDS[s.type].st === "force"; });
  if (t >= 3) {
    var cands = rot(["quiet", "fast"].concat(force ? [] : ["clean"]), h >>> 9);
    q.cond = cands.slice(0, t >= 7 ? 2 : 1).map(function (k2) { return { k: k2, lost: false }; });
  }
  /* срочная помощь раненому — с настоящим сроком */
  if (t >= 3 && out.some(function (s) { return s.type === "aid"; }) && (h >>> 13) % 2 === 0) q.urgentW = 1;
  /* развилка обычного поручения: вещь с секретом */
  if (!chap && t >= 2 && out.some(function (s) { return s.type === "keep"; }) && (h >>> 15) % 3 === 0) q.pick = { chip: LAB.credits(20 + 6 * Math.min(t, 20), g.L, g.F) };
  return q;
}
/* Тексты и награда — когда поручение собрано. */
function finishBuild(q, n, h, chap, path, intro0) {
  var ss = steps(q), fem = !!n.female, t = q.tier;
  var intro;
  if (intro0) intro = intro0;
  else if (chap) intro = gx(chap.intro, fem);
  else if (t <= 1) intro = simpleIntro(q, n);
  else {
    var r = giver(n), arc = TX().ARCS[q.arc], pool = (r.ch >= (arc ? arc.ch.length : 4) && (t - 11) % 3 === 0 ? TX().TROUBLE[q.arc] : null) || TX().OPEN[q.arc] || TX().OPEN.sci;
    intro = gx(pool[(h >>> 4) % pool.length], fem);
  }
  q.intro = intro;
  var body;
  if (ss.length === 1) body = cap1(sDoes(ss[0], q)) + ".";
  else body = "Шаги: " + ss.map(function (s, i) { return (i + 1) + ") " + sDoes(s, q); }).join("; ") + ". Потом — обратно, за наградой.";
  q.text = (t <= 1 && !chap ? simpleText(q, n) : q.giverName + ": «" + intro + "» " + body);
  q.short = chap ? "«" + chap.t + "»" + (ss.length > 1 ? ", шагов: " + ss.length : "") : sShort(ss[0], q) + (ss.length > 1 ? " и ещё " + (ss.length - 1) + " " + pl(ss.length - 1, "дело", "дела", "дел") : "");
  if (chap) q.title = chap.t;
  if (path && chap && chap[path]) q.way = chap[path].l;
  else if (q.style) q.way = STYLE_N[q.style];
  /* срок условия «быстро» и срочной помощи — от труда */
  var W = workOf(q), now = nowMin();
  (q.cond || []).forEach(function (c) { if (c.k === "fast") c.until = now + Math.round(90 + 55 * W); if (c.k === "clean") c.k0 = G().stats.kills || 0; });
  if (q.urgentW) { var aidS = ss.filter(function (s) { return s.type === "aid"; })[0]; q.urgent = now + Math.round(240 + 80 * stepW(aidS, q)); delete q.urgentW; }
  q.reward = rewardOf(q, n, h);
  if (q.chap && q.reward.gift) q.reward.gift.n = Math.max(q.reward.gift.n, 2);
  q.t0 = now;
  return q;
}
/* Первые две просьбы — простые, прямой речью (как прежде). */
function simpleIntro(q, n) { return ""; }
function simpleText(q, n) {
  var s = steps(q)[0], fem = !!n.female, who = n.n, arc = q.arc, why = (TX().WHY[s.type] || {})[arc] || "";
  switch (s.type) {
    case "fetch": return who + " просит принести " + s.need + " шт.: «" + LAB.ITEMS[s.item].n + "». " + (why ? why + " " : "") + "Детали попадаются в ящиках, на телах и у роботов.";
    case "supply": return who + ": «Принесите «" + LAB.ITEMS[s.item].n + "» — " + s.need + " шт. Без них я как без рук».";
    case "kill": return who + " просит расчистить путь: уничтожить " + s.need + " " + pl(s.need, "врага", "врагов", "врагов") + ", где угодно; присланные ОКО на замену, когда с них уже нечего взять, не в счёт." + (why ? " " + why : "");
    case "visit": return who + " просит сходить на этаж " + s.tF + " этого уровня и вернуться с докладом. " + (why ? why + " " : "") + "Вернуться можно по лестницам или на лифте этажей; после шлюза вниз — уже нельзя.";
    case "clear": return who + ": «В " + inRoom(s.roomName) + (s.tF === q.F ? " на этом этаже" : " на этаже " + s.tF) + " засели " + (s.foes === 1 ? "машина или тварь" : "машины и твари") + " — оттуда не пройти. Расчистите его и возвращайтесь».";
    case "body": return who + ": «" + (s.bf ? "Моя коллега" : "Мой коллега") + ", " + s.post + " " + s.who + ", не " + (s.bf ? "вернулась" : "вернулся") + (s.tF === q.F ? ". " + (s.bf ? "Её" : "Его") + " видели здесь, на этом этаже" : ". " + (s.bf ? "Её" : "Его") + " видели на этаже " + s.tF) + ", — " + s.roomName + ". Если " + (s.bf ? "её" : "его") + " больше нет, принесите жетон — передадим имя наверх».";
    case "keep": return who + ": «Когда всё началось, я " + (fem ? "оставила" : "оставил") + " " + s.what + " — " + s.roomName + (s.tF === q.F ? " на этом этаже" : ", этаж " + s.tF) + ". Загляните туда — «Эхо» услышит, где лежит, — и принесите мне».";
    case "survey": return who + ": «Не знаю, что творится " + (s.tF === q.F ? "на нашем этаже" : "на этаже " + s.tF) + ". Осмотрите " + s.need + " " + pl(s.need, "помещение", "помещения", "помещений") + " — заходите внутрь, «Эхо» отметит — и расскажите мне».";
    case "map": return who + ": «Без карты здесь как без глаз. Загрузите в «Эхо» карту этажа " + s.tF + " — с терминала безопасности или научного, — и мне будет по чему вести людей».";
    case "data": return who + ": «На этаже " + s.tF + " стоит научный терминал. Скачайте его исследовательские данные — я хочу знать, что там изучали».";
    case "deliver": return who + ": «На этаже " + s.tF + " живёт " + s.toName + (s.toProf ? ", " + s.toProf : "") + ". Передайте посылку — " + (s.toF ? "она" : "он") + " ждёт».";
  }
  return who + ": «" + cap1(sDoes(s, q)) + "».";
}
/* Предложения заказчика: одно на первых двух ступенях, с третьей — два пути. */
function offers(n) {
  var r = giver(n), t = tierOf(n), h = h32(n.key + ":" + t + ":" + (r.seq || 0)), arc = arcOf(n), chap = t >= 2 ? chapterOf(n, r, t) : null, out = [];
  if (t <= 1) {
    var q0 = build(n, t, h, ARC_STYLE[arc], null, null);
    if (q0) out.push(finishBuild(q0, n, h, null, null));
    return out;
  }
  var sa, sb;
  if (chap) { sa = (chap.a || {}).style || ARC_STYLE[arc]; sb = (chap.b || {}).style || "search"; }
  else {
    sa = ARC_STYLE[arc];
    var others = ["force", "tech", "search", "trade"].filter(function (x) { return x !== sa; });
    sb = others[(h >>> 6) % others.length];
  }
  var qa = build(n, t, h, sa, chap, chap ? "a" : null);
  if (qa) { qa.style = sa; out.push(finishBuild(qa, n, h, chap, chap ? "a" : null)); }
  /* дальняя просьба: весточка вниз или доклад с нижнего уровня — вместо второго пути */
  var g = G();
  if (!chap && t >= 6 && t % 4 === 2 && g.L < LAB.LEVELS_N) {
    var cq = crossQuest(n, t, h);
    if (cq) out.push(cq);
    return out;
  }
  var hb = h32(h + ":b"), qb = build(n, t, hb, sb, chap, chap ? "b" : null);
  if (qb) {
    qb.style = sb;
    finishBuild(qb, n, hb, chap, chap ? "b" : null, qa ? qa.intro : null);
    var sig = function (q) { return steps(q).map(function (s) { return s.type + (s.tF || ""); }).sort().join(","); };
    if (!qa || sig(qa) !== sig(qb)) out.push(qb);
  }
  return out;
}
/* (3.5) весточка выжившим уровнем ниже или доклад с этажа нижнего уровня */
function crossQuest(n, t, h) {
  var g = G(), fem = !!n.female, q = { v: 2, id: n.key + ":" + t + ":x" + (giver(n).seq || 0), giver: n.key, giverName: n.n, gf: fem, L: g.L, F: g.F, done: false, stage: t, tier: t, arc: arcOf(n), cross: true };
  if ((h >>> 5) % 2 === 0) {
    q.type = "courier"; q.toL = g.L + 1;
    q.text = n.n + ": «Наши ушли вниз, на " + q.toL + "-й уровень, и не дают о себе знать. Если встретите там кого-то живого — передайте, что мы держимся. Наверх вам будет не вернуться — со мной не рассчитывайтесь: они отблагодарят сами».";
    q.short = "передать весточку выжившим уровнем ниже";
    q.way = "дальняя просьба: весточка вниз";
  } else {
    q.type = "deep"; q.remote = true; q.tL = g.L + 1; q.tF = 2 + (h % 6); q.seq0 = g.visitSeq || 0;
    q.text = n.n + ": «Что там, на " + q.tL + "-м уровне? Дойдите до его " + q.tF + "-го этажа — «Эхо» передаст доклад по связи, и я переведу награду вам на браслет».";
    q.short = "дойти до этажа " + q.tF + " уровня " + q.tL;
    q.way = "дальняя просьба: доклад с нижнего уровня";
  }
  q.reward = q.type === "courier" ? { cr: 0, xp: 0 } : { cr: LAB.credits(8 * (14 + 0.6 * t), g.L, g.F), xp: Math.round(5 * (14 + 0.6 * t) * (1 + 0.4 * g.L)) };
  q.t0 = nowMin();
  return q;
}

/* ════════ ВЗЯТЬ ════════ */
function active() { return G().quests.filter(function (q) { return !q.done && q.type !== "main"; }); }
var COOL_LINE = {
  abandon: "Вы уже отказались от моей просьбы. Дайте мне время — потом поговорим",
  betray: "После того, что было… Не сейчас",
  late: "Не сейчас. Мне нужно прийти в себя",
  distrust: "Я вам больше не верю, седьмой. Может, потом"
};
function take(n) {
  var r = giver(n), now = nowMin();
  if (r.cool && now < r.cool) { say(n.n + ": «" + (COOL_LINE[r.why] || COOL_LINE.abandon) + "»."); return; }
  if (r.cool && now >= r.cool) { r.cool = 0; if (r.trust < 25) r.trust = 25; } /* время лечит */
  if (r.trust < 15) { r.cool = now + 180; r.why = "distrust"; say(n.n + ": «" + COOL_LINE.distrust + "»."); return; }
  var act = active().length;
  if (act >= ACTIVE) { say(n.n + ": «Вижу, у вас и так забот хватает. Разберитесь с ними — тогда и поговорим». Взятых поручений — " + act + " из " + ACTIVE + ": сдайте одно или откажитесь от него в окне заданий."); return; }
  if (active().some(function (q) { return q.giver === n.key; })) { say(n.n + ": «Сначала — то, о чём я уже " + (n.female ? "просила" : "просил") + "»."); return; }
  var list = offers(n);
  if (!list.length) { say(n.n + ": «Пока просить не о чем»."); return; }
  if (list.length === 1) { accept(n, list[0]); return; }
  offerMenu(n, list);
}
function offerMenu(n, list) {
  var r = giver(n), q0 = list[0], chap = q0.chap ? chapterDef(q0.chap.arc, q0.chap.i, r.path) : null;
  var head = chap ? "История «" + chap.arcN + "», глава " + ["первая", "вторая", "третья", "четвёртая", "пятая", "шестая"][chap.i] + ": «" + chap.t + "». " : "";
  var intro = head + n.n + ": «" + q0.intro + " Можно по-разному — выбирайте, как пойдёте». " + n.n + " " + trustWord(r.trust, !!n.female) + ".";
  var items = list.map(function (q, i) {
    var ss = steps(q);
    var sum = ss.length > 1 ? ss.map(function (s) { return sShort(s, q); }).join("; ") : sShort(ss[0], q);
    return { label: "Путь " + ["первый", "второй", "третий"][i] + (q.way ? " — " + q.way : "") + ": " + sum + ". " + rewardText(q), fn: function () { accept(n, q); } };
  });
  items.push({ label: "Подумать и вернуться позже", fn: function () { say(n.n + ": «Подумайте. Я никуда не денусь»."); } });
  UIx("menu", "Поручение: " + n.n, items, { intro: intro });
}
function accept(n, q) {
  if (q.done) return false;
  var act = active().length;
  if (act >= ACTIVE) { say("Взятых поручений — " + act + " из " + ACTIVE + ": сдайте одно или откажитесь от него в окне заданий."); return false; }
  if (active().some(function (x) { return x.giver === n.key; })) return false;
  if (G().quests.some(function (x) { return x.id === q.id && !x.failed; })) { say(n.n + ": «Я уже " + (n.female ? "просила" : "просил") + " вас об этом»."); return false; }
  /* отсчёт — с минуты, когда взяли */
  var now = nowMin(), d = now - (q.t0 || now);
  if (d > 0) { (q.cond || []).forEach(function (c) { if (c.k === "fast") c.until += d; }); if (q.urgent) q.urgent += d; }
  q.t0 = now;
  steps(q).forEach(function (s) { if (s.type === "kill") s.wk0 = G().stats.wkills || 0; if (s.type === "visit" || s.type === "deep") s.seq0 = G().visitSeq || 0; });
  (q.cond || []).forEach(function (c) { if (c.k === "clean") c.k0 = G().stats.kills || 0; });
  G().quests.push(q);
  journal("Задание от " + n.n + ": " + q.short + ".");
  UIx("closeAll"); /* окно выжившего под выбором устарело — назад, в игру */
  LAB.UI.ok();
  say("Задание: " + q.text + " " + rewardText(q) + " Взятых поручений — " + (act + 1) + " из " + ACTIVE + ".");
  UIx("refresh");
  return true;
}

/* ════════ СДАТЬ ════════ */
function complete(q, n) {
  if (q.done) return; /* (3.5) уже сдано — второй раз не платят */
  if (!ready(q)) { say("Задание ещё не выполнено: " + progress(q) + "."); return; }
  var r = giver(n);
  /* выбор в конце главы */
  if (q.chap) {
    var chap = chapterDef(q.chap.arc, q.chap.i, r.path);
    if (chap && chap.pick) {
      var items = chap.pick.o.map(function (o) { return { label: o.l, fn: function () { finish(q, n, o); } }; });
      UIx("menu", "Выбор: «" + chap.t + "»", items, { intro: gx(chap.pick.q, !!n.female) });
      return;
    }
  }
  /* вещь с секретом: кредитный чип прежней смены */
  if (q.pick && q.pick.chip) {
    var cr = q.pick.chip;
    UIx("menu", "Как поступить с находкой?", [
      { label: "Отдать всё как есть", fn: function () { finish(q, n, { f: "honest", tr: 3, say: "Здесь был чип? И вы его отдали… Спасибо. Я это запомню." }); } },
      { label: "Оставить кредитный чип себе — " + cr + " " + pl(cr, "кредит", "кредита", "кредитов"), fn: function () { finish(q, n, { f: "chip", tr: -12, cr: q.pick.chipBase || 0, crAbs: cr, say: "Вещь вернули, а вот чипа в ней нет… Ладно. Я всё [понял|поняла] — и [запомнил|запомнила]." }); } }
    ], { intro: "В вещи, которую вы несёте, — кредитный чип прежней смены на " + cr + " " + pl(cr, "кредит", "кредита", "кредитов") + ". Хозяин о нём, кажется, не помнит." });
    return;
  }
  finish(q, n, null);
}
function finish(q, n, opt) {
  if (q.done) return;
  if (!ready(q)) { say("Задание ещё не выполнено: " + progress(q) + "."); return; }
  var r = giver(n), g = G();
  steps(q).forEach(function (s) { var Kd = KINDS[s.type]; if (Kd && Kd.take) Kd.take(s); });
  q.done = true;
  n.stage = (n.stage || 0) + 1;
  r.done = Math.max(r.done || 0, doneOf(q.giver));
  var kept = (q.cond || []).filter(function (c) { return !c.lost; }).length;
  r.trust = clamp(r.trust + 5 + kept + (opt && opt.tr ? opt.tr : 0), 0, 100);
  r.last = steps(q).map(function (s) { return s.type; }).slice(0, 8);
  if (opt && opt.f === "chip") { r.cool = nowMin() + 60; r.why = "betray"; }
  var extra = [];
  if (opt && (opt.cr || opt.crAbs)) { var ocr = opt.crAbs || LAB.credits(opt.cr, g.L, g.F); g.credits += ocr; extra.push("Кредитов сверх награды: " + ocr + "."); }
  if (opt && opt.gift) { var og = opt.gift.ammo ? questGift(n, h32(q.id + ":og"), 1) : { kind: "item", item: opt.gift.item, n: opt.gift.n || 1 }; if (opt.gift.ammo && og.kind === "ammo") og.n = opt.gift.ammo; if (og.kind === "ammo" || LAB.ITEMS[og.item]) { gm().giveItem(og, true); extra.push("В придачу — " + giftName(og) + "."); } }
  var head = opt && opt.say ? n.n + ": «" + gx(opt.say, !!n.female) + "»" : "Задание выполнено! " + q.giverName + " благодарит.";
  UIx("closeAll");
  if (q.chap) {
    r.path.push(opt ? opt.f || "" : "");
    r.ch = Math.max(r.ch || 0, q.chap.i + 1);
    var arc = TX().ARCS[q.chap.arc];
    if (arc && q.chap.i === arc.ch.length - 1) {
      var bye = questGift(n, h32(q.id + ":bye"), 5);
      gm().giveItem(bye, true);
      var bcr = LAB.credits(60, g.L, g.F); g.credits += bcr;
      extra.push(n.n + ": «" + gx(arc.bye, !!n.female) + "» История «" + arc.n + "» окончена. Прощальный подарок — " + giftName(bye) + " и " + bcr + " " + pl(bcr, "кредит", "кредита", "кредитов") + ".");
      journal("История «" + arc.n + "» (" + q.giverName + ") окончена.");
    }
  }
  pay(q, head, extra.join(" "));
  compact(q);
  prune();
}
function pay(q, head, extra) {
  var g = G(), r = q.reward || { cr: 0, xp: 0 }, k = condK(q);
  if (LAB.ach) LAB.ach.ev("quest", 1);
  var cr = Math.round((r.cr || 0) * k), xp = Math.round((r.xp || 0) * k);
  g.credits += cr;
  LAB.UI.fanfare();
  if (r.gift) gm().giveItem(r.gift, true);
  var kept = (q.cond || []).filter(function (c) { return !c.lost; });
  say(head + " Кредитов: плюс " + cr + "." + (r.gift ? " В придачу — " + giftName(r.gift) + "." : "") + (kept.length ? " Премия за условия: " + kept.length + " из " + q.cond.length + "." : "") + (extra ? " " + extra : ""));
  journal("Выполнено задание: " + q.short + ".");
  gm().gainXP(xp);
  if (g.faction === "res") { g.inv.medkit_s = (g.inv.medkit_s || 0) + 1; sayq("Сопротивление делится аптечкой."); }
  UIx("refresh");
}
/* сданное и сорванное — без полного текста: его больше не читают, а запись не разрастается */
function compact(q) { delete q.text; delete q.intro; }
/* сданные поручения копятся: в записи — последние восемьдесят, счёт — у заказчика */
function prune() {
  var g = G(), done = g.quests.filter(function (q) { return q.done && q.type !== "main"; });
  if (done.length <= DONE_KEEP) return;
  var cut = done.length - DONE_KEEP, drop = {};
  done.slice(0, cut).forEach(function (q) { var r = recOf(q.giver); if (r && !q.failed) r.done = Math.max(r.done || 0, doneOf(q.giver)); drop[q.id] = 1; });
  g.quests = g.quests.filter(function (q) { return !(q.done && drop[q.id] && q.type !== "main"); });
}
/* Отказ — с подтверждением в окне заданий: доверие падает, новую просьбу — не сразу. */
function abandon(q) {
  if (!q || q.done || q.type === "main") return false;
  q.done = true; q.failed = true;
  var r = recOf(q.giver);
  if (r) { r.trust = clamp(r.trust - 15, 0, 100); r.fails = (r.fails || 0) + 1; r.cool = nowMin() + 30; r.why = "abandon"; r.seq = (r.seq || 0) + 1; }
  journal("Отказ от задания: " + q.short + ".");
  compact(q);
  say("Вы отказались от задания «" + q.short + "». " + q.giverName + " " + (q.gf ? "огорчена" : "огорчён") + ": доверие упало, о новом спросите позже. Взятых поручений — " + active().length + " из " + ACTIVE + ".");
  UIx("refresh");
  return true;
}
/* опоздали со срочной помощью */
function late(q) {
  q.done = true; q.failed = true; q.late = true;
  var r = recOf(q.giver);
  if (r) { r.trust = clamp(r.trust - 8, 0, 100); r.fails = (r.fails || 0) + 1; r.cool = nowMin() + 20; r.why = "late"; r.seq = (r.seq || 0) + 1; }
  var aid = steps(q).filter(function (s) { return s.type === "aid"; })[0];
  journal("Не успели: " + q.short + ".");
  compact(q);
  sayq("Срок вышел: " + (aid ? aid.toName + " больше не " + (aid.toF ? "ждала" : "ждал") + " — " + (aid.toF ? "справилась" : "справился") + " как " + (aid.toF ? "смогла" : "смог") : "помощь опоздала") + ". Поручение «" + q.short + "» сорвано, " + q.giverName + " огорчен" + (q.gf ? "а" : "") + ".");
}

/* ════════ СЛЕЖЕНИЕ ════════ */
var lastNote = {};
function check() {
  var g = G(), now = nowMin();
  if (!g || !g.quests) return;
  g.quests.forEach(function (q) {
    if (q.done || q.type === "main") return;
    /* (3.5) доклад по связи платится, как только этаж разведан, — что бы ни помнила память объявлений */
    if (q.remote) {
      if (!ready(q)) return;
      lastNote[q.id] = 1; q.done = true;
      var rr = recOf(q.giver); if (rr) { rr.done = Math.max(rr.done || 0, doneOf(q.giver)); rr.trust = clamp(rr.trust + 5, 0, 100); }
      pay(q, "«Эхо» передало доклад наверх. " + q.giverName + " благодарит по связи и переводит награду на браслет.");
      compact(q);
      return;
    }
    if (q.type === "courier") {
      if (lastNote[q.id]) return;
      if (g.L > q.L) { lastNote[q.id] = 1; sayq("Весточку от " + q.giverName + " можно передать любому выжившему здесь, внизу."); }
      return;
    }
    if (q.urgent && now > q.urgent && !ready(q)) { late(q); return; }
    condTick(q, now);
    var ss = steps(q);
    if (ss.length > 1) ss.forEach(function (s) {
      if (s.said || !stepReady(s, q)) return;
      s.said = 1;
      if (!ready(q)) { var i = curStep(q); sayq("Поручение от " + q.giverName + ": сделано — " + sShort(s, q) + "." + (i >= 0 ? " Дальше: " + sShort(ss[i], q) + "." : "")); }
    });
    if (lastNote[q.id] || !ready(q)) return;
    lastNote[q.id] = 1;
    LAB.UI.ok(); sayq("Задание «" + q.short + "» можно сдать: " + q.giverName + ", уровень " + q.L + ", этаж " + q.F + ".");
  });
}
function condTick(q, now) {
  (q.cond || []).forEach(function (c) {
    if (c.lost) return;
    if (c.k === "fast" && c.until && now > c.until) { c.lost = true; sayq("Поручение «" + q.short + "»: срок премии за быстроту вышел."); }
    if (c.k === "clean" && (G().stats.kills || 0) > (c.k0 || 0)) { c.lost = true; sayq("Поручение «" + q.short + "»: пролилась кровь — премии «без крови» не будет."); }
  });
}
/* время идёт шагами и отдыхом (advanceTime): сроки проверяются сразу */
function onTime() {
  var now = nowMin();
  G().quests.forEach(function (q) {
    if (q.done || q.type === "main") return;
    if (q.urgent && now > q.urgent && !ready(q)) { late(q); return; }
    condTick(q, now);
  });
}
/* ОКО подняло тревогу: премия «тихо» — у поручений, чьи этажи — этот */
function onAlarm(lv) {
  if (lv < 2) return;
  var g = G(), key = g.L + "-" + g.F;
  g.quests.forEach(function (q) {
    if (q.done || q.type === "main" || !q.cond) return;
    q.cond.forEach(function (c) { if (c.k === "quiet" && !c.lost && questFloors(q)[key]) { c.lost = true; sayq("Поручение «" + q.short + "»: ОКО подняло тревогу — премии за тишину не будет."); } });
  });
}
/* убит враг (combat.js): счёт видов — только тех, за кого дали опыт */
function onKill(f, xp) {
  if (!(xp > 0)) return;
  allSteps().forEach(function (x) {
    var s = x.s;
    if (x.q.done || s.type !== "hunt" || s.ok) return;
    var c = CLS[s.cls]; if (c && c.ok(f)) s.n = (s.n || 0) + 1;
  });
}
/* вошли в помещение (game.js, roomCheck): вещь из поручения и осмотр этажа */
function onRoom(r) {
  var g = G(), got = false;
  allSteps().forEach(function (x) {
    var q = x.q, s = x.s;
    if (q.done || s.tL !== g.L || s.tF !== g.F) return;
    if (s.type === "keep" && !s.got && s.room === r.id) {
      s.got = true; got = true; A("play", "pick_part");
      sayq("«Эхо»: вот оно. Вы забираете " + s.what + " — то, о чём " + (q.gf ? "просила " : "просил ") + q.giverName + ".");
    }
    if (s.type === "survey" && !s.ok) {
      if (!s.seen) s.seen = [];
      if (s.seen.indexOf(r.id) < 0) { s.seen.push(r.id); got = true; }
    }
  });
  if (got) check();
}
/* пришли на этаж: враги, которых в этом режиме нет на этаже, из расчистки уходят; цели — вслух */
function onFloor(silent) {
  var g = G(), C = LAB.combat, alive = {}, fx = fst(g.L, g.F) || {}, names = [];
  if (C && C.foes) C.foes().forEach(function (f) { alive[f.id] = 1; });
  allSteps().forEach(function (x) {
    var q = x.q, s = x.s;
    if (q.done || s.tL !== g.L || s.tF !== g.F) return;
    if (s.type === "clear" && s.foeIds) s.foeIds = s.foeIds.filter(function (id) { return alive[id] || (fx.foes && fx.foes[id] && fx.foes[id].dead); });
    if (!stepReady(s, q)) names.push(sShort(s, q));
  });
  if (!silent && names.length) sayq("«Эхо»: здесь цели поручений — " + names.join("; ") + ". Навигатор подскажет дорогу.");
  check();
}
/* цели поручений на этом этаже — для навигатора */
function navTargets() {
  var out = [];
  allSteps().forEach(function (x) {
    var q = x.q, s = x.s, Kd = KINDS[s.type];
    if (q.done || !onIt(s) || !Kd || !Kd.nav || stepReady(s, q)) return;
    var t = null; try { t = Kd.nav(s, q); } catch (e) { t = null; }
    if (t) { t.n = "поручение: " + t.n; out.push(t); }
  });
  return out;
}
/* (3.5) жетоны, взятые по поручениям «найти тело», — для заказчиков */
function reservedBadges() { return allSteps().filter(function (x) { return !x.q.done && x.s.type === "body" && badgeTaken(x.s); }).length; }

/* ════════ У ДРУГИХ ВЫЖИВШИХ: весточка, посылка, помощь ════════ */
function npcItems(n) {
  var g = G(), items = [];
  /* (3.5) весточка сверху — любому выжившему уровнем ниже: он и благодарит своим ремеслом */
  g.quests.filter(function (q) { return q.type === "courier" && !q.done && g.L > q.L; }).forEach(function (q) {
    items.push({ label: "Передать весточку от " + q.giverName + " (уровень " + q.L + ")", fn: function () {
      if (q.done) return;
      q.done = true;
      q.reward = legacyReward(q, n, LAB.hash32(n.key + ":" + q.id), g.L, g.F);
      var rr = recOf(q.giver); if (rr) rr.done = Math.max(rr.done || 0, doneOf(q.giver));
      pay(q, n.n + " слушает, не перебивая: «" + q.giverName + "? Жив" + (q.gf ? "а" : "") + "… Спасибо, седьмой. Возьмите — это от всех нас».");
      compact(q);
    } });
  });
  allSteps().forEach(function (x) {
    var q = x.q, s = x.s;
    if (q.done || s.to !== n.key || s.given || !onIt(s)) return;
    if (s.type === "deliver") {
      items.push({ label: "Передать посылку от " + q.giverName, fn: function () { give(q, s, n, false); } });
      items.push({ label: "Вскрыть посылку от " + q.giverName + ", прежде чем отдать", fn: function () { openParcel(q, s, n); } });
    }
    if (s.type === "aid") items.push({ label: "Отдать «" + LAB.ITEMS[s.item].n + "» — помощь от " + q.giverName, fn: function () {
      if (s.given) return;
      if (!((g.inv[s.item] || 0) > 0)) { LAB.UI.error(); say("У вас нет: «" + LAB.ITEMS[s.item].n + "». Купите у торговца или поищите в аптечках и шкафчиках."); return; }
      g.inv[s.item]--; s.given = true; s.ok = true; A("play", "pick_part");
      say(n.n + ": «" + (q.giverName) + " " + (q.gf ? "прислала" : "прислал") + "? Спасибо… Теперь продержусь». Помощь оказана.");
      check(); UIx("refresh");
    } });
  });
  return items;
}
function give(q, s, n, broken) {
  if (s.given) return;
  s.given = true; s.ok = true; A("play", "pick_part");
  UIx("closeAll");
  var t = n.n + ": «От " + q.giverName + "? Спасибо»." + (s.reply ? " " + (n.female ? "Она" : "Он") + " пишет ответ и отдаёт вам — отнесите его обратно." : "");
  if (broken) { var r = recOf(q.giver); if (r) r.trust = clamp(r.trust - 3, 0, 100); t += " Печать на посылке сорвана — " + q.giverName + " об этом узнает."; }
  say(t);
  check(); UIx("refresh");
}
/* посылка: что внутри — по зерну; оставить себе — поручение сорвано и доверие подорвано */
function openParcel(q, s, n) {
  var gift = questGift({ prof: LAB.PROFS[s.toPr] ? s.toPr : "Кладовщик" }, h32(q.id + ":parcel:" + s.to), 2 + Math.floor((q.tier || 0) / 4));
  UIx("menu", "Посылка от " + q.giverName, [
    { label: "Запечатать и передать как есть", fn: function () { give(q, s, n, true); } },
    { label: "Оставить содержимое себе: " + giftName(gift), fn: function () {
      if (q.done) return;
      UIx("closeAll");
      gm().giveItem(gift, true);
      q.done = true; q.failed = true;
      var r = recOf(q.giver);
      if (r) { r.trust = clamp(r.trust - 30, 0, 100); r.fails = (r.fails || 0) + 1; r.cool = nowMin() + 240; r.why = "betray"; r.seq = (r.seq || 0) + 1; }
      journal("Посылка от " + q.giverName + " не дошла: вы оставили её себе.");
      compact(q);
      say("Вы забираете " + giftName(gift) + ". " + n.n + " так и не узнает, что " + (n.female ? "её" : "его") + " ждало. Поручение «" + q.short + "» сорвано; " + q.giverName + " узнает — и не простит скоро.");
      UIx("refresh");
    } }
  ], { intro: "Вы поддеваете печать. Внутри — " + giftName(gift) + "." });
}

/* ════════ СТРОКА ОКНА ЗАДАНИЙ ════════ */
function line(q) {
  return q.short + " — " + progress(q) + ". Заказчик: " + q.giverName + ", уровень " + q.L + ", этаж " + q.F + ". " + rewardText(q);
}
/* полное описание: текст, шаги с отметками, условия */
function details(q) {
  var ss = steps(q), t = q.text || q.short;
  if (ss.length > 1) t += " Сейчас: " + ss.map(function (s, i) { return (i + 1) + ") " + sShort(s, q) + " — " + (stepReady(s, q) ? "сделано" : sProg(s, q)); }).join("; ") + ".";
  var c = condText(q); if (c) t += " " + c;
  var lost = (q.cond || []).filter(function (x) { return x.lost; }).length;
  if (lost) t += " Премий потеряно: " + lost + ".";
  return t;
}
function reset() { lastNote = {}; }

LAB.quests = {
  ACTIVE: ACTIVE, KINDS: KINDS, take: take, offers: offers, accept: accept, complete: complete, finish: finish, abandon: abandon,
  active: active, progress: progress, ready: ready, steps: steps, rewardText: rewardText, line: line, details: details,
  check: check, onTime: onTime, onAlarm: onAlarm, onKill: onKill, onRoom: onRoom, onFloor: onFloor, navTargets: navTargets,
  npcItems: npcItems, reservedBadges: reservedBadges, stage: tierOf, giver: giver, arcOf: arcOf, chapterDef: chapterDef,
  workOf: workOf, reset: reset, legacyReward: legacyReward, clearLeft: clearLeft, build: build
};
})();
