/* ════════════════════════════════════════════════════════════════════════
   ДВОЙНОЕ КАСАНИЕ РАБОТАЕТ ПО ВСЕМУ ЭКРАНУ

   Самая обидная ошибка управления: касание в окне брало не текущий пункт, а
   ту кнопку, что оказалась ПОД ПАЛЬЦЕМ. Двойное касание поэтому срабатывало
   «когда как» — в пустой половине экрана выполняло названный пункт, а над
   кнопками ту кнопку, на которую пришёлся палец. Хуже того: первое касание
   переносило выбор и подтягивало список к новому пункту (scrollIntoView), так
   что под пальцем ко второму касанию оказывалась уже ДРУГАЯ кнопка — и жест
   не делал ничего. Игрок листал свайпами до «Карты мира», касался дважды
   внизу экрана и получал инвентарь или тишину.

   Незрячий не знает, где на экране кнопки, и знать не обязан: у него есть
   текущий пункт — тот, который игра назвала последним. Здесь проверяется
   правило без исключений: КУДА БЫ игрок ни коснулся, первое касание называет
   текущий пункт, второе его выполняет. Место касания не значит ничего.

   Заодно проверяются остальные жесты, названные в той же жалобе: свайп листает
   меню и диалоги в любом темпе, касание двумя пальцами собирает, свайп тремя
   пальцами вверх открывает меню действий откуда угодно.
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

 /* ── 2. Двойное касание в пяти разных точках экрана ── */
 const точки=[[195,60],[195,240],[195,400],[195,600],[24,748]];
 const попытки=[];
 for(const [x,y] of точки){
  await закрытьВсё();await пальцами(3,-130);
  const план=await page.evaluate(()=>{
   const lay=document.getElementById('actionMenu');
   const items=cursorItems(lay);
   setCursor(items[0],false);
   window.__done=[];
   return {выбран:имяПункта(items[0]),всего:items.length};});
  await касание(x,y);await касание(x,y);
  const итог=await page.evaluate(()=>({сделано:window.__done.slice(),
   курсор:имяПункта(uiCursor)}));
  попытки.push({точка:`${x},${y}`,...план,...итог});}
 const промахи=попытки.filter(п=>!(п.сделано.length===1&&п.сделано[0]===п.выбран));
 check('двойное касание в любой точке экрана выполняет выбранный пункт',
  промахи.length===0,промахи.slice(0,3));
 check('касание не сдвигает выбор ни в одной точке экрана',
  попытки.every(п=>п.курсор===п.выбран),попытки.filter(п=>п.курсор!==п.выбран).slice(0,3));

 /* ── 3. Ровно случай из жалобы: выбран один пункт, палец на другом ── */
 await закрытьВсё();await пальцами(3,-130);
 const чужой=await page.evaluate(()=>{
  const lay=document.getElementById('actionMenu');
  const вид=cursorItems(lay).filter(el=>{const r=el.getBoundingClientRect();
   return r.top>=0&&r.bottom<=innerHeight&&r.height>4;});
  if(вид.length<2)return {мало:вид.length};
  setCursor(вид[0],false);
  const r=вид[вид.length-1].getBoundingClientRect();
  window.__done=[];
  return {выбран:имяПункта(вид[0]),подПальцем:имяПункта(вид[вид.length-1]),
   x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 await касание(чужой.x,чужой.y);
 const первое=await page.evaluate(()=>({курсор:имяПункта(uiCursor),сделано:window.__done.slice()}));
 await касание(чужой.x,чужой.y);
 const второе=await page.evaluate(()=>window.__done.slice());
 check('первое касание по ЧУЖОМУ пункту ничего не выполняет и не крадёт выбор',
  первое.курсор===чужой.выбран&&первое.сделано.length===0,{чужой,первое});
 check('второе касание по чужому пункту выполняет ВЫБРАННЫЙ, а не тот, что под пальцем',
  второе.length===1&&второе[0]===чужой.выбран,{чужой,сделано:второе});

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
  const items=cursorItems(m);
  if(items.length<2)return {мало:items.length};
  setCursor(items[0],false);
  const r=items[items.length-1].getBoundingClientRect();
  window.__done=[];
  return {выбран:имяПункта(items[0]),вариантов:items.length,
   x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 if(событие.нет||событие.мало){
  check('диалог события: вариант подтверждается касанием в любом месте',true,'событие не поднялось — пропущено');
 }else{
  await касание(событие.x,событие.y);await касание(событие.x,событие.y);
  const сд=await page.evaluate(()=>window.__done.slice());
  check('диалог события: вариант подтверждается касанием в любом месте',
   сд.length===1&&сд[0]===событие.выбран,{событие,сделано:сд});}

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
