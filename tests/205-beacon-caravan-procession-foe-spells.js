/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 205: 4.2 — МАЯК, КАРАВАН И ПРОЦЕССИЯ В ДВИЖЕНИИ, ЧАРЫ ТВАРЕЙ

   Жалобы игрока (4.1):
   — маяк слышно, но не ярко; его нельзя быстро погасить;
   — у запуска и остановки маяка нет своего звука;
   — караван говорит «трогаемся», а звука отъезда нет; едущего навстречу не слышно;
   — процессию костяных шаманов почти не слышно;
   — чары тварей называет голос, а звука нет; разные чары звучат одинаково.

   1. Удар маяка — во всю громкость, без приглушения стеной; у запуска и
      остановки свои звуки.
   2. Свайп четырьмя пальцами вверх гасит маяк; вниз — речь, как прежде.
   3. Процессия проходит мимо: шаги от одной стороны к другой и стук костей.
   4. Пропущенный обоз уезжает: шаги и колёса уходят от героя; обоз на
      тракте в шести шагах слышен копытами.
   5. Тварь в подземелье ступает на каждом ходу шагом своего рода.
   6. Чары тварей разных стихий звучат разными записями: сбор, полёт, удар.
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
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};
  window.AT=[];const sa=Spatial.at.bind(Spatial);Spatial.at=function(f,dx,dy,o){AT.push({f,dx,dy,o:Object.assign({},o||{}),t:Date.now()});return sa(f,dx,dy,o);};
  window.ROLES=[];const sr=Spatial.role.bind(Spatial);Spatial.role=function(r,dx,dy,o){ROLES.push({r,dx,dy,t:Date.now()});return sr(r,dx,dy,o);};
  window.BANK=[];const bp=Bank.play.bind(Bank);Bank.play=function(r,o){BANK.push(r);return bp(r,o);};
  window.maybeEvent=()=>{};settings.effects=1;settings.hrtf=1;G.inCombat=false;G.combat=null;G.ship=null;G.dark=false;});
 const пауза=ms=>page.waitForTimeout(ms);

 /* ── 1–2. маяк ── */
 const маяк=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  G.place=null;while(activeLayer())closeTopUI();
  settings.targetBeacon="constant";
  BANK.length=0;
  TargetBeacon.start({n:"сундук",x:G.x+6,y:G.y,bid:"chest"});
  await w(400);const запуск=BANK.slice();
  AT.length=0;TargetBeacon.n=1;TargetBeacon.ping({dx:6,dy:0,d:6},false);
  const удар=AT.find(a=>/bell_small/.test(a.f));
  BANK.length=0;SAID.length=0;
  handleFourFingerSwipe("N");await w(400);
  const погас=!TargetBeacon.t,остановка=BANK.slice(),слово=SAID.join(" ");
  SAID.length=0;handleFourFingerSwipe("N");const нет=SAID.join(" ");
  return {запуск,удар:удар&&{gain:удар.o.gain,occl:удар.o.occl,roll:удар.o.roll},погас,остановка,слово,нет,
   жест:GEST_DEFAULTS["4swipeN"],вниз:GEST_DEFAULTS["4swipeS"],настройки:!!document.getElementById("setStopGesture")};});
 check('1. удар маяка — во всю громкость и без приглушения стеной; запуск — перезвон и колокольчик, остановка — свой звук',
  маяк.удар&&маяк.удар.gain===1&&маяк.удар.occl===0&&маяк.запуск.includes("magic_shimmer")&&маяк.запуск.includes("bell_small")&&маяк.остановка.includes("bell_small"),маяк);
 check('2. четыре пальца вверх гасят маяк («снят»), без маяка — объяснение; вниз — речь; настройки, менявшей жесты, нет',
  маяк.погас&&/снят/.test(маяк.слово)&&/не горит/.test(маяк.нет)&&маяк.жест==="beaconoff"&&маяк.вниз==="repeat"&&!маяк.настройки,маяк);

 /* ── 3. процессия ── */
 const шествие=await page.evaluate(async()=>{
  const тик0=CaravanRoll.tick;CaravanRoll.tick=()=>false;
  ROLES.length=0;PassBy.run("funeral","мимо",{сек:3,сторона:1});
  await new Promise(r=>setTimeout(r,3300));
  CaravanRoll.tick=тик0;
  const шаги=ROLES.filter(x=>x.r==="tread_gravel"),кости=ROLES.filter(x=>x.r==="foe_bone_hit");
  return {шагов:шаги.length,кости:кости.length,первый:шаги[0]&&шаги[0].dx,последний:шаги.length&&шаги[шаги.length-1].dx};});
 check('3. процессия костяных шаманов проходит мимо: шаги от одной стороны к другой, стук костей',
  шествие.шагов>=6&&шествие.кости>=1&&шествие.первый>3&&шествие.последний<-3,шествие);

 /* ── 4. караван ── */
 const обоз=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const тик=CaravanRoll.tick;CaravanRoll.tick=()=>false;const тик2=PatrolMarch.tick;PatrolMarch.tick=()=>false;
  ROLES.length=0;PassBy.run("caravan","прочь",{сек:3,сторона:-1});await w(3300);
  CaravanRoll.tick=тик;PatrolMarch.tick=тик2;
  const шаги=ROLES.filter(x=>x.r==="tread_hoof"),колёса=ROLES.filter(x=>x.r==="mtg_cart");
  const уезжает=шаги.length>=4&&Math.abs(шаги[шаги.length-1].dx)>Math.abs(шаги[0].dx)+3;
  /* обоз на тракте рядом */
  let car=null;for(let d=1;d<60&&!car;d++)for(let x=40;x<WORLD-40&&!car;x+=5){const l=caravansNear(x,x,d,12,5);const c=l.find(z=>z.d>0);if(c)car={x,d};}
  let рядом=null;
  if(car){G.x=car.x;G.y=car.x;G.day=car.d;G.hour=12;G.place=null;ROLES.length=0;CaravanRoll.шагДо=0;CaravanRoll.колёсаДо=0;CaravanRoll.tick();await w(1700);
   рядом={копыт:ROLES.filter(x=>x.r==="tread_hoof").length,колёса:ROLES.filter(x=>x.r==="mtg_cart").length,last:CaravanRoll.last};}
  return {шагов:шаги.length,колёс:колёса.length,уезжает,рядом};});
 check('4. пропущенный обоз уезжает — копыта и колёса уходят от героя; обоз на тракте в шести шагах слышен копытами и колёсами',
  обоз.уезжает&&обоз.колёс>=1&&обоз.рядом&&обоз.рядом.копыт>=2&&обоз.рядом.колёса>=1,обоз);

 /* ── 5. шаг твари ── */
 const тварь=await page.evaluate(()=>{
  const L={w:9,h:5,g:["#########","#.......#","#.......#","#.......#","#########"].map(r=>r.split(""))};
  window.curLevel=()=>L;G.place={kind:"dungeon",bx:3,by:3,stype:"ruins",name:"м",depth:2,x:2,y:2};
  const m=MONSTERS.find(x=>/skeleton/.test(x.id))||MONSTERS[0];
  const a={id:7,kind:"mob",x:5,y:2,m,name:m.n};Actors.list=[a];
  const out=[];for(let i=0;i<6;i++){ROLES.length=0;Actors.sound(a,3);out.push(ROLES.length);}
  return {m:m.id,каждый:out.every(n=>n>=1),last:Actors.lastMobStep};});
 check('5. тварь в подземелье ступает на каждом ходу шагом своего рода и громче прежнего',
  тварь.каждый&&тварь.last&&тварь.last.gain>=0.6,тварь);

 /* ── 6. чары ── */
 const чары=await page.evaluate(()=>{
  const виды={};
  [{id:"dragon",n:"Дракон"},{id:"icewolf",n:"Ледяной волк"},{id:"lich",n:"Лич"},{id:"spider",n:"Паук"},{id:"stormhawk",n:"Грозовой ястреб"},{id:"gnome",n:"Гном-чародей"}]
   .forEach(m=>{const k=foeSpellKind(m);виды[m.id]={k,сбор:FOE_SPELL[k].сбор,удар:FOE_SPELL[k].удар};});
  const разные=new Set(Object.values(виды).map(v=>v.сбор)).size;
  const есть=Object.values(FOE_SPELL).every(v=>Bank.has(v.сбор)&&Bank.has(v.удар)&&Bank.has(v.полёт));
  return {виды,разные,есть};});
 check('6. чары тварей разных стихий звучат разными записями, и все записи есть в банке',
  чары.разные>=6&&чары.есть&&чары.виды.dragon.k==="fire"&&чары.виды.lich.k==="dark",чары);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
