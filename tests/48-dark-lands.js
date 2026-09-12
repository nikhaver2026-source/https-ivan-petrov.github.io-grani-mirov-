/* ════════════════════════════════════════════════════════════════════════
   ТЁМНЫЕ ЗЕМЛИ

   За Гранью лежит то, что Грань и держит. Туда не ведёт ни один тракт: вход
   один — разлом, и разломы стоят там, где камень треснул сам: в горах, в
   топях, у пещерных зевов.

   За Гранью нет держав, гильдий и караванов. Там семнадцать владений
   семнадцати тёмных богов, тридцать два народа — от низших падальщиков до
   божественных наследников, — двадцать четыре твари, семь видов земли, пять
   видов мест и обряды вместо законов. Плата берётся кровью, временем,
   памятью, клятвой, болью, именем и золотом.

   Приключения там не пишут по одному: каждое дело собирается из координат —
   род дела, бог, народ-заказчик, место, плата и награда, — и потому двух
   одинаковых не встретить. Здесь проверяется, что их действительно многие
   тысячи, что все они многоступенчатые, что плата берётся по-настоящему, а
   награда доходит; и что мир Грани от всего этого не изменился.
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

 /* ── 1. Реестры тёмных земель ── */
 const реестр=await page.evaluate(()=>{
  const беды=[];
  const ids=new Set();
  DARK_GODS.forEach(g=>{
   if(ids.has(g.id))беды.push("двойной бог "+g.id);ids.add(g.id);
   ["n","ep","dom","обряд","плата","дар"].forEach(k=>{if(!g[k])беды.push(g.id+": нет "+k);});});
  const rids=new Set();
  DARK_RACES.forEach(r=>{
   if(rids.has(r.id))беды.push("двойной народ "+r.id);rids.add(r.id);
   if(!DARK_GOD_BY_ID[r.god])беды.push(r.id+": нет бога "+r.god);
   if(!r.черта||r.черта.length<10)беды.push(r.id+": нет черты");
   if(!(r.rank>=0&&r.rank<=4))беды.push(r.id+": ранг вне меры");});
  DARK_MONSTERS.forEach(m=>{if(!m.n||!m.snd||!(m.min>0))беды.push("тварь "+m.id);});
  DARK_RES.forEach(r=>{if(!RESICON[r.name])беды.push("ресурс без значка: "+r.name);});
  Object.keys(DARK_PLACES).forEach(k=>{
   if(!PLACE_KIND[k])беды.push("место без вида: "+k);
   if(!PROPS_BY_PLACE[k])беды.push("место без обстановки: "+k);
   if(!DARK_PLACE_NAME[k]||!DARK_PLACE_NAME[k].length)беды.push("место без имён: "+k);});
  return {богов:DARK_GODS.length,народов:DARK_RACES.length,тварей:DARK_MONSTERS.length,
   рангов:new Set(DARK_RACES.map(r=>r.rank)).size,земель:DARK_TERR_LIST.length,
   мест:Object.keys(DARK_PLACES).length,плат:DARK_PRICES.length,родов:DARK_DEEDS.length,
   владений:DARK_THRONES.length,беды};});
 check('семнадцать тёмных богов и семнадцать владений',
  реестр.богов===17&&реестр.владений===17,реестр);
 check('тридцать два народа, от низших до божественных',
  реестр.народов===32&&реестр.рангов===5,реестр);
 check('своя земля, свои твари, свои места и свои платы',
  реестр.земель===7&&реестр.тварей>=24&&реестр.мест===5&&реестр.плат===7&&реестр.родов===13,реестр);
 check('в реестрах тёмных земель нет дыр',реестр.беды.length===0,реестр.беды.slice(0,5));

 /* ── 2. Разломы и переход ── */
 const переход=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.ship=null;
  let разломов=0,клеток=0,чужих=0;
  for(let x=100;x<1900;x+=17)for(let y=100;y<1900;y+=19){
   клеток++;
   if(!riftAt(x,y))continue;
   разломов++;
   const t=terrainAt(x,y)[0];
   if(["mountains","swamp","cave"].indexOf(t)<0)чужих++;}
  let точка=null;
  for(let x=100;x<1900&&!точка;x+=7)for(let y=100;y<1900&&!точка;y+=11)if(riftAt(x,y))точка={x,y};
  G.x=точка.x;G.y=точка.y;
  const вМире=cellContent(G.x,G.y);
  const вошёл=enterDark();
  const внутри={dark:G.dark,земля:cellContent(G.x,G.y).terrain[0],
   поверхность:outdoorSurface(),владение:darkRealmAt(G.x,G.y).god.id};
  /* Из тёмных земель нельзя выйти где попало. */
  let нетВорот=null;
  for(let dx=1;dx<40&&нетВорот===null;dx++)
   if(!darkGateAt(точка.x+dx,точка.y))нетВорот={x:точка.x+dx,y:точка.y};
  G.x=нетВорот.x;G.y=нетВорот.y;
  const мимо=leaveDark();
  G.x=точка.x;G.y=точка.y;
  const вышел=leaveDark();
  return {клеток,разломов,чужих,точка,структура:вМире.structure&&вМире.structure.type,
   вошёл,внутри,мимо,вышел,после:{dark:G.dark,x:G.x,y:G.y,земля:terrainAt(G.x,G.y)[0]}};});
 check('разломы стоят в мире и только там, где камень треснул сам',
  переход.разломов>0&&переход.чужих===0&&переход.структура==="rift",переход);
 check('шаг в разлом уводит за Грань: другая земля, другой шаг под ногой',
  переход.вошёл===true&&переход.внутри.dark===true&&
  ["ash","bone","mud","crystal","stone","water","gravel"].indexOf(переход.внутри.поверхность)>=0,
  переход.внутри);
 check('за Гранью своя земля и своё владение',
  ["ash","bone","rot","mirror","vein","drown","scar"].indexOf(переход.внутри.земля)>=0&&
  !!переход.внутри.владение,переход.внутри);
 check('без ворот обратно не выйти',переход.мимо===false,переход);
 check('ворота возвращают ровно на ту клетку, с которой ушли',
  переход.вышел===true&&переход.после.dark===false&&
  переход.после.x===переход.точка.x&&переход.после.y===переход.точка.y,переход);

 /* ── 3. Что стоит за Гранью ── */
 const слой=await page.evaluate(()=>{
  G.dark=true;G.place=null;
  const земли=new Set(),твари=new Set(),ресурсы=new Set(),места=new Set(),народы=new Set();
  for(let i=0;i<4000;i++){
   const x=(i*29)%2000,y=(i*71+13)%2000;
   const c=cellContent(x,y);
   земли.add(c.terrain[0]);
   if(c.monster)твари.add(c.monster.id);
   if(c.res)ресурсы.add(c.res.name);
   if(c.structure)места.add(c.structure.type);}
  for(let i=0;i<200;i++){
   const n=getNPC(500+i*3,600+i*5,0);
   народы.add(n.race);}
  /* Все ли твари — тёмные, и не забрели ли сюда здешние. */
  const чужие=[...твари].filter(id=>!DARK_MONSTER_BY_ID[id]);
  const чужиеНароды=[...народы].filter(n=>DARK_RACE_NAMES.indexOf(n)<0);
  G.dark=false;
  return {земель:земли.size,тварей:твари.size,ресурсов:ресурсы.size,мест:[...места],
   народов:народы.size,чужие,чужиеНароды};});
 check('за Гранью вся земля своя и все твари свои',
  слой.земель>=6&&слой.тварей>=10&&слой.чужие.length===0,слой);
 check('за Гранью своя добыча и свои места',
  слой.ресурсов>=5&&слой.мест.filter(m=>m!=="gate").length>=3,слой);
 check('за Гранью живут только тёмные народы',
  слой.народов>=8&&слой.чужиеНароды.length===0,слой);

 /* ── 4. Мир Грани не изменился ── */
 const светлый=await page.evaluate(()=>{
  G.dark=false;contentCache.clear();
  let тёмных=0,тёмныхНародов=0;
  for(let i=0;i<2000;i++){
   const x=(i*31+7)%2000,y=(i*67+11)%2000;
   const c=cellContent(x,y);
   if(c.dark)тёмных++;
   if(c.monster&&DARK_MONSTER_BY_ID[c.monster.id])тёмных++;}
  for(let i=0;i<200;i++){
   const n=getNPC(300+i*7,400+i*3,0);
   if(DARK_RACE_NAMES.indexOf(n.race)>=0)тёмныхНародов++;}
  /* И школы Грани за Гранью молчат. */
  G.dark=true;G.place={kind:"house",bx:500,by:500,stype:"forge",depth:0,name:"п",x:1,y:1};
  const школаВоТьме=schoolHere();
  G.place=null;G.dark=false;
  return {тёмных,тёмныхНародов,школаВоТьме:!!школаВоТьме};});
 check('в мире Грани не появилось ни тёмных клеток, ни тёмных тварей',
  светлый.тёмных===0,светлый);
 check('в мире Грани живут прежние народы',светлый.тёмныхНародов===0,светлый);
 check('школы Грани за Гранью не работают',светлый.школаВоТьме===false,светлый);

 /* ── 5. Приключений многие тысячи, и все многоступенчатые ── */
 const дела=await page.evaluate(()=>{
  const подписи=new Set(),роды=new Set(),боги=new Set(),награды=new Set(),ступени=new Set();
  for(let x=0;x<600;x+=1)for(let y=0;y<600;y+=7){
   const d=darkDeedAt(x,y);
   подписи.add(d.подпись);роды.add(d.род.id);боги.add(d.бог.id);
   награды.add(d.награда.вид);ступени.add(d.ступеней);}
  const a=darkDeedAt(777,888),b=darkDeedAt(777,888);
  /* Шаги — настоящие задания. */
  const беды=[];
  for(let i=0;i<200;i++){
   const d=darkDeedAt(100+i*3,200+i*5);
   const n={key:"t"+i,name:"И",x:100+i*3,y:200+i*5,tier:2,race:DARK_RACE_NAMES[0],prof:"Обрядчик"};
   for(let st=0;st<d.ступеней;st++){
    const q=darkDeedQuest(d,st,n);
    if(!q||!q.text||q.text.length<40)беды.push(d.подпись+" шаг "+st+": куцый текст");
    if(!q.reward||!q.reward.gold)беды.push(d.подпись+" шаг "+st+": нет награды");
    if(["fetch","hunt","kill"].indexOf(q.type)<0)беды.push(d.подпись+" шаг "+st+": тип "+q.type);
    if(q.type==="fetch"&&!RESICON[q.res])беды.push(d.подпись+": нет ресурса "+q.res);
    if(q.type==="hunt"&&!DARK_MONSTER_BY_ID[q.monsterId])беды.push(d.подпись+": нет твари");
    if(st===d.ступеней-1&&!q.тёмнаяНаграда)беды.push(d.подпись+": последний шаг без награды");}}
  return {разных:подписи.size,родов:роды.size,богов:боги.size,наград:награды.size,
   ступеней:[...ступени].sort(),постоянно:a.подпись===b.подпись,беды:беды.slice(0,5),
   бедВсего:беды.length};});
 check('приключений за Гранью многие тысячи, и они не повторяются',
  дела.разных>=13000,{разных:дела.разных});
 check('в них встречаются все тринадцать родов дела, все семнадцать богов и все шесть родов награды',
  дела.родов===13&&дела.богов===17&&дела.наград===6,дела);
 check('каждое дело многоступенчатое: от двух до четырёх ступеней',
  дела.ступеней.length>=3&&дела.ступеней[0]>=2&&дела.ступеней[дела.ступеней.length-1]<=4,дела.ступеней);
 check('дело постоянно: та же клетка — то же дело',дела.постоянно===true,дела);
 check('каждая ступень — настоящее задание, а последняя платит',
  дела.бедВсего===0,дела.беды);

 /* ── 6. Плата берётся, награда доходит ── */
 const плата=await page.evaluate(()=>{
  const out={};
  G.dark=true;G.place=null;G.hp=100;G.hpMax=100;G.gold=500;G.lore=["a","b","c"];
  G.abilities=[];G.artifacts=[];G.mounts=[];G.skills=[];G.darkFaith={};
  const было={hp:G.hp,gold:G.gold,знаний:G.lore.length,день:G.day};
  out.кровь=payDarkPrice("blood");out.hpПосле=G.hp<было.hp;
  out.золото=payDarkPrice("gold");out.золотоПосле=G.gold<было.gold;
  out.память=payDarkPrice("memory");out.знанийПосле=G.lore.length<было.знаний;
  out.время=payDarkPrice("time");out.деньПосле=G.day>было.день;
  /* Награды. */
  out.дары={};
  ["артефакт","умение","навык","скакун","знание","дар бога"].forEach(вид=>{
   const что=вид==="артефакт"?DARK_ARTIFACTS[0]:вид==="умение"?"bloodpact":
    вид==="навык"?"mining":вид==="скакун"?"wormrider":вид==="знание"?"чужое знание":"kharg";
   const слово=giveDarkPrize({вид,что});
   out.дары[вид]=!!слово&&слово.length>5;});
  out.итог={артефакты:G.artifacts.length,умения:G.abilities.length,
   скакуны:G.mounts.length,навыки:G.skills.length,вера:Object.keys(G.darkFaith).length};
  G.dark=false;
  return out;});
 check('плата кровью, золотом, памятью и временем берётся по-настоящему',
  плата.hpПосле&&плата.золотоПосле&&плата.знанийПосле&&плата.деньПосле,плата);
 check('все шесть родов награды доходят до игрока',
  Object.values(плата.дары).every(Boolean)&&плата.итог.артефакты===1&&
  плата.итог.умения===1&&плата.итог.скакуны===1&&плата.итог.вера===1,плата);

 /* ── 7. Обряд у святилища ── */
 const обряд=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=true;G.place=null;G.darkDeeds={};G.hp=100;G.hpMax=100;G.gold=900;G.lore=["a","b"];
  const t=DARK_THRONES[3];
  G.x=t.x;G.y=t.y;
  window.__said=[];
  const первый=darkRiteHere();
  const слово=речь();
  const второй=darkRiteHere();
  /* А в мире Грани обряда нет. */
  G.dark=false;
  const вСвете=darkRiteHere();
  return {первый,второй,вСвете,слово:слово.slice(0,160)};});
 check('обряд у престола совершается один раз и объявляется словами',
  обряд.первый===true&&обряд.второй===false&&/обряд|именем/i.test(обряд.слово),обряд);
 check('в мире Грани тёмных обрядов не творят',обряд.вСвете===false,обряд);

 /* ── 8. Тёмные умения и скакуны ── */
 const дары=await page.evaluate(()=>{
  const тёмныеУмения=DARK_ABILITY_IDS.filter(id=>ABILITY_BY_ID[id]);
  const тёмныеКони=DARK_MOUNT_IDS.filter(id=>MOUNT_BY_ID[id]);
  /* Ни одна школа Грани им не учит. */
  const школьные=new Set();
  SCHOOL_DB.forEach(sc=>sc.ступени.forEach(ст=>{if(ст.даёт.умение)школьные.add(ст.даёт.умение);}));
  const утечка=DARK_ABILITY_IDS.filter(id=>школьные.has(id));
  /* Кровный уговор берёт кровь и даёт ману. */
  G.dark=true;G.abilities=DARK_ABILITY_IDS.slice();G.daily={};G.buffs={};
  G.hp=100;G.hpMax=100;G.mana=0;G.manaMax=40;
  const ok=useAbility("bloodpact");
  const после={hp:G.hp,mana:G.mana};
  G.dark=false;
  return {умений:тёмныеУмения.length,коней:тёмныеКони.length,утечка,ok,после};});
 check('восемь тёмных умений и два тёмных скакуна, и школы Грани им не учат',
  дары.умений===8&&дары.коней===2&&дары.утечка.length===0,дары);
 check('кровный уговор действительно берёт кровь и даёт ману',
  дары.ok===true&&дары.после.hp<100&&дары.после.mana===40,дары);

 /* ── 9. Всё это переживает запись ── */
 const запись=await page.evaluate(()=>{
  G.dark=true;G.lightAt={x:111,y:222};G.darkFaith={kharg:7};G.darkDeeds={"rite:1,2":1};
  saveGame(true);
  G.dark=false;G.lightAt=null;G.darkFaith={};G.darkDeeds={};
  loadGame(true);
  const r={dark:G.dark,назад:G.lightAt&&G.lightAt.x,вера:G.darkFaith&&G.darkFaith.kharg,
   обрядов:Object.keys(G.darkDeeds||{}).length};
  G.dark=false;G.lightAt=null;
  return r;});
 check('тёмные земли, вера тёмным богам и совершённые обряды переживают запись',
  запись.dark===true&&запись.назад===111&&запись.вера===7&&запись.обрядов===1,запись);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
