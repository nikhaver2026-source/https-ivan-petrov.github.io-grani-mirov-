#!/usr/bin/env node
/* Проверка логических замков четвёртой части (js/puzzles4.js): логика и
   вывод, четырнадцать видов × три ступени × зёрна. Для каждой задачи:
   условие начинается со ступени и чистое (нет undefined, NaN, null,
   прямых кавычек, латиницы, двойных пробелов); план из LAB.puzzles._last,
   пройденный по пунктам меню (окна — как в ui.js), решает задачу, не
   тратя попыток; у вариативных каждое из других решений (_last.alts)
   тоже принимается, а отметка «образцовое» (_last.best) стоит ровно там,
   где решение лучшее; у составных этапы объявляются по очереди («Этап
   второй из …»); неверный путь тратит попытки, третья — провал; «Отойти
   от задачи» — без ошибок; случайные нажатия — тексты чистые, исход не
   больше одного. Независимый перебор (здесь, отдельно от генератора):
   единственность ответа там, где он один, число и качество решений там,
   где их несколько. LAB.puzzles4.solve принимает верный ответ и
   отвергает испорченный. И главное — СЧЁТ: разные подписи sig по зёрнам
   1…COUNT для каждого вида и ступени; проверка падает, если итог меньше
   20 000 или у вида со ступенью меньше 300 разных задач.
   Запуск: node lab/tests/puzzles4.check.js [зёрен прохождения, не меньше 30] [зёрен счёта, не меньше 600] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(30, Number(process.argv[2]) || 80);
const COUNT = Math.max(600, Number(process.argv[3]) || 2000);
const timers = [];
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp,
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js", "js/puzzles4.js"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { if (/puzzles/.test(f)) { console.error("нет файла " + f); process.exit(1); } continue; }
  vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const LAB = ctx.LAB;
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
const stat = { labelMax: 0, lineMax: 0, condMax: 0, menuMax: 0, subMax: 0, labelMaxText: "", condMaxKind: "" };
function checkText(t, where) {
  if (/undefined|NaN|null|\[object|function ?\(/.test(t)) err(where + ": мусор в тексте «" + t.slice(0, 140) + "»");
  if (t.indexOf('"') >= 0 || t.indexOf("'") >= 0) err(where + ": прямые кавычки «" + t.slice(0, 140) + "»");
  if (/[A-Za-z]/.test(t)) err(where + ": латиница «" + t.slice(0, 140) + "»");
  if (/ {2}| [,.;:!?]|\.\.|,,|;;|^\s|\s$|\.,|,\./.test(t)) err(where + ": неряшливая склейка «" + t.slice(0, 160) + "»");
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
    if (!/^(Задача|Стенд испытаний)/.test(t) && !/\. Задача (простая|средней|сложная)/.test(t) && t.length > stat.lineMax) stat.lineMax = t.length;
  }
}

/* ── прохождение ── */
const HEADS = ["Задача простая.", "Задача средней сложности.", "Задача сложная."];
const P4 = LAB.puzzles4;
function clickPrefix(prefix, where) {
  const w = top();
  if (!w) throw new Error("нет окна, а нужен пункт «" + prefix + "»");
  const labels = checkWindow(w, where);
  const hits = []; labels.forEach((l, i) => { if (P4.match(l, prefix)) hits.push(i); });
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
  const s0 = said.length, res = [], away = [];
  const ok = LAB.puzzles.open(kind, seed, (v, aw, fresh) => { res.push(v); away.push(!!aw); }, title ? { diff: d, title } : { diff: d });
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
  const nm = LAB.puzzles.nameOf(kind);
  if (!main || main.title !== nm.charAt(0).toUpperCase() + nm.slice(1)) throw new Error("главное окно задачи не открылось: " + (main && main.title));
  main.main = true;
  if (!main.items.some(it => labelOf(it) === "Что сейчас")) err(kind + "/" + d + "/" + seed + ": в главном окне нет пункта «Что сейчас»");
  return { res, away, last, main, cond };
}
function isMain(o) { const t = top(); return !!t && t.title === o.main.title && stack.length === 1; }
function markMain() { const t = top(); if (t && stack.length === 1) t.main = true; }
function follow(o, plan, where) {
  for (let i = 0; i < plan.length; i++) {
    if (o.res.length) throw new Error("задача закончилась раньше конца пути, на шаге " + (i + 1) + " из " + plan.length);
    markMain();
    clickPrefix(plan[i], where + " шаг " + (i + 1));
  }
  flush();
}

/* ════════ НЕЗАВИСИМЫЕ ПРОВЕРКИ (перебор здесь, отдельно от генератора) ════════ */
function perms(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((v, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([v].concat(p)))); return out; }
const range = n => Array.from({ length: n }, (_, i) => i);
const pc = x => { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; };
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const metric = {};
function addMetric(kind, d, v) { const k = kind + d; (metric[k] = metric[k] || []).push(v); }

