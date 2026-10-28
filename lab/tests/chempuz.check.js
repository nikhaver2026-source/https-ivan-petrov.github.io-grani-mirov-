#!/usr/bin/env node
/* Проверка химических задач (js/chempuz.js, 3.6): пять видов × три
   сложности × зёрна. Для каждой задачи: тексты чистые (нет undefined,
   NaN, прямых кавычек, латиницы, неряшливых склеек); устройство по
   сложности (титрование — капель в своём диапазоне; склянок 3–5 и у
   каждой своя «подпись» проб — их можно различить; опасных шагов 1–3;
   хроматограмма раскладывается единственным образом; у цепочки путь есть,
   не короче нужного и укладывается в запас операций); решение по
   разгадке (_last) пунктами меню проходит; на части зёрен — неверный
   ответ: окно задачи не закрывается, после третьего — провал; «Отойти от
   задачи» — провал с пометкой «отошёл». Окна — как в ui.js.
   Запуск: node lab/tests/chempuz.check.js [число зёрен, не меньше 60] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(60, Number(process.argv[2]) || 60);
const timers = [];
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp,
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js", "js/chempuz.js"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.error("нет файла " + f); process.exit(1); }
  vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;
let fails = 0;
const errs = {};
function err(m) { fails++; const k = m.slice(0, 60); errs[k] = (errs[k] || 0) + 1; if (errs[k] <= 3) console.error("✗ " + m); }

/* ── заглушки игры ── */
const said = [];
let sayN = 0;
LAB.say = t => { said.push(String(t)); sayN++; };
LAB.UI = { ok() {}, error() {}, open() {}, close() {}, click() {}, move() {}, fanfare() {} };
LAB.atmos = { play() {} };
LAB.game = { G: { L: 15, seed: "t", F: 1, x: 0, y: 0 }, CUR: { key: "15-1" } };
LAB.tutor = { ev() { return true; } };

