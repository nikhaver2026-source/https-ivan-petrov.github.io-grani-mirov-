/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — музыкальные инструменты (1.6, 2.0).
   У каждого инструмента свой тембр (синтез: пианино, гитара, баян,
   колокола, музыкальная шкатулка колыбели) и поле для игры: три ряда нот
   (нижний, средний, верхний — три октавы), в каждом от «до» до «си».
   С клавиатуры: стрелки влево и вправо — ноты, вверх и вниз — ряды, пробел
   — сыграть ноту, Enter — подольше, цифры 1–7 — нота сразу, Escape —
   отойти от инструмента.
   (2.0) На телефоне инструмент — весь экран: экран поворачивается
   горизонтально, телефон держат боком и играют пальцами. Ведёте пальцем —
   звучит каждая клавиша или струна под ним, можно несколькими пальцами
   сразу. Пианино, баян, колокола и колыбель — три ряда клавиш: внизу
   низкие, вверху высокие, в ряду слева направо от «до» до «си». Гитара —
   шесть струн-рядов, внизу самая низкая; слева направо — аккорды, а после
   касания двумя пальцами — лады. Два пальца вниз — отойти: экран снова
   вертикальный.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
var NOTE_NAMES = ["до", "ре", "ми", "фа", "соль", "ля", "си"];
var SEMI = [0, 2, 4, 5, 7, 9, 11];
var ROW_NAMES = ["нижний ряд", "средний ряд", "верхний ряд"];
var ROW_BASE = [130.81, 261.63, 523.25]; /* до малой, первой и второй октавы */
function freq(row, i) { return ROW_BASE[row] * Math.pow(2, SEMI[i] / 12); }
var INST = {
  piano: { n: "Пианино", hold: 1.6 },
  guitar: { n: "Гитара", hold: 1.2 },
  accordion: { n: "Баян", hold: 0.9, sustain: true },
  bell: { n: "Колокола", hold: 3.2, ring: true },
  lullaby: { n: "Колыбель", hold: 1.3, ring: true }
};
function ctx() { var AE = LAB.AE; if (!AE || !AE.ensure || !AE.ensure()) return null; return AE.ctx; }
function dest() { var AE = LAB.AE; return AE.puzzle || AE.ui || AE.fx; }

/* Голос инструмента: частота, длительность (для баяна — пока «держат»), панорама. */
function voice(inst, f, dur, pan) {
  var c = ctx(); if (!c) return null;
  var t = c.currentTime, out = c.createGain(), d = INST[inst] ? INST[inst] : INST.piano;
  dur = dur || d.hold;
  out.gain.value = 1;
  var ends = [], nodes = [out], oscs = [];
  var osc = function (type, fr, g0, attack, decay, extra) {
    var o = c.createOscillator(), g = c.createGain();
    oscs.push(o);
    o.type = type; o.frequency.value = fr;
    if (extra && extra.detune) o.detune.value = extra.detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(g0, t + attack);
    if (extra && extra.sustain) { g.gain.setValueAtTime(g0, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    o.connect(g); g.connect(out);
    var stop = t + (extra && extra.sustain ? dur + 0.3 : attack + decay) + 0.05;
    o.start(t); o.stop(stop); ends.push(stop); nodes.push(g);
    return o;
  };
  var lp = null;
  if (inst === "piano") {
    lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
    osc("triangle", f, 0.42, 0.004, dur);
    osc("sine", f * 2, 0.14, 0.003, dur * 0.6);
    osc("sine", f * 3, 0.06, 0.003, dur * 0.4);
    osc("sine", f * 4.01, 0.03, 0.003, dur * 0.25);
    osc("square", f * 2, 0.03, 0.001, 0.03); /* удар молоточка */
  } else if (inst === "guitar") {
    lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.7); lp.Q.value = 0.9;
    osc("sawtooth", f, 0.3, 0.003, dur);
    osc("sawtooth", f, 0.16, 0.003, dur * 0.8, { detune: 6 });
    osc("sine", f * 2, 0.05, 0.002, 0.25);
  } else if (inst === "accordion") {
    lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700;
    var o1 = osc("sawtooth", f, 0.12, 0.07, 0, { sustain: true });
    var o2 = osc("sawtooth", f, 0.1, 0.09, 0, { sustain: true, detune: 8 });
    osc("square", f / 2, 0.035, 0.1, 0, { sustain: true });
    /* вибрато мехов */
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 2.5;
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(t + dur + 0.4); nodes.push(lg); oscs.push(lfo);
  } else if (inst === "bell") {
    [[1, 0.34, 1], [2.0, 0.2, 0.8], [2.76, 0.22, 0.7], [5.4, 0.09, 0.45], [8.93, 0.04, 0.3]].forEach(function (p) { osc("sine", f * p[0], p[1], 0.002, dur * p[2]); });
  } else { /* музыкальная шкатулка колыбели */
    osc("sine", f, 0.3, 0.002, dur);
    osc("sine", f * 2, 0.1, 0.002, dur * 0.7);
    osc("sine", f * 3, 0.04, 0.002, dur * 0.5);
    osc("triangle", f * 4, 0.025, 0.001, 0.12);
  }
  /* цепочка: голос → фильтр → панорама → отпускание → шина */
  var chain = out;
  if (lp) { chain.connect(lp); chain = lp; nodes.push(lp); }
  if (c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, pan || 0)); chain.connect(pn); chain = pn; nodes.push(pn); }
  var rel = c.createGain(); rel.gain.value = 1; chain.connect(rel); nodes.push(rel);
  rel.connect(dest());
  var end = Math.max.apply(null, ends) || (t + dur + 0.5);
  setTimeout(function () { nodes.forEach(function (n) { try { n.disconnect(); } catch (e) { /* */ } }); }, Math.max(100, (end - c.currentTime) * 1000 + 150));
  /* (2.0) отпустить раньше: клавишу отпустили, струну прижали на другом ладу */
  return { stop: function (fade) {
    var now = c.currentTime;
    fade = Math.max(0.02, fade || 0.2);
    try { rel.gain.cancelScheduledValues(now); rel.gain.setValueAtTime(rel.gain.value, now); rel.gain.linearRampToValueAtTime(0, now + fade); } catch (e) { /* */ }
    oscs.forEach(function (o) { try { o.stop(now + fade + 0.03); } catch (e) { /* уже отзвучала */ } });
  } };
}
/* Знакомая мелодия: последовательность частот (0 — пауза), шаг — 0.4 с. */
function tune(inst, seq, step) {
  var c = ctx(); if (!c) return false;
  step = step || 0.4;
  seq.forEach(function (f, i) {
    if (!f) return;
    setTimeout(function () { voice(inst, f, Math.min(0.9, step * 1.6), -0.3 + 0.6 * (i % 3) / 2); }, 120 + i * step * 1000);
  });
  return true;
}

