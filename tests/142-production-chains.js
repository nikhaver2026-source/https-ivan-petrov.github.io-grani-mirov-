/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 142: ПРОИЗВОДСТВО — ПЕРЕДЕЛЫ И ТРИНАДЦАТЬ МАСТЕРСКИХ (§12)

   §12 мастер-промпта просит: у каждого ресурса несколько стадий, и
   тринадцать производственных зданий, в которых эти стадии идут. Было
   одно движение от породы к вещи: четыре куска руды у горна — и слиток.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Тринадцать зданий, десять цепей, двадцать пять полуфабрикатов,
      тридцать один передел — и у каждого здания свой станок с именем.
   2. Передел — обычная техника: он лежит в TECHS, у своего ремесла, на
      станке этого ремесла и с живыми записями, а не с инструментом.
   3. Ни одно здание не декорация: у каждого хотя бы один передел.
   4. Ни один полуфабрикат не повисает: он и выходит из передела, и
      куда-то идёт дальше. У каждого цена и значок — его возят и продают.
   5. Цепи переплетаются: меч требует бруса, закалка — состава.
   6. Цепь руды проходится целиком, и из той же руды через передел
      выходит больше металла, чем в горне наспех.
   7. Последняя ступень отдаёт ВЕЩЬ с рангом и качеством по руке
      мастера, а не припас.
   8. Работа срывается: передел — ремесло, а не выдача по кнопке.
   9. Мастерские стоят в городах: плитка «Z», имя вслух, свой голос,
      набор у города навсегда свой, у деревни — по её промыслу.
  10. Мастерская — станок: «Что вокруг» даёт у неё те же работы.
  11. Звуковая картина города больше не пустая: у каждого вида плитки
      есть запись, включая пять городских служб и мастерскую.
  12. Два новых ремесла заведены, и каждому есть у кого учиться.
  13. Самопроверка мира держит строку «prod»; глава, README и docs.
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
  зданий:PROD_BUILDINGS.length,цепей:PROD_CHAINS.length,
  товаров:PROD_GOODS.length,переделов:PROD_STEPS.length,
  станков:new Set(PROD_BUILDINGS.map(b=>b.станок)).size,
  безИмени:PROD_BUILDINGS.filter(b=>!STANOK_NAME[b.станок]).map(b=>b.id),
  безЗаписи:PROD_BUILDINGS.filter(b=>!SOUND_BANK[b.звук]).map(b=>b.id),
  безОписания:PROD_BUILDINGS.filter(b=>!b.n||!b.о||!(b.цепи||[]).length).map(b=>b.id),
  чужаяЦепь:PROD_BUILDINGS.filter(b=>(b.цепи||[]).some(c=>!PROD_CHAIN_BY_ID[c])).map(b=>b.id),
  имена:PROD_BUILDINGS.map(b=>b.n)}));
 check('тринадцать производственных зданий, десять цепей, двадцать пять полуфабрикатов, тридцать один передел',
  состав.зданий===13&&состав.цепей===10&&состав.товаров===25&&состав.переделов===31,состав);
 check('у каждого здания свой станок, и у станка есть имя вслух',
  состав.станков===13&&состав.безИмени.length===0,состав);
 check('у каждого здания живая запись, описание и хотя бы одна цепь',
  состав.безЗаписи.length===0&&состав.безОписания.length===0&&состав.чужаяЦепь.length===0,состав);
 check('названы все тринадцать зданий из §12',
  ["шахта","плавильня","кузница","оружейная","кожевенная мастерская","ткацкая",
   "алхимическая лаборатория","рунная мастерская","артефакторская",
   "деревообрабатывающая мастерская","камнерезная","эфирная лаборатория",
   "астральная лаборатория"].every(n=>состав.имена.includes(n)),состав.имена);

 /* ── 2–4. Переделы — часть общей системы ремёсел ── */
 const связь=await page.evaluate(()=>{
  const инстр=/^(inst|orch|mood|relic|score|folk|depth)\//;
  return {
  неВТехниках:PROD_STEPS.filter(t=>TECH_BY_ID[t.id]!==t).map(t=>t.id),
  чужойСтанок:PROD_STEPS.filter(t=>!MAST_BY_ID[t.маст]
    ||!t.станки.every(st=>MAST_BY_ID[t.маст].станки.indexOf(st)>=0)).map(t=>t.id),
  безЗаписи:PROD_STEPS.filter(t=>!SOUND_BANK[t.звук]||!SOUND_BANK[t.след]).map(t=>t.id),
  инструмент:PROD_STEPS.filter(t=>[t.звук,t.след].some(r=>(SOUND_BANK[r]||{f:[]}).f.some(f=>инстр.test(f)))).map(t=>t.id),
  безПолей:PROD_STEPS.filter(t=>!t.n||!t.о||!PROD_CHAIN_BY_ID[t.цепь]).map(t=>t.id),
  пустоеЗдание:PROD_BUILDINGS.filter(b=>!PROD_STEPS.some(t=>t.станки.indexOf(b.станок)>=0)).map(b=>b.id),
  пустаяЦепь:PROD_CHAINS.filter(c=>!PROD_STEPS.some(t=>t.цепь===c.id)).map(c=>c.id),
  ниоткуда:PROD_GOODS.filter(g=>!PROD_STEPS.some(t=>t.даёт&&t.даёт[g.n])).map(g=>g.n),
  вникуда:PROD_GOODS.filter(g=>!PROD_STEPS.some(t=>t.берёт&&t.берёт[g.n])).map(g=>g.n),
  безЦены:PROD_GOODS.filter(g=>!(RES_BASE[g.n]>0)).map(g=>g.n),
  безЗначка:PROD_GOODS.filter(g=>!(g.n in RESICON)).map(g=>g.n)};});
 check('каждый передел лежит в общей таблице техник, а не в своей',
  связь.неВТехниках.length===0,связь.неВТехниках);
 check('станок передела принадлежит его же ремеслу',связь.чужойСтанок.length===0,связь.чужойСтанок);
 check('у каждого передела живые записи, а не инструменты',
  связь.безЗаписи.length===0&&связь.инструмент.length===0,связь);
 check('у каждого передела имя, описание, значок и своя цепь',связь.безПолей.length===0,связь.безПолей);
 check('ни одно здание не декорация и ни одна цепь не обещание',
  связь.пустоеЗдание.length===0&&связь.пустаяЦепь.length===0,связь);
 check('ни один полуфабрикат не повисает: он и выходит из передела, и идёт дальше',
  связь.ниоткуда.length===0&&связь.вникуда.length===0,связь);
 check('у каждого полуфабриката есть цена и значок: его возят и продают',
  связь.безЦены.length===0&&связь.безЗначка.length===0,связь);

 /* ── 5. Цепи переплетаются ── */
 const сплет=await page.evaluate(()=>{
  const шаг=id=>PROD_STEPS.find(t=>t.id===id)||{};
  const цепьТовара=n=>(PROD_GOOD_BY_N[n]||{}).цепь;
  const меч=шаг("pr_blade"),закал=шаг("pr_temper"),крой=шаг("pr_cut"),оправа=шаг("pr_mount");
  const чужих=t=>[...new Set(Object.keys(t.берёт||{}).map(цепьТовара).filter(c=>c&&c!==t.цепь))];
  return {меч:чужих(меч),закал:чужих(закал),крой:чужих(крой),оправа:чужих(оправа),
   мечВещь:!!меч.вещь,вещей:PROD_STEPS.filter(t=>t.вещь).length,
   цепейСВещью:new Set(PROD_STEPS.filter(t=>t.вещь).map(t=>t.цепь)).size,
   кожа:PROD_STEPS.filter(t=>t.вещь&&t.цепь==="hide").map(t=>t.вещь.тип).sort().join(",")};});
 check('меч своей ковки требует не только клинка, но и бруса из другой цепи',
  сплет.меч.includes("wood"),сплет);
 check('закалка идёт в алхимическом составе, крой — по костяной пластине, оправа — с рунной заготовкой',
  сплет.закал.includes("herb")&&сплет.крой.includes("bone")&&сплет.оправа.includes("rune"),сплет);
 check('три цепи кончаются вещью, а не припасом; кожевенная — плащом, перчатками и сапогами',
  сплет.цепейСВещью===3&&сплет.вещей===5&&сплет.мечВещь&&сплет.кожа==="Перчатки,Плащ,Сапоги",сплет);

 /* ── 6. Цепь руды проходится целиком и выгоднее короткого пути ── */
 const цепь=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.mast={};["smith","jewel","alchemy","runes","arte","wood","leather"].forEach(id=>G.mast[id]={ур:5,оп:0,дел:0});
  /* Меряется ВЫХОД цепи, а не удача: при срыве припас возвращается и работа
     повторяется, иначе на длинном пути один бросок из полусотни решал бы всё. */
  const делать=(id,станок)=>{const t=TECH_BY_ID[id];
   for(const n in (t.берёт||{}))if((Number(G.inv[n])||0)<t.берёт[n])return false;
   for(let k=0;k<80;k++){
    const было={};for(const n in (t.даёт||{}))было[n]=Number(G.inv[n])||0;
    techDo(t,станок);
    if(Object.keys(t.даёт||{}).every(n=>(Number(G.inv[n])||0)>было[n]))return true;
    for(const n in (t.берёт||{}))G.inv[n]=(Number(G.inv[n])||0)+t.берёт[n];}
   return false;};
  /* короткий путь: 12 руды у горна */
  G.inv={"руда":12};
  let коротких=0;
  while((Number(G.inv["руда"])||0)>=4&&коротких<20){if(!делать("melt","forge"))break;коротких++;}
  const короткий=Number(G.inv["слиток"])||0;
  /* длинный путь: те же 12 руды через шахту и плавильню */
  G.inv={"руда":12,"дерево":40};
  let шагов=0;
  while((Number(G.inv["руда"])||0)>=2&&шагов<40){if(!делать("pr_crush","shaft"))break;шагов++;}
  while((Number(G.inv["дроблёная руда"])||0)>=2&&шагов<80){if(!делать("pr_sort","shaft"))break;шагов++;}
  while((Number(G.inv["отборная руда"])||0)>=2&&шагов<120){if(!делать("pr_wash","smelter"))break;шагов++;}
  while((Number(G.inv["рудный концентрат"])||0)>=2&&шагов<160){if(!делать("pr_smelt","smelter"))break;шагов++;}
  const длинный=Number(G.inv["слиток"])||0;
  return {короткий,длинный,шагов};});
 check('цепь руды проходится целиком: дробление, разбор, обогащение, плавка',
  цепь.длинный>0&&цепь.шагов>=20,цепь);
 check('из той же руды через передел выходит вдвое больше металла, чем в горне наспех',
  цепь.длинный>=цепь.короткий*2,цепь);

 /* ── 7. Последняя ступень отдаёт вещь ── */
 const вещь=await page.evaluate(()=>{
  G.gear=[];G.level=10;
  G.mast={smith:{ур:5,оп:0,дел:0},leather:{ур:5,оп:0,дел:0},arte:{ур:5,оп:0,дел:0}};
  const t=TECH_BY_ID["pr_blade"];
  let it=null;
  for(let i=0;i<40&&!it;i++){
   G.inv={"закалённый клинок":1,"клеёный брус":1};
   techDo(t,"armory");
   it=(G.gear||[])[0]||null;}
  return it?{имя:it.name,тип:it.type,слот:it.slot,ранг:it.rank,кач:it.qual,
   цена:it.price,прибавка:it.val,своя:!!it.своя}:{нет:true};});
 check('последняя ступень отдаёт вещь с рангом, качеством и ценой, а не припас',
  !вещь.нет&&вещь.тип==="Меч"&&вещь.слот==="weapon"&&вещь.ранг>=1&&вещь.кач>=1
  &&вещь.цена>0&&вещь.прибавка>0&&вещь.своя,вещь);
 check('имя вещи собрано по редкости и материалу, а не выдумано',
  !вещь.нет&&/меч$/.test(String(вещь.имя))&&String(вещь.имя).split(" ").length>=3,вещь.имя);

 /* ── 8. Передел — ремесло: он срывается ── */
 const срыв=await page.evaluate(()=>{
  G.mast={smith:{ур:1,оп:0,дел:0}};
  const t=TECH_BY_ID["pr_crush"];
  const риск=techRisk(t);
  let неудач=0;
  for(let i=0;i<120;i++){
   G.inv={"руда":2};
   techDo(t,"shaft");
   if(!(Number(G.inv["дроблёная руда"])||0))неудач++;}
  return {риск,неудач};});
 check('передел срывается: это ремесло, а не выдача по кнопке',
  срыв.риск>0.01&&срыв.неудач>0&&срыв.неудач<120,срыв);

 /* ── 9–10. Мастерские в мире ── */
 const мир=await page.evaluate(()=>{
  const найти=виды=>{
   for(let r=1;r<420;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const c=cellContent(1000+dx,1000+dy);
    if(c.structure&&виды.includes(c.structure.type))return {x:1000+dx,y:1000+dy,t:c.structure.type};}
   return null;};
  const войти=c=>{G.x=c.x;G.y=c.y;G.place=null;G.ship=null;G.inCombat=false;
   enterPlace(cellContent(c.x,c.y));return curLevel();};
  const город=найти(["castle","fortress","citadel","port","burg"]);
  const деревня=найти(["village"]);
  if(!город||!деревня)return {нет:true};
  const l1=войти(город);
  const набор1=(l1.shops||[]).map(s=>s.id);
  let z=0;for(let y=0;y<l1.h;y++)for(let x=0;x<l1.w;x++)if(l1.g[y][x]==="Z")z++;
  /* набор у города навсегда свой */
  const снова=prodShopSet(город.x,город.y,город.t,null).map(b=>b.id);
  const сосед=prodShopSet(город.x+40,город.y+40,город.t,null).map(b=>b.id);
  /* встать на мастерскую и спросить, что вокруг */
  const s0=(l1.shops||[])[0];
  G.place.x=s0.x;G.place.y=s0.y;
  const b=PROD_BUILD_BY_ID[s0.id];
  const имя=tileLabel("Z",s0.x,s0.y);
  const o=objectsHere().find(o=>o.станок===b.станок);
  G.mast={};MASTERY.forEach(m=>{G.mast[m.id]={ур:5,оп:0,дел:0};});
  const работ=o?actionsFor(o).filter(a=>String(a.id).indexOf("tech:")===0).length:0;
  const свои=PROD_STEPS.filter(t=>t.станки.indexOf(b.станок)>=0).length;
  /* звуковая картина города не пустая */
  G.place.x=l1.squareAt.x;G.place.y=l1.squareAt.y;
  const вокруг=Scape.around().length;
  /* деревня: одна мастерская, и по промыслу */
  const l2=войти(деревня);
  const набор2=(l2.shops||[]).map(s=>s.id);
  const промысел=placeTrait(деревня.x,деревня.y,"village");
  return {город,деревня,набор1,z,снова,сосед,имя,станок:o&&o.станок,работ,свои,вокруг,
   набор2,промысел:промысел&&промысел.id,
   ожидалось:промысел&&VILLAGE_SHOP[промысел.id]||null};});
 check('в городе стоят мастерские, и плитка «Z» их на карте столько же',
  !мир.нет&&мир.набор1.length>=2&&мир.z===мир.набор1.length,мир);
 check('набор мастерских у города навсегда свой и у соседа другой',
  !мир.нет&&String(мир.снова)===String(мир.набор1)&&String(мир.сосед)!==String(мир.набор1),мир);
 check('мастерская называет себя, а не «мастерскую вообще»',
  !мир.нет&&мир.имя&&мир.имя!=="мастерская",мир.имя);
 check('мастерская — станок: у неё те же работы, что и у любого станка',
  !мир.нет&&!!мир.станок&&мир.работ>=мир.свои&&мир.свои>=1,мир);
 check('звуковая картина города не пустая: службы и мастерские слышны',
  !мир.нет&&мир.вокруг>0,мир.вокруг);
 check('деревне положена одна мастерская, и по её промыслу',
  !мир.нет&&мир.набор2.length===1&&(!мир.ожидалось||мир.набор2[0]===мир.ожидалось),мир);

 /* ── 11. Ни один вид плитки не роняет звуковую картину ── */
 const голоса=await page.evaluate(()=>({
  немые:Object.keys(SCAPE_TILE).filter(t=>!SCAPE_VOICE[SCAPE_TILE[t]]),
  безЗаписи:Object.keys(SCAPE_VOICE).filter(k=>SCAPE_VOICE[k].role&&!SOUND_BANK[SCAPE_VOICE[k].role]),
  мастерская:!!SCAPE_VOICE.workshop&&SCAPE_TILE["Z"]==="workshop"}));
 check('у каждого вида плитки в звуковой картине есть своя запись',
  голоса.немые.length===0&&голоса.безЗаписи.length===0,голоса);
 check('мастерская звучит в звуковой картине',голоса.мастерская===true,голоса);

 /* ── 12. Два новых ремесла ── */
 const ремёсла=await page.evaluate(()=>{
  const нужны=["wood","leather"];
  return {нет:нужны.filter(id=>!MAST_BY_ID[id]),
   некому:нужны.filter(id=>!Object.keys(MAST_TEACH).some(p=>(MAST_TEACH[p]||{})[id]>0)),
   станки:нужныеСтанки(),всего:MASTERY.length};
  function нужныеСтанки(){return нужны.map(id=>(MAST_BY_ID[id]||{станки:[]}).станки
   .filter(s=>!STANOK_NAME[s]));}});
 check('плотницкое и кожевенно-ткацкое ремёсла заведены, у станков есть имена',
  ремёсла.нет.length===0&&ремёсла.станки.every(a=>a.length===0)&&ремёсла.всего===13,ремёсла);
 check('обоим новым ремёслам есть у кого учиться',ремёсла.некому.length===0,ремёсла.некому);

 /* ── 13. Самопроверка, руководство, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="prod");
  const гл=GUIDE.find(g=>/Производство: переделы/i.test(g.title));
  return {есть:!!r,ok:r&&r.ok,всего:rows.length,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   вОкне:(()=>{try{openModal("modal-craft");renderCraft();
    const el=document.getElementById("craftList");
    const немые=[...el.querySelectorAll(".list-line")].filter(e=>!e.getAttribute("data-speak")).length;
    const цепей=PROD_CHAINS.filter(c=>el.textContent.includes(c.n)).length;
    const домов=PROD_BUILDINGS.filter(b=>el.textContent.includes(b.n)).length;
    while(activeLayer())closeTopUI();
    return {немые,цепей,домов};}catch(e){return {ошибка:String(e)};}})()};});
 check('самопроверка мира держит строку «prod» и она зелёная',свод.есть&&свод.ok,свод);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о производстве',свод.глава&&свод.строк>=8,свод);
 check('окно крафта показывает все цепи и все мастерские, и ни одна строка не нема',
  свод.вОкне.цепей===10&&свод.вОкне.домов===13&&свод.вОкне.немые===0,свод.вОкне);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о переделах и мастерских',
  /Производство: переделы/i.test(readme)&&/плавильня/i.test(readme)
  &&/клеёного бруса/i.test(readme)&&/тридцать один передел/i.test(readme));
 check('docs/МИР.md держит таблицы производства',
  /PROD_STEPS/.test(mir)&&/PROD_BUILDINGS/.test(mir)&&/PROD_CHAINS/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
