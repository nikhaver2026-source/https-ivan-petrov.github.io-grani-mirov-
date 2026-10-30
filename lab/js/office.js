/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — компьютеры и автоматы с напитками.
   Компьютерный стол: сесть за компьютер — почта сотрудника, журнал
   испытаний помещения, документы, записи камер этажа (их описывает
   «Эхо»); иногда в почте — код двери или сейфа. Кофейный автомат и
   автомат с напитками: купить за кредиты и выпить — плюс к здоровью, кофе
   бодрит. Автомат с едой: съесть сразу или взять с собой — еда утоляет
   голод и пополняет энергию имплантов.
   Тексты — lore.js.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function snd(id, fb) { if (LAB.Bank.has(id)) A("play", id); else if (fb) A("play", fb); }
function digits(c) { return String(c).split("").join(" "); }
function lore() { return LAB.LORE || {}; }

/* ════════ АВТОМАТЫ С НАПИТКАМИ ════════ */
var DRINKS = {
  coffee: { n: "Кофейный автомат", list: [
    { n: "Эспрессо", id: "cup_espresso", p: 6, hp: 8, wake: 25, x: "Маленькая чашка горького крепкого эспрессо. По телу разливается тепло, сон как рукой сняло.", s: "drink_sip" },
    { n: "Американо", id: "cup_americano", p: 5, hp: 6, wake: 18, x: "Большой стакан чёрного кофе. Пахнет почти как наверху.", s: "drink_sip" },
    { n: "Капучино", id: "cup_cappuccino", p: 9, hp: 12, wake: 15, food: 6, x: "Капучино с густой пенкой. Кто-то когда-то мечтал о таком на поверхности.", s: "drink_sip" },
    { n: "Горячий шоколад", id: "cup_hotchoc", p: 10, hp: 14, food: 10, en: 8, x: "Сладкий горячий шоколад. Руки перестают дрожать.", s: "drink_sip" },
    { n: "Чай с лимоном", id: "cup_tea", p: 4, hp: 5, wake: 8, detox: 5, x: "Чай с лимонной кислинкой. Лимон, конечно, ненастоящий.", s: "drink_sip" }
  ] },
  drinks: { n: "Автомат с напитками", list: [
    { n: "Вода «Глубинная»", id: "water", p: 3, hp: 5, detox: 8, x: "Холодная вода. Простая, честная, почти без привкуса металла.", s: "drink_gulp" },
    { n: "Газировка «Байкал»", id: "soda_baikal", p: 5, hp: 7, food: 5, wake: 5, x: "Шипучая газировка с травяным вкусом. Пузырьки щиплют язык.", s: "drink_gulp" },
    { n: "Сок «Яблочный сад»", id: "juice_apple", p: 7, hp: 10, food: 8, x: "Яблочный сок из пакета. Сад на картинке давно никто не видел.", s: "drink_gulp" },
    { n: "Энергетик «Разряд»", id: "energycan", p: 12, hp: 8, en: 15, wake: 22, tox: 4, x: "Едкий сладкий энергетик. Сердце стучит чаще, импланты отзываются гулом.", s: "drink_gulp" },
    { n: "Изотоник «Марафон»", id: "isotonic", p: 9, hp: 12, cure: true, wake: 6, detox: 6, x: "Солоноватый изотоник. Тяжесть в ногах отступает.", s: "drink_gulp" }
  ] }
};
/* (3.5) цена растёт с глубиной так же, как лечение (прежде медленнее), и — по режиму
   сложности, как у прочих торговцев */
