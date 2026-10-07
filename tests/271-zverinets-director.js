/* 11.5: Зверинец Грани и Режиссёр мира.
   Просьба игрока: «систему маунтов, питомцев: ездить на маунтах, брать с
   собой питомцев в поддержку, кормить их, развивать и снаряжать; питомцы
   различного вида; огромное количество летающих, ходящих и ползающих» и
   «чтобы мир сам развивался: магия, древние механизмы, боги». Набор
   проверяет, что всё это живое, а не список имён:
   — пород больше пятисот, летающих, ходячих и ползучих — по сотне и больше,
     у каждого рода голос из банка;
   — в городе зверя покупают, на ездового садятся, и дар его работает в пути
     так же, как у скакуна тайных палат (крыло, шаг);
   — зверя кормят, он растёт, очки уходят в ветви, снаряжение надевается;
   — спутники бьют, лечат и закрывают в бою; побеждённого зверя приручают;
   — заброшенный зверь голодает и уходит;
   — Режиссёр подстраивает тварей в пределах своей силы, даёт передышку,
     заводит мстителей, учится против любимого приёма, а мир каждые сутки
     развивается сам: эфир, машины Предтеч, боги, звери, алхимия;
   — настройка «Режиссёр» в настройках, окна и пункты меню без ошибок. */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* ── 1. каталог ── */
 const кат=await p.evaluate(()=>{const c=Zver.counts();
  return {c,родов:ZV_FAMILIES.length,обликов:ZV_VARIANTS.length,
   безГолоса:ZV_FAMILIES.filter(f=>!Bank.has(f.звук)).map(f=>f.id),
   ходы:[...new Set(ZV_FAMILIES.map(f=>f.ход))].length,
   именаЦелы:ZV_BREEDS.every(b=>typeof b.n==="string"&&b.n.length>2&&!/undefined/.test(b.n)),
   разные:new Set(ZV_BREEDS.map(b=>b.n)).size===ZV_BREEDS.length,
   легендыБогов:ZV_LEGENDS.every(l=>PANTHEON.some(g=>g.id===l.бог)&&ZV_FAMILY_BY_ID[l.fam])};});
 check('1. пород больше пятисоти: летающих, ходячих и ползучих — по сотне и больше, плавучие и роющие тоже есть',
  кат.c.всего>=500&&кат.c.fly>=100&&кат.c.walk>=100&&кат.c.crawl>=100&&кат.c.swim>=20&&кат.c.dig>=20&&кат.ходы===5&&кат.родов>=45&&кат.обликов>=20,кат.c);
 check('1б. у каждого рода голос из банка; имена пород целые и не повторяются; двенадцать легенд — звери богов пантеона',
  кат.безГолоса.length===0&&кат.именаЦелы&&кат.разные&&кат.c.легенд===12&&кат.легендыБогов,кат);

 /* ── 2. покупка и езда ── */
 const езда=await p.evaluate(()=>{const r={};G.zv=null;G.mount=null;G.gold=100000;G.place=null;
  r.вПоле=Zver.buy("griffin_storm");
  G.place={kind:"city",bx:G.x,by:G.y,stype:"village",name:"Тестовое село",depth:0,x:1,y:1};
  r.витрина=Zver.shop().length;
  r.грифон=Zver.buy("griffin_storm");r.конь=Zver.buy("horse_wild");r.паук=Zver.buy("spider_shadow");r.кот=Zver.buy("cat_moon");r.пёс=Zver.buy("hound_wild");
  const s=Zver.st();r.зверей=s.list.length;const id=n=>s.list.find(a=>a.breed===n).uid;
  r.котВерхом=Zver.ride(id("cat_moon"));
  r.седло=Zver.ride(id("griffin_storm"));r.крыло=mountGift("крыло");r.шаг=mountGift("шаг");r.канКрыло=safeFn(()=>wingSpan(),0);
  Zver.ride(id("horse_wild"));r.шагКонь=mountGift("шаг");r.крылоКонь=mountGift("крыло");
  Zver.ride(id("spider_shadow"));r.тихо=mountGift("скрытность");r.скан=mountGift("скан");
  r.пеший=Zver.dismount();r.шагПеш=mountGift("шаг");
  return r;});
 check('2. вне города зверя не купить; в городе зверинец продаёт породы, деньги списываются, звери в стойле',
  /город/.test(езда.вПоле)&&езда.витрина>=6&&езда.зверей===5,езда);
 check('2б. на кота не сесть; грифон поднимает на крыло, конь и паук — каждый своим даром; пешком даров нет',
  /мал/.test(езда.котВерхом)&&езда.крыло>=1&&езда.канКрыло>=1&&езда.шаг<1&&езда.шагКонь<1&&езда.крылоКонь==null&&езда.тихо>0&&езда.скан>=1&&езда.шагПеш==null,езда);

 /* ── 3. корм, рост, ветви, снаряжение ── */
 const рост=await p.evaluate(()=>{const r={};const s=Zver.st();const кот=s.list.find(a=>a.breed==="cat_moon");const конь=s.list.find(a=>a.breed==="horse_wild");
  G.inv=G.inv||{};delete G.inv["рыба"];delete G.inv["мясо"];
  кот.сыт=30;r.безКорма=Zver.feed(кот.uid);
  G.inv["рыба"]=5;r.корм=Zver.feed(кот.uid);r.сыт=кот.сыт;
  r.безОчков=Zver.grow(кот.uid,"sense");
  Zver.xp(кот,20000);r.ур=кот.lvl;r.очки=Zver.points(кот);
  r.ветвь=Zver.grow(кот.uid,"sense");r.ход=Zver.grow(кот.uid,"move");r.ветви=Object.assign({},кот.ветви);
  r.чутьё0=ZV_FAMILY_BY_ID.cat.чутьё;r.чутьё=Zver.stat(кот,"чутьё");
  const шаг0=Zver.gift(конь,"шаг");
  r.купил=Zver.buyGear("saddle","rune");r.надел=Zver.equip(конь.uid,"saddle","rune");r.шаг1=Zver.gift(конь,"шаг");r.шаг0=шаг0;
  r.неТо=Zver.equip(кот.uid,"saddle","rune");
  r.слова=Zver.giftWords(конь).join("; ");
  return r;});
 check('3. корм: без нужного не накормить, любимый насыщает; зверь растёт до 30, каждые три уровня — очко в ветвь',
  /нет/.test(рост.безКорма)&&рост.сыт>=70&&/любимый/.test(рост.корм)&&/очков нет/.test(рост.безОчков)&&рост.ур===30&&рост.очки===10&&рост.ветви.sense===1&&рост.ветви.move===1&&рост.чутьё>рост.чутьё0,рост);
 check('3б. седло покупается и надевается на скакуна (путь короче), кот седла не носит; дары озвучены словами',
  /Куплено/.test(рост.купил)&&/надето/.test(рост.надел)&&рост.шаг1<рост.шаг0&&/не носит/.test(рост.неТо)&&/короче/.test(рост.слова),рост);

 /* ── 4. спутники в бою ── */
 const бой=await p.evaluate(()=>{const r={};const s=Zver.st();G.place=null;
  const пёс=s.list.find(a=>a.breed==="hound_wild"),кот=s.list.find(a=>a.breed==="cat_moon");
  пёс.верн=80;кот.верн=80;пёс.сыт=90;кот.сыт=90;
  r.пёс=Zver.follow(пёс.uid);r.кот=Zver.follow(кот.uid);
  r.третий=Zver.follow(s.list.find(a=>a.breed==="spider_shadow").uid);
  Zver.role(пёс.uid,"hunter");Zver.role(кот.uid,"healer");
  r.спутников=Zver.pets().length;
  const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{hp:500});
  startCombat({x:G.x,y:G.y,monster:m});G.hp=Math.max(1,G.hpMax-20);
  const hp0=G.combat.hp,me0=G.hp;
  r.ход=Zver.turn(G.combat,"atk");r.урон=hp0-G.combat.hp;r.лечение=G.hp-me0;
  Zver.role(пёс.uid,"guard");Zver.turn(G.combat,"atk");r.закрыл=Zver.guard(100);r.второй=Zver.guard(100);
  G.combat.hp=500;fight("atk");r.журнал=cbLog2text();
  endCombat();
  return r;});
 check('4. до двух спутников; охотник рвёт тварь, лекарь лечит, защитник принимает часть удара (один раз за ход)',
  бой.спутников===2&&/двое/.test(бой.третий)&&бой.урон>0&&бой.лечение>0&&бой.закрыл<100&&бой.второй===100,бой);
 check('4б. в настоящем бою ход спутников звучит в сводке схватки',/пёс|Пёс/.test(бой.журнал),бой.журнал);

 /* ── 4в. свой урон ── */
 const урон=await p.evaluate(()=>{const r={};const z=id=>Zver.dmgOf(ZV_BREED_BY_ID[id]);
  r.медведь=z("bear_wild");r.кот=z("cat_wild");r.дракон=z("drake_wild");r.пепельный=z("drake_ash");r.легенда=z("lg_ash");
  const a=Zver.make("wolf_wild",{lvl:1});r.ур1=Zver.dmg(a);a.lvl=10;r.ур10=Zver.dmg(a);a.ветви.fang=2;r.клык=Zver.dmg(a);
  a.снар.claws="star";r.когти=Zver.dmg(a);a.сыт=5;r.голод=Zver.dmg(a);
  a.сыт=90;r.строка=Zver.brief(a);Zver.release(a.uid);
  r.всеСвои=ZV_BREEDS.every(b=>Zver.dmgOf(b)>=1);r.разных=new Set(ZV_BREEDS.map(b=>Zver.dmgOf(b))).size;
  return r;});
 check('4в. у каждого питомца свой урон: медведь бьёт сильнее кота, облик и легенда добавляют, растёт с уровнем, «Клыком» и когтями, голодный — вполовину; урон назван',
  урон.всеСвои&&урон.разных>=15&&урон.медведь>урон.кот&&урон.пепельный>урон.дракон&&урон.легенда>урон.пепельный&&урон.ур10>урон.ур1&&урон.клык>урон.ур10&&урон.когти>урон.клык&&урон.голод<урон.когти&&/урон \d+/.test(урон.строка),урон);

 /* ── 5. приручение и яйца ── */
 const ручной=await p.evaluate(()=>{const r={};const s=Zver.st();const до=s.list.length;
  const rnd=Math.random;Math.random=()=>0.01;
  try{const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"));r.победа=Zver.onWin(m);r.предлог=!!s.tame;r.меню=amAvailable("zvtame");
   G.inv["мясо"]=3;r.приручил=Zver.tame();}finally{Math.random=rnd;}
  r.стало=s.list.length-до;r.ктоИмя=(s.list[s.list.length-1]||{}).n;
  r.яйцо=Zver.egg("dragonfly","проверка");const d0=G.day;G.day+=6;r.вылупился=Zver.hatch();G.day=d0;s.day=G.day;
  return r;});
 check('5. побеждённый зверь ждёт, его приручают кормом; яйцо вылупляется в свой срок',
  ручной.предлог&&/приручить/i.test(ручной.победа)&&ручной.стало===1&&/вылупился/.test(ручной.вылупился),ручной);

 /* ── 6. голод и верность ── */
 const голод=await p.evaluate(()=>{const r={};const s=Zver.st();const a=Zver.make("boar_wild",{верн:10});a.сыт=10;
  const n0=s.list.length;s.day=G.day;G.day+=3;Zver.tick();r.ушёл=!s.list.some(x=>x.uid===a.uid);r.стало=n0-s.list.length;G.day-=3;s.day=G.day;return r;});
 check('6. заброшенный голодный зверь уходит',голод.ушёл,голод);

 /* ── 7. Режиссёр: подстройка, передышка, мстители, учёба ── */
 const реж=await p.evaluate(()=>{const r={};G.dir=null;const wolf=()=>Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:3,hp:100,dmg:10});
  const base=wolf().hp;const rnd=Math.random;Math.random=()=>0.99;
  try{
   settings.director="off";let m=wolf();Director.onCombat(m,{});r.выкл=m.hp;
   settings.director="normal";Director.st().skill=1;Director.st().relax=0;Director.st().tension=0;m=wolf();Director.onCombat(m,{});r.мастер=m.hp;
   Director.st().skill=0;m=wolf();Director.onCombat(m,{});r.новичок=m.hp;
   settings.director="hard";Director.st().skill=1;m=wolf();Director.onCombat(m,{});r.жёстко=m.hp;
   settings.director="normal";Director.st().skill=0.5;Director.st().relax=3;m=wolf();Director.onCombat(m,{});r.передышка=m.hp;r.relaxПосле=Director.st().relax;
   Director.st().relax=0;Director.st().tension=90;m=wolf();Director.onCombat(m,{});r.затишье=m.hp;
  }finally{Math.random=rnd;}
  r.base=base;
  Math.random=()=>0.1;try{Director.onFlee(wolf());r.мстители=Director.st().nem.length;const nm=Director.st().nem[0];r.прозвище=nm&&nm.n;
   const m=wolf();Director.st().relax=0;Director.st().tension=0;Director.onCombat(m,{});r.вернулся=m.n;r.мститель=!!m.zvNem;
   G.combat={m,hp:1};const g0=G.gold;r.наградa=Director.onWin(m);r.золото=G.gold-g0;G.combat=null;
   for(let i=0;i<10;i++)Director.onSpell("fire");r.любимый=Director.favSchool();m.dirResist=null;
   const m2=wolf();Director.onCombat(m2,{});r.стойкость=m2.dirResist;G.combat={m:m2,hp:10};r.spellK=Director.spellK("fire");r.spellKдр=Director.spellK("water");G.combat=null;
  }finally{Math.random=rnd;}
  return r;});
 check('7. Режиссёр выключен — тварь как задумана; мастеру — крепче, новичку — слабее, в пределах силы (обычный ±20 %, жёсткий ±30 %)',
  реж.выкл===реж.base&&реж.мастер>реж.base&&реж.мастер<=Math.round(реж.base*1.2)+1&&реж.новичок<реж.base&&реж.новичок>=Math.round(реж.base*0.8)-1&&реж.жёстко>реж.мастер,реж);
 check('7б. после тяжёлой схватки — передышка (тварь слабее), в долгом затишье угроза копится (крепче)',
  реж.передышка<реж.base&&реж.relaxПосле===2&&реж.затишье>реж.base,реж);
 check('7в. тварь, от которой бежали, получает прозвище и возвращается; за мстителя — награда',
  реж.мстители===1&&реж.мститель&&реж.вернулся===реж.прозвище&&реж.золото>0&&/Мститель/.test(реж.наградa),реж);
 check('7г. любимый приём замечен: тварь приходит стойкой к нему, и только к нему',
  реж.любимый==="fire"&&реж.стойкость==="fire"&&реж.spellK<1&&реж.spellKдр===1,реж);

 /* ── 8. мир развивается сам ── */
 const мир=await p.evaluate(()=>{const r={};settings.director="normal";const s=Director.st();
  s.world.ether=90;r.прилив=Director.ev_magic();s.world.ether=10;r.отлив=Director.ev_magic();
  s.world.mech=80;r.машина=Director.ev_mech();r.мест=Object.keys(s.sites).length;
  s.world.gods.storm=40;s.world.gods.ash=-40;
  const pick=Math.floor;r.боги=[];for(const id of ["storm","ash"]){const i=PANTHEON.findIndex(g=>g.id===id);const rnd=Math.random;Math.random=()=>(i+0.5)/PANTHEON.length;try{r.боги.push(Director.ev_gods());}finally{Math.random=rnd;}}
  r.звери=Director.ev_beasts();r.алхимия=Director.ev_alchemy();
  const g0=G.gold;s.sites={t:{x:G.x,y:G.y,род:"тайник",день:G.day}};G.inCombat=false;Director.siteCheck();r.тайник=G.gold-g0;
  s.sites={g:{x:G.x,y:G.y,род:"страж",день:G.day}};Director.siteCheck();r.страж=G.inCombat&&G.combat?{n:G.combat.m.n,hp:G.combat.hp}:null;if(G.inCombat)endCombat();
  const d0=G.day;const ch0=s.chron.length;s.day=G.day;G.day+=3;Director.tick();r.летопись=s.chron.length-ch0;G.day=d0;s.day=G.day;
  for(let i=0;i<40;i++)for(const a of DIRECTOR_ARMS){s.lastArm=a;Director.reward(a==="beasts"?1:0);}
  r.бандит=[s.bandit.beasts.a/(s.bandit.beasts.a+s.bandit.beasts.b),s.bandit.mech.a/(s.bandit.mech.a+s.bandit.mech.b)];
  /* (Режиссёр 2) выбор дня делает контекстный бандит LinUCB: учим его в том же положении */
  const x=Director.feats();for(let i=0;i<30;i++)for(const a of DIR2_ARMS)Director.learnLin(a,x,a==="beasts"?1:0);
  let звери=0;for(let i=0;i<50;i++)if(Director.pick()==="beasts")звери++;r.выбор=звери/50;
  return r;});
 check('8. эфир: прилив и отлив; машины Предтеч просыпаются на карте; боги благоволят и гневаются своими голосами',
  /прилив/.test(мир.прилив)&&/отхлынул/.test(мир.отлив)&&/Предтеч/.test(мир.машина)&&мир.мест>=1&&/благоволит/.test(мир.боги[0])&&/гневается/.test(мир.боги[1]),мир);
 check('8б. звери и алхимия тоже двигают мир; машина-тайник открывается, когда герой дойдёт, а у стерегущей встаёт медный страж; сутки пишут летопись',
  мир.звери.length>20&&мир.алхимия.length>20&&мир.тайник===60&&мир.летопись>=1&&!!мир.страж&&/Медный страж/.test(мир.страж.n)&&мир.страж.hp>30,мир);
 check('8в. обучаемая часть: «многорукий бандит» чаще выбирает те события, после которых игрок играет дальше',
  мир.бандит[0]>0.8&&мир.бандит[1]<0.2&&мир.выбор>0.8,мир);

 /* ── 9. настройка, окна, меню ── */
 const ui=await p.evaluate(()=>{const r={};
  renderDifficulty();const row=document.getElementById("dirRow");r.кнопок=row?row.querySelectorAll("button").length:0;
  CMD.setdir("hard");r.режим=settings.director;r.нажата=!!document.querySelector('#dirRow [aria-pressed="true"][data-cmd="setdir:hard"]');CMD.setdir("normal");
  const s=Zver.st();const views={home:()=>Zver.home(),beast:()=>Zver.beastView(s.list[0].uid),shop:()=>Zver.shopView(),gear:()=>Zver.gearView(),best:()=>Zver.bestView()};
  for(const [k,f] of Object.entries(views)){try{f();r[k]=document.getElementById("zvBody").textContent.length;}catch(e){r[k]="ошибка "+String(e).slice(0,80);}}
  try{Director.home();r.режиссёр=document.getElementById("dirBody").textContent.length;}catch(e){r.режиссёр="ошибка "+String(e).slice(0,80);}
  while(activeLayer())closeTopUI();
  try{CMD.zv("beast:"+s.list[0].uid);r.кнопкаЗверя=document.getElementById("zvBody").querySelectorAll("button").length;}catch(e){r.кнопкаЗверя="ошибка "+e;}
  while(activeLayer())closeTopUI();
  r.меню=["zver","zvride","zvfeed","zvtame","director"].every(c=>AM_ITEMS.some(x=>x[0]===c));
  r.команды=["zv","zver","zvride","zvfeed","zvtame","dir","director","setdir"].every(c=>typeof CMD[c]==="function");
  const копия=JSON.parse(JSON.stringify({zv:G.zv,dir:G.dir}));r.сохранение=копия.zv.list.length===s.list.length&&!!копия.dir.world;
  return r;});
 check('9. настройка «Режиссёр» — четыре кнопки, выбор сохраняется',ui.кнопок===4&&ui.режим==="hard"&&ui.нажата,ui);
 check('9б. окна «Зверинец» (стойло, зверь, город, снаряжение, бестиарий) и «Режиссёр» открываются и не пусты',
  ["home","beast","shop","gear","best","режиссёр"].every(k=>typeof ui[k]==="number"&&ui[k]>40)&&ui.кнопкаЗверя>=5,ui);
 check('9в. пункты меню и команды на месте; звери и Режиссёр сохраняются вместе с игрой',ui.меню&&ui.команды&&ui.сохранение,ui);

 /* ── 11. своё у зверей ── */
 const своё=await p.evaluate(()=>{const r={};const s=Zver.st();
  G.place={kind:"city",bx:G.x,by:G.y,stype:"village",name:"Тестовое село",depth:0,x:1,y:1};G.gold=100000;
  r.способностиВсе=ZV_FAMILIES.every(f=>ZV_ABILITIES[f.id]&&ZV_ABIL_EFFECTS[ZV_ABILITIES[f.id].эф]);
  r.обликиВсе=ZV_VARIANTS.filter(v=>v.id!=="wild").every(v=>ZV_VAR_ABIL[v.id]&&ZV_ABIL_EFFECTS[ZV_VAR_ABIL[v.id].эф]);
  r.видовСпособн=new Set(Object.values(ZV_ABILITIES).map(x=>x.эф)).size;
  r.умения=Object.values(ZV_TALENTS.move).every(l=>l.length===2)&&["fang","hide","sense","bond"].every(b=>ZV_TALENTS[b].length===2);
  /* характеристики и здоровье */
  const пёс=Zver.make("spider_wild",{lvl:10,верн:90});const ск=Zver.make("centipede_wild",{lvl:10,верн:90});const сова=Zver.make("owl_wild",{lvl:5,верн:90});
  r.разумСовы=Zver.stat(сова,"разум");r.разумПаука=Zver.stat(пёс,"разум");r.hp=Zver.hpMax(пёс);
  /* умения открываются ветвями */
  пёс.lvl=30;r.доУмений=Zver.talents(пёс).length;for(let i=0;i<3;i++)Zver.grow(пёс.uid,"fang");r.умение3=Zver.has(пёс,"bite2");r.умение5=Zver.has(пёс,"deathgrip");
  for(let i=0;i<2;i++)Zver.grow(пёс.uid,"fang");r.умение5б=Zver.has(пёс,"deathgrip");
  for(let i=0;i<3;i++)Zver.grow(пёс.uid,"move");r.ползок=Zver.has(пёс,"lurk");
  /* бой: способности срабатывают */
  s.pets=[];s.mount=null;Zver.follow(пёс.uid);Zver.follow(ск.uid);Zver.role(пёс.uid,"hunter");Zver.role(ск.uid,"hunter");
  const m=Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:3,hp:2000,dmg:10});startCombat({x:G.x,y:G.y,monster:m});
  const rnd=Math.random;Math.random=()=>0.001;let log1,log2;
  try{log1=Zver.turn(G.combat,"atk");r.путы=G.combat.путы;r.яд=G.combat.zvPoison;log2=Zver.turn(G.combat,"atk");}finally{Math.random=rnd;}
  r.лог=log1;r.ядИдёт=/Яд жжёт/.test(log2);r.навыкОхоты=пёс.навыки&&пёс.навыки.hunter>0;
  /* раны: защитник принимает удар, раненый не дерётся, отвар лечит */
  Zver.role(ск.uid,"guard");G.combat.zvGuard=0.6;G.combat.zvGuardUid=ск.uid;const hp0=Zver.hp(ск);const рез=Zver.guard(100);r.взялЗверь=hp0-Zver.hp(ск);r.герою=рез;
  Zver.hurt(ск,9999);r.ранен=!!ск.ранен;r.ход=Zver.turn(G.combat,"atk");endCombat();
  s.pot.otvar=1;r.отвар=Zver.give(ск.uid,"otvar");r.послеОтвара=!ск.ранен&&Zver.hp(ск)>0;
  /* ресурсы, зелья */
  s.res={};Math.random=()=>0.01;try{r.добыча=Zver.onWin(Object.assign({},MONSTERS.find(q=>q.id==="wolf"),{lvl:3}));}finally{Math.random=rnd;}
  r.ресурсы=Object.assign({},s.res);
  s.res.клык=2;const d0=Zver.dmg(пёс);r.варка=Zver.brew("yarost");r.дать=Zver.give(пёс.uid,"yarost");r.яростьУрон=Zver.dmg(пёс)>d0;
  r.купитьЗелье=Zver.buyPotion("syt");r.зелий=Object.keys(ZV_POTIONS).length;
  /* экипировка: особое место по ходу, шьётся из ресурса */
  r.места=Zver.slots(сова).map(x=>x[0]);s.res.перо=3;r.сшить=Zver.craftGear("wings","feather");r.надеть=Zver.equip(сова.uid,"wings","feather");
  r.продажа=Zver.buyGear("wings","feather");
  /* артефакт */
  s.arts=["cald_fang"];const d1=Zver.dmg(пёс);r.арт=Zver.putArt(пёс.uid,"cald_fang");r.артУрон=Zver.dmg(пёс)>d1;r.выпал=Zver.artDrop("проверка");
  r.артефактов=ZV_ARTIFACTS.length;
  /* сутки: носильщик приносит ресурсы, раны заживают */
  Zver.role(пёс.uid,"scout");пёс.сыт=90;ск.сыт=90;const рес0=Object.values(s.res).reduce((x,y)=>x+y,0);Zver.hurt(пёс,30);const h0=Zver.hp(пёс);
  s.day=G.day;G.day+=1;Zver.tick();G.day-=1;s.day=G.day;r.принёс=Object.values(s.res).reduce((x,y)=>x+y,0)>рес0;r.зажило=Zver.hp(пёс)>h0;
  /* окна */
  Zver.beastView(пёс.uid);r.окноЗверя=document.getElementById("zvBody").textContent;
  Zver.workView();r.мастерская=document.getElementById("zvBody").textContent.length;
  Zver.craftView("feather");r.шитьё=document.getElementById("zvBody").querySelectorAll("button").length;
  while(activeLayer())closeTopUI();
  for(const a of [пёс,ск,сова])Zver.release(a.uid);
  return r;});
 check('11. у каждого рода своя способность, у каждого облика — своя; одиннадцать видов действия; умения в каждой ветви',
  своё.способностиВсе&&своё.обликиВсе&&своё.видовСпособн>=10&&своё.умения,своё);
 check('11б. свои характеристики: разум (у совы выше, чем у паука) и своё здоровье; умения открываются на третьей и пятой ступени',
  своё.разумСовы>своё.разумПаука&&своё.hp>30&&своё.доУмений===0&&своё.умение3&&!своё.умение5&&своё.умение5б&&своё.ползок,своё);
 check('11в. в бою срабатывают способности (паутина оглушает, яд идёт ходами), навык охоты растёт',
  своё.путы>=1&&своё.яд>=1&&своё.ядИдёт&&своё.навыкОхоты,своё.лог);
 check('11г. защитник принимает удар своим здоровьем; раненый не дерётся; звериный отвар лечит',
  своё.взялЗверь>0&&своё.герою<100&&своё.ранен&&/ранен/.test(своё.ход)&&своё.послеОтвара,своё);
 check('11д. звериные ресурсы с добычи; зелье варится из ресурсов и действует; зелья продаются в зверинце',
  Object.keys(своё.ресурсы).length>=1&&/Сварено/.test(своё.варка)&&своё.яростьУрон&&/Куплено/.test(своё.купитьЗелье)&&своё.зелий===7,своё);
 check('11е. особое место по ходу (накрылья у совы) шьётся из перьев и надевается; звериное не продаётся',
  своё.места.indexOf("wings")>=0&&/Сшито/.test(своё.сшить)&&/надето/.test(своё.надеть)&&/не продаётся/.test(своё.продажа),своё);
 check('11ж. двенадцать звериных артефактов: надетый усиливает зверя, новые выпадают',
  своё.артефактов===12&&своё.артУрон&&/Звериный артефакт/.test(своё.выпал),своё);
 check('11з. за сутки разведчик приносит ресурсы, раны заживают; окно зверя называет навыки, способности, умения и артефакт',
  своё.принёс&&своё.зажило&&/Навыки/.test(своё.окноЗверя)&&/Способности/.test(своё.окноЗверя)&&/Умения/.test(своё.окноЗверя)&&/Артефакт/.test(своё.окноЗверя)&&/разум/.test(своё.окноЗверя)&&своё.мастерская>100&&своё.шитьё>=14,своё);

 check('10. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
