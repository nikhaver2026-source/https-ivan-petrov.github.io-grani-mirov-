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
var LAB = window.LAB, S = LAB.settings, AE = LAB.AE, Bank = LAB.Bank, Snd = LAB.Sound;
function G() { return LAB.game && LAB.game.G; }
function CUR() { return LAB.game && LAB.game.CUR; }
function idx(x, y) { return y * LAB.W + x; }
var DIRV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

/* ── базовое: сыграть запись (или синтез) — всё через единый обработчик звука ── */
function has(id) { return Bank.has(id); }
/* Канал микшера внутри эффектов: оружие и тревоги — по имени записи,
   противники — их звуки сами говорят «foe» (foeSound и соседи). */
function chOf(id, o) {
  if (o.bus && o.bus !== "fx" && o.bus !== "amb") return null; /* интерфейс, маяки, музыка, речь — свои шины */
  if (/alarm|siren/.test(id)) return "alarm";
  if (o.bus === "amb") return null;
  if (/^(w_|impact_|explosion_|grenade_|emp_blast|shell_whistle|swing_miss)/.test(id)) return "weap";
  return null;
}
function play(id, o) {
  o = o || {};
  if (!o.ch) { var ch0 = chOf(id, o); if (ch0) o.ch = ch0; }
  var fb = FB[id] || FB[id.replace(/_\d+$/, "")] || o.fb;
  if (has(id)) { if (fb && !o.fb) o.fb = fb; return Snd.play(id, o); }
  if (fb) Snd.synth(fb, o.fbms || 1600, o.bus || "fx", o.pan || (o.at ? LAB.spatial(o.at.dx, o.at.dy, o.at.occ).pan : 0), o.gain == null ? 1 : o.gain);
  return null;
}
/* Сыграть в точке этажа: панорама, громкость, глушение за стеной и за спиной. */
var deafUntil = 0;
function at(id, x, y, o) {
  o = o || {};
  var g = G(); if (!g) return play(id, o);
  var occ = false;
  try { occ = !LAB.los(CUR().fl, CUR().fs, g.x, g.y, x, y); } catch (e) { occ = false; }
  o.at = { dx: x - g.x, dy: y - g.y, occ: occ };
  if (Date.now() < deafUntil) { o.lp = Math.min(o.lp || 18000, 650); o.gain = (o.gain == null ? 1 : o.gain) * 0.6; }
  return play(id, o);
}
function atFoe(id, x, y, o) { o = o || {}; o.ch = "foe"; return at(id, x, y, o); }
/* Визг оглушил: на время звуки вокруг глохнут, будто уши заложило. */
function deafen(ms) { deafUntil = Date.now() + (ms || 3000); play("deaf_ring", { gain: 0.5, bus: "fx", fb: function (s) { s.note(3900, 0, 2.2, "sine", 0.03); } }); }
function sub(t) { if (S.subtitles) LAB.sub(t); }

/* Длинные записи (музыка, фон уровня) — тоже из памяти, как все звуки: поток
   через <audio> в WebView Android молчит. Чтобы память не росла, длинная
   петля выгружается, когда её сменила другая (isLong — признак из sounds.js). */
function isLong(id) { var d = LAB.SND && LAB.SND[id]; return !!(d && d.o && d.o.long); }
function releaseLater(id, ms) {
  if (!id || !isLong(id)) return;
  if ((mus.tid === id) || (bed && bed.id === id) || roomLid === id || evLayerId === id) return; /* снова нужна */
  Snd.release(id, ms || 4000); /* обработчик выгрузит, только если запись точно не звучит и не нужна */
}
/* Петля из памяти в именованной ячейке единого обработчика: если запись ещё
   не загружена — загрузится и начнётся; замолчит сама — сторож запустит снова. */
function loop(id, o, slot) {
  if (!has(id)) return null;
  return Snd.loop(slot || id, id, o || {});
}

/* ════════ ШАГИ, СТЕНЫ, ДВЕРИ ════════ */
var stepN = 0;
function step(surf, run, door) {
  stepN++;
  var sd = LAB.SURF[surf] || {}, base = sd.base || surf || "plate", rate = sd.rate || 1;
  var id = "step_" + base;
  play(has(id) ? id : "step_plate", { gain: run ? 1 : 0.88, rate: (run ? 1.04 : 1) * rate, pan: stepN % 2 ? -0.12 : 0.12, reverb: 0.16, bus: "fx" });
  /* (3.0) деревянный пол: изредка скрипит половица — чаще, когда идёте, а не бежите */
  if (sd.creak && has("floor_creak") && Math.random() < sd.creak * (run ? 0.6 : 1)) play("floor_creak", { gain: 0.55, delay: 0.05 + Math.random() * 0.08, pan: stepN % 2 ? -0.1 : 0.1, reverb: 0.12, bus: "fx" });
  if (door) play("door_threshold", { gain: 0.5 });
  wallEcho(id, rate);
}
/* Отзвук стены: если стена вплотную слева или справа, шаг отдаётся от неё
   тихим коротким эхом с той стороны — в широком коридоре так слышно, у какой
   вы стены. */
function wallEcho(id, rate) {
  var g = G(), cur = CUR();
  if (!g || !cur || !cur.fl) return;
  var sides = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
  sides.forEach(function (q) {
    var x = g.x + q[1], y = g.y + q[2];
    if (!LAB.inb(x, y) || cur.fl.t[idx(x, y)] !== LAB.T.WALL) return;
    var pan = q[1] * 0.85, lp = q[2] > 0 ? 1800 : 5200;
    play(has("step_echo") ? "step_echo" : id, { gain: q[2] ? 0.14 : 0.22, rate: (rate || 1) * 1.08, pan: pan, lp: lp, delay: 0.035 + Math.random() * 0.01, reverb: 0, bus: "fx", vary: 0 });
  });
}
function bump() { play("bump_body", { gain: 0.8 }); }
/* Удар о стену: стены везде стальные, и звук всегда один и тот же — одна
   запись, без случайной высоты и без фильтра; только сторона (слева, справа). */
