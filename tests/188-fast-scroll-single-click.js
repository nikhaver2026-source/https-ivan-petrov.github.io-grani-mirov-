/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 188: БЫСТРОЕ ЛИСТАНИЕ — ГОЛОС НЕ ПРОПАДАЕТ, ОДИН ЩЕЛЧОК

   Жалобы игрока (версия 3.5).
   • «При быстром пролистывании настроек, меню и так далее синтезатор
     замолкает». Причин было три: пункт, к которому вернулись за 1,2 с,
     считался повтором и молчал; случайная подсказка мира обрывала имя
     пункта; синтезатор браузера после каждого обрыва копил отложенные
     фразы, и нужный пункт звучал поздно или не звучал.
   • «Сократи щелчки в меню и настройках до одного» — запись щелчка несла
     два удара.
   • «Различия щелчков между меню и настройками» и «увеличь отклик».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Записи щелчков: в меню и в настройках — разные файлы, в каждом ровно
      один удар, без потерь.
   2. Один свайп — ровно один щелчок: в настройках — свой, в меню — свой.
   3. Двадцать быстрых свайпов туда и обратно: каждый пункт назван, ни один
      не отброшен как повтор, и звучит именно последний выбранный.
   4. Вернулся на пункт через полсекунды — он звучит снова.
   5. Край списка: пункт звучит ещё раз, щелчок ниже.
   6. Весть мира не обрывает имя пункта — ждёт своей очереди.
   7. Синтезатор браузера: при быстром листании в него уходит только
      последний пункт, устаревшие не копятся.
   8. Приложение для Android ставит фразу со сбросом очереди (QUEUE_FLUSH);
      палец на пункте слышит его через 180 мс.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');

/* Сколько ударов в записи: огибающая по 4 мс, порог — четверть пика, удары
   ближе 40 мс считаются одним. */
