/* ════════════════════════════════════════════════════════════════════════
   НАБОР 77: ГОМУНКУЛ — СУЩЕСТВО, А НЕ ВЕЩЬ С ЧИСЛОМ

   «Собрать гомункула» давало артефакт: сосуд лежал в сумке и прибавлял
   число. Выбора не было ни одного, и два гомункула у двух игроков выходили
   одинаковыми.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Частей четыре рода, и все они описаны, с припасом и с числами.
   2. Разные части дают РАЗНЫХ существ: имя, предел и силы выводятся из
      выбора, а не бросаются наугад.
   3. Собрать нельзя без ступени и без припаса; припас вправду уходит;
      двоих разом не держат.
   4. Он живёт: сытость тает часами, кормление стоит того, что назвал
      источник силы, и голодный не работает.
   5. Предел и вправду мешает, а не только называется.
   6. Он учится: за поручения растёт опыт, за ступень открывается умение
      из тех, что положены его делу.
   7. Поручение делает то, что обещано делом: страж, разведчик, носильщик,
      лекарь, ищейка — пять разных исходов.
   8. Ищейка и вправду помогает искать тайники.
   9. Переучить можно за золото, отпустить — насовсем; всё переживает
      сохранение, и ни одно действие не молчит.
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

 /* ── 1. Таблицы ── */
 const части=await page.evaluate(()=>{
  const плохо=(сп,поля)=>сп.filter(z=>!z.id||!z.n||!z.о||поля.some(p=>z[p]===undefined)).map(z=>z.id||"?");
  return {основ:HOM_BASE.length,ядер:HOM_CORE.length,источников:HOM_POWER.length,дел:HOM_PURPOSE.length,
   пределов:HOM_LIMIT.length,
   плохиеОсновы:плохо(HOM_BASE,["hp","сила","ум","скор","припас"]),
   плохиеЯдра:плохо(HOM_CORE,["hp","учёба","припас"]),
   плохиеИсточники:HOM_POWER.filter(p=>!p.расход||!p.платит).map(p=>p.id),
   плохиеДела:HOM_PURPOSE.filter(p=>!p.дар||!(p.умения||[]).length).map(p=>p.id),
   сочетаний:HOM_BASE.length*HOM_CORE.length*HOM_POWER.length*HOM_PURPOSE.length,
   умений:HOM_PURPOSE.reduce((s,p)=>s+p.умения.length,0)};});
 check('частей четыре рода: шесть основ, пять ядер, пять источников силы, пять дел',
  части.основ>=6&&части.ядер>=5&&части.источников>=5&&части.дел>=5,части);
 check('у каждой части есть имя, объяснение, числа и припас',
  части.плохиеОсновы.length===0&&части.плохиеЯдра.length===0
  &&части.плохиеИсточники.length===0&&части.плохиеДела.length===0,части);
 check('сочетаний больше семисот, и у каждого дела свои умения',
  части.сочетаний>=700&&части.умений>=16&&части.пределов>=5,части);

 /* ── 2. Разные части — разные существа ── */
 const разные=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};
  const собрать=(b,c,p,n)=>{
   G.hom=null;
   for(const k of Object.keys(G.inv))delete G.inv[k];
   const {надо}=homunLacks(b,c);
   for(const k in надо)G.inv[k]=надо[k]+5;
   G.hp=G.hpMax;
   const ок=homunMake(b,c,p,n);
   return ок?{имя:G.hom.имя,предел:G.hom.предел,
    hp:homunStat(G.hom,"hp"),сила:homunStat(G.hom,"сила"),ум:homunStat(G.hom,"ум")}:null;};
  const набор=[];
  for(const b of HOM_BASE)for(const c of HOM_CORE.slice(0,3))
   набор.push(собрать(b.id,c.id,"mana","guard"));
  const имена=new Set(набор.filter(Boolean).map(z=>z.имя));
  const пределы=new Set(набор.filter(Boolean).map(z=>z.предел));
  const силы=new Set(набор.filter(Boolean).map(z=>z.hp+"/"+z.сила+"/"+z.ум));
  /* Один и тот же выбор даёт одно и то же существо: мир не бросает кости. */
  const a=собрать("clay","rune","fire","finder"),б=собрать("clay","rune","fire","finder");
  G.hom=null;
  return {собрано:набор.filter(Boolean).length,имён:имена.size,пределов:пределы.size,
   силовыхНаборов:силы.size,
   повтор:!!(a&&б&&a.имя===б.имя&&a.предел===б.предел&&a.hp===б.hp)};});
 check('разные части дают разных существ: разные силы и разные пределы',
  разные.силовыхНаборов>=6&&разные.пределов>=3,разные);
 check('имя у существа не одно на всех',разные.имён>=3,разные);
 check('один и тот же выбор даёт то же самое существо: кости здесь не бросают',разные.повтор,разные);

 /* ── 3. Условия сборки ── */
 const сборка=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.hom=null;G.mast={};
  for(const k of Object.keys(G.inv))delete G.inv[k];
  const безСтупени=homunMake("clay","ash","mana","guard");
  G.mast={homun:{ур:3,оп:0,дел:0}};
  const безПрипаса=homunMake("clay","ash","mana","guard");
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k];
  const доИнв=Object.values(G.inv).reduce((s,v)=>s+v,0);
  const собрал=homunMake("clay","ash","mana","guard");
  const послеИнв=Object.values(G.inv).reduce((s,v)=>s+v,0);
  const второй=homunMake("iron","heart","fire","guard");
  Speech.say=был;
  const t=сказ.join(" ");
  return {безСтупени,безПрипаса,собрал,второй,
   припасУшёл:послеИнв<доИнв,
   сказалПроСтупень:/ступен/i.test(t),сказалПроПрипас:/не хватает/i.test(t),
   сказалПроВторого:/двоих|отпустите/i.test(t)};});
 check('без второй ступени мастерства гомункула не собрать, и отказ называет ступень',
  сборка.безСтупени===false&&сборка.сказалПроСтупень,сборка);
 check('без припаса не собрать, и отказ называет, чего не хватает',
  сборка.безПрипаса===false&&сборка.сказалПроПрипас,сборка);
 check('с припасом собирается, и припас вправду уходит',
  сборка.собрал===true&&сборка.припасУшёл,сборка);
 check('двоих разом не держат, и об этом говорят словами',
  сборка.второй===false&&сборка.сказалПроВторого,сборка);

 /* ── 4. Он живёт ── */
 const жизнь=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k]+10;
  homunMake("clay","ash","mana","guard");
  const сразу=homunFull();
  G.hour+=10;while(G.hour>=24){G.hour-=24;G.day++;}
  const через10=homunFull();
  G.hour+=40;while(G.hour>=24){G.hour-=24;G.day++;}
  const голоден=homunFull();
  const отказ=homunWhyNot();
  const поручение=homunTend();
  /* Кормление стоит маны — ровно столько, сколько назвал источник. */
  G.mana=5;const безМаны=homunFeed();
  G.mana=G.manaMax=200;const доМаны=G.mana;
  const накормил=homunFeed();
  const послеМаны=G.mana;
  const сыт=homunFull();
  return {сразу:Math.round(сразу),через10:Math.round(через10),голоден:Math.round(голоден),
   отказ,поручение,безМаны,накормил,ушлоМаны:доМаны-послеМаны,сыт:Math.round(сыт)};});
 check('сытость тает час за часом, а не стоит на месте',
  жизнь.сразу>=95&&жизнь.через10<жизнь.сразу&&жизнь.голоден===0,жизнь);
 check('голодный не работает, и отказ объясняет, что его надо накормить',
  жизнь.поручение===false&&/пуст|накорм/i.test(String(жизнь.отказ)),жизнь);
 check('кормление стоит того, что назвал источник силы, и без платы не идёт',
  жизнь.безМаны===false&&жизнь.накормил===true&&жизнь.ушлоМаны===25,жизнь);
 check('накормленный снова полон',жизнь.сыт>=95,жизнь);

 /* ── 5. Предел мешает по-настоящему ── */
 const предел=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k]+10;
  G.mana=G.manaMax=300;
  homunMake("clay","ash","mana","finder");
  /* Поставим ему каждый предел по очереди и проверим, что мешающий мешает. */
  const итоги={};
  for(const л of HOM_LIMIT){
   G.hom.предел=л.id;
   homunFeed();
   /* Условия, при которых этот предел срабатывает. */
   G.weather="Ясно";G.hour=12;G.place=null;G.ship=null;
   const тихо=homunWhyNot();
   if(л.id==="water")G.weather="Ливень";
   else if(л.id==="night")G.hour=23;
   else if(л.id==="deep")G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:9,x:1,y:1};
   else if(л.id==="heat")G.weather="Зной";
   const плохо=homunWhyNot();
   G.weather="Ясно";G.hour=12;G.place=null;
   итоги[л.id]={свободен:тихо==="",скован:плохо!==""};}
  G.hom=null;
  return итоги;});
 const мешают=["water","night","deep","heat"].filter(id=>предел[id]&&предел[id].свободен&&предел[id].скован);
 check('пределы мешают по-настоящему: вода, темнота, глубина и жар останавливают работу',
  мешают.length===4,предел);

 /* ── 6. Он учится ── */
 const учёба=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;
  const {надо}=homunLacks("clay","rune");
  for(const k in надо)G.inv[k]=надо[k]+10;
  G.mana=G.manaMax=999;
  homunMake("clay","rune","mana","guard");
  G.hom.предел="greedy";                  /* предел, который не мешает работать */
  const доУр=G.hom.ур,доУм=(G.hom.умения||[]).length;
  for(let i=0;i<40;i++){homunFeed();homunTend();}
  const после={ур:G.hom.ур,умений:(G.hom.умения||[]).length,дел:G.hom.дел,оп:G.hom.оп};
  /* Умения берутся только из тех, что положены его делу. */
  const свои=HOM_PURPOSE_BY_ID[G.hom.назначение].умения.map(u=>u.id);
  const чужие=(G.hom.умения||[]).filter(id=>свои.indexOf(id)<0);
  return {доУр,доУм,после,чужие};});
 check('за поручения он растёт в ступени',учёба.после.ур>учёба.доУр,учёба);
 check('со ступенью открываются умения, и только те, что положены его делу',
  учёба.после.умений>учёба.доУм&&учёба.чужие.length===0,учёба);
 check('поручения считаются',учёба.после.дел>=10,учёба);

 /* ── 7. Пять дел — пять разных исходов ── */
 const дела=await page.evaluate(()=>{
  const итоги={};
  for(const p of HOM_PURPOSE){
   G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;
   const {надо}=homunLacks("clay","ash");
   for(const k in надо)G.inv[k]=надо[k]+10;
   G.mana=G.manaMax=999;G.hp=Math.max(1,Math.round(G.hpMax*0.4));
   G.buffs={};G.stash={};G.stashHints=[];
   G.place={kind:"dungeon",bx:1350,by:1350,stype:"ruins",name:"Низ",depth:4,x:4,y:4};
   homunMake("clay","ash","mana",p.id);
   G.hom.предел="greedy";
   homunFeed();
   const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
   const доHp=G.hp,доПодсказок=(G.stashHints||[]).length;
   const ок=homunTend();
   Speech.say=был;
   итоги[p.id]={ок,сказало:сказ.length>0,
    страж:buffActive("страж"),лёгкость:buffActive("лёгкость"),
    лечил:G.hp>доHp,указал:(G.stashHints||[]).length>доПодсказок,
    слов:сказ.join(" ").length};}
  G.place=null;G.hom=null;
  return итоги;});
 check('страж ставит защиту, носильщик — лёгкость, лекарь лечит, ищейка указывает тайник',
  дела.guard.страж&&дела.carry.лёгкость&&дела.healer.лечил&&дела.finder.указал,дела);
 check('разведчик рассказывает, что вокруг, а не молчит',
  дела.scout.ок&&дела.scout.сказало&&дела.scout.слов>30,дела);

 /* ── 8. Ищейка помогает искать ── */
 const поиск=await page.evaluate(()=>{
  G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;
  G.agi=10;G.mana=G.manaMax=999;
  G.place={kind:"dungeon",bx:1350,by:1350,stype:"ruins",name:"Низ",depth:4,x:4,y:4};
  const без=stashSkill();
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k]+10;
  homunMake("clay","ash","mana","finder");
  G.hom.предел="greedy";homunFeed();
  const с=stashSkill();
  /* Голодный не помогает вовсе. */
  G.hour+=60;while(G.hour>=24){G.hour-=24;G.day++;}
  const голодный=stashSkill();
  G.hom=null;G.place=null;
  return {без,с,голодный};});
 check('ищейка и вправду прибавляет к поиску тайников, а голодная — нет',
  поиск.с>поиск.без&&Math.abs(поиск.голодный-поиск.без)<1e-9,поиск);

 /* ── 9. Переучить, отпустить, сохранить ── */
 const конец=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.mast={homun:{ур:5,оп:0,дел:0}};G.hom=null;G.gold=0;
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k]+10;
  G.mana=G.manaMax=999;
  homunMake("clay","ash","mana","guard");
  G.hom.ур=3;
  const безДенег=homunSetPurpose("healer");
  G.gold=5000;const золДо=G.gold;
  const переучил=homunSetPurpose("healer");
  const дело=G.hom.назначение,умений=(G.hom.умения||[]).length;
  const тоЖе=homunSetPurpose("healer");
  const золПосле=G.gold;
  saveGame(true);
  const d=JSON.parse(localStorage.getItem(SAVE_KEY));
  const вСейве=!!(d&&d.hom&&d.hom.назначение==="healer");
  const отпустил=homunFree();
  const пусто=homun()===null;
  const н2=homunLacks("wax","crystal").надо;
  for(const k in н2)G.inv[k]=(Number(G.inv[k])||0)+н2[k]+5;
  const сноваМожно=homunMake("wax","crystal","sun","scout");
  Speech.say=был;
  G.hom=null;
  return {безДенег,переучил,дело,умений,тоЖе,заплачено:золДо-золПосле,вСейве,
   отпустил,пусто,сноваМожно,молчало:сказ.length<5};});
 check('переучить без денег нельзя, а с деньгами — можно, и золото уходит',
  конец.безДенег===false&&конец.переучил===true&&конец.заплачено>0,конец);
 check('после переучивания дело новое, и умения набраны под него',
  конец.дело==="healer"&&конец.умений>0&&конец.тоЖе===false,конец);
 check('гомункул переживает сохранение',конец.вСейве,конец);
 check('отпустить можно, и после этого собирается другой',
  конец.отпустил&&конец.пусто&&конец.сноваМожно,конец);
 check('ни одно из этих действий не молчит',!конец.молчало,конец);

 /* ── 10. Окно и меню ── */
 const окно=await page.evaluate(()=>{
  G.mast={};G.hom=null;
  const безРемесла=amAvailable("homun");
  G.mast={homun:{ур:2,оп:0,дел:0}};
  const сРемеслом=amAvailable("homun");
  openHomun();
  const пусто=document.getElementById("homunBody").innerHTML;
  const кнопок=document.querySelectorAll('#homunBody [data-cmd^="hombase:"]').length;
  /* Нажимаем настоящие кнопки: так проверяется и разбор команды. */
  const жми=(cmd)=>{const b=document.querySelector(`[data-cmd="${cmd}"]`);if(b)b.click();return !!b;};
  const нажалось=["hombase:clay","homcore:ash","hompower:mana","hompurpose:guard"].map(жми);
  const черновик=Object.assign({},G.homDraft);
  const {надо}=homunLacks("clay","ash");
  for(const k in надо)G.inv[k]=надо[k]+10;
  renderHomun();
  жми("hommake");
  const собран=!!homun();
  renderHomun();
  const речи=[...document.querySelectorAll("#homunBody [data-speak]")]
   .map(b=>b.getAttribute("data-speak")||"");
  G.hom=null;
  return {безРемесла,сРемеслом,кнопок,черновик,собран,нажалось,
   естьВыбор:/основа|Основа/.test(пусто),
   речей:речи.length,короткие:речи.filter(r=>r.length<25).length,
   безДыр:речи.every(r=>!/undefined|NaN|\[object/.test(r))};});
 check('пункт меню появляется только у того, кто учился ремеслу',
  окно.безРемесла===false&&окно.сРемеслом===true,окно);
 check('в окне сборки есть выбор всех частей, и он запоминается',
  окно.кнопок>=6&&окно.естьВыбор&&окно.черновик.base==="clay"&&окно.черновик.purpose==="guard",окно);
 check('кнопка «Собрать» и вправду собирает выбранное',окно.собран,окно);
 check('всё в окне озвучено и без служебного мусора',
  окно.речей>=3&&окно.короткие===0&&окно.безДыр,окно);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
