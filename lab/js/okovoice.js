/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — свой голос ОКО.
   ОКО говорит записанным голосом, а не синтезатором игры: мужским или
   женским — на выбор в настройках («Голос ОКО»); можно вернуть и прежний
   синтезатор. Записи — sounds/oko/m и sounds/oko/f, имя файла — отпечаток
   текста реплики (FNV-1a, восемь знаков); что записано — oko_voiced.js,
   его собирает конвейер tools/okovoice. Реплику без записи (с номером этажа
   или названием помещения, или ещё не озвученную) говорит синтезатор, как
   прежде. Текст реплики уходит в историю объявлений и в субтитры.
   В записи уже есть механика, второй голос в глубине и эхо; здесь — облик
   глубины (okoforms.js): ОКО из-под земли глуше, настоящее ОКО в Отражении
   далёкое, Зрачок — вплотную, то слева, то справа, и голосом другого пола,
   шёпот Истока — тихо и сухо. И изредка — сбой программы: заикание,
   выпадение звука с цифровой кашей, зажёванная плёнка, обрывок чужой реплики
   из старого громкоговорителя, плывущий голос; перед зловещими словами —
   обратное эхо, после — ответный шёпот, под словами о пульсе — сердце.
   Сбои и шёпот выключаются в настройках («Сбои и шёпот в голосе ОКО»).
   Женский голос говорит о себе в женском роде (oko_fem.js).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function S() { return LAB.settings || {}; }
var R = Math.random;

/* ── какой голос и что записано ── */
function voice() { var v = S().okoVoice; return v === "f" || v === "tts" ? v : "m"; }
function norm(t) { return String(t == null ? "" : t).replace(/\s+/g, " ").trim(); }
function key(t) {
  t = norm(t);
  var h = 0x811c9dc5;
  for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ("0000000" + h.toString(16)).slice(-8);
}
var sets = {};
function list(v) {
  if (sets[v]) return sets[v];
  var s = {}, src = LAB.OKO_VOICED && LAB.OKO_VOICED[v];
  String(src || "").split(/\s+/).forEach(function (k) { if (k) s[k] = 1; });
  return (sets[v] = s);
}
function has(t, v) { v = v || voice(); return v !== "tts" && !!list(v)[key(t)]; }
function fem(t) {
  var M = LAB.OKO_FEM;
  return voice() === "f" && M && Object.prototype.hasOwnProperty.call(M, t) ? M[t] : t;
}
/* «ОКО по громкой связи: «…»» — сами слова ОКО */
function quote(text) {
  var i = text.indexOf(": «");
  return i >= 0 && text.charAt(text.length - 1) === "»" ? text.slice(i + 3, -1) : null;
}

/* ── облик глубины: как звучит запись ── */
var side = 1;
function look(chime) {
  var F = LAB.okoForms, f = F && F.cur ? F.cur() : { id: "oko", t: 0 };
  var id = chime === "pupil" ? "pupil" : f.id, t = f.t || 0;
  switch (id) {
    case "far": return { lp: Math.round(3600 - 1700 * t), rv: 0.3 + 0.25 * t, g: 0.92 - 0.15 * t };
    case "garden": return { lp: 6500, rv: 0.3, g: 0.95 };
    case "twin": return { lp: 2400, rv: 0.55, g: 0.78 };
    case "pupil": side = -side; return { lp: 0, rv: 0, g: 1, pan: side * 0.6 };
    case "city": return { lp: 0, rv: 0.25, g: 1 };
    case "whisper": return { lp: 5200, rv: 0, g: 0.8 - 0.25 * t };
  }
  return { lp: 0, rv: 0.18, g: 1 };
}
function okoGain() { var v = S().okoVol; return v == null ? 1 : Math.max(0, Math.min(1, +v)); }

