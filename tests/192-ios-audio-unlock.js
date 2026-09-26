/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 192: НА iPHONE ИГРА ГОВОРИТ И БЕЗ VoiceOver

   Жалоба игрока (3.9): «когда человек заходит на страницу игры и выключает
   VoiceOver на iOS, у него игра не озвучивается вообще. На Android всё
   хорошо, а на iOS не работает».

   Причины: замок звука снимался первым событием — pointerdown, который
   WebKit касанием не считает, и настоящее касание замок уже не трогало;
   каждый плеер на iPhone звучит, только если его запустили из касания, и
   записи голоса и звуки мира, пущенные таймером, молчали; события касания
   гасились обработчиками жестов и до документа не доходили.

   ЧТО ПРОВЕРЯЕТСЯ (браузер представляется iPhone).
   1. Опустившийся палец (pointerdown касанием) замок не снимает и не
      тратит; касание (touchend) снимает: синтезатор, звуковой движок и
      общий плеер открыты.
   2. Касание слушает окно на стадии захвата: обработчик, гасящий событие
      (stopPropagation), замку не мешает.
   3. Каждое касание пополняет запас открытых плееров до двенадцати; звук
      игры берёт плеер из запаса и ставит ему свою запись.
   4. Записанная фраза голоса Gemini, которой iPhone не дал звучать своим
      плеером, звучит общим плеером, открытым касанием, — не синтезатором и
      не тишиной; следующая фраза идёт сразу через него.
   5. Страница просит у iOS звучать как проигрыватель (navigator.audioSession
      = "playback"): звук идёт и при выключенном звонке.
   6. На Android запас не нужен и не заводится: плееры обычные.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},userAgent:IPHONE});
 await ctx.addInitScript(()=>{try{window.__introAuto=false;
  Object.defineProperty(navigator,"audioSession",{value:{type:"auto"},configurable:true});}catch(_){}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);

 /* ── 1. палец на стекле — не ключ; касание — ключ ── */
 const до=await page.evaluate(()=>{
  window.__tts=[];const s0=speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak=u=>{window.__tts.push(String(u.text));};
  Speech.primed=false;Speech._открыто={звук:false,речь:false,плеер:false};
  const r=Speech.prime({type:"pointerdown",pointerType:"touch"});
  return {r,primed:Speech.primed,открыто:Object.assign({},Speech._открыто),tts:window.__tts.length,вкл:Плееры.вкл,запас:Плееры.запас.length};});
 await page.touchscreen.tap(195,700);await page.waitForTimeout(300);
 const после=await page.evaluate(()=>({primed:Speech.primed,открыто:Object.assign({},Speech._открыто),tts:window.__tts.slice(),
  ctx:AE.ctx&&AE.ctx.state,запас:Плееры.запас.length,сессия:navigator.audioSession.type}));
 check('1. pointerdown пальцем замок не снимает и не тратит; касание снимает: синтезатор, звуковой движок и общий плеер открыты',
  до.r===false&&до.primed===false&&!до.открыто.речь&&до.tts===0&&до.вкл===true
  &&после.primed===true&&после.открыто.речь&&после.открыто.плеер&&после.открыто.звук&&после.tts.length===1&&!после.tts[0].trim(),{до,после});

 /* ── 2. захват окна: погашенное касание замку не мешает ── */
 const гашение=await page.evaluate(()=>{
  const d=document.createElement("div");document.body.appendChild(d);
  d.addEventListener("touchend",e=>e.stopPropagation());
  Speech._открыто.речь=false;window.__tts.length=0;
  d.dispatchEvent(new Event("touchend",{bubbles:true,cancelable:true}));
  d.remove();
  return {речь:Speech._открыто.речь,tts:window.__tts.length};});
 check('2. касание слушает окно на стадии захвата: stopPropagation в обработчике жестов замку не мешает',
  гашение.речь===true&&гашение.tts===1,гашение);

 /* ── 3. запас открытых плееров ── */
 const запас=await page.evaluate(()=>{
  const r={после:Плееры.запас.length};
  const верх=Плееры.запас[Плееры.запас.length-1];
  const a=Плееры.взять("sounds/intro/intro_12.ogg");
  r.изЗапаса=a===верх;r.src=String(a.src).split("/").pop();r.осталось=Плееры.запас.length;
  document.body.dispatchEvent(new Event("touchend",{bubbles:true}));
  r.пополнен=Плееры.запас.length;
  const n0=Плееры.запас.length;const b=Bank.make("ui/click.flac",0.5,false,1);r.bank=!!b&&Плееры.запас.length===n0-1;
  return r;});
 check('3. каждое касание пополняет запас открытых плееров до двенадцати; звук игры берёт плеер из запаса со своей записью',
  запас.после===12&&запас.изЗапаса&&запас.src==="intro_12.ogg"&&запас.осталось===11&&запас.пополнен===12&&запас.bank,запас);

 /* ── 4. голос Gemini через общий плеер ── */
 const голос=await page.evaluate(async()=>{
  const ждать=ms=>new Promise(r=>setTimeout(r,ms));
  try{window.GraniTTS=undefined;}catch(_){}
  settings.ttsEngine="gemini";Speech.adapter=null;Speech._kind=null;Speech.gvLoad();
  for(let i=0;i<40&&Speech.GVOICE.state!=="ready";i++)await ждать(50);
  const фраза=Speech.gvParts("Игровое поле.")[0].url?"Игровое поле.":Object.keys(Speech.GVOICE.map)[0];
  const общий=Speech._плеер;const log=[];
  const pl=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(!/gvoice/.test(this.src))return pl.call(this);
   log.push({общий:this===общий,f:this.src.split("/").pop()});
   if(this!==общий)return Promise.reject(new DOMException("не касание","NotAllowedError"));
   return Promise.resolve();};
  Плееры.запас.length=0;Speech._черезОбщий=false;window.__tts.length=0;
  Speech.stop();Speech.say(фраза,{interrupt:true});await ждать(150);
  const r={фраза,первая:log.slice(),tts:window.__tts.slice()};
  Speech.stop();await ждать(60);log.length=0;
  Speech.say(фраза,{interrupt:true,user:true,nav:true});await ждать(150);
  r.вторая=log.slice();
  Speech.stop();HTMLMediaElement.prototype.play=pl;
  return r;});
 const п1=голос.первая;
 check('4. запись, которой iPhone не дал своего плеера, звучит общим плеером, открытым касанием; следующая — сразу им',
  п1.length===2&&!п1[0].общий&&п1[1].общий&&/\.flac$/.test(п1[1].f)&&!голос.tts.length
  &&голос.вторая.length===1&&голос.вторая[0].общий,голос);

 /* ── 5. сессия звука ── */
 check('5. страница просит iOS звучать как проигрыватель: navigator.audioSession.type = "playback"',
  после.сессия==="playback",{сессия:после.сессия});

 check('страница не бросила ни одной ошибки (iPhone)',errors.length===0,errors.slice(0,3));

 /* ── 6. Android ── */
 const cA=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'});
 const pA=await cA.newPage();await pA.goto(process.argv[2]);await pA.waitForTimeout(600);
 await pA.touchscreen.tap(195,700);await pA.waitForTimeout(200);
 const андроид=await pA.evaluate(()=>{const a=Плееры.взять("sounds/intro/intro_12.ogg");
  return {вкл:Плееры.вкл,запас:Плееры.запас.length,новый:a instanceof HTMLAudioElement,primed:Speech.primed};});
 await cA.close();
 check('6. на Android запас плееров не заводится, плееры обычные, замок снимается касанием',
  андроид.вкл===false&&андроид.запас===0&&андроид.новый&&андроид.primed===true,андроид);

 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
