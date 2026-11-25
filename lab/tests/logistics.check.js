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
const sightBeforeSurvey = LAB.los, eventBeforeSurvey = hero.event, energyBeforeSurvey = drone.D().en;
LAB.los = () => true;
const atFour = { kind: "item", item: "chip", x: hero.x + 4, y: hero.y };
const atSix = { kind: "item", item: "isotope", x: hero.x + 6, y: hero.y };
g.floorItems = () => [atFour, atSix];
for (const [event, poison, distant] of [["norm", 0, true], ["smoke", 0, false],
  ["norm", 0, true], ["norm", 3, false], ["norm", 0, true]]) {
  hero.event = event;
  hero.st.poison = poison;
  LAB.combat.useImplantFree("scan");
  assert.ok(messages.at(-1).includes(g.itemName(atFour)), messages.at(-1));
  assert.equal(messages.at(-1).includes(g.itemName(atSix)), distant);
  drone.D().cd.scan = 0;
  drone.D().en = energyBeforeSurvey;
  assert.ok(drone.scanSupplies());
  assert.ok(messages.at(-1).includes(g.itemName(atFour)), messages.at(-1));
  assert.equal(messages.at(-1).includes(g.itemName(atSix)), distant);
}
hero.event = eventBeforeSurvey;
drone.D().en = energyBeforeSurvey;
LAB.los = sightBeforeSurvey;
g.floorItems = floorItems;
console.log("✓ Сканер героя и поиск дрона видят предметы дальше четырёх шагов в норме, ограничение действует при аварии или отравлении");

assert.equal(g.saveSlot(3), true);
const alpha56Slot = JSON.parse(storage.get("lab_slot3"));
alpha56Slot.meta.ver = "Альфа 5.6";
storage.set("lab_slot3", JSON.stringify(alpha56Slot));
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
const earlyBefore = g.G.L;
g.G.L = 1;
for (const id of ["dr_gimbal", "dr_optic"]) assert.ok(work.uses(id).unk > 0, id);
g.G.L = earlyBefore;
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
assert.equal(g.canHear(g.G.x + 4, g.G.y), true);
assert.equal(g.canHear(g.G.x + 3, g.G.y + 2), false);
assert.match(g.environmentText(), /четырёх шагов/);
g.advanceTime(2);
assert.equal(g.G.event, "norm");
assert.ok(b.tox >= 4 && b.tox < 5, b.tox);
assert.equal(g.canHear(g.G.x + 12, g.G.y), true);
for (const event of ["dark", "surge", "steam", "quake", "reboot", "cold", "heat", "airloss"]) {
  incident(event, 10);
  assert.equal(g.hearingRange(), 4, event);
}
incident("norm", 40);
g.G.st.poison = 3;
assert.equal(g.canHear(g.G.x + 2, g.G.y + 2), true);
assert.equal(g.canHear(g.G.x + 5, g.G.y), false);
g.lookAround();
assert.match(messages.at(-1), /четырёх шагов/);
g.G.st.poison = 0;
b.tox = 20;
assert.equal(g.hearingRange(), 4);
g.G.inv.antidote = 1;
assert.ok(g.useItem("antidote"));
assert.equal(g.hearingRange(), Infinity);
console.log("✓ Слышимость до четырёх шагов при авариях и отравлении, восстановление после лечения");

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

menus.length = 0;
g.newGame(); LAB.combat.stop();
g.G.lvl = 21;
delete g.G.chs;
assert.ok(g.saveSlot(3));
assert.equal(JSON.parse(storage.get(g.slotKey(3))).g.chs, undefined);
assert.ok(g.loadSlot(3));
assert.equal(stats.S().pts, 4);
assert.ok(stats.spend("agi", 1));
assert.ok(g.saveSlot(3) && g.loadSlot(3));
assert.equal(stats.S().pts, 3);
g.G.lvl = 25;
stats.onLevel(); stats.onLevel();
assert.equal(stats.S().pts, 4);
g.G.hp = 40;
g.G.body.food = 80;
g.G.diff = 1;
stats.S().sec.regen = 5;
stats.minutes(60);
assert.equal(g.G.hp, 70);
stats.hurt(1);
stats.minutes(1);
assert.equal(g.G.hp, 70);

const converted = JSON.parse(storage.get(g.slotKey(3)));
delete converted.g.chs.milestones;
converted.g.chs.pts = 0;
storage.set(g.slotKey(3), JSON.stringify(converted));
storage.delete(g.slotKey(3) + "_bak");
assert.ok(g.loadSlot(3));
stats.menu();
selectMenuItem(/^Вернуть пропущенные очки/);
const legacyAward = top().items.find(it => it.kind === "slider");
assert.match(legacyAward.fmt(legacyAward.get()), /уровень 20, вернуть 4 очка/);
legacyAward.fn(); legacyAward.fn();
assert.equal(stats.S().pts, 4);
assert.equal(stats.S().milestoneRecoveryMax, undefined);
menus.length = 0;

const gest = LAB.gestures;
const altered = gest.list.find(row => row.id === "t4");
assert.ok(gest.set(altered.id, "none"));
LAB.settings.gSwipe = 1.3;
LAB.settings.gHold = 800;
LAB.settings.gTapGap = 500;
LAB.saveSettings();
const reopened = vm.createContext({ LAB: {}, console, performance, setTimeout: noop, setInterval: noop,
  clearTimeout: noop, clearInterval: noop, addEventListener: noop,
  document: ctx.document, navigator: ctx.navigator, location: ctx.location, localStorage: ctx.localStorage });
reopened.window = reopened;
for (const name of ["engine", "gestures"]) vm.runInContext(fs.readFileSync(path.join(root, "js", name + ".js"), "utf8"), reopened);
assert.equal(reopened.LAB.gestures.actionOf("t4"), "none");
assert.equal(reopened.LAB.settings.gSwipe, 1.3);
assert.equal(reopened.LAB.settings.gHold, 800);
assert.equal(reopened.LAB.settings.gTapGap, 500);
console.log("✓ Перенос четырёх вех без повторной выдачи, регенерация на среднем и жесты после перезапуска");

incident("airloss", 12);
g.G.inv.airmask = 1;
delete g.G.airGear;
g.G.inv.oxygen_tank = 1;
g.G.drawn = true;
const weaponBefore = g.G.weapons[g.G.wi];
const batteryBefore = g.G.ammo[weaponBefore.ammo];
weaponBefore.charge = 0;
assert.equal(LAB.combat.fire("S", false), false);
assert.equal(g.G.drawn, false);
g.toggleDraw();
g.reload();
assert.equal(g.G.drawn, false);
assert.equal(g.G.ammo[weaponBefore.ammo], batteryBefore);
assert.ok(g.useItem("airmask"));
g.toggleDraw();
assert.equal(g.G.drawn, true);
g.useItem("airmask");
assert.equal(g.G.drawn, false);
g.G.seed = "regression-followup";
g.enterFloor(2, 3, "down", true);
LAB.combat.stop();
incident("norm", 100);
const restingCapsule = g.CUR.fl.objs.find(o => o.type === "capsule");
assert.ok(restingCapsule);
openCapsule = null;
ctx.setTimeout = (fn, ms) => { if (ms === 1200) openCapsule = fn; return 0; };
try { LAB.capsule.menu(restingCapsule); } finally { ctx.setTimeout = originalTimeout; }
assert.equal(typeof openCapsule, "function");
openCapsule();
const foodBeforeRest = g.G.body.food;
selectMenuItem(/^Полежать/);
assert.ok(g.G.body.food < foodBeforeRest);
LAB.capsule.leave();
console.log("✓ Маска восстанавливает возможность стрелять, капсула расходует сытость");

