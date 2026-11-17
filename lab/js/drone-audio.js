/* Монтаж натурных записей из звукового набора игры.
   Исходники и лицензии перечислены в sounds/CREDITS.md и tools/build_sounds.py.
   Все фрагменты идут напрямую через шины микшера. */
(function () {
"use strict";
var LAB = window.LAB;
var textures = {
  weapons: ["work_pass","mw_fry"], sensors: ["drone_ping","pwr_click"],
  service: ["work_ratchet","work_file"], armor: ["drone_hit","work_hammer"],
  cargo: ["exo_servo","pack_heavy"], energy: ["pwr_click","mw_hum"],
  control: ["pwr_click","work_ratchet"]
};
var shots = {
  pulse:["work_pass","mw_fry"], rail:["rail_barrel","drone_hit","mw_hum"], cryo:["ev_steam","work_pass"],
  plasma:["mw_fry","ev_steam","pwr_click"], arc:["mw_fry","work_pass","mw_fry"],
  sonic:["drone_hit","drone_ping"], ion:["mw_hum","mw_fry"]
};
var services = {
  hemo:["paper_turn","pwr_click"], purifier:["ev_steam","work_pass"], insulator:["pwr_click","mw_hum"],
  welder:["work_weld","work_pass"], selfkit:["exo_servo","work_ratchet"], tailor:["work_file","paper_turn"]
};
var scans = {
  life_array:["drone_ping","paper_turn"], machine_eye:["exo_servo","drone_ping"], depot_scope:["drone_ping","work_ratchet"],
  latch_scope:["pwr_click","drone_ping"], lab_scope:["mw_hum","drone_ping"], evac_scope:["drone_ping","work_pass"]
};
var operations = {
  fire:shots, service:services, scan:scans,
  energy:{ regen:["exo_servo","mw_hum"], link_amp:["pwr_click","mw_hum","work_pass"], charger:["pwr_click","mw_hum"] },
  move:{ cargo:["exo_servo","pack_heavy"] },
  armor:{ mesh:["drone_hit","work_ratchet"] }
};
function stamp(id) {
  var h = 13;
  for (var i = 0; i < id.length; i++) h = ((h * 37) + id.charCodeAt(i)) >>> 0;
  return h;
}
function familyGroup(family) {
  var f = LAB.droneCatalog.directions[family], metric = f && f.metric;
  if (/^fire|status/.test(metric)) return "weapons";
  if (/^scan|mark/.test(metric)) return "sensors";
  if (/^repair|^heal|^clean|^service/.test(metric)) return "service";
  if (/^armor|^guard/.test(metric)) return "armor";
  if (/^capacity|^haul|^stride|^noise/.test(metric)) return "cargo";
  return "energy";
}
function layers(event, id, model) {
  if (operations[event] && operations[event][id]) return operations[event][id];
  var key = model || id, def = LAB.drone.MODS[key], cat = LAB.droneCatalog;
  var family = event === "role" ? cat.roles[id] && cat.roles[id].direction : event === "direction" ? cat.programs[id] && cat.programs[id].family : null;
  var texture = textures[def ? def.group : family ? familyGroup(family) : "control"];
  if (event === "remove") return ["work_ratchet", texture[1]];
  if (event === "mount") return ["work_pass", texture[0]];
  if (event === "craft") return ["work_file", texture[0], "pwr_click"];
  if (event === "tune") return ["pwr_click", texture[1]];
  return [event === "role" ? "work_pass" : "pwr_click", texture[0], "pwr_click"];
}
function plan(event, id, model, speaking) {
  var h = stamp(event + ":" + id), body = event === "fire" || event === "scan" || event === "service" || event === "move" || event === "armor";
  var base = (event === "fire" ? 0.42 : event === "move" ? 0.19 : 0.34) * (speaking ? 0.60 : 1);
  return layers(event, id, model).map(function (clip, i) {
    var v = h >>> (i * 7), pitch = 0.92 + (v % 190) / 1000;
    return { clip:clip, gain:base * [1,.52,.28][i], rate:pitch, variant:v % 7,
      delay:i === 0 ? 0 : (i * 0.145 + (v % 50) / 1000),
      lp: i === 0 ? 15000 : 7500 + v % 4500, bus:body ? "fx" : "ui", priority:body ? 1 : 2 };
  });
}
function play(event, id, model, target) {
  var sound = LAB.Sound, g = LAB.game.G;
  if (!sound || typeof sound.play !== "function") return;
  plan(event, id, model, LAB.Speech && LAB.Speech.speaking).forEach(function (p, i) {
    if (!LAB.SND[p.clip]) return;
    var at = target && i === 0 ? { dx:target.x - g.x, dy:target.y - g.y, occ:false } : null;
    sound.play(p.clip, { gain:p.gain, rate:p.rate, variant:p.variant, delay:p.delay, bus:p.bus, lp:p.lp, prio:p.priority,
      at:at, pan:at ? undefined : p.bus === "fx" ? (i ? 0.20 : -0.18) : 0, wait:220, fb:null });
  });
}
LAB.droneAudio = { play:play, plan:plan };
})();
