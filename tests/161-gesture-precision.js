/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 161: ТОЧНОСТЬ ЖЕСТОВ — ЧУТКОСТЬ И ОКНО ДВОЙНОГО КАСАНИЯ

   Пороги распознавания были зашиты числами под одну руку: свайп от 38
   пикселей, окно двойного касания 800 мс в окне и 650 снаружи. У незрячего
   игрока рука своя: у одного короткий взмах не листал, у другого второе
   касание съезжало и активация пропадала.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Пять ступеней чуткости, по возрастанию, «обычные» посередине.
   2. При умолчаниях все пороги в точности равны прежним числам игры.
   3. Спокойная рука получает широкие пороги, чуткая — узкие.
   4. Окно двойного касания — своя настройка и не зависит от чуткости.
   5. Окно принимает только разумные значения.
   6. Многопальцевое окно на сотню шире одинарного.
   7. Возврат к умолчанию возвращает все три настройки разом.
   8. Настройки живут в сохранении.
   9. Раздел настроек показывает все три и обе кнопки.
  10. Двойное касание по пункту активирует его при умолчании.
  11. Съехавшее второе касание по тому же пункту всё равно активирует.
  12. Съехавшее касание по ДРУГОМУ пункту ничего не активирует.
  12а. Одиночного касания одним пальцем нет: оно молчит и не двигает выбор.
  12б. Двойное касание по соседней кнопке подтверждает ВЫБРАННОЕ.
  12в. Выбрать пальцем можно ощупыванием: подержать, отпустить, подтвердить.
  13. С широким окном второе касание засчитывается позже прежнего предела.
  14. С узким окном опоздавшее второе касание не засчитывается.
  15. Окно отсчитывается от начала второго касания, а не от его конца.
  16. На «очень спокойных» касание со сдвигом в 50 пикселей — всё ещё касание.
  17. Что настроено — называется числами.
  18. Самопроверка держит строку gesttune; модуль, глава 91, README, docs.
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
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* Касание с заданным сдвигом: палец опускается, ведёт и отрывается. */
 const tapAt=async(x,y,dx=0,dy=0,ms=90)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  if(dx||dy){
   await page.waitForTimeout(Math.max(20,Math.round(ms/2)));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:0}]});}
  await page.waitForTimeout(Math.max(20,Math.round(ms/2)));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(90);};

 /* ── 1–3. Ступени ── */
 const ступени=await page.evaluate(()=>{
  const было=settings.gestSens;
  const меры=id=>{settings.gestSens=id;
   return {swipe:gestSwipePx(),move:gestMovePx(),multi:gestMultiPx(),
    multiMs:gestMultiMs(),swipeMs:gestSwipeMs(),tapMax:gestTapMaxMs(),
    listPx:gestListPx(),listMs:gestListMs(),hold:gestHoldMs(),
    fast:gestFastV(),slow:gestSlowV()};};
  const norm=меры("norm"),vcalm=меры("vcalm"),vhigh=меры("vhigh");
  settings.gestSens=было;
  return {ступеней:GEST_SENS.length,уник:new Set(GEST_SENS.map(x=>x.id)).size,
   плохие:GEST_SENS.filter(x=>!(x.n&&x.о&&x.о.length>30&&Number.isFinite(x.k)&&x.k>0)).map(x=>x.id),
   поРосту:GEST_SENS.every((x,i)=>i===0||x.k>GEST_SENS[i-1].k),
   середина:GEST_SENS[2].id==="norm"&&GEST_SENS[2].k===1,
   norm,vcalm,vhigh};});
 check('чувствительность идёт пятью ступенями, и средняя ровно посередине с множителем один',
  ступени.ступеней===5&&ступени.уник===5&&ступени.плохие.length===0
  &&ступени.поРосту&&ступени.середина,ступени);
 check('при умолчаниях все пороги в точности равны прежним числам игры',
  ступени.norm.swipe===38&&ступени.norm.move===16&&ступени.norm.multi===45
  &&ступени.norm.multiMs===1400&&ступени.norm.swipeMs===1200&&ступени.norm.tapMax===3000
  &&ступени.norm.listPx===90&&ступени.norm.listMs===700&&ступени.norm.hold===250
  &&ступени.norm.fast===0.55&&ступени.norm.slow===0.25,ступени.norm);
 check('спокойная рука получает широкие пороги, чуткая — узкие',
  ступени.vcalm.swipe>38&&ступени.vhigh.swipe<38&&ступени.vcalm.swipe>ступени.vhigh.swipe
  &&ступени.vcalm.move>16&&ступени.vhigh.move<16
  &&ступени.vcalm.hold>250&&ступени.vhigh.hold<250,
  {спокойные:ступени.vcalm,чуткие:ступени.vhigh});

 /* ── 4–7. Окно двойного касания ── */
 const окно=await page.evaluate(()=>{
  const б=settings.gestSens,в=settings.tapWindow;
  settings.tapWindow=800;
  settings.gestSens="vcalm";const приСпокойных=gestTapMs();
  settings.gestSens="vhigh";const приЧутких=gestTapMs();
  settings.gestSens="norm";
  const плохо=[gestTapWindowSet(50),gestTapWindowSet(99999),gestTapWindowSet("ох"),gestTapWindowSet(-1)];
  const послеПлохих=gestTapMs();
  const хорошо=gestTapWindowSet(1600);const после=gestTapMs();
  const пара=gestMultiTapMs();
  settings.gestSens="vcalm";settings.tapWindow=2200;settings.tapTick=0;
  const сброс=gestTuneReset();
  const итог={sens:settings.gestSens,win:settings.tapWindow,tick:settings.tapTick};
  settings.gestSens=б;settings.tapWindow=в;saveSettings();
  return {приСпокойных,приЧутких,плохо,послеПлохих,хорошо,после,пара,сброс,итог};});
 check('окно двойного касания — своя настройка и от чуткости не зависит',
  окно.приСпокойных===800&&окно.приЧутких===800,окно);
 check('окно принимает только разумные значения: слишком малое, слишком большое и не-число отвергаются',
  окно.плохо.every(x=>x===false)&&окно.послеПлохих===800&&окно.хорошо===true&&окно.после===1600,окно);
 check('для трёх и четырёх пальцев окно на сотню шире: вслепую их ставят дольше',
  окно.пара===окно.после+100,окно);
 check('возврат к умолчанию возвращает все три настройки разом',
  окно.сброс===true&&окно.итог.sens==="norm"&&окно.итог.win===800&&окно.итог.tick===1,окно.итог);

 /* ── 8. Сохранение ── */
 const вСохранении=await page.evaluate(()=>{
  const б=JSON.stringify(settings);
  settings.gestSens="calm";settings.tapWindow=1200;settings.tapTick=0;saveSettings();
  const строка=store.get("gm29set")||"";
  const j=JSON.parse(строка||"{}");
  Object.assign(settings,JSON.parse(б));saveSettings();
  return {sens:j.gestSens,win:j.tapWindow,tick:j.tapTick};});
 check('чуткость, окно и щелчок живут в сохранении настроек',
  вСохранении.sens==="calm"&&вСохранении.win===1200&&вСохранении.tick===0,вСохранении);

 /* ── 9. Раздел настроек ── */
 const раздел=await page.evaluate(()=>{
  CMD.settings();
  const m=document.getElementById("modal-settings");
  const h=[...m.querySelectorAll(".sec-head")].map(x=>x.dataset.secTitle);
  const r={разделов:h.length,есть:h.includes("Точность жестов"),
   чуткость:!!m.querySelector("#setGestSens"),
   ступеней:m.querySelector("#setGestSens")?m.querySelectorAll("#setGestSens option").length:0,
   окно:!!m.querySelector("#setTapWindow"),
   значений:m.querySelector("#setTapWindow")?m.querySelectorAll("#setTapWindow option").length:0,
   щелчок:!!m.querySelector("#setTapTick"),
   проверить:!!m.querySelector('[data-cmd="gesttune"]'),
   сброс:!!m.querySelector('[data-cmd="gesttunereset"]'),
   немые:[...m.querySelectorAll("#setGestSens,#setTapWindow")].filter(x=>!x.getAttribute("aria-label")).length};
  if(activeLayer())closeTopUI();
  return r;});
 check('раздел «Точность жестов» показывает пять ступеней, пять значений окна, щелчок и обе кнопки',
  раздел.есть&&раздел.разделов===12&&раздел.чуткость&&раздел.ступеней===5
  &&раздел.окно&&раздел.значений===5&&раздел.щелчок
  &&раздел.проверить&&раздел.сброс&&раздел.немые===0,раздел);

 /* ── 10–12. Точность активации ── */
 /* Слежку за активацией ставим РОВНО ОДИН раз: если подменять activateElement
    на каждом заходе, обёртки складываются и одна активация считается впятеро. */
 await page.evaluate(()=>{
  window.__acts=[];const ae=activateElement;
  window.activateElement=function(el){window.__acts.push(el&&el.dataset?el.dataset.cmd:null);return ae.apply(this,arguments);};});
 const место=async()=>await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  touchGate.lastUiTap=0;touchGate.lastUiEl=null;
  openActionMenu();
  const кн=[...document.querySelectorAll('#amList button')].filter(b=>b.dataset.cmd);
  const b=кн[1]||кн[0];
  b.scrollIntoView({block:"center"});
  const r=b.getBoundingClientRect();
  const c=кн[0]===b?кн[1]:кн[0];c.scrollIntoView({block:"nearest"});
  const rc=c.getBoundingClientRect();
  /* Пункт выбирается заранее — так, как его выбрал бы свайп: одиночного
     касания одним пальцем в игре нет, двойное подтверждает ВЫБРАННОЕ. */
  setCursor(b,false);
  window.__acts=[];
  return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),cmd:b.dataset.cmd,
   cx:Math.round(rc.left+rc.width/2),cy:Math.round(rc.top+rc.height/2),cmd2:c.dataset.cmd};});
 const снять=async()=>await page.evaluate(()=>{const a=window.__acts.slice();window.__acts=[];return a;});

 const m1=await место();
 await tapAt(m1.x,m1.y);await tapAt(m1.x,m1.y);
 const прямое=await снять();
 check('двойное касание по пункту активирует именно его',
  прямое.length===1&&прямое[0]===m1.cmd,{акты:прямое,ждали:m1.cmd});

 const m2=await место();
 await tapAt(m2.x,m2.y);
 /* Второе касание дрожащей руки: палец уехал на 44 пикселя (дальше порога в
    38) и провёл на экране почти секунду — это не росчерк и не перелистывание,
    а именно второе касание, только неровное. Быстрый росчерк в те же 44
    пикселя остаётся свайпом: на то и чуткость, чтобы двигать эту границу. */
 await tapAt(m2.x,m2.y,44,0,900);
 const съехало=await снять();
 check('второе касание, медленно съехавшее по тому же пункту, всё равно активирует его',
  съехало.length===1&&съехало[0]===m2.cmd,{акты:съехало,ждали:m2.cmd});

 /* Касание, которое началось на другом пункте и съехало, активировать не должно. */
 const m3=await место();
 await page.evaluate(()=>{touchGate.lastUiTap=0;touchGate.lastUiEl=null;});
 await tapAt(m3.cx,m3.cy,48,0,900);
 const чужое=await снять();
 check('съехавшее касание без взведённого двойного ничего не активирует',
  чужое.length===0,чужое);

 /* ── 12а–12в. Одиночного касания одним пальцем больше нет ── */
 const m7=await место();
 await page.evaluate(()=>{window.__said=[];const o=Speech.say.bind(Speech);
  if(!window.__spy){window.__spy=1;Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};}});
 await tapAt(m7.cx,m7.cy);      /* одно касание по СОСЕДНЕЙ кнопке */
 const одно=await page.evaluate(()=>({акты:window.__acts.slice(),
  курсор:uiCursor&&uiCursor.dataset?uiCursor.dataset.cmd:null,
  сказано:(window.__said||[]).length}));
 check('одно касание одним пальцем ничего не выполняет, молчит и не уводит выбор под палец',
  одно.акты.length===0&&одно.курсор===m7.cmd&&одно.сказано===0,
  {...одно,выбрано:m7.cmd,палецБыл:m7.cmd2});
 await tapAt(m7.cx,m7.cy);
 const мимо=await снять();
 check('двойное касание по соседней кнопке подтверждает выбранный пункт, а не ту, куда попал палец',
  мимо.length===1&&мимо[0]===m7.cmd,{акты:мимо,ждали:m7.cmd,палецБыл:m7.cmd2});

 /* Выбрать пальцем по-прежнему можно — но это отдельный жест: подержать и
    отпустить (ощупывание), а не стукнуть. */
 const m8=await место();
 await page.evaluate(()=>{window.__said=[];});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:m8.cx,y:m8.cy,id:0}]});
 await page.waitForTimeout(500);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(120);
 const ощупь=await page.evaluate(()=>({курсор:uiCursor&&uiCursor.dataset?uiCursor.dataset.cmd:null,
  сказано:(window.__said||[]).length,акты:window.__acts.slice()}));
 await tapAt(m8.cx,m8.cy);await tapAt(m8.cx,m8.cy);
 const послеОщупи=await снять();
 check('выбрать пальцем можно ощупыванием: палец полежал, пункт назвался и стал текущим, а двойное касание его подтвердило',
  ощупь.курсор===m8.cmd2&&ощупь.сказано>0&&ощупь.акты.length===0
  &&послеОщупи.length===1&&послеОщупи[0]===m8.cmd2,
  {ощупь,подтверждено:послеОщупи,ждали:m8.cmd2});

 /* ── 13–14. Окно решает, засчитано ли второе касание ── */
 const m4=await место();
 await page.evaluate(()=>{gestTapWindowSet(2200);});
 await tapAt(m4.x,m4.y);
 await page.waitForTimeout(1100);       /* дольше прежних 800 мс */
 await tapAt(m4.x,m4.y);
 const широкое=await снять();
 check('с широким окном второе касание засчитывается позже прежнего предела',
  широкое.length===1&&широкое[0]===m4.cmd,{акты:широкое,ждали:m4.cmd});

 /* Окно отсчитывается от НАЧАЛА второго касания: палец, который коснулся
    вовремя, но задержался на пункте, своё окно не съедает. */
 const m6=await место();
 await page.evaluate(()=>{gestTapWindowSet(800);});
 await tapAt(m6.x,m6.y);
 await page.waitForTimeout(400);
 await tapAt(m6.x,m6.y,0,0,900);   /* коснулся на 400-й мс, а отпустил на 1300-й */
 const долгое=await снять();
 check('окно отсчитывается от начала второго касания, а не от его конца: задержавшийся палец своё окно не съедает',
  долгое.length===1&&долгое[0]===m6.cmd,{акты:долгое,ждали:m6.cmd});

 const m5=await место();
 await page.evaluate(()=>{gestTapWindowSet(500);});
 await tapAt(m5.x,m5.y);
 await page.waitForTimeout(700);        /* дольше выбранных 500 мс */
 await tapAt(m5.x,m5.y);
 const узкое=await снять();
 check('с узким окном опоздавшее второе касание не засчитывается',
  узкое.length===0,узкое);
 await page.evaluate(()=>{gestTuneReset();while(activeLayer())closeTopUI();});

 /* ── 15. Чуткость двигает границу касания и свайпа ── */
 const граница=await page.evaluate(()=>{
  const б=settings.gestSens;
  const проба=(id,d)=>{settings.gestSens=id;return d<gestSwipePx();};
  const r={приОбычных:проба("norm",50),приСпокойных:проба("vcalm",50),
   приЧутких:проба("vhigh",30),приОбычных30:проба("norm",30)};
  settings.gestSens=б;return r;});
 check('на «очень спокойных» сдвиг в пятьдесят пикселей — всё ещё касание, а на «очень чутких» тридцать — уже свайп',
  граница.приОбычных===false&&граница.приСпокойных===true
  &&граница.приЧутких===false&&граница.приОбычных30===true,граница);

 /* ── 16. Что настроено — числами ── */
 const вслух=await page.evaluate(()=>{
  gestTuneReset();
  const т=gestTuneText();
  settings.gestSens="vcalm";gestTapWindowSet(1600);
  const т2=gestTuneText();
  gestTuneReset();
  return {обычные:т,спокойные:т2};});
 check('что сейчас настроено — называется числами, и числа меняются вместе с настройкой',
  /38/.test(вслух.обычные)&&/0,8/.test(вслух.обычные)&&/средняя/.test(вслух.обычные)&&/Чувствительность/.test(вслух.обычные)
  &&/68/.test(вслух.спокойные)&&/1,6/.test(вслух.спокойные)
  &&!/\./.test((/Окно двойного касания: [^,]*,\d/.exec(вслух.обычные)||[""])[0]),
  {обычные:вслух.обычные.slice(0,200),спокойные:вслух.спокойные.slice(-120)});

 /* ── 17. Свод, модуль, глава, документы ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="gesttune");
  const m=Modules.get("GESTTUNE");
  return {есть:!!r,ok:r&&r.ok,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.levels.length===5&&typeof m.set==="function"&&typeof m.window==="function"
    &&typeof m.reset==="function"&&m.swipePx()===38&&m.tapMs()===800,
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 91\. Точность жестов/.test(g.title)&&g.body.length>=7),
   вЧасти:(()=>{try{return guidePartOf(GUIDE_BY_NUM[91]);}catch(_){return "";}})()};});
 check('самопроверка держит строку gesttune, модуль GESTTUNE отвечает, глава 91 в первой части',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.вЧасти==="Часть I. Первые шаги"
  &&свод.текст.length>80,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('README и документы описывают точность жестов',
  /Точность жестов настраивается/i.test(readme)
  &&/## 57\. Точность жестов/.test(мир)&&/gestK/.test(мир)
  &&/gestSwipePx/.test(вз)&&/`gesttune`/.test(вз),
  {readme:/Точность жестов настраивается/i.test(readme),
   мир:/## 57\. Точность жестов/.test(мир),вз:/gestSwipePx/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
