/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — единый обработчик звука (LAB.Sound).

   Все звуки игры проходят через него: записи и их варианты, звуки в точке
   этажа, петли (гул уровня, помещения, слой событий, сердце), музыка,
   синтез и сигналы интерфейса. Обработчик

   • держит одно звуковое устройство (AudioContext) живым: будит его после
     ухода игры в фон, звонка, касания и нажатия клавиши, а если устройство
     сломалось — пересоздаёт и заново запускает всё, что должно звучать;
   • следит за числом голосов: у каждой шины свой предел, одинаковых
     звуков одновременно — не больше трёх; при нехватке уступает самый
     старый и самый неважный звук, а важный (выстрел, попадание, шаг,
     сигнал меню) не теряется;
   • не теряет звук, которого ещё нет в памяти: запись грузится и звучит,
     как только готова, — если ещё не поздно (шаг через секунду не нужен);
   • не копит звуки, пока устройство спит: проснувшись, игра не выпаливает
     их разом;
   • ведёт петли по именам: петля, которая должна звучать, но замолчала,
     запускается снова сама;
   • выгружает длинные записи из памяти, только когда они точно не нужны.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, AE = LAB.AE, Bank = LAB.Bank, S = LAB.settings;

var MOBILE = /Android|iPhone|iPad|iPod/i.test((navigator && navigator.userAgent) || "");
/* пределы голосов: на телефоне меньше — иначе треск и пропуски */
var LIMIT = { total: MOBILE ? 40 : 64, fx: MOBILE ? 24 : 40, amb: 8, ui: 32, beacon: 8, music: 4, voice: 4 };
/* одинаковых звуков сразу — не больше трёх; ноты мелодии (тоны) ставятся
   в расписание пачкой — им свой предел */
var PER_ID = 3, PER_ID_OF = { tone: 32, synth: 8 };
/* сколько ждать загрузки записи, прежде чем звук станет ненужным, мс */
var WAIT = { ui: 350, fx: 500, beacon: 700, voice: 1500, amb: 2500, music: 4000 };

var voices = [];      /* звучащие: { id, bus, prio, t0, end, h } */
var pend = [];        /* ждут записи или пробуждения: { id, o, due, t } */
var slots = {};       /* петли по именам */
var lastReq = {};     /* когда звук просили в последний раз — для выгрузки */
var wakeHooks = [];   /* кому сказать, что устройство пересоздано */
var st = { played: 0, dropped: 0, stolen: 0, late: 0, queued: 0, revived: 0, wakes: 0, rebuilt: 0, errors: 0 };
var asleepSince = 0, wakeTries = 0, timer = null;
/* пересоздавать устройство — только если оно уже работало и сломалось, не чаще
   раза в минуту и не больше трёх раз: устройство, которое не заводится вовсе
   (нет вывода звука), пересоздание не лечит, а частое — губит память */
var everRan = false, rebuilds = 0, lastRebuild = 0;
var quiet = false; /* тишина без загрузок — для самопроверки обхода этажей */
function isLong(id) { var d = LAB.SND && LAB.SND[id]; return !!(d && d.o && d.o.long); }

function now() { return Date.now(); }
function ctxOk() { var ok = !!(AE.ctx && AE.ctx.state === "running"); if (ok) everRan = true; return ok; }
function busOf(id, o) { var d = Bank.defs[id]; return o.bus || (d && d.bus) || "fx"; }

/* Важность звука: 3 — ответ на действие игрока и интерфейс, 2 — враг рядом,
   шаги и маяки, 1 — фон и прочее. Уступает всегда менее важный. */
function prioOf(id, o, bus) {
  if (o.prio != null) return o.prio;
  if (bus === "ui" || bus === "voice") return 3;
  if (/^(w_|hurt_|player_|hit_|card_|keypad|code_|bump_|door_threshold|explosion|impact_|pick_|ui_|nav_|near_|oko_|cam_spot|turret_lock)/.test(id)) return 3;
  if (/^step_|_step$/.test(id) || bus === "beacon") return 2;
  if (/_(attack|shoot|alert|aim|death|hurt)$|^foe_shot|^turret_|^robot_|^mutant_/.test(id)) return 2;
  return 1;
}

