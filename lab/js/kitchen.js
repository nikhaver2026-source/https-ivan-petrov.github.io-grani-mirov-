/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — кухня (3.0, просьба автора).
   Холодильники — только то, что держат в холоде: молоко «за вредность»,
   кефир, плавленый сырок, докторская колбаса, варёные яйца, обед в
   контейнере, лимон, бутерброды, яблоки, вода, соки; в холодильниках
   лабораторий — ещё реактивы, биогель и пробы, в медблоках — лекарства.
   Губных гармошек, колец, кредитов, деталей и химических солей в
   холодильниках больше нет; в холодильной камере, котлах, печи, бочках,
   коптильне и лотках раздачи — только съестное (annex.js, chem.js,
   fixtures.js, zones.js). Подмена — из уже вынутого числа: поток
   случайностей этажа не трогается, этажи прежних записей остаются теми же.
   Чайник — полноценное меню: вскипятить (щелчок, нагрев, кипение, щелчок
   автомата — запись kettle_boil, около десяти секунд), набрать воды
   из-под крана, если в помещении есть раковина, или долить из бутылки;
   налить кипятку и заварить чай, растворимый кофе, травяной сбор, залить
   лапшу и суп-концентрат. В кружку — сахар (кусочек или два), молоко,
   долька лимона; кружка стоит на столе, пока её не выпьют, и остывает.
   У чайника — что оставили сотрудники: пачка чая или банка растворимого
   кофе и сахар; их можно забрать и заварить у любого чайника. Вскипевший
   чайник горячий полчаса (шаг — минута), пьют у него не чаще раза в
   двадцать минут — как прежде. Холодная вода остужает кипяток.
   Состояние — у вещи этажа (objState): kw — воды, кружек; kt — горячий до
   (минута игры); tea, cof, sug — запасы; cup — кружка на столе; drankAt —
   когда пили. Что кипит прямо сейчас — только в памяти (после загрузки
   чайник холодный).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function cheb(o) { var g = G(); return Math.max(Math.abs(g.x - o.x), Math.abs(g.y - o.y)); }
function nowMin() { var g = G(); return (g.day || 0) * 1440 + (g.min || 0); }
function spend(m) { if (m > 0) gm().advanceTime(m); }
function turns(n) { var c = LAB.combat; if (c && c.spendTurns) c.spendTurns(n, "brew"); }
function danger() { return !!(LAB.combat && LAB.combat.danger && LAB.combat.danger()); }
function noise(n) { if (LAB.combat && LAB.combat.noise) LAB.combat.noise(n); }
function ev(name) { if (LAB.ach) LAB.ach.ev(name, 1); }
function at(id, o) { A("at", id, o.x, o.y); }
function dec(id) { var g = G(); g.inv[id]--; if (!(g.inv[id] > 0)) delete g.inv[id]; }

/* ════════ НОВЫЕ ВЕЩИ ════════
   cold — только холодильники и холодильные камеры; kit — только у чайника
   (то, что оставили сотрудники): в прочую добычу ни те ни другие не
   попадают — этажи прежних записей те же; src: find — не на прилавках;
   brew — заваривают кипятком. */
var ITEMS = {
  milk:      { n: "Молоко «за вредность»", icon: "🥛", kind: "food", cat: "food", cold: 1, src: "find", acc: "молоко", desc: "Треугольный пакет молока: его выдавали тем, кто работает с вредными веществами. Сытость плюс 8, выводит токсины. Можно долить в чай или кофе у чайника. Три недели в холодильнике: бывает, что и скисло.", food: 8, heal: 4, detox: 6, stale: 0.3, price: 4, eat: "gulp", depth: 1 },
  kefir:     { n: "Кефир в бутылке", icon: "🍶", kind: "food", cat: "food", cold: 1, src: "find", acc: "кефир", desc: "Стеклянная бутылка с крышечкой из фольги. Сытость плюс 12, выводит токсины. Бывает, что и перекис.", food: 12, heal: 5, detox: 4, stale: 0.1, price: 5, eat: "gulp", depth: 1 },
  dsausage:  { n: "Докторская колбаса", icon: "🥓", kind: "food", cat: "food", cold: 1, src: "find", desc: "Полбатона варёной колбасы в бумаге из буфета. Сытость плюс 28, здоровье плюс 5. Три недели в холодильнике: бывает, что и заветрилась.", food: 28, heal: 5, stale: 0.25, price: 10, eat: "chew", depth: 1 },
  eggs:      { n: "Варёные яйца", icon: "🥚", kind: "food", cat: "food", cold: 1, src: "find", desc: "Три крутых яйца в бумажном кульке, на скорлупе карандашом — дата, и дата давняя: бывает, что и несвежие. Сытость плюс 18, энергия имплантов плюс 6.", food: 18, en: 6, stale: 0.15, price: 6, eat: "chew", depth: 1 },
  lunchbox:  { n: "Обед в контейнере", icon: "🍱", kind: "food", cat: "food", cold: 1, src: "find", desc: "Пластиковый контейнер на защёлках: гречка с котлетой, принесённая из дома. Сытость плюс 34, здоровье плюс 6. Разогретый на плите — сытнее. Три недели в холодильнике: бывает, что и прокис.", food: 34, heal: 6, stale: 0.35, price: 12, eat: "chew", depth: 1 },
  lemon:     { n: "Лимон", icon: "🍋", kind: "food", cat: "food", cold: 1, src: "find", desc: "Лимон, начатый с одного бока. Так — кисло, зато выводит токсины; долька в горячий чай — вкуснее.", food: 2, detox: 6, wake: 3, price: 4, eat: "chew", depth: 1 },
  teabag:    { n: "Чайный пакетик", icon: "🍵", kind: "food", cat: "food", kit: 1, src: "find", brew: "tea", desc: "Пакетик чёрного чая на ниточке. Заваривают кипятком: подойдите к чайнику.", price: 1, depth: 1 },
  instcoffee:{ n: "Растворимый кофе", icon: "☕", kind: "food", cat: "food", kit: 1, src: "find", brew: "cof", desc: "Растворимый кофе на одну кружку, в бумажном пакетике. Заваривают кипятком: подойдите к чайнику.", price: 2, depth: 1 },
  /* (3.7) пустой термос буровиков — после выпитого (b1.js, g_thermos: leaves); чай в него наливают у
     вскипевшего чайника (thermos ниже), а не собирают на верстаке */
  g_thermos_e:{ n: "Пустой термос", icon: "🫙", kind: "tool", cat: "tool", fxOnly: true, src: "find", desc: "Стальной термос буровиков с пробкой на цепочке. Чай в него наливают у вскипевшего чайника: две кружки кипятка и пакетик чая, с сахаром — слаще.", price: 12, depth: 12 },
  sugar:     { n: "Сахар-рафинад", icon: "🧊", kind: "food", cat: "food", kit: 1, src: "find", desc: "Кусочек сахара. В чай или кофе — слаще и сытнее; можно и так разгрызть: энергия имплантов плюс 5.", food: 2, en: 5, price: 1, eat: "crunch", depth: 1 }
};
if (LAB.ITEMS) for (var ik in ITEMS) if (!LAB.ITEMS[ik]) LAB.ITEMS[ik] = ITEMS[ik];

