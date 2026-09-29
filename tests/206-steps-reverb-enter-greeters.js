/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 206: 4.3 — ШАГИ ПОД СВОДОМ И ТОТ, КТО ВСТРЕЧАЕТ НА ПОРОГЕ

   Жалобы игрока (4.2):
   — шаги в храме и в подземельях неестественные;
   — входишь в дом — глашатай говорит о решении совета, и его перебивает
     синтезатор: «шахта разбита, руду не достать»; везде говорится одно и то же;
   — хочется, чтобы при входе кто-то значимый говорил живым голосом.

   1. Шаг в храме и в подземелье — одна запись шага, прошедшая через отклик
      помещения; чужой записи «шаг с эхом» под ним нет; поправка громкости
      этой записи больше не усиливает её вшестнадцатеро.
   2. На улице шаг сухой, как прежде.
   3. У каждого вида места свой встречающий, и его строки есть в пуле.
   4. У ворот замка стражник встречает по славе героя и по времени суток.
   5. При входе — «Вы вошли», встречающий, затем не больше двух сообщений;
      всё встаёт в очередь сразу, без таймеров.
   6. Решение совета — в замке, а не в таверне; о нехватке руды судачат на
      рынке, а не в храме.
   7. Вернулся через минуту — второй раз не встречают.
   8. Встречающие записаны живыми голосами: у каждой роли записаны почти все строки,
      и при включённых голосах строку говорит запись.
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
 await page.evaluate(()=>{
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push({t:String(t),o:Object.assign({},o||{})});return s0(t,o);};
  window.maybeEvent=()=>{};settings.effects=1;G.inCombat=false;G.combat=null;G.ship=null;G.dark=false;G.alt=0;
  safeFn(()=>{Tavern.happen=()=>{};});});

 /* ── 1–2. шаги ── */
 const шаги=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  G.place={kind:"house",stype:"temple",bx:5,by:5,name:"Храм",depth:0,x:2,y:2};safeFn(()=>Room.set());
  G.lastStep=null;playStep("marble");r.храм=G.lastStep&&{reverb:G.lastStep.reverb,layers:G.lastStep.layers};
  G.place={kind:"dungeon",stype:"ruins",bx:5,by:5,name:"Руины",depth:2,x:2,y:2};safeFn(()=>Room.set());
  G.lastStep=null;playStep("cave");r.подземелье=G.lastStep&&{reverb:G.lastStep.reverb,layers:G.lastStep.layers};
  G.lastStep=null;playStep("stairs");r.лестница=G.lastStep&&{reverb:G.lastStep.reverb,layers:G.lastStep.layers};
  G.place=null;safeFn(()=>Room.set());
  G.lastStep=null;playStep("stone");r.улица=G.lastStep&&{reverb:G.lastStep.reverb,layers:G.lastStep.layers};
  r.эхоK=(SOUND_BANK.hero_step_echo.f||[]).map(f=>stepLevelK(f));
  r.слоиЭха=Object.values(STEP_LAYER).filter(x=>x[0]==="hero_step_echo").length;
  await w(200);return r;});
 check('1. в храме, в подземелье и на лестнице шаг идёт через отклик помещения, без чужой записи «шаг с эхом»; её поправка не больше единицы',
  шаги.храм&&шаги.храм.reverb&&шаги.подземелье&&шаги.подземелье.reverb&&шаги.лестница&&шаги.лестница.reverb
  &&![шаги.храм,шаги.подземелье,шаги.лестница].some(x=>x.layers.includes("hero_step_echo"))&&шаги.слоиЭха===0&&шаги.эхоK.every(k=>k<=1.2),шаги);
 check('2. на улице шаг сухой',шаги.улица&&!шаги.улица.reverb,шаги.улица);

 /* ── 3–4. встречающие ── */
 const кто=await page.evaluate(()=>{
  const r={нет:[],роли:{}};
  const виды=["castle","fortress","clanhall","warcamp","citadel","burg","hold","shrine","bazaar","temple","tavern","village","forge","market","school","tower","port","smugglers"];
  const race=(EMPIRES[empireIndexAt(700,700)]||EMPIRES[0]).race;
  const att0=window.attitudeOf;window.attitudeOf=()=>({id:"neutral"});G.hour=12;
  виды.forEach(v=>{const e=enterRole(v,700,700);if(!e||!(LIVE_LINES[e.роль]||[]).length)r.нет.push(v);else r.роли[v]=e.роль+" / "+e.кто;});
  r.разных=new Set(Object.values(r.роли).map(x=>x.split(" / ")[0])).size;
  window.attitudeOf=()=>({id:"hostile"});r.враг=enterRole("castle",700,700).роль;
  window.attitudeOf=()=>({id:"friend"});r.друг=enterRole("castle",700,700).роль;
  window.attitudeOf=()=>({id:"neutral"});G.hour=23;r.ночь=enterRole("castle",700,700).роль;G.hour=12;r.день=enterRole("castle",700,700).роль;
  r.руины=enterRole("ruins",700,700);
  window.attitudeOf=att0;
  /* жрец одного храма — всегда тот же человек */
  const a=enterRole("temple",321,654),b=enterRole("temple",321,654);r.тотЖе=a.жен===b.жен&&a.кто===b.кто;
  let ж=0,м=0;for(let i=0;i<60;i++){const e=enterRole("tavern",100+i*7,200+i*3);e.жен?ж++:м++;}r.ж=ж;r.м=м;
  return r;});
 check('3. у каждого вида места свой встречающий со своими строками; в руинах не встречают; у одного храма всегда тот же жрец; есть и мужчины, и женщины',
  кто.нет.length===0&&кто.разных>=14&&кто.руины===null&&кто.тотЖе&&кто.ж>5&&кто.м>5,кто);
 check('4. у ворот замка: недругу — холодно, своему — тепло, ночью — окрик ночной стражи, днём — обычная встреча',
  кто.враг==="enter_gate_cold"&&кто.друг==="enter_gate_friend"&&кто.ночь==="enter_gate_night"&&кто.день==="enter_castle",кто);

 /* ── 5–7. очередь при входе ── */
 const вход=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  const folk0=Folk.on;Folk.on=()=>false;
  const att0=window.attitudeOf;window.attitudeOf=()=>({id:"cold"});
  const def0=window.prodDeficit;window.prodDeficit=()=>({"железная руда":0.8});
  const br0=ProdEcon.broken;ProdEcon.broken=()=>[{n:"Шахта"}];
  const войти=(stype,x,y)=>{while(activeLayer())closeTopUI();G.place=null;G.x=x;G.y=y;SAID.length=0;
   const ok=enterPlace({x,y,structure:{type:stype,name:"Место"},terrain:["plains"]});
   /* от «Вы вошли»: до него может прозвучать «Узнано: карта…» */
   const i=Math.max(0,SAID.findIndex(s=>/^Вы вошли/.test(s.t)));
   return {ok,said:SAID.slice(i).map(s=>s.t),opts:SAID.slice(i).map(s=>s.o),итог:lastEnterAnnounce};};
  G.hour=12;
  /* таверна: совета нет, нехватка есть, встречает трактирщик */
  G.council={};
  r.таверна=войти("tavern",410,420);
  await w(3800);r.таверна.позже=SAID.map(s=>s.t).filter(t=>!r.таверна.said.includes(t));
  /* храм: о нехватке не судачат */
  r.храм=войти("temple",430,440);
  /* замок: совет объявляют */
  G.council={};
  r.замок=войти("castle",450,460);
  /* вернулся через миг — не встречают */
  r.снова=войти("tavern",410,420);
  window.attitudeOf=att0;window.prodDeficit=def0;ProdEcon.broken=br0;Folk.on=folk0;
  G.place=null;
  return r;});
 const t=вход.таверна,хр=вход.храм,зм=вход.замок;
 const позиция=(arr,re)=>arr.findIndex(s=>re.test(s));
 check('5. при входе: сначала «Вы вошли», за ним встречающий, затем не больше двух сообщений — всё сразу в очереди, ничего по таймеру',
  t.ok&&/^Вы вошли/.test(t.said[0]||"")&&/^(Трактирщик|Трактирщица): «/.test(t.said[1]||"")&&t.said.length<=4
  &&t.opts.slice(1).every(o=>o.interrupt===false)&&t.позже.filter(s=>/Здесь говорят|Совет|косо/.test(s)).length===0
  &&/^(Жрец|Жрица): «/.test(хр.said[1]||"")&&/^Стражник у ворот: «/.test(зм.said[1]||""),{t,хр:хр.said,зм:зм.said});
 check('6. в таверне нет решения совета, но судачат о нехватке; в храме о нехватке молчат; в замке совет объявлен',
  !t.итог.ещё.includes("council")&&t.итог.ещё.includes("deficit")&&позиция(t.said,/Здесь говорят об одном/)>1
  &&!хр.итог.ещё.includes("deficit")&&позиция(хр.said,/не достать/)<0
  &&зм.итог.ещё.includes("council"),{т:t.итог,х:хр.итог,з:зм.итог});
 check('7. вернулся сразу — второй раз не встречают',вход.снова.ok&&!вход.снова.итог.t&&вход.снова.said.every(s=>!/^Трактир/.test(s)),вход.снова.итог);

 /* ── 8. живые голоса ── */
 const живые=await page.evaluate(()=>{
  const r={доля:{}};
  Object.values(ENTER_WHO).map(w=>w.роль).concat(["enter_gate_cold","enter_gate_friend","enter_gate_night"]).forEach(роль=>{
   const все=LIVE_LINES[роль]||[];r.доля[роль]=все.length?все.filter(t=>liveRecorded(роль,t)).length/все.length:0;});
  r.мин=Math.min(...Object.values(r.доля));
  const f0=Folk.реплика.bind(Folk);const вызовы=[];
  Folk.реплика=function(роль,t,n,ж,o){вызовы.push({роль,t,ж,голос:o&&o.голос});return f0(роль,t,n,ж,o);};
  const on0=Folk.on;Folk.on=()=>true;
  enterGreetSeen={};let e=null;
  for(let i=0;i<12&&!(e&&e.сказал);i++){enterGreetSeen={};e=enterGreet("temple",600+i,600);}
  enterGreetSeen={};let g=null;
  for(let i=0;i<12&&!(g&&g.сказал);i++){enterGreetSeen={};g=enterGreet("fortress",620+i,600);}
  Folk.on=on0;Folk.реплика=f0;
  r.храм=e&&{сказал:e.сказал,текст:e.текст};r.крепость=g&&{сказал:g.сказал,текст:g.текст};
  r.вызовы=вызовы.slice(-2);
  return r;});
 check('8. встречающие записаны живыми голосами (у каждой роли записано не меньше 80% строк); запись звучит, а голос игры молчит',
  живые.мин>=0.8&&живые.храм&&живые.храм.сказал&&живые.храм.текст===""&&живые.крепость&&живые.крепость.сказал
  &&живые.вызовы.some(v=>/^enter_temple$/.test(v.роль))&&живые.вызовы.some(v=>/^enter_fort$/.test(v.роль)&&Number.isInteger(v.голос)),живые);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
