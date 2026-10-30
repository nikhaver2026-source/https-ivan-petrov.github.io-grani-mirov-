/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — лечение и снабжение у капсул (2.6).
   • Новые вещи: аптечки глубин (чем ниже, тем сильнее), кровоостанавливающие
     бинты трёх уровней и травяные сборы — у каждой глубины свой.
   • Этаж (шаг 24 генератора, своим потоком случайностей):
     – в каждом помещении с капсулой — аптечный автомат: только аптечки и
       энергобатареи, цена растёт с глубиной и по режиму (priceK);
     – у капсулы прибытия — стопка энергобатарей (по режиму: capBat);
     – в каждой второй комнате по дороге от прибытия — лечебные припасы:
       аптечки, бинты или травяной сбор, от одной до семи штук. Глубже по
       блокам — больше и сильнее; в медицинских, больших и охраняемых
       комнатах и вдали от прибытия — больше. Сколько именно — по режиму
       (med), пересчитывается при входе на этаж: этаж от режима не зависит;
     – целитель: свой на каждой глубине.
   • Целители лечат за кредиты и не только: за энергобатареи, еду, биогель,
     детали, нервы (нейронагрузку) или время. Чем глубже — тем дороже.
   Генератор и таблицы — без DOM: файл читают и игра, и проверки в Node.
   Синтаксис — не новее ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function put(table, src) { for (var k in src) if (!table[k]) table[k] = src[k]; }

/* ════════ ВЕЩИ ════════
   Найти — в комнатах и хранилищах; купить аптечки — у аптечных автоматов
   у капсул (прилавки пунктов снабжения их не берут: src "find"). */
