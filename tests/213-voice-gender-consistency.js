/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 213: 4.6 — ПОЛ ГОЛОСА НЕ МЕНЯЕТСЯ ПОСРЕДИ РЕЧИ

   Жалобы игрока:
   — выбран мужской голос Gemini, а в меню вклинивается женский;
   — некоторые персонажи говорят то мужским, то женским голосом, хотя
     мужчина должен говорить мужским, а женщина — женским.

   1. Встроенной нейросети Piper, которая могла заговорить не тем полом и с
      задержкой, в игре больше нет (4.8).
   2. Незаписанное голос Gemini договаривает голосом устройства того же пола
      (4.8: нейросеть отвечала с задержкой в секунду и ставила неверные
      ударения): «Павел» при мужском голосе, «Ирина» при женском; пол не
      виден — голос устройства по умолчанию.
   3. Пол голоса жителя — пол из его души, а не пол народа: женщина из
      людей говорит женской записью, мужчина из эльфов — мужской.
   4. Строку без записи нужного пола житель мужским голосом за женщину не
      говорит (и наоборот): реплика не звучит, её читает голос игры.
   5. Оклик народа записан одним полом, а житель другого пола говорит его
      записью своего пола (VOICE_RACE_ALT, с 4.7); нет такой записи —
      оклик молчит.
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
 const нейро=await page.evaluate(()=>({старт:typeof Speech.graniStart,модели:typeof Speech.GRANI_MODELS}));
 check('1. встроенной нейросети Piper нет',нейро.старт==="undefined"&&нейро.модели==="undefined"&&!require('fs').existsSync(require('path').join(__dirname,'..','tts')),нейро);

 /* ── 2. ── */
 const запас=await page.evaluate(()=>{
  const были={v:Speech._voiceAdapter,all:Speech.allVoices,gv:settings.gvVoice,vc:settings.voice};
  const журнал=[];
  Speech._voiceAdapter=v=>({speak(t){журнал.push("voice:"+(v?v.name:"-")+":"+t);return true;},cancel(){},speaking(){return false;}});
  Speech.allVoices=()=>[{name:"Microsoft Irina - Russian",lang:"ru-RU",voiceURI:"irina"},{name:"Microsoft Pavel - Russian",lang:"ru-RU",voiceURI:"pavel"}];
  settings.voice="";
  settings.gvVoice="m";Speech._gvFallback().speak("Сорок два.",{});
  settings.gvVoice="f";Speech._gvFallback().speak("Три.",{});
  Speech.allVoices=()=>[{name:"ru-ru-x-abc-local",lang:"ru-RU",voiceURI:"x"}];
  settings.gvVoice="m";const f=Speech._gvFallback();f.speak("Семь.",{});const вид=f.kind;
  Speech._voiceAdapter=были.v;Speech.allVoices=были.all;settings.gvVoice=были.gv;settings.voice=были.vc;
  return {журнал,вид};});
 check('2. незаписанное — голосом устройства того же пола; пол не виден — голос устройства по умолчанию',
  запас.журнал[0]==="voice:Microsoft Pavel - Russian:Сорок два."&&запас.журнал[1]==="voice:Microsoft Irina - Russian:Три."
  &&запас.журнал[2]==="voice:-:Семь."&&запас.вид==="device",запас);

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
  r.альтЛюди=!!VOICE_RACE_ALT.lyudi;
  const был=VOICE_RACE_ALT.lyudi;delete VOICE_RACE_ALT.lyudi;r.безАльта=Folk.народ(жЛюди,{всегда:true});if(был)VOICE_RACE_ALT.lyudi=был;
  Folk.сказать=было;
  return r;});
 check('3. пол голоса — пол жителя: женщина из людей — женской записью, мужчина из эльфов — мужской',
  жители.есть&&жители.жен.жЛюди===true&&жители.жен.мЭльф===false
  &&жители.женщинаЛюди.length===1&&/_f_g$/.test(жители.женщинаЛюди[0])&&жители.мужчинаЭльф.length===1&&!/_f_g$/.test(жители.мужчинаЭльф[0]),жители);
 check('4. нет записи нужного пола — запись другого пола не подставляется',
  жители.безЖенской===false&&жители.мужскаяЕсть===true,{без:жители.безЖенской,муж:жители.мужскаяЕсть});
 check('5. оклик народа звучит только голосом пола жителя: женщина из людей — своей записью',
  жители.окликЖенщиныЛюдей===!!жители.альтЛюди&&(жители.альтЛюди?/^race_lyudi_x_g$/.test(жители.окликПути1[0]||""):!жители.окликПути1.length)
  &&жители.окликМужчиныЛюдей===true&&/^race_lyudi_g$/.test(жители.окликПути2[0]||"")&&жители.безАльта===false,
  {ж:жители.окликПути1,м:жители.окликПути2,альт:жители.альтЛюди,безАльта:жители.безАльта});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
