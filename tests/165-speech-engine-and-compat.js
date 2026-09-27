/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 165: СИНТЕЗАТОР РЕЧИ — СВОЙ РАЗДЕЛ, СВОЙ ВЫБОР, БЫСТРЫЙ ОТКЛИК

   Речь в этой игре — не украшение, а единственный способ узнать, что
   происходит. Поэтому всё, что относится к самому голосу, собрано в один
   раздел настроек, выбор синтезатора отдан игроку, онлайн-голоса отсеяны
   по умолчанию, а путь от слова до звука укорочен.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Раздел «Синтезатор речи» есть, и в нём все органы управления
      с голосовыми метками; «Голос рассказчика» остался отдельно.
   2. Кнопка «Сохранить настройки» отвечает словом и говорит правду:
      когда память недоступна, обещания «сохранено» не даёт.
   3. «Что сохранено» называет движок, голос, темп, высоту и отсев.
   4. Онлайн-голоса отсеяны: локальный список короче полного, а выбор
      языка сужает его до русских голосов.
   5. Высота голоса доходит до самого высказывания.
   6. Короткая фраза уходит одним куском, длинная — режется; первое слово
      отдаётся синтезатору тем же тактом, без прежней задержки.
   7. ElevenLabs убран (выпуск 24): странице закрыта сеть, голос не мог
      прозвучать. Ни пунктов, ни движка, ни запросов к api.elevenlabs.io.
   8. Сохранённый прежде выбор ElevenLabs переезжает на встроенный голос,
      а ключ стирается с устройства.
   9. Замок первого касания снимается касанием, и игра знает, что умеет
      это устройство.
  10. Настройки синтезатора переживают перезагрузку страницы.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(2600);

 /* ── 1. раздел и его органы управления ── */
 {
  const r=await page.evaluate(()=>{
   CMD.settings();
   const m=document.getElementById("modal-settings");
   const h=[...m.querySelectorAll(".sec-head")].map(x=>x.dataset.secTitle);
   const поля=["setTtsEngine","setEngBuiltin","setGvVoice","setEngDevice","setVoiceLocal","setVoiceLang","setVoice","setRate","setPitch"];
   const кнопки=['[data-cmd="setsave"]','[data-cmd="setsaved"]','#btnVoiceRefresh','#btnSpeechSample'];
   const out={разделов:h.length,синтезатор:h.includes("Синтезатор речи"),рассказчик:h.includes("Голос рассказчика"),
    нет:поля.filter(id=>!m.querySelector("#"+id)),безКнопок:кнопки.filter(s=>!m.querySelector(s)),
    немые:[...m.querySelectorAll("#setTtsEngine,#setVoiceLang,#setVoice,#setGvVoice")]
     .filter(x=>!x.getAttribute("aria-label")).length};
   if(activeLayer())closeTopUI();
   return out;});
  check('1. раздел «Синтезатор речи» собран, органы управления на месте и все названы',
   r.синтезатор&&r.рассказчик&&!r.нет.length&&!r.безКнопок.length&&r.немые===0,r);
 }

 /* ── 2–3. кнопка сохранения и отчёт ── */
 {
  const r=await page.evaluate(()=>{
   const сказано=[];const s0=Speech.say.bind(Speech);
   Speech.say=(t,o)=>{сказано.push(String(t));return s0(t,o);};
   CMD.setsave();const сПамятью=сказано.join(" ");
   const было=store.set;store.set=()=>false;
   сказано.length=0;CMD.setsave();const безПамяти=сказано.join(" ");
   store.set=было;
   сказано.length=0;CMD.setsaved();const отчёт=сказано.join(" ");
   Speech.say=s0;
   return {сПамятью,безПамяти,отчёт};});
  check('2. кнопка сохранения отвечает словом и не обещает лишнего, когда памяти нет',
   /сохранены/i.test(r.сПамятью)&&!/сохранены/i.test(r.безПамяти)&&/не вышло|не даёт/i.test(r.безПамяти),r);
  check('3. «Что сохранено» называет движок, голос, темп, высоту и отсев',
   /Говорит/.test(r.отчёт)&&/Голос:/.test(r.отчёт)&&/Темп/.test(r.отчёт)
   &&/высота/i.test(r.отчёт)&&/Онлайн-голоса/.test(r.отчёт),r.отчёт);
 }

 /* ── 4. отсев онлайн-голосов ── */
 {
  const r=await page.evaluate(()=>{
   const родной=speechSynthesis.getVoices;
   speechSynthesis.getVoices=()=>[
    {name:"Милена",lang:"ru-RU",localService:true},
    {name:"Google русский",lang:"ru-RU",localService:false},
    {name:"Daniel",lang:"en-GB",localService:true}];
   const было={l:settings.voiceLocal,g:settings.voiceLang};
   settings.voiceLocal=1;settings.voiceLang="ru";const свои=Speech.voices().map(v=>v.name);
   settings.voiceLocal=0;const все=Speech.voices().map(v=>v.name);
   settings.voiceLang="all";const языки=Speech.voices().map(v=>v.name);
   settings.voiceLocal=1;settings.voiceLang="ru";
   const сколько=Speech.fillVoices();
   const подсказка=(document.getElementById("voiceHint")||{}).textContent||"";
   settings.voiceLocal=было.l;settings.voiceLang=было.g;
   speechSynthesis.getVoices=родной;
   try{Speech.fillVoices();}catch(_){}
   return {свои,все,языки,сколько,подсказка};});
  check('4. онлайн-голоса отсеяны, а выбор языка сужает список до русских',
   r.свои.length===1&&r.свои[0]==="Милена"&&r.все.length===2&&r.языки.length===3
   &&r.сколько===1&&/без сети/.test(r.подсказка),r);
 }

 /* ── 5. высота голоса доходит до высказывания ── */
 {
  const r=await page.evaluate(async()=>{
   /* В очереди могут висеть чужие фразы: ищем именно свою по тексту. */
   const пойманы=[];const было=speechSynthesis.speak;
   speechSynthesis.speak=u=>{пойманы.push({text:String(u.text||""),pitch:u.pitch,rate:u.rate});
    setTimeout(()=>{if(u.onend)u.onend();},1);};
   const p0=settings.pitch;
   Speech.adapter=null;Speech._kind=null;
   settings.pitch=1.6;
   Speech.stop({user:true});
   await new Promise(r=>setTimeout(r,60));
   пойманы.length=0;
   Speech.say("Проба высоты голоса.",{pri:0,user:true,interrupt:true});
   await new Promise(r=>setTimeout(r,200));
   settings.pitch=p0;speechSynthesis.speak=было;Speech.adapter=null;Speech._kind=null;
   const своя=пойманы.find(x=>/Проба высоты голоса/.test(x.text));
   return {поймано:пойманы.length,тексты:пойманы.map(x=>x.text.slice(0,24)),
    высота:своя&&своя.pitch};});
  check('5. высота голоса доходит до самого высказывания',
   r.поймано>0&&Math.abs(r.высота-1.6)<0.001,r);
 }

 /* ── 6. куски и такт первого слова ── */
 {
  const r=await page.evaluate(async()=>{
   const коротко=Speech._chunk("Пункт. Двойное касание — выбрать. Свайп — дальше.").length;
   const длинно=Speech._chunk("А".repeat(200)+". "+"Б".repeat(200)+".").length;
   /* Первое слово должно уйти синтезатору в том же такте: на iPhone речь,
      выпавшая из обработчика касания, проглатывается молча. */
   let синхронно=false;const было=speechSynthesis.speak;
   speechSynthesis.speak=u=>{синхронно=true;setTimeout(()=>{if(u.onend)u.onend();},1);};
   Speech.adapter=null;Speech._kind=null;Speech._cancelAt=0;
   Speech.current=null;Speech.speaking=false;Speech.queue.length=0;
   Speech.say("Тот же такт.",{pri:1,user:true,interrupt:false});
   const сразу=синхронно;
   await new Promise(r=>setTimeout(r,80));
   speechSynthesis.speak=было;Speech.adapter=null;Speech._kind=null;
   return {коротко,длинно,сразу};});
  check('6. короткая фраза идёт одним куском, длинная режется, первое слово — тем же тактом',
   r.коротко===1&&r.длинно>=3&&r.сразу===true,r);
 }

 /* ── 7. ElevenLabs больше нет ── */
 {
  const r=await page.evaluate(()=>{
   const б=settings.ttsEngine;settings.ttsEngine="eleven";settings.elevenKey="0123456789abcdef";settings.elevenVoice="voice-1";
   const род=Speech._wantKind();settings.ttsEngine=б;delete settings.elevenKey;delete settings.elevenVoice;
   Speech.adapter=null;Speech._kind=null;
   const html=document.documentElement.innerHTML;
   return {род,пункты:["setEngEleven","setElevenKey","setElevenVoice","btnElevenCheck"].filter(id=>document.getElementById(id)),
    вариант:!!document.querySelector('#setTtsEngine option[value="eleven"]'),адрес:html.indexOf("api.elevenlabs.io")>=0,
    методы:["_elevenAdapter","_elevenFetch","elevenCheck","elevenVoices"].filter(k=>typeof Speech[k]==="function")};});
  check('7. ElevenLabs убран: ни пунктов, ни варианта, ни движка, ни адреса api.elevenlabs.io',
   r.род!=="eleven"&&!r.пункты.length&&!r.вариант&&!r.адрес&&!r.методы.length,r);
 }

 /* ── 8. прежний выбор ElevenLabs переезжает, ключ стирается ── */
 {
  const p2=await ctx.newPage();
  await p2.addInitScript(()=>{try{localStorage.setItem("gm29set",JSON.stringify({ttsEngine:"eleven",elevenKey:"0123456789abcdef",elevenVoice:"voice-1",gvOn:1}));}catch(_){}});
  await p2.goto(process.argv[2]);await p2.waitForTimeout(700);
  const r=await p2.evaluate(()=>{let сохр={};try{сохр=JSON.parse(localStorage.getItem("gm29set")||"{}");}catch(_){}
   return {движок:settings.ttsEngine,ключ:"elevenKey" in settings,голос:"elevenVoice" in settings,вПамяти:"elevenKey" in сохр,движокВПамяти:сохр.ttsEngine};});
  await p2.close();
  check('8. сохранённый выбор ElevenLabs становится встроенным голосом, ключ стёрт и из памяти',
   r.движок!=="eleven"&&!r.ключ&&!r.голос&&!r.вПамяти&&r.движокВПамяти!=="eleven",r);
 }

 /* ── 9. замок первого касания и знание об устройстве ── */
 {
  const r=await page.evaluate(()=>{
   Speech.primed=false;
   const снял=Speech.prime();
   const у=Speech.capabilities();
   return {снял,заведён:Speech.primed,умеет:у,
    ключи:["web","native","голосов","звук"].filter(k=>!(k in у))};});
  check('9. замок синтезатора снимается первым касанием, и игра знает, что умеет устройство',
   r.снял===true&&r.заведён===true&&!r.ключи.length&&r.умеет.web===true,r);
 }

 /* ── 10. настройки синтезатора переживают перезагрузку ── */
 {
  await page.evaluate(()=>{
   settings.ttsEngine="device";settings.voiceLocal=0;settings.voiceLang="all";
   settings.pitch=1.4;saveSettings();});
  await page.reload();
  await page.waitForTimeout(900);
  const r=await page.evaluate(()=>({engine:settings.ttsEngine,local:settings.voiceLocal,
   lang:settings.voiceLang,pitch:+settings.pitch}));
  await page.evaluate(()=>{settings.voiceLocal=1;settings.voiceLang="ru";settings.pitch=1;saveSettings();});
  check('10. настройки синтезатора переживают перезагрузку страницы',
   r.local===0&&r.lang==="all"&&Math.abs(r.pitch-1.4)<0.001,r);
 }

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