/* ════════ ХОЛОДИЛЬНИКИ ════════
   Что лежит в холодильнике — по помещению: кухни, буфеты и все прочие —
   еда и напитки; лаборатория — реактивы и биогель, а то и чей-то обед;
   биоблок — биогель, реактивы, пробы культуры (глубже четвёртого уровня);
   медблок — лекарства. [вещь, вес, с какого уровня]; «@med» — лекарство
   своей глубины. */
var COLD = {
  kitchen: [["milk", 14], ["kefir", 9], ["cheese", 10], ["dsausage", 9], ["eggs", 8], ["lunchbox", 8], ["sandwich", 8], ["lemon", 5], ["apple", 7], ["water", 8], ["juice_apple", 5], ["coldtea", 5], ["soda_baikal", 3], ["cocoa", 3]],
  lab: [["reagent", 22], ["gel", 14], ["milk", 6], ["water", 6], ["sandwich", 4], ["lunchbox", 4], ["kefir", 3]],
  bio: [["gel", 18], ["reagent", 12], ["culture", 6, 4], ["milk", 4], ["water", 4], ["apple", 4], ["eggs", 3], ["sandwich", 3]],
  med: [["gel", 12], ["@med", 26], ["water", 6], ["milk", 4], ["juice_apple", 3]]
};
/* Котлы, печь, бочки, коптильня, лотки раздачи — готовое съестное. */
var COOKED = [["porridge", 10], ["bread", 8], ["noodles", 6], ["soupcup", 6], ["stew", 6], ["fishcan", 5], ["crackers", 5], ["sandwich", 4], ["algaebread", 4, 3], ["mushroom", 3, 3], ["pemmican", 3, 11]];
/* (3.7, нелогичность) у каждой вещи — своё: в котлах — каша и тушёнка, в печи — хлеб, в бочках
   кладовой и погреба — яблоки, солёные грибы, орехи и сухофрукты, на решётке коптильни — грибы
   и вяленое мясо, в лотках раздачи — каша, хлеб, тушёнка, рыба. Прежде в котлах лежали сардины и
   бутерброд из автомата, с решётки коптильни снимали лапшу и суп-концентрат, а в бочках «с кашей»
   бывала щёлочь. Бочки без еды (масло, вода, смола) — fixtures.js, VAR.barrels. */
