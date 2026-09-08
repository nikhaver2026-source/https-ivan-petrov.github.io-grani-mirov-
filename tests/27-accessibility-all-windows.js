const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 /* ── Живые касания: ровно те события, что шлёт палец ── */
 const tap=async(x,y,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(90);};
 const swipe=async(fx,fy,tx,ty,steps=6,stepMs=14)=>{   /* быстрый — перелистывание */
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fx+(tx-fx)*i/steps,y:fy+(ty-fy)*i/steps,id:0}]});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(140);};
 const drag=async(fx,fy,tx,ty,steps=10,stepMs=70)=>swipe(fx,fy,tx,ty,steps,stepMs); /* медленный — ощупывание */
 const fwd=()=>swipe(120,420,330,420);
 const back=()=>swipe(330,420,120,420);

 /* Слежка за активацией: что именно активировали и сколько раз. */
 const spyOn=()=>page.evaluate(()=>{
  window.__acts=[];
  if(!window.__origActivate)window.__origActivate=activateElement;
  window.activateElement=el=>{window.__acts.push(el&&(el.dataset.cmd||el.textContent.slice(0,24)));return true;};
 });
 const spyOff=()=>page.evaluate(()=>{if(window.__origActivate)window.activateElement=window.__origActivate;});
 const acts=()=>page.evaluate(()=>window.__acts.slice());
 const clearActs=()=>page.evaluate(()=>{window.__acts=[];});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clearSaid=()=>page.evaluate(()=>{window.__said=[];});
 await page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(t);};});
 /* Пустое место внутри окна: там, где нет ни кнопки, ни карточки. */
 const emptyPoint=()=>page.evaluate(()=>{
  const lay=activeLayer();if(!lay)return {x:195,y:400};
  for(let y=90;y<760;y+=8)for(const x of [6,384,195]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))return {x,y};}
  return {x:6,y:96};});

 /* ── Окна игры: как открыть и что в них должно быть ── */
 const WINDOWS=[
  ["меню действий",()=>{handleTwoFingerTap();}],
  ["карточка жителя",()=>{const n=getNPC(G.x,G.y,0,"Торговец");openNPC(n.key,true);}],
  ["постройка",()=>{const c={x:G.x,y:G.y,structure:{type:"village",name:"Деревня",beacon:"village"},
    terrain:terrainAt(G.x,G.y),empire:empireAt(G.x,G.y)};openBuilding(c);}],
  ["задания",()=>{const n=getNPC(G.x,G.y,0,"Старейшина");takeNPCQuest(n);while(activeLayer())closeTopUI();
    CMD.quests();}],
  ["сохранения",()=>CMD.saves()],
  ["настройки",()=>CMD.settings()],
  ["народы",()=>{CMD.races();raceFilterRank=0;renderRaces();}],
  ["пантеон",()=>CMD.pantheon()],
  ["бестиарий",()=>CMD.best()],
  ["инвентарь",()=>{G.inv={"руда":4};CMD.inv();}],
  ["крафт",()=>CMD.craft()],
  ["мир",()=>CMD.world()],
  ["политика",()=>CMD.politics()],
  ["рынки и караваны",()=>CMD.trade()],
  ["карта",()=>{CMD.map();}],
  ["журнал",()=>CMD.journal()],
  ["артефакты",()=>{G.artifacts=["Осколок Зари 101"];CMD.art();}],
  ["персонаж",()=>CMD.char()],
  ["событие",()=>{G.lastEventAt=0;const e=EVENTS.find(x=>x.id==="milestone");openEvent(e,eventContext());}],
  ["причал",()=>{const port=findCities(G.x,G.y,60,8).find(c=>c.type==="port");
    if(!port)return false;G.place=null;G.x=port.x;G.y=port.y;openHarbor();return true;}],
  ["обоз",()=>{const car=caravanHere&&caravanHere();
    const rt=(typeof caravanRoutes==="function")?caravanRoutes(G.x,G.y,G.day)[0]:null;
    const c=car||(rt?caravanState(rt,G.day,Math.floor(G.hour)):null);
    if(!c)return false;meetCaravan(c);return true;}],
  ["энциклопедия звуков",()=>{CMD.encyc();}],
  ["жесты",()=>CMD.gestures()],
 ];

 const report=[];
 for(const [name,open] of WINDOWS){
  await page.evaluate(()=>{while(activeLayer())closeTopUI();G.place=null;G.ship=null;G.x=1000;G.y=1000;});
  const opened=await page.evaluate(fn=>{try{const r=(new Function("return ("+fn+")"))()();return r===false?false:!!activeLayer();}catch(e){return "ошибка: "+e.message;}},open.toString());
  if(opened!==true){report.push({окно:name,открылось:opened});continue;}
  const info=await page.evaluate(()=>{
   const lay=activeLayer();
   const items=cursorItems(lay);
   /* Спрашиваем у самой игры, что она скажет об элементе: у флажков и
      ползунков собственного текста нет, подпись берётся из ярлыка. */
   const say=el=>{
    let t=(el.dataset&&el.dataset.speak)||el.getAttribute("aria-label")||(el.textContent||"").trim();
    if(!t)t=labelTextOf(el);
    const st=controlState(el);
    if(st)t=t?t+". "+st:st;
    return t;};
   const немые=items.filter(x=>!say(x)).map(x=>x.tagName+"."+(x.className||"").slice(0,20));
   return {слой:lay&&lay.id,пунктов:items.length,
    озвучено:items.length-немые.length,немые};});
  /* 1. Свайп вперёд трижды: курсор ровно на три пункта, по одному названию за свайп */
  await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
  const start=await page.evaluate(()=>cursorItems(activeLayer()).indexOf(uiCursor));
  await clearSaid();
  const n=Math.min(3,Math.max(0,info.пунктов-1-Math.max(0,start)));
  for(let i=0;i<n;i++)await fwd();
  const after=await page.evaluate(()=>cursorItems(activeLayer()).indexOf(uiCursor));
  const s=await said();
  /* 2. Двойное касание по пустому месту активирует ИМЕННО текущий пункт, один раз */
  const target=await page.evaluate(()=>uiCursor&&(uiCursor.dataset.cmd||uiCursor.textContent.slice(0,24)));
  await spyOn();await clearActs();
  const ep=await emptyPoint();
  await tap(ep.x,ep.y);await tap(ep.x,ep.y);
  const a=await acts();
  /* 3. Свайп между касаниями отменяет активацию */
  await clearActs();
  await tap(ep.x,ep.y);await fwd();await tap(ep.x,ep.y);
  const a2=await acts();
  /* 4. Медленное ощупывание ничего не активирует */
  await clearActs();
  await drag(60,300,330,470);
  const a3=await acts();
  await spyOff();
  report.push({окно:name,слой:info.слой,пунктов:info.пунктов,озвучено:info.озвучено,немые:info.немые,
   свайпов:n,сдвиг:after-Math.max(0,start),названий:s.length,
   активировано:a,ожидали:target,отменено:a2.length,приОщупывании:a3.length});
  await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 }

 const ok=report.filter(r=>r.открылось===undefined);
 const notOpened=report.filter(r=>r.открылось!==undefined);
 check('все окна игры открываются',notOpened.length===0,notOpened);
 check('в каждом окне есть что выбирать, и каждый пункт называет себя',
  ok.every(r=>r.пунктов>0&&r.озвучено===r.пунктов),
  ok.filter(r=>!(r.пунктов>0&&r.озвучено===r.пунктов)).map(r=>({окно:r.окно,пунктов:r.пунктов,немые:r.немые})));
 check('свайп двигает выбор ровно на один пункт в каждом окне',
  ok.every(r=>r.сдвиг===r.свайпов),
  ok.filter(r=>r.сдвиг!==r.свайпов).map(r=>({окно:r.окно,свайпов:r.свайпов,сдвиг:r.сдвиг})));
 check('свайп называет ровно один пункт, а не всё по дороге',
  ok.every(r=>r.названий===r.свайпов),
  ok.filter(r=>r.названий!==r.свайпов).map(r=>({окно:r.окно,свайпов:r.свайпов,названий:r.названий})));
 check('двойное касание активирует именно текущий пункт и ровно один раз',
  ok.every(r=>r.активировано.length===1&&r.активировано[0]===r.ожидали),
  ok.filter(r=>!(r.активировано.length===1&&r.активировано[0]===r.ожидали))
    .map(r=>({окно:r.окно,ожидали:r.ожидали,активировано:r.активировано})));
 check('свайп между двумя касаниями отменяет активацию',
  ok.every(r=>r.отменено===0),ok.filter(r=>r.отменено!==0).map(r=>r.окно));
 check('медленное ощупывание не активирует ничего',
  ok.every(r=>r.приОщупывании===0),ok.filter(r=>r.приОщупывании!==0).map(r=>r.окно));

 /* ══ Именно то, ради чего всё это: дойти свайпом до нужного пункта
       и подтвердить его двойным касанием одним пальцем. ══ */

 // 1. Весь список проходится свайпами до конца, каждый пункт называется,
 //    и на последнем свайп не уводит в никуда.
 await page.evaluate(()=>{while(activeLayer())closeTopUI();CMD.pantheon();resetCursor();ensureCursor(activeLayer());});
 const total=await page.evaluate(()=>cursorItems(activeLayer()).length);
 await clearSaid();
 const visited=[];
 for(let i=0;i<total+3;i++){
  await fwd();
  visited.push(await page.evaluate(()=>cursorItems(activeLayer()).indexOf(uiCursor)));}
 const saidAll=await said();
 const lastIdx=visited[visited.length-1];
 const прошли=new Set(visited).size;
 check('свайпом можно дойти до любого пункта длинного списка',
  прошли>=Math.min(total-1,10)&&lastIdx===total-1,
  {пунктов:total,пройдено:прошли,последний:lastIdx});
 check('на конце списка свайп не срывается и не молчит',
  saidAll.length===total+3-1||saidAll.length>=total-1,{свайпов:total+3,названий:saidAll.length});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 // 2. Диалог с жителем: дойти свайпом до «Взять квест» и подтвердить
 const dialog=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.quests=[];G.chainTaken={};G.x=1000;G.y=1000;G.place=null;
  const n=getNPC(G.x,G.y,0,"Старейшина");
  openNPC(n.key,true);resetCursor();ensureCursor(activeLayer());
  const items=cursorItems(activeLayer());
  return {ключ:n.key,цель:items.findIndex(x=>x.dataset.cmd&&x.dataset.cmd.startsWith("qtake:")),
   всего:items.length,квестов:G.quests.length};});
 for(let i=0;i<dialog.цель;i++)await fwd();
 const onQuest=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 let ep=await emptyPoint();
 await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(200);
 const questTaken=await page.evaluate(()=>({квестов:G.quests.length,окно:activeLayer()&&activeLayer().id}));
 check('в диалоге свайп доводит до «Взять квест», двойное касание берёт его',
  /^qtake:/.test(onQuest||"")&&questTaken.квестов===1,
  {курсор:onQuest,квестов:questTaken.квестов});

 // 3. Торговля: дойти свайпом до кнопки покупки нужного товара и купить именно его
 const trade=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.gold=5000;G.inv={};G.place=null;
  const n=getNPC(G.x,G.y,0,"Торговец");
  openNPC(n.key,true);resetCursor();ensureCursor(activeLayer());
  const items=cursorItems(activeLayer());
  /* берём вторую кнопку покупки: до неё нужно именно доходить */
  const buys=items.map((x,i)=>({i,cmd:x.dataset.cmd})).filter(o=>/^buy:/.test(o.cmd||""));
  const цель=buys[1]||buys[0];
  return {индекс:цель?цель.i:-1,cmd:цель?цель.cmd:null,
   товар:цель?stockFor(n)[Number(цель.cmd.split(":")[2])]:null,золото:G.gold};});
 for(let i=0;i<trade.индекс;i++)await fwd();
 const onBuy=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 ep=await emptyPoint();
 await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(250);
 const bought=await page.evaluate(()=>({золото:G.gold,запас:{...G.inv},вещей:G.gear.length}));
 check('в торговле свайп доводит до нужного товара, двойное касание покупает именно его',
  onBuy===trade.cmd&&bought.золото<trade.золото,
  {курсор:onBuy,ждали:trade.cmd,былоЗолота:trade.золото,стало:bought.золото});

 // 4. Двойное касание ПО САМОЙ кнопке (а не по пустому месту) тоже работает
 const direct=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();resetCursor();ensureCursor(activeLayer());
  const b=[...activeLayer().querySelectorAll('[data-cmd^="setdiff:"]')].find(x=>x.dataset.cmd==="setdiff:harsh");
  if(!b)return null;
  b.scrollIntoView({block:"center"});
  const r=b.getBoundingClientRect();
  settings.difficulty="normal";
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),cmd:b.dataset.cmd};});
 if(direct){
  await tap(direct.x,direct.y);await tap(direct.x,direct.y);
  await page.waitForTimeout(200);}
 const diffNow=await page.evaluate(()=>settings.difficulty);
 check('двойное касание прямо по кнопке тоже срабатывает',diffNow==="harsh",{стало:diffNow});
 await page.evaluate(()=>{setDifficulty("normal");while(activeLayer())closeTopUI();});

 // 5. Одиночное касание по кнопке ничего не выполняет — только называет
 const single=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();resetCursor();ensureCursor(activeLayer());
  settings.difficulty="normal";
  const b=[...activeLayer().querySelectorAll('[data-cmd="setdiff:harsh"]')][0];
  b.scrollIntoView({block:"center"});
  const r=b.getBoundingClientRect();
  window.__said=[];
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
 await tap(single.x,single.y);
 await page.waitForTimeout(300);
 const afterSingle=await page.evaluate(()=>({сложность:settings.difficulty,сказано:window.__said.length,
  курсор:uiCursor&&uiCursor.dataset.cmd}));
 check('одно касание только называет пункт и делает его текущим, но не выполняет',
  afterSingle.сложность==="normal"&&afterSingle.сказано>=1&&afterSingle.курсор==="setdiff:harsh",afterSingle);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 // 6. Долгая пауза между касаниями — это два одиночных касания, а не двойное
 const slow=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();resetCursor();
  settings.difficulty="normal";
  const b=[...activeLayer().querySelectorAll('[data-cmd="setdiff:calm"]')][0];
  b.scrollIntoView({block:"center"});
  const r=b.getBoundingClientRect();
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
 await tap(slow.x,slow.y);
 await page.waitForTimeout(1100);
 await tap(slow.x,slow.y);
 await page.waitForTimeout(200);
 const afterSlow=await page.evaluate(()=>settings.difficulty);
 check('два касания с большой паузой не считаются двойным',afterSlow==="normal",{стало:afterSlow});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 console.log(results.join('\n'));
 console.log('Окон проверено: '+ok.length);
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
