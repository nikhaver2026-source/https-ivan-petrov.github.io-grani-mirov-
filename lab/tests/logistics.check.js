#!/usr/bin/env node
/* Запуск: node lab/tests/logistics.check.js */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const noop = () => {};
const storage = new Map();
const messages = [];
const menus = [];
const ctx = vm.createContext({
  console, performance, TextDecoder, TextEncoder,
  setTimeout: () => 0, setInterval: () => 0, clearTimeout: noop, clearInterval: noop,
  addEventListener: noop, removeEventListener: noop,
  document: { addEventListener: noop, removeEventListener: noop, getElementById: () => null },
  navigator: { userAgent: "Node" }, location: { protocol: "http:" },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }
});
ctx.window = ctx;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const browserOnly = new Set(["ui", "main", "input", "atmos", "sound"].map(name => "js/" + name + ".js"));
for (const [, file] of html.matchAll(/<script src="(js\/[^"]+)"/g)) {
  if (!browserOnly.has(file)) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
}

const LAB = ctx.LAB;
const g = LAB.game, load = LAB.load, stats = LAB.stats, drone = LAB.drone, work = LAB.workshop;
const top = () => menus.at(-1);
LAB.say = text => messages.push(String(text));
LAB.atmos = {};
LAB.ui = {
  menu: (title, items, opts) => menus.push({ title, items, opts }),
  layer: () => null,
  closeTop: () => menus.pop(),
  rebuildTop() { if (top()?.opts?.rebuild) top().items = top().opts.rebuild(); }
};
LAB.deepLevelsN();
LAB.enrichLevelFoes();
const stockDrone = { lvl: 1, hp: 30, hpMax: 30, en: 0, enMax: 100, out: 1, mods: [] };
const defaultDifficulty = LAB.settings.difficulty;
for (const [difficulty, mode] of LAB.DIFF.entries()) {
  if (!mode) continue;
  LAB.settings.difficulty = difficulty;
  g.newGame();
  LAB.combat.stop();
  assert.equal(g.G.diff, difficulty);
  assert.equal(load.capacity(), 100, mode.n);
  assert.match(load.line(), /из 100 килограммов/);
  g.G.drone = { ...stockDrone };
  assert.equal(drone.carryCapacity(), 200, mode.n);
  assert.equal(load.personalCapacity(), 100);
  assert.equal(load.capacity(), 300);
}

// Изолируем пороги от веса стартового комплекта.
delete g.G.drone;
const startingPack = { inv: g.G.inv, weapons: g.G.weapons, armors: g.G.armors, ammo: g.G.ammo };
g.G.weapons = [];
g.G.armors = [];
g.G.ammo = {};
for (const [weight, tier] of [[50, 0], [50.1, 1], [100, 1], [100.1, 2], [125, 2], [125.1, 3], [150, 3], [150.1, 4]]) {
  const kg = Math.floor(weight);
  g.G.inv = { lead: kg, relay: Math.round((weight - kg) * 10) };
  assert.equal(load.total(), weight);
  assert.equal(load.tier(), tier, weight + " кг");
  assert.equal(load.canMove(), tier < 4);
  assert.equal(load.noise() > 0, tier === 2 || tier === 3);
}
g.G.inv = { lead: 149 };
assert.equal(load.canTake(1), true);
assert.equal(load.canTake(1.1), false);
const startFloor = g.CUR.fs;
const drops = startFloor.drops;
const generatedLoot = g.CUR.fl.items;
g.CUR.fl.items = [];
const droppedLead = { kind: "item", item: "lead", x: g.G.x, y: g.G.y };
startFloor.drops = [
  { ...droppedLead, id: "test-lead-fits" },
  { ...droppedLead, id: "test-lead-over" },
  { ...droppedLead, item: "chip", id: "test-chip-over" }
];
g.autoPickup();
assert.equal(g.G.inv.lead, 150);
assert.equal(startFloor.taken["test-lead-fits"], 1);
assert.equal(startFloor.taken["test-lead-over"], undefined);
assert.equal(startFloor.taken["test-chip-over"], undefined);
assert.ok(messages.some(text => /Не поднять: .*пределе 100 килограммов/.test(text)));
assert.equal(load.canTake(0), true);
assert.equal(load.canTake(load.itemWt("chip")), false);
startFloor.drops = drops;
g.CUR.fl.items = generatedLoot;

// Дрон берёт до 200 кг. Дальнейший перегруз относится только к герою.
g.G.drone = { ...stockDrone };
for (const [weight, tier] of [[250, 0], [251, 1], [300, 1], [301, 2], [325, 2], [326, 3], [350, 3], [351, 4]]) {
  g.G.inv = { lead: weight };
  assert.equal(load.tier(), tier, weight + " кг с дроном");
}
g.G.inv = { lead: 300 };
load.status();
assert.match(messages.at(-1), /На герое 100 килограммов из 100 килограммов\. На дроне 200 килограммов из 200 килограммов/);
g.G.inv.lead = 349;
assert.equal(load.canTake(1), true);
assert.equal(load.canTake(1.1), false);
drone.cmdMenu();
assert.ok(top().items.some(it => /^Свернуть дрона.*Груз станет неподъёмным/.test(it.label)));
assert.equal(drone.pack(false), true);
assert.equal(drone.carryCapacity(), 0);
assert.equal(load.parts().drone, 3.5);
assert.equal(load.tier(), 4);
assert.match(drone.cargoRecovery(), /выпустить дрона/);
assert.equal(drone.pack(true), true);
assert.equal(load.tier(), 3);
assert.equal(g.G.inv.lead, 349);
delete g.G.drone;
Object.assign(g.G, startingPack);
assert.equal(g.saveSlot(1), true);
const legacyStart = JSON.parse(storage.get(g.slotKey(1)));
delete legacyStart.g.loadInit;
legacyStart.g.inv.lead = 80;
storage.set(g.slotKey(1), JSON.stringify(legacyStart));
assert.equal(g.loadSlot(1), true);
assert.equal(load.capacity(), 100);
assert.equal(g.G.inv.lead, 80);
assert.equal(load.lockerWt(), 0);
console.log("✓ Стартовые 100 и 200 кг на всех сложностях, личный перегруз, сворачивание и старые записи");

LAB.settings.difficulty = defaultDifficulty;
g.newGame();
LAB.combat.stop();
g.enterFloor(2, 3, "down", true);
LAB.combat.stop();
let inDanger = false;
LAB.combat.danger = () => inDanger;
const hero = g.G;
hero.event = "norm";
hero.eventUntil = 1e9;

// Предпросмотр характеристик и расход очков.
assert.equal(load.capacity(), 100);
hero.xp = 0;
const xpUntilSix = [1, 2, 3, 4, 5].reduce((sum, level) => sum + LAB.xpNeed(level), 0);
g.gainXP(xpUntilSix);
assert.equal(hero.lvl, 6);
assert.equal(stats.S().pts, 1);
assert.ok(messages.some(text => text.includes("Свободных очков характеристик теперь 1")));
assert.equal(stats.spend("stam", 1), false);
stats.statMenu("con");
assert.ok(top().items.some(item => /Предел груза плюс .*Максимум здоровья плюс 5/.test(item.label)));
stats.S().pts = 5;
stats.menu();
top().items.find(item => /^Распределить поровну/.test(item.label)).fn();
assert.equal(top().title, "Распределить поровну");
assert.equal(stats.S().pts, 5);
top().items[0].fn();
assert.equal(stats.S().pts, 0);
assert.ok(stats.MAIN.every(key => stats.base(key) === 11));
assert.equal(load.capacity(), 102.8);

hero.agi = 10;
delete stats.S().day.agi;
delete stats.S().pb?.agi;
stats.S().px.agi = 0;
stats.practice("agi", 100);
assert.equal(hero.agi, 11);
assert.equal(stats.need("agi"), 56);
stats._play(120);
stats.practice("agi", 100);
stats._play(120);
stats.practice("agi", 100);
assert.equal(hero.agi, 11);
hero.day++;
stats.practice("agi", 1);
assert.equal(hero.agi, 12);
hero.cha = 14;
assert.equal(load.lockCap().slots, 11);
console.log("✓ Очки, предпросмотр и суточный предел практики");

// Верстак, физические требования и совместное использование экзокаркаса.
const bench = g.CUR.fl.objs.find(obj => obj.type === "workbench");
assert.ok(bench);
hero.x = bench.x; hero.y = bench.y;
work._at(bench);
const fixture = work.bench(bench);
fixture.tier = 3; fixture.dmg = false;
Object.values(drone.MODS).concat({ need: drone.NEED }).forEach(mod => {
  Object.keys(mod.need).forEach(part => { hero.inv[part] = 20; });
});
const beforeRig = load.capacity();
load.benchItems("bench").find(item => /^Грузовое снаряжение/.test(item.label)).fn();
top().items.find(item => /^Подогнать/.test(item.label)).fn();
assert.equal(load.capOf("rig"), 5);
assert.equal(load.capacity(), beforeRig + 5);
assert.equal(load.fitRig(), false);
hero.con = 12;
assert.equal(load.fitRig(), true);
assert.equal(load.capOf("rig"), 10);
hero.con = 14;
assert.equal(load.fitRig(), true);
assert.equal(load.capOf("rig"), 15);
hero.str = 14;
const frame = { id: "frame-test", cls: "mid", en: 100, plates: [] };
hero.frames = [frame]; hero.exoOn = frame.id;
assert.equal(load.capOf("exo"), 25);
assert.equal(load.capOf("rig"), 4);
frame.en = 0;
assert.equal(load.capOf("rig"), 15);
hero.frames = []; hero.exoOn = null;
console.log("✓ Три комплекта грузового снаряжения и общая опора с экзокаркасом");

