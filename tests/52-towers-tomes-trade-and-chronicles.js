/* ════════════════════════════════════════════════════════════════════════
   БАШНИ, КНИГИ, ТОРГ И ЛЕТОПИСЬ ПОДЗЕМЕЛИЙ

   Башен в мире были сотни, и все они были одной башней: одно имя, один
   список заклинаний, один шкаф. Книга была безымянной страницей, которую
   нельзя ни назвать, ни унести, ни продать. Цена зависела от державы и
   репутации, но не от того, что в державе творится сегодня и знает ли вас
   этот торговец в лицо. Подземелье отличалось от соседнего промыслом — и
   больше ничем, а сто ярусов одного промысла остаются одним подземельем.

   Здесь проверяется, что у каждой башни свой орден, своя школа и своя
   судьба; что у книги есть имя, вид, редкость, цена и происхождение; что
   цена ходит вслед за урожаем, недородом и знакомством; что у подземелья
   есть летопись и ровно одна вещь, какой нет больше нигде.
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

 /* ── 1. У каждой башни свой орден, школа и судьба ── */
 const башни=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const беды=[];
  TOWER_ORDERS.forEach(o=>{
   if(!o.n||!o.чем||!o.собирают||!o.знак)беды.push("орден "+o.id);
   (o.школы||[]).forEach(id=>{if(!TOWER_SPEC_BY_ID[id])беды.push(o.id+": нет школы "+id);});
   if(!(o.школы||[]).length)беды.push(o.id+": без школ");});
  TOWER_SPECS.forEach(sp=>{
   if(!sp.n||!sp.чем||!(sp.учат||[]).length)беды.push("школа "+sp.id);
   (sp.учат||[]).forEach(n=>{if(!SPELLS.some(x=>x.n===n))беды.push(sp.id+": нет заклинания "+n);});
   if(!LEGEND_BY_NAME[sp.свиток])беды.push(sp.id+": нет свитка "+sp.свиток);
   if(!SOUND_BANK[sp.звук]&&!BEACONS[sp.звук])беды.push(sp.id+": нет звука");});
  TOWER_FATES.forEach(f=>{if(!f.n||!f.о||f.о.length<20)беды.push("судьба "+f.id);});
  /* Башня постоянна: та же клетка — та же башня. */
  const a=towerAt(700,700),b=towerAt(700,700);
  /* Башни в мире непохожи: соберём с сотни клеток. */
  const лица=new Set(),ордена=new Set(),школы=new Set(),судьбы=new Set();
  for(let i=0;i<400;i++){
   const t=towerAt(300+i*3,400+i*7);
   лица.add(t.орден.id+"|"+t.школа.id+"|"+t.судьба.id);
   ордена.add(t.орден.id);школы.add(t.школа.id);судьбы.add(t.судьба.id);}
  /* Школа башни всегда из тех, что ведёт её орден. */
  let чужих=0;
  for(let i=0;i<300;i++){
   const t=towerAt(120+i*11,900+i*5);
   if((t.орден.школы||[]).indexOf(t.школа.id)<0)чужих++;}
  return {беды:беды.slice(0,4),одна:a.n===b.n&&a.судьба.id===b.судьба.id,
   лиц:лица.size,орденов:ордена.size,школ:школы.size,судеб:судьбы.size,чужих,
   имя:towerAt(700,700).n,орденовВсего:TOWER_ORDERS.length,школВсего:TOWER_SPECS.length};});
 check('ордена, школы и судьбы башен описаны без дыр',башни.беды.length===0,башни.беды);
 check('орденов двенадцать, школ одиннадцать',
  башни.орденовВсего===12&&башни.школВсего===11,башни);
 check('башня постоянна: та же клетка — та же башня',башни.одна===true);
 check('башни в мире непохожи: лиц много',
  башни.лиц>=40&&башни.орденов>=8&&башни.судеб>=6,башни);
 check('башня занимается тем, что ведёт её орден, а не чем попало',
  башни.чужих===0,башни.чужих);
 check('имя башни называет орден и школу, а не «мага-отшельника»',
  /Башня .+:/.test(башни.имя)&&!/отшельник/i.test(башни.имя),башни.имя);

 /* ── 2. В башне учат своему ── */
 const учат=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  /* Ищем башню в мире. */
  let б=null;
  for(let x=200;x<1900&&!б;x+=3)for(let y=200;y<1900;y+=97){
   const c=cellContent(x,y);
   if(c.structure&&c.structure.type==="tower"){б={x,y,c};break;}}
  if(!б)return {нет:true};
  const t=towerAt(б.x,б.y);
  G.x=б.x;G.y=б.y;G.place=null;
  const вМире=teachHere();
  G.place={kind:"house",bx:б.x,by:б.y,stype:"tower",depth:0,name:t.n,x:1,y:1};
  const вБашне=teachHere();
  /* А в городе той же державы — держава, а не орден. */
  G.place=null;G.x=500;G.y=500;
  const вГороде=teachHere();
  G.place=null;
  return {имя:t.n,школа:t.школа.id,
   вБашне:(вБашне.чему||[]).slice().sort(),
   вМире:(вМире.чему||[]).slice().sort(),
   вГороде:(вГороде.чему||[]).slice().sort(),
   башняНазвана:!!вБашне.башня,орден:вБашне.орден,
   дешевле:вБашне.k<вГороде.k*1.01,
   свои:(towerTeach(t)||[]).slice().sort()};});
 check('в башне есть башня, и её видно из списка обучения',
  !учат.нет&&учат.башняНазвана===true&&!!учат.орден,учат);
 check('башня учит своему, а не тому, чему учит держава',
  JSON.stringify(учат.вБашне)!==JSON.stringify(учат.вГороде),
  {башня:учат.вБашне,город:учат.вГороде});
 check('на клетке башни учат тому же, что и внутри неё',
  JSON.stringify(учат.вМире)===JSON.stringify(учат.вБашне),учат);
 check('в башне учат дешевле: она и есть школа',учат.дешевле===true);

 /* ── 3. У книги есть имя, вид, редкость, цена и происхождение ── */
 const книги=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const беды=[];
  TOME_KINDS.forEach(k=>{if(!k.n||!k.о||!(k.вес>0))беды.push("вид "+k.id);});
  Object.keys(TOME_ORIGINS).forEach(k=>{
   const o=TOME_ORIGINS[k];
   if(!o.n||!(o.вес>0)||!(o.виды||[]).length)беды.push("исток "+k);
   (o.виды||[]).forEach(v=>{if(!TOME_KIND_BY_ID[v])беды.push(k+": нет вида "+v);});});
  TOME_RARITY.forEach((r,i)=>{if(!r.n||!(r.k>0)||!r.о)беды.push("редкость "+i);});
  /* Содержание поднимает редкость: легенда реже пересказа. */
  const lore=makeTome({origin:"city",seed:7,reward:"lore"});
  const leg=makeTome({origin:"city",seed:7,reward:"legend"});
  /* Происхождение тоже: заграничная реже городской. */
  const гор=makeTome({origin:"city",seed:11,reward:"spell"});
  const тьма=makeTome({origin:"dark",seed:11,reward:"spell"});
  /* Глубина поднимает и редкость, и цену. */
  const верх=makeTome({origin:"deep",seed:5,reward:"lore",depth:5});
  const низ=makeTome({origin:"deep",seed:5,reward:"lore",depth:90});
  /* Орден башни делает свою книгу дороже. */
  const безОрдена=makeTome({origin:"tower",seed:13,reward:"skill"});
  const сОрденом=makeTome({origin:"tower",seed:13,reward:"skill",order:"pepel"});
  /* Имена разные: тысяча книг — почти тысяча имён. */
  const имена=new Set();
  for(let i=0;i<600;i++)имена.add(makeTome({origin:"city",seed:i+1,reward:"lore"}).n);
  /* Вид книги подходит её месту: в лавке не бывает скрижалей. */
  let невпопад=0;
  for(let i=0;i<200;i++){
   const t=makeTome({origin:"market",seed:i+1,reward:"lore"});
   if(TOME_ORIGINS.market.виды.indexOf(t.вид)<0)невпопад++;}
  return {беды:беды.slice(0,4),
   содержание:leg.редкость>lore.редкость,
   исток:тьма.редкость>гор.редкость,
   глубина:низ.редкость>верх.редкость&&низ.цена>верх.цена*2,
   орден:сОрденом.цена>безОрдена.цена,
   имён:имена.size,невпопад,
   пример:lore.строка,
   видов:TOME_KINDS.length,истоков:Object.keys(TOME_ORIGINS).length,
   ступеней:TOME_RARITY.length};});
 check('виды, истоки и ступени редкости книг описаны без дыр',
  книги.беды.length===0,книги.беды);
 check('видов книг десять, истоков девять, ступеней редкости шесть',
  книги.видов===10&&книги.истоков===9&&книги.ступеней===6,книги);
 check('редкость растёт от содержания: легенда реже пересказа',книги.содержание===true);
 check('редкость растёт от происхождения: заграничная реже городской',книги.исток===true);
 check('глубина поднимает и редкость, и цену',книги.глубина===true);
 check('книга из собрания ордена стоит дороже прочих',книги.орден===true);
 check('имена книг не повторяются',книги.имён>=500,книги.имён);
 check('вид книги подходит месту, откуда она взялась',книги.невпопад===0,книги.невпопад);
 check('книга называет себя целиком: имя, редкость, вид, исток и цену',
  /редк|расхож|нечаст|единственн|несуществующ/.test(книги.пример)&&
  /Цена/.test(книги.пример),книги.пример);

 /* ── 4. Книга лежит на полке и продаётся с прилавка ── */
 const прилавок=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.gold=200000;G.items=[];G.tomes={};
  /* Книга на полке в подземелье и в башне — разная. */
  G.place={kind:"dungeon",bx:640,by:480,stype:"ruins",depth:30,name:"Руины",x:2,y:2};
  const вГлубине=tomeAt(2,2);
  G.place={kind:"house",bx:640,by:480,stype:"tower",depth:0,name:"Башня",x:2,y:2};
  const вБашне=tomeAt(2,2);
  /* Прилавок держит книги, и они ложатся в сумку как вещь. */
  G.place=null;G.x=500;G.y=500;
  const n=getNPC(500,500,0,"Торговец");
  const stock=stockFor(n);
  const томов=stock.filter(s=>s.том);
  let куплено=null;
  if(томов.length){
   const i=stock.indexOf(томов[0]);
   const былоЗолото=G.gold;
   buyItem(n.key,i);
   куплено={имя:томов[0].том.n,вСумке:(G.items||[]).indexOf(томов[0].том.n)>=0,
    запомнена:!!(G.tomes&&G.tomes[томов[0].том.n]),
    заплачено:былоЗолото-G.gold,цена:томов[0].price};}
  while(activeLayer())closeTopUI();
  G.place=null;
  return {глубина:вГлубине&&{n:вГлубине.n,откуда:вГлубине.откуда,р:вГлубине.редкость},
   башня:вБашне&&{n:вБашне.n,откуда:вБашне.откуда,р:вБашне.редкость},
   разные:!!(вГлубине&&вБашне&&вГлубине.n!==вБашне.n),
   томов:томов.length,куплено};});
 check('одна и та же полка в башне и в глубине держит разные книги',
  прилавок.разные===true,{глубина:прилавок.глубина,башня:прилавок.башня});
 check('у книги из глубины исток глубинный, у книги из башни — башенный',
  прилавок.глубина&&прилавок.глубина.откуда==="из глубины"&&
  прилавок.башня&&прилавок.башня.откуда==="из башни",
  {глубина:прилавок.глубина,башня:прилавок.башня});
 check('торговец держит книги на прилавке',прилавок.томов>=1,прилавок.томов);
 check('купленная книга ложится в сумку под своим именем и по своей цене',
  прилавок.куплено&&прилавок.куплено.вСумке&&прилавок.куплено.запомнена&&
  прилавок.куплено.заплачено===прилавок.куплено.цена,прилавок.куплено);

 /* ── 5. Цена ходит вслед за положением дел, заслугами и знакомством ── */
 const торг=await page.evaluate(()=>{
  G.dark=false;G.place=null;G.merch={};G.merit={};
  const беды=[];
  ECON_EVENTS.forEach(e=>{
   if(!e.n||!e.о||e.о.length<20||!(e.товар||[]).length)беды.push("событие "+e.id);
   if(!(Math.abs(e.k)>0.15))беды.push(e.id+": слабое влияние");});
  /* Положение дел выводится из державы и дня и держится несколько дней. */
  let день=0,соб=null;
  for(let d=1;d<=400&&!день;d++){const e=econAt(0,d);if(e){день=d;соб=e;}}
  const постоянно=соб?JSON.stringify(econAt(0,день))===JSON.stringify(соб):false;
  /* Оно двигает цену своего товара и не двигает чужой. */
  let двигает=false,неТрогает=true;
  if(соб){
   const свой=соб.товар[0];
   const чужой=["дерево","трава","ягоды","камень","руда","кость","кристалл","ракушка","грибы"]
    .find(r=>(соб.товар||[]).indexOf(r)<0);
   двигает=Math.abs(econK(свой,0,день)-1)>0.15;
   неТрогает=чужой?Math.abs(econK(чужой,0,день)-1)<0.001:true;}
  /* Заслуги перед державой удешевляют покупку. */
  const n=getNPC(500,500,0,"Торговец");
  const безЗаслуг=buyModifier(n);
  addMerit(empireIndexAt(500,500),60);
  const сЗаслугами=buyModifier(n);
  G.merit={};
  /* Знакомство с торговцем — тоже. */
  const незнаком=buyModifier(n);
  for(let i=0;i<15;i++)noteTrade(n,400);
  noteMerchFavour(n);
  const знаком=buyModifier(n);
  const связь=merchBond(n);
  /* И в обратную сторону: своему платят больше. */
  const продажаЗнакомому=tradeSellK(n.race,n);
  G.merch={};
  const продажаЧужому=tradeSellK(n.race,n);
  const слова=econLine(500,500,n);
  /* Городской прилавок — это держава, и он помнит услуги так же, как лавка. */
  const город=(()=>{
   const c=(()=>{for(let x=100;x<1900;x+=3)for(let y=100;y<1900;y+=37){
    const g=isCityAt(x,y);if(g)return g;}return null;})();
   if(!c)return null;
   G.merit={};
   const проситБез=citySellPrice("руда",c,G.day),платитБез=cityBuyPrice("руда",c,G.day);
   addMerit(Math.max(0,EMPIRES.indexOf(c.emp)),60);
   const проситС=citySellPrice("руда",c,G.day),платитС=cityBuyPrice("руда",c,G.day);
   G.merit={};
   return {дешевле:проситС<проситБез,больше:платитС>платитБез,
    проситБез,проситС,платитБез,платитС};})();
  return {беды:беды.slice(0,4),событий:ECON_EVENTS.length,день,город,
   постоянно,двигает,неТрогает,
   заслуги:сЗаслугами<безЗаслуг,знакомство:знаком<незнаком,связь,
   продажа:продажаЗнакомому>продажаЧужому,слова:String(слова).slice(0,140)};});
 check('событий хозяйства четырнадцать, и все описаны',
  торг.событий===14&&торг.беды.length===0,торг.беды);
 check('положение дел выводится из державы и дня и не меняется само',
  торг.день>0&&торг.постоянно===true,торг.день);
 check('оно двигает цену своего товара и не трогает чужой',
  торг.двигает===true&&торг.неТрогает===true,торг);
 check('заслуги перед державой удешевляют покупку',торг.заслуги===true);
 check('знакомый торговец уступает, и знакомство считается',
  торг.знакомство===true&&торг.связь>0.3,{знакомство:торг.знакомство,связь:торг.связь});
 check('знакомому и платят больше за его товар',торг.продажа===true);
 check('городской прилавок тоже помнит услуги державе: просит меньше, платит больше',
  !!торг.город&&торг.город.дешевле===true&&торг.город.больше===true,торг.город);

 /* ── 6. У подземелья есть летопись ── */
 const летопись=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const беды=[];
  DUNG_BUILDERS.forEach(b=>{if(!b.n||!b.о||b.о.length<20||!(b.добро||[]).length)беды.push("строитель "+b.id);});
  DUNG_EVENTS.forEach(e=>{if(!e.n||!e.о||e.о.length<20)беды.push("событие "+e.id);});
  DUNG_FAME.forEach(f=>{
   if(!f.n||!f.молва||f.молва.length<20)беды.push("слава "+f.id);
   if(!(f.ярус[0]>=10&&f.ярус[1]<=90&&f.ярус[1]>f.ярус[0]))беды.push("слава "+f.id+": ярус");
   if(!UNIQUE_BY_SOURCE["fame:"+f.id])беды.push("слава "+f.id+": нет вещи");});
  const a=dungeonLore(800,800,"ruins"),b=dungeonLore(800,800,"ruins");
  const лиц=new Set();
  for(let i=0;i<400;i++){
   const l=dungeonLore(200+i*7,300+i*11,"ruins");
   лиц.add(l.строитель.id+"|"+l.событие.id+"|"+l.слава.id);}
  /* Ярус славы лежит в объявленных пределах. */
  let вне=0;
  for(let i=0;i<300;i++){
   const l=dungeonLore(500+i*13,600+i*3,"cave_entrance");
   if(l.ярус<l.слава.ярус[0]||l.ярус>l.слава.ярус[1])вне++;}
  return {беды:беды.slice(0,4),одна:a.о===b.о,лиц:лиц.size,вне,
   строителей:DUNG_BUILDERS.length,событий:DUNG_EVENTS.length,слав:DUNG_FAME.length,
   пример:a.о};});
 check('строители, события и славы подземелий описаны без дыр',
  летопись.беды.length===0,летопись.беды);
 check('строителей четырнадцать, событий четырнадцать, слав двенадцать',
  летопись.строителей===14&&летопись.событий===14&&летопись.слав===12,летопись);
 check('летопись постоянна: то же подземелье — та же история',летопись.одна===true);
 check('подземелья не повторяются: историй много',летопись.лиц>=100,летопись.лиц);
 check('ярус славы лежит там, где обещает молва',летопись.вне===0,летопись.вне);
 check('летопись говорит, кто рыл, что случилось и чем известно',
  /Работа/.test(летопись.пример)&&/известно/.test(летопись.пример),летопись.пример);

 /* ── 7. Единственные вещи: по одному источнику на каждую ── */
 const единственные=await page.evaluate(()=>{
  const DUNG_FAME_BY_ID=Object.fromEntries(DUNG_FAME.map(f=>[f.id,f]));
  G.dark=false;G.uniques={};G.gear=[];
  const беды=[];
  const ид=new Set(),ист=new Set();
  UNIQUES.forEach(u=>{
   if(ид.has(u.id))беды.push("двойной "+u.id);ид.add(u.id);
   if(ист.has(u.откуда))беды.push("двойной исток "+u.откуда);ист.add(u.откуда);
   if(!u.n||!u.д||u.д.length<25)беды.push(u.id+": не описана");
   if(!(u.val>0)||!(u.price>0))беды.push(u.id+": без чисел");
   if(u.черта&&!DEEP_TRAIT_BY_ID[u.черта])беды.push(u.id+": нет свойства "+u.черта);
   const [вид,ключ]=String(u.откуда).split(":");
   if(вид==="tower"&&!TOWER_ORDER_BY_ID[ключ])беды.push(u.id+": нет ордена");
   if(вид==="fame"&&!DUNG_FAME_BY_ID[ключ])беды.push(u.id+": нет славы");});
  /* У каждого ордена и у каждой славы есть своя вещь. */
  TOWER_ORDERS.forEach(o=>{if(!UNIQUE_BY_SOURCE["tower:"+o.id])беды.push("орден без вещи "+o.id);});
  /* Выдаётся один раз. */
  const первый=grantUnique("u_pepel");
  const второй=grantUnique("u_pepel");
  const вСнаряжении=(G.gear||[]).filter(g=>g.единственная==="u_pepel").length;
  G.uniques={};G.gear=[];
  return {беды:беды.slice(0,4),всего:UNIQUES.length,
   выдана:!!первый,повтор:второй===null,вСнаряжении};});
 check('единственных вещей двадцать четыре, и все описаны',
  единственные.всего===24&&единственные.беды.length===0,единственные.беды);
 check('у каждой вещи ровно один источник, и он существует',
  единственные.беды.length===0);
 check('единственная вещь выдаётся один раз и не выпадает второй',
  единственные.выдана===true&&единственные.повтор===true&&
  единственные.вСнаряжении===1,единственные);

 /* ── 8. Тайник башни отдаёт вещь своего ордена ── */
 const тайник=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.uniques={};G.gear=[];G.secrets={};G.gold=0;
  /* Сперва набираем башни, потом ищем в них тайник: башни редки, и искать
     их вперемешку с обходом комнат — пустая работа. */
  const башни=[];
  for(let x=120;x<1900&&башни.length<60;x+=3)
   for(let y=120;y<1900&&башни.length<60;y+=11){
    const c=cellContent(x,y);
    if(c.structure&&c.structure.type==="tower")башни.push({x,y});}
  let найдено=null;
  for(const б of башни){
   if(найдено)break;
   G.place={kind:"house",bx:б.x,by:б.y,stype:"tower",depth:0,name:"Башня",x:1,y:1};
   const lvl=curLevel();
   for(let yy=1;yy<lvl.h-1&&!найдено;yy++)for(let xx=1;xx<lvl.w-1&&!найдено;xx++){
    const pr=safeFn(()=>propAt(xx,yy),null);
    if(pr&&propHidesSwitch(б.x,б.y,0,xx,yy,pr.id))найдено={x:б.x,y:б.y,xx,yy,prop:pr.id};}}
  if(!найдено){G.place=null;return {нет:true,башен:башни.length};}
  const t=towerAt(найдено.x,найдено.y);
  const u=towerUnique(t);
  G.place={kind:"house",bx:найдено.x,by:найдено.y,stype:"tower",depth:0,name:t.n,x:1,y:1};
  const v=secretVault(найдено.x,найдено.y,найдено.xx,найдено.yy);
  revealSecret(найдено.xx,найдено.yy,найдено.prop);
  window.__said=[];
  takeSecret(найдено.xx,найдено.yy,найдено.prop);
  const дано=(G.gear||[]).some(g=>g.единственная===(u&&u.id));
  const слова=речь();
  while(activeLayer())closeTopUI();
  G.place=null;G.uniques={};G.gear=[];G.secrets={};
  return {орден:t.орден.кратко,вещь:u&&u.n,призВид:v.приз&&v.приз.вид,дано,
   слова:слова.slice(0,500)};});
 check('в башне нашёлся тайник, и он отдаёт вещь своего ордена',
  !тайник.нет&&тайник.призВид==="единственная"&&тайник.дано===true,тайник);
 check('тайник говорит, что вещь единственная',
  /единственн|второй такой/i.test(тайник.слова||''),(тайник.слова||'').slice(0,200));

 /* ── 9. Страж славного яруса стережёт вещь подземелья ── */
 const слава=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.uniques={};G.gear=[];G.guards={};G.hp=G.hpMax=9000;
  G.place={kind:"dungeon",bx:777,by:333,stype:"ruins",depth:1,name:"Руины",x:2,y:2};
  const l=dungeonLore(777,333,"ruins");
  const u=dungeonUnique(l);
  /* На чужом ярусе вещь не даётся. */
  G.place.depth=Math.max(1,l.ярус-3);
  const g1=guardianHere();
  G.combat={m:g1,own:false,key:null};G.inCombat=true;
  safeFn(()=>victory());
  const наЧужом=(G.gear||[]).some(x=>x.единственная===(u&&u.id));
  while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
  /* А на своём — даётся. */
  G.place={kind:"dungeon",bx:777,by:333,stype:"ruins",depth:l.ярус,name:"Руины",x:2,y:2};
  const g2=guardianHere();
  G.combat={m:g2,own:false,key:null};G.inCombat=true;
  safeFn(()=>victory());
  const наСвоём=(G.gear||[]).some(x=>x.единственная===(u&&u.id));
  while(activeLayer())closeTopUI();
  G.place=null;G.inCombat=false;G.combat=null;G.uniques={};G.gear=[];G.guards={};
  return {слава:l.слава.id,ярус:l.ярус,вещь:u&&u.n,наЧужом,наСвоём};});
 check('на чужом ярусе единственной вещи подземелья нет',слава.наЧужом===false,слава);
 check('на том ярусе, о котором говорит молва, её стережёт страж',
  слава.наСвоём===true,слава);

 /* ── 10. Всё это переживает сохранение ── */
 const память=await page.evaluate(()=>{
  G.dark=false;G.uniques={};G.merch={};G.merit={};G.tomes={};
  grantUnique("u_bell");
  const n=getNPC(500,500,0,"Торговец");
  noteTrade(n,500);addMerit(2,7);
  G.tomes["Трактат «О счёте»"]={n:"Трактат «О счёте»",цена:40};
  saveGame(true);
  const сырое=localStorage.getItem(SAVE_KEY);
  /* Портим состояние и чиним. */
  G.uniques="сломано";G.merch=null;G.merit=[];G.tomes=7;
  safeFn(()=>GameIntegrity.repair());
  const починено=["uniques","merch","merit","tomes"].every(k=>
   G[k]&&typeof G[k]==="object"&&!Array.isArray(G[k]));
  /* Загружаем обратно. */
  const ok=safeFn(()=>loadGame(),false);
  const итог={вСохранении:/u_bell/.test(String(сырое))&&/merit/.test(String(сырое)),
   починено,
   вернулось:!!(G.uniques&&G.uniques.u_bell)&&(Number((G.merit||{})["2"])||0)===7&&
    !!(G.merch&&Object.keys(G.merch).length)&&!!(G.tomes&&G.tomes["Трактат «О счёте»"]),
   загрузка:ok!==false};
  G.uniques={};G.merch={};G.merit={};G.tomes={};
  return итог;});
 check('единственные вещи, заслуги, знакомства и книги попадают в сохранение',
  память.вСохранении===true,память);
 check('они возвращаются после загрузки',память.вернулось===true,память);
 check('битые записи чинятся, а не роняют игру',память.починено===true);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
