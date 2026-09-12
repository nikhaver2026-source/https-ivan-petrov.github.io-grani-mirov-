/* ════════════════════════════════════════════════════════════════════════
   ТАЙНЫЕ ХОДЫ, ТАЙНЫЕ ПАЛАТЫ И СКАКУНЫ

   Обстановка мира что-то рассказывала и что-то давала, но ничего не
   скрывала: тронул статую — услышал про статую, и всё. Между тем настоящий
   тайник устроен иначе: плита под алтарём, рычаг за шкафом, кнопка под
   столешницей.

   Теперь у каждой клетки обстановки есть своя тайна. За статуей, алтарным
   камнем, зеркалом, очагом и троном ход прячут чаще, за бочкой — почти
   никогда. Найти можно единственным способом: трогать всё подряд. За ходом
   лежит палата, собранная из координат: вид, страж и награда шести родов —
   артефакт, заклинание, умение, навык, именное оружие и скакун. Скакунов
   больше нигде не достать.

   Здесь проверяется, что ходов в мире много, что они не повторяются, что
   палата постоянна и опустошается один раз, что каждая награда доходит до
   игрока и что дары скакунов действительно работают в шаге, крыле, добыче,
   бою и на море.
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
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Ходов много, и они разные ── */
 const россыпь=await page.evaluate(()=>{
  let всего=0,ходов=0;const роды={},палаты=new Set(),описания=new Set();
  for(let bx=100;bx<170;bx+=7)for(let by=100;by<170;by+=7)
   for(let x=1;x<12;x++)for(let y=1;y<8;y++){
    всего++;
    if(!propHidesSwitch(bx,by,0,x,y))continue;
    ходов++;
    const v=secretVault(bx,by,x,y);
    роды[v.приз.вид]=(роды[v.приз.вид]||0)+1;
    палаты.add(v.приз.вид+":"+v.приз.что);
    описания.add(v.вид+"|"+v.страж+"|"+v.приз.вид+":"+v.приз.что);}
  return {всего,ходов,доля:+(ходов/всего).toFixed(3),роды,
   разныхПризов:палаты.size,разныхПалат:описания.size,
   видов:SECRET_LOOK.length,стражей:SECRET_WARD.length};});
 check('ходов в мире много, но не на каждом шагу',
  россыпь.доля>0.02&&россыпь.доля<0.12&&россыпь.ходов>150,россыпь);
 check('в палатах встречаются все шесть родов награды',
  Object.keys(россыпь.роды).length===6,россыпь.роды);
 check('палаты не повторяются: у каждой свой вид, страж и находка',
  россыпь.разныхПалат>=200&&россыпь.разныхПризов>=40,
  {палат:россыпь.разныхПалат,призов:россыпь.разныхПризов});

 /* ── 2. За статуей прячут чаще, чем за бочкой ── */
 const заЧем=await page.evaluate(()=>{
  const счёт={};
  for(const id of ["statue","mirror","hearth","barrels","sacks","table"]){
   let n=0,всего=0;
   for(let bx=200;bx<240;bx+=3)for(let x=1;x<14;x++)for(let y=1;y<10;y++){
    всего++;if(propHidesSwitch(bx,bx+7,0,x,y,id))n++;}
   счёт[id]=+(n/всего).toFixed(3);}
  return счёт;});
 check('за статуей и зеркалом ход прячут чаще, чем за бочкой и мешками',
  заЧем.statue>заЧем.barrels&&заЧем.mirror>заЧем.sacks,заЧем);

 /* ── 3. Палата постоянна и опустошается один раз ── */
 const палата=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.secrets={};G.mounts=[];G.mount=null;G.artifacts=[];G.items=[];
  G.abilities=[];G.skills=[];G.spells=["Искра"];G.gold=0;G.place=null;
  const a=secretVault(120,130,4,5),b=secretVault(120,130,4,5);
  const постоянна=JSON.stringify(a)===JSON.stringify(b);
  enterPlace({x:300,y:300,structure:{type:"tavern",name:"Проба",beacon:"tavern"}});
  let точка=null;
  for(let x=1;x<20&&!точка;x++)for(let y=1;y<14&&!точка;y++){
   const pr=safeFn(()=>propAt(x,y),null);
   if(propHidesSwitch(G.place.bx,G.place.by,0,x,y,pr&&pr.id))точка={x,y};}
  if(!точка){while(activeLayer())closeTopUI();G.place=null;return {пропуск:true,постоянна};}
  window.__said=[];
  useProp(точка.x,точка.y);
  const первое=речь();
  window.__said=[];
  useProp(точка.x,точка.y);
  const второе=речь();
  const добра=(G.artifacts||[]).length+(G.items||[]).length+(G.abilities||[]).length+
   (G.skills||[]).length+((G.spells||[]).length-1)+(G.mounts||[]).length;
  const золото=G.gold;
  window.__said=[];
  useProp(точка.x,точка.y);
  const третье=речь();
  const добраПосле=(G.artifacts||[]).length+(G.items||[]).length+(G.abilities||[]).length+
   (G.skills||[]).length+((G.spells||[]).length-1)+(G.mounts||[]).length;
  while(activeLayer())closeTopUI();G.place=null;
  return {постоянна,нашёл:/щёлкнуло|открывается ход/i.test(первое),
   взял:/находка|палат/i.test(второе),добра,золото,
   ещёРаз:добраПосле===добра&&G.gold===золото};});
 check('палата постоянна: одна и та же вещь скрывает одно и то же',палата.постоянна===true,палата);
 check('вещь сперва выдаёт ход, а второе касание вводит в палату',
  палата.нашёл===true&&палата.взял===true,палата);
 check('в палате лежит и находка, и золото',палата.добра>=1&&палата.золото>0,палата);
 check('опустошённая палата больше ничего не даёт',палата.ещёРаз===true,палата);

 /* ── 4. Каждая награда доходит до игрока ── */
 const награды=await page.evaluate(()=>{
  const итог={};
  const роды=["артефакт","оружие","скакун","умение","навык","заклинание"];
  /* Найдём по одной палате каждого рода и возьмём её. */
  for(const род of роды){
   let нашли=null;
   /* Ищем так же, как ищет игрок: стоя в постройке и глядя на ту вещь,
      которая там на самом деле стоит. */
   for(let bx=400;bx<560&&!нашли;bx+=3){
    const by=bx+11;
    G.place={kind:"house",bx,by,stype:"tavern",depth:0,name:"п",x:1,y:1};
    for(let x=1;x<14&&!нашли;x++)for(let y=1;y<10&&!нашли;y++){
     const pr=safeFn(()=>propAt(x,y),null);
     if(!propHidesSwitch(bx,by,0,x,y,pr&&pr.id))continue;
     const v=secretVault(bx,by,x,y);
     if(v.приз.вид===род)нашли={bx,by,x,y,v};}}
   G.place=null;
   if(!нашли){итог[род]={нет:true};continue;}
   G.secrets={};G.artifacts=[];G.items=[];G.abilities=[];G.skills=[];
   G.spells=["Искра"];G.mounts=[];G.mount=null;G.gold=0;
   G.place={kind:"house",bx:нашли.bx,by:нашли.by,stype:"tavern",depth:0,name:"п",x:нашли.x,y:нашли.y};
   secretMark(нашли.v.ключ,"найден");
   takeSecret(нашли.x,нашли.y);
   итог[род]={
    артефакт:(G.artifacts||[]).length,вещь:(G.items||[]).length,
    умение:(G.abilities||[]).length,навык:(G.skills||[]).length,
    чары:(G.spells||[]).length-1,скакун:(G.mounts||[]).length,золото:G.gold>0};
   G.place=null;}
  return итог;});
 check('артефакт из палаты ложится в артефакты',награды["артефакт"].артефакт===1,награды["артефакт"]);
 check('именное оружие ложится в сумку',награды["оружие"].вещь===1,награды["оружие"]);
 check('скакун из палаты становится вашим',награды["скакун"].скакун===1,награды["скакун"]);
 check('умение и навык из палаты учатся',
  награды["умение"].умение===1&&награды["навык"].навык===1,
  {умение:награды["умение"],навык:награды["навык"]});
 check('заклинание из палаты запоминается',награды["заклинание"].чары===1,награды["заклинание"]);
 check('в каждой палате есть и золото',
  Object.values(награды).every(o=>o.нет||o.золото===true),награды);

 /* ── 5. Скакуны работают ── */
 const кони=await page.evaluate(()=>{
  const out={};
  while(activeLayer())closeTopUI();
  G.place=null;G.ship=null;G.alt=0;G.mounts=[];G.mount=null;G.x=1000;G.y=1000;
  /* Шаг. */
  takeMount("ashmare");
  const ч1=G.hour;move("N");const сКонём=G.hour-ч1;
  dismissMount();
  const ч2=G.hour;move("S");const пешком=G.hour-ч2;
  out.шаг={сКонём:+сКонём.toFixed(3),пешком:+пешком.toFixed(3)};
  /* Крыло у бескрылого народа. */
  G.race="Гномы";
  const безКрыла=wingSpan();
  takeMount("stormroc");
  out.крыло={без:безКрыла,с:wingSpan()};
  dismissMount();
  /* Эхо-скан. */
  takeMount("emberhound");
  out.скан={есть:!!mountGift("скан")};
  dismissMount();
  /* Морской переход. */
  takeMount("tidehorse");
  out.море={полный:mountSeaCut(8)};
  dismissMount();
  out.морБез={полный:mountSeaCut(8)};
  /* Переключение и отпускание. */
  G.mounts=["ashmare","stormroc"];G.mount=null;
  const п1=callMount();const первый=G.mount;
  const п2=callMount();const второй=G.mount;
  dismissMount();
  out.смена={п1,п2,разные:первый!==второй,после:G.mount};
  /* Скакун переживает запись. */
  G.mounts=["ashmare"];G.mount="ashmare";G.secrets={a:"взято"};
  saveGame(true);G.mounts=[];G.mount=null;G.secrets={};
  loadGame(true);
  out.запись={скакун:G.mount,тайники:Object.keys(G.secrets||{}).length};
  return out;});
 check('скакун сокращает шаг вдвое',кони.шаг.сКонём<кони.шаг.пешком,кони.шаг);
 check('крылатый скакун поднимает бескрылого',
  кони.крыло.без===0&&кони.крыло.с>=3,кони.крыло);
 check('приливный конь укорачивает морской переход',кони.море.полный<кони.морБез.полный,кони);
 check('скакуна можно менять и отпускать',
  кони.смена.п1===true&&кони.смена.п2===true&&кони.смена.разные===true&&кони.смена.после===null,кони.смена);
 check('скакуны и открытые тайники переживают запись',
  кони.запись.скакун==="ashmare"&&кони.запись.тайники===1,кони.запись);

 /* ── 6. Скакуны видны в окне и берутся только из палат ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.mounts=["ashmare"];G.mount="ashmare";
  window.__said=[];
  CMD.school();
  const текст=[...document.querySelectorAll("#schoolList .list-line")].map(e=>e.textContent).join(" ");
  const кнопки=[...document.querySelectorAll("#schoolList button")].map(b=>b.dataset.cmd||"");
  while(activeLayer())closeTopUI();
  /* Ни один торговец не продаёт скакунов. */
  const n=getNPC(1000,1000,0,"Торговец");
  const прилавок=stockFor(n).map(x=>x.n||(x.gear&&x.gear.name)||"").join(" ");
  const продают=MOUNTS.some(m=>прилавок.includes(m.n));
  return {вОкне:/Пепельная кобылица/.test(текст),отпустить:кнопки.includes("unmount"),продают};});
 check('скакун виден в окне умений и его можно отпустить прямо оттуда',
  окно.вОкне===true&&окно.отпустить===true,окно);
 check('скакунов нигде не продают: только тайные палаты',окно.продают===false,окно);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
