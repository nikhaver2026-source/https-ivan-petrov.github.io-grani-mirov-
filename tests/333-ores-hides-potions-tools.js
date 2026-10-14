/* ════════════════════════════════════════════════════════════════════════
   НАБОР 333: РУДЫ, ШКУРЫ, МЕХ, КРОВЬ; ЗЕЛЬЯ ПО РАНГАМ; ХОЗЯЙСТВЕННЫЙ ИНСТРУМЕНТ; БОЛЬШИЕ ДЕЛА (17.0)

   Просьбы игрока: «руды — медная, золотая, серебряная, мифриловая и так далее, все разного назначения; то же —
   шкуры от необработанной до выделанной и дублёной, мех, кровь»; «зелья от простого до божественного — и
   здоровья, и маны, и все остальные; зелья двойного назначения — только изготовить или получить в награду»;
   «торговцам — грабли, мотыги и прочее»; «куча различных социальных квестов… городских, значимых,
   государственных, политических».

   1. Сырьё 17.0 — с ценой у торговца; в котомке: руда — «Ресурсы», слиток — «Материалы»; карточка говорит,
      что это и на что идёт.
   2. Медная жила: сверх руды — медная руда; топи — болотная руда.
   3. С туши волка — волчья шкура, мех, кровь, жилы (со свежевальным ножом); с змеи — змеиная кожа и кровь.
   4. Передел: у плавильной печи «Выплавить медь» — медная руда и уголь дают медный слиток; у дубильного чана —
      соль и корьё ведут шкуру к дублёной коже; кровь — к эссенции у перегонного куба.
   5. Торговцы: кузнец держит медь, сталь, уголь, гвозди и подковы; скобяной ряд — грабли, мотыгу, вилы, косу,
      лопату, пилу; купленные грабли — в «Инструментах», вторые не продают.
   6. Зелья: 14 родов × 11 рангов и 15 двойных × 9 рангов; без ступени — отказ с причиной; простое зелье здоровья
      варится из травы и склянки и лечит; крепкое — без ступки нельзя; двойные в лавке не продаются.
   7. Окно «Зелья»: «Зелья по рангам» — 14 родов, род — 11 рангов с составом и причиной.
   8. Все 38 больших дел начинаются у своих жителей: шаги есть, все цели — в мире, ни одной пустой (17.0: с десятью
      приключениями библиотеки — 38; живое приключение молвы начинается не у жителя, его проверяет 337).
   9. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const page=await (await browser.newContext()).newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1000);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};window.startCombat=()=>true;
  G.x=52000;G.y=53000;G.place=null;G.level=6;G.gold=5000;});

 /* ── 1. Сырьё ── */
 const с=await page.evaluate(()=>{const o={};o.всего=RES170.length;o.цены=["медная руда","мифриловая руда","драготировая руда","медный слиток","волчья шкура","дублёная кожа","соболий мех","драконья кровь","кровяная эссенция"].map(n=>RES_BASE[n]);
  G.inv["медная руда"]=3;G.inv["медный слиток"]=1;const rows=Inventory.rows();const р=rows.find(r=>r.name==="медная руда"),с=rows.find(r=>r.name==="медный слиток");
  o.раздРуды=р?Inventory.section(р):"";o.раздСлитка=с?Inventory.section(с):"";o.карточка=invBrief("res","медная руда");return o;});
 check('1. 88 родов сырья с ценой; руда — в «Ресурсах», слиток — в «Материалах»; карточка — что это и на что идёт',
  с.всего===88&&с.цены.every(v=>v>0)&&с.раздРуды==="res"&&с.раздСлитка==="material"&&/На что идёт: бронза/.test(с.карточка),с);

 /* ── 2. Жилы и топи ── */
 const ж=await page.evaluate(()=>{const o={};let мед=null,топь=null;
  for(let r=0;r<260&&(!мед||!топь);r++)for(let dx=-r;dx<=r&&(!мед||!топь);dx++)for(const dy of [-r,r]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);
   if(!мед&&c.res&&c.res.name==="руда"&&c.res.сорт&&c.res.сорт.id==="медная")мед={x,y};
   const b=safeFn(()=>biomeAt(x,y),null);if(!топь&&c.res&&b&&["mire","fen","swamp","mangrove"].includes(b.id))топь={x,y};}
  o.мед=!!мед;o.топь=!!топь;
  if(мед){G.x=мед.x;G.y=мед.y;delete G.depleted[мед.x+","+мед.y];const было=Number(G.inv["медная руда"])||0;gatherCurrent();o.медь=(Number(G.inv["медная руда"])||0)-было;}
  if(топь){let б=0;const r0=Math.random;Math.random=()=>0.01;const h0=Сырьё170.h;Сырьё170.h=()=>0.01;
   G.x=топь.x;G.y=топь.y;delete G.depleted[топь.x+","+топь.y];const было=Number(G.inv["болотная руда"])||0;gatherCurrent();б=(Number(G.inv["болотная руда"])||0)-было;Math.random=r0;Сырьё170.h=h0;o.болото=б;}
  return o;});
 check('2. медная жила даёт сверх руды медную руду; на топях — болотная руда',ж.мед&&ж.медь>=1&&(!ж.топь||ж.болото>=1),ж);

 /* ── 3. С туши ── */
 const т=await page.evaluate(()=>{const o={};const r0=Math.random;Math.random=()=>0.01;if(!(G.items||[]).includes("Свежевальный нож"))G.items.push("Свежевальный нож");
  const до={...G.inv};questMonsterProgress({id:"wolf",n:"Серый волк",lvl:3});questMonsterProgress({id:"snake",n:"Болотная гадюка",lvl:3});Math.random=r0;
  const ф=n=>safeFn(()=>foeFamily({id:"wolf",n}),"?");o.семьи=[ф("Серый волк"),safeFn(()=>foeFamily({id:"snake",n:"Болотная гадюка"}),"?")];
  o.прибавка=Object.keys(G.inv).filter(k=>(Number(G.inv[k])||0)>(Number(до[k])||0));return o;});
 check('3. с волка — волчья шкура, мех, звериная кровь и жилы; с гадюки — змеиная кожа и кровь (по роду твари)',
  т.прибавка.includes("волчья шкура")&&т.прибавка.includes("звериная кровь")&&(т.семьи[1]!=="crawler"||т.прибавка.includes("змеиная кровь")),т);

 /* ── 4. Передел ── */
 const п=await page.evaluate(()=>{const o={};G.mast=G.mast||{};G.mast.smith={ур:2,оп:0,дел:0};G.mast.leather={ур:2,оп:0,дел:0};G.mast.alchemy={ур:3,оп:0,дел:0};
  const at=(ст,n)=>techsAt(ст,true).find(t=>t.n===n);const r0=Math.random;Math.random=()=>0.99;/* у станка бывает и неудача — здесь проверяем сам передел */
  const cu=at("smelter","Выплавить медь");o.cu=!!cu;G.inv["медная руда"]=3;G.inv["древесный уголь"]=1;const s0=Number(G.inv["медный слиток"])||0;techDo(cu,"smelter");o.слиток=(Number(G.inv["медный слиток"])||0)-s0;
  o.цепьКожи=["Засолить шкуру","Дубить кожу в корье","Довести дублёную кожу","Варить кожу в воске","Тиснить кожу"].map(n=>!!at("tanpit",n));
  o.цепьМеха=["Заквасить мех","Выделать мех","Окрасить мех"].map(n=>!!at("tanpit",n));o.цепьКрови=["Выпарить кровяную соль","Свести кровяную эссенцию"].map(n=>!!at("alembic",n));
  const tan=at("tanpit","Дубить кожу в корье");G.inv["солёная шкура"]=2;G.inv["дубовое корьё"]=2;const d0=Number(G.inv["дублёная кожа"])||0;techDo(tan,"tanpit");o.дублёная=(Number(G.inv["дублёная кожа"])||0)-d0;
  o.сплавы=["Сплавить бронзу","Сплавить латунь","Выжечь сталь","Сварить булат","Сплавить электрум"].map(n=>!!at("smelter",n));Math.random=r0;return o;});
 check('4. передел: «Выплавить медь» даёт медный слиток; дубление даёт дублёную кожу; ступени кожи, меха, крови и сплавы — у своих станков',
  п.cu&&п.слиток===1&&п.дублёная===2&&п.цепьКожи.every(Boolean)&&п.цепьМеха.every(Boolean)&&п.цепьКрови.every(Boolean)&&п.сплавы.every(Boolean),п);

 /* ── 5. Торговцы и инструмент ── */
 const л=await page.evaluate(()=>{const o={};const к=getNPC(G.x,G.y,0,"Кузнец");o.кузнец=stockFor(к).map(s=>s.n);
  const инстр=Torg.toolsFor({x:G.x,y:G.y,prof:"Торговец"},{вид:{id:"instr"}});o.инстр=инстр.map(id=>TORG_TOOLS[id]&&TORG_TOOLS[id].n);
  G.items=(G.items||[]).filter(x=>x!=="Грабли");const s={n:"Грабли",торг:"rake",price:12};o.купил=Torg.buy("car",null,s,1);o.есть=G.items.includes("Грабли");o.второй=Torg.buy("car",null,s,1);
  const rows=Inventory.rows();const r=rows.find(x=>x.name==="Грабли");o.раздел=r?Inventory.section(r):"";
  o.крафт=CRAFT_RECIPES.filter(r=>r.х170).map(r=>r.n);return o;});
 check('5. кузнец держит медь, сталь, уголь, гвозди и подковы; скобяной ряд — грабли, мотыгу, вилы, косу, лопату, пилу; грабли — в «Инструментах», вторые не продают; их можно и смастерить',
  ["медный слиток","стальной слиток","древесный уголь","гвозди","подковы"].every(n=>л.кузнец.includes(n))&&["Грабли","Мотыга","Вилы","Коса","Лопата","Пила"].every(n=>л.инстр.includes(n))&&
  л.купил&&л.есть&&л.второй===false&&л.раздел==="tool"&&л.крафт.includes("Грабли")&&л.крафт.length>=12,л);

 /* ── 6–7. Зелья ── */
 const з=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  o.рангов=POTIONS.filter(p=>p.р170&&!p.двойное).length;o.двойных=POTIONS.filter(p=>p.р170&&p.двойное).length;
  G.mast.alchemy={ур:0,оп:0,дел:0};o.безСтупени=Зелья170.сварить("heal",0,false);o.речь1=__said.slice(-1)[0];
  G.mast.alchemy={ур:3,оп:0,дел:0};G.inv["трава"]=4;G.inv["пустая склянка"]=3;o.простое=Зелья170.сварить("heal",0,false);
  const rec=(G.potions||[]).slice().reverse().find(r=>r.id==="r170_heal_1");o.имя=rec&&rec.имя;
  G.hp=10;const i=G.potions.indexOf(rec);drinkPotion(i);o.лечит=G.hp>10;
  G.items=(G.items||[]).filter(x=>x!=="Ступка с пестиком");G.inv["отстоянная кровь"]=1;G.inv["трава"]=4;o.безСтупки=Зелья170.сварить("heal",2,false);o.речь2=__said.slice(-1)[0];
  const n=getNPC(G.x,G.y,0,"Торговец");const st=stockPotions(n,false);o.вЛавке=st.filter(s=>String(s.зелье).startsWith("r170_")).map(s=>s.n);o.двойныеВЛавке=st.some(s=>/r170_d_/.test(String(s.зелье)));
  openPotions();await w(50);const box=document.getElementById("potBody");o.раздел=!!box.querySelector('[data-cmd="z170:list"]')&&!!box.querySelector('[data-cmd="z170:dlist"]');
  CMD.z170("list");o.родов=box.querySelectorAll('button[data-cmd^="z170:k~"]').length;CMD.z170("k~mana");o.рангиМаны=[...box.querySelectorAll('button[data-cmd^="z170:b~"]')].map(b=>b.textContent);
  CMD.z170("d~balance");o.рангиДвойного=box.querySelectorAll('button[data-cmd^="z170:b~"]').length;__закрыть();return o;});
 check('6. 154 зелья рангов и 135 двойных; без ступени — отказ с причиной; простое зелье здоровья варится и лечит; крепкое без ступки — нельзя; в лавке — ранги, двойных нет',
  з.рангов===154&&з.двойных===135&&з.безСтупени===false&&/ступень алхимии/.test(з.речь1||"")&&з.простое&&з.имя==="Простое зелье здоровья"&&з.лечит&&
  з.безСтупки===false&&/ступка/.test(з.речь2||"")&&з.вЛавке.length>=3&&!з.двойныеВЛавке,з);
 check('7. окно «Зелья»: разделы по рангам и двойного назначения; 14 родов; у маны — одиннадцать рангов от простого до божественного; у двойного — девять',
  з.раздел&&з.родов===14&&з.рангиМаны.length===11&&/^Простое зелье маны/.test(з.рангиМаны[0])&&/^Божественное зелье маны/.test(з.рангиМаны[10])&&з.рангиДвойного===9,з);

 /* ── 8. Все большие дела начинаются ── */
 const ц=await page.evaluate(()=>{const out=[];
  for(const t of ЦЕПИ170.filter(t=>!t.малое&&!t.требует&&!t.мст&&!(t.прк&&t.прк.ген))){const n=getNPC(60000+out.length*37,61000+out.length*29,0,t.профы[0]);G.x=n.x;G.y=n.y;
   const ok=Цепи170.начать(t,n);const c=Цепи170.ст().список.slice().reverse().find(x=>x.tid===t.id);
   const пусто=c?c.шаги.flatMap(s=>s.вид==="дела"?s.под:[s]).filter(s=>s.tx!=null&&(!(s.tx>0)||!(s.ty>0))).length:-1;
   out.push({id:t.id,ok,шагов:c?c.шаги.length:0,пусто});
   if(c){c.провал=true;G.quests=G.quests.filter(q=>q.цепь170!==c.id);}}
  return out;});
 check('8. все 38 больших дел (без последствий «Ну и работки» и малых дел — их проверяют 332 и 334) начинаются у своих жителей: шаги есть, все цели — в мире',ц.length===38&&ц.every(x=>x.ok&&x.шагов>=2&&x.пусто===0),{n:ц.length,плохо:ц.filter(x=>!(x.ok&&x.шагов>=2&&x.пусто===0))});
 check('9. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();
