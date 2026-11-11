/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — жесты и клавиши.
   (после 4.6) Что делает каждый жест в игре — таблица gestures.js: игрок
   переназначает жесты сам («Настройки» → «Управление» → «Жесты»). Здесь —
   распознавание жестов и куда они идут: в игру, в окно, в мини-игру.
   Распознаются: свайпы одним–четырьмя пальцами; свайп одним пальцем с
   удержанием (идти, очередь); зигзаги одним пальцем (влево-вправо и
   прочие — составные); касание одним пальцем, двойное и долгое; касания
   двумя, тремя и четырьмя пальцами — одно, двойное, тройное, а ещё каждое
   из них с удержанием (последнее касание серии не отпускают).
   Как задано изначально — прежние жесты на прежних местах:
   один палец: свайп — шаг или выстрел, с удержанием — идти или очередь,
   касание — что рядом, двойное — действия, долгое — повторить фразу,
   влево-вправо — граната, вправо-влево — выбрать гранату, вверх-вниз —
   ловушка, вниз-вверх — мина; два пальца: вверх — осмотреться, вниз —
   сканер, влево — аптечка, вправо — навигатор, касание — перезарядить,
   двойное — следующее оружие; три пальца: касание — оружие, вверх —
   персонаж, вниз — инвентарь, влево — кредиты, вправо — тело; четыре
   пальца: касание — здоровье и заряд, двойное — импланты, вверх — цели
   навигатора, влево и вправо — объявления ОКО, вниз — тишина (в окнах,
   прологе и мини-играх — всегда).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
var pad = null;
var pts = {};          /* активные касания */
var gest = null;       /* текущий жест */
var chain = null;      /* серия касаний: { n, taps, timer } — ждём следующего касания */
var walk = null;       /* удержание: идти или стрелять очередью */
var swallowN = 0;     /* первое касание будит звук — его не толкуем */
var SCR2GAME = { U: "N", D: "S", L: "W", R: "E" };
var TAPID = ["", "t", "d", "r"], HOLDID = ["", "p", "dp", "rp"];

/* (после 4.6) чувствительность касаний — «Настройки» → «Управление» */
function S() { return LAB.settings || {}; }
function GAP() { var v = +S().gTapGap; return v >= 150 && v <= 1000 ? v : 380; }
function HOLD() { var v = +S().gHold; return v >= 250 && v <= 2000 ? v : 600; }
function swK() { var v = +S().gSwipe; return v >= 0.5 && v <= 2 ? v : 1; }
function thr() { var m = Math.min(window.innerWidth || 360, window.innerHeight || 640); return Math.max(24, Math.min(60, m * 0.07)) * swK(); }
/* долгое касание одним пальцем — по отпусканию, как прежде, не раньше 0,9 секунды */
function pressMs() { return Math.max(900, HOLD() + 200); }

