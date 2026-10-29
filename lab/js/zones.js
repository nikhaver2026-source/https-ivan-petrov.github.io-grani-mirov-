/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — кабинеты и особые зоны в игре (1.5).
   Что делают вещи кабинетов у коридоров (annex.js): стеллажи, шкафы,
   холодильники и стойки обыскивают; книги, доски объявлений, журналы
   смен и фотографии читают и разглядывают («Эхо» описывает снимки);
   у раковины умываются, в дезактивационном душе смывают радиоактивную
   пыль, на электрощите гасят камеры этажа и снимают блокировки ОКО.
   Компьютеры — разного назначения и значимости: архив, медицинский,
   пульт наблюдения, радиационный контроль, складской учёт, диспетчер
   дверей, сервер отдела и главный компьютер режимного отдела.
   Особые зоны: излучение (облучение копится, дозиметр щёлкает и
   называет фон), газ (токсины, если без респиратора), горячие камеры —
   санпропускник пускает только в защитном костюме. Стенд допуска —
   три трудные задачи подряд, награда — защита от излучения.
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
function idx(x, y) { return y * LAB.W + x; }
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function st(o) { return gm().objState(o); }
function TX() { return LAB.ANNEX_T || {}; }
function era() { return LAB.annexEra(G().L); }
function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }
function snd(id, fb) { if (LAB.Bank && LAB.Bank.has && LAB.Bank.has(id)) A("play", id); else if (fb) A("play", fb); }
function pct(x) { return Math.round(x * 100); }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
function spend(min) { if (min > 0) gm().advanceTime(min); }
function nowMin() { return (G().day || 0) * 1440 + (G().min || 0); }

/* ════════ ОСОБЫЕ ЗОНЫ: ИЗЛУЧЕНИЕ И ГАЗ ════════
   Фон 1–5: доза облучения за шаг (минуту по часам комплекса) и, слабее,
   за каждый такт, пока стоите. Костюм гасит свою долю, йодид калия —
   половину. Газ 1–3: токсины за шаг; респиратор и фильтр — защита
   полностью, изолирующий костюм — частично. */
var RAD = [0, 0.12, 0.35, 0.9, 1.8, 3.5];
var GAS = [0, 0.6, 1.2, 2.4];
var RAD_N = ["нет", "слабый", "заметный", "высокий", "очень высокий", "смертельно опасный"];
function roomHere() { var c = CUR(); if (!c || !c.fl || !G()) return null; var r = c.fl.room[idx(G().x, G().y)]; return r >= 0 ? c.fl.rooms[r] : null; }
function armorDef() { var a = G().armor; return a ? LAB.ARMORS[a.base] : null; }
function protRad() { var d = armorDef(); return (d && d.res && d.res.rad) || 0; }
function protChem() { var d = armorDef(); return (d && d.res && d.res.chem) || 0; }
function hasDosimeter() { return (G().inv.dosimeter || 0) > 0; }
function radDose(level, k) { return (RAD[level] || 0) * k * (1 - protRad()) * (G().st.radBlock > 0 ? 0.5 : 1) * (LAB.ach && LAB.ach.has("lead") ? 0.9 : 1) * (1 - (LAB.implants ? Math.min(0.7, LAB.implants.stat("rad")) : 0)); }
function gasDose(level, k) {
  if (G().st.antitox > 0) return 0;
  var m = 1 - protChem();
  if (gm().armorSpecial && gm().armorSpecial("antitox")) m *= 0.5;
  if (LAB.ach && LAB.ach.has("lungs")) m *= 0.75;
  return (GAS[level] || 0) * k * m;
}
function addRad(x) {
  var b = G().body;
  if (!b || !(x > 0)) return;
  b.rad = Math.min(100, (b.rad || 0) + x);
  G().stats.dose = (G().stats.dose || 0) + x;
  gm().bodyWarn();
}
function addTox(x) {
  var b = G().body;
  if (!b || !(x > 0)) return;
  b.tox = Math.min(100, (b.tox || 0) + x);
  gm().bodyWarn();
}
/* Изотопы в рюкзаке фонят понемногу. */
function carried() { var n = G().inv.isotope || 0; return n ? 0.02 * n * (1 - protRad()) : 0; }
function minutes(min) {
  if (!G() || !CUR() || !CUR().fl) return;
  var rm = roomHere();
  zoneCheck(rm);
  if (rm && rm.rad) addRad(radDose(rm.rad, min));
  if (rm && rm.gas && !vented(rm)) addTox(gasDose(rm.gas, min));
  var c = carried(); if (c) addRad(c * min);
}
/* Вытяжка, включённая на пару часов, выгоняет газ из помещения (fixtures.js). */
/* Проветрено ли помещение: вытяжка выгнала газ (и туман мутагена — chem.js) до этой минуты игры. */
function vented(rm) { var v = CUR().fs && CUR().fs.vented; return !!(rm && v && v[rm.id] > (G().day || 0) * 1440 + (G().min || 0)); }
var tickN = 0;
function tick() {
  if (!G() || !CUR() || !CUR().fl || G().dead) return;
  tickN++;
  var rm = roomHere();
  zoneCheck(rm);
  if (rm && rm.rad) addRad(radDose(rm.rad, 0.12));
  if (rm && rm.gas && !vented(rm)) { addTox(gasDose(rm.gas, 0.12)); if (tickN % 12 === 0) A("play", "ev_steam", { gain: 0.25 + 0.1 * rm.gas }); }
  /* дозиметр щёлкает: в зоне — по фону, у двери в неё — редко */
  if (hasDosimeter() && LAB.settings && LAB.settings.effects !== 0) { /* (3.5) прежде LAB.S — его не было, дозиметр молчал */
    var lv = rm && rm.rad ? rm.rad : nearRad();
    if (lv) geiger(lv);
  }
}
/* Рядом с дверью радиоактивного помещения (в двух шагах) — слабые щелчки. */
function nearRad() {
  var fl = CUR().fl, g = G();
  for (var i = 0; i < fl.doors.length; i++) {
    var d = fl.doors[i];
    if (!d.annex) continue;
    var rm = fl.rooms[d.room];
    if (rm && rm.rad && Math.abs(d.x - g.x) + Math.abs(d.y - g.y) <= 2) return CUR().fs.doors[d.id] === 2 ? Math.max(0.5, rm.rad - 2) : 0.3;
  }
  return 0;
}
/* Щелчки счётчика Гейгера: короткие всплески шума, чаще при сильном фоне. */
function geiger(level) {
  if (!LAB.Sound || !LAB.Sound.synth) return;
  var n = level < 1 ? (Math.random() < level ? 1 : 0) : Math.round(level * level * 0.55 + Math.random() * level);
  if (!n) return;
  LAB.Sound.synth(function (s) {
    var c = s.ctx;
    for (var i = 0; i < Math.min(14, n); i++) {
      var t = c.currentTime + Math.random() * 0.46;
      var src = s.noise("white", 0.02, false), hp = s.filter("highpass", 2600 + Math.random() * 900, 0.8), g = s.gain(0);
      src.connect(hp); hp.connect(g); g.connect(s.out());
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.45, t + 0.0012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.011);
      src.start(t); src.stop(t + 0.03);
    }
  }, 700, "fx", (Math.random() - 0.5) * 0.3, 0.5);
}
/* Вход в зону и выход из неё — «Эхо» говорит, что тут и чем защищены. */
var zoneKey = "";
function zoneCheck(rm) {
  var id = rm && (rm.rad || rm.gas) ? rm.id : -1, key = CUR().key + ":" + id;
  if (key === zoneKey) return;
  var was = zoneKey; zoneKey = key;
  if (id < 0) {
    if (was && was.split(":")[1] !== "-1" && was.split(":")[0] === CUR().key) sayq("Вы вышли из опасной зоны." + (G().body && G().body.rad >= 1 ? " Облучение " + Math.round(G().body.rad) + "." : ""));
    return;
  }
  var t = [];
  if (rm.rad) {
    if (hasDosimeter()) {
      t.push("Дозиметр защёлкал: фон " + rm.rad + " из пяти, " + RAD_N[rm.rad] + ".");
      t.push(protRad() > 0 ? "Костюм гасит " + pct(protRad()) + " процентов излучения." : "Защиты от излучения на вас нет.");
      if (G().st.radBlock > 0) t.push("Йодид калия ещё защищает.");
      if (rm.rad >= 4 && protRad() < 0.5) t.push("Здесь опасно надолго задерживаться.");
      ev("dosimeter", 1);
    } else if (rm.rad >= 2) t.push("Кожу покалывает, во рту металлический привкус: здесь фонит. Насколько сильно — сказал бы дозиметр.");
    else t.push("На стенах — знаки радиационной опасности.");
  }
  if (rm.gas) {
    t.push("Воздух едкий: щиплет глаза и горло.");
    t.push(G().st.antitox > 0 ? "Респиратор не пропускает газ." : "Без респиратора или фильтра здесь копятся токсины.");
  }
  if (t.length) sayq(t.join(" "));
  /* (3.5) в счёт вехи — каждая зона один раз: шаг из зоны и обратно новой зоной не считается */
  var zs = G().zonesSeen = G().zonesSeen || {};
  if (!zs[key]) { zs[key] = 1; ev("zone", 1); }
}
/* Санпропускник горячей камеры: пускает, если костюм гасит хотя бы половину излучения. */
function hazardBlock(d) {
  var need = (d.lock && d.lock.min) || 0.5, have = protRad();
  if (have >= need) return "";
  return "Санпропускник не пускает: нужна защита от излучения не меньше " + pct(need) + " процентов" + (G().armor ? ", а надетая броня гасит " + pct(have) + "." : ", а защитного костюма на вас нет.") + " Подойдут противорадиационный комбинезон «Свинец», изолирующий костюм «Барьер» или скафандр реакторщика: их собирают по схеме у верстака, заказывают с поверхности или получают наградой на стенде допуска.";
}

