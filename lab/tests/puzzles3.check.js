#!/usr/bin/env node
/* Проверка логических замков третьей части (js/puzzles3.js): шесть видов
   про пароли, архивы и взлом × три сложности × зёрна. Для каждой задачи:
   условие начинается со сложности и чистое (нет undefined, NaN, null,
   прямых кавычек, латиницы, двойных пробелов); план из LAB.puzzles._last,
   пройденный по пунктам меню (окна — как в ui.js), решает задачу;
   LAB.puzzles3.plan даёт тот же план; где ответ один — он один (перебор
   здесь, отдельно от генератора); укладывается в лимит попыток. Взлом
   терминала: план — стратегия «лучшего деления», она снимает любой
   пароль набора за три попытки (проверяется для всех паролей). На части
   зёрен — неверный путь: попытки тратятся по одной, после третьей —
   провал; «Отойти от задачи» — провал без ошибок. Звуки — только из
   sounds.js. puzzles3.js подключается сразу после puzzles2.js (в игре —
   таким же тегом <script> в index.html, его добавляют вручную).
   Запуск: node lab/tests/puzzles3.check.js [число зёрен, не меньше 150] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const SEEDS = Math.max(150, Number(process.argv[2]) || 150);
const timers = [];
const ctx = { console, Math, JSON, Object, Array, String, Number, Uint8Array, Int8Array, Int16Array, Int32Array, Float64Array, Error, Date, RegExp,
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["js/data.js", "js/texts.js", "js/lore.js", "js/b1.js", "js/b2.js", "js/b3.js", "js/b4.js", "js/b5.js", "js/world.js", "js/depths.js", "js/goods.js", "js/arms.js", "js/traps.js", "js/puzzles.js", "js/puzzles2.js", "js/puzzles3.js"]) {
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
const LONG_OK = /^(Алфавит|Записка|Известно|Стёрты|Журнал|Запрос|Номер пропуска)/;
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
const P3 = LAB.puzzles3;
function clickPrefix(prefix, where) {
  const w = top();
  if (!w) throw new Error("нет окна, а нужен пункт «" + prefix + "»");
  const labels = checkWindow(w, where);
  const hits = []; labels.forEach((l, i) => { if (P3.match(l, prefix)) hits.push(i); });
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

/* ── независимые проверки единственности ── */
const ABC33 = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
function permsN(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((v, i) => permsN(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([v].concat(p)))); return out; }
function digitSum(v) { v = Math.abs(v); let s = 0; while (v) { s += v % 10; v = Math.floor(v / 10); } return s; }
function shiftL(ch, k) { const i = ABC33.indexOf(ch); return i < 0 ? ch : ABC33.charAt(((i + k) % 33 + 33) % 33); }
const metric = {};
function addMetric(kind, d, v) { const k = kind + d; (metric[k] = metric[k] || []).push(v); }
function independent(kind, d, last, seed) {
  const D = last.data, at = kind + "/" + d + "/" + seed;
  if (last.sol !== 1) err(at + ": генератор насчитал решений " + last.sol);
  if (kind === "termhack") {
    const ws = D.words;
    if (ws.length !== D.N || ws.length !== [6, 8, 10][d]) err(at + ": слов " + ws.length);
    if (ws.some(w => w.length !== D.len) || D.len !== [5, 6, 7][d]) err(at + ": длина слов не та");
    if (new Set(ws).size !== ws.length) err(at + ": повтор слова");
    if (ws.some(w => /[^а-я]/.test(w) || /ё/.test(w))) err(at + ": слово не из строчных русских без ё");
    if (ws.indexOf(D.secret) < 0) err(at + ": пароль не в списке");
    let worst = 0;
    for (let s = 0; s < ws.length; s++) { const sq = P3._hackSolve(ws, s); if (!sq || sq.length > 3) { err(at + ": пароль «" + ws[s] + "» не снимается за три попытки"); break; } worst = Math.max(worst, sq.length); }
    addMetric(kind, d, ws.length);
    addMetric("termWorst", d, worst);
  } else if (kind === "archive") {
    const cab = d === 2 ? digitSum(D.day) + digitSum(D.month) + digitSum(D.year) : digitSum(D.year);
    if (cab !== D.cab || D.shelf !== D.month) err(at + ": шкаф/полка не по правилу");
    const idx = ABC33.indexOf(D.surname.charAt(0).toLowerCase());
    if (D.cabOpts.indexOf(D.cab) < 0 || D.shelfOpts.indexOf(D.shelf) < 0 || D.folderOpts.indexOf(D.folder) < 0) err(at + ": верного значения нет в списке");
    if (new Set(D.cabOpts).size !== D.cabOpts.length || new Set(D.shelfOpts).size !== D.shelfOpts.length) err(at + ": обманки повторяются");
    if (D.cabOpts.length !== [4, 5, 6][d] || D.folderOpts.length !== (d === 2 ? 6 : 4)) err(at + ": не столько вариантов");
    if (idx < 0) err(at + ": фамилия не из алфавита");
    addMetric(kind, d, D.size);
  } else if (kind === "acrostic") {
    const first = (D.rule === 1) ? D.words.filter((_, i) => i % 2 === 1).map(w => w.charAt(0)) : D.lines.map(l => l.charAt(0));
    let got;
    if (D.rule === 2) got = first.map(ch => shiftL(ch, D.K)).join(""); else got = first.join("");
    if (got !== D.pass || D.pass.length !== D.L || D.L !== [4, 5, 6][d]) err(at + ": из записки по правилу выходит «" + got + "», а пароль «" + D.pass + "»");
    D.opts.forEach((set, i) => { if (set.indexOf(D.pass.charAt(i)) < 0) err(at + ": в меню буквы " + (i + 1) + " нет верной"); if (new Set(set).size !== set.length || set.length < 2) err(at + ": варианты буквы " + (i + 1) + " плохие"); });
    if (D.rule === 1 && D.words.length !== D.L * 2) err(at + ": слов в записке не столько");
    addMetric(kind, d, D.L);
  } else if (kind === "accesslog") {
    const N = D.names.length, all = permsN(D.names.map((_, k) => k));
    const fit = perm => D.clues.every(cl => {
      if (cl.t === "not") return perm[cl.j] !== cl.p;
      if (cl.t === "is") return perm[cl.j] === cl.p;
      return D.times[perm.indexOf(cl.p)] < D.times[perm.indexOf(cl.q)];
    });
    const ok = all.filter(fit);
    if (ok.length !== 1 || ok[0].join() !== D.truth.join() || D.answer !== D.truth[D.ask] || N !== [3, 4, 5][d]) err(at + ": журнал: подходящих раскладов " + ok.length);
    if (new Set(D.names).size !== N || new Set(D.rooms).size !== N) err(at + ": имена или двери повторяются");
    addMetric(kind, d, N);
  } else if (kind === "checksum") {
    const digs = D.digits.slice(), gaps = D.gaps, rulesOk = full => D.rules.every(ru => { let s = 0; for (let i = 0; i < full.length; i++) s += ru.weights[i] * full[i]; return s % 10 === 0; });
    let sols = [];
    if (gaps.length === 1) { for (let x = 0; x < 10; x++) { const f = digs.slice(); f[gaps[0]] = x; if (rulesOk(f)) sols.push([x]); } }
    else { for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) { const f = digs.slice(); f[gaps[0]] = x; f[gaps[1]] = y; if (rulesOk(f)) sols.push([x, y]); } }
    if (sols.length !== 1 || sols[0].join() !== D.answer.join()) err(at + ": контроль: решений " + sols.length);
    if (D.len !== [6, 7, 8][d] || digs.length !== D.len) err(at + ": длина номера не та");
    if (gaps.length !== (d === 2 ? 2 : 1)) err(at + ": пропусков не столько");
    addMetric(kind, d, D.len);
  } else if (kind === "pinwear") {
    const worn = D.worn, all = permsN(worn.slice());
    if (worn.length !== D.L || D.L !== [3, 4, 5][d] || new Set(worn).size !== worn.length) err(at + ": клавиши плохие");
    if (D.pin.slice().sort().join() !== worn.slice().sort().join()) err(at + ": код не из стёртых клавиш");
    const fit = perm => D.clues.every(cl => {
      if (cl.t === "parity") return (perm[cl.i] % 2 === 0) === cl.even;
      if (cl.t === "cmp") return cl.lt ? perm[cl.i] < perm[cl.j] : perm[cl.i] > perm[cl.j];
      if (cl.t === "max") return perm[cl.i] === cl.v;
      if (cl.t === "min") return perm[cl.i] === cl.v;
      return perm[cl.i] + perm[cl.j] === cl.s;
    });
    const ok = all.filter(fit);
    if (ok.length !== 1 || ok[0].join() !== D.pin.join()) err(at + ": клавиатура: подходящих кодов " + ok.length);
    addMetric(kind, d, D.L);
  }
}