menus.length = 0;
g.G.inv = { wire: 120, medkit_s: 8, lockcard: 1 };
g.G.ammo.energy = 20;
const recyclePost = g.CUR.fl.objs.find(o => o.type === "supply");
g.objMenu(recyclePost);
selectMenuItem(/^Центр утилизации/);
const cr0 = g.G.credits;
selectMenuItem(/^Утилизировать .*провод/i);
const batchSlider = top().items[1];
assert.ok(batchSlider.step >= 10);
batchSlider.set(20);
batchSlider.fn();
assert.equal(g.G.inv.wire, 100);
assert.ok(g.G.credits > cr0);
menus.length = 0;
const chemTable = g.CUR.fl.objs.find(o => o.type === "chemlab");
assert.ok(chemTable);
g.objMenu(chemTable);
selectMenuItem(/^Личное хранилище/);
load.takeParts();
assert.ok(g.G.inv.wire >= 100);
selectMenuItem(/^Сложить всё, что поместится/);
selectMenuItem(/^Подтвердить/);
assert.equal(g.G.inv.medkit_s, undefined);
assert.ok(load.locker().inv.medkit_s >= 8);
assert.ok(load.locker().ammo.energy >= 20);
assert.equal(g.G.weapons[g.G.wi], weaponBefore);
menus.length = 0;
load.lockerMenu("chem");
selectMenuItem(/^Забрать из хранилища/);
selectMenuItem(/^Ячейка .*Детали/);
selectMenuItem(/провод/i);
assert.ok(top().items.some(row => row.kind === "slider" && row.step >= 10));
console.log("✓ Утилизация партиями, доступ у химического стола, выгрузка и крупная выдача");

menus.length = 0;
g.newGame(); LAB.combat.stop();
g.G.seed = "regression-field-orders";
g.enterFloor(23, 2, "down", true);
const originalThreats = LAB.combat.foes().slice();
originalThreats.forEach(f => { f.dead = true; });
incident("norm", 500);
function moveToObject(o) {
  const p = g._routeTo(null, o);
  assert.ok(p, o.type + " " + o.id);
  if (p.length) [g.G.x, g.G.y] = p.at(-1);
}
const fieldTerminal = g.CUR.fl.objs.find(o => o.type === "terminal" && g._routeTo(null, o));
assert.ok(fieldTerminal);
moveToObject(fieldTerminal);
g.objState(fieldTerminal).hacked = true;
g.objMenu(fieldTerminal);
selectMenuItem(/^Полевые задания этажа$/);
assert.equal(top().items.length - 1, 3);
for (let mission = 0; mission < 3; mission++) {
  const originId = fieldTerminal.id;
  const source = g.CUR.fl.objs.find(o => o.id === originId);
  if (mission > 0) LAB.quests.fieldBoard(source);
  top().items[mission].fn();
  let order = g.CUR.fs.fieldOrders.orders[mission];
  if (mission === 0) {
    assert.ok(g.saveSlot(1) && g.loadSlot(1));
    order = g.CUR.fs.fieldOrders.orders[mission];
    assert.equal(order.accepted, true);
  }
  for (let n = 0; n < 2; n++) {
    const guide = LAB.quests.navTargets().find(t => /^полевое задание/.test(t.n));
    assert.equal(guide.o.id, order.sites[n]);
    moveToObject(guide.o);
    g.objMenu(guide.o);
    const row = selectMenuItem(/^Снять показание/);
    row.fn();
    assert.equal(order.step, n + 1);
  }
  menus.length = 0;
  const returnTo = LAB.quests.navTargets().find(t => /^полевое задание/.test(t.n));
  assert.equal(returnTo.o.id, originId);
  moveToObject(returnTo.o);
  LAB.quests.fieldBoard(returnTo.o);
  top().items[mission].fn();
  selectMenuItem(/^Открыть форму решения/);
  const rows = top().items.slice();
  const before = g.G.credits;
  const bars = rows.filter(row => row.kind === "slider");
  const choices = rows.filter(row => row.kind === "choice");
  if (bars.length) {
    const [sum, diff] = rows.slice(0, 2).map(row => Number(row.label.match(/(?:минус )?(\d+)\./)[1]) * (/минус \d/.test(row.label) ? -1 : 1));
    const confirm = rows.find(row => row.label === "Проверить расход");
    confirm.fn();
    assert.equal(g.G.credits, before);
    bars[0].set((sum + diff) / 2); bars[1].set((sum - diff) / 2);
    confirm.fn(); confirm.fn();
  } else if (choices.length) {
    const [start, next, third, last] = Array.from((rows[0].label + rows[1].label).matchAll(/«([^»]+)»/g), m => m[1]).filter((_, i) => i !== 2);
    [start, next, third, last].forEach((name, i) => {
      assert.ok(choices[i].options.some(opt => opt.v === name));
      choices[i].set(name);
    });
    rows.find(row => row.label === "Проверить порядок").fn();
  } else {
    const [series, section] = rows.slice(0, 2).map(row => row.label.match(/\d+/)[0]);
    rows.find(row => row.label.includes("Серия " + series + ", секция " + section)).fn();
  }
  assert.equal(order.done, true);
  assert.equal(g.G.credits, before + 24 + 23 + 2);
}
assert.ok(g.saveSlot(1) && g.loadSlot(1));
assert.ok(g.CUR.fs.fieldOrders.orders.every(order => order.done));
console.log("✓ Три вида полевых задач через терминал, навигатор, оба поста и сохранение");

menus.length = 0;
g.newGame(); LAB.combat.stop();
g.G.seed = "regression-echo-turns";
g.enterFloor(1, 2, "down", true);
incident("norm", 500);
const nearbyFoes = LAB.combat.foes();
nearbyFoes.forEach(f => { f.dead = true; });
g.CUR.fl.doors.filter(d => !d.lock || d.lock.type !== "secret").forEach(d => { g.CUR.fs.doors[d.id] = 2; });
const navStairs = g.CUR.fl.objs.find(o => o.type === "stairs_down");
assert.ok(navStairs && g._routeTo(null, navStairs)?.length > 4);
LAB.settings.navMode = "full";
LAB.settings.autoDoors = 1;
g.CUR.fs.mapped = false;
const beforeGuide = messages.length;
g.navigateTo({ n: "лестница вниз", o: navStairs, main: true });
assert.equal(g.navFollow().o, navStairs);
let walked = 0;
while (g.navFollow() && walked++ < 400) {
  const next = g._navPath()[0];
  const [x, y] = next;
  const dir = x > g.G.x ? "E" : x < g.G.x ? "W" : y > g.G.y ? "S" : "N";
  if (!g.tryMove(dir, false)) {
    const door = g.doorAt(x, y);
    if (door) g.CUR.fs.doors[door.id] = 2;
    assert.ok(g.tryMove(dir, false), "Маршрут к лестнице идёт по проходимым клеткам");
  }
}
assert.ok(g.touchesObject(navStairs, g.G.x, g.G.y));
assert.ok(messages.slice(beforeGuide).some(t => /Дальше —/.test(t)));
assert.ok(messages.slice(beforeGuide).some(t => /Вы у цели: лестница вниз/.test(t)));
console.log("✓ «Эхо» ведёт без карты через двери и повороты до выбранной лестницы");

