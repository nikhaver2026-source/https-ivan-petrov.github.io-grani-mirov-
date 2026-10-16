/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — звуковой мир.
   Шаги по полу уровня (у каждого уровня свой), металлический удар о
   стену, двери, маяки вещей (у каждого рода вещей свой звук) и предметов
   обстановки, гул уровня и помещений, далёкие события комплекса, голоса
   и шаги врагов в пространстве (слева, справа, за спиной, за стеной),
   выстрелы, попадания, взрывы. Музыка — давящая: в главном меню своя,
   в игре своя на каждом уровне, в бою — напряжённее.
   Записи — из папки sounds (sounds.js); если записи нет, звучит синтез.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings, AE = LAB.AE, Bank = LAB.Bank;
function G() { return LAB.game && LAB.game.G; }
function CUR() { return LAB.game && LAB.game.CUR; }
function idx(x, y) { return y * LAB.W + x; }
var DIRV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

/* ── базовое: сыграть запись (или синтез) ── */
function has(id) { return Bank.has(id); }
function play(id, o) {
  o = o || {};
  if (!AE.ensure()) return null;
  if (has(id)) {
    var h = Bank.play(id, o);
    if (h) return h;
  }
  var fb = FB[id] || FB[id.replace(/_\d+$/, "")] || o.fb;
  if (fb) LAB.synth(fb, o.fbms || 1600, AE[o.bus || "fx"], o.pan || (o.at ? LAB.spatial(o.at.dx, o.at.dy, o.at.occ).pan : 0), o.gain == null ? 1 : o.gain);
  return null;
}
/* Сыграть в точке этажа: панорама, громкость, глушение за стеной и за спиной. */
function at(id, x, y, o) {
  o = o || {};
  var g = G(); if (!g) return play(id, o);
  var occ = false;
  try { occ = !LAB.los(CUR().fl, CUR().fs, g.x, g.y, x, y); } catch (e) { occ = false; }
  o.at = { dx: x - g.x, dy: y - g.y, occ: occ };
  return play(id, o);
}
function sub(t) { if (S.subtitles) LAB.sub(t); }

/* Длинные записи (музыка, фон уровня) — тоже из памяти, как все звуки: поток
   через <audio> в WebView Android молчит. Чтобы память не росла, длинная
   петля выгружается, когда её сменила другая (isLong — признак из sounds.js). */
function isLong(id) { var d = LAB.SND && LAB.SND[id]; return !!(d && d.o && d.o.long); }
function releaseLater(id, ms) {
  if (!id || !isLong(id)) return;
  setTimeout(function () {
    if ((mus.tid === id) || (bed && bed.id === id) || roomLid === id || evLayerId === id) return; /* снова нужна */
    Bank.release([id]);
  }, ms || 4000);
}
/* Петля из памяти; если запись ещё не загружена — загрузить и начать. */
function loop(id, o) {
  if (!has(id)) return null;
  o = o || {};
  o.loop = true;
  if (Bank.ready(id)) return Bank.play(id, o);
  /* запись ещё не в памяти: загрузить и начать, если петля всё ещё нужна */
  var px = { stopped: false, h: null,
    stop: function (f) { px.stopped = true; if (px.h) px.h.stop(f); },
    setGain: function (v) { if (px.h && px.h.setGain) px.h.setGain(v); } };
  Bank.preload([id], function () { if (!px.stopped) px.h = Bank.play(id, o); });
  return px;
}

/* ════════ ШАГИ, СТЕНЫ, ДВЕРИ ════════ */
var stepN = 0;
function step(surf, run, door) {
  stepN++;
  var id = "step_" + (surf || "plate");
  play(has(id) ? id : "step_plate", { gain: run ? 0.95 : 0.8, rate: run ? 1.04 : 1, pan: stepN % 2 ? -0.12 : 0.12, reverb: 0.18, bus: "fx" });
  if (door) play("door_threshold", { gain: 0.5 });
}
function bump() { play("bump_body", { gain: 0.8 }); }
/* Удар о стену: стены везде стальные, и звук всегда один и тот же — одна
   запись, без случайной высоты и без фильтра; только сторона (слева, справа). */
