/* ── ВСТРАИВАНИЕ МАТЕРИКОВ В МИР ──
   Новые земли не живут отдельным окном: климат, биом, держава и область
   клетки за миллионом выводятся модулем; биомы, рыба, моря и пресная вода
   входят в общие таблицы; реки и стада — в меню действий; рейсы — в
   плавание; перемены земли — в летопись Режиссёра и в молву. */
FRESH_BIOMES.push("river_delta","flood_plain");
FISH.push(...MAT_FISH);
/* Голоса и учителя держав материков: по одному на державу, без повторов с прежними. */
{const кандидаты=["sky_falls","sky_river","sky_wave","ad_wave_rocky","wild_birds","raptor_cry","sky_gust","sky_snow","oc_earthquake","ad_tropic",
  "sky_leaves","sky_rain","sky_thunder","wild_wind","sky_day","ad_river_med","ad_port_sel","ad_farm","ad_trade","ad_temple","ad_forge_sel","ad_market_sel",
  "ad_farmstead","wild_anvil","wild_hearth","wild_fire","wild_rain","bed_eyrie","bed_village","bed_shrine","bed_tower","raptor_wing","dragon_growl","es_meteor",
  "gr_node_crystal","gr_node_circle","gr_altar","gr_mech","ad_collapse","ad_gate_open","ad_leaves","ad_hoe","ad_fire_crackle","ad_day_long","sky_storm","sky_wind"];
 const есть=new Set(EMPIRE_VOICE);const свободные=кандидаты.filter(v=>!есть.has(v)&&safeFn(()=>Bank.has(v),false));
 for(let i=0;i<MAT_REALMS.length&&EMPIRE_VOICE.length<EMPIRES.length;i++)EMPIRE_VOICE.push(свободные[i%свободные.length]);}
{const чары=[...new Set(EMPIRE_TEACH.flatMap(t=>t.чему))].sort();const занято=new Set(EMPIRE_TEACH.map(t=>t.чему.slice().sort().join("|")));
 const чем=["земле и воде","ветру и огню","свету и тени","льду и глубине","тишине и дороге","росту и исцелению"];let k=0;
 outer:for(let a=0;a<чары.length;a++)for(let b=a+1;b<чары.length;b++)for(let c=b+1;c<чары.length;c++){if(EMPIRE_TEACH.length>=EMPIRES.length)break outer;
  const т=[чары[a],чары[b],чары[c]];const key=т.join("|");if(занято.has(key))continue;if(hashName(a*31+b,c,9941)>0.35)continue;
  занято.add(key);EMPIRE_TEACH.push({чему:т,цена:Math.round((0.9+hashName(a,b,9942)*0.3)*100)/100,чем:чем[k++%чем.length]});}}
/* Флора, фауна и история каждого края — по земле, теплу и эпохам мира. */
{const FL={forest:[["дуб","ель","папоротник","брусника","лещина","мох"],["лось","рысь","кабан","куница","глухарь","бурый медведь"]],
  plains:[["ковыль","полынь","чабрец","степная вишня"],["сайгак","дрофа","степной орёл","суслик","тарпан"]],
  savanna:[["баобаб","акация","слоновая трава"],["антилопа","гривастый лев","страус","гиена"]],
  desert:[["саксаул","верблюжья колючка","кактус-свеча"],["верблюд","песчаная эфа","тушканчик","фенек"]],
  jungle:[["лиана","пальма","орхидея","хлебное дерево"],["ягуар","обезьяна-ревун","тукан","анаконда"]],
  swamp:[["камыш","клюква","осока","багульник"],["цапля","выдра","болотная черепаха","лягушка-бык"]],
  mountains:[["горная сосна","эдельвейс","лишайник"],["горный козёл","снежный барс","беркут","сурок"]],
  cold:[["карликовая берёза","ягель","морошка"],["северный олень","песец","белая сова","лемминг"]],
  coast:[["морская капуста","облепиха","солерос"],["чайка","тюлень","краб","баклан"]]};
 const СОБ=["стоял город, что теперь лежит под холмом","прошёл фронт войны Разрыва — в земле до сих пор находят наконечники","упала звезда, и с тех пор тут ищут звёздное стекло",
  "осели первые переселенцы из прежних земель","стоял храм забытого бога — от него остались столбы","шла караванная дорога к морю, и на ней стояли колодцы"];
 for(const c of MATERIKI)for(const r of Mater.regionsOf(c)){const cl=matClimateAtBase(r.x,r.y),b=BIOME_BY_ID[r.b]||{база:"plains"};
  const ключ=cl.тепло<0.2?"cold":r.b==="savanna"?"savanna":r.b==="jungle"?"jungle":(FL[b.база]?b.база:"plains");const k=hashName(r.x%99991,r.y%99991,9951);
  const pick=(arr,n)=>{const o=[];for(let i=0;o.length<n&&i<arr.length*2;i++){const v=arr[Math.floor(hashName(r.x%99991+i,r.y%99991,9952+i)*arr.length)];if(o.indexOf(v)<0)o.push(v);}return o;};
  r.флора=pick(FL[ключ][0],3);r.фауна=pick(FL[ключ][1],3);
  const эра=typeof HRON_ERAS!=="undefined"&&HRON_ERAS.length?HRON_ERAS[Math.floor(k*HRON_ERAS.length)]:null;
  r.история=эра?`В ${эра.n.replace(/^Эпоха /,"эпоху ")} здесь ${СОБ[Math.floor(hashName(r.y%99991,r.x%99991,9953)*СОБ.length)]}.`:"";}}
