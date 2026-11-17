/* Работа сменного оборудования. Оплата идёт после проверки цели и возможности действия. */
(function () {
"use strict";
var LAB = window.LAB, drone = LAB.drone;
function game() { return LAB.game; }
function dist(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function view(o) {
  var g = game(), p = g.G;
  return LAB.los(g.CUR.fl, g.CUR.fs, p.x, p.y, o.x, o.y);
}
function byDistance(items) { var g = game().G; return items.sort(function (a, b) { return dist(g, a) - dist(g, b); }); }
function foes(radius) { return byDistance(drone.hostiles(radius)); }
function shortName(o) { return String(o.name || "Враг").split(",")[0]; }
function shot(k, cfg) {
  var radius = cfg.range + Math.floor(drone.adjust("fireRange", k));
  var list = foes(radius);
  var eligible = cfg.target ? list.filter(function (f) { return f.kind === cfg.target; }) : list;
  var primary = drone.weaponTarget(k, eligible);
  if (!primary) return "Нет подходящей цели по открытой линии.";
  var cur = game().CUR;
  var jump = cfg.chain ? cfg.chain + Math.floor(drone.adjust("chainReach", k)) : 0;
  var chain = jump && eligible.filter(function (f) {
    return f !== primary && dist(f, primary) <= jump && LAB.los(cur.fl, cur.fs, primary.x, primary.y, f.x, f.y);
  }).sort(function (a, b) { return dist(a, primary) - dist(b, primary); })[0];
  return function () {
    var d = drone.D(), g = game().G;
    var scale = (1 + 0.14 * (LAB.foeLevel(g.L, g.F) - 1)) * (1 + 0.06 * (d.lvl - 1));
    function hit(target, fraction) {
      var flags = drone.targetFlags(target), balance = 1 + drone.adjust("firePower", k, flags);
      if (target.arm >= 3 && cfg.armored) balance *= cfg.armored;
      balance *= target.kind === "mech" ? cfg.machine || 1 : cfg.organic || 1;
      var amount = Math.max(1, Math.round(drone.effect(k) * scale * balance * fraction));
      var status = Math.floor(drone.adjust("status", k, flags)), hardened = target.aff && target.aff.indexOf("hardened") >= 0;
      LAB.combat.damageFoe(target, amount, cfg.type, { quiet: true, ally: true, by: "ally" });
      var beacon = drone.adjust("hitMark", k, flags);
      if (!target.dead && beacon > 0) target.mark = Math.max(target.mark || 0, Date.now() + beacon * 1000);
      if (!target.dead && !target.boss && !hardened) {
        if (cfg.slow && (cfg.type !== "cryo" || !(target.res && target.res.cryo <= 0.5))) target.frozen = Math.max(target.frozen || 0, cfg.slow + status);
        if (cfg.blind) target.blindT = Math.max(target.blindT || 0, cfg.blind + status);
        if (cfg.chain && status) target.frozen = Math.max(target.frozen || 0, Math.min(3, status));
      }
    }
    drone.recorded("fire", k, k, primary);
    hit(primary, 1);
    if (chain) hit(chain, 0.55);
    drone.hitBack(primary, 0.15);
    return "Цель «" + shortName(primary) + "»" + (chain ? ". Отражённый импульс по цели «" + shortName(chain) + "»" : "") + ".";
  };
}
var scanObjects = {
  stores: ["supply","vending","medvend","charger"],
  stations: ["workbench","terminal","chem","chemlab","labbench","charger"],
  exits: ["stairs_up","stairs_down","gate_down","gate_up","elevator","capsule","medvend","lift"]
};
function scan(k, cfg) {
  var g = game(), cur = g.CUR, radius = drone.effect(k) + Math.floor(drone.adjust("scanRange", k));
  var isFoe = cfg.target === "living" || cfg.target === "machine";
  var targets;
  if (isFoe) {
    targets = foes(radius).filter(function (f) { return cfg.target === "machine" ? f.kind === "mech" : f.kind !== "mech"; })
      .map(function (o) { return { o: o, text: shortName(o) }; });
  } else if (cfg.target === "doors") {
    targets = (cur.fl.doors || []).filter(function (o) { return !o.lock || o.lock.type !== "secret" || !!(cur.fs.secrets && cur.fs.secrets[o.id]); })
      .map(function (o) { return { o: o, text: cur.fs.doors && cur.fs.doors[o.id] === 2 ? "Открытая дверь" : "Закрытая дверь" }; });
  } else if (cfg.target === "parts") {
    targets = cur.fl.objs.filter(function (o) {
      var st = cur.fs.objs[o.id], r = cur.fl.rooms[o.room], room = r && LAB.ROOMS[r.type];
      return (o.type === "crate" || o.type === "locker") && !(st && st.open) && room && (room.loot === "parts" || room.loot === "tech");
    }).map(function (o) { return { o: o, text: g.objName(o) }; });
    g.floorItems().forEach(function (o) {
      if (o.kind === "item" && LAB.ITEMS[o.item] && LAB.ITEMS[o.item].kind === "part") targets.push({ o: o, text: g.itemName(o) });
    });
  } else {
    targets = cur.fl.objs.filter(function (o) { return scanObjects[cfg.target].indexOf(o.type) >= 0; })
      .map(function (o) { return { o: o, text: g.objName(o) }; });
    if (cfg.target === "stores") g.floorItems().forEach(function (o) {
      var item = LAB.ITEMS[o.item];
      if (o.kind === "ammo" || (item && (item.kind === "use" || item.kind === "food" || item.kind === "part"))) targets.push({ o: o, text: g.itemName(o) });
    });
  }
  targets = targets.filter(function (t) { return dist(g.G, t.o) <= radius && view(t.o); })
    .sort(function (a, b) { return dist(g.G, a.o) - dist(g.G, b.o); });
  return function () {
    var listed = targets.slice(0, drone.scanCount(k));
    drone.recorded("scan", k, k, listed.length ? listed[0].o : null);
    if (isFoe) listed.forEach(function (t) { t.o.mark = Math.max(t.o.mark || 0, Date.now() + drone.markSeconds(k) * 1000); });
    if (!listed.length) return "В пределах " + radius + " шагов подходящих целей по открытой линии нет.";
    return listed.map(function (t) { return t.text + " " + g.relDir(t.o.x, t.o.y); }).join(". ") +
      (targets.length > listed.length ? ". Ещё целей " + (targets.length - listed.length) : "") + ".";
  };
}
function serviceTarget(method, g) {
  switch (method) {
    case "hemo": return { obj: g, key: "hp", bound: g.hpMax, metric: "healPower", say: "здоровье", bleed: !!g.st.bleed };
    case "tox": return { obj: g.body, key: "tox", bound: 0, metric: "cleanPower", say: "токсины" };
    case "neuro": return { obj: g.body, key: "neuro", bound: 0, metric: "cleanPower", say: "нейронагрузка" };
    case "weapon": return { obj: game().curWeapon(), key: "cond", bound: 100, metric: "repairPower", say: "состояние оружия" };
    case "armor": return { obj: g.armor, key: "cond", bound: 100, metric: "repairPower", say: "состояние брони" };
    case "self": return { obj: drone.D(), key: "hp", bound: drone.D().hpMax, metric: "repairPower", say: "прочность дрона" };
  }
}
function service(k, cfg) {
  var g = game().G;
  if (LAB.combat.danger()) return "Устройство применяется только вне боя.";
  var t = serviceTarget(cfg.method, g);
  if (!t.obj) return "Подходящее снаряжение не выбрано.";
  var current = t.obj[t.key] == null ? t.bound : t.obj[t.key];
  var power = Math.max(0, drone.effect(k) + Math.floor(drone.adjust(t.metric, k)));
  var delta = Math.min(power, Math.abs(current - t.bound));
  if (!delta && !t.bleed) return "Восстанавливать сейчас нечего.";
  if (!(g.inv[cfg.supply] > 0)) return "Нужен расходник «" + LAB.ITEMS[cfg.supply].n + "».";
  return function () {
    g.inv[cfg.supply]--;
    t.obj[t.key] = t.bound === 0 ? current - delta : current + delta;
    if (t.bleed) g.st.bleed = 0;
    if (cfg.method === "hemo" && LAB.stats && delta) LAB.stats.healed(delta);
    drone.recorded("service", k, k);
    return (delta ? t.say + (t.bound === 0 ? " снижено на " : " восстановлено на ") + Math.round(delta * 10) / 10 + ". " : "") +
      (t.bleed ? "Кровотечение остановлено." : "");
  };
}
function command(md) { return md.weapon || md.scan || md.service; }
function run(k, auto) {
  var md = drone.MODS[k], d = drone.D();
  var cfg = md && command(md);
  function refuse(message) { if (!auto) LAB.say(message); return false; }
  if (!cfg || !drone.active() || !drone.hasMod(k) || game().G.dead || !game().CUR.fl) return refuse("Нужен выпущенный исправный дрон с этим оборудованием.");
  if (d.cd[k] > 0) return refuse("Устройство готовится к повторному применению.");
  var kind = md.weapon ? "fire" : md.scan ? "scan" : "service";
  var work = (md.weapon ? shot : md.scan ? scan : service)(k, cfg);
  if (typeof work !== "function") return refuse(work);
  if (!drone.spend(cfg.cost, k)) return refuse("Для команды не хватает заряда.");
  d.cd[k] = drone.delay(k, cfg.cycle, kind);
  var result = work();
  if (!auto) { LAB.say(md.n + ". " + result); drone.save(); }
  return true;
}
function items() {
  var d = drone.D();
  return d.mods.filter(function (k) {
    var md = drone.MODS[k];
    return md && command(md);
  }).map(function (k) {
    var md = drone.MODS[k], cfg = command(md);
    return { label: md.n + ". Расход " + drone.energyCost(cfg.cost, k) + " ед." + (d.cd[k] > 0 ? " Перезарядка " + d.cd[k] + " тактов." : ""), keep: true,
      fn: function () { run(k, false); } };
  });
}
LAB.droneOps = { run: run, items: items };
})();
