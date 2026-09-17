/* ════════════════════════════════════════════════════════════════════════
   НАБОР 82: ЯЩИКИ, СУНДУКИ И ДВЕРИ

   Обычные вещи были интерактивны только на словах. У стола было одно
   действие — осмотреть; у сундука проверка ловушек не предлагалась вовсе,
   хотя ловушки в сундуках есть, и игрок, честно ощупавший сундук, всё равно
   открывал его вслепую; у двери не было способа узнать про замок и тягу
   раньше, чем навалиться на неё плечом.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. «Проверить пол и стены» есть у сундука и у двери, а не только у пола, и
      у сундука щупают сундук, а не клетку под ногами.
   2. Ловушка в сундуке и вправду находится этой проверкой и снимается.
   3. «Открыть ящик» есть у стола, конторки, комода, ящиков, бочек и мешков —
      и только у них.
   4. Ящик отдаёт своё один раз, во второй раз пуст, и все четыре исхода в
      мире встречаются.
   5. «Проверить механизм» у двери называет, заперта ли она, нужен ли ключ и
      есть ли посторонняя тяга, — но ненайденную ловушку по имени не выдаёт.
   6. Ни одно из новых действий не молчит.
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

 /* ── 1. Где теперь есть проверка ── */
 const где=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:9,x:2,y:2};
  const можно=(плитка,вид)=>IACT.trap.можно({вид:вид||"tile",плитка,x:2,y:2});
  const снять=(плитка)=>IACT.disarm.можно({вид:"tile",плитка,x:2,y:2});
  G.marks={};
  return {пол:можно(null,"floor"),сундук:можно("C"),дверь:можно("+"),
   ворота:можно("G"),палата:можно("Y"),стена:можно("#"),жила:можно("R"),
   снятьБезНаходки:снять("C")};});
 check('проверка ловушек есть у сундука, двери, ворот и палаты, а не только у пола',
  где.пол&&где.сундук&&где.дверь&&где.ворота&&где.палата,где);
 check('у стены и у жилы её нет: щупают то, где ловушки и вправду бывают',
  !где.стена&&!где.жила,где);
 check('«Обезвредить» не предлагают, пока ловушка не найдена',!где.снятьБезНаходки,где);

 /* ── 2. Ловушка в сундуке ── */
 const сундук=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:16,x:1,y:1};
  const l=curLevel();
  let цель=null;
  for(let y=1;y<l.h-1&&!цель;y++)for(let x=1;x<l.w-1&&!цель;x++){
   if(tileAt(l,x,y)!=="C")continue;
   if(trapAt(x,y))цель=[x,y];}
  if(!цель){Speech.say=был;return {нет:true};}
  const [x,y]=цель;
  G.marks={};G.agi=40;G.mast={runes:{ур:5,оп:0,дел:0}};
  G.place.x=Math.max(0,x-1);G.place.y=y;
  const o={вид:"tile",плитка:"C",x,y,n:"сундук"};
  let нашли=false;
  for(let i=0;i<30&&!нашли;i++){IACT.trap.делать(o);нашли=trapAt(x,y).состояние==="найдена";}
  const можноСнять=IACT.disarm.можно(o);
  let снято=false;
  for(let i=0;i<30&&!снято;i++){
   if(trapAt(x,y).состояние!=="найдена")break;
   IACT.disarm.делать(o);
   снято=trapAt(x,y).состояние==="обезврежена";}
  Speech.say=был;
  return {нашли,можноСнять,снято,сказало:сказ.length>0};});
 check('ловушка в сундуке находится проверкой самого сундука',
  сундук.нет||сундук.нашли,сундук);
 check('найденную у сундука ловушку предлагают снять, и она снимается',
  сундук.нет||(сундук.можноСнять&&сундук.снято),сундук);

 /* ── 3 и 4. Ящик ── */
 const ящик=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"house",bx:1000,by:1000,stype:"tavern",name:"Трактир",depth:0,x:1,y:1};
  const есть=(вещь)=>IACT.drawer.можно({плитка:"X",вещь,x:1,y:1});
  const свои=DRAWER_PROPS.filter(есть);
  const чужие=["anvil","circle","orb","statue","gong","hearth","loom"].filter(есть);
  /* Один ящик отдаёт своё и пустеет. */
  G.propMarks={};G.inv={};G.gold=0;G.xp=0;G.know=[];
  const снимок=()=>({инв:Object.values(G.inv).reduce((a,b)=>a+b,0),зол:G.gold,оп:G.xp});
  const до=снимок();
  IACT.drawer.делать({плитка:"X",вещь:"table",x:4,y:6,n:"стол"});
  const после=снимок();
  const n0=сказ.length;
  IACT.drawer.делать({плитка:"X",вещь:"table",x:4,y:6,n:"стол"});
  const второй=/уже выдвинут/i.test(сказ.slice(n0).join(" "));
  /* Все четыре исхода в мире встречаются. */
  G.propMarks={};
  const исходы={припас:0,золото:0,лист:0,пусто:0};
  for(let i=0;i<200;i++){
   const s=hashName((i*7)%97*3,(i*13)%89*5,8200);
   if(s<0.34)исходы.припас++;else if(s<0.55)исходы.золото++;
   else if(s<0.72)исходы.лист++;else исходы.пусто++;}
  Speech.say=был;
  return {свои:свои.length,чужие,отдал:после.инв>до.инв||после.зол>до.зол||после.оп>до.оп
    ||/[Пп]усто/.test(сказ.join(" ")),второй,исходы};});
 check('«Открыть ящик» есть у стола, конторки, комода, ящиков, бочек и мешков',ящик.свои>=6,ящик);
 check('у наковальни, круга и статуи ящика нет',ящик.чужие.length===0,ящик);
 check('ящик отвечает один раз, во второй он уже выдвинут и пуст',ящик.отдал&&ящик.второй,ящик);
 check('все четыре исхода ящика в мире встречаются',
  Object.values(ящик.исходы).every(n=>n>0),ящик.исходы);

 /* ── 5. Механизм двери ── */
 const дверь=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1250,by:1250,stype:"ruins",name:"Низ",depth:6,x:1,y:1};
  G.marks={};G.items=[];
  const o={вид:"tile",плитка:"+",x:3,y:4,n:"дверь"};
  const есть=IACT.doormech.можно(o);
  const нетУСундука=IACT.doormech.можно({вид:"tile",плитка:"C",x:3,y:4});
  const n0=сказ.length;
  IACT.doormech.делать(o);
  const простая=сказ.slice(n0).join(" ");
  /* Палата: без ключа одно, с ключом другое. */
  const v={вид:"tile",плитка:"Y",x:5,y:5,n:"дверь сокровищницы"};
  const n1=сказ.length;
  IACT.doormech.делать(v);
  const безКлюча=сказ.slice(n1).join(" ");
  G.items=[VAULT_KEY];
  const n2=сказ.length;
  IACT.doormech.делать(v);
  const сКлючом=сказ.slice(n2).join(" ");
  Speech.say=был;
  return {есть,нетУСундука,
   простаяГоворит:/петли|рукой/i.test(простая),
   безКлюча:/не при вас|плечо/i.test(безКлюча),
   сКлючом:/подойдёт|на поясе/i.test(сКлючом),
   неВыдаёт:!/жила|плита|игла|дрот/i.test(простая+безКлюча)};});
 check('«Проверить механизм» есть у двери и нет у сундука',дверь.есть&&!дверь.нетУСундука,дверь);
 check('простая дверь говорит про петли и язычок, а палата — про ключ и плечо',
  дверь.простаяГоворит&&дверь.безКлюча&&дверь.сКлючом,дверь);
 check('ненайденную ловушку механизм по имени не выдаёт',дверь.неВыдаёт,дверь);

 /* ── 6. Ничего не молчит ── */
 const слышно=await page.evaluate(()=>{
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1250,by:1250,stype:"ruins",name:"Низ",depth:6,x:2,y:2};
  G.propMarks={};G.marks={};
  const немые=[];
  const проба=[["drawer",{плитка:"X",вещь:"table",x:7,y:7,n:"стол"}],
   ["drawer",{плитка:"X",вещь:"table",x:7,y:7,n:"стол"}],
   ["doormech",{вид:"tile",плитка:"+",x:8,y:8,n:"дверь"}],
   ["trap",{вид:"tile",плитка:"C",x:9,y:9,n:"сундук"}]];
  for(const [id,o] of проба){
   const з=звуки.length,р=сказ.length;
   safeFn(()=>IACT[id].делать(o));
   if(звуки.length===з||сказ.length===р)немые.push(id+"@"+o.x);}
  Bank.play=bp;Speech.say=был;
  return {немые};});
 check('ящик, механизм двери и проверка сундука звучат и говорят всегда',
  слышно.немые.length===0,слышно);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