/* Края всех материков и океаны — в общий список областей, по порядку: номера не плывут. */
for(const c of MATERIKI)for(const r of Mater.regionsOf(c)){r._i=REGIONS.length;REGIONS.push(r);}
for(const o of MAT_OCEANS){const r=Mater.oceanRegion(o);r.x=Math.round((o.x0+o.x1)/2);r.y=Math.round((o.y0+o.y1)/2);r._i=REGIONS.length;REGIONS.push(r);}
/* Державы материков — в общий список держав (в конец: прежние номера те же). */
capCells=null;
/* Климат, биом, держава и область за миллионом. */
const climateAtOld=climateAt;
climateAt=matKeep(climateAtOld,function(x,y){return inNewLands(x,y)?matClimateAt(x,y):climateAtOld(x,y);});
const biomeAtOld=biomeAt;
biomeAt=matKeep(biomeAtOld,function(x,y){
 /* Перемены земли бывают только на материках: клетка прежних земель идёт прямо к прежнему правилу. */
 if(!inNewLands(x,y))return biomeAtOld(x,y);
 const g=(typeof G!=="undefined"&&G&&G.mat&&G.mat.geo&&G.mat.geo.length)?(Mater.geoAt(x,y)||Mater.geoRiverShift(x,y)):null;
 if(g)return BIOME_BY_ID[g]||BIOME_BY_ID.plain;
 const k=x+","+y,был=biomeCache.get(k);if(был)return был;
 const b=BIOME_BY_ID[safeFn(()=>matBiomeId(x,y),"inner_sea")]||BIOME_BY_ID.plain;
 if(matNoWater)return b;
 if(biomeCache.size>12000)biomeCache.clear();biomeCache.set(k,b);return b;});
const buildEmpireCitiesOld=buildEmpireCities;
buildEmpireCities=matKeep(buildEmpireCitiesOld,function(){matNoWater++;try{return buildEmpireCitiesOld.apply(this,arguments);}finally{matNoWater--;}});
const empireAtOld=empireAt;
empireAt=matKeep(empireAtOld,function(x,y){if(inNewLands(x,y)){const e=safeFn(()=>Mater.realmAt(x,y),null);if(e)return e;}return empireAtOld(x,y);});
const regionIndexAtOld=regionIndexAt;
regionIndexAt=matKeep(regionIndexAtOld,function(x,y){x=Number(x)||0;y=Number(y)||0;if(inNewLands(x,y)){const r=safeFn(()=>Mater.regionAt(x,y),null);if(r&&r._i!=null)return r._i;}return regionIndexAtOld(x,y);});
const regionCenterOld=regionCenter;
regionCenter=matKeep(regionCenterOld,function(r){if(r&&(r.мат||r.океан)&&Number.isFinite(r.x))return {x:r.x,y:r.y};return regionCenterOld(r);});
const seaTypeAtOld=seaTypeAt;
seaTypeAt=matKeep(seaTypeAtOld,function(x,y){const m=safeFn(()=>Mater.seaTypeAt(x,y),null);if(m)return SEA_BY_ID[m.id]||m;return seaTypeAtOld(x,y);});
/* Большие гавани — порты, даже если жребий клетки порта не дал. */
const isPortAtOld=isPortAt;
isPortAt=matKeep(isPortAtOld,function(x,y){const p=isPortAtOld(x,y);if(p)return p;const h=Mater._harb?safeFn(()=>Mater.harborAt(x,y,0),null):null;
 if(h)return {x,y,type:"port",name:h.n,emp:empireAt(x,y),size:3,дальний:true};return null;});
