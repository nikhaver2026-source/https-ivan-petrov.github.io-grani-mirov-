const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(600);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());
 await page.waitForTimeout(200);

 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(25);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(60);}
 async function dblTapSel(sel){
  const box=await page.evaluate(s=>{const b=document.querySelector(s);if(!b)return null;b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},sel);
  if(!box)return false;
  await tap(box.x,box.y);await tap(box.x,box.y);await page.waitForTimeout(150);return true;
 }

 // услуга таверны списывает цену РОВНО один раз
 await page.evaluate(()=>{G.gold=100;G.hp=10;const b=document.createElement('button');b.id='p1';b.dataset.cmd='svc:food';b.textContent='еда';document.getElementById('screen-game').appendChild(b);});
 await dblTapSel('#p1');
 check('услуга таверны списывает цену один раз (10 золота)', await page.evaluate(()=>G.gold===90), await page.evaluate(()=>G.gold));

 // квест засчитывается один раз
 await page.evaluate(()=>{G.quests=[{id:'t1',npc:'Тест',type:'kill',need:1,have:1,done:false,text:'проверка',reward:{gold:50,xp:10}}];G.gold=0;
  const b=document.createElement('button');b.id='p2';b.dataset.cmd='qdone:t1';b.textContent='квест';document.getElementById('screen-game').appendChild(b);});
 await dblTapSel('#p2');
 check('награда за квест выдаётся один раз (50 золота)', await page.evaluate(()=>G.gold===50), await page.evaluate(()=>G.gold));

 // все окна открываются и закрываются жестами
 const screens=['map','inv','char','quests','journal','world','art','best','craft','gestures','settings','encyc'];
 for(const s of screens){
  await page.evaluate(c=>CMD[c](),s);
  await page.waitForTimeout(120);
  const opened=await page.evaluate(()=>!!activeLayer());
  const closed=await page.evaluate(()=>{ /* закрытие двумя пальцами */ return true;});
  await page.evaluate(()=>handleTwoFingerTap());   /* два пальца закрывают открытое окно */
  await page.waitForTimeout(120);
  const afterClose=await page.evaluate(()=>!!activeLayer());
  check('окно «'+s+'» открывается и закрывается',opened&&!afterClose,{opened,afterClose});
 }

 // руководство: открытие главы двойным касанием (кнопки на нативных слушателях)
 await page.evaluate(()=>openGuide());
 await page.waitForTimeout(200);
 await dblTapSel('#guideToc button');
 check('глава руководства открывается двойным касанием', await page.evaluate(()=>!document.getElementById('guideChapter').hidden));
 await page.evaluate(()=>closeGuide());

 // здание и разговор с NPC
 await page.evaluate(()=>{
  // ищем ближайшую клетку со строением
  outer: for(let r=0;r<40;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy); if(c.structure){G.x+=dx;G.y+=dy;break outer;}
  }
  interactHere();
 });
 await page.waitForTimeout(250);
 check('окно строения открыто', await page.evaluate(()=>{const m=activeLayer();return !!m&&m.id==='modal-building';}));
 const hasNpc=await page.evaluate(()=>!!document.querySelector('#bldBody [data-cmd^="npc:"]'));
 if(hasNpc){
  await dblTapSel('#bldBody [data-cmd^="npc:"]');
  check('карточка NPC открывается двойным касанием', await page.evaluate(()=>{const m=activeLayer();return !!m&&m.id==='modal-npc';}));
  const qBefore=await page.evaluate(()=>G.quests.length);
  await dblTapSel('#npcBody [data-cmd^="qtake:"]');
  check('вариант диалога «Взять квест» срабатывает один раз', await page.evaluate(n=>G.quests.length===n+1,qBefore), await page.evaluate(()=>G.quests.length));
  await dblTapSel('#npcBody [data-cmd^="npctalk:"]');
  check('вариант диалога «Поговорить» не ломает окно', await page.evaluate(()=>{const m=activeLayer();return !!m&&m.id==='modal-npc';}));
 }else check('в строении есть NPC (пропуск)',true);

 // сохранение/загрузка
 await page.evaluate(()=>{while(activeLayer())handleTwoFingerTap();saveGame(true);});
 await page.waitForTimeout(150);
 check('сохранение без ошибок',errors.length===0);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,10).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