/* ── КАСАНИЯ ── */
/* (2.0) Инструмент на весь экран (instruments.js): касания — прямо ему, без жестов. */
function surf(e) {
  var s = LAB.surface;
  if (!s || !s.active()) return false;
  if (e.cancelable) e.preventDefault();
  if (e.type === "pointerdown") { try { pad.setPointerCapture(e.pointerId); } catch (x) { /* */ } LAB.AE.ensure(); }
  s.pointer(e);
  return true;
}
function down(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (surf(e)) return;
  if (e.pointerType === "touch") LAB.keysMode = false; /* подсказки — о жестах */
  try { pad.setPointerCapture(e.pointerId); } catch (x) { /* */ }
  e.preventDefault();
  LAB.AE.ensure();
  var now = performance.now();
  if (!gest) {
    gest = { t0: now, max: 0, ids: {}, ended: false, fin: [], held: false, dirAt: 0, firstDir: null, maxDisp: 0 };
    /* серия касаний: пока пальцы на экране, ждать не перестаём — решит отпускание */
    if (chain) clearTimeout(chain.timer);
    /* сырое касание — мини-игре на ритм */
    if (LAB.mini && LAB.mini.raw && LAB.mini.raw()) { gest.rawMini = true; dispatch({ kind: "down", n: 1, t: now }); }
  }
  pts[e.pointerId] = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: now, lastMove: now, ext: { x: e.clientX, y: e.clientY } };
  gest.ids[e.pointerId] = 1;
  var n = Object.keys(pts).length;
  if (n > gest.max) gest.max = n;
  armTapHold(gest);
}
function moveEv(e) {
  if (surf(e)) return;
  var p = pts[e.pointerId];
  if (!p || !gest) return;
  e.preventDefault();
  var dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) p.lastMove = performance.now();
  p.x = e.clientX; p.y = e.clientY;
  var T = thr();
  if (gest.max === 1 && !gest.tapHeld) {
    var d0x = p.x - p.x0, d0y = p.y - p.y0;
    var disp = Math.max(Math.abs(d0x), Math.abs(d0y));
    if (disp > gest.maxDisp) gest.maxDisp = disp;
    /* первое направление и разворот (вверх-вниз, влево-вправо) */
    if (!gest.firstDir && disp > T) {
      gest.firstDir = Math.abs(d0x) > Math.abs(d0y) ? (d0x > 0 ? "R" : "L") : (d0y > 0 ? "D" : "U");
      p.ext = { x: p.x, y: p.y };
      gest.dirAt = performance.now();
      armHold(p);
    } else if (gest.firstDir) {
      var f = gest.firstDir;
      /* крайняя точка вдоль первого направления */
      if (f === "U" && p.y < p.ext.y) p.ext.y = p.y;
      if (f === "D" && p.y > p.ext.y) p.ext.y = p.y;
      if (f === "L" && p.x < p.ext.x) p.ext.x = p.x;
      if (f === "R" && p.x > p.ext.x) p.ext.x = p.x;
      var back = f === "U" ? p.y - p.ext.y : f === "D" ? p.ext.y - p.y : f === "L" ? p.x - p.ext.x : p.ext.x - p.x;
      if (back > T * 0.9 && !gest.held) gest.zig = true;
    }
  }
}
/* Свайп одним пальцем с удержанием: палец ушёл в сторону и замер. */
function armHold(p) {
  var g = gest;
  clearTimeout(g.holdT);
  var check = function () {
    if (gest !== g || g.ended || g.zig || g.max !== 1) return;
    var now = performance.now();
    if (now - p.lastMove >= 260) {
      g.held = true;
      flushChain();
      startHold(g.firstDir);
    } else g.holdT = setTimeout(check, 60);
  };
  g.holdT = setTimeout(check, 300);
}
/* (после 4.6) Касание с удержанием: пальцы на месте дольше, чем «Удержание срабатывает через».
   Срабатывает, пока пальцы ещё на экране: короткая вибрация — можно отпускать. Последнее касание
   серии тоже можно задержать: двойное и тройное касание с удержанием. Одним пальцем — долгое
   касание по отпусканию, как прежде. Если на это удержание ничего не назначено — касание
   остаётся касанием, сколько бы его ни держали. */
