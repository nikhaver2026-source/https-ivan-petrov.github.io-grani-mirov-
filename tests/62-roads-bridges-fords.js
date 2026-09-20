/* ════════════════════════════════════════════════════════════════════════
   НАБОР 62: ВИДЫ ДОРОГ, МОСТЫ, БРОДЫ И ТОННЕЛИ

   Дорога была одна на весь мир: полоса гравия от ледника до пустыни. А после
   того как в мире появились реки, вышло хуже прежнего: тракт шёл прямо по
   воде, потому что `terrainAt` спрашивал дорогу раньше биома и река просто
   исчезала под насыпью.

   Здесь проверяется, что дорога стала сведением о земле: у неё есть вид
   (царская плита, торговый гравий, военная насыпь, старая земля, заросшая
   трава, горная осыпь, лесная листва, просёлок), а там, где она встречает
   воду или хребет, стоит переправа — мост, брод, обвалившийся мост, тоннель
   или перевал.

   ДВЕ ГЛАВНЫЕ ПРОВЕРКИ.

   Первая — ДОСТИЖИМОСТЬ, та же, что подвела сорта добычи: каждый вид дороги и
   каждая переправа должны встречаться в настоящем мире, а не только в
   таблице. При первой сборке «лесная тропа» и «просёлок» не попались вовсе,
   пока замер не прошёл по съездам отдельно от трактов.

   Вторая — СВЯЗНОСТЬ. Переправа решается не по клетке, а по отрезку дороги,
   иначе на двух соседних клетках одной реки окажется каменный мост и брод
   разом. С горами этого мало: замер показал, что гряда под дорогой тянется в
   среднем полтораста клеток, и короткий отрезок дал бы десяток перевалов на
   одном хребте. Поэтому в горах переправа занимает одно короткое окно на сто
   двадцать восемь клеток — и проверяется здесь именно это.

   Порог по высоте для перевала взять было нельзя: мир не поднимается выше
   КАРСТ плюс пять сотых, и порог отсёк бы все горные переправы разом. Это
   ровно та беда, что со снегом, которому неоткуда было выпасть.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. Таблицы на месте и полны ── */
 const таблицы=await page.evaluate(()=>{
  const виды=Object.keys(ROAD_KINDS),пер=Object.keys(CROSSINGS);
  const полон=o=>Object.values(o).every(v=>v&&v.id&&v.n&&v.о&&v.пов&&Number.isFinite(Number(v.шаг)));
  return {видов:виды.length,переправ:пер.length,
   видыПолны:полон(ROAD_KINDS),переправыПолны:полон(CROSSINGS),
   поверхности:[...new Set(Object.values(ROAD_KINDS).map(k=>k.пов)
    .concat(Object.values(CROSSINGS).map(c=>c.пов)))],
   знаютРоль:Object.values(CROSSINGS).every(c=>!!SOUND_BANK[c.звук])};});
 check('видов дорог не меньше восьми, и у каждого имя, описание, поверхность и скорость',
  таблицы.видов>=8&&таблицы.видыПолны,таблицы);
 check('переправ не меньше семи, и у каждой то же самое',
  таблицы.переправ>=7&&таблицы.переправыПолны,таблицы);
 check('у каждой переправы есть живая запись в банке звука',таблицы.знаютРоль,таблицы);
 check('все поверхности дорог и переправ известны шагу',
  await page.evaluate(п=>п.every(s=>!!SURF_ROLE[s]&&!!SURF_NAME[s]),таблицы.поверхности),
  таблицы.поверхности);

 /* ── 2. Достижимость: каждый вид и каждая переправа встречаются в мире ── */
 const достижимость=await page.evaluate(()=>{
  const O=25000,R=400;
  const виды={},пере={};let трактов=0,съездов=0;
  for(let x=O-R;x<O+R;x++)for(let y=O-R;y<O+R;y++){
   const тракт=(x%29===0||y%29===0);
   if(!тракт&&!isSpur(x,y))continue;
   if(тракт)трактов++;else съездов++;
   const k=roadKindAt(x,y);if(k)виды[k.id]=(виды[k.id]||0)+1;
   if(тракт){const c=crossingAt(x,y);if(c)пере[c.id]=(пере[c.id]||0)+1;}}
  return {виды,пере,трактов,съездов,
   нетВида:Object.keys(ROAD_KINDS).filter(id=>!виды[id]),
   нетПереправы:Object.keys(CROSSINGS).filter(id=>!пере[id])};});
 check('в одном куске мира встречаются все восемь видов дороги',
  достижимость.нетВида.length===0,{нет:достижимость.нетВида,виды:достижимость.виды});
 check('и все семь переправ — ни одна не осталась только в таблице',
  достижимость.нетПереправы.length===0,{нет:достижимость.нетПереправы,пере:достижимость.пере});
 check('съезды к селениям тоже размечены по виду',
  достижимость.съездов>100&&(достижимость.виды.spur||0)>50,достижимость);

 /* ── 3. Вид тракта постоянен вдоль тракта, а не скачет от клетки к клетке ── */
 const постоянство=await page.evaluate(()=>{
  const y=25000-(25000%29);const виды=new Set();let горных=0,клеток=0;
  for(let x=24000;x<26000;x++){const k=roadKindAt(x,y);if(!k)continue;клеток++;
   if(k.id==="mountain"){горных++;continue;}виды.add(k.id);}
  /* тот же тракт, спрошенный дважды, отвечает одинаково */
  const дважды=[24101,24777,25555].every(x=>{
   const a=roadKindAt(x,y),b=roadKindAt(x,y);return a&&b&&a.id===b.id;});
  return {равнинныхВидов:виды.size,виды:[...виды],горных,клеток,дважды};});
 check('вдоль одного тракта вид один и тот же — горы не в счёт',
  постоянство.равнинныхВидов===1&&постоянство.дважды,постоянство);

 /* ── 4. Связность переправ: одна река — одна переправа ── */
 const связность=await page.evaluate(()=>{
  const O=25000;const окна=[],виды=new Set();
  for(let n=0;n<30;n++){
   const y=O-(O%29)+29*(n-15);
   let пр=null,дл=0;
   for(let x=O-750;x<O+750;x++){
    const c=crossingAt(x,y),id=c?c.id:null;
    if(id!==пр){if(пр){окна.push({id:пр,дл});виды.add(пр);}дл=0;пр=id;}
    дл++;}
   if(пр)окна.push({id:пр,дл});}
  const водные=окна.filter(o=>/bridge|ford/.test(o.id));
  const горные=окна.filter(o=>/tunnel|pass/.test(o.id));
  const дл=a=>{if(!a.length)return {n:0};const v=a.map(o=>o.дл).sort((p,q)=>p-q);
   return {n:v.length,мед:v[Math.floor(v.length/2)],макс:v[v.length-1]};};
  return {всего:окна.length,вода:дл(водные),горы:дл(горные),видов:виды.size,
   шаговНаПереправу:Math.round(30*1500/Math.max(1,окна.length))};});
 check('переправа занимает отрезок, а не одну клетку',
  связность.вода.n>0&&связность.вода.мед>=2,связность);
 check('горная переправа — одна короткая на хребет, а не десяток подряд',
  связность.горы.n===0||связность.горы.макс<=40,связность);
 check('переправы попадаются не каждый шаг и не раз в жизни',
  связность.шаговНаПереправу>=25&&связность.шаговНаПереправу<=600,связность);

 /* ── 5. Обвалившийся мост возвращает реку, тоннель уводит под свод ── */
 const рельеф=await page.evaluate(()=>{
  const O=25000;let обвал=null,тоннель=null,мост=null;
  outer: for(let x=O-2500;x<O+2500;x++)for(let y=O-2500;y<O+2500;y++){
   if(!(x%29===0||y%29===0))continue;
   const c=crossingAt(x,y);if(!c)continue;
   if(!обвал&&c.id==="ruin_bridge")обвал={x,y,terr:terrainAt(x,y)[0]};
   if(!тоннель&&c.id==="tunnel")тоннель={x,y,terr:terrainAt(x,y)[0]};
   if(!мост&&/wood_bridge|stone_bridge/.test(c.id))мост={x,y,terr:terrainAt(x,y)[0]};
   if(обвал&&тоннель&&мост)break outer;}
  return {обвал,тоннель,мост};});
 check('у обвалившегося моста под ногами снова вода, а не насыпь',
  !!рельеф.обвал&&рельеф.обвал.terr==="coast",рельеф.обвал);
 check('внутри тоннеля рельеф пещерный: оттого там и фон другой',
  !!рельеф.тоннель&&рельеф.тоннель.terr==="cave",рельеф.тоннель);
 check('на целом мосту дорога остаётся дорогой',
  !!рельеф.мост&&рельеф.мост.terr==="road",рельеф.мост);

 /* ── 6. Поверхность под ногой берётся у переправы и у вида дороги ── */
 const подНогой=await page.evaluate(()=>{
  const O=25000,y=O-(O%29);
  const найти=пр=>{for(let x=O-2500;x<O+2500;x++){
    for(let yy=y-29*20;yy<y+29*20;yy+=29){
     const c=crossingAt(x,yy);if(c&&c.id===пр)return [x,yy];}}return null;};
  const снять=(x,yy)=>{G.dark=false;G.place=null;G.ship=null;G.x=x;G.y=yy;
   return {пов:outdoorSurface(),имя:surfaceName()};};
  const брод=найти("ford"),мост=найти("wood_bridge");
  /* погода не должна размывать настил моста в грязь */
  let подДождём=null;
  if(мост){G.weather="Ливень";подДождём=снять(мост[0],мост[1]).пов;G.weather="Ясно";}
  /* царская плита и заросшая насыпь звучат по-разному */
  const поВиду={};
  for(let n=0;n<60;n++){const yy=y+29*(n-30);
   const k=roadKindAt(O+3,yy);if(!k||поВиду[k.id])continue;
   поВиду[k.id]=снять(O+3,yy).пов;}
  return {брод:брод&&снять(брод[0],брод[1]),мост:мост&&снять(мост[0],мост[1]),
   подДождём,поВиду};});
 check('на броде под ногой вода, и она названа словом',
  !!подНогой.брод&&подНогой.брод.пов==="water"&&/вод/i.test(подНогой.брод.имя||""),подНогой.брод);
 check('на деревянном мосту под ногой настил',
  !!подНогой.мост&&подНогой.мост.пов==="bridge",подНогой.мост);
 check('ливень не превращает настил моста в грязь',
  подНогой.подДождём==="bridge",{подДождём:подНогой.подДождём});
 check('разные виды дороги звучат по-разному под ногой',
  new Set(Object.values(подНогой.поВиду)).size>=3,подНогой.поВиду);

 /* ── 7. Переправа называется вслух и звучит — один раз, а не на каждом шагу ── */
 const вслух=await page.evaluate(async()=>{
  const O=25000,y=O-(O%29);
  let цель=null;
  for(let x=O-2500;x<O+2500&&!цель;x++){const c=crossingAt(x,y);
   if(c&&/bridge|ford/.test(c.id)&&!crossingAt(x-1,y))цель={x,id:c.id};}
  if(!цель)return {нет:true};
  const реплики=[],звуки=[];
  const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
  /* Замеряем, сколько раз называют переправу, — а не дорожные случайности.
     Мостовщик с пошлиной попросту не пускает дальше, и герой остаётся на
     мосту все восемьдесят шагов; «Бродячий сказитель» же попадает в отбор
     одним корнем «брод». Держим окно тихим: у случайных событий свой
     сорокапятисекундный порог, и свежая отметка закрывает их на весь замер. */
  G.lastEventAt=Date.now();
  G.x=цель.x-3;G.y=y;
  /* Мост бывает и в полсотни клеток: идём, пока переправа не кончится, а не
     ровно девять шагов — иначе «сошли с моста» не случится за время замера. */
  let былаПереправа=false;
  for(let i=0;i<80;i++){
   if(typeof activeLayer==="function"&&activeLayer()){while(activeLayer())closeTopUI();}
   move("E");
   const c=crossingAt(G.x,G.y);
   if(c)былаПереправа=true;
   else if(былаПереправа)break;}
  Speech.say=say;Bank.play=bp;
  const пpo=реплики.filter(t=>/мост|брод|тоннель|перевал|переправ/i.test(t)&&!/Вариантов: \d/.test(t));
  return {цель,назвали:пpo,разНазвали:пpo.filter(t=>!/позади/i.test(t)).length,
   сошли:пpo.some(t=>/позади/i.test(t)),
   звук:звуки.some(z=>/stk_bridge|stk_splash|wild_river|deep_stone|deep_wind/.test(z)),
   шаговПоВоде:звуки.filter(z=>z==="step_shallow"||z==="stk_bridge").length};});
 check('переправа называется вслух, когда на неё ступают',
  !вслух.нет&&вслух.разНазвали>=1,вслух);
 check('и называется один раз, а не на каждом шагу по мосту',
  !вслух.нет&&вслух.разНазвали<=2,вслух);
 check('когда переправа кончилась, об этом тоже говорят',!вслух.нет&&вслух.сошли,вслух);
 check('переправа звучит живой записью, а не молчит',!вслух.нет&&вслух.звук,вслух);

 /* ── 8. Расклад «где я» называет дорогу видом и переправой ── */
 const расклад=await page.evaluate(()=>{
  const O=25000,y=O-(O%29);
  let мост=null;
  for(let x=O-2500;x<O+2500&&!мост;x++){const c=crossingAt(x,y);if(c&&/bridge/.test(c.id))мост=x;}
  const вне=roadFullName(O+3,y+7);
  return {наТракте:roadFullName(O+3,y),наМосту:мост?roadFullName(мост,y):null,
   внеДороги:вне===null||!/тракт|шлях|путь|волок|прогон/.test(вне)};});
 check('дорога называет себя именем, видом и переправой',
  /тракт|шлях|путь|волок|прогон/.test(расклад.наТракте||"")
  &&/,/.test(расклад.наТракте||""),расклад);
 check('на мосту это слышно в самом имени',
  !!расклад.наМосту&&/мост|брод/i.test(расклад.наМосту),расклад);

 /* ── 9. Дорога стоит разного времени: ради этого её и выбирают ── */
 const время=await page.evaluate(()=>{
  const O=25000;
  /* Событие открывает окно, а поверх окна шаг не проходит: первый же замер
     иначе съедал все следующие, и они возвращали ноль часов. */
  const шаг=(x,y)=>{G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
   for(let i=0;i<25&&activeLayer();i++)closeTopUI();
   G.x=x;G.y=y;const a=G.hour;move("E");const d=G.hour-a;
   for(let i=0;i<25&&activeLayer();i++)closeTopUI();
   return d<0?d+24:d;};
  /* найти клетку каждого вида на одном тракте */
  const y=O-(O%29);
  let царская=null,заброшенная=null,брод=null;
  for(let n=0;n<200&&!(царская&&заброшенная);n++){
   const yy=y+29*(n-100);const k=roadKindAt(O+5,yy);if(!k)continue;
   if(k.id==="royal"&&!царская&&!crossingAt(O+5,yy))царская=[O+5,yy];
   if(k.id==="abandoned"&&!заброшенная&&!crossingAt(O+5,yy))заброшенная=[O+5,yy];}
  for(let x=O-2500;x<O+2500&&!брод;x++){const c=crossingAt(x,y);if(c&&c.id==="ford")брод=[x-1,y];}
  return {царская:царская&&+шаг(царская[0],царская[1]).toFixed(4),
   заброшенная:заброшенная&&+шаг(заброшенная[0],заброшенная[1]).toFixed(4),
   брод:брод&&+шаг(брод[0],брод[1]).toFixed(4)};});
 check('по царской плите идут быстрее, чем по заросшей насыпи',
  !!время.царская&&!!время.заброшенная&&время.царская<время.заброшенная,время);
 check('брод отнимает времени больше, чем ровная дорога',
  !время.брод||!время.царская||время.брод>время.царская,время);

 /* ── 10. Мостовщик сидит у моста, а не посреди сухой степи ── */
 const события=await page.evaluate(()=>{
  const е=EVENTS.filter(e=>["bridge_toll","road_column","road_milestone","road_wreck",
   "ford_current","tunnel_dark"].includes(e.id));
  const сух={road:true,inside:false,night:false,ship:false,crossing:null,roadkind:"trade",
   emp:EMPIRES[0],wars:[],terr:"plains",gold:100,level:3};
  const наМосту=Object.assign({},сух,{crossing:"wood_bridge"});
  const пошлина=е.find(e=>e.id==="bridge_toll");
  return {нашлось:е.length,естьПошлина:!!пошлина,
   всеСВыбором:е.every(e=>typeof e.choices==="function"&&e.choices(наМосту).length>=2)};});
 check('дорожных событий добавилось и у каждого есть выбор',
  события.нашлось>=6&&события.всеСВыбором&&события.естьПошлина,события);
 const мостовщик=await page.evaluate(()=>{
  const e=EVENTS.find(x=>x.id==="bridge_toll");
  const баз={road:true,inside:false,night:false,ship:false,roadkind:"trade",emp:EMPIRES[0],wars:[]};
  return {вСтепи:!!e.ok(Object.assign({},баз,{crossing:null})),
   наМосту:!!e.ok(Object.assign({},баз,{crossing:"wood_bridge"})),
   уОбвала:!!e.ok(Object.assign({},баз,{crossing:"ruin_bridge"}))};});
 check('мостовщик берёт пошлину только там, где мост действительно стоит',
  !мостовщик.вСтепи&&мостовщик.наМосту&&!мостовщик.уОбвала,мостовщик);

 /* ── 11. Тот же мир — те же дороги ── */
 const устойчиво=await page.evaluate(()=>{
  const снять=()=>[[25003,24998],[24100,24505],[26000,25288],[23000,25288]]
   .map(([x,y])=>{const k=roadKindAt(x,y),c=crossingAt(x,y);
    return (k?k.id:"—")+"/"+(c?c.id:"—");}).join("|");
  const раз=снять();
  safeFn(()=>{climCache.clear();biomeCache.clear();contentCache.clear();spurCache.clear();});
  return {совпало:раз===снять(),раз};});
 check('после сброса кэшей дороги и переправы те же',устойчиво.совпало,устойчиво.раз);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