// Рецепты, слоты, обратимый монтаж и замена источника питания.
drone.benchMenu(3);
top().items.find(item => /^Оборудование. Разведка/.test(item.label)).fn();
top().items.find(item => /^Поисковый блок/.test(item.label)).fn();
top().items.find(item => /^Собрать в запас/.test(item.label)).fn();
assert.equal(hero.inv.dr_mod_scanner, 1);
assert.equal(load.putItem("dr_mod_scanner", 1, true), 1);
assert.equal(load.locker().inv.dr_mod_scanner, 1);

const d = drone.build({ name: "Светлячок" });
assert.ok(d);
assert.equal(drone.carryCapacity(), 200);
assert.equal(load.capacity(), load.personalCapacity() + 200);
assert.match(drone.line(), /Грузоподъёмность 200 килограммов\. Корпус 200 килограммов/);
delete d.flaw;
hero.mind = 18;
assert.equal(drone.energyCost(12), 10);
assert.equal(drone.energyCost(1), 1);
inDanger = true;
assert.equal(drone.addMod("cargo"), false);
inDanger = false;
assert.equal(drone.addMod("boost"), false);
drone.benchMenu(3);
top().items.find(item => /^Оборудование\. Грузовой модуль и оснастка/.test(item.label)).fn();
assert.equal(top().title, "Грузовой модуль и оснастка");
top().items.find(item => /^Грузовой модуль[.,]/.test(item.label)).fn();
assert.equal(top().title, "Грузовой модуль");
top().items.find(item => /^Собрать и установить/.test(item.label)).fn();
assert.equal(drone.carryCapacity(), 230);
assert.match(messages.at(-1), /Корпус 200 килограммов, грузовой модуль плюс 30 килограммов/);
LAB.ui.rebuildTop();
assert.ok(top().items.some(item => /^Расширить грузовой модуль до ступени 2.*прибавка в килограммах 60/.test(item.label)));
assert.equal(drone.addMod("boost"), true);
assert.equal(load.capOf("drone"), 245);
assert.match(drone.line(), /тяговый блок плюс 15 килограммов/);
assert.equal(drone.addMod("battery"), false);
assert.equal(drone.delMod("cargo"), false);
assert.equal(drone.delMod("boost"), true);
const servos = hero.inv.servo;
assert.equal(drone.addMod("boost"), true);
assert.equal(hero.inv.servo, servos);
assert.equal(hero.inv.dr_mod_boost, 0);

hero.inv = {};
d.en = 2;
const passiveLimit = load.personalCapacity() + drone.carryCapacity(false);
hero.inv.lead = Math.floor(passiveLimit - load.total());
assert.ok(load.total() <= passiveLimit && load.total() > passiveLimit - 1);
drone.onStep();
assert.equal(d.en, 2);
delete hero.inv.lead;
hero.inv.scrap = Math.ceil((load.capacity() + 2) / load.itemWt("scrap"));
LAB.combat.foes().forEach(foe => { foe.dead = true; });
assert.ok(["N", "E", "S", "W"].some(direction => g.tryMove(direction, false)));
assert.equal(d.en, 1);
drone.onStep();
assert.equal(d.en, 0);
assert.equal(load.capOf("drone"), 230);
assert.ok(messages.some(text => /Тяговый блок разряжен/.test(text)));
assert.match(drone.line(), /Для тягового блока нужен заряд/);
hero.ammo.energy = 1;
drone.chargeBat();
assert.equal(load.capOf("drone"), 245);
drone.pack(false);
assert.equal(load.capOf("drone"), 0);
assert.ok(load.parts().drone > 3.5);
drone.pack(true);
hero.x = bench.x; hero.y = bench.y;
drone.hurt(99999);
assert.equal(load.capOf("drone"), 0);
assert.equal(drone.onStep(), undefined);
Object.values(drone.MODS).forEach(mod => {
  Object.keys(mod.need).forEach(part => { hero.inv[part] = 10; });
});
assert.equal(drone.repair(), true);
assert.equal(load.capOf("drone"), 245);
assert.equal(drone.delMod("boost"), true);
d.en = 56;
assert.equal(drone.addMod("battery"), true);
assert.equal(d.enMax, 140);
assert.equal(d.en, 56);
drone.charge(60);
assert.equal(drone.delMod("battery"), true);
assert.equal(d.en, 100);
assert.equal(d.enMax, 100);
const hpBeforeShell = d.hp;
assert.equal(drone.addMod("shell"), true);
assert.equal(d.hpMax, 46);
assert.equal(d.hp, hpBeforeShell);
assert.equal(drone.delMod("shell"), true);
assert.equal(d.hpMax, 30);
console.log("✓ Сборка, смена модулей, заряд, тяга и восстановление дрона");

// Команды и сохранения корпуса, рюкзака, снаряжения и старых модулей.
assert.equal(drone.addMod("medic"), true);
hero.hp = hero.hpMax - 30;
hero.st.bleed = 4;
hero.inv.bandage = 2;
assert.equal(drone.treat(), true);
assert.equal(hero.hp, hero.hpMax - 6);
assert.equal(hero.st.bleed, 0);
assert.equal(hero.inv.bandage, 1);
assert.equal(drone.treat(), false);
assert.equal(drone.delMod("medic"), true);
hero.inv.scrap = 1;
assert.equal(load.takeItem("dr_mod_scanner", 1), true);
assert.equal(drone.addMod("scanner"), true);
drone.cmdMenu();
assert.ok(top().items.some(item => /^Искать припасы и оборудование. Расход 10/.test(item.label)));

const floor = g.CUR.fl, floorItems = g.floorItems;
const seen = { kind: "item", item: "chip", x: hero.x, y: hero.y };
const concealed = [{ kind: "item", item: "isotope", x: hero.x + 11, y: hero.y }];
for (let dx = -8; dx <= 8 && concealed.length < 2; dx++) {
  const x = hero.x + dx, y = hero.y + 6;
  if (!LAB.los(floor, g.CUR.fs, hero.x, hero.y, x, y)) concealed.push({ kind: "item", item: "goldbar", x, y });
}
g.floorItems = () => [seen, ...concealed];
assert.equal(drone.scanSupplies(), true);
assert.ok(messages.at(-1).includes(g.itemName(seen)));
assert.ok(concealed.every(item => !messages.at(-1).includes(g.itemName(item))));
assert.equal(drone.scanSupplies(), false);
g.floorItems = floorItems;

assert.equal(g.saveSlot(3), true);
assert.equal(g.loadSlot(3), true);
assert.equal(g.G.loadRig, 3);
assert.equal(g.G.inv.dr_mod_medic, 1);
assert.deepEqual(Array.from(drone.D().mods), ["cargo", "scanner"]);
assert.ok(drone.D().cd.scan > 0);
const previous = JSON.parse(storage.get(g.slotKey(3)));
delete previous.g.loadRig;
previous.g.drone.mods = ["cargo", "gun"];
previous.g.drone.rcNeed = { ...drone.NEED, scrap: 50 };
storage.set(g.slotKey(3), JSON.stringify(previous));
assert.equal(g.loadSlot(3), true);
assert.equal(load.capOf("rig"), 0);
assert.equal(load.capOf("drone"), 230);
previous.g.drone.lvl = 3;
previous.g.drone.ranks = { cargo: 2 };
previous.g.drone.tuning = { cargo: "hook_pair" };
storage.set(g.slotKey(3), JSON.stringify(previous));
assert.equal(g.loadSlot(3), true);
assert.equal(load.capOf("drone"), 270);
assert.equal(drone.modRank(drone.D(), "cargo"), 2);
assert.equal(drone.D().tuning.cargo, "hook_pair");
g.G.x = bench.x; g.G.y = bench.y;
const currentBench = g.CUR.fl.objs.find(obj => obj.id === bench.id);
work._at(currentBench);
work.bench(currentBench).tier = 3;
work.bench(currentBench).dmg = false;
const scrapBefore = g.G.inv.scrap || 0;
assert.equal(drone.delMod("gun"), true);
assert.equal(drone.scrap(), true);
assert.equal(g.G.inv.scrap, scrapBefore + 2);
assert.equal(g.G.inv.dr_mod_gun, 1);
assert.equal(g.G.inv.dr_mod_cargo_r2, 1);
console.log("✓ Команды, ограничения разведки и совместимость сохранений");

