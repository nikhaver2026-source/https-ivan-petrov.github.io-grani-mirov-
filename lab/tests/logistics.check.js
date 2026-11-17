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
assert.equal(load.capacity(), 30);
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
delete d.flaw;
hero.mind = 18;
assert.equal(drone.energyCost(12), 10);
assert.equal(drone.energyCost(1), 1);
inDanger = true;
assert.equal(drone.addMod("cargo"), false);
inDanger = false;
assert.equal(drone.addMod("boost"), false);
assert.equal(drone.addMod("cargo"), true);
assert.equal(drone.addMod("boost"), true);
assert.equal(load.capOf("drone"), 20);
assert.equal(drone.addMod("battery"), false);
assert.equal(drone.delMod("cargo"), false);
assert.equal(drone.delMod("boost"), true);
const servos = hero.inv.servo;
assert.equal(drone.addMod("boost"), true);
assert.equal(hero.inv.servo, servos);
assert.equal(hero.inv.dr_mod_boost, 0);

hero.inv = { scrap: 1 };
d.en = 2;
drone.onStep();
assert.equal(d.en, 2);
hero.inv.scrap = Math.ceil((load.capacity() + 2) / load.itemWt("scrap"));
LAB.combat.foes().forEach(foe => { foe.dead = true; });
assert.ok(["N", "E", "S", "W"].some(direction => g.tryMove(direction, false)));
assert.equal(d.en, 1);
drone.onStep();
assert.equal(d.en, 0);
assert.equal(load.capOf("drone"), 12);
assert.ok(messages.some(text => /Тяговый блок разряжен/.test(text)));
hero.ammo.energy = 1;
drone.chargeBat();
assert.equal(load.capOf("drone"), 20);
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
assert.equal(load.capOf("drone"), 20);
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
assert.equal(load.capOf("drone"), 12);
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
assert.equal(g.G.inv.dr_mod_cargo, 1);
console.log("✓ Команды, ограничения разведки и совместимость сохранений");

// Продвинутые ступени и общие ресурсы проверяются после загрузки старой записи.
const exo = LAB.exo, forge = LAB.forge, h = g.G;
Object.keys(LAB.ITEMS).filter(id => LAB.ITEMS[id].kind === "part").forEach(id => { h.inv[id] = 30; });
h.inv.kv_ctrl = 1;
h.inv.rubber = 10;
h.mind = 25;
const grown = drone.build({ name: "Стриж" });
assert.ok(grown);
delete grown.flaw;
assert.equal(drone.addMod("cargo"), true);
assert.equal(drone.upgradeMod("cargo"), false);
drone.onXP(750);
assert.equal(grown.lvl, 3);
assert.equal(drone.upgradeMod("cargo"), true);
assert.equal(drone.setRole("cargo"), true);
assert.equal(drone.carryCapacity(), 16);
drone.onXP(3000);
assert.equal(grown.lvl, 6);
assert.equal(drone.upgradeMod("cargo"), false);
work.bench(currentBench).tier = 4;
assert.equal(drone.upgradeMod("cargo"), true);
assert.equal(drone.carryCapacity(), 18);
assert.equal(drone.delMod("cargo"), true);
assert.equal(h.inv.dr_mod_cargo_r3, 1);
assert.ok(drone.invItems().some(item => /Грузовой захват, ступень 3/.test(item.label)));
assert.equal(drone.addMod("cargo", 3), true);
assert.equal(drone.modRank(grown, "cargo"), 3);
assert.equal(drone.addMod("battery"), true);
grown.en = 61;
assert.equal(drone.upgradeMod("battery"), true);
assert.equal(drone.upgradeMod("battery"), true);
assert.equal(grown.enMax, 195);
assert.equal(grown.en, 61);
assert.equal(drone.setRole("support"), true);
assert.equal(drone.energyCost(10, "medic"), 6);
assert.equal(drone.carryCapacity(), 16);

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
assert.equal(Object.keys(drone.MODS).length, 40);
assert.equal(Object.keys(catalog.modifications).length, 200);
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
  assert.ok(catalog.metrics[tune.metric] && tune.fits.every(k => drone.MODS[k]), id);
}
console.log("✓ Каталог: 40 устройств, 200 модификаций, 500 специализаций и 800 направлений");

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
work.bench(checkedBench).tier = 6;
work.bench(checkedBench).dmg = false;
checked.event = "norm";
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
  if (id === "arc") assert.ok(host.hp < 100 && living.hp < 100);
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
console.log("✓ Все семь новых стволов выполняют команды, сканер сохраняет тайные двери");
