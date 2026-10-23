/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — обстановка в игре (1.5).
   Что делают вещи обстановки (fixtures_data.js): на диване и койке
   отдыхают, у чайника и самовара пьют чай, под подушками и в ящиках
   столов ищут, приборы и обломки разбирают на детали, журналы, меню,
   тетради долгов, доски и самописцы читают — и каждый раз это свой
   текст: с людьми этого этажа, номерами его помещений, временем; на
   тренажёре растёт сила, по мишеням — меткость, у турникета щёлкает
   счётчик, рамка досмотра звенит на оружие. «Осмотреть» описывает любую
   вещь подробно: какая она, что с ней сделали, что в ней есть. Тела —
   больше не просто «обыскать»: осмотреть (кто это был — по жетону и
   нашивке), обшарить карманы, снять комбинезон или жилет, снять жетон
   (выжившие у лифта собирают жетоны погибших), почтить память.
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
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function st(o) { return gm().objState(o); }
function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function snd(id, fb) { if (LAB.Bank && LAB.Bank.has && LAB.Bank.has(id)) A("play", id); else if (fb) A("play", fb); }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
function spend(min) { if (min > 0) gm().advanceTime(min); }
function era() { return LAB.agen ? LAB.agen.eraOf(G().L) : "K"; }
function danger() { return !!(LAB.combat && LAB.combat.danger && LAB.combat.danger()); }
function nowMin() { return (G().day || 0) * 1440 + (G().min || 0); }
function rng(o, tag) { return LAB.Rng(G().seed, "fx:" + tag + ":" + CUR().key + ":" + o.id); }
function minW(n) { return n + " " + pl(n, "минута", "минуты", "минут"); }
function roomOf(o) { var fl = CUR().fl; return o && o.room >= 0 ? fl.rooms[o.room] : null; }
function noise(n) { if (LAB.combat && LAB.combat.noise) LAB.combat.noise(n); }
function giveAll(list) { return list.map(function (it) { return gm().giveItem(it); }); }
function fxDef(o) { return LAB.FIX && LAB.FIX.T[o.fx]; }

/* ── новые вещи: грибы, травяной сбор, жетоны погибших ── */
var NEW_ITEMS = {
  mushroom: { n: "Грибы с грибницы", icon: "🍄", kind: "food", cat: "food", desc: "Горсть плотных грибов, пахнущих лесом. Сытость плюс 8, немного здоровья. Разогретые на плите — сытнее.", food: 8, heal: 5, price: 4, eat: "crunch", depth: 3 },
  herbtea: { n: "Травяной сбор", icon: "🌿", kind: "food", cat: "food", desc: "Пучок сушёных трав: мята, чабрец и что-то незнакомое, пахнущее мёдом. Если заварить — бодрит, успокаивает и выводит токсины.", food: 5, wake: 6, neuro: -10, detox: 6, price: 6, eat: "sip", depth: 1 },
  badge: { n: "Жетон погибшего", icon: "🏷️", kind: "misc", cat: "valuable", nosell: true, price: 0, desc: "Металлический жетон с именем и должностью. Выжившие собирают жетоны погибших: отдайте им — родные наверху узнают, что случилось." }
};
for (var ik in NEW_ITEMS) if (!LAB.ITEMS[ik]) LAB.ITEMS[ik] = NEW_ITEMS[ik];

/* ════════ ЧТО ЧИТАЕТСЯ ════════
   Журналы, меню, тетради долгов, доски, самописцы: у каждой вещи свой
   текст — люди этого этажа, номера его помещений, время. Тексты из
   готовых наборов — колодой этажа, без повторов. */
function floorPeople() {
  var fl = CUR().fl, out = [];
  fl.rooms.forEach(function (rm) { if (rm && rm.owner && rm.owner.g != null) out.push({ g: rm.owner.g, post: rm.owner.post, f: rm.owner.f, rm: rm }); });
  return out;
}
function personOf(q) { return LAB.agen.personByG(G().seed, q.g, q.post, era(), q.f ? true : null); }
function randPerson(r, posts) {
  var ppl = floorPeople();
  if (ppl.length && r.chance(0.85)) return personOf(r.pick(ppl));
  return LAB.agen.person(G().seed, G().L, G().F, 420 + r.int(0, 90), r.pick(posts || ["инженер", "лаборант", "техник", "оператор"]), { era: era() });
}
function floorRooms() { return CUR().fl.rooms.filter(function (rm) { return rm && rm.num; }); }
function ctxFor(r) {
  var rooms = floorRooms(), r1 = rooms.length ? r.pick(rooms) : null, r2 = rooms.length ? r.pick(rooms) : null;
  return { au: randPerson(r), to: randPerson(r), s3: randPerson(r), n1: r1 ? r1.num : 1, n2: r2 ? r2.num : 2, rn: r1 ? r1.name : "", tm: 6 * 60 + r.int(0, 200) * 5, wd: r.int(0, 6) };
}
function R(tpl, c) { return LAB.agen ? LAB.agen.render(tpl, c) : tpl; }
/* Готовый набор — окном в перестановке этажа: у каждой вещи своё окно (по её
   номеру среди таких же вещей этажа), поэтому на этаже нет повторов, а та же
   вещь при новом прочтении говорит то же самое. */