/* ════════ ВЕЩИ КАБИНЕТОВ ════════ */
var SEARCH = { shelf: "Обыскать стеллаж", cabinet: "Обыскать шкаф", fridge: "Открыть холодильник", firstaid: "Открыть аптечный шкафчик", suitlocker: "Открыть шкаф спецодежды", rack: "Осмотреть стойку и ящик", tubepost: "Проверить ячейки выдачи" };
function objMenu(o) {
  switch (o.type) {
    case "shelf": case "cabinet": case "fridge": case "firstaid": case "suitlocker": case "rack": case "tubepost": boxMenu(o); return true;
    case "bookshelf": bookshelfMenu(o); return true;
    case "board": boardMenu(o); return true;
    case "logbook": logbookMenu(o); return true;
    case "photos": photosMenu(o); return true;
    case "sink": sinkMenu(o); return true;
    case "decon": deconMenu(o); return true;
    case "fusebox": fuseMenu(o); return true;
    case "comp": compMenu(o); return true;
    case "trial": trialMenu(o); return true;
  }
  return false;
}
/* (3.5) окно хранилища собирается заново, когда к нему возвращаются (обыскали — «пусто»):
   прежде окно, устаревшее под окном обыска, закрывалось само */
function boxMenu(o) {
  var build = function () { return boxItems(o); };
  UIx("menu", LAB.OBJ[o.type].n, build(), { rebuild: build });
}
function boxItems(o) {
  var s = st(o), name = LAB.OBJ[o.type].n, items = [];
  if (s.open) items.push({ label: "Пусто: всё уже забрано", info: true, keep: true, fn: function () { say(name + ": пусто."); } });
  else items.push({ label: SEARCH[o.type] || "Обыскать", fn: function () { search(o); } });
  /* (3.6) папки картотеки — из архива библиотеки (library.js): дела людей этажа, приказы, отчёты, бывает записка с кодом */
  if (o.type === "cabinet") items.push({ label: "Пролистать папки", fn: function () { if (LAB.library) LAB.library.cabinetMenu(o); else readFiles(o); } });
  if (o.type === "tubepost") items.push({ label: "Прочитать квитанции", fn: function () { readReceipts(o); } });
  items.push({ label: "Осмотреть", keep: true, fn: function () { say(LAB.fixtures ? LAB.fixtures.examine(o) : name + ". " + LAB.OBJ[o.type].desc); } });
  return items;
}
function search(o) {
  var s = st(o);
  if (s.open) { say(LAB.OBJ[o.type].n + ": пусто."); return; }
  spend(2);
  /* с набором инструментов обыск тщательнее: находится ещё что-нибудь */
  if ((G().inv.toolkit || 0) > 0 && !s.tool && o.type !== "fridge") { /* (3.0) в холодильнике деталей и кредитов не бывает (kitchen.js) */
    s.tool = 1;
    var r = LAB.Rng(G().seed, "tk:" + CUR().key + ":" + o.id);
    if (r.chance(0.5)) { o.loot = (o.loot || []).slice(); o.loot.push(r.chance(0.5) ? { kind: "item", item: LAB.partAt ? LAB.partAt(r, G().L) : "scrap", n: 1 } : { kind: "credits", n: LAB.credits(5 + r.int(0, 10), G().L, G().F) }); }
  }
  /* (3.0) в холодильнике обычно не одна вещь: вторая кладётся при открытии (kitchen.js) */
  if (o.type === "fridge" && !s.cold2 && LAB.kitchen) { s.cold2 = 1; var x2 = LAB.kitchen.fridgeExtra(o); if (x2) { o.loot = (o.loot || []).slice(); LAB.kitchen.addTo(o.loot, x2); } }
  gm().openContainer(o);
  if (st(o).open) ev("search", 1); /* (3.5) в счёт — только состоявшийся обыск: окно ловушки и «Отойти» не считаются */
}
/* Папки картотеки: личные дела, отчёты, накладные — каждый раз другие. */
function readFiles(o) {
  var s = st(o); s.files = (s.files || 0) + 1;
  var r = LAB.Rng(G().seed, "files:" + CUR().key + ":" + o.id + ":" + s.files);
  spend(3); snd("paper_turn", "paper");
  var doc = r.chance(0.55) ? personnelFile(r) : r.chance(0.5) ? reportDoc(r) : invoiceDoc(r);
  UIx("note", doc.t, doc.x, function () { boxMenu(o); });
  if (!s.evRead) { s.evRead = 1; ev("read", 1); } /* (3.5) в счёт вехи — один раз за картотеку */
}
function readReceipts(o) {
  var r = LAB.Rng(G().seed, "rcpt:" + CUR().key + ":" + o.id + ":" + ((st(o).rc = (st(o).rc || 0) + 1)));
  spend(2); snd("paper", null);
  UIx("note", "Квитанции пневмопочты", invoiceDoc(r).x + " " + invoiceDoc(r).x, function () { boxMenu(o); });
  if (!st(o).evRcpt) { st(o).evRcpt = 1; ev("read", 1); }
}

/* ── книги, объявления, журнал, фотографии ── */
/* Книги — колодой этажа: на одном этаже одна и та же книга не стоит на двух полках, пока не кончатся все. */
var shelfDeal = {};
function dealt(kind, list, o, n) {
  var e = era(), all = (list || []).filter(function (q) { return !q.era || q.era.indexOf(e) >= 0; });
  if (!all.length) all = (list || []).slice();
  if (!all.length) return [];
  var k = CUR().key + "|" + kind, d = shelfDeal[k];
  if (!d) { var p = all.map(function (q, i) { return i; }); LAB.Rng(G().seed, "deal:" + k).shuffle(p); d = shelfDeal[k] = { p: p, i: 0, by: {} }; }
  if (!d.by[o.id]) { var out = []; for (var j = 0; j < n; j++) out.push(all[d.p[(d.i++) % all.length]]); d.by[o.id] = out; }
  return d.by[o.id];
}
/* (3.5) окно полки собирается заново, когда к нему возвращаются: книга — «прочитано»,
   «Поискать между книгами» после поиска пропадает (прежде поиск открывал вторую полку
   поверх первой, а из старой можно было искать снова) */
