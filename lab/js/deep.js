/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — глубокие блоки VI–XV (после 4.1, просьба автора).
   Под Истоком Разлом уходит ниже: десять новых блоков, и каждый вдвое больше
   прежнего — 200 уровней, 400, 800 и так далее (SIZES). Блок — один огромный
   комплекс (испытательный, исследовательский, экспериментальный, лабораторный,
   жилой, медицинский…) со своими секторами, помещениями, полами, музыкой,
   машинами, тварями и людьми; формат файлов блоков — lab/tools/blocks/DEEP.md.

   Уровней в глубоких блоках сотни тысяч, поэтому:
   • уровень не хранится заранее: LAB.LEVELS[L] для L > 100 собирается по
     запросу из секторов блока (deepLevel) и держится в небольшом кэше;
   • пропуск уровня (LAB.TIERS[t] для t > 50) — тоже по запросу;
   • рост врагов, цен, находок и оружия идёт по «приведённой глубине»
     (LAB.effL): каждый глубокий блок прибавляет к ней двадцать уровней, как
     прежние блоки, — сколько бы уровней в нём ни было. Блок VI — приведённые
     уровни 100–120, блок VII — 120–140 … блок XV — 280–300. Вдвое больший блок
     не вдвое труднее: он вдвое длиннее, и пройти его помогают срезы (deep_floor.js).
   Этажи и записи уровней 1–100 не меняются: всё новое — только ниже сотого.
   Синтаксис — не новее ES2017; без DOM: файл читают и проверки в Node.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);

var BASE = 100;                                    /* последний уровень блока V «Исток» */
var SIZES = [200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400];
var FIRST = 6, LAST = FIRST + SIZES.length - 1;    /* блоки VI … XV */
var EFF_SPAN = 20;                                 /* приведённых уровней на глубокий блок */
var ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
LAB.ROMAN = ROMAN;
LAB.roman = function (n) { return ROMAN[n] || String(n); };

/* ── границы блоков ── */
var RANGE = [];
(function () {
  for (var b = 1; b <= 5; b++) RANGE[b] = { n: b, from: (b - 1) * 20 + 1, to: b * 20, size: 20 };
  var from = BASE + 1;
  for (var i = 0; i < SIZES.length; i++) { var n = FIRST + i; RANGE[n] = { n: n, from: from, to: from + SIZES[i] - 1, size: SIZES[i] }; from += SIZES[i]; }
})();
LAB.DEEP_FIRST = FIRST; LAB.DEEP_LAST = LAST; LAB.DEEP_BASE = BASE; LAB.DEEP_SIZES = SIZES;
LAB.blockRange = function (n) { return RANGE[n] || null; };
LAB.isDeep = function (L) { return L > BASE; };
var blockOf0 = LAB.blockOf;
LAB.blockOf = function (L) {
  if (L <= BASE) return blockOf0 ? blockOf0(L) : Math.max(1, Math.ceil(L / 20));
  for (var n = FIRST; n <= LAST; n++) if (L <= RANGE[n].to) return n;
  return LAST;
};

/* ── приведённая глубина ──
   До сотого уровня — сам уровень. Ниже — 100 + 20·log₂(1 + (L − 100)/200): каждый блок,
   вдвое больший прежнего, прибавляет ровно двадцать. Дробная — растёт и внутри блока. */
LAB.effL = function (L) {
  L = +L || 1;
  if (L <= BASE) return L;
  return BASE + EFF_SPAN * Math.log(1 + (L - BASE) / SIZES[0]) / Math.LN2;
};
/* Приведённый уровень целым числом — для формул, что растут прямо от номера уровня (яд, кровотечение,
   ЭМИ, импланты, напитки, опыт заданий): до сотого — сам уровень. */
LAB.Le = function (L) { L = +L || 1; return L <= BASE ? L : Math.round(LAB.effL(L)); };
/* Глубина для роста врагов, цен и находок (прежде (L − 1)·20 + (F − 1)): ниже сотого уровня —
   по приведённой глубине; этаж прибавляет свою долю шага до следующего уровня, так что глубина
   растёт без скачков назад и между уровнями. */