/* Пресная рыба у рек и озёр — и в прежних землях тоже. */
const fishingSpotOld=fishingSpot;
fishingSpot=matKeep(fishingSpotOld,function(){const s=fishingSpotOld();if(s&&s!=="coast"&&s!=="swamp")return s;if(G.place||G.ship)return s;
 /* В прежних землях берег и топи остаются берегом и топями, как было: пресная вода — там, где прежде рыбачить было негде. */
 if(s&&!inNewLands(G.x,G.y))return s;
 const b=safeFn(()=>biomeAt(G.x,G.y),null);if(b){if(["river","stream","waterfall","river_mouth","river_delta","flood_plain"].indexOf(b.id)>=0)return "river";if(["lake","lakeland"].indexOf(b.id)>=0)return "lake";}return s;});
const fishingSpotNameOld=fishingSpotName;
fishingSpotName=matKeep(fishingSpotNameOld,function(spot){return spot==="river"?"река":spot==="lake"?"озеро":fishingSpotNameOld(spot);});
/* Дальний рейс: каждый переход — день моря; встречи — после перехода. */
const seaLegEffectOld=seaLegEffect;
seaLegEffect=matKeep(seaLegEffectOld,function(s){let t=seaLegEffectOld(s)||"";if(s&&s.дальний)t+=safeFn(()=>Mater.farLeg(s),"")||"";return t;});
const sailLegOld=sailLeg;
sailLeg=matKeep(sailLegOld,function(){const r=sailLegOld.apply(this,arguments);
 const s=G.ship;if(s&&s.дальний&&s.enc&&!G.inCombat){const e=s.enc;s.enc=null;if(e.вид==="pir")Mater.pirateBattle(e.x);else if(e.вид==="mon")Mater.monsterBattle(e.x);}
 return r;});
/* Победа над пиратами или чудищем моря — в судьбу братства и логова. */
const victoryOld=victory;
victory=matKeep(victoryOld,function(){const m=G.combat&&G.combat.m;const r=victoryOld.apply(this,arguments);if(m&&(m.пират||m.чудище)&&!G.inCombat)safeFn(()=>Mater.afterWin(m));return r;});
/* Осмотреться: на новых землях — материк, край, широта, сезон; у реки — куда течёт. */
const lookOld=look;
look=matKeep(lookOld,function(){const r=lookOld.apply(this,arguments);
 if(!G.place&&!G.dark&&!inFlightSafe()){const t=[];if(inNewLands(G.x,G.y))t.push(Mater.hereText());
  const rv=safeFn(()=>Mater.riverHere(G.x,G.y,300),null);if(rv)t.push(rv.old?`Река ${rv.n} течёт на ${Mater.dirWord(rv.dx,rv.dy)}.`:`Река ${rv.R.n} течёт на ${Mater.dirWord(rv.dx,rv.dy)}.`);
  const hn=inNewLands(G.x,G.y)?Mater.herdsNear(G.x,G.y)[0]:null;if(hn&&hn.d<hn.h.r*2)t.push(`Рядом ${hn.h.кто}: ${hn.h.о}.`);
  if(t.length)narrate(t.join(" "),{interrupt:false});}
 return r;});
/* Шаг на новый материк — впервые: слово и летопись. */
const moveOld=move;
move=matKeep(moveOld,function(dir){const r=moveOld.apply(this,arguments);if(r!==false&&!G.place&&!G.dark&&inNewLands(G.x,G.y))safeFn(()=>Mater.seen());return r;});
/* День мира: перемены земли, плавучие острова сдвинулись — карты клеток устарели. */
{const wd4=Director.worldDay;Director.worldDay=matKeep(wd4,function(){const r=wd4.apply(this,arguments);safeFn(()=>{const d0=Mater.st().day;Mater.tick();if(Mater.st().day!==d0)Mater.clearCaches();});return r;});}
Object.assign(CMD,{mater(){Mater.home();},mt(a){Mater.cmd(a);},rdown(){Mater.alongRiver(1);},rup(){Mater.alongRiver(-1);},
 mriver(){narrate(Mater.riverText(G.x,G.y));if(Mater.riverHere(G.x,G.y,600))Mater.home();},mlake(){narrate(Mater.lakeText());},mhunt(){Mater.hunt();},
 mtpay(){if(!Mater._pirate||!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.пират)){narrate("Откупаться не от кого: пиратов рядом нет. Дань берут только в бою с пиратами, в их водах.");return;}
  if(Mater.payTribute()){safeFn(()=>endCombat());safeFn(()=>refresh());}}});
{const av5=amAvailable;amAvailable=matKeep(av5,function(cmd){
 if(cmd==="mater")return !G.dark;
 if(cmd==="rdown"||cmd==="rup"||cmd==="mriver")return !G.place&&!G.dark&&!G.ship&&!G.inCombat&&safeFn(()=>!!Mater.riverHere(G.x,G.y,600),false);
 if(cmd==="mlake")return !G.place&&!G.dark&&!G.ship&&safeFn(()=>!/^Озера рядом нет/.test(Mater.lakeText()),false);
 if(cmd==="mhunt")return !G.place&&!G.dark&&!G.ship&&!G.inCombat&&inNewLands(G.x,G.y)&&safeFn(()=>{const n=Mater.herdsNear(G.x,G.y)[0];return !!n&&n.d<n.h.r&&!n.h.море;},false);
 if(cmd==="mtpay")return !!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.пират);
 return av5.apply(this,arguments);});}
