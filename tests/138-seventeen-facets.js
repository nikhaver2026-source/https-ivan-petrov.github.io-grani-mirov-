/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 138: СЕМНАДЦАТЬ ГРАНЕЙ, ДЕСЯТЬ СТАДИЙ (§3 мастер-промпта)

   Грань — не умение и не заклинание: это то, чем человек становится от
   того, что делает изо дня в день. §3 требует семнадцати Граней по десяти
   стадиям и — главное — чтобы переход НЕ БЫЛ покупкой за счётчик.

   Было восемь Граней по три ступени, и стадия бралась одним числом дел.
   Стало семнадцать по десяти, и у четвёртой, седьмой и десятой стоят
   врата: условие, которое числом не берётся.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Семнадцать Граней, десять стадий; у каждой Грани все десять порогов,
      эффектов и множителей, и настоящая запись из банка.
   2. Пороги растут; ни одна стадия не даётся даром.
   3. Врата стоят у четвёртой, седьмой и десятой, и все три настоящие.
   4. ВРАТА ДЕРЖАТ: со ста тысячами дел и без условия — третья стадия.
      Закрыли врата — стадия пошла дальше.
   5. Игра называет, какие именно врата держат.
   6. Прежние восемь Граней сохранили свои первые три порога и множителя.
   7. §38: каждая из девяти новых Граней ВПРАВДУ что-то меняет в мире.
   8. Ночное око работает ночью и молчит днём; Городское чутьё — в городе
      и молчит в глуши.
   9. Пустотный якорь снимает тяжесть аномалии, а на мировой форме гасит
      аномалию совсем.
  10. У каждой Грани названы предел, синергия и обратная сторона.
  11. Новая стадия объявляется своим именем, со звуком и в летописи.
  12. Самопроверка мира держит строку «facets»; глава, README и docs.
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
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(String(r));return bp(r,o);};
  window.__jt=[];const j=window.journal;window.journal=t=>{__jt.push(String(t));return j(t);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1–3. состав, пороги, врата ── */
 const состав=await page.evaluate(()=>({
  граней:FACETS.length,стадий:FACET_STAGES.length,
  уник:new Set(FACETS.map(f=>f.id)).size,
  неполные:FACETS.filter(f=>!(f.пороги.length===10&&f.эффект.length===10&&f.k.length===10)).map(f=>f.id),
  безЗвука:FACETS.filter(f=>!SOUND_BANK[f.звук]).map(f=>f.id),
  безСлов:FACETS.filter(f=>!f.n||!f.о||!f.условие||!f.предел||!f.синергия||!f.минус).map(f=>f.id),
  несчитают:FACETS.filter(f=>typeof f.сч!=="function").map(f=>f.id),
  порогиНеРастут:FACETS.filter(f=>!f.пороги.every((v,i)=>i===0?v>0:v>f.пороги[i-1])).map(f=>f.id),
  безВрат:FACETS.filter(f=>!f.врата||![4,7,10].every(с=>f.врата[с]&&f.врата[с].что&&typeof f.врата[с].есть==="function")).map(f=>f.id),
  первая:FACET_STAGES[0].n,последняя:FACET_STAGES[9].n,
  стадииСлова:FACET_STAGES.every(s=>s.n&&s.о),
  пустыеЭффекты:FACETS.filter(f=>f.эффект.some(e=>!e||e.length<5)).map(f=>f.id)}));
 check('семнадцать Граней и десять стадий, без повторов',
  состав.граней===17&&состав.стадий===10&&состав.уник===17,состав);
 check('у каждой Грани все десять порогов, эффектов и множителей',
  состав.неполные.length===0&&состав.пустыеЭффекты.length===0,состав);
 check('у каждой Грани настоящая запись, свои слова и свой счёт дел',
  состав.безЗвука.length===0&&состав.безСлов.length===0&&состав.несчитают.length===0,состав);
 check('пороги растут: ни одна стадия не даётся даром',
  состав.порогиНеРастут.length===0,состав.порогиНеРастут);
 check('у всех семнадцати стоят врата четвёртой, седьмой и десятой стадии',
  состав.безВрат.length===0,состав.безВрат);
 check('десять стадий названы: от Пробуждения до Мировой формы',
  состав.первая==="Пробуждение"&&состав.последняя==="Мировая форма"&&состав.стадииСлова,состав);

 /* ── 4–5. врата держат, и о них говорят ── */
 const врата=await page.evaluate(()=>{
  const было=G.deeds;
  const o={};
  G.deeds={steps:100000};G.facetTiers={};
  o.толькоДела=Path.facetTier("quiet");
  const g=Path.facetGate("quiet");
  o.держат=g?g.стадия:null;o.что=g?g.что:"";
  o.текст=Path.facetText(FACET_BY_ID.quiet);
  G.deeds={steps:100000,regions:3};
  o.после4=Path.facetTier("quiet");
  G.deeds={steps:100000,regions:3,hides:40};
  o.после7=Path.facetTier("quiet");
  G.deeds={steps:100000,regions:3,hides:40,ashSteps:300};
  o.после10=Path.facetTier("quiet");
  o.стадия=(Path.facetStage("quiet")||{}).n;
  o.свободно=Path.facetGate("quiet");
  G.deeds=было;
  return o;});
 check('врата держат: сто тысяч шагов без трёх областей — третья стадия',
  врата.толькоДела===3&&врата.держат===4,врата);
 check('закрыли врата — стадия пошла дальше, и все десять берутся',
  врата.после4===6&&врата.после7===9&&врата.после10===10
  &&врата.стадия==="Мировая форма"&&врата.свободно===null,врата);
 check('игра называет, какие именно врата держат',
  /Врата 4-й стадии: побывать в трёх областях/.test(врата.текст)
  &&/Стадия 3 из десяти/.test(врата.текст),врата.текст.slice(0,200));

 /* ── 6. прежние восемь не сдвинулись на первых трёх ── */
 const прежние=await page.evaluate(()=>{
  const ждём={quiet:[[80,400,1500],[0.2,0.33,0.5]],stone:[[6,20,50],[1,2,3]],
   deep:[[5,20,60],[1,2,3]],blade:[[40,200,800],[1,2,3]],
   tongue:[[8,30,80],[1.5,2,3]],rift:[[6,24,60],[2,6,8]],loot:[[30,150,500],[1,2,3]]};
  const сдвинулись=[];
  Object.keys(ждём).forEach(id=>{const f=FACET_BY_ID[id];if(!f){сдвинулись.push(id+": нет");return;}
   const [п,k]=ждём[id];
   if(String(f.пороги.slice(0,3))!==String(п))сдвинулись.push(id+" пороги "+f.пороги.slice(0,3));
   if(String(f.k.slice(0,3))!==String(k))сдвинулись.push(id+" k "+f.k.slice(0,3));});
  return {сдвинулись,ashK:FACET_BY_ID.ash.k.slice(0,3),ashПредел:FACET_BY_ID.ash.k[9]};});
 check('семь прежних Граней сохранили свои первые три порога и множителя',
  прежние.сдвинулись.length===0,прежние.сдвинулись);
 check('пепельное дыхание пересчитано честно: полная неуязвимость только на мировой форме',
  прежние.ashК!==undefined||(прежние.ashПредел===1&&прежние.ashK[2]<1),прежние);

 /* ── 7. §38: девять новых вправду меняют мир ── */
 const крючки=await page.evaluate(()=>{
  const было=G.deeds,место=G.place,час=G.hour;
  const o={};
  const пусто=()=>{G.deeds={};G.facetTiers={};};
  /* звериный слух */
  пусто();o.beast0=beastRad();
  G.deeds={kills:5000,tracks:5000,devours:5,regions:9};o.beast1=beastRad();
  /* водное дыхание */
  пусто();o.breath0=breathTacts();
  G.deeds={dives:2000,legs:2000,places:200};o.breath1=breathTacts();
  /* торговая чуйка */
  пусто();o.цена0=sellPrice("руда",0,10,null);
  G.deeds={trades:5000,deals:5000,persuade:50,regions:9,repGains:20};o.цена1=sellPrice("руда",0,10,null);
  /* рука мастера */
  const t0=TECHS[0];
  пусто();o.риск0=techRisk(t0);
  G.deeds={works:5000,tools:5000,leather:5000};o.риск1=techRisk(t0);
  /* живая кровь */
  пусто();o.heal0=Path.facetK("heal");
  G.deeds={meals:5000,drinks:5000,focus:5000,rites:30};o.heal1=Path.facetK("heal");
  /* чуткость к знамениям */
  пусто();o.omen0=Path.facetK("omen");
  G.deeds={rites:5000,weathers:5000,festivals:5000,sigils:60};o.omen1=Path.facetK("omen");
  G.deeds=было;G.place=место;G.hour=час;
  return o;});
 check('звериный слух вправду раздвигает круг, в котором слышно живое',
  крючки.beast1>крючки.beast0&&крючки.beast0===8,крючки);
 check('водное дыхание вправду добавляет тактов под водой',
  крючки.breath1>крючки.breath0,крючки);
 check('торговая чуйка вправду поднимает выручку',крючки.цена1>крючки.цена0,крючки);
 check('рука мастера вправду снижает срыв работы',крючки.риск1<крючки.риск0,крючки);
 check('живая кровь и чуткость к знамениям вправду растут с делами',
  крючки.heal1>крючки.heal0&&крючки.omen1>крючки.omen0,крючки);

 /* ── 8. ночь и город: там, где положено, и нигде больше ── */
 const место=await page.evaluate(()=>{
  const было={deeds:G.deeds,place:G.place,hour:G.hour};
  const o={};
  G.place=null;G.facetTiers={};
  G.deeds={};G.hour=23;o.ночьБез=scapeRad();
  G.deeds={hides:5000,camps:5000,forests:20};o.ночьС=scapeRad();
  G.hour=12;o.деньС=scapeRad();
  G.place={kind:"city",bx:1,by:1,stype:"castle",depth:0,x:2,y:2};
  G.deeds={};o.городБез=scapeRad();
  G.deeds={places:5000,houses:5000,quests:5000,regions:9};o.городС=scapeRad();
  G.place=null;o.глушьС=scapeRad();
  G.deeds=было.deeds;G.place=было.place;G.hour=было.hour;
  return o;});
 check('ночное око раздвигает картину ночью и молчит днём',
  место.ночьС>место.ночьБез&&место.деньС===место.ночьБез,место);
 check('городское чутьё раздвигает картину в городе и молчит в глуши',
  место.городС>место.городБез&&место.глушьС<место.городС,место);

 /* ── 9. пустотный якорь ── */
 const пустота=await page.evaluate(()=>{
  const было={deeds:G.deeds,place:G.place};
  const o={};
  G.facetTiers={};G.buffs={};
  /* найти ярус с аномалией тяжести, а если нет — с любой */
  let тяж=0,любая=0;
  for(let d=1;d<=80;d++){G.place={bx:120,by:120,depth:d,x:5,y:5,stype:"ruins",kind:"dungeon"};
   G.deeds={};
   const a=anomalyHere();
   if(a&&!любая)любая=d;
   if(a&&a.id==="gravity"&&!тяж)тяж=d;
   if(тяж&&любая)break;}
  o.ярусТяжести=тяж;o.ярусЛюбой=любая;
  if(тяж){G.place={bx:120,by:120,depth:тяж,x:5,y:5,stype:"ruins",kind:"dungeon"};
   G.deeds={};o.защБез=def();
   G.deeds={unweave:5000,devours:5000,imprints:5000};o.kСредний=Path.facetK("void");
   o.защС=def();}
  if(любая){G.place={bx:120,by:120,depth:любая,x:5,y:5,stype:"ruins",kind:"dungeon"};
   G.deeds={};o.аномалияБыла=!!anomalyHere();
   /* мировая форма: закрыты и врата сотого яруса */
   G.deeds={unweave:5000,devours:5000,imprints:5000};G.deepBest=100;
   o.kПолный=Path.facetK("void");
   o.аномалияПосле=!!anomalyHere();
   delete G.deepBest;}
  G.deeds=было.deeds;G.place=было.place;
  return o;});
 check('на мировой форме пустотный якорь гасит аномалию яруса совсем',
  пустота.ярусЛюбой>0&&пустота.аномалияБыла===true
  &&пустота.kПолный===1&&пустота.аномалияПосле===false,пустота);
 check('на половине пустотный якорь снимает тяжесть аномалии',
  !пустота.ярусТяжести||(пустота.kСредний>=0.5&&пустота.защС>пустота.защБез),пустота);

 /* ── 10–11. слова о Грани и объявление стадии ── */
 const слова=await page.evaluate(async()=>{
  const было=G.deeds;
  G.deeds={};G.facetTiers={};
  __said.length=0;__played.length=0;__jt.length=0;
  G.deeds={kills:20,tracks:10};
  Path.facetTick();
  const o={сказано:__said.find(t=>/Грань «Звериный слух»/.test(t))||"",
   звук:__played.includes("beast_growl"),
   летопись:__jt.some(t=>/Грань: Звериный слух/.test(t))};
  __said.length=0;Path.facetTick();
  o.повтор=__said.some(t=>/Грань «Звериный слух»/.test(t));
  o.тексты=FACETS.map(f=>Path.facetText(f));
  o.безПредела=o.тексты.filter(t=>!/Предел:/.test(t)||!/Синергия:/.test(t)||!/Обратная сторона:/.test(t)).length;
  G.deeds=было;
  return o;});
 check('новая стадия объявляется своим именем, со звуком и в летописи',
  /стадия 1 из десяти — Пробуждение/.test(слова.сказано)&&слова.звук&&слова.летопись
  &&!слова.повтор,{сказано:слова.сказано.slice(0,120),звук:слова.звук,повтор:слова.повтор});
 check('у каждой из семнадцати названы предел, синергия и обратная сторона',
  слова.безПредела===0,слова.безПредела);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Семнадцать Граней/i.test(g.title));
  return {f:r.find(x=>x.id==="facets"),p:r.find(x=>x.id==="path"),
   плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «facets»',
  !!свод.f&&свод.f.ok===true,свод.f);
 check('прежняя строка «path» тоже зелёная: семнадцать Граней её не сломали',
  !!свод.p&&свод.p.ok===true,свод.p);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о семнадцати Гранях',свод.глава&&свод.строк>=7,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о десяти стадиях и о вратах',
  /Семнадцать Граней/i.test(readme)&&/Мировая форма/.test(readme)
  &&/Врата вместо счётчика/i.test(readme));
 check('docs/МИР.md держит таблицу девяти новых Граней и правило врат',
  /FACET_STAGES/.test(mir)&&/facetGate/.test(mir)&&/beastRad/.test(mir)
  &&/breathTacts/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