/* ── голоса ── */
function gc() {
  var t = now();
  for (var i = voices.length - 1; i >= 0; i--) {
    var v = voices[i];
    if (!v.h || v.h.stopped || (v.end && t > v.end)) voices.splice(i, 1);
  }
}
function count(fn) { var n = 0; for (var i = 0; i < voices.length; i++) if (fn(voices[i])) n++; return n; }
/* Освободить место: снять самый неважный и самый старый звук, если он не
   важнее нового. Нет такого — новый звук не звучит. */
function steal(pred, prio) {
  var best = -1;
  for (var i = 0; i < voices.length; i++) {
    var v = voices[i];
    if (!pred(v) || v.loop || v.prio > prio) continue;
    if (best < 0 || v.prio < voices[best].prio || (v.prio === voices[best].prio && v.t0 < voices[best].t0)) best = i;
  }
  if (best < 0) return false;
  try { voices[best].h.stop(0.04); } catch (e) { /* */ }
  voices.splice(best, 1);
  st.stolen++;
  return true;
}
function room(id, bus, prio) {
  gc();
  if (count(function (v) { return v.id === id; }) >= (PER_ID_OF[id] || PER_ID) && !steal(function (v) { return v.id === id; }, prio)) return false;
  if (count(function (v) { return v.bus === bus; }) >= (LIMIT[bus] || LIMIT.fx) && !steal(function (v) { return v.bus === bus; }, prio)) return false;
  if (voices.length >= LIMIT.total && !steal(function () { return true; }, prio)) return false;
  return true;
}
function track(id, bus, prio, h, o) {
  if (!h) return h;
  var dur = (h.dur || 2) * 1000 + (o.delay || 0) * 1000 + 150;
  voices.push({ id: id, bus: bus, prio: prio, t0: now(), end: o.loop ? 0 : now() + dur, h: h, loop: !!o.loop });
  return h;
}

/* ── пробуждение устройства ── */
function wake() {
  var c = AE.ensure();
  if (!c) return false;
  if (c.state === "running") { asleepSince = 0; wakeTries = 0; return true; }
  if (!asleepSince) asleepSince = now();
  wakeTries++; st.wakes++;
  try { var p = c.resume(); if (p && p.then) p.then(function () { if (ctxOk()) { asleepSince = 0; wakeTries = 0; flush(); } }, function () { /* */ }); } catch (e) { /* */ }
  return false;
}
/* Устройство сломалось (закрыто или не просыпается) — новое, и всё, что
   должно звучать, звучит снова. Записи в памяти годятся и новому устройству. */
function rebuild(closed) {
  if (!AE.rebuild || !everRan) return;
  /* закрытое устройство пересоздаём всегда (не чаще раза в две секунды);
     «не просыпается» — не больше трёх раз и не чаще раза в минуту */
  if (closed ? now() - lastRebuild < 2000 : (rebuilds >= 3 || now() - lastRebuild < 60000)) return;
  rebuilds++; lastRebuild = now();
  st.rebuilt++;
  voices = [];
  AE.rebuild();
  asleepSince = 0; wakeTries = 0;
  for (var k in slots) { if (slots[k]) { slots[k].h = null; slots[k].loading = false; } }
  wakeHooks.forEach(function (fn) { LAB.safe(fn); });
  reviveSlots(true);
}

/* ── записи, которых ещё нет в памяти ── */
function flush() {
  if (!pend.length) return;
  var t = now(), keep = [];
  var list = pend; pend = [];
  list.forEach(function (p) {
    if (t > p.due) { st.late++; return; }
    if (!ctxOk() || !Bank.ready(p.id)) { keep.push(p); return; }
    var o = p.o, waited = (t - p.t) / 1000;
    if (o.delay) { o = copy(o); o.delay = Math.max(0, o.delay - waited); }
    start(p.id, o);
  });
  pend = pend.concat(keep);
}
function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