function bumpWall(dir) {
  var v = DIRV[dir] || [0, -1];
  play("bump_wall", { pan: v[0] * 0.5, gain: 0.95, variant: 0, vary: 0, reverb: 0.3 });
}
function bumpSoft(o) { play(o && (o.type === "terminal" || o.type === "vending" || o.type === "medst" || o.type === "charger" || o.type === "magnetron" || o.type === "positron") ? "bump_device" : "bump_furniture", { gain: 0.8 }); }
function near() { play("near_tick", { gain: 0.6, bus: "ui" }); }
function doorKind(d) { return d.kind === "heavy" ? "heavy" : d.kind === "hatch" ? "hatch" : d.kind === "rubble" ? "heavy" : d.kind === "secret" ? "secret" : "auto"; }
function doorOpen(d, byFoe) { at("door_" + doorKind(d) + "_open", d.x, d.y, { gain: byFoe ? 0.9 : 1 }); if (byFoe) sub("Где-то открылась дверь"); }
function doorClose(d) { at("door_" + doorKind(d) + "_close", d.x, d.y); }
function doorPass(d) { /* порог двери под ногой — уже в step */ }
function objUse(o) { /* звук конкретного действия — в меню предметов */ }
function container(type) { play({ crate: "open_crate", locker: "open_locker", safe: "open_safe", desk: "open_desk", corpse: "search_body" }[type] || "open_crate"); }
function stairs(down) { play(down ? "stairs_down" : "stairs_up", { gain: 1 }); }
function gate(down) { play("gate_open", { gain: 1 }); setTimeout(function () { play("gate_ride", { gain: 0.9, bus: "fx" }); }, 1800); }
function gateSeal() { play("gate_seal", { gain: 1 }); LAB.vib([120, 60, 220]); }
function elevRide(ms) { play("elev_ride", { gain: 0.9 }); setTimeout(function () { play("elev_ding"); }, Math.max(800, ms - 400)); }
function rest() { play("capsule_close"); setTimeout(function () { play("capsule_hum", { gain: 0.6 }); }, 600); }
function death() { play("player_death"); stopTension(); }
function npcHello(n) { if (n.robot) play("robot_hello", { gain: 0.8 }); else play("npc_hello", { gain: 0.7 }); }
function navPing(x, y) { at("nav_ping", x, y, { bus: "ui", gain: 0.9 }); }
function navStart(path) {
  if (!path || !path.length) return;
  var last = path[Math.min(path.length - 1, 5)];
  at("nav_ping", last[0], last[1], { bus: "ui", gain: 0.8 });
}
function pickup(kind) { play(has("pick_" + kind) ? "pick_" + kind : "pick_part", { bus: "ui", gain: 0.9 }); }
function setEvent(id) {
  eventLayer(id);
  if (id === "alarm") play("ev_alarm_start", { gain: 0.7 });
  if (id === "quake") { play("ev_quake", { gain: 1 }); LAB.vib([200, 100, 300]); }
}

/* ════════ МАЯКИ ════════
   Каждая вещь на полу звучит своим маяком: чем ближе, тем чаще и громче;
   за стеной и за спиной — глуше. Предметы обстановки — тоже: лестницы,
   лифт, шлюз, терминалы, установки, торговые терминалы, мастерские. */
var beaconT = null, nextPing = {};
var OBJ_BEACON = { stairs_down: "bcn_stairs", stairs_up: "bcn_stairs_up", elevator: "bcn_elevator", gate_down: "bcn_gate", reactor: "bcn_reactor",
  terminal: "bcn_terminal", magnetron: "bcn_magnetron", positron: "bcn_positron", capsule: "bcn_capsule", vending: "bcn_vending", workbench: "bcn_workbench",
  medst: "bcn_medst", charger: "bcn_charger", implantlab: "bcn_implantlab", hq: "bcn_hq", safe: "bcn_safe" };
var OBJ_RANGE = { stairs_down: 16, stairs_up: 10, gate_down: 18, elevator: 12, reactor: 20 };
function beaconTick() {
  var g = G(), cur = CUR();
  if (!g || !LAB.game.entered || LAB.game.paused || !cur || !cur.fl || !S.beacons || !S.effects) return;
  if (LAB.ui && LAB.ui.layer()) return;
  var jam = LAB.combat && LAB.combat.jammed();
  var now = Date.now(), src = [];
  LAB.game.floorItems().forEach(function (it) {
    var d = Math.abs(it.x - g.x) + Math.abs(it.y - g.y);
    if (d === 0 || d > 11) return;
    src.push({ key: "i" + it.id, id: "bcn_" + LAB.game.itemKind(it), x: it.x, y: it.y, d: d, max: 11 });
  });
  cur.fl.objs.forEach(function (o) {
    var b = OBJ_BEACON[o.type]; if (!b) return;
    if (o.type === "safe" && LAB.game.objState(o).open) return;
    var max = OBJ_RANGE[o.type] || 9;
    var d = Math.abs(o.x - g.x) + Math.abs(o.y - g.y);
    if (d === 0 || d > max) return;
    src.push({ key: "o" + o.id, id: b, x: o.x, y: o.y, d: d, max: max, obj: true });
  });
  cur.fl.npcs.forEach(function (n) {
    var d = Math.abs(n.x - g.x) + Math.abs(n.y - g.y);
    if (d === 0 || d > 10) return;
    src.push({ key: "n" + n.id, id: n.robot ? "bcn_robot_npc" : "bcn_survivor", x: n.x, y: n.y, d: d, max: 10 });
  });
  src.sort(function (a, b) { return a.d - b.d; });
  src.slice(0, 6).forEach(function (s) {
    if (nextPing[s.key] && nextPing[s.key] > now) return;
    var k = s.d / s.max;
    var gap = 700 + k * 2600 + (s.obj ? 600 : 0);
    nextPing[s.key] = now + gap * (0.9 + Math.random() * 0.2);
    at(has(s.id) ? s.id : "bcn_default", s.x, s.y, { bus: "beacon", gain: (jam ? 0.35 : 1) * (1.1 - k * 0.55), lp: jam ? 1200 : null, reverb: 0.12 });
  });
}