function armTapHold(g) {
  clearTimeout(g.tapHoldT);
  if (g.rawMini) return;
  g.tapHoldT = setTimeout(function () { tapHoldCheck(g); }, HOLD());
}
function tapHoldCheck(g) {
  if (gest !== g || g.ended || g.held || g.tapHeld || g.zig || g.firstDir) return;
  var n = Math.min(4, g.max);
  if (n < 2 || Object.keys(pts).length < g.max) return;
  var T = thr();
  for (var id in pts) { var p = pts[id]; if (Math.max(Math.abs(p.x - p.x0), Math.abs(p.y - p.y0)) > T * 0.6) return; }
  var taps = chain && chain.n === n ? Math.min(3, chain.taps + 1) : 1;
  if (!wantHold(n, taps)) return;
  if (chain && chain.n !== n) flushChain();
  else if (chain) { clearTimeout(chain.timer); chain = null; }
  g.tapHeld = true;
  LAB.vib(30);
  dispatch({ kind: "thold", n: n, taps: taps });
}
function up(e) {
  if (surf(e)) return;
  var p = pts[e.pointerId];
  if (!p || !gest) return;
  e.preventDefault();
  gest.fin.push({ dx: p.x - p.x0, dy: p.y - p.y0 });
  delete pts[e.pointerId];
  if (Object.keys(pts).length) return; /* ждём остальные пальцы */
  var g = gest; gest = null; g.ended = true;
  clearTimeout(g.holdT); clearTimeout(g.tapHoldT);
  if (g.held) { stopHold(); return; }
  if (g.tapHeld) return; /* удержание уже сработало */
  finishGesture(g, p);
}
function cancelEv(e) {
  if (surf(e)) return;
  delete pts[e.pointerId];
  if (!Object.keys(pts).length && gest) { clearTimeout(gest.holdT); clearTimeout(gest.tapHoldT); if (gest.held) stopHold(); gest = null; flushChain(); }
}
function finishGesture(g, last) {
  var T = thr();
  /* смещение — среднее по всем пальцам */
  var dx = 0, dy = 0;
  g.fin.forEach(function (f) { dx += f.dx; dy += f.dy; });
  if (g.fin.length) { dx /= g.fin.length; dy /= g.fin.length; }
  var n = Math.min(4, g.max);
  if (n === 1 && g.zig && g.firstDir) {
    var second = { U: "D", D: "U", L: "R", R: "L" }[g.firstDir];
    flushChain();
    dispatch({ kind: "zig", n: 1, dir: g.firstDir, dir2: second });
    return;
  }
  var disp = Math.max(Math.abs(dx), Math.abs(dy));
  if (disp >= T * (n > 1 ? 0.8 : 1)) {
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U");
    flushChain();
    dispatch({ kind: "swipe", n: n, dir: dir });
    return;
  }
  /* касание уже ушло ритм-головоломке как «down»: касания и удержания из него не делаем —
     иначе оно дойдёт до игры и оборвёт итог головоломки */
  if (g.rawMini) { flushChain(); return; }
  if (performance.now() - g.t0 > pressMs() && n === 1) { flushChain(); dispatch({ kind: "press", n: 1 }); return; }
  tap(n);
}
/* Касание: серия одним числом пальцев — двойное, тройное. Ждём следующего касания, только если
   более длинной серии есть что делать (wantMore); нет — срабатывает сразу. */
function tap(n) {
  var taps = 1;
  if (chain) {
    if (chain.n === n) { taps = chain.taps + 1; clearTimeout(chain.timer); chain = null; }
    else flushChain();
  }
  if (taps >= 3 || !wantMore(n, taps)) { dispatchTaps(n, taps); return; }
  var c = chain = { n: n, taps: taps };
  c.timer = setTimeout(function () { if (chain === c) flushChain(); }, GAP());
}
function flushChain() {
  var c = chain;
  if (!c) return;
  chain = null; clearTimeout(c.timer);
  dispatchTaps(c.n, c.taps);
}
function dispatchTaps(n, taps) { dispatch({ kind: taps === 1 ? "tap" : taps === 2 ? "dtap" : "ttap", n: n, taps: taps }); }
/* В игре ждём продолжения, если на более длинную серию того же числа пальцев что-то назначено;
   в окнах и мини-играх — как прежде: двойное касание одним, двумя и четырьмя пальцами. */
function wantMore(n, taps) {
  if (taps >= 3) return false;
  var GS = LAB.gestures;
  if (GS && route() === "game") { for (var k = taps + 1; k <= 3; k++) if (GS.bound(TAPID[k] + n)) return true; return false; }
  return taps < 2 && (n === 1 || n === 2 || n === 4);
}
function wantHold(n, taps) { var GS = LAB.gestures; return !!GS && route() === "game" && GS.bound(HOLDID[taps] + n); }

/* ── УДЕРЖАНИЕ: идти дальше или стрелять очередью ── */
function startHold(dir) {
  stopHold();
  if (route() !== "game") { dispatch({ kind: "swipe", n: 1, dir: dir }); return; }
  dispatch({ kind: "hswipe", n: 1, dir: dir });
}
/* Идти, пока держат: первый шаг через delay (касание — сразу, клавиша — после своего шага). */
function walkLoop(gdir, delay) {
  stopHold();
  var game = LAB.game, G = game.G;
  walk = { dir: gdir };
  var w = walk;
  var stepFn = function () {
    if (walk !== w) return;
    if (route() !== "game") { stopHold(); return; } /* открылось окно (записка) — стоим */
    var ok = game.tryMove(gdir, true);
    if (!ok) { stopHold(); return; }
    w.t = setTimeout(stepFn, stepGap(G));
  };
  if (delay) w.t = setTimeout(stepFn, delay); else stepFn();
}
function fireLoop(gdir) { stopHold(); LAB.combat.startFire(gdir); walk = { fire: true }; }
/* Шаг удержания: под замедлением — реже (иначе шаг «рано» обрывал ходьбу). */
function stepGap(G) { return G.st.slow > 0 ? 440 : G.st.haste > 0 ? 200 : 300; }
function stopHold() {
  if (!walk) return;
  if (walk.fire && LAB.combat) LAB.combat.stopFire();
  clearTimeout(walk.t);
  walk = null;
}
function stopAll() { stopHold(); }

