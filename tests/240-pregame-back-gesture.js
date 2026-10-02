/* ════════════════════════════════════════════════════════════════════════
   НАБОР 240: ЖЕСТ «НАЗАД» ДВУМЯ ПАЛЬЦАМИ ВНИЗ ДО ВХОДА В ИГРУ

   Просьба игрока (8.5): свайп двумя пальцами вниз должен работать «назад» и
   в главном меню — в энциклопедии звуков, настройках, руководстве, настройках
   персонажа, — как в самой игре: из дальнего раздела не нужно идти до кнопки
   «Закрыть».
   1. Энциклопедия звуков: из раздела — к списку разделов, оттуда — закрыть;
      закрытое окно отчитывается «Главное меню», а не «Игровое поле».
   2. Настройки: из пункта — к списку пунктов, оттуда — закрыть.
   3. Руководство: из главы — к оглавлению на ту же главу, оттуда — закрыть.
   4. Настройки персонажа и «Что нового» закрываются тем же жестом.
   5. На пустом главном меню жест отвечает, что закрывать нечего, и ничего
      не запускает; в прологе — молчит (назад из него идти некуда).
   6. Эскейп в главе руководства тоже возвращает к оглавлению.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>{window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{const m=o(t,x);window.__said.push(String(t));return m;};});
 async function down2(){
  const x=120,y=300,steps=6;
  const pts=k=>[0,1].map(i=>({x:x+i*60,y:y+Math.round(180*k/steps),id:i}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(0)});
  await page.waitForTimeout(16);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(k)});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(300);}
 const вид=()=>page.evaluate(()=>({игра:gameActive(),слой:(activeLayer()||{}).id||null,
  encycOpen:typeof encycOpen!=="undefined"?encycOpen:null,set:SETG.open||null,
  глава:!document.getElementById("guideChapter").hidden,фокус:(document.activeElement&&document.activeElement.textContent||"").trim().slice(0,60),
  сказано:__said.slice(-1)[0]||""}));

 /* ── 1 ── */
 await page.evaluate(()=>{CMD.encyc();const k=Object.keys(ENC_BY_ID)[0];openEncycCat(k,ENC_BY_ID[k].n||k);});
 const э0=await вид();await down2();const э1=await вид();await down2();const э2=await вид();
 check('1. энциклопедия звуков: из раздела — к списку разделов, затем закрыть',
  !э0.игра&&э0.слой==="modal-encyclopedia"&&!!э0.encycOpen&&э1.слой==="modal-encyclopedia"&&!э1.encycOpen&&э2.слой===null&&/закрыто\. Главное меню/.test(э2.сказано),{э0,э1,э2});

 /* ── 2 ── */
 await page.evaluate(()=>{CMD.settings();setGroupOpen(SET_GROUPS[SET_GROUPS.length-1].id);});
 const н0=await вид();await down2();const н1=await вид();await down2();const н2=await вид();
 check('2. настройки: из пункта — к пунктам, затем закрыть',
  н0.слой==="modal-settings"&&!!н0.set&&н1.слой==="modal-settings"&&!н1.set&&н2.слой===null,{н0,н1,н2});

 /* ── 3 ── */
 await page.evaluate(()=>{CMD.guide();showChapter(GUIDE.length-1);});
 const р0=await вид();await down2();const р1=await вид();await down2();const р2=await вид();
 const имя=await page.evaluate(()=>GUIDE[GUIDE.length-1].title);
 check('3. руководство: из главы — к оглавлению на ту же главу, затем закрыть',
  р0.слой==="guideOverlay"&&р0.глава&&р1.слой==="guideOverlay"&&!р1.глава&&р1.фокус===имя.slice(0,60)&&/Оглавление/.test(р1.сказано)&&р2.слой===null,{р0,р1,р2,имя});

 /* ── 4 ── */
 await page.evaluate(()=>{CMD.hero();});
 const г0=await вид();
 await page.evaluate(()=>{const b=document.querySelector('#modal-hero [data-punkt]');if(b)b.click();});
 const г1=await вид();const вглубь=await page.evaluate(()=>HEROUI.view);
 for(let i=0;i<4&&(await вид()).слой;i++)await down2();
 const г2=await вид();
 await page.evaluate(()=>CMD.whatsnew());const н=await вид();await down2();const н3=await вид();
 check('4. настройки персонажа и «Что нового» закрываются жестом',г0.слой==="modal-hero"&&г2.слой===null&&н.слой==="modal-news"&&н3.слой===null,{г0,г1,вглубь,г2,н,н3});

 /* ── 5 ── */
 await page.evaluate(()=>{__said.length=0;});
 await down2();const п=await вид();
 const пролог=await page.evaluate(()=>{const t=document.getElementById("screen-title"),i=document.getElementById("screen-intro");
  t.hidden=true;i.hidden=false;__said.length=0;return true;});
 await down2();const пр=await page.evaluate(()=>({видно:!document.getElementById("screen-intro").hidden,игра:gameActive(),сказано:__said.slice()}));
 await page.evaluate(()=>{document.getElementById("screen-intro").hidden=true;document.getElementById("screen-title").hidden=false;});
 check('5. пустое главное меню: «закрывать нечего», игра не начинается; пролог жест не трогает',
  !п.игра&&п.слой===null&&/закрывать нечего/.test(п.сказано)&&пролог&&пр.видно&&!пр.игра&&!пр.сказано.some(t=>/закрывать нечего/.test(t)),{п,пр});

 /* ── 6 ── */
 const эск=await page.evaluate(()=>{CMD.guide();showChapter(0);
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape",bubbles:true,cancelable:true}));
  const r={открыто:!document.getElementById("guideOverlay").hidden,глава:!document.getElementById("guideChapter").hidden};
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape",bubbles:true,cancelable:true}));
  r.закрыто=document.getElementById("guideOverlay").hidden;return r;});
 check('6. Эскейп в главе руководства — к оглавлению, второй — закрыть',эск.открыто&&!эск.глава&&эск.закрыто,эск);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
