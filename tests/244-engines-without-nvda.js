/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 244: 9.0 — ДВИЖКИ БЕЗ NVDA, ГОЛОСА MICROSOFT — ТОЛЬКО ЗАПАСНЫЕ,
   ВСТРОЕННЫЙ ГОЛОСОВОЙ ПАКЕТ

   Жалобы игрока:
   • полная сборка для Windows всё равно предлагала «Обновить голосовой
     пакет» и выбрать zip, хотя пакет уже внутри;
   • движки, установленные на компьютере, игра должна видеть сама, без NVDA;
   • голоса Microsoft звучат плохо — убрать их из выбора.

   1. (26 октября) Отдельного голосового пакета нет: приложение для Windows его
      не ставит и не качает — записи лежат в папке игры (resources/game/sounds).
   2. В настройках нет кнопки и строки о пакете, команды установки нет, выбор
      файла не открывается.
   3. Есть сторонние голоса — голосов Microsoft (SAPI с «Microsoft» в имени,
      голоса Windows 10/11, Speech Platform) в выборе нет; сохранённый голос
      Microsoft уступает стороннему.
   4. (9.5) Голосов Microsoft на Windows нет совсем, даже без других: с игрой
      едут свои RHVoice и eSpeak NG (resources/rhvoice, resources/espeak).
   5. Мост голосов Windows сам грузит RHVoice из дополнений NVDA и eSpeak NG
      (без вариантов и голосов MBROLA, ронявших библиотеку); сбой чужой
      библиотеки не роняет мост, упавший мост поднимается сам; сборка
      проверяет оба движка на сервере.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
const ГОЛОСА_ВСЕ=[
 {id:"Microsoft Irina Desktop - Russian",name:"Microsoft Irina Desktop - Russian",lang:"ru-RU",local:true,default:true,engine:"SAPI 5"},
 {id:"Microsoft Pavel - Russian (Russia)",name:"Microsoft Pavel - Russian (Russia)",lang:"ru-RU",local:true,engine:"Windows"},
 {id:"Elena",name:"Elena",lang:"ru-RU",local:true,engine:"Speech Platform"},
 {id:"Aleksandr — RHVoice",name:"Aleksandr — RHVoice",lang:"ru-RU",local:true,engine:"RHVoice из дополнения NVDA, без NVDA"},
 {id:"eSpeak NG — Russian",name:"eSpeak NG — Russian",lang:"ru-RU",local:true,engine:"eSpeak NG, без NVDA"}];
