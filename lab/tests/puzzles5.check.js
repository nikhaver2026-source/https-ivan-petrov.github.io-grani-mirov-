#!/usr/bin/env node
/* Проверка логических замков пятой части (js/puzzles5.js): четырнадцать
   видов «числа, мера и вариативные решения» × три ступени × зёрна.
   Для каждой задачи: условие начинается со ступени и чистое (нет
   undefined, NaN, null, прямых кавычек, латиницы, двойных пробелов);
   план из LAB.puzzles._last, пройденный по пунктам меню (окна — как в
   ui.js), решает задачу образцово (_last.best и слова «Образцовое
   решение»); каждое из запасных решений (_last.alts, их не меньше двух,
   все разные) тоже принимается, и отметка «образцовое» у него — ровно
   когда оно лучшее; LAB.puzzles5.plan и sig дают то же без окон;
   LAB.puzzles5.solve принимает каждый ответ из gen(...).answers и
   отвергает пустой. Отдельный переборщик здесь же (своим способом, не
   кодом генератора) считает все верные решения и лучшее: число решений
   совпадает с _last.sol (до потолка 999), лучшее — с образцовым.
   На части зёрен — неверный путь: попытки тратятся по одной, третья —
   провал; сброс попытку не тратит, и план решает задачу после него;
   у составных задач (сложные резисторы и смесь) этапы идут по очереди и
   объявляются, а уход посреди этапов — начатая задача (в следующий раз
   другая); «Отойти от задачи» — без ошибок; случайные нажатия — тексты
   чистые, окна не больше 13 пунктов, исход не больше одного. Звуки —
   только из sounds.js, тоны — разумной высоты.
   СЧЁТ: для каждого вида и ступени перебираются зёрна 1…COUNT (по
   умолчанию 1000) и считаются разные подписи sig; проверка падает, если
   какая-то пара «вид × ступень» дала меньше 300 разных задач или итог по
   файлу меньше 20 000. Заодно — время генерации (медиана и худшее).
   Запуск: node lab/tests/puzzles5.check.js [зёрен на прохождение, не
   меньше 30, по умолчанию 60] [зёрен на счёт, не меньше 1000] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(30, Number(process.argv[2]) || 60);
const COUNT = Math.max(1000, Number(process.argv[3]) || 1000);
const CAPN = 999;
const timers = [];
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp,
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles5.js"]) {
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
const said = [], played = [], tones = [];
let sayN = 0;
LAB.say = t => { said.push(String(t)); sayN++; };
LAB.UI = { ok() {}, error() {}, open() {}, close() {}, click() {}, move() {}, fanfare() {} };
LAB.atmos = { play(id) { played.push(id); } };
LAB.Sound = { tone(f, d, o) { tones.push([f, d]); } };
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
const stat = { labelMax: 0, lineMax: 0, condMax: 0, menuMax: 0, subMax: 0, lineMaxText: "", labelMaxText: "", condMaxKind: "" };
function checkText(t, where) {
  if (/undefined|NaN|null|\[object|function ?\(|Infinity/.test(t)) err(where + ": мусор в тексте «" + t.slice(0, 140) + "»");
  if (t.indexOf('"') >= 0) err(where + ": прямые кавычки «" + t.slice(0, 140) + "»");
  if (/[A-Za-z]/.test(t)) err(where + ": латиница «" + t.slice(0, 140) + "»");
  if (/ {2}| [,.;:!?]|\.\.|,,|^\s|\s$|[,;:]\.|\.,/.test(t)) err(where + ": неряшливая склейка «" + t.slice(0, 140) + "»");
}
function checkWindow(w, where) {
  const labels = w.items.map(labelOf);
  labels.forEach(l => { checkText(l, where + " / пункт"); if (!w.note && l.length > stat.labelMax) { stat.labelMax = l.length; stat.labelMaxText = l; } });
  checkText(w.title, where + " / заголовок");
  if (!w.note) {
    if (w.main) stat.menuMax = Math.max(stat.menuMax, w.items.length); else stat.subMax = Math.max(stat.subMax, w.items.length);
    if (w.items.length > 13) err(where + ": в окне «" + w.title + "» пунктов " + w.items.length);
    if (new Set(labels).size !== labels.length) err(where + ": в окне «" + w.title + "» одинаковые пункты");
  }
  return labels;
}
function checkSaid(from, where) {
  for (let i = from; i < said.length; i++) {
    const t = said[i];
    checkText(t, where + " / речь");
    if (!/^(Задача|Стенд испытаний)/.test(t) && t.length > stat.lineMax && !/\. Задача (простая|средней|сложная)/.test(t)) { stat.lineMax = t.length; stat.lineMaxText = t; }
  }
}

/* ── прохождение ── */
const HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
const P5 = LAB.puzzles5;
function clickPrefix(prefix, where) {
  const w = top();
  if (!w) throw new Error("нет окна, а нужен пункт «" + prefix + "»");
  const labels = checkWindow(w, where);
  const hits = []; labels.forEach((l, i) => { if (P5.match(l, prefix)) hits.push(i); });
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
  const s0 = said.length, res = [], ends = [];
  const ok = LAB.puzzles.open(kind, seed, (v, away, fresh) => { res.push(v); ends.push({ ok: v, away: !!away, fresh: !!fresh }); }, title ? { diff: d, title } : { diff: d });
  if (!ok) throw new Error("задача не открылась");
  const last = LAB.puzzles._last, w = top();
  if (!last || last.kind !== kind || last.diff !== d) throw new Error("нет LAB.puzzles._last");
  if (!w || !w.note) throw new Error("нет окна условия");
  const cond = w.text;
  if (cond !== last.cond) throw new Error("условие в окне и в _last разное");
  const want = (title ? title + ". " : "") + HEADS[d] + " ";
  if (cond.indexOf(want) !== 0) err(kind + "/" + d + "/" + seed + ": условие не начинается с «" + want + "»: " + cond.slice(0, 80));
  checkText(cond, kind + "/" + d + "/" + seed + " условие");
  if (cond.length > stat.condMax) { stat.condMax = cond.length; stat.condMaxKind = kind + "/" + d; }
  checkSaid(s0, kind + "/" + d + "/" + seed + " открытие");
  clickPrefix("К решению", kind + "/" + d + "/" + seed);
  const main = top();
  if (!main || main.title !== LAB.puzzles.nameOf(kind).charAt(0).toUpperCase() + LAB.puzzles.nameOf(kind).slice(1)) throw new Error("главное окно задачи не открылось: " + (main && main.title));
  main.main = true;
  return { res, ends, last, main, cond, s0 };
}
function isMain(o) { const t = top(); return !!t && t.title === o.main.title && stack.length === 1; }
function markMain() { const t = top(); if (t && stack.length === 1) t.main = true; }
function follow(o, plan, where) {
  for (let i = 0; i < plan.length; i++) {
    if (o.res.length) throw new Error("задача закончилась раньше конца пути, на шаге " + (i + 1) + " из " + plan.length + " («" + plan[i] + "»)");
    markMain();
    clickPrefix(plan[i], where + " шаг " + (i + 1));
  }
  flush();
}
function lastSaid(from) { return said.slice(from).join(" | "); }