function priceOf(d) { var dk = LAB.dk ? LAB.dk() : {}; return Math.round(d.p * (1 + (G().L - 1) * 0.15) * (dk.price || 1)); }
function healOf(d) { return Math.round(d.hp * (1 + (G().L - 1) * 0.15)); }
function machineName(o) { return DRINKS[o.type] ? DRINKS[o.type].n : "Автомат"; }
function drinkMenu(o) {
  var g = G(), st = gm().objState(o);
  snd(o.type === "coffee" ? "coffee_idle" : "vend_hum", "vend");
  if (o.broken && !st.fixed) { brokenMenu(o); return; }
  UIx("menu", machineName(o) + ". Здоровье " + g.hp + " из " + g.hpMax + ", кредитов " + g.credits, drinkItems(o), { keep: true, rebuild: function () { return drinkItems(o); } });
}
function drinkItems(o) {
  /* как у автомата с едой: выпить сразу или унести с собой — стакан с крышкой, банку, пакет */
  var items = [{ label: "Покупки", kind: "choice", options: [{ v: false, label: "выпить сразу" }, { v: true, label: "взять с собой" }], get: function () { return takeAlong; }, set: function (v) { takeAlong = v; } }];
  DRINKS[o.type].list.forEach(function (d) {
    var p = priceOf(d), h = healOf(d);
    items.push({ label: d.n + " — " + p + " " + gm().plural(p, "кредит", "кредита", "кредитов") + ", здоровье плюс " + h + (d.en ? ", энергия плюс " + d.en : "") + (d.wake ? ", бодрость плюс " + d.wake : "") + (d.food ? ", сытость плюс " + d.food : "") + (d.detox ? ", выводит токсины" : "") + (d.cure ? ", снимает замедление" : ""), keep: true, fn: function () { buyDrink(o, d); } });
  });
  items.push({ label: "Осмотреть автомат", keep: true, fn: function () { say(machineName(o) + ". " + LAB.OBJ[o.type].desc + " " + (o.type === "coffee" ? "На корпусе наклейка: «Сахар — по желанию. Желание — по графику»." : "За стеклом ряды бутылок и банок, на табло — цены в кредитах объекта.")); } });
  items.push({ label: "Отойти", fn: function () {} });
  return items;
}
function buyDrink(o, d) {
  var g = G(), p = priceOf(d);
  if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + g.credits + "."); return; }
  g.credits -= p;
  snd("vend_coin", "buy");
  setTimeout(function () { snd(o.type === "coffee" ? "coffee_brew" : "can_drop", "vend"); }, 350);
  if (takeAlong && d.id && LAB.ITEMS[d.id]) { takeDrink(o, d, "Куплено: " + d.n + "."); return; }
  drink(o, d, o.type === "coffee" ? 2600 : 1300, "Куплено: " + d.n + ".");
}
/* Напиток — в рюкзак: выпить потом из инвентаря или присев на диван, в кресло, на койку. */
function takeDrink(o, d, pre) {
  var g = G();
  g.inv[d.id] = (g.inv[d.id] || 0) + 1;
  /* (3.5) стакан помнит глубину, где его купили: лечит, как автомат той глубины (game.js, useItem);
     прежде стакан за десять кредитов с первого уровня глубоко внизу лечил, как тамошний */
  if (LAB.ITEMS[d.id] && LAB.ITEMS[d.id].cup) { g.cupL = g.cupL || {}; (g.cupL[d.id] = g.cupL[d.id] || []).push(g.L); g.cupT = g.cupT || {}; (g.cupT[d.id] = g.cupT[d.id] || []).push((g.day || 0) * 1440 + (g.min || 0)); } /* (3.7) и когда куплен: стакан остывает */
  say(pre + " " + LAB.ITEMS[d.id].n + " — в рюкзаке, раздел «Еда и напитки»" + (o.type === "coffee" ? ", под крышкой продержится горячим с полчаса" : "") + ". Выпить — " + LAB.K("инвентарь, «Еда и напитки», или присев на диван, в кресло, на койку: там напиток действует лучше.", "клавиша G или инвентарь, «Еда и напитки», или присев на диван, в кресло, на койку: там напиток действует лучше.") + " Кредитов " + g.credits + ".");
  gm().journal("Взят с собой напиток: " + d.n + ".");
  UIx("refresh");
  gm().autosaveSoon();
}
function drink(o, d, wait, pre) {
  var g = G();
  gm().paused = true;
  say(pre + (o.type === "coffee" ? " Автомат варит…" : " Банка падает в лоток."), { interrupt: false });
  gm().later(function () {
    gm().paused = false;
    if (o.type === "drinks") snd("can_open");
    setTimeout(function () { snd(d.s); }, o.type === "drinks" ? 450 : 0);
    var before = g.hp, h = healOf(d);
    g.hp = Math.min(g.hpMax, g.hp + h);
    var gained = g.hp - before, extra = "";
    if (d.en && typeof g.en === "number") { var e0 = g.en; g.en = Math.min(g.enMax, g.en + d.en); if (g.en > e0) extra += " Энергия имплантов плюс " + (g.en - e0) + "."; }
    if (d.cure && g.st) { if (g.st.slow > 0) extra += " Замедление прошло."; g.st.slow = 0; }
    var bm = gm().bodyApply ? gm().bodyApply({ wake: d.wake, food: d.food, detox: d.detox, tox: d.tox }, []) : [];
    if (bm.length) extra += " " + bm.join(" ");
    say(d.x + " " + (gained > 0 ? "Здоровье плюс " + gained + ", теперь " + g.hp + " из " + g.hpMax + "." : "Здоровье и так полное.") + extra);
    gm().journal("Выпит напиток: " + d.n + ".");
    UIx("refresh");
    gm().autosaveSoon();
  }, wait);
}
/* Сломанный автомат: по нему можно стукнуть — иногда выпадает напиток. */
function brokenMenu(o) {
  if (o.type === "coffee") { coffeeDry(o); return; }
  var st = gm().objState(o);
  var why = o.type === "coffee" ? "Табло кофейного автомата мигает: «Нет воды. Обратитесь к оператору»." : "Автомат с напитками обесточен наполовину: табло темно, внутри гудит компрессор.";
  UIx("menu", machineName(o) + " — не работает", [
    { label: "Стукнуть по автомату", fn: function () {
      st.hits = (st.hits || 0) + 1;
      snd("vend_hit", "bump_device");
      if (LAB.combat) LAB.combat.noise(5);
      if (!st.dropped && (Math.random() < 0.45 || st.hits >= 3)) {
        st.dropped = true;
        var list = DRINKS[o.type].list, d = list[Math.floor(Math.random() * list.length)];
        setTimeout(function () { snd(o.type === "coffee" ? "coffee_brew" : "can_drop", "vend"); }, 300);
        if (d.id && LAB.ITEMS[d.id]) takeDrink(o, d, "Внутри что-то щёлкнуло — и автомат сам выдал: " + d.n.toLowerCase() + ".");
        else drink(o, d, o.type === "coffee" ? 2200 : 1100, "Внутри что-то щёлкнуло — и автомат сам выдал: " + d.n.toLowerCase() + ".");
      } else say(st.dropped ? "Больше ничего не выпадет: автомат пуст." : "Внутри что-то звякнуло, но ничего не выпало. Шум разнёсся по этажу.");
    } },
    { label: "Осмотреть", fn: function () { say(why); } },
    { label: "Отойти", fn: function () {} }
  ]);
  say(machineName(o) + ". " + why);
}

