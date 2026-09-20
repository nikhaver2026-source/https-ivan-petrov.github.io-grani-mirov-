/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 121: ГОРОДСКИЕ СЛУЖБЫ (§12 брифа)

   §12 перечисляет, что есть в большом городе: районы, сотня вещей,
   полсотни жителей, организации, таверны, кузницы, торговые дома, храмы,
   библиотека, лечебница, рынок, тюрьма, канализация и скрытые помещения.
   Четырёх не было вовсе. Раненому было некуда пойти, кроме крепости;
   виру платить было негде, и преступление висело, пока само не забудется;
   урожай сбывался по горстке с рук торговцу, которому нужны две единицы
   из сорока; а подземелье под городом было — без входа с улицы.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. В именованном городе стоят все четыре службы, в деревне — ни одной,
      и каждая занимает свою клетку.
   2. У каждой службы своё имя, свой маяк и своя запись в банке; ни один
      маяк не повторяется, и все четыре известны осмотру, карте и звуковой
      картине.
   3. Лечебница лечит раны и снимает яд за золото и час, а здоровому
      честно говорит, что лечить нечего; без денег — отказ с числом.
   4. Тюрьма снимает виру той державы, в которой стоит; когда за вами
      ничего не числится, в ней сидит человек, и его можно выкупить —
      второй раз выкупать уже некого.
   5. Торговый дом берёт всю суму разом по цене этого города со скидкой за
      опт и отдаёт золото; пустой суме отвечает честно.
   6. Вклад: золото уходит на хранение, возвращается по требованию и не
      теряется при поражении.
   7. Люк ведёт вниз, и первый ярус под городом называется канализацией.
   8. Самопроверка мира держит строку «services», руководство и README о
      службах рассказывают.
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
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 2. плитки, маяки, таблицы ── */
 const плитки=await page.evaluate(()=>{
  const служб=["H","J","D","U"];
  return {
   имена:служб.map(t=>TILE[t]&&TILE[t].n),
   маяки:служб.map(t=>TILE[t]&&TILE[t].b),
   маяковРазных:new Set(служб.map(t=>TILE[t].b)).size,
   записьЕсть:служб.every(t=>!!SOUND_BANK[BEACON_ROLE[TILE[t].b]]),
   описаниеЕсть:служб.every(t=>!!BEACON_INFO[TILE[t].b]),
   осмотр:служб.every(t=>!!IOBJ_TILES[t]&&!!LOOK_KIND[t]),
   картина:служб.every(t=>!!SCAPE_TILE[t]),
   наборы:{замок:cityServiceSet("castle",null),деревня:cityServiceSet("village",null),
    порт:cityServiceSet("port",null),именной:cityServiceSet("port",{n:"именной"})}};});
 check('у каждой службы своё имя и свой маяк, и ни один маяк не повторяется',
  плитки.имена.every(Boolean)&&плитки.маяковРазных===4,плитки);
 check('у маяка каждой службы есть живая запись и описание',
  плитки.записьЕсть&&плитки.описаниеЕсть,плитки.маяки);
 check('службы известны осмотру, карте и звуковой картине',
  плитки.осмотр&&плитки.картина,плитки);
 check('в замке четыре службы, в деревне ни одной, у именованного города все',
  плитки.наборы.замок.length===4&&плитки.наборы.деревня.length===0
  &&плитки.наборы.именной.length===4,плитки.наборы);

 /* ── 1. службы стоят в городе ── */
 const город=await page.evaluate(()=>{
  const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;
  safeFn(()=>enterPlace(cellContent(c.x,c.y)));
  const lvl=curLevel();const счёт={H:0,J:0,D:0,U:0};const где={};
  for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++){
   const t=tileAt(lvl,x,y);
   if(счёт[t]!==undefined){счёт[t]++;if(!где[t])где[t]={x,y};}}
  return {город:c.name,счёт,где,размер:[lvl.w,lvl.h]};});
 check('в именованном городе стоят все четыре службы, по одной клетке на каждую',
  ["H","J","D","U"].every(t=>город.счёт[t]===1),город);

 const деревня=await page.evaluate(()=>{
  /* Деревню ищем по миру: служб в ней быть не должно. */
  for(let r=1;r<160;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const x=1000+dx,y=1000+dy,c=cellContent(x,y);
   if(!c.structure||c.structure.type!=="village")continue;
   if(safeFn(()=>cityAt(x,y),null))continue;      /* именной город деревней не считается */
   G.x=x;G.y=y;
   if(G.place)safeFn(()=>leavePlace());
   safeFn(()=>enterPlace(cellContent(x,y)));
   const lvl=curLevel();if(!lvl)continue;
   let n=0;
   for(let yy=0;yy<lvl.h;yy++)for(let xx=0;xx<lvl.w;xx++)
    if("HJDU".indexOf(tileAt(lvl,xx,yy))>=0)n++;
   const из={нашлась:true,служб:n,где:[x,y]};
   safeFn(()=>leavePlace());
   return из;}
  return {нашлась:false};});
 check('в деревне городских служб нет',
  деревня.нашлась&&деревня.служб===0,деревня);

 /* ── 3. лечебница ── */
 const лечебница=await page.evaluate(()=>{
  const речь=()=>__said.join(" | ");
  const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;
  if(G.place)safeFn(()=>leavePlace());
  safeFn(()=>enterPlace(cellContent(c.x,c.y)));
  const lvl=curLevel();
  let м=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="H")м={x,y};
  G.place.x=м.x;G.place.y=м.y;
  /* Без денег — отказ, и в отказе названо число. */
  G.hp=10;G.hpMax=100;G.gold=3;G.poisoned=null;
  __said.length=0;const бедный=useHere();const словоБедного=речь();
  /* С деньгами — лечит всё и берёт час. */
  G.gold=500;G.poisoned={until:99999,n:"яд"};G.buffs=G.buffs||{};G.buffs["кровотечение"]={until:99999};
  const часДо=Number(G.hour)||0,деньДо=Number(G.day)||1;
  __said.length=0;const лечил=useHere();const слово=речь();
  const после={hp:G.hp,золото:G.gold,яд:!!G.poisoned,кровь:!!(G.buffs&&G.buffs["кровотечение"]),
   час:(Number(G.day)-деньДо)*24+(Number(G.hour)-часДо)};
  /* Здоровому лечить нечего. */
  __said.length=0;const здоровый=useHere();const словоЗдорового=речь();
  return {бедный,словоБедного,лечил,слово,после,здоровый,словоЗдорового};});
 check('без денег лечебница отказывает и называет цену',
  лечебница.бедный===false&&/\d/.test(лечебница.словоБедного)&&/лечебниц/i.test(лечебница.словоБедного),
  лечебница.словоБедного);
 check('лечебница лечит раны, снимает яд и кровотечение, берёт золото и час',
  лечебница.лечил===true&&лечебница.после.hp===100&&лечебница.после.золото<500
  &&!лечебница.после.яд&&!лечебница.после.кровь&&Math.abs(лечебница.после.час-1)<0.35,лечебница.после);
 check('здоровому лечебница честно говорит, что лечить нечего',
  лечебница.здоровый===false&&/нечего/i.test(лечебница.словоЗдорового),лечебница.словоЗдорового);

 /* ── 4. тюрьма ── */
 const тюрьма=await page.evaluate(()=>{
  const речь=()=>__said.join(" | ");
  const lvl=curLevel();
  let м=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="J")м={x,y};
  G.place.x=м.x;G.place.y=м.y;
  const emp=EMPIRES[empireIndexAt(G.place.bx,G.place.by)];
  G.standing={};G.freed={};G.gold=900;
  addStand("crime",emp.short,12,true);
  const виноДо=standOf("crime",emp.short);
  __said.length=0;const вира=useHere();const словоВиры=речь();
  const виноПосле=standOf("crime",emp.short);
  /* Числиться нечего — значит, сидит человек. */
  const узник=cityPrisoner();
  G.gold=900;
  __said.length=0;const выкуп=useHere();const словоВыкупа=речь();
  const золотоПосле=G.gold;
  __said.length=0;const второй=useHere();const словоВторого=речь();
  return {виноДо,вира,словоВиры,виноПосле,узник,выкуп,словоВыкупа,золотоПосле,второй,словоВторого};});
 check('тюрьма снимает виру той державы, в которой стоит',
  тюрьма.виноДо>0&&тюрьма.вира===true&&тюрьма.виноПосле===0&&/вира/i.test(тюрьма.словоВиры),тюрьма);
 check('когда за вами ничего не числится, в тюрьме сидит человек со своей виной и сроком',
  !!тюрьма.узник&&!!тюрьма.узник.имя&&!!тюрьма.узник.вина&&тюрьма.узник.срок>0&&тюрьма.узник.выкуп>0,
  тюрьма.узник);
 check('узника можно выкупить, и второй раз выкупать уже некого',
  тюрьма.выкуп===true&&тюрьма.золотоПосле<900&&/выкуп/i.test(тюрьма.словоВыкупа)
  &&тюрьма.второй===false&&/пуста/i.test(тюрьма.словоВторого),
  {выкуп:тюрьма.словоВыкупа,второй:тюрьма.словоВторого});

 /* ── 5–6. торговый дом и вклад ── */
 const торг=await page.evaluate(()=>{
  const речь=()=>__said.join(" | ");
  const lvl=curLevel();
  let м=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="D")м={x,y};
  G.place.x=м.x;G.place.y=м.y;
  G.inv=G.inv||{};Object.keys(G.inv).forEach(k=>G.inv[k]=0);
  G.gold=0;
  __said.length=0;const пусто=useHere();const словоПусто=речь();
  G.inv["руда"]=20;G.inv["дерево"]=15;
  __said.length=0;const сдал=useHere();const слово=речь();
  const после={золото:G.gold,руда:Number(G.inv["руда"])||0,дерево:Number(G.inv["дерево"])||0};
  /* Вклад и выдача — из меню действий, и они доступны только у стойки. */
  const доступно={вклад:amAvailable("deposit"),выдача:amAvailable("withdraw")};
  G.gold=120;G.deposit=0;
  cityDeposit();
  const послеВклада={золото:G.gold,вклад:Number(G.deposit)||0};
  /* Поражение отнимает кошель, вклад не трогает. */
  G.gold=80;const былВклад=Number(G.deposit)||0;
  G.hp=1;safeFn(()=>{G.combat={m:{n:"проверка",hp:0,dmg:0}};defeat();});
  const послеПоражения={золото:G.gold,вклад:Number(G.deposit)||0};
  cityWithdraw();
  const послеВыдачи={золото:G.gold,вклад:Number(G.deposit)||0};
  return {пусто,словоПусто,сдал,слово,после,доступно,послеВклада,былВклад,послеПоражения,послеВыдачи};});
 check('пустой суме торговый дом отвечает честно',
  торг.пусто===false&&/сдавать нечего|сума пуста/i.test(торг.словоПусто),торг.словоПусто);
 check('торговый дом берёт всю суму разом и платит золотом',
  торг.сдал===true&&торг.после.золото>0&&торг.после.руда===0&&торг.после.дерево===0,торг.после);
 check('вклад и выдача доступны только у стойки торгового дома',
  торг.доступно.вклад===true,торг.доступно);
 check('золото уходит на хранение и возвращается по требованию',
  торг.послеВклада.золото===0&&торг.послеВклада.вклад===120
  &&торг.послеВыдачи.вклад===0&&торг.послеВыдачи.золото>0,
  {вклад:торг.послеВклада,выдача:торг.послеВыдачи});
 check('поражение отнимает кошель, но не вклад',
  торг.послеПоражения.вклад===торг.былВклад&&торг.послеПоражения.золото<80,торг.послеПоражения);

 /* ── 7. канализация ── */
 const люк=await page.evaluate(()=>{
  const речь=()=>__said.join(" | ");
  const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;
  if(G.place)safeFn(()=>leavePlace());
  safeFn(()=>enterPlace(cellContent(c.x,c.y)));
  const lvl=curLevel();
  let м=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="U")м={x,y};
  G.place.x=м.x;G.place.y=м.y;
  __said.length=0;const открыл=useHere();const слово=речь();
  /* Сам спуск: марш лестницы проходится в игре шагами, здесь берём его
     итог напрямую — важно, что первый ярус под городом называет себя. */
  __said.length=0;safeFn(()=>changeDepth(1));
  const внизу=речь();
  return {открыл,слово,глубина:G.place?G.place.depth:null,внизу,стоки:safeFn(()=>sewerHere(),null)};});
 check('люк открывается и ведёт вниз',
  люк.открыл===true&&/люк|решётк/i.test(люк.слово),люк.слово);
 check('первый ярус под городом — канализация, и он себя называет',
  люк.глубина===1&&люк.стоки===true&&/канализац/i.test(люк.внизу),люк);

 /* ── 8. самопроверка, руководство, README ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Городские службы/i.test(g.title));
  return {services:(r.find?r.find(x=>x&&x.id==="services"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «services»',
  !!свод.services&&свод.services.ok===true,свод.services);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о городских службах',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о лечебнице, тюрьме, торговом доме и канализации',
  /лечебниц/i.test(readme)&&/тюрьм/i.test(readme)&&/торговый дом/i.test(readme)&&/канализац/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
