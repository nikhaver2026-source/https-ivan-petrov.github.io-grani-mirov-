/* ════════════════════════════════════════════════════════════════════════
   НАБОР 57: РАЗДЕЛЬНЫЕ КАНАЛЫ И ЖИЗНЕННЫЙ ЦИКЛ ЗВУКА

   Каналов было два: «музыка» и «всё остальное». Под «всем остальным» лежали
   разом шаги, твари, погода, ровный фон местности и писк меню — и приглушить
   надоевший фон, не оглушив при этом сигналы, было нельзя. Для зрячего это
   вопрос удобства; для того, кто играет на слух, фон и сигналы — разные
   инструменты, и сводить их одним ползунком всё равно что свести громкость
   речи и громкость музыки.

   Второе: игру держат в кармане. На неё приходит звонок, её сворачивают,
   гасят экран. Обработчиков на это не было вовсе — свёрнутая игра шумела
   лесом в наушниках, а на возврате отдавала приостановленный контекст и
   молчала, пока не ткнёшь в экран.

   Здесь проверяется, что каналов пять и они независимы, что неизвестный вид
   источника не проваливается в тишину, и что уход и возврат работают: петли
   встают на ПАУЗУ, а не убиваются, и продолжают с того же места.
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

 /* ── 1. Пять каналов, и неизвестное считается миром ──
    Слово kind приходит двумя путями: как имя канала и как вид источника из
    позиционного звука («house», «monster»). Новый вид источника должен
    зазвучать на общих правах, а не провалиться в тишину. */
 const каналы=await page.evaluate(()=>{
  const пары={music:"music",score:"music",ambient:"ambient",place:"ambient",
   ui:"ui",menu:"ui",fx:"world",world:"world"};
  const неверно=Object.keys(пары).filter(k=>Bank.chanOf(k)!==пары[k]);
  const чужие=["house","monster","city","caravan","guard","совсем-новый",undefined,null]
   .filter(k=>Bank.chanOf(k)!=="world");
  return {неверно,чужие:чужие.map(String),
   всего:[...new Set(Object.values(Bank.CHAN))].length};});
 check('каналов пять: голос отдельно, мир, фон, музыка и меню',каналы.всего>=4,каналы.всего);
 check('известные виды разложены по своим каналам',!каналы.неверно.length,каналы.неверно);
 check('неизвестный вид источника считается миром, а не тишиной',!каналы.чужие.length,каналы.чужие);

 /* ── 2. Громкости независимы ── */
 const громко=await page.evaluate(()=>{
  const было={e:settings.effects,m:settings.music,f:settings.fxVol,
   a:settings.ambVol,mv:settings.musicVol,u:settings.uiVol};
  settings.effects=1;settings.music=1;
  settings.fxVol=1;settings.ambVol=0.5;settings.musicVol=0.8;settings.uiVol=0.25;
  const раздельно={мир:Bank.vol("fx"),фон:Bank.vol("ambient"),
   музыка:Bank.vol("music"),меню:Bank.vol("ui")};
  settings.ambVol=0;
  const фонВНоль={фон:Bank.vol("ambient"),мир:Bank.vol("fx"),
   меню:Bank.vol("ui"),музыка:Bank.vol("music")};
  settings.ambVol=0.8;settings.effects=0;
  const безЭффектов={мир:Bank.vol("fx"),фон:Bank.vol("ambient"),
   меню:Bank.vol("ui"),музыка:Bank.vol("music")};
  settings.effects=1;settings.music=0;
  const безМузыки={музыка:Bank.vol("music"),мир:Bank.vol("fx")};
  Object.assign(settings,{effects:было.e,music:было.m,fxVol:было.f,
   ambVol:было.a,musicVol:было.mv,uiVol:было.u});
  return {раздельно,фонВНоль,безЭффектов,безМузыки};});
 check('у каждого канала своя громкость',
  громко.раздельно.мир===1&&громко.раздельно.фон===0.5&&
  громко.раздельно.музыка===0.8&&громко.раздельно.меню===0.25,громко.раздельно);
 check('фон можно убрать совсем, не тронув мир, меню и музыку',
  громко.фонВНоль.фон===0&&громко.фонВНоль.мир===1&&
  громко.фонВНоль.меню===0.25&&громко.фонВНоль.музыка===0.8,громко.фонВНоль);
 check('выключенные эффекты гасят мир, фон и меню, но не музыку',
  громко.безЭффектов.мир===0&&громко.безЭффектов.фон===0&&
  громко.безЭффектов.меню===0&&громко.безЭффектов.музыка>0,громко.безЭффектов);
 check('выключенная музыка не глушит мир',
  громко.безМузыки.музыка===0&&громко.безМузыки.мир>0,громко.безМузыки);

 /* ── 3. Фон местности звучит именно на канале фона ──
    Проверяется не таблица, а сама петля: ползунок фона обязан двигать ту
    запись, что играет под ногами. */
 const фон=await page.evaluate(async()=>{
  settings.effects=1;settings.ambVol=0.8;
  safeFn(()=>bankUpdateAmbient());
  await new Promise(r=>setTimeout(r,400));
  const петли=[...Bank.loops.entries()];
  const фоновых=петли.filter(([,c])=>Bank.chanOf(c.kind)==="ambient");
  const громко=фоновых.map(([,c])=>c.el.volume);
  settings.ambVol=0.1;safeFn(()=>Bank.refresh());
  const тихо=фоновых.map(([,c])=>c.el.volume);
  settings.ambVol=0.8;safeFn(()=>Bank.refresh());
  return {петель:петли.length,фоновых:фоновых.length,
   стало:тихо.every((v,i)=>v<громко[i]),громко,тихо};});
 check('фон местности играет на канале фона',фон.фоновых>=1,
  {петель:фон.петель,фоновых:фон.фоновых});
 check('ползунок фона двигает ту запись, что звучит под ногами',фон.стало,
  {громко:фон.громко,тихо:фон.тихо});

 /* ── 4. Уход: петли на паузе, а не убиты ──
    Остановленную петлю пришлось бы заводить заново, и место начиналось бы с
    начала записи — на слух это «меня перенесли», хотя игрок никуда не уходил. */
 const уход=await page.evaluate(async()=>{
  safeFn(()=>bankUpdateAmbient());
  await new Promise(r=>setTimeout(r,400));
  const было=Bank.loops.size;
  const игралиДо=[...Bank.loops.values()].filter(c=>!c.el.paused).length;
  AudioLife.hush();
  await new Promise(r=>setTimeout(r,250));
  const наПаузе=[...Bank.loops.values()].filter(c=>c.el.paused).length;
  const осталось=Bank.loops.size;
  AudioLife.wake();
  await new Promise(r=>setTimeout(r,450));
  const снова=[...Bank.loops.values()].filter(c=>!c.el.paused).length;
  return {было,игралиДо,наПаузе,осталось,снова,
   ctx:AE.ctx?AE.ctx.state:"нет"};});
 check('до ухода фон звучит',уход.игралиДо>=1,уход);
 check('уход ставит все петли на паузу',уход.наПаузе===уход.было&&уход.было>0,уход);
 check('петли при этом не убиты — их столько же',уход.осталось===уход.было,уход);
 check('возврат снова заводит те же петли',уход.снова===уход.было,уход);
 check('после возврата звуковой контекст жив',уход.ctx!=="suspended",уход.ctx);

 /* ── 5. Свернули окно — сработало само ── */
 const само=await page.evaluate(async()=>{
  AudioLife.hushed=false;
  safeFn(()=>bankUpdateAmbient());
  await new Promise(r=>setTimeout(r,350));
  document.dispatchEvent(new Event("visibilitychange"));
  await new Promise(r=>setTimeout(r,150));
  /* В испытании вкладка видима, поэтому событие ведёт к пробуждению — важно,
     что распорядитель на него вообще отвечает и не падает. */
  const ответил=AudioLife.hushed===false;
  const дважды=AudioLife.hush()&&AudioLife.hush()===false;
  AudioLife.wake();
  return {привязан:!!AudioLife.bound,ответил,дважды};});
 check('распорядитель звука привязан к событиям окна',само.привязан,само);
 check('смена видимости не роняет игру',само.ответил,само);
 check('двойное затишье не глушит дважды',само.дважды,само);

 /* ── 6. Речь обрывается при уходе, а не договаривает в пустоту ── */
 const речь=await page.evaluate(async()=>{
  let отменено=0;
  const c=speechSynthesis.cancel.bind(speechSynthesis);
  speechSynthesis.cancel=function(){отменено++;return c();};
  AudioLife.hushed=false;AudioLife.hush();
  await new Promise(r=>setTimeout(r,120));
  speechSynthesis.cancel=c;AudioLife.wake();
  return отменено;});
 check('уход обрывает речь',речь>=1,речь);

 /* ── 6б. Свёрнутая игра не наговаривает в наушники ──
    Мир живёт и сам подаёт голос. Без этой проверки подпорка против обрыва
    речи в Chrome — она каждые девять секунд делает pause+resume — воскрешала
    бы фразу, которую распорядитель только что оборвал. */
 const молчание=await page.evaluate(async()=>{
  const было=settings.speech;settings.speech=1;
  let завели=0;
  const сказать=speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak=function(u){завели++;return сказать(u);};
  AudioLife.hushed=false;AudioLife.hush();
  let обещание=0;
  narrate("Свёрнутая игра не должна этого произносить.",{onDone:()=>{обещание++;}});
  await new Promise(r=>setTimeout(r,260));
  const вСвёрнутом=завели;
  AudioLife.wake();
  narrate("А это — должна.");
  await new Promise(r=>setTimeout(r,260));
  const послеВозврата=завели;
  speechSynthesis.speak=сказать;Speech.stop();settings.speech=было;
  return {вСвёрнутом,послеВозврата,обещание};});
 check('свёрнутая игра не заводит новую речь',молчание.вСвёрнутом===0,молчание);
 check('обещание вызывающему исполняется и в тишине',молчание.обещание>=1,молчание);
 check('после возврата речь снова звучит',молчание.послеВозврата>молчание.вСвёрнутом,молчание);

 /* ── 7. Ползунки на месте и подписаны ── */
 const ползунки=await page.evaluate(()=>{
  const нужны=["setVoiceVol","setFxVol","setAmbVol","setMusicVol","setUiVol"];
  const нет=нужны.filter(id=>!document.getElementById(id));
  const подписи=нужны.map(id=>{
   const el=document.getElementById(id);
   const lab=el&&el.closest("label");
   return lab?lab.textContent.trim().slice(0,24):null;});
  return {нет,подписи,разные:new Set(подписи).size};});
 check('ползунков громкости пять',!ползунки.нет.length,ползунки.нет);
 check('у каждого ползунка своя подпись',ползунки.разные===5,ползунки.подписи);

 /* ── 8. Новые громкости сохраняются ── */
 const сохран=await page.evaluate(()=>{
  settings.ambVol=0.33;settings.uiVol=0.44;saveSettings();
  let сырое={};try{сырое=JSON.parse(store.get("gm29set")||"{}");}catch(_){}
  return {amb:сырое.ambVol,ui:сырое.uiVol};});
 check('громкость фона и меню попадает в сохранение',
  сохран.amb===0.33&&сохран.ui===0.44,сохран);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
