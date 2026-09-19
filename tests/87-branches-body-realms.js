/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 87: ВЕТВИ СИЛЫ, ТЕЛО, ПОГЛОЩЕНИЕ И СЛОИ МИРА

   Сила была одним числом — уровнем героя. Теперь у неё двадцать пять ветвей
   с восемью ступенями, и растут они только от сделанного; тело помнит, что
   через него прошло, и меняет состояние с ценой и выгодой; останки
   побеждённой твари разбираются на черты по совместимости; мир разложен на
   десять слоёв, и у каждого свой порог (§113–116).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Двадцать пять ветвей, восемь ступеней; без дел все — новичок.
   2. Дела растят ветвь, смена ступени объявляется голосом и пишется в
      журнал; ремесло отдаёт ветви свои ступени, дальше ведут работы.
   3. Дела считаются из настоящих действий: удар, сотворённое заклинание,
      шаг, добыча, вход в место, доброе имя.
   4. Тело: нагрузка ведёт через адаптированное, перегруженное,
      нестабильное к мутировавшему, отдых даёт восстановленное; каждая
      смена объявляется один раз; у состояний есть цена и выгода.
   5. Останки: разбираются только раз и только свежие; совместимость от
      нуля до ста и её полоса; устойчивое усвоение даёт черту, черта даёт
      защиту; после разбора тело просит покоя.
   6. Слои мира: поверхность, глубина, карман, искусственный мир, лабиринт,
      разлом, небо, астрал; смена слоя объявляется, открытые слои и пороги
      неоткрытых — словами; астральный ход — работа иллюзий.
   7. Всё это лежит в записи сохранения.
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
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1–2. ветви и ступени ── */
 const ветви=await page.evaluate(()=>{
  G.deeds={};G.mast={};G.rep={};G.faith={};G.spells=["Искра"];G.str=10;G.day=1;
  const все=BRANCHES.map(b=>branchRank(b));
  SAID.length=0;G.journal=[];
  for(let i=0;i<3;i++)deed("kills");
  const после3={rank:branchRank("combat"),said:SAID.filter(t=>/Ветвь силы/.test(t)),journal:G.journal.filter(t=>/Ветвь/.test(t)).length};
  for(let i=0;i<17;i++)deed("kills");
  const после20={rank:branchRank("combat"),said:SAID.filter(t=>/Ветвь силы «боевое мастерство»/.test(t))};
  G.mast.smith={ур:3,оп:0,дел:5};const кузнец3=branchRank("smith");
  G.mast.smith={ур:5,оп:0,дел:80};const кузнецЛег=branchRank("smith");
  G.mast.smith={ур:5,оп:0,дел:300};const кузнецТранс=branchRank("smith");
  return {ветвей:BRANCHES.length,ступеней:BRANCH_RANKS.length,всеНовички:все.every(r=>r===0),после3,после20,кузнец3,кузнецЛег,кузнецТранс,
   имена:BRANCH_RANKS.join(", "),текст:branchesText()};});
 check('1. двадцать пять ветвей и восемь ступеней; без дел все — новичок',ветви.ветвей===25&&ветви.ступеней===8&&ветви.всеНовички&&/новичок, ученик, практик, мастер, эксперт, великий мастер, легендарный, трансцендентный/.test(ветви.имена),{в:ветви.ветвей,с:ветви.ступеней});
 check('2. три победы — ученик боевого мастерства, и это объявлено и записано',ветви.после3.rank===1&&ветви.после3.said.length===1&&ветви.после3.journal===1,ветви.после3);
 check('2б. двадцать побед — практик, объявлено ровно два раза',ветви.после20.rank===2&&ветви.после20.said.length===2,ветви.после20);
 check('2в. ремесло отдаёт ветви свои ступени, дальше ведут работы',ветви.кузнец3===3&&ветви.кузнецЛег===6&&ветви.кузнецТранс===7,{м:ветви.кузнец3,л:ветви.кузнецЛег,т:ветви.кузнецТранс});
 check('2г. «Ветви силы» словами называют ступени выше новичка',/боевое мастерство — практик/.test(ветви.текст)&&/кузнечное дело — трансцендентный/.test(ветви.текст),ветви.текст.slice(0,160));

 /* ── 3. дела считаются из настоящих действий ── */
 const дела=await page.evaluate(()=>{
  G.deeds={};G.inCombat=false;G.place=null;G.ship=null;G.dark=false;G.alt=0;
  const до=Object.assign({},G.deeds);
  G.mana=G.manaMax=50;const i=SPELLS.findIndex(sp=>sp.n==="Искра");castSpell(i);
  const casts=deeds("casts"),mana=deeds("manaSpent");
  G.x=WORLD>>1;G.y=WORLD>>1;let шаг=0;for(let k=0;k<12&&!шаг;k++){safeFn(()=>{if(G.inCombat)G.inCombat=false;});const bx=G.x;move(k%2?"N":"E");if(G.x!==bx||G.y!==(WORLD>>1))шаг=deeds("steps");}
  addRep("Люди",2);const rep=deeds("repGains");
  return {casts,mana,шаг,rep};});
 check('3. заклинание, шаг и доброе имя ложатся в счёт дел',дела.casts===1&&дела.mana===5&&дела.шаг>=1&&дела.rep===1,дела);

 /* ── 4. тело ── */
 const тело=await page.evaluate(()=>{
  G.adapt=null;G.assim=null;G.dark=false;G.cha=10;SAID.length=0;
  const путь=[];
  const с=()=>adaptState();
  путь.push(с());
  adaptAdd("чары",40);путь.push(с());                 /* 24 → адаптированное */
  const defA=adaptBonus("def");
  adaptAdd("обряд",4);путь.push(с());                 /* 48 → перегруженное */
  const costO=adaptBonus("spellCost");
  adaptAdd("обряд",5);путь.push(с());                 /* 78 → нестабильное */
  adaptAdd("мутаген",2);путь.push(с());               /* 102 → мутировавшее */
  const cha=G.cha,черт=adapt().traits;
  adaptRest(200);путь.push(с());                      /* нагрузка ноль, пик был — восстановленное */
  const объявлено=SAID.filter(t=>/Состояние тела/.test(t)).length;
  return {путь,defA,costO,cha,черт,объявлено,текст:adaptText()};});
 check('4. нагрузка ведёт тело через адаптированное, перегруженное, нестабильное к мутировавшему, отдых — к восстановленному',
  тело.путь.join(">")==="stable>adapted>overloaded>unstable>mutated>restored",тело.путь);
 check('4б. у состояний есть цена и выгода: адаптированное даёт защиту, перегруженное дорожит чары, мутация берёт обаяние и даёт черту',
  тело.defA===1&&тело.costO===0.1&&тело.cha===9&&тело.черт===1,{def:тело.defA,cost:тело.costO,cha:тело.cha,черт:тело.черт});
 check('4в. каждая смена состояния объявлена голосом ровно раз',тело.объявлено===5,тело.объявлено);

 /* ── 5. останки ── */
 const останки=await page.evaluate(()=>{
  G.adapt=null;G.assim=null;G.deeds={};G.inCombat=false;G.inv={};G.day=3;G.hour=10;G.race="Люди";
  const now=(Number(G.day)||1)*24+(Number(G.hour)||0);
  const wolf=MONSTERS.find(m=>m.id==="wolf");
  G.lastKill={id:wolf.id,n:wolf.n,lvl:3,fx:wolf.fx,когда:now};
  const доступно=assimAvailable(),в=amAvailable("assimilate");
  const c=assimCompat(G.lastKill),band=assimBand(c);
  SAID.length=0;
  const ok=assimilateRemains();
  const сказано=SAID.find(t=>/Останки/.test(t))||"";
  const второй=assimilateRemains();
  const после={разобран:!!G.lastKill.разобран,cooldown:assim().cooldown,деяний:deeds("assim"),доступно:assimAvailable()};
  /* Свежесть: останки старше трёх часов не разбираются. */
  G.lastKill={id:wolf.id,n:wolf.n,lvl:3,fx:wolf.fx,когда:now-5};
  const старые=assimilateRemains();
  /* Черта даёт защиту: тяжёлая кость — плюс два. */
  const def0=def();G.assim.traits={bone:1};const def1=def();G.assim.traits={bone:2};const def2=def();
  const полосы=[0,20,21,40,41,60,61,80,81,95,96,100].map(x=>assimBand(x));
  return {доступно,в,c,band,ok,сказано:сказано.slice(0,120),второй,после,старые,def:[def0,def1,def2],полосы};});
 check('5. останки сразу после боя доступны в меню, разбираются один раз и попадают в счёт',
  останки.доступно&&останки.в&&останки.ok&&останки.второй===false&&останки.после.разобран&&останки.после.деяний===1&&!останки.после.доступно,останки.после);
 check('5б. совместимость от нуля до ста, её полоса названа вслух',останки.c>=0&&останки.c<=100&&new RegExp(останки.band).test(останки.сказано)&&/Совместимость \d+ из ста/.test(останки.сказано),{c:останки.c,band:останки.band,сказано:останки.сказано});
 check('5в. шесть полос совместимости идут по спецификации',останки.полосы.join("|")==="несовместимо|несовместимо|слабый эффект|слабый эффект|частичное усвоение|частичное усвоение|устойчивое усвоение|устойчивое усвоение|высокая синергия|высокая синергия|идеальное совпадение|идеальное совпадение",останки.полосы);
 check('5г. остывшие останки не разбираются',останки.старые===false);
 check('5д. усвоенная черта «тяжёлая кость» даёт защиту, вдвое — вдвое',останки.def[1]===останки.def[0]+2&&останки.def[2]===останки.def[0]+4,останки.def);
 const усвоение=await page.evaluate(()=>{
  /* Устойчивое усвоение наверняка: подменяем совместимость. */
  const orig=assimCompat;window.assimCompat=()=>75;
  G.assim=null;G.deeds={};G.inv={};const now=(Number(G.day)||1)*24+(Number(G.hour)||0);
  const w=MONSTERS.find(m=>m.id==="wolf");G.lastKill={id:w.id,n:w.n,lvl:2,fx:w.fx,когда:now};
  assimilateRemains();
  const r={traits:Object.assign({},assim().traits),beast:assimBonus("beast"),cooldown:assim().cooldown-now};
  window.assimCompat=()=>98;G.lastKill={id:"spider",n:"Паук",lvl:2,fx:"hiss",когда:now};G.assim.cooldown=0;
  assimilateRemains();
  r.venom=assim().traits.venom;r.материал=Object.keys(G.inv).find(k=>/^след:/.test(k));r.energy=assim().energy;
  window.assimCompat=orig;return r;});
 check('5е. устойчивое усвоение даёт ночной нюх и час покоя; идеальное — черту вдвое, редкий материал и след энергии',
  усвоение.traits.nose===1&&усвоение.beast===1&&усвоение.cooldown===1&&усвоение.venom===2&&/^след: Паук/.test(усвоение.материал||"")&&усвоение.energy===1,усвоение);

 /* ── 6. слои мира ── */
 const слои=await page.evaluate(()=>{
  G.realms=null;G.place=null;G.ship=null;G.dark=false;G.alt=0;G.buffs={};
  const r={};
  realmCheck();r.surface=realmHere();
  SAID.length=0;
  G.place={kind:"dungeon",bx:1000,by:1000,stype:"ruins",name:"x",depth:5,x:1,y:1};realmCheck();r.deep=realmHere();
  G.place.depth=15;realmCheck();r.pocket=realmHere();
  G.place.depth=40;realmCheck();r.ancient=realmHere();
  G.place={kind:"house",bx:1000,by:1000,stype:"tower",name:"x",depth:2,x:1,y:1};realmCheck();r.labyrinth=realmHere();
  G.place=null;G.dark=true;realmCheck();r.rift=realmHere();G.dark=false;
  G.alt=2;realmCheck();r.sky=realmHere();G.alt=0;
  buffSet("астрал",2);realmCheck();r.astral=realmHere();G.buffs={};
  realmCheck();
  r.объявлено=SAID.filter(t=>/Слой мира/.test(t)).length;
  r.открыто=Object.keys(G.realms.seen).length;
  r.текст=realmsText();
  r.техника=!!TECH_BY_ID.astral&&TECH_BY_ID.astral.маст==="illus"&&TECH_BY_ID.astral.ур===2;
  r.всего=REALMS.length;
  return r;});
 check('6. десять слоёв, и место узнаётся: поверхность, глубина, карман, искусственный мир, лабиринт, разлом, небо, астрал',
  слои.всего===10&&слои.surface==="surface"&&слои.deep==="deep"&&слои.pocket==="pocket"&&слои.ancient==="ancient"&&слои.labyrinth==="labyrinth"&&слои.rift==="rift"&&слои.sky==="sky"&&слои.astral==="astral",слои);
 check('6б. смена слоя объявляется, открытые слои считаются, у неоткрытых назван порог',
  слои.объявлено>=8&&слои.открыто===8&&/Не открыты: Затерянные островные зоны — корабль/.test(слои.текст)&&/Временные аномальные области/.test(слои.текст)&&/Слоёв открыто 8 из 10/.test(слои.текст),{объявлено:слои.объявлено,открыто:слои.открыто,текст:слои.текст.slice(0,120)});
 check('6в. «Астральный ход» — работа второй ступени иллюзий',слои.техника);

 /* ── 7. запись ── */
 const запись=await page.evaluate(()=>{
  G.deeds={kills:5};G.adapt={load:30,state:"adapted",peak:30,traits:0,events:1};G.assim={traits:{bone:1},cooldown:0,materials:0,energy:0};
  saveGame(true);
  const raw=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.indexOf('"deeds"')>=0)||"";
  return {deeds:raw.indexOf('"kills":5')>=0,adapt:raw.indexOf('"adapted"')>=0,assim:raw.indexOf('"bone":1')>=0,realms:raw.indexOf('"realms"')>=0};});
 check('7. дела, тело, черты и слои лежат в записи сохранения',запись.deeds&&запись.adapt&&запись.assim&&запись.realms,запись);
 const меню=await page.evaluate(()=>{const names=[];AM_GROUPS.forEach(([,items])=>items.forEach(([c])=>names.push(c)));return ["assimilate","branches","bodystate","realms"].every(c=>names.includes(c));});
 check('в меню действий: разобрать останки, ветви силы, тело, слои мира',меню);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
