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

 /* Пол внутри — не одна поверхность на всё место, а СМЕСЬ: у каждого вида
    построек и у каждой глубины своя, а какая под ногой именно здесь, решают
    координаты клетки. Прежде тут проверялось одно значение на постройку, и
    три разных подвала звучали совершенно одинаково. Теперь проверяется то,
    что и должно: смесь узнаваема (в ней есть подпись места), места
    различаются между собой, и внутри одного места пол не однообразен. */
 const surfIn=await page.evaluate(()=>{
  const набор=(stype,depth)=>{
   G.place={kind:depth?"dungeon":(PLACE_KIND[stype]||"house"),
    bx:600,by:600,stype,name:"Проба",depth,x:1,y:1};
   const s=new Set();
   for(let x=1;x<18;x++)for(let y=1;y<12;y++){G.place.x=x;G.place.y=y;s.add(indoorSurface());}
   return [...s].sort();};
  const out={храм:набор("temple",0),кузня:набор("forge",0),рынок:набор("market",0),
   таверна:набор("tavern",0),порт:набор("port",0),
   верх:набор("ruins",1),середина:набор("ruins",3),дно:набор("ruins",5)};
  /* Два разных подвала одной глубины раскладывают смесь по-своему. */
  const ряд=(bx,by)=>{G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:1,y:1};
   const r=[];for(let x=1;x<14;x++){G.place.x=x;G.place.y=5;r.push(indoorSurface());}return r.join(",");};
  out.подвалА=ряд(1,1);out.подвалБ=ряд(9,2);
  G.place=null;
  return out;});
 check('пол внутри узнаётся по смеси: у каждой постройки своя подпись',
  surfIn.храм.includes("marble")&&surfIn.кузня.includes("metal")&&
  surfIn.рынок.includes("straw")&&surfIn.таверна.includes("plank")&&
  surfIn.порт.includes("bridge"),surfIn);
 check('разные постройки различаются полом, а не звучат одинаково',
  new Set([surfIn.храм.join(),surfIn.кузня.join(),surfIn.рынок.join(),
   surfIn.таверна.join(),surfIn.порт.join()]).size===5,surfIn);
 check('внутри одного места пол не однообразен',
  surfIn.храм.length>=2&&surfIn.кузня.length>=2&&surfIn.верх.length>=2,surfIn);
 check('глубина слышна по шагу: щебень наверху, кости в середине, хрусталь на дне',
  surfIn.верх.includes("gravel")&&surfIn.середина.includes("bone")&&
  surfIn.дно.includes("crystal")&&!surfIn.верх.includes("crystal"),surfIn);
 check('два подвала одной глубины звучат по-разному',
  surfIn.подвалА!==surfIn.подвалБ,{а:surfIn.подвалА.slice(0,40),б:surfIn.подвалБ.slice(0,40)});

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

 /* ── 5. Мир, которого нет в записях: синтезированные сцены ── */
 const scenes=await page.evaluate(()=>{
  const нужны=["horse","dogs","livestock","chickens","rats","bats_wings","frogs","boar",
   "scream","battle_cry","market_shout","guard_shout","crowd_panic",
   "dungeon_drip","chains","bone_pile","rusty_gate","shaft_wind","far_scream",
   "blade_draw","arrow_hit","shield_bash","anvil",
   "market_babble","tavern_room","pouring","dice",
   "artifact_pulse","seal_break","cast_charge","spell_release","ward_shimmer"];
  const нет=нужны.filter(id=>!SOUNDS[id]);
  const неполные=нужны.filter(id=>SOUNDS[id]&&
   (!SOUNDS[id].name||!SOUNDS[id].desc||!SOUNDS[id].icon||typeof SOUNDS[id].build!=="function"||!(SOUNDS[id].dur>0)));
  /* Каждая сцена должна попасть в какой-нибудь раздел энциклопедии. */
  const взято=new Set();sceneCats().forEach(([,,ids])=>ids.forEach(i=>взято.add(i)));
  const внеРазделов=нужны.filter(id=>!взято.has(id));
  return {нет,неполные,внеРазделов,всего:Object.keys(SOUNDS).length};});
 check('все новые сцены мира на месте и построены',
  !scenes.нет.length&&!scenes.неполные.length,{нет:scenes.нет,неполные:scenes.неполные});
 check('ни одна новая сцена не осталась вне разделов',!scenes.внеРазделов.length,scenes.внеРазделов);
 check('синтезированных сцен стало больше сотни',scenes.всего>=120,scenes.всего);

 /* Сцены должны действительно строиться в браузере, а не только числиться. */
 const built=await page.evaluate(()=>{
  const плохие=[];
  ["horse","dogs","livestock","chickens","rats","bats_wings","frogs","boar",
   "scream","battle_cry","market_shout","guard_shout","crowd_panic",
   "dungeon_drip","chains","bone_pile","rusty_gate","shaft_wind","far_scream",
   "blade_draw","arrow_hit","shield_bash","anvil",
   "market_babble","tavern_room","pouring","dice",
   "artifact_pulse","seal_break","cast_charge","spell_release","ward_shimmer"].forEach(id=>{
   try{AE.ensure();const s=new SFX();SOUNDS[id].build(s);setTimeout(()=>{try{s.stop(0.05);}catch(_){}},50);}
   catch(err){плохие.push(id+": "+err.message);}});
  return плохие;});
 check('каждая новая сцена строится в настоящем браузере без ошибок',!built.length,built.slice(0,4));

 const living=await page.evaluate(()=>{
  const плохие=[];
  Object.entries(PLACE_SCENES).forEach(([k,ids])=>ids.forEach(id=>{if(!SOUNDS[id])плохие.push(k+"→"+id);}));
  DEPTH_SCENES.forEach((ids,d)=>ids.forEach(id=>{if(!SOUNDS[id])плохие.push("глубина "+d+"→"+id);}));
  return {плохие,мест:Object.keys(PLACE_SCENES).length,глубин:DEPTH_SCENES.length};});
 check('у каждой постройки и каждой глубины свои живые сцены, и все они существуют',
  !living.плохие.length&&living.мест>=8&&living.глубин>=6,living);

 /* ── 6. Постройки объёмны, и в них всё достижимо ──
    Дом без подвала, кузня без горна и руины без спуска — это не строгость
    ради строгости: игрок ходит по этим клеткам ногами, и то, чего нет,
    он ищет вслепую до конца игры. Проверяется каждый вид постройки на
    двадцати пяти разных местах карты. ── */
 const объём=await page.evaluate(()=>{
  const types=["castle","village","port","tavern","temple","forge","market","school",
   "clanhall","tower","ruins","cave_entrance"];
  const need={castle:["G",">","N"],village:[">","N"],port:[">","N"],tavern:[">","N"],
   temple:["A",">"],forge:["F",">"],market:["S",">"],school:["N",">"],
   clanhall:[">","N"],tower:[">","N"],ruins:[">","C"],cave_entrance:[">"]};
  const out={};const плохо=[];
  types.forEach((t,ti)=>{
   let минКомнат=99,минПлощадь=9999,несвязных=0,размеры=null;
   for(let s=0;s<25;s++){
    /* Разные места карты для разных построек: у уровней общий кэш по
       координатам, и на одной клетке все виды дали бы один и тот же дом. */
    const x=200+s*61+ti*911,y=300+s*37+ti*577;
    let l;try{l=genLevel(x,y,PLACE_KIND[t]==="dungeon"?1:0,t);}
    catch(e){плохо.push(t+": "+e.message);break;}
    const есть=ch=>{for(let yy=0;yy<l.h;yy++)for(let xx=0;xx<l.w;xx++)if(l.g[yy][xx]===ch)return true;return false;};
    (need[t]||[]).forEach(ch=>{if(!есть(ch))плохо.push(`${t} семя ${s}: нет «${ch}»`);});
    const пол=ch=>ch!=="#";
    const seen=new Set([l.entry.x+","+l.entry.y]);const q=[[l.entry.x,l.entry.y]];
    while(q.length){const [cx,cy]=q.pop();
     for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=l.w||ny>=l.h)continue;
      const k=nx+","+ny;if(seen.has(k)||!пол(l.g[ny][nx]))continue;
      seen.add(k);q.push([nx,ny]);}}
    let всего=0;for(let yy=0;yy<l.h;yy++)for(let xx=0;xx<l.w;xx++)if(пол(l.g[yy][xx]))всего++;
    несвязных+=всего-seen.size;
    минПлощадь=Math.min(минПлощадь,всего);
    минКомнат=Math.min(минКомнат,(l.rooms||[]).length||(l.blocks||[]).length||0);
    размеры=l.w+"×"+l.h;}
   out[t]={размеры,минПлощадь,минКомнат,несвязных};});
  return {out,плохо};});
 check('в каждой постройке есть всё, что ей положено: вход, спуск, люди, горн, алтарь',
  !объём.плохо.length,объём.плохо.slice(0,5));
 check('ни одна клетка постройки не отрезана от входа',
  Object.values(объём.out).every(o=>o.несвязных===0),
  Object.entries(объём.out).filter(([,o])=>o.несвязных).map(([k,o])=>k+":"+o.несвязных));
 check('в каждой постройке не меньше четырёх комнат',
  Object.values(объём.out).every(o=>o.минКомнат>=4),
  Object.entries(объём.out).map(([k,o])=>k+":"+o.минКомнат));
 check('дома не вырождаются в чулан, а города просторнее домов',
  Object.values(объём.out).every(o=>o.минПлощадь>=50)&&
  объём.out.castle.минПлощадь>объём.out.tavern.минПлощадь,
  Object.entries(объём.out).map(([k,o])=>k+":"+o.минПлощадь+" "+o.размеры));

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
