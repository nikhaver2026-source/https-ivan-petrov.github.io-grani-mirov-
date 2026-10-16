/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — речь и звук.
   Речь: синтезатор телефона через мост приложения (LabTTS), Web Speech
   в браузере, встроенный eSpeak NG — если русского голоса нет.
   Звук: Web Audio — записи из папки sounds (декодируются заранее) с
   поворотом по сторонам света, глушением «за спиной» и за стенами,
   отзвуком помещения; синтезированные звуки исходной игры — запасные.
   Синтаксис — не новее ES2017 (WebView Android 9).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;

/* ── БЕЗОПАСНОЕ ХРАНИЛИЩЕ ── */
var store = {
  get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* нет хранилища */ } }
};
LAB.store = store;

/* ── НАСТРОЙКИ ── */
var DEF = {
  speech: 1, effects: 1, music: 1, ambience: 1, subtitles: 1, explore: 1, haptics: 1,
  rate: 1, ratePct: 50, voiceVol: 1, fxVol: 1, musicVol: 0.6, ambVol: 0.8, beaconVol: 1,
  voice: "", tts: "auto", robotVoice: 1,
  difficulty: 1, turnBased: 0, autoDoors: 0, autoRead: 1, beacons: 1, verbose: 1, doorsV: 2, musV: 2,
  /* микшер: каналы интерфейса, оружия, противников, тревог, пространственных
     эффектов (отзвук); низкие частоты в дБ (0 — как записано); динамический
     диапазон: 0 — широкий, 1 — обычный, 2 — сжатый (тихая игра, наушники) */
  uiVol: 1, weapVol: 1, foeVol: 1, alarmVol: 1, spaceVol: 1, bass: 0, drc: 1,
  /* навигатор: full — подробно и по шагам, brief — кратко, beacon — по звуку
     маяка, free — только по запросу; подсказки: 0 — только по запросу,
     1 — редко, 2 — обычно, 3 — часто; обучение; уведомление о записи:
     0 — нет, 1 — звук, 2 — звук и голос */
  navMode: "full", hints: 2, tutor: 1, saveNote: 1
};
var saved = {};
try { saved = JSON.parse(store.get("lab_settings") || "{}") || {}; } catch (e) { saved = {}; }
var settings = {};
var k0;
for (k0 in DEF) settings[k0] = DEF[k0];
for (k0 in saved) if (Object.prototype.hasOwnProperty.call(DEF, k0)) settings[k0] = saved[k0];
/* Скорость речи — в процентах от 0 до 100: 0 — вдвое медленнее обычного,
   50 — обычная, 100 — втрое быстрее. Темп синтезатора считается из процентов. */
LAB.rateFromPct = function (p) { p = Math.max(0, Math.min(100, +p || 0)); return p <= 50 ? 0.5 + p / 100 : 1 + (p - 50) / 25; };
LAB.pctFromRate = function (r) { r = +r || 1; return Math.max(0, Math.min(100, Math.round((r <= 1 ? (r - 0.5) * 100 : 50 + (r - 1) * 25) / 5) * 5)); };
if (saved.ratePct == null && saved.rate != null) settings.ratePct = LAB.pctFromRate(saved.rate);
/* Альфа 1.0: двери закрыты, пока игрок их не откроет (прежде открывались сами). */
if (saved.doorsV !== 2) { settings.autoDoors = 0; settings.doorsV = 2; }
/* Новая музыка (её слышно и на динамике телефона): прежняя громкость по
   умолчанию — 50 % — поднимается до новой; выбранную игроком не трогаем. */
if (saved.musV !== 2) { if (saved.musicVol == null || +saved.musicVol === 0.5) settings.musicVol = DEF.musicVol; settings.musV = 2; }
settings.rate = LAB.rateFromPct(settings.ratePct);
LAB.settings = settings;
LAB.saveSettings = function () { store.set("lab_settings", JSON.stringify(settings)); };

LAB.vib = function (p) {
  if (!settings.haptics) return;
  /* в приложении — через мост: WebView сам вибрацию не умеет */
  try {
    if (window.LabTTS && window.LabTTS.vibrate) { window.LabTTS.vibrate(String([].concat(p).join(","))); return; }
    if (navigator.vibrate) navigator.vibrate(p);
  } catch (e) { /* без вибрации */ }
};
LAB.safe = function (fn, fb) { try { return fn(); } catch (e) { try { console.warn("[Лаборатория]", e); } catch (_) { /* */ } return fb; } };

/* ════════ АУДИО-ДВИЖОК ════════ */
function vol01(v) { return v == null ? 1 : Math.max(0, Math.min(1, +v)); }
/* пространственные эффекты (отзвук помещений): 0 — сухо, 1 — как задумано, до 1,5 — гуще */
function spaceK() { return settings.spaceVol == null ? 1 : Math.max(0, Math.min(1.5, +settings.spaceVol)); }
var AE = {
  ctx: null, master: null, fx: null, music: null, amb: null, beacon: null, ui: null, voice: null, conv: null, wet: null, cache: {}, irc: {}, duck: 1,
  weap: null, foe: null, alarm: null, bed: null, bass: null, comp: null, makeup: null, wetBase: 0.35,
  ensure: function () {
    if (this.ctx) {
      /* в фоне звук не будим: его разбудит возврат на экран */
      if (this.ctx.state === "suspended" && !LAB.bg && !document.hidden) { try { this.ctx.resume(); } catch (e) { /* */ } }
      return this.ctx;
    }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    /* 32 кГц: записи в памяти занимают на треть меньше, а слух разницы почти не замечает */
    try { this.ctx = new C({ latencyHint: "interactive", sampleRate: 32000 }); }
    catch (e) { try { this.ctx = new C({ latencyHint: "interactive" }); } catch (e1) { try { this.ctx = new C(); } catch (e2) { return null; } } }
    var c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.95;
    /* мягкий ограничитель на выходе: громкие сцены не хрипят; за ним — подъём
       громкости для сжатого диапазона */
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.comp = comp; this.makeup = c.createGain();
    this.master.connect(comp); comp.connect(this.makeup); this.makeup.connect(c.destination);
    /* «подложка» — эффекты, музыка, окружение — идёт через полку низких частот;
       речь, интерфейс и маяки — мимо неё: бас не закрывает слова и сигналы */
    this.bass = c.createBiquadFilter(); this.bass.type = "lowshelf"; this.bass.frequency.value = 160;
    this.bed = c.createGain(); this.bed.connect(this.bass); this.bass.connect(this.master);
    this.fx = c.createGain(); this.fx.connect(this.bed);
    /* каналы внутри эффектов: оружие, противники, тревоги */
    this.weap = c.createGain(); this.weap.connect(this.fx);
    this.foe = c.createGain(); this.foe.connect(this.fx);
    this.alarm = c.createGain(); this.alarm.connect(this.fx);
    this.music = c.createGain(); this.music.connect(this.bed);
    this.amb = c.createGain(); this.amb.connect(this.bed);
    this.beacon = c.createGain(); this.beacon.connect(this.master);
    this.ui = c.createGain(); this.ui.connect(this.master);
    this.voice = c.createGain(); this.voice.connect(this.master);
    this.conv = c.createConvolver();
    this.conv.buffer = this.impulse(1.6, 3.2);
    this.wet = c.createGain(); this.wet.gain.value = 0.35 * spaceK();
    this.conv.connect(this.wet); this.wet.connect(this.fx);
    this.applyVolumes();
    this.applyMix();
    return c;
  },
  /* Устройство сломалось — новое: шины, отзвук, шум заново. Записи в памяти
     (AudioBuffer) годятся и новому устройству. */
  rebuild: function () {
    var old = this.ctx;
    this.ctx = null; this.cache = {}; this.irc = {};
    Bank.retry = {}; /* временные сбои загрузки — пробовать снова */
    if (old && old.state !== "closed") { try { var p = old.close(); if (p && p.catch) p.catch(function () { /* */ }); } catch (e) { /* */ } }
    return this.ensure();
  },
  applyVolumes: function () {
    if (!this.ctx) return;
    var t = this.ctx.currentTime, d = this.duck;
    this.fx.gain.setTargetAtTime(settings.effects ? settings.fxVol : 0, t, 0.05);
    this.ui.gain.setTargetAtTime(settings.effects ? Math.max(0.3, settings.fxVol) * vol01(settings.uiVol) : 0, t, 0.05);
    this.beacon.gain.setTargetAtTime(settings.effects && settings.beacons ? settings.beaconVol : 0, t, 0.05);
    this.amb.gain.setTargetAtTime(settings.effects && settings.ambience ? settings.ambVol * (0.55 + 0.45 * d) : 0, t, 0.25);
    /* под речь музыка тише, но не пропадает: речь звучит почти всё время */
    this.music.gain.setTargetAtTime(settings.music ? settings.musicVol * (0.7 + 0.3 * d) : 0, t, 0.25);
    this.voice.gain.setTargetAtTime(settings.voiceVol, t, 0.05);
    if (this.weap) {
      this.weap.gain.setTargetAtTime(vol01(settings.weapVol), t, 0.05);
      this.foe.gain.setTargetAtTime(vol01(settings.foeVol), t, 0.05);
      this.alarm.gain.setTargetAtTime(vol01(settings.alarmVol), t, 0.05);
      this.wet.gain.setTargetAtTime(this.wetBase * spaceK(), t, 0.1);
    }
  },
  /* Низкие частоты и динамический диапазон. */
  applyMix: function () {
    if (!this.ctx || !this.bass) return;
    var t = this.ctx.currentTime, c = this.comp;
    this.bass.gain.setTargetAtTime(Math.max(-12, Math.min(9, +settings.bass || 0)), t, 0.1);
    var P = [{ th: -4, kn: 6, ra: 2.5, mk: 1 }, { th: -10, kn: 8, ra: 6, mk: 1 }, { th: -26, kn: 12, ra: 12, mk: 1.6 }][+settings.drc] || { th: -10, kn: 8, ra: 6, mk: 1 };
    c.threshold.setTargetAtTime(P.th, t, 0.05); c.knee.setTargetAtTime(P.kn, t, 0.05); c.ratio.setTargetAtTime(P.ra, t, 0.05);
    this.makeup.gain.setTargetAtTime(P.mk, t, 0.1);
  },
  setDuck: function (on) { this.duck = on ? 0 : 1; this.applyVolumes(); },
  /* Отзвук помещения: отклики заготовлены по длине (шаг четверть секунды,
     не длиннее трёх) — переход комната↔коридор не пересчитывает их заново. */
  setReverb: function (sec, wet) {
    if (!this.ctx) return;
    try {
      var key = Math.max(0.5, Math.round(Math.min(3, sec) * 4) / 4);
      if (!this.irc[key]) this.irc[key] = this.impulse(key, 3);
      if (this.conv.buffer !== this.irc[key]) this.conv.buffer = this.irc[key];
      this.wetBase = wet;
      this.wet.gain.setTargetAtTime(wet * spaceK(), this.ctx.currentTime, 0.3);
    } catch (e) { /* */ }
  },
  impulse: function (sec, decay) {
    var rate = this.ctx.sampleRate, len = Math.floor(rate * sec), buf = this.ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  },
  getNoise: function (type, sec) {
    sec = sec || 2;
    var key = type + sec;
    if (sec >= 1 && this.cache[key]) return this.cache[key];
    var rate = this.ctx.sampleRate, len = Math.max(1, (rate * sec) | 0), buf = this.ctx.createBuffer(1, len, rate), d = buf.getChannelData(0);
    var last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (type === "white") d[i] = w;
      else if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    if (sec >= 1) this.cache[key] = buf;
    return buf;
  }
};
LAB.AE = AE;

