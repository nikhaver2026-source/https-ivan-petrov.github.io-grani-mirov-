/* ════════════════════════════════════════════════════════════════════════
   ДОСТУПНОСТЬ ОСОБЫХ ОКОН: МАГИЯ, РУКОВОДСТВО, ДОБЫЧА И БОЙ

   Набор 27 проверяет обычные окна игры. Здесь — четыре слоя, которые живут
   по своим правилам и потому чаще всего ломаются:

     панель магии   — слоты заклинаний, у каждого своя цена в мане;
     руководство    — два раздела в одном окне: оглавление и открытая глава;
     добыча         — окно без единой кнопки, собирается касанием;
     бой            — окна нет вовсе, а меню действий вызывается прямо в бою.

   Правило игры одно на всех: палец ощупывает и называет, свайп переводит
   выбор ровно на один пункт, двойное касание одним пальцем подтверждает.
   Ни ощупывание, ни удержание пальца не должны ничего выполнять сами.
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

 const tap=async(x,y,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(90);};
 const hold=async(x,y,ms=1000)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(150);};
 const swipe=async(fx,fy,tx,ty,steps=6,stepMs=14)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  await page.waitForTimeout(stepMs);
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fx+(tx-fx)*i/steps,y:fy+(ty-fy)*i/steps,id:0}]});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(140);};
 const fwd=()=>swipe(120,420,330,420);
 const drag=(fx,fy,tx,ty)=>swipe(fx,fy,tx,ty,12,70);  /* медленно — это ощупывание */
 const emptyPoint=()=>page.evaluate(()=>{
  const lay=activeLayer();if(!lay)return {x:195,y:400};
  for(let y=90;y<760;y+=8)for(const x of [6,384,195]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))return {x,y};}
  return {x:6,y:96};});
 const doubleTap=async()=>{const ep=await emptyPoint();await tap(ep.x,ep.y);await tap(ep.x,ep.y);await page.waitForTimeout(280);};
 const clear=()=>page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  try{closeMagicPanel();}catch(_){}
  try{closeGuide();}catch(_){}
  const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;
  G.loot=null;G.inCombat=false;G.combat=null;G.weaponDrawn=false;G.ship=null;G.place=null;
  resetCursor();});
 await page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(t);};});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clearSaid=()=>page.evaluate(()=>{window.__said=[];});

 /* ── 1. Ни в одном окне свайп не встречает невидимых пунктов ── */
 const WINDOWS=[
  ["меню действий",()=>{handleTwoFingerTap();}],
  ["карточка жителя",()=>{const n=getNPC(G.x,G.y,0,"Торговец");openNPC(n.key,true);}],
  ["настройки",()=>CMD.settings()],
  ["сохранения",()=>CMD.saves()],
  ["инвентарь",()=>{G.inv={"руда":4};CMD.inv();}],
  ["панель магии",()=>{G.spells=["Искра"];safeOpenMagicPanel();}],
  ["руководство: оглавление",()=>{openGuide();}],
  ["руководство: глава",()=>{openGuide();showChapter(2);}],
 ];
 const ghosts=[];
 for(const [name,open] of WINDOWS){
  await clear();
  const r=await page.evaluate(fn=>{
   try{(new Function("return ("+fn+")"))()();}catch(e){return {окно:null,ошибка:e.message};}
   const lay=activeLayer();if(!lay)return {ошибка:"не открылось"};
   const items=cursorItems(lay);
   const невидимые=items.filter(x=>!x.getClientRects().length||x.closest('[hidden]'))
    .map(x=>(x.textContent||x.id||x.tagName).trim().slice(0,20));
   return {пунктов:items.length,невидимые};},open.toString());
  ghosts.push({окно:name,...r});
 }
 check('свайп нигде не проходит через невидимые пункты',
  ghosts.every(g=>!g.ошибка&&g.пунктов>0&&!g.невидимые.length),
  ghosts.filter(g=>g.ошибка||!g.пунктов||g.невидимые.length));

 /* ── 2. Панель магии: палец, лежащий на слоте, ничего не колдует ── */
 await clear();
 const slot=await page.evaluate(()=>{
  G.spells=["Искра"];G.mana=G.manaMax=10;safeOpenMagicPanel();resetCursor();
  const b=document.querySelector('#magicSlots [data-magic-index="0"]');
  b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();
  window.__said=[];
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),мана:G.mana};});
 await hold(slot.x,slot.y,1000);
 const held=await page.evaluate(()=>({мана:G.mana,окно:activeLayer()&&activeLayer().id,
  курсор:uiCursor&&uiCursor.dataset.magicIndex,сказано:window.__said.length}));
 check('палец, задержавшийся на слоте магии, называет его, но не колдует',
  held.мана===slot.мана&&held.окно==='magicPanel'&&held.курсор==='0'&&held.сказано>=1,
  {было:slot.мана,...held});

 /* ── 3. Панель магии: неизученный слот объясняет отказ, а не молчит ── */
 await page.evaluate(()=>{G.spells=["Искра"];G.mana=G.manaMax=30;resetCursor();ensureCursor(activeLayer());
  window.__said=[];});
 await fwd();await fwd();                       /* слот 3 — заклинание не изучено */
 await doubleTap();
 const unknown=await page.evaluate(()=>({мана:G.mana,сказано:window.__said.slice(-1)[0]||""}));
 check('неизученное заклинание не тратит ману и объясняет отказ',
  unknown.мана===30&&/не изучен/i.test(unknown.сказано),unknown);

 /* ── 4. Панель магии: свайп ведёт по слотам, двойное касание применяет ── */
 await page.evaluate(()=>{G.spells=SPELLS.map(s=>s.n);G.mana=G.manaMax=30;resetCursor();ensureCursor(activeLayer());});
 await clearSaid();
 await fwd();await fwd();
 const walked=await page.evaluate(()=>({индекс:cursorItems(activeLayer()).indexOf(uiCursor),
  слот:uiCursor&&uiCursor.dataset.magicIndex,мана:G.mana}));
 const namesOnSwipe=(await said()).length;
 await doubleTap();
 const cast=await page.evaluate(()=>({мана:G.mana,заклинание:SPELLS[2]&&SPELLS[2].n,цена:SPELLS[2]&&SPELLS[2].cost}));
 check('в панели магии свайп ведёт по слотам по одному и называет ровно один',
  walked.индекс===2&&walked.слот==='2'&&namesOnSwipe===2,{...walked,названий:namesOnSwipe});
 check('двойное касание применяет именно тот слот, на котором стоит выбор',
  cast.мана===30-cast.цена,{ждали:30-cast.цена,стало:cast.мана,заклинание:cast.заклинание});

 /* ── 5. Руководство: свайпом до нужной главы, двойным касанием — открыть ── */
 await clear();
 const toc=await page.evaluate(()=>{openGuide();resetCursor();ensureCursor(activeLayer());
  const items=cursorItems(activeLayer());
  return {пунктов:items.length,глав:GUIDE.length,
   первый:(items[0].textContent||'').trim().slice(0,10)};});
 for(let i=0;i<3;i++)await fwd();
 const onChapter=await page.evaluate(()=>(uiCursor.textContent||'').trim());
 await doubleTap();
 const chapter=await page.evaluate(()=>({номер:chIndex,
  заголовок:document.getElementById('chTitle').textContent,
  пунктов:cursorItems(activeLayer()).length,
  тексты:cursorItems(activeLayer()).map(x=>(x.textContent||'').trim().slice(0,10))}));
 check('оглавление руководства состоит только из своих пунктов',
  toc.пунктов===toc.глав+1,{пунктов:toc.пунктов,глав:toc.глав});
 check('в руководстве свайп доводит до нужной главы, двойное касание открывает её',
  chapter.номер===2&&onChapter.startsWith('Глава 3')&&chapter.заголовок.startsWith('Глава 3'),
  {курсорБыл:onChapter,открылась:chapter.заголовок});
 check('в открытой главе свайп не уходит в скрытое оглавление',
  chapter.пунктов<=6&&!chapter.тексты.some(t=>/^Глава 1\./.test(t)),chapter);

 /* ── 6. В главе свайп доходит до «След.» и переключает главу ── */
 await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
 const nextIdx=await page.evaluate(()=>cursorItems(activeLayer()).findIndex(x=>x.id==='chNext'));
 for(let i=0;i<nextIdx;i++)await fwd();
 const onNext=await page.evaluate(()=>uiCursor&&uiCursor.id);
 await doubleTap();
 const advanced=await page.evaluate(()=>chIndex);
 check('в главе свайп доводит до «След.», двойное касание листает дальше',
  onNext==='chNext'&&advanced===3,{курсор:onNext,глава:advanced});

 /* ── 7. Добыча: окно без кнопок отвечает подсказкой и собирается касанием ── */
 await clear();
 await page.evaluate(()=>{G.gold=0;G.inv={};G.gear=[];
  G.loot=[{type:"gold",amount:50},{type:"mat",name:"руда"}];
  openLootView("Победа!");window.__said=[];});
 await fwd();
 const lootSwipe=await said();
 await tap(195,600);
 await page.waitForTimeout(300);
 const collected=await page.evaluate(()=>({золото:G.gold,руда:G.inv["руда"]||0,
  окно:activeLayer()&&activeLayer().id,добыча:G.loot}));
 check('в окне добычи свайп не молчит, а подсказывает, что делать',
  lootSwipe.length>=1&&/касан/i.test(lootSwipe.join(' ')),lootSwipe.slice(0,2));
 check('одно касание собирает всю добычу и закрывает окно',
  collected.золото===50&&collected.руда===1&&!collected.окно&&!collected.добыча,collected);

 /* ── 8. Меню действий посреди боя: ощупывание работает и с вынутым оружием ── */
 await clear();
 const combat=await page.evaluate(()=>{
  G.agi=50; /* побег должен удаться наверняка, иначе проверка зависит от броска кости */
  G.hp=G.hpMax;
  const c={x:G.x,y:G.y,monster:{n:"Волк",lvl:2,hp:30,dmg:7,xp:10,gold:5}};
  startCombat(c);G.weaponDrawn=true;handleTwoFingerTap();
  const lay=activeLayer();resetCursor();ensureCursor(lay);
  const items=cursorItems(lay);
  window.__said=[];lastExploreEl=null;
  return {окно:lay&&lay.id,пунктов:items.length,
   побег:items.findIndex(x=>x.dataset.cmd==='am:flee'),бой:G.inCombat};});
 await drag(195,200,195,640);
 const exploreNames=(await said()).length;
 check('меню действий открывается прямо в бою и берёт свайпы на себя',
  combat.окно==='actionMenu'&&combat.пунктов>0&&combat.побег>=0&&combat.бой===true,combat);
 check('в бою с вынутым оружием окно всё равно можно ощупывать пальцем',
  exploreNames>=2,{названий:exploreNames});

 /* ── 9. Свайпом до «Побег» и подтверждение двойным касанием ── */
 await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
 for(let i=0;i<combat.побег;i++)await fwd();
 const onFlee=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 await doubleTap();
 await page.waitForTimeout(300);
 const fled=await page.evaluate(()=>({бой:G.inCombat,окно:activeLayer()&&activeLayer().id}));
 check('свайп доводит до «Побег», двойное касание уводит из боя',
  onFlee==='am:flee'&&fled.бой===false,{курсор:onFlee,...fled});

 /* ── 10. Бой без окна: свайп бьёт, а не листает ── */
 await clear();
 const hit=await page.evaluate(()=>{
  G.hp=G.hpMax;
  const c={x:G.x,y:G.y,monster:{n:"Волк",lvl:2,hp:60,dmg:1,xp:10,gold:5}};
  startCombat(c);G.weaponDrawn=true;
  G.equip.weapon=G.equip.weapon||{name:"Меч",type:"Меч",atk:5,rarity:"обычный"};
  return {окно:activeLayer()&&activeLayer().id,здоровье:G.combat.hp};});
 await fwd();
 await page.waitForTimeout(400);
 const afterHit=await page.evaluate(()=>({здоровье:G.combat&&G.combat.hp,бой:G.inCombat}));
 check('в бою без окна свайп наносит удар, а не листает список',
  hit.окно===null&&afterHit.здоровье<hit.здоровье,{было:hit.здоровье,стало:afterHit.здоровье});

 /* ── 11. Бой без оружия: свайп объясняет, а не молчит ── */
 await page.evaluate(()=>{G.weaponDrawn=false;window.__said=[];});
 await fwd();
 await page.waitForTimeout(200);
 const noWeapon=await said();
 check('в бою с убранным оружием свайп подсказывает, чем бить',
  noWeapon.length>=1&&/ножн|трем/i.test(noWeapon.join(' ')),noWeapon.slice(0,2));
 const summary=await page.evaluate(()=>[document.getElementById('cbTitle').dataset.speak,
  document.getElementById('cbEnemyCol').dataset.speak,
  document.getElementById('cbYouCol')&&document.getElementById('cbYouCol').dataset.speak].filter(Boolean));
 check('сводка боя называет числа, а не «undefined» и «NaN»',
  summary.length>0&&!/undefined|NaN/.test(summary.join(' ')),summary);

 await clear();
 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