var depth0 = LAB.depth;
LAB.depth = function (L, F) {
  F = F || 1;
  if (L <= BASE) return depth0 ? depth0(L, F) : (L - 1) * LAB.FLOORS_N + (F - 1);
  var e = LAB.effL(L), step = LAB.effL(L + 1) - e;
  return Math.floor((e + step * (F - 1) / LAB.FLOORS_N) * LAB.FLOORS_N); /* сотый уровень кончается на 1999 — дальше от 2002 */
};
/* Номер уровня в блоке, с единицы (для глубоких — внутри огромного блока). */
LAB.levelInBlock = function (L) { var r = RANGE[LAB.blockOf(L)]; return r ? L - r.from + 1 : L; };

/* ════════ РЕЕСТР ГЛУБОКИХ БЛОКОВ ════════
   LAB.addDeep(n, часть): общие разделы (помещения, враги, стражи, оружие, броня, тексты…) —
   как у прежних блоков, через LAB.addBlock; свои — секторы, пропуск, лестницы, коридоры,
   полы помещений, вехи истории. Уровней в части нет: их строит deepLevel. */
var DEEP = {};
LAB.DEEP = DEEP;
LAB.addDeep = function (n, part) {
  var D = DEEP[n] = DEEP[n] || { n: n, sectors: [], milestones: {}, sectorStory: {}, pass: null, stairs: null, corr: null, roomSurf: {} };
  var common = {}, k;
  for (k in part) if (k !== "sectors" && k !== "pass" && k !== "stairs" && k !== "corr" && k !== "milestones" && k !== "sectorStory" && k !== "levels" && k !== "tiers" && k !== "roomSurf" && k !== "deep") common[k] = part[k];
  if (part.meta) { common.meta = {}; for (k in part.meta) common.meta[k] = part.meta[k]; common.meta.from = RANGE[n].from; common.meta.to = RANGE[n].to; }
  /* документы, записи камер, должности и почта глубокого блока — общие на весь блок (уровней сотни
     тысяч): в LORE под ключом «b6» … «b15», как у уровней наверху под их номерами */
  var key = "b" + n, LORE = LAB.LORE = LAB.LORE || { mail: {}, notices: [], logs: {}, docs: {}, cams: {}, posts: {} };
  ["docs", "cams", "posts"].forEach(function (f) { if (part[f] && Array.isArray(part[f])) { LORE[f] = LORE[f] || {}; LORE[f][key] = (LORE[f][key] || []).concat(part[f]); delete common[f]; } });
  if (part.mail && Array.isArray(part.mail)) { LORE.mail = LORE.mail || {}; LORE.mail[key] = (LORE.mail[key] || []).concat(part.mail); common.mail = { g: part.mail }; }
  /* глубина появления вещей: «at» — доля блока (0 — с начала, 1 — у дна) → номер уровня (depth),
     у рецептов — minL; детали — ещё и происхождение (с машин, с тварей, вещество аномалий) */
  var R0 = RANGE[n], atL = function (x) { return R0.from + Math.round(Math.max(0, Math.min(1, +x || 0)) * (R0.size - 1)); };
  ["weapons", "ammo", "items", "parts", "armors"].forEach(function (f) {
    var t = common[f]; if (!t) return;
    for (var id in t) { var x = t[id]; if (x.at != null) x.depth = atL(x.at); else if (!x.depth || x.depth <= BASE) x.depth = R0.from; }
  });
  if (common.recipes) common.recipes.forEach(function (rc) { if (rc.at != null) rc.minL = atL(rc.at); else if (!rc.minL || rc.minL <= BASE) rc.minL = R0.from; });
  if (common.parts) for (var pid in common.parts) { LAB.PART_FROM = LAB.PART_FROM || {}; if (!LAB.PART_FROM[pid]) LAB.PART_FROM[pid] = common.parts[pid].from || partFrom(common.parts[pid]); }
  var B = LAB.addBlock(n, common);
  if (part.deep) for (k in part.deep) D[k] = part.deep[k];
  if (part.sectors) part.sectors.forEach(function (s) { D.sectors.push(s); });
  if (part.pass) D.pass = part.pass;
  if (part.stairs) D.stairs = part.stairs;
  if (part.corr) D.corr = part.corr;
  if (part.roomSurf) for (k in part.roomSurf) D.roomSurf[k] = part.roomSurf[k];
  if (part.milestones) for (k in part.milestones) D.milestones[k] = part.milestones[k];
  if (part.sectorStory) for (k in part.sectorStory) D.sectorStory[k] = part.sectorStory[k];
  B.deep = D;
  cache = {}; cacheN = 0;
  levelsN();
  return B;
};
/* Откуда деталь блока, если блок не сказал (from): живое — с тварей, вещество слоя — аномалии, прочее — с машин. */
function partFrom(p) {
  var t = (p.n || "") + " " + (p.desc || "");
  if (/культур|мицели|фермент|закваск|ткан|кост|хитин|смол|кров|спор|желез|жил[аы]|мох|корен|семен|плоть|сухожил|чешу/i.test(t)) return "bio";
  if (/эхо|песн|звучащ|слоя|трещин|разлом|складк|осколок звук|время|тишин/i.test(t)) return "anom";
  return "mech";
}
/* Готов ли глубокий блок: есть секторы, и у каждого — помещения, враги и стражи из таблиц. */
function deepReady(n) {
  var D = DEEP[n];
  if (!D || !D.sectors.length || !LAB.BLOCKS[n]) return false;
  return D.sectors.every(function (s) {
    return s.rooms && s.rooms.length && s.rooms.every(function (r) { return LAB.ROOMS[r]; }) &&
      s.foes && s.foes.length && s.foes.every(function (f) { return LAB.FOES[f]; }) &&
      s.bosses && s.bosses.length && s.bosses.every(function (b) { return LAB.BOSSES[b]; });
  });
}
LAB.deepReady = deepReady;
/* Сколько всего уровней: прежние сто и глубокие блоки, готовые подряд от VI. Недописанный блок
   не ломает игру — дно там, где кончаются готовые. */