var permC = {}, permK = [], ordC = {};
function permFor(key, n) {
  var k = G().seed + "|" + key + "|" + n;
  if (permC[k]) return permC[k];
  var p = []; for (var i = 0; i < n; i++) p.push(i);
  LAB.Rng(G().seed, "fxpool:" + key).shuffle(p);
  permC[k] = p; permK.push(k); if (permK.length > 200) delete permC[permK.shift()];
  return p;
}
function ordinal(o) {
  var key = CUR().key, m = ordC[key];
  if (!m) { m = ordC = {}; m = ordC[key] = {}; var cnt = {}; CUR().fl.objs.forEach(function (q) { var k = q.type === "fx" ? "fx:" + q.fx : q.type; m[q.id] = cnt[k] = (cnt[k] || 0) + 1; }); }
  return (m[o.id] || 1) - 1;
}
function poolAt(key, arr, slot) {
  if (!arr || !arr.length) return "";
  var p = permFor(CUR().key + "|" + key, arr.length);
  return arr[p[((slot % arr.length) + arr.length) % arr.length]];
}
/* Выборщик для одной вещи: sub — какое по счёту чтение этой вещи (доска с тремя листками). */
function picker(o, sub) {
  var base = (ordinal(o) * 4 + (sub || 0)) * 8, j = 0;
  return function (key, arr) { return poolAt(key, arr, base + (j++)); };
}
var fromPool = null;
function NT() { return (LAB.ANNEX_N || {})[era()] || (LAB.ANNEX_N || {}).K || null; }
function FR() { return (LAB.ANNEX_F || {})[era()] || (LAB.ANNEX_F || {}).K || null; }
function lines(kind, n, r, pick) {
  var nt = NT(), arr = nt && nt[kind], out = [];
  if (!arr || !arr.length) return out;
  for (var i = 0; i < n; i++) out.push(R(pick("ln:" + kind, arr), ctxFor(r)));
  return out;
}
var DISH = {
  K: ["суп гороховый", "борщ со сметаной", "щи из квашеной капусты", "котлета с гречкой", "макароны по-флотски", "рыба с картофельным пюре", "плов", "омлет с зеленью", "сырники", "запеканка", "солянка", "рассольник", "винегрет", "тефтели в томате", "гуляш", "блины с творогом", "каша рисовая", "компот", "кисель", "чай с лимоном", "булочка с маком", "пирожок с капустой"],
  P: ["щи", "каша пшённая", "макароны с тушёнкой", "котлета паровая", "селёдка с луком", "картошка в мундире", "суп с клёцками", "капуста тушёная", "кисель", "компот из сухофруктов", "чай", "хлеб чёрный", "пирожок с ливером", "вермишель молочная"],
  C: ["лепёшки из корня", "похлёбка из грибов", "печёные клубни", "медовый отвар", "каша из речного зерна", "рыба в листьях", "травяной чай", "сладкие коренья", "суп из ракушек", "хлеб на углях"],
  O: ["суп гороховый", "котлета с гречкой", "компот", "сырники", "кисель", "омлет", "борщ", "чай без сахара"],
  M: ["смазка веретённая", "масло третьего класса", "талон на ожидание", "порция тишины", "графит молотый", "бланк питания номер четыре"],
  I: ["печёные яблоки", "мёд", "орехи", "травяной сбор", "лепёшки", "грибы на углях", "компот из ягод", "суп из корней"]
};
var DEBT = { K: ["сгущёнка", "кофе", "батарейки", "спички", "сахар", "гречка", "мыло", "носки", "изолента", "печенье", "чай", "шоколад"], P: ["махорка", "сахар", "спички", "портянки", "хлеб", "чай", "керосин", "сало", "тушёнка", "гвозди"], C: ["мёд", "соль", "шило", "нитки", "лепёшки", "семена", "воск", "глина"], O: ["кофе", "сахар", "батарейки", "время", "спички", "чай"], M: ["смазка", "талоны", "печать", "пружина", "лента", "сургуч"], I: ["семена", "мёд", "яблоки", "вода", "нитки", "воск"] };
var GIVEN = ["долг закрыт", "ждёт до получки", "вычеркнуто", "отдаст после смены", "прощено", "в счёт кружки", "обещано вернуть в пятницу"];
var GAUGE_N = ["Давление", "Напряжение", "Ток нагрузки", "Температура обмоток", "Расход", "Вибрация", "Частота"];
var GAUGE_U = { "Давление": ["атмосфер", 1, 9], "Напряжение": ["вольт", 180, 420], "Ток нагрузки": ["ампер", 4, 60], "Температура обмоток": ["градусов", 28, 96], "Расход": ["литров в минуту", 2, 80], "Вибрация": ["делений", 1, 12], "Частота": ["герц", 48, 52] };
var GRAFF = ["Здесь был {имя}.", "{имя} плюс {кому_имя}. Нарисовано сердечко.", "Дежурил {вдень}, в {время}. Тихо.", "Не забудь: помещение номер {номер}.", "{фам} должен двадцать кредитов. Ниже другой рукой: «Уже нет».", "Палочки по пять: дни. Последний столбик не дописан.", "«Кто взял отвёртку — верни». Подпись: {подпись}.", "{имя}, ты лучше всех. Без подписи.", "Нарисована стрелка вниз и написано: «Туда не надо».", "«Седьмой, если ты это читаешь — держись». Подписи нет."];
var AWARD = ["за безупречную смену", "за спасение кота из вентиляции", "лучшему рационализатору года", "за третье место в турнире по шахматам", "за чистоту рабочего места", "за песню на вечере смены", "за сорок дней без опозданий", "за помощь новичкам", "за самый вкусный пирог на празднике", "за верность отделу"];
var PHOTO = {
  who: ["трое в рабочих куртках", "девочка с котом на руках", "смена у пульта", "двое на скамейке", "бригада в касках", "женщина с ребёнком на плечах", "старик с гармошкой", "весь отдел у торта", "двое в белых халатах", "мальчишка с воздушным змеем", "пара на велосипеде", "собака в смешной шапке"],
  where: ["на фоне горы", "у ёлки в столовой", "на крыше склада", "у моря", "в весеннем саду", "на перроне станции", "у костра", "на пороге дома", "у шлагбаума кордона", "на лугу у посёлка"],
  what: ["все смеются", "кто-то машет рукой", "кто-то зажмурился", "держат торт", "держат рыбу", "дует ветер, шарфы летят", "все в снегу", "у всех мокрые волосы после дождя"],
  cap: ["«Последний пикник перед сменой»", "«Мы вернёмся летом»", "«Это я, когда ещё видел солнце»", "«Папе на работу»", "«Не грусти там, внизу»", "«Наш первый снег»", "«Ждём тебя»", "«С днём рождения, {имя}»", "«{кому_имя} и я»", "«Помни, как пахнет море»"]
};
var SLEEP = ["Испытуемому снилась вода.", "Сон тревожный: пульс выше нормы.", "Фаза быстрого сна длинная, как у ребёнка.", "Во сне человек считал вслух до десяти.", "Под утро улыбался.", "Снились шаги. Опять шаги."];
function gen(kind, o, r, sub) {
  var c = ctxFor(r), e = era(), out, i, fromPool = picker(o, sub);
  switch (kind) {
    case "visitors": {
      var ls = [], t = 7 * 60 + r.int(0, 24) * 5;
      for (i = 0; i < r.int(4, 7); i++) { var p = randPerson(r), rooms = floorRooms(), rm = rooms.length ? r.pick(rooms) : null; ls.push(LAB.agen.timeWords(t) + " — " + p.fio + ", " + p.post + (rm ? ", в помещение " + rm.num : "") + "."); t += r.int(2, 30) * 5; }
      return { t: "Журнал посетителей", x: ls.join(" ") + (r.chance(0.5) ? " " + fromPool("tx:visitors", LAB.FIX.TX.visitors) : "") };
    }
    case "menus": {
      var ds = (DISH[e] || DISH.K).slice(); r.shuffle(ds);
      return { t: "Меню", x: (e === "O" ? "Меню написано задом наперёд, «Эхо» переворачивает: " : "") + cap(LAB.agen.DAYS[c.wd]) + ": " + ds.slice(0, 3).join(", ") + ", " + ds[3] + "." + (r.chance(0.5) ? " " + fromPool("tx:menus", LAB.FIX.TX.menus) : "") };
    }
    case "debts": {
      var dl = [], its = DEBT[e] || DEBT.K;
      for (i = 0; i < r.int(4, 6); i++) { var pd = randPerson(r); dl.push(pd.sur + " — " + r.int(2, 40) + " кредитов, " + r.pick(its) + ", " + r.pick(GIVEN) + "."); }
      return { t: "Тетрадь долгов", x: dl.join(" ") + (r.chance(0.4) ? " " + fromPool("tx:debts", LAB.FIX.TX.debts) : "") };
    }
    case "gauges": {
      var gl = [], gn = GAUGE_N.slice(); r.shuffle(gn);
      gn.slice(0, 3).forEach(function (k) { var u = GAUGE_U[k]; gl.push(k + " — " + r.int(u[1], u[2]) + " " + u[0] + "."); });
      return { t: "Показания приборов", x: gl.join(" ") + " " + fromPool("tx:gauges", LAB.FIX.TX.gauges) };
    }
    case "graffiti": { var gg = GRAFF.slice(); r.shuffle(gg); return { t: "Надписи на стене", x: gg.slice(0, 3).map(function (q) { return R(q, ctxFor(r)); }).join(" ") }; }
    case "awards": { var pa = randPerson(r); return { t: "Грамоты", x: "Грамота: «" + pa.fio + ", " + pa.post + " — " + r.pick(AWARD) + "». " + fromPool("tx:awards", LAB.FIX.TX.awards) }; }
    case "photos": {
      if (e === "C") return { t: "Оттиски", x: "Вместо снимков — оттиски ладоней в глине, подписанные выпуклыми буквами: " + [randPerson(r).first, randPerson(r).first, randPerson(r).first].join(", ") + ". Пальцы сами ложатся в чужие ладони." };
      return { t: "Снимок", x: "«Эхо» описывает снимок: " + r.pick(PHOTO.who) + " " + r.pick(PHOTO.where) + ", " + r.pick(PHOTO.what) + ". На обороте: " + R(r.pick(PHOTO.cap), c) + "." };
    }
    case "sleeprec": { var ps = randPerson(r); return { t: "Запись сна", x: "Запись сна: " + ps.fio + ", " + LAB.agen.DAYS[c.wd] + ". Глубокий сон — " + r.int(40, 140) + " минут, быстрый — " + r.int(10, 60) + ". Пометка врача: «" + r.pick(SLEEP) + "»" }; }
    case "complaints": { var cl = lines("repair", 2, r, fromPool); return { t: "Жалобы и заявки", x: (cl.length ? cl.join(" ") + " " : "") + fromPool("tx:complaints", LAB.FIX.TX.complaints) }; }
    case "letters": case "typed": case "copier": {
      var nt = NT(); if (nt && nt.topics && nt.topics.length && r.chance(0.75)) {
        var src = { note: "agen", e: e, k: r.int(0, nt.topics.length - 1), p: [], a: c.au.g || 0, ap: c.au.post, af: c.au.f ? 1 : 0, to: c.to.g || 0, tp: c.to.post, s: c.s3.g || 0, sp: c.s3.post, n1: c.n1, n2: c.n2, rn: c.rn, tm: c.tm, wd: c.wd };
        var tp = nt.topics[src.k]; src.p = [r.int(0, (tp.open || [1]).length - 1), r.int(0, (tp.body || [1]).length - 1), r.chance(0.5) ? r.int(0, (tp.extra || [1]).length - 1) : -1, r.int(0, (tp.close || [1]).length - 1), r.int(0, (tp.t || [1]).length - 1)];
        var tx = LAB.agen.noteText(src);
        var pre = kind === "typed" ? "Лист в машинке: " : kind === "copier" ? "Застрявший лист — копия: " : "";
        return { t: tx.t, x: pre + "«" + tx.x + "»" + (tx.a ? " — " + tx.a + "." : ""), src: src };
      }
      return { t: kind === "letters" ? "Письмо" : "Лист", x: fromPool("tx:" + kind, LAB.FIX.TX[kind]) };
    }
    case "posters": {
      var fr = FR(); if (fr && fr.wall && fr.wall.length && r.chance(0.7)) return { t: "Плакат", x: fromPool("fr:wall", fr.wall) };
      return { t: "Плакат", x: fromPool("tx:posters", LAB.FIX.TX.posters) };
    }
    case "ether": { var rm2 = lines("rumor", 1, r, fromPool); return { t: "Эфир", x: rm2.length && r.chance(0.6) ? "Сквозь шипение — обрывок разговора: «" + rm2[0] + "»" : fromPool("tx:ether", LAB.FIX.TX.ether) }; }
    case "memorial": {
      var names = []; for (i = 0; i < r.int(3, 6); i++) names.push(randPerson(r).fio);
      return { t: "Памятная доска", x: "Имена, выбитые по одному: " + names.join(", ") + ". " + fromPool("tx:memorial", LAB.FIX.TX.memorial) };
    }
    case "tape": case "abacus": case "counting": { var n1 = r.int(3, 999), n2 = r.int(3, 999); return { t: "Цифры", x: "Отложено " + n1 + ", рядом карандашом: «минус " + n2 + ", итого " + Math.max(0, n1 - n2) + "». " + fromPool("tx:" + (kind === "counting" ? "tape" : kind), LAB.FIX.TX[kind === "counting" ? "tape" : kind]) }; }
    case "seismo": { return { t: "Ленты самописцев", x: "Зубцы ровные, потом " + r.int(2, 9) + " волн подряд, отметка дежурного: «" + LAB.agen.timeWords(c.tm) + "». " + fromPool("tx:seismo", LAB.FIX.TX.seismo) }; }
  }
  out = LAB.FIX.TX[kind];
  return { t: "Запись", x: fromPool("tx:" + kind, out) || "Текст выцвел." };
}
/* Журнал смены — строки глубины с людьми, номерами и временем этажа. */
function logText(r, n, o, sub) {
  var nt = NT(), arr = nt && nt.log;
  if (!arr || !arr.length) return null;
  var pick = picker(o || { id: "log" }, sub), t = 6 * 60 + r.int(0, 30) * 5, out = [];
  for (var i = 0; i < n; i++) {
    var c = ctxFor(r); c.tm = t; t += r.int(3, 40) * 5;
    out.push(R(pick("ln:log", arr), c));
  }
  return out.join(" ");
}

