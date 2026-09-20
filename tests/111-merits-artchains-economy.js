/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 111: ДОСТИЖЕНИЯ, АРТЕФАКТНЫЕ ЦЕПОЧКИ, ХОЗЯЙСТВО ТОРГОВЦА,
   АУДИОЭНЦИКЛОПЕДИЯ

   1. Данные: двенадцать родов достижений со своим звуком, в каждом роде
      есть свои достижения с целью и счётом; десять звеньев артефактной
      цепочки; семь рангов артефактов; семь полей энциклопедии.
   2. Достижение берётся само, когда мир дорос: звучит по роду, пишется в
      летопись и реестр, второй раз не берётся; прогресс виден числом.
   3. Артефактная цепочка: одна вещь — одна история; звено открывается
      делом, повтор не открывает, десятое закрывает цепочку.
   4. Хозяйство торговца: склад, поставщик, конкурент, долг, предпочтение,
      предел казны; цена слушает предпочтение и пустой склад; склад тает от
      покупок и пополняется по дням.
   5. Аудиоэнциклопедия: запись по семи полям, звучит; неизвестной записи
      честно отказывает.
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
  const r={};r.kinds=MERIT_KINDS.length;r.kindsOk=MERIT_KINDS.every(k=>SOUND_BANK[k.звук]&&k.n);
  r.merits=MERITS.length;r.meritsOk=MERITS.every(m=>MERIT_BY_KIND[m.род]&&m.цель>0&&typeof m.счёт==="function"&&m.о&&m.n);
  r.всеРоды=MERIT_KINDS.filter(k=>!MERITS.some(m=>m.род===k.id)).map(k=>k.id);
  r.steps=ART_CHAIN_STEPS.length;r.ranks=ART_RANKS.filter(x=>typeof x.id==="number"&&x.мощь).length;
  r.fields=Encyclo.fields.length;r.записей=Encyclo.count();
  r.modules=["MERITS","ARTCHAINS","ECON","ENCYCLO"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="merit");r.selfcheck=row?row.ok:null;
  return r;});
 check('двенадцать родов достижений со звуком, и в каждом роде есть свои достижения с целью и счётом; двадцать четыре и более достижений',
  данные.kinds===12&&данные.kindsOk&&данные.merits>=24&&данные.meritsOk&&данные.всеРоды.length===0,данные);
 check('десять звеньев артефактной цепочки, семь рангов артефактов, семь полей энциклопедии на сотнях записей; самопроверка мира видит достижения',
  данные.steps===10&&данные.ranks===7&&данные.fields===7&&данные.записей>100&&данные.modules&&данные.selfcheck===true,данные);

 /* ── 2. достижения ── */
 const заслуги=await page.evaluate(()=>{
  const r={};G.merits={};G.ledger=null;Ledger.ensure();G.gold=0;G.deeds={};
  r.нет=Merits.done("gold");r.прогресс0=Merits.progress("gold");
  G.gold=1000;PLAYED.length=0;JT.length=0;SAID.length=0;
  r.взято=Merits.check();r.есть=Merits.done("gold");r.звук=PLAYED.includes("arte_coins");r.летопись=JT.some(t=>/Достижение: Кошель звенит/.test(t));r.сказано=SAID.find(t=>/Достижение: «Кошель звенит»/.test(t))||"";r.реестр=Ledger.has("история",/Кошель звенит/);
  r.второй=Merits.check();
  G.deeds={casts:100};r.ещё=Merits.check();r.чары=Merits.done("spells");
  r.строка=Merits.line(MERIT_BY_ID.gold);r.text=Merits.text();r.поРоду=Merits.byKind("econ").length;
  return r;});
 check('достижение берётся само, когда мир дорос: звучит по роду, говорит, пишется в летопись и реестр; второй раз не берётся; прогресс и строка видны',
  заслуги.нет===false&&заслуги.прогресс0===0&&заслуги.взято>=1&&заслуги.есть&&заслуги.звук&&заслуги.летопись&&заслуги.сказано.length>0&&заслуги.реестр&&заслуги.второй===0&&заслуги.ещё>=1&&заслуги.чары&&/✅/.test(заслуги.строка)&&/Достижений \d+ из/.test(заслуги.text)&&заслуги.поРоду>=2,заслуги);

 /* ── 3. артефактные цепочки ── */
 const цепь=await page.evaluate(()=>{
  const r={};G.artChains={};G.ledger=null;Ledger.ensure();
  const имя="Компас Разлома";const c1=ArtChains.of(имя),c2=ArtChains.of(имя);
  r.одна=JSON.stringify(c1)===JSON.stringify(c2);r.другая=JSON.stringify(ArtChains.of("Старый меч"))!==JSON.stringify(c1);
  r.звеньев=c1.шаги.length;r.поля=c1.шаги.filter(s=>!s.т||!s.n).length;
  r.нет=ArtChains.known(имя);
  PLAYED.length=0;r.открыл=ArtChains.open(имя,"origin");r.звук=PLAYED.includes("arte_page");r.реестр=Ledger.has("история",new RegExp(имя));
  r.повтор=ArtChains.open(имя,"origin");r.счёт=ArtChains.known(имя);
  r.нетЗвена=ArtChains.open(имя,"нет такого");
  ART_CHAIN_STEPS.forEach(s=>ArtChains.open(имя,s.id));
  r.всё=ArtChains.known(имя);r.последнее=ArtChains.open("Кристалл Глубин","after");
  r.text=ArtChains.text(имя);r.список=ArtChains.text();
  return r;});
 check('у вещи одна и та же цепочка, у другой — своя; десять звеньев с содержанием; звено открывается делом, звучит и пишется, повтор не открывает; десятое закрывает цепочку',
  цепь.одна&&цепь.другая&&цепь.звеньев===10&&цепь.поля===0&&цепь.нет===0&&/Происхождение/.test(цепь.открыл)&&цепь.звук&&цепь.реестр&&/уже знаете/.test(цепь.повтор)&&цепь.счёт===1&&/Такого звена нет/.test(цепь.нетЗвена)&&цепь.всё===10&&/ранг/.test(цепь.text)&&/Цепочек начато/.test(цепь.список),цепь);

 /* ── 4. хозяйство торговца ── */
 const лавка=await page.evaluate(()=>{
  const r={};G.econ={};G.day=10;
  const n=getNPC(G.x,G.y,0,"Торговец");const e=Econ.of(n);
  r.поля=["склад","поставщик","конкурент","долг","предпочтение","отказ","предел"].filter(k=>e[k]==null);
  r.предпочтение=Econ.priceK(n,e.предпочтение);r.отказ=Econ.priceK(n,e.отказ);r.дешевле=r.предпочтение<r.отказ;
  const склад0=Econ.stock(n);Econ.take(n,10);const склад1=Econ.stock(n);r.убыло=склад1<склад0;
  G.day=13;const склад2=Econ.stock(n);r.подвоз=склад2>склад1;
  r.text=Econ.text(n);r.line=Econ.npcLine(n);r.неТорговец=Econ.npcLine(getNPC(G.x,G.y,1,"Фермер"));
  /* цена у торговца слушает хозяйство */
  const ask=npcAsk(n,e.предпочтение),ask2=npcAsk(n,e.отказ);
  r.цены=[ask,ask2];
  return r;});
 check('у торговца склад, поставщик, конкурент, долг, предпочтение и предел казны; цена слушает предпочтение; склад тает от покупок и пополняется по дням; строка видна у торговца и молчит у прочих',
  лавка.поля.length===0&&лавка.дешевле&&лавка.убыло&&лавка.подвоз&&/склад \d+ из \d+/.test(лавка.text)&&/подвоз — /.test(лавка.text)&&/🏪/.test(лавка.line)&&лавка.неТорговец===""&&лавка.цены[0]>0&&лавка.цены[1]>0,лавка);

 /* ── 5. аудиоэнциклопедия ── */
 const энц=await page.evaluate(()=>{
  const r={};const роль=Object.keys(SOUND_BANK)[0];const e=Encyclo.of(роль);
  r.поля=Encyclo.fields.filter(k=>e[k]==null);r.описание=e.описание.length>5;
  PLAYED.length=0;r.text=Encyclo.play(роль);r.звук=PLAYED.includes(роль);
  r.нет=Encyclo.text("нет такой записи");r.count=Encyclo.count();
  return r;});
 check('запись энциклопедии даёт все семь полей с описанием, звучит по требованию; неизвестной записи честно отказывает, называя, сколько их всего',
  энц.поля.length===0&&энц.описание&&/Материал: /.test(энц.text)&&/Расстояние: /.test(энц.text)&&/Взаимодействие: /.test(энц.text)&&/Опасность: /.test(энц.text)&&энц.звук&&/Такой записи нет/.test(энц.нет)&&/В энциклопедии \d+ записей/.test(энц.нет)&&энц.count>100,энц);

 /* ── 6. окно и меню ── */
 const окно=await page.evaluate(async()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.merit();await new Promise(res=>setTimeout(res,100));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["mtList","mtArt","mtEcon","mtEnc"].filter(id=>!(document.getElementById(id)||{}).innerHTML);
  r.строк=document.querySelectorAll('#mtList .list-line').length;r.энц=document.querySelectorAll('#mtEnc [data-cmd^="encrec:"]').length;
  r.сказано=SAID.find(t=>/^Достижения и хозяйство\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();r.меню=JSON.stringify(AM_GROUPS).includes('"merit"');
  return r;});
 check('окно «Достижения и хозяйство» с четырьмя разделами, строками по родам и записями энциклопедии, говорит счёт; строка в меню действий',
  окно.окно==="modal-merit"&&окно.секции.length===0&&окно.строк>=24&&окно.энц>=1&&окно.сказано.length>0&&окно.меню,окно);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
