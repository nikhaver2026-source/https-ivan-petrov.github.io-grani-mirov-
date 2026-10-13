/* ════════════════════════════════════════════════════════════════════
   ЗВУК ХРОНИКИ (14.5, ФАЗА VIII «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   У нового — свои звуковые профили, из настоящих записей банка:
   у живого города фон меняется вместе с его состоянием (ночная
   крепость Сар-Дорна, воздух Грани в Портальном дворе Астериона,
   лагерь горняков Нор-Каэля, гул башни над горящим ядром Вальтерна и
   сквозняк руин, когда оно гаснет, вода под сваями Лиорена, военный
   лагерь Тарвека, притон контрабандистов Виррена); у каждой
   легендарной вещи свой голос; новый сюжет мира отзывается колоколом.
   Всё — через общий движок: фон места (placeBed), один звук (Bank).
   ════════════════════════════════════════════════════════════════════ */
const LC_BEDS={
 sardorn:{ночь:"bed_fortress"},
 asterion:{"прилив Граней":"bed_gran"},
 rankair:{"*":"bed_citadel"},
 virren:{"*":"bed_smugglers"},
 norkael:{"*":"bed_camp_dig"},
 kassar:{"*":"bed_school"},
 valtern:{"ядро горит":"bed_tower","ядро гаснет":"bed_ruins"},
 lioren:{"вода под сваями":"bed_port","сухо":"bed_market"},
 tarvek:{"военный закон":"bed_warcamp"},
 ulm:{"*":"bed_burg"}};
const LEGEND_SOUND={talker:"gr_mech",scales:"bell_small",compass:"arc_chimes",mirror:"oc_glass_hit",key:"oc_chain",crown:"bell_big",sickle:"arc_shine",storm:"sky_thunder"};
const HronSound={
 /* фон живого города по его состоянию; null — обычный фон места */
 cityBed(){const L=safeFn(()=>LiveCity.here(),null);if(!L)return null;const M=LC_BEDS[L.id];if(!M)return null;
  const S=safeFn(()=>LiveCity.state(L,curLevel()),null);const r=(S&&M[S.id])||M["*"];return r&&Bank.has(r)?r:null;},
 /* все звуки, на которых держатся фазы III–VIII: для проверки, что каждый — настоящая запись банка */
 roles(){const out=new Set();
  Object.values(LC_BEDS).forEach(m=>Object.values(m).forEach(r=>out.add(r)));Object.values(LEGEND_SOUND).forEach(r=>out.add(r));
  LC_CITIES.forEach(L=>out.add(L.звук));MAG_RITES.forEach(r=>{const a=SCHOOL_AUDIO[r.школа];if(a)out.add(a.cast);});
  ["chance","mirror","witch","oath","truename","laws","calamity","sigil","counter","symbiont"].forEach(id=>{const a=SCHOOL_AUDIO[id]||{};SPELL_LAYERS.forEach(l=>a[l]&&out.add(a[l]));});
  ["wraith_moan","arc_shine","wild_raven","artifact_hum","crystal_shatter","arc_chimes","portal_open","bell_big","bell_small","arte_page","od_dig","gr_mech","guard_shout","cast_quake","oc_quake","bed_gran"].forEach(r=>out.add(r));
  return [...out];}};
/* Фон места: живой город звучит своим состоянием. */
{const pb10=placeBed;placeBed=matKeep(pb10,function(p){const r=safeFn(()=>HronSound.cityBed(),null);if(r&&p&&!(Number(p.depth)||0))return r;return pb10.apply(this,arguments);});}
/* Голос легендарной вещи: применение звучит ею, а не общим гулом. */
{const us10=Magia.use.bind(Magia);Magia.use=matKeep(us10,function(id){const ok=us10(id);if(ok&&LEGEND_SOUND[id])safeFn(()=>Bank.play(LEGEND_SOUND[id],{gain:0.55,maxSec:3}));return ok;});}
/* Новый сюжет мира — удар малого колокола. */
{const op10=Tales.open.bind(Tales);Tales.open=function(вид,k,o){const T=op10(вид,k,o);if(T)safeFn(()=>Bank.play("bell_small",{gain:0.45,maxSec:3}));return T;};}
