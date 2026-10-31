/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — пакости в хранилищах (2.5, просьба игрока).
   Шкафчик, тумбочка, ящик стола, сейф, холодильник, тело на полу — не
   только добыча. Прежние жители и ОКО оставляли в них сюрпризы: банки на
   нитке, иглу с ядом в замке, пружинное лезвие, провод под током, датчик
   ОКО на дверце, газовую ампулу, гранату на растяжке, кислоту в петлях,
   криопатрон, ЭМИ-капсулу. Твари устраивают в них гнёзда — крысиные,
   личиночьи, клещевые; шкафник прикидывается шкафом, а разумные твари
   глубин метят добычу меткой улья.
   Ловушка честная: у каждой есть признак. Подойдите вплотную — «Эхо»
   иногда сам замечает звук или запах; «Осмотреть» ищет внимательнее;
   сканер видит их все. Замеченную ловушку можно обезвредить (с набором
   инструментов и опытом сапёра — надёжнее) и забрать её детали, а то и
   саму ловушку; гнездо — выжечь, шкафника — ударить первым. Не заметили —
   в последний миг ещё можно отдёрнуть руку. Добыча после ловушки остаётся
   на месте. Чем глубже, тем ловушек больше и тем они злее; в лёгком
   режиме их меньше и их проще заметить, в сложных — наоборот. Где ловушка,
   решает этаж раз и навсегда; что с ней стало — помнит этаж.
   Синтаксис — не новее ES2017.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

/* ════════ ВИДЫ ════════
   where — где бывает: box — шкафы, ящики, столы, стеллажи; safe — сейф;
   cold — холодильник; med — аптечный шкафчик; fx — вещи обстановки, где
   можно пошарить (тумбочка, матрас, ящик стола); body — тело на полу.
   w — вес при выборе; minL, maxL — глубина; see — насколько легче
   (больше нуля) или труднее заметить; hard — насколько труднее
   обезвредить; cue — что слышно вплотную (и звук cueSnd); hint — что
   находит «Осмотреть»; hit — что случилось. fx — действие: pd — доля
   здоровья (adt — вид удара), poison, bleed, tox, neuro, rad, hold, slow,
   noise, oko, gas, grenade, spawn и n, parasite, emp, drain, armor, mimic,
   psi. (3.7) fxo — вещи обстановки без дверцы и ящика (диван, скамья, койка, решётка, вешалка,
   бочки…): там пружинного лезвия не бывает, а у прочих — свои подсказки o (без ручки, замочной
   скважины и дверцы); они же — у тела. glove — прорезиненная ткань спасает руки; mask — респиратор и
   противогаз спасают дыхание. noDisarm — тварь, а не механизм: её не
   разбирают, а уничтожают (kill — как это назвать). gain — сама ловушка
   в рюкзак, parts — детали. */
