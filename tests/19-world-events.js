const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. Событий стало заметно больше, и у каждого свой звук
 const list=await page.evaluate(()=>({
  n:EVENTS.length,
  ids:EVENTS.map(e=>e.id),
  withSound:EVENTS.filter(e=>e.snd).length,
  badSound:EVENTS.filter(e=>e.snd&&!Bank.has(e.snd)).map(e=>e.id),
  dupes:EVENTS.map(e=>e.id).filter((x,i,a)=>a.indexOf(x)!==i)}));
 check('событий в мире стало больше тридцати',list.n>=30,{было:11,стало:list.n});
 check('нет одинаковых имён событий',list.dupes.length===0,list.dupes);
 check('у новых событий свои записи, и все они есть в банке',list.withSound>=20&&list.badSound.length===0,
  {со_звуком:list.withSound,битые:list.badSound});

 // 2. Каждое событие собирается и каждый выбор отрабатывает без ошибки
 const run=await page.evaluate(()=>{
  // ставим игрока в подземелье третьего уровня: так доступны и подземные события
  G.place=null;
  enterPlace({x:1500,y:1500,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}});
  changeDepth(1);changeDepth(1);changeDepth(1);
  G.clan=CLAN_DB[0].n;G.gold=900;G.level=6;G.patron="zarya";
  G.inv["руда"]=6;G.inv["кость"]=3;G.hpMax=200;G.hp=200;G.manaMax=100;G.mana=100;G.water=200;
  const c={idx:0,emp:EMPIRES[0],wars:[{a:0,b:1,cause:"спор о рудниках"}],foe:EMPIRES[1],
   holy:PANTHEON[0],patron:PANTHEON[0],inside:true,depth:3,city:true,dungeon:true,house:false,
   night:true,hour:22,day:5,road:true,cross:true,terr:"plains",weather:"Гроза",ship:true,
   clan:G.clan,level:6,gold:900,escort:false,atCity:true};
  const bad=[],ran=[];
  const said=[];const orig=Speech.say;Speech.say=t=>said.push(t);
  for(const e of EVENTS){
   let title,text,choices;
   try{title=e.title(c);text=e.text(c);choices=e.choices(c);}
   catch(err){bad.push(e.id+": сборка — "+err.message);continue;}
   if(!title||!text||!Array.isArray(choices)||!choices.length){bad.push(e.id+": пустое событие");continue;}
   if(choices.some(ch=>!ch.l||typeof ch.run!=="function")){bad.push(e.id+": кривой вариант");continue;}
   for(let i=0;i<choices.length;i++){
    // состояние перед выбором восстанавливается, чтобы один не мешал другому
    G.hp=200;G.mana=100;G.gold=900;G.water=200;G.hour=22;G.day=5;
    G.inv["руда"]=6;G.inv["кость"]=3;
    try{choices[i].run();}
    catch(err){bad.push(e.id+" вариант "+(i+1)+": "+err.message);continue;}
    ran.push(e.id+"/"+(i+1));
    if(G.inCombat)try{endCombat();}catch(_){}
    while(activeLayer())try{closeTopUI();}catch(_){break;}
    // проверка целостности после каждого выбора
    const n=v=>typeof v==="number"&&isFinite(v);
    if(!n(G.hp)||G.hp<1)bad.push(e.id+" вариант "+(i+1)+": здоровье "+G.hp);
    if(!n(G.gold)||G.gold<0)bad.push(e.id+" вариант "+(i+1)+": золото "+G.gold);
    if(!n(G.hour)||G.hour<0||G.hour>=24)bad.push(e.id+" вариант "+(i+1)+": час "+G.hour);
    if(!n(G.mana)||G.mana<0)bad.push(e.id+" вариант "+(i+1)+": мана "+G.mana);
    if(!n(G.day)||G.day<1)bad.push(e.id+" вариант "+(i+1)+": день "+G.day);
   }
  }
  Speech.say=orig;
  return {bad,ran:ran.length,said:said.length};});
 check('все выборы всех событий отрабатывают без ошибок',run.bad.length===0,run.bad.slice(0,8));
 check('проверено больше восьмидесяти вариантов',run.ran>=80,{вариантов:run.ran,реплик:run.said});

 // 3. События подбираются по месту: где стоишь, то и случается
 const fit=await page.evaluate(()=>{
  const has=(c,id)=>EVENTS.filter(e=>{try{return e.ok(c);}catch(_){return false;}}).some(e=>e.id===id);
  const road={inside:false,cross:true,road:true,night:false,ship:false,weather:"Ясно",city:false,dungeon:false,
   emp:EMPIRES[0],idx:0,wars:[],foe:null,holy:PANTHEON[0],patron:PANTHEON[0],depth:0,gold:100,clan:null,level:3};
  const deep={...road,inside:true,dungeon:true,depth:3,cross:false,road:false};
  const city={...road,inside:true,city:true,cross:false,road:false,foe:EMPIRES[1],gold:100};
  const sea={...road,ship:true,inside:false,cross:false,road:false,night:true};
  return {
   перекрёсток:has(road,"signpost_turned"),
   подземелье:has(deep,"whispers")&&has(deep,"collapse"),
   не_в_подземелье:!has(road,"whispers"),
   город:has(city,"city_fair")&&has(city,"guard_check"),
   город_не_в_поле:!has(road,"city_fair"),
   море:has(sea,"sea_lights")&&has(sea,"flotsam"),
   море_не_на_суше:!has(road,"flotsam")};});
 check('перекрёсток, подземелье, город и море дают свои события',
  Object.values(fit).every(Boolean),fit);

 // 4. Событие действительно открывается и решается
 const flow=await page.evaluate(()=>{
  G.lastEventAt=0;
  const e=EVENTS.find(x=>x.id==="milestone");
  const c=eventContext();
  openEvent(e,c);
  const open=!!activeLayer()&&activeLayer().id==="modal-event";
  const items=document.querySelectorAll('#eventBody [data-cmd^="evt:"]').length;
  const xp0=G.xp;
  resolveEvent(0);
  const closed=!activeLayer();
  return {open,items,closed,xpРос:G.xp>xp0};});
 check('окно события открывается, выбор закрывает его и меняет мир',
  flow.open&&flow.items>=2&&flow.closed&&flow.xpРос,flow);

 // 5. Новые поводы для событий заведены
 const trig=await page.evaluate(()=>{
  const src=maybeEvent.toString();
  return {cross:/"cross"/.test(src),night:/"night"/.test(src),sea:/"sea"/.test(src),
   вход:/"enter"/.test(src)};});
 check('перекрёсток, ночь и море стали поводами для события',
  trig.cross&&trig.night&&trig.sea&&trig.вход,trig);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
