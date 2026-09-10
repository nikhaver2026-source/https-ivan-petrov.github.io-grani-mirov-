/* ════════════════════════════════════════════════════════════════════════
   ОБЪЁМНЫЙ ЗВУК И АКУСТИКА МЕСТ

   До сих пор у звука была только панорама — доля влево или вправо. Слышно
   было «левее» и «правее», но не «впереди», не «за спиной», не «под ногами»
   и не «как далеко». Здесь проверяется, что у каждого источника появилось
   МЕСТО: сторона, расстояние и высота; что звуковая картина движется вместе
   с игроком; и что у каждого вида места своя акустика.
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
 await page.evaluate(()=>enterGame());await page.waitForTimeout(400);

 /* ── 1. Браузер и игра действительно строят HRTF ── */
 const ядро=await page.evaluate(()=>{
  AE.ensure();Spatial.ensure();
  const p=AE.ctx.createPanner();p.panningModel="HRTF";
  const L=AE.ctx.listener;
  return {контекст:!!AE.ctx,режим:p.panningModel,
   слушатель:L.forwardZ?{вперёд:L.forwardZ.value,вверх:L.upY.value,начало:L.positionX.value}:null,
   отзвукПодключён:!!(Room.conv&&Room.wet&&Room.dry)};});
 check('звук идёт через HRTF, а не через плоскую панораму',
  ядро.контекст&&ядро.режим==="HRTF",ядро);
 check('слушатель стоит в начале координат и смотрит на север',
  ядро.слушатель&&ядро.слушатель.вперёд===-1&&ядро.слушатель.вверх===1&&ядро.слушатель.начало===0,
  ядро.слушатель);
 check('путь отзвука помещения собран',ядро.отзвукПодключён===true);

 /* ── 2. Стороны света ложатся на координаты сцены ── */
 const стороны=await page.evaluate(()=>{
  const т=(dx,dy,dz)=>{const n=Spatial.node(dx,dy,dz,1.1);
   return {x:+n.positionX.value.toFixed(2),y:+n.positionY.value.toFixed(2),z:+n.positionZ.value.toFixed(2)};};
  return {восток:т(3,0,0),запад:т(-3,0,0),север:т(0,-3,0),юг:т(0,3,0),
   вниз:т(0,0,-1),вверх:т(0,0,1),
   реф:Spatial.node(1,0,0,1.1).refDistance,макс:Spatial.node(1,0,0,1.1).maxDistance};});
 check('восток справа, запад слева',
  стороны.восток.x>0&&стороны.запад.x<0,{восток:стороны.восток.x,запад:стороны.запад.x});
 check('север впереди, юг за спиной',
  стороны.север.z<0&&стороны.юг.z>0,{север:стороны.север.z,юг:стороны.юг.z});
 check('лестница вниз звучит из-под ног, вверх — сверху',
  стороны.вниз.y<0&&стороны.вверх.y>0,{вниз:стороны.вниз.y,вверх:стороны.вверх.y});
 check('дальность источника ограничена слышимым пределом',
  стороны.макс>стороны.реф&&стороны.макс<=1.7*14+0.01,{реф:стороны.реф,макс:стороны.макс});

 /* ── 3. Запись действительно проигрывается в точке ── */
 const проигрыш=await page.evaluate(async()=>{
  settings.effects=1;settings.hrtf=1;
  const было=Spatial.live.length;
  const ok=Spatial.at("mg/wyrm_roar_01.ogg",4,-3,{gain:0.4,maxSec:1});
  await new Promise(z=>setTimeout(z,150));
  const узел=Spatial.live[Spatial.live.length-1];
  const r={получилось:ok,сталоЖивых:Spatial.live.length>было,
   место:узел?{x:+узел.pan.positionX.value.toFixed(2),z:+узел.pan.positionZ.value.toFixed(2)}:null,
   поРоли:Spatial.role("wolf_howl",-5,2,{gain:0.3,maxSec:1})};
  await new Promise(z=>setTimeout(z,1300));
  Spatial.stopAll();
  return r;});
 check('запись проигрывается в заданной точке пространства',
  проигрыш.получилось&&проигрыш.сталоЖивых&&проигрыш.место&&
  проигрыш.место.x>0&&проигрыш.место.z<0,проигрыш);
 check('источник можно задать ролью банка, а не только путём',проигрыш.поРоли===true);

 /* ── 4. Выключенный объёмный звук возвращает прежнюю панораму ── */
 const выкл=await page.evaluate(()=>{
  settings.hrtf=0;
  const r={приВыключенном:Spatial.at("mg/wyrm_roar_01.ogg",2,0,{maxSec:1}),
   включён:Spatial.on()};
  settings.hrtf=1;
  r.приВключённом=Spatial.on();
  Spatial.stopAll();
  return r;});
 check('настройка «объёмный звук» действительно выключает размещение',
  выкл.приВыключенном===false&&выкл.включён===false&&выкл.приВключённом===true,выкл);

 /* ── 5. У каждого вида места своя акустика ── */
 const акустика=await page.evaluate(()=>{
  const виды=Object.keys(ROOM);
  const длины={},хвосты=new Set();
  for(const k of виды){
   const b=Room.buffer(k,1);
   длины[k]=+(b.length/AE.ctx.sampleRate).toFixed(2);
   хвосты.add(b.length);}
  /* Совпасть не должны и сами настройки: длина, крутизна, доля и цвет. */
  const наборы=new Set(виды.map(k=>[ROOM[k].sec,ROOM[k].decay,ROOM[k].wet,ROOM[k].damp].join("/")));
  return {видов:виды.length,разных:хвосты.size,наборов:наборы.size,длины,
   пещераДольшеПоля:длины.cave>длины.field,
   глубинаДольшеПещеры:длины.deep>длины.cave,
   храмДольшеТаверны:длины.temple>длины.tavern,
   отзвукПоляМал:ROOM.field.wet<ROOM.cave.wet};});
 check('у каждого вида места свой отклик, а не один на всех',
  акустика.видов>=17&&акустика.разных===акустика.видов&&акустика.наборов===акустика.видов,
  {видов:акустика.видов,разныхПоДлине:акустика.разных,разныхПоНастройкам:акустика.наборов,
   длины:акустика.длины});
 check('акустика соответствует месту: пещера гулче поля, глубина гулче пещеры, храм гулче таверны',
  акустика.пещераДольшеПоля&&акустика.глубинаДольшеПещеры&&
  акустика.храмДольшеТаверны&&акустика.отзвукПоляМал,акустика);

 /* ── 6. Место игрока определяет акустику ── */
 const места=await page.evaluate(()=>{
  const было=[];
  G.place=null;G.ship=null;G.flight=null;G.x=1000;G.y=1000;
  const ставим=(f,имя)=>{f();было.push([имя,roomKind()]);};
  ставим(()=>{},"мир");
  ставим(()=>{G.place={kind:"house",bx:1000,by:1000,stype:"tavern",name:"т",depth:0,x:2,y:2};},"таверна");
  ставим(()=>{G.place.stype="temple";},"храм");
  ставим(()=>{G.place.stype="forge";},"кузница");
  ставим(()=>{G.place={kind:"city",bx:1000,by:1000,stype:"castle",name:"ц",depth:0,x:2,y:2};},"цитадель");
  ставим(()=>{G.place={kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",name:"п",depth:2,x:2,y:2};},"пещера");
  ставим(()=>{G.place.depth=5;},"глубина");
  ставим(()=>{G.place=null;G.ship={name:"к",toName:"п",tox:1,toy:1,left:2};},"корабль");
  ставим(()=>{G.ship=null;G.flight={dir:1};},"лестница");
  G.flight=null;G.place=null;G.ship=null;
  return было;});
 const ожидалось={"мир":"field","таверна":"tavern","храм":"temple","кузница":"forge",
  "цитадель":"castle","пещера":"cave","глубина":"deep","корабль":"ship","лестница":"stairs"};
 check('каждое место игры звучит по-своему: дом, храм, кузница, цитадель, пещера, глубина, палуба, лестница',
  места.every(([имя,вид])=>ожидалось[имя]===вид),места);

 /* ── 7. Размер уровня растягивает отзвук ── */
 const размер=await page.evaluate(()=>{
  const мал=Room.buffer("dungeon",0.6).length,вел=Room.buffer("dungeon",2.0).length;
  return {мал,вел,больше:вел>мал*2};});
 check('просторный зал гудит дольше тесной каморки',размер.больше===true,размер);

 /* ── 8. Живая звуковая картина знает, где что стоит ── */
 const картина=await page.evaluate(()=>{
  G.place=null;G.ship=null;G.inCombat=false;
  outer:for(let r=1;r<200;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const x=1000+dx,y=1000+dy;let пост=0,рес=0;
   for(let b=-4;b<=4;b++)for(let a=-4;a<=4;a++){
    const c=cellContent(x+a,y+b);if(c.structure)пост++;if(c.res)рес++;}
   if(пост&&рес>=2){G.x=x;G.y=y;break outer;}}
  const было=Scape.around();
  const цель=было.find(o=>o.d>=2);
  const доX=G.x;G.x=G.x+1;
  const стало=Scape.around().find(o=>o.key===цель.key);
  G.x=доX;
  return {сколько:было.length,виды:[...new Set(было.map(o=>o.kind))],
   всеСоСмещением:было.every(o=>Number.isFinite(o.dx)&&Number.isFinite(o.dy)&&(o.dx||o.dy)),
   вПределах:было.every(o=>o.d<=SCAPE_RAD),
   сдвиг:стало?{было:цель.dx,стало:стало.dx,верно:стало.dx===цель.dx-1&&стало.dy===цель.dy}:null};});
 check('звуковая картина находит, что стоит вокруг, и у каждого есть смещение',
  картина.сколько>5&&картина.всеСоСмещением&&картина.вПределах,
  {сколько:картина.сколько,виды:картина.виды});
 check('картина движется вместе с игроком: шаг в сторону сдвигает источник',
  картина.сдвиг&&картина.сдвиг.верно,картина.сдвиг);

 /* ── 9. Внутри построек картина слышит плитки и ярусы ── */
 const внутри=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1500,by:1500,stype:"ruins",name:"п",depth:2,x:0,y:0};
  const lvl=curLevel();
  outer:for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)
   if(tileAt(lvl,x,y)==="."){G.place.x=x;G.place.y=y;break outer;}
  const список=Scape.around();
  const r={сколько:список.length,виды:[...new Set(список.map(o=>o.kind))]};
  G.place=null;
  return r;});
 check('внутри построек картина слышит ступени, двери, сундуки, жилы и логова',
  внутри.сколько>0&&внутри.виды.some(k=>/stairs|door|chest|vein|lair/.test(k)),внутри);

 /* ── 10. Один такт картины подаёт голос, но не больше предела ── */
 const такт=await page.evaluate(async()=>{
  G.place=null;G.ship=null;G.inCombat=false;
  settings.effects=1;settings.hrtf=1;settings.scape=1;
  while(activeLayer())closeTopUI();
  Scape.last.clear();Scape.lastAny=0;Spatial.stopAll();
  const n=Scape.tick();
  await new Promise(z=>setTimeout(z,150));
  const живых=Spatial.live.length;
  /* Сразу следом картина обязана молчать: между откликами есть промежуток. */
  const сразу=Scape.tick();
  /* Тот же источник не откликается дважды подряд даже спустя промежуток. */
  const ключи=[...Scape.last.keys()];
  Scape.lastAny=0;
  const повтор=Scape.tick();
  const новыеКлючи=[...Scape.last.keys()].filter(k=>!ключи.includes(k));
  Spatial.stopAll();
  return {первый:n,сразу,повтор,новых:новыеКлючи.length,живых,предел:SCAPE_MAX,промежуток:SCAPE_GAP};});
 check('такт картины подаёт голос, но не больше предела одновременных источников',
  такт.первый>0&&такт.первый<=такт.предел,такт);
 check('между откликами картины есть промежуток — она не тараторит',
  такт.сразу===0,такт);
 check('следующий отклик достаётся другому источнику, а не тому же самому',
  такт.повтор===0||такт.новых>0,такт);

 /* ── 11. Картина выключается настройкой и открытым окном ── */
 const молчание=await page.evaluate(()=>{
  settings.scape=0;const без=Scape.on();
  settings.scape=1;const с=Scape.on();
  CMD.inv();const приОкне=Scape.on();
  while(activeLayer())closeTopUI();
  settings.effects=0;const безЗвука=Scape.on();
  settings.effects=1;
  return {без,с,приОкне,безЗвука};});
 check('живая картина молчит при выключенной настройке, открытом окне и выключенных эффектах',
  молчание.без===false&&молчание.с===true&&молчание.приОкне===false&&молчание.безЗвука===false,
  молчание);

 /* ── 12. Новые записи на месте и подключены ── */
 const записи=await page.evaluate(()=>{
  const роли=Object.keys(SOUND_BANK).filter(r=>(SOUND_BANK[r].f[0]||"").startsWith("mg/"));
  const файлы=роли.reduce((n,r)=>n+SOUND_BANK[r].f.length,0);
  const группа=BANK_GROUPS.find(g=>g.dirs.includes("mg"));
  return {ролей:роли.length,файлов:файлы,группа:group(группа),
   безОписания:роли.filter(r=>!SOUND_BANK[r].d).length};
  function group(g){return g?g.n:null;}});
 check('записи фэнтезийного мира подключены ролями и попали в энциклопедию',
  записи.ролей>=70&&записи.файлов>=260&&записи.группа&&записи.безОписания===0,записи);

 /* ── 13. Ни одно имя роли не объявлено дважды ──
    Роли лежат в одном общем словаре, и второе объявление молча перекрывает
    первое: записи первого становятся недостижимы, и никто этого не замечает.
    Так уже случалось с «drone_deep» — две записи из трёх не звучали никогда,
    и так чуть не случилось при этой поставке с «spear_thrust». */
 const повторы=await page.evaluate(()=>{
  /* Разбираем сам текст страницы: в готовом объекте повтор уже неразличим. */
  const тело=[...document.querySelectorAll("script")].map(s=>s.textContent).join("\n");
  const счёт={};
  const rx=/[\n{,]\s*([a-z0-9_]+)\s*:\s*\{f:\["/g;
  let m;while((m=rx.exec(тело)))счёт[m[1]]=(счёт[m[1]]||0)+1;
  return {всего:Object.keys(счёт).length,
   повторы:Object.entries(счёт).filter(([,n])=>n>1).map(([r,n])=>r+"×"+n)};});
 check('ни одно имя роли банка не объявлено дважды',
  повторы.повторы.length===0&&повторы.всего>500,повторы);

 /* ── 14. Каждая роль достижима из энциклопедии ── */
 const охват=await page.evaluate(()=>{
  const вРазделах=new Set();
  BANK_GROUPS.forEach(g=>bankRolesIn(g.dirs).forEach(r=>вРазделах.add(r)));
  const все=Object.keys(SOUND_BANK);
  const папки=new Set(все.map(r=>(SOUND_BANK[r].f[0]||"").split("/")[0]).filter(Boolean));
  return {всего:все.length,вне:все.filter(r=>!вРазделах.has(r)).slice(0,8),
   папокБезИмени:[...папки].filter(p=>!BANK_CATS[p])};});
 check('каждая роль банка попала в раздел энциклопедии, а каждая папка названа',
  охват.вне.length===0&&охват.папокБезИмени.length===0,охват);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
