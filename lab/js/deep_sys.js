/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — системы глубоких блоков (после 4.1).
   По мотивам «Низшего», переработанные под мир Нижних (DEEP.md, раздел 3):
   • Статус в списках Переклички: вне списка → низший → допущенный → сменщик →
     бригадный → старший смены → смотритель. Статус — должность, а не сила: он
     открывает двери с допуском, снижает цены Нижних, оживляет «оружие по
     допуску» и даёт карточки тварей. Растёт за испытания и нормы, падает за
     проваленные нормы и долги.
   • Норма смены: на каждом новом уровне Перекличка даёт задание (детали,
     твари, образцы, ремонт, обход); выполнил — оплата и шаг к статусу,
     ушёл с уровня, не выполнив, — минус к статусу.
   • Прокатный комплект (блок VI): модули с платой за каждую смену-уровень;
     нечем платить — модуль отзывают.
   • Испытательный стенд: отсчёт от десяти — и испытание (выстоять, найти,
     тишина, разминирование, погоня, задача).
   • Теневой торговец вне надзора; карточки тварей; вспышки памяти;
     отложенная регенерация, шов, антимутаген.
   • Срез: короткий путь вниз сразу на много уровней (deep_floor.js ставит).
   Синтаксис — не новее ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game && LAB.game.G; }
function CUR() { return LAB.game && LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var a = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, a); } catch (e) { console.warn(e); } } return null; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { /* */ } } return null; }
function journal(t) { if (gm() && gm().journal) gm().journal(t); }
function h32(s) { return LAB.hash32 ? LAB.hash32(String(s)) >>> 0 : 0; }
function pl(n, a, b, c) { return gm() && gm().plural ? gm().plural(n, a, b, c) : c; }
function deepL(L) { return (L || 0) > 100; }
function Dd(L) { var g = G(); return LAB.DEEP && LAB.DEEP[LAB.blockOf(L || (g ? g.L : 1))]; }
function aiName(L) { var D = Dd(L); return (D && D.ai && D.ai.n) || "Перекличка"; }
/* Слова Переклички: сигнал «трёх счетов» и голос машины. */
function roll(t, delay) {
  var g = G(), L0 = g.L, F0 = g.F;
  setTimeout(function () {
    var g2 = G();
    if (!gm().entered || !g2 || g2.dead || g2.L !== L0 || g2.F !== F0) return;
    A("okoChime", "roll", 0);
    setTimeout(function () { if (gm().entered && !G().dead) say(aiName() + " по громкой связи: «" + t + "»", { prio: "event", keep: true, robot: true }); }, 560);
  }, delay || 0);
}

/* ════════ СТАТУС ════════ */
var NAMES = ["вне списка", "низший", "допущенный", "сменщик", "бригадный", "старший смены", "смотритель"];
var NEED = [0, 0, 30, 80, 160, 280, 450];
function S() {
  var g = G();
  if (!g.deep) g.deep = { st: 0, pts: 0, cards: {}, mem: {}, trials: {}, norm: null, rent: null, regen: [], lastL: 0 };
  return g.deep;
}
function status() {
  var g = G(); if (!g || !g.deep) return 0;
  /* на Полигоне номер в списках — браслет проката: сдали его — счётчики видят чужака */
  var r = g.deep.rent;
  if (r && r.everId && !rentHas("id") && Dd() && Dd().rent && Dd().rent.length) return 0;
  return g.deep.st;
}
function stName(n) { return NAMES[Math.max(0, Math.min(6, n || 0))]; }
function addPts(x, why) {
  var s = S(), up = false, down = false;
  s.pts = Math.max(0, s.pts + x);
  while (s.st >= 1 && s.st < 6 && s.pts >= NEED[s.st + 1]) { s.st++; up = true; }
  while (s.st > 1 && s.pts < NEED[s.st]) { s.st--; down = true; }
  if (up) { A("play", "term_ok"); roll("Седьмой. Новый статус: " + stName(s.st) + ". Внесено в списки.", 1200); journal("Статус в списках Переклички: " + stName(s.st) + "."); if (LAB.ach) LAB.ach.ev("status", s.st); }
  else if (down) { A("play", "term_err"); roll("Седьмой. Статус понижен: " + stName(s.st) + "." + (why ? " " + why : ""), 1200); journal("Статус понижен: " + stName(s.st) + "."); }
}
/* Цены Нижних: вне списка — дороже, смотрителю — дешевле. */
function priceF() { var g = G(); if (!g || !deepL(g.L)) return 1; var st = status(), k = st === 0 ? 1.25 : 1.12 - 0.045 * st; return g.deep && g.deep.disc === g.L ? k * 0.9 : k; } /* скидка за норму — до конца уровня */
function nextLine() { var s = S(); return s.st >= 6 ? "Выше статуса нет." : s.st === 0 ? "Пока вас нет в списках." : "До статуса «" + stName(s.st + 1) + "» — " + Math.max(0, NEED[s.st + 1] - s.pts) + " " + pl(NEED[s.st + 1] - s.pts, "очко", "очка", "очков") + "."; }
function statusLine() {
  var s = S(), q = s.norm, r = s.rent;
  var t = "Статус в списках Переклички: " + stName(s.st) + ". " + nextLine();
  if (q && !q.done) t += " Норма смены: " + q.n + " — " + q.have + " из " + q.need + ".";
  if (r && r.mods && r.mods.length) t += " Прокат: " + r.mods.map(function (m) { return "«" + m.n + "»"; }).join(", ") + ", плата за смену — " + rentFee() + " " + pl(rentFee(), "кредит", "кредита", "кредитов") + ".";
  return t;
}

/* ════════ ПРОКАТ (блок VI) ════════ */
/* Что делает модуль проката — по его слову (fx) или по названию: браслет с номером держит в списках
   (без него статус не считается: «счётчики видят чужака»), жилет держит удар, стартовик — оружие в
   руках, пояс — ампулы обезболивающего на каждую смену. */
function rentFx(m) {
  if (m.fx) return m.fx;
  var t = (m.id || "") + " " + (m.n || "") + " " + (m.desc || "");
  if (/band|браслет|номерн/i.test(t)) return "id";
  if (/vest|жилет|брон|пластин|щит/i.test(t)) return "def";
  if (/starter|gun|стартов|пистолет|оружи|ствол/i.test(t)) return "gun";
  if (/belt|пояс|аптеч|ампул/i.test(t)) return "belt";
  return "regen";
}
function rentFee() { var r = S().rent; return r && r.mods ? r.mods.reduce(function (a, m) { return a + (m.fee || 0); }, 0) : 0; }
function rentHas(fx) { var r = G() && G().deep && G().deep.rent; return !!(r && r.mods && r.mods.some(function (m) { return m.fx === fx; })); }
/* Стартовик Полигона — настоящий ствол в руках, но прокатный: сдали модуль — ствол забирают. */
function rentGun(on) {
  var g = G(), base = LAB.WEAPONS.v6_starter ? "v6_starter" : null;
  if (!base) return;
  if (on) {
    if (g.weapons.some(function (w) { return w.rented; })) return;
    var w = LAB.makeWeapon(base, Math.max(1, LAB.foeLevel ? Math.round(LAB.Le(g.L) / 3) : 30), 0, 1);
    w.rented = 1; w.name = "прокатный " + w.name; g.weapons.push(w);
  } else {
    var i = -1; g.weapons.forEach(function (w, k) { if (w.rented) i = k; });
    if (i >= 0) { var wasCur = g.wi === i; g.weapons.splice(i, 1); if (wasCur || g.wi >= g.weapons.length) g.wi = 0; }
  }
}
function giveRent(D) {
  if (!D.rent || !D.rent.length) return;
  S().rent = { mods: D.rent.map(function (m) { return { id: m.id, n: m.n, desc: m.desc, fee: m.fee || 10, fx: rentFx(m) }; }) };
  S().rent.everId = rentHas("id");
  if (rentHas("gun")) rentGun(true);
}
function dropMod(m) { if (m && m.fx === "gun") rentGun(false); }
function rentCharge(L) {
  var s = S(), r = s.rent;
  if (!r || !r.mods || !r.mods.length) return;
  var D = Dd(L);
  if (!D || !D.rent || !D.rent.length) { r.mods.forEach(dropMod); r.mods = []; sayq("Прокатный комплект сдан на границе блока: за пределами Полигона он не числится."); return; }
  var fee = rentFee(), g = G();
  if (g.credits >= fee) {
    g.credits -= fee;
    var belt = rentHas("belt") ? " Ампулы пояса пополнены." : "";
    if (belt) g.inv.medkit_s = (g.inv.medkit_s || 0) + 1;
    sayq("Прокат: за смену списано " + fee + " " + pl(fee, "кредит", "кредита", "кредитов") + "." + belt);
    return;
  }
  r.mods.sort(function (a, b) { return b.fee - a.fee; });
  var m = r.mods.shift(); dropMod(m);
  addPts(-4);
  roll("Седьмой. Долг за прокат. Модуль «" + m.n + "» отозван.", 2500);
}
function returnRent(i) {
  var r = S().rent; if (!r || !r.mods[i]) return;
  var m = r.mods.splice(i, 1)[0]; dropMod(m);
  A("play", "craft_off"); say("Модуль «" + m.n + "» сдан в прокат. Плата за смену теперь — " + rentFee() + "." + (m.fx === "id" ? " Без браслета счётчики видят в вас чужака: статус в списках не считается, пока браслет не на руке." : ""));
}
function defBonus() { return rentHas("def") ? 4 + Math.min(6, status()) : 0; }

/* ════════ НОРМЫ ════════ */
function newNorm(L) {
  var D = Dd(L), s = S();
  if (!D || !D.norms || !D.norms.length) { s.norm = null; return; }
  var q = D.norms[h32("norm|" + L) % D.norms.length];
  var need = Math.max(1, Math.round((q.need || 5) * (1 + 0.1 * Math.max(0, s.st - 1))));
  s.norm = { id: q.id, n: q.n, task: q.task, kind: q.kind, need: need, have: 0, pay: q.pay || "кредиты", L: L, done: false };
  roll("Норма на смену: " + q.task + " Нужно: " + need + ". Оплата — " + (q.pay || "кредиты") + ".", 9000);
}
function normEv(kind, n) {
  var s = G() && G().deep, q = s && s.norm;
  if (!q || q.done || q.kind !== kind || q.L !== G().L) return;
  q.have = Math.min(q.need, q.have + (n || 1));
  if (q.have < q.need) { if (q.need - q.have <= 2) sayq("Норма смены: осталось " + (q.need - q.have) + "."); return; }
  q.done = true;
  var got = normPay(q);
  A("play", "term_ok");
  addPts(10 + q.need);
  roll("Норма «" + q.n + "» выполнена. Выдано: " + got + ". Списки довольны.", 400);
  journal("Норма смены выполнена: " + q.n + ".");
  if (LAB.ach) LAB.ach.ev("norm", 1);
}

/* Оплата нормы — тем, что объявлено при выдаче (q.pay): паёк, вода, батареи, антидоты, реактивы,
   стекло, скидка у Нижних; жетоны, талоны и кредиты — кредитами. За натуру — и половина кредитов. */
var PAY_GOODS = [
  { re: /паёк|паек|рацион|хлеб|еда/, id: "ration", n: function (q) { return Math.max(2, Math.round(q.need / 3)); }, w: ["сухпаёк", "сухпайка", "сухпайков"] },
  { re: /вод/, id: "water", n: function () { return 3; }, w: ["бутылка воды", "бутылки воды", "бутылок воды"] },
  { re: /антидот/, id: "antidote", n: function () { return 2; }, w: ["антидот", "антидота", "антидотов"] },
  { re: /реактив|реагент/, id: "reagent", n: function (q) { return Math.max(3, Math.round(q.need / 2)); }, w: ["реагент", "реагента", "реагентов"] },
  { re: /стекл/, id: "v9_glass", n: function () { return 2; }, w: ["лабораторное стекло", "лабораторных стекла", "лабораторных стёкол"] },
  { re: /аптеч|лекарств|медикамент/, id: "medkit_s", n: function () { return 2; }, w: ["аптечка", "аптечки", "аптечек"] },
  { re: /детал|лом/, id: "scrap", n: function (q) { return Math.max(3, Math.round(q.need / 2)); }, w: ["металлолом", "металлолома", "металлолома"] },
  { re: /чай/, id: "v10_tea", n: function () { return 2; }, w: ["пачка чая", "пачки чая", "пачек чая"] },
  { re: /бинт|повязк/, id: "bandage", n: function () { return 3; }, w: ["бинт", "бинта", "бинтов"] }
];
function normPay(q) {
  var g = G(), base = LAB.credits ? LAB.credits(18 + 4 * q.need, g.L, g.F) : 40, p = String(q.pay || "кредиты").toLowerCase(), out = [];
  var money = function (c) { g.credits += c; out.push(c + " " + pl(c, "кредит", "кредита", "кредитов")); };
  if (/кредит|жетон|талон|деньг|монет/.test(p)) { money(base); return out.join(" и "); }
  if (/батаре|заряд/.test(p)) {
    var b = Math.max(2, Math.round(q.need / 3)); g.ammo.energy = (g.ammo.energy || 0) + b;
    out.push(b + " " + pl(b, "энергобатарея", "энергобатареи", "энергобатарей"));
    money(Math.round(base / 2)); return out.join(" и ");
  }
  /* «допуск», «отметка в списках / в журнале» — шаг к статусу сверх обычного за норму */
  if (/допуск|отметк|списк|статус/.test(p) && !/кредит/.test(p)) { addPts(10); out.push("отметка в списках: десять очков к статусу"); money(Math.round(base / 2)); return out.join(" и "); }
  if (/скидк/.test(p)) { S().disc = g.L; out.push("скидка у Нижних до конца уровня"); money(Math.round(base / 2)); return out.join(" и "); }
  for (var i = 0; i < PAY_GOODS.length; i++) {
    var k = PAY_GOODS[i];
    if (!k.re.test(p) || !LAB.ITEMS[k.id]) continue;
    var n = k.n(q);
    g.inv[k.id] = (g.inv[k.id] || 0) + n; /* прямо в рюкзак: выдача нормы — не находка (не считается в нормы и испытания) */
    out.push(n + " " + pl(n, k.w[0], k.w[1], k.w[2]));
    money(Math.round(base / 2)); return out.join(" и ");
  }
  money(base);
  return out.join(" и ");
}

