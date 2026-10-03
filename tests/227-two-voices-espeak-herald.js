/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 227: ДВА ГОЛОСА GEMINI НА ВЕСЬ ИНТЕРФЕЙС, eSpeak NG, ВЕСТНИК (9.5.1)

   Просьба игрока: во «Встроенном голосе» — мужской или женский голос Gemini,
   и выбранный озвучивает весь интерфейс игры; голоса не работают вместе.
   Среди встроенных — eSpeak NG; голос компьютера — все прочие движки.
   Достижения и события — отдельным голосом вестника.
   1. «Выбор голоса»: мужской Gemini (по умолчанию), женский Gemini, eSpeak NG
      — и больше ничего («по разделам» нет).
   2. Выбран мужской — настройки, главное меню, «Настройки персонажа», меню
      действий и игра говорят описью мужского голоса; выбран женский —
      везде женского. Второй голос не вступает нигде.
   3. Прежний выбор «по разделам» переходит на мужской; мужской, женский и
      eSpeak остаются при своём.
   4. Достижения и события — голосом вестника; пока его опись не записана —
      выбранным голосом, никогда — вторым голосом Gemini.
   5. eSpeak NG: движок едет с игрой, грузится сам, говорит по-русски и
      доводит фразу до конца.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);

 /* ── 1. Выбор голоса ── */
 const в=await page.evaluate(()=>({gv:settings.gvVoice,опции:[...document.querySelectorAll('#setGvVoice option')].map(o=>o.value+":"+o.textContent)}));
 check('1. «Выбор голоса»: мужской Gemini по умолчанию, женский Gemini, eSpeak NG — и всё',
  в.gv==="m"&&в.опции.length===3&&/^m:Мужской голос Gemini/.test(в.опции[0])&&/^f:Женский голос Gemini/.test(в.опции[1])&&/^e:eSpeak NG/.test(в.опции[2]),в);

 /* ── 2. Один голос во всех разделах ── */
 const р=await page.evaluate(async()=>{const out={};
  for(const v of ["m","f"]){settings.gvVoice=v;Speech.gvLoad();
   for(let i=0;i<60&&Speech.gvMain().state!=="ready";i++)await new Promise(z=>setTimeout(z,100));
   const снимок=()=>Speech.GVOICE.glob;const s=[снимок()];
   CMD.settings();await new Promise(z=>setTimeout(z,150));s.push(снимок());while(activeLayer())closeTopUI();
   try{openHeroSetup();}catch(_){}await new Promise(z=>setTimeout(z,150));s.push(снимок());while(activeLayer())closeTopUI();
   try{enterGame();}catch(_){}while(activeLayer())closeTopUI();s.push(снимок());
   try{openActionMenu();}catch(_){}await new Promise(z=>setTimeout(z,150));s.push(снимок());while(activeLayer())closeTopUI();
   const клип=Speech.gvClip("Настройки");out[v]={описи:s,клип};}
  settings.gvVoice="m";return out;});
 check('2. выбран мужской — везде мужской голос, выбран женский — везде женский; второй не вступает',
  р.m.описи.every(g=>g==="GVOICE_BANK")&&р.f.описи.every(g=>g==="GVOICE_BANK_F")&&/gvoice\//.test(р.m.клип||"")&&/gvoice_f\//.test(р.f.клип||""),р);

 /* ── 3. Перенос прежнего выбора ── */
 const п={};
 for(const [было,надо] of [["m","m"],["f","f"],["z","m"],["e","e"]]){
  const c2=await browser.newContext();const p2=await c2.newPage();
  await p2.goto(process.argv[2]);await p2.waitForTimeout(600);
  const ключ=await p2.evaluate(()=>{for(const k of Object.keys(localStorage)){try{const j=JSON.parse(localStorage.getItem(k));if(j&&typeof j==="object"&&"gvVoice" in j)return k;}catch(_){}}return null;});
  await p2.evaluate(([k,v])=>{const j=JSON.parse(localStorage.getItem(k));j.gvVoice=v;localStorage.setItem(k,JSON.stringify(j));},[ключ,было]);
  await p2.reload();await p2.waitForTimeout(800);
  п[было]=await p2.evaluate(()=>settings.gvVoice);п[было+"_ok"]=п[было]===надо;
  await c2.close();}
 check('3. «по разделам» переходит на мужской; мужской, женский и eSpeak остаются',п.m_ok&&п.f_ok&&п.z_ok&&п.e_ok,п);

 /* ── 4. Вестник ── */
 const в4=await page.evaluate(()=>{const out={};const был=Speech.current;
  for(const v of ["m","f"]){settings.gvVoice=v;
   Speech.current={cat:"achieve",herald:true};const a=Speech.GVOICE.glob;
   Speech.current={cat:"event"};const e=Speech.GVOICE.glob;
   Speech.current={cat:"ui"};const u=Speech.GVOICE.glob;
   out[v]={достижение:a,событие:e,прочее:u};}
  Speech.current=был;settings.gvVoice="m";
  return {out,вкл:GV_HERALD_ON,класс:Speech._classify("Мировое событие: засуха. Продлится три дня.",{}).cat};});
 const ждём=v=>в4.вкл?"GVOICE_BANK_HERALD":(v==="f"?"GVOICE_BANK_F":"GVOICE_BANK");
 check('4. достижения и события — вестником (пока его описи нет — выбранным голосом), никогда вторым голосом Gemini',
  ["m","f"].every(v=>в4.out[v].достижение===ждём(v)&&в4.out[v].событие===ждём(v)&&в4.out[v].прочее===(v==="f"?"GVOICE_BANK_F":"GVOICE_BANK"))&&в4.класс==="event",в4);

 /* ── 5. eSpeak NG ── */
 const в5=await page.evaluate(async()=>{settings.ttsEngine="gemini";settings.gvVoice="e";Speech.adapter=null;Speech._kind=null;Speech.gvLoad();
  for(let i=0;i<80&&!ESpeak.ready();i++)await new Promise(z=>setTimeout(z,100));
  const a=Speech._adapter();let нач=false,кон=false;
  const ok=a&&a.speak("Здравствуй, путник.",{rate:5,volume:1,onstart(){нач=true;},onend(){кон=true;},onerror(){}});
  for(let i=0;i<50&&!кон;i++)await new Promise(z=>setTimeout(z,100));
  let ipa="";try{ipa=ESpeak.w.synthesize_ipa("путник").ipa||"";}catch(_){}
  settings.gvVoice="m";Speech.adapter=null;Speech._kind=null;
  return {готов:ESpeak.st,адаптер:a&&a.name,ok,нач,кон,ipa};});
 check('5. eSpeak NG едет с игрой, грузится сам, говорит по-русски и доводит фразу до конца',
  в5.готов==="ready"&&в5.адаптер==="espeak"&&в5.ok&&в5.нач&&в5.кон&&/p.*u.*t/.test(в5.ipa),в5);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