function bumpWall(dir) {
  var v = DIRV[dir] || [0, -1];
  /* стена спереди — звонко, сзади — глуше, слева и справа — с той стороны */
  play("bump_wall", { pan: v[0] * 0.75, gain: 1, variant: 0, vary: 0, reverb: 0.35, lp: v[1] > 0 ? 2200 : null });
  play("bump_wall_thud", { pan: v[0] * 0.6, gain: 0.9, reverb: 0.1, fb: FB.bump_wall_thud });
}
function bumpSoft(o) { play(o && (o.type === "terminal" || o.type === "vending" || o.type === "medst" || o.type === "charger" || o.type === "magnetron" || o.type === "positron") ? "bump_device" : "bump_furniture", { gain: 0.8 }); }
function near() { play("near_tick", { gain: 0.6, bus: "ui" }); }
function doorKind(d) { return d.kind === "heavy" ? "heavy" : d.kind === "hatch" ? "hatch" : d.kind === "rubble" ? "heavy" : d.kind === "secret" ? "secret" : "auto"; }
function doorOpen(d, byFoe) { at("door_" + doorKind(d) + "_open", d.x, d.y, { gain: byFoe ? 0.9 : 1 }); if (byFoe) sub("Где-то открылась дверь"); }
function doorClose(d) { at("door_" + doorKind(d) + "_close", d.x, d.y); }
function doorPass(d) { /* порог двери под ногой — уже в step */ }
function objUse(o) { /* звук конкретного действия — в меню предметов */ }
function container(type) { play({ crate: "open_crate", locker: "open_locker", safe: "open_safe", desk: "open_desk", corpse: "search_body", shelf: "open_crate", cabinet: "open_desk", fridge: "open_locker", firstaid: "open_locker", suitlocker: "open_locker", rack: "open_locker", tubepost: "open_crate", comp: "open_desk" }[type] || "open_crate"); }
function stairs(down) { play(down ? "stairs_down" : "stairs_up", { gain: 1 }); }
/* Ступени лестничной клетки: гулко, вниз чуть ниже тоном, вверх — выше. */
function stairEnter(down) { play(has("stair_step") ? "stair_step" : "step_plate", { gain: 0.9, rate: down ? 0.95 : 1.05, reverb: 0.55 }); }
function stairStep(down, k, n) {
  var id = has("stair_step") ? "stair_step" : "step_plate";
  play(id, { gain: 0.85 + Math.random() * 0.15, rate: (down ? 0.96 : 1.04) * (1 + (Math.random() - 0.5) * 0.06), reverb: 0.5, pan: k % 2 ? 0.12 : -0.12 });
}
function bumpRail() { play(has("bump_rail") ? "bump_rail" : "bump_device", { gain: 0.8, reverb: 0.4 }); LAB.vib(15); }
function gate(down) { play("gate_open", { gain: 1 }); setTimeout(function () { play("gate_ride", { gain: 0.9, bus: "fx" }); }, 1800); }
function gateSeal() { play("gate_seal", { gain: 1 }); LAB.vib([120, 60, 220]); }
function elevRide(ms) { play("elev_ride", { gain: 0.9 }); setTimeout(function () { play("elev_ding"); }, Math.max(800, ms - 400)); }
function rest() { play("capsule_close"); setTimeout(function () { play("capsule_hum", { gain: 0.6 }); }, 600); }
function death() { play("player_death"); stopTension(); }
function npcHello(n) { if (n.robot && !(LAB.ROBOT_NPC && LAB.ROBOT_NPC[n.type] && LAB.ROBOT_NPC[n.type].alive)) play("robot_hello", { gain: 0.8 }); else play("npc_hello", { gain: 0.7 }); }
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
  medst: "bcn_medst", medvend: "bcn_medst", charger: "bcn_charger", implantlab: "bcn_implantlab", hq: "bcn_hq", safe: "bcn_safe",
  chemlab: "bcn_chemlab", pc: "bcn_pc", coffee: "bcn_coffee", drinks: "bcn_drinks", snacks: "bcn_snacks", radio: "bcn_radio", okoterm: "bcn_oko", puzzle: "bcn_puzzle",
  powergrid: "bcn_powergrid", incubator: "bcn_incubator", mirrorterm: "bcn_mirrorterm", syncgate: "bcn_syncgate", ancient: "bcn_ancient" };
var OBJ_BEACON_FB = { bcn_chemlab: ["bcn_workbench", 1.3], bcn_radio: ["bcn_pc", 0.75], bcn_oko: ["bcn_terminal", 1.35], bcn_puzzle: ["bcn_vending", 1.25], bcn_snacks: ["bcn_drinks", 0.82],
  /* установки глубин: свои маяки, пока нет записей — знакомые маяки на другой высоте */
  bcn_powergrid: ["bcn_magnetron", 0.7], bcn_incubator: ["bcn_capsule", 1.3], bcn_mirrorterm: ["bcn_terminal", 0.8], bcn_syncgate: ["bcn_gate", 1.2], bcn_ancient: ["bcn_reactor", 0.6] };
var OBJ_RANGE = { stairs_down: 16, stairs_up: 10, gate_down: 18, elevator: 12, reactor: 20, workbench: 14 }; /* (2.0) станки мастерской слышно из коридора */
function beaconTick() {
  var g = G(), cur = CUR();
  if (LAB.bg) return; /* (3.0) игра в фоне: мир стоит — маяки молчат */
  if (!g || !LAB.game.entered || LAB.game.paused || g.stair || !cur || !cur.fl || !S.beacons || !S.effects) return;
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
  /* (1.6) известные ловушки и мины: у каждого вида свой маяк, чтобы не напороться */
  if (LAB.traps && LAB.traps.list) LAB.traps.list().forEach(function (tp) {
    if (!tp.known || tp.st === "gone" || tp.st === "sprung") return;
    var d = Math.abs(tp.x - g.x) + Math.abs(tp.y - g.y);
    if (d === 0 || d > 7) return;
    src.push({ key: "t" + tp.id, id: "bcn_trap", x: tp.x, y: tp.y, d: d, max: 7, trap: tp.t });
  });
  /* (1.6) враги под маяком после скана: маяк ползёт вместе с ними */
  if (LAB.combat && LAB.combat.foes) LAB.combat.foes().forEach(function (f) {
    if (f.dead || !(f.mark > now)) return;
    var d = Math.abs(f.x - g.x) + Math.abs(f.y - g.y);
    if (d === 0 || d > 14) return;
    src.push({ key: "f" + f.id, id: f.kind === "mech" ? "bcn_foe_mech" : "bcn_foe_bio", x: f.x, y: f.y, d: d, max: 14, foe: f.kind });
  });
  src.sort(function (a, b) { return a.d - b.d; });
  lastSources = src;
  src.slice(0, 8).forEach(function (s) {
    if (nextPing[s.key] && nextPing[s.key] > now) return;
    var k = s.d / s.max;
    var gap = (s.foe ? 500 + k * 900 : 700 + k * 2600) + (s.obj ? 600 : 0);
    nextPing[s.key] = now + gap * (0.9 + Math.random() * 0.2);
    if (s.trap) { at("bcn_trap", s.x, s.y, { bus: "beacon", gain: (jam ? 0.5 : 1) * (1.1 - k * 0.5), reverb: 0.1, fb: trapBeacon(s.trap) }); return; }
    if (s.foe) { at(s.id, s.x, s.y, { bus: "beacon", gain: 1.1 - k * 0.45, reverb: 0.15, fb: s.foe === "mech" ? FOE_BCN.mech : FOE_BCN.bio }); return; }
    var bid = s.id, brate = 1;
    if (!has(bid) && OBJ_BEACON_FB[bid]) { brate = OBJ_BEACON_FB[bid][1]; bid = OBJ_BEACON_FB[bid][0]; }
    at(has(bid) ? bid : "bcn_default", s.x, s.y, { bus: "beacon", gain: (jam ? 0.35 : 1) * (1.1 - k * 0.55), lp: jam ? 1200 : null, reverb: 0.12, rate: brate });
  });
}
var lastSources = [];
/* Маяк ловушки: высота — своя у каждого вида, рисунок — по устройству:
   мина — двойной писк, растяжка — три щелчка вверх, датчик приближения —
   гудок, прочие — металлический тик. */
var TRAP_PITCH = {};
function trapPitch(k) {
  if (TRAP_PITCH[k]) return TRAP_PITCH[k];
  var keys = Object.keys(LAB.traps.T), i = Math.max(0, keys.indexOf(k));
  var f = 440 * Math.pow(2, (i % 14) / 7 + Math.floor(i / 14) * 0.5);
  TRAP_PITCH[k] = f;
  return f;
}
function trapBeacon(k) {
  var d = (LAB.traps && LAB.traps.T[k]) || {}, f = trapPitch(k);
  if (d.mine) return function (s) { s.note(f, 0, 0.05, "square", 0.045); s.note(f, 0.1, 0.05, "square", 0.045); };
  if (d.trig === "wire") return function (s) { s.note(f, 0, 0.03, "triangle", 0.05); s.note(f * 1.5, 0.06, 0.03, "triangle", 0.04); s.note(f * 2, 0.12, 0.03, "triangle", 0.035); };
  if (d.trig === "prox" || d.trig === "lure") return function (s) { s.note(f, 0, 0.14, "sine", 0.045); };
  return function (s) { s.tink(f); };
}
var FOE_BCN = {
  mech: function (s) { s.note(1400, 0, 0.04, "square", 0.05); s.note(2100, 0.06, 0.05, "square", 0.045); },
  bio: function (s) { s.note(190, 0, 0.1, "sawtooth", 0.05); s.note(150, 0.09, 0.12, "sawtooth", 0.045); }
};

