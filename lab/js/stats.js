/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — характеристики героя (после 4.6).
   Пять основных: сила, ловкость, телосложение, интеллект, харизма.
   Растут двумя путями, как в «Квази-эпсилоне»: очками за уровень героя
   (их вкладывает сам игрок — окно «Характеристики») и практикой: дела
   копят навык, и не чаще раза в сутки характеристика подрастает сама.
   Три вторичные — выносливость, ментал, регенерация — очками не растут,
   только повторением: ходьба и груз, нейронагрузка, лечение и отдых.
   Предел основных — сорок, ниже Истока — шестьдесят; вторичных — тридцать.
   Записи прежних версий: телосложение получает то, что дал бы ровный
   рост (по единице за уровень), — здоровье не пересчитывается.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function G() { return LAB.game.G; }
function gm() { return LAB.game; }
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function snd(id, alt, o) { var S = LAB.SND || {}; A("play", S[id] ? id : (alt || id), o); }
function plural(n, a, b, c) { return gm().plural ? gm().plural(n, a, b, c) : a; }
function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pct(x) { return Math.round(x * 100); }
/* «3 процента», «1,6 процента», «12 процентов» */
function pw(n) { var r = Math.round(n * 10) / 10, t = String(r).replace(".", ","); return t + " " + (r % 1 ? "процента" : plural(Math.abs(r), "процент", "процента", "процентов")); }

var MAIN = ["str", "agi", "con", "mind", "cha"], SEC = ["stam", "ment", "regen"];
var NAME = { str: "сила", agi: "ловкость", con: "телосложение", mind: "интеллект", cha: "харизма", stam: "выносливость", ment: "ментал", regen: "регенерация" };
var NAMEA = { str: "силу", agi: "ловкость", con: "телосложение", mind: "интеллект", cha: "харизму", stam: "выносливость", ment: "ментал", regen: "регенерацию" };
var GREW = { str: "выросла", agi: "выросла", con: "выросло", mind: "вырос", cha: "выросла", stam: "выросла", ment: "вырос", regen: "выросла" };
var PER_LVL = 5, SEC_CAP = 30;

/* был ли герой ниже Истока: предел основных — шестьдесят */
function below() { var g = G(); if (g.L > 100) return true; for (var k in (g.maxF || {})) if (+k > 100) return true; return false; }
function capOf(k) { return SEC.indexOf(k) >= 0 ? SEC_CAP : below() ? 60 : 40; }

/* ── СОСТОЯНИЕ ── G.con рядом с G.str (так их читает LAB.heroStat); G.chs — очки, практика, вторичные */
function S() {
  var g = G();
  if (!g) return null;
  if (g.con == null) g.con = Math.min(40, 10 + Math.max(0, (g.lvl || 1) - 1)); /* запись прежней версии — ровный рост */
  if (!g.chs) g.chs = { pts: 0, px: {}, day: {}, sec: { stam: 0, ment: 0, regen: 0 }, rg: 0, th: {} };
  var s = g.chs;
  if (!s.px) s.px = {}; if (!s.day) s.day = {}; if (!s.sec) s.sec = { stam: 0, ment: 0, regen: 0 }; if (!s.th) s.th = {};
  return s;
}
function base(k) { var g = G(); if (SEC.indexOf(k) >= 0) return (S().sec[k] || 0); return g[k] == null ? 10 : g[k]; }
/* с прибавкой плода — для действий; основа — для порогов окна и гнёзд дрона */
function val(k) { if (SEC.indexOf(k) >= 0) return base(k); return LAB.heroStat ? LAB.heroStat(k) : base(k); }
function sec(k) { return S() ? S().sec[k] || 0 : 0; }