function tsTruth([s, t, a, b, k], c, L) {
  const la = a >= 0 ? (L >> a) & 1 : 0, lb = b >= 0 ? (L >> b) & 1 : 0;
  return { G: c === a, NG: c !== a, L: la === 1, T: la === 0, OR: c === a || c === b, BL: la && lb ? true : false, SM: la === lb, DF: la !== lb, CN: pc(L) === k, LC: c >= 0 && ((L >> c) & 1) === 1 }[t];
}
const tsFits = (sts, c, L) => sts.every(st => tsTruth(st, c, L) === !((L >> st[0]) & 1));
function chkTestimony(D, d, at) {
  const n = D.n; let ws = [];
  for (let L = 0; L < (1 << n); L++) {
    if (d < 2 && pc(L) !== D.kL) continue;
    if (d < 2) { for (let c = 0; c < n; c++) if (tsFits(D.sts, c, L)) ws.push([c, L]); }
    else if (tsFits(D.sts, -1, L)) ws.push([-1, L]);
  }
  if (ws.length !== 1 || ws[0][1] !== D.L || (d < 2 && ws[0][0] !== D.c)) err(at + ": показания: миров " + ws.length);
  if (d === 2) {
    const cs = range(n).filter(c => tsFits(D.sts2, c, D.L));
    if (cs.length !== 1 || cs[0] !== D.c) err(at + ": показания, второй допрос: виновных " + cs.length);
    const anyC = new Set(); for (let L = 0; L < (1 << n); L++) for (let c = 0; c < n; c++) if (tsFits(D.sts2, c, L)) anyC.add(c);
    if (anyC.size < 2) err(at + ": второй допрос решается и без первого");
  }
  addMetric("testimony", d, D.sts.length + (D.sts2 ? D.sts2.length : 0));
}
function chkRollcall(D, d, at) {
  const { n, na, ans, part } = D, clues = D.clues;
  const truthOf = (abs, imp) => clues.every(([t, a, b, p, q, k]) => {
    const absent = x => abs.indexOf(x) >= 0, cntP = P => range(n).filter(x => ans[x] === P && !absent(x)).length;
    return { HC: () => cntP(p) === k, AT: () => !absent(a), VO: () => imp.indexOf(a) < 0, TG: () => !absent(a) && !absent(b), AP: () => absent(a) || absent(b), MO: () => cntP(p) > cntP(q) }[t]();
  });
  const sols = [];
  const pairs = [];
  for (let a = 0; a < n; a++) for (let i = 0; i < n; i++) if (a !== i && ans[a] === ans[i] && (!part || part[a] === i)) pairs.push([a, i]);
  if (na === 1) pairs.forEach(([a, i]) => { if (truthOf([a], [i])) sols.push([[a, i]]); });
  else for (const [a1, i1] of pairs) for (const [a2, i2] of pairs) {
    if (a2 <= a1 || i1 === i2 || i1 === a2 || i2 === a1) continue;
    if (truthOf([a1, a2], [i1, i2])) sols.push([[a1, i1], [a2, i2]]);
  }
  const key = s => s.map(x => x.join(":")).sort().join(",");
  const tk = key(D.abs.map((a, j) => [a, D.imp[j]]));
  if (sols.length !== 1 || key(sols[0]) !== tk) err(at + ": перекличка: подходящих гипотез " + sols.length);
  addMetric("rollcall", d, clues.length);
}
function scTruthAll(par, s) {
  const n = par.length, dep = x => { let k = 1, z = x; while (par[z] >= 0) { z = par[z]; k++; } return k; }, kids = y => par.filter(v => v === y).length;
  const anc = (x, y) => { let z = par[x]; while (z >= 0) { if (z === y) return true; z = par[z]; } return false; };
  const [t, x, y, z, k] = s;
  switch (t) {
    case "PAR": return par[x] === y; case "NPAR": return par[x] !== y; case "ROOT": return par[x] === -1; case "KIDS": return kids(y) === k;
    case "SIB": return par[x] >= 0 && par[x] === par[z]; case "NSIB": return par[x] >= 0 && par[z] >= 0 && par[x] !== par[z];
    case "GRAND": return par[x] >= 0 && par[par[x]] === y; case "ANC": return anc(x, y); case "NANC": return !anc(x, y);
    case "GEN": return dep(x) === k; case "SAME": return dep(x) === dep(z); case "MORE": return kids(y) > kids(z);
  }
  return false;
}
function chkSuccession(D, d, at, full) {
  const n = D.n;
  if (!scTruthOk(D.par)) err(at + ": родословная: ответ не дерево");
  if (!D.sts.every(s => scTruthAll(D.par, s))) err(at + ": родословная: запись не верна для ответа");
  if (full) {
    let cntT = 0; const par = new Array(n).fill(-1);
    const rec = i => {
      if (cntT > 1) return;
      if (i === n) { if (scTruthOk(par) && D.sts.every(s => scTruthAll(par, s))) cntT++; return; }
      for (let v = -1; v < n; v++) { if (v === i) continue; par[i] = v; rec(i + 1); }
    };
    rec(0);
    if (cntT !== 1) err(at + ": родословная: деревьев " + cntT);
  }
  if (d === 0 && !D.sts.some(s => s[0] === "ROOT")) err(at + ": простая без основателя");
  addMetric("succession", d, D.sts.length);
}
function scTruthOk(par) {
  const n = par.length; if (par.filter(v => v === -1).length !== 1) return false;
  for (let x = 0; x < n; x++) { let z = par[x], g = 0; while (z >= 0 && g++ <= n) { if (z === x) return false; z = par[z]; } if (g > n) return false; }
  return true;
}
function chkMines(D, d, at, P) {
  const { R, C, M } = D, N = R * C;
  const nb = i => { const r = Math.floor(i / C), c = i % C, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < C) o.push(rr * C + cc); } return o; };
  const mineSet = new Set(D.mines), num = i => nb(i).filter(x => mineSet.has(x)).length;
  let confs = [];
  const rec = (i, left, cur) => { if (left === 0) { confs.push(cur.slice()); return; } if (N - i < left) return; cur.push(i); rec(i + 1, left - 1, cur); cur.pop(); rec(i + 1, left, cur); };
  rec(0, M, []);
  const rev = new Set();
  const reveal = x => { rev.add(x); const v = num(x); confs = confs.filter(cf => !cf.includes(x) && nb(x).filter(y => cf.includes(y)).length === v); };
  D.start.forEach(reveal);
  for (const x of P.ans) {
    if (rev.has(x)) { err(at + ": мины: плита открыта дважды"); return; }
    if (confs.some(cf => cf.includes(x))) { err(at + ": мины: ход не следует из чисел (плита " + x + ")"); return; }
    reveal(x);
  }
  if (rev.size !== N - M) err(at + ": мины: открыты не все пустые");
  if (confs.length !== 1) err(at + ": мины: в конце вариантов " + confs.length);
  const lvl = (D.used & 4 ? 2 : 0) + (D.used & 8 ? 1 : 0);
  if (d === 0 && (D.used & 4)) err(at + ": мины: простая требует сравнения чисел");
  if (d === 2 && !lvl) err(at + ": мины: сложная без сравнения чисел и без подсчёта мин");
  if (R !== d + 1) err(at + ": мины: рядов " + R);
  addMetric("mines", d, D.rounds);
}
function ptRunsC(row) { const out = []; let k = 0; for (const v of row) { if (v) k++; else if (k) { out.push(k); k = 0; } } if (k) out.push(k); return out.join(","); }
function chkPunchtape(D, d, at) {
  const { R, L, grid, known, cols } = D;
  const rowsFor = r => { const out = []; for (let m = 0; m < (1 << L); m++) { const row = range(L).map(j => (m >> j) & 1); if (ptRunsC(row) !== ptRunsC(grid[r])) continue; if (known[r].some((v, j) => v >= 0 && v !== row[j])) continue; out.push(row); } return out; };
  const cand = range(R).map(rowsFor);
  if (!cols) { cand.forEach((c, r) => { if (c.length !== 1 || c[0].join() !== grid[r].join()) err(at + ": перфолента: у ряда " + (r + 1) + " раскладок " + c.length); }); }
  else {
    let cntG = 0; const cur = [];
    const colOk = () => range(L).every(j => ptRunsC(cur.map(rw => rw[j])) === cols[j].join(","));
    const rec = r => { if (cntG > 1) return; if (r === R) { if (colOk()) cntG++; return; } for (const rw of cand[r]) { cur.push(rw); rec(r + 1); cur.pop(); } };
    rec(0);
    if (cntG !== 1) err(at + ": перфолента: решений " + cntG);
  }
  addMetric("punchtape", d, R * L);
}
function lkTrueC(cl, pos, n) {
  const pa = pos[cl.a[0]][cl.a[1]], pb = cl.b ? pos[cl.b[0]][cl.b[1]] : -1;
  return { same: pa === pb, nsame: pa !== pb, pos: pa === cl.k, npos: pa !== cl.k, imm: pb === pa + 1, left: pa < pb, adj: Math.abs(pa - pb) === 1, nadj: Math.abs(pa - pb) > 1, edge: pa === 0 || pa === n - 1, dist2: Math.abs(pa - pb) === 2 }[cl.t];
}
function chkLockers(D, d, at, full) {
  const { n, K, pos, clues } = D;
  if (!clues.every(cl => lkTrueC(cl, pos, n))) err(at + ": шкафчики: запись не верна для ответа");
  if (full) {
    const ps = perms(range(n)); let cntL = 0; const cur = [];
    const ready = cl => cl.a[0] < cur.length && (!cl.b || cl.b[0] < cur.length);
    const rec = c => {
      if (cntL > 1) return;
      if (c === K) { cntL++; return; }
      for (const p of ps) { cur.push(p); if (clues.every(cl => !ready(cl) || (cl.a[0] !== c && (!cl.b || cl.b[0] !== c)) || lkTrueC(cl, cur, n))) rec(c + 1); cur.pop(); }
    };
    rec(0);
    if (cntL !== 1) err(at + ": шкафчики: описей " + cntL);
  }
  addMetric("lockers", d, clues.length);
}
function rgStepC(st, i, D) {
  const m = D.m, s2 = st.map((v, j) => ((v + D.eff[i][j]) % m + m) % m);
  if (D.cl && D.cl.i === i && st[D.cl.c] === D.cl.z) s2[D.cl.j] = ((s2[D.cl.j] + D.cl.dl) % m + m) % m;
  return s2;
}
function chkRings(D, d, at, P) {
  for (const S of D.stages) {
    const seen = new Map([[S.from.join(), 0]]), q = [S.from]; let m = -1;
    for (let qi = 0; qi < q.length; qi++) { const s = q[qi], ds = seen.get(s.join()); if (s.join() === S.to.join()) { m = ds; break; } for (let i = 0; i < D.k; i++) { const t = rgStepC(s, i, D); if (!seen.has(t.join())) { seen.set(t.join(), ds + 1); q.push(t); } } }
    if (m !== S.min || S.limit !== m + [4, 3, 2][d]) err(at + ": сейф: кратчайшее " + m + ", в задаче " + S.min + ", предел " + S.limit);
    addMetric("rings", d, m);
  }
  let s = D.stages[0].from, si = 0, used = 0;
  for (const b of P.ans.reduce((a, x) => a.concat(x), [])) { s = rgStepC(s, b, D); used++; if (s.join() === D.stages[si].to.join()) { si++; used = 0; if (si < D.stages.length) s = s; } }
  if (si !== D.stages.length) err(at + ": сейф: план не открывает");
}
function grEvalC(D, fill, idl) {
  let num = D.S, den = 1, dir = 1; const sp = [[num, den]];
  const t = g => g.s != null ? fill[g.s] : g.t;
  for (let j = 1; j < D.sh.length; j++) { num *= t(D.sh[j - 1].o); den *= t(D.sh[j].i); dir = -dir; D.sock.forEach((sk, k) => { if (sk === j && idl[k]) dir = -dir; }); const g = gcd(num, den); num /= g; den /= g; sp.push([num, den]); }
  return { num, den, dir, sp };
}
function chkGears(D, d, at) {
  const ns = D.sh.reduce((a, s) => a + [s.i, s.o].filter(g => g && g.s != null && (s.i !== s.o || g === s.i)).length, 0);
  const slotsN = Math.max(...D.sh.map(s => Math.max(s.i && s.i.s != null ? s.i.s : -1, s.o && s.o.s != null ? s.o.s : -1))) + 1;
  const valid = [];
  const rec = (cur, used) => {
    if (cur.length === slotsN) {
      const ev = grEvalC(D, cur, D.sock.map(() => false));
      if (ev.num !== D.X * ev.den) return;
      if (D.vmax && ev.sp[D.vshaft][0] > D.vmax * ev.sp[D.vshaft][1]) return;
      valid.push(cur.slice()); return;
    }
    D.box.forEach((t, i) => { if (!used[i]) { used[i] = true; cur.push(t); rec(cur, used); cur.pop(); used[i] = false; } });
  };
  rec([], D.box.map(() => false));
  const key = a => a.map(f => f.join()).sort().join("|");
  if (key(valid) !== key(D.valid)) err(at + ": шестерни: верных наборов " + valid.length + ", в задаче " + D.valid.length);
  if (d === 0 && valid.length !== 1) err(at + ": шестерни: в простой наборов " + valid.length);
  if (d > 0 && valid.length < 2) err(at + ": шестерни: вариативная с одним набором");
  if (d === 2) {
    const free = []; const rec2 = (cur, used) => { if (cur.length === slotsN) { const ev = grEvalC(D, cur, [false, false]); if (ev.num === D.X * ev.den) free.push(cur); return; } D.box.forEach((t, i) => { if (!used[i]) { used[i] = true; cur.push(t); rec2(cur, used); cur.pop(); used[i] = false; } }); };
    rec2([], D.box.map(() => false));
    if (free.length <= valid.length) err(at + ": шестерни: предел подшипника ничего не отсекает");
  }
  addMetric("gears", d, slotsN);
}
function chkPendulums(D, d, at) {
  const fires = (i, t) => t >= D.ss[i] && (t - D.ss[i]) % D.ps[i] === 0;
  const common = [];
  for (let t = 1; t <= 3000 && common.length < 40; t++) if (D.ps.every((p, i) => fires(i, t))) common.push(t);
  let want;
  if (d === 0) { const L = D.ps.reduce(lcm, 1); want = D.q === "first" ? L : D.q === "count" ? L / D.ps[D.who] : Math.floor(D.T / L); }
  else want = D.q === "first" ? common[0] : D.q === "second" ? common[1] : common.filter(t => t <= 480).length;
  if (want !== D.ans) err(at + ": маятники: ответ " + D.ans + ", а перебор даёт " + want);
  if (d === 2) {
    const T = common[0], ok = [];
    for (let p = 2; p <= 30; p++) { if ((T - D.r0) % p) continue; let bad = false; for (let t = D.r0; t < T; t += p) if (fires(0, t)) bad = true; if (!bad) ok.push(p); }
    if (ok.join() !== D.valid.join() || ok.length < 2) err(at + ": маятники: периоды отбоя " + ok.join() + ", в задаче " + D.valid.join());
  }
  addMetric("pendulums", d, D.ps.length);
}
function chkShunting(D, d, at, P) {
  const n = D.grp.length, moves = D.capQ ? ["IO", "IS", "SO", "IQ", "QO"] : ["IO", "IS", "SO"];
  const ap = (s, m) => {
    let w; const ns = { i: s.i, st: s.st.slice(), qu: s.qu.slice(), out: s.out };
    if (m[0] === "I") { if (s.i >= n) return null; w = s.i; } else if (m === "SO") { if (!s.st.length) return null; w = s.st[s.st.length - 1]; } else { if (!s.qu.length) return null; w = s.qu[0]; }
    if (m === "IS") { if (s.st.length >= D.cap) return null; ns.i++; ns.st.push(w); return ns; }
    if (m === "IQ") { if (s.qu.length >= D.capQ) return null; ns.i++; ns.qu.push(w); return ns; }
    for (let x = 0; x < n; x++) if (x !== w && D.grp[x] < D.grp[w] && (x >= s.i || s.st.includes(x) || s.qu.includes(x))) return null;
    if (m === "IO") ns.i++; else if (m === "SO") ns.st.pop(); else ns.qu.shift();
    ns.out++; return ns;
  };
  const k = s => s.i + "|" + s.st + "|" + s.qu;
  const s0 = { i: 0, st: [], qu: [], out: 0 }, seen = new Map([[k(s0), 0]]), q = [s0]; let m = -1;
  for (let qi = 0; qi < q.length && m < 0; qi++) { const s = q[qi]; if (s.out === n) { m = seen.get(k(s)); break; } for (const mv of moves) { const t = ap(s, mv); if (t && !seen.has(k(t))) { seen.set(k(t), seen.get(k(s)) + 1); q.push(t); } } }
  if (m !== D.min || D.limit !== m + [4, 2, 1][d]) err(at + ": горка: кратчайшее " + m + ", в задаче " + D.min);
  let s = s0; for (const mv of P.ans) { s = ap(s, mv); if (!s) { err(at + ": горка: план ломается"); return; } }
  if (s.out !== n) err(at + ": горка: план не собирает состав");
  addMetric("shunting", d, m);
}
function chkSlider(D, d, at, full) {
  const { R, C, goal, start } = D, N = R * C;
  if (full) {
    const g = goal.join(), seen = new Map([[start.join(), 0]]), q = [start]; let m = -1;
    for (let qi = 0; qi < q.length; qi++) {
      const s = q[qi], ds = seen.get(s.join()); if (s.join() === g) { m = ds; break; }
      const b = s.indexOf(0);
      for (const p of [b - C, b + C, b % C ? b - 1 : -1, b % C < C - 1 ? b + 1 : -1]) { if (p < 0 || p >= N) continue; const t = s.slice(); t[b] = t[p]; t[p] = 0; const kt = t.join(); if (!seen.has(kt)) { seen.set(kt, ds + 1); q.push(t); } }
    }
    if (m !== D.min) err(at + ": пятнашки: кратчайшее " + m + ", в задаче " + D.min);
  }
  if (D.limit !== D.min + [4, 4, 2][d] || D.min < [5, 8, 14][d] || D.min > [12, 13, 18][d]) err(at + ": пятнашки: предел " + D.limit + " при кратчайшем " + D.min);
  addMetric("slider", d, D.min);
}
function bkTrueC(c, p, n, circ, ref) {
  const [t, a, b, k] = c, dist = (x, y) => { const dd = Math.abs(x - y); return circ ? Math.min(dd, n - dd) : dd; }, pa = a >= 0 ? p[a] : -1, pb = b >= 0 ? p[b] : -1;
  switch (t) {
    case "ADJ": return dist(pa, pb) === 1; case "NADJ": return dist(pa, pb) !== 1; case "POS": case "SEAT": return pa === k; case "NPOS": return pa !== k;
    case "EDGE": return pa === 0 || pa === n - 1; case "NEDGE": return pa !== 0 && pa !== n - 1; case "LEFT": return pa < pb; case "GAP": return Math.abs(pa - pb) === k + 1;
    case "OPP": return dist(pa, pb) === n / 2; case "CW": return pb === (pa + 1) % n;
    case "DOORHEAD": return p[ref.indexOf(0)] === 0; case "FARHEAD": return p[ref.indexOf(n - 1)] === n / 2;
    case "APART": for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (ref[j] === ref[i] + 1 && dist(p[i], p[j]) === 1) return false; return true;
    case "NEXT": for (let j = 0; j < n; j++) if (Math.abs(ref[j] - ref[a]) === 1 && dist(p[a], p[j]) === 1) return true; return false;
  }
  return false;
}
function chkBunker(D, d, at) {
  const n = D.n, all = perms(range(n));
  const s1 = all.filter(p => D.conds.every(c => bkTrueC(c, p, n, false, null)));
  if (s1.length < 2) err(at + ": рассадка: верных рассадок " + s1.length);
  if (d < 2) {
    const w = s1.filter(p => bkTrueC(D.wish, p, n, false, null)).length;
    if (!w || w === s1.length) err(at + ": рассадка: пожелание не делит рассадки (" + w + " из " + s1.length + ")");
    if (s1.length !== D.nsol) err(at + ": рассадка: верных " + s1.length + ", в задаче " + D.nsol);
  } else {
    let tot = 0;
    s1.forEach((rf, i) => { const s2 = all.filter(p => D.conds2.every(c => bkTrueC(c, p, n, true, rf))); if (!s2.length) err(at + ": рассадка: после рассадки нар " + i + " стол не решается"); tot += s2.length; });
    if (tot !== D.nsol) err(at + ": рассадка: всего путей " + tot + ", в задаче " + D.nsol);
  }
  addMetric("bunker", d, s1.length);
}
function chkLeague(D, d, at) {
  const n = D.n, ms = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) ms.push([i, j]);
  const pts = v => { const p = new Array(n).fill(0); ms.forEach((m, k) => { p[m[0]] += v[k]; p[m[1]] += 2 - v[k]; }); return p; };
  const wins = v => { const w = new Array(n).fill(0); ms.forEach((m, k) => { if (v[k] === 2) w[m[0]]++; if (v[k] === 0) w[m[1]]++; }); return w; };
  const ok = (c, v) => ({ PTS: () => pts(v)[c.a] === c.k, DRAWS: () => v.filter(x => x === 1).length === c.k, NOLOSS: () => ms.every((m, k) => !((m[0] === c.a && v[k] === 0) || (m[1] === c.a && v[k] === 2))), WINS: () => wins(v)[c.a] === c.k })[c.t]();
  let cntS = 0;
  for (let c = 0; c < Math.pow(3, D.miss.length); c++) { const v = D.vals.slice(); let x = c; D.miss.forEach(k => { v[k] = x % 3; x = Math.floor(x / 3); }); if (D.clues.every(cl => ok(cl, v))) cntS++; }
  if (cntS !== 1) err(at + ": таблица: заполнений " + cntS);
  if (d === 2) {
    const p = pts(D.vals), w = wins(D.vals), o = D.ord;
    for (let i = 0; i + 1 < n; i++) {
      const a = o[i], b = o[i + 1];
      if (p[a] < p[b]) err(at + ": таблица: место по очкам");
      if (p[a] === p[b]) { const k = ms.findIndex(m => (m[0] === a && m[1] === b) || (m[0] === b && m[1] === a)), hv = ms[k][0] === a ? D.vals[k] : 2 - D.vals[k]; if (hv < 1 || (hv === 1 && w[a] <= w[b])) err(at + ": таблица: равенство очков разрешено не по правилу"); }
    }
    if (!o.some((x, i) => i + 1 < n && p[x] === p[o[i + 1]])) err(at + ": таблица: в сложной нет равенства очков");
  }
  addMetric("league", d, D.miss.length);
}
function chkSwitch(D, d, at) {
  const n = D.n, all = perms(range(n));
  const peak = o => { let l = 0, pk = 0; o.forEach(v => { pk = Math.max(pk, l + D.s[v]); l += D.w[v]; }); return pk; };
  const ok = o => { const at2 = []; o.forEach((v, i) => at2[v] = i); return D.deps.every(([a, b]) => at2[a] < at2[b]) && D.nadj.every(([a, b]) => at2[a] !== at2[b] + 1) && (!D.lim || peak(o) <= D.lim); };
  const v = all.filter(ok);
  if (v.length !== D.nvalid || v.length < 2) err(at + ": рубильники: верных порядков " + v.length + ", в задаче " + D.nvalid);
  const mp = Math.min(...v.map(peak));
  if (mp !== D.minP) err(at + ": рубильники: лучший бросок " + mp + ", в задаче " + D.minP);
  if (!v.some(o => peak(o) > mp)) err(at + ": рубильники: все порядки одинаково хороши");
  if (D.lim && all.filter(o => D.deps.every(([a, b]) => o.indexOf(a) < o.indexOf(b)) && D.nadj.every(([a, b]) => o.indexOf(a) !== o.indexOf(b) + 1)).length <= v.length) err(at + ": рубильники: предел щита ничего не отсекает");
  addMetric("switchorder", d, n);
}
/* число этапов: у сейфа stages — список этапов, у остальных — число */
const nStages = P => typeof P.stages === "number" ? P.stages : (P.stages && P.stages.length) || 1;
function independent(kind, d, P, seed) {
  const D = P.data, at = kind + "/" + d + "/" + seed;
  switch (kind) {
    case "testimony": return chkTestimony(D, d, at);
    case "rollcall": return chkRollcall(D, d, at);
    case "succession": return chkSuccession(D, d, at, d < 2 || seed % 6 === 1);
    case "mines": return chkMines(D, d, at, P);
    case "punchtape": return chkPunchtape(D, d, at);
    case "lockers": return chkLockers(D, d, at, d < 2 || seed % 4 === 1);
    case "rings": return chkRings(D, d, at, P);
    case "gears": return chkGears(D, d, at);
    case "pendulums": return chkPendulums(D, d, at);
    case "shunting": return chkShunting(D, d, at, P);
    case "slider": return chkSlider(D, d, at, d === 0 || seed % 10 === 1);
    case "bunker": return chkBunker(D, d, at);
    case "league": return chkLeague(D, d, at);
    case "switchorder": return chkSwitch(D, d, at);
  }
}
/* испорченный ответ: solve должен его отвергнуть */
function spoil(kind, P) {
  const a = JSON.parse(JSON.stringify(P.ans));
  switch (kind) {
    case "testimony": a.c = (a.c + 1) % P.n; return a;
    case "rollcall": return { abs: a.imp, imp: a.abs };
    case "succession": { const x = a.findIndex(v => v >= 0); a[x] = a[x] === 0 ? 1 : 0; if (a[x] === x) a[x] = -1; return a; }
    case "punchtape": a[0][0] = 1 - a[0][0]; return a;
    case "lockers": { const t = a[0][0]; a[0][0] = a[0][1]; a[0][1] = t; return a; }
    case "league": a.res[0] = (a.res[0] + 1) % 3; return a;
    case "pendulums": a.t += 1; return a;
    case "gears": a.fill = a.fill.slice(); a.fill[0] = P.G.box.find(t => a.fill.indexOf(t) < 0 && !P.data.valid.some(v => v[0] === t)) || a.fill[0]; if (P.G.nslots === 1) a.idl = a.idl.map(x => !x); return a;
    case "bunker": { const bad = perms(range(P.n)).find(p => !P.data.conds.every(c => bkTrueC(c, p, P.n, false, null))); return { row: bad, table: a.table }; }
    case "switchorder": return a.slice().reverse();
  }
  return [];
}