var K = {
  cans: { n: "банки на нитке", w: 10, minL: 1, maxL: 40, where: "box fx fxo body", see: 0.12, hard: 0,
    o: { cue: "Тронешь — где-то рядом тихо звякает жесть.", hint: "Под рукой натянута тонкая нитка, а на ней — связка пустых банок." },
    cue: "Тронешь дверцу — внутри тихо звякает жесть.", cueSnd: "can_open",
    hint: "К ручке привязана тонкая нитка, а на ней — связка пустых банок.",
    hit: "Нитка дёрнулась — связка банок загремела на весь этаж! На шум сейчас сбегутся.",
    fx: { noise: 12 }, gain: "tr_alarm", parts: { wire: 1, scrap: 1 } },
  needle: { n: "игла с ядом", w: 9, minL: 1, where: "box fx fxo safe med", see: -0.1, hard: 0.05,
    o: { hint: "Среди вещей торчит тонкая игла, кончик тёмный — от яда.", hit: "Палец укололо: там была игла! Ранка жжёт — яд." },
    hint: "В замочной скважине поблёскивает тонкая игла, кончик тёмный — от яда.",
    hit: "Палец укололо: в замке была игла! Ранка жжёт — яд.",
    fx: { poison: 10, tox: 8 }, glove: true, parts: { reagent: 1 } },
  blade: { n: "пружинное лезвие", w: 8, minL: 1, where: "box fx", see: -0.05, hard: 0.05,
    hint: "Дверца подпёрта изнутри: за ней взведена пружина с бритвенным лезвием.",
    hit: "Щелчок пружины — лезвие полоснуло по руке! Рана кровит.",
    fx: { pd: 0.08, bleed: 14 }, parts: { scrap: 2, wire: 1 } },
  shock: { n: "провод под током", w: 8, minL: 1, where: "box safe", see: 0.12, hard: 0.1,
    cue: "Ручка тихо гудит, и пахнет озоном.", cueSnd: "ev_electric",
    hint: "К ручке подведён оголённый провод: она под током.",
    hit: "Разряд из ручки бьёт в руку и в грудь! Пальцы онемели.",
    fx: { pd: 0.1, adt: "shock", hold: 2, drain: 0.3 }, glove: true, gain: "tr_shock", parts: { wire: 2, cap: 1 } },
  rats: { n: "крысиное гнездо", kill: "Выжечь крысиное гнездо", w: 7, minL: 1, maxL: 20, where: "box fx fxo body cold", see: 0.22, hard: 0,
    o: { cue: "Там скребутся и попискивают.", hint: "Оттуда доносятся писк и возня: там гнездо крысолаков.", hit: "Гнездо потревожено — крысолаки прыгают на вас!" },
    cue: "Внутри скребутся и попискивают.", cueSnd: "rat_idle",
    hint: "Изнутри доносятся писк и возня: там гнездо крысолаков.",
    hit: "Дверца отошла — и из гнезда на вас прыгают крысолаки!",
    fx: { spawn: "rat", n: [2, 3] }, noDisarm: true },
  glue: { n: "клеевой баллон", w: 6, minL: 2, where: "box fx fxo", see: 0, hard: 0.05,
    o: { hint: "Под рукой — баллон с клеем и нажимной клапан, прикрытый тряпкой." },
    hint: "На дне — баллон с клеем и нажимной клапан под тонкой фанеркой.",
    hit: "Клапан пшикнул — руки и ноги в клею!",
    fx: { hold: 6, slow: 10 }, gain: "tr_glue", parts: { gel: 1 } },
  alarm: { n: "датчик ОКО", w: 8, minL: 2, where: "box safe med", see: 0.06, hard: 0.15,
    cue: "Под дверцей едва слышно попискивает датчик.", cueSnd: "term_beep",
    hint: "На дверце — магнитный датчик ОКО: откроете — ОКО узнает, где вы.",
    hit: "Тихий двойной писк: дверца стояла на датчике. ОКО знает, где вы, — сюда идут.",
    fx: { oko: true }, parts: { chip: 1, wire: 1 } },
  gas: { n: "газовая ампула", w: 7, minL: 3, where: "box safe med fx fxo", see: 0.06, hard: 0.1,
    o: { hint: "Там спрятана стеклянная ампула с газом: тронете — разобьётся." },
    cue: "Из щели тянет едким, и тонко шипит.", cueSnd: "ev_steam",
    hint: "За дверцей закреплена стеклянная ампула с газом: разобьётся, если открыть.",
    hit: "Хруст стекла — едкий газ рвётся наружу! Не дышите и отходите.",
    fx: { gas: true, tox: 12 }, mask: true, gain: "tr_gas", parts: { reagent: 2 } },
  spores: { n: "споровый мешок", w: 6, minL: 3, where: "box fx fxo body cold", see: 0.1, hard: 0.05,
    o: { cue: "Там что-то влажно чавкает и пахнет грибницей.", hint: "Там разросся споровый мешок: тронешь — лопнет облаком спор." },
    cue: "Внутри что-то влажно чавкает и пахнет грибницей.", cueSnd: "ev_rustle",
    hint: "Под крышкой разросся споровый мешок: тронешь — лопнет облаком спор.",
    hit: "Мягкий хлопок — в лицо облако спор! Горло дерёт, в голове звенит.",
    fx: { tox: 10, neuro: 18, noise: 4 }, mask: true, parts: { gel: 1 } },
  grenade: { n: "граната на растяжке", w: 5, minL: 4, where: "box body", see: 0.02, hard: 0.2,
    o: { hint: "Проволока уходит к гранате без чеки: тронете — рванёт." },
    cue: "Что-то чуть звенит, как натянутая проволока.", cueSnd: "pry",
    hint: "Проволока от дверцы уходит к гранате без чеки. Откроете — рванёт.",
    hit: "Щелчок и шипение запала — граната! Отходите, у вас две секунды!",
    fx: { grenade: true }, gain: "tr_wire", parts: { reagent: 1, cap: 1, scrap: 1 } },
  larvae: { n: "кладка личинок", kill: "Раздавить кладку личинок", w: 6, minL: 4, where: "box fx fxo body cold", see: 0.22, hard: 0,
    o: { cue: "Там тихо шуршат и щёлкают сотни крошечных челюстей.", hint: "Там — кладка личинок: они вот-вот вылупятся." },
    cue: "Внутри тихо шуршат и щёлкают сотни крошечных челюстей.", cueSnd: "ev_skitter",
    hint: "Внутри — кладка личинок: они вот-вот вылупятся.",
    hit: "Кладка лопнула — личинки высыпают наружу и ползут к вам!",
    fx: { spawn: "u_larva", n: [3, 5] }, noDisarm: true },
  mimic: { n: "шкафник", kill: "Ударить первым", w: 4, minL: 5, where: "box", see: 0.16, hard: 0,
    cue: "Дверца тёплая и чуть подаётся то внутрь, то наружу — будто дышит.", cueSnd: "ev_heart",
    hint: "Это не шкаф. Это шкафник — тварь, отрастившая себе дверцы. Он ждёт, когда вы откроете.",
    hit: "Дверца распахивается сама — это шкафник! Челюсти щёлкают у самой руки.",
    fx: { mimic: "u_lockermimic", pd: 0.06 }, noDisarm: true },
  acid: { n: "кислотная колба", w: 5, minL: 6, where: "box safe", see: 0, hard: 0.1,
    hint: "В петлях дверцы — колба с кислотой: откроете — плеснёт.",
    hit: "Колба лопнула — кислота брызнула на руки и на броню!",
    fx: { pd: 0.06, adt: "chem", armor: 0.12 }, glove: true, gain: "tr_acid", parts: { reagent: 2 } },
  rad: { n: "фонящая ампула", w: 3, minL: 6, where: "box safe", see: 0.06, hard: 0.05,
    cue: "Счётчик «Эхо» тихо потрескивает у этой дверцы.", cueSnd: "pos_hum_short",
    hint: "Внутри лежит разбитая ампула с изотопом: фонит.",
    hit: "Счётчик зашёлся треском: внутри разбитая ампула с изотопом! Вы схватили дозу.",
    fx: { rad: 22 }, parts: { lead: 1 } },
  cryo: { n: "криопатрон", w: 4, minL: 7, where: "box cold safe", see: 0.06, hard: 0.1,
    cue: "От дверцы тянет холодом, металл в инее.", cueSnd: "ev_ice_crack",
    hint: "За дверцей — патрон жидкого азота на пружинном ударнике.",
    hit: "Хлопок — и ледяное облако сковывает руки и ноги!",
    fx: { pd: 0.07, adt: "therm", hold: 5, slow: 12 }, gain: "tr_cryo", parts: { cap: 1, reagent: 1 } },
  parasite: { n: "клещ-кровосос", kill: "Раздавить клеща", w: 5, minL: 8, where: "fx fxo body cold box", see: 0.1, hard: 0,
    cue: "Что-то мелкое шевелится в складках.", cueSnd: "ev_skitter",
    hint: "В складках затаился клещ-кровосос величиной с ладонь.",
    hit: "Что-то холодное прыгает на руку и впивается: клещ-кровосос! Аптечка, бинт или антидот снимут его.",
    fx: { parasite: 80 }, noDisarm: true },
  emp: { n: "ЭМИ-капсула", w: 4, minL: 9, where: "box safe", see: 0.06, hard: 0.15,
    cue: "Возле замка тонко гудит конденсатор.", cueSnd: "mag_hum_short",
    hint: "В замок встроена ЭМИ-капсула: откроете — погасит импланты и посадит батарею оружия.",
    hit: "Глухой хлопок импульса — импланты гаснут, батарея оружия села наполовину!",
    fx: { emp: true }, gain: "tr_emp", parts: { magnet: 1, cap: 1 } },
  psi: { n: "метка улья", w: 6, minL: 41, where: "box fx fxo body cold", see: 0.06, hard: 0.1,
    o: { hint: "Здесь оставлена склизкая метка улья: так разумные твари метят добычу." },
    cue: "Пахнет сладко и чуждо, как в улье.", cueSnd: "ev_whisper",
    hint: "На дверце оставлена склизкая метка улья: так разумные твари метят добычу.",
    hit: "Под пальцами лопнула склизкая метка — запах улья! Разумные твари этажа теперь чуют вас.",
    fx: { psi: 70 }, parts: { gel: 1 } }
};
var ORDER = Object.keys(K);
var ACC = { cans: "банки на нитке", needle: "иглу с ядом", blade: "пружинное лезвие", shock: "провод под током", rats: "крысиное гнездо", glue: "клеевой баллон",
  alarm: "датчик ОКО", gas: "газовую ампулу", spores: "споровый мешок", grenade: "гранату на растяжке", larvae: "кладку личинок", mimic: "шкафника",
  acid: "кислотную колбу", rad: "фонящую ампулу", cryo: "криопатрон", parasite: "клеща-кровососа", emp: "ЭМИ-капсулу", psi: "метку улья" };