/* ════════ МЕНЮ ВЕЩИ ОБСТАНОВКИ ════════ */
function menu(o) {
  var def = fxDef(o);
  if (!def) return false;
  var s = st(o), items = [];
  def.a.forEach(function (a) { var it = actionItem(o, def, a, s); if (!it) return; if (Array.isArray(it)) items.push.apply(items, it); else items.push(it); });
  if (o.notes && o.notes.length && !s.notes && !def.a.some(function (a) { return a[0] === "search"; })) items.push({ label: "Взять записку", fn: function () { takeNotes(o); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say(examine(o)); } });
  UIx("menu", def.n, items);
  return true;
}
function actionItem(o, def, a, s) {
  var kind = a[0], label = a[1], p = a[2] || {};
  if (s.salv && kind !== "salvage" && SALV_KILLS[kind]) return null;
  switch (kind) {
    case "search": return s["s_" + label] ? { label: label + ": уже обыскано", info: true, keep: true, fn: function () { say("Здесь вы уже искали."); } } : { label: label, fn: function () { doSearch(o, def, label, p); } };
    case "salvage": return s.salv ? { label: "Разобрано на детали", info: true, keep: true, fn: function () { say(def.n + ": разобрано, остался остов."); } } : { label: label, fn: function () { doSalvage(o, def, p); } };
    case "harvest": {
      var left = s.harvAt ? p.every - (nowMin() - s.harvAt) : 0;
      return left > 0 ? { label: label + ": созреет через " + minW(left), info: true, keep: true, fn: function () { say("Ещё рано: созреет через " + minW(left) + "."); } } : { label: label, fn: function () { doHarvest(o, def, p); } };
    }
    case "free": return s.freed ? null : { label: label, fn: function () { s.freed = 1; spend(1); var m = []; gm().bodyApply({ neuro: -12 }, m); say("Дверца клетки открыта. Птицы-машины выпархивают, кружат под потолком и вылетают в коридор, перекликаясь щелчками. " + m.join(" ")); ev("free", 1); } };
    case "respect": return s.resp ? { label: "Вы уже почтили память", info: true, keep: true, fn: function () { say("Вы уже стояли здесь молча."); } } : { label: label, fn: function () { doRespect(o, s); } };
    case "strip": return s.strip ? null : { label: label, fn: function () { doStrip(o, def, s); } };
  }
  var base = { label: label, fn: function () { run(o, def, kind, p, label); } };
  if (kind === "rest" && REST_DRINK[o.fx]) { var combos = drinkCombos(o, def, p, label); if (combos.length) return [base].concat(combos); }
  return base;
}
/* Где отдых сочетается с напитком из рюкзака: «Посидеть на диване и выпить эспрессо». */
var REST_DRINK = { sofa: 1, armchair: 1, chair: 1, bench: 1, couch: 1, bunk: 1, pillows: 1, rocking: 1, moss: 1, sensorbed: 1, oven: 1, roots: 1, stars: 1, sauna: 1 };
function drinkCombos(o, def, p, label) {
  var g = G(), out = [], base = label.split(":")[0].replace(" и перевести дух", "");
  Object.keys(LAB.ITEMS).forEach(function (k) {
    var d = LAB.ITEMS[k];
    if (out.length >= 4 || !(g.inv[k] > 0) || d.kind !== "food" || !d.acc) return;
    out.push({ label: base + " и выпить " + d.acc, fn: function () { run(o, def, "rest", p, label, k); } });
  });
  return out;
}
/* После разборки прибор больше не работает. */
var SALV_KILLS = { listen: 1, read: 1, scan: 1, cams: 1, play: 1, game: 1, vent: 1, map: 1, neuro: 1, clock: 1, mirror: 1 };
function run(o, def, kind, p, label, withId) {
  var s = st(o), cnt = (s["n_" + kind] = (s["n_" + kind] || 0) + 1), m = [], rm = roomOf(o);
  /* прочитанное при новом прочтении то же самое; эфир и экраны — каждый раз другие */
  var r = rng(o, kind + ":" + (kind === "read" && p.pool !== "ether" && p.pool !== "screens" ? 0 : cnt));
  switch (kind) {
    case "rest": {
      if (danger()) { LAB.UI.error && LAB.UI.error(); say("Не до отдыха: рядом опасность."); return; }
      UIx("closeAll");
      spend(p.m || 10);
      gm().bodyApply({ wake: p.wake || 0, neuro: p.neuro || 0, detox: p.tox < 0 ? -p.tox : 0, tox: p.tox > 0 ? p.tox : 0, rad: p.rad || 0, stopBleed: !!p.stopBleed }, m);
      /* здоровье — доля от полного, но не меньше пяти единиц: даже стул и скамья дают передохнуть телу */
      if (p.hp) { var hv = Math.max(5, Math.round(G().hpMax * p.hp)); G().hp = Math.min(G().hpMax, G().hp + hv); m.push("Здоровье " + G().hp + "."); }
      if (p.unslow && G().st.slow) { G().st.slow = 0; m.push("Ноги снова слушаются."); }
      snd("cloth", null);
      if (withId && LAB.ITEMS[withId] && G().inv[withId] > 0) {
        /* отдых с напитком: сначала глоток (своя фраза), потом покой — и в покое напиток действует лучше */
        var dd = LAB.ITEMS[withId], bonus = { neuro: -5 }, bm = [];
        if (dd.wake > 0) bonus.wake = Math.max(5, Math.ceil(dd.wake * 0.25));
        gm().useItem(withId);
        gm().bodyApply(bonus, bm);
        sayq(restLine(o, r) + " " + m.join(" ") + (bm.length ? " В покое напиток действует лучше: " + bm.join(" ") : ""));
        ev("rest_drink", 1);
      } else say(restLine(o, r) + " " + m.join(" "));
      ev("rest_fx", 1);
      return;
    }
    case "hide": {
      UIx("closeAll");
      G().st.cloak = Math.max(G().st.cloak || 0, 16); G().noise = 0;
      say("Вы затаились: " + (o.fx === "bunk" ? "под койкой" : "под столом") + " тесно и пыльно, дыхание само становится тише. Пока вы не двигаетесь, вас не видно.");
      ev("hide", 1);
      return;
    }
    case "read": {
      var tx = gen(p.pool, o, r, p.pool === "ether" || p.pool === "screens" ? cnt % 4 : 0);
      spend(2); snd("paper_turn", "paper");
      UIx("note", tx.t, tx.x, function () { menu(o); });
      if (tx.src) s.lastSrc = tx.src;
      ev("read", 1);
      return;
    }
    case "code": {
      var cd = boardCode(o, r);
      spend(1); snd("paper", null);
      UIx("note", "Доска", cd || gen("board", o, r).x, function () { menu(o); });
      return;
    }
    case "phone": {
      snd("phone_pick", "term_beep");
      var q = r.next(), line;
      if (q < 0.35) { var rr = lines("rumor", 1, r, picker(o, (s.n_phone || 0) % 4)); line = rr.length ? "В трубке — чужой разговор на параллельной линии: «" + rr[0] + "» Щелчок, гудки." : "Длинный гудок. Никто не берёт."; }
      else if (q < 0.55) line = "Гудок, щелчок — и автоответчик: «Абонент на смене. Перезвоните после карантина». Потом тишина.";
      else if (q < 0.7 && LAB.oko && LAB.oko.speak) { line = "В трубке — не гудок, а дыхание. Потом голос ОКО."; say(line); setTimeout(function () { LAB.oko.speak("taunt", true); }, 1500); noise(2); return; }
      else if (q < 0.85) line = "Линия трещит, и сквозь треск — голоса группы у лифта: «…батареи на исходе… кто-нибудь, если слышит…». Связь обрывается.";
      else line = "Тишина. Только ваше дыхание возвращается из трубки, чуть позже, чем должно.";
      say(line);
      return;
    }
    case "body": {
      var last = s.bodyAt || -1e9;
      if (nowMin() - last < 20) { say("Вы только что этим пользовались: подождите немного."); return; }
      s.bodyAt = nowMin();
      spend(p.m || 2);
      var fx = p.fx || {};
      gm().bodyApply({ wake: fx.wake || 0, neuro: fx.neuro || 0, detox: fx.detox || 0, food: fx.food || 0, rad: p.rad || 0 }, m);
      if (fx.heal) { G().hp = Math.min(G().hpMax, G().hp + fx.heal); m.push("Здоровье " + G().hp + "."); }
      if (p.snd) snd(p.snd, null);
      say((p.t || "") + " " + m.join(" "));
      ev("drink_fx", 1);
      return;
    }
    case "cook": cookMenu(o); return;
    case "listen": {
      spend(p.m || 1);
      if (p.neuro || p.tox || p.wake) gm().bodyApply({ neuro: p.neuro || 0, tox: p.tox || 0, wake: p.wake || 0 }, m);
      if (p.noise) noise(p.noise);
      listenSound(o);
      say(p.t + (m.length ? " " + m.join(" ") : ""));
      return;
    }
    case "wish": {
      if (G().credits < 1) { say("Монетки нет: кредитов ноль."); return; }
      G().credits--; snd("coin", "pickup");
      say("Монетка звякает о дно. " + r.pick(WISH));
      if (!s.wished) { s.wished = 1; ev("wish", 1); }
      return;
    }
    case "vent": {
      spend(2); snd("fan_on", "power_up");
      if (rm && rm.gas) { var fs = CUR().fs; fs.vented = fs.vented || {}; fs.vented[rm.id] = nowMin() + 120; say("Вытяжка загудела, сквозняк потянул воздух в решётку: газ уходит. Часа два здесь можно дышать."); ev("vent", 1); }
      else say("Вентилятор загудел, воздух посвежел. Газа здесь нет, но дышать стало легче.");
      noise(2);
      return;
    }
    case "mirror": {
      spend(1); if (p.rad) gm().bodyApply({ rad: p.rad }, m);
      say(heroPortrait() + (m.length ? " " + m.join(" ") : ""));
      return;
    }
    case "scan": {
      var g = G(), nw = g.weapons.length;
      snd(nw ? "alarm_short" : "term_beep", "term_beep");
      say(nw ? "Рамка звенит на весь пост: металл. «Эхо» насчитывает " + nw + " " + pl(nw, "ствол", "ствола", "стволов") + " и батареи в рюкзаке." : "Рамка молчит: металла при вас почти нет.");
      if (nw) noise(4);
      return;
    }
    case "cams": {
      var cb = LAB.combat, cams = cb && cb.cams ? cb.cams() : [];
      var off = cams.filter(function (f) { return cb.camState(f) === "off"; }).length;
      say(cams.length ? "На мониторах — " + cams.length + " " + pl(cams.length, "камера", "камеры", "камер") + " этажа: " + (cams.length - off) + " " + pl(cams.length - off, "работает", "работают", "работают") + ", " + off + " — без сигнала. Ослепить их можно с электрощита этажа или у самой камеры." : "Мониторы показывают рябь: камер на этаже нет.");
      return;
    }
    case "aim": {
      if (!gm().curWeapon || !gm().curWeapon()) { say("Нужно оружие: достаньте его."); return; }
      spend(10); snd("shot_energy", "term_beep"); noise(5);
      var tr = G().train = G().train || {};
      tr.aim = (tr.aim || 0) + 1;
      say("Мишени щёлкают одна за другой. «Эхо» подсказывает поправку." + (tr.aim % 3 === 0 && tr.aim <= 15 ? " Рука твёрже: меткость немного выросла." : " Ещё пара заходов — и рука станет твёрже."));
      ev("aim", 1);
      return;
    }
    case "plate": {
      var inv = G().inv;
      if ((inv.scrap || 0) < 3) { say("Нужно три куска металлолома: пресс выправляет пластину из лома."); return; }
      inv.scrap -= 3; inv.plate = (inv.plate || 0) + 1; spend(10); snd("press_hit", "pry"); noise(8);
      say("Пресс ухает, лом сминается в ровный лист. Бронепластина готова: её вставляют в надетую броню.");
      return;
    }
    case "map": {
      gm().mapFloor(); spend(2); snd("term_ok", null);
      say("Вы ведёте пальцами по схеме, «Эхо» запоминает: коридоры, двери и помещения этажа теперь на вашей карте.");
      ev("map", 1);
      return;
    }
    case "weigh": {
      var base = 55 + (h32(G().seed + "w") % 30), kg = base + Math.round(G().weapons.length * 2.5 + (G().armor ? 6 : 0));
      say("Стрелка весов дрожит и останавливается: " + kg + " килограммов вместе со снаряжением. Без рюкзака и брони было бы около " + base + ".");
      return;
    }
    case "queue": {
      if (!s.ticket) { s.ticket = r.int(900, 999); s.qAt = nowMin(); say("Аппарат щёлкает и выдаёт талон: номер " + s.ticket + ". Табло показывает " + (s.ticket - r.int(1, 4)) + ". Ожидайте вызова."); return; }
      if (s.served) { say("Ваш талон уже обслужен. Повторное обращение — после конца очереди, то есть никогда."); return; }
      UIx("closeAll"); spend(15);
      s.served = 1;
      var w = r.next();
      if (w < 0.35) { var cr = LAB.credits(8 + r.int(0, 10), G().L, G().F); G().credits += cr; say("Табло: «Номер " + s.ticket + ", окно четыре». Окно выдаёт конверт: возврат излишне удержанного. " + cr + " кредитов."); }
      else if (w < 0.6) { gm().mapFloor(); say("Табло: «Номер " + s.ticket + "». Из окна выезжает схема этажа с печатью «Копия верна». «Эхо» запоминает её."); }
      else say("Табло: «Номер " + s.ticket + "». Окно отвечает: «Ваш вопрос рассмотрен. Отказано. Спасибо за ожидание». Вам вежливо возвращают талон с дыркой.");
      ev("queue", 1);
      return;
    }
    case "mend": {
      var a0 = G().armor;
      if (!a0) { say("Броня не надета: подшивать нечего."); return; }
      if (s.mended) { say("Нитки кончились: катушка пуста."); return; }
      if (LAB.armorCond(a0) >= 85) { say("Швы и крепления брони целы: подшивать нечего. Остальное — у верстака."); return; }
      s.mended = 1; spend(20);
      a0.cond = Math.min(85, LAB.armorCond(a0) + 25);
      say("Вы ощупью подшиваете швы и крепления брони. Состояние " + Math.round(a0.cond) + " из 100, защита " + LAB.armorDef(a0) + ".");
      return;
    }
    case "echo": {
      spend(1); noise(6); snd("shout_echo", null);
      say("Голос уходит под потолок и возвращается " + (rm ? ((rm.x1 - rm.x0 + 1) * (rm.y1 - rm.y0 + 1) > 30 ? "не сразу: помещение большое" : "быстро: помещение тесное") : "издалека") + ". " + echoLine(rm));
      return;
    }
    case "clock": {
      if (p.temp) { say("Термометр: " + roomTemp(rm, o) + " градусов."); return; }
      var tm = gm().clock ? gm().clock() : "";
      say(era() === "O" ? "Стрелки идут назад. Если перевернуть циферблат, выходит " + tm + "." : era() === "M" ? "Часы из шестерён отбивают такт. На табло: " + tm + ". Ниже мелко: «Время учтено»." : "Часы показывают " + tm + ".");
      return;
    }
    case "play": playInst(o, p, s, r); return;
    case "game": {
      var mini = p.mini === "chess" ? (LAB.puzzles && LAB.puzzles.chess) : (LAB.mini && LAB.mini[p.mini]);
      if (!mini) { say("Фигуры перепутаны: партию не начать."); return; }
      UIx("closeAll");
      var done = function (ok) {
        if (ok && !s.won) { s.won = 1; gm().gainXP(12); var cr2 = LAB.credits(6, G().L, G().F); G().credits += cr2; say("Партия за вами. Под доской — забытая ставка: " + cr2 + " кредитов."); ev("game_win", 1); }
        else say(ok ? "Снова победа. Ставок больше нет — только удовольствие." : "Не вышло. Можно попробовать ещё раз.");
      };
      if (p.mini === "chess") mini(done, { title: def.n, seed: LAB.hash32(CUR().key + ":" + o.id + ":" + (s.won ? 1 : 0)) });
      else if (p.mini === "bulls") mini(3 + Math.min(1, Math.floor(G().L / 30)), done, { title: def.n });
      else mini(4 + Math.min(2, Math.floor(G().L / 25)), done, { title: def.n });
      return;
    }
    case "hoop": {
      spend(1);
      var sh = s.hoop = (s.hoop || 0) + 1, ok2 = r.chance(Math.min(0.75, 0.3 + (G().agi || 10) * 0.012));
      snd(ok2 ? "ball_net" : "ball_bounce", "bump");
      s.streak = ok2 ? (s.streak || 0) + 1 : 0;
      say(ok2 ? "Мяч шуршит сеткой: попали!" + (s.streak >= 3 ? " " + s.streak + " подряд!" : "") : "Мяч звонко отскакивает от кольца.");
      if (s.streak === 5) { ev("hoop5", 1); gm().gainXP(5); }
      return;
    }
    case "train": {
      var b = G().body;
      if (b && b.wake < 15) { say("Слишком устали для тренировки: сначала отдохните."); return; }
      if (danger()) { say("Не время: рядом опасность."); return; }
      UIx("closeAll"); spend(20);
      gm().bodyApply({ wake: -6, food: -4 }, m);
      var tr2 = G().train = G().train || {};
      tr2.str = (tr2.str || 0) + 1;
      var up = tr2.str % 3 === 0 && G().str < 30;
      if (up) G().str++;
      snd("gym", "cloth");
      say("Двадцать минут на тренажёре: мышцы гудят." + (up ? " Сила выросла: теперь " + G().str + "." : " Ещё немного — и сила вырастет.") + " " + m.join(" "));
      ev("train", 1);
      return;
    }
    case "neuro": {
      if (s.nAt && nowMin() - s.nAt < 60) { say("Кресло ещё остывает: подождите час."); return; }
      s.nAt = nowMin(); spend(10);
      gm().bodyApply({ neuro: -35, wake: -5 }, m);
      snd("hum", null);
      say("Электроды холодят виски, в ушах — ровный низкий гул. Мысли раскладываются по полкам. " + m.join(" "));
      return;
    }
  }
  say("Ничего не происходит.");
}
var WISH = ["Вы загадываете выйти наверх. Вода отвечает тихим плеском.", "Вы загадываете, чтобы группа у лифта дождалась. Где-то наверху гудит вентиляция — будто в ответ.", "Вы загадываете снова увидеть свет. «Эхо» молчит, но как-то по-доброму.", "Вы ничего не загадываете: просто слушаете, как монетка ложится к другим.", "Вы загадываете тишины для тех, кто здесь остался."];
function restLine(o, r) {
  var L0 = { sofa: "Пружины скрипят, подушки пахнут пылью и чужим одеколоном. Вы сидите, слушая, как гудит вентиляция.", bunk: "Сетка койки прогибается. Вы лежите, глядя в темноту, которой нет разницы, открыты глаза или нет.", couch: "Клеёнка кушетки холодит спину, потом теплеет.", armchair: "Кресло принимает вас, как своего.", pillows: "Подушки мягкие, тишина вокруг густая, как одеяло.", moss: "Мох пружинит и тепло пахнет землёй. Звуки гаснут, будто их кто-то накрыл ладонью.", rocking: "Качалка поскрипывает, как часы.", sauna: "Жар обнимает, пот смывает усталость.", rain: "Тёплые капли стучат по плечам. Дышится легко.", stars: "Над вами щёлкают проекторы, «Эхо» вполголоса называет созвездия.", oven: "Печь греет спину, как живая.", mats: "Маты пахнут резиной и потом. Вы растягиваетесь во весь рост." };
  return L0[o.fx] || r.pick(["Вы сидите, переводя дух.", "Минуты идут медленно, и это хорошо.", "Дыхание выравнивается."]);
}
function listenSound(o) {
  var M = { aquarium: "ev_bubbles", pond: "ev_bubbles", dewar: "ev_steam", vats: "ev_bubbles", turnstile: "turnstile", forklift: "horn", winch: "winch", minecart: "cart", speaker: "hum", coils: "hum", turbine: "hum", bell: "bell", stamps: "stamp", beehive: "buzz", birdcage: "birds", drone: "drone_fly", metronome: "tick", pendulum: "tick" };
  if (M[o.fx]) snd(M[o.fx], null);
}
function echoLine(rm) {
  if (!rm) return "";
  var n = (rm.doors || []).length;
  return n > 1 ? "Эхо приходит из " + n + " мест: это двери." : "Эхо приходит с одной стороны: выход один.";
}
function roomTemp(rm, o) {
  var base = { K: 21, P: 13, C: 27, O: 11, M: 31, I: 24 }[era()] || 20, d = (h32(o.id + CUR().key) % 7) - 3;
  if (rm && rm.rad >= 3) d += 4; if (rm && rm.state === "dark") d -= 3; if (rm && rm.state === "burnt") d += 2;
  return base + d;
}
function heroPortrait() {
  var g = G(), b = g.body || {}, parts = ["«Эхо» описывает снимок: силуэт человека с тонкой сеткой проводов вдоль виска — это ваш имплант."];
  parts.push(g.armor ? "На вас — " + g.armor.name.toLowerCase() + "." : "Брони на вас нет.");
  var w = gm().curWeapon ? gm().curWeapon() : null;
  if (w) parts.push("В руке — " + String(w.name || w.n || "оружие").toLowerCase() + ".");
  if (b.rad > 5) parts.push("Счётчик снимка отмечает облучение: " + Math.round(b.rad) + ".");
  parts.push("Здоровье " + g.hp + " из " + g.hpMax + ".");
  return parts.join(" ");
}
/* Мелом на доске бывает код режимного помещения этого этажа. */
function boardCode(o, r) {
  var s = st(o);
  if (s.code === 0) return null;
  if (!s.code) {
    var locked = CUR().fl.doors.filter(function (d) { return d.annex && d.lock && d.lock.type === "code"; });
    if (!locked.length || h32(o.id + CUR().key) % 3 !== 0) { s.code = 0; return null; }
    var d = locked[h32(o.id) % locked.length], rm = CUR().fl.rooms[d.room];
    s.code = { c: d.lock.code, n: rm.name, num: rm.num };
  }
  G().codes[s.code.c] = s.code.n;
  return "В углу доски, под формулами, мелом: «" + s.code.n + ", помещение " + s.code.num + " — " + s.code.c.split("").join(" ") + "». «Эхо» запоминает код.";
}
/* Сыграть: короткая мелодия на инструменте (записи нот), шум зовёт тварей. */
var TUNES = { lullaby: [392, 330, 294, 330, 262], bell: [523, 0, 523, 0, 659], piano: [262, 330, 392, 523, 392, 330], guitar: [196, 247, 294, 392, 294], accordion: [262, 330, 392, 349, 294, 262] };
/* (1.6) У инструмента свой тембр и поле для игры: три ряда нот. Знакомая
   мелодия — как прежде, своим голосом инструмента. */
