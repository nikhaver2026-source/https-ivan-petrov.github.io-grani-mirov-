/* ════════════════════════════════════════════════════════════════════════
   НАБОР 63: НАХОДКИ — ТО, ЧТО ПРОСТО ЛЕЖИТ В МИРЕ

   В комнатах давно стоят вещи, с которыми можно что-то сделать: стол,
   наковальня, чаша, било. Под открытым небом не стояло ничего — клетка была
   постройкой, ресурсом, тварью или пустотой, и пустотой она была в
   восьмидесяти пяти случаях из ста. Незрячий игрок шёл сквозь мир, в котором
   не к чему протянуть руку.

   Находка — четвёртый слой клетки. У неё есть состояние, описание, действие,
   звук и место, слышное маяком.

   ЧТО ЗДЕСЬ ПРОВЕРЯЕТСЯ ПО-НАСТОЯЩЕМУ.

   1. ДОСТИЖИМОСТЬ. Та же проверка, что подвела сорта добычи и чуть не
      подвела дороги: каждая находка должна встречаться в настоящем мире, а не
      только в таблице. Записанное содержимое без дороги к нему — не
      содержимое.

   2. СОСТОЯНИЕ ПОМНИТСЯ. Взять с находки можно один раз. Без записи
      поваленное дерево стало бы бесконечной лесопилкой, и ремесло потеряло
      бы смысл — ровно та беда, что уже была с обстановкой комнат. Запись
      должна пережить и уход с клетки, и сохранение с загрузкой.

   3. ДЕЙСТВИЕ И ВПРАВДУ ЧТО-ТО ДЕЛАЕТ. Не «сказало слова», а: прибавилось в
      котомке, прибавилось воды, убыло здоровья, ушло время. Проверка
      написана шире беды: кошелёк и запасы обязаны остаться числами.

   4. ЗВУЧИТ ЖИВОЙ ЗАПИСЬЮ. У каждой находки роль из банка, а не синтез.
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

 /* ── 1. Таблица полна ── */
 const таблица=await page.evaluate(()=>{
  const плохие=[];
  for(const f of FINDS){
   if(!f.id||!f.n||!f.о||!f.b||!f.звук||typeof f.use!=="function")плохие.push(f.id||"?");
   if(!f.биом&&(!Array.isArray(f.где)||!f.где.length))плохие.push((f.id||"?")+": негде");
   if(!SOUND_BANK[f.звук])плохие.push((f.id||"?")+": нет записи "+f.звук);
   const маяк=(typeof BEACON_SAMPLE!=="undefined"&&BEACON_SAMPLE[f.b])
    ||(typeof BEACON_ROLE!=="undefined"&&BEACON_ROLE[f.b]);
   if(!маяк)плохие.push((f.id||"?")+": нет маяка "+f.b);}
  return {всего:FINDS.length,плохие};});
 check('находок не меньше двадцати, и у каждой имя, описание, действие, звук и маяк',
  таблица.всего>=20&&таблица.плохие.length===0,таблица);

 /* ── 2. ДОСТИЖИМОСТЬ: каждая находка встречается в настоящем мире ── */
 const достижимость=await page.evaluate(()=>{
  const O=25000,R=150;
  const встречено={};let клеток=0,сНаходкой=0;
  for(let x=O-R;x<O+R;x++)for(let y=O-R;y<O+R;y++){
   клеток++;
   const c=cellContent(x,y);
   if(!c.находка)continue;
   сНаходкой++;встречено[c.находка.id]=(встречено[c.находка.id]||0)+1;}
  /* Кусок мира рядом со стартом — это одна-две земли, и лесных, горных и
     ледниковых находок в нём нет по построению. Достижимость поэтому меряется
     ПО ВСЕМУ МИРУ редкой сеткой: пятьдесят тысяч клеток по стороне обходятся
     шагом в двести тридцать, и это полсотни тысяч проб — секунды.
     Ровно на этом первая сборка и попалась: семь находок числились
     недостижимыми, хотя недостижим был только кусок мира, взятый для замера. */
  const поМиру={};
  for(let x=17;x<WORLD;x+=229)for(let y=31;y<WORLD;y+=233){
   const f=findAt(x,y);
   if(f)поМиру[f.id]=(поМиру[f.id]||0)+1;}
  const всеВстречены=FINDS.filter(f=>!встречено[f.id]&&!поМиру[f.id]).map(f=>f.id);
  return {клеток,сНаходкой,доля:(сНаходкой/клеток*100).toFixed(1)+"%",
   разных:Object.keys(встречено).length,
   поМиру:Object.fromEntries(Object.entries(поМиру).sort((a,b)=>a[1]-b[1]).slice(0,6)),
   нет:всеВстречены};});
 check('каждая находка встречается в настоящем мире, а не только в таблице',
  достижимость.нет.length===0,{нет:достижимость.нет,самыеРедкие:достижимость.поМиру});
 check('находок в мире не пусто и не сплошь',
  parseFloat(достижимость.доля)>=2&&parseFloat(достижимость.доля)<=20,достижимость);

 /* ── 3. Находка называется в описании клетки и в меню действий ── */
 const виднa=await page.evaluate(()=>{
  const O=25000;let точка=null;
  outer: for(let x=O-150;x<O+150;x++)for(let y=O-150;y<O+150;y++){
   const c=cellContent(x,y);
   if(c.находка&&!c.structure&&!c.res){точка={x,y,id:c.находка.id,n:c.находка.n};break outer;}}
  if(!точка)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.x=точка.x;G.y=точка.y;
  const c=cellContent(G.x,G.y);
  const оп=cellDesc(c);
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=t=>{реплики.push(String(t));return say(t);};
  look();
  Speech.say=say;
  return {точка,оп,вОписании:оп.indexOf(точка.n)>=0,
   доступно:amAvailable("interact"),осмотр:реплики.join(" ")};});
 check('находка названа в описании клетки',!виднa.нет&&виднa.вОписании,виднa);
 check('и «Взаимодействовать» становится доступно',!виднa.нет&&виднa.доступно===true,виднa);
 check('осмотр рассказывает, что здесь лежит',
  !виднa.нет&&виднa.осмотр.indexOf(виднa.точка.n)>=0,{осмотр:(виднa.осмотр||"").slice(0,220)});

 /* ── 4. Действие и вправду что-то делает, и звучит живой записью ── */
 const действие=await page.evaluate(()=>{
  const O=25000;const итоги=[];
  const найти=id=>{
   for(let x=O-600;x<O+600;x++)for(let y=O-600;y<O+600;y++){
    const c=cellContent(x,y);
    if(c.находка&&c.находка.id===id)return {x,y};}
   return null;};
  const виды=[...new Set(FINDS.map(f=>f.id))].slice(0,30);
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  const say=Speech.say.bind(Speech);const реплики=[];Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  for(const id of виды){
   const т=найти(id);if(!т)continue;
   G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
   G.x=т.x;G.y=т.y;
   const вера=()=>Object.values(G.faith||{}).reduce((s,v)=>s+(Number(v)||0),0);
   const до={золото:G.gold,вода:G.water,hp:G.hp,час:G.hour,день:G.day,вера:вера(),
    котомка:Object.values(G.inv||{}).reduce((s,v)=>s+(Number(v)||0),0)};
   const звуковБыло=звуки.length,репликБыло=реплики.length;
   useFind(т.x,т.y);
   const после={золото:G.gold,вода:G.water,hp:G.hp,час:G.hour,день:G.day,вера:вера(),
    котомка:Object.values(G.inv||{}).reduce((s,v)=>s+(Number(v)||0),0)};
   итоги.push({id,
    числа:[после.золото,после.вода,после.hp,после.час,после.котомка].every(v=>Number.isFinite(v)),
    сказали:реплики.length>репликБыло,
    прозвучало:звуки.length>звуковБыло,
    изменилось:после.золото!==до.золото||после.вода!==до.вода||после.hp!==до.hp
     ||после.котомка!==до.котомка||после.час!==до.час||после.вера!==до.вера});}
  Bank.play=bp;Speech.say=say;
  return {итоги,проверено:итоги.length,
   безЧисел:итоги.filter(o=>!o.числа).map(o=>o.id),
   молчком:итоги.filter(o=>!o.сказали).map(o=>o.id),
   беззвучно:итоги.filter(o=>!o.прозвучало).map(o=>o.id),
   безПоследствий:итоги.filter(o=>!o.изменилось).map(o=>o.id)};});
 check('проверено большинство находок в деле',действие.проверено>=14,
  {проверено:действие.проверено});
 check('после каждой находки золото, вода, здоровье и время остались числами',
  действие.безЧисел.length===0,действие.безЧисел);
 check('каждая находка говорит, что произошло',действие.молчком.length===0,действие.молчком);
 check('каждая находка звучит живой записью',действие.беззвучно.length===0,действие.беззвучно);
 /* Три находки — чистое сведение, и это задумано: тур показывает на селение,
    звериная тропа называет того, кто ходит рядом, межевой столб — чью землю
    вы топчете. Остальные обязаны что-то менять. */
 check('без последствий остаются только те три находки, что дают сведение',
  действие.безПоследствий.length<=3
  &&действие.безПоследствий.every(id=>["cairn","trail","boundary"].includes(id)),
  действие.безПоследствий);

 /* ── 5. Взять можно один раз, и это помнится ── */
 const дважды=await page.evaluate(()=>{
  const O=25000;
  const найти=id=>{for(let x=O-600;x<O+600;x++)for(let y=O-600;y<O+600;y++){
   const c=cellContent(x,y);if(c.находка&&c.находка.id===id)return {x,y};}return null;};
  G.finds={};
  const т=найти("deadtree")||найти("wreck")||найти("carcass");
  if(!т)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;
  const сумма=()=>Object.values(G.inv||{}).reduce((s,v)=>s+(Number(v)||0),0);
  const было=сумма();
  useFind(т.x,т.y);const после1=сумма();
  useFind(т.x,т.y);const после2=сумма();
  /* Уходим, возвращаемся, сохраняемся и загружаемся — запись обязана выжить. */
  G.x=т.x+40;G.y=т.y+40;
  const raw=serializeSave();
  G.finds={};
  Object.assign(G,JSON.parse(raw));
  useFind(т.x,т.y);const после3=сумма();
  return {было,после1,после2,после3,
   далоПервый:после1>было,неДалоВторой:после2===после1,неДалоПослеЗагрузки:после3===после1};});
 check('с находки берут один раз',
  !дважды.нет&&дважды.далоПервый&&дважды.неДалоВторой,дважды);
 check('и это помнит сохранение: после загрузки второй раз тоже не дают',
  !дважды.нет&&дважды.неДалоПослеЗагрузки,дважды);

 /* ── 6. Колодец и родник дают воду хоть каждый день: это не пожива ── */
 const вода=await page.evaluate(()=>{
  const O=25000;
  const найти=id=>{for(let x=O-800;x<O+800;x++)for(let y=O-800;y<O+800;y++){
   const c=cellContent(x,y);if(c.находка&&c.находка.id===id)return {x,y};}return null;};
  const т=найти("well")||найти("spring");
  if(!т)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.water=10;
  useFind(т.x,т.y);const раз=G.water;
  G.water=10;useFind(т.x,т.y);const два=G.water;
  return {раз,два,оба:раз>10&&два>10};});
 check('из колодца пьют не один раз в жизни',!вода.нет&&вода.оба,вода);

 /* ── 7. Находку слышно маяком с нескольких шагов ── */
 const маяк=await page.evaluate(()=>{
  const O=25000;let точка=null;
  outer: for(let x=O-150;x<O+150;x++)for(let y=O-150;y<O+150;y++){
   const c=cellContent(x,y);
   if(c.находка&&!c.structure&&!c.res&&!c.monster){точка={x,y};break outer;}}
  if(!точка)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.x=точка.x+2;G.y=точка.y+1;
  const около=safeFn(()=>Scape.around(),[])||[];
  return {точка,есть:около.some(o=>o.kind==="find"),видов:[...new Set(около.map(o=>o.kind))],
   голос:!!(SCAPE_VOICE&&SCAPE_VOICE.find)};});
 check('у находки есть голос в звуковой картине',!маяк.нет&&маяк.голос,маяк);
 check('и её слышно с соседней клетки',!маяк.нет&&маяк.есть,маяк);

 /* ── 8. Тот же мир — та же находка ── */
 const устойчиво=await page.evaluate(()=>{
  const снять=()=>[[25003,24998],[24100,24505],[26000,25288],[23000,25288],[25777,25777]]
   .map(([x,y])=>{const f=findAt(x,y);return f?f.id:"—";}).join("|");
  const раз=снять();
  safeFn(()=>{climCache.clear();biomeCache.clear();contentCache.clear();});
  return {совпало:раз===снять(),раз};});
 check('после сброса кэшей находки те же',устойчиво.совпало,устойчиво.раз);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
