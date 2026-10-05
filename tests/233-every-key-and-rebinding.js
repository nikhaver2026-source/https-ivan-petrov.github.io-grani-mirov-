/* ════════════════════════════════════════════════════════════════════════
   НАБОР 233: КАЖДАЯ КЛАВИША ДЕЛАЕТ СВОЁ, И ПЕРЕНАЗНАЧЕНИЕ РАБОТАЕТ

   Игрок на компьютере проверял клавиши руками и находил, что одна делает
   не то. Здесь проверяются все действия таблицы клавиш разом и то, как
   их переназначают.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Каждое действие таблицы (кроме ходьбы) по своей клавише по умолчанию
      вызывает именно себя: мирные — на поле, боевые — в бою, «всюду» —
      и в открытом окне. Ни одна клавиша не зовёт чужое действие.
   2. Ходьба: каждая стрелка и W, A, S, D — шаг в свою сторону.
   3. Одна клавиша действия со всеми объектами — E (запасная — Enter);
      F — только сбор ресурса. В бою F — удар чарами, пробел — удар оружием.
   4. Переназначение из настроек: пункт клавиши ждёт сочетания, новое
      сочетание работает, старое молчит; Esc отменяет ожидание.
   5. Сочетание, отданное другому действию, снимается с прежнего; мирные и
      боевые клавиши друг у друга не отнимают. Esc назначить нельзя.
   6. Назначения переживают перезапуск игры; «по умолчанию» возвращает всё.
   7. Список в настройках показывает каждое действие и его клавиши.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const старт=async()=>{await page.goto(process.argv[2]);await page.waitForTimeout(800);
  await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
   /* Нажатие как от клавиатуры: сочетание «Ctrl+Alt+Shift+код» разбирается на событие. */
   window.ЖМИ=(combo,key)=>{const ч=combo.split("+");const code=ч.pop();
    const e=new KeyboardEvent("keydown",{code,key:key||(code==="Space"?" ":code.replace(/^Key|^Digit/,"").toLowerCase()),
     ctrlKey:ч.includes("Ctrl"),altKey:ч.includes("Alt"),shiftKey:ч.includes("Shift"),bubbles:true,cancelable:true});
    document.dispatchEvent(e);return e.defaultPrevented;};
   window.ЧИСТО=()=>{while(activeLayer())closeTopUI();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
    G.inCombat=false;G.combat=null;G.loot=null;G.ship=null;KeyCapture.id=null;};});};
 await старт();

 /* ── 1. каждое действие — своей клавишей ── */
 const таблица=await page.evaluate(()=>{
  const звали=[];const было={};
  KB_ACTIONS.forEach(a=>{if(a.run){было[a.id]=a.run;a.run=()=>{звали.push(a.id);return true;};}});
  const плохие=[],проверено=[];
  for(const a of KB_ACTIONS){
   if(a.ctx==="move"||!a.run)continue;
   for(const combo of keyCombosOf(a.id)){
    if(combo==="Escape")continue;
    const положения=a.ctx==="combat"?["combat"]:a.ctx==="any"?["field","window"]:["field"];
    for(const пол of положения){
     ЧИСТО();
     if(пол==="combat"){G.inCombat=true;G.combat={m:{n:"Проба",hp:10},hp:10};}
     if(пол==="window")openModal("modal-quests");
     звали.length=0;ЖМИ(combo);
     проверено.push(a.id+"@"+пол);
     if(звали.length!==1||звали[0]!==a.id)плохие.push({действие:a.id,клавиша:combo,где:пол,позвали:звали.slice()});}}}
  KB_ACTIONS.forEach(a=>{if(было[a.id])a.run=было[a.id];});
  ЧИСТО();
  return {проверено:проверено.length,плохие};});
 check('1. каждое действие таблицы клавиш вызывается своей клавишей и только им — на поле, в бою и (для «всюду») в окне',
  таблица.проверено>=60&&!таблица.плохие.length,таблица);

 /* ── 2. ходьба ── */
 const ходьба=await page.evaluate(()=>{
  ЧИСТО();const шаги=[];const m0=window.move;window.move=function(d){шаги.push(d);};
  const k0=window.keyStep;
  const пары=[["ArrowUp","N"],["ArrowDown","S"],["ArrowLeft","W"],["ArrowRight","E"],["KeyW","N"],["KeyS","S"],["KeyA","W"],["KeyD","E"]];
  const плохие=[];
  for(const [code,d] of пары){шаги.length=0;KeyWalk.last=0;KeyWalk.t=0;ЖМИ(code);
   if(шаги[0]!==d)плохие.push({code,ждали:d,было:шаги.slice()});
   document.dispatchEvent(new KeyboardEvent("keyup",{code,key:code,bubbles:true}));}
  window.move=m0;return {плохие};});
 check('2. стрелки и W, A, S, D — шаг каждая в свою сторону',!ходьба.плохие.length,ходьба);

 /* ── 3. E — действие, F — сбор; в бою F — чары, пробел — оружие ── */
 const главные=await page.evaluate(()=>{
  ЧИСТО();const r={};
  const fi0=window.fieldInteract;let fi=0;window.fieldInteract=function(){fi++;return true;};
  const g=GEST_ACTION_BY_ID.gather,gd=g.делать;let gs=0;g.делать=()=>{gs++;return true;};
  ЖМИ("KeyE","e");ЖМИ("Enter","Enter");ЖМИ("KeyE","у");r.действие=fi;
  fi=0;gs=0;ЖМИ("KeyF","f");ЖМИ("KeyF","а");r.сборF=gs;r.действиеF=fi;
  window.fieldInteract=fi0;g.делать=gd;
  const f0=window.fight;const бой=[];window.fight=k=>{бой.push(k);};
  G.inCombat=true;G.combat={m:{n:"Проба",hp:10},hp:10};
  ЖМИ("KeyF","f");ЖМИ("Space"," ");ЖМИ("Backspace","Backspace");r.бой=бой.slice();
  window.fight=f0;ЧИСТО();
  r.F=keyCombosOf("gather");r.E=keyCombosOf("interact");
  return r;});
 check('3. E, Enter (и «у» в русской раскладке) — действие со всем; F — только сбор; в бою F — чары, пробел — оружие, Backspace — бегство',
  главные.действие===3&&главные.сборF===2&&главные.действиеF===0&&главные.бой.join(",")==="magic,atk,flee"
  &&главные.E.includes("KeyE")&&главные.E.includes("Enter")&&главные.F.join()==="KeyF",главные);

 /* ── 4. переназначение из настроек ── */
 const пере=await page.evaluate(()=>{
  ЧИСТО();keyReset();const r={};
  safeFn(()=>renderKeyBind());
  const кнопка=document.querySelector('[data-cmd="keybind:interact"]');r.кнопка=!!кнопка;
  safeFn(()=>CMD.keybind("interact"));r.ждёт=KeyCapture.id==="interact";
  ЖМИ("KeyY","y");r.назначено=keyCombosOf("interact").join();r.ждётПосле=KeyCapture.id;
  ЧИСТО();
  const fi0=window.fieldInteract;let fi=0;window.fieldInteract=function(){fi++;return true;};
  ЖМИ("KeyY","y");r.новая=fi;fi=0;ЖМИ("KeyE","e");r.стараяE=fi;
  window.fieldInteract=fi0;
  /* Esc отменяет ожидание */
  CMD.keybind("gather");ЖМИ("Escape","Escape");r.отмена=KeyCapture.id===null&&keyCombosOf("gather").join()==="KeyF";
  return r;});
 check('4. переназначение: пункт ждёт сочетания, новое сочетание делает действие, старое молчит; Esc отменяет ожидание',
  пере.кнопка&&пере.ждёт&&пере.назначено==="KeyY"&&пере.ждётПосле===null&&пере.новая===1&&пере.стараяE===0&&пере.отмена,пере);

 /* ── 5. конфликты ── */
 const спор=await page.evaluate(()=>{
  ЧИСТО();keyReset();const r={};
  keyBind("gather","KeyE");r.уДействия=keyCombosOf("interact").join();r.уСбора=keyCombosOf("gather").join();
  keyReset();keyBind("c_cast","KeyE");r.мирнаяОсталась=keyCombosOf("interact").includes("KeyE");r.боевая=keyCombosOf("c_cast").join();
  r.esc=keyBind("interact","Escape")===false&&!keyCombosOf("interact").includes("Escape");
  keyReset();
  keyBind("interact","KeyY");keyBind("gather","KeyY");r.безКлавиши=keyCombosOf("interact").length===0&&/не назначено/.test(keyLine(KB_BY_ID.interact));
  keyReset();return r;});
 check('5. отданное другому сочетание снимается с прежнего; мирные и боевые не отнимают друг у друга; Esc не назначается; без клавиши — «не назначено»',
  спор.уДействия==="Enter"&&спор.уСбора==="KeyE"&&спор.мирнаяОсталась&&спор.боевая==="KeyE"&&спор.esc&&спор.безКлавиши,спор);

 /* ── 6. назначения переживают перезапуск; сброс ── */
 await page.evaluate(()=>{ЧИСТО();keyReset();keyBind("interact","KeyU");keyBind("hp","Ctrl+KeyM");safeFn(()=>saveSettings());});
 await старт();
 const после=await page.evaluate(()=>{
  ЧИСТО();const r={interact:keyCombosOf("interact").join(),map:keyCombosOf("hp").join()};
  const fi0=window.fieldInteract;let fi=0;window.fieldInteract=function(){fi++;return true;};
  ЖМИ("KeyU","u");r.работает=fi;window.fieldInteract=fi0;
  keyReset();r.сброс=keyCombosOf("interact").join()===KB_BY_ID.interact.def.join()&&keyCombosOf("hp").join()===KB_BY_ID.hp.def.join();
  return r;});
 check('6. назначения переживают перезапуск игры, новая клавиша работает; «по умолчанию» возвращает всё',
  после.interact==="KeyU"&&после.map==="Ctrl+KeyM"&&после.работает===1&&после.сброс,после);

 /* ── 7. список в настройках ── */
 const список=await page.evaluate(()=>{
  safeFn(()=>renderKeyBind());
  const кн=[...document.querySelectorAll('#keyRow [data-cmd^="keybind:"]')];
  const ids=кн.map(b=>b.dataset.cmd.slice(8));
  return {кнопок:кн.length,действий:KB_ACTIONS.length,все:KB_ACTIONS.every(a=>ids.includes(a.id)),
   e:(кн.find(b=>b.dataset.cmd==="keybind:interact")||{}).textContent,f:(кн.find(b=>b.dataset.cmd==="keybind:gather")||{}).textContent};});
 check('7. в настройках у каждого действия свой пункт с его клавишами',
  список.кнопок===список.действий&&список.все&&/E/.test(список.e||"")&&/Enter/.test(список.e||"")&&/собрать ресурс/.test(список.f||"")&&/F/.test(список.f||""),список);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