/* ── поле инструмента: три ряда нот ── */
function playAt(st, inst, longer) {
  var f = freq(st.row, st.i);
  voice(inst, f, longer ? (INST[inst] ? INST[inst].hold * 1.6 : 2.2) : null, -0.6 + st.i * 0.2);
  st.played++;
  if (st.noise && LAB.combat && st.played % 6 === 1) LAB.combat.noise(st.noise);
}
function open(inst, o, cb) {
  o = o || {};
  if (!INST[inst]) inst = "piano";
  if (!LAB.mini || !LAB.mini.start) { say("Инструмент молчит."); if (cb) cb(0); return false; }
  var st = { row: 1, i: 0, played: 0, noise: o.noise || 0 }, name = o.name || INST[inst].n;
  var handler = function (g) {
    if (g.kind === "swipe" && g.n === 1) {
      if (g.dir === "L" || g.dir === "R") {
        var ni = st.i + (g.dir === "R" ? 1 : -1);
        if (ni < 0 || ni > 6) { LAB.UI.error(); sayq(ni < 0 ? "Край ряда: до." : "Край ряда: си."); return; }
        st.i = ni; playAt(st, inst, false); sayq(NOTE_NAMES[st.i]); return;
      }
      var nr = st.row + (g.dir === "U" ? 1 : -1);
      if (nr < 0 || nr > 2) { LAB.UI.error(); sayq(nr < 0 ? "Ниже ряда нет." : "Выше ряда нет."); return; }
      st.row = nr; playAt(st, inst, false); sayq(ROW_NAMES[nr] + ", " + NOTE_NAMES[st.i] + "."); return;
    }
    if (g.kind === "digit") { if (g.d >= 1 && g.d <= 7) { st.i = g.d - 1; playAt(st, inst, false); sayq(NOTE_NAMES[st.i]); } return; }
    if (g.kind === "tap" && g.n === 1) { playAt(st, inst, false); return; }
    if (g.kind === "dtap" && g.n === 1) { playAt(st, inst, true); return; }
  };
  LAB.mini.start({ name: name, handler: handler, quiet: true, cleanup: surfOff, cb: function () { if (cb) cb(st.played); } });
  /* (2.0) на телефоне — весь экран, телефон боком */
  if (touchy() && !o.field) { surfOn(inst, name, st); return true; }
  say(name + ". Три ряда нот: " + ROW_NAMES.join(", ") + " — в каждом от до до си. Сейчас " + ROW_NAMES[1] + ", до. " +
    LAB.K("Свайп влево и вправо — ноты, вверх и вниз — ряды, касание — сыграть ноту, двойное касание — подольше. Два пальца вниз — отойти.",
      "Стрелки влево и вправо — ноты, вверх и вниз — ряды, цифры от 1 до 7 — нота сразу, пробел — сыграть, Enter — подольше. Escape — отойти."));
  return true;
}
/* ════════ (2.0) ВЕСЬ ЭКРАН — ИНСТРУМЕНТ: телефон боком, игра пальцами ════════
   Ряды лежат вдоль длинной стороны экрана, нижний — у нижнего края.
   Палец перешёл на другую клавишу или струну — она звучит сразу: так
   играют глиссандо и перебор. У пианино отпущенная клавиша затихает, у
   баяна звук тянется, пока палец на кнопке, колокола и шкатулка звенят
   сами; у гитары каждая струна звучит, пока её не тронут снова. */
