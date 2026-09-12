/* ════════════════════════════════════════════════════════════════════════
   ШКОЛЫ МИРА, УМЕНИЯ И МНОГОСТУПЕНЧАТОЕ ОБУЧЕНИЕ

   Учиться было почти нечему: навыки выпадали из книг случайно, заклинания
   продавались в башнях. Ни выбора, ни пути, ни причины ехать за знанием.

   Теперь у держав, народов и кланов есть школы: двадцать домов, у каждого
   три ступени — подмастерье, мастер, хранитель, — и каждая ступень даёт
   своё: навык, заклинание или умение. Умений двадцать четыре, и все они
   что-то делают: одни работают сами, другие применяются и стоят маны,
   времени или одного раза в день.

   Здесь проверяется, что школы есть в мире и находятся; что ступени идут по
   порядку и не даются даром; что каждое умение делает обещанное; что дары
   доходят до тех систем, где они должны работать; и что всё это переживает
   запись.
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
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Реестр школ и умений цел ── */
 const реестр=await page.evaluate(()=>{
  const беды=[],ids=new Set();
  SCHOOL_DB.forEach(sc=>{
   if(ids.has(sc.id))беды.push("двойной id "+sc.id);ids.add(sc.id);
   if(!sc.n||!sc.слово||sc.слово.length<30)беды.push(sc.id+": нет имени или слова");
   if(sc.ступени.length!==3)беды.push(sc.id+": ступеней "+sc.ступени.length);
   if(!BEACON_INFO[sc.дом])беды.push(sc.id+": неведомый дом "+sc.дом);
   if(sc.где.вид==="держава"&&!EMPIRES.some(e=>e.short===sc.где.кто))беды.push(sc.id+": нет державы");
   if(sc.где.вид==="народ"&&!RACE_BY_NAME[sc.где.кто])беды.push(sc.id+": нет народа");
   if(sc.где.вид==="клан"&&!CLANS.includes(sc.где.кто))беды.push(sc.id+": нет клана "+sc.где.кто);
   let цена=0;
   sc.ступени.forEach(ст=>{
    if(!ст.n||!ст.цена)беды.push(sc.id+": ступень без имени или цены");
    if(ст.цена<=цена)беды.push(sc.id+": ступень не дороже предыдущей");
    цена=ст.цена;
    const g=ст.даёт||{};
    if(!g.навык&&!g.умение&&!g.заклинание)беды.push(sc.id+": ступень ничего не даёт");
    if(g.навык&&!SKILL_BY_ID[g.навык])беды.push(sc.id+": нет навыка "+g.навык);
    if(g.умение&&!ABILITY_BY_ID[g.умение])беды.push(sc.id+": нет умения "+g.умение);
    if(g.заклинание&&!SPELLS.some(s=>s.n===g.заклинание))беды.push(sc.id+": нет чар "+g.заклинание);});});
  ABILITIES.forEach(a=>{
   if(!a.d||a.d.length<20)беды.push("умение без описания: "+a.id);
   if(a.вид==="деяние"&&typeof a.use!=="function")беды.push("деяние без дела: "+a.id);
   if(a.вид!=="деяние"&&a.вид!=="дар")беды.push("непонятный вид: "+a.id);});
  /* Каждое умение кто-нибудь да преподаёт. */
  const дают=new Set();
  SCHOOL_DB.forEach(sc=>sc.ступени.forEach(ст=>{if(ст.даёт.умение)дают.add(ст.даёт.умение);}));
  const сироты=ABILITIES.filter(a=>!дают.has(a.id)).map(a=>a.id);
  return {школ:SCHOOL_DB.length,умений:ABILITIES.length,беды,сироты,
   видов:new Set(SCHOOL_DB.map(s=>s.где.вид)).size};});
 check('двадцать школ и двадцать четыре умения, и в реестре нет дыр',
  реестр.школ>=20&&реестр.умений>=24&&реестр.беды.length===0,
  {школ:реестр.школ,умений:реестр.умений,беды:реестр.беды.slice(0,5)});
 check('школы держат державы, народы и кланы — все три вида',реестр.видов===3,реестр);
 check('каждому умению где-нибудь да учат',реестр.сироты.length===0,реестр.сироты);

 /* ── 2. Школы стоят в мире и находятся ── */
 const вМире=await page.evaluate(()=>{
  const найдено={},дома=["forge","school","tavern","tower","temple","clanhall","port"];
  for(let x=60;x<WORLD;x+=137)for(let y=60;y<WORLD;y+=149)
   for(const st of дома){const sc=safeFn(()=>schoolAt(x,y,st),null);if(sc)найдено[sc.id]=(найдено[sc.id]||0)+1;}
  const нет=SCHOOL_DB.filter(s=>!найдено[s.id]).map(s=>s.id);
  /* Школа постоянна для дома и разная у соседей. */
  const пост=[];const кузни=new Set();
  for(let i=0;i<20;i++){
   const x=300+i*77,y=400+i*53;
   const a=safeFn(()=>schoolAt(x,y,"forge"),null),c=safeFn(()=>schoolAt(x,y,"forge"),null);
   пост.push((!a&&!c)||(a&&c&&a.id===c.id));}
  const e=EMPIRES[0].cap;
  for(let i=0;i<12;i++){const sc=safeFn(()=>schoolAt(e.x+i*3,e.y+i*5,"forge"),null);if(sc)кузни.add(sc.id);}
  /* Внутри постройки школа та же, что и на карте. */
  G.place=null;
  enterPlace({x:e.x,y:e.y,structure:{type:"forge",name:"Горн",beacon:"forge"}});
  const внутри=schoolHere(),снаружи=schoolAt(e.x,e.y,"forge");
  const сказано=речь();
  while(activeLayer())closeTopUI();G.place=null;
  return {нет,постоянна:пост.every(Boolean),кузниРазные:кузни.size,
   совпало:!!внутри&&!!снаружи&&внутри.id===снаружи.id};});
 check('все двадцать школ встречаются в мире',вМире.нет.length===0,вМире.нет);
 check('школа дома постоянна: одна и та же кузня учит одному и тому же',
  вМире.постоянна===true&&вМире.совпало===true,вМире);
 check('соседние дома одного вида держат разные школы',вМире.кузниРазные>=2,вМире);

 /* ── 3. Ступени идут по порядку и не даются даром ── */
 const учёба=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const e=EMPIRES[0].cap;
  G.place=null;G.abilities=[];G.skills=[];G.schools={};G.spells=["Искра"];
  G.level=1;G.gold=10;G.rep={};G.clanRep=0;
  enterPlace({x:e.x,y:e.y,structure:{type:"forge",name:"Горн",beacon:"forge"}});
  const sc=schoolHere();
  window.__said=[];
  const бедный=trainSchool(sc.id);
  const жалоба=речь();
  /* Дадим денег и уровень — но не доверие. */
  G.gold=5000;G.level=12;
  const первый=trainSchool(sc.id);
  const второй=trainSchool(sc.id);   /* второй ступени нужно доверие народа */
  const беды=schoolBlockers(sc);
  addRep(EMPIRES[0].race,20);G.clanRep=20;
  const второйПосле=trainSchool(sc.id);
  const третий=trainSchool(sc.id);
  const лишний=trainSchool(sc.id);
  const золото=G.gold;
  /* Учиться можно только в доме школы. */
  while(activeLayer())closeTopUI();G.place=null;
  const вПоле=trainSchool(sc.id);
  return {бедный,жалоба:жалоба.slice(0,120),первый,второй,второйПосле,третий,лишний,вПоле,
   ступень:schoolStep(sc.id),умения:(G.abilities||[]).length,золото,
   беды:беды.length};});
 check('без денег и уровня не учат, и говорят чего не хватает',
  учёба.бедный===false&&/не по вам|нужно/i.test(учёба.жалоба),учёба);
 check('ступени берутся по одной и по порядку',
  учёба.первый===true&&учёба.второй===false&&учёба.второйПосле===true&&учёба.третий===true,учёба);
 check('пройденную школу нельзя пройти второй раз',учёба.лишний===false&&учёба.ступень===3,учёба);
 check('учат только в доме школы, а не по всему миру',учёба.вПоле===false,учёба);
 check('обучение оставляет умения и берёт золото',
  учёба.умения>=2&&учёба.золото<5000,учёба);

 /* ── 4. Умения делают обещанное ── */
 const дела=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const out={};
  G.abilities=ABILITIES.map(a=>a.id);G.buffs={};G.daily={};
  G.place=null;G.ship=null;G.alt=0;G.x=1000;G.y=1000;G.mana=999;G.hp=10;G.hpMax=100;
  /* Раз в день — только раз. */
  out.разВДень=[useAbility("lastrite"),useAbility("lastrite")];
  out.лечит=G.hp;
  /* Деяние, которому нужен мир, без мира не тратится. */
  G.mana=100;
  const до=G.mana;
  out.мореБезКорабля=useAbility("seavoice");
  out.манаЦела=G.mana===до;
  /* Корневой шаг переносит. */
  const бx=G.x,бy=G.y;
  out.корни=useAbility("rootwalk");
  out.перенёс=(G.x!==бx||G.y!==бy);
  /* Память карты наполняет молву. */
  G.known={};
  out.карта=useAbility("mapmind");
  out.вМолве=knownList().length;
  /* Зов неба поднимает бескрылого. */
  G.race="Гномы";G.alt=0;G.mana=999;G.daily={};
  out.небо=useAbility("skycall");
  out.высота=Number(G.alt)||0;
  G.alt=0;
  /* Дар не применяется, а работает сам. */
  out.дар=useAbility("oresense");
  return out;});
 check('умение «раз в день» работает один раз за день',
  дела.разВДень[0]===true&&дела.разВДень[1]===false&&дела.лечит===100,дела);
 check('деяние, которому нужен мир, не тратит ману впустую',
  дела.мореБезКорабля===false&&дела.манаЦела===true,дела);
 check('корневой шаг переносит игрока в лес',дела.корни===true&&дела.перенёс===true,дела);
 check('память карты кладёт окрестные места в молву',дела.карта===true&&дела.вМолве>0,дела);
 check('зов неба поднимает даже бескрылого',дела.небо===true&&дела.высота>0,дела);
 check('дар не применяется как деяние, а работает сам',дела.дар===false,дела);

 /* ── 5. Дары доходят до систем ── */
 const дары=await page.evaluate(()=>{
  const out={};
  while(activeLayer())closeTopUI();
  G.buffs={};G.place=null;G.x=1000;G.y=1000;
  /* Перо ветра: потолок и цена крыла. */
  G.race="Аракокры";G.abilities=[];
  const пБез=wingSpan(),цБез=wingCost();
  G.abilities=["windfeath"];
  out.крыло={потолокБез:пБез,потолокС:wingSpan(),ценаБез:+цБез.toFixed(2),ценаС:+wingCost().toFixed(2)};
  /* Железный язык: цена у торговца. */
  G.abilities=[];
  const n=getNPC(G.x,G.y,0,"Торговец");
  const дорого=npcAsk(n,"руда");
  buffSet("tongueiron",5);
  const дёшево=npcAsk(n,"руда");
  G.buffs={};
  out.торг={дорого,дёшево};
  /* Стальное сердце и стена щитов гасят урон. */
  out.держится={без:buffActive("steelheart")};
  buffSet("steelheart",4);
  out.держится.с=buffActive("steelheart");
  /* Час мира проходит — дар кончается. */
  G.hour+=5;while(G.hour>=24){G.hour-=24;G.day++;}
  out.держится.после=buffActive("steelheart");
  G.buffs={};G.abilities=[];
  return out;});
 check('перо ветра поднимает потолок и бережёт крыло',
  дары.крыло.потолокС>дары.крыло.потолокБез&&дары.крыло.ценаС<дары.крыло.ценаБез,дары.крыло);
 check('железный язык сбивает цену у торговца',дары.торг.дёшево<дары.торг.дорого,дары.торг);
 check('временный дар держится и сам кончается со временем',
  дары.держится.без===false&&дары.держится.с===true&&дары.держится.после===false,дары.держится);

 /* ── 6. Окно школ ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const e=EMPIRES[0].cap;
  G.place=null;G.abilities=["forgecall","oresense"];G.schools={};G.gold=5000;G.level=12;
  enterPlace({x:e.x,y:e.y,structure:{type:"forge",name:"Горн",beacon:"forge"}});
  window.__said=[];
  CMD.school();
  const слой=activeLayer()&&activeLayer().id;
  const строк=document.querySelectorAll("#schoolList .list-line").length;
  const кнопки=[...document.querySelectorAll("#schoolList button")].map(b=>b.dataset.cmd||"");
  const сказано=речь();
  while(activeLayer())closeTopUI();
  /* И вне школы окно открывается: там видны хотя бы свои умения. */
  G.place=null;window.__said=[];
  CMD.school();
  const внеСтрок=document.querySelectorAll("#schoolList .list-line").length;
  const внеСлово=речь();
  while(activeLayer())closeTopUI();
  return {слой,строк,ступень:кнопки.some(c=>/^train:/.test(c)),
   применить:кнопки.some(c=>/^ability:/.test(c)),сказано:сказано.slice(0,140),
   внеСтрок,внеСлово:внеСлово.slice(0,120)};});
 check('окно школ открывается и показывает здешнюю школу со ступенями',
  окно.слой==="modal-school"&&окно.строк>=20&&окно.ступень===true,окно);
 check('свои умения перечислены и их можно применить прямо оттуда',окно.применить===true,окно);
 check('вне школы окно не пустует: умения и список школ мира на месте',
  окно.внеСтрок>=20&&/не учат/i.test(окно.внеСлово),окно);

 /* ── 7. Всё это переживает запись ── */
 const запись=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.abilities=["forgecall"];G.schools={pik_forge:2};G.buffs={};G.daily={};
  buffSet("warcry",6);dailyMark("lastrite");
  saveGame(true);
  G.abilities=[];G.schools={};G.buffs={};G.daily={};
  loadGame(true);
  return {умения:(G.abilities||[]).slice(),ступень:schoolStep("pik_forge"),
   дар:buffActive("warcry"),деньРаза:dailyUsed("lastrite")};});
 check('умения, ступени, дары и «раз в день» переживают запись',
  запись.умения.indexOf("forgecall")>=0&&запись.ступень===2&&
  запись.дар===true&&запись.деньРаза===true,запись);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
