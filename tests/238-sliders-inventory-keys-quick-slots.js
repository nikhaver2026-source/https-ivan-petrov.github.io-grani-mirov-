/* ════════════════════════════════════════════════════════════════════════
   НАБОР 238: ПОЛЗУНКИ СВАЙПОМ И СТРЕЛКАМИ, ИНВЕНТАРЬ СТРЕЛКАМИ (WINDOWS),
   БЫСТРЫЕ СЛОТЫ С КЛАВИАТУРЫ В БОЮ (WINDOWS)

   1. Ползунок громкости и скорости: шаг вверх прибавляет, вниз убавляет;
      значение применяется сразу (слышно), край шкалы не перескакивается.
   2. На компьютере в настройках стрелки вправо и влево двигают ползунок.
   3. В приложении для Windows в разделе инвентаря стрелки вправо и влево
      перебирают действия с вещью, Enter выполняет названное.
   4. В бою стрелки — быстрые слоты: вверх и вниз — раздел (зелья, свитки,
      прочее), вправо и влево — слот; правый Ctrl применяет; левый Ctrl
      обрывает речь; в настройках можно выбрать левый или любой Ctrl.
   5. Вне боя стрелки быстрые слоты не трогают; поверх окна — тоже.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{const m=o(t,x);window.__said.push(String(t));return m;};
  window.ЖМИ=(code,key,mods)=>{const e=new KeyboardEvent("keydown",Object.assign({code,key:key||code,bubbles:true,cancelable:true},mods||{}));document.dispatchEvent(e);return e.defaultPrevented;};
  G.inCombat=false;G.combat=null;});

 /* ── 1–2 ── */
 const полз=await page.evaluate(()=>{const r={};
  CMD.settings();
  const vol=document.getElementById("setVoiceVol"),rate=document.getElementById("setRate");
  vol.value=50;vol.dispatchEvent(new Event("input",{bubbles:true}));
  rangeNudge(vol,1);r.громче=settings.voiceVol;rangeNudge(vol,-1);rangeNudge(vol,-1);r.тише=settings.voiceVol;
  rate.value=5;rate.dispatchEvent(new Event("input",{bubbles:true}));
  rangeNudge(rate,1);r.быстрее=settings.rate;
  rate.value=6;rangeNudge(rate,1);r.край=+rate.value;r.крайСказано=__said.slice(-1)[0];
  /* стрелки на компьютере */
  setCursor(vol,true);const v0=+vol.value;ЖМИ("ArrowRight");r.стрелкаВправо=+vol.value-v0;ЖМИ("ArrowLeft");r.стрелкаВлево=+vol.value-v0;
  while(activeLayer())closeTopUI();
  r.свайп=/uiCursor\.type==="range"&&layer\.contains\(uiCursor\)\)\{safeFn\(\(\)=>rangeNudge\(uiCursor,dir==='N'\?1:-1\)\)/.test(document.documentElement.innerHTML);
  return r;});
 check('1. ползунок: вверх прибавляет, вниз убавляет, значение применяется сразу; край не перескакивается; на телефоне — свайп вверх и вниз',
  полз.громче>0.5&&полз.тише<0.5&&Math.abs(полз.быстрее-5.2)<1e-6&&полз.край===6&&/предел/.test(полз.крайСказано||"")&&полз.свайп,полз);
 check('2. на компьютере стрелки вправо и влево двигают ползунок',полз.стрелкаВправо>0&&полз.стрелкаВлево===0,полз);

 /* ── 3 ── */
 const инв=await page.evaluate(()=>{const r={};
  window.isDesktopApp=()=>true;
  G.items=["Противоядие","Зелье здоровья"];G.inv={};G.hpMax=100;G.hp=40;
  CMD.inv();
  const sec=invAll().find(x=>x.name==="Зелье здоровья").раздел;
  INV.cat=sec;renderInventory();
  const el=[...document.querySelectorAll('#invSections [data-cmd^="invpick:"]')].find(b=>/Зелье здоровья/.test(b.textContent));
  setCursor(el,true);
  __said.length=0;ЖМИ("ArrowRight");r.первое=__said.slice(-1)[0];
  ЖМИ("ArrowRight");r.второе=__said.slice(-1)[0];ЖМИ("ArrowLeft");r.снова=__said.slice(-1)[0];
  for(let k=0;k<8&&!(INV.kbAct&&INV.kbAct.id==="drink");k++)ЖМИ("ArrowRight");
  r.выбрано=INV.kbAct&&INV.kbAct.id;
  const hp=G.hp;ЖМИ("Enter");r.выполнено=G.hp>hp||G.items.indexOf("Зелье здоровья")<0;
  while(activeLayer())closeTopUI();
  return r;});
 check('3. Windows: в разделе инвентаря стрелки вправо и влево — действия с вещью, Enter выполняет',
  /^[А-ЯЁ]/.test(инв.первое||"")&&/1 из \d+/.test(инв.первое)&&/2 из \d+/.test(инв.второе||"")&&инв.снова===инв.первое&&инв.выбрано==="drink"&&инв.выполнено,инв);

 /* ── 4–5 ── */
 const слоты=await page.evaluate(()=>{const r={};
  while(activeLayer())closeTopUI();
  G.cbSlots=null;G.cbSlotsInit=0;G.inv={"Зелье здоровья":2};G.items=["Противоядие"];G.potions=[{id:"mana",q:1,стаб:0.95,день:G.day||1,срок:20}];
  G.charged=[];const c=CARRIERS.find(x=>x.заряды&&x.id==="scroll")||CARRIERS.find(x=>x.заряды);
  G.charged.push({вид:c.id,чара:0,заряд:2,макс:2});
  /* вне боя стрелка — шаг, а не слот */
  const n0=[];const nav0=window.qsKeyNav;
  G.inCombat=false;G.combat=null;G.weaponDrawn=false;window.qsKeyNav=d=>{n0.push(d);return true;};const mv0=window.move;window.move=()=>true;
  ЖМИ("ArrowUp");r.внеБоя=n0.length;window.qsKeyNav=nav0;window.move=mv0;
  /* бой */
  G.inCombat=true;G.combat={m:{n:"волк",hp:10},hp:10};QSK.cat=0;QSK.i=0;
  r.зелья=qsKList("potion").map(cbSlotName);r.свитки=qsKList("scroll").map(cbSlotName);r.прочее=qsKList("other").map(cbSlotName);
  __said.length=0;ЖМИ("ArrowRight");r.вправо=__said.slice(-1)[0];
  ЖМИ("ArrowDown");r.вниз=__said.slice(-1)[0];r.раздел=QSK.cat;
  ЖМИ("ArrowUp");r.вверх=QSK.cat;
  /* применить: правый Ctrl */
  QSK.cat=0;QSK.i=0;const was=[];const d0=window.cbDrink;window.cbDrink=x=>{was.push(cbSlotName(x));return true;};
  const st0=Speech.stop.bind(Speech);let стоп=0;Speech.stop=function(){стоп++;return st0();};
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Control",code:"ControlRight",bubbles:true,cancelable:true}));
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Control",code:"ControlLeft",bubbles:true,cancelable:true}));
  r.применено=was.slice();r.левыйСтоп=стоп;
  settings.qsCtrl="ControlLeft";was.length=0;
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Control",code:"ControlLeft",bubbles:true,cancelable:true}));r.левый=was.length;
  settings.qsCtrl="ControlRight";window.cbDrink=d0;Speech.stop=st0;
  r.настройка=!!document.getElementById("setQsCtrl")&&document.getElementById("setQsCtrl").options.length===3;
  /* поверх окна стрелки работают как обычно */
  const n1=[];window.qsKeyNav=d=>{n1.push(d);return true;};CMD.settings();ЖМИ("ArrowDown");r.поверхОкна=n1.length;window.qsKeyNav=nav0;
  while(activeLayer())closeTopUI();
  G.inCombat=false;G.combat=null;
  return r;});
 check('4. в бою стрелки — быстрые слоты по разделам «Зелья», «Свитки», «Прочее»; правый Ctrl применяет, левый обрывает речь; Ctrl выбирается в настройках',
  слоты.зелья.includes("Зелье здоровья")&&слоты.зелья.some(x=>/ману/.test(x))&&слоты.зелья.includes("Противоядие")&&слоты.свитки.length>=1
  &&/из \d+/.test(слоты.вправо||"")&&/^Свитки/.test(слоты.вниз||"")&&слоты.раздел===1&&слоты.вверх===0
  &&слоты.применено.length===1&&слоты.левыйСтоп>=1&&слоты.левый===1&&слоты.настройка,слоты);
 check('5. вне боя и поверх окна стрелки быстрые слоты не трогают',слоты.внеБоя===0&&слоты.поверхОкна===0,слоты);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