/* Сыграть сразу (запись уже в памяти, устройство не спит). */
function start(id, o) {
  var bus = busOf(id, o), prio = prioOf(id, o, bus);
  if (!room(id, bus, prio)) { st.dropped++; return null; }
  var h = null;
  try { h = Bank.play(id, o); } catch (e) { st.errors++; h = null; }
  if (h) { st.played++; track(id, bus, prio, h, o); }
  return h;
}

/* ════ Сыграть запись ════
   o: как у Bank.play (pan, gain, lp, rate, delay, loop, bus, reverb, at,
   variant, fadeIn) и ещё prio (0–3), wait (сколько ждать загрузки, мс),
   fb (синтез, если записи нет или она ещё не в памяти). */
function play(id, o) {
  o = o || {};
  if (quiet) return null;
  var bus = busOf(id, o);
  if (!S.effects && bus !== "voice") return null;
  if (!Bank.has(id)) { if (o.fb) synth(o.fb, o.fbms || 1600, bus, o.pan, o.gain); return null; }
  lastReq[id] = now();
  var awake = ctxOk() || wake();
  if (awake && Bank.ready(id)) return start(id, o);
  /* записи нет в памяти или устройство спит: синтез сразу, если есть, — иначе
     запись подождёт, но только пока звук ещё к месту */
  Bank.preload([id], flush);
  if (o.fb && awake) { synth(o.fb, o.fbms || 1600, bus, o.pan, o.gain); return null; }
  var prio = prioOf(id, o, bus);
  if (!awake && prio < 3 && bus !== "music" && bus !== "amb") { st.dropped++; return null; }
  var wait = o.wait != null ? o.wait : (WAIT[bus] || WAIT.fx);
  pend.push({ id: id, o: o, t: now(), due: now() + wait });
  if (pend.length > 48) { pend.shift(); st.late++; }
  st.queued++;
  return null;
}

/* ════ Петли по именам ════
   loop("bed", "amb_l3", {...}) — в ячейке «bed» звучит эта запись; та же
   запись — ничего не меняется; другая — прежняя затихает. Ручка петли
   (stop, setGain) остаётся верной, даже если петлю пришлось запустить
   заново. Нет такой записи — null (звучит синтез). */
function loop(name, id, o) {
  if (quiet) return null;
  o = copy(o || {});
  o.loop = true;
  if (!Bank.has(id)) return null;
  var s = slots[name];
  if (s && s.id === id && s.want) {
    if (o.gain != null && s.gain !== o.gain) s.handle.setGain(o.gain);
    return s.handle;
  }
  if (s) stopSlot(s, o.xfade != null ? o.xfade : 1.5);
  s = { name: name, id: id, o: o, want: true, h: null, loading: false, gain: o.gain == null ? 1 : o.gain };
  s.handle = {
    id: id, slot: name, stopped: false,
    stop: function (f) { s.handle.stopped = true; if (slots[name] === s) delete slots[name]; stopSlot(s, f); },
    setGain: function (v, tc) { s.gain = v; s.o.gain = v; if (s.h && s.h.setGain) s.h.setGain(v, tc); }
  };
  slots[name] = s;
  lastReq[id] = now();
  runSlot(s, false);
  return s.handle;
}
function runSlot(s, revive) {
  if (!s.want) return;
  /* выключенные звуки или музыка — петля ждёт, сторож запустит её, когда включат */
  if (busOf(s.id, s.o) === "music" ? !S.music : !S.effects) return;
  var o = copy(s.o);
  if (revive) o.fadeIn = 0.8;
  if (ctxOk() && Bank.ready(s.id)) {
    s.h = start(s.id, o);
    if (revive && s.h) st.revived++;
    return;
  }
  if (!ctxOk()) wake();
  if (s.loading) return;
  s.loading = true;
  Bank.preload([s.id], function () {
    s.loading = false;
    if (slots[s.name] !== s || !s.want) { if (isLong(s.id)) release(s.id, 500); return; }
    if (ctxOk() && Bank.ready(s.id)) { s.h = start(s.id, o); if (revive && s.h) st.revived++; }
  });
}
function stopSlot(s, f) {
  s.want = false;
  if (s.h) { try { s.h.stop(f == null ? 1 : f); } catch (e) { /* */ } }
  s.h = null;
}
function stopLoop(name, f) { var s = slots[name]; if (s) s.handle.stop(f); }
/* Петля, которая должна звучать, но замолчала, — запускается снова. */
function reviveSlots(force) {
  for (var k in slots) {
    var s = slots[k];
    if (!s || !s.want || s.loading) continue;
    if (force || !s.h || s.h.stopped) runSlot(s, true);
  }
}