function bookshelfMenu(o) {
  var build = function () { return shelfItems(o); };
  UIx("menu", "Книжная полка", build(), { rebuild: build });
}
function shelfItems(o) {
  /* (3.6) книги — из общей библиотеки (library.js): разделы, чему учат, архив документов */
  var LB = LAB.library, books = LB ? LB.shelfBooks(o) : dealt("books", TX().books, o, 2 + (o.seed || 0) % 3), s = st(o), items = [];
  books.forEach(function (b) {
    if (LB) { items.push({ label: "«" + b.t + "»" + (b.a ? ", " + b.a : "") + " — " + (LB.CAT_W[b.cat] || "книга") + (LB.isRead(b, o) ? ", прочитано" : ""), fn: function () { LB.readText(b, o); } }); return; }
    items.push({ label: "«" + b.t + "»" + (b.a ? ", " + b.a : "") + (s["b_" + b.id] ? " — прочитано" : ""), fn: function () { readBook(o, b); } });
  });
  if (!s.between) items.push({ label: "Поискать между книгами", keep: true, fn: function () {
    if (s.between) { say("Между этими книгами вы уже искали."); return; }
    s.between = 1; spend(1); snd("paper", null);
    var r = LAB.Rng(G().seed, "betw:" + CUR().key + ":" + o.id);
    if (r.chance(0.45)) {
      var it = r.chance(0.5) ? { kind: "credits", n: LAB.credits(6 + r.int(0, 14), G().L, G().F) } : r.chance(0.5) ? { kind: "note", note: "staff", n: r.int(0, 999), id: "bt" + o.id } : { kind: "item", item: r.pick(["watch", "pen", "ring", "harmonica", "datachip"].filter(function (k) { return LAB.ITEMS[k]; })), n: 1 };
      say("Между книгами что-то есть. " + gm().giveItem(it));
    } else say("Между книгами — только пыль и закладка с телефонным номером без кода города.");
  } });
  items.push({ label: "Осмотреть полку", keep: true, fn: function () { say(LAB.OBJ.bookshelf.desc + " Книг здесь " + books.length + "."); } });
  return items;
}
function readBook(o, b) {
  var s = st(o), first = !s["b_" + b.id];
  s["b_" + b.id] = 1;
  var pages = String(b.x).split(/\n\n+/).length;
  spend(3 * pages);
  snd("paper_turn", "paper");
  UIx("note", "«" + b.t + "»" + (b.a ? ", " + b.a : ""), b.x.replace(/\n\n+/g, " ")); /* закрыли книгу — под ней та же полка, собранная заново */
  if (first) { G().stats.books = (G().stats.books || 0) + 1; ev("book", 1); }
}
function boardMenu(o) {
  var list = dealt("notices", TX().notices, o, 1).slice(), items = [];
  /* записки и заявки этого этажа: свои у каждой доски */
  if (LAB.fixtures && LAB.fixtures.read) {
    var rg = LAB.Rng(G().seed, "board:" + CUR().key + ":" + o.id);
    for (var bi = 0; bi < 2; bi++) { var gn = LAB.fixtures.read("letters", o, rg, bi); list.push({ id: "g" + bi, a: "", t: gn.t, x: gn.x }); }
    var rq = LAB.fixtures.read("complaints", o, rg, 2); list.push({ id: "rq", a: "", t: rq.t, x: rq.x });
  }
  /* и одно объявление из почты объекта своей глубины */
  var bk = LAB.blockData ? LAB.blockData(G().L) : null, lore = LAB.LORE && LAB.LORE.notices ? LAB.LORE.notices : [];
  var extra = bk && bk.notices && bk.notices.length && G().L > 10 ? bk.notices : lore;
  if (extra && extra.length) { var e = extra[h32(CUR().key + o.id) % extra.length]; if (e) list.push({ id: "lore", a: e[0], t: e[1], x: e[2] }); }
  list.forEach(function (n) { items.push({ label: "«" + n.t + "»" + (n.a ? ", " + n.a : ""), fn: function () { spend(1); UIx("note", n.t, (n.a ? n.a + ". " : "") + n.x.replace(/\n\n+/g, " "), function () { boardMenu(o); }); ev("read", 1); } }); });
  items.push({ label: "Осмотреть доску", fn: function () { say(LAB.OBJ.board.desc + " Объявлений: " + list.length + "."); } });
  UIx("menu", "Доска объявлений", items);
}
function logbookMenu(o) {
  var list = dealt("logs", TX().logs, o, 1).slice();
  if (LAB.fixtures && LAB.fixtures._logText) {
    var rl = LAB.Rng(G().seed, "logb:" + CUR().key + ":" + o.id), days = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"], d0w = rl.int(0, 6);
    for (var li = 2; li >= 0; li--) { var tx = LAB.fixtures._logText(rl, 4 + rl.int(0, 3), o, li); if (tx) list.unshift({ a: days[(d0w + li) % 7], x: tx }); }
  }
  var d0 = G().day, items = [];
  list.forEach(function (g, i) { items.push({ label: "Запись " + (i + 1) + (g.a ? ": " + g.a : ""), fn: function () { spend(1); snd("paper_turn", "paper"); UIx("note", "Журнал смены", (g.a ? g.a + ". " : "") + g.x, function () { logbookMenu(o); }); ev("read", 1); } }); });
  items.push({ label: "Осмотреть журнал", fn: function () { say(LAB.OBJ.logbook.desc + " Последняя запись сделана за несколько дней до карантина. Сегодня — день " + d0 + " вашего пути."); } });
  UIx("menu", "Журнал смены", items);
}
function photosMenu(o) {
  var list = dealt("photos", TX().photos, o, 1).slice(), items = [];
  if (LAB.fixtures && LAB.fixtures.read) { var rp = LAB.Rng(G().seed, "phot:" + CUR().key + ":" + o.id); for (var pi = 0; pi < 2; pi++) { var ph = LAB.fixtures.read("photos", o, rp, pi); list.push({ x: ph.x.replace(/^«Эхо» описывает снимок: /, "") }); } }
  list.forEach(function (p, i) { items.push({ label: "Снимок " + (i + 1), fn: function () { spend(1); say("«Эхо» описывает снимок. " + p.x, { read: true }); ev("photo", 1); } }); });
  items.push({ label: "Осмотреть стену", fn: function () { say(LAB.OBJ.photos.desc + " «Эхо» различает " + list.length + " " + pl(list.length, "снимок", "снимка", "снимков") + ": камера импланта видит их как пятна света и тени, а подписи читает."); } });
  UIx("menu", "Стена с фотографиями", items);
}

