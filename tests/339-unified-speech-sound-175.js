/* ════════════════════════════════════════════════════════════════════════
   НАБОР 339: ЕДИНЫЕ ОБРАБОТЧИКИ РЕЧИ И ЗВУКА ПОСЛЕ 17.0

   Решение игрока по разбору обработчиков: «делай всё по тому порядку,
   который ты указал… чтобы игроку ничего не приходилось проверять, и всё
   работало у него на устройстве корректно — как на телефоне, так и на
   компьютере». Здесь — по проверке на каждую часть.

   Р4. Цепочка речи: Speech.say больше никто не подменяет; постоянные
       обработчики — Speech.use с именем и порядком, временные —
       Speech.na_время, снимаются сами, даже если дело упало; внешняя
       подмена Speech.say (прослушка) не теряет временных обработчиков.
   Р3. Правила очереди — таблицей: у каждого правила своя клетка — пара
       «звучит / пришла», и правило делает ровно своё; у каждого фильтра —
       своя причина, и она видна в журнале.
   Р6. Приглушение фона отпускается не сразу, а через 0,45 с тишины;
       распорядитель голосов знает, когда станет тихо.
   З4. Одни часы: дела звука и речи стоят в общем такте; свёрнутая игра
       такт останавливает, вернувшаяся — продолжает.
   З5. Громкость записей по замеру: поправки выравнивают варианты роли и
       доходят до плеера; «динамик телефона» на телефоне включён сам,
       одиночные звуки из памяти идут через сжатие, флажок его выключает.
   З2, З3, З6, Р1, Р2, З1 — коротко: фон места сразу, итог звука, журнал
       и его окно, свежая речь мира, предложение одним голосом, звуки из
       памяти.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.effects=1;G.tutorDone=true;});
 await page.waitForTimeout(1500);

 /* ── Р4. Цепочка речи ── */
 const р4=await page.evaluate(async()=>{
  const r={};const спим=мс=>new Promise(z=>setTimeout(z,мс));
  r.цепь=!!(Speech.say&&Speech.say.цепьРечи);
  r.имена=Speech._цепь.map(з=>[з.имя,з.порядок]);
  const e0=Speech.enqueue;const в=[];Speech.enqueue=function(t,o){в.push(String(t));return null;};
  try{
   /* временный обработчик: перехватывает только на время дела, потом снят */
   const пойм=[];Speech.на_время(()=>{Speech.say("раз");},(t,o)=>{пойм.push(t);return true;},"проба");
   Speech.say("два");r.времен={пойм:пойм.slice(),дошло:в.slice(),осталось:Speech._цепь.some(з=>з.имя==="проба")};
   /* вложенные: внутренний — первым, внешний видит уже изменённое */
   в.length=0;
   Speech.на_время(()=>{Speech.на_время(()=>{Speech.say("слово");},(t,o,д)=>д(t+" (внутр)",o),"внутр");},(t,o,д)=>д(t+" (внеш)",o),"внеш");
   r.вложенные=в.slice();
   /* дело упало — обработчик всё равно снят */
   try{Speech.на_время(()=>{throw new Error("упало");},(t,o)=>true,"падает");}catch(_){}
   r.послеПадения=!Speech._цепь.some(з=>з.имя==="падает");
   /* постоянный: порядок — больший раньше; снятие */
   в.length=0;const сн1=Speech.use("п1",(t,o,д)=>д(t+"1",o),5),сн2=Speech.use("п2",(t,o,д)=>д(t+"2",o),7);
   Speech.say("x");сн1();сн2();Speech.say("y");r.постоянные=в.slice();
   /* внешняя подмена Speech.say (прослушка набора) — временный ложится поверх, как прежде */
   const s0=Speech.say;const слышно=[];Speech.say=function(t,o){слышно.push(String(t));return s0.call(this,t,o);};
   Speech.на_время(()=>{Speech.say("сквозь");},(t,o,д)=>д("["+t+"]",o),"поверх");
   Speech.say=s0;r.поверхПрослушки=слышно.slice();
   /* «звук прежде слов» (zv150): первая фраза дела — позже, остальные сразу */
   в.length=0;const t0=Date.now();const когда=[];Speech.enqueue=function(t,o){когда.push([String(t),Date.now()-t0]);return null;};
   ZvSay.run(400,()=>{Speech.say("итог дела");Speech.say("подробность");});
   await спим(650);r.звукПрежде=когда.slice();
  }finally{Speech.enqueue=e0;}
  return r;});
 const им=р4.имена.map(x=>x[0]);
 check('Р4. Speech.say — цепочка; постоянные обработчики модулей стоят в прежнем порядке подмен: клавиша E → окно зверей → посадка → кавычки',
  р4.цепь&&["клавиша E вместо касаний","окно зверей — фон после","посадка — звук прежде слов","голоса чертогов в кавычках"].every((n,i,a)=>им.indexOf(n)>=0&&(i===0||им.indexOf(a[i-1])<им.indexOf(n))),р4.имена);
 check('Р4. временный обработчик перехватывает только на время дела и снимается сам, даже если дело упало',
  р4.времен.пойм.join()==="раз"&&р4.времен.дошло.join()==="два"&&!р4.времен.осталось&&р4.послеПадения,р4.времен);
 check('Р4. вложенные временные: внутренний — первым; постоянные — по порядку и снимаются',
  р4.вложенные.join()==="слово (внутр) (внеш)"&&р4.постоянные.join("|")==="x21|y",{вложенные:р4.вложенные,постоянные:р4.постоянные});
 check('Р4. внешняя прослушка Speech.say не теряет временного обработчика',р4.поверхПрослушки.join()==="[сквозь]",р4.поверхПрослушки);
 check('Р4. «звук прежде слов»: первая фраза дела звучит позже (через 0,4 с), подробность — сразу',
  р4.звукПрежде.length===2&&р4.звукПрежде[0][0]==="подробность"&&р4.звукПрежде[1][0]==="итог дела"&&р4.звукПрежде[1][1]>=350,р4.звукПрежде);

 /* ── Р3. Правила очереди — по клетке на правило ── */
 const р3=await page.evaluate(()=>{
  const S=Speech;const сохр={q:S.queue,cur:S.current,sp:S.speaking,pump:S._pump,cut:S._cut,ad:S._adapter,rec:S.recent,st:JSON.stringify(settings),inC:G.inCombat,comb:G.combat};
  const лог=[];S._pump=function(){лог.push("pump");};S._cut=function(m,st){лог.push("cut");m.state=st;this.speaking=false;this.current=null;};
  S._adapter=()=>({name:"fake",speak(){return true;},cancel(){},speaking(){return false;}});
  const мф=(o)=>Object.assign({id:++S.seq,gen:0,text:"звучит "+S.seq,pri:2,cat:"result",key:null,user:false,nav:false,persistent:false,herald:false,keep:false,interrupt:true,createdAt:Date.now(),ttl:0,state:"SPEAKING",parts:null},o);
  /* для каждого правила — звучащая фраза и пришедшая, при которых первым подходит именно оно */
  const КЛЕТКИ={
   "весть уступает делу":[{herald:true,pri:1},{pri:2,interrupt:false}],
   "листание главнее":[{pri:2},{nav:true,pri:2}],
   "мир ждёт листания и просьбы":[{nav:true,pri:2},{pri:3,interrupt:true}],
   "важнее звучащего":[{pri:3},{pri:0}],
   "мелочь после важного":[{pri:1},{pri:3,interrupt:false}],
   "мелочь сменяет мелочь":[{pri:2},{pri:2,interrupt:true}],
   "книга главнее окон":[{pri:1,cat:"ui"},{pri:1,cat:"read",interrupt:true}],
   "важное — следом, мелочь снять":[{pri:1},{pri:1,interrupt:true}],
   "по порядку":[{pri:1},{pri:1,interrupt:false}]};
  const ЖДЁМ={"оборвать":"cut,pump","листание":"cut,pump","сменить":"cut,pump","в очередь":"","в очередь, сняв мелочь, если перебивает":"","снять мелочь и в очередь":"","сразу":"pump"};
  const r={клетки:{},фильтры:{}};
  try{
   Object.assign(settings,{speech:1,autoSpeech:1,autoDescribe:1,hints:1,describeObjects:1,verbosity:"std",cbSpeech:0});G.inCombat=false;G.combat=null;
   for(const п of S._правила){const к=КЛЕТКИ[п.имя];if(!к){r.клетки[п.имя]="нет клетки";continue;}
    const cur=мф(к[0]);const m=мф(Object.assign({state:"QUEUED"},к[1]));
    S.queue=[мф({pri:3,state:"QUEUED"})];S.current=cur;S.speaking=true;S.recent=new Map();лог.length=0;
    const выбрано=S._правила.find(x=>x.когда(m,cur));
    const до=S.queue.length;S._действия[выбрано.делать].call(S,m,cur);
    r.клетки[п.имя]={выбрано:выбрано.имя,лог:лог.join(","),ждём:ЖДЁМ[выбрано.делать],вОчереди:S.queue.includes(m),первой:S.queue[0]===m,мелочьСнята:S.queue.length<до+1};}
   /* в тишине — сразу */
   S.current=null;S.speaking=false;S.queue=[];лог.length=0;
   const m0=S.enqueue("Проба тишины "+Date.now(),{pri:2,cat:"result"});r.тишина={правило:m0&&m0.правило,лог:лог.join(",")};
   /* фильтры: у каждого своя причина в m.причина и в журнале */
   const ПРОБЫ={
    "урон по твари не озвучивать":[{cbDmgFoe:0},{урон:"foe"}],
    "урон по вам не озвучивать":[{cbDmgMe:0},{урон:"me"}],
    "тихий бой":[{cbSpeech:0},{pri:2},true],
    "автоозвучка выключена":[{autoSpeech:0},{pri:3}],
    "описания выключены":[{autoDescribe:0},{cat:"desc",pri:3}],
    "подсказки выключены":[{hints:0},{cat:"object",pri:3}],
    "описания предметов выключены":[{describeObjects:0},{cat:"object",pri:3}],
    "минимальная подробность":[{verbosity:"min"},{pri:3,cat:"result"}]};
   for(const [имя,[ус,оп,бой]] of Object.entries(ПРОБЫ)){
    Object.assign(settings,{speech:1,autoSpeech:1,autoDescribe:1,hints:1,describeObjects:1,verbosity:"std",cbSpeech:0,cbDmgFoe:1,cbDmgMe:1},ус);
    G.inCombat=!!бой;G.combat=бой?{}:null;
    const m=S.enqueue("Проба фильтра "+имя+" "+Math.random(),оп);
    r.фильтры[имя]={причина:m&&m.причина,состояние:m&&m.state,вЖурнале:ЖурналРЗ.речь.some(z=>z.итог==="не сказано: "+имя)};}
  }finally{
   Object.assign(settings,JSON.parse(сохр.st));G.inCombat=сохр.inC;G.combat=сохр.comb;
   S.queue=сохр.q;S.current=сохр.cur;S.speaking=сохр.sp;S._pump=сохр.pump;S._cut=сохр.cut;S._adapter=сохр.ad;S.recent=сохр.rec;}
  r.правил=S._правила.length;return r;});
 const плохиеКлетки=Object.entries(р3.клетки).filter(([имя,к])=>typeof к!=="object"||к.выбрано!==имя||к.лог!==к.ждём
  ||((/оборвать|сменить|листание|сразу/.test(к.ждём)||к.ждём.startsWith("cut"))?!к.первой:!к.вОчереди));
 check('Р3. у каждого из девяти правил очереди своя клетка «звучит / пришла»: подходит именно оно и делает своё (оборвать, сменить, в очередь)',
  р3.правил===9&&Object.keys(р3.клетки).length===9&&плохиеКлетки.length===0,плохиеКлетки.length?плохиеКлетки:р3.клетки);
 check('Р3. в тишине новая фраза идёт сразу — правилом «в тишине — сразу»',р3.тишина.правило==="в тишине — сразу"&&/pump/.test(р3.тишина.лог),р3.тишина);
 const плохиеФильтры=Object.entries(р3.фильтры).filter(([имя,ф])=>ф.причина!==имя||ф.состояние!=="DROPPED"||!ф.вЖурнале);
 check('Р3. каждый фильтр снимает фразу со своей причиной, и причина видна в журнале речи и звука',
  Object.keys(р3.фильтры).length===8&&плохиеФильтры.length===0,плохиеФильтры.length?плохиеФильтры:р3.фильтры);

 /* ── Р6. Приглушение без «дыхания» ── */
 const р6=await page.evaluate(async()=>{
  const спим=мс=>new Promise(z=>setTimeout(z,мс));const S=Speech;const r={};
  S.stop();await спим(600);
  S._duck(true);r.вкл=!!S.ducking;S._duck(false);r.сразуПосле=!!S.ducking;
  await спим(200);S._duck(true);S._duck(false);r.черезПаузу=!!S.ducking;
  await спим(700);r.потом=!!S.ducking;
  r.тихо=typeof Пол==="object"&&typeof Пол.свободенЧерез()==="number";return r;});
 check('Р6. приглушение фона держится между фразами и отпускается только после 0,45 с тишины',
  р6.вкл&&р6.сразуПосле&&р6.черезПаузу&&!р6.потом&&р6.тихо,р6);

 /* ── З4. Одни часы ── */
 const з4=await page.evaluate(async()=>{
  const спим=мс=>new Promise(z=>setTimeout(z,мс));const r={};
  r.дела=Такт.список().map(д=>д.имя);
  let раз=0;const снять=Такт.каждые(200,()=>{раз++;},"проба такта");
  await спим(1100);r.раз=раз;
  /* игра свёрнута */
  const opis=Object.getOwnPropertyDescriptor(Document.prototype,"hidden");
  Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));
  const р0=раз;await спим(800);r.свёрнута={таймер:!!Такт.т,раз:раз-р0};
  delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));
  const р1=раз;await спим(700);r.вернулась={таймер:!!Такт.т,раз:раз-р1};
  снять();r.снято=!Такт.список().some(д=>д.имя==="проба такта");
  return r;});
 check('З4. дела звука и речи — в общем такте (звуковая картина, гул места, окно зверей)',
  ["звуковая картина","гул места","окно зверей — вести после"].every(n=>з4.дела.includes(n)),з4.дела);
 check('З4. дело такта идёт со своим периодом; свёрнутая игра такт останавливает, вернувшаяся — продолжает; снятое дело уходит',
  з4.раз>=3&&з4.раз<=6&&!з4.свёрнута.таймер&&з4.свёрнута.раз===0&&з4.вернулась.раз>=2&&з4.снято,з4);

 /* ── З5. Громкость по замеру и «динамик телефона» ── */
 const з5=await page.evaluate(async()=>{
  const спим=мс=>new Promise(z=>setTimeout(z,мс));const r={};
  const k=Object.values(ПОПРАВКА_ГРОМКОСТИ);r.поправок=k.length;r.вПределах=k.every(x=>x>=0.5&&x<=2);
  /* поправка доходит до плеера: файл с поправкой, громкость до и после */
  /* громкость с поправкой и без неё — подряд, тем же путём (прочие множители те же) */
  const [файл,кф]=Object.entries(ПОПРАВКА_ГРОМКОСТИ).find(([f,x])=>x<0.9)||[];r.файл=файл;r.кф=кф;
  const гр=(петля)=>{const e=Bank.make(файл,0.5,петля,1);const v=e&&e.volume;try{Bank.kill(e);}catch(_){}return v;};
  const с=гр(false),пс=гр(true);delete ПОПРАВКА_ГРОМКОСТИ[файл];const без=гр(false),пбез=гр(true);ПОПРАВКА_ГРОМКОСТИ[файл]=кф;
  r.отношение=без>0?с/без:null;r.петля=[пс,пбез];
  /* «динамик телефона»: на телефоне включён сам; одиночные звуки из памяти — через сжатие */
  r.телефон=Телефон.телефон();r.включён=settings.phoneSpeaker;
  const ctx=AE.ensure&&AE.ensure();r.узел=!!(ctx&&Телефон.выход(ctx));
  r.флажок=(()=>{const f=document.getElementById("setPhoneSpk");return f?f.checked:null;})();
  settings.phoneSpeaker=0;Телефон.применить();r.выкл=!Телефон.вкл();settings.phoneSpeaker=1;Телефон.применить();
  return r;});
 check('З5. поправки громкости записей по замеру: больше тысячи файлов, каждая в пределах ±6 дБ',з5.поправок>1000&&з5.вПределах,{поправок:з5.поправок});
 check('З5. поправка доходит до плеера одиночного звука, а петля идёт без неё',
  !!з5.файл&&Math.abs(з5.отношение-з5.кф)<0.03&&з5.петля[0]===з5.петля[1],з5);
 check('З5. на телефоне «динамик телефона» включён сам, флажок в настройках отмечен, сжатие стоит на выходе звуков из памяти',
  з5.телефон===true&&з5.включён===1&&з5.узел&&з5.флажок===true&&з5.выкл,з5);

 /* на компьютере «динамик телефона» по умолчанию выключен */
 const ctxПК=await browser.newContext();const pПК=await ctxПК.newPage();
 await pПК.goto(process.argv[2]);await pПК.waitForTimeout(900);
 const пк=await pПК.evaluate(()=>({телефон:Телефон.телефон(),включён:settings.phoneSpeaker}));await ctxПК.close();
 check('З5. на компьютере «динамик телефона» по умолчанию выключен',пк.телефон===false&&пк.включён===0,пк);

 /* ── З2, З3, З6, Р1, Р2, З1 — коротко ── */
 const ост=await page.evaluate(async()=>{
  const спим=мс=>new Promise(z=>setTimeout(z,мс));const o={};
  /* З2: в ярусе фон поверхности снят сразу, без тика часов */
  G.place=null;Scape.bedKind=null;safeFn(()=>Scape.bed());
  G.place={bx:31,by:37,stype:"ruins",depth:3,x:2,y:2,name:"Проба яруса",kind:"dungeon"};bankUpdateAmbient();
  o.фонВЯрусе=Bank.loops.has("scape")?(Bank.loops.get("scape").role||"есть"):null;G.place=null;bankUpdateAmbient();
  /* З3: итог звука */
  const e1=Bank.play("hit_air",{gain:0.01});const e3=Bank.play("нет_такой_роли",{gain:0.01});
  o.итог=[e1&&e1.__итог,Bank.итог];
  /* Р1: пачка вестей мира не тянется хвостом */
  const a0=Speech._adapter;const сказано=[];
  Speech._adapter=()=>({name:"fake",speak(t,op){сказано.push(t);setTimeout(()=>op.onend&&op.onend(),600);return true;},cancel(){},speaking(){return false;}});
  for(let i=0;i<12;i++){narrate(`Событие мира номер ${i+1}.`,{interrupt:false});await спим(100);}
  await спим(5000);Speech._adapter=a0;o.пачка=сказано.slice();
  /* Р2: шаблон «метка: значение» — как прежде; сырой разбор сохранён */
  o.р2=typeof Speech.gvPartsRaw==="function";
  /* З1: второй раз звук — из памяти */
  const роль="hit_air";
  /* первый раз запись раскодируется в память (у роли несколько вариантов — берём первый); второй — играет из памяти */
  const url=Bank.url(SOUND_BANK[роль].f[0]);ПамятьЗвука.загрузить(url);for(let i=0;i<50&&!ПамятьЗвука.взять(url);i++)await спим(100);
  const из=Bank.make(SOUND_BANK[роль].f[0],0.01,false,1);o.изПамяти=!!(из&&из.__память);try{Bank.kill(из);}catch(_){}
  /* З6: окно журнала и текст для сохранения */
  CMD.rzjournal();o.окно=!!activeLayer();while(activeLayer())closeTopUI();
  const т=ЖурналРЗ.текст();o.журнал=/журнал речи и звука/.test(т)&&/Речь:/.test(т)&&/Звук:/.test(т);
  return o;});
 check('З2. при входе в ярус фон поверхности снят сразу',!ост.фонВЯрусе||!/amb_day|amb_night|amb_wind|amb_water|amb_desert/.test(ост.фонВЯрусе),ост.фонВЯрусе);
 check('З3. у звука есть итог: «звучит» у сыгранного, «нет записи» у несуществующей роли',
  /звучит|вокруг/.test(String(ост.итог[0]))&&/нет записи|не дано/.test(String(ост.итог[1]&&ост.итог[1].итог||ост.итог[1])),ост.итог);
 check('Р1. пачка из двенадцати вестей мира не тянется хвостом: звучит не больше половины',ост.пачка.length>=1&&ост.пачка.length<=6,ост.пачка);
 check('Р2, З1, З6: сырой разбор сохранён; звук второй раз играет из памяти; окно журнала открывается, текст для сохранения полный',
  ост.р2&&ост.изПамяти&&ост.окно&&ост.журнал,ост);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
