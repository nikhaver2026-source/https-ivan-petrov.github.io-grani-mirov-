/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 108: ГРАФИЧЕСКАЯ МАГИЯ, ПРОБУЖДЕНИЕ, ВОЛНЫ, РАВНОВЕСИЕ,
   ЭХО ПОЖИРАНИЯ, МОРФОЗВЕРИ, БИОЛОГИЧЕСКИЙ ОТПЕЧАТОК

   1. Данные: восемь символов по настоящим школам, восемь носителей по
      настоящим ресурсам, пять геометрий, шесть чернил со звуком и рецептом,
      шесть источников пробуждения, три волны, шесть черт морфозверей,
      десять морфозверей от настоящих тварей, шесть даров Эха; самопроверка.
   2. Чернила: варят у чана или очага по рецепту, заряд по ёмкости, запись
      в реестр рецептов.
   3. Знак: символ + носитель + геометрия + намерение + чернила; несходное
      объясняется словами; начертание тратит ресурс, заряд и энергию, сбой
      портит носитель; знак — вещь в суме с карточкой и применением по
      намерению; носитель может выдержать или стереться.
   4. Пробуждение: только через Ядро и со ступени Практика; источник, дар,
      цена, ограничение и риск; срыв роняет контроль; отдых возвращает;
      пробуждённые жители упираются в разговоре крепче.
   5. Волны: затишье, Магия, Технология — чары, оружие и цены меняются;
      смена волны звучит и пишется; день переключает по сроку.
   6. Равновесие: обряды и знаки к порядку, хаос и некромантия — от него;
      порядок делает работу надёжнее, зелья устойчивее, сеть дешевле.
   7. Эхо Пожирания: даётся за Поглотителя, берёт только редких, шесть
      даров и цена — перегрузка, мутация, потеря памяти, загрязнение.
   8. Морфозвери: зверь носит черты того, кого ел; броня, искра, эхо-кожа,
      яд и бегство; отпечаток рассказывает о звере по ступеням.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};r.sym=SIGIL_SYMBOLS.length;r.symOk=SIGIL_SYMBOLS.every(x=>MSCHOOL_BY_ID[x.школа]&&x.намерения.length&&x.намерения.every(i=>SIGIL_INTENTS[i]));
  r.car=SIGIL_CARRIERS.length;r.carOk=SIGIL_CARRIERS.every(x=>RES_BASE[x.ресурс]&&x.о&&x.прочность>=1);
  r.geo=SIGIL_GEOMETRY.length;r.geoOk=SIGIL_GEOMETRY.every(x=>SIGIL_INTENTS[x.намерение]);
  r.inks=INKS.length;r.inksOk=INKS.every(x=>SOUND_BANK[x.звук]&&Object.keys(x.рецепт).length&&Object.keys(x.рецепт).every(k=>RES_BASE[k])&&x.устойчивость>0&&x.сбой>0);
  r.awake=AWAKEN_SOURCES.length;r.awakeOk=AWAKEN_SOURCES.every(x=>SOUND_BANK[x.звук]&&x.триггер&&x.ограничение&&x.специализация&&x.риск>0&&Object.keys(x.цена).length);
  r.waves=WAVES.length;r.morph=MORPH_TRAITS.length;r.beasts=MORPHOBEASTS.length;r.beastsOk=MORPHOBEASTS.every(b=>MONSTERS.some(m=>m.id===b.база)&&b.о);
  r.gifts=DEVOUR_GIFTS.length;r.giftsOk=DEVOUR_GIFTS.every(g=>g.n&&typeof g.дать==="function");
  r.theme=!!(EVENT_THEME.world_event&&SOUND_BANK[EVENT_THEME.world_event.роль]);
  r.modules=["SIGILS","AWAKEN","WAVES","BALANCE","DEVOUR","MORPHO","IMPRINT"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="sigils");r.selfcheck=row?row.ok:null;
  return r;});
 check('восемь символов по настоящим школам и намерениям, восемь носителей по настоящим ресурсам, пять геометрий, шесть чернил со звуком и рецептом из настоящих ресурсов',
  данные.sym===8&&данные.symOk&&данные.car===8&&данные.carOk&&данные.geo===5&&данные.geoOk&&данные.inks===6&&данные.inksOk,данные);
 check('шесть источников пробуждения со звуком, триггером, ценой, ограничением и риском; три волны; шесть черт и десять морфозверей от настоящих тварей; шесть даров Эха; своя музыка смены волны; самопроверка мира видит знаки',
  данные.awake===6&&данные.awakeOk&&данные.waves===3&&данные.morph===6&&данные.beasts===10&&данные.beastsOk&&данные.gifts===6&&данные.giftsOk&&данные.theme&&данные.modules&&данные.selfcheck===true,данные);

 /* ── 2. чернила ── */
 const чернила=await page.evaluate(()=>{
  const r={};G.inks=null;G.inv={};G.place=null;
  r.noStation=Sigils.brew("plain");
  let оч=null;
  outer: for(const st of ["tavern","house","village"])for(let b=0;b<6&&!оч;b++){
   G.place={kind:"house",bx:600+b*37,by:600+b*53,stype:st,name:"Проба",depth:0,x:1,y:1};
   const l=curLevel();
   for(let y=0;y<l.h&&!оч;y++)for(let x=0;x<l.w&&!оч;x++){G.place.x=x;G.place.y=y;const ctx=safeFn(()=>invContext(),null);if(ctx&&ctx.станки&&(ctx.станки.has("hearth")||ctx.станки.has("cauldron")))оч={x,y};}
   if(оч){G.place.x=оч.x;G.place.y=оч.y;break outer;}}
  r.очаг=!!оч;if(!оч){G.place=null;return r;}
  r.noRes=Sigils.brew("plain");G.inv["ягоды"]=3;PLAYED.length=0;r.brew=Sigils.brew("plain");r.заряд=Number((G.inks||{}).plain)||0;r.ягоды=Number(G.inv["ягоды"])||0;r.звук=PLAYED.includes("oc_boiling");r.реестр=Ledger.has("рецепты",/простые чернила/);
  r.unknown=Sigils.brew("нет таких");
  G.place=null;return r;});
 check('чернила варят только у чана или очага, по рецепту из сумки; сваренные дают заряд по ёмкости, звучат и ложатся в реестр рецептов',
  /чана алхимика или очага/.test(чернила.noStation)&&чернила.очаг&&/не хватает/.test(чернила.noRes||"")&&/сварены/.test(чернила.brew||"")&&чернила.заряд===2&&чернила.ягоды===1&&чернила.звук&&чернила.реестр&&/Таких чернил нет/.test(чернила.unknown||""),чернила);

 /* ── 3. знак ── */
 const знак=await page.evaluate(()=>{
  const r={};G.inks={plain:4,aether:2};G.inv={"дерево":2,"руда":2,"кристалл":2,"трава":2};G.items=[];G.sigils=null;G.place=null;G.buffs={};
  Energy.ensure();G.mana=G.manaMax=30;G.aether=10;G.will=10;G.licenses={};G.wanted={};G.order=0;
  r.empty=Sigils.preview();
  Sigils.set("sym","flame");Sigils.set("carrier","paper");Sigils.set("geo","circle");Sigils.set("ink","plain");
  r.mismatch=Sigils.preview();          /* знак пламени не служит защите */
  Sigils.set("sym","shield");r.ok=Sigils.preview();
  Sigils.set("carrier","glass");G.inv["кристалл"]=0;r.noRes=Sigils.check().почему;G.inv["кристалл"]=2;
  Sigils.set("ink","aether");G.inks.aether=0;r.noInk=Sigils.check().почему;G.inks.aether=2;
  Sigils.set("carrier","metal");Sigils.set("ink","plain");
  const rnd=Math.random;Math.random=()=>0.99;PLAYED.length=0;const мана=G.mana;r.make=Sigils.make();r.вещь=(G.items||[]).find(x=>/^Знак: /.test(x))||"";r.руда=Number(G.inv["руда"])||0;r.заряд=Number(G.inks.plain)||0;r.манаПотрачена=мана-G.mana;r.звук=PLAYED.includes("arte_page");r.летопись=JT.some(t=>/Начертан Знак/.test(t));
  const row=invAll().find(x=>x.kind==="item"&&x.name===r.вещь);r.карточка=row?invBrief(row.kind,row.key):"";r.действия=row?invActionsAll(row).ok.map(a=>a.id):[];
  G.buffs={};r.use=Sigils.use(r.вещь);r.оберег=buffActive("оберег");
  /* сбой */
  Math.random=()=>0;const hp=G.hp;r.fail=Sigils.make();r.hpFail=hp-G.hp;Math.random=rnd;
  /* урон в бою */
  G.inv["руда"]=3;G.inks.plain=4;Sigils.set("sym","flame");Sigils.set("geo","triangle");Math.random=()=>0.99;const имя2=(()=>{Sigils.make();return (G.items||[]).filter(x=>/^Знак: /.test(x)).pop();})();Math.random=rnd;
  r.noFight=Sigils.use(имя2);
  G.inCombat=true;G.combat={m:{n:"проба",hp:100},hp:100};r.fight=Sigils.use(имя2);r.урон=100-G.combat.hp;G.inCombat=false;G.combat=null;
  return r;});
 check('знак не сложится без выбора и при несовместимости символа с намерением; нет ресурса носителя и заряда чернил — сказано словами; начертание берёт ресурс, заряд и ману, звучит, пишется и кладёт вещь в суму с карточкой и действием «Использовать»',
  /Знак не сложится/.test(знак.empty)&&/не служит намерению/.test(знак.mismatch)&&/Сложится/.test(знак.ok)&&/нужен ресурс/.test(знак.noRes||"")&&/нет заряда чернил/.test(знак.noInk||"")&&/Начертано/.test(знак.make)&&/^Знак: знак щита/.test(знак.вещь)&&знак.руда===1&&знак.заряд===3&&знак.манаПотрачена===3&&знак.звук&&знак.летопись&&/намерение «защита»/.test(знак.карточка)&&знак.действия.includes("use"),знак);
 check('применение знака даёт эффект намерения: защита — оберег, урон — только в бою и по твари; сбой портит носитель и жжёт руку',
  /оберег на/.test(знак.use||"")&&знак.оберег&&/Сбой/.test(знак.fail||"")&&знак.hpFail===2&&/только в бою/.test(знак.noFight||"")&&/получает \d+ урона от знака/.test(знак.fight||"")&&знак.урон>=9,знак);

 /* ── 4. пробуждение ── */
 const пробуждение=await page.evaluate(()=>{
  const r={};G.awake=null;G.core=null;G.deeds={};G.pathRank=0;r.noCore=Awaken.can();
  Core.grant("crystal");r.noRank=Awaken.can();
  G.deeds={hits:35,kills:9,casts:4,manaSpent:72,steps:30,quests:2};r.can=Awaken.can();
  PLAYED.length=0;JT.length=0;r.accept=Awaken.accept("aether");r.летопись=JT.some(t=>/Пробуждение: эфир/.test(t));r.звук=PLAYED.includes("magic_hum");r.again=Awaken.accept("ash");
  Energy.ensure();G.will=10;G.mana=0;G.manaMax=40;G.day=5;
  const rnd=Math.random;Math.random=()=>0.99;r.use=Awaken.use();r.мана=G.mana;r.контроль=G.awake.контроль;r.twice=Awaken.use();
  G.awake.день2=0;Math.random=()=>0;const hp=G.hp;r.fail=Awaken.use();r.hpDrop=hp-G.hp;r.контроль2=G.awake.контроль;r.срывов=G.awake.срывов;Math.random=rnd;
  Awaken.daily();r.после=G.awake.контроль;
  r.text=Awaken.text();
  /* пробуждённый житель */
  let n=null;for(let i=0;i<400&&!n;i++){const c=getNPC(1000+i*37,2000+i*53,0,"Фермер");if(Awaken.of(c))n=c;}
  r.житель=!!n;if(n){r.line=Awaken.npcLine(n);r.resist=Awaken.resist(n);}
  return r;});
 check('пробуждение только через Ядро и со ступени Практика; принятое звучит, пишется и даёт дар с ценой, ограничением и раз в день; второй источник не берут',
  /Ядро Отклика/.test(пробуждение.noCore||"")&&/Практика/.test(пробуждение.noRank||"")&&пробуждение.can===null&&/Пробуждение принято/.test(пробуждение.accept)&&пробуждение.летопись&&пробуждение.звук&&/уже пробуждены/.test(пробуждение.again)&&/мана из воздуха/.test(пробуждение.use||"")&&пробуждение.мана===12&&пробуждение.контроль===67&&/раз в день/.test(пробуждение.twice||""),пробуждение);
 check('срыв дара роняет контроль, бьёт по телу и считается; отдых возвращает контроль; пробуждённые жители встречаются, названы строкой и упираются в разговоре крепче',
  /Потеря контроля/.test(пробуждение.fail||"")&&пробуждение.hpDrop===4&&пробуждение.контроль2<пробуждение.контроль&&пробуждение.срывов===1&&пробуждение.после>пробуждение.контроль2&&/Пробуждение: источник эфир/.test(пробуждение.text)&&пробуждение.житель&&/пробуждённый: источник/.test(пробуждение.line||"")&&пробуждение.resist===8,пробуждение);

 /* ── 5. волны и равновесие ── */
 const мир=await page.evaluate(()=>{
  const r={};G.wave=null;G.order=0;r.cur=Waves.cur().id;r.spell0=Waves.spellK();r.weap0=Waves.weaponK();r.price0=Waves.priceK("кристалл");
  PLAYED.length=0;JT.length=0;r.set=Waves.set("magic",7);r.magic={spell:Waves.spellK(),weap:Waves.weaponK(),crystal:Waves.priceK("кристалл"),ore:Waves.priceK("руда")};r.звук=PLAYED.includes("magic_hum")||PLAYED.includes("horn_dark");r.летопись=JT.some(t=>/Мир: волна Магии/.test(t));
  Waves.set("tech",7);r.tech={spell:Waves.spellK(),weap:Waves.weaponK(),ore:Waves.priceK("руда"),crystal:Waves.priceK("кристалл")};
  G.day=100;r.daily=Waves.daily();r.после=Waves.cur().id;
  /* цена ресурса слушает волну */
  Waves.set("tech",7);const ц1=marketPrice("руда",0,10);Waves.set("magic",7);const ц2=marketPrice("руда",0,10);r.цены=[ц1,ц2];
  /* равновесие */
  G.order=0;r.bal0=Balance.get();Balance.shift(30,"проба");r.порядок=Balance.word();r.risk=Balance.riskK();r.stab=Balance.stabK();r.rest=Balance.restK();
  G.order=-60;r.хаос=Balance.word();r.portal=Balance.portalK();r.spellK=Balance.spellK();
  G.order=0;Balance.onCast({n:"проба",school:"necro"});r.necro=Balance.get();Balance.onCast({n:"проба2",school:"light"});r.light=Balance.get();
  G.order=10;Balance.daily();r.day=Balance.get();
  r.text=Balance.text();
  return r;});
 check('волны: затишье по умолчанию; Магия удешевляет чары и поднимает кристалл, Технология — наоборот; смена звучит и пишется; срок переключает волну; цена ресурса слушает волну',
  мир.cur==="calm"&&мир.spell0===1&&мир.weap0===1&&мир.price0===1&&/Волна/.test(мир.set)&&мир.magic.spell===0.8&&мир.magic.crystal===1.4&&мир.tech.spell===1.3&&мир.tech.weap===1.15&&мир.tech.ore===1.4&&мир.звук&&мир.летопись&&мир.daily===true&&мир.цены[0]>мир.цены[1],мир);
 check('равновесие: порядок делает работу надёжнее, зелья устойчивее и отдых глубже; хаос — сеть дороже и чары дешевле; некромантия тянет к хаосу, свет — к порядку; день возвращает к нулю',
  мир.bal0===0&&/порядк/.test(мир.порядок)&&мир.risk<1&&мир.stab>0&&мир.rest>1&&/хаос/.test(мир.хаос)&&мир.portal>1&&мир.spellK<1&&мир.necro===-2&&мир.light===-1&&мир.day===9&&/Равновесие мира/.test(мир.text),мир);

 /* ── 6. Эхо Пожирания ── */
 const эхо=await page.evaluate(()=>{
  const r={};G.devour=null;G.lastKill=null;G.ledger=null;Ledger.ensure();G.items=[];G.level=5;G.day=10;G.hour=0;
  r.noEcho=Devour.can();r.text0=Devour.text();
  r.grant=Devour.grant();r.has=Devour.has();r.again=Devour.grant();
  r.noKill=Devour.can();
  G.lastKill={id:"wolf",n:"Волк",lvl:2,fx:"growl",когда:10*24};r.notRare=Devour.can();
  G.lastKill={id:"troll",n:"Тролль",lvl:9,fx:"stomp",когда:10*24};r.rare=Devour.rare(G.lastKill);r.can=Devour.can();
  PLAYED.length=0;r.echo=Devour.echo();r.пожран=!!G.lastKill.пожран;r.звук=PLAYED.includes("oc_organic_hit");r.снова=Devour.can();
  r.перегруз=Devour.state().перегруз;r.следов=Devour.state().следов;
  Devour.state().перегруз=3;G.lastKill={id:"ogre",n:"Огр",lvl:9,fx:"stomp",когда:10*24};r.over=Devour.can();Devour.rest();r.после=Devour.can();
  G.hour=10;G.lastKill.когда=10*24;r.cold=(()=>{G.hour=20;return Devour.can();})();
  return r;});
 check('Эхо Пожирания даётся за Поглотителя и только раз; поглощают лишь редких и свежих; поглощение звучит, даёт дар с ценой и считает перегрузку; перегруженное тело отказывает, отдых снимает; остывшие останки не берут',
  /не носят|Эха Пожирания у вас нет/.test(эхо.noEcho)&&/редкая опасная способность/.test(эхо.text0)&&эхо.grant===true&&эхо.has&&эхо.again===false&&/Поглощать нечего/.test(эхо.noKill)&&/не редкое существо/.test(эхо.notRare)&&эхо.rare===true&&эхо.can===null&&/Эхо Пожирания над «Тролль»/.test(эхо.echo)&&эхо.пожран&&эхо.звук&&эхо.следов===1&&/Перегрузка/.test(эхо.over||"")&&эхо.после===null&&/остыли/.test(эхо.cold||""),эхо);

 /* ── 7. морфозвери и отпечаток ── */
 const звери=await page.evaluate(()=>{
  const r={};G.inCombat=false;G.combat=null;G.place=null;G.x=12000;G.y=12000;G.weather="Ясно";G.lastDamageKind=null;
  const m={id:"wolf",n:"Волк",snd:"mgrowl",fx:"growl",lvl:3,hp:30,dmg:4,xp:20,gold:5,biomes:["forest"]};
  const b=Morpho.apply(Object.assign({},m),{x:G.x,y:G.y},true);r.морф=!!b.морф;r.имя=b.n;r.hp=b.hp;r.xp=b.xp;r.черты=b.черты;r.морфText=Morpho.text(b);
  const mineral=Object.assign({},m,{морф:"peplogriv",черты:["mineral"]});r.armor=[Morpho.armor(mineral,10),Morpho.armor(m,10)];
  const magic=Object.assign({},m,{морф:"x",черты:["weakmagic"]});r.extra=[Morpho.extra(magic),Morpho.extra(m)];
  const echo=Object.assign({},m,{морф:"x",черты:["echohide"]});G.hp=G.hpMax=100;r.reflect=Morpho.reflect(echo,10);r.hpAfter=G.hp;
  const warp=Object.assign({},m,{морф:"x",черты:["warp"]});r.flee=[Morpho.fleeK(warp),Morpho.fleeK(m)];
  const venom=Object.assign({},m,{морф:"x",черты:["venom"]});G.poisoned=null;Morpho.onStrike(venom);r.venom=!!G.poisoned;
  /* бой ставит морфозверя */
  G.poisoned=null;startCombat({x:G.x,y:G.y,monster:Object.assign({},m)},{morph:true});r.вБою=!!(G.combat&&G.combat.m&&G.combat.m.морф);r.боевоеИмя=G.combat?G.combat.m.n:"";
  G.combat.hp=0;victory();r.killМорф=!!(G.lastKill&&G.lastKill.морф);
  /* отпечаток */
  G.imprints={};G.sci={};G.mast={};G.deeds={};G.lastKill={id:"wolf",n:"Волк",lvl:3,fx:"growl",gold:5,когда:(Number(G.day)||1)*24+(Number(G.hour)||0)};
  r.lvl1=Imprint.level();r.study1=Imprint.study();r.реестр=Ledger.has("твари",/Волк: среда обитания/);r.again=Imprint.can();
  G.sci={bioeng:3};G.mast={alchemy:{ур:2,оп:0,дел:0}};G.deeds={gathers:200};G.skills=(G.skills||[]).concat(["tracker"]);
  r.lvl2=Imprint.level();G.lastKill={id:"troll",n:"Тролль",lvl:5,fx:"stomp",gold:9,когда:(Number(G.day)||1)*24+(Number(G.hour)||0)};r.study2=Imprint.study();
  r.text=Imprint.text();
  return r;});
 check('морфозверь носит черты того, кого ел: имя, здоровье и опыт выше, черта названа; минеральная броня гасит удар, слабая магия добавляет искру, эхо-кожа возвращает часть урона, искажение мешает бежать, ядовитые железы травят; бой ставит морфозверя, и останки его помнят',
  звери.морф&&/\(Волк\)$/.test(звери.имя)&&звери.hp>30&&звери.xp>20&&звери.черты.length===1&&/Черты: /.test(звери.морфText)&&звери.armor[0]===7&&звери.armor[1]===10&&звери.extra[0]===4&&звери.extra[1]===0&&звери.reflect===2&&звери.hpAfter===98&&звери.flee[0]===-0.3&&звери.flee[1]===0&&звери.venom&&звери.вБою&&звери.killМорф,звери);
 check('биологический отпечаток: глубина по знанию, поля от среды до происхождения, запись в реестр тварей, одни останки — один раз; с биоинженерией, алхимией, Гранью и следопытом глубина растёт до пяти',
  звери.lvl1===1&&/Биологический отпечаток «Волк», глубина 1 из пяти/.test(звери.study1)&&/среда обитания/.test(звери.study1)&&звери.реестр&&/уже изучены/.test(звери.again||"")&&звери.lvl2===5&&/глубина 5 из пяти/.test(звери.study2)&&/происхождение/.test(звери.study2)&&/Отпечатков изучено/.test(звери.text),звери);

 /* ── 8. окно и меню ── */
 const окно=await page.evaluate(async()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.sigils();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["sgMake","sgInks","sgAwake","sgWorld","sgDevour","sgImprints"].filter(id=>!(document.getElementById(id)||{}).innerHTML);
  r.символы=document.querySelectorAll('#sgMake [data-cmd^="sigact:sym~"]').length;r.чернила=document.querySelectorAll('#sgInks [data-cmd^="inkbrew:"]').length;r.сказано=SAID.find(t=>/^Знаки, чернила, пробуждение\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  const am=JSON.stringify(AM_GROUPS);r.меню=["sigils","imprint","devour"].filter(k=>!am.includes('"'+k+'"'));
  return r;});
 check('окно «Знаки, чернила, пробуждение» с шестью разделами, восемью символами и шестью чернилами, говорит состояние; строки в меню действий',
  окно.окно==="modal-sigils"&&окно.секции.length===0&&окно.символы===8&&окно.чернила===6&&окно.сказано.length>0&&окно.меню.length===0,окно);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