/* ════════ ФОН: уровень, помещения, события ════════ */
var bed = null, roomLoop = null, roomLoopId = "", roomLid = "", corrLoop = null, evTimer = null, evLayer = null, evLayerId = "", hbLoop = null, tension = null, worldOn = false;
var ROOM_LOOP = {
  server: "room_server", comms: "room_radio", genhall: "room_generator", transformer: "room_transformer", magnetron_hall: "room_magnetron", switchboard: "room_electric",
  cable: "room_electric", powerdesk: "room_hum", cryohall: "room_cryo", freezer: "room_cryo", samples: "room_cryo", compressor: "room_compressor", thaw: "room_drip",
  greenhouse: "room_drip", tankfarm: "room_bubbles", mycelium: "room_drip", pumps: "room_pumps", compost: "room_bubbles", vivarium: "room_creatures", incubator: "room_incubator",
  sequencer: "room_server", embryo: "room_incubator", genelab: "room_bubbles", assembly: "room_factory", parts: "room_hum", range: "room_hum", ailab: "room_server", charging: "room_electric",
  repair: "room_factory", ring: "room_ring", detector: "room_ring", accdesk: "room_server", targetroom: "room_ring", vacuum: "room_compressor", reactorhall: "room_reactor",
  containment: "room_magnetron", chiefdesk: "room_server", bastion: "room_server", annihilation: "room_reactor", reactor: "room_reactor", kitchen: "room_fridge", canteen: "room_fridge",
  laundry: "room_drip", showers: "room_drip", wintergarden: "room_fountain", medbay: "room_medical", medpost: "room_medical", surgery: "room_medical", isolator: "room_medical",
  lift: "room_elevator", gate: "room_gate", gatein: "room_gate", stair: "room_stairwell", testbench: "room_hum", arsenal: "room_hum", ballistics: "room_server", armorlab: "room_factory"
};
var EVENTS_L = {
  1: ["ev_metal_groan", "ev_vent_rattle", "ev_far_door", "ev_far_scream", "ev_pipe_knock", "ev_robot_far", "ev_drip"],
  2: ["ev_metal_groan", "ev_far_scream", "ev_skitter", "ev_far_door", "ev_vent_rattle", "ev_cry", "ev_pipe_knock"],
  3: ["ev_drip", "ev_bubbles", "ev_rustle", "ev_far_roar", "ev_pipe_knock", "ev_steam"],
  4: ["ev_far_roar", "ev_far_scream", "ev_skitter", "ev_glass", "ev_metal_groan", "ev_heart"],
  5: ["ev_robot_far", "ev_servo", "ev_factory_clank", "ev_metal_groan", "ev_far_door", "ev_alarm_far"],
  6: ["ev_electric", "ev_transformer", "ev_robot_far", "ev_metal_groan", "ev_far_boom"],
  7: ["ev_ice_crack", "ev_steam", "ev_far_roar", "ev_metal_groan", "ev_wind"],
  8: ["ev_far_shots", "ev_far_boom", "ev_robot_far", "ev_alarm_far", "ev_metal_groan"],
  9: ["ev_ring_whine", "ev_electric", "ev_phase", "ev_far_boom", "ev_metal_groan"],
  10: ["ev_rift_pulse", "ev_phase", "ev_far_roar", "ev_metal_groan", "ev_far_boom", "ev_whisper"]
};
/* Записи уровня: голоса его врагов, его пол, его далёкие события.
   Записи прошлого уровня выгружаются — память телефона не резиновая. */