/* ── сбои и шёпот: что добавить к этой реплике ── */
/* тревоги и приказы машинам — без обрывов: в них важно каждое слово */
var URGENT = /^(alarm|complex|local|sealed|robots|boss|strike_go|backup|post|squad|grinder|check|turret_hack|mines_order|oko_trap)$/;
var OMEN = /^(taunt|quiet|idle|floor|secret|lost|kill|kill_many|low_hp|hurt|revive|mutate|wait|normal|zone|vault|music)$/;
var WH = [
  { id: "nositel", re: /носител/i }, { id: "dveri", re: /двер/i },
  { id: "zabyvat", re: /забыва|забуд/i }, { id: "posle", re: /после вас/i }
];
function extras(q, kind, chime) {
  if (!S().okoFx) return {};
  var deep = LAB.okoForms && LAB.okoForms.cur ? LAB.okoForms.cur() : { id: "oko" };
  var urgent = URGENT.test(kind || ""), ex = {};
  if (R() < 1 / 12) ex.glitch = urgent ? "stutter" : ["stutter", "stutter", "drop", "drop", "tape"][Math.floor(R() * 5)];
  if (!urgent && !ex.glitch && deep.id !== "whisper" && chime !== "pupil" && R() < 1 / 28) ex.misfire = true;
  if (!urgent && OMEN.test(kind || "") && R() < 1 / 5) ex.swell = true;
  if (!urgent && (kind === "taunt" || kind === "kill_many" || kind === "grinder_more") && !ex.glitch && R() < 1 / 6) ex.wobble = true;
  if (/пульс|сердц|сердеч/i.test(q) && R() < 0.5) ex.heart = true;
  for (var i = 0; i < WH.length; i++) if (WH[i].re.test(q)) { if (R() < 1 / 3) ex.whisper = WH[i].id; break; }
  return ex;
}