const blueprints = nearbyFoes.find(f => f.kind === "mech" && !f.boss && !LAB.combat.isCam(f));
assert.ok(blueprints);
const machines = [1, 2, 3].map(i => ({ ...blueprints, id: "service-bot-" + i, hp: 1, x: g.G.x, y: g.G.y,
  dead: false, calm: false, ally: false, state: "hunt", blindT: 0 }));
nearbyFoes.splice(0, nearbyFoes.length, ...machines);
g.G.en = 10;
LAB.implants.run("trojan");
assert.equal(machines.filter(f => f.blindT > 0).length, 2);
assert.ok(machines.filter(f => f.blindT > 0).every(f => f.lastKnown.x === g.G.x && f.state === "alert"));
const charged = machines[0];
nearbyFoes.splice(1);
LAB.implants.run("siphon");
const energyAfterSiphon = g.G.en;
assert.ok(energyAfterSiphon > 10 && energyAfterSiphon <= 22);
assert.equal(charged.hp, 1);
LAB.implants.run("siphon");
assert.equal(g.G.en, energyAfterSiphon);
charged.blindT = 0;
LAB.implants.run("trojan");
assert.equal(charged.blindT, 0);
const quickFrame = { id: "test-quick-frame", en: 0, cell: 1 };
g.G.frames = [quickFrame];
g.G.exoOn = quickFrame.id;
g.G.ammo.energy = 2;
LAB.drone.quick();
selectMenuItem(/^Зарядить каркас энергобатареей/);
assert.equal(quickFrame.en, 60);
assert.equal(g.G.ammo.energy, 1);
console.log("✓ Сифон не наносит урона, троян ограничен целью и временем, каркас заряжается из быстрых команд");

const damageAudio = [];
LAB.Sound = { play: (id, opts) => damageAudio.push({ id, ...opts }), onRebuild: noop };
vm.runInContext(fs.readFileSync(path.join(root, "js", "atmos.js"), "utf8"), ctx);
const oldHas = LAB.Bank.has;
LAB.Bank.has = id => Boolean(LAB.SND[id]);
g.G.hp = g.G.hpMax;
LAB.atmos.navStart([[g.G.x - 1, g.G.y], [g.G.x - 1, g.G.y + 1]]);
assert.equal(damageAudio.at(-1).pan, -0.8);
LAB.atmos.hurt("phys", 2, null, { ranged: true });
assert.ok(damageAudio.some(sound => sound.id === "hit_flesh" && !sound.at));
assert.ok(damageAudio.some(sound => sound.id === "player_pain" && sound.lp <= 2000 && sound.gain < 0.5));
damageAudio.length = 0;
LAB.atmos.hurt("shock", 2, null, { critical: true });
assert.ok(damageAudio.some(sound => sound.id === "hurt_shock"));
assert.ok(damageAudio.some(sound => sound.id === "bump_body"));
LAB.Bank.has = oldHas;
console.log("✓ Сигнал на первом шаге пути, локальные попадание, разряд и тяжёлый удар");

// Наряды выдаются через обычный пункт снабжения и проходят через настоящие объекты этажей.
LAB.atmos = {};
delete LAB.Sound;
g.newGame(); LAB.combat.stop();
g.G.seed = "operation-regression-2";
const dispatchL = 2, dispatchF = 6, nearbyF = 5;
g.G.elev[dispatchL] = true;
g.enterFloor(dispatchL, nearbyF, "down", true);
g.enterFloor(dispatchL, dispatchF, "up", true);
const opDoors = () => {
  for (const d of g.CUR.fl.doors) if (d.lock?.type !== "secret") g.CUR.fs.doors[d.id] = 2;
  for (const f of LAB.combat.foes()) f.dead = true;
  incident("norm", 1000);
};
function dispatch(pick) {
  opDoors();
  const origin = g.CUR.fl.objs.find(o => o.type === "supply");
  moveToObject(origin);
  menus.length = 0;
  g.objMenu(origin);
  selectMenuItem(/^Операции комплекса$/);
  const board = top(), option = selectMenuItem(pick);
  assert.ok(g.G.operation, messages.at(-1));
  return { option, board };
}
function opTargetUI() {
  menus.length = 0;
  const op = g.G.operation, target = op.sites[op.step];
  if (g.G.F !== target.F) {
    const nav = LAB.quests.navTargets().find(t => /^операция /.test(t.n));
    assert.equal(nav.o.type, "elevator");
    assert.match(nav.n, new RegExp("этаж " + target.F));
    moveToObject(nav.o);
    let arrive;
    ctx.setTimeout = (fn, ms) => { if (ms === 1600 + Math.abs(target.F - g.G.F) * 260) arrive = fn; return 0; };
    try {
      g.objMenu(nav.o);
      selectMenuItem(/^Вызвать лифт$/);
      selectMenuItem(new RegExp("^Этаж " + target.F + "(?:\\D|$)", "i"));
      assert.equal(typeof arrive, "function");
      arrive();
    } finally { ctx.setTimeout = originalTimeout; }
    assert.equal(g.G.F, target.F);
    opDoors();
  }
  const nav = LAB.quests.navTargets().find(t => /^операция /.test(t.n));
  const obj = nav.o;
  assert.equal(target.npc ? obj.key : obj.id, target.id);
  moveToObject(obj);
  if (target.npc) {
    const row = LAB.quests.npcItems(obj).find(it => /^Передать припасы по наряду/.test(it.label));
    assert.ok(row);
    row.fn();
  } else g.objMenu(obj);
  assert.match(top().title, /^Операция\./);
  return obj;
}
const freightOffer = /^(Запчасти для подъёмников|Контейнеры холодного хранения)/;
const freightBoard = dispatch(freightOffer);
let freight = g.G.operation;
assert.equal(freight.sites[1].F, nearbyF);
g.G.inv.lead = 135;
LAB.quests.operationQuestItem().fn();
assert.ok(top().items.some(row => /Малая партия.*нужна разгрузка/.test(row.label)));
assert.ok(!top().items.some(row => /^Принять\./.test(row.label)));
delete g.G.inv.lead;
g.G.drone = { ...stockDrone, en: 80 };
const baseMass = load.total();
LAB.quests.operationQuestItem().fn();
const cargoChoice = selectMenuItem(/^Принять\. Полная партия/);
assert.ok(freight.cargo >= 145);
assert.equal(load.total(), Math.round((baseMass + freight.cargo) * 10) / 10);
assert.equal(load.parts().cargo, freight.cargo);
cargoChoice.fn();
assert.equal(freight.step, 1);
assert.ok(g.saveSlot(2) && g.loadSlot(2));
freight = g.G.operation;
assert.equal(load.parts().cargo, freight.cargo);
opDoors();
const freightOrigin = g.CUR.fs;
opTargetUI();
const bill = g.G.credits;
const freightItem = selectMenuItem(/^Сдать груз по пломбе/);
assert.equal(g.G.operation, null);
assert.equal(load.parts().cargo, undefined);
assert.equal(g.G.credits - bill, freightOrigin.opsDone.freight.reward);
const freightBase = 36 + dispatchL + dispatchF + 10 + Math.floor(freight.cargo / 4);
assert.equal(g.G.credits - bill, freightBase + 18);
freightItem.fn();
assert.equal(g.G.credits - bill, freightOrigin.opsDone.freight.reward);
freightBoard.option.fn();
assert.equal(g.G.operation, null);
console.log("✓ Межэтажная доставка: грузоподъёмность, пломба, сохранение, настоящий лифт и однократная выплата");