put(LAB.ITEMS, {
  /* аптечки глубин */
  medkit_r: { n: "Аптечка горноспасателя", icon: "🧰", kind: "use", cat: "med", src: "find", desc: "Оранжевый кейс горноспасателей «Подножия»: жгут, гемостатик и шприц-тюбик. Плюс 160 здоровья, останавливает кровотечение и снимает отравление.", heal: 160, stopBleed: true, cure: true, price: 110, depth: 11 },
  medkit_a: { n: "Аптечка отряда «Альфа»", icon: "🧰", kind: "use", cat: "med", src: "find", desc: "Полевая аптечка бойцов «Альфы» из «Колыбели»: биоклей, обезболивающее и сорбент. Плюс 210 здоровья, останавливает кровотечение, выводит 30 токсинов.", heal: 210, stopBleed: true, detox: 30, price: 150, depth: 21 },
  medkit_m: { n: "Зеркальная аптечка", icon: "🧰", kind: "use", cat: "med", src: "find", desc: "Аптечка «Отражения»: стекло и ртутный гель затягивают раны, будто их и не было. Плюс 270 здоровья, снимает отравление и кровотечение, нейронагрузка минус 15.", heal: 270, stopBleed: true, cure: true, neuro: -15, price: 190, depth: 41 },
  medkit_g: { n: "Регенератор Механизма", icon: "🧰", kind: "use", cat: "med", src: "find", desc: "Латунный регенератор из чанов «Механизма»: игла, насос и тёплая сыворотка. Плюс 340 здоровья, снимает отравление и кровотечение, выводит 40 токсинов.", heal: 340, stopBleed: true, cure: true, detox: 40, price: 240, depth: 61 },
  medkit_i: { n: "Аптечка Истока", icon: "🧰", kind: "use", cat: "med", src: "find", desc: "Сосуд с живым соком «Истока», укутанный во мох: раны срастаются на глазах. Плюс 420 здоровья, снимает отравление и кровотечение, выводит 50 токсинов и 40 лучевой нагрузки.", heal: 420, stopBleed: true, cure: true, detox: 50, rad: -40, price: 300, depth: 81 },
  /* кровоостанавливающие бинты глубин */
  bandage_h: { n: "Гемостатический бинт", icon: "🩹", kind: "use", cat: "med", src: "find", desc: "Бинт, пропитанный гемостатиком: кровь сворачивается под ним за секунды. Останавливает кровотечение и даёт 30 здоровья.", heal: 30, stopBleed: true, price: 30, depth: 21 },
  bandage_x: { n: "Живой бинт", icon: "🩹", kind: "use", cat: "med", src: "find", desc: "Бинт из нитей, выращенных в чанах «Механизма»: сам стягивает края раны. Останавливает кровотечение, снимает отравление и даёт 60 здоровья.", heal: 60, stopBleed: true, cure: true, price: 55, depth: 61 },
  /* травяные сборы: у каждой глубины свой */
  herb_k: { n: "Травяной сбор оранжереи", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Мята, ромашка и зверобой из оранжереи «Ковчега» в бумажном пакетике. Плюс 20 здоровья, бодрость плюс 5.", heal: 20, wake: 5, price: 14, depth: 1 },
  herb_p: { n: "Горный сбор буровиков", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Чабрец, лишайник и корень родиолы: буровики «Подножия» сушили их в общежитии. Плюс 40 здоровья, токсины минус 10.", heal: 40, detox: 10, price: 26, depth: 11 },
  herb_c: { n: "Луговой сбор Колыбели", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Травы с тёплых лугов «Колыбели»: пахнут мёдом и железом. Плюс 60 здоровья и останавливает кровотечение.", heal: 60, stopBleed: true, price: 40, depth: 21 },
  herb_o: { n: "Сбор зазеркальных трав", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Бледные травы, выросшие по ту сторону стекла: горчат, но затягивают раны. Плюс 80 здоровья, нейронагрузка минус 10.", heal: 80, neuro: -10, price: 55, depth: 41 },
  herb_m: { n: "Сбор из оранжереи Механизма", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Травы, выращенные под лампами в масляном тумане «Механизма». Плюс 100 здоровья, снимает отравление.", heal: 100, cure: true, price: 70, depth: 61 },
  herb_i: { n: "Мох у колодца тишины", icon: "🌿", kind: "use", cat: "med", src: "find", desc: "Мох и травы у колодца тишины в «Истоке», тёплые на ощупь. Плюс 130 здоровья, снимает отравление и кровотечение.", heal: 130, stopBleed: true, cure: true, price: 90, depth: 81 }
});
if (LAB.OBJ && !LAB.OBJ.medvend) LAB.OBJ.medvend = { n: "Аптечный автомат", icon: "💊", desc: "Автомат у капсулы восстановления: продаёт только аптечки и энергобатареи. Чем глубже, тем дороже." };

/* ════════ ЧТО ЛЕЖИТ НА КАКОЙ ГЛУБИНЕ ════════
   Глубина снабжения (LAB.supplyEra): 0 — «Ковчег», 1 — «Подножие»,
   2 — «Колыбель», 3 — «Отражение», 4 — «Механизм», 5 — «Исток». */
var KITS = [
  [["medkit_s", 0.75, 1], ["medkit_l", 0.2, 4], ["nanomed", 0.05, 6]],
  [["medkit_l", 0.45], ["medkit_r", 0.35], ["nanomed", 0.2]],
  [["medkit_r", 0.4], ["medkit_a", 0.45], ["nanomed", 0.15]],
  [["medkit_a", 0.4], ["medkit_m", 0.6]],
  [["medkit_m", 0.4], ["medkit_g", 0.6]],
  [["medkit_g", 0.4], ["medkit_i", 0.6]]
];
var BANDS = [
  [["bandage", 0.75], ["coagulant", 0.25]],
  [["bandage", 0.75], ["coagulant", 0.25]],
  [["bandage_h", 0.8], ["bandage", 0.2]],
  [["bandage_h", 0.8], ["bandage", 0.2]],
  [["bandage_x", 0.75], ["bandage_h", 0.25]],
  [["bandage_x", 0.75], ["bandage_h", 0.25]]
];
var HERBS = ["herb_k", "herb_p", "herb_c", "herb_o", "herb_m", "herb_i"];
/* аптечки по силе — для автомата у капсулы */
var KIT_LADDER = ["medkit_s", "medkit_l", "nanomed", "medkit_r", "medkit_a", "medkit_m", "medkit_g", "medkit_i"];
/* сколько может лежать в одной комнате: глубже по блокам — больше (до семи);
   BONUS — сколько в среднем прибавляет сама глубина блока (дробная часть —
   вероятность ещё одной вещи) */
var MAX_BY_BLOCK = [0, 3, 4, 5, 6, 7];
var BONUS_BY_BLOCK = [0, 0, 0.3, 1, 1.5, 2];
/* что лежит в комнате: «med» — медицинская, «live» — жилая (там чаще травы) */
var KIND_W = { med: { kit: 0.65, band: 0.25, herb: 0.1 }, live: { kit: 0.25, band: 0.25, herb: 0.5 }, other: { kit: 0.4, band: 0.35, herb: 0.25 } };

function era(L) { return LAB.supplyEra ? LAB.supplyEra(L) : L <= 10 ? 0 : L <= 20 ? 1 : L <= 40 ? 2 : L <= 60 ? 3 : L <= 80 ? 4 : 5; }
function pickW(r, list) {
  var sum = 0, i;
  for (i = 0; i < list.length; i++) sum += list[i][1];
  var x = r.next ? r.next() * sum : Math.random() * sum;
  for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x <= 0) return list[i][0]; }
  return list[list.length - 1][0];
}
function roomDef(rm) { return (LAB.ROOMS && LAB.ROOMS[rm.type]) || {}; }
var MED_RE = /мед|лазарет|первой помощи|лекар|палат|операцион|изолятор|аптек|регенерац|санчаст|госпитал/i;
var LIVE_RE = /спальн|общежит|кухн|столов|отдыха|оранжере|теплиц|ночлеж|ночлег|казарм|кают|жил|бытов|кельи|келья|хижин|лежан|быт/i;
function roomKind(fl, rm) {
  var def = roomDef(rm);
  if (def.loot === "med" || MED_RE.test(rm.name || "") || fl.objs.some(function (o) { return o.room === rm.id && o.type === "medst"; })) return "med";
  if (def.loot === "food" || LIVE_RE.test(rm.name || "")) return "live";
  return "other";
}

/* ════════ НА ЭТАЖЕ (шаг 24 генератора) ════════ */
function place(ctx) {
  var fl = ctx.fl, L = ctx.L, F = ctx.F, W = LAB.W, H = LAB.H, T = LAB.T;
  var r = LAB.Rng(ctx.seed, "med26:" + L + ":" + F + ":" + ctx.attempt);
  var e = era(L), block = LAB.blockOf(L);
  var used = {};
  fl.items.forEach(function (it) { used[it.y * W + it.x] = 1; });
  fl.npcs.forEach(function (n) { used[n.y * W + n.x] = 1; });
  var foeAt = {};
  fl.foes.forEach(function (f) { foeAt[f.y * W + f.x] = 1; });
  function freeAt(x, y) { var k = y * W + x; return fl.t[k] === T.ROOM && !fl.objAt[k] && !used[k] && !foeAt[k]; }
  function cellsOf(rm) { var c = []; for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) if (freeAt(x, y)) c.push([x, y]); return c; }
  function nearCells(o, rm, rad) {
    var c = [];
    for (var dy = -rad; dy <= rad; dy++) for (var dx = -rad; dx <= rad; dx++) {
      var x = o.x + dx, y = o.y + dy;
      if ((dx || dy) && x >= rm.x0 && x <= rm.x1 && y >= rm.y0 && y <= rm.y1 && freeAt(x, y)) c.push([x, y]);
    }
    return c;
  }
  function addItemAt(it, rid, cell) { var got = ctx.addItem(it, rid, cell); if (got) used[got.y * W + got.x] = 1; return got; }

  /* помещения с капсулой (и криокапсула пробуждения на первом этаже) */
  var capRooms = {};
  fl.objs.forEach(function (o) { if ((o.type === "capsule" || o.type === "wake") && o.room != null && o.room >= 0 && fl.rooms[o.room]) (capRooms[o.room] = capRooms[o.room] || []).push(o); });

  /* 0. В помещении с капсулой — только такие точки: торговый терминал, автоматы
     с кофе, едой и напитками и торговцы переходят в ближайшее помещение той же
     зоны (туда, куда так же можно дойти) и остаются какими были. */
  var SHOP = { vending: 1, coffee: 1, snacks: 1, drinks: 1 };
  /* (3.7, нелогичность) торговец-робот — любой, у кого есть окно торговли (не целитель): прежде
     торговцем считался только продавец батарей, и Старый косарь оставался у капсулы */
  var trader = function (n) { if (n.robot) { var rd0 = LAB.ROBOT_NPC[n.type] || {}; return !!rd0.trade && !rd0.heal; } return !!(LAB.PROFS[n.prof] || {}).trade; };
  var ctr = function (rm) { return [(rm.x0 + rm.x1) / 2, (rm.y0 + rm.y1) / 2]; };
  /* (3.7, нелогичность) житель переходит только туда, где спокойно: без врагов, не к лестницам,
     лифту и прибытию, не в излучение и газ, не к телам и не за тайную дверь. Нет такого
     помещения — остаётся у капсулы (прежде торговцы попадали к отрядам тварей и стражам поста) */
  var foeRoom0 = {}, bodyRoom0 = {}, open0 = LAB.openRooms ? LAB.openRooms(fl) : null;
  fl.foes.forEach(function (f) { if (f.room != null && f.room >= 0) foeRoom0[f.room] = 1; var rf = fl.room[f.y * W + f.x]; if (rf >= 0) foeRoom0[rf] = 1; });
  fl.objs.forEach(function (o) { if (o.type === "corpse" && o.room != null && o.room >= 0) bodyRoom0[o.room] = 1; });
  var calmFor = function (i) { var m = fl.rooms[i]; return !!m && !foeRoom0[i] && i !== ctx.U && i !== fl.D && i !== fl.E && !m.rad && !m.gas && !bodyRoom0[i] && (!open0 || !!open0[i]); };
  Object.keys(capRooms).forEach(function (rk) {
    var rid = +rk, rm = fl.rooms[rid], c0 = ctr(rm);
    var away = fl.objs.filter(function (o) { return o.room === rid && SHOP[o.type]; }).concat(fl.npcs.filter(function (n) { return n.room === rid && trader(n); }));
    if (!away.length) return;
    var to = [];
    var pick = function (z) { fl.rooms.forEach(function (rm2, i) { if (rm2 && !capRooms[i] && i !== fl.secret && !rm2.hidden && rm2.zone === z) to.push(i); }); };
    pick(rm.zone);
    if (!to.length && rm.zone !== -1) pick(-1); /* за замком других помещений нет — в начальную зону, куда дойти можно всегда */
    /* сперва большие помещения этажа, потом кабинеты у коридоров; ближние — раньше */
    to.sort(function (a, b) { var p = ctr(fl.rooms[a]), q = ctr(fl.rooms[b]); return (fl.rooms[a].annex ? 1 : 0) - (fl.rooms[b].annex ? 1 : 0) || Math.abs(p[0] - c0[0]) + Math.abs(p[1] - c0[1]) - Math.abs(q[0] - c0[0]) - Math.abs(q[1] - c0[1]) || a - b; });
    away.forEach(function (t) {
      var npc = fl.npcs.indexOf(t) >= 0, to2 = npc ? to.filter(calmFor) : to;
      for (var i = 0; i < to2.length && i < 30; i++) if (ctx.moveTo(t, to2[i], npc)) { if (npc) used[t.y * W + t.x] = 1; return; }
    });
  });

  /* 1. Аптечный автомат у каждой капсулы: собраться перед коридором */
  Object.keys(capRooms).forEach(function (rk) {
    var rid = +rk, cap = capRooms[rk][0], rm = fl.rooms[rid];
    var near = r.shuffle(nearCells(cap, rm, 2));
    var o = ctx.addObj("medvend", rid, null, near.length ? near[0] : null);
    /* тесно: ещё раз — по свободным клеткам помещения, от ближних к капсуле к дальним */
    if (!o) {
      var cheb = function (c) { return Math.max(Math.abs(c[0] - cap.x), Math.abs(c[1] - cap.y)); };
      var all = cellsOf(rm).sort(function (a, b) { return cheb(a) - cheb(b) || a[1] - b[1] || a[0] - b[0]; });
      for (var i = 0; i < all.length && i < 12 && !o; i++) o = ctx.addObj("medvend", rid, null, all[i]);
    }
  });

  /* 2. У капсулы прибытия — энергобатареи (сколько — по режиму, при входе на этаж) */
  if (!(L === 1 && F === 1)) {
    var capU = fl.objs.filter(function (o) { return o.type === "capsule" && o.room === ctx.U; })[0];
    if (capU && fl.rooms[ctx.U]) {
      var nb = nearCells(capU, fl.rooms[ctx.U], 1);
      if (!nb.length) nb = nearCells(capU, fl.rooms[ctx.U], 2);
      if (nb.length) addItemAt({ kind: "ammo", ammo: "energy", n: 5, n0: 5, cap26: 1 }, ctx.U, r.pick(nb));
    }
  }

  /* 3. Лечебные припасы: каждая вторая комната по дороге от прибытия */
  var start = fl.rooms[ctx.U] || fl.rooms[0];
  var dist = new Int32Array(W * H).fill(-1);
  if (start) {
    var sx = (start.x0 + start.x1) >> 1, sy = (start.y0 + start.y1) >> 1, q = [sy * W + sx], qi = 0;
    dist[q[0]] = 0;
    while (qi < q.length) {
      var c = q[qi++], cx = c % W, cy = (c / W) | 0;
      var nbs = [c + 1, c - 1, c + W, c - W];
      for (var k = 0; k < 4; k++) {
        var nk = nbs[k], nx = nk % W, ny = (nk / W) | 0;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
        if (dist[nk] >= 0 || fl.t[nk] === T.WALL) continue;
        dist[nk] = dist[c] + 1; q.push(nk);
      }
    }
  }
  var cand = [];
  fl.rooms.forEach(function (rm, i) {
    if (!rm || capRooms[i] || i === fl.secret || rm.hidden) return;
    var kind = roomDef(rm).kind;
    if (kind === "supply" || kind === "trial") return;
    var d = 1e9;
    for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) { var dv = dist[y * W + x]; if (dv >= 0 && dv < d) d = dv; }
    cand.push({ rm: rm, d: d });
  });
  cand.sort(function (a, b) { return a.d - b.d || a.rm.id - b.rm.id; });
  var maxB = MAX_BY_BLOCK[Math.min(5, block)] || 3;
  for (var ci = 1; ci < cand.length; ci += 2) {
    var rm = cand[ci].rm, cells = cellsOf(rm);
    if (!cells.length) continue;
    var kd = roomKind(fl, rm), area = (rm.x1 - rm.x0 + 1) * (rm.y1 - rm.y0 + 1);
    var guards = 0;
    fl.foes.forEach(function (f) { if (fl.room[f.y * W + f.x] === rm.id) guards++; });
    var maxN = Math.min(7, maxB + (kd === "med" ? 1 : 0));
    /* одна-две вещи; больше — в медицинской, большой, охраняемой комнате, вдали от прибытия и глубже по блокам */
    var bb = BONUS_BY_BLOCK[Math.min(5, block)] || 0, bonus = Math.floor(bb) + (r.chance(bb - Math.floor(bb)) ? 1 : 0);
    var n = 1 + (r.chance(0.35) ? 1 : 0) + (kd === "med" ? 2 : 0) + (area >= 30 ? 1 : 0) + (guards >= 3 ? 1 : 0) + (ci > cand.length * 0.75 ? 1 : 0) + bonus;
    n = Math.max(1, Math.min(maxN, n));
    var w = KIND_W[kd], what = pickW(r, [["kit", w.kit], ["band", w.band], ["herb", w.herb]]), id;
    if (what === "kit") id = pickW(r, KITS[e].filter(function (x) { return !x[2] || x[2] <= L; }));
    else if (what === "band") id = pickW(r, BANDS[e]);
    else id = e > 0 && r.chance(0.2) ? HERBS[e - 1] : HERBS[e];
    if (!LAB.ITEMS[id]) id = "medkit_s";
    addItemAt({ kind: "item", item: id, n: n, n0: n, med26: 1 }, rm.id, r.pick(cells));
  }

  /* 4. Целитель — свой на каждой глубине; встаёт в медицинской комнате, нет её — в тихой.
     (3.7, нелогичность) Не в посту дезактивации (душевая — не врачебный кабинет: прежде туда
     вставала половина целителей — охрана ОКО обходит такие посты), не в излучении и газе
     (пока лечат, облучаешься), не среди тел и не за тайной дверью; главные помещения
     без врагов — раньше кабинетов у коридоров. */
  if (L === 1 && F <= 2) return;
  var med = [], quiet = [], medA = [], quietA = [], open4 = open0;
  fl.rooms.forEach(function (rm, i) {
    if (!rm || capRooms[i] || i === fl.secret || rm.hidden) return;
    var kind = roomDef(rm).kind;
    if (kind === "supply" || kind === "trial" || kind === "hazard" || kind === "decon") return;
    /* и не у лестниц, лифта и прибытия: там посты ОКО и их смена */
    if (rm.rad || rm.gas || bodyRoom0[i] || (open4 && !open4[i]) || i === ctx.U || i === fl.D || i === fl.E) return;
    var foes = fl.foes.some(function (f) { return f.room === rm.id || fl.room[f.y * W + f.x] === rm.id; });
    if (foes || !cellsOf(rm).length) return;
    var isMed = roomKind(fl, rm) === "med";
    if (rm.annex) (isMed ? medA : quietA).push(rm); else (isMed ? med : quiet).push(rm);
  });
  if (!r.chance(med.length + medA.length >= 3 ? 0.7 : 0.5)) return;
  var spot = med.length ? r.pick(med) : quiet.length ? r.pick(quiet) : medA.length ? r.pick(medA) : quietA.length ? r.pick(quietA) : null;
  if (!spot) return;
  var pid = r.pick(BY_ERA[e]);
  /* (3.7, нелогичность) не второй такой же на этаже: целитель-медик рядом с выжившим медиком
     рассказывал те же истории, бывало и два медицинских дроида — тогда другой целитель глубины */
  var dupHeal = function (p) {
    var P0 = HEALERS[p]; if (!P0) return true;
    if (P0.kind === "human") { var pf0 = P0.prof || "Медик"; return fl.npcs.some(function (q) { return !q.robot && q.prof === pf0; }); }
    var ty0 = LAB.ROBOT_NPC[p] ? p : "meddroid";
    return fl.npcs.some(function (q) { return q.robot && q.type === ty0; });
  };
  if (dupHeal(pid)) { var alt = BY_ERA[e].filter(function (p) { return p !== pid && !dupHeal(p); }); if (!alt.length) return; pid = alt[0]; }
  var cell = null;
  for (var tries = 0; tries < 8 && !cell; tries++) { var fc = ctx.freeCell(spot.id); if (fc && freeAt(fc[0], fc[1])) cell = fc; }
  if (!cell) return;
  var npc = makeHealer(r, pid, L, F, spot, cell, fl);
  if (npc) { fl.npcs.push(npc); used[cell[1] * W + cell[0]] = 1; }
}

/* ════════ ЦЕЛИТЕЛИ ════════
   kind: machine — машина (голос робота), human — человек, alive — живое,
   но не человек. k — наценка к цене лечения; pay — чем ещё берёт плату;
   svc — что ещё умеет, кроме лечения ран: кровотечение и отравление умеют
   все. Цена — от недостающего здоровья, глубины и режима (priceK). */
var HEALERS = {
  meddroid: { n: "Медицинский дроид", kind: "machine", k: 1, pay: "bat", svc: "tox" },
  droid:    { kind: "machine", k: 1, pay: "bat", svc: "tox" },
  medic:    { kind: "human", k: 0.9, pay: "food", svc: "" },
  rescuer:  { prof: "Горноспасатель", kind: "human", k: 0.95, pay: "parts", svc: "tox" },
  hive:     { n: "Улей-лекарь", kind: "alive", k: 0.85, pay: "gel", svc: "" },
  mirror:   { n: "Зеркальный лекарь", kind: "alive", k: 1, pay: "nerve", svc: "neuro" },
  surgeon:  { n: "Хирургический автомат «Скальпель»", kind: "machine", k: 1.1, pay: "parts", svc: "tox rad" },
  keeper:   { prof: "Хранительница колодца", g: "f", kind: "human", k: 1.05, pay: "time", svc: "tox rad neuro" },
  /* (3.7, нелогичность) дроид-смотритель и «Мята» лечат по-своему, а не как безымянный дроид
     «Протокол помощи активен»: смотритель снимает тяжесть тишиной, «Мята» — соком первого дерева */
  niche:    { n: "Дроид-смотритель тихих ниш", kind: "machine", k: 0.95, pay: "bat", svc: "neuro" },
  mint:     { n: "Садовник «Мята»", kind: "machine", k: 0.95, pay: "gel", svc: "tox" }
};
var BY_ERA = [["meddroid", "medic"], ["rescuer", "meddroid"], ["hive", "medic"], ["mirror", "medic"], ["surgeon", "medic"], ["keeper", "medic"]];
/* слова при встрече (окно лечения) и в разговоре */
var GREET = {
  meddroid: "Сканирую. Повреждения обнаружены. Лечение — за кредиты или энергобатареи: мне нужен заряд.",
  droid: "Протокол помощи активен. Лечение — за кредиты или энергобатареи.",
  medic: "Садитесь, посмотрю. Кредиты возьму, а лучше — еду: под землёй ею не разбрасываются.",
  rescuer: "Горноспасатель смены. Вытащу и вас. Плата — кредиты или детали: насосы у нас дышат на ладан.",
  hive: "Тёплый улей в стене гудит тише: пчёлы-химеры узнают вас по запаху крови. Улей лечит за кредиты или за биогель — им он кормит личинок.",
  mirror: "Ваше отражение в белом халате улыбается: «Ваши раны я знаю лучше вас — они же мои. Кредиты возьму, если вам так спокойнее, но лучше отдайте немного покоя — и я заберу боль».",
  surgeon: "Протокол «Скальпель». Пациент, лягте на стол. Оплата — кредиты или детали.",
  keeper: "У колодца тишины время течёт медленно. Ложитесь — и раны затянутся, пока идут часы. Беру кредиты или время: его здесь слишком много.",
  niche: "Тише. Ложитесь, я перевяжу. Лечение — за кредиты или энергобатареи: заряд нужен, чтобы обходить ниши. Тяжесть в голове тоже сниму — тишиной.",
  mint: "Садовник «Мята». Полив, перевязка, сок первого дерева: он и кровь от отравы чистит. Лечу за кредиты или за биогель — им я кормлю дерево."
};
var LINES = {
  rescuer: ["Под землёй главное — не паниковать и считать вдохи.", "Мы вытаскивали людей из-под завалов, а теперь вот — вас. Работа та же.", "Детали для насоса — лучшая плата. Кредитами тут сыт не будешь.", "Обвал слышно за минуту: сначала сыплется пыль, потом стонет крепь."],
  hive: ["Из сот сочится тёплый мёд. Улей лечит — и просит биогеля.", "Говорят, улей помнит каждого, кого вылечил. И каждого, кто ему не заплатил.", "Пчёлы-химеры садятся на рану и замирают. Боль уходит, будто её вынули."],
  mirror: ["«Не смотрите мне в глаза слишком долго. Отражения устают».", "«Вы каждый раз приходите с новыми ранами. Я храню их все».", "«Покой — дорогая плата. Но раны — дороже»."],
  surgeon: ["Анестезия не предусмотрена. Это не шутка. Простите.", "Сервоприводы принимаются с благодарностью.", "Пациент номер семь. Ваша карта заполнена на треть. Продолжайте жить."],
  keeper: ["Река без берегов помнит всех, кто пил из неё.", "Деньги беру, но охотнее — время: его здесь слишком много.", "Колодец молчит, когда рядом ложится раненый. Он слушает."]
};
/* люди-целители — профессии выживших (в случайных встречах этажа их нет: nosurv) */
put(LAB.PROFS, {
  "Горноспасатель": { trade: "med", beacon: "npc_med", heal: "rescuer", arc: "med", nosurv: true },
  "Хранительница колодца": { trade: "med", beacon: "npc_med", heal: "keeper", arc: "med", nosurv: true }
});
LAB.STORIES = LAB.STORIES || {};
put(LAB.STORIES, { "Горноспасатель": LINES.rescuer, "Хранительница колодца": LINES.keeper });
/* машины и живые целители — как дружественные роботы (у них своё окно) */
put(LAB.ROBOT_NPC, {
  hive: { n: "Улей-лекарь", trade: "med", beacon: "npc_med", alive: true, heal: "hive", bye: "Улей провожает вас ровным гулом.", desc: "Тёплый живой улей в стене: соты, мёд и пчёлы-химеры, которые садятся на раны." },
  mirror: { n: "Зеркальный лекарь", trade: "med", beacon: "npc_med", alive: true, heal: "mirror", bye: "Отражение кивает вам вслед и снова замирает в стекле.", desc: "Ваше отражение в белом халате: стоит в старом зеркале и ждёт пациента." },
  surgeon: { n: "Хирургический автомат «Скальпель»", trade: "med", beacon: "npc_med", heal: "surgeon", bye: "Протокол «Скальпель» завершён. Следующий пациент.", desc: "Операционный стол на шарнирах с дюжиной манипуляторов. Прошивку ОКО он сжёг сам." }
});
if (LAB.ROBOT_NPC && LAB.ROBOT_NPC.meddroid && !LAB.ROBOT_NPC.meddroid.heal) LAB.ROBOT_NPC.meddroid.heal = "meddroid";
LAB.ROBOT_LINES = LAB.ROBOT_LINES || {};
put(LAB.ROBOT_LINES, { hive: LINES.hive, mirror: LINES.mirror, surgeon: LINES.surgeon });

function makeHealer(r, pid, L, F, rm, c, fl) {
  var P = HEALERS[pid];
  if (!P) return null;
  var id = "n" + fl.npcs.length, key = L + "-" + F + "-h";
  if (P.kind === "human") {
    var prof = P.prof || "Медик";
    var female = P.g === "f" ? true : P.g === "m" ? false : r.chance(0.5);
    var first = r.pick(female ? LAB.NAMES.f : LAB.NAMES.m), last = r.pick(female ? LAB.NAMES.sf : LAB.NAMES.sm);
    /* (3.7, нелогичность) не тёзка того, кто уже живёт на этаже */
    var nameTaken = function () { return fl.npcs.some(function (q) { return q.n === first + " " + last; }); };
    for (var tn = 0; tn < 20 && nameTaken(); tn++) { first = r.pick(female ? LAB.NAMES.f : LAB.NAMES.m); last = r.pick(female ? LAB.NAMES.sf : LAB.NAMES.sm); }
    return { id: id, robot: false, n: first + " " + last, first: first, last: last, female: female, prof: prof, heal: pid,
      x: c[0], y: c[1], room: rm.id, tier: 1 + Math.floor(L / 3), key: key, life: r.int(0, 99), view: r.int(0, 99) };
  }
  var type = LAB.ROBOT_NPC[pid] ? pid : "meddroid";
  return { id: id, robot: true, type: type, n: LAB.ROBOT_NPC[type].n, heal: pid, x: c[0], y: c[1], room: rm.id, key: key };
}

/* ════════ ПРИ ВХОДЕ НА ЭТАЖ ════════
   Сколько лежит — по режиму сложности: лечебные припасы (med) и батареи
   у капсулы прибытия (capBat). Этаж строится без режима, число — здесь. */
function enterFloor(fl) {
  if (!fl || !fl.items) return;
  var dk = LAB.dk ? LAB.dk() : {};
  fl.items.forEach(function (it) {
    if (it.med26) it.n = Math.max(1, Math.min(7, Math.round((it.n0 || it.n || 1) * (dk.med || 1))));
    else if (it.cap26) it.n = dk.capBat || 5;
  });
}

/* ════════ ОКНА (игра) ════════ */
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function say(t, o) { LAB.say(t, o); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return LAB.plural(n, a, b, c); }
function pk() { return gm() && gm().priceK ? gm().priceK() : 1; }
function cr(n) { return n + " " + pl(n, "кредит", "кредита", "кредитов"); }

/* ── аптечный автомат у капсулы: только аптечки и энергобатареи ── */
function kitsFor(L) {
  var have = KIT_LADDER.filter(function (id) { return LAB.ITEMS[id] && (LAB.ITEMS[id].depth || 1) <= L; });
  var top = have.slice(-2), out = ["medkit_s"];
  top.forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); });
  return out;
}
function vendPrice(id) {
  var base = id === "ammo:energy" ? (LAB.AMMO.energy.price || 30) : LAB.ITEMS[id].price;
  return Math.max(2, Math.round(base * pk()));
}
function vendItems() {
  /* (3.7, нелогичность) строка-сведение — не «недоступный пункт»: чтец не добавляет «недоступно» */
  var g = G(), info0 = "У вас " + cr(g.credits || 0) + ". Аптечек с собой: " + kitsFor(g.L).map(function (id) { return g.inv[id] || 0; }).reduce(function (a, b) { return a + b; }, 0) + ", энергобатарей: " + (g.ammo.energy || 0) + ".";
  var items = [{ label: info0, info: true, keep: true, fn: function () { say(info0); } }];
  kitsFor(g.L).forEach(function (id) {
    var d = LAB.ITEMS[id], p = vendPrice(id);
    items.push({ label: d.n + " — " + cr(p) + ". " + d.desc, fn: function () { gm().buy(id, p); } });
  });
  var pb = vendPrice("ammo:energy");
  items.push({ label: LAB.AMMO.energy.n + " — " + cr(pb) + ". Полный заряд энергетического оружия.", fn: function () { gm().buy("ammo:energy", pb); } });
  return items;
}
function vendMenu(o) {
  A("play", "vend");
  UIx("menu", o ? "Аптечный автомат" : "Аптечный отсек капсулы", vendItems(), { keep: true, rebuild: vendItems });
}