/* ── прогон ── */
const t0 = Date.now(), counts = { solved: 0, wrong: 0, leave: 0, titled: 0, fuzz: 0 }, variety = [];
if (!P3 || !Array.isArray(P3.kinds) || P3.kinds.length !== 6) err("LAB.puzzles3.kinds: ждали 6 видов");
for (const kind of P3.kinds) {
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
        const pl2 = P3.plan(kind, seed, d);
        if (!pl2 || pl2.join("|") !== o.last.plan.join("|")) err(at + ": LAB.puzzles3.plan не совпадает с _last.plan");
        if (!o.last.wrong || o.last.wrong.length !== 3) err(at + ": нет трёх неверных путей");
        independent(kind, d, o.last, seed);
        follow(o, o.last.plan, at);
        if (o.res.length !== 1 || o.res[0] !== true) err(at + ": план не решил задачу (" + JSON.stringify(o.res) + ")");
        else counts.solved++;
        if (stack.length) err(at + ": после решения окна не закрылись");
        /* взлом терминала: план — стратегия «лучшего деления», неверные догадки тратят попытки (не больше двух), а третья — пароль */
        if (kind === "termhack") {
          if (o.last.st.tries !== o.last.plan.length - 1 || o.last.st.tries > 2) err(at + ": план-стратегия потратил попыток " + o.last.st.tries + " при длине плана " + o.last.plan.length);
        } else if (o.last.st.tries !== 0) err(at + ": план потратил попытки: " + o.last.st.tries);
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
            if (!z.res.length && z.last.st.tries > 3) err(at + ": попыток потрачено больше трёх без провала");
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
    if (conds.size < Math.min(8, SEEDS / 4)) err(kind + "/" + d + ": мало разных задач: " + conds.size);
    variety.push(kind + d + ":" + conds.size);
  }
}
/* слова взлома: нужной длины, из строчного алфавита без ё, без повторов */
for (const len of Object.keys(P3._words)) {
  const ws = P3._words[len];
  if (new Set(ws).size !== ws.length) err("взлом: повторы в словах длины " + len);
  ws.forEach(w => { if (w.length !== +len || /[^а-я]/.test(w) || /ё/.test(w)) err("взлом: слово «" + w + "» не той длины или не из строчного алфавита без ё"); });
  if (ws.length < 12) err("взлом: мало слов длины " + len);
}
/* звуки — только существующие записи */
const badSnd = [...new Set(played)].filter(id => !SND[id]);
if (badSnd.length) err("нет таких звуков в sounds.js: " + badSnd.join(", "));
/* сложность растёт: средние размеры по видам */
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const report = [];
for (const kind of P3.kinds) {
  const ms = [0, 1, 2].map(d => metric[kind + d] ? mean(metric[kind + d]) : NaN);
  report.push(kind + " " + ms.map(v => v.toFixed(1)).join("/"));
  if (!(ms[0] < ms[1] && ms[1] < ms[2])) err(kind + ": размер задачи не растёт со сложностью: " + ms.join(", "));
}
const ms = Date.now() - t0;
console.log("видов: " + P3.kinds.length + ", зёрен на сложность: " + SEEDS + ", решено планом: " + counts.solved + " из " + P3.kinds.length * 3 * SEEDS +
  ", неверных путей до провала: " + counts.wrong + ", уходов: " + counts.leave + ", случайных прогулок: " + counts.fuzz + ", с заголовком стенда: " + counts.titled + ", время: " + ms + " мс");
console.log("размер (простая/средняя/сложная): " + report.join("; "));
console.log("взлом: худшее число попыток по стратегии (простая/средняя/сложная): " + [0, 1, 2].map(d => metric["termWorst" + d] ? Math.max.apply(null, metric["termWorst" + d]) : "—").join("/"));
console.log("самое длинное условие: " + stat.condMax + " знаков; самый длинный пункт: " + stat.labelMax + " («" + stat.labelMaxText + "»); самая длинная реплика: " + stat.lineMax + " знаков; пунктов в главном окне до " + stat.menuMax + ", в подменю до " + stat.subMax);
console.log("разных задач на " + SEEDS + " зёрен: " + variety.join(" "));
console.log("звуки: " + [...new Set(played)].sort().join(", "));
console.log(fails ? "ПРОВАЛЕНО: " + fails : "ВСЁ ХОРОШО");
process.exit(fails ? 1 : 0);