/* Пространство: смещение источника от игрока → панорама, громкость, глушение.
   Север — впереди, юг — за спиной (звук глуше), за стеной — ещё глуше. */
LAB.spatial = function (dx, dy, occluded) {
  var d = Math.sqrt(dx * dx + dy * dy);
  var pan = d ? Math.max(-1, Math.min(1, (dx / Math.max(1.2, d)) * 1.05)) : 0;
  var gain = 1 / (1 + 0.24 * d);
  var lp = 20000;
  if (dy > 0) lp = Math.max(1400, 9000 - dy * 1300);
  if (occluded) { lp = Math.min(lp, 900); gain *= 0.55; }
  return { pan: pan, gain: gain, lp: lp, dist: d };
};

/* ════════ СИНТЕЗ (звуки исходной игры и запасные голоса машин) ════════ */
function SFX(bus) {
  this.ctx = AE.ctx; this.bus = bus || AE.fx;
  this.master = this.ctx.createGain(); this.master.connect(this.bus);
  this.nodes = []; this.timers = []; this.stopped = false;
}
SFX.prototype = {
  out: function () { return this.master; },
  pan: function (p, g) {
    if (!this.ctx.createStereoPanner) { this.master.gain.value = g == null ? 1 : g; return; }
    try { this.master.disconnect(); } catch (e) { /* */ }
    var pn = this.ctx.createStereoPanner(); pn.pan.value = p;
    var gg = this.ctx.createGain(); gg.gain.value = g == null ? 1 : g;
    this.master.connect(gg); gg.connect(pn); pn.connect(this.bus); this.nodes.push(pn, gg);
  },
  send: function (node, amount) { var g = this.ctx.createGain(); g.gain.value = amount; node.connect(g); g.connect(AE.conv); this.nodes.push(g); return g; },
  noise: function (type, sec, loop) { var s = this.ctx.createBufferSource(); s.buffer = AE.getNoise(type, sec); s.loop = loop !== false; this.nodes.push(s); return s; },
  osc: function (type, freq) { var o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; this.nodes.push(o); return o; },
  gain: function (v) { var g = this.ctx.createGain(); g.gain.value = v == null ? 1 : v; this.nodes.push(g); return g; },
  filter: function (type, freq, Q) { var f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q == null ? 1 : Q; this.nodes.push(f); return f; },
  lfo: function (freq, depth, param) { var o = this.osc("sine", freq), g = this.gain(depth); o.connect(g); g.connect(param); o.start(); return o; },
  start: function () { for (var i = 0; i < arguments.length; i++) arguments[i].start(); },
  every: function (min, max, fn) { var self = this; var tick = function () { if (self.stopped) return; fn(); self.timers.push(setTimeout(tick, min + Math.random() * (max - min))); }; tick(); },
  after: function (ms, fn) { var self = this; this.timers.push(setTimeout(function () { if (!self.stopped) fn(); }, ms)); },
  note: function (freq, delay, dur, type, vol) {
    dur = dur || 0.3; vol = vol == null ? 0.15 : vol;
    var t = this.ctx.currentTime + (delay || 0), o = this.osc(type || "sine", freq), g = this.gain(0);
    o.connect(g); g.connect(this.out());
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.1);
  },
  crackle: function () {
    var t = this.ctx.currentTime, n = this.noise("white", 0.06, false), f = this.filter("highpass", 1200 + Math.random() * 2500, 1), g = this.gain(0.1 + Math.random() * 0.22);
    n.connect(f); f.connect(g); g.connect(this.out()); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); n.start(t);
  },
  drop: function () {
    var t = this.ctx.currentTime, o = this.osc("sine", 700 + Math.random() * 500), g = this.gain(0);
    o.connect(g); g.connect(this.out()); this.send(g, 0.9);
    o.frequency.exponentialRampToValueAtTime(o.frequency.value * 0.45, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.start(t); o.stop(t + 0.25);
  },
  clang: function (base) {
    base = base || 180;
    var t = this.ctx.currentTime, ratios = [1, 2.756, 5.404, 8.933], vols = [0.3, 0.18, 0.1, 0.06], self = this;
    ratios.forEach(function (r, i) {
      var o = self.osc("sine", base * r), g = self.gain(0);
      o.connect(g); g.connect(self.out()); self.send(g, 0.25);
      g.gain.setValueAtTime(vols[i], t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + Math.random() * 0.4);
      o.start(t); o.stop(t + 1.2);
    });
    var n = this.noise("white", 0.05, false), f = this.filter("highpass", 2500, 1), ng = this.gain(0.25);
    n.connect(f); f.connect(ng); ng.connect(this.out()); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); n.start(t);
  },
  tink: function (f0) {
    var t = this.ctx.currentTime, f = f0 || (1800 + Math.random() * 1800), self = this;
    [1, 2.4].forEach(function (r, i) {
      var o = self.osc("triangle", f * r), g = self.gain(0);
      o.connect(g); g.connect(self.out());
      g.gain.setValueAtTime(i ? 0.06 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  },
  thump: function (pan, vol) {
    pan = pan || 0; vol = vol == null ? 0.4 : vol;
    var t = this.ctx.currentTime, dest = this.out();
    if (this.ctx.createStereoPanner) { var p = this.ctx.createStereoPanner(); p.pan.value = pan; p.connect(this.out()); this.nodes.push(p); dest = p; }
    var n = this.noise("brown", 0.12, false), f = this.filter("lowpass", 280, 1), g = this.gain(vol);
    n.connect(f); f.connect(g); g.connect(dest); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); n.start(t);
    var o = this.osc("sine", 72), og = this.gain(vol * 0.7); o.connect(og); og.connect(dest);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.start(t); o.stop(t + 0.12);
  },
  footstep: function (pan) {
    this.thump(pan, 0.4);
    var t = this.ctx.currentTime, n2 = this.noise("white", 0.03, false), f2 = this.filter("highpass", 3000, 1), g2 = this.gain(0.08);
    n2.connect(f2); f2.connect(g2); g2.connect(this.out()); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); n2.start(t);
  },
  metalstep: function (pan) {
    this.thump(pan, 0.3);
    this.clang(420 + Math.random() * 160);
  },
  swing: function (delayS) {
    var t = this.ctx.currentTime + (delayS || 0), n = this.noise("white", 0.5, false), f = this.filter("bandpass", 400, 1.5), g = this.gain(0);
    n.connect(f); f.connect(g); g.connect(this.out());
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3800, t + 0.18); f.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); n.start(t);
  },
  growl: function () {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", 85), o2 = this.osc("sawtooth", 57), f = this.filter("lowpass", 320, 2), g = this.gain(0);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.out());
    var v = this.osc("sine", 7), vg = this.gain(14); v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + 1.3);
    o.frequency.setValueAtTime(85, t); o.frequency.linearRampToValueAtTime(55, t + 1.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.start(t); o2.start(t); o.stop(t + 1.3); o2.stop(t + 1.3);
  },
  roar: function () {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", 70), f = this.filter("lowpass", 420, 2.5), g = this.gain(0);
    o.connect(f); f.connect(g); g.connect(this.out()); this.send(g, 0.5);
    o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(42, t + 0.9); o.frequency.linearRampToValueAtTime(78, t + 1.7);
    var v = this.osc("sine", 9), vg = this.gain(18); v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + 2.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.2); g.gain.setValueAtTime(0.45, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.start(t); o.stop(t + 2.3);
  },
  hiss: function () {
    var t = this.ctx.currentTime, n = this.noise("white", 1.5, false), f = this.filter("highpass", 3600, 1.5), g = this.gain(0);
    n.connect(f); f.connect(g); g.connect(this.out()); this.lfo(9, 0.06, g.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.15); g.gain.setValueAtTime(0.14, t + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); n.start(t);
  },
  screech: function () {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", 820), f = this.filter("bandpass", 1300, 3), g = this.gain(0);
    o.connect(f); f.connect(g); g.connect(this.out()); this.send(g, 0.3);
    o.frequency.setValueAtTime(820, t); o.frequency.exponentialRampToValueAtTime(1900, t + 0.16); o.frequency.exponentialRampToValueAtTime(760, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); o.start(t); o.stop(t + 0.85);
  },
  /* ── лабораторные ── */
  laser: function (f0, dur) {
    f0 = f0 || 1800; dur = dur || 0.22;
    var t = this.ctx.currentTime, o = this.osc("square", f0), g = this.gain(0), f = this.filter("lowpass", 5000, 1);
    o.connect(f); f.connect(g); g.connect(this.out()); this.send(g, 0.2);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  },
  zap: function () {
    var t = this.ctx.currentTime, n = this.noise("white", 0.25, false), f = this.filter("bandpass", 2600, 2), g = this.gain(0.0001);
    n.connect(f); f.connect(g); g.connect(this.out());
    for (var i = 0; i < 6; i++) { var tt = t + i * 0.035; g.gain.setValueAtTime(0.25 * Math.random() + 0.05, tt); g.gain.setValueAtTime(0.0001, tt + 0.02); }
    n.start(t);
  },
  servo: function (up) {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", up ? 300 : 520), f = this.filter("bandpass", 900, 4), g = this.gain(0);
    o.connect(f); f.connect(g); g.connect(this.out());
    o.frequency.linearRampToValueAtTime(up ? 520 : 300, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.04); g.gain.setValueAtTime(0.09, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.start(t); o.stop(t + 0.45);
  },
  chirp: function (seq) {
    var self = this;
    (seq || [1400, 1900, 1100]).forEach(function (f, i) { self.note(f, i * 0.07, 0.06, "square", 0.05); });
  },
  hum: function (freq, dur, vol) {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", freq || 100), o2 = this.osc("sine", (freq || 100) * 2.01), f = this.filter("lowpass", 600, 3), g = this.gain(0);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.out());
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.08, t + 0.15); g.gain.setValueAtTime(vol || 0.08, t + (dur || 1) - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1));
    o.start(t); o2.start(t); o.stop(t + (dur || 1) + 0.05); o2.stop(t + (dur || 1) + 0.05);
  },
  charge: function (dur) {
    dur = dur || 1;
    var t = this.ctx.currentTime, o = this.osc("sawtooth", 120), f = this.filter("bandpass", 600, 6), g = this.gain(0);
    o.connect(f); f.connect(g); g.connect(this.out()); this.send(g, 0.3);
    o.frequency.exponentialRampToValueAtTime(1600, t + dur); f.frequency.exponentialRampToValueAtTime(3200, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.start(t); o.stop(t + dur + 0.15);
  },
  boom: function (vol) {
    var t = this.ctx.currentTime, n = this.noise("brown", 2, false), f = this.filter("lowpass", 900, 0.8), g = this.gain(0);
    n.connect(f); f.connect(g); g.connect(this.out()); this.send(g, 0.6);
    f.frequency.exponentialRampToValueAtTime(80, t + 1.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.7, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); n.start(t);
  },
  whoosh: function (up) {
    var t = this.ctx.currentTime, n = this.noise("pink", 0.6, false), f = this.filter("bandpass", up ? 500 : 2400, 1.2), g = this.gain(0);
    n.connect(f); f.connect(g); g.connect(this.out());
    f.frequency.exponentialRampToValueAtTime(up ? 2400 : 500, t + 0.45);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); n.start(t);
  },
  ding: function () { this.note(1318, 0, 1.1, "sine", 0.16); this.note(1046, 0.25, 1.4, "sine", 0.14); },
  alarm: function () {
    var t = this.ctx.currentTime, o = this.osc("sawtooth", 600), f = this.filter("lowpass", 2500, 1), g = this.gain(0);
    o.connect(f); f.connect(g); g.connect(this.out());
    for (var i = 0; i < 4; i++) { o.frequency.setValueAtTime(600, t + i * 0.5); o.frequency.linearRampToValueAtTime(900, t + i * 0.5 + 0.45); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1, t + 0.05); g.gain.setValueAtTime(0.1, t + 1.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.start(t); o.stop(t + 2.05);
  },
  stop: function (fade) {
    if (this.stopped) return;
    fade = fade == null ? 0.5 : fade;
    this.stopped = true;
    var t = this.ctx.currentTime, self = this;
    try { this.master.gain.setValueAtTime(this.master.gain.value, t); this.master.gain.linearRampToValueAtTime(0.0001, t + fade); } catch (e) { /* */ }
    this.timers.forEach(clearTimeout);
    setTimeout(function () {
      self.nodes.forEach(function (n) { try { if (n.stop) n.stop(); } catch (e) { /* */ } try { n.disconnect(); } catch (e) { /* */ } });
      try { self.master.disconnect(); } catch (e) { /* */ }
    }, fade * 1000 + 80);
  }
};
LAB.SFX = SFX;

