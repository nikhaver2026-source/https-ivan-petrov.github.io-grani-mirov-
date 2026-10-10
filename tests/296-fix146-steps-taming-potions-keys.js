/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 296: 14.6 — ШАГИ И КРЫЛЬЯ ТВАРЕЙ, ПРИРУЧЕНИЕ, ЗЕЛЬЯ СТОПКОЙ, КЛАВИШИ

   Просьбы игрока:
   — «не слышно, как некоторые монстры ходят или летают — справа, слева,
     спереди, сзади: слышен звук, а самого перемещения нет»;
   — «мясо в инвентаре есть, а игра говорит, что требуется мясо»; «пусть
     игра говорит, почему не удаётся приручить»; «приручать зверя вне боя,
     через меню действий; бой — по желанию игрока, когда он вынимает меч;
     зверь может напасть и сам, как прежде»;
   — «клавиши “Выпить зелье” — Alt+1, Alt+2 — в приложении для Windows не
     срабатывают»; «все подобранные зелья одного вида — одной стопкой, как
     зелье здоровья»;
   — «Shift+B — погасить маяк, B — направление и расстояние до цели; без
     постоянных объявлений: маяк и так звенит».
   1. Подземелье: каждый бродячий, сделавший шаг, слышен со своей клетки;
      летучие — крыльями, дух — вихрем; стоящий рядом дышит; рык — оттуда,
      где тварь.
   2. Поле боя: прыжок хищника слышен с места приземления; шаг летучей —
      крылья; после шага игрока тварь отзывается со своего места; запись
      огра звучит из его точки; пока идёт бой, округа молчит.
   3. Корм по всей сумке: вяленое мясо — мясо, «Хлеб» — хлеб; приручение
      поверженного и кормление питомца им работают.
   4. Каждый отказ назван: нет зверя, пал в бою, не зверь, нет корма,
      полны стойла, идёт бой; «Приручить зверя» в меню всегда.
   5. Шаг на клетку зверя — встреча, а не бой; «Приручить зверя» приручает
      живого, клетка пустеет; вынутое оружие при встрече — бой; хищник может
      броситься и сам.
   6. Зелья одного вида — одна строка со счётом; пьётся лучшая годная
      склянка, выбрасывается — с худшей; окно «Зелья» — стопками.
   7. Alt+цифра — слоты быстрого доступа и вне боя, и в бою.
   8. B называет цель маяка, сторону и расстояние; Shift+B гасит маяк;
      без цели B говорит, что маяк не горит.
   9. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  G.level=10;G.hpMax=9999;G.hp=9999;G.gold=500;settings.effects=1;settings.hrtf=1;settings.scape=1;
  window.ЗВУК=[];const at0=Spatial.at.bind(Spatial);
  Spatial.at=function(path,dx,dy,o){const r=at0(path,dx,dy,o);ЗВУК.push({f:String(path).split("/").pop(),dx:+(+dx).toFixed(2),dy:+(+dy).toFixed(2),ok:r});return r;};
  window.ПЛОСКО=[];const pl0=Bank.play.bind(Bank);Bank.play=function(role,o){ПЛОСКО.push(role);return pl0(role,o);};
  /* narrate — константа страницы: слушаем единый обработчик речи. */
  window.СКАЗАНО=[];const e0=Speech.enqueue.bind(Speech);Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0(t,o);};
  window.ЖДАТЬ=ms=>new Promise(z=>setTimeout(z,ms));
  window.ЖМИ=(combo)=>{const ч=combo.split("+");const code=ч.pop();
   document.dispatchEvent(new KeyboardEvent("keydown",{code,key:code.replace(/^Key|^Digit/,"").toLowerCase(),
    ctrlKey:ч.includes("Ctrl"),altKey:ч.includes("Alt"),shiftKey:ч.includes("Shift"),bubbles:true,cancelable:true}));};});

 /* ── 1. подземелье ── */
 const яр=await p.evaluate(async()=>{
  let c=null;for(let x=1000;x<90000&&!c;x+=37)for(let y=1000;y<1600&&!c;y+=41){const cc=cellContent(x,y);
   if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  await ЖДАТЬ(600);Actors.ensure();
  /* свои часы живых остановлены: ходы делает только проверка */
  clearInterval(Actors.iv);Actors.iv=null;
  /* поле без стен: так шаги идут предсказуемо */
  const L={w:21,h:21,g:Array.from({length:21},(_,y)=>Array.from({length:21},(_,x)=>(x===0||y===0||x===20||y===20)?"#":"."))};
  window.curLevel=()=>L;G.place.x=10;G.place.y=10;
  const m=id=>MONSTERS.find(z=>z.id===id);
  Actors.list=[{id:901,kind:"mob",x:6,y:10,m:m("wolf")},{id:902,kind:"mob",x:10,y:6,m:m("harpy")},
   {id:903,kind:"mob",x:14,y:10,m:m("nightmoth")},{id:904,kind:"mob",x:10,y:14,m:m("wraith")},{id:905,kind:"mob",x:12,y:12,m:m("skeleton")}];
  const r0=Math.random;Math.random=()=>0.3;
  ЗВУК.length=0;ПЛОСКО.length=0;
  try{Actors.tick();}finally{Math.random=r0;}
  await ЖДАТЬ(900);
  const после=Actors.list.map(a=>({id:a.m.id,dx:a.x-10,dy:a.y-10,шёл:!!a.шёл}));
  const звуки=ЗВУК.slice();
  /* у каждого шагнувшего — свой звук со своей клетки */
  const у=после.filter(a=>a.шёл).map(a=>({id:a.id,звук:звуки.filter(z=>z.dx===a.dx&&z.dy===a.dy).map(z=>z.f)}));
  /* стоящий рядом дышит: волк вплотную, ходов несколько */
  Actors.list=[{id:906,kind:"mob",x:11,y:10,m:m("wolf"),путы:9}];
  const дых=[];for(let i=0;i<3;i++){ЗВУК.length=0;ПЛОСКО.length=0;Actors.tick();await ЖДАТЬ(200);дых.push({м:ЗВУК.filter(z=>z.dx===1&&z.dy===0).map(z=>z.f),плоско:ПЛОСКО.slice()});}
  G.place=null;delete window.curLevel;
  return {после,у,дых};});
 const крыльяОк=яр.у.find(x=>x.id==="harpy");const мотОк=яр.у.find(x=>x.id==="nightmoth");const духОк=яр.у.find(x=>x.id==="wraith");
 check('1. подземелье: каждый шагнувший слышен со своей клетки; гарпия — крыльями, мотыльница — порханием, призрак — вихрем',
  яр.у.length>=4&&яр.у.every(x=>x.звук.length>=1)
  &&(!крыльяОк||крыльяОк.звук.some(f=>/raptor_wing/.test(f)))&&(!мотОк||мотОк.звук.some(f=>/bat_flutter/.test(f)))
  &&(!духОк||духОк.звук.some(f=>/sv_shadow|magic_woosh/.test(f)))&&!яр.у.some(x=>x.звук.some(f=>/deep_wind/.test(f))),яр);
 check('1б. стоящий вплотную зверь изредка дышит со своей стороны, рык не звучит посередине',
  яр.дых.some(x=>x.м.length>0)&&!яр.дых.some(x=>x.плоско.includes("lug_growl")),яр.дых);

 /* ── 2. поле боя ── */
 const бой=await p.evaluate(async()=>{
  const r={};const m=id=>Object.assign({},MONSTERS.find(z=>z.id===id),{hp:9999,dmg:0});
  /* прыжок волка */
  startCombat({x:G.x,y:G.y,monster:m("wolf")});const a=G.combat.arena;Arena.stop();
  a.fx=2;a.fy=-2;a.px=0;a.py=0;a.wind=null;
  Arena.windup("lunge",Date.now());ЗВУК.length=0;Arena.resolve(Date.now());
  r.прыжок={где:[a.fx,a.fy],звуки:ЗВУК.map(z=>z.f+"@"+z.dx+","+z.dy)};
  r.приземлениеСлышно=ЗВУК.some(z=>z.dx===+(a.fx*1.8).toFixed(2)&&z.dy===+(a.fy*1.3).toFixed(2)&&/step|grass|tread/.test(z.f));
  endCombat();while(activeLayer())closeTopUI();
  /* шаг летучего дракона — крылья */
  startCombat({x:G.x,y:G.y,monster:m("dragon")});const b=G.combat.arena;Arena.stop();b.fx=3;b.fy=0;b.px=0;b.py=0;b.wind=null;
  ЗВУК.length=0;Arena.foeStep(1);r.дракон={летит:foeFlies(G.combat.m),звуки:ЗВУК.map(z=>z.f)};
  endCombat();while(activeLayer())closeTopUI();
  /* шаг игрока — тварь отзывается со своего места */
  startCombat({x:G.x,y:G.y,monster:m("ogre")});const c=G.combat.arena;Arena.stop();c.fx=-3;c.fy=0;c.px=0;c.py=0;c.wind=null;c.stepAt=0;
  /* голоса начала боя отзвучали: отклик не ложится на них */
  await ЖДАТЬ(1500);ЗВУК.length=0;Arena.step("S");
  r.отклик=ЗВУК.map(z=>z.f+"@"+z.dx+","+z.dy);r.откликСлева=ЗВУК.some(z=>z.dx<0);
  /* запись огра — через размещение */
  const s=playRealMonsterCue(G.combat.m,"attack",0.6);
  r.огр=!!(s&&s.nodes&&s.nodes.some(n=>n&&n.constructor&&/Panner/.test(n.constructor.name)));
  /* пока бой — округа молчит */
  Scape.last.clear();Scape.lastAny=0;r.округаВБою=Scape.tick();
  endCombat();while(activeLayer())closeTopUI();
  return r;});
 check('2. поле боя: прыжок волка слышен с места приземления',бой.приземлениеСлышно,бой.прыжок);
 check('2б. шаг летучего дракона — хлопки крыльев, а не поступь',бой.дракон.летит&&бой.дракон.звуки.some(f=>/wing/.test(f))&&!бой.дракон.звуки.some(f=>/behemoth_step|brute_step/.test(f)),бой.дракон);
 check('2в. после шага игрока тварь отзывается со своей стороны; запись огра — из его точки; пока бой, округа молчит',
  бой.откликСлева&&бой.огр&&бой.округаВБою===0,бой);

 /* ── 3. корм по всей сумке ── */
 const корм=await p.evaluate(()=>{
  const r={};const s=Zver.st();s.list=[];s.pets=[];s.tame=null;s.live=null;s.lastDead=null;
  for(const k of Object.keys(G.inv))if(/мяс|хлеб|кость|рыб|ягод|зерн|трав/i.test(k))delete G.inv[k];
  G.items=(G.items||[]).filter(n=>!/мяс|хлеб/i.test(String(n)));
  G.inv["Вяленое мясо"]=2;
  const rnd=Math.random;Math.random=()=>0.01;
  try{const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"));Zver.onWin(m);r.ждёт=!!s.tame;r.приручил=Zver.tame();}finally{Math.random=rnd;}
  r.питомцев=s.list.length;r.мясаОсталось=Number(G.inv["Вяленое мясо"])||0;
  const a=s.list[0];if(a){a.сыт=10;G.inv["Вяленое мясо"]=1;r.кормление=Zver.feed(a.uid);r.сыт=a.сыт;}
  return r;});
 check('3. вяленое мясо — тоже мясо: поверженного волка приручают им, питомца им же кормят',
  корм.ждёт&&корм.питомцев===1&&корм.мясаОсталось===1&&/вяленое мясо/i.test(корм.приручил)&&/ест вяленое мясо/i.test(корм.кормление||"")&&корм.сыт>10,корм);

 /* ── 4. причины отказа ── */
 const отказ=await p.evaluate(()=>{
  const r={};const s=Zver.st();s.tame=null;s.live=null;s.lastDead=null;
  /* пустая округа */
  const пусто=()=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const c=cellContent(G.x+dx,G.y+dy);if(c&&c.monster)c.monster=null;}};
  пусто();r.меню=amAvailable("zvtame");r.нет=Zver.tame();
  s.lastDead={n:"Серый волк",day:G.day,x:G.x,y:G.y};r.пал=Zver.tame();s.lastDead=null;
  /* гоблин рядом — не зверь */
  const сосед=cellContent(G.x+1,G.y);delete G.cleared[(G.x+1)+","+G.y];
  сосед.monster=Object.assign({},MONSTERS.find(q=>q.id==="goblin"),{lvl:3});r.незверь=Zver.tame();
  /* волк рядом, корма нет */
  сосед.monster=Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:3});
  for(const k of Object.keys(G.inv))if(/мяс|кость/i.test(k))delete G.inv[k];
  r.безКорма=Zver.tame();
  /* стойла полны */
  G.inv["мясо"]=3;const был=s.list.slice();while(s.list.length<Zver.cap())Zver.make("boar_wild",{lvl:1});r.стойла=Zver.tame();s.list=был;
  /* идёт бой */
  startCombat({x:G.x,y:G.y,monster:Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{hp:9999,dmg:0})});r.вБою=Zver.tame();endCombat();while(activeLayer())closeTopUI();
  сосед.monster=null;delete G.inv["мясо"];
  return r;});
 check('4. «Приручить зверя» в меню всегда; отказы названы: нет зверя, пал в бою, не зверь, нет корма, полны стойла, идёт бой',
  отказ.меню===true&&/Рядом нет зверя/.test(отказ.нет)&&/пал в бою/.test(отказ.пал)&&/не зверь/.test(отказ.незверь)
  &&/в сумке этого нет/.test(отказ.безКорма)&&/Стойла полны/.test(отказ.стойла)&&/Идёт бой/.test(отказ.вБою),отказ);

 /* ── 5. встреча и живое приручение ── */
 const встреча=await p.evaluate(async()=>{
  const r={};const s=Zver.st();s.list=[];s.pets=[];s.tame=null;s.live=null;G.weaponDrawn=false;
  const клетка=()=>{const x=G.x+1,y=G.y;delete G.cleared[x+","+y];const c=cellContent(x,y);c.structure=null;c.res=null;
   c.monster=Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:3});return {x,y,c};};
  /* шаг на зверя: встреча, а не бой */
  let k=клетка();const rnd=Math.random;Math.random=()=>0.99;
  const st0=window.heroStealth;window.heroStealth=()=>0;
  try{СКАЗАНО.length=0;move("E");}finally{Math.random=rnd;}
  r.бойПослеШага=!!G.inCombat;r.встреча=СКАЗАНО.some(t=>/Перед вами/.test(t));r.здесь=!!BeastMeet.here();
  /* приручить живого: удача */
  G.inv["мясо"]=2;Math.random=()=>0.01;try{r.приручил=Zver.tame();}finally{Math.random=rnd;}
  r.питомцев=s.list.length;r.клеткаПуста=!cellContent(G.x,G.y).monster&&!!G.cleared[G.x+","+G.y];
  /* снова встреча — вынуть оружие: бой */
  G.x-=1;k=клетка();Math.random=()=>0.99;try{move("E");}finally{Math.random=rnd;}
  r.встреча2=!!BeastMeet.here();
  const w0=G.equip.weapon;if(!G.equip.weapon)G.equip.weapon={id:"t_sword",name:"Проба",type:"Меч",slot:"weapon",val:3};
  drawWeapon();await ЖДАТЬ(900);r.бойОтОружия=!!G.inCombat;
  endCombat();while(activeLayer())closeTopUI();G.weaponDrawn=false;G.equip.weapon=w0;
  /* хищник бросается сам — как прежде */
  G.x-=1;k=клетка();Math.random=()=>0.0;
  r.хищник=BeastMeet.meet(k.c)===false;Math.random=rnd;
  k.c.monster=null;window.heroStealth=st0;delete G.inv["мясо"];
  return r;});
 check('5. шаг на клетку зверя — встреча, не бой; «Приручить зверя» приручает живого, клетка пустеет',
  !встреча.бойПослеШага&&встреча.встреча&&встреча.здесь&&встреча.питомцев===1&&встреча.клеткаПуста&&/остаётся с вами/.test(встреча.приручил||""),встреча);
 check('5б. вынутое при встрече оружие начинает бой; хищник может броситься и сам',встреча.встреча2&&встреча.бойОтОружия&&встреча.хищник,встреча);

 /* ── 6. зелья стопкой ── */
 const зелья=await p.evaluate(()=>{
  const r={};G.potions=[];
  const дать=(id,q)=>potionsOf().push({id,q,стаб:0.99,день:G.day,срок:30,изъян:false});
  дать("mana",0.9);дать("mana",1.4);дать("mana",1.1);дать("clean",1);дать("clean",1);
  const строки=()=>invAll().filter(x=>x.kind==="potion");
  r.строк=строки().length;r.подписи=строки().map(x=>x.label);r.счёт=строки().map(x=>x.n);
  const ман=строки().find(x=>x.it.id==="mana");
  r.лучшая=ман&&ман.it.q;
  const mana0=G.mana;G.mana=0;drinkPotion(Number(ман.key));r.осталосьМаны=potionsOf().filter(x=>x.id==="mana").map(x=>x.q).sort();
  const ман2=строки().find(x=>x.it.id==="mana");
  invDropN(ман2,1,t=>t);r.послеВыброса=potionsOf().filter(x=>x.id==="mana").map(x=>x.q);
  openPotions();const кн=[...document.querySelectorAll('#potBody [data-cmd^="drinkpotion:"]')];r.вОкне=кн.length;r.окноСлова=кн.map(b=>b.textContent);
  while(activeLayer())closeTopUI();
  return r;});
 check('6. зелья одного вида — одна строка со счётом; пьётся лучшая склянка, выбрасывается худшая; окно «Зелья» — стопками',
  зелья.строк===2&&зелья.счёт.includes(3)&&зелья.счёт.includes(2)&&зелья.лучшая===1.4
  &&зелья.осталосьМаны.join()==="0.9,1.1"&&зелья.послеВыброса.join()==="1.1"&&зелья.вОкне===2,зелья);

 /* ── 7. Alt+цифра ── */
 const слоты=await p.evaluate(async()=>{
  const r={};G.potions=[];potionsOf().push({id:"mana",q:1,стаб:0.99,день:G.day,срок:30},{id:"mana",q:1,стаб:0.99,день:G.day,срок:30});
  const s=cbSlots();s[1]={kind:"potion",id:"mana"};
  while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
  ЖМИ("Alt+Digit2");await ЖДАТЬ(100);r.внеБоя=potionsOf().filter(x=>x.id==="mana").length;
  startCombat({x:G.x,y:G.y,monster:Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{hp:9999,dmg:0})});
  ЖМИ("Alt+Digit2");await ЖДАТЬ(100);r.вБою=potionsOf().filter(x=>x.id==="mana").length;
  endCombat();while(activeLayer())closeTopUI();
  r.клавиша=keyCombosOf("c_slot2").join();r.где=KB_BY_ID.c_slot2.ctx;
  return r;});
 check('7. Alt+цифра пьёт зелье из слота и вне боя, и в бою',слоты.внеБоя===1&&слоты.вБою===0&&слоты.клавиша==="Alt+Digit2"&&слоты.где==="any",слоты);

 /* ── 8. маяк ── */
 const маяк=await p.evaluate(async()=>{
  const r={};while(activeLayer())closeTopUI();G.place=null;G.inCombat=false;G.combat=null;
  TargetBeacon.stop(true);СКАЗАНО.length=0;ЖМИ("KeyB");r.безЦели=СКАЗАНО.slice();
  TargetBeacon.start({x:G.x+6,y:G.y-3,n:"проба",bid:"chest"});await ЖДАТЬ(100);
  СКАЗАНО.length=0;ЖМИ("KeyB");r.где=СКАЗАНО.slice();r.горит=!!TargetBeacon.t;
  СКАЗАНО.length=0;ЖМИ("Shift+KeyB");r.снят=СКАЗАНО.slice();r.погас=!TargetBeacon.t;
  r.клавиши={где:keyCombosOf("beaconwhere").join(),погасить:keyCombosOf("beaconoff").join()};r.жест=!!GEST_ACTION_BY_ID.beaconwhere;
  /* сам маяк по дороге словами не говорит */
  TargetBeacon.start({x:G.x+9,y:G.y,n:"проба",bid:"chest"});СКАЗАНО.length=0;await ЖДАТЬ(3500);
  r.поДороге=СКАЗАНО.filter(t=>/проба|Цель/.test(t));TargetBeacon.stop(true);
  return r;});
 check('8. B называет цель маяка со стороной и расстоянием; Shift+B гасит маяк; без цели B говорит, что маяк не горит; по дороге маяк молчит словами',
  маяк.безЦели.some(t=>/не горит/.test(t))&&маяк.горит&&маяк.где.some(t=>/Цель: проба, .*шаг/.test(t))&&маяк.снят.some(t=>/снят/.test(t))&&маяк.погас
  &&маяк.клавиши.где==="KeyB"&&маяк.клавиши.погасить==="Shift+KeyB"&&маяк.жест&&маяк.поДороге.length===0,маяк);

 check('9. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