/* ── КУДА ЖЕСТ ── */
function route() {
  if (LAB.mini && LAB.mini.active()) return "mini";
  var ui = LAB.ui;
  if (!ui) return "none";
  var sc = ui.screen();
  if (sc !== "game") return "ui";
  if (ui.layer()) return "ui";
  return "game";
}
/* Имя жеста в таблице gestures.js. */
function gestId(g) {
  var n = Math.min(4, g.n || 1);
  switch (g.kind) {
    case "swipe": return "s" + n + g.dir;
    case "hswipe": return "w1" + g.dir;
    case "zig": return "z1" + g.dir;
    case "tap": return "t" + n;
    case "dtap": return "d" + n;
    case "ttap": return "r" + n;
    case "press": return "p1";
    case "thold": return HOLDID[g.taps || 1] + n;
  }
  return "";
}
function actOf(g) { var GS = LAB.gestures; return GS ? GS.actionOf(gestId(g)) || "none" : "none"; }
function dispatch(g) {
  LAB.AE.ensure();
  if (swallowN > 0 && g.kind !== "down") { swallowN--; return; }
  var r = route();
  /* Тишина: в окнах, прологе и мини-играх — четыре пальца вниз; в игре — жест, на котором она
     стоит (изначально тот же). Тишина работает и пока мир ждёт (лифт, шлюз). */
  if (g.kind !== "down" && (r === "game" ? actOf(g) === "hush" : g.kind === "swipe" && g.n >= 4 && g.dir === "D")) { LAB.Speech.hush(); LAB.vib(20); return; }
  /* любое действие игрока сразу обрывает речь (записку — нет: она дочитывается) */
  if (g.kind !== "down") LAB.Speech.userAct();
  if (g.kind === "down") { if (r === "mini") LAB.mini.gesture(g); return; }
  if (r === "mini") { LAB.mini.gesture(g); return; }
  if (r === "ui") { LAB.ui.gesture(g); return; }
  if (r === "game") { gameGesture(g); return; }
}
/* Пока идёт лифт, шлюз, капсула или «Эхо» удерживает сознание — действия ждут. */
var pauseSaid = 0;
function pausedHint() { var t = Date.now(); if (t - pauseSaid > 2500) { pauseSaid = t; LAB.say("Подождите.", { prio: "info" }); } }
function gameGesture(g) {
  var game = LAB.game, G = game.G;
  var a = actOf(g);
  if (a === "none") return;
  if (!game.entered || G.dead) return;
  if (game.paused) { pausedHint(); return; }
  /* свайп с удержанием: идти или очередь, пока палец на экране */
  if (a === "autoHold" || a === "walk" || a === "burst") {
    var gd = SCR2GAME[g.dir];
    if (!gd) return;
    if (a === "walk" || (a === "autoHold" && !G.drawn)) { walkLoop(gd, 0); return; }
    if (!G.drawn) { LAB.UI.error(); LAB.say("Оружие убрано. Достать — " + LAB.gw("draw", "касание тремя пальцами") + "."); return; }
    fireLoop(gd);
    return;
  }
  LAB.gestures.exec(a, g);
}
/* Повторить последнюю фразу. */
function repeatLast() {
  var el = document.getElementById("caption");
  var t = el ? el.textContent : "";
  if (t) LAB.say(t); else LAB.say("Нечего повторять.");
}

