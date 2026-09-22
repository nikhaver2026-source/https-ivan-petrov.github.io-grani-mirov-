/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 166: ДВОЙНОЕ КАСАНИЕ — РОВНО ПО ТОМУ, ЧТО НАЗВАНО

   Главное правило игры для незрячего: пункт, который назван, и пункт,
   который выполняет двойное касание, — один и тот же. Было три разных
   ответа на вопрос «что под пальцем»: палец называл одно множество
   элементов, фокусом делал другое, поуже, а касание считало пунктом третье.
   Где они расходились, двойное касание уходило мимо. Хуже всего — текст
   переключателя в настройках: он лежит в <label> рядом с крошечным
   флажком, палец попадал в подпись, игра молчала, фокус оставался на
   «Назад», и двойное касание закрывало окно.

   Все касания — настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Палец на тексте флажка называет флажок, фокус встаёт на него, двойное
      касание в любом месте переключает именно его.
   2. Палец на подписи ползунка — фокус на ползунке, двойное касание меняет
      его значение.
   3. Палец на подписи списка — фокус на списке, двойное касание меняет выбор.
   4. Пункт, выбранный свайпом, выполняется двойным касанием, даже если оно
      пришлось на соседний пункт.
   5. Названный пальцем пункт остаётся фокусом и после паузы: двойное
      касание через секунду выполняет его.
   6. Палец, проведённый по нескольким пунктам, делает фокусом последний
      названный — его и выполняет двойное касание.
   7. Сплошной обход окна настроек: для каждого пункта названное пальцем
      совпадает с выполненным двойным касанием.
   8. Строка-подпись, названная пальцем, становится фокусом, и свайп идёт
      от неё к пункту ниже, а не прыгает в начало окна.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(2600);

 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',
  {type,touchPoints:type==='touchEnd'?[]:[{x:Math.round(x),y:Math.round(y),id:1}]});
 const hold=async(x,y,ms=650)=>{await touch('touchStart',x,y);await page.waitForTimeout(ms);await touch('touchEnd',x,y);await page.waitForTimeout(120);};
 const tap=async(x,y)=>{await touch('touchStart',x,y);await page.waitForTimeout(50);await touch('touchEnd',x,y);};
 const dbl=async(x,y)=>{await tap(x,y);await page.waitForTimeout(110);await tap(x,y);await page.waitForTimeout(260);};
 const slide=async(pts,ms=90)=>{await touch('touchStart',pts[0][0],pts[0][1]);
  for(const [x,y] of pts.slice(1)){await page.waitForTimeout(ms);await touch('touchMove',x,y);}
  await page.waitForTimeout(420);await touch('touchEnd',pts[pts.length-1][0],pts[pts.length-1][1]);await page.waitForTimeout(140);};
 /* Середина элемента; подписи — середина текста подписи, не флажка. */
 const точка=sel=>page.evaluate(sel=>{
  const el=typeof sel==="string"?document.querySelector(sel):sel;
  el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2};},sel);
 const открытьНастройки=async()=>{await page.evaluate(()=>{
  for(let i=0;i<30&&activeLayer();i++)closeTopUI();
  CMD.settings();resetCursor();});await page.waitForTimeout(450);};
 /* Пустое место окна: заголовок, в котором нет пунктов. */
 const пусто=()=>page.evaluate(()=>{
  const h=document.querySelector('#modal-settings header h2');const r=h.getBoundingClientRect();
  return {x:r.left+8,y:r.top+r.height/2};});

 /* ── 1. текст флажка ── */
 {
  await открытьНастройки();
  const т=await page.evaluate(()=>{
   const s=document.querySelector('#setSayHp').closest('label').querySelector('span b');
   s.scrollIntoView({block:"center"});const r=s.getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2,было:document.querySelector('#setSayHp').checked};});
  await hold(т.x,т.y);
  const фокус=await page.evaluate(()=>uiCursor&&uiCursor.id);
  const п=await пусто();await dbl(п.x,п.y);
  const r=await page.evaluate(было=>({стало:document.querySelector('#setSayHp').checked,
   окно:!document.getElementById('modal-settings').hidden,было}),т.было);
  await page.evaluate(было=>{const c=document.querySelector('#setSayHp');if(c.checked!==было)c.click();},т.было);
  check('1. палец на тексте флажка делает фокусом флажок, двойное касание переключает его',
   фокус==="setSayHp"&&r.стало!==r.было&&r.окно,{фокус,...r});
 }

 /* ── 2. подпись ползунка ── */
 {
  await открытьНастройки();
  const т=await page.evaluate(()=>{
   const lab=document.querySelector('#setMasterVol').closest('label');
   lab.scrollIntoView({block:"center"});const r=lab.getBoundingClientRect();
   return {x:r.left+22,y:r.top+r.height/2,было:+document.querySelector('#setMasterVol').value};});
  await hold(т.x,т.y);
  const фокус=await page.evaluate(()=>uiCursor&&uiCursor.id);
  const п=await пусто();await dbl(п.x,п.y);
  const стало=await page.evaluate(()=>+document.querySelector('#setMasterVol').value);
  check('2. палец на подписи ползунка — фокус на ползунке, двойное касание меняет его значение',
   фокус==="setMasterVol"&&стало!==т.было,{фокус,было:т.было,стало});
 }

 /* ── 3. подпись списка ── */
 {
  await открытьНастройки();
  const т=await page.evaluate(()=>{
   const lab=document.querySelector('#setVerbosity').closest('label');
   lab.scrollIntoView({block:"center"});const r=lab.getBoundingClientRect();
   return {x:r.left+22,y:r.top+r.height/2,было:document.querySelector('#setVerbosity').value};});
  await hold(т.x,т.y);
  const фокус=await page.evaluate(()=>uiCursor&&uiCursor.id);
  const п=await пусто();await dbl(п.x,п.y);
  const стало=await page.evaluate(()=>document.querySelector('#setVerbosity').value);
  await page.evaluate(v=>{const s=document.querySelector('#setVerbosity');s.value=v;s.dispatchEvent(new Event('change'));},т.было);
  check('3. палец на подписи списка — фокус на списке, двойное касание меняет выбор',
   фокус==="setVerbosity"&&стало!==т.было,{фокус,было:т.было,стало});
 }

 /* Дальше выполнение подменяется записью: проверяем, КОГО выполнили бы. */
 await page.evaluate(()=>{window.__act=[];window.__realAct=window.activateElement;
  window.activateElement=el=>{__act.push(el);touchGate.lastUiTap=0;touchGate.lastUiEl=null;return true;};});
 const выполнено=()=>page.evaluate(()=>{const el=__act[__act.length-1];
  return el?(el.id||el.dataset.cmd||(el.textContent||"").trim().slice(0,30)):null;});

 /* ── 4. выбранное свайпом выполняется, куда бы ни пришлось двойное касание ── */
 {
  await открытьНастройки();
  const ид=await page.evaluate(()=>{for(let i=0;i<6;i++)swipeNav('next');
   return uiCursor&&(uiCursor.id||uiCursor.dataset.cmd||(uiCursor.textContent||"").trim().slice(0,30));});
  /* Двойное касание — по соседнему пункту, а не по выбранному. */
  const сосед=await page.evaluate(()=>{const it=cursorItems(navLayer());const i=it.indexOf(uiCursor);
   const n=it[Math.min(it.length-1,i+3)];const r=n.getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2,ид:n.id||n.dataset.cmd||(n.textContent||"").trim().slice(0,30)};});
  await page.evaluate(()=>{__act.length=0;});
  await dbl(сосед.x,сосед.y);
  const вып=await выполнено();
  check('4. выбранное свайпом выполняется, даже если двойное касание пришлось на соседний пункт',
   вып===ид&&вып!==сосед.ид,{выбрано:ид,подПальцем:сосед.ид,выполнено:вып});
 }

 /* ── 5. названное остаётся фокусом и после паузы ── */
 {
  await открытьНастройки();
  const т=await точка('#setAutoDescribe');
  await hold(т.x,т.y);
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{__act.length=0;});
  const п=await пусто();await dbl(п.x,п.y);
  const вып=await выполнено();
  check('5. названный пальцем пункт выполняется двойным касанием и через секунду',
   вып==="setAutoDescribe",{выполнено:вып});
 }

 /* ── 6. палец провели по нескольким пунктам — фокус на последнем ── */
 {
  await открытьНастройки();
  /* Ощупывание ведением — это короткое и неспешное движение: длинный или
     быстрый взмах по правилам игры листает список, а не щупает. Ведём палец
     от одного переключателя к соседнему, медленно. */
  const а=await точка('#setAutoSpeech'),б=await page.evaluate(()=>{
   const r=document.querySelector('#setAutoDescribe').getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2};});
  const шаги=[];for(let k=0;k<=8;k++)шаги.push([а.x,а.y+(б.y-а.y)*k/8]);
  await slide(шаги,130);
  const фокус=await page.evaluate(()=>uiCursor&&uiCursor.id);
  await page.evaluate(()=>{__act.length=0;});
  const п=await пусто();await dbl(п.x,п.y);
  const вып=await выполнено();
  check('6. палец, проведённый по пунктам, делает фокусом последний названный — его и выполняет двойное касание',
   фокус==="setAutoDescribe"&&вып==="setAutoDescribe",{фокус,выполнено:вып});
 }

 /* ── 7. сплошной обход окна настроек ── */
 {
  await открытьНастройки();
  const всего=await page.evaluate(()=>cursorItems(navLayer()).length);
  const шаг=Math.max(1,Math.floor(всего/24));
  const мимо=[];let проверено=0;
  for(let i=0;i<всего;i+=шаг){
   const т=await page.evaluate(i=>{const it=cursorItems(navLayer())[i];if(!it)return null;
    it.scrollIntoView({block:"center"});const r=it.getBoundingClientRect();
    if(r.width<2||r.height<2)return null;
    return {x:r.left+Math.min(r.width/2,40),y:r.top+r.height/2};},i);
   if(!т)continue;
   await hold(т.x,т.y);
   const назван=await page.evaluate(()=>{const el=lastExploreEl||lastAnnouncedEl;
    return el?(el.id||el.dataset.cmd||(el.textContent||"").trim().slice(0,30)):null;});
   await page.evaluate(()=>{__act.length=0;});
   const п=await пусто();await dbl(п.x,п.y);
   const вып=await выполнено();
   проверено++;
   if(!назван||назван!==вып)мимо.push({i,назван,выполнено:вып});
   await page.evaluate(()=>{touchGate.lastUiTap=0;touchGate.lastUiEl=null;});
  }
  check('7. сплошной обход окна настроек: названное пальцем совпадает с выполненным двойным касанием',
   проверено>=15&&мимо.length===0,{проверено,мимо:мимо.slice(0,4)});
 }

 /* ── 8. строка-подпись: фокус и свайп от неё ── */
 {
  await открытьНастройки();
  /* Строка-подпись без tabindex: палец её называет, а в списке свайпа её
     нет. Кладём такую строку между двумя переключателями. */
  const т=await page.evaluate(()=>{
   const lab=document.querySelector('#setAutoSpeech').closest('label');
   const стр=document.createElement('div');
   стр.className='list-line';стр.id='__строка';
   стр.setAttribute('data-speak','Проверочная строка-подпись.');
   стр.textContent='Проверочная строка-подпись.';
   lab.after(стр);
   стр.scrollIntoView({block:"center"});const r=стр.getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2};});
  await hold(т.x,т.y);
  const фокус=await page.evaluate(()=>uiCursor&&uiCursor.id);
  const после=await page.evaluate(()=>{swipeNav('next');return uiCursor&&uiCursor.id;});
  const назад=await page.evaluate(()=>{
   const стр=document.getElementById('__строка');
   uiCursor=стр;swipeNav('prev');const id=uiCursor&&uiCursor.id;
   стр.remove();return id;});
  check('8. строка-подпись, названная пальцем, — фокус, и свайп идёт от неё, а не с начала окна',
   фокус==="__строка"&&после==="setAutoDescribe"&&назад==="setAutoSpeech",{фокус,после,назад});
 }

 await page.evaluate(()=>{if(window.__realAct)window.activateElement=window.__realAct;});
 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
