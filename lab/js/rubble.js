/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — завалы на лестницах (3.0, просьба автора).
   Лестница между соседними этажами бывает завалена (план комплекса,
   world.js). Лифт возит только туда, где вы уже были, поэтому завал
   разбирают на месте — с любого из двух этажей:
   • руками — подход за подходом (сколько — по режиму сложности, dig):
     удары по бетону и арматуре слышат враги рядом и акустические датчики
     ОКО; машины на шум ОКО шлёт по режиму (digW); с монтировкой подходов
     меньше, но звон слышно дальше; сильным — на подход меньше; работа
     отнимает бодрость и время;
   • гидравлическим домкратом — два подхода, почти без шума; домкрат
     остаётся держать плиту;
   • подрывным зарядом — сразу, но на весь этаж; запал горит шесть секунд,
     на два шага вокруг задевает обломками — отойдите.
   Домкрат или заряд всегда лежит на этом же этаже — там, куда можно
   дойти, не открывая лишних замков (world.js, шаг 26); заряд делают и сами:
   пиротехника на химическом столе (chem.js). Тем же зарядом сносят и завал
   в проходе — вместо позитронной установки.
   Из-под обломков всегда что-то достаётся, и только полезное: детали,
   батареи, лекарства, кредиты, сырьё для химии, записка, ценность, а то и
   запасной домкрат или заряд; взрыв часть находок губит. Находки — своим
   потоком случайностей от зерна игры: перезагрузка их не меняет.
   В пошаговом бою подход — два хода, домкрат и закладка заряда — ход.
   Состояние — G.rub["уровень-этаж"], этаж — верхний из двух: p — сколько
   разобрано (из 100), jack — домкрат стоит, armed — заряд заложен, done —
   проход свободен, loot — находки выданы.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function dk() { return LAB.dk ? LAB.dk() : {}; }