/* ════════ ФОН: уровень, помещения, события ════════ */
var bed = null, roomLoop = null, roomLoopId = "", roomLid = "", evTimer = null, evLayer = null, evLayerId = "", hbLoop = null, tension = null, worldOn = false;
var ROOM_LOOP = {
  server: "room_server", comms: "room_radio", genhall: "room_generator", transformer: "room_transformer", magnetron_hall: "room_magnetron", switchboard: "room_electric",
  cable: "room_electric", powerdesk: "room_hum", cryohall: "room_cryo", freezer: "room_cryo", samples: "room_cryo", compressor: "room_compressor", thaw: "room_drip",
  greenhouse: "room_drip", tankfarm: "room_bubbles", mycelium: "room_drip", pumps: "room_pumps", compost: "room_bubbles", vivarium: "room_creatures", incubator: "room_incubator",
  sequencer: "room_server", embryo: "room_incubator", genelab: "room_bubbles", assembly: "room_factory", parts: "room_hum", range: "room_hum", ailab: "room_server", charging: "room_electric",
  repair: "room_factory", ring: "room_ring", detector: "room_ring", accdesk: "room_server", targetroom: "room_ring", vacuum: "room_compressor", reactorhall: "room_reactor",
  containment: "room_magnetron", chiefdesk: "room_server", bastion: "room_server", annihilation: "room_reactor", reactor: "room_reactor", kitchen: "room_fridge", canteen: "room_fridge",
  laundry: "room_drip", showers: "room_drip", wintergarden: "room_fountain", medbay: "room_medical", medpost: "room_medical", surgery: "room_medical", isolator: "room_medical",
  lift: "room_elevator", gate: "room_gate", gatein: "room_gate", stair: "room_stairwell", testbench: "room_hum", arsenal: "room_hum", ballistics: "room_server", armorlab: "room_factory",
  /* общие помещения и испытательные залы */
  cafeteria: "room_fridge", workroom: "room_server", headoffice: "room_hum", testing: "room_hum", psych: "room_hum", decon: "room_drip",
  sleeplab: "room_medical", isolation: "room_hum", classroom: "room_hum", darkfarm: "room_drip", climate: "room_drip", aeroponics: "room_bubbles",
  geneeng: "room_bubbles", cloning: "room_incubator", maze: "room_creatures", regen: "room_medical", acoustic: "room_hum", navtrack: "room_factory",
  neuro: "room_server", hvlab: "room_electric", faraday: "room_hum", supercond: "room_compressor", coldtest: "room_cryo", cryosleep: "room_cryo",
  barochamber: "room_compressor", armortest: "room_factory", sonicrange: "room_hum", emplab: "room_electric", phaselab: "room_ring",
  gravlab: "room_ring", riftobs: "room_reactor", expedition: "room_hum", cradlelab: "room_incubator"
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
function levelEvents(L) { var lv = LAB.LEVELS[L]; return (lv && lv.ev && lv.ev.length) ? lv.ev : (EVENTS_L[L] || EVENTS_L[((L - 1) % 10) + 1] || EVENTS_L[1]); }
/* Записи уровня: голоса его врагов, его пол, его далёкие события.
   Записи прошлого уровня выгружаются — память телефона не резиновая. */
var levelIds = [], levelL = 0;
function idsFor(L) {
  var lev = LAB.LEVELS[L], out = [], sets = {};
  var foes = lev.foes.slice();
  if (L < LAB.LEVELS_N && LAB.LEVELS[L + 1]) LAB.LEVELS[L + 1].foes.forEach(function (f) { if (LAB.FOES[f] && LAB.FOES[f].kind === "mech") foes.push(f); });
  foes.push("cam", "cleaner", "miniturret", "turret", "okodrone", "repairbot", "patrolbot");
  /* еда и лекарства — на каждом уровне */
  ["eat_crunch", "eat_chew", "food_wrapper", "pills_rattle", "bandage_tear", "stomach_growl", "cough", "yawn", "snack_drop", "water_pour", "bcn_snacks"].forEach(function (id) { if (LAB.SND && LAB.SND[id]) out.push(id); });
  foes.forEach(function (f) { if (LAB.FOES[f]) sets[LAB.FOES[f].snd] = 1; });
  if (lev.boss && LAB.BOSSES[lev.boss]) sets[LAB.BOSSES[lev.boss].snd] = 1;
  if (sets.labmut || sets.roach) sets.rat = 1;
  var all = Object.keys(LAB.SND || {});
  all.forEach(function (id) {
    var m = id.match(/^([a-z]+)_(idle|alert|attack|hurt|death|step)$/);
    if (m && sets[m[1]]) out.push(id);
  });
  var sf = LAB.SURF[lev.surf] || {};
  out.push("step_" + (sf.base || lev.surf), "step_echo", "step_concrete", "step_wood", "floor_creak"); /* (3.0) бетон и дерево — на любом уровне */
  if (LAB.okoForms) LAB.okoForms.sounds(L).forEach(function (id) { out.push(id); }); /* (3.1) сигналы облика ОКО этой глубины */
  levelEvents(L).forEach(function (id) { out.push(id); });
  return out;
}
function preloadLevel(L) {
  if (L === levelL) return;
  var need = idsFor(L);
  var drop = levelIds.filter(function (id) { return need.indexOf(id) < 0; });
  drop.forEach(function (id) { Snd.release(id, 1500); });
  levelIds = need; levelL = L;
  Snd.preload(need);
}
function enterFloor(L, F) {
  /* самопроверка: обход этажей без звука и загрузок; после него мир звучит заново */
  if (Snd.isQuiet()) { if (worldOn || mus.theme) { stopWorld(); stopMusic(); } return; }
  worldOn = true;
  var lev = LAB.LEVELS[L];
  preloadLevel(L);
  if (!bed || bed.L !== L) {
    var oldBed = bed && bed.id;
    if (bed && bed.h) bed.h.stop(2.5);
    var bid = lev.amb;
    /* (2.0) фон уровня — запись низкого гула машин: машинный зал, серверная,
       электрощитовая, машинное отделение; в коридоре звучит только он */
    bed = { L: L, id: bid, h: loop(bid, { bus: "amb", gain: bedGain(), fadeIn: 3, reverb: 0 }, "bed") };
    if (oldBed && oldBed !== bid) releaseLater(oldBed, 3500);
    if (!bed.h) synthBed(L);
  }
  if (!beaconT) beaconT = setInterval(function () { LAB.safe(beaconTick); if (++deadN % 20 === 0) LAB.safe(deadLoops); }, 220);
  if (!evTimer) scheduleEvent();
  var Ld = depthL(L);
  AE.setReverb(1.4 + Ld * 0.08, 0.3 + Ld * 0.015);
  music("game");
}
/* Запись фона или музыки так и не загрузилась (битый файл, нет декодера) —
   вместо тишины звучит синтез: гул уровня, генеративная музыка. */
var deadN = 0;
function deadLoops() {
  if (!Snd.dead) return;
  if (bed && bed.h && bed.id && !synthBedS && Snd.dead(bed.id)) { bed.h.stop(0.5); bed.h = null; synthBed(bed.L); }
  if (mus.h && mus.tid && !mus.s && Snd.dead(mus.tid)) { var th = mus.theme, L = G() ? G().L : 1; mus.h.stop(0.5); mus.h = null; mus.tid = ""; genMusic(th, L); }
}
/* «Глубина» уровня для синтеза: до Ядра — сам уровень (1–10), глубже — от
   середины к низу внутри блока, чтобы гул и отзвук не уходили за пределы слуха. */
function depthL(L) { return L <= 10 ? L : 5 + ((L - 1) % 20) / 4; }
var synthBedS = null;
function synthBed(L) {
  if (synthBedS) { synthBedS.stop(2); synthBedS = null; }
  if (!AE.ensure()) return;
  /* запасной гул (запись фона не загрузилась): низкий шум и гул вентиляции, ниже с глубиной */
  var s = new LAB.SFX(AE.amb), Ld = depthL(L);
  var n = s.noise("brown", 4, true), f = s.filter("lowpass", 180 - Ld * 8, 0.7), gN = s.gain(0.0001);
  n.connect(f); f.connect(gN); gN.connect(s.out()); n.start();
  gN.gain.setTargetAtTime(0.35, s.ctx.currentTime, 2);
  var o = s.osc("sine", 38 + (10 - Ld) * 2), go = s.gain(0.0001); o.connect(go); go.connect(s.out()); o.start();
  go.gain.setTargetAtTime(0.05 + Ld * 0.006, s.ctx.currentTime, 3);
  s.lfo(0.07, 60, f.frequency);
  synthBedS = s;
}
/* (2.0) Громкость фона уровня: в коридоре — полная; в помещении, где гудят
   свои машины (своя петля помещения), гул уровня отходит на второй план. */
var BED_GAIN = 0.62, BED_DUCK = 0.38;
function bedGain() { return roomLoop ? BED_DUCK : BED_GAIN; }
function bedLevel(fade) { if (bed && bed.h && bed.h.setGain) bed.h.setGain(bedGain(), fade == null ? 1.2 : fade); }
function setRoom(r) {
  var id = r ? (ROOM_LOOP[r.type] || "") : "corridor";
  if (id === roomLoopId) return;
  roomLoopId = id;
  var prevLid = roomLid;
  if (roomLoop) { roomLoop.stop(1.2); roomLoop = null; }
  /* (2.0) в коридоре своей петли нет — там звучит сам гул уровня */
  var lid = !id || id === "corridor" ? "" : id;
  roomLid = lid;
  /* гул прошлого помещения — из памяти */
  if (prevLid && prevLid !== lid) releaseLater(prevLid, 3000);
  if (lid) roomLoop = loop(lid, { bus: "amb", gain: 0.55, fadeIn: 1.2, reverb: 0.1 }, "room");
  bedLevel();
  if (!id) { AE.setReverb(1.2 + depthL(G() ? G().L : 1) * 0.08, 0.28); return; }
  /* отзвук: коридор — длинный, большие залы — гулкие, тесные — сухие */
  if (r) {
    var size = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
    AE.setReverb(0.8 + size * 0.06, 0.18 + Math.min(0.25, size * 0.01));
  } else AE.setReverb(2.2, 0.38);
}
function scheduleEvent() {
  clearTimeout(evTimer);
  var g = G();
  var gap = 7000 + Math.random() * 14000 - (g ? depthL(g.L) * 400 : 0);
  evTimer = setTimeout(function () {
    evTimer = null;
    if (!worldOn) return;
    var g2 = G();
    if (g2 && LAB.game.entered && !LAB.game.paused && !LAB.bg && !(LAB.ui && LAB.ui.layer())) {
      var pool = levelEvents(g2.L);
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
  if (want) evLayer = loop(want, { bus: "amb", ch: want === "evl_alarm" ? "alarm" : null, gain: 0.5, fadeIn: 2 }, "layer");
}
function stopWorld() {
  worldOn = false;
  var bedId = bed && bed.id;
  if (bed && bed.h) bed.h.stop(1.5);
  bed = null;
  if (bedId) releaseLater(bedId, 2500);
  if (synthBedS) { synthBedS.stop(1.5); synthBedS = null; }
  var rid = roomLid, eid = evLayerId;
  if (roomLoop) { roomLoop.stop(1); roomLoop = null; }
  roomLoopId = ""; roomLid = "";
  if (evLayer) { evLayer.stop(1); evLayer = null; } evLayerId = "";
  /* длинные петли помещения и событий выгрузить из памяти, как фон уровня */
  if (rid) releaseLater(rid, 2500);
  if (eid) releaseLater(eid, 2500);
  clearInterval(beaconT); beaconT = null;
  clearTimeout(evTimer); evTimer = null;
  stopTension();
  if (hbLoop) { hbLoop.stop(0.5); hbLoop = null; }
  if (sirenOn) { sirenOn.stop(1); sirenOn = null; }
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
  var root = 55 * Math.pow(2, -(depthL(G() ? G().L : 1) - 1) / 24);
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
  if (low && !hbLoop) hbLoop = loop("heartbeat", { bus: "fx", gain: 0.6, reverb: 0, prio: 3 }, "heart");
  if (!low && hbLoop) { hbLoop.stop(1); hbLoop = null; }
}

/* ════════ ВРАГИ ════════ */
var lastFoeSound = {};
function foeSet(f) { return f.snd || "drone"; }
/* (2.0) Машин на этаже сотни: шаги, гул и возню дальше, чем их слышно, не
   играем вовсе — иначе отовсюду шуршит неразборчивый фон, а слабый телефон
   захлёбывается звуками. За стеной слышно ближе, чем в открытую. */
function outOfEar(f, far, walled) {
  var g = G(); if (!g) return false;
  /* дальше, чем мир думает каждый такт, — тоже не слышно: там машины ходят реже */
  var C = LAB.combat, r = C && C.lodR ? C.lodR() - 2 : far;
  if (r < far) { walled = Math.max(6, walled - (far - r)); far = r; }
  var d = Math.max(Math.abs(f.x - g.x), Math.abs(f.y - g.y));
  if (d > far) return true;
  if (d <= walled) return false;
  try { return !LAB.los(CUR().fl, CUR().fs, g.x, g.y, f.x, f.y); } catch (e) { return false; }
}
function foeSound(f, kind) {
  var now = Date.now(), key = f.id + kind;
  if (kind === "idle" && outOfEar(f, 20, 12)) return;
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
  var br = (f.base && f.base.sndRate) || 1;
  if (f.boss && LAB.BOSSES[f.boss] && LAB.BOSSES[f.boss].sndRate) br = LAB.BOSSES[f.boss].sndRate;
  atFoe(id, f.x, f.y, { gain: kind === "idle" ? 0.7 : 1, rate: br * (f.boss ? 0.85 : 1) });
  /* турель: перед наведением слышно, как поворачивается сервопривод */
  var beh = (f.base && f.base.beh) || [];
  if (beh.indexOf("turret") >= 0 && (kind === "alert" || kind === "aim")) {
    atFoe("turret_servo", f.x, f.y, { gain: 0.8, rate: br, fb: FB.turret_servo, delay: kind === "aim" ? 0 : 0.15 });
    /* наведение — короткий писк захвата цели: сейчас выстрелит */
    if (kind === "aim" && has("turret_lock")) atFoe("turret_lock", f.x, f.y, { gain: 0.7, delay: 0.1 });
  }
  /* камера заметила — писк сканера и жужжание объектива */
  if (beh.indexOf("camera") >= 0 && kind === "alert" && has("cam_spot")) atFoe("cam_spot", f.x, f.y, { gain: 0.9 });
  if (kind === "alert") sub((f.name || "Враг").split(",")[0] + " заметил вас");
}
var hoverT = {};
function foeStep(f) {
  /* (2.0) патрульного слышно лучше: его шаги — знак, что по коридору идёт обход */
  var pat = !!(f.beat || f.patrol);
  if (outOfEar(f, f.boss ? 30 : pat ? 24 : 20, pat ? 14 : 12)) return;
  /* летающая машина не шагает — слышно, как она жужжит */
  var beh0 = (f.base && f.base.beh) || [];
  if (beh0.indexOf("fly") >= 0) {
    var now0 = Date.now();
    if (hoverT[f.id] && now0 - hoverT[f.id] < (pat ? 900 : 1500)) return;
    hoverT[f.id] = now0;
    atFoe(has(f.snd + "_idle") ? f.snd + "_idle" : "robot_idle", f.x, f.y, { gain: pat ? 0.85 : 0.6, rate: (f.base && f.base.sndRate) || 1 });
    return;
  }
  if (Math.random() < 0.35 && f.kind === "bio" && !/rat|roach|micro/.test(f.type)) return;
  var id = f.kind === "mech" ? (has(f.snd + "_step") ? f.snd + "_step" : "robot_step") : (has(f.snd + "_step") ? f.snd + "_step" : "mutant_step");
  atFoe(id, f.x, f.y, { gain: f.boss || pat ? 1 : 0.65, rate: ((f.base && f.base.sndRate) || 1) * (f.boss ? 0.8 : 1) });
}
function foeHit(f, dt, dmg, crit) { atFoe(f.kind === "mech" ? "hit_metal" : "hit_flesh", f.x, f.y, { gain: crit ? 1.2 : 0.9 }); if (Math.random() < 0.5) foeSound(f, "hurt"); }
/* Гибель врага (1.6: ярче и слоистее): крик или треск самой машины, затем
   у роботов — взрыв, разряд и осыпающиеся обломки, у тварей — удар тела
   об пол и хрип; босс — тяжёлый взрыв. */
function foeDeath(f) {
  var id = foeSet(f) + "_death", mech = f.kind === "mech";
  atFoe(has(id) ? id : (mech ? "robot_death" : "mutant_death"), f.x, f.y, { gain: 1.4, rate: ((f.base && f.base.sndRate) || 1) * (f.boss ? 0.8 : 1) });
  if (mech) {
    atFoe("explosion_small", f.x, f.y, { gain: 0.95, delay: 0.1 });
    atFoe("ev_electric", f.x, f.y, { gain: 0.7, delay: 0.32, fb: function (s) { s.zap(); } });
    atFoe("debris", f.x, f.y, { gain: 0.9, delay: 0.5 });
    atFoe("debris", f.x, f.y, { gain: 0.5, delay: 0.95, rate: 1.2 });
  } else {
    atFoe("hit_flesh", f.x, f.y, { gain: 0.9, delay: 0.3 });
    atFoe("bump_body", f.x, f.y, { gain: 0.8, delay: 0.55, rate: 0.8 });
    atFoe("mutant_death", f.x, f.y, { gain: 0.35, delay: 0.7, rate: 0.6, fb: function (s) { s.growl(); } });
  }
  if (f.boss) atFoe("explosion_big", f.x, f.y, { gain: 1, delay: mech ? 0.6 : 0.9 });
  sub((f.name || "").split(",")[0] + " — повержен");
}
function foeMiss(f, ranged) { play(ranged ? "bullet_by" : "swing_by", { ch: "foe", gain: 0.8, pan: (f.x - G().x) > 0 ? 0.5 : (f.x - G().x) < 0 ? -0.5 : 0 }); }
function hurt(adt, dmg, src) {
  play("hurt_" + (adt || "phys"), { gain: 0.9 });
  if (dmg > (G() ? G().hpMax * 0.12 : 20)) play("player_pain", { gain: 0.8, delay: 0.05 });
  heartCheck();
}

/* ════════ ВЫСТРЕЛЫ ГЕРОЯ ════════ */
/* Выстрел: запись оружия, а у мощного — ещё низкий удар и треск разряда:
   чем круче оружие (редкость, качество, класс), тем мощнее звук. */
var HEAVY_CLS = { positron: 2, gauss: 2, plasma: 1, magnetron: 1, grav: 2, phase: 1, sonic: 1 };
function shot(w, dir, burst) {
  var v = DIRV[dir] || [0, -1], b = LAB.WEAPONS[w.base] || {};
  var id = b.snd || "w_blaster_s";
  if (!has(id)) id = b.cls === "magnetron" ? "w_magnetron" : "w_blaster_s";
  var power = (w.rank || 0) + Math.max(0, (w.qual || 1) - 2) * 0.5 + (HEAVY_CLS[b.cls] || 0) + (b.dmg >= 30 ? 1 : 0) + (b.area || b.pierce ? 1 : 0);
  /* глушитель: выстрел тише и глуше — без раската и треска разряда */
  var q = (w.mod && w.mod.quiet) || 0;
  if (q) power -= 2 * q;
  play(id, { ch: "weap", pan: v[0] * 0.35, gain: (burst ? 0.9 : 1.05) * (1 - 0.28 * q), rate: (b.sndRate || 1) * (burst ? 1.03 : 1) * (1 - 0.05 * q), reverb: q ? 0.15 : 0.3 });
  if (b.cls === "melee") { if (b.dt === "shock") play("w_shock_crack", { ch: "weap", pan: v[0] * 0.3, gain: 0.8, fb: FB.w_shock_crack }); return; }
  if (power >= 2) play("w_power_low", { ch: "weap", pan: v[0] * 0.2, gain: Math.min(1, 0.35 + power * 0.12) * (burst ? 0.7 : 1), rate: 1 - Math.min(0.15, power * 0.02), reverb: 0.4, fb: FB.w_power_low });
  if (power >= 4) play("w_power_crack", { ch: "weap", pan: v[0] * 0.4, gain: Math.min(0.9, 0.25 + power * 0.08), delay: 0.04, reverb: 0.5, fb: FB.w_power_crack });
  /* самое мощное — ещё и раскат под сводами */
  if (power >= 6 && !burst && has("w_power_tail")) play("w_power_tail", { ch: "weap", pan: v[0] * 0.2, gain: Math.min(0.9, 0.3 + (power - 6) * 0.1), delay: 0.08, reverb: 0.7 });
}
function shotWall(w, x, y) { var cls = LAB.WEAPONS[w.base].cls; at(cls === "positron" ? "impact_positron" : cls === "magnetron" ? "impact_wave" : "impact_wall", x, y, { gain: 0.8 }); }
function shotMiss(w, f) { at("impact_wall", f.x + (Math.random() < 0.5 ? 1 : -1), f.y, { gain: 0.7 }); }
function swingMiss(w) { play("swing_miss", { gain: 0.8 }); }
/* ── (2.6) Гранаты, мины и взрывы: у каждого вида — свой звук ──
   Взрыв звучит слоями: сам удар, осколки и звон металла, осыпь; у мины —
   щелчок взрывателя перед ударом, у растяжки — рывок проволоки и звяк
   упавшей гранаты; у зажигательной — вспышка и треск огня, у светошумовой —
   хлопок, у звуковой — хлопок с гулом и звоном, у крио — лёд, у газовой и
   кислотной — шипение, у кассетной — россыпь малых разрывов вокруг. Слой:
   [запись, громкость, задержка (с), отзвук, высота]. Далеко — глуше. */
var EXPL = {
  frag: [["explosion_frag", 1.2, 0, 0.6], ["explosion_shrapnel", 0.55, 0.1, 0.45], ["debris", 0.5, 0.45, 0.5]],
  mine: [["mine_click", 0.8, 0, 0.15], ["explosion_small", 1.2, 0.1, 0.6], ["debris", 0.5, 0.5, 0.5]],
  claymore: [["mine_click", 0.7, 0, 0.15], ["explosion_frag", 1.2, 0.08, 0.6], ["explosion_shrapnel", 0.75, 0.12, 0.45]],
  wire: [["wire_snap", 0.9, 0, 0.2], ["grenade_land", 0.7, 0.08, 0.3], ["explosion_frag", 1.2, 0.35, 0.6], ["debris", 0.45, 0.8, 0.5]],
  charge: [["mine_beep", 0.6, 0, 0.1], ["explosion_big", 1.2, 0.15, 0.7], ["debris", 0.6, 0.7, 0.5]],
  big: [["explosion_big", 1.25, 0, 0.7], ["explosion_shrapnel", 0.5, 0.12, 0.45], ["debris", 0.7, 0.6, 0.5]],
  bot: [["explosion_small", 1.1, 0, 0.6], ["explosion_shrapnel", 0.45, 0.08, 0.4], ["debris", 0.45, 0.4, 0.5]],
  fire: [["explosion_fire", 1.2, 0, 0.5]],
  net: [["explosion_net", 1.0, 0, 0.3]],
  acid: [["acid_burst", 1.1, 0, 0.5], ["acid_sizzle", 0.7, 0.1, 0.3]],
  gas: [["explosion_gas", 1.0, 0, 0.3]],
  flash: [["explosion_flash", 1.3, 0, 0.7]],
  sonic: [["explosion_flash", 1.1, 0, 0.8, 0.78], ["ev_ring_whine", 0.5, 0.15, 0.6]],
  cryo: [["explosion_cryo", 1.15, 0, 0.5]],
  emp: [["emp_blast", 1.2, 0, 0.6], ["explosion_zap", 0.75, 0, 0.4]],
  positron: [["explosion_flash", 0.9, 0, 0.6, 1.25], ["impact_positron", 0.9, 0.02, 0.5]],
  grav: [["explosion_big", 0.9, 0, 0.8, 0.72], ["ev_phase", 0.6, 0.06, 0.5]],
  cluster: [["explosion_frag", 1.15, 0, 0.6], ["explosion_shrapnel", 0.5, 0.1, 0.45]]
};
EXPL.shell = EXPL.big;
/* где гремит, а не шипит и не звенит: издалека слышно одно глухое «бум» */
var BLAST = { frag: 1, mine: 1, claymore: 1, wire: 1, charge: 1, big: 1, shell: 1, bot: 1, cluster: 1 };
function explosion(x, y, kind) {
  var g = G(), d = g ? Math.max(Math.abs(x - g.x), Math.abs(y - g.y)) : 6, far = d >= 14;
  var lay = EXPL[kind] || EXPL.frag;
  /* далеко: от взрыва — глухой раскат, осколки и осыпь не слышны; прочее — только главный слой, приглушённый */
  if (far) lay = BLAST[kind] && has("explosion_far") ? [["explosion_far", 1.1, 0, 0.8]] : lay.slice(0, 1);
  lay.forEach(function (l) {
    at(l[0], x, y, { gain: l[1] * (far ? 0.85 : 1), delay: l[2], reverb: Math.min(1, l[3] + (far ? 0.2 : 0)), rate: l[4] || 1, lp: far ? 1600 : null });
  });
  /* светошумовая и звуковая рядом — звон в ушах */
  if ((kind === "flash" || kind === "sonic") && d <= 3 && has("explosion_ring")) play("explosion_ring", { gain: 0.6, delay: 0.25, bus: "fx" });
  /* кассетная: малые заряды рассыпаются вокруг и рвутся один за другим */
  if (kind === "cluster" && !far) for (var i = 0; i < 4; i++) {
    var an = i * Math.PI / 2 + 0.6;
    at("explosion_small", Math.round(x + Math.cos(an) * 2), Math.round(y + Math.sin(an) * 2), { gain: 0.9, delay: 0.28 + i * 0.16 + Math.random() * 0.07, reverb: 0.55 });
  }
  if (g && d <= 2) LAB.vib(kind === "big" || kind === "shell" || kind === "charge" || kind === "cluster" ? [90, 50, 160] : [60, 40, 120]);
}
/* Бросок: чека и замах — у вас в руках, падение на металл пола — там, где
   граната легла, через время полёта (не позже, чем она рванёт: fuse, мс). */
function grenade(x, y, o) {
  o = o || {};
  var g = G(), d = g ? Math.max(Math.abs(x - g.x), Math.abs(y - g.y)) : 3, t = 0;
  if (!o.noPin && has("grenade_pin")) { play("grenade_pin", { gain: 0.85, ch: "weap" }); t = 0.16; }
  play("grenade_throw", { delay: t, gain: 0.9, ch: "weap" });
  var land = t + 0.2 + 0.04 * d;
  if (o.fuse) land = Math.max(0.1, Math.min(land, o.fuse / 1000 - 0.12));
  at("grenade_land", x, y, { delay: land });
}
function shellIncoming(x, y) { at("shell_whistle", x, y, { gain: 1.1 }); sub("Свист снаряда!"); }
function mineBeep(x, y) { at("mine_beep", x, y, { gain: 0.8, bus: "ui" }); }
function dropLoot(x, y) { at("loot_drop", x, y, { gain: 0.7 }); }
function implant(id) { play("implant_" + id, { fb: FB.implant }); }
/* (3.0) Завал на лестнице (rubble.js): подход — три удара по бетону с осыпью
   (монтировкой — звон металла и рывок), домкрат — шипение гидравлики, стон
   плиты и шорох; проход свободен — осыпь и глухой удар упавшей плиты. */
function rubbleWork(x, y, how) {
  if (how === "jack") {
    at("ev_steam", x, y, { gain: 0.45, rate: 0.8 });
    at("ev_metal_groan", x, y, { gain: 0.7, delay: 0.9 });
    at("debris", x, y, { gain: 0.45, delay: 1.9, rate: 0.9 });
    return;
  }
  var bar = how === "bar";
  for (var i = 0; i < 3; i++) {
    at(bar ? "hit_metal" : "rubble_hit", x, y, { gain: 0.85, delay: i * 0.8, rate: 0.9 + Math.random() * 0.2 });
    at("debris", x, y, { gain: 0.5, delay: i * 0.8 + 0.25, rate: 0.85 + Math.random() * 0.3 });
  }
  if (bar) at("pry", x, y, { gain: 0.7, delay: 2.0 });
}
function rubbleClear(x, y, how) {
  if (how === "blast") { at("debris", x, y, { gain: 0.9, delay: 0.9, rate: 0.75, reverb: 0.7 }); return; }
  at("debris", x, y, { gain: 1, rate: 0.8, reverb: 0.6 });
  at("bump_wall_thud", x, y, { gain: 0.8, delay: 0.35 });
  at("debris", x, y, { gain: 0.7, delay: 0.7, rate: 1.1 });
}
/* ОКО: позывной громкой связи, тревога, приманка. */
/* Сигнал перед словами ОКО. (3.1) У каждого облика свой (okoforms.js); t — сколько
   пройдено в блоке: чем глубже, тем сильнее меняется. */
function okoChime(kind, t) {
  t = t || 0;
  var C0 = { bus: "fx", fb: FB.oko_chime };
  function ch(o) { var q = {}; for (var k in C0) q[k] = C0[k]; for (var k2 in o) q[k2] = o[k2]; play("oko_chime", q); }
  switch (kind) {
    case "far": /* «Подножие»: из-под земли — ниже, глуше, сквозь треск старых динамиков «Око-0» */
      ch({ gain: 0.78 - 0.22 * t, rate: 0.9 - 0.16 * t, lp: Math.round(2600 - 1500 * t), reverb: 0.85 + 0.1 * t });
      play("radio", { gain: 0.1 + 0.28 * t, rate: 0.8, lp: 2600, bus: "fx", reverb: 0.3 });
      return;
    case "garden": /* «Колыбель»: Садовник — два тихих колокола, и сигнал тонет */
      play("ins_bell_72", { gain: 0.42 - 0.14 * t, bus: "fx", reverb: 0.75 });
      play("ins_bell_77", { gain: 0.34 - 0.12 * t, delay: 0.22, bus: "fx", reverb: 0.8 });
      return;
    case "far3": /* «Отражение»: настоящее ОКО далеко — глухо, с отзвуком; рядом передразнивает Зрачок */
      ch({ gain: 0.55 - 0.25 * t, rate: 0.94, lp: Math.round(2000 - 800 * t), reverb: 0.95 });
      ch({ gain: 0.26, rate: 1.06, pan: -0.6, delay: 0.09, reverb: 0.15 });
      return;
    case "pupil": /* Зрачок вплотную: тот же сигнал, но зеркально — слева, потом справа, и звон стекла */
      ch({ gain: 0.8, rate: 1.06, pan: -0.7, reverb: 0.1 });
      ch({ gain: 0.6, rate: 1.06, pan: 0.7, delay: 0.14, reverb: 0.1 });
      play("ev_glass", { gain: 0.22, delay: 0.05, rate: 1.3, bus: "fx", reverb: 0.2 });
      return;
    case "m_guard": /* «Механизм»: Сторож — низкий удар */
      ch({ gain: 0.95, rate: 0.7, reverb: 0.5 });
      return;
    case "m_count": /* Счетовод — счёты */
      play("pc_click", { gain: 0.5, bus: "fx", reverb: 0.2 });
      play("pc_click", { gain: 0.5, delay: 0.09, rate: 1.2, bus: "fx", reverb: 0.2 });
      play("pc_click", { gain: 0.5, delay: 0.18, rate: 1.4, bus: "fx", reverb: 0.2 });
      ch({ gain: 0.45, rate: 1.3, delay: 0.24, reverb: 0.3 });
      return;
    case "m_garden": /* Садовник города — колокол и мягкий сигнал */
      play("ins_bell_67", { gain: 0.4, bus: "fx", reverb: 0.7 });
      ch({ gain: 0.45, rate: 1.1, delay: 0.15, reverb: 0.6 });
      return;
    case "m_tale": /* Сказочник — музыкальная шкатулка */
      play("ins_lullaby_86", { gain: 0.4, bus: "fx", reverb: 0.5 });
      play("ins_lullaby_93", { gain: 0.35, delay: 0.2, bus: "fx", reverb: 0.5 });
      play("ins_lullaby_98", { gain: 0.3, delay: 0.4, bus: "fx", reverb: 0.5 });
      return;
    case "whole": /* ОКО целиком — ниже и шире, с подголоском на октаву ниже */
      ch({ gain: 1, rate: 0.85, reverb: 0.8 });
      ch({ gain: 0.35, rate: 0.425, delay: 0.05, reverb: 0.9 });
      return;
  }
  ch({ gain: 0.9, reverb: 0.6 });
}
function okoAlarm() {
  if (has("oko_alarm")) play("oko_alarm", { gain: 0.8, reverb: 0.5 });
  else play("ev_alarm_start", { gain: 0.8, reverb: 0.5 });
  play("alarm_short", { gain: 0.6, delay: 0.3 });
}
/* Сирена комплексной тревоги и аварийной блокировки ОКО — своя ячейка. */
var sirenOn = null;
function alarmLayer(on) {
  if (on && !sirenOn) sirenOn = loop("evl_alarm", { bus: "amb", ch: "alarm", gain: 0.32, fadeIn: 1.5 }, "siren");
  else if (!on && sirenOn) { sirenOn.stop(2); sirenOn = null; }
}
/* Камера ОКО переводит взгляд: тихий сервопривод под потолком. */
function camTurn(f) { atFoe("turret_servo", f.x, f.y, { gain: 0.3, rate: 1.6, fb: FB.turret_servo }); }
/* Мимик выдаёт себя: «прибор» гудит с биением, чуть ниже и неровнее настоящих. */
function mimicHum(f) { atFoe("ev_transformer", f.x, f.y, { gain: 0.32, rate: 0.78 + Math.random() * 0.08, fb: FB.mimic_hum }); }
/* Перегретая турель шипит и потрескивает, остывая. */
function turretHot(f) { atFoe("ev_steam", f.x, f.y, { gain: 0.5, rate: 1.3, fb: FB.turret_hot }); atFoe("turret_servo", f.x, f.y, { gain: 0.25, rate: 0.6, delay: 0.4, fb: FB.turret_servo }); }
function noiseLure(x, y) {
  for (var i = 0; i < 6; i++) atFoe("mine_beep", x, y, { gain: 0.9, delay: i * 0.45, rate: i % 2 ? 1.2 : 1 });
  atFoe("impact_wall", x, y, { gain: 0.8, delay: 0.1 });
}

/* ════════ МУЗЫКА ════════
   Записи, если есть (mus_menu, mus_game, mus_ending), иначе — давящий
   генеративный фон: инфранизкий гул с биениями, тритоны, скрежет металла
   в глубине, редкий тяжёлый удар — сердце комплекса. */
var mus = { theme: "", key: "", tid: "", h: null, s: null, timers: [] };
function music(theme) {
  var L = G() ? G().L : 1;
  var key = theme === "game" ? "game" + L : theme;
  if (key === mus.key && (mus.h || mus.s)) return;
  /* тот же трек на соседнем уровне — играет дальше, не начинается заново */
  if (theme === "game" && mus.theme === "game" && mus.h && mus.tid && mus.tid === levelMusic(L) && has(mus.tid)) { mus.key = key; return; }
  stopMusic();
  mus.theme = theme; mus.key = key;
  if (!S.music || !AE.ensure()) return;
  var tid = theme === "game" ? levelMusic(L) : "mus_" + theme;
  if (theme === "game" && !has(tid)) tid = "mus_l" + (((L - 1) % 10) + 1);
  if (has(tid)) {
    mus.tid = tid;
    mus.h = loop(tid, { bus: "music", gain: 1, fadeIn: 4, reverb: 0 }, "music");
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
/* Музыка уровня: до Ядра — своя у каждого уровня; глубже — набор блока
   (mus_b<блок>_<n>), трек меняется каждые несколько уровней. */
function levelMusic(L) {
  if (L <= 10) return "mus_l" + L;
  var b = LAB.blockOf(L), set = [];
  for (var i = 1; i <= 8; i++) if (has("mus_b" + b + "_" + i)) set.push("mus_b" + b + "_" + i);
  if (!set.length) return "mus_l" + (((L - 1) % 10) + 1);
  /* у первого блока свои треки — только ниже Ядра (уровни 11–20) */
  var first = b === 1 ? 11 : (b - 1) * 20 + 1, span = b === 1 ? 10 : 20;
  var k = Math.floor((L - first) * set.length / span);
  return set[Math.max(0, Math.min(set.length - 1, k))];
}
/* Что играет сейчас: запись и звучит ли она (для самопроверки). */
function musicNow() { var sl = Snd.state().slots.music; return { id: mus.tid, on: !!(sl && sl.on && sl.id === mus.tid), synth: !!mus.s }; }
function musicVolume() { AE.applyVolumes(); if (!S.music) stopMusic(); else if (!mus.theme) music(LAB.ui && LAB.ui.screen() === "game" ? "game" : "menu"); }

function genMusic(theme, L) {
  var s = new LAB.SFX(AE.music);
  mus.s = s;
  /* (3.0) устройство спит (игра в фоне без звука) — аккорды, скрежет и удары не заказываются:
     иначе за долгий фон они копились бы сотнями и грянули разом при возвращении */
  s.live = function () { return s.ctx.state === "running" && !(LAB.bgMuted && LAB.bgMuted()); };
  var c = s.ctx, t0 = c.currentTime;
  var deep = theme === "game" ? (depthL(L) - 1) / 9 : theme === "menu" ? 0.6 : 0.4;
  var root = theme === "game" ? LAB.LEVELS[L].root / 4 : theme === "menu" ? 41.2 : theme === "ending" ? 55 : 46.25;
  /* глубже Ядра основной тон уходит под слух — поднимаем его октавами */
  while (root < 20) root *= 2;
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
    if (s.stopped || !s.live()) return;
    var t = c.currentTime + 0.05, ch = chords[ci % chords.length]; ci++;
    ch.forEach(function (m, i) { pad(s, root * m, t, 13, [0.03, 0.022, 0.018, 0.012][i] * (theme === "ending" ? 1.3 : 1), theme === "ending" ? 1400 : 520 + deep * 120); });
  };
  chord();
  mus.timers.push(setInterval(chord, 12500));
  /* 3. Скрежет металла в глубине: резонанс шума с длинным хвостом */
  if (theme !== "ending") {
    var groan = function () {
      if (s.stopped || !s.live()) return;
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
    if (s.stopped || !s.live()) return;
    var t = c.currentTime + 0.05, o = s.osc("sine", 52), g = s.gain(0.0001);
    o.connect(g); g.connect(s.out()); s.send(g, 0.5);
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.start(t); o.stop(t + 1.3);
    if (theme === "game" && L === 10) setTimeout(function () { if (!s.stopped) { var o2 = s.osc("sine", 40), g2 = s.gain(0.0001); o2.connect(g2); g2.connect(s.out()); var tt = c.currentTime; g2.gain.linearRampToValueAtTime(0.1, tt + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.8); o2.start(tt); o2.stop(tt + 0.9); } }, 330);
  }, beatGap));
  /* 5. Тонкий звон под потолком: нерв */
  mus.timers.push(setInterval(function () {
    if (s.stopped || !s.live() || Math.random() < 0.45) return;
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
  explosion_frag: function (s) { s.boom(0.75); }, explosion_flash: function (s) { s.boom(0.5); s.note(3200, 0.05, 1.2, "sine", 0.02); }, mine_click: function (s) { s.note(1800, 0, 0.03, "square", 0.05); },
  robot_alert: function (s) { s.chirp([700, 1400, 700]); }, mutant_alert: function (s) { s.roar(); }, robot_attack: function (s) { s.zap(); }, mutant_attack: function (s) { s.growl(); },
  robot_death: function (s) { s.zap(); s.clang(200); }, mutant_death: function (s) { s.screech(); }, robot_step: function (s) { s.servo(Math.random() < 0.5); }, mutant_step: function (s) { s.footstep(0); },
  foe_aim: function (s) { s.charge(0.4); }, hurt_phys: function (s) { s.thump(0, 0.6); }, implant: function (s) { s.charge(0.5); },
  heartbeat: function (s) { s.thump(0, 0.5); }, gate_open: function (s) { s.servo(true); s.hum(60, 3, 0.1); }, gate_seal: function (s) { s.boom(0.8); s.clang(70); },
  shell_whistle: function (s) { s.whoosh(false); }, mine_beep: function (s) { s.note(2400, 0, 0.05, "square", 0.04); },
  bump_wall_thud: function (s) { s.thump(0, 0.55); },
  turret_servo: function (s) { s.servo(true); },
  w_power_low: function (s) { s.thump(0, 0.7); },
  w_power_crack: function (s) { s.zap(); },
  w_shock_crack: function (s) { s.zap(); },
  oko_chime: function (s) { s.note(784, 0, 0.35, "sine", 0.09); s.note(523, 0.32, 0.5, "sine", 0.09); },
  power_off: function (s) { s.servo(false); s.note(120, 0, 0.6, "sawtooth", 0.05); },
  deaf_ring: function (s) { s.note(3900, 0, 2.2, "sine", 0.03); },
  /* еда, лекарства, тело — пока нет записи */
  eat_crunch: function (s) { s.crackle(); s.after(180, function () { s.crackle(); }); s.after(420, function () { s.crackle(); }); },
  eat_chew: function (s) { s.thump(0, 0.18); s.after(260, function () { s.thump(0, 0.15); }); s.after(520, function () { s.thump(0, 0.15); }); },
  food_wrapper: function (s) { s.crackle(); s.after(120, function () { s.crackle(); }); },
  pills_rattle: function (s) { s.tink(3200); s.after(70, function () { s.tink(2800); }); s.after(150, function () { s.tink(3400); }); s.after(240, function () { s.tink(3000); }); },
  bandage_tear: function (s) { s.hiss(); },
  stomach_growl: function (s) { s.growl(); },
  cough: function (s) { s.thump(0, 0.3); s.hiss(); },
  yawn: function (s) { s.hum(180, 1.2, 0.05); },
  spray: function (s) { s.hiss(); },
  water_pour: function (s) { s.hiss(); s.after(300, function () { s.hiss(); }); },
  snack_drop: function (s) { s.servo(true); s.after(600, function () { s.thump(0, 0.5); }); },
  power_on: function (s) { s.servo(true); s.note(120, 0.1, 0.5, "sawtooth", 0.05); s.note(240, 0.3, 0.4, "sawtooth", 0.04); },
  mimic_hum: function (s) { s.hum(92, 1.1, 0.05); },
  turret_hot: function (s) { s.hiss(); },
  combat_clear: function (s) { s.note(660, 0, 0.18, "sine", 0.06); s.note(880, 0.16, 0.3, "sine", 0.05); }
};

/* Звуковое устройство пересоздано (единый обработчик сам запустил петли
   записей): синтез — запасной гул уровня (если запись не загрузилась),
   напряжение боя и синтезированная музыка — запускается заново. */
Snd.onRebuild(function () {
  var g = G();
  if (synthBedS) { synthBedS = null; if (worldOn && g) synthBed(g.L); }
  if (tension) { try { if (tension.s && tension.s.stop) tension.s.stop(0); } catch (e) { /* */ } tension = null; startTension(); }
  if (mus.s) { var th = mus.theme; try { if (mus.s.stop) mus.s.stop(0); } catch (e) { /* */ } mus.s = null; mus.key = ""; mus.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); mus.timers = []; if (th) music(th); }
});

LAB.atmos = {
  _chOf: function (id, o) { return chOf(id, o || {}); },
  play: play, at: at, has: has,
  _bed: function () { return !!(bed && (bed.h || synthBedS)); }, _sources: function () { return lastSources; },
  enterFloor: enterFloor, setRoom: setRoom, setEvent: setEvent, stopWorld: stopWorld,
  step: step, bump: bump, bumpWall: bumpWall, bumpSoft: bumpSoft, near: near, doorOpen: doorOpen, doorClose: doorClose, doorPass: doorPass, objUse: objUse,
  container: container, stairs: stairs, stairEnter: stairEnter, stairStep: stairStep, bumpRail: bumpRail, gate: gate, gateSeal: gateSeal, elevRide: elevRide, rest: rest, death: death, npcHello: npcHello,
  navPing: navPing, navStart: navStart, pickup: pickup,
  foeSound: foeSound, foeStep: foeStep, foeHit: foeHit, foeDeath: foeDeath, foeMiss: foeMiss, hurt: hurt,
  shot: shot, shotWall: shotWall, shotMiss: shotMiss, swingMiss: swingMiss, explosion: explosion, grenade: grenade, shellIncoming: shellIncoming,
  mineBeep: mineBeep, dropLoot: dropLoot, implant: implant, rubbleWork: rubbleWork, rubbleClear: rubbleClear, combatLevel: combatLevel, okoChime: okoChime, okoAlarm: okoAlarm, noiseLure: noiseLure, deafen: deafen,
  alarmLayer: alarmLayer, camTurn: camTurn, mimicHum: mimicHum, turretHot: turretHot,
  music: music, stopMusic: stopMusic, musicVolume: musicVolume, musicNow: musicNow, preloadLevel: preloadLevel, idsFor: idsFor
};
})();
