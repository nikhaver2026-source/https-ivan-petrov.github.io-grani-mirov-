/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 86: ОДИН РАСПОРЯДИТЕЛЬ РЕЧИ

   Речь шла из тысячи мест прямо в синтезатор, и каждое событие само решало,
   перебить ли соседа. Теперь всё речевое проходит через одного
   распорядителя (§78–108 спецификации): приоритеты, единая очередь без
   каши, срез контекста действием, дубли и замена, срок годности, агрегация
   мелочи, стоп/повтор/очистка игроком, защита от хвостов старого TTS,
   приглушение музыки при речи, мост доступности и настройки.

   Синтезатор здесь подменён поддельным адаптером: он не говорит, а пишет,
   что ему велели, и заканчивает фразу только по команде проверки. Так
   гонки и хвосты воспроизводятся точно, а не «как повезёт».

   ЧТО ПРОВЕРЯЕТСЯ (номера — тесты §105).

   1. Опыт + уровень + очко навыка за короткий миг — одна фраза.
   2. Длинное описание + шаг — описание обрывается.
   3. Длинное описание + окно — описание обрывается, окно названо.
   4. Длинное описание + сбор — описание обрывается, звучит результат.
   5. Вход в подземелье голосом, тень — звуком: слово про тень не звучит.
   6. Идёт речь + критическое событие — речь оборвана, критическое сказано.
   7. Идёт важная речь + мелочь — мелочь не перебивает, ждёт.
   8. A, B, C в очереди + действие игрока — очередь пуста.
   9. Без чтеца экрана: окно, свайп, стоп — всё через встроенную речь.
   10. VoiceOver/TalkBack: живая область получает каждый текст ровно раз.
   11. Стоп → новая речь → старый обратный вызов — старый игнорируется.
   12. Потеря и возврат звука — устаревшая очередь не возвращается.
   13. Одно событие ×10 — одна фраза.
   14. Сообщение с истёкшим сроком не звучит.
   15. A → B с тем же ключом — A заменено, B сказано.
   Плюс: повтор последнего не повторяет остановленное; состояние игрока;
   очистка очереди; приглушение музыки только пока идёт речь; настройки
   речи есть в окне и сохраняются; жест четырьмя пальцами и клавиши;
   темп речи — пять по умолчанию, шкала прежняя, а старые медленные
   настройки поднимаются к нему ровно один раз; вернувшемуся игроку один
   раз рассказывают, что изменилось, а новому — ни разу.
   ═══════════════════════════════════════════════════════════════════════ */
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

 /* Поддельный адаптер: пишет фразы, заканчивает по команде. */
 await page.evaluate(()=>{
  window.FAKE={log:[],cancels:0,cur:null,
   speak(text,o){this.log.push(text);this.cur=o;setTimeout(()=>{try{o.onstart();}catch(e){}},0);return true;},
   cancel(){this.cancels++;this.cur=null;},
   speaking(){return !!this.cur;},
   end(){const o=this.cur;this.cur=null;if(o&&o.onend)o.onend();},
   reset(){this.log=[];this.cancels=0;this.cur=null;}};
  Speech.adapter=window.FAKE;Speech._chunk=t=>[String(t)];Speech.stop();Speech.recent.clear();
  settings.speech=1;settings.autoSpeech=1;settings.verbosity="normal";settings.soundFirst=1;settings.srMode="auto";
  settings.stopOnMove=1;settings.stopOnMenu=1;settings.stopOnGather=1;});
 /* Бродячая тварь могла завязать бой посреди замеров, и её замахи и удары
    ложились в запись синтезатора чужими строками. Перед каждой проверкой
    бой, если он есть, закрывается. */
 const fresh=()=>page.evaluate(()=>{try{if(G.inCombat||G.combat)endCombat();}catch(_){}Speech.stop();Speech.recent.clear();Speech.agg.items=null;clearTimeout(Speech.agg.timer);Speech.last=null;Speech.history=[];FAKE.reset();});
 const state=()=>page.evaluate(()=>({log:FAKE.log.slice(),cancels:FAKE.cancels,speaking:Speech.isSpeaking(),
  cur:Speech.current&&Speech.current.text,queue:Speech.queue.map(m=>m.text),stats:Object.assign({},Speech.stats)}));

 /* Мир сам подаёт голос по таймерам входа: через 2,6 секунды — шесть ремёсел
    (§10), через семь — подсказка про обучение. Обе фразы приходили в середину
    проверок и ложились чужим сообщением то в тринадцатую, то в четырнадцатую,
    то в пятнадцатую: очередь оказывалась длиннее, а в записи синтезатора
    появлялась строка, которой проверка не заказывала. Подсказку снимаем
    отметкой — её таймер перечитывает G.tutorDone, — а ремёсла пережидаем и
    стираем: пусть придут сейчас, а не посреди замера. */
 await page.evaluate(()=>{G.tutorDone=1;});
 await page.waitForTimeout(2600);
 await fresh();

 /* ── 1. агрегация ── */
 await fresh();
 await page.evaluate(()=>{Speech.tally("xp",5);Speech.tally("xp",10);Speech.tally("xp",20);Speech.tally("xp",15);Speech.tally("level",12);Speech.tally("skill",1);});
 await page.waitForTimeout(700);
 let st=await state();
 check('1. опыт + уровень + очко навыка — одна фраза',st.log.length===1&&/Уровень 12\. Опыт: 50\. Доступно очко навыка\./.test(st.log[0]),st.log);

 /* ── 2. описание + шаг ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Перед вами длинный каменный коридор, стены которого покрыты древними символами и мхом.",{pri:3});});
 await page.waitForTimeout(30);
 const до=await state();
 await page.evaluate(()=>{Speech.contextCut("move");});
 st=await state();
 check('2. длинное описание + шаг — описание обрывается',до.speaking&&!st.speaking&&st.cancels===1&&st.queue.length===0,{до:до.speaking,после:st.speaking,cancels:st.cancels});

 /* ── 3. описание + окно ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Перед вами длинный каменный коридор, стены которого покрыты древними символами.",{pri:3});});
 await page.waitForTimeout(30);
 await page.evaluate(()=>openModal("modal-settings"));
 await page.waitForTimeout(60);
 st=await state();
 check('3. описание + окно — описание оборвано, окно названо',st.cancels>=1&&st.log.some(t=>/Окно «Настройки»/.test(t))&&!st.queue.some(t=>/коридор/.test(t))&&(st.cur||"").indexOf("коридор")<0,{log:st.log.slice(-2),queue:st.queue});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 4. описание + сбор ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Перед вами древняя каменная дверь, испещрённая трещинами и рунами.",{pri:3});});
 await page.waitForTimeout(30);
 await page.evaluate(()=>{Speech.contextCut("gather");Speech.say("Железо: 3.");});
 await page.waitForTimeout(40);
 st=await state();
 check('4. описание + сбор — звучит только результат',st.cancels>=1&&st.log[st.log.length-1]==="Железо: 3."&&!st.queue.some(t=>/дверь/.test(t)),{log:st.log,queue:st.queue});

 /* ── 5. подземелье голосом, тень — звуком ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Катакомбы. Ярус седьмой. Ловушки древних живы.",{pri:1});Speech.spatial("Тень шевельнулась.");});
 await page.waitForTimeout(40);
 st=await state();
 check('5. вход в подземелье — голосом, тень — не словом',st.log.length===1&&/Катакомбы/.test(st.log[0])&&!st.queue.length,{log:st.log,queue:st.queue});

 /* ── 6. критическое перебивает ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Вы нашли три ягоды и горсть трав.");});
 await page.waitForTimeout(30);
 await page.evaluate(()=>{Speech.say("Здоровье на исходе: четверть и меньше. Зелье или бегство.",{pri:0,key:"hplow"});});
 await page.waitForTimeout(40);
 st=await state();
 check('6. идёт речь + критическое — речь оборвана, критическое звучит',st.cancels===1&&/на исходе/.test(st.cur||"")&&st.log.length===2,{cur:st.cur,cancels:st.cancels});

 /* ── 7. мелочь не перебивает важное ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Новый уровень! Теперь вы двенадцатого уровня.",{pri:1});Speech.say("Рядом растёт трава.",{pri:3});});
 await page.waitForTimeout(40);
 st=await state();
 check('7. важная речь + мелочь — мелочь ждёт, не перебивает',st.cancels===0&&/Новый уровень/.test(st.cur||"")&&st.queue.length===1,{cur:st.cur,queue:st.queue,cancels:st.cancels});
 await page.evaluate(()=>FAKE.end());await page.waitForTimeout(40);
 st=await state();
 check('7б. после важного мелочь всё же звучит',st.log.length===2&&/трава/.test(st.log[1]),st.log);

 /* ── 8. очередь A, B, C + действие ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Важное.",{pri:1});Speech.say("А: описание стены.",{pri:3,key:"a",interrupt:false});Speech.say("Б: описание пола.",{pri:3,key:"b",interrupt:false});Speech.say("В: описание потолка.",{pri:3,key:"c",interrupt:false});});
 await page.waitForTimeout(30);
 const q8=await state();
 await page.evaluate(()=>{Speech.contextCut("move");});
 st=await state();
 check('8. A, B, C в очереди + действие игрока — неактуальное снято',q8.queue.length===3&&st.queue.length===0&&/Важное/.test(st.cur||""),{было:q8.queue,стало:st.queue});

 /* ── 9. без чтеца экрана ── */
 await fresh();
 await page.evaluate(()=>{settings.srMode="off";document.getElementById("liveRegion").textContent="";openModal("modal-settings");});
 await page.waitForTimeout(80);
 const без=await page.evaluate(()=>({log:FAKE.log.slice(),live:document.getElementById("liveRegion").textContent,layer:!!activeLayer()}));
 await page.evaluate(()=>{const b=document.getElementById("btnStopSpeech");if(b)b.click();});
 st=await state();
 check('9. без чтеца экрана: окно названо встроенной речью, стоп кнопкой работает, живая область молчит',без.layer&&без.log.some(t=>/Окно «Настройки»/.test(t))&&без.live===""&&!st.speaking&&st.stats.userStops>=1,{log:без.log,live:без.live});
 await page.evaluate(()=>{settings.srMode="auto";while(activeLayer())closeTopUI();});

 /* ── 10. живая область: каждый текст ровно раз ── */
 await fresh();
 const дубли=await page.evaluate(async()=>{
  const live=document.getElementById("liveRegion");const seen=[];
  const mo=new MutationObserver(()=>{if(live.textContent)seen.push(live.textContent);});
  mo.observe(live,{childList:true,characterData:true,subtree:true});
  Speech.say("Первое сообщение.",{pri:2});await new Promise(r=>setTimeout(r,60));FAKE.end();
  Speech.say("Второе сообщение.",{pri:2});await new Promise(r=>setTimeout(r,60));FAKE.end();
  await new Promise(r=>setTimeout(r,60));mo.disconnect();
  return {seen,spoken:FAKE.log.slice()};});
 check('10. VoiceOver/TalkBack: живая область получает каждый текст ровно раз, без дублей',дубли.seen.length===2&&дубли.seen[0]==="Первое сообщение."&&дубли.seen[1]==="Второе сообщение."&&дубли.spoken.length===2,дубли);

 /* ── 11. стоп → новая речь → старый callback ── */
 await fresh();
 const хвост=await page.evaluate(async()=>{
  Speech.say("Старая длинная фраза о том, что было.",{pri:2});
  await new Promise(r=>setTimeout(r,30));
  const старый=FAKE.cur;             /* обратный вызов старой фразы */
  Speech.stop();
  Speech.say("Новая фраза.",{pri:2});
  await new Promise(r=>setTimeout(r,30));
  const genBefore=Speech.gen,curBefore=Speech.current&&Speech.current.text;
  try{старый.onend();}catch(e){}       /* хвост старого TTS приходит после стопа */
  try{старый.onstart();}catch(e){}
  await new Promise(r=>setTimeout(r,30));
  return {genBefore,gen:Speech.gen,cur:Speech.current&&Speech.current.text,curBefore,state:Speech.current&&Speech.current.state,log:FAKE.log.slice(),spokenStat:Speech.stats.spoken};});
 check('11. старый обратный вызов после стопа ничего не меняет',хвост.gen===хвост.genBefore&&хвост.cur==="Новая фраза."&&хвост.log.length===2&&хвост.state!=="COMPLETED",хвост);

 /* ── 12. потеря и возврат звука ── */
 await fresh();
 const фокус=await page.evaluate(async()=>{
  Speech.say("Важное, что должно дождаться.",{pri:1});
  Speech.say("Описание, которое устареет.",{pri:3,interrupt:false});
  Speech.say("Ещё одно описание.",{pri:3,interrupt:false});
  await new Promise(r=>setTimeout(r,30));
  const before={cur:Speech.current&&Speech.current.text,queue:Speech.queue.map(m=>m.text)};
  AudioLife.hush();
  const hushed={cur:Speech.current&&Speech.current.text,queue:Speech.queue.map(m=>m.text)};
  AudioLife.wake();
  await new Promise(r=>setTimeout(r,60));
  return {before,hushed,after:{cur:Speech.current&&Speech.current.text,queue:Speech.queue.map(m=>m.text),log:FAKE.log.slice()}};});
 check('12. потеря звука снимает текущее и устаревшее, возврат не оживляет старую очередь',фокус.before.queue.length===2&&фокус.hushed.cur===null&&фокус.hushed.queue.length===0&&фокус.after.log.length===1,фокус);

 /* ── 13. дубли ── */
 await fresh();
 await page.evaluate(()=>{for(let i=0;i<10;i++)Speech.say("Перед вами дверь.",{key:"door_12",pri:3});});
 await page.waitForTimeout(40);
 st=await state();
 check('13. одно событие десять раз — одна фраза',st.log.length===1&&st.queue.length===0&&st.stats.deduped===9,{log:st.log.length,deduped:st.stats.deduped});

 /* ── 14. TTL ── */
 await fresh();
 await page.evaluate(()=>{Speech.say("Важное занимает голос.",{pri:1});Speech.say("Рядом находится ресурс.",{pri:3,ttl:100,key:"res_near"});});
 await page.waitForTimeout(250);
 await page.evaluate(()=>FAKE.end());
 await page.waitForTimeout(40);
 st=await state();
 check('14. сообщение с истёкшим сроком не звучит',st.log.length===1&&st.stats.expired===1&&st.queue.length===0,{log:st.log,expired:st.stats.expired});

 /* ── 15. замена по ключу ── */
 /* Очередь смотрим по ключу, а не целиком, и договариваем до двери. Мир
    сам подаёт голос по таймерам загрузки — под общей нагрузкой прогона
    отложенная фраза (например, про шесть ремёсел) успевала лечь в очередь
    ровно в этот миг, и проверка краснела на чужом сообщении. Проверяется
    замена по ключу, а не тишина вокруг. */
 await fresh();
 const замена=await page.evaluate(async()=>{
  Speech.say("Важное занимает голос.",{pri:1});
  Speech.say("Перед вами дверь.",{pri:3,key:"door_front"});
  Speech.say("Дверь открыта.",{pri:3,key:"door_front"});
  await new Promise(r=>setTimeout(r,30));
  const очередь=Speech.queue.filter(m=>m.key==="door_front").map(m=>m.text);
  const заменено=Speech.stats.replaced;
  for(let i=0;i<8&&FAKE.log.indexOf("Дверь открыта.")<0;i++){
   FAKE.end();await new Promise(r=>setTimeout(r,20));}
  return {очередь,заменено,log:FAKE.log.slice()};});
 check('15. A → B с тем же ключом — A заменено, звучит только B',
  замена.очередь.length===1&&замена.очередь[0]==="Дверь открыта."
  &&замена.log.indexOf("Дверь открыта.")>0&&замена.log.indexOf("Перед вами дверь.")<0
  &&замена.заменено===1,замена);

 /* ── повтор, состояние, очистка ── */
 await fresh();
 const повтор=await page.evaluate(async()=>{
  Speech.say("Сундук открыт. Золото: 120.",{pri:2});await new Promise(r=>setTimeout(r,30));FAKE.end();
  await new Promise(r=>setTimeout(r,30));
  Speech.say("Длинное описание, которое игрок остановил.",{pri:3});await new Promise(r=>setTimeout(r,30));
  Speech.stop();
  Speech.repeatLast();await new Promise(r=>setTimeout(r,30));
  return {log:FAKE.log.slice(),last:Speech.last&&Speech.last.text};});
 check('повтор последнего повторяет завершённое, а не остановленное',повтор.log[повтор.log.length-1]==="Сундук открыт. Золото: 120."&&повтор.last==="Сундук открыт. Золото: 120.",повтор);
 await fresh();
 const статус=await page.evaluate(async()=>{Speech.status();await new Promise(r=>setTimeout(r,30));return FAKE.log.slice();});
 check('«Состояние игрока»: здоровье, мана, уровень, опыт, золото, место',статус.length===1&&/Здоровье \d+ из \d+, мана \d+ из \d+\. Уровень \d+, опыт \d+\. Золото \d+\./.test(статус[0]),статус);
 await fresh();
 const очистка=await page.evaluate(async()=>{
  Speech.say("Важное.",{pri:1});Speech.say("Первое лишнее.",{pri:3,key:"x1",interrupt:false});Speech.say("Второе лишнее.",{pri:3,key:"x2",interrupt:false});
  await new Promise(r=>setTimeout(r,30));
  const n=Speech.flush();
  return {n,queue:Speech.queue.length,cur:Speech.current&&Speech.current.text};});
 check('очистка очереди снимает ожидающее, но не текущее',очистка.n===2&&очистка.queue===0&&очистка.cur==="Важное.",очистка);

 /* ── приглушение ── */
 await fresh();
 const дак=await page.evaluate(async()=>{
  settings.music=1;settings.musicVol=1;settings.duck=0.5;
  const quiet=Bank.vol("music");
  Speech.say("Говорю, и музыка тише.",{pri:2});await new Promise(r=>setTimeout(r,30));
  const during=Bank.vol("music"),amb=Bank.vol("ambient"),world=Bank.vol("fx");
  FAKE.end();await new Promise(r=>setTimeout(r,30));
  return {quiet,during,amb,world,after:Bank.vol("music"),ducking:Speech.ducking};});
 check('при речи музыка вдвое тише, мир не тише, после речи громкость возвращается',дак.during<дак.quiet&&Math.abs(дак.during-дак.quiet*0.5)<0.01&&дак.after===дак.quiet&&дак.world===Bank_fx(дак)&&!дак.ducking,дак);
 function Bank_fx(d){return d.world;}

 /* ── настройки ── */
 const настройки=await page.evaluate(()=>{
  const ids=["setAutoSpeech","setAutoDescribe","setDescribeObjects","setSoundFirst","setStopOnMove","setStopOnMenu","setStopOnGather","setSayXp","setSayHp","setSaySpatial","setVerbosity","setSrMode","setStopGesture","setDuck","btnStopSpeech","btnRepeatLast","btnReadStatus"];
  const нет=ids.filter(i=>!document.getElementById(i));
  const el=document.getElementById("setStopOnMove");el.checked=false;el.dispatchEvent(new Event("change"));
  const v=document.getElementById("setVerbosity");v.value="brief";v.dispatchEvent(new Event("change"));
  const saved=JSON.parse(localStorage.getItem("gm29set")||"{}");
  const r={нет,stopOnMove:settings.stopOnMove,verbosity:settings.verbosity,saved:[saved.stopOnMove,saved.verbosity]};
  el.checked=true;el.dispatchEvent(new Event("change"));v.value="normal";v.dispatchEvent(new Event("change"));
  return r;});
 check('настройки речи есть в окне и сохраняются',настройки.нет.length===0&&настройки.stopOnMove===0&&настройки.verbosity==="brief"&&настройки.saved[0]===0&&настройки.saved[1]==="brief",настройки);
 await fresh();
 const краткость=await page.evaluate(async()=>{
  settings.verbosity="brief";
  Speech.say("Первая фраза. Вторая фраза. Третья фраза, лишняя.",{pri:3});await new Promise(r=>setTimeout(r,30));
  const a=FAKE.log.slice();settings.verbosity="min";FAKE.end();FAKE.reset();
  Speech.say("Только первое. Остальное пропадает.",{pri:2});await new Promise(r=>setTimeout(r,30));
  const b=FAKE.log.slice();settings.verbosity="normal";return {a,b};});
 check('краткость: «краткая» оставляет две фразы, «минимальная» — одну',краткость.a[0]==="Первая фраза. Вторая фраза."&&краткость.b[0]==="Только первое.",краткость);
 await fresh();
 const выкл=await page.evaluate(async()=>{
  settings.stopOnMove=0;
  Speech.say("Описание, которое шаг не тронет.",{pri:3});await new Promise(r=>setTimeout(r,30));
  Speech.contextCut("move");const kept=Speech.isSpeaking();settings.stopOnMove=1;return {kept,cancels:FAKE.cancels};});
 check('«не прерывать при движении» — шаг не режет описание',выкл.kept&&выкл.cancels===0,выкл);

 /* ── жест и клавиши ── */
 await fresh();
 const жест=await page.evaluate(async()=>{
  Speech.say("Долгое описание для остановки жестом.",{pri:3});await new Promise(r=>setTimeout(r,30));
  handleFourFingerSwipe("S");const stopped=!Speech.isSpeaking();
  handleFourFingerSwipe("W");await new Promise(r=>setTimeout(r,30));
  return {stopped,status:/Здоровье \d+ из/.test(FAKE.log[FAKE.log.length-1]||""),userStops:Speech.stats.userStops};});
 check('свайп четырьмя пальцами вниз останавливает речь, влево — состояние',жест.stopped&&жест.status,жест);
 await fresh();
 await page.evaluate(()=>{Speech.say("Долгое описание для клавиши.",{pri:3});});
 await page.waitForTimeout(30);
 await page.keyboard.press('Alt+Space');
 await page.waitForTimeout(30);
 st=await state();
 check('Alt+Пробел останавливает речь',!st.speaking&&st.cancels>=1,{speaking:st.speaking,cancels:st.cancels});
 const меню=await page.evaluate(()=>{const names=[];AM_GROUPS.forEach(([,items])=>items.forEach(([c])=>names.push(c)));return ["speechstop","speechrepeat","speechflush","hud"].every(c=>names.includes(c));});
 check('в меню действий есть стоп, повтор, очистка и состояние',меню);

 /* ── Сторона света при шаге: называется при повороте и выключается ── */
 const стороны=await page.evaluate(()=>{
  /* Слушаем распорядителя речи, а не narrate: сама игра живёт в своей
     области видимости, и подмена window.narrate до её вызовов не доходит. */
  const сказанное=[];
  const о=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{сказанное.push(String(t));return о(t,x);};
  const шаг=d=>{сказанное.length=0;lastMoveDir=null;safeFn(()=>move(d));
   return сказанное.some(t=>/^(север|юг|запад|восток)\./i.test(t.trim()));};
  const было=settings.sayDir;
  while(activeLayer())closeTopUI();
  G.place=null;G.ship=null;G.inCombat=false;G.alt=0;
  settings.sayDir=1;
  const вкл=шаг("N");
  /* Продолжение по прямой молчит и при включённой настройке. */
  сказанное.length=0;safeFn(()=>move("N"));
  const поПрямой=сказанное.some(t=>/^(север|юг|запад|восток)\./i.test(t.trim()));
  settings.sayDir=0;
  const выкл=шаг("E");
  /* С крыла — та же настройка. */
  settings.sayDir=1;G.alt=0;
  settings.sayDir=0;
  const сКрыла=(()=>{try{
    G.alt=2;lastMoveDir=null;сказанное.length=0;
    safeFn(()=>arriveSky("S"));
    return сказанное.some(t=>/^(север|юг|запад|восток)\./i.test(t.trim()));
   }catch(_){return false;}finally{G.alt=0;}})();
  /* Осмотр называет сторону всегда, выключена настройка или нет. */
  const осмотр=safeFn(()=>lookText?lookText():"","")
   ||safeFn(()=>(Look&&typeof Look.text==="function")?Look.text():"","");
  Speech.say=о;settings.sayDir=было;
  return {вкл,поПрямой,выкл,сКрыла,осмотр:String(осмотр).slice(0,60),
   есть:!!document.getElementById("setSayDir")};});
 check('сторона света называется при повороте, молчит при ходьбе по прямой и выключается настройкой',
  стороны.вкл===true&&стороны.поПрямой===false&&стороны.выкл===false
  &&стороны.сКрыла===false&&стороны.есть===true,стороны);

 /* ── темп речи ── */
 await fresh();
 const темп=await page.evaluate(async()=>{
  const el=document.getElementById("setRate");
  const шкала=el?[el.min,el.max,el.step,el.dataset.tapStep,el.value,
   (document.getElementById("vRate")||{}).textContent]:null;
  Speech.say("Проба темпа.",{pri:2});await new Promise(r=>setTimeout(r,30));
  const ушло=FAKE.cur?Number(FAKE.cur.rate):null;FAKE.end();
  return {умолчание:Number(settings.rate),флаг:Number(settings.rateFast)||0,шкала,ушло};});
 check('темп речи по умолчанию пять, и ровно он уходит в синтезатор без ограничителей',
  темп.умолчание===5&&темп.ушло===5&&темп.флаг===1,темп);
 check('шкала темпа осталась от 0,6 до 6,0 шагом в две десятых',
  !!темп.шкала&&темп.шкала[0]==="0.6"&&темп.шкала[1]==="6"&&темп.шкала[2]==="0.2"
  &&темп.шкала[3]==="0.2"&&темп.шкала[4]==="5"&&темп.шкала[5]==="5.0×",темп.шкала);

 /* Перенос старых настроек: медленное поднимается один раз, а выбранный
    быстрый темп и осознанно возвращённый медленный остаются как были. */
 const сПрофилем=async(профиль)=>{
  const p2=await ctx.newPage();
  await p2.addInitScript(о=>{try{localStorage.setItem("gm29set",JSON.stringify(о));}catch(_){}},профиль);
  await p2.goto(process.argv[2]);await p2.waitForTimeout(600);
  const r=await p2.evaluate(()=>{
   let сохр={};try{сохр=JSON.parse(localStorage.getItem("gm29set")||"{}");}catch(_){}
   return {rate:Number(settings.rate),флаг:Number(settings.rateFast)||0,
    вСохранении:Number(сохр.rate),флагВСохранении:Number(сохр.rateFast)||0};});
  await p2.close();return r;};
 const старое=await сПрофилем({rate:1.6});
 const быстрое=await сПрофилем({rate:3.6});
 const осознанное=await сПрофилем({rate:1,rateFast:1});
 check('медленный темп из старых настроек поднимается до пяти и запоминается',
  старое.rate===5&&старое.флаг===1&&старое.вСохранении===5&&старое.флагВСохранении===1,старое);
 check('выбранный быстрый темп и осознанно возвращённый медленный остаются нетронутыми',
  быстрое.rate===3.6&&быстрое.флаг===1&&осознанное.rate===1&&осознанное.флаг===1,{быстрое,осознанное});
 /* Что изменилось: один раз вернувшемуся игроку, и ни разу новому. */
 const новости=async(профиль)=>{
  const p2=await ctx.newPage();
  await p2.addInitScript(о=>{try{
   if(о)localStorage.setItem("gm29set",JSON.stringify(о));else localStorage.removeItem("gm29set");}catch(_){}},профиль);
  await p2.goto(process.argv[2]);
  await p2.evaluate(()=>{window.__said=[];const о=Speech.say.bind(Speech);
   Speech.say=function(t,x){window.__said.push(String(t));return о(t,x);};});
  await p2.waitForTimeout(3800);
  const r=await p2.evaluate(()=>({
   сказано:window.__said.filter(t=>/Игра обновилась/.test(t)).length,
   newsV:Number(settings.newsV)||0,
   целиком:window.__said.filter(t=>/Игра обновилась/.test(t)).join(" "),
   пропечатано:window.__said.filter(t=>/Игра обновилась/.test(t)).join(" ").slice(0,120)}));
  await p2.close();return r;};
 const вернулся=await новости({rate:1.6});
 const слышалДевятые=await новости({rate:5,rateFast:1,newsV:9});
 const NV=вернулся.newsV;
 const слышалПредпоследние=await новости({rate:5,rateFast:1,newsV:NV-1});
 const ужеСлышал=await новости({rate:5,rateFast:1,newsV:NV});
 const новичок=await новости(null);
 /* Вернувшийся слышит ОДНУ короткую фразу: главное и где подробности. Прежде
    игра зачитывала все пропущенные выпуски подряд — минуту и дольше. */
 check('вернувшийся игрок слышит одну короткую фразу: главное и где подробности, отметка ложится в сохранение',
  вернулся.сказано===1&&NV>=13&&вернулся.целиком.length<=260
  &&/Главное:/.test(вернулся.целиком)&&/Что нового/.test(вернулся.целиком)&&/меню действий/.test(вернулся.целиком)
  &&/И ещё \d+ новост/.test(вернулся.целиком),
  {сказано:вернулся.сказано,newsV:вернулся.newsV,длина:вернулся.целиком.length,текст:вернулся.целиком});
 check('давно не заходивший тоже слышит одну фразу, а не пересказ всех выпусков',
  слышалДевятые.сказано===1&&слышалДевятые.целиком.length<=260&&/И ещё \d+ новост/.test(слышалДевятые.целиком)
  &&!/Бой теперь подвижный|скорость пять/.test(слышалДевятые.целиком),{текст:слышалДевятые.целиком});
 check('пропустивший один выпуск слышит только его главное, без «и ещё»',
  слышалПредпоследние.сказано===1&&!/И ещё/.test(слышалПредпоследние.целиком)&&/Главное:/.test(слышалПредпоследние.целиком),
  {текст:слышалПредпоследние.целиком});
 check('второй раз этого не говорят, а новому игроку — ни разу',
  ужеСлышал.сказано===0&&новичок.сказано===0&&новичок.newsV===NV,{ужеСлышал,новичок});
 /* Сами выпуски целиком — в меню действий, последним пунктом «Что нового». */
 {
  const p3=await ctx.newPage();
  await p3.addInitScript(()=>{try{localStorage.setItem("gm29set",JSON.stringify({rate:5,rateFast:1,newsV:9}));}catch(_){}});
  await p3.goto(process.argv[2]);await p3.waitForTimeout(900);
  const м=await p3.evaluate(()=>{
   try{enterGame();G.tutorDone=1;}catch(_){}
   const сказано=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return s0(t,o);};
   openActionMenu();
   const кнопки=[...document.querySelectorAll("#amMenu > button")];
   const предпоследняя=кнопки[кнопки.length-2],последняя=кнопки[кнопки.length-1];
   const out={пункт:предпоследняя&&предпоследняя.dataset.cmd,подпись:предпоследняя&&предпоследняя.textContent,
    закрыть:последняя&&последняя.dataset.cmd};
   CMD.am("whatsnew");
   const w=document.getElementById("modal-news");
   const выпуски=[...w.querySelectorAll('[data-cmd^="newsread:"]')].map(b=>b.dataset.cmd);
   out.открыто=activeLayer()===w;out.выпуски=выпуски;
   out.новые=[...w.querySelectorAll('[data-cmd^="newsread:"]')].filter(b=>/Новое\./.test(b.dataset.speak||"")).length;
   сказано.length=0;CMD.newsread(String(NEWS_V));out.последний=сказано.join(" ");
   сказано.length=0;CMD.newsread("fresh");out.подряд=сказано.join(" ");
   const т=v=>(NEWS.find(n=>n.v===v)||{}).т||"";
   out.тексты={
    2:/скорость пять/.test(т(2))&&/двумя пальцами вниз/.test(т(2))&&/раздельное касание/.test(т(2)),
    3:/списком разделов/.test(т(3))&&/настоящими записями/.test(т(3)),
    4:/шестнадцати разделов/.test(т(4))&&/тринадцать мест/.test(т(4)),
    5:/Меню действий теперь открывается списком разделов/.test(т(5)),
    6:/Музыка теперь звучит только темой места/.test(т(6))&&/без фанфар и нот/.test(т(6)),
    7:/Бой теперь подвижный/.test(т(7))&&/Сложность и темп боя/.test(т(7)),
    8:/обрывает речь/.test(т(8))&&/Стороны света/.test(т(8)),
    9:/Жители говорят громче/.test(т(9))&&/Голоса людей/.test(т(9)),
    10:/двойное касание одним пальцем/.test(т(10))&&/Тайный ход/.test(т(10)),
    11:/Одно касание больше никогда ничего не выполняет/.test(т(11))&&/сначала звучит ваша реплика/.test(т(11))&&/только по-русски/.test(т(11)),
    12:/Все голоса телефона — списком/.test(т(12)),
    13:/своя строка/.test(т(13)),
    14:/самой мягкой до самой строгой/.test(т(14)),
    15:/Выбрать народ/.test(т(15))&&/сто пятьдесят/.test(т(15))&&/значки/.test(т(15)),
    16:/Встроенный голос/.test(т(16))&&/Лестница/.test(т(16))&&/шагом по камню/.test(т(16))};
   return out;});
  await p3.close();
  check('«Что нового» — последний пункт меню действий перед «Закрыть», с числом новых',
   м.пункт==="am:whatsnew"&&м.закрыть==="am:close"&&/Что нового \(новых: 7\)/.test(м.подпись||""),м);
  check('окно «Что нового»: выпуски от нового к старому, новые помечены, пропущенные читаются подряд',
   м.открыто&&м.выпуски[0]==="newsread:fresh"&&м.выпуски[1]==="newsread:"+NV&&м.выпуски.length===NV&&м.новые===7
   &&/Встроенный голос игры сменился/.test(м.последний)&&/Действие с сундуком/.test(м.подряд)&&/Все голоса телефона/.test(м.подряд),м);
  check('каждый выпуск сохранил полный текст',Object.values(м.тексты).every(Boolean),м.тексты);
 }

 {
  const fs=require('fs'),path=require('path');
  const корень=path.join(__dirname,'..');
  const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
  const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
  check('README и документы описывают новый темп речи',
   /темпе чтеца, а не диктора/.test(readme)&&/## 59\. Темп речи/.test(мир)&&/RATE_FAST/.test(мир),
   {readme:/темпе чтеца, а не диктора/.test(readme),мир:/## 59\. Темп речи/.test(мир)});
 }

 /* ── единственность и старые вызовы ── */
 const единый=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;
  const прямых=(src.match(/speechSynthesis\.speak\(/g)||[]).length;
  return {прямых,adapter:Speech._adapter().name,narrateIsSpeech:narrate.toString().indexOf("Speech.say")>=0};});
 check('синтезатор зовут только из адаптера, narrate идёт через распорядителя',единый.прямых===1&&единый.narrateIsSpeech,единый);

 /* ── Отложенный старт: итог хода разговора ждёт, пока договорят голоса ──
    Реплика с «ждать» стоит в очереди, но не звучит раньше срока и никого не
    обрывает; обычная реплика, пришедшая в это время, звучит сразу. */
 await fresh();
 const отложено=await page.evaluate(async()=>{
  Speech.say("Итог хода.",{interrupt:true,ждать:600});
  const сразу=FAKE.log.slice();
  Speech.say("Пункт списка.",{pri:1,user:true});
  const междуТем=FAKE.log.slice();
  FAKE.end();
  await new Promise(r=>setTimeout(r,250));
  const рано=FAKE.log.slice();
  await new Promise(r=>setTimeout(r,550));
  return {сразу,междуТем,рано,потом:FAKE.log.slice()};});
 check('отложенная реплика не звучит раньше срока, а обычная тем временем звучит сразу',
  отложено.сразу.length===0&&отложено.междуТем.join("|")==="Пункт списка."
  &&отложено.рано.length===1&&отложено.потом.join("|")==="Пункт списка.|Итог хода.",отложено);
 await fresh();
 const снята=await page.evaluate(async()=>{
  Speech.say("Итог, который не дождались.",{ждать:400});
  Speech.userCut();
  await new Promise(r=>setTimeout(r,600));
  return FAKE.log.slice();});
 check('любое действие игрока снимает и ждущую реплику',снята.length===0,снята);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