/* ── КЛАВИАТУРА (компьютер, сборка для Windows) ──
   В игре: W A S D — ходьба (удержание — идти дальше), стрелки — выстрел в ту
   сторону (удержание — очередь), R — достать или убрать оружие, Q и E —
   предыдущее и следующее оружие, 1–9 — оружие по номеру, Alt+R или F — перезарядка,
   Enter — действие (дверь, терминал, ящик, выживший), пробел — что рядом,
   Tab — осмотреться, N — навигатор, M — список целей, V — сканер,
   H — аптечка, C — персонаж, I — инвентарь, J — задания и журнал,
   U — импланты, T — здоровье и заряд, K — здоровье и состояние тела,
   B — кредиты, G — поесть, L — ловушки (поставить, снять), P и O — ловушка и
   мина под ноги, Y — бросить гранату (Shift+Y — выбрать гранату),
   точка и запятая — история объявлений ОКО (назад и вперёд), Z — повторить
   фразу, X или Ctrl — тишина, Escape — окно персонажа, F1 — руководство.
   В окнах: стрелки вверх и вниз — пункты, влево и вправо — значение,
   Enter — выбрать, пробел — повторить пункт, Tab — прочитать всё окно,
   Home и End — первый и последний пункт, Escape или Backspace — назад,
   C и I — персонаж и инвентарь.
   Буквы работают и в русской раскладке (Ц Ф Ы В, К, Й, У, А…). */
var KEY_LAT = { "ц": "w", "ф": "a", "ы": "s", "в": "d", "к": "r", "й": "q", "у": "e", "а": "f", "т": "n", "ь": "m", "м": "v", "р": "h", "с": "c", "ш": "i", "о": "j", "г": "u", "е": "t", "я": "z", "ч": "x",
  "п": "g", "л": "k", "ю": ".", "б": ",", "и": "b", "д": "l", "з": "p", "щ": "o", "н": "y" };