/* ── целитель ── */
/* (3.7, нелогичность) лечит тот, у кого это записано (heal у жителя, профессии или робота): прежде
   врачом считался любой, кто торгует лекарствами, — поселенец «Садитесь, посмотрю» и дрон «Голубь».
   Робот с лекарствами без целителя — торговец (окно «Торговля», game.js). */
function profileOf(n) {
  if (!n) return null;
  if (n.heal && HEALERS[n.heal]) return n.heal;
  if (n.robot) {
    var rd = LAB.ROBOT_NPC[n.type] || {};
    return rd.heal && HEALERS[rd.heal] ? rd.heal : null;
  }
  var pd = LAB.PROFS[n.prof] || {};
  return pd.heal && HEALERS[pd.heal] ? pd.heal : null;
}
function title(n) { return gm().npcName ? gm().npcName(n) : n.n; }
/* сколько стоит в кредитах: от недостающего здоровья, глубины и режима */
/* (3.5) медик-человек уступает в цене тому, у кого харизма выше; машине и улью всё равно */
/* харизма и скидка «Сопротивления» — у целителей-людей */
function chaP(P) { return P.kind === "human" && gm().chaK ? gm().chaK() * (gm().resK ? gm().resK() : 1) : 1; }
function healCost(P, hp) { return Math.max(3, Math.round(hp * 0.6 * pk() * P.k * chaP(P))); }
function svcCost(P, base) { return Math.max(2, Math.round(base * pk() * P.k * chaP(P))); }
function partHp() { var g = G(); return Math.min(g.hpMax - g.hp, Math.max(25, Math.round(g.hpMax * 0.35))); }
/* Чем ещё платят: возвращает { ok, text, take } на сумму в кредитах (credits) или на столько здоровья (hp). */
var FOOD = ["ration", "stew", "mre", "fishcan", "protein", "crackers", "noodles", "nuts", "choco", "bread", "porridge", "sausage", "glucose"];
var GEL = ["gel", "reagent"];
var PARTS = ["scrap", "wire", "chip", "relay", "cap", "cell", "servo", "lens", "magnet", "optic"];
/* (3.7, нелогичность) еда и детали в оплату идут по цене, по которой их продают жители (с харизмой
   и скидкой «Сопротивления»): прежде — по полной, и купленное у повара дешевле платило за лечение дороже */