function levelsN() {
  var nL = LAB.LEVELS_N;
  if (nL < BASE) return nL;
  nL = BASE;
  for (var n = FIRST; n <= LAST && deepReady(n); n++) nL = RANGE[n].to;
  LAB.LEVELS_N = nL;
  return nL;
}
LAB.deepLevelsN = levelsN;

/* ════════ УРОВЕНЬ ГЛУБОКОГО БЛОКА ════════
   Блок делится на полосы уровней: в каждой полосе — один сектор блока. Полоса тем длиннее, чем
   больше блок (BANDS полос на блок): у блока VI — по пять уровней, у блока XV — по 2560. Секторы
   идут вперемешку, но два одинаковых подряд не стоят; первая полоса — вход в блок (sectors[0]),
   последняя — сердце блока (сектор с end: true, если он есть). */
var BANDS = 40;
function bandLen(n) { return Math.max(1, Math.round(RANGE[n].size / BANDS)); }
function h32(s) { return LAB.hash32 ? LAB.hash32(s) >>> 0 : 0; }
function sectorOf(n, L) {
  var D = DEEP[n], S = D.sectors, r = RANGE[n], bl = bandLen(n), bi = Math.floor((L - r.from) / bl), last = Math.floor((r.size - 1) / bl);
  var endS = S.filter(function (s) { return s.end; })[0], startS = S[0];
  if (bi === 0) return { s: startS, bi: 0, k: L - r.from + 1, bl: bl };
  if (bi === last && endS) return { s: endS, bi: bi, k: L - (r.from + bi * bl) + 1, bl: bl };
  var mid = S.filter(function (s) { return !s.end; });
  if (mid.length > 1) mid = mid.filter(function (s, i) { return i > 0 || mid.length < 3; });
  var pick = function (b) { return mid[h32("deep|" + n + "|" + b) % mid.length]; };
  var s = pick(bi), prev = bi > 1 ? pick(bi - 1) : startS;
  if (s === prev && mid.length > 1) s = mid[(mid.indexOf(s) + 1 + (h32("deep2|" + n + "|" + bi) % (mid.length - 1))) % mid.length];
  return { s: s, bi: bi, k: L - (r.from + bi * bl) + 1, bl: bl };
}
LAB.deepSector = function (L) { var n = LAB.blockOf(L); return n >= FIRST && DEEP[n] && DEEP[n].sectors.length ? sectorOf(n, L) : null; };
var cache = {}, cacheN = 0;
function deepLevel(L) {
  if (cache[L]) return cache[L];
  var n = LAB.blockOf(L);
  if (n < FIRST || !deepReady(n) || L > LAB.LEVELS_N) return undefined;
  var D = DEEP[n], so = sectorOf(n, L), s = so.s, h = h32("deepL|" + L);
  var name = so.bl > 1 ? s.name + ", ярус " + so.k : s.name;
  var foes = s.foes.slice();
  var lv = {
    n: L, deep: n, sector: s.id, band: so.bi, ord: so.k,
    name: name, gen: (s.gen || s.name) + (so.bl > 1 ? ", ярус " + so.k : ""),
    tier: Math.ceil(L / 2),
    root: 27.5,
    surf: s.surf || D.surf || "concrete",
    card: s.card || (h % 2 ? "boss" : "hidden"),
    amb: s.amb || D.amb || "amb_l" + ((h % 10) + 1),
    ev: s.ev || D.ev || ["ev_metal_groan", "ev_far_door", "ev_drip"],
    desc: s.desc,
    rooms: s.rooms.slice(),
    foes: foes,
    boss: s.bosses[h % s.bosses.length]
  };
  if (cacheN > 256) { cache = {}; cacheN = 0; }
  cache[L] = lv; cacheN++;
  return lv;
}
LAB.deepLevel = deepLevel;

