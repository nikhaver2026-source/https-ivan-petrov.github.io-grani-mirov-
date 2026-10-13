/* ════════════════════════════════════════════════════════════════════════
   НАБОР 325: ТОРГ — ПОЛЗУНОК СЧЁТА ВЕЗДЕ, ИНСТРУМЕНТЫ И ЕДА КРАЯ, ОДНА ФЛЯГА
   (после 16.0)

   Просьбы игрока: «в обозах не работает выбор количества ползунками: там те же
   пункты — купить один, пять, десять и все; во всех местах, где можно купить
   товар, должны быть ползунки»; «расширь товары у обозников и у всех
   торговцев, каждому месту и торговцу — свои, чтобы можно было купить удочку,
   сеть и так далее; и чтобы нужное можно было смастерить»; «флягу можно
   купить только одну».

   1. Обоз: у каждого товара одна строка-ползунок (свайп вверх/вниз, стрелки
      в Windows) — ни «Купить 5», ни «На всё золото»; зелья — так же; скупка —
      ползунок «продать»; сделка проходит выбранным счётом.
   2. Обоз везёт больше (до шести товаров), в окне — «Дорожный припас»
      (инструмент и еда края); купленное ложится в котомку.
   3. Стрелки вверх и вниз на ползунке меняют счёт и команду строки.
   4. Лавочник продаёт верёвку, факел, свечу и удочку; купленная верёвка лежит
      там, где её ищет игра (G.items), а не в запасе ресурсов; вторая
      одиночная не продаётся.
   5. Еда края: у торговца, что держит припас, — блюда своих мест; купленное
      блюдо — в разделе «Еда», и «Съесть» даёт его пользу.
   6. Карточка товара: ползунок вместо «Купить 1, 5, 10, на всё».
   7. Фляга одна: в лавке только больше вашей («Сменить флягу»), ваша — в
      счёт; меньшую купить нельзя.
   8. Мастерская: верёвка, свеча, щуп, отмычки, кирка, топор, серп, точильный
      камень, ремонтный набор; одиночную, что уже есть, не делают — сырьё цело.
   9. Серп травника даёт при сборе травы лишнюю горсть (топор и кирка — тем же путём).
   10. Точильный камень: «Наточить оружие» поднимает состояние клинка.
   11. Старое сохранение: верёвка и факелы из запаса ресурсов переносятся.
   12. Торг поселений Глуби и мастерская Гильдии — ползунок.
   13. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){window.__said.push(String(t));return s0(t,o);};});

 /* ── 1–3. Обоз ── */
 const о1=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  let car=null;for(let rr=8;rr<=400&&!car;rr*=2){for(let h=0;h<24&&!car;h++){const cs=caravansNear(G.x,G.y,G.day,h,rr).filter(c=>c.moving);if(cs.length){car=cs[0];G.hour=h;}}}
  if(!car)return {нет:true};
  G.x=car.x;G.y=car.y;G.place=null;G.gold=1000;const o={carry:car.goods.carry.length,wants:car.goods.wants.slice()};
  const продать=car.goods.wants[0];G.inv[продать]=7;
  meetCaravan(car);await w(200);const body=document.getElementById("caravanBody");
  o.строкБуй=[...body.querySelectorAll('button[data-cnttpl^="carbuyn:"]')].length;
  o.строкЗелий=[...body.querySelectorAll('button[data-cnttpl^="carpotn:"]')].length;
  o.строкПрипаса=[...body.querySelectorAll('button[data-cnttpl^="cartorg:"]')].length;
  o.строкСкупки=[...body.querySelectorAll('button[data-cnttpl^="carselln:"]')].map(b=>({max:b.dataset.cntmax,tpl:b.dataset.cnttpl}));
  o.старые=[...body.querySelectorAll("button")].filter(b=>/Купить \d+ \(|На всё золото|Продать \d+ \(|Продать всё/.test(b.textContent)).length;
  o.припасЗаголовок=!![...body.querySelectorAll("h3")].find(h=>/Дорожный припас/.test(h.textContent));
  /* ползунок: четыре раза вверх — пять штук, сделка */
  const el=body.querySelector('button[data-cnttpl^="carbuyn:"]');const res=String(el.dataset.cnttpl).replace(/^carbuyn:/,"").split("~")[0];
  setCursor(el,true);for(let i=0;i<4;i++)CountRow.nudge(1);o.cmd=el.dataset.cmd;o.речь=el.dataset.speak;
  const было=Number(G.inv[res])||0,g0=G.gold;CMD.carbuyn(el.dataset.cmd.split(":").slice(1).join(":"));await w(150);
  o.куплено=(Number(G.inv[res])||0)-было;o.потрачено=g0-G.gold;o.цена=carBuyPrice(curCaravan||car,res);
  /* скупка ползунком: продать 3 */
  const до=Number(G.inv[продать])||0;CMD.carselln(`${продать}~3`);await w(150);o.продано=до-(Number(G.inv[продать])||0);
  /* припас */
  const b2=document.querySelector('#caravanBody button[data-cnttpl^="cartorg:"]');
  if(b2){const name=String(b2.dataset.cnttpl).replace(/^cartorg:/,"").split("~")[0];const i0=(G.items||[]).filter(x=>x===name).length,inv0=Number(G.inv[name.toLowerCase()])||0;
   CMD.cartorg(`${name}~1`);await w(150);o.припас={name,items:(G.items||[]).filter(x=>x===name).length-i0,inv:(Number(G.inv[name.toLowerCase()])||0)-inv0};}
  /* обозы везут больше прежних трёх товаров */
  const все=caravansNear(G.x,G.y,G.day,G.hour,400).slice(0,12);o.макс=Math.max(...все.map(c=>c.goods.carry.length));
  return o;});
 await p.waitForTimeout(100);
 check('1. обоз: товары, зелья и скупка — ползунки, ни «Купить 5», ни «На всё золото»; сделка проходит выбранным счётом',
  !о1.нет&&о1.строкБуй===о1.carry&&о1.строкЗелий>=2&&о1.старые===0&&о1.строкСкупки.length>=1&&о1.строкСкупки[0].max==="7"
  &&/~5$/.test(о1.cmd)&&/5 из/.test(о1.речь)&&о1.куплено===5&&о1.потрачено===5*о1.цена&&о1.продано===3,о1);
 check('2. обоз: до шести товаров и «Дорожный припас» — инструмент и еда края; купленное ложится в котомку',
  о1.припасЗаголовок&&о1.строкПрипаса>=3&&о1.макс>3&&о1.макс<=6&&о1.припас&&(о1.припас.items===1||о1.припас.inv>=1),о1);

 /* ── 3. Стрелки на ползунке ── */
 const о3=await p.evaluate(async()=>{const body=document.getElementById("caravanBody");const el=body&&body.querySelector('button[data-cnttpl^="carpotn:"]');if(!el)return {нет:true};
  setCursor(el,true);el.focus();return {n0:el.dataset.cntn};});
 await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await p.waitForTimeout(100);
 const о3b=await p.evaluate(()=>{const el=uiCursor;return {n:el&&el.dataset.cntn,cmd:el&&el.dataset.cmd};});
 check('3. стрелки вверх и вниз на ползунке меняют счёт и команду строки',!о3.нет&&о3.n0==="1"&&о3b.n==="3"&&/~3$/.test(о3b.cmd||""),{о3,о3b});
 await p.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 4–6. Лавка ── */
 const о4=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const найти=(виды)=>{for(let rr=0;rr<160;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
    const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!c||!c.structure)continue;const L=safeFn(()=>npcsFor(c),[])||[];
    const n=L.find(n=>n.trade&&виды.includes((safeFn(()=>merchSoul(n),null)||{вид:{}}).вид.id));if(n)return n;}return null;};
  const n=найти(["pripas"]);if(!n)return {нет:"лавочника"};
  G.gold=2000;G.items=(G.items||[]).filter(x=>x!=="Верёвка");delete G.inv["Верёвка"];G.flask="simple";
  const o={торговец:n.name};const st=stockFor(n);o.товар=st.map(s=>s.n);
  o.инстр=["Верёвка","Факел","Свеча","Удочка"].filter(x=>o.товар.includes(x)||(x==="Удочка"&&(G.items||[]).includes("Удочка")));
  openTrade(n.key,"buy");await w(200);
  const ряд=name=>[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].find(b=>(b.dataset.shopname||"")===name);
  const r=ряд("Верёвка");o.max=r&&r.dataset.shopmax;if(r){setCursor(r,true);ShopCount.deal(r);await w(200);}
  o.впредметах=(G.items||[]).includes("Верёвка");o.взапасе=Number(G.inv["Верёвка"])||0;o.послеРяд=!!ряд("Верёвка");
  /* еда края: два блюда */
  const еда=stockFor(n).map((s,i)=>({s,i})).filter(x=>x.s.торг==="food");o.еды=еда.map(x=>x.s.n);
  if(еда.length){const name=еда[0].s.n;const rows=shopStockRows(n);const idx=rows.findIndex(x=>x.name===name);o.род=rows[idx].cat;
   SHOP.tab="buy";SHOP.sel={idx,tab:"buy"};const было=(G.items||[]).filter(x=>x===name).length;shopAsk("buy",2);await w(150);
   o.блюдо={name,куплено:(G.items||[]).filter(x=>x===name).length-было};o.раздел=invCategoryOf({kind:"item",name});
   const row=invAll().find(x=>x.name===name);const a=ITEM_ACTIONS.find(a=>a.id==="eat");let текст="";
   if(row&&a){const hp0=G.hp;G.hp=Math.max(1,G.hp-30);a.делать(row,invContext(),t=>{текст=String(t);return true;});o.съедено=текст;o.hp=G.hp;}}
  /* карточка: ползунок вместо кнопок счёта */
  const rows=shopStockRows(n);const ci=rows.findIndex(x=>x.count&&x.s&&x.s.торг==="food")>=0?rows.findIndex(x=>x.count&&x.s&&x.s.торг==="food"):rows.findIndex(x=>x.count);
  SHOP.tab="buy";shopItemCard(ci);await w(100);const box=document.getElementById("shopBody");
  o.карточка={ползунок:!!box.querySelector('button[data-cnttpl^="shopask:buy:"]'),старые:[...box.querySelectorAll("button")].filter(b=>/Купить \d+ \(|На всё золото/.test(b.textContent)).length};
  while(activeLayer())closeTopUI();return o;});
 check('4. лавочник продаёт верёвку, факел, свечу и удочку; купленная верёвка — в котомке (G.items), не в запасе ресурсов; вторую не предлагают',
  !о4.нет&&о4.инстр.length===4&&о4.max==="1"&&о4.впредметах&&о4.взапасе===0&&!о4.послеРяд,о4);
 check('5. еда края: блюда своих мест; купленное — в разделе «Еда», «Съесть» даёт пользу',
  о4.еды&&о4.еды.length>=2&&о4.род==="food"&&о4.блюдо&&о4.блюдо.куплено===2&&о4.раздел==="food"&&/здоровья|воды|силы|сытно/i.test(о4.съедено||""),о4);
 check('6. карточка товара: ползунок вместо «Купить 1, 5, 10, на всё»',о4.карточка&&о4.карточка.ползунок&&о4.карточка.старые===0,о4.карточка);

 /* ── 7. Фляга одна ── */
 const о7=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  let n=null;for(let rr=0;rr<120&&!n;rr++)for(let dx=-rr;dx<=rr&&!n;dx++)for(let dy=-rr;dy<=rr&&!n;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
   const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!c||!c.structure)continue;n=(safeFn(()=>npcsFor(c),[])||[]).find(z=>z.trade)||null;}
  if(!n)return {нет:true};G.gold=2000;G.flask="leather";G.water=50;const o={};
  const фляги=stockFor(n).filter(s=>s.фляга);o.фляги=фляги.map(s=>({n:s.n,cap:FLASK_BY_ID[s.фляга].cap,price:s.price,вСчёт:s.вСчёт}));
  o.меньше=Body.buyFlask("small",3);o.послеМеньшей=G.flask;
  openTrade(n.key,"buy");await w(150);const r=[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].find(b=>/^Сменить флягу/.test(b.dataset.shopname||""));
  o.max=r&&r.dataset.shopmax;o.речь=r&&r.dataset.speak;const g0=G.gold;if(r){setCursor(r,true);ShopCount.deal(r);await w(150);}
  o.новая=G.flask;o.потрачено=g0-G.gold;o.флягВСумке=invAll().filter(x=>x.kind==="flask").length;
  while(activeLayer())closeTopUI();return o;});
 check('7. фляга одна: в лавке только больше вашей («Сменить флягу», ваша — в счёт), без счёта; меньшую купить нельзя',
  !о7.нет&&о7.фляги.length>=1&&о7.фляги.every(f=>f.cap>120&&/^Сменить флягу:/.test(f.n)&&f.вСчёт>0)&&о7.меньше===false&&о7.послеМеньшей==="leather"
  &&о7.max==="1"&&!/за штуку/.test(о7.речь||"")&&о7.новая!=="leather"&&FLASK_CAP_OK(о7)&&о7.флягВСумке===1,о7);

 /* ── 8. Мастерская ── */
 const о8=await p.evaluate(()=>{const o={};G.inv.трава=20;G.inv.руда=10;G.inv.дерево=10;G.inv.кость=5;G.inv.камень=6;G.inv.шкура=3;
  G.items=(G.items||[]).filter(x=>!["Верёвка","Топор лесоруба","Серп травника","Щуп ловчего"].includes(x));delete G.inv.кирка;delete G.inv.отмычка;
  if(!(G.items||[]).includes("Удочка"))G.items.push("Удочка");
  const idx=n=>CRAFT_RECIPES.findIndex(r=>r.n===n);o.рецепты=CRAFT_RECIPES.map(r=>r.n);
  const трава0=G.inv.трава;CMD.craftdo(idx("Верёвка"));o.верёвка=(G.items||[]).includes("Верёвка");o.траваПосле=G.inv.трава;
  CMD.craftdo(idx("Верёвка"));o.траваПовтор=G.inv.трава;o.верёвок=(G.items||[]).filter(x=>x==="Верёвка").length;
  const трава1=G.inv.трава,дерево1=G.inv.дерево;CMD.craftdo(idx("Удочка"));o.удочкаСырьё=[G.inv.трава===трава1,G.inv.дерево===дерево1];
  CMD.craftdo(idx("Отмычка"));o.отмычек=Number(G.inv.отмычка)||0;CMD.craftdo(idx("Кирка"));o.кирка=Number(G.inv.кирка)||0;
  CMD.craftdo(idx("Топор лесоруба"));CMD.craftdo(idx("Точильный камень"));CMD.craftdo(idx("Ремонтный набор"));CMD.craftdo(idx("Свеча"));CMD.craftdo(idx("Щуп ловчего"));CMD.craftdo(idx("Серп травника"));
  o.вещи=["Топор лесоруба","Точильный камень","Ремонтный набор","Свеча","Щуп ловчего","Серп травника"].filter(x=>(G.items||[]).includes(x));
  o.трава0=трава0;return o;});
 check('8. мастерская: новые рецепты делаются; одиночную, что уже есть, не делают — сырьё цело (и удочку тоже)',
  о8.рецепты.length>=14&&о8.верёвка&&о8.траваПосле===о8.трава0-3&&о8.траваПовтор===о8.траваПосле&&о8.верёвок===1&&о8.удочкаСырьё.every(Boolean)
  &&о8.отмычек===2&&о8.кирка===1&&о8.вещи.length===6,о8);

 /* ── 9. Серп травника ── */
 const о9=await p.evaluate(()=>{const o={};G.place=null;G.inCombat=false;G.ship=null;
  const клетки=[];for(let rr=1;rr<200&&клетки.length<2;rr++)for(let dx=-rr;dx<=rr&&клетки.length<2;dx++)for(const dy of [-rr,rr]){const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);
   if(c&&c.res&&c.res.name==="трава"&&!c.structure&&c.res.qty>=2)клетки.push([G.x+dx,G.y+dy]);}
  if(клетки.length<2)return {нет:true};const x0=G.x,y0=G.y;
  const сбор=([x,y])=>{G.x=x;G.y=y;delete G.depleted[x+","+y];const б=Number(G.inv.трава)||0;gatherCurrent("tap");return (Number(G.inv.трава)||0)-б;};
  G.items=(G.items||[]).filter(x=>x!=="Серп травника");o.без=сбор(клетки[0]);G.items.push("Серп травника");o.с=сбор(клетки[1]);
  o.речь=(window.__said||[]).slice(-1)[0];G.x=x0;G.y=y0;return o;});
 check('9. серп травника даёт при сборе травы лишнюю горсть и это сказано',!о9.нет&&о9.с===о9.без+1&&/Серп травника/.test(о9.речь||""),о9);

 /* ── 10. Точильный камень ── */
 const о10=await p.evaluate(()=>{const it=G.equip&&G.equip.weapon;if(!it||typeof it!=="object")return {нет:"оружия"};it.сост=50;
  if(!(G.items||[]).includes("Точильный камень"))G.items.push("Точильный камень");const row=invAll().find(x=>x.name==="Точильный камень");
  const a=ITEM_ACTIONS.find(a=>a.id==="torgwhet");const можно=a.можно(row,invContext());let t="";if(можно===true)a.делать(row,invContext(),x=>{t=String(x);return true;});
  return {можно,сост:itemCondition(it),бафф:buffActive("заточка"),t,камней:(G.items||[]).filter(x=>x==="Точильный камень").length};});
 check('10. точильный камень: «Наточить оружие» поднимает состояние клинка и даёт заточку',о10.можно===true&&о10.сост===80&&о10.бафф&&/Наточено/.test(о10.t),о10);

 /* ── 11. Старое сохранение ── */
 const о11=await p.evaluate(()=>{G.items=(G.items||[]).filter(x=>x!=="Верёвка"&&x!=="Факел");G.inv["Верёвка"]=1;G.inv["Факел"]=3;G.inv["Отмычка"]=2;delete G.inv.отмычка;
  const n=Torg.migrate();return {n,верёвка:(G.items||[]).includes("Верёвка"),факелов:(G.items||[]).filter(x=>x==="Факел").length,остаток:["Верёвка","Факел","Отмычка"].filter(k=>G.inv[k]),отмычек:G.inv.отмычка};});
 check('11. старое сохранение: верёвка, факелы и отмычки из запаса ресурсов переносятся туда, где их ищет игра',
  о11.n===6&&о11.верёвка&&о11.факелов===3&&о11.остаток.length===0&&о11.отмычек===2,о11);

 /* ── 12. Глубь и Гильдия ── */
 const о12=await p.evaluate(async()=>{const o={};
  const box=document.getElementById("dpBody");if(box){box.innerHTML=`<button class="item" data-cmd="dp:buy:2:тишь-смола">Купить тишь-смола — 30 золота (есть 4)</button><button class="item" data-cmd="dp:sell:2:руда">Продать руда — 9 золота (у вас 6)</button>`;
   G.gold=1000;G.inv.руда=6;Torg.deepPost(2);o.глубь=[...box.querySelectorAll("button")].map(b=>({tpl:b.dataset.cnttpl,max:b.dataset.cntmax}));}
  if(typeof НемЛюди!=="undefined"&&typeof НЕМ_СЫРЬЁ!=="undefined"){G.gold=3000;НемЛюди.лавка();await new Promise(q=>setTimeout(q,150));
   const b=document.querySelector('#eventBody button[data-cnttpl^="evt:"]');o.гильдия=!!b;
   if(b){const r=Object.keys(НЕМ_СЫРЬЁ).find(k=>String(b.dataset.cntname).toLowerCase()===k.toLowerCase());const было=Number(G.inv[r])||0;
    const i=String(b.dataset.cnttpl).replace(/^evt:/,"").split("~")[0];CMD.evt(`${i}~3`);await new Promise(q=>setTimeout(q,150));o.сырьё={r,куплено:(Number(G.inv[r])||0)-было};}
   while(activeLayer())closeTopUI();}
  return o;});
 check('12. торг поселений Глуби и мастерская Гильдии — ползунок счёта; сырьё Гильдии берётся выбранным счётом',
  о12.глубь&&о12.глубь.length===2&&о12.глубь[0].tpl==="dp:buyn:2:тишь-смола:{n}"&&о12.глубь[0].max==="4"&&о12.глубь[1].max==="6"
  &&(о12.гильдия===undefined||(о12.гильдия&&о12.сырьё&&о12.сырьё.куплено===3)),о12);

 check('13. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 console.log(`${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
function FLASK_CAP_OK(o){return o.потрачено>0&&o.фляги.some(f=>f.price===o.потрачено);}
