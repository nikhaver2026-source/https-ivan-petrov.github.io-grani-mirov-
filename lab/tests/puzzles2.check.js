#!/usr/bin/env node
/* Проверка логических замков второй части (js/puzzles2.js): тринадцать
   видов × три сложности × зёрна. Для каждой задачи: условие начинается со
   сложности и чистое (нет undefined, NaN, null, прямых кавычек, латиницы,
   двойных пробелов); план из LAB.puzzles._last, пройденный по пунктам меню
   (окна — как в ui.js: keep, rebuild, close, замена окна с тем же
   заголовком), решает задачу; LAB.puzzles2.plan даёт тот же план; где
   ответ один — он один (перебор здесь, отдельно от генератора); решение
   укладывается в лимит. На части зёрен — неверный путь: попытки
   тратятся по одной, после третьей — провал; «Начать заново» попытку не
   тратит; «Отойти от задачи» — провал без ошибок. Звуки — только из
   sounds.js.
   Запуск: node lab/tests/puzzles2.check.js [число зёрен, не меньше 150] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(150, Number(process.argv[2]) || 150);
const timers = [];
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp,
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { if (/puzzles/.test(f)) { console.error("нет файла " + f); process.exit(1); } continue; }
  vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;
/* записи звуков: sounds.js рассчитан на окно — читаем его в отдельном контексте */
const sctx = { window: { LAB: {} } };
vm.createContext(sctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/sounds.js"), "utf8"), sctx, { filename: "js/sounds.js" });
const SND = sctx.window.LAB.SND || {};

let fails = 0;
const errs = {};
function err(m) { fails++; const k = m.slice(0, 60); errs[k] = (errs[k] || 0) + 1; if (errs[k] <= 3) console.error("✗ " + m); }

/* ── заглушки игры ── */
const said = [], played = [];
let sayN = 0;
LAB.say = t => { said.push(String(t)); sayN++; };
LAB.UI = { ok() {}, error() {}, open() {}, close() {}, click() {}, move() {}, fanfare() {} };
LAB.atmos = { play(id) { played.push(id); } };
LAB.game = { G: { L: 15, seed: "t", F: 1 } };
LAB.tutor = { ev() { return true; }, level() { return 2; } };

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
    if (!opts.silent) LAB.say(title + ". " + labelOf(items[0]));
    return w;
  },
  note(title, text, after, opts) {
    opts = opts || {};
    const w = LAB.ui.menu(title, [{ label: String(text), keep: true, fn() { LAB.say(String(text)); } }, { label: opts.closeLabel || "Закрыть", fn() { if (after) after(); } }], { silent: true });
    w.note = true; w.text = String(text);
    LAB.say(title + ". " + text);
  },
  closeTop(silent) {
    if (!top()) return false;
    stack.pop();
    const t = top();
    if (t && !silent) { if (t.rebuild) { t.items = t.rebuild(); t.i = Math.min(t.i, t.items.length - 1); } LAB.say(t.title + ". " + labelOf(t.items[t.i])); }
    return true;
  },
  closeAll() { stack.length = 0; },
  top, refresh() {}, render() {}
};
function activate(w, idx) {
  const it = w.items[idx]; w.i = idx;
  if (it.close || (/^(Отойти|Назад|Отмена)$/.test(String(it.label)) && String(it.fn).replace(/\s+/g, "") === "function(){}")) { LAB.ui.closeTop(); return; }
  const keep = w.keep || it.keep, n0 = sayN;
  it.fn();
  const wi = stack.indexOf(w);
  if (!keep && wi >= 0 && top() === w) { stack.splice(wi, 1); if (sayN === n0) { const t = top(); if (t) LAB.say(t.title + ". " + labelOf(t.items[t.i])); } }
  if (keep && top() === w && w.rebuild) { const old = w.i; w.items = w.rebuild(); w.i = Math.min(old, w.items.length - 1); }
}
function flush() { let g = 0; while (timers.length && g++ < 100) timers.shift()(); }

