/* ════════════════════════════════════════════════════════════════════════
   НАБОР 64: ПРИМЕТЫ И КЛАДЫ — ТАЙНА В НЕСКОЛЬКО ШАГОВ

   Тайные ходы за обстановкой были одношаговы: тронул статую — открылся ход,
   вошёл — взял. Всё на одной клетке, и искать нечего, кроме как трогать всё
   подряд.

   У приметы четыре ступени: найти на находке, прочесть, дойти до места и
   выполнить условие. Здесь проверяется каждая, и отдельно — что ступени не
   схлопываются: до клада нельзя дойти без приметы, и нельзя взять его, не
   выполнив условия.

   Ещё здесь проверяется то, ради чего выдача награды была вынесена из тайной
   палаты в общее место: клад и палата дают одно и то же одним и тем же кодом.
   Два одинаковых разбора рядом — это не две возможности, а два места, где
   заводятся расхождения.
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

 /* ── 1. Условия и общая выдача на месте ── */
 const основы=await page.evaluate(()=>{
  const плохие=[];
  for(const c of SIGN_COND){
   if(!c.id||!c.о||!c.надо||typeof c.ок!=="function")плохие.push(c.id||"?");}
  return {условий:SIGN_COND.length,плохие,
   выдача:typeof grantPrize==="function",
   предел:SIGN_LIMIT,
   источников:SIGN_SOURCES.filter(id=>FINDS.some(f=>f.id===id)).length,
   чужие:SIGN_SOURCES.filter(id=>!FINDS.some(f=>f.id===id))};});
 check('условий не меньше восьми, и у каждого есть проверка и объяснение',
  основы.условий>=8&&основы.плохие.length===0,основы);
 check('выдача награды одна на весь мир, а не переписана заново',основы.выдача,основы);
 check('приметы находят на настоящих находках, а не на выдуманных',
  основы.источников>=5&&основы.чужие.length===0,основы);

 /* ── 2. Примета выводится из клетки и всегда одна и та же ── */
 const устойчиво=await page.evaluate(()=>{
  const O=25000;
  const снять=()=>[[25101,24903],[24500,25500],[25900,25100]]
   .map(([x,y])=>{const z=signAt(x,y);
    return z?`${z.цель.x},${z.цель.y}|${z.усл}|${z.род}`:"—";}).join("#");
  const раз=снять();
  safeFn(()=>{climCache.clear();biomeCache.clear();contentCache.clear();});
  return {совпало:раз===снять(),раз};});
 check('одна и та же клетка помнит одну и ту же примету',устойчиво.совпало,устойчиво.раз);

 /* ── 3. Место приметы отстоит на полсотни-две сотни шагов и помечено находкой ── */
 const место=await page.evaluate(()=>{
  const O=25000;const пробы=[];
  for(let i=0;i<60;i++){
   const x=O+((i*137)%900)-450,y=O+((i*211)%900)-450;
   const z=safeFn(()=>signAt(x,y),null);
   if(!z)continue;
   const c=cellContent(z.цель.x,z.цель.y);
   пробы.push({д:Math.max(Math.abs(z.цель.x-x),Math.abs(z.цель.y-y)),
    метка:!!c.находка,совпалоИмя:!!c.находка&&c.находка.id===z.цель.метка,
    есть:!!z.текст&&/шаг|шага|шагов/.test(z.текст)});}
  return {проб:пробы.length,
   безМетки:пробы.filter(p=>!p.метка).length,
   имяНеТо:пробы.filter(p=>!p.совпалоИмя).length,
   близко:пробы.filter(p=>p.д<30).length,
   далеко:пробы.filter(p=>p.д>260).length,
   безТекста:пробы.filter(p=>!p.есть).length,
   среднее:Math.round(пробы.reduce((s,p)=>s+p.д,0)/Math.max(1,пробы.length))};});
 check('примета всегда показывает на клетку, где стоит находка-метка',
  место.проб>=20&&место.безМетки===0&&место.имяНеТо===0,место);
 check('место не под ногами и не на краю света',
  место.близко===0&&место.далеко===0,место);
 check('примета названа словами, а не координатами',место.безТекста===0,место);

 /* ── 4. Примету находят на находке, и не чаще, чем задумано ── */
 const находим=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.signs=[];G.finds={};
  let источников=0,примет=0;
  for(let x=O-90;x<O+90&&примет<3;x++)for(let y=O-90;y<O+90&&примет<3;y++){
   const c=cellContent(x,y);
   if(!c.находка||SIGN_SOURCES.indexOf(c.находка.id)<0)continue;
   источников++;
   G.x=x;G.y=y;
   const было=(G.signs||[]).length;
   useFind(x,y);
   if((G.signs||[]).length>было)примет++;}
  return {источников,примет,всего:(G.signs||[]).length,
   предел:signsOpen().length<=SIGN_LIMIT};});
 check('примета и вправду находится на находках мира',
  находим.источников>0&&находим.примет>0,находим);
 check('неразгаданных примет не больше предела',находим.предел,находим);

 /* ── 5. Клад не берётся без приметы ── */
 const безПриметы=await page.evaluate(()=>{
  const O=25000;
  G.signs=[];G.finds={};G.dark=false;G.place=null;
  /* Берём место чьей-то приметы, но саму примету не подбираем. */
  let цель=null;
  for(let i=0;i<200&&!цель;i++){
   const x=O+((i*137)%900)-450,y=O+((i*211)%900)-450;
   const z=safeFn(()=>signAt(x,y),null);
   if(z)цель=z.цель;}
  if(!цель)return {нет:true};
  G.x=цель.x;G.y=цель.y;
  const золото=G.gold;
  const есть=!!signHere(цель.x,цель.y);
  const взял=safeFn(()=>takeTreasure(цель.x,цель.y),false);
  return {цель,есть,взял,золотоТоЖе:G.gold===золото};});
 check('на месте клада без приметы клада нет',
  !безПриметы.нет&&безПриметы.есть===false&&безПриметы.взял===false
  &&безПриметы.золотоТоЖе,безПриметы);

 /* ── 6. Условие: не выполнено — не отдают; выполнено — отдают ── */
 const условие=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.finds={};
  /* Берём примету с ночным условием: его легко и не выполнить, и выполнить. */
  let z=null;
  for(let i=0;i<1200&&!z;i++){
   const x=O+((i*137)%3000)-1500,y=O+((i*211)%3000)-1500;
   const п=safeFn(()=>signAt(x,y),null);
   if(п&&п.усл==="night"&&п.род!=="примета")z=п;}
  if(!z)return {нет:true};
  G.signs=[z];
  G.x=z.цель.x;G.y=z.цель.y;
  G.hour=12;  /* день */
  const золото0=G.gold;
  const днём=safeFn(()=>takeTreasure(G.x,G.y),false);
  const послеДня={золото:G.gold,готово:!!z.готово};
  G.hour=1;   /* ночь */
  const ночью=safeFn(()=>takeTreasure(G.x,G.y),false);
  const послеНочи={золото:G.gold,готово:!!z.готово};
  /* Второй раз тот же клад не отдаётся. */
  const ещёРаз=safeFn(()=>takeTreasure(G.x,G.y),false);
  return {усл:z.усл,род:z.род,золото0,днём,ночью,послеДня,послеНочи,ещёРаз,
   второйРаз:G.gold===послеНочи.золото};});
 check('днём ночной клад не отдаётся, и золото не трогают',
  !условие.нет&&условие.послеДня.золото===условие.золото0
  &&условие.послеДня.готово===false,условие);
 check('ночью тот же клад отдаётся',
  !условие.нет&&условие.послеНочи.золото>условие.золото0
  &&условие.послеНочи.готово===true,условие);
 check('взятый клад второй раз не отдаётся',
  !условие.нет&&условие.второйРаз,условие);

 /* ── 7. Награда настоящая: артефакт, умение, навык, чары, оружие, скакун ── */
 /* Условий девять, и половина из них исключает другую половину: ночь спорит
    с днём, снег с летом. Первая сборка замера ставила ночь и ливень разом и
    объявила артефакт «не отдающимся», хотя его примета требовала дня. Мир
    приводится в нужное состояние ПО САМОЙ ПРИМЕТЕ, а не наугад. */
 await page.evaluate(()=>{window.__подготовить=(усл)=>{
  G.gold=5000;G.inv=Object.assign({},G.inv,{кость:5,кристалл:5});
  G.hour=1;G.weather="Ясно";G.day=10;
  if(усл==="day")G.hour=12;
  if(усл==="rain")G.weather="Ливень";
  if(усл==="snow")G.weather="Метель";
  if(усл==="winter")G.day=SEASON_DAYS*3+2;
  if(усл==="summer")G.day=SEASON_DAYS*1+2;};});
 const награда=await page.evaluate(()=>{
  const O=25000;const роды={};const итоги=[];
  for(let i=0;i<900&&Object.keys(роды).length<7;i++){
   const x=O+((i*137)%4000)-2000,y=O+((i*211)%4000)-2000;
   const z=safeFn(()=>signAt(x,y),null);
   if(!z||роды[z.род])continue;
   роды[z.род]=1;
   G.dark=false;G.place=null;G.ship=null;G.signs=[z];
   G.x=z.цель.x;G.y=z.цель.y;
   window.__подготовить(z.усл);
   /* Пустые сумы: иначе «уже знаете это заклинание» сошло бы за отсутствие
      награды — начальная Искра выпадает из списка чар как раз первой. */
   G.spells=[];G.skills=[];G.abilities=[];G.mounts=[];G.items=[];G.artifacts=[];
   const ключиДо=signsOpen().map(o=>o.ключ).join("|");
   const до={арт:(G.artifacts||[]).length,умений:(G.abilities||[]).length,
    навыков:(G.skills||[]).length,чар:(G.spells||[]).length,
    вещей:(G.items||[]).length,коней:(G.mounts||[]).length,
    примет:signsOpen().length,золото:G.gold};
   takeTreasure(G.x,G.y);
   const ключиПосле=signsOpen().map(o=>o.ключ).join("|");
   /* Взятая примета закрывается, новая открывается — число не меняется.
      Поэтому цепочка считается по ключам, а не по счёту. */
   const новаяПримета=ключиПосле!==""&&ключиПосле!==ключиДо;
   const после={арт:(G.artifacts||[]).length,умений:(G.abilities||[]).length,
    навыков:(G.skills||[]).length,чар:(G.spells||[]).length,
    вещей:(G.items||[]).length,коней:(G.mounts||[]).length,
    примет:signsOpen().length,золото:G.gold};
   итоги.push({род:z.род,взято:z.готово===true,золотоРосло:после.золото>до.золото,
    чтоТо:после.арт>до.арт||после.умений>до.умений||после.навыков>до.навыков
     ||после.чар>до.чар||после.вещей>до.вещей||после.коней>до.коней
     ||новаяПримета,
    числа:Number.isFinite(после.золото)});}
  return {родов:Object.keys(роды),итоги,
   неВзято:итоги.filter(o=>!o.взято).map(o=>o.род),
   безЗолота:итоги.filter(o=>!o.золотоРосло).map(o=>o.род),
   безНичего:итоги.filter(o=>!o.чтоТо).map(o=>o.род),
   безЧисел:итоги.filter(o=>!o.числа).map(o=>o.род)};});
 check('встречаются все семь родов награды',награда.родов.length>=6,награда.родов);
 check('каждый клад отдаётся и прибавляет золота',
  награда.неВзято.length===0&&награда.безЗолота.length===0,награда);
 check('и каждый даёт что-то сверх золота — вещь, умение, чары или новую примету',
  награда.безНичего.length===0,награда.безНичего);
 check('кошелёк после каждого клада остался числом',награда.безЧисел.length===0,награда);

 /* ── 8. Цепочка: в кладе бывает следующая примета ── */
 const цепочка=await page.evaluate(()=>{
  const O=25000;let z=null;
  for(let i=0;i<1200&&!z;i++){
   const x=O+((i*137)%4000)-2000,y=O+((i*211)%4000)-2000;
   const п=safeFn(()=>signAt(x,y),null);
   if(п&&п.род==="примета")z=п;}
  if(!z)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.signs=[z];
  G.x=z.цель.x;G.y=z.цель.y;
  window.__подготовить(z.усл);
  const ключДо=z.ключ;
  takeTreasure(G.x,G.y);
  const открыты=signsOpen();
  const новая=открыты[0]||null;
  return {взято:z.готово===true,открытых:открыты.length,
   цепь:!!новая&&новая.ключ!==ключДо,
   новаяВедётИнуда:!!новая&&(новая.цель.x!==z.цель.x||новая.цель.y!==z.цель.y)};});
 check('клад с приметой внутри продолжает цепочку',
  цепочка.нет||цепочка.цепь,цепочка);
 check('и следующая примета ведёт в другое место',
  цепочка.нет||цепочка.новаяВедётИнуда,цепочка);

 /* ── 9. Расклад по приметам говорит сторону, расстояние и условие ── */
 const расклад=await page.evaluate(()=>{
  const O=25000;let z=null;
  for(let i=0;i<600&&!z;i++){
   const x=O+((i*137)%900)-450,y=O+((i*211)%900)-450;
   z=safeFn(()=>signAt(x,y),null);}
  if(!z)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.signs=[z];G.x=O;G.y=O;
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  openSigns();
  G.signs=[];
  openSigns();
  Speech.say=say;
  return {сПриметой:реплики[0]||"",без:реплики[1]||"",
   доступно:amAvailable("signs")};});
 check('расклад по приметам называет сторону, расстояние и условие',
  !расклад.нет&&/шаг/.test(расклад.сПриметой)&&/Условие/.test(расклад.сПриметой)
  &&/север|юг|восток|запад|на месте/.test(расклад.сПриметой),
  {строка:(расклад.сПриметой||"").slice(0,240)});
 check('без примет расклад объясняет, где их искать',
  !расклад.нет&&/кострищ|столб|тур|тайник/.test(расклад.без),
  {строка:(расклад.без||"").slice(0,200)});
 check('пункт «Приметы и клады» доступен под открытым небом',
  !расклад.нет&&расклад.доступно===true,расклад);

 /* ── 10. Приметы переживают сохранение ── */
 const сейв=await page.evaluate(()=>{
  const O=25000;let z=null;
  for(let i=0;i<600&&!z;i++){
   const x=O+((i*137)%900)-450,y=O+((i*211)%900)-450;
   z=safeFn(()=>signAt(x,y),null);}
  if(!z)return {нет:true};
  G.signs=[z];
  const raw=serializeSave();
  G.signs=[];
  Object.assign(G,JSON.parse(raw));
  const после=signsOpen();
  return {было:1,стало:после.length,
   тоЖеМесто:после.length===1&&после[0].цель.x===z.цель.x&&после[0].цель.y===z.цель.y};});
 check('примета переживает сохранение и загрузку',!сейв.нет&&сейв.тоЖеМесто,сейв);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
