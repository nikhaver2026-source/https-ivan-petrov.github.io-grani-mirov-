/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 92: МОРЯ, ОСТРОВА И ПОДВОДНЫЙ МИР

   Море было одним: переход, шторм, встреча. Теперь у воды восемь родов, и
   род выводится из тепла и высоты дна; по курсу встают острова одиннадцати
   родов, к которым можно пристать; под водой у берегов и с борта — места
   десяти родов, и глубина погружения — в тактах дыхания (§123).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Восемь родов моря с голосом из банка, все встречаются, лёд — в стуже,
      род под килем постоянен; одиннадцать родов островов, все встречаются,
      с именами.
   2. Переход называет род моря при входе в него, пишет журнал, звучит;
      штормовое море штормит чаще мелководья; ледяное отнимает здоровье
      без зелья тепла и не отнимает с ним; магическое отдаёт ману.
   3. Остров по курсу появляется и запоминается на судне; «Пристать» есть в
      меню только тогда; каждый род острова делает своё: торговый платит,
      необитаемый даёт добычу, лесной — дерево, ледяной — лист холода,
      вулканический — камень и пепельный цвет, древний — опыт, летающий —
      примету, военный — воду, аномальный — время или ману, затонувший —
      погружение, пиратский — плату или бой.
   4. На суше клетка архипелага принадлежит острову: он объявляется раз при
      входе, пиратский остров делает встречи чаще, застава — реже.
   5. Места под водой лежат только у воды, все десять родов встречаются,
      в доме и в шторм нырять нельзя; такты дыхания: один, два от зелья,
      два — русалке.
   6. Погружение по тактам: кораллы дают ракушку, жемчуг и морскую лозу;
      крушение — дерево, золото и склянку; руины — примету и вещь; поле —
      ракушку и кристалл; механизм — руны и астральный кристалл; поселение —
      золото за ракушку и имя у русалок; гиганты — удар и материал; хищники
      и владыка — бой; с одним тактом до дна не доходят, и это сказано.
   7. Каждое погружение слышно и считается делом; «Моря» говорят текстом;
      пройденные моря, острова и погружения — в сохранении.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};
  window.судно=(tox,toy)=>{G.ship={name:"Проба",kind:"cog",speed:1,hold:20,tox,toy,toName:"Порт",legs:8,left:8,leg:0,war:false,storm:false,fare:10};return G.ship;};});

 /* ── 1. реестры ── */
 const реестр=await page.evaluate(()=>{
  const плохиеМоря=SEA_TYPES.filter(t=>!t.n||!t.род||!t.о||!SOUND_BANK[t.звук]).map(t=>t.id);
  const плохиеОстрова=ISLAND_TYPES.filter(t=>!t.n||!t.о||!SOUND_BANK[t.звук]).map(t=>t.id);
  const плохиеМеста=DIVE_SITES.filter(d=>!d.n||!d.о||!SOUND_BANK[d.звук]||!(d.вес>0)).map(d=>d.id);
  const моря={},острова={};let лёдТёплый=0,лёд=0;
  for(let i=0;i<6000;i++){const x=(i*37)%WORLD,y=(i*59+3000)%WORLD;const t=seaTypeAt(x,y);моря[t.id]=1;
   if(t.id==="ice"){лёд++;if(climateAt(x,y).тепло>=CLIM.Т_ЛЁД)лёдТёплый++;}
   острова[islandTypeByHash(x,y).id]=1;}
  const a=seaTypeAt(777,888).id,b=seaTypeAt(777,888).id;
  return {морей:SEA_TYPES.length,видовМорей:Object.keys(моря).length,плохиеМоря,лёд,лёдТёплый,постоянно:a===b,
   островов:ISLAND_TYPES.length,видовОстровов:Object.keys(острова).length,плохиеОстрова,имя:islandName(500,500),имяТо:islandName(500,500)===islandName(501,502),
   мест:DIVE_SITES.length,плохиеМеста};});
 check('1. восемь родов моря и одиннадцать родов островов — все с голосом из банка, все встречаются, лёд только в стуже, род постоянен, у островов имена',
  реестр.морей===8&&реестр.видовМорей===8&&!реестр.плохиеМоря.length&&реестр.лёд>0&&реестр.лёдТёплый===0&&реестр.постоянно&&реестр.островов===11&&реестр.видовОстровов===11&&!реестр.плохиеОстрова.length&&реестр.имя.length>=3&&реестр.имяТо&&реестр.мест===10&&!реестр.плохиеМеста.length,реестр);

 /* ── 2. переходы ── */
 const переход=await page.evaluate(()=>{
  const r={};G.inCombat=false;G.place=null;G.dark=false;G.hpMax=100;G.manaMax=100;
  maybeSeaEvent=()=>false;maybeEvent=()=>false;const _isl=islandSight;islandSight=()=>false;
  const найти=(id)=>{for(let i=0;i<20000;i++){const x=(i*37)%WORLD,y=(i*59+3000)%WORLD;if(seaTypeAt(x,y).id===id)return {x,y};}return null;};
  const где={storm:найти("storm"),shallow:найти("shallow"),ice:найти("ice"),magic:найти("magic")};
  if(Object.values(где).some(v=>!v))return {нет:Object.keys(где).filter(k=>!где[k])};
  const штормов=(id)=>{let n=0;for(let d=1;d<=120;d++){G.day=d;G.x=где[id].x;G.y=где[id].y;const s=судно(G.x+2,G.y);s.leg=3;s.legs=8;s.left=5;G.hp=100;sailLeg();if(G.ship&&G.ship.storm)n++;}return n;};
  r.штормШторм=штормов("storm");r.штормМелко=штормов("shallow");
  /* первый вход называет море и пишет журнал */
  G.seasSeen={};G.x=где.magic.x;G.y=где.magic.y;const s=судно(G.x+2,G.y);s.leg=3;s.left=5;G.day=5;G.mana=10;SAID.length=0;PLAYED.length=0;
  sailLeg();r.сказ=SAID.find(t=>/Судно идёт по магическому морю/.test(t))||"";r.sea=G.ship.sea;r.журнал=/магическое море/.test(JSON.stringify(G.journal.slice(0,3)));r.звук=PLAYED.includes("magic_shimmer");r.мана=G.mana;
  s.left=5;SAID.length=0;sailLeg();r.второйРаз=SAID.some(t=>/Судно идёт по магическому/.test(t));
  /* лёд */
  G.x=где.ice.x;G.y=где.ice.y;const s2=судно(G.x+2,G.y);s2.leg=3;s2.left=5;G.buffs={};G.hp=100;
  const rnd=Math.random;Math.random=()=>0.999;G.day=200;
  sailLeg();r.лёдБез=G.hp;buffSet("тепло",5);s2.left=5;s2.leg=3;G.hp=100;sailLeg();r.лёдС=G.hp;Math.random=rnd;G.buffs={};
  G.ship=null;islandSight=_isl;
  return r;});
 check('2а. штормовое море штормит чаще мелководья',!переход.нет&&переход.штормШторм>переход.штормМелко*2&&переход.штормМелко<25,переход.нет||[переход.штормШторм,переход.штормМелко]);
 check('2б. первый вход в море называет его, пишет журнал и звучит; второй раз молчит; магическое отдаёт ману; ледяное отнимает здоровье без зелья тепла и не отнимает с ним',
  /магическому морю/.test(переход.сказ)&&переход.sea==="magic"&&переход.журнал&&переход.звук&&переход.мана>10&&переход.второйРаз===false&&переход.лёдБез<100&&переход.лёдС===100,
  [переход.сказ.slice(0,100),переход.лёдБез,переход.лёдС,переход.мана]);

 /* ── 3. острова с борта ── */
 const остров=await page.evaluate(()=>{
  const r={};maybeSeaEvent=()=>false;maybeEvent=()=>false;
  G.x=WORLD>>1;G.y=WORLD>>1;const s=судно(G.x+30,G.y+5);s.leg=1;s.left=7;
  r.менюДо=amAvailable("landisle");
  let n=0;while(!s.island&&n<80){s.leg=1+(n%6);G.day=1+n;islandSight(s);n++;}
  r.нашли=!!s.island;r.менюПосле=amAvailable("landisle");r.сказ=SAID.find(t=>/По курсу остров/.test(t))||"";
  const rnd=Math.random;Math.random=()=>0.5;
  const пристать=(type,подготовка)=>{G.ship=s;s.island={type,name:"Проба",x:G.x+10,y:G.y+3};G.inCombat=false;G.combat=null;G.inv={};if(подготовка)подготовка();const h=G.hour;const золото=G.gold;SAID.length=0;const ok=landIsland();return {ok,сказ:SAID.find(t=>/Пристали/.test(t))||"",часы:(G.hour-h+24)%24,золото:G.gold-золото,остров:s.island};};
  G.inv={};G.gold=100;G.hp=100;G.hpMax=100;G.manaMax=100;G.mana=10;G.water=50;G.signs=[];G.dives={};
  r.trade=пристать("trade",()=>{G.inv["руда"]=5;});r.tradeРуда=G.inv["руда"];
  r.desert=пристать("desert");r.desertРакушка=G.inv["ракушка"];
  r.forest=пристать("forest");r.forestДерево=G.inv["дерево"];
  r.ice=пристать("ice");r.iceКристалл=G.inv["кристалл"];r.iceЛист=G.inv["инеевый лист"];
  r.volcanic=пристать("volcanic");r.volcanicКамень=G.inv["камень"];
  const xp=G.xp;r.ancient=пристать("ancient");r.ancientXp=G.xp-xp;
  r.flying=пристать("flying");r.flyingПримета=G.signs.some(x=>/^isle_/.test(x.id));
  r.military=пристать("military");r.militaryВода=G.water;
  G.mana=10;r.anomalous=пристать("anomalous");r.anomalousМана=G.mana;
  r.sunken=пристать("sunken");r.sunkenПогружений=deeds("dives");
  G.gold=100;r.pirate=пристать("pirate");r.pirateЗолото=G.gold;
  Math.random=rnd;G.ship=null;G.inCombat=false;G.combat=null;
  return r;});
 check('3а. остров по курсу появляется, запоминается на судне и озвучен; «Пристать» в меню только тогда',
  остров.менюДо===false&&остров.нашли&&остров.менюПосле&&/По курсу остров/.test(остров.сказ)&&/меню действий/.test(остров.сказ),[остров.менюДо,остров.нашли,остров.менюПосле,остров.сказ.slice(0,100)]);
 check('3б. торговый платит за товар, необитаемый даёт ракушку, лесной — дерево, ледяной — кристалл и лист холода, вулканический — камень, древний — опыт',
  остров.trade.ok&&остров.trade.золото>0&&остров.tradeРуда===2&&остров.trade.часы===2&&остров.trade.остров===null&&остров.desertРакушка===3&&остров.forestДерево===3&&остров.iceКристалл===1&&остров.iceЛист===1&&остров.volcanicКамень===2&&остров.ancientXp>=15,
  [остров.trade,остров.desertРакушка,остров.forestДерево,остров.iceЛист,остров.ancientXp]);
 check('3в. летающий даёт примету, военный — воду, аномальный — ману или время, затонувший — погружение, пиратский — плату или бой',
  остров.flyingПримета&&остров.militaryВода>50&&(остров.anomalousМана>10||/три часа/.test(остров.anomalous.сказ))&&остров.sunkenПогружений>=1&&(остров.pirateЗолото<100||/клинками/.test(остров.pirate.сказ)),
  [остров.flyingПримета,остров.militaryВода,остров.anomalous.сказ.slice(0,80),остров.sunkenПогружений,остров.pirateЗолото]);

 /* ── 4. острова на суше ── */
 const суша=await page.evaluate(()=>{
  const r={};G.ship=null;G.place=null;G.dark=false;G.isles={now:null,seen:{}};
  let кл=null;for(let i=0;i<80000&&!кл;i++){const x=(i*37)%WORLD,y=(i*59+3000)%WORLD;const b=biomeAt(x,y);if(b&&b.id==="archipelago")кл={x,y};}
  if(!кл)return {нет:"архипелага"};
  G.x=кл.x;G.y=кл.y;SAID.length=0;islandCheck();r.сказ=SAID.find(t=>/^Остров/.test(t))||"";const i=islandHere();r.тип=i&&i.type.id;
  SAID.length=0;islandCheck();r.повтор=SAID.some(t=>/^Остров/.test(t));
  r.k=islandEncounterK();
  const тип=i&&i.type.id;r.kОжид=тип==="pirate"?1.5:тип==="desert"?0.6:тип==="military"?0.5:1;
  G.x=WORLD>>1;G.y=WORLD>>1;r.вПоле=islandHere();
  return r;});
 check('4. клетка архипелага принадлежит острову: он объявляется раз при входе, встречи меняются по его роду, в поле острова нет',
  !суша.нет&&/^Остров .* — /.test(суша.сказ)&&suша_ok(суша),суша);
 function suша_ok(с){return с.тип&&с.повтор===false&&с.k===с.kОжид&&с.вПоле===null;}

 /* ── 5. места под водой ── */
 const места=await page.evaluate(()=>{
  const r={};const виды={};let наСуше=0,всего=0;
  for(let i=0;i<40000;i++){const x=(i*31)%WORLD,y=(i*17+9000)%WORLD;const s=diveSiteAt(x,y);if(s){всего++;виды[s.kind]=1;const b=biomeAt(x,y);if(!B_SEA.includes(b.id))наСуше++;}}
  r.видов=Object.keys(виды).length;r.всего=всего;r.наСуше=наСуше;
  const первое=(()=>{for(let i=0;i<40000;i++){const x=(i*31)%WORLD,y=(i*17+9000)%WORLD;const s=diveSiteAt(x,y);if(s)return s;}return null;})();
  G.x=первое.x;G.y=первое.y;G.place=null;G.ship=null;G.inCombat=false;
  r.доступно=diveAvailable();r.меню=amAvailable("dive");
  G.place={kind:"dungeon",bx:1,by:1,stype:"ruins",name:"м",depth:1,x:1,y:1};r.вДоме=diveAvailable();G.place=null;
  судно(G.x+5,G.y);G.ship.storm=true;r.вШторм=diveAvailable();G.ship=null;
  G.buffs={};G.race="Люди";G.assim={traits:{},cooldown:0,materials:0,energy:0};r.такты=breathTacts();buffSet("дыхание",3);r.тактыЗелье=breathTacts();G.buffs={};G.race="Русалки";r.тактыРусалка=breathTacts();G.race="Люди";
  return r;});
 check('5. места под водой лежат только у воды, все десять родов встречаются; в доме и в шторм нырять нельзя; такты: один, два от зелья, два русалке',
  места.видов===10&&места.всего>50&&места.наСуше===0&&места.доступно&&места.меню&&места.вДоме===false&&места.вШторм===false&&места.такты===1&&места.тактыЗелье===3&&места.тактыРусалка===3,места);

 /* ── 6. погружения ── */
 const ныр=await page.evaluate(async()=>{
  const r={};G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.buffs={};G.race="Люди";G.level=5;G.hpMax=100;G.hp=100;G.dark=false;
  G.x=WORLD>>1;G.y=WORLD>>1;
  const нырнуть=(kind,T,подг)=>{G.buffs={};if(T>=3)buffSet("дыхание",4);G.inv={};if(подг)подг();G.inCombat=false;G.combat=null;SAID.length=0;PLAYED.length=0;const ok=diveRun({kind,x:G.x+kind.length,y:G.y+7});return {ok,сказ:SAID.find(t=>/Погружение/.test(t))||"",звук:PLAYED.includes("oc_dive")};};
  r.coral1=нырнуть("coral",1);r.coral1Ракушка=G.inv["ракушка"];r.coral1Жемчуг=G.inv["жемчуг"];
  r.coral3=нырнуть("coral",3);r.coral3=[G.inv["ракушка"],G.inv["жемчуг"],G.inv["морская лоза"],r.coral3.сказ.slice(0,60),r.coral3.звук];
  G.gold=0;G.items=[];r.wreck=нырнуть("wreck",3);r.wreckИтог=[G.inv["дерево"],G.gold,G.items.includes("Зелье здоровья")];
  G.signs=[];G.artifacts=[];const xp=G.xp;r.ruins=нырнуть("ruins",3);r.ruinsИтог=[G.inv["камень"],G.signs.some(s=>/^dive_/.test(s.id)),G.artifacts.length,G.xp-xp];
  r.field=нырнуть("field",3);r.fieldИтог=[G.inv["ракушка"],G.inv["кристалл"],G.inv["морская лоза"]];
  G.mast={runes:{ур:1,оп:0}};const mech=deeds("mechanisms");r.mech=нырнуть("mechanism",3);r.mechИтог=[deeds("mechanisms")-mech,G.mast.runes.оп>0,G.inv["астральный кристалл"]];
  G.gold=0;G.rep={};r.settle=нырнуть("settlement",3);G.gold=0;r.settle2=нырнуть("settlement",3,()=>{G.inv["ракушка"]=3;});r.settleИтог=[G.gold,repOf("Русалки"),G.inv["ракушка"]];
  G.hp=100;G.assim={traits:{},cooldown:0,materials:0,energy:0};r.giants=нырнуть("giants",3);r.giantsИтог=[G.hp,assim().materials];
  r.cave=нырнуть("cave",3);r.caveИтог=[G.inv["кристалл"],G.inv["водный кристалл"],G.inv["глубинный трутник"]];
  r.pred=нырнуть("predators",3);await new Promise(res=>setTimeout(res,300));r.predБой=!!G.inCombat;r.predИмя=G.combat&&G.combat.m&&G.combat.m.n;endCombat();G.inCombat=false;G.combat=null;
  r.boss=нырнуть("boss",3);await new Promise(res=>setTimeout(res,300));r.bossБой=!!G.inCombat;r.bossИмя=G.combat&&G.combat.m&&G.combat.m.n;r.bossФлаг=!!(G.combat&&G.combat.m&&G.combat.m.boss);endCombat();G.inCombat=false;G.combat=null;
  r.boss1=нырнуть("boss",1);await new Promise(res=>setTimeout(res,200));r.boss1Бой=!!G.inCombat;
  return r;});
 check('6а. кораллы: с одним тактом — ракушка и слова о кончившемся дыхании; с тремя — ракушка, жемчуг и морская лоза; крушение — дерево, золото и склянка',
  ныр.coral1.ok&&/Дыхание кончилось на первом такте/.test(ныр.coral1.сказ)&&ныр.coral1Ракушка===2&&!ныр.coral1Жемчуг&&ныр.coral3[0]===2&&ныр.coral3[1]===1&&ныр.coral3[2]===1&&ныр.coral3[4]&&ныр.wreckИтог[0]===2&&ныр.wreckИтог[1]>=20&&ныр.wreckИтог[2],
  [ныр.coral1.сказ.slice(0,120),ныр.coral3,ныр.wreckИтог]);
 check('6б. руины — камень, примета и вещь; поле — ракушка и кристалл; механизм — руны и астральный кристалл; поселение — золото за ракушку и имя у русалок; гиганты — удар и материал; пещера — кристаллы и трутник',
  ныр.ruinsИтог[0]===2&&ныр.ruinsИтог[1]&&ныр.ruinsИтог[2]>=1&&ныр.ruinsИтог[3]>=10&&ныр.fieldИтог[0]===3&&ныр.fieldИтог[1]===2&&ныр.fieldИтог[2]===1&&ныр.mechИтог[0]===1&&ныр.mechИтог[1]&&ныр.mechИтог[2]===1&&ныр.settleИтог[0]===36&&ныр.settleИтог[1]>=2&&ныр.settleИтог[2]===undefined&&ныр.giantsИтог[0]===94&&ныр.giantsИтог[1]===1&&ныр.caveИтог[0]===1&&ныр.caveИтог[1]===1&&ныр.caveИтог[2]===1,
  [ныр.ruinsИтог,ныр.fieldИтог,ныр.mechИтог,ныр.settleИтог,ныр.giantsИтог,ныр.caveИтог]);
 check('6в. хищники и владыка глубин — бой на поверхности; владыка помечен и назван; с одним тактом владыка не просыпается',
  ныр.predБой&&ныр.predИмя&&ныр.bossБой&&/Владыка глубин/.test(String(ныр.bossИмя))&&ныр.bossФлаг&&ныр.boss1Бой===false,[ныр.predИмя,ныр.bossИмя,ныр.bossФлаг,ныр.boss1Бой]);

 /* ── 7. счёт, текст, сохранение ── */
 const итог=await page.evaluate(()=>{
  const r={};r.dives=deeds("dives");r.виды=Object.keys(G.dives||{}).length;
  r.текст=seasText();saveGame(true);const raw=localStorage.getItem(SAVE_KEY)||"";
  r.сохр=/"seasSeen"/.test(raw)&&/"isles"/.test(raw)&&/"dives"/.test(raw)&&/"islesLanded"/.test(raw);
  return r;});
 check('7. погружения считаются делом ветви, «Моря» говорят родами и счётом, пройденное — в сохранении',
  итог.dives>=12&&итог.виды===10&&/Морей 8 родов/.test(итог.текст)&&/Островов 11 родов/.test(итог.текст)&&/Под водой 10 родов/.test(итог.текст)&&итог.сохр,итог);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