/* ── тексты ── */
const stat = { labelMax: 0, lineMax: 0, condMax: 0, menuMax: 0, subMax: 0, lineMaxText: "", labelMaxText: "" };
const LONG_OK = /^(Алфавит по номерам|Элемент 1|«)/; /* справки по запросу: алфавит, схема, подсказки */
function checkText(t, where) {
  if (/undefined|NaN|null|\[object|function ?\(/.test(t)) err(where + ": мусор в тексте «" + t.slice(0, 140) + "»");
  if (t.indexOf('"') >= 0) err(where + ": прямые кавычки «" + t.slice(0, 140) + "»");
  if (/[A-Za-z]/.test(t)) err(where + ": латиница «" + t.slice(0, 140) + "»");
  if (/ {2}| [,.;:!?]|\.\.|,,|^\s|\s$/.test(t)) err(where + ": неряшливая склейка «" + t.slice(0, 140) + "»");
}
function checkWindow(w, where) {
  const labels = w.items.map(labelOf);
  labels.forEach(l => { checkText(l, where + " / пункт"); if (!w.note && l.length > stat.labelMax) { stat.labelMax = l.length; stat.labelMaxText = l; } });
  checkText(w.title, where + " / заголовок");
  if (!w.note) {
    if (w.main) stat.menuMax = Math.max(stat.menuMax, w.items.length); else stat.subMax = Math.max(stat.subMax, w.items.length);
    if (w.items.length > 13) err(where + ": в окне «" + w.title + "» пунктов " + w.items.length);
  }
  return labels;
}
function checkSaid(from, where) {
  for (let i = from; i < said.length; i++) {
    const t = said[i];
    checkText(t, where + " / речь");
    if (!/^(Задача|Логический замок|Стенд испытаний)/.test(t) && !LONG_OK.test(t) && t.length > stat.lineMax && !/\. Задача (простая|средней|сложная)/.test(t)) { stat.lineMax = t.length; stat.lineMaxText = t; }
  }
}

/* ── прохождение ── */
const HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
const P2 = LAB.puzzles2;
function clickPrefix(prefix, where) {
  const w = top();
  if (!w) throw new Error("нет окна, а нужен пункт «" + prefix + "»");
  const labels = checkWindow(w, where);
  const hits = []; labels.forEach((l, i) => { if (P2.match(l, prefix)) hits.push(i); });
  if (hits.length !== 1) throw new Error("«" + prefix + "»: совпадений " + hits.length + " в окне «" + w.title + "»: " + labels.join(" | "));
  const first = labels.findIndex(l => l.indexOf(prefix) === 0);
  if (first !== hits[0]) throw new Error("«" + prefix + "»: по простому началу надписи первым совпадает другой пункт в окне «" + w.title + "»");
  const s0 = said.length;
  activate(w, hits[0]);
  flush();
  checkSaid(s0, where + " / «" + prefix + "»");
}
function openPuzzle(kind, seed, d, title) {
  stack.length = 0; timers.length = 0; LAB.puzzles._last = null;
  const s0 = said.length, res = [];
  const ok = LAB.puzzles.open(kind, seed, v => res.push(v), title ? { diff: d, title } : { diff: d });
  if (!ok) throw new Error("задача не открылась");
  const last = LAB.puzzles._last, w = top();
  if (!last || last.kind !== kind || last.diff !== d) throw new Error("нет LAB.puzzles._last");
  if (!w || !w.note) throw new Error("нет окна условия");
  const cond = w.text;
  if (cond !== last.cond) throw new Error("условие в окне и в _last разное");
  const want = (title ? title + ". " : "") + HEADS[d] + " ";
  if (cond.indexOf(want) !== 0) err(kind + "/" + d + "/" + seed + ": условие не начинается с «" + want + "»: " + cond.slice(0, 80));
  checkText(cond, kind + "/" + d + "/" + seed + " условие");
  stat.condMax = Math.max(stat.condMax, cond.length);
  checkSaid(s0, kind + "/" + d + "/" + seed + " открытие");
  clickPrefix("К решению", kind + "/" + d + "/" + seed);
  const main = top();
  if (!main || main.title !== LAB.puzzles.nameOf(kind).charAt(0).toUpperCase() + LAB.puzzles.nameOf(kind).slice(1)) throw new Error("главное окно задачи не открылось: " + (main && main.title));
  main.main = true;
  return { res, last, main, cond };
}
function isMain(o) { const t = top(); return !!t && t.title === o.main.title && t.main !== false && stack.length === 1; }
function markMain() { const t = top(); if (t && stack.length === 1) t.main = true; }
function follow(o, plan, where) {
  for (let i = 0; i < plan.length; i++) {
    if (o.res.length) throw new Error("задача закончилась раньше конца пути, на шаге " + (i + 1) + " из " + plan.length);
    markMain();
    clickPrefix(plan[i], where + " шаг " + (i + 1));
  }
  flush();
}

/* ── независимые проверки единственности и лимитов ── */
const ABC = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
function perms(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((v, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([v].concat(p)))); return out; }
function bfsCount(start, next, goal) { const seen = new Map([[start, 0]]), q = [start]; for (let i = 0; i < q.length; i++) { const k = q[i]; if (goal(k)) return seen.get(k); for (const n of next(k)) if (!seen.has(n)) { seen.set(n, seen.get(k) + 1); q.push(n); } } return -1; }
const metric = {};
function addMetric(kind, d, v) { const k = kind + d; (metric[k] = metric[k] || []).push(v); }
function independent(kind, d, last, seed) {
  const D = last.data, at = kind + "/" + d + "/" + seed;
  if (last.sol !== 1) err(at + ": генератор насчитал решений " + last.sol);
  if (kind === "jugs") {
    const caps = D.caps, n = caps.length;
    const goal = k => { const s = k.split(",").map(Number); return D.split ? (s[0] === D.t && s[1] === D.t) : s.indexOf(D.t) >= 0; };
    const next = k => { const s = k.split(",").map(Number), out = []; for (let i = 0; i < n; i++) { if (D.tap) { const f = s.slice(); f[i] = caps[i]; out.push(f.join()); const e = s.slice(); e[i] = 0; out.push(e.join()); } for (let j = 0; j < n; j++) if (i !== j) { const p = s.slice(), x = Math.min(s[i], caps[j] - s[j]); p[i] -= x; p[j] += x; out.push(p.join()); } } return out; };
    const m = bfsCount(D.start.join(), next, goal);
    if (m !== D.min || m <= 0 || D.limit !== m + 4) err(at + ": сосуды: кратчайшее " + m + ", в задаче " + D.min + ", лимит " + D.limit);
    const band = [[4, 6], [6, 8], [7, 11]][d];
    if (m < band[0] || m > band[1] || (d === 2) !== !D.tap || n !== (d === 2 ? 3 : 2)) err(at + ": сосуды: кратчайшее " + m + " вне коридора сложности");
    addMetric(kind, d, m);
  } else if (kind === "scales") {
    const hyps = []; for (let x = 1; x <= D.n; x++) { hyps.push([x, 1]); if (D.hl) hyps.push([x, -1]); }
    for (const [x, s] of hyps) {
      const sv = P2._scalesSolve(D.n, D.hl, x, s);
      if (sv.answer !== x || sv.steps.length > D.K) err(at + ": весы: стратегия не находит пробу " + x + (s < 0 ? " (легче)" : ""));
      for (const st of sv.steps) {
        if (st.L.length !== st.R.length || !st.L.length) err(at + ": весы: неравные чаши");
        let w = 0; st.L.forEach(v => { if (v === x) w += s; }); st.R.forEach(v => { if (v === x) w -= s; });
        if (Math.sign(w) !== st.res) err(at + ": весы: ответ весов не сходится");
      }
    }
    if (hyps.length > Math.pow(3, D.K)) err(at + ": весы: взвешиваний не хватает даже в теории");
    addMetric(kind, d, D.n);
  } else if (kind === "lights") {
    const ALL = (1 << D.n) - 1; let best = 99;
    for (let s = 0; s <= ALL; s++) { let e = D.state; for (let i = 0; i < D.n; i++) if (s >> i & 1) e ^= D.masks[i]; if (e === ALL) best = Math.min(best, (s.toString(2).match(/1/g) || []).length); }
    if (best !== D.min || best < [2, 3, 4][d] || D.limit !== 2 * best + 4) err(at + ": щит: кратчайшее " + best + ", в задаче " + D.min + ", лимит " + D.limit);
    if (D.state === ALL) err(at + ": щит уже горит");
    addMetric(kind, d, best);
  } else if (kind === "hanoi") {
    const n = D.n, topOf = (p, g) => p.indexOf(String(g)) < 0 ? -1 : [...p].findIndex(c => c === String(g));
    const next = k => { const out = []; for (let f = 0; f < 3; f++) { const tf = topOf(k, f); if (tf < 0) continue; for (let t = 0; t < 3; t++) { if (t === f) continue; const tt = topOf(k, t); if (tt < 0 || tt > tf) out.push(k.slice(0, tf) + t + k.slice(tf + 1)); } } return out; };
    const m = bfsCount(D.start.join(""), next, k => k === String(D.target).repeat(n));
    if (m !== D.min || D.limit !== m + [3, 4, 5][d] || (D.tower && m !== Math.pow(2, n) - 1) || (!D.tower && m < (d === 1 ? 10 : 18)) || (d === 0 && !D.tower) || (d === 2 && D.tower)) err(at + ": контейнеры: кратчайшее " + m + ", в задаче " + D.min + ", лимит " + D.limit);
    addMetric(kind, d, m);
  } else if (kind === "gates") {
    const ev = (t, x) => { let v = t.k === "in" ? (x >> t.i) & 1 : t.k === "and" ? ev(t.a, x) & ev(t.b, x) : t.k === "or" ? ev(t.a, x) | ev(t.b, x) : ev(t.a, x) ^ ev(t.b, x); return t.neg ? 1 - v : v; };
    const cntG = t => (t.k === "in" ? 0 : 1 + cntG(t.a) + cntG(t.b)) + (t.neg ? 1 : 0);
    let c = 0, which = -1;
    for (let x = 0; x < (1 << D.n); x++) { const pc = (x.toString(2).match(/1/g) || []).length; if (ev(D.tree, x) && (!D.need || pc === D.need)) { c++; which = x; } }
    if (c !== 1 || which !== D.solution || which === 0) err(at + ": плата: подходящих положений " + c);
    const g = cntG(D.tree), rng = [[1, 2], [3, 3], [4, 5]][d];
    if (g < rng[0] || g > rng[1] || g !== D.gates) err(at + ": плата: элементов " + g);
    addMetric(kind, d, g);
  } else if (kind === "binary") {
    if (((D.sw ^ D.mask) !== D.target) || D.bits !== [4, 6, 8][d] || D.sw >= (1 << D.bits) || D.target >= (1 << D.bits) || (d < 2 && D.mask)) err(at + ": двоичный замок не сходится");
    addMetric(kind, d, D.bits);
  } else if (kind === "cipher") {
    if (D.abc !== ABC) err(at + ": шифр: алфавит не тот");
    const sh = (w, k) => [...w].map(ch => ABC[((ABC.indexOf(ch) + k) % 33 + 33) % 33]).join("");
    const dec = d === 2 ? [...D.enc].map((ch, i) => ABC[((ABC.indexOf(ch) - (ABC.indexOf(D.key[i % D.key.length]) + 1)) % 33 + 33) % 33]).join("") : sh(D.enc, -D.k);
    if (d === 1 && sh(D.sig, D.k) !== D.encSig) err(at + ": шифр: подпись не той же шифровкой");
    const hits = D.opts.filter(w => w === dec);
    if (hits.length !== 1 || dec !== D.ans || new Set(D.opts).size !== 6 || D.opts.some(w => w.length !== D.ans.length)) err(at + ": шифр: расшифровка «" + dec + "», вариантов совпало " + hits.length);
    if (D.enc === D.ans) err(at + ": шифр не шифрует");
    if (D.opts.filter(w => w[0] === D.ans[0]).length === 1) addMetric("cipherFirst", d, 1); else addMetric("cipherFirst", d, 0);
    addMetric(kind, d, D.ans.length);
  } else if (kind === "series") {
    const t = D.shown, o = D.options;
    if (o.length !== 6 || new Set(o).size !== 6 || o.filter(v => v === D.ans).length !== 1 || o.some(v => !(v > 0) || v !== Math.round(v))) err(at + ": показания: варианты плохие " + o.join(","));
    /* простые правила, своими руками: ни одно не даёт обманку */
    const df = a => a.slice(1).map((v, i) => v - a[i]), eq = a => a.every(v => v === a[0]);
    const pr = [];
    const d1 = df(t), d2 = df(d1);
    if (eq(d1)) pr.push(t[t.length - 1] + d1[0]);
    if (eq(d2)) pr.push(t[t.length - 1] + d1[d1.length - 1] + d2[0]);
    if (t.slice(1).every((v, i) => v * t[0] === t[1] * t[i])) pr.push(t[t.length - 1] * t[1] / t[0]);
    if (t.slice(2).every((v, i) => v === t[i] + t[i + 1])) pr.push(t[t.length - 1] + t[t.length - 2]);
    if (pr.some(v => v !== D.ans)) err(at + ": показания: другое правило даёт " + pr.join(","));
    if (o.some(v => v !== D.ans && pr.indexOf(v) >= 0)) err(at + ": показания: обманка подходит под правило");
    if (!pr.length && P2._seriesPredict(t).join() !== String(D.ans)) err(at + ": показания: правило не находится");
    if (t.every(v => v % 2 === t[0] % 2) && o.some(v => v % 2 !== D.ans % 2)) err(at + ": показания: ответ выдаёт чётность " + o.join(","));
    if (o.indexOf(D.ans) === 0 || o.indexOf(D.ans) === 5) addMetric("seriesEdge", d, 1); else addMetric("seriesEdge", d, 0);
    addMetric(kind, d, t.length);
  } else if (kind === "calib") {
    const k = D.nums.length - 1, sym = ["+", "-", "*"]; let c = 0, which = "";
    for (let m = 0; m < Math.pow(3, k); m++) {
      let x = m, e = String(D.nums[0]), ops = [];
      for (let i = 0; i < k; i++) { ops.push(x % 3); e += sym[x % 3] + D.nums[i + 1]; x = Math.floor(x / 3); }
      if (Function("return " + e)() === D.target) { c++; which = ops.join(); }
    }
    if (c !== 1 || which !== D.ops.join() || k !== d + 2) err(at + ": калибровка: подходящих наборов " + c);
    addMetric(kind, d, k);
  } else if (kind === "crossing") {
    if (d === 1) {
      const T = D.times, full = 15; let best = Infinity;
      const go = (mask, lamp, time) => { if (time >= best) return; if (mask === full) { best = time; return; } const here = [0, 1, 2, 3].filter(i => ((mask >> i) & 1) === lamp); for (let a = 0; a < here.length; a++) for (let b = a; b < here.length; b++) { let m2 = mask ^ (1 << here[a]); if (b !== a) m2 ^= 1 << here[b]; if (time + Math.max(T[here[a]], T[here[b]]) <= 60) go(m2, 1 - lamp, time + Math.max(T[here[a]], T[here[b]])); } };
      go(0, 0, 0);
      if (best !== D.limit || D.trick !== D.limit || D.naive <= D.limit) err(at + ": коридор: лучшее время " + best + ", лимит " + D.limit + ", без хитрости " + D.naive);
      addMetric(kind, d, D.limit);
    } else addMetric(kind, d, D.min);
  } else if (kind === "robot") {
    const N = D.N, DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
    const next = k => { const [r, c, h] = k.split(",").map(Number), out = [r + "," + c + "," + ((h + 3) % 4), r + "," + c + "," + ((h + 1) % 4)]; const nr = r + DR[h], nc = c + DC[h]; if (nr >= 0 && nc >= 0 && nr < N && nc < N && !D.blk[nr * N + nc]) out.push(nr + "," + nc + "," + h); return out; };
    const m = bfsCount(D.sr + "," + D.sc + ",0", next, k => { const [r, c] = k.split(",").map(Number); return r === D.tr && c === D.tc; });
    if (m !== D.min || D.limit !== m + [2, 1, 0][d] || m < [3, 5, 7][d] || m > [5, 8, 11][d] || N !== d + 3) err(at + ": уборщик: кратчайшая " + m + ", в задаче " + D.min + ", лимит " + D.limit);
    if (D.blk.filter(Boolean).length !== [0, 2, -1][d] && d < 2) err(at + ": уборщик: шкафов не столько");
    addMetric(kind, d, m);
  } else if (kind === "latin") {
    const g = D.grid; let c = 0;
    const rowsP = [0, 1, 2, 3].map(r => { const have = g.slice(r * 4, r * 4 + 4), miss = [0, 1, 2, 3].filter(v => have.indexOf(v) < 0); return perms(miss).map(p => { const row = have.slice(); let k = 0; for (let i = 0; i < 4; i++) if (row[i] < 0) row[i] = p[k++]; return row; }); });
    for (const a of rowsP[0]) for (const b of rowsP[1]) for (const e of rowsP[2]) for (const f of rowsP[3]) { let ok = true; for (let col = 0; col < 4 && ok; col++) ok = new Set([a[col], b[col], e[col], f[col]]).size === 4; if (ok) c++; }
    const empty = g.filter(v => v < 0).length, rng = [[3, 4], [6, 7], [9, 10]][d];
    if (c !== 1 || empty < rng[0] || empty > rng[1]) err(at + ": стеллаж: заполнений " + c + ", пустых " + empty);
    addMetric(kind, d, empty);
  } else if (kind === "clues") {
    const L = D.L, codes = []; const rec = pre => { if (pre.length === L) { codes.push(pre.slice()); return; } for (let x = 0; x < 10; x++) if (pre.indexOf(x) < 0) { pre.push(x); rec(pre); pre.pop(); } }; rec([]);
    const fit = code => D.clues.every(cl => { let e = 0, m = 0; cl.g.forEach((v, i) => { if (code[i] === v) e++; else if (code.indexOf(v) >= 0) m++; }); return e === cl.e && m === cl.m; });
    const ok = codes.filter(fit);
    if (ok.length !== 1 || ok[0].join() !== D.secret.join() || L !== (d === 2 ? 4 : 3)) err(at + ": подсказки: подходящих кодов " + ok.length);
    if (D.clues.some(cl => cl.e === L)) err(at + ": подсказка выдаёт код целиком");
    if (d === 0 && !D.clues.some(cl => cl.e + cl.m === 0)) err(at + ": простая без подсказки «ни одна не верна»");
    if (d === 1 && D.clues.some(cl => cl.e + cl.m === 0)) err(at + ": средняя с подсказкой «ни одна не верна»");
    const rng = [[4, 7], [3, 5], [4, 6]][d];
    if (D.clues.length < rng[0] || D.clues.length > rng[1]) err(at + ": подсказок " + D.clues.length);
    addMetric(kind, d, D.clues.length);
  }
}

/* ── прогон ── */
const t0 = Date.now(), counts = { solved: 0, wrong: 0, reset: 0, leave: 0, titled: 0, fuzz: 0 }, variety = [];
const RESETS = ["Начать заново", "Выключить все тумблеры", "Очистить программу"];
if (!P2 || !Array.isArray(P2.kinds) || P2.kinds.length !== 13) err("LAB.puzzles2.kinds: ждали 13 видов");
for (const kind of P2.kinds) {
  if (!LAB.puzzles.has(kind) || !LAB.puzzles.hasDiff(kind)) err(kind + ": не зарегистрирован со сложностями");
  if (LAB.puzzles.KINDS.indexOf(kind) < 0) err(kind + ": нет в LAB.puzzles.KINDS");
  const nm = LAB.puzzles.nameOf(kind);
  if (!/^[а-яё ]+$/.test(nm)) err(kind + ": название «" + nm + "» не строчное русское");
  for (let d = 0; d <= 2; d++) {
    const conds = new Set();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const at = kind + "/" + d + "/" + seed;
      try {
        const title = seed % 37 === 0 ? "Стенд испытаний" : null;
        const o = openPuzzle(kind, seed, d, title);
        if (title) counts.titled++;
        conds.add(JSON.stringify(o.last.data));
        const pl2 = P2.plan(kind, seed, d);
        if (!pl2 || pl2.join("|") !== o.last.plan.join("|")) err(at + ": LAB.puzzles2.plan не совпадает с _last.plan");
        if (!o.last.wrong || o.last.wrong.length !== 3) err(at + ": нет трёх неверных путей");
        independent(kind, d, o.last, seed);
        follow(o, o.last.plan, at);
        if (o.res.length !== 1 || o.res[0] !== true) err(at + ": план не решил задачу (" + JSON.stringify(o.res) + ")");
        else counts.solved++;
        if (stack.length) err(at + ": после решения окна не закрылись");
        if (o.last.st.tries !== 0) err(at + ": план потратил попытки: " + o.last.st.tries);
        /* повтор с тем же зерном — то же условие */
        if (seed % 10 === 1) { const o2 = openPuzzle(kind, seed, d, title); if (o2.cond !== o.cond) err(at + ": то же зерно — другое условие"); stack.length = 0; }
        /* неверный путь: три попытки, потом провал */
        if (seed % 6 === 0) {
          const w = openPuzzle(kind, seed, d);
          for (let k = 0; k < 3; k++) {
            follow(w, w.last.wrong[k], at + " неверно " + (k + 1));
            if (k < 2) {
              if (w.res.length) { err(at + ": неверный путь " + (k + 1) + " закончил задачу: " + JSON.stringify(w.res)); break; }
              if (w.last.st.tries !== k + 1) err(at + ": после неверного пути " + (k + 1) + " попыток потрачено " + w.last.st.tries);
              if (!isMain(w)) { const t = top(); err(at + ": после ошибки не главное окно: " + (t ? t.title : "нет окна")); break; }
            } else if (w.res.length !== 1 || w.res[0] !== false || stack.length) err(at + ": после трёх ошибок нет провала (" + JSON.stringify(w.res) + ")");
            else counts.wrong++;
          }
        }
        /* «Начать заново» попытку не тратит, а задача решается после него */
        if (seed % 6 === 3) {
          const r = openPuzzle(kind, seed, d);
          const resetItem = r.main.items.map(labelOf).find(l => RESETS.indexOf(l) >= 0);
          if (resetItem) {
            const half = r.last.plan.slice(0, Math.floor(r.last.plan.length / 2));
            follow(r, half, at + " половина плана");
            while (stack.length > 1) LAB.ui.closeTop();
            if (!r.res.length) {
              markMain();
              clickPrefix(resetItem, at + " сброс");
              if (r.last.st.tries !== 0) err(at + ": «" + resetItem + "» потратил попытку");
              follow(r, r.last.plan, at + " план после сброса");
              if (r.res.length !== 1 || r.res[0] !== true) err(at + ": после «" + resetItem + "» план не решил задачу");
              else counts.reset++;
            }
          } else if (["cipher", "series", "scales"].indexOf(kind) < 0) err(at + ": нет пункта сброса");
          stack.length = 0;
        }
        /* случайные нажатия по всем окнам: недопустимые ходы объясняются, тексты чистые, исход — не больше одного */
        if (seed % 5 === 2) {
          const z = openPuzzle(kind, seed, d);
          let x = (seed * 2654435761 + d * 97 + kind.length) >>> 0;
          const rnd = n => { x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9E3779B9) >>> 0; return x % n; };
          for (let step = 0; step < 90 && !z.res.length; step++) {
            const w = top(); if (!w) { err(at + ": случайные нажатия: окно пропало без исхода"); break; }
            const labels = checkWindow(w, at + " случайно");
            let idx = rnd(labels.length);
            if (labels[idx] === "Отойти от задачи") idx = (idx + 1) % labels.length;
            if (labels[idx] === "Отойти от задачи") continue;
            const s0 = said.length;
            activate(w, idx); flush();
            checkSaid(s0, at + " случайно «" + labels[idx] + "»");
            if (said.length === s0 && top() === w) err(at + ": пункт «" + labels[idx] + "» молчит");
            if (z.res.length > 1) err(at + ": случайные нажатия: исходов " + z.res.length);
            if (z.res.length && stack.length) err(at + ": после исхода окна открыты");
            if (!z.res.length && z.last.st.tries > 2) err(at + ": попыток потрачено больше трёх без провала");
          }
          counts.fuzz++;
          stack.length = 0;
        }
        /* «Отойти от задачи» — провал без ошибок */
        if (seed % 25 === 5) {
          const a = openPuzzle(kind, seed, d);
          clickPrefix("Отойти от задачи", at + " отойти");
          if (a.res.length !== 1 || a.res[0] !== false || stack.length) err(at + ": «Отойти от задачи» не дал провала");
          else counts.leave++;
        }
      } catch (e) {
        err(at + ": " + (e && e.message ? e.message : e) + (e && e.stack ? " @ " + e.stack.split("\n").slice(1, 3).join(" ").trim() : ""));
        stack.length = 0;
      }
    }
    /* перевозка (простая и сложная) и простая башня — классические задачи: им разнообразие не нужно */
    if (!(kind === "crossing" && d !== 1) && !(kind === "hanoi" && d === 0) && conds.size < Math.min(8, SEEDS / 4)) err(kind + "/" + d + ": мало разных задач: " + conds.size);
    variety.push(kind + d + ":" + conds.size);
  }
}
/* слова шифра: нужной длины, из алфавита с Ё, без повторов */
for (const len of Object.keys(P2._words)) {
  const ws = P2._words[len];
  if (new Set(ws).size !== ws.length) err("шифр: повторы в словах длины " + len);
  ws.forEach(w => { if (w.length !== +len || [...w].some(ch => ABC.indexOf(ch) < 0)) err("шифр: слово «" + w + "» не той длины или не из алфавита"); });
  if (ws.length < 12) err("шифр: мало слов длины " + len);
}
/* звуки — только существующие записи */
const badSnd = [...new Set(played)].filter(id => !SND[id]);
if (badSnd.length) err("нет таких звуков в sounds.js: " + badSnd.join(", "));
/* сложность растёт: средние размеры по видам */
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const report = [];
for (const kind of P2.kinds) {
  const ms = [0, 1, 2].map(d => metric[kind + d] ? mean(metric[kind + d]) : NaN);
  report.push(kind + " " + ms.map(v => v.toFixed(1)).join("/"));
  if (["jugs", "scales", "lights", "hanoi", "gates", "binary", "calib", "robot", "latin"].indexOf(kind) >= 0 && !(ms[0] < ms[1] && ms[1] < ms[2])) err(kind + ": размер задачи не растёт со сложностью: " + ms.join(", "));
}
const ms = Date.now() - t0;
console.log("видов: " + P2.kinds.length + ", зёрен на сложность: " + SEEDS + ", решено планом: " + counts.solved + " из " + P2.kinds.length * 3 * SEEDS +
  ", неверных путей до провала: " + counts.wrong + ", сбросов: " + counts.reset + ", уходов: " + counts.leave + ", случайных прогулок: " + counts.fuzz + ", с заголовком стенда: " + counts.titled + ", время: " + ms + " мс");
console.log("размер (простая/средняя/сложная): " + report.join("; "));
console.log("самое длинное условие: " + stat.condMax + " знаков; самый длинный пункт: " + stat.labelMax + " («" + stat.labelMaxText + "»); самая длинная реплика: " + stat.lineMax + " знаков; пунктов в главном окне до " + stat.menuMax + ", в подменю до " + stat.subMax);
console.log("разных задач на " + SEEDS + " зёрен: " + variety.join(" "));
console.log("шифр: доля задач, где ответ узнаётся по одной первой букве (простая/средняя/сложная): " + [0, 1, 2].map(d => mean(metric["cipherFirst" + d]).toFixed(2)).join("/") +
  "; показания: ответ с краю списка: " + [0, 1, 2].map(d => mean(metric["seriesEdge" + d]).toFixed(2)).join("/"));
console.log("звуки: " + [...new Set(played)].sort().join(", "));
console.log(fails ? "ПРОВАЛЕНО: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
