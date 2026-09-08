const {chromium}=require('playwright');
const path=process.argv[2];
const results=[];
function check(name,cond,extra){results.push((cond?'PASS':'FAIL')+' — '+name+(extra!==undefined?' :: '+JSON.stringify(extra):''));}

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(path);
 await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);

 // войти в мир
 await page.evaluate(()=>{try{enterGame();}catch(e){return String(e);}});
 await page.waitForTimeout(300);
 check('игровой экран открыт', await page.evaluate(()=>gameActive()));

 // ── helper: многопальцевый тап с РАЗНОВРЕМЕННЫМ отрывом пальцев ──
 async function multiTap(n,{stagger=true}={}){
  const pts=[];
  for(let i=0;i<n;i++){
   pts.push({x:80+i*45,y:400});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,idx)=>({x:p.x,y:p.y,id:idx}))});
   await page.waitForTimeout(40);
  }
  await page.waitForTimeout(80);
  if(stagger){
   for(let k=n-1;k>=0;k--){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:pts[k].x,y:pts[k].y,id:k}]});
    await page.waitForTimeout(20);
    /* живой палец на экране всегда чуть дрожит между отрывами соседних пальцев */
    const rest=pts.slice(0,k).map((p,idx)=>({x:p.x+2,y:p.y+1,id:idx}));
    if(rest.length){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:rest});await page.waitForTimeout(20);}
   }
  }else{
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForTimeout(150);
 }
 /* Свайп несколькими пальцами: меню действий переехало на три пальца вверх,
    чтобы одно касание двумя пальцами могло собирать ресурсы. */
 async function multiSwipe(n,dx,dy,steps=6,stepMs=16){
  const x=100,y=430;
  const pts=k=>Array.from({length:n},(_,i)=>({x:x+i*45+Math.round(dx*k/steps),y:y+Math.round(dy*k/steps),id:i}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(0)});
  await page.waitForTimeout(stepMs);
  for(let k=1;k<=steps;k++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(k)});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);
 }
 async function swipe(fromX,fromY,toX,toY,steps=6){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fromX,y:fromY,id:0}]});
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fromX+(toX-fromX)*i/steps,y:fromY+(toY-fromY)*i/steps,id:0}]});
   await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(150);
 }
 async function tap(x,y){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(30);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(60);
 }

 // 1. три пальца с разновременным отрывом → оружие вынуто
 await multiTap(3);
 check('3 пальца (разновременный отрыв) вынимают оружие', await page.evaluate(()=>G.weaponDrawn===true));
 await multiTap(3);
 check('3 пальца повторно убирают оружие', await page.evaluate(()=>G.weaponDrawn===false));

 // 2. три пальца вверх → меню действий, два пальца → закрытие
 await multiSwipe(3,0,-170);
 check('свайп тремя пальцами вверх открывает меню действий', await page.evaluate(()=>!document.getElementById('actionMenu').hidden));
 await multiTap(2);
 check('2 пальца закрывают меню действий', await page.evaluate(()=>document.getElementById('actionMenu').hidden));

 // 2б. два пальца на игровом поле собирают ресурс под ногами
 const res=await page.evaluate(()=>{
  for(let r=0;r<4000;r++){const x=1000+(r%60),y=1000+Math.floor(r/60);
   const c=cellContent(x,y);
   if(c.res&&!c.structure&&!c.monster){G.x=x;G.y=y;G.place=null;G.inv={};G.depleted={};
    return c.res.name;}}
  return null;});
 await multiTap(2);
 check('касание двумя пальцами собирает ресурс под ногами',
  await page.evaluate(n=>(G.inv[n]||0)===1,res),{ресурс:res, запас:await page.evaluate(()=>({...G.inv}))});

 // 3. четыре пальца → панель магии
 await multiTap(4);
 check('4 пальца открывают панель магии', await page.evaluate(()=>{const m=document.getElementById('magicPanel');return !!m&&!m.hidden;}));
 await multiTap(4);
 check('4 пальца закрывают панель магии', await page.evaluate(()=>{const m=document.getElementById('magicPanel');return !!m&&m.hidden;}));

 // 4. бой: окна нет, есть встроенная сводка, слой не активен
 await page.evaluate(()=>{const c=cellContent(G.x,G.y);const m={id:'wolf',n:'Волк',lvl:2,hp:30,dmg:4,xp:10,gold:5};startCombat({x:G.x,y:G.y,monster:m});});
 await page.waitForTimeout(200);
 check('в начале боя окно НЕ открывается', await page.evaluate(()=>document.getElementById('lootOverlay').hidden===true&&activeLayer()===null));
 check('боевая сводка показана на игровом экране', await page.evaluate(()=>document.getElementById('combatBar').hidden===false));

 // 5. удар свайпом в бою
 await multiTap(3); // вынуть оружие
 check('оружие вынимается прямо в бою', await page.evaluate(()=>G.weaponDrawn===true));
 const hpBefore=await page.evaluate(()=>G.combat.hp);
 await swipe(200,400,330,400);
 await page.waitForTimeout(400);
 const hpAfter=await page.evaluate(()=>G.combat?G.combat.hp:0);
 check('свайп при вынутом оружии наносит удар',hpAfter<hpBefore,{hpBefore,hpAfter});

 // 6. побег доступен из меню действий во время боя
 await multiSwipe(3,0,-170);
 const hasFlee=await page.evaluate(()=>[...document.querySelectorAll('#amList button')].some(b=>b.dataset.cmd==='am:flee'));
 check('в бою в меню действий есть пункт побега',hasFlee);
 await page.evaluate(()=>closeActionMenu());

 // 7. команда data-cmd выполняется РОВНО ОДИН раз
 await page.evaluate(()=>{window.__calls=0;const orig=CMD.check;CMD.check=function(...a){window.__calls++;return orig.apply(this,a);};});
 await page.evaluate(()=>{const b=document.createElement('button');b.id='probe';b.dataset.cmd='check';b.textContent='проба';document.getElementById('screen-game').appendChild(b);});
 await page.click('#probe');
 await page.waitForTimeout(200);
 check('клик по кнопке data-cmd выполняет команду один раз', await page.evaluate(()=>window.__calls===1), await page.evaluate(()=>window.__calls));

 // 8. двойное касание элемента в окне активирует его; одиночное — только озвучивает
 await page.evaluate(()=>{G.inCombat=false;G.combat=null;document.getElementById('combatBar').hidden=true;window.__calls=0;});
 await page.evaluate(()=>{CMD.gestures();});
 await page.waitForTimeout(200);
 check('окно жестов открыто', await page.evaluate(()=>activeLayer()&&activeLayer().id==='modal-gestures'));
 const box=await page.evaluate(()=>{const b=document.querySelector('#modal-gestures [data-cmd="close"]');const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await tap(box.x,box.y);
 check('одиночное касание НЕ активирует кнопку', await page.evaluate(()=>activeLayer()&&activeLayer().id==='modal-gestures'));
 await tap(box.x,box.y);
 await page.waitForTimeout(200);
 check('двойное касание активирует кнопку закрытия', await page.evaluate(()=>!activeLayer()));

 // 9. двойное касание по пустому месту активирует выбранный свайпом пункт
 await page.evaluate(()=>{CMD.gestures();});
 await page.waitForTimeout(150);
 await swipe(200,300,330,300); // свайп-перелистывание → фокус на первом элементе
 const focused=await page.evaluate(()=>document.activeElement&&document.activeElement.dataset.cmd);
 await tap(30,700); await tap(30,700);
 await page.waitForTimeout(200);
 check('двойное касание по пустому месту активирует текущий пункт', await page.evaluate(()=>!activeLayer()),{focused});

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,8).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
