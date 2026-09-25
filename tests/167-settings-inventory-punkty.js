/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 167: НАСТРОЙКИ И ИНВЕНТАРЬ — ПУНКТАМИ

   Настройки шли одной лентой в семь десятков пунктов, инвентарь —
   полусотней строк вперемешку с заголовками. Незрячий игрок свайпал через
   звук и жесты, чтобы добраться до субтитров, и через оружие и броню,
   чтобы добраться до зелий. Теперь оба окна открываются списком пунктов,
   как настройки телефона: пункт открывается двойным касанием, «Назад» и
   свайп двумя пальцами вниз возвращают к списку. Всё, что игрок подбирает
   и получает в награду, ложится в раздел инвентаря по своему роду.

   Касания — настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Настройки открываются списком из семи пунктов по порядку; ни одной
      настройки на первом уровне не видно; пункт называет, что в нём и
      сколько настроек.
   2. Каждая настройка лежит ровно в одном пункте, и пункт — по её смыслу;
      все двенадцать разделов на месте, каждый в одном пункте.
   3. Свайп до «Синтезатора речи» и двойное касание: в окне только его
      настройки, выбор на первой, игра назвала пункт.
   4. Свайп двумя пальцами вниз возвращает к списку, выбор — на том пункте,
      из которого вышли, окно открыто; второй такой свайп закрывает окно.
   5. Кнопка «Назад» в шапке во втором уровне ведёт к списку и так себя
      называет; в списке — закрывает окно. Эскейп ведёт себя так же.
   6. В пункте из трёх разделов перескок ходит только по его разделам и по
      кругу, оглавление называет три; в списке оглавление называет семь
      пунктов, а перескок объясняет, что здесь пункты.
   7. В пункте из одного раздела нет ни лишнего заголовка, ни строки
      перескока.
   8. Окно, закрытое во втором уровне, открывается снова списком — и через
      команду, и напрямую; settings:<пункт> открывает сразу пункт.
   9. Настройка, переключённая внутри пункта двойным касанием, сохраняется.
  10. Инвентарь открывается списком всех шестнадцати разделов по
      порядку: пустые — со словом «пусто», полные — с числом.
  11. Двойное касание по «Ресурсам» открывает только ресурсы; свайп двумя
      пальцами вниз возвращает, и выбор на «Ресурсах».
  12. В списке разделов свайп вверх листает, а не открывает действия; в
      разделе свайп вверх на выбранной вещи открывает действия.
  13. Выбор вещи принадлежит открытому разделу: смена раздела его снимает,
      а действия открываются для той вещи, на которой стоит фокус.
  14. Подобранное и полученное в награду ложится в свой раздел: добыча,
      ремесло начала, веха глубины, трофей владыки, награда дела, травы,
      органы, рыба, зелье, артефакт, вложенная чара, сокровище казны.
  15. Кириллическая граница слова: «Охотничий нож» — оружие, «Яд» —
      зелье, «Ясеневый лук Ветви» — оружие, «Чистый свиток» — свиток.
  16. Вещь Дома получает род по имени: «Кольцо мытаря Брода» — кольцо и
      носится как аксессуар, а не как меч; из списка оружия оно уходит.
  17. Сокровище стоит своей меры, торговцы редкого его берут, в лавке у
      него свой раздел.
  18. Самопроверка держит строку punkty; модуль, глава 93, README, docs.
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
 const hold=async(x,y,ms=650)=>{await touch('touchStart',x,y);await page.waitForTimeout(ms);await touch('touchEnd',x,y);await page.waitForTimeout(120);};
 const tap=async(x,y)=>{await touch('touchStart',x,y);await page.waitForTimeout(50);await touch('touchEnd',x,y);};
 const dbl=async(x,y)=>{await tap(x,y);await page.waitForTimeout(110);await tap(x,y);await page.waitForTimeout(300);};
 /* Свайп одним пальцем: широкий и быстрый — по правилам игры он листает. */
 const свайп=async(dx,dy)=>{const x=195,y=420;
  await touch('touchStart',x,y);
  for(let i=1;i<=5;i++){await page.waitForTimeout(18);await touch('touchMove',x+dx*i/5,y+dy*i/5);}
  await page.waitForTimeout(18);await touch('touchEnd',x+dx,y+dy);await page.waitForTimeout(220);};
 /* Свайп несколькими пальцами. */
 const пальцами=async(n,dx,dy)=>{
  const pts=[];for(let i=0;i<n;i++)pts.push({x:110+i*50,y:430});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});
  for(let k=1;k<=6;k++){await page.waitForTimeout(18);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/6,y:p.y+dy*k/6,id:i}))});}
  await page.waitForTimeout(18);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);};
 const закрытьВсё=()=>page.evaluate(()=>{for(let i=0;i<30&&activeLayer();i++)closeTopUI();});
 /* Пустое место окна: заголовок h2, в нём нет пунктов. */
 const пусто=id=>page.evaluate(id=>{
  const h=document.querySelector('#'+id+' header h2');const r=h.getBoundingClientRect();
  return {x:r.left+8,y:r.top+r.height/2};},id);
 /* Листать свайпом вправо, пока выбор не встанет на пункт с этой командой. */
 const долистать=async(cmd,max=30)=>{
  for(let i=0;i<max;i++){
   const c=await page.evaluate(()=>uiCursor&&uiCursor.dataset&&uiCursor.dataset.cmd);
   if(c===cmd)return true;
   await свайп(200,0);}
  return false;};

 /* ── 1. список из семи пунктов ── */
 await закрытьВсё();
 const список=await page.evaluate(()=>{
  CMD.settings();
  const m=document.getElementById("modal-settings");
  const видно=cursorItems(m);
  return {пункты:видно.filter(x=>x.dataset.punkt).map(x=>x.dataset.punkt),
   подписи:видно.filter(x=>x.dataset.punkt).map(x=>x.dataset.speak),
   настроекВидно:видно.filter(x=>/^set[A-Z]/.test(x.id||"")&&x.tagName!=="DIV").map(x=>x.id),
   заголовковВидно:видно.filter(x=>x.classList.contains(SEC_CLASS)).length,
   прочее:видно.filter(x=>!x.dataset.punkt).map(x=>x.dataset.cmd||x.id)};});
 check('1. настройки открываются списком из семи пунктов по порядку, настроек на первом уровне не видно, пункт называет только своё имя',
  список.пункты.join(",")==="sound,tts,speech,ui,gest,diff,save"
  &&список.настроекВидно.length===0&&список.заголовковВидно===0
  &&список.прочее.join(",")==="close,setsave,setsaved"
  /* С 3.6 пункт называет только своё имя — одно-два слова. */
  &&список.подписи.join(",")==="Звуки,Синтезатор,Речь,Интерфейс,Жесты,Сложность,Сохранения",список);

 /* ── 2. каждая настройка — ровно в одном пункте, и по смыслу ── */
 const раскладка=await page.evaluate(()=>{
  const m=document.getElementById("modal-settings");
  const где=id=>{const el=document.getElementById(id);const g=el&&el.closest(".set-group");return g?g.dataset.setGroup:null;};
  const поля=[...m.querySelectorAll("input[id^=set],select[id^=set]")];
  const вне=поля.filter(x=>!x.closest(".set-group")).map(x=>x.id);
  const головы=[...m.querySelectorAll("."+SEC_CLASS)].map(h=>({t:h.dataset.secTitle,g:h.closest(".set-group")&&h.closest(".set-group").dataset.setGroup}));
  const ожидание={setSpeech:"sound",setMasterVol:"sound",setDuck:"sound",setHrtf:"sound",setMirth:"sound",
   setTtsEngine:"tts",setVoice:"tts",setVoiceLocal:"tts",setRate:"tts",setPitch:"tts",setElevenKey:"tts",setElevenVoice:"tts",
   setVerbosity:"speech",setSrMode:"speech",setAutoSpeech:"speech",setSayHp:"speech",setStopGesture:"speech",
   setExplore:"ui",setHintMode:"ui",setFastTap:"ui",setHaptics:"ui",setSubMode:"ui",
   setGestSens:"gest",setTapWindow:"gest",setTapTick:"gest",gestRow:"gest",diffRow:"diff"};
  const мимо=Object.entries(ожидание).filter(([id,g])=>где(id)!==g).map(([id,g])=>({id,ждали:g,лежит:где(id)}));
  const сохр=(m.querySelector('[data-cmd="am:save"]').closest(".set-group")||{}).dataset;
  return {полей:поля.length,вне,головы,мимо,сохр:сохр&&сохр.setGroup,
   уник:new Set(поля.map(x=>x.id)).size};});
 check('2. каждая настройка лежит ровно в одном пункте и по смыслу: голос — в синтезаторе, громкость — в звуках, чуткость — в жестах, субтитры — в интерфейсе; все двенадцать разделов на месте',
  раскладка.полей>=30&&раскладка.уник===раскладка.полей&&раскладка.вне.length===0&&раскладка.мимо.length===0
  &&раскладка.головы.length===12&&new Set(раскладка.головы.map(h=>h.t)).size===12&&раскладка.головы.every(h=>h.g)
  &&раскладка.сохр==="save",раскладка);

 /* ── 3. свайп до «Синтезатора речи» и двойное касание ── */
 await закрытьВсё();
 await page.evaluate(()=>{CMD.settings();resetCursor();});
 await page.waitForTimeout(400);
 const дошли=await долистать("setgroup:tts");
 await page.evaluate(()=>{СКАЗАНО.length=0;});
 {const п=await пусто("modal-settings");await dbl(п.x,п.y);}
 const открыт=await page.evaluate(()=>{
  const m=document.getElementById("modal-settings");
  const видно=cursorItems(m);
  const поля=видно.filter(x=>/^set[A-Z]/.test(x.id||"")&&["INPUT","SELECT"].includes(x.tagName));
  return {пункт:SETG.open,поля:поля.map(x=>x.id),
   чужие:поля.filter(x=>x.closest(".set-group").dataset.setGroup!=="tts").map(x=>x.id),
   курсор:uiCursor&&uiCursor.id,сказано:СКАЗАНО.slice()};});
 check('3. свайп до «Синтезатора речи» и двойное касание: в окне только его настройки, выбор на первой, пункт назван',
  дошли&&открыт.пункт==="tts"&&открыт.чужие.length===0&&открыт.поля.includes("setRate")&&открыт.поля.includes("setVoice")
  &&открыт.курсор==="setTtsEngine"&&открыт.сказано.some(t=>/^Синтезатор\. /.test(t)),открыт);

 /* ── 4. свайп двумя пальцами вниз — к списку, второй — закрыть ── */
 await page.evaluate(()=>{СКАЗАНО.length=0;});
 await пальцами(2,0,170);
 const кСписку=await page.evaluate(()=>({пункт:SETG.open,открыто:!document.getElementById("modal-settings").hidden,
  список:!document.getElementById("setMenu").hidden,курсор:uiCursor&&uiCursor.dataset.punkt,сказано:СКАЗАНО.slice()}));
 await пальцами(2,0,170);
 const закрыто=await page.evaluate(()=>document.getElementById("modal-settings").hidden);
 check('4. свайп двумя пальцами вниз возвращает к списку на тот же пункт, окно открыто; второй свайп закрывает окно',
  кСписку.пункт===null&&кСписку.открыто&&кСписку.список&&кСписку.курсор==="tts"
  &&кСписку.сказано.some(t=>/^Настройки\. Синтезатор$/.test(t))&&закрыто,{кСписку,закрыто});

 /* ── 5. «Назад» в шапке ── */
 await закрытьВсё();
 await page.evaluate(()=>{CMD.settings("sound");resetCursor();});
 await page.waitForTimeout(350);
 /* Шапка уезжает вверх вместе со списком: сперва показать её. */
 const гдеШапка=()=>page.evaluate(()=>{const b=document.querySelector('#modal-settings header [data-cmd="close"]');
  b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,говорит:b.dataset.speak||""};});
 const шапка=await гдеШапка();
 await hold(шапка.x,шапка.y);
 {const п=await пусто("modal-settings");await dbl(п.x,п.y);}
 const послеНазад=await page.evaluate(()=>({пункт:SETG.open,открыто:!document.getElementById("modal-settings").hidden,
  курсор:uiCursor&&uiCursor.dataset.punkt,говорит:document.querySelector('#modal-settings header [data-cmd="close"]').dataset.speak||""}));
 {const ш=await гдеШапка();await hold(ш.x,ш.y);}
 {const п=await пусто("modal-settings");await dbl(п.x,п.y);}
 const послеВторого=await page.evaluate(()=>document.getElementById("modal-settings").hidden);
 check('5. «Назад» в шапке во втором уровне ведёт к списку и так себя называет; в списке — закрывает окно',
  /ко всем пунктам настроек/i.test(шапка.говорит)&&послеНазад.пункт===null&&послеНазад.открыто
  &&послеНазад.курсор==="sound"&&послеНазад.говорит===""&&послеВторого,{шапка,послеНазад,послеВторого});

 /* ── 5а. Эскейп: из пункта — к списку, из списка — закрыть ── */
 await закрытьВсё();
 const эскейп=await page.evaluate(()=>{
  const жми=()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
  CMD.settings("ui");жми();
  const r={настройки:{пункт:SETG.open,открыто:!document.getElementById("modal-settings").hidden}};
  жми();r.настройки.закрыто=document.getElementById("modal-settings").hidden;
  CMD.inv();CMD.invcat("res");жми();
  r.инвентарь={раздел:INV.cat,открыто:!document.getElementById("modal-inventory").hidden};
  жми();r.инвентарь.закрыто=document.getElementById("modal-inventory").hidden;
  return r;});
 check('5а. Эскейп из пункта настроек и из раздела инвентаря сперва возвращает к списку, второй — закрывает окно',
  эскейп.настройки.пункт===null&&эскейп.настройки.открыто&&эскейп.настройки.закрыто
  &&эскейп.инвентарь.раздел===null&&эскейп.инвентарь.открыто&&эскейп.инвентарь.закрыто,эскейп);

 /* ── 6. перескок внутри пункта и оглавление ── */
 await закрытьВсё();
 const перескок=await page.evaluate(()=>{
  CMD.settings("sound");
  const m=document.getElementById("modal-settings");
  const h=secHeads(m).map(x=>x.dataset.secTitle);
  const путь=[];setCursor(secHeads(m)[0],false);
  for(let i=0;i<4;i++){secNav("next");путь.push(uiCursor.dataset.secTitle);}
  const огл=secIndexText(m);
  closeTopUI();
  const оглСписка=secIndexText(m);
  СКАЗАНО.length=0;secNav("next");
  return {h,путь,огл,оглСписка,перескокВСписке:СКАЗАНО.slice(-1)[0]||""};});
 check('6. в «Звуках» перескок ходит по трём его разделам по кругу, оглавление называет три; в списке оглавление называет семь пунктов',
  перескок.h.join("|")==="Что звучит|Громкость|Объёмный звук и живой мир"
  &&перескок.путь.join("|")==="Громкость|Объёмный звук и живой мир|Что звучит|Громкость"
  &&/Разделов 3/.test(перескок.огл)&&/^Пунктов 7: 1\. Звуки/.test(перескок.оглСписка)
  &&/Сохранения/.test(перескок.оглСписка)&&/пункты, а не разделы/.test(перескок.перескокВСписке),перескок);

 /* ── 7. пункт из одного раздела ── */
 await закрытьВсё();
 const один=await page.evaluate(()=>{
  CMD.settings("tts");
  const m=document.getElementById("modal-settings");
  const r={головВидно:secHeads(m).length,строка:!document.getElementById("setSecRow").hidden,
   подсказка:document.getElementById("setOneHint").textContent};
  CMD.setgroup("diff");r.сложность={головВидно:secHeads(m).length,строка:!document.getElementById("setSecRow").hidden,
   кнопок:cursorItems(m).filter(x=>/^setdiff:/.test(x.dataset.cmd||"")).length};
  CMD.setgroup("ui");r.интерфейс={головВидно:secHeads(m).length,строка:!document.getElementById("setSecRow").hidden};
  return r;});
 check('7. в пункте из одного раздела нет ни лишнего заголовка, ни строки перескока; в пункте из двух они есть',
  один.головВидно===0&&!один.строка&&/Синтезатор/.test(один.подсказка)
  &&один.сложность.головВидно===0&&!один.сложность.строка&&один.сложность.кнопок===3
  &&один.интерфейс.головВидно===2&&один.интерфейс.строка,один);

 /* ── 8. заново — со списка ── */
 await закрытьВсё();
 const заново=await page.evaluate(()=>{
  const m=document.getElementById("modal-settings");
  CMD.settings("gest");const жестов=cursorItems(m).filter(x=>x.matches("select[data-gest]")).length;
  closeModal(m);                       /* закрыто прямо со второго уровня */
  CMD.settings();const r1={пункт:SETG.open,список:!document.getElementById("setMenu").hidden};
  CMD.setgroup("speech");closeModal(m);
  openModal("modal-settings");const r2={пункт:SETG.open,список:!document.getElementById("setMenu").hidden,
   настроекВидно:cursorItems(m).filter(x=>/^set[A-Z]/.test(x.id||"")&&["INPUT","SELECT"].includes(x.tagName)).length};
  closeModal(m);
  return {жестов,r1,r2};});
 check('8. окно, закрытое во втором уровне, открывается снова списком; settings:gest открывает сразу «Жесты» со всеми тридцатью тремя фигурами',
  заново.жестов===33&&заново.r1.пункт===null&&заново.r1.список&&заново.r2.пункт===null&&заново.r2.список
  &&заново.r2.настроекВидно===0,заново);

 /* ── 9. переключённое внутри пункта сохраняется ── */
 await закрытьВсё();
 await page.evaluate(()=>{CMD.settings("speech");resetCursor();});
 await page.waitForTimeout(350);
 const флажок=await page.evaluate(()=>{
  const s=document.querySelector('#setSayHp').closest('label').querySelector('span b');
  s.scrollIntoView({block:"center"});const r=s.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,было:!!settings.sayHp};});
 await hold(флажок.x,флажок.y);
 {const п=await пусто("modal-settings");await dbl(п.x,п.y);}
 const сохранено=await page.evaluate(()=>{let v=null;try{v=JSON.parse(store.get("gm29set")||"{}").sayHp;}catch(_){}
  return {стало:!!settings.sayHp,вХранилище:v,курсор:uiCursor&&uiCursor.id,пункт:SETG.open};});
 await page.evaluate(было=>{settings.sayHp=было?1:0;const c=document.getElementById("setSayHp");c.checked=было;saveSettings();},флажок.было);
 check('9. переключённое внутри пункта двойным касанием меняется и сохраняется, пункт остаётся открытым',
  сохранено.стало!==флажок.было&&!!сохранено.вХранилище===сохранено.стало&&сохранено.курсор==="setSayHp"
  &&сохранено.пункт==="speech",{было:флажок.было,...сохранено});

 /* ── 10. инвентарь: все шестнадцать разделов ── */
 await закрытьВсё();
 const разделы=await page.evaluate(()=>{
  G.inv={"руда":4,"дерево":2,"рановник":2,"салака":1};G.items=["Факел","Венец штейгера"];G.potions=[];G.artifacts=[];G.charged=[];
  CMD.inv();
  const m=document.getElementById("modal-inventory");
  const п=cursorItems(m).filter(x=>x.dataset.punkt);
  return {ids:п.map(x=>x.dataset.punkt),порядок:INV_SECTIONS.map(c=>c.id),
   пустых:п.filter(x=>/, пусто$/.test(x.dataset.speak)).length,
   ресурсы:(п.find(x=>x.dataset.punkt==="res")||{dataset:{}}).dataset.speak,
   сокровища:(п.find(x=>x.dataset.punkt==="artifact")||{dataset:{}}).dataset.speak,
   надето:(m.querySelector("#invWorn")||{dataset:{}}).dataset.speak,
   вещейВидно:cursorItems(m).filter(x=>/^invpick:/.test(x.dataset.cmd||"")).length};});
 check('10. инвентарь открывается списком всех шестнадцати разделов по порядку: пустые — «пусто», полные — одним именем, вещей на первом уровне не видно, последняя строка — что надето',
  разделы.ids.length===16&&разделы.ids.join(",")===разделы.порядок.join(",")&&разделы.пустых===16-5
  &&разделы.ресурсы==="Ресурсы"&&разделы.сокровища==="Артефакты"
  &&/^Надето \d+ из 13 мест: в руке — /.test(разделы.надето||"")&&разделы.вещейВидно===0,разделы);

 /* ── 11. «Ресурсы» двойным касанием и назад ── */
 await page.evaluate(()=>{resetCursor();});
 const дошлиДоРесурсов=await долистать("invcat:res");
 {const п=await пусто("modal-inventory");await dbl(п.x,п.y);}
 const ресурсы=await page.evaluate(()=>{const m=document.getElementById("modal-inventory");
  const вещи=cursorItems(m).filter(x=>/^invpick:/.test(x.dataset.cmd||""));
  return {раздел:INV.cat,вещи:вещи.map(x=>decodeURIComponent(x.dataset.cmd.split(":")[2])),
   курсор:uiCursor&&uiCursor.dataset.cmd,назад:cursorItems(m).filter(x=>x.dataset.cmd==="invcats").length};});
 await пальцами(2,0,170);
 const изРесурсов=await page.evaluate(()=>({раздел:INV.cat,курсор:uiCursor&&uiCursor.dataset.punkt,
  открыто:!document.getElementById("modal-inventory").hidden}));
 check('11. двойное касание по «Ресурсам» открывает только ресурсы; свайп двумя пальцами вниз возвращает, выбор на «Ресурсах»',
  дошлиДоРесурсов&&ресурсы.раздел==="res"&&ресурсы.вещи.sort().join(",")==="дерево,рановник,руда"
  &&/^invpick:res:/.test(ресурсы.курсор||"")&&ресурсы.назад===2
  &&изРесурсов.раздел===null&&изРесурсов.курсор==="res"&&изРесурсов.открыто,{ресурсы,изРесурсов});

 /* ── 12. свайп вверх: в списке листает, в разделе — действия ── */
 const доСвайпа=await page.evaluate(()=>uiCursor&&uiCursor.dataset.punkt);
 await свайп(0,170);
 const вСписке=await page.evaluate(()=>({курсор:uiCursor&&uiCursor.dataset.punkt,
  действия:!document.getElementById("modal-invact").hidden}));
 await page.evaluate(()=>{CMD.invcat("res");});
 await page.waitForTimeout(200);
 const руда=await page.evaluate(()=>{const b=document.querySelector('#invSections [data-cmd="invpick:res:%D1%80%D1%83%D0%B4%D0%B0"]');
  b.scrollIntoView({block:"center"});setCursor(b,false);const r=b.getBoundingClientRect();return {x:r.left+20,y:r.top+r.height/2};});
 await dbl(руда.x,руда.y);
 await свайп(0,-170);
 const вРазделе=await page.evaluate(()=>({выбрано:INV.sel&&INV.sel.key,действия:!document.getElementById("modal-invact").hidden,
  список:[...document.querySelectorAll('#invActBody button')].map(b=>(b.dataset.cmd||"").split(":")[1])}));
 check('12. в списке разделов свайп листает, а не открывает действия; в разделе свайп на выбранной вещи открывает действия',
  доСвайпа==="res"&&вСписке.курсор&&вСписке.курсор!=="res"&&!вСписке.действия
  &&вРазделе.выбрано==="руда"&&вРазделе.действия&&вРазделе.список.includes("look")&&вРазделе.список.includes("drop"),{доСвайпа,вСписке,вРазделе});

 /* ── 13. выбор принадлежит разделу ── */
 const выбор=await page.evaluate(()=>{
  closeTopUI();                 /* закрыть действия */
  const был=INV.sel&&INV.sel.key;
  CMD.invcats();const послеНазад=INV.sel;
  CMD.invcat("res");invPick("res","руда");const снова=INV.sel&&INV.sel.key;
  CMD.invcats();CMD.invcat("tool");const вДругом=INV.sel;
  /* В другом разделе фокус встал на первую вещь — действия открываются для
     неё, а не для руды из прежнего раздела. */
  СКАЗАНО.length=0;invActions();const ответ=СКАЗАНО.slice(-1)[0]||"";
  const наФакеле=INV.sel&&(invRow(INV.sel.kind,INV.sel.key)||{}).name;
  closeTopUI();
  /* Фокус на «назад», вещь не выбрана — действия не открываются. */
  INV.sel=null;setCursor(document.querySelector('#invSections [data-cmd="invcats"]'),false);
  СКАЗАНО.length=0;invActions();const безВещи=СКАЗАНО.slice(-1)[0]||"";
  const открыто=!document.getElementById("modal-invact").hidden;
  return {был,послеНазад,снова,вДругом,ответ,наФакеле,безВещи,открыто};});
 check('13. выбор вещи принадлежит открытому разделу: вернулись к списку или открыли другой раздел — прежний выбор снят; действия — для вещи под фокусом, а без неё не открываются',
  выбор.был==="руда"&&выбор.послеНазад===null&&выбор.снова==="руда"&&выбор.вДругом===null
  &&выбор.наФакеле==="Факел"&&/^Факел:/.test(выбор.ответ)&&/Сначала выберите вещь/.test(выбор.безВещи)&&!выбор.открыто,выбор);
 await закрытьВсё();

 /* ── 14. подобранное и полученное в награду — в свой раздел ── */
 const добыча=await page.evaluate(()=>{
  G.inv={};G.items=[];G.gear=G.gear.filter(g=>g&&g.id===(G.equip.weapon&&G.equip.weapon.id));G.potions=[];G.artifacts=[];G.charged=[];G.comps={};
  G.startCraft=null;G.level=1;G.quests=[];G.day=1;
  const r={};
  /* ремесло начала — настоящим выбором */
  const охотник=START_CRAFTS.find(c=>(c.вещи||[]).includes("Охотничий нож"));
  r.ремесло=startCraftPick(охотник.id);
  /* добыча событий: снаряжение по роду */
  const куски=[];for(let i=0;i<40;i++){const it=evGear(8);куски.push(it);}
  /* веха глубины, сокровище казны, награда дела, трофей владыки */
  deepTake(DEEP_EVENTS[1].вещь);G.items.push(VAULT_TREASURES[1].n);G.items.push("Клановая гривна");
  G.inv["сердце пепла"]=1;
  /* сырьё, трава, орган твари, рыба */
  evGive("руда",2);evGive("орган",1);G.inv["рановник"]=2;G.inv["салака"]=3;G.inv["целебник"]=1;
  G.potions.push({id:"heal",q:1,стаб:0.9,день:G.day,срок:10});
  const a=ART.make({дом:"run",ранг:2,кач:3,seed:7,имя:"Проверочный оберег",откуда:"из проверки"});ART.grant({готовая:a});
  G.charged.push({вид:"wand",грим:5,заряд:5,макс:5},{вид:"scroll",грим:9,заряд:1,макс:1});
  const rows=invAll();const cat=n=>(rows.find(x=>x.name===n)||{}).cat;
  const ждём={weapon:["Меч","Кинжал","Посох"],shield:["Щит"],armor:["Кольчуга"],helm:["Шлем"],gloves:["Перчатки"],boots:["Сапоги"],acc:["Плащ","Кольцо","Амулет","Браслет","Серьги"]};
  /* Две добычи с одним сидом — одна и та же вещь, и котомка держит её
     однажды: раздел считаем по самой вещи, а не ищем её строку. */
  const родМимо=куски.map(it=>({t:it.type,c:invCategoryOf({kind:"gear",key:"0",name:it.name,it})})).filter(x=>!(ждём[x.c]||[]).includes(x.t));
  r.родов=new Set(куски.map(it=>it.type)).size;r.родМимо=родМимо;
  r.раздел={нож:cat("Охотничий нож"),клык:cat(DEEP_EVENTS[1].вещь),венец:cat(VAULT_TREASURES[1].n),гривна:cat("Клановая гривна"),
   сердце:cat("сердце пепла"),руда:cat("руда"),орган:cat("орган"),рановник:cat("рановник"),салака:cat("салака"),целебник:cat("целебник"),
   зелье:(rows.find(x=>x.kind==="potion")||{}).cat,артефакт:(rows.find(x=>x.kind==="art")||{}).cat,
   жезл:(rows.find(x=>x.kind==="charged"&&x.it.вид==="wand")||{}).cat,свиток:(rows.find(x=>x.kind==="charged"&&x.it.вид==="scroll")||{}).cat,
   шкура:cat("шкура")};
  /* в окне: счёт раздела сходится с тем, что легло */
  CMD.inv();const m=document.getElementById("modal-inventory");
  const речь=id=>(m.querySelector(`[data-punkt="${id}"]`)||{dataset:{}}).dataset.speak||"";
  r.окно={артефакты:речь("artifact"),ждёмАрт:invAll().filter(x=>x.раздел==="artifact").length,ресурсы:речь("res"),
   ждёмРес:invAll().filter(x=>x.раздел==="res").length,
   разделы:{салака:(rows.find(x=>x.name==="салака")||{}).раздел,гривна:(rows.find(x=>x.name==="Клановая гривна")||{}).раздел,
    жезл:(rows.find(x=>x.kind==="charged"&&x.it.вид==="wand")||{}).раздел,свиток:(rows.find(x=>x.kind==="charged"&&x.it.вид==="scroll")||{}).раздел,
    сердце:(rows.find(x=>x.name==="сердце пепла")||{}).раздел,орган:(rows.find(x=>x.name==="орган")||{}).раздел}};
  closeTopUI();
  /* действия у вложенной чары — свои */
  const жезл=rows.find(x=>x.kind==="charged"&&x.it.вид==="wand");
  const A=invActionsAll(жезл);r.действияЖезла=A.ok.map(x=>x.id).concat(A.blocked.map(x=>x.id));
  r.карточкаЖезла=invBrief("charged",жезл.key);
  return r;});
 check('14. подобранное и полученное в награду ложится в свой раздел: снаряжение по роду, ремесло начала, веха глубины, сокровище, награда дела, трофей владыки, сырьё, травы, органы, рыба, зелье, артефакт, вложенная чара',
  добыча.ремесло===true&&добыча.родов>=5&&добыча.родМимо.length===0
  &&добыча.раздел.нож==="weapon"&&добыча.раздел.клык==="treasure"&&добыча.раздел.венец==="treasure"
  &&добыча.раздел.гривна==="acc"&&добыча.раздел.сердце==="treasure"&&добыча.раздел.руда==="res"
  &&добыча.раздел.орган==="ingredient"&&добыча.раздел.рановник==="ingredient"&&добыча.раздел.салака==="food"
  &&добыча.раздел.целебник==="ingredient"&&добыча.раздел.зелье==="potion"&&добыча.раздел.артефакт==="artifact"
  &&добыча.раздел.жезл==="magic"&&добыча.раздел.свиток==="scroll"&&добыча.раздел.шкура==="res"
  &&добыча.окно.ждёмАрт>=5&&добыча.окно.артефакты==="Артефакты"
  &&добыча.окно.ждёмРес>=1&&добыча.окно.ресурсы==="Ресурсы"
  &&добыча.окно.разделы.салака==="consumable"&&добыча.окно.разделы.гривна==="amulet"&&добыча.окно.разделы.жезл==="artifact"
  &&добыча.окно.разделы.свиток==="consumable"&&добыча.окно.разделы.сердце==="artifact"&&добыча.окно.разделы.орган==="res"
  &&добыча.действияЖезла.includes("chargeuse")&&добыча.действияЖезла.includes("chargerefill")
  &&!добыча.действияЖезла.includes("read")&&!добыча.действияЖезла.includes("sell")
  &&/Зарядов 5 из 5/.test(добыча.карточкаЖезла),добыча);

 /* ── 15. кириллическая граница слова ── */
 const граница=await page.evaluate(()=>{
  const c=n=>invCategoryOf({kind:"item",key:"0",name:n,it:n});
  return {нож:c("Охотничий нож"),яд:c("Яд"),лук:c("Ясеневый лук Ветви"),свиток:c("Чистый свиток"),
   верёвка:c("Моток верёвки"),фонарь:c("Дорожный фонарь"),стрелка:c("Стрелка Незваного Часа"),
   путь:c("Ключ Предтеч"),рог:c("Рог Дома Горнового Рога")};});
 check('15. кириллическая граница слова: нож — оружие, «Яд» — зелье, лук — оружие, чистый свиток — свиток, моток верёвки и дорожный фонарь — инструменты, ключ Предтеч — вещь силы',
  граница.нож==="weapon"&&граница.яд==="potion"&&граница.лук==="weapon"&&граница.свиток==="scroll"
  &&граница.верёвка==="tool"&&граница.фонарь==="tool"&&граница.стрелка==="magic"&&граница.путь==="magic"
  &&граница.рог==="magic",граница);

 /* ── 16. вещь Дома — род по имени ── */
 const дом=await page.evaluate(()=>{
  const т=gearTypeByName("Кольцо мытаря Брода");
  /* старое сохранение: кольцо Дома записано мечом */
  const it={id:"house_проба",name:"Кольцо мытаря Брода",type:"Меч",slot:"weapon",rank:3,qual:3,val:9,price:300,дом:"проба"};
  G.gear.push(it);
  const row=invAll().find(x=>x.it===it);
  const вОружии=weaponList().includes(it);
  G.gear.splice(G.gear.indexOf(it),1);
  return {т,раздел:row&&row.cat,тип:it.type,место:it.slot,вОружии,щит:gearTypeByName("Чешуйчатый щит Свода"),
   лук:gearTypeByName("Ясеневый лук Ветви")};});
 check('16. вещь Дома получает род по имени: кольцо — кольцо и носится как аксессуар, из списка оружия уходит; щит — щит, лук — оружие',
  дом.т.join(",")==="Кольцо,acc"&&дом.раздел==="acc"&&дом.тип==="Кольцо"&&дом.место==="acc"&&!дом.вОружии
  &&дом.щит.join(",")==="Щит,armor"&&дом.лук.join(",")==="Лук,weapon",дом);

 /* ── 17. сокровище: мера, покупатель, лавка ── */
 const цена=await page.evaluate(()=>{
  G.items=[VAULT_TREASURES[1].n];
  const row=invAll().find(x=>x.name===VAULT_TREASURES[1].n);
  return {раздел:row.cat,цена:sellPriceOf(null,row),мера:VAULT_TREASURES[1].ц,
   берут:Object.keys(MERCH_BUYS).filter(k=>MERCH_BUYS[k].includes("treasure")),
   лавка:shopCatOf("treasure"),вЛавке:!!SHOP_CAT_BY_ID.treasure,карточка:invBrief("item",row.key)};});
 check('17. сокровище стоит своей меры, его берут собиратель редкого, старьёвщик и лавочник, в лавке у него свой раздел',
  цена.раздел==="treasure"&&цена.цена===Math.round(цена.мера*0.5)&&цена.берут.includes("redk")
  &&цена.берут.includes("star")&&цена.берут.includes("obshiy")&&!цена.берут.includes("mech")
  &&цена.лавка==="treasure"&&цена.вЛавке&&/сокровище/.test(цена.карточка)&&new RegExp(String(цена.мера)).test(цена.карточка),цена);

 /* ── 18. самопроверка, модуль, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();const r=rows.find(x=>x.id==="punkty");
  const m=Modules.get("SETTINGS_MENU");
  return {есть:!!r,ok:r&&r.ok,плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.groups().length===7&&typeof m.open==="function"&&typeof m.back==="function",
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 93\. Настройки и инвентарь — пунктами/.test(g.title)&&g.body.length>=6),
   часть:guidePartOf(GUIDE_BY_NUM[93])};});
 check('18. самопроверка держит строку punkty, модуль SETTINGS_MENU отвечает, глава 93 в первой части',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.часть==="Часть I. Первые шаги"&&свод.текст.length>40,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);
 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают пункты настроек и инвентаря',
  /Настройки и инвентарь — пунктами/.test(readme)&&/## Настройки и инвентарь — пунктами \(набор 167\)/.test(вз)
  &&/SET_GROUPS/.test(вз)&&/invOpenCat/.test(вз),
  {readme:/Настройки и инвентарь — пунктами/.test(readme),docs:/набор 167/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
