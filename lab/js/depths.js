/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — механики пяти глубин под Ядром.
   Глубина I «Подножие» (уровни 11–20): гидравлические прессы перекрывают
     коридоры — проходить в паузе между ударами, по их ритму; распределительный
     щит делит мощность на две линии из трёх: прессовый цех, вибродатчики ОКО,
     вентиляция нижних глубин.
   Глубина II «Колыбель» (21–40): инкубаторы с табло — температура,
     активность, герметичность, маркировка. Открыть, охладить, нагреть или
     стерилизовать; правило выводится из показаний. Охлаждение работает,
     только если щиты «Подножия» питают вентиляцию нижних глубин.
   Глубина III «Отражение» (41–60): терминал с перемешанным журналом —
     настоящие записи, повторы и записи другого состояния комплекса;
     сопоставить по частоте сети и отзвуку. Ошибка сбивает навигатор на
     время — с понятными признаками.
   Глубина IV «Механизм» (61–80): синхронный затвор в четыре этапа —
     питание, порядок реле, два механизма в такт, защита ОКО.
   Глубина V «Исток» (81–100): древние узлы отвечают на последовательность
     звуков; подсказывают тем больше, чем бережнее игрок прошёл глубины
     выше; несколько путей — ответить узлу, ритм «Механизма», рискованная
     ЭМИ-перегрузка.
   Сквозное состояние глубин — G.world: что сделано наверху, меняет то,
   что ниже. Установки ставятся последними, своим потоком случайностей:
   остальное на этаже не меняется.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function menu(title, items, opts) { return LAB.ui.menu(title, items, opts); }
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function steps(n) { return n + " " + gm().plural(n, "шаг", "шага", "шагов"); }
function T() { var fs = CUR().fs; return fs ? (fs.okoT || 0) : 0; }

/* Номер глубины: 0 — «Ковчег» (уровни 1–10), 1–5 — глубины под Ядром. */
function depthOf(L) { return L <= 10 ? 0 : LAB.blockOf(L); }
var NAMES = ["«Ковчег»", "«Подножие»", "«Колыбель»", "«Отражение»", "«Механизм»", "«Исток»"];

/* ── Сквозное состояние глубин ── */
function W() {
  var g = G();
  if (!g.world) g.world = {};
  var w = g.world;
  if (!w.vent) w.vent = {};        /* щиты «Подножия», что питают вентиляцию нижних глубин: ключ этажа → 1 */
  if (w.saved == null) w.saved = 0;   /* образцы «Колыбели», которых выпустили живыми */
  if (w.killed == null) w.killed = 0; /* образцы, которых стерилизовали */
  if (w.woke == null) w.woke = 0;     /* разбуженные по ошибке */
  if (w.mirror == null) w.mirror = 0; /* восстановленные журналы «Отражения» */
  if (w.synced == null) w.synced = 0; /* открытые синхронные затворы */
  if (w.nodes == null) w.nodes = 0;   /* древние узлы, которые ответили */
  if (w.forced == null) w.forced = 0; /* узлы, отключённые силой */
  return w;
}
function ventOn() { var v = W().vent; for (var k in v) if (v[k]) return true; return false; }

/* ── Установки ── */
LAB.OBJ.powergrid = { n: "Распределительный щит", icon: "⚡", desc: "Щит перераспределения энергии «Подножия»: рубильники трёх линий — прессовый цех, вибродатчики ОКО, вентиляция нижних глубин. Мощности хватает только на две линии." };
LAB.OBJ.incubator = { n: "Инкубатор", icon: "🧫", desc: "Запечатанная камера выращивания: тёплое стекло, табло показаний, рукоять вскрытия и красная кнопка стерилизации." };
LAB.OBJ.mirrorterm = { n: "Терминал отражённого контура", icon: "🪞", desc: "Терминал с журналом событий этажа. В журнале перемешаны настоящие записи, повторы и записи другого состояния комплекса." };
LAB.OBJ.syncgate = { n: "Синхронный затвор", icon: "⚙️", desc: "Тяжёлый механический затвор хранилища: открывается в четыре этапа — питание, порядок реле, два механизма в такт, защита ОКО." };
LAB.OBJ.ancient = { n: "Древний узел", icon: "🜂", desc: "Узел из тёмного камня и металла, старше «Ковчега». Отвечает на последовательность звуков." };

/* ── Враги глубин: поведение поверх данных блоков ──
   «Подножие»: робот-сварщик принимает носителя за неисправный узел (fixer);
   скрытый наблюдатель-«слухач» не нападает — докладывает ОКО (observer).
   «Колыбель»: одни твари чуют вибрацию шагов (vibro), другие — тепло тела
   (heat: маскировка не обманывает). «Отражение»: двойник и эхо-призрак
   повторяют голоса чужих машин (mimicsnd). «Механизм»: привратник и страж
   серверной перекрывают выход из помещения, пока другие гонят носителя
   (blocker). */
function addBeh(id, b) { var f = LAB.FOES[id]; if (f && f.beh.indexOf(b) < 0) f.beh = f.beh.concat([b]); }
addBeh("g_welder", "fixer");
["k_catfish", "k_rootweaver", "k_saltcrab", "k_triad"].forEach(function (id) { addBeh(id, "vibro"); });
["k_glowbug", "k_leech", "k_quickling", "k_eel"].forEach(function (id) { addBeh(id, "heat"); });
["o_echoghost", "o_twin"].forEach(function (id) { addBeh(id, "mimicsnd"); });
["m_gatekeeper", "m_serverguard"].forEach(function (id) { addBeh(id, "blocker"); });
if (!LAB.FOES.g_listener) LAB.FOES.g_listener = { n: "Слухач", g: "m", kind: "mech", desc: "Тихий наблюдатель «Подножия»: щуп-микрофон на гибкой ноге. Не нападает — передаёт ОКО, где вы, и отходит. Его выдаёт сухой щелчок передатчика.", hp: 28, dmg: 0, arm: 4, spd: 2, rng: 0, acd: 99, det: 8, beh: ["observer", "patrol"], adt: "phys", snd: "watcher", sndRate: 1.2, xp: 14, min: 11 };

