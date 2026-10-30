/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — капсула восстановления (1.5).
   Вы ложитесь в капсулу, крышка опускается, и дальше — меню капсулы:
   спать (вздремнуть, поспать, выспаться, лечебный сон — каждый сон
   рассказывается историей), слушать музыку из фонотеки капсулы, читать
   рассказы с поверхности о том, что творится наверху, и рассказы из
   «Библиотеки проектов» (задуманных и воплощённых — к истории объекта они
   не относятся), слушать радио поверхности, смотреть видеоархив («Эхо»
   описывает, что на экране). Рассказы листаются свайпами по страницам,
   «Закрыть» возвращает в меню капсулы. Пока вы слушаете, читаете или
   спите, идёт время и вы восстанавливаетесь. «Откинуть крышку и выйти» —
   выход. Привязаться к капсуле — возрождаться у неё, если погибнете, —
   стоит кредиты: на этажах 1–10 первого уровня 4 кредита, и каждые
   следующие десять этажей вглубь — на 4 дороже. Без привязки «Эхо»
   возвращает к началу уровня.
   В разных капсулах на разных этажах — свои рассказы и передачи.
   Тексты — capsule_texts.js.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function TX() { return LAB.CAPSULE_T || {}; }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
function hm(min) {
  var h = Math.floor(min / 60), m = Math.round(min % 60);
  return (h ? h + " " + pl(h, "час", "часа", "часов") : "") + (h && m ? " " : "") + (m || !h ? m + " " + pl(m, "минута", "минуты", "минут") : "");
}

/* ════════ ФОНОТЕКА ════════
   Записи — свободные (CC BY и общественное достояние), авторы — в
   sounds/CREDITS.md и в пункте «Об этих записях». sec — длина записи в
   секундах, min — сколько минут по часам комплекса проходит, пока она звучит. */
LAB.CAP_TRACKS = [
  { id: "cap_mus_1", n: "Лунный свет", mood: "фортепиано: лунная ночь, тихая мечтательность", cr: "«Clair de lune», Клод Дебюсси; исполняет Laurens Goedhart, лицензия CC BY 3.0" },
  { id: "cap_mus_2", n: "Медленный танец", mood: "фортепиано: светлая задумчивая тишина", cr: "«Gymnopédie No. 1», Эрик Сати; исполняет Robin Alciatore (Musopen), общественное достояние" },
  { id: "cap_mus_3", n: "Воспоминание", mood: "фортепиано: простое тёплое воспоминание о доме", cr: "«Reminiscing», Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_4", n: "Тихий экспромт", mood: "фортепиано: очень тихо, чтобы уснуть", cr: "«Meditation Impromptu 02», Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_5", n: "Ласковая гитара", mood: "гитара: тёплый вальс-воспоминание", cr: "«Guitar Gentle», PeriTune (peritune.com), CC BY 4.0" },
  { id: "cap_mus_6", n: "Канон", mood: "скрипки и арфы: светлые неспешные струнные", cr: "«Canon in D Major», Иоганн Пахельбель; исполняет Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_7", n: "Шкатулка", mood: "музыкальная шкатулка: нежная колыбельная", cr: "«Music-box Gentle2», PeriTune (peritune.com), CC BY 4.0" },
  { id: "cap_mus_8", n: "Серебристый свет", mood: "гитара и тихий фон: медленный покой", cr: "«Silver Blue Light», Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_9", n: "Дом", mood: "акустические инструменты: ровный уютный покой", cr: "«Wholesome», Kevin MacLeod (incompetech.com), CC BY 4.0" },
  { id: "cap_mus_10", n: "Вальс плюшевого медведя", mood: "флейта и колокольчики: колыбельная", cr: "«Teddy Bear Waltz», Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_11", n: "Мечтатель", mood: "фортепиано: мягкая мечта", cr: "«Dreamer», Kevin MacLeod (incompetech.com), CC BY 3.0" },
  { id: "cap_mus_12", n: "С заботой", mood: "фортепиано: бережно и тихо", cr: "«Avec Soin», Kevin MacLeod (incompetech.com), CC BY 3.0" }
];
var TRACK_SEC = 170, TRACK_MIN = 35;
function bank(id) { return LAB.Bank && LAB.Bank.has && LAB.Bank.has(id); }
function tracks() { return LAB.CAP_TRACKS.filter(function (t) { return bank(t.id); }); }