function npcK() { var m = gm(); return 0.9 * (m && m.chaK ? m.chaK() : 1) * (m && m.resK ? m.resK() : 1); }
function goodsPay(list, credits) {
  var g = G(), need = credits, plan = {}, ids = list.filter(function (id) { return LAB.ITEMS[id] && LAB.ITEMS[id].price; }), nk = npcK();
  for (var i = 0; i < ids.length && need > 0; i++) {
    var id = ids[i], v = Math.max(1, LAB.ITEMS[id].price * pk() * nk), have = g.inv[id] || 0;
    while (need > 0 && have > (plan[id] || 0)) { plan[id] = (plan[id] || 0) + 1; need -= v; }
  }
  var parts = Object.keys(plan).map(function (id) { return LAB.ITEMS[id].n + " — " + plan[id]; });
  return { ok: need <= 0, text: need <= 0 ? parts.join(", ") : "", short: need > 0,
    take: function () { for (var id in plan) g.inv[id] -= plan[id]; } };
}
/* Плата «не кредитами» тоже растёт с глубиной и по режиму: кредиты дорожают
   сами (priceK), а батареи, еда, детали, покой и время — по этой мере. */
function altK() { var dk = LAB.dk ? LAB.dk() : {}; return (dk.price || 1) * (1 + 0.1 * era(G().L)); }
function altPay(P, credits, hp) {
  var g = G(), b = g.body || {}, ak = altK(), cr0 = credits;
  credits = credits * ak;
  if (P.pay === "bat") {
    var nb = Math.max(1, Math.ceil(credits / ((LAB.AMMO.energy.price || 30) * pk()))), hv = g.ammo.energy || 0;
    return { ok: hv >= nb, label: "энергобатареями: " + nb + " " + pl(nb, "батарея", "батареи", "батарей") + " (у вас " + hv + ")", take: function () { g.ammo.energy -= nb; } };
  }
  if (P.pay === "food" || P.pay === "gel" || P.pay === "parts") {
    var gp = goodsPay(P.pay === "food" ? FOOD : P.pay === "gel" ? GEL : PARTS, credits);
    var what = P.pay === "food" ? "едой" : P.pay === "gel" ? "биогелем и реагентами" : "деталями";
    return { ok: gp.ok, label: what + (gp.ok ? ": " + gp.text : ": у вас не хватает"), take: gp.take };
  }
  /* (3.5) покой — это и силы: нервы успокаиваются сами за пару минут, а бодрость — только
     сном, отдыхом и кофе; прежде платили одной нейронагрузкой — и лечились снова и снова */
  if (P.pay === "nerve") {
    var cost = Math.max(5, Math.min(60, Math.round(hp / g.hpMax * 50 * ak))), now = Math.round(b.neuro || 0), wk = Math.ceil(cost / 2), wn = Math.round(b.wake == null ? 100 : b.wake);
    var nOk = now + cost <= 85, wOk = wn - wk >= 5;
    /* (3.7, нелогичность) отданный покой — долг перед отражением: снять ту же нейронагрузку у него
       кредитами стоит не меньше, чем лечение кредитами (nerveDebt); долг тает вместе с нагрузкой
       (game.js, bodyTick). Прежде «покой, потом кредиты за покой» выходило вдвое дешевле лечения */
    return { ok: nOk && wOk, label: "своим покоем: нейронагрузка плюс " + cost + " (сейчас " + now + (nOk ? "" : ", это слишком много") + "), бодрость минус " + wk + " (сейчас " + wn + (wOk ? "" : ", сил не хватит") + ")",
      take: function () { b.neuro = Math.min(100, (b.neuro || 0) + cost); b.wake = Math.max(0, (b.wake == null ? 100 : b.wake) - wk); b.nerveN = (b.nerveN || 0) + cost; b.nerveCr = (b.nerveCr || 0) + cr0; } };
  }
  /* (3.5) время идёт наяву: сытость и бодрость тратятся (прежде — как во сне в капсуле,
     даром); и пока на этаже тревога или рядом враг, часами лечиться некогда */
  if (P.pay === "time") {
    var h = Math.max(1, Math.min(12, Math.ceil(hp / g.hpMax * 6 * ak))), rb = gm().restBlock ? gm().restBlock() : null;
    return { ok: !rb, label: "временем: лечение займёт " + h + " " + pl(h, "час", "часа", "часов") + (rb ? " — " + rb.replace(/^Не до отдыха: /, "сейчас нельзя: ") : ""), take: function () { if (gm().advanceTime) gm().advanceTime(h * 60, false); } };
  }
  return null;
}
function healNow(hp, full) {
  var g = G(), before = g.hp;
  g.hp = Math.min(g.hpMax, g.hp + hp);
  if (full) { g.st.bleed = 0; g.st.poison = 0; }
  A("play", "heal");
  if (LAB.oko && LAB.oko.react) LAB.oko.react("heal");
  return g.hp - before;
}
function payCredits(p) {
  var g = G();
  if ((g.credits || 0) < p) { if (LAB.UI) LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + (g.credits || 0) + "."); return false; }
  g.credits -= p;
  return true;
}
/* (3.7, нелогичность) в бою не лечат: окно ставит мир на паузу, и медик вылечивал до конца, пока
   охранный робот шёл на вас в двух клетках (оплату временем и переодевание бой и прежде не пускал) */