// Продвинутые ступени и общие ресурсы проверяются после загрузки старой записи.
const exo = LAB.exo, forge = LAB.forge, h = g.G;
Object.keys(LAB.ITEMS).filter(id => LAB.ITEMS[id].kind === "part").forEach(id => { h.inv[id] = 50; });
h.inv.kv_ctrl = 1;
h.inv.rubber = 10;
h.mind = 25;
const grown = drone.build({ name: "Стриж" });
assert.ok(grown);
delete grown.flaw;
drone.benchMenu(3);
top().items.find(item => /^Оборудование\. Грузовой модуль и оснастка/.test(item.label)).fn();
top().items.find(item => /^Грузовой модуль[.,]/.test(item.label)).fn();
const storedCargo = top().items.find(item => /^Установить из рюкзака/.test(item.label));
assert.match(storedCargo.label, /ступень 2.*нужна ступень дрона 3/);
storedCargo.fn();
assert.equal(h.inv.dr_mod_cargo_r2, 1);
assert.equal(drone.carryCapacity(), 200);
top().items.find(item => /^Собрать и установить модуль первой ступени/.test(item.label)).fn();
assert.equal(drone.carryCapacity(), 230);
assert.equal(drone.upgradeMod("cargo"), false);
drone.onXP(750);
assert.equal(grown.lvl, 3);
const panels = h.inv.panel;
h.inv.panel = 0;
assert.equal(drone.upgradeMod("cargo"), false);
assert.equal(drone.modRank(grown, "cargo"), 1);
assert.equal(drone.carryCapacity(), 230);
h.inv.panel = panels;
assert.equal(drone.upgradeMod("cargo"), true);
assert.equal(drone.setRole("cargo"), true);
assert.equal(drone.carryCapacity(), 262);
drone.onXP(3000);
assert.equal(grown.lvl, 6);
assert.equal(drone.upgradeMod("cargo"), false);
work.bench(currentBench).tier = 4;
assert.equal(drone.upgradeMod("cargo"), true);
assert.equal(drone.carryCapacity(), 292);
assert.equal(drone.upgradeMod("cargo"), false);
const cargoDepthHistory = h.maxF;
h.maxF = { ...h.maxF, 9: 1 };
assert.equal(drone.tuneModule("cargo", "hook_pair"), true);
assert.equal(drone.carryCapacity(false), 302);
assert.equal(drone.addMod("boost"), true);
assert.equal(drone.upgradeMod("boost"), true);
assert.equal(drone.carryCapacity(), 327);
assert.equal(drone.upgradeMod("boost"), true);
assert.equal(drone.tuneModule("boost", "thrust_angle"), true);
assert.equal(drone.carryCapacity(), 342);
assert.equal(drone.pack(false), true);
assert.equal(drone.carriedWeight(), 9.5);
assert.equal(drone.carryCapacity(), 0);
assert.equal(drone.pack(true), true);
assert.equal(drone.carryCapacity(), 342);
assert.equal(drone.delMod("boost"), true);
assert.equal(drone.carryCapacity(), 302);
assert.equal(drone.delMod("cargo"), true);
assert.equal(drone.carryCapacity(), 200);
assert.equal(h.inv.dr_mod_cargo_r3, 1);
assert.equal(load.itemWt("dr_mod_cargo_r3"), 4);
assert.ok(drone.invItems().some(item => /Грузовой модуль, ступень 3/.test(item.label)));
assert.equal(drone.addMod("cargo", 3), true);
assert.equal(drone.modRank(grown, "cargo"), 3);
assert.equal(drone.carryCapacity(), 302);
assert.equal(drone.tuneModule("cargo", null), true);
h.maxF = cargoDepthHistory;
assert.equal(drone.carryCapacity(), 292);
assert.equal(drone.addMod("battery"), true);
grown.en = 61;
assert.equal(drone.upgradeMod("battery"), true);
assert.equal(drone.upgradeMod("battery"), true);
assert.equal(grown.enMax, 195);
assert.equal(grown.en, 61);
assert.equal(drone.setRole("support"), true);
assert.equal(drone.energyCost(10, "medic"), 6);
assert.equal(drone.carryCapacity(), 290);

const rig = exo.build("mid");
assert.ok(rig);
assert.equal(exo.equip(rig), true);
rig.en = 80;
assert.equal(exo.upNode(rig, "cell"), true);
assert.equal(exo.capOf(rig), 160);
assert.equal(rig.en, 80);
assert.equal(exo.profileWork(rig, "load", true), true);
assert.equal(exo.profileWork(rig, "load", true), true);
assert.equal(load.capOf("exo"), 31);
assert.equal(exo.profileWork(rig, "guard", true), true);
const guarded = exo.defBonus();
assert.equal(exo.profileWork(rig, "economy", true), true);
assert.equal(exo.defBonus(), guarded - 1);
assert.equal(exo.energyCost(rig, 20), 18.4);
assert.equal(exo.setMount(rig, "turret"), true);
assert.equal(exo.upgradeMount(rig), true);
assert.equal(exo.upgradeMount(rig), false);
work.bench(currentBench).tier = 5;
assert.equal(exo.upgradeMount(rig), true);
assert.equal(exo.setMount(rig, "horn"), true);
assert.equal(rig.shRank, 1);
assert.equal(exo.setMount(rig, "turret"), true);
assert.equal(rig.shRank, 3);
assert.equal(drone.craftCable(), true);
rig.en = 80; grown.en = 60;
assert.equal(drone.transfer(true), true);
assert.equal(rig.en, 60);
assert.equal(grown.en, 76);
assert.equal(drone.transfer(false), true);
assert.equal(rig.en, 76);
assert.equal(grown.en, 56);
rig.en = 6.9;
assert.equal(drone.transfer(true), false);
assert.equal(rig.en, 6.9);
console.log("✓ Продвинутые модули, роли, наплечные блоки и передача заряда с потерями");

const weapon = h.weapons.find(item => item.base === "spark");
h.inv.wire = 10;
h.inv.scrap = 20;
assert.equal(forge.tuneWork(weapon, "power", true), true);
assert.ok(forge.dmgK(weapon) > 1 && forge.heatK(weapon) > 1);
assert.ok(forge.tuneWork(weapon, "precision", true), messages.at(-1));
assert.equal(forge.accK(weapon), 0.03);
assert.equal(forge.dmgK(weapon), 0.98);
assert.equal(forge.tuneWork(weapon, "service", true), true);
assert.equal(forge.tuneWork(weapon, "service", true), true);
assert.equal(forge.tuneWork(weapon, "service", true), true);
assert.equal(forge.tuneWork(weapon, "service", true), false);
weapon.charge = 10;
for (let i = 0; i < 4; i++) {
  weapon.charge--;
  forge.afterShot(weapon, false, Date.now());
}
assert.equal(weapon.charge, 7);
assert.equal(forge.wearK(weapon), 0.76);
assert.equal(g.saveSlot(3), true);
assert.equal(g.loadSlot(3), true);
assert.equal(drone.modRank(drone.D(), "battery"), 3);
assert.equal(drone.D().role, "support");
assert.equal(exo.worn().profiles.load, 2);
assert.equal(exo.worn().shRank, 3);
assert.equal(g.G.weapons.find(item => item.id === weapon.id).tune.ranks.service, 3);
console.log("✓ Три настройки оружия, экономия заряда и сохранение всех ступеней");

// Расширенный каталог. Каждая модель имеет рецепт, игровой эффект и корректную настройку.
const catalog = LAB.droneCatalog;
assert.equal(Object.keys(drone.MODS).length, 51);
assert.equal(Object.keys(catalog.modifications).length, 237);
assert.equal(Object.keys(catalog.roles).length, 500);
assert.equal(Object.keys(catalog.programs).length, 800);
for (const [key, family] of Object.entries(catalog.directions)) {
  assert.equal(family.roles.length, 25, key);
  assert.equal(Object.values(catalog.programs).filter(p => p.family === key).length, 40, key);
  assert.ok(family.roles.every(id => catalog.roles[id].direction === key));
}
for (const md of Object.values(drone.MODS)) {
  assert.ok(catalog.groups[md.group]);
  assert.ok(Object.keys(md.need).every(id => LAB.ITEMS[id]), md.n);
}
for (const [id, tune] of Object.entries(catalog.modifications)) {
  assert.ok(tune.fits.every(k => drone.MODS[k]), id);
  assert.ok(tune.effects ? tune.effects.every(e => catalog.metrics[e[0]]) : catalog.metrics[tune.metric], id);
}
assert.equal(Object.keys(catalog.profiles).length, 23);
assert.equal(Object.keys(catalog.parts).length, 16);
for (const [id, part] of Object.entries(catalog.parts)) {
  const recipe = LAB.RECIPES.find(rc => rc.out === id);
  assert.equal(LAB.ITEMS[id].kind, "part");
  assert.equal(LAB.PART_DEPTH[id], part.depth);
  assert.equal(load.itemWt(id), part.wt);
  assert.ok(recipe && work.tierOf(recipe) === part.tier && recipe.minL === part.depth, id);
  assert.ok(Object.keys(recipe.need).every(key => LAB.ITEMS[key] && (LAB.PART_DEPTH[key] || 1) <= part.depth), id);
}
for (const def of [...Object.values(catalog.profiles), ...Object.values(catalog.modifications).filter(m => m.effects)]) {
  assert.ok(def.fits.every(k => drone.MODS[k]) && def.effects.every(e => catalog.metrics[e[0]]), def.n);
  assert.ok(Object.keys(def.need).every(id => LAB.ITEMS[id] && (LAB.PART_DEPTH[id] || 1) <= def.depth), def.n);
  assert.ok(Number.isInteger(def.depth), def.n);
}
console.log("✓ Каталог: 51 устройство, 237 модификаций, 23 специализации узлов и 16 новых деталей");

