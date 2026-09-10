const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);
 await page.waitForTimeout(600);
 const cdp=await ctx.newCDPSession(page);

 // кнопка на стартовом экране должна работать обычным касанием (игра ещё не начата)
 await page.evaluate(()=>{showScreen('screen-start');});
 await page.waitForTimeout(150);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:600,id:0}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:195,y:600,id:0}]});
 await page.waitForTimeout(150);

 await page.evaluate(()=>enterGame());
 await page.waitForTimeout(200);

 async function swipe(fx,fy,tx,ty,steps,holdMs){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fx+(tx-fx)*i/steps,y:fy+(ty-fy)*i/steps,id:0}]});
   await page.waitForTimeout(20);
  }
  if(holdMs){
   for(let i=0;i<holdMs/60;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx+(i%2),y:ty,id:0}]});await page.waitForTimeout(60);}
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(120);
 }

 const p0=await page.evaluate(()=>[G.x,G.y]);
 await swipe(200,400,340,400,6);
 const p1=await page.evaluate(()=>[G.x,G.y]);
 check('свайп вправо делает шаг на восток',p1[0]===p0[0]+1&&p1[1]===p0[1],{p0,p1});

 /* Бег проверяется ожиданием условия, а не замером в один миг: на занятой
    машине шаг бега может прийти на десяток-другой миллисекунд позже, и
    проверка «посмотрели ровно сейчас» ложно краснела. */
 const until=async(fn,ms=2000)=>{const t=Date.now();
  while(Date.now()-t<ms){if(await page.evaluate(fn))return true;await page.waitForTimeout(50);}
  return false;};
 /* Шаг мог поднять случайное событие мира, и его окно забрало бы свайп себе:
    открытый слой в игре — это список, по нему свайп листает пункты, а не
    бежит. Закрываем всё, что всплыло, иначе проверка бега мерила бы не бег. */
 await page.evaluate(()=>{let n=0;while(activeLayer()&&n++<8)closeTopUI();});
 await page.waitForTimeout(120);
 const startY=(await page.evaluate(()=>[G.x,G.y]))[1];
 await swipe(200,400,200,250,6,900);
 const moved=await until(new Function('return G.y<'+startY),2000);
 const p2=await page.evaluate(()=>[G.x,G.y]);
 check('свайп с удержанием запускает бег',moved,{p1,p2});
 const stopped=await until(()=>runState.active===false,1500);
 check('после отрыва пальца бег остановлен',stopped);

 // добыча после победы собирается двойным касанием — как и всё остальное в игре
 await page.evaluate(()=>{G.gold=0;G.inCombat=true;G.combat={m:{id:'wolf',n:'Волк',lvl:1,hp:5,dmg:1,xp:5,gold:17},hp:1,key:G.x+','+G.y,ai:{}};victory();});
 await page.waitForTimeout(300);
 check('после победы открыто окно добычи', await page.evaluate(()=>!document.getElementById('lootOverlay').hidden));
 for(let i=0;i<2;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:700,id:0}]});
  await page.waitForTimeout(30);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:195,y:700,id:0}]});
  await page.waitForTimeout(120);}
 const taken=await until(()=>G.gold===17&&document.getElementById('lootOverlay').hidden&&!G.loot,2000);
 check('двойное касание собирает добычу',taken, await page.evaluate(()=>[G.gold,document.getElementById('lootOverlay').hidden]));

 // клавиатура: Escape в бою = побег, Enter по кнопке = одна команда
 await page.evaluate(()=>{window.__c=0;const o=CMD.check;CMD.check=(...a)=>{window.__c++;return o(...a);};
  const b=document.createElement('button');b.id='kb';b.dataset.cmd='check';document.getElementById('screen-game').appendChild(b);document.getElementById('kb').focus();});
 await page.keyboard.press('Enter');
 await until(()=>window.__c>=1,1500);
 await page.waitForTimeout(250);   /* даём шанс лишнему срабатыванию проявиться */
 check('Enter по кнопке выполняет команду один раз', await page.evaluate(()=>window.__c===1), await page.evaluate(()=>window.__c));

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