// Ручной контур на обесточенном этаже и запчасти как независимые пути.
g.enterFloor(dispatchL, dispatchF, "elev", true);
dispatch(/^(Вывести секцию на резерв|Ток для ночной смены)/);
opTargetUI();
selectMenuItem(/^Проверить показания/);
opTargetUI();
incident("reboot", 14);
LAB.quests.operationQuestItem().fn();
assert.ok(top().items.some(row => /сервисной батареи/.test(row.label)));
const savedPuzzleOpen = LAB.puzzles.open;
let solve, puzzleKind, attemptSeed;
LAB.puzzles.open = (kind, seed, cb) => { puzzleKind = kind; attemptSeed = seed; solve = cb; return true; };
selectMenuItem(/^Настроить вручную/);
assert.ok(["breaker", "power"].includes(puzzleKind));
const firstAttempt = attemptSeed;
solve(false);
assert.equal(g.G.operation.step, 1);
LAB.quests.operationQuestItem().fn();
selectMenuItem(/^Настроить вручную/);
assert.notEqual(attemptSeed, firstAttempt);
solve(true);
assert.equal(g.G.operation, null);
assert.equal(g.CUR.fs.reserve.power, true);
assert.equal(g.G.eventUntil - g.G.min, 9);
assert.equal(g.installReserve("power"), false);
assert.ok(g.saveSlot(2) && g.loadSlot(2));
assert.equal(g.CUR.fs.reserve.power, true);
assert.equal(g.G.eventUntil - g.G.min, 9);
assert.match(g.environmentText(), /Резервный контур/);

dispatch(/^(Дым в воздуховодах|Второй контур воздуха)/);
opTargetUI();
selectMenuItem(/^Проверить показания/);
opTargetUI();
Object.assign(g.G.inv, { filter: 2, scrap: 10, wire: 8, reagent: 3 });
const beforeAir = { ...g.G.inv };
const fromField = g.G.operation.id;
incident("smoke", 20);
LAB.quests.operationQuestItem().fn();
selectMenuItem(/^Установить исправные детали/);
const used = fromField === 2 ? { filter: 1, scrap: 1 } : { wire: 2, reagent: 1 };
for (const [id, n] of Object.entries(used)) assert.equal(g.G.inv[id], beforeAir[id] - n);
assert.equal(g.CUR.fs.reserve.air, true);
assert.equal(g.G.eventUntil - g.G.min, 12);
console.log("✓ Питание и вентиляция: два пути ремонта, цена деталей, уменьшение аварии и сохранение результата");

dispatch(/^(Глухой участок связи|Резервный канал)/);
assert.equal(g.G.operation.quiet, true);
opTargetUI();
selectMenuItem(/^Проверить показания/);
g.enterFloor(dispatchL, 4, "elev", true);
LAB.quests.onAlarm(2);
assert.equal(g.G.operation.quiet, true);
g.enterFloor(dispatchL, dispatchF, "elev", true);
LAB.quests.onAlarm(2);
assert.equal(g.G.operation.quiet, false);
opDoors();
opTargetUI();
assert.equal(!!g.CUR.fs.mapped, false);
selectMenuItem(/^Настроить вручную/);
assert.ok(["frequencies", "route"].includes(puzzleKind));
solve(true);
assert.equal(g.CUR.fs.mapped, true);
assert.equal(g.G.operation, null);
LAB.puzzles.open = savedPuzzleOpen;

g.enterFloor(dispatchL, dispatchF, "elev", true);
dispatch(/^(Перевязочный запас|Запас после едкого выброса)/);
opTargetUI();
selectMenuItem(/^Проверить показания/);
const aidId = g.G.operation.id;
opTargetUI();
Object.assign(g.G.inv, { medkit_s: 3, antidote: 2, bandage: 4, gel: 2, ration: 5, sorbent: 3 });
LAB.quests.operationQuestItem().fn();
const supplyBefore = { ...g.G.inv };
selectMenuItem(/^Передать комплект/);
const aidNeed = aidId === 8 ? { medkit_s: 1 } : { antidote: 1, bandage: 1 };
for (const [id, n] of Object.entries(aidNeed)) assert.equal(g.G.inv[id], supplyBefore[id] - n);
assert.ok(g.CUR.fs.opsDone.aid);

dispatch(/^(Отчёт с мёртвой линии|Пломба без свидетелей)/);
opTargetUI();
selectMenuItem(/^Снять копию/);
opTargetUI();
selectMenuItem(/^Снять копию/);
assert.equal(g.G.operation.step, 2);
opTargetUI();
const nums = label => [...label.matchAll(/\d+/g)].map(m => +m[0]);
const [command, ownSync] = nums(top().items.find(it => /^Основной журнал/.test(it.label)).label);
const [ start, end, refSync ] = nums(top().items.find(it => /^Независимый журнал/.test(it.label)).label);
const minute = command - (ownSync - refSync);
const verdict = minute < start ? 0 : minute > end ? 2 : 1;
const statements = top().items.filter(it => /^Заключение/.test(it.label));
statements[(verdict + 1) % 3].fn();
assert.ok(g.G.operation);
statements[verdict].fn();
assert.equal(g.G.operation, null);
assert.ok(g.CUR.fs.opsDone.archive);
assert.ok(g.CUR.fs.opsDone.relay);
console.log("✓ Связь, снабжение и расследование: работа ОКО, карта, расход припасов и сверка двух часов");

// В следующей аварии работает тот же сохранённый резерв.
const eventPool = LAB.EVENTS.filter(e => !e.after || LAB.depth(g.G.L, g.G.F) >= e.after);
const rebootAt = eventPool.findIndex(e => e.id === "reboot");
const rollReboot = (eventPool.slice(0, rebootAt).reduce((n, e) => n + e.w, 0) + 0.5) / eventPool.reduce((n, e) => n + e.w, 0);
const originalRandom = vm.runInContext("Math.random", ctx);
ctx.rebootRoll = rollReboot;
vm.runInContext("Math.random = function () { return rebootRoll; };", ctx);
try {
  incident("norm", 1);
  g.advanceTime(1);
  assert.equal(g.G.event, "reboot");
  const [minimum, maximum] = eventPool[rebootAt].minutes;
  assert.equal(g.G.eventUntil - g.G.min, Math.ceil((minimum + Math.floor(rollReboot * (maximum - minimum + 1))) * 0.6));
} finally {
  ctx.preTestRandom = originalRandom;
  vm.runInContext("Math.random = preTestRandom; delete window.preTestRandom; delete window.rebootRoll;", ctx);
}
g.enterFloor(dispatchL, nearbyF, "elev", true);
delete g.G.elev[dispatchL];
dispatch(freightOffer);
assert.equal(g.G.operation.sites[1].F, nearbyF);
const baseLate = load.total();
selectMenuItem(/^Принять\. Малая партия/);
assert.ok(load.total() > baseLate);
LAB.quests.operationQuestItem().fn();
selectMenuItem(/^Снять груз и закрыть наряд/);
selectMenuItem(/^Да\. Оставить контейнер/);
assert.equal(g.G.operation, null);
assert.equal(load.total(), baseLate);