/* ── вода и дезактивация ── */
function sinkMenu(o) {
  UIx("menu", "Раковина", [
    { label: "Умыться холодной водой", fn: function () {
      /* как у чайника и душа: не чаще раза в двадцать минут, иначе здоровье можно было бы накручивать */
      var s = st(o), t = nowMin();
      if (s.washAt != null && t - s.washAt < 20) { say("Вы только что умывались: подождите немного."); return; }
      s.washAt = t;
      var b = G().body; spend(2); snd("drink_gulp", null); A("play", "ev_bubbles", { gain: 0.4 });
      var msg = []; gm().bodyApply({ wake: 12, detox: 5 }, msg);
      /* промытые ссадины меньше ноют: немного здоровья */
      if (G().hp < G().hpMax) { G().hp = Math.min(G().hpMax, G().hp + 5); msg.push("Здоровье " + G().hp + "."); }
      if (b && b.rad > 0) { b.rad = Math.max(0, b.rad - 5); msg.push("Радиоактивную пыль с лица и рук смыло."); }
      say("Холодная вода обжигает лицо, ссадины промыты. " + msg.join(" "));
    } },
    { label: "Попить воды из-под крана", fn: function () {
      /* (3.5) и попить — не чаще раза в двадцать минут: иначе сытость и бодрость накручивались глотками */
      var s = st(o), t = nowMin();
      if (s.sipAt != null && t - s.sipAt < 20) { say("Вы только что пили: вода больше не лезет."); return; }
      s.sipAt = t;
      spend(1); snd("drink_gulp", null); var msg = []; gm().bodyApply({ detox: 8, food: 2, wake: 5 }, msg); say("Вода чистая, с привкусом железа. " + msg.join(" ")); } },
    { label: "Осмотреть", fn: function () { say(LAB.OBJ.sink.desc); } }
  ]);
}
function deconMenu(o) {
  UIx("menu", "Дезактивационный душ", [
    { label: "Пройти дезактивацию: пять минут под форсунками", fn: function () {
      var b = G().body; if (!b) return;
      /* (3.5) душ смывает то, что осело на коже и одежде, — не чаще раза в полчаса:
         прежде семь заходов подряд обнуляли любое облучение */
      var sd = st(o), td = nowMin();
      if (sd.deconAt != null && td - sd.deconAt < 30) { say("Форсунки ещё перезаряжают раствор: снова через " + (30 - (td - sd.deconAt)) + " " + pl(30 - (td - sd.deconAt), "минуту", "минуты", "минут") + ". Что осело снаружи, уже смыто; внутри облучение выводят антирадин и «Чистота»."); return; }
      sd.deconAt = td;
      UIx("closeAll");
      A("play", "ev_steam", { gain: 0.6 }); setTimeout(function () { A("play", "ev_bubbles", { gain: 0.5 }); }, 700);
      var was = b.rad || 0;
      spend(5);
      b.rad = Math.max(0, (b.rad || 0) - 15); b.tox = Math.max(0, b.tox - 5); gm().bodyWarn();
      say("Форсунки шипят, вода с раствором смывает пыль с кожи и одежды, решётка слива булькает." + (was > 0.5 ? " Облучение было " + Math.round(was) + ", стало " + Math.round(b.rad) + "." : " Облучения на вас и не было.") + (LAB.chem ? LAB.chem.decon() : "") + " Душ смывает только то, что осело снаружи: то, что уже внутри, выводят антирадин и раствор «Чистота», а мутаген — антимутаген.");
      if (was > 0.5) ev("decon", 1); /* (3.5) в счёт вехи — только когда было что смывать */
    } },
    { label: "Осмотреть", fn: function () { say(LAB.OBJ.decon.desc); } }
  ]);
}

