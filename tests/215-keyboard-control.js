/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 215: 4.7 — ИГРА НА КОМПЬЮТЕРЕ: ВСЁ С КЛАВИАТУРЫ, БЕЗ МЫШИ

   Просьба игрока: приложение для компьютера, где жесты заменены клавишами —
   и отдельными, и сочетаниями, как в привычных играх: стрелки — ходьба,
   Shift со стрелкой — бег, E — действие с объектом (как двойное касание),
   Alt+E — инвентарь, Tab — карта, по карте — стрелками.

   1. У каждого значимого действия жестов есть клавиша; одна клавиша не
      делает двух дел в одном положении (на поле и в бою — отдельно).
   2. Стрелка — шаг, Shift со стрелкой — бег, пока клавиша нажата.
   3. E и Enter — действие с объектом; русская раскладка (буква «у» на месте E)
      работает так же.
   4. I и Alt+E открывают и закрывают инвентарь; Tab — карту, стрелки водят
      по клеткам карты от центра, Tab закрывает.
   5. В окне: стрелки — пункты, Enter — выбрать, Backspace и Esc — назад.
   6. На поле Esc — меню игры; в бою пробел — удар, Q — зелье, Backspace — бег.
   7. Клавишу можно переназначить, и умолчание возвращается.
   8. В приложении для компьютера окно объявлено чтецу экрана приложением.
   9. «Выход» в меню действий: игра сохраняется и приложение закрывается.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const n0=window.narrate;window.narrate=function(t,o){__said.push(String(t));return n0.apply(this,arguments);};});
 const жми=async(code,key,mods)=>page.evaluate(([code,key,mods])=>{
  const e=new KeyboardEvent("keydown",Object.assign({code,key,bubbles:true,cancelable:true},mods||{}));document.dispatchEvent(e);return e.defaultPrevented;},[code,key,mods]);

 /* ── 1. ── */
 const таблица=await page.evaluate(()=>{
  const значимые=GEST_ACTIONS.filter(a=>!/^(none|close|sec)/.test(a.id)).map(a=>a.id);
  const безКлавиши=значимые.filter(id=>!KB_ACTIONS.some(k=>(k.run&&k.id===id)||(id==="interact"&&k.id==="interact")));
  const споры=[];
  ["field","combat"].forEach(pos=>{const по={};KB_ACTIONS.forEach(a=>{if(pos==="field"&&(a.ctx==="combat"||a.ctx==="weapon"))return;if(pos==="combat"&&a.ctx!=="combat")return;
   keyCombosOf(a.id).forEach(c=>{if(по[c])споры.push(pos+": "+c+" "+по[c]+"/"+a.id);else по[c]=a.id;});});});
  return {безКлавиши,споры,всего:KB_ACTIONS.length,помощь:keyHelpText().length};});
 check('1. у каждого значимого действия есть клавиша; споров нет',!таблица.безКлавиши.length&&!таблица.споры.length&&таблица.помощь>500,таблица);

 /* ── 2. ── */
 const шаг=await page.evaluate(()=>{window.__m=[];const m0=window.move;window.move=function(d){__m.push(d);};window.__m0=m0;return true;});
 await жми("ArrowUp","ArrowUp");
 await жми("ArrowRight","ArrowRight",{shiftKey:true});
 const бег=await page.evaluate(()=>({шаги:__m.slice(),бег:runState.active,dir:runState.dir}));
 await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent("keyup",{code:"ArrowRight",key:"ArrowRight",bubbles:true})));
 const стоп=await page.evaluate(()=>({бег:runState.active}));
 check('2. стрелка — шаг, Shift со стрелкой — бег, отпустил — стоп',бег.шаги[0]==="N"&&бег.бег===true&&бег.dir==="E"&&стоп.бег===false,{бег,стоп});

 /* ── 3. ── */
 await page.evaluate(()=>{window.__fi=0;window.fieldInteract=function(){__fi++;};});
 await жми("KeyE","e");await жми("Enter","Enter");await жми("KeyE","у");
 const действие=await page.evaluate(()=>__fi);
 check('3. E, Enter и «у» в русской раскладке — действие с объектом',действие===3,действие);

 /* ── 4. ── */
 const окна={};
 await жми("KeyI","i");окна.инвОткрыт=await page.evaluate(()=>!document.getElementById("modal-inventory").hidden);
 await жми("KeyI","i");окна.инвЗакрыт=await page.evaluate(()=>document.getElementById("modal-inventory").hidden);
 await жми("KeyE","e",{altKey:true});окна.альтЕ=await page.evaluate(()=>!document.getElementById("modal-inventory").hidden);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 await жми("Tab","Tab");окна.карта=await page.evaluate(()=>!document.getElementById("modal-map").hidden);
 await жми("ArrowUp","ArrowUp");await жми("ArrowLeft","ArrowLeft");
 окна.клетка=await page.evaluate(()=>({i:MapKeys.i,говорит:uiCursor&&uiCursor.dataset.speak}));
 await жми("Tab","Tab");окна.картаЗакрыта=await page.evaluate(()=>document.getElementById("modal-map").hidden);
 check('4. I и Alt+E — инвентарь, Tab — карта, стрелки по клеткам, Tab закрывает',
  окна.инвОткрыт&&окна.инвЗакрыт&&окна.альтЕ&&окна.карта&&окна.клетка.i===16&&/2 шага|север|впереди/.test(окна.клетка.говорит||"")&&окна.картаЗакрыта,окна);

 /* ── 5. ── */
 const пункты=await page.evaluate(()=>{while(activeLayer())closeTopUI();CMD.settings();return {меню:!!document.querySelector("#setMenu [data-punkt]")};});
 await жми("ArrowDown","ArrowDown");
 const курс1=await page.evaluate(()=>uiCursor&&uiCursor.dataset.punkt);
 await жми("Enter","Enter");
 const вПункте=await page.evaluate(()=>SETG.open);
 await жми("Backspace","Backspace");
 const назад=await page.evaluate(()=>({open:SETG.open,модал:!document.getElementById("modal-settings").hidden}));
 check('5. в окне стрелки — пункты, Enter — выбрать, Backspace — назад',пункты.меню&&!!курс1&&вПункте===курс1&&назад.open===null&&назад.модал,{курс1,вПункте,назад});

 /* ── 6. ── */
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 await жми("Escape","Escape");
 const меню=await page.evaluate(()=>!document.getElementById("actionMenu").hidden);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();window.__f=[];window.fight=function(a){__f.push(a);};G.inCombat=true;G.combat={m:{n:"волк",hp:10},hp:10};});
 await жми("Space"," ");await жми("KeyQ","q");await жми("Backspace","Backspace");
 const бой=await page.evaluate(()=>{const r=__f.slice();G.inCombat=false;G.combat=null;return r;});
 check('6. на поле Esc — меню игры; в бою пробел — удар, Q — зелье, Backspace — бежать',меню&&JSON.stringify(бой)===JSON.stringify(["atk","potion","flee"]),{меню,бой});

 /* ── 7. ── */
 const назначение=await page.evaluate(()=>{keyCaptureStart("journal");return KeyCapture.id;});
 await жми("KeyZ","z");
 const после=await page.evaluate(()=>({z:keyCombosOf("journal"),j:(keyActionFor("KeyJ","field")||{}).id||null}));
 await page.evaluate(()=>keyReset());
 const сброс=await page.evaluate(()=>keyCombosOf("journal"));
 check('7. клавишу можно переназначить; умолчание возвращается',назначение==="journal"&&после.z[0]==="KeyZ"&&после.j===null&&сброс[0]==="KeyJ",{после,сброс});

 /* ── 8. ── */
 const стол=await (await browser.newContext()).newPage();
 await стол.addInitScript(()=>{window.graniDesktop=true;});
 await стол.goto(process.argv[2]);await стол.waitForTimeout(600);
 const роль=await стол.evaluate(()=>({role:document.body.getAttribute("role"),пк:isDesktopApp()}));
 check('8. в приложении для компьютера окно — приложение для чтеца экрана',роль.role==="application"&&роль.пк,роль);

 /* ── 9. выход ── */
 const выход=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();openActionMenu();
  const кн=[...document.querySelectorAll("#amMenu > button")].map(b=>b.dataset.cmd);
  closeActionMenu();
  window.__q=0;window.__a=0;window.__saved=0;const s0=window.saveGame;window.saveGame=function(){__saved++;return true;};
  window.graniDesktop={quit(){__q++;}};CMD.am("exit");await new Promise(z=>setTimeout(z,2100));
  delete window.graniDesktop;window.GraniTTS=Object.assign(window.GraniTTS||{},{exitApp(){__a++;}});
  document.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyQ",key:"q",ctrlKey:true,bubbles:true}));await new Promise(z=>setTimeout(z,2100));
  delete window.GraniTTS.exitApp;window.saveGame=s0;
  return {кн:кн.slice(-3),пк:__q,андроид:__a,сохранено:__saved,титул:!!document.querySelector('#screen-title [data-cmd="quit"]')};});
 check('9. «Выход» в меню действий и в главном меню: игра сохраняется и приложение закрывается (Ctrl+Q — то же)',
  выход.кн.join()==="am:whatsnew,am:exit,am:close"&&выход.пк===1&&выход.андроид===1&&выход.сохранено>=2&&выход.титул,выход);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