dispatch(freightOffer);
selectMenuItem(/^Принять\. Малая партия/);
const cargoLate = g.G.operation.cargo;
incident("norm", 1000);
g.advanceTime(g.G.operation.budget + 1);
opTargetUI();
assert.ok(top().items.some(it => /Срок премии вышел/.test(it.label)));
const beforeLate = g.G.credits;
selectMenuItem(/^Сдать груз по пломбе/);
assert.equal(g.G.credits - beforeLate, 36 + dispatchL + nearbyF + Math.floor(cargoLate / 4));
console.log("✓ Будущие аварии с резервом, рейс без пропуска, снятие груза и сдача после окончания срока");

g.enterFloor(80, 4, "down", true);
g.G.inv = {};
g.G.drone = { ...stockDrone, en: 80 };
dispatch(freightOffer);
assert.ok(top().items.some(it => /Промышленная партия.*нужна разгрузка/.test(it.label)));
g.G.drone = { ...stockDrone, en: 80, cargoFrame: 2, mods: ["cargo_frame"], ranks: { cargo_frame: 3 } };
assert.equal(drone.carryCapacity(), 6000);
LAB.quests.operationQuestItem().fn();
selectMenuItem(/^Принять\. Промышленная партия/);
const industrial = g.G.operation.cargo;
assert.ok(industrial >= 5000);
assert.ok(load.canMove());
assert.equal(load.parts().cargo, industrial);
opTargetUI();
const industrialBefore = g.G.credits;
selectMenuItem(/^Сдать груз по пломбе/);
assert.equal(g.G.credits - industrialBefore, 36 + 80 + 4 + Math.floor(100 + (industrial - 400) / 12) + 18);
assert.equal(load.parts().cargo, undefined);
console.log("✓ Тяжёлая платформа позволяет взять промышленную партию свыше пяти тонн");

// Матрица обследований покрывается реальными адресами и у каждой комбинации свой набор правил.
const rift = LAB.rift;
assert.equal(rift.count, 3000);
const riftSeed = "rift-expedition-regression";
const encounters = new Set(), signatures = new Set();
const representatives = [];
for (let k = 0; k < 3000; k++) {
  const L = 101 + Math.floor(k / LAB.FLOORS_N), F = 1 + k % LAB.FLOORS_N;
  const id = rift.serial(riftSeed, L, F), entry = rift.spec(id);
  encounters.add(id);
  signatures.add([entry.radius, entry.interval, entry.field.cue, entry.foe.n, entry.chain.seq.join(",")].join("|"));
  if (!representatives[entry.p] && entry.h === entry.p % 5 && entry.m === entry.p % 5)
    representatives[entry.p] = { L, F, id };
  for (const resource of Object.keys(entry.trace[3])) assert.ok(LAB.ITEMS[resource], resource);
}
assert.equal(encounters.size, 3000);
assert.equal(signatures.size, 3000);
assert.equal(representatives.filter(Boolean).length, 6);
for (const [id, def] of Object.entries(LAB.SND).filter(([id]) => /^rift_/.test(id))) {
  assert.equal(def.f.length, 2, id);
  for (const asset of def.f) assert.equal(fs.readFileSync(path.join(root, "sounds", asset)).subarray(0, 4).toString(), "OggS");
}
assert.equal(Object.keys(LAB.SND).filter(id => /^rift_/.test(id)).length, 21);

g.newGame(); LAB.combat.stop();
g.G.seed = riftSeed;
for (const id of ["gel", "reagent", "wire", "scrap", "chip", "cap", "servo", "panel", "cell", "dp_alloy", "supercond", "powercell"])
  g.G.inv[id] = 12;
