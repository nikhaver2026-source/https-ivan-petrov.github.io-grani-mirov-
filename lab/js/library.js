/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — книги и бумаги, звук и связь (3.6).
   (Просьба автора: «расширь помещения, добавь интерактивных объектов, продумай
   книги, документы, папки и записки — много, интересно, разнообразно, и про
   историю, и просто почитать».)
   Тексты — library_texts.js (исходники lab/tools/texts_src/lib_*.json, формат —
   lab/tools/blocks/LIB_SPEC.md) и прежние книги кабинетов (annex_texts.js).
   Вещи (fixtures_data.js) и что с ними делать:
   • книжный шкаф и книжная полка — книги; прочитанная впервые учит: схеме
     мастерской (техника), рецептуре химического стола (химия), интеллекту
     (наука, каждые три), умениям (три–четыре книги раздела: «Полевой медик»,
     «Тихий шаг», «Свинцовая кожа», «Сапёр», «Твёрдая рука», «Купец», «Глубокий
     сон», «Чутьё», «Глубокий вдох»); художественные снимают нейронагрузку;
   • архивный стеллаж и картотечный шкаф — дела, приказы, протоколы, личные
     дела людей этажа; бывает служебная записка с настоящим кодом сейфа,
     компьютера или двери этого этажа;
   • подшивка газет, магнитофон (порванную плёнку клеят монтажной лентой, срезав
     концы наискось, или бобину забирают на продажу), аппарат для
     микрофильмов (работает, когда на этаже есть питание), письменный стол с
     дневником, лабораторный журнал (бывает рецептура), витрина (таблички;
     экспонат — отмычкой тихо или разбив стекло громко);
   • библиотечный каталог — где на этаже книжные шкафы и сколько в них
     непрочитанного; навигатор ведёт к выбранному;
   • шредер — сложить полоски по порядку и прочитать, что хотели уничтожить;
   • решётка вентиляции — прислушаться, кто за стенами; селектор — подать
     вызов в другое помещение и увести туда машины; ячейки хранения — взлом
     или отмычка; почтовые ящики — письма людям этажа.
   Всё прочитанное — в архиве документов: «Книги», «Газеты», «Магнитофонные
   записи», «Дневники», «Микрофильмы», «Лабораторные журналы», «Музейные
   таблички», «Документы архива». Что лежит в вещи, решается, когда её впервые
   открыли, и хранится в записи игры; на этаже книги не повторяются, а
   непрочитанные попадаются чаще прочитанных.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB); /* и в проверке генератора (tests/world.test.js): hasAt */
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
function spend(m) { if (m > 0) gm().advanceTime(m); }
function ev(name, n) { if (LAB.ach) LAB.ach.ev(name, n == null ? 1 : n); }
function snd(id, fb) { if (LAB.Bank && LAB.Bank.has && LAB.Bank.has(id)) A("play", id); else if (fb) A("play", fb); }
function era() { return LAB.agen ? LAB.agen.eraOf(G().L) : "K"; }
function nowMin() { return (G().day || 0) * 1440 + (G().min || 0); }
function rng(o, tag) { return LAB.Rng(G().seed, "lib:" + tag + ":" + CUR().key + ":" + o.id); }
function roomOf(o) { var fl = CUR().fl; return o && o.room >= 0 ? fl.rooms[o.room] : null; }
function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function digits(c) { return String(c).split("").join(" "); }
function noPower() { var c = CUR(); return !!(c.fl && c.fl.needPower && !(c.fs && c.fs.power)); }
function danger() { return !!(LAB.combat && LAB.combat.danger && LAB.combat.danger()); }
function rec() { var g = G(); if (!g.lib) g.lib = {}; var r = g.lib; if (!r.read) r.read = {}; if (!r.cnt) r.cnt = {}; if (!r.mind) r.mind = 0; return r; }

/* ════════ ТЕКСТЫ ════════ */
/* прежние книги кабинетов (1.5) — в общую библиотеку, со своими разделами */
var OLD_CAT = { b01: "detective", b02: "fiction", b03: "children", b04: "nature", b05: "cook", b06: "tech", b07: "manual", b08: "scifi", b09: "philosophy", b10: "humor",
  b11: "science", b12: "nature", b13: "tech", b14: "acoustic", b15: "science", b16: "manual", b17: "memoir", b18: "memoir", b19: "detective", b20: "songs",
  b21: "children", b22: "nature", b23: "manual", b24: "nature" };
var IDX = null;
function idx() {
  if (IDX) return IDX;
  var I = { all: [], by: {}, kind: {} };
  var add = function (q) { if (!q || !q.id || I.by[q.id]) return; I.by[q.id] = q; I.all.push(q); (I.kind[q.kind] = I.kind[q.kind] || []).push(q); };
  ((LAB.LIB && LAB.LIB.items) || []).forEach(add);
  ((LAB.ANNEX_T && LAB.ANNEX_T.books) || []).forEach(function (b) { add({ id: "a_" + b.id, kind: "book", t: b.t, a: b.a, era: b.era, cat: OLD_CAT[b.id] || "fiction", x: b.x }); });
  /* таблицы ещё не загрузились — не запоминать пустое */
  if (I.all.length) IDX = I;
  return I;
}
function byId(id) { return idx().by[id] || null; }
function eraOk(q, e, L) { return String(q.era || "").indexOf(e) >= 0 && (!q.minL || q.minL <= L); }
/* (3.6) своих книг у «Подножия» и «Колыбели» немного — а на этаже они теперь не повторяются:
   туда спускали и книги «Ковчега» (у них своя примета — note) */
var UPBOOKS = { P: "K", C: "K" };
function poolOf(kind) {
  var e = era(), L = G().L, up = kind === "book" ? UPBOOKS[e] : null;
  return (idx().kind[kind] || []).filter(function (q) { return eraOk(q, e, L) || (!!up && eraOk(q, up, L)); });
}
/* Текст: абзацы, у дневника — записи; у книги с верхних глубин внизу — своя примета */
function bodyOf(q) { return q.pages ? q.pages.join("\n\n") : String(q.x || ""); }
function flat(s) { return String(s || "").replace(/\s*\n\n+\s*/g, " "); }
function note(q) {
  var e = era(), ee = String(q.era || "");
  if (q.kind !== "book") return "";
  if (e === "P" && ee.indexOf("P") < 0 && ee.indexOf("K") >= 0) return "На форзаце — штамп библиотеки «Ковчега»: книгу принесли сверху. ";
  if (e === "C" && ee.indexOf("C") < 0 && ee.indexOf("K") >= 0) return "Книга сверху, из «Ковчега»: в «Колыбели» её берегли — корешок подклеен, углы страниц разглажены. ";
  if (e === "O" && ee.indexOf("K") >= 0) return "Книга напечатана зеркально: «Эхо» переворачивает строки. ";
  if (e === "M" && /[KPCO]/.test(ee)) return "На корешке — инвентарный номер Складов памяти, на форзаце — штемпель: «Принято на хранение». ";
  if (e === "I" && /[KPCOM]/.test(ee)) return "Потрёпанный экземпляр: страницы проложены сухими листьями. ";
  return "";
}

/* ════════ ЛЮДИ ЭТАЖА В ДОКУМЕНТАХ (tpl) ════════ */
function people() {
  var out = [];
  CUR().fl.rooms.forEach(function (rm) { if (rm && rm.owner && rm.owner.g != null) out.push([rm.owner.g, rm.owner.post || "сотрудник", rm.owner.f ? 1 : 0]); });
  return out;
}
function anyone(r) {
  var ps = people();
  if (ps.length && r.chance(0.8)) return ps[r.int(0, ps.length - 1)];
  var posts = ["инженер", "лаборант", "техник", "оператор", "охранник", "диспетчер", "кладовщик", "врач"];
  return [LAB.depth(G().L, G().F) * 512 + 420 + r.int(0, 80), r.pick(posts), r.chance(0.5) ? 1 : 0];
}
function personOf(p, e) { return LAB.agen && LAB.agen.personByG ? LAB.agen.personByG(G().seed, p[0], p[1], e, p[2] ? true : null) : { first: "Анна", sur: "Иванова", fio: "Анна Иванова", io: "Анна", sign: "А. Иванова", post: p[1], f: !!p[2] }; }
/* подстановки — запоминаются ссылкой (src.c), текст собирается заново */
function ctxMake(o, q) {
  var r = rng(o, "tpl:" + q.id), rooms = CUR().fl.rooms.filter(function (m) { return m && m.num; }), rm = rooms.length ? rooms[r.int(0, rooms.length - 1)] : null;
  return { a: anyone(r), t: anyone(r), s: anyone(r), n1: rm ? rm.num : 1, n2: rooms.length ? rooms[r.int(0, rooms.length - 1)].num : 2, rn: rm ? rm.name : "Кладовая", tm: 6 * 60 + r.int(0, 140) * 5, wd: r.int(0, 6), e: era() };
}
function render(q, c) {
  var x = bodyOf(q);
  if (!q.tpl || !c || !LAB.agen || !LAB.agen.render) return x;
  var e = c.e || era();
  return LAB.agen.render(x, { au: personOf(c.a, e), to: personOf(c.t, e), s3: personOf(c.s, e), n1: c.n1, n2: c.n2, rn: c.rn, tm: c.tm, wd: c.wd });
}
function titleOf(q, c) { return q.tpl && c && LAB.agen ? LAB.agen.render(q.t, { au: personOf(c.a, c.e || era()) }) : q.t; }

