/* ════════════════════════════════════════════════════════════════════════
   ЖЕЛЕЗНОЕ ПРАВИЛО: ОДНО КАСАНИЕ НИЧЕГО НЕ ВЫПОЛНЯЕТ

   Незрячий игрок читает экран пальцем. Если хоть одно одиночное касание
   что-то делает, читать экран становится опасно: палец, поставленный «чтобы
   послушать», покупает, входит, тратит ману или спускается в подземелье.

   Правило одно на всю игру:
     одно касание одним пальцем    — называет пункт под пальцем, и только;
     двойное касание одним пальцем — выполняет названное;
     палец, лежащий на месте,      — называет и при отрыве ничего не делает;
     свайп                         — листает пункты по одному.

   Набор ведёт живые касания через CDP по каждому пункту каждого окна и
   сверяет состояние игры до и после: ни одна команда не выполнилась, ни один
   элемент не активировался, ни одно поле состояния не изменилось.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 /* Слежка: что игра сказала, что активировала и какие команды выполнила. */
 await page.evaluate(()=>{
  window.__said=[];window.__acts=[];window.__cmds=[];
  Speech.say=t=>{window.__said.push(String(t));};
  const origAct=activateElement;
  window.activateElement=el=>{window.__acts.push(el&&(el.dataset.cmd||(el.textContent||"").trim().slice(0,20)));
   return origAct(el);};
  Object.keys(CMD).forEach(k=>{const f=CMD[k];CMD[k]=function(...a){window.__cmds.push(k);return f.apply(this,a);};});
 });
 const tap=async(x,y,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(140);};
 const swipe=async(fx,fy,tx,ty,steps=6,stepMs=14)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  await page.waitForTimeout(stepMs);
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(fx+(tx-fx)*i/steps),y:fy,id:0}]});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(150);};
 const fwd=()=>swipe(120,430,330,430);
 /* Слепок всего, что игрок мог бы нечаянно изменить. */
 const snap=()=>page.evaluate(()=>JSON.stringify({x:G.x,y:G.y,hp:G.hp,gold:G.gold,mana:G.mana,
  inv:G.inv,gear:G.gear.length,place:G.place&&[G.place.x,G.place.y,G.place.depth],
  quests:(G.quests||[]).length,art:(G.artifacts||[]).length,day:G.day,hour:Math.round(G.hour*10),
  окно:activeLayer()&&activeLayer().id,бой:G.inCombat,корабль:!!G.ship,
  сложность:settings.difficulty,заклинаний:(G.spells||[]).length,слотов:Object.keys(localStorage).length}));
 const clean=()=>page.evaluate(()=>{while(activeLayer())closeTopUI();
  try{closeMagicPanel();closeGuide();}catch(_){}
  const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;
  G.loot=null;G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.weaponDrawn=false;
  G.x=1000;G.y=1000;resetCursor();});

 const WINDOWS=[
  ["меню действий",()=>{toggleActionMenu();}],
  ["карточка жителя",()=>{const n=getNPC(G.x,G.y,0,"Торговец");openNPC(n.key,true);}],
  ["постройка",()=>{const c={x:G.x,y:G.y,structure:{type:"village",name:"Деревня",beacon:"village"},
    terrain:terrainAt(G.x,G.y),empire:empireAt(G.x,G.y)};openBuilding(c);}],
  ["настройки",()=>CMD.settings()],
  ["сохранения",()=>CMD.saves()],
  ["инвентарь",()=>{G.inv={"руда":4};CMD.inv();}],
  ["крафт",()=>CMD.craft()],
  ["панель магии",()=>{G.spells=["Искра"];G.mana=G.manaMax=30;safeOpenMagicPanel();}],
  ["руководство",()=>openGuide()],
  ["глава руководства",()=>{openGuide();showChapter(1);}],
  ["энциклопедия",()=>CMD.encyc()],
  ["народы",()=>CMD.races()],
  ["пантеон",()=>CMD.pantheon()],
  ["бестиарий",()=>CMD.best()],
  ["карта",()=>CMD.map()],
  ["персонаж",()=>CMD.char()],
  ["политика",()=>CMD.politics()],
  ["мир",()=>CMD.world()],
  ["рынки и караваны",()=>CMD.trade()],
  ["журнал",()=>CMD.journal()],
 ];

 const нарушения=[];const немые=[];let касаний=0,окон=0;
 for(const [имя,open] of WINDOWS){
  await clean();
  const ok=await page.evaluate(fn=>{try{(new Function("return ("+fn+")"))()();}catch(e){return "ошибка: "+e.message;}
   return !!activeLayer();},open.toString());
  if(ok!==true){нарушения.push({окно:имя,открылось:ok});continue;}
  окон++;
  const сколько=await page.evaluate(()=>Math.min(6,cursorItems(activeLayer()).length));
  for(let i=0;i<сколько;i++){
   /* Координаты берём непосредственно перед касанием: прокрутка предыдущего
      пункта сдвигает всё остальное. */
   const т=await page.evaluate(k=>{
    const el=cursorItems(activeLayer())[k];if(!el)return null;
    el.scrollIntoView({block:"center"});
    const r=el.getBoundingClientRect();
    if(r.width<4||r.height<4)return null;
    const x=Math.round(r.x+r.width/2),y=Math.round(r.y+r.height/2);
    const под=document.elementFromPoint(x,y);
    if(!под||!(el===под||el.contains(под)||под.contains(el)))return null;
    let имя=(el.dataset&&el.dataset.speak)||el.getAttribute("aria-label")||(el.textContent||"").trim();
    if(!имя)имя=labelTextOf(el);
    return {x,y,что:(el.dataset.cmd||(el.textContent||"").trim().slice(0,18)),
     ждём:(имя||"").replace(/\s+/g," ").trim().slice(0,40)};},i);
   if(!т)continue;
   /* Ждём, пока истечёт окно двойного касания: иначе следующее касание
      окажется вторым и по праву что-нибудь выполнит. */
   await page.waitForTimeout(900);
   const до=await snap();
   await page.evaluate(()=>{window.__acts=[];window.__cmds=[];window.__said=[];});
   await tap(т.x,т.y);
   касаний++;
   const после=await snap();
   const r=await page.evaluate(()=>({акт:window.__acts.slice(),кмд:window.__cmds.slice(),
    сказано:window.__said.slice()}));
   if(до!==после||r.акт.length||r.кмд.length)
    нарушения.push({окно:имя,пункт:т.что,активировано:r.акт,команды:r.кмд,
     изменилось:до!==после});
   /* Пункт должен назвать себя: имя элемента звучит последним. Мир вокруг
      может заговорить сам (стража, событие) — поэтому не «ровно одно
      называние», а «имя пункта прозвучало». */
   else if(!r.сказано.some(t=>t.replace(/\s+/g," ").trim().startsWith(т.ждём.slice(0,20))))
    немые.push({окно:имя,пункт:т.что,ждали:т.ждём,сказано:r.сказано.slice(0,2)});
  }
 }
 check('окна открываются все до одного',
  !нарушения.some(x=>x.открылось!==undefined),нарушения.filter(x=>x.открылось!==undefined));
 check('ни одно одиночное касание ничего не выполняет',
  !нарушения.some(x=>x.открылось===undefined),нарушения.filter(x=>x.открылось===undefined));
 check('каждое одиночное касание называет тот пункт, которого коснулись',
  !немые.length,немые.slice(0,6));
 check('проверено достаточно окон и касаний',окон>=18&&касаний>=80,{окон,касаний});

 /* ── Палец, лежащий на месте: называет и ничего не делает ── */
 await clean();
 const лежит=await page.evaluate(()=>{
  CMD.settings();resetCursor();
  const el=[...cursorItems(activeLayer())].find(x=>x.dataset&&x.dataset.cmd==="setdiff:harsh");
  el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
  settings.difficulty="normal";window.__said=[];window.__acts=[];window.__cmds=[];
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:лежит.x,y:лежит.y,id:0}]});
 await page.waitForTimeout(1500);
 const покаЛежит=await page.evaluate(()=>({сказано:window.__said.length,сложность:settings.difficulty}));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:лежит.x,y:лежит.y,id:0}]});
 await page.waitForTimeout(300);
 const послеОтрыва=await page.evaluate(()=>({сказано:window.__said.length,сложность:settings.difficulty,
  акт:window.__acts.slice(),кмд:window.__cmds.slice(),курсор:uiCursor&&uiCursor.dataset.cmd}));
 check('палец, лежащий на пункте, называет его, пока лежит',
  покаЛежит.сказано>=1,покаЛежит);
 check('отрыв пальца после долгого касания ничего не выполняет и не повторяет имя',
  послеОтрыва.сложность==="normal"&&!послеОтрыва.акт.length&&!послеОтрыва.кмд.length
  &&послеОтрыва.сказано===покаЛежит.сказано&&послеОтрыва.курсор==="setdiff:harsh",
  {пока:покаЛежит,после:послеОтрыва});

 /* ── Двойное касание выполняет — это обязательное условие ── */
 await page.evaluate(()=>{window.__acts=[];window.__cmds=[];});
 await tap(лежит.x,лежит.y);await tap(лежит.x,лежит.y);
 await page.waitForTimeout(300);
 const дубль=await page.evaluate(()=>({сложность:settings.difficulty,акт:window.__acts.slice()}));
 check('двойное касание по пункту выполняет его',
  дубль.сложность==="harsh"&&дубль.акт.length===1,дубль);
 await page.evaluate(()=>{setDifficulty("normal");while(activeLayer())closeTopUI();});

 /* ── Двойное касание по пустому месту выполняет текущий пункт ── */
 await clean();
 const пусто=await page.evaluate(()=>{
  CMD.settings();resetCursor();ensureCursor(activeLayer());
  settings.difficulty="normal";
  const lay=activeLayer();
  for(let y=90;y<760;y+=8)for(const x of [6,384]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))
    return {x,y};}
  return {x:6,y:96};});
 const целевой=await page.evaluate(()=>{
  const items=cursorItems(activeLayer());
  return items.findIndex(x=>x.dataset&&x.dataset.cmd==="setdiff:calm");});
 for(let i=0;i<целевой;i++)await fwd();
 const наКурсоре=await page.evaluate(()=>uiCursor&&uiCursor.dataset.cmd);
 await page.evaluate(()=>{window.__acts=[];});
 await tap(пусто.x,пусто.y);
 const послеПервого=await page.evaluate(()=>({акт:window.__acts.slice(),сложность:settings.difficulty}));
 await tap(пусто.x,пусто.y);
 await page.waitForTimeout(300);
 const послеВторого=await page.evaluate(()=>({акт:window.__acts.slice(),сложность:settings.difficulty}));
 check('свайп доводит курсор до нужного пункта настроек',наКурсоре==="setdiff:calm",{курсор:наКурсоре});
 check('первое касание по пустому месту ничего не выполняет',
  !послеПервого.акт.length&&послеПервого.сложность==="normal",послеПервого);
 check('второе касание выполняет пункт, на котором стоит выбор',
  послеВторого.акт.length===1&&послеВторого.сложность==="calm",послеВторого);
 await page.evaluate(()=>{setDifficulty("normal");while(activeLayer())closeTopUI();});

 /* ── Свайп листает меню и руководство ── */
 await clean();
 const меню=await page.evaluate(()=>{toggleActionMenu();resetCursor();ensureCursor(activeLayer());
  return {всего:cursorItems(activeLayer()).length,индекс:cursorItems(activeLayer()).indexOf(uiCursor)};});
 await page.evaluate(()=>{window.__said=[];});
 for(let i=0;i<5;i++)await fwd();
 const послеСвайпов=await page.evaluate(()=>({индекс:cursorItems(activeLayer()).indexOf(uiCursor),
  названий:window.__said.length}));
 check('свайп листает меню действий ровно по одному пункту',
  послеСвайпов.индекс===меню.индекс+5,{было:меню.индекс,стало:послеСвайпов.индекс});
 check('каждый свайп по меню называет новый пункт',
  послеСвайпов.названий>=5&&послеСвайпов.названий<=6,послеСвайпов);

 await clean();
 const огл=await page.evaluate(()=>{openGuide();resetCursor();ensureCursor(activeLayer());
  return {пунктов:cursorItems(activeLayer()).length,глав:GUIDE.length};});
 for(let i=0;i<4;i++)await fwd();
 const наГлаве=await page.evaluate(()=>(uiCursor.textContent||"").trim().slice(0,10));
 const ep=await page.evaluate(()=>{const lay=activeLayer();
  for(let y=90;y<760;y+=8)for(const x of [6,384]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))
    return {x,y};}
  return {x:6,y:96};});
 await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(300);
 const глава=await page.evaluate(()=>({номер:chIndex,
  заголовок:document.getElementById("chTitle").textContent.slice(0,10)}));
 check('в оглавлении руководства свайп листает главы, двойное касание открывает',
  огл.пунктов===огл.глав+1&&/Глава 4/.test(наГлаве)&&глава.номер===3,
  {пунктов:огл.пунктов,глав:огл.глав,курсор:наГлаве,открылась:глава});
 /* Внутри главы свайп доводит до «След.», а двойное касание листает дальше. */
 await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
 const idxNext=await page.evaluate(()=>cursorItems(activeLayer()).findIndex(x=>x.id==="chNext"));
 for(let i=0;i<idxNext;i++)await fwd();
 await tap(ep.x,ep.y);await tap(ep.x,ep.y);
 await page.waitForTimeout(300);
 const дальше=await page.evaluate(()=>chIndex);
 check('внутри главы свайп доводит до «След.», двойное касание листает дальше',
  дальше===4,{стало:дальше});
 await clean();

 /* ── Заглавное меню: то же правило до входа в мир ── */
 await clean();
 const заг=await page.evaluate(()=>{
  showScreen("screen-title");resetCursor();
  const el=[...cursorItems(navLayer())].find(x=>x.dataset&&x.dataset.cmd==="settings");
  el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
  window.__acts=[];window.__cmds=[];window.__said=[];
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
 await tap(заг.x,заг.y);
 const послеЗаг=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id,
  акт:window.__acts.slice(),кмд:window.__cmds.slice(),сказано:window.__said.length,
  курсор:uiCursor&&uiCursor.dataset.cmd}));
 check('в заглавном меню одно касание только называет кнопку',
  !послеЗаг.окно&&!послеЗаг.акт.length&&!послеЗаг.кмд.length
  &&послеЗаг.сказано>=1&&послеЗаг.курсор==="settings",послеЗаг);
 await tap(заг.x,заг.y);await tap(заг.x,заг.y);
 await page.waitForTimeout(300);
 const открыли=await page.evaluate(()=>activeLayer()&&activeLayer().id);
 check('в заглавном меню двойное касание открывает выбранное',
  открыли==="modal-settings",{окно:открыли});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();showScreen("screen-game");resetCursor();});

 /* ── Второй уровень энциклопедии: касание по звуку его не проигрывает ── */
 await clean();
 const энц=await page.evaluate(()=>{
  CMD.encyc();
  document.querySelectorAll('#encycCats .sound-card')[0].click();
  resetCursor();
  const el=document.querySelectorAll('#encycOneGrid .sound-card')[1];
  el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
  window.__said=[];window.__acts=[];
  Play.stopAll&&Play.stopAll(false);
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),
   играло:Play.active.size};});
 await tap(энц.x,энц.y);
 const послеЭнц=await page.evaluate(()=>({играет:Play.active.size,
  акт:window.__acts.slice(),сказано:window.__said.length}));
 check('в каталоге звуков одно касание называет звук, но не включает его',
  послеЭнц.играет===энц.играло&&!послеЭнц.акт.length&&послеЭнц.сказано>=1,
  {было:энц.играло,...послеЭнц});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── Игровое поле: касание по клетке ничего не делает ── */
 await clean();
 const поле=await page.evaluate(()=>{
  /* Встаём на клетку с ресурсом: там одно касание раньше собирало. */
  for(let r=0;r<6000;r++){const x=1000+(r%80),y=1000+Math.floor(r/80);
   const c=cellContent(x,y);
   if(c.res&&!c.structure&&!c.monster){G.x=x;G.y=y;G.inv={};G.depleted={};
    window.__said=[];window.__acts=[];window.__cmds=[];
    return {ресурс:c.res.name};}}
  return null;});
 const доПоля=await snap();
 await tap(195,520);
 const послеПоля=await snap();
 const полеR=await page.evaluate(()=>({акт:window.__acts.slice(),кмд:window.__cmds.slice(),
  сказано:window.__said.slice()}));
 check('на игровом поле одно касание только рассказывает, что под ногами',
  доПоля===послеПоля&&!полеR.акт.length&&!полеR.кмд.length
  &&полеR.сказано.some(t=>new RegExp(поле.ресурс).test(t)),
  {ресурс:поле.ресурс,изменилось:доПоля!==послеПоля,...полеR});

 /* ── Ползунок: касание не двигает, двойное касание шагает и называет ── */
 await clean();
 const пол=await page.evaluate(()=>{
  CMD.settings();resetCursor();
  const el=document.getElementById("setFxVol");
  el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
  settings.fxVol=1;el.value=100;window.__said=[];
  return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),до:settings.fxVol};});
 await tap(пол.x,пол.y);
 const послеКасания=await page.evaluate(()=>settings.fxVol);
 check('касание по ползунку не меняет громкость',послеКасания===пол.до,
  {было:пол.до,стало:послеКасания});
 await page.waitForTimeout(900);
 await page.evaluate(()=>{window.__said=[];});
 await tap(пол.x,пол.y);await tap(пол.x,пол.y);
 await page.waitForTimeout(300);
 const шаг=await page.evaluate(()=>({значение:settings.fxVol,сказано:window.__said.slice(-1)[0]||""}));
 await page.waitForTimeout(900);
 await tap(пол.x,пол.y);await tap(пол.x,пол.y);
 await page.waitForTimeout(300);
 const шаг2=await page.evaluate(()=>settings.fxVol);
 check('двойное касание двигает ползунок на заметный шаг и называет значение',
  шаг.значение!==пол.до&&/значение/.test(шаг.сказано)&&Math.abs(шаг2-шаг.значение)>=0.09,
  {первый:шаг,второй:шаг2});
 await page.evaluate(()=>{settings.fxVol=1;saveSettings();while(activeLayer())closeTopUI();});

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('Окон проверено: '+окон+', касаний: '+касаний);
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