g.G.drone = { ...stockDrone, en: 90 };
const riftSounds = [];
LAB.atmos = { play: id => riftSounds.push(id), at: id => riftSounds.push(id), deafen: noop };
const typesHeard = new Set();
for (const representative of representatives) {
  const { L, F, id } = representative, entry = rift.spec(id);
  g.enterFloor(L, F, "down", true);
  opDoors();
  g.G.en = g.G.enMax;
  const station = g.CUR.fl.objs.find(o => o.type === "supply");
  moveToObject(station);
  menus.length = 0;
  g.objMenu(station);
  selectMenuItem(/^Аномальные обследования$/);
  selectMenuItem(/^Взять обследование/);
  let q = g.CUR.fs.riftCase;
  assert.ok(q && q.id === id, messages.at(-1));
  const labs = new Set();
  const latticeBefore = g.G.inv.rift_lattice || 0;
  for (const stage of entry.chain.seq) {
    assert.notEqual(g.G.dead, true);
    assert.equal(entry.chain.seq[q.step], stage);
    if (stage === "hunt" && !q.killed) {
      const target = rift.nav();
      assert.match(target.n, /^тварь у аномалии/);
      assert.equal(target.o.type, "rift_hunter_" + entry.m);
      LAB.combat.damageFoe(target.o, 1000000, "kinetic", { quiet: true });
      assert.ok(q.killed, "гибель врага отмечает этап охоты");
    }
    const dest = rift.nav().o;
    assert.equal(dest.id, q.sites[stage]);
    moveToObject(dest);
    menus.length = 0;
    g.objMenu(dest);
    assert.match(top().title, /^Аномалия\./);
    if (stage === "probe") {
      selectMenuItem(/^Включить зонд/);
      const enemy = LAB.combat.foes().find(f => f.id === q.foe);
      assert.ok(enemy && enemy.beh.length);
      assert.equal(enemy.type, "rift_hunter_" + entry.m);
      typesHeard.add(enemy.type);
      const initialCharge = g.G.en, initialHp = g.G.hp, initialTox = g.G.body.tox;
      for (let i = 0; i < entry.interval; i++) rift.step();
      if (entry.h === 0) assert.ok(g.G.en < initialCharge, "поле снимает заряд");
      if (entry.h === 1) assert.ok(g.G.body.tox > initialTox, "аэрозоль отравляет");
      if (entry.h === 2) assert.ok(g.G.st.slow > 0, "ледяной сдвиг замедляет");
      if (entry.h === 3) assert.ok(g.G.hp < initialHp, "поле сжатия ранит");
      if (entry.h === 4) assert.ok(g.G.st.deaf > 0, "звуковой провал оглушает");
      if (entry.p === 5) {
        assert.ok(g.saveSlot(3) && g.loadSlot(3));
        q = g.CUR.fs.riftCase;
        assert.ok(LAB.combat.foes().some(f => f.id === q.foe && !f.dead));
        assert.equal(q.step, 1);
      }
    }
    if (stage === "brew") {
      assert.ok(top().items.some(it => /Матрица .*Расход/.test(it.label)));
      if (dest.type === "chemlab") {
        LAB.chem.station(dest).dirty = true;
        selectMenuItem(/^Приготовить запечатанную ампулу/);
        assert.match(messages.at(-1), /Стол загрязнён/);
        LAB.chem.station(dest).dirty = false;
      }
      const before = { ...g.G.inv };
      if (entry.chain.rank === 3) {
        const setting = +top().items.find(it => /^Замер активной камеры/.test(it.label)).label.match(/\d+/)[0];
        const dial = top().items.find(it => /^Деление дозатора/.test(it.label));
        selectMenuItem(/^Приготовить запечатанную ампулу/);
        assert.match(messages.at(-1), /Деление дозатора/);
        assert.equal(g.G.inv.reagent, before.reagent);
        dial.set(setting);
      }
      selectMenuItem(/^Приготовить запечатанную ампулу/);
      assert.equal(q.sites.quench, rift.nav()?.o.id, messages.at(-1));
      for (const [resource, n] of Object.entries(entry.trace[3])) assert.equal(g.G.inv[resource], before[resource] - n);
      assert.equal(g.G.inv["rift_vial_" + entry.i], 1);
      assert.ok(g.dropWhy("rift_vial_" + entry.i));
    }
    if (stage === "quench") {
      selectMenuItem(/^Вставить ампулу/);
      assert.equal(q.field, false);
      assert.equal(g.G.inv["rift_vial_" + entry.i] || 0, 0);
    }
    if (stage === "hunt") selectMenuItem(/^Подтвердить осмотр/);
    if (stage === "listen") {
      const wanted = top().items.find(it => /^Исходная запись/.test(it.label)).label.slice("Исходная запись. ".length).replace(/\.$/, "");
      const guesses = top().items.filter(it => /^Выбрать запись/.test(it.label));
      const tones = [];
      LAB.Sound = { tone: (...args) => tones.push(args) };
      try { selectMenuItem(/^Прослушать исходный сигнал/); } finally { delete LAB.Sound; }
      assert.equal(tones.length, 3);
      assert.ok(tones.every(x => x[2].bus === "puzzle") && tones[1][2].when > tones[0][2].when);
      const before = q.step;
      guesses.find(it => !it.label.endsWith(wanted)).fn();
      assert.equal(q.step, before);
      guesses.find(it => it.label.endsWith(wanted)).fn();
    }
    if (stage === "lift") {
      const before = load.total();
      selectMenuItem(/^Взять контейнер/);
      assert.equal(load.total(), Math.round((before + q.cargo) * 10) / 10);
      if (entry.p === 5) {
        assert.ok(g.saveSlot(3) && g.loadSlot(3));
        q = g.CUR.fs.riftCase;
        assert.equal(load.parts().anomaly, q.cargo);
        assert.ok(q.killed);
      }
    }
    if (stage === "unload") {
      selectMenuItem(/^Сдать опломбированный/);
      assert.equal(load.parts().anomaly, undefined);
    }
    if (stage === "seal") {
      const expected = +top().items.find(it => /^Контрольная отметка/.test(it.label)).label.match(/\d+/)[0];
      const valve = top().items.find(it => it.kind === "slider");
      valve.set((expected + 1) % 10);
      valve.fn();
      assert.equal(q.done, undefined);
      valve.set(expected);
      const credits = g.G.credits;
      valve.fn(); valve.fn();
      assert.equal(g.G.credits - credits, 26 + entry.chain.seq.length * 7 + Math.min(65, Math.floor(LAB.Le(L) / 3)));
    }
    labs.add(stage);
  }
  assert.equal(q.done, true, [...labs].join(", "));
  assert.equal((g.G.inv.rift_lattice || 0) - latticeBefore, entry.chain.rank === 3 ? 2 : 1);
}
assert.equal(typesHeard.size, 5);
for (const id of ["probe", "mix", "seal", "carry", "ok", "error"])
  assert.ok(riftSounds.includes("rift_" + id), id);
console.log("✓ 3000 адресуемых конфигураций, все шесть цепочек, пять тварей, поле, химия, звук, перенос и загрузка");

let riftBench;
for (let F = 1; F <= 9 && !riftBench; F++) {
  g.enterFloor(101, F, "down", true);
  opDoors();
  riftBench = g.CUR.fl.objs.find(o => o.type === "workbench" && g._routeTo(null, o));
}
assert.ok(riftBench);
moveToObject(riftBench);
const researchBench = work.bench(riftBench);
for (const id of ["wire", "scrap", "chip", "cap", "servo", "panel", "cell", "dp_alloy", "supercond", "powercell"])
  g.G.inv[id] = 30;
researchBench.tier = 8; researchBench.dmg = false;
const mountedW = g.G.weapons[g.G.wi];
const bareAccuracy = work.accBonus(mountedW, false);
const bareHeat = work.hmax(mountedW);
const bareMass = load.weaponWt(mountedW);
let originalDangerRift = LAB.combat.danger;
LAB.combat.danger = () => false;
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
selectMenuItem(/^Собрать\. Оружейный блок/);
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
const gunRow = top().items.find(it => it.label === mountedW.name + ". Установить резонатор");
gunRow.fn();
assert.ok(Math.abs(load.weaponWt(mountedW) - (bareMass + 1.1)) < 1e-7);
const [aim, cool, mute] = top().items.filter(it => it.kind === "slider");
aim.set(10);
assert.equal(aim.get(), 4);
mute.set(0); cool.set(0); aim.set(10); cool.set(10);
assert.equal(cool.get(), 2);
assert.ok(Math.abs(work.accBonus(mountedW, false) - bareAccuracy - 0.06) < 1e-7);
assert.equal(work.hmax(mountedW), bareHeat * 1.05);

const liftingDrone = g.G.drone;
liftingDrone.cargoFrame = 2; liftingDrone.mods = ["cargo_frame"]; liftingDrone.ranks = { cargo_frame: 1 };
const liftBare = drone.carryCapacity(), costBare = drone.energyCost(12, "zapper");
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
selectMenuItem(/^Собрать\. Блок дрона/);
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
selectMenuItem(/^Дрон-спутник\. Установить резонатор/);
assert.ok(drone.carryCapacity() > liftBare);
assert.equal(drone.energyCost(12, "zapper"), costBare - 1);