var levelIds = [], levelL = 0;
function idsFor(L) {
  var lev = LAB.LEVELS[L], out = [], sets = {};
  var foes = lev.foes.slice();
  if (L < LAB.LEVELS_N) LAB.LEVELS[L + 1].foes.forEach(function (f) { if (LAB.FOES[f].kind === "mech") foes.push(f); });
  foes.forEach(function (f) { sets[LAB.FOES[f].snd] = 1; });
  if (lev.boss && LAB.BOSSES[lev.boss]) sets[LAB.BOSSES[lev.boss].snd] = 1;
  if (sets.labmut || sets.roach) sets.rat = 1;
  var all = Object.keys(LAB.SND || {});
  all.forEach(function (id) {
    var m = id.match(/^([a-z]+)_(idle|alert|attack|hurt|death|step)$/);
    if (m && sets[m[1]]) out.push(id);
  });
  out.push("step_" + lev.surf);
  (EVENTS_L[L] || []).forEach(function (id) { out.push(id); });
  return out;
}
function preloadLevel(L) {
  if (L === levelL) return;
  var need = idsFor(L);
  var drop = levelIds.filter(function (id) { return need.indexOf(id) < 0; });
  if (drop.length) Bank.release(drop);
  levelIds = need; levelL = L;
  Bank.preload(need);
}
function enterFloor(L, F) {
  worldOn = true;
  var lev = LAB.LEVELS[L];
  preloadLevel(L);
  if (!bed || bed.L !== L) {
    var oldBed = bed && bed.id;
    if (bed && bed.h) bed.h.stop(2.5);
    var bid = lev.amb;
    bed = { L: L, id: bid, h: loop(bid, { bus: "amb", gain: 0.9, fadeIn: 3, reverb: 0 }) };
    if (oldBed && oldBed !== bid) releaseLater(oldBed, 3500);
    if (!bed.h) synthBed(L);
  }
  if (!beaconT) beaconT = setInterval(function () { LAB.safe(beaconTick); }, 220);
  if (!evTimer) scheduleEvent();
  AE.setReverb(1.4 + L * 0.08, 0.3 + L * 0.015);
  music("game");
}
var synthBedS = null;
function synthBed(L) {
  if (synthBedS) { synthBedS.stop(2); synthBedS = null; }
  if (!AE.ensure()) return;
  /* синтезированный гул уровня: низкий шум, гул вентиляции, ниже с глубиной */
  var s = new LAB.SFX(AE.amb);
  var n = s.noise("brown", 4, true), f = s.filter("lowpass", 180 - L * 8, 0.7), gN = s.gain(0.0001);
  n.connect(f); f.connect(gN); gN.connect(s.out()); n.start();
  gN.gain.setTargetAtTime(0.35, s.ctx.currentTime, 2);
  var o = s.osc("sine", 38 + (10 - L) * 2), go = s.gain(0.0001); o.connect(go); go.connect(s.out()); o.start();
  go.gain.setTargetAtTime(0.05 + L * 0.006, s.ctx.currentTime, 3);
  s.lfo(0.07, 60, f.frequency);
  synthBedS = s;
}
function setRoom(r) {
  var id = r ? (ROOM_LOOP[r.type] || "") : "corridor";
  if (id === roomLoopId) return;
  roomLoopId = id;
  var prevLid = roomLid;
  if (roomLoop) { roomLoop.stop(1.2); roomLoop = null; }
  var lid = !id ? "" : id === "corridor" ? "room_corridor" : id;
  roomLid = lid;
  /* гул прошлого помещения — из памяти (коридор остаётся: в него выходят часто) */
  if (prevLid && prevLid !== lid && prevLid !== "room_corridor") releaseLater(prevLid, 3000);
  if (!id) { AE.setReverb(1.2 + (G() ? G().L : 1) * 0.08, 0.28); return; }
  roomLoop = loop(lid, { bus: "amb", gain: 0.55, fadeIn: 1.2, reverb: 0.1 });
  /* отзвук: коридор — длинный, большие залы — гулкие, тесные — сухие */
  if (r) {
    var size = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
    AE.setReverb(0.8 + size * 0.06, 0.18 + Math.min(0.25, size * 0.01));
  } else AE.setReverb(2.2, 0.38);
}
function scheduleEvent() {
  clearTimeout(evTimer);
  var g = G();
  var gap = 7000 + Math.random() * 14000 - (g ? g.L * 400 : 0);
  evTimer = setTimeout(function () {
    evTimer = null;
    if (!worldOn) return;
    var g2 = G();
    if (g2 && LAB.game.entered && !LAB.game.paused && !(LAB.ui && LAB.ui.layer())) {
      var pool = EVENTS_L[g2.L] || EVENTS_L[1];
      var id = pool[Math.floor(Math.random() * pool.length)];
      var ang = Math.random() * Math.PI * 2, dist = 6 + Math.random() * 10;
      play(id, { at: { dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist, occ: true }, bus: "amb", gain: 0.8 + Math.random() * 0.4, reverb: 0.5, rate: 0.9 + Math.random() * 0.2 });
    }
    scheduleEvent();
  }, Math.max(4000, gap));
}
function eventLayer(id) {
  var want = { alarm: "evl_alarm", dark: "evl_dark", surge: "evl_surge", steam: "evl_steam", quake: "evl_quake" }[id] || "";
  if (want === evLayerId) return;
  var prevEv = evLayerId;
  evLayerId = want;
  if (evLayer) { evLayer.stop(2); evLayer = null; }
  if (prevEv && prevEv !== want) releaseLater(prevEv, 3500);
  if (want) evLayer = loop(want, { bus: "amb", gain: 0.5, fadeIn: 2 });
}
function stopWorld() {
  worldOn = false;
  var bedId = bed && bed.id;
  if (bed && bed.h) bed.h.stop(1.5);
  bed = null;
  if (bedId) releaseLater(bedId, 2500);
  if (synthBedS) { synthBedS.stop(1.5); synthBedS = null; }
  if (roomLoop) { roomLoop.stop(1); roomLoop = null; }
  roomLoopId = ""; roomLid = "";
  if (evLayer) { evLayer.stop(1); evLayer = null; } evLayerId = "";
  clearInterval(beaconT); beaconT = null;
  clearTimeout(evTimer); evTimer = null;
  stopTension();
  if (hbLoop) { hbLoop.stop(0.5); hbLoop = null; }
}