// Глубина комплекса проверяется отдельно от номера этажа и развития героя.
const advanced = g.G, machine = drone.D();
const nextBench = g.CUR.fl.objs.find(obj => obj.id === bench.id);
advanced.x = nextBench.x; advanced.y = nextBench.y;
work._at(nextBench);
const advancedFixture = work.bench(nextBench);
advancedFixture.tier = 6; advancedFixture.dmg = false;
advanced.event = "norm"; advanced.eventUntil = 1e9;
advanced.lvl = 40; machine.lvl = 10;
for (const id of Object.keys(LAB.ITEMS)) if (LAB.ITEMS[id].kind === "part") advanced.inv[id] = 100;
for (const id of ["wire","relay","cap","chip","servo","rubber","scrap","gel","powercell","supercond","optic","panel","ceramic","magnet"]) advanced.inv[id] = 100;
const depthHistory = advanced.maxF, currentDepth = advanced.L, currentFloor = advanced.F;
advanced.maxF = {1:9, 2:9}; advanced.L = 2; advanced.F = 9;
assert.equal(drone.craftMod("rail"), false, "девятый этаж не открывает чертёж уровня комплекса");
assert.equal(drone.setRole("recon_attack_surge"), false);
advanced.F = currentFloor;
advanced.maxF = {...depthHistory, 15:1, 140:1}; advanced.L = currentDepth;
assert.ok(drone.craftMod("rail"), messages.at(-1));
assert.equal(advanced.inv.dr_mod_rail, 1);
assert.ok(drone.addMod("rail"), messages.at(-1));
assert.equal(drone.addMod("gun"), false, "второй ствол на один подвес не ставится");
assert.equal(drone.tuneModule("rail", "gel_unit"), false, "чужая модификация отклоняется");
assert.ok(drone.tuneModule("rail", "long_focus"), messages.at(-1));
assert.equal(drone.adjust("fireRange", "rail"), 2);
assert.ok(drone.tuneModule("rail", "long_focus_reserve"), messages.at(-1));
machine.en = machine.enMax / 4 + 1;
const normalRange = drone.adjust("fireRange", "rail");
machine.en--;
assert.ok(drone.adjust("fireRange", "rail") > normalRange, "резервная схема срабатывает при четверти заряда");
assert.ok(drone.delMod("rail"), messages.at(-1));
assert.equal(drone.adjust("fireRange", "rail"), 0);
assert.ok(drone.addMod("rail"), messages.at(-1));
assert.ok(drone.adjust("fireRange", "rail") > normalRange);
assert.ok(drone.setRole("scout"), messages.at(-1));
const program = "recon_lab_route";
assert.ok(drone.setProgram(program), messages.at(-1));
assert.equal(drone.setProgram("cargo_lab_route"), false, "направление должно совпадать с областью специализации");
assert.equal(drone.adjust("scanRange", "scanner"), 4);
drone.onXP(4000);
assert.equal(drone.directionRank(machine, "recon"), 2);
assert.equal(drone.adjust("scanRange", "scanner"), 4.5);
assert.ok(drone.setRole("cargo"), messages.at(-1));
assert.ok(drone.setRole("scout"), messages.at(-1));
assert.equal(machine.programs.recon, program);
assert.equal(drone.directionRank(machine, "recon"), 2);
const normalCost = drone.energyCost(12, "scanner"), normalDepth = drone.unlockDepth(catalog.programs[program]);
advanced.diff = 3;
assert.ok(drone.energyCost(12, "scanner") > normalCost);
assert.equal(drone.unlockDepth(catalog.programs[program]), normalDepth + 5);
advanced.diff = 4;
assert.ok(drone.energyCost(12, "scanner") < normalCost);
assert.equal(drone.unlockDepth(catalog.programs[program]), normalDepth - 2);
advanced.diff = 1;
console.log("✓ Глубина и сложность меняют доступ и расход, специализация и опыт сохраняются");

// Стрельба и обслуживание расходуют ресурс только после выбора допустимой цели.
const originalVisible = LAB.combat.visibleFoes, originalDamage = LAB.combat.damageFoe;
const host = {id:1, name:"Машина", kind:"mech", hp:100, arm:4, x:advanced.x + 1, y:advanced.y, dmg:0};
const friend = {id:2, name:"Союзник", ally:true, kind:"mech", hp:100, arm:3, x:advanced.x, y:advanced.y + 1};
LAB.combat.visibleFoes = () => [friend];
machine.en = 80;
assert.equal(LAB.droneOps.run("rail", false), false);
assert.equal(machine.en, 80);
LAB.combat.visibleFoes = () => [friend, host];
LAB.combat.damageFoe = (to, amount) => { to.hp -= amount; };
assert.ok(LAB.droneOps.run("rail", false), messages.at(-1));
assert.equal(friend.hp, 100);
assert.ok(host.hp < 100 && machine.en < 80);
const spent = machine.en;
assert.equal(LAB.droneOps.run("rail", false), false);
assert.equal(machine.en, spent);
LAB.combat.visibleFoes = originalVisible;
LAB.combat.damageFoe = originalDamage;
assert.ok(drone.delMod("rail"), messages.at(-1));
assert.ok(drone.addMod("hemo"), messages.at(-1));
advanced.hp = advanced.hpMax - 25; advanced.st.bleed = 3; advanced.inv.bandage = 2;
inDanger = true;
assert.equal(LAB.droneOps.run("hemo", false), false);
assert.equal(advanced.inv.bandage, 2);
inDanger = false;
assert.ok(LAB.droneOps.run("hemo", false), messages.at(-1));
assert.equal(advanced.inv.bandage, 1);
assert.equal(advanced.st.bleed, 0);
assert.ok(drone.delMod("hemo"), messages.at(-1));
assert.ok(drone.addMod("regen"), messages.at(-1));
machine.en = 10;
for (let i = 0; i < 20; i++) drone.onStep();
assert.ok(machine.en > 10);
const recovered = machine.en;
for (let i = 0; i < 20; i++) drone.onStep();
assert.equal(machine.en, recovered);
console.log("✓ Цели и перезарядка оружия, полевое лечение и предел рекуперации");

// Вся звуковая сетка использует только зарегистрированные записи.
const audio = LAB.droneAudio;
const heard = [], originalSound = LAB.Sound;
LAB.Sound = { play: (clip, opts) => heard.push([clip, opts]), synth: () => assert.fail("синтез звука дрона") };
for (const [action, ids] of [["craft",Object.keys(drone.MODS)],["tune",Object.keys(catalog.modifications)],["role",Object.keys(catalog.roles)],["direction",Object.keys(catalog.programs)]]) {
  const patterns = new Set();
  for (const id of ids) {
    const model = action === "tune" ? catalog.modifications[id].fits[0] : undefined;
    const layers = audio.plan(action, id, model, false);
    assert.ok(layers.every(layer => LAB.SND[layer.clip]?.f.length && layer.gain < 0.5), id);
    patterns.add(JSON.stringify(layers));
    audio.play(action, id, model);
  }
  assert.equal(patterns.size, ids.length, action);
}
assert.ok(heard.every(([, opts]) => opts.fb === null));
assert.ok(audio.plan("fire", "rail", "rail", true)[0].gain < audio.plan("fire", "rail", "rail", false)[0].gain);
for (const [event, key] of [["fire","wedge"], ["fire","flare"], ["fire","resonator"], ["scan","salvage_eye"],
    ["service","trauma_unit"], ["energy","induction"], ["armor","shock_cage"]]) {
  assert.ok(audio.plan(event, key, key, false).every(layer => LAB.SND[layer.clip]?.f.length), key);
}
LAB.Sound = originalSound;
assert.equal(g.saveSlot(3), true);
assert.equal(g.loadSlot(3), true);
assert.equal(drone.D().programs.recon, program);
assert.equal(drone.D().tuning.rail, "long_focus_reserve");
assert.equal(drone.directionRank(drone.D(), "recon"), 2);
assert.equal(drone.D().recovered[g.CUR.key], true);
console.log("✓ Звуковые варианты из записей и сохранение схем, обучения и рекуперации");

// У каждого оружия есть рабочая команда. Скрытая дверь остаётся скрытой при сканировании.
const checked = g.G, checkedDrone = drone.D(), checkedBench = g.CUR.fl.objs.find(obj => obj.id === bench.id);
checked.x = checkedBench.x; checked.y = checkedBench.y;
work._at(checkedBench);
work.bench(checkedBench).tier = 8;
work.bench(checkedBench).dmg = false;
checked.event = "norm";
checked.maxF[321] = 1;
assert.equal(drone.delMod("regen"), true);
const losBefore = LAB.los;
LAB.los = () => true;
LAB.combat.damageFoe = (target, amount) => { target.hp -= amount; };
const living = { id:3, name:"Тварь", kind:"bio", hp:100, arm:1, x:checked.x + 1, y:checked.y, dmg:0 };
host.x = checked.x + 2; host.y = checked.y;
LAB.combat.visibleFoes = () => [host, living];
for (const [id, md] of Object.entries(catalog.equipment).filter(([, def]) => def.weapon)) {
  host.hp = living.hp = 100; host.frozen = living.frozen = living.blindT = 0;
  assert.ok(drone.addMod(id), messages.at(-1));
  checkedDrone.cd[id] = 0;
  checkedDrone.en = 80;
  assert.ok(LAB.droneOps.run(id, false), messages.at(-1));
  assert.ok(Math.min(host.hp, living.hp) < 100, id);
  if (id === "arc" || id === "resonator") assert.ok(host.hp < 100 && living.hp < 100);
  if (id === "cryo") assert.ok(living.frozen > 0);
  if (id === "sonic") assert.ok(living.blindT > 0);
  if (id === "ion") assert.ok(host.frozen > 0 && living.hp === 100);
  assert.equal(drone.delMod(id), true);
}
LAB.combat.visibleFoes = originalVisible;
LAB.combat.damageFoe = originalDamage;
assert.ok(drone.addMod("latch_scope"), messages.at(-1));
const oldDoors = g.CUR.fl.doors;
g.CUR.fl.doors = [{ id:"test-closed", lock:{type:"secret"}, x:checked.x+1, y:checked.y }, { id:"test-open", x:checked.x+1, y:checked.y }];
g.CUR.fs.doors["test-open"] = 2;
checkedDrone.en = 80;
assert.ok(LAB.droneOps.run("latch_scope", false), messages.at(-1));
assert.match(messages.at(-1), /Открытая дверь/);
assert.doesNotMatch(messages.at(-1), /Закрытая дверь/);
g.CUR.fl.doors = oldDoors;
LAB.los = losBefore;
console.log("✓ Десять сменных стволов выполняют команды, сканер сохраняет тайные двери");

