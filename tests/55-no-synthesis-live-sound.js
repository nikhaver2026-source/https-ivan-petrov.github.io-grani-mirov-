/* ════════════════════════════════════════════════════════════════════════
   НАБОР 55: НИ ОДНОГО РИСОВАННОГО ЗВУКА

   Мир «Грани Миров» передан целиком звуком, и синтез узнаётся на слух сразу:
   это не мир, это прибор. Раньше часть сцен рисовалась осциллятором — огонь,
   чары, дождь, ветер, звери, голоса тварей, приметы людей, фон местности, —
   и игрок, выучивший звук в каталоге, не узнавал его в пути, потому что в
   пути уже играла настоящая запись.

   ЧТО СЧИТАЕТСЯ СИНТЕЗОМ. Не «создан осциллятор»: этого мало. Звук из ничего
   делают два примитива — osc() (тон) и noise() (шум), — и всё остальное лишь
   складывает их. Считаются вызовы именно этих двух. Мера точная: она не путает
   рисованный шум с настоящей записью, которую браузер тоже играет буфером.

   И ОТЛОЖЕННЫЙ СИНТЕЗ ТОЖЕ. Часть сцен заводила осциллятор не сразу, а через
   таймер: беглая проверка видела тишину, а через четверть секунды начинался
   прибор. Поэтому после каждой сцены здесь ждут — и считают хвост.

   Отдельно проверяется, что запас цел: если папки со звуками рядом нет, игра
   обязана зазвучать синтезом, а не замолчать.
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

 /* Счётчик примитивов синтеза, общий для всех проверок набора. */
 await page.evaluate(()=>{
  AE.ensure();
  window.__синт=0;
  const oo=SFX.prototype.osc,on=SFX.prototype.noise;
  SFX.prototype.osc=function(){window.__синт++;return oo.apply(this,arguments);};
  SFX.prototype.noise=function(){window.__синт++;return on.apply(this,arguments);};
 });

 /* ── 1. Карты замен собраны и ссылаются на настоящие роли ── */
 const карты=await page.evaluate(()=>{
  const нет=[],пусто=[];
  for(const id in LIVE_INSTEAD){
   if(!LIVE_INSTEAD[id].length)пусто.push(id);
   for(const роль of LIVE_INSTEAD[id])if(!Bank.has(роль))нет.push(id+"→"+роль);}
  for(const id in LIVE_LOOP)if(!Bank.has(LIVE_LOOP[id]))нет.push("петля "+id+"→"+LIVE_LOOP[id]);
  const чужие=[...Object.keys(LIVE_INSTEAD),...Object.keys(LIVE_LOOP)].filter(id=>!SOUNDS[id]);
  return {сцен:Object.keys(LIVE_INSTEAD).length,петель:Object.keys(LIVE_LOOP).length,
   нет,пусто,чужие,blipНет:LIVE_BLIP.filter(r=>!Bank.has(r))};});
 check('карта живых замен собрана',карты.сцен>=110&&карты.петель>=9,{сцен:карты.сцен,петель:карты.петель});
 check('каждая замена ссылается на запись, которая есть в банке',!карты.нет.length,карты.нет.slice(0,8));
 check('пустых замен нет',!карты.пусто.length,карты.пусто);
 check('замены назначены существующим сценам',!карты.чужие.length,карты.чужие);
 check('сигналы меню тоже берутся из банка',!карты.blipНет.length,карты.blipНет);

 /* ── 2. Ни одна сцена каталога не рисуется, включая хвост ──
    Каталог звуков — учебник игрока: он обязан звучать ровно тем же, чем
    звучит мир, иначе выученное в нём не узнаётся в пути.

    Гоняться за таймерами не нужно: рисует сцену только её build(), а живая
    замена перехватывает сцену ДО него. Поэтому сперва смотрим, у кого build()
    вообще выполняется, — у остальных синтез невозможен в принципе, ни сразу,
    ни через три секунды. А немногих оставшихся проверяем по-настоящему долго,
    дольше самого позднего таймера в игре (3.1 с). */
 const каталог=await page.evaluate(async()=>{
  const идут=[];
  for(const id of Object.keys(SOUNDS)){
   const ор=SOUNDS[id].build;let было=false;
   SOUNDS[id].build=function(){было=true;return ор.apply(this,arguments);};
   Play.start("пров",id,{});Play.stopKey("пров");
   SOUNDS[id].build=ор;
   if(было)идут.push(id);}
  /* Те немногие, у кого build() всё же идёт, играют вшитой записью через
     sample(). Даём им отзвучать целиком и считаем примитивы. */
  const рисуют=[];
  for(const id of идут){
   const до=window.__синт;
   Play.start("пров",id,{});
   await new Promise(r=>setTimeout(r,3400));
   Play.stopKey("пров");
   if(window.__синт>до)рисуют.push(id+"("+(window.__синт-до)+")");}
  return {всего:Object.keys(SOUNDS).length,идут,рисуют};});
 check('в каталоге больше сотни сцен',каталог.всего>=120,каталог.всего);
 check('почти все сцены перехвачены записью до рисования',каталог.идут.length<=6,каталог.идут);
 check('ни одна сцена каталога не рисуется — ни сразу, ни по таймеру',
  !каталог.рисуют.length,каталог.рисуют.slice(0,12));

 /* ── 3. Каждая сцена доходит до настоящей записи ──
    Замена в карте — не единственный путь к живому звуку: часть сцен зовёт
    запись прямо из своей build(), потому что она была у них с самого начала
    (дверь, сундук, клинок, шаги) — иные из папки sounds, иные из записи,
    вшитой в саму страницу. Поэтому проверяется не запись в карте, а итог:
    на каждой сцене прозвучал настоящий файл, каким бы путём он ни шёл.

    Это и есть защита на будущее: новая сцена, которой забыли дать запись,
    провалит набор, а не вернёт в игру осциллятор тихой сапой. */
 const покрытие=await page.evaluate(async()=>{
  const bp=Bank.play.bind(Bank),bf=Bank.file.bind(Bank),bn=Bank.panned.bind(Bank),bl=Bank.loop.bind(Bank);
  let взято=0;
  Bank.play=function(){const e=bp.apply(null,arguments);if(e)взято++;return e;};
  Bank.file=function(){const e=bf.apply(null,arguments);if(e)взято++;return e;};
  Bank.panned=function(){const e=bn.apply(null,arguments);if(e)взято++;return e;};
  Bank.loop=function(){const e=bl.apply(null,arguments);if(e)взято++;return e;};
  const sp=SFX.prototype.sample;
  SFX.prototype.sample=function(id){if(SAMPLES[id]||sampleBufCache[id])взято++;
   return sp.apply(this,arguments);};
  const немые=[];
  for(const id of Object.keys(SOUNDS)){
   const до=взято;
   Play.start("пк",id,{});await new Promise(r=>setTimeout(r,60));Play.stopKey("пк");
   if(взято===до){Play.start("пк",id,{loop:true});Play.stopKey("пк");}
   if(взято===до)немые.push(id);}
  Bank.play=bp;Bank.file=bf;Bank.panned=bn;Bank.loop=bl;SFX.prototype.sample=sp;
  return немые;});
 check('на каждой сцене звучит настоящая запись',!покрытие.length,покрытие.slice(0,10));

 /* ── 4. Зацикленные слои местности — тоже запись ── */
 const петли=await page.evaluate(async()=>{
  const до=window.__синт;
  const завелось=[];
  for(const id in LIVE_LOOP){
   const ok=Play.start("сл",id,{loop:true});
   const e=Play.active.get("сл");
   завелось.push(!!(ok&&e&&e.канал));
   Play.stopKey("сл");}
  await new Promise(r=>setTimeout(r,700));
  return {синт:window.__синт-до,всех:завелось.length,завелись:завелось.filter(Boolean).length,
   каналОстался:Bank.loops.has("слой:сл")};});
 check('петли местности не рисуются',петли.синт===0,петли.синт);
 check('каждая петля заводится записью и числится слоем',петли.завелись===петли.всех,петли);
 check('снятый слой уводит за собой канал банка',петли.каналОстался===false,петли.каналОстался);

 /* ── 5. Музыка: у каждой темы настоящая запись ── */
 const музыка=await page.evaluate(async()=>{
  const до=window.__синт;
  const синт=[];settings.bgMusic=1;
  for(const k of Object.keys(MUSIC_TRACK)){Music.stop();Music.start(k);if(!Music.track)синт.push(k);}
  Music.stop();
  await new Promise(r=>setTimeout(r,500));
  return {тем:Object.keys(MUSIC_TRACK).length,синт,прим:window.__синт-до};});
 check('у каждой темы музыки есть запись',!музыка.синт.length,музыка.синт);
 check('музыка не рисуется',музыка.прим===0,музыка.прим);

 /* ── 6. Сигналы меню и трезвучие ── */
 const сигналы=await page.evaluate(async()=>{
  const до=window.__синт;
  [120,300,500,700,900,1100,1400,1800].forEach(f=>UI.blip(f,0.08,0.12));
  const послеBlip=window.__синт-до;chime();
  await new Promise(r=>setTimeout(r,400));
  return {blip:послеBlip,всего:window.__синт-до};});
 check('сигналы меню не рисуются',сигналы.blip===0,сигналы.blip);
 check('трезвучие не рисуется',сигналы.всего===0,сигналы.всего);

 /* ── 7. Обычная игра: ход, погода, осмотр ── */
 const игра=await page.evaluate(async()=>{
  const до=window.__синт;
  let играно=0,петель=0;
  const bp=Bank.play.bind(Bank),bl=Bank.loop.bind(Bank);
  Bank.play=function(){const e=bp.apply(null,arguments);if(e)играно++;return e;};
  Bank.loop=function(){const e=bl.apply(null,arguments);if(e)петель++;return e;};
  for(let i=0;i<30;i++)safeFn(()=>step(["с","ю","в","з"][i%4]));
  safeFn(()=>look());safeFn(()=>refresh());safeFn(()=>bankUpdateAmbient());
  ["Дождь","Гроза","Ветрено","Снег","Туман","Ясно"].forEach(w=>safeFn(()=>Weather.set(w)));
  await new Promise(r=>setTimeout(r,1800));
  Bank.play=bp;Bank.loop=bl;
  return {синт:window.__синт-до,играно,петель};});
 check('живой звук в обычной игре действительно звучит',игра.играно+игра.петель>=10,
  {записей:игра.играно,петель:игра.петель});
 check('обычная игра не рисует ни одного примитива',игра.синт===0,игра.синт);

 /* ── 8. Запас цел: без папки звуков игра звучит, а не молчит ──
    Осциллятор остаётся в коде именно для этого случая и только для него. */
 const запас=await page.evaluate(async()=>{
  const до=window.__синт;
  Bank.enabled=false;
  let цел=true;
  try{Play.start("зап","fire",{});Play.start("зап2","forest",{loop:true});
   UI.blip(880,0.08,0.12);look();refresh();}catch(e){цел=false;}
  await new Promise(r=>setTimeout(r,500));
  const синтезировал=window.__синт-до;
  Play.stopKey("зап");Play.stopKey("зап2");
  Bank.enabled=true;
  return {синтезировал,цел};});
 check('без записей игра не ломается',запас.цел,запас);
 check('без записей остаётся синтез, а не тишина',запас.синтезировал>0,запас.синтезировал);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
