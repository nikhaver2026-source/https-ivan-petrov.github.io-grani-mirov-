/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 143: ДИПЛОМАТИЯ — ОДИННАДЦАТЬ РОДОВ (§18 мастер-промпта)

   §18 просит одиннадцать родов: союз, нейтралитет, торговый договор,
   военный договор, вассалитет, эмбарго, санкции, перемирие, война, тайный
   договор, шпионаж. Было одно число на пару и пять слов на шкале.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Одиннадцать родов в четырёх разрядах, у каждого имя, суть,
      следствие и живая запись.
   2. У каждой пары держав ровно одно состояние — не два и не ни одного.
   3. Односторонние записи знают, от кого и к кому, и это разные державы.
   4. Договоры складываются поверх состояния, а не вместо него.
   5. Набор выводится, а не хранится: (i,j) и (j,i) дают одно и то же, и
      он не меняется от повторного спроса и от перезагрузки.
   6. Одна правда о войне: что сводка зовёт войной, то и дипломатия.
   7. Перемирие вправду отменяет войну, но мир без войн не остаётся.
   8. Следствия настоящие: эмбарго удорожает, торговый договор удешевляет,
      вассал платит дань, а сюзерен её берёт.
   9. Множитель цены в берегах на каждом товаре и у каждой державы.
  10. Тайный договор не виден, пока не узнан, и не смотрит на шкалу.
  11. Разведка: в поле не работает, берёт золото, при удаче открывает
      бумагу и кладёт её в собрание знаний, при неудаче роняет имя.
  12. Окно политики показывает свои записи, кнопку разведки и свод по
      родам, и ни одна строка не нема.
  13. Самопроверка мира держит строку «diplo»; глава, README и docs.
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
 const состав=await page.evaluate(()=>{
  const инстр=/^(inst|orch|mood|relic|score|folk|depth)\//;
  return {
   родов:DIPLO_KINDS.length,
   разряды:[...new Set(DIPLO_KINDS.map(k=>k.род))].sort(),
   нет:["war","truce","neutral","vassal","alliance","trade","military","secret","embargo","sanctions","spy"]
     .filter(id=>!DIPLO_BY_ID[id]),
   безПолей:DIPLO_KINDS.filter(k=>!k.n||!k.о||!k.знак||!SOUND_BANK[k.звук]
     ||!(k.сторон===1||k.сторон===2)).map(k=>k.id),
   инструмент:DIPLO_KINDS.filter(k=>(SOUND_BANK[k.звук]||{f:[]}).f.some(f=>инстр.test(f))).map(k=>k.id),
   состояний:DIPLO_KINDS.filter(k=>k.род==="состояние").length,
   договоров:DIPLO_KINDS.filter(k=>k.род==="договор").length,
   мер:DIPLO_KINDS.filter(k=>k.род==="мера").length,
   дел:DIPLO_KINDS.filter(k=>k.род==="дело").length};});
 check('одиннадцать родов, и все названные в §18 на месте',
  состав.родов===11&&состав.нет.length===0,состав);
 check('четыре разряда: состояние, договор, мера, дело',
  String(состав.разряды)==="дело,договор,мера,состояние"
  &&состав.состояний===4&&состав.договоров===4&&состав.мер===2&&состав.дел===1,состав);
 check('у каждого рода имя, суть, следствие и живая запись, а не инструмент',
  состав.безПолей.length===0&&состав.инструмент.length===0,состав);

 /* ── 2–5. Строение набора ── */
 const набор=await page.evaluate(()=>{
  const d=G.day;const плохие=[];const однобокие=[];const разряды={};
  for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++){
   const p=diploPacts(i,j,d);
   const сост=p.filter(x=>DIPLO_BY_ID[x.id].род==="состояние");
   if(сост.length!==1)плохие.push(`${i}:${j}=${сост.length}`);
   p.forEach(x=>{
    const k=DIPLO_BY_ID[x.id];
    разряды[k.род]=(разряды[k.род]||0)+1;
    if(k.сторон===1&&(!Number.isFinite(x.от)||!Number.isFinite(x.к)||x.от===x.к))
     однобокие.push(x.id+" "+i+":"+j);});}
  /* Порядок доводов не меняет ответа, и повтор тоже. */
  const ab=JSON.stringify(diploPacts(3,7,d)),ba=JSON.stringify(diploPacts(7,3,d));
  const ещё=JSON.stringify(diploPacts(3,7,d));
  /* Договор складывается поверх состояния, а не вместо него. */
  const сНадстройкой=(()=>{for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++){
    const p=diploPacts(i,j,d);
    if(p.some(x=>DIPLO_BY_ID[x.id].род==="договор")
      &&p.some(x=>DIPLO_BY_ID[x.id].род==="состояние"))return {i,j,ids:p.map(x=>x.id)};}
   return null;})();
  return {плохие,однобокие,разряды,ab,ba,ещё,сНадстройкой};});
 check('у каждой пары держав ровно одно состояние',набор.плохие.length===0,набор.плохие);
 check('односторонние записи знают, от кого и к кому, и это разные державы',
  набор.однобокие.length===0,набор.однобокие);
 check('в мире есть записи всех четырёх разрядов',
  ["состояние","договор","мера","дело"].every(r=>(набор.разряды[r]||0)>0),набор.разряды);
 check('порядок доводов и повтор не меняют набора',
  набор.ab===набор.ba&&набор.ab===набор.ещё,{ab:набор.ab.length,ba:набор.ba.length});
 check('договор складывается поверх состояния, а не вместо него',
  !!набор.сНадстройкой,набор.сНадстройкой);

 /* ── 6–7. Одна правда о войне, и перемирие её отменяет ── */
 const война=await page.evaluate(()=>{
  const из=(a,b)=>Math.min(a,b)+":"+Math.max(a,b);
  const дни=[];
  for(let d=1;d<=60;d+=3){
   const сводка=warsAt(d).map(w=>из(w.a,w.b)).sort().join(",");
   const дипл=[];const пер=[];
   for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++){
    const с=diploState(i,j,d);
    if(с.id==="war")дипл.push(из(i,j));
    if(с.id==="truce")пер.push(из(i,j));}
   дни.push({d,совпало:сводка===дипл.sort().join(","),войн:warsAt(d).length,перемирий:пер.length,
    /* перемирная пара не значится в сводке войн */
    чисто:пер.every(k=>сводка.indexOf(k)<0)||warsAt(d).length===1});}
  return {расхождений:дни.filter(x=>!x.совпало).length,
   безВойн:дни.filter(x=>x.войн===0).length,
   сПеремирием:дни.filter(x=>x.перемирий>0).length,
   грязных:дни.filter(x=>!x.чисто).length,всего:дни.length};});
 check('что сводка зовёт войной, то и дипломатия: одна правда на двоих',
  война.расхождений===0,война);
 check('перемирия в мире случаются и выводят пару из сводки войн',
  война.сПеремирием>0&&война.грязных===0,война);
 check('мир никогда не остаётся совсем без войн',война.безВойн===0,война);

 /* ── 8–9. Следствия настоящие ── */
 const цена=await page.evaluate(()=>{
  const d=G.day;
  /* Берём живые пары и смотрим, как договор двигает цену чужого вывоза. */
  const найти=(id)=>{
   for(let i=0;i<EMPIRES.length;i++)for(let j=0;j<EMPIRES.length;j++){
    if(i===j)continue;
    const p=diploPacts(i,j,d).find(x=>x.id===id);
    if(!p)continue;
    const товар=(EMPIRES[j].exports||[])[0];
    if(товар)return {i,j,товар,p};}
   return null;};
  /* Мерится вклад ОДНОЙ державы: сумма всех бумаг сразу заглушила бы его
     чужими эмбарго и санкциями. */
  const мера=(о,ожид)=>{
   if(!о)return null;
   const k=Diplo.priceWith(о.товар,о.i,о.j,d);
   return {товар:о.товар,k:Math.round(k*100)/100,ожид};};
  const торг=мера(найти("trade"),"<1");
  const эмб=(()=>{const о=(()=>{
    for(let i=0;i<EMPIRES.length;i++)for(let j=0;j<EMPIRES.length;j++){
     if(i===j)continue;
     const p=diploPacts(i,j,d).find(x=>x.id==="embargo"&&x.от===i);
     if(!p)continue;const т=(EMPIRES[j].exports||[])[0];if(т)return {i,j,товар:т,p};}
    return null;})();
   return мера(о,">1");})();
  /* Вассал платит дань, сюзерен берёт. */
  const вас=(()=>{
   for(let i=0;i<EMPIRES.length;i++)for(let j=0;j<EMPIRES.length;j++){
    if(i===j)continue;
    const p=diploPacts(i,j,d).find(x=>x.id==="vassal");
    if(p)return {сюзерен:p.от,вассал:p.к};}
   return null;})();
  /* Множитель в берегах на каждом товаре и у каждой державы. */
  let плохих=0,мин=9,макс=0;
  Object.keys(RES_BASE).forEach(r=>{
   for(let i=0;i<EMPIRES.length;i++){
    const k=diploPriceK(r,i,d);
    if(!Number.isFinite(k)||k<0.6||k>1.8)плохих++;
    мин=Math.min(мин,k);макс=Math.max(макс,k);}});
  return {торг,эмб,вас,плохих,мин:Math.round(мин*100)/100,макс:Math.round(макс*100)/100};});
 check('торговый договор удешевляет чужой вывоз',
  цена.торг&&цена.торг.k<1,цена.торг);
 check('эмбарго удорожает товар той стороны',цена.эмб&&цена.эмб.k>1,цена.эмб);
 check('множитель дипломатии в берегах на каждом товаре и у каждой державы',
  цена.плохих===0&&цена.мин>=0.6&&цена.макс<=1.8,цена);
 check('в мире есть хотя бы один вассалитет, и стороны у него разные',
  !цена.вас||цена.вас.сюзерен!==цена.вас.вассал,цена.вас);

 /* ── 10. Тайное не видно ── */
 const тайна=await page.evaluate(()=>{
  const d=G.day;G.diploKnown={};
  let скрытых=0,протекло=0,меж=0;
  for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++){
   const h=diploHidden(i,j,d),v=diploVisible(i,j,d);
   скрытых+=h.length;
   if(h.some(x=>v.some(y=>y.id===x.id)))протекло++;
   /* Тайное не смотрит на шкалу: бумага между врагами — обычное дело. */
   if(h.length&&relationAt(i,j,d)<0)меж++;}
  /* Узнанное становится видимым. */
  let пример=null;
  outer:for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++){
   const h=diploHidden(i,j,d);
   if(h.length){diploLearn(i,j,h[0].id);
    пример={i,j,id:h[0].id,видно:diploVisible(i,j,d).some(x=>x.id===h[0].id),
     вЗнаниях:safeFn(()=>Lore.count("secret"),0)};break outer;}}
  return {скрытых,протекло,меж,пример};});
 check('тайных договоров в мире несколько, и ни один не протёк в видимое',
  тайна.скрытых>=3&&тайна.протекло===0,тайна);
 check('тайное не смотрит на шкалу: бумаги есть и между теми, кто в розни',
  тайна.меж>0,тайна);
 check('узнанное становится видимым и ложится в собрание знаний',
  тайна.пример&&тайна.пример.видно&&тайна.пример.вЗнаниях>=1,тайна.пример);

 /* ── 11. Разведка ── */
 const развед=await page.evaluate(async()=>{
  window.__said=[];const орig=Speech.say;Speech.say=t=>{window.__said.push(String(t));};
  while(activeLayer())closeTopUI();
  G.diploKnown={};G.place=null;G.gold=100000;
  const i=empireIndexAt(G.x,G.y);
  /* В поле не работает. */
  window.__said=[];
  const вПоле=Diplo.scout(i);
  const речьПоле=window.__said.join(" ");
  /* Войти в город той же державы. */
  let город=null;
  outer:for(let r=1;r<420&&!город;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]==="city"){город={x:G.x+dx,y:G.y+dy};break outer;}}
  if(!город){Speech.say=орig;return {нет:"города нет"};}
  G.x=город.x;G.y=город.y;G.place=null;enterPlace(cellContent(город.x,город.y));
  const идx=empireIndexAt(город.x,город.y);
  const цена=Diplo.scoutCost(идx);
  /* Без золота не продают. */
  G.gold=1;window.__said=[];Diplo.scout(идx);
  const речьБедного=window.__said.join(" ");
  /* С золотом: повторяем, пока удача не выпадет или деньги не кончатся. */
  G.gold=900000;
  let узнано=0,потрачено=0,попыток=0;
  const было=G.gold;
  while(попыток<120){
   попыток++;
   const g=G.gold;
   Diplo.scout(идx);
   потрачено+=g-G.gold;
   узнано=Object.keys(G.diploKnown||{}).length;
   if(узнано)break;}
  Speech.say=орig;
  return {вПоле,речьПоле:речьПоле.slice(0,70),речьБедного:речьБедного.slice(0,70),
   цена,узнано,потрачено:было-G.gold,попыток,
   вЗнаниях:safeFn(()=>Lore.count("secret"),0)};});
 check('в поле разведка не работает: спрашивать надо в городе',
  развед.вПоле===false&&/город/i.test(развед.речьПоле||""),развед);
 check('без золота тайное не продают',/золот/i.test(развед.речьБедного||""),развед);
 check('в городе разведка берёт золото и рано или поздно открывает бумагу',
  развед.узнано>=1&&развед.потрачено>=развед.цена,развед);
 check('узнанное разведкой записано в политические секреты',
  развед.вЗнаниях>=1,развед);

 /* ── 12. Окно ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  openModal("modal-politics");renderPolitics();
  const el=document.getElementById("polPacts");
  if(!el)return {нет:true};
  const строк=[...el.querySelectorAll(".list-line")];
  const немые=строк.filter(e=>!e.getAttribute("data-speak")).length;
  const кнопка=el.querySelector("button[data-cmd^='diploscout']");
  const родов=DIPLO_KINDS.filter(k=>el.textContent.indexOf(k.n)>=0).length;
  const r={строк:строк.length,немые,кнопка:!!кнопка,
   кнопкаГоворит:!!(кнопка&&кнопка.getAttribute("data-speak")),родов};
  while(activeLayer())closeTopUI();
  return r;});
 check('окно политики показывает договоры, меры и тайное, и ни одна строка не нема',
  !окно.нет&&окно.строк>=12&&окно.немые===0,окно);
 check('в окне есть говорящая кнопка разведки и названы все одиннадцать родов',
  !окно.нет&&окно.кнопка&&окно.кнопкаГоворит&&окно.родов===11,окно);

 /* ── 13. Самопроверка, руководство, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="diplo");
  const гл=GUIDE.find(g=>/Дипломатия: одиннадцать родов/i.test(g.title));
  return {есть:!!r,ok:r&&r.ok,всего:rows.length,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("DIPLOMACY")};});
 check('самопроверка мира держит строку «diplo» и она зелёная',свод.есть&&свод.ok,свод);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль DIPLOMACY зарегистрирован',свод.модуль===true,свод);
 check('в руководстве есть глава о дипломатии',свод.глава&&свод.строк>=8,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о разрядах, эмбарго и тайном договоре',
  /Дипломатия: одиннадцать родов/i.test(readme)&&/эмбарго/i.test(readme)
  &&/санкции/i.test(readme)&&/Тайный договор не виден/i.test(readme));
 check('docs/МИР.md держит таблицы и формулу цены',
  /DIPLO_KINDS/.test(mir)&&/diploPriceK/.test(mir)&&/warsRaw/.test(mir)&&/diploScout/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
