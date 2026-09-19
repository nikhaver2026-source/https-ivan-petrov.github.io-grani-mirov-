/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 91: РАСТЕНИЯ, ГРИБЫ И ЗЕЛЬЯ ПО НИШЕ

   Трава была травой: одна строка в котомке на весь мир. Теперь у растений
   восемнадцать ниш, и у каждого вида свой биом, пора, погода, час, соседи,
   почва, редкость, способ сбора, опасность и рецепты (§122). Растение
   берётся вместе с обычной травой, если земля, час и погода сошлись, и
   называется вслух. Из растений варят зелья восемнадцати родов с
   качеством, устойчивостью, сроком и риском побочного действия.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Восемнадцать ниш, у каждой есть вид; у видов все поля, биомы и рецепты
      настоящие; растения — товар с ценой и значком.
   2. Условия держат: ночное не растёт в полдень, зимнее не летом, цветок
      ясного неба не в дождь, лист холода не в лесу, искровник — только
      рядом с кристаллом; выбор вида на клетке постоянен.
   3. Сбор вместе с травой: растение названо, лежит в котомке, отмечено в
      травнике и слышно; повтор той же клетки не даёт второго.
   4. Опасное растение без защиты вредит; травник, алхимик второй ступени и
      зелье стойкости берут без вреда.
   5. Восемнадцать зелий из двух ниш; без ступени не варят, редкое — только
      с третьей; отказ называет недостающую нишу; варка тратит растения, даёт
      запись с качеством, устойчивостью и сроком; качество растёт со
      ступенью; изъян снижает устойчивость.
   6. Действие: лечебное лечит, скорости даёт лёгкость, силы — удар +3,
      сопротивлений — защита +2, восприятия — картина шире, твёрдой руки —
      срыв реже, дыхания — такты, мутационное меняет стат; нестабильное
      бьёт побочно; выдохшееся — вполсилы.
   7. Работа «Сварить зелье» у чана открывает окно; окно перечисляет сумку
      и рецепты; всё переживает сохранение.
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
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};
  window.найтиБиом=(id)=>{for(let i=0;i<60000;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const b=biomeAt(x,y);if(b&&b.id===id)return {x,y};}return null;};});

 /* ── 1. реестр ── */
 const реестр=await page.evaluate(()=>{
  const bio=new Set(BIOMES.map(b=>b.id));
  const плохие=PLANTS.filter(p=>!p.n||!p.о||!PLANT_CAT_BY_ID[p.кат]||!(p.редкость>=1&&p.редкость<=5)||!p.способ||!p.рецепты||!p.рецепты.length
   ||p.рецепты.some(id=>!POTION_BY_ID[id])||(p.био&&p.био.some(id=>id!=="dark"&&id!=="alt"&&!bio.has(id)))).map(p=>p.id);
  const безВида=PLANT_CATS.filter(c=>!PLANTS.some(p=>p.кат===c.id)).map(c=>c.id);
  const безЦены=PLANTS.filter(p=>!(RES_BASE[p.n]>0)||!RESICON[p.n]).map(p=>p.n);
  return {ниш:PLANT_CATS.length,видов:PLANTS.length,плохие,безВида,безЦены,опасных:PLANTS.filter(p=>p.опасность).length};});
 check('1. восемнадцать ниш, у каждой вид; поля, биомы и рецепты настоящие; растения — товар с ценой',
  реестр.ниш===18&&реестр.видов>=20&&!реестр.плохие.length&&!реестр.безВида.length&&!реестр.безЦены.length&&реестр.опасных>=5,реестр);

 /* ── 2. условия ── */
 const усл=await page.evaluate(()=>{
  const r={};G.place=null;G.dark=false;G.alt=0;G.weather="Ясно";
  const лес=найтиБиом("broadleaf"),холод=найтиБиом("glacier")||найтиБиом("snow_ridge"),луг=найтиБиом("meadow")||найтиБиом("plain");
  if(!лес||!холод||!луг)return {нет:[!!лес,!!холод,!!луг]};
  const has=(x,y,id)=>plantCandidates(x,y,{surf:null}).some(p=>p.id===id);
  /* ночное в полдень и ночью */
  G.day=30;G.hour=12;r.дурманДень=has(лес.x,лес.y,"durman");G.hour=23;r.дурманНочь=has(лес.x,лес.y,"durman");
  /* лунный цветок: лето, ночь, ясно */
  G.hour=23;G.day=30;G.weather="Ясно";r.лунныйЛето=has(лес.x,лес.y,"lunny");
  G.day=80;r.лунныйЗима=has(лес.x,лес.y,"lunny");G.day=30;G.weather="Дождь";r.лунныйДождь=has(лес.x,лес.y,"lunny");
  r.пораЛето=seasonAt(30).id;r.пораДругая=seasonAt(80).id;
  /* заряница: заря и ясно на лугу */
  G.weather="Ясно";G.hour=6;r.заряницаЗаря=has(луг.x,луг.y,"zaryanitsa");G.hour=13;r.заряницаДень=has(луг.x,луг.y,"zaryanitsa");
  /* инеевый лист: холод, не лес */
  G.hour=12;r.инейХолод=has(холод.x,холод.y,"ineevy");r.инейЛес=has(лес.x,лес.y,"ineevy");
  /* соседи: искровник только рядом с кристаллом */
  let аном=null;for(let i=0;i<60000&&!аном;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const b=biomeAt(x,y);if(b&&(b.id==="highland"||b.id==="canyon")){
   const рядом=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const c=cellContent(x+dx,y+dy);if(c.res)рядом.push(c.res.name);}
   if(рядом.includes("кристалл"))аном={x,y,рядом};}}
  r.искровникСосед=аном?has(аном.x,аном.y,"iskrovnik"):null;
  let без=null;for(let i=0;i<60000&&!без;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const b=biomeAt(x,y);if(b&&(b.id==="highland"||b.id==="canyon")){
   let есть=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const c=cellContent(x+dx,y+dy);if(c.res&&c.res.name==="кристалл")есть=true;}
   if(!есть)без={x,y};}}
  r.искровникБез=без?has(без.x,без.y,"iskrovnik"):null;
  /* постоянство */
  G.hour=12;G.weather="Ясно";const a=plantAt(лес.x,лес.y),b=plantAt(лес.x,лес.y);r.постоянно=!!a&&a.id===b.id;
  return r;});
 check('2а. ночное не растёт в полдень, но растёт ночью; лунный цветок — лишь летом, ночью и в ясную погоду',
  !усл.нет&&усл.дурманДень===false&&усл.дурманНочь===true&&усл.лунныйЛето===true&&усл.лунныйЗима===false&&усл.лунныйДождь===false,усл);
 check('2б. заряница — на заре, не днём; инеевый лист — на льду, не в лесу; искровник — только рядом с кристаллом; вид на клетке постоянен',
  усл.заряницаЗаря===true&&усл.заряницаДень===false&&усл.инейХолод===true&&усл.инейЛес===false&&усл.искровникСосед===true&&усл.искровникБез===false&&усл.постоянно,усл);

 /* ── 3. сбор ── */
 const сбор=await page.evaluate(()=>{
  G.hour=12;G.weather="Ясно";G.day=30;G.place=null;G.ship=null;G.inCombat=false;G.inv={};G.plantsSeen={};G.depleted={};
  let клетка=null;
  for(let i=0;i<80000&&!клетка;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const c=cellContent(x,y);
   if(c.res&&/трав/.test(c.res.name)&&!c.structure&&!c.monster){G.x=x;G.y=y;const p=plantAt(x,y);
    if(p&&!p.опасность&&hashName(x*3+1,y*5+2,9300+G.day)<0.9/p.редкость)клетка={x,y,вид:p.id};}}
  if(!клетка)return {нет:"клетки"};
  SAID.length=0;PLAYED.length=0;
  const ok=gatherCurrent("tap");
  const сказ=SAID.find(t=>/Собрано/.test(t))||"";
  const p=PLANT_BY_ID[клетка.вид];
  const второй=gatherCurrent("tap");
  return {ok,сказ,вКотомке:G.inv[p.n],травы:G.inv["трава"],отмечено:G.plantsSeen[p.id],звук:PLAYED.some(r=>/ad_leaves|lug_bush|od_dig|mtg_crumble|oc_swim/.test(r)),второй,после:G.inv[p.n],имя:p.n};});
 check('3. растение названо при сборе травы, лежит в котомке, отмечено в травнике и слышно; повтор клетки второго не даёт',
  !сбор.нет&&сбор.ok&&new RegExp("Рядом "+сбор.имя).test(сбор.сказ)&&/Способ:/.test(сбор.сказ)&&сбор.вКотомке===1&&сбор.травы>=1&&сбор.отмечено===1&&сбор.звук&&сбор.после===1,
  сбор.нет||[сбор.сказ.slice(0,160),сбор.вКотомке,сбор.после]);

 /* ── 4. опасность ── */
 const опасн=await page.evaluate(()=>{
  const p=PLANT_BY_ID.durman;G.hpMax=100;G.skills=[];G.mast={alchemy:{ур:0,оп:0}};G.buffs={};
  G.hp=50;const t1=plantTake(p,5,5);const hp1=G.hp;
  G.hp=50;G.skills=["herbal"];const t2=plantTake(p,5,5);const hp2=G.hp;
  G.skills=[];G.mast.alchemy={ур:2,оп:0};G.hp=50;plantTake(p,5,5);const hp3=G.hp;
  G.mast.alchemy={ур:0,оп:0};buffSet("стойкость",3);G.hp=50;plantTake(p,5,5);const hp4=G.hp;G.buffs={};
  return {t1,hp1,hp2,hp3,hp4};});
 check('4. ядовитое без защиты жжёт пальцы; травник, алхимик второй ступени и зелье стойкости берут без вреда',
  /обжёг/.test(опасн.t1)&&опасн.hp1<50&&опасн.hp2===50&&опасн.hp3===50&&опасн.hp4===50,опасн);

 /* ── 5. варка ── */
 const варка=await page.evaluate(()=>{
  const r={};r.зелий=POTIONS.length;
  r.плохие=POTIONS.filter(p=>!p.n||!p.о||p.из.length!==2||p.из.some(c=>!PLANT_CAT_BY_ID[c])||!(p.срок>0)||!(p.стаб>0&&p.стаб<1)||typeof p.дать!=="function").map(p=>p.id);
  r.ниши=new Set(POTIONS.flatMap(p=>p.из)).size;
  G.potions=[];G.inv={};G.mast={alchemy:{ур:0,оп:0}};
  SAID.length=0;r.безСтупени=brewPotion("heal");r.безСтупениСказ=SAID.slice(-1)[0];
  G.mast.alchemy={ур:1,оп:0};G.inv["рановник"]=1;
  SAID.length=0;r.безТравы=brewPotion("heal");r.безТравыСказ=SAID.slice(-1)[0];
  G.inv["топяной хвощ"]=1;const rnd=Math.random;Math.random=()=>0.999;
  SAID.length=0;PLAYED.length=0;r.ok=brewPotion("heal");r.сказ=SAID.find(t=>/Сварено/.test(t))||"";
  r.запись=G.potions[0];r.осталось=[G.inv["рановник"],G.inv["топяной хвощ"]];r.звук=PLAYED.includes("oc_boiling");r.оп=G.mast.alchemy.оп;
  /* качество растёт со ступенью */
  G.mast.alchemy={ур:4,оп:0};G.inv["рановник"]=1;G.inv["топяной хвощ"]=1;brewPotion("heal");r.q1=G.potions[0].q;r.q4=G.potions[1].q;
  /* изъян при жребии ниже риска */
  Math.random=()=>0.0;G.inv["рановник"]=1;G.inv["топяной хвощ"]=1;brewPotion("heal");r.изъян=G.potions[2].изъян;r.стабИзъян=G.potions[2].стаб;r.стабЧист=G.potions[1].стаб;
  /* редкое: третья ступень */
  G.mast.alchemy={ур:2,оп:0};G.inv["разломница"]=1;G.inv["лунный цветок"]=1;SAID.length=0;r.редкое2=brewPotion("mutation");r.редкоеСказ=SAID.slice(-1)[0];
  G.mast.alchemy={ур:3,оп:0};r.редкое3=brewPotion("mutation");
  Math.random=rnd;
  return r;});
 check('5а. восемнадцать зелий из двух ниш, все поля на месте; без ступени не варят; отказ называет недостающую нишу',
  варка.зелий===18&&!варка.плохие.length&&варка.ниши>=12&&варка.безСтупени===false&&/урок/.test(варка.безСтупениСказ)&&варка.безТравы===false&&/болотные/.test(варка.безТравыСказ),
  [варка.плохие,варка.ниши,варка.безТравыСказ]);
 check('5б. варка тратит по растению каждой ниши, даёт запись с качеством, устойчивостью и сроком, звучит и растит ремесло',
  варка.ok&&/Качество/.test(варка.сказ)&&/устойчивость \d+ из ста/.test(варка.сказ)&&варка.запись&&варка.запись.id==="heal"&&варка.запись.q>0&&варка.запись.стаб>0&&варка.запись.срок===12&&варка.осталось[0]===undefined&&варка.осталось[1]===undefined&&варка.звук&&варка.оп>0,
  [варка.сказ.slice(0,120),варка.запись,варка.осталось]);
 check('5в. качество растёт со ступенью; изъян снижает устойчивость; редкое — только с третьей ступени',
  варка.q4>варка.q1&&варка.изъян===true&&варка.стабИзъян<варка.стабЧист&&варка.редкое2===false&&/третья/.test(варка.редкоеСказ)&&варка.редкое3===true,
  [варка.q1,варка.q4,варка.стабИзъян,варка.стабЧист,варка.редкоеСказ]);

 /* ── 6. действие ── */
 const действие=await page.evaluate(()=>{
  const r={};const rnd=Math.random;Math.random=()=>0.1;
  const сделать=id=>{G.potions=[{id,q:1,стаб:0.9,день:G.day,срок:10}];return 0;};
  G.hpMax=100;G.buffs={};G.mast={alchemy:{ур:1,оп:0}};G.equip=G.equip||{};
  G.hp=20;drinkPotion(сделать("heal"));r.heal=G.hp;r.healSaid=SAID.slice(-1)[0];
  drinkPotion(сделать("speed"));r.speed=buffActive("лёгкость");
  const a0=atk();drinkPotion(сделать("strength"));r.strength=atk()-a0;
  const d0=def();drinkPotion(сделать("resist"));r.resist=def()-d0;
  const s0=scapeRad();drinkPotion(сделать("sense"));r.sense=scapeRad()-s0;
  const t=TECH_BY_ID.melt;G.mast.smith={ур:1,оп:0};const r0=techRisk(t);drinkPotion(сделать("craft"));r.craft=+(r0-techRisk(t)).toFixed(2);
  const b0=breathTacts();drinkPotion(сделать("breath"));r.breath=breathTacts()-b0;
  drinkPotion(сделать("nightsight"));r.night=buffActive("ночное зрение");
  drinkPotion(сделать("coldguard"));r.warm=buffActive("тепло");
  drinkPotion(сделать("voice"));r.voice=buffActive("чужой голос");
  const str0=G.str;drinkPotion(сделать("mutation"));r.mutation=(G.str+G.agi+G.mind)-(str0+G.agi+G.mind)>=0&&/навсегда/.test(SAID.slice(-1)[0]);r.mutSaid=SAID.slice(-1)[0];
  /* нестабильное */
  Math.random=()=>0.99;G.hp=20;PLAYED.length=0;drinkPotion(сделать("heal"));r.unstable=G.hp;r.unstableSaid=SAID.slice(-1)[0];r.goo=PLAYED.includes("stk_goo");
  /* выдохшееся */
  Math.random=()=>0.1;G.hp=20;G.potions=[{id:"heal",q:1,стаб:0.9,день:1,срок:2}];G.day=30;drinkPotion(0);r.expired=G.hp;r.expiredSaid=SAID.slice(-1)[0];
  Math.random=rnd;G.buffs={};
  return r;});
 check('6а. лечебное лечит; скорости — лёгкость; силы — удар +3; сопротивлений — защита +2; восприятия — картина на два шире; твёрдая рука — срыв реже; дыхания — два такта',
  действие.heal===50&&действие.speed&&действие.strength===3&&действие.resist===2&&действие.sense===2&&действие.craft>0.1&&действие.breath===2&&действие.night&&действие.warm&&действие.voice,действие);
 check('6б. мутационное меняет стат навсегда; нестабильное действует вполсилы и бьёт побочно; выдохшееся — вполсилы',
  действие.mutation&&действие.unstable<50&&/нестабилен/.test(действие.unstableSaid)&&действие.goo&&действие.expired<50&&/выдохлось/.test(действие.expiredSaid),
  [действие.mutSaid,действие.unstable,действие.expired]);

 /* ── 7. окно, работа, сохранение ── */
 const окно=await page.evaluate(()=>{
  const r={};const t=TECH_BY_ID.potion;r.тех=t&&{ур:t.ур,маст:t.маст,станки:t.станки};
  G.mast={alchemy:{ур:1,оп:0}};G.potions=[{id:"heal",q:1.2,стаб:0.8,день:G.day,срок:10}];G.inv["рановник"]=1;G.inv["топяной хвощ"]=1;
  r.работа=techDo(t,"cauldron");r.видно=!document.getElementById("modal-potions").hidden;
  r.вСумке=document.querySelectorAll('#potBody [data-cmd^="drinkpotion:"]').length;r.рецептов=document.querySelectorAll('#potBody [data-cmd^="brewpotion:"]').length;
  r.можно=[...document.querySelectorAll('#potBody [data-cmd^="brewpotion:"]')].filter(b=>/✅/.test(b.textContent)).map(b=>b.dataset.cmd);
  closeModal(document.getElementById("modal-potions"));
  r.меню=amAvailable("potions");G.mast.alchemy={ур:0,оп:0};G.potions=[];r.менюБез=amAvailable("potions");
  G.potions=[{id:"speed",q:1,стаб:0.7,день:G.day,срок:8}];G.plantsSeen={durman:2};saveGame(true);
  const raw=localStorage.getItem(SAVE_KEY)||"";r.сохр=/"potions"/.test(raw)&&/"plantsSeen"/.test(raw)&&/durman/.test(raw);
  r.текст=potionsText();r.травник=plantsText();
  return r;});
 check('7. «Сварить зелье» — алхимия первой ступени у чана или очага, открывает окно с сумкой и рецептами; пункт меню — знающему или имеющему; сумка и травник в сохранении',
  окно.тех&&окно.тех.ур===1&&окно.тех.маст==="alchemy"&&окно.тех.станки.includes("cauldron")&&окно.работа&&окно.видно&&окно.вСумке===1&&окно.рецептов===18&&окно.можно.includes("brewpotion:heal")&&окно.меню&&окно.менюБез===false&&окно.сохр&&/Зелий 18 родов/.test(окно.текст)&&/чёрный дурманник/.test(окно.травник),
  [окно.тех,окно.вСумке,окно.рецептов,окно.можно,окно.меню,окно.менюБез,окно.сохр]);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
