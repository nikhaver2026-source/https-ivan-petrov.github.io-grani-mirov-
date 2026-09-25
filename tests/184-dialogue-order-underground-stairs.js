/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 184: РАЗГОВОР ПО ОЧЕРЕДИ, В ПОДЗЕМЕЛЬЕ БЕЗ ПТИЦ, СЧЁТ СТУПЕНЕЙ

   Жалобы игрока (версия 3.4).
   • «После того как наш игрок сказал, голос персонажа, который отвечает,
     сливается с каким-то ещё голосом воедино». Порядок строгий: реплика
     героя, потом житель — чётко, без наложения других голосов, — потом
     снова герой.
   • «Когда игрок входит в подземелье, помимо звука подземелья почему-то
     слышно птиц». Слои земли (amb0/amb1) и погода не глохли под крышей.
   • «В настройках пункт, чтобы можно было отключить счёт ступеней».

   ЧТО ПРОВЕРЯЕТСЯ (обстановка приложения: без speechSynthesis, родной мост
   GraniTTS; время каждого голоса снимается с самих плееров).
   1. Окно жителя: оклик народа и ремесла и голос игры не звучат разом.
   2. «Поговорить»: ни одного наложения голосов.
   3. Ход разговора: сперва реплика героя, ответ жителя — после неё, и
      никакой другой голос не ложится на ответ.
   4. В подземелье нет ни слоёв земли, ни погоды, фон — голос глубины; на
      выходе под небо погода возвращается.
   5. Счёт ступеней выключается в настройках: марш идёт без «Ступень N из
      M», а включённый — со счётом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__log=[];const T0=performance.now();const now=()=>Math.round(performance.now()-T0);
  window.__now=now;window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){const d=Math.max(400,String(t).length*62);
    window.__tts.push(String(t));window.__log.push({k:"tts",t0:now(),t1:now()+d,s:String(t).slice(0,70)});
    window.__ttsTimer=setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),d);},
   stop(){clearTimeout(window.__ttsTimer);const l=window.__log.filter(x=>x.k==="tts").pop();if(l&&l.t1>now())l.t1=now();},
   isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};
  const play0=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   const src=String(this.src||"");const rec={k:"a",src:src.replace(/^.*\/sounds\//,""),t0:now(),t1:null};
   if(/sounds\//.test(src)){window.__log.push(rec);
    const end=()=>{if(rec.t1==null)rec.t1=now();};
    this.addEventListener("ended",end,{once:true});this.addEventListener("pause",end,{once:true});this.addEventListener("emptied",end,{once:true});}
   return play0.apply(this,arguments);};});
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}G.tutorDone=1;while(activeLayer())closeTopUI();settings.folk=1;
  /* Заставка и голоса места здесь ни при чём — не мешаем им замерам. */
  try{Intro.stop();}catch(_){}PlaceVoice.ПАУЗА=1e9;});
 await page.waitForTimeout(1500);

 const голос=x=>x.k==="tts"||/^voice\//.test(x.src)||/^throng\//.test(x.src)||/^bed\/pv_/.test(x.src);
 const снять=async(код,ждать)=>{
  await page.evaluate(()=>{window.__log.length=0;});
  await page.evaluate(код);
  await page.waitForTimeout(ждать);
  const log=await page.evaluate(()=>{const n=window.__now();return window.__log.map(x=>Object.assign({},x,{t1:x.t1==null?n:x.t1}));});
  const гл=log.filter(голос);const over=[];
  for(let i=0;i<гл.length;i++)for(let j=i+1;j<гл.length;j++){
   const a=гл[i],c=гл[j];const o=Math.min(a.t1,c.t1)-Math.max(a.t0,c.t0);
   if(o>150)over.push(`${(a.src||"TTS:"+a.s).slice(0,40)} ⟂ ${(c.src||"TTS:"+c.s).slice(0,40)} : ${o} мс`);}
  return {гл,over};};

 const key=await page.evaluate(()=>getNPC(3000,3000,0,"Кузнец").key);
 /* ── 1. окно жителя ── */
 const окно=await снять(`openNPC(${JSON.stringify(key)})`,15000);
 check('1. окно жителя: оклик и голос игры не звучат разом',
  окно.over.length===0&&окно.гл.length>=2,{голосов:окно.гл.length,наложения:окно.over});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});await page.waitForTimeout(800);

 /* ── 2. «Поговорить» ── */
 const говор=await снять(`CMD.npctalk(${JSON.stringify(key)})`,9000);
 check('2. «Поговорить»: ни одного наложения голосов',говор.over.length===0&&говор.гл.length>=1,
  {голосов:говор.гл.length,наложения:говор.over});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});await page.waitForTimeout(800);

 /* ── 3. ход разговора ── */
 await page.evaluate(k=>openNPC(k),key);await page.waitForTimeout(5000);
 const ход=await снять(`CMD.dlg(${JSON.stringify(key)}+":rassprosit")`,12000);
 const герой=ход.гл.find(x=>/^voice\/hero_/.test(x.src));
 const житель=ход.гл.find(x=>/^voice\/(say_|race_|prof_)/.test(x.src)&&(!герой||x.t0>=герой.t0));
 check('3. ход разговора: сперва герой, ответ жителя — после него, и на ответ не ложится другой голос',
  !!герой&&!!житель&&житель.t0>=герой.t1-150&&ход.over.length===0,
  {герой:герой&&[герой.src,герой.t0,герой.t1],житель:житель&&[житель.src,житель.t0,житель.t1],наложения:ход.over});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 4. подземелье без птиц и погоды ── */
 const глубь=await page.evaluate(()=>{
  let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){
   const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"&&/ruins|cave/.test(cc.structure.type))c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;G.weather="Дождь";Weather.set("Дождь");
  bankUpdateAmbient();
  const снаружи={w1:Play.active.has("w1"),amb0:Play.active.has("amb0")};
  enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  bankUpdateAmbient();
  const внутри={w1:Play.active.has("w1"),w2:Play.active.has("w2"),amb0:Play.active.has("amb0"),amb1:Play.active.has("amb1"),
   фон:bankAmbientRole(),живой:(Bank.loops.get("live")||{}).role||null,глухо:Weather.hushed};
  leavePlace();
  const наружу={w1:Play.active.has("w1"),глухо:Weather.hushed};
  return {снаружи,внутри,наружу};});
 const птицы=/bird|forest|owl|raven|amb_forest|amb_plains|wild_birds|oc_birds/;
 check('4. в подземелье нет ни слоёв земли, ни погоды, фон — голос глубины',
  !глубь.внутри.w1&&!глубь.внутри.w2&&!глубь.внутри.amb0&&!глубь.внутри.amb1&&глубь.внутри.глухо
  &&/^(deep_|stk_|amb_abyss)/.test(глубь.внутри.фон)&&!птицы.test(String(глубь.внутри.живой||"")),глубь);
 check('4б. под открытым небом погода возвращается',глубь.снаружи.w1&&глубь.наружу.глухо===false,глубь);

 /* ── 5. счёт ступеней ── */
 const марш=async(счёт)=>page.evaluate(счёт=>{
  settings.stairCount=счёт;
  try{enterGame();}catch(_){}G.inCombat=false;G.combat=null;G.flight=null;
  while(activeLayer())closeTopUI();
  let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){
   const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]&&/ruins|cave|crypt|mine|dungeon/.test(cc.structure.type))c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  const p=G.place;markGuardianDead(p.bx,p.by,p.depth);
  const lvl=curLevel();let st=null;
  for(let y=0;y<lvl.h&&!st;y++)for(let x=0;x<lvl.w&&!st;x++)if(tileAt(lvl,x,y)===">")st={x,y};
  p.x=st.x;p.y=st.y;
  /* Описание места ещё может звучать: обрываем, как сделал бы шаг игрока. */
  try{Speech.userCut();}catch(_){}
  window.__tts.length=0;startFlight(1,"N");const n=G.flight&&G.flight.n;
  const ступени=[];for(let i=0;i<4&&G.flight;i++){flightStep("N");ступени.push(G.flight&&G.flight.i);}
  return {сказано:window.__tts.join(" | "),n,ступени};},счёт);
 const чисто=async()=>{await page.reload();await page.waitForTimeout(900);
  await page.evaluate(()=>{try{Intro.stop();}catch(_){}});await page.waitForTimeout(200);};
 /* Ждём, пока прозвучит объявление марша (и счёт, если он включён), — не
    дольше двенадцати секунд; потом ещё секунду слушаем, не придёт ли счёт. */
 const дослушать=async(нужно)=>{for(let t=0;t<120;t++){
   const с=await page.evaluate(()=>window.__tts.join(" | "));if(нужно.test(с))break;await page.waitForTimeout(100);}
  await page.waitForTimeout(1000);return page.evaluate(()=>window.__tts.join(" | "));};
 await чисто();const безСчёта=await марш(0);
 безСчёта.сказано=await дослушать(/Марш лестницы/);
 await чисто();const соСчётом=await марш(1);
 соСчётом.сказано=await дослушать(/Ступень \d+ из \d+/);
 const есть=await page.evaluate(()=>!!document.getElementById("setStairCount")&&settings.stairCount!==undefined);
 check('5. в настройках есть пункт «Считать ступени на лестнице»',есть);
 check('5б. счёт выключен: марш идёт, игра называет его, но не считает «Ступень N из M»',
  безСчёта.n>0&&безСчёта.ступени.filter(Boolean).length>=3&&/Марш лестницы/.test(безСчёта.сказано)&&!/Ступень \d+ из \d+/.test(безСчёта.сказано),безСчёта);
 check('5в. счёт включён: ступени считаются вслух',/Ступень \d+ из \d+/.test(соСчётом.сказано),соСчётом.сказано.slice(0,300));

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