/* ── прогон ── */
const t0 = Date.now(), counts = { solved: 0, alts: 0, wrong: 0, leave: 0, fuzz: 0, staged: 0, titled: 0, solveOk: 0, condStage: 0, condSame: 0 };
if (!P4 || !Array.isArray(P4.kinds) || P4.kinds.length !== 14) err("LAB.puzzles4.kinds: ждали 14 видов");
const OLD = ["sort", "relays", "bulls", "riddle", "chess", "breaker", "decon", "labels", "dosim", "shifts", "tally", "jugs", "scales", "lights", "hanoi", "gates", "binary", "cipher", "series", "calib", "crossing", "robot", "latin", "clues", "termhack", "archive", "acrostic", "accesslog", "checksum", "pinwear", "titr", "vials", "protocol", "spectr", "chain"];
const ONLY = process.env.P4_KINDS ? process.env.P4_KINDS.split(",") : null;
const KINDS = ONLY ? P4.kinds.filter(k => ONLY.indexOf(k) >= 0) : P4.kinds;
for (const kind of KINDS) {
  if (OLD.indexOf(kind) >= 0) err(kind + ": такой вид уже есть");
  if (!LAB.puzzles.has(kind) || !LAB.puzzles.hasDiff(kind)) err(kind + ": не зарегистрирован со ступенями");
  const nm = LAB.puzzles.nameOf(kind);
  if (!/^[а-яё ]+$/.test(nm)) err(kind + ": название «" + nm + "» не строчное русское");
  for (let d = 0; d <= 2; d++) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const at = kind + "/" + d + "/" + seed;
      try {
        const title = seed % 29 === 0 ? "Стенд испытаний" : null;
        const s0 = said.length;
        const o = openPuzzle(kind, seed, d, title);
        if (title) counts.titled++;
        const P = P4.gen(kind, seed, d);
        if (P4.plan(kind, seed, d).join("|") !== o.last.plan.join("|")) err(at + ": LAB.puzzles4.plan не совпадает с _last.plan");
        if (P4.sig(kind, seed, d) !== P.sig || P.sig !== o.last.sig) err(at + ": подпись нестабильна");
        if (!o.last.wrong || o.last.wrong.length !== 3) err(at + ": нет трёх неверных путей");
        independent(kind, d, P, seed);
        /* solve: верный ответ принят, испорченный — нет */
        const sv = P4.solve(kind, P, P.ans), sb = P4.solve(kind, P, spoil(kind, P)), sv2 = P4.solve(kind, { seed, diff: d }, P.ans);
        if (!sv || sv !== sv2) err(at + ": solve не принял верный ответ (" + sv + ", " + sv2 + ")");
        else if (sb) err(at + ": solve принял испорченный ответ");
        else counts.solveOk++;
        if (o.last.variable && sv !== 2) err(at + ": solve: канонический ответ вариативной задачи не образцовый");
        /* план */
        const sp = said.length;
        follow(o, o.last.plan, at);
        if (o.res.length !== 1 || o.res[0] !== true) err(at + ": план не решил задачу (" + JSON.stringify(o.res) + ")");
        else counts.solved++;
        if (stack.length) err(at + ": после решения окна не закрылись");
        if (o.last.st.tries !== 0) err(at + ": план потратил попытки: " + o.last.st.tries);
        if (o.last.variable && !o.last.best) err(at + ": план вариативной задачи не отмечен образцовым");
        if (o.last.stages !== nStages(P)) err(at + ": _last.stages " + o.last.stages + ", а этапов " + nStages(P));
        if (!o.last.variable && o.last.best) err(at + ": образцовое у задачи с одним ответом");
        if (o.last.variable && (o.last.sol < 1 || o.last.alts.length < 1)) err(at + ": вариативная, а решений " + o.last.sol + ", других путей " + o.last.alts.length);
        if (o.last.best && !said.slice(sp).some(t => /Образцовое решение/.test(t))) err(at + ": образцовое без отметки в итоговой фразе");
        if (nStages(P) > 1) {
          if (o.cond.indexOf("Этап первый из двух") < 0) err(at + ": составная: в условии нет первого этапа");
          const st2 = said.slice(sp).findIndex(t => /Этап второй из двух/.test(t));
          if (st2 < 0) err(at + ": составная: второй этап не объявлен"); else counts.staged++;
        }
        /* другие решения */
        o.last.alts.forEach((al, ai) => {
          const a2 = openPuzzle(kind, seed, d);
          follow(a2, al.plan, at + " другой путь " + (ai + 1));
          if (a2.res.length !== 1 || a2.res[0] !== true) err(at + ": другой путь " + (ai + 1) + " не принят (" + JSON.stringify(a2.res) + ")");
          else if (!!a2.last.best !== !!al.best) err(at + ": другой путь " + (ai + 1) + ": образцовое " + a2.last.best + ", ждали " + al.best);
          else counts.alts++;
          stack.length = 0;
        });
        if (seed % 10 === 1) { const o2 = openPuzzle(kind, seed, d, title); if (o2.cond !== o.cond) err(at + ": то же зерно — другое условие"); stack.length = 0; }
        /* «Условие ещё раз»: до смены этапа — исходное условие; после — исходное, итог первого этапа и задание второго */
        if (nStages(P) > 1 || seed % 10 === 3) {
          const c2 = openPuzzle(kind, seed, d);
          markMain(); clickPrefix("Условие ещё раз", at + " условие до смены этапа");
          if (said[said.length - 1] !== c2.cond) err(at + ": «Условие ещё раз» говорит не исходное условие"); else counts.condSame++;
          if (nStages(P) > 1) {
            const pl = c2.last.plan, s1 = said.length; let i = 0;
            for (; i < pl.length; i++) { markMain(); clickPrefix(pl[i], at + " к этапу два, шаг " + (i + 1)); if (said.slice(s1).some(x => /Этап второй из двух/.test(x))) break; }
            if (i >= pl.length) err(at + ": второй этап не наступил");
            else {
              while (stack.length > 1) LAB.ui.closeTop(true);
              markMain(); clickPrefix("Условие ещё раз", at + " условие после смены этапа");
              const tc = said[said.length - 1], rest = tc.slice(c2.cond.length);
              if (tc.indexOf(c2.cond) !== 0 || !/^ Первый этап пройден/.test(rest) || !/Этап второй из двух/.test(rest)) err(at + ": после смены этапа «Условие ещё раз» не о втором этапе: «" + tc.slice(-160) + "»");
              else counts.condStage++;
              follow(c2, pl.slice(i + 1), at + " после повтора условия второго этапа");
              if (c2.res.length !== 1 || c2.res[0] !== true) err(at + ": после повтора условия второй этап не решён планом");
            }
          }
          stack.length = 0;
        }
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
          stack.length = 0;
        }
        /* случайные нажатия */
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
        /* отойти */
        if (seed % 7 === 5) {
          const a = openPuzzle(kind, seed, d);
          if (seed % 2) clickPrefix(a.last.plan[0], at + " отойти, сначала шаг");
          while (stack.length > 1) LAB.ui.closeTop(true);
          clickPrefix("Отойти от задачи", at + " отойти");
          if (a.res.length !== 1 || a.res[0] !== false || !a.away[0] || stack.length) err(at + ": «Отойти от задачи» не дал ухода");
          else counts.leave++;
        }
        checkSaid(s0, at);
      } catch (e) {
        err(at + ": " + (e && e.message ? e.message : e) + (e && e.stack ? " @ " + e.stack.split("\n").slice(1, 3).join(" ").trim() : ""));
        stack.length = 0;
      }
    }
  }
}
/* звуки — только существующие записи */
const badSnd = [...new Set(played)].filter(id => !SND[id]);
if (badSnd.length) err("нет таких звуков в sounds.js: " + badSnd.join(", "));
const tWalk = Date.now() - t0;