/* ── напряжение боя и сердце на последнем издыхании ── */
var combatLvl = 0;
function combatLevel(n) {
  if (n === combatLvl) { heartCheck(); return; }
  combatLvl = n;
  if (n > 0 && !tension) startTension();
  if (n === 0 && tension) stopTension();
  if (tension && tension.g) tension.g.gain.setTargetAtTime(n >= 2 ? 0.11 : 0.06, AE.ctx.currentTime, 0.8);
  heartCheck();
}
function startTension() {
  if (!AE.ensure() || !S.music) return;
  var s = new LAB.SFX(AE.music);
  var g = s.gain(0.0001); g.connect(s.out());
  var root = 55 * Math.pow(2, -((G() ? G().L : 1) - 1) / 24);
  var o1 = s.osc("sawtooth", root), o2 = s.osc("sawtooth", root * 1.059), f = s.filter("lowpass", 220, 2);
  o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start();
  s.lfo(0.25, 120, f.frequency);
  g.gain.setTargetAtTime(0.06, s.ctx.currentTime, 1);
  var beat = 0;
  s.every(560, 560, function () { beat++; s.thump(beat % 2 ? 0.25 : -0.25, beat % 4 === 0 ? 0.42 : 0.26); if (beat % 8 === 6) s.note(root * 4, 0, 0.25, "square", 0.025); });
  tension = { s: s, g: g };
}
function stopTension() { if (tension) { tension.s.stop(1.6); tension = null; } combatLvl = 0; }
function heartCheck() {
  var g = G(); if (!g) return;
  var low = g.hp > 0 && g.hp < g.hpMax * 0.3;
  if (low && !hbLoop) hbLoop = loop("heartbeat", { bus: "fx", gain: 0.6, reverb: 0 });
  if (!low && hbLoop) { hbLoop.stop(1); hbLoop = null; }
}

/* ════════ ВРАГИ ════════ */
var lastFoeSound = {};
function foeSet(f) { return f.snd || "drone"; }
function foeSound(f, kind) {
  var now = Date.now(), key = f.id + kind;
  if (kind === "idle" && lastFoeSound[key] && now - lastFoeSound[key] < 3000) return;
  lastFoeSound[key] = now;
  var set = foeSet(f);
  var id = set + "_" + kind;
  var generic = {
    alert: f.kind === "mech" ? "robot_alert" : "mutant_alert", attack: f.kind === "mech" ? "robot_attack" : "mutant_attack", idle: f.kind === "mech" ? "robot_idle" : "mutant_idle",
    shoot: "foe_shot_" + (f.adt === "energy" ? "energy" : f.adt === "shock" ? "shock" : f.adt === "chem" ? "spit" : f.adt === "therm" ? "cold" : "phys"), aim: "foe_aim",
    radio: "robot_radio", dodge: "robot_dodge", retreat: "robot_retreat", repair: "robot_repair", shield_up: "shield_up", shield_break: "shield_break", shield_hit: "shield_hit_foe",
    summon: f.kind === "mech" ? "robot_summon" : "mutant_summon", blink_out: "phase_out", blink_in: "phase_in", mine_set: "mine_set", mortar_fire: "mortar_fire", hurt: f.kind === "mech" ? "robot_hurt" : "mutant_hurt"
  };
  if (!has(id)) id = generic[kind] || id;
  at(id, f.x, f.y, { gain: kind === "idle" ? 0.7 : 1, rate: f.boss ? 0.85 : 1 });
  if (kind === "alert") sub((f.name || "Враг").split(",")[0] + " заметил вас");
}
function foeStep(f) {
  if (Math.random() < 0.35 && f.kind === "bio" && !/rat|roach|micro/.test(f.type)) return;
  var id = f.kind === "mech" ? (has(f.snd + "_step") ? f.snd + "_step" : "robot_step") : (has(f.snd + "_step") ? f.snd + "_step" : "mutant_step");
  at(id, f.x, f.y, { gain: f.boss ? 1 : 0.65, rate: f.boss ? 0.8 : 1 });
}
function foeHit(f, dt, dmg, crit) { at(f.kind === "mech" ? "hit_metal" : "hit_flesh", f.x, f.y, { gain: crit ? 1.2 : 0.9 }); if (Math.random() < 0.5) foeSound(f, "hurt"); }
function foeDeath(f) {
  var id = foeSet(f) + "_death";
  at(has(id) ? id : (f.kind === "mech" ? "robot_death" : "mutant_death"), f.x, f.y, { gain: 1.1, rate: f.boss ? 0.8 : 1 });
  if (f.kind === "mech") at("debris", f.x, f.y, { gain: 0.7, delay: 0.25 });
  sub((f.name || "").split(",")[0] + " — повержен");
}
function foeMiss(f, ranged) { play(ranged ? "bullet_by" : "swing_by", { gain: 0.8, pan: (f.x - G().x) > 0 ? 0.5 : (f.x - G().x) < 0 ? -0.5 : 0 }); }
function hurt(adt, dmg, src) {
  play("hurt_" + (adt || "phys"), { gain: 0.9 });
  if (dmg > (G() ? G().hpMax * 0.12 : 20)) play("player_pain", { gain: 0.8, delay: 0.05 });
  heartCheck();
}