function selectMenuItem(matcher) {
  const row = top().items.find(item => matcher.test(typeof item.label === "function" ? item.label() : item.label));
  assert.ok(row, `${top().title}: ${matcher}`);
  assert.ok(!row.disabled, row.why);
  row.fn();
  return row;
}

// Грузовой корпус и сменное оборудование развиваются по глубине независимо.
menus.length = 0;
g.newGame(); LAB.combat.stop();
g.enterFloor(2, 3, "down", true); LAB.combat.stop();
const transport = g.G;
const transportBench = g.CUR.fl.objs.find(obj => obj.type === "workbench");
transport.x = transportBench.x; transport.y = transportBench.y;
transport.diff = 1; transport.lvl = 30; transport.event = "norm"; transport.eventUntil = 1e9;
work._at(transportBench);
const transportWorkshop = work.bench(transportBench);
transportWorkshop.tier = 8; transportWorkshop.dmg = false;
const transportDanger = LAB.combat.danger;
LAB.combat.danger = () => false;
for (const definition of [...Object.values(drone.MODS), ...catalog.cargoFrames, ...Object.values(catalog.cargoProfiles), { need: drone.NEED }]) {
  for (const id of Object.keys(definition.need || {})) transport.inv[id] = 100;
}
const carrierDrone = drone.build({ name: "Тягач" });
assert.ok(carrierDrone, messages.at(-1));
carrierDrone.lvl = 10;
let presentPanels = transport.inv.panel;
assert.equal(drone.addMod("cargo_platform"), false);
assert.match(messages.at(-1), /сначала усилите корпус/);
drone.benchMenu(8);
selectMenuItem(/^Грузовой корпус/);
selectMenuItem(/^Усилить корпус/);
assert.match(messages.at(-1), /сначала посетите уровень комплекса 12/);
assert.equal(transport.inv.panel, presentPanels);
transport.maxF[12] = 1;
selectMenuItem(/^Усилить корпус/);
assert.equal(carrierDrone.cargoFrame, 1);
assert.equal(carrierDrone.hpMax, 38);
assert.equal(drone.carryCapacity(), 200);
assert.ok(drone.addMod("cargo_platform"), messages.at(-1));
assert.equal(drone.carryCapacity(), 600);
assert.equal(drone.addMod("cargo"), false, "один грузовой подвес");
presentPanels = transport.inv.panel;
assert.equal(drone.upgradeMod("cargo_platform"), false);
assert.equal(transport.inv.panel, presentPanels);
transport.maxF[20] = 1;
assert.ok(drone.upgradeMod("cargo_platform"), messages.at(-1));
assert.equal(drone.carryCapacity(), 1000);
assert.ok(drone.delMod("cargo_platform"), messages.at(-1));
assert.equal(transport.inv.dr_mod_cargo_platform_r2, 1);
assert.equal(drone.carryCapacity(), 200);

transport.maxF[58] = 1;
selectMenuItem(/^Усилить корпус/);
assert.equal(carrierDrone.cargoFrame, 2);
assert.ok(drone.addMod("cargo_frame"), messages.at(-1));
assert.ok(drone.upgradeMod("cargo_frame") && drone.upgradeMod("cargo_frame"), messages.at(-1));
assert.equal(drone.carryCapacity(), 6000);
const transportParts = transport.inv;
transport.inv = { lead: 5000 };
carrierDrone.en = 3;
assert.ok(load.canMove(), "дрон несёт пять тонн");
assert.ok(drone.motionNoise() > 0);
drone.onStep();
assert.equal(carrierDrone.en, 0);
assert.equal(drone.carryCapacity(), 3000);
assert.match(drone.cargoRecovery(), /подзарядить/);
assert.equal(transport.inv.lead, 5000);
assert.equal(load.canMove(), false);
assert.ok(g.dropItem("lead", 2200));
assert.equal(g.CUR.fs.drops.at(-1).n, 2200);
assert.ok(load.canMove(), "после разгрузки можно идти на резерве");
drone.charge(3);
drone.onStep();
assert.equal(carrierDrone.en, 3, "опоры не тратят заряд");
assert.equal(drone.carryCapacity(), 6000);
transport.inv = transportParts;

drone.benchMenu(8);
selectMenuItem(/^Оборудование\. Грузовой модуль и оснастка/);
selectMenuItem(/^Тяжёлая грузовая рама/);
selectMenuItem(/^Специализация платформы/);
selectMenuItem(/^Дальний перегон/);
assert.equal(carrierDrone.cargoProfiles.cargo_frame, "travel");
assert.equal(drone.carryCapacity(), 5400);
carrierDrone.en = 0;
assert.equal(drone.carryCapacity(), 4050);
transport.inv = { lead: 5000 };
carrierDrone.en = 2;
drone.onStep();
assert.equal(carrierDrone.en, 0, "перегон с грузом тратит две единицы");
transport.inv = transportParts;
selectMenuItem(/^Тихая перевозка/);
carrierDrone.en = 20;
assert.equal(drone.carryCapacity(), 5100);
transport.inv = { lead: 4500 };
assert.equal(drone.motionNoise(), 0);
transport.inv = transportParts;
assert.ok(drone.delMod("cargo_frame"), messages.at(-1));

drone.benchMenu(8);
selectMenuItem(/^Грузовой корпус/);
transport.maxF[321] = 1;
selectMenuItem(/^Усилить корпус/);
assert.equal(carrierDrone.cargoFrame, 3);
assert.ok(drone.addMod("cargo_industrial"), messages.at(-1));
assert.ok(drone.upgradeMod("cargo_industrial") && drone.upgradeMod("cargo_industrial"), messages.at(-1));
assert.equal(drone.carryCapacity(), 22000);
assert.ok(drone.delMod("cargo_industrial"), messages.at(-1));
transport.maxF[6320] = 1;
selectMenuItem(/^Усилить корпус/);
assert.equal(carrierDrone.cargoFrame, 4);
assert.ok(drone.addMod("cargo_deep"), messages.at(-1));
assert.ok(drone.upgradeMod("cargo_deep") && drone.upgradeMod("cargo_deep"), messages.at(-1));
assert.equal(drone.carryCapacity(), 60000);
assert.ok(drone.addMod("boost"), messages.at(-1));
assert.equal(drone.carryCapacity(), 68970);
assert.equal(drone.delMod("cargo_deep"), false, "тяговый блок требует платформу");
drone.benchMenu(8);
selectMenuItem(/^Оборудование\. Грузовой модуль и оснастка/);
selectMenuItem(/^Грузовая платформа Нижних/);
selectMenuItem(/^Специализация платформы/);
selectMenuItem(/^Тяжёлый подъём/);
assert.ok(drone.tuneModule("cargo_deep", "cargo_braces"), messages.at(-1));
assert.equal(drone.carryCapacity(), 75000);
assert.ok(drone.delMod("boost") && drone.delMod("cargo_deep"));
assert.equal(drone.carryCapacity(), 200);
assert.ok(drone.addMod("cargo_deep"), messages.at(-1));
assert.equal(drone.carryCapacity(), 75000);
assert.ok(g.saveSlot(2) && g.loadSlot(2));
assert.equal(drone.D().cargoFrame, 4);
assert.equal(drone.modRank(drone.D(), "cargo_deep"), 3);
assert.equal(drone.D().cargoProfiles.cargo_deep, "lift");
assert.equal(drone.D().tuning.cargo_deep, "cargo_braces");
assert.equal(drone.carryCapacity(), 75000);
LAB.combat.danger = transportDanger;
console.log("✓ Платформы на 1–75 тонн, бо́льший резерв, шум, разрядка, разгрузка и сохранение");

// Запчасть можно купить, снять с машины или собрать, затем применить её в оснастке.
menus.length = 0;
g.newGame(); LAB.combat.stop();
g.enterFloor(3, 1, "down", true); LAB.combat.stop();
const engineer = g.G;
engineer.diff = 1; engineer.lvl = 30; engineer.credits = 0;
engineer.event = "norm"; engineer.eventUntil = 1e9;
const partsPost = g.CUR.fl.objs.find(obj => obj.type === "supply");
LAB.supply.postMenu(partsPost);
selectMenuItem(/^Запчасти для дронов$/);
assert.ok(!top().items.some(row => /Распределитель Нижних/.test(row.label)));
const shelf = g.objState(partsPost).stock.droneParts.find(e => e.id === "dr_gimbal");
const oldStock = shelf.n;
const stockRow = selectMenuItem(/^Карданный подвес/);
assert.equal(shelf.n, oldStock);
assert.match(messages.at(-1), /Не хватает кредитов/);
engineer.credits = 500;
const cost = Number(stockRow.label.match(/— (\d+) /)[1]);
stockRow.fn();
assert.equal(engineer.credits, 500 - cost);
assert.equal(engineer.inv.dr_gimbal, 1);
assert.equal(shelf.n, oldStock - 1);

