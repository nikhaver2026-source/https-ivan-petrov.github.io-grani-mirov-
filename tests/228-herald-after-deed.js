/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 228: ВЕСТНИК ПОСЛЕ ДЕЛА — ДОСТИЖЕНИЯ СВОИМ ГОЛОСОМ И ПОСЛЕ СВЕДЕНИЙ

   Жалоба игрока: подобрал добычу — и ждёшь, пока отзвучит повышение Грани
   или достижение, и только потом слышишь, что собрано.
   1. Достижение и сведение о деле в одном такте: сначала звучит дело
      («Собрано…»), потом весть — даже если весть пришла первой.
   2. Весть звучит своим голосом: в игре мужской (Iapetus) — вестник женский
      (Callirrhoe), и наоборот.
   3. Новое сведение, пришедшее посреди вести, звучит сразу, а весть
      договаривается следом, а не пропадает.
   4. «Остановить речь» снимает и весть — она не возвращается.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);
 await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  Speech.gvLoad();for(let i=0;i<60&&(Speech.GVOICES.m.state!=="ready"||Speech.GVOICES.f.state!=="ready");i++)await new Promise(z=>setTimeout(z,100));
  /* учёт: что и каким голосом начато */
  window.НАЧАТО=[];const s0=Speech._speak.bind(Speech);
  Speech._speak=m=>{s0(m);НАЧАТО.push({t:m.text,herald:!!m.herald,голос:Speech.GVOICE.glob});};
  window.ДОСКАЗАНО=[];const f0=Speech._finish.bind(Speech);
  Speech._finish=(m,st,...r)=>{if(st==="COMPLETED")ДОСКАЗАНО.push((m.herald?"весть: ":"")+m.text);return f0(m,st,...r);};});
 const ждать=ms=>page.waitForTimeout(ms);

 /* ── 1–2. Весть первой в коде — звучит второй, своим голосом ── */
 const р1=await page.evaluate(async()=>{while(activeLayer())closeTopUI();Speech.stop();НАЧАТО.length=0;ДОСКАЗАНО.length=0;
  /* синтезатор, который кончает фразу только по команде проверки */
  window.__a0=Speech._adapter.bind(Speech);Speech._adapter=()=>({speak:()=>true,cancel(){}});
  narrate("Достижение: «Первый шаг» — сделан первый шаг.",{pri:1});
  narrate("Собрано: руда, две штуки.");
  await new Promise(z=>setTimeout(z,100));
  for(let i=0;i<20&&!ДОСКАЗАНО.some(x=>/^весть/.test(x));i++){if(Speech.current)Speech._finish(Speech.current,"COMPLETED");await new Promise(z=>setTimeout(z,50));}
  Speech.stop();Speech._adapter=__a0;
  return {начато:НАЧАТО.slice(),досказано:ДОСКАЗАНО.filter(x=>/Собрано|Первый шаг/.test(x))};});
 const р2=р1.начато,д=р1.досказано;
 check('1. сначала звучит дело («Собрано…»), весть о достижении — после, хоть и пришла первой',
  д.length===2&&/^Собрано/.test(д[0])&&/^весть: Достижение/.test(д[1]),{досказано:д,начато:р2.map(x=>(x.herald?"весть: ":"")+x.t)});
 const вест=р2.filter(x=>x.herald).pop()||{},дело=р2.find(x=>/^Собрано/.test(x.t))||{};
 check('2. весть звучит своим голосом: голос игры мужской — вестник женский',
  дело.голос==="GVOICE_BANK"&&вест.голос==="GVOICE_BANK_F",{дело:дело.голос,весть:вест.голос});

 /* ── 3. Новое сведение посреди вести ── */
 const р3=await page.evaluate(async()=>{while(activeLayer())closeTopUI();Speech.stop();НАЧАТО.length=0;
  /* синтезатор, который не кончает фразу сам: весть «звучит», пока её не оборвут */
  const a0=Speech._adapter.bind(Speech);Speech._adapter=()=>({speak:()=>true,cancel(){}});
  try{
   narrate("Достижение: «Сборщик» — собрано десять трав.",{pri:1});
   for(let i=0;i<60&&!(Speech.current&&Speech.current.herald);i++)await new Promise(z=>setTimeout(z,25));
   const шла=!!(Speech.current&&Speech.current.herald);
   narrate("Подобрано: шалфей.");
   await new Promise(z=>setTimeout(z,60));
   const теперь=Speech.current&&Speech.current.text;
   const ждёт=Speech.queue.filter(x=>x.herald).map(x=>x.text);
   return {шла,теперь,ждёт};}finally{Speech.stop();Speech._adapter=a0;}});
 check('3. сведение посреди вести звучит сразу, а весть договаривается следом',
  р3.шла&&/^Подобрано/.test(р3.теперь||"")&&р3.ждёт.length===1&&/Сборщик/.test(р3.ждёт[0]),р3);

 /* ── 4. Стоп ── */
 const р4=await page.evaluate(async()=>{while(activeLayer())closeTopUI();Speech.stop();НАЧАТО.length=0;
  narrate("Достижение: «Странник» — пройдено сто шагов.",{pri:1});
  for(let i=0;i<60&&!(Speech.current&&Speech.current.herald);i++)await new Promise(z=>setTimeout(z,25));
  Speech.stop();await new Promise(z=>setTimeout(z,600));
  return {начато:НАЧАТО.filter(x=>x.herald).length,что:НАЧАТО.map(x=>x.t.slice(0,40)),тек:Speech.current&&Speech.current.text,очередь:Speech.queue.length};});
 check('4. «остановить речь» снимает весть, и она не возвращается',р4.начато===1&&!р4.тек&&р4.очередь===0,р4);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