/* ════════ АРХИВ ДОКУМЕНТОВ ════════ */
var CAT_N = { book: "Книги", doc: "Документы архива", paper: "Газеты", tape: "Магнитофонные записи", diary: "Дневники", film: "Микрофильмы", exhibit: "Музейные таблички", labbook: "Лабораторные журналы",
  specimen: "Этикетки препаратов", cage: "Карточки вивария", photo: "Фотографии" }; /* (3.6) исследования и опыты */
var RCAT = { experiment: 1, subject: 1, research: 1, autopsy: 1 };
function arcId(q, o) { return "lib:" + q.id + (q.tpl && o ? ":" + CUR().key + ":" + o.id : ""); }
function inArchive(q, o) { return !!G().notes[arcId(q, o)]; }
function archive(q, o, c) {
  var g = G(), id = arcId(q, o);
  if (g.notes[id]) return false;
  g.notes[id] = 1;
  if (q.hid) { var Rh = rec(); if (!Rh.hid) Rh.hid = {}; Rh.hid[q.id] = 1; } /* (3.6) тайнопись в архиве — её можно проявить */
  var src = { note: "lib", lib: q.id };
  if (q.tpl && c) src.c = c;
  g.noteList.push({ id: id, src: src, t: titleOf(q, c), a: q.a || "", L: g.L, F: g.F, pl: gm().placeName(g.x, g.y), cat: CAT_N[q.kind] || "Документы" });
  return true;
}
/* текст для архива: game.noteText — по ссылке src */
function noteText(it) {
  var q = byId(it.lib);
  if (!q) return { t: "Документ", x: "Текст не сохранился.", a: "" };
  return { t: titleOf(q, it.c), x: flat(note(q) + render(q, it.c)) + (q.hid ? (rec().rev && rec().rev[q.id] ? " Тайнопись между строк: " + flat(q.hid) : " «Эхо»: между строк — тайнопись, ещё не проявленная.") : ""), a: q.a || "" };
}

/* ════════ ЧЕМУ УЧАТ КНИГИ ════════ */
var CALM = { fiction: 12, detective: 10, adventure: 10, scifi: 10, humor: 16, poetry: 12, children: 10, songs: 12, memoir: 8, nature: 10, philosophy: 10, cook: 8, history: 6, sleep: 6 };
var PERK_BY = { med: ["medic", 4], acoustic: ["quiet", 3], rad: ["lead", 3], blast: ["sapper", 3], shoot: ["sharp", 3], trade: ["trader", 3], sleep: ["sleeper", 3], detective: ["searcher", 3], chem: ["lungs", 3] };
var CAT_W = { fiction: "повесть", detective: "детектив", adventure: "приключения", scifi: "фантастика", humor: "юмор", poetry: "стихи", children: "детская книга", songs: "песенник",
  memoir: "воспоминания", history: "история", nature: "о природе", philosophy: "размышления", cook: "кулинария", tech: "техника", science: "наука", med: "медицина",
  chem: "химия", rad: "радиация и защита", acoustic: "акустика", blast: "взрывное дело", shoot: "стрелковое дело", trade: "учёт и снабжение", sleep: "сон и отдых", manual: "справочник" };
var PERK_CAT = { med: "о медицине", acoustic: "об акустике", rad: "о радиации", blast: "о взрывном деле", shoot: "о стрельбе", trade: "об учёте", sleep: "о сне", detective: "детектива", chem: "о химии" };
function grantPerk(k) {
  var P = LAB.ach && LAB.ach.PERKS && LAB.ach.PERKS[k], g = G();
  if (!P) return "";
  if (!g.perks) g.perks = {};
  if (g.perks[k]) return "Умение «" + P.n + "» у вас уже есть — книга его закрепила.";
  g.perks[k] = 1;
  if (gm().journal) gm().journal("Умение из книг: «" + P.n + "».");
  if (LAB.UI && LAB.UI.fanfare) LAB.UI.fanfare();
  return "Новое умение «" + P.n + "»: " + P.d + ".";
}
function chemLearn(q) {
  var C = LAB.chem;
  if (!C || !C.RC || !C.learn) return "";
  var L = G().L, pool = C.RC.filter(function (rc) { return rc.f && rc.lv <= 1 + Math.floor(L / 3) && !C.known(rc) && (LAB.ITEMS[rc.out] || String(rc.out).indexOf("ammo:") === 0); });
  if (!pool.length) return "Рецептуры из этой книги вы уже знаете.";
  var rc = pool[h32("chembook:" + q.id) % pool.length];
  return C.learn(rc.id, "Её описала книга «" + q.t + "».") ? "Рецептура — в химическом журнале «Эхо»." : "";
}
function bookEffect(q) {
  var R = rec(), c = q.cat || "fiction", msg = [], g = G();
  R.cnt[c] = (R.cnt[c] || 0) + 1;
  gm().gainXP(4 + Math.min(8, Math.round(bodyOf(q).length / 450)) + (c === "history" ? 6 : 0) + (c === "manual" ? 3 : 0));
  if (CALM[c]) { var m = []; gm().bodyApply({ neuro: -CALM[c] }, m); msg.push("Книга успокаивает" + (m.length ? ": " + m.join(" ") : ".")); }
  if (c === "science") {
    if (R.cnt.science % 3 === 0 && R.mind < 4) { R.mind++; g.mind = Math.min(40, (g.mind || 10) + 1); msg.push("Прочитанное складывается в голове: интеллект " + g.mind + "."); }
    else if (R.mind < 4) { var leftS = 3 - R.cnt.science % 3; msg.push("Ещё " + leftS + " " + pl(leftS, "книга", "книги", "книг") + " о науке — и интеллект вырастет."); }
  }
  if (c === "tech" && LAB.workshop && LAB.workshop.unknownPick) {
    var bp = LAB.workshop.unknownPick(g.L > 20 ? 3 : 2, "book:" + q.id) || LAB.workshop.unknownPick(4, "book:" + q.id);
    var tx = bp ? LAB.workshop.learn(bp.id, "Схема — из книги «" + q.t + "».", true) : "";
    msg.push(tx || "Ничего нового для мастерской: всё, что в книге, вы уже умеете.");
  }
  if (c === "chem") { var ct = chemLearn(q); if (ct) msg.push(ct); }
  if (PERK_BY[c]) {
    var pk = PERK_BY[c], n = R.cnt[c];
    if (n === pk[1]) msg.push(grantPerk(pk[0]));
    else if (n < pk[1]) { var left = pk[1] - n, P = LAB.ach && LAB.ach.PERKS ? LAB.ach.PERKS[pk[0]] : null; if (P && !(g.perks && g.perks[pk[0]])) msg.push("Ещё " + left + " " + pl(left, "книга", "книги", "книг") + " " + PERK_CAT[c] + " — и придёт умение «" + P.n + "»."); }
  }
  g.stats.books = (g.stats.books || 0) + 1;
  ev("book", 1);
  return msg.join(" ");
}
/* прочие тексты: опыт, вехи; лабораторный журнал иногда учит рецептуре */
function docEffect(q, o) {
  var msg = [];
  gm().gainXP({ doc: 3, paper: 2, tape: 4, diary: 6, film: 10, exhibit: 1, labbook: 4, specimen: 2, cage: 2, photo: 4 }[q.kind] || 2);
  if (q.kind === "specimen" || q.kind === "cage" || q.kind === "photo" || q.kind === "labbook" || (q.kind === "doc" && RCAT[q.cat])) ev("research", 1); /* (3.6) исследования и опыты */
  if (q.kind === "paper") { var m = []; gm().bodyApply({ neuro: -5 }, m); }
  if (q.kind === "labbook" && h32("lab:" + q.id + ":" + G().seed) % 100 < 45) { var ct = chemLearn(q); if (ct && !/уже знаете/.test(ct)) msg.push(ct); }
  if (q.kind === "doc" && LAB.workshop && LAB.workshop.fromDoc && /report|protocol|act|instruction/.test(q.cat || "")) { var bt = LAB.workshop.fromDoc(arcId(q, o), "Технические журналы"); if (bt) msg.push(bt); }
  if (q.kind !== "exhibit" && q.kind !== "specimen" && q.kind !== "cage") { G().stats.notes = (G().stats.notes || 0) + 1; ev("note", 1); }
  ev({ paper: "paper", tape: "tape", diary: "diary", film: "film" }[q.kind] || "read", 1);
  return msg.join(" ");
}