/* ════════ НЕЗАВИСИМЫЕ ПЕРЕБОРЩИКИ ════════
   Каждый получает gen(...).data и возвращает { count, best, valid(ответ), isBest(ответ), key(ответ) }:
   count — сколько всего верных решений (как их понимает вид), best — лучшая мера. */
const sortS = a => a.slice().sort();
const gcdI = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
const red = (n, d) => { const g = gcdI(n, d); return [n / g, d / g]; };

/* мощность: формулы — деревья, канон — раскрытые суммы и произведения */
function pwCanon(t) {
  if (t.v != null && !t.op) return String(t.v);
  const lin = t.op === "+" || t.op === "-";
  const pos = [], neg = [];
  const walk = (n, s) => {
    if (n.op && (lin ? (n.op === "+" || n.op === "-") : (n.op === "*" || n.op === "/"))) { walk(n.a, s); walk(n.b, (n.op === "-" || n.op === "/") ? -s : s); }
    else (s > 0 ? pos : neg).push(pwCanon(n));
  };
  walk(t, 1);
  return lin ? "(" + sortS(pos).join("+") + (neg.length ? "-" + sortS(neg).join("-") : "") + ")" : "[" + sortS(pos).join("*") + (neg.length ? "/" + sortS(neg).join("/") : "") + "]";
}
function pwApply(a, op, b, cap) {
  let v;
  if (op === "+") v = a.v + b.v; else if (op === "-") { if (a.v <= b.v) return null; v = a.v - b.v; }
  else if (op === "*") v = a.v * b.v; else { if (a.v % b.v) return null; v = a.v / b.v; }
  if (v > cap) return null;
  return { v, op, a, b, mask: a.mask | b.mask, ops: a.ops + b.ops + 1 };
}
function indepPower(D) {
  const sols = new Map(), maxSteps = D.maxSteps || D.vals.length - 1, must = D.must >= 0 ? 1 << D.must : 0;
  const rec = (parts, steps) => {
    for (const p of parts) if (p.ops && p.v === D.T && (!must || (p.mask & must))) { const k = pwCanon(p); if (!sols.has(k)) sols.set(k, p.ops); }
    if (steps >= maxSteps) return;
    for (let i = 0; i < parts.length; i++) for (let j = 0; j < parts.length; j++) {
      if (i === j) continue;
      for (const op of D.ops) {
        if ((op === "+" || op === "*") && j < i) continue;
        const z = pwApply(parts[i], op, parts[j], D.cap); if (!z) continue;
        rec(parts.filter((_, k) => k !== i && k !== j).concat([z]), steps + 1);
      }
    }
  };
  rec(D.vals.map((v, i) => ({ v, mask: 1 << i, ops: 0 })), 0);
  const best = Math.min(...sols.values());
  const sim = ans => {
    const parts = {}; D.vals.forEach((v, i) => { parts["b" + i] = { v, mask: 1 << i, ops: 0 }; });
    let k = 0; const gone = {};
    if (D.maxSteps && ans.steps.length > D.maxSteps) return null;
    for (const s of ans.steps) { const a = parts[s[0]], b = parts[s[2]]; if (!a || !b || gone[s[0]] || gone[s[2]] || s[0] === s[2]) return null; const z = pwApply(a, s[1], b, D.cap); if (!z) return null; gone[s[0]] = gone[s[2]] = 1; parts["s" + k++] = z; }
    const x = parts[ans.submit]; if (!x || gone[ans.submit] || x.v !== D.T || (must && !(x.mask & must))) return null;
    return x;
  };
  return { count: sols.size, best, valid: a => !!sim(a), isBest: a => sim(a).ops === best, key: a => pwCanon(sim(a)) };
}
/* касса: прямой перебор наборов */
function vecs(st) { let out = [[]]; st.forEach(s => { const n = []; out.forEach(v => { for (let k = 0; k <= s; k++) n.push(v.concat([k])); }); out = n; }); return out; }
function indepTill(D) {
  let count = 0, best = 1e9;
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), tot = a => a.reduce((s, x) => s + x, 0);
  if (!D.two) vecs(D.stock).forEach(x => { if (dot(x, D.dens) === D.S && tot(x)) { count++; best = Math.min(best, tot(x)); } });
  else {
    const C = vecs(D.stock2);
    vecs(D.stock).forEach(p => { if (!tot(p)) return; C.forEach(q => {
      if (dot(p, D.dens) - dot(q, D.dens2) !== D.S) return;
      if (D.dens.some((v, a) => p[a] && D.dens2.some((w, b) => q[b] && w === v))) return;
      count++; best = Math.min(best, tot(p) + tot(q));
    }); });
  }
  const val = a => {
    if (!D.two) return a.give && a.give.every((x, i) => x >= 0 && x <= D.stock[i]) && dot(a.give, D.dens) === D.S;
    return a.pay && a.change && a.pay.every((x, i) => x >= 0 && x <= D.stock[i]) && a.change.every((x, i) => x >= 0 && x <= D.stock2[i]) && dot(a.pay, D.dens) - dot(a.change, D.dens2) === D.S;
  };
  const n = a => D.two ? tot(a.pay) + tot(a.change) : tot(a.give);
  return { count, best, valid: val, isBest: a => n(a) === best, key: a => JSON.stringify(a) };
}
function indepContainer(D) {
  const n = D.w.length; let count = 0, best = -1;
  const ok = m => { let w = 0, v = 0, k = 0; for (let i = 0; i < n; i++) if (m >> i & 1) { w += D.w[i]; v += D.v[i]; k++; } if (w > D.W || (D.K && k > D.K) || (D.bad && (m >> D.bad[0] & 1) && (m >> D.bad[1] & 1)) || v < D.V) return -1; return v; };
  for (let m = 1; m < (1 << n); m++) { const v = ok(m); if (v >= 0) { count++; best = Math.max(best, v); } }
  const mOf = a => a.take.reduce((m, j) => m | (1 << j), 0);
  return { count, best, valid: a => a.take.length && new Set(a.take).size === a.take.length && ok(mOf(a)) >= 0, isBest: a => ok(mOf(a)) === best, key: a => sortS(a.take.map(String)).join() };
}
/* резисторы: последовательности соединений, дроби — точно */
function rsCanon(t) {
  if (!t.op) return String(t.q[0]);
  const ch = [];
  const walk = n => { if (n.op === t.op) { walk(n.a); walk(n.b); } else ch.push(rsCanon(n)); };
  walk(t);
  return (t.op === "s" ? "S(" : "P(") + sortS(ch).join(",") + ")";
}
function rsJoin(a, op, b) {
  const [an, ad] = a.q, [bn, bd] = b.q;
  const q = op === "s" ? red(an * bd + bn * ad, ad * bd) : red(an * bn, an * bd + bn * ad);
  return { q, op, a, b, mask: a.mask | b.mask, leaves: a.leaves + b.leaves };
}
function indepResistors(D) {
  const formed = new Map(), seen = new Set();
  const rec = parts => {
    const sk = parts.map(p => rsCanon(p) + "@" + p.mask).sort().join(";");
    if (seen.has(sk)) return; seen.add(sk);
    for (const p of parts) if (p.leaves >= 2) { const k = rsCanon(p) + "#" + p.mask; if (!formed.has(k)) formed.set(k, p); }
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      if (parts[i].leaves + parts[j].leaves > D.maxL) continue;
      for (const op of ["s", "p"]) rec(parts.filter((_, k) => k !== i && k !== j).concat([rsJoin(parts[i], op, parts[j])]));
    }
  };
  rec(D.vals.map((v, i) => ({ q: [v, 1], mask: 1 << i, leaves: 1 })));
  const eq = (q, T) => q[0] === T.n && q[1] === T.d;
  const all = [...formed.values()];
  let count, best;
  if (!D.T2) {
    const ks = new Map(); all.forEach(p => { if (eq(p.q, D.T)) { const k = rsCanon(p); if (!ks.has(k) || ks.get(k) > p.leaves) ks.set(k, p.leaves); } });
    count = ks.size; best = Math.min(...ks.values());
  } else {
    const A = all.filter(p => eq(p.q, D.T)), B = all.filter(p => eq(p.q, D.T2)), ks = new Map();
    A.forEach(x => B.forEach(y => { if (x.mask & y.mask) return; const k = rsCanon(x) + "|" + rsCanon(y); if (!ks.has(k) || ks.get(k) > x.leaves + y.leaves) ks.set(k, x.leaves + y.leaves); }));
    count = ks.size; best = Math.min(...ks.values());
  }
  const sim = ans => {
    const parts = {}; D.vals.forEach((v, i) => { parts["r" + i] = { q: [v, 1], mask: 1 << i, leaves: 1 }; });
    const gone = {}; let k = 0, used = 0, res = [];
    const stages = D.T2 ? ans.stages : [ans];
    for (let si = 0; si < stages.length; si++) {
      const st = stages[si];
      for (const s of st.steps) { const a = parts[s[0]], b = parts[s[2]]; if (!a || !b || gone[s[0]] || gone[s[2]] || s[0] === s[2] || a.leaves + b.leaves > D.maxL) return null; gone[s[0]] = gone[s[2]] = 1; parts["c" + k++] = rsJoin(a, s[1], b); }
      const x = parts[st.submit]; if (!x || gone[st.submit] || (x.mask & used) || !eq(x.q, si ? D.T2 : D.T)) return null;
      gone[st.submit] = 1; used |= x.mask; res.push(x);
      for (const key in parts) if (parts[key].mask & x.mask) gone[key] = 1;
    }
    return res;
  };
  return { count, best, valid: a => !!sim(a), isBest: a => sim(a).reduce((s, x) => s + x.leaves, 0) === best, key: a => sim(a).map(rsCanon).join("|") };
}
function indepFrequencies(D) {
  const n = D.n, col = new Array(n).fill(0); let count = 0, best = 99;
  const adj = []; for (let i = 0; i < n; i++) adj.push([]);
  D.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const go = (i, rv) => {
    if (i === n) { count++; best = Math.min(best, rv); return; }
    for (let c = 1; c <= D.k; c++) {
      if (D.fix[i] && D.fix[i] !== c) continue;
      if (D.forb[i] && D.forb[i].includes(c)) continue;
      if (adj[i].some(j => j < i && col[j] === c)) continue;
      const r2 = rv + (c === D.k ? 1 : 0); if (r2 > D.limitR) continue;
      col[i] = c; go(i + 1, r2); col[i] = 0;
    }
  };
  go(0, 0);
  const ok = f => f.length === n && f.every((c, i) => c >= 1 && c <= D.k && (!D.fix[i] || D.fix[i] === c) && !(D.forb[i] && D.forb[i].includes(c))) && D.edges.every(([a, b]) => f[a] !== f[b]) && f.filter(c => c === D.k).length <= D.limitR;
  return { count, best, valid: a => ok(a.f), isBest: a => a.f.filter(c => c === D.k).length === best, key: a => a.f.join() };
}
function permsOf(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((v, i) => permsOf(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([v].concat(p)))); return out; }
function indepRoute(D) {
  const t = (a, b) => { for (const e of D.edges) { if (e.a === a && e.b === b) return e.t; if (!e.one && e.a === b && e.b === a) return e.t; } return -1; };
  const time = p => { let s = 0; for (let i = 1; i < p.length; i++) { const x = t(p[i - 1], p[i]); if (x < 0) return -1; s += x; } return s; };
  const okP = p => { const s = time(p); if (s < 0) return -1; if (D.end >= 0 && p[p.length - 1] !== D.end) return -1; if (D.pre && p.indexOf(D.pre[0]) > p.indexOf(D.pre[1])) return -1; if (D.L && s > D.L) return -1; return s; };
  let count = 0, best = 1e9;
  const rest = []; for (let i = 1; i < D.n; i++) rest.push(i);
  permsOf(rest).forEach(p => { const s = okP([0].concat(p)); if (s >= 0) { count++; best = Math.min(best, s); } });
  const valid = a => a.path && a.path[0] === 0 && a.path.length === D.n && new Set(a.path).size === D.n && okP(a.path) >= 0;
  return { count, best, valid, isBest: a => okP(a.path) === best, key: a => a.path.join() };
}
function indepValves(D) {
  const n = D.eff.length, m = D.p0.length;
  const safe = order => { const p = D.p0.slice(); for (const k of order) for (let t = 0; t < m; t++) { p[t] += D.eff[k][t]; if (p[t] < 0 || (D.cap && p[t] > D.cap)) return null; } return p; };
  let count = 0, best = 99;
  for (let S = 1; S < (1 << n); S++) {
    const ks = []; for (let k = 0; k < n; k++) if (S >> k & 1) ks.push(k);
    const fin = D.p0.map((v, t) => v + ks.reduce((s, k) => s + D.eff[k][t], 0));
    if (fin.join() !== D.target.join()) continue;
    if (permsOf(ks).some(o => !!safe(o))) { count++; best = Math.min(best, ks.length); }
  }
  const valid = a => a.open && new Set(a.open).size === a.open.length && a.open.every(k => k >= 0 && k < n) && (() => { const p = safe(a.open); return !!p && p.join() === D.target.join(); })();
  return { count, best, valid, isBest: a => a.open.length === best, key: a => sortS(a.open.map(String)).join() };
}
function indepMixture(D) {
  const comps = D.comps, k = comps.length;
  const sets = (cs, V, C, needLast) => {
    const out = [];
    const rec = (i, v, left, sub) => {
      if (i === cs.length) { if (!left && sub === C * V && (!needLast || v[cs.length - 1] >= 1)) out.push(v.slice()); return; }
      for (let x = 0; x <= Math.min(left, cs[i].s); x++) { v.push(x); rec(i + 1, v, left - x, sub + x * cs[i].c); v.pop(); }
    };
    rec(0, [], V, 0);
    return out;
  };
  let count = 0, best = 1e9;
  const S1 = sets(comps, D.V, D.C, false);
  if (!D.two) S1.forEach(v => { count++; best = Math.min(best, v[D.strong]); });
  else S1.forEach(v => { const rest = comps.map((x, j) => ({ c: x.c, s: x.s - v[j] })).concat([{ c: D.C, s: D.V }]); sets(rest, D.V2, D.C2, true).forEach(w => { count++; best = Math.min(best, v[D.strong] + w[D.strong]); }); });
  const ok1 = (cs, v, V, C, needLast) => v && v.length === cs.length && v.every((x, j) => x >= 0 && x <= cs[j].s) && v.reduce((s, x) => s + x, 0) === V && v.reduce((s, x, j) => s + x * cs[j].c, 0) === C * V && (!needLast || v[v.length - 1] >= 1);
  const valid = a => {
    if (!D.two) return ok1(comps, a.v, D.V, D.C, false);
    const v = a.stages[0].v, w = a.stages[1].v;
    if (!ok1(comps, v, D.V, D.C, false)) return false;
    return ok1(comps.map((x, j) => ({ c: x.c, s: x.s - v[j] })).concat([{ c: D.C, s: D.V }]), w, D.V2, D.C2, true);
  };
  const cost = a => D.two ? a.stages[0].v[D.strong] + a.stages[1].v[D.strong] : a.v[D.strong];
  return { count, best, valid, isBest: a => cost(a) === best, key: a => JSON.stringify(a) };
}
function indepRations(D) {
  const nb = D.boxes.length, m = D.m;
  const ok = to => {
    const load = new Array(m).fill(0); to.forEach((b, i) => { load[b] += D.boxes[i].p; });
    if (load.some((l, b) => l !== D.need[b])) return false;
    for (const ru of D.rules) {
      if (ru.t === "no" && to.some((b, i) => b === ru.b && D.boxes[i].t === ru.ty)) return false;
      if (ru.t === "with" && to[ru.x] !== to[ru.y]) return false;
      if (ru.t === "apart" && to[ru.x] === to[ru.y]) return false;
      if (ru.t === "each") for (let b = 0; b < m; b++) if (!to.some((x, i) => x === b && D.boxes[i].t === ru.ty)) return false;
    }
    return true;
  };
  const spread = to => { const c = new Array(m).fill(0); to.forEach(b => c[b]++); return Math.max(...c) - Math.min(...c); };
  let count = 0, best = 99;
  const to = new Array(nb).fill(0);
  const total = Math.pow(m, nb);
  for (let x = 0; x < total; x++) { let y = x; for (let i = 0; i < nb; i++) { to[i] = y % m; y = Math.floor(y / m); } if (ok(to)) { count++; best = Math.min(best, spread(to)); } }
  return { count, best, valid: a => a.to && a.to.length === nb && a.to.every(b => b >= 0 && b < m) && ok(a.to), isBest: a => spread(a.to) === best, key: a => a.to.join() };
}
function indepMagic(D) {
  const N = D.N, g = D.grid.slice(), lines = D.lines, sums = D.sums;
  const rows = []; for (let r = 0; r < N; r++) rows.push(D.empty.filter(c => Math.floor(c / N) === r));
  const rowSum = r => { let s = 0; for (let c = 0; c < N; c++) s += D.grid[r * N + c]; return s; };
  const fills = rows.map((cells, r) => {
    const need = sums[r] - rowSum(r), out = [];
    const rec = (i, acc, s) => { if (i === cells.length) { if (s === need) out.push(acc.slice()); return; } for (let v = 1; v <= 9; v++) { if (s + v > need) break; acc.push(v); rec(i + 1, acc, s + v); acc.pop(); } };
    rec(0, [], 0);
    return out;
  });
  let count = 0, clean = 0;
  const isClean = () => { for (let i = 0; i < N; i++) { const a = new Set(), b = new Set(); for (let j = 0; j < N; j++) { a.add(g[i * N + j]); b.add(g[j * N + i]); } if (a.size !== N || b.size !== N) return false; } return true; };
  const go = r => {
    if (r === N) { if (lines.every((l, q) => l.cells.reduce((s, c) => s + g[c], 0) === sums[q])) { count++; if (isClean()) clean++; } return; }
    for (const f of fills[r]) { rows[r].forEach((c, i) => { g[c] = f[i]; }); go(r + 1); }
    rows[r].forEach(c => { g[c] = 0; });
  };
  go(0);
  const fillOk = a => { const h = D.grid.slice(); D.empty.forEach((c, k) => { h[c] = a.fill[k]; }); return a.fill.every(v => v >= 1 && v <= 9) && lines.every((l, q) => l.cells.reduce((s, c) => s + h[c], 0) === sums[q]); };
  const cleanOk = a => { const h = D.grid.slice(); D.empty.forEach((c, k) => { h[c] = a.fill[k]; }); for (let i = 0; i < N; i++) { const x = new Set(), y = new Set(); for (let j = 0; j < N; j++) { x.add(h[i * N + j]); y.add(h[j * N + i]); } if (x.size !== N || y.size !== N) return false; } return true; };
  return { count, best: clean, valid: fillOk, isBest: cleanOk, key: a => a.fill.join() };
}
function lightMasks(R, walls) {
  const idx = new Array(R * R).fill(-1), cells = [];
  for (let i = 0; i < R * R; i++) if (!walls[i]) { idx[i] = cells.length; cells.push(i); }
  const DRr = [-1, 0, 1, 0], DCc = [0, 1, 0, -1];
  const masks = cells.map(c => { let m = 1 << idx[c]; const r0 = Math.floor(c / R), c0 = c % R; for (let d = 0; d < 4; d++) { let r = r0 + DRr[d], cc = c0 + DCc[d]; while (r >= 0 && cc >= 0 && r < R && cc < R && !walls[r * R + cc]) { m |= 1 << idx[r * R + cc]; r += DRr[d]; cc += DCc[d]; } } return m >>> 0; });
  return { idx, cells, masks };
}
function indepLamps(D) {
  const M = lightMasks(D.R, D.walls), K = M.cells.length, full = (K === 32 ? 0xffffffff : ((1 << K) >>> 0) - 1) >>> 0;
  let count = 0, best = 99;
  const pick = [];
  const go = (start, lit) => {
    if (pick.length && (lit >>> 0) === full) { count++; if (pick.length < best) best = pick.length; }
    if (pick.length === D.limit) return;
    for (let i = start; i < K; i++) {
      if (D.rule && pick.some(j => (M.masks[j] >>> i) & 1)) continue;
      pick.push(i); go(i + 1, (lit | M.masks[i]) >>> 0); pick.pop();
    }
  };
  go(0, 0);
  const val = a => {
    if (!a.lamps.length || a.lamps.length > D.limit) return false;
    const ks = a.lamps.map(([r, c]) => M.idx[r * D.R + c]);
    if (ks.some(k => k < 0) || new Set(ks).size !== ks.length) return false;
    if (D.rule && ks.some(k => ks.some(j => j !== k && ((M.masks[j] >>> k) & 1)))) return false;
    return (ks.reduce((m, k) => m | M.masks[k], 0) >>> 0) === full;
  };
  return { count, best, valid: val, isBest: a => a.lamps.length === best, key: a => sortS(a.lamps.map(x => x.join(":"))).join() };
}
/* трубы: свой обход путей воды и своя трассировка */
const OPEN = (t, rot) => t === "s" ? (rot % 2 ? [1, 3] : [0, 2]) : [rot % 4, (rot + 1) % 4];
function pipeTrace(D, rot) {
  const R = D.R; let r = D.pump.r, c = D.pump.c, entry = D.pump.side; const seen = new Set();
  for (let g = 0; g < 200; g++) {
    const i = r * R + c, T = D.tiles[i];
    if (seen.has(i) || T.t === "w") return false; seen.add(i);
    const o = OPEN(T.t, rot[i]); if (!o.includes(entry)) return false;
    const ex = o[0] === entry ? o[1] : o[0];
    if (r === D.drain.r && c === D.drain.c && ex === D.drain.side) return true;
    r += [-1, 0, 1, 0][ex]; c += [0, 1, 0, -1][ex];
    if (r < 0 || c < 0 || r >= R || c >= R) return false;
    entry = (ex + 2) % 4;
  }
  return false;
}
function indepPipes(D) {
  const R = D.R, keys = new Map();
  const vis = new Set();
  const go = (r, c, entry, chosen) => {
    if (r < 0 || c < 0 || r >= R || c >= R) return;
    const i = r * R + c, T = D.tiles[i];
    if (vis.has(i) || T.t === "w") return;
    vis.add(i);
    const rots = T.fix ? [T.rot] : (T.t === "s" ? [0, 1] : [0, 1, 2, 3]);
    for (const rot of rots) {
      const o = OPEN(T.t, rot); if (!o.includes(entry)) continue;
      const ex = o[0] === entry ? o[1] : o[0];
      const cost = T.fix ? 0 : ((rot - T.rot) % (T.t === "s" ? 2 : 4) + (T.t === "s" ? 2 : 4)) % (T.t === "s" ? 2 : 4);
      const ch = chosen.concat([[i, o.join(""), cost]]);
      if (r === D.drain.r && c === D.drain.c && ex === D.drain.side) { const k = ch.map(x => x[0] + ":" + x[1]).sort().join(); const cs = ch.reduce((s, x) => s + x[2], 0); if (!keys.has(k) || keys.get(k) > cs) keys.set(k, cs); }
      else go(r + [-1, 0, 1, 0][ex], c + [0, 1, 0, -1][ex], (ex + 2) % 4, ch);
    }
    vis.delete(i);
  };
  go(D.pump.r, D.pump.c, D.pump.side, []);
  const best = Math.min(...keys.values());
  const rotOf = a => D.tiles.map((T, i) => T.t === "w" ? 0 : T.rot + (a.turns[i] || 0));
  const cost = a => D.tiles.reduce((s, T, i) => s + (T.t === "w" || T.fix ? 0 : (a.turns[i] || 0) % (T.t === "s" ? 2 : 4)), 0);
  const valid = a => a.turns.length === D.tiles.length && a.turns.every((x, i) => x >= 0 && x <= 3 && (!x || (D.tiles[i].t !== "w" && !D.tiles[i].fix))) && pipeTrace(D, rotOf(a));
  return { count: keys.size, best, valid, isBest: a => cost(a) === best, key: a => a.turns.join() };
}
/* отражатели: свой обход решений луча */
function beam(D, put) {
  const R = D.R, s = D.em.side, k = D.em.k;
  let r = s === 0 ? 0 : s === 2 ? R - 1 : k, c = s === 1 ? R - 1 : s === 3 ? 0 : k, dir = (s + 2) % 4;
  const seen = new Set(), path = [];
  for (let g = 0; g < 1000; g++) {
    if (r < 0 || c < 0 || r >= R || c >= R) return { ok: false, path };
    const i = r * R + c;
    if (seen.has(i * 4 + dir)) return { ok: false, path }; seen.add(i * 4 + dir); path.push(i);
    if (D.grid[i] === 1) return { ok: false, path };
    if (D.grid[i] === 2) return { ok: true, path };
    const t = D.fixed[i] || put[i];
    if (t) dir = t === "L" ? (dir + 3) % 4 : (dir + 1) % 4;
    r += [-1, 0, 1, 0][dir]; c += [0, 1, 0, -1][dir];
  }
  return { ok: false, path };
}
function indepMirrors(D) {
  /* перебор: на каждой новой пустой клетке пути луча — ничего, налево или направо */
  const R = D.R, sols = new Map();
  const go = (put, n) => {
    const b = beam(D, put);
    if (b.ok) { const k = Object.keys(put).sort().map(x => x + put[x]).join(); sols.set(k, n); }
    if (n >= D.limit) return;
    /* развилки: пустые клетки на пути луча, где ещё нет отражателя, — после последнего поставленного */
    const lastIdx = Math.max(-1, ...Object.keys(put).map(x => b.path.indexOf(+x)));
    for (let p = lastIdx + 1; p < b.path.length; p++) {
      const i = b.path[p];
      if (D.grid[i] || D.fixed[i] || put[i] || b.path.indexOf(i) < p) continue; /* приёмник (grid 2) тоже пропускается */
      for (const t of ["L", "R"]) { const q = Object.assign({}, put); q[i] = t; go(q, n + 1); }
    }
  };
  go({}, 0);
  const best = Math.min(...sols.values());
  const putOf = a => { const p = {}; a.put.forEach(([r, c, t]) => { p[r * R + c] = t; }); return p; };
  const valid = a => a.put.length <= D.limit && new Set(a.put.map(x => x[0] * R + x[1])).size === a.put.length && a.put.every(([r, c, t]) => r >= 0 && c >= 0 && r < R && c < R && !D.grid[r * R + c] && !D.fixed[r * R + c] && (t === "L" || t === "R")) && beam(D, putOf(a)).ok;
  return { count: sols.size, best, valid, isBest: a => a.put.length === best, key: a => sortS(a.put.map(x => x.join(":"))).join() };
}
function indepCrews(D) {
  const k = D.jobs.length, m = D.m;
  const ok = to => {
    const l = new Array(m).fill(0);
    for (let j = 0; j < k; j++) { if (!D.br[to[j]].ok.includes(D.jobs[j].t)) return false; l[to[j]] += D.jobs[j].h; }
    if (l.some((x, b) => x > D.br[b].lim)) return false;
    return D.rules.every(ru => ru.t === "with" ? to[ru.x] === to[ru.y] : to[ru.x] !== to[ru.y]);
  };
  const span = to => { const l = new Array(m).fill(0); to.forEach((b, j) => { l[b] += D.jobs[j].h; }); return Math.max(...l); };
  let count = 0, best = 99; const to = new Array(k).fill(0), total = Math.pow(m, k);
  for (let x = 0; x < total; x++) { let y = x; for (let j = 0; j < k; j++) { to[j] = y % m; y = Math.floor(y / m); } if (ok(to)) { count++; best = Math.min(best, span(to)); } }
  return { count, best, valid: a => a.to && a.to.length === k && a.to.every(b => b >= 0 && b < m) && ok(a.to), isBest: a => span(a.to) === best, key: a => a.to.join() };
}
const INDEP = { power: indepPower, till: indepTill, container: indepContainer, resistors: indepResistors, frequencies: indepFrequencies, route: indepRoute, valves: indepValves,
  mixture: indepMixture, rations: indepRations, magic: indepMagic, lamps: indepLamps, pipes: indepPipes, mirrors: indepMirrors, crews: indepCrews };
