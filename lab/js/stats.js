/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — характеристики героя (после 4.6).
   Пять основных: сила, ловкость, телосложение, интеллект, харизма.
   Растут двумя путями, как в «Квази-эпсилоне»: очками за уровень героя
   (их вкладывает сам игрок — окно «Характеристики») и практикой: дела
   копят навык, и не чаще раза в сутки характеристика подрастает сама.
   Три вторичные — выносливость, ментал, регенерация — очками не растут,
   только повторением: ходьба и груз, нейронагрузка, лечение и отдых.
   (просьба автора: прокачка медленная, накрутить нельзя) Очко — раз в пять
   уровней героя (уровни идут быстро: прежние пять очков за каждый упирали
   все пять характеристик в предел на первых уровнях комплекса). Практика
   привязана к настоящему времени: у каждой характеристики запас практики,
   он пополняется только минутами настоящей игры (игра на экране, игрок
   действует; свёрнутая игра, пауза, капсула и простой — не в счёт), — сон,
   что проматывает сутки комплекса, и повтор одного дела без конца больше
   не ускоряют рост; цена единицы практики круто растёт с характеристикой.
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
var PTS_EVERY = 5, SEC_CAP = 30;   /* очко характеристик — на каждом пятом уровне героя */
var RATE = 20, STORE_H = 2;        /* запас практики: 20 единиц за час настоящей игры, копится до двух часов */
var IDLE_MS = 180000;              /* простой дольше трёх минут — не игра */

/* был ли герой ниже Истока: предел основных — шестьдесят */
function below() { var g = G(); if (g.L > 100) return true; for (var k in (g.maxF || {})) if (+k > 100) return true; return false; }
function capOf(k) { return SEC.indexOf(k) >= 0 ? SEC_CAP : below() ? 60 : 40; }

/* ── СОСТОЯНИЕ ── G.con рядом с G.str (так их читает LAB.heroStat); G.chs — очки, практика, вторичные */
function S() {
  var g = G();
  if (!g) return null;
  if (g.con == null) g.con = Math.min(40, 10 + Math.max(0, (g.lvl || 1) - 1)); /* запись прежней версии — ровный рост */
  if (!g.chs) g.chs = { pts: 0, milestones: 0, px: {}, day: {}, sec: { stam: 0, ment: 0, regen: 0 }, rg: 0, th: {} };
  var s = g.chs;
  if (!s.px) s.px = {}; if (!s.day) s.day = {}; if (!s.sec) s.sec = { stam: 0, ment: 0, regen: 0 }; if (!s.th) s.th = {};
  return s;
}
function base(k) { var g = G(); if (SEC.indexOf(k) >= 0) return (S().sec[k] || 0); return g[k] == null ? 10 : g[k]; }
/* с прибавкой плода — для действий; основа — для порогов окна и гнёзд дрона */
function val(k) { if (SEC.indexOf(k) >= 0) return base(k); return LAB.heroStat ? LAB.heroStat(k) : base(k); }
function sec(k) { return S() ? S().sec[k] || 0 : 0; }
/* (5.0, просьба автора) Спокойствие у воды: после тихих минут у аквариума ментал на время действует сильнее
   (G.calm: на сколько и до какой минуты комплекса); основу ментала это не меняет */
function nowM() { var g = G(); return (g.day || 0) * 1440 + (g.min || 0); }
function calmV() { var g = G(), c = g && g.calm; return c && c.until > nowM() ? c.v || 0 : 0; }
function calmLeft() { var g = G(), c = g && g.calm; return c && c.until > nowM() ? c.until - nowM() : 0; }
function calm(v, min) { var g = G(); if (!g) return; var c = g.calm; if (c && c.until > nowM() && c.v > v) { c.until = Math.max(c.until, nowM() + min); return; } g.calm = { v: v, until: nowM() + min }; }

/* ── НАСТОЯЩЕЕ ВРЕМЯ ИГРЫ ── секунды, пока игра на экране и игрок действует (s.play, в записи).
   Счёт — по ходу игры (performance.now), а не по часам устройства: перевести его нельзя; шаг счёта —
   не больше пяти секунд (устройство уснуло — время не набежало). */