var COOKED_BY = {
  cauldron: [["porridge", 10], ["stew", 4]],
  oven: [["bread", 8], ["algaebread", 3, 3]],
  barrels: [["apple", 4], ["mushroom", 4], ["nuts", 3]],
  smoker: [["mushroom", 6], ["pemmican", 4]],
  serving: [["porridge", 8], ["bread", 6], ["stew", 3], ["fishcan", 2]]
};
function tableOf(tag) { return tag === "chem" ? COLD.lab : tag === "bio" ? COLD.bio : tag === "med" || tag === "herbs" ? COLD.med : COLD.kitchen; }
/* Случайность из уже вынутого числа q (и «соли» k): поток этажа не трогаем. */
function mix(q, k) {
  var h = (Math.floor(q * 4294967296) ^ Math.imul(k + 1, 0x9E3779B1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function pickW(list, u, L) {
  var ok = list.filter(function (e) { return (!e[2] || L >= e[2]) && (e[0].charAt(0) === "@" || LAB.ITEMS[e[0]]); });
  var sum = ok.reduce(function (a, e) { return a + e[1]; }, 0), x = u * sum;
  for (var i = 0; i < ok.length; i++) { x -= ok[i][1]; if (x < 0) return ok[i][0]; }
  return ok.length ? ok[ok.length - 1][0] : "water";
}
function medPick(u, L) {
  var pool = [];
  for (var k in LAB.ITEMS) { var d = LAB.ITEMS[k]; if (d.cat === "med" && d.price && !d.surf && !d.nosell && (d.depth || 1) <= L && !LAB.chemVariant(d)) pool.push(k); } /* (3.7, нелогичность) сорта и модификации составов — только химический стол */
  pool.sort();
  return pool.length ? pool[Math.floor(u * pool.length)] : "gel";
}
function coldItem(q, L, tag, salt) {
  var id = pickW(tableOf(tag), mix(q, salt || 1), L);
  if (id === "@med") id = medPick(mix(q, (salt || 1) + 6), L);
  return { kind: "item", item: id, n: mix(q, (salt || 1) + 2) < 0.22 ? 2 : 1 };
}
function cookedItem(q, L, fx) { return { kind: "item", item: pickW(COOKED_BY[fx] || COOKED, mix(q, 5), L), n: 1 }; }
/* В холодильнике обычно не одна вещь: вторая — в половине холодильников. Её
   кладут, когда холодильник открывают, своим потоком от зерна и вещи: число
   вещей при постройке этажа прежнее — по нему бросают жребий в разграбленных
   помещениях, и этаж остался бы другим. Разграбленный — без второй. */
function fridgeExtra(o) {
  var g = G(), fl = CUR().fl, rm = o.room != null && o.room >= 0 ? fl.rooms[o.room] : null;
  if (!rm || rm.state === "ransacked") return null;
  var r = LAB.Rng(g.seed, "fridge30:" + CUR().key + ":" + o.id);
  if (!r.chance(0.5)) return null;
  var def = (LAB.ROOMS && LAB.ROOMS[rm.type]) || (LAB.ANNEX_ROOMS && LAB.ANNEX_ROOMS[rm.type]) || {};
  return coldItem(r.next(), g.L, def.loot || "food", 11);
}
/* Добавить вещь к добыче: такая уже есть — прибавить к ней. */
function addTo(out, it) {
  for (var i = 0; i < out.length; i++) if (out[i].kind === "item" && out[i].item === it.item) { out[i] = Object.assign({}, out[i], { n: (out[i].n || 1) + (it.n || 1) }); return; } /* копия: добыча этажа общая с кэшем */
  out.push(it);
}

/* ════════ ЧАЙНИК ════════ */
var KMAX = 5;           /* полный чайник — пять кружек */
var BOIL_MS = 10000;    /* щелчок автомата в записи kettle_boil — на десятой секунде */
var HOT_MIN = 30;       /* горячий полчаса игры: шаг — минута */
var CUP_MIN = 15;       /* кружка остывает за четверть часа */
var GAP_MIN = 20;       /* пьют не чаще раза в двадцать минут — как прежде у чайника */
var boiling = {};       /* кипит сейчас: «этаж:вещь» → { g, t } */

var TEA = ["пачка чёрного чая со слоном на коробке", "картонная пачка грузинского чая", "жестяная банка с чайными пакетиками", "пачка байхового чая в выцветшей обёртке"];
var COF = ["банка растворимого кофе с выцветшей этикеткой", "стеклянная банка растворимого кофе, крышка завинчена туго", "жестянка растворимого кофе, на крышке маркером — чья-то фамилия"];
var SUG = ["сахарница с отбитой ручкой", "коробка рафинада", "бумажный кулёк с сахаром"];
var MUG = ["кружка с надписью «Лучшему лаборанту»", "кружка с отбитым краем", "кружка с выцветшим знаком «Ковчега»", "эмалированная кружка", "кружка с нарисованным котом", "гранёный стакан в подстаканнике"];

function kkey(o) { return CUR().key + ":" + o.id; }
/* (3.7, нелогичность) Чайник по помещению: в чайных «Колыбели» он стоит на углях («чайник на углях
   всегда горячий», «подогревают, пока последний гость не задремлет»), в ночлеге «Истока» — на трубе
   реактора и не остывает. Прежде у любого чайника щёлкал выключатель, и стоял он холодным. На углях
   кипятят без щелчка — подвигают на жар; за которым смотрят — всегда горячий и полон, как самовар. */
function kroom(o) { var fl = CUR().fl; return o.room != null && o.room >= 0 ? fl.rooms[o.room] : null; }
function coalK(o) { var rm = kroom(o), d = String((rm && rm.desc) || ""); return !!rm && (rm.type === "x_teahouse" || /чайник[^.]{0,40}(на угл|на трубе|на печ|на огне|на жаровн|на костр)|(на углях|на трубе)[^.]{0,30}чайник/i.test(d)); }
function keptK(o) { var rm = kroom(o), d = String((rm && rm.desc) || ""); return /чайник[^.]{0,80}(всегда горяч|не остыва)/i.test(d); }
function kst(o) {
  var s = gm().objState(o);
  if (s.kw == null) {
    /* что оставили сотрудники: свой поток — от зерна, этажа и вещи */
    var r = LAB.Rng(G().seed, "kettle30:" + CUR().key + ":" + o.id);
    s.kw = r.chance(0.15) ? 0 : r.int(2, KMAX);
    var both = r.chance(0.15), tea = both || r.chance(0.6);
    s.tea = tea ? r.int(3, 9) : 0;
    s.cof = !tea || both ? r.int(3, 9) : 0;
    s.sug = r.chance(0.75) ? r.int(4, 12) : 0;
    s.kv = r.int(0, 99999);
  }
  /* за чайником смотрят: горячий и полон всегда */
  if (keptK(o)) { s.kt = nowMin() + HOT_MIN; if (!(s.kw >= KMAX)) s.kw = KMAX; }
  return s;
}
function isBoiling(o) {
  var k = kkey(o), b = boiling[k];
  if (b && (b.g !== G() || Date.now() - b.t > BOIL_MS + 8000)) { delete boiling[k]; b = null; } /* прежней игры или прерванное загрузкой */
  return !!b;
}
function isHot(s) { return s.kt != null && nowMin() < s.kt; }
function cupCold(c) { return !c || nowMin() - c.t >= CUP_MIN; }
function sinkHere(o) { return CUR().fl.objs.some(function (q) { return q.type === "sink" && q.room === o.room && o.room != null && o.room >= 0; }); }
function samNear() {
  var fl = CUR() && CUR().fl;
  if (!fl) return null;
  for (var i = 0; i < fl.objs.length; i++) { var q = fl.objs[i]; if (q.type === "fx" && q.fx === "samovar" && cheb(q) <= 1) return q; }
  return null;
}
function kettleNear() {
  var fl = CUR() && CUR().fl;
  if (!fl) return null;
  for (var i = 0; i < fl.objs.length; i++) { var q = fl.objs[i]; if (q.type === "fx" && q.fx === "kettle" && cheb(q) <= 1) return q; }
  return null;
}
/* Чай, кофе, сахар: сначала то, что стоит у чайника, потом своё. */
var SUP = { tea: ["tea", "teabag"], cof: ["cof", "instcoffee"], sug: ["sug", "sugar"] };
function has(s, k) { return s[SUP[k][0]] > 0 || G().inv[SUP[k][1]] > 0; }
function useSup(s, k, own) {
  var g = G(), here = SUP[k][0], inv = SUP[k][1];
  if (!own && s[here] > 0) { s[here]--; return true; }
  if (g.inv[inv] > 0) { dec(inv); return true; }
  if (s[here] > 0) { s[here]--; return true; }
  return false;
}
function cups(n) { return n + " " + pl(n, "кружку", "кружки", "кружек"); }
function supplyText(s) {
  var p = [];
  if (s.tea) p.push("пачка чая, " + s.tea + " " + pl(s.tea, "пакетик", "пакетика", "пакетиков"));
  if (s.cof) p.push("банка растворимого кофе, на " + cups(s.cof));
  if (s.sug) p.push("сахар, " + s.sug + " " + pl(s.sug, "кусочек", "кусочка", "кусочков"));
  return p.join("; ");
}

/* ── кружка ── */
var BN = { tea: "чай", cof: "кофе", herb: "травяной отвар", water: "кипяток" };
function joinI(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " и " + a[a.length - 1]; }
function cupName(c) {
  var p = [];
  if (c.a.milk) p.push("молоком");
  if (c.a.lemon) p.push("лимоном");
  if (c.a.sug) p.push(c.a.sug > 1 ? "двумя кусочками сахара" : "сахаром");
  return BN[c.b] + (p.length ? " с " + joinI(p) : "");
}
/* Что даёт кружка: основа и добавки; остывшая — слабее. */
var BASE = {
  tea:   { wake: 12, neuro: -10, detox: 5, heal: 6, food: 3 },
  cof:   { wake: 24, neuro: -3, heal: 4 },
  herb:  { wake: 9, neuro: -15, detox: 9, heal: 4, food: 5 },
  water: { wake: 2, detox: 4, heal: 3 }
};
var ADD = {
  sug:   { food: 4, en: 6, wake: 2 },
  milk:  { food: 6, heal: 3, neuro: -2, wake: -3 },
  lemon: { detox: 5, heal: 2, wake: 1 }
};
function effect(c, cold) {
  var e = {}, k;
  for (k in BASE[c.b]) e[k] = BASE[c.b][k];
  Object.keys(c.a).forEach(function (a) {
    var n = c.a[a] || 0, add = ADD[a];
    if (!add || !n) return;
    for (var q in add) e[q] = (e[q] || 0) + add[q] * (a === "sug" && n > 1 ? 1.5 : 1);
  });
  for (k in e) e[k] = Math.round(e[k] * (cold ? 0.6 : 1));
  return e;
}
var POUR = {
  tea: "Кипяток льётся в кружку, пакетик темнеет — запахло крепким чаем.",
  cof: "Ложка кофе, кипяток — и по комнате идёт горький запах.",
  herb: "Вы засыпаете травы в кружку и заливаете кипятком: запахло мятой и мёдом.",
  water: "Вы наливаете кружку кипятка."
};
var DRINK = {
  tea: "Горячий крепкий чай обжигает губы. По телу разливается тепло.",
  cof: "Растворимый кофе горчит, зато сон как рукой сняло.",
  herb: "Отвар пахнет мятой и мёдом: дышится легче, мысли успокаиваются.",
  water: "Пустой кипяток — и тот согревает."
};
function drinkText(c, cold) {
  if (cold) return "Остыл, но пить можно: " + cupName(c) + ".";
  var t = "Вы пьёте " + cupName(c) + ". " + DRINK[c.b];
  if (c.a.sug) t += " Сладко.";
  if (c.a.milk) t += c.b === "cof" ? " С молоком — мягче." : " С молоком — сытнее.";
  if (c.a.lemon) t += " Лимон кислит и освежает.";
  return t;
}

/* ── окно чайника ── */
function stateLine(o) {
  var s = kst(o), out = [];
  if (isBoiling(o)) out.push("Чайник шумит: вот-вот закипит.");
  else if (!s.kw) out.push("Чайник пуст: воды в нём нет.");
  else if (keptK(o)) out.push("Чайник горячий, и воды в нём вдоволь: за ним здесь смотрят.");
  else out.push((isHot(s) ? "Чайник горячий: кипятка — на " : coalK(o) ? "Чайник остыл на прогоревших углях: воды — на " : "Чайник холодный: воды — на ") + cups(s.kw) + ".");
  if (s.cup) out.push("На столе — кружка: " + cupName(s.cup) + (cupCold(s.cup) ? ", остыл." : "."));
  var sup = supplyText(s);
  if (sup) out.push("Рядом: " + sup + ".");
  return out.join(" ");
}
function items(o) {
  var s = kst(o), g = G(), out = [], b = isBoiling(o), hot = isHot(s);
  out.push({ label: stateLine(o), info: true, keep: true, fn: function () { say(stateLine(o)); } });
  if (s.cup) out.push({ label: "Кружка на столе: " + cupName(s.cup), fn: function () { cupMenu(o); } });
  if (b) out.push({ label: "Подождать, пока закипит", fn: function () { UIx("closeAll"); sayq("Вы ждёте у чайника: шум нарастает."); } });
  else if (s.kw > 0 && !hot) out.push({ label: coalK(o) ? "Вскипятить чайник на углях" : "Вскипятить чайник", fn: function () { boil(o); } });
  if (hot && s.kw > 0 && !b && !s.cup) {
    if (has(s, "tea")) out.push({ label: "Заварить чай", fn: function () { brew(o, "tea"); } });
    if (has(s, "cof")) out.push({ label: "Заварить растворимый кофе", fn: function () { brew(o, "cof"); } });
    if (g.inv.herbtea > 0) out.push({ label: "Заварить травяной сбор", fn: function () { brew(o, "herb"); } });
    if (g.inv.g_thermos_e > 0 && s.kw >= 2 && has(s, "tea")) out.push({ label: "Налить чай в термос: две кружки кипятка и пакетик чая" + (has(s, "sug") ? ", с сахаром" : ""), fn: function () { thermos(o); } });
    if (g.inv.noodles > 0) out.push({ label: "Залить кипятком лапшу", fn: function () { soak(o, "noodles"); } });
    if (g.inv.soupcup > 0) out.push({ label: "Залить кипятком суп-концентрат", fn: function () { soak(o, "soupcup"); } });
    out.push({ label: "Налить кружку кипятка", fn: function () { brew(o, "water"); } });
  }
  if (!b && s.kw < KMAX) {
    if (sinkHere(o)) out.push({ label: "Набрать воды из-под крана", fn: function () { fill(o, "tap"); } });
    else if (g.inv.water > 0) out.push({ label: "Налить в чайник воду из бутылки", fn: function () { fill(o, "bottle"); } });
  }
  if (s.tea || s.cof || s.sug) out.push({ label: "Забрать с собой: " + supplyText(s), fn: function () { take(o); } });
  out.push({ label: "Осмотреть", keep: true, fn: function () { say(examine(o)); } });
  return out;
}
function menu(o, title) {
  UIx("menu", title || "Чайник", items(o), { focus: 1, rebuild: function () { return items(o); } });
  return true;
}

/* ── вскипятить ── */
function boil(o) {
  var s = kst(o);
  if (isBoiling(o)) { say("Чайник и так уже шумит."); return false; }
  if (!s.kw) { say("Чайник пуст: сначала наберите воды."); return false; }
  if (isHot(s)) { say("Чайник и так горячий."); return false; }
  UIx("closeAll");
  var g = G(), k = kkey(o), key = CUR().key;
  boiling[k] = { g: g, t: Date.now() };
  var coal = coalK(o);
  at(coal ? "ev_steam" : "kettle_boil", o);
  noise(2);
  turns(1);
  say(coal ? "Вы подвигаете чайник на самый жар и раздуваете угли: вода зашумела. Скоро закипит." : "Щелчок выключателя — чайник зашумел. Секунд десять, и закипит.");
  gm().later(function () { boilEnd(o, s, k, g, key); }, BOIL_MS);
  return true;
}
function boilEnd(o, s, k, g, key) {
  var b = boiling[k]; delete boiling[k];
  if (!b || b.g !== g || G() !== g || g.dead) return;
  s.kt = nowMin() + HOT_MIN;
  if (CUR().key !== key) return;
  var d = cheb(o);
  if (d > 6) return;
  if (d <= 1 && !(LAB.ui.layer && LAB.ui.layer()) && !danger()) { menu(o, "Чайник вскипел"); return; }
  sayq(coalK(o) ? "Чайник на углях вскипел: крышка подпрыгивает." : "Чайник вскипел: щёлкнул автомат.");
}

/* ── вода ── */
function fill(o, how) {
  var s = kst(o), g = G();
  if (isBoiling(o)) { say("Чайник кипит: подождите."); return false; }
  if (how === "bottle" && !(g.inv.water > 0)) { say("Бутылки с водой нет."); return false; }
  UIx("closeAll");
  var was = isHot(s);
  if (how === "tap") { s.kw = KMAX; at("kettle_fill", o); spend(1); }
  else { dec("water"); s.kw = Math.min(KMAX, s.kw + 2); at("kettle_pour", o); }
  s.kt = null; /* холодная вода остудила кипяток */
  say((how === "tap" ? "Вы набираете в чайник воды из-под крана, до отметки: " : "Вы выливаете в чайник бутылку воды: ") + "воды — на " + cups(s.kw) + "." + (was ? " Холодная вода остудила кипяток: вскипятите снова." : ""));
  return true;
}

/* ── заварить ── */
function brew(o, base, own) {
  var s = kst(o), g = G();
  if (!isHot(s)) { say("Кипятка нет: сначала вскипятите чайник."); return false; }
  if (!s.kw) { say("Чайник пуст: наберите воды и вскипятите."); return false; }
  if (s.cup) { say("Кружка ещё не пуста: сначала выпейте, что в ней."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до чая: рядом опасность."); return false; }
  if (base === "tea" && !useSup(s, "tea", own)) { say("Чая нет: ни у чайника, ни в рюкзаке."); return false; }
  if (base === "cof" && !useSup(s, "cof", own)) { say("Кофе нет: ни у чайника, ни в рюкзаке."); return false; }
  if (base === "herb") { if (!(g.inv.herbtea > 0)) { say("Травяного сбора нет."); return false; } dec("herbtea"); }
  s.kw--;
  s.cup = { b: base, t: nowMin(), a: {} };
  UIx("closeAll");
  at("kettle_pour", o);
  spend(1); turns(1);
  say(POUR[base]);
  gm().later(function () {
    if (G() !== g || g.dead || !s.cup || (LAB.ui.layer && LAB.ui.layer())) return;
    if (CUR().fl.objs.indexOf(o) < 0 || cheb(o) > 1) return;
    cupMenu(o, "Кружка готова");
  }, 1800);
  return true;
}
/* (3.7, нелогичность) Термос буровиков наполняют здесь: прежде «термос с горячим сладким
   чаем» собирали на верстаке из биогеля, реагента и лома. Две кружки кипятка, пакетик чая
   и, если есть, кусочек сахара. */
function thermos(o) {
  var s = kst(o), g = G();
  if (!isHot(s) || (s.kw || 0) < 2) { say("Нужны две кружки кипятка: долейте воды и вскипятите."); return false; }
  if (!(g.inv.g_thermos_e > 0)) { say("Пустого термоса у вас нет."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до чая: рядом опасность."); return false; }
  if (!useSup(s, "tea")) { say("Чая нет: ни у чайника, ни в рюкзаке."); return false; }
  var sweet = has(s, "sug") && useSup(s, "sug");
  s.kw -= 2; dec("g_thermos_e"); g.inv.g_thermos = (g.inv.g_thermos || 0) + 1;
  UIx("closeAll");
  at("kettle_pour", o);
  spend(2); turns(1);
  say("Вы заливаете в термос две кружки кипятка, опускаете пакетик" + (sweet ? " и кусочек сахара" : "") + " и закручиваете пробку. Термос с чаем — в рюкзаке.");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
/* Лапша и суп-концентрат: залить кипятком — и есть. */
var SOAK = { noodles: "Лапша набухает в кипятке; вы едите её, обжигаясь.", soupcup: "Порошок расходится в кипятке густым супом; вы пьёте его маленькими глотками." };
function soak(o, id, sam) {
  var s = sam ? sst(o) : kst(o);
  if (sam ? !sHot(s) || !s.sw : !isHot(s) || !s.kw) { say(sam ? "Кипятка нет: самовар холодный или пуст." : "Кипятка нет: сначала вскипятите чайник."); return false; }
  return pour(o, id, sam ? "самовара" : "чайника", function () { if (!sam) s.kw--; else if (!s.sk) s.sw--; }, "kettle_pour");
}
/* (3.7, нелогичность) кран с кипятком у автомата с едой: кипяток в нём не кончается, а лапша и суп
   из него — те же, что из чайника (прежде кран давал столько же, сколько сухая лапша) */
function tap(o, id) { return pour(o, id, "крана", null, "kettle_pour"); }
function pour(o, id, from, take, sndId) {
  var g = G(), d = LAB.ITEMS[id];
  if (!(g.inv[id] > 0) || !d) { say("Этого в рюкзаке нет."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до еды: рядом опасность."); return false; }
  dec(id);
  if (take) take();
  UIx("closeAll");
  at(sndId, o);
  spend(4); turns(1);
  var m = [];
  gm().bodyApply({ food: Math.round((d.food || 0) * 1.25), wake: (d.wake || 0) + 3, detox: d.detox || 0 }, m);
  if (d.heal) { var h0 = g.hp; g.hp = Math.min(g.hpMax, g.hp + d.heal + 3); if (g.hp > h0) m.push("Здоровье " + g.hp + "."); }
  gm().later(function () { if (G() === g) A("play", id === "noodles" ? "eat_chew" : "drink_sip"); }, 1600);
  say(SOAK[id] + " С кипятком из " + from + " — сытнее, чем всухомятку. " + m.join(" "));
  ev("cook");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}

/* ── в кружку: сахар, молоко, лимон — и выпить ── */
function cupItems(o) {
  var s = kst(o), c = s.cup, g = G(), out = [];
  if (!c) return [{ label: "Кружка пуста", info: true, keep: true, fn: function () { say("Кружка пуста."); } }];
  out.push({ label: "Выпить " + cupName(c) + (cupCold(c) ? " — остыл" : ""), fn: function () { drink(o); } });
  if ((c.a.sug || 0) < 2 && has(s, "sug")) out.push({ label: c.a.sug ? "Положить ещё кусочек сахара" : "Положить сахар", keep: true, fn: function () { add(o, "sug"); } });
  if (!c.a.milk && (c.b === "tea" || c.b === "cof") && g.inv.milk > 0) out.push({ label: "Долить молока из пакета", keep: true, fn: function () { add(o, "milk"); } });
  if (!c.a.lemon && c.b !== "cof" && g.inv.lemon > 0) out.push({ label: "Положить дольку лимона", keep: true, fn: function () { add(o, "lemon"); } });
  out.push({ label: "Оставить кружку на столе", fn: function () { say("Кружка остаётся на столе" + (cupCold(c) ? "." : ": пусть немного остынет.")); } });
  return out;
}
function cupMenu(o, title) {
  var s = kst(o);
  if (!s.cup) { say("Кружка пуста."); return false; }
  UIx("menu", title || "Кружка: " + cupName(s.cup), cupItems(o), { rebuild: function () { return cupItems(o); } });
  return true;
}
function add(o, what) {
  var s = kst(o), c = s.cup;
  if (!c) return false;
  if (what === "sug") { if (!useSup(s, "sug")) { say("Сахара нет."); return false; } c.a.sug = (c.a.sug || 0) + 1; at("kettle_stir", o); say(c.a.sug > 1 ? "Ещё кусочек — и ложкой по стенкам." : "Кусочек сахара тает; вы мешаете ложкой."); }
  else if (what === "milk") { if (!(G().inv.milk > 0)) { say("Молока нет."); return false; } dec("milk"); c.a.milk = 1; at("kettle_stir", o); say(c.b === "cof" ? "Кофе светлеет от молока." : "Вы доливаете в чай молока."); }
  else if (what === "lemon") { if (!(G().inv.lemon > 0)) { say("Лимона нет."); return false; } dec("lemon"); c.a.lemon = 1; say("Долька лимона плюхается в кружку — и пахнет летом."); }
  return true;
}
function drink(o) {
  var s = kst(o), c = s.cup, g = G();
  if (!c) { say("Кружка пуста."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до чая: рядом опасность."); return false; }
  if (s.drankAt != null && nowMin() - s.drankAt < GAP_MIN) { say("Вы только что пили: подождите немного — кружка подождёт."); return false; }
  var cold = cupCold(c), e = effect(c, cold), m = [];
  s.cup = null; s.drankAt = nowMin();
  UIx("closeAll");
  spend(3); turns(1);
  gm().bodyApply({ wake: e.wake || 0, neuro: e.neuro || 0, detox: e.detox || 0, food: e.food || 0 }, m);
  if (e.heal) { var h0 = g.hp; g.hp = Math.min(g.hpMax, g.hp + e.heal); if (g.hp > h0) m.push("Здоровье " + g.hp + "."); }
  if (e.en) { g.en = Math.min(g.enMax, g.en + e.en); m.push("Энергия имплантов " + g.en + "."); }
  A("play", "drink_sip");
  say(drinkText(c, cold) + (m.length ? " " + m.join(" ") : ""));
  ev("drink_fx");
  if (LAB.oko && LAB.oko.react) LAB.oko.react("drink");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}

/* ── забрать запасы с собой ── */
function take(o) {
  var s = kst(o), got = [];
  [["tea", "teabag"], ["cof", "instcoffee"], ["sug", "sugar"]].forEach(function (p) {
    var n = s[p[0]];
    if (!(n > 0)) return;
    got.push(gm().giveItem({ kind: "item", item: p[1], n: n }, true));
    s[p[0]] = 0;
  });
  if (!got.length) { say("Забирать нечего."); return false; }
  say("Вы забираете с собой: " + got.join(", ") + ". Заварить можно у любого чайника.");
  UIx("refresh");
  return true;
}

/* ── осмотреть ── */
function examine(o) {
  var s = kst(o), def = LAB.FIX && LAB.FIX.T && LAB.FIX.T.kettle, out = [];
  out.push(def ? def.n + ". " + (keptK(o) && coalK(o) && /на трубе/i.test(String((kroom(o) || {}).desc || "")) ? "Чайник стоит прямо на тёплой трубе реактора и не остывает: кипяток в нём в любой час." : keptK(o) ? "Закопчённый чайник на углях: угли под ним подкладывают, и он всегда горячий." : coalK(o) ? "Закопчённый чайник с толстым дном стоит на углях: подвинешь на жар — зашумит, и вскоре будет кипяток." : def.d) : "Чайник.");
  out.push(stateLine(o));
  if (s.tea) out.push("Чай — " + TEA[s.kv % TEA.length] + ".");
  if (s.cof) out.push("Кофе — " + COF[Math.floor(s.kv / 7) % COF.length] + ".");
  if (s.sug) out.push("Сахар — " + SUG[Math.floor(s.kv / 31) % SUG.length] + ".");
  out.push("Рядом — " + MUG[Math.floor(s.kv / 97) % MUG.length] + ".");
  var rm = o.room != null && o.room >= 0 ? CUR().fl.rooms[o.room] : null;
  if (s.cof && rm && rm.owner && !rm.owner.m) out.push("К банке приклеена бумажка: «Кофе — " + rm.owner.n + ". Не брать!»");
  if (!sinkHere(o) && !keptK(o)) out.push("Раковины здесь нет: воду придётся носить в бутылке.");
  return out.join(" ");
}

/* ════════ САМОВАР ════════
   (3.7, нелогичность) Прежде любой самовар был «ещё тёплым: угли в трубе не догорели» и
   наливал чай раз в час без конца — и в брошенной чайной буровиков, и в закусочной, где
   по описанию помещения он пуст. Теперь — по помещению:
   · за самоваром смотрят (угли подкладывают по очереди, меняют по графику, не догорают) —
     он горячий, воду доливают и чай заваривают здешние: стакан — раз в час, как прежде;
   · пустой по описанию — воды в нём нет;
   · брошенный — холодный, воды на несколько стаканов, в ведёрке у трубы — щепа и угли на
     одну-две растопки. Растопить — четверть часа, горячим держится два часа и остывает.
     Без воды не растапливают: самовар распаяется. Воду доливают из-под крана, если в
     помещении раковина, или из бутылки; чай — из пачки на подносе или свой пакетик, без
     чая — кипяток.
   Состояние у вещи этажа (objState): sw — воды, стаканов; sh — горячий до (минута игры);
   sf — растопок; sk — за самоваром смотрят; tea, sug — на подносе; sAt — когда пили. */
var SMAX = 8, SHOT = 120, SFIRE = 15, SGAP_K = 60, SGAP = 20;
/* стакан чаю из самовара — как прежде: мера из описания самовара (fixtures_data.js) */
function samoFx() { var d = LAB.FIX && LAB.FIX.T && LAB.FIX.T.samovar, a = d && d.a && d.a[0]; return (a && a[2] && a[2].fx) || { wake: 16, neuro: -14, heal: 8, food: 6 }; }
function sst(o) {
  var s = gm().objState(o);
  if (s.sw == null) {
    var r = LAB.Rng(G().seed, "samovar37:" + CUR().key + ":" + o.id), rm = o.room != null && o.room >= 0 ? CUR().fl.rooms[o.room] : null, d = (rm && rm.desc) || "";
    s.sk = /подкладыва|по графику|не догора|всегда горяч|до сих пор т[её]пл/i.test(d) ? 1 : 0;
    s.sw = s.sk ? SMAX : /самовар[^.]*пуст/i.test(d) ? 0 : r.int(3, 6);
    s.sf = s.sk ? 0 : r.int(1, 2);
    s.tea = s.sk ? 0 : r.chance(0.7) ? r.int(2, 6) : 0;
    s.sug = s.sk ? 0 : r.chance(0.6) ? r.int(3, 8) : 0;
  }
  return s;
}
function sHot(s) { return !!s.sk || (s.sh != null && nowMin() < s.sh); }
function glasses(n) { return n + " " + pl(n, "стакан", "стакана", "стаканов"); }
function samLine(o) {
  var s = sst(o), out = [], p = [];
  if (s.sk) out.push("Самовар горячий, пыхтит: за ним здесь смотрят — угли подкладывают, воду доливают, чай заваривают.");
  else if (!s.sw) out.push("Самовар пуст: краник сух, медь звенит от щелчка.");
  else if (sHot(s)) out.push("Самовар горячий: кипятка — на " + glasses(s.sw) + ".");
  else out.push((s.sh != null ? "Самовар остыл: угли прогорели. Воды — на " : "Самовар холодный: воды — на ") + glasses(s.sw) + ".");
  if (!s.sk) out.push(s.sf > 0 ? "В ведёрке у трубы — щепа и угли на " + s.sf + " " + pl(s.sf, "растопку", "растопки", "растопок") + "." : "Щепы и углей больше нет: растапливать нечем.");
  if (s.tea) p.push("пачка чая, " + s.tea + " " + pl(s.tea, "пакетик", "пакетика", "пакетиков"));
  if (s.sug) p.push("сахар, " + s.sug + " " + pl(s.sug, "кусочек", "кусочка", "кусочков"));
  if (p.length) out.push("На подносе: " + p.join("; ") + ".");
  return out.join(" ");
}
function samItems(o) {
  var s = sst(o), g = G(), out = [], hot = sHot(s);
  out.push({ label: samLine(o), info: true, keep: true, fn: function () { say(samLine(o)); } });
  if (hot && s.sw > 0) {
    if (s.sk || has(s, "tea")) {
      out.push({ label: "Налить стакан чаю", fn: function () { samDrink(o, "tea", false); } });
      if (!s.sk && has(s, "sug")) out.push({ label: "Налить стакан чаю с сахаром", fn: function () { samDrink(o, "tea", true); } });
    }
    if (has(s, "cof")) out.push({ label: "Заварить растворимый кофе", fn: function () { samDrink(o, "cof", false); } });
    if (g.inv.herbtea > 0) out.push({ label: "Заварить травяной сбор", fn: function () { samDrink(o, "herb", false); } });
    if (g.inv.noodles > 0) out.push({ label: "Залить кипятком лапшу", fn: function () { soak(o, "noodles", true); } });
    if (g.inv.soupcup > 0) out.push({ label: "Залить кипятком суп-концентрат", fn: function () { soak(o, "soupcup", true); } });
    if (!s.sk) out.push({ label: "Налить стакан кипятку", fn: function () { samDrink(o, "water", false); } });
  }
  if (!hot && !s.sk) {
    if (s.sw > 0 && s.sf > 0) out.push({ label: "Растопить самовар: щепа и угли в трубу, раздуть — четверть часа", fn: function () { samFire(o); } });
    else if (s.sf > 0) out.push({ label: "Растопить нельзя: без воды самовар распаяется", info: true, keep: true, fn: function () { say("Без воды самовар не растапливают: распаяется. Сначала налейте воды."); } });
  }
  if (!s.sk && s.sw < SMAX) {
    if (sinkHere(o)) out.push({ label: "Налить воды из-под крана: до краёв", fn: function () { samFill(o, "tap"); } });
    else if (g.inv.water > 0) out.push({ label: "Долить воды из бутылки: на два стакана", fn: function () { samFill(o, "bottle"); } });
  }
  if (s.tea || s.sug) out.push({ label: "Забрать с подноса с собой: " + [s.tea ? "чай" : "", s.sug ? "сахар" : ""].filter(Boolean).join(" и "), fn: function () { samTake(o); } });
  out.push({ label: "Осмотреть", keep: true, fn: function () { say(samExamine(o)); } });
  return out;
}
function samMenu(o) {
  UIx("menu", "Самовар", samItems(o), { focus: 1, rebuild: function () { return samItems(o); } });
  return true;
}
function samFire(o) {
  var s = sst(o);
  if (sHot(s)) { say("Самовар и так горячий."); return false; }
  if (!(s.sw > 0)) { say("Без воды самовар не растапливают: распаяется."); return false; }
  if (!(s.sf > 0)) { say("Растапливать нечем: щепа и угли кончились."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до самовара: рядом опасность."); return false; }
  s.sf--;
  UIx("closeAll");
  at("kettle_boil", o);
  noise(2);
  spend(SFIRE); turns(2);
  s.sh = nowMin() + SHOT;
  say("Вы закладываете в трубу щепу и угли, поджигаете и раздуваете. Минут через пятнадцать самовар запел, а потом зашумел: вскипел. Горячим продержится часа два.");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
function samFill(o, how) {
  var s = sst(o), g = G();
  if (how === "bottle" && !(g.inv.water > 0)) { say("Бутылки с водой нет."); return false; }
  UIx("closeAll");
  if (how === "tap") { s.sw = SMAX; at("kettle_fill", o); spend(3); }
  else { dec("water"); s.sw = Math.min(SMAX, s.sw + 2); at("kettle_pour", o); spend(1); }
  say((how === "tap" ? "Вы носите воду из-под крана, пока самовар не наполнился до краёв: " : "Вы доливаете в самовар бутылку воды: ") + "воды — на " + glasses(s.sw) + "." + (sHot(s) ? " Угли ещё горят: вода догреется." : ""));
  return true;
}
function samDrink(o, base, sweet) {
  var s = sst(o), g = G();
  if (!sHot(s)) { say("Самовар холодный: сначала растопите его."); return false; }
  if (!(s.sw > 0)) { say("Самовар пуст."); return false; }
  if (danger()) { if (LAB.UI && LAB.UI.error) LAB.UI.error(); say("Не до чая: рядом опасность."); return false; }
  var gap = s.sk ? SGAP_K : SGAP, left = s.sAt != null ? gap - (nowMin() - s.sAt) : 0;
  if (left > 0) { say("Вы только что пили: следующий стакан — примерно через " + left + " " + pl(left, "минуту", "минуты", "минут") + "."); return false; }
  if (base === "tea" && !s.sk && !useSup(s, "tea")) { say("Чая нет: ни на подносе, ни в рюкзаке."); return false; }
  if (base === "cof" && !useSup(s, "cof")) { say("Растворимого кофе у вас нет."); return false; }
  if (base === "herb") { if (!(g.inv.herbtea > 0)) { say("Травяного сбора нет."); return false; } dec("herbtea"); }
  var sug = sweet && !s.sk && useSup(s, "sug");
  if (!s.sk) s.sw--;
  s.sAt = nowMin();
  var e = {}, k, m = [], src = base === "tea" ? samoFx() : BASE[base];
  for (k in src) e[k] = src[k];
  if (sug) for (k in ADD.sug) e[k] = (e[k] || 0) + ADD.sug[k];
  UIx("closeAll");
  at("kettle_pour", o);
  spend(base === "water" ? 3 : 8); turns(1);
  gm().bodyApply({ wake: e.wake || 0, neuro: e.neuro || 0, detox: e.detox || 0, food: e.food || 0 }, m);
  if (e.heal) { var h0 = g.hp; g.hp = Math.min(g.hpMax, g.hp + e.heal); if (g.hp > h0) m.push("Здоровье " + g.hp + "."); }
  if (e.en) { g.en = Math.min(g.enMax, g.en + e.en); m.push("Энергия имплантов " + g.en + "."); }
  gm().later(function () { if (G() === g) A("play", "drink_sip"); }, 900);
  say(SAM_T[base] + (sug ? " Сладко." : "") + (m.length ? " " + m.join(" ") : ""));
  ev("drink_fx");
  if (LAB.oko && LAB.oko.react) LAB.oko.react("drink");
  if (gm().autosaveSoon) gm().autosaveSoon();
  return true;
}
function samTake(o) {
  var s = sst(o), got = [];
  [["tea", "teabag"], ["sug", "sugar"]].forEach(function (p) {
    if (!(s[p[0]] > 0)) return;
    got.push(gm().giveItem({ kind: "item", item: p[1], n: s[p[0]] }, true));
    s[p[0]] = 0;
  });
  if (!got.length) { say("Забирать нечего."); return false; }
  say("Вы забираете с подноса: " + got.join(", ") + ". Заварить можно у любого чайника или самовара.");
  UIx("refresh");
  return true;
}
var SAM_T = {
  tea: "Чай крепкий, с дымком. Вы пьёте, грея ладони о стакан.",
  cof: "Растворимый кофе на самоварном кипятке горчит, зато сон как рукой сняло.",
  herb: "Травы в стакане самоварного кипятка пахнут мятой и мёдом: дышится легче, мысли успокаиваются.",
  water: "Стакан кипятку из самовара — и тот согревает."
};
function samExamine(o) {
  var def = LAB.FIX && LAB.FIX.T && LAB.FIX.T.samovar;
  return (def ? def.n + ". " + def.d : "Самовар.") + " " + samLine(o) + (sst(o).sk ? "" : sinkHere(o) ? " Раковина здесь же: воду носить недалеко." : " Раковины здесь нет: воду придётся носить в бутылке.");
}

/* ── из рюкзака: пакетик чая или кофе — у чайника ── */
function useItem(id) {
  var d = LAB.ITEMS[id], o = kettleNear();
  if (!d || !d.brew) return false;
  if (!o) {
    var sm = samNear();
    if (sm && sHot(sst(sm))) return samDrink(sm, d.brew, false);
    say(d.n + ". Заваривают кипятком: подойдите к чайнику" + (sm ? " или растопите самовар." : "."));
    return false;
  }
  var s = kst(o);
  if (!isHot(s)) { say("Чайник холодный: сначала вскипятите его."); menu(o); return false; }
  return brew(o, d.brew, true);
}

LAB.kitchen = {
  coldItem: coldItem, cookedItem: cookedItem, fridgeExtra: fridgeExtra, addTo: addTo,
  menu: menu, examine: examine, useItem: useItem, boil: boil, brew: brew, drink: drink, cupMenu: cupMenu, sinkHere: sinkHere, tap: tap,
  samovar: samMenu, samExamine: samExamine, samFire: samFire, samDrink: samDrink, samFill: samFill, samState: function (o) { return sst(o); },
  state: function (o) { return kst(o); },
  /* для проверок: кипение без ожидания, сброс */
  _boilNow: function (o) { var s = kst(o); delete boiling[kkey(o)]; s.kt = nowMin() + HOT_MIN; return s; },
  _boiling: function (o) { return isBoiling(o); },
  _reset: function () { boiling = {}; },
  COLD: COLD, COOKED: COOKED, BOIL_MS: BOIL_MS
};
})();
