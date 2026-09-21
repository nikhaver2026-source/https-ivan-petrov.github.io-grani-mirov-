/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 154: ШЕСТНАДЦАТЬ СВОЙСТВ ФРАКЦИИ И СОВЕТ ДЕРЖАВЫ (§17)

   §17 перечисляет у фракции шестнадцать свойств и отдельной строкой
   говорит: «Фракции принимают решения самостоятельно». Досье державы
   называло девять из шестнадцати, а решала держава ровно ничего.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Свойств шестнадцать, все из §17, у каждого имя, суть и живая запись.
   2. Каждое свойство говорит о себе у всякой из держав, и ни одно не пусто.
   3. Свойства берутся из мира, а не выдумываются: поменяли войску мораль —
      переменилась строка «армия»; заключили бумагу — переменилась строка
      «дипломатия».
   4. Решений двенадцать, у каждого голос настоящей записью (без синтеза) и
      хоть одно настоящее следствие.
   5. Решение выводится, а не бросается: тот же день — тот же совет.
   6. Решение зависит от состояния: началась война — совет думает о войне.
   7. За два года встречаются все двенадцать решений.
   8. Шесть следствий настоящие и в берегах: пошлина, дороги, цена,
      закупка, запрет и урок.
   9. Пошлина проходит одной дверью: где решение её двигает, там она и
      сдвинута, и досье называет обычную рядом с нынешней.
  10. Запрет живой: решение седмичное, а чего оно касается — спрашивается
      заново; погасили недостаток — и запирать нечего.
  11. Вечных денег нет ни при одном из двенадцати решений.
  12. Урок у наставника дешевеет ровно там, где совет созвал учёных, и одна
      цена на все три места: требование, проверка и просьба.
  13. Досье называет решение, его следствия и все шестнадцать свойств.
  14. Глашатай объявляет решение один раз за седмицу и со звуком.
  15. Самопроверка держит строку faction16; модуль COUNCIL, глава, README.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);
 /* Перехватываем голос и речь: глашатая проверяем по тому, что прозвучало. */
 await page.evaluate(()=>{
  window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1. Состав свойств ── */
 const состав=await page.evaluate(()=>({
  свойств:FACTION_TRAITS.length,
  уник:new Set(FACTION_TRAITS.map(t=>t.id)).size,
  ид:FACTION_TRAITS.map(t=>t.id).join(","),
  без:FACTION_TRAITS.filter(t=>!(t.n&&t.о&&t.о.length>12)).map(t=>t.id),
  безЗвука:FACTION_TRAITS.filter(t=>!SOUND_BANK[t.звук]).map(t=>t.id),
  синтез:FACTION_TRAITS.filter(t=>{const b=SOUND_BANK[t.звук];
   return b&&/^(inst|orch|mood|relic|score|folk|depth)\//.test(b.f[0]);}).map(t=>t.id)}));
 check('свойств шестнадцать, все из §17, у каждого имя, суть и живая запись без синтеза',
  состав.свойств===16&&состав.уник===16
  &&состав.ид==="land,folk,econ,res,prod,army,spy,faith,law,tax,diplo,allies,foes,inner,lead,goals"
  &&состав.без.length===0&&состав.безЗвука.length===0&&состав.синтез.length===0,состав);

 /* ── 2. Каждое свойство говорит у каждой державы ── */
 const всеДержавы=await page.evaluate(()=>{
  const немые=[],коротко=[];
  EMPIRES.forEach((e,i)=>factionTraits(i).forEach(t=>{
   if(!t.слово)немые.push(e.short+"/"+t.id);
   else if(t.слово.length<4)коротко.push(e.short+"/"+t.id);}));
  return {держав:EMPIRES.length,немые:немые.slice(0,5),коротко:коротко.slice(0,5),
   строк:EMPIRES.length*16};});
 check('каждое из шестнадцати свойств говорит о себе у всякой державы — немых строк нет',
  всеДержавы.держав>=12&&всеДержавы.немые.length===0&&всеДержавы.коротко.length===0,всеДержавы);

 /* ── 3. Свойства берутся из мира ── */
 const изМира=await page.evaluate(()=>{
  const r={};
  const a=Armies.state(0);const было=a.мораль;
  r.армия0=factionTrait(0,"army").слово;
  a.мораль=Math.max(10,Math.min(100,было===40?80:40));
  r.армия1=factionTrait(0,"army").слово;
  a.мораль=было;
  r.армия2=factionTrait(0,"army").слово;
  /* Территория: столько же городов, сколько их и правда у державы. */
  const свои=empireCitiesOf(0).length;
  const имен=NAMED_CITIES.filter(c=>empireIndexAt(c.x,c.y)===0).length;
  r.земля=factionTrait(0,"land").знач===свои+имен&&свои+имен>0;
  /* Религия: тот самый бог, что записан у державы. */
  const g=GOD_BY_ID[EMPIRES[0].god];
  r.вера=!!g&&factionTrait(0,"faith").слово.indexOf(g.n)===0;
  /* Враги: ровно те, с кем война. */
  const врагов=EMPIRES.filter((o,j)=>j!==0&&relationWord(relationAt(0,j,G.day))==="война").length;
  r.враги=factionTrait(0,"foes").знач===врагов;
  return r;});
 check('свойства берутся из мира: поменяли войску мораль — переменилась строка, вернули — вернулась; города, бог и враги те самые',
  изМира.армия0!==изМира.армия1&&изМира.армия0===изМира.армия2
  &&изМира.земля&&изМира.вера&&изМира.враги,
  {армия0:изМира.армия0.slice(0,60),армия1:изМира.армия1.slice(0,60),
   земля:изМира.земля,вера:изМира.вера,враги:изМира.враги});

 /* ── 4. Состав решений ── */
 const решения=await page.evaluate(()=>({
  всего:FACTION_MOVES.length,
  уник:new Set(FACTION_MOVES.map(m=>m.id)).size,
  без:FACTION_MOVES.filter(m=>!(m.n&&m.о&&m.о.length>20)).map(m=>m.id),
  безЗвука:FACTION_MOVES.filter(m=>!SOUND_BANK[m.звук]).map(m=>m.id),
  синтез:FACTION_MOVES.filter(m=>{const b=SOUND_BANK[m.звук];
   return b&&/^(inst|orch|mood|relic|score|folk|depth)\//.test(b.f[0]);}).map(m=>m.id),
  безСледствия:FACTION_MOVES.filter(m=>!(typeof m.цена==="function"||typeof m.закупка==="function"
   ||typeof m.запрет==="function"||m.пошлина||m.дороги||m.урок)).map(m=>m.id),
  безВеса:FACTION_MOVES.filter(m=>typeof m.вес!=="function").map(m=>m.id)}));
 check('решений двенадцать, у каждого голос настоящей записью, вес от состояния и хоть одно настоящее следствие',
  решения.всего===12&&решения.уник===12&&решения.без.length===0
  &&решения.безЗвука.length===0&&решения.синтез.length===0
  &&решения.безСледствия.length===0&&решения.безВеса.length===0,решения);

 /* ── 5. Решение выводится, а не бросается ── */
 const устойчиво=await page.evaluate(()=>{
  const a=[],b=[];
  for(let d=7;d<=140;d+=7)EMPIRES.forEach((e,i)=>{a.push(factionMove(i,d).id);});
  FACTION_MOVE_CACHE.clear();
  for(let d=7;d<=140;d+=7)EMPIRES.forEach((e,i)=>{b.push(factionMove(i,d).id);});
  /* Внутри седмицы совет один и тот же, а от седмицы к седмице меняется. */
  const внутри=new Set();for(let d=70;d<77;d++)внутри.add(factionMove(0,d).id);
  return {совпало:a.join(",")===b.join(","),проб:a.length,внутри:внутри.size};});
 check('решение выводится, а не бросается: тот же день — тот же совет, и внутри седмицы он один',
  устойчиво.совпало&&устойчиво.проб>=200&&устойчиво.внутри===1,устойчиво);

 /* ── 6. Решение зависит от состояния ── */
 const отСостояния=await page.evaluate(()=>{
  /* Мир и война на одном и том же дне: совет думает о разном. */
  const ориг=empireAtWar,оригВ=warsAt;
  const снять=()=>{FACTION_MOVE_CACHE.clear();};
  empireAtWar=()=>false;warsAt=()=>[];снять();
  const мир=EMPIRES.map((e,i)=>factionMove(i,91).id);
  empireAtWar=()=>true;warsAt=d=>[{a:0,b:1}];снять();
  const война=EMPIRES.map((e,i)=>factionMove(i,91).id);
  empireAtWar=ориг;warsAt=оригВ;снять();
  const военные=["levy","ban","raid","tax"];
  return {мир,война,
   переменилось:мир.filter((x,i)=>x!==война[i]).length,
   мирныхНаВойне:война.filter(id=>["road","feast","school","envoy"].includes(id)).length,
   военныхНаВойне:война.filter(id=>военные.includes(id)).length};});
 check('решение зависит от состояния: объявили войну — совет переменился, и мирных решений на войне не принимают',
  отСостояния.переменилось>=6&&отСостояния.мирныхНаВойне===0
  &&отСостояния.военныхНаВойне===отСостояния.война.length,отСостояния);

 /* ── 7. За два года встречаются все двенадцать ── */
 const разнообразие=await page.evaluate(()=>{
  const виды={};
  for(let d=7;d<=728;d+=7)EMPIRES.forEach((e,i)=>{const m=factionMove(i,d);виды[m.id]=(виды[m.id]||0)+1;});
  const нет=FACTION_MOVES.map(m=>m.id).filter(id=>!виды[id]);
  const всего=Object.values(виды).reduce((a,b)=>a+b,0);
  const самое=Math.max(...Object.values(виды));
  return {родов:Object.keys(виды).length,нет,всего,доляПервого:Math.round(самое/всего*100)/100};});
 check('за два года держава перебирает все двенадцать решений, и ни одно не занимает больше половины седмиц',
  разнообразие.родов===12&&разнообразие.нет.length===0
  &&разнообразие.доляПервого<0.5,разнообразие);

 /* ── 8. Шесть следствий в берегах ── */
 const следствия=await page.evaluate(()=>{
  const вне=[];let движется={пошлина:0,дороги:0,цена:0,закупка:0,запрет:0,урок:0};
  for(let d=7;d<=364;d+=7)EMPIRES.forEach((e,i)=>{
   const t=factionMoveTaxK(i,d),dd=factionMoveRoadK(i,d),u=factionMoveTeachK(i,d);
   const з=factionMoveBans(i,d);
   ["руда","трава","полотно","самоцвет"].forEach(res=>{
    const ц=factionMovePriceK(res,i,d),зк=factionMoveBuyK(res,i,d);
    if(!(ц>=0.75&&ц<=1.4)||!(зк>=1&&зк<=1.25))вне.push([e.short,res,ц,зк]);
    if(ц!==1)движется.цена++;if(зк!==1)движется.закупка++;});
   if(!(t>=0.8&&t<=1.8)||!(dd>=0.7&&dd<=1.4)||!(u>=0.6&&u<=1.4))вне.push([e.short,d,t,dd,u]);
   if(t!==1)движется.пошлина++;if(dd!==1)движется.дороги++;
   if(u!==1)движется.урок++;if(з.length)движется.запрет++;});
  return {вне:вне.slice(0,4),движется};});
 check('шесть следствий настоящие и в берегах: каждое хоть раз сдвигается и ни разу не выходит за свои пределы',
  следствия.вне.length===0&&Object.keys(следствия.движется).every(k=>следствия.движется[k]>0),следствия);

 /* ── 9. Пошлина одной дверью ── */
 const пошлина=await page.evaluate(()=>{
  let нашли=null;
  for(let d=7;d<=364&&!нашли;d+=7)EMPIRES.forEach((e,i)=>{
   if(нашли)return;
   const k=factionMoveTaxK(i,d);
   if(k!==1)нашли={i,d,k,база:empireLaw(i).пошлина,итог:empireTax(i,d),ход:factionMove(i,d).n};});
  if(!нашли)return {нет:true};
  const {i,d,k,база,итог}=нашли;
  нашли.сходится=Math.abs(итог-Math.round(база*k*1000)/1000)<0.0011;
  нашли.вышеБазы=k>1?итог>база:итог<база;
  /* Досье называет и нынешнюю пошлину, и обычную рядом. */
  const был=G.day;G.day=d;
  нашли.вДосье=/пошлина \d+ сотых/.test(factionTrait(i,"tax").слово)
   &&factionTrait(i,"tax").слово.indexOf("обычно")>0;
  G.day=был;
  return нашли;});
 check('пошлина проходит одной дверью: решение её двигает, итог сходится с основой и досье называет обычную рядом с нынешней',
  !пошлина.нет&&пошлина.сходится&&пошлина.вышеБазы&&пошлина.вДосье,пошлина);

 /* ── 10. Запрет живой ── */
 const запрет=await page.evaluate(()=>{
  let нашли=null;
  for(let d=7;d<=364&&!нашли;d+=7)EMPIRES.forEach((e,i)=>{
   if(нашли)return;
   const з=factionMoveBans(i,d);
   if(з.length)нашли={i,d,з:з.slice(),ход:factionMove(i,d).id};});
  if(!нашли)return {нет:true};
  const {i,d}=нашли;
  const был=G.day;G.day=d;
  нашли.вЗапрете=bannedHere(нашли.з[0],i);
  /* Гасим недостаток, не трогая решения: запирать становится нечего. */
  const ориг=prodDeficit;prodDeficit=()=>({});
  нашли.послеГашения=factionMoveBans(i,d).length;
  prodDeficit=ориг;
  нашли.вернулось=factionMoveBans(i,d).length;
  нашли.решениеТоЖе=factionMove(i,d).id===нашли.ход;
  G.day=был;
  return нашли;});
 check('запрет живой: решение седмичное, а чего оно касается — спрашивается заново; погасили недостаток — запирать нечего, вернули — снова заперто',
  !запрет.нет&&запрет.вЗапрете&&запрет.послеГашения===0&&запрет.вернулось>0&&запрет.решениеТоЖе,запрет);

 /* ── 11. Вечных денег нет ни при одном решении ── */
 const деньги=await page.evaluate(()=>{
  const было={x:G.x,y:G.y,день:G.day};
  const петли=[],проверено=[];
  const товары=["руда","трава","камень","кристалл","слиток","полотно"];
  for(let d=7;d<=364;d+=7){
   G.day=d;
   EMPIRES.forEach((e,i)=>{
    const ход=factionMove(i,d).id;
    товары.forEach(res=>{
     const куп=marketPrice(res,i,d);
     const прод=sellPrice(res,i,d,null);
     проверено.push(1);
     if(прод>=куп)петли.push([e.short,ход,res,куп,прод]);});});}
  G.x=было.x;G.y=было.y;G.day=было.день;
  return {петли:петли.slice(0,4),сравнений:проверено.length};});
 check('вечных денег нет ни при одном из двенадцати решений: продажа нигде не обгоняет покупку — больше полутора тысяч сравнений',
  деньги.петли.length===0&&деньги.сравнений>1500,деньги);

 /* ── 12. Цена урока одна на три места ── */
 const урок=await page.evaluate(()=>{
  const r={};
  G.mast={};G.gold=100000;G.rep={};G.deeds={quests:99};
  /* Находим державу, где совет созвал учёных, и стоим в ней. */
  let где=null;
  for(let d=7;d<=364&&!где;d+=7)EMPIRES.forEach((e,i)=>{
   if(где)return;if(factionMove(i,d).id==="school")где={i,d};});
  if(!где)return {нет:true};
  const был={x:G.x,y:G.y,день:G.day};
  G.day=где.d;G.x=EMPIRES[где.i].cap.x;G.y=EMPIRES[где.i].cap.y;
  r.множ=factionMoveTeachK(где.i,где.d);
  r.цена=teachGoldCost("smith");
  r.дешевле=r.цена<40;
  /* Одна цена на все три места: требование, проверка и просьба. */
  let n=null;
  искать: for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++)for(let k=0;k<3;k++){
   const x=getNPC(G.x+dx,G.y+dy,k,"Кузнец");
   if(x&&Mentor.teaches(x).includes("smith")&&!Mentor.refuses(x)){n=x;break искать;}}
  if(n){
   const треб=Mentor.demands(n,"smith").find(t=>t.id==="gold");
   r.требование=треб?треб.надо:null;
   r.совпало=треб&&треб.надо===r.цена;
   r.вПросьбе=String(mastAsk).includes("teachGoldCost");}
  G.day=был.день;G.x=был.x;G.y=был.y;
  return r;});
 check('созвали учёных — урок дешевеет, и цена одна на все три места: требование, проверка и просьба',
  !урок.нет&&урок.множ<1&&урок.дешевле&&урок.совпало&&урок.вПросьбе,урок);

 /* ── 13. Досье ── */
 const досье=await page.evaluate(()=>{
  const t=factionText(0);
  const лист=factionSheet(0);
  return {длина:t.length,
   естьРешение:/Совет державы .* решил: /.test(t),
   естьСледствие:/Из этого следует: /.test(t),
   естьСвойства:FACTION_TRAITS.every(x=>t.indexOf(x.n+" — ")>0),
   листДлина:лист.length,
   листВсе:FACTION_TRAITS.every(x=>лист.indexOf(x.n+": ")>0),
   строка:factionMoveLine(0,G.day)};});
 check('досье называет решение седмицы, его следствия и все шестнадцать свойств подряд',
  досье.естьРешение&&досье.естьСледствие&&досье.естьСвойства
  &&досье.листВсе&&досье.листДлина>200,
  {длина:досье.длина,листДлина:досье.листДлина,строка:досье.строка.slice(0,90)});

 /* ── 14. Глашатай ── */
 const глашатай=await page.evaluate(()=>{
  G.council={};
  const i=empireIndexAt(G.x,G.y);
  PLAYED.length=0;SAID.length=0;
  const первый=councilAnnounce();
  const звук=PLAYED.slice();
  const сказано=SAID.slice();
  const второй=councilAnnounce();
  /* Новая седмица — новое объявление. */
  const был=G.day;G.day=был+7;
  const третий=councilAnnounce();
  G.day=был;
  const m=factionMove(i,G.day);
  return {первый,второй,третий,
   звучал:звук.includes(m.звук),
   сказал:сказано.some(t=>/Совет державы/.test(t)),
   вПамяти:typeof G.council==="object"};});
 check('глашатай объявляет решение один раз за седмицу, со своим звуком, и снова — с новой седмицы',
  глашатай.первый===true&&глашатай.второй===false&&глашатай.третий===true
  &&глашатай.звучал&&глашатай.сказал&&глашатай.вПамяти,глашатай);

 /* ── 15. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="faction16");
  const c=Modules.get("COUNCIL");
  return {есть:!!r,ok:r?r.ok:false,note:r?r.note:"",
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!c&&typeof c.sheet==="function"&&typeof c.move==="function"
    &&typeof c.priceK==="function"&&typeof c.tax==="function"
    &&c.traits.length===16&&c.moves.length===12,
   текст:c?c.text():"",
   глава:GUIDE.some(g=>/Глава 84\. Держава решает сама/.test(g.title)&&g.body.length>=5),
   сохранение:(()=>{try{G.council={0:1};saveGame(true);
    const o=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");const g=o.G||o;
    return !!g.council;}catch(_){return false;}})()};});
 check('самопроверка держит строку faction16, модуль COUNCIL отвечает, глава 84 на месте, память глашатая ложится в сохранение',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.сохранение&&свод.текст.length>20,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 /* ── 16. README и docs ── */
 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 check('README и docs/МИР.md описывают шестнадцать свойств и совет державы',
  /шестнадцать свойств/i.test(readme)&&/совет держав/i.test(readme)
  &&/§17/.test(мир)&&/шестнадцать свойств/i.test(мир),
  {readme:/шестнадцать свойств/i.test(readme),docs:/§17/.test(мир)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