/* ════════ ВЫСТРЕЛЫ ГЕРОЯ ════════ */
function shot(w, dir, burst) {
  var v = DIRV[dir] || [0, -1];
  var id = LAB.WEAPONS[w.base].snd || "w_blaster_s";
  if (!has(id)) id = LAB.WEAPONS[w.base].cls === "magnetron" ? "w_magnetron" : "w_blaster_s";
  play(id, { pan: v[0] * 0.35, gain: burst ? 0.85 : 1, rate: burst ? 1.03 : 1, reverb: 0.3 });
}
function shotWall(w, x, y) { var cls = LAB.WEAPONS[w.base].cls; at(cls === "positron" ? "impact_positron" : cls === "magnetron" ? "impact_wave" : "impact_wall", x, y, { gain: 0.8 }); }
function shotMiss(w, f) { at("impact_wall", f.x + (Math.random() < 0.5 ? 1 : -1), f.y, { gain: 0.7 }); }
function swingMiss(w) { play("swing_miss", { gain: 0.8 }); }
function explosion(x, y, kind) {
  var id = kind === "emp" ? "emp_blast" : kind === "acid" ? "acid_burst" : kind === "mine" ? "explosion_small" : kind === "shell" ? "explosion_big" : "explosion_small";
  at(id, x, y, { gain: 1.2, reverb: 0.6 });
  var g = G();
  if (g && Math.max(Math.abs(x - g.x), Math.abs(y - g.y)) <= 2) LAB.vib([60, 40, 120]);
}
function grenade(x, y) { play("grenade_throw"); at("grenade_land", x, y, { delay: 0.45 }); }
function shellIncoming(x, y) { at("shell_whistle", x, y, { gain: 1.1 }); sub("Свист снаряда!"); }
function mineBeep(x, y) { at("mine_beep", x, y, { gain: 0.8, bus: "ui" }); }
function dropLoot(x, y) { at("loot_drop", x, y, { gain: 0.7 }); }
function implant(id) { play("implant_" + id, { fb: FB.implant }); }

/* ════════ МУЗЫКА ════════
   Записи, если есть (mus_menu, mus_game, mus_ending), иначе — давящий
   генеративный фон: инфранизкий гул с биениями, тритоны, скрежет металла
   в глубине, редкий тяжёлый удар — сердце комплекса. */
var mus = { theme: "", key: "", tid: "", h: null, s: null, timers: [] };
function music(theme) {
  var L = G() ? G().L : 1;
  var key = theme === "game" ? "game" + L : theme;
  if (key === mus.key && (mus.h || mus.s)) return;
  stopMusic();
  mus.theme = theme; mus.key = key;
  if (!S.music || !AE.ensure()) return;
  var tid = theme === "game" ? "mus_l" + L : "mus_" + theme;
  if (theme === "game" && !has(tid)) tid = "mus_game";
  if (has(tid)) {
    mus.tid = tid;
    mus.h = loop(tid, { bus: "music", gain: 1, fadeIn: 4, reverb: 0 });
    if (mus.h) return;
  }
  mus.tid = "";
  genMusic(theme, L);
}
function stopMusic() {
  if (mus.h) { mus.h.stop(2.5); mus.h = null; }
  if (mus.tid) { var old = mus.tid; mus.tid = ""; releaseLater(old, 3500); }
  if (mus.s) { mus.s.stop(2.5); mus.s = null; }
  mus.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
  mus.timers = [];
  mus.theme = ""; mus.key = "";
}
function musicVolume() { AE.applyVolumes(); if (!S.music) stopMusic(); else if (!mus.theme) music(LAB.ui && LAB.ui.screen() === "game" ? "game" : "menu"); }

