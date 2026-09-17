/* ════════════════════════════════════════════════════════════════════════
   НАБОР 72: ПОДСКАЗКА В ТОТ МИГ, КОГДА ОНА НУЖНА

   Обучение жестам — девять уроков в начале, и на этом оно кончалось. Всё, что
   появилось в мире потом — станки, полки, ловушки, приметы, разъезды, — игрок
   должен был найти сам, перебирая меню. Незрячему меню читают вслух по пункту,
   и «перебрать всё» стоит дорого.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Подсказки есть на всё новое, и каждая называет, ГДЕ это искать, а не
      просто сообщает о существовании.
   2. Каждая говорится один раз за игру и не повторяется.
   3. Сказанное помнится в сохранении: после загрузки заново не объясняют.
   4. Подсказка не перебивает того, что игра говорит по делу.
   5. Отклик обучения на удачный урок звучит. Он не звучал ни разу: «ui_success»
      лежит в UI-банке, а Bank.play ищет только в банке ролей.
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

 /* ── 1. Подсказки есть на всё новое и говорят, где искать ── */
 const набор=await page.evaluate(()=>{
  const надо=["find","station","teacher","shelf","dungeon","patrol","crossing","sign","mastery"];
  const нет=надо.filter(id=>!HINTS[id]);
  const коротко=Object.keys(HINTS).filter(id=>String(HINTS[id]).length<40);
  /* Подсказка обязана называть, где это искать: меню, пункт или действие. */
  const безПути=Object.keys(HINTS).filter(id=>
   !/меню действий|«[^»]+»|выберите|проситься/i.test(String(HINTS[id])));
  return {всего:Object.keys(HINTS).length,нет,коротко,безПути};});
 check('подсказки есть на всё новое: находки, станки, наставники, полки, подземелье, разъезды, переправы, приметы, мастерства',
  набор.нет.length===0&&набор.всего>=9,набор);
 check('каждая подсказка не отписка, а объяснение с путём, куда идти',
  набор.коротко.length===0&&набор.безПути.length===0,набор);

 /* ── 2. Каждая говорится один раз ── */
 const однажды=await page.evaluate(()=>{
  G.hints={};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const перв=hint("shelf");
  const втор=hint("shelf");
  const трет=hint("shelf");
  Speech.say=say;
  return {перв,втор,трет,сказано:реплики.length,
   помнит:!!(G.hints&&G.hints.shelf)};});
 check('подсказка говорится один раз, а потом молчит',
  однажды.перв===true&&однажды.втор===false&&однажды.трет===false
  &&однажды.сказано===1&&однажды.помнит,однажды);

 /* ── 3. Подсказка звучит, и звук берётся из того банка, где запись и лежит ── */
 const звук=await page.evaluate(()=>{
  G.hints={};
  let uiNat=0,bank=0;
  const un=UI.nat.bind(UI);UI.nat=(r,g)=>{uiNat++;return un(r,g);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{bank++;return bp(r,o);};
  hint("dungeon");
  UI.nat=un;Bank.play=bp;
  /* И проверим саму причину прежней немоты: Bank.play чужое имя не знает. */
  const знаетБанк=Bank.has("ui_success");
  const естьВUI=!!(typeof UI_BANK!=="undefined"&&UI_BANK["ui_success"]);
  return {uiNat,bank,знаетБанк,естьВUI};});
 check('подсказка отзывается звуком, и звук идёт через UI-банк',
  звук.uiNat>0,звук);
 check('причина прежней немоты названа верно: записи нет в банке ролей, но есть в UI-банке',
  звук.знаетБанк===false&&звук.естьВUI===true,звук);

 /* ── 4. Отклик обучения на удачный урок теперь звучит ── */
 const урок=await page.evaluate(()=>{
  let uiNat=0;const un=UI.nat.bind(UI);UI.nat=(r,g)=>{uiNat++;return un(r,g);};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  Tutor.on=true;Tutor.i=0;Tutor.tries=0;
  Tutor.note(Tutor.steps[0].want);
  Tutor.stop(true);
  UI.nat=un;Speech.say=say;
  return {uiNat,шаг:Tutor.i,сказало:реплики.length>0};});
 check('удачный урок обучения отзывается звуком, а не одной строкой',
  урок.uiNat>0&&урок.сказало,урок);

 /* ── 5. Подсказка не перебивает того, что говорится по делу ── */
 const неперебивает=await page.evaluate(()=>{
  G.hints={};
  const вызовы=[];const say=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{вызовы.push({t:String(t),перебой:!o||o.interrupt!==false});return say(t,o);};
  hint("patrol");
  Speech.say=say;
  return {вызовов:вызовы.length,безПеребоя:вызовы.every(v=>!v.перебой)};});
 check('подсказка идёт без перебоя: она не затирает сказанное по делу',
  неперебивает.вызовов>0&&неперебивает.безПеребоя,неперебивает);

 /* ── 6. Подсказки срабатывают там, где положено ── */
 const вмире=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.hints={};G.dark=false;G.ship=null;
  /* Под землёй — про пол. */
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:7,x:1,y:1};
  const l=curLevel();
  for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)
   if(tileAt(l,x,y)==="."){G.place.x=x;G.place.y=y;y=l.h;break;}
  hintAround();
  const проПол=!!G.hints.dungeon;
  /* У полки — про полку. */
  G.hints={};
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Проба",depth:0,x:1,y:1};
  const l2=curLevel();
  let уПолки=false;
  outer: for(let y=1;y<l2.h-1;y++)for(let x=1;x<l2.w-1;x++)
   if(tileAt(l2,x,y)==="K"){
    for(const [dx,dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0]]){
     const px=x+dx,py=y+dy;
     if(tileAt(l2,px,py)==="."||tileAt(l2,px,py)==="K"){
      G.place.x=px;G.place.y=py;hintAround();уПолки=!!G.hints.shelf;break outer;}}}
  while(activeLayer())closeTopUI();
  G.place=null;
  return {проПол,уПолки};});
 check('под землёй подсказка говорит про пол',вмире.проПол,вмире);
 check('у полки подсказка говорит про полку',вмире.уПолки,вмире);

 /* ── 7. Сказанное переживает сохранение ── */
 const сейв=await page.evaluate(()=>{
  G.hints={};
  hint("mastery");
  const raw=serializeSave();
  const вЗаписи=(()=>{try{return !!JSON.parse(raw).hints;}catch(_){return false;}})();
  G.hints={};
  Object.assign(G,JSON.parse(raw));
  const снова=hint("mastery");
  return {вЗаписи,снова,помнит:!!(G.hints&&G.hints.mastery)};});
 check('сказанное попадает в запись и после загрузки не повторяется',
  сейв.вЗаписи&&сейв.помнит&&сейв.снова===false,сейв);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