/* у магического щита «лучшее» — не число, а признак: образцовые — без повторов, их count в best */
const metric = {};
function addMetric(kind, d, v) { const k = kind + d; (metric[k] = metric[k] || []).push(v); }
function independent(kind, d, G, last, seed) {
  const at = kind + "/" + d + "/" + seed, I = INDEP[kind](G.data);
  const capd = Math.min(CAPN, I.count);
  if (G.sol !== capd || last.sol !== G.sol) err(at + ": решений по перебору " + I.count + ", а генератор насчитал " + G.sol);
  if (I.count < 2) err(at + ": вариативной задаче нужно не меньше двух решений, а их " + I.count);
  if (kind === "magic" && I.best < 1) err(at + ": у щита нет решения без повторов");
  if (!G.answers || G.answers.length !== G.alts.length || G.alts.length < 2) { err(at + ": решений-образцов меньше двух"); return; }
  const keys = new Set();
  G.answers.forEach((a, i) => {
    if (!I.valid(a)) { err(at + ": ответ " + (i + 1) + " перебор считает неверным: " + JSON.stringify(a).slice(0, 120)); return; }
    const b = I.isBest(a);
    if (b !== G.altBest[i]) err(at + ": ответ " + (i + 1) + ": образцовый по перебору " + b + ", в задаче " + G.altBest[i]);
    keys.add(I.key(a));
    const v = P5.solve(kind, G, a);
    if (!v.ok || v.best !== G.altBest[i]) err(at + ": solve не согласен с ответом " + (i + 1) + ": " + JSON.stringify(v));
    const v2 = P5.solve(kind, { seed, diff: d }, a);
    if (!v2.ok || v2.best !== v.best) err(at + ": solve по зерну не согласен с ответом " + (i + 1));
  });
  if (keys.size !== G.answers.length) err(at + ": решения-образцы совпадают между собой");
  if (!G.altBest[0]) err(at + ": первое решение (план) не образцовое");
  if (P5.solve(kind, G, null).ok || P5.solve(kind, G, {}).ok) err(at + ": solve принял пустой ответ");
  addMetric(kind, d, I.count);
}

