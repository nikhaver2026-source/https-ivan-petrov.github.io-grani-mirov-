/* ════════════════════════════════════════════════════════════════════════
   СТО ЯРУСОВ ГРАНИ, СТРАЖИ И КАЗНА

   Подземелья обычного мира кончались на пятом ярусе: дальше был сплошной
   камень, и вся глубина игры умещалась в пять минут спуска. Теперь их сто,
   как и за Гранью, но лицо у них своё — подвалы, штольни, затопленные
   горизонты, кристальные жилы, магмовые карманы, провалы, корни мира и
   Порог Грани. Чем ниже, тем злее твари, тем дороже добыча и тем другое
   всё: пол под ногами, отклик палаты, голос глубины.

   Спуск больше не бесплатен. На каждом ярусе стоит страж — он стоит на
   самой шахте, и пока он жив, вниз хода нет. Убил — иди дальше, и он не
   встанет во второй раз.

   За запертой дверью лежит не «сундук получше», а казна яруса: несколько
   вещей разных родов, слитки и самоцветы, и одна именная вещь своего
   круга, которая больше нигде не повторится.

   Здесь проверяется, что всё это есть, считается от глубины, помнится
   между заходами и звучит по-своему.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Сто ярусов и десять кругов ── */
 const круги=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const предел=maxDepthHere();
  const имена=[],полы=new Set(),отклики=new Set(),голоса=new Set(),беды=[];
  for(let d=1;d<=100;d++){
   const к=lightCircle(d);
   if(!к||!к.n||!к.род||!к.порода||!к.голос||!к.беда)беды.push("ярус "+d);
   if(!SOUND_BANK[к.голос]&&!BEACONS[к.голос])беды.push("нет голоса "+к.голос);
   имена.push(к.n);голоса.add(к.голос);
   G.place={kind:"dungeon",bx:400,by:400,stype:"ruins",depth:d,name:"п",x:1,y:1};
   полы.add(indoorSurface());отклики.add(roomKind());}
  G.place=null;
  const вес=[1,25,50,75,100].map(d=>+depthWeight(d).toFixed(2));
  return {предел,кругов:new Set(имена).size,полов:полы.size,откликов:отклики.size,
   голосов:голоса.size,беды:беды.slice(0,4),вес,
   первый:lightCircle(1).n,последний:lightCircle(100).n};});
 check('в обычном мире сто ярусов, а не пять',круги.предел===100,круги.предел);
 check('сто ярусов разбиты на десять непохожих кругов',
  круги.кругов===10&&круги.беды.length===0,{кругов:круги.кругов,беды:круги.беды});
 check('у кругов свой пол под ногами',круги.полов>=6,круги.полов);
 check('у кругов своя акустика палаты',круги.откликов>=4,круги.откликов);
 check('у каждого круга свой голос, и он есть в записях',круги.голосов>=8,круги.голосов);
 check('первый круг — подвалы, последний — порог Грани',
  /подвал/i.test(круги.первый)&&/порог/i.test(круги.последний),круги);
 check('чем ниже, тем злее: вес глубины растёт и на Грани',
  круги.вес[0]<круги.вес[4]&&круги.вес[4]>5,круги.вес);

 /* ── 2. Твари глубины ── */
 const твари=await page.evaluate(()=>{
  G.dark=false;
  const доля=d=>{const п=deepPoolFor(d);
   return {всего:п.length,своих:п.filter(m=>String(m.id||"").startsWith("deep_")).length};};
  const своиИмена=new Set(DEEP_MONSTERS.map(m=>m.n));
  return {верх:доля(2),середина:доля(15),низ:доля(60),
   видов:DEEP_MONSTERS.length,уникальны:своиИмена.size===DEEP_MONSTERS.length,
   титулы:[5,12,25,40,60,80,95,100].map(d=>depthTitle(d))};});
 check('глубинных тварей двенадцать видов, и все разные',
  твари.видов===12&&твари.уникальны===true,{видов:твари.видов});
 check('наверху обычные твари, в середине смесь, внизу — только глубинные',
  твари.верх.своих===0&&твари.середина.своих>0&&
  твари.низ.своих/твари.низ.всего>0.8,твари);
 check('одна и та же тварь на сотом ярусе носит титул, а на пятом — нет',
  твари.титулы[0]===null&&твари.титулы[2]==="древний"&&
  твари.титулы[7]==="тот, кого не считают",твари.титулы);

 /* ── 3. Страж стоит на каждом ярусе ── */
 const страж=await page.evaluate(()=>{
  G.dark=false;G.guards={};
  const беды=[];let имён=new Set();
  for(let d=1;d<=100;d++){
   const g=guardianAt(700,700,d);
   if(!g){беды.push("ярус "+d+" без стража");continue;}
   if(!g.страж||!(g.hp>0)||!(g.lvl>0)||!g.n)беды.push("ярус "+d+": страж неполон");
   имён.add(g.n);}
  const a=guardianAt(700,700,1),b=guardianAt(700,700,1);
  const низ=guardianAt(700,700,100),верх=guardianAt(700,700,1);
  /* Круг слышен в имени: страж подвалов и страж Порога — не одно и то же. */
  const вИмени=/подвал/i.test(верх.n)&&/порог/i.test(низ.n);
  return {беды:беды.slice(0,4),имён:имён.size,
   одинаков:a.n===b.n&&a.hp===b.hp,
   верхHP:верх.hp,низHP:низ.hp,верхLvl:верх.lvl,низLvl:низ.lvl,вИмени,
   имяВерх:верх.n,имяНиз:низ.n};});
 check('страж стоит на каждом из ста ярусов',страж.беды.length===0,страж.беды);
 check('страж одного яруса всегда один и тот же',страж.одинаков===true);
 check('стражи не на одно лицо: имён много',страж.имён>=30,страж.имён);
 check('глубина делает стража сильнее в разы',
  страж.низHP>страж.верхHP*20&&страж.низLvl>страж.верхLvl*5,
  {верхHP:страж.верхHP,низHP:страж.низHP,верхLvl:страж.верхLvl,низLvl:страж.низLvl});
 check('в имени стража слышен его круг',страж.вИмени===true,
  {верх:страж.имяВерх,низ:страж.имяНиз});

 /* ── 4. Пока страж жив, вниз хода нет ── */
 const ворота=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.guards={};G.hp=G.hpMax=9000;G.inCombat=false;
  G.place={kind:"dungeon",bx:820,by:640,stype:"ruins",depth:3,name:"Руины",x:1,y:1};
  const был=!!guardianHere();
  window.__said=[];
  const отказ=changeDepth(1);
  const словаОтказа=речь();
  const глубинаПосле=G.place.depth;
  markGuardianDead(820,640,3);
  const ушёлЛи=!guardianHere();
  window.__said=[];
  const пустили=changeDepth(1);
  const глубинаПотом=G.place.depth;
  /* Ярусом ниже стоит свой страж — спуск снова закрыт. */
  const сноваСтраж=!!guardianHere();
  const сноваОтказ=changeDepth(1);
  G.place=null;
  return {был,отказ,словаОтказа:словаОтказа.slice(0,160),глубинаПосле,ушёлЛи,
   пустили,глубинаПотом,сноваСтраж,сноваОтказ};});
 check('пока страж жив, спуск не проходит',
  ворота.был===true&&ворота.отказ===false&&ворота.глубинаПосле===3,ворота);
 check('отказ объясняет, кто держит шахту и что делать',
  /страж|стоит/i.test(ворота.словаОтказа)&&/бой/i.test(ворота.словаОтказа),
  ворота.словаОтказа);
 check('убитый страж больше не встаёт, и шахта открывается',
  ворота.ушёлЛи===true&&ворота.пустили===true&&ворота.глубинаПотом===4,ворота);
 check('на следующем ярусе стоит свой страж, и он снова держит спуск',
  ворота.сноваСтраж===true&&ворота.сноваОтказ===false,ворота);

 /* ── 5. Победа над стражем платит казной круга ── */
 const победа=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.guards={};G.gold=0;G.gear=[];G.items=[];G.hp=G.hpMax=9000;
  G.place={kind:"dungeon",bx:900,by:300,stype:"ruins",depth:8,name:"Руины",x:2,y:2};
  const g=guardianHere();
  G.place.pendingGuard={bx:900,by:300,depth:8};
  const золотоДо=G.gold,вещейДо=G.gear.length;
  G.combat={m:g,own:false,key:null};G.inCombat=true;
  window.__said=[];
  safeFn(()=>victory());
  const мёртв=guardianDead(900,300,8);
  const добыча=(G.loot||[]).slice();
  const глубиннаяВещь=добыча.some(l=>l.type==="gear"&&l.item&&l.item.глубина===8);
  while(activeLayer())closeTopUI();
  G.place=null;G.inCombat=false;G.combat=null;
  return {мёртв,добычи:добыча.length,золото:добыча.filter(l=>l.type==="gold").length,
   глубиннаяВещь,сказано:речь().slice(0,200)};});
 check('павший страж записан мёртвым и не воскресает',победа.мёртв===true,победа);
 check('за стража платят казной круга: золото сверх обычного и вещь глубины',
  победа.золото>=2&&победа.глубиннаяВещь===true,победа);

 /* ── 6. Добыча глубины ── */
 const добыча=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const ряд=[1,10,30,50,80,100].map(d=>{
   const it=deepLoot(d,4242);
   return {d,rank:it.rank,qual:it.qual,val:it.val,price:it.price,
    черта:it.черта||null,круг:!!it.круг,вИмени:it.name.includes(it.круг.toLowerCase())};});
  /* До сорокового яруса свойств не бывает, с сорокового — бывают. */
  let доСорока=0,послеСорока=0;
  for(let d=5;d<40;d++)if(deepLoot(d,d*7).черта)доСорока++;
  for(let d=40;d<=100;d++)if(deepLoot(d,d*7).черта)послеСорока++;
  const черт=new Set();
  for(let d=40;d<=100;d++)черт.add(deepLoot(d,d*13).черта);
  /* Свойство названо словами, а не кодом. */
  const назвали=DEEP_TRAITS.every(t=>t.n&&t.d&&t.n.length>3&&t.d.length>10);
  const слоты=new Set();for(let i=0;i<60;i++)слоты.add(deepLoot(60,i).slot);
  return {ряд,доСорока,послеСорока,черт:черт.size,назвали,слоты:[...слоты]};});
 check('добыча глубины растёт в ранге и цене вместе с ярусом',
  добыча.ряд[0].price<добыча.ряд[5].price/20&&добыча.ряд[5].rank>=4&&
  добыча.ряд[0].val<добыча.ряд[5].val,добыча.ряд);
 check('вещь глубины носит имя своего круга',
  добыча.ряд.every(r=>r.круг&&r.вИмени),добыча.ряд);
 check('свойства начинаются с сорокового яруса и не раньше',
  добыча.доСорока===0&&добыча.послеСорока>=55,
  {доСорока:добыча.доСорока,послеСорока:добыча.послеСорока});
 check('свойств глубины много и все названы словами',
  добыча.черт>=7&&добыча.назвали===true,{черт:добыча.черт});
 check('в глубине находятся вещи всех родов',добыча.слоты.length===3,добыча.слоты);

 /* ── 7. Свойство вещи работает в руках ── */
 const свойство=await page.evaluate(()=>{
  const было=G.equip&&G.equip.weapon;
  G.equip=G.equip||{};
  G.equip.weapon=null;
  const нет=gearTrait("keen");
  const it=deepLoot(80,5);it.черта="keen";it.slot="weapon";
  G.equip.weapon=it;
  const есть=gearTrait("keen");
  const чужое=gearTrait("heavy");
  G.equip.weapon=было||null;
  return {нет,есть,чужое};});
 check('свойство глубины считается по надетому, а не по мешку',
  свойство.нет===false&&свойство.есть===true&&свойство.чужое===false,свойство);

 /* ── 8. Ни один ярус из ста не остаётся без спуска ── */
 const шахты=await page.evaluate(()=>{
  G.dark=false;
  const безСпуска=[],совпало=[];
  let прежняя=null;
  for(let d=0;d<=99;d++){
   const lvl=genLevel(66,77,d,"ruins");
   let есть=false;
   for(let y=0;y<lvl.h&&!есть;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]===">"){есть=true;break;}
   if(!есть)безСпуска.push(d);
   const s=shaftSpot(66,77,d);
   if(прежняя&&s.x===прежняя.x&&s.y===прежняя.y)совпало.push(d);
   прежняя=s;}
  /* Спуск и подъём ярусом ниже стоят на одной клетке: шахта отвесна. */
  const пары=[];
  for(let d=0;d<20;d++){
   const s=shaftSpot(66,77,d);
   const ниже=genLevel(66,77,d+1,"ruins");
   пары.push(ниже.g[s.y]&&ниже.g[s.y][s.x]==="<");}
  return {безСпуска:безСпуска.slice(0,5),совпало:совпало.slice(0,5),
   отвес:пары.filter(Boolean).length,пар:пары.length};});
 check('ни один из ста ярусов не остаётся без спуска',
  шахты.безСпуска.length===0,шахты.безСпуска);
 check('шахта соседних ярусов не стоит на одном месте дважды',
  шахты.совпало.length===0,шахты.совпало);
 check('спуск выводит ровно на подъём ярусом ниже',
  шахты.отвес===шахты.пар,шахты);

 /* ── 9. Казна сокровищницы ── */
 const казна=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.trove={};
  const ряд=[1,30,60,100].map(d=>{
   const h=vaultHoard(d,9001);
   return {d,gold:h.gold,вещей:h.gear.length,
    слоты:[...new Set(h.gear.map(g=>g.slot))].length,
    цена:h.gear.reduce((a,g)=>a+g.price,0),
    припас:Object.keys(h.mats).length,
    сокровище:!!h.сокровище,круг:h.круг};});
  /* Именные сокровища не повторяются, пока список не разобран. */
  G.trove={};const имена=[];
  for(let i=0;i<VAULT_TREASURES.length+3;i++){
   const t=vaultTreasure(50,i*37+5);if(!t)break;
   имена.push(t.n);markTreasureTaken(t.n);}
  const повторов=имена.length-new Set(имена).size;
  /* Каждое сокровище названо и описано. */
  const описаны=VAULT_TREASURES.every(t=>t.n&&t.д&&t.ц>0&&t.д.length>12);
  const цены=VAULT_TREASURES.map(t=>t.ц);
  const растут=цены.every((c,i)=>i===0||c>цены[i-1]);
  /* Припас казны — не грибы из ящика: слитки и самоцветы имеют цену. */
  const торгуются=(RES_BASE["слиток"]||0)>50&&(RES_BASE["самоцвет"]||0)>50&&
   !!RESICON["слиток"]&&!!RESICON["самоцвет"];
  G.trove={};
  return {ряд,взято:имена.length,повторов,описаны,растут,торгуются,
   всего:VAULT_TREASURES.length};});
 check('казна палаты выдаёт вещи всех родов сразу, а не одну',
  казна.ряд.every(r=>r.вещей>=2)&&казна.ряд[3].вещей>=5&&
  казна.ряд[3].слоты===3,казна.ряд);
 check('чем глубже палата, тем богаче казна',
  казна.ряд[0].gold<казна.ряд[3].gold/20&&
  казна.ряд[0].цена<казна.ряд[3].цена/50,казна.ряд.map(r=>({d:r.d,gold:r.gold,цена:r.цена})));
 check('в казне лежит припас и именное сокровище своего круга',
  казна.ряд.every(r=>r.припас>=2&&r.сокровище&&r.круг)&&казна.ряд[3].припас>=4,казна.ряд);
 check('именных сокровищ много, все описаны и дорожают к Дну',
  казна.всего>=20&&казна.описаны===true&&казна.растут===true,
  {всего:казна.всего,описаны:казна.описаны,растут:казна.растут});
 check('именное сокровище не выпадает дважды',
  казна.взято===казна.всего&&казна.повторов===0,
  {взято:казна.взято,всего:казна.всего,повторов:казна.повторов});
 check('слитки и самоцветы — настоящий груз: их видно и можно продать',
  казна.торгуются===true);

 /* ── 10. Палата отдаёт казну на деле ── */
 let палата=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.guards={};G.trove={};G.gold=0;G.gear=[];G.items=[];G.inv={};
  G.hp=G.hpMax=9000;G.marks={};G.vaults={};
  /* Ищем ярус с сокровищницей и открываем её дверь. */
  let нашли=null;
  for(let d=2;d<=40&&!нашли;d++){
   const lvl=genLevel(512,384,d,"ruins");
   if(lvl.vault)нашли={d,lvl};}
  if(!нашли)return {нет:true};
  const v=нашли.lvl.vault;
  G.place={kind:"dungeon",bx:512,by:384,stype:"ruins",depth:нашли.d,name:"Руины",
   x:v.x0,y:v.y0};
  markVaultOpen(v.door.x,v.door.y);
  window.__said=[];
  G.gold=0;G.gear=[];
  safeFn(()=>openChest(v.x0,v.y0));
  const вПалате={gold:G.gold,gear:G.gear.length,припас:Object.keys(G.inv).length,
   именных:(G.items||[]).length};
  const вне={gold:0,gear:0};
  /* Тот же ярус, но обычный сундук за пределами палаты. */
  G.gold=0;G.gear=[];
  let сх=null;
  for(let y=0;y<нашли.lvl.h&&!сх;y++)for(let x=0;x<нашли.lvl.w;x++)
   if(!вСокровищнице(нашли.lvl,x,y)&&нашли.lvl.g[y][x]!=="#"){сх={x,y};break;}
  if(сх){safeFn(()=>openChest(сх.x,сх.y));вне.gold=G.gold;вне.gear=G.gear.length;}
  while(activeLayer())closeTopUI();
  const итог={ярус:нашли.d,вПалате,вне};
  G.place=null;
  return итог;});
 /* Слова о казне приходят отложенно — они звучат после звука палаты. */
 await page.waitForTimeout(1800);
 палата.слова=await page.evaluate(()=>речь());
 check('в подземелье находится запертая палата, и её можно обобрать',
  !палата.нет&&палата.ярус>=2,палата.ярус);
 check('палата говорит, что отдала казну круга, и называет его по-русски',
  /казна подвалов|казна штолен|казна старых ходов|казна затопленных|казна кристальных|казна костяных|казна магмовых|казна провалов|казна корней|казна порога/i
   .test(палата.слова||''),(палата.слова||'').slice(-300));
 check('палата отдаёт сразу несколько вещей, припас и именное сокровище',
  палата.вПалате&&палата.вПалате.gear>=2&&палата.вПалате.припас>=2&&
  палата.вПалате.именных>=1,палата.вПалате);
 check('обычный сундук того же яруса отдаёт много меньше палаты',
  палата.вне&&палата.вне.gold>0&&палата.вне.gold<палата.вПалате.gold,
  {вне:палата.вне,палата:палата.вПалате.gold});

 /* ── 11. Записи о стражах и сокровищах переживают чистку памяти ── */
 const память=await page.evaluate(()=>{
  G.dark=false;G.guards={};G.trove={};
  for(let i=0;i<50;i++)markGuardianDead(100+i,200,i%100+1);
  markTreasureTaken(VAULT_TREASURES[0].n);
  const стражейДо=Object.keys(G.guards).length;
  safeFn(()=>pruneState(true));
  const стражейПосле=Object.keys(G.guards).length;
  const сокровищеЖиво=!!(G.trove&&G.trove[VAULT_TREASURES[0].n]);
  /* Битые записи чинятся, а не роняют игру. */
  G.guards="сломано";G.trove=null;
  safeFn(()=>GameIntegrity.repair());
  const починено=(G.guards&&typeof G.guards==="object"&&!Array.isArray(G.guards))&&
   (G.trove&&typeof G.trove==="object");
  G.guards={};G.trove={};
  return {стражейДо,стражейПосле,сокровищеЖиво,починено};});
 check('павшие стражи переживают жёсткую чистку памяти',
  память.стражейДо===память.стражейПосле&&память.стражейПосле===50,память);
 check('взятое сокровище помнится и после чистки',память.сокровищеЖиво===true);
 check('битые записи стражей и казны чинятся, а не роняют игру',
  память.починено===true);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