/* ════════ ЧТО ЛЕЖИТ В ВЕЩИ ════════
   Решается при первом открытии и хранится в записи (st(o).lib): на этаже без
   повторов (fs.libUsed), непрочитанное — охотнее, книги — по назначению помещения. */
var BIAS = {
  lab: { science: 3, tech: 2, chem: 3, med: 2, rad: 2, acoustic: 1.5 },
  med: { med: 5, sleep: 2, chem: 1.5, science: 1.5 },
  school: { children: 4, science: 1.5, nature: 2, songs: 1.5, poetry: 1.5 },
  office: { manual: 2, trade: 2, history: 2, memoir: 1.5, detective: 1.5 },
  sec: { shoot: 4, blast: 3, manual: 2, detective: 2, adventure: 1.5 },
  rest: { fiction: 2, humor: 3, detective: 2, adventure: 2, poetry: 1.5, cook: 1.5 },
  live: { fiction: 2, poetry: 2, children: 1.5, memoir: 2, sleep: 2, cook: 1.5 },
  sound: { acoustic: 4, songs: 3, poetry: 1.5 },
  museum: { history: 4, memoir: 2 },
  store: { trade: 3, manual: 2, tech: 1.5 },
  arch: { history: 3, manual: 2, memoir: 1.5 },
  mail: { memoir: 2, fiction: 1.5 },
  bio: { science: 2, nature: 3, med: 1.5, chem: 1.5 }
};
/* (3.6) документы исследований — охотнее в лабораториях и медблоках, реже в прочих архивах */
var DOC_BIAS = { lab: { experiment: 3, subject: 3, research: 3, autopsy: 2 }, med: { subject: 3, autopsy: 3, medcard: 2, research: 1.5 }, arch: { experiment: 1, subject: 1, research: 1, autopsy: 0.6 }, any: { experiment: 0.4, subject: 0.4, research: 0.4, autopsy: 0.25 } };
var KN = { case: "book", shelf: "book", docs: "doc", paper: "paper", tape: "tape", diary: "diary", film: "film", exhibit: "exhibit", labbook: "labbook",
  specimen: "specimen", cage: "cage", photo: "photo", research: "doc", autopsy: "doc", subject: "doc" };
var COUNT = { case: [6, 10], shelf: [2, 4], docs: [4, 7], paper: [3, 5], tape: [2, 4], diary: [1, 1], film: [2, 3], exhibit: [3, 4], labbook: [2, 3], cabinet: [3, 5],
  specimen: [3, 5], cage: [2, 4], photo: [2, 4], research: [3, 5], autopsy: [1, 2], subject: [2, 3] };
function flavor(o) { return LAB.annex && LAB.annex.flavor ? LAB.annex.flavor(roomOf(o)) : "any"; }
function deal(o, which) {
  var s = st(o), key = "lib_" + which;
  if (s[key]) return s[key].map(byId).filter(Boolean);
  var kind = KN[which] || "doc", pool = poolOf(kind);
  if (which === "cabinet") pool = pool.filter(function (q) { return /personnel|report|memo|order|invoice|letter|medcard|act/.test(q.cat || ""); });
  /* (3.6) папки лаборатории, протоколы вскрытий, журналы наблюдения — из документов исследований */
  if (which === "research") pool = pool.filter(function (q) { return RCAT[q.cat]; });
  if (which === "autopsy") { var pa = pool.filter(function (q) { return q.cat === "autopsy"; }); pool = pa.length ? pa : pool.filter(function (q) { return RCAT[q.cat]; }); }
  if (which === "subject") { var ps = pool.filter(function (q) { return q.cat === "subject"; }); pool = ps.length ? ps : pool.filter(function (q) { return RCAT[q.cat]; }); }
  var fl0 = flavor(o), fsx = CUR().fs, used = fsx.libUsed = fsx.libUsed || {}, R = rec(), r = rng(o, "deal:" + which), b = kind === "book" ? BIAS[fl0] || {} : which === "docs" ? DOC_BIAS[fl0] || DOC_BIAS.any : {};
  var span = COUNT[which] || [2, 4], n = r.int(span[0], span[1]);
  var cand = pool.map(function (q) {
    var w = (used[q.id] ? 0.03 : 1) * (R.read[q.id] ? 0.2 : 1) * (b[q.cat] || 1);
    return { q: q, k: Math.pow(r.next() || 1e-9, 1 / Math.max(0.01, w)) };
  });
  cand.sort(function (x, y) { return y.k - x.k; });
  /* (3.6) на этаже без повторов: что уже лежит в другой вещи этажа, сюда не попадает (кроме
     бланков — у каждой вещи в них свои имена и числа). Без бланков вещь берёт не больше трети
     ещё не разложенного — тексты расходятся по этажу, а не ложатся в первые же шкафы;
     не осталось ничего — вещь пуста */
  cand = cand.filter(function (c) { return !used[c.q.id] || c.q.tpl; });
  var uniq = cand.filter(function (c) { return !c.q.tpl; }).length;
  if (uniq === cand.length) n = Math.min(n, Math.ceil(uniq / 3));
  var out = cand.slice(0, n).map(function (c) { return c.q; });
  out.forEach(function (q) { used[q.id] = 1; });
  s[key] = out.map(function (q) { return q.id; });
  return out;
}

/* ════════ ЧТЕНИЕ ════════ */
var LBL = {
  book: function (q, rd) { return "«" + q.t + "»" + (q.a ? ", " + q.a : "") + " — " + (CAT_W[q.cat] || "книга") + (rd ? ", прочитано" : ""); },
  doc: function (q, rd, c) { return "Папка: «" + titleOf(q, c) + "»" + (rd ? ", прочитано" : ""); },
  paper: function (q, rd) { return "«" + q.t + "»" + (rd ? ", прочитано" : ""); },
  tape: function (q, rd) { return "Бобина «" + q.t + "»" + (q.a ? ", голос: " + q.a : "") + (rd ? ", прослушано" : ""); },
  diary: function (q, rd) { return "Тетрадь: «" + q.t + "»" + (q.a ? ", " + q.a : "") + (rd ? ", прочитано" : ""); },
  film: function (q, rd) { return "Катушка «" + q.t + "»" + (rd ? ", прочитано" : ""); },
  exhibit: function (q, rd) { return "Экспонат: " + q.t + (rd ? ", прочитано" : ""); },
  labbook: function (q, rd) { return "Страница: «" + q.t + "»" + (rd ? ", прочитано" : ""); },
  specimen: function (q, rd) { return "Банка: " + q.t + (rd ? ", прочитано" : ""); },
  cage: function (q, rd) { return "Карточка: " + q.t + (rd ? ", прочитано" : ""); },
  photo: function (q, rd) { return "Снимок: «" + q.t + "»" + (rd ? ", рассмотрено" : ""); }
};
function isRead(q, o) { return q.tpl ? inArchive(q, o) : !!rec().read[q.id]; }
function ctxFor(q, o) {
  if (!q.tpl) return null;
  var s = st(o), m = s.libc = s.libc || {};
  if (!m[q.id]) m[q.id] = ctxMake(o, q);
  return m[q.id];
}
function readText(q, o) {
  var first = !isRead(q, o), c = ctxFor(q, o), body = render(q, c);
  var mins = Math.max(2, Math.min(30, Math.round(body.length / 380)));
  spend(mins);
  if (q.kind === "tape") snd("radio", "pc_click"); else if (q.kind === "film") snd("term_on", "paper"); else snd("paper_turn", "paper");
  var fx = "";
  if (first) {
    rec().read[q.id] = 1;
    archive(q, o, c);
    fx = q.kind === "book" ? bookEffect(q) : docEffect(q, o);
  }
  var head = q.kind === "tape" ? "Запись «" + q.t + "»" : q.kind === "exhibit" || q.kind === "specimen" || q.kind === "cage" ? q.t : q.kind === "photo" ? "Снимок: «" + q.t + "»" : "«" + titleOf(q, c) + "»";
  var by = q.a && q.kind !== "exhibit" ? (q.kind === "tape" ? "Говорит: " + q.a + ". " : q.a + ". ") : "";
  /* (3.6) тайнопись: проявленная — дочитывается; нет — «Эхо» замечает её */
  var hid = "";
  if (q.hid) {
    var R2 = rec(); if (!R2.hid) R2.hid = {};
    if (R2.rev && R2.rev[q.id]) hid = " Тайнопись между строк: " + flat(q.hid);
    else { R2.hid[q.id] = 1; hid = " «Эхо»: между строк — бледные разводы, будто писали молоком: тайнопись. Проявить её можно парами йода у химического стола или проявителем тайнописи."; }
  }
  UIx("note", head, by + flat(note(q) + body) + hid + (fx ? " «Эхо»: " + fx : ""));
  if (first && LAB.oko && LAB.oko.react && q.kind !== "exhibit") LAB.oko.react("note");
}
/* окно вещи: тексты, что в ней лежат; собирается заново, когда к нему возвращаются */
/* (3.6) заголовок — не как у окна самой вещи (fixtures.js): одноимённое окно ui.menu заменяет,
   и после чтения «назад» выводило бы в игру мимо пунктов вещи («Пошарить за книгами» и т. п.) */
