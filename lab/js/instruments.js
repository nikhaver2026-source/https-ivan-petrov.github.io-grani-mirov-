/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — музыкальные инструменты (1.6, 2.0).
   У каждого инструмента свой голос — с 2.0 это записи настоящих
   инструментов (пианино, гитара, баян, трубчатые колокола, музыкальная
   шкатулка колыбели; lab/sounds/inst, CC0) — и поле для игры: три ряда нот
   (нижний, средний, верхний — три октавы), в каждом от «до» до «си».
   С клавиатуры: стрелки влево и вправо — ноты, вверх и вниз — ряды, пробел
   — сыграть ноту, Enter — подольше, цифры 1–7 — нота сразу, Escape —
   отойти от инструмента.
   (2.0) На телефоне инструмент — весь экран и устроен как настоящий:
   экран поворачивается горизонтально, телефон держат боком и играют
   пальцами, несколькими сразу. Пианино — белые и чёрные клавиши, гитара —
   гриф с ладами и струны, баян — басы слева и три ряда кнопок справа,
   колокола — трубы в два ряда, колыбель — гребёнка шкатулки и ручка
   завода (подробно — ниже, «Весь экран»). Кнопка «Назад» инструмент не
   закрывает; касание четырьмя пальцами — отойти: экран снова вертикальный.
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
  piano: { n: "Пианино", hold: 1.6, damp: true },
  guitar: { n: "Гитара", hold: 1.2 },
  accordion: { n: "Баян", hold: 0.9, sustain: true },
  bell: { n: "Колокола", hold: 3.2, ring: true },
  lullaby: { n: "Колыбель", hold: 1.3, ring: true }
};
function ctx() { var AE = LAB.AE; if (!AE || !AE.ensure || !AE.ensure()) return null; return AE.ctx; }
function dest() { var AE = LAB.AE; return AE.puzzle || AE.ui || AE.fx; }

/* ── (2.0) записи настоящих нот ──
   У каждого инструмента — набор записанных нот (ins_<инструмент>_<midi>,
   высота каждой выверена по строю). Нужная нота берётся из ближайшей
   записи со сдвигом высоты; пока записи грузятся или звуки выключены —
   прежний синтез. Колыбель — музыкальная шкатулка: она звучит на две
   октавы выше нот поля, как настоящая. Записи грузятся, когда подходят к
   инструменту, и выгружаются, когда на нём давно не играют. */
var OCT = { lullaby: 24 };
var REVERB = { piano: 0, guitar: 0.1, accordion: 0.1, bell: 0.15, lullaby: 0.12 };
var NOTES = {}, relT = {}, LIVE = [], MAX_ALL = 32;
function notes(inst) {
  if (NOTES[inst] && NOTES[inst].length) return NOTES[inst];
  var out = [], re = new RegExp("^ins_" + inst + "_(\\d+)$");
  for (var id in (LAB.SND || {})) { var m = re.exec(id); if (m) out.push(+m[1]); }
  return (NOTES[inst] = out.sort(function (a, b) { return a - b; }));
}
function ids(inst, list) { return (list || notes(inst)).map(function (n) { return "ins_" + inst + "_" + n; }); }
function nearest(list, m) {
  var best = list[0];
  for (var i = 1; i < list.length; i++) if (Math.abs(list[i] - m) < Math.abs(best - m)) best = list[i];
  return best;
}
function midiOf(inst, f) { return 69 + 12 * Math.log(f / 440) / Math.LN2 + (OCT[inst] || 0); }
/* выгрузить записи инструмента, когда на нём давно не играют */
function keep(inst) {
  clearTimeout(relT[inst]);
  relT[inst] = setTimeout(function () {
    var B = LAB.Bank;
    if ((surf && surf.inst === inst) || (LAB.mini && LAB.mini.active && LAB.mini.active())) { keep(inst); return; }
    if (B && B.release) B.release(ids(inst));
  }, LAB.settings && LAB.settings.lite ? 30000 : 90000);
}
/* Подготовить записи инструмента (у инструмента, перед игрой); done — когда готовы. */
function preload(inst, done) {
  var B = LAB.Bank;
  if (!B || !B.preload || !notes(inst).length) { if (done) done(); return; }
  keep(inst);
  B.preload(ids(inst), done);
}
function sampled(inst, f, dur, pan, held, gain) {
  var B = LAB.Bank, list = notes(inst);
  if (!B || !B.play || !list.length) return null;
  var m = midiOf(inst, f), n = nearest(list, m), id = "ins_" + inst + "_" + n;
  if (!B.ready(id)) { preload(inst); return null; }
  var o = (LAB.SND[id] && LAB.SND[id].o) || {}, d = INST[inst];
  var h = B.play(id, { rate: Math.pow(2, (m - n) / 12), vary: 0, pan: Math.max(-1, Math.min(1, pan || 0)), bus: "puzzle", reverb: REVERB[inst] || 0, loop: !!o.ls, loopStart: o.ls, loopEnd: o.le, gain: gain == null ? 1 : gain });
  if (!h) return null;
  keep(inst);
  /* баян тянется, пока держат клавишу; у пианино отпущенная клавиша глушится —
     с клавиатуры клавишу «держат» dur секунд, пальцем — пока он на клавише */
  if (d.sustain) setTimeout(function () { h.stop(0.12); }, dur * 1000);
  else if (d.damp && !held) setTimeout(function () { h.stop(0.4); }, dur * 1000);
  return h;
}

