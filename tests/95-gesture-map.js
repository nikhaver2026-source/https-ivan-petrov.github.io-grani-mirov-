/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 95: РАСКЛАДКА ЖЕСТОВ БЕЗ КОНФЛИКТОВ

   Одиночное касание одним пальцем ничего не выполняет. Двойное касание
   одним пальцем активирует пункт, кнопку и действие на поле. Одно касание
   двумя пальцами — сбор. Свайп тремя пальцами вверх — меню действий.
   Двойное касание тремя пальцами — вынуть и убрать оружие. Двойное касание
   четырьмя пальцами — открыть и закрыть панель магии, в которой двенадцать
   слотов по свайпам: один палец — 1–4, два — 5–8, три — 9–12 (вверх, вправо,
   влево, вниз). Одиночные касания тремя и четырьмя пальцами не делают ничего.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Одиночное касание поля и кнопки не выполняет ничего; двойное касание
      кнопки её активирует, двойное касание поля — действие здесь.
   2. Одно касание двумя пальцами собирает; тремя и четырьмя — ничего.
   3. Двойное касание тремя пальцами вынимает и убирает оружие; двойное
      касание четырьмя открывает панель, второе — закрывает.
   4. В открытой панели двенадцать свайпов творят слоты один к одному, и
      свайп тремя пальцами вверх — слот девятый, а не меню действий; свайпы
      четырьмя пальцами по-прежнему речь.
   5. Свайп одним пальцем при закрытой панели — шаг, свайп тремя вверх — меню.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 const cdp=await ctx.newCDPSession(page);
 async function multiTap(n,x=80,y=430){
  const pts=[];for(let i=0;i<n;i++){pts.push({x:x+i*45,y});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,idx)=>({x:p.x,y:p.y,id:idx}))});await page.waitForTimeout(30);}
  await page.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(120);}
 async function multiDouble(n){await multiTap(n);await multiTap(n);}
 async function multiSwipe(n,dx,dy,steps=6){
  const pts=[];for(let i=0;i<n;i++)pts.push({x:100+i*45,y:450});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});await page.waitForTimeout(30);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/steps,y:p.y+dy*k/steps,id:i}))});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(160);}
 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(30);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(80);}
 const dirOf=d=>({N:[0,-170],E:[170,0],S:[0,170],W:[-170,0]}[d]);
 await page.evaluate(()=>{window.LOG=[];
  const u=useHere;window.useHere=function(){LOG.push("useHere");return u.apply(this,arguments);};
  const gc=gatherCurrent;window.gatherCurrent=function(){LOG.push("gather");return gc.apply(this,arguments);};
  const cs=castSpell;window.castSpell=function(i){LOG.push("cast:"+i);return cs.apply(this,arguments);};
  const st=Speech.stop.bind(Speech);Speech.stop=function(){LOG.push("speechstop");return st();};
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.weaponDrawn=false;G.loot=null;settings.fastTap=0;});

 /* ── 1. одиночное касание ничего не делает, двойное активирует ── */
 await page.evaluate(()=>{G.x=WORLD>>1;G.y=WORLD>>1;LOG.length=0;});
 await tap(200,520);await page.waitForTimeout(900);
 const одно=await page.evaluate(()=>LOG.slice());
 await tap(200,520);await tap(200,520);
 const два=await page.evaluate(()=>LOG.slice());
 check('1а. одиночное касание поля ничего не выполняет; двойное — действие здесь',одно.length===0&&два.includes("useHere"),{одно,два});
 await page.evaluate(()=>{safeFn(()=>openActionMenu());});await page.waitForTimeout(200);
 const кн=await page.evaluate(()=>{const b=[...document.querySelectorAll("#actionMenu button[data-cmd]")].find(x=>x.dataset.cmd==="am:hud");const r=b.getBoundingClientRect();window.HUDSAID=0;const ae=activateElement;window.activateElement=function(el){HUDSAID++;return ae.apply(this,arguments);};b.scrollIntoView();const r2=b.getBoundingClientRect();return {x:r2.left+10,y:r2.top+8};});
 await tap(кн.x,кн.y);await page.waitForTimeout(900);
 const после1=await page.evaluate(()=>HUDSAID);
 await tap(кн.x,кн.y);await tap(кн.x,кн.y);await page.waitForTimeout(300);
 const после2=await page.evaluate(()=>HUDSAID);
 check('1б. одиночное касание кнопки её не выполняет; двойное касание выполняет',после1===0&&после2>=1,{после1,после2});
 await page.evaluate(()=>{safeFn(()=>closeActionMenu());for(let i=0;i<10&&activeLayer();i++)closeTopUI();});

 /* ── 2. двумя — сбор; тремя и четырьмя одиночно — ничего ── */
 await page.evaluate(()=>{LOG.length=0;});
 await multiTap(2);await page.waitForTimeout(200);
 const сбор=await page.evaluate(()=>LOG.includes("gather"));
 await page.evaluate(()=>{LOG.length=0;});
 await multiTap(3);await page.waitForTimeout(1100);
 const три=await page.evaluate(()=>({оружие:G.weaponDrawn,лог:LOG.slice()}));
 await multiTap(4);await page.waitForTimeout(1100);
 const четыре=await page.evaluate(()=>({панель:magicPanelOpen(),лог:LOG.slice()}));
 check('2. одно касание двумя пальцами собирает; одиночные касания тремя и четырьмя не делают ничего',сбор&&три.оружие===false&&!три.лог.length&&четыре.панель===false&&!четыре.лог.length,{три,четыре});

 /* ── 3. двойные касания ── */
 await page.evaluate(()=>{if(!G.equip.weapon){const w=weaponList()[0];if(w)G.equip.weapon=w;}});
 await multiDouble(3);await page.waitForTimeout(200);
 const вынуто=await page.evaluate(()=>G.weaponDrawn);
 await page.waitForTimeout(1000);await multiDouble(3);await page.waitForTimeout(200);
 const убрано=await page.evaluate(()=>G.weaponDrawn);
 await page.waitForTimeout(1000);await multiDouble(4);await page.waitForTimeout(300);
 const открыта=await page.evaluate(()=>({панель:magicPanelOpen(),слотов:document.querySelectorAll('#magicSlots button').length}));
 check('3. двойное касание тремя пальцами вынимает и убирает оружие; двойное четырьмя открывает панель на двенадцать слотов',вынуто===true&&убрано===false&&открыта.панель&&открыта.слотов>=12,{вынуто,убрано,открыта});

 /* ── 4. двенадцать свайпов ── */
 await page.evaluate(()=>{G.mana=999;G.manaMax=999;LOG.length=0;for(let i=0;i<12;i++){if(SPELLS[i]&&!G.spells.includes(SPELLS[i].n))G.spells.push(SPELLS[i].n);}
  window.castSpell=function(i){LOG.push("cast:"+i);return true;};});
 const план=[[1,"N"],[1,"E"],[1,"S"],[1,"W"],[2,"N"],[2,"E"],[2,"S"],[2,"W"],[3,"N"],[3,"E"],[3,"W"],[3,"S"]];
 for(const [n,d] of план){const [dx,dy]=dirOf(d);await multiSwipe(n,dx,dy);}
 const слоты=await page.evaluate(()=>LOG.filter(x=>/^cast:/.test(x)).map(x=>Number(x.slice(5))));
 const меню=await page.evaluate(()=>!document.getElementById('actionMenu').hidden);
 await page.evaluate(()=>{LOG.length=0;});
 await multiSwipe(4,0,170);await page.waitForTimeout(200);
 const речь=await page.evaluate(()=>({стоп:LOG.includes("speechstop"),панель:magicPanelOpen()}));
 check('4. двенадцать свайпов творят слоты с первого по двенадцатый один к одному; тремя вверх — девятый, а не меню; четырьмя — речь',
  слоты.join()==="0,1,2,3,4,5,6,7,8,9,10,11"&&меню===false&&речь.стоп&&речь.панель,{слоты,меню,речь});
 await multiDouble(4);await page.waitForTimeout(200);
 const закрыта=await page.evaluate(()=>!magicPanelOpen());

 /* ── 5. без панели ── */
 await page.evaluate(()=>{G.weaponDrawn=false;G.x=WORLD>>1;G.y=WORLD>>1;LOG.length=0;});
 const x0=await page.evaluate(()=>G.x);
 await multiSwipe(1,170,0);await page.waitForTimeout(200);
 const шаг=await page.evaluate(()=>G.x);
 await multiSwipe(3,0,-170);await page.waitForTimeout(200);
 const менюОткрыто=await page.evaluate(()=>!document.getElementById('actionMenu').hidden);
 const лог=await page.evaluate(()=>LOG.slice());
 check('5. панель закрыта двойным касанием четырьмя; без неё свайп одним пальцем — шаг, тремя вверх — меню, и ни одного слота',закрыта&&шаг===x0+1&&менюОткрыто&&!лог.some(x=>/^cast/.test(x)),{закрыта,шаг:шаг-x0,менюОткрыто,лог});

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