function midiF(m) { return 440 * Math.pow(2, (m - 69) / 12); }
var GTR_OPEN = [40, 45, 50, 55, 59, 64]; /* ми, ля, ре, соль, си, ми — снизу вверх */
var FRETS = 12;                          /* открытая струна и одиннадцать ладов */
var CHORDS = [
  { n: "до мажор", m: [43, 48, 52, 55, 60, 64] },
  { n: "ре минор", m: [41, 45, 50, 57, 62, 65] },
  { n: "ми минор", m: [40, 47, 52, 55, 59, 64] },
  { n: "фа мажор", m: [41, 48, 53, 57, 60, 65] },
  { n: "соль мажор", m: [43, 47, 50, 55, 59, 67] },
  { n: "ля минор", m: [40, 45, 52, 57, 60, 64] },
  { n: "ми мажор", m: [40, 47, 52, 56, 59, 64] }
];
var MAX_VOICES = 24;
var surf = null, lastOrient = "";
/* играют пальцами: телефон (не компьютер и не последним касались клавиш) */
function touchy() { return !LAB.desktop && !LAB.keysMode; }
function canTurn() { return !!(window.LabTTS && window.LabTTS.setOrientation); }
/* Повернуть экран: в приложении — через мост, в браузере — как позволит. */
function orient(mode) {
  lastOrient = mode;
  try { if (canTurn()) { window.LabTTS.setOrientation(mode); return; } } catch (e) { /* */ }
  try {
    var so = window.screen && window.screen.orientation;
    if (!so) return;
    if (mode === "landscape" && so.lock) { var pr = so.lock("landscape"); if (pr && pr.catch) pr.catch(function () { /* не дали — играем как есть */ }); }
    else if (so.unlock) so.unlock();
  } catch (e) { /* без поворота */ }
}
function grid(s) { return s.kind === "strings" ? { R: 6, C: s.frets ? FRETS : CHORDS.length } : { R: 3, C: 7 }; }
function cellAt(s, x, y) {
  var w = window.innerWidth || 800, h = window.innerHeight || 400, g = grid(s);
  var row = g.R - 1 - Math.max(0, Math.min(g.R - 1, Math.floor(y / h * g.R)));
  return { row: row, col: Math.max(0, Math.min(g.C - 1, Math.floor(x / w * g.C))) };
}
function noteF(s, row, col) {
  if (s.kind === "keys") return freq(row, col);
  return midiF(s.frets ? GTR_OPEN[row] + col : CHORDS[col].m[row]);
}
function strike(s, p) {
  var g = grid(s), f = noteF(s, p.row, p.col), pan = g.C > 1 ? -0.7 + 1.4 * p.col / (g.C - 1) : 0, h;
  if (s.kind === "strings") {
    if (s.str[p.row]) s.str[p.row].stop(0.04); /* струну тронули снова */
    h = s.str[p.row] = voice(s.inst, f, null, pan);
  } else h = p.h = voice(s.inst, f, INST[s.inst].sustain ? 8 : null, pan);
  if (h) { s.live.push(h); if (s.live.length > MAX_VOICES) s.live.shift().stop(0.05); }
  s.log.push(Math.round(f * 100) / 100); if (s.log.length > 60) s.log.shift();
  s.st.played++;
  if (s.st.noise && LAB.combat && s.st.played % 6 === 1) LAB.combat.noise(s.st.noise);
}
function lift(s, p, gone) {
  if (s.kind !== "keys" || !p.h) return;
  var d = INST[s.inst];
  if (!d.ring) p.h.stop(d.sustain ? 0.12 : gone ? 0.6 : 0.35);
  p.h = null;
}
function surfOn(inst, name, st) {
  surf = { inst: inst, kind: inst === "guitar" ? "strings" : "keys", frets: false, ptrs: {}, str: [], live: [], log: [], two: null, st: st };
  orient("landscape");
  var turn = canTurn() ? "Экран поворачивается горизонтально: держите телефон боком. " : "";
  say(name + ". " + turn + (surf.kind === "strings"
    ? "Шесть струн — ряды, внизу самая низкая. Слева направо — аккорды: " + CHORDS.map(function (c) { return c.n; }).join(", ") + ". Проведите пальцем поперёк струн — перебор, вдоль струны — другой аккорд. Касание двумя пальцами — лады вместо аккордов. Два пальца вниз — отойти."
    : "Весь экран — клавиши, три ряда: внизу низкие, вверху высокие, в каждом ряду слева направо от до до си. Касайтесь и ведите пальцем — звучит каждая клавиша под пальцем, можно несколькими пальцами сразу. Два пальца вниз — отойти."));
}
function surfOff() {
  var s = surf;
  if (!s) return;
  surf = null;
  for (var k in s.ptrs) lift(s, s.ptrs[k], true);
  orient("portrait");
}
function closeSurf() { if (LAB.mini && LAB.mini.active()) LAB.mini.cancel(); else surfOff(); }
function toggleFrets(s) {
  s.frets = !s.frets;
  for (var k in s.ptrs) { var q = s.ptrs[k], c = cellAt(s, q.x, q.y); q.row = c.row; q.col = c.col; }
  say(s.frets ? "Лады: на каждой струне слева направо — открытая струна и одиннадцать ладов, по полутону." : "Аккорды: слева направо " + CHORDS.map(function (c) { return c.n; }).join(", ") + ".");
}
/* Два пальца: вниз — отойти от инструмента; короткое касание двумя — у гитары лады или аккорды. */
function pair(s, kind, id, p) {
  var ids = Object.keys(s.ptrs), now = performance.now(), tw = s.two;
  if (kind === "down") {
    s.two = ids.length === 2 ? { t0: now, ids: ids, y0: ids.map(function (k) { return s.ptrs[k].y; }), x0: ids.map(function (k) { return s.ptrs[k].x; }), up: 0, moved: 0 } : null;
    return false;
  }
  if (!tw) return false;
  if (kind === "move") {
    if (ids.length !== 2 || now - tw.t0 > 1000) return false;
    var need = Math.max(50, (window.innerHeight || 400) * 0.3);
    for (var i = 0; i < 2; i++) {
      var q = s.ptrs[tw.ids[i]];
      if (!q) return false;
      var dy = q.y - tw.y0[i];
      if (!(dy > need && Math.abs(q.x - tw.x0[i]) < dy * 0.75)) return false;
    }
    s.two = null;
    closeSurf();
    return true;
  }
  if (tw.ids.indexOf(id) < 0) return false;
  tw.up++; tw.moved = Math.max(tw.moved, p.moved);
  if (tw.up < 2) return false;
  s.two = null;
  if (s.kind === "strings" && now - tw.t0 < 400 && tw.moved < 24) toggleFrets(s);
  return false;
}
/* Касания экрана — сюда, мимо жестов (input.js). */
function surfPointer(e) {
  var s = surf;
  if (!s) return;
  var id = String(e.pointerId), p = s.ptrs[id];
  if (e.type === "pointerdown") {
    if (LAB.Speech && LAB.Speech.userAct) LAB.Speech.userAct();
    var c0 = cellAt(s, e.clientX, e.clientY);
    p = s.ptrs[id] = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, row: c0.row, col: c0.col, moved: 0, h: null };
    strike(s, p);
    pair(s, "down", id, p);
    return;
  }
  if (!p) return;
  if (e.type === "pointermove") {
    p.x = e.clientX; p.y = e.clientY;
    p.moved = Math.max(p.moved, Math.abs(p.x - p.x0) + Math.abs(p.y - p.y0));
    if (pair(s, "move", id, p)) return; /* два пальца вниз — отошли */
    var c = cellAt(s, p.x, p.y);
    if (c.row === p.row && c.col === p.col) return;
    var rowCh = c.row !== p.row;
    lift(s, p, false);
    p.row = c.row; p.col = c.col;
    strike(s, p);
    if (rowCh) LAB.vib(6);
    return;
  }
  /* палец поднят — или касание отняла система */
  lift(s, p, true);
  delete s.ptrs[id];
  pair(s, "up", id, p);
}
LAB.surface = {
  active: function () { return !!surf; },
  pointer: function (e) { LAB.safe(function () { surfPointer(e); }); },
  /* для проверок */
  _state: function () { return { on: !!surf, kind: surf && surf.kind, frets: !!(surf && surf.frets), log: surf ? surf.log.slice() : [], orient: lastOrient }; }
};

LAB.instruments = { INST: INST, voice: voice, tune: tune, open: open, freq: freq, NOTE_NAMES: NOTE_NAMES, ROW_NAMES: ROW_NAMES, CHORDS: CHORDS, GTR_OPEN: GTR_OPEN, midiF: midiF };
})();