var TITLE = { case: "Книжный шкаф: книги", shelf: "Книжная полка: книги", docs: "Архивный стеллаж: папки", paper: "Подшивка газет: выпуски", tape: "Магнитофон: бобины", diary: "Письменный стол: тетради", film: "Аппарат для чтения микрофильмов: катушки", exhibit: "Витрина: экспонаты", labbook: "Лабораторный журнал: страницы",
  specimen: "Стеллаж с препаратами: банки", cage: "Клетки вивария: карточки", photo: "Стенд с фотографиями: снимки", research: "Папки лаборатории: дела", autopsy: "Секционный стол: протоколы", subject: "Журнал наблюдения: записи" };
var EMPTY = { case: "Шкаф пуст: книги отсюда унесли.", shelf: "Полка пуста.", docs: "Коробки пусты: дела вывезли до карантина.", paper: "Подшивка пуста: остались одни нитки.", tape: "Коробки от бобин пусты.", diary: "В ящике пусто: тетрадь кто-то забрал.", film: "Коробки из-под плёнки пусты.", exhibit: "Таблички сняты, остались одни ножки.", labbook: "Журнал пуст: страницы вырваны.",
  specimen: "Банки пусты, этикетки отклеены.", cage: "Клетки пусты, карточки сорваны с дверец.", photo: "Стенд пуст: снимки сняли, остались кнопки.", research: "Ящики пусты: папки вывезли.", autopsy: "Планшет пуст: протоколы забрали.", subject: "Журнал на цепочке пуст: листы вырваны." };
function libItems(o, which) {
  var s = st(o), list = deal(o, which).filter(function (q) { return !(which === "tape" && s["took_" + q.id]); }), items = [];
  if (!list.length) return [{ label: EMPTY[which] || "Пусто.", info: true, keep: true, fn: function () { say(EMPTY[which] || "Пусто."); } }];
  var rd = 0;
  list.forEach(function (q) {
    var c = ctxFor(q, o), r0 = isRead(q, o); if (r0) rd++;
    if (which === "tape" && torn(o, q) && !s["fix_" + q.id]) {
      items.push({ label: "Бобина «" + q.t + "» — плёнка порвана", fn: function () { fixTape(o, q); } });
      return;
    }
    if (which === "diary" && q.pages) { items.push({ label: LBL.diary(q, r0), fn: function () { diaryMenu(o, q); } }); return; }
    items.push({ label: (LBL[q.kind] || LBL.doc)(q, r0, c), fn: function () { readText(q, o); } });
  });
  /* (3.7) у магнитофона бывает коробка с монтажной лентой — ей клеят порванную плёнку */
  if (which === "tape" && spliceBox(o) && !s.spliceTook) items.push({ label: "Коробка с монтажной лентой для плёнки — забрать", fn: function () { takeSplice(o); } });
  /* служебная записка с кодом этажа — в архивных коробках (иногда) */
  if (which === "docs") { var memo = codeMemo(o); if (memo) items.push({ label: "Папка без номера: «" + memo.t + "»" + (G().notes[memo.id] ? ", прочитано" : ""), fn: function () { readMemo(o, memo); } }); }
  var head = ({ "case": "Книг", shelf: "Книг", tape: "Бобин", exhibit: "Экспонатов", docs: "Папок", paper: "Выпусков", film: "Катушек", diary: "Тетрадей", labbook: "Страниц", specimen: "Банок", cage: "Карточек", photo: "Снимков", research: "Папок", autopsy: "Протоколов", subject: "Записей" }[which] || "Текстов") + ": " + list.length + ", " + (which === "tape" ? "прослушано" : which === "photo" ? "рассмотрено" : "прочитано") + " " + rd + ".";
  items.unshift({ label: head, info: true, keep: true, fn: function () { say(head); } });
  return items;
}
function libMenu(o, which, p) {
  if (p && p.power && noPower()) { LAB.UI.error && LAB.UI.error(); say("Экран тёмный, лампа не горит: на этаже нет питания. Запустите магнетронную установку — и аппарат оживёт."); return; }
  if (which === "case" && G().libNav && G().libNav.id === o.id && G().libNav.key === CUR().key) G().libNav = null; /* дошли до шкафа из каталога */
  var build = function () { return libItems(o, which); };
  UIx("menu", TITLE[which] || "Тексты", build(), { rebuild: build });
}
/* дневник — по записям или подряд */
function diaryMenu(o, q) {
  var build = function () {
    var items = q.pages.map(function (p, i) {
      var first = String(p).split(/[.!?…]/)[0].slice(0, 60);
      return { label: "Запись " + (i + 1) + ": " + first + "…", fn: function () { readPage(o, q, i); } };
    });
    items.unshift({ label: "Читать всё подряд", fn: function () { readText(q, o); } });
    return items;
  };
  UIx("menu", "«" + q.t + "»", build(), { rebuild: build });
}
function readPage(o, q, i) {
  spend(1); snd("paper_turn", "paper");
  var s = st(o), seen = s["pg_" + q.id] = s["pg_" + q.id] || {};
  seen[i] = 1;
  var all = q.pages.every(function (p, k) { return seen[k]; }), fx = "";
  if (all && !isRead(q, o)) { rec().read[q.id] = 1; archive(q, o, null); fx = docEffect(q, o); }
  UIx("note", "«" + q.t + "», запись " + (i + 1), q.pages[i] + (fx ? " «Эхо»: тетрадь прочитана целиком и легла в архив документов. " + fx : ""));
}
/* ── магнитофон: порванная плёнка ──
   (3.7, просьба автора: «плёнка, склеенная изолентой, работать не будет») Изолентой её
   не склеить: толстая лента не пройдёт между роликами, клей сползёт на головки, и склейку
   зажуёт. Клеят тонкой монтажной лентой, срезав концы наискось и сведя встык; коробка с
   ней бывает у самого магнитофона. Или бобину забирают: запись цела, и её купят связисты
   и архивисты — склеят на монтажном столе и перепишут. */
/* монтажная лента (splice) и бобина с порванной плёнкой (reel_torn) — в общей таблице вещей (data.js):
   из них же клеят петлю с песней слоя (b1.js) */