/* Голос инструмента: частота, длительность (сколько «держат» клавишу), панорама;
   held — клавишу держат пальцем: отпустит — заглушит сам (инструмент на весь
   экран); gain — сила звука (струну прижали на ладу — тише, чем ударили). */
function voice(inst, f, dur, pan, held, gain) {
  var c = ctx(); if (!c) return null;
  var d0 = INST[inst] ? INST[inst] : INST.piano;
  if (!INST[inst]) inst = "piano";
  var hs = sampled(inst, f, dur || d0.hold, pan, held, gain);
  if (hs) return live(hs);
  return live(synth(c, inst, f * Math.pow(2, (OCT[inst] || 0) / 12), dur, pan, gain));
}
/* не больше MAX_ALL голосов сразу (в облегчённом режиме — двенадцати): самый старый затихает */
function live(h) {
  if (!h) return h;
  LIVE.push(h);
  var max = LAB.settings && LAB.settings.lite ? 12 : MAX_ALL;
  while (LIVE.length > max) LIVE.shift().stop(0.06);
  return h;
}
/* Синтез — пока записей нет. */
function synth(c, inst, f, dur, pan, gain) {
  var t = c.currentTime, out = c.createGain(), d = INST[inst] ? INST[inst] : INST.piano;
  dur = dur || d.hold;
  out.gain.value = gain == null ? 1 : gain;
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
/* Знакомая мелодия: последовательность частот (0 — пауза), шаг — 0.4 с.
   (2.0) Сначала — записи нот мелодии (не дольше 0.8 с), чтобы вся мелодия
   звучала одним голосом. */
function tune(inst, seq, step) {
  var c = ctx(); if (!c) return false;
  step = step || 0.4;
  var started = false, go = function () {
    if (started) return;
    started = true;
    seq.forEach(function (f, i) {
      if (!f) return;
      setTimeout(function () { voice(inst, f, Math.min(0.9, step * 1.6), -0.3 + 0.6 * (i % 3) / 2); }, 120 + i * step * 1000);
    });
  };
  var B = LAB.Bank, list = notes(inst);
  var need = list.length && B && B.ready ? ids(inst, seq.filter(Boolean).map(function (f) { return nearest(list, midiOf(inst, f)); })) : [];
  if (!need.length || need.every(function (id) { return B.ready(id); })) go();
  else { keep(inst); B.preload(need, go); setTimeout(go, 800); }
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
  preload(inst);
  /* (2.0) на инструменте во весь экран «Назад» не уводит — отойти можно только касанием четырьмя пальцами */
  LAB.mini.start({ name: name, handler: handler, quiet: true, cleanup: surfOff, back: surfBack, cb: function () { if (cb) cb(st.played); } });
  /* (2.0) на телефоне — весь экран, телефон боком */
  if (touchy() && !o.field) { surfOn(inst, name, st); return true; }
  say(name + ". Три ряда нот: " + ROW_NAMES.join(", ") + " — в каждом от до до си. Сейчас " + ROW_NAMES[1] + ", до. " +
    LAB.K("Свайп влево и вправо — ноты, вверх и вниз — ряды, касание — сыграть ноту, двойное касание — подольше. Два пальца вниз — отойти.",
      "Стрелки влево и вправо — ноты, вверх и вниз — ряды, цифры от 1 до 7 — нота сразу, пробел — сыграть, Enter — подольше. Escape — отойти."));
  return true;
}
/* ════════ (2.0) ВЕСЬ ЭКРАН — НАСТОЯЩИЙ ИНСТРУМЕНТ ════════
   Телефон держат боком, весь экран — сам инструмент, устроенный как в жизни:
   • пианино — клавиатура: белые клавиши во всю высоту, чёрные — в верхней
     части, между белыми, по две и по три; вдоль верхнего края — крышка:
     слева — октава ниже, справа — выше, посередине — какие октавы сейчас;
   • гитара — гриф и розетка: слева гриф с ладами (прижать струну на ладу),
     справа — место для боя и перебора; наверху самая толстая струна, внизу
     самая тонкая, как у гитары на коленях: провели вниз — удар вниз; у
     левого края — колки: коснуться — лады или аккорды (семь на грифе);
   • баян — слева басы и аккорды (левая рука), справа — три ряда кнопок
     правой руки: вдоль ряда — через малую терцию, по столбцу снизу вверх —
     по полутону; звук тянется, пока держат кнопку;
   • колокола — восемнадцать труб в два ряда, как у оркестровых колоколов:
     внизу — основные, вверху — с диезами; звенят, пока не заглушить:
     вдоль верхнего края — глушитель;
   • колыбель — музыкальная шкатулка: слева гребёнка из пятнадцати язычков
     (слева низкие, справа высокие), справа — ручка завода: крутите пальцем
     по кругу по часовой стрелке — шкатулка играет колыбельную.
   Кнопка «Назад» инструмент не закрывает — повторяет, как он устроен.
   Отойти — только касанием четырьмя пальцами. */
function midiF(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function scrW() { return window.innerWidth || 800; }
function scrH() { return window.innerHeight || 400; }
/* белая клавиша (основная ступень) номер i от ноты base: до, ре, ми, фа, соль, ля, си, до… */
function white(base, i) { return base + 12 * Math.floor(i / 7) + SEMI[i % 7]; }
/* за белой клавишей i есть чёрная — у до, ре, фа, соль и ля */
function hasBlack(i) { var k = i % 7; return k !== 2 && k !== 6; }
var OCT_NAMES = { 1: "контроктава", 2: "большая", 3: "малая", 4: "первая", 5: "вторая", 6: "третья", 7: "четвёртая" };
var OCT_GEN = { 2: "большой", 3: "малой", 4: "первой", 5: "второй", 6: "третьей", 7: "четвёртой" };
function octOf(m) { return Math.floor(m / 12) - 1; }

var GTR_OPEN = [40, 45, 50, 55, 59, 64]; /* ми, ля, ре, соль, си, ми: сверху вниз, от толстой струны к тонкой */
var GTR_FRETS = 9;                       /* ладов на грифе */
/* Аккорды — настоящие аппликатуры: лад на каждой струне от толстой к тонкой, −1 — струна молчит. */
var CHORDS = [
  { n: "до мажор", f: [-1, 3, 2, 0, 1, 0] },
  { n: "ре минор", f: [-1, -1, 0, 2, 3, 1] },
  { n: "ми минор", f: [0, 2, 2, 0, 0, 0] },
  { n: "фа мажор", f: [1, 3, 3, 2, 1, 1] },
  { n: "соль мажор", f: [3, 2, 0, 0, 0, 3] },
  { n: "ля минор", f: [-1, 0, 2, 2, 1, 0] },
  { n: "ми мажор", f: [0, 2, 2, 1, 0, 0] }
];
CHORDS.forEach(function (c) { c.m = c.f.map(function (fr, i) { return fr < 0 ? null : GTR_OPEN[i] + fr; }); });
/* басы баяна по кругу квинт, как на настоящем: фа, до, соль, ре, ля, ми */
var BASS = [5, 0, 7, 2, 9, 4];
/* колыбельная Брамса для шкатулки (звучит на две октавы выше; 0 — оборот без ноты) */
var LULLABY = [64, 64, 67, 0, 64, 64, 67, 0, 64, 67, 72, 71, 69, 69, 67, 0, 62, 64, 65, 62, 62, 64, 65, 0, 62, 65, 71, 69, 67, 71, 72, 0,
  60, 60, 72, 69, 65, 67, 64, 60, 65, 67, 69, 67, 0, 60, 60, 72, 69, 65, 67, 64, 60, 65, 64, 62, 60, 0, 0];
var CRANK_STEP = Math.PI / 4.5; /* поворот ручки на 40° — следующая нота */

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
/* В приложении на время игры — весь экран без строки состояния и панели жестов. */
function fullscreen(on) { try { if (window.LabTTS && window.LabTTS.setFullscreen) window.LabTTS.setFullscreen(on ? "1" : "0"); } catch (e) { /* */ } }
function panX(x) { return clamp(-0.8 + 1.6 * x / scrW(), -1, 1); }
/* Сыграть ноту по номеру MIDI — той высотой, что звучит (у шкатулки — без её сдвига на две октавы). */
function play(s, m, x, o) {
  o = o || {};
  var h = voice(s.inst, midiF(m - (OCT[s.inst] || 0)), o.dur, x == null ? 0 : panX(x), o.held !== false, o.gain);
  if (h) { s.live.push(h); var max = LAB.settings && LAB.settings.lite ? 12 : MAX_VOICES; while (s.live.length > max) s.live.shift().stop(0.05); }
  s.log.push(m); if (s.log.length > 80) s.log.shift();
  s.st.played++;
  if (s.st.noise && LAB.combat && s.st.played % 6 === 1) LAB.combat.noise(s.st.noise);
  return h;
}
function stopH(h, fade) { if (h) { if (h.forEach) h.forEach(function (x) { if (x) x.stop(fade); }); else h.stop(fade); } }

/* ── Пианино ── */
var PIANO = {
  init: function (s) { s.base = 48; },
  geo: function () { var h = scrH(), lid = Math.max(40, Math.round(h * 0.13)); return { lid: lid, ww: scrW() / 15, bh: (h - lid) * 0.6 }; },
  hit: function (s, x, y) {
    var g = PIANO.geo();
    if (y < g.lid) { var w = scrW(), c = x < w / 3 ? -1 : x > w * 2 / 3 ? 1 : 0; return { key: "lid" + c, lid: c }; }
    if (y < g.lid + g.bh) {
      var bi = Math.round(x / g.ww);
      if (bi >= 1 && bi <= 14 && Math.abs(x - bi * g.ww) < g.ww * 0.3 && hasBlack(bi - 1)) { var mb = white(s.base, bi - 1) + 1; return { key: "k" + mb, m: mb, black: true }; }
    }
    var m = white(s.base, clamp(Math.floor(x / g.ww), 0, 14));
    return { key: "k" + m, m: m };
  },
  press: function (s, p, z, slid) {
    if (z.lid != null) {
      if (slid) return;
      if (z.lid === 0) { say(PIANO.range(s) + "."); return; }
      var nb = s.base + 12 * z.lid;
      if (nb < 36 || nb > 72) { LAB.UI.error(); sayq(z.lid < 0 ? "Ниже октав нет." : "Выше октав нет."); return; }
      s.base = nb; LAB.vib(15);
      say(PIANO.range(s) + ".");
      return;
    }
    p.h = play(s, z.m, p.x, { held: true });
    if (z.black) LAB.vib(6); /* чёрная клавиша — лёгкий толчок под пальцем */
  },
  /* клавишу отпустили или палец соскользнул на соседнюю — глушитель ложится на струну */
  leave: function (s, p, z, up) { if (z && z.m != null) stopH(p.h, up ? 0.3 : 0.18); p.h = null; },
  brief: function (s) { return "Белые клавиши — во всю высоту, чёрные — в верхней части, крышка вдоль верхнего края — октавы. " + PIANO.range(s) + "."; },
  range: function (s) { var o = octOf(s.base); return "Октавы: " + OCT_NAMES[o] + " и " + OCT_NAMES[o + 1] + ", крайняя справа клавиша — до " + OCT_GEN[o + 2] + " октавы"; },
  intro: function (s) {
    return "Пианино: весь экран — клавиатура, две октавы и ещё до: слева низкие ноты, справа высокие. Белые клавиши — во всю высоту экрана, чёрные — в верхней части, между белыми: по две и по три, как на настоящем пианино. " +
      "Отпустили клавишу — звук гаснет; ведите пальцем — глиссандо. Вдоль верхнего края — крышка: коснитесь её слева — октава ниже, справа — выше, посередине — какие октавы. " + PIANO.range(s) + ".";
  },
  draw: function (s, c, w, h, held) {
    var g = PIANO.geo(), i, x;
    c.fillStyle = "#2a1a10"; c.fillRect(0, 0, w, g.lid);
    c.fillStyle = "#e9d8a6"; c.font = Math.round(g.lid * 0.36) + "px sans-serif"; c.textBaseline = "middle"; c.textAlign = "center";
    c.fillText("◀ ниже    " + OCT_NAMES[octOf(s.base)] + " и " + OCT_NAMES[octOf(s.base) + 1] + "    выше ▶", w / 2, g.lid / 2);
    for (i = 0; i < 15; i++) {
      x = i * g.ww;
      c.fillStyle = held["k" + white(s.base, i)] ? "#ffd84a" : "#f4f1e8"; c.fillRect(x + 1, g.lid, g.ww - 2, h - g.lid - 2);
      c.fillStyle = "#7d8496"; c.font = Math.round(g.ww * 0.28) + "px sans-serif"; c.fillText(NOTE_NAMES[i % 7], x + g.ww / 2, h - g.ww * 0.35);
    }
    for (i = 0; i < 14; i++) if (hasBlack(i)) {
      x = (i + 1) * g.ww - g.ww * 0.3;
      c.fillStyle = held["k" + (white(s.base, i) + 1)] ? "#c99a00" : "#111318"; c.fillRect(x, g.lid, g.ww * 0.6, g.bh);
    }
  }
};

/* ── Гитара ── */
var GUITAR = {
  init: function (s) { s.mode = "frets"; s.fing = [{}, {}, {}, {}, {}, {}]; s.chordHold = {}; s.ring = []; s.ringFr = []; },
  geo: function () { var w = scrW(), h = scrH(); return { head: Math.max(34, w * 0.07), neck: w * 0.64, sh: h / 6 }; },
  hit: function (s, x, y) {
    var g = GUITAR.geo(), str = clamp(Math.floor(y / g.sh), 0, 5);
    if (x < g.head) return { key: "head", head: true };
    if (x < g.neck) {
      var span = g.neck - g.head;
      if (s.mode === "chords") { var ci = clamp(Math.floor((x - g.head) / (span / CHORDS.length)), 0, CHORDS.length - 1); return { key: "c" + ci, chord: ci }; }
      var fr = 1 + clamp(Math.floor((x - g.head) / (span / GTR_FRETS)), 0, GTR_FRETS - 1);
      return { key: "f" + str + ":" + fr, str: str, fret: fr };
    }
    return { key: "s" + str, str: str, pluck: true };
  },
  /* на каком ладу сейчас струна: в ладах — самый дальний прижатый палец; в аккордах — аккорд под пальцем */
  fretOf: function (s, str) {
    if (s.mode === "chords") { var ci = -1, k; for (k in s.chordHold) ci = s.chordHold[k]; return ci < 0 ? 0 : CHORDS[ci].f[str]; }
    var best = 0; for (var id in s.fing[str]) best = Math.max(best, s.fing[str][id]); return best;
  },
  pluck: function (s, str, x, gain) {
    var fr = GUITAR.fretOf(s, str);
    if (s.ring[str]) { s.ring[str].stop(0.03); s.ring[str] = null; }
    if (fr < 0) { /* струна в аккорде заглушена — глухой щелчок */ var hm = voice("guitar", midiF(GTR_OPEN[str]), 0.1, panX(x), true, 0.18); if (hm) setTimeout(function () { hm.stop(0.03); }, 45); return; }
    s.ring[str] = play(s, GTR_OPEN[str] + fr, x, { held: true, gain: gain });
    s.ringFr[str] = fr;
  },
  press: function (s, p, z, slid) {
    if (z.head) {
      if (slid) return;
      s.mode = s.mode === "frets" ? "chords" : "frets"; s.chordHold = {}; LAB.vib(15);
      say(s.mode === "chords" ? "Аккорды: на грифе слева направо " + CHORDS.map(function (c) { return c.n; }).join(", ") + ". Держите аккорд на грифе и бейте по струнам справа." : "Лады: прижмите струну на ладу — на грифе девять ладов, слева первый.");
      return;
    }
    if (z.chord != null) { s.chordHold[p.id] = z.chord; if (!slid) sayq(CHORDS[z.chord].n); return; }
    if (z.fret) {
      /* прижали струну на ладу — нота звучит сама, тише удара (как легато) */
      s.fing[z.str][p.id] = z.fret;
      if (GUITAR.fretOf(s, z.str) === z.fret) GUITAR.pluck(s, z.str, p.x, 0.5);
      return;
    }
    GUITAR.pluck(s, z.str, p.x, 1);
    if (slid) LAB.vib(4); /* перебор: каждая струна — лёгкий толчок */
  },
  leave: function (s, p, z) {
    if (!z) return;
    if (z.chord != null) { delete s.chordHold[p.id]; return; }
    if (z.fret) {
      delete s.fing[z.str][p.id];
      /* палец сняли с лада — звучавшая с него струна глохнет */
      if (s.ring[z.str] && s.ringFr[z.str] === z.fret && GUITAR.fretOf(s, z.str) !== z.fret) { s.ring[z.str].stop(0.08); s.ring[z.str] = null; }
    }
  },
  brief: function () { return "Слева гриф с ладами, справа бой по струнам, наверху толстая струна; колки у левого края — аккорды."; },
  intro: function () {
    return "Гитара: слева — гриф с ладами, справа — место, где бьют по струнам. Шесть струн лежат вдоль экрана: наверху самая толстая, низкая, внизу самая тонкая. Проведите пальцем справа сверху вниз — удар по всем струнам, касайтесь струн по одной — перебор. " +
      "На грифе прижмите струну на ладу — она зазвучит выше, держите лад и бейте справа. У самого левого края — колки: коснитесь их — вместо ладов на грифе семь аккордов. Сейчас — лады.";
  },
  draw: function (s, c, w, h, held) {
    var g = GUITAR.geo(), i;
    c.fillStyle = "#3b2414"; c.fillRect(0, 0, g.neck, h);
    c.fillStyle = "#1f130b"; c.fillRect(0, 0, g.head, h);
    c.fillStyle = "#6b4423"; c.fillRect(g.neck, 0, w - g.neck, h);
    c.fillStyle = "#120b06"; c.beginPath(); c.arc(g.neck + (w - g.neck) / 2, h / 2, Math.min(w - g.neck, h) * 0.32, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#c8c8c8"; c.lineWidth = 2;
    var cols = s.mode === "chords" ? CHORDS.length : GTR_FRETS, span = (g.neck - g.head) / cols;
    for (i = 0; i <= cols; i++) { c.beginPath(); c.moveTo(g.head + i * span, 0); c.lineTo(g.head + i * span, h); c.stroke(); }
    c.fillStyle = "#e9d8a6"; c.font = Math.round(Math.min(span * 0.22, 18)) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "top";
    if (s.mode === "chords") CHORDS.forEach(function (ch, k) { c.fillStyle = held["c" + k] ? "#ffd84a" : "#e9d8a6"; c.fillText(ch.n, g.head + (k + 0.5) * span, 6); });
    for (i = 0; i < 6; i++) {
      var y = (i + 0.5) * g.sh;
      c.strokeStyle = s.ring[i] ? "#ffd84a" : "#d9d2c0"; c.lineWidth = 6 - i * 0.8;
      c.beginPath(); c.moveTo(g.head, y); c.lineTo(w, y); c.stroke();
      if (s.mode === "frets") { var fr = GUITAR.fretOf(s, i); if (fr > 0) { c.fillStyle = "#ffd84a"; c.beginPath(); c.arc(g.head + (fr - 0.5) * span, y, Math.min(span, g.sh) * 0.22, 0, Math.PI * 2); c.fill(); } }
    }
  }
};

/* ── Баян ── */
var BAYAN = {
  geo: function () { return { split: scrW() * 0.36 }; },
  hit: function (s, x, y) {
    var g = BAYAN.geo(), w = scrW(), h = scrH(), row = clamp(2 - Math.floor(y / (h / 3)), 0, 2);
    if (x < g.split) { var col = clamp(Math.floor(x / (g.split / 6)), 0, 5); return { key: "b" + row + ":" + col, bass: row, col: col }; }
    var j = clamp(Math.floor((x - g.split) / ((w - g.split) / 12)), 0, 11), m = 48 + 3 * j + row;
    return { key: "r" + m, m: m };
  },
  press: function (s, p, z, slid) {
    if (z.m != null) { p.h = play(s, z.m, p.x, { dur: 60, held: true }); return; }
    var pc = BASS[z.col];
    if (z.bass === 0) {
      /* бас — низкая нота и октавой выше, как голоса настоящего баса */
      p.h = [play(s, 36 + pc, p.x, { dur: 60, held: true, gain: 0.9 }), voice("accordion", midiF(48 + pc), 60, panX(p.x), true, 0.4)];
    } else {
      /* готовый аккорд: мажорный — средний ряд, минорный — верхний */
      var root = 53 + ((pc - 5 + 12) % 12), third = z.bass === 1 ? 4 : 3;
      p.h = [play(s, root, p.x, { dur: 60, held: true, gain: 0.42 }), voice("accordion", midiF(root + third), 60, panX(p.x), true, 0.4), voice("accordion", midiF(root + 7), 60, panX(p.x), true, 0.4)];
    }
    if (!slid) LAB.vib(5);
  },
  leave: function (s, p) { stopH(p.h, 0.12); p.h = null; },
  brief: function () { return "Слева басы и аккорды, справа три ряда кнопок: по столбцу снизу вверх — полутоны."; },
  intro: function () {
    return "Баян: слева — левая клавиатура, басы и аккорды, справа — правая, три ряда кнопок. Звук тянется, пока держите кнопку, как будто меха раздвигаются. " +
      "Справа вдоль ряда слева направо ноты идут через полторы ступени, а по столбцу снизу вверх — по полутону: ведите пальцем зигзагом снизу вверх по столбцам — звучит гамма. " +
      "Слева шесть столбцов по кругу квинт — фа, до, соль, ре, ля, ми; внизу — бас, посередине — мажорный аккорд, вверху — минорный.";
  },
  draw: function (s, c, w, h, held) {
    var g = BAYAN.geo(), r, j, rr = Math.min(h / 3, (w - g.split) / 12) * 0.38;
    c.fillStyle = "#1a1a24"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#2b1d12"; c.fillRect(g.split - 4, 0, 8, h);
    for (r = 0; r < 3; r++) for (j = 0; j < 6; j++) {
      c.fillStyle = held["b" + r + ":" + j] ? "#ffd84a" : (r === 0 ? "#cfcfd8" : "#8d93a6");
      c.beginPath(); c.arc((j + 0.5) * g.split / 6, h - (r + 0.5) * h / 3, Math.min(rr * 1.3, g.split / 14), 0, Math.PI * 2); c.fill();
    }
    for (r = 0; r < 3; r++) for (j = 0; j < 12; j++) {
      var m = 48 + 3 * j + r, sharp = [1, 3, 6, 8, 10].indexOf(m % 12) >= 0;
      c.fillStyle = held["r" + m] ? "#ffd84a" : (sharp ? "#2c2f3a" : "#e8e6df");
      c.beginPath(); c.arc(g.split + (j + 0.5) * (w - g.split) / 12, h - (r + 0.5) * h / 3, rr, 0, Math.PI * 2); c.fill();
    }
  }
};

/* ── Колокола ── */
var CHIMES = {
  init: function (s) { s.ringT = {}; },
  geo: function () { var h = scrH(), damp = Math.max(36, Math.round(h * 0.12)); return { damp: damp, ww: scrW() / 11, back: damp + (h - damp) * 0.45 }; },
  hit: function (s, x, y) {
    var g = CHIMES.geo();
    if (y < g.damp) return { key: "damp", damp: true };
    if (y < g.back) {
      var bi = Math.round(x / g.ww);
      if (bi >= 1 && bi <= 10 && Math.abs(x - bi * g.ww) < g.ww * 0.42 && hasBlack(bi - 1)) { var mb = white(60, bi - 1) + 1; return { key: "t" + mb, m: mb, sharp: true }; }
      return { key: "gap" }; /* в заднем ряду между трубами — пусто */
    }
    var m = white(60, clamp(Math.floor(x / g.ww), 0, 10));
    return { key: "t" + m, m: m };
  },
  press: function (s, p, z, slid) {
    if (z.damp) {
      if (slid) return;
      var any = false; for (var k in s.ringT) { if (s.ringT[k]) { s.ringT[k].stop(0.5); any = true; } }
      s.ringT = {};
      if (any) LAB.vib(20);
      return;
    }
    if (z.m == null) return;
    if (s.ringT[z.m]) s.ringT[z.m].stop(0.06);
    s.ringT[z.m] = play(s, z.m, p.x, { held: true });
  },
  leave: function () { /* труба звенит сама, пока не заглушить */ },
  brief: function () { return "Внизу основные трубы, вверху с диезами, вдоль верхнего края — глушитель."; },
  intro: function () {
    return "Колокола: восемнадцать труб в два ряда, как у оркестровых колоколов. Внизу — основные ноты, от до первой октавы до фа второй, слева низкие; вверху, между ними, — трубы с диезами, по две и по три. " +
      "Ударьте по трубе — она звенит долго; проведите пальцем по нижнему ряду — перезвон. Вдоль верхнего края — глушитель: коснитесь — все трубы смолкнут.";
  },
  draw: function (s, c, w, h, held) {
    var g = CHIMES.geo(), i, x, len;
    c.fillStyle = "#14161e"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#3a2c1c"; c.fillRect(0, 0, w, g.damp);
    c.fillStyle = "#e9d8a6"; c.font = Math.round(g.damp * 0.4) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("глушитель", w / 2, g.damp / 2);
    for (i = 0; i < 11; i++) {
      x = i * g.ww; len = (h - g.back) * (1 - i * 0.035);
      c.fillStyle = s.ringT[white(60, i)] ? "#ffd84a" : "#c0a060"; c.fillRect(x + g.ww * 0.25, g.back + 4, g.ww * 0.5, len - 8);
    }
    for (i = 0; i < 10; i++) if (hasBlack(i)) {
      x = (i + 1) * g.ww; len = (g.back - g.damp) * (1 - i * 0.03);
      c.fillStyle = s.ringT[white(60, i) + 1] ? "#ffd84a" : "#8a6a38"; c.fillRect(x - g.ww * 0.2, g.damp + 4, g.ww * 0.4, len - 8);
    }
  }
};

/* ── Колыбель: музыкальная шкатулка ── */
var BOX = {
  init: function (s) { s.acc = 0; s.pos = 0; s.turn = 0; },
  geo: function () { var w = scrW(), h = scrH(); return { comb: w * 0.72, cx: w * 0.86, cy: h * 0.5, R: Math.min(w * 0.12, h * 0.4) }; },
  hit: function (s, x, y, p) {
    var g = BOX.geo();
    if ((p && p.crank) || x >= g.comb) return { key: "crank", crank: true };
    var i = clamp(Math.floor(x / (g.comb / 15)), 0, 14), m = white(84, i);
    return { key: "tooth" + i, m: m };
  },
  angle: function (p) { var g = BOX.geo(); return Math.atan2(p.y - g.cy, p.x - g.cx); },
  press: function (s, p, z) {
    if (z.crank) { p.crank = true; p.ang = BOX.angle(p); return; }
    play(s, z.m, p.x, { held: true });
  },
  /* ручку крутят по часовой стрелке: каждые 40° — следующая нота колыбельной; назад — только трещотка */
  drag: function (s, p) {
    if (!p.crank) return;
    var a = BOX.angle(p), d = a - p.ang;
    if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
    p.ang = a;
    if (d <= 0) { if (d < -0.3) { LAB.UI.blip(1800, 0.01, 0.03); s.acc = 0; } return; }
    s.acc += d; s.turn += d;
    while (s.acc >= CRANK_STEP) {
      s.acc -= CRANK_STEP;
      var m = LULLABY[s.pos % LULLABY.length]; s.pos++;
      LAB.UI.blip(2600, 0.008, 0.02); /* щелчок механизма */
      if (m) play(s, m + 24, BOX.geo().comb * (0.15 + 0.7 * (m - 60) / 12), { held: true });
    }
  },
  leave: function () { /* язычок звенит сам */ },
  brief: function () { return "Слева гребёнка из пятнадцати язычков, справа ручка завода: крутите по часовой стрелке."; },
  intro: function () {
    return "Колыбель — музыкальная шкатулка. Слева — гребёнка из пятнадцати язычков: слева низкие, справа высокие; коснитесь язычка или проведите по гребёнке пальцем. " +
      "Справа — ручка завода: крутите пальцем по кругу по часовой стрелке — шкатулка играет свою колыбельную; быстрее крутите — быстрее мелодия.";
  },
  draw: function (s, c, w, h) {
    var g = BOX.geo(), i, tw = g.comb / 15;
    c.fillStyle = "#2a1f18"; c.fillRect(0, 0, w, h);
    for (i = 0; i < 15; i++) { var len = h * (0.85 - i * 0.035); c.fillStyle = "#cfd3da"; c.fillRect(i * tw + tw * 0.2, h * 0.08, tw * 0.6, len); }
    c.strokeStyle = "#8d6b3d"; c.lineWidth = 8; c.beginPath(); c.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); c.stroke();
    var a = s.turn || 0; c.fillStyle = "#ffd84a"; c.beginPath(); c.arc(g.cx + Math.cos(a) * g.R, g.cy + Math.sin(a) * g.R, Math.max(10, g.R * 0.18), 0, Math.PI * 2); c.fill();
  }
};
var LAYOUT = { piano: PIANO, guitar: GUITAR, accordion: BAYAN, bell: CHIMES, lullaby: BOX };

/* ── картинка инструмента для зрячих (касания она не принимает — их берёт поле игры) ── */
var view = null, drawReq = false;
function viewOn() {
  if (view || typeof document === "undefined") return;
  try {
    view = document.createElement("canvas");
    view.id = "instView";
    view.setAttribute("aria-hidden", "true");
    view.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9;pointer-events:none;background:#05060a";
    document.body.appendChild(view);
  } catch (e) { view = null; }
}
function viewOff() { if (view && view.parentNode) view.parentNode.removeChild(view); view = null; }
function draw() {
  if (!view || drawReq) return;
  drawReq = true;
  var go = function () {
    drawReq = false;
    var s = surf; if (!s || !view) return;
    LAB.safe(function () {
      var w = scrW(), h = scrH();
      if (view.width !== w) view.width = w;
      if (view.height !== h) view.height = h;
      var c = view.getContext("2d"), held = {};
      for (var k in s.ptrs) if (s.ptrs[k].z) held[s.ptrs[k].z.key] = 1;
      s.L.draw(s, c, w, h, held);
    });
  };
  if (window.requestAnimationFrame) window.requestAnimationFrame(go); else setTimeout(go, 16);
}

function surfOn(inst, name, st) {
  var L = LAYOUT[inst] || PIANO;
  surf = { inst: inst, name: name, L: L, ptrs: {}, live: [], log: [], quad: null, st: st, helpAt: 0 };
  if (L.init) L.init(surf);
  orient("landscape");
  fullscreen(true);
  viewOn(); draw();
  /* полное описание — в первый раз; дальше коротко (полное — по кнопке «Назад») */
  var G = LAB.game && LAB.game.G, tut = G && G.tut, seen = !!(tut && tut["inst_" + inst]);
  if (tut) tut["inst_" + inst] = 1;
  say(name + ". " + (canTurn() ? "Экран поворачивается горизонтально: держите телефон боком. " : "") + (seen ? L.brief(surf) + " Кнопка «Назад» — подробно, как он устроен." : L.intro(surf)) + " Отойти от инструмента — коснуться экрана четырьмя пальцами сразу.");
}
function surfOff() {
  var s = surf;
  if (!s) return;
  surf = null;
  for (var k in s.ptrs) LAB.safe(function () { s.L.leave(s, s.ptrs[k], s.ptrs[k].z, true); });
  viewOff();
  fullscreen(false);
  orient("portrait");
}
function closeSurf() { if (LAB.mini && LAB.mini.active()) LAB.mini.cancel(); else surfOff(); }
/* «Назад» на инструменте не уводит: напоминает, как он устроен и как отойти */
function surfBack() {
  var s = surf;
  if (!s) return false;
  LAB.vib(20);
  var now = Date.now();
  if (now - s.helpAt < 2500) return true;
  s.helpAt = now;
  say(s.L.intro(s) + " Отойти — коснуться экрана четырьмя пальцами сразу; кнопка «Назад» на инструменте не уводит.");
  return true;
}
/* все звучащие ноты инструмента — затихнуть */
function hush(s, fade) {
  s.live.forEach(function (h) { h.stop(fade); });
  s.live = [];
  if (s.ring) s.ring = [];
  if (s.ringT) s.ringT = {};
  for (var k in s.ptrs) s.ptrs[k].h = null;
}
/* Касание четырьмя пальцами — отойти от инструмента. Засчитывается только
   касание: четыре пальца (или вся ладонь) легли почти разом — за 0,4 с — на
   пустой экран, не скользили и все поднялись за 0,8 с. Аккорд, который
   держат, скольжение и перебор несколькими пальцами инструмент не
   закрывают; удар двумя пальцами по струнам — тоже. Ноты, прозвучавшие от
   самого касания, тут же гаснут. */
var QUAD_LAND = 400, QUAD_TAP = 800;
function quadSlide() { var w = scrW(), h = scrH(); return Math.max(24, 0.05 * Math.sqrt(w * w + h * h)); }
function quad(s, kind, id, p) {
  var now = performance.now(), q = s.quad;
  if (kind === "down") {
    if (Object.keys(s.ptrs).length === 1) { s.quad = { t0: now, ids: [id], up: 0, ok: true }; return false; }
    if (!q || !q.ok) return false;
    if (q.up || now - q.t0 > QUAD_LAND) { q.ok = false; return false; }
    q.ids.push(id);
    return false;
  }
  if (!q || !q.ok || q.ids.indexOf(id) < 0) return false;
  if (kind === "move") { if (p.moved > quadSlide()) q.ok = false; return false; }
  q.up++;
  if (q.ids.length < 4 || now - q.t0 > QUAD_TAP) { q.ok = false; return false; }
  if (q.up < q.ids.length) return false;
  s.quad = null;
  return true;
}
/* Касания экрана — сюда, мимо жестов (input.js). */
function surfPointer(e) {
  var s = surf;
  if (!s) return;
  var id = String(e.pointerId), p = s.ptrs[id], x = e.clientX, y = e.clientY, z;
  if (e.type === "pointerdown") {
    if (LAB.Speech && LAB.Speech.userAct) LAB.Speech.userAct();
    p = s.ptrs[id] = { id: id, x0: x, y0: y, x: x, y: y, moved: 0, z: null, h: null };
    quad(s, "down", id, p);
    z = s.L.hit(s, x, y, p);
    p.z = z;
    if (z) s.L.press(s, p, z, false);
    draw();
    return;
  }
  if (!p) return;
  if (e.type === "pointermove") {
    p.x = x; p.y = y;
    p.moved = Math.max(p.moved, Math.abs(x - p.x0) + Math.abs(y - p.y0));
    quad(s, "move", id, p);
    if (s.L.drag) s.L.drag(s, p);
    z = s.L.hit(s, x, y, p);
    if ((z && z.key) === (p.z && p.z.key)) { if (s.L.drag) draw(); return; }
    if (p.z) s.L.leave(s, p, p.z, false);
    p.z = z;
    if (z) s.L.press(s, p, z, true);
    draw();
    return;
  }
  /* палец поднят — или касание отняла система */
  if (p.z) s.L.leave(s, p, p.z, true);
  delete s.ptrs[id];
  /* касание четырьмя пальцами — отошли от инструмента */
  if (quad(s, "up", id, p)) { hush(s, 0.08); LAB.vib(30); closeSurf(); return; }
  draw();
}
LAB.surface = {
  active: function () { return !!surf; },
  pointer: function (e) { LAB.safe(function () { surfPointer(e); }); },
  back: surfBack,
  /* для проверок */
  _state: function () {
    var s = surf;
    return { on: !!s, inst: s && s.inst, mode: s && s.mode, base: s && s.base, frets: s && s.fing ? [0, 1, 2, 3, 4, 5].map(function (i) { return GUITAR.fretOf(s, i); }) : null,
      log: s ? s.log.slice() : [], orient: lastOrient, view: !!view, pos: s && s.pos };
  }
};

LAB.instruments = { INST: INST, voice: voice, tune: tune, open: open, preload: preload, freq: freq, NOTE_NAMES: NOTE_NAMES, ROW_NAMES: ROW_NAMES, CHORDS: CHORDS, GTR_OPEN: GTR_OPEN, midiF: midiF,
  /* для проверок: какая запись и с каким сдвигом сыграет ноту */
  _pick: function (inst, f) { var l = notes(inst); if (!l.length) return null; var m = midiOf(inst, f), n = nearest(l, m); return { id: "ins_" + inst + "_" + n, rate: Math.pow(2, (m - n) / 12) }; } };
})();