/* ── прогон ── */
const t0 = Date.now(), counts = { solved: 0, alts: 0, notBest: 0, wrong: 0, reset: 0, leave: 0, titled: 0, fuzz: 0, stages: 0, midLeave: 0 };
const RESETS = ["Разъединить всё", "Начать заново", "Выгрузить всё", "Разобрать всё", "Сбросить частоты", "Закрыть все клапаны", "Слить всё", "Собрать всё на склад", "Очистить всё", "Снять все лампы", "Вернуть как было", "Снять все отражатели"];
const COMMIT = ["Подать на шину", "Выдать", "Расплатиться", "Закрыть контейнер", "Подключить нагрузку", "Включить связь", "Сдать маршрут", "Пустить в работу", "Сдать смесь", "Раздать", "Проверить щит", "Включить свет", "Пустить воду", "Включить луч", "Утвердить наряд"];
const STAGED = { resistors: "Подключить нагрузку", mixture: "Сдать смесь" };
if (!P5 || !Array.isArray(P5.kinds) || P5.kinds.length !== 14) err("LAB.puzzles5.kinds: ждали 14 видов");
const OLD = ["sort", "relays", "bulls", "riddle", "chess", "breaker", "decon", "labels", "dosim", "shifts", "tally", "jugs", "scales", "lights", "hanoi", "gates", "binary", "cipher", "series", "calib", "crossing", "robot", "latin", "clues", "termhack", "archive", "acrostic", "accesslog", "checksum", "pinwear", "titr", "vials", "protocol", "spectr", "chain"];
for (const kind of P5.kinds) {
  if (OLD.indexOf(kind) >= 0) err(kind + ": такой вид уже есть");
  if (!LAB.puzzles.has(kind) || !LAB.puzzles.hasDiff(kind)) err(kind + ": не зарегистрирован со сложностями");
  if (LAB.puzzles.KINDS.indexOf(kind) < 0) err(kind + ": нет в LAB.puzzles.KINDS");
  const nm = LAB.puzzles.nameOf(kind);
  if (!/^[а-яё ]+$/.test(nm)) err(kind + ": название «" + nm + "» не строчное русское");
  for (let d = 0; d <= 2; d++) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const at = kind + "/" + d + "/" + seed;
      try {
        const title = seed % 37 === 0 ? "Стенд испытаний" : null;
        const o = openPuzzle(kind, seed, d, title);
        if (title) counts.titled++;
        const G = P5.gen(kind, seed, d), L = o.last;
        if (P5.plan(kind, seed, d).join("|") !== L.plan.join("|")) err(at + ": LAB.puzzles5.plan не совпадает с _last.plan");
        if (P5.sig(kind, seed, d) !== L.sig || !L.sig) err(at + ": LAB.puzzles5.sig не совпадает с _last.sig");
        if (L.alts[0].join("|") !== L.plan.join("|")) err(at + ": первое решение — не план");
        if (!L.wrong || L.wrong.length !== 3) err(at + ": нет трёх неверных путей");
        if (!(L.sol >= 2)) err(at + ": _last.sol меньше двух");
        if (L.stages !== (STAGED[kind] && d === 2 ? 2 : 1)) err(at + ": этапов " + L.stages);
        independent(kind, d, G, L, seed);
        /* план — образцовое решение */
        const s0 = said.length;
        follow(o, L.plan, at);
        if (o.res.length !== 1 || o.res[0] !== true) err(at + ": план не решил задачу (" + JSON.stringify(o.res) + ")");
        else counts.solved++;
        if (!L.best || !/Образцовое решение\.$/.test(said[said.length - 1])) err(at + ": план решил, но не образцово: " + said[said.length - 1]);
        if (stack.length) err(at + ": после решения окна не закрылись");
        if (L.st.tries !== 0) err(at + ": план потратил попытки: " + L.st.tries);
        if (L.stages === 2) {
          const txt = lastSaid(s0), a = txt.indexOf(LAB_STAGE1()), b = txt.indexOf("Этап второй из двух");
          if (a < 0 || b < a || L.stage !== 2 || o.cond.indexOf("Этап первый из двух") < 0 || o.cond.indexOf("Этап второй из двух") < 0) err(at + ": этапы не объявлены по очереди");
          else counts.stages++;
        }
        /* запасные решения — тоже принимаются, отметка «образцовое» — по делу */
        for (let k = 1; k < L.alts.length; k++) {
          const w = openPuzzle(kind, seed, d);
          follow(w, L.alts[k], at + " решение " + (k + 1));
          if (w.res.length !== 1 || w.res[0] !== true) { err(at + ": решение " + (k + 1) + " не принято"); continue; }
          counts.alts++;
          const fin = said[said.length - 1];
          if (w.last.best !== L.altBest[k]) err(at + ": решение " + (k + 1) + ": отметка образцового " + w.last.best + ", ждали " + L.altBest[k]);
          if (L.altBest[k] ? !/Образцовое решение\.$/.test(fin) : !/Решение верное, но не образцовое: .+\.$/.test(fin)) err(at + ": решение " + (k + 1) + ": итоговая фраза «" + fin.slice(-80) + "»");
          if (!L.altBest[k]) counts.notBest++;
        }
        /* повтор с тем же зерном — то же условие */
        if (seed % 10 === 1) { const o2 = openPuzzle(kind, seed, d, title); if (o2.cond !== o.cond) err(at + ": то же зерно — другое условие"); stack.length = 0; }
        /* неверный путь: три попытки, потом провал */
        if (seed % 3 === 0) {
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
        /* сброс попытку не тратит, а план решает задачу и после него */
        if (seed % 4 === 2) {
          const r = openPuzzle(kind, seed, d);
          const resetItem = r.main.items.map(labelOf).find(l => RESETS.indexOf(l) >= 0);
          if (!resetItem) err(at + ": нет пункта сброса");
          else {
            let cut = Math.floor(r.last.plan.length / 2);
            r.last.plan.forEach((p, i) => { if (COMMIT.indexOf(p) >= 0 && i < cut) cut = i; });
            follow(r, r.last.plan.slice(0, cut), at + " половина плана");
            while (stack.length > 1) LAB.ui.closeTop();
            markMain();
            clickPrefix(resetItem, at + " сброс");
            if (r.last.st.tries !== 0) err(at + ": «" + resetItem + "» потратил попытку");
            follow(r, r.last.plan, at + " план после сброса");
            if (r.res.length !== 1 || r.res[0] !== true || !r.last.best) err(at + ": после «" + resetItem + "» план не решил задачу образцово");
            else counts.reset++;
          }
          stack.length = 0;
        }
        /* составные: уход посреди этапов — начатая задача */
        if (L.stages === 2 && seed % 5 === 1) {
          const m = openPuzzle(kind, seed, d), cutAt = m.last.plan.indexOf(STAGED[kind]);
          follow(m, m.last.plan.slice(0, kind === "resistors" ? cutAt + 2 : cutAt + 1), at + " первый этап");
          if (m.last.stage !== 2) err(at + ": первый этап не закончился");
          while (stack.length > 1) LAB.ui.closeTop();
          markMain(); clickPrefix("Отойти от задачи", at + " уход между этапами"); flush();
          const e = m.ends[0];
          if (!e || e.ok !== false || !e.away || !e.fresh || stack.length) err(at + ": уход между этапами: " + JSON.stringify(m.ends));
          else counts.midLeave++;
        }
        /* случайные нажатия по всем окнам: тексты чистые, исход — не больше одного */
        if (seed % 5 === 2) {
          const z = openPuzzle(kind, seed, d);
          let x = (seed * 2654435761 + d * 97 + kind.length) >>> 0;
          const rnd = n => { x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9E3779B9) >>> 0; return x % n; };
          for (let step = 0; step < 120 && !z.res.length; step++) {
            const w = top(); if (!w) { err(at + ": случайные нажатия: окно пропало без исхода"); break; }
            const labels = checkWindow(w, at + " случайно");
            let idx = rnd(labels.length);
            if (labels[idx] === "Отойти от задачи") idx = (idx + 1) % labels.length;
            if (labels[idx] === "Отойти от задачи") continue;
            const s1 = said.length;
            activate(w, idx); flush();
            checkSaid(s1, at + " случайно «" + labels[idx] + "»");
            if (said.length === s1 && top() === w) err(at + ": пункт «" + labels[idx] + "» молчит");
            if (z.res.length > 1) err(at + ": случайные нажатия: исходов " + z.res.length);
            if (z.res.length && stack.length) err(at + ": после исхода окна открыты");
            if (!z.res.length && z.last.st.tries > 2) err(at + ": попыток потрачено больше трёх без провала");
          }
          counts.fuzz++;
          stack.length = 0;
        }
        /* «Отойти от задачи» — без ошибок, задача ждёт прежняя */
        if (seed % 25 === 5) {
          const a = openPuzzle(kind, seed, d);
          clickPrefix("Отойти от задачи", at + " отойти"); flush();
          const e = a.ends[0];
          if (!e || e.ok !== false || !e.away || e.fresh || stack.length) err(at + ": «Отойти от задачи» не дал чистого ухода: " + JSON.stringify(a.ends));
          else counts.leave++;
        }
      } catch (e) {
        err(at + ": " + (e && e.message ? e.message : e) + (e && e.stack ? " @ " + e.stack.split("\n").slice(1, 3).join(" ").trim() : ""));
        stack.length = 0;
      }
    }
  }
}
function LAB_STAGE1() { return "Этап первый из двух готов"; }
/* звуки — только существующие записи, тоны — разумной высоты */
const badSnd = [...new Set(played)].filter(id => !SND[id]);
if (badSnd.length) err("нет таких звуков в sounds.js: " + badSnd.join(", "));
if (tones.some(([f, d]) => !(f >= 100 && f <= 3000) || !(d > 0 && d <= 2))) err("тон странной высоты или длины");