var playT = 0;
function playTick() {
  var now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  var dt = playT ? Math.min(5000, Math.max(0, now - playT)) : 0;
  playT = now;
  var g = LAB.game, sp = LAB.Speech;
  if (!dt || !g || !g.entered || g.paused || LAB.bg || !g.G || g.G.dead || g.G.done) return;
  if (!sp || !sp.lastUser || Date.now() - sp.lastUser > IDLE_MS) return;
  var s = S(); if (s) s.play = (s.play || 0) + dt / 1000;
}
if (typeof window !== "undefined" && !LAB.selftesting) setInterval(function () { LAB.safe ? LAB.safe(playTick) : playTick(); }, 2000);
function playMin() { var s = S(); return s ? (s.play || 0) / 60 : 0; }
/* запас практики характеристики: пополняется минутами игры, не больше чем на два часа вперёд */
function store(k) {
  var s = S(), top = RATE * STORE_H, p = s.play || 0;
  if (!s.pb) s.pb = {}; if (!s.pt) s.pt = {};
  if (s.pb[k] == null) { s.pb[k] = top; s.pt[k] = p; }
  s.pb[k] = Math.min(top, s.pb[k] + Math.max(0, p - (s.pt[k] || 0)) / 3600 * RATE);
  s.pt[k] = p;
  return s.pb[k];
}
/* запас иссяк — сказать, но не чаще раза в два часа игры на характеристику */
function spent(k) {
  var s = S(); if (!s.ps) s.ps = {};
  var p = s.play || 0;
  if (s.ps[k] != null && p - s.ps[k] < 7200) return;
  s.ps[k] = p;
  sayq(cap1(NAME[k]) + ": практики пока довольно — навыку нужно время. Запас практики растёт, пока вы играете: единица за три минуты игры.");
}

