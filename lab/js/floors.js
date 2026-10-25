/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — полы (3.0, просьба игрока).
   Под ногами не везде металл уровня:
   • коридоры — бетонные или металлические. Тайные ходы — бетонные; прочие —
     по уровню и глубине (CORR): в жилом секторе, энергоблоке, у оружейных
     бункеров и в тоннелях ускорителя бетона больше, в чистых лабораториях и
     криохранилище меньше, в Ядре его нет; в штольнях «Подножия» — больше
     половины, в «Отражении» почти нет; коридор, что ведёт к складу,
     насосной, генераторной, кабельной или бункеру, бывает бетонным чаще
     (TECH). Металл — тот же, что был: у каждого уровня свой (LAB.SURF,
     LAB.LEVELS[].surf);
   • помещения — деревянные (кабинеты, архивы, библиотеки, каюты, общежития,
     классы, клубы, комнаты отдыха, читальни, приёмные, бухгалтерии…),
     бетонные (лестничные клетки — «бетонный колодец», бункеры, склады,
     насосные, кабельные, подсобки, погреба…) или металл уровня, как прежде.
     Где описание помещения говорит о металле («стены звенят от шагов»,
     латунная мостовая, стальной помост), пол остаётся металлическим.
   Звук стены не меняется (atmos.js: bumpWall, wallEcho). Разметка считается
   от зерна игры своим счётом — поток случайностей генератора не трогается:
   этажи и записи прежние. По деревянному полу изредка скрипят половицы.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB); /* и в Node — для проверок мира */

LAB.SURF.concrete = { n: "бетон", base: "concrete" };
LAB.SURF.wood = { n: "деревянный пол", base: "wood", creak: 0.18 };

function set(s) { var o = {}; s.split(/\s+/).forEach(function (k) { if (k) o[k] = 1; }); return o; }

/* Деревянный пол: кабинеты, архивы, библиотеки, жильё, классы, клубы. */
var WOOD = set(
  /* «Ковчег» */
  "office archive meeting cabin library workroom headoffice testing psych classroom lounge dorm quiet gym cafeteria wintergarden " +
  /* «Подножие»: будка мастера, школа, клуб, общежитие, квартира, магазин городка */
  "g_masterbooth g_school g_club g_bunkhouse g_flat g_shop " +
  /* «Колыбель»: школа и прорабская поселения, казарма «Альфы» */
  "k_school k_site k_bunkhouse " +
  /* «Отражение»: каюта, библиотека и архив эха, концертный зал */
  "o_rcabin o_echolibrary o_echoarchive o_hall " +
  /* «Механизм»: архив снов, регистратура, зал Сказочника */
  "m_dreamarchive m_registry m_storyhall " +
  /* «Исток»: кабинет академика */
  "i_study " +
  /* кабинеты у коридоров */
  "x_engoffice x_shiftboss x_reading x_archive2 x_meeting_s x_hr x_accounting x_mailroom x_music x_chess x_waiting x_techlib " +
  "x_nariad x_geoarchive x_club x_listen x_school x_registry x_inspect x_clerkcell x_counting x_typing x_reception_m x_complaints " +
  "x_quietcell x_memoryhall x_gardenlib x_daycare x_relax x_settlerroom x_weaving x_pottery x_nursery_c x_tearoom x_teahouse " +
  "x_buffet x_bathhouse x_herbdry x_herbarium x_toolshed x_seedbarn x_drillhut x_craftnook x_lostfound x_lostfound_m x_clockshop " +
  "x_stopclock x_tickets x_laboffice x_physio x_healer x_classified x_copy x_forms x_invoices x_twin x_bellroom x_starroom");

/* Бетонный пол: лестничные клетки, бункеры, склады, насосные, кабельные, подсобки. */
var CONC = set(
  "stair bunker cable storage parts transformer pumps compressor genhall switchboard vacuum laundry showers compost secret " +
  "g_robotyard g_corerack g_layer g_hydroline " +
  "k_concrete k_mastbase k_irrigation " +
  "m_pumphall m_slag m_scrapyard " +
  "i_touch i_nowindow " +
  "x_store x_drift x_wellhead x_pumping x_cableroom x_vent x_battery x_elec x_janitor x_coreshed x_blasting x_chemstore " +
  "x_suitstore x_coldstore x_pantry x_rootcellar x_smokehouse x_lamproom x_oilroom x_toilet x_showers_p x_lockers x_slesar " +
  "x_smoke x_stash x_isotope x_springs x_dryroom x_compost_i");

/* Доля бетонных коридоров сверх тех, что у лестниц и технических помещений:
   по уровню (1–10, «Ковчег»), дальше — по глубине. */
var CORR = { 1: 0.25, 2: 0.4, 3: 0.2, 4: 0.1, 5: 0.25, 6: 0.4, 7: 0.1, 8: 0.35, 9: 0.45, 10: 0, 11: 0.3, 14: 0.25, 20: 0.2 };
var DEEP = [0, 0.6, 0.25, 0.05, 0.2, 0.3]; /* «Подножие», «Колыбель», «Отражение», «Механизм», «Исток» */
var TECH = 0.35; /* прибавка к доле у коридора к техническому помещению (не к лестничной клетке) */
function corrShare(L) { return CORR[L] != null ? CORR[L] : DEEP[Math.min(5, LAB.blockOf(L))] || 0; }

function roomSurf(fl, r) {
  if (!fl.surfR) fl.surfR = [];
  var v = fl.surfR[r];
  if (v !== undefined) return v;
  var rm = fl.rooms[r], t = rm && rm.type;
  v = !t ? null : WOOD[t] ? "wood" : CONC[t] ? "concrete" : null;
  fl.surfR[r] = v;
  return v;
}
function corrSurf(fl, c) {
  if (!fl.surfC) fl.surfC = [];
  var v = fl.surfC[c];
  if (v !== undefined) return v;
  var cor = fl.corrs[c];
  v = null;
  if (cor) {
    var d = null;
    for (var i = 0; i < fl.doors.length; i++) if (fl.doors[i].id === cor.door) { d = fl.doors[i]; break; }
    var ra = fl.rooms[cor.a], rb = fl.rooms[cor.b];
    var tech = [ra, rb].some(function (r) { return r && CONC[r.type] && r.type !== "stair"; });
    if (d && d.lock && d.lock.type === "secret") v = "concrete"; /* тайный ход */
    else if (LAB.Rng(fl.seed, "floor30:" + fl.L + ":" + fl.F + ":" + c).next() < corrShare(fl.L) + (tech ? TECH : 0)) v = "concrete";
  }
  fl.surfC[c] = v;
  return v;
}
/* Пол клетки: "wood", "concrete" или null — металл уровня. */
function at(fl, x, y) {
  if (!fl || !LAB.inb(x, y)) return null;
  var i = y * LAB.W + x, r = fl.room[i];
  if (r >= 0) return roomSurf(fl, r);
  var c = fl.corrAt[i];
  if (c < 0 && fl.t[i] === LAB.T.DOOR) { var d = fl.doorAt[i]; if (d) c = d.corr >= 0 ? d.corr : d.acorr != null ? d.acorr : -1; }
  return c >= 0 ? corrSurf(fl, c) : null;
}

LAB.floors = { at: at, room: roomSurf, corr: corrSurf, share: corrShare, WOOD: WOOD, CONC: CONC };
})();
