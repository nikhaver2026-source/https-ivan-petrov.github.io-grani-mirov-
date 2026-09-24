/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 182: ЛЕСТНИЦА НЕ ЗАЦИКЛИВАЕТСЯ, ШАГИ ПО СТУПЕНЯМ СЛЫШНЫ

   Жалоба игрока (приложение для Android): после касания по лестнице игра
   «зависает», двигаться нельзя; и в игре на сайте не слышно шагов по
   лестнице.

   Что было. Страж яруса проверялся только на последней ступени марша:
   игрок проходил полтора десятка ступеней, слышал «Вниз хода нет… Действие
   здесь — принять бой», а «действие здесь» на лестнице снова начинало тот
   же марш — по кругу. Шаг по ступени звучал записью лестничной клетки,
   тихой (в среднем −37 дБ) и сыгранной вполсилы.

   ЧТО ПРОВЕРЯЕТСЯ (в обстановке приложения: без speechSynthesis, с родным
   мостом GraniTTS, настоящими касаниями).
   1. Двойное касание по лестнице, на которой стоит страж, сразу начинает
      бой со стражем, а не марш.
   2. Без стража двойное касание начинает марш, свайпы ведут по ступеням, и
      марш кончается новым ярусом.
   3. Каждая ступень звучит настоящим шагом по камню (lug_step_stone или
      mtg_step_hard), соседние ступени — разными наборами.
   4. У дна шахта отвечает сразу, без марша.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),120);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};});
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 const cdp=await ctx.newCDPSession(page);
 const tap=async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:420,id:0}]});
  await page.waitForTimeout(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const dtap=async()=>{await page.waitForTimeout(400);await page.evaluate(()=>{while(activeLayer())closeTopUI();});await tap();await page.waitForTimeout(90);await tap();await page.waitForTimeout(600);};
 const swipe=async()=>{const x=195,y=420;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  for(let i=1;i<=5;i++){await page.waitForTimeout(20);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-24*i,id:0}]});}
  await page.waitForTimeout(20);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(350);};

 /* Подземелье, клетка спуска. */
 const стать=async(страж)=>page.evaluate(страж=>{
  try{enterGame();}catch(_){}G.tutorDone=1;G.inCombat=false;G.combat=null;G.flight=null;
  while(activeLayer())closeTopUI();
  if(!window.__место){
   let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){
    const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]&&/ruins|cave|crypt|mine|dungeon/.test(cc.structure.type))c={x,y};}
   window.__место=c;}
  const c=window.__место;G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));
  while(activeLayer())closeTopUI();
  const p=G.place;
  if(!страж)markGuardianDead(p.bx,p.by,p.depth);
  else if(G.guards)delete G.guards[guardKey(p.bx,p.by,p.depth)];
  const lvl=curLevel();let st=null;
  for(let y=0;y<lvl.h&&!st;y++)for(let x=0;x<lvl.w&&!st;x++)if(tileAt(lvl,x,y)===">")st={x,y};
  p.x=st.x;p.y=st.y;
  window.__роли=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{window.__роли.push(r);return b0(r,o);};
  const s0=Spatial.role.bind(Spatial);Spatial.role=(r,...a)=>{window.__роли.push(r);return s0(r,...a);};
  return {depth:p.depth,guard:!!guardianHere(),адаптер:Speech._adapter().name};},страж);

 /* ── 1. страж ── */
 const с1=await стать(true);
 await dtap();
 const бой=await page.evaluate(()=>({бой:!!G.inCombat,марш:!!G.flight,сказано:window.__tts.slice(-3).join(" ")}));
 check('1. в обстановке приложения: без speechSynthesis, речь идёт родным мостом',с1.адаптер==="native",с1);
 check('1б. двойное касание по лестнице со стражем сразу начинает бой, а не марш',
  с1.guard&&бой.бой&&!бой.марш,бой);

 /* ── 2–3. без стража: чистая страница, чтобы бой первого случая не мешал ── */
 const место=await page.evaluate(()=>window.__место);
 await page.reload();await page.waitForTimeout(900);
 await page.evaluate(м=>{window.__место=м;},место);
 const с2=await стать(false);
 await dtap();
 const начало=await page.evaluate(()=>({марш:G.flight&&{i:G.flight.i,n:G.flight.n},бой:!!G.inCombat,guard:!!guardianHere(),сказано:window.__tts.slice(-3).join(" ").slice(0,300)}));
 const путь=[];const ступени=[];
 for(let i=0;i<30;i++){
  await page.evaluate(()=>{window.__роли.length=0;});
  await swipe();
  const r=await page.evaluate(()=>({f:G.flight?G.flight.i:null,d:G.place&&G.place.depth,роли:window.__роли.slice()}));
  путь.push(r.f);
  if(r.f!==null)ступени.push(r.роли.filter(x=>x==="lug_step_stone"||x==="mtg_step_hard"));
  if(r.f===null&&r.d!==с2.depth){путь.push("ярус "+r.d);break;}}
 const конец=await page.evaluate(()=>({d:G.place&&G.place.depth,марш:!!G.flight}));
 check('2. без стража двойное касание начинает марш, свайпы ведут по ступеням до нового яруса',
  !!начало.марш&&конец.d===с2.depth+1&&!конец.марш,{начало,путь,конец});
 check('3. каждая ступень звучит настоящим шагом по камню',
  ступени.length>=5&&ступени.every(s=>s.length>=1),ступени.slice(0,6));
 check('3б. соседние ступени звучат разными наборами шагов',
  ступени.slice(0,6).some((s,i,a)=>i>0&&s[0]!==a[i-1][0]),ступени.slice(0,6));

 /* ── 4. дно ── */
 const дно=await page.evaluate(()=>{
  const p=G.place;const было=window.maxDepthHere;window.maxDepthHere=()=>p.depth;
  window.__tts.length=0;const r=startFlight(1,"N");window.maxDepthHere=было;
  return {r,марш:!!G.flight,сказано:window.__tts.join(" ")};});
 check('4. у дна шахта отвечает сразу, без марша',дно.r===false&&!дно.марш&&/Глубже хода нет|Дно/.test(дно.сказано),дно);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