function fightNow() {
  if (!(LAB.combat && LAB.combat.danger && LAB.combat.danger())) return false;
  if (LAB.UI) LAB.UI.error();
  say("Рядом враги — не до лечения.");
  return true;
}
/* долг за отданный отражению покой: снять ту же нейронагрузку стоит не меньше лечения кредитами */
function nerveDebt(P, b) {
  if (P.pay !== "nerve" || !(b.nerveN > 0) || !(b.nerveCr > 0)) return 0;
  return Math.round(b.nerveCr * Math.min(1, (b.neuro || 0) / b.nerveN));
}
function healItems(n) {
  var pid = profileOf(n), P = HEALERS[pid], g = G(), b = g.body || {}, items = [];
  var miss = g.hpMax - g.hp, part = partHp(), svc = " " + P.svc + " ";
  /* (3.7, нелогичность) строка-сведение, а не «недоступный пункт» */
  var info0 = "Здоровье " + g.hp + " из " + g.hpMax + ". У вас " + cr(g.credits || 0) + ".";
  items.push({ label: info0, info: true, keep: true, fn: function () { say(info0); } });
  if (miss > 0) {
    var pf = healCost(P, miss);
    items.push({ label: "Вылечить полностью: плюс " + miss + " здоровья, кровотечение и отравление — " + cr(pf), fn: function () {
      if (!payCredits(pf)) return;
      var got = healNow(miss, true);
      say("Готово: плюс " + got + " здоровья, теперь " + G().hp + " из " + G().hpMax + ". Осталось " + cr(G().credits) + ".");
      done();
    } });
    if (miss > part) {
      var pp = healCost(P, part);
      items.push({ label: "Подлечить: плюс " + part + " здоровья — " + cr(pp), fn: function () {
        if (!payCredits(pp)) return;
        var got = healNow(part, false);
        say("Плюс " + got + " здоровья, теперь " + G().hp + " из " + G().hpMax + ". Осталось " + cr(G().credits) + ".");
        done();
      } });
    }
    var af = altPay(P, pf, miss);
    if (af) items.push({ label: "Вылечить полностью " + af.label, fn: function () {
      var a2 = altPay(P, healCost(P, G().hpMax - G().hp), G().hpMax - G().hp);
      if (!a2.ok) { if (LAB.UI) LAB.UI.error(); say("Так не выйдет: " + a2.label + "."); return; }
      a2.take();
      var got = healNow(G().hpMax - G().hp, true);
      say("Готово: плюс " + got + " здоровья, теперь " + G().hp + " из " + G().hpMax + ".");
      done();
    } });
    if (af && miss > part) {
      var ap = altPay(P, healCost(P, part), part);
      items.push({ label: "Подлечить " + ap.label, fn: function () {
        var p2 = partHp(), a3 = altPay(P, healCost(P, p2), p2);
        if (!a3.ok) { if (LAB.UI) LAB.UI.error(); say("Так не выйдет: " + a3.label + "."); return; }
        a3.take();
        var got = healNow(p2, false);
        say("Плюс " + got + " здоровья, теперь " + G().hp + " из " + G().hpMax + ".");
        done();
      } });
    }
  }
  if (g.st.bleed) { var pb = svcCost(P, 12); items.push({ label: "Остановить кровотечение — " + cr(pb), fn: function () { if (!payCredits(pb)) return; G().st.bleed = 0; A("play", "bandage_tear"); say("Кровотечение остановлено."); done(); } }); }
  if (g.st.poison) { var po = svcCost(P, 15); items.push({ label: "Снять отравление — " + cr(po), fn: function () { if (!payCredits(po)) return; G().st.poison = 0; A("play", "inject"); say("Отравление снято."); done(); } }); }
  if (svc.indexOf(" tox ") >= 0 && (b.tox || 0) >= 5) { var pt = svcCost(P, 8 + b.tox * 0.3); items.push({ label: "Вывести токсины: " + Math.round(b.tox) + " — " + cr(pt), fn: function () { if (!payCredits(pt)) return; b.tox = 0; b.lv = {}; A("play", "heal"); say("Кровь очищена: токсинов нет."); done(); } }); }
  if (svc.indexOf(" rad ") >= 0 && (b.rad || 0) >= 5) { var pr = svcCost(P, 10 + b.rad * 0.35); items.push({ label: "Вывести облучение: " + Math.round(b.rad) + " — " + cr(pr), fn: function () { if (!payCredits(pr)) return; b.rad = 0; A("play", "heal"); say("Лучевая нагрузка снята."); done(); } }); }
  /* (3.0) мутаген: капельница с ингибитором — до сорока за раз; дешевле антимутагена не бывает */
  if (svc.indexOf(" tox ") >= 0 && (b.mut || 0) >= 5) { var pm = svcCost(P, 15 + b.mut * 0.5); items.push({ label: "Вывести мутаген: мутация " + Math.round(b.mut) + ", минус сорок за раз — " + cr(pm), fn: function () { if (!payCredits(pm)) return; b.mut = Math.max(0, b.mut - 40); A("play", "inject"); say("Капельница с ингибитором: мутация " + Math.round(b.mut) + "."); done(); } }); }
  if (svc.indexOf(" neuro ") >= 0 && (b.neuro || 0) >= 10) { var pn = svcCost(P, 8 + b.neuro * 0.3) + nerveDebt(P, b); items.push({ label: "Снять нейронагрузку: " + Math.round(b.neuro) + " — " + cr(pn), fn: function () { if (!payCredits(pn)) return; b.neuro = 0; b.nerveN = 0; b.nerveCr = 0; A("play", "heal"); say("Нейронагрузка снята: в голове тихо."); done(); } }); }
  /* (3.7, нелогичность) «здоровы» — только когда лечить и правда нечего: прежде строка стояла рядом
     с «Вывести токсины» и «Вывести мутаген» */
  if (items.length === 1) items.push({ label: "Вы здоровы: лечить нечего", info: true, keep: true, fn: function () { say("Вы здоровы: лечить нечего."); } });
  /* в бою — ни одной услуги */
  items.forEach(function (it, i) { if (i === 0 || it.info) return; var f0 = it.fn; it.fn = function () { if (fightNow()) return; f0(); }; });
  items.push({ label: "Отойти", fn: function () {} });
  return items;
}
function done() { UIx("refresh"); if (gm().autosaveSoon) gm().autosaveSoon(); }
function healMenu(n) {
  var pid = profileOf(n);
  if (!pid) return false;
  if (fightNow()) return true;
  var greet = GREET[pid] || GREET.droid, P = HEALERS[pid];
  var build = function () { return healItems(n); };
  /* (3.7, нелогичность) машина здоровается голосом машины: прежде её приветствие читал обычный голос окна */
  if (P.kind === "machine") { A("play", "term_ok"); say(greet, { robot: true }); UIx("menu", "Лечение: " + title(n), build(), { keep: true, rebuild: build }); }
  else UIx("menu", "Лечение: " + title(n), build(), { keep: true, rebuild: build, intro: greet });
  return true;
}

LAB.medic = {
  place: place, enterFloor: enterFloor, vendMenu: vendMenu, vendItems: vendItems, kitsFor: kitsFor, vendPrice: vendPrice,
  healMenu: healMenu, healItems: healItems, profileOf: profileOf, healCost: healCost, altPay: altPay, altK: altK,
  HEALERS: HEALERS, BY_ERA: BY_ERA, KITS: KITS, BANDS: BANDS, HERBS: HERBS, KIT_LADDER: KIT_LADDER, MAX_BY_BLOCK: MAX_BY_BLOCK, BONUS_BY_BLOCK: BONUS_BY_BLOCK, era: era
};
})();