/* ── ПОРОГИ ── звучат, когда характеристика их переходит */
var TH = {
  str: [[11, "средний экзокаркас — по силе"], [14, "ящики вскрываются рывком, завалы разбираются быстрее; тяжёлый каркас — по силе"], [20, "тяжёлое оружие в руках не гуляет: силы хватает на любой ствол без каркаса"]],
  agi: [[15, "в тщательной работе брак — заметно реже"], [20, "энергоклинок как влитой: урон им плюс пятнадцать процентов"]],
  con: [[11, "средний экзокаркас — по костям"], [12, "можно подогнать грузовую раму у верстака"], [13, "тело выдерживает тяжёлый экзокаркас"], [14, "можно подогнать усиленную упряжь у верстака"], [20, "яды и токсины действуют заметно слабее"]],
  mind: [[13, "команды дрону расходуют на одну единицу энергии меньше"], [15, "нейроприцел для своего оружия"], [16, "взлом короче на один сигнал"], [18, "команды дрону расходуют на две единицы энергии меньше"], [24, "взлом короче ещё на один сигнал"], [25, "дрон держит ещё один модуль"]],
  cha: [[14, "в личном хранилище одна дополнительная ячейка"], [15, "выжившие доверяют: награды за поручения больше"], [20, "в личном хранилище две дополнительные ячейки"], [25, "торговцы уступают охотнее: цены лучше"], [30, "в личном хранилище четыре дополнительные ячейки"]]
};
function thNext(k) {
  var v = base(k), t = (TH[k] || []).find(function (x) { return x[0] > v; });
  return t ? cap1(NAME[k]) + " " + t[0] + ": " + t[1] + ". До порога " + ptsW(costN(k, t[0] - v)) + ", если вкладывать очки." : "";
}
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
  neuro: function () { return 1 - Math.min(0.45, (sec("ment") + calmV()) * 0.015); },    /* нейронагрузка; спокойствие у воды — ментал выше на время */
  heal: function () { return 1 + Math.min(0.45, sec("regen") * 0.015); },    /* лечение */
  regen: function () { return Math.min(1.6, sec("regen") * 0.10); },                         /* здоровья в минуту само */
  xp: function () { return 1 + Math.min(0.6, Math.max(0, d10("mind")) * 0.02); },    /* опыт мастерства */
  quest: function () { return 1 + Math.min(0.3, Math.max(0, d10("cha")) * 0.01) + (val("cha") >= 15 ? 0.05 : 0); },  /* награды за поручения; порог 15 */
  buy: function () { return Math.max(0, Math.min(30, d10("cha"))) * 0.004 + (val("cha") >= 25 ? 0.03 : 0); },   /* game.js, chaK; порог 25 */
  sell: function () { return Math.max(0, Math.min(30, d10("cha"))) * 0.003 + (val("cha") >= 25 ? 0.02 : 0); }
};
function effects(k) {
  var L = LAB.load, out = [];
  if (k === "str") {
    out.push(K.melee() ? "удар в ближнем бою " + (K.melee() > 0 ? "сильнее" : "слабее") + " на " + pw(Math.abs(pct(K.melee()))) : "удар в ближнем бою обычный");
    if (L) out.push("личный предел груза " + L.kg(L.personalCapacity()) + ", из них сила даёт " + L.kg(L.capOf("str")));
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
  if (k === "mind") {
    var saving = LAB.drone ? LAB.drone.commandSaving() : 0;
    out.push(K.xp() > 1 ? "опыт мастерства плюс " + pw(pct(K.xp() - 1)) : "опыт мастерства обычный", saving ? "команды дрону экономят " + saving + " энергии" : "экономия энергии дрона начинается с 13", "нейроприцел — с 15", "взлом короче с 16 и с 24", "лишнее гнездо дрона — с 25");
  }
  if (k === "cha") out.push(K.buy() ? "у людей покупка дешевле на " + pw(K.buy() * 100) + ", продажа дороже на " + pw(K.sell() * 100) : "цены без уступок", K.quest() > 1 ? "награды за поручения больше на " + pw(pct(K.quest() - 1)) : "награды за поручения — как обещано", base("cha") >= 30 ? "в личном хранилище четыре дополнительные ячейки" : base("cha") >= 20 ? "в личном хранилище две дополнительные ячейки" : base("cha") >= 14 ? "в личном хранилище одна дополнительная ячейка" : "");
  if (k === "stam") { out.push(sec("stam") ? "усталость медленнее на " + pw(Math.min(30, sec("stam"))) : "пока ничего: растёт от шагов"); if (L && sec("stam")) out.push("груз плюс " + L.kg(L.capOf("stam")) + ", перегруз меньше замедляет"); }
  if (k === "ment") { out.push(sec("ment") || calmV() ? "нейронагрузка копится медленнее на " + pw(pct(1 - K.neuro())) : "пока ничего: растёт от пережитой нейронагрузки"); if (calmV()) out.push("сейчас спокойствие у воды: ментал плюс " + calmV() + " ещё " + calmLeft() + " " + gm().plural(calmLeft(), "минуту", "минуты", "минут")); }
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
  ment: "только практикой: пережитая нейронагрузка, сны в капсуле и тихие минуты у аквариума",
  regen: "только практикой: лечение и отдых"
};

/* ── ПРАКТИКА ── сколько нужно на единицу; дело берёт из запаса практики (store), не больше, чем в нём есть и чем
   осталось до единицы; подрастает характеристика не чаще раза в сутки комплекса */
function need(k) { var v = base(k); if (SEC.indexOf(k) >= 0) return 20 + 10 * v; var d = Math.max(0, v - 10); return 32 + 22 * d + 2 * d * d; }
function today() { return G().day || 1; }
function practice(k, units) {
  var s = S(); if (!s || !(units > 0)) return;
  if (base(k) >= capOf(k)) return;
  var n = need(k), room = Math.max(0, n - (s.px[k] || 0));
  if (room > 0) {
    var have = store(k), take = Math.min(units, room, have);
    if (take > 0) { s.pb[k] = have - take; s.px[k] = (s.px[k] || 0) + take; }
    if (take < Math.min(units, room) && s.pb[k] < 0.5 && MAIN.indexOf(k) >= 0) spent(k); /* вторичные растут сами, от шагов и лечения: о них не говорим */
  }
  if ((s.px[k] || 0) < n || s.day[k] === today()) return;
  s.px[k] = Math.max(0, s.px[k] - n); s.day[k] = today();
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
  var v0 = base(k), v1 = Math.min(capOf(k), v0 + n);
  if (SEC.indexOf(k) >= 0) s.sec[k] = v1;
  else g[k] = v1;
  if (k === "con" && v1 > v0) { g.hpMax += 5 * (v1 - v0); g.hp = Math.min(g.hpMax, g.hp + 5 * (v1 - v0)); }
  if (LAB.load && (k === "str" || k === "con" || k === "stam")) setTimeout(function () { LAB.safe(function () { LAB.load.after(); }); }, 0); /* предел груза вырос */
  UIx("refresh");
}
/* Дела героя (ach.ev и прочие): что они тренируют. */
var DEEDS = {
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
  mini_rhythm: [["agi", 2]], mini_sync: [["agi", 2]], mini_spin: [["agi", 1]], calm_water: [["ment", 2]], mini_tune: [["agi", 1], ["mind", 1]], mini_melody: [["cha", 1], ["mind", 1]]
};
/* (после 4.6, нелогичность) убийство — практика только тому, кто убил сам: ach.ev("kill") приходит и за
   добычу дрона, турели, ловушки и союзника; герою засчитывает combat.js (deed "herokill" с самой целью).
   Торговля — по сумме сделки: полсотни кредитов — полединицы; мелочь из автомата почти ничего не даёт */
function deed(name, n) {
  if (!LAB.game || !gm().entered || !S()) return;
  if (name === "kill" || name === "kill_mech" || name === "boss") return;
  if (name === "herokill") {
    var f = n || {}, w = gm().curWeapon ? gm().curWeapon() : null, W = LAB.workshop;
    var melee = w && (W && W.melee ? W.melee(w) : w.rng <= 1);
    practice(melee ? "str" : "agi", melee ? 2 : 1.5);
    if (f.kind === "mech") practice("mind", 0.5);
    if (f.boss) { practice("con", 4); practice("str", 2); practice("agi", 2); }
    return;
  }
  var d = DEEDS[name];
  if (!d) return;
  var k = (name === "bought" || name === "sold") ? Math.max(0.05, Math.min(3, (+n || 0) / 50)) : 1;
  d.forEach(function (p) { practice(p[0], p[1] * k); });
}
/* шаг: выносливость; с тяжёлым грузом — ещё сила и телосложение */
function step() {
  var s = S(); if (!s) return;
  var r = LAB.load ? LAB.load.ratio() : 0;
  practice("stam", 0.02 + (r > 0.5 ? 0.05 * Math.min(1.5, r) : 0));
  if (r > 0.6) { practice("str", 0.02 * Math.min(1.5, r)); practice("con", 0.015 * Math.min(1.5, r)); }
}
function hurt(fin) {
  S().recoverAt = nowM() + 4;
  if (fin >= 3) practice("con", 0.3);
}
function healed(n) { if (n > 0) practice("regen", n / 25); }
function neuro(d) { if (d > 0) practice("ment", d / 12); }
/* вне боя здоровье возвращается само: регенерация (минуты игры) */
function minutes(min, event) {
  var s = S(), g = G(); if (!s || !min || g.dead) return;
  var r = K.regen(); if (r <= 0 || g.hp >= g.hpMax) return;
  if (LAB.combat && LAB.combat.danger && LAB.combat.danger()) return;
  if (event === "airloss" || event === "smoke" || (g.body && (g.body.food < 20 || g.body.tox >= 65 || g.body.rad >= 70)) || (g.st && (g.st.bleed > 0 || g.st.poison > 0))) return;
  min = Math.max(0, min - Math.max(0, (s.recoverAt || 0) - nowM()));
  s.rg = (s.rg || 0) + r * min;
  if (s.rg >= 1) { var n = Math.floor(s.rg); s.rg -= n; g.hp = Math.min(g.hpMax, g.hp + n); UIx("refresh"); }
}

/* ── ЦЕНА ЕДИНИЦЫ ── (просьба автора: с каждым уровнем — дольше и труднее) чем выше характеристика, тем дороже
   поднять её очками: до двадцати — очко за единицу, с двадцати — два, с тридцати — три, с сорока — четыре, с
   пятидесяти — пять. Так и практика: цена единицы растёт с характеристикой (need), и уровни героя: каждый следующий
   стоит больше опыта (LAB.xpNeed). Одна характеристика от десяти до сорока — шестьдесят очков, то есть триста
   уровней героя без практики; на предел всех пяти очков одних уровней не хватит до самых глубин. */
function costAt(v) { return 1 + Math.floor(Math.max(0, v - 10) / 10); }
function cost(k) { return costAt(base(k)); }
/* сколько очков стоит поднять на n единиц (не выше предела) */
function costN(k, n) { var v = base(k), m = capOf(k), c = 0; for (var i = 0; i < n && v + i < m; i++) c += costAt(v + i); return c; }
/* на сколько единиц хватит p очков */
function affordable(k, p) { var v = base(k), m = capOf(k), n = 0; while (v + n < m && costAt(v + n) <= p) { p -= costAt(v + n); n++; } return n; }
function ptsW(n) { return n + " " + plural(n, "очко", "очка", "очков"); }

/* ── УРОВЕНЬ ГЕРОЯ ── очко — на каждом пятом уровне; всё на пределе — опыт уровня уходит в здоровье */
function nextPtLevel(l) { return (Math.floor(l / PTS_EVERY) + 1) * PTS_EVERY; }
/* Сохраняем число уже обработанных вех отдельно от остатка очков. */
function restoreMilestones(backupLevel) {
  var g = G(), legacy = !!g.chs && g.chs.milestones == null, s = S();
  var reached = Math.floor(g.lvl / PTS_EVERY);
  if (legacy) {
    s.milestones = reached;
    /* В первых сохранениях с характеристиками расходовалось только общее число
       очков. Точный уровень перехода может указать игрок один раз. */
    var proved = Math.min(reached, Math.floor((backupLevel || 0) / PTS_EVERY));
    if (proved < reached) {
      s.milestoneRecoveryMin = proved;
      s.milestoneRecoveryMax = reached;
    }
    s.pts += proved;
    return proved;
  }
  var missed = Math.max(0, reached - s.milestones);
  s.milestones = Math.max(s.milestones, reached);
  s.pts += missed;
  return missed;
}
function legacyMenu() {
  var s = S(), max = s.milestoneRecoveryMax;
  if (!max) return;
  var credited = s.milestoneRecoveryMin || 0, n = max;
  UIx("menu", "Очки за уровни до появления характеристик", [
    { label: "Укажите последний уровень героя в старой версии, где характеристик ещё не было. Если все очки уже получены, закройте окно.", info: true, keep: true, fn: function () {} },
    { kind: "slider", label: "Последняя пропущенная веха. Подтвердить возврат один раз", min: credited + 1, max: max, step: 1,
      get: function () { return n; }, set: function (v) { n = v; },
      fmt: function (v) { return "уровень " + v * PTS_EVERY + ", вернуть " + ptsW(v - credited); },
      fn: function () {
        if (G().chs !== s || !s.milestoneRecoveryMax) return;
        delete s.milestoneRecoveryMax;
        delete s.milestoneRecoveryMin;
        s.pts += n - credited;
        gm().autosaveSoon();
        UIx("closeTop", true);
        UIx("rebuildTop");
        say("Восстановлено за пропущенные уровни: " + ptsW(n - credited) + ".");
      } },
    { label: "Назад", close: true }
  ]);
}
function onLevel() {
  var s = S(), g = G(), reached = Math.floor(g.lvl / PTS_EVERY);
  if (reached <= s.milestones) return " Следующее очко характеристик — на " + nextPtLevel(g.lvl) + "-м уровне.";
  var n = reached - s.milestones;
  s.milestones = reached;
  var room = MAIN.reduce(function (a, k) { return a + costN(k, capOf(k) - base(k)); }, 0) - (s.pts || 0);
  if (room <= 0) { g.hpMax += 5 * n; g.hp = g.hpMax; return " Характеристики на пределе: уровень дал дополнительное здоровье."; }
  s.pts = (s.pts || 0) + n;
  return " Очко характеристик" + (s.pts > 1 ? ", теперь их " + s.pts : "") + " — " + LAB.K("окно «Характеристики»: " + LAB.gw("stats", "тройное касание тремя пальцами"), "окно «Характеристики»: Shift+C") + ".";
}
function spend(k, n) {
  if (MAIN.indexOf(k) < 0) return false;
  var s = S();
  if (!s) return false;
  var got = Math.min(n == null ? 1 : Math.floor(n), affordable(k, s.pts || 0));
  if (!(got > 0)) return false;
  var v0 = base(k), paid = costN(k, got);
  s.pts -= paid; raise(k, got);
  var th = thCross(k, v0, base(k)), c = base(k) < capOf(k) ? cost(k) : 0;
  snd("stat_up", "ui_levelup");
  if (gm().autosaveSoon) gm().autosaveSoon();
  say(cap1(NAME[k]) + " " + base(k) + (paid > got ? " — за " + ptsW(paid) : "") + ". " + (s.pts ? "Осталось очков: " + s.pts + "." : "Очки распределены.") + (c > 1 ? " Следующая единица — " + ptsW(c) + "." : "") + (th ? " " + th : ""));
  return true;
}
function spreadPlan() {
  var left = S().pts || 0, values = {}, deltas = {};
  MAIN.forEach(function (k) { values[k] = base(k); deltas[k] = 0; });
  var ordered = function (a, b) { return values[a] - values[b] || MAIN.indexOf(a) - MAIN.indexOf(b); };
  while (left > 0) {
    var k = MAIN.filter(function (s) { return values[s] < capOf(s) && costAt(values[s]) <= left; }).sort(ordered)[0];
    if (!k) break;
    left -= costAt(values[k]);
    values[k]++;
    deltas[k]++;
  }
  return { keys: MAIN.filter(function (k) { return deltas[k] > 0; }), deltas: deltas, values: values, left: left };
}
function spreadText(plan) {
  return plan.keys.map(function (k) { return NAME[k] + " плюс " + plan.deltas[k] + ", итог " + plan.values[k]; }).join(". ");
}
function spread() {
  var s = S(), plan = spreadPlan();
  if (!plan.keys.length) { LAB.UI && LAB.UI.error && LAB.UI.error(); say("Очков не хватает: сейчас у вас " + ptsW(s.pts || 0) + "."); return false; }
  var thresholds = plan.keys.map(function (k) { return thCross(k, base(k), plan.values[k]); }).filter(Boolean);
  s.pts = plan.left;
  plan.keys.forEach(function (k) { raise(k, plan.deltas[k]); });
  snd("stat_up", "ui_levelup");
  if (gm().autosaveSoon) gm().autosaveSoon();
  say("Распределено. " + cap1(spreadText(plan)) + "." + (s.pts ? " Осталось " + ptsW(s.pts) + "." : "") + (thresholds.length ? " " + thresholds.join(" ") : ""));
  return true;
}
function spreadMenu() {
  var plan = spreadPlan();
  if (!plan.keys.length) { spread(); return; }
  var label = "Подтвердить. " + cap1(spreadText(plan)) + ". Останется " + ptsW(plan.left) + ".";
  UIx("menu", "Распределить поровну", [
    { label: label, fn: function () {
      var current = spreadPlan();
      if (current.left !== plan.left || spreadText(current) !== spreadText(plan)) {
        UIx("closeTop", true); spreadMenu(); return;
      }
      if (spread()) { UIx("closeTop", true); UIx("rebuildTop"); }
    } },
    { label: "Назад", close: true, fn: function () {} }
  ]);
}

/* ── ОКНО «ХАРАКТЕРИСТИКИ» ── */
function statLabel(k) {
  var s = S(), v = base(k), b = val(k), m = capOf(k), isSec = SEC.indexOf(k) >= 0;
  var px = Math.floor(s.px[k] || 0), st = Math.floor(store(k));
  return cap1(NAME[k]) + " " + v + (b !== v ? " (с плодом " + b + ")" : "") + " из " + m + (v >= m ? ", предел" : "") + ". " + cap1(effects(k)) + "." +
    (v < m && !isSec && cost(k) > 1 ? " Очками — " + ptsW(cost(k)) + " за единицу." : "") +
    (v < m ? " Практика: " + px + " из " + need(k) + (s.day[k] === today() && (s.px[k] || 0) >= need(k) ? ", подрастёт завтра" : "; запас практики " + st + " из " + RATE * STORE_H) + "." : "") + (isSec ? " Растёт " + GROWS[k] + "." : "");
}
function items() {
  var s = S(), its = [];
  its.push({ label: function () { return s.pts ? "Очков для распределения: " + s.pts + ". Выберите характеристику, чтобы вложить очко." : "Свободных очков нет: очко приходит на каждом пятом уровне героя, следующее — на " + nextPtLevel(G().lvl || 1) + "-м."; }, info: true, keep: true, fn: function () { say(s.pts ? "Очков для распределения: " + s.pts + "." : "Свободных очков нет. Следующее — на " + nextPtLevel(G().lvl || 1) + "-м уровне героя."); } });
  MAIN.forEach(function (k) { its.push({ label: function () { return statLabel(k); }, fn: function () { statMenu(k); } }); });
  SEC.forEach(function (k) { its.push({ label: function () { return statLabel(k); }, info: true, keep: true, fn: function () { say(statLabel(k)); } }); });
  if (s.pts) its.push({ label: "Распределить поровну. Посмотреть итог и подтвердить", fn: spreadMenu });
  if (s.milestoneRecoveryMax) its.push({ label: "Вернуть пропущенные очки из старой версии", fn: legacyMenu });
  its.push({ label: "Как растут характеристики", fn: function () { UIx("note", "Как растут характеристики", HOWTO()); } });
  its.push({ label: "Назад", fn: function () {} });
  return its;
}
function HOWTO() {
  return "Характеристики растут медленно, и каждая следующая единица — труднее. Очко характеристик приходит на каждом пятом уровне героя, а каждый уровень героя стоит больше опыта, чем прежний. Вложите очко сами: выберите характеристику и «Вложить очко». Чем выше характеристика, тем дороже единица: до двадцати — очко, с двадцати — два, с тридцати — три, с сорока — четыре, с пятидесяти — пять. Вложенное назад не вынуть. " +
    "Растут они и от дел — практикой: сила — от ближнего боя, разбора и ходьбы с тяжёлым грузом; ловкость — от стрельбы, ловушек, отмычек и тонкой работы; телосложение — от ран, ядов и долгих переходов; интеллект — от взлома, головоломок, книг и опытов; харизма — от поручений, торговли и разговоров. " +
    "Практика привязана к настоящему времени: у каждой характеристики свой запас практики, он пополняется, только пока вы играете, — двадцать единиц за час игры, впрок не больше чем на два часа. Свёрнутая игра, пауза, капсула и простой не в счёт, сон, что проматывает сутки комплекса, тоже. Повторять одно дело без конца бесполезно: запас иссяк — дела этой характеристике пока ничего не дают. Чем выше характеристика, тем больше практики нужно на следующую единицу, и подрастает она не чаще раза в сутки комплекса. " +
    "Выносливость, ментал и регенерация очками не растут — только повторением: шаги и груз, пережитая нейронагрузка, лечение и отдых. " +
    "Предел основных — сорок, ниже Истока — шестьдесят; вторичных — тридцать. Пороги — в описании каждой характеристики: дойдёте — «Эхо» скажет, что открылось.";
}
function menu() {
  if (!gm().entered || !S()) return;
  UIx("menu", "Характеристики", items(), { rebuild: items, intro: S().pts ? "Очков для распределения: " + S().pts + "." : "" });
}
function pointPreview(k, n) {
  var snippets = [];
  if (LAB.load && (k === "str" || k === "con")) {
    var l = LAB.load, delta = l.statCapacity(k, val(k) + n) - l.statCapacity(k, val(k));
    snippets.push("Предел груза плюс " + l.kg(delta) + ".");
  }
  if (k === "con") snippets.push("Максимум здоровья плюс " + (5 * n) + ".");
  if (k === "agi") snippets.push("Точность и уклонение плюс " + pw(n) + ".");
  var crossed = thCross(k, base(k), base(k) + n);
  if (crossed) snippets.push(crossed);
  return snippets.length ? ". " + snippets.join(" ") : "";
}
function statMenu(k) {
  var s = S(), v = base(k), m = capOf(k);
  var its = [];
  if (v >= m) its.push({ label: cap1(NAME[k]) + " на пределе: " + m + ".", info: true, keep: true, fn: function () { say(cap1(NAME[k]) + " на пределе."); } });
  else if (!s.pts) its.push({ label: "Очков нет: очко приходит на каждом пятом уровне героя, следующее — на " + nextPtLevel(G().lvl || 1) + "-м.", info: true, keep: true, fn: function () { say("Очков нет."); } });
  else if (cost(k) > s.pts) its.push({ label: "Поднять " + NAMEA[k] + " до " + (v + 1) + " стоит " + ptsW(cost(k)) + ", у вас " + s.pts + ": чем выше характеристика, тем дороже единица. Копите очки — или растите " + NAMEA[k] + " делами.", info: true, keep: true, fn: function () { say("Не хватает очков: нужно " + cost(k) + "."); } });
  else {
    var c1 = cost(k), nAll = affordable(k, s.pts);
    its.push({ label: (c1 > 1 ? "Вложить " + ptsW(c1) : "Вложить очко") + ": " + NAME[k] + " станет " + (v + 1) + ". Очков останется " + (s.pts - c1) + pointPreview(k, 1), fn: function () { spend(k, 1); UIx("closeTop", true); UIx("rebuildTop"); } });
    if (nAll > 5) its.push({ label: "Поднять на пять: " + NAME[k] + " станет " + (v + 5) + ", это " + ptsW(costN(k, 5)) + pointPreview(k, 5), fn: function () { spend(k, 5); UIx("closeTop", true); UIx("rebuildTop"); } });
    if (nAll > 1) its.push({ label: "Поднять на " + nAll + ": " + NAME[k] + " станет " + (v + nAll) + ", это " + ptsW(costN(k, nAll)) + (s.pts - costN(k, nAll) ? ", останется " + (s.pts - costN(k, nAll)) : "") + pointPreview(k, nAll), fn: function () { spend(k, nAll); UIx("closeTop", true); UIx("rebuildTop"); } });
  }
  if (v < m) its.push({ label: "Цена единицы очками: до 20 — очко, с 20 — два, с 30 — три, с 40 — четыре, с 50 — пять. Сейчас — " + ptsW(cost(k)) + ".", info: true, keep: true, fn: function () { say("Сейчас единица стоит " + ptsW(cost(k)) + "."); } });
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
  deed: deed, step: step, hurt: hurt, healed: healed, neuro: neuro, minutes: minutes, practice: practice, playMin: playMin, store: store,
  PTS_EVERY: PTS_EVERY, RATE: RATE, STORE_H: STORE_H, nextPtLevel: nextPtLevel, costAt: costAt, cost: cost, costN: costN, affordable: affordable,
  _play: function (min) { var s = S(); if (s) s.play = (s.play || 0) + min * 60; }, _tick: playTick, /* для проверок: минуты игры */
  restoreMilestones: restoreMilestones, onLevel: onLevel, spend: spend, spread: spread, raise: raise, menu: menu, statMenu: statMenu, charLine: charLine, effects: effects, thNext: thNext,
  calm: calm, calmV: calmV, calmLeft: calmLeft /* (5.0) спокойствие у воды */
};
})();
