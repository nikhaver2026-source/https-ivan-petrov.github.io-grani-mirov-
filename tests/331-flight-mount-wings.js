/* ════════════════════════════════════════════════════════════════════════
   НАБОР 331: ПОЛЁТ ВЕРХОМ — БЫСТРЕЕ И СВОИМ КРЫЛОМ (после 16.0, просьба
   игрока: «при полёте перемещение тоже должно идти быстрее и должен быть
   слышен звук самого полёта — крыльев: у феникса свой, у другого летучего —
   свой; у ползающего маунта — свой звук»)

   1. Верхом на летучем скакуне в небе шаг — три клетки (пешком в небе —
      одна), и каждая клетка звучит взмахом крыла этого скакуна, без копыт.
   2. Взмахи одного действия идут один за другим, а не разом.
   3. Свои крылья героя слышны каждым взмахом, у каждого народа свои:
      феникс — крыло с треском пламени, дракониды — перепонка.
   4. Взлёт верхом на летучем — крылом скакуна.
   5. На земле: ползающий скакун звучит своим ползанием, клетки одного
      действия — по очереди.
   6. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.effects=1;G.hour=12;try{Speech.primed=true;}catch(_){}
  AE.ensure();Room.ensure();
  /* что и когда зазвучало из звуков зверей */
  window.__зв=[];const a0=ZvSnd.at;ZvSnd.at=function(f){__зв.push({f:String(f),t:performance.now()});return a0.apply(this,arguments);};
  window.__банк=[];const b0=Bank.play;Bank.play=function(r){__банк.push(String(r));return b0.apply(this,arguments);};
  /* полоса пустого неба и земли на восток */
  const пусто=(x,y)=>{const c=cellContent(x,y);return !c.structure&&!c.monster&&!c.res&&!/water|sea|lake|ocean|river/.test(String(c.terrain&&c.terrain[0]));};
  let y0=null,x0=null;for(let y=3000;y<3600&&y0==null;y+=7)for(let x=3000;x<3400;x+=11){let ok=true;for(let k=0;k<=12;k++)if(!пусто(x+k,y)){ok=false;break;}if(ok){x0=x;y0=y;break;}}
  window.__полоса={x0,y0};G.place=null;G.ship=null;G.alt=0;window.skyWeather=()=>({снос:0,словом:""});
  const s=Zver.st();s.list=[];s.pets=[];s.mount=null;G.mount=null;G.vy165={звер:{xp:0,предел:4},езда:{xp:6*9+1,предел:4}};});
 const полоса=await p.evaluate(()=>__полоса);
 check("0. Нашлась полоса пустой земли",полоса.x0!=null,полоса);

 /* ── 1–2, 4. Летучий скакун ── */
 const л=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};const {x0,y0}=__полоса;
  const rnd=Math.random;Math.random=()=>0.99;
  try{
   const пег=Zver.make("pegasus_wild",{тихо:true});пег.верн=90;пег.сыт=90;o.сел=Zver.ride(пег.uid);o.верхом=!!Stable.riding();o.ход=Stable.moveOf(ZvWalk.mount());
   G.x=x0;G.y=y0;G.alt=0;G.wingTired=0;__банк.length=0;o.взлёт=takeOff();o.высота=G.alt;o.взлётЗвук=__банк.slice(0,3);
   await w(1600);__зв.length=0;G.x=x0;G.y=y0;G.atDoor=null;while(activeLayer())closeTopUI();move("E");o.клеток=G.x-x0;o.всё=inFlight();
   await w(700);o.звуки=__зв.map(z=>z.f.split("/").pop());const к=__зв.filter(z=>/wing/.test(z.f));o.взмахов=к.length;
   o.промежутки=к.slice(1).map((z,i)=>Math.round(z.t-к[i].t));o.копыта=__зв.filter(z=>/ride_walk|hoof|horse_step|ride_trot|ride_gallop/.test(z.f)).length;
   const prof=ZvSnd.prof(пег);o.свои=(Полёт165.РОД.pegasus.к).concat(prof.е||[],prof.ш||[]);
  }finally{Math.random=rnd;}
  return o;});
 check("1. Верхом на летучем в небе шаг — три клетки, каждая — взмахом крыла этого скакуна",
  л.верхом&&л.ход==="fly"&&л.взлёт&&л.высота>=1&&л.клеток===3&&л.всё&&л.взмахов>=3&&л.копыта===0,л);
 check("2. Взмахи одного действия — один за другим, не разом",
  л.промежутки.length>=2&&л.промежутки.every(d=>d>=90),л.промежутки);
 const крыльяФайлы=await p.evaluate(()=>["zv_wing","raptor_wing","wyrm_wing"].map(r=>(SOUND_BANK[r]&&SOUND_BANK[r].f||[]).map(f=>f.split("/").pop())));
 check("4. Взлёт верхом на летучем — крылом скакуна",
  л.взлётЗвук.length>0&&/zv_wing/.test(л.взлётЗвук[0]),{взлёт:л.взлётЗвук,крылья:крыльяФайлы[0]});

 /* ── 3. Свои крылья ── */
 const н=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};const {x0,y0}=__полоса;
  const s=Zver.st();s.mount=null;G.mount=null;const раса0=G.race;
  const лёт=async(раса)=>{G.race=раса;G.x=x0;G.y=y0;G.alt=1;G.wingTired=0;Полёт165.n=0;await w(200);__зв.length=0;
   for(let i=0;i<3;i++){G.atDoor=null;while(activeLayer())closeTopUI();move("E");await w(150);}await w(400);
   return {клеток:G.x-x0,звуки:__зв.map(z=>z.f.split("/").pop())};};
  try{o.феникс=await лёт("Фениксы");o.драконид=await лёт("Дракониды");}finally{G.race=раса0;G.alt=0;}
  o.огонь=["ad_fire_crackle","lug_fire","oc_inflame"].flatMap(r=>(SOUND_BANK[r]&&SOUND_BANK[r].f||[]).map(f=>f.split("/").pop()));
  o.перепонка=(SOUND_BANK.wyrm_wing.f||[]).map(f=>f.split("/").pop());o.птица=(SOUND_BANK.zv_wing.f||[]).map(f=>f.split("/").pop());
  return o;});
 const есть=(список,файлы)=>список.some(f=>файлы.includes(f));
 check("3. Свои крылья слышны каждым взмахом: феникс — крыло с пламенем, драконид — перепонка",
  н.феникс.клеток===3&&н.феникс.звуки.filter(f=>н.птица.includes(f)).length>=3&&есть(н.феникс.звуки,н.огонь)&&
  н.драконид.звуки.filter(f=>н.перепонка.includes(f)).length>=3&&!есть(н.драконид.звуки,н.огонь),н);

 /* ── 5. Ползающий скакун ── */
 const п=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};const {x0,y0}=__полоса;
  const rnd=Math.random;Math.random=()=>0.99;
  try{G.alt=0;G.vy165={звер:{xp:0,предел:4},езда:{xp:6*36+1,предел:6}};
   const жук=Zver.make("beetle_wild",{тихо:true});жук.верн=90;жук.сыт=90;o.сел=Zver.ride(жук.uid);o.ход=Stable.moveOf(ZvWalk.mount());
   await w(200);__зв.length=0;G.x=x0;G.y=y0;G.atDoor=null;while(activeLayer())closeTopUI();move("E");o.клеток=G.x-x0;await w(700);
   const prof=ZvSnd.prof(жук);const свои=(prof.е||prof.ш||[]).flatMap(r=>String(r).indexOf("/")>=0?[r.split("/").pop()]:(SOUND_BANK[r]&&SOUND_BANK[r].f||[]).map(f=>f.split("/").pop()));
   const мои=__зв.filter(z=>свои.includes(z.f.split("/").pop()));o.своих=мои.length;o.промежутки=мои.slice(1).map((z,i)=>Math.round(z.t-мои[i].t));
   o.звуки=__зв.map(z=>z.f.split("/").pop());o.свои=свои;
  }finally{Math.random=rnd;G.vy165=null;Zver.st().mount=null;}
  return o;});
 check("5. Ползающий скакун звучит своим ползанием; клетки одного действия — по очереди",
  п.ход==="crawl"&&п.клеток>=2&&п.своих>=п.клеток&&п.промежутки.length>=1&&п.промежутки.every(d=>d>=90),п);

 check("6. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();