/* ── ПОРОГИ ── звучат, когда характеристика их переходит */
var TH = {
  str: [[11, "средний экзокаркас — по силе"], [14, "ящики вскрываются рывком, завалы разбираются быстрее; тяжёлый каркас — по силе"], [20, "тяжёлое оружие в руках не гуляет: силы хватает на любой ствол без каркаса"]],
  agi: [[15, "в тщательной работе брак — заметно реже"], [20, "энергоклинок как влитой: урон им плюс пятнадцать процентов"]],
  con: [[11, "средний экзокаркас — по костям"], [13, "тяжёлый экзокаркас — по костям: кости держат его вес и рывки приводов"], [20, "яды и токсины берут заметно слабее"]],
  mind: [[15, "нейроприцел для своего оружия"], [16, "взлом короче на один сигнал"], [24, "взлом короче ещё на один сигнал"], [25, "дрон держит ещё один модуль"]],
  cha: [[15, "выжившие доверяют: награды за поручения больше"], [25, "торговцы уступают охотнее: цены лучше"]]
};
function thNext(k) { var v = base(k); var t = (TH[k] || []).filter(function (x) { return x[0] > v; })[0]; return t ? cap1(NAME[k]) + " " + t[0] + ": " + t[1] + "." : ""; }
function thCross(k, v0, v1) { return (TH[k] || []).filter(function (x) { return x[0] > v0 && x[0] <= v1; }).map(function (x) { return cap1(NAME[k]) + " " + x[0] + ": " + x[1] + "."; }).join(" "); }

/* ── ЧТО ДАЮТ ── числа для окна и для других модулей */
function d10(k) { return val(k) - 10; }
var K = {
  melee: function () { return d10("str") * 0.03; },                         /* combat.js: урон в ближнем бою */
  acc: function () { return d10("agi") * 0.01; },                           /* combat.js: точность и уклонение */
  crit: function () { return d10("agi") * 0.008; },
  flaw: function () { return Math.max(0.4, (1 - Math.max(0, d10("agi")) * 0.015) * (val("agi") >= 15 ? 0.85 : 1)); },  /* mastery.js: брак; порог 15 */
  hp: function () { return (base("con") - 10) * 5; },
  tox: function () { return (1 - Math.min(0.4, Math.max(0, d10("con")) * 0.012)) * (val("con") >= 20 ? 0.85 : 1); },   /* токсины копятся; порог 20 */
  wake: function () { return (1 - Math.min(0.3, Math.max(0, d10("con")) * 0.008)) * (1 - Math.min(0.3, sec("stam") * 0.01)); }, /* усталость */
  neuro: function () { return 1 - Math.min(0.45, sec("ment") * 0.015); },    /* нейронагрузка */
  heal: function () { return 1 + Math.min(0.45, sec("regen") * 0.015); },    /* лечение */
  regen: function () { return sec("regen") * 0.02; },                         /* здоровья в минуту само */
  xp: function () { return 1 + Math.min(0.6, Math.max(0, d10("mind")) * 0.02); },    /* опыт мастерства */
  quest: function () { return 1 + Math.min(0.3, Math.max(0, d10("cha")) * 0.01); },  /* награды за поручения */
  buy: function () { return Math.max(0, Math.min(30, d10("cha"))) * 0.004 + (val("cha") >= 25 ? 0.03 : 0); },   /* game.js, chaK; порог 25 */
  sell: function () { return Math.max(0, Math.min(30, d10("cha"))) * 0.003 + (val("cha") >= 25 ? 0.02 : 0); }
};
function effects(k) {
  var L = LAB.load, out = [];
  if (k === "str") {
    out.push(K.melee() ? "удар в ближнем бою " + (K.melee() > 0 ? "сильнее" : "слабее") + " на " + pw(Math.abs(pct(K.melee()))) : "удар в ближнем бою обычный");
    if (L) out.push("груз — до " + L.kg(L.capacity()) + ", из них сила даёт " + L.kg(L.capOf("str")));
  }
  if (k === "agi") {
    out.push(K.acc() ? "точность и уклонение " + (K.acc() > 0 ? "плюс " : "минус ") + pw(Math.abs(pct(K.acc()))) + ", критический удар " + (K.crit() > 0 ? "чаще" : "реже") + " на " + pw(Math.abs(K.crit() * 100)) : "точность и уклонение обычные");
    if (K.flaw() < 1) out.push("брак в работе реже на " + pw(pct(1 - K.flaw())));
  }
  if (k === "con") {
    out.push(K.hp() ? "здоровья плюс " + K.hp() + " — по пять за единицу" : "здоровье без прибавки: по пять за каждую единицу выше десяти");
    if (K.tox() < 1) out.push("токсины копятся медленнее на " + pw(pct(1 - K.tox())));
    if (K.wake() < 1) out.push("усталость медленнее на " + pw(pct(1 - K.wake())) + " вместе с выносливостью");
    if (L) out.push("груз плюс " + L.kg(L.capOf("con")));
  }
  if (k === "mind") out.push(K.xp() > 1 ? "опыт мастерства плюс " + pw(pct(K.xp() - 1)) : "опыт мастерства обычный", "нейроприцел — с 15", "взлом короче с 16 и с 24", "лишнее гнездо дрона — с 25");
  if (k === "cha") out.push(K.buy() ? "покупка дешевле на " + pw(K.buy() * 100) + ", продажа дороже на " + pw(K.sell() * 100) : "цены без уступок", K.quest() > 1 ? "награды за поручения больше на " + pw(pct(K.quest() - 1)) : "награды за поручения — как обещано");
  if (k === "stam") { out.push(sec("stam") ? "усталость медленнее на " + pw(Math.min(30, sec("stam"))) : "пока ничего: растёт от шагов"); if (L && sec("stam")) out.push("груз плюс " + L.kg(L.capOf("stam")) + ", перегруз меньше замедляет"); }
  if (k === "ment") out.push(sec("ment") ? "нейронагрузка копится медленнее на " + pw(pct(1 - K.neuro())) : "пока ничего: растёт от пережитой нейронагрузки");
  if (k === "regen") out.push(sec("regen") ? "лечение сильнее на " + pw(pct(K.heal() - 1)) + "; вне боя здоровье возвращается само: " + Math.round(K.regen() * 60) + " в час" : "пока ничего: растёт от лечения и отдыха");
  return out.filter(Boolean).join("; ");
}
var GROWS = {
  str: "очками и практикой: ближний бой, разбор и рывки, ходьба с тяжёлым грузом",
  agi: "очками и практикой: стрельба, обезвреживание ловушек, отмычки, тонкая работа у верстака, головоломки на ритм",
  con: "очками и практикой: раны, яды, долгие переходы, испытания тела",
  mind: "очками и практикой: взлом, головоломки, книги и записи, опыты, изучение устройств",
  cha: "очками и практикой: поручения выживших, торговля, разговоры и помощь",
  stam: "только практикой: шаги, особенно с грузом",
  ment: "только практикой: пережитая нейронагрузка и сны в капсуле",
  regen: "только практикой: лечение и отдых"
};