function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function cb() { return LAB.combat; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function urgent(t) { LAB.say(t, { prio: "urgent" }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
function idx(x, y) { return y * LAB.W + x; }
function cheb(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function sndAt(id, x, y, o) { if (LAB.atmos && LAB.atmos.at) A("at", id, x, y, o || {}); else A("play", id, o || {}); }
function dk() { return LAB.dk ? LAB.dk() : {}; }

/* ════════ ГДЕ И КАКАЯ ════════ */
var BOX = { locker: 1, cabinet: 1, shelf: 1, crate: 1, suitlocker: 1, rack: 1, tubepost: 1, desk: 1, pc: 1 };
/* (3.7, нелогичность) вещи обстановки с дверцей, ящиком или заслонкой: у них замочная скважина,
   ручка и дверца; у прочих (диван, скамья, койка, решётка вентиляции, вешалка, бочки, котлы…) —
   «fxo»: там «игла в замочной скважине» и «дверца подпёрта изнутри» не бывают */
var DOORFX = { table: 1, nightstand: 1, dutydesk: 1, diarydesk: 1, perfocards: 1, stamps: 1, register: 1, couch: 1, gunrack: 1, optable: 1, coldroom: 1, oven: 1, hood: 1, cryopods: 1, washer: 1, tubes: 1, bookcase: 1, cores: 1 };
function whereOf(o) {
  if (!o) return null;
  if (o.type === "corpse") return "body";
  if (o.type === "safe") return "safe";
  if (o.type === "fridge") return "cold";
  if (o.type === "firstaid") return "med";
  if (o.type === "fx") {
    var d = LAB.FIX && LAB.FIX.T ? LAB.FIX.T[o.fx] : null;
    return d && d.a && d.a.some(function (a) { return a[0] === "search"; }) ? (DOORFX[o.fx] ? "fx" : "fxo") : null;
  }
  return BOX[o.type] ? "box" : null;
}
/* Доля хранилищ с пакостью: на первых двух этажах — ни одной, дальше —
   одно из двадцати пяти, к нижним уровням — одно из шести; по режиму
   сложности (trap): в лёгком меньше, в сложных больше. */
function chanceAt(L, F) {
  var d0 = LAB.depth(L, F);
  if (d0 < 2) return 0;
  var p = Math.min(0.16, 0.04 + 0.0012 * L + (F || 1) * 0.0004);
  var t = dk().trap; if (t == null) t = 1;
  return p * t;
}
/* Помещения, где пакостей не бывает: место пробуждения, капсулы, мастерская
   этажа и безопасная зона. */
var calmOf = null, calmSet = null;
function quietRoom(fl, fs, r) {
  if (r == null || r < 0) return false;
  if (fs && fs.haven && fs.haven[r]) return true;
  if (fl.U === r) return true;
  if (fl.rooms[r] && fl.rooms[r].shop) return true; /* мастерская этажа */
  if (calmOf !== fl) { calmOf = fl; calmSet = {}; fl.objs.forEach(function (q) { if (q.type === "wake" || q.type === "capsule") calmSet[q.room] = 1; }); }
  return !!calmSet[r];
}
function pool(L, where) {
  return ORDER.filter(function (k) { var d = K[k]; return d.minL <= L && (!d.maxL || L <= d.maxL) && d.where.split(" ").indexOf(where) >= 0; });
}
/* Что в этом хранилище: ловушка (её вид и состояние) или ничего.
   Раскладка — от зерна прохождения, этажа и номера вещи: сколько ни
   загружайся, шкафчик тот же. Состояние — в этаже (fs.ctrap). */
function trapOf(o) {
  var g = G(), cur = CUR();
  if (!o || !cur || !cur.fs) return null;
  var fs = cur.fs; fs.ctrap = fs.ctrap || {};
  var s = fs.ctrap[o.id];
  if (s) return s.k && K[s.k] ? s : null;
  var where = whereOf(o);
  if (!where) return null;
  if (quietRoom(cur.fl, fs, o.room)) return null;
  var p = chanceAt(g.L, g.F);
  if (where === "safe") p *= 1.4;
  if (where === "body") p *= 1.2;
  var h = LAB.hash32(g.seed + ":" + cur.key + ":" + o.id + ":ctrap");
  if ((h % 10000) / 10000 >= p) return null;
  var ks = pool(g.L, where);
  if (!ks.length) return null;
  var tw = 0; ks.forEach(function (k) { tw += K[k].w; });
  var roll = (h >>> 12) % tw, k = ks[0];
  for (var i = 0; i < ks.length; i++) { roll -= K[ks[i]].w; if (roll < 0) { k = ks[i]; break; } }
  /* мимик бывает только там, где есть дверца: в шкафчике, шкафу, ящике */
  if (k === "mimic" && !/^(locker|cabinet|suitlocker|crate)$/.test(o.type)) k = ks.filter(function (q) { return q !== "mimic"; })[0] || null;
  if (!k) return null;
  s = fs.ctrap[o.id] = { k: k, st: "armed" };
  return s;
}
function armed(s) { return !!(s && (s.st === "armed" || s.st === "known")); }
/* (3.7) подсказка, признак, что случилось — по месту: у вещи без дверцы и у тела — свои (o) */
function tx(s, o, f) { var d = K[s.k], w = whereOf(o); return (w === "fxo" || w === "body") && d.o && d.o[f] ? d.o[f] : d[f]; }

/* ════════ ЗАМЕТИТЬ ════════ */
var rolled = {};   /* что уже пытались заметить на подходе (на этот заход на этаж) */
var exRolled = {}; /* что уже пытались найти «Осмотреть» */
function sapper() { return !!(LAB.ach && LAB.ach.has("sapper")); }
function eyeK() {
  var g = G(), p = 0;
  if (sapper()) p += 0.18;
  /* чип острого слуха и прочие сенсоры: слышно и чуется острее */
  if (LAB.implants && LAB.implants.stat) p += Math.min(0.2, (LAB.implants.stat("sense") || 0) * 0.05);
  p += (dk().tsee || 0);
  p += Math.max(-0.1, Math.min(0.2, (LAB.heroStat("mind") - 10) * 0.01)); /* (после 4.0) с прибавкой от плода */
  return p;
}
function seeChance(s, exam) {
  var d = K[s.k];
  return Math.max(0.05, Math.min(0.95, (exam ? 0.6 : 0.24) + (d.see || 0) + eyeK()));
}
function nameIn(o) { return gm().objName ? gm().objName(o, true) : (LAB.OBJ[o.type] || {}).n || "хранилище"; }
/* Ловушка здесь известна (для имени хранилища): только если её уже нашли. */
function knownTrap(o) { var fs = CUR() && CUR().fs; var s = fs && fs.ctrap ? fs.ctrap[o.id] : null; return !!(s && s.k && s.st === "known"); }
function reveal(o, s, how) {
  if (!armed(s)) return "";
  s.st = "known";
  var d = K[s.k], where = nameIn(o);
  if (how === "cue") {
    if (d.cueSnd) sndAt(d.cueSnd, o.x, o.y, { gain: 0.6 });
    return "«Эхо»: " + (tx(s, o, "cue") || tx(s, o, "hint")) + " " + cap1(where) + " " + gm().relDir(o.x, o.y) + " — с подвохом: " + d.n + ".";
  }
  return "Ловушка: " + tx(s, o, "hint");
}
/* «Осмотреть»: строка о ловушке (или пусто). */
function examineLine(o) {
  var s = trapOf(o);
  if (!armed(s)) return "";
  if (s.st === "known") return "Ловушка: " + tx(s, o, "hint");
  if (exRolled[o.id]) return "";
  exRolled[o.id] = 1;
  if (Math.random() < seeChance(s, true)) { s.st = "known"; A("play", "scan_soft"); return "Ловушка! " + tx(s, o, "hint"); }
  return "";
}
/* Сканер: все пакости в радиусе. */
function scanText(rad) {
  var g = G(), fl = CUR().fl, out = [];
  fl.objs.forEach(function (o) {
    if (cheb(o.x, o.y, g.x, g.y) > rad) return;
    var s = trapOf(o);
    if (!armed(s)) return;
    s.st = "known";
    out.push(nameIn(o) + " " + gm().relDir(o.x, o.y) + ": " + K[s.k].n);
  });
  if (!out.length) return "";
  return "Ловушки в хранилищах: " + out.join("; ") + ".";
}
/* На подходе: вплотную к хранилищу «Эхо» иногда сам замечает признак. */
var lastCell = -1;
function nearTick() {
  var g = G(), cur = CUR();
  if (!cur || !cur.fl) return;
  var here = idx(g.x, g.y);
  if (here === lastCell) return;
  lastCell = here;
  var fl = cur.fl;
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
    var x = g.x + dx, y = g.y + dy;
    if (!LAB.inb(x, y)) continue;
    var o = fl.objAt ? fl.objAt[idx(x, y)] : null;
    if (!o || rolled[o.id]) continue;
    var s = trapOf(o);
    if (!armed(s) || s.st === "known") continue;
    rolled[o.id] = 1;
    if (!K[s.k].cue) continue; /* без звука и запаха — найдёт только «Осмотреть» или сканер */
    if (Math.random() < seeChance(s, false)) LAB.say(reveal(o, s, "cue"), { prio: "event" });
  }
}

/* ════════ ОБЕЗВРЕДИТЬ ════════ */
function disarmChance(s) {
  var g = G(), d = K[s.k], inv = g.inv || {};
  var p = 0.6 + ((inv.toolkit || 0) > 0 ? 0.15 : 0) + (sapper() ? 0.15 : 0) + ((inv.rubber || 0) > 0 && d.glove ? 0.08 : 0) + (dk().tsee || 0) * 0.5;
  p -= (d.hard || 0) + Math.min(0.15, g.L * 0.0015);
  if (d.noDisarm) p = 0.7 + (LAB.heroStat("agi") - 10) * 0.02 + (sapper() ? 0.1 : 0);
  return Math.max(0.2, Math.min(0.95, p));
}
function give(id, n) {
  if (!LAB.ITEMS[id]) return null;
  var g = G(); g.inv[id] = (g.inv[id] || 0) + (n || 1);
  return LAB.ITEMS[id].n + ((n || 1) > 1 ? ", " + n + " шт." : "");
}
function disarm(o, s, cont) {
  var d = K[s.k], g = G();
  if (gm().advanceTime) gm().advanceTime(d.noDisarm ? 1 : 3);
  A("play", "pry");
  if (Math.random() < disarmChance(s)) {
    s.st = "off";
    var got = [];
    if (d.noDisarm) {
      A("play", "hit_flesh");
      if (s.k === "mimic") {
        /* ударили первым: шкафник выбирается раненым и оглушённым */
        var f = spawnNear(o, d.fx.mimic, 1)[0];
        if (f) { f.hp = Math.max(1, Math.round(f.hp * 0.45)); f.frozen = 3; f.state = "hunt"; f.lastKnown = { x: g.x, y: g.y }; }
        say("Вы бьёте первыми: шкафник вываливается наружу раненым и оглушённым. Добейте его!");
        ev("disarm", 1);
        return;
      }
      say(s.k === "parasite" ? "Вы раздавили клеща, пока он не прыгнул." : s.k === "rats" ? "Гнездо выжжено: крысолаки не успели выбраться." : "Кладка раздавлена: личинки не вылупятся.");
      if (gm().gainXP) gm().gainXP(4);
    } else {
      if (d.gain && LAB.ITEMS[d.gain] && (LAB.ITEMS[d.gain].depth || 1) <= g.L && Math.random() < 0.55) { var t = give(d.gain, 1); if (t) got.push(t); }
      if (!got.length) for (var pk in (d.parts || {})) { var t2 = give(pk, d.parts[pk]); if (t2) got.push(t2); }
      A("play", "craft");
      say("Обезврежено: вы сняли " + (ACC[s.k] || d.n) + "." + (got.length ? " В рюкзак: " + got.join(", ") + "." : ""));
      if (gm().gainXP) gm().gainXP(6);
    }
    ev("disarm", 1);
    UIx("refresh");
    if (cont) cont();
    return;
  }
  /* не вышло */
  urgent(d.noDisarm ? "Не успели!" : "Не вышло — сработала!");
  spring(o, s, cont);
}

/* ════════ СРАБАТЫВАНИЕ ════════ */
var grenades = [];
function spawnNear(o, type, n) {
  var C = cb(), out = [];
  if (!C || !C.spawnFoe) return out;
  if (!LAB.FOES[type]) type = type === "u_lockermimic" ? "mimicbox" : "roach";
  for (var i = 0; i < n; i++) {
    var c = C.freeCellNear(o.x, o.y, null) || C.freeCellNear(G().x, G().y, null);
    if (!c) break;
    var f = C.spawnFoe(type, c[0], c[1], { from: "ctrap" });
    if (!f) break;
    f.disguised = false; /* шкафник уже выдал себя */
    f.state = "hunt"; f.lastKnown = { x: G().x, y: G().y };
    out.push(f);
  }
  return out;
}
function rubberHands() {
  var g = G(), a = g.armor ? g.armor.base : "";
  return (g.inv && (g.inv.rubber || 0) > 0) || /insulated|exo|bastion/.test(a);
}
function masked() { var g = G(); return g.st.antitox > 0 || (gm().armorSpecial && gm().armorSpecial("antitox")); }
function spring(o, s, cont) {
  var d = K[s.k], fx = d.fx, g = G(), C = cb(), msg = [];
  s.st = "sprung";
  ev("ctrap", 1);
  /* резина на руках: игла не колет, ток не бьёт, кислота не жжёт */
  if (d.glove && rubberHands()) {
    A("play", s.k === "shock" ? "w_shock_crack" : "deflect");
    sayq(cap1(d.n) + " сработала, но прорезиненная ткань на руках выдержала.");
    if (cont) cont();
    return;
  }
  urgent(tx(s, o, "hit"));
  var x = o.x, y = o.y;
  if (fx.noise && C) { C.noise(fx.noise); C.noiseLure(g.x, g.y); sndAt("can_drop", x, y, { gain: 1 }); }
  /* урон ловушки — по режиму: в лёгком слабее, в сложных сильнее */
  var tk = Math.sqrt(dk().dmg || 1);
  if (fx.pd && C) { C.hurtPlayer(Math.max(1, Math.round(g.hpMax * fx.pd * tk)), fx.adt || "phys", null); if (g.dead) return; }
  if (fx.poison && !(g.st.antitox > 0)) { if (!g.st.poison) A("play", "poisoned"); g.st.poison = Math.max(g.st.poison || 0, fx.poison + Math.floor(g.L / 3)); A("play", "inject"); }
  if (fx.bleed) g.st.bleed = Math.max(g.st.bleed || 0, fx.bleed + Math.floor(g.L / 10));
  if (fx.hold) g.st.trapHeld = Math.max(g.st.trapHeld || 0, fx.hold);
  if (fx.slow) g.st.slow = Math.max(g.st.slow || 0, fx.slow);
  if (fx.drain) { var w = gm().curWeapon ? gm().curWeapon() : null; if (w && w.cap && w.ammo !== "none" && w.charge > 0) { w.charge = Math.floor(w.charge * (1 - fx.drain)); msg.push("Батарея оружия подсела: " + w.charge + "."); } }
  if (fx.emp) {
    g.en = 0; if (g.st.shield) g.st.shield = 0;
    var w2 = gm().curWeapon ? gm().curWeapon() : null; if (w2 && w2.cap && w2.ammo !== "none") w2.charge = Math.floor((w2.charge || 0) / 2);
    A("play", "emp_blast");
  }
  if ((fx.tox || fx.neuro) && gm().bodyApply) {
    if (d.mask && masked()) msg.push("Фильтр не пропустил отраву.");
    else gm().bodyApply({ tox: fx.tox || 0, neuro: fx.neuro || 0 }, msg);
  }
  if (fx.rad && gm().bodyApply) gm().bodyApply({ rad: g.st.radBlock > 0 ? Math.round(fx.rad / 2) : fx.rad }, msg);
  if (fx.armor && g.armor && LAB.repair && LAB.repair.corrode) msg.push(LAB.repair.corrode(fx.armor));
  if (fx.gas) {
    sndAt("ev_steam", x, y, { gain: 1 });
    if (LAB.traps && LAB.traps._zones) LAB.traps._zones().push({ k: "gas", x: x, y: y, r: 1, t: 16, d: 6, own: 0 });
  }
  if (fx.oko) {
    var net = C && C.netUp ? C.netUp() : true;
    if (net && LAB.oko) { A("play", "oko_chime"); LAB.oko.event("robot", { x: g.x, y: g.y }); if (LAB.oko.react) LAB.oko.react("oko_trap"); }
    else msg.push("Датчик пискнул впустую: связи с ОКО здесь нет.");
  }
  if (fx.spawn) {
    var nn = fx.n[0] + Math.floor(Math.random() * (fx.n[1] - fx.n[0] + 1));
    if ((dk().count || 1) < 1) nn = Math.max(1, nn - 1);
    var sp = spawnNear(o, fx.spawn, nn);
    sndAt(fx.spawn === "rat" ? "rat_alert" : "roach_alert", x, y, { gain: 1 });
    if (!sp.length) msg.push("Но выбраться им некуда.");
  }
  if (fx.mimic) { spawnNear(o, fx.mimic, 1); sndAt("lizard_alert", x, y, { gain: 1 }); }
  if (fx.parasite) { g.st.parasite = Math.max(g.st.parasite || 0, fx.parasite); A("play", "hit_flesh"); }
  if (fx.psi) { g.st.psiMark = Math.max(g.st.psiMark || 0, fx.psi); sndAt("ev_whisper", x, y, { gain: 1 }); }
  if (fx.grenade) { grenades.push({ x: x, y: y, t: 4, key: CUR().key }); sndAt("grenade_land", x, y, { gain: 1 }); }
  if (msg.length) sayq(msg.join(" "));
  UIx("refresh");
  /* после ловушки хранилище открыто; шкафник и граната — сперва разберитесь с ними */
  if (cont && !g.dead && !fx.mimic && !fx.grenade && !fx.spawn) cont();
  else if (fx.spawn || fx.mimic || fx.grenade) sayq("Добыча никуда не денется: " + nameIn(o).toLowerCase() + " можно обыскать и потом.");
}

/* ════════ ПЕРЕД ТЕМ, КАК ОТКРЫТЬ ════════
   Вызов из всех мест, где открывают хранилище (game.openContainer,
   обыск вещей обстановки, карманы тела). cont — открыть по-настоящему.
   true — ловушка перехватила действие (меню или сработала). */
function guard(o, cont) {
  var s = trapOf(o);
  if (!armed(s)) return false;
  var d = K[s.k];
  if (s.st === "known") { menu(o, s, cont); return true; }
  /* не заметили — в последний миг ещё можно отдёрнуть руку */
  var g = G(), reflex = Math.max(0.05, Math.min(0.5, 0.12 + (LAB.heroStat("agi") - 10) * 0.012 + (sapper() ? 0.12 : 0) + (dk().tsee || 0) * 0.5));
  if (Math.random() < reflex) {
    s.st = "known";
    A("play", "swing_miss");
    LAB.say("В последний миг вы отдёрнули руку: " + tx(s, o, "hint"), { prio: "urgent" });
    menu(o, s, cont);
    return true;
  }
  spring(o, s, cont);
  return true;
}
function menu(o, s, cont) {
  var d = K[s.k], pct = Math.round(disarmChance(s) * 100);
  var items = [];
  /* (3.5) окно ловушки могло остаться под запиской из хранилища: ловушки уже нет —
     пункт не даёт ни второго опыта, ни второго взрыва */
  var gone = function () { if (armed(s)) return false; say("Ловушки здесь уже нет."); return true; };
  items.push({ label: (d.noDisarm ? d.kill : "Обезвредить: " + d.n) + " (удача — " + pct + " " + gm().plural(pct, "процент", "процента", "процентов") + ")", fn: function () { if (!gone()) disarm(o, s, cont); } });
  items.push({ label: d.noDisarm ? "Открыть всё равно" : "Открыть, не обезвреживая", fn: function () { if (!gone()) spring(o, s, cont); } });
  items.push({ label: "Осмотреть ловушку", keep: true, fn: function () { say(tx(s, o, "hint") + (d.glove ? " Прорезиненная ткань на руках убережёт от неё." : d.mask ? " Респиратор или противогаз убережёт от неё." : "")); } });
  items.push({ label: "Отойти", fn: function () { say("Вы отходите от хранилища."); } });
  UIx("menu", nameIn(o) + ": ловушка — " + d.n, items);
}

/* ════════ ВО ВРЕМЕНИ ════════
   Такт мира (полсекунды): граната на растяжке, клещ, метка улья,
   признаки ловушек вплотную. */
function tick() {
  var g = G(), C = cb();
  if (!g || g.dead || !CUR()) return;
  nearTick();
  for (var i = grenades.length - 1; i >= 0; i--) {
    var gr = grenades[i];
    if (gr.key !== CUR().key) { grenades.splice(i, 1); continue; }
    if (--gr.t > 0) { sndAt("turret_lock", gr.x, gr.y, { gain: 0.9 }); continue; }
    grenades.splice(i, 1);
    A("explosion", gr.x, gr.y, "frag"); /* (2.6) граната на растяжке — осколочная */
    if (C) {
      var kk = 1 + 0.165 * (LAB.foeLevel(g.L, g.F) - 1);
      C.foes().forEach(function (f) { if (!f.dead && !f.ally && cheb(f.x, f.y, gr.x, gr.y) <= 1) C.damageFoe(f, Math.round(45 * kk), "kinetic", { noarmor: true, quiet: true, by: "trap" }); }); /* (3.7) растяжка — не рука героя (премия «без крови») */
      C.noise(12);
      if (cheb(g.x, g.y, gr.x, gr.y) <= 1) { C.hurtPlayer(Math.max(1, Math.round(g.hpMax * 0.35 * Math.sqrt(dk().dmg || 1))), "phys", null, { quiet: true }); if (g.dead) return; sayq("Взрыв накрыл вас осколками."); }
      else sayq("Граната рванула за спиной — вы успели отойти.");
    }
  }
  var st = g.st;
  if (st.parasite > 0) {
    st.parasite--;
    if (st.parasite % 4 === 0) {
      g.hp -= 1 + Math.floor(g.L / 8);
      if (g.body) g.body.food = Math.max(0, (g.body.food || 0) - 0.5);
      if (st.parasite % 24 === 0) { A("play", "hit_flesh"); sayq("Клещ пьёт кровь: здоровье " + Math.max(0, g.hp) + ". Аптечка, бинт или антидот снимут его."); }
      if (g.hp <= 0) { g.hp = 0; gm().die(); return; }
    }
    if (!st.parasite) sayq("Клещ насосался и отвалился.");
  }
  if (st.psiMark > 0) {
    st.psiMark--;
    if (st.psiMark % 4 === 0 && C) C.foes().forEach(function (f) {
      if (f.dead || f.ally || f.kind !== "bio" || (f.mind || 0) < 2 || cheb(f.x, f.y, g.x, g.y) > 30) return;
      if (f.state === "idle") f.state = "alert";
      f.lastKnown = { x: g.x, y: g.y }; f.lost = 0;
    });
    if (!st.psiMark) sayq("Запах метки улья выветрился: разумные твари больше не чуют вас по нему.");
  }
}
/* Аптечка, бинт, антидот снимают клеща (game.js, применение вещей). */
function cure(id) {
  var g = G();
  if (!(g.st.parasite > 0) || !/^(medkit_s|medkit_l|bandage|antidote|coagulant)$/.test(id)) return "";
  g.st.parasite = 0;
  return "Клеща сняли: ранка больше не кровит.";
}
/* Новый этаж — заново слушать признаки. (3.7, нелогичность) И помещение, куда уже после кабинетов
   встало электрическое (стенд испытаний, автомат — world.js), — не «обесточено» (annex.js, unlit):
   вызов при входе на этаж, повторный ничего не меняет. */
function enterFloor() {
  rolled = {}; exRolled = {}; lastCell = -1; grenades = [];
  var cur = CUR();
  if (cur && cur.fl && LAB.annex && LAB.annex.unlit) { try { LAB.annex.unlit(cur.fl, G().L); } catch (e) { console.warn(e); } }
}

LAB.stash = {
  K: K, ids: ORDER, acc: ACC, whereOf: whereOf, chanceAt: chanceAt, trapOf: trapOf, guard: guard, examineLine: examineLine, knownTrap: knownTrap,
  scanText: scanText, tick: tick, cure: cure, enterFloor: enterFloor, disarmChance: disarmChance, spring: spring, disarm: disarm,
  status: function () { var g = G(), out = []; if (g.st.parasite > 0) out.push("на руке клещ-кровосос"); if (g.st.psiMark > 0) out.push("метка улья"); return out; },
  _grenades: function () { return grenades; }
};
})();
