/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — мини-игры на слух.
   Взлом (повторить сигналы свайпами), настройка магнетронного резонатора
   (убрать биения двух тонов), стабилизация позитронной ловушки (касаться
   в такт пульсу), кодовый замок (четыре диска). Пока идёт мини-игра,
   жесты получает она. Отмена — два пальца вниз или «Назад».
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
var cur = null;

/* Короткий тон: частота, длительность, панорама, тембр. */
function tone(f, dur, pan, type, vol, when) {
  var AE = LAB.AE;
  if (!AE.ensure()) return;
  var c = AE.ctx, t = c.currentTime + (when || 0);
  var o = c.createOscillator(), g = c.createGain();
  o.type = type || "sine"; o.frequency.value = f;
  o.connect(g);
  var out = g;
  if (pan && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  out.connect(AE.ui);
  var v = vol == null ? 0.16 : vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.015);
  g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
function finish(ok, val) {
  var c = cur;
  if (!c) return;
  cur = null;
  if (c.cleanup) LAB.safe(c.cleanup);
  if (LAB.ui && LAB.ui.refresh) LAB.ui.refresh();
  LAB.UI[ok ? "ok" : "error"]();
  if (c.cb) setTimeout(function () { c.cb(val !== undefined ? val : ok); }, 30);
}
function cancel(silent) {
  if (!cur) return;
  if (!silent) say(cur.name + ": прервано.");
  finish(false, cur.type === "code" ? null : false);
}

/* ════════ ВЗЛОМ: повторить сигналы ════════ */
var HACK_TONES = { U: { f: 988, pan: 0, w: "вверх" }, D: { f: 262, pan: 0, w: "вниз" }, L: { f: 523, pan: -0.9, w: "влево" }, R: { f: 659, pan: 0.9, w: "вправо" } };
function playSig(d, when) { var h = HACK_TONES[d]; tone(h.f, 0.32, h.pan, "triangle", 0.2, when); }
function hack(len, cb, opts) {
  opts = opts || {};
  len = Math.max(3, Math.min(9, len || 4));
  var seq = [], dirs = ["U", "D", "L", "R"];
  for (var i = 0; i < len; i++) seq.push(dirs[Math.floor(Math.random() * 4)]);
  cur = { type: "hack", name: opts.title || "Взлом", cb: cb, seq: seq, round: Math.min(3, len), pos: 0, replays: 1, busy: true };
  say((opts.title || "Взлом") + ". Сигналов: " + len + ". " + LAB.K("Высокий — свайп вверх, низкий — вниз, слева — влево, справа — вправо. Повторяйте свайпами. Касание — повторить сигналы.", "Высокий — стрелка вверх, низкий — вниз, слева — влево, справа — вправо. Повторяйте стрелками. Пробел — повторить сигналы, Escape — отойти."), { interrupt: true });
  waitSpeech(function () { playRound(); });
}
function playRound() {
  var c = cur; if (!c || c.type !== "hack") return;
  c.busy = true; c.pos = 0;
  var n = c.round;
  for (var i = 0; i < n; i++) playSig(c.seq[i], 0.25 + i * 0.5);
  setTimeout(function () { if (cur === c) { c.busy = false; tone(1500, 0.06, 0, "sine", 0.1); } }, 250 + n * 500);
}
function hackGesture(g) {
  var c = cur;
  if (g.kind === "tap" && g.n === 1) {
    if (c.busy) return;
    if (c.replays > 0) { c.replays--; playRound(); } else say("Повторов больше нет. Вспоминайте.");
    return;
  }
  if (g.kind !== "swipe" || g.n !== 1 || c.busy) return;
  var want = c.seq[c.pos];
  playSig(g.dir, 0);
  if (g.dir !== want) { setTimeout(function () { say("Неверно. Защита сработала."); finish(false); }, 350); return; }
  c.pos++;
  if (c.pos < c.round) return;
  if (c.round >= c.seq.length) { setTimeout(function () { finish(true); }, 300); return; }
  c.round++; c.replays = 1; c.busy = true;
  setTimeout(function () { tone(1320, 0.08, 0, "sine", 0.12); setTimeout(playRound, 400); }, 300);
}

/* ════════ НАСТРОЙКА РЕЗОНАТОРА: убрать биения ════════ */
function tune(cb, opts) {
  opts = opts || {};
  var AE = LAB.AE; AE.ensure();
  var f0 = 220, sign = Math.random() < 0.5 ? -1 : 1;
  var delta = sign * (opts.hard ? 9 + Math.random() * 7 : 5 + Math.random() * 6);
  var c = { type: "tune", name: "Настройка резонатора", cb: cb, f0: f0, delta: delta, step: opts.hard ? 0.5 : 1, tries: 0 };
  cur = c;
  if (AE.ctx) {
    var x = AE.ctx, g = x.createGain(); g.gain.value = 0; g.connect(AE.ui);
    var o1 = x.createOscillator(), o2 = x.createOscillator();
    o1.type = "sine"; o2.type = "sine";
    o1.frequency.value = f0; o2.frequency.value = f0 + delta;
    o1.connect(g); o2.connect(g); o1.start(); o2.start();
    g.gain.linearRampToValueAtTime(0.09, x.currentTime + 0.6);
    c.o2 = o2; c.g = g;
    c.cleanup = function () { try { g.gain.setTargetAtTime(0, x.currentTime, 0.1); o1.stop(x.currentTime + 0.5); o2.stop(x.currentTime + 0.5); } catch (e) { /* */ } };
  }
  say("Настройка резонатора. Слышите, как звук дрожит? Это биения двух тонов. " + LAB.K("Свайп вверх или вниз — подстроить второй тон, влево или вправо — грубо. Когда дрожь исчезнет, коснитесь дважды. Касание — подсказка.", "Стрелки вверх и вниз — подстроить второй тон, влево и вправо — грубо. Когда дрожь исчезнет, нажмите Enter. Пробел — подсказка."), { interrupt: true });
}
function tuneSet() {
  var c = cur;
  if (c.o2) c.o2.frequency.setTargetAtTime(c.f0 + c.delta, LAB.AE.ctx.currentTime, 0.05);
}
function tuneGesture(g) {
  var c = cur;
  if (g.kind === "swipe" && g.n === 1) {
    var st = g.dir === "U" ? c.step : g.dir === "D" ? -c.step : g.dir === "R" ? 3 : -3;
    var before = Math.abs(c.delta);
    c.delta = Math.max(-25, Math.min(25, c.delta + st));
    tuneSet();
    var after = Math.abs(c.delta);
    if (S.verbose) LAB.UI.blip(after < before ? 1100 : 500, 0.05, 0.06);
    return;
  }
  if (g.kind === "tap" && g.n === 1) {
    var b = Math.abs(c.delta);
    say(b < 0.8 ? LAB.K("Дрожи почти нет. Фиксируйте двойным касанием.", "Дрожи почти нет. Фиксируйте: Enter.") : b < 2.5 ? "Биения редкие — " + b.toFixed(0) + " в секунду. Совсем рядом." : b < 6 ? "Биения частые: около " + Math.round(b) + " в секунду." : "Звук дрожит сильно: " + Math.round(b) + " биений в секунду.");
    return;
  }
  if (g.kind === "dtap" && g.n === 1) {
    if (Math.abs(c.delta) < 0.8) { say("Резонатор настроен."); finish(true); return; }
    c.tries++;
    say("Ещё дрожит. " + (c.delta > 0 ? "Второй тон выше нужного — " + LAB.K("свайп вниз.", "стрелка вниз.") : "Второй тон ниже нужного — " + LAB.K("свайп вверх.", "стрелка вверх.")));
    if (c.tries >= 6) { say("Резонатор перегрелся. Попробуйте позже."); finish(false); }
  }
}

/* ════════ ПОЗИТРОННАЯ ЛОВУШКА: в такт пульсу ════════ */
function rhythm(n, cb) {
  var c = { type: "rhythm", name: "Стабилизация ловушки", cb: cb, need: Math.max(3, n || 3), streak: 0, misses: 0, period: 950, next: 0, raw: true, timer: null, ready: false };
  cur = c;
  say("Стабилизация ловушки. Слушайте пульс поля и " + LAB.K("касайтесь экрана одним пальцем точно в такт. Нужно " + c.need + " точных касаний подряд.", "нажимайте пробел точно в такт. Нужно " + c.need + " точных нажатий подряд.") + " Три промаха — выброс.", { interrupt: true });
  waitSpeech(function () {
    if (cur !== c) return;
    c.ready = true;
    var AE = LAB.AE; AE.ensure();
    var beat = function () {
      if (cur !== c) return;
      c.last = performance.now();
      tone(70, 0.22, 0, "sine", 0.35); tone(140, 0.12, 0, "triangle", 0.12);
      c.timer = setTimeout(beat, c.period);
    };
    c.cleanup = function () { clearTimeout(c.timer); };
    beat();
  });
}
function rhythmDown(t) {
  var c = cur;
  if (!c.ready) return;
  var now = t || performance.now();
  var since = now - c.last, to = c.period - since;
  var off = Math.min(Math.abs(since), Math.abs(to));
  if (off <= 140) {
    c.streak++;
    tone(1320 + c.streak * 80, 0.07, 0, "sine", 0.14);
    if (c.streak >= c.need) { clearTimeout(c.timer); setTimeout(function () { say("Ловушка стабильна."); finish(true); }, 250); return; }
    c.period = Math.max(620, c.period - 40);
  } else {
    c.streak = 0; c.misses++;
    tone(180, 0.18, 0, "sawtooth", 0.1);
    if (c.misses >= 3) { clearTimeout(c.timer); finish(false); return; }
    sayq(since < c.period / 2 ? "Поздно." : "Рано.");
  }
}

/* ════════ КОДОВЫЙ ЗАМОК: четыре диска ════════ */
function code(cb, opts) {
  opts = opts || {};
  cur = { type: "code", name: opts.title ? opts.title + ": кодовый замок" : "Кодовый замок", cb: cb, d: [0, 0, 0, 0], i: 0 };
  say((opts.title ? opts.title + ". " : "") + "Кодовый замок. Четыре диска. " + LAB.K("Свайп вверх или вниз — цифра, вправо или влево — следующий или прошлый диск, двойное касание — ввести код. Касание — повторить набранное, два пальца вниз — отойти.", "Стрелки вверх и вниз — цифра, вправо и влево — следующий или прошлый диск, цифры от 0 до 9 — набрать сразу, Enter — ввести код. Пробел — повторить набранное, Escape — отойти.") + " Диск 1: 0.", { interrupt: true });
}
function codeGesture(g) {
  var c = cur;
  if (g.kind === "swipe" && g.n === 1) {
    if (g.dir === "U" || g.dir === "D") {
      c.d[c.i] = (c.d[c.i] + (g.dir === "U" ? 1 : 9)) % 10;
      tone(600 + c.d[c.i] * 60, 0.05, 0, "square", 0.05);
      say(String(c.d[c.i]));
    } else {
      c.i = (c.i + (g.dir === "R" ? 1 : 3)) % 4;
      tone(900, 0.04, 0, "sine", 0.08);
      say("Диск " + (c.i + 1) + ": " + c.d[c.i]);
    }
    return;
  }
  /* клавиатура: цифра сразу ставится на диск, и набор идёт к следующему */
  if (g.kind === "digit") {
    c.d[c.i] = g.d;
    tone(600 + g.d * 60, 0.05, 0, "square", 0.05);
    if (c.i < 3) { c.i++; say(String(g.d)); }
    else say(g.d + ". Набрано: " + c.d.join(" ") + ". Enter — ввести код.");
    return;
  }
  if (g.kind === "tap" && g.n === 1) { say("Набрано: " + c.d.join(" ") + ". Диск " + (c.i + 1) + "."); return; }
  if (g.kind === "dtap" && g.n === 1) { var v = c.d.join(""); finish(true, v); }
}

/* Подождать, пока «Эхо» договорит инструкцию (но не дольше 9 секунд). */
function waitSpeech(fn) {
  var t0 = Date.now();
  var chk = function () {
    if (!LAB.Speech.busy() || Date.now() - t0 > 9000) { setTimeout(fn, 300); return; }
    setTimeout(chk, 150);
  };
  setTimeout(chk, 400);
}

/* Жесты — мини-игре. */
function gesture(g) {
  if (!cur) return false;
  if ((g.kind === "swipe" && g.n === 2 && g.dir === "D") || g.kind === "back") { cancel(); return true; }
  if (g.kind === "down") { if (cur.type === "rhythm") rhythmDown(g.t); return true; }
  if (cur.type === "rhythm") return true;
  if (cur.type === "hack") hackGesture(g);
  else if (cur.type === "tune") tuneGesture(g);
  else if (cur.type === "code") codeGesture(g);
  return true;
}

LAB.mini = {
  hack: hack, tune: tune, rhythm: rhythm, code: code, gesture: gesture, cancel: cancel,
  active: function () { return !!cur; },
  raw: function () { return !!(cur && cur.raw); },
  name: function () { return cur ? cur.name : ""; }
};
})();
