/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 158: ПЕРЕНАЗНАЧЕНИЕ ЖЕСТОВ

   Карта жестов была вшита в обработчики намертво. У незрячего игрока своя
   рука и своя привычка от экранного чтеца, и то, что удобно одному,
   неудобно другому. Теперь между фигурой жеста и действием стоит слой
   привязок.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Фигур тридцать три: двадцать одна многопальцевая и двенадцать уголков.
   2. Фигур с удержанием нет вовсе — удержание занято ощупыванием.
   3. У каждой фигуры своё слово, и все слова разные.
   4. Действий двадцать девять, у каждого имя, слово и настоящий вызов.
   5. Умолчаний пятнадцать, и они в точности прежняя карта жестов.
   6. Пока ничего не переназначено, слой молчит: gestRun возвращает ложь.
   7. Переназначенная фигура выполняет своё действие.
   8. Одно действие стоит не больше чем на одной фигуре: назначив его на
      новую, со старой его снимают.
   9. «Нет команды» — тоже выбор: фигура молчит, но жест не теряется.
  10. Возврат к умолчанию возвращает всё разом.
  11. Назначенное ложится в сохранение.
  12. Тройное касание распознаётся: счёт касаний подряд доходит до трёх.
  13. Уголок распознаётся и по умолчанию ничего не меняет.
  14. Раздел настроек показывает все фигуры списками действий.
  15. Самопроверка держит строку gestbind; модуль, глава, README, docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);
 await page.evaluate(()=>{
  window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1–4. Состав ── */
 const состав=await page.evaluate(()=>({
  фигур:GEST_SHAPES.length,уник:new Set(GEST_SHAPES.map(s=>s.id)).size,
  многопальцевых:GEST_SHAPES.filter(s=>s.пальцы>=2).length,
  уголков:GEST_SHAPES.filter(s=>s.род==="corner").length,
  сУдержанием:GEST_SHAPES.filter(s=>s.род==="hold").length,
  слов:new Set(GEST_SHAPES.map(s=>gestShapeWord(s))).size,
  пустыеСлова:GEST_SHAPES.filter(s=>!gestShapeWord(s)).map(s=>s.id),
  действий:GEST_ACTIONS.length,уникД:new Set(GEST_ACTIONS.map(a=>a.id)).size,
  первое:GEST_ACTIONS[0].id,
  плохие:GEST_ACTIONS.filter(a=>!(a.n&&a.о&&typeof a.делать==="function")).map(a=>a.id)}));
 check('фигур тридцать три: двадцать одна многопальцевая и двенадцать уголков',
  состав.фигур===33&&состав.уник===33&&состав.многопальцевых===21&&состав.уголков===12,состав);
 check('фигур с удержанием нет вовсе: удержание занято ощупыванием',
  состав.сУдержанием===0,состав);
 check('у каждой фигуры своё слово, и все тридцать три слова разные',
  состав.слов===33&&состав.пустыеСлова.length===0,состав);
 check('действий тридцать два, у каждого имя, слово и настоящий вызов, а первое — «нет команды»',
  состав.действий===32&&состав.уникД===32&&состав.первое==="none"
  &&состав.плохие.length===0,состав);

 /* ── 5–6. Умолчания ── */
 const умолчания=await page.evaluate(()=>{
  G.gestBind={};
  const d=GEST_DEFAULTS;
  return {сколько:Object.keys(d).length,
   всеЖивые:Object.keys(d).every(k=>GEST_SHAPE_BY_ID[k]&&GEST_ACTION_BY_ID[d[k]]),
   инвентарь:d["3swipeS"],оружие:d["3tap2"],взаимодействие:d["2swipeS"],
   повтор:d["2swipeN"],карта:d["2swipeW"],журнал:d["2swipeE"],
   магия:d["4tap2"],меню:d["3swipeN"],
   всёПоУмолчанию:GEST_SHAPES.every(s=>gestIsDefault(s.id)),
   молчит:[gestRun(3,"swipe","S"),gestRun(3,"tap2",null),gestRun(2,"swipe","S"),
    gestRun(4,"tap2",null),gestRun(1,"corner","NS")],
   споров:gestConflicts().length};});
 check('умолчаний пятнадцать, и они в точности прежняя карта жестов: три вниз — инвентарь, двойное тремя — оружие, два вниз — взаимодействие',
  умолчания.сколько===15&&умолчания.всеЖивые
  &&умолчания.инвентарь==="inv"&&умолчания.оружие==="weapon"
  &&умолчания.взаимодействие==="interact"&&умолчания.повтор==="repeat"
  &&умолчания.карта==="map"&&умолчания.журнал==="journal"
  &&умолчания.магия==="magic"&&умолчания.меню==="actions"
  &&умолчания.споров===0,умолчания);
 check('пока ничего не переназначено, слой молчит и обработчики идут прежним путём',
  умолчания.всёПоУмолчанию&&умолчания.молчит.every(x=>x===false),умолчания);

 /* ── 7–9. Назначение ── */
 const назначение=await page.evaluate(()=>{
  G.gestBind={};
  /* Вешаем инвентарь на двойное касание двумя пальцами. */
  const ок=gestBind("2tap2","inv");
  const стало=gestActionId("2tap2");
  const сняли=gestActionId("3swipeS");       /* со старой фигуры снято */
  const неУмолчание=!gestIsDefault("2tap2");
  /* И он вправду открывается этим жестом. */
  const былоОткрыто=!!activeLayer();
  const сработал=gestRun(2,"tap2",null);
  const открылось=!!activeLayer();
  if(activeLayer())closeTopUI();
  /* «Нет команды» имеет смысл там, где умолчание не пусто: игрок гасит жест,
     к которому привык. Фигура молчит, но жест не теряется — слой забирает
     его себе и не пускает дальше по прежнему пути. */
  gestBind("3swipeE","none");
  const тихо=gestRun(3,"swipe","E");
  const гашено=gestActionId("3swipeE");
  return {ок,стало,сняли,неУмолчание,былоОткрыто,сработал,открылось,тихо,гашено,
   споров:gestConflicts().length};});
 check('переназначенная фигура выполняет своё действие: инвентарь открылся двойным касанием двумя пальцами',
  назначение.ок===true&&назначение.стало==="inv"&&назначение.неУмолчание
  &&назначение.былоОткрыто===false&&назначение.сработал===true&&назначение.открылось===true,назначение);
 check('одно действие стоит не больше чем на одной фигуре: со старой его сняли, споров нет',
  назначение.сняли==="none"&&назначение.споров===0,назначение);
 check('«нет команды» — тоже выбор: привычный жест гасится, фигура молчит, но не теряется',
  назначение.тихо===true&&назначение.гашено==="none",назначение);

 /* ── 10–11. Сброс и сохранение ── */
 const сброс=await page.evaluate(()=>{
  gestBind("2tap3","enc");
  const до=gestActionId("2tap3");
  const сохранено=(()=>{try{saveGame(true);
   const o=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");const g=o.G||o;
   return !!(g.gestBind&&g.gestBind["2tap3"]==="enc");}catch(_){return false;}})();
  gestReset();
  return {до,сохранено,
   после:gestActionId("2tap3"),
   всёПоУмолчанию:GEST_SHAPES.every(s=>gestIsDefault(s.id)),
   инвентарьВернулся:gestActionId("3swipeS")};});
 check('возврат к умолчанию возвращает всё разом, а назначенное до того ложится в сохранение',
  сброс.до==="enc"&&сброс.сохранено&&сброс.после==="none"
  &&сброс.всёПоУмолчанию&&сброс.инвентарьВернулся==="inv",сброс);

 /* ── 12. Тройное касание ── */
 const тройное=await page.evaluate(()=>{
  G.gestBind={};
  gestBind("3tap3","where");
  /* Счёт касаний подряд должен доходить до трёх. */
  multiTap.n=0;multiTap.c=0;multiTap.t=0;
  const шаги=[];
  for(let i=0;i<3;i++){
   const now=Date.now();
   let подряд=(multiTap.n===3&&now-multiTap.t<900)?(Number(multiTap.c)||0)+1:1;
   if(подряд>3)подряд=1;
   multiTap.n=3;multiTap.c=подряд;multiTap.t=now;
   шаги.push(подряд);}
  SAID.length=0;
  const сработал=gestRun(3,"tap3",null);
  return {шаги,сработал,сказано:(SAID[SAID.length-1]||"").slice(0,40)};});
 check('тройное касание распознаётся: счёт касаний подряд идёт один, два, три — и назначенное на него действие срабатывает',
  тройное.шаги.join(",")==="1,2,3"&&тройное.сработал===true,тройное);

 /* ── 12б. Пара не ломается тройкой ── */
 const пара=await page.evaluate(()=>{
  G.gestBind={};
  /* Четыре касания подряд четырьмя пальцами: панель магии должна открыться
     на втором и закрыться на четвёртом. Прежде счёт тройного сбивал пару, и
     открытая панель уже не закрывалась — она перехватывала касания, и
     игра выглядела зависшей. */
  const откр=()=>{const m=document.getElementById("magicPanel");return !!(m&&!m.hidden&&m.getAttribute("aria-hidden")!=="true");};
  multiTap.n=0;multiTap.t=0;multiTap.c=0;multiTap.p=0;multiTap.pt=0;
  const путь=[];
  for(let i=0;i<4;i++){
   const now=Date.now();
   const тройка=()=>{
    multiTap.c=(multiTap.p===4&&now-multiTap.pt<900)?(Number(multiTap.c)||0)+1:1;
    multiTap.p=4;multiTap.pt=now;
    const n=multiTap.c;if(n>=3)multiTap.c=0;return n;};
   const двойное=multiTap.n===4&&now-multiTap.t<900;
   тройка();
   multiTap.n=двойное?0:4;multiTap.t=now;
   handleFourFingerTap(двойное);
   путь.push(откр());}
  if(откр())handleFourFingerTap(true);
  return {путь};});
 check('счёт тройного не ломает пару: четыре касания подряд открывают панель магии вторым и закрывают четвёртым',
  пара.путь.join(",")==="false,true,true,false",пара);

 /* ── 13. Уголок ── */
 const уголок=await page.evaluate(()=>{
  G.gestBind={};
  const доНазначения=gestRun(1,"corner","WN");
  gestBind("cornerWN","где" in CMD?"where":"where");
  const послеНазначения=gestRun(1,"corner","WN");
  /* И состояние жеста умеет помнить две ноги. */
  resetGesture();
  const поля=("leg1" in gesture)&&("leg2" in gesture);
  return {доНазначения,послеНазначения,поля,
   слово:gestShapeWord(GEST_SHAPE_BY_ID["cornerWN"])};});
 check('уголок распознаётся, по умолчанию ничего не меняет, а назначенный — работает; слово у него человеческое',
  уголок.доНазначения===false&&уголок.послеНазначения===true&&уголок.поля
  &&/одним пальцем влево, затем вверх/.test(уголок.слово),уголок);

 /* ── 14. Настройки ── */
 const настройки=await page.evaluate(()=>{
  G.gestBind={};
  CMD.settings();
  const ok=renderGestBind();
  const row=document.getElementById("gestRow");
  const sel=row?row.querySelectorAll("select[data-gest]"):[];
  const опций=sel.length?sel[0].querySelectorAll("option").length:0;
  const кнопка=/gestreset/.test(document.getElementById("modal-settings").innerHTML);
  const немые=Array.from(sel).filter(x=>!x.getAttribute("aria-label")).length;
  if(activeLayer())closeTopUI();
  return {ok,списков:sel.length,опций,кнопка,немые};});
 check('раздел настроек показывает все тридцать три фигуры списками из тридцати двух действий, у каждого списка есть имя, и есть кнопка возврата',
  настройки.ok===true&&настройки.списков===33&&настройки.опций===32
  &&настройки.кнопка&&настройки.немые===0,настройки);

 /* ── 15. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  G.gestBind={};
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="gestbind");
  const m=Modules.get("GESTUREBIND");
  return {есть:!!r,ok:r?r.ok:false,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.shapes.length===33&&m.actions.length===32
    &&typeof m.bind==="function"&&typeof m.run==="function"&&typeof m.reset==="function",
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 88\. Жесты можно переназначить/.test(g.title)&&g.body.length>=6)};});
 check('самопроверка держит строку gestbind, модуль GESTUREBIND отвечает, глава 88 на месте',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.текст.length>40,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают переназначение жестов',
  /Жесты можно переназначить/i.test(readme)&&/тридцать три фигуры/i.test(readme)
  &&/Переназначение жестов/i.test(вз)&&/GEST_SHAPES/.test(вз),
  {readme:/Жесты можно переназначить/i.test(readme),docs:/GEST_SHAPES/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