/* В разделе не больше шестнадцати пунктов: «Здесь» и «Перемещение» полны, поэтому реки — в «Мире»
   (окно реки даёт и сплав вниз, и подъём вверх). */
{const g=n=>AM_GROUPS.find(x=>x[0]===n);
 safeFn(()=>g("Мир")[1].push(["mater","Материки и воды"],["mriver","Река: откуда, куда, сплав"],["mlake","Озеро"]));
 safeFn(()=>g("Ремесло")[1].push(["mhunt","Охота у стада"]));
 safeFn(()=>g("Бой")[1].push(["mtpay","Откупиться от пиратов"]));}
/* Деревни у воды: на берегах озёр и рек новых земель — втрое чаще (рыбаки, перевозчики, мельницы). */
{const cc5=cellContent;cellContent=matKeep(cc5,function(x,y){const c=cc5.apply(this,arguments);
 if(c&&!G.dark&&!c.structure&&inNewLands(x,y)){
  const ru=safeFn(()=>Mater.ruinAt(x,y),null);
  if(ru)c.structure={type:"ruins",name:ru.руины,beacon:"ruins",остров:ru.id};
  else{const v=safeFn(()=>Mater.waterVillage(x,y),null);if(v)c.structure={type:"village",name:v.name,beacon:"village",уВоды:v.w.вид};}}
 return c;});}
{const ic5=isCityAt;isCityAt=matKeep(ic5,function(x,y){const r=ic5.apply(this,arguments);if(r||!inNewLands(x,y))return r;
 const v=safeFn(()=>Mater.waterVillage(x,y),null);return v?{x,y,type:"village",name:v.name,emp:empireAt(x,y),size:1}:null;});}
/* Голоса воды и стад — поверх голосов области. */
{const rs5=Regions.spots.bind(Regions);Regions.spots=matKeep(rs5,function(){const l=rs5();
 safeFn(()=>{if(G.place||G.ship||G.dark)return;const b=biomeAt(G.x,G.y).id;
  if(["river","stream","river_mouth","river_delta","flood_plain"].indexOf(b)>=0)l.push(["ad_river_med",1.2]);
  if(b==="waterfall")l.push(["sky_falls",2]);if(b==="lake"||b==="lakeland")l.push(["sky_wave",0.9]);
  if(inNewLands(G.x,G.y)){if(Mater.volcanic(G.x,G.y))l.push(["mtg_lava",0.7]);const hn=Mater.herdsNear(G.x,G.y)[0];if(hn&&hn.d<hn.h.r*2)l.push([hn.h.звук,1]);}});
 return l;});}
/* ── МОЛВА МАТЕРИКОВ ──
   Перемены земли, разбитые пираты, поверженное чудище и первый шаг на материк
   заводят весть. У каждого рода своя лестница искажений, как у прежних вестей:
   нижняя ступень — само событие словами летописи, выше — то, во что оно
   обрастает в пересказе. Без своей лестницы весть не заводится вовсе. */
Object.assign(RUMOR_LADDER,{
 земля:["говорят: {что}","за морем неспокойно: {что}","говорят, за морем целые долины ушли под воду и под пепел","боги перекраивают землю за морем","скоро и наш край провалится"],
 пираты:["говорят: {что}","разбил пиратов в открытом море","потопил пиратский корабль в одиночку","вырезал целое пиратское братство","пираты боятся одного его имени"],
 чудище:["говорят: {что}","одолел морское чудище","убил чудище, что топило корабли","в одиночку одолел древнее чудище пучины","говорят, само море ему покорилось"],
 материк:["говорят: {что}","ходил за Внешнее море","дошёл до новых земель","нашёл материк, о котором никто не знал","говорят, он и сам родом с тех земель"]});
{const rt5=rumorText;rumorText=matKeep(rt5,function(r){const t=rt5.apply(this,arguments);
 if(t&&typeof t.текст==="string"&&t.текст.indexOf("{что}")>=0)t.текст=t.текст.replace("{что}",String((r&&r.что)||"").trim()||"что-то случилось");return t;});}