var WASD = { w: "N", a: "W", s: "S", d: "E" };
var ARROW = { ArrowUp: "N", ArrowDown: "S", ArrowLeft: "W", ArrowRight: "E" };
var keyHold = null; /* клавиша, которую держат: ходьба или очередь */
function keyName(e) {
  var k = e.key || "";
  if (k.length === 1) { k = k.toLowerCase(); if (KEY_LAT[k]) k = KEY_LAT[k]; }
  return k;
}
function key(e) {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  var k = keyName(e);
  LAB.keysMode = true; /* подсказки — о клавишах */
  /* Ctrl — замолчать, как у чтецов экрана (NVDA, JAWS) */
  if (e.key === "Control") { if (!e.repeat) LAB.Speech.hush(); return; }
  if (e.ctrlKey || e.metaKey) return; /* сочетания системы не трогаем */
  /* (1.5) Alt+R — перезарядка (и в русской раскладке: Alt+К) */
  if (e.altKey && (e.code === "KeyR" || k === "r")) {
    e.preventDefault();
    if (e.repeat || route() !== "game") return;
    var gr = LAB.game;
    if (!gr.entered || gr.G.dead) return;
    if (gr.paused) { pausedHint(); return; }
    LAB.AE.ensure(); LAB.Speech.userAct(); gr.reload();
    return;
  }
  /* (после 4.6) Alt+D — команды дрону и каркасу (и в русской раскладке: Alt+В) */
  if (e.altKey && (e.code === "KeyD" || k === "d")) {
    e.preventDefault();
    if (e.repeat || route() !== "game") return;
    var gd = LAB.game;
    if (!gd.entered || gd.G.dead) return;
    if (gd.paused) { pausedHint(); return; }
    LAB.AE.ensure(); LAB.Speech.userAct();
    if (LAB.drone) LAB.drone.quick();
    return;
  }
  /* одиночные служебные клавиши (Shift, Alt, Insert чтеца экрана, Caps Lock) речь не обрывают */
  if (/^(Shift|Alt|AltGraph|Meta|OS|CapsLock|NumLock|ScrollLock|Insert|ContextMenu|Unidentified|Dead)$/.test(e.key) || e.altKey) return;
  if (e.repeat) { if (ARROW[e.key] || WASD[k] || k === "Tab" || k === " ") e.preventDefault(); return; }
  LAB.AE.ensure();
  var r = route();
  var done = true;
  if (k === "x") { dispatch({ kind: "swipe", n: 4, dir: "D" }); }
  else if (r === "game") done = gameKey(e, k);
  else if (r === "ui") done = uiKey(e, k);
  else if (r === "mini") done = miniKey(e, k);
  else done = false;
  if (done) e.preventDefault();
}
/* Ходьба и очередь по удержанию: шаг сразу, через треть секунды — дальше, пока держат. */
function holdKey(code, fn, holdFn) {
  if (keyHold) stopKeyHold();
  fn();
  var h = keyHold = { code: code };
  h.t = setTimeout(function () { if (keyHold === h) { h.on = true; holdFn(); } }, 320);
}
function stopKeyHold() {
  if (!keyHold) return;
  clearTimeout(keyHold.t);
  if (keyHold.on) stopHold();
  keyHold = null;
}
function gameKey(e, k) {
  var game = LAB.game, G = game.G;
  if (!game.entered || G.dead) return false;
  if (game.paused) { pausedHint(); return true; }
  LAB.Speech.userAct();
  if (WASD[k]) {
    var gd = WASD[k];
    holdKey(e.code || k, function () { game.tryMove(gd, false); }, function () { walkLoop(gd, 300); });
    return true;
  }
  if (ARROW[e.key]) {
    var fd = ARROW[e.key];
    if (!G.drawn) { LAB.UI.error(); LAB.say("Оружие убрано. R — достать оружие."); return true; }
    holdKey(e.code || e.key, function () { LAB.combat.fire(fd, false); }, function () { fireLoop(fd); });
    return true;
  }
  if (/^[1-9]$/.test(k)) { var wi = +k - 1; if (G.weapons[wi]) game.equipWeapon(wi); else LAB.say("Оружия под номером " + k + " нет. Всего — " + G.weapons.length + "."); return true; }
  switch (k) {
    case "r": game.toggleDraw(); return true;
    case "q": game.switchWeapon(-1); return true;
    case "e": game.switchWeapon(1); return true;
    case "f": game.reload(); return true;
    case "Enter": game.interact(); return true;
    case " ": game.nearbyInfo(); return true;
    case "Tab": game.lookAround(); return true;
    case "n": game.navigate(true); return true;
    case "m": if (game.navMenu) game.navMenu(); else game.navigate(true); return true;
    case "v": if (G.implants.indexOf("scan") >= 0) LAB.combat.useImplant("scan"); else game.lookAround(); return true;
    case "h": game.useMedkit(); return true;
    /* (после 4.6) Shift+C — характеристики, Shift+I — груз */
    case "c": if (e.shiftKey && LAB.stats) LAB.stats.menu(); else LAB.ui.character(); return true;
    case "i": if (e.shiftKey && LAB.load) LAB.load.status(); else LAB.ui.inventory(); return true;
    case "j": if (LAB.ui.quests) LAB.ui.quests(); else LAB.ui.inventory("Задания"); return true; /* (3.7, нелогичность) сразу задания */
    case "u": LAB.ui.implants(); return true;
    case "t": game.quickStatus(); return true;
    case "z": repeatLast(); return true;
    /* история объявлений ОКО: точка — назад, запятая — вперёд */
    case ".": LAB.history.show(-1); return true;
    case ",": LAB.history.show(1); return true;
    case "g": game.eatBest(); return true;
    case "k": game.bodyStatus(); return true;
    case "b": game.creditsStatus(); return true;
    case "l": if (LAB.traps) LAB.traps.menu(); return true;
    case "p": if (LAB.traps && LAB.traps.quick) LAB.traps.quick("trap"); return true;
    case "o": if (LAB.traps && LAB.traps.quick) LAB.traps.quick("mine"); return true;
    /* (2.0) Y — бросить гранату, Shift+Y — выбрать гранату */
    case "y": if (LAB.combat && LAB.combat.throwQuick) { if (e.shiftKey) LAB.combat.pickGrenade(false); else LAB.combat.throwQuick(); } return true;
    case "Escape": case "Backspace": if (window.labBack) window.labBack(); return true;
    case "F1": if (LAB.guide) LAB.guide.open(); return true;
  }
  return false;
}
function uiKey(e, k) {
  var ui = LAB.ui;
  LAB.Speech.userAct();
  if (ui.screen && ui.screen() !== "game" && ui.pageOpen && ui.pageOpen()) {
    /* пролог и финал: вправо, Enter, пробел — дальше; влево — назад; Escape или вверх — пропустить */
    var pg = { ArrowRight: "R", Enter: "R", " ": "R", d: "R", ArrowLeft: "L", a: "L", ArrowUp: "U", Escape: "U", w: "U" }[k] || { ArrowRight: "R", ArrowLeft: "L", ArrowUp: "U" }[e.key];
    if (pg) { ui.gesture({ kind: "swipe", n: 1, dir: pg }); return true; }
    if (k === "ArrowDown" || k === "s") { ui.gesture({ kind: "tap", n: 1 }); return true; }
    if (k === "Backspace") { ui.gesture({ kind: "back", n: 1 }); return true; }
    return false;
  }
  var act = { ArrowDown: "next", s: "next", ArrowUp: "prev", w: "prev", ArrowRight: "inc", d: "inc", ArrowLeft: "dec", a: "dec",
    Enter: "select", " ": "repeat", Tab: "all", Home: "first", End: "last", Escape: "back", Backspace: "back", x: "hush", z: "repeat",
    c: "char", i: "inv", j: "quests", F1: "guide", ".": "histBack", ",": "histFwd" }[k];
  if (!act) return false;
  if (ui.key) ui.key(act); else ui.gesture({ kind: act === "back" ? "back" : "tap", n: 1 });
  return true;
}
function miniKey(e, k) {
  var m = LAB.mini;
  LAB.Speech.userAct();
  var dir = { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R", w: "U", s: "D", a: "L", d: "R" }[k] || { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R" }[e.key];
  if (dir) { m.gesture({ kind: "swipe", n: 1, dir: dir }); return true; }
  if (/^[0-9]$/.test(k)) { m.gesture({ kind: "digit", n: 1, d: +k }); return true; }
  if (k === " ") { if (m.raw && m.raw()) m.gesture({ kind: "down", n: 1, t: performance.now() }); else m.gesture({ kind: "tap", n: 1 }); return true; }
  if (k === "Enter") { m.gesture({ kind: "dtap", n: 1 }); return true; }
  if (k === "Escape" || k === "Backspace") { m.gesture({ kind: "back", n: 1 }); return true; }
  return false;
}
function keyUp(e) {
  var k = keyName(e);
  if (keyHold && (keyHold.code === (e.code || k) || keyHold.code === (e.code || e.key))) stopKeyHold();
  else if (!keyHold && walk && (WASD[k] || ARROW[e.key])) stopHold();
}

