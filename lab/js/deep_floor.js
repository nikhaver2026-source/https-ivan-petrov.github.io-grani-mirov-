/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — этажи глубоких блоков (после 4.1).
   Вызывается генератором этажа (world.js, шаг 26а) только ниже сотого уровня
   и своим потоком случайностей: этажи 1–100 не меняются.
   • Срез — короткий путь вниз сразу на много уровней (полосу блока и больше):
     в тайной комнате или в подсобке (технические, склады, кладовые). Что нужно,
     чтобы спуститься (need), — у вида среза блока (deep.cuts): питание
     (энергобатарея), головоломка пульта, ручная лебёдка, страховочная сбруя,
     код из записки этого этажа или ничего.
   • Испытательный стенд — в каждой испытательной камере блока (trial).
   • Помещение вне надзора (dark): камер нет; бывает теневой торговец.
   • Дверь с допуском (rank): открывается статусом в списках Переклички.
     Ставится, только если без этой комнаты этаж проходим, в ней нет ничего,
     без чего дальше не пройти, и без допуска в неё не войти (нет открытого
     проёма). Иначе «по допуску» — хранилища комнаты (rankLock).
   Синтаксис — не новее ES2017; без DOM: файл читают и проверки в Node.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

function deepOf(L) { return LAB.DEEP && LAB.DEEP[LAB.blockOf(L)]; }
function bandLen(n) { var R = LAB.blockRange(n); return Math.max(1, Math.round(R.size / 40)); }
/* Куда уводит срез: на k полос блока ниже, но последние два уровня блока (его сердце и вехи
   конца) проходят пешком — срез до них не дотягивается. */
function cutTarget(L, k) {
  var n = LAB.blockOf(L), R = LAB.blockRange(n);
  if (!R || n < LAB.DEEP_FIRST) return L;
  return Math.max(L, Math.min(R.to - 2, L + bandLen(n) * k));
}
LAB.cutTarget = cutTarget;
/* Можно ли на этом уровне ставить срез: не на первых четырёх уровнях блока (вехи начала, первая
   встреча с блоком) и не на последних двух. */
function cutLevelOk(L) {
  var n = LAB.blockOf(L), R = LAB.blockRange(n);
  return !!R && n >= LAB.DEEP_FIRST && L - R.from >= 4 && L <= R.to - 3;
}
LAB.cutLevelOk = cutLevelOk;
var NEED_K = { none: 1, crank: 1, code: 2, power: 2, puzzle: 2, harness: 3 };
/* Подсобка: технические и складские помещения (бетонные наверху), кладовые, щитовые. */
var UTIL = { storage: 1, parts: 1, locker: 1, pumps: 1, switchboard: 1, workroom: 1, repair: 1, charging: 1, janitor: 1, boiler: 1, generator: 1, laundry: 1, archive: 1 };
function utilRoom(t) {
  var def = LAB.ROOMS[t] || {};
  if (def.util || UTIL[t]) return true;
  var C = LAB.floors && LAB.floors.CONC;
  return !!(C && C[t]);
}
var BLOCKERS = { elevator: 1, capsule: 1, stairs_up: 1, stairs_down: 1, gate: 1, gate_sealed: 1, reactor: 1, workbench: 1, wake: 1 };
var KEYS = { gatepass: 1, elevpass: 1, pass: 1 };
function roomHasKey(fl, ri) {
  var W = LAB.W;
  for (var i = 0; i < fl.items.length; i++) { var it = fl.items[i]; if (KEYS[it.kind] && fl.room[it.y * W + it.x] === ri) return true; }
  for (var j = 0; j < fl.objs.length; j++) { var o = fl.objs[j]; if (o.room === ri && BLOCKERS[o.type]) return true; }
  for (var k = 0; k < fl.foes.length; k++) { var f = fl.foes[k]; if (f.room === ri && (f.boss || (f.carry && f.carry.length))) return true; }
  return false;
}
/* Досягаема ли хоть одна клетка комнаты (по карте решателя этажа). */
function roomReached(fl, rm, ri, reach) {
  if (!reach) return false;
  var W = LAB.W;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) { var j = y * W + x; if (fl.room[j] === ri && reach[j]) return true; }
  return false;
}
/* Хранилища, которые бывают «по допуску», и вещи, без которых этаж не пройти (их не запирают). */
var RANKBOX = { locker: 1, crate: 1, desk: 1 };
function passItem(it) { return !!(it && (it.kind === "key" || it.kind === "pass" || it.kind === "gatepass" || it.kind === "elevpass" || it.rub || (it.kind === "note" && it.code))); }