const ПОДДЕЛКА=(голоса,пакет,сохранён)=>`(()=>{
 window.__ставили=0;
 window.graniDesktop={version:"9.0",platform:"win32",quit(){},
};
 try{Object.defineProperty(speechSynthesis,"getVoices",{value:()=>[]});}catch(_){}
 ${сохранён?`try{const k="graniSettings";const s=JSON.parse(localStorage.getItem(k)||"{}");s.voice=${JSON.stringify(сохранён)};localStorage.setItem(k,JSON.stringify(s));}catch(_){}`:""}
 window.GraniTTS={speak(t,r,v,id){setTimeout(()=>window.GraniTTSDone&&GraniTTSDone(id),30);},stop(){},isSpeaking(){return false;},setVoice(){},
  getVoices(){return JSON.stringify(${JSON.stringify(голоса)});}};
})()`;
(async()=>{
 /* ── 1 ── (26 октября) отдельного голосового пакета нет: ни установки, ни докачки */
 const main=fs.readFileSync(path.join(R,'desktop','main.js'),'utf8');
 const vpjs=fs.existsSync(path.join(R,'desktop','voicepack.js'));
 check('1. приложение для Windows не ставит и не качает голосовой пакет: записи — в папке игры',
  !vpjs&&!/VoicePack|voicepack|autoFetch/.test(main),{vpjs});

 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const открыть=async(голоса,пакет,сохранён)=>{const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(ПОДДЕЛКА(голоса,пакет,сохранён));await p.goto(process.argv[2]);await p.waitForTimeout(900);
  await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});
  return p;};

 /* ── 2 ── */
 const p=await открыть(ГОЛОСА_ВСЕ,{installed:true,builtin:true});
 const ui=await p.evaluate(()=>({кнопка:!!document.getElementById("btnGvPack"),строка:!!document.getElementById("gvPackHint"),
  команда:typeof CMD==="object"&&typeof CMD.gvpack,ставили:__ставили}));
 check('2. в настройках нет кнопки и строки о голосовом пакете, команды установки нет, выбор файла не открывается',
  !ui.кнопка&&!ui.строка&&ui.команда==="undefined"&&ui.ставили===0,ui);

 /* ── 3 ── */
 const п3=await p.evaluate(()=>{const t=document.getElementById("setTtsEngine");t.value="device";t.dispatchEvent(new Event("change"));Speech.fillVoices();
  return {список:Speech.voices().map(v=>v.name),пункты:[...document.querySelectorAll("#setVoice option")].map(o=>o.textContent),выбран:(Speech._nativeVoice||Speech.voice||{}).name||""};});
 const p3b=await открыть(ГОЛОСА_ВСЕ,{installed:false},"native:Microsoft Irina Desktop - Russian");
 const сохр=await p3b.evaluate(()=>{const t=document.getElementById("setTtsEngine");t.value="device";t.dispatchEvent(new Event("change"));Speech.fillVoices();
  return {выбран:(Speech._nativeVoice||Speech.voice||{}).name||"",настройка:settings.voice};});
 check('3. есть сторонние голоса — Microsoft (SAPI, Windows 10/11, Speech Platform) в выборе нет; RHVoice и eSpeak — есть',
  п3.список.length===2&&п3.список.every(n=>!/Microsoft|Elena/.test(n))&&п3.список.some(n=>/RHVoice/.test(n))&&п3.список.some(n=>/eSpeak/.test(n))
  &&п3.пункты.every(t=>!/Microsoft/.test(t))&&/RHVoice|eSpeak/.test(п3.выбран),п3);
 check('3б. сохранённый голос Microsoft уступает стороннему',/RHVoice|eSpeak/.test(сохр.выбран)&&!/Microsoft/.test(сохр.настройка),сохр);

 /* ── 4 ── */
 const p4=await открыть(ГОЛОСА_ВСЕ.filter(v=>/Microsoft|Elena/.test(v.name)),{installed:false});
 const п4=await p4.evaluate(()=>{const t=document.getElementById("setTtsEngine");t.value="device";t.dispatchEvent(new Event("change"));Speech.fillVoices();
  return {список:Speech.voices().map(v=>v.name),выбран:(Speech._nativeVoice||Speech.voice||{}).name||""};});
 const сб=require('fs').readFileSync(require('path').join(__dirname,'..','.github','workflows','windows.yml'),'utf8');
 const мост=require(require('path').join(__dirname,'..','desktop','sapi.js'));
 check('4. голосов Microsoft на Windows нет и без других: свои RHVoice и eSpeak NG едут вместе с игрой',
  п4.список.length===0&&!/Microsoft/.test(п4.выбран)&&/--extra-resource=espeak/.test(сб)&&/--extra-resource=rhvoice/.test(сб)&&typeof мост.espeakDll==="function"&&typeof мост.rhvoiceDir==="function",п4);

 /* ── 5 ── */
 const sapi=fs.readFileSync(path.join(R,'desktop','sapi.js'),'utf8');
 const wf=fs.readFileSync(path.join(R,'.github','workflows','windows.yml'),'utf8');
 const test=fs.readFileSync(path.join(R,'desktop','sapi-test.js'),'utf8');
 const {CS_SOURCE}=require(path.join(R,'desktop','sapi.js'));
 check('5. мост сам грузит RHVoice из дополнений NVDA (RHVoice.dll, RHVoice-voice-…) и eSpeak NG; сборка проверяет оба движка',
  /class GraniRh/.test(CS_SOURCE)&&/RHVoice_new_tts_engine/.test(CS_SOURCE)&&/"nvda"\), "addons"/.test(CS_SOURCE)&&/\^RHVoice-\.\*\(voice\|language\)/.test(CS_SOURCE)
  &&/class GraniEs/.test(CS_SOURCE)&&/espeak_Initialize/.test(CS_SOURCE)&&/libespeak-ng\.dll/.test(CS_SOURCE)
  &&/StartsWith\("!v"\)/.test(CS_SOURCE)&&/StartsWith\("mb\/"\)/.test(CS_SOURCE)&&(CS_SOURCE.match(/HandleProcessCorruptedStateExceptions/g)||[]).length>=4
  &&/this\.onExit\(this\)/.test(sapi)&&/p\.onExit = /.test(sapi)
  &&/rhvoice:/.test(sapi)&&/espeak:/.test(sapi)&&/GRANI_EXPECT_ENGINES = 'rhvoice,espeak'/.test(wf)&&/GRANI_EXPECT_ENGINES/.test(test));

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
