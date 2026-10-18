/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — достижения и награды (1.5).
   Всё, что делает игрок, считается: этажи и уровни, кабинеты и записки,
   победы, покупки и заказы с поверхности, отдых, тренировки, урожай,
   жетоны погибших, сны и музыка в капсулах. За вехи — награды: кредиты,
   опыт, вещи, прибавка к здоровью и энергии и постоянные умения
   («Чутьё»: при обыске находится больше; «Свинцовая кожа»: облучение
   слабее; «Тихий шаг»: вас хуже слышно; «Твёрдая рука» — меткость;
   «Глубокий вдох» — газ слабее; «Купец» — скупка дороже; «Глубокий сон»
   — капсула восстанавливает больше; «Полевой медик» — аптечки лечат
   сильнее; «Сапёр» — ловушки взводятся быстрее, чужие обезвреживаются
   легче). Список и успехи — в инвентаре, «Достижения». Скрытые вехи
   открываются, когда до них дойдёте.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game && LAB.game.G; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }

/* ── умения ── */
var PERKS = {
  searcher: { n: "Чутьё", d: "при обыске чаще находится что-нибудь ещё" },
  lead: { n: "Свинцовая кожа", d: "облучение копится на десятую часть медленнее" },
  quiet: { n: "Тихий шаг", d: "вас слышно на шаг ближе, чем раньше" },
  sharp: { n: "Твёрдая рука", d: "усталость и яды меньше сбивают прицел" },
  lungs: { n: "Глубокий вдох", d: "газ отравляет на четверть слабее" },
  trader: { n: "Купец", d: "скупка платит на десятую часть больше" },
  sleeper: { n: "Глубокий сон", d: "отдых в капсуле восстанавливает больше" },
  medic: { n: "Полевой медик", d: "аптечки лечат на шестую часть сильнее" },
  sapper: { n: "Сапёр", d: "ловушки взводятся вдвое быстрее, чужие обезвреживаются на сигнал короче, а свои бьют по вам вдвое слабее" }
};
/* ── вехи ──
   ev — какое событие считается, need — сколько нужно; max — веха по наибольшему
   значению (уровень), а не по сумме; rew — награда; hidden — пока не дошли, не видно. */