const sealed = LAB.exo.build("sealed");
assert.ok(sealed);
assert.equal(LAB.exo.riftGuard(sealed), 4);
const haulFrame = LAB.exo.build("haul");
const walkFrame = LAB.exo.build("walk");
assert.ok(haulFrame && walkFrame);
assert.ok(load.frameWt(haulFrame) > load.frameWt(walkFrame));
g.G.str = 15; g.G.con = 15;
assert.equal(LAB.exo.equip(haulFrame), true);
const frameBase = load.capOf("exo");
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
selectMenuItem(/^Собрать\. Блок каркаса/);
work.open(riftBench);
selectMenuItem(/^Резонаторные модули\./);
top().items.find(it => it.label === LAB.exo.frameName(haulFrame) + ". Установить резонатор").fn();
const specialization = top().items.find(it => it.kind === "choice");
specialization.set(1);
assert.equal(load.capOf("exo"), frameBase + 18);
assert.ok(g.saveSlot(3) && g.loadSlot(3));
assert.deepEqual(Array.from(g.G.weapons[g.G.wi].rift.v), [10, 2, 0]);
assert.equal(LAB.exo.worn().rift.profile, 1);
assert.equal(load.capOf("exo"), frameBase + 18);
assert.ok(riftSounds.includes("rift_tune") && riftSounds.includes("rift_frame_walk"));
LAB.combat.danger = originalDangerRift;
console.log("✓ Сборка и калибровка оружия, дрона и трёх новых каркасов с реальными эффектами и сохранением");

// Происшествия на маршруте: все адреса, разные реакции, реальные шаги и журнал.
const haunt = LAB.haunt;
assert.equal(haunt.count, 3000);
const hauntStarts = [3, 101, 1501, 12701];
const hauntIds = new Set(), hauntVariants = new Set();
for (const [rank, level] of hauntStarts.entries()) {
  for (let n = 0; n < 750; n++) {
    const h = haunt.spec(haunt.serial("haunt-coverage", level + Math.floor(n / LAB.FLOORS_N), n % LAB.FLOORS_N + 1));
    assert.equal(h.rank, rank);
    hauntIds.add(h.i + 25 * h.rule + 125 * h.proc + 750 * h.rank);
    hauntVariants.add([h.origin[0], h.rule, h.proc, h.d.n].join("|"));
  }
  assert.equal(haunt.spec(haunt.serial("haunt-coverage", level - 1, LAB.FLOORS_N))?.rank ?? -1, rank - 1);
}
assert.equal(hauntIds.size, 3000);
assert.equal(hauntVariants.size, 3000);
assert.equal(haunt.spec(haunt.serial("haunt-coverage", LAB.deepLevelsN(), 20)).rank, 3);
const hauntKeys = Object.keys(LAB.SND).filter(key => /^haunt_/.test(key));
assert.equal(hauntKeys.length, 46);
for (const key of hauntKeys) {
  assert.ok(LAB.SOUND_ALL.includes(key), key);
  assert.equal(fs.readFileSync(path.join(root, "sounds", LAB.SND[key].f[0])).subarray(0, 4).toString(), "OggS", key);
}
for (const level of LAB.LEVELS.slice(1, 101)) assert.ok(!level.foes.some(type => type.startsWith("haunt_")));

const hauntSounds = [];
LAB.atmos = {
  at: (id, x, y) => hauntSounds.push([id, x, y]),
  play: id => hauntSounds.push([id])
};
LAB.settings.turnBased = false;
LAB.ui.layer = () => top() || null;
LAB.ui.closeAll = () => { menus.length = 0; };
const hauntDirs = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const hauntOpen = [/^Выждать паузу/, /^Записать ближний/, /^Записать ритм/, /^Нанести метку/, /^Снять показания трёх/, /^Включить переносной/];
const normalNow = vm.runInContext("Date.now", ctx);
ctx.hauntClock = normalNow();
vm.runInContext("Date.now = function () { return hauntClock; };", ctx);
function hauntMove(dir, run = false) {
  ctx.hauntClock += 700;
  const paused = g.tryMove(dir, run);
  assert.equal(paused, true, JSON.stringify({ dir, position: [g.G.x, g.G.y], stage: g.CUR.fs.haunt?.stage, messages: messages.slice(-5) }));
}
function hauntWalk(cell) {
  const route = g._routeTo(cell);
  assert.ok(route, JSON.stringify(cell));
  for (const [x, y] of route) {
    const dir = hauntDirs.find(([dx, dy]) => g.G.x + dx === x && g.G.y + dy === y);
    assert.ok(dir);
    const foe = g.foeAt(x, y);
    if (foe && foe.id === g.CUR.fs.haunt.foe) {
      assert.equal(LAB.combat.damageFoe(foe, foe.hp * 100, "phase", { quiet: true }), true);
    }
    hauntMove(dir[2]);
  }
}
function hauntMenu(pattern) {
  menus.length = 0;
  const item = haunt.journalItem();
  assert.ok(item);
  item.fn();
  selectMenuItem(pattern);
  menus.length = 0;
}
function setHauntFloor(rank, proc, rule) {
  menus.length = 0;
  g.newGame();
  LAB.combat.stop();
  const L = hauntStarts[rank] + 3, F = 2;
  for (let n = 0; ; n++) {
    assert.ok(n < 10000);
    const seed = "haunt-first-entry-" + n;
    const candidate = haunt.spec(haunt.serial(seed, L, F));
    if (candidate.proc === proc && candidate.rule === rule) {
      g.G.seed = seed;
      break;
    }
  }
  g.enterFloor(L, F, "down", true);
  LAB.combat.foes().forEach(f => { f.dead = true; });
  g.G.inv = {};
  g.G.stats.steps = 40;
  incident("norm", 500);
  const fl = g.CUR.fl;
  fl.doors.forEach(d => {
    if (!d.lock) g.CUR.fs.doors[d.id] = 2;
  });
  const havenRoom = fl.rooms.find(r => g.CUR.fs.haven?.[r.id]);
  const roomFor = (d, dx, dy) => g.roomAt(d.x + dx, d.y + dy);
  for (const d of fl.doors) {
    if (d.lock) continue;
    for (const [dx, dy, dir] of hauntDirs) {
      if (!roomFor(d, dx, dy) || !g.passable(d.x + dx, d.y + dy)) continue;
      g.G.x = d.x; g.G.y = d.y;
      hauntMove(dir);
      if (g.CUR.fs.haunt) {
        const q = g.CUR.fs.haunt;
        assert.ok(!havenRoom || q.room !== havenRoom.id);
        assert.deepEqual(Array.from(q.source), [g.G.x, g.G.y]);
        assert.ok(g._routeTo(q.remote).length >= 4);
        assert.ok(hauntSounds.some(([key, x, y]) => key === "haunt_origin" + haunt.spec(q.id).i && x === q.source[0] && y === q.source[1]));
        assert.match(haunt.journalItem().label, /Происшествие.*Снять исходное показание/);
        return q;
      }
    }
  }
  assert.fail("Нет связной комнаты для " + L);
}

