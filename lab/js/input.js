/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — жесты и клавиши.
   Один палец: свайп — шаг (оружие убрано) или выстрел в ту сторону
   (оружие в руках); свайп с удержанием — идти дальше или стрелять
   очередью; вверх-вниз одним движением — сменить оружие; влево-вправо —
   перезарядить; касание — что рядом; двойное касание — действия у двери,
   терминала, установки.
   Два пальца: вверх — осмотреться, влево — аптечка, вправо — навигатор,
   вниз — сканер; касание — повторить фразу, двойное — тишина.
   Три пальца: касание — вынуть или убрать оружие, вверх — персонаж,
   вниз — инвентарь, влево — задания и журнал, вправо — навигатор целей.
   Четыре пальца: касание — здоровье и заряд, двойное касание — импланты.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
var pad = null;
var pts = {};          /* активные касания */
var gest = null;       /* текущий жест */
var lastTap = null;    /* для двойного касания */
var tapTimer = null;
var walk = null;       /* удержание: идти или стрелять очередью */
var swallowN = 0;     /* первое касание будит звук — его не толкуем */
var SCR2GAME = { U: "N", D: "S", L: "W", R: "E" };

function thr() { var m = Math.min(window.innerWidth || 360, window.innerHeight || 640); return Math.max(24, Math.min(60, m * 0.07)); }

