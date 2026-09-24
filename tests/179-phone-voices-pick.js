/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 179: ЛЮБОЙ ГОЛОС ТЕЛЕФОНА ВЫБИРАЕТСЯ И ЗВУЧИТ

   Жалоба игрока: кроме встроенного голоса и голоса по умолчанию нельзя
   выбрать другой голос, установленный на телефоне. Причин было три.
   • Голос выбирался по имени. На iPhone обычный и улучшенный голос часто
     зовутся одинаково, и выбор второго всякий раз возвращал первый.
   • Chrome на Android отдаёт список голосов через несколько секунд. Игра на
     пустом ещё списке сама включала встроенный голос — и дальше выбранный
     голос телефона молча не звучал: говорил встроенный.
   • В приложении для Android речь шла родным мостом голосом по умолчанию,
     что бы ни было выбрано.
   Кроме того, выпадающее поле перебиралось двойным касанием по одному,
   по кругу, — при тридцати голосах до нужного было не дойти.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Два голоса с одним именем различаются, подписаны по-разному и
      выбираются каждый свой; высказывание идёт именно выбранным голосом.
   2. Настройка прежней версии (имя) переводится на единственный ключ.
   3. Выбор голоса телефона снимает самовольный встроенный голос и выбор
      встроенного или ElevenLabs: говорит телефон, поле синтезатора это
      показывает.
   4. На пустом списке встроенный голос сам не включается сразу; пришли
      русские голоса — самовольный встроенный уступает телефону.
   5. Окно «Голоса телефона»: каждый голос — пункт, двойное касание одним
      пальцем выбирает, одно касание — нет; фильтры языка и сети — пунктами;
      есть подсказки для Android и iPhone.
   6. Приложение: голоса родного моста в списке, выбор доходит до моста;
      выбранный голос WebView звучит браузерным синтезатором, а не мостом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(600);

 /* Голоса как на iPhone: две «Милены» с одним именем, улучшенный Юрий,
    английская Саманта. */
 await page.evaluate(()=>{
  window.__IOS=[
   {name:"Milena",lang:"ru-RU",voiceURI:"com.apple.voice.compact.ru-RU.Milena",localService:true,default:true},
   {name:"Milena",lang:"ru-RU",voiceURI:"com.apple.voice.enhanced.ru-RU.Milena",localService:true,default:false},
   {name:"Yuri",lang:"ru-RU",voiceURI:"com.apple.voice.enhanced.ru-RU.Yuri",localService:true,default:false},
   {name:"Samantha",lang:"en-US",voiceURI:"com.apple.voice.compact.en-US.Samantha",localService:true,default:false},
   {name:"Milena",lang:"ru-RU",voiceURI:"com.apple.voice.compact.ru-RU.Milena",localService:true,default:true}];
  /* Подставные голоса — простые объекты, а настоящее высказывание берёт
     только настоящий SpeechSynthesisVoice: подменяем и его. */
  window.SpeechSynthesisUtterance=function(t){this.text=t;};
  window.__speak=speechSynthesis.speak.bind(speechSynthesis);
  window.__said=[];
  speechSynthesis.speak=u=>{window.__said.push({text:String(u.text||""),voice:u.voice&&u.voice.voiceURI});
   setTimeout(()=>{try{u.onend&&u.onend();}catch(_){}},1);};
  speechSynthesis.getVoices=()=>window.__IOS;
  settings.voiceLang="ru";settings.voiceLocal=1;settings.ttsEngine="device";Speech._graniAuto=false;
  Speech.adapter=null;Speech._kind=null;});

 /* ── 1. одноимённые голоса ── */
 const r1=await page.evaluate(async()=>{
  const n=Speech.fillVoices();
  const sel=document.getElementById("setVoice");
  const опции=[...sel.options].map(o=>({v:o.value,t:o.textContent}));
  const ok=Speech.pickVoice("com.apple.voice.enhanced.ru-RU.Milena",{say:false});
  window.__said.length=0;
  Speech.say("Проба выбранного голоса.",{pri:0,user:true,interrupt:true});
  await new Promise(r=>setTimeout(r,250));
  const своя=window.__said.find(x=>/Проба выбранного голоса/.test(x.text));
  return {n,опции,ok,голос:Speech.voice&&Speech.voice.voiceURI,настройка:settings.voice,звучит:своя&&своя.voice,
   порядок:Speech.voices().map(v=>v.voiceURI.split(".").slice(-3).join("."))};});
 check('1. две одноимённые «Милены» — два пункта с разными ключами и разной подписью, дубль склеен',
  r1.n===3&&new Set(r1.опции.map(o=>o.v)).size===3&&new Set(r1.опции.map(o=>o.t)).size===3
  &&r1.опции.some(o=>/улучшенный/.test(o.t))&&r1.опции.some(o=>/компактный/.test(o.t)),r1.опции);
 check('1б. выбран улучшенный — и высказывание идёт именно им, а не первым с тем же именем',
  r1.ok&&r1.голос==="com.apple.voice.enhanced.ru-RU.Milena"&&r1.звучит==="com.apple.voice.enhanced.ru-RU.Milena",r1);
 check('1в. русские улучшенные голоса стоят в списке первыми',
  /enhanced/.test(r1.порядок[0])&&/enhanced/.test(r1.порядок[1])&&/compact/.test(r1.порядок[2]),r1.порядок);

 /* ── 2. настройка прежней версии ── */
 const r2=await page.evaluate(()=>{settings.voice="Yuri";Speech.fillVoices();
  return {настройка:settings.voice,голос:Speech.voice&&Speech.voice.voiceURI};});
 check('2. сохранённое прежней версией имя переводится на единственный ключ голоса',
  r2.настройка==="com.apple.voice.enhanced.ru-RU.Yuri"&&r2.голос===r2.настройка,r2);

 /* ── 3. выбор голоса телефона важнее прочих синтезаторов ── */
 const r3=await page.evaluate(()=>{
  const out={};
  Speech._graniAuto=true;settings.ttsEngine="device";Speech.adapter=null;Speech._kind=null;
  out.доСам=Speech._wantKind();
  Speech.pickVoice("com.apple.voice.enhanced.ru-RU.Yuri",{say:false});
  out.послеСам=Speech._wantKind();out.самСнят=Speech._graniAuto===false;
  settings.ttsEngine="grani";Speech.adapter=null;Speech._kind=null;
  Speech.pickVoice("com.apple.voice.compact.ru-RU.Milena",{say:false});
  out.движок=settings.ttsEngine;out.поле=(document.getElementById("setTtsEngine")||{}).value;
  out.род=Speech._wantKind();
  /* выпадающее поле идёт той же дверью */
  const sel=document.getElementById("setVoice");sel.value="com.apple.voice.enhanced.ru-RU.Milena";
  sel.dispatchEvent(new Event("change",{bubbles:true}));
  out.черезПоле=settings.voice;
  return out;});
 check('3. выбор голоса телефона снимает самовольный встроенный голос: говорит телефон',
  r3.доСам==="grani"&&r3.послеСам==="device"&&r3.самСнят,r3);
 check('3б. выбран был встроенный — выбор голоса телефона переключает синтезатор, поле это показывает',
  r3.движок==="device"&&r3.поле==="device"&&r3.род==="device",r3);
 check('3в. выпадающее поле выбирает голос той же дверью',r3.черезПоле==="com.apple.voice.enhanced.ru-RU.Milena",r3);

 /* ── 4. пустой список — ещё не ответ ── */
 const r4=await page.evaluate(()=>{
  const out={};
  speechSynthesis.getVoices=()=>[];
  settings.ttsEngine="device";Speech._graniAuto=false;Speech._graniTries=0;
  out.сразу=Speech._graniAutoCheck();out.самНаПустом=Speech._graniAuto;out.попыток=Speech._graniTries;
  /* голоса пришли: повторная проверка встроенный не включит */
  speechSynthesis.getVoices=()=>window.__IOS;
  /* самовольный встроенный уступает, когда русские голоса нашлись */
  Speech._graniAuto=true;
  try{speechSynthesis.onvoiceschanged&&speechSynthesis.onvoiceschanged();}catch(_){}
  out.уступил=Speech._graniAuto===false&&Speech._wantKind()==="device";
  return out;});
 check('4. на пустом ещё списке голосов встроенный голос сам не включается — проверка повторится',
  r4.сразу===false&&r4.самНаПустом===false&&r4.попыток===1,r4);
 check('4б. пришли русские голоса — самовольный встроенный голос уступает телефону',r4.уступил,r4);
 await page.waitForTimeout(4300);
 const r4b=await page.evaluate(()=>({сам:Speech._graniAuto,грузится:Speech.graniState()}));
 check('4в. повторная проверка, найдя голоса, встроенный не включает',r4b.сам===false&&r4b.грузится==="off",r4b);

 /* ── 5. окно голосов ── */
 const r5=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  settings.voiceLang="ru";settings.voiceLocal=1;
  CMD.voicelist();
  const m=document.getElementById("modal-voices");
  const пункты=[...m.querySelectorAll('[data-cmd^="voicepick:"]')];
  return {открыто:activeLayer()===m,пунктов:пункты.length,
   речь:пункты.map(x=>x.dataset.speak),
   фильтры:!!m.querySelector('[data-cmd="voicelistlang"]')&&!!m.querySelector('[data-cmd="voicelistlocal"]'),
   андроид:/Предпочитаемый движок/.test(m.textContent),айфон:/Устная речь/.test(m.textContent),
   кнопка:!!document.querySelector('#modal-settings [data-cmd="voicelist"]')};});
 check('5. окно «Голоса телефона»: каждый голос — пункт с подписью, фильтры и подсказки на месте',
  r5.открыто&&r5.пунктов===3&&r5.речь.every(t=>/без сети/.test(t))&&r5.фильтры&&r5.андроид&&r5.айфон&&r5.кнопка,r5);

 const место=await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#modal-voices [data-cmd^="voicepick:"]')].find(x=>x.dataset.voiceKey==="com.apple.voice.enhanced.ru-RU.Yuri");
  settings.voice="com.apple.voice.compact.ru-RU.Milena";
  /* свайпами игрок доходит до голоса: пункт становится текущим */
  setCursor(b,false);
  const r=b.getBoundingClientRect();
  return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 const касание=async()=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:место.x,y:место.y,id:0}]});
  await page.waitForTimeout(40);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:место.x,y:место.y,id:0}]});};
 await касание();await page.waitForTimeout(600);
 const послеОдного=await page.evaluate(()=>settings.voice);
 /* первое касание могло прокрутить список к пункту — берём место заново */
 Object.assign(место,await page.evaluate(()=>{
  const b=document.querySelector('#modal-voices [data-voice-key="com.apple.voice.enhanced.ru-RU.Yuri"]');
  const r=b.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};}));
 await касание();await page.waitForTimeout(90);await касание();await page.waitForTimeout(500);
 const r5b=await page.evaluate(()=>({голос:settings.voice,
  отметка:(document.querySelector('#modal-voices [data-voice-key="com.apple.voice.enhanced.ru-RU.Yuri"]')||{}).dataset.speak,
  сказал:window.__said.map(x=>x.text).filter(t=>/Голос: Yuri/.test(t)).length}));
 check('5б. одно касание по голосу ничего не выбирает',послеОдного==="com.apple.voice.compact.ru-RU.Milena",послеОдного);
 check('5в. двойное касание одним пальцем выбирает голос, он сам себя называет, пункт отмечен',
  r5b.голос==="com.apple.voice.enhanced.ru-RU.Yuri"&&/Сейчас выбран/.test(r5b.отметка||"")&&r5b.сказал>=1,r5b);

 const r5c=await page.evaluate(()=>{
  CMD.voicelistlang();const все=document.querySelectorAll('#modal-voices [data-cmd^="voicepick:"]').length;
  const англ=/Samantha/.test(document.getElementById("modal-voices").textContent);
  CMD.voicelistlang();const русские=document.querySelectorAll('#modal-voices [data-cmd^="voicepick:"]').length;
  while(activeLayer())closeTopUI();
  return {все,англ,русские,язык:settings.voiceLang};});
 check('5г. пункт фильтра языка показывает голоса всех языков и возвращает только русские',
  r5c.все===4&&r5c.англ&&r5c.русские===3&&r5c.язык==="ru",r5c);

 /* ── 6. приложение для Android ── */
 const r6=await page.evaluate(()=>{
  const out={};
  window.__nv=null;window.__nspeak=0;
  window.GraniTTS={speak(){window.__nspeak++;setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone("x"),1);},stop(){},isSpeaking(){return false;},
   getVoices(){return JSON.stringify([{id:"com.github.olga_yakovleva.rhvoice.android:aleksandr",name:"Aleksandr",lang:"ru-RU",engine:"RHVoice"}]);},
   setVoice(id){window.__nv=id;}};
  Speech.fillVoices();
  const родные=Speech.allVoices().filter(v=>v.native);
  out.вСписке=родные.length===1&&/RHVoice/.test(Speech.voiceLabel(родные[0]));
  out.вПоле=[...document.getElementById("setVoice").options].some(o=>/Aleksandr/.test(o.textContent));
  Speech.pickVoice(Speech.voiceKey(родные[0]),{say:false});
  out.мостУслышал=window.__nv;out.адаптер=Speech._adapter().name;
  Speech.pickVoice("com.apple.voice.enhanced.ru-RU.Milena",{say:false});
  out.вебАдаптер=Speech._adapter().name;
  delete window.GraniTTS;Speech.adapter=null;Speech._kind=null;Speech._nativeVoice=null;
  return out;});
 check('6. приложение: голос движка из родного моста есть в списке и выбирается мостом',
  r6.вСписке&&r6.вПоле&&r6.мостУслышал==="com.github.olga_yakovleva.rhvoice.android:aleksandr"&&r6.адаптер==="native",r6);
 check('6б. приложение: выбранный голос WebView звучит браузерным синтезатором, а не голосом моста по умолчанию',r6.вебАдаптер==="web",r6);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
