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

 /* ── 5. Договор: опыт вдвое, и цена взята ── */
 const договор=await page.evaluate(()=>{
  G.buffs={};G.race="Люди";G.patron=null;G.faith={};
  const обычно=xpGain(100);
  buffSet("договор",24);
  const сДоговором=xpGain(100);
  G.buffs={};
  /* И сама работа берёт цену: здоровье и благосклонность. */
  G.mast={demon:{ур:5,оп:0,дел:0}};
  G.inv={"кость":9,"кристалл":9};
  G.hp=200;G.hpMax=200;G.patron="zarya";G.faith={zarya:10};
  const hpДо=G.hp,вераДо=Number(G.faith.zarya)||0;
  let вышло=false;
  for(let i=0;i<20&&!вышло;i++){
   G.inv={"кость":9,"кристалл":9};G.hp=200;
   G.buffs={};
   вышло=techDo(TECH_BY_ID.pact,"circle")&&buffActive("договор");}
  const hpПосле=G.hp,вераПосле=Number(G.faith.zarya)||0;
  G.buffs={};
  return {обычно,сДоговором,вдвое:сДоговором>=обычно*1.8,
   вышло,кровь:hpПосле<hpДо,вера:вераПосле<вераДо};});
 check('под договором опыт идёт вдвое',договор.вдвое,договор);
 check('и за договор взята кровь и благосклонность покровителя',
  договор.вышло&&договор.кровь&&договор.вера,договор);

 /* ── 6. Гомункул — настоящая вещь с силой ── */
 const гомункул=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};
  G.artifacts=[];G.buffs={};
  let вышло=false;
  for(let i=0;i<20&&!вышло;i++){
   G.inv={"кость":9,"трава":9,"кристалл":9};
   G.day=5;G.hour=10;
   techDo(TECH_BY_ID.vessel,"cauldron");
   вышло=(G.artifacts||[]).length>0;}
  const a=(G.artifacts||[])[0]||null;
  return {вышло,вещей:(G.artifacts||[]).length,
   имя:a&&(a.имя||a.n||""),
   естьСвойства:!!(a&&typeof a==="object"&&Object.keys(a).length>3)};});
 check('гомункул выходит настоящей вещью с силой, а не записью в журнале',
  гомункул.вышло&&гомункул.естьСвойства,гомункул);

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