/* ── работа с записью: копия с правкой ── */
function ctx() { return LAB.AE && LAB.AE.ctx; }
function bufOf(id) { var B = LAB.Bank, d = B && B.defs[id]; return d && d.f.length && B.bufs[d.f[0]] || null; }
function derive(buf, n, fn) {
  var c = ctx(), out = c.createBuffer(buf.numberOfChannels, Math.max(1, n), buf.sampleRate);
  for (var ch = 0; ch < buf.numberOfChannels; ch++) fn(buf.getChannelData(ch), out.getChannelData(ch), buf.sampleRate);
  return out;
}
/* временные записи сбоев — под постоянными именами: одна реплика ОКО звучит за раз */
function temp(name, buf) {
  var B = LAB.Bank, file = "oko/fx/" + name;
  if (!B.has(name)) B.def(name, [file], { bus: "voice", vary: 0 });
  B.bufs[file] = buf;
  return name;
}
function fade(a, s, e, ms, sr) {
  var k = Math.min(Math.floor((e - s) / 2), Math.floor(sr * ms / 1000));
  for (var i = 0; i < k; i++) { var g = i / k; a[s + i] *= g; a[e - 1 - i] *= g; }
}
/* «Е-Е-Единица»: первый слог дважды */
function stutter(buf) {
  var sr = buf.sampleRate, p = Math.floor(sr * 0.09), gp = Math.floor(sr * 0.018), lead = 2 * (p + gp);
  return derive(buf, buf.length + lead, function (a, o) {
    for (var r = 0; r < 2; r++) { var at = r * (p + gp); for (var i = 0; i < p; i++) o[at + i] = a[i]; fade(o, at, at + p, 1, sr); }
    o.set(a, lead);
  });
}
/* выпадение звука со щелчком и цифровая каша дальше по фразе */
function drop(buf) {
  return derive(buf, buf.length, function (a, o, sr) {
    o.set(a);
    var s = Math.floor(a.length * 0.46), e = Math.min(a.length, s + Math.floor(sr * 0.07)), i;
    for (i = s; i < e; i++) o[i] = 0;
    for (i = 0; i < Math.floor(sr * 0.004) && s + i < a.length; i++) o[s + i] += (R() * 2 - 1) * 0.2 * (1 - i / (sr * 0.004));
    var c0 = Math.floor(a.length * 0.7), c1 = Math.min(a.length, c0 + Math.floor(sr * 0.18)), hold = 6, q = 16;
    for (i = c0; i < c1; i++) o[i] = Math.round(a[c0 + Math.floor((i - c0) / hold) * hold] * q) / q;
  });
}
/* зажёванная плёнка: конец фразы тянется вниз и обрывается */
function tape(buf, keep) {
  var sr = buf.sampleRate, n = Math.floor(buf.length * (keep || 0.72)), tl = Math.min(n, Math.floor(sr * 0.32)), head = n - tl;
  var pos = [], p = 0, step = 0;
  while (p < tl - 1) { pos.push(p); step++; p += 1 - 0.7 * Math.min(1, step / (tl * 2)); }
  return derive(buf, head + pos.length, function (a, o) {
    for (var i = 0; i < head; i++) o[i] = a[i];
    for (var j = 0; j < pos.length; j++) {
      var x = head + pos[j], i0 = Math.floor(x), fr = x - i0;
      o[head + j] = (a[i0] * (1 - fr) + a[Math.min(a.length - 1, i0 + 1)] * fr) * (1 - 0.4 * j / pos.length);
    }
  });
}
/* голос плывёт, как на растянутой плёнке, — со второй половины фразы */
function wobble(buf) {
  return derive(buf, buf.length, function (a, o, sr) {
    var s = Math.floor(a.length * 0.5), w = 2 * Math.PI * 5.5 / sr, dm = 0.0016 * sr;
    for (var i = 0; i < a.length; i++) {
      var dep = i < s ? 0 : (i - s) / (a.length - s) * dm, x = i - dep * (1 + Math.sin(w * i)) / 2;
      var i0 = Math.max(0, Math.floor(x)), fr = x - i0;
      o[i] = a[i0] * (1 - fr) + a[Math.min(a.length - 1, i0 + 1)] * fr;
    }
  });
}
/* обратное эхо: хвост первых слов, развёрнутый назад, нарастает в реплику */
function swell(buf) {
  var sr = buf.sampleRate, h = Math.min(buf.length, Math.floor(sr * 1.0)), n = h + Math.floor(sr * 0.6);
  var taps = [[40, 0.55], [75, 0.45], [120, 0.36], [180, 0.28], [260, 0.2], [360, 0.14], [480, 0.09]];
  return derive(buf, n, function (a, o) {
    var w = new Float32Array(n), i, k;
    for (k = 0; k < taps.length; k++) { var d = Math.floor(sr * taps[k][0] / 1000); for (i = 0; i < h; i++) w[d + i] += a[i] * taps[k][1]; }
    var y = 0, al = 1 - Math.exp(-2 * Math.PI * 3000 / sr);
    for (i = 0; i < n; i++) { y += al * (w[n - 1 - i] - y); var g = i / n; o[i] = y * g * g * 0.35; }
  });
}
/* старый громкоговоритель: только середина голоса, с хрипом */
function horn(buf, sec) {
  var sr = buf.sampleRate, n = Math.min(buf.length, Math.floor(sr * sec));
  return derive(buf, n, function (a, o) {
    var lo = 0, hi = 0, aH = 1 - Math.exp(-2 * Math.PI * 450 / sr), aL = 1 - Math.exp(-2 * Math.PI * 2800 / sr);
    for (var i = 0; i < n; i++) { lo += aH * (a[i] - lo); var x = a[i] - lo; hi += aL * (x - hi); o[i] = Math.tanh(hi * 2.2) / 2.2; }
  });
}
/* треск эфира перед обрывком */
function crackle(sec) {
  var c = ctx(), sr = c.sampleRate, n = Math.floor(sr * sec), b = c.createBuffer(1, n, sr), o = b.getChannelData(0), on = 1, y = 0;
  for (var i = 0; i < n; i++) { if (i % 120 === 0) on = R() > 0.35 ? 1 : 0; y += 0.35 * ((R() * 2 - 1) - y); o[i] = (R() * 2 - 1 - y) * 0.18 * on * Math.min(1, i / (sr * 0.004), (n - i) / (sr * 0.004)); }
  return b;
}
/* сердце носителя: тук-тук, всё чаще */
function heartBuf(sec) {
  var c = ctx(), sr = c.sampleRate, n = Math.floor(sr * sec), b = c.createBuffer(1, n, sr), o = b.getChannelData(0), t = 0;
  while (t < sec - 0.4) {
    [[0, 1], [0.17, 0.6]].forEach(function (p) {
      var i0 = Math.floor((t + p[0]) * sr), m = Math.floor(sr * 0.14);
      for (var i = 0; i < m && i0 + i < n; i++) { var tt = i / sr; o[i0 + i] += (Math.sin(2 * Math.PI * 52 * tt) + 0.45 * Math.sin(2 * Math.PI * 104 * tt)) * Math.exp(-tt * 34) * p[1] * 0.2; }
    });
    t += 60 / (66 + 38 * t / sec);
  }
  return b;
}

