/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — мини-игры и головоломки на слух.
   Взлом (повторить сигналы свайпами), настройка магнетронного резонатора
   (убрать биения двух тонов), стабилизация позитронной ловушки (касаться
   в такт пульсу), кодовый замок (четыре диска), схема реле (погасить все
   реле, переключая и соседей), подбор ключа ОКО (быки и коровы на слух),
   настройка частот (расставить тона по высоте), звуковой замок (сыграть
   услышанную мелодию). Пока идёт мини-игра, жесты получает она. Отмена —
   два пальца вниз или «Назад».
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
var cur = null;

/* Короткий тон: частота, длительность, панорама, тембр. */
/* (звучит через единый обработчик звука; тоны головоломок слышны и при выключенных эффектах) */
function tone(f, dur, pan, type, vol, when) {
  if (!LAB.Sound) return;
  LAB.Sound.tone(f, dur, { type: type || "sine", pan: pan, vol: vol == null ? 0.16 : vol, when: when, attack: 0.015, hold: true, force: true });
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
var lastCancel = 0;
function cancel(silent) {
  if (!cur) return;
  lastCancel = Date.now();
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
  if (g.dir !== want) { c.busy = c.done = true; setTimeout(function () { if (cur !== c) return; say("Неверно. Защита сработала."); finish(false); }, 350); return; }
  c.pos++;
  if (c.pos < c.round) return;
  if (c.round >= c.seq.length) { c.busy = c.done = true; setTimeout(function () { if (cur === c) finish(true); }, 300); return; }
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
  /* два тона с биениями — особый звук единого обработчика */
  var hv = LAB.Sound && LAB.Sound.custom("tune", "ui", function (x, bus) {
    var g = x.createGain(); g.gain.value = 0; g.connect(bus);
    var o1 = x.createOscillator(), o2 = x.createOscillator();
    o1.type = "sine"; o2.type = "sine";
    o1.frequency.value = f0; o2.frequency.value = f0 + delta;
    o1.connect(g); o2.connect(g); o1.start(); o2.start();
    g.gain.linearRampToValueAtTime(0.09, x.currentTime + 0.6);
    c.o2 = o2; c.g = g;
    return function () { try { g.gain.setTargetAtTime(0, x.currentTime, 0.1); o1.stop(x.currentTime + 0.5); o2.stop(x.currentTime + 0.5); } catch (e) { /* */ } };
  });
  if (hv) c.cleanup = function () { hv.stop(); };
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
/* Задержка вывода звука (у Bluetooth-наушников — до трёхсот миллисекунд):
   удар слышен позже, чем запланирован, — меряем от того, когда он прозвучал. */
function outLatency() {
  var cx = LAB.AE && LAB.AE.ctx;
  var l = cx ? (cx.outputLatency || 0) + (cx.baseLatency || 0) : 0;
  return Math.max(0, Math.min(0.4, l)) * 1000;
}
function rhythmDown(t) {
  var c = cur;
  if (!c.ready) return;
  var now = t || performance.now(), lat = outLatency();
  var since = now - (c.last + lat), to = c.period - since;
  var off = Math.min(Math.abs(since), Math.abs(to));
  if (off <= 140 + Math.min(60, lat * 0.25)) {
    c.streak++;
    tone(1320 + c.streak * 80, 0.07, 0, "sine", 0.14);
    if (c.streak >= c.need) { clearTimeout(c.timer); setTimeout(function () { say("Ловушка стабильна."); finish(true); }, 250); return; }
    c.period = Math.max(620, c.period - 40);
  } else {
    c.streak = 0; c.misses++;
    tone(180, 0.18, 0, "sawtooth", 0.1);
    if (c.misses >= 3) { clearTimeout(c.timer); finish(false); return; }
    sayq(since >= 0 && since < c.period / 2 ? "Поздно." : "Рано.");
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

/* ════════ СХЕМА РЕЛЕ: погасить все реле ════════
   Реле стоят в ряд слева направо; у каждого свой тон и своя сторона.
   Горящие реле звучат аккордом. Переключить реле — переключаются и оба
   соседа (в кольце — по кругу). Нужно, чтобы все погасли: аккорд стих. */
var REL_F = [262, 294, 330, 392, 440, 523, 587, 659];
function relays(n, cb, opts) {
  opts = opts || {};
  n = Math.max(3, Math.min(8, n || 4));
  var st = [], i, k, seed = opts.seed || Math.floor(Math.random() * 1e9);
  var rnd = LAB.Rng ? LAB.Rng("relays", seed) : { int: function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); } };
  for (i = 0; i < n; i++) st.push(false);
  var c = { type: "relays", name: opts.title || "Схема реле", cb: cb, n: n, st: st, pos: 0, ring: !!opts.ring, moves: 0, limit: opts.limit || n * 3 + 2 };
  /* от погашенной схемы — случайные нажатия: решение всегда есть */
  var presses = 0;
  while (presses < n + 2 || !st.some(function (v) { return v; })) { relayPress(c, rnd.int(0, n - 1)); presses++; if (presses > 40) break; }
  if (!st.some(function (v) { return v; })) st[0] = st[1] = true;
  c.moves = 0;
  cur = c;
  say((opts.title || "Схема реле") + ". Реле: " + n + (c.ring ? ", замкнуты в кольцо" : "") + ". Горящие реле звучат. Переключая реле, вы переключаете и соседей. Погасите все. " +
    LAB.K("Свайп влево и вправо — выбрать реле, двойное касание — переключить, касание — послушать схему.", "Стрелки влево и вправо — выбрать реле, Enter — переключить, пробел — послушать схему, Escape — отойти.") + " Ходов не больше " + c.limit + ".", { interrupt: true });
  waitSpeech(function () { if (cur === c) relayChord(c, true); });
}
function relayPress(c, i) {
  var flip = [i, i - 1, i + 1];
  flip.forEach(function (j) {
    if (c.ring) j = (j + c.n) % c.n;
    if (j >= 0 && j < c.n) c.st[j] = !c.st[j];
  });
}
function relayPan(c, i) { return c.n > 1 ? -0.9 + 1.8 * i / (c.n - 1) : 0; }
function relayChord(c, speak) {
  var on = [];
  c.st.forEach(function (v, i) { if (v) { on.push(i + 1); tone(REL_F[i], 0.9, relayPan(c, i), "triangle", 0.11, i * 0.07); } });
  if (!on.length) tone(1700, 0.08, 0, "sine", 0.1);
  if (speak) sayq(on.length ? "Горят: " + on.join(", ") + "." : "Все погашены.");
}
function relaysGesture(g) {
  var c = cur;
  if (g.kind === "swipe" && g.n === 1 && (g.dir === "L" || g.dir === "R")) {
    c.pos = Math.max(0, Math.min(c.n - 1, c.pos + (g.dir === "R" ? 1 : -1)));
    var v = c.st[c.pos];
    if (v) tone(REL_F[c.pos], 0.25, relayPan(c, c.pos), "triangle", 0.15); else tone(180, 0.05, relayPan(c, c.pos), "square", 0.06);
    say("Реле " + (c.pos + 1) + (v ? ", горит" : ", погашено"));
    return;
  }
  if (g.kind === "tap" && g.n === 1) { relayChord(c, true); return; }
  if (g.kind === "dtap" && g.n === 1) {
    relayPress(c, c.pos); c.moves++;
    tone(900, 0.04, relayPan(c, c.pos), "square", 0.08);
    if (!c.st.some(function (v) { return v; })) { c.done = true; setTimeout(function () { if (cur !== c) return; tone(523, 0.15, 0, "sine", 0.14); tone(784, 0.3, 0, "sine", 0.14, 0.15); say("Схема погашена."); finish(true); }, 250); return; }
    setTimeout(function () { if (cur === c) relayChord(c, false); }, 200);
    if (c.moves >= c.limit) { c.done = true; setTimeout(function () { if (cur !== c) return; say("Ходы кончились: схема перегрелась."); finish(false); }, 900); }
  }
}

/* ════════ ПОДБОР КЛЮЧА: быки и коровы на слух ════════
   Ключ — несколько разных цифр от 1 до 6. После каждой попытки: сколько
   цифр на своём месте (высокие сигналы) и сколько есть, но не на месте
   (низкие сигналы). */
function bulls(len, cb, opts) {
  opts = opts || {};
  len = Math.max(3, Math.min(5, len || 3));
  var pool = [1, 2, 3, 4, 5, 6], key = [];
  for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  key = pool.slice(0, len);
  var c = { type: "bulls", name: opts.title || "Подбор ключа", cb: cb, key: key, len: len, d: [], i: 0, tries: 0, limit: opts.limit || (len === 3 ? 9 : len === 4 ? 11 : 13), hist: [] };
  for (var k = 0; k < len; k++) c.d.push(k + 1);
  cur = c;
  say((opts.title || "Подбор ключа") + ". Ключ — " + len + " разные цифры от одной до шести. После каждой попытки высокий сигнал — цифра на своём месте, низкий — цифра есть, но не там. " +
    LAB.K("Свайп вверх и вниз — цифра, влево и вправо — позиция, двойное касание — проверить, касание — что набрано и прошлые попытки.", "Стрелки вверх и вниз — цифра, влево и вправо — позиция, цифры от 1 до 6 — набрать сразу, Enter — проверить, пробел — что набрано, Escape — отойти.") + " Попыток: " + c.limit + ".", { interrupt: true });
}
function bullsGesture(g) {
  var c = cur;
  if (g.kind === "swipe" && g.n === 1) {
    if (g.dir === "U" || g.dir === "D") { c.d[c.i] = ((c.d[c.i] - 1 + (g.dir === "U" ? 1 : 5)) % 6) + 1; tone(500 + c.d[c.i] * 80, 0.05, 0, "square", 0.05); say(String(c.d[c.i])); }
    else { c.i = (c.i + (g.dir === "R" ? 1 : c.len - 1)) % c.len; tone(900, 0.04, 0, "sine", 0.08); say("Позиция " + (c.i + 1) + ": " + c.d[c.i]); }
    return;
  }
  if (g.kind === "digit") { if (g.d >= 1 && g.d <= 6) { c.d[c.i] = g.d; tone(500 + g.d * 80, 0.05, 0, "square", 0.05); if (c.i < c.len - 1) { c.i++; say(String(g.d)); } else say(g.d + ". Набрано: " + c.d.join(" ") + "."); } return; }
  if (g.kind === "tap" && g.n === 1) { say("Набрано: " + c.d.join(" ") + ". " + (c.hist.length ? "Было: " + c.hist.slice(-4).join("; ") + "." : "Попыток ещё не было.") + " Осталось попыток: " + (c.limit - c.tries) + "."); return; }
  if (g.kind === "dtap" && g.n === 1) {
    var uniq = c.d.filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (uniq.length < c.len) { say("Цифры ключа не повторяются. Наберите разные."); return; }
    c.tries++;
    var exact = 0, near = 0;
    c.d.forEach(function (v, i) { if (c.key[i] === v) exact++; else if (c.key.indexOf(v) >= 0) near++; });
    for (var a = 0; a < exact; a++) tone(1320, 0.12, 0, "sine", 0.14, a * 0.18);
    for (var b = 0; b < near; b++) tone(330, 0.14, 0, "triangle", 0.14, (exact + b) * 0.18);
    if (!exact && !near) tone(150, 0.25, 0, "sawtooth", 0.08);
    c.hist.push(c.d.join(" ") + ": на месте " + exact + ", не на месте " + near);
    if (exact === c.len) { c.done = true; setTimeout(function () { if (cur !== c) return; say("Ключ подобран: " + c.d.join(" ") + "."); finish(true); }, 300 + c.len * 180); return; }
    var left = c.limit - c.tries;
    if (left <= 0) c.done = true;
    setTimeout(function () {
      if (cur !== c) return;
      if (left <= 0) { say("На месте " + exact + ", не на месте " + near + ". Попытки кончились: ключ сменился."); finish(false); return; }
      say("На месте " + exact + ", не на месте " + near + ". Осталось попыток: " + left + ".");
    }, 250 + (exact + near) * 180);
  }
}

/* ════════ НАСТРОЙКА ЧАСТОТ: расставить тона по высоте ════════
   Тона перепутаны. Свайп вверх меняет тон под курсором местами с соседом
   справа. Расставьте от низкого слева к высокому справа. */
function sortTones(n, cb, opts) {
  opts = opts || {};
  n = Math.max(3, Math.min(7, n || 4));
  var base = [220, 262, 311, 370, 440, 523, 622].slice(0, n), arr = base.slice();
  do { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } } while (arr.every(function (v, k) { return v === base[k]; }));
  var c = { type: "sort", name: opts.title || "Настройка частот", cb: cb, arr: arr, n: n, pos: 0, swaps: 0, limit: opts.limit || n * 3 };
  cur = c;
  say((opts.title || "Настройка частот") + ". Тонов: " + n + ", они перепутаны. Расставьте их от низкого слева к высокому справа. " +
    LAB.K("Свайп влево и вправо — выбрать тон, свайп вверх — поменять его местами с соседом справа, касание — проиграть все, двойное касание — проверить.", "Стрелки влево и вправо — выбрать тон, стрелка вверх — поменять с соседом справа, пробел — проиграть все, Enter — проверить, Escape — отойти.") + " Перестановок не больше " + c.limit + ".", { interrupt: true });
  waitSpeech(function () { if (cur === c) sortPlay(c); });
}
function sortPlay(c) { c.arr.forEach(function (f, i) { tone(f, 0.3, c.n > 1 ? -0.8 + 1.6 * i / (c.n - 1) : 0, "triangle", 0.15, i * 0.38); }); }
function sortGesture(g) {
  var c = cur;
  if (g.kind === "swipe" && g.n === 1) {
    if (g.dir === "L" || g.dir === "R") { c.pos = Math.max(0, Math.min(c.n - 1, c.pos + (g.dir === "R" ? 1 : -1))); tone(c.arr[c.pos], 0.3, 0, "triangle", 0.16); sayq("Тон " + (c.pos + 1)); return; }
    if (g.dir === "U" || g.dir === "D") {
      if (c.pos >= c.n - 1) { say("Справа соседа нет. Выберите тон левее."); return; }
      var t = c.arr[c.pos]; c.arr[c.pos] = c.arr[c.pos + 1]; c.arr[c.pos + 1] = t; c.swaps++;
      tone(c.arr[c.pos], 0.2, -0.3, "triangle", 0.15); tone(c.arr[c.pos + 1], 0.2, 0.3, "triangle", 0.15, 0.22);
      if (c.swaps >= c.limit && !sorted(c)) { c.done = true; setTimeout(function () { if (cur !== c) return; say("Перестановки кончились: настройка сбилась."); finish(false); }, 700); }
      return;
    }
  }
  if (g.kind === "tap" && g.n === 1) { sortPlay(c); return; }
  if (g.kind === "dtap" && g.n === 1) {
    if (sorted(c)) { c.done = true; sortPlay(c); setTimeout(function () { if (cur !== c) return; say("Частоты выстроены."); finish(true); }, c.n * 380 + 200); }
    else { tone(160, 0.25, 0, "sawtooth", 0.08); say("Ещё не по порядку. Послушайте все тона: касание."); }
  }
}
function sorted(c) { for (var i = 1; i < c.n; i++) if (c.arr[i] < c.arr[i - 1]) return false; return true; }

/* ════════ ЗВУКОВОЙ ЗАМОК: сыграть известную мелодию ════════
   Мелодию игрок слышал на радиоприёмнике; «Эхо» может напомнить её раз. */
function melody(seq, cb, opts) {
  opts = opts || {};
  var c = { type: "melody", name: opts.title || "Звуковой замок", cb: cb, seq: seq.split(""), pos: 0, replays: opts.replays == null ? 1 : opts.replays, busy: true, mirror: !!opts.mirror };
  cur = c;
  say((opts.title || "Звуковой замок") + ". Сыграйте мелодию: " + c.seq.length + " нот. " + (c.mirror ? "Замок зеркальный: левое и правое поменяны местами. " : "") +
    LAB.K("Высокий — свайп вверх, низкий — вниз, слева — влево, справа — вправо. Касание — «Эхо» напомнит мелодию.", "Высокий — стрелка вверх, низкий — вниз, слева — влево, справа — вправо. Пробел — «Эхо» напомнит мелодию, Escape — отойти."), { interrupt: true });
  waitSpeech(function () { if (cur === c) { c.busy = false; tone(1500, 0.06, 0, "sine", 0.1); } });
}
function melodyGesture(g) {
  var c = cur;
  if (g.kind === "tap" && g.n === 1) {
    if (c.busy) return;
    if (c.replays <= 0) { say("«Эхо» больше не напомнит. Вспоминайте."); return; }
    c.replays--; c.busy = true; c.pos = 0;
    c.seq.forEach(function (d, i) { playSig(d, 0.2 + i * 0.45); });
    setTimeout(function () { if (cur === c) { c.busy = false; tone(1500, 0.06, 0, "sine", 0.1); } }, 300 + c.seq.length * 450);
    return;
  }
  if (g.kind !== "swipe" || g.n !== 1 || c.busy) return;
  var want = c.seq[c.pos];
  if (c.mirror) want = want === "L" ? "R" : want === "R" ? "L" : want;
  playSig(g.dir, 0);
  if (g.dir !== want) { c.done = true; setTimeout(function () { if (cur !== c) return; say("Фальшь. Замок сбросил мелодию."); finish(false); }, 350); return; }
  c.pos++;
  if (c.pos >= c.seq.length) { c.done = true; setTimeout(function () { if (cur === c) finish(true); }, 300); }
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
var gapUntil = 0, gapCancel = false;
function gesture(g) {
  if (!cur) {
    /* пауза между шагами цепочки: жесты не уходят в игру */
    if (Date.now() < gapUntil) { if ((g.kind === "swipe" && g.n === 2 && g.dir === "D") || g.kind === "back") { gapCancel = true; lastCancel = Date.now(); } return true; }
    return false;
  }
  if (cur.done) return true; /* итог уже решён — лишний жест его не перебьёт */
  if ((g.kind === "swipe" && g.n === 2 && g.dir === "D") || g.kind === "back") { cancel(); return true; }
  if (g.kind === "down") { if (cur.type === "rhythm") rhythmDown(g.t); return true; }
  if (cur.type === "rhythm") return true;
  if (cur.type === "hack") hackGesture(g);
  else if (cur.type === "tune") tuneGesture(g);
  else if (cur.type === "code") codeGesture(g);
  else if (cur.type === "relays") relaysGesture(g);
  else if (cur.type === "bulls") bullsGesture(g);
  else if (cur.type === "sort") sortGesture(g);
  else if (cur.type === "melody") melodyGesture(g);
  return true;
}

/* Цепочка испытаний: каждое следующее — после удачи прошлого. */
function chain(steps, cb) {
  var i = 0;
  var next = function (ok) {
    if (!ok) { cb(false); return; }
    if (i >= steps.length) { cb(true); return; }
    var s = steps[i++];
    if (i > 1) { LAB.UI.ok(); gapUntil = Date.now() + 800; gapCancel = false; setTimeout(function () { gapUntil = 0; if (gapCancel) { gapCancel = false; say("Прервано."); cb(false); return; } s(next); }, 700); } else s(next);
  };
  next(true);
}

LAB.mini = {
  hack: hack, tune: tune, rhythm: rhythm, code: code, relays: relays, bulls: bulls, sortTones: sortTones, melody: melody, chain: chain, gesture: gesture, cancel: cancel,
  active: function () { return !!cur || Date.now() < gapUntil; },
  wasCancelled: function () { return Date.now() - lastCancel < 1500; },
  _cur: function () { return cur; }, /* для проверок */
  raw: function () { return !!(cur && cur.raw); },
  name: function () { return cur ? cur.name : ""; }
};
})();