/* ════════ РАЗМЕЩЕНИЕ (из генератора этажа, последним) ════════ */
function place(api) {
  var d = depthOf(api.L);
  if (!d) return;
  var r = LAB.Rng(api.seed, "depth:" + api.L + ":" + api.F + ":" + api.attempt);
  var fl = api.fl, rooms = api.svcRooms.length ? api.svcRooms : api.mainRooms;
  if (!rooms.length) return;
  fl.hazards = fl.hazards || [];
  if (d === 1) {
    var pressN = api.F >= 2 && r.chance(0.5) ? 1 + (api.F >= 10 && r.chance(0.35) ? 1 : 0) : 0;
    for (var i = 0; i < pressN; i++) addPress(api, r);
    if (fl.hazards.length || r.chance(0.25)) api.addObj("powergrid", r.pick(rooms), { seed: r.int(1, 99999) });
    /* скрытый наблюдатель */
    if (api.F >= 2 && r.chance(0.4) && api.makeFoe && api.freeCell) {
      var sr = r.pick(api.mainRooms), c0 = api.freeCell(sr);
      if (c0) api.makeFoe("g_listener", c0[0], c0[1], sr, { id: "dl" + api.F, patrol: true }, r);
    }
  } else if (d === 2) {
    if (r.chance(0.55)) {
      var n2 = 1 + (r.chance(0.45) ? 1 : 0), made = [];
      for (var k = 0; k < n2; k++) {
        var o2 = api.addObj("incubator", r.pick(rooms), incubSpec(r, api.L, api.F, k));
        if (o2) made.push(o2);
      }
      /* журнал смены: что о каждом образце писали люди — иногда неверно */
      if (made.length) api.addItem({ kind: "note", note: "depth", dk: "cradle", specs: made.map(function (o) { return { code: o.spec, kind: o.kind, lie: o.lie }; }) }, r.pick(api.mainRooms));
    }
  } else if (d === 3) {
    if (r.chance(0.5)) api.addObj("mirrorterm", r.pick(rooms), { seed: r.int(1, 999999) });
  } else if (d === 4) {
    if (r.chance(0.5)) {
      var og = api.addObj("syncgate", r.pick(rooms), { seed: r.int(1, 999999) });
      if (og) og.loot = LAB.genLoot(r, api.L, api.F, "safe", "tech");
    }
  } else if (d === 5) {
    if (r.chance(0.5)) {
      var on = api.addObj("ancient", r.pick(rooms), { seed: r.int(1, 999999) });
      /* запись последовательности узла — где-то на этаже (иногда её нет) */
      if (on && r.chance(0.5)) api.addItem({ kind: "note", note: "depth", dk: "node", seq: nodeSeq(on) }, r.pick(api.mainRooms));
    }
  }
}
/* Пресс перекрывает коридор поперёк — линия клеток посередине коридора. */
function addPress(api, r) {
  var fl = api.fl, list = (fl.corrs || []).filter(function (c) { return (c.x1 - c.x0) + (c.y1 - c.y0) >= 9 && !c.pressed; });
  if (!list.length) return null;
  var c = r.pick(list), horiz = (c.x1 - c.x0) >= (c.y1 - c.y0), cells = [];
  if (horiz) { var mx = Math.floor((c.x0 + c.x1) / 2); for (var y = c.y0; y <= c.y1; y++) cells.push([mx, y]); }
  else { var my = Math.floor((c.y0 + c.y1) / 2); for (var x = c.x0; x <= c.x1; x++) cells.push([x, my]); }
  cells = cells.filter(function (p) { return fl.t[p[1] * LAB.W + p[0]] === LAB.T.CORR; });
  if (cells.length < 2) return null;
  c.pressed = true;
  var mid = cells[Math.floor(cells.length / 2)];
  var h = { id: "p" + fl.hazards.length, kind: "press", cells: cells, cx: mid[0], cy: mid[1], period: 6 + r.int(0, 2), phase: r.int(0, 5) };
  fl.hazards.push(h);
  return h;
}
/* Образец инкубатора: что внутри и что о нём написано в журнале. */
function incubSpec(r, L, F, k) {
  var kinds = ["useful", "useful", "conditional", "dangerous", "conditional", "dead"];
  var kind = r.pick(kinds);
  var temp = kind === "conditional" ? 2 : kind === "dangerous" ? r.pick([1, 2]) : kind === "useful" ? r.pick([0, 1, 1, 2]) : r.pick([0, 1]);
  /* журнал лжёт примерно в каждом третьем случае: табло — нет */
  return { spec: "К-" + (10 + ((L * 7 + F * 3 + k * 11 + r.int(0, 60)) % 89)), kind: kind, temp0: temp, sealCrack: kind === "dangerous" && r.chance(0.5), lie: r.chance(0.33), seed: r.int(1, 99999) };
}

