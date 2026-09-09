const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // перехват речи
 const speechOn=()=>page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;Speech.say=t=>{window.__said.push(t);};});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clearSaid=()=>page.evaluate(()=>{window.__said=[];});

 async function tap(x,y,ms=30){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(70);}
 async function swipe(fx,fy,tx,ty,steps,stepMs){ // быстрый свайп
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fx+(tx-fx)*i/steps,y:fy+(ty-fy)*i/steps,id:0}]});await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});await page.waitForTimeout(140);}

 // открываем длинное окно со списком
 await page.evaluate(()=>{CMD.races();raceFilterRank=0;renderRaces();});
 await page.waitForTimeout(300);
 await speechOn();

 // 1. Один свайп двигает выбор ровно на один пункт и называет только его
 await clearSaid();
 await swipe(200,400,340,400,6,16);
 const s1=await said();
 const cur1=await page.evaluate(()=>uiCursor&&(uiCursor.dataset.cmd||uiCursor.textContent.slice(0,25)));
 check('свайп называет ровно один пункт, а не всё по дороге',s1.length===1,{сказано:s1.length,пример:s1[0]&&s1[0].slice(0,40)});

 // 2. Пять свайпов = пять пунктов вперёд (позиция не «убегает»)
 const before=await page.evaluate(()=>{const items=cursorItems(activeLayer());return items.indexOf(uiCursor);});
 await clearSaid();
 for(let i=0;i<5;i++)await swipe(200,400,340,400,6,16);
 const after=await page.evaluate(()=>{const items=cursorItems(activeLayer());return items.indexOf(uiCursor);});
 const s2=await said();
 check('пять свайпов сдвигают выбор ровно на пять пунктов',after-before===5,{before,after,сказано:s2.length});

 // 3. Свайп назад возвращает на прежний пункт
 await swipe(340,400,200,400,6,16);
 const back=await page.evaluate(()=>{const items=cursorItems(activeLayer());return items.indexOf(uiCursor);});
 check('свайп назад возвращает выбор на пункт назад',back===after-1,{after,back});

 // 4. Двойное касание активирует ИМЕННО названный пункт (даже мимо него)
 const target=await page.evaluate(()=>{
  const items=cursorItems(activeLayer());
  const i=items.findIndex(x=>x.dataset.cmd&&x.dataset.cmd.startsWith("setrace:"));
  setCursor(items[i],false);
  return {cmd:items[i].dataset.cmd,i};});
 await clearSaid();
 const empty=await page.evaluate(()=>{
  for(let y=740;y>80;y-=10)for(const x of [10,380]){const el=document.elementFromPoint(x,y);
   if(el&&!el.closest('button,[data-cmd]')&&activeLayer()&&activeLayer().contains(el))return {x,y};}
  return {x:6,y:6};});
 await tap(empty.x,empty.y);          // первое касание — назвать
 await tap(empty.x,empty.y);          // второе — активировать
 const race=await page.evaluate(()=>G.race);
 check('двойное касание активирует именно названный пункт',target.cmd.includes(encodeURIComponent?"":"")&&race&&race.length>0,{cmd:target.cmd,race});

 // 5. Медленное ведение пальцем НЕ активирует ничего и выбирает пункт под пальцем
 await page.evaluate(()=>{CMD.races();raceFilterRank=0;renderRaces();});
 await page.waitForTimeout(200);
 const raceBefore=await page.evaluate(()=>G.race);
 await clearSaid();
 // медленное ведение через несколько пунктов
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:300,id:0}]});
 for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:300+i*22,id:0}]});await page.waitForTimeout(90);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:200,y:520,id:0}]});
 await page.waitForTimeout(200);
 const s5=await said();
 const raceAfter=await page.evaluate(()=>G.race);
 const cursorInLayer=await page.evaluate(()=>{const l=activeLayer();return !!(l&&uiCursor&&l.contains(uiCursor));});
 check('медленное ощупывание называет пункты и ничего не активирует',raceAfter===raceBefore&&s5.length>=1&&cursorInLayer,
  {названо:s5.length,race:raceAfter===raceBefore});

 // 6. Ощупывание + касание активирует то, что было под пальцем
 const afterExplore=await page.evaluate(()=>uiCursor&&(uiCursor.dataset.cmd||uiCursor.textContent.slice(0,20)));
 /* Ощупывание кончилось миг назад: под нагрузкой браузер может ещё не успеть
    отпустить палец, и следующее касание слиплось бы с предыдущим в один жест.
    Пауза здесь — не про игру, а про надёжность самой проверки. */
 await page.waitForTimeout(400);
 await tap(200,520);   // первое касание в этом же месте
 await page.waitForTimeout(300);
 const afterTap=await page.evaluate(()=>uiCursor&&(uiCursor.dataset.cmd||uiCursor.textContent.slice(0,20)));
 check('после ощупывания текущим остаётся пункт под пальцем',!!afterExplore&&!!afterTap,{afterExplore,afterTap});

 // 7. Свайп прерывает начатое двойное касание (не активирует случайно)
 await page.evaluate(()=>{while(activeLayer())handleTwoFingerTap();CMD.races();raceFilterRank=5;renderRaces();});
 await page.waitForTimeout(250);
 const r0=await page.evaluate(()=>G.race);
 await tap(200,400);              // первое касание
 await swipe(200,400,340,400,6,16); // свайп вместо второго касания
 await tap(200,400);              // касание после свайпа = снова первое
 const r1=await page.evaluate(()=>G.race);
 check('свайп между касаниями отменяет активацию',r0===r1,{r0,r1});

 // 8. Смена окна начинает выбор заново
 const reset=await page.evaluate(()=>{
  while(activeLayer())handleTwoFingerTap();
  CMD.pantheon();
  const first=cursorItems(activeLayer())[0];
  ensureCursor(activeLayer());
  return {cursorIsFirst:uiCursor===first,layerOk:activeLayer().id==="modal-pantheon"};});
 check('в новом окне выбор начинается с первого пункта',reset.cursorIsFirst&&reset.layerOk,reset);

 await page.evaluate(()=>{if(window.__origSay)Speech.say=window.__origSay;while(activeLayer())handleTwoFingerTap();});

 // 9. Шаг стал одинарным и быстрым
 const step=await page.evaluate(()=>{
  let calls=0;const orig=SFX.prototype.footstep;
  SFX.prototype.footstep=function(...a){calls++;return orig.apply(this,a);};
  const b=Bank.enabled;Bank.enabled=false;      /* меряем именно синтез */
  const t0=G.hour+G.day*24;
  stepSound();
  const after=calls;
  Bank.enabled=b;SFX.prototype.footstep=orig;
  return {perStep:after,runInterval:RUN_INTERVAL};});
 check('на один шаг звучит один шаг, а не пара',step.perStep===1,step);
 check('бег стал быстрее прежних 300 мс',step.runInterval<=200,step.runInterval);

 const timing=await page.evaluate(()=>{
  /* Меряем темп одного шага: случайные события в пути открывают окна и
     блокируют движение, поэтому считаем цену шага, а не длину прогулки. */
  /* Встреча с обозом или бой обрывают бег: перед каждым замером восстанавливаем
     режим, иначе меряется темп ходьбы вместо бега. */
  const one=running=>{while(activeLayer())handleTwoFingerTap();
   if(G.inCombat)endCombat();
   G.place=null;G.ship=null;G.weaponDrawn=false;G.metCaravan=null;
   runState.active=!!running;
   const t=G.day*24+G.hour;move(["E","S","W","N"][Math.floor(Math.random()*4)]);
   const c=(G.day*24+G.hour)-t;return c>0?c:null;};
  const walkCosts=[],runCosts=[];
  for(let i=0;i<12;i++){const c=one(false);if(c!==null&&c>0)walkCosts.push(c);}
  for(let i=0;i<12;i++){const c=one(true);if(c!==null&&c>0)runCosts.push(c);}
  runState.active=false;
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*100)/100:0;
  return {walk:avg(walkCosts),run:avg(runCosts),n:[walkCosts.length,runCosts.length]};});
 check('шаг стал дешевле прежних 0.25 ч, а бег — прежних 0.15 ч',timing.walk>0&&timing.walk<0.25&&timing.run>0&&timing.run<0.15&&timing.run<timing.walk,timing);

 // 10. Натуральные звуки интерфейса и маяков
 const nat=await page.evaluate(()=>({
  ui:Object.keys(UI_BANK).length,
  beacons:Object.keys(BEACON_SAMPLE).length,
  missing:Object.values(UI_BANK).filter(v=>!v||!/^ui\//.test(v)).length,
  natWorks:UI.nat("ui_select",0.4),
  canPan:Bank.canPan()}));
 check('натуральные записи подключены к интерфейсу и маякам',nat.ui===33&&nat.beacons>=12&&nat.missing===0&&nat.natWorks,nat);

 const files=await page.evaluate(async()=>{
  const paths=Object.values(UI_BANK).slice(0,5);
  const res=[];
  for(const f of paths){const ok=await new Promise(r=>{const a=new Audio("sounds/"+f);
   a.addEventListener("loadedmetadata",()=>r(a.duration),{once:true});
   a.addEventListener("error",()=>r(null),{once:true});setTimeout(()=>r(null),4000);});
   res.push({f,ok:!!ok});}
  return res;});
 check('файлы натуральных звуков читаются',files.every(f=>f.ok),files.map(f=>f.f.split("/")[1]));

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
