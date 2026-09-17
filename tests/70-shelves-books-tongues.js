/* ════════════════════════════════════════════════════════════════════════
   НАБОР 70: ПОЛКИ, КНИГИ И ЯЗЫКИ

   Клетка с книгами отдавала РОВНО ОДНУ страницу: подошёл, коснулся — прочёл
   то, что выпало. Выбора не было, и библиотека башни ничем не отличалась от
   одинокого пюпитра в подвале.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. На полке несколько книг и свитков, у каждого своё имя, своя полка
      собрания и свой язык, и список этот постоянен: та же полка — те же книги.
   2. Случайную книгу за игрока НЕ берут: список называется вслух, и выбирает
      игрок.
   3. Язык — настоящее препятствие, а не украшение. Немую книгу не прочесть, и
      игроку говорят, чего не хватает и у кого этому учат.
   4. Выученный язык открывает то, что было немо.
   5. Изучение с полки и изучение книги под ногами ведут в ОДНО место: одна и
      та же страница не может давать в двух местах разное.
   6. Быстрый путь не сломан: касание по клетке по-прежнему читает книгу.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* Общая подготовка: встаём на клетку с книгами внутри школы. */
 const встать=`(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.ship=null;G.lore=[];G.mast={};
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Проба",depth:0,x:1,y:1};
  const l=curLevel();if(!l)return false;
  for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)
   if(tileAt(l,x,y)==="K"){G.place.x=x;G.place.y=y;return true;}
  return false;})()`;

 /* ── 1. Языки и седьмое мастерство на месте ── */
 const языки=await page.evaluate(()=>{
  const плохие=BOOK_TONGUE.filter(t=>!t.id||!t.n||!t.о||!(t.нужно>=0)).map(t=>t.id||"?");
  const ступени=BOOK_TONGUE.map(t=>t.нужно);
  return {всего:BOOK_TONGUE.length,плохие,ступени,
   естьМастерство:!!MAST_BY_ID.lang,
   учат:Object.keys(MAST_TEACH).filter(p=>(MAST_TEACH[p]||{}).lang>0),
   станки:(MAST_BY_ID.lang||{}).станки||[],
   техника:!!TECH_BY_ID.decipher};});
 check('языков не меньше четырёх, от общего до языка погибших',
  языки.всего>=4&&языки.плохие.length===0&&Math.min(...языки.ступени)===0
  &&Math.max(...языки.ступени)>=3,языки);
 check('древние языки — такое же мастерство, и ему есть у кого учиться',
  языки.естьМастерство&&языки.учат.length>=2&&языки.техника,языки);

 /* ── 2. На полке несколько книг, и список постоянен ── */
 const полка=await page.evaluate(('(()=>{ const ок='+встать+'; if(!ок)return {нет:true};'+`
  const раз=shelfAt(G.place.x,G.place.y);
  const два=shelfAt(G.place.x,G.place.y);
  const книг=раз.filter(i=>i.вид==="книга").length;
  const свитков=раз.length-книг;
  /* Соседняя полка — другая. */
  let другая=null;
  const l=curLevel();
  for(let y=1;y<l.h-1&&!другая;y++)for(let x=1;x<l.w-1;x++)
   if(tileAt(l,x,y)==="K"&&(x!==G.place.x||y!==G.place.y)){другая=shelfAt(x,y);break;}
  return {сколько:раз.length,книг,свитков,
   устойчиво:JSON.stringify(раз)===JSON.stringify(два),
   уВсехИмя:раз.every(i=>!!i.n&&!!i.тема&&!!i.язык),
   разныеСтраницы:new Set(раз.map(i=>i.стр)).size,
   другаяЕсть:!!другая,
   другаяИная:!!другая&&JSON.stringify(другая)!==JSON.stringify(раз)};})()`));
 check('на полке от трёх книг и свитков, и у каждого имя, тема и язык',
  !полка.нет&&полка.сколько>=3&&полка.уВсехИмя,полка);
 check('та же полка — те же книги, а соседняя полка иная',
  !полка.нет&&полка.устойчиво&&(!полка.другаяЕсть||полка.другаяИная),полка);

 /* ── 3. Список называется вслух, и выбирает игрок ── */
 const окно=await page.evaluate(('(()=>{ const ок='+встать+'; if(!ок)return {нет:true};'+`
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  openObjects();
  const книжн=objList.findIndex(o=>o.плитка==="K");
  if(книжн<0){Speech.say=say;return {нет:true,почему:"объекта с книгами нет"};}
  openObjActions(книжн);
  const действия=[...document.getElementById("objBody").querySelectorAll("button[data-cmd]")]
   .map(e=>e.dataset.cmd);
  const естьПолка=действия.some(c=>c==="objact:"+книжн+":shelf");
  doObjAction(книжн,"shelf");
  const тело=document.getElementById("objBody");
  const пункты=[...тело.querySelectorAll("button[data-cmd^='sitem']")];
  const немые=пункты.filter(e=>!e.getAttribute("data-speak")).length;
  const назвало=реплики.some(t=>/На полке/.test(t));
  /* Выбираем первую книгу — открываются её действия. */
  openShelfItem(0);
  const тело2=document.getElementById("objBody");
  const действияКниги=[...тело2.querySelectorAll("button[data-cmd]")].map(e=>e.dataset.cmd);
  const немые2=[...тело2.querySelectorAll("button[data-cmd]")].filter(e=>!e.getAttribute("data-speak")).length;
  const естьЯзык=действияКниги.some(c=>/sact:0:tongue/.test(c));
  const естьНазад=действияКниги.some(c=>c==="sback");
  Speech.say=say;
  while(activeLayer())closeTopUI();
  return {естьПолка,пунктов:пункты.length,немые,назвало,
   действияКниги,немые2,естьЯзык,естьНазад,
   реплики:реплики.slice(0,4)};})()`));
 check('у клетки с книгами есть действие «Перебрать полку»',
  !окно.нет&&окно.естьПолка,окно);
 check('полка называет, сколько на ней книг и свитков, и даёт выбрать',
  !окно.нет&&окно.назвало&&окно.пунктов>=3&&окно.немые===0,окно);
 check('у выбранной книги свои действия, и все читаются вслух',
  !окно.нет&&окно.действияКниги.length>=3&&окно.немые2===0
  &&окно.естьЯзык&&окно.естьНазад,окно);

 /* ── 4. Язык — настоящее препятствие ── */
 const язык=await page.evaluate(('(()=>{ const ок='+встать+'; if(!ок)return {нет:true};'+`
  const список=shelfAt(G.place.x,G.place.y);
  const немая=список.find(i=>i.язык.нужно>0);
  if(!немая)return {нет:true,почему:"на этой полке всё на общем языке"};
  G.mast={};
  const безЗнания=bookReadable(немая);
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  shelfItems=список;shelfObj={x:G.place.x,y:G.place.y,n:"полка"};
  const страницДо=knowRead().length;
  doShelfAction(немая.i,"study");
  const страницПосле=knowRead().length;
  const сказало=реплики.join(" ");
  /* А теперь выучим язык — и та же книга откроется. */
  G.mast={lang:{ур:5,оп:0,дел:0}};
  const сЗнанием=bookReadable(немая);
  doShelfAction(немая.i,"study");
  const страницПотом=knowRead().length;
  Speech.say=say;
  while(activeLayer())closeTopUI();
  return {язык:немая.язык.id,нужно:немая.язык.нужно,
   безЗнания,сЗнанием,страницДо,страницПосле,страницПотом,
   объяснило:/язык неизвестен|Прочесть не выйдет|не выйдет/i.test(сказало),
   назвалоУчителей:/магистр|отшельник|советник/i.test(сказало),
   строка:сказало.slice(0,200)};})()`));
 check('немую книгу без знания языка не изучить, и страниц не прибавляется',
  язык.нет||(язык.безЗнания===false&&язык.страницПосле===язык.страницДо),язык);
 check('игроку объясняют, чего не хватает',язык.нет||язык.объяснило,
  {строка:язык.строка});
 check('выученный язык открывает то, что было немо',
  язык.нет||(язык.сЗнанием===true&&язык.страницПотом>язык.страницДо),язык);

 /* ── 5. Полка и клетка ведут в одно место ── */
 const одно=await page.evaluate(('(()=>{ const ок='+встать+'; if(!ок)return {нет:true};'+`
  G.mast={lang:{ур:5,оп:0,дел:0}};G.lore=[];
  const список=shelfAt(G.place.x,G.place.y);
  const it=список[0];
  shelfItems=список;shelfObj={x:G.place.x,y:G.place.y,n:"полка"};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  doShelfAction(it.i,"study");
  const сПолки=knowRead().slice();
  /* Та же страница второй раз ничего не прибавляет — ни с полки, ни с клетки. */
  doShelfAction(it.i,"study");
  const второй=knowRead().length;
  /* А книга под ногами читается прежним путём и тоже кладётся в собрание. */
  const доКлетки=knowRead().length;
  studyKnowledge(G.place.x,G.place.y);
  const послеКлетки=knowRead().length;
  Speech.say=say;
  while(activeLayer())closeTopUI();
  return {сПолки:сПолки.length,второй,доКлетки,послеКлетки,
   полкаДала:сПолки.length>0,повторНеДал:второй===сПолки.length,
   клеткаДала:послеКлетки>доКлетки,
   естьИзучено:реплики.some(t=>/Изучено/.test(t)),
   естьОдинПуть:typeof knowGrant==="function"&&typeof studyPage==="function"};})()`));
 check('изучение с полки кладёт страницу в собрание и говорит «Изучено»',
  !одно.нет&&одно.полкаДала&&одно.естьИзучено,одно);
 check('та же страница второй раз ничего не прибавляет',
  !одно.нет&&одно.повторНеДал,одно);
 check('книга под ногами читается прежним путём и ведёт туда же',
  !одно.нет&&одно.клеткаДала&&одно.естьОдинПуть,одно);

 /* ── 6. Быстрый путь: касание по клетке по-прежнему читает ── */
 const быстро=await page.evaluate(('(()=>{ const ок='+встать+'; if(!ок)return {нет:true};'+`
  G.lore=[];G.marks={};
  const до=knowRead().length;
  useHere();
  const после=knowRead().length;
  const окноПолки=!!document.getElementById("modal-object")
   &&!document.getElementById("modal-object").hidden;
  while(activeLayer())closeTopUI();
  return {до,после,прочитал:после>до,окноПолки};})()`));
 check('«Действие здесь» по-прежнему читает книгу одним касанием',
  !быстро.нет&&быстро.прочитал,быстро);
 check('и не подменяется окном полки',!быстро.нет&&быстро.окноПолки===false,быстро);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