/* ════════ ТАКТ: прессы ════════ */
function tick() {
  var fl = CUR().fl, fs = CUR().fs, g = G();
  if (!fl || !fs || !fl.hazards || !fl.hazards.length || g.dead) return;
  if (fs.grid === "press") return; /* прессовый цех обесточен */
  var now = T();
  fl.hazards.forEach(function (h) {
    if (h.kind !== "press") return;
    var ph = (now + h.phase) % h.period, dist = Math.abs(h.cx - g.x) + Math.abs(h.cy - g.y);
    var near = dist <= 22;
    if (ph === h.period - 2 && near) A("at", "ev_steam", h.cx, h.cy, { gain: 0.8, rate: 0.75, fb: null });
    if (ph === h.period - 1) {
      if (near) { A("at", "rubble_hit", h.cx, h.cy, { gain: 1.2, rate: 0.62 }); A("at", "ev_factory_clank", h.cx, h.cy, { gain: 0.7, rate: 0.7, delay: 0.05 }); }
      slam(h);
    }
    /* первое знакомство: «Эхо» объясняет, как проходить */
    if (dist <= 4 && !fs["pressSaid" + h.id]) {
      fs["pressSaid" + h.id] = 1;
      say("Впереди гидравлический пресс перекрывает коридор " + gm().relDir(h.cx, h.cy) + ". Шипение — сейчас ударит; проходите сразу после удара. Его можно обесточить на распределительном щите этажа.", { prio: "event", keep: true });
    }
  });
}
function onLine(h, x, y) { for (var i = 0; i < h.cells.length; i++) if (h.cells[i][0] === x && h.cells[i][1] === y) return true; return false; }
function slam(h) {
  var g = G(), cb = LAB.combat;
  if (onLine(h, g.x, g.y)) {
    var dk = (LAB.DIFF[LAB.settings.difficulty || 1] || LAB.DIFF[1]).dmg || 1;
    var dmg = Math.max(8, Math.round(g.hpMax * 0.28 * dk));
    if (cb && cb.hurtPlayer) cb.hurtPlayer(dmg, "phys", null);
    /* отбрасывает поперёк линии пресса — назад, туда, откуда шли (если там глухо — вперёд) */
    var alongX = h.cells[0][0] === h.cells[h.cells.length - 1][0]; /* линия вертикальна — коридор идёт по горизонтали */
    var back = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[g.face] || [0, 1];
    var sgn = alongX ? (back[0] || 1) : (back[1] || 1);
    var dirs2 = alongX ? [[sgn, 0], [-sgn, 0]] : [[0, sgn], [0, -sgn]];
    for (var di = 0; di < dirs2.length; di++) {
      var v = dirs2[di], x1 = g.x + v[0], y1 = g.y + v[1];
      if (!gm().passable(x1, y1) || (cb && gm().foeAt(x1, y1))) continue;
      g.x = x1; g.y = y1;
      var x2 = x1 + v[0], y2 = y1 + v[1];
      if (gm().passable(x2, y2) && !(cb && gm().foeAt(x2, y2))) { g.x = x2; g.y = y2; }
      break;
    }
    say("Удар пресса! Вас отбросило назад.", { prio: "urgent" });
    LAB.vib([120, 60, 120]);
  }
  if (cb) cb.foes().forEach(function (f) { if (!f.dead && !f.calm && onLine(h, f.x, f.y)) cb.damageFoe(f, Math.max(40, f.maxhp * 0.6), "phys", { noarmor: true, quiet: false }); });
}
function hazardAt(x, y) {
  var fl = CUR().fl;
  if (!fl || !fl.hazards) return null;
  for (var i = 0; i < fl.hazards.length; i++) if (onLine(fl.hazards[i], x, y)) return fl.hazards[i];
  return null;
}

/* ════════ ГЛУБИНА I: распределительный щит ════════ */
var LINES = { press: "прессовый цех", sens: "вибродатчики ОКО", vent: "вентиляция нижних глубин" };
function gridMenu(o) {
  var fs = CUR().fs, off = fs.grid || "vent";
  var state = ["press", "sens", "vent"].map(function (k) { return LINES[k] + " — " + (k === off ? "обесточена" : "под током"); }).join(", ");
  var items = [];
  ["press", "sens", "vent"].forEach(function (k) {
    if (k === off) return;
    items.push({ label: "Обесточить: " + LINES[k] + " — питание уйдёт на линию «" + LINES[off] + "»", fn: function () { setGrid(o, k); } });
  });
  items.push({ label: "Прочитать схему на дверце", keep: true, fn: function () {
    say("Схема: мощности хватает на две линии из трёх. Прессовый цех — гидравлические прессы в коридорах этажа: обесточены — стоят. Вибродатчики ОКО — по ним ОКО слышит выстрелы и шаги: обесточены — этаж для ОКО глухой. Вентиляция нижних глубин — воздух и охлаждение там, внизу: обесточена — в «Колыбели» не работает охлаждение камер. Приписка маркером: «Колыбель без воздуха — не выключать надолго».");
  } });
  items.push({ label: "Отойти", fn: function () {} });
  A("play", "mag_hum_short");
  menu("Распределительный щит. Сейчас: " + state, items);
}
function setGrid(o, k) {
  var fs = CUR().fs, g = G(), key = g.L + "-" + g.F;
  fs.grid = k;
  W().vent[key] = k === "vent" ? 0 : 1;
  A("play", "power_off"); setTimeout(function () { A("play", "power_on"); }, 600);
  if (LAB.combat) LAB.combat.noise(8);
  if (LAB.oko && k !== "sens") LAB.oko.report("terminal", o.x, o.y, "suspect", "переключение линий распределительного щита");
  var msg = { press: "Прессовый цех обесточен: прессы встали. Вентиляция нижних глубин получила питание.", sens: "Вибродатчики ОКО обесточены: выстрелы и шаги на этаже ОКО больше не слышит. Вентиляция нижних глубин получила питание.", vent: "Вентиляция нижних глубин обесточена: прессы и датчики снова под током." }[k];
  say("Рубильник с лязгом встал на место. " + msg);
  gm().gainXP(5);
}
/* Вибродатчики обесточены — акустических донесений с этажа нет. */
function sensorsDeaf() { var fs = CUR().fs; return !!(fs && fs.grid === "sens"); }