/* (3.7, нелогичность) У кофейного автомата не поломка, а пустой бак: «Нет воды». Прежде
   от удара он «сам выдавал» кофе, а ремнабор его «чинил». Без воды ничего не сварится:
   бак заливают из-под крана, если в помещении раковина, или двумя бутылками воды. От
   удара — разве что забытая сдача в лотке. */
function coffeeDry(o) {
  var st = gm().objState(o), g = G(), sink = !!(LAB.kitchen && LAB.kitchen.sinkHere && LAB.kitchen.sinkHere(o)), wb = g.inv.water || 0;
  var why = "Табло кофейного автомата мигает: «Нет воды. Обратитесь к оператору». Бак за задней крышкой пуст: без воды автомат ничего не сварит.";
  var items = [];
  if (sink) items.push({ label: "Залить воду в бак из-под крана: раковина здесь же", fn: function () { coffeeFill(o, "tap"); } });
  if (wb >= 2) items.push({ label: "Залить в бак две бутылки воды — у вас " + wb, fn: function () { coffeeFill(o, "water"); } });
  else if (!sink) items.push({ label: "Залить воду в бак: нужны две бутылки воды" + (wb ? ", у вас одна" : "") + ", раковины в помещении нет", info: true, keep: true, fn: function () { say("Бак берёт два литра: нужны две бутылки воды или раковина рядом."); } });
  items.push({ label: "Стукнуть по автомату", fn: function () {
    st.hits = (st.hits || 0) + 1;
    snd("vend_hit", "bump_device");
    if (LAB.combat) LAB.combat.noise(5);
    if (!st.change) {
      st.change = 1;
      var c = 2 + (LAB.hash32(G().seed + ":" + CUR().key + ":" + o.id + ":change") >>> 0) % 7;
      g.credits = (g.credits || 0) + c;
      say("Насос всхлипнул впустую: воды нет. Зато в лотке сдачи звякнула забытая мелочь — " + c + " " + gm().plural(c, "кредит", "кредита", "кредитов") + ". Шум разнёсся по этажу.");
    } else say("Насос всхлипнул впустую: без воды автомат ничего не выдаст. Шум разнёсся по этажу.");
  } });
  items.push({ label: "Осмотреть", fn: function () { say(why); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", machineName(o) + " — нет воды", items);
  say(machineName(o) + ". " + why);
}
function coffeeFill(o, how) {
  var st = gm().objState(o), g = G();
  if (how === "water") { if (!((g.inv.water || 0) >= 2)) { say("Нужны две бутылки воды."); return; } g.inv.water -= 2; }
  st.fixed = 1; st.water = 1;
  if (gm().advanceTime) gm().advanceTime(2);
  snd("kettle_pour", "pc_click"); setTimeout(function () { snd("coffee_idle", "vend"); }, 900);
  UIx("closeAll");
  say((how === "tap" ? "Вы носите воду из-под крана в бак кружкой, пока не стало полно. " : "Вы выливаете в бак две бутылки воды. ") + "Насос загудел, табло мигнуло и зажглось: «Готов». Автомат снова варит.");
}

/* ════════ АВТОМАТ С ЕДОЙ ════════
   Батончики, галеты, орехи, глюкоза, сухпайки, бутерброды и лапша (кипяток —
   из крана сбоку). Купленное съедается сразу или кладётся в рюкзак —
   переключатель «Покупки» вверху. Сломанный автомат можно стукнуть. */
var SNACKS = ["choco", "crackers", "nuts", "protein", "glucose", "sandwich", "noodles", "ration", "stew"];
var takeAlong = false;
function snackPrice(id) { return Math.max(2, Math.round(LAB.ITEMS[id].price * (gm().priceK ? gm().priceK() : 1))); }
function snackMenu(o) {
  var st = gm().objState(o);
  snd("vend_hum", "vend");
  if (o.broken && !st.fixed) { snackBroken(o); return; }
  UIx("menu", "Автомат с едой. " + bodyHead(), snackItems(o), { keep: true, rebuild: function () { return snackItems(o); } });
}
function bodyHead() {
  var g = G(), b = g.body || { food: 0 };
  return "Сытость " + Math.round(b.food) + " из 100, энергия имплантов " + g.en + " из " + g.enMax + ", кредитов " + g.credits;
}
function snackItems(o) {
  var items = [{ label: "Покупки", kind: "choice", options: [{ v: false, label: "съесть сразу" }, { v: true, label: "взять с собой" }], get: function () { return takeAlong; }, set: function (v) { takeAlong = v; } }];
  SNACKS.forEach(function (id) {
    var d = LAB.ITEMS[id]; if (!d) return;
    var p = snackPrice(id);
    items.push({ label: d.n + " — " + p + " " + gm().plural(p, "кредит", "кредита", "кредитов") + ". " + d.desc, keep: true, fn: function () { buySnack(o, id); } });
  });
  /* (3.7, нелогичность) кран — тот же кипяток, что у чайника (kitchen.tap): лапша и суп-концентрат из рюкзака */
  items.push({ label: "Кран с кипятком: заварить лапшу из рюкзака" + (G().inv.noodles ? " (лапши " + G().inv.noodles + ")" : " — лапши нет"), keep: true, fn: function () {
    if (!(G().inv.noodles > 0)) { LAB.UI.error(); say("Лапши в рюкзаке нет: её продаёт этот же автомат."); return; }
    if (LAB.kitchen && LAB.kitchen.tap) LAB.kitchen.tap(o, "noodles");
  } });
  if (G().inv.soupcup > 0) items.push({ label: "Кран с кипятком: залить суп-концентрат из рюкзака (" + G().inv.soupcup + " шт.)", keep: true, fn: function () {
    if (LAB.kitchen && LAB.kitchen.tap) LAB.kitchen.tap(o, "soupcup");
  } });
  items.push({ label: "Осмотреть автомат", keep: true, fn: function () { say("Автомат с едой. " + LAB.OBJ.snacks.desc + " На стекле наклейка: «Сроки годности — по требованию проверяющего»."); } });
  items.push({ label: "Отойти", fn: function () {} });
  return items;
}
function buySnack(o, id) {
  var g = G(), p = snackPrice(id), d = LAB.ITEMS[id];
  if (g.credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + g.credits + "."); return; }
  if (!takeAlong && g.body && g.body.food >= 100 && !d.en) { say("Вы сыты. Можно взять с собой: переключатель «Покупки» вверху."); return; }
  g.credits -= p;
  g.inv[id] = (g.inv[id] || 0) + 1;
  snd("vend_coin", "buy");
  setTimeout(function () { snd("snack_drop", "can_drop"); }, 350);
  if (takeAlong) { say("Куплено: " + d.n + " — в рюкзаке, раздел «Еда и напитки». Съесть — " + LAB.K("инвентарь, «Еда и напитки».", "клавиша G или инвентарь, «Еда и напитки».") + " Кредитов " + g.credits + "."); gm().autosaveSoon(); return; }
  gm().paused = true;
  gm().later(function () {
    gm().paused = false;
    if (id === "noodles" && LAB.kitchen && LAB.kitchen.tap) LAB.kitchen.tap(o, id); /* лапшу — сразу под кран с кипятком */
    else gm().useItem(id);
  }, 900);
}
function snackBroken(o) {
  var st = gm().objState(o);
  UIx("menu", "Автомат с едой — не работает", [
    { label: "Стукнуть по автомату", fn: function () {
      st.hits = (st.hits || 0) + 1;
      snd("vend_hit", "bump_device");
      if (LAB.combat) LAB.combat.noise(5);
      if (!st.dropped && (Math.random() < 0.45 || st.hits >= 3)) {
        st.dropped = true;
        var id = SNACKS[Math.floor(Math.random() * SNACKS.length)];
        G().inv[id] = (G().inv[id] || 0) + 1;
        setTimeout(function () { snd("snack_drop", "can_drop"); }, 300);
        say("Спираль дёрнулась — и в лоток упало: " + LAB.ITEMS[id].n.toLowerCase() + ". Взято с собой.");
      } else say(st.dropped ? "Больше ничего не выпадет: спирали пусты." : "Внутри что-то звякнуло, но ничего не выпало. Шум разнёсся по этажу.");
    } },
    { label: "Осмотреть", fn: function () { say("Табло автомата с едой не горит, спирали застыли на полпути. Внутри виден батончик, застрявший у стекла."); } },
    { label: "Отойти", fn: function () {} }
  ]);
  say("Автомат с едой. Табло не горит.");
}

/* ════════ КОМПЬЮТЕРЫ ════════ */
function hashOf(o) { return LAB.hash32(G().seed + ":" + CUR().key + ":" + o.id); }
/* Номер компьютера на этаже — чтобы на этаже и на уровне почта не повторялась. */
function pcIndex(o) {
  var list = CUR().fl.objs.filter(function (q) { return q.type === "pc"; });
  return Math.max(0, list.indexOf(o));
}
var poolCache = {};
/* Почтовый ящик компьютера: переписка уровня или общая почта комплекса — из
   колоды, без повторов, пока колода не кончится. Выбор запоминается. */
function thread(o, h) {
  var st = gm().objState(o), Lr = lore(), L = G().L;
  var own = (Lr.mail && Lr.mail[L]) || [], gl = (Lr.mail && Lr.mail.g) || [];
  if (!st.th) {
    var useOwn = own.length && gm().deckLeft("mail:" + L, own.length) > 0 && (h % 3 !== 0 || !gl.length || gm().deckLeft("mail:g", gl.length) <= 0);
    if (useOwn) st.th = { L: L, i: gm().deckDraw("mail:" + L, own.length) };
    else if (gl.length) st.th = { L: "g", i: gm().deckDraw("mail:g", gl.length) };
    else return null;
  }
  return (st.th.L === "g" ? gl : ((Lr.mail && Lr.mail[st.th.L]) || []))[st.th.i] || null;
}
/* (3.7) Письма, журнал и документы компьютера собираются из текстов lore.js по
   ссылке — одними и теми же функциями и для ящика, и для архива документов: в
   записи игры хранится ссылка (откуда письмо), а не текст (game.js, archiveRef). */
function threadMail(th, j) {
  var m = th.m[j], me = (th.o || "").split(",")[0];
  var other = (th.m.filter(function (q) { return q[0] !== "*"; })[0] || [""])[0];
  var sent = m[0] === "*", sub = m[1] || th.s;
  return { f: sent ? me : m[0], to: sent ? (other || (/^Себе/.test(sub) ? "себе" : "всем")) : me, sent: sent, s: sub, x: m[2] };
}
function noticeMail(n) { var nn = (lore().notices || [])[n]; return nn ? { f: nn[0], s: nn[1], x: nn[2] } : null; }
function codeMail(code, room, safe) {
  if (safe) return { f: "Бухгалтерия", s: "Сейф, помещение «" + room + "»", x: "Напоминаю комбинацию сейфа в помещении «" + room + "»: " + digits(code) + ". Сменить её после инвентаризации — так и не сменили.", code: code, safe: true, room: room };
  return { f: "Служба безопасности", s: "Код двери: " + room, x: "Новый код двери помещения «" + room + "»: " + digits(code) + ". Никому не пересылать и не записывать на бумаге.", code: code, room: room };
}
function threadOf(ref) { var p = String(ref).split("."), Lr = lore(), list = Lr.mail ? (p[0] === "g" ? Lr.mail.g : Lr.mail[p[0]]) : null; return (list && list[+p[1]]) || null; }
function logPair(lg, k0) { return [lg[k0], lg[(k0 + 1) % lg.length]].filter(function (x, i, a) { return a.indexOf(x) === i; }); }
function pcData(o) {
  var key = G().seed + ":" + CUR().key + ":" + o.id;
  if (poolCache[key]) return poolCache[key];
  var g = G(), L = g.L, F = g.F, h = hashOf(o), Lr = lore();
  var hasCode = !!(o.code || o.safeCode);
  var roll = h % 100;
  var d = { state: hasCode ? "ok" : roll < 12 ? "broken" : roll < 22 ? "wiped" : "ok", mails: [], logs: [], docs: [], cams: [] };
  var th = d.state === "ok" ? thread(o, h) : null;
  if (th) {
    d.owner = th.o || "";
    var tr = gm().objState(o).th; /* какая переписка — ссылка для архива */
    d.mails = th.m.map(function (m, j) { var ml = threadMail(th, j); ml.ref = { th: tr.L + "." + tr.i, j: j }; return ml; });
    d.subj = th.s;
  }
  if (!d.owner) d.owner = randomOwner(L, h);
  /* объявление для всех — иногда */
  var notes = Lr.notices || [];
  if (notes.length && d.state === "ok" && (h >>> 3) % 3 === 0) { var ni = (h >>> 5) % notes.length, nm = noticeMail(ni); nm.ref = { nt: ni }; d.mails.push(nm); }
  /* код двери или сейфа — в письме */
  if (o.code) { var cm = codeMail(o.code, o.codeRoom, false); cm.ref = { c: o.code, r: o.codeRoom }; d.mails.unshift(cm); }
  if (o.safeCode) { var sm = codeMail(o.safeCode, o.safeRoom, true); sm.ref = { c: o.safeCode, r: o.safeRoom, sf: 1 }; d.mails.unshift(sm); }
  /* журнал испытаний помещения */
  var rm = gm().roomAt(o.x, o.y);
  var lg = rm && Lr.logs && Lr.logs[rm.type];
  if (lg && lg.length && d.state === "ok") { d.logTitle = "Журнал испытаний: " + rm.name; var k0 = (h >>> 7) % lg.length; d.logs = logPair(lg, k0); d.logRef = { rt: rm.type, k: k0, r: rm.name }; }
  var docs = Lr.docs && Lr.docs[L];
  if (docs && docs.length && d.state === "ok" && (h >>> 9) % 2 === 0) { var di = (h >>> 10) % docs.length; d.docs = [docs[di]]; d.docRef = [L + "." + di]; }
  var cams = Lr.cams && Lr.cams[L];
  if (cams && cams.length && (h >>> 11) % 2 === 0) d.cams = [cams[(F + pcIndex(o)) % cams.length]];
  poolCache[key] = d;
  return d;
}
function randomOwner(L, h) {
  var N = LAB.NAMES || { m: ["Иван"], f: ["Анна"], sm: ["Петров"], sf: ["Петрова"] };
  var fem = h % 2 === 0, first = (fem ? N.f : N.m)[(h >>> 2) % (fem ? N.f : N.m).length], last = (fem ? N.sf : N.sm)[(h >>> 4) % (fem ? N.sf : N.sm).length];
  var pos = (lore().posts && lore().posts[L]) || ["сотрудник"];
  return first + " " + last + ", " + pos[(h >>> 6) % pos.length];
}

function pcMenu(o) {
  var st = gm().objState(o), d = pcData(o);
  var items = [];
  if (d.state === "broken") items.push({ label: "Компьютер разбит", keep: true, fn: function () { snd("pc_click", "ui_error"); say("Монитор разбит, системный блок вскрыт, накопителя внутри нет. Кто-то очень не хотел, чтобы это прочитали."); } });
  else items.push({ label: "Сесть за компьютер", fn: function () { sit(o); } });
  items.push({ label: st.open ? "Ящики стола — пусто" : "Обыскать ящики стола", fn: function () { if (st.open) { say("Ящики пусты."); return; } gm().openContainer(o); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say("Компьютерный стол. " + (d.state === "broken" ? "Монитор разбит. " : "Монитор светится заставкой. ") + "Кресло отодвинуто, на столе — кружка и стопка бумаг."); } });
  UIx("menu", "Компьютерный стол", items);
}
function sit(o) {
  var st = gm().objState(o), d = pcData(o);
  snd("chair_sit", "bump_furniture");
  setTimeout(function () { snd("pc_boot", "term_on"); }, 400);
  if (o.locked && !st.hacked) {
    /* (3.0) первым пунктом — есть ли записка с паролем в документах; коротко */
    var lockItems = [];
    if (o.pin) {
      lockItems.push({ label: gm().codeHint(o.pin, "pc"), info: true, keep: true, fn: function () { say(gm().codeHint(o.pin, "pc")); } });
      lockItems.push({ label: "Ввести пароль", fn: function () { pinEntry(o); } });
      var pn = gm().noteForCode && gm().noteForCode(o.pin);
      if (pn) lockItems.push({ label: "Перечитать записку с паролем", keep: true, fn: function () { say(gm().noteFull(pn).x || pn.t, { read: true }); } });
    } else lockItems.push({ label: "Пароля у вас нет. Взломайте вход.", info: true, keep: true, fn: function () { say("Пароля у вас нет. Взломайте вход."); } });
    UIx("menu", "Компьютер заблокирован", lockItems.concat([
      { label: "Взломать вход (повторите сигналы)", fn: function () {
        UIx("closeAll");
        LAB.mini.hack(gm().hackLength(1 + Math.floor(G().L / 3)), function (ok) {
          if (ok) { st.hacked = true; snd("pc_ok", "term_ok"); gm().gainXP(6); desk(o); }
          else if (gm().walkedAway && gm().walkedAway()) say("Вы убрали руки с клавиатуры. Компьютер ждёт пароля.");
          else { snd("pc_error", "term_err"); say("Доступ запрещён. Компьютер громко пищит."); if (LAB.combat) LAB.combat.noise(8); }
        }, { title: "Взлом входа" });
      } },
      { label: "Встать из-за стола", fn: function () { snd("chair_up", "bump_furniture"); } }
    ]));
    say("Вы садитесь за стол. На экране — окно входа: «" + d.owner + ". Введите пароль».");
    return;
  }
  desk(o, true);
}
/* (3.0) Пароль компьютера набирают сами, как код сейфа: четыре цифры из записки. */
function pinEntry(o) {
  UIx("closeAll");
  if (!LAB.mini) return;
  LAB.mini.code(function (c) {
    if (!c) return;
    var st = gm().objState(o);
    if (c === o.pin) { st.hacked = true; snd("pc_ok", "term_ok"); desk(o, true); return; }
    st.fails = (st.fails || 0) + 1;
    snd("pc_error", "term_err");
    say("Неверный пароль." + (st.fails >= 3 ? " Компьютер громко пищит." : " Сверьтесь с запиской."));
    if (LAB.combat) LAB.combat.noise(st.fails >= 3 ? 8 : 3);
  }, { title: "Окно входа", pin: true });
}
/* Рабочий стол компьютера: почта, журнал, документы, камеры. */
function desk(o, first) {
  var st = gm().objState(o), d = pcData(o);
  st.read = st.read || {};
  var items = [];
  if (d.state === "wiped") {
    items.push({ label: "Почта пуста", keep: true, fn: function () { say("Почтовый ящик пуст. В журнале системы одна строка: «Данные изъяты по распоряжению ОКО». Время изъятия — за час до Разлома."); } });
  } else {
    var unread = d.mails.filter(function (m, i) { return !st.read[i]; }).length;
    items.push({ label: "Почта: " + d.mails.length + " " + gm().plural(d.mails.length, "письмо", "письма", "писем") + (unread ? ", новых " + unread : ""), fn: function () { mailList(o); } });
    if (d.logs.length) items.push({ label: d.logTitle, fn: function () { readList(o, d.logTitle, d.logs); } });
    if (d.docs.length) items.push({ label: "Документы: " + d.docs.length, fn: function () { docList(o); } });
  }
  if (d.cams.length) items.push({ label: "Записи камер этажа", fn: function () { snd("pc_click"); UIx("note", "Запись камеры", "«Эхо» описывает запись: " + d.cams[0], function () { desk(o); }); } });
  items.push({ label: "Встать из-за стола", fn: function () { snd("chair_up", "bump_furniture"); say("Вы встаёте из-за стола."); } });
  UIx("menu", "Компьютер: " + d.owner, items);
  if (first) LAB.say(d.state === "wiped" ? "Вы садитесь за стол. Компьютер просыпается, но почта пуста." : "Вы садитесь за стол. Компьютер просыпается: «" + d.owner + "».", { interrupt: false });
}
function mailList(o) {
  var st = gm().objState(o), d = pcData(o);
  st.read = st.read || {};
  var items = d.mails.map(function (m, i) {
    var head = m.sent ? "Отправлено, кому: " + m.to : "От: " + m.f;
    return { label: (st.read[i] ? "" : "Новое. ") + head + ". Тема: «" + m.s + "»", fn: function () { openMail(o, i); } };
  });
  items.push({ label: "Назад", fn: function () { desk(o); } });
  snd("pc_click");
  UIx("menu", "Почта: " + d.owner, items);
}
function openMail(o, i) {
  var st = gm().objState(o), d = pcData(o), m = d.mails[i], g = G();
  st.read = st.read || {};
  st.read[i] = 1;
  snd("pc_click");
  var nid = "mail:" + CUR().key + ":" + o.id + ":" + i;
  if (m.code) g.codes[m.code] = m.room;
  /* каждое прочитанное письмо — в архив документов: (3.7) ссылкой (откуда письмо), текст
     собирается заново (mailNote); письмо с кодом — только своим текстом, без «От» и «Кому» */
  if (m.ref) gm().archiveRef(nid, mailSrc(m, d), m.code && m.safe ? m.code : undefined);
  else if (m.code) { if (!g.notes[nid]) { g.notes[nid] = 1; g.noteList.push({ id: nid, t: "Письмо: " + m.s, x: m.x, a: m.f, L: g.L, F: g.F, code: m.safe ? m.code : undefined }); } }
  else gm().archiveAdd(nid, "Письмо: " + m.s, "От: " + m.f + ". Кому: " + (m.to || d.owner.split(",")[0]) + ". " + m.x, m.f, "Переписка");
  UIx("note", "Письмо: «" + m.s + "»", "От: " + m.f + ". Кому: " + (m.to || d.owner.split(",")[0]) + ". " + m.x + (m.code ? " Код записан в инвентарь: «Пропуска и ключи», «Известные коды». Набирать его — самому." : ""), function () { mailList(o); });
}
/* Документы компьютера: все, по одному; прочитанное — в архив. */
function docList(o) {
  var d = pcData(o);
  snd("pc_click");
  UIx("menu", "Документы: " + d.owner, d.docs.map(function (dc, i) {
    return { label: "«" + dc.t + "»", fn: function () {
      var nid = "doc:" + CUR().key + ":" + o.id + ":" + i, own = (d.owner || "").split(",")[0];
      if (d.docRef && d.docRef[i]) gm().archiveRef(nid, { note: "pcdoc", d: d.docRef[i], o: own });
      else gm().archiveAdd(nid, dc.t, dc.x, own, "Документы");
      UIx("note", dc.t, dc.x, function () { docList(o); });
    } };
  }).concat([{ label: "Назад", fn: function () { desk(o); } }]));
}
function readList(o, title, list) {
  var d = pcData(o), nid = "log:" + CUR().key + ":" + o.id, own = (d.owner || "").split(",")[0];
  if (d.logRef) gm().archiveRef(nid, { note: "pclog", rt: d.logRef.rt, k: d.logRef.k, r: d.logRef.r, o: own });
  else gm().archiveAdd(nid, title, list.join(" "), own, "Журналы терминалов");
  UIx("note", title, list.join(" "), function () { desk(o); });
}

/* ════════ (3.7) АРХИВ: ТЕКСТ ПО ССЫЛКЕ ════════
   Ссылка письма (pcmail): th — переписка («уровень.номер» или «g.номер») и j — письмо в
   ней; nt — объявление для всех; c, r, sf — письмо с кодом; o — кому, если письмо адресовано
   владельцу ящика. Документ (pcdoc): d — «уровень.номер», o — владелец. Журнал испытаний
   (pclog): rt — вид помещения, k — первая запись, r — название помещения, o — владелец. */
function mailSrc(m, d) {
  var s = { note: "pcmail" }, r = m.ref || {};
  for (var k in r) s[k] = r[k];
  if (!r.c && !m.to) s.o = (d.owner || "").split(",")[0];
  return s;
}
function noteText(s) {
  var Lr = lore();
  if (s.note === "pcmail") {
    var m = s.c ? codeMail(s.c, s.r, !!s.sf) : s.nt != null ? noticeMail(s.nt) : null;
    if (!m && s.th != null) { var th = threadOf(s.th); if (th && th.m && th.m[s.j]) m = threadMail(th, s.j); }
    if (!m) return null;
    return { t: "Письмо: " + m.s, x: s.c ? m.x : "От: " + m.f + ". Кому: " + (m.to || s.o || "") + ". " + m.x, a: m.f, cat: "Переписка" };
  }
  if (s.note === "pcdoc") {
    var p = String(s.d).split("."), dc = ((Lr.docs && Lr.docs[p[0]]) || [])[+p[1]];
    return dc ? { t: dc.t, x: dc.x, a: s.o || "", cat: "Документы" } : null;
  }
  if (s.note === "pclog") {
    var lg = Lr.logs && Lr.logs[s.rt];
    return lg && lg.length ? { t: "Журнал испытаний: " + s.r, x: logPair(lg, s.k % lg.length).join(" "), a: s.o || "", cat: "Журналы терминалов" } : null;
  }
  return null;
}
/* Повторы: то же письмо той же переписки (колода почты после круга начинается заново), то
   же объявление, тот же документ или журнал на другом компьютере — тот же текст; в архив он
   второй раз не идёт. Письмо с кодом — своё у каждой двери и сейфа. */
function srcKey(s) {
  if (s.note === "pcmail") return s.c ? "" : s.nt != null ? "nt" + s.nt : "m" + s.th + "." + s.j + (s.o ? "." + s.o : "");
  if (s.note === "pcdoc") return "d" + s.d;
  if (s.note === "pclog") return "l" + s.rt + "." + s.k;
  return "";
}
/* Запись прежней версии с полным текстом — ссылкой, если текст по ней тот же (game.js, migrate
   проверяет совпадение). Указатель: текст письма → откуда оно. */
var oldIdx = null;
function oldIndex() {
  if (oldIdx) return oldIdx;
  var Lr = lore(), I = { mail: {}, doc: {}, log: {} }, k;
  var addM = function (m, ref) { var b = I.mail[m.x] = I.mail[m.x] || []; b.push({ m: m, ref: ref }); };
  for (k in (Lr.mail || {})) (Lr.mail[k] || []).forEach(function (th, i) { (th.m || []).forEach(function (q, j) { addM(threadMail(th, j), { th: k + "." + i, j: j }); }); });
  (Lr.notices || []).forEach(function (q, n) { addM(noticeMail(n), { nt: n }); });
  for (k in (Lr.docs || {})) (Lr.docs[k] || []).forEach(function (dc, i) { var dk = dc.t + "\n" + dc.x; if (!I.doc[dk]) I.doc[dk] = k + "." + i; });
  for (k in (Lr.logs || {})) { var lg = Lr.logs[k] || []; for (var j = 0; j < lg.length; j++) { var lk = logPair(lg, j).join(" "); if (!I.log[lk]) I.log[lk] = { rt: k, k: j }; } }
  oldIdx = I;
  return I;
}
function refOld(n) {
  var id = String(n.id || "").replace(/^w\d+:/, ""), x = String(n.x || ""), t = String(n.t || ""), I, cm, tail;
  if (/^mail:/.test(id)) {
    cm = /^Новый код двери помещения «(.+)»: ([\d ]+)\. Никому не пересылать и не записывать на бумаге\.$/.exec(x) || /^Напоминаю комбинацию сейфа в помещении «(.+)»: ([\d ]+)\. Сменить её после инвентаризации — так и не сменили\.$/.exec(x);
    if (cm) { var sr = { note: "pcmail", c: cm[2].replace(/ /g, ""), r: cm[1] }; if (/^Напоминаю/.test(x)) sr.sf = 1; return sr; }
    var pos = x.indexOf(". Кому: ");
    if (x.indexOf("От: ") !== 0 || pos < 0) return null;
    I = oldIndex();
    /* где кончается «кому» и начинается текст письма — пробуем каждую точку */
    for (var at = x.indexOf(". ", pos + 8); at >= 0; at = x.indexOf(". ", at + 1)) {
      var cands = I.mail[x.slice(at + 2)] || [];
      for (var i = 0; i < cands.length; i++) {
        var c = cands[i], pre = "От: " + c.m.f + ". Кому: ";
        if (x.indexOf(pre) !== 0 || pre.length > at || "Письмо: " + c.m.s !== t) continue;
        tail = x.slice(pre.length, at);
        if (c.m.to && tail !== c.m.to) continue;
        var s = { note: "pcmail" }; for (var rk in c.ref) s[rk] = c.ref[rk];
        if (!c.m.to) s.o = tail;
        return s;
      }
    }
    return null;
  }
  if (/^doc:/.test(id)) { I = oldIndex(); var dd = I.doc[t + "\n" + x]; return dd ? { note: "pcdoc", d: dd, o: n.a || "" } : null; }
  if (/^log:/.test(id) && t.indexOf("Журнал испытаний: ") === 0) { I = oldIndex(); var ll = I.log[x]; return ll ? { note: "pclog", rt: ll.rt, k: ll.k, r: t.slice(18), o: n.a || "" } : null; }
  return null;
}

LAB.office = { _openMail: function (o, i) { openMail(o, i); }, _docList: function (o) { docList(o); }, pcMenu: pcMenu, drinkMenu: drinkMenu, snackMenu: snackMenu, SNACKS: SNACKS, pcData: pcData, DRINKS: DRINKS, clear: function () { poolCache = {}; },
  noteText: noteText, srcKey: srcKey, refOld: refOld };
})();