/* ── СЧЁТ: разные задачи по подписи ── */
const table = [], timeMax = {};
let total = 0;
for (const kind of KINDS) {
  const row = [kind];
  for (let d = 0; d <= 2; d++) {
    const set = new Set(); let tmax = 0, tsum = 0;
    for (let seed = 1; seed <= COUNT; seed++) {
      const a = Date.now();
      const sg = P4.sig(kind, seed, d);
      const dt = Date.now() - a; tsum += dt; if (dt > tmax) tmax = dt;
      if (typeof sg !== "string" || sg.indexOf(kind + "|" + d + "|") !== 0) { err(kind + "/" + d + "/" + seed + ": подпись не та: " + sg); continue; }
      set.add(sg);
    }
    row.push(set.size); total += set.size;
    timeMax[kind + d] = [tmax, tsum / COUNT];
    if (set.size < 300) err(kind + "/" + d + ": разных задач " + set.size + " — меньше 300");
    if (tmax > 120) err(kind + "/" + d + ": задача строилась " + tmax + " мс");
  }
  table.push(row);
}
if (!ONLY && total < 20000) err("всего разных задач " + total + " — меньше 20 000");

/* ── итог ── */
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log("видов: " + P4.kinds.length + ", зёрен прохождения: " + SEEDS + ", решено планом: " + counts.solved + " из " + KINDS.length * 3 * SEEDS + ", других решений принято: " + counts.alts +
  ", неверных путей до провала: " + counts.wrong + ", уходов: " + counts.leave + ", случайных прогулок: " + counts.fuzz + ", этапов объявлено: " + counts.staged + ", повтор условия второго этапа: " + counts.condStage + ", исходного условия: " + counts.condSame + ", solve: " + counts.solveOk + ", время прохождения: " + tWalk + " мс");
