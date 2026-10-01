/* ════════════════════════════════════════════════════════════════════════
   НАБОР 236: ТИХИЙ БОЙ, ЖЕСТ ЗДОРОВЬЯ И СЛОТЫ БЫСТРОГО ДОСТУПА

   1. Фраз «Взмах вправо…», «Взмах влево…» и «Взмах … не достаёт» нет:
      взмах слышно звуком клинка.
   2. В бою игра молчит (флажок «Озвучка во время боя» снят по умолчанию):
      сведения боя не звучат, а слова твари звучат; то, о чём игрок спросил
      сам, звучит; включённый флажок возвращает слова.
   3. Одно касание двумя пальцами в бою с вынутым оружием — только здоровье;
      с убранным оружием — сбор, как всегда; два пальца влево с убранным
      оружием — выпить зелье.
   4. С вынутым оружием двенадцать свайпов — двенадцать слотов: 2←,2↑,2→,2↓,
      3←,3↑,3→,3↓,4←,4↑,4→,4↓; в первом — зелье здоровья; с убранным оружием
      три пальца вверх — обычное дело.
   5. В бою с открытой панелью магии слоты 1–8 — на касаниях: 2×2, 2×3, 3×1,
      3×2, 3×3, 4×1, 4×2, 4×3; касание разбирается, когда счёт кончился;
      одно касание двумя пальцами — сбор.
   6. «В слот быстрого доступа» ставит вещь в слот, повтор — в следующий;
      свиток и жезл тоже ставятся; пустой слот называется; зелье из слота лечит.
   7. На компьютере слоты — Alt+1 … Alt+9, Alt+0, Alt+минус, Alt+равно;
      в руководстве описаны.
   8. Вне боя «одним пальцем вниз, затем вверх» и Q пьют зелье.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{const m=o(t,x);window.__said.push({t:String(t),st:m&&m.state});return m;};
  window.__бой=()=>{while(activeLayer())closeTopUI();if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;G.hp=50;G.hpMax=900;G.place=null;G.ship=null;settings.combatPace="live";
   startCombat({x:G.x,y:G.y,monster:{id:"orc",n:"Орк",lvl:3,hp:500,dmg:9,xp:5,gold:5}});const a=G.combat.arena;a.fx=a.px+2;a.fy=a.py;a.readyAt=Date.now()+600000;return a;};
  window.__чисто=()=>{if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;G.weaponDrawn=false;};});

 /* ── 1 ── */
 const взмах=await page.evaluate(()=>{__чисто();const a=__бой();G.weaponDrawn=true;__said.length=0;
  weaponSwing("E","key");a.fx=a.px+1;a.swingAt=0;weaponSwing("E");weaponSwing("W");
  const r=__said.map(x=>x.t);__чисто();return {сказано:r,вКоде:/narrate\(`Взмах/.test(String(weaponSwing))};});
 check('1. фраз «Взмах вправо», «Взмах влево», «Взмах … не достаёт» нет',!взмах.сказано.some(t=>/Взмах/.test(t))&&!взмах.вКоде,взмах);

 /* ── 2 ── */
 const тихо=await page.evaluate(()=>{__чисто();const r={флажок:settings.cbSpeech,галочка:document.getElementById("setCbSpeech")&&document.getElementById("setCbSpeech").checked};
  __бой();__said.length=0;
  narrate("Орк: в 2 шагах.",{cat:"combat"});narrate("Замах!",{pri:1,cat:"combat"});
  narrate("Орк: «Я тебя съем!»",{cat:"combat",pri:2,речь:true});
  narrate("Здоровье 50 из 900.",{interrupt:true,user:true,cat:"combat"});
  r.итог=__said.map(x=>[x.t,x.st]);
  settings.cbSpeech=1;__said.length=0;narrate("Орк: в 2 шагах.",{cat:"combat"});r.сФлажком=__said.map(x=>x.st);settings.cbSpeech=0;
  __чисто();return r;});
 const ст=t=>(тихо.итог.find(x=>x[0]===t)||[])[1];
 check('2. бой тихий: сведения боя молчат, слова твари и спрошенное звучат; флажок возвращает слова',
  тихо.флажок===0&&тихо.галочка===false&&ст("Орк: в 2 шагах.")==="DROPPED"&&ст("Замах!")==="DROPPED"&&ст("Орк: «Я тебя съем!»")!=="DROPPED"&&ст("Здоровье 50 из 900.")!=="DROPPED"&&тихо.сФлажком[0]!=="DROPPED",тихо);

 /* ── 3–4 ── */
 const жесты=await page.evaluate(()=>{__чисто();__бой();const r={};
  const звали=[];const f0=window.fight;window.fight=k=>{звали.push(k);};
  G.weaponDrawn=true;__said.length=0;r.hp=gestCombatRun(2,"tap",null);r.hpСказано=__said.map(x=>x.t);
  G.weaponDrawn=false;r.сбор=gestCombatRun(2,"tap",null);
  звали.length=0;r.зелье=gestCombatRun(2,"swipe","W");r.зельеЗвали=звали.slice();
  r.безОружия3=gestCombatRun(3,"swipe","N");
  G.weaponDrawn=true;r.фигуры=CB_SLOT_SHAPES.join();r.ids=CB_SLOT_SHAPES.map(s=>gestCombatId(s));
  G.inv=G.inv||{};G.inv["Зелье здоровья"]=1;
  звали.length=0;r.слот1=gestCombatRun(2,"swipe","W");r.слот1Звали=звали.slice();
  window.fight=f0;__чисто();return r;});
 check('3. одно касание двумя пальцами с оружием — только здоровье, без оружия — сбор; два пальца влево без оружия — выпить зелье',
  жесты.hp===true&&жесты.hpСказано.some(t=>/^Здоровье \d+ из \d+\.$/.test(t))&&жесты.сбор===false&&жесты.зелье===true&&жесты.зельеЗвали.join()==="potion",жесты);
 check('4. с вынутым оружием 2←,2↑,2→,2↓,3←,3↑,3→,3↓,4←,4↑,4→,4↓ — слоты 1–12; в первом зелье здоровья; без оружия три пальца вверх — обычное дело',
  жесты.фигуры==="2swipeW,2swipeN,2swipeE,2swipeS,3swipeW,3swipeN,3swipeE,3swipeS,4swipeW,4swipeN,4swipeE,4swipeS"
  &&жесты.ids.join()===Array.from({length:12},(_,i)=>"slot"+(i+1)).join()&&жесты.слот1===true&&жесты.слот1Звали.join()==="potion"&&жесты.безОружия3===false,жесты);

 /* ── 5 ── */
 const магия=await page.evaluate(async()=>{__чисто();__бой();G.weaponDrawn=false;const r={};
  safeOpenMagicPanel();r.режим=qsMagicMode();
  const взято=[];const u0=window.cbSlotUse;window.cbSlotUse=i=>{взято.push(i+1);return true;};
  const g0=window.handleTwoFingerTap;let сбор=0;window.handleTwoFingerTap=()=>{сбор++;};
  for(const [f,n] of [[2,2],[2,3],[3,1],[3,2],[3,3],[4,1],[4,2],[4,3]])qsTapResolve(f,n);
  r.слоты=взято.slice();взято.length=0;
  qsTapResolve(2,1);r.сбор=сбор;
  qsMagicTap(3);qsMagicTap(3);r.доСрока=взято.length;await new Promise(z=>setTimeout(z,750));r.послеСрока=взято.slice();
  взято.length=0;qsMagicTap(4);qsMagicTap(4);qsMagicTap(4);r.тройное=взято.slice();
  window.cbSlotUse=u0;window.handleTwoFingerTap=g0;
  r.тексты=QS_MAGIC_SHAPES.map((x,i)=>cbSlotShapeMagic(i));
  closeMagicPanel();__чисто();r.вне=qsMagicMode();return r;});
 check('5. с панелью магии в бою слоты 1–8 на касаниях 2×2,2×3,3×1,3×2,3×3,4×1,4×2,4×3; счёт ждёт конца; одно касание двумя — сбор',
  магия.режим===true&&магия.слоты.join()==="1,2,3,4,5,6,7,8"&&магия.сбор===1&&магия.доСрока===0&&магия.послеСрока.join()==="4"&&магия.тройное.join()==="8"&&магия.вне===false,магия);

 /* ── 6 ── */
 const слоты=await page.evaluate(()=>{__чисто();G.cbSlots=null;G.cbSlotsInit=0;const r={};
  r.первый=cbSlotName(cbSlots()[0]);r.всего=cbSlots().length;
  r.пут1=cbSlotPut({kind:"item",name:"Противоядие"});r.где1=cbSlots().findIndex(x=>x&&x.name==="Противоядие");
  r.пут2=cbSlotPut({kind:"item",name:"Противоядие"});r.где2=cbSlots().findIndex(x=>x&&x.name==="Противоядие");
  __бой();G.weaponDrawn=true;__said.length=0;cbSlotUse(10);r.пустой=__said.map(x=>x.t);
  G.items=(G.items||[]).concat(["Противоядие"]);G.hp=50;const hp0=G.hp;cbSlotUse(r.где2);r.лечит=G.hp>hp0;r.осталось=cbSlotCount({kind:"item",name:"Противоядие"});
  r.действие=!!ITEM_ACTIONS.find(a=>a.id==="cbslot"&&a.n==="В слот быстрого доступа"&&a.cats.includes("scroll"));
  __чисто();return r;});
 check('6. «В слот быстрого доступа» ставит вещь в слот, повтор — в следующий; пустой слот называется; вещь из слота действует',
  /здоровья/i.test(слоты.первый)&&слоты.всего===12&&слоты.где1===1&&слоты.где2===2&&/слоте быстрого доступа 2/.test(слоты.пут1)&&слоты.пустой.some(t=>/Слот 11 пуст/.test(t))&&слоты.лечит&&слоты.осталось===0&&слоты.действие,слоты);

 /* ── 7 ── */
 const клав=await page.evaluate(()=>({слоты:KB_ACTIONS.filter(a=>/^c_slot\d+$/.test(a.id)).map(a=>keyCombosOf(a.id).join()),
  q:keyCombosOf("potion").join(),
  глава:/Alt\+1, Alt\+2, Alt\+3, Alt\+4, Alt\+5, Alt\+6, Alt\+7, Alt\+8, Alt\+9, Alt\+0/.test(GUIDE.map(g=>g.body.join(" ")).join(" "))&&/СЛОТЫ БЫСТРОГО ДОСТУПА/.test(GUIDE.map(g=>g.body.join(" ")).join(" "))}));
 check('7. на компьютере слоты — Alt+1 … Alt+9, Alt+0, Alt+минус, Alt+равно; Q — зелье; в руководстве описаны',
  клав.слоты.join()==="Alt+Digit1,Alt+Digit2,Alt+Digit3,Alt+Digit4,Alt+Digit5,Alt+Digit6,Alt+Digit7,Alt+Digit8,Alt+Digit9,Alt+Digit0,Alt+Minus,Alt+Equal"&&клав.q==="KeyQ"&&клав.глава,клав);

 /* ── 8 ── */
 const вне=await page.evaluate(()=>{__чисто();const r={};G.cbSlots=null;G.cbSlotsInit=0;
  G.inv=G.inv||{};G.inv["Зелье здоровья"]=2;G.items=(G.items||[]).filter(x=>x!=="Зелье здоровья");G.hpMax=100;G.hp=40;
  r.фигура=gestActionId("cornerSN");r.жест=gestRun(1,"corner","SN");r.hp1=G.hp;r.ост1=G.inv["Зелье здоровья"];
  G.hp=40;r.q=KB_ACTIONS.find(a=>a.id==="potion").run();r.hp2=G.hp;r.ост2=Number(G.inv["Зелье здоровья"])||0;
  __said.length=0;KB_ACTIONS.find(a=>a.id==="potion").run();r.нет=__said.map(x=>x.t);
  return r;});
 check('8. вне боя «одним пальцем вниз, затем вверх» и Q пьют зелье здоровья; без зелий — понятный ответ',
  вне.фигура==="potion"&&вне.жест===true&&вне.hp1===55&&вне.ост1===1&&вне.q===true&&вне.hp2===55&&вне.ост2===0&&вне.нет.some(t=>/Зелий при себе нет|Зелья здоровья при себе нет/.test(t)),вне);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