/* ── КАСАНИЯ ── */
function down(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  try { pad.setPointerCapture(e.pointerId); } catch (x) { /* */ }
  e.preventDefault();
  LAB.AE.ensure();
  var now = performance.now();
  if (!gest) {
    gest = { t0: now, max: 0, ids: {}, ended: false, fin: [], held: false, dirAt: 0, firstDir: null, maxDisp: 0 };
    /* сырое касание — мини-игре на ритм */
    if (LAB.mini && LAB.mini.raw && LAB.mini.raw()) dispatch({ kind: "down", n: 1, t: now });
  }
  pts[e.pointerId] = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: now, lastMove: now, ext: { x: e.clientX, y: e.clientY } };
  gest.ids[e.pointerId] = 1;
  var n = Object.keys(pts).length;
  if (n > gest.max) gest.max = n;
}
function moveEv(e) {
  var p = pts[e.pointerId];
  if (!p || !gest) return;
  e.preventDefault();
  var dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) p.lastMove = performance.now();
  p.x = e.clientX; p.y = e.clientY;
  var T = thr();
  if (gest.max === 1) {
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
function armHold(p) {
  var g = gest;
  clearTimeout(g.holdT);
  var check = function () {
    if (gest !== g || g.ended || g.zig || g.max !== 1) return;
    var now = performance.now();
    if (now - p.lastMove >= 260) {
      g.held = true;
      startHold(g.firstDir);
    } else g.holdT = setTimeout(check, 60);
  };
  g.holdT = setTimeout(check, 300);
}
function up(e) {
  var p = pts[e.pointerId];
  if (!p || !gest) return;
  e.preventDefault();
  gest.fin.push({ dx: p.x - p.x0, dy: p.y - p.y0 });
  delete pts[e.pointerId];
  if (Object.keys(pts).length) return; /* ждём остальные пальцы */
  var g = gest; gest = null; g.ended = true;
  clearTimeout(g.holdT);
  if (g.held) { stopHold(); return; }
  finishGesture(g, p);
}
function cancelEv(e) {
  delete pts[e.pointerId];
  if (!Object.keys(pts).length && gest) { clearTimeout(gest.holdT); if (gest.held) stopHold(); gest = null; }
}
function finishGesture(g, last) {
  var T = thr();
  /* смещение — среднее по всем пальцам */
  var dx = 0, dy = 0;
  g.fin.forEach(function (f) { dx += f.dx; dy += f.dy; });
  if (g.fin.length) { dx /= g.fin.length; dy /= g.fin.length; }
  var n = g.max;
  if (n === 1 && g.zig && g.firstDir) {
    var second = { U: "D", D: "U", L: "R", R: "L" }[g.firstDir];
    dispatch({ kind: "zig", n: 1, dir: g.firstDir, dir2: second });
    return;
  }
  var disp = Math.max(Math.abs(dx), Math.abs(dy));
  if (disp >= T * (n > 1 ? 0.8 : 1)) {
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U");
    dispatch({ kind: "swipe", n: n, dir: dir });
    return;
  }
  if (performance.now() - g.t0 > 900 && n === 1) { dispatch({ kind: "press", n: 1 }); return; }
  tap(n);
}
/* Касание: ждём второе — вдруг двойное. */
function tap(n) {
  var now = performance.now();
  var dbl = hasDouble(n);
  if (lastTap && lastTap.n === n && now - lastTap.t < 380) {
    clearTimeout(tapTimer); lastTap = null;
    dispatch({ kind: "dtap", n: n });
    return;
  }
  if (!dbl) { dispatch({ kind: "tap", n: n }); return; }
  lastTap = { n: n, t: now };
  clearTimeout(tapTimer);
  tapTimer = setTimeout(function () { var lt = lastTap; lastTap = null; if (lt) dispatch({ kind: "tap", n: lt.n }); }, 380);
}
function hasDouble(n) {
  if (n === 1 || n === 2 || n === 4) return true;
  return false; /* три пальца: касание — оружие, сразу */
}

/* ── УДЕРЖАНИЕ: идти дальше или стрелять очередью ── */
function startHold(dir) {
  stopHold();
  var target = route();
  if (target !== "game") { dispatch({ kind: "swipe", n: 1, dir: dir }); return; }
  var game = LAB.game, G = game.G, gdir = SCR2GAME[dir];
  if (G.drawn) { LAB.combat.startFire(gdir); walk = { fire: true }; return; }
  walk = { dir: gdir };
  var w = walk;
  var stepFn = function () {
    if (walk !== w) return;
    var ok = game.tryMove(gdir, true);
    if (!ok) { stopHold(); return; }
    w.t = setTimeout(stepFn, G.st.haste > 0 ? 200 : 300);
  };
  stepFn();
}
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
function dispatch(g) {
  LAB.AE.ensure();
  if (swallowN > 0 && g.kind !== "down") { swallowN--; return; }
  var r = route();
  if (g.kind === "down") { if (r === "mini") LAB.mini.gesture(g); return; }
  if (r === "mini") { LAB.mini.gesture(g); return; }
  if (r === "ui") { LAB.ui.gesture(g); return; }
  if (r === "game") { gameGesture(g); return; }
}
function gameGesture(g) {
  var game = LAB.game, G = game.G;
  if (!game.entered || G.dead) return;
  if (g.n === 1) {
    if (g.kind === "swipe") {
      var gd = SCR2GAME[g.dir];
      if (G.drawn) LAB.combat.fire(gd, false);
      else game.tryMove(gd, false);
      return;
    }
    if (g.kind === "zig") {
      if (g.dir === "U" || g.dir === "D") game.switchWeapon(g.dir === "U" ? 1 : -1);
      else game.reload();
      return;
    }
    if (g.kind === "tap") { game.nearbyInfo(); return; }
    if (g.kind === "dtap") { game.interact(); return; }
    if (g.kind === "press") { game.nearbyInfo(); return; }
  }
  if (g.n === 2) {
    if (g.kind === "swipe") {
      if (g.dir === "U") game.lookAround();
      else if (g.dir === "L") game.useMedkit();
      else if (g.dir === "R") game.navigate(true);
      else if (g.dir === "D") { if (G.implants.indexOf("scan") >= 0) LAB.combat.useImplant("scan"); else game.lookAround(); }
      return;
    }
    if (g.kind === "tap") { repeatLast(); return; }
    if (g.kind === "dtap") { LAB.Speech.stop(); return; }
  }
  if (g.n === 3) {
    if (g.kind === "tap" || g.kind === "dtap") { game.toggleDraw(); return; }
    if (g.kind === "swipe") {
      if (g.dir === "U") LAB.ui.character();
      else if (g.dir === "D") LAB.ui.inventory();
      else if (g.dir === "L") LAB.ui.inventory(8);
      else if (g.dir === "R") game.navMenu ? game.navMenu() : game.navigate(true);
      return;
    }
  }
  if (g.n >= 4) {
    if (g.kind === "dtap") { LAB.ui.implants(); return; }
    if (g.kind === "tap") { game.quickStatus(); return; }
  }
}
/* Повторить последнюю фразу. */
function repeatLast() {
  var el = document.getElementById("caption");
  var t = el ? el.textContent : "";
  if (t) LAB.say(t); else LAB.say("Нечего повторять.");
}

/* ── КЛАВИАТУРА (для компьютера и проверок) ── */
var KEYS = { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R" };
function key(e) {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  var k = e.key, g = null;
  if (KEYS[k]) {
    if (e.shiftKey) g = { kind: "swipe", n: 2, dir: KEYS[k] };
    else if (e.altKey) g = { kind: "swipe", n: 3, dir: KEYS[k] };
    else g = { kind: "swipe", n: 1, dir: KEYS[k] };
  }
  else if (k === "Enter") g = { kind: "dtap", n: 1 };
  else if (k === " ") g = { kind: "tap", n: 1 };
  else if (k === "Escape" || k === "Backspace") g = { kind: "back", n: 1 };
  else if (k === "f" || k === "F" || k === "а" || k === "А") g = { kind: "tap", n: 3 };
  else if (k === "r" || k === "R" || k === "к" || k === "К") g = { kind: "zig", n: 1, dir: "L", dir2: "R" };
  else if (k === "q" || k === "Q" || k === "й" || k === "Й") g = { kind: "zig", n: 1, dir: "U", dir2: "D" };
  else if (k === "h" || k === "H" || k === "р" || k === "Р") g = { kind: "swipe", n: 2, dir: "L" };
  else if (k === "i" || k === "I" || k === "ш" || k === "Ш") g = { kind: "swipe", n: 3, dir: "D" };
  else if (k === "c" || k === "C" || k === "с" || k === "С") g = { kind: "swipe", n: 3, dir: "U" };
  else if (k === "l" || k === "L" || k === "д" || k === "Д") g = { kind: "swipe", n: 2, dir: "U" };
  else if (k === "n" || k === "N" || k === "т" || k === "Т") g = { kind: "swipe", n: 2, dir: "R" };
  else if (k === "m" || k === "M" || k === "ь" || k === "Ь") g = { kind: "dtap", n: 4 };
  else if (k === "s" || k === "S" || k === "ы" || k === "Ы") g = { kind: "tap", n: 4 };
  if (!g) return;
  e.preventDefault();
  LAB.AE.ensure();
  /* Ctrl + стрелка — удержание (очередь или ходьба), отпуск — стоп */
  if (e.ctrlKey && g.kind === "swipe" && g.n === 1) { if (!walk) startHold(g.dir); return; }
  dispatch(g);
}
function keyUp(e) { if (KEYS[e.key] && walk) stopHold(); }

function init() {
  pad = document.getElementById("pad");
  if (!pad) return;
  var opt = { passive: false };
  pad.addEventListener("pointerdown", down, opt);
  pad.addEventListener("pointermove", moveEv, opt);
  pad.addEventListener("pointerup", up, opt);
  pad.addEventListener("pointercancel", cancelEv, opt);
  pad.addEventListener("lostpointercapture", function (e) { if (pts[e.pointerId]) up(e); }, opt);
  pad.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", key);
  document.addEventListener("keyup", keyUp);
  /* «Назад» на Android */
  window.labBack = function () {
    if (LAB.mini && LAB.mini.active()) { LAB.mini.gesture({ kind: "back", n: 1 }); return 1; }
    var ui = LAB.ui;
    if (!ui) return 0;
    if (ui.screen() !== "game" || ui.layer()) { LAB.ui.gesture({ kind: "back", n: 1 }); return 1; }
    LAB.ui.character();
    return 1;
  };
}

LAB.input = { init: init, stopAll: stopAll, dispatch: dispatch, swallow: function () { swallowN = 1; } };
})();