/* ── ПРАКТИКА ── сколько нужно на единицу; не чаще раза в сутки на характеристику */
function need(k) { var v = base(k); return SEC.indexOf(k) >= 0 ? 20 + 10 * v : 30 + 5 * Math.max(0, v - 10); }
function today() { return G().day || 1; }
function practice(k, units) {
  var s = S(); if (!s || !units) return;
  if (base(k) >= capOf(k)) return;
  var n = need(k);
  s.px[k] = Math.min(n, (s.px[k] || 0) + units);
  if (s.px[k] < n || s.day[k] === today()) return;
  s.px[k] = 0; s.day[k] = today();
  var v0 = base(k);
  raise(k, 1);
  var th = thCross(k, v0, base(k));
  snd("stat_up", "ui_levelup");
  sayq("Практика: " + NAME[k] + " " + GREW[k] + " — теперь " + base(k) + "." + (th ? " " + th : ""));
  if (gm().journal) gm().journal("Практика: " + NAME[k] + " " + base(k) + ".");
}
/* прибавить к основе; телосложение — сразу и здоровье */
function raise(k, n) {
  var g = G(), s = S();
  if (SEC.indexOf(k) >= 0) { s.sec[k] = Math.min(SEC_CAP, (s.sec[k] || 0) + n); return; }
  var v0 = base(k), v1 = Math.min(capOf(k), v0 + n);
  g[k] = v1;
  if (k === "con" && v1 > v0) { g.hpMax += 5 * (v1 - v0); g.hp = Math.min(g.hpMax, g.hp + 5 * (v1 - v0)); }
  UIx("refresh");
}
/* Дела героя (ach.ev и прочие): что они тренируют. */
var DEEDS = {
  kill_mech: [["mind", 0.5]], boss: [["con", 4], ["str", 2], ["agi", 2]],
  grenade: [["agi", 1]], trap_set: [["agi", 1]], trap_kill: [["mind", 1]], trap_mech: [["mind", 1]], disarm: [["agi", 3]], self_trap: [["con", 2]], ctrap: [["con", 1]],
  craft: [["agi", 1], ["mind", 1]], handmade: [["agi", 1], ["mind", 1]], discover: [["mind", 3]], research: [["mind", 3]], reveal: [["mind", 1]],
  repair: [["agi", 1], ["mind", 1]], salvage: [["str", 1]], film_dev: [["mind", 1]], tissue: [["mind", 1]],
  pick: [["agi", 2]], safe: [["agi", 2], ["mind", 1]], secret: [["mind", 1]], search: [["mind", 0.5]],
  note: [["mind", 0.5]], read: [["mind", 1]], book: [["mind", 1]], readend: [["mind", 1]], catalog: [["mind", 0.5]], data: [["mind", 1]], mainframe: [["mind", 2]], codes: [["mind", 1]], comp: [["mind", 0.5]],
  chempuz: [["mind", 3]], acidjar: [["mind", 2]], chemsafe: [["mind", 2], ["agi", 1]], reagents: [["mind", 0.5]],
  quest: [["cha", 5]], bought: [["cha", 0.5]], sold: [["cha", 0.5]], order: [["cha", 1]], delivered: [["cha", 1]], respect: [["cha", 2]], badge: [["cha", 1]], badges_given: [["cha", 2]],
  freed: [["cha", 3]], free: [["cha", 3]], wish: [["cha", 1]], intercom: [["cha", 0.5]], knock: [["cha", 0.5]], status: [["cha", 3]], game_win: [["mind", 1], ["cha", 1]], music: [["cha", 0.5]], play: [["cha", 0.5]],
  train: [["con", 1]], floor: [["con", 1]], zone: [["con", 1]], decon: [["con", 1]], checkup: [["con", 0.5]], trial: [["con", 2], ["str", 1]], norm: [["con", 1]], cut: [["str", 2]],
  harvest: [["str", 0.5]], plant_course: [["con", 1]], plant_eat: [["con", 0.5]], cook: [["mind", 0.5]],
  hide: [["agi", 1]], aim: [["agi", 2]], vent: [["agi", 1]], listen_vent: [["mind", 0.5]], shred: [["str", 0.5]], tapefix: [["agi", 1]], photo: [["mind", 0.5]],
  rest_fx: [["regen", 1]], rest_drink: [["regen", 0.5]], sleep: [["regen", 2], ["ment", 1]], dream: [["ment", 1]],
  puzzle: [["mind", 3]], rubble: [["str", 2], ["stam", 1]],
  mini_hack: [["mind", 3]], mini_code: [["mind", 1]], mini_bulls: [["mind", 2]], mini_sort: [["mind", 2]], mini_relays: [["mind", 2]],
  mini_rhythm: [["agi", 2]], mini_sync: [["agi", 2]], mini_tune: [["agi", 1], ["mind", 1]], mini_melody: [["cha", 1], ["mind", 1]]
};
function deed(name) {
  if (!LAB.game || !gm().entered || !S()) return;
  if (name === "kill") {
    var w = gm().curWeapon ? gm().curWeapon() : null, W = LAB.workshop;
    var melee = w && (W && W.melee ? W.melee(w) : w.rng <= 1);
    practice(melee ? "str" : "agi", melee ? 2 : 1.5);
    return;
  }
  var d = DEEDS[name];
  if (d) d.forEach(function (p) { practice(p[0], p[1]); });
}
/* шаг: выносливость; с тяжёлым грузом — ещё сила и телосложение */
function step() {
  var s = S(); if (!s) return;
  var r = LAB.load ? LAB.load.ratio() : 0;
  practice("stam", 0.02 + (r > 0.5 ? 0.05 * Math.min(1.5, r) : 0));
  if (r > 0.6) { practice("str", 0.02 * Math.min(1.5, r)); practice("con", 0.015 * Math.min(1.5, r)); }
}
function hurt(fin) { if (fin >= 3) practice("con", 0.3); }
function healed(n) { if (n > 0) practice("regen", n / 25); }
function neuro(d) { if (d > 0) practice("ment", d / 12); }
/* вне боя здоровье возвращается само: регенерация (минуты игры) */
function minutes(min) {
  var s = S(), g = G(); if (!s || !min || g.dead) return;
  var r = K.regen(); if (r <= 0 || g.hp >= g.hpMax) return;
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) return;
  if (g.body && g.body.food < 20) return;
  s.rg = (s.rg || 0) + r * min;
  if (s.rg >= 1) { var n = Math.floor(s.rg); s.rg -= n; g.hp = Math.min(g.hpMax, g.hp + n); UIx("refresh"); }
}