/* Короткий синтезированный звук: создать, сыграть, убрать. */
LAB.synth = function (fn, ms, bus, pan, gain) {
  if (!settings.effects || !AE.ensure()) return null;
  try {
    var s = new SFX(bus);
    if (pan != null || gain != null) s.pan(pan || 0, gain == null ? 1 : gain);
    fn(s);
    setTimeout(function () { s.stop(0.15); }, ms || 1500);
    return s;
  } catch (e) { return null; }
};

/* ════════ БАНК ЗАПИСЕЙ ════════
   Каждая запись — id и несколько вариантов; при игре берётся случайный
   вариант, слегка меняется высота: одинаковых звуков подряд не бывает. */
var Bank = {
  root: "sounds/", defs: {}, bufs: {}, pend: {}, bad: {}, retry: {}, loaded: 0, total: 0,
  def: function (id, files, opt) {
    opt = opt || {};
    this.defs[id] = { f: files, v: opt.v == null ? 1 : opt.v, bus: opt.bus || "fx", vary: opt.vary == null ? 0.04 : opt.vary, desc: opt.desc || "", cat: opt.cat || "" };
  },
  has: function (id) { return !!this.defs[id]; },
  load: function (file) {
    var self = this;
    if (this.bufs[file]) return Promise.resolve(this.bufs[file]);
    if (this.pend[file]) return this.pend[file];
    if (this.bad[file] || (this.retry[file] && Date.now() < this.retry[file]) || !AE.ensure() || typeof fetch !== "function" || location.protocol === "file:") return Promise.resolve(null);
    /* битой запись считается только при «нет файла» (404) или если её не
       раскодировало работающее устройство; обрыв, тайм-аут — повторим позже */
    var hard = false, ctl = typeof AbortController === "function" ? new AbortController() : null;
    var to = ctl ? setTimeout(function () { try { ctl.abort(); } catch (e) { /* */ } }, 20000) : 0;
    var decErr = function (rej) { return function (e) { if (AE.ctx && AE.ctx.state === "running") hard = true; rej(e); }; };
    var p = fetch(this.root + file, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      if (!r.ok) { if (r.status === 404 || r.status === 410) hard = true; throw new Error(r.status); }
      return r.arrayBuffer();
    }).then(function (ab) {
      clearTimeout(to);
      return new Promise(function (res, rej) {
        try {
          var pr = AE.ctx.decodeAudioData(ab, res, decErr(rej));
          if (pr && pr.then) pr.then(res, decErr(rej));
        } catch (e) { rej(e); }
      });
    }).then(function (buf) {
      self.bufs[file] = buf; delete self.pend[file]; self.loaded++; return buf;
    }).catch(function () { clearTimeout(to); if (hard) self.bad[file] = 1; else self.retry[file] = Date.now() + 15000; delete self.pend[file]; return null; });
    this.pend[file] = p;
    return p;
  },
  /* Загрузить записи по очереди (по 4 сразу), не мешая игре. */
  preload: function (ids, done) {
    var self = this, files = [];
    ids.forEach(function (id) { var d = self.defs[id]; if (d) d.f.forEach(function (f) { if (!self.bufs[f] && files.indexOf(f) < 0) files.push(f); }); });
    this.total += files.length;
    var i = 0, active = 0;
    function next() {
      while (active < 4 && i < files.length) {
        active++;
        self.load(files[i++]).then(function () { active--; if (i >= files.length && !active) { if (done) done(); } else next(); });
      }
      if (!files.length && done) done();
    }
    next();
  },
  /* Выгрузить записи из памяти (звуки прошлого уровня). */
  release: function (ids) {
    var self = this, keep = {};
    ids.forEach(function (id) { var d = self.defs[id]; if (d) d.f.forEach(function (f) { if (self.bufs[f]) { delete self.bufs[f]; self.loaded--; } }); });
    return keep;
  },
  ready: function (id) {
    var d = this.defs[id]; if (!d) return false;
    for (var i = 0; i < d.f.length; i++) if (this.bufs[d.f[i]]) return true;
    return false;
  },
  /* Сыграть: o.pan, o.gain, o.lp (Гц), o.rate, o.delay (с), o.loop, o.bus, o.reverb (0–1), o.at {dx,dy,occ}.
     Если записи ещё нет — o.fb (синтез) или тишина; запись при этом начинает грузиться. */
  play: function (id, o) {
    o = o || {};
    var bus0 = o.bus || (this.defs[id] && this.defs[id].bus);
    if (!settings.effects && bus0 !== "voice" && bus0 !== "music") return null;
    var d = this.defs[id];
    if (!d || !AE.ensure()) { if (o.fb) LAB.synth(o.fb, o.fbms || 1500, AE[o.bus || "fx"], o.pan, o.gain); return null; }
    var ready = [];
    for (var i = 0; i < d.f.length; i++) if (this.bufs[d.f[i]]) ready.push(d.f[i]);
    if (!ready.length) {
      this.preload([id]);
      if (o.fb) LAB.synth(o.fb, o.fbms || 1500, AE[o.bus || d.bus], o.pan, o.gain);
      return null;
    }
    var file = o.variant != null ? ready[o.variant % ready.length] : ready[Math.floor(Math.random() * ready.length)];
    if (o.variant == null && ready.length > 1 && file === d.last) file = ready[(ready.indexOf(file) + 1) % ready.length];
    d.last = file;
    var c = AE.ctx, t = c.currentTime + (o.delay || 0);
    var src = c.createBufferSource();
    src.buffer = this.bufs[file];
    var rate = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * (o.vary == null ? d.vary : o.vary));
    src.playbackRate.value = rate;
    if (o.loop) { src.loop = true; if (o.loopStart) src.loopStart = o.loopStart; if (o.loopEnd) src.loopEnd = o.loopEnd; }
    var sp = o.at ? LAB.spatial(o.at.dx, o.at.dy, o.at.occ) : null;
    var g = c.createGain();
    var vol = d.v * (o.gain == null ? 1 : o.gain) * (sp ? sp.gain : 1);
    g.gain.value = vol;
    var node = src;
    var lpHz = sp ? sp.lp : o.lp;
    if (o.lp && sp) lpHz = Math.min(o.lp, sp.lp);
    if (lpHz && lpHz < 18000) { var f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lpHz; node.connect(f); node = f; }
    node.connect(g);
    var out = g;
    var pan = sp ? sp.pan : o.pan;
    if (pan && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); out = p; }
    /* канал внутри шины: оружие, противники, тревоги (o.ch) — своя громкость */
    out.connect((o.ch && AE[o.ch]) || AE[o.bus || d.bus] || AE.fx);
    var rv = o.reverb == null ? (o.bus === "ui" || d.bus === "ui" || d.bus === "beacon" ? 0 : 0.25) : o.reverb;
    if (rv > 0) { var sg = c.createGain(); sg.gain.value = rv; g.connect(sg); sg.connect(AE.conv); }
    if (o.fadeIn) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + o.fadeIn); }
    try { src.start(t, o.offset || 0); } catch (e) { return null; }
    var h = {
      src: src, gain: g, dur: src.buffer.duration / rate, stopped: false,
      stop: function (fade) {
        if (h.stopped) return; h.stopped = true;
        var tt = c.currentTime; fade = fade == null ? 0.12 : fade;
        try { g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(g.gain.value, tt); g.gain.linearRampToValueAtTime(0.0001, tt + fade); src.stop(tt + fade + 0.02); } catch (e) { /* */ }
      },
      setGain: function (v, tc) { try { g.gain.setTargetAtTime(d.v * v, c.currentTime, tc || 0.1); } catch (e) { /* */ } }
    };
    src.onended = function () { h.stopped = true; try { g.disconnect(); } catch (e) { /* */ } };
    return h;
  }
};
LAB.Bank = Bank;

