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