/* ── УРОВЕНЬ ГЕРОЯ ── очки; всё на пределе — опыт уровня уходит в здоровье */
function onLevel() {
  var s = S(), g = G();
  var room = MAIN.reduce(function (a, k) { return a + Math.max(0, capOf(k) - base(k)); }, 0) - (s.pts || 0);
  if (room <= 0) { g.hpMax += 5; g.hp = g.hpMax; return " Характеристики на пределе: уровень дал ещё пять здоровья."; }
  var add = Math.min(PER_LVL, room);
  s.pts = (s.pts || 0) + add;
  return " Очков характеристик: " + s.pts + " — " + LAB.K("окно «Характеристики»: " + LAB.gw("stats", "тройное касание тремя пальцами"), "окно «Характеристики»: Shift+C") + ".";
}
function spend(k, n) {
  var s = S();
  n = Math.min(n || 1, s.pts || 0, capOf(k) - base(k));
  if (n <= 0) return false;
  var v0 = base(k);
  s.pts -= n; raise(k, n);
  var th = thCross(k, v0, base(k));
  snd("stat_up", "ui_levelup");
  say(cap1(NAME[k]) + " " + base(k) + ". " + (s.pts ? "Осталось очков: " + s.pts + "." : "Очки распределены.") + (th ? " " + th : ""));
  return true;
}
/* поровну: по очку туда, где меньше (основа), пока есть очки и место */
function spread() {
  var s = S(), got = {}, guard = 0;
  while ((s.pts || 0) > 0 && guard++ < 500) {
    var open = MAIN.filter(function (k) { return base(k) < capOf(k); });
    if (!open.length) break;
    open.sort(function (a, b) { return base(a) - base(b) || MAIN.indexOf(a) - MAIN.indexOf(b); });
    var k = open[0], v0 = base(k);
    s.pts--; raise(k, 1);
    got[k] = (got[k] || 0) + 1;
    var th = thCross(k, v0, base(k)); if (th) got.th = (got.th ? got.th + " " : "") + th;
  }
  snd("stat_up", "ui_levelup");
  say("Распределено: " + MAIN.filter(function (k) { return got[k]; }).map(function (k) { return NAME[k] + " плюс " + got[k] + ", теперь " + base(k); }).join("; ") + "." + (got.th ? " " + got.th : ""));
}