let cameraPart;
for (let i = 0; i < 100 && !cameraPart; i++) {
  const drops = [];
  work.drops({ id: "camera-" + i, kind: "mech", beh: ["camera"] }, drops, () => .99, 1);
  cameraPart = drops.find(drop => drop.item === "dr_optic");
}
assert.ok(cameraPart);
g.giveItem(cameraPart, true);
assert.equal(engineer.inv.dr_optic, 1);
const containerParts = [];
for (let i = 0; i < 8 && !containerParts.length; i++) {
  const floor = LAB.getFloor("drone-store-" + i, 14, 1);
  for (const roomObject of floor.objs) {
    containerParts.push(...(roomObject.loot || []).filter(drop => LAB.ITEMS[drop.item]?.dronePart));
  }
}
assert.ok(containerParts.length && containerParts.every(drop => LAB.PART_DEPTH[drop.item] <= 14));

const labBench = g.CUR.fl.objs.find(obj => obj.type === "workbench");
engineer.x = labBench.x; engineer.y = labBench.y;
work._at(labBench);
work.bench(labBench).tier = 8; work.bench(labBench).dmg = false;
const normalDanger = LAB.combat.danger;
LAB.combat.danger = () => false;
for (const key of ["cap","cell","wire","kv_ctrl","servo","optic","scrap","ceramic","magnet","panel","relay","chip"]) engineer.inv[key] = 30;
work.open(labBench);
selectMenuItem(/^Запчасти для дронов/);
selectMenuItem(/^Импульсный конденсатор/);
assert.ok(engineer.inv.dr_cap > 0);
assert.ok(engineer.craftN.dr_cap > 0);
const engineerDrone = drone.build({ name: "Механик" });
assert.ok(engineerDrone, messages.at(-1));
engineerDrone.lvl = 10;
const capCount = engineer.inv.dr_cap;
assert.equal(drone.addMod("wedge"), false);
assert.match(messages.at(-1), /уровень комплекса 12/);
assert.equal(engineer.inv.dr_cap, capCount);
engineer.maxF[14] = 1;
assert.ok(drone.addMod("wedge"), messages.at(-1));
assert.equal(engineer.inv.dr_gimbal, 0);
assert.equal(engineer.inv.dr_cap, capCount - 1);
engineer.inv.dr_gimbal = 2;
engineer.inv.dr_gyro = 4;
engineer.inv.dr_shell = 2;
drone.benchMenu(8);
selectMenuItem(/^Оборудование\. Вооружение/);
selectMenuItem(/^Керамический излучатель/);
selectMenuItem(/^Специализация узла/);
selectMenuItem(/^Охота за бронёй/);
assert.equal(engineerDrone.moduleProfiles.wedge, "armor_first");
assert.equal(engineer.inv.dr_shell, 1);
assert.ok(drone.setModuleProfile("wedge", null));
assert.ok(drone.setModuleProfile("wedge", "armor_first"));
assert.equal(engineer.inv.dr_shell, 1, "повторный выбор изученной специализации бесплатен");
assert.equal(drone.setModuleProfile("wedge", "trauma"), false);
menus.pop(); LAB.ui.rebuildTop();
selectMenuItem(/^Модификации/);
selectMenuItem(/^Инженерные/);
selectMenuItem(/^Гироскопический прицел/);
assert.equal(engineerDrone.tuning.wedge, "gimbal_sight");
assert.equal(engineer.inv.dr_gimbal, 1);
assert.equal(drone.adjust("fireRange", "wedge"), 1);

const closer = { name: "Тварь", kind: "bio", arm: 0, hp: 100, x: engineer.x + 1, y: engineer.y };
const armored = { name: "Бронированный дозорный", kind: "mech", arm: 9, hp: 100, x: engineer.x + 3, y: engineer.y };
LAB.combat.visibleFoes = () => [closer, armored];
LAB.combat.damageFoe = (target, amount) => { target.hp -= amount; };
engineerDrone.en = 100;
assert.ok(LAB.droneOps.run("wedge", false), messages.at(-1));
assert.equal(closer.hp, 100);
assert.ok(armored.hp < 100 && armored.mark > Date.now());
LAB.combat.visibleFoes = originalVisible;
LAB.combat.damageFoe = originalDamage;
assert.ok(drone.delMod("wedge"));
assert.equal(drone.adjust("fireRange", "wedge"), 0);
assert.ok(drone.addMod("wedge") && drone.adjust("fireRange", "wedge") === 1);

engineer.maxF[72] = 1;
for (const key of ["dr_cell","dr_bus","dr_flux","dr_cap","dr_feed","dr_logic","gel"]) engineer.inv[key] = 4;
assert.ok(drone.addMod("induction"), messages.at(-1));
assert.equal(drone.addMod("charger"), false, "преобразователи используют одно крепление");
assert.ok(drone.setModuleProfile("induction", "field_charge"));
assert.ok(drone.tuneModule("induction", "charge_bus"));
engineerDrone.en = 0;
engineer.ammo.energy = 1;
assert.ok(drone.chargeBat());
assert.equal(engineerDrone.en, 89);
assert.equal(engineer.ammo.energy, 0);
assert.ok(drone.addMod("trauma_unit"), messages.at(-1));
assert.ok(drone.setModuleProfile("trauma_unit", "trauma"), messages.at(-1));
engineer.hpMax = 100; engineer.hp = 10; engineer.st.bleed = 2; engineer.inv.bandage = 1;
assert.ok(LAB.droneOps.run("trauma_unit", false), messages.at(-1));
assert.equal(engineer.hp, 43);
assert.equal(engineer.st.bleed, 0);
assert.equal(engineer.inv.bandage, 0);
assert.ok(drone.delMod("trauma_unit"));
engineer.inv.dr_shell = 3; engineer.inv.dr_latch = 1; engineer.inv.dr_bus = 1;
assert.ok(drone.addMod("shock_cage"), messages.at(-1));
assert.equal(drone.addMod("mesh"), false);
assert.ok(drone.setModuleProfile("shock_cage", "hull_guard"));
engineerDrone.hp = 30;
drone.hurt(10, armored);
assert.equal(engineerDrone.hp, 23.3);
engineerDrone.hp = 30;
drone.hurt(10, closer);
assert.equal(engineerDrone.hp, 21.5);
assert.ok(drone.delMod("shock_cage"));
engineer.inv.dr_optic = 2;
assert.ok(drone.addMod("salvage_eye"), messages.at(-1));
const droppedParts = g.CUR.fs.drops, scanLos = LAB.los, scanLoot = g.CUR.fl.items;
g.CUR.fl.items = [];
g.CUR.fs.drops = Object.keys(catalog.parts).slice(0, 8).map((part, i) => ({
  id: "scan-part-" + i, kind: "item", item: part, n: 1, x: engineer.x, y: engineer.y
}));
LAB.los = () => true;
assert.ok(drone.setModuleProfile("salvage_eye", "catalog_scan"), messages.at(-1));
assert.equal(drone.scanCount("salvage_eye"), 8);
assert.ok(LAB.droneOps.run("salvage_eye", false), messages.at(-1));
assert.match(messages.at(-1), /Матрица управления/i);
g.CUR.fs.drops = droppedParts;
g.CUR.fl.items = scanLoot;
LAB.los = scanLos;
assert.ok(g.saveSlot(1) && g.loadSlot(1));
assert.equal(drone.D().moduleProfiles.wedge, "armor_first");
assert.equal(drone.D().tuning.wedge, "gimbal_sight");
assert.equal(drone.D().profileLessons.wedge.armor_first, true);
assert.equal(g.objState(partsPost).stock.droneParts.find(e => e.id === "dr_gimbal").n, oldStock - 1);
LAB.combat.danger = normalDanger;
console.log("✓ Добыча, продажа, крафт, бой, защита, лечение, сканер, заряд и настройки после загрузки");

// Личное хранилище открывается из реального меню пункта снабжения.
menus.length = 0;
g.newGame(); LAB.combat.stop();
g.enterFloor(2, 3, "down", true); LAB.combat.stop();
const stHero = g.G;
const post = g.CUR.fl.objs.find(obj => obj.type === "supply");
assert.ok(post);
LAB.supply.postMenu(post);
selectMenuItem(/^Личное хранилище/);
assert.equal(top().title, "Личное хранилище");
assert.equal(load.lockCap().slots, 10);
assert.equal(load.lockCap().perCell, 300);
selectMenuItem(/^Ячейки хранилища/);
assert.equal(top().items.filter(it => /^Ячейка \d/.test(it.label)).length, 10);
assert.ok(top().items.every(it => !/^Ячейка \d/.test(it.label) || /Свободна\. 0 из 300/.test(it.label)));

// Две разновидности деталей делят 300 мест. Новое назначение требует свободной ячейки.
const tenTypes = ["scrap", "medkit_s", "ration", "water", "toolkit", "decoder", "plate", "c_solvent", "tr_jaw", "emp"];
stHero.inv = Object.fromEntries(tenTypes.concat("turret_kit").map(id => [id, 1]));
stHero.inv.scrap = 295;
stHero.inv.wire = 10;
stHero.craftN = { wire: 8 };
assert.equal(load.putItem("scrap", 999), 295);
assert.equal(load.putItem("wire", 10), 5);
assert.equal(load.locker().craft.wire, 3);
assert.equal(stHero.craftN.wire, 5);
assert.equal(load.putItem("wire", 1, true), 0);
assert.equal(load.slotsUsed(), 1);
tenTypes.slice(1).forEach(id => assert.equal(load.putItem(id, 1), 1, id));
assert.equal(load.slotsUsed(), 10);
assert.equal(load.putItem("turret_kit", 1, true), 0);
assert.equal(stHero.inv.turret_kit, 1);
assert.ok(load.lockerWt() > 150);
assert.equal(load.takeItem("ration", 1), true);
assert.equal(load.putItem("turret_kit", 1), 1);
assert.equal(load.slotsUsed(), 10);

