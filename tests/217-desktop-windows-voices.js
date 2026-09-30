/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 217: 4.8 — ПРИЛОЖЕНИЕ ДЛЯ КОМПЬЮТЕРА: ВЫБОР СИНТЕЗАТОРА И ГОЛОСА WINDOWS

   Просьба игрока: проверить, что в приложении для ПК работает выбор
   синтезатора и голоса, установленного у игрока на компьютере.

   Приложение поднимает мост голосов Windows (desktop/sapi.js): голоса SAPI 5
   и голоса Windows 10/11 из «Параметры → Время и язык → Речь», которых
   Chromium сам не видит. Мост отдаётся игре тем же GraniTTS, что на Android.

   1. Голос, который Chromium уже показал под тем же именем, второй раз в
      списке не появляется; голос Windows 10/11 — появляется, с пометкой.
   2. Без выбора говорит синтезатор Chromium (голоса SAPI), выбран голос
      Windows — говорит мост, и конец фразы приходит в игру.
   3. Chromium не видит ни одного голоса — говорит мост.
   4. Переключение синтезатора: Gemini или устройство (нейросети Piper с 4.8 нет).
   5. Темп игры переводится в шкалу SAPI так же, как у Chromium; мост
      отдаётся игре, только если голоса Windows ответили.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
/* Поддельные голоса: Chromium видит один голос SAPI, мост — его же и голос Windows 10/11. */
const ПОДДЕЛКА=(вебГолоса)=>`(()=>{
 window.graniDesktop={version:"5.0",platform:"win32",quit(){}};
 const веб=${JSON.stringify(вебГолоса)}.map(n=>({name:n,lang:"ru-RU",localService:true,default:false,voiceURI:n}));
 try{Object.defineProperty(speechSynthesis,"getVoices",{value:()=>веб});}catch(_){}
 window.__said=[];window.__voice=null;
 window.GraniTTS={
  speak(t,r,v,id){__said.push({t,r,v,id,voice:__voice});setTimeout(()=>window.GraniTTSDone&&GraniTTSDone(id),50);},
  stop(){},isSpeaking(){return false;},setVoice(n){__voice=n;},
  getVoices(){return JSON.stringify([
   {id:"Microsoft Irina Desktop - Russian",name:"Microsoft Irina Desktop - Russian",lang:"ru-RU",local:true,default:true,engine:"SAPI 5"},
   {id:"Microsoft Pavel - Russian (Russia)",name:"Microsoft Pavel - Russian (Russia)",lang:"ru-RU",local:true,default:false,engine:"Windows"}]);}};
})()`;
const скажи=`new Promise(res=>{const a=Speech._adapter();if(!a)return res({адаптер:null});
 const t=setTimeout(()=>res({адаптер:a.name,конец:false}),3000);
 a.speak("Здравствуй, путник.",{rate:1,volume:1,onend:()=>{clearTimeout(t);res({адаптер:a.name,конец:true});},onerror:()=>{clearTimeout(t);res({адаптер:a.name,конец:false});}});})`;
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const открыть=async(веб)=>{const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(ПОДДЕЛКА(веб));await p.goto(process.argv[2]);await p.waitForTimeout(900);
  await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
   const t=document.getElementById("setTtsEngine");t.value="device";t.dispatchEvent(new Event("change"));Speech.fillVoices();});
  return p;};

 /* ── 1–2 ── */
 const p=await открыть(["Microsoft Irina Desktop - Russian"]);
 const список=await p.evaluate(()=>({голоса:Speech.allVoices().map(v=>({имя:v.name,мост:!!v.native})),
  пункты:[...document.querySelectorAll("#setVoice option")].map(o=>o.textContent)}));
 const ирин=список.голоса.filter(v=>/Irina/.test(v.имя));
 check('1. голос, который Chromium уже показал, не повторяется; голос Windows 10/11 — в списке с пометкой',
  ирин.length===1&&!ирин[0].мост&&список.голоса.some(v=>/Pavel/.test(v.имя)&&v.мост)&&список.пункты.some(t=>/Pavel.*движок Windows/.test(t)),список);
 const безВыбора=await p.evaluate(скажи);
 const выбор=await p.evaluate(()=>Speech.pickVoice("native:Microsoft Pavel - Russian (Russia)",{say:false}));
 const мостом=await p.evaluate(скажи);
 const сказано=await p.evaluate(()=>__said.slice(-1)[0]);
 const назад=await p.evaluate(()=>Speech.pickVoice("Microsoft Irina Desktop - Russian",{say:false}));
 const снова=await p.evaluate(скажи);
 check('2. без выбора — синтезатор Chromium; выбран голос Windows — говорит мост, конец фразы приходит; обратно — снова Chromium',
  безВыбора.адаптер==="web"&&выбор&&мостом.адаптер==="native"&&мостом.конец&&сказано&&сказано.voice==="Microsoft Pavel - Russian (Russia)"&&назад&&снова.адаптер==="web",
  {безВыбора,мостом,сказано,снова});

 /* ── 3 ── */
 const p2=await открыть([]);
 const безВеб=await p2.evaluate(скажи);
 check('3. Chromium не видит голосов — говорит мост',безВеб.адаптер==="native"&&безВеб.конец,безВеб);

 /* ── 4 ── */
 const движки=await p.evaluate(async()=>{const out={};
  for(const e of ["gemini","device"]){const t=document.getElementById("setTtsEngine");t.value=e;t.dispatchEvent(new Event("change"));
   await new Promise(z=>setTimeout(z,300));out[e]={настройка:settings.ttsEngine,род:Speech._wantKind()};}
  return out;});
 check('4. выбор синтезатора: голос Gemini или синтезатор устройства',
  движки.gemini.настройка==="gemini"&&движки.gemini.род==="gemini"&&движки.device.настройка==="device"&&движки.device.род==="device",движки);

 /* ── 5 ── */
 const {Sapi}=require(path.join(__dirname,'..','desktop','sapi.js'));
 const темп=[0.5,1,1.5,3,5].map(Sapi.rate);
 const preload=fs.readFileSync(path.join(__dirname,'..','desktop','preload.js'),'utf8');
 const main=fs.readFileSync(path.join(__dirname,'..','desktop','main.js'),'utf8');
 const sapi=fs.readFileSync(path.join(__dirname,'..','desktop','sapi.js'),'utf8');
 check('5. темп в шкалу SAPI как у Chromium; мост — только если голоса Windows ответили; голоса Windows 10/11 перечисляются',
  JSON.stringify(темп)==="[-6,0,4,10,10]"&&/if \(tts\.ready\)/.test(preload)&&/GraniTTSDone/.test(main)&&/Speech_OneCore/.test(sapi),{темп});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
