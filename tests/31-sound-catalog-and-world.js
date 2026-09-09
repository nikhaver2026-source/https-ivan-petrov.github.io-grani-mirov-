/* ════════════════════════════════════════════════════════════════════════
   ЗВУКОВОЙ КАТАЛОГ ПО РАЗДЕЛАМ И ЗВУЧАНИЕ МИРА

   Звуков стало больше семисот, и одним списком их не обойти. Энциклопедия
   устроена в два уровня: сначала разделы, потом звуки выбранного раздела.
   Набор проверяет, что по разделам можно ходить свайпом и двойным касанием,
   что из раздела есть выход, что ни один звук не потерялся между уровнями,
   и что новые записи действительно звучат в мире, а не лежат мёртвым грузом.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 const tap=async(x,y,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(100);};
 const swipe=async(fx,fy,tx,ty,steps=6,stepMs=14)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fx,y:fy,id:0}]});
  await page.waitForTimeout(stepMs);
  for(let i=1;i<=steps;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(fx+(tx-fx)*i/steps),y:fy,id:0}]});
   await page.waitForTimeout(stepMs);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tx,y:ty,id:0}]});
  await page.waitForTimeout(140);};
 const fwd=()=>swipe(120,430,330,430);
 const emptyPoint=()=>page.evaluate(()=>{
  const lay=activeLayer();if(!lay)return {x:195,y:400};
  for(let y=90;y<760;y+=8)for(const x of [6,384,195]){
   const el=document.elementFromPoint(x,y);
   if(el&&lay.contains(el)&&!el.closest('button,[data-cmd],input,select,a,[tabindex]:not([tabindex="-1"])'))return {x,y};}
  return {x:6,y:96};});
 const doubleTap=async()=>{const ep=await emptyPoint();await tap(ep.x,ep.y);await tap(ep.x,ep.y);await page.waitForTimeout(280);};

 // ── 1. Каталог открывается разделами, а не сплошным списком ──
 const cats=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();CMD.encyc();
  const lay=activeLayer();
  return {окно:lay&&lay.id,
   разделов:document.querySelectorAll('#encycCats .sound-card').length,
   пунктов:cursorItems(lay).length,
   имена:[...document.querySelectorAll('#encycCats .sound-card b')].map(x=>x.textContent),
   второйУровеньСкрыт:document.getElementById('encycOne').hidden,
   всего:soundTotals()};});
 check('энциклопедия открывается списком разделов',
  cats.окно==='modal-encyclopedia'&&cats.разделов>=20&&cats.второйУровеньСкрыт===true,cats);
 check('первый уровень короткий: по нему реально дойти свайпом',
  cats.пунктов<=40,{пунктов:cats.пунктов});
 check('в каталоге есть и синтезированные сцены, и живые записи, и оркестр',
  cats.имена.some(t=>/Стихии/.test(t))&&cats.имена.some(t=>/Живые инструменты и оркестр/.test(t))
  &&cats.имена.some(t=>/Музыка мира/.test(t))&&cats.имена.some(t=>/маяки/.test(t)),cats.имена);

 // ── 2. Ни один звук не потерялся между уровнями ──
 const покрытие=await page.evaluate(()=>{
  const вРазделах=new Set();
  sceneCats().forEach(([,,ids])=>ids.filter(i=>SOUNDS[i]).forEach(i=>вРазделах.add(i)));
  const пропали=Object.keys(SOUNDS).filter(i=>!вРазделах.has(i));
  const ролиВРазделах=new Set();
  Object.keys(BANK_CATS).forEach(cat=>Object.keys(SOUND_BANK)
   .filter(r=>(SOUND_BANK[r].f[0]||"").split("/")[0]===cat).forEach(r=>ролиВРазделах.add(r)));
  const ролиПропали=Object.keys(SOUND_BANK).filter(r=>!ролиВРазделах.has(r));
  return {сценПропало:пропали,ролейПропало:ролиПропали};});
 check('каждая синтезированная сцена попала в какой-нибудь раздел',
  !покрытие.сценПропало.length,покрытие.сценПропало);
 check('каждая роль банка попала в какой-нибудь раздел',
  !покрытие.ролейПропало.length,покрытие.ролейПропало);

 // ── 3. Раздел открывается двойным касанием и закрывается кнопкой ──
 await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
 const цель=await page.evaluate(()=>cursorItems(activeLayer())
  .findIndex(x=>/Живые инструменты и оркестр/.test(x.textContent||"")));
 for(let i=0;i<цель;i++)await fwd();
 const наРазделе=await page.evaluate(()=>(uiCursor.textContent||"").slice(0,20));
 await doubleTap();
 const внутри=await page.evaluate(()=>({заголовок:document.getElementById('encycOneTitle').textContent,
  звуков:document.querySelectorAll('#encycOneGrid .sound-card').length,
  разделыСкрыты:document.getElementById('encycCats').hidden,
  пунктов:cursorItems(activeLayer()).length}));
 check('свайп доводит до раздела, двойное касание его открывает',
  /Живые инструменты/.test(наРазделе)&&/оркестр/i.test(внутри.заголовок)&&внутри.звуков>=50
  &&внутри.разделыСкрыты===true,{курсор:наРазделе,...внутри});

 // возврат кнопкой «Ко всем разделам»
 await page.evaluate(()=>{resetCursor();ensureCursor(activeLayer());});
 const назад=await page.evaluate(()=>cursorItems(activeLayer())
  .findIndex(x=>/Ко всем разделам/.test(x.textContent||"")));
 for(let i=0;i<назад;i++)await fwd();
 await doubleTap();
 const вернулись=await page.evaluate(()=>({разделыВидны:!document.getElementById('encycCats').hidden,
  второйСкрыт:document.getElementById('encycOne').hidden}));
 check('из раздела можно вернуться ко всем разделам',
  вернулись.разделыВидны&&вернулись.второйСкрыт,вернулись);

 // ── 4. Каждый раздел непустой и каждая карточка называет себя ──
 const поРазделам=await page.evaluate(()=>{
  const out=[];
  const btns=[...document.querySelectorAll('#encycCats .sound-card')];
  for(let i=0;i<btns.length;i++){
   document.querySelectorAll('#encycCats .sound-card')[i].click();
   const карточки=[...document.querySelectorAll('#encycOneGrid .sound-card')];
   out.push({раздел:document.getElementById('encycOneTitle').textContent,
    звуков:карточки.length,
    немых:карточки.filter(c=>!(c.dataset.speak||"").trim()).length});
   closeEncycCat();}
  return out;});
 check('ни один раздел не пуст',поРазделам.every(r=>r.звуков>0),
  поРазделам.filter(r=>!r.звуков));
 check('в каждом разделе каждая карточка называет себя',
  поРазделам.every(r=>!r.немых),поРазделам.filter(r=>r.немых));

 // ── 5. Кнопка каталога называет настоящее число звуков ──
 const кнопка=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  refreshEncycButton();
  const b=document.getElementById('btnEncyc');
  const t=soundTotals();
  const m=(b.textContent.match(/\d+/)||[])[0];
  return {написано:Number(m),настоящее:t.всего,текст:b.textContent};});
 check('кнопка каталога называет столько звуков, сколько их есть',
  кнопка.написано===кнопка.настоящее&&кнопка.настоящее>600,кнопка);

 // ── 6. Указание авторства видно в самой игре ──
 const права=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();CMD.encyc();
  return document.getElementById('encycCredits').textContent;});
 check('в игре указаны все источники записей с их лицензиями',
  /FluidR3_GM/.test(права)&&/tonejs-instruments/.test(права)&&/Attribution/.test(права)
  &&/CC0/.test(права)&&/Sonic Pi/.test(права),права.slice(0,80));

 // ── 7. Новые записи звучат в мире, а не лежат мёртвым грузом ──
 const вМире=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  /* Роль считается задействованной, если её имя встречается в коде игры
     где-то ещё, кроме собственного объявления в банке. */
  const код=document.documentElement.innerHTML;
  const новые=Object.keys(SOUND_BANK).filter(r=>(SOUND_BANK[r].f[0]||"").startsWith("orch/"));
  const молчат=новые.filter(r=>{
   const все=(код.match(new RegExp("(?<![A-Za-z_])"+r+"(?![A-Za-z_0-9])","g"))||[]).length;
   const объявление=(код.match(new RegExp("[\\s{]"+r+":\\{f:","g"))||[]).length;
   return все-объявление<=0;});
  return {новых:новые.length,молчат};});
 check('каждая новая оркестровая запись где-то звучит в игре',
  вМире.новых>=50&&!вМире.молчат.length,вМире);

 // ── 8. Ресурсы под ногами получили живые записи вместо одного синтеза ──
 const маяки=await page.evaluate(()=>{
  const все=[...new Set(Object.values(RESBEACON))];
  return {всего:все.length,
   безЗаписи:все.filter(r=>!BEACON_ROLE[r]||!SOUND_BANK[BEACON_ROLE[r]]),
   пример:BEACON_ROLE["res_ore"]};});
 check('у каждого ресурса под ногами теперь живая запись',
  !маяки.безЗаписи.length&&маяки.всего>=8,маяки);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