// Покупки независимы. Один раз платим за выбранную ячейку и можем сразу ею пользоваться.
stHero.credits = 0;
menus.length = 0;
load.lockerMenu("post");
selectMenuItem(/^Расширить хранилище/);
assert.equal(load.lockCap().slots, 10);
assert.equal(stHero.credits, 0);
selectMenuItem(/^Ячейки хранилища/);
selectMenuItem(/^Ячейка 1\. Детали/);
const oldUpgrade = selectMenuItem(/^Увеличить вместимость/);
assert.match(messages.at(-1), /Не хватает кредитов/);
assert.equal(load.putItem("wire", 1, true), 0);
stHero.credits = 100000;
const startCredits = stHero.credits;
const firstPrice = Number(oldUpgrade.label.match(/за (\d+) /)[1]);
oldUpgrade.fn();
assert.equal(stHero.credits, startCredits - firstPrice);
assert.equal(load.lockCap().slots, 10);
LAB.ui.rebuildTop();
assert.match(top().items[0].label, /300 из 400/);
assert.match(top().items.find(it => /^Увеличить вместимость/.test(it.label)).label, /за \d+ кредит/);
assert.ok(Number(top().items.find(it => /^Увеличить вместимость/.test(it.label)).label.match(/за (\d+) /)[1]) > firstPrice);
assert.equal(load.putItem("wire", 5), 5);
assert.equal(load.takeItem("wire", 10), true);
assert.equal(stHero.craftN.wire, 8);
menus.length = 0;
load.lockerMenu("post");
const priceSlots = load.upPrice(), beforeSlots = stHero.credits;
selectMenuItem(/^Расширить хранилище/);
assert.equal(stHero.credits, beforeSlots - priceSlots);
assert.equal(load.lockCap().slots, 14);
assert.ok(load.upPrice() > priceSlots);
assert.equal(load.lockCap().perCell, 300);

// Можно улучшить пустую ячейку и назначить ей назначение вручную.
selectMenuItem(/^Ячейки хранилища/);
selectMenuItem(/^Ячейка 13\. Свободна/);
selectMenuItem(/^Увеличить вместимость/);
selectMenuItem(/^Назначить ячейку/);
stHero.ammo.energy = 200; stHero.ammo.magnetron = 250;
LAB.ui.rebuildTop();
selectMenuItem(/^Боеприпасы\. Энергобатарея/);
LAB.ui.rebuildTop();
selectMenuItem(/^Боеприпасы\. Магнетронная ячейка/);
assert.equal(load.locker().ammo.energy, 200);
assert.equal(load.locker().ammo.magnetron, 200);
assert.equal(stHero.ammo.magnetron, 50);
assert.equal(load.locker().cells[12].type, "ammo");
assert.equal(load.locker().cells[12].lv, 1);
assert.ok(top().items.find(it => /^Детали\. Провода/.test(it.label)).disabled);

// Ремкомплект, который уже начали, и экипировка остаются у героя.
stHero.inv.fieldkit = 2;
stHero.kitUse = { fieldkit: 1 };
assert.equal(load.putItem("fieldkit", 2), 1);
assert.equal(stHero.inv.fieldkit, 1);
assert.equal(stHero.kitUse.fieldkit, 1);
menus.length = 0;
load.lockerMenu("bench");
selectMenuItem(/^Положить в хранилище/);
assert.ok(!top().items.some(it => /^Оружие\./.test(it.label)));
assert.ok(!top().items.some(it => /^Броня\./.test(it.label)));
assert.ok(top().items.find(it => /Походный ремнабор/.test(it.label)).disabled);

// Срок аренды: арендуемая ячейка выдаёт содержимое и после отмены доступа на приём.
assert.equal(load.rent(), true);
menus.length = 0;
load.lockerMenu("post");
selectMenuItem(/^Ячейки хранилища/);
selectMenuItem(/^Ячейка 15\. Свободна.*В аренде/);
assert.ok(!top().items.some(it => /^Увеличить вместимость/.test(it.label)));
selectMenuItem(/^Назначить ячейку/);
const testArmor = LAB.makeArmor("suit", 1, 2, "storage_test_armor");
stHero.armors.push(testArmor);
LAB.ui.rebuildTop();
selectMenuItem(/^Броня\./);
assert.equal(load.locker().armors[0], testArmor);
assert.ok(!stHero.armors.includes(testArmor));
stHero.day += 4;
load.minutes();
assert.equal(load.rented(), false);
assert.equal(load.lockCap().slots, 14);
assert.ok(load.locker().debt > 0);
menus.length = 0;
load.lockerMenu("capsule");
assert.equal(load.locker().debt, 0);
assert.ok(!top().items.some(it => /^Расширить хранилище/.test(it.label)));
selectMenuItem(/^Забрать из хранилища/);
assert.ok(top().items.some(it => /^Ячейка 15\. Броня.*Только выдача/.test(it.label)));
selectMenuItem(/^Ячейка 15\. Броня/);
selectMenuItem(new RegExp(testArmor.name));
assert.ok(stHero.armors.includes(testArmor));
assert.equal(load.locker().armors.length, 0);

// Сохраняются улучшения и назначение. Перенос старых записей сохраняет лишнее и признак самоделок.
assert.equal(g.saveSlot(2), true);
assert.equal(g.loadSlot(2), true);
assert.equal(load.locker().cells[12].lv, 1);
assert.equal(load.locker().cells[12].type, "ammo");
assert.equal(load.locker().ammo.magnetron, 200);
const legacyPayload = JSON.parse(storage.get(g.slotKey(2)));
legacyPayload.g.inv = { wire: 0 };
legacyPayload.g.locker = { inv: { scrap: 330, wire: 70 }, craft: { wire: 17 }, ammo: {}, weapons: [], armors: [], frames: [], lv: 0, floor: 0 };
storage.set(g.slotKey(2), JSON.stringify(legacyPayload));
assert.equal(g.loadSlot(2), true);
assert.equal(load.locker().inv.scrap + load.locker().inv.wire, 400);
assert.equal(load.locker().cells[0].type, "part");
g.G.inv.scrap = 1;
assert.equal(load.putItem("scrap", 1, true), 0);
assert.ok(load.takeItem("wire", 17));
assert.equal(g.G.craftN.wire, 25);
assert.equal(load.locker().craft.wire, 0);
assert.equal(load.locker().inv.wire, 53);
console.log("✓ Личное хранилище: назначение, количество, обе покупки, аренда, экипировка и старые записи");

// Из мастерской и капсулы доступны те же сохранённые ячейки.
const accessFloor = g.CUR.fl;
const workbench = accessFloor.objs.find(obj => obj.type === "workbench");
const capsule = accessFloor.objs.find(obj => obj.type === "capsule");
assert.ok(workbench && capsule);
menus.length = 0;
g.G.x = workbench.x; g.G.y = workbench.y;
work.open(workbench);
assert.equal(top().title, "Мастерская");
selectMenuItem(/^Личное хранилище/);
assert.equal(top().title, "Личное хранилище");
selectMenuItem(/^Ячейки хранилища/);
assert.ok(top().items.some(it => /^Ячейка 1\. Детали\. 383 из 300/.test(it.label)));
let openCapsule;
const originalTimeout = ctx.setTimeout;
ctx.setTimeout = (fn, ms) => { if (ms === 1200) openCapsule = fn; return 0; };
try { LAB.capsule.menu(capsule); } finally { ctx.setTimeout = originalTimeout; }
assert.equal(typeof openCapsule, "function");
openCapsule();
assert.equal(top().title, "Капсула восстановления");
selectMenuItem(/^Личное хранилище/);
selectMenuItem(/^Ячейки хранилища/);
assert.ok(top().items.some(it => /^Ячейка 1\. Детали\. 383 из 300/.test(it.label)));
console.log("✓ Сохранённое хранилище доступно из мастерской и капсулы восстановления");

// Большие покупки применяются целиком и сохраняются независимо от других ячеек.
menus.length = 0;
g.newGame(); LAB.combat.stop();
g.G.credits = 2000000;
const expandedStorage = load.locker();
const firstFour = load.upPrice(4);
expandedStorage.lv = 1; // старая покупка на 4 ячейки
assert.equal(load.lockCap().slots, 14);
const secondFour = load.upPrice(4);
expandedStorage.lv = 0;
assert.equal(load.upPrice(8), firstFour + secondFour);
load.lockerMenu("post");
assert.deepEqual(Array.from(top().items.filter(row => /^Расширить хранилище/.test(row.label)), row => Number(row.label.match(/на (\d+)/)[1])), [4, 8, 10]);
const startFunds = g.G.credits;
selectMenuItem(/^Расширить хранилище на 8 ячеек/);
assert.equal(load.lockCap().slots, 18);
assert.equal(g.G.credits, startFunds - firstFour - secondFour);
LAB.ui.rebuildTop();
assert.equal(top().items.filter(row => /^Расширить хранилище/.test(row.label)).length, 1);
selectMenuItem(/^Расширить хранилище на 2 ячейки/);
LAB.ui.rebuildTop();
assert.equal(load.lockCap().slots, 20);
assert.ok(!top().items.some(row => /^Расширить хранилище/.test(row.label)));
assert.equal(load.upgrade(4), false);