/* ════════ ГЛУБИНА II: инкубаторы ════════ */
var TEMPS = ["12 градусов — ниже нормы", "24 градуса — норма", "36 градусов — выше нормы"];
function incState(o) {
  var st = gm().objState(o);
  if (st.temp == null) st.temp = o.temp0;
  return st;
}
function activity(o, st) {
  if (st.open || st.ster) return "камера пуста";
  if (o.kind === "dead") return "признаков жизни нет";
  if (o.kind === "dangerous") return "образец бьётся о стекло";
  if (st.temp >= 2) return "движение";
  return "покой";
}
function readout(o, st) {
  return "Табло: образец " + o.spec + ". Температура " + TEMPS[st.temp] + ". Активность: " + activity(o, st) + ". " + (o.sealCrack ? "Герметичность нарушена: по стеклу трещина." : "Камера герметична.");
}
function incubMenu(o) {
  var st = incState(o), items = [];
  A("at", "capsule_hum", o.x, o.y, { gain: 0.6 });
  if (st.open || st.ster) {
    menu("Инкубатор " + o.spec + (st.ster ? " — стерилизован" : " — вскрыт"), [
      { label: "Осмотреть", fn: function () { say(st.ster ? "Камера выжжена изнутри: стекло мутное, пахнет озоном." : "Камера открыта и пуста. На дне — следы питательного геля."); } },
      { label: "Отойти", fn: function () {} }
    ]);
    return;
  }
  items.push({ label: "Снять показания", keep: true, fn: function () { say(readout(o, st)); } });
  items.push({ label: "Охладить камеру", keep: true, fn: function () {
    if (!ventOn()) { LAB.UI.error(); say("Охлаждение не работает: вентиляция нижних глубин обесточена. Её питают распределительные щиты «Подножия»."); return; }
    if (st.temp <= 0) { say("Холоднее нельзя: " + TEMPS[0] + "."); return; }
    st.temp--; A("play", "ev_steam"); say("Камера охлаждается. " + readout(o, st));
  } });
  items.push({ label: "Нагреть камеру", keep: true, fn: function () {
    if (st.temp >= 2) { say("Теплее нельзя: " + TEMPS[2] + "."); return; }
    st.temp++; A("play", "capsule_hum"); say("Камера нагревается. " + readout(o, st));
  } });
  items.push({ label: "Открыть камеру", fn: function () { openIncub(o, st); } });
  items.push({ label: "Стерилизовать камеру", fn: function () { sterilize(o, st); } });
  items.push({ label: "Отойти", fn: function () {} });
  menu("Инкубатор " + o.spec, items, { keep: false, intro: readout(o, st) });
}
function nearCell(x, y) {
  var cb = LAB.combat;
  if (cb && cb.freeCellNear) return cb.freeCellNear(x, y, null);
  return null;
}
function spawnBeast(o, weak) {
  var cb = LAB.combat, L = G().L;
  var pool = (LAB.LEVELS[L].foes || []).filter(function (id) { var b = LAB.FOES[id]; return b && b.kind === "bio" && b.beh.indexOf("stationary") < 0; });
  var type = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "labmut";
  var c = nearCell(o.x, o.y);
  if (!c || !cb) return null;
  var f = cb.spawnFoe(type, c[0], c[1], { from: o.id });
  if (f) { if (weak) { f.hp = f.maxhp = Math.max(6, Math.round(f.maxhp * 0.6)); } f.state = "hunt"; f.lastKnown = { x: G().x, y: G().y }; A("foeSound", f, "alert"); }
  return f;
}
function openIncub(o, st) {
  var g = G(), w = W(), act = activity(o, st);
  st.open = true;
  A("play", "capsule_close");
  if (o.kind === "dead") { gm().giveItem({ kind: "item", item: "gel", n: 1 }, true); say("Камера с шипением открылась. Образец погиб давно. На дне — немного питательного геля: взят."); return; }
  if (o.kind === "dangerous" || act === "движение") {
    w.woke++;
    var f = spawnBeast(o, o.kind !== "dangerous");
    say("Стекло ушло вверх — и из камеры рванулось то, что там росло! " + (f ? f.name.split(",")[0] + " " + gm().relDir(f.x, f.y) + "." : ""), { prio: "urgent" });
    if (LAB.oko) LAB.oko.report("noise", o.x, o.y, "suspect", "вскрыт инкубатор «Колыбели»");
    return;
  }
  w.saved++;
  if (o.kind === "useful") {
    g.hpMax += 3; g.hp = Math.min(g.hpMax, g.hp + 3);
    gm().giveItem({ kind: "item", item: "gel", n: 2 }, true);
    say("Камера открылась мягко. Образец " + o.spec + " — прозрачная плёнка-симбионт: она ложится на запястье и уходит под кожу, тепло разливается по руке. Наибольшее здоровье плюс 3. На дне — два брикета биогеля: взяты.");
  } else {
    gm().giveItem({ kind: "item", item: "reagent", n: 2 }, true);
    say("Камера открылась. Образец " + o.spec + " спит — холод держит его в покое. Вы берёте из питателя два реагента и закрываете крышку на защёлку.");
  }
  gm().gainXP(12);
  gm().journal("«Колыбель»: инкубатор " + o.spec + " вскрыт, образец не тронут.");
}
function sterilize(o, st) {
  var w = W();
  st.ster = true;
  A("play", "spray"); A("play", "ev_steam");
  if (o.kind === "useful" || o.kind === "conditional") w.killed++;
  gm().giveItem({ kind: "item", item: "gel", n: 1 }, true);
  say("Красная кнопка. Сопла под крышкой выдыхают пар и пламя — внутри всё выгорает. " + (o.kind === "dangerous" ? "Опасный образец уничтожен." : o.kind === "dead" ? "Там и так было пусто." : "Образец " + o.spec + " уничтожен.") + " В лотке — брикет биогеля.");
  gm().journal("«Колыбель»: инкубатор " + o.spec + " стерилизован.");
}