/* ════════ ВОССТАНОВЛЕНИЕ ════════
   В капсуле раствор кормит, и голод не растёт. Спите — восстанавливается
   всё (четыре часа — полностью); слушаете или читаете — здоровье и
   энергия так же, бодрость втрое медленнее, нервы успокаиваются. */
function recover(min, asleep) {
  var g = G(), b = g.body;
  if (!b) return;
  var f0 = b.food;
  gm().advanceTime(min, true);
  b.food = Math.min(100, f0 + min / 40);
  /* (3.5) пока на этаже тревога или каратели идут по следу, капсула только кормит:
     иначе посреди погони в ней отлёживались бы страницами рассказов и получасами
     с закрытыми глазами (сон в такое время и не начнётся — sleep) */
  var why = gm().restBlock ? gm().restBlock() : null;
  if (why) {
    inCap.min += min;
    if (!inCap.noRest) { inCap.noRest = 1; sayq("Пока машины ОКО ищут вас, капсула сил не восстанавливает: раствор только кормит."); }
    UIx("refresh");
    return;
  }
  var deep = LAB.ach && LAB.ach.has("sleeper") ? 1.25 : 1; /* умение «Глубокий сон» */
  g.hp = Math.min(g.hpMax, g.hp + Math.ceil(g.hpMax * min * deep / 240));
  g.en = Math.min(g.enMax, g.en + Math.ceil(g.enMax * min * deep / 240));
  b.wake = Math.min(100, b.wake + min / (asleep ? 2.4 : 7));
  b.neuro = Math.max(0, b.neuro - min * (asleep ? 1 : 0.6));
  b.tox = Math.max(0, b.tox - min / (asleep ? 6 : 10)); /* и ещё — сам сон (bodyMinutes) */
  if (asleep) { b.rad = Math.max(0, (b.rad || 0) - min / 30); g.st.slow = 0; g.st.deaf = 0; }
  b.lv = {};
  inCap.min += min;
  UIx("refresh");
}
/* (3.7, нелогичность) Полчаса с закрытыми глазами в капсуле — не меньше, чем на железной койке
   (fixtures_data.js, bunk: здоровье 0,18, бодрость 20, нервы −14): мягкая капсула — 0,2, 22, −16;
   прежде полчаса в капсуле давали меньше койки. Счёт отдыха общий с обстановкой (fixtures.js,
   restK, раз в час — в полную силу): прилегли недавно — к тому, что капсула даёт сама (recover,
   как при чтении), прибавляется лишь доля. Вернёт эту долю в процентах (0 — в полную силу). */
var LIE = { m: 30, hp: 0.2, wake: 22, neuro: -16 };
function lie() {
  var g = G(), b = g.body, t0 = (g.day || 0) * 1440 + (g.min || 0);
  var rk = g.restAt == null ? 1 : Math.max(0, Math.min(1, (t0 + LIE.m - g.restAt) / 60));
  var hp0 = g.hp, w0 = b ? b.wake : 0, n0 = b ? b.neuro : 0;
  recover(LIE.m, false);
  if (!b) return 0;
  var hpW = Math.max(1, Math.round(Math.max(5, g.hpMax * LIE.hp) * rk));
  if (g.hp - hp0 < hpW) g.hp = Math.min(g.hpMax, hp0 + hpW);
  if (b.wake - w0 < LIE.wake * rk) b.wake = Math.min(100, w0 + LIE.wake * rk);
  if (n0 - b.neuro < -LIE.neuro * rk) b.neuro = Math.max(0, n0 + LIE.neuro * rk);
  g.restAt = (g.day || 0) * 1440 + (g.min || 0);
  UIx("refresh");
  return rk < 1 ? Math.max(1, Math.round(rk * 100)) : 0;
}
function statusLine() {
  var g = G(), b = g.body || {};
  return "Здоровье " + g.hp + " из " + g.hpMax + ", энергия " + g.en + " из " + g.enMax + ", бодрость " + Math.round(b.wake) + (b.rad >= 1 ? ", облучение " + Math.round(b.rad) : "") + (b.tox >= 5 ? ", токсины " + Math.round(b.tox) : "") + ". На часах комплекса " + gm().clock() + ".";
}

