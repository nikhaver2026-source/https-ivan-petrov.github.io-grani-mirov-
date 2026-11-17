#!/usr/bin/env node
/* Запуск: node lab/tests/curio-cache.check.js */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const noop = () => {};
const slots = new Map(), spoken = [], sounds = [];
const context = vm.createContext({
  console, performance, TextDecoder, TextEncoder,
  setTimeout: () => 0, setInterval: () => 0, clearTimeout: noop, clearInterval: noop,
  addEventListener: noop, removeEventListener: noop,
  document: { body: { setAttribute: noop }, addEventListener: noop, removeEventListener: noop, getElementById: () => null },
  navigator: { userAgent: "Node" }, location: { protocol: "http:" },
  localStorage: { getItem: key => slots.get(key) || null, setItem: (key, val) => slots.set(key, val), removeItem: key => slots.delete(key) }
});
context.window = context;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const [, file] of html.matchAll(/<script src="(js\/[^"]+)"/g)) {
  if (!/^js\/(?:main|input|atmos|sound)\.js$/.test(file)) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
}
const LAB = context.LAB, g = LAB.game, CU = LAB.curios;
LAB.say = text => spoken.push(String(text));
LAB.atmos = {};
LAB.Sound = { has: () => false, tone: noop, play: (id, options) => sounds.push({ id, options }) };
const top = LAB.ui.top;
const actions = () => top().items.map(item => item.label);
const choose = label => {
  const menu = top(), index = menu.items.findIndex(item => typeof label === "string" ? item.label === label : label.test(item.label));
  assert.ok(index >= 0, `Нет пункта «${label}» в окне «${menu.title}»`);
  menu.i = index;
  LAB.ui.activate();
  return spoken.at(-1);
};
let danger = false;
LAB.combat.danger = () => danger;
LAB.deepLevelsN();
LAB.enrichLevelFoes();
g.newGame();
LAB.combat.stop();
g.G.seed = "lab-curio-cache-check";
LAB.clearFloorCache();

function enter(level, floor) {
  g.enterFloor(level, floor, "down", true);
  LAB.combat.stop();
  LAB.combat.foes().forEach(foe => { foe.dead = true; });
}
function open(p) {
  const objects = g.CUR.fl.objs;
  const o = objects.find(o => o.id === p.o.id);
  const stand = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [o.x + dx, o.y + dy]).find(([x, y]) => g.passable(x, y));
  assert.ok(stand, "К механизму можно подойти");
  [g.G.x, g.G.y] = stand;
  LAB.ui.closeAll();
  assert.ok(LAB.fixtures.menu(o));
  assert.ok(actions().includes(o.fx === "globe" ? "Раскрутить глобус и остановить пальцем" : "Приложить ладонь к стеклу"));
  assert.match(choose("Осмотреть"), /Тайник/);
  choose(/^(Разобраться с тайником|Открытый тайник)\./);
  assert.equal(top().title, p.def.n);
  return g.objState(o);
}
const specimens = new Map();
let paired = false, leadFixture = null;
for (const level of [1, 2, 4, 7, 16, 25, 43, 44, 81, 93]) {
  for (let floor = 1; floor <= 14; floor++) {
    const fl = LAB.getFloor(g.G.seed, level, floor);
    if (!fl.objs.some(o => o.fx === "globe" || o.fx === "aquarium")) continue;
    enter(level, floor);
    const found = g.CUR.fl.objs.filter(o => o.fx === "globe" || o.fx === "aquarium").map(o => CU._cache(o)).filter(Boolean);
    assert.ok(found.length > 0 && found.length <= 2);
    assert.equal(new Set(found.map(p => p.o.fx)).size, found.length);
    paired ||= found.length === 2;
    for (const p of found) {
      if (!specimens.has(p.key)) specimens.set(p.key, { level, floor, p });
      if (!leadFixture && p.def.lead) {
        const door = fl.doors.find(d => d.lock?.type === "secret" && !d.lock.inner && fl.rooms[d.room]?.name &&
          Math.abs(d.x - p.o.x) + Math.abs(d.y - p.o.y) < 25 && d.side &&
          !(p.o.fx === "globe" && CU._hint(p.o)?.room === fl.rooms[d.room].name && CU._hint(p.o)?.side === d.side));
        if (door) leadFixture = { level, floor, p };
      }
    }
    if (specimens.size === 8 && leadFixture && paired) break;
  }
  if (specimens.size === 8 && leadFixture && paired) break;
}
assert.deepEqual([...specimens.keys()].sort(), ["balance", "current", "echo", "flow", "meridian", "mirror", "stars", "voyage"]);
assert.ok(paired && leadFixture);
const turntable = specimens.get("meridian").p;
const ring = turntable.evidence.match(/такой\. ([^.]+)\./)[1].split(", ");
const origin = turntable.rule.match(/«([^»]+)»/)[1];
let position = ring.indexOf(origin);
const computedRoute = [origin];
for (const [, steps, direction] of turntable.rule.matchAll(/на (\d+) делени\S* (вправо|влево)/g)) {
  position = (position + (direction === "вправо" ? 1 : -1) * Number(steps) + ring.length) % ring.length;
  computedRoute.push(ring[position]);
}
assert.deepEqual(computedRoute, Array.from(turntable.answer));
const sky = specimens.get("stars").p;
const groups = Array.from(sky.evidence.matchAll(/([а-яё]+) — (\d+)/g), ([, mark, value]) => ({ mark, value: Number(value) }));
const target = Number(sky.rule.match(/счёт (\d+)/)[1]);
const triples = groups.flatMap((a, i) => groups.slice(i + 1).flatMap((b, j) => groups.slice(i + j + 2)
  .filter(c => a.value + b.value + c.value === target).map(c => [a.mark, b.mark, c.mark])));