/* ════ Синтез и тоны — через тот же учёт голосов ════ */
function synth(fn, ms, bus, pan, gain) {
  if (!S.effects || !AE.ensure()) return null;
  var b = typeof bus === "string" ? bus : "fx";
  if (!room("synth", b, 1)) { st.dropped++; return null; }
  var s = LAB.synth(fn, ms, typeof bus === "string" ? AE[bus] : bus, pan, gain);
  if (s) voices.push({ id: "synth", bus: b, prio: 1, t0: now(), end: now() + (ms || 1500) + 200, h: { stop: function () { s.stop(0.05); }, stopped: false } });
  return s;
}
/* Короткий тон: f (Гц), d (с), o: { type, pan, vol, when, bus, attack }. */
function tone(f, d, o) {
  o = o || {};
  var bus = o.bus || "ui";
  if (bus !== "ui" && !S.effects) return null;
  if (bus === "ui" && !S.effects && !o.force) return null;
  if (!ctxOk() && !wake()) return null;
  if (!room("tone", bus, o.prio == null ? 3 : o.prio)) { st.dropped++; return null; }
  var c = AE.ctx, t = c.currentTime + (o.when || 0), osc = c.createOscillator(), g = c.createGain(), out = g;
  osc.type = o.type || "sine"; osc.frequency.value = f || 880; osc.connect(g);
  if (o.pan && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); out = p; }
  out.connect(AE[bus] || AE.ui);
  var v = o.vol == null ? 0.12 : o.vol, at = o.attack || 0.012;
  d = d || 0.08;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + at);
  if (o.hold) g.gain.setValueAtTime(v, t + d * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  try { osc.start(t); osc.stop(t + d + 0.05); } catch (e) { return null; }
  var h = { stopped: false, stop: function () { if (h.stopped) return; h.stopped = true; try { osc.stop(); } catch (e) { /* */ } } };
  osc.onended = function () { h.stopped = true; try { g.disconnect(); } catch (e) { /* */ } };
  voices.push({ id: "tone", bus: bus, prio: o.prio == null ? 3 : o.prio, t0: now(), end: now() + ((o.when || 0) + d) * 1000 + 120, h: h });
  return h;
}

/* Особый звук со своей схемой (тоны головоломки и т. п.): build(ctx, шина)
   строит узлы и возвращает функцию остановки. Учитывается как петля —
   его не снимают ради других звуков. */
function custom(id, bus, build) {
  if (!ctxOk() && !wake() && !AE.ctx) return null;
  var stopFn = null;
  try { stopFn = build(AE.ctx, AE[bus] || AE.ui); } catch (e) { st.errors++; return null; }
  var h = { stopped: false, stop: function () { if (h.stopped) return; h.stopped = true; if (stopFn) LAB.safe(stopFn); } };
  voices.push({ id: id, bus: bus, prio: 3, t0: now(), end: 0, h: h, loop: true });
  return h;
}

/* ════ Память ════
   Выгрузить запись, когда она точно не нужна: не звучит, не стоит в петле
   и её не просили последние несколько секунд. */
function release(id, ms, tries) {
  if (!id) return;
  var t0 = now();
  setTimeout(function () {
    if ((lastReq[id] || 0) > t0 - 50) return; /* снова просили — нужна */
    for (var k in slots) if (slots[k] && slots[k].id === id && slots[k].want) return;
    gc();
    for (var i = 0; i < voices.length; i++) if (voices[i].id === id) return;
    for (var j = 0; j < pend.length; j++) if (pend[j].id === id) return;
    /* запись ещё грузится — выгрузить, когда догрузится, иначе она останется в памяти */
    var d = Bank.defs[id], loading = !!(d && d.f.some(function (f) { return Bank.pend[f]; }));
    if (loading && (tries || 0) < 30) { release(id, 1000, (tries || 0) + 1); return; }
    Bank.release([id]);
  }, ms == null ? 4000 : ms);
}

