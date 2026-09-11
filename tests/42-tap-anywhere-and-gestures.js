/* ════════════════════════════════════════════════════════════════════════
   ДВОЙНОЕ КАСАНИЕ СРАБАТЫВАЕТ ОДИНАКОВО ПО ВСЕМУ ЭКРАНУ

   Игрок сообщил: жест работает «когда как» — где-то в верхней половине
   экрана, где-то в нижней. Целишься в «Карту мира» — открывается инвентарь.

   Между первым и вторым касанием ЦЕЛЬ УСПЕВАЛА УЕХАТЬ. Первое касание
   переносило выбор и подтягивало список к пункту (scrollIntoView): список ехал
   под неподвижным пальцем, и второе касание попадало в соседнюю кнопку — тем
   дальше, чем ниже по экрану лежал пункт. Наверху жест работал, внизу открывал
   не то. Вдобавок цель второго касания вычислялась заново по координатам, так
   что и любая перерисовка списка уводила жест мимо.

   Здесь проверяется, что цель двойного касания ПРИЛИПАЕТ: на что нацелилось
   первое касание, то второе и выполнит, в любой точке экрана — и что список
   при этом не съезжает. Проверяется и второй путь: касание мимо кнопок
   работает по текущему пункту, так что подтвердить выбор можно в пустом месте,
   не попадая пальцем в кнопку и не зная, где она.

   Заодно проверяются остальные жесты из той же жалобы: свайп листает меню и
   диалоги в любом темпе, касание двумя пальцами собирает, свайп тремя пальцами
   вверх открывает меню действий откуда угодно.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;settings.fastTap=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  /* Перехватываем выполнение: важно ЧТО выполнилось, а не что при этом стало
     с миром. Настоящий вызов не пускаем — иначе первый же пункт закроет меню. */
  window.__done=[];window.__origActivate=window.activateElement;
  window.activateElement=el=>{window.__done.push(имяПункта(el));};
  window.имяПункта=el=>!el?null:((el.dataset&&el.dataset.cmd)||(el.textContent||'').trim().slice(0,28));});

 const cdp=await ctx.newCDPSession(page);
 const касание=async(x,y,мс=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await page.waitForTimeout(мс);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(70);};
 const свайп=async(x,y,dx,dy,мс)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=5;i++){await page.waitForTimeout(мс/5);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5}]});}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(90);};
 const пальцами=async(n,dy,dx=0)=>{
  const pts=[];for(let i=0;i<n;i++)pts.push({x:120+i*45,y:480});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts});
  if(dy||dx){for(let k=1;k<=5;k++){await page.waitForTimeout(28);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
     touchPoints:pts.map(p=>({x:p.x+dx*k/5,y:p.y+dy*k/5}))});}}
  else await page.waitForTimeout(140);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(160);};
 const закрытьВсё=()=>page.evaluate(()=>{for(let i=0;i<25&&activeLayer();i++)closeTopUI();});

 /* ── 1. Меню действий: свайп тремя пальцами вверх ── */
 await закрытьВсё();
 await пальцами(3,-130);
 check('свайп тремя пальцами вверх открывает меню действий',
  await page.evaluate(()=>!document.getElementById('actionMenu').hidden));

 /* ── 2. РОВНО СЛУЧАЙ ИЗ ЖАЛОБЫ: двойное касание по пункту в разных частях
       экрана, в том числе по самому нижнему, где список и уезжал ── */
 const попытки=[];
 for(const где of ['первый','середина','последний']){
  await закрытьВсё();await пальцами(3,-130);
  const цель=await page.evaluate(г=>{
   const lay=document.getElementById('actionMenu');
   const вид=cursorItems(lay).filter(el=>{const r=el.getBoundingClientRect();
    return r.top>=0&&r.bottom<=innerHeight&&r.height>4;});
   if(вид.length<3)return null;
   const el=г==='первый'?вид[0]:г==='середина'?вид[Math.floor(вид.length/2)]:вид[вид.length-1];
   /* выбор нарочно стоит на ДРУГОМ пункте: целимся пальцем, а не свайпом */
   setCursor(вид[0]===el?вид[1]:вид[0],false);
   const r=el.getBoundingClientRect();
   window.__done=[];
   return {надо:имяПункта(el),былВыбран:имяПункта(uiCursor),
    x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),
    верх:Math.round(r.top)};},где);
  if(!цель)continue;
  await касание(цель.x,цель.y);
  const списокУехал=await page.evaluate(([x,y,надо])=>{
   const el=document.elementFromPoint(x,y);
   const b=el&&el.closest&&el.closest('button,[data-cmd],[role="button"]');
   return b?имяПункта(b)!==надо:true;},[цель.x,цель.y,цель.надо]);
  await касание(цель.x,цель.y);
  const сделано=await page.evaluate(()=>window.__done.slice());
  попытки.push({где,...цель,списокУехал,сделано});}
 const промахи=попытки.filter(п=>!(п.сделано.length===1&&п.сделано[0]===п.надо));
 check('двойное касание по пункту выполняет ЕГО, где бы на экране он ни был',
  попытки.length>=3&&промахи.length===0,промахи.slice(0,3));
 check('список не уезжает из-под пальца между двумя касаниями',
  попытки.every(п=>!п.списокУехал),попытки.filter(п=>п.списокУехал).slice(0,3));

 /* ── 3. Второй путь: касание мимо кнопок работает по текущему пункту ── */
 await закрытьВсё();await пальцами(3,-130);
 const пусто=await page.evaluate(()=>{
  const lay=document.getElementById('actionMenu');
  const items=cursorItems(lay);
  setCursor(items[0],false);
  /* точка внутри слоя, но не на кнопке */
  const r=lay.getBoundingClientRect();
  let x=Math.round(r.left+4),y=Math.round(Math.max(2,r.top+2));
  for(let k=0;k<40;k++){
   const el=document.elementFromPoint(x,y);
   if(!el||!el.closest||!el.closest('button,[data-cmd],[role="button"]'))break;
   y+=6;}
  window.__done=[];
  return {выбран:имяПункта(items[0]),x,y};});
 await касание(пусто.x,пусто.y);await касание(пусто.x,пусто.y);
 const мимо=await page.evaluate(()=>window.__done.slice());
 check('двойное касание мимо кнопок выполняет выбранный пункт',
  мимо.length===1&&мимо[0]===пусто.выбран,{пусто,сделано:мимо});

 /* ── 4. Свайп листает меню в любом темпе ── */
 for(const [имя,мс] of [['быстрый',90],['обычный',260],['неспешный',600]]){
  await закрытьВсё();await пальцами(3,-130);
  const было=await page.evaluate(()=>{
   const items=cursorItems(document.getElementById('actionMenu'));
   setCursor(items[0],false);return имяПункта(items[0]);});
  await свайп(195,400,0,110,мс);
  const стало=await page.evaluate(()=>имяПункта(uiCursor));
  check(`свайп (${имя}) листает меню на пункт вперёд`,стало!==null&&стало!==было,{было,стало});}

 /* ── 5. Свайп назад возвращает на прежний пункт ── */
 await закрытьВсё();await пальцами(3,-130);
 const туда=await page.evaluate(()=>{
  const items=cursorItems(document.getElementById('actionMenu'));
  setCursor(items[0],false);return имяПункта(items[0]);});
 await свайп(195,400,0,110,200);
 const после=await page.evaluate(()=>имяПункта(uiCursor));
 await свайп(195,400,0,-110,200);
 const назад=await page.evaluate(()=>имяПункта(uiCursor));
 check('свайп назад возвращает выбор на прежний пункт',
  после!==туда&&назад===туда,{туда,после,назад});

 /* ── 6. Диалог события листается и подтверждается тем же правилом ── */
 await закрытьВсё();
 const событие=await page.evaluate(()=>{
  const m=document.getElementById('modal-event');
  if(!m)return {нет:true};
  /* поднимем любое событие честным путём */
  for(let i=0;i<400;i++){safeFn(()=>maybeEvent('step'));if(!m.hidden)break;}
  if(m.hidden)return {нет:true};
  /* Берём НИЖНИЙ вариант — тот, на котором список и уезжал, — и целимся в него
     пальцем, поставив выбор на другой. Сработать должен тот, в который целились. */
  const вар=cursorItems(m).filter(el=>{const r=el.getBoundingClientRect();
   return r.top>=0&&r.bottom<=innerHeight&&r.height>4;});
  if(вар.length<2)return {мало:вар.length};
  const цель=вар[вар.length-1];
  setCursor(вар[0],false);
  const r=цель.getBoundingClientRect();
  window.__done=[];
  return {надо:имяПункта(цель),былВыбран:имяПункта(вар[0]),вариантов:вар.length,
   x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 if(событие.нет||событие.мало){
  check('диалог события: нижний вариант подтверждается двойным касанием',true,'событие не поднялось — пропущено');
 }else{
  await касание(событие.x,событие.y);await касание(событие.x,событие.y);
  const сд=await page.evaluate(()=>window.__done.slice());
  check('диалог события: нижний вариант подтверждается двойным касанием',
   сд.length===1&&сд[0]===событие.надо,{событие,сделано:сд});}

 /* ── 7. Касание двумя пальцами собирает ресурс ── */
 await закрытьВсё();
 await page.evaluate(()=>{
  window.activateElement=window.__origActivate;
  for(let r=0;r<160;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=cellContent(1000+dx,1000+dy);
   if(c.res&&!c.structure&&!c.monster){G.x=1000+dx;G.y=1000+dy;return;}}});
 await page.evaluate(()=>{G.inv={};G.depleted={};window.__said=[];});
 await пальцами(2,0);
 const собрано=await page.evaluate(()=>({
  запас:Object.values(G.inv||{}).reduce((a,b)=>a+(Number(b)||0),0),
  речь:window.__said.join(' ').slice(0,60)}));
 check('касание двумя пальцами собирает ресурс под ногами',
  собрано.запас>0&&/Собрано/i.test(собрано.речь),собрано);

 /* ── 8. Касание двумя пальцами при открытом окне закрывает его ── */
 await пальцами(3,-130);
 const былоОткрыто=await page.evaluate(()=>!!activeLayer());
 await пальцами(2,0);
 check('касание двумя пальцами закрывает открытое окно',
  былоОткрыто&&!(await page.evaluate(()=>!!activeLayer())));

 /* ── 9. Меню действий открывается поверх другого окна одним жестом ── */
 await закрытьВсё();
 await page.evaluate(()=>{openModal('modal-inventory');renderInventory();});
 await пальцами(3,-130);
 const поверх=await page.evaluate(()=>({
  меню:!document.getElementById('actionMenu').hidden,
  инвентарь:!document.getElementById('modal-inventory').hidden}));
 check('свайп тремя пальцами вверх открывает меню поверх другого окна одним жестом',
  поверх.меню===true,поверх);

 /* ── 10. Тот же жест закрывает само меню действий ── */
 await пальцами(3,-130);
 check('повторный свайп тремя пальцами вверх закрывает меню действий',
  await page.evaluate(()=>document.getElementById('actionMenu').hidden));

 /* ── 11. Ощупывание по-прежнему наводит выбор ── */
 await закрытьВсё();await пальцами(3,-130);
 const щуп=await page.evaluate(()=>{
  const вид=cursorItems(document.getElementById('actionMenu')).filter(el=>{
   const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>4;});
  setCursor(вид[0],false);
  const r=вид[Math.min(3,вид.length-1)].getBoundingClientRect();
  return {выбран:имяПункта(вид[0]),цель:имяПункта(вид[Math.min(3,вид.length-1)]),
   x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 /* палец лёг на пункт и полежал — это ощупывание, а не касание */
 await касание(щуп.x,щуп.y,500);
 check('палец, полежавший на пункте, делает его текущим',
  await page.evaluate(()=>имяПункта(uiCursor))===щуп.цель,
  {щуп,курсор:await page.evaluate(()=>имяПункта(uiCursor))});

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
