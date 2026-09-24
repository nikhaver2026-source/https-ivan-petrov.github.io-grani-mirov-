/* ════════════════════════════════════════════════════════════════════════
   НАБОР 68: ОБЪЕКТ → ВЫБОР → ДЕЙСТВИЯ

   Взаимодействие было устроено по правилу «объект — одно действие»: касание
   по сундуку открывало сундук, по алтарю — молитву, по вещи — единственный её
   отклик. Это быстро, но это не мир: у сундука есть и осмотр, и
   простукивание, и поиск двойного дна; у стены — проверка на пустоту; у жилы
   — определение породы прежде кирки.

   И второе: если рядом НЕСКОЛЬКО объектов, выбирать за игрока нельзя. Для
   зрячего это мелочь. Незрячий не видит, на что нажал, и «оно сделало
   что-то» — худший из возможных ответов.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Быстрый путь не сломан. «Действие здесь» по-прежнему делает главное
      действие того, что под ногами, одним касанием. Новое дерево — не замена
      ему, а то, чего не было.
   2. Список объектов — настоящий: в нём то, что и вправду рядом, с расстоянием
      и стороной, и ничего лишнего.
   3. Действий у объекта больше одного, и все они доступны по делу: осмотр —
      везде, простукивание — у стены и двери, поиск отсека — у обстановки,
      определение породы — у жилы и ресурса.
   4. Действие ДЕЛАЕТ что-то, а не рисует кнопку: говорит, звучит и,
      где положено, меняет мир.
   5. Каждая кнопка читается вслух: окно годно для незрячего.
   6. Осмотр породы и кирка берут один и тот же список: осмотр не обещает
      того, чего кирка не даст.
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

 /* ── 1. Реестр действий полон ── */
 const реестр=await page.evaluate(()=>{
  const плохие=Object.values(IACT).filter(a=>!a.id||!a.n||typeof a.делать!=="function")
   .map(a=>a.id||"?");
  return {всего:Object.keys(IACT).length,плохие,
   есть:["look","listen","knock","hollow","secret","assay","use"].filter(id=>!IACT[id])};});
 check('действий в реестре не меньше семи, и у каждого имя и дело',
  реестр.всего>=7&&реестр.плохие.length===0&&реестр.есть.length===0,реестр);

 /* ── 2. Снаружи: объекты вокруг — настоящие ── */
 const снаружи=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.ship=null;G.alt=0;G.day=10;G.hour=12;
  const O=WORLD>>1;
  /* Ищем клетку, где есть ресурс, — чтобы список не был пуст. */
  let точка=null;
  outer: for(let x=O-120;x<O+120;x++)for(let y=O-120;y<O+120;y++){
   const c=cellContent(x,y);
   if(c.res||c.находка){точка={x,y};break outer;}}
  if(!точка)return {нет:true};
  G.x=точка.x;G.y=точка.y;
  const список=objectsHere();
  const c=cellContent(G.x,G.y);
  /* Всё, что в списке, обязано и вправду быть на своей клетке. */
  const лишние=список.filter(o=>{
   const cc=cellContent(o.x,o.y);
   if(o.вид==="res")return !cc.res;
   if(o.вид==="find")return !cc.находка;
   if(o.вид==="structure")return !cc.structure;
   return false;});
  return {точка,сколько:список.length,виды:список.map(o=>o.вид),
   лишних:лишние.length,
   уВсехИмя:список.every(o=>!!o.n),
   уВсехМесто:список.every(o=>Number.isFinite(o.d)&&Number.isFinite(o.dx)),
   действий:список.map(o=>actionsFor(o).length),
   естьРесурс:!!c.res||!!c.находка};});
 check('снаружи список объектов не пуст и не содержит лишнего',
  !снаружи.нет&&снаружи.сколько>0&&снаружи.лишних===0,снаружи);
 check('у каждого объекта есть имя, сторона и расстояние',
  !снаружи.нет&&снаружи.уВсехИмя&&снаружи.уВсехМесто,снаружи);
 check('у каждого объекта больше одного действия',
  !снаружи.нет&&снаружи.действий.every(n=>n>=2),снаружи);

 /* ── 3. Внутри: стена, дверь и обстановка — разные наборы действий ── */
 const внутри=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.ship=null;
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Проба",depth:0,x:1,y:1};
  const l=curLevel();
  if(!l)return {нет:true};
  /* Встаём рядом со стеной: она есть у любого уровня. */
  const найти=(t)=>{for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)
   if(tileAt(l,x,y)===t)return {x,y};return null;};
  const пол=найти(".");
  if(!пол)return {нет:true};
  G.place.x=пол.x;G.place.y=пол.y;
  const список=objectsHere();
  const наборы={};
  for(const o of список)наборы[o.плитка||o.вид]=actionsFor(o).map(a=>a.id);
  /* Отдельно: обстановка, если она есть на уровне. */
  const вещь=найти("X");
  let уВещи=null;
  if(вещь){G.place.x=вещь.x;G.place.y=вещь.y;
   const l2=objectsHere().find(o=>o.плитка==="X");
   уВещи=l2?actionsFor(l2).map(a=>a.id):null;}
  const жила=найти("R");
  let уЖилы=null;
  if(жила){G.place.x=жила.x;G.place.y=жила.y;
   const l3=objectsHere().find(o=>o.плитка==="R");
   уЖилы=l3?actionsFor(l3).map(a=>a.id):null;}
  while(activeLayer())closeTopUI();
  return {наборы,уВещи,уЖилы,плиток:Object.keys(наборы)};});
 check('у стены есть простукивание и проверка на пустоту',
  !внутри.нет&&!!внутри.наборы["#"]
  &&внутри.наборы["#"].includes("knock")&&внутри.наборы["#"].includes("hollow"),
  внутри.наборы&&внутри.наборы["#"]);
 check('у обстановки есть поиск скрытого отсека, а у стены его нет',
  !внутри.нет&&(!внутри.уВещи||внутри.уВещи.includes("secret"))
  &&(!внутри.наборы["#"]||!внутри.наборы["#"].includes("secret")),
  {вещь:внутри.уВещи,стена:внутри.наборы&&внутри.наборы["#"]});
 check('у жилы есть определение породы',
  !внутри.нет&&(!внутри.уЖилы||внутри.уЖилы.includes("assay")),внутри.уЖилы);

 /* ── 4. Действия и вправду делают: говорят и звучат ── */
 const дела=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.ship=null;
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Проба",depth:0,x:1,y:1};
  const l=curLevel();
  const найти=(t)=>{for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)
   if(tileAt(l,x,y)===t)return {x,y};return null;};
  const реплики=[],звуки=[];
  const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push("bank:"+r);return bp(r,o);};
  /* Маяк звучит НЕ через банк, а своим путём: если считать только Bank.play,
     «прислушаться» у стены покажется немым, хотя оно и есть звук. */
  const bo=window.beaconAt;
  window.beaconAt=(id,dx,dy,dz,d)=>{звуки.push("beacon:"+id);return bo?bo(id,dx,dy,dz,d):undefined;};
  const итоги=[];
  /* Один угол уровня беден: у пола вокруг одни стены. Обходим несколько мест,
     чтобы под руку попали и обстановка, и жила, и дверь. */
  const места=[найти("."),найти("X"),найти("R"),найти("+"),найти("C"),найти("K")].filter(Boolean);
  for(const м of места){
   G.place.x=м.x;G.place.y=м.y;
   for(const o of objectsHere()){
    for(const a of actionsFor(o)){
     if(a.id==="use")continue;          /* главное действие уводит в другое окно */
     if(String(a.id).indexOf("tech:")===0)continue;  /* работа у станка — набор 69 */
     const рБыло=реплики.length,зБыло=звуки.length;
     safeFn(()=>a.делать(o));
     итоги.push({объект:o.плитка||o.вид,действие:a.id,
      сказало:реплики.length>рБыло,прозвучало:звуки.length>зБыло});}}}
  Speech.say=say;Bank.play=bp;if(bo)window.beaconAt=bo;
  while(activeLayer())closeTopUI();
  return {проверено:итоги.length,
   немые:итоги.filter(t=>!t.сказало).map(t=>t.объект+"/"+t.действие),
   беззвучные:итоги.filter(t=>!t.прозвучало&&t.действие!=="look")
    .map(t=>t.объект+"/"+t.действие)};});
 check('проверено не меньше десятка действий в деле',дела.проверено>=10,дела.проверено);
 check('каждое действие говорит, что вышло',дела.немые.length===0,дела.немые);
 check('каждое действие, кроме осмотра, ещё и звучит',
  дела.беззвучные.length===0,дела.беззвучные);

 /* ── 5. Окно годно для незрячего: каждая кнопка читается вслух ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.ship=null;
  const O=WORLD>>1;
  let точка=null;
  outer: for(let x=O-120;x<O+120;x++)for(let y=O-120;y<O+120;y++){
   const c=cellContent(x,y);
   if(c.res||c.находка){точка={x,y};break outer;}}
  if(!точка)return {нет:true};
  G.x=точка.x;G.y=точка.y;
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  openObjects();
  const телоА=document.getElementById("objBody");
  const кнопкиА=[...телоА.querySelectorAll("button[data-cmd]")];
  const немыеА=кнопкиА.filter(e=>!e.getAttribute("data-speak")).length;
  /* Выбираем первый объект — открывается список его действий. */
  openObjActions(0);
  const телоБ=document.getElementById("objBody");
  const кнопкиБ=[...телоБ.querySelectorAll("button[data-cmd]")];
  const немыеБ=кнопкиБ.filter(e=>!e.getAttribute("data-speak")).length;
  const естьНазад=кнопкиБ.some(e=>e.dataset.cmd==="objback");
  /* Назад возвращает к списку объектов. */
  openObjects();
  const вернулись=document.getElementById("objTitle").textContent.indexOf("Что вокруг")>=0;
  Speech.say=say;
  const открыто=!document.getElementById("modal-object").hidden;
  while(activeLayer())closeTopUI();
  return {кнопокА:кнопкиА.length,немыеА,кнопокБ:кнопкиБ.length,немыеБ,
   естьНазад,вернулись,открыто,сказано:реплики.length,
   /* Первой говорит само окно («Окно... Выбрано: Закрыть») — так устроены все
      окна игры. Список объектов звучит следующей репликой, её и ищем. */
   назвало:реплики.some(t=>/Вокруг|Рядом нет/.test(t)),
   реплики:реплики.slice(0,3)};});
 check('окно объектов открывается и называет, что вокруг',
  !окно.нет&&окно.открыто&&окно.кнопокА>0&&окно.назвало,
  {реплики:окно.реплики});
 check('каждая кнопка в обоих уровнях окна читается вслух',
  !окно.нет&&окно.немыеА===0&&окно.немыеБ===0,окно);
 check('из действий объекта есть путь назад, к списку вокруг',
  !окно.нет&&окно.естьНазад&&окно.вернулись,окно);

 /* ── 6. Быстрый путь не сломан: «Действие здесь» по-прежнему одно касание ── */
 const быстро=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
  const O=WORLD>>1;
  let точка=null;
  outer: for(let x=O-150;x<O+150;x++)for(let y=O-150;y<O+150;y++){
   const c=cellContent(x,y);
   if(c.res&&!c.structure){точка={x,y};break outer;}}
  if(!точка)return {нет:true};
  G.x=точка.x;G.y=точка.y;G.inv={};
  const было=Object.values(G.inv||{}).reduce((s,v)=>s+(Number(v)||0),0);
  useHere();
  const стало=Object.values(G.inv||{}).reduce((s,v)=>s+(Number(v)||0),0);
  const окноОткрылось=!!document.getElementById("modal-object")
   &&!document.getElementById("modal-object").hidden;
  while(activeLayer())closeTopUI();
  return {было,стало,собрал:стало>было,окноОткрылось};});
 check('«Действие здесь» по-прежнему собирает ресурс одним касанием',
  !быстро.нет&&быстро.собрал,быстро);
 check('и не подменяется окном выбора',!быстро.нет&&быстро.окноОткрылось===false,быстро);

 /* ── 7. Осмотр породы и кирка берут один и тот же список ── */
 const порода=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:900,by:900,stype:"ruins",name:"Проба",depth:3,x:1,y:1};
  const глубоко=veinPool().join(",");
  G.place.depth=0;
  const сверху=veinPool().join(",");
  G.place=null;
  return {глубоко,сверху,разные:глубоко!==сверху,
   естьРуда:глубоко.indexOf("руда")>=0};});
 check('список жилы зависит от глубины и один на кирку и на осмотр',
  порода.разные&&порода.естьРуда,порода);

 /* ── 8. Пункт меню доступен, и в море с крыла его нет ── */
 const пункт=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.ship=null;G.alt=0;
  const наЗемле=amAvailable("objects");
  G.ship={name:"Проба",toName:"Куда-то",left:3,legs:3};
  const вМоре=amAvailable("objects");
  G.ship=null;
  return {наЗемле,вМоре};});
 check('пункт «Что вокруг» есть на земле и пропадает на борту',
  пункт.наЗемле===true&&пункт.вМоре===false,пункт);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