function удары(file){
 if(!file)return -1;
 const r=spawnSync('ffmpeg',['-v','error','-i',path.join(ROOT,'sounds',file),'-ac','1','-ar','22050','-f','f32le','-'],{maxBuffer:1<<26});
 const b=r.stdout;if(!b||!b.length)return -1;
 const x=new Float32Array(b.buffer,b.byteOffset,Math.floor(b.length/4));
 const w=88;const env=new Float32Array(x.length);let s=0;
 for(let i=0;i<x.length;i++){s+=Math.abs(x[i]);if(i>=w)s-=Math.abs(x[i-w]);env[i]=s/w;}
 let mx=0;for(const v of env)if(v>mx)mx=v;
 let n=0,выше=false,последний=-1e9;
 for(let i=0;i<env.length;i++){const up=env[i]>mx*0.25;
  if(up&&!выше&&i-последний>882){n++;последний=i;}выше=up;}
 return n;}

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.__snd=[];
  /* Мост приложения: фраза «звучит» 400 мс. */
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));window.__ttsT=setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),400);},
   stop(){clearTimeout(window.__ttsT);},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};
  const pl=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){window.__snd.push({src:String(this.src).replace(/^.*\/sounds\//,""),rate:this.playbackRate});return pl.apply(this,arguments);};});
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}G.tutorDone=1;while(activeLayer())closeTopUI();});
 await page.waitForTimeout(600);

 /* ── 1. записи ── */
 const роли=await page.evaluate(()=>({menu:UI_BANK.ui_next,set:UI_BANK.ui_next_set}));
 const у={menu:удары(роли.menu),set:удары(роли.set)};
 check('1. щелчки меню и настроек — разные записи без потерь, в каждой ровно один удар',
  роли.menu!==роли.set&&/\.flac$/.test(роли.menu)&&/\.flac$/.test(роли.set)&&у.menu===1&&у.set===1,{роли,у});

 /* ── 2. один свайп — один щелчок ── */
 const щелчки=await page.evaluate(async()=>{
  const r={};
  for(const где of ["set","menu"]){
   while(activeLayer())closeTopUI();
   if(где==="set")CMD.settings();else openActionMenu();
   await new Promise(t=>setTimeout(t,500));
   window.__snd.length=0;
   swipeNav("next");
   await new Promise(t=>setTimeout(t,300));
   r[где]=window.__snd.map(x=>x.src);}
  while(activeLayer())closeTopUI();
  return r;});
 check('2. один свайп — ровно один щелчок: в настройках свой, в меню свой',
  щелчки.set.length===1&&щелчки.menu.length===1&&щелчки.set[0]===роли.set&&щелчки.menu[0]===роли.menu,щелчки);

 /* ── 3–5. быстрое листание ── */
 const листание=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();await new Promise(t=>setTimeout(t,500));
  const r={};
  const сказано=[];const s0=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{const m=s0(t,o);if(o&&o.nav)сказано.push({t:String(t),state:m&&m.state});return m;};
  /* 3. двадцать свайпов через 40 мс: вперёд-назад-вперёд */
  const путь=["next","next","next","prev","prev","next","next","next","prev","next","next","prev","prev","prev","next","next","next","next","prev","next"];
  for(const d of путь){swipeNav(d);await new Promise(t=>setTimeout(t,40));}
  await new Promise(t=>setTimeout(t,80));
  r.свайпов=путь.length;r.названо=сказано.length;
  r.отброшено=сказано.filter(x=>x.state==="DEDUPED"||x.state==="DROPPED").length;
  r.последний=speakTextOf.name?(uiCursor&&(uiCursor.dataset.speak||uiCursor.textContent||"").trim().slice(0,40)):"";
  r.звучит=Speech.current&&Speech.current.text.slice(0,40);
  r.вМост=window.__tts[window.__tts.length-1]&&window.__tts[window.__tts.length-1].slice(0,40);
  /* 4. туда и обратно за полсекунды */
  сказано.length=0;
  swipeNav("next");await new Promise(t=>setTimeout(t,150));
  swipeNav("prev");await new Promise(t=>setTimeout(t,150));
  swipeNav("next");await new Promise(t=>setTimeout(t,150));
  r.обратно=сказано.map(x=>x.t.slice(0,30)+"|"+x.state);
  /* 5. край списка */
  const все=cursorItems(navLayer());
  setCursor(все[все.length-1],false);
  сказано.length=0;window.__snd.length=0;
  swipeNav("next");await new Promise(t=>setTimeout(t,200));
  r.край={сказано:сказано.length,щелчки:window.__snd.map(x=>x.rate)};
  Speech.say=s0;
  return r;});
 check('3. двадцать быстрых свайпов: каждый пункт назван, ни один не отброшен, звучит последний выбранный',
  листание.названо===листание.свайпов&&листание.отброшено===0&&!!листание.звучит
  &&листание.вМост&&листание.звучит.slice(0,20)===листание.вМост.slice(0,20),листание);
 check('4. вернулся на пункт через полсекунды — он звучит снова, а не молчит как повтор',
  листание.обратно.length===3&&листание.обратно.every(x=>!/DEDUPED|DROPPED/.test(x)),листание.обратно);
 check('5. на краю списка пункт звучит ещё раз, а щелчок — ниже обычного',
  листание.край.сказано===1&&листание.край.щелчки.length===1&&листание.край.щелчки[0]<0.9,листание.край);

 /* ── 6. весть мира ждёт ── */
 const весть=await page.evaluate(async()=>{
  window.__tts.length=0;
  swipeNav("prev");await new Promise(t=>setTimeout(t,30));
  const пункт=Speech.current&&Speech.current.text;
  narrate("Где-то вдали звонит колокол.");
  await new Promise(t=>setTimeout(t,30));
  const сейчас=Speech.current&&Speech.current.text;
  await new Promise(t=>setTimeout(t,1200));
  return {пункт:пункт&&пункт.slice(0,30),сейчас:сейчас&&сейчас.slice(0,30),потом:window.__tts.map(t=>t.slice(0,30))};});
 check('6. весть мира не обрывает имя пункта, а звучит после него',
  весть.пункт&&весть.сейчас===весть.пункт&&весть.потом.length>=2&&/колокол/.test(весть.потом[весть.потом.length-1]),весть);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 7. синтезатор браузера ── */
 const p2=await ctx.newPage();
 await p2.addInitScript(()=>{
  window.__spoken=[];let говорит=false,т=null;
  class U{constructor(t){this.text=t;}}
  window.SpeechSynthesisUtterance=U;
  const ss={speak(u){window.__spoken.push(u.text);говорит=true;setTimeout(()=>{u.onstart&&u.onstart();},5);
    т=setTimeout(()=>{говорит=false;u.onend&&u.onend();},600);},
   cancel(){clearTimeout(т);говорит=false;},get speaking(){return говорит;},get pending(){return false;},
   getVoices(){return [{name:"Тест",lang:"ru-RU",localService:true,voiceURI:"test"}];},pause(){},resume(){},
   addEventListener(){},onvoiceschanged:null};
  Object.defineProperty(window,'speechSynthesis',{value:ss,configurable:true});});
 await p2.goto(process.argv[2]);await p2.waitForTimeout(900);
 const веб=await p2.evaluate(async()=>{
  try{enterGame();}catch(_){}G.tutorDone=1;while(activeLayer())closeTopUI();
  settings.ttsEngine="device";Speech.adapter=null;Speech._kind=null;
  CMD.settings();await new Promise(t=>setTimeout(t,500));
  window.__spoken.length=0;
  for(let i=0;i<8;i++){swipeNav("next");await new Promise(t=>setTimeout(t,8));}
  await new Promise(t=>setTimeout(t,300));
  const последний=Speech.current&&Speech.current.text;
  return {адаптер:Speech._adapter()&&Speech._adapter().name,ушло:window.__spoken.map(t=>t.slice(0,25)),последний:последний&&последний.slice(0,25)};});
 await p2.close();
 check('7. синтезатор браузера: при быстром листании в него уходит последний пункт, устаревшие не копятся',
  веб.адаптер==="web"&&веб.ушло.length>=1&&веб.ушло.length<=3&&веб.ушло[веб.ушло.length-1]===веб.последний,веб);

 /* ── 8. приложение и отклик пальца ── */
 const java=fs.readFileSync(path.join(ROOT,'android/app/src/main/java/io/github/granimirov/MainActivity.java'),'utf8');
 const hold=await page.evaluate(()=>gestHoldMs());
 check('8. приложение ставит фразу со сбросом очереди, палец на пункте слышит его через 180 мс',
  /QUEUE_FLUSH/.test(java)&&!/speak\(text, TextToSpeech\.QUEUE_ADD/.test(java)&&hold===180,{hold});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
