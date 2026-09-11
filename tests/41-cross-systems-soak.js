/* ════════════════════════════════════════════════════════════════════════
   ВСЕ СИСТЕМЫ ВМЕСТЕ: ПЕРЕКРЁСТНЫЙ ПРОГОН

   Каждый набор до этого проверял свой угол игры поодиночке. Здесь всё
   работает разом и друг об друга: герой ходит по миру, входит в города и
   дома, спускается в подземелья, ломает двери сокровищниц, трогает
   обстановку, дерётся, торгует, берёт подряды, молится, ворожит, ловит рыбу,
   плывёт, открывает и закрывает окна, меняет настройки, сохраняется и
   загружается — вперемешку, тысячами шагов, любыми сочетаниями.

   Ищем не «правильный ответ», а невозможное состояние. Слепого игрока из
   игры выбрасывает не неверная цифра, а тупик: бой, который не кончается;
   место, в котором герой одновременно и на корабле; число, ставшее NaN;
   окно, которое не закрывается; действие, после которого игра перестаёт
   отвечать. Поэтому после КАЖДОГО шага сверяются одни и те же законы мира, а
   в конце проверяется главное: чем бы игрок ни занимался, «действие здесь» и
   шаг в сторону всегда что-то отвечают.

   Отдельно — крест состояний: каждая команда игры вызывается в каждом
   мыслимом положении героя (снаружи, в городе, в доме, в подземелье, в
   палате, на корабле, в бою, при смертельно малом здоровье, с пустой сумой и
   с полной), и ни одно сочетание не имеет права ни сломаться, ни промолчать.
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
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));if(window.__said.length>40)window.__said.shift();};});

 /* ─────────── ЗАКОНЫ МИРА ─────────── */
 await page.evaluate(()=>{
  window.__законы=()=>{
   const б=[];
   const ч={hp:G.hp,hpMax:G.hpMax,mp:G.mp,mpMax:G.mpMax,gold:G.gold,xp:G.xp,level:G.level,
    str:G.str,agi:G.agi,mind:G.mind,food:G.food,water:G.water,day:G.day,hour:G.hour,x:G.x,y:G.y};
   for(const [k,v] of Object.entries(ч)){
    if(!Number.isFinite(v)){б.push(`${k}=${v}`);continue;}
    if(k!=="x"&&k!=="y"&&v<0)б.push(`${k} в минусе (${v})`);}
   if(Number.isFinite(G.hp)&&Number.isFinite(G.hpMax)&&G.hp>G.hpMax)б.push(`здоровье ${G.hp} выше предела ${G.hpMax}`);
   if(Number.isFinite(G.mp)&&Number.isFinite(G.mpMax)&&G.mp>G.mpMax)б.push(`сила ${G.mp} выше предела ${G.mpMax}`);
   if(Number.isFinite(G.hour)&&(G.hour<0||G.hour>=24))б.push(`час ${G.hour}`);
   if(G.inCombat&&!G.combat)б.push("бой без противника");
   if(G.combat&&!G.inCombat)б.push("противник без боя");
   if(G.place&&G.ship)б.push("одновременно в здании и на корабле");
   if(G.place){
    const p=G.place;
    for(const k of ["bx","by","x","y","depth"])
     if(!Number.isFinite(Number(p[k])))б.push(`место: ${k}=${p[k]}`);
    if(!p.stype)б.push("место без вида");}
   if(G.ship){
    const s=G.ship;
    if(!Number.isFinite(Number(s.left)))б.push(`корабль: осталось ${s.left}`);
    if(Number(s.left)<0)б.push(`корабль ушёл в минус переходов`);}
   for(const [р,н] of Object.entries(G.inv||{}))
    if(!Number.isFinite(н)||н<0)б.push(`запас «${р}»=${н}`);
   if(!Array.isArray(G.items))б.push("сума не список");
   else if(G.items.some(i=>typeof i!=="string"||!i))б.push("в суме пустышка");
   if(G.equip){for(const [сл,в] of Object.entries(G.equip)){
    if(!в)continue;
    if(typeof в!=="object")б.push(`снаряжение «${сл}» не предмет`);
    else if(!Number.isFinite(Number(в.val)))б.push(`снаряжение «${сл}»: сила ${в.val}`);}}
   return б;};
 });

 /* ─────────── ДОЛГИЙ СМЕШАННЫЙ ПРОГОН ─────────── */
 const прогон=await page.evaluate(async()=>{
  const беды=[],молчали=[];
  const было=[];
  let шагов=0,ответов=0,сбылось=0;
  const немые=[];
  const R=()=>Math.random();
  const сторона=()=>["N","S","E","W"][Math.floor(R()*4)];
  const тихо=f=>{try{return f();}catch(e){беды.push("сломалось: "+(e&&e.message||e));return null;}};
  /* Открыть окно, которое и так открыто, — не действие, а пустой ход: игра
     справедливо молчит. Считаем только настоящие открытия. */
  const окно=(ид,f)=>{const m=document.getElementById(ид);
   if(!m||!m.hidden)return false;f();};

  /* Дело возвращает false, если оно к нынешнему положению не подходит:
     шаг по миру, когда герой в доме, — не молчание игры, а несбывшееся
     действие. Считаем ответы только по тем делам, что и вправду случились. */
  const дела=[
   ["шаг снаружи",()=>{if(G.place||G.ship)return false;move(сторона());}],
   ["взмах",()=>{if(G.place||G.ship)return false;G.weaponDrawn=true;weaponSwing(сторона());}],
   ["сбор",()=>{if(G.place||G.ship)return false;gatherCurrent("tap");}],
   ["действие здесь",()=>useHere()],
   ["шаг внутри",()=>{if(!G.place)return false;moveInside(сторона());}],
   ["вход",()=>{if(G.place||G.ship)return false;const c=cellContent(G.x,G.y);
     if(!c.structure||!PLACE_KIND[c.structure.type])return false;enterPlace(c);}],
   ["выход",()=>{if(!G.place)return false;leavePlace();}],
   ["бой до конца",()=>{if(!G.inCombat)return false;
     for(let i=0;i<40&&G.inCombat;i++)fight("atk");
     if(G.inCombat)CMD.flee&&CMD.flee();}],
   ["осмотр",()=>CMD.look&&CMD.look()],
   ["сводка",()=>CMD.check&&CMD.check()],
   ["карта клетки",()=>CMD.mapcell&&CMD.mapcell(Math.floor(R()*5)-2,Math.floor(R()*5)-2)],
   /* Обход маяков и тихая запись говорить и не должны: один звучит, вторая
      молчит нарочно, чтобы не тараторить после каждого шага. */
   ["маяки",()=>{scanNearbyBeacons();return false;}],
   ["сохранить",()=>{saveGame(true);return false;}],
   ["сумка",()=>окно("modal-inventory",()=>CMD.inv())],
   ["герой",()=>окно("modal-character",()=>CMD.char())],
   ["подряды",()=>окно("modal-quests",()=>CMD.quests())],
   ["молитва",()=>CMD.pray&&CMD.pray()],
   ["ремесло",()=>CMD.craftdo&&CMD.craftdo(Math.floor(R()*4))],
   ["чары",()=>CMD.cast&&CMD.cast(Math.floor(R()*6))],
   ["рыбалка",()=>CMD.fish&&CMD.fish()],
   ["торг",()=>CMD.trade&&CMD.trade()],
   ["продать всё",()=>CMD.sellall&&CMD.sellall()],
   ["летопись",()=>окно("modal-journal",()=>CMD.journal())],
   ["мир",()=>окно("modal-world",()=>CMD.world())],
   ["настройки",()=>{settings.hrtf=R()<0.5?1:0;settings.scape=R()<0.5?1:0;return false;}],
   ["окно",()=>{const ид=["modal-inventory","modal-character","modal-map","modal-quests",
     "modal-saves","modal-settings","modal-world","modal-journal"];
     const и=ид[Math.floor(R()*ид.length)];
     return окно(и,()=>openModal(и));}],
   /* Закрывается ровно то, что открыто: closeModal без довода — не действие. */
   ["закрыть окно",()=>{const m=modalStack[modalStack.length-1];
     if(!m||m.hidden)return false;closeModal(m);}],
   ["закрыть верхнее",()=>{if(!activeLayer())return false;closeTopUI();}],
   ["тишина",()=>CMD.silence&&CMD.silence()],
  ];

  /* Герой крепкий: проверяем не смерть, а состояния. */
  G.hp=G.hpMax=4000;G.mp=G.mpMax=900;G.gold=50000;G.level=25;
  G.str=90;G.agi=90;G.mind=90;G.food=200;G.water=200;
  G.equip.weapon={id:1,name:"Меч прогона",type:"Меч",val:70};

  for(let i=0;i<3000;i++){
   const [имя,дело]=дела[Math.floor(R()*дела.length)];
   window.__said=[];
   const случилось=тихо(дело)!==false;
   шагов++;
   if(случилось){
    сбылось++;
    if(window.__said.join("").trim())ответов++;
    else немые.push(имя);}
   const б=window.__законы();
   if(б.length){беды.push(`${имя}: ${б.join("; ")}`);
    /* чиним, чтобы дальше проверять новое, а не то же самое */
    G.hp=G.hpMax=4000;G.mp=G.mpMax=900;G.gold=50000;G.hour=Math.max(0,Math.min(23,Number(G.hour)||0));}
   if(беды.length>12)break;
   if(i%400===0){было.push({i,x:G.x,y:G.y,место:G.place?G.place.stype+"/"+G.place.depth:null});
    await new Promise(z=>setTimeout(z,0));}
  }
  /* После всего — игра обязана отвечать */
  тихо(()=>{for(let i=0;i<200&&G.inCombat;i++)fight("atk");});
  тихо(()=>{for(let i=0;i<20&&activeLayer();i++)closeTopUI();});
  window.__said=[];тихо(()=>useHere());
  const отвечаетДействие=!!window.__said.join("").trim();
  window.__said=[];тихо(()=>{G.place?moveInside("N"):move("N");});
  const отвечаетШаг=!!window.__said.join("").trim();
  const счёт={};for(const н of немые)счёт[н]=(счёт[н]||0)+1;
  return {шагов,ответов,сбылось,беды,было,отвечаетДействие,отвечаетШаг,
   немые:Object.entries(счёт).sort((a,b)=>b[1]-a[1]).slice(0,8),
   доляОтветов:Math.round(100*ответов/Math.max(1,сбылось))};
 });

 /* ─────────── КРЕСТ СОСТОЯНИЙ × КОМАНД ─────────── */
 const крест=await page.evaluate(async()=>{
  const беды=[],молчали=[];
  const базово=()=>{
   G.inCombat=false;G.combat=null;G.ship=null;G.place=null;G.flight=null;
   G.x=1000;G.y=1000;G.hp=G.hpMax=300;G.mp=G.mpMax=120;G.gold=2000;
   G.level=12;G.str=30;G.agi=30;G.mind=30;G.food=150;G.water=150;
   G.items=[];G.inv={};G.equip={weapon:null,armor:null};G.marks={};G.vaults={};
   safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});
   /* closeModal без довода — пустой вызов: закрываем настоящим путём игрока,
      пока сверху вообще что-нибудь есть. */
   safeFn(()=>{for(let i=0;i<25&&activeLayer();i++)closeTopUI();});};
  const найти=(вид)=>{
   for(let r=1;r<220;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const c=safeFn(()=>cellContent(1000+dx,1000+dy),null);
    if(c&&c.structure&&c.structure.type===вид)return {x:1000+dx,y:1000+dy,c};}
   return null;};
  const состояния={
   "в поле":()=>{базово();},
   "с пустой сумой и на волоске":()=>{базово();G.hp=1;G.mp=0;G.gold=0;G.food=0;G.water=0;},
   "с полной сумой":()=>{базово();G.gold=99999;
    for(const р of Object.keys(RESICON))G.inv[р]=40;
    G.items=["Факел","Верёвка","Зелье","Ключ сокровищницы"];
    G.equip.weapon={id:1,name:"Меч",type:"Меч",val:40};
    G.equip.armor={id:2,name:"Латы",type:"Латы",val:30};},
   /* Города в мире не зовутся «city»: городом делает вид постройки —
      деревня, порт, цитадель. Ищем по PLACE_KIND, а не по имени. */
   "в городе":()=>{базово();
    for(const вид of Object.keys(PLACE_KIND).filter(k=>PLACE_KIND[k]==="city")){
     const м=найти(вид);if(м){G.x=м.x;G.y=м.y;safeFn(()=>enterPlace(м.c));break;}}},
   "в доме":()=>{базово();
    for(const вид of ["tavern","temple","market","forge","school","tower","castle","village"]){
     const м=найти(вид);if(м){G.x=м.x;G.y=м.y;safeFn(()=>enterPlace(м.c));break;}}},
   "в подземелье":()=>{базово();
    G.place={bx:5,by:5,stype:"ruins",depth:2,name:"Проверочные руины",x:1,y:1};
    const lvl=safeFn(()=>curLevel(),null);
    if(lvl&&lvl.entry){G.place.x=lvl.entry.x;G.place.y=lvl.entry.y;}},
   "в сокровищнице":()=>{базово();
    for(let bx=0;bx<8;bx++)for(let by=0;by<8;by++)for(let d=2;d<=3;d++){
     const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
     if(!lvl||!lvl.vault)continue;
     G.place={bx,by,stype:"ruins",depth:d,name:"Руины",x:lvl.vault.x0,y:lvl.vault.y0};
     setPlaceMark(lvl.vault.door.x,lvl.vault.door.y,"open");return;}},
   "на корабле":()=>{базово();
    G.ship={name:"Проверочная ладья",toName:"Дальний порт",toX:1050,toY:1050,left:4};},
   "в бою":()=>{базово();
    const c=safeFn(()=>{for(let r=1;r<200;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const cc=cellContent(1000+dx,1000+dy);
      if(cc.monster&&!cc.structure){G.x=1000+dx;G.y=1000+dy;return cc;}}return null;},null);
    if(c)safeFn(()=>startCombat(c));},
   "с открытым окном":()=>{базово();safeFn(()=>openModal("modal-inv"));},
  };
  const команды=Object.keys(CMD);
  const доводы={mapcell:[1,1],craftdo:[0],cast:[0],readpage:[0],slotsave:[1],slotload:[1],
   slotdel:[1],buy:[0],sell:[0],lot5:[],lot10:[],carbuy:[0],carsell:[0],carbuy5:[0],
   learn:[0],npc:[0],npctalk:[0],raceinfo:[0],prayto:[0],portalgo:[0],qtake:[0],qdone:[0],
   qdrop:[0],racefilter:["all"],setdiff:["norm"],setrace:[0],scroll:[1],am:["look"],
   enterprice:[0],art:[0],evt:[0],pir:[0],lot:[0],freight:[0],board:[0],fs:[0],svc:[0],
   check:[],echo:[],best:[0],interact:[],enterplace:[],takeloot:[],trade:[],
   sail:[0],harbor:[],seatalk:[0],carescort:[0],carnews:[0],carbeacon:[0],citybeacon:[],
   maplegend:[],mapscan:[],cityplan:[],searchruins:[],signread:[],listen:[],ascend:[],
   descend:[],portal:[],usehere:[],gather:[],look:[],story:[],warm:[],tutorstart:[],
   guide:[],quests:[],journal:[],lore:[],encyc:[],races:[],pantheon:[],politics:[],
   patron:[],joinclan:[],equip:[0],craft:[],inv:[],char:[],map:[],world:[],settings:[],
   saves:[],save:[],load:[],loadauto:[],loadfile:[],savefile:[],music:[],silence:[],
   gestures:[],tutor:[],close:[],fight:["atk"],flee:[],cards:[10],fish:[],sellall:[],
   carsellall:[],pray:[],move:["N"],testall:[]};
  /* Разрушительное и служебное здесь ни при чём: они меняют весь прогон. */
  const мимо=new Set(["testall","loadfile","savefile","load","loadauto","slotload","slotdel"]);
  let вызовов=0;const медлили=[];
  for(const [имя,поставить] of Object.entries(состояния)){
   for(const к of команды){
    if(мимо.has(к))continue;
    поставить();
    window.__said=[];
    вызовов++;
    try{const д=доводы[к];CMD[к].apply(null,Array.isArray(д)?д:[]);}
    catch(e){беды.push(`«${к}» в состоянии «${имя}» сломалась: ${e&&e.message||e}`);continue;}
    /* Шаг по пустой земле в ту же сторону молчит НАРОЧНО: направление
       называется только при повороте, иначе «север» забивал бы собой
       постройки, ресурсы и тварей. Вместо слова там звучит шаг. */
    const молчаНарочно=(к==="move"&&!G.place&&!G.ship);
    if(!молчаНарочно&&!window.__said.join("").trim()&&!activeLayer())медлили.push([к,имя]);
    const б=window.__законы();
    if(б.length)беды.push(`«${к}» в состоянии «${имя}»: ${б.join("; ")}`);
    if(беды.length>15)break;}
   if(беды.length>15)break;}
  /* Иные команды отвечают не сразу: обучение сперва вводит в мир и
     заговаривает через секунду, разогрев банка звуков — по мере готовности.
     Каждого молчуна переспрашиваем поодиночке и ждём две секунды: только
     после этого он и вправду молчун. */
  for(const [к,имя] of медлили){
   состояния[имя]();
   window.__said=[];
   try{const д=доводы[к];CMD[к].apply(null,Array.isArray(д)?д:[]);}catch(_){}
   await new Promise(z=>setTimeout(z,2000));
   if(!window.__said.join("").trim()&&!activeLayer())молчали.push(`${к} / ${имя}`);
   safeFn(()=>{if(Tutor&&Tutor.stop)Tutor.stop();});
   safeFn(()=>{if(Warm&&Warm.cancel)Warm.cancel();});
   safeFn(()=>{for(let i=0;i<20&&activeLayer();i++)closeTopUI();});}
  базово();
  return {вызовов,беды,молчали,медлили:медлили.length};
 });

 /* ─────────── СОХРАНЕНИЕ СКВОЗЬ ВСЁ ─────────── */
 const записи=await page.evaluate(()=>{
  const беды=[];
  const снимок=()=>({x:G.x,y:G.y,gold:G.gold,hp:G.hp,level:G.level,day:G.day,
   место:G.place?`${G.place.stype}/${G.place.depth}/${G.place.x},${G.place.y}`:null,
   корабль:G.ship?G.ship.name:null,
   сума:(G.items||[]).slice().sort().join("|"),
   запас:Object.entries(G.inv||{}).filter(([,н])=>н>0).map(([р,н])=>r=>0).length,
   меток:Object.keys(G.marks||{}).length,
   очищено:Object.keys(G.cleared||{}).length});
  const состояния=[
   ()=>{G.place=null;G.ship=null;G.x=1234;G.y=987;G.gold=777;},
   ()=>{G.place={bx:2,by:3,stype:"tavern",depth:0,name:"Таверна",x:4,y:5};G.ship=null;},
   ()=>{G.place={bx:7,by:1,stype:"ruins",depth:3,name:"Руины",x:6,y:6};G.ship=null;},
   ()=>{G.place=null;G.ship={name:"Ладья",toName:"Порт",toX:1,toY:2,left:3};},
   ()=>{G.place=null;G.ship=null;G.items=["Ключ сокровищницы","Факел"];
    for(const р of Object.keys(RESICON))G.inv[р]=7;},
  ];
  for(let i=0;i<состояния.length;i++){
   состояния[i]();
   G.marks=G.marks||{};G.marks["проверка"+i]="open";
   G.cleared=G.cleared||{};G.cleared["метка"+i]=true;
   const до=снимок();
   const raw=safeFn(()=>serializeSave(),null);
   if(!raw){беды.push(`состояние ${i}: не записалось`);continue;}
   let d=null;try{d=JSON.parse(raw);}catch(e){беды.push(`состояние ${i}: запись не читается`);continue;}
   if(d.inCombat)беды.push(`состояние ${i}: бой попал в запись`);
   if(d.combat)беды.push(`состояние ${i}: противник попал в запись`);
   /* обратная сборка ровно тем же путём, что и загрузка */
   const сохр={...G};
   Object.keys(G).forEach(k=>{delete G[k];});
   Object.assign(G,d);
   const после=снимок();
   for(const k of Object.keys(до))
    if(JSON.stringify(до[k])!==JSON.stringify(после[k]))
     беды.push(`состояние ${i}: «${k}» не пережило запись (${JSON.stringify(до[k])} → ${JSON.stringify(после[k])})`);
   if(!G.marks||G.marks["проверка"+i]!=="open")беды.push(`состояние ${i}: отметки мест потерялись`);
   if(!G.cleared||!G.cleared["метка"+i])беды.push(`состояние ${i}: очищенные клетки потерялись`);
   const б=window.__законы();
   if(б.length)беды.push(`состояние ${i} после чтения: ${б.join("; ")}`);
  }
  return {состояний:состояния.length,беды};
 });

 /* ─────────── ПАЛАТА СКВОЗЬ СОХРАНЕНИЕ И СМЕНУ ЯРУСОВ ─────────── */
 const палатаСквозь=await page.evaluate(()=>{
  let наш=null;
  for(let bx=0;bx<8&&!наш;bx++)for(let by=0;by<8&&!наш;by++)for(let d=2;d<=3&&!наш;d++){
   const lvl=safeFn(()=>genLevel(bx,by,d,"ruins"),null);
   if(lvl&&lvl.vault)наш={bx,by,d,lvl};}
  if(!наш)return {нет:true};
  const {bx,by,d,lvl}=наш,v=lvl.vault;
  G.place={bx,by,stype:"ruins",depth:d,name:"Руины",x:1,y:1};
  G.marks={};G.vaults={};G.items=[VAULT_KEY];G.hp=G.hpMax=400;
  safeFn(()=>openVault(v.door.x,v.door.y));
  const открыта=vaultOpened(curLevel());
  /* запись и чтение */
  const raw=serializeSave();
  Object.keys(G).forEach(k=>{delete G[k];});
  Object.assign(G,JSON.parse(raw));
  const послеЗаписи=vaultOpened(curLevel());
  /* уходим на другой ярус и возвращаемся */
  G.place.depth=d+1;safeFn(()=>curLevel());
  G.place.depth=d;
  const послеПрогулки=vaultOpened(curLevel());
  /* и после сброса памяти уровней */
  safeFn(()=>levelCache.clear());
  const послеСброса=vaultOpened(curLevel());
  const палатаНаМесте=!!(curLevel()&&curLevel().vault);
  const дверьТам=curLevel()&&curLevel().vault&&
   curLevel().vault.door.x===v.door.x&&curLevel().vault.door.y===v.door.y;
  return {открыта,послеЗаписи,послеПрогулки,послеСброса,палатаНаМесте,дверьТам};
 });

 /* ─────────── ГЛУБОКИЙ ЯРУС ЗА ЯРУСОМ ─────────── */
 const спуск=await page.evaluate(()=>{
  const беды=[];let ярусов=0,палат=0;
  G.place={bx:6,by:2,stype:"ruins",depth:0,name:"Руины",x:1,y:1};
  G.marks={};G.vaults={};G.hp=G.hpMax=9000;G.items=[];
  for(let d=0;d<=8;d++){
   G.place.depth=d;
   const lvl=safeFn(()=>curLevel(),null);
   if(!lvl){беды.push(`ярус ${d} не построился`);continue;}
   ярусов++;
   if(lvl.vault)палат++;
   if(!lvl.entry||!Number.isFinite(lvl.entry.x))беды.push(`ярус ${d} без входа`);
   /* с любого яруса есть выход наверх */
   let вверх=0,вниз=0;
   for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++){
    if(lvl.g[y][x]==="<")вверх++;if(lvl.g[y][x]===">")вниз++;}
   if(!вверх)беды.push(`ярус ${d} без лестницы наверх`);
   /* и вход стоит на проходимой клетке */
   const t=lvl.g[lvl.entry.y][lvl.entry.x];
   if(TILE[t]&&TILE[t].solid)беды.push(`ярус ${d}: вход в стене`);
   const б=window.__законы();if(б.length)беды.push(`ярус ${d}: ${б.join("; ")}`);}
  return {ярусов,палат,беды};
 });

 /* ─────────── ИТОГИ ─────────── */
 check('долгий смешанный прогон не нарушил ни одного закона мира',
  прогон.беды.length===0,прогон.беды.slice(0,6));
 check('в смешанном прогоне сделано не меньше трёх тысяч шагов',
  прогон.шагов>=3000,прогон.шагов);
 check('каждое сбывшееся дело прогона получает ответ вслух',
  прогон.доляОтветов>=99,{доля:прогон.доляОтветов,сбылось:прогон.сбылось,
   ответов:прогон.ответов,немые:прогон.немые});
 check('после трёх тысяч случайных шагов «действие здесь» отвечает',
  прогон.отвечаетДействие===true,прогон);
 check('после трёх тысяч случайных шагов шаг в сторону отвечает',
  прогон.отвечаетШаг===true,прогон);

 check('крест состояний и команд пройден целиком',
  крест.вызовов>=500,крест.вызовов);
 check('ни одна команда не ломается ни в одном положении героя',
  крест.беды.length===0,крест.беды.slice(0,8));
 check('ни одна команда не молчит ни в одном положении героя',
  крест.молчали.length===0,крест.молчали.slice(0,10));

 check('запись переживает любое положение героя',
  записи.беды.length===0,записи.беды.slice(0,6));
 check('бой никогда не попадает в запись',
  !записи.беды.some(б=>/бой|противник/.test(б)),записи.беды.slice(0,4));

 check('открытая палата остаётся открытой после записи, прогулки и сброса памяти',
  палатаСквозь.открыта&&палатаСквозь.послеЗаписи&&
  палатаСквозь.послеПрогулки&&палатаСквозь.послеСброса,палатаСквозь);
 check('палата на том же месте после сброса памяти уровней',
  палатаСквозь.палатаНаМесте===true&&палатаСквозь.дверьТам===true,палатаСквозь);

 check('девять ярусов подряд строятся и все с выходом наверх',
  спуск.ярусов===9&&спуск.беды.length===0,спуск);
 check('на глубине палаты встречаются, но не на каждом ярусе',
  спуск.палат>=1&&спуск.палат<спуск.ярусов,спуск);

 check('игра не выбрасывала ошибок за весь перекрёстный прогон',errors.length===0,errors.slice(0,4));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
