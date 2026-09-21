/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 146: ПРОИЗВОДСТВЕННАЯ ЭКОНОМИКА (§13 мастер-промпта)

   §13 описывает не таблицу, а ЦЕПЬ: война разрушила шахту — меньше руды —
   меньше металла — меньше оружия — растёт цена — вооружение дефицитно —
   фракции меняют закупки — торговцы меняют ассортимент — появляются
   контрабандисты. В мире были все звенья по отдельности; не было цепи.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Уязвимость задана всем тринадцати родам мастерских и лежит в берегах;
      шахту и плавильню жгут первее лабораторий.
   2. У каждой державы есть производство, выведенное из её же городов.
   3. Гнёт растёт от войны и осады, а у мирной державы он мал.
   4. Уцелевших никогда не больше, чем было.
   5. Узкое место решает выход цепи — ровно, а не приблизительно.
   6. Разбитая шахта роняет ВСЮ рудную цепь, а не только свою ступень.
   7. Из дефицита следует цена — и она доходит до рынка.
   8. Из дефицита следуют закупки — и они доходят до выручки.
   9. Из дефицита следует поредевший прилавок: меньше вещей, а не дороже.
  10. Глубокий дефицит запирает вывоз: товар делается запретным.
  11. Всё выводится: тот же день даёт тот же ответ, перезагрузка не нужна.
  12. Окно политики показывает гнёт, цепи и разбитое, без немых строк.
  13. Самопроверка мира держит строку «prodecon»; модуль, глава, README, docs.
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

 /* ── 1–4. Основание ── */
 const основа=await page.evaluate(()=>{
  const нет=PROD_BUILDINGS.filter(b=>!(PROD_VULN[b.id]>0&&PROD_VULN[b.id]<=1)).map(b=>b.id);
  const лишние=Object.keys(PROD_VULN).filter(id=>!PROD_BUILD_BY_ID[id]);
  const порядок=PROD_VULN.mine>=PROD_VULN.weavery&&PROD_VULN.smelter>PROD_VULN.astrallab;
  let пусто=0,перебор=0;
  const гнёты=[];
  for(let i=0;i<EMPIRES.length;i++){
   const сайты=prodSitesOf(i);
   const всего=Object.values(сайты).reduce((s,v)=>s+v,0);
   if(!всего)пусто++;
   const e=prodEconOf(i,G.day);
   гнёты.push(e.гнёт);
   if(!PROD_BUILDINGS.every(b=>(e.цел[b.id]||0)<=(e.всего[b.id]||0)))перебор++;}
  /* Война поднимает гнёт: сравним день с войной и день без неё. */
  const i0=0;let сВойной=null,безВойны=null;
  for(let d=1;d<=90&&(сВойной===null||безВойны===null);d+=1){
   const w=warsAt(d).some(x=>x.a===i0||x.b===i0);
   if(w&&сВойной===null)сВойной=prodPressure(i0,d);
   if(!w&&безВойны===null)безВойны=prodPressure(i0,d);}
  return {нет,лишние,порядок,пусто,перебор,
   гнётМин:Math.min(...гнёты),гнётМакс:Math.max(...гнёты),сВойной,безВойны};});
 check('уязвимость задана всем тринадцати родам и лежит в берегах',
  основа.нет.length===0&&основа.лишние.length===0,основа);
 check('шахту и плавильню жгут первее ткацкой и астральной лаборатории',
  основа.порядок,основа);
 check('у каждой державы есть производство, выведенное из её городов',
  основа.пусто===0,основа);
 check('уцелевших никогда не больше, чем было, а гнёт в берегах',
  основа.перебор===0&&основа.гнётМин>=0&&основа.гнётМакс<=0.9,основа);
 check('война поднимает гнёт, мир его опускает',
  основа.сВойной===null||основа.безВойны===null||основа.сВойной>основа.безВойны,основа);

 /* ── 5–6. Узкое место и каскад ── */
 const цепь=await page.evaluate(()=>{
  const i=0,e=prodEconOf(i,G.day);
  const расхождения=[];
  PROD_CHAINS.forEach(c=>{
   let узкое=1;
   PROD_STEPS.filter(t=>t.цепь===c.id).forEach(t=>{
    const b=PROD_BUILD_BY_STANOK[t.станки[0]];if(!b)return;
    const n=e.всего[b.id]||0;
    узкое=Math.min(узкое,n?0.35+0.65*((e.цел[b.id]||0)/n):0.7);});
   if(Math.abs(e.выход[c.id]-Math.round(узкое*100)/100)>0.011)
    расхождения.push(c.id);});
  /* Разбитая шахта роняет всю рудную цепь. Берём державу, у которой всё
     цело: на уже просевшей цепи разница не видна — она и так на полу. */
  let ц=-1;
  for(let k=0;k<EMPIRES.length;k++){
   const s=prodEconOf(k,G.day);
   if(prodPressure(k,G.day)===0&&(s.всего.mine||0)>0){ц=k;break;}}
  const целая=ц<0?null:JSON.parse(JSON.stringify(prodEconOf(ц,G.day)));
  const битая=ц<0?null:JSON.parse(JSON.stringify(prodEconOf(ц,G.day)));
  if(битая)битая.цел.mine=0;
  /* Пересчитываем выход руками по тем же правилам. */
  const выход=(сост)=>{
   let v=1;
   PROD_STEPS.filter(t=>t.цепь==="ore").forEach(t=>{
    const b=PROD_BUILD_BY_STANOK[t.станки[0]];if(!b)return;
    const n=сост.всего[b.id]||0;
    v=Math.min(v,n?0.35+0.65*((сост.цел[b.id]||0)/n):0.7);});
   return v;};
  return {расхождения,мирная:ц,
   целаяЦепь:целая?выход(целая):null,битаяЦепь:битая?выход(битая):null,
   шахт:целая?(целая.всего.mine||0):0};});
 check('выход цепи равен её узкому месту, а не среднему по зданиям',
  цепь.расхождения.length===0,цепь.расхождения);
 check('разбитая шахта роняет всю рудную цепь, а не только свою ступень',
  /* Цепь и до того могла быть неполной: у державы просто нет плавильни, и
     ступень идёт со стороны. Важно другое — сожжённая шахта тянет ВСЮ цепь
     на пол, ниже того, чем она была. */
  цепь.мирная<0||(цепь.битаяЦепь<цепь.целаяЦепь&&цепь.битаяЦепь<=0.35),цепь);

 /* ── 7–10. Четыре следствия доходят до места ── */
 const следствия=await page.evaluate(()=>{
  /* Ищем державу с настоящим дефицитом. */
  let i=-1,деф=null;
  for(let k=0;k<EMPIRES.length;k++){
   const d=prodDeficit(k,G.day);
   if(Object.keys(d).length){i=k;деф=d;break;}}
  if(i<0)return {нет:true};
  const товар=Object.keys(деф).sort((a,b)=>деф[b]-деф[a])[0];
  const ориг=prodDeficit;
  const мера=()=>({цена:marketPrice(товар,i,G.day),
   выручка:sellPrice(товар,i,G.day,null),
   запрет:isContraband(товар,i),
   множЦены:prodEconPriceK(товар,i,G.day),
   множЗакупки:prodEconBuyK(товар,i,G.day)});
  const сДефицитом=мера();
  /* Гасим дефицит и меряем то же самое: разница и есть проведённое следствие. */
  prodDeficit=()=>({});
  const безДефицита=мера();
  prodDeficit=ориг;
  /* Прилавок: сколько оружия и доспеха держит торговец. */
  const n=getNPC(EMPIRES[i].cap.x,EMPIRES[i].cap.y,0,"Торговец");
  const ориг2=prodStockCut;
  G.x=EMPIRES[i].cap.x;G.y=EMPIRES[i].cap.y;G.place=null;
  const считать=()=>stockFor(n).filter(o=>o.gear&&(o.gear.slot==="weapon"||o.gear.slot==="armor")).length;
  prodStockCut=()=>0;const целый=считать();
  prodStockCut=()=>0.6;const поредевший=считать();
  prodStockCut=ориг2;
  return {держава:EMPIRES[i].short,товар,недостаток:деф[товар],
   сДефицитом,безДефицита,целый,поредевший,
   резка:prodStockCut(i,G.day)};});
 check('в мире есть держава с настоящим дефицитом',!следствия.нет,следствия);
 check('из дефицита следует цена, и она доходит до рынка',
  !следствия.нет&&следствия.сДефицитом.множЦены>1
  &&следствия.сДефицитом.цена>следствия.безДефицита.цена,следствия);
 check('из дефицита следуют закупки: за недостающее платят дороже',
  !следствия.нет&&следствия.сДефицитом.множЗакупки>1
  &&следствия.сДефицитом.выручка>следствия.безДефицита.выручка,следствия);
 check('из дефицита следует поредевший прилавок: меньше вещей, а не дороже',
  !следствия.нет&&следствия.поредевший<следствия.целый,следствия);
 check('глубокий дефицит запирает вывоз: товар делается запретным',
  !следствия.нет&&(следствия.недостаток<0.4
   ||(следствия.сДефицитом.запрет&&!следствия.безДефицита.запрет)),следствия);

 /* ── 11. Всё выводится ── */
 const вывод=await page.evaluate(()=>{
  const снимок=()=>EMPIRES.map((_,i)=>JSON.stringify(prodEconOf(i,G.day)));
  EMPIRES.forEach((_,i)=>prodDeficit(i,G.day));
  const a=снимок();
  PROD_ECON_CACHE.clear();PROD_DEFICIT_CACHE.clear();PROD_SITES_CACHE=null;
  EMPIRES.forEach((_,i)=>prodDeficit(i,G.day));
  const b=снимок();
  /* Другой день — другое состояние хотя бы у кого-то. */
  const c=EMPIRES.map((_,i)=>JSON.stringify(prodEconOf(i,G.day+40)));
  return {одинаково:a.join("|")===b.join("|"),
   меняется:a.join("|")!==c.join("|")};});
 check('состояние выводится, а не хранится: тот же день даёт тот же ответ',
  вывод.одинаково,вывод);
 check('с другим днём мир производит иначе',вывод.меняется,вывод);

 /* ── 12. Окно ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  openModal("modal-politics");renderPolitics();
  const el=document.getElementById("polProd");
  if(!el)return {нет:true};
  const строки=[...el.querySelectorAll(".list-line")];
  const немые=строки.filter(e=>!e.getAttribute("data-speak")).length;
  const цепей=PROD_CHAINS.filter(c=>el.textContent.indexOf(c.n)>=0).length;
  const r={строк:строки.length,немые,цепей};
  while(activeLayer())closeTopUI();
  return r;});
 check('окно политики показывает производство: все десять цепей и ни одной немой строки',
  !окно.нет&&окно.цепей===10&&окно.немые===0&&окно.строк>=12,окно);

 /* ── 13. Самопроверка, модуль, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="prodecon");
  const гл=GUIDE.find(g=>/Производственная экономика/i.test(g.title));
  return {есть:!!r,ok:r&&r.ok,всего:rows.length,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("PRODECON"),
   текст:ProdEcon.text().slice(0,60)};});
 check('самопроверка мира держит строку «prodecon» и она зелёная',свод.есть&&свод.ok,свод);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль PRODECON зарегистрирован и отвечает',
  свод.модуль===true&&/Производство/.test(свод.текст),свод);
 check('в руководстве есть глава о производственной экономике',свод.глава&&свод.строк>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о цепи последствий',
  /Производственная экономика/i.test(readme)&&/Узкое место/i.test(readme)
  &&/контрабанд/i.test(readme));
 check('docs/МИР.md держит формулы и таблицу следствий',
  /PROD_VULN/.test(mir)&&/prodEconOf/.test(mir)&&/prodStockCut/.test(mir)
  &&/prodBanned/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