function torn(o, q) { return h32(o.id + ":" + q.id + ":" + CUR().key) % 3 === 0; }
function spliceBox(o) { return h32(o.id + ":splice:" + CUR().key) % 2 === 0; }
var TORN_WHY = "Плёнка порвана посередине, концы закручиваются в пальцах. Изолентой её не склеить: толстая лента не пройдёт между роликами, клей сползёт на головки, и склейку зажуёт. Плёнку клеят тонкой монтажной лентой, срезав концы наискось.";
function fixTape(o, q) {
  var g = G(), s = st(o), n = g.inv.splice || 0, items = [];
  if (n > 0) items.push({ label: "Склеить монтажной лентой: концы наискось, встык — мотков " + n, fn: function () {
    g.inv.splice--; s["fix_" + q.id] = 1; spend(4); snd("pc_click", null);
    say("Вы срезаете концы лезвием наискось, сводите их встык и прижимаете полоску монтажной ленты. Склейка проходит между роликами ровно, без щелчка.");
    ev("tapefix", 1);
    readText(q, o);
  } });
  items.push({ label: "Забрать бобину: запись цела — её купят связисты и архивисты", fn: function () {
    s["took_" + q.id] = 1; g.inv.reel_torn = (g.inv.reel_torn || 0) + 1; spend(1); snd("pick_part", "paper");
    say("Бобина с порванной плёнкой — в рюкзаке. Её купят связисты и архивисты: склеят на монтажном столе и перепишут запись.");
  } });
  items.push({ label: "Оставить как есть", fn: function () {} });
  UIx("menu", "Порванная плёнка", items, { intro: TORN_WHY + (n > 0 ? "" : " Монтажной ленты у вас нет: её коробку держат у магнитофонов.") });
}
function takeSplice(o) {
  var s = st(o), k = 1 + h32(o.id + ":splice2:" + CUR().key) % 2;
  s.spliceTook = 1; G().inv.splice = (G().inv.splice || 0) + k; snd("pick_part", "paper");
  say("Монтажная лента для плёнки, " + k + " " + pl(k, "моток", "мотка", "мотков") + ", и лезвие — в рюкзаке. Ей клеят порванную плёнку у магнитофона.");
}

/* ════════ СЛУЖЕБНАЯ ЗАПИСКА С КОДОМ ЭТАЖА ════════
   В архивных коробках и картотеках бывает записка о коде сейфа, компьютера
   или двери этого этажа: читаете — код ложится в архив, и замок о нём знает. */
function codeTargets(not) {
  var c = CUR(), fl = c.fl, fsx = c.fs || {}, g = G(), out = [], objs = fsx.objs || {};
  fl.objs.forEach(function (q) {
    var rm = fl.rooms[q.room];
    if (!rm || !rm.num || q.room === not) return;
    if (q.type === "safe" && q.code && !(objs[q.id] && objs[q.id].open) && !g.codes[q.code]) out.push({ code: q.code, what: "сейфа", rm: rm });
    if (q.pin && !(objs[q.id] && objs[q.id].hacked) && !g.codes[q.pin]) out.push({ code: q.pin, what: "компьютера", rm: rm });
  });
  fl.doors.forEach(function (d) { var rm = fl.rooms[d.room]; if (d.lock && d.lock.type === "code" && d.lock.code && rm && rm.num && !(fsx.doors && fsx.doors[d.id]) && !g.codes[d.lock.code]) out.push({ code: d.lock.code, what: "двери", rm: rm }); });
  return out;
}
var MEMO = {
  K: ["Служебная записка. Начальнику охраны этажа. Довожу до сведения, что код {что} в помещении {номер} («{имя}») записан на обороте графика дежурств и известен всей смене. Прошу сменить. До смены — {код}. {подпись}.",
      "Памятка для подменного дежурного. Если меня не будет — код {что} в помещении {номер} («{имя}»): {код}. Записку после прочтения уничтожить. Не уничтожили, конечно."],
  P: ["Докладная. Мастеру смены. Код {что} в помещении {номер} («{имя}») написан мелом на стене бытовки, а мел никто не стирает. Код: {код}. Прошу принять меры. Подпись неразборчива."],
  C: ["Записка на куске коры: «Кто будет искать, как открыть {что} в помещении {номер} — это {код}. Мы с Хором так договорились»."],
  O: ["Служебная записка, напечатанная задом наперёд. «Эхо» переворачивает строки: код {что} в помещении {номер} («{имя}») — {код}. Внизу подпись, которой нет."],
  M: ["Постановление Канцелярии. Код {что} помещения {номер} («{имя}») подлежит хранению в настоящей папке: {код}. Утратившим силу не считать. Штемпель, подпись Счетовода."],
  I: ["Тетрадный лист, прибитый к стене гвоздём: «Садовнику на смену. Код {что} в помещении {номер} — {код}. Поливать по вторникам»."]
};
function codeMemo(o) {
  var s = st(o);
  if (s.memo === 0) return null;
  if (!s.memo) {
    var r = rng(o, "memo"), tg = codeTargets(o.room);
    if (!tg.length || !r.chance(0.4)) { s.memo = 0; return null; }
    var t = tg[r.int(0, tg.length - 1)], tpl = (MEMO[era()] || MEMO.K)[r.int(0, (MEMO[era()] || MEMO.K).length - 1)];
    var p = personOf(anyone(r), era());
    s.memo = { id: "libmemo:" + CUR().key + ":" + o.id, code: t.code, room: t.rm.name, t: "Записка о коде " + t.what + ", помещение " + t.rm.num,
      x: tpl.replace("{что}", t.what).replace("{номер}", String(t.rm.num)).replace("{имя}", t.rm.name).replace("{код}", digits(t.code)).replace("{подпись}", p.sign + ", " + (p.post || "сотрудник")) };
  }
  return s.memo;
}
function readMemo(o, m) {
  var g = G(), first = !g.notes[m.id];
  spend(2); snd("paper_turn", "paper");
  if (first) {
    g.notes[m.id] = 1;
    g.noteList.push({ id: m.id, t: m.t, x: m.x, a: "", L: g.L, F: g.F, pl: gm().placeName(g.x, g.y), cat: "Служебные записки", code: m.code });
    g.codes[m.code] = m.room;
    g.stats.notes = (g.stats.notes || 0) + 1; ev("note", 1); gm().gainXP(6);
  }
  UIx("note", m.t, m.x + (first ? " «Эхо»: код запомнен — он в архиве документов, замок вам его подскажет." : ""));
}

/* ════════ КАРТОТЕЧНЫЙ ШКАФ (zones.js) ════════ */
function cabinetItems(o) {
  var list = deal(o, "cabinet"), items = [];
  list.forEach(function (q) { var c = ctxFor(q, o); items.push({ label: LBL.doc(q, isRead(q, o), c), fn: function () { readText(q, o); } }); });
  var memo = codeMemo(o); if (memo) items.push({ label: "Папка без номера: «" + memo.t + "»" + (G().notes[memo.id] ? ", прочитано" : ""), fn: function () { readMemo(o, memo); } });
  return items;
}
function cabinetMenu(o, back) {
  var build = function () { var it = cabinetItems(o); if (!it.length) it.push({ label: "Ящики пусты: папки вывезли.", info: true, keep: true, fn: function () {} }); return it; };
  UIx("menu", "Папки картотеки", build(), { rebuild: build });
}
/* книжная полка (zones.js): книги — из общей библиотеки */
function shelfBooks(o) {
  var g = G(); if (g.libNav && g.libNav.id === o.id && g.libNav.key === CUR().key) g.libNav = null; /* (3.6) дошли до полки из каталога */
  return deal(o, "shelf");
}

/* ════════ КАТАЛОГ ════════ */
function catalog(o) {
  var fl = CUR().fl, g = G(), list = [];
  spend(2); snd("paper", null);
  fl.objs.forEach(function (q) {
    if (!(q.type === "fx" && q.fx === "bookcase") && q.type !== "bookshelf") return;
    var rm = fl.rooms[q.room]; if (!rm || rm.hidden) return;
    var s = st(q), ids = s[q.type === "bookshelf" ? "lib_shelf" : "lib_case"], left = ids ? ids.filter(function (id) { return !rec().read[id]; }).length : -1;
    list.push({ o: q, rm: rm, d: Math.abs(q.x - g.x) + Math.abs(q.y - g.y), left: left, empty: !!ids && !ids.length });
  });
  list.sort(function (a, b) { return a.d - b.d; });
  if (!list.length) { say("Карточки каталога — на книги, которых на этаже больше нет."); return; }
  var items = list.slice(0, 12).map(function (e) {
    var what = e.o.type === "bookshelf" ? "книжная полка" : "книжный шкаф", where = e.rm.num ? "помещение " + e.rm.num + " («" + e.rm.name + "»)" : "«" + e.rm.name + "»";
    var lbl = cap(what) + ": " + where + ", " + gm().relDir(e.o.x, e.o.y) + (e.left < 0 ? ", вы там не были" : e.empty ? ", пусто" : e.left ? ", непрочитанных: " + e.left : ", всё прочитано");
    return { label: lbl, fn: function () { g.libNav = { key: CUR().key, id: e.o.id, n: what + ": " + where }; say("Навигатор поведёт: " + what + ", " + where + ". Цель — в списке навигатора."); } };
  });
  UIx("menu", "Каталог: книжных шкафов и полок на этаже — " + list.length, items);
  ev("catalog", 1);
}
function navTargets() {
  var g = G(), t = g && g.libNav;
  if (!t || t.key !== CUR().key) return [];
  var o = CUR().fl.objs.filter(function (q) { return q.id === t.id; })[0];
  return o ? [{ n: t.n || "книжный шкаф из каталога", o: o }] : [];
}