/* ════════ В КАПСУЛЕ ════════ */
var inCap = { o: null, min: 0, t0: 0 };
function enter(o) {
  if (LAB.combat && LAB.combat.danger()) { say("Нельзя ложиться: рядом враги."); return; }
  UIx("closeAll");
  inCap = { o: o, min: 0, t0: Date.now(), hpIn: G().hp };
  gm().paused = true;
  A("rest");
  G().stats.capsules = (G().stats.capsules || 0) + 1;
  ev("capsule", 1);
  var p = bindPrice(G().L, G().F);
  say("Вы ложитесь в капсулу. Крышка мягко опускается, гул коридора стихает, внутри пахнет тёплым пластиком и мятой. " + (boundHere(o) ? "Вы привязаны к этой капсуле: если погибнете, вернётесь сюда." : "Привязаться к ней, чтобы возрождаться здесь, стоит " + p + " " + pl(p, "кредит", "кредита", "кредитов") + ": первый пункт меню."), { interrupt: true });
  setTimeout(function () { if (inCap.o === o) menu(); }, 1200);
}
/* ── привязка (1.5): возрождение у этой капсулы — за кредиты ──
   Цена растёт каждые десять этажей вглубь: этажи 1–10 первого уровня —
   4 кредита, 11–20 — 8, на втором уровне — 12 и 16 и так далее. */
/* (2.2) по режиму сложности: лёгкий — дешевле, сложные — дороже и круче растёт */
function bindPrice(L, F) { var dk = LAB.dk(), n = Math.floor(LAB.depth(L, F) / 10); return Math.max(1, Math.round(4 * (dk.price || 1) * (1 + n * (dk.pgrow || 1)))); }
function boundHere(o) {
  var cp = G().checkpoint;
  return !!(cp && cp.cap && cp.L === G().L && cp.F === G().F && cp.cap === o.id);
}
function bind() {
  var o = inCap.o, g = G(); if (!o) return;
  if (boundHere(o)) { say("Вы уже привязаны к этой капсуле."); return; }
  var p = bindPrice(g.L, g.F);
  if ((g.credits || 0) < p) { LAB.UI.error(); say("Не хватает кредитов: привязка здесь стоит " + p + ", у вас " + (g.credits || 0) + ". Без привязки, если погибнете, «Эхо» вернёт вас к началу уровня."); return; }
  g.credits -= p;
  g.checkpoint = { L: g.L, F: g.F, x: g.x, y: g.y, cap: o.id }; /* возрождаться — там, где вы стоите у капсулы */
  A("play", "term_ok");
  ev("bind", 1);
  say("Капсула считала ваш браслет и запомнила вас. Списано " + p + " " + pl(p, "кредит", "кредита", "кредитов") + ", осталось " + g.credits + ". Если погибнете на этом уровне, «Эхо» вернёт вас сюда. Прежняя привязка снята.");
  gm().journal("Привязка к капсуле восстановления: уровень " + g.L + ", этаж " + g.F + ", " + p + " " + pl(p, "кредит", "кредита", "кредитов") + ".");
}
function menu(focus, intro) {
  var o = inCap.o;
  if (!o) return;
  var build = function () { return menuItems(); };
  UIx("menu", "Капсула восстановления", build(), { keep: true, rebuild: build, focus: focus || 0, intro: intro || statusLine(), onClose: function () { if (inCap.o) leave(true); } });
}
/* Окно сверху — заново по своему списку (новые пункты, например «Остановить музыку»), когда
   перемены пришли не от пункта окна (сон, музыка). (3.5) Окно, чей пункт сам что-то изменил,
   собирается заново в ui.js (activate) — здесь его не пересобирают второй раз. */
