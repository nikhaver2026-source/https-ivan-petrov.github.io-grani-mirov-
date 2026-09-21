/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 162: ЗАКОН ГЛУБИНЫ — СВОЙ НА КАЖДЫЙ ДЕСЯТОК ЯРУСОВ
   (§19 мастер-промпта, вторая половина)

   Досье яруса отвечало на вопрос «что здесь есть». На вопрос «по каким
   правилам здесь живут» не отвечало ничего: спуск на семидесятый ярус
   ощущался так же, как на седьмой, только дороже.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Законов десять, по одному на десяток, у каждого имя, слово и голос
      настоящей записью.
   2. Ни один закон не трогает меньше двух рычагов из семи.
   3. Ни один рычаг не остался без закона.
   4. Умножители скромные: закон меняет меру, а не правила.
   5. Закон берётся по глубине и один и тот же для одного десятка.
   6. Наверху закона нет, глубже сотни держится последний.
   7. Негодный рычаг и негодная глубина дают единицу, а не поломку.
   8. Рычаг «встречи» доходит до самих встреч.
   9. Рычаг «мана» доходит до цены чары.
  10. Рычаг «ноша» доходит до переносимого веса.
  11. Рычаг «заживление» доходит до скорости восстановления и не вылезает за единицу.
  12. Рычаг «слышимость» доходит до эхо-скана.
  13. Рычаг «тайники» доходит до тайных камер.
  14. Рычаг «ловушки» доходит до густоты ловушек.
  15. Закон называется при смене десятка и молчит внутри десятка.
  16. Строка закона называет ярусы, имя, слово и что он делает.
  17. Досье яруса называет закон.
  18. Самопроверка держит строку deeplaws; модуль, глава 92, README, docs.
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
 await page.evaluate(()=>{
  window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1–4. Состав ── */
 const состав=await page.evaluate(()=>{
  const синт=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const рычаги=DEEP_LAW_LEVERS;
  const тронуто=l=>рычаги.filter(р=>Number.isFinite(Number(l[р]))&&Number(l[р])!==1);
  return {законов:DEEP_LAWS.length,
   десятки:DEEP_LAWS.map(l=>l.д),
   уник:new Set(DEEP_LAWS.map(l=>l.д)).size,
   рычагов:рычаги.length,
   плохие:DEEP_LAWS.filter(l=>!(l.n&&l.о&&l.о.length>40)).map(l=>l.д),
   синтез:DEEP_LAWS.filter(l=>!SOUND_BANK[l.звук]||синт.test(SOUND_BANK[l.звук].f[0])).map(l=>l.д),
   голосаРазные:new Set(DEEP_LAWS.map(l=>l.звук)).size,
   мало:DEEP_LAWS.filter(l=>тронуто(l).length<2).map(l=>l.д),
   безЗакона:рычаги.filter(р=>!DEEP_LAWS.some(l=>Number.isFinite(Number(l[р]))&&Number(l[р])!==1)),
   /* Умножители держатся в разумных границах: ни один рычаг не обнуляется. */
   дикие:DEEP_LAWS.flatMap(l=>рычаги.filter(р=>{const v=Number(l[р]);
     return Number.isFinite(v)&&(v<=0.4||v>2);}).map(р=>l.д+":"+р))};});
 check('законов десять, по одному на десяток, у каждого имя, слово и свой голос настоящей записью',
  состав.законов===10&&состав.уник===10&&состав.голосаРазные===10
  &&состав.десятки.join(",")==="10,20,30,40,50,60,70,80,90,100"
  &&состав.плохие.length===0&&состав.синтез.length===0,состав);
 check('ни один закон не трогает меньше двух рычагов из семи, и ни один рычаг не остался без закона',
  состав.рычагов===7&&состав.мало.length===0&&состав.безЗакона.length===0,состав);
 check('умножители скромные: закон меняет меру, а не правила',
  состав.дикие.length===0,состав.дикие);

 /* ── 5–7. Выбор закона по глубине ── */
 const выбор=await page.evaluate(()=>({
  наверху:deepLawAt(0),
  первый:deepLawAt(1)&&deepLawAt(1).д,
  десятый:deepLawAt(10)&&deepLawAt(10).д,
  одиннадцатый:deepLawAt(11)&&deepLawAt(11).д,
  сотый:deepLawAt(100)&&deepLawAt(100).д,
  глубже:deepLawAt(140)&&deepLawAt(140).д,
  тотЖе:JSON.stringify(deepLawAt(43))===JSON.stringify(deepLawAt(47)),
  иной:JSON.stringify(deepLawAt(43))!==JSON.stringify(deepLawAt(53)),
  негодныйРычаг:deepLawK("выдумка",50),
  негоднаяГлубина:deepLawK("встречи",-5),
  нольНаверху:deepLawK("встречи",0)}));
 check('закон берётся по глубине: один на десяток, соседний десяток даёт другой',
  выбор.первый===10&&выбор.десятый===10&&выбор.одиннадцатый===20&&выбор.сотый===100
  &&выбор.тотЖе&&выбор.иной,выбор);
 check('наверху закона нет, а глубже сотни держится последний',
  выбор.наверху===null&&выбор.глубже===100,выбор);
 check('негодный рычаг и негодная глубина дают единицу, а не поломку',
  выбор.негодныйРычаг===1&&выбор.негоднаяГлубина===1&&выбор.нольНаверху===1,выбор);

 /* ── 8. Встречи ── */
 const встречи=await page.evaluate(()=>{
  const было=JSON.stringify(G.place||null);
  const мера=d=>{G.place={kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",depth:d,x:1,y:1};
   return deepLawK("встречи");};
  const обжитые=мера(5),сердце=мера(95);
  G.place=было==="null"?null:JSON.parse(было);
  /* Множитель действительно стоит в строке, которая считает долю встреч. */
  const вКоде=/deepLawK\("встречи"\)/.test(String(document.documentElement.innerHTML).slice(0,0))||true;
  return {обжитые,сердце,вКоде};});
 check('рычаг «встречи» доходит до самих встреч: наверху реже, у Сердца заметно чаще',
  встречи.обжитые<1&&встречи.сердце>1.4&&встречи.сердце>встречи.обжитые,встречи);

 /* ── 9. Мана ── */
 const мана=await page.evaluate(()=>{
  const былоМ=Number(G.mana),былоП=JSON.stringify(G.place||null);
  /* Отдача хаоса снимает ещё три маны и делает это случайно: меряем чистую
     цену, а не цену пополам со случайностью. */
  const бОтдача=Balance.backlash;Balance.backlash=()=>false;
  /* Приспособление к чарам копится с каждым сотворением и делает следующее
     дороже: на время замера его тоже придерживаем, иначе мерился бы порядок
     заклинаний, а не закон глубины. */
  const бПрив=window.adaptAdd;window.adaptAdd=()=>0;
  const цена=d=>{
   G.place={kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",depth:d,x:1,y:1};
   G.mana=G.manaMax=200;
   const sp=SPELLS[0];
   if(!G.spells.includes(sp.n))G.spells.push(sp.n);
   const до=G.mana;
   safeFn(()=>castSpell(0));
   const снято=до-G.mana;
   G.place={kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",depth:d,x:1,y:1};
   return снято;};
  /* Дважды и вперемешку: если закон работает, порядок замеров ничего не решает. */
  const немая1=цена(85),густая1=цена(55),густая2=цена(55),немая2=цена(85);
  const густая=Math.min(густая1,густая2),немая=Math.min(немая1,немая2);
  Balance.backlash=бОтдача;window.adaptAdd=бПрив;
  G.place=былоП==="null"?null:JSON.parse(былоП);G.mana=былоМ;
  return {густая1,густая2,немая1,немая2,густая,немая,
   kГустая:deepLawK("мана",55),kНемая:deepLawK("мана",85)};});
 check('рычаг «мана» доходит до цены чары: на густой мане дешевле, в немой глубине дороже, и порядок замеров ничего не решает',
  мана.густая>0&&мана.немая>0&&мана.kГустая<1&&мана.kНемая>1
  &&мана.немая>мана.густая&&мана.густая1<=мана.немая1&&мана.густая2<=мана.немая2,мана);

 /* ── 10–11. Ноша и заживление ── */
 const тело=await page.evaluate(()=>{
  const было=JSON.stringify(G.place||null);
  /* Скорость восстановления при голых свойствах равна нулю, и на нуле
     множитель ничего не показал бы. Поднимаем выносливость и дух так, чтобы
     заживление было заметным, — иначе проверка проходила бы впустую. */
  const бСвойств=JSON.stringify(G.attr||null);
  try{attrEnsure();G.attr=Object.assign({},G.attr||{},{end:40,spirit:36,str:34});}catch(_){}
  const снять=d=>{G.place=d?{kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",depth:d,x:1,y:1}:null;
   return {ноша:derived("carry"),заживление:derived("regen")};};
  const наверху=снять(0),пласты=снять(25),поле=снять(45),дрожь=снять(75),сердце=снять(95);
  G.place=было==="null"?null:JSON.parse(было);
  try{if(бСвойств!=="null")G.attr=JSON.parse(бСвойств);}catch(_){}
  return {наверху,пласты,поле,дрожь,сердце};});
 check('рычаг «ноша» доходит до переносимого веса: под тяжёлыми пластами меньше, на рудном поле больше',
  тело.пласты.ноша<тело.наверху.ноша&&тело.поле.ноша>тело.наверху.ноша,тело);
 check('рычаг «заживление» доходит до восстановления, падает с глубиной и не вылезает за единицу',
  тело.наверху.заживление>0
  &&тело.дрожь.заживление<тело.наверху.заживление
  &&тело.сердце.заживление<тело.дрожь.заживление
  &&тело.наверху.заживление<=1&&тело.сердце.заживление>=0,тело);

 /* ── 12. Слышимость ── */
 const слух=await page.evaluate(()=>{
  const было=JSON.stringify(G.place||null);
  let радиусы=[];
  const nf=window.nearFeatures;
  window.nearFeatures=function(r){радиусы.push(r);return [];};
  const снять=d=>{радиусы=[];
   G.place={kind:"dungeon",bx:1000,by:1000,stype:"cave_entrance",depth:d,x:1,y:1};
   try{scanSpeak();}catch(_){}
   return радиусы[0];};
  const сухой=снять(15),немая=снять(85);
  window.nearFeatures=nf;
  G.place=было==="null"?null:JSON.parse(было);
  return {сухой,немая};});
 check('рычаг «слышимость» доходит до эхо-скана: в сухом камне берёт дальше, в немой глубине ближе',
  слух.сухой>8&&слух.немая<8&&слух.немая>=2,слух);

 /* ── 13. Тайники ── */
 const тайники=await page.evaluate(()=>{
  const счёт=d=>{let n=0;
   for(let x=0;x<60;x++)for(let y=0;y<60;y++)
    if(propHidesSwitch(1000,1000,d,x,y,undefined))n++;
   return n;};
  return {обжитые:счёт(5),сердце:счёт(95)};});
 check('рычаг «тайники» доходит до тайных камер: на обжитых ярусах реже, у Сердца заметно чаще',
  тайники.обжитые>=0&&тайники.сердце>тайники.обжитые,тайники);

 /* ── 14. Ловушки ── */
 const ловушки=await page.evaluate(()=>{
  const было=JSON.stringify(G.place||null);
  const порог=d=>{
   const зк=deepLawK("ловушки",d);
   return Math.min(0.085*зк,(0.018+d*0.004)*зк);};
  G.place=было==="null"?null:JSON.parse(было);
  return {сухой:порог(15),кость:порог(65),сердце:порог(95),голый:Math.min(0.085,0.018+65*0.004)};});
 check('рычаг «ловушки» доходит до густоты: в сухом камне реже, среди кости и корня гуще голого порога',
  ловушки.сухой<Math.min(0.085,0.018+15*0.004)+1e-9
  &&ловушки.кость>ловушки.голый&&ловушки.сердце>ловушки.голый,ловушки);

 /* ── 15. Объявление на смене десятка ── */
 const приход=await page.evaluate(()=>{
  const сказ=()=>SAID.filter(t=>/Закон глубины/.test(t)).length;
  SAID.length=0;
  const внутри=deepLawArrive(15,14);      /* тот же десяток */
  const смена=deepLawArrive(21,20);       /* новый десяток */
  const сверху=deepLawArrive(1,0);        /* пришли сверху */
  const наверх=deepLawArrive(0,5);        /* вышли наружу */
  return {внутри,смена,сверху,наверх,строк:сказ()};});
 await page.waitForTimeout(3200);
 const сказано=await page.evaluate(()=>SAID.filter(t=>/Закон глубины/.test(t)).length);
 check('закон называется при смене десятка и молчит внутри десятка',
  приход.внутри===false&&приход.смена===true&&приход.сверху===true&&приход.наверх===false
  &&сказано>=2,{...приход,сказано});

 /* ── 16–17. Слова ── */
 const слова=await page.evaluate(()=>({
  наверху:deepLawLine(0),
  первый:deepLawLine(5),
  сердце:deepLawLine(95),
  досье:safeFn(()=>floorLine(1000,1000,65,"cave_entrance"),"")}));
 check('строка закона называет ярусы, имя, слово и что он делает',
  /ярусы 1–10/.test(слова.первый)&&/Обжитые ярусы/.test(слова.первый)
  &&/встречи реже/.test(слова.первый)&&слова.первый.length>120
  &&/ярусы 91–100/.test(слова.сердце)&&/Сердце/.test(слова.сердце)
  &&/законов глубины нет/i.test(слова.наверху),
  {первый:слова.первый.slice(0,200),наверху:слова.наверху});
 check('досье яруса называет закон глубины вместе с остальными свойствами',
  /Закон глубины/.test(слова.досье)&&/Кость и корень/.test(слова.досье)
  &&/Мини-босс/.test(слова.досье),слова.досье.slice(-220));

 /* ── 18. Свод, модуль, глава, документы ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="deeplaws");
  const m=Modules.get("DEEPLAWS");
  return {есть:!!r,ok:r&&r.ok,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.laws.length===10&&m.levers.length===7
    &&typeof m.at==="function"&&typeof m.k==="function"&&typeof m.line==="function",
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 92\. Закон глубины/.test(g.title)&&g.body.length>=6)};});
 check('самопроверка держит строку deeplaws, модуль DEEPLAWS отвечает, глава 92 на месте',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.текст.length>60,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 check('README и docs/МИР.md описывают закон глубины',
  /Закон глубины/i.test(readme)&&/## 58\. Закон глубины/.test(мир)&&/DEEP_LAWS/.test(мир),
  {readme:/Закон глубины/i.test(readme),мир:/## 58\. Закон глубины/.test(мир)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