function playInst(o, p, s, r) {
  var def = fxDef(o), I = LAB.instruments, inst = p.inst || "piano";
  /* (2.0) записи нот — заранее, пока выбирают, что сыграть */
  if (I && I.preload) I.preload(inst);
  UIx("menu", def.n, [
    { label: "Сыграть знакомую мелодию", fn: function () { tuneInst(o, p, s); } },
    { label: LAB.K("Играть самому: весь экран — инструмент", "Играть самому: три ряда нот"), fn: function () {
      UIx("closeAll");
      if (!I) { say("Инструмент молчит."); return; }
      I.open(inst, { name: def.n, noise: p.noise }, function (played) {
        if (played > 0) { var m = []; gm().bodyApply({ neuro: -Math.min(16, 6 + played) }, m); say("Вы отходите от инструмента. " + m.join(" ")); ev("play", 1); }
        else say("Вы отходите от инструмента.");
      });
    } },
    { label: "Осмотреть", keep: true, fn: function () { say(examine(o)); } }
  ]);
}
function tuneInst(o, p, s) {
  if (s.playAt && nowMin() - s.playAt < 5) { say("Пальцы ещё помнят прошлую мелодию: дайте им отдохнуть минуту-другую."); return; }
  s.playAt = nowMin();
  UIx("closeAll");
  var seq = TUNES[p.inst] || TUNES.piano, T0 = LAB.UI && LAB.UI.tone, I = LAB.instruments;
  if (I && I.tune) I.tune(p.inst || "piano", seq, 0.4);
  else if (T0) seq.forEach(function (f, i) { if (f) T0(f, 0.36, 0, 0.18, 0.15 + i * 0.4); });
  var m = []; gm().bodyApply({ neuro: -12 }, m);
  if (p.noise) noise(p.noise);
  setTimeout(function () { say({ lullaby: "Колыбель качается, мелодия тянется сама.", bell: "Колокол гудит долго: звук уходит по коридорам.", piano: "Клавиши чуть расстроены, но мелодия узнаётся.", guitar: "Струны отзываются тепло, одна дребезжит.", accordion: "Меха вздыхают, аккорды плывут по комнате." }[p.inst] + " " + m.join(" ")); }, 600 + seq.length * 400);
  ev("play", 1);
}
/* Разогреть еду на плите или в печи: сытнее и бодрит. */
function cookMenu(o) {
  var g = G(), foods = Object.keys(LAB.ITEMS).filter(function (k) { return LAB.ITEMS[k].kind === "food" && g.inv[k] > 0 && (LAB.ITEMS[k].food || 0) >= 5; });
  if (!foods.length) { say("Разогревать нечего: в рюкзаке нет еды."); return; }
  UIx("menu", "Разогреть", foods.map(function (k) {
    var d = LAB.ITEMS[k];
    return { label: d.n + " (" + g.inv[k] + ")", fn: function () {
      g.inv[k]--; if (g.inv[k] <= 0) delete g.inv[k];
      spend(6); snd("sizzle", "eat_chew");
      var m = []; gm().bodyApply({ food: Math.round((d.food || 0) * 1.3), detox: d.detox || 0, wake: 4 }, m);
      if (d.heal) { g.hp = Math.min(g.hpMax, g.hp + d.heal + 2); m.push("Здоровье " + g.hp + "."); }
      if (d.en) { g.en = Math.min(g.enMax, g.en + d.en); }
      say("Тёплая еда пахнет домом. Вы едите, обжигаясь. " + m.join(" "));
      ev("cook", 1);
    } };
  }));
}

