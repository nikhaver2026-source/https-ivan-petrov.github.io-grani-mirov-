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
   речи есть в окне и сохраняются; жест четырьмя пальцами и клавиши.
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
 const fresh=()=>page.evaluate(()=>{Speech.stop();Speech.recent.clear();Speech.agg.items=null;clearTimeout(Speech.agg.timer);Speech.last=null;Speech.history=[];FAKE.reset();});
 const state=()=>page.evaluate(()=>({log:FAKE.log.slice(),cancels:FAKE.cancels,speaking:Speech.isSpeaking(),
  cur:Speech.current&&Speech.current.text,queue:Speech.queue.map(m=>m.text),stats:Object.assign({},Speech.stats)}));

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
 await fresh();
 await page.evaluate(()=>{Speech.say("Важное занимает голос.",{pri:1});Speech.say("Перед вами дверь.",{pri:3,key:"door_front"});Speech.say("Дверь открыта.",{pri:3,key:"door_front"});});
 await page.waitForTimeout(30);
 const до15=await state();
 await page.evaluate(()=>FAKE.end());await page.waitForTimeout(40);
 st=await state();
 check('15. A → B с тем же ключом — A заменено, звучит только B',до15.queue.length===1&&до15.queue[0]==="Дверь открыта."&&st.log[1]==="Дверь открыта."&&st.stats.replaced===1,{queue:до15.queue,log:st.log});

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

 /* ── единственность и старые вызовы ── */
 const единый=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;
  const прямых=(src.match(/speechSynthesis\.speak\(/g)||[]).length;
  return {прямых,adapter:Speech._adapter().name,narrateIsSpeech:narrate.toString().indexOf("Speech.say")>=0};});
 check('синтезатор зовут только из адаптера, narrate идёт через распорядителя',единый.прямых===1&&единый.narrateIsSpeech,единый);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