/* ════════ УРОВЕНЬ ════════ */
function onLevel(L, L0) {
  var s = S(), D = Dd(L);
  if (!D) return;
  /* уходя, норму прошлого уровня уже не сдать */
  if (s.norm && !s.norm.done && s.norm.L !== L) { addPts(-6, "Норма «" + s.norm.n + "» не выполнена."); s.norm = null; }
  if (s.st === 0) {
    s.st = 1; if (LAB.ach) LAB.ach.ev("status", 1);
    roll("Новый в списках. Испытуемый номер семь. Опять семь. Статус: низший. Нормы, испытания, допуск — по статусу.", 14000);
    journal("Внесён в списки Переклички: статус «низший».");
    if (D.rent && D.rent.length && !s.rent) { giveRent(D); later(function () { sayq("Выдан прокатный комплект: " + s.rent.mods.map(function (m) { return "«" + m.n + "»"; }).join(", ") + ". Плата — за каждую смену; список — в окне персонажа."); }, 22000); }
  } else if (L0 && L0 > 100) rentCharge(L);
  newNorm(L);
}
function later(fn, ms) { return gm().later ? gm().later(fn, ms) : setTimeout(fn, ms); }

/* ════════ ПРЕДМЕТЫ ════════ */
function itemFx(id, d, msg) {
  var fx = d.fx || {}, g = G(), s = S();
  if (fx.regen) { var r = Array.isArray(fx.regen) ? fx.regen : [2, fx.regen]; s.regen.push({ left: Math.max(1, Math.round(r[0] * 120)), hp: r[1] || 20 }); msg.push("Регенерация отложена: через " + r[0] + " " + pl(r[0], "минуту", "минуты", "минут") + " — плюс " + (r[1] || 20) + " к здоровью."); }
  if (fx.stitch) { if (g.st.bleed) { g.st.bleed = 0; msg.push("Рана зашита, кровь остановлена."); } else msg.push("Шов наложен впрок: раны нет."); }
  if (fx.antimut) { if (LAB.chem && LAB.chem.cutMut) { LAB.chem.cutMut(40); msg.push(LAB.chem.mutLine ? LAB.chem.mutLine() : "Мутация отступила."); } else msg.push("Антимутаген введён."); }
  if (fx.memory) later(memory, 900);
}
function memory() {
  var D = Dd(), s = S(), n = LAB.blockOf(G().L);
  var list = (D && D.memories) || [];
  if (!list.length) { say("Вспышки не случилось: в этой глубине нечего вспоминать."); return; }
  var i = (s.mem[n] || 0) % list.length; s.mem[n] = i + 1;
  var m = list[i];
  A("play", "ev_far_door");
  UIx("note", "Вспышка памяти: " + m.t, m.x, null, { closeLabel: "Очнуться" });
  journal("Вспышка памяти: " + m.t + ".");
}

/* Вещи глубин, что применяют не из рюкзака, а на месте: страховочную сбрую пристёгивают у ствола
   среза (она не тратится). true — вещь обработана здесь, и рюкзак её не списывает. */
function useSpecial(id, d) {
  if (id === "v6_harness" || (d && d.harness)) { say((d && d.n ? d.n : "Страховочная сбруя") + " нужна у вертикального ствола среза: там вы её пристегнёте, и она останется с вами."); return true; }
  return false;
}
/* Сон в капсуле глубин бывает вспышкой памяти Нижних (deep.memories блока) — пока они не кончились. */
function memoryDream() {
  var g = G(), n = LAB.blockOf(g.L), D = Dd(), s = S();
  var list = (D && D.memories) || [];
  var i = s.mem[n] || 0;
  if (!list.length || i >= list.length || Math.random() < 0.5) return null;
  s.mem[n] = i + 1;
  return { id: "mem" + n + ":" + i, t: list[i].t, x: list[i].x, mood: "strange" };
}

/* ════════ КАРТОЧКИ ТВАРЕЙ ════════ */
var cardT = 0;
function cards() {
  var D = Dd(), s = S(), now = Date.now();
  if (!D || !D.cards || status() < 2 || now - cardT < 20000 || !LAB.combat || !LAB.combat.visibleFoes) return;
  var vis = LAB.combat.visibleFoes(8) || [];
  for (var i = 0; i < vis.length; i++) {
    var t = vis[i].type, c = D.cards[t];
    if (c && !s.cards[t]) { s.cards[t] = 1; cardT = now; roll("Справка по списку: " + c); return; }
  }
}

