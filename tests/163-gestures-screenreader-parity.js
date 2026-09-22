/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 163: ЖЕСТЫ ОТРАБАТЫВАЮТ, КАК В TALKBACK И VOICEOVER

   Проверки 161 меряли пороги: сколько пикселей и сколько миллисекунд.
   Здесь проверяется другое — живая рука. Все касания идут настоящими
   событиями устройства (CDP Input.dispatchTouchEvent), а не вызовами
   внутренних функций, и рука ведёт себя так, как ведёт себя рука
   незрячего человека: пальцы опускаются вразнобой, перекатываются, пока
   их ставят, снимаются по очереди, свайп идёт вкось и не спеша.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Раздельное касание: палец держит названный пункт, второй стукает
      рядом — пункт выполняется, окно остаётся открытым.
   2. Касание двумя пальцами в окне его больше не закрывает — это только
      сбор; закрывает свайп двумя пальцами вниз.
   3. Пункт, который палец не успел назвать, раздельным касанием не
      выполняется.
   4. Палец, ушедший с пункта, раздельного касания не даёт.
   5. Выключенная настройка возвращает прежнее поведение полностью.
   6. На поле раздельного касания нет: два пальца собирают.
   7. Касание двумя, тремя и четырьмя пальцами, когда пальцы опускаются
      вразнобой и перекатываются.
   8. Двенадцать многопальцевых свайпов при разнобое в постановке.
   9. Свайп вкось на тридцать градусов идёт по преобладающей стороне.
  10. Медленный свайп в семь десятых секунды — всё ещё свайп.
  11. Пальцы снимаются по очереди с четвертью секунды между ними.
  12. Пятый палец отменяет жест и ничего не выполняет.
  13. Отмена касания системой не оставляет игру в подвешенном состоянии.
  14. Свайп одним пальцем в окне листает во все четыре стороны.
  15. Карта жестов знает раздельное касание и не спорит сама с собой.
  16. Настройка есть в окне, сохраняется и описана в документах.
  17. У раздельного касания своя настоящая запись, а не отклик двойного.
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
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 /* Мир сам подаёт голос по таймерам входа: пережидаем, чтобы чужая фраза не
    легла в середину замера. */
 await page.evaluate(()=>{try{G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(3000);

 await page.evaluate(()=>{
  window.ЖУР=[];window.СЛОВА=[];
  const о=Speech.say.bind(Speech);
  Speech.say=function(t,x){window.СЛОВА.push(String(t).slice(0,60));return о(t,x);};
  const имена=["handleTwoFingerTap","handleThreeFingerTap","handleFourFingerTap",
   "handleTwoFingerSwipe","handleThreeFingerSwipe","handleFourFingerSwipe",
   "actionMenuGesture","activateElement"];
  имена.forEach(function(n){
   const f=window[n];if(typeof f!=="function"){window.ЖУР.push(["НЕТ:"+n]);return;}
   window[n]=function(){
    window.ЖУР.push(n+(arguments.length&&typeof arguments[0]!=="object"?":"+arguments[0]:
     (n==="activateElement"&&arguments[0]?":"+(arguments[0].id||arguments[0].dataset&&arguments[0].dataset.cmd||"?"):"")));
    return f.apply(this,arguments);};});
 });

 const send=(t,p)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:p});
 const ждать=ms=>page.waitForTimeout(ms);
 const сброс=async()=>{await page.evaluate(()=>{window.ЖУР=[];window.СЛОВА=[];});};
 const снять=()=>page.evaluate(()=>({жур:window.ЖУР.slice(),слова:window.СЛОВА.slice(),
  слой:(function(){try{const l=activeLayer();return l?l.id:null;}catch(e){return "?";}})()}));
 const закрыть=async()=>{await page.evaluate(()=>{try{for(let i=0;i<8&&activeLayer();i++)closeTopUI();}catch(e){}});await ждать(120);};
 const настройки=async()=>{await закрыть();await page.evaluate(()=>CMD.settings());await ждать(350);};

 /* ── Рука: n пальцев, сдвиг, разнобой при постановке и снятии, перекат ── */
 const рука=async(n,dx,dy,o)=>{
  o=o||{};
  const x0=o.x||150,y0=o.y||420,шаг=44;
  const жив=[];
  for(let i=0;i<n;i++){
   жив.push({x:x0+i*шаг,y:y0,id:i+1});
   await send('touchStart',жив.map(q=>({x:Math.round(q.x),y:Math.round(q.y),id:q.id})));
   if(o.вразнобой&&i<n-1)await ждать(o.вразнобой);
   if(o.перекат){
    жив.forEach((q,k)=>{q.x+=(k%2?1:-1)*o.перекат;q.y+=(k%2?-1:1)*Math.round(o.перекат/2);});
    await send('touchMove',жив.map(q=>({x:Math.round(q.x),y:Math.round(q.y),id:q.id})));}
  }
  const шагов=o.шагов||5,мс=o.мс||120;
  if(dx||dy){
   for(let s=1;s<=шагов;s++){
    жив.forEach(q=>{q.x+=dx/шагов;q.y+=dy/шагов;});
    await send('touchMove',жив.map(q=>({x:Math.round(q.x),y:Math.round(q.y),id:q.id})));
    await ждать(Math.max(8,Math.round(мс/шагов)));}
  }else await ждать(o.держать||90);
  if(o.снятиеВразнобой){
   for(let i=0;i<жив.length;i++){
    await send('touchEnd',[{x:Math.round(жив[i].x),y:Math.round(жив[i].y),id:жив[i].id}]);
    if(i<жив.length-1)await ждать(o.снятиеВразнобой);}
  }else await send('touchEnd',[]);
  await ждать(150);};

 /* ── Раздельное касание ── */
 const раздельное=async(цель,o)=>{
  o=o||{};
  await send('touchStart',[{x:цель.x,y:цель.y,id:1}]);
  await ждать(o.держать===undefined?400:o.держать);
  if(o.увести){
   await send('touchMove',[{x:цель.x,y:Math.max(20,цель.y-160),id:1}]);
   await ждать(120);}
  const где=o.увести?{x:цель.x,y:Math.max(20,цель.y-160)}:{x:цель.x,y:цель.y};
  const второй={x:Math.min(370,цель.x+110),y:Math.max(30,цель.y-70),id:2};
  await send('touchStart',[{x:где.x,y:где.y,id:1},второй]);
  await ждать(60);
  await send('touchEnd',[второй]);
  await ждать(160);
  const промежуток=await снять();
  await send('touchEnd',[]);
  await ждать(160);
  const итог=await снять();
  return {промежуток,итог};};

 const целькой=async(sel)=>page.evaluate(s=>{
  const el=document.querySelector(s);if(!el)return null;
  const r=el.getBoundingClientRect();
  return {x:Math.round(r.left+Math.min(r.width/2,40)),y:Math.round(r.top+r.height/2),id:el.id||el.dataset.cmd||""};},sel);

 /* ── 1. раздельное касание выполняет пункт и не закрывает окно ── */
 await настройки();
 const цель=await целькой('#modal-settings [data-cmd="secindex"]');
 await сброс();
 const р1=цель?await раздельное(цель):null;
 check('1. раздельное касание: палец держит названный пункт, второй стукает рядом — пункт выполняется, окно остаётся',
  !!р1&&р1.промежуток.жур.some(x=>/^activateElement/.test(x))&&р1.промежуток.слой==="modal-settings"
  &&р1.итог.слой==="modal-settings"&&!р1.итог.жур.some(x=>/handleTwoFingerTap/.test(x)),
  р1&&{жур:р1.промежуток.жур,слой:р1.итог.слой,цель});

 /* ── 2. окно закрывает свайп двумя пальцами вниз, а не касание ── */
 await настройки();await сброс();
 await рука(2,0,0,{вразнобой:30,x:150,y:300});
 const д2=await снять();
 check('2. касание двумя пальцами в окне его больше не закрывает — это только сбор',
  д2.жур.some(x=>/handleTwoFingerTap/.test(x))&&д2.слой==="modal-settings",д2);
 await сброс();
 await рука(2,0,150,{вразнобой:30,x:150,y:260});
 const д2б=await снять();
 check('2а. окно закрывает свайп двумя пальцами вниз',
  д2б.жур.some(x=>/handleTwoFingerSwipe:S/.test(x))&&д2б.слой===null,д2б);

 /* ── 3. неназванный пункт раздельным касанием не выполняется ── */
 await настройки();
 const ц3=await целькой('#modal-settings [data-cmd="secindex"]');
 await сброс();
 const р3=ц3?await раздельное(ц3,{держать:80}):null;
 check('3. пункт, который палец не успел назвать, раздельным касанием не выполняется',
  !!р3&&!р3.итог.жур.some(x=>/^activateElement/.test(x)),р3&&р3.итог.жур);

 /* ── 4. палец ушёл с пункта ── */
 await настройки();
 const ц4=await целькой('#modal-settings [data-cmd="secindex"]');
 await сброс();
 const р4=ц4?await раздельное(ц4,{увести:true}):null;
 check('4. палец, ушедший с пункта, раздельного касания не даёт',
  !!р4&&!р4.итог.жур.some(x=>/^activateElement:secindex/.test(x)),р4&&р4.итог.жур);

 /* ── 5. выключенная настройка возвращает прежнее поведение ── */
 await page.evaluate(()=>{settings.splitTap=0;});
 await настройки();
 const ц5=await целькой('#modal-settings [data-cmd="secindex"]');
 await сброс();
 const р5=ц5?await раздельное(ц5):null;
 check('5. выключенное раздельное касание возвращает прежнее поведение: пункт не выполняется',
  !!р5&&!р5.итог.жур.some(x=>/^activateElement/.test(x)),р5&&р5.итог.жур);
 await page.evaluate(()=>{settings.splitTap=1;});

 /* ── 6. на поле раздельного касания нет ── */
 await закрыть();await сброс();
 await send('touchStart',[{x:150,y:420,id:1}]);
 await ждать(400);
 await send('touchStart',[{x:150,y:420,id:1},{x:260,y:350,id:2}]);
 await ждать(60);
 await send('touchEnd',[{x:260,y:350,id:2}]);await ждать(140);
 await send('touchEnd',[]);await ждать(160);
 const д6=await снять();
 check('6. на поле раздельного касания нет: два пальца собирают, как собирали',
  д6.жур.some(x=>/handleTwoFingerTap/.test(x)),д6.жур);

 /* ── 7. касания вразнобой и с перекатом ── */
 const касанияОК=[];
 for(const [подпись,o] of [["вразнобой",{вразнобой:70,снятиеВразнобой:60}],
   ["перекат",{вразнобой:50,перекат:14,снятиеВразнобой:40}]]){
  await закрыть();await сброс();
  await рука(2,0,0,o);
  касанияОК.push([подпись+":2",(await снять()).жур.join(",")]);
  await закрыть();await сброс();
  await рука(3,0,0,o);await ждать(180);await рука(3,0,0,o);
  касанияОК.push([подпись+":3×2",(await снять()).жур.join(",")]);
  await закрыть();await сброс();
  await рука(4,0,0,o);await ждать(180);await рука(4,0,0,o);
  касанияОК.push([подпись+":4×2",(await снять()).жур.join(",")]);
 }
 check('7. касание двумя, тремя и четырьмя пальцами доходит, когда пальцы ставят вразнобой и перекатывают',
  касанияОК.every(([имя,ж])=>имя.endsWith(":2")?/handleTwoFingerTap/.test(ж)
   :имя.endsWith(":3×2")?/handleThreeFingerTap/.test(ж)
   :/handleFourFingerTap/.test(ж)),касанияОК);

 /* ── 8. двенадцать многопальцевых свайпов вразнобой ── */
 const ждём={"2N":"handleTwoFingerSwipe","2S":"handleTwoFingerSwipe","2W":"handleTwoFingerSwipe","2E":"handleTwoFingerSwipe",
  "3N":"actionMenuGesture","3S":"handleThreeFingerSwipe","3W":"handleThreeFingerSwipe","3E":"handleThreeFingerSwipe",
  "4N":"handleFourFingerSwipe","4S":"handleFourFingerSwipe","4W":"handleFourFingerSwipe","4E":"handleFourFingerSwipe"};
 const свайпы=[];
 for(const [d,dx,dy] of [["N",0,-150],["S",0,150],["W",-150,0],["E",150,0]]){
  for(const n of [2,3,4]){
   await закрыть();await сброс();
   await рука(n,dx,dy,{вразнобой:70,снятиеВразнобой:50});
   const ж=(await снять()).жур.join(",");
   свайпы.push([n+d,ж.indexOf(ждём[n+d])>=0]);}
 }
 check('8. все двенадцать многопальцевых свайпов доходят при разнобое в постановке пальцев',
  свайпы.every(([,ок])=>ок),свайпы.filter(([,ок])=>!ок));

 /* ── 9–10. косой и медленный ── */
 await закрыть();await сброс();
 await рука(3,78,-135,{});
 const косой=(await снять()).жур.join(",");
 await закрыть();await сброс();
 await рука(3,0,-150,{мс:700,шагов:10});
 const медленный=(await снять()).жур.join(",");
 check('9. свайп вкось на тридцать градусов идёт по преобладающей стороне',/actionMenuGesture/.test(косой),косой);
 check('10. медленный свайп в семь десятых секунды — всё ещё свайп',/actionMenuGesture/.test(медленный),медленный);

 /* ── 11. снятие пальцев по очереди с четвертью секунды ── */
 await закрыть();await сброс();
 await рука(3,0,0,{вразнобой:60,снятиеВразнобой:250});
 await ждать(200);
 await рука(3,0,0,{вразнобой:60,снятиеВразнобой:250});
 const д11=await снять();
 check('11. пальцы, снятые по очереди с четвертью секунды, всё равно дают одно касание тремя',
  д11.жур.filter(x=>/handleThreeFingerTap/.test(x)).length>=1,д11.жур);

 /* ── 12. пятый палец ── */
 await закрыть();await сброс();
 await рука(5,0,0,{});
 const д12=await снять();
 check('12. пятый палец отменяет жест: ничего не выполняется',
  !д12.жур.some(x=>/handle(Two|Three|Four)Finger/.test(x)),д12.жур);

 /* ── 13. отмена касания системой ── */
 await закрыть();await сброс();
 await send('touchStart',[{x:150,y:420,id:1}]);
 await send('touchStart',[{x:150,y:420,id:1},{x:200,y:420,id:2}]);
 await ждать(80);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await ждать(200);
 await рука(2,0,0,{});
 const д13=await снять();
 check('13. отмена касания системой не оставляет жест висеть: следующий жест работает',
  д13.жур.some(x=>/handleTwoFingerTap/.test(x))&&errors.length===0,д13.жур);

 /* ── 14. свайп одним пальцем в окне листает во все четыре стороны ── */
 await настройки();
 const листание=[];
 for(const [имя,dx,dy] of [["вниз",0,130],["вверх",0,-130],["вправо",130,0],["влево",-130,0]]){
  await сброс();
  await send('touchStart',[{x:195,y:400,id:1}]);
  for(let i=1;i<=5;i++){await send('touchMove',[{x:Math.round(195+dx*i/5),y:Math.round(400+dy*i/5),id:1}]);await ждать(25);}
  await send('touchEnd',[]);await ждать(200);
  const с=await снять();
  листание.push([имя,с.слова.length>0]);}
 await закрыть();
 check('14. свайп одним пальцем в окне листает во все четыре стороны и каждый раз что-то называет',
  листание.every(([,ок])=>ок),листание);

 /* ── 17. у раздельного касания свой голос ── */
 await настройки();
 await page.evaluate(()=>{window.ЗВУК=[];const о=UI.nat.bind(UI);
  UI.nat=function(r,g){window.ЗВУК.push(String(r));return о(r,g);};});
 const цельЗ=await целькой('#modal-settings [data-cmd="secindex"]');
 if(цельЗ)await раздельное(цельЗ);
 const звук=await page.evaluate(()=>({игралось:window.ЗВУК.slice(),
  файл:(typeof UI_BANK!=="undefined"&&UI_BANK.ui_split)||""}));
 check('17. раздельное касание отвечает своей настоящей записью, а не откликом двойного',
  звук.игралось.indexOf("ui_split")>=0&&звук.игралось.indexOf("ui_activate")<0
  &&/^oc\//.test(звук.файл),звук);

 /* ── 15–16. карта, настройка, документы ── */
 const карта=await page.evaluate(()=>{
  const р={длина:GESTURE_MAP.length,споры:Gestures.conflicts(),
   есть:GESTURE_MAP.some(g=>g.kind==="split"),
   слово:Gestures.word(GESTURE_MAP.find(g=>g.kind==="split")||{}),
   вТексте:Gestures.text().indexOf("раздельное касание")>=0};
  const el=document.getElementById("setSplitTap");
  р.галочка=!!el;
  if(el){el.checked=false;el.dispatchEvent(new Event("change"));
   let с={};try{с=JSON.parse(localStorage.getItem("gm29set")||"{}");}catch(_){}
   р.сохранено=с.splitTap;
   el.checked=true;el.dispatchEvent(new Event("change"));}
  return р;});
 check('15. карта жестов знает раздельное касание, называет его словами и не спорит сама с собой',
  карта.длина===16&&карта.споры.length===0&&карта.есть
  &&/раздельное касание/.test(карта.слово)&&карта.вТексте,карта);
 check('16. настройка раздельного касания есть в окне и ложится в сохранение',
  карта.галочка&&карта.сохранено===0,карта);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('README и документы описывают раздельное касание',
  /Раздельное касание/.test(readme)&&/раздельное касание/i.test(вз),
  {readme:/Раздельное касание/.test(readme),вз:/раздельное касание/i.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