function refreshTop() { if (LAB.ui && LAB.ui.rebuildTop) LAB.ui.rebuildTop(); }
/* Сказать после того, как окно объявит себя. */
function later(t) { setTimeout(function () { LAB.safe(function () { sayq(t); }); }, 40); }
function menuItems() {
  var items = [], o = inCap.o, bp = bindPrice(G().L, G().F);
  if (o && !boundHere(o)) items.push({ label: "Привязаться к капсуле, чтобы возрождаться здесь: " + bp + " " + pl(bp, "кредит", "кредита", "кредитов") + " (у вас " + (G().credits || 0) + ")", keep: true, fn: bind });
  var need = G().weapons.filter(function (w) { return chargeable(w) && w.charge < w.cap; });
  /* (2.6) в тесном помещении аптечному автомату места не нашлось — аптечный отсек есть в самой капсуле */
  var fl = CUR() && CUR().fl, vendHere = !!(o && fl && fl.objs.some(function (x) { return x.type === "medvend" && x.room === o.room; }));
  if (o && !vendHere && LAB.medic) items.push({ label: "Аптечный отсек капсулы: аптечки и энергобатареи", fn: function () { LAB.medic.vendMenu(null); } });
  items.push({ label: need.length ? "Зарядить оружие за кредиты: " + (need.length === 1 ? cr(chargePrice(need[0])) : "от " + cr(Math.min.apply(null, need.map(chargePrice)))) : "Зарядить оружие за кредиты: всё заряжено", fn: chargeMenu });
  items.push({ label: "Спать", fn: sleepMenu });
  if (playing) items.push({ label: "Остановить музыку: «" + playing.t.n + "»", keep: true, fn: function () { stopTrack(false); } });
  items.push({ label: "Послушать музыку", fn: musicMenu });
  items.push({ label: "Почитать рассказы с поверхности", fn: function () { shelf("surface"); } });
  items.push({ label: "Почитать «Библиотеку проектов»", fn: function () { shelf("projects"); } });
  items.push({ label: "Включить радио поверхности", fn: function () { shelf("radio"); } });
  items.push({ label: "Видеоархив капсулы", fn: function () { shelf("video"); } });
  items.push({ label: "Полежать с закрытыми глазами: полчаса", keep: true, fn: function () {
    var why = gm().restBlock ? gm().restBlock() : null; /* (3.5) как и сон: в тревогу — не до покоя */
    if (why) { LAB.UI.error(); say(why); return; }
    var part = lie(); A("play", "capsule_hum", { gain: 0.5 }); say("Вы лежите, слушая ровный гул капсулы. Прошло полчаса. " + (part ? "Вы отдыхали недавно: полежать помогло лишь на " + part + " процентов. " : "") + statusLine()); } });
  items.push({ label: "Состояние тела", keep: true, fn: function () { gm().bodyStatus(); } });
  if (o && boundHere(o)) items.push({ label: "Вы привязаны к этой капсуле: если погибнете, вернётесь сюда", info: true, keep: true, fn: function () { say("Вы привязаны к этой капсуле. Погибнете на этом уровне — «Эхо» вернёт вас сюда. Привязка к другой капсуле снимет эту."); } });
  items.push({ label: "Откинуть крышку и выйти", fn: function () { leave(false); } });
  return items;
}
function leave(byClose) {
  var o = inCap.o; if (!o) return;
  stopTrack(true);
  inCap.o = null;
  gm().paused = false;
  if (!byClose) UIx("closeAll");
  A("play", "capsule_close", { rate: 1.15, gain: 0.8 });
  var t = inCap.min;
  say("Вы откидываете крышку и выбираетесь наружу. " + (t ? "В капсуле прошло " + hm(t) + ". " : "") + statusLine(), { interrupt: true });
  gm().journal("Капсула восстановления: уровень " + G().L + ", этаж " + G().F + (t ? ", " + hm(t) : "") + ".");
  if (LAB.atmos && LAB.atmos.music) LAB.atmos.music("game");
  gm().autosave();
  UIx("refresh");
}

/* ── (2.6) зарядка оружия от капсулы — за кредиты ──
   Капсула питается от сети этажа и заряжает оружие на батареях и зарядах
   (энергетическое, магнетронное, позитронное и другие), но не патроны.
   Платите только за недостающий заряд. Полная зарядка дороже, чем больше
   ёмкость оружия и чем выше его ступень и уровень (марка); с глубиной и по
   режиму сложности цена растёт, как у прилавков (priceK). У маленького
   бластера первых уровней полная зарядка чуть дешевле энергобатареи, у
   мощного оружия глубин — дороже: батарея всегда даёт полный заряд. */
function cr(n) { return n + " " + pl(n, "кредит", "кредита", "кредитов"); }
/* (3.7, нелогичность) антивещество и кварки от сети не набрать: позитронный заряд делают на
   позитронной установке, кварковую капсулу — там же, где её нашли */