/* ════════ ИСПЫТАНИЯ ════════ */
var trial = null; /* идёт сейчас: { o, def, kind, left, ids, ok, fail } */
function trialDef(o) { var D = Dd(); return D && D.trials ? D.trials.filter(function (q) { return q.id === o.trial; })[0] : null; }
function trialKey(o) { var g = G(); return g.L + "-" + g.F + "-" + o.id; }
function trialMenu(o) {
  var q = trialDef(o), s = S(), key = trialKey(o);
  if (!q) { say("Стенд обесточен."); return true; }
  if (s.trials[key]) { say("Испытание «" + q.n + "» пройдено: стенд погашен, табло показывает вашу отметку."); return true; }
  var need = q.rank || 1;
  UIx("menu", "Испытательный стенд: «" + q.n + "»", [
    { label: "Слушать условие", keep: true, fn: function () { say(q.desc, { read: true }); } },
    { label: status() >= need ? "Начать испытание" : "Начать испытание — нужен статус «" + stName(need) + "»", fn: function () {
      if (status() < need) { LAB.UI.error(); say("Стенд не принимает: допуск к испытанию — от статуса «" + stName(need) + "». У вас — «" + stName(status()) + "»."); return; }
      if (trial) { say("Уже идёт испытание."); return; }
      if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Рядом враги: стенд не запускает испытание, пока камера не тиха."); return; }
      UIx("closeAll"); countdown(o, q);
    } },
    { label: "Осмотреть", fn: function () { say(LAB.OBJ.trialst.desc); } }
  ]);
  return true;
}
function countdown(o, q) {
  var n = 10;
  say("Испытание «" + q.n + "». Отсчёт.", { prio: "event" });
  var step = function () {
    if (!gm().entered || G().dead) return;
    if (n <= 0) { startTrial(o, q); return; }
    A("play", n <= 3 ? "mine_beep" : "term_beep");
    say(String(n), { interrupt: true });
    n--; later(step, 900);
  };
  later(step, 1400);
}
function startTrial(o, q) {
  var g = G(), k = q.kind;
  trial = { o: o, q: q, kind: k, left: 0, ids: [], L: g.L, F: g.F, x: g.x, y: g.y };
  A("play", "gate_seal");
  if (k === "puzzle") {
    var kinds = trialPuzzles(), pk = kinds[h32(o.id + "|" + g.L + "|" + g.F) % kinds.length];
    trial = null;
    LAB.puzzles.open(pk, 1 + (h32("tr|" + o.id + "|" + g.L) % 99991) + 7919 * ((S().trials["n" + trialKey(o)] || 0)), function (ok, away) {
      if (!ok && away) return;
      if (!ok) S().trials["n" + trialKey(o)] = (S().trials["n" + trialKey(o)] || 0) + 1;
      finish(o, q, ok);
    }, { title: "Испытание «" + q.n + "»", diff: Math.min(2, o.diff || 0) });
    return;
  }
  if (k === "survive" || k === "chase") {
    var lev = LAB.LEVELS[g.L], pool = (lev && lev.foes || []).filter(function (f) { var b = LAB.FOES[f]; return b && b.beh.indexOf("stationary") < 0 && b.beh.indexOf("camera") < 0; });
    var n = k === "chase" ? 1 : 3 + (o.diff || 0);
    for (var i = 0; i < n && pool.length && LAB.combat && LAB.combat.spawnFoe; i++) {
      var c = roomCell(o);
      if (!c) continue;
      var f = LAB.combat.spawnFoe(pool[(h32(o.id + i) + i) % pool.length], c[0], c[1], { trial: 1, state: "hunt", flee: k === "chase" });
      if (f) trial.ids.push(f.id);
    }
    if (!trial.ids.length) { trial = null; say("Стенд щёлкает и гаснет: выпустить в камеру некого. Испытание отложено."); return; }
    trial.left = k === "chase" ? 120 : 180;
    say(k === "chase" ? "Створки открылись: в камеру выпущена цель. Догнать и остановить — за минуту." : "Створки открылись: в камеру выпущены противники. Выстоять — полторы минуты, или пока не останется никого.");
    return;
  }
  if (k === "find") {
    var cell = roomCell(o);
    if (!cell) { trial = null; say("Стенд гаснет: жетон спрятать негде."); return; }
    var it = { kind: "trialtoken", id: "tt" + o.id, x: cell[0], y: cell[1], n: 1 };
    var fs = CUR().fs; fs.drops = fs.drops || []; fs.drops.push(it);
    trial.left = 120;
    say("Где-то в камере спрятан жетон испытания: он тихо тикает. Найти за минуту.");
    return;
  }
  if (k === "silent") { trial.left = 60; say("Испытание тишины: полминуты — ни выстрела, ни бега, ни удара. Стенд слушает."); return; }
  if (k === "disarm") {
    trial = null;
    LAB.mini.relays(5 + (o.diff || 0), function (ok) { if (!ok && gm().walkedAway && gm().walkedAway()) return; finish(o, q, ok); }, { title: "Разминирование: схема заряда", seed: h32(o.id + "|d") });
    return;
  }
  trial = null; finish(o, q, true);
}
/* Свободная клетка в помещении стенда — подальше от него. */
function roomCell(o) {
  var fl = CUR().fl, rm = fl.rooms[o.room], best = null, bd = -1, W = LAB.W, g = G();
  if (!rm) return null;
  for (var y = rm.y0; y <= rm.y1; y++) for (var x = rm.x0; x <= rm.x1; x++) {
    if (!gm().passable(x, y) || fl.objAt[y * W + x] || (x === g.x && y === g.y)) continue;
    var d = Math.abs(x - o.x) + Math.abs(y - o.y) + (h32(o.id + ":" + x + ":" + y) % 3);
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function trialPuzzles() {
  var all = LAB.puzzles ? LAB.puzzles.KINDS.filter(function (k) { return LAB.puzzles.hasDiff(k); }) : [];
  return all.length ? all : ["breaker"];
}
function finish(o, q, ok) {
  var s = S(), g = G();
  trial = null;
  if (!ok) { A("play", "term_err"); roll("Испытание «" + q.n + "» не пройдено. Отметка в списках — ноль. Стенд ждёт.", 300); addPts(-2); return; }
  s.trials[trialKey(o)] = 1;
  A("play", "term_ok"); if (LAB.UI && LAB.UI.fanfare) LAB.UI.fanfare();
  var pts = 14 + 6 * (q.rank || 1) + 4 * (o.diff || 0), cr = LAB.credits ? LAB.credits(30 + 15 * (o.diff || 0), g.L, g.F) : 50;
  g.credits += cr;
  if (gm().gainXP) gm().gainXP(30 + 15 * (o.diff || 0));
  addPts(pts);
  roll("Испытание «" + q.n + "» пройдено. Отметка внесена. Премия — " + cr + " " + pl(cr, "кредит", "кредита", "кредитов") + ".", 300);
  journal("Испытание пройдено: " + q.n + ".");
  if (LAB.ach) LAB.ach.ev("trial", 1);
  if (gm().autosaveSoon) gm().autosaveSoon();
}
function trialTick() {
  if (!trial) return;
  var g = G();
  if (g.L !== trial.L || g.F !== trial.F) { trial = null; return; }
  if (trial.kind === "silent") {
    if ((g.noise || 0) >= 4) { var t0 = trial; finish(t0.o, t0.q, false); return; }
  }
  if (trial.kind === "survive" || trial.kind === "chase") {
    var alive = (LAB.combat.foes() || []).filter(function (f) { return trial.ids.indexOf(f.id) >= 0 && !f.dead; }).length;
    if (!alive) { var t1 = trial; finish(t1.o, t1.q, true); return; }
  }
  if (trial.left > 0 && --trial.left <= 0) {
    var t2 = trial;
    finish(t2.o, t2.q, t2.kind === "survive" || t2.kind === "silent");
  } else if (trial.left === 20) sayq("Десять секунд.");
}

/* ════════ ТЕНЕВОЙ ТОРГОВЕЦ ════════ */
function marketMenu(o) {
  var D = LAB.DEEP && LAB.DEEP[o.market || LAB.blockOf(G().L)], g = G();
  if (!D || !D.market) { say("Здесь пусто."); return true; }
  var m = D.market, px = "v" + (o.market || LAB.blockOf(g.L)) + "_";
  var goods = Object.keys(LAB.ITEMS).filter(function (k) { var d = LAB.ITEMS[k]; return k.indexOf(px) === 0 && d.kind !== "part" && d.price; }).slice(0, 10);
  ["medkit_l", "stim", "antidote"].forEach(function (k) { if (LAB.ITEMS[k] && goods.indexOf(k) < 0) goods.push(k); });
  var k0 = (gm().priceK ? gm().priceK() : 1) * 1.35;
  var items = [{ label: "Поговорить", keep: true, fn: function () { var st = gm().objState(o); var i = (st.t || 0) % m.lines.length; st.t = i + 1; say(m.n + ": «" + m.lines[i] + "»"); } }];
  goods.forEach(function (id) {
    var d = LAB.ITEMS[id], p = Math.max(1, Math.round(d.price * k0));
    items.push({ label: d.n + " — " + p + " " + pl(p, "кредит", "кредита", "кредитов"), keep: true, fn: function () { gm().buy(id, p); } });
  });
  items.push({ label: "Уйти", fn: function () {} });
  UIx("menu", m.n + ": вне надзора. У вас " + g.credits + " " + pl(g.credits, "кредит", "кредита", "кредитов"), items);
  return true;
}

/* ════════ СРЕЗ ════════ */
function cutDef(o) { var D = Dd(); return D && D.cuts ? D.cuts.filter(function (c) { return c.id === o.cut; })[0] : null; }
function harness() {
  var g = G();
  if ((g.inv.v6_harness || 0) > 0) return true;
  return !!(gm().armorSpecial && gm().armorSpecial("harness"));
}
function cutMenu(o) {
  var c = cutDef(o) || { n: "Срез", desc: "Старый короткий путь вниз.", ride: "Спуск идёт долго, в темноте и гуле." };
  var st = gm().objState(o), g = G(), drop = o.to - g.L;
  var needT = { none: "открыт", power: "лебёдка обесточена: нужна энергобатарея", puzzle: "пульт заперт задачей", crank: "ручная лебёдка: долго и шумно", harness: "вертикальный ствол: нужна страховочная сбруя", code: "кодовый замок: код — в записке этого этажа" }[o.need] || "";
  var items = [
    { label: "Осмотреть", keep: true, fn: function () { say(c.n + ". " + c.desc + " Уводит вниз — далеко, много уровней. " + (st.open ? "Готов к спуску." : cap(needT) + ".")); } },
    { label: st.open ? "Спуститься срезом" : "Открыть срез — " + needT, fn: function () { if (st.open) ride(o, c); else openCut(o, c, st); } },
    { label: "Отойти", fn: function () {} }
  ];
  UIx("menu", c.n, items);
  return true;
}
function cap(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
function openCut(o, c, st) {
  var g = G();
  var ok = function () { st.open = true; A("play", "term_ok"); say(c.n + ": открыт. Спуск готов."); cutMenu(o); };
  switch (o.need) {
    case "none": ok(); return;
    case "power":
      if (!(g.ammo.energy > 0)) { LAB.UI.error(); say("Лебёдке нужна энергобатарея, а у вас их нет."); return; }
      g.ammo.energy--; A("play", "pos_pulse"); ok(); return;
    case "harness":
      if (!harness()) { LAB.UI.error(); say("Ствол вертикальный: без страховочной сбруи туда не спуститься. Сбрую продают на Полигоне; бывает и броня со страховкой."); return; }
      ok(); return;
    case "code":
      LAB.mini.code(function (code) { if (!code) return; A("play", "keypad"); if (code === o.code) ok(); else { A("play", "code_fail"); say("Неверный код."); if (LAB.combat) LAB.combat.noise(5); } }, { title: c.n });
      return;
    case "puzzle":
      var kinds = trialPuzzles(), pk = kinds[h32(o.id + "|cut") % kinds.length];
      LAB.puzzles.open(pk, (o.seed || 1) + 7919 * (st.pzN || 0), function (res, away, fresh) {
        if (!res && away) { if (fresh) st.pzN = (st.pzN || 0) + 1; return; }
        if (!res) { st.pzN = (st.pzN || 0) + 1; say("Пульт среза сбрасывает задачу и загорается снова — с новой."); return; }
        ok();
      }, { title: c.n, diff: Math.min(2, 1 + (LAB.blockOf(g.L) >= 10 ? 1 : 0)) });
      return;
    case "crank":
      if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Рядом враги: крутить лебёдку под ударом нельзя."); return; }
      say("Вы крутите ручную лебёдку. Цепь лязгает на весь этаж.");
      var n = 0, tick = function () {
        if (!gm().entered || G().dead || G().L !== g.L) return;
        if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Вас отвлекли: лебёдка встала на середине."); return; }
        A("play", "gate_knock"); if (LAB.combat) LAB.combat.noise(8);
        if (++n >= 6) { ok(); return; }
        later(tick, 1500);
      };
      later(tick, 800);
      if (LAB.oko && LAB.oko.react) LAB.oko.react("alarm");
      return;
  }
  ok();
}
function ride(o, c) {
  var g = G(), L0 = g.L, L1 = o.to;
  if (!(L1 > L0)) { say("Срез обрывается в завал: дальше пути нет."); return; }
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) { say("Рядом враги: в срез под ударом не спуститься."); return; }
  UIx("closeAll");
  A("play", "elev_ride");
  gm().paused = true; gm().descending = true;
  say((c.ride || "Спуск идёт долго, в темноте и гуле.") + " Счёт уровней «Эхо» теряет где-то на середине.", { prio: "event" });
  later(function () {
    gm().paused = false;
    descendTo(L1, L0);
  }, 6000);
}
/* Спуск сразу на много уровней (срез): как шлюзом, но мимо всех уровней между. */
function descendTo(L1, L0) {
  var g = G(), gm0 = gm();
  if (g.L !== L0) return;
  gm0.forgetLevel(L0);
  var lost = g.quests.filter(function (q) { return !q.done && q.type === "deep" && q.tL >= L0 && q.tL < L1; });
  lost.forEach(function (q) { q.done = true; q.failed = true; });
  g.quests = g.quests.filter(function (q) { return q.done || q.type === "main" || q.L !== L0 || q.cross; });
  gm0.descending = false;
  gm0.enterFloor(L1, 1, "gatedown");
  g.checkpoint = { L: g.L, F: 1, x: g.x, y: g.y };
  A("gateSeal");
  sayq("Срез кончается у шлюза. Уровень " + g.L + ": " + (LAB.LEVELS[g.L] ? LAB.LEVELS[g.L].name : "") + ". Путь наверх закрыт.");
  lost.forEach(function (q) { sayq("Доклад для " + q.giverName + " не передан: срез увёл вас мимо уровня " + q.tL + "."); });
  if (gm0.gainXP) gm0.gainXP(80);
  if (LAB.ach) LAB.ach.ev("cut", 1);
  journal("Срезом вниз — на уровень " + g.L + ": " + (LAB.LEVELS[g.L] ? LAB.LEVELS[g.L].name : "") + ". Путь наверх закрыт.");
  gm0.mainQuest();
  UIx("levelBanner");
  gm0.autosave();
}
function cutNote(it, h) {
  return { t: "Записка у среза", x: "На клочке картона карандашом: «" + (it.cutN || "Срез") + ". Код замка — " + it.code.split("").join(" ") + ". Не крутить без страховки». Ниже другой рукой: «Перекличке не говорить»." };
}

/* ════════ ДОПУСК ════════ */
function rankText(lk) { return "дверь с допуском: от статуса «" + stName(lk.rank) + "»"; }
function rankBlock(lk) { return status() >= lk.rank ? "" : "Допуск ниже нужного: дверь открывается от статуса «" + stName(lk.rank) + "», у вас — «" + stName(status()) + "»."; }
/* Хранилище по допуску (deep_floor.js, rankLock): шкафчик, ящик или стол в комнате с допуском,
   куда можно войти и так, — открывается от статуса; силой и инструментом замок допуска не взять. */
function boxBlock(o) { return !o || !o.rankLock || status() >= o.rankLock ? "" : "Замок по допуску: открывается от статуса «" + stName(o.rankLock) + "», у вас — «" + stName(status()) + "»."; }
/* Оружие по допуску: стреляет только у того, чей статус не ниже. */
var rankSaid = 0;
function weaponOk(w) {
  var g = G(), d = w && (LAB.WEAPONS[w.base] || LAB.WEAPONS[w.id]);
  if (!d || !d.rank || !g || status() >= d.rank) return true;
  var now = Date.now();
  if (now - rankSaid > 3000) { rankSaid = now; A("play", "w_empty"); say("«" + d.n + "» — оружие по допуску: спуск заблокирован до статуса «" + stName(d.rank) + "»."); }
  return false;
}


/* ════════ ОКО НИЖЕ ИСТОКА НЕ СЛЫШИТ ════════
   Ниже сотого уровня машины, камеры, блокировки и тревоги — Переклички, а не ОКО: в словах игры
   (речь и пункты меню на этаже) «ОКО» становится Перекличкой — в нужном падеже, и глагол прошедшего
   времени — в женском роде («Перекличка заметила»). Записки, книги и документы читаются как есть:
   там ОКО — память о верхнем мире. Настройки (голос ОКО и прочее) не трогаются. */
var GEN = { "для": 1, "от": 1, "у": 1, "до": 1, "из": 1, "без": 1, "против": 1, "вне": 1, "мимо": 1, "ради": 1, "после": 1, "возле": 1, "около": 1, "кроме": 1, "среди": 1, "вместо": 1, "из-за": 1, "из-под": 1, "насчёт": 1, "внутри": 1, "вокруг": 1 };
var DAT = { "к": 1, "ко": 1 };
var PREP = { "о": 1, "об": 1, "обо": 1, "при": 1 };
var INS = { "с": 1, "со": 1, "над": 1, "перед": 1, "между": 1 };
var CONJ = { "и": 1, "а": 1, "но": 1, "что": 1, "пока": 1, "если": 1, "когда": 1, "чем": 1, "как": 1, "или": 1, "ни": 1, "да": 1, "чтобы": 1, "будто": 1, "раз": 1, "где": 1, "там": 1, "тут": 1, "здесь": 1, "теперь": 1, "уже": 1, "ещё": 1, "сразу": 1, "тогда": 1, "даже": 1, "само": 1, "ли": 1, "же": 1, "не": 1, "это": 1, "вот": 1, "видимо": 1, "кажется": 1, "значит": 1, "пусть": 1, "только": 1, "лишь": 1, "снова": 1, "опять": 1, "потом": 1, "сейчас": 1, "наверняка": 1, "точно": 1, "почему-то": 1, "зато": 1, "иначе": 1, "ведь": 1 };
var NOUN = { "пугал": 1, "терминал": 1, "терминала": 1, "сигнал": 1, "сигнала": 1, "настил": 1, "настила": 1, "узел": 1, "узла": 1, "журнал": 1, "журнала": 1, "канал": 1, "канала": 1, "провал": 1, "провала": 1, "правило": 1, "правила": 1, "пугало": 1, "пугала": 1, "материал": 1, "персонал": 1, "персонала": 1, "арсенал": 1, "арсенала": 1, "финал": 1, "зал": 1, "зала": 1, "совет": 1, "совета": 1, "ответ": 1, "ответа": 1, "отчёт": 1, "отчёта": 1, "счёт": 1, "учёт": 1, "учёта": 1, "запрет": 1, "запрета": 1, "кабинет": 1, "кабинета": 1, "предмет": 1, "секрет": 1, "бюджет": 1, "щит": 1, "щита": 1, "лимит": 1, "лимита": 1, "кредит": 1, "приют": 1, "маршрут": 1, "маршрута": 1, "отдел": 1, "отдела": 1, "раздел": 1, "предел": 1, "прицел": 1, "прицела": 1, "пульт": 1, "пульта": 1, "скелет": 1, "портрет": 1, "ракурс": 1, "гул": 1, "гула": 1, "сбой": 1, "сбоя": 1, "аппарат": 1, "аппарата": 1, "автомат": 1, "автомата": 1, "объект": 1, "проект": 1, "агрегат": 1, "контакт": 1, "конфликт": 1, "пакет": 1, "интеллект": 1, "ритм": 1, "алгоритм": 1, "механизм": 1, "идеал": 1, "пост": 1, "поста": 1, "сеть": 1, "часть": 1, "власть": 1, "память": 1, "печать": 1, "область": 1, "тетрадь": 1, "ведомость": 1, "должность": 1, "скорость": 1, "смерть": 1, "каратели": 1, "патрули": 1, "турели": 1, "цели": 1, "модели": 1, "сети": 1, "щели": 1, "двери": 1, "дети": 1, "ответ": 1, "совет": 1, "привет": 1, "запрет": 1, "отчёт": 1, "учёт": 1, "счёт": 1, "лист": 1 };
var DATV = /^(шепч|шепну|слива|слил|донос|разреш|сообщ|меш|помог|помоч|подска|доклад|доложи|верн|отда|служ|подчин|угод|грози|показ|скажи|сказа|говор|ответ|отвеч|навред|сда|переда|дове|доне|подда|напомин|звон|пиш|напиш|нрав|понрав|принадлеж)/;
/* глаголы, после которых ОКО в конце фразы — подлежащее («…, — говорит ОКО.») */
var INVERT = { "ведёт": 1, "открывает": 1, "разрешит": 1, "принимает": 1, "присылает": 1, "говорит": 1, "произносит": 1, "повторяет": 1, "продолжает": 1, "добавляет": 1, "объявляет": 1, "решает": 1, "думает": 1, "делает": 1, "слушает": 1, "молчит": 1, "ждёт": 1, "считает": 1, "знает": 1, "видит": 1, "слышит": 1, "сказало": 1, "ответило": 1, "сообщило": 1, "промолчало": 1, "напомнило": 1, "добавило": 1, "повторило": 1 };
/* глаголы речи: перед ОКО они почти всегда при подлежащем («Теперь говорит ОКО целиком») */
var SPEECH = { "говорит": 1, "произносит": 1, "объявляет": 1, "повторяет": 1, "вещает": 1, "диктует": 1 };
/* наречия между подлежащим и глаголом («ОКО часто шлёт») */
var ADV = { "часто": 1, "редко": 1, "обычно": 1, "всегда": 1, "никогда": 1, "иногда": 1, "тогда": 1, "давно": 1, "долго": 1, "быстро": 1, "медленно": 1, "тихо": 1, "громко": 1, "охотно": 1, "неохотно": 1, "молча": 1, "сначала": 1, "потом": 1, "первым": 1, "первое": 1, "само": 1, "лично": 1 };
var SKIP = { "не": 1, "уже": 1, "ещё": 1, "сразу": 1, "тут": 1, "же": 1, "снова": 1, "опять": 1, "само": 1, "всё": 1, "ничего": 1, "никого": 1, "больше": 1, "временно": 1, "тоже": 1, "так": 1, "и": 1, "его": 1, "их": 1, "вас": 1, "нас": 1, "это": 1, "почти": 1, "наконец": 1, "вдруг": 1, "явно": 1, "точно": 1, "наверняка": 1, "вовсе": 1, "давно": 1, "только": 1, "лишь": 1, "почему-то": 1, "здесь": 1, "там": 1, "сюда": 1, "туда": 1, "вам": 1, "нам": 1, "вами": 1, "никогда": 1 };
var NOTVERB = { "тепло": 1, "светло": 1, "мало": 1, "смело": 1, "зло": 1, "бело": 1, "тяжело": 1, "весело": 1, "тело": 1, "число": 1, "масло": 1, "крыло": 1, "стекло": 1, "сало": 1, "село": 1, "кило": 1, "дело": 1, "пошло": 0 };
function isVerb(w) { return !NOUN[w] && /(ть|ться|ешь|ишь|ает|яет|еет|ует|ет|ит|ёт|ют|ят|ут|ал|ял|ил|ел|ыл|ула|ала|яла|ила|ела|йте)$/.test(w); }
function pastN(w) { var l = w.toLowerCase(); return !NOTVERB[l] && /(ло|лось)$/.test(l); }
function presV(w) { return /^(видит|слышит|знает|шлёт|ждёт|держит|ищет|присылает|пришлёт|ставит|считает|помнит|заметит|увидит|узнает|услышит|вернёт|отзовёт|решит|снимет|поднимет|сотрёт|может|будет|готовит|следит|смотрит|отметит|пошлёт|отправит|закроет|откроет|запустит|перезапустит|отрежет|не|уже|ещё|сразу|снова|само|всё|тут)$/.test(w.toLowerCase()); }
function verbFem(w) { if (/лось$/.test(w)) return w.replace(/лось$/, "лась"); if (/ло$/.test(w)) return w.replace(/ло$/, "ла"); return w; }
function rename(t) {
  if (typeof t !== "string" || t.indexOf("ОКО") < 0) return t;
  var tok = t.split(/([А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?)/);
  for (var i = 1; i < tok.length; i += 2) {
    if (tok[i] !== "ОКО") continue;
    var gap = tok[i - 1] || "", pw = i >= 3 && /^[  ]+$/.test(gap) ? tok[i - 2] : null, pl = pw ? pw.toLowerCase() : "";
    var nx = i + 2 < tok.length && /^[  ]+$/.test(tok[i + 1]) ? tok[i + 2] : null;
    /* подлежащее: дальше глагол («ОКО не заметило», «ОКО видит») */
    var subj = false;
    for (var j = i + 2, hop = 0; j < tok.length && hop < 4; j += 2, hop++) {
      if (!/^[  ]+$/.test(tok[j - 1])) break;
      if (pastN(tok[j])) { subj = true; break; }
      if (presV(tok[j]) && !SKIP[tok[j].toLowerCase()]) { subj = true; break; } /* «ОКО часто шлёт» — через наречие */
      if (!SKIP[tok[j].toLowerCase()] && !ADV[tok[j].toLowerCase()]) { if (hop === 0 && nx && presV(nx) && !SKIP[nx.toLowerCase()]) subj = true; break; }
    }
    var form = "Перекличка";
    /* «…, — говорит ОКО.»: глагол речи прямо перед словом, а за ним — конец фразы или тире: ОКО — подлежащее */
    var endAfter = i + 1 >= tok.length || /^\s*([.,!?;:…»)]|—|–|-\s)/.test(tok[i + 1] || "") || (i + 2 >= tok.length);
    if (pw && ((INVERT[pl] && endAfter) || SPEECH[pl])) subj = true;
    if (pl === "есть") subj = true;
    if (pw && GEN[pl]) form = "Переклички";
    else if (pl === "нет") form = "Переклички";
    else if (pw && DAT[pl]) form = "Перекличке";
    else if (pw && PREP[pl]) form = "Перекличке";
    else if (pw && INS[pl]) form = "Перекличкой";
    else if (subj) form = "Перекличка";
    else if (pw && !CONJ[pl] && isVerb(pl)) form = DATV.test(pl) ? "Перекличке" : "Перекличку";
    else if (pw && pl.length >= 7 && /(ан|ян|ен|ён)$/.test(pl)) form = "Перекличкой";
    else if (pw && !CONJ[pl] && !/[.!?:;«—(]\s*$/.test(gap)) form = "Переклички";
    tok[i] = form;
    if (form === "Перекличка") for (var k = i + 2, h2 = 0; k < tok.length && h2 < 4; k += 2, h2++) {
      if (!/^[  ]+$/.test(tok[k - 1])) break;
      if (pastN(tok[k])) { tok[k] = verbFem(tok[k]); break; }
      if (/^(довольно|уверено|занято|готово|обязано|должно|вынуждено|встревожено|насторожено|ослеплено|оглушено|согласно)$/.test(tok[k].toLowerCase())) { tok[k] = tok[k].replace(/о$/, "а"); break; }
      if (!SKIP[tok[k].toLowerCase()]) break;
    }
  }
  return tok.join("");
}
LAB.deepRename = rename;
function deepNow() { var g = G(); return !!g && g.L > 100 && !!(gm() && gm().entered); }
(function () {
  var say0 = LAB.say;
  if (!say0 || say0._deep) return;
  LAB.say = function (t, o) { if (typeof t === "string" && t.indexOf("ОКО") >= 0 && !(o && (o.read || o.raw)) && deepNow()) t = rename(t); return say0.call(this, t, o); };
  LAB.say._deep = 1;
})();
var SETTINGS = /настро|голос|звук|громкост|речь|синтезатор|клавиш|жест|руководств/i;
function wrapUI() {
  var u = LAB.ui;
  if (!u || !u.menu || u.menu._deep) return;
  var menu0 = u.menu;
  var fix = function (title, items) {
    if (!deepNow() || SETTINGS.test(String(title || ""))) return title;
    (items || []).forEach(function (it) { if (it && typeof it.label === "string") it.label = rename(it.label); });
    return rename(title);
  };
  u.menu = function (title, items, opts) {
    title = fix(title, items);
    if (opts && typeof opts.rebuild === "function" && !opts.rebuild._deep) {
      var rb = opts.rebuild;
      opts.rebuild = function () { var its = rb.apply(this, arguments); fix(title, its); return its; };
      opts.rebuild._deep = 1;
    }
    return menu0.call(this, title, items, opts);
  };
  u.menu._deep = 1;
}

/* ════════ ОБЪЕКТЫ И ТАКТ ════════ */
function objMenu(o) {
  if (!o) return false;
  if (o.type === "trialst") return trialMenu(o);
  if (o.type === "srez") return cutMenu(o);
  if (o.type === "dtrader") return marketMenu(o);
  return false;
}
function got(it) {
  if (!deepL(G().L)) return;
  if (it.kind === "sample") normEv("samples", 1);
  else if (it.kind === "item" && LAB.ITEMS[it.item] && LAB.ITEMS[it.item].kind === "part") normEv("parts", it.n || 1);
  else if (it.kind === "trialtoken" && trial && trial.kind === "find") { var t = trial; finish(t.o, t.q, true); }
}
function onKill(f) { if (deepL(G().L)) normEv("kills", 1); }
var tickN = 0;
function tick() {
  var g = G();
  if (!g || g.dead || !gm().entered) return;
  if (!deepL(g.L)) return;
  wrapUI();
  var s = S();
  if (s.lastL !== g.L) { var L0 = s.lastL; s.lastL = g.L; onLevel(g.L, L0); }
  tickN++;
  if (s.regen.length) s.regen = s.regen.filter(function (r) { if (--r.left > 0) return true; var b = g.hp; g.hp = Math.min(g.hpMax, g.hp + r.hp); sayq("Отложенная регенерация: здоровье плюс " + (g.hp - b) + "."); return false; });
  if (rentHas("regen") && tickN % 20 === 0 && g.hp < g.hpMax) g.hp = Math.min(g.hpMax, g.hp + 1);
  if (tickN % 6 === 0) cards();
  trialTick();
}
function visit() { if (deepL(G().L)) normEv("visit", 1); }
function repaired() { if (deepL(G().L)) normEv("repair", 1); }

LAB.OBJ.trialst = { n: "Испытательный стенд", icon: "🏁", desc: "Стенд испытательной камеры: табло, створки и динамик, через который отсчитывают от десяти. Испытание проходят один раз; отметку вносят в списки Переклички." };
LAB.OBJ.srez = { n: "Срез", icon: "⬇️", desc: "Старый короткий путь вниз: ствол, лебёдка или аварийный спуск. Уводит сразу на много уровней ниже — мимо всего, что между." };
LAB.OBJ.dtrader = { n: "Теневой торговец", icon: "🕯️", desc: "Человек в сумраке, вне надзора: продаёт то, что в списках не числится, — дороже, но без статуса и без вопросов." };
LAB.deepSys = {
  NAMES: NAMES, status: status, stName: stName, addPts: addPts, statusLine: statusLine, priceF: priceF,
  objMenu: objMenu, itemFx: itemFx, got: got, onKill: onKill, tick: tick, visit: visit, repaired: repaired,
  rankText: rankText, rankBlock: rankBlock, boxBlock: boxBlock, weaponOk: weaponOk, defBonus: defBonus, rentHas: rentHas, returnRent: returnRent,
  cutNote: cutNote, descendTo: descendTo, harness: harness, rename: rename, wrapUI: wrapUI, useSpecial: useSpecial, memoryDream: memoryDream,
  _trial: function () { return trial; }, _finish: finish, _onLevel: onLevel
};
})();

/* Аномальные обследования нижних блоков. План хранит только номера постов:
   геометрия, двери, враги и вес остаются в общих системах игры. */
(function () {
"use strict";
var LAB = typeof window !== "undefined" ? window.LAB : globalThis.LAB;
function gm() { return LAB.game; }
function G() { return gm().G; }
function C() { return gm().CUR; }
function say(t) { LAB.say(t); }
function menu(t, rows) { if (LAB.ui) LAB.ui.menu(t, rows); }
function back() { return { label: "Назад", close: true, fn: function () {} }; }
function info(t) { return { label: t, info: true, keep: true, fn: function () {} }; }
function close() { if (LAB.ui && LAB.ui.closeTop) LAB.ui.closeTop(true); }
function save() { gm().autosaveSoon(); }
function cue(id, o, rate, gain) {
  var a = LAB.atmos;
  if (!a) return;
  var opts = { rate: rate || 1, gain: gain == null ? 0.82 : gain, prio: gain == null ? 3 : 2 };
  if (o) a.at("rift_" + id, o.x, o.y, opts);
  else a.play("rift_" + id, opts);
}

/* Название, наблюдение, опорная частота, вымышленная расходная матрица.
   Матрицы меняют рецепт, контрольную отметку, массу пробы и звук зонда. */
var TRACES = [
  ["Вторая стрелка", "На отключённом приборе стрелка идёт следом за вашей рукой. Поверните запястье — она догонит.", 183, { gel: 1, reagent: 2 }],
  ["Чёрная бахрома", "Край перчатки темнеет в воздухе. Волокна со стороны прибора приподнимаются, как от чужого дыхания.", 209, { gel: 2, wire: 1 }],
  ["Отрицательный слепок", "В чашке слышно, как кто-то перекладывает сухие обломки. На дне сохраняется вмятина от пустоты.", 238, { reagent: 1, scrap: 2 }],
  ["Пустая лента", "Самописец тянет чистую бумагу. Каждый раз, когда останавливается, за стенкой кто-то сглатывает.", 262, { reagent: 3, chip: 1 }],
  ["Стеклянный пульс", "Два стекла сдвигаются в оправе точно в такт вашему пульсу. Между ними ничего не видно.", 294, { gel: 3, reagent: 1 }],
  ["Обратная роса", "Сухая поверхность втягивает капли из воздуха. После каждой капли внутри прибора скребут ногтем.", 316, { reagent: 2, cap: 1 }],
  ["Голос под лаком", "Слой лака вздулся над закрытым реле. Пока зонд молчит, оттуда слышно тихое мычание.", 342, { gel: 2, scrap: 2 }],
  ["Три пустые петли", "Сломанная петля трижды щёлкает сама. После третьего щелчка кто-то отвечает на полтона ниже.", 369, { gel: 1, chip: 2 }],
  ["Соль без следа", "На стойке белая полоска. Её не стереть ни тряпкой, ни рукой. Прибор звучит громче, когда от него отворачиваются.", 397, { reagent: 4, scrap: 1 }],
  ["Утопленный свет", "За стеклом плавает еле видный отблеск. Металлическая крышка кажется мокрой с обеих сторон.", 421, { gel: 4, wire: 1 }],
  ["Ход под пластиной", "По обратной стороне пластины что-то перебирает лапами. Когда вы касаетесь края, звук обходит вашу ладонь.", 448, { gel: 1, cap: 2 }],
  ["Складка в проводе", "У кабеля два одинаковых изгиба. Если распрямить один, другой сам повторяет движение.", 474, { reagent: 1, wire: 3 }],
  ["Тёмная мерка", "Мерное кольцо становится теснее вокруг стержня. Насечка скрипит, хотя стержень неподвижен.", 503, { gel: 3, scrap: 1 }],
  ["Долгая пауза", "Проверочный тон обрывается. Тишина в репродукторе продолжается и после того, как вы отходите.", 532, { reagent: 2, chip: 2 }],
  ["Крошка в шве", "Из шва один за другим выдавливаются кусочки тёмного стекла. С той стороны их кто-то пересчитывает.", 562, { gel: 2, cap: 2 }],
  ["Камера без дна", "В глубине отсека что-то течёт вверх. Капли по одной ударяют в крышку изнутри.", 589, { reagent: 4, gel: 2 }],
  ["Привкус железа", "Раз в несколько секунд слышен короткий зубной скрежет. После него датчик показывает, что внутри кто-то вдохнул.", 619, { gel: 1, scrap: 3 }],
  ["Печать на пустоте", "На целой пломбе проступает след пальцев с внутренней стороны, одного за другим.", 651, { reagent: 5, cap: 1 }],
  ["Стук на выдохе", "Прибор щёлкает после каждого вашего выдоха. Стоит задержать дыхание, как щелчок раздаётся позади.", 682, { gel: 4, chip: 1 }],
  ["Пропавший отзвук", "Зонд пишет тон, но слышен лишь его слабый хвост. От лабораторного пола перестали отражаться шаги.", 711, { reagent: 3, wire: 2 }]
];
var FIELDS = [
  { n: "Ионный разряд", cue: "ion", hint: "Поле снимает заряд имплантов. Блок экзокаркаса поглощает часть разряда." },
  { n: "Аэрозольный след", cue: "mist", hint: "В зоне следа растут токсины. Фильтр или надетая маска с кислородом защищают от аэрозоля." },
  { n: "Ледяной сдвиг", cue: "frost", hint: "Холод замедляет движение. Помогает броня с защитой от холода." },
  { n: "Сжатие", cue: "crush", hint: "Рядом с источником импульсы отнимают здоровье. Отойдите за границу поля." },
  { n: "Звуковой провал", cue: "null", hint: "Импульс на короткое время приглушает окружающие звуки." }
];
var CREATURES = [
  { n: "Подшовник", note: "ныряет в пол и появляется рядом", kind: "bio", beh: ["burrow", "slow"], adt: "phys", rng: 1, spd: 3, hp: 44, dmg: 12, arm: 2, res: { phys: 0.13 } },
  { n: "Гортань", note: "останавливается для оглушающего крика", kind: "bio", beh: ["screamer", "pack"], adt: "sonic", rng: 1, spd: 3, hp: 35, dmg: 9, arm: 1, res: { sonic: 0.55 } },
  { n: "Стеклорог", note: "берёт разбег по прямой", kind: "bio", beh: ["charge"], adt: "phys", rng: 1, spd: 4, hp: 56, dmg: 16, arm: 8, res: { phys: 0.33 } },
  { n: "Двойной след", note: "мерцает и перескакивает через промежутки", kind: "anom", beh: ["blink", "phaseshift"], adt: "field", rng: 3, spd: 4, hp: 41, dmg: 10, arm: 1, res: { field: 0.46 } },
  { n: "Падальщик тока", note: "отнимает заряд и лечится от попаданий по герою", kind: "bio", beh: ["drain", "leech"], adt: "shock", rng: 1, spd: 3, hp: 48, dmg: 12, arm: 3, res: { shock: 0.47 } }
];
var CHAINS = [
  { n: "Ручная изоляция", seq: ["probe", "seal"], rank: 1 },
  { n: "Химическое гашение", seq: ["probe", "brew", "quench"], rank: 1 },
  { n: "Охота за источником", seq: ["probe", "hunt", "seal"], rank: 2 },
  { n: "Эвакуация пробы", seq: ["probe", "lift", "unload", "seal"], rank: 2 },
  { n: "Поиск ложного сигнала", seq: ["probe", "listen", "hunt", "seal"], rank: 2 },
  { n: "Разбор аномальной камеры", seq: ["probe", "brew", "quench", "listen", "hunt", "lift", "unload", "seal"], rank: 3 }
];
var TOTAL = TRACES.length * FIELDS.length * CREATURES.length * CHAINS.length;
var STAGE = {
  probe: "Снять показание у источника", seal: "Изолировать контур", brew: "Приготовить матрицу", quench: "Погасить активную фазу",
  hunt: "Устранить тварь", lift: "Снять контейнер со стойки", unload: "Поставить контейнер в приёмник", listen: "Опознать исходный сигнал"
};
var SIGNAL = [[1, 2, 1], [2, 1, 1], [1, 1, 2], [2, 2, 1], [1, 2, 2]];
var SITES = /^(terminal|okoterm|pc|comp|fusebox|powergrid|workbench|radio|chemlab|charger)$/;
var RECEIVE = /^(workbench|charger|terminal|powergrid|crate|locker|supply)$/;
var PARTS = {
  gun: { n: "Оружейный блок", item: "rift_unit_gun", need: { rift_lattice: 1, chip: 2, wire: 2 },
    axes: ["Точность", "Теплоотвод", "Глушение"] },
  drone: { n: "Блок дрона", item: "rift_unit_drone", need: { rift_lattice: 1, servo: 2, cap: 2 },
    axes: ["Тяга", "Экономия команд", "Шум платформы"] },
  frame: { n: "Блок каркаса", item: "rift_unit_frame", need: { rift_lattice: 1, panel: 2, cell: 1 },
    axes: ["Герметизация", "Разгрузка", "Экономия каркаса"] }
};
var FRAME_PROFILES = [
  { n: "Изолятор", trait: "Защита от импульсов поля", axis: 0 },
  { n: "Такелаж", trait: "Прибавка грузоподъёмности", axis: 1 },
  { n: "Ходок", trait: "Экономия заряда", axis: 2 }
];

function spec(id) {
  var n = (id / TRACES.length) | 0, i = id % TRACES.length;
  var h = n % FIELDS.length; n = (n / FIELDS.length) | 0;
  var m = n % CREATURES.length, p = (n / CREATURES.length) | 0;
  return { id: id, i: i, h: h, m: m, p: p, trace: TRACES[i], field: FIELDS[h], foe: CREATURES[m], chain: CHAINS[p],
    radius: 3 + i % 4, interval: 2 + Math.floor(i / 4) };
}
function serial(seed, L, F) {
  var ordinal = (L - LAB.DEEP_BASE - 1) * LAB.FLOORS_N + F - 1;
  /* Шаг взаимно прост с числом протоколов, поэтому цикл охватывает их все. */
  return (ordinal * 137 + LAB.hash32(seed + "|rift") % TOTAL) % TOTAL;
}
function available() { return gm() && gm().entered && G().L > LAB.DEEP_BASE && C().fs; }
function state() { return available() && C().fs.riftCase; }
function task(q) { return q && spec(q.id).chain.seq[q.step]; }
function active(q) { return q && state() === q && !q.done && !G().stair && !G().dead; }
function object(id) { return C().fl.objs.find(function (o) { return o.id === id; }); }
function near(o) { return o && gm().touchesObject(o, G().x, G().y); }
function site(q) { return q && object(q.sites[task(q)]); }
function siteName(o) {
  if (!o) return "пост обследования";
  var r = C().fl.rooms[o.room];
  return gm().objName(o) + (r ? ", помещение " + (r.num ? r.num + ", " : "") + r.name : "");
}
function spawnPlace(o) {
  var Cb = LAB.combat, g = G(), r = C().fl.rooms[o.room], fl = C().fl, out = [];
  if (!Cb || !r) return null;
  for (var y = r.y0 + 1; y < r.y1; y++) for (var x = r.x0 + 1; x < r.x1; x++) {
    if (fl.room[y * LAB.W + x] !== o.room || !gm().passable(x, y)) continue;
    var from = Math.abs(x - o.x) + Math.abs(y - o.y), d = Math.abs(x - g.x) + Math.abs(y - g.y);
    if (from < 4 || from > 9 || d < 4 || !Cb.canStand(null, x, y) || Cb.havenAt(x, y)) continue;
    out.push([x, y]);
  }
  out.sort(function (a, b) {
    return Math.abs(a[0] - o.x) + Math.abs(a[1] - o.y) - Math.abs(b[0] - o.x) - Math.abs(b[1] - o.y);
  });
  return out[0] || null;
}
function plan(s, source) {
  var g = G(), fl = C().fl, siteMap = {}, n = 0, picked = {};
  function pick(types, room, creature) {
    var list = fl.objs.filter(function (o) {
      var r = fl.rooms[o.room];
      return types.test(o.type) && r && !r.hidden && o.room !== room && (!creature || !r.safe);
    });
    list.sort(function (a, b) {
      function score(o) { return Math.abs(o.x - g.x) + Math.abs(o.y - g.y) + LAB.hash32(s.id + ":" + o.id) % 13; }
      return score(a) - score(b);
    });
    for (var i = 0; i < list.length && n < 54; i++) {
      var o = list[i];
      if (creature && !spawnPlace(o)) continue;
      if (!Object.prototype.hasOwnProperty.call(picked, o.id)) { n++; picked[o.id] = !!gm()._routeTo(null, o); }
      if (picked[o.id]) return o;
    }
    return null;
  }
  var probe = pick(SITES, source.room, true) || pick(SITES, -2, true);
  if (!probe) return null;
  var seq = s.chain.seq, terminal = pick(SITES, probe.room, false) || source;
  var lab = seq.indexOf("brew") >= 0 && (pick(/^chemlab$/, probe.room, false) || pick(/^workbench$/, probe.room, false) || source);
  var receiver = seq.indexOf("unload") >= 0 && (pick(RECEIVE, probe.room, false) || (source.room !== probe.room && source));
  if (seq.indexOf("unload") >= 0 && !receiver) return null;
  siteMap.probe = siteMap.hunt = siteMap.quench = siteMap.lift = probe.id;
  siteMap.seal = siteMap.listen = terminal.id;
  if (lab) siteMap.brew = lab.id;
  if (receiver) siteMap.unload = receiver.id;
  return { id: s.id, step: 0, sites: siteMap, field: false, cargo: 0 };
}
function mass(s) { return 24 + 4 * s.i + 12 * s.h + s.chain.rank * 8; }
function kg(x) { return LAB.load ? LAB.load.kg(x) : x + " килограммов"; }
function currentLine(q) {
  if (!q || q.done) return "";
  var s = spec(q.id), stage = task(q);
  return "Этап " + (q.step + 1) + " из " + s.chain.seq.length + ". " + STAGE[stage] + ". " + siteName(site(q)) +
    (q.cargo ? ". Груз " + kg(q.cargo) : "") + ".";
}
function target(q) {
  if (!active(q)) return null;
  var o = site(q);
  if (task(q) === "hunt" && q.foe && !q.killed) {
    var f = LAB.combat.foes().find(function (e) { return e.id === q.foe && !e.dead; });
    if (f) return { n: "тварь у аномалии. " + f.name.split(",")[0], o: f };
  }
  return o ? { n: "аномальное обследование. " + STAGE[task(q)] + ". " + siteName(o), o: o } : null;
}
function clearPath() {
  var route = gm().navFollow();
  if (route && /^(аномальное обследование|тварь у аномалии)\./.test(route.name)) gm().navStop();
}
function next(q, text, snd) {
  clearPath(); q.step++;
  gm().journal(text);
  cue(snd || "ok");
  save(); close();
  say(text + " " + currentLine(q));
}
function mark(s) { return (s.i * 7 + s.h * 3 + s.m * 2 + s.p) % 10; }
function pattern(s) { return SIGNAL[(s.i + s.h * 2 + s.m + s.p) % SIGNAL.length]; }
function signalText(p) { return p.map(function (n) { return n === 1 ? "короткий" : "длинный"; }).join(", "); }
function tone(s, p) {
  if (!LAB.Sound || !LAB.Sound.tone) return;
  var at = 0;
  p.forEach(function (n, i) {
    LAB.Sound.tone(s.trace[2] * (i === 1 ? 1.5 : 1), n === 1 ? 0.11 : 0.32, { bus: "puzzle", when: at, vol: 0.16 });
    at += (n === 1 ? 0.11 : 0.32) + 0.12;
  });
}
function callFoe(q, o) {
  var s = spec(q.id), cell = spawnPlace(o);
  if (!cell) return false;
  var f = LAB.combat.spawnFoe("rift_hunter_" + s.m, cell[0], cell[1], { task: "rift:" + q.id, hpK: [0.72, 0.9, 1.12][s.chain.rank - 1] });
  if (!f) return false;
  q.foe = f.id;
  f.state = "alert";
  f.lastKnown = { x: G().x, y: G().y };
  cue("beast" + s.m, f);
  return true;
}
function finish(q, text) {
  if (!active(q)) return;
  var s = spec(q.id), g = G();
  q.done = true; q.field = false; q.cargo = 0;
  clearPath();
  var fee = 26 + s.chain.seq.length * 7 + Math.min(65, Math.floor(LAB.Le(g.L) / 3));
  var crystals = s.chain.rank === 3 ? 2 : 1;
  if (!LAB.load || LAB.load.canTake(crystals * LAB.load.itemWt("rift_lattice")))
    g.inv.rift_lattice = (g.inv.rift_lattice || 0) + crystals;
  else q.claim = crystals; /* доступно с той же стойки после разгрузки */
  g.credits += fee;
  gm().gainXP(15 + s.chain.seq.length * 5);
  gm().journal("Закрыто обследование «" + s.trace[0] + "».");
  if (LAB.load) LAB.load.after();
  cue("seal");
  close(); save();
  say(text + " Обследование завершено. Кредитов " + fee + ". Резонаторных решёток " + crystals +
    (q.claim ? ", оставлены у поста сдачи. Заберите после разгрузки." : ", в рюкзаке."));
}
function consume(cost) {
  var g = G();
  Object.keys(cost).forEach(function (id) {
    var before = g.inv[id], made = (g.craftN && g.craftN[id]) || 0;
    var used = Math.max(0, cost[id] - Math.max(0, before - made));
    if (used) g.craftN[id] = Math.max(0, made - used);
    if (before === cost[id]) delete g.inv[id]; else g.inv[id] -= cost[id];
  });
}
function costs(cost) {
  return Object.keys(cost).map(function (id) { return LAB.ITEMS[id].n + " " + cost[id] + ", у вас " + (G().inv[id] || 0); }).join(". ");
}
function enough(cost) { return Object.keys(cost).every(function (id) { return (G().inv[id] || 0) >= cost[id]; }); }
function ampoule(q) { return "rift_vial_" + spec(q.id).i; }
function sealedClaim(q, o) {
  if (!q.claim || !near(o) || state() !== q) return;
  if (LAB.load && !LAB.load.canTake(q.claim * LAB.load.itemWt("rift_lattice"))) { say("Для решёток пока нет места по весу."); return; }
  G().inv.rift_lattice = (G().inv.rift_lattice || 0) + q.claim;
  q.claim = 0;
  cue("carry"); save(); close();
  say("Резонаторные решётки забраны.");
}
function controls(q, o, standard) {
  var s = spec(q.id), stage = task(q), rows = [info(currentLine(q)),
    info(s.field.n + ". Радиус " + gm().stepsW(s.radius) + ". Импульс за " + gm().stepsW(s.interval) + " внутри поля. " + s.field.hint)];
  function valid() { return active(q) && task(q) === stage && o === site(q) && near(o); }
  if (stage === "probe") rows.push({ label: "Включить зонд. Источник может привлечь тварь", fn: function () {
    if (!valid()) return;
    if (!callFoe(q, o)) { say("Не удалось открыть камеру. Освободите место у поста и попробуйте снова."); return; }
    q.field = true;
    cue(s.field.cue, o, s.trace[2] / 380);
    next(q, s.trace[1] + " Контрольная отметка " + mark(s) + ". В другом конце камеры что-то ответило.", "probe");
  } });
  if (stage === "brew") {
    var recipe = s.trace[3], vial = ampoule(q), dose = 0;
    var required = s.chain.rank === 3 ? 1 + (mark(s) + s.h + s.m) % 8 : 0;
    rows.push(info("Матрица «" + s.trace[0] + "». Расход. " + costs(recipe) + "."));
    if (required) {
      rows.push(info("Замер активной камеры. Дозатор должен стоять на делении " + required + "."));
      rows.push({ label: "Деление дозатора", kind: "slider", min: 0, max: 8, step: 1,
        get: function () { return dose; }, set: function (v) { dose = v; } });
    }
    rows.push({ label: "Приготовить запечатанную ампулу", fn: function () {
      if (!valid()) return;
      if (!(G().inv[vial] > 0)) {
        if (o.type === "chemlab" && LAB.chem.station(o).dirty) { say("Стол загрязнён. Отмойте его в обычном меню."); return; }
        if (dose !== required) { cue("error"); say("Деление дозатора не совпало с замером. Клапан остался закрыт."); return; }
        if (!enough(recipe)) { say("Не хватает припасов. " + costs(recipe)); return; }
        if (LAB.load && !LAB.load.canTake(LAB.load.itemWt(vial))) { say("Ампулу сейчас не поднять."); return; }
        consume(recipe); G().inv[vial] = 1;
        if (LAB.chem) LAB.chem.gain("energy", 4);
      }
      next(q, "Ампула готова. Подайте её в гнездо у источника.", "mix");
    } });
  }
  if (stage === "quench") rows.push({ label: "Вставить ампулу в камеру и погасить поле", fn: function () {
    if (!valid()) return;
    var id = ampoule(q);
    if (!(G().inv[id] > 0)) { say("Ампулы нет при вас. Обратитесь к посту подготовки."); return; }
    G().inv[id]--;
    q.field = false;
    if (s.chain.seq[q.step + 1]) next(q, "Поле погашено. Проверьте оставшиеся узлы.", "seal");
    else finish(q, "Матрица погасила активную фазу.");
  } });
  if (stage === "hunt") rows.push(info(q.killed ? "Тварь устранена. Продолжите у поста." :
    s.foe.n + ". " + s.foe.note + ". «Эхо» укажет её направление."));
  if (stage === "hunt" && q.killed) rows.push({ label: "Подтвердить осмотр камеры", fn: function () {
    if (valid()) next(q, "Камера проверена. Зона больше не удерживает тварь.", "ok");
  } });
  if (stage === "lift") rows.push({ label: "Взять контейнер, " + kg(mass(s)) + ". Перед выходом положите его в приёмник", fn: function () {
    if (!valid()) return;
    if (!LAB.load || !LAB.load.canTake(mass(s))) { say("Груз неподъёмный. Разгрузите рюкзак или подключите грузовой модуль."); return; }
    q.cargo = mass(s); LAB.load.after(); next(q, "Контейнер опломбирован и закреплён.", "carry");
  } });
  if (stage === "unload") rows.push({ label: "Сдать опломбированный контейнер", fn: function () {
    if (!valid() || !q.cargo) return;
    q.cargo = 0; LAB.load.after(); next(q, "Контейнер установлен в приёмник.", "carry");
  } });
  if (stage === "listen") {
    var correct = pattern(s);
    rows.push(info("Исходная запись. " + signalText(correct) + "."));
    rows.push({ label: "Прослушать исходный сигнал", keep: true, fn: function () { if (valid()) tone(s, correct); } });
    SIGNAL.forEach(function (p) {
      rows.push({ label: "Выбрать запись. " + signalText(p), keep: true, fn: function () {
        if (!valid()) return;
        if (p !== correct) { cue("error"); say("Ритм отличается от исходного. Повторите запись."); return; }
        next(q, "Прибор принял исходный ритм.", "probe");
      } });
    });
  }
  if (stage === "seal") {
    var dial = 0;
    rows.push(info("Контрольная отметка из замера " + mark(s) + "."));
    rows.push({ label: "Отметка муфты. Изменить и подтвердить", kind: "slider", min: 0, max: 9, step: 1, keep: true,
      get: function () { return dial; }, set: function (v) { dial = v; }, fn: function () {
        if (!valid()) return;
        if (dial !== mark(s)) { cue("error"); say("Отметка не совпала. Сверьтесь с замером."); return; }
        finish(q, "Муфта закрыта. Поле затихло.");
      } });
  }
  if (standard) rows.push({ label: "Обычные действия у оборудования", fn: standard });
  rows.push(back());
  menu("Аномалия. " + s.trace[0], rows);
}
function objMenu(o, standard) {
  var q = state();
  if (q && q.done && q.claim && q.sites[spec(q.id).chain.seq.slice(-1)[0]] === o.id && near(o)) {
    menu("Награда за обследование", [
      { label: "Забрать решётки, " + q.claim, fn: function () { sealedClaim(q, o); } },
      { label: "Обычные действия у оборудования", fn: standard }, back()
    ]);
    return true;
  }
  if (!active(q) || !near(o) || o !== site(q)) return false;
  controls(q, o, standard);
  return true;
}
function journalItem() {
  var q = state();
  if (!active(q)) return null;
  return { label: "Аномальное обследование. " + currentLine(q), fn: function () {
    if (!active(q)) return;
    var s = spec(q.id), o = site(q);
    if (near(o)) { controls(q, o); return; }
    var rows = [info(currentLine(q)), info(s.trace[1]), info(s.field.hint)];
    rows.push({ label: "Проложить путь к следующей цели", fn: function () {
      var t = target(q);
      if (t) { if (LAB.ui && LAB.ui.closeAll) LAB.ui.closeAll(); gm().navigateTo(t); }
    } });
    if (q.cargo) rows.push({ label: "Вернуть контейнер к стойке", fn: function () {
      if (!active(q) || !releaseCargo()) return;
      close(); save(); say("Контейнер отцеплен. Стойка подтянула его страховочным тросом.");
    } });
    rows.push(back()); menu("Обследование. " + s.trace[0], rows);
  } };
}
function boardRow(o) {
  if (!available()) return null;
  return { label: "Аномальные обследования", fn: function () {
    if (!available() || !near(o)) return;
    var q = state(), s = spec(q ? q.id : serial(G().seed, G().L, G().F));
    var rows = [info(s.trace[0] + ". " + s.field.n + ". " + s.chain.n + ". Этапов " + s.chain.seq.length + ".")];
    if (q && q.done) rows.push(info("Камера обследована." + (q.claim ? " Награда ждёт у поста сдачи." : "")));
    else if (q) rows.push(journalItem());
    else rows.push({ label: "Взять обследование. " + s.field.hint, fn: function () {
      if (!available() || state() || !near(o)) return;
      var started = plan(s, o);
      if (!started) { say("Нет безопасного подхода к контрольным постам. Откройте проходы или обратитесь с другого узла."); return; }
      C().fs.riftCase = started;
      gm().journal("Начато обследование «" + s.trace[0] + "».");
      cue("probe"); save(); close(); say(currentLine(started));
    } });
    rows.push(back()); menu("Аномальные обследования", rows);
  } };
}
function releaseCargo() {
  var q = state();
  if (!q || !q.cargo) return false;
  q.cargo = 0;
  q.step = spec(q.id).chain.seq.indexOf("lift");
  if (LAB.load) LAB.load.after();
  gm().journal("Контейнер возвращён страховочным тросом на стойку.");
  return true;
}
function killed(f) {
  var q = state();
  if (!active(q) || q.foe !== f.id) return;
  q.killed = true;
  cue("ok"); save();
}
function step() {
  var q = state();
  if (!active(q) || !q.field) return;
  var o = object(q.sites.probe), g = G(), s = spec(q.id);
  if (!o || Math.abs(g.x - o.x) + Math.abs(g.y - o.y) > s.radius || !LAB.los(C().fl, C().fs, g.x, g.y, o.x, o.y)) return;
  q.pulse = (q.pulse || 0) + 1;
  if (q.pulse % s.interval === 1) cue(s.field.cue, o, 0.86 + s.i * 0.012);
  if (q.pulse === 1) LAB.say(s.field.hint, { interrupt: false });
  if (q.pulse % s.interval !== 0) return;
  var frame = LAB.exo && LAB.exo.worn(), shield = frame && LAB.exo.live(frame)
    ? tune(frame, "frame", 0) + LAB.exo.riftGuard(frame) : 0;
  if (s.h === 0) g.en = Math.max(0, g.en - Math.max(0, Math.ceil(s.chain.rank + 2 - shield * 0.4)));
  if (s.h === 1 && !((g.st.antitox || 0) > 0)) {
    var air = g.airGear;
    if (air && air.on && air.oxygen > 0 && g.inv.airmask > 0) air.oxygen = Math.max(0, air.oxygen - 0.25);
    else g.body.tox = Math.min(100, g.body.tox + Math.max(0, s.chain.rank + 2 - shield * 0.35));
  }
  if (s.h === 2 && !gm().armorSpecial("frost")) g.st.slow = Math.max(g.st.slow || 0, 2 + s.chain.rank);
  if (s.h === 3) LAB.combat.hurtPlayer(Math.round((4 + s.chain.rank * 3) * (1 - 0.035 * shield)), "field", null, { quiet: true });
  if (s.h === 4) {
    g.st.deaf = Math.max(g.st.deaf || 0, 2 + s.chain.rank);
    if (LAB.atmos) LAB.atmos.deafen(800 + s.chain.rank * 350);
  }
}

/* Один съёмный блок на предмет. Точный бюджет делит три
   настраиваемых эффекта; числа из записи ограничиваются при чтении. */
function block(obj, kind) { return obj && obj.rift && obj.rift.kind === kind ? obj.rift : null; }
function tune(obj, kind, axis) {
  var b = block(obj, kind);
  if (!b || !Array.isArray(b.v)) return 0;
  var v = Math.max(0, Math.min(10, Math.floor(+b.v[axis] || 0)));
  if (kind === "frame" && FRAME_PROFILES[b.profile] && FRAME_PROFILES[b.profile].axis === axis) v += 2;
  return v;
}
function moduleEffect(kind, axis, v) {
  if (kind === "gun") return [v * 0.6 + " процентных пункта точности", v * 2.5 + " процентов дополнительной ёмкости теплоотвода", v * 3 + " процентов глушения"][axis];
  if (kind === "drone") return [v * 1.5 + " процентов к тяге в пределах корпуса", Math.floor(v / 3) + " экономии энергии на командах от 6 единиц", (v / 5).toFixed(1) + " снижения шума грузовой платформы"][axis];
  return [v + " единиц защиты от аномальных полей", v * 3 + " килограммов к пределу", v * 1.5 + " процентов экономии энергии"][axis];
}
function nearBench() {
  var b = LAB.workshop && LAB.workshop.near();
  return b && LAB.workshop.effTier(b) >= 4;
}
function held(obj, kind) {
  if (kind === "gun") return G().weapons.indexOf(obj) >= 0;
  if (kind === "frame") return (G().frames || []).indexOf(obj) >= 0;
  return LAB.drone.D() === obj;
}
function benchRow() {
  if (!available() || !nearBench()) return null;
  return { label: "Резонаторные модули. Сборка и точная настройка", fn: benchMenu };
}
function benchMenu() {
  if (!available() || !nearBench()) { say("Нужен работающий верстак ступени 4."); return; }
  var rows = [];
  Object.keys(PARTS).forEach(function (kind) {
    var m = PARTS[kind];
    rows.push({ label: "Собрать. " + m.n + ". " + costs(m.need), fn: function () {
      if (!nearBench() || !enough(m.need)) { say("Нужны станки и детали. " + costs(m.need)); return; }
      if (LAB.load && !LAB.load.canTake(LAB.load.itemWt(m.item))) { say("Модуль сейчас не поднять."); return; }
      consume(m.need); G().inv[m.item] = (G().inv[m.item] || 0) + 1;
      cue("bench"); save(); close(); say(m.n + " собран.");
    } });
  });
  function add(obj, kind, name) {
    rows.push({ label: name + ". " + (block(obj, kind) ? "Резонатор установлен" : "Установить резонатор"), fn: function () {
      if (!nearBench() || !held(obj, kind)) return;
      var m = PARTS[kind];
      if (!block(obj, kind)) {
        if (!(G().inv[m.item] > 0)) { say("Сначала соберите " + m.n.toLowerCase() + "."); return; }
        G().inv[m.item]--; obj.rift = { kind: kind, v: [4, 4, 4], profile: 0 };
        cue("bench"); save(); if (LAB.load) LAB.load.after();
      }
      tuneMenu(obj, kind, name);
    } });
  }
  G().weapons.forEach(function (w) { add(w, "gun", w.name); });
  var d = LAB.drone && LAB.drone.D();
  if (d && !d.wreck) add(d, "drone", "Дрон-спутник");
  (G().frames || []).forEach(function (f) { add(f, "frame", LAB.exo.frameName(f)); });
  rows.push(back()); menu("Резонаторные модули", rows);
}
function tuneMenu(obj, kind, name) {
  var m = PARTS[kind], b = block(obj, kind);
  if (!b) return;
  function valid() { return nearBench() && held(obj, kind) && block(obj, kind) === b; }
  function changed() { cue("tune"); save(); if (LAB.load) LAB.load.after(true); }
  var rows = [info("Бюджет 12 единиц на три канала. Сначала освободите единицы на другом канале. Изменения вступают в силу сразу." + (kind === "frame" ? " Специализация добавляет 2 к одному каналу." : ""))];
  m.axes.forEach(function (label, i) {
    rows.push({ label: label, kind: "slider", min: 0, max: 10, step: 1,
      get: function () { return b.v[i]; },
      set: function (n) {
        if (!valid()) return;
        var other = b.v[(i + 1) % 3] + b.v[(i + 2) % 3];
        var v = Math.max(0, Math.min(10, 12 - other, Math.round(n)));
        if (v !== b.v[i]) { b.v[i] = v; changed(); }
        else if (v !== n) say("Освободите единицы на другом канале.");
      },
      fmt: function (v) { return v + " из 10. " + moduleEffect(kind, i, tune(obj, kind, i)); }
    });
  });
  if (kind === "frame") rows.push({ label: "Специализация каркаса", kind: "choice",
    options: FRAME_PROFILES.map(function (p, i) { return { v: i, label: p.n + ". " + p.trait }; }),
    get: function () { return b.profile || 0; }, set: function (n) { if (valid() && FRAME_PROFILES[n]) { b.profile = n; changed(); } }
  });
  rows.push({ label: "Снять блок и вернуть в рюкзак", fn: function () {
    if (!valid()) return;
    delete obj.rift;
    if (LAB.load && !LAB.load.canTake(LAB.load.itemWt(m.item))) {
      obj.rift = b;
      say("Сначала снимите лишний груз. Без резонатора его не поднять.");
      return;
    }
    G().inv[m.item] = (G().inv[m.item] || 0) + 1; changed(); close();
    say("Блок снят. При новой установке каналы выставляются в исходное положение.");
  } });
  rows.push(back()); menu("Точная настройка. " + name, rows);
}
function register() {
  LAB.ITEMS.rift_lattice = { n: "Резонаторная решётка", kind: "eng", cat: "eng", wt: 0.65, nosell: 1, desc: "Деталь для сборки на верстаке глубин. Награда за обследование аномалии." };
  Object.keys(PARTS).forEach(function (k) {
    var p = PARTS[k]; LAB.ITEMS[p.item] = { n: p.n + " резонатора", kind: "eng", cat: "eng", wt: 1.1, nosell: 1, desc: "Устанавливается и настраивается на работающем верстаке глубин." };
  });
  TRACES.forEach(function (t, i) {
    LAB.ITEMS["rift_vial_" + i] = { n: "Матрица «" + t[0] + "»", kind: "quest", cat: "quest", wt: 0.35, nosell: 1, desc: "Запечатанная ампула для гнезда аномальной камеры." };
  });
  CREATURES.forEach(function (b, i) {
    LAB.FOES["rift_hunter_" + i] = Object.assign({ g: i === 1 || i === 3 ? "f" : "m", acd: 4, det: 8, xp: 16, min: 101, desc: b.note + ".", snd: "rift_beast" + i }, b);
  });
  if (LAB.SND) {
    FIELDS.map(function (f) { return f.cue; }).concat(CREATURES.map(function (_, i) { return "beast" + i; }),
      ["probe", "mix", "seal", "carry", "ok", "error", "bench", "tune", "frame_sealed", "frame_haul", "frame_walk"]).forEach(function (id) {
      var key = "rift_" + id;
      LAB.SND[key] = { f: ["rift/" + id + "_1.ogg", "rift/" + id + "_2.ogg"], o: { v: 0.86, bus: "fx" } };
      if (LAB.SOUND_ALL) LAB.SOUND_ALL.push(key);
    });
  }
}
function unitMass(obj) {
  return obj && obj.rift && PARTS[obj.rift.kind] ? LAB.ITEMS[PARTS[obj.rift.kind].item].wt : 0;
}
function recover(obj, kind) {
  if (!block(obj, kind)) return "";
  var id = PARTS[kind].item;
  delete obj.rift;
  G().inv[id] = (G().inv[id] || 0) + 1;
  return LAB.ITEMS[id].n.toLowerCase();
}
register();
LAB.rift = { boardRow: boardRow, objMenu: objMenu, journalItem: journalItem, nav: function () { return target(state()); },
  leave: releaseCargo, step: step, killed: killed, cargo: function () { var q = state(); return q ? q.cargo || 0 : 0; },
  benchRow: benchRow, tune: tune, unitMass: unitMass, recover: recover,
  frameCue: function (cls, rate, gain) { cue("frame_" + cls, null, rate, gain); }, count: TOTAL, spec: spec, serial: serial };
})();

/* Происшествия возникают на обычном маршруте. Этаж хранит только обнаруженный след,
   а его свойства и звуковые улики восстанавливаются по номеру сценария. */
(function () {
"use strict";
var LAB = window.LAB;
var ORIGINS = [
  ["Второй шаг", "Пол отвечает на ваш шаг с короткой задержкой. Второй шаг тяжелее первого.", "ступень", 4],
  ["Неподвижный вентилятор", "Воздух толчками выходит из решётки. Лопасти за ней прихвачены проволокой.", "воздух", 5],
  ["Зазор в дверце", "Тонкий скрежет идёт по краю закрытой створки. Зазор с каждой царапиной становится уже.", "стена", 3],
  ["Останьтесь на линии", "Связь обрывается. Вместо сигнала отбоя из динамика снова и снова натягивают провод.", "стена", 4],
  ["Пыль в потолке", "Песчинки ударяют по потолку снизу. Ни одна не падает обратно.", "воздух", 5],
  ["Пустая маска", "На внутренней стороне пустой маски щёлкает клапан. Каждый вдох длиннее предыдущего.", "воздух", 3],
  ["Шов расходится", "У сварного шва лопается краска. Из щели по очереди выдвигаются три тонкие полоски стали.", "стена", 4],
  ["Узел на кабеле", "Кабель сам затягивает петлю. После каждого рывка узел оказывается ближе к вам.", "ступень", 5],
  ["Чей-то жетон", "Жетон, зажатый между плитами, то и дело переворачивается. Номер на обеих сторонах один, а металл звенит по-разному.", "ступень", 3],
  ["Чужой карандаш", "В пустом отсеке по одному и тому же месту водят тупым грифелем. В конце каждой строки нажим становится сильнее.", "стена", 4],
  ["Давление изнутри", "Снятую с прибора прокладку распирает. Из неё течёт воздух рывками, как через очень узкую щель.", "воздух", 5],
  ["Привычный стук", "Из крышки отвечают короткими ударами. В середине последовательности всегда ждут ещё одного.", "стена", 3],
  ["На обратной стороне", "По нижней стороне плиты тащат что-то тяжёлое, с одной свободной металлической пряжкой.", "ступень", 5],
  ["Мёрзлое стекло", "На стекле проступает круг от тепла. Лёд трескается из его центра к самому краю.", "стена", 4],
  ["Укрытие для одного", "Из тесной ниши пыхтит мех. На каждом выдохе он прижимается к решётке всё ближе.", "воздух", 3],
  ["Обратный слив", "В сливе слышны сперва капли, потом плеск. Уровень воды поднимается с сухой стороны крышки.", "ступень", 4],
  ["Бляшка на стене", "Под латунной бляшкой перекатывается тяжёлое зерно. Оно добегает до края и ударяет снизу.", "стена", 5],
  ["Нулевой отсчёт", "Отключённый прибор подаёт сигнал конца замера. После этого его механизм начинает медленно отматывать ленту.", "стена", 3],
  ["Последний болт", "Плита держится на одном болте. Кто-то перебирает снятый крепёж с её нижней стороны.", "ступень", 4],
  ["Коридор внутри трубы", "Из трубы доносятся несколько далёких тяжёлых шагов. Раскат от каждого длится дольше, чем позволяет её длина.", "воздух", 5],
  ["Обратная тяга", "В бумажный фильтр втягивает воздух из помещения. По складкам бегут короткие всплески, словно изнутри бьётся вода.", "воздух", 3],
  ["Место для сапог", "По пыльному полу тянется скрип подошв. Скрип обрывается каждый раз у одной и той же отметки.", "ступень", 5],
  ["Переговорная без стен", "Пустой резонатор тихо посвистывает. В промежутках будто кто-то пытается произнести первый слог.", "воздух", 4],
  ["Беззубый привод", "Под настилом прокручивается передача. Металлическая крошка царапает пластины при каждом обороте.", "ступень", 5],
  ["Тыльный звон", "Шина касается кожуха с внутренней стороны. После удара тон продолжает дрожать в соседней стене.", "стена", 4]
];
var RULES = [
  { n: "Ответ на шаги", cue: "foot", hint: "Бег усиливает ответ. Безопаснее идти шагом или сделать паузу." },
  { n: "Скопление взвеси", cue: "air", hint: "Взвесь накапливается, когда вы задерживаетесь. Смените место. Дыхательный фильтр защищает." },
  { n: "Поверхностный заряд", cue: "arc", hint: "Разряд зарождается в двух шагах от источника. Отойдите, пока он набирает силу." },
  { n: "Просвет", cue: "sight", hint: "След усиливается по прямой. За стеной и за закрытой дверью он ослабевает." },
  { n: "Обратная волна", cue: "return", hint: "Приближение усиливает волну. При отступлении она стихает." }
];
var PROCEDURES = [
  { n: "Выждать паузу", open: "Выждать паузу у следа", first: "wait" },
  { n: "Сравнить ближний и дальний замеры", open: "Записать ближний замер", first: "distance" },
  { n: "Опознать повтор", open: "Записать ритм источника", first: "echo" },
  { n: "Сверить две контрольные точки", open: "Нанести метку на источник", first: "relay" },
  { n: "Отвести помеху в нужный контур", open: "Снять показания трёх контуров", first: "ground" },
  { n: "Отвести отклик к пустому посту", open: "Включить переносной отражатель", first: "lure" }
];
var DEPTHS = [
  { start: 3, n: "Предвестие", limit: 7, reach: 0, waits: 1, confirm: 0, hit: 0 },
  { start: 101, n: "Прорыв", limit: 7, reach: 1, waits: 2, confirm: 0, hit: 2 },
  { start: 1501, n: "Контакт", limit: 6, reach: 2, waits: 2, confirm: 1, hit: 3 },
  { start: 12701, n: "Вторжение", limit: 5, reach: 3, waits: 3, confirm: 2, hit: 5 }
];
var STAGE = {
  inspect: "Снять исходное показание", wait: "Дослушать паузу у источника",
  distance: "Выйти к точке дальнего замера", echo: "Выбрать услышанный ритм",
  relay: "Проверить метку на контрольной точке", compare: "Сверить ответ с исходной меткой",
  ground: "Выбрать контур для заземления", lure: "Довести отклик шагом до пустого поста",
  seal: "Закрыть контур у источника", verify: "Подтвердить тишину с контрольной точки",
  lock: "Вернуться к источнику и запереть контур"
};
var RHYTHMS = ["Короткий, короткий, длинный", "Короткий, длинный, короткий", "Длинный, короткий, короткий"];
var CHANNELS = ["Настил", "Стена", "Воздуховод"];
var CHANNEL_CLUES = [
  "Первой отзывается плита под ногами, затем стенка, последним воздуховод.",
  "Первой отзывается стенка, затем воздуховод, последней плита под ногами.",
  "Первым отзывается воздуховод, затем плита под ногами, последней стенка."
];
var CHANNEL_FOR = { "ступень": 0, "стена": 1, "воздух": 2 };
var BAND = ORIGINS.length * RULES.length * PROCEDURES.length;
var TOTAL = BAND * DEPTHS.length;
var MIN_STEPS = 5;

function gm() { return LAB.game; }
function hero() { return gm().G; }
function floor() { return gm().CUR; }
function say(t) { LAB.say(t, { interrupt: false }); }
function menu(t, rows, opts) { LAB.ui.menu(t, rows, opts); }
function back() { return { label: "Назад", fn: function () {} }; }
function close() { LAB.ui.closeTop(true); }
function info(t) { return { label: t, keep: true, fn: function () { say(t); } }; }
function active(q) { return q && state() === q && q.stage !== "done" && !hero().dead && !hero().done && !hero().stair; }
function state() { return floor().fs && floor().fs.haunt; }
function dist(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); }
function pos() { return [hero().x, hero().y]; }
function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }
function rankAt(L) {
  for (var i = DEPTHS.length - 1; i >= 0; i--) if (L >= DEPTHS[i].start) return i;
  return -1;
}
function serial(seed, L, F) {
  var rank = rankAt(L);
  if (rank < 0) return -1;
  var ordinal = (L - DEPTHS[rank].start) * LAB.FLOORS_N + F - 1;
  return rank * BAND + (ordinal * 131 + LAB.hash32(seed + "|haunt|" + rank) % BAND) % BAND;
}
function spec(id) {
  if (!Number.isInteger(id) || id < 0 || id >= TOTAL) return null;
  var rank = Math.floor(id / BAND), local = id % BAND, i = local % ORIGINS.length;
  var rule = Math.floor(local / ORIGINS.length) % RULES.length;
  var proc = Math.floor(local / (ORIGINS.length * RULES.length));
  var base = ORIGINS[i], depth = DEPTHS[rank];
  return { i: i, rank: rank, origin: base, d: depth, rule: rule, proc: proc,
    radius: base[3] + depth.reach, rhythm: (i + rule + rank) % RHYTHMS.length,
    channel: (CHANNEL_FOR[base[2]] + rule) % CHANNELS.length };
}
function cue(name, where, gain, rate) {
  var a = LAB.atmos, o = { gain: gain || 0.58, rate: rate || 1 };
  if (!a) return;
  if (where && a.at) { o.follow = true; a.at("haunt_" + name, where[0], where[1], o); }
  else if (a.play) a.play("haunt_" + name, o);
}
function traceCue(q, where) {
  var s = spec(q.id);
  cue("origin" + s.i, where || q.source, 0.66, [1, 0.94, 0.89, 0.82][s.rank]);
}
function safe(x, y) {
  var c = LAB.combat, r = gm().roomAt(x, y);
  return !!(r && floor().fs.haven && floor().fs.haven[r.id]) || !!(c && c.refugeAt(x, y));
}
function passInRoom(r, x, y) {
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1 &&
    gm().roomAt(x, y) === r && !gm().doorAt(x, y) && gm().passable(x, y);
}
function eligible(r) {
  return r && !r.hidden && !r.shop && !r.boss && !safe(hero().x, hero().y) &&
    !floor().fl.objs.some(function (o) {
      return o.room === r.id && /^(wake|capsule|stairs_|gate_|reactor|elevator|arena_|lift_)/.test(o.type);
    });
}
/* Оба поста в связной области текущей комнаты. Мебель, NPC, двери и границы
   остаются под контролем исходного генератора. */
function plan(r, from, s) {
  var queue = [from], visited = {}, far = [];
  visited[from[1] * LAB.W + from[0]] = 1;
  for (var at = 0; at < queue.length; at++) {
    var p = queue[at], x = p[0], y = p[1];
    if (dist(p, from) >= 4 && dist(p, from) <= 12 && !safe(x, y)) far.push(p);
    [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(function (n) {
      var key = n[1] * LAB.W + n[0];
      if (!visited[key] && passInRoom(r, n[0], n[1])) { visited[key] = 1; queue.push(n); }
    });
  }
  if (!far.length) return null;
  far.sort(function (a, b) { return dist(b, from) - dist(a, from); });
  var correctlyPlaced = far.filter(function (p) { return dist(p, from) > s.radius; });
  var choices = correctlyPlaced.length ? correctlyPlaced : far;
  var remote = choices[s.i % Math.min(choices.length, 4)];
  var fixture = floor().fl.objs.find(function (o) {
    return o.room === r.id && gm().touchesObject(o, from[0], from[1]);
  });
  return { source: from, remote: remote, fixture: fixture ? fixture.id : null };
}
function begin(from, r) {
  var g = hero(), fs = floor().fs;
  if (g.L < DEPTHS[0].start || g.stats.steps < MIN_STEPS || gm().roomAt(from[0], from[1]) === r || !eligible(r)) return;
  var id = serial(g.seed, g.L, g.F);
  var s = spec(id), p = plan(r, pos(), s);
  if (!p) return;
  var q = fs.haunt = { id: id, stage: "inspect", source: p.source, remote: p.remote, fixture: p.fixture,
    room: r.id, heat: 0, quiet: 0 };
  traceCue(q);
  if (s.rank === 3) cue("answer", q.remote, 0.71);
  var extra = ["", " След временами меняет показания приборов.",
    " За границей следа слышно движение.", " Отдалённый пост отвечает сам. В ответе различимы движения, которых вы не делали."][s.rank];
  say(s.origin[1] + extra + " «Эхо» занесло происшествие в журнал. Здесь можно снять исходное показание или уйти.");
}
function target(q) {
  if (!active(q)) return null;
  var remote = /^(distance|relay|lure|verify)$/.test(q.stage);
  return { n: "Происшествие. " + STAGE[q.stage], cell: remote ? q.remote : q.source };
}
function change(q, stage, text, sound) {
  var path = gm().navFollow();
  if (path && path.name.indexOf("Происшествие. ") === 0) gm().navStop();
  q.stage = stage;
  if (sound) cue(sound);
  if (text) say(text);
}
function finish(q) {
  if (!active(q)) return;
  var s = spec(q.id), g = hero(), credits = [12, 26, 48, 85][s.rank];
  change(q, "done", null, "closed");
  q.heat = 0;
  g.credits += credits;
  gm().gainXP([10, 18, 35, 60][s.rank]);
  gm().journal("Происшествие «" + s.origin[0] + "» завершено.");
  say("След погас. Получено " + credits + " кредитов.");
  gm().autosave();
}
function solved(q) {
  q.quiet = 0;
  if (!spec(q.id).d.confirm) { finish(q); return; }
  change(q, "seal", "Способ сработал. Вернитесь к источнику и закройте контур.", "catch");
}
function closeCircuit(q) {
  if (spec(q.id).d.confirm < 2) { finish(q); return; }
  change(q, "verify", "Контур закрыт. На этой глубине возможен обратный прорыв. Проверьте тишину с контрольной точки.", "latch");
}
function ruleChange(q, s, kind, before) {
  var now = pos(), gap = dist(now, q.source);
  if (gap > s.radius || safe(now[0], now[1])) return -3;
  switch (s.rule) {
    case 0: return kind === "run" ? 3 : kind === "step" ? (hero().noise >= 5 ? 2 : -1) : -2;
    case 1: return kind === "step" || kind === "run" ? -1 : 2;
    case 2: return gap <= 2 ? 2 : -2;
    case 3: return LAB.los(floor().fl, floor().fs, now[0], now[1], q.source[0], q.source[1]) ? 2 : -2;
    case 4: return before && gap < dist(before, q.source) ? 3 : -1;
  }
  return 0;
}
function airProtected() {
  return hero().st.antitox > 0 || gm().breathingGear();
}
function wakeFollower(q, s) {
  if (q.foe || s.rank < 2 || (s.rank === 2 && s.rule !== 3 && s.rule !== 4) || !LAB.combat) return false;
  var c = LAB.combat, x = q.remote[0], y = q.remote[1], g = hero();
  var p = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].find(function (cell) {
    var r = gm().roomAt(cell[0], cell[1]);
    return r && r.id === q.room && dist(pos(), cell) >= 4 && c.canStand(null, cell[0], cell[1]) && !safe(cell[0], cell[1]);
  });
  if (!p) return false;
  var f = c.spawnFoe(s.rule % 2 ? "haunt_listening" : "haunt_treader", p[0], p[1], { hpK: s.rank === 2 ? 0.48 : 0.68 });
  if (!f) return false;
  q.foe = f.id;
  f.state = "hunt";
  f.lastKnown = { x: g.x, y: g.y };
  cue(s.rule % 2 ? "listening" : "treader", p, 0.78);
  say(f.name + " вышел из следа. Можно отступить или продолжить проверку позже.");
  return true;
}
function pulse(q, s) {
  var g = hero(), rank = s.rank, n = s.d.hit, rule = RULES[s.rule];
  if (!rank) { say("След отозвался и снова стих. Источник помехи указан в журнале."); return; }
  if (s.rule === 1 && !airProtected()) {
    var result = [];
    gm().bodyApply({ tox: n * 2, air: true }, result);
    say("Вы вдохнули взвесь. " + result.join(" ") + " Здесь лучше двигаться.");
  } else if (s.rule === 1) say("Взвесь ударила в фильтр. Воздух под маской чист.");
  if (s.rule === 3) {
    g.st.slow = Math.max(g.st.slow || 0, n + 1);
    say("Прямая видимость. Движения на короткое время замедлились.");
  }
  var type = { 0: "sonic", 2: "shock", 4: "phys" }[s.rule];
  if (type && LAB.combat && g.hp > 1) {
    var raw = Math.min(g.hp - 1, n + Math.ceil(g.hpMax * n * 0.017));
    LAB.combat.hurtPlayer(raw, type, null, { quiet: true });
    say(rule.n + ". Отойдите. Здоровье " + g.hp + ".");
  }
  if (rank === 3 && !q.foe) cue("answer", q.remote, 0.73, 0.91);
  wakeFollower(q, s);
}
function react(q, s, kind, from) {
  var old = q.heat;
  var delta = ruleChange(q, s, kind, from), edge = s.d.limit;
  q.heat = Math.max(0, Math.min(edge, old + delta));
  if (old < edge - 2 && q.heat >= edge - 2) {
    cue(RULES[s.rule].cue, q.source, 0.59);
    say(RULES[s.rule].hint);
    return;
  }
  if (q.heat >= edge && delta > 0) {
    cue(RULES[s.rule].cue, q.source, 0.87, 0.92);
    q.heat = Math.max(0, edge - 4);
    pulse(q, s);
  }
}
function arrive(q) {
  if (!same(pos(), q.remote)) return false;
  if (q.stage === "relay") { change(q, "compare", "Та же метка проступила на удалённом посту. Вернитесь к источнику и сверьте отметки.", "relay"); return true; }
  if (q.stage === "distance" || q.stage === "lure") { solved(q); return true; }
  if (q.stage === "verify") {
    change(q, "lock", "Здесь тихо. За спиной снова дрогнул контур. Вернитесь к источнику и заприте его.", "verify");
    cue("answer", q.source);
    return true;
  }
  return false;
}
function step(from, run) {
  var g = hero(), r = gm().roomAt(g.x, g.y), q = state();
  if (g.stair || g.dead || g.done) return;
  if (!q) { begin(from, r); return; }
  if (!active(q)) return;
  if (!r || r.id !== q.room || safe(g.x, g.y)) {
    q.heat = 0; q.quiet = 0;
    if (q.stage === "lure") change(q, "inspect", "Отклик сорвался у границы помещения. Отражатель можно включить повторно.", "reset");
    return;
  }
  if (q.stage === "lure" && run) {
    change(q, "inspect", "Бег сорвал перенос. Вернитесь к источнику и снова включите отражатель.", "reset");
  }
  if (q.stage === "distance" || q.stage === "relay" || q.stage === "lure") {
    if (arrive(q)) return;
  }
  q.quiet = 0;
  if (q.stage !== "verify") react(q, spec(q.id), run ? "run" : "step", from);
}
function leave() {
  var q = state();
  if (!q || q.stage === "done") return;
  q.heat = 0;
  q.quiet = 0;
  if (q.stage === "lure") q.stage = "inspect";
}
function idle() {
  var q = state(), g = hero();
  if (!active(q) || q.stage === "inspect" || q.stage === "verify" || Date.now() - gm().lastMoveAt() < 3000) return;
  var s = spec(q.id), r = gm().roomAt(g.x, g.y);
  if (!s.rank || s.rule !== 1 || !r || r.id !== q.room) return;
  react(q, s, "idle");
}
function row(q, label, fn) {
  var stage = q.stage;
  return { label: label, fn: function () {
    if (!active(q) || q.stage !== stage) return;
    fn();
  } };
}
function atSource(q) { return same(pos(), q.source); }
function wrong(q, s, hint) {
  cue("reset");
  say(hint);
  react(q, s, "work");
}
function openControls(q) {
  if (!active(q)) return;
  var s = spec(q.id), stage = q.stage, t = target(q);
  var rows = [info(STAGE[stage] + ". " + RULES[s.rule].hint)];
  function action(label, cb, away) {
    rows.push(row(q, label, function () {
      if (away ? !same(pos(), q.remote) : !atSource(q)) { say("Сначала подойдите к указанной точке."); return; }
      cb();
    }));
  }
  function leaveMenu(cb) {
    return function () { close(); cb(); };
  }
  if (!atSource(q) || /^(distance|relay|lure|verify)$/.test(stage)) rows.push(row(q, "Указать путь к текущей точке", function () {
    LAB.ui.closeAll();
    gm().navigateTo(t);
  }));
  if (atSource(q)) {
    rows.push({ label: "Повторить звук и описание источника", keep: true, fn: function () {
      if (!active(q) || !atSource(q)) return;
      traceCue(q); say(s.origin[1]);
    } });
    if (stage === "inspect") action(PROCEDURES[s.proc].open, leaveMenu(function () {
      var p = PROCEDURES[s.proc];
      change(q, p.first, STAGE[p.first] + ".", /^(echo|ground)$/.test(p.first) ? null : "sample");
      if (p.first === "echo") cue("rhythm" + s.rhythm);
      if (p.first === "ground") { cue("contact" + s.channel); say(CHANNEL_CLUES[s.channel] + " Заземлите контур, который откликается первым."); }
    }));
    if (stage === "wait") action("Замереть и дождаться паузы", leaveMenu(function () {
      gm().advanceTime(0.65);
      if (!active(q)) return;
      react(q, s, "wait");
      q.quiet++;
      if (q.quiet >= s.d.waits) solved(q);
      else say("Пауза " + q.quiet + " из " + s.d.waits + ". Стойте на месте и дослушайте.");
    }));
    if (stage === "echo") {
      rows.push({ label: "Прослушать запись и прочитать ритм", keep: true, fn: function () {
        if (!active(q) || q.stage !== stage || !atSource(q)) return;
        cue("rhythm" + s.rhythm);
        say(RHYTHMS[s.rhythm] + ".");
      } });
      RHYTHMS.forEach(function (line, i) {
        action(line, leaveMenu(function () {
          if (i === s.rhythm) solved(q);
          else wrong(q, s, "Фаза не совпала. Повторите исходную запись.");
        }));
      });
    }
    if (stage === "compare") action("Сверить обе отметки", leaveMenu(function () { solved(q); }));
    if (stage === "ground") {
      rows.push({ label: "Снова измерить отдачу контуров", keep: true, fn: function () {
        if (!active(q) || q.stage !== stage || !atSource(q)) return;
        cue("contact" + s.channel);
        say(CHANNEL_CLUES[s.channel]);
      } });
      CHANNELS.forEach(function (channel, i) {
        action("Заземлить. " + channel, leaveMenu(function () {
          if (i === s.channel) solved(q);
          else wrong(q, s, "По контакту вернулась помеха. Возьмите контур, который отзывается первым.");
        }));
      });
    }
    if (stage === "seal") action("Закрыть контур", leaveMenu(function () { closeCircuit(q); }));
    if (stage === "lock") action("Запереть контур", leaveMenu(function () { finish(q); }));
  }
  if (stage === "verify" && same(pos(), q.remote)) action("Проверить тишину", leaveMenu(function () { arrive(q); }), true);
  rows.push(back());
  menu("Происшествие. " + s.origin[0], rows);
}
function journalItem() {
  var q = state();
  if (!active(q)) return null;
  var s = spec(q.id);
  return { label: "Происшествие. " + s.origin[0] + ". " + s.d.n + ". " + STAGE[q.stage],
    fn: function () { openControls(q); } };
}
function objMenu(o, normal) {
  var q = state();
  if (!active(q) || q.fixture !== o.id || !atSource(q)) return false;
  menu("Объект у следа", [
    { label: "Осмотреть след. " + STAGE[q.stage], fn: function () { close(); openControls(q); } },
    { label: "Обычные действия. " + gm().objName(o), fn: function () { close(); normal(); } },
    back()
  ]);
  return true;
}
function register() {
  if (LAB.FOES) {
    LAB.FOES.haunt_listening = { n: "Прислушник", g: "m", kind: "anom", min: 1501, eventOnly: true,
      desc: "Замирает в просвете и пропадает за краем стены.", snd: "haunt_listening",
      beh: ["blink"], adt: "field", rng: 2, spd: 4, acd: 5, det: 8, hp: 27, dmg: 7, arm: 0, xp: 12 };
    LAB.FOES.haunt_treader = { n: "Тяжелоступ", g: "m", kind: "bio", min: 1501, eventOnly: true,
      desc: "Идёт короткими рывками. Перед броском перестаёт шаркать.", snd: "haunt_treader",
      beh: ["charge"], adt: "phys", rng: 1, spd: 4, acd: 6, det: 7, hp: 34, dmg: 9, arm: 1, xp: 14 };
  }
  if (!LAB.SND) return;
  var sounds = ORIGINS.map(function (_, i) { return "origin" + i; });
  sounds.concat(RULES.map(function (r) { return r.cue; }), [
    "sample", "catch", "answer", "latch", "verify", "closed", "reset", "relay", "listening", "treader",
    "rhythm0", "rhythm1", "rhythm2", "contact0", "contact1", "contact2"
  ]).forEach(function (id) {
    var key = "haunt_" + id;
    LAB.SND[key] = { f: ["haunt/" + id + ".ogg"], o: { v: 0.78, bus: "fx" } };
    if (LAB.SOUND_ALL) LAB.SOUND_ALL.push(key);
  });
}
register();
LAB.haunt = { count: TOTAL, serial: serial, spec: spec, step: step, idle: idle, leave: leave,
  journalItem: journalItem, objMenu: objMenu, nav: function () { return target(state()); } };
})();