/* ════════ РЕЧЬ ════════ */
/* Имена клавиш в подсказках (сборка для компьютера) — так, как их говорят
   вслух: «Enter» — «Энтер», одиночная латинская буква «W» — «дабл ю».
   На экране подсказка остаётся как есть. */
var KEY_SAY = { Enter: "Энтер", Tab: "Таб", Escape: "Эскейп", Backspace: "Бэкспейс", Home: "Хоум", End: "Энд", Ctrl: "Контрол", Shift: "Шифт", Alt: "Альт", F1: "Эф один", F11: "Эф одиннадцать" };
var LAT_SAY = { A: "эй", B: "би", C: "си", D: "ди", E: "и", F: "эф", G: "джи", H: "эйч", I: "ай", J: "джей", K: "кей", L: "эл", M: "эм", N: "эн", O: "оу", P: "пи", Q: "кью", R: "ар", S: "эс", T: "ти", U: "ю", V: "ви", W: "дабл ю", X: "экс", Y: "уай", Z: "зед" };
var ROMAN_W = { I: "первый", II: "второй", III: "третий", IV: "четвёртый", V: "пятый" };
function keysSpoken(t) {
  /* «Блок I» — «Блок первый», а не «Блок ай» */
  t = t.replace(/(^|[^А-Яа-яЁё])([Бб]лок)\s+(I{1,3}|IV|V)(?![A-Za-z])/g, function (m, a, w, r) { return a + w + " " + ROMAN_W[r]; });
  return t.replace(/\b(Enter|Tab|Escape|Backspace|Home|End|Ctrl|Shift|Alt|F11|F1)\b/g, function (m) { return KEY_SAY[m]; })
    .replace(/(^|[^A-Za-z0-9])([A-Z])(?![A-Za-z0-9])/g, function (m, a, b) { return a + LAT_SAY[b]; });
}
LAB.keysSpoken = keysSpoken;
var Speech = {
  backend: "none", queue: [], speaking: false, cur: null, seq: 0, timer: null, keepAlive: null,
  reading: false, noteReading: false, later: [], userUntil: 0, held: [], heldTimer: null, lastUser: 0,
  webVoice: null, webVoices: [], androidVoices: [], ready: false, esp: null, espSt: "off", espSrc: null, onState: null,
  hasBridge: function () { return !!(window.LabTTS && typeof window.LabTTS.speak === "function"); },
  hasWeb: function () { return typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined"; },
  init: function () {
    var self = this;
    if (this.hasWeb()) {
      var pick = function () {
        try { self.webVoices = window.speechSynthesis.getVoices() || []; } catch (e) { self.webVoices = []; }
        var ru = self.webVoices.filter(function (v) { return /^ru/i.test(v.lang); });
        self.webVoice = (settings.voice && self.webVoices.filter(function (v) { return v.name === settings.voice; })[0]) || ru[0] || null;
        self.choose();
        if (self.onState) self.onState();
      };
      pick();
      try { window.speechSynthesis.onvoiceschanged = pick; } catch (e) { /* */ }
    }
    if (this.hasBridge()) {
      window.LabTTSStart = function (id) { self._started(id); };
      window.LabTTSDone = function (id) { if (self.cur && self.cur.id === id) self._done(); };
      window.LabTTSError = function (id) { if (self.cur && self.cur.id === id) self._done(true); };
      var poll = 0;
      var check = function () {
        var st = "";
        try { st = window.LabTTS.status(); } catch (e) { st = "ready"; }
        if (st === "init" && poll++ < 40) { setTimeout(check, 250); return; }
        self.refreshBridge(st);
        if (settings.voice && self.backend === "android") { try { window.LabTTS.setVoice(settings.voice); } catch (e) { /* */ } }
        if (self.onState) self.onState();
      };
      check();
      /* компьютер: мост голосов поднялся позже или голоса перечитаны */
      /* Голоса поднялись заново, появились или пропали (запустили или закрыли NVDA,
         JAWS): мост снова в деле, даже если прежде сбоил и игра ушла на eSpeak. */
      window.addEventListener("lab-tts-ready", function () { poll = 0; self.bridgeBad = false; self.fails.android = 0; check(); });
    }
    this.choose();
    if (settings.robotVoice) setTimeout(function () { self.loadESpeak(); }, 2500);
    try { document.addEventListener("visibilitychange", function () { if (!document.hidden) self.resume(); }); } catch (e) { /* */ }
  },
  /* Голоса моста заново: телефон или компьютер (голоса перечитаны). */
  refreshBridge: function (st) {
    if (!this.hasBridge()) return;
    if (st == null) { try { st = window.LabTTS.status(); } catch (e) { st = "ready"; } }
    try { this.androidVoices = JSON.parse(window.LabTTS.getVoices() || "[]"); } catch (e) { this.androidVoices = []; }
    this.bridgeState = st;
    this.choose();
  },
  /* Кто говорит: выбранный игроком синтезатор, иначе телефон, иначе браузер, иначе eSpeak. */
  choose: function () {
    var pref = settings.tts;
    var b = "none";
    if (pref === "espeak") b = "espeak";
    else if (this.hasBridge() && !this.bridgeBad && this.bridgeState !== "failed" && (pref === "system" || this.bridgeHasRu())) b = "android";
    /* на компьютере голосов Windows (Microsoft) нет: говорит мост — NVDA, JAWS,
       установленные синтезаторы, — а без них встроенный eSpeak NG */
    else if (LAB.desktop) b = "espeak";
    else if (this.hasWeb() && !this.webBad && (pref === "system" || this.webVoice || (this.webVoices.length === 0 && !this.hasBridge()))) b = "web";
    else b = "espeak";
    if (b === "espeak") this.loadESpeak();
    this.backend = b;
    return b;
  },
  bridgeHasRu: function () {
    if (this.bridgeState === "init" || this.bridgeState == null) return true;
    try { if (window.LabTTS.hasRussian) return !!window.LabTTS.hasRussian(); } catch (e) { /* */ }
    return this.androidVoices.some(function (v) { return /^ru/i.test(v.lang); }) || !this.androidVoices.length;
  },
  listVoices: function () {
    var out = [];
    if (this.hasBridge()) this.androidVoices.forEach(function (v) { out.push({ id: v.id, name: v.name + (v.local === false ? " · сеть" : ""), lang: v.lang, src: "android", engine: v.engine || "", auto: !!v.auto }); });
    else this.webVoices.forEach(function (v) { out.push({ id: v.name, name: v.name + " (" + v.lang + ")", lang: v.lang, src: "web" }); });
    return out;
  },
  setVoice: function (id) {
    settings.voice = id; LAB.saveSettings();
    if (this.hasBridge()) { try { window.LabTTS.setVoice(id); } catch (e) { /* */ } }
    else { var v = this.webVoices.filter(function (x) { return x.name === id; })[0]; if (v) this.webVoice = v; }
    this.choose();
  },
  /* ── eSpeak NG внутри игры ── */
  loadESpeak: function () {
    if (this.espSt !== "off") return;
    this.espSt = "loading";
    var self = this;
    var add = function (src, ok) {
      try {
        var s = document.createElement("script"); s.src = src; s.async = true;
        s.onload = ok; s.onerror = function () { self.espSt = "failed"; self._pump(); };
        (document.head || document.documentElement).appendChild(s);
      } catch (e) { self.espSt = "failed"; self._pump(); }
    };
    add("espeak/espeak-ru-data.js", function () {
      add("espeak/espeak-ng.js", function () {
        try {
          var D = window.GRANI_ESPEAK_DATA, buf = new Uint8Array(D.size);
          var raw = atob(D.b64), bin = new Uint8Array(raw.length);
          for (var i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
          var o = 0;
          D.parts.forEach(function (p) { buf.set(bin.subarray(o, o + (p[1] - p[0])), p[0]); o += p[1] - p[0]; });
          try { D.b64 = ""; } catch (e) { /* */ }
          window.GraniESpeakModule({ getPreloadedPackage: function () { return buf.buffer; } }).then(function (M) {
            var w = new M.eSpeakNGWorker(); w.set_voice("ru"); self.esp = w; self.espSt = "ready";
            self._pump();
          }).catch(function () { self.espSt = "failed"; self._pump(); });
        } catch (e) { self.espSt = "failed"; self._pump(); }
      });
    });
  },
  espClean: function (t) {
    t = String(t == null ? "" : t);
    t = t.replace(/[«»“”„"]/g, "").replace(/[—–]/g, ", ").replace(/×/g, " на ").replace(/№/g, "номер ");
    t = t.replace(/[^\x20-\x7EА-яЁё\n.,!?:;()-]/g, " ");
    t = t.replace(/[A-Za-z]+/g, function (w) {
      var M = { a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "дж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс", y: "и", z: "з" };
      return w.toLowerCase().split("").map(function (c) { return M[c] || c; }).join("");
    });
    return t.replace(/\s+/g, " ").trim();
  },
  espBuffer: function (text, robot) {
    var w = this.esp; if (!w || !AE.ensure()) return null;
    try {
      w.set_rate(Math.max(80, Math.min(530, Math.round(175 * (+settings.rate || 1)))));
      try { w.set_pitch(robot ? 30 : 50); } catch (e) { /* */ }
      var parts = [], n = 0;
      w.synthesize(this.espClean(text), function (s) { if (s && s.length) { parts.push(s); n += s.length; } });
      if (!n) return null;
      var sr = w.get_samplerate() || 22050;
      var buf = AE.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), o = 0;
      parts.forEach(function (p) { for (var i = 0; i < p.length; i++) d[o++] = p[i] / 32768; });
      return buf;
    } catch (e) { return null; }
  },
  _chunk: function (text) {
    text = keysSpoken(String(text == null ? "" : text)).replace(/\s+/g, " ").trim();
    if (!text) return [];
    var sents = text.match(/[^.!?…]+[.!?…]*/g) || [text], out = [];
    sents.forEach(function (s) {
      s = s.trim(); if (!s) return;
      while (s.length > 200) {
        var cut = s.lastIndexOf(",", 200); if (cut < 40) cut = s.lastIndexOf(" ", 200); if (cut < 40) cut = 200;
        out.push(s.slice(0, cut + 1).trim()); s = s.slice(cut + 1).trim();
      }
      if (s) out.push(s);
    });
    /* короткие фразы склеиваем — меньше пауз между ними */
    var merged = [];
    out.forEach(function (p) { if (merged.length && (merged[merged.length - 1] + " " + p).length < 160) merged[merged.length - 1] += " " + p; else merged.push(p); });
    return merged;
  },
  /* ════ ЕДИНЫЙ ОБРАБОТЧИК РЕЧИ ════
     Всё, что игра говорит, идёт через одну очередь — с какого бы синтезатора
     ни звучало (телефон, браузер, мост компьютера: NVDA, JAWS, синтезаторы;
     встроенный eSpeak NG):
     • важность: срочное (опасность) перебивает событие, но очередь событий
       не теряет; ответ на действие игрока перебивает и отменяет недосказанное
       (игрок уже дальше); событие ждёт своей очереди; подсказка — если тихо;
     • одно и то же подряд не повторяется, устаревшее событие не звучит;
     • записка и длинный текст дочитываются до конца: фразы игры ждут;
     • зависшая фраза не держит очередь: сторож ждёт начала и конца фразы,
       при сбое повторяет её, при повторном — говорит её eSpeak; синтезатор,
       который сбоит раз за разом, сменяется другим;
     • фраза, оборванная уходом игры в фон, повторяется, когда игра вернулась. */
  PRIO: { info: 0, event: 1, action: 2, urgent: 3 },
  TTL: { 0: 4000, 1: 9000 },
  fails: {}, hangs: 0, dropped: 0, estScale: 1, testEngine: null,
  /* Жест игрока: то, что скажется в ответ на него, может перебить чтение. */
  user: function () { this.userUntil = Date.now() + 450; this.userTok = (this.userTok || 0) + 1; },
  isUser: function () { return Date.now() <= this.userUntil; },
  /* Записка читается: её не обрывает ни событие, ни действие игрока —
     только тишина (четыре пальца вниз) или явное «замолчать». */
  noteBusy: function () { return this.noteReading && (this.speaking || this.queue.length > 0); },
  /* Любое действие игрока сразу обрывает речь — кроме записки. Важное
     сообщение (keep: громкая связь ОКО, кто вышел и откуда) не теряется:
     оно отложено и прозвучит, как только игрок замрёт. */
  userAct: function () {
    this.user();
    this.lastUser = Date.now();
    if (this.noteBusy()) return;
    this._hold();
    if (this.speaking || this.queue.length) this.stop();
    this.later = [];
  },
  /* Отложить важное (keep), которое сейчас обрывается: недосказанную фразу
     и ждущие в очереди. */
  _hold: function () {
    var self = this, got = [], cur = this.cur;
    if (cur && cur.item && cur.item.keep) {
      var need = String(cur.text).length * 55 / Math.max(0.5, +settings.rate || 1);
      if (!cur.started || Date.now() - cur.t0 < need) got.push(cur.item);
    }
    this.queue.forEach(function (it) { if (it.keep) got.push(it); });
    /* важное, что ждало конца чтения, тоже не пропадает */
    this.later.forEach(function (l) { if (l.keep) self._chunk(l.text).forEach(function (p) { got.push({ text: p, full: l.text, robot: l.robot, prio: l.prio || 1, key: "", t: Date.now(), ttl: 30000, tries: 0, keep: true }); }); });
    got.forEach(function (it) { if (!self.held.some(function (h) { return h.text === it.text; })) self.held.push(it); });
    if (this.held.length > 6) this.held = this.held.slice(-6);
    if (this.held.length) this._armHeld();
  },
  _armHeld: function () {
    var self = this;
    clearTimeout(this.heldTimer);
    this.heldTimer = setTimeout(function () { self._release(); }, 1300);
  },
  /* Игрок замер — отложенное важное звучит (что устарело — уже нет). */
  _release: function () {
    this.heldTimer = null;
    if (!this.held.length) return;
    if (Date.now() - this.lastUser < 1100 || this.noteBusy()) { this._armHeld(); return; }
    var now = Date.now(), self = this, items = this.held;
    this.held = [];
    items.forEach(function (it) { if (now - it.t < 30000 && !self.queue.some(function (q) { return q.text === it.text; })) self.queue.push(it); });
    this._pump();
  },
  _prio: function (opts) {
    var P = this.PRIO;
    if (typeof opts.prio === "string") return P[opts.prio] != null ? P[opts.prio] : P.event;
    if (typeof opts.prio === "number") return opts.prio;
    if (opts.urgent) return P.urgent;
    return opts.interrupt === false ? P.event : P.action;
  },
  /* Длинный текст (записка, глава руководства, пролог) дочитывается до конца:
     фразы игры, сказанные без жеста игрока, ждут конца чтения. Перебить
     чтение может только сам игрок — любым жестом; четыре пальца вниз — тишина.
     opts: interrupt (false — в очередь), prio ("info" | "event" | "action" |
     "urgent"), urgent, key (новая фраза с тем же ключом заменяет ждущую),
     keep (важное: действие игрока его не отменяет — оно прозвучит, когда
     игрок замрёт), note, read, robot. */
  say: function (text, opts) {
    opts = opts || {};
    text = String(text == null ? "" : text);
    if (!text.replace(/\s+/g, "")) return;
    this.sayN = (this.sayN || 0) + 1;
    var P = this.PRIO, prio = this._prio(opts), user = this.isUser();
    /* важное — в историю объявлений (точка и запятая на клавиатуре) */
    if (!opts.hist && (opts.keep || prio >= P.urgent) && LAB.history) LAB.history.add(text);
    var noteOn = this.noteBusy() && !opts.note;
    var readOn = this.reading && (this.speaking || this.queue.length > 0) && !user && prio < P.urgent && !opts.note;
    if (noteOn || readOn) {
      /* ждёт конца чтения; из отложенного остаются самые важные и свежие */
      this.later.push({ text: text, robot: !!opts.robot, prio: prio, keep: !!opts.keep });
      while (this.later.length > 4) {
        var lo = -1; for (var i = 0; i < this.later.length; i++) if (!this.later[i].keep && (lo < 0 || this.later[i].prio < this.later[lo].prio)) lo = i;
        this.later.splice(lo < 0 ? 0 : lo, 1);
      }
      return;
    }
    var live = LAB.desktop ? null : document.getElementById("liveRegion"); /* на компьютере чтец экрана не дублирует речь игры */
    if (live) { live.textContent = ""; var tt = text; requestAnimationFrame(function () { live.textContent = tt; }); }
    if (LAB.showCaption) LAB.showCaption(text);
    if (!settings.speech) return;
    var now = Date.now(), full = text.replace(/\s+/g, " ").trim(), self = this;
    /* то же самое уже звучит или ждёт — второй раз не нужно */
    if (prio < P.action) {
      if (this.cur && this.cur.full === full && now - this.cur.t0 < 2500) return;
      for (var q = 0; q < this.queue.length; q++) if (this.queue[q].full === full) return;
      for (var hq = 0; hq < this.held.length; hq++) if (this.held[hq].full === full) return;
    }
    if (opts.key) this.queue = this.queue.filter(function (it) { return it.key !== opts.key; });
    var front = false;
    if (prio >= P.action && opts.interrupt !== false) {
      if (prio === P.urgent && !user && !opts.note) {
        /* срочное: перебить фразу события, очередь событий оставить; перебитая
           фраза прозвучит ещё раз — сразу после срочного */
        if (this.cur && this.cur.prio < P.urgent && !this.noteReading) { var was = this.cur.item; this._cut(); if (was) this.queue.unshift(was); }
        front = true;
      } else if (this.glueTok === (this.userTok || 0) && now - this.glueAt < 450 && (this.speaking || this.queue.length)) {
        /* та же реакция на тот же жест (итог действия, а следом — меню):
           не обрываем сказанное, а дополняем */
      } else { this._hold(); this.stop(true); this.later = []; }
      if (prio !== P.urgent) { this.glueAt = now; this.glueTok = this.userTok || 0; }
    }
    var parts = this._chunk(text);
    if (opts.note) { this.noteReading = true; this.reading = true; }
    else if (opts.read || text.length > 230) this.reading = true;
    /* срок годности — у событий без жеста игрока: опоздавшее не звучит */
    var ttl = opts.keep ? 30000 : prio <= P.event && !user && !opts.note && !opts.read ? (this.TTL[prio] || 9000) : 0;
    var items = parts.map(function (p) { return { text: p, full: full, robot: !!opts.robot, prio: prio, key: opts.key || "", t: now, ttl: ttl, tries: 0, keep: !!opts.keep }; });
    if (front) { var k = 0; while (k < this.queue.length && this.queue[k].prio >= P.urgent) k++; Array.prototype.splice.apply(this.queue, [k, 0].concat(items)); }
    else Array.prototype.push.apply(this.queue, items);
    /* длинная очередь событий: старые события уступают */
    while (this.queue.length > 14) {
      var drop = -1;
      for (var j = 0; j < this.queue.length; j++) if (this.queue[j].prio <= P.event && this.queue[j].ttl && !this.queue[j].keep) { drop = j; break; }
      if (drop < 0) break;
      this.queue.splice(drop, 1); this.dropped++;
    }
    this._pump();
  },
  /* Сторож фразы. До начала: синтезатор молчит дольше четырёх секунд — фраза
     не пошла (повторим). После начала: синтезатор замолчал, а о конце не
     сообщил — фраза сказана; говорит втрое дольше ожидаемого — завис. */
  _arm: function (id, text, started) {
    var self = this, sc = this.estScale || 1;
    clearTimeout(this.timer);
    if (!started) {
      this.timer = setTimeout(function () {
        if (!self.cur || self.cur.id !== id || self.cur.started) return;
        if (self._engineBusy()) { self._started(id); return; }
        var b = self.cur.backend;
        /* синтезатор телефона ещё просыпается — ждём дальше, не повторяя фразу */
        if (b === "android") { var st = ""; try { st = window.LabTTS.status(); } catch (e) { /* */ } if (st === "init" && Date.now() - self.cur.t0 < 20000) { self._arm(id, text, false); return; } }
        /* мост компьютера о начале фразы не сообщает: ждём конца по времени */
        if (!(b === "web" || b === "test" || (b === "android" && !LAB.desktop))) { self._started(id); return; }
        self.hangs++; self._done(true);
      }, 4000 * sc);
      return;
    }
    var est = (4000 + String(text).length * 150 / Math.max(0.5, +settings.rate || 1)) * sc, waited = 0, step = 1500 * sc;
    var check = function () {
      if (!self.cur || self.cur.id !== id) return;
      if (self._engineBusy()) {
        if (waited < est * 3) { waited += step; self.timer = setTimeout(check, step); return; }
        self.hangs++; self._done(true); return;
      }
      self._done(false);
    };
    this.timer = setTimeout(check, est);
  },
  _started: function (id) {
    if (!this.cur || this.cur.id !== id || this.cur.started) return;
    this.cur.started = true;
    this._arm(id, this.cur.text, true);
  },
  _engineBusy: function () {
    if (this.espSrc) return true;
    if (this.backend === "test" && this.testEngine) return !!this.testEngine.busy();
    if (this.backend === "android" && this.hasBridge()) { try { if (window.LabTTS.isSpeaking) return !!window.LabTTS.isSpeaking(); } catch (e) { /* */ } return false; }
    if (this.backend === "web" && this.hasWeb()) { try { return !!window.speechSynthesis.speaking; } catch (e) { /* */ } }
    return false;
  },
  /* Фраза кончилась (err — сбой): дальше по очереди; сбойную — ещё раз, потом eSpeak. */
  _done: function (err) {
    clearTimeout(this.timer); this.timer = null;
    if (this.espSrc) { try { this.espSrc.onended = null; } catch (e) { /* */ } this.espSrc = null; }
    var cur = this.cur;
    this.cur = null; this.speaking = false;
    this._stopKeepAlive();
    if (cur) {
      var b = cur.backend;
      if (err) {
        this.fails[b] = (this.fails[b] || 0) + 1;
        var it = cur.item;
        if (it && it.tries < 1) { it.tries++; this.queue.unshift(it); }
        else if (it && it.tries < 2 && b !== "espeak" && this.espSt !== "failed" && this.backend !== "test") { it.tries++; it.viaEsp = true; this.queue.unshift(it); }
        if (this.fails[b] >= 3 && b === this.backend) this._fallback(b);
      } else this.fails[b] = 0;
    }
    if (!this.queue.length) this._idle();
    var self = this;
    if (err) setTimeout(function () { self._pump(); }, 150); else this._pump();
  },
  /* Очередь пуста: музыка громче; отложенное на время чтения — теперь. */
  _idle: function () {
    AE.setDuck(false);
    if (this.reading || this.noteReading) {
      this.reading = false; this.noteReading = false;
      var later = this.later, self = this; this.later = [];
      later.forEach(function (l) { self._chunk(l.text).forEach(function (p) { self.queue.push({ text: p, full: l.text, robot: l.robot, prio: l.prio || 1, key: "", t: Date.now(), ttl: l.keep ? 30000 : 0, tries: 0, keep: !!l.keep }); }); });
      if (later.length && LAB.showCaption) LAB.showCaption(later[later.length - 1].text);
    }
  },
  /* Синтезатор сбоит раз за разом — говорит другой. */
  _fallback: function (b) {
    if (b === "android") this.bridgeBad = true;
    else if (b === "web") this.webBad = true;
    else return;
    this.fails[b] = 0;
    this.choose();
    try { console.warn("[Лаборатория] речь: синтезатор " + b + " сбоит, теперь — " + this.backend); } catch (e) { /* */ }
  },
  _pump: function () {
    if (this.speaking || !this.queue.length) return;
    var now = Date.now();
    while (this.queue.length && this.queue[0].ttl && now - this.queue[0].t > this.queue[0].ttl) { this.queue.shift(); this.dropped++; }
    if (!this.queue.length) { this._idle(); if (!this.queue.length) return; }
    var item = this.queue[0], self = this;
    var useEsp = this.backend === "espeak" || (item.robot && settings.robotVoice && this.espSt === "ready") || (item.viaEsp && this.backend !== "test");
    if (useEsp && this.espSt !== "ready") {
      if (this.espSt === "failed") {
        if (this.backend === "espeak") { this.backend = this.hasWeb() && !this.webBad ? "web" : this.hasBridge() && !this.bridgeBad ? "android" : "none"; }
        if (item.viaEsp) { this.queue.shift(); this.dropped++; this._pump(); return; }
        useEsp = false;
      } else {
        this.loadESpeak();
        /* голос робота, пока eSpeak грузится, — обычным голосом; остальное ждёт загрузки (и проверяем снова) */
        if (this.backend !== "espeak" && !item.viaEsp) useEsp = false;
        else { clearTimeout(this.espWait); this.espWait = setTimeout(function () { self._pump(); }, 600); return; }
      }
    }
    this.queue.shift();
    this.speaking = true;
    AE.setDuck(true);
    var id = "u" + (++this.seq), backend = useEsp ? "espeak" : this.backend;
    this.cur = { id: id, text: item.text, full: item.full, prio: item.prio, item: item, t0: now, started: false, backend: backend };
    this._arm(id, item.text, false);
    if (useEsp) {
      var buf = this.espBuffer(item.text, item.robot);
      if (!buf) { this._done(true); return; }
      this.cur.started = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () { if (self.cur && self.cur.id === id) self._done(true); }, buf.duration * 1000 + 2500);
      var src = AE.ctx.createBufferSource(); src.buffer = buf;
      var node = src;
      if (item.robot) {
        /* голос робота: кольцевая модуляция и узкая полоса */
        var mod = AE.ctx.createGain(); mod.gain.value = 0;
        var car = AE.ctx.createOscillator(); car.frequency.value = 55; car.connect(mod.gain); car.start();
        var bp = AE.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 0.7;
        src.connect(mod); mod.connect(bp); node = bp;
        src.addEventListener("ended", function () { try { car.stop(); } catch (e) { /* */ } });
        var dry = AE.ctx.createGain(); dry.gain.value = 0.55; src.connect(dry); dry.connect(AE.voice);
      }
      node.connect(AE.voice);
      src.onended = function () { if (self.cur && self.cur.id === id) self._done(); };
      this.espSrc = src;
      try { src.start(); } catch (e) { this._done(true); }
      return;
    }
    if (backend === "test" && this.testEngine) { try { this.testEngine.speak(item.text, id); } catch (e) { this._done(true); } return; }
    if (backend === "android") {
      try { window.LabTTS.speak(item.text, +settings.rate || 1, +settings.voiceVol, id); } catch (e) { this._done(true); }
      return;
    }
    if (backend === "web") {
      try {
        this.webUsed = true;
        var u = new SpeechSynthesisUtterance(item.text);
        if (this.webVoice) { u.voice = this.webVoice; u.lang = this.webVoice.lang; } else u.lang = "ru-RU";
        u.rate = +settings.rate || 1; u.volume = Math.min(1, +settings.voiceVol);
        u.onstart = function () { self._keepAliveOn(); self._started(id); };
        u.onend = function () { if (self.cur && self.cur.id === id) self._done(); };
        u.onerror = function (ev) {
          if (!self.cur || self.cur.id !== id) return;
          /* «перебито»/«отменено» — это мы сами остановили; иначе сбой */
          var er = ev && ev.error;
          self._done(!(er === "interrupted" || er === "canceled"));
        };
        setTimeout(function () { try { window.speechSynthesis.speak(u); } catch (e) { self._done(true); } }, 20);
      } catch (e) { this._done(true); }
      return;
    }
    this._done(true);
  },
  _keepAliveOn: function () {
    if (this.keepAlive) return;
    var isChrome = /Chrome\//.test(navigator.userAgent) && !/Edg\//.test(navigator.userAgent) && !/Android/.test(navigator.userAgent);
    if (!isChrome) return;
    this.keepAlive = setInterval(function () {
      try { if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) { window.speechSynthesis.pause(); window.speechSynthesis.resume(); } } catch (e) { /* */ }
    }, 9000);
  },
  _stopKeepAlive: function () { if (this.keepAlive) { clearInterval(this.keepAlive); this.keepAlive = null; } },
  /* заглушить синтезатор (очередь при этом не трогается) */
  _silence: function () {
    if (this.espSrc) { try { this.espSrc.onended = null; this.espSrc.stop(); } catch (e) { /* */ } this.espSrc = null; }
    if (this.backend === "test" && this.testEngine) { try { this.testEngine.stop(); } catch (e) { /* */ } }
    if (this.hasBridge()) { try { window.LabTTS.stop(); } catch (e) { /* */ } }
    /* голос браузера трогаем, только если он говорил: на компьютере за ним стоит
       SAPI Windows, и лишний «стоп» на каждом действии игрока ему ни к чему */
    if (this.hasWeb() && (this.webUsed || this.backend === "web")) { try { window.speechSynthesis.cancel(); } catch (e) { /* */ } }
  },
  /* оборвать текущую фразу, очередь оставить (перед срочным) */
  _cut: function () {
    this.speaking = false; this.cur = null;
    clearTimeout(this.timer); this.timer = null;
    this._stopKeepAlive();
    this._silence();
  },
  stop: function (keepDuck) {
    this.queue = [];
    this.reading = false; this.noteReading = false;
    var was = this.speaking;
    this._cut();
    if (!keepDuck || !was) AE.setDuck(false);
  },
  /* Игра вернулась на экран: фраза, оборванная фоном, — ещё раз; очередь — дальше. */
  resume: function () {
    var self = this, cur = this.cur;
    if (!cur) { this._pump(); return; }
    setTimeout(function () {
      if (self.cur !== cur || !self.speaking) return;
      if (!self._engineBusy() && Date.now() - cur.t0 > 1500) {
        var it = cur.item;
        self._cut();
        if (it) self.queue.unshift(it);
        self._pump();
      }
    }, 700);
  },
  /* Окно записки закрыли: чтение обрывается и не продолжается; отложенное
     на время чтения забывается — кроме важного (keep): оно прозвучит, когда
     игрок замрёт. */
  endNote: function () {
    var self = this, now = Date.now(), keepL = this.later.filter(function (l) { return l.keep; });
    this.later = [];
    this.stop();
    keepL.forEach(function (l) {
      self._chunk(l.text).forEach(function (p) { if (!self.held.some(function (h) { return h.text === p; })) self.held.push({ text: p, full: l.text, robot: l.robot, prio: l.prio || 1, key: "", t: now, ttl: 30000, tries: 0, keep: true }); });
    });
    if (this.held.length) this._armHeld();
  },
  /* Тишина: четыре пальца вниз. Отложенное тоже забывается. */
  hush: function () { this.later = []; this.held = []; clearTimeout(this.heldTimer); this.heldTimer = null; this.stop(); },
  busy: function () { return this.speaking || this.queue.length > 0; },
  /* Самопроверка очереди (tests/sound.test.js): поддельный синтезатор — порядок
     по важности, повторы, устаревшее, повтор после сбоя, сторож зависания,
     записка и ответ на действие игрока. */
  selfTest: function () {
    var self = this, out = [], spoken = [], mode = { fail: 0, hang: false };
    var saved = { backend: this.backend, speech: settings.speech, eng: this.testEngine, esp: this.espSt, ttl: this.TTL, user: this.userUntil };
    settings.speech = true; this.hush(); this.userUntil = 0;
    this.testEngine = {
      speak: function (text, id) {
        if (mode.fail > 0) { mode.fail--; setTimeout(function () { if (self.cur && self.cur.id === id) self._done(true); }, 5); return; }
        spoken.push(text); self._started(id);
        if (mode.hang) return;
        setTimeout(function () { if (self.cur && self.cur.id === id) self._done(); }, 15);
      },
      stop: function () { }, busy: function () { return mode.hang; }
    };
    this.backend = "test"; this.estScale = 0.02; this.espSt = "failed";
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var has = function (t) { return spoken.some(function (s) { return s.indexOf(t) >= 0; }); };
    var at = function (t) { for (var i = 0; i < spoken.length; i++) if (spoken[i].indexOf(t) >= 0) return i; return -1; };
    var reset = function () { self.hush(); spoken.length = 0; mode.fail = 0; mode.hang = false; };
    return Promise.resolve().then(function () {
      reset();
      self.say("Событие один.", { interrupt: false }); self.say("Событие два.", { interrupt: false }); self.say("Опасность!", { prio: "urgent" });
      return wait(250);
    }).then(function () {
      out.push([has("Опасность") && has("Событие два") && at("Опасность") < at("Событие два"), "речь: срочное — раньше ждущих событий, события не потеряны"]);
      reset();
      self.say("Повтор.", { interrupt: false }); self.say("Повтор.", { interrupt: false }); self.say("Повтор.", { interrupt: false });
      return wait(200);
    }).then(function () {
      out.push([spoken.filter(function (s) { return s.indexOf("Повтор") >= 0; }).length === 1, "речь: одно и то же подряд не повторяется"]);
      reset(); self.TTL = { 0: 40, 1: 40 }; mode.hang = true;
      self.say("Длинная фраза.", { interrupt: false }); self.say("Старое событие.", { interrupt: false });
      return wait(120);
    }).then(function () {
      mode.hang = false; if (self.cur) self._done(); self.TTL = saved.ttl;
      return wait(100);
    }).then(function () {
      out.push([!has("Старое событие"), "речь: устаревшее событие не звучит"]);
      reset(); mode.fail = 1;
      self.say("Со второго раза.");
      return wait(500);
    }).then(function () {
      out.push([has("Со второго раза"), "речь: фраза после сбоя синтезатора повторена"]);
      reset(); mode.hang = true; var h0 = self.hangs;
      self.say("Зависшая фраза."); self.say("Следом.", { interrupt: false });
      return wait(600).then(function () { mode.hang = false; return wait(500); }).then(function () {
        out.push([self.hangs > h0 && has("Следом"), "речь: зависшая фраза не держит очередь (сторож сработал " + (self.hangs - h0) + " раз)"]);
      });
    }).then(function () {
      reset();
      self.say("Записка. Текст записки до конца.", { note: true }); self.say("Событие во время записки.", { interrupt: false });
      return wait(400);
    }).then(function () {
      out.push([has("Текст записки") && has("Событие во время записки") && at("Текст записки") < at("Событие во время записки"), "речь: записка дочитывается, событие звучит после неё"]);
      reset(); mode.hang = true;
      /* новое действие — это новый жест игрока */
      self.user();
      self.say("Ответ один."); self.say("Хвост.", { interrupt: false }); mode.hang = false; self.user(); self.say("Ответ два.");
      return wait(250);
    }).then(function () {
      out.push([has("Ответ два") && !has("Хвост"), "речь: ответ на новое действие отменяет недосказанное"]);
      reset();
      /* одна реакция на один жест: итог действия, а следом меню — звучат оба, по порядку */
      self.user();
      self.say("Итог действия."); self.say("Меню. Пункт первый.");
      return wait(400);
    }).then(function () {
      out.push([has("Итог действия") && has("Меню. Пункт первый") && at("Итог действия") < at("Меню. Пункт первый"), "речь: итог действия не обрывается меню, открытым тем же жестом"]);
      reset(); mode.hang = true;
      self.say("Длинный ответ.");
      self.say("ОКО: высылаю ремонтника.", { prio: "event", keep: true });
      self.say("Простое событие.", { interrupt: false });
      self.userAct(); mode.hang = false;
      return wait(1800);
    }).then(function () {
      out.push([has("высылаю ремонтника") && !has("Простое событие"), "речь: сообщение ОКО, оборванное действием игрока, прозвучало, когда игрок замер"]);
    }).then(function () {
      self.hush();
      self.testEngine = saved.eng; self.backend = saved.backend; self.espSt = saved.esp; self.estScale = 1; self.TTL = saved.ttl;
      settings.speech = saved.speech; self.userUntil = saved.user;
      return { checks: out };
    });
  }
};
LAB.Speech = Speech;
LAB.say = function (t, o) { Speech.say(t, o); };

/* ════════ ИСТОРИЯ ОБЪЯВЛЕНИЙ ════════
   Объявление ОКО прозвучало, пока вы бежали, — его можно переслушать.
   В историю попадает важное: громкая связь ОКО, кто вышел и откуда,
   срочные предупреждения. Точка — назад, к прошлым объявлениям (первое
   нажатие — самое свежее), запятая — вперёд; на телефоне — четыре пальца
   влево и вправо. */
var History = {
  list: [], pos: -1, MAX: 40,
  add: function (text) {
    text = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (!text) return;
    var last = this.list[this.list.length - 1];
    if (last && last.text === text && Date.now() - last.t < 4000) return;
    this.list.push({ text: text, t: Date.now() });
    if (this.list.length > this.MAX) this.list.shift();
    this.pos = -1;
  },
  ago: function (t) {
    var s = Math.round((Date.now() - t) / 1000);
    if (s < 15) return "Только что";
    if (s < 60) return (Math.round(s / 5) * 5) + " секунд назад";
    var m = Math.round(s / 60);
    if (m === 1) return "Минуту назад";
    var n10 = m % 10, n100 = m % 100;
    return m + (n10 === 1 && n100 !== 11 ? " минуту" : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? " минуты" : " минут") + " назад";
  },
  show: function (dir) {
    var n = this.list.length;
    if (!n) { Speech.say("Объявлений пока не было.", { hist: true }); return; }
    if (this.pos < 0) this.pos = n - 1;
    else {
      var to = this.pos + (dir < 0 ? -1 : 1);
      if (to < 0) { if (LAB.UI) LAB.UI.error(); Speech.say("Это самое раннее объявление. Всего " + n + ".", { hist: true }); return; }
      if (to >= n) { if (LAB.UI) LAB.UI.error(); Speech.say("Это последнее объявление.", { hist: true }); return; }
      this.pos = to;
    }
    var it = this.list[this.pos];
    Speech.say(it.text + " " + this.ago(it.t) + ", " + (this.pos + 1) + " из " + n + ".", { hist: true });
  },
  clear: function () { this.list = []; this.pos = -1; }
};
LAB.history = History;

/* ════════ ИНТЕРФЕЙСНЫЕ СИГНАЛЫ ════════ */
/* Сигналы интерфейса звучат через единый обработчик (LAB.Sound, sound.js). */
var UI = {
  blip: function (f, d, v) {
    if (!LAB.Sound) return;
    LAB.Sound.tone(f || 880, d || 0.08, { vol: v == null ? 0.12 : v, attack: 0.01 });
  },
  /* тон с панорамой и задержкой: мелодии звуковых замков (звучат и при выключенных эффектах — это головоломка) */
  tone: function (f, d, pan, v, when) {
    if (!LAB.Sound) return;
    LAB.Sound.tone(f, d, { type: "triangle", pan: pan, vol: v == null ? 0.2 : v, when: when, attack: 0.015, hold: true, force: true });
  },
  /* запись сигнала, а пока её нет в памяти — тон (запись тем временем грузится) */
  rec: function (id, fb) {
    var Snd = LAB.Sound;
    if (Snd && Snd.has(id) && Snd.ready(id)) return Snd.play(id, { bus: "ui" });
    if (Snd && Snd.has(id)) Snd.preload([id]);
    if (fb) fb();
    return null;
  },
  click: function () { var self = this; this.rec("ui_click", function () { self.blip(700, 0.06, 0.06); }); },
  move: function () { var self = this; this.rec("ui_move", function () { self.blip(760, 0.05, 0.08); }); },
  open: function () { var self = this; this.rec("ui_open", function () { self.blip(520, 0.1, 0.1); setTimeout(function () { self.blip(780, 0.1, 0.1); }, 90); }); },
  close: function () { var self = this; this.rec("ui_close", function () { self.blip(600, 0.08, 0.09); setTimeout(function () { self.blip(400, 0.1, 0.09); }, 80); }); },
  ok: function () { var self = this; this.rec("ui_ok", function () { self.blip(990, 0.12, 0.12); }); },
  error: function () { var self = this; this.rec("ui_error", function () { self.blip(260, 0.16, 0.09); setTimeout(function () { self.blip(180, 0.2, 0.08); }, 110); }); },
  fanfare: function () { var self = this; this.rec("ui_levelup", function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { self.blip(f, 0.18, 0.12); }, i * 130); }); }); }
};
LAB.UI = UI;