/* ── СЧЁТ: разные задачи по подписи ── */
const t1 = Date.now(), table = [], timing = [];
let total = 0;
for (const kind of P5.kinds) {
  const row = [kind.padEnd(12)];
  for (let d = 0; d <= 2; d++) {
    const sigs = new Set(), ts = [];
    for (let seed = 1; seed <= COUNT; seed++) {
      const a = process.hrtime.bigint();
      const s = P5.sig(kind, seed, d);
      ts.push(Number(process.hrtime.bigint() - a) / 1e6);
      if (typeof s !== "string" || !s) { err(kind + "/" + d + "/" + seed + ": пустая подпись"); continue; }
      sigs.add(s);
    }
    if (P5.sig(kind, 17, d) !== P5.sig(kind, 17, d)) err(kind + "/" + d + ": подпись не постоянна");
    total += sigs.size;
    if (sigs.size < 300) err(kind + "/" + d + ": разных задач " + sigs.size + " — меньше 300");
    ts.sort((x, y) => x - y);
    const med = ts[ts.length >> 1], p99 = ts[Math.floor(ts.length * 0.99)], mx = ts[ts.length - 1];
    if (med > 3) err(kind + "/" + d + ": генерация медленная: медиана " + med.toFixed(2) + " мс");
    timing.push(kind + d + " " + med.toFixed(2) + "/" + p99.toFixed(1) + "/" + mx.toFixed(1));
    row.push(String(sigs.size).padStart(6));
  }
  table.push(row.join(" "));
}
if (total < 20000) err("всего разных задач " + total + " — меньше 20 000");

