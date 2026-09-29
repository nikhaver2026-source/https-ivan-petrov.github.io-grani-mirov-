/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 213: 4.6 — ПОЛ ГОЛОСА НЕ МЕНЯЕТСЯ ПОСРЕДИ РЕЧИ

   Жалобы игрока:
   — выбран мужской голос Gemini, а в меню вклинивается женский;
   — некоторые персонажи говорят то мужским, то женским голосом, хотя
     мужчина должен говорить мужским, а женщина — женским.

   1. Нейросеть встроенного голоса — того же пола, что выбран в «Выборе
      голоса» (мужской — igm, женский — sova), с первого запуска.
   2. Незаписанное голос Gemini договаривает запасным путём того же пола:
      поднялась нейросеть — говорит она, а не синтезатор телефона.
   3. Пол голоса жителя — пол из его души, а не пол народа: женщина из
      людей говорит женской записью, мужчина из эльфов — мужской.
   4. Строку без записи нужного пола житель мужским голосом за женщину не
      говорит (и наоборот): реплика не звучит, её читает голос игры.
   5. Оклик народа записан одним полом: житель другого пола его не
      произносит, пока нет записи своего пола.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();settings.folk=1;settings.effects=1;});

 /* ── 1. ── */
 const нейро=await page.evaluate(()=>({gv:settings.gvVoice,grani:settings.graniVoice,модель:Speech.GRANI_MODELS[0]}));
 check('1. нейросеть того же пола, что выбранный голос',
  (нейро.gv==="f"?нейро.grani==="sova"&&/sova200/.test(нейро.модель):нейро.grani==="igm"&&/igm3804/.test(нейро.модель)),нейро);

 /* ── 2. ── */
 const запас=await page.evaluate(()=>{
  const был=Speech._grani,были={s:Speech.graniStart,a:Speech._graniAdapter,d:Speech._deviceAdapter};
  const журнал=[];
  Speech._grani={state:"ready",worker:null,job:null};Speech.graniStart=function(){return this._grani;};
  Speech._graniAdapter=()=>({speak(t){журнал.push("grani:"+t);return true;},cancel(){},speaking(){return false;}});
  Speech._deviceAdapter=()=>({speak(t){журнал.push("device:"+t);return true;},cancel(){},speaking(){return false;}});
  window.GraniTTS=window.GraniTTS||{speak(){},stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};
  const f=Speech._gvFallback();f.speak("Сорок два.",{});
  const вид=f.kind;
  Speech._grani={state:"loading"};const f2=Speech._gvFallback();f2.speak("Семь.",{});
  Speech._grani=был;Speech.graniStart=были.s;Speech._graniAdapter=были.a;Speech._deviceAdapter=были.d;
  return {журнал,вид};});
 check('2. незаписанное договаривает нейросеть того же пола; пока она не поднялась — синтезатор устройства',
  запас.журнал[0]==="grani:Сорок два."&&запас.вид==="grani"&&запас.журнал[1]==="device:Семь.",запас);

 /* ── 3–5. ── */
 const жители=await page.evaluate(()=>{
  const найти=(народ,пол)=>{for(let x=3000;x<3400;x++)for(let i=0;i<4;i++){const n=getNPC(x,3000,i);if(n.race!==народ)continue;
   const d=npcSoul(n);if(d.пол===пол)return n;}return null;};
  const жЛюди=найти("Люди","ж"),мЭльф=найти("Эльфы","м"),мЛюди=найти("Люди","м");
  const пути=[];const было=Folk.сказать;Folk.сказать=function(путь){пути.push(путь);return true;};
  Folk.можно=()=>true;
  const строка=Object.keys(VOICE_NPC.greet).find(t=>VOICE_NPC.greet[t][1]);
  const r={есть:!!(жЛюди&&мЭльф&&мЛюди)};
  пути.length=0;Folk.приветствие(жЛюди,строка,{всегда:true});r.женщинаЛюди=пути.slice();
  пути.length=0;Folk.приветствие(мЭльф,строка,{всегда:true});r.мужчинаЭльф=пути.slice();
  r.жен={жЛюди:Folk.жен(жЛюди),мЭльф:Folk.жен(мЭльф)};
  /* 4: строка без женской записи */
  VOICE_NPC.__проба={"x":["street_guard_0",0,1]};
  r.безЖенской=Folk.реплика("__проба","x",null,true,{всегда:true});
  r.мужскаяЕсть=Folk.реплика("__проба","x",null,false,{всегда:true});
  delete VOICE_NPC.__проба;
  /* 5: оклик народа */
  пути.length=0;r.окликЖенщиныЛюдей=Folk.народ(жЛюди,{всегда:true});r.окликПути1=пути.slice();
  пути.length=0;r.окликМужчиныЛюдей=Folk.народ(мЛюди,{всегда:true});r.окликПути2=пути.slice();
  Folk.сказать=было;
  return r;});
 check('3. пол голоса — пол жителя: женщина из людей — женской записью, мужчина из эльфов — мужской',
  жители.есть&&жители.жен.жЛюди===true&&жители.жен.мЭльф===false
  &&жители.женщинаЛюди.length===1&&/_f_g$/.test(жители.женщинаЛюди[0])&&жители.мужчинаЭльф.length===1&&!/_f_g$/.test(жители.мужчинаЭльф[0]),жители);
 check('4. нет записи нужного пола — запись другого пола не подставляется',
  жители.безЖенской===false&&жители.мужскаяЕсть===true,{без:жители.безЖенской,муж:жители.мужскаяЕсть});
 check('5. оклик народа звучит только голосом пола жителя',
  жители.окликЖенщиныЛюдей===false&&!жители.окликПути1.length&&жители.окликМужчиныЛюдей===true&&/^race_lyudi_g$/.test(жители.окликПути2[0]||""),
  {ж:жители.окликПути1,м:жители.окликПути2});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