/* ════════ ШРЕДЕР ════════ */
function strips(text, n) {
  var words = flat(text).split(/\s+/), per = Math.ceil(words.length / n), out = [];
  for (var i = 0; i < n; i++) { var w = words.slice(i * per, (i + 1) * per); if (w.length) out.push(w.join(" ")); }
  return out;
}
function shred(o) {
  var s = st(o);
  if (s.shredDone) { say("В корзине шредера пусто: всё, что там было, вы уже сложили."); return; }
  if (!s.shred) {
    var r = rng(o, "shred"), memo = codeTargets(o.room).length && r.chance(0.5) ? codeMemo(o) : null, q = null;
    if (!memo) { var pool = poolOf("doc").filter(function (d) { return !d.tpl; }); q = pool.length ? pool[r.int(0, pool.length - 1)] : null; }
    if (!memo && !q) { say("В корзине — одна бумажная лапша: сложить нечего."); return; }
    var n = 4 + Math.min(2, Math.floor((LAB.blockOf ? LAB.blockOf(G().L) : 1) / 2));
    var txt = memo ? memo.x : bodyOf(q), ss = strips(txt, n), order = ss.map(function (x, i) { return i; });
    r.shuffle(order);
    if (order.every(function (v, i) { return v === i; })) order.reverse();
    s.shred = { memo: memo ? 1 : 0, q: q ? q.id : null, n: ss.length, order: order, got: [] };
  }
  shredMenu(o);
}
function shredParts(o) { var sh = st(o).shred, q = sh.q ? byId(sh.q) : null, txt = sh.memo ? codeMemo(o).x : q ? bodyOf(q) : ""; return strips(txt, sh.n); }
function shredMenu(o) {
  var build = function () {
    var sh = st(o).shred, parts = shredParts(o), items = [];
    if (!sh) return [{ label: "Корзина пуста.", info: true, keep: true, fn: function () {} }];
    items.push({ label: "Сложено полосок: " + sh.got.length + " из " + parts.length + ". Какая следующая?", info: true, keep: true, fn: function () { say(sh.got.length ? "Уже сложено: " + sh.got.map(function (i) { return parts[i]; }).join(" ") : "Пока не сложено ни одной полоски. Выберите ту, с которой текст начинается."); } });
    sh.order.forEach(function (i) {
      if (sh.got.indexOf(i) >= 0) return;
      items.push({ label: "Полоска: «" + parts[i] + "»", keep: true, fn: function () { shredPick(o, i); } }); /* окно остаётся: следующая полоска — тут же */
    });
    if (sh.got.length) items.push({ label: "Разобрать сложенное и начать сначала", keep: true, fn: function () { st(o).shred.got = []; spend(1); say("Вы снова раскладываете полоски по столу."); } });
    return items;
  };
  UIx("menu", "Полоски из шредера", build(), { rebuild: build, intro: "Листы рвали руками вдоль строк, и на каждой полоске — кусок текста. Полоски перемешаны: выбирайте их по порядку, сначала ту, с которой текст начинается." });
}
function shredPick(o, i) {
  var s = st(o), sh = s.shred, parts = shredParts(o);
  snd("paper", null);
  sh.got.push(i);
  if (sh.got.length < parts.length) { sayq("Полоска легла " + ["первой", "второй", "третьей", "четвёртой", "пятой", "шестой"][sh.got.length - 1] + "."); return; }
  var ok = sh.got.every(function (v, k) { return v === k; });
  if (!ok) {
    spend(2); sh.got = [];
    LAB.UI.error && LAB.UI.error();
    say("Текст не складывается: слова на стыках не сходятся. Полоски снова перемешаны — попробуйте ещё раз.");
    return;
  }
  s.shredDone = 1; spend(3);
  A("play", "code_ok");
  gm().gainXP(12); ev("shred", 1);
  UIx("closeAll");
  if (sh.memo) readMemo(o, codeMemo(o));
  else { var q = byId(sh.q); if (q) readText(q, o); }
}

/* ════════ ВИТРИНА ════════ */
function vitrine(o) {
  var s = st(o), g = G();
  if (s.vitOpen) { say("Дверца витрины открыта, экспонат вы уже забрали."); return; }
  var items = [];
  if ((g.inv.lockpick || 0) > 0) items.push({ label: "Открыть замок жёлтой отмычкой — отмычек " + g.inv.lockpick, fn: function () { g.inv.lockpick--; s.vitOpen = 1; spend(2); snd("door_unlock", "keypad"); vitLoot(o, "Замок щёлкнул тихо, без звона."); } });
  items.push({ label: "Разбить стекло — громко, машины и ОКО услышат", fn: function () {
    s.vitOpen = 1; spend(1); snd("ev_glass", null);
    if (LAB.combat && LAB.combat.noise) LAB.combat.noise(10);
    if (LAB.oko && LAB.oko.heat) LAB.oko.heat(6);
    var cut = rng(o, "cut").chance(0.25), hurt = "";
    if (cut) { g.hp = Math.max(1, g.hp - 3); hurt = " Осколок полоснул по пальцам: здоровье " + g.hp + "."; }
    vitLoot(o, "Стекло лопается с оглушительным звоном." + hurt);
  } });
  items.push({ label: "Не трогать", fn: function () {} });
  UIx("menu", "Дверца витрины", items);
}
function vitLoot(o, head) {
  /* (3.7, нелогичность) в витрине — экспонаты: ценные вещи, а не аптечки, батареи и кредиты */
  var r = rng(o, "vit"), L = G().L, F = G().F, loot = [], k = 1 + (r.chance(0.35) ? 1 : 0);
  for (var i = 0; i < k; i++) { var v = LAB.annexPick && LAB.annexPick(r, L, "valuable"); if (v && LAB.ITEMS[v]) loot.push({ kind: "item", item: v, n: 1 }); }
  if (!loot.length) loot.push({ kind: "credits", n: LAB.credits(20, L, F) });
  var got = loot.map(function (it) { return gm().giveItem(it); });
  say(head + " В витрине: " + got.join(" "));
  ev("vitrine", 1);
}

/* ════════ РЕШЁТКА ВЕНТИЛЯЦИИ ════════ */
function grate(o) {
  var g = G(), C = LAB.combat, fl = CUR().fl, here = fl.room[g.y * LAB.W + g.x];
  spend(1); snd("ev_vent_rattle", null);
  var foes = C && C.foes ? C.foes().filter(function (f) { return !f.dead && !f.ally && !f.calm && Math.abs(f.x - o.x) + Math.abs(f.y - o.y) <= 18; }) : [];
  var groups = {}, order = [];
  foes.forEach(function (f) {
    var rid = fl.room[f.y * LAB.W + f.x], d = Math.abs(f.x - o.x) + Math.abs(f.y - o.y);
    if (rid === here && rid >= 0) return;
    var k = rid >= 0 ? "r" + rid : "c";
    if (!groups[k]) { groups[k] = { rid: rid, n: 0, mech: 0, f: f, d: d }; order.push(k); }
    groups[k].n++; if (f.kind === "mech") groups[k].mech++;
    if (d < groups[k].d) { groups[k].d = d; groups[k].f = f; }
  });
  /* (3.6) сначала — ближние к решётке: этажи большие, и за стенами бывает много кого */
  order.sort(function (a, b) { return groups[a].d - groups[b].d; });
  var out = order.slice(0, 4).map(function (k) {
    var gp = groups[k], rm = gp.rid >= 0 ? fl.rooms[gp.rid] : null;
    var who = gp.mech === gp.n ? (gp.n === 1 ? "шаги одной машины" : "шаги машин: " + gp.n) : gp.mech === 0 ? (gp.n === 1 ? "возня твари" : "возня тварей: " + gp.n) : "машины и твари: " + gp.n;
    return (rm ? (rm.num ? "в помещении " + rm.num : "в «" + rm.name + "»") : "в коридоре") + " — " + who + ", " + gm().relDir(gp.f.x, gp.f.y);
  });
  var kv = era() === "K" && rng(o, "cat:" + nowMin()).chance(0.12);
  if (!out.length) say("Из шахты тянет сквозняком и далёким гулом. За стенами рядом тихо: никого не слышно." + (kv ? " Только где-то в глубине шахты коротко мяукает кот — и стихает, будто ушёл по своим делам." : ""));
  else say("«Эхо» разбирает звуки из шахты: " + out.join("; ") + "." + (kv ? " И ещё где-то далеко мяукает кот." : ""));
  if (kv) ev("kvark", 1);
  ev("listen_vent", 1);
}