/* ── ОКНО «ХАРАКТЕРИСТИКИ» ── */
function statLabel(k) {
  var s = S(), v = base(k), b = val(k), m = capOf(k), isSec = SEC.indexOf(k) >= 0;
  return cap1(NAME[k]) + " " + v + (b !== v ? " (с плодом " + b + ")" : "") + " из " + m + (v >= m ? ", предел" : "") + ". " + cap1(effects(k)) + "." + (v < m ? " Практика: " + Math.floor(s.px[k] || 0) + " из " + need(k) + (s.day[k] === today() && (s.px[k] || 0) >= need(k) ? ", подрастёт завтра" : "") + "." : "") + (isSec ? " Растёт " + GROWS[k] + "." : "");
}
function items() {
  var s = S(), its = [];
  its.push({ label: function () { return s.pts ? "Очков для распределения: " + s.pts + ". Выберите характеристику, чтобы вложить очко." : "Свободных очков нет: они приходят с каждым уровнем героя, по " + PER_LVL + "."; }, info: true, keep: true, fn: function () { say(s.pts ? "Очков для распределения: " + s.pts + "." : "Свободных очков нет."); } });
  MAIN.forEach(function (k) { its.push({ label: function () { return statLabel(k); }, fn: function () { statMenu(k); } }); });
  SEC.forEach(function (k) { its.push({ label: function () { return statLabel(k); }, info: true, keep: true, fn: function () { say(statLabel(k)); } }); });
  if (s.pts) its.push({ label: "Распределить все очки поровну: по очку туда, где меньше", fn: function () { spread(); UIx("closeTop", true); menu(); } });
  its.push({ label: "Как растут характеристики", fn: function () { UIx("note", "Как растут характеристики", HOWTO()); } });
  its.push({ label: "Назад", fn: function () {} });
  return its;
}
function HOWTO() {
  return "С каждым уровнем героя приходят " + PER_LVL + " очков характеристик — вложите их сами: выберите характеристику и «Вложить очко». Вложенное назад не вынуть. " +
    "Характеристики растут и от дел — практикой: сила — от ближнего боя, разбора и ходьбы с тяжёлым грузом; ловкость — от стрельбы, ловушек, отмычек и тонкой работы; телосложение — от ран, ядов и долгих переходов; интеллект — от взлома, головоломок, книг и опытов; харизма — от поручений, торговли и разговоров. Практика поднимает каждую характеристику не чаще раза в сутки. " +
    "Выносливость, ментал и регенерация очками не растут — только повторением: шаги и груз, пережитая нейронагрузка, лечение и отдых. " +
    "Предел основных — сорок, ниже Истока — шестьдесят; вторичных — тридцать. Пороги — в описании каждой характеристики: дойдёте — «Эхо» скажет, что открылось.";
}
function menu() {
  if (!gm().entered || !S()) return;
  UIx("menu", "Характеристики", items(), { rebuild: items, intro: S().pts ? "Очков для распределения: " + S().pts + "." : "" });
}
function statMenu(k) {
  var s = S(), v = base(k), m = capOf(k);
  var its = [];
  if (v >= m) its.push({ label: cap1(NAME[k]) + " на пределе: " + m + ".", info: true, keep: true, fn: function () { say(cap1(NAME[k]) + " на пределе."); } });
  else if (!s.pts) its.push({ label: "Очков нет: они приходят с уровнем героя.", info: true, keep: true, fn: function () { say("Очков нет."); } });
  else {
    its.push({ label: "Вложить очко: " + NAME[k] + " станет " + (v + 1) + ". Очков останется " + (s.pts - 1), fn: function () { spend(k, 1); UIx("closeTop", true); UIx("rebuildTop"); } });
    if (s.pts >= 5 && m - v >= 5) its.push({ label: "Вложить пять очков: " + NAME[k] + " станет " + (v + 5), fn: function () { spend(k, 5); UIx("closeTop", true); UIx("rebuildTop"); } });
    if (s.pts > 1 && m - v >= s.pts && s.pts !== 5) its.push({ label: "Вложить все очки, " + s.pts + ": " + NAME[k] + " станет " + (v + s.pts), fn: function () { spend(k, s.pts); UIx("closeTop", true); UIx("rebuildTop"); } });
  }
  its.push({ label: "Сейчас: " + effects(k) + ".", info: true, keep: true, fn: function () { say(effects(k) + "."); } });
  var nx = thNext(k); if (nx) its.push({ label: "Следующий порог — " + nx, info: true, keep: true, fn: function () { say(nx); } });
  its.push({ label: "Растёт " + GROWS[k] + ".", info: true, keep: true, fn: function () { say("Растёт " + GROWS[k] + "."); } });
  its.push({ label: "Назад", fn: function () {} });
  UIx("menu", cap1(NAME[k]), its, { intro: cap1(NAME[k]) + " " + v + " из " + m + "." });
}
/* строка окна персонажа */
function charLine() {
  var s = S(); if (!s) return "";
  var st = function (k) { return LAB.plants && LAB.plants.statText ? LAB.plants.statText(k) : String(val(k)); };
  return "Сила " + st("str") + ", ловкость " + st("agi") + ", телосложение " + st("con") + ", интеллект " + st("mind") + ", харизма " + st("cha") +
    "; выносливость " + sec("stam") + ", ментал " + sec("ment") + ", регенерация " + sec("regen") + "." + (s.pts ? " Очков для распределения: " + s.pts + "." : "");
}

LAB.stats = {
  MAIN: MAIN, SEC: SEC, NAME: NAME, K: K, S: S, base: base, val: val, sec: sec, capOf: capOf, need: need,
  deed: deed, step: step, hurt: hurt, healed: healed, neuro: neuro, minutes: minutes, practice: practice,
  onLevel: onLevel, spend: spend, spread: spread, raise: raise, menu: menu, statMenu: statMenu, charLine: charLine, effects: effects, thNext: thNext
};
})();