assert.deepEqual(triples, [Array.from(sky.answer)]);
const soundLog = specimens.get("echo").p;
const tally = Array.from(soundLog.evidence.matchAll(/\d+/g), m => Number(m[0]));
const buttons = ["одна насечка", "две насечки", "три насечки", "четыре насечки", "пять насечек"];
assert.deepEqual(tally.map((value, i) => buttons[value - (tally[i - 1] || 0) - 1]), Array.from(soundLog.answer));

const picked = pick => pick.forEach(mark => choose("Отметить. " + mark));
for (const [key, { level, floor, p }] of specimens) {
  enter(level, floor);
  const s = open(p);
  assert.equal(new Set(p.answer).size, p.answer.length, key);
  assert.ok(p.answer.every(mark => p.marks.includes(mark)), key);
  assert.equal(choose("Осмотреть метки"), p.evidence);
  assert.equal(choose("Прочитать инструкцию"), p.rule);
  assert.equal(actions().includes("Услышать полное решение"), false);
  const bad = p.answer.slice().reverse();
  picked(bad);
  assert.match(choose("Проверить последовательность"), /Защёлка удерживает крышку/);
  assert.equal(s.cabinet.open, false);
  assert.equal(s.cabinet.draft.length, p.answer.length);
  assert.match(choose("Убрать последнюю отметку"), new RegExp(`Введено ${p.answer.length - 1}`));
  choose("Очистить последовательность");
  assert.equal(choose("Первая подсказка"), p.hints[0]);
  assert.equal(choose("Вторая подсказка"), p.hints[1]);
  assert.ok(choose("Услышать полное решение").includes(p.answer.join(", ")));
  if (p.o.fx === "aquarium") s.off = s.dead = 1;
  picked(p.answer);
  assert.match(choose("Проверить последовательность"), /Выберите, что забрать/);
  assert.equal(s.cabinet.open, true);
  assert.equal(s.bottom, undefined);
  assert.equal(s.bar, undefined);
  const names = actions().filter(label => label.startsWith("Забрать."));
  assert.ok(names.length >= 3, key);
  assert.match(choose(/^Забрать\. Записка/), /Взято/);
  const record = g.G.noteList.find(n => n.src.cache === key);
  assert.ok(record && g.noteFull(record).x.length > 80);
  assert.equal(s.cabinet.taken.toString(2).replace(/0/g, "").length, 1);
}
console.log("✓ Восемь вариантов на обычных этажах, подсказки, неверные ответы, открытие и документы");

const { level, floor, p } = leadFixture;
enter(level, floor);
if (g.objState(p.o).cabinet?.open) delete g.objState(p.o).cabinet;
open(p);
choose("Первая подсказка");
picked(p.answer.slice(0, 2));
assert.equal(g.saveSlot(2), true);
assert.equal(g.loadSlot(2), true);
LAB.combat.stop();
const saved = open(p);
assert.deepEqual(Array.from(saved.cabinet.draft), Array.from(p.answer.slice(0, 2)));
assert.equal(saved.cabinet.hints, 1);
assert.ok(actions().includes("Вторая подсказка"));
const afterReload = CU._cache(p.o);
assert.deepEqual(Array.from(afterReload.answer), Array.from(p.answer));
picked(p.answer.slice(2));
const stale = top().items.find(it => it.label === "Проверить последовательность");
danger = true;
assert.match(choose("Проверить последовательность"), /рядом опасность/);
danger = false;
choose("Проверить последовательность");
assert.ok(saved.cabinet.open);
stale.fn();
const [first, second] = p.def.loot;
const before = g.G.inv[first[0]] || 0;
g.G.inv.scrap = 400;
const findMaterial = id => new RegExp("^Забрать\\. " + LAB.ITEMS[id].n);
assert.match(choose(findMaterial(first[0])), /останется в тайнике/);
assert.equal(g.G.inv[first[0]] || 0, before);
delete g.G.inv.scrap;
const oldTake = top().items.find(it => findMaterial(first[0]).test(it.label));
choose(findMaterial(first[0]));
oldTake.fn();
assert.equal(g.G.inv[first[0]], before + first[1]);
assert.ok(actions().some(label => /Записка «(Сквозняк|Схема с пометкой)»/.test(label)));
assert.match(choose(/Забрать\. Записка «(Сквозняк|Схема с пометкой)»/), /Взято/);
const lead = g.G.noteList.find(n => n.src.id === p.o.id + "-cache-lead");
assert.ok(lead);
assert.match(g.noteFull(lead).x, /стен/);
assert.equal(g.saveSlot(2), true);
assert.equal(g.loadSlot(2), true);
LAB.combat.stop();
open(p);
assert.ok(!actions().some(label => findMaterial(first[0]).test(label)));
assert.ok(actions().some(label => findMaterial(second[0]).test(label)));
assert.equal(g.G.inv[first[0]], before + first[1]);
assert.match(g.noteFull(g.G.noteList.find(n => n.src.id === p.o.id + "-cache-lead")).x, /стен/);
oldTake.fn();
assert.equal(g.G.inv[first[0]], before + first[1]);
assert.ok(sounds.some(s => s.id === "open_desk") && sounds.some(s => s.id === "open_crate"));
assert.ok(sounds.every(({id, options}) => LAB.SND[id].f.length > 0 && options.fb === null));
console.log("✓ Черновик, перезагрузка, защита от повторной выдачи, груз, привязка записки к двери и звуковые события");
