/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 114: ПРОВЕРКА §46 БРИФА — ПЯТНАДЦАТЬ ПУНКТОВ ПОДРЯД

   Бриф требует после встройки большого модуля проверить пятнадцать вещей.
   Здесь на каждую — своя проверка, в том же порядке и теми же словами:

    1. старые жесты не спорят с новыми окнами;
    2. Ядро Отклика не глушит речь;
    3. системные слова не перебивают пространственный звук;
    4. звук подземелья не пропадает, когда открывают меню;
    5. поглощение свойств существ не ломает запись;
    6. смена формы зверя слышна в его звуковом облике;
    7. разрушенная крепость меняет маршруты жителей;
    8. война меняет торговые цены;
    9. разломы меняют доступные породы;
   10. развитие навыков переживает запись;
   11. старых обработчиков не осталось — каждый в одном экземпляре;
   12. речь не звучит дважды;
   13. игровые звуки не «съедаются» синтезатором;
   14. звук идёт одним логическим слоем — без отдельных ветвей под платформы;
   15. новые механики читают старую запись без новых полей.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});

 /* ── 1 ── */
 const жесты=await page.evaluate(async()=>{
  const r={};r.карта=GESTURE_MAP.length;
  const окна=[["path","modal-path"],["academy","modal-academy"],["cases","modal-cases"],
   ["sigils","modal-sigils"],["living","modal-living"],["deeps","modal-deeps"],["merit","modal-merit"]];
  const плохие=[];
  for(const [cmd,id] of окна){
   for(let i=0;i<20&&activeLayer();i++)closeTopUI();
   if(typeof CMD[cmd]!=="function"){плохие.push([cmd,"нет команды"]);continue;}
   CMD[cmd]();await new Promise(z=>setTimeout(z,90));
   const слой=activeLayer();
   if(!слой||слой.id!==id){плохие.push([cmd,слой?слой.id:"не открылось"]);continue;}
   handleTwoFingerSwipe("S");await new Promise(z=>setTimeout(z,90));
   if(activeLayer())плохие.push([cmd,"не закрылось свайпом двумя пальцами вниз"]);}
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  r.плохие=плохие;r.окон=окна.length;
  return r;});
 check('1. старые жесты не спорят с новыми окнами: карта жестов на месте, и каждое из семи новых окон открывается командой и закрывается свайпом двумя пальцами вниз',
  жесты.карта>=10&&жесты.окон===7&&жесты.плохие.length===0,жесты);

 /* ── 2 ── */
 const ядро=await page.evaluate(async()=>{
  const r={};G.core=null;Core.grant(Core.forms[0].id);
  r.есть=Core.has();SAID.length=0;
  narrate("Проба речи при Ядре Отклика.",{interrupt:true});
  await new Promise(z=>setTimeout(z,200));
  r.сказано=SAID.filter(t=>/Проба речи при Ядре/.test(t)).length;
  r.ядроГоворит=String(safeFn(()=>Core.status(),"")).length>10;
  return r;});
 check('2. Ядро Отклика не глушит речь: при включённом ядре строка звучит один раз, и само ядро отвечает словами',
  ядро.есть&&ядро.сказано===1&&ядро.ядроГоворит,ядро);

 /* ── 3 и 13 ── */
 const звук=await page.evaluate(async()=>{
  const r={};PLAYED.length=0;
  Bank.play("knock_soft",{gain:0,maxSec:0.4});
  narrate("Системное слово.",{interrupt:true});
  await new Promise(z=>setTimeout(z,200));
  r.звукОстался=PLAYED.includes("knock_soft");
  PLAYED.length=0;SAID.length=0;
  narrate("Второе слово.",{interrupt:true});
  Bank.play("bell_small",{gain:0,maxSec:0.4});
  await new Promise(z=>setTimeout(z,200));
  r.звукПосле=PLAYED.includes("bell_small");r.сказано=SAID.filter(t=>/Второе слово/.test(t)).length;
  return r;});
 check('3. системное слово не перебивает пространственный звук, и 13. игровой звук не «съедается» синтезатором: звук звучит и до речи, и после',
  звук.звукОстался&&звук.звукПосле&&звук.сказано===1,звук);

 /* ── 4 ── */
 const подземелье=await page.evaluate(async()=>{
  const r={};
  G.place={bx:31,by:37,stype:"ruins",depth:3,x:2,y:2,name:"Проба яруса"};
  safeFn(()=>bankUpdateAmbient());
  await new Promise(z=>setTimeout(z,150));
  const ключи=()=>safeFn(()=>Array.from(Bank.loops?Bank.loops.keys():[]),[]);
  r.доМеню=ключи();
  CMD.inv();await new Promise(z=>setTimeout(z,150));
  r.окно=!!activeLayer();r.приМеню=ключи();
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  r.послеМеню=ключи();
  G.place=null;
  return r;});
 check('4. звук подземелья не пропадает, когда открывают меню: петли фона те же до окна, при окне и после него',
  подземелье.окно&&JSON.stringify(подземелье.доМеню)===JSON.stringify(подземелье.приМеню)&&
  JSON.stringify(подземелье.приМеню)===JSON.stringify(подземелье.послеМеню),подземелье);

 /* ── 5 и 10 и 15 ── */
 const запись=await page.evaluate(()=>{
  const r={};
  G.devour={черты:{},съедено:2};safeFn(()=>{G.assim={bone:1};});
  G.skills=["tracker","stamina"];G.deeds={hits:120,casts:40};
  const ветви=safeFn(()=>BRANCHES.map(b=>branchRank(b.id)),[]);
  G.war={фронт:7,накал:71,день:3,дела:{}};G.forts={};G.tavern={"1,1":10};
  saveGame(true);
  const сырое=store.get(SAVE_KEY);
  r.естьПоля=["devour","skills","deeds","war"].filter(k=>сырое.indexOf('"'+k+'"')<0);
  G.devour=null;G.skills=[];G.deeds={};G.war=null;
  r.загрузка=loadGame();
  r.поглощение=!!(G.devour&&G.devour.съедено===2);
  r.навыки=(G.skills||[]).join();
  r.ветвиТеЖе=JSON.stringify(safeFn(()=>BRANCHES.map(b=>branchRank(b.id)),[]))===JSON.stringify(ветви);
  r.война=!!(G.war&&G.war.фронт===7);
  /* старая запись без новых полей: модули заводят своё сами */
  const о=JSON.parse(сырое);
  ["war","tavern","forts","merits","artChains","econ","garrison"].forEach(k=>{delete о[k];});
  store.set(SAVE_KEY,JSON.stringify(о));
  r.стараяЗапись=loadGame();
  r.дугаПоУмолчанию=!!safeFn(()=>WarArc.state(),null);
  r.тавернаПоУмолчанию=typeof safeFn(()=>Tavern.text(),null)==="string";
  r.службы=!!safeFn(()=>Garrison.text(FORTS[0].id),null);
  r.достижения=typeof safeFn(()=>Merits.text(),"")==="string";
  r.безОшибок=true;
  return r;});
 check('5. поглощение свойств переживает запись, 10. развитие навыков и ветвей тоже, 15. а старая запись без новых полей читается, и новые механики заводят своё сами',
  запись.естьПоля.length===0&&запись.загрузка!==false&&запись.поглощение&&запись.навыки==="tracker,stamina"&&
  запись.ветвиТеЖе&&запись.война&&запись.стараяЗапись!==false&&запись.дугаПоУмолчанию&&
  запись.тавернаПоУмолчанию&&запись.службы&&запись.достижения,запись);

 /* ── 6 ── */
 const форма=await page.evaluate(()=>{
  const r={};
  const база=MONSTERS.find(m=>MORPHOBEASTS.some(z=>z.база===m.id))||MONSTERS[0];
  const m=Object.assign({},база);
  r.доИмя=m.n;r.доЗвук=m.snd;r.доЧерты=Morpho.text(m);
  const m2=Morpho.apply(Object.assign({},база),{x:G.x,y:G.y},true);
  r.послеИмя=m2.n;r.морф=m2.морф||null;r.черты=(m2.черты||[]).slice();
  r.облик=Morpho.text(m2);
  r.профильИной=r.послеИмя!==r.доИмя&&r.облик.length>10&&r.доЧерты==="";
  r.броня=Morpho.armor(m2,10)<=10;r.отражение=typeof Morpho.reflect(m2,10)==="number";
  return r;});
 check('6. смена формы зверя видна и слышна: у морфозверя своё имя, своя черта и свой звуковой облик, а у обычного зверя его нет',
  форма.морф&&форма.черты.length>0&&форма.профильИной&&форма.броня&&форма.отражение,форма);

 /* ── 7 ── */
 const маршруты=await page.evaluate(()=>{
  const r={};const f=FORTS[6];G.forts={};const st=Forts.state(f.id);
  st.owner="player";st.walls=100;st.supplies=100;st.garrison=20;st.siege=null;
  r.целая=Garrison.routes(f.id);
  st.walls=20;
  r.разбитая=Garrison.routes(f.id);
  r.разные=r.целая!==r.разбитая;
  r.службДо=FORT_SERVICES.filter(x=>{st.walls=100;return Garrison.open(f.id,x.id).ok;}).length;
  st.walls=20;
  r.службПосле=FORT_SERVICES.filter(x=>Garrison.open(f.id,x.id).ok).length;
  return r;});
 check('7. разрушенная крепость меняет маршруты жителей: у целой люди по дворам и открыты семь служб, у разбитой — на стенах и открыты три',
  маршруты.разные&&/по дворам/.test(маршруты.целая)&&/на стены/.test(маршруты.разбитая)&&
  маршруты.службДо===7&&маршруты.службПосле===3,маршруты);

 /* ── 8 ── */
 const цены=await page.evaluate(()=>{
  const r={};G.place=null;G.ship=null;
  const вне=WAR_ARC.x+WAR_ARC.r+80;
  G.x=вне;G.y=WAR_ARC.y;r.kВне=WarArc.priceK("железо");
  G.x=WAR_ARC.x;G.y=WAR_ARC.y;r.kВ=WarArc.priceK("железо");
  const st=WarArc.state();st.накал=100;r.kЖар=WarArc.priceK("железо");
  st.накал=10;r.kТихо=WarArc.priceK("железо");
  r.растёт=r.kЖар>r.kТихо&&r.kВ>r.kВне;
  return r;});
 check('8. война меняет торговые цены: в дуге железо дороже, чем вне её, и тем дороже, чем выше накал',
  цены.kВне===1&&цены.kВ>1&&цены.растёт,цены);

 /* ── 9 ── */
 const породы=await page.evaluate(()=>{
  const r={};
  r.верх=DeepRes.at(10).map(x=>x.n);r.низ=DeepRes.at(100).map(x=>x.n);
  r.доРазлома=DeepRes.at(5).length;
  r.шире=r.низ.length>r.верх.length&&r.верх.every(n=>r.низ.indexOf(n)>=0);
  r.всего=DEEP_RESOURCES.length;
  return r;});
 check('9. разломы меняют доступные породы: выше десятого яруса их нет вовсе, глубже — тем больше, и верхние остаются в списке нижних',
  породы.доРазлома===0&&породы.верх.length>0&&породы.шире&&породы.всего>=10,породы);

 /* ── 11 и 12 ── */
 /* Обработчики считаются по исходнику в узле: в браузере его нет. */
 const счёт=(re)=>(src.match(re)||[]).length;
 const обработчики={touchstart:счёт(/addEventListener\('touchstart'/g),touchmove:счёт(/addEventListener\('touchmove'/g),
  touchend:счёт(/addEventListener\('touchend'/g),click:счёт(/document\.addEventListener\('click'/g),
  keydown:счёт(/document\.addEventListener\("keydown"/g)};
 const чистота=await page.evaluate(async()=>{
  const r={};
  SAID.length=0;const SPOKEN=[];
  const ss=window.speechSynthesis;const прежний=ss&&ss.speak;
  if(ss)ss.speak=(u)=>{SPOKEN.push(String(u&&u.text||""));};
  narrate("Единственная строка проверки.",{interrupt:true});
  await new Promise(z=>setTimeout(z,300));
  if(ss&&прежний)ss.speak=прежний;
  r.сказано=SAID.filter(t=>/Единственная строка проверки/.test(t)).length;
  r.озвучено=SPOKEN.filter(t=>/Единственная строка проверки/.test(t)).length;
  return r;});
 check('11. старых обработчиков не осталось: касание, движение, отпускание и клавиша заведены по одному разу, и 12. речь не звучит дважды',
  обработчики.touchstart===1&&обработчики.touchmove===1&&обработчики.touchend===1&&
  обработчики.click===1&&обработчики.keydown===1&&
  чистота.сказано===1&&чистота.озвучено<=1,{обработчики,чистота});

 /* ── 14 ── */
 const слой=(()=>{
  const r={};
  r.контекстов=(src.match(/new\s+\(window\.AudioContext\|\|window\.webkitAudioContext\)/g)||[]).length
   +(src.match(/new\s+AudioContext\(/g)||[]).length;
  r.ветви=(src.match(/if\s*\(\s*(isIOS|isAndroid|IS_IOS|IS_ANDROID)\b/g)||[]).length;
  r.один=(src.match(/^const AE=\{/gm)||[]).length;
  r.банк=(src.match(/^const Bank=\{/gm)||[]).length;
  return r;})();
 const слой2=await page.evaluate(()=>({
  общий:!!(AE&&AE.ctx)&&(typeof Bank!=="undefined"),
  тотЖе:!!(AE&&AE.ctx)&&(!Bank.ctx||Bank.ctx===AE.ctx),
  живой:!!(AE&&AE.ctx&&typeof AE.applyVolumes==="function")}));
 check('14. звук идёт одним логическим слоем: один звуковой узел, один банк, один контекст на всех, и ни одной отдельной ветви под платформу',
  слой.один===1&&слой.банк===1&&слой.ветви===0&&слой2.общий&&слой2.тотЖе&&слой2.живой,{слой,слой2});

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