/* LAB.LEVELS и LAB.TIERS — по-прежнему массивы для уровней 1–100; глубже — по запросу.
   Длина массива прежняя: перебор «всех уровней» (руководство, бестиарий) идёт по ста. */
function lazy(arr, get) {
  if (typeof Proxy === "undefined") return arr;
  return new Proxy(arr, {
    get: function (t, p) {
      if (typeof p === "string" && p.charCodeAt(0) >= 48 && p.charCodeAt(0) <= 57) {
        var i = +p;
        if (i in t) return t[i];
        if (i === Math.floor(i)) { var v = get(i); if (v !== undefined) return v; }
        return undefined;
      }
      return t[p];
    },
    has: function (t, p) {
      if (typeof p === "string" && p.charCodeAt(0) >= 48 && p.charCodeAt(0) <= 57) { var i = +p; return (i in t) || get(i) !== undefined; }
      return p in t;
    }
  });
}
LAB.LEVELS = lazy(LAB.LEVELS, function (L) { return L > BASE ? deepLevel(L) : undefined; });

/* Пропуск доступа глубокого уровня: своя вещь у каждого блока («Жетон Полигона») и номер
   ступени внутри блока. Пропуск уровня L — ступень ceil(L/2), как наверху. */
var tierCache = {};
LAB.deepTier = function (t) {
  if (tierCache[t]) return tierCache[t];
  var L = t * 2, n = LAB.blockOf(L), D = DEEP[n], r = RANGE[n];
  if (n < FIRST || !D) return undefined;
  var t0 = Math.ceil(r.from / 2), k = t - t0 + 1;
  var p = D.pass || { n: "Пропуск блока " + ROMAN[n], short: "пропуска блока " + ROMAN[n] };
  var o = { n: p.n + " " + k, short: p.short + " " + k, deep: n, k: k };
  if (Object.keys(tierCache).length > 512) tierCache = {};
  tierCache[t] = o;
  return o;
};
LAB.TIERS = lazy(LAB.TIERS, function (t) { return t > 50 ? LAB.deepTier(t) : undefined; });

/* Пульт «Истока»: на десятом уровне — Шов, на сотом — теперь не финал, а вход в Разлом; финал —
   на дне последнего готового блока. */
LAB.isReactorLevel = function (L) { return L === LAB.LEVELS_N || (L === 10 && LAB.LEVELS_N > 10) || (L === BASE && LAB.LEVELS_N > BASE); };
LAB.isFinalLevel = function (L) { return L === LAB.LEVELS_N; };
/* Самое дно — последний уровень последнего глубокого блока — Ядро Разлома: финал там. */
LAB.isRiftRoot = function (L) { return L > BASE && L === LAB.LEVELS_N; };
/* Помещения прибытия под Истоком и Ядра Разлома на самом дне (особые, как «Дно Шва» и «Исток»). */
LAB.ROOMS.riftin = { n: "Край Разлома", desc: "Разлом кончается здесь уступом: над головой гудит Исток и смыкается край трещины, под ногами — бетон чужого комплекса, сухой и холодный. Пути назад нет.", special: true };
LAB.ROOMS.riftroot = { n: "Ядро Разлома", desc: "Самое дно, ниже ничего нет. Здесь у Разлома ядро: трещина, что шла сквозь все глубины, сходится в тонкую звенящую черту посреди зала, и весь гул сверху стекается в неё, как вода в воронку. Вокруг черты — пульт, собранный из того, что осталось от первых: рама «Глубины», скобы, перекличечная доска. Под ногами камень, тёплый, как ладонь.", special: true };

