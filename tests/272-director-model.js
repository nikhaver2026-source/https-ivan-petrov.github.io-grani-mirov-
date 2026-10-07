/* Режиссёр Грани 2: обучаемая и генеративная модель мира.
   Просьба игрока: «расширенную версию — генеративную и обучаемую модель
   Режиссёра Грани для мира». Набор проверяет:
   — признаки положения и контекстный бандит LinUCB: в разных положениях
     модель учится выбирать разные события;
   — прогноз победы (логистическая регрессия) учится на исходах схваток, и
     по нему Режиссёр держит долю побед у цели;
   — марковская цепь имён рождает новые имена Грани;
   — восемь видов поручений мира выдаются, засчитываются своими делами и
     награждают; вкус к поручениям учится; просроченное — наказывается;
   — четыре сюжетные арки начинаются и завершаются;
   — новые события мира, сутки мира, окна «Модель мира» и «Поручения мира». */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.GraniTTS={speak(t,r,v,id){setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};G.dir=null;settings.director="normal";});

 /* ── 1. признаки и бандит ── */
 const бандит=await p.evaluate(()=>{const r={};const x=Director.feats();r.длина=x.length;r.числа=x.every(v=>Number.isFinite(v)&&v>=0&&v<=1.0001);
  const ночь=x.slice();ночь[3]=1;const день=x.slice();день[3]=0;
  for(let i=0;i<40;i++){for(const a of DIR2_ARMS){Director.learnLin(a,ночь,a==="omen"?1:0);Director.learnLin(a,день,a==="caravan"?1:0);}}
  r.ночью=Director.pickLin(ночь);r.днём=Director.pickLin(день);r.изучено=Director.st2().ml.lin.omen.n;
  return r;});
 check('1. двенадцать признаков положения от 0 до 1; контекстный бандит учится: ночью — знамения, днём — караваны',
  бандит.длина===12&&бандит.числа&&бандит.ночью==="omen"&&бандит.днём==="caravan"&&бандит.изучено===80,бандит);

 /* ── 2. прогноз победы и подстройка по нему ── */
 const прогноз=await p.evaluate(()=>{const r={};const s=Director.st2();s.ml.w=null;Director.st2();
  const wolf=lv=>Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:lv,hp:100,dmg:10});
  r.слабый0=Director.winP(wolf(G.level));r.сильный0=Director.winP(wolf(G.level+8));
  for(let i=0;i<80;i++){Director.learnWin(Director.fightFeats(wolf(G.level)),1);Director.learnWin(Director.fightFeats(wolf(G.level+8)),0);}
  r.слабый=Director.winP(wolf(G.level));r.сильный=Director.winP(wolf(G.level+8));r.схваток=s.ml.nw;
  const rnd=Math.random;Math.random=()=>0.99;
  try{s.relax=0;s.tension=0;s.nem=[];s.school={};const a=wolf(G.level);Director.onCombat(a,{});r.hpЛёгкой=a.hp;r.p=a.dirP;
   const b=wolf(G.level+8);Director.onCombat(b,{});r.hpТрудной=b.hp;
   settings.director="off";const c=wolf(G.level);Director.onCombat(c,{});r.hpВыкл=c.hp;settings.director="normal";}finally{Math.random=rnd;}
  return r;});
 check('2. прогноз победы учится на исходах: различает слабую и сильную тварь, над сильной прогноз падает',
  (прогноз.слабый-прогноз.сильный)>(прогноз.слабый0-прогноз.сильный0)+0.3&&прогноз.сильный<прогноз.сильный0&&прогноз.слабый>0.85&&прогноз.сильный<0.25&&прогноз.схваток===160,прогноз);
 check('2б. по прогнозу Режиссёр держит цель: лёгкую тварь делает крепче, трудную — слабее (в пределах силы); выключен — не трогает',
  прогноз.hpЛёгкой>100&&прогноз.hpЛёгкой<=121&&прогноз.hpТрудной<100&&прогноз.hpТрудной>=79&&прогноз.hpВыкл===100,прогноз);

 /* ── 3. имена ── */
 const имена=await p.evaluate(()=>{const M=Director.nameModel();const a=[];for(let i=0;i<30;i++)a.push(Director.genName());
  return {корпус:M.n,имена:a.slice(0,8),уник:new Set(a).size,кириллица:a.every(n=>/^[А-ЯЁ][а-яё]{3,9}$/.test(n)),новые:a.every(n=>!M.set.has(n.toLowerCase()))};});
 check('3. марковская цепь по именам Грани рождает новые имена: кириллица, 4–10 букв, разные, не повторяют корпус',
  имена.корпус>100&&имена.кириллица&&имена.новые&&имена.уник>=20,имена);

 /* ── 4. поручения ── */
 const пор=await p.evaluate(()=>{const r={};const s=Director.st2();s.q=[];s.qdone=[];for(const k of Object.keys(s.qpref))s.qpref[k]=0;
  G.place=null;G.inCombat=false;
  const g0=G.gold;
  /* охота */
  const h=Director.qMake("hunt",{fam:"beast"});h.need=2;r.охота=h.n;
  Director.onWin(Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:1}));Director.onWin(Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:1}));
  r.охотаГотова=!s.q.includes(h);
  /* приручение, опыт, молитва */
  Director.qMake("tame");Director.note("tame","зверь");Director.qMake("mix");Director.note("mix");
  const pr=Director.qMake("pray",{god:"storm"});Director.note("pray","zarya");r.чужойБог=s.q.includes(pr);Director.note("pray","storm");
  r.молитваОбёрнута=String(prayToGod).indexOf("Director.note")>=0;
  /* дальний путь, спуск */
  const tr=Director.qMake("travel");tr.need=5;G.x+=6;Director.tick();r.путь=!s.q.includes(tr);G.x-=6;
  const dn=Director.qMake("dungeon");G.place={kind:"dungeon",bx:G.x,by:G.y,depth:1,x:1,y:1};Director.tick();G.place=null;r.спуск=!s.q.includes(dn);
  /* машина и мститель */
  s.sites={zz:{x:G.x,y:G.y,род:"тайник",день:G.day}};const st=Director.qMake("site");Director.siteCheck();r.машина=!s.q.includes(st);
  s.nem=[{id:"nX",base:"wolf",n:"Волк Проверочный",рост:1,день:G.day}];const nq=Director.qMake("nemesis");
  const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:1,zvNem:"nX"});Director.onWin(m);r.мститель=!s.q.includes(nq);
  r.исполнено=s.qdone.length;r.золото=G.gold-g0;r.осталось=s.q.map(q=>q.type);
  r.вкус=Object.assign({},s.qpref);
  /* просрочка */
  const late=Director.qMake("mix");late.до=G.day-1;Director.qExpire();r.просрочено=!s.q.includes(late);r.вкусОпыта=s.qpref.mix;
  r.предел=(()=>{s.q=[];for(let i=0;i<5;i++)Director.qMake("mix")||Director.qMake("tame")||Director.qMake("travel")||Director.qMake("dungeon");return s.q.length;})();
  return r;});
 check('4. восемь видов поручений исполняются своими делами: охота на род, приручение, опыт, молитва (только своему богу), путь, спуск, машина, мститель',
  пор.охотаГотова&&пор.чужойБог&&пор.путь&&пор.спуск&&пор.машина&&пор.мститель&&пор.исполнено===8&&пор.осталось.length===0&&пор.молитваОбёрнута,пор);
 check('4б. исполненное награждает и поднимает вкус к своему виду; просроченное снимается и вкус опускает; поручений не больше трёх',
  пор.золото>200&&пор.вкус.hunt>0&&пор.вкус.travel>0&&пор.просрочено&&пор.вкусОпыта<пор.вкус.mix&&пор.предел===3,пор);

 /* ── 5. сюжетные арки ── */
 const арки=await p.evaluate(()=>{const r={};const s=Director.st2();s.q=[];s.arcs=[];
  r.гнев=Director.arcStart("wrath");const a=s.arcs[0];const q=s.q.find(x=>x.arc===a.id);r.поручение=q&&q.type;
  Director.note("pray",a.god);r.милость=s.world.gods[a.god];r.аркаКончилась=!s.arcs.length;
  r.колосс=Director.arcStart("colossus");const c=s.arcs[0];r.машинаКолосса=!!s.sites[c.site];
  r.миграция=Director.arcStart("migration");r.третья=Director.arcStart("shadow");r.арок=s.arcs.length;
  const qq=s.q.find(x=>x.arc===c.id);qq.до=G.day-1;Director.qExpire();r.оборвалась=!s.arcs.some(x=>x.id===c.id);
  return r;});
 check('5. сюжетные арки: «Гнев бога» — знамение, поручение молитвы, милость; «Колосс» ставит машину на карту; не больше двух сразу; просрочка обрывает',
  /гневается/.test(арки.гнев)&&арки.поручение==="pray"&&арки.милость===30&&арки.аркаКончилась&&/колосс/.test(арки.колосс)&&арки.машинаКолосса&&арки.арок===2&&арки.третья===""&&арки.оборвалась,арки);

 /* ── 6. события и сутки мира ── */
 const сутки=await p.evaluate(()=>{const r={};const s=Director.st2();s.q=[];s.arcs=[];
  for(const a of ["rumor","quest","caravan","omen","arc"]){const t=Director["ev_"+a]();r[a]=typeof t==="string"&&t.length>20;}
  const n0=DIR2_ARMS.reduce((t,a)=>t+s.ml.lin[a].n,0);s.lastArm="rumor";s.lastX=Director.feats();s.played=60;s.day=G.day;
  G.day+=1;Director.tick();G.day-=1;s.day=G.day;r.учится=DIR2_ARMS.reduce((t,a)=>t+s.ml.lin[a].n,0)>n0;r.выбрано=DIR2_ARMS.indexOf(s.lastArm)>=0;
  return r;});
 check('6. пять новых событий мира (слух, поручение, караван, знамение, сюжет); сутки мира учат бандита и выбирают событие из десяти сфер',
  Object.values(сутки).every(Boolean),сутки);

 /* ── 7. окна ── */
 const окна=await p.evaluate(()=>{const r={};
  Director.home();const b=document.getElementById("dirBody");r.кнопки=["dir:model","dir:quests"].every(c=>!!b.querySelector(`[data-cmd="${c}"]`));
  CMD.dir("model");r.модель=b.textContent;CMD.dir("quests");r.поручения=b.textContent.length;CMD.dir("newq");r.попросить=Director.st2().q.length>=1;
  while(activeLayer())closeTopUI();return r;});
 check('7. окна «Модель мира» (прогноз победы, чему научилась модель, вкус к поручениям, имена) и «Поручения мира»',
  окна.кнопки&&/Прогноз победы/.test(окна.модель)&&/Вкус к поручениям/.test(окна.модель)&&/марковская цепь/.test(окна.модель)&&окна.поручения>60&&окна.попросить,{кнопки:окна.кнопки,поручения:окна.поручения,попросить:окна.попросить,модель:окна.модель.slice(0,300)});

 check('8. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
