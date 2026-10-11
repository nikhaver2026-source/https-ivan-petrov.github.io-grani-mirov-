/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 306: ЕДИНАЯ ЗВУКОВАЯ СРЕДА И ОДИН ГОЛОС (15.0)

   Жалобы и просьбы игрока: «через полчаса, час игры игра начинает
   глючить»; «привести всё к единому обработчику звука — единая звуковая
   среда, чтобы не накапливать и не разворачивать кучу плееров»; «один
   синтезатор накладывается на другой, подбирая фразы, которые он не должен
   произносить».
   1. Тысяча звуков со стороны — объёмные, звери, шаги с отзвуком, маяки,
      голоса жителей — звучат каналами единой среды: подключённых к движку
      плееров не больше числа каналов, узлов движка не прибавляется.
   2. Отыграв, каналы свободны; запоздалая команда прежнего хозяина нового
      хозяина не задевает.
   3. Все каналы заняты — место уступает самый старый звук, а не речь.
   4. Канал настраивается под звук: голос — через сжатие, за стеной —
      приглушение, маяк — стереопанорама, зверь — объёмный путь с окраской.
   5. Встроенная речь говорит — живая область для чтеца экрана молчит (два
      голоса вместе не звучат); встроенная выключена — чтец получает фразы,
      но не те, что игра намеренно не говорит (тихий бой).
   6. Журнал боя и строка «Сейчас играет» не зачитываются чтецом поверх
      голоса игры.
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{
  /* сколько плееров подключено к движку и сколько узлов движка создано — за всю жизнь страницы */
  window.СЧЁТ={mes:0,узлов:0};
  const C=window.AudioContext;const m0=C.prototype.createMediaElementSource;
  C.prototype.createMediaElementSource=function(){СЧЁТ.mes++;return m0.apply(this,arguments);};
  for(const m of ['createGain','createBiquadFilter','createPanner','createStereoPanner','createDynamicsCompressor','createConvolver']){
   const o=BaseAudioContext.prototype[m];if(!o)continue;BaseAudioContext.prototype[m]=function(){СЧЁТ.узлов++;return o.apply(this,arguments);};}});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  settings.effects=1;settings.hrtf=1;G.place=null;window.спим=мс=>new Promise(r=>setTimeout(r,мс));});

 /* ── 1. Тысяча звуков ── */
 const т=await p.evaluate(async()=>{const r={};
  const играть=i=>{switch(i%5){
   case 0:Spatial.at("mg/hit_air_01.ogg",(i%7)-3,1,{maxSec:0.25});break;
   case 1:ZvSnd.play(["lug_claw"],{dx:0.5,dy:-0.5,maxSec:0.25});break;
   case 2:playLeveled("step_dirt",{gain:0.5,maxSec:0.25,kind:"fx",prio:"low",reverb:true});break;
   case 3:Bank.panned("mg/hit_air_02.ogg",{pan:0.4,gain:0.4,maxSec:0.25});break;
   case 4:Folk.плоско("voice/say_torg"+VOICE_GEN+".mp3",{gain:0.6,maxSec:0.3});break;}};
  /* разогрев: каналы заводятся */
  for(let i=0;i<60;i++){играть(i);await спим(8);}
  await спим(900);
  const mes0=СЧЁТ.mes,узлов0=СЧЁТ.узлов;
  for(let i=0;i<1000;i++){играть(i);if(i%10===0)await спим(30);}
  await спим(1500);
  r.каналов=ЗвукСреда.каналы.length;r.N=ЗвукСреда.N;r.mesВсего=СЧЁТ.mes;r.mesПрибавка=СЧЁТ.mes-mes0;r.узловПрибавка=СЧЁТ.узлов-узлов0;
  r.занято=ЗвукСреда.заняты();r.звуков=ЗвукСреда.счёт.звуков;
  return r;});
 check('1. тысяча звуков со стороны — подключённых плееров не больше каналов среды, узлов движка не прибавляется',
  т.каналов<=т.N&&т.mesВсего<=т.N&&т.mesПрибавка===0&&т.узловПрибавка<=12&&т.звуков>=1000,т);

 /* ── 2. Каналы свободны; запоздалая команда не задевает нового хозяина ── */
 const п=await p.evaluate(async()=>{const r={};
  /* мир игры звучит сам (обоз, птицы, улица) — считаются только свои звуки */
  const свои=/hit_air|lug_claw|say_torg|step|footstep|dirt/;
  r.своиЗаняты=ЗвукСреда.каналы.filter(к=>к.занят&&свои.test(String(к.el.getAttribute("src")||""))).map(к=>String(к.el.getAttribute("src")).split("/").pop());
  r.свободныПосле=r.своиЗаняты.length===0;
  r.застрявших=ЗвукСреда.каналы.filter(к=>к.занят&&Date.now()-к.t>15000).length;
  const h1=ЗвукСреда.играть(Bank.url("mg/hit_air_01.ogg"),{gain:0.5});const к=h1.канал;h1.стоп();
  const h2=ЗвукСреда.играть(Bank.url("mg/hit_air_02.ogg"),{gain:0.5});r.тотЖеКанал=h2.канал===к;
  h1.стоп();h1.затухание(0.01);   /* запоздалые команды прежнего хозяина */
  r.новыйЗвучит=h2.мой()&&к.занят&&!!к.el.getAttribute("src");r.громкость=к.g.gain.value;
  h2.стоп();r.свободен=!к.занят;return r;});
 check('2. отыграв, каналы свободны; запоздалые «стоп» и «затухнуть» прежнего хозяина нового не задевают',
  п.свободныПосле&&п.застрявших===0&&п.тотЖеКанал&&п.новыйЗвучит&&п.громкость>0.4&&п.свободен,п);

 /* ── 3. Все каналы заняты — уступает самый старый, не речь ── */
 const у=await p.evaluate(async()=>{const r={};const N=ЗвукСреда.N;ЗвукСреда.стопВсе();   /* мир звучит и сам: начинаем с пустых каналов */
  const речь=ЗвукСреда.играть(Bank.url("voice/say_torg"+VOICE_GEN+".mp3"),{voice:true,gain:0.5});
  const ручки=[];for(let i=0;i<N-1;i++)ручки.push(ЗвукСреда.играть(Bank.url("mg/hit_air_01.ogg"),{gain:0.3}));
  let снят=null;ручки[0].приСнятии(()=>{снят="первый";});
  const лишний=ЗвукСреда.играть(Bank.url("mg/hit_air_02.ogg"),{gain:0.3});
  r.занято=ЗвукСреда.заняты();r.каналов=ЗвукСреда.каналы.length;r.речьЖива=речь.мой();r.старыйСнят=снят==="первый"&&!ручки[0].мой();r.лишнийЗвучит=!!(лишний&&лишний.мой());
  ЗвукСреда.стопВсе();r.послеСтопа=ЗвукСреда.заняты();return r;});
 check('3. все каналы заняты — место уступает самый старый звук, речь звучит дальше',
  у.каналов<=Math.max(24,у.занято)&&у.речьЖива&&у.старыйСнят&&у.лишнийЗвучит&&у.послеСтопа===0,у);

 /* ── 4. Канал под звук ── */
 const н=await p.evaluate(async()=>{const r={};
  Spatial.at("voice/say_torg"+VOICE_GEN+".mp3",0,2,{gain:1,kind:"npc",voice:true,occl:2,maxSec:1});const a=Spatial.live[Spatial.live.length-1];
  const к=a.h.канал;r.голос={сжатие:к.vIn.gain.value,прямо:к.dIn.gain.value,объём:к.selP.gain.value,приглушение:к.lp.frequency.value};
  const em=Bank.panned("mg/hit_air_02.ogg",{pan:-0.6,gain:0.4,maxSec:0.5});const км=em.__канал;
  r.маяк={стерео:км.selS.gain.value,панорама:км.sp.pan?Math.round(км.sp.pan.value*10)/10:null,объём:км.selP.gain.value};
  ZvSnd.play(["lug_claw"],{dx:1,dy:0,maxSec:0.5});const кз=ЗвукСреда.каналы.filter(x=>x.занят&&/lug_claw/.test(String(x.el.getAttribute("src")||""))).sort((x,y)=>y.t-x.t)[0];
  r.зверь={объём:кз.selP.gain.value,окраска:кз.eq.gain.value,вЗал:кз.toRoom.gain.value};
  ЗвукСреда.стопВсе();return r;});
 check('4. канал настраивается под звук: голос через сжатие и приглушение стены, маяк — стерео, зверь — объём с окраской',
  н.голос.сжатие===1&&н.голос.прямо===0&&н.голос.объём===1&&н.голос.приглушение<9000&&н.маяк.стерео===1&&н.маяк.панорама===-0.6&&н.маяк.объём===0&&
  н.зверь.объём===1&&н.зверь.окраска>3&&н.зверь.вЗал===1,н);

 /* ── 5. Один голос: встроенная речь и чтец экрана ── */
 const г=await p.evaluate(async()=>{const r={};const live=document.getElementById("liveRegion");const seen=[];
  const mo=new MutationObserver(()=>{if(live.textContent)seen.push(live.textContent);});mo.observe(live,{childList:true,characterData:true,subtree:true});
  const sp0=settings.speech,sr0=settings.srMode;settings.srMode="auto";
  /* встроенная говорит (подставной голос) */
  const a0=Speech._adapter;Speech._adapter=()=>({name:"fake",speak(t,o){setTimeout(()=>o.onend&&o.onend(),5);return true;},cancel(){},speaking(){return false;}});
  settings.speech=1;Speech.say("Проверка один.",{pri:2});await спим(150);r.приРечи=seen.slice();seen.length=0;
  /* встроенная выключена — фраза идёт чтецу */
  settings.speech=0;Speech.say("Проверка два.",{pri:2});await спим(150);r.безРечи=seen.slice();seen.length=0;
  /* тихий бой: то, что игра в бою не говорит, чтец тоже не получает */
  G.inCombat=true;G.combat={m:{n:"Волк",hp:10},hp:10};const cb0=settings.cbSpeech;settings.cbSpeech=0;
  Speech.say("Волк крадётся слева.",{pri:2});await спим(150);r.тихийБой=seen.slice();
  settings.cbSpeech=cb0;G.inCombat=false;G.combat=null;
  mo.disconnect();Speech._adapter=a0;settings.speech=sp0;settings.srMode=sr0;return r;});
 check('5. при встроенной речи чтец молчит; без неё чтец получает фразы, но не те, что игра в тихом бою не говорит',
  г.приРечи.length===0&&г.безРечи.length===1&&г.безРечи[0]==="Проверка два."&&г.тихийБой.length===0,г);

 /* ── 6. Журнал боя и «Сейчас играет» ── */
 const ж=await p.evaluate(()=>{const cb=document.getElementById("cbLog"),np=document.getElementById("nowPlaying");
  return {журнал:cb&&cb.getAttribute("aria-live"),играет:np&&np.getAttribute("aria-live"),рольИграет:np&&np.getAttribute("role")};});
 check('6. журнал боя и «Сейчас играет» не зачитываются чтецом поверх голоса игры',ж.журнал==="off"&&ж.играет==="off"&&ж.рольИграет===null,ж);

 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