/* ════════ СЕЛЕКТОР ════════ */
function intercom(o) {
  var s = st(o), t = nowMin(), fl = CUR().fl, g = G();
  if (noPower()) { say("Селектор мёртв: на этаже нет питания."); return; }
  if (s.icAt != null && t - s.icAt < 10) { var lf = 10 - (t - s.icAt); say("Реле селектора ещё горячее: снова — через " + lf + " " + pl(lf, "минуту", "минуты", "минут") + "."); return; }
  var here = fl.room[g.y * LAB.W + g.x];
  var rooms = fl.rooms.filter(function (rm) { return rm && rm.num && !rm.hidden && rm.id !== here; }).map(function (rm) { return { rm: rm, d: Math.abs(rm.cx - o.x) + Math.abs(rm.cy - o.y) }; });
  rooms.sort(function (a, b) { return a.d - b.d; });
  var items = rooms.slice(0, 10).map(function (e) {
    return { label: "Помещение " + e.rm.num + " («" + e.rm.name + "»), " + gm().relDir(e.rm.cx, e.rm.cy), fn: function () {
      s.icAt = nowMin(); spend(1); snd("pc_click", null);
      var n = LAB.combat && LAB.combat.noiseLure ? LAB.combat.noiseLure(e.rm.cx, e.rm.cy) : 0;
      if (LAB.oko && LAB.oko.heat) LAB.oko.heat(3);
      say("В помещении " + e.rm.num + " из динамика звенит вызов селектора. " + (n ? n + " " + pl(n, "машина пошла", "машины пошли", "машин пошли") + " на звук." : "На звук никто не отозвался."));
      ev("intercom", 1);
    } };
  });
  if (!items.length) { say("Клавиши селектора молчат: других помещений на линии нет."); return; }
  UIx("menu", "Селектор: куда подать вызов", items, { intro: "Вызов звенит в выбранном помещении: машины рядом с ним пойдут на звук. ОКО заметит, что селектором пользовались." });
}

/* ════════ ЯЧЕЙКИ ХРАНЕНИЯ ════════ */
function cells(o) {
  var s = st(o);
  if (!s.cells) {
    var r = rng(o, "cells"), n = r.int(4, 6), L = G().L, F = G().F, out = [], num = r.int(2, 60);
    for (var i = 0; i < n; i++) {
      var loot = r.chance(0.3) ? [] : (LAB.annexLoot ? LAB.annexLoot(r, L, F, r.pick(["smoke", "home", "paper", "smoke", "stash"]), "desk", true).filter(function (x) { return x.kind !== "weapon" && x.kind !== "armor"; }).slice(0, 2) : []);
      out.push({ n: num, open: 0, loot: loot });
      num += r.int(1, 3);
    }
    s.cells = out;
  }
  return s.cells;
}
function deposit(o) {
  var build = function () {
    return cells(o).map(function (c, i) {
      return c.open ? { label: "Ячейка " + c.n + ": открыта, пусто", info: true, keep: true, fn: function () { say("Ячейка " + c.n + " пуста."); } }
        : { label: "Ячейка " + c.n + ": заперта", fn: function () { cellMenu(o, i); } };
    });
  };
  UIx("menu", "Ячейки хранения", build(), { rebuild: build });
}
function cellMenu(o, i) {
  var c = cells(o)[i], g = G(), s = st(o), t = nowMin();
  if (s.jamAt != null && t - s.jamAt < 5) { say("Замки ещё звенят от неудачной попытки: подождите пару минут, пока охрана не перестанет прислушиваться."); return; }
  var items = [];
  if ((g.inv.lockpick || 0) > 0) items.push({ label: "Открыть жёлтой отмычкой — отмычек " + g.inv.lockpick, fn: function () { g.inv.lockpick--; spend(1); snd("door_unlock", "keypad"); openCell(o, c); } });
  items.push({ label: "Взломать замок: повторить сигналы", fn: function () {
    UIx("closeAll");
    if (!LAB.mini || !LAB.mini.hack) { openCell(o, c); return; }
    LAB.mini.hack(gm().hackLength(1 + Math.floor(Math.min(G().L, 30) / 6)), function (ok) {
      if (ok) { A("play", "code_ok"); gm().gainXP(4); openCell(o, c); }
      else if (gm().walkedAway && gm().walkedAway()) say("Вы отошли от ячейки. Замок цел."); /* (3.5) отошли, не ошибившись, — не провал */
      else { A("play", "code_fail"); s.jamAt = nowMin(); say("Замок не поддался и громко лязгнул. Рядом могли услышать."); if (LAB.combat && LAB.combat.noise) LAB.combat.noise(6); }
    });
  } });
  items.push({ label: "Отойти", fn: function () {} });
  UIx("menu", "Ячейка " + c.n, items);
}
function openCell(o, c) {
  c.open = 1;
  ev("cell", 1);
  if (!c.loot || !c.loot.length) { say("Ячейка " + c.n + " открыта. Внутри пусто: хозяин успел забрать вещи."); return; }
  var got = c.loot.map(function (it) { return gm().giveItem(it); });
  c.loot = [];
  say("Ячейка " + c.n + " открыта. Внутри: " + got.join(" "));
}

/* ════════ ПОЧТОВЫЕ ЯЩИКИ ════════ */
function mail(o) {
  var s = st(o);
  if (s.mail) { say("Ящики пусты: письма вы уже достали."); return; }
  s.mail = 1;
  var r = rng(o, "mail"), n = r.int(2, 4), got = [], L = G().L, F = G().F;
  spend(2); snd("paper", null);
  for (var i = 0; i < n; i++) {
    var tx = LAB.fixtures && LAB.fixtures.read ? LAB.fixtures.read("letters", o, r, i) : null;
    if (tx && tx.src) got.push(gm().giveItem(Object.assign({ kind: "note", id: o.id + "-m" + i }, tx.src)));
    else if (tx && gm().archiveAdd && gm().archiveAdd("mailbox:" + CUR().key + ":" + o.id + ":" + i, tx.t || "Письмо", tx.x, "", "Переписка")) got.push("письмо «" + (tx.t || "Письмо") + "» — в архиве документов.");
  }
  if (r.chance(0.3)) got.push(gm().giveItem({ kind: "credits", n: LAB.credits(4 + r.int(0, 10), L, F) }));
  say(got.length ? "Из ящиков — конверты: " + got.join(" ") : "Ящики пусты: только рекламные листки столовой.");
  ev("mailbox", 1);
}