/* ── сыграть ── */
var cur = null; /* звучащие части реплики — для тишины по жесту */
function playPart(id, o) {
  var h = LAB.Sound.play(id, o);
  if (h && cur) cur.push(h);
  return h;
}
function stop() { (cur || []).forEach(function (h) { try { h.stop(0.08); } catch (e) { /* */ } }); cur = []; }
function start(v, k, q, opts, chime) {
  var id = "oko_" + v + "_" + k, L = look(chime), g = L.g * okoGain();
  var base = { bus: "voice", vary: 0, prio: 3, gain: g, lp: L.lp || 0, reverb: L.rv, pan: L.pan || 0, wait: 6000 };
  var buf = bufOf(id);
  cur = [];
  if (!buf || !ctx() || S().lite) { playPart(id, base); LAB.Bank.preload([id]); return; }
  var ex = extras(q, opts && opts.okoKind, chime), lead = 0, main = buf, o;
  if (ex.misfire) {
    var other = pickLoaded(v, k);
    if (other) {
      playPart(temp("oko_fx_crack", crackle(0.14)), copy(base, { gain: g * 0.9, reverb: 0 }));
      var frag = tape(horn(other, Math.min(2.2, other.duration * 0.7)), 0.85);
      playPart(temp("oko_fx_horn", frag), copy(base, { delay: 0.14, gain: g * 0.8, lp: 0, reverb: 0.1 }));
      lead = 0.14 + frag.duration + 0.38;
    }
  }
  if (ex.swell) {
    var sw = swell(buf);
    playPart(temp("oko_fx_swell", sw), copy(base, { delay: lead }));
    lead += sw.duration;
  }
  if (ex.glitch === "stutter") main = stutter(buf);
  else if (ex.glitch === "drop") main = drop(buf);
  else if (ex.glitch === "tape") main = tape(buf);
  if (ex.wobble) main = wobble(main);
  o = copy(base, { delay: lead });
  if (main === buf) playPart(id, o); else playPart(temp("oko_fx_main", main), o);
  if (ex.heart) playPart(temp("oko_fx_heart", heartBuf(main.duration + 1.8)), copy(base, { delay: lead, gain: g, lp: 0, reverb: 0, pan: 0 }));
  if (ex.whisper) whisper(v, ex.whisper, lead + main.duration + 0.12, base, g);
}
function whisper(v, w, at, base, g) {
  var id = "oko_" + v + "_w_" + w;
  if (!((LAB.OKO_VOICED && LAB.OKO_VOICED.w && LAB.OKO_VOICED.w[v]) || "").split(/\s+/).some(function (x) { return x === w; })) return;
  if (!LAB.Bank.has(id)) LAB.Bank.def(id, ["oko/" + v + "/w_" + w + ".mp3"], { bus: "voice", vary: 0 });
  if (!LAB.Bank.ready(id)) { LAB.Bank.preload([id]); return; }
  var p = R() < 0.5 ? -0.65 : 0.65;
  playPart(id, copy(base, { delay: at, gain: g * 0.22, pan: p, lp: 3600, reverb: 0.2 }));
  /* через полсекунды отвечает другой — с другой стороны, тише и ниже */
  playPart(id, copy(base, { delay: at + 0.6, gain: g * 0.11, pan: -p, lp: 2500, rate: 0.89, reverb: 0.25 }));
}
/* другая записанная реплика этого голоса, уже в памяти — для обрывка */
function pickLoaded(v, k) {
  var keys = Object.keys(list(v)), tries = 12;
  while (tries-- > 0 && keys.length) {
    var k2 = keys[Math.floor(R() * keys.length)];
    if (k2 === k) continue;
    var b = bufOf("oko_" + v + "_" + k2);
    if (b && b.duration > 1.2) return b;
  }
  /* в память — на будущее: в следующий раз будет из чего выбрать */
  var k3 = keys[Math.floor(R() * keys.length)], id3 = "oko_" + v + "_" + k3;
  if (k3 && !LAB.Bank.has(id3)) LAB.Bank.def(id3, ["oko/" + v + "/" + k3 + ".mp3"], { bus: "voice", vary: 0 });
  if (k3) LAB.Bank.preload([id3]);
  return null;
}
function copy(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

/* ── вход: сказать реплику ОКО записью, если она есть ── */
/* Пока читается записка или глава, ОКО ждёт её конца (как и прежде его слова). */
function busy() { var Sp = LAB.Speech; return !!(Sp && Sp.noteBusy && Sp.noteBusy()); }
function play(text, opts, chime) {
  var v = voice();
  if (v === "tts" || !LAB.Bank || !LAB.Sound) return false;
  var q = quote(String(text || ""));
  if (q == null) return false;
  /* Зрачок — отражение ОКО: говорит голосом другого пола */
  if (chime === "pupil") v = v === "f" ? "m" : "f";
  if (!list(v)[key(q)]) return false;
  var k = key(q), id = "oko_" + v + "_" + k;
  if (!LAB.Bank.has(id)) LAB.Bank.def(id, ["oko/" + v + "/" + k + ".mp3"], { bus: "voice", vary: 0 });
  if (LAB.Speech && LAB.Speech.say) LAB.Speech.say(text, { prio: opts && opts.prio || "event", keep: true, recorded: true });
  if (busy()) {
    LAB.Bank.preload([id]);
    var t0 = Date.now(), wait = function () {
      if (!LAB.game || !LAB.game.entered) return;
      if (busy() && Date.now() - t0 < 30000) { setTimeout(wait, 500); return; }
      if (!busy()) start(v, k, q, opts, chime);
    };
    setTimeout(wait, 500);
    return true;
  }
  start(v, k, q, opts, chime);
  return true;
}

/* Образец голоса — в настройках, когда его выбирают: одна из записанных реплик, ровно,
   как только меню договорит название и описание голоса. */
var PREVIEW = "Я слушаю ваш пульс по вентиляции, носитель. Он учащается.", previewN = 0;
function preview(v) {
  stop();
  var n = ++previewN;
  if (v === "tts") return false;
  var k = list(v)[key(PREVIEW)] ? key(PREVIEW) : Object.keys(list(v))[0];
  if (!k || !LAB.Bank || !LAB.Sound) return false;
  var id = "oko_" + v + "_" + k, t0 = Date.now();
  if (!LAB.Bank.has(id)) LAB.Bank.def(id, ["oko/" + v + "/" + k + ".mp3"], { bus: "voice", vary: 0 });
  LAB.Bank.preload([id]);
  var go = function () {
    if (n !== previewN) return;
    var Sp = LAB.Speech;
    if (Sp && Sp.busy && Sp.busy() && Date.now() - t0 < 12000) { setTimeout(go, 250); return; }
    cur = [];
    playPart(id, { bus: "voice", vary: 0, prio: 3, gain: okoGain(), reverb: 0.18, wait: 4000 });
  };
  setTimeout(go, 400);
  return true;
}

LAB.okoVoice = {
  voice: voice, key: key, has: has, fem: fem, quote: quote, play: play, stop: stop, look: look, extras: extras, preview: preview,
  /* для проверок: свой генератор случайностей и сброс кеша списка записей */
  _rng: function (fn) { R = fn || Math.random; }, _reset: function () { sets = {}; }
};
})();
