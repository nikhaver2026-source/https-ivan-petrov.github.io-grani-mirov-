/* ════════════════════════════════════════════════════════════════════════
   ПОВЕРХНОСТИ, ЛЕСТНИЦЫ И ХРОНИКА МИРА

   Три вещи, добавленные разом и связанные одной мыслью: мир должен быть
   слышен не музыкой, а собой. Поверхность под ногой у каждой земли своя,
   между ярусами лежит настоящий марш, а оркестр вступает только там, где
   что-то случилось, — на повороте войны, на новом звании, на сдвиге
   отношения народа. Набор проверяет, что всё это работает, что новые
   записи действительно звучат, а не лежат мёртвым грузом, и что ни одна
   роль банка не осталась без файла.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 /* ── 1. Поверхность под ногой различает земли ── */
 const surf=await page.evaluate(()=>{
  const было={x:G.x,y:G.y,w:G.weather};
  const проба=(terr)=>{
   /* Ищем клетку нужного рельефа и встаём на неё. */
   for(let i=0;i<4000;i++){
    const x=(i*37)%WORLD,y=(i*53)%WORLD;
    if(cellContent(x,y).terrain[0]===terr){G.x=x;G.y=y;return outdoorSurface();}}
   return null;};
  G.place=null;G.ship=null;G.weather="Ясно";
  const out={};
  ["forest","plains","mountains","coast","desert","swamp"].forEach(t=>{out[t]=проба(t);});
  /* Тракт и перекрёсток: у дороги свой ответ. */
  G.x=29*4;G.y=29*4;out.перекрёсток=outdoorSurface();
  G.x=29*4;G.y=29*4+3;out.тракт=outdoorSurface();
  /* Гроза раскисает под ногами. */
  G.weather="Гроза";G.x=29*4+1;G.y=29*4+1;out.гроза=outdoorSurface();
  G.weather=было.w;G.x=было.x;G.y=было.y;
  return out;});
 check('у каждой земли своя поверхность под ногой',
  surf.forest==="leaves"&&surf.plains==="grass"&&surf.mountains==="stone"&&
  surf.coast==="sand"&&surf.desert==="sand"&&surf.swamp==="mud",surf);
 check('тракт и перекрёсток слышны иначе, чем поле',
  surf.тракт==="gravel"&&surf.перекрёсток==="stone",surf);
 check('в грозу земля раскисает',surf.гроза==="mud",surf.гроза);

 const surfIn=await page.evaluate(()=>{
  const out={};
  const проба=(stype,depth)=>{G.place={kind:depth?"dungeon":(PLACE_KIND[stype]||"house"),
   bx:600,by:600,stype,name:"Проба",depth,x:1,y:1};return indoorSurface();};
  out.храм=проба("temple",0);out.кузня=проба("forge",0);out.рынок=проба("market",0);
  out.таверна=проба("tavern",0);out.порт=проба("port",0);
  out.верх=проба("ruins",1);out.середина=проба("ruins",3);out.дно=проба("ruins",5);
  G.place=null;
  return out;});
 check('внутри поверхность зависит от постройки',
  surfIn.храм==="marble"&&surfIn.кузня==="metal"&&surfIn.рынок==="straw"&&
  surfIn.таверна==="plank"&&surfIn.порт==="bridge",surfIn);
 check('глубина слышна по шагу: щебень, кости, кристалл',
  surfIn.верх==="gravel"&&surfIn.середина==="bone"&&surfIn.дно==="crystal",surfIn);

 const surfSay=await page.evaluate(()=>{
  const плохие=[];
  Object.entries(SURF_ROLE).forEach(([k,role])=>{
   if(!SOUND_BANK[role]||!SOUND_BANK[role].f.length)плохие.push(k+"→"+role);
   if(!SURF_NAME[k])плохие.push(k+": нет имени");});
  return {плохие,имя:(G.place=null,surfaceName())};});
 check('у каждой поверхности есть и запись, и русское имя',
  !surfSay.плохие.length&&typeof surfSay.имя==="string"&&surfSay.имя.length>2,surfSay);

 /* ── 2. Лестничный марш ── */
 const flight=await page.evaluate(()=>{
  G.place=null;G.ship=null;
  enterPlace({x:600,y:600,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}});
  const l=curLevel();let sp=null;
  for(let y=0;y<l.h&&!sp;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===">"){sp={x,y};break;}
  if(!sp)return {skip:true};
  G.place.x=sp.x;G.place.y=sp.y;G.place.arm=null;
  const d0=G.place.depth;
  startFlight(1,"N");
  const марш={n:G.flight.n,i:G.flight.i,d:G.flight.d,md:G.flight.md};
  const заголовок=placeTitle();
  const осмотр=describeHere(true);
  /* Одна и та же лестница всегда одной длины. */
  const длина1=flightLen(1);const длина2=flightLen(1);
  let шагов=0;const счёт=[];
  while(G.flight&&шагов<40){счёт.push(G.flight.i);moveInside("N");шагов++;}
  return {skip:false,d0,после:G.place.depth,марш,шагов,счёт,заголовок,осмотр,
   постоянна:длина1===длина2};});
 check('марш длиной от шести до восемнадцати ступеней',
  flight.skip||(flight.марш.n>=6&&flight.марш.n<=18),flight.марш);
 check('длина одной и той же лестницы постоянна',flight.skip||flight.постоянна===true);
 check('марш проходится ступень за ступенью и приводит на ярус ниже',
  flight.skip||(flight.шагов===flight.марш.n&&flight.после===flight.d0+1),
  {шагов:flight.шагов,ступеней:flight.skip?null:flight.марш.n,было:flight.d0,стало:flight.после});
 check('на марше место называется маршем, а не этажом',
  flight.skip||/марш/i.test(flight.заголовок),flight.заголовок);
 check('осмотр на марше говорит, сколько пройдено и куда идти',
  flight.skip||(/ступен/i.test(flight.осмотр)&&/осталось/i.test(flight.осмотр)),
  flight.skip?null:String(flight.осмотр).slice(0,120));

 const back=await page.evaluate(()=>{
  G.place=null;
  enterPlace({x:600,y:600,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}});
  const l=curLevel();let sp=null;
  for(let y=0;y<l.h&&!sp;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]===">"){sp={x,y};break;}
  if(!sp)return {skip:true};
  G.place.x=sp.x;G.place.y=sp.y;
  const d0=G.place.depth;
  startFlight(1,"N");
  moveInside("N");moveInside("N");moveInside("N");
  const на=G.flight?G.flight.i:null;
  let n=0;while(G.flight&&n<40){moveInside("S");n++;}
  return {skip:false,d0,после:G.place.depth,на,шагов:n,марш:!!G.flight};});
 check('шаг в обратную сторону поднимает по маршу назад',
  back.skip||(back.на===3&&back.шагов===3&&back.марш===false&&back.после===back.d0),back);

 const noTrap=await page.evaluate(()=>{
  /* Марш не должен переживать выход наружу и смену яруса. */
  G.place=null;
  enterPlace({x:600,y:600,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}});
  G.flight={d:1,i:2,n:9,md:"N",x:1,y:1};
  leavePlace();
  const послеВыхода=G.flight;
  enterPlace({x:600,y:600,structure:{type:"ruins",name:"Древние руины",beacon:"ruins"}});
  G.flight={d:1,i:2,n:9,md:"N",x:1,y:1};
  changeDepth(1);
  return {послеВыхода,послеЯруса:G.flight};});
 check('марш не переживает выход наружу и смену яруса',
  !noTrap.послеВыхода&&!noTrap.послеЯруса,noTrap);

 /* ── 3. Хроника мира: войны, звания, репутация ── */
 /* Хроника объявляет повороты не залпом, а по очереди — с паузами, чтобы речь
    не наезжала сама на себя. Поэтому реплики собираются во времени. */
 const chronStart=await page.evaluate(()=>{
  window.__chron=[];const o=Speech.say;
  Speech.say=t=>{window.__chron.push(String(t));return o.call(Speech,t);};
  window.__chronRestore=()=>{Speech.say=o;};
  let нашли=null;
  for(let d=2;d<400&&!нашли;d++){
   const было=warKeys(d-1).join("|"),стало=warKeys(d).join("|");
   if(было!==стало)нашли={день:d,было,стало};}
  if(нашли){
   G.day=нашли.день-1;G.__warDay=undefined;G.__wars=undefined;
   warWatch();                      /* первый заход только запоминает */
   G.day=нашли.день;
   window.__chron.length=0;warWatch();}
  return нашли;});
 await page.waitForTimeout(1800);
 const chron=await page.evaluate(()=>{
  const реплики=window.__chron.slice();window.__chronRestore();
  return {реплики};});
 chron.нашли=chronStart;
 check('в мире есть день, когда война начинается или кончается',!!chron.нашли,chron.нашли);
 check('поворот войны объявляется словами',
  !chron.нашли||chron.реплики.some(t=>/Война объявлена|Замирение/.test(t)),
  chron.реплики.slice(0,2));

 const rank=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(String(t));
  const было={lvl:G.level,art:(G.artifacts||[]).slice()};
  G.level=1;G.artifacts=[];G.quests=[];G.__rank=undefined;
  renownWatch();                    /* запомнили нижнюю ступень */
  const низ=renownRank();
  G.level=40;G.artifacts=["а","б","в","г","д"];
  said.length=0;renownWatch();
  const верх=renownRank();
  const вверх=said.slice();
  said.length=0;
  G.level=1;G.artifacts=[];renownWatch();
  const вниз=said.slice();
  Speech.say=o;G.level=было.lvl;G.artifacts=было.art;
  return {низ:низ.n,верх:верх.n,ступеней:RENOWN.length,вверх,вниз,
   ростИндекса:верх.i>низ.i};});
 check('званий восемь ступеней, и они идут от безвестного к Хранителю',
  rank.ступеней===8&&rank.низ==="безвестный путник",rank);
 check('заслуги растут — растёт и звание, и об этом говорят',
  rank.ростИндекса&&rank.вверх.some(t=>/Новое звание/.test(t)),rank.вверх.slice(0,1));
 check('заслуги упали — звание понижается и это тоже слышно',
  rank.вниз.some(t=>/потускнело/.test(t)),rank.вниз.slice(0,1));

 const rep=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(String(t));
  const race=RACES[0];
  G.rep={};addRep(race,3);
  const тихо=said.slice();          /* внутри порога — без объявления */
  said.length=0;addRep(race,14);    /* перевалили в «свой» */
  const вверх=said.slice();
  said.length=0;addRep(race,-40);   /* рухнули во «враждебны» */
  const вниз=said.slice();
  Speech.say=o;
  return {race,тихо,вверх,вниз,итог:G.rep};});
 check('мелкий сдвиг отношения не объявляется словами',rep.тихо.length===0,rep.тихо);
 check('переход через порог отношения объявляется',
  rep.вверх.some(t=>/теплее/.test(t))&&rep.вниз.some(t=>/невзлюбил/.test(t)),
  {вверх:rep.вверх.slice(0,1),вниз:rep.вниз.slice(0,1)});

 /* ── 4. Новые записи звучат, а не лежат ── */
 const bank=await page.evaluate(()=>{
  const роли=Object.keys(SOUND_BANK);
  const безФайлов=роли.filter(r=>!SOUND_BANK[r].f||!SOUND_BANK[r].f.length);
  const безОписания=роли.filter(r=>!SOUND_BANK[r].d);
  /* Каждая папка со звуками должна быть названа в энциклопедии. */
  const папки=new Set(роли.map(r=>(SOUND_BANK[r].f[0]||"").split("/")[0]));
  const безРаздела=[...папки].filter(p=>p&&!BANK_CATS[p]);
  /* Новые разделы на месте. */
  const новые=["surf","blow","troop","bazaar","dark","arms","spell","beast","relic","depth","folk","mood"];
  const нетРаздела=новые.filter(k=>!BANK_CATS[k]);
  const нетРолей=новые.filter(k=>!роли.some(r=>(SOUND_BANK[r].f[0]||"").startsWith(k+"/")));
  return {ролей:роли.length,безФайлов,безОписания,безРаздела,нетРаздела,нетРолей,
   всего:soundTotals()};});
 check('у каждой роли банка есть файлы и описание',
  !bank.безФайлов.length&&!bank.безОписания.length,
  {файлы:bank.безФайлов.slice(0,4),описание:bank.безОписания.slice(0,4)});
 check('каждая папка записей названа в энциклопедии',!bank.безРаздела.length,bank.безРаздела);
 check('двенадцать новых разделов на месте и не пусты',
  !bank.нетРаздела.length&&!bank.нетРолей.length,{разделы:bank.нетРаздела,роли:bank.нетРолей});
 check('звуков в игре стало больше восьмисот',bank.всего.всего>800,bank.всего);

 const voices=await page.evaluate(()=>{
  const плохие=[];
  Object.entries(MONSTER_LAYER).forEach(([id,role])=>{
   if(!SOUND_BANK[role])плохие.push(id+"→"+role);});
  const оружие={};
  ["Меч","Топор","Лук","Копьё","Посох"].forEach(t=>{
   G.equip={weapon:{type:t,n:t}};оружие[t]=weaponVoiceRole();});
  const нетРоли=Object.values(оружие).filter(r=>!SOUND_BANK[r]);
  return {плохие,оружие,нетРоли,разных:new Set(Object.values(оружие)).size};});
 check('у каждого рода тварей есть свой второй голос, и он существует',
  !voices.плохие.length,voices.плохие);
 check('у каждого рода оружия свой голос, и голоса разные',
  !voices.нетРоли.length&&voices.разных>=4,voices.оружие);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