try {
  for (let proc = 0; proc < hauntOpen.length; proc++) {
    const rank = [0, 1, 2, 2, 3, 1][proc], rule = [0, 1, 4, 3, 2, 0][proc];
    let q = setHauntFloor(rank, proc, rule);
    const config = haunt.spec(q.id), credits = g.G.credits;
    if (proc === 1) {
      // Стоянка взвесь накапливает. Фильтр и маска работают через состояние игрока.
      hauntMenu(hauntOpen[proc]);
      ctx.hauntClock += 3200;
      g.G.inv.airmask = 1;
      g.G.airGear = { on: true, oxygen: 9 };
      q.heat = config.d.limit - 2;
      haunt.idle();
      assert.equal(g.G.body.tox, 0);
      g.G.airGear.on = false;
      q.heat = config.d.limit - 2;
      haunt.idle();
      assert.ok(g.G.body.tox > 0);
    } else hauntMenu(hauntOpen[proc]);

    switch (proc) {
      case 0:
        q.heat = config.d.limit - 2;
        const HP = g.G.hp;
        hauntMenu(/^Замереть/);
        assert.equal(g.G.hp, HP);
        break;
      case 1:
        hauntMenu(/^Указать путь/);
        assert.deepEqual(Array.from(g.navFollow().cell), Array.from(q.remote));
        hauntWalk(q.remote);
        break;
      case 2: {
        const rhythms = [/^Короткий, короткий, длинный$/, /^Короткий, длинный, короткий$/, /^Длинный, короткий, короткий$/];
        hauntMenu(/^Прослушать запись/);
        assert.match(messages.at(-1), new RegExp(rhythms[config.rhythm].source.slice(0, -1)));
        hauntMenu(rhythms[(config.rhythm + 1) % rhythms.length]);
        assert.equal(q.stage, "echo");
        assert.ok(g.saveSlot(2) && g.loadSlot(2));
        q = g.CUR.fs.haunt;
        assert.equal(q.stage, "echo");
        assert.equal(haunt.spec(q.id).rhythm, config.rhythm);
        hauntMenu(rhythms[config.rhythm]);
        break;
      }
      case 3:
        hauntWalk(q.remote);
        assert.equal(q.stage, "compare");
        hauntWalk(q.source);
        hauntMenu(/^Сверить обе отметки/);
        break;
      case 4: {
        const grounds = [/^Заземлить\. Настил$/, /^Заземлить\. Стена$/, /^Заземлить\. Воздуховод$/];
        q.heat = config.d.limit - 2;
        const hp = g.G.hp;
        hauntMenu(grounds[(config.channel + 1) % grounds.length]);
        assert.ok(g.G.hp < hp);
        assert.ok(q.foe);
        assert.equal(LAB.combat.foes().find(f => f.id === q.foe).type, "haunt_treader");
        assert.ok(g.saveSlot(2) && g.loadSlot(2));
        q = g.CUR.fs.haunt;
        const follower = LAB.combat.foes().find(f => f.id === q.foe);
        assert.ok(follower && !follower.dead);
        assert.equal(LAB.combat.damageFoe(follower, follower.hp * 100, "phase", { quiet: true }), true);
        LAB.combat.foes().filter(f => !f.id.startsWith("s")).forEach(f => { f.dead = true; });
        hauntMenu(grounds[config.channel]);
        break;
      }
      case 5: {
        const [x, y] = g._routeTo(q.remote)[0];
        hauntMove(hauntDirs.find(([dx, dy]) => g.G.x + dx === x && g.G.y + dy === y)[2], true);
        assert.equal(q.stage, "inspect");
        hauntWalk(q.source);
        hauntMenu(hauntOpen[proc]);
        hauntWalk(q.remote);
        break;
      }
    }
    if (rank > 1) {
      assert.equal(q.stage, "seal");
      hauntWalk(q.source);
      hauntMenu(/^Закрыть контур$/);
    }
    if (rank === 3) {
      assert.equal(q.stage, "verify");
      hauntWalk(q.remote);
      hauntMenu(/^Проверить тишину/);
      assert.equal(q.stage, "lock");
      hauntWalk(q.source);
      hauntMenu(/^Запереть контур/);
    }
    assert.equal(q.stage, "done");
    assert.equal(g.G.credits - credits, [12, 26, 48, 85][rank]);
    assert.equal(haunt.nav(), null);
    assert.equal(haunt.journalItem(), null);
    if (rank === 3) {
      assert.ok(g.loadSlot("auto"));
      assert.equal(g.CUR.fs.haunt.stage, "done");
      assert.equal(g.G.credits - credits, 85);
      assert.ok(g.G.journal.some(line => line.includes(config.origin[0])));
    }
  }
  assert.ok(hauntSounds.some(([id]) => id === "haunt_answer"));
  assert.ok(hauntSounds.some(([id]) => id === "haunt_closed"));
  assert.ok(hauntSounds.some(([id]) => id === "haunt_treader"));
  console.log("✓ 3000 новых адресов, четыре глубины угрозы, шесть способов пройти, 46 звуков, сохранение и единичная выплата");

  // Используем настоящий стек окон, включая реальные вызовы навигатора из вложенного журнала.
  const liveHaunt = setHauntFloor(0, 1, 0);
  const windowList = { children: [], set innerHTML(value) { this.children.length = 0; },
    appendChild(child) { this.children.push(child); } };
  const windowNodes = { win: { hidden: true }, winTitle: {}, winList: windowList };
  Object.assign(ctx.document, {
    body: { setAttribute: noop },
    createElement: () => ({ addEventListener: noop }),
    getElementById: id => windowNodes[id] || null
  });
  vm.runInContext(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"), ctx, { filename: "js/ui.js" });
  LAB.ui.setScreen("game");
  function activateHauntRow(pattern) {
    const panel = LAB.ui.top();
    panel.i = panel.items.findIndex(row => typeof row.label === "string" && pattern.test(row.label));
    assert.ok(panel.i >= 0, panel.title + " " + pattern);
    LAB.ui.activate();
  }
  LAB.ui.inventory();
  activateHauntRow(/^Журнал$/);
  assert.match(windowList.children[0].textContent, /^Происшествие\./);
  activateHauntRow(/^Происшествие\./);
  activateHauntRow(/^Записать ближний замер$/);
  assert.equal(liveHaunt.stage, "distance");
  LAB.ui.quests();
  activateHauntRow(/^Происшествие\./);
  activateHauntRow(/^Указать путь к текущей точке$/);
  assert.equal(LAB.ui.layer(), null);
  assert.deepEqual(Array.from(g.navFollow().cell), Array.from(liveHaunt.remote));
  console.log("✓ Настоящий интерфейс Журнала и Заданий, подписи для скринридера и выход к навигатору");
} finally {
  ctx.hauntRealNow = normalNow;
  vm.runInContext("Date.now = hauntRealNow; delete window.hauntRealNow; delete window.hauntClock;", ctx);
}

// Запись передаётся штатному позиционированию со свежей панорамой и радиусом в дыму.
let spatialHaunt;
LAB.Sound = { onRebuild: noop, play: (id, opts) => { spatialHaunt = { id, opts }; } };
LAB.registerSounds();
vm.runInContext(fs.readFileSync(path.join(root, "js/atmos.js"), "utf8"), ctx, { filename: "js/atmos.js" });
const [soundX, soundY] = g.CUR.fs.haunt.source;
LAB.atmos.at("haunt_origin0", soundX, soundY, { follow: true });
assert.equal(spatialHaunt.id, "haunt_origin0");
const position = spatialHaunt.opts.position;
g.G.x = soundX - 2;
assert.equal(position().dx, 2);
g.G.x = soundX + 2;
assert.equal(position().dx, -2);
g.G.event = "smoke";
g.G.x = soundX + 4;
assert.equal(position().muted, false);
g.G.x = soundX + 5;
assert.equal(position().muted, true);
console.log("✓ Пространственный звук меняет сторону и соблюдает четыре шага в дыму");