function genMusic(theme, L) {
  var s = new LAB.SFX(AE.music);
  mus.s = s;
  var c = s.ctx, t0 = c.currentTime;
  var deep = theme === "game" ? (L - 1) / 9 : theme === "menu" ? 0.6 : 0.4;
  var root = theme === "game" ? LAB.LEVELS[L].root / 4 : theme === "menu" ? 41.2 : theme === "ending" ? 55 : 46.25;
  /* 1. Инфранизкий гул: два тона, разнесённые на полутон, — биения давят на уши */
  var g1 = s.gain(0.0001); g1.connect(s.out());
  var lp = s.filter("lowpass", 140 + deep * 40, 0.9); lp.connect(g1);
  var oA = s.osc("sawtooth", root), oB = s.osc("sawtooth", root * (theme === "ending" ? 1.5 : 1.0595)), oC = s.osc("sine", root / 2);
  oA.connect(lp); oB.connect(lp); oC.connect(g1);
  oA.start(); oB.start(); oC.start();
  g1.gain.setTargetAtTime(theme === "ending" ? 0.05 : 0.075 + deep * 0.03, t0, 3);
  s.lfo(0.031, 50, lp.frequency);
  /* 2. Медленные гроздья: тритон и малая секунда, вдох — выдох */
  var chords = theme === "ending"
    ? [[1, 1.5, 2, 3], [1, 1.335, 2, 2.667], [1, 1.5, 2.25, 3], [1, 1.498, 2, 4]]
    : [[2, 2.828, 3.0, 4.237], [2, 2.119, 2.996, 4.0], [1.888, 2.67, 2.83, 4.0], [2, 2.38, 2.828, 3.775]];
  var ci = 0;
  var chord = function () {
    if (s.stopped) return;
    var t = c.currentTime + 0.05, ch = chords[ci % chords.length]; ci++;
    ch.forEach(function (m, i) { pad(s, root * m, t, 13, [0.03, 0.022, 0.018, 0.012][i] * (theme === "ending" ? 1.3 : 1), theme === "ending" ? 1400 : 520 + deep * 120); });
  };
  chord();
  mus.timers.push(setInterval(chord, 12500));
  /* 3. Скрежет металла в глубине: резонанс шума с длинным хвостом */
  if (theme !== "ending") {
    var groan = function () {
      if (s.stopped) return;
      var t = c.currentTime + 0.05;
      var n = s.noise("white", 3, false), bp = s.filter("bandpass", 260 + Math.random() * 700, 28), g = s.gain(0.0001);
      n.connect(bp); bp.connect(g); g.connect(s.out()); s.send(g, 0.9);
      bp.frequency.setValueAtTime(bp.frequency.value, t); bp.frequency.linearRampToValueAtTime(bp.frequency.value * (0.7 + Math.random() * 0.5), t + 3);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 + deep * 0.03, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      n.start(t); n.stop(t + 3.1);
    };
    var tg = setTimeout(function loop() { groan(); var id = setTimeout(loop, 8000 + Math.random() * 9000); mus.timers.push(id); }, 4000);
    mus.timers.push(tg);
  }
  /* 4. Сердце комплекса: тяжёлый удар, на глубине — чаще */
  var beatGap = theme === "ending" ? 0 : Math.round(9000 - deep * 4500);
  if (beatGap) mus.timers.push(setInterval(function () {
    if (s.stopped) return;
    var t = c.currentTime + 0.05, o = s.osc("sine", 52), g = s.gain(0.0001);
    o.connect(g); g.connect(s.out()); s.send(g, 0.5);
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.start(t); o.stop(t + 1.3);
    if (theme === "game" && L === 10) setTimeout(function () { if (!s.stopped) { var o2 = s.osc("sine", 40), g2 = s.gain(0.0001); o2.connect(g2); g2.connect(s.out()); var tt = c.currentTime; g2.gain.linearRampToValueAtTime(0.1, tt + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.8); o2.start(tt); o2.stop(tt + 0.9); } }, 330);
  }, beatGap));
  /* 5. Тонкий звон под потолком: нерв */
  mus.timers.push(setInterval(function () {
    if (s.stopped || Math.random() < 0.45) return;
    var t = c.currentTime + 0.05, f = theme === "ending" ? 880 * (Math.random() < 0.5 ? 1.5 : 2) : 1700 + Math.random() * 900;
    var o = s.osc("sine", f), g = s.gain(0.0001);
    o.connect(g); g.connect(s.out()); s.send(g, 0.8);
    s.lfo(5 + Math.random() * 2, f * 0.004, o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(theme === "ending" ? 0.02 : 0.012, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    o.start(t); o.stop(t + 5.2);
  }, 7000));
}
function pad(s, freq, when, dur, vol, cut) {
  var o1 = s.osc("sawtooth", freq), o2 = s.osc("sawtooth", freq * 1.004), o3 = s.osc("triangle", freq * 0.5), f = s.filter("lowpass", cut, 0.8), g = s.gain(0.0001);
  o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g); g.connect(s.out()); s.send(g, 0.6);
  g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + dur * 0.4);
  g.gain.setValueAtTime(vol, when + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, when + dur);
  [o1, o2, o3].forEach(function (o) { o.start(when); o.stop(when + dur + 0.2); });
}