/* ════ Сторож ════ раз в секунду: разбудить уснувшее устройство (если игра
   на экране), пересоздать сломанное, снять отзвучавшие голоса, запустить
   замолчавшие петли и выбросить опоздавшие звуки. */
function tick() {
  if (!AE.ctx) return;
  var c = AE.ctx, hidden = typeof document !== "undefined" && document.hidden;
  if (c.state === "closed") { rebuild(true); return; }
  if (c.state !== "running") {
    if (!hidden) {
      wake();
      /* не просыпается дольше восьми секунд — пересоздать */
      if (asleepSince && now() - asleepSince > 8000 && wakeTries > 6) rebuild();
    }
  } else { asleepSince = 0; wakeTries = 0; }
  gc();
  if (ctxOk()) { reviveSlots(false); flush(); }
  else if (pend.length) { var t = now(); pend = pend.filter(function (p) { if (t > p.due) { st.late++; return false; } return true; }); }
}
function startWatch() {
  if (timer) return;
  timer = setInterval(function () { LAB.safe(tick); }, 1000);
  var poke = function () { if (AE.ctx && AE.ctx.state !== "running") wake(); };
  try {
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { wake(); setTimeout(function () { LAB.safe(tick); }, 400); } });
    window.addEventListener("focus", poke);
    window.addEventListener("pageshow", poke);
    ["pointerdown", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, poke, true); });
  } catch (e) { /* */ }
}

/* Остановить всё (выход в меню или из игры). Петли тоже. */
function stopAll(f) {
  for (var k in slots) if (slots[k]) stopSlot(slots[k], f);
  slots = {};
  voices.forEach(function (v) { try { v.h.stop(f == null ? 0.2 : f); } catch (e) { /* */ } });
  voices = []; pend = [];
}

LAB.Sound = {
  play: play, loop: loop, stopLoop: stopLoop, synth: synth, tone: tone, custom: custom, release: release, stopAll: stopAll,
  has: function (id) { return Bank.has(id); }, ready: function (id) { return Bank.ready(id); },
  preload: function (ids, done) { Bank.preload(ids, done); },
  wake: wake, tick: tick,
  /* тишина без загрузок (самопроверка обходит сотни этажей подряд) */
  setQuiet: function (q) { quiet = !!q; if (quiet) stopAll(0.05); },
  isQuiet: function () { return quiet; },
  /* все файлы записи не загрузились насовсем — у петли пора включать синтез */
  dead: function (id) { var d = Bank.defs[id]; return !!(d && d.f.length && d.f.every(function (f) { return Bank.bad[f]; })); },
  onRebuild: function (fn) { wakeHooks.push(fn); },
  slot: function (name) { return slots[name] ? slots[name].handle : null; },
  /* что творится со звуком — для самопроверки и отладки */
  state: function () {
    gc();
    var sl = {}; for (var k in slots) if (slots[k]) sl[k] = { id: slots[k].id, on: !!(slots[k].h && !slots[k].h.stopped), loading: slots[k].loading };
    return { ctx: AE.ctx ? AE.ctx.state : "none", voices: voices.length, pending: pend.length, slots: sl, stats: copy(st) };
  },
  LIMIT: LIMIT,
  /* для проверки: оборвать источник петли, как при сбое (ячейка об этом не знает) */
  _breakSlot: function (name) { var s = slots[name]; if (s && s.h && s.h.src) { try { s.h.src.stop(); } catch (e) { /* */ } } }
};
/* Android: приложение вернулось на экран — разбудить звук и речь. */
window.labResume = function () {
  LAB.safe(function () { wake(); setTimeout(function () { LAB.safe(tick); }, 500); });
  LAB.safe(function () { if (LAB.Speech && LAB.Speech.resume) LAB.Speech.resume(); });
};
startWatch();
})();