function init() {
  pad = document.getElementById("pad");
  if (!pad) return;
  var opt = { passive: false };
  pad.addEventListener("pointerdown", down, opt);
  pad.addEventListener("pointermove", moveEv, opt);
  pad.addEventListener("pointerup", up, opt);
  pad.addEventListener("pointercancel", cancelEv, opt);
  pad.addEventListener("lostpointercapture", function (e) { if (surf(e)) return; if (pts[e.pointerId]) up(e); }, opt);
  pad.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", key);
  document.addEventListener("keyup", keyUp);
  window.addEventListener("blur", function () { stopKeyHold(); stopHold(); });
  /* Компьютер: окно игры — приложение для чтеца экрана (NVDA, JAWS), клавиши
     идут прямо в игру, а не в режим просмотра чтеца. */
  if (LAB.desktop) {
    pad.setAttribute("role", "application");
    pad.setAttribute("aria-label", LAB.TITLE);
    /* Картинка для зрячих (табло, карта, окно меню) чтецу не показывается: игра
       говорит сама, а их обновления на каждом шаге заваливали бы NVDA и JAWS
       событиями — чтец и игра тормозили бы при быстрых действиях. */
    var view = document.getElementById("app");
    if (view) view.setAttribute("aria-hidden", "true");
    try { pad.focus(); } catch (x) { /* */ }
    window.addEventListener("focus", function () { try { pad.focus(); } catch (x) { /* */ } });
  }
  /* «Назад» на Android */
  window.labBack = function () {
    LAB.Speech.userAct();
    if (LAB.mini && LAB.mini.active()) { LAB.mini.gesture({ kind: "back", n: 1 }); return 1; }
    var ui = LAB.ui;
    if (!ui) return 0;
    /* главное меню: «Назад» сворачивает приложение, как в других программах */
    if (ui.screen() === "menu" && ui.top && ui.top() && ui.top().root) return 0;
    if (ui.screen() !== "game" || ui.layer()) { LAB.ui.gesture({ kind: "back", n: 1 }); return 1; }
    if (LAB.game.paused || LAB.game.G.dead) { pausedHint(); return 1; }
    LAB.ui.character();
    return 1;
  };
}

LAB.input = { init: init, stopAll: stopAll, dispatch: dispatch, repeat: repeatLast, gestId: gestId, swallow: function () { swallowN = 1; } };
})();