selectMenuItem(/^Ячейки хранилища/);
selectMenuItem(/^Ячейка 1\./);
assert.deepEqual(Array.from(top().items.filter(row => /^Увеличить вместимость/.test(row.label)), row => Number(row.label.match(/на (\d+)/)[1])), [100, 300, 1000]);
const fundsBeforeCell = g.G.credits;
const bigPack = selectMenuItem(/^Увеличить вместимость на 1000 /);
assert.equal(g.G.credits, fundsBeforeCell - Number(bigPack.label.match(/за (\d+)/)[1]));
g.G.inv.wire = 1500;
LAB.ui.rebuildTop();
assert.match(top().items[0].label, /0 из 1300/);
selectMenuItem(/^Назначить ячейку/);
selectMenuItem(new RegExp(LAB.ITEMS.wire.n, "i"));
assert.match(top().title, /^Количество/);
const exact = top().items[0], bulk = top().items[1];
assert.equal(bulk.get(), 1300);
bulk.set(bulk.get() - bulk.step);
assert.equal(exact.get(), 1200);
exact.set(exact.get() - exact.step);
bulk.fn();
assert.equal(expandedStorage.inv.wire, 1199);
assert.equal(g.G.inv.wire, 301);
menus.pop(); menus.pop();
LAB.ui.rebuildTop();
selectMenuItem(/^Увеличить вместимость на 300 /);
assert.equal(load.putItem("wire", 301), 301);
assert.equal(expandedStorage.inv.wire, 1500);
assert.equal(load.locker().cells[0].lv, 13);
menus.pop();
LAB.ui.rebuildTop();
assert.match(top().items[0].label, /1500 из 1600/);
assert.match(top().items[1].label, /0 из 300/);
selectMenuItem(/^Ячейка 1\./);
expandedStorage.cells[0].lv = 99;
LAB.ui.rebuildTop();
const lastPack = selectMenuItem(/^Увеличить вместимость на 100 /);
assert.match(lastPack.label, /Станет 10300 мест/);
LAB.ui.rebuildTop();
assert.ok(!top().items.some(row => /^Увеличить вместимость/.test(row.label)));
assert.ok(g.saveSlot(2) && g.loadSlot(2));
assert.equal(load.lockCap().slots, 20);
assert.equal(load.locker().cells[0].lv, 100);
assert.equal(load.locker().inv.wire, 1500);
console.log("✓ Пакеты ячеек и вместимости, быстрый и точный перенос, пределы и сохранение");

g.newGame();
LAB.combat.stop();
const fieldBench = g.CUR.fl.objs.find(o => o.type === "workbench");
const benchState = work.bench(fieldBench);
benchState.tier = 4;
benchState.dmg = false;
g.G.x = fieldBench.x;
g.G.y = fieldBench.y;
const maskRecipe = LAB.RECIPES.find(rc => rc.id === "airmask");
work.open(fieldBench);
work.setBatch(true);
const perBatch = work.needOf(maskRecipe, benchState);
for (const id of Object.keys(perBatch)) g.G.inv[id] = 2 * perBatch[id];
selectMenuItem(new RegExp("^" + work.groupOf(maskRecipe)));
let maskRow = top().items.find(row => /^Дыхательная маска/.test(row.label));
assert.match(maskRow.label, /2 партии по 3, всего 6 предметов/);
assert.match(maskRow.label, new RegExp("расход " + perBatch.rubber + ", в рюкзаке " + 2 * perBatch.rubber));
maskRow.fn();
LAB.ui.rebuildTop();
maskRow = top().items.find(row => /^Дыхательная маска/.test(row.label));
assert.match(maskRow.label, /1 партия по 3, всего 3 предмета/);
g.G.inv.rubber = perBatch.rubber - 1;
LAB.ui.rebuildTop();
assert.match(top().items.find(row => /^Дыхательная маска/.test(row.label)).label, /0 партий/);
work.setBatch(false);
console.log("✓ Меню крафта до подтверждения показывает фактический расход и остаток партий");

const chem = LAB.chem;
const table = { id: "test-chem", type: "chemlab" };
chem.station(table).dirty = false;
const salt = chem.matId("c_salt", 2, false);
const saturated = chem.matId("c_blood", 3, true);
g.G.inv[salt] = 4;
g.G.inv[saturated] = 20;
g.G.inv.bandage = 8;
g.G.inv.c_blood = 3;
g.G.inv.c_catalyst = 1;
chem.opt().cat = true;
chem.open(table);
selectMenuItem(/^Синтез: фармакология/);
const bandageName = chem.outName(chem.RCBY.h_bandage);
assert.match(top().items.find(row => row.label.startsWith(bandageName)).label, /По запасам 3 операции/);
selectMenuItem(new RegExp("^" + bandageName));
const synthesis = top().items.find(row => /^Синтезировать/.test(row.label));
assert.match(synthesis.label, /Расход при успехе.*катализатор.*расход 1, в рюкзаке 1/i);
assert.match(synthesis.label, new RegExp(LAB.ITEMS[salt].n.toLowerCase()));
assert.ok(!synthesis.label.includes(LAB.ITEMS[saturated].n.toLowerCase()));
assert.equal(g.G.inv.c_catalyst, 1);
console.log("✓ Синтез учитывает подходящее сырьё и показывает выбранный сорт и катализатор перед расходом");

function incident(id, until) {
  g.G.event = id;
  g.G.eventUntil = g.G.min + until;
}
g.enterFloor(2, 3, "down", true);
const origin = g.CUR.key;
incident("reboot", 10);
const terminal = g.CUR.fl.objs.find(o => o.type === "terminal") || { type: "terminal" };
g.objMenu(terminal);
assert.equal(top().title, "Обстановка этажа");
assert.match(top().items[0].label, /Перезагрузка систем.*10 мин/);
assert.equal(g.ride(1), false);
assert.equal(work.effTier(benchState), 1);
g.enterFloor(2, 4, "down", true);
assert.notEqual(g.CUR.key, origin);
assert.equal(g.gridOffline(), false);
g.advanceTime(3);
g.enterFloor(2, 3, "up", true);
assert.equal(g.gridOffline(), true);
assert.match(g.environmentText(), /7 мин/);
assert.ok(g.saveSlot(2) && g.loadSlot(2));
assert.equal(g.gridOffline(), true);
g.advanceTime(7);
assert.equal(g.G.event, "norm");
assert.equal(work.effTier(benchState), 4);

incident("smoke", 2);
const b = g.G.body;
b.tox = 0;
assert.equal(g.canHear(g.G.x + 2, g.G.y), true);
assert.equal(g.canHear(g.G.x + 2, g.G.y + 1), false);
g.advanceTime(2);
assert.equal(g.G.event, "norm");
assert.ok(b.tox >= 4 && b.tox < 5, b.tox);
assert.equal(g.canHear(g.G.x + 12, g.G.y), true);
incident("cold", 8);
assert.ok(g.coldFactor() > 1);
incident("norm", 40);
assert.equal(g.coldFactor(), 1);
const food = b.food, wake = b.wake;
g.advanceTime(3);
const regularFood = food - b.food, regularWake = wake - b.wake;
incident("heat", 8);
const beforeHeatFood = b.food, beforeHeatWake = b.wake;
g.advanceTime(3);
assert.ok(beforeHeatFood - b.food > regularFood);
assert.ok(beforeHeatWake - b.wake > regularWake);

g.G.min = 1438;
incident("airloss", 21);
g.G.inv.airmask = 1;
g.G.inv.oxygen_tank = 2;
g.G.hp = 50;
assert.ok(g.useItem("airmask"));
assert.equal(g.G.airGear.oxygen, 12);
g.advanceTime(13);
assert.equal(g.G.hp >= 50, true);
assert.equal(g.G.inv.oxygen_tank, 0);
assert.equal(g.G.airGear.oxygen, 11);
assert.equal(g.G.event, "airloss");
assert.ok(g.saveSlot(2) && g.loadSlot(2));
assert.equal(g.G.airGear.on, true);
assert.equal(g.G.airGear.oxygen, 11);
g.advanceTime(9);
assert.equal(g.G.airGear.oxygen, 3);
assert.equal(g.G.event, "norm");
incident("airloss", 9);
const beforeHypoxia = g.G.hp;
g.advanceTime(7);
assert.ok(g.G.hp < beforeHypoxia);
console.log("✓ Аварии, отдельное время этажей, возврат и загрузка, расход кислорода через полночь");

let mounted;
g.newGame();
LAB.combat.stop();
g.G.seed = "regression-wall-fixtures";
for (const L of [1, 2, 4, 18, 101]) {
  const fl = LAB.getFloor(g.G.seed, L, 2);
  for (const o of fl.objs.filter(o => o.wallFrom)) {
    const [x, y] = o.wallFrom;
    assert.equal(fl.t[LAB.idx(o.x, o.y)], LAB.T.WALL);
    assert.equal(fl.objAt[LAB.idx(o.x, o.y)], o);
    assert.equal(fl.t[LAB.idx(x, y)], LAB.T.ROOM);
    assert.equal(fl.room[LAB.idx(x, y)], o.room);
    assert.ok(!LAB.solidAt(fl, x, y));
    if (o.fx === "drawings" || o.fx === "clock") mounted = { L, o };
  }
}
assert.ok(mounted);
g.enterFloor(mounted.L, 2, "down", true);
const fixtureOnWall = g.CUR.fl.objs.find(o => o.id === mounted.o.id);
[g.G.x, g.G.y] = fixtureOnWall.wallFrom;
const target = g.adjacentTargets().find(t => t.ref === fixtureOnWall);
assert.ok(target);
assert.equal(g.tryMove(target.dir, false), false);
assert.equal(g.CUR.focus.ref, fixtureOnWall);
assert.deepEqual([g.G.x, g.G.y], Array.from(fixtureOnWall.wallFrom));
g.objMenu(fixtureOnWall);
assert.ok(top().title);
console.log("✓ Настенная обстановка остаётся доступной со стороны комнаты и освобождает пол");
