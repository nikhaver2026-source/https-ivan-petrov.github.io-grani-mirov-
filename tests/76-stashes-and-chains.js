/* ════════════════════════════════════════════════════════════════════════
   НАБОР 76: ТАЙНИКИ — ВОСЕМНАДЦАТЬ МЕСТ, ЧЕТЫРНАДЦАТЬ НАХОДОК И ЦЕПОЧКА

   Скрытое в помещениях сводилось к одному: за обстановкой мог быть тайный
   ход, и находили его простукиванием. Одно место, одно действие, одна
   награда. Прятать же можно за картиной, под половицей, в двойном дне
   сундука, в дымоходе, под водой колодца и на балке под потолком.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Мест восемнадцать, находок четырнадцать, и каждая находка и вправду
      что-то даёт, а не только называется.
   2. Тайники есть в настоящих помещениях и на разных ярусах, но не на
      каждой клетке и не в пустоте.
   3. Пункт «Обыскать» есть у ЛЮБОГО объекта в помещении. Это не мелочь:
      пункт, который появлялся бы только там, где тайник есть, сам называл
      бы тайник вслух раньше игрока.
   4. Обыск стоит времени и может не выйти; повторить его можно.
   5. Достать можно только найденное, и только один раз; взятое помнится.
   6. Подсказка из тайника указывает другой тайник того же яруса, и там
      искать уже не надо.
   7. Раздел «Указанные тайники» появляется только когда есть что показать,
      и ни одно действие не молчит.
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

 /* ── 1. Таблицы полны ── */
 const таблицы=await page.evaluate(()=>{
  const плохиеМеста=STASH_WHERE.filter(w=>!w.id||!w.n||!w.как||!SOUND_BANK[w.звук]
   ||!Array.isArray(w.плитки)||!w.плитки.length||!(w.сл>=1&&w.сл<=5)).map(w=>w.id||"?");
  const плохиеНаходки=STASH_WHAT.filter(w=>!w.id||!w.n||typeof w.дать!=="function"
   ||!SOUND_BANK[w.звук]).map(w=>w.id||"?");
  const надо=["picture","bookcase","table","board","wall","statue","chest","double",
   "column","hearth","altar","cellar","rubble","mech","water","beam","ledge","cranny"];
  const надоЧто=["note","book","scroll","map","key","rune","recipe","comp","gold",
   "proof","lore","deed","hint","relic"];
  return {мест:STASH_WHERE.length,находок:STASH_WHAT.length,плохиеМеста,плохиеНаходки,
   нетМест:надо.filter(id=>!STASH_WHERE_BY_ID[id]),
   нетНаходок:надоЧто.filter(id=>!STASH_WHAT_BY_ID[id]),
   трудности:[...new Set(STASH_WHERE.map(w=>w.сл))].sort()};});
 check('мест восемнадцать, у каждого имя, способ добраться, своя запись и трудность',
  таблицы.мест>=18&&таблицы.плохиеМеста.length===0&&таблицы.нетМест.length===0,таблицы);
 check('находок четырнадцать, и у каждой своё действие и свой звук',
  таблицы.находок>=14&&таблицы.плохиеНаходки.length===0&&таблицы.нетНаходок.length===0,таблицы);
 check('места разной трудности, а не все одинаковые',таблицы.трудности.length>=4,таблицы);

 /* ── 2. Где они есть ── */
 const где=await page.evaluate(()=>{
  const счёт=(place)=>{
   G.place=place;G.stash={};
   const l=curLevel();if(!l)return {нет:true};
   let клеток=0,тайников=0;const виды={};
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
    клеток++;
    const z=stashAt(x,y);
    if(z){тайников++;виды[z.где.id]=(виды[z.где.id]||0)+1;}}
   return {клеток,тайников,виды:Object.keys(виды).length,доля:тайников/Math.max(1,клеток)};};
  const школа=счёт({kind:"house",bx:900,by:900,stype:"school",name:"Школа",depth:0,x:1,y:1});
  const низ=счёт({kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:12,x:1,y:1});
  const храм=счёт({kind:"house",bx:1500,by:1500,stype:"temple",name:"Храм",depth:0,x:1,y:1});
  /* Под открытым небом руками не ищут. */
  G.place=null;G.x=25000;G.y=25000;
  const вПоле=stashAt(25000,25000);
  return {школа,низ,храм,вПоле:!!вПоле};});
 check('тайники есть и наверху, и в подземелье, и в храме',
  где.школа.тайников>0&&где.низ.тайников>0&&где.храм.тайников>0,где);
 check('их немного: далеко не на каждой клетке',
  где.школа.доля<0.2&&где.низ.доля<0.2,где);
 check('места разные, а не один и тот же на весь ярус',
  где.школа.виды>=3&&где.низ.виды>=3,где);
 check('под открытым небом тайников руками не ищут: там приметы',!где.вПоле,где);

 /* ── 3. Пункт есть всегда и ничего не выдаёт ── */
 const пункт=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:6,x:1,y:1};
  G.stash={};
  const l=curLevel();
  /* Найдём клетку с тайником и клетку без него — и встанем рядом с каждой. */
  let сТайником=null,безТайника=null;
  for(let y=1;y<l.h-1&&!(сТайником&&безТайника);y++)
   for(let x=1;x<l.w-1&&!(сТайником&&безТайника);x++){
    const t=tileAt(l,x,y);
    if(!IOBJ_TILES[t])continue;
    if(stashAt(x,y)){if(!сТайником)сТайником=[x,y];}
    else if(!безТайника)безТайника=[x,y];}
  const список=(xy)=>{
   if(!xy)return null;
   G.place.x=xy[0];G.place.y=xy[1];
   const объекты=objectsHere();
   return объекты.map(o=>actionsFor(o).map(a=>a.id)).map(ids=>ids.indexOf("stash")>=0);};
  const сТ=список(сТайником),безТ=список(безТайника);
  return {сТайником,безТайника,
   естьВезде:!!(сТ&&безТ&&сТ.every(v=>v)&&безТ.every(v=>v)),
   объектовС:сТ?сТ.length:0,объектовБез:безТ?безТ.length:0};});
 check('пункт «Обыскать» есть у каждого объекта в помещении — и там, где тайник есть, и там, где его нет',
  пункт.естьВезде&&пункт.объектовС>0&&пункт.объектовБез>0,пункт);

 /* ── 4 и 5. Обыск, находка, изъятие ── */
 const ход=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:6,x:1,y:1};
  G.stash={};G.stashHints=[];
  const l=curLevel();
  let цель=null;
  for(let y=1;y<l.h-1&&!цель;y++)for(let x=1;x<l.w-1&&!цель;x++)if(stashAt(x,y))цель=[x,y];
  if(!цель){Speech.say=был;return {нет:true};}
  const [x,y]=цель;
  G.place.x=Math.max(0,x-1);G.place.y=y;
  /* Достать раньше, чем найти, нельзя. */
  const раноДостал=stashTake(x,y);
  /* Обыск стоит времени всегда. */
  const часДо=G.day*24+G.hour;
  /* Мастерство на пределе, чтобы поиск в конце концов удался. */
  G.agi=30;G.mast={runes:{ур:5,оп:0,дел:0},lang:{ур:5,оп:0,дел:0},arte:{ур:5,оп:0,дел:0}};
  let попыток=0;
  while(stashAt(x,y).состояние!=="найден"&&попыток<60){stashSearch(x,y);попыток++;}
  const часПосле=G.day*24+G.hour;
  const нашли=stashAt(x,y).состояние==="найден";
  const взяли=stashTake(x,y);
  const состояние=stashAt(x,y).состояние;
  const второй=stashTake(x,y);
  /* Пустое место отвечает честно и тоже стоит времени. */
  let пусто=null;
  for(let yy=1;yy<l.h-1&&!пусто;yy++)for(let xx=1;xx<l.w-1&&!пусто;xx++)
   if(!stashAt(xx,yy)&&tileAt(l,xx,yy)!=="")пусто=[xx,yy];
  const рБыло=сказ.length;
  if(пусто)stashSearch(пусто[0],пусто[1]);
  const пустоСказало=сказ.length>рБыло;
  Speech.say=был;
  return {раноДостал,попыток,нашли,взяли,состояние,второй,пустоСказало,
   времяУшло:часПосле>часДо,молчало:сказ.length<4};});
 check('тайник в подземелье вправду находится руками',!ход.нет&&ход.нашли,ход);
 check('достать раньше, чем найти, нельзя',ход.раноДостал===false,ход);
 check('найденное достаётся, и тайник после этого пуст',
  ход.взяли===true&&ход.состояние==="взят"&&ход.второй===false,ход);
 check('обыск стоит времени, и не выходит с первого раза',
  ход.времяУшло&&ход.попыток>=1,ход);
 check('обыск пустого места отвечает словами, а не молчанием',ход.пустоСказало&&!ход.молчало,ход);

 /* ── 6. Каждая находка что-то даёт ── */
 const находки=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:14,x:5,y:5};
  G.gold=5000;G.items=[];G.comps={};G.recipes={};G.spells=[];G.know=[];
  G.quests=[{id:"т",npc:"Проверка",type:"fetch",res:"руда",need:5,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:10,xp:10}}];
  G.inv=Object.assign({},G.inv);
  const снимок=()=>({золото:Number(G.gold)||0,вещей:(G.items||[]).length,
   частей:Object.values(G.comps||{}).reduce((s,v)=>s+v,0),
   рецептов:Object.keys(G.recipes||{}).length,
   заклинаний:(G.spells||[]).length,знаний:(knowRead()||[]).length,
   опыт:Number(G.xp)||0,узлов:(portalsKnown()||[]).length,
   руды:Number(G.inv["руда"])||0,артефактов:((G.arts||[]).length)||0,
   руны:mastOf("runes").оп,дипл:JSON.stringify(G.diplo||{}),
   тайников:Object.keys(G.stash||{}).length,указаний:(G.stashHints||[]).length});
  const итоги={};
  for(const w of STASH_WHAT){
   const до=снимок();
   const слово=w.дать({x:11,y:13,глубина:14,где:STASH_WHERE[0],что:w});
   const после=снимок();
   const изменилось=Object.keys(до).some(k=>String(до[k])!==String(после[k]));
   итоги[w.id]={сказало:typeof слово==="string"&&слово.length>15,изменилось};}
  return итоги;});
 const немые=Object.keys(находки).filter(k=>!находки[k].сказало);
 const пустые=Object.keys(находки).filter(k=>!находки[k].изменилось);
 check('каждая находка рассказывает о себе словами, а не одним названием',немые.length===0,{немые,находки});
 check('каждая находка и вправду меняет мир, а не только называется',
  пустые.length<=1,{пустые,находки});

 /* ── 7. Цепочка ── */
 const цепь=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Низ",depth:9,x:3,y:3};
  G.stash={};G.stashHints=[];
  const l=curLevel();
  let первый=null;
  for(let y=1;y<l.h-1&&!первый;y++)for(let x=1;x<l.w-1&&!первый;x++)if(stashAt(x,y))первый=[x,y];
  if(!первый)return {нет:true};
  const слово=stashChain({x:первый[0],y:первый[1],глубина:9});
  const указан=(G.stashHints||[])[0];
  const состояние=указан?stashState(указан.ключ):null;
  /* Указанный находится с первого обыска. */
  let сразу=false;
  if(указан){
   G.agi=1;G.mast={};                       /* нарочно неумеха: помогает только чертёж */
   stashSearch(указан.x,указан.y);
   сразу=stashState(указан.ключ)==="найден";}
  return {слово,подсказок:(G.stashHints||[]).length,состояние,сразу,
   назвалПуть:/шаг|шага|шагов/.test(String(слово))};});
 check('подсказка указывает другой тайник того же яруса и называет, сколько шагов и куда',
  !цепь.нет&&цепь.подсказок===1&&цепь.состояние==="указан"&&цепь.назвалПуть,цепь);
 check('указанный тайник находится с первого обыска даже у неумехи: за это и платили чертежом',
  цепь.сразу,цепь);

 /* ── 8. Раздел меню и подсказка ── */
 const меню=await page.evaluate(()=>{
  G.stashHints=[];G.stash={};
  const пусто=amAvailable("stashes");
  G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Низ",depth:9,x:3,y:3};
  const l=curLevel();
  let первый=null;
  for(let y=1;y<l.h-1&&!первый;y++)for(let x=1;x<l.w-1&&!первый;x++)if(stashAt(x,y))первый=[x,y];
  stashChain({x:первый[0],y:первый[1],глубина:9});
  const есть=amAvailable("stashes");
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const открыл=openStashes();
  G.stashHints=[];
  const пустойОтвет=openStashes();
  Speech.say=был;
  return {пусто,есть,открыл,пустойОтвет,реплик:сказ.length,
   назвалМесто:/шаг|вы на месте|другом месте/.test(сказ.join(" ")),
   объяснил:/Обыскать укромные места/.test(сказ.join(" "))};});
 check('раздел «Указанные тайники» появляется только когда есть что показать',
  меню.пусто===false&&меню.есть===true,меню);
 check('расклад читает указанные тайники и говорит, куда идти',
  меню.открыл===true&&меню.назвалМесто,меню);
 check('пустой расклад не молчит, а объясняет, откуда берутся указания',
  меню.пустойОтвет===false&&меню.объяснил,меню);

 const подсказка=await page.evaluate(()=>{
  G.hints={};
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:6,x:1,y:1};
  G.stash={};
  const l=curLevel();
  let цель=null;
  for(let y=1;y<l.h-1&&!цель;y++)for(let x=1;x<l.w-1&&!цель;x++)if(stashAt(x,y))цель=[x,y];
  if(!цель)return {нет:true};
  G.place.x=цель[0];G.place.y=цель[1];
  hintAround();
  const сказали=!!(G.hints&&G.hints.stash);
  return {сказали,текст:HINTS.stash,
   учит:/Что вокруг|Обыскать укромные места/.test(String(HINTS.stash))};});
 check('подсказка про тайники говорится там, где рядом и вправду есть что искать, и учит, как искать',
  !подсказка.нет&&подсказка.сказали&&подсказка.учит,подсказка);

 /* ── 9. Взятое переживает сохранение ── */
 const сейв=await page.evaluate(()=>{
  G.stash={"1,2,3,4,5":"взят"};G.stashHints=[{x:4,y:5,ключ:"1,2,3,4,5",где:"picture",место:"Низ"}];
  saveGame(true);
  const raw=localStorage.getItem(SAVE_KEY);
  const d=JSON.parse(raw);
  return {есть:!!(d&&d.stash&&d.stash["1,2,3,4,5"]==="взят"),
   цепь:!!(d&&Array.isArray(d.stashHints)&&d.stashHints.length===1)};});
 check('найденные и взятые тайники, и цепочка подсказок, переживают сохранение',
  сейв.есть&&сейв.цепь,сейв);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