/* ── обыскать, разобрать, собрать урожай ── */
var TAGMAP = { cushion: "smoke", top: "store", under: "smoke", med: "med", mattress: "stash", drawer: "paper", guard: "arms", food: "food", home: "home", bread: "food", smoked: "food", barrel: "food", soil: "herbs", seeds: "herbs", bio: "bio", lab: "chem", rad: "rad", arms: "armory", pockets: "smoke", parcel: "tech", cash: "smoke", ore: "parts", tools: "tech", janitor: "janitor", mail: "paper", lost: "smoke", expedition: "protect", laundry: "home" };
function doSearch(o, def, label, p) {
  var s = st(o);
  if (s["s_" + label]) { say("Здесь вы уже искали."); return; }
  /* (2.5) пакость: игла в ящике тумбочки, клещ под матрасом (stash.js) */
  if (LAB.stash && LAB.stash.guard(o, function () { doSearch(o, def, label, p); })) return;
  s["s_" + label] = 1;
  spend(2); snd("search", "pickup");
  /* (2.6) пошаговый режим: обыск — ход, враги не ждут */
  if (LAB.combat && LAB.combat.spendTurns) { LAB.combat.spendTurns(1, "search"); if (G().dead) return; }
  var r = rng(o, "search:" + label), L = G().L, F = G().F, loot = [];
  if (risk(p.risk, r)) return;
  var tag = TAGMAP[p.tag] || "store";
  /* (2.5, просьба игрока) в тумбочке, под матрасом, в ящике — почти всегда что-то есть, бывает и две вещи */
  var n = p.tag === "mattress" || p.tag === "cash" ? 2 : r.chance(LAB.ach && LAB.ach.has("searcher") ? 0.97 : 0.88) ? (r.chance(0.25) ? 2 : 1) : 0;
  if (n && LAB.annexLoot) loot = LAB.annexLoot(r, L, F, tag, n > 1 ? "crate" : "desk", true).slice(0, n).filter(function (x) { return x.kind !== "weapon" && x.kind !== "armor"; });
  if (p.tag === "cash" || (p.tag === "cushion" && r.chance(0.5))) loot.push({ kind: "credits", n: LAB.credits(p.tag === "cash" ? 20 : 3 + r.int(0, 6), L, F) });
  if (p.tag === "lost" && r.chance(0.6)) { var vv = ["watch", "ring", "pen", "harmonica"].filter(function (k) { return LAB.ITEMS[k]; }); if (vv.length) loot.push({ kind: "item", item: r.pick(vv), n: 1 }); }
  /* записки, что лежали здесь с самого начала (annex.js) */
  if (o.notes && o.notes.length && !s.notes) { s.notes = 1; o.notes.forEach(function (src, i) { var it = Object.assign({ kind: "note", id: o.id + "-n" + i }, src); loot.push(it); }); }
  if (!loot.length) { say(r.pick(["Пусто: только пыль и крошки.", "Ничего, кроме фантика и пыли.", "Пальцы находят только паутину.", "Пусто. Кто-то искал здесь раньше вас."])); ev("search", 1); return; }
  var got = giveAll(loot);
  say("Найдено: " + got.join(" "));
  readFirstNote(loot);
  ev("search", 1);
  gm().autosaveSoon && gm().autosaveSoon();
}
function takeNotes(o) {
  var s = st(o); if (s.notes) return; s.notes = 1;
  var loot = o.notes.map(function (src, i) { return Object.assign({ kind: "note", id: o.id + "-n" + i }, src); });
  say("Взято: " + giveAll(loot).join(" "));
  readFirstNote(loot);
}
function readFirstNote(loot) {
  var nt = loot.filter(function (x) { return x.kind === "note"; })[0];
  if (!nt || !(LAB.settings && LAB.settings.autoRead) || danger()) return;
  var t = gm().noteText(nt);
  UIx("note", "«" + t.t + "»", (t.a ? t.a + ". " : "") + t.x, null, { queue: true });
}
/* Опасность вещи: укусит, ударит током, порежет. Защита — броня и прорезиненная ткань. */
function risk(kind, r) {
  if (!kind) return false;
  var g = G(), a = g.armor ? LAB.ARMORS[g.armor.base] : null, res = a && a.res ? a.res : {};
  var m = [];
  if (kind === "shock") {
    if ((g.inv.rubber || 0) > 0 || (a && /insulated|exo|bastion/.test(g.armor.base))) return false;
    if (!r.chance(0.45)) return false;
    var dm = r.int(5, 11); g.hp = Math.max(1, g.hp - dm); snd("zap", "shock"); say("Искра бьёт в пальцы! Минус " + dm + " здоровья. С прорезиненной тканью на руках было бы безопасно."); return false;
  }
  if (kind === "spark") { if (!r.chance(0.35)) return false; var d2 = r.int(3, 6); g.hp = Math.max(1, g.hp - d2); snd("zap", "shock"); say("Обломок искрит и жалит руку. Минус " + d2 + " здоровья."); return false; }
  if (kind === "cut") { if ((g.inv.rubber || 0) > 0 || !r.chance(0.4)) return false; var d3 = r.int(2, 4); g.hp = Math.max(1, g.hp - d3); say("Острый край режет палец. Минус " + d3 + " здоровья."); return false; }
  if (kind === "bite") { if ((res.bio || 0) >= 0.3 || !r.chance(0.4)) return false; var d4 = r.int(4, 8); g.hp = Math.max(1, g.hp - d4); snd("bite", "hit"); say("Что-то в клетке кусает за руку! Минус " + d4 + " здоровья."); return false; }
  if (kind === "tox") { gm().bodyApply({ tox: 6 }, m); if (m.length) say("Пары раствора щиплют горло. " + m.join(" ")); return false; }
  if (kind === "sting") { if ((res.bio || 0) >= 0.3 || !r.chance(0.5)) return false; var d5 = r.int(2, 4); g.hp = Math.max(1, g.hp - d5); say("Пчела-машина жалит разрядом. Минус " + d5 + " здоровья."); return false; }
  return false;
}
function doSalvage(o, def, p) {
  var s = st(o); if (s.salv) return;
  if (danger()) { say("Не время возиться с отвёрткой: рядом опасность."); return; }
  var r = rng(o, "salv");
  risk(p.risk, r);
  s.salv = 1; spend(5); snd("salvage", "pry"); noise(4);
  var loot = [];
  for (var k in (p.parts || {})) if (LAB.ITEMS[k]) loot.push({ kind: "item", item: k, n: p.parts[k] });
  if (!loot.length) loot.push({ kind: "item", item: "scrap", n: 1 });
  say("Вы разбираете на ощупь, винт за винтом. Получено: " + giveAll(loot).join(" "));
  ev("salvage", 1);
}
function doHarvest(o, def, p) {
  var s = st(o), r = rng(o, "harv:" + nowMin());
  if (risk(p.risk, r)) return;
  s.harvAt = nowMin(); spend(2); snd("leaves", "pickup");
  var it = { kind: "item", item: LAB.ITEMS[p.item] ? p.item : "apple", n: r.chance(0.3) ? 2 : 1 };
  say("Собрано: " + gm().giveItem(it));
  ev("harvest", 1);
}
function doRespect(o, s) {
  s.resp = 1; spend(1);
  var m = []; gm().bodyApply({ neuro: -10 }, m);
  say("Вы стоите молча. «Эхо» тоже молчит — впервые за долгое время по своей воле. " + m.join(" "));
  ev("respect", 1);
}
function doStrip(o, def, s) {
  s.strip = 1;
  var r = rng(o, "strip"), L = G().L, F = G().F;
  var a = o.fx === "mannequin" ? LAB.genArmor(r, L, F, {}) : LAB.makeArmor(L > 10 && L <= 20 && LAB.ARMORS.g_rigrobe ? "g_rigrobe" : "suit", LAB.foeLevel(L, F), r.chance(0.5) ? 0 : 1);
  say((o.fx === "mannequin" ? "Вы снимаете с манекена костюм. " : "С вешалки — рабочая одежда, ещё крепкая. ") + gm().giveItem({ kind: "armor", a: a }));
}

