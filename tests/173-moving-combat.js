/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 173: ПОДВИЖНЫЙ БОЙ

   Бой стоял на месте: тварь «преграждала путь» и звучала в середине
   головы, свайп без оружия в бою не делал ничего, а тварь била ровно
   тогда, когда бил игрок. Теперь у схватки есть поле, у игрока и у твари
   своё место, и оба ходят. Касания — настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Поле: у каждого рода твари свой способ драться (боец, хищник,
      громада, колдун, огнедышащий, налётчик), схватка начинается на своём
      расстоянии со стороны последнего шага, голос твари идёт из её места,
      в живом темпе у поля идёт своё время.
   2. Свайп одним пальцем в бою без оружия — шаг по полю; игра называет,
      где тварь.
   3. Вынутое оружие: свайп в сторону твари вплотную — удар, прочь — шаг;
      клинок достаёт вплотную, копьё на два, лук на шесть; удар из меню
      издали не проходит.
   4. Тварь ходит сама: в живом темпе подходит и бьёт без всякого хода
      игрока; отошедшего догоняет.
   5. Замах предупреждён словом и стороной; шаг прочь уводит из-под удара
      громады, шаг вбок у самой твари — нет; промахнувшаяся тварь открыта,
      и удар в этот миг проходит без ответа; наготове — отвечает.
   6. Колдун держит расстояние и бьёт чарой издали; шаг вбок уводит.
   7. Пламя дракона: от одного шага не уйти, от двух уходишь; хищник
      доводит удар броском; налётчик бьёт и отскакивает; сокрушительный
      удар сбивает замах.
   8. Трусливая тварь бежит, раненная до четверти, и может уйти — бой
      кончается без победы, клетка не очищается.
   9. В открытом поле от медленной твари уходят шагами; в подземелье стена
      держит, на палубе — борт.
  10. Пошаговый темп: времени у поля нет, шаг игрока — ход твари, чара
      твари копится ход и от неё можно отойти; чара игрока — тоже ход.
  11. Открытое окно останавливает время боя: пока открыто меню действий,
      тварь не бьёт.
  12. Касание двумя пальцами в бою говорит, где тварь и чем она занята;
      стрелка клавиатуры — шаг.
  13. Темп боя в настройках: три кнопки, выбор сохраняется; идущий бой
      подхватывает темп сразу.
  14. Карта жестов и подсказка боя говорят про шаг; глава 96 в части VII;
      самопроверка держит строку arena; README и docs описывают бой.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};
  /* Общий помощник: чистый бой с тварью на заданном месте. */
  window.__бой=(m,где)=>{
   while(activeLayer())closeTopUI();
   if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;
   G.hp=G.hpMax=900;G.agi=5;lastMoveDir="N";
   startCombat({x:G.x,y:G.y,monster:Object.assign({lvl:3,hp:120,dmg:9,xp:5,gold:5},m)});
   const a=G.combat.arena;
   if(где){a.fx=a.px+где[0];a.fy=a.py+где[1];}
   a.readyAt=Date.now()+600000;a.stepAt=0;a.swingAt=0;a.wind=null;
   return a;};
  window.__меч=()=>{const w=weaponList().find(x=>x&&!/лук|арбалет|копь|дротик/i.test(String(x.name||"")));
   G.equip.weapon=w||G.equip.weapon;return G.equip.weapon;};
  G.place=null;G.ship=null;settings.combatPace="live";});

 async function swipe(dx,dy,steps=6){
  const x=195,y=420;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(16);
  for(let k=1;k<=steps;k++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+Math.round(dx*k/steps),y:y+Math.round(dy*k/steps),id:0}]});
   await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);}
 async function twoTap(){
  const pts=[{x:150,y:420,id:0},{x:230,y:420,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});
  await page.waitForTimeout(30);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts});
  await page.waitForTimeout(70);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(350);}

 /* ── 1. Поле ── */
 const поле=await page.evaluate(()=>{
  const роль=id=>arenaRole({id,n:id});
  const r={роли:{wolf:роль("wolf"),troll:роль("troll"),wraith:роль("wraith"),dragon:роль("dragon"),harpy:роль("harpy"),goblin:роль("goblin"),golem:роль("golem"),spider:роль("spider")}};
  lastMoveDir="E";
  if(G.inCombat)endCombat();
  G.hp=G.hpMax=900;
  startCombat({x:G.x,y:G.y,monster:{id:"wraith",n:"Призрак",lvl:3,hp:60,dmg:7,xp:5,gold:5}});
  const a=G.combat.arena;
  r.колдун={fx:a.fx,fy:a.fy,d:Arena.dist(a),роль:a.role};
  r.голос=foeSpot();
  r.время=!!Arena.iv;
  r.старт=window.__said.filter(t=>/^Бой!/.test(t)).slice(-1)[0]||"";
  r.строка=(document.getElementById("cbArena")||{}).textContent||"";
  endCombat();r.времяПосле=!!Arena.iv;
  return r;});
 check('1. у каждого рода твари свой способ драться',
  поле.роли.wolf==="fast"&&поле.роли.troll==="brute"&&поле.роли.wraith==="caster"&&поле.роли.dragon==="breath"
  &&поле.роли.harpy==="skirm"&&поле.роли.goblin==="melee"&&поле.роли.golem==="brute"&&поле.роли.spider==="fast",поле.роли);
 check('1. колдун начинает в трёх шагах со стороны последнего шага, голос идёт оттуда, у поля своё время',
  поле.колдун.fx===3&&поле.колдун.fy===0&&поле.голос.dx===3&&поле.голос.dy===0&&поле.время&&!поле.времяПосле
  &&/справа/.test(поле.старт)&&/Поле боя/.test(поле.строка),поле);

 /* ── 2. Свайп в бою без оружия — шаг ── */
 await page.evaluate(()=>{G.weaponDrawn=false;window.__бой({id:"troll",n:"Тролль"},[0,-2]);window.__said=[];});
 await swipe(0,150);
 const шаг=await page.evaluate(()=>({py:G.combat.arena.py,d:Arena.dist(G.combat.arena),сказано:window.__said.slice(-3)}));
 check('2. свайп вниз в бою без оружия — шаг назад, и игра называет, где тварь',
  шаг.py===1&&шаг.d===3&&шаг.сказано.some(t=>/Тролль: в 3 шагах, впереди/.test(t)),шаг);

 /* ── 3. Вынутое оружие ── */
 await page.evaluate(()=>{window.__меч();G.weaponDrawn=true;window.__бой({id:"troll",n:"Тролль"},[1,0]);});
 const hp0=await page.evaluate(()=>G.combat.hp);
 await swipe(150,0);await page.waitForTimeout(250);
 const удар=await page.evaluate(()=>({hp:G.combat.hp,px:G.combat.arena.px}));
 await page.evaluate(()=>{G.combat.arena.swingAt=0;G.combat.arena.stepAt=0;});
 await swipe(-150,0);await page.waitForTimeout(250);
 const прочь=await page.evaluate(()=>({hp:G.combat.hp,px:G.combat.arena.px}));
 check('3. вынутое оружие: свайп в сторону твари вплотную — удар, прочь — шаг',
  удар.hp<hp0&&удар.px===0&&прочь.px===-1&&прочь.hp===удар.hp,{hp0,удар,прочь});
 const досяг=await page.evaluate(()=>{
  const a=window.__бой({id:"troll",n:"Тролль"},[0,-2]);
  const r={};
  window.__меч();r.клинокДва=Arena.aim("N");
  G.equip.weapon={name:"Боевое копьё",type:"Копьё",slot:"weapon",atk:6};a.swingAt=0;r.копьёДва=Arena.aim("N");
  a.fy=a.py-5;a.swingAt=0;r.копьёПять=Arena.aim("N");
  G.equip.weapon={name:"Длинный лук",type:"Лук",slot:"weapon",atk:6};a.swingAt=0;r.лукПять=Arena.aim("N");
  a.swingAt=0;r.лукВбок=Arena.aim("E");
  window.__меч();a.fy=a.py-3;const hp=G.combat.hp;window.__said=[];CMD.fight("atk");
  r.меню={hp:G.combat.hp===hp,сказано:window.__said.slice(-1)[0]||""};
  return r;});
 check('3. клинок достаёт вплотную, копьё на два шага, лук на шесть и только в её сторону; удар из меню издали не проходит',
  досяг.клинокДва==="step"&&досяг.копьёДва==="strike"&&досяг.копьёПять==="step"&&досяг.лукПять==="strike"&&досяг.лукВбок==="step"
  &&досяг.меню.hp&&/Не достать/.test(досяг.меню.сказано),досяг);

 /* ── 4. Тварь ходит сама ── */
 const сама=await page.evaluate(async()=>{
  G.weaponDrawn=false;const a=window.__бой({id:"ogre",n:"Огр",dmg:9},[0,-2]);
  a.readyAt=Date.now()+100;
  const hp=G.hp;const путь=[];
  for(let i=0;i<30&&G.hp===hp;i++){await new Promise(z=>setTimeout(z,200));путь.push(Arena.dist(a)+(a.wind?"!":""));}
  const r={путь:путь.join(" "),урон:hp-G.hp,замах:window.__said.some(t=>/Замах/.test(t))};
  /* отошли — догоняет */
  a.readyAt=Date.now()+600000;a.wind=null;a.stepAt=0;Arena.step("S");a.stepAt=0;Arena.step("S");
  const d0=Arena.dist(a);a.readyAt=0;Arena.decide(Date.now());r.догоняет=Arena.dist(a)<d0;
  return r;});
 check('4. в живом темпе тварь сама подходит, замахивается и бьёт; отошедшего догоняет',
  сама.урон>0&&/1!/.test(сама.путь)&&сама.замах&&сама.догоняет,сама);

 /* ── 5. Замах, уворот и открытая тварь ── */
 const замах=await page.evaluate(()=>{
  const r={};let a=window.__бой({id:"troll",n:"Тролль"},[0,-1]);window.__said=[];
  Arena.windup("melee",Date.now());r.слово=window.__said.slice(-1)[0]||"";
  let hp=G.hp;Arena.step("S");Arena.resolve(Date.now());r.прочь=hp-G.hp;r.мимо=window.__said.some(t=>/Мимо/.test(t));
  r.открыта=a.readyAt>Date.now();
  a.fx=a.px;a.fy=a.py-1;hp=G.hp;fight("atk");r.безОтвета=hp-G.hp;
  a.readyAt=0;hp=G.hp;fight("atk");r.наготове=hp-G.hp;
  a=window.__бой({id:"troll",n:"Тролль"},[0,-1]);
  Arena.windup("melee",Date.now());hp=G.hp;Arena.step("E");Arena.resolve(Date.now());r.вбок=hp-G.hp;
  return r;});
 check('5. замах назван словом и стороной; шаг прочь уводит из-под удара громады, шаг вбок у самой твари — нет',
  /^Замах впереди!/.test(замах.слово)&&замах.прочь===0&&замах.мимо&&замах.вбок>0,замах);
 check('5. промахнувшаяся тварь открыта: удар проходит без ответа; наготове — отвечает',
  замах.открыта&&замах.безОтвета===0&&замах.наготове>0,замах);

 /* ── 6. Колдун ── */
 const колдун=await page.evaluate(()=>{
  const r={};const a=window.__бой({id:"wraith",n:"Призрак",dmg:8},[0,-3]);
  a.readyAt=0;Arena.decide(Date.now());r.чара=a.wind&&a.wind.kind;
  let hp=G.hp;Arena.step("E");Arena.resolve(Date.now());r.вбок=hp-G.hp;
  a.readyAt=0;Arena.decide(Date.now());window.__said=[];hp=G.hp;Arena.resolve(Date.now());r.стоя=hp-G.hp;
  r.сказано=window.__said.join(" | ");
  a.fx=a.px;a.fy=a.py-1;a.readyAt=0;let отступил=0;
  for(let i=0;i<6;i++){a.readyAt=0;a.wind=null;const d=Arena.dist(a);Arena.decide(Date.now());if(Arena.dist(a)>d)отступил++;}
  r.отступил=отступил;
  return r;});
 check('6. колдун плетёт чару издали, шаг вбок уводит, стоящего бьёт чарой, вплотную — отступает',
  колдун.чара==="bolt"&&колдун.вбок===0&&колдун.стоя>0&&/чарой/.test(колдун.сказано)&&колдун.отступил>0,колдун);

 /* ── 7. Пламя, хищник, налётчик, сбитый замах ── */
 const роды=await page.evaluate(()=>{
  const r={};let a=window.__бой({id:"dragon",n:"Дракон",dmg:12},[0,-2]);
  Arena.windup("breath",Date.now());let hp=G.hp;Arena.step("S");Arena.resolve(Date.now());r.пламяШаг=hp-G.hp;
  a.fx=a.px;a.fy=a.py-2;Arena.windup("breath",Date.now());hp=G.hp;a.stepAt=0;Arena.step("S");a.stepAt=0;Arena.step("S");Arena.resolve(Date.now());r.пламяДва=hp-G.hp;
  a=window.__бой({id:"wolf",n:"Волк"},[0,-2]);a.readyAt=0;Arena.decide(Date.now());r.прыжок=a.wind&&a.wind.kind;
  a.wind=null;a.fx=a.px;a.fy=a.py-1;Arena.windup("melee",Date.now());hp=G.hp;Arena.step("S");Arena.resolve(Date.now());r.хищникДогнал=hp-G.hp;
  a=window.__бой({id:"harpy",n:"Гарпия"},[0,-1]);Arena.windup("melee",Date.now());Arena.resolve(Date.now());r.налётчикОтскочил=Arena.dist(a);
  a=window.__бой({id:"troll",n:"Тролль"},[0,-1]);Arena.windup("melee",Date.now());r.сбит=Arena.stagger()&&!a.wind;
  return r;});
 check('7. от пламени не уйти одним шагом, двумя уходишь',роды.пламяШаг>0&&роды.пламяДва===0,роды);
 check('7. хищник прыгает с двух шагов и доводит удар броском; налётчик отскакивает; сокрушительный удар сбивает замах',
  роды.прыжок==="lunge"&&роды.хищникДогнал>0&&роды.налётчикОтскочил>=3&&роды.сбит===true,роды);

 /* ── 8. Трус бежит ── */
 const трус=await page.evaluate(()=>{
  const c=cellContent(G.x,G.y);const ключ=G.x+","+G.y;const былаОчищена=!!G.cleared[ключ];
  const a=window.__бой({id:"goblin",n:"Гоблин",hp:40},[0,-1]);
  G.combat.hp=5;a.readyAt=0;Arena.decide(Date.now());const бежит=a.fleeing;
  for(let i=0;i<12&&G.inCombat;i++){a.readyAt=0;Arena.decide(Date.now());}
  return {бежит,ушёл:!G.inCombat,добычи:!(G.loot&&G.loot.length),клетка:!!G.cleared[ключ]===былаОчищена,
   сказано:window.__said.filter(t=>/прочь|упустили/i.test(t)).slice(-2)};});
 check('8. трусливая тварь, раненная до четверти, бежит и может уйти: бой кончается без победы',
  трус.бежит&&трус.ушёл&&трус.добычи&&трус.клетка&&трус.сказано.length===2,трус);

 /* ── 9. Уйти, стена, борт ── */
 const уйти=await page.evaluate(()=>{
  const r={};let a=window.__бой({id:"golem",n:"Голем"},[0,-1]);
  for(let i=0;i<10&&G.inCombat;i++){a.stepAt=0;Arena.step("S");}
  r.ушли=!G.inCombat;r.сказано=window.__said.filter(t=>/оторвались/.test(t)).length>0;
  G.place={kind:"dungeon",stype:"ruins",depth:1,bx:1,by:1,x:2,y:2,name:"проба"};
  a=window.__бой({id:"golem",n:"Голем"},[0,-1]);let шагов=0;
  for(let i=0;i<10;i++){a.stepAt=0;if(Arena.step("S"))шагов++;}
  r.подземелье={шагов,бой:G.inCombat,стена:window.__said.some(t=>/Стена/.test(t))};
  G.place=null;G.ship={name:"Проба",toName:"Порт",left:3};
  a=window.__бой({id:"golem",n:"Голем"},[0,-1]);шагов=0;
  for(let i=0;i<10;i++){a.stepAt=0;if(Arena.step("S"))шагов++;}
  r.палуба={шагов,бой:G.inCombat,борт:window.__said.some(t=>/Борт/.test(t))};
  G.ship=null;endCombat();
  return r;});
 check('9. в открытом поле от медленной твари уходят шагами; в подземелье держит стена, на палубе — борт',
  уйти.ушли&&уйти.сказано&&уйти.подземелье.шагов===3&&уйти.подземелье.бой&&уйти.подземелье.стена
  &&уйти.палуба.шагов===2&&уйти.палуба.бой&&уйти.палуба.борт,уйти);

 /* ── 10. Пошаговый темп ── */
 const пошаг=await page.evaluate(()=>{
  const r={};settings.combatPace="turn";
  let a=window.__бой({id:"troll",n:"Тролль"},[0,-3]);r.времени=!!Arena.iv;
  const d0=Arena.dist(a);Arena.step("S");r.шагХодТвари=Arena.dist(a)<d0+1;
  a.fx=a.px;a.fy=a.py-1;let hp=G.hp;fight("atk");r.ответВплотную=hp-G.hp;
  a=window.__бой({id:"wraith",n:"Призрак"},[0,-3]);
  Arena.step("E");r.чараКопится=!!(a.wind&&a.wind.kind==="bolt");
  hp=G.hp;Arena.step("E");r.отошёлОтЧары=hp-G.hp;r.чараУшла=!a.wind;
  a=window.__бой({id:"wraith",n:"Призрак"},[0,-3]);
  Arena.foeTurn();hp=G.hp;Arena.foeTurn();r.стоялПодЧарой=hp-G.hp;
  settings.combatPace="live";endCombat();
  return r;});
 check('10. пошаговый темп: времени нет, шаг — ход твари, вплотную она отвечает, чара копится ход и от неё можно отойти',
  !пошаг.времени&&пошаг.шагХодТвари&&пошаг.ответВплотную>0&&пошаг.чараКопится&&пошаг.отошёлОтЧары===0&&пошаг.чараУшла&&пошаг.стоялПодЧарой>0,пошаг);

 /* ── 11. Окно останавливает время ── */
 const окно=await page.evaluate(async()=>{
  const a=window.__бой({id:"ogre",n:"Огр"},[0,-1]);
  Arena.windup("melee",Date.now());const hp=G.hp;
  openActionMenu();await new Promise(z=>setTimeout(z,2600));
  const r={урон:hp-G.hp,замахЖдёт:!!a.wind};
  closeActionMenu();endCombat();return r;});
 check('11. пока открыто меню действий, тварь ждёт и не бьёт',окно.урон===0&&окно.замахЖдёт,окно);

 /* ── 12. Где тварь; клавиатура ── */
 await page.evaluate(()=>{G.weaponDrawn=false;const a=window.__бой({id:"troll",n:"Тролль"},[2,-1]);Arena.windup("melee",Date.now());a.wind.until=Date.now()+600000;window.__said=[];});
 await twoTap();
 const где=await page.evaluate(()=>window.__said.slice(-2));
 const клав=await page.evaluate(()=>{const a=G.combat.arena;a.wind=null;a.stepAt=0;
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));
  return {px:a.px};});
 check('12. касание двумя пальцами в бою называет, где тварь и чем она занята',
  где.some(t=>/Тролль: в 2 шагах, впереди справа, замахивается/.test(t)),где);
 check('12. стрелка клавиатуры в бою — шаг по полю',клав.px===-1,клав);

 /* ── 13. Темп в настройках ── */
 const темп=await page.evaluate(()=>{
  endCombat();while(activeLayer())closeTopUI();
  CMD.settings();renderDifficulty();
  const кнопки=[...document.querySelectorAll('#paceRow [data-cmd^="setpace:"]')].map(b=>b.dataset.cmd.split(":")[1]);
  CMD.setpace("calm");const сохранён=JSON.parse(store.get("gm29set")||"{}").combatPace;
  const нажата=(document.querySelector('#paceRow [data-cmd="setpace:calm"]')||{}).getAttribute?.("aria-pressed");
  while(activeLayer())closeTopUI();
  const a=window.__бой({id:"troll",n:"Тролль"},[0,-1]);const медленно=Arena.k();
  CMD.setpace("turn");const стоп=!Arena.iv;CMD.setpace("live");const пошло=!!Arena.iv;
  endCombat();
  return {кнопки,сохранён,нажата,медленно,стоп,пошло};});
 check('13. темп боя — три кнопки в настройках, выбор сохраняется, идущий бой подхватывает его сразу',
  темп.кнопки.join()==="live,calm,turn"&&темп.сохранён==="calm"&&темп.нажата==="true"&&темп.медленно===1.6&&темп.стоп&&темп.пошло,темп);

 /* ── 14. Слова, руководство, самопроверка, документы ── */
 const слова=await page.evaluate(()=>{
  const g=GESTURE_MAP.find(x=>x.fingers===1&&x.kind==="swipe");
  const g2=GESTURE_MAP.find(x=>x.fingers===2&&x.kind==="tap");
  const гл=GUIDE_BY_NUM[96];
  const row=worldSelfCheck().find(x=>x.id==="arena");
  return {свайп:g&&g.n,два:g2&&g2.n,подсказка:(document.querySelector('#combatBar .hint')||{}).textContent||"",
   глава:гл!==undefined&&GUIDE[гл].body.length>=8,часть:гл!==undefined&&guidePartOf(гл),
   само:row&&row.ok,самоТекст:row&&row.detail};});
 check('14. карта жестов и подсказка боя говорят про шаг и про «где тварь»',
  /в бою — шаг/.test(слова.свайп)&&/в бою — где тварь/.test(слова.два)&&/шаг по полю боя/.test(слова.подсказка),слова);
 check('14. глава 96 «Подвижный бой» в части VII; самопроверка держит строку arena',
  слова.глава&&/Часть VII/.test(слова.часть)&&слова.само===true,слова);
 const root=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const docs=fs.readFileSync(path.join(root,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('14. README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают подвижный бой',
  /Подвижный бой/.test(readme)&&/Подвижный бой/.test(docs));

 console.log(results.join('\n'));
 console.log('Ошибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
