/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — компьютеры и автоматы с напитками.
   Компьютерный стол: сесть за компьютер — почта сотрудника, журнал
   испытаний помещения, документы, записи камер этажа (их описывает
   «Эхо»); иногда в почте — код двери или сейфа. Кофейный автомат и
   автомат с напитками: купить за кредиты и выпить — плюс к здоровью.
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
    { n: "Эспрессо", p: 6, hp: 8, x: "Маленькая чашка горького крепкого эспрессо. По телу разливается тепло.", s: "drink_sip" },
    { n: "Американо", p: 5, hp: 6, x: "Большой стакан чёрного кофе. Пахнет почти как наверху.", s: "drink_sip" },
    { n: "Капучино", p: 9, hp: 12, x: "Капучино с густой пенкой. Кто-то когда-то мечтал о таком на поверхности.", s: "drink_sip" },
    { n: "Горячий шоколад", p: 10, hp: 14, x: "Сладкий горячий шоколад. Руки перестают дрожать.", s: "drink_sip" },
    { n: "Чай с лимоном", p: 4, hp: 5, x: "Чай с лимонной кислинкой. Лимон, конечно, ненастоящий.", s: "drink_sip" }
  ] },
  drinks: { n: "Автомат с напитками", list: [
    { n: "Вода «Глубинная»", p: 3, hp: 4, x: "Холодная вода. Простая, честная, почти без привкуса металла.", s: "drink_gulp" },
    { n: "Газировка «Байкал»", p: 5, hp: 7, x: "Шипучая газировка с травяным вкусом. Пузырьки щиплют язык.", s: "drink_gulp" },
    { n: "Сок «Яблочный сад»", p: 7, hp: 10, x: "Яблочный сок из пакета. Сад на картинке давно никто не видел.", s: "drink_gulp" },
    { n: "Энергетик «Разряд»", p: 12, hp: 8, en: 15, x: "Едкий сладкий энергетик. Сердце стучит чаще, импланты отзываются гулом.", s: "drink_gulp" },
    { n: "Изотоник «Марафон»", p: 9, hp: 12, cure: true, x: "Солоноватый изотоник. Тяжесть в ногах отступает.", s: "drink_gulp" }
  ] }
};
function priceOf(d) { return Math.round(d.p * (1 + (G().L - 1) * 0.12)); }
function healOf(d) { return Math.round(d.hp * (1 + (G().L - 1) * 0.15)); }
function machineName(o) { return DRINKS[o.type] ? DRINKS[o.type].n : "Автомат"; }
function drinkMenu(o) {
  var g = G(), st = gm().objState(o);
  snd(o.type === "coffee" ? "coffee_idle" : "vend_hum", "vend");
  if (o.broken && !st.fixed) { brokenMenu(o); return; }
  UIx("menu", machineName(o) + ". Здоровье " + g.hp + " из " + g.hpMax + ", кредитов " + g.credits, drinkItems(o), { keep: true, rebuild: function () { return drinkItems(o); } });
}
function drinkItems(o) {
  var items = DRINKS[o.type].list.map(function (d) {
    var p = priceOf(d), h = healOf(d);
    return { label: d.n + " — " + p + " " + gm().plural(p, "кредит", "кредита", "кредитов") + ", здоровье плюс " + h + (d.en ? ", энергия плюс " + d.en : "") + (d.cure ? ", снимает замедление" : ""), keep: true, fn: function () { buyDrink(o, d); } };
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
  drink(o, d, o.type === "coffee" ? 2600 : 1300, "Куплено: " + d.n + ".");
}
function drink(o, d, wait, pre) {
  var g = G();
  gm().paused = true;
  say(pre + (o.type === "coffee" ? " Автомат варит…" : " Банка падает в лоток."), { interrupt: false });
  setTimeout(function () {
    gm().paused = false;
    if (o.type === "drinks") snd("can_open");
    setTimeout(function () { snd(d.s); }, o.type === "drinks" ? 450 : 0);
    var before = g.hp, h = healOf(d);
    g.hp = Math.min(g.hpMax, g.hp + h);
    var gained = g.hp - before, extra = "";
    if (d.en && typeof g.en === "number") { var e0 = g.en; g.en = Math.min(g.enMax, g.en + d.en); if (g.en > e0) extra += " Энергия имплантов плюс " + (g.en - e0) + "."; }
    if (d.cure && g.st) { if (g.st.slow > 0) extra += " Замедление прошло."; g.st.slow = 0; }
    say(d.x + " " + (gained > 0 ? "Здоровье плюс " + gained + ", теперь " + g.hp + " из " + g.hpMax + "." : "Здоровье и так полное.") + extra);
    gm().journal("Выпит напиток: " + d.n + ".");
    UIx("refresh");
    gm().autosaveSoon();
  }, wait);
}
/* Сломанный автомат: по нему можно стукнуть — иногда выпадает напиток. */
function brokenMenu(o) {
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
        drink(o, d, o.type === "coffee" ? 2200 : 1100, "Внутри что-то щёлкнуло — и автомат сам выдал: " + d.n.toLowerCase() + ".");
      } else say(st.dropped ? "Больше ничего не выпадет: автомат пуст." : "Внутри что-то звякнуло, но ничего не выпало. Шум разнёсся по этажу.");
    } },
    { label: "Осмотреть", fn: function () { say(why); } },
    { label: "Отойти", fn: function () {} }
  ]);
  say(machineName(o) + ". " + why);
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
    var me = (d.owner || "").split(",")[0];
    var other = (th.m.filter(function (m) { return m[0] !== "*"; })[0] || [""])[0];
    d.mails = th.m.map(function (m) {
      var sent = m[0] === "*", sub = m[1] || th.s;
      return { f: sent ? me : m[0], to: sent ? (other || (/^Себе/.test(sub) ? "себе" : "всем")) : me, sent: sent, s: sub, x: m[2] };
    });
    d.subj = th.s;
  }
  if (!d.owner) d.owner = randomOwner(L, h);
  /* объявление для всех — иногда */
  var notes = Lr.notices || [];
  if (notes.length && d.state === "ok" && (h >>> 3) % 3 === 0) { var nn = notes[(h >>> 5) % notes.length]; d.mails.push({ f: nn[0], s: nn[1], x: nn[2] }); }
  /* код двери или сейфа — в письме */
  if (o.code) d.mails.unshift({ f: "Служба безопасности", s: "Код двери: " + o.codeRoom, x: "Новый код двери помещения «" + o.codeRoom + "»: " + digits(o.code) + ". Никому не пересылать и не записывать на бумаге.", code: o.code, room: o.codeRoom });
  if (o.safeCode) d.mails.unshift({ f: "Бухгалтерия", s: "Сейф, помещение «" + o.safeRoom + "»", x: "Напоминаю комбинацию сейфа в помещении «" + o.safeRoom + "»: " + digits(o.safeCode) + ". Сменить её после инвентаризации — так и не сменили.", code: o.safeCode, safe: true, room: o.safeRoom });
  /* журнал испытаний помещения */
  var rm = gm().roomAt(o.x, o.y);
  var lg = rm && Lr.logs && Lr.logs[rm.type];
  if (lg && lg.length && d.state === "ok") { d.logTitle = "Журнал испытаний: " + rm.name; var k0 = (h >>> 7) % lg.length; d.logs = [lg[k0], lg[(k0 + 1) % lg.length]].filter(function (x, i, a) { return a.indexOf(x) === i; }); }
  var docs = Lr.docs && Lr.docs[L];
  if (docs && docs.length && d.state === "ok" && (h >>> 9) % 2 === 0) d.docs = [docs[(h >>> 10) % docs.length]];
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
    UIx("menu", "Компьютер заблокирован", [
      { label: "Взломать вход (повторите сигналы)", fn: function () {
        UIx("closeAll");
        LAB.mini.hack(gm().hackLength(1 + Math.floor(G().L / 3)), function (ok) {
          if (ok) { st.hacked = true; snd("pc_ok", "term_ok"); gm().gainXP(6); desk(o); }
          else { snd("pc_error", "term_err"); say("Доступ запрещён. Компьютер громко пищит."); if (LAB.combat) LAB.combat.noise(8); }
        }, { title: "Взлом входа" });
      } },
      { label: "Встать из-за стола", fn: function () { snd("chair_up", "bump_furniture"); } }
    ]);
    say("Вы садитесь за стол. На экране — окно входа: «" + d.owner + ". Введите пароль».");
    return;
  }
  desk(o, true);
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
    if (d.docs.length) items.push({ label: "Документы: " + d.docs.length, fn: function () { UIx("note", d.docs[0].t, d.docs[0].x, function () { desk(o); }); } });
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
  st.read[i] = 1;
  snd("pc_click");
  if (m.code) {
    g.codes[m.code] = m.room;
    var nid = "mail:" + CUR().key + ":" + o.id + ":" + i;
    if (!g.notes[nid]) { g.notes[nid] = 1; g.noteList.push({ id: nid, t: "Письмо: " + m.s, x: m.x, a: m.f, L: g.L, F: g.F, code: m.safe ? m.code : undefined }); }
  }
  UIx("note", "Письмо: «" + m.s + "»", "От: " + m.f + ". Кому: " + (m.to || d.owner.split(",")[0]) + ". " + m.x + (m.code ? " Код запомнен." : ""), function () { mailList(o); });
}
function readList(o, title, list) {
  UIx("note", title, list.join(" "), function () { desk(o); });
}

LAB.office = { pcMenu: pcMenu, drinkMenu: drinkMenu, pcData: pcData, DRINKS: DRINKS, clear: function () { poolCache = {}; } };
})();