function cb() { return LAB.combat; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function cheb(o) { var g = G(); return Math.max(Math.abs(g.x - o.x), Math.abs(g.y - o.y)); }
function turns(n) { var c = cb(); if (c && c.spendTurns) c.spendTurns(n, "dig"); }

var STAGE_MS = { hands: 2800, bar: 2400, jack: 3000 };
var FUSE_MS = 6000;
var work = null;  /* идущий подход: { k, how, g, L, F, x, y, hp, o } */
var fuse = {};    /* горящие запалы: ключ → таймер */

/* ── состояние ── */
function key(o) { var g = G(); return g.L + "-" + (o.type === "stairs_down" ? g.F : g.F - 1); }
function peek(o) { var g = G(); return g.rub && g.rub[key(o)]; }
function st(o) { var g = G(); if (!g.rub) g.rub = {}; var k = key(o); return g.rub[k] || (g.rub[k] = { p: 0 }); }
function blocked(o) {
  if (!o || !o.blocked || (o.type !== "stairs_down" && o.type !== "stairs_up")) return false;
  var s = peek(o);
  return !(s && s.done);
}
function stairsNear() {
  var fl = CUR() && CUR().fl;
  if (!fl) return null;
  for (var i = 0; i < fl.objs.length; i++) { var o = fl.objs[i]; if (blocked(o) && cheb(o) <= 1) return o; }
  return null;
}
function doorNear() {
  var fl = CUR() && CUR().fl, fs = CUR() && CUR().fs;
  if (!fl || !fs || fs.rubble) return null;
  for (var i = 0; i < fl.doors.length; i++) { var d = fl.doors[i]; if (d.lock && d.lock.type === "rubble" && cheb(d) <= 1) return d; }
  return null;
}

/* ── чем разбирать ── */
function hasBar() { return G().weapons.some(function (w) { return w.base === "crowbar"; }); }
function tool() { return hasBar() ? "bar" : "hands"; }
function stages(how) {
  if (how === "jack") return 2;
  var n = Math.max(2, dk().dig || 6);
  if (how === "bar") n = Math.max(2, Math.round(n * 0.6));
  if ((G().str || 0) >= 14) n = Math.max(2, n - 1);
  return n;
}
function left(o, how) { var s = peek(o) || { p: 0 }; return Math.max(1, Math.ceil((100 - (s.p || 0)) / (100 / stages(how)) - 0.001)); }
function pct(p) { var n = Math.round(p); return n + " " + pl(n, "процент", "процента", "процентов"); }
function kitHere() {
  var its = gm().floorItems ? gm().floorItems() : [];
  for (var i = 0; i < its.length; i++) if (its[i].rub && its[i].kind === "item") return its[i].item;
  return "";
}
function blastOk() { return !!(LAB.chem && LAB.chem.blastOk && LAB.chem.blastOk()); }

/* ── окно у завала ── */
function title(o) { return (o.type === "stairs_down" ? "Лестница вниз" : "Лестница вверх") + " завалена"; }
function infoLine(o) {
  var s = peek(o) || { p: 0 }, parts = [];
  parts.push(s.armed ? "Под плитой заложен подрывной заряд." : s.jack ? "Под плитой стоит домкрат — его осталось докачать." : s.p > 0 ? "Завал разобран на " + pct(s.p) + "." : "Пролёт завален плитами, бетоном и арматурой.");
  var have = [];
  if (G().inv.rub_jack > 0) have.push("домкрат");
  if (blastOk()) have.push("подрывной заряд");
  if (have.length) parts.push("У вас есть " + have.join(" и ") + ".");
  else { var kit = kitHere(); if (kit) parts.push("Где-то на этом этаже лежит " + (kit === "rub_jack" ? "гидравлический домкрат" : "подрывной заряд") + "."); }
  if (!s.jack && !s.armed) { var n = left(o, tool()); parts.push((tool() === "bar" ? "Монтировкой" : "Руками") + " — ещё " + n + " " + pl(n, "подход", "подхода", "подходов") + ", шумно: ОКО услышит."); }
  return parts.join(" ");
}
function items(o) {
  var s = peek(o) || { p: 0 }, out = [];
  out.push({ label: infoLine(o), info: true, keep: true, fn: function () { say(infoLine(o)); } });
  if (s.jack) out.push({ label: "Качать домкрат дальше: тихо", fn: function () { stage(o, "jack"); } });
  else if (G().inv.rub_jack > 0) out.push({ label: "Поставить гидравлический домкрат: два подхода, почти тихо", fn: function () { setJack(o); } });
  if (s.armed && !fuse[key(o)]) out.push({ label: "Поджечь запал заложенного заряда: шесть секунд, отойдите", fn: function () { arm(o, true); } });
  else if (!s.armed && blastOk()) out.push({ label: "Заложить подрывной заряд: сразу, но на весь этаж; шесть секунд — отойдите", fn: function () { arm(o, false); } });
  if (!s.armed) {
    var how = tool(), n = left(o, how);
    out.push({ label: (how === "bar" ? "Разбирать завал монтировкой" : "Разбирать завал руками") + ": " + (s.p > 0 ? "ещё " : "") + n + " " + pl(n, "подход", "подхода", "подходов") + ", шумно", fn: function () { stage(o, how); } });
  }
  out.push({ label: "Прислушаться к пролёту", keep: true, fn: function () { A("play", "draft"); say("Пролёт завален: сквозь обломки едва слышен гул."); } });
  out.push({ label: "Осмотреть завал", keep: true, fn: function () { say(examine(o)); } });
  return out;
}
function examine(o) {
  return "Лестничный пролёт завален: плиты перекрытия, бетонная крошка, гнутая арматура. Лифт сюда не поможет: он возит только туда, где вы уже были. Руками разобрать можно, но долго и шумно, с монтировкой — быстрее. Гидравлический домкрат поднимет плиту почти тихо, подрывной заряд разнесёт завал сразу — но слышно будет на весь этаж. Заряд можно сделать и самим: пиротехника, химический стол.";
}
function menu(o, opts) {
  opts = opts || {};
  var its = items(o), t = opts.title || title(o);
  LAB.ui.menu(t, its, { focus: opts.focus == null ? 1 : opts.focus, rebuild: function () { return items(o); } });
}

/* ── подход: руками, монтировкой, домкратом ── */
function stage(o, how) {
  var g = G(), c = cb();
  if (work && (work.g !== g || Date.now() - work.t > 15000)) work = null; /* подход прежней игры или прерванный загрузкой */
  if (work) { say("Вы уже разбираете завал."); return false; }
  if (!blocked(o)) { say("Проход и так свободен."); return false; }
  var ch = c && c.chaser && c.chaser();
  if (ch) { say("Не до завала: вплотную " + ch.name.split(",")[0].toLowerCase() + " " + gm().relDir(ch.x, ch.y) + "."); return false; }
  var s = st(o), first = !s.p && !s.started;
  s.started = 1;
  LAB.ui.closeAll();
  work = { k: key(o), how: how, g: g, L: g.L, F: g.F, x: g.x, y: g.y, hp: g.hp, o: o, t: Date.now() };
  A("rubbleWork", o.x, o.y, how);
  if (first) say(how === "jack" ? "Вы ставите домкрат под плиту и качаете рукоять." : (how === "bar" ? "Вы поддеваете обломки монтировкой." : "Вы разбираете завал руками.") + " Шумно: ОКО может услышать.");
  noisy(o, how, s, 0);
  turns(how === "jack" ? 1 : 2);
  gm().later(function () { noisy(o, how, s, 1); }, Math.round(STAGE_MS[how] * 0.45));
  gm().later(function () { stageEnd(o); }, STAGE_MS[how]);
  return true;
}
function stageEnd(o) {
  var w = work; work = null;
  var g = G();
  if (!w || !gm().entered || g !== w.g || g.dead) return;
  if (g.L !== w.L || g.F !== w.F || g.x !== w.x || g.y !== w.y) { sayq("Вы бросили разбирать завал: отошли от него."); return; }
  if (g.hp < w.hp) { sayq("Вас ранили — разбор завала прерван. Отбейтесь и возвращайтесь."); return; }
  var s = st(o), how = w.how;
  s.p = Math.min(100, (s.p || 0) + 100 / stages(how));
  /* тяжёлая работа: время идёт, руки устают */
  var msg = [];
  if (gm().advanceTime) gm().advanceTime(how === "jack" ? 2 : 3);
  if (gm().bodyApply) gm().bodyApply({ wake: how === "jack" ? -0.5 : how === "bar" ? -1.5 : -2 }, msg);
  if (how !== "jack") okoWaves(o, s);
  if (s.p >= 99.5) { finish(o, how); return; }
  var t = title(o) + ". " + (how === "jack" ? "Плита поднимается" : "Разобрано на " + pct(s.p));
  if (LAB.ui.layer && LAB.ui.layer()) { sayq(t + "."); return; }
  var c = cb();
  if (c && c.danger && c.danger()) { say(t + ". Рядом враги — осторожнее."); return; }
  menu(o, { title: t, focus: 1 });
}
/* Шум подхода: враги рядом слышат, ОКО — акустическими датчиками. */
function noisy(o, how, s, half) {
  var c = cb(), O = LAB.oko;
  if (c && c.noise) c.noise(how === "hands" ? 9 : how === "bar" ? 11 : 5);
  if (half || !O) return;
  if (how === "jack") { if (!s.heardJ && Math.random() < 0.35 && O.report && O.report("noise", o.x, o.y, "suspect", "скрип на лестничной клетке")) s.heardJ = 1; return; }
  if (O.heat) O.heat(2);
  if (O.report && O.report("noise", o.x, o.y, "suspect", "удары на лестничной клетке") && !s.said) { s.said = 1; if (O.speak) O.speak("rubble", true); }
}
/* Машины на шум — по режиму сложности: digW раз за разбор, ровно по ходу работы. */
function okoWaves(o, s) {
  var O = LAB.oko, n = dk().digW || 0;
  if (!O || !O.wave || !n) return;
  s.w = s.w || 0;
  while (s.w < n && s.p >= (s.w + 1) * 100 / (n + 1)) {
    s.w++;
    O.wave(rnd(10, 18), s.w === 1 ? 1 : 2, s.w === 1 ? "check" : "hunt", { x: o.x, y: o.y }, "rubble");
  }
}
function setJack(o) {
  var g = G();
  if (!(g.inv.rub_jack > 0)) { say("Домкрата нет."); return false; }
  if (work && work.g === g && Date.now() - work.t <= 15000) { say("Вы уже разбираете завал."); return false; }
  g.inv.rub_jack--; if (!g.inv.rub_jack) delete g.inv.rub_jack;
  st(o).jack = 1;
  return stage(o, "jack");
}

/* ── подрывной заряд ── */
function arm(o, relight) {
  var g = G(), s = st(o), k = key(o);
  if (fuse[k] && fuse[k].g !== g) delete fuse[k];
  if (fuse[k]) { say("Запал уже горит — отойдите!"); return false; }
  if (!relight) {
    var c = LAB.chem && LAB.chem.useBlast ? LAB.chem.useBlast() : null;
    if (!c) { say("Подрывного заряда нет."); return false; }
    s.armed = 1; s.mag = c.mag;
  }
  LAB.ui.closeAll();
  A("play", "mine_set");
  say("Заряд под плитой, запал горит. Отойдите хотя бы на три шага: шесть секунд.");
  turns(1);
  burn(k, o.x, o.y, function () { boomStairs(o, k, g.L, g.F); });
  return true;
}
function burn(k, x, y, done) {
  var t0 = Date.now(), g0 = G();
  var beep = function () {
    if (!fuse[k]) return;
    if (G() !== g0) { delete fuse[k]; return; } /* новая игра или загрузка: запал прежней игры гаснет */
    var rest = FUSE_MS - (Date.now() - t0);
    if (rest <= 0) { delete fuse[k]; done(); return; }
    A("mineBeep", x, y);
    fuse[k] = { t: setTimeout(beep, rest > 2200 ? 1000 : 450), g: g0 };
  };
  fuse[k] = { t: setTimeout(beep, 300), g: g0 };
}
function boomStairs(o, k, L, F) {
  var g = G();
  if (!g || g.dead) return;
  var s = g.rub && g.rub[k];
  if (!s || s.done) return;
  s.armed = 0;
  /* герой ушёл с этажа: завал разнесло без него, находки ждут у лестницы */
  if (g.L !== L || g.F !== F) { s.done = 1; s.how = "blast"; dropFar(L, F, o, k); return; }
  finish(o, "blast", blast(o.x, o.y, s.mag || 1, "взрыв на лестничной клетке"));
}
/* Взрыв: грохот, обломки на два шага вокруг, шум на весь этаж. */
function blast(x, y, mag, what) {
  var g = G(), c = cb(), O = LAB.oko;
  A("explosion", x, y, "charge");
  var hit = 0, hurt = 0;
  if (c) {
    if (c.noise) c.noise(18);
    if (c.areaDamage) hit = c.areaDamage(x, y, 2, Math.round(30 * mag), "kinetic");
    var d = Math.max(Math.abs(g.x - x), Math.abs(g.y - y));
    if (d <= 2 && !(LAB.chem && LAB.chem.safeGrenades && LAB.chem.safeGrenades()) && c.hurtPlayer) hurt = c.hurtPlayer(Math.round((d <= 1 ? 30 : 18) * mag), "phys", null) || 0;
  }
  if (O) {
    if (O.heat) O.heat(8);
    if (O.report && O.report("noise", x, y, "suspect", what) && O.speak) O.speak("rubble", true);
    if (O.wave) O.wave(rnd(12, 20), 1 + ((dk().digW || 0) >= 2 ? 1 : 0), "hunt", { x: x, y: y }, "rubble");
  }
  return { hit: hit, hurt: hurt };
}

/* ── проход свободен ── */
var DONE = {
  hands: "Последний обломок сдвинут — пролёт свободен.",
  bar: "Монтировка сдвигает последний обломок — пролёт свободен.",
  jack: "Домкрат поднял плиту, крепь её держит — пролёт свободен. Домкрат остаётся под сводом.",
  blast: "Грохот, и завал разнесло — пролёт свободен."
};
function finish(o, how, b) {
  var g = G(), s = st(o);
  s.done = 1; s.p = 100; s.how = how; s.jack = 0; s.armed = 0;
  A("rubbleClear", o.x, o.y, how);
  if (gm().gainXP) gm().gainXP(how === "blast" ? 10 : how === "jack" ? 12 : how === "bar" ? 15 : 18);
  var to = o.type === "stairs_down" ? g.F + 1 : g.F - 1;
  if (gm().journal) gm().journal("Разобран завал на лестнице между этажами " + Math.min(g.F, to) + " и " + Math.max(g.F, to) + ".");
  var txt = DONE[how] + " Лестница " + (o.type === "stairs_down" ? "вниз, на этаж " : "вверх, на этаж ") + to + ", открыта.";
  var got = s.loot ? null : findings("st:" + key(o), how);
  s.loot = 1;
  LAB.ui.closeAll();
  if (!got) { say(txt + hurtText(b)); refresh(); return; }
  if (how === "blast") {
    /* после взрыва находки разлетелись: лежат у лестницы */
    drop(got.items, o.x, o.y, false);
    say(txt + hurtText(b) + " " + got.text + (got.lost ? " Часть того, что лежало под завалом, взрыв разнёс в клочья." : "") + " Находки — у лестницы.");
  } else {
    say(txt + " " + got.text);
    drop(got.items, g.x, g.y, true);
  }
  refresh();
}
function hurtText(b) { return !b ? "" : (b.hurt ? " Вас задело обломками: слишком близко." : "") + (b.hit ? " Обломками задело врагов: " + b.hit + "." : ""); }
function refresh() { if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh(); if (gm().autosaveSoon) gm().autosaveSoon(); }

/* ── находки из-под обломков: только полезное ── */
var FIND = [
  { w: 3, t: "разбитый щиток, из него удалось вынуть детали", f: function (r, L) { return { kind: "item", item: LAB.partAt ? LAB.partAt(r, L) : "scrap", n: 1 + r.int(0, 2) }; } },
  { w: 2, t: "сумка охранника с энергобатареей", f: function (r) { return { kind: "ammo", ammo: "energy", n: 1 + (r.chance(0.3) ? 1 : 0) }; } },
  { w: 2, t: "аптечка из аварийного шкафа на площадке", f: function (r, L) { return { kind: "item", item: L >= 8 && r.chance(0.25) ? "medkit_l" : r.chance(0.55) ? "medkit_s" : "bandage", n: 1 + (r.chance(0.3) ? 1 : 0) }; } },
  { w: 2, t: "кошелёк сотрудника с кредитами", f: function (r, L, F) { return { kind: "credits", n: LAB.credits ? LAB.credits(12 + r.int(0, 20), L, F) : 15 }; } },
  { w: 2, t: "уцелевшая склянка из лабораторного ящика", ok: function () { return !!(LAB.chem && LAB.chem.matId); }, f: function (r, L) {
    var fam = r.pick(["c_salt", "c_oil", "c_solvent", "c_electrolyte", "c_coolant"]);
    return { kind: "item", item: LAB.chem.matId(fam, LAB.chem.gradeAt(L, function () { return r.next(); }), false), n: 1 + (r.chance(0.4) ? 1 : 0) };
  } },
  { w: 1.2, t: "придавленная обломком записка", f: function (r) { return { kind: "note", note: "staff", n: r.int(0, 999) }; } },
  { w: 1, t: "чья-то ценная вещь, потерянная на лестнице", ok: function (L) { return valuables(L).length > 0; }, f: function (r, L) { return { kind: "item", item: r.pick(valuables(L)), n: 1 }; } },
  { w: 1, t: "аварийный ящик горноспасателей", f: function (r) { return { kind: "item", item: LAB.ITEMS.c_blast && r.chance(0.5) ? "c_blast" : "rub_jack", n: 1 }; } },
  { w: 0.6, t: "связка отмычек техника", f: function () { return { kind: "item", item: "lockpick", n: 1 }; } },
  { w: 0.5, t: "ремкомплект из шкафа охраны", f: function () { return { kind: "item", item: "repairkit", n: 1 }; } }
];
function valuables(L) { var out = []; for (var k in LAB.ITEMS) { var d = LAB.ITEMS[k]; if (d.cat === "valuable" && d.kind === "valuable" && (d.depth || 1) <= L) out.push(k); } return out; }
function findings(tag, how) {
  var g = G(), L = g.L, r = LAB.Rng(g.seed, "rubloot30:" + L + ":" + tag), luck = dk().loot || 1;
  var n = 1 + (r.chance(Math.min(0.9, 0.45 * luck)) ? 1 : 0) + (r.chance(Math.min(0.6, 0.15 * luck)) ? 1 : 0) + ((how === "hands" || how === "bar") && r.chance(0.3) ? 1 : 0);
  var pool = FIND.filter(function (f) { return !f.ok || f.ok(L); }), its = [], ts = [];
  for (var i = 0; i < n && pool.length; i++) {
    var sum = pool.reduce(function (a, f) { return a + f.w; }, 0), x = r.next() * sum, j = 0;
    while (j < pool.length - 1 && (x -= pool[j].w) > 0) j++;
    var f = pool.splice(j, 1)[0], it = f.f(r, L, g.F);
    if (it && (it.kind !== "item" || LAB.ITEMS[it.item])) { its.push(it); ts.push(f.t); }
  }
  var lost = 0;
  if (how === "blast" && its.length > 1) {
    var keep = [], kt = [];
    its.forEach(function (it, k) { if (k === 0 || r.next() >= 0.35) { keep.push(it); kt.push(ts[k]); } else lost++; });
    its = keep; ts = kt;
  }
  return { items: its, text: "Из-под обломков: " + ts.join(", ") + ".", lost: lost };
}
/* Находки — на пол: под ноги (и сразу в руки) или рядом с местом взрыва. */
function drop(its, x, y, pick) {
  var g = G(), fs = CUR().fs, c = cb();
  var cell = pick ? [g.x, g.y] : (c && c.lootCell ? c.lootCell(x, y) : [x, y]);
  if (!fs.drops) fs.drops = [];
  its.forEach(function (it) { it.id = "d" + (fs.dseq = (fs.dseq || 0) + 1); it.x = cell[0]; it.y = cell[1]; fs.drops.push(it); });
  A("dropLoot", cell[0], cell[1]);
  if (pick && gm().autoPickup) gm().later(function () { if (G() === g && g.x === cell[0] && g.y === cell[1]) gm().autoPickup(); }, 900);
}
/* Взрыв, когда героя на этаже уже нет: находки — у лестницы того этажа. */
function dropFar(L, F, o, k) {
  var g = G(), fs = gm().fsFor ? gm().fsFor(L, F) : null, s = g.rub[k];
  if (!fs || s.loot) return;
  var r0 = findings("st:" + k, "blast");
  s.loot = 1;
  if (!fs.drops) fs.drops = [];
  r0.items.forEach(function (it) { it.id = "d" + (fs.dseq = (fs.dseq || 0) + 1); it.x = o.x + (o.x > 1 ? -1 : 1); it.y = o.y; fs.drops.push(it); });
}

/* ── завал в проходе (с 3-го уровня): заряд вместо позитронной установки ── */
function blastDoor(d) {
  var g = G(), fs = CUR().fs, k = "door:" + g.L + "-" + g.F, L = g.L, F = g.F;
  if (fs.rubble) { say("Проход и так расчищен."); return false; }
  if (fuse[k]) { say("Запал уже горит — отойдите!"); return false; }
  var c = LAB.chem && LAB.chem.useBlast ? LAB.chem.useBlast() : null;
  if (!c) { say("Подрывного заряда нет."); return false; }
  LAB.ui.closeAll();
  A("play", "mine_set");
  say("Заряд у завала, запал горит. Отойдите хотя бы на три шага: шесть секунд.");
  turns(1);
  burn(k, d.x, d.y, function () {
    var g2 = G();
    if (!g2 || g2.dead) return;
    var fs2 = gm().fsFor ? gm().fsFor(L, F) : fs;
    if (fs2.rubble) return;
    fs2.rubble = true;
    if (g2.L !== L || g2.F !== F) return;
    var b = blast(d.x, d.y, c.mag, "взрыв у завала в проходе");
    if (gm().gainXP) gm().gainXP(10);
    say("Грохот, и завал в проходе разнесло: путь свободен." + hurtText(b));
    doorLoot("blast");
  });
  return true;
}
/* Находки там, где был завал в проходе: после импульса позитронной установки или взрыва. */
function doorLoot(how) {
  var g = G(), fs = CUR().fs, fl = CUR().fl;
  if (!fs || fs.rubLoot) return;
  var d = null;
  for (var i = 0; i < fl.doors.length; i++) if (fl.doors[i].lock && fl.doors[i].lock.type === "rubble") { d = fl.doors[i]; break; }
  if (!d) return;
  fs.rubLoot = 1;
  var got = findings("door:" + g.F, how);
  drop(got.items, d.x, d.y, false);
  sayq("Там, где был завал, остались находки: " + got.text.replace("Из-под обломков: ", "").replace(/\.$/, "") + (got.lost ? ". Часть разнесло взрывом" : "") + ".");
}

/* ── из рюкзака: «Применить» домкрат или заряд ── */
function use(id) {
  var d = LAB.ITEMS[id], o = stairsNear();
  if (d && d.rubble === "jack") {
    if (!o) { say("Домкрат ставят под завал на лестнице: подойдите к заваленной лестнице."); return false; }
    var s = peek(o);
    return s && s.jack ? stage(o, "jack") : setJack(o);
  }
  if (o) { var s2 = peek(o); return arm(o, !!(s2 && s2.armed && !fuse[key(o)])); }
  var dr = doorNear();
  if (dr) return blastDoor(dr);
  say("Подрывной заряд закладывают под завал — на лестнице или в проходе. Подойдите к нему.");
  return false;
}

LAB.rubble = {
  blocked: blocked, menu: menu, use: use, stage: stage, arm: arm, blastDoor: blastDoor, doorLoot: doorLoot,
  stages: stages, infoLine: infoLine, state: function (o) { return peek(o) || null; },
  /* для проверок: подход без ожидания и находки по ключу */
  _finish: function (o, how) { st(o).p = 100; finish(o, how); }, _findings: findings, _busy: function () { return !!work; }, _fuse: function () { return Object.keys(fuse).length; },
  _reset: function () { work = null; Object.keys(fuse).forEach(function (k) { clearTimeout(fuse[k].t); }); fuse = {}; }
};
})();