/* ── окна: те же правила, что в ui.js ── */
const stack = [];
const labelOf = it => typeof it.label === "function" ? String(it.label()) : String(it.label);
const top = () => stack.length ? stack[stack.length - 1] : null;
LAB.ui = {
  menu(title, items, opts) {
    opts = opts || {};
    items = (items || []).filter(Boolean);
    if (!items.length) return null;
    for (let si = stack.length - 1; si >= 0; si--) if (stack[si].title === title) { stack.splice(si); break; }
    const w = { title, items, i: 0, keep: !!opts.keep, rebuild: opts.rebuild || null, note: false };
    stack.push(w);
    return w;
  },
  note(title, text, after, opts) {
    opts = opts || {};
    const w = LAB.ui.menu(title, [{ label: String(text), keep: true, fn() {} }, { label: opts.closeLabel || "Закрыть", fn() { if (after) after(); } }], {});
    w.note = true; w.text = String(text);
  },
  closeTop() { if (!top()) return false; stack.pop(); const t = top(); if (t && t.rebuild) t.items = t.rebuild(); return true; },
  closeAll() { stack.length = 0; },
  top, refresh() { const t = top(); if (t && t.rebuild) t.items = t.rebuild(); }, render() {}
};
function activate(w, idx) {
  const it = w.items[idx]; w.i = idx;
  if (it.close) { LAB.ui.closeTop(); return; }
  const keep = w.keep || it.keep;
  it.fn();
  const wi = stack.indexOf(w);
  if (!keep && wi >= 0 && top() === w) stack.splice(wi, 1);
  if (keep && top() === w && w.rebuild) { const old = w.i; w.items = w.rebuild(); w.i = Math.min(old, w.items.length - 1); }
}
function flush() { let g = 0; while (timers.length && g++ < 100) timers.shift()(); }
function checkText(t, where) {
  if (/undefined|NaN|null|\[object|function ?\(/.test(t)) err(where + ": мусор в тексте «" + t.slice(0, 140) + "»");
  if (t.indexOf('"') >= 0) err(where + ": прямые кавычки «" + t.slice(0, 140) + "»");
  if (/[A-Za-z]/.test(t)) err(where + ": латиница «" + t.slice(0, 140) + "»");
  if (/ {2}| [,.;:!?]|\.\.|,,|^\s|\s$/.test(t)) err(where + ": неряшливая склейка «" + t.slice(0, 140) + "»");
}
function click(re, where) {
  const w = top();
  if (!w) throw new Error("нет окна, а нужен пункт " + re);
  const labels = w.items.map(labelOf);
  labels.forEach(l => checkText(l, where + " / пункт"));
  checkText(w.title, where + " / заголовок");
  const k = labels.findIndex(l => re.test(l));
  if (k < 0) throw new Error("нет пункта " + re + " в окне «" + w.title + "»: " + labels.slice(0, 6).join(" | "));
  const s0 = said.length;
  activate(w, k); flush();
  for (let i = s0; i < said.length; i++) checkText(said[i], where + " / речь");
}
const clickAt = (k, where) => { const w = top(); if (!w || !w.items[k]) throw new Error("нет пункта номер " + k); activate(w, k); flush(); };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function combos(arr, k) { const out = []; (function go(i, acc) { if (acc.length === k) { out.push(acc.slice()); return; } for (let j = i; j < arr.length; j++) { acc.push(arr[j]); go(j + 1, acc); acc.pop(); } })(0, []); return out; }
const union = list => Array.from(new Set([].concat(...list))).sort((a, b) => a - b).join(",");

/* решение по разгадке */
const SOLVE = {
  titr: (L, at) => { for (let i = 0; i < L.N(); i++) click(/^Капнуть щёлочь: одну каплю/, at); click(/^Сдать пробу/, at); },
  vials: (L, at) => {
    for (let k = 0; k < L.set.length; k++) {
      click(new RegExp("^Склянка " + (k + 1) + ":"), at); click(/^Решить: что в склянке/, at); click(new RegExp("^" + esc(L.set[k]) + "$"), at);
      if (top() && /^Склянка \d+$/.test(top().title)) LAB.ui.closeTop();
    }
    click(/^Сдать ответ/, at);
  },
  protocol: (L, at) => { L.bad.forEach(k => clickAt(k, at)); click(/^Сдать протокол/, at); },
  spectr: (L, at) => { L.mix.forEach(k => clickAt(k, at)); click(/^Сдать ответ/, at); },
  chain: (L, at) => { L.path.forEach(op => click(new RegExp("^" + esc(cap(op)) + "$"), at)); }
};
const WRONG = { titr: /^Сдать пробу/, vials: null, protocol: /^Сдать протокол/, spectr: /^Сдать ответ/, chain: null };
const CP = LAB.chempuz, stat = {};
for (const kind of CP.KINDS) for (let d = 0; d < 3; d++) for (let s = 1; s <= SEEDS; s++) {
  const at = kind + "/" + d + "/" + s, res = [];
  stack.length = 0; timers.length = 0;
  try {
    if (!LAB.puzzles.open(kind, s * 7919 + d, (ok, away) => res.push([ok, !!away]), { diff: d })) { err(at + ": задача не открылась"); continue; }
    const w0 = top();
    if (!w0 || !w0.note) { err(at + ": нет окна условия"); continue; }
    checkText(w0.text, at + " / условие");
    click(/^К решению/, at);
    const L = CP._last();
    /* устройство по сложности */
    if (kind === "titr") { const N = L.N(), lo = [5, 8, 11][d], hi = [8, 12, 16][d]; if (N < lo || N > hi) err(at + ": капель " + N); }
    if (kind === "vials") { if (L.set.length !== 3 + d) err(at + ": склянок " + L.set.length); if (new Set(L.uniq).size !== L.uniq.length) err(at + ": две склянки не различить пробами"); }
    if (kind === "protocol" && L.bad.length !== [1, 2, 3][d]) err(at + ": опасных шагов " + L.bad.length);
    if (kind === "spectr") { const target = union(L.mix.map(i => L.ref[i])), same = combos(L.ref, L.k).filter(c => union(c) === target).length; if (same !== 1) err(at + ": хроматограмма раскладывается " + same + " способами"); if (L.mix.length !== L.k) err(at + ": веществ " + L.mix.length); }
    if (kind === "chain") { if (!L.path.length || L.path.length < [2, 3, 4][d]) err(at + ": путь " + L.path.length); if (L.path.length > L.limit) err(at + ": путь длиннее запаса"); }
    /* на части зёрен — сначала неверный ответ: окно не закрывается */
    if (WRONG[kind] && s % 5 === 0) {
      if (kind === "protocol") clickAt(L.bad[0], at); /* отметить один из опасных — и всё равно мало, кроме простой */
      if (!(kind === "protocol" && d === 0)) {
        click(WRONG[kind], at);
        const t = top();
        if (!t || t.note || /^Склянка/.test(t.title)) err(at + ": после неверного ответа окно задачи закрылось");
        if (kind === "protocol") clickAt(L.bad[0], at); /* снять отметку */
      } else clickAt(L.bad[0], at);
    }
    SOLVE[kind](L, at);
    flush();
    if (res.length !== 1 || res[0][0] !== true) err(at + ": решение по разгадке не прошло (" + JSON.stringify(res) + ")");
    stat[kind] = (stat[kind] || 0) + 1;
    /* провал: три неверных — и «отошёл» */
    if (s === 1 && WRONG[kind]) {
      const r2 = []; stack.length = 0; LAB.puzzles.open(kind, 3 + d, (ok, away) => r2.push([ok, !!away]), { diff: d }); click(/^К решению/, at);
      if (kind === "protocol") { /* ни одной отметки: «не все отмечены» трижды */ }
      for (let i = 0; i < 3; i++) click(WRONG[kind], at);
      flush();
      if (r2.length !== 1 || r2[0][0] !== false || r2[0][1]) err(at + ": три неверных ответа — не провал (" + JSON.stringify(r2) + ")");
    }
    if (s === 2) {
      const r3 = []; stack.length = 0; LAB.puzzles.open(kind, 5 + d, (ok, away) => r3.push([ok, !!away]), { diff: d }); click(/^К решению/, at); click(/^Отойти от задачи/, at); flush();
      if (r3.length !== 1 || r3[0][0] !== false || !r3[0][1] || top()) err(at + ": «Отойти от задачи» — не «отошёл» (" + JSON.stringify(r3) + ")");
    }
  } catch (e) { err(at + ": " + e.message); }
}
console.log("решено задач по видам: " + Object.keys(stat).map(k => k + " " + stat[k]).join(", "));
console.log(fails ? "ОШИБОК: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
