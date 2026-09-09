const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(200);

 async function multi(n,dir){ // dir: null = тап, 'S'/'N'/'E' = свайп
  const pts=[];
  for(let i=0;i<n;i++){pts.push({x:120+i*45,y:400});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,k)=>({x:p.x,y:p.y,id:k}))});
   await page.waitForTimeout(35);}
  await page.waitForTimeout(60);
  if(dir){
   const d={S:[0,160],N:[0,-160],E:[160,0],W:[-160,0]}[dir];
   for(let step=1;step<=5;step++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,k)=>({x:p.x+d[0]*step/5,y:p.y+d[1]*step/5,id:k}))});
    await page.waitForTimeout(20);}
   pts.forEach((p,k)=>{p.x+=d[0];p.y+=d[1];});
  }
  for(let k=n-1;k>=0;k--){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:pts[k].x,y:pts[k].y,id:k}]});
   await page.waitForTimeout(20);
   const rest=pts.slice(0,k).map((p,idx)=>({x:p.x+2,y:p.y+1,id:idx}));
   if(rest.length){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:rest});await page.waitForTimeout(20);}}
  await page.waitForTimeout(200);}
 async function tap(){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:400,id:0}]});
  await page.waitForTimeout(40);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:200,y:400,id:0}]});
  await page.waitForTimeout(120);}
 async function hold(ms){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:400,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:200,y:400,id:0}]});
  await page.waitForTimeout(250);}

 // встаём на постройку с входом
 await page.evaluate(()=>{
  outer: for(let r=1;r<50;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]){G.x+=dx;G.y+=dy;break outer;}}
  G.place=null;});

 // 1. Свайп двумя пальцами вниз — вход внутрь
 await multi(2,'S');
 const inside=await page.evaluate(()=>G.place&&{kind:G.place.kind,depth:G.place.depth,name:G.place.name});
 check('свайп двумя пальцами вниз вводит в постройку',!!inside,inside);

 // 2. Свайп одним пальцем — шаг внутри
 const before=await page.evaluate(()=>G.place&&[G.place.x,G.place.y]);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:400,id:0}]});
 for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150+i*25,y:400,id:0}]});await page.waitForTimeout(18);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:300,y:400,id:0}]});
 await page.waitForTimeout(250);
 const after=await page.evaluate(()=>G.place&&[G.place.x,G.place.y]);
 check('свайп одним пальцем — шаг внутри постройки',JSON.stringify(before)!==JSON.stringify(after),{before,after});

 // 3. Свайп двумя пальцами вверх — выход наружу через ворота
 await page.evaluate(()=>{const l=curLevel();for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]==="G"||l.g[y][x]==="<"){G.place.x=x;G.place.y=y;return;}});
 await multi(2,'N');
 check('свайп двумя пальцами вверх выводит наружу', await page.evaluate(()=>G.place===null));

 // 4. Двойное касание — действие «здесь» (вход). Долгое касание больше ничего
 //    не выполняет: одиночное касание в игре только называет.
 await hold(900);
 const послеУдержания=await page.evaluate(()=>!!G.place);
 check('долгое касание само по себе никуда не входит',послеУдержания===false,
  {вошли:послеУдержания});
 await tap();await tap();
 await page.waitForTimeout(300);
 const held=await page.evaluate(()=>!!G.place);
 check('двойное касание входит в постройку под ногами',held);

 // 5. Свайп тремя пальцами — «где я»
 const said=await page.evaluate(()=>{window.__said=[];const o=Speech.say;Speech.say=t=>{window.__said.push(t);o&&null;};window.__restore=()=>Speech.say=o;return true;});
 await multi(3,'E');
 const where=await page.evaluate(()=>{const s=window.__said.join(" | ");window.__restore();return s;});
 check('свайп тремя пальцами говорит, где вы находитесь',/Вы здесь/.test(where),where.slice(0,80));

 // 6. Эхо-скан двумя пальцами вбок
 const echoed=await page.evaluate(()=>{window.__b=[];const o=window.beacon;return true;});
 const near=await page.evaluate(()=>nearFeatures(8).length);
 check('внутри есть объекты для эхо-скана',near>0,near);

 // 7. Задания богов и войн
 const q=await page.evaluate(()=>{
  const npc=getNPC(G.x,G.y,0,"Жрец");
  const gq=godQuestFor(npc,0.2),rq=godQuestFor(npc,0.9);
  const idx=empireIndexAt(G.x,G.y);
  const wq=warQuestFor(npc,0.2,idx),rq2=warQuestFor(npc,0.9,idx);
  return {altar:gq.type,relic:rq.type,supply:wq.type,raid:rq2.type,
   altarText:gq.text.length>40,supplyRes:wq.res,raidNeed:rq2.need};});
 check('генерируются задания богов и войн',q.altar==='god_altar'&&q.relic==='god_relic'&&q.supply==='war_supply'&&q.raid==='war_raid',q);

 // 8. Прогресс паломничества засчитывается в подземелье
 const prog=await page.evaluate(()=>{
  G.quests=[{id:"t1",npc:"Жрец",type:"god_altar",godId:"stone",need:1,have:0,done:false,text:"тест",reward:{gold:10,xp:10},faith:4}];
  G.place={kind:"dungeon",bx:G.x,by:G.y,stype:"ruins",name:"Тест",depth:2,x:1,y:1};
  G.altarPrayed="stone";checkQuestProgress();
  const flagged=!!G.quests[0].doneFlag;
  G.gold=0;completeQuest("t1");
  return {flagged,done:G.quests[0].done,gold:G.gold,favor:godFavor("stone")};});
 check('паломничество к алтарю засчитывается и награждает благосклонностью',prog.flagged&&prog.done&&prog.favor>0,prog);

 // 9. Военный рейд считает убитых в подземелье
 const raid=await page.evaluate(()=>{
  G.dungeonKills=0;
  G.quests=[{id:"t2",npc:"Стражник",type:"war_raid",need:2,have:0,base:0,done:false,text:"тест",reward:{gold:10,xp:10},diplo:3}];
  G.dungeonKills=2;checkQuestProgress();
  const have=G.quests[0].have;completeQuest("t2");
  return {have,done:G.quests[0].done};});
 check('военный рейд считает убитых и завершается',raid.have===2&&raid.done,raid);

 // 10. Реликвия бога из сундука закрывает задание
 const relic=await page.evaluate(()=>{
  G.items=[];G.quests=[{id:"t3",npc:"Жрец",type:"god_relic",godId:"moon",need:1,have:0,done:false,text:"тест",reward:{gold:10,xp:10},faith:6}];
  checkQuestProgress();const before=G.quests[0].doneFlag;
  G.items.push("Реликвия: "+GOD_BY_ID.moon.n);checkQuestProgress();
  const after=G.quests[0].doneFlag;completeQuest("t3");
  return {before:!!before,after:!!after,done:G.quests[0].done,left:G.items.length};});
 check('реликвия бога закрывает задание и уходит заказчику',!relic.before&&relic.after&&relic.done&&relic.left===0,relic);

 // 11. События мира открываются окном с вариантами
 const evt=await page.evaluate(()=>{
  G.place=null;G.lastEventAt=0;curEvent=null;
  const c=eventContext();
  const e=EVENTS.find(x=>x.id==="holyday");
  openEvent(e,c);
  const m=document.getElementById("modal-event");
  const btns=[...document.querySelectorAll('#eventBody [data-cmd^="evt:"]')].length;
  const favBefore=godFavor(c.holy.id);
  CMD.evt("0");
  return {open:m&&!m.hidden,btns,favBefore,favAfter:godFavor(c.holy.id),closed:document.getElementById("modal-event").hidden};});
 check('событие открывает окно с вариантами и выбор действует',evt.btns>=2&&evt.favAfter>evt.favBefore&&evt.closed,evt);

 const evAll=await page.evaluate(()=>{
  const c={idx:0,emp:EMPIRES[0],wars:[{a:0,b:1,cause:"тест"}],foe:EMPIRES[1],holy:PANTHEON[0],patron:PANTHEON[1],inside:true,depth:3};
  const bad=[];
  for(const e of EVENTS){try{e.title(c);e.text(c);const ch=e.choices(c);if(!ch.length)bad.push(e.id);}catch(err){bad.push(e.id+":"+err.message);}}
  return {count:EVENTS.length,bad};});
 check('все события мира собираются без ошибок',evAll.bad.length===0,evAll);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
