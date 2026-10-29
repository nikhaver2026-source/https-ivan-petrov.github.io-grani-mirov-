/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — работа руками у химического стола (3.6,
   просьба автора: «чтобы игрок мог смешивать, взаимодействовать с
   пробирками, реактивами, смешивать кислоты, вещества, жидкости»).
   ПОСУДА. На столе — штатив с четырьмя пробирками, колба на спиртовке и
   химический стакан, у каждой своя ёмкость. Содержимое и температура
   хранятся в записи этажа: опыт можно бросить и вернуться к нему.
   ДЕЙСТВИЯ. Добавить вещество из рюкзака (сырьё, реактивы шкафов, биогель,
   стружку), налить воды, нагреть, охладить, перемешать, капнуть
   индикатор, понюхать, отфильтровать, выпарить, перелить, вылить, разлить
   по склянкам. Каждое действие звучит и описывается: шипение, пена,
   осадок, цвет индикатора, тепло, пары.
   РЕАКЦИИ — как в жизни, в общих чертах: кислота гасит щёлочь (соль и
   тепло), сода с кислотой пенится, стружка в кислоте даёт водород (у огня
   он хлопает), ляпис ловит соли белым осадком, перекись пенится на крови и
   на катализаторе, хлорка с кислотой или с нашатырём даёт ядовитый газ,
   фосфор без воды вспыхивает, горючее не греют, растворитель вспыхивает
   над спиртовкой, если нет вытяжки, белок от кипения сворачивается, вода в
   кислоту — брызги. Вытяжка (стол второй ступени и выше) утягивает пары.
   СОСТАВЫ. Те же рецептуры, что в синтезе, но руками: нужное сырьё в посуде
   (воды — сколько угодно, кроме пиротехники) и правила направления:
   фармакология — тёплое, не кипятить; токсикология — не кипятить;
   энергохимия — охладить; пиротехника — сухо и без огня; биотехнология —
   тёплое, как тело. Перемешать — и разлить. Без единой аварии в этой
   посуде состав выходит на сорт чище. Добавки — тоже руками:
   стабилизатор, активатор, сорбент, катализатор. Неизвестные рецептуры
   открываются опытом: журнал опытов хранит догадки «Эхо», а смесь «на
   пути» к новому составу «Эхо» узнаёт.
   ЕЩЁ: перекристаллизация солей (растворить, отфильтровать, выпарить —
   соли на сорт чище), тайнопись документов над парами йода, проявка
   фотоплёнок, анализ тканей тварей — отчёты, которые ценят выжившие.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function C() { return LAB.chem; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function h32(s) { return LAB.hash32(String(s)) >>> 0; }
function cap1(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }
function spend(m) { if (m > 0 && gm().advanceTime) gm().advanceTime(m); }
function turn() { if (LAB.combat && LAB.combat.spendTurns) LAB.combat.spendTurns(1, ""); }
function hunted() { return !!(LAB.combat && LAB.combat.hunted && LAB.combat.hunted()); }
function ev(name, n) { if (LAB.ach && LAB.ach.ev) LAB.ach.ev(name, n == null ? 1 : n); }
function era() { return LAB.agen && LAB.agen.eraOf ? LAB.agen.eraOf(G().L) : "K"; }
function rec() { var c = C().ch(); if (!c.rx) c.rx = {}; if (!c.hand) c.hand = {}; if (!c.tis) c.tis = {}; return c; }
function refresh() { UIx("refresh"); }

/* ════════ ВЕЩЕСТВА ════════
   fam — семейство сырья (chem.js), item — вещь рюкзака, fb — из крана;
   ac / bs — кислотность и щёлочность (индикатор), smell — запах. */
var SUB = {
  water:  { n: "вода", a: "воду", fb: 1 },
  acid:   { n: "кислота", a: "кислоту", fam: "c_acidc", ac: 2, smell: "резкий, кислый — щиплет в носу" },
  sacid:  { n: "кислотный секрет", a: "кислотный секрет", fam: "c_acid", ac: 2, smell: "кислый, с гнильцой" },
  base:   { n: "щёлочь", a: "щёлочь", fam: "c_alkali", bs: 2 },
  soda:   { n: "сода", a: "соду", fam: "c_soda", bs: 1 },
  amm:    { n: "нашатырь", a: "нашатырь", fam: "c_ammonia", bs: 1, smell: "нашатырный — бьёт в нос" },
  bleach: { n: "хлорка", a: "хлорку", fam: "c_bleach", bs: 0.5, smell: "хлорный, как в бассейне" },
  perox:  { n: "перекись", a: "перекись", fam: "c_perox", smell: "почти ничем, свежестью" },
  salt:   { n: "соли", a: "соли", fam: "c_salt" },
  silver: { n: "ляпис", a: "ляпис", fam: "c_silver" },
  iod:    { n: "йод", a: "йод", fam: "c_iodine", smell: "аптечный, йодный" },
  solv:   { n: "растворитель", a: "растворитель", fam: "c_solvent", smell: "сладковатый, спиртовой" },
  oil:    { n: "масло", a: "масло", fam: "c_oil", smell: "машинный, масляный" },
  elec:   { n: "электролит", a: "электролит", fam: "c_electrolyte", ac: 1, smell: "кисловатый, как у батареек" },
  cool:   { n: "хладагент", a: "хладагент", fam: "c_coolant" },
  fuel:   { n: "топливный гель", a: "топливный гель", fam: "c_fuel", smell: "бензиновый" },
  phos:   { n: "фосфор", a: "фосфор", fam: "c_phosphor", smell: "чесночный" },
  blood:  { n: "гемолимфа", a: "гемолимфу", fam: "c_blood", smell: "железистый, кровяной" },
  gland:  { n: "железа", a: "железу", fam: "c_gland", smell: "мускусный, звериный" },
  venom:  { n: "яд", a: "яд", fam: "c_venom", ac: 0.5, smell: "горький, звериный" },
  chitin: { n: "хитин", a: "хитин", fam: "c_chitin" },
  spores: { n: "споры", a: "споры", fam: "c_spores", smell: "грибной, как в сыром подвале" },
  nerve:  { n: "нервный узел", a: "нервный узел", fam: "c_nerve" },
  enzyme: { n: "ферменты", a: "ферменты", fam: "c_enzyme", smell: "кисловатый, дрожжевой" },
  cat:    { n: "катализатор", a: "катализатор", fam: "c_catalyst" },
  ecto:   { n: "взвесь", a: "взвесь", fam: "c_ecto" },
  cond:   { n: "конденсат мутагена", a: "конденсат мутагена", fam: "c_cond", smell: "приторно-сладкий — это мутаген" },
  stab:   { n: "стабилизатор", a: "стабилизатор", fam: "c_stab" },
  activ:  { n: "активатор", a: "активатор", fam: "c_activ" },
  gel:    { n: "биогель", a: "биогель", item: "gel" },
  metal:  { n: "стальная стружка", a: "стальную стружку", item: "scrap" },
  reag:   { n: "реагент", a: "реагент", item: "reagent" },
  sorb:   { n: "сорбент", a: "сорбент", item: "sorbent" }
};
var ORDER = Object.keys(SUB);
var FAM2SUB = {}, ITEM2SUB = {};
ORDER.forEach(function (k) { if (SUB[k].fam) FAM2SUB[SUB[k].fam] = k; if (SUB[k].item) ITEM2SUB[SUB[k].item] = k; });
/* сколько вещества в рюкзаке */
function haveSub(sid) {
  var d = SUB[sid], g = G();
  if (d.fb) return 99;
  if (d.item) return g.inv[d.item] || 0;
  if (!C().FAM[d.fam]) return 0;
  return C().units(d.fam).reduce(function (a, u) { return a + u.n; }, 0);
}
/* взять порцию: сырьё — младшего сорта (или лучшего — по настройке синтеза); у реактивов без сортов сорта нет */
function takeSub(sid) {
  var d = SUB[sid], g = G();
  if (d.fb) return { g: 0 };
  if (d.item) { if (!(g.inv[d.item] > 0)) return null; g.inv[d.item]--; if (!g.inv[d.item]) delete g.inv[d.item]; return { g: 0 }; }
  var us = C().units(d.fam);
  if (!us.length) return null;
  var best = !!C().opt().best;
  us.sort(function (a, b) { var ea = a.g + (a.sat ? 0.5 : 0), eb = b.g + (b.sat ? 0.5 : 0); return best ? eb - ea : ea - eb; });
  var u = us[0];
  g.inv[u.id]--; if (!g.inv[u.id]) delete g.inv[u.id];
  return { g: C().FAM[d.fam].one ? 0 : u.g, sat: !!u.sat };
}

/* ════════ ПОСУДА ════════ */
var VT = { tube: { n: "пробирка", cap: 4, heat: "над спиртовкой" }, flask: { n: "колба", N: "Колба", cap: 6, heat: "на спиртовке" }, beaker: { n: "химический стакан", N: "Химический стакан", cap: 10, heat: "на плитке" } };
var SET = ["tube", "tube", "tube", "tube", "flask", "beaker"];
var T_N = ["холодная", "комнатной температуры", "тёплая", "горячая, кипит"];
function newV(k) { return { k: k, m: {}, t: 1, mx: 1, g: 3, gn: 0, sat: 0, st: 0, cl: 1, h2: 0, ppt: 0, fil: 0, seen: {} }; }
var cur = null; /* стол, у которого стоите: { o, key } */
function benchOf(o) {
  var s = C().station(o);
  if (!s.bench || !s.bench.v || s.bench.v.length !== SET.length) s.bench = { v: SET.map(newV) };
  return s.bench;
}
function vOf(o, i) { return benchOf(o).v[i]; }
function total(v) { var n = v.ppt || 0; for (var k in v.m) n += v.m[k]; return n; }
function vName(v, i) { return v.k === "tube" ? "Пробирка " + (i + 1) : VT[v.k].N; }
function contents(v) {
  var parts = [];
  ORDER.forEach(function (sid) { if (v.m[sid] > 0) parts.push(SUB[sid].n + " " + v.m[sid]); });
  if (v.ppt > 0) parts.push("осадок " + v.ppt);
  return parts.join(", ");
}
function vLine(v, i) { var c = contents(v); return vName(v, i) + ": " + (c ? c + "; " + T_N[v.t] + (v.st ? ", перемешано" : "") : "пусто") + "."; }
function clearV(v) { var k = v.k; for (var key in v) delete v[key]; var n = newV(k); for (var key2 in n) v[key2] = n[key2]; }
function hood() { var s = cur ? C().station(cur.o) : null; return !!(s && s.tier >= 2); }
function busy(o) { var n = benchOf(o).v.filter(function (v) { return total(v) > 0; }).length; return n ? n + " " + pl(n, "сосуд", "сосуда", "сосудов") : ""; }

/* ════════ ОПАСНОСТИ ════════
   splash — брызги кислоты (костюм химзащиты держит), gas — ядовитые пары
   (вытяжка, антитоксин, фильтр), hp — огонь и хлопки, mut — мутаген,
   noise — слышно на этаже, oko — ОКО замечает. Опытный химик (седьмая
   ступень) обжигается и травится вдвое меньше. */
function hazard(h) {
  var g = G(), out = [], pro = C().level() >= 7 ? 0.5 : 1;
  if (h.splash) {
    var ac = C().armorChem(), d = ac >= 0.4 ? 0 : Math.round(h.splash * (1 - ac) * pro);
    if (d) { g.hp = Math.max(1, g.hp - d); A("play", "hurt_chem"); out.push("Ожог: здоровье минус " + d + "."); } else out.push("Брызги приняла химзащита.");
  }
  if (h.gas) {
    var k = g.st.antitox > 0 ? 0 : (hood() ? 0.3 : 1) * (gm().armorSpecial && gm().armorSpecial("antitox") ? 0.5 : 1) * pro, tx = Math.round(h.gas * k);
    if (tx > 0) { if (gm().bodyApply) gm().bodyApply({ tox: tx }, []); A("play", "cough"); out.push("Токсины плюс " + tx + "."); }
    else out.push(hood() ? "Вытяжка утянула пары." : "Защита держит.");
  }
  if (h.neuro && gm().bodyApply) gm().bodyApply({ neuro: h.neuro }, []);
  if (h.hp) { var dh = Math.max(1, Math.round(h.hp * pro)); g.hp = Math.max(1, g.hp - dh); A("play", "hurt_therm"); out.push("Здоровье минус " + dh + "."); }
  if (h.mut) { var mk = C().fogK(); if (mk > 0) { C().addMut(h.mut * mk, "пары"); out.push("Мутация плюс " + Math.max(1, Math.round(h.mut * mk)) + "."); } }
  if (h.noise && LAB.combat && LAB.combat.noise) LAB.combat.noise(h.noise);
  if (h.oko && LAB.oko && LAB.oko.heat) LAB.oko.heat(4);
  return out.join(" ");
}

/* ════════ РЕАКЦИИ ════════
   on — на какое действие (add, water, pour, heat, stir; any — на любое,
   кроме проб); rep — повторяется, пока есть что; once — один раз на
   посуду. Первая встреча с реакцией — опыт направления и запись в журнал. */
function has(v, sid, n) { return (v.m[sid] || 0) >= (n || 1); }
function eat(v, sid, n) { v.m[sid] = Math.max(0, (v.m[sid] || 0) - (n == null ? 1 : n)); if (!v.m[sid]) delete v.m[sid]; }
function put(v, sid, n) { v.m[sid] = (v.m[sid] || 0) + (n == null ? 1 : n); }
function acidIn(v) { return has(v, "acid") ? "acid" : has(v, "sacid") ? "sacid" : null; }
function warm(v, d) { v.t = Math.max(0, Math.min(3, v.t + d)); v.mx = Math.max(v.mx, v.t); }
function spill(v, n) { var lost = 0; ORDER.forEach(function (k) { while (lost < n && k !== "cat" && v.m[k] > 0) { eat(v, k); lost++; } }); return lost; }
var RX = [
  { id: "splash", br: "tox", on: "water", d: "Вода в кислоту — брызги: сначала вода, потом кислота",
    test: function (v, c) { return !!acidIn(v) && !(c.before.water > 0); },
    run: function (v) { warm(v, 1); return { t: "Вода плеснула в кислоту — и кислота плюнула в ответ горячими брызгами! Правило лаборанта: сначала вода, потом кислота, тонкой струйкой.", snd: "acid_sizzle", haz: { splash: 6 } }; } },
  { id: "dilute", br: "tox", on: "add", once: 1, d: "Кислота в воду тонкой струйкой — тепло, и так правильно",
    test: function (v, c) { return (c.sub === "acid" || c.sub === "sacid") && c.before.water > 0; },
    run: function (v) { if (v.t < 2) warm(v, 1); return { t: "Кислота тонкой струйкой уходит в воду, стекло теплеет. Так и надо.", snd: "ev_glass" }; } },
  { id: "chlorine", br: "tox", on: "any", d: "Хлорка с кислотой — ядовитый хлор",
    test: function (v) { return has(v, "bleach") && (!!acidIn(v) || has(v, "elec")); },
    run: function () { return { t: "Над стеклом поднимается зеленоватый удушливый дым — хлор! Хлорку с кислотой не смешивают никогда.", snd: "hurt_chem", haz: { gas: 14 }, ruin: 1 }; } },
  { id: "chloramine", br: "tox", on: "any", d: "Хлорка с нашатырём — удушливые пары",
    test: function (v) { return has(v, "bleach") && has(v, "amm"); },
    run: function () { return { t: "Резкие удушливые пары: хлорка с нашатырём. Так травятся при уборке. Воздуха — и больше никогда.", snd: "hurt_chem", haz: { gas: 12, neuro: 5 }, ruin: 1 }; } },
  { id: "neutral", br: "tox", on: "any", rep: 1, d: "Кислота со щёлочью — соль, вода и тепло",
    test: function (v) { return !!acidIn(v) && has(v, "base"); },
    run: function (v) { eat(v, acidIn(v)); eat(v, "base"); put(v, "salt"); put(v, "water"); warm(v, 1); return { t: "Шипение и жар: кислота гасит щёлочь, на дне — соль.", snd: "ev_bubbles" }; } },
  { id: "fizz", br: "tox", on: "any", rep: 1, d: "Сода с кислотой — пена, углекислый газ и соль",
    test: function (v) { return (!!acidIn(v) || has(v, "elec")) && has(v, "soda"); },
    run: function (v) { eat(v, acidIn(v) || "elec"); eat(v, "soda"); put(v, "salt"); put(v, "water"); return { t: "Бурное шипение и пена: сода гасит кислоту. Это углекислый газ — он безвреден.", snd: "ev_bubbles" }; } },
  { id: "ammsalt", br: "tox", on: "any", rep: 1, d: "Нашатырь с кислотой — белый дымок и соль",
    test: function (v) { return !!acidIn(v) && has(v, "amm"); },
    run: function (v) { eat(v, acidIn(v)); eat(v, "amm"); put(v, "salt"); return { t: "Над горлышком — белый дымок: нашатырь с кислотой дают соль.", snd: "ev_steam" }; } },
  { id: "hydrogen", br: "energy", on: "any", rep: 1, d: "Стружка в кислоте — водород; у огня он хлопает",
    test: function (v) { return !!acidIn(v) && has(v, "metal"); },
    run: function (v) { eat(v, acidIn(v)); eat(v, "metal"); put(v, "salt"); v.h2 = 3; return { t: "Стружка шипит и тает, со дна бегут пузырьки — это водород. Он горит: огонь рядом — опасно.", snd: "ev_bubbles" }; } },
  { id: "pop", br: "energy", on: "heat", d: "Водород у спиртовки — хлопок",
    test: function (v) { return v.h2 > 0; },
    run: function (v) { v.h2 = 0; return { t: "Хлопок! Водород над горлышком вспыхнул от спиртовки. Брови целы, но этаж это слышал.", snd: "explosion_small", haz: { hp: 4, noise: 7 } }; } },
  { id: "foam", br: "pharm", on: "any", d: "Перекись на катализаторе — бурная пена",
    test: function (v) { return has(v, "perox") && has(v, "cat"); },
    run: function (v) { eat(v, "perox", v.m.perox); var lost = spill(v, 2); return { t: "Стекло вскипает тёплой белой пеной и лезет через край: перекись распадается на катализаторе. Бурно, но безвредно." + (lost ? " Часть смеси выплеснулась." : ""), snd: "ev_bubbles" }; } },
  { id: "bloodfoam", br: "pharm", on: "any", d: "Перекись на крови пенится — проба на кровь",
    test: function (v) { return has(v, "perox") && has(v, "blood"); },
    run: function (v) { eat(v, "perox"); return { t: "Гемолимфа вспенивается розовым: перекись распадается на крови. Так проверяют, кровь это или нет.", snd: "ev_bubbles" }; } },
  { id: "silvertest", br: "energy", on: "any", rep: 1, d: "Ляпис с солями в воде — белый осадок: проба на соли",
    test: function (v) { return has(v, "silver") && has(v, "salt") && has(v, "water"); },
    run: function (v) { eat(v, "silver"); eat(v, "salt"); v.ppt = (v.ppt || 0) + 1; return { t: "В прозрачной воде — белые творожистые хлопья: ляпис ловит соли. Так проверяют, есть ли соль в воде.", snd: "ev_glass" }; } },
  { id: "phosair", br: "pyro", on: "add", d: "Фосфор на воздухе вспыхивает — его кладут только под воду или в горючее",
    test: function (v, c) { var b = c.before; return c.sub === "phos" && !(b.water > 0 || b.fuel > 0 || b.oil > 0 || b.solv > 0); },
    run: function (v) { eat(v, "phos"); return { t: "Фосфор вспыхнул прямо в сухом стекле — белый дым и жар! Его кладут только под воду или в горючее: на воздухе он загорается.", snd: "hurt_therm", haz: { hp: 5, noise: 3 } }; } },
  { id: "pyroheat", br: "pyro", on: "heat", d: "Горючее и пиротехнику не греют — вспышка",
    test: function (v) { return v.t >= 2 && (has(v, "phos") || has(v, "fuel") || (has(v, "perox") && (has(v, "oil") || has(v, "solv")))); },
    run: function () { return { t: "Смесь вспыхивает со свистом — горючее не греют! Пиротехнику мешают холодной и сухой.", snd: "explosion_small", haz: { hp: 10, noise: 10, oko: 1 }, ruin: 1 }; } },
  { id: "solvflash", br: "energy", on: "heat", d: "Растворитель кипит над огнём без вытяжки — пары вспыхивают",
    test: function (v) { return v.t >= 3 && has(v, "solv") && !hood(); },
    run: function (v) { eat(v, "solv", v.m.solv); return { t: "Пары растворителя вспыхнули над спиртовкой синим языком! Растворитель на открытом огне не кипятят — только под вытяжкой.", snd: "hurt_therm", haz: { hp: 6, noise: 4 } }; } },
  { id: "solvhood", br: "energy", on: "heat", d: "Растворитель закипает и уходит в вытяжку",
    test: function (v) { return v.t >= 3 && has(v, "solv") && hood(); },
    run: function (v) { eat(v, "solv", v.m.solv); return { t: "Растворитель закипел и ушёл парами в вытяжку.", snd: "ev_steam" }; } },
  { id: "denature", br: "bio", on: "heat", d: "Живое сырьё от кипения сворачивается хлопьями",
    test: function (v) { return v.t >= 3 && (has(v, "blood") || has(v, "gland") || has(v, "nerve") || has(v, "enzyme")); },
    run: function (v) { var n = 0; ["blood", "gland", "nerve", "enzyme"].forEach(function (k) { n += v.m[k] || 0; delete v.m[k]; }); v.ppt = (v.ppt || 0) + n; return { t: "Белок свернулся хлопьями — перегрели. Живое сырьё не кипятят: держат тёплым, как тело.", snd: "ev_steam", spoil: 1 }; } },
  { id: "mutfume", br: "bio", on: "heat", d: "Конденсат мутагена при нагреве даёт сладкий пар",
    test: function (v) { return v.t >= 2 && has(v, "cond"); },
    run: function () { return { t: "Над конденсатом дрожит сладкий пар — мутаген.", snd: "ev_steam", haz: { mut: 2 } }; } },
  { id: "iodvap", br: "tox", on: "heat", once: 1, d: "Йод при нагреве даёт фиолетовые пары — на них проступает тайнопись",
    test: function (v) { return v.t >= 2 && has(v, "iod"); },
    run: function () { return { t: "Над стеклом поднимаются фиолетовые пары йода: на них проступает тайнопись.", snd: "ev_steam", haz: hood() ? null : { gas: 2 } }; } },
  { id: "chill", br: "energy", on: "add", once: 1, d: "Хладагент сразу холодит смесь",
    test: function (v, c) { return c.sub === "cool"; },
    run: function (v) { v.t = 0; return { t: "Хладагент обжигает стекло инеем: смесь сразу холодная.", snd: "ev_glass" }; } },
  { id: "venomneut", br: "tox", on: "stir", once: 1, d: "Щёлочь гасит яд — он светлеет",
    test: function (v) { return has(v, "venom") && (has(v, "base") || has(v, "soda")); },
    run: function () { return { t: "Яд мутнеет и светлеет: щёлочь его гасит." }; } },
  { id: "sporeswell", br: "bio", on: "add", once: 1, d: "Споры в воде набухают",
    test: function (v) { return has(v, "spores") && has(v, "water"); },
    run: function () { return { t: "Споры набухают и всплывают пушистой плёнкой." }; } },
  { id: "ecto", br: "bio", on: "stir", once: 1, d: "Взвесь светится и меняет цвет",
    test: function (v) { return has(v, "ecto"); },
    run: function () { return { t: "Взвесь светится и меняет цвет, пока на неё «смотрит» «Эхо»: то синяя, то янтарная." }; } },
  { id: "elecmetal", br: "energy", on: "add", once: 1, d: "Стружка в электролите искрит и темнеет",
    test: function (v) { return has(v, "elec") && has(v, "metal"); },
    run: function () { return { t: "На стружке в электролите бегут крошечные искорки, она темнеет." }; } },
  { id: "oilwater", br: "energy", on: "stir", once: 1, d: "Масло с водой не смешивается — без растворителя",
    test: function (v) { return has(v, "oil") && has(v, "water") && !has(v, "solv"); },
    run: function () { return { t: "Масло с водой не смешивается: как ни мешай, расходится слоями. Помог бы растворитель." }; } }
];
var RXBY = {};
RX.forEach(function (r) { RXBY[r.id] = r; });
function react(v, on, c) {
  var out = [], fired = {}, again = true, guard = 0;
  c = c || { before: {} };
  while (again && guard++ < 8) {
    again = false;
    for (var i = 0; i < RX.length; i++) {
      var rx = RX[i];
      if (fired[rx.id] || (rx.on !== "any" && rx.on !== on) || (rx.once && v.seen[rx.id])) continue;
      if (!rx.test(v, c)) continue;
      fired[rx.id] = 1; v.seen[rx.id] = 1;
      var r = rx.run(v, c) || {}, n = 1;
      if (rx.rep) while (n < 10 && rx.test(v, c)) { rx.run(v, c); n++; }
      if (r.snd) A("play", r.snd);
      out.push(r.t + (n > 1 ? " И так — " + n + " " + pl(n, "раз", "раза", "раз") + "." : ""));
      if (!rec().rx[rx.id]) { rec().rx[rx.id] = 1; C().gain(rx.br || "tox", 3); }
      if (r.haz) { v.cl = 0; var hz = hazard(r.haz); if (hz) out.push(hz); }
      if (r.spoil) v.cl = 0;
      if (r.ruin) { clearV(v); out.push("Всё в посуде испорчено — вы выливаете это в слив."); return out.join(" "); }
      again = true;
    }
  }
  return out.join(" ");
}

/* ════════ СОСТАВЫ: что получилось ════════ */
var ASM = { scrap: "корпус из металлолома", wire: "провод для запала", cap: "конденсатор" }; /* к склянке — не в посуду */
var MODS = { stab: "long", activ: "strong", sorb: "clean" };
var PROC = {
  pharm: { lo: 2, hi: 2, top: 2, d: "согреть до тёплого и не доводить до кипения" },
  tox: { lo: 0, hi: 2, top: 2, d: "перемешать и не кипятить" },
  energy: { lo: 0, hi: 0, top: 3, d: "перед тем как разлить — охладить" },
  pyro: { lo: 0, hi: 1, top: 1, dry: 1, d: "держать сухим и холодным: без воды и без огня" },
  bio: { lo: 2, hi: 2, top: 2, d: "держать тёплым, как тело" }
};
var OWN = { l_lockpaste: { lo: 0, hi: 1, top: 1, d: "мешать холодным: паста густеет без нагрева" }, l_reveal: { lo: 0, hi: 2, top: 2, d: "мешать без кипения" } };
/* (3.6) пиротехника на фосфоре: фосфор на воздухе вспыхивает, поэтому его кладут под воду
   или в горючее — и вода в таком составе не помеха (сухой нужна остальная пиротехника) */
["p_flash", "p_thermite", "p_napalm"].forEach(function (id) { OWN[id] = { lo: 0, hi: 1, top: 1, d: "держать холодным и без огня; фосфор — только под водой или в горючем" }; });
var WATER = { l_fogspray: [2, 4], l_antisept: [2, 3], l_smelling: [1, 2], l_devel: [1, 2], l_fixer: [1, 2] };
function needOf(rc) {
  var m = {}, asm = {};
  for (var k in rc.need) {
    if (ASM[k]) asm[k] = rc.need[k];
    else if (FAM2SUB[k]) m[FAM2SUB[k]] = rc.need[k];
    else if (ITEM2SUB[k]) m[ITEM2SUB[k]] = rc.need[k];
    else return null;
  }
  return { m: m, asm: asm };
}
function procOf(rc) { return OWN[rc.id] || PROC[rc.br]; }
/* разбор посуды: состав, отклонения, «на пути». (3.6) Один и тот же состав посуды бывает
   годен на две рецептуры (йодид калия и коррозионная колба — она ещё и в корпусе из
   металлолома; регенерирующая сыворотка и культура регенерации): hits — все, известные
   первыми, а что разлить, игрок выбирает при разливе (прежде всегда выходила первая). */
function analyze(v) {
  var kh = [], uh = [], near = null;
  C().RC.forEach(function (rc) {
    if (!C().outOk(rc)) return;
    var nd = needOf(rc); if (!nd) return;
    var ok = true, mods = [], cat = 0, k;
    for (k in nd.m) if ((v.m[k] || 0) !== nd.m[k]) ok = false;
    for (k in v.m) {
      if (nd.m[k] || k === "water") continue;
      if (MODS[k] && v.m[k] === 1) { mods.push(MODS[k]); continue; }
      if (k === "cat" && v.m[k] === 1) { cat = 1; continue; }
      ok = false;
    }
    if (ok) { (C().known(rc) ? kh : uh).push({ rc: rc, nd: nd, mods: mods, cat: cat }); return; }
    /* «на пути»: всё, что в посуде, — из этой рецептуры и не больше нужного, и веществ хотя бы два */
    var sub = true, kinds = 0;
    for (k in v.m) { if (k === "water") continue; if (!nd.m[k] || v.m[k] > nd.m[k]) { sub = false; break; } kinds++; }
    if (sub && kinds >= 2 && !near) near = rc;
  });
  var hits = kh.concat(uh);
  return { hit: hits[0] || null, hits: hits, near: near };
}
/* (3.6) ограничения синтеза — и для работы руками: сорт сырья и мутаген в обычных средствах */
var MING_N = { 2: "очищенного сорта", 3: "особой чистоты" };
function limitWhy(v, rc) {
  if (rc.minG && (v.gn ? v.g : 1) < rc.minG) return "сырьё нужно не ниже " + (MING_N[rc.minG] || "очищенного сорта") + ", а в посуде есть грубее";
  if (v.sat && !C().PROD[rc.out]) return "сырьё с мутагеном в обычные средства не идёт — сначала выведите мутаген из сырья";
  return "";
}
function whyNot(v, rc) { return procWhy(v, rc) || limitWhy(v, rc); }
function hitName(h) { return C().known(h.rc) ? "«" + low(nm(h.rc)) + "»" : "новое соединение (" + C().BR[h.rc.br].n + ")"; }
function procWhy(v, rc) {
  var pr = procOf(rc), w = v.m.water || 0, wr = WATER[rc.id];
  if (pr.dry && w > 0) return "в пиротехнике воды быть не должно — " + pr.d;
  if (wr && (w < wr[0] || w > wr[1])) return "воды нужно " + (wr[0] === wr[1] ? wr[0] : "от " + wr[0] + " до " + wr[1]) + ", а в посуде " + w;
  if (v.mx > pr.top) return "смесь перегрели — " + pr.d;
  if (v.t < pr.lo || v.t > pr.hi) return "смесь " + T_N[v.t] + ", а нужно " + pr.d;
  if (!v.st) return "смесь не перемешана";
  if (v.ppt > 0) return "в посуде осадок — отфильтруйте его";
  return "";
}
function nm(rc) { return C().outName(rc); }
/* что «Эхо» говорит о смеси — без подсказки неизвестного */
function judge(v) {
  if (!total(v)) return "Посуда пуста.";
  var a = analyze(v);
  if (a.hit) {
    var ready = a.hits.filter(function (h) { return !whyNot(v, h.rc); });
    if (ready.length > 1) return "Готово к разливу, и смесь годится не на одно: " + ready.map(hitName).join(" или ") + ". Что разлить — выберете при разливе.";
    var rc = (ready[0] || a.hit).rc, kn = C().known(rc), w = whyNot(v, rc);
    if (w) return kn ? "Это «" + nm(rc) + "», но " + w + "." : "Смесь ведёт себя необычно — похоже на новый состав (" + C().BR[rc.br].n + "), но " + w + ".";
    return kn ? "Готово к разливу: «" + low(nm(rc)) + "»." : "Смесь ведёт себя иначе, чем всё, что вы делали: новое соединение (" + C().BR[rc.br].n + "). Разлейте — «Эхо» запишет рецептуру.";
  }
  if (a.near) return C().known(a.near) ? "Похоже на начало «" + low(nm(a.near)) + "»: не хватает — " + lack(v, a.near) + "." : "Смесь ведёт себя необычно — похоже, вы на пути к новому составу (" + C().BR[a.near.br].n + "). Чего-то ещё не хватает.";
  if (saltOnly(v)) return "Раствор соли: отфильтруйте и выпарите — соли выйдут на сорт чище.";
  return "Такой смеси нет ни в одном журнале «Эхо»: разливать нечего.";
}
function lack(v, rc) { var nd = needOf(rc), out = []; for (var k in nd.m) { var d = nd.m[k] - (v.m[k] || 0); if (d > 0) out.push(SUB[k].n + " " + d); } return out.join(", "); }
function saltOnly(v) { var k = Object.keys(v.m); return has(v, "salt") && k.every(function (x) { return x === "salt" || x === "water"; }); }

/* ════════ ДЕЙСТВИЯ ════════ */
function guard() {
  if (hunted()) { say("За вами гонятся — колбы подождут."); return false; }
  return true;
}
function after(o, v, text, mins) { spend(mins == null ? 1 : mins); turn(); say(text); refresh(); }
function addSub(o, i, sid) {
  var v = vOf(o, i), d = SUB[sid];
  if (!guard()) return;
  if (total(v) + 1 > VT[v.k].cap) { A("play", "ui_error"); say(cap1(VT[v.k].n) + " полна: больше не поместится. Перелейте или разлейте."); return; }
  var before = JSON.parse(JSON.stringify(v.m)), got = takeSub(sid);
  if (!got) { A("play", "ui_error"); say(cap1(d.n) + ": в рюкзаке нет."); return; }
  put(v, sid);
  if (got.g > 0) { v.g = v.gn ? Math.min(v.g, got.g) : got.g; v.gn++; }
  if (got.sat) v.sat = 1;
  v.st = 0; v.fil = 0;
  A("play", sid === "water" ? "water_pour" : "ev_glass");
  var rx = react(v, sid === "water" ? "water" : "add", { before: before, sub: sid });
  after(o, v, "Вы добавляете " + d.a + (sid === "water" ? " из крана" : "") + ". " + (rx ? rx + " " : "") + vLine(v, i));
}
function heat(o, i) {
  var v = vOf(o, i);
  if (!guard()) return;
  if (!total(v)) { say("Греть пустое стекло незачем."); return; }
  if (v.t >= 3) { say("Уже кипит."); return; }
  warm(v, 1);
  A("play", v.t >= 3 ? "ev_bubbles" : "ev_steam");
  var rx = react(v, "heat", { before: v.m });
  after(o, v, "Вы греете " + VT[v.k].heat + ": смесь " + T_N[v.t] + ". " + rx, 2);
}
function cool(o, i) {
  var v = vOf(o, i);
  if (!guard()) return;
  if (!total(v)) { say("Остужать нечего."); return; }
  if (v.t <= 0) { say("Смесь и так холодная."); return; }
  v.t--;
  A("play", "ev_glass");
  after(o, v, "Вы ставите посуду в ледяную баню: смесь " + T_N[v.t] + ".", 2);
}
function stir(o, i) {
  var v = vOf(o, i);
  if (!guard()) return;
  if (!total(v)) { say("Мешать нечего."); return; }
  v.st = 1;
  A("play", "ev_glass");
  var rx = react(v, "stir", { before: v.m });
  after(o, v, "Вы мешаете стеклянной палочкой. " + (rx ? rx + " " : "") + judge(v), 1);
}
/* индикатор: цвет — по кислотности; тон пиканья — тоже (ниже — кислее) */
function phOf(v) { var a = 0, b = 0; for (var k in v.m) { var d = SUB[k]; if (d.ac) a += d.ac * v.m[k]; if (d.bs) b += d.bs * v.m[k]; } return Math.round(b - a); }
var PH_N = [[-99, "красный — сильная кислота"], [-2, "оранжевый — кислая среда"], [-1, "жёлтый — слабокислая"], [0, "зелёный — нейтрально"], [1, "голубой — слабощелочная"], [2, "синий — щелочная среда"], [3, "фиолетовый — сильная щёлочь"]];
function phWord(x) { var w = PH_N[0][1]; PH_N.forEach(function (p) { if (x >= p[0]) w = p[1]; }); return w; }
function indicator(o, i) {
  var v = vOf(o, i);
  if (!total(v)) { say("Капать индикатор некуда: посуда пуста."); return; }
  if (!has(v, "water") && !Object.keys(v.m).some(function (k) { return k === "acid" || k === "sacid" || k === "amm" || k === "elec" || k === "perox"; })) { say("Индикатор сухое не смочит: налейте воды."); return; }
  var x = phOf(v);
  A("play", "term_beep", { rate: Math.max(0.55, Math.min(1.8, 1 + 0.15 * x)) });
  if (!rec().ph) { rec().ph = 1; C().gain("tox", 2); }
  say("Капля индикатора: " + phWord(x) + ". Пиканье кислотомера — " + (x < 0 ? "низкое" : x > 0 ? "высокое" : "ровное, среднее") + ".");
}
function smell(o, i) {
  var v = vOf(o, i);
  if (!total(v)) { say("Пахнет чистым стеклом."); return; }
  var s = [], g = G();
  ORDER.forEach(function (k) { if (v.m[k] > 0 && SUB[k].smell) s.push(SUB[k].smell); });
  var tip = rec().sniff ? "" : "Вы машете ладонью от горлышка к себе — так нюхают в лаборатории, не наклоняясь. ";
  rec().sniff = 1;
  var hz = "";
  if (has(v, "cond") && C().fogK() > 0) { C().addMut(1, "запах"); hz = " Зря: это мутаген, мутация плюс один."; }
  if ((has(v, "amm") || has(v, "bleach")) && !(g.st.antitox > 0) && gm().bodyApply) { gm().bodyApply({ tox: 1 }, []); }
  say(tip + (s.length ? "Запах: " + s.join("; ") + "." : "Почти ничем не пахнет.") + hz);
}
function filter(o, i) {
  var v = vOf(o, i);
  if (!guard()) return;
  if (!total(v)) { say("Фильтровать нечего."); return; }
  v.fil = 1;
  var had = v.ppt || 0; v.ppt = 0;
  A("play", "water_pour");
  after(o, v, had ? "Фильтр задержал осадок: раствор прозрачный. " + vLine(v, i) : "Через фильтр всё проходит чисто: осадка нет.", 2);
}
/* выпарить: вода и летучее уходит; раствор соли после фильтра — кристаллы на сорт чище */
function evaporate(o, i) {
  var v = vOf(o, i), s = C().station(o);
  if (!guard()) return;
  if (!total(v)) { say("Выпаривать нечего."); return; }
  warm(v, 3 - v.t);
  var rx = react(v, "heat", { before: v.m });
  var out = [rx];
  if (total(v) && saltOnly(v)) {
    /* (3.6) чище — только после фильтра и не выше, чем позволяет стол; но и не грубее, чем было */
    var n = v.m.salt, g0 = v.gn ? v.g : 1, fil = !!v.fil, capS = C().stationCap(s), gr = fil && g0 < 3 && capS > g0 ? g0 + 1 : g0;
    C().give(C().matId("c_salt", gr, false), n);
    clearV(v);
    if (!rec().rx.recryst) { rec().rx.recryst = 1; C().gain("tox", 6); }
    A("play", "ev_glass");
    out.push("Вода ушла, на стенках — кристаллы: " + low(LAB.ITEMS[C().matId("c_salt", gr, false)].n) + ", " + n + " " + pl(n, "порция", "порции", "порций") + "." + (gr > g0 ? " Чище, чем были." : g0 >= 3 ? " Чище уже некуда." : !fil ? " Отфильтруй вы раствор — вышли бы чище." : " Чище на этом столе не выйдет: нужен стол ступенью выше."));
  } else if (total(v)) {
    ["water", "amm", "perox", "iod"].forEach(function (k) { delete v.m[k]; });
    v.st = 0;
    out.push(total(v) ? "Жидкость выкипела. Осталось: " + contents(v) + "." : "Всё выкипело досуха.");
  }
  after(o, v, out.filter(Boolean).join(" "), 5);
}
function pour(o, i, j) {
  var a = vOf(o, i), b = vOf(o, j);
  if (!guard()) return;
  if (!total(a)) { say("Переливать нечего."); return; }
  if (total(a) + total(b) > VT[b.k].cap) { A("play", "ui_error"); say("Не поместится: в " + VT[b.k].n + "у входит " + VT[b.k].cap + " " + pl(VT[b.k].cap, "порция", "порции", "порций") + "."); return; }
  var before = JSON.parse(JSON.stringify(b.m)), water = a.m.water || 0;
  for (var k in a.m) put(b, k, a.m[k]);
  b.ppt = (b.ppt || 0) + (a.ppt || 0);
  if (a.gn) { b.g = b.gn ? Math.min(b.g, a.g) : a.g; b.gn += a.gn; }
  b.sat = b.sat || a.sat; b.t = Math.max(b.t, a.t); b.mx = Math.max(b.mx, a.mx, b.t); b.cl = b.cl && a.cl ? 1 : 0; b.h2 = Math.max(b.h2, a.h2); b.st = 0; b.fil = 0;
  clearV(a);
  A("play", "water_pour");
  var rx = water > 0 ? react(b, "water", { before: before, sub: "water" }) : "";
  var rx2 = react(b, "add", { before: before, sub: null });
  after(o, b, "Вы переливаете в " + vName(b, j).toLowerCase().replace(/^химический стакан$/, "химический стакан") + ". " + [rx, rx2].filter(Boolean).join(" ") + " " + vLine(b, j));
}
function dump(o, i) {
  var v = vOf(o, i);
  if (!total(v)) { say("И так пусто."); return; }
  var acidic = phOf(v) < 0;
  clearV(v);
  A("play", "water_pour");
  after(o, v, "Вы выливаете всё в слив и споласкиваете стекло." + (acidic ? " Слив коротко шипит — кислота." : ""), 1);
}
/* разлить: распознанный состав — в склянки; годится на несколько — выбрать, что именно */
function bottle(o, i) {
  var v = vOf(o, i);
  if (!guard()) return;
  if (!total(v)) { say("Разливать нечего."); return; }
  var a = analyze(v);
  if (!a.hit) { A("play", "ui_error"); say(judge(v)); return; }
  var ready = a.hits.filter(function (h) { return !whyNot(v, h.rc); });
  if (ready.length > 1) {
    UIx("menu", "Что разлить", ready.map(function (h) {
      var asm = Object.keys(h.nd.asm).map(function (k) { return ASM[k] + (h.nd.asm[k] > 1 ? ", " + h.nd.asm[k] : ""); });
      return { label: cap1(hitName(h)) + (asm.length ? ": нужен ещё " + asm.join(" и ") : ""), fn: function () { bottleAs(o, i, h); } };
    }).concat([{ label: "Назад", fn: function () {} }]), { intro: "Состав в посуде годится не на одно." });
    return;
  }
  bottleAs(o, i, ready[0] || a.hit);
}
function bottleAs(o, i, hit) {
  var v = vOf(o, i), s = C().station(o), g = G();
  if (!guard()) return;
  var rc = hit.rc, kn = C().known(rc), w = whyNot(v, rc);
  if (w) { A("play", "ui_error"); say(kn ? "«" + nm(rc) + "»: " + w + "." : "Не выходит: " + w + "."); return; }
  if (C().brLv(rc.br) < rc.lv) { A("play", "ui_error"); say("Состав верный, но рука не та: нужна ступень " + rc.lv + " направления «" + C().BR[rc.br].n + "», у вас " + C().brLv(rc.br) + "."); return; }
  if (s.tier < rc.st && !(C().level() >= 5 && s.tier === rc.st - 1)) { A("play", "ui_error"); say("Для этого состава нужен стол ступени " + rc.st + ": " + C().ST_N[rc.st].n + "."); return; }
  if (s.dirty) { A("play", "ui_error"); say("Стол загрязнён — сначала отмойте его растворителем."); return; }
  for (var k in hit.nd.asm) if ((g.inv[k] || 0) < hit.nd.asm[k]) { A("play", "ui_error"); say("Чтобы разлить, нужен ещё " + ASM[k] + ": " + hit.nd.asm[k] + "."); return; }
  if (hit.mods.length > 1) { A("play", "ui_error"); say("Две добавки сразу мешают друг другу: оставьте одну."); return; }
  for (var k2 in hit.nd.asm) { g.inv[k2] -= hit.nd.asm[k2]; if (!g.inv[k2]) delete g.inv[k2]; }
  var P = C().PROD[rc.out], isP = !!P, gr = v.gn ? v.g : 1, mod = "";
  /* (проверка перед сборкой) сырьё с мутагеном: снимает мутаген только сорбент («без побочного
     действия»), другая добавка в такой смеси пропадает — состав выйдет «на мутагене» */
  var satMut = isP && v.sat && P.mut;
  if (isP && hit.mods.length && (P.mods || []).indexOf(hit.mods[0]) >= 0 && (!satMut || hit.mods[0] === "clean")) mod = hit.mods[0];
  if (isP && !mod && satMut) mod = "mut";
  var bonus = (v.cl ? 1 : 0) + (hit.cat ? 1 : 0), g0 = gr;
  gr = Math.max(1, Math.min(3, gr + bonus, C().stationCap(s), C().gradeCap(rc.br)));
  var id = isP ? C().prodId(rc.out, gr, mod) : rc.out, n = rc.qty || 1;
  if (!isP) n += gr - 1;
  var dbl = (rc.br === "energy" && C().rank("energy") >= 1 && /^ammo:|^c_fuelamp/.test(rc.out)) || (rc.br === "pyro" && C().rank("pyro") >= 1 && isP && P.kind === "throw");
  if (dbl) n *= 2;
  C().give(id, n);
  var disc = !kn;
  if (disc) { C().learn(rc.id, "Вы открыли её опытом у стола."); rec().hand[rc.id] = 1; ev("discover", 1); }
  C().gain(rc.br, 12 + 6 * rc.lv + 4 * (gr - 1) + (mod && mod !== "mut" ? 4 : 0) + (disc ? 20 : 0) + (v.cl ? 5 : 0));
  ev("craft", 1); ev("handmade", 1);
  var clean = v.cl;
  clearV(v);
  A("play", "ev_glass");
  if (LAB.oko && LAB.oko.react) LAB.oko.react("craft");
  var name = String(id).indexOf("ammo:") === 0 ? LAB.AMMO[String(id).slice(5)].n : LAB.ITEMS[id].n;
  after(o, v, "Вы разливаете по склянкам: " + low(name) + (n > 1 ? ", " + n + " " + pl(n, "порция", "порции", "порций") : "") + "." + (clean && gr > g0 ? " Ни одной ошибки — состав на сорт чище." : "") + " В рюкзаке: " + C().countOut(id) + ".", 2);
}

/* ════════ ТАЙНОПИСЬ ════════
   Документ с тайнописью «Эхо» отмечает при чтении (library.js). Проявить —
   кисточкой с проявителем где угодно или над парами йода у стола. */
function anyOf(base) { var g = G(); return Object.keys(g.inv).filter(function (k) { return g.inv[k] > 0 && (k === base || (C().PV[k] && C().PV[k].b === base)); })[0] || null; }
function hidden() { return LAB.library && LAB.library.hiddenDocs ? LAB.library.hiddenDocs() : []; }
function revealMenu(how, itemId) {
  var list = hidden();
  if (!list.length) { say("Документов с тайнописью у вас нет. Когда между строк найдётся что-то спрятанное, «Эхо» скажет."); return false; }
  var items = list.map(function (d) { return { label: "Проявить: «" + d.t + "»", fn: function () { doReveal(how, itemId, d.id); } }; });
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Тайнопись", items, { intro: how === "item" ? "Проявитель наносят кисточкой: склянки хватает на один документ." : "Над колбой с йодом на спиртовке: документ держат в фиолетовых парах. Нужен кристаллический йод — или проявитель тайнописи." });
  return false;
}
function doReveal(how, itemId, docId) {
  var g = G(), used = "";
  if (how === "item") {
    var it = itemId && g.inv[itemId] > 0 ? itemId : anyOf("c_reveal");
    if (!it) { say("Проявитель кончился."); return; }
    g.inv[it]--; if (!g.inv[it]) delete g.inv[it]; used = "item";
  } else {
    if (C().useOne("c_iodine")) used = "iod";
    else { var it2 = anyOf("c_reveal"); if (!it2) { A("play", "ui_error"); say("Нужен кристаллический йод — или проявитель тайнописи. Йод бывает в шкафах с реактивами и медпунктах."); return; } g.inv[it2]--; if (!g.inv[it2]) delete g.inv[it2]; used = "item"; }
    spend(3); turn();
  }
  var r = LAB.library.reveal(docId);
  if (!r) { say("Строки остались чистыми: тайнописи здесь нет."); return; }
  A("play", "ev_steam");
  C().gain("tox", 6); gm().gainXP(10); ev("reveal", 1);
  UIx("closeAll");
  UIx("note", "Тайнопись: «" + r.t + "»", (used === "iod" ? "В фиолетовых парах йода между строк проступают бурые буквы. " : "Кисточка с проявителем скользит по строкам — и между ними проступают бурые буквы. ") + r.x + (r.code ? " " + r.code : "") + " «Эхо»: проявленное — в архиве документов, вместе с самим документом.");
}

/* ════════ ФОТОПЛЁНКА ════════ */
function developFilm(o) {
  var g = G();
  if (!guard()) return;
  if (!(g.inv.film > 0)) { say("Плёнки нет: отснятые катушки попадаются в фотолабораториях, лабораториях и медблоках."); return; }
  var dv = anyOf("c_devel"), fx = anyOf("c_fixer");
  if (!dv || !fx) { A("play", "ui_error"); say("Нужны фотопроявитель и фиксаж" + (!dv && !fx ? "" : !dv ? " — нет проявителя" : " — нет фиксажа") + ". Их делают здесь же: синтез, энергохимия, или руками — ляпис со щёлочью и водой, соли с содой и водой; оба состава охладить перед тем, как разлить."); return; }
  /* (3.6) новых кадров этой глубины не осталось — плёнку, проявитель и фиксаж не тратить */
  if (LAB.library && LAB.library.filmLeft && !LAB.library.filmLeft()) { A("play", "ui_error"); say("«Эхо» сверяет катушку с архивом: все кадры этой глубины вы уже видели — проявлять здесь незачем, плёнку лучше поберечь."); return; }
  [["film"], [dv], [fx]].forEach(function (x) { g.inv[x[0]]--; if (!g.inv[x[0]]) delete g.inv[x[0]]; });
  spend(6); turn();
  var n = 2 + (h32("film:" + g.seed + ":" + (rec().films = (rec().films || 0) + 1)) % 2);
  var shots = LAB.library && LAB.library.develop ? LAB.library.develop(n) : [];
  A("play", "ev_bubbles");
  C().gain("energy", 6); gm().gainXP(8); ev("film_dev", 1);
  if (!shots.length) { say("Проявитель, стоп-ванна, фиксаж… Кадры засвечены: ничего не разобрать."); refresh(); return; }
  UIx("note", "Проявленная плёнка", "Проявитель, стоп-ванна, фиксаж — и на плёнке проступают кадры. «Эхо» описывает первый: " + shots[0].x + (shots.length > 1 ? " Ещё " + (shots.length - 1) + " " + pl(shots.length - 1, "снимок", "снимка", "снимков") + " — в архиве документов, раздел «Фотографии»." : " Снимок — в архиве документов, раздел «Фотографии»."));
}

/* ════════ АНАЛИЗ ТКАНИ ════════ */
var TIS_F = ["c_blood", "c_gland", "c_venom", "c_chitin", "c_spores", "c_nerve", "c_acid", "c_enzyme", "c_cond"];
var TIS = {
  c_blood: "Мазок гемолимфы: клетки крупные, с двумя ядрами, делятся прямо на стекле. Белки свёртывания в плазме похожи на человеческие — больше, чем хотелось бы.",
  c_gland: "Срез железы: протоки забиты гормоном, который гонит тварь в бой и глушит боль. Человек в панике вырабатывает похожий — только здесь его в десятки раз больше.",
  c_venom: "Яд — смесь белков, бьющих по нервам. Под щёлочью он светлеет и гаснет. Противоядие из него делают тем же путём, каким его гасят.",
  c_chitin: "Хитин в разрезе слоистый, как фанера: слои кладутся заново каждую неделю. Тварь растёт — и броня растёт вместе с ней.",
  c_spores: "Споры на стекле прорастают от тепла ладони. Нити тянутся к звуку: щёлкните пальцами — и они поворачиваются в ту сторону.",
  c_nerve: "Нервный узел: клетки сложены слоями, как в коре мозга. Этим тварь думала. В тканях — следы успокоительного, каким в медблоке снимали тревогу.",
  c_acid: "Кислотный мешок изнутри выстлан клетками, которые не боятся собственной кислоты. Из таких мечтали вырастить заплаты для ожогов.",
  c_enzyme: "Ферментная культура жива и голодна: на стекле она переваривает всё, кроме стекла.",
  c_cond: "Конденсат мутагена не похож ни на вирус, ни на яд: это белок, который учит чужие клетки собирать себя заново. Он помнит форму — человеческую."
};
var TIS_E = {
  K: "Ткань с верхних уровней: в ней ещё держатся следы препаратов медблока.",
  P: "Ткань старая и плотная, в ней — пыль породы, какую поднимали буром.",
  C: "Ткань молодая и звенит — буквально: клетки отвечают на звук.",
  O: "Ткань отражённая: под микроскопом клетки повёрнуты зеркально.",
  M: "Ткань уже кто-то разбирал: на каждом слое — следы тонкой иглы.",
  I: "Ткань поёт: в её клетках тот же ритм, что в шуме реки."
};
function tissueMenu(o) {
  var build = function () {
    var items = [];
    TIS_F.forEach(function (f) {
      if (!C().FAM[f]) return;
      var n = C().units(f).reduce(function (a, u) { return a + u.n; }, 0);
      if (n > 0) items.push({ label: "Анализ: " + low(C().FAM[f].n[0]) + " — в рюкзаке " + n, fn: function () { tissue(o, f); } });
    });
    if (!items.length) items.push({ label: "Тканей для анализа нет: их дают твари.", info: true, keep: true, fn: function () { say("Тканей для анализа нет."); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  UIx("menu", "Анализ ткани", build(), { rebuild: build, intro: "На анализ уходит порция ткани и порция солей на буфер, вода — из крана. Отчёт покупают выжившие медики, генетики и лаборанты." });
}
function tissue(o, f) {
  if (!guard()) return;
  if (!C().units("c_salt").length) { A("play", "ui_error"); say("Для буфера нужны минеральные соли."); return; }
  C().useOne(f); C().useOne("c_salt");
  spend(5); turn();
  var e = era(), key = f + ":" + e, first = !rec().tis[key];
  rec().tis[key] = 1;
  C().gain("bio", first ? 10 : 3); gm().gainXP(first ? 12 : 4);
  C().give("c_report", 1); ev("tissue", 1);
  A("play", "ev_glass");
  UIx("closeAll");
  UIx("note", "Анализ: " + low(C().FAM[f].n[0]), TIS[f] + " " + (TIS_E[e] || "") + " «Эхо»: отчёт об анализе — в рюкзаке; медики, генетики и лаборанты среди выживших за него платят.");
}

/* ════════ ЖУРНАЛ ОПЫТОВ И ПРАВИЛА ════════ */
function guesses() {
  var out = [];
  C().RC.forEach(function (rc) {
    if (!rc.f || C().known(rc) || !C().outOk(rc) || C().brLv(rc.br) < rc.lv) return;
    var nd = needOf(rc); if (!nd) return;
    var ks = Object.keys(nd.m).sort(function (a, b) { return h32(rc.id + a) - h32(rc.id + b); });
    if (ks.length < 2) return;
    out.push("Догадка: что-то из направления «" + C().BR[rc.br].n + "» — на основе: " + SUB[ks[0]].n + " и " + SUB[ks[1]].n + (ks.length > 2 ? ", и ещё чего-то" : "") + ".");
  });
  return out.slice(0, 5);
}
function journalMenu() {
  var r = rec(), items = [];
  RX.forEach(function (rx) { if (r.rx[rx.id]) items.push({ label: rx.d + ".", keep: true, fn: function () { say(rx.d + "."); } }); });
  if (r.rx.recryst) items.push({ label: "Соли растворить, отфильтровать и выпарить — кристаллы на сорт чище.", keep: true, fn: function () { say("Перекристаллизация: соли выходят чище."); } });
  var hand = Object.keys(r.hand || {}).filter(function (id) { return C().RCBY[id]; });
  if (hand.length) items.push({ label: "Открыто опытом: " + hand.map(function (id) { return "«" + low(nm(C().RCBY[id])) + "»"; }).join(", ") + ".", keep: true, fn: function () { say("Рецептуры, открытые руками, — в синтезе."); } });
  guesses().forEach(function (t) { items.push({ label: t, keep: true, fn: function () { say(t); } }); });
  if (!items.length) items.push({ label: "Журнал пуст: смешивайте, грейте, пробуйте — «Эхо» запишет, что с чем бывает.", info: true, keep: true, fn: function () {} });
  items.push({ label: "Назад", close: true, fn: function () {} });
  UIx("menu", "Журнал опытов", items);
}
var RULES = "Правила лаборатории. Сначала вода, потом кислота — тонкой струйкой, иначе брызги. Нюхают, помахивая ладонью к себе. Хлорку не смешивают ни с кислотой, ни с нашатырём: ядовитый газ. Фосфор кладут только под воду или в горючее. Горючее и пиротехнику не греют. Растворитель кипятят только под вытяжкой. Водород из кислоты со стружкой хлопает у огня. Индикатор: красный — кислота, зелёный — нейтрально, синий и фиолетовый — щёлочь. Составы руками: фармакология — тёплое, не кипятить; токсикология — не кипятить; энергохимия — охладить перед разливом; пиротехника — сухо и холодно, а с фосфором — под водой или в горючем; биотехнология — тёплое, как тело. И всегда — перемешать. Без единой ошибки в посуде состав выходит на сорт чище. Добавки — стабилизатор, активатор, сорбент — по одной, катализатор — поднимает сорт. Неизвестное открывается опытом: «Эхо» скажет, когда смесь на пути к новому составу.";

/* ════════ ОКНА ════════ */
function bench(o) {
  cur = { o: o };
  var s = C().station(o);
  if (s.dirty) { A("play", "ui_error"); say("Стол загрязнён — сначала отмойте его растворителем."); return; }
  if (!G().tut.chemlab) { G().tut.chemlab = 1; sayq("«Эхо»: работа руками. Четыре пробирки, колба и стакан; реактивы — из рюкзака, вода — из крана. Смешивайте, грейте, остужайте, проверяйте индикатором — я опишу, что происходит. Разлить можно то, что сложилось в состав. Правила лаборатории — в этом же окне."); }
  var build = function () {
    var b = benchOf(o), items = [];
    items.push({ label: (hood() ? "Вытяжка гудит" : "Вытяжки нет: пары — прямо в лицо") + ". " + "Химик: ступень " + C().level() + ".", info: true, keep: true, fn: function () { say(hood() ? "Вытяжка есть: пары утягивает." : "Вытяжки нет: здесь осторожнее с парами и растворителем."); } });
    b.v.forEach(function (v, i) { items.push({ label: vLine(v, i), fn: function () { vesselMenu(o, i); } }); });
    if (hidden().length) items.push({ label: "Тайнопись: проявить парами йода — документов: " + hidden().length, fn: function () { revealMenu("bench"); } });
    if (G().inv.film > 0) items.push({ label: "Проявить фотоплёнку — плёнок: " + G().inv.film, fn: function () { developFilm(o); } });
    items.push({ label: "Анализ ткани тварей", fn: function () { tissueMenu(o); } });
    items.push({ label: "Журнал опытов", fn: function () { journalMenu(); } });
    items.push({ label: "Правила лаборатории", keep: true, fn: function () { say(RULES, { read: true }); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  A("play", "ev_glass");
  UIx("menu", "Работа руками", build(), { keep: true, rebuild: build });
}
function vesselMenu(o, i) {
  var build = function () {
    var v = vOf(o, i), full = total(v) > 0, items = [];
    items.push({ label: vLine(v, i) + (full ? " " + judge(v) : " Ёмкость — " + VT[v.k].cap + " " + pl(VT[v.k].cap, "порция", "порции", "порций") + "."), info: true, keep: true, fn: function () { say(vLine(vOf(o, i), i) + " " + judge(vOf(o, i))); } });
    items.push({ label: "Добавить вещество из рюкзака", fn: function () { addMenu(o, i); } });
    items.push({ label: "Налить воды из крана", keep: true, fn: function () { addSub(o, i, "water"); } });
    if (full) {
      items.push({ label: "Нагреть " + VT[v.k].heat, keep: true, fn: function () { heat(o, i); } });
      items.push({ label: "Охладить в ледяной бане", keep: true, fn: function () { cool(o, i); } });
      items.push({ label: "Перемешать стеклянной палочкой", keep: true, fn: function () { stir(o, i); } });
      items.push({ label: "Капнуть индикатор", keep: true, fn: function () { indicator(o, i); } });
      items.push({ label: "Понюхать, помахивая ладонью", keep: true, fn: function () { smell(o, i); } });
      items.push({ label: "Отфильтровать", keep: true, fn: function () { filter(o, i); } });
      items.push({ label: "Выпарить", keep: true, fn: function () { evaporate(o, i); } });
      items.push({ label: "Перелить в другую посуду", fn: function () { pourMenu(o, i); } });
      items.push({ label: "Разлить по склянкам", keep: true, fn: function () { bottle(o, i); } });
      items.push({ label: "Вылить в слив", keep: true, fn: function () { dump(o, i); } });
    }
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  UIx("menu", vName(vOf(o, i), i), build(), { keep: true, rebuild: build });
}
function addMenu(o, i) {
  var build = function () {
    var items = [];
    ORDER.forEach(function (sid) {
      if (sid === "water") return;
      var n = haveSub(sid);
      if (n > 0) items.push({ label: cap1(SUB[sid].n) + " — в рюкзаке " + n, keep: true, fn: function () { addSub(o, i, sid); } });
    });
    if (!items.length) items.push({ label: "Добавлять нечего: сырьё и реактивы — в шкафах лабораторий, складах и у тварей.", info: true, keep: true, fn: function () {} });
    items.unshift({ label: vLine(vOf(o, i), i), info: true, keep: true, fn: function () { say(vLine(vOf(o, i), i)); } });
    items.push({ label: "Назад", close: true, fn: function () {} });
    return items;
  };
  UIx("menu", "Добавить: " + vName(vOf(o, i), i).toLowerCase(), build(), { keep: true, rebuild: build });
}
function pourMenu(o, i) {
  var b = benchOf(o), items = [];
  b.v.forEach(function (v, j) { if (j !== i) items.push({ label: "В " + vName(v, j).replace(/^Пробирка/, "пробирку").replace(/^Колба/, "колбу").replace(/^Химический стакан/, "химический стакан") + " — " + (total(v) ? contents(v) : "пусто"), fn: function () { pour(o, i, j); } }); });
  items.push({ label: "Назад", fn: function () {} });
  UIx("menu", "Перелить из: " + vName(vOf(o, i), i).toLowerCase(), items);
}

LAB.chemlab = {
  SUB: SUB, RX: RX, bench: bench, busy: busy, revealMenu: revealMenu, developFilm: developFilm, tissueMenu: tissueMenu,
  /* для проверок */
  _v: vOf, _add: addSub, _heat: heat, _cool: cool, _stir: stir, _bottle: bottle, _pour: pour, _evap: evaporate, _filter: filter, _judge: judge, _ph: function (o, i) { return phOf(vOf(o, i)); },
  _use: function (o) { cur = { o: o }; }, _reveal: doReveal, _tissue: tissue
};
})();