var NO_GRID = { positron: 1, i_quarkcell: 1 };
function chargeable(w) { return !!w && !!w.ammo && w.ammo !== "none" && !!LAB.AMMO[w.ammo] && !(LAB.physAmmo && LAB.physAmmo(w.ammo)) && !NO_GRID[w.ammo] && w.cap > 0; }
function chargeFull(w) {
  var a = LAB.AMMO[w.ammo], mark = LAB.weaponMark ? LAB.weaponMark(w.rank, w.lvl) : 1 + (w.rank || 0);
  return (a.price || 30) * (gm().priceK ? gm().priceK() : 1) * 0.85 * Math.sqrt(w.cap / 30) * (1 + 0.015 * (mark - 1));
}
function chargePrice(w) { var miss = Math.max(0, w.cap - (w.charge || 0)); return miss ? Math.max(2, Math.round(chargeFull(w) * miss / w.cap)) : 0; }
function chargeOne(w, quiet) {
  var g = G(), p = chargePrice(w);
  if (!p) { if (!quiet) say(capital(w.name) + ": заряд и так полный."); return 0; }
  if ((g.credits || 0) < p) { LAB.UI.error(); say("Не хватает кредитов: зарядка — " + cr(p) + ", у вас " + (g.credits || 0) + "."); return -1; }
  g.credits -= p; w.charge = w.cap;
  if (!quiet) { A("play", w.ammo === "magnetron" ? "w_reload_m" : w.ammo === "positron" ? "w_reload_p" : "w_reload_e"); say(capital(w.name) + (w.g === "f" ? " заряжена" : w.g === "n" ? " заряжено" : " заряжен") + " полностью: " + w.cap + " " + pl(w.cap, "выстрел", "выстрела", "выстрелов") + ". Списано " + cr(p) + ", осталось " + g.credits + "."); }
  return p;
}
function chargeAll() {
  var g = G(), need = g.weapons.filter(function (w) { return chargeable(w) && w.charge < w.cap; });
  var tot = need.reduce(function (s2, w) { return s2 + chargePrice(w); }, 0);
  if (!need.length) { say("Всё оружие заряжено."); return; }
  if ((g.credits || 0) < tot) { LAB.UI.error(); say("Не хватает кредитов: зарядить всё — " + cr(tot) + ", у вас " + (g.credits || 0) + ". Зарядите что-то одно."); return; }
  need.forEach(function (w) { chargeOne(w, true); });
  A("play", "w_reload_e");
  say("Заряжено оружие: " + need.length + ". Списано " + cr(tot) + ", осталось " + g.credits + ".");
}
/* st — зарядная станция в комнате: тот же обработчик и те же цены, что у
   капсулы, и ещё зарядка энергобатареи по цене аптечного автомата. */
function chargeItems(st) {
  var g = G(), items = [], all = g.weapons.filter(chargeable), need = all.filter(function (w) { return w.charge < w.cap; });
  var who = st ? "станция" : "капсула";
  items.push({ label: "У вас " + cr(g.credits || 0) + ". Платите только за недостающий заряд.", info: true, keep: true, fn: function () { say("У вас " + cr(G().credits || 0) + "."); } });
  need.forEach(function (w) { items.push({ label: capital(gm().weaponLine(w)) + ". Зарядить полностью — " + cr(chargePrice(w)), keep: true, fn: function () { chargeOne(w); } }); });
  if (need.length > 1) items.push({ label: "Зарядить всё оружие — " + cr(need.reduce(function (s2, w) { return s2 + chargePrice(w); }, 0)), keep: true, fn: function () { chargeAll(); } });
  if (!need.length) items.push({ label: all.length ? "Всё оружие заряжено" : "Оружия на батареях нет: " + who + " заряжает только его, не патроны", info: true, keep: true, fn: function () { say(all.length ? "Всё оружие заряжено." : capital(who) + " заряжает только оружие на батареях."); } });
  if (g.weapons.some(function (w) { return w && NO_GRID[w.ammo] && w.charge < w.cap; })) items.push({ label: "Позитронные заряды и кварковые капсулы от сети не набрать: антивещество делают на позитронной установке", info: true, keep: true, fn: function () { say("Позитронные заряды и кварковые капсулы от сети не набрать: антивещество делают на позитронной установке."); } });
  if (st && LAB.medic && LAB.medic.vendPrice) {
    var pb = LAB.medic.vendPrice("ammo:energy");
    items.push({ label: "Зарядить энергобатарею — " + cr(pb) + ". Батарей у вас: " + (g.ammo.energy || 0), keep: true, fn: function () { gm().buy("ammo:energy", pb); } });
  }
  items.push({ label: "Назад", fn: function () {} });
  return items;
}
function chargeMenu(st) {
  var build = function () { return chargeItems(st); };
  UIx("menu", st ? "Зарядная станция" : "Зарядка оружия", build(), { keep: true, rebuild: build, intro: st
    ? "Станция заряжает оружие от сети этажа по тем же ценам, что и капсула: чем мощнее и ёмче оружие и чем глубже этаж, тем дороже."
    : "Капсула заряжает оружие от сети этажа: чем мощнее и ёмче оружие и чем глубже этаж, тем дороже." });
}
function capital(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }

/* ── сон: варианты и сны-истории ── */
var SLEEP = [
  { min: 60, n: "Вздремнуть: час", d: "Восстановится четверть здоровья и энергии, бодрость заметно прибавится." },
  { min: 240, n: "Поспать: четыре часа", d: "Здоровье, энергия и бодрость — полностью." },
  { min: 480, n: "Выспаться: восемь часов", d: "Здоровье, энергия и бодрость — полностью, и следующие шесть часов бодрость падает вдвое медленнее." },
  { min: 720, n: "Лечебный сон: двенадцать часов", d: "Всё, что даёт восьмичасовой сон; и ещё капсула выводит токсины, заметно снижает облучение, снимает отравление и кровотечение." }
];
function sleepMenu() {
  var items = SLEEP.map(function (s) { return { label: s.n + ". " + s.d, fn: function () { sleep(s); } }; });
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Сон", items);
}
function sleep(s) {
  /* (3.5) часы сна пролетают разом, а машины ОКО не ждут: в тревогу, пока ОКО её не
     сняло, и под шагами карателей — не уснуть (как и отдыхать на обстановке) */
  var why = gm().restBlock ? gm().restBlock() : null;
  if (why) { LAB.UI.error(); say(why.replace("Не до отдыха", "Не до сна")); return; }
  UIx("closeTop", true);
  stopTrack(true);
  var g = G(), b = g.body;
  var dream = pickDream();
  recover(s.min, true);
  g.restAt = (g.day || 0) * 1440 + (g.min || 0); /* (3.6) только что выспались — стул сразу после капсулы даст лишь долю отдыха (fixtures.js, restK) */
  if (s.min >= 240) { g.hp = g.hpMax; g.en = g.enMax; b.wake = 100; b.neuro = 0; }
  if (s.min >= 480) g.st.restedMin = 360;
  /* (3.7, нелогичность) отравление и кровотечение снимает лечебный сон, как и обещано в пункте:
     прежде их снимал любой сон от четырёх часов */
  if (s.min >= 720) { b.tox = 0; b.rad = Math.max(0, (b.rad || 0) - 30); g.st.poison = 0; g.st.bleed = 0; }
  gm().bodyWarn();
  G().stats.sleeps = (G().stats.sleeps || 0) + 1;
  ev("sleep", s.min);
  A("play", "capsule_hum", { gain: 0.45 });
  var wake = "Вы просыпаетесь. Прошло " + hm(s.min) + ". " + statusLine() + (LAB.chem ? LAB.chem.capsuleSleep(s.min) : ""); /* (3.0) капсула фильтрует мутаген */
  if (!dream) { refreshTop(); say("Вы засыпаете без снов. " + wake); return; }
  (G().dreams = G().dreams || {})[dream.id] = 1;
  ev("dream", 1);
  var title = "Сон: «" + dream.t + "»";
  reader(title, dream.x, { closeLabel: "Проснуться", intro: "Вы засыпаете. Вам снится сон.", onClose: function () { later(wake); } });
}
/* Какой сон приснится: кошмар — если облучены, отравлены или на этаже тревога; странный — глубже; спокойный — чаще. */
function pickDream() {
  var list = (TX().dreams || []).filter(function (d) { return (d.minL || 1) <= G().L; });
  if (!list.length) return null;
  var b = G().body || {}, lv = LAB.oko ? LAB.oko.level() : 0;
  var mood = (b.rad >= 45 || b.tox >= 50 || lv >= 3 || Math.random() < 0.15) ? "nightmare" : (Math.random() < (G().L > 10 ? 0.4 : 0.2) ? "strange" : "calm");
  var pool = list.filter(function (d) { return d.mood === mood; });
  if (!pool.length) pool = list;
  var seen = G().dreams || {}, fresh = pool.filter(function (d) { return !seen[d.id]; });
  var from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/* ── музыка ── */
var playing = null;
function musicMenu() {
  var list = tracks(), items = [];
  if (!list.length) { items.push({ label: "Фонотека капсулы пуста", info: true, keep: true, fn: function () {} }); }
  if (LAB.settings && !LAB.settings.music) items.push({ label: "Музыка выключена в настройках: громкость музыки — в разделе «Настройки», «Громкость»", info: true, keep: true, fn: function () {} });
  list.forEach(function (t) { items.push({ label: "«" + t.n + "» — " + t.mood + (playing && playing.t === t ? " — играет" : ""), fn: function () { playTrack(t); } }); });
  if (list.length > 1) items.push({ label: "Всё подряд: вся фонотека, одна запись за другой", fn: function () { playAll(list); } });
  items.push({ label: "Об этих записях: авторы и лицензии", keep: true, fn: function () { say("Записи фонотеки — свободные. " + list.map(function (t) { return "«" + t.n + "»: " + t.cr; }).join(". ") + "."); } });
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Фонотека капсулы", items);
}
function playTrack(t, queue) {
  stopTrack(true);
  if (LAB.atmos && LAB.atmos.stopMusic) LAB.atmos.stopMusic();
  var h = LAB.Sound && LAB.Sound.loop ? LAB.Sound.loop("capmus", t.id, { bus: "music", gain: 1, fadeIn: 1.2, xfade: 1 }) : null;
  playing = { t: t, h: h, t0: Date.now(), q: queue || null };
  playing.timer = setTimeout(function () { LAB.safe(trackEnd); }, TRACK_SEC * 1000);
  /* (3.5) в счёт вехи — каждая запись один раз: одну и ту же гонять по кругу не в счёт */
  if (!(G().heard || {})[t.id]) ev("music", 1);
  (G().heard = G().heard || {})[t.id] = 1;
  if (Object.keys(G().heard).length >= tracks().length) ev("allmusic", 1);
  if (!queue || queue.first) {
    /* из фонотеки — обратно в меню капсулы: под музыку можно читать и спать */
    var w = LAB.ui && LAB.ui.layer ? LAB.ui.layer() : null;
    if (w && w !== "screen" && w.title === "Фонотека капсулы") UIx("closeTop", true);
    refreshTop();
    say("Играет «" + t.n + "». Вы в меню капсулы: под музыку можно читать, слушать радио или просто лежать." + (LAB.settings && !LAB.settings.music ? " Но музыка выключена в настройках — включите громкость музыки." : ""));
  } else refreshTop();
}
function playAll(list) { var q = { list: list.slice(), i: 0, first: true }; playTrack(q.list[0], q); q.first = false; }
/* Запись доиграла: время в капсуле прошло, отдых засчитан; во «Всё подряд» — следующая. */
function trackEnd() {
  if (!playing) return;
  var p = playing;
  stopTrack(false, true);
  if (p.q && p.q.i + 1 < p.q.list.length && inCap.o) { p.q.i++; playTrack(p.q.list[p.q.i], p.q); sayq("Следующая запись: «" + p.q.list[p.q.i].n + "»."); }
}
/* Остановить: засчитать прослушанное (минуты по доле прослушанного). */
function stopTrack(silent, ended) {
  if (!playing) return;
  var p = playing; playing = null;
  clearTimeout(p.timer);
  if (p.h && p.h.stop) p.h.stop(ended ? 2 : 1);
  var part = Math.min(1, (Date.now() - p.t0) / (TRACK_SEC * 1000));
  var min = Math.round(TRACK_MIN * part);
  if (min > 0 && inCap.o) recover(min, false);
  if (!silent) say((ended ? "Запись «" + p.t.n + "» доиграла." : "Музыка остановлена.") + (min > 0 ? " Прошло " + hm(min) + ". " + statusLine() : ""));
  if (!inCap.o && LAB.atmos && LAB.atmos.music) LAB.atmos.music("game");
}

/* ── полки рассказов, радио и видео ── */
var SHELF = {
  surface: { title: "Рассказы с поверхности", k: "surface", per: 3, page: 5, intro: "Подборка в памяти капсулы: что пишут и рассказывают наверху." },
  projects: { title: "Библиотека проектов", k: "projects", per: 3, page: 5, intro: "Рассказы о проектах — задуманных и воплощённых. Отдых для головы: к объекту они не относятся." },
  radio: { title: "Радио поверхности", k: "radio", per: 3, page: 6, intro: "Приёмник капсулы ловит поверхность по кабелю магистрали снабжения." },
  video: { title: "Видеоархив капсулы", k: "video", per: 2, page: 6, intro: "Экран капсулы показывает записи, «Эхо» описывает, что на экране, и передаёт голоса." }
};
/* Что лежит в этой капсуле: своё у каждой капсулы каждого этажа; непрочитанное — вперёд. */
function selection(kind) {
  var S = SHELF[kind], all = (TX()[S.k] || []).filter(function (q) { return (q.minL || 1) <= G().L; });
  if (!all.length) return [];
  var o = inCap.o, r = LAB.Rng(G().seed, "cap:" + kind + ":" + G().L + "-" + G().F + ":" + (o ? o.id : ""));
  var order = all.slice(); r.shuffle(order);
  var read = G().capRead || {};
  /* свежие (глубже — те, что ближе по времени) чуть вперёд */
  order.sort(function (a, b) { return (read[a.id] ? 1 : 0) - (read[b.id] ? 1 : 0) || ((b.minL || 1) > G().L - 20 ? 1 : 0) - ((a.minL || 1) > G().L - 20 ? 1 : 0); });
  return order.slice(0, Math.min(S.per, order.length));
}
function shelf(kind) {
  var S = SHELF[kind], list = selection(kind), read = G().capRead || {}, items = [];
  if (kind === "radio") A("play", "radio", { gain: 0.6 });
  if (!list.length) items.push({ label: "Здесь пока пусто", info: true, keep: true, fn: function () {} });
  list.forEach(function (q) {
    items.push({ label: (kind === "radio" ? "Передача " : kind === "video" ? "Запись " : "") + "«" + q.t + "»" + (q.a ? ", " + q.a : "") + (read[q.id] ? " — уже слышали" : ""), fn: function () { open(kind, q); } });
  });
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", S.title, items, { intro: S.intro });
}
function open(kind, q) {
  var S = SHELF[kind];
  var w = LAB.ui && LAB.ui.layer ? LAB.ui.layer() : null;
  if (w && w !== "screen" && w.title === S.title) UIx("closeTop", true);
  (G().capRead = G().capRead || {})[q.id] = 1;
  ev(kind === "projects" ? "project" : kind, 1);
  if (kind === "radio") A("play", "radio", { gain: 0.5 });
  var title = (kind === "video" ? "Видеозапись" : kind === "radio" ? "Радио" : "Рассказ") + ": «" + q.t + "»";
  reader(title, q.x, { id: kind + ":" + q.id, intro: q.a ? q.a + "." : "", perPage: S.page, onClose: function () { later("Вы откладываете " + (kind === "video" ? "экран" : kind === "radio" ? "приёмник" : "чтение") + ". " + statusLine()); } });
}
/* Читалка: по странице на пункт, свайп вправо — дальше, влево — назад; за
   каждую новую страницу — несколько минут отдыха; «Закрыть» — в меню капсулы. */
function reader(title, text, opts) {
  opts = opts || {};
  var pages = String(text || "").split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
  if (!pages.length) pages = [String(text || "")];
  var n = pages.length, seen = {};
  var items = pages.map(function (p, i) { return { label: "Страница " + (i + 1) + " из " + n + ". " + p, keep: true, fn: function () { say(p, { read: true }); } }; });
  items.push({ label: opts.closeLabel || "Закрыть", close: true, fn: function () {} });
  A("play", "paper_turn", { gain: 0.6 });
  UIx("menu", title, items, {
    intro: (opts.intro ? opts.intro + " " : "") + (n > 1 ? LAB.K("Свайп вправо — следующая страница, влево — предыдущая.", "Стрелка вниз — следующая страница, вверх — предыдущая.") : ""),
    onFocus: function (i) {
      if (i >= n || seen[i]) return;
      seen[i] = 1;
      if (i > 0) A("play", "paper_turn", { gain: 0.45 });
      if (opts.perPage && inCap.o) recover(opts.perPage, false);
      if (i === n - 1) { var re = G().readEnd = G().readEnd || {}, rid = opts.id || title; if (!re[rid]) { re[rid] = 1; ev("readend", 1); } } /* (3.5) дочитанное — в счёт один раз */
    },
    onClose: function () { LAB.safe(function () { if (opts.onClose) opts.onClose(); }); }
  });
}

/* Игра закончилась или ушли в главное меню — музыка капсулы стихает. */
function reset() { stopTrack(true); inCap.o = null; }
LAB.capsule = {
  menu: enter, leave: function () { leave(false); }, reset: reset, bindPrice: bindPrice, boundHere: boundHere, bind: bind,
  chargeable: chargeable, chargePrice: chargePrice, chargeOne: chargeOne, chargeAll: chargeAll, chargeMenu: chargeMenu, chargeItems: chargeItems,
  _sleep: function (i) { sleep(SLEEP[i]); }, _shelf: shelf, _open: open, _selection: selection, _tracks: tracks, _playing: function () { return playing; }, _state: function () { return inCap; }
};
})();
