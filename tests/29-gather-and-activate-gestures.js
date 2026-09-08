/* ════════════════════════════════════════════════════════════════════════
   СБОР ДВУМЯ ПАЛЬЦАМИ И ПОДТВЕРЖДЕНИЕ ДВОЙНЫМ КАСАНИЕМ

   Раньше ресурс собирался одним касанием одного пальца — тем самым жестом,
   которым игра называет пункты. Игрок, приученный подтверждать выбор двумя
   касаниями, на игровом поле собирал ресурс дважды и слышал два ответа
   подряд. Теперь правило одно для всего:

     одно касание одним пальцем   — назвать (пункт окна или клетку под ногами);
     двойное касание одним пальцем — выполнить названное;
     одно касание двумя пальцами   — собрать ресурс (а если открыто окно — закрыть его);
     свайп тремя пальцами вверх    — меню действий;
     свайп тремя пальцами вниз     — сводка «где я».

   Набор ведёт живые касания через CDP и проверяет, что жесты не спорят.
   ════════════════════════════════════════════════════════════════════════ */
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
 await page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(t);};});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clr=()=>page.evaluate(()=>{window.__said=[];});

 const pts=(n,x,y)=>Array.from({length:n},(_,i)=>({x:x+i*42,y,id:i}));
 /* Пальцы ставят и снимают вразнобой — живая рука иначе не умеет. */
 const multiTap=async(n,x=120,y=430)=>{
  const p=[];
  for(let i=0;i<n;i++){p.push({x:x+i*42,y});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:p.map((q,k)=>({x:q.x,y:q.y,id:k}))});
   await page.waitForTimeout(35);}
  await page.waitForTimeout(80);
  for(let k=n-1;k>=0;k--){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:p[k].x,y:p[k].y,id:k}]});
   await page.waitForTimeout(20);
   const rest=p.slice(0,k).map((q,i)=>({x:q.x+2,y:q.y+1,id:i}));
   if(rest.length){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:rest});await page.waitForTimeout(20);}}
  await page.waitForTimeout(200);};
 const multiSwipe=async(n,dx,dy,steps=6,stepMs=16)=>{
  const x=110,y=430;
  const at=k=>Array.from({length:n},(_,i)=>({x:x+i*42+Math.round(dx*k/steps),y:y+Math.round(dy*k/steps),id:i}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:at(0)});
  await page.waitForTimeout(stepMs);
  for(let k=1;k<=steps;k++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:at(k)});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);};
 const tap=async(x=195,y=520,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(100);};
 /* Встать на клетку с нетронутым ресурсом. */
 const standOnResource=()=>page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.loot=null;G.weaponDrawn=false;
  for(let r=0;r<6000;r++){const x=1000+(r%80),y=1000+Math.floor(r/80);
   const c=cellContent(x,y);
   if(c.res&&!c.structure&&!c.monster){
    G.x=x;G.y=y;G.inv={};G.depleted={};
    return {x,y,ресурс:c.res.name,запас:c.res.qty};}}
  return null;});

 // ── 1. Одно касание одним пальцем ничего не собирает, только называет ──
 const spot=await standOnResource();
 check('нашлась клетка с ресурсом для проверок',!!spot,spot);
 await clr();
 await tap();
 const one=await page.evaluate(()=>({запас:{...G.inv},сказано:window.__said.slice()}));
 check('одно касание одним пальцем не собирает ресурс, а называет клетку',
  Object.keys(one.запас).length===0&&one.сказано.length===1&&new RegExp(spot.ресурс).test(one.сказано[0]),
  {запас:one.запас,сказано:one.сказано});

 // ── 2. Одно касание двумя пальцами собирает ровно одну единицу ──
 await clr();
 await multiTap(2);
 const two=await page.evaluate(()=>({запас:{...G.inv},сказано:window.__said.slice()}));
 check('одно касание двумя пальцами собирает ресурс',
  (two.запас[spot.ресурс]||0)>=1&&/Собрано/.test(two.сказано.join(' ')),two);
 check('сбор отвечает ровно один раз, а не дважды',
  two.сказано.filter(t=>/Собрано/.test(t)).length===1,two.сказано);

 // ── 3. Двойное касание одним пальцем не собирает второй раз само по себе ──
 await standOnResource();
 await clr();
 await tap();await tap();
 await page.waitForTimeout(300);
 const dbl=await page.evaluate(()=>({запас:{...G.inv},сказано:window.__said.slice()}));
 check('двойное касание одним пальцем выполняет действие здесь ровно один раз',
  (dbl.запас[spot.ресурс]||0)===1&&dbl.сказано.filter(t=>/Собрано/.test(t)).length===1
  &&/^Здесь/.test(dbl.сказано[0]||"")&&/Собрано/.test(dbl.сказано[1]||""),dbl);

 // ── 3б. Многопальцевый жест отменяет начатое двойное касание ──
 await standOnResource();
 await tap();                 /* первое касание: только называет */
 await multiTap(2);           /* сбор двумя пальцами — двойное касание отменено */
 await page.evaluate(()=>{window.__said=[];});
 const beforeStray=await page.evaluate(()=>({...G.inv}));
 await tap();                 /* это снова ПЕРВОЕ касание, а не подтверждение */
 const stray=await page.evaluate(()=>({запас:{...G.inv},сказано:window.__said.slice()}));
 check('касание двумя пальцами между двумя касаниями отменяет двойное касание',
  JSON.stringify(stray.запас)===JSON.stringify(beforeStray)&&/^Здесь/.test(stray.сказано[0]||""),
  {было:beforeStray,стало:stray.запас,сказано:stray.сказано});

 // ── 4. На пустой клетке сбор честно говорит, что брать нечего ──
 await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.inv={};
  for(let r=0;r<6000;r++){const x=1200+(r%80),y=1200+Math.floor(r/80);
   const c=cellContent(x,y);
   if(!c.res&&!c.structure&&!c.monster){G.x=x;G.y=y;return;}}});
 await clr();
 await multiTap(2);
 const empty=await page.evaluate(()=>({запас:{...G.inv},сказано:window.__said.slice()}));
 check('на пустой клетке сбор двумя пальцами объясняет, что брать нечего',
  Object.keys(empty.запас).length===0&&/ресурсов нет/i.test(empty.сказано.join(' ')),empty);

 // ── 5. Свайп тремя пальцами вверх открывает меню действий ──
 await multiSwipe(3,0,-170);
 const menu=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id,
  пунктов:activeLayer()?cursorItems(activeLayer()).length:0}));
 check('свайп тремя пальцами вверх открывает меню действий',
  menu.окно==='actionMenu'&&menu.пунктов>5,menu);

 // ── 6. Касание двумя пальцами закрывает открытое окно, а не собирает ──
 await page.evaluate(()=>{G.inv={};});
 await multiTap(2);
 const closed=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id,запас:{...G.inv}}));
 check('касание двумя пальцами закрывает открытое окно и ничего при этом не собирает',
  !closed.окно&&Object.keys(closed.запас).length===0,closed);

 // ── 7. Свайп тремя пальцами вниз по-прежнему даёт сводку «где я» ──
 await clr();
 await multiSwipe(3,0,170);
 const status=await said();
 check('свайп тремя пальцами вниз даёт сводку «где я»',
  status.length>=1&&/Вы здесь/.test(status.join(' ')),status.slice(0,1).map(t=>t.slice(0,50)));

 // ── 8. Внутри окна двойное касание по-прежнему подтверждает выбор ──
 const inWindow=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();resetCursor();ensureCursor(activeLayer());
  settings.difficulty="normal";
  const items=cursorItems(activeLayer());
  return {цель:items.findIndex(x=>x.dataset.cmd==="setdiff:harsh"),всего:items.length};});
 const fwd=()=>multiSwipeOne(120,430,330,430);
 async function multiSwipeOne(fx,fy,tx,ty,steps=6,stepMs=14){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  await page.waitForTimeout(stepMs);
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(fx+(tx-fx)*i/steps),y:fy,id:0}]});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(140);}
 for(let i=0;i<inWindow.цель;i++)await fwd();
 const onTarget=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 const ep=await page.evaluate(()=>{
  const lay=activeLayer();
  for(let y=90;y<760;y+=8)for(const x of [6,384,195]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))return {x,y};}
  return {x:6,y:96};});
 await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(250);
 const picked=await page.evaluate(()=>settings.difficulty);
 check('в окне свайп доводит до пункта, а двойное касание подтверждает выбор',
  onTarget==="setdiff:harsh"&&picked==="harsh",{курсор:onTarget,сложность:picked});
 await page.evaluate(()=>{setDifficulty("normal");while(activeLayer())closeTopUI();});

 // ── 9. Сбор не срабатывает в бою: там два пальца ничего не ломают ──
 const fight=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.inv={};G.hp=G.hpMax;
  const c={x:G.x,y:G.y,monster:{n:"Волк",lvl:2,hp:30,dmg:4,xp:10,gold:5}};
  startCombat(c);
  return {бой:G.inCombat};});
 await multiTap(2);
 const inFight=await page.evaluate(()=>({бой:G.inCombat,запас:{...G.inv},окно:activeLayer()&&activeLayer().id}));
 check('в бою касание двумя пальцами не собирает и не ломает бой',
  fight.бой===true&&inFight.бой===true&&Object.keys(inFight.запас).length===0&&!inFight.окно,inFight);
 await page.evaluate(()=>{endCombat();});

 // ── 10. Внутри постройки жест сбора собирает, а не уводит по лестнице ──
 const inside=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.inCombat=false;G.combat=null;G.inv={};
  /* Встаём в постройку и переносим игрока прямо на лестницу вниз. */
  for(let r=0;r<8000;r++){const x=1000+(r%90),y=1000+Math.floor(r/90);
   const c=cellContent(x,y);
   if(c.structure&&PLACE_KIND[c.structure.type]){
    G.x=x;G.y=y;enterPlace(c);
    const lvl=curLevel();if(!lvl)return null;
    for(let ty=0;ty<lvl.h;ty++)for(let tx=0;tx<lvl.w;tx++)
     if(tileAt(lvl,tx,ty)===">"){G.place.x=tx;G.place.y=ty;
      return {место:placeTitle(),глубина:G.place.depth,клетка:">"};}
    return {место:placeTitle(),глубина:G.place.depth,клетка:null};}}
  return null;});
 if(inside&&inside.клетка===">"){
  await multiTap(2);
  const after=await page.evaluate(()=>({глубина:G.place&&G.place.depth,внутри:!!G.place}));
  check('внутри постройки сбор двумя пальцами не спускает по лестнице',
   after.внутри===true&&after.глубина===inside.глубина,{было:inside.глубина,стало:after.глубина});
  /* И меню не предлагает пункт сбора там, где собирать нечего. */
  const menuOnStairs=await page.evaluate(()=>{
   while(activeLayer())closeTopUI();openActionMenu();
   const items=[...document.querySelectorAll('#amList button')].map(b=>b.dataset.cmd);
   closeActionMenu();
   return {сбор:items.includes("am:gather"),спуск:items.includes("am:descend")};});
  check('на лестнице меню не предлагает сбор, но предлагает спуск',
   menuOnStairs.сбор===false&&menuOnStairs.спуск===true,menuOnStairs);
  await page.evaluate(()=>{while(activeLayer())closeTopUI();leavePlace();});
 } else check('внутри постройки сбор двумя пальцами не спускает по лестнице',
   false,{постройка:inside});

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