/* ════════ (3.6) ИССЛЕДОВАНИЯ И ОПЫТЫ: стеллаж, клетки, смотровое окно ════════ */
/* образец ткани из треснувшей банки — один раз */
var SAMPLE_F = ["c_blood", "c_gland", "c_nerve", "c_venom", "c_chitin", "c_spores", "c_enzyme"];
function sample(o) {
  var s = st(o), C0 = LAB.chem;
  if (s.sampled) { say("Треснувшая банка пуста: образец вы уже взяли."); return; }
  if (!C0 || !C0.matId) { say("Банки запаяны намертво."); return; }
  s.sampled = 1; spend(2); snd("ev_glass", null);
  var r = rng(o, "sample"), L = G().L, list = SAMPLE_F.filter(function (f) { return C0.FAM[f] && (C0.FAM[f].depth || 1) <= Math.max(1, L); });
  var f = list[r.int(0, list.length - 1)], gr = C0.gradeAt(L, function () { return r.next(); }), id = C0.matId(f, gr, false);
  var got = gm().giveItem({ kind: "item", item: id, n: 1 });
  say("Вы осторожно вынимаете из треснувшей банки кусок ткани в растворе и заворачиваете его в пакет. " + got + " Ткань пригодится у химического стола: и для составов, и для анализа.");
  ev("sample", 1);
}
/* клетки вивария: что в них — решается при первом взгляде */
var CAGE = [
  "Клетки пусты: опилки сбиты в угол, поилки сухие. В одной на дверце — следы зубов, изнутри.",
  "В дальней клетке шуршит: белая крыса с рыжим пятном на боку смотрит на вас и не убегает. Она здесь одна — остальные клетки открыты и пусты.",
  "В нижней клетке — неподвижное тельце кролика под опилками. Давно. Карточку на дверце кто-то перечеркнул и подписал: «Не забыли. Не успели».",
  "Дверцы трёх клеток сорваны изнутри, прутья отогнуты наружу. На полу — следы, которые уходят к вентиляции.",
  "В клетках тихо, но поилки ещё качаются: кто-то пил совсем недавно. И этот кто-то сейчас слушает вас из темноты."
];
function cageLook(o) {
  var s = st(o), g = G();
  if (s.cage == null) s.cage = rng(o, "cage").int(0, CAGE.length - 1);
  spend(1); snd("ev_vent_rattle", null);
  var t = CAGE[s.cage];
  if (s.cage === 1 && !s.freed) {
    UIx("menu", "Клетки вивария", [
      { label: "Открыть дверцу и выпустить крысу", fn: function () { s.freed = 1; spend(1); gm().gainXP(4); ev("freed", 1); say("Крыса нюхает воздух, спрыгивает на пол и, не торопясь, уходит в щель у вентиляции. В виварии становится совсем тихо."); } },
      { label: "Оставить как есть", fn: function () {} }
    ], { intro: t });
    return;
  }
  say(s.cage === 1 && s.freed ? "Клетка открыта и пуста: крысу вы выпустили." : t);
}
/* смотровое окно бокса: стук — и иногда ответ */
var KNOCK = ["Тишина. Только ваш стук возвращается от стекла.", "Изнутри, через долгую паузу, — три ответных удара. Потом ничего.", "Что-то шаркает к стеклу и замирает по ту сторону. Вы слышите, как оно дышит.", "Из решёточки переговорного устройства — короткий треск, будто кто-то нажал кнопку и передумал.", "Ничего. Бокс пуст, но на стекле изнутри — отпечатки ладоней, на уровне вашего лица."];
function knock(o) {
  var s = st(o), n = s.knock = (s.knock || 0) + 1;
  spend(1); snd("door_knock", null);
  say(KNOCK[h32(o.id + ":" + CUR().key + ":" + n) % KNOCK.length]);
  if (n === 1) ev("knock", 1);
}
/* ════════ (3.6) ТАЙНОПИСЬ И ПЛЁНКИ (chemlab.js) ════════ */
function hiddenDocs() {
  var R = rec(), out = [];
  Object.keys(R.hid || {}).forEach(function (id) { var q = byId(id); if (q && q.hid && !(R.rev && R.rev[id])) out.push({ id: id, t: q.t }); });
  return out;
}
/* код этажа в тайнописи: иногда — если на этом этаже есть что открыть */
function hiddenCode(id) {
  var tg = codeTargets(-1), g = G();
  if (!tg.length || h32("hidcode:" + id + ":" + CUR().key) % 2) return "";
  var t = tg[h32("hidt:" + id + ":" + CUR().key) % tg.length], mid = "libhid:" + CUR().key + ":" + id;
  if (g.notes[mid]) return "";
  g.notes[mid] = 1; g.codes[t.code] = t.rm.name;
  g.noteList.push({ id: mid, t: "Тайнопись: код " + t.what + ", помещение " + t.rm.num, x: "Код " + t.what + " в помещении " + t.rm.num + " («" + t.rm.name + "»): " + digits(t.code) + ".", a: "", L: g.L, F: g.F, pl: gm().placeName(g.x, g.y), cat: "Служебные записки", code: t.code });
  return "Ниже, другой рукой и мельче: код " + t.what + " в помещении " + t.rm.num + " («" + t.rm.name + "») — " + digits(t.code) + ". «Эхо» запомнило код: замок вам его подскажет.";
}
function reveal(id) {
  var q = byId(id), R = rec();
  if (!q || !q.hid) return null;
  if (!R.rev) R.rev = {};
  R.rev[id] = 1;
  return { t: q.t, x: flat(q.hid), code: hiddenCode(id) };
}
/* проявленная плёнка: снимки глубины, сначала непросмотренные */
function filmLeft() { var R = rec(); return poolOf("photo").filter(function (q) { return !R.read[q.id]; }).length; }
function develop(n) {
  var R = rec(), pool = poolOf("photo"), fresh = pool.filter(function (q) { return !R.read[q.id]; }), list = fresh.length ? fresh : [];
  var out = [], r = LAB.Rng(G().seed, "film:" + (R.films = (R.films || 0) + 1));
  list = list.slice(); r.shuffle(list);
  list.slice(0, n).forEach(function (q) { R.read[q.id] = 1; archive(q, null, null); out.push({ t: q.t, x: flat(bodyOf(q)) }); });
  if (out.length) { gm().gainXP(3 * out.length); ev("photo", out.length); }
  return out;
}

/* (3.6) есть ли на этой глубине тексты для вещи, у которой только чтение (аппарат для
   микрофильмов и т. п.): генератор (annex.js, fillRoom) не ставит пустые — «коробки пусты» */
var HAS = {};
function hasAt(fx, e, L) {
  var mk = fx + ":" + e + ":" + L;
  if (HAS[mk] == null) HAS[mk] = hasAt0(fx, e, L);
  return HAS[mk];
}
function hasAt0(fx, e, L) {
  var T = LAB.FIX && LAB.FIX.T[fx], acts = (T && T.a) || [];
  if (!acts.length || acts.some(function (x) { return x[0] !== "lib" || !x[2] || !x[2].lib; })) return true;
  return acts.some(function (x) {
    var which = x[2].lib, list = (idx().kind[KN[which] || "doc"] || []).filter(function (q) { return eraOk(q, e, L); });
    if (which === "research" || which === "autopsy" || which === "subject") list = list.filter(function (q) { return RCAT[q.cat]; });
    return list.length > 0;
  });
}

/* ════════ ДЕЙСТВИЯ ВЕЩЕЙ (fixtures.js) ════════ */
function act(o, def, kind, p) {
  if (kind === "lib") { libMenu(o, p.lib, p); return true; }
  if (kind === "catalog") { catalog(o); return true; }
  if (kind === "shred") { shred(o); return true; }
  if (kind === "vitrine") { vitrine(o); return true; }
  if (kind === "grate") { grate(o); return true; }
  if (kind === "intercom") { intercom(o); return true; }
  if (kind === "deposit") { deposit(o); return true; }
  if (kind === "mail") { mail(o); return true; }
  if (kind === "sample") { sample(o); return true; }
  if (kind === "cage") { cageLook(o); return true; }
  if (kind === "knock") { knock(o); return true; }
  return false;
}
/* «Осмотреть»: что осталось непрочитанным */
function examineLine(o) {
  var s = st(o), w = o.type === "bookshelf" ? "lib_shelf" : o.fx === "bookcase" ? "lib_case" : null;
  if (w && s[w]) { var left = s[w].filter(function (id) { return !rec().read[id]; }).length; return left ? "Непрочитанных книг: " + left + "." : "Все книги отсюда вы прочитали."; }
  if (o.fx === "shredder" && s.shredDone) return "Полоски из корзины вы уже сложили.";
  if (o.fx === "vitrine" && s.vitOpen) return "Дверца открыта, экспонат забран.";
  if (o.fx === "mailboxes" && s.mail) return "Письма вы уже достали.";
  return "";
}

LAB.library = {
  act: act, noteText: noteText, navTargets: navTargets, examineLine: examineLine,
  cabinetMenu: cabinetMenu, cabinetItems: cabinetItems, shelfBooks: shelfBooks, readText: readText, isRead: isRead,
  codeMemo: codeMemo, deal: deal, byId: byId, pool: poolOf, index: idx, CAT_N: CAT_N, CAT_W: CAT_W, bookEffect: bookEffect,
  hiddenDocs: hiddenDocs, reveal: reveal, develop: develop, filmLeft: filmLeft, hasAt: hasAt
};
})();
