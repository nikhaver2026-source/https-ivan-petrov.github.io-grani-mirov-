/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 149: СЕМЬ РЫНКОВ И ПОХОДНЫЙ ЛАГЕРЬ (§14 мастер-промпта)

   §14 требует локального рынка: «цена одного предмета может отличаться в
   деревне, городе, столице, пограничной крепости, военном лагере,
   подземелье и торговом порту».

   Цена в игре считалась по двум десяткам множителей — держава, эпоха,
   война, погода, сезон, дороги, законы, Дома, боги, разбитые переделы, —
   и ни один из них не спрашивал, ГДЕ стоит игрок. Седьмого места —
   военного лагеря — не было вовсе.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Родов рынка семь, у каждого свои числа в берегах, свой голос
      настоящей записью и свои товары из настоящих ресурсов мира.
   2. Городской рынок — ровно единица по всем трём числам: с ним и
      сравнивают остальные.
   3. Род выводится из места: постройка, столица, город, поле; глубина
      сильнее места.
   4. Один и тот же товар стоит в семи местах по-разному, и порядок цен
      осмысленный: подземный торг дороже деревенского.
   5. Дорогое здесь дороже, дешёвое здесь дешевле — и это именно те
      товары, что записаны у рода.
   6. Множители всегда в берегах, при любом товаре и в любом месте.
   7. Вечных денег нет ни в одном из семи: за товар не платят больше,
      чем за него же просят, — при трёх мерах мира и трёх уровнях дружбы.
   8. Объяснение цены называет род прилавка.
   9. Ширина прилавка разная: в столице и порту больше, чем в лагере.
  10. Походный лагерь стоит в мире: у тракта, но не на нём, не в городе.
  11. В лагере четверо, у каждого записанный голос; обстановка настоящая.
  12. У лагеря своя акустика, и все её записи настоящие, без синтеза.
  13. Самопроверка мира держит строку «markets»; модуль, глава, README,
      docs.
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

 /* ── 1–2. Состав ── */
 const состав=await page.evaluate(()=>{
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const плохие=[],синт=[],чужие=[];
  MARKET_KINDS.forEach(m=>{
   if(!(m.n&&m.о&&m.куп>=0.8&&m.куп<=1.4&&m.прод>=0.8&&m.прод<=1.4&&m.выбор>0&&m.выбор<=1.5))плохие.push(m.id);
   if(синтез(m.звук))синт.push(m.id);
   (m.дорого||[]).concat(m.дёшево||[]).forEach(r=>{if(RES_BASE[r]===undefined)чужие.push(m.id+":"+r);});
   /* Один и тот же товар не может быть и дорогим, и дешёвым разом. */
   (m.дорого||[]).forEach(r=>{if((m.дёшево||[]).includes(r))плохие.push(m.id+":"+r+" и там и там");});});
  return {всего:MARKET_KINDS.length,уник:new Set(MARKET_KINDS.map(m=>m.id)).size,
   плохие,синт,чужие,
   ид:MARKET_KINDS.map(m=>m.id),
   город:[MARKET_BY_ID.city.куп,MARKET_BY_ID.city.прод,MARKET_BY_ID.city.выбор]};});
 check('родов рынка семь, у каждого свои числа, свои товары и своя настоящая запись голоса',
  состав.всего===7&&состав.уник===7&&состав.плохие.length===0
  &&состав.синт.length===0&&состав.чужие.length===0
  &&состав.ид.join(",")==="village,city,capital,border,warcamp,deep,port",состав);
 check('городской рынок — ровно единица: с ним и сравнивают остальные',
  состав.город.join(",")==="1,1,1",состав.город);

 /* ── 3. Род по месту ── */
 const место=await page.evaluate(()=>{
  const было={x:G.x,y:G.y,place:G.place,ship:G.ship};
  const r={};
  G.ship=null;
  G.place={stype:"village",depth:0};r.деревня=marketKindHere().id;
  G.place={stype:"castle",depth:0};r.столица=marketKindHere().id;
  G.place={stype:"fortress",depth:0};r.крепость=marketKindHere().id;
  G.place={stype:"warcamp",depth:0};r.лагерь=marketKindHere().id;
  G.place={stype:"port",depth:0};r.порт=marketKindHere().id;
  /* Глубина сильнее места: под таверной торгуют по-подземному. */
  G.place={stype:"tavern",depth:4};r.подЗемлёй=marketKindHere().id;
  G.place={stype:"port",depth:7};r.портГлубже=marketKindHere().id;
  /* В столице державы без постройки — столичный ряд. */
  G.place=null;G.x=EMPIRES[0].cap.x;G.y=EMPIRES[0].cap.y;r.наСтолице=marketKindHere().id;
  /* В чистом поле — деревенский торг. */
  G.x=было.x;G.y=было.y;r.поле=marketKindHere().id;
  G.place=было.place;G.ship=было.ship;
  return r;});
 check('род рынка выводится из места, и глубина сильнее места',
  место.деревня==="village"&&место.столица==="capital"&&место.крепость==="border"
  &&место.лагерь==="warcamp"&&место.порт==="port"
  &&место.подЗемлёй==="deep"&&место.портГлубже==="deep"
  &&место.наСтолице==="capital"&&место.поле==="village",место);

 /* ── 4–6. Цена, товары и берега ── */
 const цены=await page.evaluate(()=>{
  const МЕСТА={village:{stype:"village",depth:0},city:null,capital:{stype:"castle",depth:0},
   border:{stype:"fortress",depth:0},warcamp:{stype:"warcamp",depth:0},
   deep:{stype:"tavern",depth:6},port:{stype:"port",depth:0}};
  const idx=empireIndexAt(G.x,G.y);
  const было=G.place;
  const ряд={};
  Object.keys(МЕСТА).forEach(k=>{G.place=МЕСТА[k];
   ряд[k]=marketPrice("руда",idx,G.day);});
  /* Дорогое здесь — дороже, дешёвое здесь — дешевле, и это записанные товары. */
  const проба=[];
  MARKET_KINDS.forEach(m=>{
   const g1=(m.дорого||[]).map(r=>marketGoodK(r,m));
   const g2=(m.дёшево||[]).map(r=>marketGoodK(r,m));
   if(g1.some(v=>v<=1)||g2.some(v=>v>=1))проба.push(m.id);});
  /* Берега при любом товаре и в любом месте. */
  const вне=[];
  Object.keys(МЕСТА).forEach(k=>{G.place=МЕСТА[k];
   Object.keys(RES_BASE).forEach(res=>{
    const a=marketKindK(res),b=marketKindSellK(res);
    if(!(a>=0.7&&a<=1.6&&b>=0.8&&b<=1.4))вне.push([k,res,a,b]);});});
  G.place=было;
  const разных=new Set(Object.values(ряд)).size;
  return {ряд,разных,проба,вне:вне.slice(0,4),внеВсего:вне.length};});
 check('один и тот же товар стоит в семи местах по-разному, и подземный торг дороже деревенского',
  цены.разных>=5&&цены.ряд.deep>цены.ряд.village&&цены.ряд.border>цены.ряд.city
  &&цены.ряд.village<цены.ряд.capital,цены.ряд);
 check('дорогое здесь дороже, дешёвое здесь дешевле — ровно те товары, что записаны',
  цены.проба.length===0,цены.проба);
 check('множители в берегах при любом товаре и в любом месте',
  цены.внеВсего===0,цены.вне);

 /* ── 7. Вечных денег нет ── */
 const петли=await page.evaluate(()=>{
  const МЕСТА={village:{stype:"village",depth:0},city:null,capital:{stype:"castle",depth:0},
   border:{stype:"fortress",depth:0},warcamp:{stype:"warcamp",depth:0},
   deep:{stype:"tavern",depth:5},port:{stype:"port",depth:0}};
  const ТОВАРЫ=["руда","трава","кость","кристалл","треска","закалённый клинок",
   "самоцвет","шкура","дерево","полотно","слиток","грибы","ягоды","камень"];
  const c=findCities(900,900,60,3)[0];
  const n=c?getNPC(c.x,c.y,0,"Торговец"):{x:G.x,y:G.y,race:"human"};
  const bad=[];let проверено=0;
  for(const ур of ["calm","normal","harsh"]){
   setDifficulty(ур);
   for(const rep of [20,0,-6]){
    G.rep={};addRep(n.race,rep);
    Object.keys(МЕСТА).forEach(k=>{
     G.place=МЕСТА[k];
     ТОВАРЫ.forEach(res=>{проверено++;
      const куп=npcAsk(n,res),прод=sellUnit(n,res);
      if(прод>=куп)bad.push([ур,rep,k,res,куп,прод]);});
     /* И весь прилавок целиком, как в наборе 25. */
     for(const st of stockFor(n)){if(!st.res)continue;проверено++;
      if(sellUnit(n,st.n)>=st.price)bad.push([ур,rep,k,st.n,st.price,sellUnit(n,st.n)]);}});}}
  setDifficulty("normal");G.rep={};G.place=null;
  return {проверено,bad:bad.slice(0,4),всего:bad.length};});
 check('вечных денег нет ни в одном из семи рынков, при любой мере мира и дружбе',
  петли.всего===0&&петли.проверено>500,петли);

 /* ── 8–9. Слова и ширина ── */
 const слова=await page.evaluate(()=>{
  const было=G.place;
  G.place={stype:"warcamp",depth:0};
  const почему=String(priceWhy("трава",empireIndexAt(G.x,G.y),null)||"");
  const строка=Markets.line();
  const текст=Markets.text();
  const ш={};MARKET_KINDS.forEach(m=>{ш[m.id]=m.выбор;});
  G.place={stype:"castle",depth:0};const шСтолица=marketWidth();
  G.place={stype:"warcamp",depth:0};const шЛагерь=marketWidth();
  G.place=было;
  return {почему:почему.slice(0,200),строка:строка.slice(0,120),
   есть:/походный лагерь/i.test(почему),текст:текст.slice(0,120),
   шСтолица,шЛагерь,ш};});
 check('объяснение цены называет род прилавка',
  слова.есть&&/лагерь/i.test(слова.строка),слова);
 check('ширина прилавка разная: в столице шире, чем в лагере',
  слова.шСтолица>1&&слова.шЛагерь<1&&слова.шСтолица>слова.шЛагерь,слова);

 /* ── 10. Лагерь стоит в мире ── */
 const лагерь=await page.evaluate(()=>{
  let найдено=0,плохих=0,пример=null,имена=new Set();
  for(let i=0;i<60000&&найдено<12;i++){
   const x=3000+(i%400)*3,y=3000+Math.floor(i/400)*3;
   if(!warCampAt(x,y))continue;
   найдено++;
   /* У тракта, но не на нём, и не в городе. */
   if(roadAt(x,y)||isCityAt(x,y)||!roadNear(x,y,2))плохих++;
   const c=cellContent(x,y);
   if(!c.structure||c.structure.type!=="warcamp")плохих++;
   else{имена.add(c.structure.name);if(!пример)пример={x,y,n:c.structure.name,b:c.structure.beacon};}}
  /* Одно и то же место всегда одно и то же. */
  const стойко=пример?warCampAt(пример.x,пример.y)&&cellContent(пример.x,пример.y).structure.name===пример.n:false;
  return {найдено,плохих,имён:имена.size,пример,стойко,
   всегоИмён:WARCAMP_NAMES.length,вид:PLACE_KIND.warcamp};});
 check('походный лагерь стоит в мире: у тракта, но не на нём, не в городе, и всегда на своём месте',
  лагерь.найдено>=6&&лагерь.плохих===0&&лагерь.стойко
  &&лагерь.вид==="house"&&лагерь.всегоИмён>=8&&лагерь.имён>=2,лагерь);

 /* ── 11–12. Люди, вещи и голос лагеря ── */
 const жизнь=await page.evaluate(()=>{
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const профы=PROFS.warcamp||[];
  const вещи=PROPS_BY_PLACE.warcamp||[];
  const ак=AMBIENCE_SET.warcamp;
  const было=G.place;
  G.place={stype:"warcamp",depth:0};
  const набор=ambienceSetFor();
  G.place=было;
  return {профы,безГолоса:профы.filter(p=>!VOICE_PROFS[p]),
   вещей:вещи.length,чужие:вещи.filter(id=>!PROP_BY_ID[id]),
   акустика:!!ак,пятен:ак?ак.spots.length:0,
   синт:ак?ак.spots.filter(([r])=>синтез(r)).map(([r])=>r):["нет набора"],
   ночь:!!(ак&&ак.night&&ак.night.length),набор};});
 check('в лагере четверо, у каждого записанный голос, и обстановка настоящая',
  жизнь.профы.length===4&&жизнь.безГолоса.length===0
  &&жизнь.вещей>=8&&жизнь.чужие.length===0,жизнь);
 check('у лагеря своя акустика, и все её записи настоящие, без синтеза',
  жизнь.акустика&&жизнь.пятен>=10&&жизнь.синт.length===0
  &&жизнь.ночь&&жизнь.набор==="warcamp",жизнь);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="markets");
  const гл=GUIDE.find(g=>/Семь рынков/i.test(g.title));
  return {строка:!!r,ок:r&&r.ok===true,
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:Modules.has("MARKETS"),родов:Modules.get("MARKETS").kinds.length,
   текст:String(Modules.get("MARKETS").text()).slice(0,80),
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «markets» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль MARKETS зарегистрирован и отвечает',
  свод.модуль===true&&свод.родов===7&&свод.текст.length>20,свод);
 check('в руководстве есть глава о семи рынках',свод.глава&&свод.строкГлавы>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о семи рынках и лагере',
  /Семь рынков/i.test(readme)&&/походный лагерь/i.test(readme)
  &&/подземный торг/i.test(readme)&&/столичный ряд/i.test(readme));
 check('docs/МИР.md держит устройство рынков',
  /MARKET_KINDS/.test(mir)&&/marketKindHere/.test(mir)&&/marketKindSellK/.test(mir)
  &&/warCampAt/.test(mir)&&/MARKETS/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
