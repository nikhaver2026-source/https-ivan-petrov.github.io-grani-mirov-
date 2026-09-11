/* ════════════════════════════════════════════════════════════════════════
   ЖЕСТЫ, МОЛЧАЛИВЫЕ ПУНКТЫ И ЗАЩИТА ОТ СРЫВОВ

   Три обязательных условия, ради которых игра и делалась вслепую:

   1. Двойное касание одним пальцем активирует ЛЮБОЙ пункт, до которого
      достаёт курсор, — не только кнопку, но и карточку досье, у которой
      своего действия нет: она обязана хотя бы прочесть себя вслух.
   2. Одно касание двумя пальцами собирает то, что под ногами, а одно
      касание одним пальцем только называет и ничего не берёт.
   3. Ни одна кнопка не роняет игру молча. Для незрячего игрока сорвавшийся
      обработчик неотличим от «игра перестала отвечать»: экрана с красной
      ошибкой он не видит. Поэтому каждый заведомо испорченный вызов
      обязан ОТВЕТИТЬ ГОЛОСОМ.
   ════════════════════════════════════════════════════════════════════════ */
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
 await page.evaluate(()=>{settings.effects=0;settings.music=0;});

 const speechOn=()=>page.evaluate(()=>{window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;Speech.say=t=>{window.__said.push(String(t));};});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clearSaid=()=>page.evaluate(()=>{window.__said=[];});
 await speechOn();

 async function tap(x,y,ms=30){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(80);}
 async function doubleTap(x,y){await tap(x,y);await page.waitForTimeout(60);await tap(x,y);await page.waitForTimeout(160);}
 async function twoFingerTap(x,y){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:0}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:0},{x:x+25,y,id:1}]});
  await page.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:x+25,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(200);}

 /* ── 1. Ни один пункт под курсором не молчит на двойное касание ── */
 const молчуны=await page.evaluate(async()=>{
  const окна=["modal-character","modal-world","modal-politics","modal-bestiary","modal-races",
   "modal-pantheon","modal-inventory","modal-quests","modal-journal","modal-settings"];
  const открыть={"modal-character":()=>CMD.character(),"modal-world":()=>CMD.world(),
   "modal-politics":()=>CMD.politics&&CMD.politics(),"modal-bestiary":()=>CMD.bestiary(),
   "modal-races":()=>CMD.races(),"modal-pantheon":()=>CMD.pantheon(),
   "modal-inventory":()=>CMD.inv(),"modal-quests":()=>CMD.quests(),
   "modal-journal":()=>CMD.journal(),"modal-settings":()=>CMD.settings()};
  const итог=[];
  for(const id of окна){
   try{открыть[id]&&открыть[id]();}catch(_){continue;}
   await new Promise(z=>setTimeout(z,60));
   const слой=activeLayer();
   if(!слой||слой.id!==id){try{closeTopUI();}catch(_){}continue;}
   const пункты=cursorItems(слой);
   let немых=0;const примеры=[];
   for(const el of пункты){
    const было=window.__said.length;
    try{activateElement(el);}catch(e){немых++;примеры.push("сбой: "+String(e).slice(0,60));continue;}
    /* активация могла открыть окно поверх — возвращаемся обратно */
    while(activeLayer()&&activeLayer().id!==id){try{closeTopUI();}catch(_){break;}}
    if(activeLayer()!==слой){try{открыть[id]();}catch(_){}}
    if(window.__said.length===было){немых++;if(примеры.length<3)примеры.push((el.textContent||"").trim().slice(0,40));}
   }
   итог.push({окно:id,пунктов:пункты.length,немых,примеры});
   while(activeLayer()){try{closeTopUI();}catch(_){break;}}
  }
  return итог;});
 const всегоПунктов=молчуны.reduce((s,o)=>s+o.пунктов,0);
 const всегоНемых=молчуны.reduce((s,o)=>s+o.немых,0);
 check('двойное касание отвечает на каждом пункте всех окон, включая карточки досье',
  всегоНемых===0&&всегоПунктов>150,{пунктов:всегоПунктов,немых:всегоНемых,
   где:молчуны.filter(o=>o.немых).slice(0,4)});

 /* ── 1а. То же для наложений: меню действий, панель магии, руководство ── */
 const наложения=await page.evaluate(async()=>{
  const итог=[];
  const список=[["actionMenu",()=>openActionMenu()],["magicPanel",()=>safeOpenMagicPanel()],
   ["guideOverlay",()=>openGuide()]];
  for(const [id,открыть] of список){
   while(activeLayer()){try{closeTopUI();}catch(_){break;}}
   try{открыть();}catch(e){итог.push({окно:id,ошибка:String(e)});continue;}
   await new Promise(z=>setTimeout(z,120));
   const слой=document.getElementById(id);
   const пункты=cursorItems(слой);
   let немых=0;const примеры=[];
   for(const el of пункты){
    const было=window.__said.length;
    try{activateElement(el);}catch(e){немых++;примеры.push("сбой: "+String(e).slice(0,50));continue;}
    await new Promise(z=>setTimeout(z,15));
    if(window.__said.length===было){немых++;if(примеры.length<4)примеры.push((el.dataset&&el.dataset.cmd)||(el.textContent||"").trim().slice(0,30));}
    let n=0;while(activeLayer()&&activeLayer()!==слой&&n++<6){try{closeTopUI();}catch(_){break;}}
    if(слой.hidden){try{открыть();}catch(_){}await new Promise(z=>setTimeout(z,50));}
   }
   итог.push({окно:id,пунктов:пункты.length,немых,примеры});
   while(activeLayer()){try{closeTopUI();}catch(_){break;}}
  }
  return итог;});
 check('двойное касание отвечает на каждом пункте меню действий, панели магии и руководства',
  наложения.every(o=>!o.ошибка&&o.немых===0)&&наложения.reduce((s,o)=>s+(o.пунктов||0),0)>60,
  наложения);

 /* ── 2. Карточка досье — это пункт-справка, а не кнопка ── */
 const карточка=await page.evaluate(()=>{
  CMD.races();
  const слой=activeLayer();
  const el=cursorItems(слой).find(x=>x.tagName==="DIV"&&!x.dataset.cmd&&(x.dataset.speak||(x.textContent||"").length>20));
  if(!el)return {нет:true};
  const было=window.__said.length;
  activateElement(el);
  const r={справка:typeof isInfoCard==="function"&&isInfoCard(el),
   сказано:window.__said.slice(было).join(" ").slice(0,60)};
  while(activeLayer())closeTopUI();
  return r;});
 check('карточка досье опознаётся как пункт-справка и читает себя вслух',
  !карточка.нет&&карточка.справка&&карточка.сказано.length>0,карточка);

 /* ── 3. Кнопка НЕ считается пунктом-справкой: у неё своё действие ── */
 const кнопка=await page.evaluate(()=>{
  CMD.settings();
  const b=activeLayer().querySelector("button[data-cmd]");
  const r=typeof isInfoCard==="function"&&isInfoCard(b);
  while(activeLayer())closeTopUI();
  return r;});
 check('кнопка не подменяется чтением: у неё остаётся своё действие',кнопка===false,{isInfoCard:кнопка});

 /* ── 4. Одно касание двумя пальцами собирает ресурс ── */
 /* Обход всех пунктов выше нажимал и переключатели настроек — в том числе
    «быстрое касание», при котором одно касание сразу выполняет действие, — а
    с появлением неба ещё и «Подняться на крыло»: крылатый герой оставался в
    воздухе, и жесты земли мерились бы у того, кто до земли не достаёт.
    Возвращаем обычный порядок и ставим героя на землю. */
 await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  settings.fastTap=0;settings.effects=0;settings.music=0;saveSettings&&saveSettings();
  G.alt=0;G.wingTired=0;
  /* встаём на клетку с ресурсом */
  outer:for(let r=0;r<220;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const x=1000+dx,y=1000+dy;const c=cellContent(x,y);
   if(c.res&&!c.structure&&!c.monster){G.x=x;G.y=y;G.place=null;G.ship=null;G.inCombat=false;refresh();break outer;}}
  G.inv={};});
 await clearSaid();
 await twoFingerTap(195,470);
 const собрано=await page.evaluate(()=>Object.entries(G.inv).filter(([,v])=>v>0));
 check('одно касание двумя пальцами собирает ресурс под ногами',собрано.length===1&&собрано[0][1]>=1,
  {инвентарь:собрано,сказано:(await said()).slice(0,2)});

 /* ── 5. Одно касание одним пальцем ресурс НЕ собирает ── */
 await page.evaluate(()=>{G.inv={};});
 await clearSaid();
 await tap(195,470);
 const послеОдного=await page.evaluate(()=>Object.entries(G.inv).filter(([,v])=>v>0));
 const речь1=await said();
 check('одно касание одним пальцем только называет, но не собирает',
  послеОдного.length===0&&речь1.length>0,{инвентарь:послеОдного,сказано:речь1.slice(0,2)});

 /* ── 6. Двойное касание по полю выполняет действие здесь ── */
 await page.evaluate(()=>{G.inv={};});
 await doubleTap(195,470);
 const послеДвойного=await page.evaluate(()=>Object.entries(G.inv).filter(([,v])=>v>0));
 check('двойное касание по полю выполняет действие здесь',послеДвойного.length===1,{инвентарь:послеДвойного});

 /* ── 7. Каждая клетка любого интерьера отвечает на действие ── */
 const интерьеры=await page.evaluate(async()=>{
  const out={уровней:0,клеток:0,немых:0,плиток:{},сбоев:0};
  const типы=Object.keys(PLACE_KIND).filter(k=>PLACE_KIND[k]);
  let bx=1400,by=1400;
  for(const stype of типы){
   const kind=PLACE_KIND[stype];
   for(const depth of (kind==="dungeon"?[0,2,5]:[0,1])){
    bx+=7;by+=11;
    let lvl;try{lvl=genLevel(bx,by,depth,stype);}catch(_){out.сбоев++;continue;}
    out.уровней++;
    for(let y=0;y<lvl.g.length;y++)for(let x=0;x<lvl.g[y].length;x++){
     const t=lvl.g[y][x];if(t==="#")continue;
     out.клеток++;out.плиток[t]=(out.плиток[t]||0)+1;
     G.place={kind,bx,by,stype,name:"проверка",depth,x,y};
     G.inCombat=false;G.ship=null;G.flight=null;
     const было=window.__said.length;
     try{useHere();}catch(_){out.сбоев++;}
     while(activeLayer()){try{closeTopUI();}catch(_){break;}}
     if(window.__said.length===было)out.немых++;
    }
    await new Promise(z=>setTimeout(z,3));
   }
  }
  G.place=null;
  return out;});
 check('каждая клетка каждого интерьера отвечает на действие «здесь»',
  интерьеры.немых===0&&интерьеры.сбоев===0&&интерьеры.клеток>1500,интерьеры);
 check('в интерьерах встречаются все виды объектов, включая знания и обстановку',
  ["K","X",">","<","C","T","R","M","+"].every(t=>интерьеры.плиток[t]>0),Object.keys(интерьеры.плиток).sort());

 /* ── 8. Испорченные вызовы отвечают голосом, а не срываются ── */
 const защита=await page.evaluate(()=>{
  const пробы=[
   ["житель по несуществующему ключу",()=>CMD.npc("мусор")],
   ["продажа несуществующему жителю",()=>CMD.sell("мусор:руда")],
   ["продажа всего несуществующему жителю",()=>CMD.sellall("мусор:руда")],
   ["заклинание вне списка",()=>CMD.learn(99)],
   ["вступление в клан в чистом поле",()=>{G.place=null;G.x=1000;G.y=1000;G.clan=null;CMD.joinclan();}],
   ["клетка карты по испорченному ключу",()=>CMD.mapcell("мусор")],
   ["ремесло без рецепта",()=>CMD.craftdo()],
   ["ремесло вне списка",()=>CMD.craftdo(42)]];
  const out=[];
  for(const [имя,f] of пробы){
   const было=window.__said.length;
   let срыв=null;
   try{f();}catch(e){срыв=String(e).slice(0,90);}
   while(activeLayer()){try{closeTopUI();}catch(_){break;}}
   out.push({имя,срыв,ответил:window.__said.length>было,
    ответ:window.__said.slice(было,было+1)[0]||""});
  }
  return out;});
 check('ни один испорченный вызов не роняет игру',защита.every(o=>!o.срыв),
  защита.filter(o=>o.срыв));
 check('каждый испорченный вызов отвечает игроку голосом',защита.every(o=>o.ответил),
  защита.filter(o=>!o.ответил).map(o=>o.имя));

 /* ── 8а. Открытое окно называет себя, закрытое отчитывается ── */
 const окна=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  const r={};
  window.__said=[];CMD.world();await new Promise(z=>setTimeout(z,120));
  r.открытие=window.__said.slice();
  window.__said=[];activateElement(activeLayer().querySelector('[data-cmd="close"]'));
  await new Promise(z=>setTimeout(z,120));
  r.закрытие=window.__said.slice();r.слой=activeLayer()&&activeLayer().id;
  while(activeLayer())closeTopUI();
  return r;});
 check('открытое окно называет себя, а не одно слово «Закрыть»',
  окна.открытие.some(t=>/Окно «Живой мир»/.test(t)),окна.открытие);
 check('закрытое окно отчитывается, куда вернулся игрок',
  окна.закрытие.some(t=>/закрыт/i.test(t)&&/Игровое поле/.test(t))&&!окна.слой,окна.закрытие);

 /* ── 8б. Меню действий и панель магии тоже отчитываются о закрытии ── */
 const закрытия=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  const r={};
  window.__said=[];openActionMenu();await new Promise(z=>setTimeout(z,100));
  window.__said=[];closeActionMenu();await new Promise(z=>setTimeout(z,100));
  r.меню=window.__said.slice();
  window.__said=[];safeOpenMagicPanel();await new Promise(z=>setTimeout(z,100));
  window.__said=[];closeMagicPanel();await new Promise(z=>setTimeout(z,100));
  r.магия=window.__said.slice();
  while(activeLayer())closeTopUI();
  return r;});
 check('меню действий и панель магии отчитываются о закрытии',
  закрытия.меню.some(t=>/закрыт/i.test(t))&&закрытия.магия.some(t=>/закрыт/i.test(t)),закрытия);

 /* ── 8в. Ни одна команда не превращает числа героя в «не число» ──
    Ставку в карты принимали любую. Кнопка из прежнего сохранения давала
    не-число: сравнение «золота меньше ставки» с ним всегда ложно, игра
    снимала со счёта NaN, и весь кошель обращался в ничто — а страж
    целостности через шесть секунд молча заменял его нулём. Игрок терял всё
    золото, не услышав ни слова. Здесь через каждую команду прогоняются
    заведомо негодные доводы, и после каждого вызова числа героя обязаны
    остаться числами. */
 const числа=await page.evaluate(async()=>{
  const ключи=["gold","hp","hpMax","mana","manaMax","xp","level","str","agi","mind","cha","day","hour","x","y","water"];
  const плохие=()=>ключи.filter(k=>!Number.isFinite(G[k]));
  const out={порча:[],вызовов:0,команд:0};
  const доводы=["","0","1","99","-1","мусор","мусор:мусор","1,1","x,y",":","::",undefined,null,"NaN","1e9"];
  const сброс=()=>{G.place=null;G.ship=null;G.inCombat=false;G.loot=null;
   G.x=1000;G.y=1000;G.gold=100;G.hp=G.hpMax=100;G.mana=G.manaMax=50;
   G.xp=0;G.level=1;G.str=5;G.agi=5;G.mind=5;G.cha=5;G.day=1;G.hour=8;G.water=100;};
  const имена=Object.keys(CMD).filter(n=>!/^(testall|silence|music)$/.test(n));
  out.команд=имена.length;
  for(const имя of имена){
   for(const arg of доводы){
    сброс();
    try{while(activeLayer())closeTopUI();}catch(_){}
    out.вызовов++;
    try{CMD[имя](arg);}catch(e){out.порча.push({команда:имя,довод:String(arg),сбой:String(e).slice(0,70)});}
    const п=плохие();
    if(п.length)out.порча.push({команда:имя,довод:String(arg),
     поля:п.map(k=>k+"="+String(G[k]))});
    try{while(activeLayer())closeTopUI();}catch(_){}
   }
   await new Promise(z=>setTimeout(z,1));
  }
  сброс();
  return out;});
 check('ни одна команда с негодным доводом не роняет игру и не портит числа героя',
  числа.порча.length===0&&числа.вызовов>1200,
  {команд:числа.команд,вызовов:числа.вызовов,порча:числа.порча.slice(0,6)});

 /* ── 9. Отнятое системой касание обнуляет жест ── */
 const отмена=await page.evaluate(()=>{
  gesture={count:2,maxCount:2,id:7,x:10,y:10,t:Date.now(),moved:false,dir:null,target:null,ui:null};
  document.dispatchEvent(new Event("touchcancel"));
  return {maxCount:gesture.maxCount||0,count:gesture.count||0};});
 check('отнятое системой касание обнуляет незавершённый жест',
  отмена.maxCount===0&&отмена.count===0,отмена);

 /* ── 10. Каждая роль звука, на которую ссылается код, есть в банке ── */
 const роли=await page.evaluate(()=>{
  const есть=new Set(Object.keys(SOUND_BANK));
  const плохие=[];
  const обойти=(имя,v)=>{if(typeof v==="string"){if(!есть.has(v))плохие.push(имя+":"+v);}
   else if(Array.isArray(v))v.forEach(x=>обойти(имя,x));
   else if(v&&typeof v==="object")Object.values(v).forEach(x=>обойти(имя,x));};
  обойти("SURF_ROLE",SURF_ROLE);обойти("SURF_FALLBACK",SURF_FALLBACK);
  обойти("BEACON_ROLE",BEACON_ROLE);
  if(typeof LIVE_SCENE!=="undefined")обойти("LIVE_SCENE",LIVE_SCENE);
  if(typeof LIVE_DEEP!=="undefined")обойти("LIVE_DEEP",LIVE_DEEP);
  return плохие;});
 check('каждая роль звука, названная в картах мира, есть в банке',роли.length===0,роли.slice(0,8));

 /* ── 11. Каждый маяк, который зовёт код, чем-нибудь звучит ── */
 const маяки=await page.evaluate(()=>{
  const имена=["altar","caravan","chest","door","gate","npc_common","npc_guard","port_horn",
   "portal","signpost","stairs_down","stairs_up","torch","wall","well"];
  return имена.filter(n=>!(BEACONS&&BEACONS[n])&&!(BEACON_SAMPLE&&BEACON_SAMPLE[n])&&!(BEACON_ROLE&&BEACON_ROLE[n]));});
 check('каждый маяк, который зовёт код, чем-нибудь звучит',маяки.length===0,маяки);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
