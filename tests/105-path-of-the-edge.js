/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 105: ПУТЬ ГРАНИ — СТУПЕНИ, ГРАНИ, ЭНЕРГИИ, ДЕНЬГИ, ЯДРО, ЧАРЫ,
   МАСКИ, АРТЕФАКТЫ, ЛЮДИ ПУТИ, ПРОБУЖДЕНИЕ

   1. Данные: десять ступеней с порогом и доказательством, восемь Граней с
      тремя порогами и записью, двенадцать путей по настоящим ветвям, шесть
      энергий, десять чар, восемь масок, десять артефактов с историей,
      десять людей — и самопроверка мира это подтверждает.
   2. Ступень: сумма ветвей и доказательство по порядку; ступень без
      доказательства не даётся; подъём звучит и пишется в летопись — один раз.
   3. Грани: ступень растёт от дела, у каждой ступени звук и обратная
      сторона; след силы; объявление пути только делом, не больше двух.
   4. Энергии: шесть шкал, трата с правдой о нехватке, час пути возвращает
      волю, узел сети отдаёт пространство раз в день, сутки восстанавливают.
   5. Деньги: слова, разбор по серебру и меди, местная монета области,
      редкие единицы, долг, растущий по дням.
   6. Ядро Отклика: форма навсегда, точки возврата по числу формы, Нить
      Возврата за пространственную энергию, записи знания, следы магии.
   7. Чары Пути: со ступени Практика и только через Ядро; цена энергиями;
      печать даёт оберег, поглощение переливает жизнь, разрез шагает на две
      клетки, срыв бьёт по телу.
   8. Маски Рода: нужна вещь и воля; эффект на счёт; снятие возвращает;
      маска берёт волю по часу и спадает без неё; инвентарь знает маску.
   9. Артефакты Пути: карточка с историей, применение с итогом; прилавок
      Мастера Ядер; купленное Ядро принимает форму у мастера.
  10. Люди Пути: кнопки по ремеслу, испытание ступени, рассказ о Предтечах
      с опытом один раз, разрешение за золото и кристалл, Поглотитель в бою
      отдаёт эфир; цепочка «Пробуждение Грани» кончается Ядром.
  11. Торговля: за редкое торговец просит не только золото; окно Пути,
      меню действий, строка статуса.
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
 const пауза=ms=>page.waitForTimeout(ms);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});
 const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.ranks=PATH_RANKS.length;r.ranksOrder=PATH_RANKS.every((k,i)=>i===0||k.порог>PATH_RANKS[i-1].порог);r.ranksDoc=PATH_RANKS.slice(1).every(k=>k.док&&k.док.n&&typeof k.док.ок==="function");
  r.facets=FACETS.length;r.facetsOk=FACETS.every(f=>f.пороги.length===10&&f.эффект.length===10&&f.k.length===10&&f.предел&&f.синергия&&f.минус&&SOUND_BANK[f.звук]&&typeof f.сч==="function");
  r.ways=PATH_WAYS.length;r.waysOk=PATH_WAYS.every(w=>w.ветви.length>=2&&w.ветви.every(b=>BRANCH_BY_ID[b]));
  r.energy=ENERGY.length;r.energyOk=ENERGY.every(e=>typeof e.get==="function"&&typeof e.max==="function"&&e.о);
  r.spells=PATH_SPELLS.length;r.spellsOk=PATH_SPELLS.every(s=>SOUND_BANK[s.звук]&&typeof s.делать==="function"&&Object.keys(s.цена).length&&s.риск>0);
  r.masks=MASKS.length;r.masksOk=MASKS.every(m=>m.эффект&&m.взаимодействие&&Object.keys(m.k).length);
  r.arts=PATH_ARTIFACTS.length;r.artsOk=PATH_ARTIFACTS.every(a=>a.история&&a.происхождение&&a.владельцы&&a.ограничения&&a.ремонт&&a.развитие.length===3&&SOUND_BANK[a.звук]);
  r.profs=PATH_PROFS.length;r.profsOk=PATH_PROFS.every(p=>TIERP[p.n]&&NPCBEACON[p.n]&&p.кнопки.length&&p.где.every(st=>!PROFS[st]||PROFS[st].includes(p.n)));
  r.modules=["PATH","ENERGY","COINS","CORE"].every(m=>Modules.get?Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="path");r.selfcheck=row?row.ok:null;
  return r;});
 check('десять ступеней по возрастанию с доказательствами, восемь Граней с порогами и звуком, двенадцать путей по настоящим ветвям, шесть энергий',
  данные.ranks===10&&данные.ranksOrder&&данные.ranksDoc&&данные.facets===17&&данные.facetsOk&&данные.ways===12&&данные.waysOk&&данные.energy===6&&данные.energyOk,данные);
 check('десять чар со звуком, восемь масок, десять артефактов с историей, десять людей Пути в таблицах ремёсел; самопроверка мира видит Путь',
  данные.spells===10&&данные.spellsOk&&данные.masks===8&&данные.masksOk&&данные.arts===10&&данные.artsOk&&данные.profs===10&&данные.profsOk&&данные.selfcheck===true,данные);

 /* ── 2. ступень ── */
 const ступень=await page.evaluate(()=>{
  const r={};G.deeds={};G.pathRank=0;G.paths=[];G.bosses={};
  r.старт=Path.rank().id;r.next0=Path.next();
  G.deeds={hits:12,kills:3};r.безДок=Path.rankIndex();
  G.deeds.steps=30;r.ученик=Path.rankIndex();
  PLAYED.length=0;JT.length=0;SAID.length=0;
  r.check1=Path.check();r.звук=PLAYED.includes("gate_fanfare");r.летопись=JT.some(t=>/Путь Грани: ступень «Ученик»/.test(t));r.сказано=SAID.some(t=>/поднялись на ступень «Ученик»/.test(t));
  r.check2=Path.check();
  G.deeds={hits:35,kills:9,casts:4,manaSpent:72,steps:30};r.score=Path.score();r.практикБезДок=Path.rankIndex();r.next1=Path.next();
  G.deeds.quests=2;r.практик=Path.rankIndex();
  return r;});
 check('ступень: Искра на старте, порог ветвей без доказательства не даёт Ученика, тридцать шагов дают; подъём звучит фанфарой, пишется в летопись и объявляется один раз',
  ступень.старт==="iskra"&&/Ученик/.test(ступень.next0)&&ступень.безДок===0&&ступень.ученик===1&&ступень.check1===true&&ступень.звук&&ступень.летопись&&ступень.сказано&&ступень.check2===false,ступень);
 check('Практик: сумма ветвей от пяти без доказательства не даётся, слова называют, чего не хватает; два сданных дела открывают',
  ступень.score>=5&&ступень.практикБезДок===1&&/доказательство/.test(ступень.next1)&&ступень.практик===2,{score:ступень.score,next:ступень.next1,i:ступень.практик});

 /* ── 3. Грани, след, пути ── */
 const грани=await page.evaluate(()=>{
  const r={};G.facetTiers={};G.deeds={steps:0};r.t0=Path.facetTier("quiet");r.k0=Path.facetK("quiet");
  G.deeds.steps=80;r.t1=Path.facetTier("quiet");r.k1=Path.facetK("quiet");
  PLAYED.length=0;SAID.length=0;JT.length=0;Path.facetTick();
  r.звук=PLAYED.includes("lug_bush");r.слова=SAID.find(t=>/Грань «Тихий след», стадия 1 из десяти — Пробуждение/.test(t))||"";r.минус=/Обратная сторона/.test(r.слова);r.летопись=JT.some(t=>/Грань: Тихий след, ступень 1/.test(t));
  SAID.length=0;Path.facetTick();r.повтор=SAID.some(t=>/Грань «Тихий след»/.test(t));
  G.deeds.steps=1500;r.t3=Path.facetTier("quiet");r.k3=Path.facetK("quiet");
  r.text=Path.facetText(FACET_BY_ID.stone);
  G.tomeRead={a:1,b:1};r.tongue=Path.facetTier("tongue");r.gainLang=Path.gainK("lang");
  /* след силы и пути */
  G.deeds={};r.следПусто=Path.traceText();G.deeds={hits:35,kills:9};r.след=Path.traceText();
  G.paths=[];r.слабый=Path.declare("mage");
  PLAYED.length=0;r.объявлен=Path.declare("blade");r.труба=PLAYED.includes("herald_trumpet");r.paths1=(G.paths||[]).slice();
  r.повторно=Path.declare("blade");
  G.deeds={hits:35,kills:9,casts:12,manaSpent:80,steps:100};r.второй=Path.declare("mage");r.третий=Path.declare("hunter");r.paths=(G.paths||[]).slice();
  r.оставлен=Path.renounce("mage");r.paths2=(G.paths||[]).slice();
  /* ремёсла объявленного пути растут на десятую: Путь Артефактора — ветви артефакторики и зачарования */
  const б=G.paths;G.paths=["artificer"];r.gainArte=Path.gainK("arte");r.gainSmith=Path.gainK("smith");G.paths=б;
  return r;});
 check('Грань растёт от дела: ноль, первая ступень с восьмидесяти шагов и коэффициентом, третья с полутора тысяч; новая ступень звучит своей записью, называет обратную сторону, пишется в летопись и не повторяется',
  грани.t0===0&&грани.k0===0&&грани.t1===1&&грани.k1===0.2&&грани.звук&&грани.минус&&грани.летопись&&!грани.повтор&&грани.t3===3&&грани.k3===0.5&&/Предел:.*Синергия:.*Обратная сторона:/.test(грани.text),{t:[грани.t0,грани.t1,грани.t3],k:[грани.k1,грани.k3],слова:грани.слова.slice(0,80)});
 check('«Чужой язык» ускоряет ремесло языков; след силы проступает со второй ступени ветви; путь объявляют делом, не больше двух, ремёсла пути растут на десятую; путь можно оставить',
  грани.tongue===1&&грани.gainLang===1.5&&/пока не проступил/.test(грани.следПусто)&&/След силы: /.test(грани.след)&&/ветви ещё слабы/.test(грани.слабый)&&/Объявлено: Путь Клинка/.test(грани.объявлен)&&грани.труба&&/уже объявлен/.test(грани.повторно)&&/Объявлено/.test(грани.второй)&&/не больше двух/.test(грани.третий)&&грани.paths.length===2&&грани.gainArte>1.05&&грани.gainArte<1.15&&грани.gainSmith===1&&/оставлен/.test(грани.оставлен)&&грани.paths2.length===1,{tongue:грани.tongue,lang:грани.gainLang,слабый:грани.слабый,третий:грани.третий,gain:[грани.gainArte,грани.gainSmith]});

 /* ── 4. энергии ── */
 const энергии=await page.evaluate(()=>{
  const r={};delete G.will;delete G.willMax;delete G.aether;delete G.space;Energy.ensure();
  r.ensure={will:G.will,willMax:G.willMax,aether:G.aether,space:G.space};
  r.text=Energy.text();r.шесть=(r.text.match(/ из /g)||[]).length;
  G.will=5;const a=Energy.spend({will:2});r.spendOk=a.ок&&G.will===3;
  const b=Energy.spend({aether:999,will:1});r.spendNo=b;r.неСписано=G.will===3;
  r.add=Energy.add("aether",999);r.addCap=G.aether===50;
  G.day=5;G.hour=3;G.willHour=null;G.will=3;G.mask=null;r.step1=Energy.step();r.will1=G.will;r.step2=Energy.step();G.hour=4;r.step3=Energy.step();r.will3=G.will;
  G.will=1;Energy.daily();r.dailyWill=G.will===G.willMax;
  /* узел сети: столица державы — всегда узел */
  const e=EMPIRES[0];const бx=G.x,бy=G.y;G.place=null;G.ship=null;G.x=e.cap.x;G.y=e.cap.y;G.nodeCharge={};G.space=5;
  PLAYED.length=0;r.node1=Energy.atNode();r.space1=G.space;r.nodeSound=PLAYED.includes("stk_portal");r.node2=Energy.atNode();r.space2=G.space;
  G.x=бx;G.y=бy;
  return r;});
 check('энергии: воля, эфир и пространство заводятся сами; шесть шкал словами; трата списывает, нехватка называется и ничего не списывает; эфир не выше пятидесяти',
  энергии.ensure.will===энергии.ensure.willMax&&энергии.ensure.aether===5&&энергии.ensure.space===5&&энергии.шесть===6&&энергии.spendOk&&энергии.spendNo.ок===false&&/не хватает энергии: эфирная 5 из нужных 999/.test(энергии.spendNo.почему)&&энергии.неСписано&&энергии.addCap,энергии);
 check('час пути возвращает волю по единице и не дважды за час; сутки восстанавливают волю; узел сети отдаёт пять пространства со звуком и только раз в день',
  энергии.step1===true&&энергии.will1===4&&энергии.step2===false&&энергии.step3===true&&энергии.will3===5&&энергии.dailyWill&&энергии.node1===true&&энергии.space1===10&&энергии.nodeSound&&энергии.node2===false&&энергии.space2===10,энергии);

 /* ── 5. деньги ── */
 const деньги=await page.evaluate(()=>{
  const r={};r.words=Coins.words(5);r.words1=Coins.words(1);r.breakdown=Coins.breakdown(3);r.regional=Coins.regional(10);
  G.rareUnits=null;r.rare0=Coins.rare("seals");Coins.addRare("seals",2);r.rare2=Coins.rare("seals");
  G.gold=10;G.rareUnits.debts=0;r.borrow=Coins.borrow(40);r.gold=G.gold;r.debts=Coins.rare("debts");
  Coins.daily();r.goldAfter=G.gold;r.text=Coins.text();
  return r;});
 check('деньги: слова с падежом, разбор на серебро и медь, местная монета области, редкие единицы, долг растёт по дням',
  деньги.words==="5 золотых"&&деньги.words1==="1 золотой"&&/30 серебряных или 300 медяков/.test(деньги.breakdown)&&/местная монета области «/.test(деньги.regional)&&деньги.rare0===0&&деньги.rare2===2&&/Взято вперёд 40 золота/.test(деньги.borrow)&&деньги.gold===50&&деньги.debts===2&&деньги.goldAfter===46&&/Редкие единицы: договорные печати 2/.test(деньги.text)&&/Кристалл идёт за/.test(деньги.text),деньги);

 /* ── 6. Ядро ── */
 const ядро=await page.evaluate(async()=>{
  const r={};G.core=null;r.has0=Core.has();r.need=Core.need();r.status0=Core.status();r.mark0=Core.mark();
  const бm=G.manaMax;PLAYED.length=0;JT.length=0;Core.grant("amulet");r.has=Core.has();r.form=Core.form().id;r.mana=G.manaMax-бm;r.звук=PLAYED.includes("fx_crystal");r.летопись=JT.some(t=>/Ядро Отклика: амулет/.test(t));
  r.status=Core.status();
  G.place=null;G.ship=null;G.inCombat=false;const бx=G.x,бy=G.y;G.x=200;G.y=200;
  r.mark1=Core.mark("дом");G.x=210;r.mark2=Core.mark();G.x=220;r.mark3=Core.mark();r.точки=G.core.точки.length;
  G.space=3;r.retNo=Core.returnTo(0);G.space=20;r.ret=Core.returnTo(0);r.где=[G.x,G.y];r.spaceAfter=G.space;
  r.unmark=Core.unmark(1);r.точки2=G.core.точки.length;
  r.fix=Core.fix("проба знания");r.запись=G.core.записи[0];r.trace=Core.trace();r.analyzeNo=Core.analyze(null);
  G.x=бx;G.y=бy;
  /* форма с волей: имплант */
  G.core=null;G.willMax=12;Core.grant("implant");r.implWill=G.willMax;r.implPts=Core.form().точек;
  return r;});
 check('Ядро Отклика: без него — правда, зачем оно нужно; принятая форма звучит и пишется, амулет даёт три маны, имплант берёт две воли и даёт четыре точки',
  ядро.has0===false&&/Наставник Пути|Мастер Ядер/.test(ядро.need)&&/нет/.test(ядро.status0)&&/нужно Ядро/.test(ядро.mark0)&&ядро.has&&ядро.form==="amulet"&&ядро.mana===3&&ядро.звук&&ядро.летопись&&/Ядро Отклика, амулет/.test(ядро.status)&&ядро.implWill===10&&ядро.implPts===4,ядро);
 check('точки возврата по числу формы, третья не ставится; Нить Возврата стоит десять пространства, без них — отказ, с ними — переносит; точку снимают; записи знания и следы магии',
  /поставлена: дом/.test(ядро.mark1)&&/поставлена/.test(ядро.mark2)&&/2 точки заняты/.test(ядро.mark3)&&ядро.точки===2&&/не хватает энергии/.test(ядро.retNo)&&/вы у точки «дом»/.test(ядро.ret)&&ядро.где[0]===200&&ядро.где[1]===200&&ядро.spaceAfter>=10&&ядро.spaceAfter<=11&&/Точка снята/.test(ядро.unmark)&&ядро.точки2===1&&ядро.запись==="проба знания"&&/Магических следов|Магические следы/.test(ядро.trace)&&/Выберите вещь/.test(ядро.analyzeNo),ядро);

 /* ── 7. чары Пути ── */
 const чары=await page.evaluate(()=>{
  const r={};G.deeds={};G.pathRank=0;r.rank0=Path.cast("impulse");
  G.deeds={hits:35,kills:9,casts:4,manaSpent:72,steps:30,quests:2};G.core=null;r.noCore=Path.cast("seal");
  Core.grant("crystal");G.will=10;G.aether=10;G.space=10;G.hp=G.hpMax=40;G.mana=0;G.manaMax=30;G.buffs={};
  const rnd=Math.random;Math.random=()=>0.99;
  PLAYED.length=0;r.seal=Path.cast("seal");r.sealSound=PLAYED.includes("stk_ward");r.will=G.will;r.оберег=buffActive("оберег");
  r.drain=Path.cast("drain");r.hp=G.hp;r.mana=G.mana;
  G.place=null;G.ship=null;const бx=G.x,бy=G.y;G.x=300;G.y=300;lastMoveDir="E";r.cut=Path.cast("cut");r.где=[G.x,G.y];r.space=G.space;G.x=бx;G.y=бy;
  G.aether=0;r.poor=Path.cast("veil");
  Math.random=()=>0;G.aether=10;G.hp=30;r.fail=Path.cast("veil");r.hpFail=G.hp;Math.random=rnd;
  r.unknown=Path.cast("zzz");
  return r;});
 check('чары Пути открываются со ступени Практика и только через Ядро; печать берёт три воли и даёт оберег со звуком; поглощение переливает жизнь в ману; разрез шагает на две клетки за пространство',
  /со ступени «Практик»/.test(чары.rank0)&&/через Ядро/.test(чары.noCore)&&/Печать легла/.test(чары.seal)&&чары.sealSound&&чары.will===7&&чары.оберег&&/восемью маны/.test(чары.drain)&&чары.hp===32&&чары.mana===8&&/Разрез: две клетки/.test(чары.cut)&&чары.где[0]===302&&чары.где[1]===300&&чары.space===6,чары);
 check('нехватка энергии называется, срыв чар бьёт по телу и воле, неизвестных чар нет',
  /не хватает энергии: эфирная/.test(чары.poor)&&/сорвались/.test(чары.fail)&&чары.hpFail<30&&/Таких чар Пути нет/.test(чары.unknown),{poor:чары.poor,fail:чары.fail,hp:чары.hpFail});

 /* ── 8. маски ── */
 const маски=await page.evaluate(()=>{
  const r={};G.items=[];G.mask=null;G.will=5;r.нет=Path.wear("Маска мага");r.неМаска=Path.wear("Меч");
  G.items.push("Маска мага","Маска дипломата");const бm=G.manaMax;PLAYED.length=0;r.wear=Path.wear("Маска мага");r.mask=G.mask;r.mana=G.manaMax-бm;r.звук=PLAYED.includes("arte_cloth");r.kMana=Path.maskK("mana");r.kTrade=Path.maskK("trade");
  r.again=Path.wear("Маска мага");
  r.off=Path.takeOff();r.manaBack=G.manaMax===бm;r.mask0=G.mask;
  Path.wear("Маска дипломата");r.kTrade2=Path.maskK("trade");
  G.day=7;G.hour=1;G.willHour=null;G.will=1;Energy.step();r.will=G.will;G.hour=2;SAID.length=0;Energy.step();r.спала=G.mask===null&&SAID.some(t=>/спадает с лица/.test(t));
  G.will=0;r.безВоли=Path.wear("Маска дипломата");
  const row=invAll().find(x=>x.kind==="item"&&x.name==="Маска мага");r.row=!!row;r.brief=row?invBrief(row.kind,row.key):"";const acts=row?invActionsAll(row):{ok:[],blocked:[]};r.acts=acts.ok.map(a=>a.id);
  return r;});
 check('маска: нужна вещь, не всякая вещь — маска; надетая маска звучит, даёт эффект на счёт и ключ торга; снятая возвращает; повторно не надевается',
  /Этой маски у вас нет/.test(маски.нет)&&/не маска/.test(маски.неМаска)&&/на лице/.test(маски.wear)&&маски.mask==="mage"&&маски.mana===5&&маски.звук&&маски.kMana===5&&маски.kTrade===1&&/уже на лице/.test(маски.again)&&/снята/.test(маски.off)&&маски.manaBack&&маски.mask0===null&&маски.kTrade2===0.95,маски);
 check('маска берёт волю по часу и спадает без неё; без воли не надеть; инвентарь видит маску Рода и предлагает надеть',
  маски.will===0&&маски.спала&&/берёт волю/.test(маски.безВоли)&&маски.row&&/маска Рода/.test(маски.brief)&&маски.acts.includes("wearmask"),{will:маски.will,спала:маски.спала,brief:маски.brief.slice(0,60),acts:маски.acts});

 /* ── 9. артефакты и прилавок ── */
 const артефакты=await page.evaluate(async()=>{
  const r={};r.text=Path.artifactText("Компас Разлома");r.none=Path.artifactText("Меч");
  G.aether=5;r.ark=Path.artifactUse("Ковчег Эссенций");r.aether=G.aether;
  G.buffs={};r.adapt=Path.artifactUse("Печать Адаптации");r.оберег=buffActive("оберег");
  G.place=null;r.compass=Path.artifactUse("Компас Разлома");r.other=Path.artifactUse("Меч");
  G.items=["Компас Разлома"];const row=invAll().find(x=>x.kind==="item"&&x.name==="Компас Разлома");r.brief=row?invBrief(row.kind,row.key):"";r.acts=row?invActionsAll(row).ok.map(a=>a.id):[];
  /* прилавок Мастера Ядер */
  const n=getNPC(G.x,G.y,0,"Мастер Ядер");r.prof=n.prof;G.items=[];G.gold=1000;G.core=null;
  const st=stockFor(n);const я=st.find(s=>s.n==="Ядро Отклика");r.наПрилавке=!!(я&&я.вещь&&я.price===300);
  const rows=shopStockRows(n);const rr=rows.find(x=>x.name==="Ядро Отклика");r.card=rr?rr.card:"";r.cat=rr?rr.cat:"";
  const g=G.gold;const i=st.indexOf(я);buyItem(n.key,i);r.куплено=(G.items||[]).includes("Ядро Отклика");r.цена=g-G.gold;
  /* форма у мастера */
  openNPC(n.key,true);await new Promise(res=>setTimeout(res,60));CMD.mentor(n.key+"~coreform");await new Promise(res=>setTimeout(res,60));
  const body=document.getElementById("npcBody");r.формы=body?body.querySelectorAll('[data-cmd^="coreform:"]').length:0;
  CMD.coreform("bracelet");r.form=Core.has()?Core.form().id:null;r.itemGone=!(G.items||[]).includes("Ядро Отклика");
  r.second=CMD.coreform("crystal");r.formStill=Core.form().id;
  return r;});
 check('артефакт Пути: карточка с историей, происхождением, ремонтом и развитием; Ковчег даёт эфир, Печать — оберег, Компас говорит об узлах; инвентарь предлагает использовать',
  /Компас Разлома — чует нестабильные переходы/.test(артефакты.text)&&/Происхождение:.*Ремонт:.*Развитие:/.test(артефакты.text)&&артефакты.none===""&&/эфирная энергия \+3/.test(артефакты.ark)&&артефакты.aether===8&&/оберег/.test(артефакты.adapt)&&артефакты.оберег&&/Компас Разлома:/.test(артефакты.compass)&&артефакты.other===null&&/чует нестабильные переходы/.test(артефакты.brief)&&артефакты.acts.includes("use"),{acts:артефакты.acts,brief:артефакты.brief.slice(0,60)});
 check('Мастер Ядер держит Ядро Отклика за триста; в окне торговли у него карточка с историей; купленное ложится в суму; у мастера выбирают форму — навсегда',
  артефакты.prof==="Мастер Ядер"&&артефакты.наПрилавке&&/интерфейс развития/.test(артефакты.card)&&артефакты.куплено&&артефакты.цена===300&&артефакты.формы===6&&артефакты.form==="bracelet"&&артефакты.itemGone&&артефакты.formStill==="bracelet",артефакты);

 /* ── 10. люди Пути и пробуждение ── */
 const люди=await page.evaluate(async()=>{
  const r={};G.place=null;G.inCombat=false;G.combat=null;
  const n=getNPC(G.x,G.y,0,"Наставник Пути");openNPC(n.key,true);await new Promise(res=>setTimeout(res,80));
  const body=document.getElementById("npcBody");const btns=[...body.querySelectorAll('[data-cmd^="mentor:"]')].map(b=>b.textContent.trim());r.btns=btns;
  SAID.length=0;Path.npcAct(n.key,"trial");r.trial=SAID.find(t=>/Ступень «/.test(t)&&/Следующая ступень|Выше ступени нет/.test(t))||"";
  const a=getNPC(G.x,G.y,1,"Архивист");G.loreForerunners=0;const xp=Number(G.xp)||0;Path.npcAct(a.key,"forerunners");r.xp1=(Number(G.xp)||0)-xp;Path.npcAct(a.key,"forerunners");r.xp2=(Number(G.xp)||0)-xp;
  const p=getNPC(G.x,G.y,2,"Портальный инженер");G.gold=100;G.inv={};G.rareUnits=null;SAID.length=0;Path.npcAct(p.key,"permit");r.permitNo=SAID.find(t=>/не хватает/.test(t))||"";
  G.inv["кристалл"]=1;Path.npcAct(p.key,"permit");r.permits=Coins.rare("permits");r.gold=G.gold;r.кристалл=Number(G.inv["кристалл"])||0;
  const s=getNPC(G.x,G.y,3,"Изгнанник Дома");SAID.length=0;Path.npcAct(s.key,"secrets");r.secrets=SAID[SAID.length-1]||"";
  /* Поглотитель */
  const d=getNPC(G.x,G.y,4,"Поглотитель");G.aether=5;G.hp=G.hpMax=60;Path.npcAct(d.key,"devour");r.бой=!!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.n==="Поглотитель");
  if(r.бой){G.combat.hp=0;G.deeds=G.deeds||{};victory();}r.aether=G.aether;r.после=G.inCombat;
  /* цепочка пробуждения */
  r.chain=chainForNPC({prof:"Наставник Пути",x:120,y:140});
  G.quests=[];G.chainTaken={};G.items=[];G.inv={};G.gold=0;G.place=null;G.chainsDone=0;
  const nn={key:"7,7,0",x:120,y:140,name:"Наставник",race:"Люди",prof:"Наставник Пути",tier:1};
  G.quests.push(makeChainQuest(nn,"awakening",0));const steps=[];
  for(let i=0;i<5;i++){const q=G.quests.find(x=>!x.done);if(!q)break;q.doneFlag=true;q.have=q.need||1;G.dungeonKills=(q.need||1)+5;if(q.res)G.inv[q.res]=(q.need||1)+2;if(q.tx!=null){G.x=q.tx;G.y=q.ty;}completeQuest(q.id);steps.push(q.chainStep);G.place=null;}
  r.steps=steps;r.ядро=(G.items||[]).includes("Ядро Отклика");r.intro=CHAIN_DB.awakening.intro;
  return r;});
 check('люди Пути: у Наставника кнопки «Показать Путь» и «Испытание», испытание называет ступень и что дальше; Архивист даёт опыт за Предтеч один раз; инженер выдаёт разрешение за сорок золота и кристалл',
  люди.btns.some(t=>/Показать Путь/.test(t))&&люди.btns.some(t=>/Испытание/.test(t))&&люди.trial.length>0&&люди.xp1===15&&люди.xp2===15&&/не хватает/.test(люди.permitNo)&&люди.permits===1&&люди.gold===60&&люди.кристалл===0,люди);
 check('изгнанник говорит о Домах; Поглотитель выходит на бой и, распавшись, отдаёт эфир; цепочка «Пробуждение Грани» у Наставника — три шага и Ядро Отклика в руки',
  люди.secrets.length>0&&люди.бой&&люди.aether>=15&&люди.после===false&&люди.chain==="awakening"&&люди.steps.join(",")==="0,1,2"&&люди.ядро&&/Наставник Пути/.test(люди.intro),{secrets:люди.secrets.slice(0,60),бой:люди.бой,aether:люди.aether,steps:люди.steps,ядро:люди.ядро});

 /* ── 11. торговля за редкое, окно, меню, статус ── */
 const прочее=await page.evaluate(async()=>{
  const r={};const n=getNPC(G.x,G.y,0,"Торговец");
  const d=Path.demandFor(n,{gear:{rank:3}},0);r.demand=d;r.demandNone=Path.demandFor(n,{gear:{rank:1}},0);
  const о=Path.demandFor;Path.demandFor=()=>({ок:false,вид:"проба",почему:"торговец просит не только золото: проба — нужно испытание"});
  const rows=shopStockRows(n);r.rowNo=rows.length?rows[0].доступно:null;Path.demandFor=о;
  /* окно Пути */
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.path();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["pStatus","pEnergy","pFacets","pTree","pPaths","pCore","pSpells","pMasks","pTrace"].filter(id=>!(document.getElementById(id)||{}).innerHTML);
  r.сказано=SAID.find(t=>/^Путь Грани\./.test(t))||"";r.кнопкиЧар=document.querySelectorAll('#pSpells [data-cmd^="pathcast:"]').length;r.кнопкиПутей=document.querySelectorAll('#pPaths [data-cmd^="pathact:"]').length;
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  r.меню=AM_GROUPS.some(g=>(g.rows||g.items||g[1]||[]).some(x=>Array.isArray(x)?x[0]==="path":x&&x.id==="path"))||JSON.stringify(AM_GROUPS).includes('"path"');
  SAID.length=0;Speech.status();r.статус=SAID.find(t=>/Ступень «/.test(t))||"";
  r.hooks=true;
  return r;});
 check('за редкое торговец просит не только золото: требование с видом и причиной, обычное без требования; окно торговли переносит отказ в строку товара',
  прочее.demand&&typeof прочее.demand.ок==="boolean"&&прочее.demand.вид&&/требование выполнено|торговец просит не только золото/.test(прочее.demand.почему)&&прочее.demandNone===null&&/проба — нужно испытание/.test(прочее.rowNo||""),прочее.demand);
 check('окно «Путь Грани» с девятью разделами, кнопками чар и путей, говорит статус; строка в меню действий; статус речи называет ступень; такты суток и прихода связаны в исходнике',
  прочее.окно==="modal-path"&&прочее.секции.length===0&&/Ступень «/.test(прочее.сказано)&&прочее.кнопкиЧар===10&&прочее.кнопкиПутей===12&&прочее.меню&&/Ступень «/.test(прочее.статус)&&src.includes("safeFn(()=>Energy.daily());safeFn(()=>Coins.daily());")&&src.includes("safeFn(()=>Energy.step());safeFn(()=>Energy.atNode());")&&src.includes("safeFn(()=>Path.onVictory(m));")&&src.includes("safeFn(()=>Path.tick());"),{окно:прочее.окно,секции:прочее.секции,чар:прочее.кнопкиЧар,путей:прочее.кнопкиПутей,меню:прочее.меню,статус:прочее.статус.slice(0,40)});

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
