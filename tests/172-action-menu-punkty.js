/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 172: МЕНЮ ДЕЙСТВИЙ — ПУНКТАМИ, КАК НАСТРОЙКИ

   Сто тридцать пунктов меню шли одной лентой с заголовками-перескоками, и
   квесты лежали в «Герое», книги — в «Своде знаний», проповедник — среди
   торговцев. Теперь меню двухуровневое: список шестнадцати разделов, и
   двойное касание открывает раздел, в котором только его пункты. Касания —
   настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шестнадцать разделов по смыслу, у каждого id, значок и что в нём;
      каждый из ста тридцати пунктов ровно в одном разделе; персонаж,
      квесты, книги — там, где их ищут.
   2. Три пальца вверх — список разделов и «Закрыть меню»; пунктов
      разделов не видно; выбор на первом разделе; игра называет число
      разделов и выбранный раздел с его содержимым.
   3. Свайп до «Квестов и журнала», двойное касание — в окне только его
      пункты и «Ко всем разделам меню», выбор на первом пункте, игра
      назвала раздел и число пунктов.
   4. Свайп двумя пальцами вниз — снова список, выбор на «Квестах»; второй
      такой свайп закрывает меню; заново меню открывается списком.
   5. Двойное касание по пункту раздела выполняет его и закрывает меню.
   6. Каждый раздел, открытый по очереди, показывает ровно свои уместные
      пункты; число в подписи раздела совпадает с окном.
   7. Пустой раздел в списке не стоит: «Начало пути» после выбора ремесла,
      «Грань и тьма» вдали от разлома.
   8. В бою первым пунктом списка — «Попытаться сбежать».
   9. «Ко всем разделам меню» и Эскейп тоже возвращают к списку; команда
      «menu:books» открывает меню сразу на разделе.
  10. Самопроверка держит строку ampunkty; глава 95 в первой части;
      README и docs описывают меню пунктами.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
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
 await page.evaluate(()=>{window.СКАЗАНО=[];const о=Speech.say.bind(Speech);
  Speech.say=function(t,x){window.СКАЗАНО.push(String(t));return о(t,x);};});

 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',
  {type,touchPoints:type==='touchEnd'?[]:[{x:Math.round(x),y:Math.round(y),id:1}]});
 const tap=async(x,y)=>{await touch('touchStart',x,y);await page.waitForTimeout(50);await touch('touchEnd',x,y);};
 const dbl=async(x,y)=>{await tap(x,y);await page.waitForTimeout(110);await tap(x,y);await page.waitForTimeout(320);};
 const свайп=async(dx,dy)=>{const x=195,y=420;
  await touch('touchStart',x,y);
  for(let i=1;i<=5;i++){await page.waitForTimeout(18);await touch('touchMove',x+dx*i/5,y+dy*i/5);}
  await page.waitForTimeout(18);await touch('touchEnd',x+dx,y+dy);await page.waitForTimeout(240);};
 const пальцами=async(n,dx,dy)=>{
  const pts=[];for(let i=0;i<n;i++)pts.push({x:110+i*50,y:430});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});
  for(let k=1;k<=6;k++){await page.waitForTimeout(18);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/6,y:p.y+dy*k/6,id:i}))});}
  await page.waitForTimeout(18);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);};
 const закрытьВсё=()=>page.evaluate(()=>{for(let i=0;i<30&&activeLayer();i++)closeTopUI();});
 /* Пустое место меню: заголовок h2, в нём нет пунктов. */
 const пусто=()=>page.evaluate(()=>{const h=document.querySelector('#actionMenu h2');const r=h.getBoundingClientRect();
  return {x:r.left+8,y:r.top+r.height/2};});
 const курсор=()=>page.evaluate(()=>uiCursor&&uiCursor.dataset&&uiCursor.dataset.cmd);
 const долистать=async(cmd,max=40)=>{
  for(let i=0;i<max;i++){if(await курсор()===cmd)return true;await свайп(200,0);}
  return false;};
 const видно=()=>page.evaluate(()=>visibleInteractive(document.getElementById("actionMenu")).map(x=>x.dataset.cmd));

 /* ── 1. раскладка ── */
 const раскладка=await page.evaluate(()=>{
  const где={};AM_GROUPS.forEach(g=>g[1].forEach(([c])=>{(где[c]=где[c]||[]).push(g[2].id);}));
  const дважды=Object.keys(где).filter(c=>где[c].length!==1);
  const в=(c)=>(где[c]||[])[0];
  return {ids:AM_GROUPS.map(g=>g[2].id),имена:AM_GROUPS.map(g=>g[0]),пунктов:Object.keys(где).length,дважды,
   мета:AM_GROUPS.every(g=>g[2].з&&g[2].о&&g[2].о.length>10),
   в:{char:в("char"),inv:в("inv"),bodystate:в("bodystate"),quests:в("quests"),journal:в("journal"),questlist:в("questlist"),
    lore:в("lore"),academy:в("academy"),best:в("best"),plants:в("plants"),preacher:в("preacher"),pantheon:в("pantheon"),
    sigils:в("sigils"),fish:в("fish"),resinfo:в("resinfo"),settings:в("settings"),hud:в("hud"),cases:в("cases")}};});
 check('1. шестнадцать разделов по смыслу, у каждого значок и что в нём; каждый пункт ровно в одном; персонаж, квесты и книги — где их ищут',
  раскладка.ids.join(",")==="start,here,move,fight,hero,quests,craft,people,magic,faith,books,world,realms,dark,sound,game"
  &&раскладка.пунктов===130&&раскладка.дважды.length===0&&раскладка.мета
  &&раскладка.в.char==="hero"&&раскладка.в.inv==="hero"&&раскладка.в.bodystate==="hero"
  &&раскладка.в.quests==="quests"&&раскладка.в.journal==="quests"&&раскладка.в.questlist==="quests"&&раскладка.в.cases==="quests"
  &&раскладка.в.lore==="books"&&раскладка.в.academy==="books"&&раскладка.в.best==="books"&&раскладка.в.plants==="books"
  &&раскладка.в.preacher==="faith"&&раскладка.в.pantheon==="faith"&&раскладка.в.sigils==="magic"&&раскладка.в.fish==="craft"
  &&раскладка.в.resinfo==="books"&&раскладка.в.settings==="game"&&раскладка.в.hud==="here",раскладка);

 /* ── 2. три пальца вверх — список разделов ── */
 await закрытьВсё();
 await page.evaluate(()=>{СКАЗАНО.length=0;});
 await пальцами(3,0,-170);
 const список=await page.evaluate(()=>{
  const m=document.getElementById("actionMenu");
  const в=visibleInteractive(m);
  return {открыто:!m.hidden,видно:в.map(x=>x.dataset.cmd),курсор:uiCursor&&uiCursor.dataset.cmd,
   подпись:(в[0]&&в[0].dataset.speak)||"",сказано:СКАЗАНО.filter(t=>/Меню действий/.test(t)).slice(-1)[0]||""};});
 check('2. три пальца вверх — список разделов, «Что нового» и «Закрыть меню», пунктов разделов не видно; выбор на первом; игра называет число разделов и содержимое выбранного',
  список.открыто&&список.видно.length>=10&&список.видно.slice(0,-2).every(c=>/^amgroup:/.test(c))&&список.видно.slice(-2).join()==="am:whatsnew,am:close"
  &&список.курсор===список.видно[0]&&/\d+ пункт/.test(список.подпись)&&/ — /.test(список.подпись)&&/Двойное касание — открыть/.test(список.подпись)
  &&/^Меню действий: \d+ раздел/.test(список.сказано)&&/Выбрано: /.test(список.сказано),список);

 /* ── 3. раздел «Квесты и журнал» двойным касанием ── */
 const дошли=await долистать("amgroup:quests");
 await page.evaluate(()=>{СКАЗАНО.length=0;});
 {const п=await пусто();await dbl(п.x,п.y);}
 const квесты=await page.evaluate(()=>{
  const m=document.getElementById("actionMenu");
  const в=visibleInteractive(m).map(x=>x.dataset.cmd);
  return {видно:в,открыт:AMG.open,курсор:uiCursor&&uiCursor.dataset.cmd,сказано:СКАЗАНО.slice(-1)[0]||"",
   своих:AM_GROUP_BY_ID.quests[1].filter(([c])=>amAvailable(c)).map(([c])=>"am:"+c)};});
 check('3. двойное касание по «Квестам и журналу» — в окне только его пункты и «Ко всем разделам меню», выбор на первом, игра назвала раздел',
  дошли&&квесты.открыт==="quests"&&квесты.видно.filter(c=>/^am:/.test(c)).join()===квесты.своих.join()
  &&квесты.видно.filter(c=>c==="amgroups").length===2&&квесты.видно.every(c=>/^am:/.test(c)||c==="amgroups")
  &&квесты.курсор===квесты.своих[0]&&/^Раздел «Квесты и журнал»: \d+ пункт/.test(квесты.сказано),квесты);

 /* ── 4. два пальца вниз — назад, потом закрыть ── */
 await пальцами(2,0,170);
 const назад=await page.evaluate(()=>({открыто:!document.getElementById("actionMenu").hidden,открыт:AMG.open,
  курсор:uiCursor&&uiCursor.dataset.cmd,сказано:СКАЗАНО.slice(-1)[0]||""}));
 await пальцами(2,0,170);
 const закрыто=await page.evaluate(()=>document.getElementById("actionMenu").hidden);
 await пальцами(3,0,-170);
 const заново=await видно();
 check('4. два пальца вниз — снова список, выбор на «Квестах»; второй такой свайп закрывает меню; заново меню открывается списком',
  назад.открыто&&назад.открыт===null&&назад.курсор==="amgroup:quests"&&/Ко всем разделам меню/.test(назад.сказано)
  &&закрыто&&заново.every(c=>/^amgroup:/.test(c)||c==="am:whatsnew"||c==="am:close"),{назад,закрыто,заново:заново.slice(0,4)});

 /* ── 5. пункт выполняется ── */
 await page.evaluate(()=>{resetCursor();});
 await долистать("amgroup:hero");
 {const п=await пусто();await dbl(п.x,п.y);}
 const доИнв=await долистать("am:inv",10);
 {const п=await пусто();await dbl(п.x,п.y);}
 await page.waitForTimeout(300);
 const выполнено=await page.evaluate(()=>({меню:!document.getElementById("actionMenu").hidden,
  котомка:!document.getElementById("modal-inventory").hidden}));
 check('5. двойное касание по пункту раздела выполняет его — «Инвентарь и экипировка» открывает котомку — и меню закрывается',
  доИнв&&выполнено.котомка&&!выполнено.меню,выполнено);
 await закрытьВсё();

 /* ── 6. каждый раздел — свои пункты, число совпадает ── */
 const разделы=await page.evaluate(()=>{
  openActionMenu();
  const m=document.getElementById("actionMenu");
  const плохие=[];let открыто=0;
  [...m.querySelectorAll("#amMenu [data-punkt]")].forEach(b=>{
   const id=b.dataset.punkt;const число=Number((/(\d+) пункт/.exec(b.dataset.speak)||[])[1]);
   CMD.amgroup(id);открыто++;
   const в=visibleInteractive(m).map(x=>x.dataset.cmd).filter(c=>/^am:/.test(c));
   const ждём=AM_GROUP_BY_ID[id][1].filter(([c])=>amAvailable(c)).map(([c])=>"am:"+c);
   if(в.join()!==ждём.join()||в.length!==число)плохие.push({id,в:в.length,ждём:ждём.length,число});
   amShowMenu(id);});
  closeActionMenu();
  return {открыто,плохие};});
 check('6. каждый раздел показывает ровно свои уместные пункты, и число в подписи раздела совпадает с окном',
  разделы.открыто>=10&&разделы.плохие.length===0,разделы);

 /* ── 7. пустые разделы ── */
 const пустые=await page.evaluate(()=>{
  const было=G.startCraft;G.startCraft="crafter";
  openActionMenu();
  const есть=[...document.querySelectorAll("#amMenu [data-punkt]")].map(x=>x.dataset.punkt);
  closeActionMenu();G.startCraft=было;
  return {есть,разлом:safeFn(()=>riftAt(G.x,G.y),false)};});
 check('7. пустой раздел в списке не стоит: «Начало пути» после выбора ремесла, «Грань и тьма» вдали от разлома',
  !пустые.есть.includes("start")&&(пустые.разлом||!пустые.есть.includes("dark"))&&пустые.есть.includes("hero"),пустые);

 /* ── 8. бой ── */
 const бой=await page.evaluate(()=>{
  G.inCombat=true;openActionMenu();
  const в=visibleInteractive(document.getElementById("actionMenu")).map(x=>x.dataset.cmd);
  closeActionMenu();G.inCombat=false;
  return в.slice(0,2);});
 check('8. в бою первым пунктом списка — «Попытаться сбежать»',бой[0]==="am:flee"&&/^amgroup:/.test(бой[1]||""),бой);

 /* ── 9. кнопка «назад», Эскейп, меню сразу на разделе ── */
 const пути=await page.evaluate(()=>{
  const m=document.getElementById("actionMenu");const r={};
  openActionMenu();CMD.amgroup("sound");
  const кн=m.querySelector('#amOne [data-cmd="amgroups"]');activateElement(кн);
  r.кнопка={открыт:AMG.open,курсор:uiCursor&&uiCursor.dataset.cmd};
  CMD.amgroup("game");
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
  r.эскейп={открыто:!m.hidden,открыт:AMG.open,курсор:uiCursor&&uiCursor.dataset.cmd};
  closeActionMenu();
  CMD.menu("books");
  r.сразу={открыто:!m.hidden,открыт:AMG.open,видно:visibleInteractive(m).map(x=>x.dataset.cmd).filter(c=>/^am:/.test(c))};
  closeActionMenu();
  return r;});
 check('9. «Ко всем разделам меню» и Эскейп возвращают к списку на тот же раздел; команда menu:books открывает меню сразу на «Книгах и знаниях»',
  пути.кнопка.открыт===null&&пути.кнопка.курсор==="amgroup:sound"
  &&пути.эскейп.открыто&&пути.эскейп.открыт===null&&пути.эскейп.курсор==="amgroup:game"
  &&пути.сразу.открыто&&пути.сразу.открыт==="books"&&пути.сразу.видно.includes("am:lore")&&!пути.сразу.видно.includes("am:char"),пути);

 /* ── 10. самопроверка, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();const r=rows.find(x=>x.id==="ampunkty");
  return {есть:!!r,ok:r&&r.ok,плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:GUIDE.some(g=>/Глава 95\. Меню действий — пунктами/.test(g.title)&&g.body.length>=6),
   часть:guidePartOf(GUIDE_BY_NUM[95]),модуль:Sections.menu().length===16};});
 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('10. самопроверка держит строку ampunkty, глава 95 в первой части, модуль SECTIONS знает шестнадцать разделов',
  свод.есть&&свод.ok&&свод.глава&&свод.часть==="Часть I. Первые шаги"&&свод.модуль,свод);
 check('ни одна строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);
 check('README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают меню действий пунктами (набор 172)',
  /Меню действий — пунктами/.test(readme)&&/## Меню действий — пунктами \(набор 172\)/.test(вз)&&/amGroupOpen/.test(вз),
  {readme:/Меню действий — пунктами/.test(readme),docs:/набор 172/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
