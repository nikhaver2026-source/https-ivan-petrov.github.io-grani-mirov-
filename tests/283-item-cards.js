/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 283: 13.5 — КАРТОЧКА ВЕЩИ

   Просьба игрока: «нет описаний для многих вещей, для чего они нужны, их
   истории; в описании только за сколько можно продать и где добыто. У
   каждой вещи должно быть описание, что это за вещь, её характеристики,
   почему она так называется и с чем связано, и контекстные действия с ней —
   в зависимости от места».

   1. У каждого ресурса мира есть «что это» и «откуда имя».
   2. «Осмотреть» открывает карточку: что это, свойства, откуда имя, где
      берут, на что идёт — и действия, доступные здесь, кнопками.
   3. Действия зависят от места: у горна руду можно плавить, вдали — нельзя,
      и карточка называет причину.
   4. Трава: пора, место, способ сбора и зелья; рыба — где ловится.
   5. Местный ресурс яруса объясняет основу и примету своего яруса.
   6. Снаряжение: имя по словам (качество, материал, род), история, применение.
   7. Вещь течения и реликвия яруса — со своим описанием и в строке выбора.
   8. Кнопка действия в карточке работает; ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});
 const карта=(kind,key)=>p.evaluate(([kind,key])=>{const row=invRow(kind,encodeURIComponent(key));if(!row)return null;ItemCard.show(row);
  const lines=[...document.querySelectorAll('#invActBody [data-speak]')].map(e=>e.dataset.speak);const btns=[...document.querySelectorAll('#invActBody [data-cmd^="invdo:"]')].map(b=>b.dataset.cmd);
  return {lines,btns,open:!document.getElementById("modal-invact").hidden};},[kind,key]);

 /* ── 1 ── */
 const словарь=await p.evaluate(()=>{const all=[...new Set(Object.keys(RES_BASE).concat(Object.keys(SORT_GOODS||{})))];
  const безЧто=all.filter(n=>!PLANT_BY_NAME[n]&&!ItemCard.lore(n).о&&!(FISH||[]).some(f=>f.n===n));const безИмени=all.filter(n=>!ItemCard.lore(n).имя);
  const глубь=[];DEEP_BIOMES.forEach(b=>b.ресурсы.forEach(r=>{if(!ItemCard.lore(r).о||!ItemCard.lore(r).имя)глубь.push(r);}));
  return {всего:all.length,безЧто,безИмени,глубь};});
 check('1. у каждого ресурса мира и пород Глуби есть «что это» и «откуда имя»',словарь.всего>=250&&!словарь.безЧто.length&&!словарь.безИмени.length&&!словарь.глубь.length,словарь);

 /* ── 2 ── */
 await p.evaluate(()=>{G.inv["руда"]=3;});
 const руда=await p.evaluate(()=>{const row=invRow("res","руда");const a=ITEM_ACTIONS.find(x=>x.id==="look");const r=a.делать(row,invContext());
  const lines=[...document.querySelectorAll('#invActBody [data-speak]')].map(e=>e.dataset.speak);return {keep:r,lines,open:!document.getElementById("modal-invact").hidden};});
 const разделы=["Что это: ","Свойства: ","Откуда имя: ","Где берут: ","На что идёт: "];
 check('2. «Осмотреть» открывает карточку: что это, свойства, откуда имя, где берут, на что идёт, действия здесь',
  руда.keep==="keep"&&руда.open&&разделы.every(h=>руда.lines.some(l=>l.startsWith(h)))&&руда.lines.some(l=>/^Что можно сделать здесь/.test(l))
  &&руда.lines.some(l=>/рыжее/.test(l))&&руда.lines.some(l=>/киркой/.test(l))&&руда.lines.some(l=>/Дробить породу|слиток/.test(l)),руда.lines);
 await p.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 3 ── */
 const место=await p.evaluate(()=>{const row=invRow("res","руда");const keep=invContext;
  invContext=()=>Object.assign(keep(),{станки:new Set(["forge"])});ItemCard.show(row);const уГорна=[...document.querySelectorAll('#invActBody [data-cmd^="invdo:"]')].map(b=>b.dataset.cmd);
  invContext=keep;ItemCard.show(row);const вдали=[...document.querySelectorAll('#invActBody [data-cmd^="invdo:"]')].map(b=>b.dataset.cmd);
  const почему=[...document.querySelectorAll('#invActBody [data-speak]')].map(e=>e.dataset.speak).find(l=>/^Можно в другом месте/.test(l))||"";
  while(activeLayer())closeTopUI();return {уГорна:уГорна.some(c=>c.startsWith("invdo:melt:")),вдали:вдали.some(c=>c.startsWith("invdo:melt:")),почему};});
 check('3. действия по месту: у горна руду плавят, вдали — нельзя, и карточка говорит почему',место.уГорна&&!место.вдали&&/горн/.test(место.почему),место);

 /* ── 4 ── */
 await p.evaluate(()=>{G.inv["сон-трава"]=2;G.inv["треска"]=1;});
 const трава=await карта("plant","сон-трава"),рыба=await карта("fish","треска");
 check('4. трава: пора, место, способ сбора и зелья; рыба: где ловится и откуда имя',
  трава&&трава.lines.some(l=>/^Где берут: .*(весна|лето).*как: /.test(l))&&трава.lines.some(l=>/^На что идёт: Зелья: /.test(l))
  &&рыба&&рыба.lines.some(l=>/^Где берут: Ловится: /.test(l))&&рыба.lines.some(l=>/^Откуда имя: .*трес/.test(l)),{трава:трава&&трава.lines,рыба:рыба&&рыба.lines});

 /* ── 5 ── */
 await p.evaluate(()=>{G.inv["старое железо с медным отливом"]=1;});
 const местный=await карта("res","старое железо с медным отливом");
 check('5. местный ресурс яруса объясняет основу и примету яруса',местный&&местный.lines.some(l=>/^Откуда имя: «старое железо».*«с медным отливом» — примета яруса/.test(l))&&местный.lines.some(l=>/местный ресурс подземелья/.test(l)),местный&&местный.lines);

 /* ── 6 ── */
 const меч=await карта("equip","weapon");
 check('6. снаряжение: имя по словам — качество, материал, род; история и применение',
  меч&&меч.lines.some(l=>/^Откуда имя: .*качество работы.*материал.*«меч» — /.test(l))&&меч.lines.some(l=>/^История: /.test(l))&&меч.lines.some(l=>/^Применение: .*наковальн/.test(l)),меч&&меч.lines);

 /* ── 7 ── */
 const течение=await p.evaluate(()=>{G.items=(G.items||[]).concat(["Вещь течения: флейта, что зовёт дождь","Реликвия подземелья: фонарь немой жрицы"]);
  const i1=String(G.items.indexOf("Вещь течения: флейта, что зовёт дождь")),i2=String(G.items.indexOf("Реликвия подземелья: фонарь немой жрицы"));
  ItemCard.show(invRow("item",i1));const л1=[...document.querySelectorAll('#invActBody [data-speak]')].map(e=>e.dataset.speak);
  ItemCard.show(invRow("item",i2));const л2=[...document.querySelectorAll('#invActBody [data-speak]')].map(e=>e.dataset.speak);while(activeLayer())closeTopUI();
  return {л1,л2,б1:invBrief("item",i1),б2:invBrief("item",i2)};});
 check('7. вещь течения и реликвия яруса — со своим описанием, свойствами и именем, и в строке выбора',
  течение.л1.some(l=>/вещь течения «Круг Пяти Перемен»/.test(l))&&течение.л1.some(l=>/^Свойства: Вода в ваших чарах сильнее/.test(l))
  &&течение.л2.some(l=>/«немой жрицы» — её прежний хозяин/.test(l))&&/вещь течения/.test(течение.б1)&&/реликвия яруса/.test(течение.б2)&&!/святыня бога/.test(течение.б2),течение);

 /* ── 8 ── */
 const кнопка=await p.evaluate(()=>{G.inv["руда"]=3;const row=invRow("res","руда");ItemCard.show(row);const b=[...document.querySelectorAll('#invActBody [data-cmd^="invdo:split"]')][0];
  if(!b)return {нет:1};const cmd=b.dataset.cmd;const [_,id,kind,key]=cmd.split(":");invDo(id,kind,key);return {cmd,было:3,стало:Number(G.inv["руда"])||0,отложено:!!(INV&&INV.split)||Object.keys(G.inv).some(k=>/^__/.test(k))};});
 check('8. кнопка действия в карточке выполняет действие',!кнопка.нет&&(кнопка.стало<3||кнопка.отложено),кнопка);
 check('9. ошибок страницы нет',errors.length===0,errors.slice(0,5));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
