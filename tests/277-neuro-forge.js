/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 277: 12.5 — РАСТУЩИЙ НЕЙРОДВИЖОК, КУЗНИЦА НОВОГО, СПЛАВЫ ЗЕЛИЙ,
   ЛАВКА БЕЗ ПОДТВЕРЖДЕНИЙ, ПАНЕЛЬ МАГИИ В БОЮ

   Жалобы и просьбы игрока:
   • за новые рецепты и зелья всегда «опыт +8»;
   • два отличных зелья не дают нового рецепта;
   • у торговца слишком много окон: сделать как в обозе — «Купить 1, 5, 10»
     сразу, без подтверждения;
   • убрать фразу «из свободных фэнтезийных игр»;
   • закрыть панель магии в бою, когда кончилась мана;
   • нейросеть Режиссёра, которая учится, растёт и расширяет весь мир.

   1. Фразы о музыке из свободных игр нет ни в настройках, ни в новостях.
   2. Опыт за опыт со смесью зависит от трудности: сплав дороже двойного.
   3. Два разных зелья — эликсир, новый рецепт с обоими действиями; два
      отличных одинаковых — высший состав; рецепт в реестре.
   4. Лавка: у товара кнопки «Купить 1, 5, 10», сделка сразу.
   5. Панель магии в бою: 4×2 закрывает, без маны закрывается сама.
   6. Кузница: каждое действие мира рождает своё, всё настоящее.
   7. Нейросеть учится, растёт, совершенствует себя и переживает загрузку.
   8. Влияние: твари новых земель и выросшие роды крепче; изобретение
      игрока — предложение народа; мир живёт без игрока.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.invContext=()=>({станки:new Set(),вещи:new Set(["cauldron"]),алтарь:null,торговец:null,житель:null,ночь:false,бой:false});});

 /* ── 1 ── */
 const м=await p.evaluate(()=>{const html=document.documentElement.innerHTML;const news=NEWS.map(n=>n.т).join(" ");
  return {настройки:/глубин из свободных фэнтезийных игр/.test(html),новость:/тема из свободной фэнтезийной игры, написанная/.test(news)};});
 check('1. фразы о музыке «из свободных фэнтезийных игр» нет в настройках и новостях',!м.настройки&&!м.новость,м);

 /* ── 2, 3 ── */
 const сплав=await p.evaluate(()=>{G.mast={alchemy:{lvl:2}};G.mixBook={};G.potRecipes={};G.potMade={};G.level=4;G.xp=0;const r={};
  const mk=(x,y,qx,qy)=>{G.potions=[];potionGive(x,{q:qx});potionGive(y,{q:qy});const h=invAll().filter(z=>z.kind==="potion");const A=mixIngr(h[0]),B=mixIngr(h[1]);
   const o=mixOutcome(A,B,"cauldron");const x0=G.xp;const t=mixDo(A,B,"cauldron");return {род:o.род,как:o.как,xp:G.xp-x0,t,зелья:G.potions.map(z=>z.имя||z.id)};};
  r.эликсир=mk("strength","speed",1.4,1.4);r.высший=mk("heal","heal",1.4,1.4);r.двойное=mk("sense","sense",1.0,1.0);
  const br=G.potions[0];r.пить=brewDrink(G.potions.find(z=>z.id==="brew")||{},1);
  G.potions=[];potionGive("strength",{q:1.4});potionGive("speed",{q:1.4});const h=invAll().filter(z=>z.kind==="potion");
  const t2=mixDo(mixIngr(h[0]),mixIngr(h[1]),"cauldron");const brew=G.potions.find(z=>z.id==="brew");r.пьётся=brewDrink(brew,1.2);
  r.повтор=/Открыт новый рецепт/.test(t2);r.рецепты=Object.keys(G.potRecipes);r.реестр=Ledger.list("рецепты").map(e=>e.n).filter(x=>/эликсир|высший/.test(x)).length;return r;});
 check('2. опыт за смешивание по трудности: сплав и высший состав дороже двойного, не «+8»',
  сплав.эликсир.xp>8&&сплав.высший.xp>8&&сплав.двойное.xp<сплав.эликсир.xp&&сплав.эликсир.xp!==сплав.высший.xp,{э:сплав.эликсир.xp,в:сплав.высший.xp,д:сплав.двойное.xp});
 check('3. два разных зелья — эликсир (новый рецепт, оба действия); два отличных одинаковых — высший состав; повтор не «новый»; реестр',
  сплав.эликсир.как==="сплав"&&/Открыт новый рецепт/.test(сплав.эликсир.t)&&сплав.высший.как==="высший"&&сплав.двойное.как==="двойное"
  &&/шаг|удар/.test(сплав.пьётся)&&!сплав.повтор&&сплав.рецепты.length===2&&сплав.реестр>=2,сплав);

 /* ── 4 ── */
 const лавка=await p.evaluate(async()=>{const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};G.place=null;G.ship=null;
  let npc=null;outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){const c=safeFn(()=>cellContent((OLD_WORLD>>1)+dx,(OLD_WORLD>>1)+dy),null);if(c&&c.structure){const n=safeFn(()=>npcsFor(c),[]).find(x=>x.trade);if(n){G.x=(OLD_WORLD>>1)+dx;G.y=(OLD_WORLD>>1)+dy;npc=n;break outer;}}}
  if(!npc)return r;G.gold=2000;G.inv={"руда":6};openTrade(npc.key,"buy");await пауза(50);
  const btn=[...document.querySelectorAll('#shopBody [data-cmd^="shopnow:buy:"]')];r.кнопок=btn.length;r.подписи=btn.slice(0,3).map(b=>b.textContent.trim());
  const b5=btn.find(b=>/:5$/.test(b.dataset.cmd));if(b5){const idx=Number(b5.dataset.cmd.split(":")[2]);const row=shopStockRows(npc)[idx];const g0=G.gold;
   CMD.shopnow(b5.dataset.cmd.slice(8));await пауза(30);r.списано=g0-G.gold;r.цена=row.price*5;r.окно=!!document.querySelector('#shopBody [data-cmd="shopyes"]');}
  r.заголовки=[...document.querySelectorAll('#shopBody h3')].map(h=>h.textContent).length;
  CMD.shoptab("sell");await пауза(30);r.продать=[...document.querySelectorAll('#shopBody [data-cmd^="shopnow:sell:"]')].map(b=>b.textContent.trim()).slice(0,4);
  while(activeLayer())closeTopUI();return r;});
 check('4. лавка как обоз: у товара «Купить 1, 5, 10», сделка сразу без окна «Купить?»; у своей вещи «Продать … всё»; товары по категориям',
  лавка.кнопок>=2&&лавка.списано===лавка.цена&&лавка.окно===false&&лавка.заголовки>=3&&лавка.продать.some(t=>/Продать всё/.test(t)),лавка);

 /* ── 5 ── */
 const магия=await p.evaluate(async()=>{const r={};while(activeLayer())closeTopUI();G.hp=500;G.hpMax=900;G.place=null;G.ship=null;settings.combatPace="live";
  startCombat({x:G.x,y:G.y,monster:{id:"orc",n:"Орк",lvl:3,hp:500,dmg:9,xp:5,gold:5}});const a=G.combat.arena;a.readyAt=Date.now()+600000;
  safeOpenMagicPanel();r.открыта=magicPanelOpen();qsTapResolve(4,2);r.закрыта4x2=!magicPanelOpen();
  safeOpenMagicPanel();G.mana=0;const i=SPELLS.findIndex(s=>s&&G.spells.includes(s.n));castSpell(i>=0?i:0);await new Promise(z=>setTimeout(z,1100));r.самаБезМаны=!magicPanelOpen();
  r.слоты=QS_MAGIC_SHAPES.join();if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;return r;});
 check('5. панель магии в бою: двойное касание четырьмя пальцами закрывает; без маны закрывается сама',магия.открыта&&магия.закрыта4x2&&магия.самаБезМаны,магия);

 /* ── 6 ── */
 const кузница=await p.evaluate(()=>{const r={};G.gen={};G.dir=null;G.gold=100000;G.level=10;G.x=300;G.y=300;G.place=null;
  ["people","land","clan"].forEach(a=>Neuro.forge(a));r.пусто=[];for(const a of NEURO_ARMS){const t=safeFn(()=>Neuro.forge(a),"");if(!t)r.пусто.push(a);}
  const g=G.gen;G.place={kind:"town"};
  const gp=g.potions.find(x=>!x.родители);r.зелье=!!gp&&!!POTION_BY_ID[gp.id]&&typeof POTION_BY_ID[gp.id].дать==="function"&&PLANT_CAT_BY_ID[gp.из[0]]&&PLANT_CAT_BY_ID[gp.из[1]]?true:false;
  r.купитьЗ=Neuro.buy("p",gp.id,5);r.ресурсНиши=!!MIX_NATURE[g.res[0].n];r.цена=Math.round(marketPrice(g.res[0].n,0,G.day));
  r.купитьА=Neuro.buy("a",g.arts[0].id,1);r.знаетА=artKnowsRecipe(g.arts[0].id);r.вМастерской=!!ART_RECIPE_BY_ID[g.arts[0].id];
  r.купитьС=Neuro.buy("s",g.spells[0].id,1);r.чары=SPELLS.some(s=>s.n===g.spells[0].n)&&G.spells.includes(g.spells[0].n);
  r.оружие=Neuro.buy("w",g.weapons[0].id,1);r.вСнаряжении=G.gear.some(x=>x&&x.name===g.weapons[0].name&&x.slot==="weapon");
  r.зверь=Neuro.buy("z",g.pets[0].id,1);r.устройство=Neuro.buy("d",g.devices[0].id,1);r.применить=Neuro.useDevice(0);
  r.книга=Neuro.read(g.books[0].id);r.дар=Neuro.offer(g.gods[0].id);
  r.слои=g.lands.filter(l=>l.слой).map(l=>l.слой);r.чертоги=g.lands.filter(l=>l.inst!=null).every(l=>!!Chertog.st().dyn[l.inst]);
  r.мест=(g.places||[]).length;r.народов=g.peoples.length;r.мастеров=g.masters.length;r.политика=(g.rel||[]).length;
  openModal("modal-director");Director.home();r.кнопка=!!document.querySelector('#dirBody [data-cmd="dir:nx:view"]');Director.cmd("nx:view");
  r.окно=document.getElementById("dirBody").textContent;r.кнопокВОкне=document.querySelectorAll('#dirBody button').length;while(activeLayer())closeTopUI();
  r.окноЕсть=["Самосовершенствование","Новые зелья","Новые земли","Народы, расы, кланы и фракции","Новое оружие","Новые боги","Мастера Грани"].filter(x=>!r.окно.includes(x));r.окно=r.окно.length;
  return r;});
 check('6. Кузница: все действия мира рождают новое, и оно настоящее — зелье варится и покупается, ресурс в опытах и на рынке, рецепт в мастерской, чары в списке, оружие в снаряжении, зверь, устройство, книга, бог, ярусы-чертоги; окно с разделами',
  !кузница.пусто.length&&кузница.зелье&&/Куплено/.test(кузница.купитьЗ)&&кузница.ресурсНиши&&кузница.цена>0&&кузница.знаетА&&кузница.вМастерской&&кузница.чары
  &&кузница.вСнаряжении&&/Теперь ваш/.test(кузница.зверь)&&/Куплено/.test(кузница.устройство)&&/Зарядов осталось/.test(кузница.применить)&&/«/.test(кузница.книга)&&/принимает дар/.test(кузница.дар)
  &&кузница.слои.length>=2&&кузница.чертоги&&кузница.кнопка&&!кузница.окноЕсть.length&&кузница.кнопокВОкне>10,кузница);

 /* ── 7 ── */
 const сеть=await p.evaluate(()=>{const r={};const n=Neuro.st();r.H0=n.H;r.выходов=n.arms.length;
  const x=Neuro.feats();r.признаков=x.length;const y0=Neuro.score("potion",x);for(let i=0;i<200;i++)Neuro.sgd(x,"potion",1,0.1);r.учится=Neuro.score("potion",x)>y0+0.05;
  const до=Neuro.forward(x).y.slice();Neuro.grow("проверка");const после=Neuro.forward(x).y;r.ростБезЗабывания=до.every((v,i)=>Math.abs(v-после[i])<1e-6)&&Neuro.st().H===r.H0+4;
  for(let d=0;d<20;d++){Director.st().played=d<10?10:70;G.day=(Number(G.day)||1)+1;Director.worldDay();}
  r.примеров=n.mem.length;r.мета=JSON.parse(JSON.stringify(Neuro.st().meta));r.вариант=new Set(Neuro.st().recent).size;
  saveGame(true);const raw=store.get(SAVE_KEY);const H=Neuro.st().H;const ids=G.gen.potions.map(x=>x.id);
  ids.forEach(id=>{const i=POTIONS.findIndex(q=>q.id===id);if(i>=0)POTIONS.splice(i,1);delete POTION_BY_ID[id];});
  applySave(raw,"набор 277");r.послеЗагрузки=ids.every(id=>!!POTION_BY_ID[id])&&Neuro.st().H===H;return r;});
 check('7. нейросеть: 32 признака, учится, растёт без забывания, помнит опыт, сама подбирает скорость и смелость, переживает загрузку',
  сеть.признаков===32&&сеть.учится&&сеть.ростБезЗабывания&&сеть.примеров>=15&&сеть.мета.r.length>=14&&сеть.вариант>=2&&сеть.послеЗагрузки,сеть);

 /* ── 8 ── */
 const влияние=await p.evaluate(()=>{const r={};const g=G.gen;const l=g.lands.find(x=>!x.слой);G.place=null;G.x=l.x;G.y=l.y;Neuro.step();
  const m={id:"wolf",n:"Волк",hp:100,dmg:10,lvl:3};Director.onCombat(m,{});r.земля=[m.n,m.hp];
  g.evo.beast={сила:4,ум:0,хитрость:2};G.x=-99999;G.y=-99999;const m2={id:"wolf",n:"Волк",hp:100,dmg:10,lvl:3};Neuro.evoApply(m2);r.род=[m2.hp,m2.dmg,m2.lvl];
  g.offers=[];const t=Neuro.invent("spell","Мой огонь",null);r.предложение=t;const o=g.offers.find(x=>!x.done);const g0=G.gold;r.сделка=o?Neuro.acceptOffer(o.id):"";r.золото=G.gold-g0;
  g.lastReal=Date.now()-7.2e6*4;r.безВас=Neuro.offline();r.сводка=g.offlineLast;
  const pk=Director.pick();r.выбор=DIR2_ARMS.includes(pk);r.напор=Neuro.instK();return r;});
 check('8. влияние на мир: твари новых земель и выросшего рода крепче; изобретение — предложение народа и золото; мир прожил дни без игрока; события второго Режиссёра и напор чертогов — от сети',
  /земель|—/.test(влияние.земля[0])&&влияние.земля[1]>100&&влияние.род[0]>100&&влияние.род[2]>3&&/предлагают/.test(влияние.предложение)&&влияние.золото>0
  &&/Пока вас не было/.test(влияние.безВас)&&влияние.сводка&&влияние.сводка.дней===4&&влияние.выбор&&влияние.напор>=0.85&&влияние.напор<=1.15,влияние);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