/* ── ПОРУЧЕНИЯ ДЕРЖАВ МАТЕРИКОВ ──
   У каждой державы своё поручение: звание, кто платит и чем, и три дела —
   привезти то, чего на её земле нет, избавить край от зверя, что водится в
   её местностях, и сходить на дальний край или очистить округу. Плата —
   товаром, который держава вывозит. */
{const ЗВ=["Наряд","Подряд","Уговор","Заказ","Поручение"],
  КТО=["престольной казны","совета земель","речных старост","горных старшин","береговых общин","лесных старост","караванных дворов","храмовой казны","степных родов","портовой управы"],
  ПЛАТЯТ=["серебром казны","солью и мехами","долей с торга","правом беспошлинного проезда","товаром из державных амбаров","зерном нового урожая"],
  РОД={дерево:"дерева",трава:"травы",ягоды:"ягод",камень:"камня",руда:"руды",кристалл:"кристаллов",ракушка:"ракушек",грибы:"грибов",кость:"кости"};
 const было=new Set(EMPIRE_QUESTS.map(н=>н.звание));
 MAT_REALMS.forEach((e,k)=>{const h=n=>hashName(k*7+n,e.cap.x%9973,9881);
  let зв="";for(let t=0;t<ЗВ.length*КТО.length&&!зв;t++){const c=`${ЗВ[(Math.floor(h(1)*ЗВ.length)+t)%ЗВ.length]} ${КТО[(Math.floor(h(2)*КТО.length)+Math.floor(t/ЗВ.length))%КТО.length]}`;if(!было.has(c))зв=c;}
  if(!зв)зв=`Поручение державы «${e.short}»`;было.add(зв);
  const м=MAT_BY_ID[e.материк]||{род:"материка"};
  const свои=MONSTERS.filter(m=>(m.biomes||[]).some(b=>e.terrains.includes(b)));const зверь=(свои.length?свои:MONSTERS)[Math.floor(h(6)*(свои.length||MONSTERS.length))];
  const нужно=e.imports[0]||"кристалл",своё=e.exports[0]||"дерево";
  const дела=[{тип:"fetch",res:нужно,слово:`На земле державы «${e.short}» своих ${РОД[нужно]||нужно} нет: ${зв.split(" ").slice(1).join(" ")} скупает привозное и платит тому, кто доставит.`},
   {тип:"hunt",зверь:зверь.id,слово:`Тропы ${м.род} снова опасны: в краях державы «${e.short}» видели «${зверь.n}». За одного такого платят сразу.`},
   h(7)<0.5?{тип:"visit",слово:`С дальнего края ${м.род} давно нет вестей. Держава «${e.short}» просит дойти до отметки и вернуться с тем, что там увидите.`}
    :{тип:"kill",слово:`Дороги у престола держат чистыми не стеной, а счётом: столько-то тварей — столько-то платы. Держава «${e.short}» считает честно.`}];
  EMPIRE_QUESTS.push({звание:зв,платят:ПЛАТЯТ[Math.floor(h(3)*ПЛАТЯТ.length)],цена:Math.round((0.9+h(4)*0.3)*100)/100,дар:{res:своё,n:2+Math.floor(h(5)*2)},дела});});}
/* Речная рыба в карточках вещей: откуда имя (что это — в самой рыбе). */
Object.assign(ITEM_LORE,{
 "щука":{имя:"рыбаки говорят — от «щуриться»: хищница стоит в камышах неподвижно, будто высматривает, и бьёт из засады"},
 "окунь":{имя:"от «ока»: у полосатого окуня большие глаза, и на всех реках его зовут глазастым"},
 "лещ":{имя:"от старого слова о плоском и широком: лещ тонок с боков, будто расколотая плаха"},
 "хариус":{имя:"имя пришло с севера, из наречия лесных рыбаков: так зовут быструю рыбу холодных перекатов"},
 "сом":{имя:"короткое древнее слово; рыбаки шепчут, что сом старше слов — усатый великан омутов"},
 "серебряный лосось":{имя:"лосось — древнее имя рыбы, что идёт против течения; серебряным его зовут в Темнолесье за чешую, что блестит на порогах"},
 "налим":{имя:"от «налитый»: налим будто налит слизью и выскальзывает из рук; ловят его зимой и в темноте"}});