/* ════════ ЗАПАСНОЙ СИНТЕЗ (если записи нет) ════════ */
var FB = {
  bump_wall: function (s) { s.clang(180); }, bump_body: function (s) { s.thump(0, 0.4); }, bump_furniture: function (s) { s.thump(0, 0.3); }, bump_device: function (s) { s.clang(420); },
  step_plate: function (s) { s.metalstep(0); },
  near_tick: function (s) { s.note(1300, 0, 0.05, "sine", 0.05); },
  door_auto_open: function (s) { s.whoosh(true); }, door_auto_close: function (s) { s.whoosh(false); }, door_heavy_open: function (s) { s.servo(true); s.clang(90); }, door_heavy_close: function (s) { s.clang(80); },
  door_hatch_open: function (s) { s.servo(true); }, door_hatch_close: function (s) { s.servo(false); }, door_locked: function (s) { s.note(220, 0, 0.12, "square", 0.08); s.note(180, 0.13, 0.15, "square", 0.08); },
  door_knock: function (s) { s.thump(0, 0.3); s.thump(0, 0.3); },
  card_ok: function (s) { s.note(1200, 0, 0.08, "sine", 0.1); s.note(1600, 0.09, 0.1, "sine", 0.1); }, card_fail: function (s) { s.note(300, 0, 0.2, "square", 0.08); },
  keypad: function (s) { s.note(900, 0, 0.05, "square", 0.05); }, code_ok: function (s) { s.chirp([900, 1200, 1500]); }, code_fail: function (s) { s.note(200, 0, 0.3, "sawtooth", 0.08); },
  term_on: function (s) { s.chirp([600, 900, 1200]); }, term_off: function (s) { s.chirp([1200, 800, 500]); }, term_beep: function (s) { s.note(1000, 0, 0.06, "square", 0.05); },
  term_ok: function (s) { s.chirp([800, 1200]); }, term_err: function (s) { s.note(240, 0, 0.25, "square", 0.08); },
  pick_part: function (s) { s.tink(1400); }, pick_med: function (s) { s.chirp([700, 1050]); }, pick_bat: function (s) { s.charge(0.3); },
  bcn_default: function (s) { s.note(1050, 0, 0.08, "sine", 0.06); },
  w_blaster_s: function (s) { s.laser(1400, 0.18); }, w_melee: function (s) { s.swing(0); }, w_empty: function (s) { s.note(2000, 0, 0.02, "square", 0.05); },
  hit_metal: function (s) { s.clang(600); }, hit_flesh: function (s) { s.thump(0, 0.5); }, impact_wall: function (s) { s.tink(2400); },
  explosion_small: function (s) { s.boom(0.6); }, explosion_big: function (s) { s.boom(1); }, emp_blast: function (s) { s.zap(); s.boom(0.4); },
  robot_alert: function (s) { s.chirp([700, 1400, 700]); }, mutant_alert: function (s) { s.roar(); }, robot_attack: function (s) { s.zap(); }, mutant_attack: function (s) { s.growl(); },
  robot_death: function (s) { s.zap(); s.clang(200); }, mutant_death: function (s) { s.screech(); }, robot_step: function (s) { s.servo(Math.random() < 0.5); }, mutant_step: function (s) { s.footstep(0); },
  foe_aim: function (s) { s.charge(0.4); }, hurt_phys: function (s) { s.thump(0, 0.6); }, implant: function (s) { s.charge(0.5); },
  heartbeat: function (s) { s.thump(0, 0.5); }, gate_open: function (s) { s.servo(true); s.hum(60, 3, 0.1); }, gate_seal: function (s) { s.boom(0.8); s.clang(70); },
  shell_whistle: function (s) { s.whoosh(false); }, mine_beep: function (s) { s.note(2400, 0, 0.05, "square", 0.04); }
};

LAB.atmos = {
  play: play, at: at, has: has,
  enterFloor: enterFloor, setRoom: setRoom, setEvent: setEvent, stopWorld: stopWorld,
  step: step, bump: bump, bumpWall: bumpWall, bumpSoft: bumpSoft, near: near, doorOpen: doorOpen, doorClose: doorClose, doorPass: doorPass, objUse: objUse,
  container: container, stairs: stairs, gate: gate, gateSeal: gateSeal, elevRide: elevRide, rest: rest, death: death, npcHello: npcHello,
  navPing: navPing, navStart: navStart, pickup: pickup,
  foeSound: foeSound, foeStep: foeStep, foeHit: foeHit, foeDeath: foeDeath, foeMiss: foeMiss, hurt: hurt,
  shot: shot, shotWall: shotWall, shotMiss: shotMiss, swingMiss: swingMiss, explosion: explosion, grenade: grenade, shellIncoming: shellIncoming,
  mineBeep: mineBeep, dropLoot: dropLoot, implant: implant, combatLevel: combatLevel,
  music: music, stopMusic: stopMusic, musicVolume: musicVolume, preloadLevel: preloadLevel, idsFor: idsFor
};
})();
