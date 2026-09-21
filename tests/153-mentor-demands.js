/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 153: ЧЕГО ХОЧЕТ НАСТАВНИК (§22 мастер-промпта)

   Урок стоил золота и, со второй ступени, материалов. И всё: заплатил —
   научили. §22 перечисляет семь родов требования — деньги, репутация,
   ресурс, выполнение квеста, доказательство мастерства, принадлежность к
   фракции и определённая Грань — и отдельной строкой говорит: «некоторые
   учителя могут отказаться обучать».

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Родов семь, у каждого имя и слово; причин отказа наотрез не меньше
      шести, и все человеческие.
   2. Набор требований выводится, а не бросается: тот же наставник и то же
      ремесло дают тот же набор всегда.
   3. У разных наставников наборы разные, но плата есть у всех и больше
      четырёх требований не бывает.
   4. Чем выше ступень урока, тем больше спрашивают.
   5. Грань у каждого наставника своя и всегда настоящая.
   6. Каждое требование считается по-настоящему: даёшь недостающее — оно
      становится выполненным, и это видно в числах.
   7. Проверка ученика падает, пока хоть одно требование не выполнено, и
      называет ровно то, чего не хватает.
   8. Когда всё сошлось — урок идёт, и золото списывается.
   9. Отказ наотрез бывает, редок и не зависит от денег: с полной мошной
      он всё равно отказ.
  10. Отказ наотрез помечен отдельно от прочих — он и звучит иначе.
  11. Вражда народа отказывает и без этих семи.
  12. Список требований называется ДО просьбы, с числами и с тем, сколько
      у игрока уже есть.
  13. Самопроверка мира держит строку «teach»; модуль, глава, README, docs.
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

 /* ── 1. Состав ── */
 const состав=await page.evaluate(()=>({
  родов:TEACH_DEMANDS.length,уник:new Set(TEACH_DEMANDS.map(d=>d.id)).size,
  без:TEACH_DEMANDS.filter(d=>!(d.n&&d.о&&d.о.length>15)).map(d=>d.id),
  ид:TEACH_DEMANDS.map(d=>d.id),
  отказов:TEACH_REFUSALS.length,
  короткие:TEACH_REFUSALS.filter(r=>r.length<=25).length}));
 check('родов требования семь, у каждого имя и слово; причин отказа не меньше шести',
  состав.родов===7&&состав.уник===7&&состав.без.length===0
  &&состав.ид.join(",")==="gold,stock,rep,deed,proof,side,facet"
  &&состав.отказов>=6&&состав.короткие===0,состав);

 /* ── 2–5. Наборы ── */
 const наборы=await page.evaluate(()=>{
  const c=findCities(900,900,60,3)[0];
  /* Вложенный обход по трём слоям на клетку: полосой набиралось пять
     наставников вместо шестнадцати, и проверка мерила выборку, а не мир. */
  const карта=new Map();
  for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++)for(let k=0;k<3;k++){
   const n=getNPC(c.x+dx,c.y+dy,k);
   if(n&&MAST_TEACH[n.prof])карта.set(n.key,n);}
  const люди=[...карта.values()];
  let нестойких=0,безПлаты=0,перебор=0,чужие=0;
  const виды=new Set();
  люди.forEach(n=>{
   const id=Object.keys(MAST_TEACH[n.prof])[0];
   const ур=MAST_TEACH[n.prof][id];
   const a=teachDemands(n,id,ур),b=teachDemands(n,id,ур);
   if(a.join()!==b.join())нестойких++;
   if(a.indexOf("gold")<0)безПлаты++;
   if(a.length>4)перебор++;
   if(a.some(d=>!TEACH_DEMAND_BY_ID[d]))чужие++;
   виды.add(a.join(","));});
  /* Чем выше ступень, тем больше спрашивают. */
  const n0=люди[0];const id0=Object.keys(MAST_TEACH[n0.prof])[0];
  const по=[1,2,3,4,5].map(у=>teachDemands(n0,id0,у).length);
  /* Грань у каждого своя и настоящая. */
  const грани=new Set(люди.map(n=>{
   const id=Object.keys(MAST_TEACH[n.prof])[0];
   const f=teachFacet(n,id);return f&&f.id;}));
  const чужаяГрань=[...грани].filter(g=>!FACET_BY_ID[g]);
  return {людей:люди.length,нестойких,безПлаты,перебор,чужие,
   видов:виды.size,примеры:[...виды].slice(0,5),
   поСтупеням:по,граней:грани.size,чужаяГрань};});
 check('набор требований выводится: тот же наставник и то же ремесло дают тот же набор',
  наборы.людей>=8&&наборы.нестойких===0,наборы);
 check('у разных наставников наборы разные, плата есть у всех, больше четырёх не бывает',
  наборы.видов>=3&&наборы.безПлаты===0&&наборы.перебор===0&&наборы.чужие===0,наборы);
 check('чем выше ступень урока, тем больше спрашивают',
  наборы.поСтупеням[4]>=наборы.поСтупеням[0],наборы.поСтупеням);
 check('Грань у каждого наставника своя и всегда настоящая',
  наборы.граней>=3&&наборы.чужаяГрань.length===0,наборы);

 /* ── 6–8. Требования считаются по-настоящему ── */
 const счёт=await page.evaluate(()=>{
  const c=findCities(900,900,60,3)[0];
  /* Берём наставника, который учит и не отказывает наотрез. */
  let n=null,id=null;
  искать: for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++)for(let k=0;k<3;k++){
   const x=getNPC(c.x+dx,c.y+dy,k);
   if(x&&MAST_TEACH[x.prof]&&!teachRefuses(x)){n=x;id=Object.keys(MAST_TEACH[x.prof])[0];break искать;}}
  if(!n)return {нет:true};
  const ур=MAST_TEACH[n.prof][id];
  /* Обнуляем всё, чего могут потребовать. */
  G.gold=0;G.rep={};G.deeds={};G.mast={};G.inv={};G.facets={};
  const до=teachAll(n,id,ур);
  const плата=до.find(x=>x.id==="gold");
  const малоДенег=Mentor.check(n,id);
  /* Даём золото — плата выполняется. */
  G.gold=100000;
  const после=teachAll(n,id,ур);
  const платаПосле=после.find(x=>x.id==="gold");
  /* Закрываем всё остальное, что можно закрыть числом. */
  addRep(n.race,20);
  G.deeds={quests:99};
  G.mast[id]={ур:0,оп:0,дел:99};
  Object.keys(MENTOR_MATERIALS[id]||{}).forEach(r=>{G.inv[r]=99;});
  const почти=Mentor.check(n,id);
  const остаток=(почти.невыполнено||[]);
  const было=Number(G.gold);
  const пошло=почти.ок?Mentor.ask(n,id):false;
  return {ремесло:id,ступень:ур,
   платаДо:!!(плата&&!плата.ок),платаПосле:!!(платаПосле&&платаПосле.ок),
   отказПоДеньгам:malo(малоДенег),
   остаток,ок:!!почти.ок,пошло,списано:было-Number(G.gold)};
  function malo(c){return !c.ок&&/урок стоит/.test(String(c.почему));}});
 check('каждое требование считается по-настоящему: без денег плата не выполнена, с деньгами выполнена',
  !счёт.нет&&счёт.платаДо&&счёт.платаПосле&&счёт.отказПоДеньгам,счёт);
 check('проверка называет ровно то, чего не хватает — остаются только требования, что числом не закрыть',
  !счёт.нет&&счёт.остаток.every(id=>["side","facet"].includes(id)),счёт);
 check('когда всё сошлось, урок идёт и золото списывается',
  !счёт.нет&&(счёт.ок?(счёт.пошло&&счёт.списано>0):счёт.остаток.length>0),счёт);

 /* ── 9–11. Отказы ── */
 const отказы=await page.evaluate(()=>{
  const c=findCities(900,900,60,3)[0];
  const карта=new Map();
  for(let dx=-12;dx<=12;dx++)for(let dy=-12;dy<=12;dy++)for(let k=0;k<3;k++){
   const n=getNPC(c.x+dx,c.y+dy,k);
   if(n&&MAST_TEACH[n.prof])карта.set(n.key,n);}
  const люди=[...карта.values()];
  const наотрез=люди.filter(n=>teachRefuses(n));
  /* Отказ не зависит от денег: с полной мошной он всё равно отказ. */
  G.gold=999999;G.rep={};G.deeds={quests:99};
  let сДеньгами=0,помечено=0;
  наотрез.forEach(n=>{
   const id=Object.keys(MAST_TEACH[n.prof])[0];
   addRep(n.race,20);
   const c2=Mentor.check(n,id);
   if(!c2.ок)сДеньгами++;
   if(c2.наотрез)помечено++;});
  /* Вражда народа отказывает и без семи родов. */
  const мир=люди.find(n=>!teachRefuses(n));
  let враждаОтказ=false;
  if(мир){G.rep={};addRep(мир.race,-20);
   const id=Object.keys(MAST_TEACH[мир.prof])[0];
   const c3=Mentor.check(мир,id);
   враждаОтказ=!c3.ок&&/враждебн/.test(String(c3.почему));}
  G.rep={};
  return {людей:люди.length,наотрез:наотрез.length,
   доля:люди.length?+(наотрез.length/люди.length).toFixed(2):0,
   сДеньгами,помечено,враждаОтказ,
   причины:[...new Set(наотрез.map(n=>teachRefuses(n)))].length};});
 check('отказ наотрез бывает, редок и не зависит от денег',
  отказы.людей>=15&&отказы.наотрез>0&&отказы.доля<0.45
  &&отказы.сДеньгами===отказы.наотрез,отказы);
 check('отказ наотрез помечен отдельно от прочих: он и звучит иначе',
  отказы.помечено===отказы.наотрез&&отказы.причины>=1,отказы);
 check('вражда народа отказывает и без этих семи',отказы.враждаОтказ,отказы);

 /* ── 12. Слышно до просьбы ── */
 const слово=await page.evaluate(()=>{
  const c=findCities(900,900,60,3)[0];
  let n=null,id=null;
  искать: for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++)for(let k=0;k<3;k++){
   const x=getNPC(c.x+dx,c.y+dy,k);
   if(x&&MAST_TEACH[x.prof]&&!teachRefuses(x)){n=x;id=Object.keys(MAST_TEACH[x.prof])[0];break искать;}}
  if(!n)return {нет:true};
  G.gold=0;G.rep={};G.deeds={};G.mast={};G.inv={};
  const t=Mentor.wants(n,id);
  /* И у того, кто не берётся, — своя фраза. */
  const отк=[];
  ищем: for(let dx=-12;dx<=12;dx++)for(let dy=-12;dy<=12;dy++)for(let k=0;k<3;k++){
   const x=getNPC(c.x+dx,c.y+dy,k);
   if(x&&MAST_TEACH[x.prof]&&teachRefuses(x)){отк.push(Mentor.wants(x,Object.keys(MAST_TEACH[x.prof])[0]));break ищем;}}
  return {текст:t,длина:t.length,
   естьЧисла:/\d/.test(t),естьПлата:/урок стоит/.test(t),
   естьЧего:/Чего он хочет/.test(t),естьИтог:/Не хватает|Всё сошлось/.test(t),
   отказТекст:отк[0]||"",отказЕсть:/не возьмётся учить вовсе/.test(отк[0]||"")};});
 check('список требований называется до просьбы, с числами и с итогом',
  !слово.нет&&слово.длина>60&&слово.естьЧисла&&слово.естьПлата
  &&слово.естьЧего&&слово.естьИтог,слово);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="teach");
  const гл=GUIDE.find(g=>/Чего хочет наставник/i.test(g.title));
  const M=Modules.get("MENTOR");
  return {строка:!!r,ок:r&&r.ok===true,
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!M,родов:M&&M.kinds?M.kinds.length:0,
   естьWants:!!(M&&typeof M.wants==="function"),
   естьRefuses:!!(M&&typeof M.refuses==="function"),
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «teach» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль MENTOR отдаёт роды требования, отказ и список «чего он хочет»',
  свод.модуль&&свод.родов===7&&свод.естьWants&&свод.естьRefuses,свод);
 check('в руководстве есть глава о требованиях наставника',свод.глава&&свод.строкГлавы>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о семи родах требования',
  /Чего хочет наставник/i.test(readme)&&/доказательство мастерства/i.test(readme)
  &&/открытая Грань/i.test(readme)&&/один из восьми/i.test(readme));
 check('docs/МИР.md держит устройство требований',
  /TEACH_DEMANDS/.test(mir)&&/teachRefuses/.test(mir)&&/teachFacet/.test(mir)
  &&/teachLine/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