/* ════════ ОСМОТРЕТЬ ════════
   Подробно — для любой вещи: что это, какая она, что с ней уже сделали,
   есть ли в ней что-нибудь. */
var FXCLASS = { sofa: "soft", armchair: "soft", couch: "soft", bunk: "soft", pillows: "soft", rocking: "wood", chair: "wood", bench: "wood", table: "wood", nightstand: "wood", counter: "wood", ledger: "paper", menu: "paper", dutydesk: "wood", kettle: "kitchen", samovar: "kitchen", stove: "kitchen", oven: "kitchen", cauldron: "kitchen", serving: "kitchen", coldroom: "metal", smoker: "kitchen", barrels: "wood", plants: "plant", appletree: "plant", mushrooms: "plant", herbs: "plant", moss: "plant", roots: "plant", palm: "plant", seedjars: "plant", beehive: "wood", mechflowers: "device", birdcage: "metal", drone: "device", microscope: "device", turnstile: "metal", frame: "device", forklift: "metal", conveyor: "metal", robotwreck: "metal", generator: "device", transformer: "device", cables: "metal", coils: "device", gears: "metal", lanterns: "device", lamprack: "metal", glass: "device", magnifier: "device", typewriter: "device", copier: "device", screens: "device", gauges: "device", projector: "device", headphones: "device", phone: "device", clock: "device", thermometer: "device", poster: "paper", graffiti: "paper", drawings: "paper", awards: "paper", notes: "paper", inkblots: "paper", memorial: "metal", piano: "wood", guitar: "wood", accordion: "wood", bell: "metal", chess: "wood", gym: "metal", targets: "metal", press: "metal", sewing: "device", scales: "metal", queue: "device", stamps: "wood", tubes: "metal", register: "device", minecart: "metal", cores: "metal", toolwall: "metal", ladder: "metal", cart: "metal", mailbag: "soft", boxlost: "wood", optable: "metal", expgear: "soft", washer: "device", hangers: "soft", mannequin: "soft", abacus: "wood", counting: "device", complaints: "paper", seismograph: "device", phonograph: "device", mirror: "metal", lamp: "device", stars: "device", aquarium: "device", globe: "device", metronome: "wood", pendulum: "metal", speaker: "device", sauna: "wood", rain: "device", shower: "metal", fountain: "metal", well: "wood", pond: "plant", eyewash: "metal", cage: "metal", labbench: "metal", hood: "metal", gloves: "metal", tank: "metal", cryopods: "device", gunrack: "metal", lightbox: "device", trays: "kitchen", dewar: "metal", redlamp: "device", vats: "metal", horns: "metal", toys: "wood", riftwindow: "device", ringpipe: "metal", turbine: "device", valves: "metal", vent: "metal", xray: "device", monitors: "device", scheme: "paper", soundmap: "paper", echo: "metal", stage: "wood", cradle: "wood", testbooth: "device", hoop: "metal", neurochair: "device", blackboard: "wood", sensorbed: "device", loom: "wood", wheel: "wood", mats: "soft", barricade: "wood" };
function wearOf(o) {
  var fr = FR(), cls = FXCLASS[o.fx];
  if (!fr || !fr.fxwear || !cls || !fr.fxwear[cls] || !fr.fxwear[cls].length) return "";
  var a = fr.fxwear[cls]; return a[h32(o.id + "|" + CUR().key + "|" + (o.seed || 0)) % a.length];
}
function examine(o) {
  if (!o) return "";
  var s = st(o), rm = roomOf(o), out = [];
  if (o.type === "fx") {
    var def = fxDef(o); if (!def) return "Вещь обстановки.";
    out.push(def.n + ". " + def.d);
    var w = wearOf(o); if (w) out.push(w);
    if (s.salv) out.push("Её уже разобрали на детали: остался остов.");
    for (var k in s) if (k.indexOf("s_") === 0) { out.push("Здесь вы уже искали."); break; }
    if (s.harvAt) { var left = 0; def.a.forEach(function (a) { if (a[0] === "harvest") left = a[2].every - (nowMin() - s.harvAt); }); out.push(left > 0 ? "Следующий урожай — через " + minW(left) + "." : "Снова можно собирать."); }
    if (o.notes && o.notes.length && !s.notes) out.push(def.a.some(function (a) { return a[0] === "search"; }) ? "Шуршит бумага: кажется, там что-то лежит." : "Сверху лежит сложенная записка.");
    if (rm && rm.owner && !rm.owner.m && h32(o.id) % 4 === 0) out.push("«Эхо» связывает эту вещь с хозяином помещения: " + rm.owner.n + ", " + rm.owner.post + ".");
    if (LAB.stash) { var tl0 = LAB.stash.examineLine(o); if (tl0) out.push(tl0); }
    return out.join(" ");
  }
  if (o.type === "corpse") { var ct = corpseText(o, identity(o)), tl1 = LAB.stash ? LAB.stash.examineLine(o) : ""; return tl1 ? ct + " " + tl1 : ct; }
  var od = LAB.OBJ[o.type] || {};
  out.push(gm().objName(o) + ". " + (od.desc || ""));
  var isBox = (LAB.CONTAINERS || []).indexOf(o.type) >= 0;
  if (isBox) {
    if (s.open) out.push((o.loot && o.loot.length) ? "Вы уже забрали всё, что было." : "Пусто: здесь вы уже искали.");
    else if (o.type === "safe") out.push("Кодовый замок на четыре цифры." + (o.code && G().codes && G().codes[o.code] ? " Код вам известен." : " Код хозяин наверняка где-то записал."));
    else if (o.type === "locker" && o.locked && !s.forced) out.push("Заперт на навесной замок: дужка холодная, тугая.");
    else if (o.loot && o.loot.length) out.push(BOXHINT[o.type] || "Внутри что-то есть.");
    else out.push("Похоже, внутри пусто — но проверить можно.");
  }
  if (o.type === "comp" && LAB.COMPS) { var cd = LAB.COMPS[o.kind] || LAB.COMPS.archive; out.push(cd.desc + (o.locked ? " Вход по паролю." : " Не заблокирован.")); }
  if (o.broken) out.push("Не работает: внутри что-то перегорело.");
  if (rm && rm.owner && (o.type === "desk" || o.type === "cabinet" || o.type === "locker")) out.push("На " + (o.type === "desk" ? "краю стола" : "дверце") + " — бирка: «" + rm.owner.n + "».");
  if (isBox && !s.open && LAB.stash) { var tl2 = LAB.stash.examineLine(o); if (tl2) out.push(tl2); }
  return out.join(" ");
}
var BOXHINT = { crate: "Внутри что-то перекатывается, когда ящик качнуть.", locker: "Внутри что-то шуршит и звякает.", desk: "Один ящик чуть выдвинут, в нём шуршит бумага.", shelf: "На полках — коробки и свёртки, не все пустые.", cabinet: "Ящики тяжёлые: папки, а между ними что-то ещё.", fridge: "Компрессор гудит: внутри, кажется, ещё есть еда.", firstaid: "За дверцей с крестом что-то гремит: упаковки, флаконы.", suitlocker: "Внутри висит что-то тяжёлое и шуршащее.", rack: "В гнёздах стойки что-то есть.", tubepost: "В ячейках выдачи — капсулы." };