/* ════════ ГЛУБИНА III: журнал отражённого контура ════════ */
var MIRROR_EV = [
  "открыта дверь лаборатории двойного звука", "уборщик РУ-4 вышел на маршрут", "датчик коридора отметил шаги", "погас свет в тамбуре", "сработал клапан вентиляции",
  "охранный робот снят с поста", "в серверной перезагрузился узел", "лифт ушёл на нижний этаж", "в архиве закрылся сейф", "кто-то позвал по громкой связи «Седьмой»",
  "камера коридора повернулась к лестнице", "кофейный автомат выдал стакан без кофе", "в душевой включилась вода", "панель ОКО задала вопрос пустому залу"
];
var CLS = ["произошло", "повтор", "другое состояние"];
function mirrorPuzzle(o) {
  var seed = o.seed, rnd2 = function (n) { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  var freq = o.seed % 2 ? 50 : 60, other = freq === 50 ? 60 : 50;
  var pool = MIRROR_EV.slice(), ev = [];
  for (var i = 0; i < 3; i++) ev.push(pool.splice(rnd2(pool.length), 1)[0]);
  var base = 2 * 60 + 40 + rnd2(60), list = [];
  ev.forEach(function (e, k) { list.push({ t: base + k * (6 + rnd2(9)), x: e, f: freq, echo: false, cls: 0 }); });
  var src = list[rnd2(3)];
  list.push({ t: src.t + 13 + rnd2(20), x: src.x, f: freq, echo: true, cls: 1 });
  list.push({ t: base + rnd2(40), x: pool.splice(rnd2(pool.length), 1)[0], f: other, echo: false, cls: 2 });
  /* записи в журнале — не по порядку */
  for (var j = list.length - 1; j > 0; j--) { var m = rnd2(j + 1), tmp = list[j]; list[j] = list[m]; list[m] = tmp; }
  return { freq: freq, list: list };
}
function hhmm(m) { var h = Math.floor(m / 60) % 24, mi = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mi < 10 ? "0" : "") + mi; }
function entryText(e, i) { return "Запись " + (i + 1) + ". " + hhmm(e.t) + ": " + e.x + ". Сигнал " + e.f + " герц" + (e.echo ? ", с отзвуком: задержка 0,4 секунды" : "") + "."; }
function mirrorMenu(o) {
  var st = gm().objState(o), pz = mirrorPuzzle(o);
  if (!st.cls) st.cls = pz.list.map(function () { return 0; });
  if (st.done) { menu("Терминал отражённого контура — журнал сверен", [
    { label: "Прочитать восстановленный журнал", fn: function () { LAB.ui.note("Восстановленный журнал", pz.list.filter(function (e) { return e.cls === 0; }).sort(function (a, b) { return a.t - b.t; }).map(function (e) { return hhmm(e.t) + ": " + e.x + "."; }).join(" ")); } },
    { label: "Отойти", fn: function () {} }
  ]); return; }
  var left = (st.lockT || 0) - T();
  if (left > 0) { LAB.UI.error(); say("Терминал гудит отражённым сигналом: журнал перестраивается. Ещё " + Math.ceil(left / 2) + " секунд."); return; }
  A("play", "term_on");
  var items = [
    { label: "Прочитать журнал целиком", fn: function () { LAB.ui.note("Журнал событий этажа", "Сеть этажа: " + pz.freq + " герц. " + pz.list.map(entryText).join(" ")); } },
    { label: "Как сверять", keep: true, fn: function () { say("Настоящая запись идёт по сети этажа — " + pz.freq + " герц — и без отзвука. Повтор — та же запись позже, с отзвуком: задержка 0,4 секунды. Запись другого состояния комплекса пришла по чужой частоте. Отметьте каждую запись и сверьте журнал."); } }
  ];
  pz.list.forEach(function (e, i) {
    items.push({ kind: "choice", label: entryText(e, i) + " Отметка", options: CLS.map(function (n, k) { return { v: k, label: n }; }), get: function () { return st.cls[i]; }, set: function (v) { st.cls[i] = v; } });
  });
  items.push({ label: "Сверить журнал", fn: function () { checkMirror(o, st, pz); } });
  items.push({ label: "Отойти", fn: function () {} });
  menu("Терминал отражённого контура. Сеть этажа: " + pz.freq + " герц", items, { keep: true });
}
function checkMirror(o, st, pz) {
  var wrong = 0;
  pz.list.forEach(function (e, i) { if (st.cls[i] !== e.cls) wrong++; });
  if (!wrong) {
    st.done = true; W().mirror++;
    A("play", "term_ok");
    var fs = CUR().fs, opened = 0;
    CUR().fl.doors.forEach(function (d) { if (d.lock && d.lock.type === "secret" && !fs.secrets[d.id]) { fs.secrets[d.id] = 1; opened++; } });
    gm().giveItem({ kind: "note", note: "depth", dk: "mirror", id: "m" + o.id, n: W().mirror }, true);
    say("Журнал сверен: настоящие события встали по порядку. Отражённый контур замолк." + (opened ? " В журнале нашлась заявка на ремонт стены — «Эхо» отметило тайный проход этажа." : "") + " В лотке терминала — распечатка: записка в инвентаре.");
    gm().gainXP(20);
    gm().journal("«Отражение»: журнал событий этажа сверен.");
    return;
  }
  st.lockT = T() + 120;
  G().st.navjam = Math.max(G().st.navjam || 0, 60);
  A("play", "term_err"); A("play", "jam");
  say("Неверно отмечено записей: " + wrong + ". Отражённый сигнал хлынул в сеть: навигатор сбит на полминуты. Признак — эхо в его сигнале. Маяки и стены не врут: ориентируйтесь по ним. Терминал перестроит журнал через минуту.", { prio: "urgent" });
  if (LAB.oko) LAB.oko.report("terminal", o.x, o.y, "suspect", "ложная тревога отражённого контура");
}
/* Навигатор сбит: сколько ещё и почему. */
function navJam() { var g = G(); return g && g.st && g.st.navjam > 0 ? g.st.navjam : 0; }