console.log("размер (простая/средняя/сложная): " + KINDS.map(k => k + " " + [0, 1, 2].map(d => metric[k + d] ? mean(metric[k + d]).toFixed(1) : "—").join("/")).join("; "));
console.log("самое длинное условие: " + stat.condMax + " знаков (" + stat.condMaxKind + "); самый длинный пункт: " + stat.labelMax + " («" + stat.labelMaxText + "»); самая длинная реплика: " + stat.lineMax + " знаков; пунктов в главном окне до " + stat.menuMax + ", в подменю до " + stat.subMax);
console.log("Разных задач на зёрнах 1…" + COUNT + " (простая / средняя / сложная; время сборки задачи, мс: наибольшее/среднее):");
table.forEach(r => console.log("  " + (r[0] + "            ").slice(0, 12) + " " + r.slice(1).map(v => String(v).padStart(5)).join(" / ") + "   " + [0, 1, 2].map(d => timeMax[r[0] + d][0] + "/" + timeMax[r[0] + d][1].toFixed(2)).join("  ")));
console.log("  итого по файлу: " + total);
console.log("звуки: " + [...new Set(played)].sort().join(", "));
if (process.env.P4_DUMP) fs.writeFileSync(process.env.P4_DUMP, [...new Set(said)].join("\n"));
console.log(fails ? "ПРОВАЛЕНО: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
