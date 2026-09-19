/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 100: ЗВУКОВЫЕ МОДЕЛИ ПРЕДМЕТОВ И ШАГ КАК СВЕДЕНИЕ

   По ТЗ у каждого предмета своя модель: двери — восемь родов на семь
   состояний, сундуки — девять состояний, книги — восемь, алтари — семь.
   Шаг различает восемнадцать поверхностей и обстоятельства: бег, доспех,
   дождь, глубина, ступени; один и тот же вариант не идёт подряд.

   1. Таблицы дверей, сундуков, книг и алтарей полны, все записи в банке.
   2. Род двери решает место: оплот — железо, храм — тяжёлая, башня —
      чары, руины — скрип, глубина — решётка, ворота — ворота.
   3. Дверь звучит на входе и на выходе; запертая, взлом и решётка — свои.
   4. Сундук глубины — редкий, казна — артефактный; книга-гримуар
      раскрывается с чарами; обряд завершается колоколом.
   5. Восемнадцать поверхностей названы и озвучены.
   6. Профиль шага: бег быстрее, железо ниже и с лязгом, дождь с хлюпом,
      глубина с эхом.
   7. Шаги не повторяют вариант подряд; топь, дождь и ступени слышны как
      свои поверхности.
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
 await page.evaluate(()=>{window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push([String(r),(o&&o.kind)||"fx"]);return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{PLAYED.push([String(r),(o&&o.kind)||"fx"]);return sr(r,dx,dy,Object.assign({},o||{},{gain:0.01,maxSec:0.4}));};
  window.roles=()=>PLAYED.map(x=>x[0]);});

 /* ── 1. Таблицы ── */
 const табл=await page.evaluate(()=>{
  const нет=[];
  const проверь=(имя,t,states)=>{for(const k in t){const m=t[k];states.forEach(st=>{const l=m[st];if(!Array.isArray(l)||!l.length)нет.push(имя+":"+k+":"+st);else l.forEach(r=>{if(!Bank.has(r))нет.push(имя+":"+k+":"+r);});});}};
  проверь("дверь",DOOR_SOUND,DOOR_STATES);
  const ch=Object.keys(CHEST_SOUND);ch.forEach(k=>CHEST_SOUND[k].forEach(r=>{if(!Bank.has(r))нет.push("сундук:"+r);}));
  Object.keys(BOOK_SOUND).forEach(k=>BOOK_SOUND[k].forEach(r=>{if(!Bank.has(r))нет.push("книга:"+r);}));
  Object.keys(ALTAR_SOUND).forEach(k=>ALTAR_SOUND[k].forEach(r=>{if(!Bank.has(r))нет.push("алтарь:"+r);}));
  return {дверей:Object.keys(DOOR_SOUND).length,состояний:DOOR_STATES.length,сундук:ch.length,книга:Object.keys(BOOK_SOUND).length,алтарь:Object.keys(ALTAR_SOUND).length,нет};});
 check('дверей восемь родов на семь состояний',табл.дверей>=8&&табл.состояний===7,табл);
 check('сундук — девять состояний, книга — восемь, алтарь — семь',табл.сундук>=9&&табл.книга>=8&&табл.алтарь>=7,табл);
 check('каждая запись моделей есть в банке',!табл.нет.length,табл.нет.slice(0,8));

 /* ── 2. Род двери по месту ── */
 const род=await page.evaluate(()=>{
  const было=G.place;const r={};
  const при=(st,depth,kind)=>{G.place={kind:kind||"house",stype:st,depth:depth||0,bx:1,by:1,x:1,y:1};return doorKindHere();};
  r.оплот=при("castle");r.храм=при("temple");r.башня=при("tower");r.руины=при("ruins");r.рынок=при("market");
  r.глубина1=при("dungeon",1,"dungeon");r.глубина4=при("dungeon",4,"dungeon");r.глубина7=при("dungeon",7,"dungeon");
  r.дом=при("house");r.ворота=doorKindHere("G");
  G.place=null;r.снаружи=doorKindHere();G.place=было;return r;});
 check('оплот — железо, храм — тяжёлая, башня — чары, руины — скрип, рынок — ворота',
  род.оплот==="iron"&&род.храм==="heavy"&&род.башня==="magic"&&род.руины==="creaky"&&род.рынок==="gate",род);
 check('глубина: сперва скрип, ниже тяжёлая, ещё ниже решётка; ворота — ворота; дом и улица — дерево',
  род.глубина1==="creaky"&&род.глубина4==="heavy"&&род.глубина7==="grate"&&род.ворота==="gate"&&род.дом==="wood"&&род.снаружи==="wood",род);

 /* ── 3. Дверь звучит ── */
 const дверь=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  PLAYED.length=0;r.ок=doorSound("iron","open");await пауза(400);r.железо=roles();
  PLAYED.length=0;r.нет=doorSound("wood","такого-нет");
  PLAYED.length=0;doorSound("magic","break");await пауза(400);r.чары=roles();
  PLAYED.length=0;doorSound("grate","locked");await пауза(400);r.решётка=roles();
  /* Вход в постройку и выход из неё. */
  outer: for(let q=1;q<60;q++)for(let dx=-q;dx<=q;dx++)for(let dy=-q;dy<=q;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]&&PLACE_KIND[c.structure.type]!=="dungeon"){G.x+=dx;G.y+=dy;break outer;}}
  G.place=null;PLAYED.length=0;useHere();await пауза(500);
  const вид=doorKindHere();r.вошли=!!G.place;r.вход=roles();r.видВхода=вид;
  const открыть=DOOR_SOUND[вид].open;
  r.входДверь=открыть.some(x=>r.вход.includes(x));
  const lvl=curLevel();
  for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]==="G"||lvl.g[y][x]==="<"){G.place.x=x;G.place.y=y;}
  PLAYED.length=0;useHere();await пауза(500);r.вышли=!G.place;r.выход=roles();
  r.выходДверь=DOOR_SOUND[вид].close.some(x=>r.выход.includes(x));
  return r;});
 check('железная дверь открывается своей связкой; неизвестное состояние — «нет»',
  дверь.ок===true&&дверь.нет===false&&DOORok(дверь.железо,["mtg_steel_door","oc_metal_light"]),дверь.железо);
 function DOORok(a,b){return b.every(x=>a.includes(x));}
 check('магическая дверь ломается взрывом, решётка на замке лязгает и звенит цепью',
  дверь.чары.includes("oc_blast")&&дверь.решётка.includes("oc_metal_dull")&&дверь.решётка.includes("oc_chain"),{чары:дверь.чары,решётка:дверь.решётка});
 check('вход в постройку звучит дверью её рода, выход — той же дверью',
  дверь.вошли&&дверь.входДверь&&дверь.вышли&&дверь.выходДверь,{вид:дверь.видВхода,вход:дверь.вход.slice(0,6),выход:дверь.выход.slice(0,6)});

 /* ── 4. Сундуки, книги, алтари ── */
 const вещи=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  G.place={kind:"dungeon",stype:"dungeon",depth:4,bx:3,by:3,x:2,y:2};r.глубина=chestTier(2,2);
  G.place.depth=1;r.верх=chestTier(2,2);G.place=null;
  PLAYED.length=0;chestSound("artifact");await пауза(700);r.артефакт=roles();
  PLAYED.length=0;bookSound("open",{вид:"гримуар"});await пауза(700);r.гримуар=roles();
  PLAYED.length=0;bookSound("read",{вид:"книга"});await пауза(100);r.книга=roles();
  PLAYED.length=0;bookSound("burn");await пауза(100);r.огонь=roles();
  PLAYED.length=0;altarSound("ritual_done");await пауза(100);r.обряд=roles();
  PLAYED.length=0;altarSound("curse");await пауза(100);r.порча=roles();
  return r;});
 check('сундук глубины — редкий, верхний — обычный; артефактный гудит артефактом',
  вещи.глубина==="rare"&&вещи.верх==="open"&&вещи.артефакт.includes("artifact_hum"),вещи);
 check('гримуар раскрывается с чарами, книга читается переплётом, горит огнём',
  вещи.гримуар.includes("magic_shimmer")&&вещи.книга[0]==="arte_book"&&вещи.огонь[0]==="oc_inflame",{гримуар:вещи.гримуар,книга:вещи.книга,огонь:вещи.огонь});
 check('обряд завершается колоколом, проклятие — тьмой',вещи.обряд[0]==="temple_bell"&&вещи.порча[0]==="spell_dark",{обряд:вещи.обряд,порча:вещи.порча});

 /* ── 5. Восемнадцать поверхностей ── */
 const пов=await page.evaluate(()=>{
  const надо=["grass","tallgrass","mud","wetdirt","sand","stone","gravel","snow","ice","wood","plank","marble","metal","bridge","stairs","swamp","water","deepwater"];
  const нет=надо.filter(k=>!SURF_NAME[k]);
  const безРоли=надо.filter(k=>!SURF_ROLE[k]||!Bank.has(SURF_ROLE[k]));
  const имена=надо.map(k=>SURF_NAME[k]);
  return {нет,безРоли,разных:new Set(имена).size,всего:Object.keys(SURF_NAME).length};});
 check('восемнадцать поверхностей ТЗ названы по-русски и у каждой своя запись',!пов.нет.length&&!пов.безРоли.length&&пов.разных===18,пов);

 /* ── 6. Профиль шага ── */
 const проф=await page.evaluate(()=>{
  const было={run:runState.active,armor:G.equip&&G.equip.armor,w:G.weather,place:G.place};
  G.place=null;G.weather="Ясно";runState.active=false;G.equip.armor=null;
  const тихо=stepProfile("stone");
  runState.active=true;const бег=stepProfile("stone");runState.active=false;
  G.equip.armor={name:"Кольчуга",slot:"armor"};const железо=stepProfile("stone");
  G.equip.armor={name:"Кожаный доспех",slot:"armor"};const кожа=stepProfile("stone");G.equip.armor=null;
  G.weather="Дождь";const дождь=stepProfile("stone");G.weather="Ясно";
  G.place={kind:"dungeon",stype:"dungeon",depth:2,bx:1,by:1,x:1,y:1};const глубина=stepProfile("gravel");G.place=null;
  const трава=stepProfile("tallgrass");
  runState.active=было.run;G.equip.armor=было.armor;G.weather=было.w;G.place=было.place;
  return {тихо:{gain:тихо.gain,rate:тихо.base,wear:тихо.wear,слои:тихо.layers.map(l=>l[0])},
   бег:{gain:бег.gain,rate:бег.base,run:бег.run},железо:{rate:железо.base,wear:железо.wear,слои:железо.layers.map(l=>l[0])},
   кожа:{wear:кожа.wear,слои:кожа.layers.map(l=>l[0])},дождь:{wet:дождь.wet,слои:дождь.layers.map(l=>l[0])},
   глубина:глубина.layers.map(l=>l[0]),трава:трава.layers.map(l=>l[0])};});
 check('бег быстрее и громче тихого шага',проф.бег.run&&проф.бег.rate>проф.тихо.rate*1.02&&проф.бег.gain>проф.тихо.gain,{тихо:проф.тихо,бег:проф.бег});
 check('железный доспех: шаг ниже и с лязгом железа; кожа скрипит; без доспеха шуршит ткань',
  проф.железо.wear==="metal"&&проф.железо.rate<проф.тихо.rate&&проф.железо.слои.includes("hero_step_metal")&&проф.кожа.слои.includes("hero_step_leather")&&проф.тихо.слои.includes("hero_step_cloth"),проф);
 check('дождь мочит шаг, глубина даёт эхо, высокая трава шуршит по голени',
  проф.дождь.wet&&проф.дождь.слои.includes("step_mud")&&проф.глубина.includes("hero_step_echo")&&проф.трава.includes("oc_rustle"),проф);

 /* ── 7. Шаги без повторов; топь, дождь и ступени ── */
 const шаги=await page.evaluate(async()=>{
  const r={};
  G.place=null;
  const ряд=[];for(let i=0;i<14;i++){playStep("gravel");ряд.push(G.lastStep.role+"/"+G.lastStep.file);}
  r.повторов=ряд.filter((v,i)=>i>0&&v===ряд[i-1]).length;r.ряд=ряд.slice(0,6);
  /* топь */
  const б={x:G.x,y:G.y,w:G.weather};
  let топь=null;outer:for(let y=40;y<WORLD-40&&!топь;y+=23)for(let x=40;x<WORLD-40;x+=23){
   if(cellContent(x,y).terrain[0]==="swamp"){топь={x,y};break outer;}}
  if(топь){G.weather="Ясно";const набор=new Set();for(let i=0;i<40;i++){G.x=топь.x+(i%8);G.y=топь.y+Math.floor(i/8);if(cellContent(G.x,G.y).terrain[0]==="swamp")набор.add(outdoorSurface());}r.топь=[...набор];}
  /* дождь на равнине */
  let поле=null;outer2:for(let q=1;q<400;q++)for(let dx=-q;dx<=q;dx+=Math.max(1,q))for(let dy=-q;dy<=q;dy+=Math.max(1,q)){
   const x=б.x+dx,y=б.y+dy;if(x<2||y<2||x>=WORLD-2||y>=WORLD-2)continue;
   if(cellContent(x,y).terrain[0]==="plains"&&!isRoad(x,y)&&!safeFn(()=>crossingAt(x,y),null)){поле={x,y};break outer2;}}
  if(поле){G.x=поле.x;G.y=поле.y;G.weather="Дождь";r.дождь=outdoorSurface();G.weather="Ясно";r.ясно=outdoorSurface();}
  G.x=б.x;G.y=б.y;G.weather=б.w;
  /* ступени внутри */
  outer3: for(let q=1;q<60;q++)for(let dx=-q;dx<=q;dx++)for(let dy=-q;dy<=q;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"){G.x+=dx;G.y+=dy;break outer3;}}
  G.place=null;useHere();
  if(G.place){const lvl=curLevel();let ст=null;
   const сос=[["E",-1,0],["W",1,0],["S",0,-1],["N",0,1]];
   for(let y=1;y<lvl.h-1&&!ст;y++)for(let x=1;x<lvl.w-1&&!ст;x++)if(lvl.g[y][x]===">"||lvl.g[y][x]==="<")
    for(const [d,ox,oy] of сос){if(!ст&&tileAt(lvl,x+ox,y+oy)===".")ст={x,y,d,ox,oy};}
   if(ст){G.place.x=ст.x+ст.ox;G.place.y=ст.y+ст.oy;G.lastStep=null;moveInside(ст.d);r.ступени=G.lastStep&&G.lastStep.surface;r.наСтупенях=G.place&&G.place.x===ст.x&&G.place.y===ст.y;}
   else r.ступени="нет лестницы на уровне";
   G.place=null;}
  return r;});
 check('четырнадцать шагов по гравию — без повтора варианта подряд',шаги.повторов===0,{повторов:шаги.повторов,ряд:шаги.ряд});
 check('топь — не одна грязь: болото и глубокая вода тоже встречаются',Array.isArray(шаги.топь)&&шаги.топь.includes("mud")&&(шаги.топь.includes("swamp")||шаги.топь.includes("deepwater")),шаги.топь);
 check('дождь на равнине — мокрая земля, ясно — трава',шаги.дождь==="wetdirt"&&["grass","tallgrass"].includes(шаги.ясно),{дождь:шаги.дождь,ясно:шаги.ясно});
 check('шаг на ступени слышен как ступени',шаги.ступени==="stairs",шаги);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const passed=results.filter(r=>r.startsWith('PASS')).length;
 console.log(`ИТОГО: ${passed} из ${results.length}`);
 process.exit(passed===results.length?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
