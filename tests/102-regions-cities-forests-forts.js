/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 102: ГЕОГРАФИЯ БОЛЬШОГО МИРА — ОБЛАСТИ, ГОРОДА, ЛЕСА, КРЕПОСТИ

   1. Двадцать областей покрывают мир сеткой пять на четыре; у каждой имя,
      описание, климат, биомы, товар, опасность и голоса записями; область
      названа в «где я», объявляется на входе и звучит музыкой впервые.
   2. Девятнадцать именованных городов стоят в мире как постройки, видны
      поиску городов, у каждого своя роль и районы: не меньше двадцати,
      у Кольцевого города — сорок два, имена районов не повторяются, у
      района своё дело, слух и дозор; план города их перечисляет.
   2б. У каждой из двенадцати держав от пяти до десяти городов: недостающие
      ставятся кольцом вокруг престола, внутри своей земли, с делом по
      месту, своими районами, товаром и голосом; внутрь них входят.
   2в. У каждого города десять и больше организаций: свои палаты и цехи по
      кварталам плюс Дом этих земель, здешние синдикаты, оппозиция державы
      и её шпионы; у каждой глава, квартал, сила и то, чем её берут.
   2г. У каждого города три своих голоса, и в окне города звучат они, а не
      общий зал цитадели; у каждого нрава организации свой голос.
   3. Тридцать великих лесов десяти родов: лес узнаётся по месту, объявляется
      на входе, даёт свои голоса окружению, хищника и редкость.
   4. Сто двадцать крепостей десяти родов на своих местах, с частями;
      состояние в сохранении; осада, защита, взятие, восстановление,
      укрепление, передача и база работают и звучат; война двигает крепости
      сама; павшая крепость портит подвоз державы.
   5. Реестр модулей знает географию, города, леса и крепости.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});

 /* ── 1. Области ── */
 const обл=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  r.всего=REGIONS.length;r.имена=new Set(REGIONS.map(x=>x.n)).size;
  r.поля=REGIONS.filter(x=>!x.n||!x.о||!x.климат||!x.биомы.length||!x.ресурс||!x.опасность||!x.звук.length).map(x=>x.id);
  r.нетЗаписи=[];REGIONS.forEach(x=>x.звук.forEach(z=>{if(!Bank.has(z))r.нетЗаписи.push(x.id+":"+z);}));
  r.биомы=[];REGIONS.forEach(x=>x.биомы.forEach(b=>{if(!BIOMES.find(y=>y.id===b))r.биомы.push(x.id+":"+b);}));
  r.углы=[regionAt(0,0).id,regionAt(WORLD-1,0).id,regionAt(0,WORLD-1).id,regionAt(WORLD-1,WORLD-1).id,regionAt(WORLD>>1,WORLD>>1).id];
  const покрытие=new Set();for(let x=0;x<WORLD;x+=2500)for(let y=0;y<WORLD;y+=2500)покрытие.add(regionAt(x,y).id);
  r.покрытие=покрытие.size;
  /* где я */
  G.place=null;G.ship=null;SAID.length=0;handleThreeFingerSwipe("E");await пауза(50);
  r.гдея=SAID.find(t=>/Вы здесь/.test(t))||"";
  r.гдеяОбласть=/область /.test(r.гдея)&&r.гдея.includes(regionAt(G.x,G.y).n);
  /* вход в новую область */
  G.seenRegions={};Regions._last=null;
  const было={x:G.x,y:G.y};
  const цель=REGIONS[7];const c=regionCenter(цель);G.x=Math.round(c.x)+1;G.y=Math.round(c.y)+1;if(G.x%29===0)G.x++;if(G.y%29===0)G.y++;
  SAID.length=0;PLAYED.length=0;Jingle.last=null;
  const ок=Regions.arrive(cellContent(G.x,G.y));await пауза(900);
  r.вход={ок,сказано:SAID.find(t=>/Область:/.test(t))||"",впервые:!!SAID.find(t=>/впервые/.test(t)),голос:PLAYED.includes(цель.звук[0]),музыка:Jingle.last&&Jingle.last.id,ярус:Jingle.last&&Jingle.last.tier,ярусОжид:цель.ярус,запомнено:!!G.seenRegions[цель.id]};
  const снова=Regions.arrive(cellContent(G.x,G.y));r.второйРаз=снова;
  r.окружение=Ambience.spots(ambienceSetFor()).some(([role])=>цель.звук.includes(role));
  r.цена=regionPriceK(цель.ресурс);
  r.новости=worldNews(G.day).some(t=>t.includes(цель.n));
  G.x=было.x;G.y=было.y;
  return r;});
 check('двадцать областей с разными именами и всеми полями; записи и биомы настоящие',обл.всего===20&&обл.имена===20&&!обл.поля.length&&!обл.нетЗаписи.length&&!обл.биомы.length,{поля:обл.поля,нет:обл.нетЗаписи.slice(0,4),биомы:обл.биомы.slice(0,4)});
 check('сетка пять на четыре покрывает весь мир: все двадцать областей достижимы, углы и середина свои',обл.покрытие===20&&new Set(обл.углы).size===5,обл.углы);
 check('«где я» называет область',обл.гдеяОбласть,обл.гдея.slice(0,120));
 check('вход в область: слово, голос области, музыка открытия своего яруса, память; второй раз молчит',
  обл.вход.ок&&/Область:/.test(обл.вход.сказано)&&обл.вход.впервые&&обл.вход.голос&&обл.вход.музыка==="region_new"&&обл.вход.ярус===обл.вход.ярусОжид&&обл.вход.запомнено&&обл.второйРаз===false,обл.вход);
 check('область добавляет свои голоса окружению, свой товар дешевле, новости знают область',обл.окружение&&обл.цена<1&&обл.новости,{окружение:обл.окружение,цена:обл.цена,новости:обл.новости});

 /* ── 2. Именованные города ── */
 const гор=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  r.всего=NAMED_CITIES.length;r.имена=new Set(NAMED_CITIES.map(c=>c.n)).size;
  r.координаты=new Set(NAMED_CITIES.map(c=>c.x+","+c.y)).size;
  r.наДороге=NAMED_CITIES.filter(c=>isRoad(c.x,c.y)).map(c=>c.n);
  r.постройки=NAMED_CITIES.filter(c=>{const s=cellContent(c.x,c.y).structure;return !(s&&s.named===c.id&&PLACE_KIND[s.type]==="city");}).map(c=>c.n);
  r.поиск=NAMED_CITIES.filter(c=>{const f=isCityAt(c.x,c.y);return !(f&&f.named===c.id);}).map(c=>c.n);
  const районы={};NAMED_CITIES.forEach(c=>{const d=namedCityDistricts(c);районы[c.id]={n:d.length,уник:new Set(d.map(x=>x.n)).size,поля:d.every(x=>x.n&&x.p&&x.слух!==undefined&&x.дозор!==undefined)};});
  r.мало=Object.keys(районы).filter(id=>районы[id].n<12||районы[id].uник===false);
  r.кольцо=районы.ring;r.аркель=районы.arkel;
  r.повторы=Object.keys(районы).filter(id=>районы[id].уник!==районы[id].n);
  /* вход в Аркель */
  const a=NAMED_CITY_BY_ID.arkel;const бx=G.x,бy=G.y;G.x=a.x;G.y=a.y;G.place=null;
  const c=cellContent(G.x,G.y);const ок=enterPlace(c);await пауза(300);
  const lvl=curLevel();
  r.вошли=!!G.place&&!!lvl;r.кварталов=lvl?lvl.blocks.length:0;r.кварталы=lvl?lvl.blocks.map(b=>b.name):[];
  r.свои=lvl?a.свои.every(n=>r.кварталы.includes(n)):false;
  r.уник=new Set(r.кварталы).size===r.кварталов;
  r.слух=lvl?lvl.blocks.every(b=>b.слух):false;
  SAID.length=0;cityPlan();r.план=SAID.slice(-1)[0]||"";
  r.планСвои=a.свои.some(n=>r.план.includes(n));
  G.place=null;
  /* Кольцевой город */
  const k=NAMED_CITY_BY_ID.ring;G.x=k.x;G.y=k.y;const ок2=enterPlace(cellContent(G.x,G.y));await пауза(300);
  const l2=curLevel();r.кольцоКварталов=l2?l2.blocks.length:0;r.кольцоУник=l2?new Set(l2.blocks.map(b=>b.name)).size:0;
  r.кольцоДозор=l2?l2.blocks.filter(b=>b.дозор>=2).length:0;
  G.place=null;G.x=бx;G.y=бy;
  r.ближ=Cities.nearest(бx,бy);r.текст=Cities.text(a);
  return r;});
 check('девятнадцать именованных городов с разными именами и местами, не на дорогах',гор.всего===19&&гор.имена===19&&гор.координаты===19&&!гор.наДороге.length,гор.наДороге);
 check('каждый город стоит в мире постройкой города и виден поиску городов',!гор.постройки.length&&!гор.поиск.length,{постройки:гор.постройки,поиск:гор.поиск});
 check('районы: у каждого города не меньше двенадцати, имена не повторяются, у района дело, слух и дозор',!гор.мало.length&&!гор.повторы.length&&гор.кольцо.n===42&&гор.аркель.n>=20,{кольцо:гор.кольцо,аркель:гор.аркель,повторы:гор.повторы});
 check('Аркель внутри: не меньше двадцати кварталов, свои районы на месте, имена уникальны, у каждого слух; план города называет свои районы',
  гор.вошли&&гор.кварталов>=20&&гор.свои&&гор.уник&&гор.слух&&гор.планСвои,{кварталов:гор.кварталов,кварталы:гор.кварталы.slice(0,6),план:гор.план.slice(0,100)});
 check('Кольцевой город: сорок два района, все разные, есть районы с усиленным дозором',гор.кольцоКварталов===42&&гор.кольцоУник===42&&гор.кольцоДозор>=3,{кварталов:гор.кольцоКварталов,уник:гор.кольцоУник,дозор:гор.кольцоДозор});
 check('ближайший именованный город находится, описание города полное',гор.ближ&&гор.ближ.c&&гор.ближ.d>=0&&/Районов \d+/.test(гор.текст)&&/пошлина/.test(гор.текст),{ближ:гор.ближ&&гор.ближ.c.n,текст:гор.текст.slice(0,80)});

 /* ── 2б. Города держав (§29: у державы от пяти до десяти городов) ── */
 const держГорода=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const свои=Cities.empireAll();
  r.всего=свои.length;
  r.поДержавам=Cities.countByEmpire();
  r.мало=r.поДержавам.filter(n=>n<5).length;
  r.много=r.поДержавам.filter(n=>n>10).length;
  r.чужаяЗемля=свои.filter(c=>empireIndexAt(c.x,c.y)!==c.держава).map(c=>c.n);
  r.наЧужом=свои.filter(c=>NAMED_CITY_MAP.has(c.x+","+c.y)||FORT_MAP.has(c.x+","+c.y)
   ||EMPIRES.some(e=>e.cap.x===c.x&&e.cap.y===c.y)).map(c=>c.n);
  r.двое=свои.length-new Set(свои.map(c=>c.x+","+c.y)).size;
  r.безПолей=свои.filter(c=>!c.n||!c.роль||!c.о||c.свои.length!==3||!c.товар.length
   ||!c.нужда.length||!(c.пошлина>0)||!CITY_TRADE_BY_ID[c.дело]).map(c=>c.id);
  r.немые=свои.filter(c=>!(c.звук||[]).length||!c.звук.every(z=>Bank.has(z))).map(c=>c.n);
  r.чужойТовар=свои.filter(c=>c.товар.concat(c.нужда).some(x=>LAND_RES.indexOf(x)<0)).map(c=>c.n);
  r.дел=new Set(свои.map(c=>c.дело)).size;
  /* Город державы стоит в мире постройкой и открывается так же, как
     именованный: та же сетка районов, те же кварталы, тот же слух. */
  const c=свои[0];
  const ст=cellContent(c.x,c.y).structure;
  r.постройка=!!(ст&&ст.type==="castle"&&ст.name===c.полное);
  r.поиск=!!safeFn(()=>{const z=isCityAt(c.x,c.y);return z&&z.name===c.полное;},false);
  r.районов=Cities.districts(c).length;
  r.районыУник=new Set(Cities.districts(c).map(d=>d.n)).size===r.районов;
  r.свойРайон=Cities.districts(c)[0].n===c.свои[0];
  const бx=G.x,бy=G.y;
  G.x=c.x;G.y=c.y;r.вошли=!!enterPlace(cellContent(G.x,G.y));await пауза(300);
  const lvl=curLevel();
  r.кварталов=lvl?lvl.blocks.length:0;
  r.кварталыСлух=lvl?lvl.blocks.every(b=>b.слух):false;
  r.кварталыСвои=lvl?c.свои.some(n=>lvl.blocks.some(b=>b.name===n)):false;
  G.place=null;G.x=бx;G.y=бy;
  r.ближАny=safeFn(()=>{const z=Cities.nearestAny(c.x+30,c.y+30);return z&&z.c.n;},null);
  r.строка=safeFn(()=>{const z=worldSelfCheck().find(v=>v.id==="towns");return z?z.ok:null;},null);
  r.текст=Empires.citiesText(c.держава);
  return r;});
 check('у каждой из двенадцати держав от пяти до десяти городов, и всякий свой стоит в своей земле, не на престоле, крепости или именованном городе',
  держГорода.поДержавам.length===12&&держГорода.мало===0&&держГорода.много===0
  &&!держГорода.чужаяЗемля.length&&!держГорода.наЧужом.length&&держГорода.двое===0
  &&держГорода.строка===true,
  {поДержавам:держГорода.поДержавам,своих:держГорода.всего,чужая:держГорода.чужаяЗемля,
   наЧужом:держГорода.наЧужом});
 check('у города державы своё дело, свои три района, товар из мировых ресурсов и голоса записями',
  !держГорода.безПолей.length&&!держГорода.немые.length&&!держГорода.чужойТовар.length
  &&держГорода.дел>=6,
  {безПолей:держГорода.безПолей,немые:держГорода.немые,чужойТовар:держГорода.чужойТовар,дел:держГорода.дел});
 check('город державы стоит постройкой, виден поиску городов и открывается внутрь со своими районами',
  держГорода.постройка&&держГорода.поиск&&держГорода.районов>=9&&держГорода.районыУник
  &&держГорода.свойРайон&&держГорода.вошли&&держГорода.кварталов>=9
  &&держГорода.кварталыСлух&&держГорода.кварталыСвои&&!!держГорода.ближАny
  &&/Города державы/.test(держГорода.текст),
  {районов:держГорода.районов,кварталов:держГорода.кварталов,ближ:держГорода.ближАny,
   текст:String(держГорода.текст).slice(0,90)});

 /* ── 2в. Организации города (§12: десять и больше в большом городе) ── */
 const орг=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  const r={};
  const все=NAMED_CITIES.concat(Cities.empireAll());
  const счёт=все.map(c=>Cities.orgs(c).length);
  r.городов=все.length;r.мин=Math.min.apply(null,счёт);r.макс=Math.max.apply(null,счёт);
  r.безПолей=[];r.повторы=[];
  все.forEach(c=>{const l=Cities.orgs(c);
   if(l.some(z=>!z.n||!z.дело||!z.глава||!z.район||!z.нрав||!(z.сила>=1&&z.сила<=5)))r.безПолей.push(c.n);
   if(new Set(l.map(z=>z.n)).size!==l.length)r.повторы.push(c.n);});
  /* Мировые организации попадают в список города, а не выдумываются заново. */
  const ring=NAMED_CITY_BY_ID.ring;const l=Cities.orgs(ring);
  r.естьДом=l.some(z=>HOUSES.some(h=>h.n===z.n));
  r.естьСиндикат=l.some(z=>SYNDICATES.some(y=>y.n===z.n));
  r.естьОппозиция=l.some(z=>EMPIRE_EXTRA.some(e=>e.оппозиция.n===z.n));
  /* Команда слышна внутри стен и молчит снаружи. */
  const бx=G.x,бy=G.y;
  G.x=ring.x;G.y=ring.y;enterPlace(cellContent(G.x,G.y));await пауза(350);
  r.вГороде=amAvailable("cityorgs");
  SAID.length=0;r.ок=CMD.cityorgs();await пауза(150);
  r.сказано=SAID.filter(t=>/Организаций в городе/.test(t)).slice(-1)[0]||SAID.slice(-1)[0]||"";
  G.place=null;G.x=бx;G.y=бy;
  r.снаружиВидно=amAvailable("cityorgs");
  SAID.length=0;CMD.cityorgs();await пауза(150);
  /* Смотрим НЕ последнюю реплику, а все сказанные за это время: последней
     может оказаться чужая, прилетевшая с полуторасекундного хода мира, —
     и тогда проверка падала бы не на поведении игры, а на её часах. */
  r.снаружиВсе=SAID.slice();
  r.снаружи=SAID.filter(t=>/внутри городских стен/.test(t))[0]||SAID.slice(-1)[0]||"";
  r.снаружиМолчитОСписке=!SAID.some(t=>/Организаций в городе/.test(t));
  r.строка=safeFn(()=>{const z=worldSelfCheck().find(v=>v.id==="orgs");return z?z.ok:null;},null);
  return r;});
 check('в каждом городе десять и больше организаций, и у каждой глава, квартал, сила и нрав',
  орг.мин>=10&&!орг.безПолей.length&&!орг.повторы.length&&орг.строка===true,
  {городов:орг.городов,мин:орг.мин,макс:орг.макс,безПолей:орг.безПолей.slice(0,3),повторы:орг.повторы.slice(0,3)});
 check('организации города берут из мира то, что в мире уже есть: Дом этих земель, синдикат и оппозицию державы',
  орг.естьДом&&орг.естьСиндикат&&орг.естьОппозиция,
  {дом:орг.естьДом,синдикат:орг.естьСиндикат,оппозиция:орг.естьОппозиция});
 check('организации называются внутри городских стен и честно молчат снаружи',
  орг.ок===true&&/Организаций в городе \d+/.test(орг.сказано)&&/внутри городских стен/.test(орг.снаружи)
  &&орг.снаружиМолчитОСписке===true
  &&орг.вГороде===true&&орг.снаружиВидно===false,
  {сказано:орг.сказано.slice(0,90),снаружи:орг.снаружи.slice(0,90),
   снаружиВсе:(орг.снаружиВсе||[]).slice(0,3),
   вГороде:орг.вГороде,снаружиВидно:орг.снаружиВидно});

 /* ── 2г. Голоса города: три записи у каждого, и они звучат ── */
 const голоса=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  window.PLAYED=[];const pb=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push(String(r));return pb(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  const r={};
  const бx=G.x,бy=G.y;
  r.безГолоса=NAMED_CITIES.concat(Cities.empireAll())
   .filter(c=>!(c.звук||[]).length||!c.звук.every(z=>Bank.has(z))).map(c=>c.n);
  /* Именованный город отвечает своими голосами, а не общим залом цитадели. */
  const ring=NAMED_CITY_BY_ID.ring;
  G.x=ring.x;G.y=ring.y;PLAYED.length=0;
  openBuilding(cellContent(ring.x,ring.y));await пауза(2400);
  r.кольцоСвои=ring.звук.filter(z=>PLAYED.indexOf(z)>=0).length;
  r.кольцоОбщий=PLAYED.indexOf("hall_center")>=0;
  while(activeLayer&&activeLayer())closeTopUI();
  /* Город державы — тоже своими. */
  const свой=Cities.empireAll()[0];
  G.x=свой.x;G.y=свой.y;PLAYED.length=0;
  openBuilding(cellContent(свой.x,свой.y));await пауза(2400);
  r.свойСвои=свой.звук.filter(z=>PLAYED.indexOf(z)>=0).length;
  while(activeLayer&&activeLayer())closeTopUI();
  /* У престола своего голоса нет — там прежний зал цитадели. */
  const cap=EMPIRES[0].cap;G.x=cap.x;G.y=cap.y;PLAYED.length=0;
  openBuilding(cellContent(cap.x,cap.y));await пауза(1200);
  r.престолОбщий=PLAYED.indexOf("hall_center")>=0;
  while(activeLayer&&activeLayer())closeTopUI();
  /* Нрав организации слышен: у каждого из четырёх свой голос. */
  r.нравов=Object.keys(ORG_VOICE).length;
  r.нравыВБанке=Object.values(ORG_VOICE).every(z=>Bank.has(z));
  r.нравыРазные=new Set(Object.values(ORG_VOICE)).size===Object.keys(ORG_VOICE).length;
  r.нравБезГолоса=ORG_KINDS.filter(k=>!ORG_VOICE[k.нрав]).map(k=>k.id);
  G.x=ring.x;G.y=ring.y;enterPlace(cellContent(G.x,G.y));await пауза(400);
  PLAYED.length=0;CMD.cityorgs();await пауза(900);
  const глава=Cities.orgs(ring).slice().sort((a,b)=>(b.сила||0)-(a.сила||0))[0];
  r.оргГолос=PLAYED.indexOf(ORG_VOICE[глава.нрав])>=0;
  G.place=null;G.x=бx;G.y=бy;
  r.строка=safeFn(()=>{const z=worldSelfCheck().find(v=>v.id==="cityvoice");return z?z.ok:null;},null);
  return r;});
 check('у каждого города свои голоса записями, и в окне города звучат они, а не общий зал цитадели',
  !голоса.безГолоса.length&&голоса.кольцоСвои>=3&&!голоса.кольцоОбщий
  &&голоса.свойСвои>=3&&голоса.престолОбщий&&голоса.строка===true,
  {без:голоса.безГолоса.slice(0,3),кольцо:голоса.кольцоСвои,свой:голоса.свойСвои,
   общийУКольца:голоса.кольцоОбщий,престол:голоса.престолОбщий});
 check('нрав организации слышен: четыре нрава — четыре разных голоса, и сильнейшая отвечает своим',
  голоса.нравов===4&&голоса.нравыВБанке&&голоса.нравыРазные
  &&!голоса.нравБезГолоса.length&&голоса.оргГолос,голоса);

 /* ── 3. Великие леса ── */
 const лес=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  r.всего=FORESTS.length;r.родов=new Set(FORESTS.map(f=>f.kind)).size;r.имена=new Set(FORESTS.map(f=>f.n)).size;
  r.нетЗаписи=[];Object.keys(FOREST_KINDS).forEach(k=>{const K=FOREST_KINDS[k];K.звук.concat([K.птицы,K.насекомые]).forEach(z=>{if(!Bank.has(z))r.нетЗаписи.push(k+":"+z);});
   if(!MONSTERS.find(m=>m.id===K.хищник))r.нетЗаписи.push(k+":хищник:"+K.хищник);});
  /* найти лес, в котором есть лесная клетка */
  let найден=null;
  for(const f of FORESTS){for(let dx=-f.r;dx<=f.r&&!найден;dx+=97)for(let dy=-f.r;dy<=f.r&&!найден;dy+=97){const x=f.x+dx,y=f.y+dy;if(x<2||y<2||x>=WORLD-2||y>=WORLD-2)continue;if(terrainAt(x,y)[0]==="forest"&&forestAt(x,y)===f)найден={f,x,y};}if(найден)break;}
  if(!найден)return {всего:r.всего,нетЛеса:true};
  const бx=G.x,бy=G.y;G.place=null;G.ship=null;G.x=найден.x;G.y=найден.y;if(G.x%29===0)G.x++;
  G.seenForests={};Forests._last=null;SAID.length=0;PLAYED.length=0;Jingle.last=null;
  const ок=Forests.arrive(cellContent(G.x,G.y));await пауза(800);
  const K=FOREST_KINDS[найден.f.kind];
  r.вход={ок,сказано:SAID.find(t=>t.includes(найден.f.n))||"",голос:PLAYED.includes(K.звук[0]),музыка:Jingle.last&&Jingle.last.id,ярус:Jingle.last&&Jingle.last.tier,запомнено:!!G.seenForests[найден.f.id]};
  r.окружение=Forests.spots().some(([role])=>role===K.птицы);
  r.хищник=Forests.predatorK(K.хищник);r.чужой=Forests.predatorK("kraken");r.редкость=Forests.rareK(K.редкость);
  r.гдея=(()=>{SAID.length=0;handleThreeFingerSwipe("E");return SAID.find(t=>/Вы здесь/.test(t))||"";})();
  r.гдеяЛес=r.гдея.includes(найден.f.n);
  G.x=бx;G.y=бy;Forests._last=null;
  return r;});
 check('тридцать великих лесов десяти родов с разными именами; голоса, птицы и хищники настоящие',лес.всего===30&&лес.родов===10&&лес.имена===30&&!лес.нетЗаписи.length,лес.нетЗаписи);
 check('вход в лес: слово, голос леса, музыка открытия яруса «лес», память; «где я» называет лес',
  !лес.нетЛеса&&лес.вход.ок&&лес.вход.сказано&&лес.вход.голос&&лес.вход.музыка==="place_new"&&лес.вход.ярус==="forest"&&лес.вход.запомнено&&лес.гдеяЛес,лес.вход);
 check('лес даёт голоса окружению, своего хищника чаще, чужого — как всем, редкость — вдвое',лес.окружение&&лес.хищник>1&&лес.чужой===1&&лес.редкость===2,{окружение:лес.окружение,хищник:лес.хищник,редкость:лес.редкость});

 /* ── 4. Крепости ── */
 const кр=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  r.всего=FORTS.length;r.родов=new Set(FORTS.map(f=>f.cat)).size;r.имена=new Set(FORTS.map(f=>f.n)).size;r.места=new Set(FORTS.map(f=>f.x+","+f.y)).size;
  r.наДороге=FORTS.filter(f=>isRoad(f.x,f.y)).length;
  r.постройки=FORTS.filter(f=>{const s=cellContent(f.x,f.y).structure;return !(s&&s.type==="fortress"&&s.fort===f.id);}).length;
  r.частей=FORT_PARTS.length;
  const f=FORTS.find(x=>x.cat==="border");const st=Forts.state(f.id);r.состояние={...st};
  /* внутрь */
  const бx=G.x,бy=G.y;G.place=null;G.ship=null;G.x=f.x;G.y=f.y;
  const ок=enterPlace(cellContent(G.x,G.y));await пауза(300);const lvl=curLevel();
  r.вошли=!!G.place&&G.place.stype==="fortress";r.кварталов=lvl?lvl.blocks.length:0;r.части=lvl?lvl.blocks.map(b=>b.часть).filter(Boolean):[];
  r.профессии=(PROFS.fortress||[]).length;
  G.place=null;
  /* окно здания с действиями */
  openBuilding(cellContent(G.x,G.y));const html=document.getElementById("bldBody").innerHTML;closeTopUI();
  r.кнопки=["fort:status","fort:besiege","fort:capture"].filter(k=>html.includes(k));
  /* осада → дни → взятие */
  PLAYED.length=0;r.осада=Forts.besiege(f.id);r.осадаЗвук=PLAYED.includes("siege_alarm_city");
  r.повтор=Forts.besiege(f.id);
  r.рано=Forts.capture(f.id);
  for(let i=0;i<8;i++)Forts.tick();
  r.после={walls:Forts.state(f.id).walls,supplies:Forts.state(f.id).supplies};
  /* бой с капитаном */
  while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
  r.бой=Forts.capture(f.id);r.капитан=G.inCombat&&G.combat&&G.combat.m&&G.combat.m.взятие&&G.combat.m.взятие.fort===f.id;
  if(r.капитан){G.combat.hp=0;Jingle.last=null;PLAYED.length=0;victory();await пауза(700);
   const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;G.loot=null;while(activeLayer())closeTopUI();}
  r.взята=Forts.state(f.id).owner==="player";r.взятиеМузыка=Jingle.last&&Jingle.last.id;r.взятиеЗвук=PLAYED.includes("siege_victory");
  /* восстановить, укрепить, база, передать */
  G.gold=1000;G.inv["кристалл"]=5;
  PLAYED.length=0;r.восст=Forts.restore(f.id);r.стены=Forts.state(f.id).walls;r.восстЗвук=PLAYED.includes("build_work");
  PLAYED.length=0;r.укреп=Forts.modernize(f.id);r.контур=Forts.state(f.id).ward;r.кристаллов=Number(G.inv["кристалл"])||0;r.укрепЗвук=PLAYED.includes("build_magic");
  G.hp=5;G.mana=1;PLAYED.length=0;r.база=Forts.base(f.id);r.базаHp=G.hp===G.hpMax;r.базаЗвук=PLAYED.includes("wild_hearth");
  const rep0=(G.rep&&G.rep[RACE_BY_NAME[EMPIRES[1].race].id])||0;
  PLAYED.length=0;r.передача=Forts.transfer(f.id,1);r.владелец=Forts.state(f.id).owner;r.репВыросла=((G.rep&&G.rep[RACE_BY_NAME[EMPIRES[1].race].id])||0)>rep0;r.передачаЗвук=PLAYED.includes("hall_gate");
  /* защита: осада державой и бой с сотником */
  const g=FORTS.find(x=>x.cat==="river");const sg=Forts.state(g.id);sg.owner=0;sg.siege={by:1,day:G.day};
  G.x=g.x;G.y=g.y;while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
  r.защита=Forts.defend(g.id);r.сотник=G.inCombat&&G.combat.m.защита&&G.combat.m.защита.fort===g.id;
  if(r.сотник){G.combat.hp=0;victory();await пауза(500);const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;G.loot=null;while(activeLayer())closeTopUI();}
  r.осадаСнята=!Forts.state(g.id).siege;
  /* война двигает крепости сама */
  const wars=warsAt(G.day);r.войн=wars.length;
  const day0=G.day;let осадДержав=0;for(let d=0;d<25;d++){G.day=day0+d;Forts.tick();}
  осадДержав=Object.keys(G.forts).filter(id=>G.forts[id].siege&&G.forts[id].siege.by!=="player").length;G.day=day0;
  r.осадДержав=осадДержав;r.новости=Forts.news();
  /* подвоз державы с павшей крепостью */
  const h=FORTS.find(x=>x.cat==="mountain");const sh=Forts.state(h.id);sh.owner=2;sh.walls=10;
  r.подвоз=roadSafetyK(2)>1;r.почему=priceWhy("руда",2,null);
  /* сохранение */
  const raw=serializeSave();const d=JSON.parse(raw);r.вСохранении=!!(d.forts&&d.forts[f.id]&&d.seenRegions);
  G.x=бx;G.y=бy;
  return r;});
 check('сто двадцать крепостей десяти родов, все с разными именами и местами, не на дорогах, стоят в мире постройками',кр.всего===120&&кр.родов===10&&кр.имена===120&&кр.места===120&&кр.наДороге===0&&кр.постройки===0,{имена:кр.имена,места:кр.места,постройки:кр.постройки});
 check('у крепости двенадцать частей; внутри — крепость с восемью кварталами-частями и своими людьми',кр.частей>=12&&кр.вошли&&кр.кварталов===8&&кр.части.length===8&&кр.профессии===3,{кварталов:кр.кварталов,части:кр.части});
 check('окно крепости даёт состояние, осаду и захват',кр.кнопки.length===3,кр.кнопки);
 check('осада начинается со звуком, второй раз отклоняется, рано брать нельзя; восемь дней осады рушат стены и припасы',
  кр.осада===true&&кр.осадаЗвук&&кр.повтор===false&&кр.рано===false&&кр.после.walls<=30&&кр.после.supplies<=0,{после:кр.после,состояние:кр.состояние});
 check('взятие — бой с капитаном гарнизона; победа отдаёт крепость, звучит победа и музыка',кр.бой===true&&кр.капитан&&кр.взята&&кр.взятиеЗвук&&кр.взятиеМузыка==="victory_great",{взята:кр.взята,музыка:кр.взятиеМузыка});
 check('восстановление поднимает стены, укрепление ставит контур за кристаллы, база лечит — всё со звуком',
  кр.восст&&кр.стены===100&&кр.восстЗвук&&кр.укреп&&кр.контур&&кр.кристаллов===2&&кр.укрепЗвук&&кр.база&&кр.базаHp&&кр.базаЗвук,{стены:кр.стены,контур:кр.контур,кристаллов:кр.кристаллов});
 check('передача державе меняет владельца, растит репутацию народа и звучит',кр.передача&&кр.владелец===1&&кр.репВыросла&&кр.передачаЗвук,{владелец:кр.владелец,реп:кр.репВыросла});
 check('защита от осады — бой с осадным сотником; победа снимает осаду',кр.защита&&кр.сотник&&кр.осадаСнята,{защита:кр.защита,сотник:кр.сотник,снята:кр.осадаСнята});
 check('война двигает крепости без игрока: за месяц державы сами садятся под стены, новости об этом есть',кр.войн===0||(кр.осадДержав>0&&кр.новости.length>0),{войн:кр.войн,осад:кр.осадДержав,новости:кр.новости});
 check('павшая крепость портит подвоз державы и это названо в причинах цены',кр.подвоз&&/крепость/.test(кр.почему),кр.почему);
 check('крепости и области попадают в сохранение',кр.вСохранении);

 /* ── 5. Реестр ── */
 const мод=await page.evaluate(()=>({список:Modules.list(),гео:!!Modules.get("GEOGRAPHY"),города:!!Modules.get("CITIES"),леса:!!Modules.get("FORESTS"),крепости:!!Modules.get("FORTRESSES")}));
 check('реестр модулей знает географию, города, леса и крепости',мод.гео&&мод.города&&мод.леса&&мод.крепости,мод.список);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const passed=results.filter(r=>r.startsWith('PASS')).length;
 console.log(`ИТОГО: ${passed} из ${results.length}`);
 process.exit(passed===results.length?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
