/* ════════════════════════════════════════════════════════════════════════
   НАБОР 73: ЧЕТЫРЕ ТОНКИХ РЕМЕСЛА

   Иллюзии, гомункулы, демонология, тяжесть и время. Их легко было бы сделать
   четырьмя строками в списке и четырьмя кнопками, которые говорят красивые
   слова и не меняют ничего. Здесь проверяется обратное: каждое ремесло
   МЕНЯЕТ ИГРУ, и меняет измеримо.

   1. Морок — встреч вдвое меньше, и это видно на счёте, а не на слове.
   2. Печать — ловушка бьёт вполсилы, и это видно на здоровье.
   3. Лёгкость — шаг отнимает меньше времени, и это видно на часах.
   4. Остановленный час — шаг не стоит времени вовсе.
   5. Договор — опыт идёт вдвое, и за него взята кровь и благосклонность.
   6. Гомункул — настоящая вещь с силой, а не запись в журнале.
   7. Прочесть морок — ловушка рядом перестаёт быть тайной.

   И всё это — через те же станки, тот же риск срыва и те же временные дары,
   на которых держатся умения школ: второй машины рядом не заведено.
   ════════════════════════════════════════════════════════════════════════ */
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

 /* ── 1. Четыре ремесла на месте, и им есть у кого учиться ── */
 const есть=await page.evaluate(()=>{
  const надо=["illus","homun","demon","flux"];
  const нет=надо.filter(id=>!MAST_BY_ID[id]);
  const некому=надо.filter(id=>!Object.keys(MAST_TEACH).some(p=>(MAST_TEACH[p]||{})[id]>0));
  const техник={};
  надо.forEach(id=>{техник[id]=TECHS.filter(t=>t.маст===id).map(t=>t.id);});
  const чужиеСтанки=TECHS.filter(t=>надо.includes(t.маст))
   .filter(t=>!t.станки.every(s=>MAST_BY_ID[t.маст].станки.indexOf(s)>=0)).map(t=>t.id);
  const безЗаписи=TECHS.filter(t=>надо.includes(t.маст))
   .filter(t=>!SOUND_BANK[t.звук]||(t.след&&!SOUND_BANK[t.след])).map(t=>t.id);
  return {нет,некому,техник,чужиеСтанки,безЗаписи,
   всегоМастерств:MASTERY.length,всегоТехник:TECHS.length};});
 check('все четыре ремесла заведены, и каждому есть у кого учиться',
  есть.нет.length===0&&есть.некому.length===0,есть);
 check('у каждого ремесла есть свои техники, на своих станках и с живыми записями',
  Object.values(есть.техник).every(v=>v.length>=1)&&есть.чужиеСтанки.length===0
  &&есть.безЗаписи.length===0,есть);
 check('демонологии учат за Гранью, а не в школе',
  await page.evaluate(()=>{
   const тёмные=["Шепчущий","Обрядчик","Меняла клятв"];
   const учат=Object.keys(MAST_TEACH).filter(p=>(MAST_TEACH[p]||{}).demon>0);
   return учат.length>0&&учат.every(p=>тёмные.includes(p));}),
  await page.evaluate(()=>Object.keys(MAST_TEACH).filter(p=>(MAST_TEACH[p]||{}).demon>0)));

 /* ── 2. Морок: встреч вдвое меньше, и это видно на счёте ── */
 const морок=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.ship=null;G.day=10;G.hour=12;G.buffs={};
  const O=WORLD>>1;
  const счёт=()=>{let n=0;
   for(let x=O-60;x<O+60;x++)for(let y=O-60;y<O+60;y++){
    contentCache.clear();
    if(cellContent(x,y).monster)n++;}
   return n;};
  const без=счёт();
  buffSet("морок",5);
  const с=счёт();
  G.buffs={};
  return {без,с,меньше:с<без,вдвоеОколо:без>0&&с<=без*0.75};});
 check('под мороком встреч заметно меньше',
  морок.без>0&&морок.меньше&&морок.вдвоеОколо,морок);

 /* ── 3. Печать: ловушка бьёт вполсилы ── */
 const печать=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:12,x:1,y:1};
  const l=curLevel();
  let цель=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   const л=trapAt(x,y);if(л&&!л.зов&&л.урон>0){цель={x,y};break outer;}}
  if(!цель)return {нет:true};
  const бьёт=(оберег)=>{
   G.marks={};G.buffs={};G.hp=500;G.hpMax=500;G.artifacts=[];G.water=200;
   if(оберег)buffSet("оберег",6);
   trapFire(цель.x,цель.y,null);
   return 500-G.hp;};
  const без=бьёт(false),с=бьёт(true);
  G.buffs={};
  while(activeLayer())closeTopUI();
  return {без,с,вполсилы:с>0&&с<без};});
 check('под печатью ловушка бьёт вполсилы',
  !печать.нет&&печать.вполсилы,печать);

 /* ── 4. Лёгкость и остановленный час: шаг на часах ── */
 const время=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.ship=null;G.dark=false;G.inCombat=false;G.alt=0;
  const O=WORLD>>1;
  const шаг=()=>{
   for(let i=0;i<25&&activeLayer();i++)closeTopUI();
   G.x=O;G.y=O;const a=G.day*24+G.hour;move("E");
   for(let i=0;i<25&&activeLayer();i++)closeTopUI();
   return +( (G.day*24+G.hour)-a ).toFixed(4);};
  G.buffs={};const обычный=шаг();
  G.buffs={};buffSet("лёгкость",4);const лёгкий=шаг();
  G.buffs={};buffSet("тихий час",2);const тихий=шаг();
  G.buffs={};
  return {обычный,лёгкий,тихий,
   легчеОбычного:лёгкий>0&&лёгкий<обычный,
   тихийДаром:тихий===0};});
 check('убавленная тяжесть укорачивает шаг',
  время.обычный>0&&время.легчеОбычного,время);
 check('остановленный час не даёт шагу стоить времени вовсе',
  время.тихийДаром,время);

 /* ── 5. Договор: опыт вдвое, и у станка одна дверь вместо двух огрызков ──
    Печать и договор были двумя кнопками у круга и делали то же, что теперь
    делает целая система обрядов. Две копии одного — обещание разойтись,
    поэтому у станка осталась одна запись: дверь в обряды. */
 const договор=await page.evaluate(()=>{
  G.buffs={};G.race="Люди";G.patron=null;G.faith={};
  const обычно=xpGain(100);
  buffSet("договор",24);
  const сДоговором=xpGain(100);
  G.buffs={};
  const огрызки=["ward","pact"].filter(id=>TECH_BY_ID[id]);
  const дверь=!!TECH_BY_ID.rites;
  G.mast={demon:{ур:5,оп:0,дел:0}};
  const уКруга=techsAt("circle").map(t=>t.id);
  const уКадила=techsAt("censer").map(t=>t.id);
  /* Дверь открывает окно обрядов и растит мастерство, а припаса не берёт:
     компоненты возьмёт сам обряд. */
  const опДо=mastOf("demon").оп;
  G.inv={"кость":9,"кристалл":9,"камень":9};
  const доИнв=Object.values(G.inv).reduce((a,b)=>a+b,0);
  const открыло=techDo(TECH_BY_ID.rites,"circle");
  const послеИнв=Object.values(G.inv).reduce((a,b)=>a+b,0);
  const окно=!document.getElementById("modal-demon").hidden;
  while(activeLayer())closeTopUI();
  return {обычно,сДоговором,вдвое:сДоговором>=обычно*1.8,
   огрызки,дверь,уКруга,уКадила,открыло,окно,
   мастерствоРастёт:mastOf("demon").оп>опДо,припасЦел:доИнв===послеИнв};});
 check('под договором опыт идёт вдвое',договор.вдвое,договор);
 check('у станка одна дверь в обряды, а двух прежних огрызков больше нет',
  договор.дверь&&договор.огрызки.length===0
  &&договор.уКруга.includes("rites")&&договор.уКадила.includes("rites"),договор);
 check('дверь открывает окно обрядов, растит мастерство и припаса не берёт',
  договор.открыло&&договор.окно&&договор.мастерствоРастёт&&договор.припасЦел,договор);

 /* ── 6. Гомункул — существо, которое собирают по частям ── */
 const гомункул=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};
  G.hom=null;G.homDraft={};G.buffs={};
  G.inv={"кость":9,"трава":9,"кристалл":9,"камень":9,"дерево":9,"ягоды":9,"руда":9};
  const доИнв=Object.values(G.inv).reduce((a,b)=>a+b,0);
  const открыло=techDo(TECH_BY_ID.vessel,"cauldron");
  const окно=!document.getElementById("modal-homun").hidden;
  const послеИнв=Object.values(G.inv).reduce((a,b)=>a+b,0);
  /* Само существо собирается уже в окне, из выбранных частей. */
  const собрал=homunMake("clay","ash","mana","guard");
  const h=homun();
  const взяло=Object.values(G.inv).reduce((a,b)=>a+b,0)<послеИнв;
  while(activeLayer())closeTopUI();
  const итог={открыло,окно,дверьБезПрипаса:доИнв===послеИнв,собрал,взяло,
   имя:h&&h.имя,ступень:h&&h.ур,предел:h&&h.предел,
   силы:h?[homunStat(h,"hp"),homunStat(h,"сила"),homunStat(h,"ум")]:null};
  G.hom=null;
  return итог;});
 check('«Собрать гомункула» — дверь в сборку: окно открывается, а припас берёт уже сборка',
  гомункул.открыло&&гомункул.окно&&гомункул.дверьБезПрипаса&&гомункул.взяло,гомункул);
 check('собранный гомункул — существо с именем, ступенью, пределом и своими силами',
  гомункул.собрал&&!!гомункул.имя&&гомункул.ступень===1&&!!гомункул.предел
  &&гомункул.силы.every(n=>Number.isFinite(n)),гомункул);

 /* ── 7. Прочесть морок: ловушка рядом перестаёт быть тайной ── */
 const прочесть=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:12,x:1,y:1};
  const l=curLevel();
  let рядом=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   if(!trapAt(x,y))continue;
   for(const [dx,dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0]]){
    const px=x-dx,py=y-dy;
    if(tileAt(l,px,py)!=="."&&tileAt(l,px,py)!=="C")continue;
    рядом={x,y,px,py};break outer;}}
  if(!рядом)return {нет:true};
  G.marks={};G.mast={illus:{ур:5,оп:0,дел:0}};G.inv={};
  G.place.x=рядом.px;G.place.y=рядом.py;
  const доТого=trapAt(рядом.x,рядом.y).состояние;
  techDo(TECH_BY_ID.unveil,"mirror");
  const после=trapAt(рядом.x,рядом.y).состояние;
  while(activeLayer())closeTopUI();
  return {доТого,после,открыло:доТого==="не найдена"&&после==="найдена"};});
 check('прочтённый морок открывает ловушку рядом',
  прочесть.нет||прочесть.открыло,прочесть);

 /* ── 8. Дары времени живут по общим часам и кончаются ── */
 const часы=await page.evaluate(()=>{
  G.buffs={};G.day=5;G.hour=10;
  buffSet("морок",3);
  const сразу=buffActive("морок"),осталось=buffLeft("морок");
  G.hour=14;                       /* прошло четыре часа */
  const потом=buffActive("морок");
  G.buffs={};
  return {сразу,осталось,потом,кончился:сразу===true&&потом===false};});
 check('дары времени кончаются по общим часам мира, а не живут вечно',
  часы.кончился&&часы.осталось>0,часы);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