var A = [
  { id: "floor5", n: "Первые шаги вниз", d: "Побывать на пяти этажах", ev: "floor", need: 5, rew: { cr: 30, xp: 20 } },
  { id: "floor25", n: "Путник лестниц", d: "Побывать на двадцати пяти этажах", ev: "floor", need: 25, rew: { cr: 80, en: 2 } },
  { id: "floor100", n: "Тот, кто спускается", d: "Побывать на сотне этажей", ev: "floor", need: 100, rew: { hp: 5, xp: 150 } },
  { id: "floor300", n: "Колодец без дна", d: "Побывать на трёхстах этажах", ev: "floor", need: 300, rew: { hp: 10, en: 4 }, hidden: true },
  { id: "lvl11", n: "Под Ядром", d: "Спуститься ниже «Ковчега»", ev: "level", max: true, need: 11, rew: { cr: 150, xp: 100 }, hidden: true },
  { id: "lvl21", n: "Молодой мир", d: "Дойти до Колыбели", ev: "level", max: true, need: 21, rew: { cr: 250, en: 3 }, hidden: true },
  { id: "lvl41", n: "По ту сторону стекла", d: "Дойти до Отражения", ev: "level", max: true, need: 41, rew: { cr: 350, hp: 5 }, hidden: true },
  { id: "lvl61", n: "Город машин", d: "Дойти до Механизма", ev: "level", max: true, need: 61, rew: { cr: 450, perk: "sleeper" }, hidden: true },
  { id: "lvl81", n: "Там, где миры касаются", d: "Дойти до Истока", ev: "level", max: true, need: 81, rew: { cr: 600, hp: 10 }, hidden: true },
  { id: "room30", n: "Кабинет за кабинетом", d: "Зайти в тридцать кабинетов у коридоров", ev: "room", need: 30, rew: { cr: 40, item: ["medkit_s", 2] } },
  { id: "room200", n: "Двести дверей", d: "Зайти в двести кабинетов у коридоров", ev: "room", need: 200, rew: { perk: "searcher", xp: 120 } },
  { id: "room1000", n: "Ключник", d: "Зайти в тысячу кабинетов", ev: "room", need: 1000, rew: { item: ["lockpick", 5], hp: 5 }, hidden: true },
  { id: "note25", n: "Читатель чужих записок", d: "Собрать двадцать пять записок и документов", ev: "note", need: 25, rew: { xp: 60, cr: 40 } },
  { id: "note150", n: "Архивариус", d: "Собрать сто пятьдесят записок и документов", ev: "note", need: 150, rew: { xp: 200, en: 2 } },
  { id: "book10", n: "Книжный червь", d: "Прочитать десять книг с полок", ev: "book", need: 10, rew: { xp: 80, item: ["herbtea", 3] } },
  { id: "story8", n: "Голоса сверху", d: "Дослушать восемь рассказов, передач и записей в капсулах", ev: "readend", need: 8, rew: { perk: "sleeper", xp: 60 } },
  { id: "dream8", n: "Сновидец", d: "Увидеть восемь снов в капсулах", ev: "dream", need: 8, rew: { xp: 80, item: ["stim", 1] } },
  { id: "music", n: "Музыка под горой", d: "Послушать в капсулах двенадцать мелодий", ev: "music", need: 12, rew: { xp: 60, cr: 50 } },
  { id: "kill1", n: "Первая схватка", d: "Победить первого врага", ev: "kill", need: 1, rew: { xp: 10 } },
  { id: "kill100", n: "Охотник", d: "Победить сотню врагов", ev: "kill", need: 100, rew: { cr: 120, item: ["medkit_l", 1] } },
  { id: "mech300", n: "Гроза машин", d: "Вывести из строя триста машин ОКО", ev: "kill_mech", need: 300, rew: { perk: "sharp", xp: 200 } },
  { id: "boss3", n: "Сильнее хозяев этажей", d: "Победить трёх стражей уровней", ev: "boss", need: 3, rew: { hp: 10, cr: 200 } },
  { id: "decon5", n: "Чистые руки", d: "Пять раз пройти дезактивацию", ev: "decon", need: 5, rew: { perk: "lead", item: ["iodine", 2] } },
  { id: "zone10", n: "Под знаком трилистника", d: "Побывать в десяти опасных зонах", ev: "zone", need: 10, rew: { item: ["antirad", 2], xp: 60 } },
  { id: "vent3", n: "Глоток воздуха", d: "Три раза выгнать газ вытяжкой", ev: "vent", need: 3, rew: { perk: "lungs" } },
  { id: "buy10", n: "Покупатель", d: "Купить десять вещей на пунктах снабжения", ev: "bought", count: true, need: 10, rew: { cr: 40 } },
  { id: "sold2000", n: "Купец", d: "Продать вещей на две тысячи кредитов", ev: "sold", need: 2000, rew: { perk: "trader" } },
  { id: "order5", n: "Посылки с поверхности", d: "Получить пять заказов со склада наверху", ev: "delivered", need: 5, rew: { cr: 60, xp: 50 } },
  { id: "salvage25", n: "Мастер на все руки", d: "Разобрать на детали двадцать пять вещей", ev: "salvage", need: 25, rew: { item: ["chip", 3], xp: 80 } },
  { id: "harvest15", n: "Огородник", d: "Собрать пятнадцать урожаев: плоды, грибы, травы, мёд", ev: "harvest", need: 15, rew: { item: ["honeybar", 3], xp: 50 } },
  { id: "train15", n: "Железная воля", d: "Пятнадцать тренировок на тренажёрах", ev: "train", need: 15, rew: { hp: 5, xp: 60 } },
  { id: "aim15", n: "Твёрдая рука", d: "Пятнадцать заходов на стрельбище", ev: "aim", need: 15, rew: { perk: "sharp", xp: 40 } },
  { id: "chess", n: "Шахматист", d: "Выиграть три партии", ev: "game_win", need: 3, rew: { xp: 60, cr: 30 } },
  { id: "hoop", n: "Пять подряд", d: "Попасть мячом в кольцо пять раз подряд", ev: "hoop5", need: 1, rew: { xp: 30 }, hidden: true },
  { id: "hide10", n: "Тише воды", d: "Десять раз затаиться под койкой или столом", ev: "hide", need: 10, rew: { perk: "quiet" } },
  { id: "cook10", n: "Горячий ужин", d: "Десять раз разогреть еду", ev: "cook", need: 10, rew: { item: ["stew", 2], xp: 30 } },
  { id: "rest20", n: "Перевести дух", d: "Двадцать раз отдохнуть на диване, койке или в кресле", ev: "rest_fx", need: 20, rew: { en: 2 } },
  { id: "cozy10", n: "Уют", d: "Десять раз отдохнуть с напитком в руках: диван, кресло или койка — и стакан из автомата", ev: "rest_drink", need: 10, rew: { xp: 40, item: ["cup_cappuccino", 2] } },
  { id: "respect10", n: "Память", d: "Десять раз почтить память погибших", ev: "respect", need: 10, rew: { xp: 80 } },
  { id: "badge10", n: "Имена наверх", d: "Передать выжившим десять жетонов погибших", ev: "badges_given", need: 10, rew: { hp: 5, perk: "medic" } },
  { id: "wish3", n: "Три монетки", d: "Бросить в фонтан три монетки", ev: "wish", need: 3, rew: { cr: 10 }, hidden: true },
  { id: "queue3", n: "Ваш номер", d: "Трижды дождаться своей очереди в Механизме", ev: "queue", need: 3, rew: { xp: 60, cr: 60 }, hidden: true },
  { id: "map10", n: "Картограф", d: "Десять раз снять схему этажа", ev: "map", need: 10, rew: { item: ["sonar", 1], xp: 40 } },
  { id: "safe10", n: "Взломщик сейфов", d: "Открыть десять сейфов", ev: "safe", need: 10, rew: { item: ["decoder", 2], cr: 80 } },
  { id: "secret10", n: "Видеть сквозь стены", d: "Найти десять тайных дверей", ev: "secret", need: 10, rew: { perk: "searcher", xp: 80 } },
  { id: "craft20", n: "Своими руками", d: "Собрать двадцать вещей у верстака", ev: "craft", need: 20, rew: { item: ["servo", 2], xp: 80 } },
  { id: "trap1", n: "Ловец", d: "Поставить первую ловушку", ev: "trap_set", need: 1, rew: { xp: 15, item: ["tr_spikes", 1] } },
  { id: "trap25", n: "Хозяин коридоров", d: "Поставить двадцать пять ловушек", ev: "trap_set", need: 25, rew: { xp: 80, item: ["tr_mine", 2] } },
  { id: "trapkill10", n: "Тихая охота", d: "Победить ловушками десять врагов", ev: "trap_kill", need: 10, rew: { cr: 80, xp: 60 } },
  { id: "trapmech25", n: "Капкан на машину", d: "Вывести из строя ловушками двадцать пять машин", ev: "trap_mech", need: 25, rew: { perk: "sapper", xp: 100 } },
  { id: "disarm5", n: "Сапёр", d: "Обезвредить пять чужих ловушек и мин", ev: "disarm", need: 5, rew: { item: ["wirecutters", 1], xp: 60 } },
  { id: "disarm25", n: "Сапёр ошибается один раз", d: "Обезвредить двадцать пять чужих ловушек и мин", ev: "disarm", need: 25, rew: { perk: "sapper", hp: 5 }, hidden: true },
  { id: "selftrap", n: "Сам себе капкан", d: "Попасться в собственную ловушку", ev: "self_trap", need: 1, rew: { xp: 5 }, hidden: true },
  { id: "bind3", n: "Свой угол", d: "Три раза привязаться к капсуле восстановления", ev: "bind", need: 3, rew: { cr: 20, xp: 20 } },
  { id: "quest10", n: "Свой среди своих", d: "Выполнить десять заданий выживших", ev: "quest", need: 10, rew: { cr: 150, en: 2 } },
  { id: "trial3", n: "Допуск получен", d: "Пройти три стенда допуска", ev: "trial", need: 3, rew: { xp: 120, hp: 5 } },
  { id: "fuse5", n: "Электрик", d: "Пять раз обесточить камеры этажа на щите", ev: "fuse", need: 5, rew: { item: ["emp", 2] } },
  { id: "search100", n: "Под каждой подушкой", d: "Обыскать сотню шкафов, ящиков и диванов", ev: "search", need: 100, rew: { perk: "searcher", cr: 50 } },
  { id: "read50", n: "Всё, что написано", d: "Прочитать пятьдесят журналов, меню, досок и тетрадей", ev: "read", need: 50, rew: { xp: 100, item: ["neuroblock", 1] } }
];
function S() {
  var g = G(); if (!g) return null;
  if (!g.ach) g.ach = { c: {}, d: {} };
  if (!g.perks) g.perks = {};
  return g.ach;
}
/* Событие: сколько прибавить (или новое значение для вех «по наибольшему»). */
function ev(name, n) {
  var s = S(); if (!s) return;
  n = n == null ? 1 : n;
  var maxT = A.some(function (a) { return a.ev === name && a.max; });
  if (maxT) s.c[name] = Math.max(s.c[name] || 0, n); else s.c[name] = (s.c[name] || 0) + n;
  if (name === "bought") s.c.bought_n = (s.c.bought_n || 0) + 1;
  check(name);
}
function progress(a) { var s = S(); if (!s) return 0; return a.count ? (s.c[a.ev + "_n"] || 0) : (s.c[a.ev] || 0); }
function check(name) {
  var s = S();
  A.forEach(function (a) {
    if (s.d[a.id] || (name && a.ev !== name)) return;
    if (progress(a) >= a.need) unlock(a);
  });
}
function unlock(a) {
  var s = S(), g = G(); if (s.d[a.id]) return;
  s.d[a.id] = 1;
  var msg = give(a.rew || {});
  if (LAB.UI && LAB.UI.fanfare) LAB.UI.fanfare(); else if (LAB.atmos) LAB.atmos.play("ui_levelup");
  LAB.say("Достижение: «" + a.n + "». " + (msg ? "Награда: " + msg + "." : ""), { interrupt: false });
  if (gm().journal) gm().journal("Достижение «" + a.n + "»" + (msg ? ": " + msg : "") + ".");
}
function give(r) {
  var g = G(), out = [];
  if (r.cr) { g.credits += r.cr; out.push(r.cr + " " + pl(r.cr, "кредит", "кредита", "кредитов")); }
  if (r.xp) { gm().gainXP(r.xp); out.push(r.xp + " опыта"); }
  if (r.hp) { g.hpMax += r.hp; g.hp += r.hp; out.push("здоровье плюс " + r.hp); }
  if (r.en) { g.enMax += r.en; g.en += r.en; out.push("энергия имплантов плюс " + r.en); }
  if (r.item && LAB.ITEMS[r.item[0]]) { g.inv[r.item[0]] = (g.inv[r.item[0]] || 0) + r.item[1]; out.push(LAB.ITEMS[r.item[0]].n.toLowerCase() + (r.item[1] > 1 ? ", " + r.item[1] + " шт." : "")); }
  if (r.perk && PERKS[r.perk]) {
    if (g.perks[r.perk]) { var cr = 60; g.credits += cr; out.push("умение «" + PERKS[r.perk].n + "» уже есть, вместо него " + cr + " кредитов"); }
    else { g.perks[r.perk] = 1; out.push("умение «" + PERKS[r.perk].n + "»: " + PERKS[r.perk].d); }
  }
  return out.join(", ");
}
function rewText(r) {
  var out = [];
  if (r.cr) out.push(r.cr + " кредитов"); if (r.xp) out.push(r.xp + " опыта"); if (r.hp) out.push("здоровье плюс " + r.hp); if (r.en) out.push("энергия плюс " + r.en);
  if (r.item && LAB.ITEMS[r.item[0]]) out.push(LAB.ITEMS[r.item[0]].n.toLowerCase());
  if (r.perk && PERKS[r.perk]) out.push("умение «" + PERKS[r.perk].n + "»");
  return out.join(", ");
}
/* Окно «Достижения»: полученные, в пути (с успехами), скрытые — числом. */
function menu() {
  var s = S(); if (!s) return;
  var got = A.filter(function (a) { return s.d[a.id]; }), open = A.filter(function (a) { return !s.d[a.id] && (!a.hidden || progress(a) > 0); });
  var hid = A.length - got.length - open.length, g = G(), items = [];
  var perks = Object.keys(g.perks || {}).filter(function (k) { return PERKS[k]; });
  items.push({ label: "Получено " + got.length + " из " + A.length + (perks.length ? ". Умения: " + perks.map(function (k) { return PERKS[k].n; }).join(", ") : ""), info: true, keep: true, fn: function () {
    LAB.say(perks.length ? perks.map(function (k) { return PERKS[k].n + " — " + PERKS[k].d; }).join(". ") + "." : "Умений пока нет: их дают некоторые достижения.");
  } });
  open.sort(function (a, b) { return progress(b) / b.need - progress(a) / a.need; });
  open.forEach(function (a) { var p = Math.min(progress(a), a.need); items.push({ label: a.n + ": " + a.d + " — " + p + " из " + a.need + ". Награда: " + rewText(a.rew || {}), keep: true, fn: function () { LAB.say(a.n + ". " + a.d + ". Сейчас " + p + " из " + a.need + "."); } }); });
  got.forEach(function (a) { items.push({ label: "Получено — «" + a.n + "»: " + a.d, keep: true, fn: function () { LAB.say("«" + a.n + "» — получено. " + a.d + "."); } }); });
  if (hid > 0) items.push({ label: "Скрытых достижений: " + hid + ". Они откроются, когда вы до них дойдёте", info: true, keep: true, fn: function () {} });
  LAB.ui.menu("Достижения", items);
}
function has(perk) { var g = G(); return !!(g && g.perks && g.perks[perk]); }
LAB.ach = { ev: ev, menu: menu, has: has, check: check, LIST: A, PERKS: PERKS, _progress: progress };
})();