/* ── электрощит этажа: камеры и аварийные блокировки ── */
function fuseMenu(o) {
  var cb = LAB.combat, s = st(o), items = [], fs = CUR().fs;
  var all = cb && cb.cams ? cb.cams() : [], live = all.filter(function (f) { return cb.camState(f) !== "off"; });
  /* (2.2) камер нет вовсе — так и сказать (прежде щит говорил «уже обесточены») */
  if (!all.length) items.push({ label: "Камер на этаже нет" + (cb && cb.camsBroken && cb.camsBroken() ? ": все разбиты" : "") + " — обесточивать нечего", info: true, keep: true, fn: function () { say("Автоматы камер на щите стоят без нагрузки: на этаже нет ни одной целой камеры ОКО."); } });
  else items.push({ label: live.length ? "Обесточить камеры этажа: рубильники и схема реле (головоломка), камер под током — " + live.length : "Камеры этажа уже обесточены: ремонтник ОКО поднимет рубильники по одной камере", disabled: !live.length, why: "Все камеры этажа и так без питания.", fn: function () {
    UIx("closeAll");
    LAB.mini.relays(5 + Math.min(2, Math.floor(G().L / 25)), function (ok) {
      if (!ok) { A("play", "alarm_short"); say("Автомат выбило с треском: схема не сошлась. Шум слышно по коридору."); if (cb) cb.noise(8); return; }
      cb.cams().forEach(function (f) { if (cb.camState(f) !== "off") cb.camSet(f, "off"); });
      A("play", "power_off"); A("play", "term_ok");
      say("Рубильники камер опущены: камеры этажа ослепли. ОКО заметит обрыв и пришлёт ремонтника — он поднимет рубильники по одной камере.");
      if (LAB.oko) LAB.oko.event("cam_cut", { all: true, x: o.x, y: o.y });
      /* (3.5) опыт и веха — за щит один раз: ремонтник поднимает рубильники, и щит снова
         можно опустить, но это уже не новое дело */
      if (!s.fuseXp) { s.fuseXp = 1; if (gm().gainXP) gm().gainXP(10); ev("fuse", 1); }
    }, { title: "Электрощит этажа", seed: h32(CUR().key + o.id) % 99999 });
  } });
  var locked = fs.okoLock ? Object.keys(fs.okoLock).filter(function (k) { return fs.okoLock[k] > (fs.okoT || 0); }) : [];
  if (locked.length) items.push({ label: "Снять аварийные блокировки ОКО с дверей этажа: " + locked.length + " (взлом)", fn: function () {
    UIx("closeAll");
    LAB.mini.hack(gm().hackLength(2 + Math.floor(Math.min(G().L, 20) / 4)), function (ok) {
      if (!ok) { A("play", "term_err"); say("Защёлки не поддались."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
      fs.okoLock = {}; A("play", "door_unlock"); say("Аварийные защёлки дверей отпущены. Двери этажа снова открываются.");
      if (LAB.oko) LAB.oko.event("lockdown");
    }, { title: "Защёлки дверей" });
  } });
  items.push({ label: "Осмотреть щит", fn: function () { say(LAB.OBJ.fusebox.desc + " На щите " + all.length + " " + pl(all.length, "автомат камеры", "автомата камер", "автоматов камер") + (all.length ? ", под током — " + live.length : "") + " и рубильники дверей."); } });
  UIx("menu", "Электрощит этажа", items);
}

/* ════════ КОМПЬЮТЕРЫ ════════ */
function compDef(o) { return LAB.COMPS[o.kind] || LAB.COMPS.archive; }
function compName(o) { return compDef(o).n; }
LAB.OBJ_NAME = LAB.OBJ_NAME || {};
LAB.OBJ_NAME.comp = compName;
function compMenu(o) {
  var s = st(o), d = compDef(o);
  snd("pc_click", "term_ok");
  if ((o.locked || d.rank >= 3) && !s.open) { compLock(o); return; }
  var items = COMP_ITEMS[o.kind] ? COMP_ITEMS[o.kind](o, s) : [];
  if (o.loot && o.loot.length && !s.lootTaken) items.push({ label: "Вынуть носители и бумаги из ящика стола", fn: function () { s.lootTaken = 1; gm().openContainer(o); } });
  items.push({ label: "Выйти из системы", fn: function () { snd("pc_click", null); } });
  UIx("menu", compName(o) + ". " + rankWord(d.rank), items);
  if (!s.seen) { s.seen = 1; G().stats.comps = (G().stats.comps || 0) + 1; ev("comp", 1); }
}
function rankWord(r) { return r >= 3 ? "Гриф «Особой важности»" : r === 2 ? "Служебный доступ" : "Общий доступ"; }
/* Вход: рядовой — пароль на стикере или взлом; главный — три замка подряд. */
function compLock(o) {
  var d = compDef(o), s = st(o), items = [];
  if (d.rank >= 3) {
    items.push({ label: "Пройти защиту: ключ, частоты и взлом (три задачи подряд)", fn: function () {
      UIx("closeAll");
      var dif = LAB.oko ? LAB.oko.difficulty() : 0;
      LAB.mini.chain([
        function (next) { LAB.mini.bulls(Math.min(5, 4 + (G().L >= 30 ? 1 : 0)), next, { title: "Ключ режимного отдела" }); },
        function (next) { LAB.mini.sortTones(5 + Math.min(2, dif), next, { title: "Частоты защиты" }); },
        function (next) { LAB.mini.hack(gm().hackLength(4 + Math.floor(Math.min(G().L, 30) / 5) + dif), next, { title: "Вход в систему" }); }
      ], function (ok) {
        if (!ok) { A("play", "term_err"); say("Защита сбросила сеанс. ОКО отметило попытку."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
        s.open = 1; A("play", "term_ok"); if (gm().gainXP) gm().gainXP(25);
        say("Доступ получен. Гриф «Особой важности».");
        if (LAB.oko) LAB.oko.event("terminal_hack", { x: o.x, y: o.y, o: o });
        ev("mainframe", 1);
        compMenu(o);
      });
    } });
  } else {
    var r = LAB.Rng(G().seed, "pw:" + CUR().key + ":" + o.id);
    if (r.chance(0.4)) items.push({ label: "Поискать пароль на стикере под клавиатурой", fn: function () { s.open = 1; snd("paper", null); say("Под клавиатурой — стикер: «" + r.pick(["весна2024", "Мурка", "пароль", "1 2 3 4", "не забудь"]) + "». Пароль подошёл."); compMenu(o); } });
    items.push({ label: "Взломать вход (повторите сигналы)", fn: function () {
      UIx("closeAll");
      LAB.mini.hack(gm().hackLength(2 + Math.floor(Math.min(G().L, 20) / 5)), function (ok) {
        if (!ok) { A("play", "term_err"); say("Вход не открылся."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
        s.open = 1; A("play", "term_ok"); compMenu(o);
        if (LAB.oko) LAB.oko.event("terminal_hack", { x: o.x, y: o.y, o: o });
      }, { title: compName(o) });
    } });
  }
  /* (3.0) первым пунктом — коротко: пароля нет, что остаётся */
  var hint = d.rank >= 3 ? "Пароля у вас нет. Защиту проходят тремя задачами подряд." : items.length > 1 ? "Пароля у вас нет. Поищите стикер или взломайте вход." : "Пароля у вас нет. Взломайте вход.";
  items.unshift({ label: hint, info: true, keep: true, fn: function () { say(hint); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", compName(o) + ": вход по паролю", items);
}
var COMP_ITEMS = {
  archive: function (o, s) {
    return [
      { label: "Личные дела сотрудников", fn: function () { var r = LAB.Rng(G().seed, "ar1:" + CUR().key + o.id + ":" + (s.n1 = (s.n1 || 0) + 1)); spend(3); var a = personnelFile(r), b = personnelFile(r); UIx("note", "Личные дела", a.x + " " + b.x, function () { compMenu(o); }); ev("read", 1); } },
      { label: "Протоколы происшествий", fn: function () { var r = LAB.Rng(G().seed, "ar2:" + CUR().key + o.id + ":" + (s.n2 = (s.n2 || 0) + 1)); spend(3); UIx("note", "Протокол происшествия", incidentDoc(r).x, function () { compMenu(o); }); ev("read", 1); } },
      { label: "Отчёты отдела", fn: function () { var r = LAB.Rng(G().seed, "ar3:" + CUR().key + o.id + ":" + (s.n3 = (s.n3 || 0) + 1)); spend(3); var dd = loreDoc(r) || reportDoc(r); UIx("note", dd.t, dd.x, function () { compMenu(o); }); ev("read", 1); } }
    ];
  },
  medrec: function (o, s) {
    return [
      { label: "Пройти обследование: сканер медблока", fn: function () { spend(2); A("play", "scan_soft"); var b = G().body || {}; say("Сканер гудит вдоль тела. " + "Здоровье " + G().hp + " из " + G().hpMax + ". Облучение " + Math.round(b.rad || 0) + ", токсины " + Math.round(b.tox || 0) + ", нейронагрузка " + Math.round(b.neuro || 0) + ". " + advice(b)); ev("checkup", 1); } },
      { label: "Карты пациентов", fn: function () { var r = LAB.Rng(G().seed, "md:" + CUR().key + o.id + ":" + (s.n1 = (s.n1 || 0) + 1)); spend(3); UIx("note", "Медицинские карты", patientCard(r) + " " + patientCard(r), function () { compMenu(o); }); ev("read", 1); } },
      { label: "Журнал облучения персонала", fn: function () { spend(2); var z = zonesList(); UIx("note", "Журнал облучения", z.length ? "Последние записи: " + z.map(function (q) { return "«" + q.name + "» — " + (q.rad ? "фон " + q.rad + " из пяти" : "газ") + ", доступ по наряду"; }).join("; ") + ". Без дозиметра в эти помещения не входить." : "Записей об облучении на этом этаже нет. Хороший этаж.", function () { compMenu(o); }); } }
    ];
  },
  cams: function (o, s) {
    return [
      { label: "Посмотреть камеры коридоров", fn: function () { spend(1); camView(); } },
      { label: "Запись тревог поста", fn: function () { var lg = LAB.oko && LAB.oko.logLines ? LAB.oko.logLines(5) : []; say(lg.length ? "Последние записи: " + lg.join(" ") : "Тревог за смену не записано."); } }
    ];
  },
  dosimetry: function (o, s) {
    return [
      { label: "Карта фона этажа", fn: function () { spend(1); var z = zonesList(); CUR().fs.zonesKnown = 1; A("play", "scan_soft"); say(z.length ? "Опасные зоны этажа: " + z.map(function (q) { return "«" + q.name + "» " + gm().relDir(q.cx, q.cy) + ": " + (q.rad ? "фон " + q.rad + " из пяти, " + RAD_N[q.rad] : "") + (q.rad && q.gas ? ", " : "") + (q.gas ? "газ" : "") + ((q.rad || q.gas) && q.fog ? ", " : "") + (q.fog ? "мутагенный туман" : ""); }).join("; ") + "." : "Фон по всему этажу в норме."); ev("radmap", 1); } },
      { label: "Ваш дозиметрический контроль", fn: function () { var b = G().body || {}; say("Накопленное облучение — " + Math.round(b.rad || 0) + " из ста. " + advice(b)); } },
      { label: "Справка о защите", fn: function () { say("Свинцовый фартук гасит треть излучения, комбинезон «Свинец» — шестьдесят процентов, изолирующий костюм «Барьер» — половину и защищает от газа, скафандр реакторщика — восемьдесят пять. Йодид калия, принятый заранее, вдвое ослабляет облучение на три минуты. Выводят облучение антирадин, раствор «Чистота», наноаптечка, дезактивационный душ и сон в капсуле. В горячие камеры санпропускник пускает с защитой не меньше половины."); } }
    ];
  },
  stock: function (o, s) {
    return [
      { label: "Опись имущества этажа", fn: function () { spend(2); say(stockList()); ev("stock", 1); } },
      { label: "Коды складов и режимных помещений", fn: function () {
        spend(1);
        var fl = CUR().fl, out = [];
        fl.doors.forEach(function (d) { if (d.annex && d.lock && d.lock.type === "code") { var rm = fl.rooms[d.room]; out.push("«" + rm.name + "» — " + d.lock.code.split("").join(" ")); G().codes[d.lock.code] = rm.name; } });
        if (!s.codes) { s.codes = 1; if (out.length) ev("codes", out.length); }
        say(out.length ? "Коды по накладным: " + out.join("; ") + ". «Эхо» запомнило их: «Пропуска и ключи», «Известные коды»." : "Кодовых складов на этаже нет: режимные помещения здесь под ключом или пропуском.");
      } }
    ];
  },
  dispatch: function (o, s) {
    var fl = CUR().fl, fs = CUR().fs;
    var shut = fl.doors.filter(function (d) { return d.annex && d.lock && d.lock.type !== "secret" && d.lock.type !== "hazard" && fs.doors[d.id] !== 1 && fs.doors[d.id] !== 2; });
    return [
      { label: "Двери этажа: что заперто", fn: function () { spend(1); var all = fl.doors.filter(function (d) { return d.lock && d.lock.type !== "secret" && fs.doors[d.id] !== 1 && fs.doors[d.id] !== 2; }); say("Заперто дверей: " + all.length + ". " + (shut.length ? "Режимные помещения у коридоров: " + shut.map(function (d) { return "«" + fl.rooms[d.room].name + "» " + gm().relDir(d.x, d.y); }).join("; ") + "." : "Режимные помещения открыты.")); } },
      { label: shut.length ? "Отпереть режимное помещение с пульта (взлом)" : "Отпирать нечего", disabled: !shut.length, fn: function () {
        UIx("closeAll");
        LAB.mini.hack(gm().hackLength(3 + Math.floor(Math.min(G().L, 25) / 4)), function (ok) {
          if (!ok) { A("play", "term_err"); say("Пульт отверг команду."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
          var d = shut.sort(function (a, b) { return (Math.abs(a.x - G().x) + Math.abs(a.y - G().y)) - (Math.abs(b.x - G().x) + Math.abs(b.y - G().y)); })[0];
          fs.doors[d.id] = 1; A("play", "door_unlock");
          say("Замок помещения «" + fl.rooms[d.room].name + "» " + gm().relDir(d.x, d.y) + " отперт с пульта.");
          if (LAB.oko) LAB.oko.event("lockdown");
          ev("dispatch", 1);
        }, { title: "Пульт дверей" });
      } },
      { label: "Журнал проходов", fn: function () { var r = LAB.Rng(G().seed, "dp:" + CUR().key + o.id); spend(1); say("Последние проходы: " + [1, 2, 3].map(function () { return personName(r) + " — " + r.pick(["в кладовую", "в архив", "в оружейную", "на склад", "к диспетчеру", "в медпункт"]) + ", " + r.int(6, 23) + " часов " + r.int(10, 59) + " минут"; }).join("; ") + ". Дальше записи обрываются: начался карантин."); } }
    ];
  },
  server: function (o, s) {
    return [
      { label: s.data ? "Данные отдела уже скачаны" : "Скачать данные отдела на носитель (взлом)", disabled: !!s.data, fn: function () {
        UIx("closeAll");
        LAB.mini.hack(gm().hackLength(3 + Math.floor(Math.min(G().L, 25) / 5)), function (ok) {
          if (!ok) { A("play", "term_err"); say("Сервер оборвал передачу."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
          s.data = 1; A("play", "term_ok");
          say("Данные отдела на носителе. " + gm().giveItem({ kind: "item", item: "datachip", n: 1 }, true) + " Наверху за такие данные платят: пункт снабжения примет носитель в возвратную капсулу.");
          if (LAB.oko) LAB.oko.event("terminal_hack", { x: o.x, y: o.y, o: o });
          ev("data", 1);
        }, { title: "Сервер отдела" });
      } },
      { label: "Пустить в сеть ОКО ложный видеопоток: камеры этажа на время видят пустые коридоры (частоты)", fn: function () {
        UIx("closeAll");
        var cb = LAB.combat;
        LAB.mini.sortTones(5 + Math.min(2, Math.floor(G().L / 30)), function (ok) {
          if (!ok) { A("play", "term_err"); say("Сервер заметил подмену."); if (LAB.oko) LAB.oko.event("hack_fail", { x: o.x, y: o.y }); return; }
          var t = 120 + Math.round(Math.random() * 40);
          if (cb && cb.cams) cb.cams().forEach(function (f) { if (cb.camState(f) !== "off") cb.camSet(f, "loop", t); });
          A("play", "term_ok");
          say("Видеосервер отдела гонит по сети ОКО запись пустых коридоров: около минуты камеры этажа вас не видят.");
          if (LAB.oko) LAB.oko.event("cam_loop", { all: true, x: o.x, y: o.y });
        }, { title: "Видеопоток" });
      } },
      { label: "Прочитать журнал исследований", fn: function () { var r = LAB.Rng(G().seed, "sv:" + CUR().key + o.id + ":" + (s.n1 = (s.n1 || 0) + 1)); spend(2); var dd = loreDoc(r) || reportDoc(r); UIx("note", dd.t, dd.x, function () { compMenu(o); }); ev("read", 1); } }
    ];
  },
  main: function (o, s) {
    var fl = CUR().fl, fs = CUR().fs;
    var items = [];
    items.push({ label: s.bp ? "Схема уже скачана" : "Скачать схему защитного костюма для мастерской", disabled: !!s.bp, fn: function () {
      var rc = protBlueprint();
      if (!rc) { say("Все схемы защиты из этой системы у вас уже есть. Взамен — кредиты по ведомости особого отдела. " + gm().giveItem({ kind: "credits", n: LAB.credits(60, G().L, G().F) }, true)); s.bp = 1; return; }
      G().bp = G().bp || {}; G().bp[rc.id] = 1; s.bp = 1; A("play", "term_ok");
      say("Схема «" + rc.n + "» записана в «Эхо». Её собирают у подходящего верстака.");
      ev("blueprint", 1);
    } });
    items.push({ label: s.allOpen ? "Допуск этажа выдан" : "Выдать себе допуск ко всем режимным помещениям этажа", disabled: !!s.allOpen, fn: function () {
      var n = 0;
      fl.doors.forEach(function (d) { if (d.annex && d.lock && ["code", "key", "card"].indexOf(d.lock.type) >= 0 && fs.doors[d.id] !== 2) { fs.doors[d.id] = 1; n++; } });
      s.allOpen = 1; A("play", "door_unlock");
      say(n ? "Допуск выдан: отперто режимных помещений — " + n + "." : "Режимные помещения этажа уже открыты.");
      if (LAB.oko) LAB.oko.event("lockdown");
    } });
    if (LAB.oko && !s.calm) items.push({ label: "Протокол отбоя: сбросить тревогу этажа (один раз)", fn: function () {
      s.calm = 1;
      LAB.oko.setLevel(0, "протокол отбоя особого отдела");
      if (LAB.combat && LAB.combat.calmAll) LAB.combat.calmAll();
      A("play", "term_ok");
      say("Протокол отбоя принят: тревога этажа сброшена, машины возвращаются к обходам. ОКО решит, что это был сбой, — один раз.");
      LAB.oko.event("alarm_reset", { x: o.x, y: o.y });
      ev("calm", 1);
    } });
    items.push({ label: "Документ с грифом «Особой важности»", fn: function () { var r = LAB.Rng(G().seed, "mn:" + CUR().key + o.id + ":" + (s.n1 = (s.n1 || 0) + 1)); spend(3); var dd = loreDoc(r, true) || reportDoc(r); UIx("note", dd.t, dd.x, function () { compMenu(o); }); ev("read", 1); } });
    return items;
  }
};
/* Схема защиты, которой у вас нет: по глубине. */
function protBlueprint() {
  var ids = ["a_radsuit", "a_hazmat", "a_reactorsuit"], L = G().L, b = G().bp || {};
  for (var i = 0; i < ids.length; i++) {
    var rc = LAB.RECIPES.filter(function (q) { return q.id === ids[i]; })[0];
    if (rc && !b[rc.id] && (rc.minL || 1) <= Math.max(L, 2) + 2) return rc;
  }
  return null;
}
function zonesList() {
  var fl = CUR().fl;
  return fl.rooms.filter(function (r) { return r && (r.rad || r.gas || r.fog) && !r.hidden; }); /* (3.0) и мутагенный туман */
}
function advice(b) {
  var t = [];
  if ((b.rad || 0) >= 45) t.push("Лучевая болезнь: нужен антирадин или раствор «Чистота».");
  else if ((b.rad || 0) >= 20) t.push("Лёгкое облучение: дезактивационный душ и сон в капсуле помогут.");
  if ((b.tox || 0) >= 50) t.push("Интоксикация: антидот или энтеросорбент.");
  if (!t.length) t.push("Серьёзных отклонений нет.");
  return t.join(" ");
}
function camView() {
  var cb = LAB.combat;
  var list = cb ? cb.foes().filter(function (f) { return !f.dead && !f.calm && !f.ally && !(f.beh && f.beh.indexOf("camera") >= 0) && LAB.corrOf(CUR().fl, f.x, f.y); }) : [];
  A("play", "scan_soft");
  if (!list.length) { say("На мониторах — пустые коридоры."); return; }
  list.sort(function (a, b) { return (Math.abs(a.x - G().x) + Math.abs(a.y - G().y)) - (Math.abs(b.x - G().x) + Math.abs(b.y - G().y)); });
  say("На мониторах коридоров: " + list.slice(0, 6).map(function (f) { return f.name.split(",")[0] + " " + gm().relDir(f.x, f.y); }).join("; ") + (list.length > 6 ? " и ещё " + (list.length - 6) : "") + ".");
  ev("cams", 1);
}
function stockList() {
  var fl = CUR().fl, rooms = {};
  fl.objs.forEach(function (o) {
    if (!o.loot || !o.loot.length || st(o).open) return;
    var v = o.loot.filter(function (it) { return it.kind === "weapon" || it.kind === "armor" || (it.kind === "item" && LAB.ITEMS[it.item] && (LAB.ITEMS[it.item].cat === "valuable" || LAB.ITEMS[it.item].cat === "tool")); }).length;
    if (!v) return;
    var rm = fl.rooms[o.room]; if (!rm || rm.hidden) return;
    rooms[rm.id] = rooms[rm.id] || { rm: rm, n: 0 }; rooms[rm.id].n += v;
  });
  var list = Object.keys(rooms).map(function (k) { return rooms[k]; });
  if (!list.length) return "По описи ничего ценного на этаже не числится.";
  list.sort(function (a, b) { return b.n - a.n; });
  return "По описи ценное хранится: " + list.slice(0, 6).map(function (q) { return "«" + q.rm.name + "» " + gm().relDir(q.rm.cx, q.rm.cy) + " — " + q.n + " " + pl(q.n, "единица", "единицы", "единиц"); }).join("; ") + ".";
}

/* ── документы: личные дела, отчёты, накладные, протоколы ── */
function personName(r) { var f = r.chance(0.5); return r.pick(f ? LAB.NAMES.sf : LAB.NAMES.sm) + " " + r.pick(f ? LAB.NAMES.f : LAB.NAMES.m).charAt(0) + "."; }
function postOf(r) {
  var L = G().L, P = LAB.LORE && LAB.LORE.posts ? LAB.LORE.posts[Math.min(10, L)] : null;
  var bk = L > 10 && LAB.blockData ? LAB.blockData(L) : null;
  var bp = bk && bk.profs ? Object.keys(bk.profs) : [];
  if (bp.length && r.chance(0.5)) return low(r.pick(bp));
  return P && P.length ? r.pick(P) : r.pick(["инженер", "лаборант", "техник", "оператор", "кладовщик"]);
}
var TRAIT = {
  m: ["исполнителен и аккуратен", "склонен спорить с руководством, но всегда прав в расчётах", "любит тишину, на совещаниях молчит, в работе незаменим", "трижды награждён за рационализаторские предложения", "просил перевода на поверхность, отказано", "играет на гитаре в комнате отдыха, на замечания не реагирует"],
  f: ["исполнительна и аккуратна", "склонна спорить с руководством, но всегда права в расчётах", "любит тишину, на совещаниях молчит, в работе незаменима", "трижды награждена за рационализаторские предложения", "просила перевода на поверхность, отказано", "поёт в хоре объекта, на репетиции не опаздывает"]
};
var HR = ["Допуск продлён.", "Рекомендован к повышению.", "Выговор за опоздание на смену снят.", "Отпуск на поверхности — по графику, весной.", "Медкомиссия пройдена без замечаний.", "Характеристика для перевода на нижний уровень."];
function personnelFile(r) {
  var f = r.chance(0.5), nm = r.pick(f ? LAB.NAMES.f : LAB.NAMES.m), sn = r.pick(f ? LAB.NAMES.sf : LAB.NAMES.sm), post = postOf(r);
  var yrs = r.int(1, 14);
  var hr = r.pick(HR).replace("Рекомендован", f ? "Рекомендована" : "Рекомендован");
  return { t: "Личное дело: " + sn + " " + nm, x: "Личное дело. " + sn + " " + nm + ", " + post + ". Стаж на объекте — " + yrs + " " + pl(yrs, "год", "года", "лет") + ". Характеристика: «" + r.pick(TRAIT[f ? "f" : "m"]) + "». Отметка отдела кадров: «" + hr + "»" };
}
function reportDoc(r) {
  var who = personName(r), n = r.int(10, 990);
  var body = r.pick([
    "Плановая проверка оборудования проведена. Замечаний три, устранены два. Третье — гул в стенах после полуночи — не устраняется, поскольку источник не найден.",
    "Расход реагентов за квартал превышен на двенадцать процентов. Объяснение лаборатории: «опыты повторяли, потому что не верили результату». Принято к сведению.",
    "Предлагаю заменить лампы в коридорах на более тёплые: сотрудники жалуются, что под землёй и так холодно на душе.",
    "Испытания проведены успешно. Отдельно отмечаю: образец вёл себя тише, когда в лаборатории играла музыка. Прошу выделить проигрыватель.",
    "Инвентаризация закончена. Недостача: один чайник, две кружки, книга «Справочник монтажника». Кружки нашлись в серверной.",
    "Вентиляция этажа работает с перебоями. Пока ремонтники ищут причину, рекомендую не оставлять двери лабораторий открытыми."
  ]);
  return { t: "Отчёт номер " + n, x: "Отчёт номер " + n + ". Составил: " + who + ". " + body };
}
function invoiceDoc(r) {
  var n = r.int(1000, 9999);
  var what = r.pick(["батареи энергетические, сорок штук", "бумага писчая, двенадцать пачек", "перчатки резиновые, три коробки", "лампы накаливания тёплого света, сто штук", "семена салата, один мешок", "кружки фаянсовые, двадцать штук", "фильтры противогазовые, шестьдесят штук", "свинцовая фольга, восемь рулонов"]);
  var mark = r.pick(["Получено полностью.", "Получено частично: недостача по вине перевозчика.", "Возвращено: не соответствует заявке.", "Принято на хранение.", "Списано по акту."]);
  return { t: "Накладная номер " + n, x: "Накладная номер " + n + ". Груз: " + what + ". " + mark + " Подпись: " + personName(r) };
}
function incidentDoc(r) {
  var who = personName(r);
  var body = r.pick([
    "В два часа ночи сработал датчик двери кладовой. При проверке внутри никого, на полу — свежие следы мокрых ботинок. Чьи — не установлено.",
    "Сотрудник оступился на лестнице, перелом исключён. Причина — разлитое масло. Виновный найден: им оказался робот-уборщик, который масло разлил, а потом сам его и вытер.",
    "Во время смены погас свет на десять минут. Сотрудники продолжали работу на ощупь и, по их словам, «работали даже лучше». Начальник смены просит не делать из этого выводов.",
    "Курение в неположенном месте. Нарушитель объяснил, что курил «для храбрости» перед дежурством у шахты. Строгий выговор.",
    "Из вивария пропал образец. Через сутки найден в вентиляции соседнего этажа живым и, по словам лаборанта, «довольным»."
  ]);
  return { t: "Протокол происшествия", x: "Протокол. Составил: " + who + ". " + body };
}
/* Документ из архива объекта этой глубины, если есть (тексты блоков и lore.js). */
function loreDoc(r, secret) {
  var L = LAB.LORE || {}, keys = L.docs ? Object.keys(L.docs) : [];
  if (!keys.length) return null;
  var k = r.pick(keys), list = L.docs[k];
  if (!list || !list.length) return null;
  var d = r.pick(list);
  if (!d) return null;
  if (Array.isArray(d)) return { t: d[1] || (secret ? "Документ особой важности" : "Отчёт отдела"), x: (d[0] ? d[0] + ". " : "") + (d[2] || "") };
  if (typeof d === "object" && d.x) return { t: d.t || "Документ", x: (d.a ? d.a + ". " : "") + d.x };
  if (typeof d === "string") return { t: secret ? "Документ особой важности" : "Отчёт отдела", x: d };
  return null;
}
function patientCard(r) {
  var f = r.chance(0.5), nm = r.pick(f ? LAB.NAMES.f : LAB.NAMES.m), sn = r.pick(f ? LAB.NAMES.sf : LAB.NAMES.sm);
  var c = r.pick(["бессонница; жалуется, что слышит «гул снизу»; назначены прогулки в зимнем саду", "ушиб плеча на смене; выписан через два дня", "аллергия на пыльцу оранжереи; переведён в архив", "переутомление; рекомендован отпуск на поверхности", "лёгкое облучение после работы в горячей камере; антирадин, наблюдение", "простуда; выдан чай с лимоном и больничный на три дня"]);
  return "Карта пациента: " + sn + " " + nm + ". " + cap(c) + ".";
}

/* ════════ СТЕНД ДОПУСКА: награда за трудное испытание ════════ */
function trialMenu(o) {
  var s = st(o), items = [];
  if (s.done) { UIx("menu", "Стенд допуска", [{ label: "Испытание пройдено, лоток пуст", info: true, keep: true, fn: function () { say("Табло стенда горит зелёным: «Допуск выдан»."); } }, { label: "Отойти", fn: function () {} }]); return; }
  var prize = trialPrize(o);
  items.push({ label: "Пройти испытание: три задачи подряд. Награда — " + prize.n, fn: function () {
    UIx("closeAll");
    var dif = LAB.oko ? LAB.oko.difficulty() : 0, L = G().L;
    say("Стенд оживает: «Аттестация на допуск в горячие зоны. Три задачи. Ошибка любой — начинать сначала».", { interrupt: true });
    setTimeout(function () {
      LAB.mini.chain([
        function (next) { LAB.mini.bulls(Math.min(5, 4 + (L >= 20 ? 1 : 0)), next, { title: "Задача первая: ключ" }); },
        function (next) { LAB.mini.sortTones(5 + Math.min(2, Math.floor(L / 20) + dif), next, { title: "Задача вторая: частоты" }); },
        function (next) { LAB.mini.relays(5 + Math.min(2, Math.floor(L / 25)), next, { title: "Задача третья: схема", seed: (o.seed || 1) % 99999 }); }
      ], function (ok) {
        if (!ok) { A("play", "code_fail"); say("Стенд гаснет: «Аттестация не пройдена. Попробуйте ещё раз»."); return; }
        s.done = 1; A("play", "term_ok"); LAB.UI.fanfare && LAB.UI.fanfare();
        if (gm().gainXP) gm().gainXP(40);
        say("Все три задачи решены! Лоток открылся. " + givePrize(prize));
        ev("trial", 1);
      });
    }, 1800);
  } });
  items.push({ label: "Осмотреть стенд", fn: function () { say(LAB.OBJ.trial.desc + " Задачи: подобрать ключ из цифр, расставить частоты по высоте, погасить схему реле. Награда за все три — " + prize.n + "."); } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", "Стенд допуска", items);
}
function trialPrize(o) {
  var L = G().L, kind = o.prize || "suit";
  if (kind === "bp") { var rc = protBlueprint(); if (rc) return { kind: "bp", rc: rc, n: "схема «" + rc.n + "»" }; kind = "suit"; }
  if (kind === "kit") return { kind: "kit", n: "набор радиационной защиты: дозиметр, респиратор, антирадин и йодид калия" };
  var base = L >= 6 && (h32(CUR().key + o.id) % 3 === 0) ? "reactorsuit" : L >= 3 && (h32(o.id) % 2 === 0) ? "hazmat" : "radsuit";
  return { kind: "suit", base: base, n: LAB.ARMORS[base].n };
}
function givePrize(p) {
  if (p.kind === "bp") { G().bp = G().bp || {}; G().bp[p.rc.id] = 1; ev("blueprint", 1); return "Схема «" + p.rc.n + "» записана в «Эхо»: собрать можно у верстака."; }
  if (p.kind === "kit") return ["dosimeter", "respirator", "antirad", "antirad", "iodine", "iodine"].map(function (k) { return gm().giveItem({ kind: "item", item: k, n: 1 }, true); }).join(" ");
  var a = LAB.makeArmor(p.base, LAB.foeLevel(G().L, G().F), 3);
  return gm().giveItem({ kind: "armor", a: a }, true);
}

/* ════════ ВЕЩИ ИЗ РЮКЗАКА: инструменты, ценности, изолента ════════ */
function useItem(id, d) {
  if (id === "dosimeter") {
    var rm = roomHere(), b = G().body || {};
    A("play", "scan_soft");
    var lv = rm && rm.rad ? rm.rad : 0;
    if (lv) geiger(lv);
    say("Дозиметр «Сосна». " + (lv ? "Фон здесь " + lv + " из пяти, " + RAD_N[lv] + "." : nearRad() ? "Рядом, за дверью, фонит." : "Фон в норме.") + " Ваше облучение — " + Math.round(b.rad || 0) + " из ста." + (protRad() ? " Костюм гасит " + pct(protRad()) + " процентов излучения." : ""));
    return false;
  }
  if (id === "splice") { say(d.n + ". " + d.desc + " Подойдите к магнитофону, где порвана плёнка: бобина с порванной плёнкой, «Склеить монтажной лентой»."); return false; }
  if (id === "tape") {
    var cs = gm().camsNear ? gm().camsNear() : [];
    if (!cs.length) { say("Изоленту клеят на объектив камеры ОКО — подойдите к камере вплотную или наискосок."); return false; }
    var f = cs[0], cb = LAB.combat;
    if (cb.camState(f) === "off") { say("Эта камера и так обесточена."); return false; }
    G().inv.tape--;
    cb.camSet(f, "off");
    A("play", "bandage_tear"); A("play", "pick_part");
    say("Вы заклеили объектив изолентой: камера ослепла. ОКО увидит чёрный кадр и пришлёт ремонтника — он отклеит ленту.");
    if (LAB.oko) LAB.oko.event("cam_cut", { x: f.x, y: f.y });
    ev("tape", 1);
    return true;
  }
  if (d.kind === "valuable") {
    var p = LAB.sellPrice ? LAB.sellPrice.item(id, { who: "supply" }) : Math.round(d.price * 0.7);
    say(d.n + ". " + d.desc + " Ценность: пункт снабжения возьмёт её примерно за " + p + " " + pl(p, "кредит", "кредита", "кредитов") + ".");
    return false;
  }
  say(d.n + ". " + d.desc + " Инструмент не тратится: действует сам, пока лежит в рюкзаке.");
  return false;
}

/* Коридор: какие двери кабинетов в его стенах — для описания коридора. */
function corridorNote(cor) {
  var fl = CUR().fl, ids = cor.annex || [];
  var ds = ids.map(function (id) { return fl.doors[parseInt(id.slice(1), 10)]; }).filter(function (d) { return d && !(d.lock && d.lock.type === "secret" && !CUR().fs.secrets[d.id]); });
  if (!ds.length) return "";
  ds.sort(function (a, b) { return (Math.abs(a.x - G().x) + Math.abs(a.y - G().y)) - (Math.abs(b.x - G().x) + Math.abs(b.y - G().y)); });
  var near = ds[0], rm = fl.rooms[near.room];
  return "В стенах — " + ds.length + " " + pl(ds.length, "дверь", "двери", "дверей") + " кабинетов; ближняя " + gm().relDir(near.x, near.y) + (rm && rm.sign ? ": «" + rm.sign + "»" : "") + ".";
}

LAB.zones = {
  objMenu: objMenu, minutes: minutes, tick: tick, hazardBlock: hazardBlock, useItem: useItem, corridorNote: corridorNote,
  roomHere: roomHere, protRad: protRad, geiger: geiger, zonesList: zonesList, compName: compName, vented: vented,
  _reset: function () { zoneKey = ""; }
};
})();