/* ════════ ТЕЛА ════════
   Кто это был — по жетону и нашивке; что на нём — по ощупь; карманы,
   комбинезон или жилет, жетон для выживших, память. */
function identity(o) {
  if (LAB.agen && LAB.agen.corpse) return LAB.agen.corpse(G().seed, G().L, G().F, o);
  return { p: { fio: "Неизвестный", sign: "Неизвестный", first: "Неизвестный", f: false }, post: "сотрудник", outfit: ["рабочая одежда", "", ""], pose: "лежит у стены", near: "" };
}
function corpseText(o, id) {
  var s = st(o), out = [];
  out.push("Человек " + id.pose + ". «Эхо» читает жетон: «" + id.p.fio + "», и нашивку: «" + cap(id.post) + "».");
  out.push(s.stripped || !id.outfit[0] ? "" : "На нём — " + id.outfit[0] + ".");
  out.push(id.near);
  if (!s.pockets) out.push("Карманы оттопырены: там что-то есть.");
  if (s.badge) out.push("Жетон вы сняли.");
  if (s.open) out.push("Вещи вокруг вы уже обыскали.");
  return out.filter(Boolean).join(" ").replace(/На нём —/, id.p.f ? "На ней —" : "На нём —");
}
function corpseMenu(o) {
  var s = st(o), id = identity(o), items = [];
  items.push({ label: "Осмотреть тело", keep: true, fn: function () { say(corpseText(o, id)); } });
  if (!s.pockets) items.push({ label: "Обшарить карманы", fn: function () { pockets(o, id); } });
  if (!s.open) items.push({ label: "Обыскать вещи вокруг", fn: function () { gm().openContainer(o); } });
  if (!s.stripped && id.outfit[1] && LAB.ARMORS[id.outfit[2]]) items.push({ label: cap(id.outfit[1]), fn: function () { stripBody(o, id); } });
  if (!s.badge) items.push({ label: "Снять жетон: " + id.p.sign, fn: function () { takeBadge(o, id); } });
  if (!s.resp) items.push({ label: "Почтить память", fn: function () { s.resp = 1; var m = []; gm().bodyApply({ neuro: -8 }, m); say("Вы стоите рядом молча. " + id.p.first + " — «Эхо» произносит имя тихо, будто боится разбудить. " + m.join(" ")); ev("respect", 1); } });
  UIx("menu", "Тело: " + id.p.sign, items);
}
function pockets(o, id) {
  var s = st(o); if (s.pockets) return;
  /* (2.5) граната под телом, клещ в складках одежды (stash.js) */
  if (LAB.stash && LAB.stash.guard(o, function () { pockets(o, id); })) return;
  s.pockets = 1;
  spend(1); snd("cloth", "pickup");
  var r = rng(o, "pockets"), L = G().L, F = G().F, loot = [];
  if (r.chance(0.55)) loot.push({ kind: "credits", n: LAB.credits(3 + r.int(0, 10), L, F) });
  if (r.chance(0.45) && LAB.annexLoot) { var x = LAB.annexLoot(r, L, F, r.pick(["smoke", "food", "home"]), "floor", true)[0]; if (x && x.kind !== "weapon" && x.kind !== "armor") loot.push(x); }
  if (o.notes && o.notes.length) o.notes.forEach(function (src, i) { loot.push(Object.assign({ kind: "note", id: o.id + "-p" + i }, src)); });
  /* (2.5, просьба игрока) пустые карманы — редкость: хоть мелочь, да найдётся */
  if (!loot.length && r.chance(0.8)) loot.push({ kind: "credits", n: LAB.credits(2 + r.int(0, 6), L, F) });
  if (!loot.length) { say("В карманах — только песок и обрывок билета."); return; }
  say("В карманах: " + giveAll(loot).join(" "));
  readFirstNote(loot);
}
function stripBody(o, id) {
  var s = st(o); if (s.stripped) return; s.stripped = 1;
  spend(3); snd("cloth", null);
  var r = rng(o, "strip"), a = LAB.makeArmor(id.outfit[2], LAB.foeLevel(G().L, G().F), r.chance(0.6) ? 0 : 1);
  say("Вы осторожно снимаете " + id.outfit[0] + ". " + gm().giveItem({ kind: "armor", a: a }));
}
function takeBadge(o, id) {
  var s = st(o); if (s.badge) return; s.badge = 1;
  var g = G();
  g.inv.badge = (g.inv.badge || 0) + 1;
  g.badges = g.badges || [];
  if (g.badges.length < 200) g.badges.push({ n: id.p.fio, p: id.post, L: g.L, F: g.F });
  snd("pickup", null);
  say("Жетон «" + id.p.fio + "» у вас. Выжившие передадут имя наверх. Жетонов: " + g.inv.badge + ".");
  ev("badge", 1);
}
/* Выжившим — жетоны погибших: награда и строчка в журнале. */
function badgeItem(n) {
  var g = G();
  if (!(g.inv.badge > 0)) return null;
  return { label: "Передать жетоны погибших: " + g.inv.badge, fn: function () {
    var k = g.inv.badge; g.inv.badge = 0;
    var cr = LAB.credits(8, g.L, g.F) * k; g.credits += cr; gm().gainXP(10 * k);
    g.stats.badges = (g.stats.badges || 0) + k;
    gm().journal && gm().journal("Передано жетонов погибших: " + k + ".");
    say((n && n.n ? n.n + " берёт жетоны" : "Жетоны берут") + " бережно, читает каждое имя вслух. «Мы передадим наверх. Спасибо, седьмой». Вам дают " + cr + " кредитов из общего котла.");
    ev("badges_given", k);
  } };
}

LAB.fixtures = { menu: menu, examine: examine, corpseMenu: corpseMenu, identity: identity, badgeItem: badgeItem, read: gen, _logText: logText };
})();