LAB.deepFloor = function (c) {
  var fl = c.fl, L = c.L, F = c.F, r = c.rng, n = LAB.blockOf(L), D = deepOf(L);
  if (!D || !fl || L <= 100) return;
  var rooms = fl.rooms, h0 = LAB.hash32 ? LAB.hash32("deepfl|" + L + "|" + F) >>> 0 : 0;
  fl.deepN = n;

  /* ── испытательные стенды ── */
  var trials = D.trials || [];
  rooms.forEach(function (rm, ri) {
    var def = LAB.ROOMS[rm.type] || {};
    if (!def.trial || !trials.length || ri === c.U || ri === c.D) return;
    var tr = trials[(h0 + ri * 7) % trials.length];
    c.addObj("trialst", ri, { trial: tr.id, diff: Math.min(2, (tr.rank || 1) - 1 + (r.chance(0.35) ? 1 : 0)) });
  });

  /* ── помещения вне надзора: без камер; теневой торговец — в одном из них ── */
  var darkRooms = [];
  rooms.forEach(function (rm, ri) {
    var def = LAB.ROOMS[rm.type] || {};
    if (!def.dark) return;
    rm.dark = true; darkRooms.push(ri);
    fl.foes = fl.foes.filter(function (f) {
      if (f.room !== ri || f.boss) return true;
      var b = LAB.FOES[f.type];
      return !(b && b.beh && b.beh.indexOf("camera") >= 0);
    });
  });
  if (darkRooms.length && D.market && r.chance(0.6)) {
    var tr0 = r.pick(darkRooms);
    if (tr0 !== c.U && tr0 !== c.D) c.addObj("dtrader", tr0, { market: n });
  }

  /* ── двери с допуском ──
     Замок на двери что-то значит, только если без допуска в комнату не войти: у многих помещений
     есть открытый проём в коридор (или комната — проход между коридорами). Тогда дверь не
     запирается, а «по допуску» становятся её хранилища — шкафчики, ящики, столы (но не те, где
     лежит нужное для прохода: ключ, пропуск, код). */
  rooms.forEach(function (rm, ri) {
    var def = LAB.ROOMS[rm.type] || {};
    if (!def.rank || ri === c.U || ri === c.D || ri === c.secret) return;
    var rk = Math.max(1, Math.min(6, def.rank));
    var ds = roomHasKey(fl, ri) ? [] : fl.doors.filter(function (d) { return d.room === ri && !d.lock && d.kind !== "secret"; });
    if (ds.length) {
      ds.forEach(function (d) { d.lock = { type: "rank", rank: rk }; });
      /* без этой комнаты этаж проходим, и без допуска в неё не попасть: иначе замок снимается */
      var ok = true;
      try { var res = LAB.solve(fl, { tier: 99999, gatepass: true, rank: 0 }); ok = !!(res && res.down && res.elev) && !roomReached(fl, rm, ri, res.reach); } catch (e) { ok = false; }
      if (ok) { rm.rank = rk; return; }
      ds.forEach(function (d) { d.lock = null; });
    }
    var boxes = 0;
    fl.objs.forEach(function (o) {
      if (o.room !== ri || !RANKBOX[o.type] || !o.loot || !o.loot.length || o.loot.some(passItem)) return;
      o.rankLock = rk; boxes++;
    });
    if (boxes) rm.rankBoxes = rk;
  });

  /* ── срез ── */
  var cuts = D.cuts || [];
  if (cuts.length && cutLevelOk(L) && F > 1 && F < LAB.FLOORS_N && r.chance(0.16)) {
    var spot = -1;
    if (c.secret >= 0 && c.secret != null && r.chance(0.6)) spot = c.secret;
    if (spot < 0) {
      var util = [];
      rooms.forEach(function (rm, ri) { if (ri !== c.U && ri !== c.D && ri !== c.secret && !rm.rank && utilRoom(rm.type)) util.push(ri); });
      if (util.length) spot = r.pick(util);
    }
    if (spot >= 0) {
      var cut = cuts[(h0 >>> 3) % cuts.length], k = NEED_K[cut.need] || 1;
      var to = cutTarget(L, k);
      if (to > L) {
        var o = c.addObj("srez", spot, { cut: cut.id, need: cut.need, to: to, hidden: spot === c.secret });
        if (o && cut.need === "code") {
          o.code = String(1000 + (h0 % 9000));
          /* записка с кодом — на этом же этаже, в другом помещении */
          var others = [];
          rooms.forEach(function (rm, ri) { if (ri !== spot && ri !== c.secret && !rm.rank) others.push(ri); });
          if (others.length && c.addItem) c.addItem({ kind: "note", note: "cutcode", code: o.code, cut: o.id, cutN: cut.n }, r.pick(others));
          else o.need = "none";
        }
        if (o && cut.need === "puzzle") o.seed = 1 + (h0 % 99991);
      }
    }
  }
};
})();