/* ════════ СУБТИТРЫ ЗВУКОВ ════════ */
var subTimer = null;
LAB.sub = function (text) {
  var el = document.getElementById("subText");
  if (!el) return;
  if (!settings.subtitles) { el.hidden = true; return; }
  el.textContent = text; el.hidden = false; clearTimeout(subTimer);
  subTimer = setTimeout(function () { el.hidden = true; }, 4000);
};

/* ════════ МУЗЫКА: генеративная, у каждого уровня свой тон ════════ */
var Music = {
  sfx: null, timers: [], current: null,
  start: function (theme, root) {
    if (this.current === theme && this.sfx) return;
    this.stop();
    if (!settings.music || !AE.ensure()) return;
    this.current = theme;
    var s = new SFX(AE.music); this.sfx = s;
    if (theme === "battle") this.buildBattle(s, root || 82);
    else if (theme === "prologue") this.buildPrologue(s);
    else this.buildLevel(s, root || 110, theme);
  },
  stop: function () {
    this.timers.forEach(function (t) { clearInterval(t); }); this.timers = [];
    if (this.sfx) { this.sfx.stop(1.5); this.sfx = null; }
    this.current = null;
  },
  pad: function (s, freq, when, dur, vol, cut) {
    var o1 = s.osc("sawtooth", freq), o2 = s.osc("sawtooth", freq * 1.006), f = s.filter("lowpass", cut, 0.6), g = s.gain(0);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(s.out()); s.send(g, 0.45);
    g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + dur * 0.35);
    g.gain.setValueAtTime(vol, when + dur * 0.65); g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o1.start(when); o2.start(when); o1.stop(when + dur + 0.15); o2.stop(when + dur + 0.15);
  },
  pluck: function (s, freq, when, vol, pan) {
    var o = s.osc("triangle", freq), g = s.gain(0);
    o.connect(g);
    if (pan && s.ctx.createStereoPanner) { var p = s.ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(s.out()); s.nodes.push(p); }
    else g.connect(s.out());
    s.send(g, 0.55);
    g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    o.start(when); o.stop(when + 1.8);
  },
  buildPrologue: function (s) {
    var CH = [[110, 164.81, 220, 261.63], [87.31, 130.81, 174.61, 220], [98, 146.83, 196, 233.08], [82.41, 123.47, 164.81, 207.65]];
    var ci = 0, self = this;
    var chord = function () {
      if (s.stopped) return;
      var t = s.ctx.currentTime + 0.05, ch = CH[ci % CH.length];
      ch.forEach(function (f, i) { self.pad(s, f, t, 7.4, [0.05, 0.04, 0.045, 0.03][i], 800); });
      self.pluck(s, ch[2] * 2, t + 1.2, 0.05, -0.5); self.pluck(s, ch[3] * 2, t + 3.4, 0.04, 0.5);
      ci++;
    };
    chord(); this.timers.push(setInterval(chord, 6400));
  },
  buildBattle: function (s, root) {
    var t0 = s.ctx.currentTime, o1 = s.osc("sawtooth", root / 2), o2 = s.osc("sawtooth", root / 2 * 1.01), f = s.filter("lowpass", 260, 1.2), g = s.gain(0);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(s.out()); o1.start(); o2.start();
    g.gain.setTargetAtTime(0.08, t0, 1.2); s.lfo(0.35, 90, f.frequency);
    var beat = 0;
    this.timers.push(setInterval(function () {
      if (s.stopped) return;
      s.thump(beat % 2 ? 0.3 : -0.3, 0.38);
      if (beat % 4 === 0) s.note(root, 0, 0.18, "square", 0.06);
      if (beat % 4 === 2) s.note(root * 0.75, 0, 0.18, "square", 0.05);
      if (beat % 8 === 7) s.note(root * 4, 0, 0.1, "square", 0.03);
      beat++;
    }, 460));
  },
  buildLevel: function (s, r, theme) {
    /* минорные пэды и редкие металлические ноты; глубже — темнее и ниже */
    var self = this, cut = 500 + r * 3;
    var chords = [[r / 2, r, r * 6 / 5, r * 3 / 2], [r * 9 / 16, r * 9 / 8, r * 27 / 20, r * 27 / 16], [r * 2 / 3, r * 4 / 3, r * 8 / 5, r * 2]];
    var ci = 0, cur = chords[0];
    var chord = function () {
      if (s.stopped) return;
      cur = chords[ci % chords.length]; ci++;
      var t = s.ctx.currentTime + 0.05;
      cur.forEach(function (f, i) { self.pad(s, f, t, 11, [0.04, 0.035, 0.03, 0.02][i], cut); });
    };
    chord();
    this.timers.push(setInterval(chord, 10500));
    this.timers.push(setInterval(function () {
      if (s.stopped || Math.random() > 0.5) return;
      var t = s.ctx.currentTime + 0.05;
      self.pluck(s, cur[1 + Math.floor(Math.random() * 3)] * (Math.random() < 0.3 ? 4 : 2), t, 0.035, Math.random() * 1.6 - 0.8);
    }, 2300));
  }
};
LAB.Music = Music;
})();
