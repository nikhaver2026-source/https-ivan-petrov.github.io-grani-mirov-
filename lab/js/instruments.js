/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — музыкальные инструменты (1.6).
   У каждого инструмента свой тембр (синтез: пианино, гитара, баян,
   колокола, музыкальная шкатулка колыбели) и поле для игры: три ряда нот
   (нижний, средний, верхний — три октавы), в каждом от «до» до «си».
   Свайпы влево и вправо (стрелки) — ноты, вверх и вниз — ряды, касание
   (пробел) — сыграть ноту, двойное касание (Enter) — подольше, цифры 1–7 —
   нота сразу. Два пальца вниз (Escape) — отойти от инструмента.
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
  bell: { n: "Колокола", hold: 3.2 },
  lullaby: { n: "Колыбель", hold: 1.3 }
};
function ctx() { var AE = LAB.AE; if (!AE || !AE.ensure || !AE.ensure()) return null; return AE.ctx; }
function dest() { var AE = LAB.AE; return AE.puzzle || AE.ui || AE.fx; }

/* Голос инструмента: частота, длительность (для баяна — пока «держат»), панорама. */
function voice(inst, f, dur, pan) {
  var c = ctx(); if (!c) return null;
  var t = c.currentTime, out = c.createGain(), d = INST[inst] ? INST[inst] : INST.piano;
  dur = dur || d.hold;
  out.gain.value = 1;
  var ends = [], nodes = [out];
  var osc = function (type, fr, g0, attack, decay, extra) {
    var o = c.createOscillator(), g = c.createGain();
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
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(t + dur + 0.4); nodes.push(lg);
  } else if (inst === "bell") {
    [[1, 0.34, 1], [2.0, 0.2, 0.8], [2.76, 0.22, 0.7], [5.4, 0.09, 0.45], [8.93, 0.04, 0.3]].forEach(function (p) { osc("sine", f * p[0], p[1], 0.002, dur * p[2]); });
  } else { /* музыкальная шкатулка колыбели */
    osc("sine", f, 0.3, 0.002, dur);
    osc("sine", f * 2, 0.1, 0.002, dur * 0.7);
    osc("sine", f * 3, 0.04, 0.002, dur * 0.5);
    osc("triangle", f * 4, 0.025, 0.001, 0.12);
  }
  /* цепочка: голос → фильтр → панорама → шина */
  var chain = out;
  if (lp) { chain.connect(lp); chain = lp; nodes.push(lp); }
  if (c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, pan || 0)); chain.connect(pn); chain = pn; nodes.push(pn); }
  chain.connect(dest());
  var end = Math.max.apply(null, ends) || (t + dur + 0.5);
  setTimeout(function () { nodes.forEach(function (n) { try { n.disconnect(); } catch (e) { /* */ } }); }, Math.max(100, (end - c.currentTime) * 1000 + 150));
  return true;
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
  LAB.mini.start({ name: name, handler: handler, quiet: true, cb: function () { if (cb) cb(st.played); } });
  say(name + ". Три ряда нот: " + ROW_NAMES.join(", ") + " — в каждом от до до си. Сейчас " + ROW_NAMES[1] + ", до. " +
    LAB.K("Свайп влево и вправо — ноты, вверх и вниз — ряды, касание — сыграть ноту, двойное касание — подольше. Два пальца вниз — отойти.",
      "Стрелки влево и вправо — ноты, вверх и вниз — ряды, цифры от 1 до 7 — нота сразу, пробел — сыграть, Enter — подольше. Escape — отойти."));
  return true;
}
LAB.instruments = { INST: INST, voice: voice, tune: tune, open: open, freq: freq, NOTE_NAMES: NOTE_NAMES, ROW_NAMES: ROW_NAMES };
})();