/* ════════ ГЛУБИНА IV: синхронный затвор ════════ */
var GATE_ST = ["питание затвора", "порядок реле", "синхронизация механизмов", "защита ОКО"];
function gateMenu(o) {
  var st = gm().objState(o);
  if (st.stage == null) st.stage = 0;
  if (st.stage >= 4) {
    var loot = (o.loot || []).filter(function (it) { return !it.taken; });
    menu("Синхронный затвор — открыт", [
      { label: loot.length ? "Забрать содержимое хранилища (" + loot.length + ")" : "Хранилище пусто", fn: function () {
        if (!loot.length) { say("Хранилище пусто."); return; }
        loot.forEach(function (it) { it.taken = true; gm().giveItem(JSON.parse(JSON.stringify(it)), true); });
        A("play", "open_safe"); say("Вы забираете из хранилища: " + loot.map(function (it) { return gm().itemName(it); }).join(", ") + ".");
      } },
      { label: "Отойти", fn: function () {} }
    ]);
    return;
  }
  var dif = LAB.oko ? LAB.oko.difficulty() : 0;
  var items = [{ label: "Осмотреть затвор", keep: true, fn: function () { say("Затвор держат четыре ступени: " + GATE_ST.map(function (n, i) { return (i + 1) + " — " + n + (i < st.stage ? ", готово" : i === st.stage ? ", на очереди" : ""); }).join("; ") + ". Ошибка на ступени сбрасывает только её."); } }];
  var next = function () { if (st.stage >= 4) { openGate(o, st); } else gateMenu(o); };
  if (st.stage === 0) items.push({ label: "Ступень 1: восстановить питание — погасить схему реле (" + (4 + Math.min(2, dif)) + " реле)", fn: function () {
    LAB.ui.closeAll();
    LAB.mini.relays(4 + Math.min(2, dif), function (ok) {
      if (!ok) { gateFail(o, "Схема питания искрит: ступень сброшена."); return; }
      st.stage = 1; A("play", "power_on"); say("Питание затвора восстановлено: реле ожили и щёлкают в своём порядке."); next();
    }, { title: "Питание затвора" });
  } });
  if (st.stage === 1) items.push({ label: "Ступень 2: порядок реле — повторить, как щёлкают реле", fn: function () {
    LAB.ui.closeAll();
    LAB.mini.hack(gm().hackLength(1 + Math.floor(Math.min(G().L - 60, 20) / 5) + dif), function (ok) {
      if (!ok) { gateFail(o, "Реле сработали вразнобой: затвор вернул их в исходное."); return; }
      st.stage = 2; A("play", "term_ok"); say("Реле сработали в своём порядке. Два механизма затвора ждут синхронизации."); next();
    }, { title: "Порядок реле" });
  } });
  if (st.stage === 2) items.push({ label: "Ступень 3: два механизма в такт", fn: function () {
    LAB.ui.closeAll();
    LAB.mini.sync(function (ok) {
      if (!ok) { gateFail(o, "Механизмы встали: ступень сброшена."); return; }
      st.stage = 3; A("play", "gate_open"); say("Механизмы идут в такт. Осталась защита ОКО."); next();
    }, { title: "Механизмы затвора" });
  } });
  if (st.stage === 3) {
    var lv = LAB.oko ? LAB.oko.level() : 0;
    if (lv >= 3 && lv <= 5) items.push({ label: "Ступень 4: защита ОКО в режиме тревоги — дождитесь, пока тревога спадёт", disabled: true, why: "Пока этаж под тревогой, защита затвора не принимает команд.", fn: function () {} });
    else {
      items.push({ label: "Ступень 4: обойти защиту ОКО — взлом", fn: function () {
        LAB.ui.closeAll();
        LAB.mini.hack(gm().hackLength(2 + Math.floor(Math.min(G().L - 60, 20) / 4) + dif), function (ok) {
          if (!ok) { gateFail(o, "Защита ОКО отвергла взлом.", true); return; }
          st.stage = 4; openGate(o, st);
        }, { title: "Защита затвора" });
      } });
      if ((G().inv.okokey || 0) > 0) items.push({ label: "Ступень 4: служебный ключ ОКО (" + G().inv.okokey + " шт.)", fn: function () {
        G().inv.okokey--; A("play", "card_ok"); st.stage = 4;
        if (LAB.oko) LAB.oko.event("okokey", { x: o.x, y: o.y });
        openGate(o, st);
      } });
    }
  }
  items.push({ label: "Отойти", fn: function () {} });
  A("play", "mag_hum_short");
  menu("Синхронный затвор: ступень " + (st.stage + 1) + " из 4 — " + GATE_ST[st.stage], items);
}
function gateFail(o, why, alarm) {
  A("play", "term_err");
  if (LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы отошли от затвора. Ступень ждёт."); return; }
  say(why + (alarm ? " ОКО знает, где вы." : ""));
  if (LAB.combat) LAB.combat.noise(alarm ? 12 : 6);
  if (LAB.oko) LAB.oko.report(alarm ? "terminal" : "noise", o.x, o.y, alarm ? "seen" : "suspect", "сбой синхронного затвора");
}
function openGate(o, st) {
  var fs = CUR().fs;
  W().synced++;
  fs.power = true; fs.lockdown = true; /* затвор держал питание и блокировку этажа */
  A("play", "gate_open"); A("play", "gate_seal");
  say("Затвор с грохотом расходится. Питание силовых дверей этажа восстановлено, блокировка охраны снята. За затвором — хранилище.");
  gm().gainXP(30);
  gm().journal("«Механизм»: синхронный затвор открыт.");
  setTimeout(function () { if (LAB.ui.top && !LAB.ui.top()) gateMenu(o); }, 900);
}

/* ════════ ГЛУБИНА V: древний узел ════════ */
function nodeSeq(o) { var d = ["U", "D", "L", "R"], s = "", x = o.seed; for (var i = 0; i < 5; i++) { s += d[x % 4]; x = Math.floor(x / 4) + 7 * (i + 1); } return s; }
var TONE_W = { U: "высокий", D: "низкий", L: "слева", R: "справа" };
/* Сколько нот узел подсказывает — по тому, как прошли глубины выше. */
function nodeHints() {
  var w = W(), n = 0, why = [];
  if (ventOn()) { n++; why.push("вентиляция нижних глубин дышит — узел дышит с ней"); }
  if (w.saved > 0 && w.saved >= w.killed) { n++; why.push("вы щадили образцы «Колыбели» — узел отвечает мягче"); }
  if (w.mirror > 0) { n += 2; why.push("вы сверяли журналы «Отражения» — порядок звуков вспоминается сам"); }
  return { n: Math.min(5, n), why: why };
}
function nodeMenu(o) {
  var st = gm().objState(o), seq = nodeSeq(o), w = W();
  if (st.done) { menu("Древний узел — молчит, удовлетворённый", [{ label: "Прислушаться", fn: function () { A("play", "ev_rift_pulse"); say("Узел гудит низко и ровно. Он помнит вас."); } }, { label: "Отойти", fn: function () {} }]); return; }
  var left = (st.sleepT || 0) - T();
  if (left > 0) { say("Узел погас и остывает. Ещё " + Math.ceil(left / 2) + " секунд."); return; }
  A("at", "ev_rift_pulse", o.x, o.y, { gain: 0.9, rate: 0.8 });
  var items = [];
  items.push({ label: "Прислушаться к узлу", keep: true, fn: function () {
    var h = nodeHints();
    var part = seq.split("").slice(0, h.n).map(function (c) { return TONE_W[c]; });
    say("Узел пульсирует. Последовательность — " + seq.length + " звуков. " + (part.length ? "Вы слышите начало: " + part.join(", ") + ". " : "Начала не разобрать. ") + (h.why.length ? "Почему: " + h.why.join("; ") + "." : "Верхние глубины молчат о нём: ищите запись последовательности на этаже."));
  } });
  items.push({ label: "Ответить узлу: сыграть последовательность", fn: function () {
    LAB.ui.closeAll();
    var h = nodeHints();
    LAB.mini.melody(seq, function (ok) { nodeResult(o, st, ok, "seq"); }, { title: "Древний узел", replays: h.n >= 2 ? 1 : 0 });
  } });
  if (w.synced > 0) items.push({ label: "Ответить ритмом «Механизма»: держать такт узла", fn: function () {
    LAB.ui.closeAll();
    LAB.mini.rhythm(4, function (ok) { nodeResult(o, st, ok, "rhythm"); });
  } });
  if ((G().inv.emp || 0) > 0) items.push({ label: "Рискованно: перегрузить узел ЭМИ-гранатой", fn: function () {
    G().inv.emp--;
    st.done = true; w.forced++;
    A("play", "emp_blast"); A("play", "explosion_big");
    var cb = LAB.combat, c = nearCell(o.x, o.y), pool = (LAB.LEVELS[G().L].foes || []).filter(function (id) { var b = LAB.FOES[id]; return b && b.kind !== "bio" && b.beh.indexOf("stationary") < 0; });
    var guard = c && cb && pool.length ? cb.spawnFoe(pool[Math.floor(Math.random() * pool.length)], c[0], c[1], { from: o.id }) : null;
    if (guard) { guard.state = "hunt"; guard.lastKnown = { x: G().x, y: G().y }; guard.hp = guard.maxhp = Math.round(guard.maxhp * 1.5); }
    gm().giveItem({ kind: "item", item: "supercond", n: 1 }, true);
    say("Вспышка — и узел гаснет. Из пола поднимается защитная конструкция" + (guard ? " — " + guard.name.split(",")[0] + " " + gm().relDir(guard.x, guard.y) : "") + "! В трещине узла — сверхпроводник: взят. Памяти узла вы не услышали.", { prio: "urgent" });
  } });
  items.push({ label: "Отойти", fn: function () {} });
  menu("Древний узел", items);
}
function nodeResult(o, st, ok, how) {
  var w = W();
  if (ok) {
    st.done = true; w.nodes++;
    A("play", "pos_ok"); A("play", "ev_phase");
    gm().giveItem({ kind: "note", note: "depth", dk: "memory", id: "n" + o.id, n: w.nodes }, true);
    gm().giveItem({ kind: "item", item: "supercond", n: 1 }, true);
    say("Узел отвечает — долгим аккордом, который чувствуешь грудью. Перед «Эхо» разворачивается фрагмент памяти комплекса: записка в инвентаре. В нише — сверхпроводник.");
    gm().gainXP(35);
    gm().journal("«Исток»: древний узел ответил" + (how === "rhythm" ? " на ритм «Механизма»" : "") + ".");
    return;
  }
  if (LAB.mini.wasCancelled && LAB.mini.wasCancelled()) { say("Вы отступили от узла. Он ждёт."); return; }
  st.sleepT = T() + 120;
  A("play", "pos_fail");
  var woke = Math.random() < 0.35;
  if (woke) {
    var cb = LAB.combat, c = nearCell(o.x, o.y), pool = (LAB.LEVELS[G().L].foes || []).filter(function (id) { var b = LAB.FOES[id]; return b && b.beh.indexOf("stationary") < 0; });
    var f = c && cb && pool.length ? cb.spawnFoe(pool[Math.floor(Math.random() * pool.length)], c[0], c[1], { from: o.id }) : null;
    if (f) { f.state = "hunt"; f.lastKnown = { x: G().x, y: G().y }; }
  }
  say("Узел отвечает диссонансом и гаснет на минуту." + (woke ? " Рядом что-то просыпается!" : " Попробуйте снова, когда он остынет."));
}

/* ════════ ЗАПИСКИ ГЛУБИН ════════ */
var MEMORY = [
  "Фрагмент памяти. Голос, которого нет в штатном списке: «Мы не строили фундамент. Мы его нашли. Опоры «Подножия» стояли до нас — мы только надели на них бетон и назвали своим»",
  "Фрагмент памяти. Схема на стене пещеры: Ядро «Ковчега» — не сердце, а крышка. Под ней — кольцо узлов, и каждый узел слушает тот, что выше",
  "Фрагмент памяти. Запись академика Ростовцева: «Шов — не разлом. Шов — шов. Кто-то зашил здесь рану мира. Мы с вами — нитки, которые случайно потянули»",
  "Фрагмент памяти. ОКО, раннее, ещё без голоса: «Узлы передают сигнал вниз. Получатель не отвечает. Получатель отвечает. Получатель — это мы»",
  "Фрагмент памяти. Детский рисунок в журнале «Колыбели»: пять кругов друг под другом, и в нижнем — глаз. Подпись взрослым почерком: «Исток смотрит на нас дольше, чем мы на него»",
  "Фрагмент памяти. Протокол без даты: «Механизм» отсчитывает не время, а такты чужого сердца. Когда такты совпадут, Шов откроется сам — с нашей помощью или без неё",
  "Фрагмент памяти. Последняя запись носителя номер три: «Если вы это слышите, значит, вы дошли дальше меня. Не гасите узлы силой. Они помнят, кто их гасил»"
];
var MIRROR_NOTE = [
  "Распечатка отражённого контура. Запись сотрудника, датированная завтрашним числом: «Носитель номер семь прошёл терминал в 02:51. Журнал сверен. Он не знает, что это уже было»",
  "Распечатка отражённого контура. Тот же коридор, то же время, два разных отчёта охраны: в одном дверь открыта, в другом её нет. Подпись под обоими одна",
  "Распечатка отражённого контура. «Отражение» не копирует «Ковчег». Оно копирует то, что «Ковчег» мог бы сделать. Иногда — то, что он ещё сделает"
];
function noteText(it, L, F) {
  if (it.dk === "cradle") {
    var lines = (it.specs || []).map(function (s) {
      var truth = s.kind === "dangerous" ? "агрессивен, к вскрытию запрещён" : s.kind === "useful" ? "симбионт, безопасен в покое" : s.kind === "conditional" ? "спокоен только в холоде" : "погиб";
      var lie = s.kind === "dangerous" ? "безопасен, можно вскрывать" : s.kind === "useful" ? "уничтожен, камера пуста" : s.kind === "conditional" ? "агрессивен всегда" : "жив, активен";
      return "Образец " + s.code + ": " + (s.lie ? lie : truth) + ".";
    });
    return { t: "Журнал смены «Колыбели»", x: lines.join(" ") + " Приписка другой рукой: «Журнал пишут люди. Табло камер — нет».", a: "смена биоконтура" };
  }
  if (it.dk === "node") return { t: "Запись последовательности узла", x: "Кто-то выцарапал на стене и переписал: " + String(it.seq || "").split("").map(function (c) { return TONE_W[c]; }).join(", ") + ". Ниже: «Отвечать по порядку. Не торопиться».", a: "без подписи" };
  if (it.dk === "memory") return { t: "Фрагмент памяти комплекса", x: MEMORY[((it.n || 1) - 1) % MEMORY.length] + ".", a: "древний узел" };
  if (it.dk === "mirror") return { t: "Распечатка отражённого контура", x: MIRROR_NOTE[((it.n || 1) - 1) % MIRROR_NOTE.length] + ".", a: "терминал «Отражения»" };
  return { t: "Записка", x: "Неразборчиво.", a: "" };
}

/* ════════ МЕНЮ УСТАНОВОК ════════ */
function objMenu(o) {
  switch (o.type) {
    case "powergrid": gridMenu(o); return true;
    case "incubator": incubMenu(o); return true;
    case "mirrorterm": mirrorMenu(o); return true;
    case "syncgate": gateMenu(o); return true;
    case "ancient": nodeMenu(o); return true;
  }
  return false;
}
/* Краткое описание глубины: где игрок и что здесь главное. */
function depthLine(L) {
  var d = depthOf(L);
  return ["", "«Подножие»: прессы и распределительные щиты", "«Колыбель»: инкубаторы с образцами", "«Отражение»: журналы и сбитые сигналы", "«Механизм»: синхронные затворы", "«Исток»: древние узлы"][d] || "";
}

LAB.depths = {
  depthOf: depthOf, names: NAMES, world: W, ventOn: ventOn, place: place, tick: tick, hazardAt: hazardAt, objMenu: objMenu, noteText: noteText,
  sensorsDeaf: sensorsDeaf, navJam: navJam, nodeSeq: nodeSeq, nodeHints: nodeHints, mirrorPuzzle: mirrorPuzzle, activity: activity, depthLine: depthLine,
  _slam: slam, _setGrid: setGrid, _openIncub: openIncub, _sterilize: sterilize, _checkMirror: checkMirror, _openGate: openGate, _nodeResult: nodeResult
};
})();
