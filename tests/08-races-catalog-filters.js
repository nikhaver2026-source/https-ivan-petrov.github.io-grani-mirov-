const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());
 await page.waitForTimeout(200);
 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(25);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(60);}
 async function dbl(sel){const b=await page.evaluate(s=>{const el=document.querySelector(s);if(!el)return null;el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},sel);
  if(!b)return false;await tap(b.x,b.y);await tap(b.x,b.y);await page.waitForTimeout(200);return true;}

 // 1. Три новых окна открываются из меню действий
 for(const [cmd,id,name] of [['races','modal-races','Народы Грани'],['pantheon','modal-pantheon','Пантеон'],['politics','modal-politics','Политика']]){
  await page.evaluate(c=>CMD[c](),cmd);
  await page.waitForTimeout(200);
  const ok=await page.evaluate(i=>{const m=document.getElementById(i);return !!m&&!m.hidden&&m.textContent.length>500;},id);
  check('окно «'+name+'» открывается и заполнено',ok);
  await page.evaluate(()=>handleTwoFingerTap());await page.waitForTimeout(120);
 }
 // 2. Каталог показывает все 45 и фильтрует по рангу
 await page.evaluate(()=>CMD.races());
 await page.waitForTimeout(250);
 const cards=await page.evaluate(()=>document.querySelectorAll('#raceList .list-line').length);
 check('в каталоге 45 карточек народов',cards===45,cards);
 await page.evaluate(()=>CMD.racefilter('5'));
 await page.waitForTimeout(200);
 const divine=await page.evaluate(()=>document.querySelectorAll('#raceList .list-line').length);
 check('фильтр по божественному рангу показывает 5 народов',divine===5,divine);
 const speakLen=await page.evaluate(()=>{const el=document.querySelector('#raceList .list-line');return el?el.dataset.speak.length:0;});
 check('карточка озвучивает полное досье',speakLen>400,speakLen);
 // 3. Выбор происхождения меняет наследие и характеристики
 const atkBefore=await page.evaluate(()=>atk());
 await page.evaluate(()=>CMD.setrace('titan'));
 await page.waitForTimeout(150);
 const st=await page.evaluate(()=>({race:G.race,def:def(),atk:atk()}));
 check('происхождение выбирается и даёт наследие',st.race==='Титаны Грани'&&st.def>0,st);
 await page.evaluate(()=>CMD.setrace('dragonborn'));
 const atkAfter=await page.evaluate(()=>atk());
 check('наследие драконидов не ломает расчёт атаки',atkAfter>=atkBefore-10,{atkBefore,atkAfter});
 await page.evaluate(()=>{while(activeLayer())handleTwoFingerTap();});

 // 4. Вера: молитва и покровительство
 await page.evaluate(()=>{G.hp=40;CMD.prayto('forge');});
 await page.waitForTimeout(200);
 const faith=await page.evaluate(()=>({hp:G.hp,favor:godFavor('forge')}));
 check('молитва лечит и даёт благосклонность',faith.hp>40&&faith.favor>0,faith);
 const again=await page.evaluate(()=>{const hp=G.hp;CMD.prayto('forge');return G.hp===hp;});
 check('повторная молитва в тот же день в том же храме не проходит',again);
 const atkNoPatron=await page.evaluate(()=>{G.race='Люди';G.patron=null;return atk();});
 const atkPatron=await page.evaluate(()=>{choosePatron('forge');G.faith.forge=30;return atk();});
 check('покровительство Мораха усиливает удар',atkPatron>atkNoPatron,{atkNoPatron,atkPatron});

 // 5. Экономика: цены различаются между державами, продажа работает
 const prices=await page.evaluate(()=>EMPIRES.map((e,i)=>marketPrice('руда',i,G.day)));
 check('цена руды различается по державам',new Set(prices).size>1,prices);
 const war=await page.evaluate(()=>{const w=warsAt(G.day);return {wars:w.length,allies:alliesAt(G.day).length};});
 check('мир имеет живую политику (войны или союзы)',war.wars+war.allies>0,war);
 const shift=await page.evaluate(()=>{const a=JSON.stringify(warsAt(1)),b=JSON.stringify(warsAt(40));return a!==b;});
 check('политика меняется со временем',shift);

 // 6. Торговля у настоящего торговца: продать ресурс
 const sold=await page.evaluate(()=>{
  // находим ближайшее строение с торговцем
  outer: for(let r=0;r<60;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&npcsFor(c).some(n=>n.trade)){G.x+=dx;G.y+=dy;break outer;}}
  const c=cellContent(G.x,G.y);const npc=npcsFor(c).find(n=>n.trade);
  if(!npc)return {skip:true};
  G.inv["руда"]=5;G.gold=0;
  openNPC(npc.key);
  const btn=document.querySelector('#npcBody [data-cmd^="sellall:"]');
  if(!btn)return {noButton:true};
  const arg=btn.dataset.cmd.slice("sellall:".length);
  CMD.sellall(arg);
  return {gold:G.gold,left:Number(G.inv["руда"])||0,race:npc.race};
 });
 check('продажа ресурса торговцу приносит золото',sold.gold>0&&sold.left===0,sold);
 const rep=await page.evaluate(()=>Object.values(G.rep||{}).some(v=>v>0));
 check('торговля поднимает репутацию у народа',rep);

 // 7. Кланы и храмы в зданиях
 const bld=await page.evaluate(()=>{
  outer: for(let r=0;r<80;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&c.structure.type==='temple'){G.x+=dx;G.y+=dy;break outer;}}
  const c=cellContent(G.x,G.y);
  if(!c.structure||c.structure.type!=='temple')return {skip:true};
  openBuilding(c);
  const body=document.getElementById('bldBody').textContent;
  return {temple:body.includes('Храм посвящён'),pray:!!document.querySelector('#bldBody [data-cmd^="prayto:"]')};
 });
 check('храм посвящён конкретному богу и позволяет молиться',bld.skip||(bld.temple&&bld.pray),bld);

 // 8. Сохранение/загрузка новых полей
 const persist=await page.evaluate(()=>{G.patron='moon';G.race='Феи';G.rep={elf:5};saveGame(true);
  const raw=JSON.parse(localStorage.getItem('gm29save')||'{}');return {patron:raw.patron,race:raw.race,rep:raw.rep};});
 check('народ, покровитель и репутация сохраняются',persist.patron==='moon'&&persist.race==='Феи'&&persist.rep.elf===5,persist);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