const mean = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
console.log("видов: " + P5.kinds.length + ", зёрен на прохождение: " + SEEDS + ", решено планом: " + counts.solved + " из " + P5.kinds.length * 3 * SEEDS +
  ", запасных решений принято: " + counts.alts + " (из них не образцовых: " + counts.notBest + "), неверных путей до провала: " + counts.wrong + ", сбросов: " + counts.reset +
  ", составных по этапам: " + counts.stages + ", уходов между этапами: " + counts.midLeave + ", уходов: " + counts.leave + ", случайных прогулок: " + counts.fuzz + ", с заголовком стенда: " + counts.titled +
  ", время прохождения: " + ((t1 - t0) / 1000).toFixed(1) + " с");
console.log("решений в среднем (простая/средняя/сложная): " + P5.kinds.map(k => k + " " + [0, 1, 2].map(d => mean(metric[k + d]).toFixed(1)).join("/")).join("; "));
console.log("самое длинное условие: " + stat.condMax + " знаков (" + stat.condMaxKind + "); самый длинный пункт: " + stat.labelMax + " («" + stat.labelMaxText + "»); самая длинная реплика: " + stat.lineMax +
  " знаков; пунктов в главном окне до " + stat.menuMax + ", в подменю до " + stat.subMax);
console.log("звуки: " + [...new Set(played)].sort().join(", ") + "; тонов: " + tones.length);
console.log("время генерации, мс (медиана/99%/худшее): " + timing.join("; "));
console.log("");
console.log("РАЗНЫХ ЗАДАЧ (зёрна 1…" + COUNT + ", по подписи sig):");
console.log("вид          простая средняя сложная");
table.forEach(l => console.log(l));
console.log("ИТОГО по файлу: " + total + " разных задач (нужно не меньше 20 000, и не меньше 300 на вид × ступень); счёт занял " + ((Date.now() - t1) / 1000).toFixed(1) + " с");
console.log(fails ? "ПРОВАЛЕНО: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