/* Сюжетная записка глубокого уровня (этажи 1, 4, 8, 12, 16, 20): вехи блока — по месту в блоке
   («first+0», «first+3» — от начала, «last-1» — от конца), сектор — на первом его уровне, когда
   сектор встретился впервые. Иначе — записка персонала блока, как у прежних блоков без сюжета. */
LAB.deepStory = function (L, F) {
  var n = LAB.blockOf(L), D = DEEP[n], r = RANGE[n];
  if (n < FIRST || !D) return null;
  var a = L - r.from, b = r.to - L, ms = D.milestones;
  var s = ms["first+" + a + "-" + F] || ms["last-" + b + "-" + F];
  if (s) return s;
  var so = sectorOf(n, L);
  /* у первого сектора его первый уровень занят вехами начала блока: его записки — на пятом уровне */
  if (so.bi === 0) { var ss0 = D.sectorStory[so.s.id]; return a === 4 && ss0 ? ss0[F] || null : null; }
  if (so.k === 1 && D.sectorStory[so.s.id]) {
    var first = true;
    for (var bi = 0; bi < so.bi; bi++) { var sb = sectorOf(n, r.from + bi * so.bl); if (sb.s === so.s) { first = false; break; } }
    if (first) return D.sectorStory[so.s.id][F] || null;
  }
  return null;
};
/* Уклад глубоких блоков для кабинетов, обстановки, запасов и ловушек: свои народы глубин — потомки
   Смены А «Глубины», и вещи у них — «Глубины» (буква P), если блок не задал другого (deep.era). */
LAB.deepEra = function (L) { var D = DEEP[LAB.blockOf(L)]; return (D && D.era) || "P"; };
/* Фразы обстановки и записок верхних глубин — без имён, которых внизу не знают: ОКО туда не слышит,
   о «Ковчеге» и его людях Нижние не слыхали. Копия таблицы без таких строк (если строк не остаётся —
   прежняя), в кэше. */
var NAMED = /ОКО|Ковчег|Ветров|Лаптев|Кравец|Кварк|Ланск|Колыбел|Отражени|Механизм|Садовник|Грачёв|Савельев|Орлов|(^|[^А-Яа-яЁё])(Зо(я|и|ю|ей)|Ш(ов|ва|ве|ву|вом)|Ядр(о|а|е|у|ом))(?![А-Яа-яЁё])/;
var cleanCache = {};
function cleanDeep(v) {
  if (typeof v === "string") return NAMED.test(v) ? null : v;
  if (Array.isArray(v)) {
    var a = [];
    for (var i = 0; i < v.length; i++) { var y = cleanDeep(v[i]); if (y != null) a.push(y); }
    return a.length ? a : v;
  }
  if (v && typeof v === "object") { var o = {}; for (var k in v) { var y2 = cleanDeep(v[k]); o[k] = y2 == null ? v[k] : y2; } return o; }
  return v;
}
LAB.deepClean = function (t, key) {
  var c = cleanCache[key];
  if (c && c.src === t) return c.out;
  var out = cleanDeep(t);
  cleanCache[key] = { src: t, out: out };
  return out;
};
/* Коридоры и лестницы глубоких блоков — своими словами блока: длинные — галереи, короткие — переходы;
   лестница — как её зовут в этом комплексе («Аварийный трап»). */
LAB.deepCorrName = function (L, cor) {
  if (L <= BASE || !cor) return null;
  var D = DEEP[LAB.blockOf(L)];
  if (!D || !D.corr) return null;
  return (cor.len || 0) >= 18 ? (D.corr.gallery || null) : (D.corr.passage || null);
};
LAB.deepStairName = function (L, down) {
  if (L <= BASE) return null;
  var D = DEEP[LAB.blockOf(L)];
  return D && D.stairs && D.stairs.n ? D.stairs.n + (down ? " вниз" : " наверх") : null;
};
LAB.storyAt = function (L, F) { return (LAB.STORY && LAB.STORY[L + "-" + F]) || (L > BASE ? LAB.deepStory(L, F) : null); };
})();
