const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // ── Сложность ──
 const d=await page.evaluate(()=>({
  levels:Object.keys(DIFFICULTY),
  cur:settings.difficulty,
  named:Object.values(DIFFICULTY).every(x=>x.n&&x.d&&x.d.length>40),
  order:DIFFICULTY.calm.dmg<DIFFICULTY.normal.dmg&&DIFFICULTY.normal.dmg<DIFFICULTY.harsh.dmg
   &&DIFFICULTY.calm.foeHp<DIFFICULTY.harsh.foeHp&&DIFFICULTY.calm.meet<DIFFICULTY.harsh.meet
   &&DIFFICULTY.calm.loss<DIFFICULTY.harsh.loss&&DIFFICULTY.calm.heal>DIFFICULTY.harsh.heal}));
 check('три уровня сложности, у каждого имя и объяснение',d.levels.length===3&&d.named===true,d.levels);
 check('уровни выстроены по возрастанию суровости',d.order===true);

 // урон по игроку зависит от уровня
 const dmg=await page.evaluate(()=>{
  const hit=()=>{
   G.hp=1000;G.hpMax=1000;G.inCombat=true;
   G.combat={m:{id:"wolf",n:"Волк",lvl:5,hp:999,dmg:20,xp:1,gold:1},hp:999,key:"0,0",ai:{}};
   const before=G.hp;
   fight("atk");
   const taken=before-G.hp;
   endCombat();
   return taken;};
  const avg=k=>{setDifficulty(k);let s=0;for(let i=0;i<40;i++)s+=hit();return s/40;};
  return {calm:avg("calm"),normal:avg("normal"),harsh:avg("harsh")};});
 check('на спокойном бьют слабее, на суровом сильнее',
  dmg.calm<dmg.normal&&dmg.normal<dmg.harsh,dmg);

 // запас здоровья тварей зависит от уровня
 const hp=await page.evaluate(()=>{
  /* Берём один и тот же кусок мира и сравниваем, сколько здоровья у тварей
     одного уровня: сама расстановка от сложности не зависит, только запас. */
  const probe=k=>{setDifficulty(k);contentCache.clear();
   const by={};
   for(let x=900;x<1200;x++)for(let y=900;y<1000;y++){
    const c=cellContent(x,y);
    if(c.monster){by[c.monster.lvl]=Math.max(by[c.monster.lvl]||0,c.monster.hp);}}
   return by;};
  const a=probe("calm"),b=probe("harsh");
  const lv=Object.keys(a).filter(l=>b[l]);
  return {уровней:lv.length,ниже:lv.filter(l=>a[l]<b[l]).length,примерCalm:a[lv[0]],примерHarsh:b[lv[0]]};});
 check('на суровом твари держат больше',hp.уровней>0&&hp.ниже===hp.уровней,hp);

 // цена поражения зависит от уровня
 const loss=await page.evaluate(()=>{
  const probe=k=>{setDifficulty(k);G.gold=1000;G.hp=0;defeat();return 1000-G.gold;};
  return {calm:probe("calm"),normal:probe("normal"),harsh:probe("harsh")};});
 check('поражение стоит тем дороже, чем суровее мир',
  loss.calm<loss.normal&&loss.normal<loss.harsh,loss);

 // выбор сохраняется и озвучивается
 const pick=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  setDifficulty("normal");
  CMD.settings?CMD.settings():openModal("modal-settings");
  renderDifficulty();
  const btns=[...document.querySelectorAll('#diffRow button')].map(b=>({cmd:b.dataset.cmd,speak:b.dataset.speak,on:b.getAttribute("aria-pressed")}));
  setDifficulty("harsh");
  const saved=JSON.parse(store.get("gm29set")||"{}").difficulty;
  const marked=[...document.querySelectorAll('#diffRow button')].find(b=>b.getAttribute("aria-pressed")==="true");
  Speech.say=o;
  while(activeLayer())closeTopUI();
  setDifficulty("normal");
  return {btns:btns.length,speak:btns.every(b=>b.speak&&b.speak.length>30),saved,marked:marked&&marked.dataset.cmd,said:said.length};});
 check('в настройках три кнопки, каждая объясняет себя вслух',pick.btns===3&&pick.speak===true,pick.btns);
 check('выбор запоминается между запусками и отмечается',pick.saved==="harsh"&&pick.marked==="setdiff:harsh",{saved:pick.saved,marked:pick.marked});

 // ── Обучение ──
 const tut=await page.evaluate(()=>({
  steps:Tutor.steps.length,
  full:Tutor.steps.every(s=>s.want&&s.say&&s.again&&s.ok),
  kinds:Tutor.steps.map(s=>s.want)}));
 check('в обучении девять уроков, у каждого просьба, подсказка и похвала',
  tut.steps===9&&tut.full===true&&tut.kinds.includes("gather"),tut.kinds);

 const flow=await page.evaluate(async()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  Tutor.start();
  const started=Tutor.on;
  // проходим уроки настоящими действиями игры
  /* По дороге игрока может встретить тварь — в бою бег не запускается,
     как и в настоящей игре. Для урока бой гасим, как это сделал бы игрок. */
  const calm=()=>{if(G.inCombat)endCombat();while(activeLayer())closeTopUI();};
  move("E");calm();                // урок 1
  const after1=Tutor.i;
  move("W");calm();                // урок 2
  startRun("N");stopRun();calm();  // урок 3
  handleThreeFingerSwipe("N");     // урок 4: открыть меню свайпом тремя пальцами вверх
  handleTwoFingerTap();            // урок 5: закрыть двумя пальцами
  handleTwoFingerTap();calm();     // урок 6: сбор двумя пальцами
  handleThreeFingerSwipe("S");     // урок 7: где я
  useHere();calm();                // урок 8: действие здесь
  Tutor.note("explore");           // урок 9
  const done=!Tutor.on&&Tutor.i>=9;
  Speech.say=o;
  while(activeLayer())closeTopUI();
  return {started,after1,i:Tutor.i,done,tutorDone:!!G.tutorDone,
   praised:said.filter(t=>/Есть шаг|Верно|Это бег|Меню открыто|Закрыто|собирают|сводка|Вот и всё|читаете экран/.test(t)).length};});
 check('обучение начинается и слушает настоящие жесты игры',flow.started===true&&flow.after1===1,flow);
 check('все девять уроков проходятся действиями игрока',flow.i>=9&&flow.done===true,{урок:flow.i,завершено:flow.done});
 check('на каждый жест игра отвечает похвалой',flow.praised>=7,{похвал:flow.praised});
 check('пройденное обучение запоминается в сохранении',flow.tutorDone===true);

 const stop=await page.evaluate(()=>{
  Tutor.start();const on=Tutor.on;
  const label1=amLabel("tutor","🎓 Обучение жестам");
  Tutor.stop(true);
  const label2=amLabel("tutor","🎓 Обучение жестам");
  // жест после остановки не должен ничего двигать
  const i0=Tutor.i;move("E");
  return {on,label1,label2,off:!Tutor.on,iStable:Tutor.i===i0};});
 check('обучение прерывается, и пункт меню меняет подпись',
  stop.on===true&&/Прекратить/.test(stop.label1)&&/Обучение/.test(stop.label2)&&stop.off===true&&stop.iStable===true,
  {в_меню:stop.label1});

 // ── Прогрев записей ──
 const warm=await page.evaluate(async()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const list=Warm.list();
  /* Прогреваем не всё (это сотни файлов), а проверяем механику на коротком
     списке: та же процедура, тот же счётчик, та же остановка. */
  const real=Warm.list;
  Warm.list=()=>list.slice(0,6);
  const ok=await Warm.run();
  Warm.list=real;
  Speech.say=o;
  return {всего:list.length,ok,скачано:Warm.done,занят:Warm.busy,
   сказано:said.filter(t=>/Скачиваю|Готово/.test(t)).length};});
 check('в прогреве перечислены все записи игры',warm.всего>=415,{записей:warm.всего});
 check('прогрев скачивает список до конца и говорит об этом',
  warm.ok===true&&warm.скачано===6&&warm.занят===false&&warm.сказано>=2,warm);

 const cancel=await page.evaluate(async()=>{
  const o=Speech.say;Speech.say=()=>{};
  const real=Warm.list;
  Warm.list=()=>real.call(Warm).slice(0,50);
  const p=Warm.run();
  const wasBusy=Warm.busy;
  const label=amLabel("warm","⬇️ Скачать все записи на устройство");
  Warm.cancel();
  await p;
  Warm.list=real;
  Speech.say=o;
  return {wasBusy,label,stoppedEarly:Warm.done<50,busyAfter:Warm.busy};});
 check('прогрев можно остановить, и пункт меню показывает ход работы',
  cancel.wasBusy===true&&/Остановить/.test(cancel.label)&&cancel.stoppedEarly===true&&cancel.busyAfter===false,cancel);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
