/* ════════════════════════════════════════════════════════════════════════
   ДОРОГИ, ПЕРЕКРЁСТКИ И ПОРТАЛЬНАЯ СЕТЬ

   Через мир идут тракты с именами; там, где они встречаются, стоят
   перекрёстки, а на части перекрёстков — стоячие камни портальной сети.
   Врата сети стоят у цитадели каждой из восьми держав.

   Плата за переход зависит от шести вещей: расстояния, заслуг игрока,
   репутации у народа назначения, политики между державами, экономики
   города назначения и войны. Набор проверяет каждую зависимость по
   отдельности: меняет ровно одно и смотрит, что изменилась именно цена.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 /* ── Дороги ── */
 const дороги=await page.evaluate(()=>{
  const тракты=new Set();
  for(let i=0;i<40;i++){тракты.add(tractName("r",i*29));тракты.add(tractName("c",i*29));}
  const выборка=[];
  for(let i=1;i<=6;i++){const y=i*29;
   выборка.push({на:tractName("r",y),ещёРаз:tractName("r",y)});}
  return {разныхИмён:тракты.size,устойчивы:выборка.every(v=>v.на===v.ещёРаз),
   имяТракта:roadNameAt(58,10),имяПерекрёстка:roadNameAt(29,29),
   съезд:(()=>{for(let x=1;x<28;x++)for(let y=1;y<28;y++)if(isSpur(x,y))return roadNameAt(x,y);return null;})(),
   внеДороги:roadNameAt(15,17),
   дорогаЕсть:roadAt(29,100)&&roadAt(100,29),
   перекрёсток:isCrossroads(29,29)&&!isCrossroads(29,30)};});
 check('у трактов есть имена, и они не выдумываются заново',
  дороги.разныхИмён>=12&&дороги.устойчивы,{имён:дороги.разныхИмён});
 check('дорога под ногами называет себя, а перекрёсток — оба тракта',
  /тракт|шлях|путь|волок|прогон/.test(дороги.имяТракта||"")
  &&/перекрёсток/.test(дороги.имяПерекрёстка||"")
  &&дороги.внеДороги===null,дороги);
 check('тракты и перекрёстки лежат там, где положено',
  дороги.дорогаЕсть&&дороги.перекрёсток,дороги);

 const указатель=await page.evaluate(()=>{
  const c=cellContent(29,29);
  const sp=signpostAt(29,29);
  return {постройка:c.structure&&c.structure.type,имя:c.structure&&c.structure.name,
   направлений:sp.length,первое:sp[0]&&{имя:sp[0].name,куда:sp[0].dir,шагов:sp[0].d}};});
 check('на перекрёстке стоит указатель с именем и направлениями',
  указатель.постройка==="crossroads"&&/Перекрёсток/.test(указатель.имя||"")
  &&указатель.направлений>0&&!!указатель.первое,указатель);

 /* ── Узлы сети ── */
 const узлы=await page.evaluate(()=>{
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  let камней=0,перекрёстков=0;
  for(let x=0;x<WORLD;x+=29)for(let y=0;y<WORLD;y+=29){
   if(!isCrossroads(x,y))continue;
   перекрёстков++;
   const nd=portalNodeAt(x,y);
   if(nd&&nd.kind==="stone")камней++;}
  return {врат:врата.filter(n=>n&&n.kind==="gate").length,
   имена:врата.map(n=>n&&n.name),камней,перекрёстков,
   вПолеНичего:portalNodeAt(7,11)===null};});
 check('врата сети стоят у каждой из восьми держав',
  узлы.врат===8&&узлы.имена.every(n=>/^Врата державы/.test(n||"")),узлы.имена);
 check('стоячие камни стоят на части перекрёстков, а не везде',
  узлы.камней>0&&узлы.камней<узлы.перекрёстков*0.15&&узлы.вПолеНичего,
  {камней:узлы.камней,перекрёстков:узлы.перекрёстков});

 /* ── Узел открывается ногами ── */
 const открытие=await page.evaluate(()=>{
  G.portals=[];G.place=null;G.ship=null;G.gold=5000;
  const nd=portalNodeAt(EMPIRES[0].cap.x,EMPIRES[0].cap.y);
  G.x=nd.x;G.y=nd.y;
  const доОткрытия=portalKnown(nd.x,nd.y);
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  arrive("N");
  return {доОткрытия,послеОткрытия:portalKnown(nd.x,nd.y),
   сказано:window.__said.some(t=>/узел/i.test(t)),узлов:portalsKnown().length};});
 check('узел сети открывается тем, что игрок на нём встал, и говорит об этом',
  открытие.доОткрытия===false&&открытие.послеОткрытия===true&&открытие.сказано,открытие);

 /* ── Плата: каждое слагаемое проверяется по отдельности ── */
 const цены=await page.evaluate(()=>{
  const base=()=>{G.portals=[];G.gold=100000;G.rep={};G.diplo={};G.level=1;
   G.artifacts=[];G.quests=[];G.clanRep=0;G.faith={};G.patron=null;G.race="Люди";};
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  const a=врата[0];
  base();врата.forEach(discoverPortal);
  G.x=a.x;G.y=a.y;
  /* Расстояние: дальний узел дороже ближнего. */
  const пары=врата.slice(1).map(nd=>({nd,f:portalFare(a,nd)})).filter(p=>p.f.open);
  пары.sort((p,q)=>p.f.d-q.f.d);
  const расстояние={ближний:пары[0]&&{d:пары[0].f.d,золото:пары[0].f.gold},
   дальний:пары[пары.length-1]&&{d:пары[пары.length-1].f.d,золото:пары[пары.length-1].f.gold}};
  const цель=пары[0].nd;
  /* Заслуги */
  base();врата.forEach(discoverPortal);
  const дёшево0=portalFare(a,цель).gold;
  G.level=25;G.artifacts=["a","b","c","d"];G.quests=[{done:true},{done:true},{done:true},{done:true}];G.clanRep=90;
  const дёшево1=portalFare(a,цель).gold;
  const заслуги={без:дёшево0,с:дёшево1,меритов:Math.round(portalMerit())};
  /* Репутация */
  base();врата.forEach(discoverPortal);
  const реп0=portalFare(a,цель).gold;
  const r=RACE_BY_NAME[цель.emp.race];
  G.rep={};G.rep[r.id]=18;
  const реп1=portalFare(a,цель).gold;
  /* «Не рады», но ещё пускают: враждебность закрывает переход вовсе и
     проверяется отдельно. */
  G.rep={};G.rep[r.id]=-7;
  const реп2=portalFare(a,цель).gold;
  const репутация={ровно:реп0,друзья:реп1,недруги:реп2};
  /* Политика */
  base();врата.forEach(discoverPortal);
  const i=EMPIRES.indexOf(a.emp),j=EMPIRES.indexOf(цель.emp);
  const пол0=portalFare(a,цель);
  G.diplo={};G.diplo[diploKey(i,j)]=200;
  const пол1=portalFare(a,цель);
  G.diplo={};G.diplo[diploKey(i,j)]=-200;
  const пол2=portalFare(a,цель);
  const политика={нейтрально:{золото:пол0.gold,слово:пол0.слово},
   союз:{золото:пол1.gold,слово:пол1.слово},
   война:{открыт:пол2.open,причина:пол2.reason}};
  /* Экономика: у цитадели пошлина выше, чем у вольного камня */
  base();врата.forEach(discoverPortal);
  const пошлины=portalFare(a,цель).parts.find(p=>p.что==="экономика");
  /* Вражда народа закрывает переход */
  base();врата.forEach(discoverPortal);
  G.rep={};G.rep[r.id]=-20;
  const вражда=portalFare(a,цель);
  base();врата.forEach(discoverPortal);
  /* Свой узел: в него не перейти */
  const сам=portalFare(a,a);
  return {расстояние,заслуги,репутация,политика,
   экономика:пошлины&&{сколько:пошлины.сколько,как:пошлины.как},
   вражда:{открыт:вражда.open,причина:вражда.reason},
   сам:{открыт:сам.open,причина:сам.reason}};});

 check('дальний переход дороже ближнего',
  цены.расстояние.дальний.золото>цены.расстояние.ближний.золото
  &&цены.расстояние.дальний.d>цены.расстояние.ближний.d,цены.расстояние);
 check('заслуги удешевляют переход',
  цены.заслуги.с<цены.заслуги.без&&цены.заслуги.меритов>20,цены.заслуги);
 check('репутация меняет плату в обе стороны',
  цены.репутация.друзья<цены.репутация.ровно&&цены.репутация.недруги>цены.репутация.ровно,
  цены.репутация);
 check('союз дешевле нейтралитета, а война закрывает переход',
  цены.политика.союз.золото<цены.политика.нейтрально.золото
  &&цены.политика.война.открыт===false&&/война/i.test(цены.политика.война.причина),
  цены.политика);
 check('экономика города назначения входит в плату',
  !!цены.экономика&&цены.экономика.сколько>0&&/пошлина/.test(цены.экономика.как),цены.экономика);
 check('народ, который не принимает игрока, не пускает к своему камню',
  цены.вражда.открыт===false&&/не принимают/.test(цены.вражда.причина),цены.вражда);
 check('в узел, на котором стоишь, перейти нельзя',
  цены.сам.открыт===false&&/уже здесь/i.test(цены.сам.причина),цены.сам);

 /* ── Переход: платит, переносит, тратит часы ── */
 const переход=await page.evaluate(()=>{
  G.portals=[];G.gold=5000;G.rep={};G.diplo={};G.place=null;G.ship=null;
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  врата.forEach(discoverPortal);
  const a=врата[0];G.x=a.x;G.y=a.y;
  openPortalNet();
  const кнопка=document.querySelector('#portalBody [data-cmd^="portalgo:"]');
  const key=кнопка&&кнопка.dataset.cmd.slice("portalgo:".length);
  const цель=portalNodeByKey(key);
  const f=portalFare(a,цель);
  const золотоДо=G.gold,времяДо=G.day*24+G.hour;
  CMD.portalgo(key);
  return {окно:!activeLayer(),куда:цель.name,
   пришли:G.x===цель.x&&G.y===цель.y,
   заплачено:золотоДо-G.gold,ждали:f.gold,
   часов:Math.round((G.day*24+G.hour-времяДо)*10)/10,ждалиЧасов:f.hours};});
 check('переход переносит игрока, берёт ровно объявленную плату и отнимает время',
  переход.пришли&&переход.заплачено===переход.ждали&&переход.часов===переход.ждалиЧасов
  &&переход.окно,переход);

 /* ── Отказы ── */
 const отказы=await page.evaluate(()=>{
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  G.portals=[];врата.forEach(discoverPortal);
  const a=врата[0],b=врата[1];
  G.x=a.x;G.y=a.y;G.place=null;G.ship=null;
  const key=portalKey(b.x,b.y);
  G.gold=1;
  const былиГде=[G.x,G.y];
  CMD.portalgo(key);
  const безДенег=G.x===былиГде[0]&&G.y===былиГде[1];
  G.gold=100000;
  /* Неоткрытый узел: до него надо дойти ногами */
  G.portals=[portalKey(a.x,a.y)];
  CMD.portalgo(key);
  const неОткрыт=G.x===былиГде[0]&&G.y===былиГде[1];
  /* С палубы в сеть не войти */
  G.portals=[portalKey(a.x,a.y),key];
  G.ship={name:"Ладья",toName:"Порт",left:3,legs:5,tox:a.x,toy:a.y};
  CMD.portalgo(key);
  const сПалубы=G.x===былиГде[0]&&G.y===былиГде[1];
  G.ship=null;
  /* Вдали от камня сеть не открывается */
  G.x=a.x+4;G.y=a.y+4;
  const вдали=openPortalNet();
  return {безДенег,неОткрыт,сПалубы,вдали:вдали===false,окно:!activeLayer()};});
 check('сеть отказывает: без денег, до неоткрытого узла, с палубы и вдали от камня',
  отказы.безДенег&&отказы.неОткрыт&&отказы.сПалубы&&отказы.вдали&&отказы.окно,отказы);

 /* ── Окно сети доступно жестами ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  G.portals=[];врата.forEach(discoverPortal);
  G.gold=100000;G.rep={};G.diplo={};
  const a=врата[0];G.x=a.x;G.y=a.y;G.place=null;G.ship=null;
  openPortalNet();resetCursor();
  const lay=activeLayer();
  const items=cursorItems(lay);
  return {слой:lay&&lay.id,пунктов:items.length,
   немых:items.filter(x=>!((x.dataset&&x.dataset.speak)||x.getAttribute("aria-label")||(x.textContent||"").trim())).length,
   разборСлышен:[...lay.querySelectorAll("[data-speak]")]
    .some(x=>/Разбор платы/.test(x.dataset.speak||"")),
   вМеню:amAvailable("portal")};});
 check('окно сети доступно выбором, каждый пункт называет себя, разбор платы читается',
  окно.слой==="modal-portal"&&окно.пунктов>1&&окно.немых===0&&окно.разборСлышен&&окно.вМеню,окно);

 /* ── Сохранение помнит открытые узлы ── */
 const сохранение=await page.evaluate(()=>{
  const врата=EMPIRES.map(e=>portalNodeAt(e.cap.x,e.cap.y));
  G.portals=[];discoverPortal(врата[0]);discoverPortal(врата[3]);
  const было=portalsKnown().slice();
  const raw=serializeSave();
  G.portals=[];
  const d=JSON.parse(raw);
  safeMergeState(G,d);
  return {было,стало:portalsKnown().slice()};});
 check('сохранение помнит открытые узлы сети',
  JSON.stringify(сохранение.было)===JSON.stringify(сохранение.стало)&&сохранение.стало.length===2,
  сохранение);

 /* ── Сводка «где я» ведёт к сети и называет дорогу ── */
 const сводка=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;G.ship=null;G.portals=[];
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  /* Без открытых узлов сводка честно говорит, что их нет. */
  G.x=1000;G.y=1000;
  handleThreeFingerSwipe("S");
  const без=window.__said.slice(-1)[0]||"";
  /* С открытым узлом — называет его, расстояние и сторону света. */
  const nd=portalNodeAt(EMPIRES[0].cap.x,EMPIRES[0].cap.y);
  discoverPortal(nd);
  window.__said=[];
  handleThreeFingerSwipe("S");
  const с=window.__said.slice(-1)[0]||"";
  /* Стоя на тракте, сводка называет его имя. */
  G.x=29*4;G.y=100;
  window.__said=[];
  handleThreeFingerSwipe("S");
  const наТракте=window.__said.slice(-1)[0]||"";
  return {без,с,наТракте,имяТракта:roadNameAt(29*4,100)};});
 check('сводка «где я» честно говорит, что узлов сети ещё нет',
  /Узлов портальной сети пока не открыто/.test(сводка.без),сводка.без.slice(-90));
 check('сводка «где я» ведёт к ближайшему открытому узлу сети',
  /Ближайший открытый узел сети/.test(сводка.с)&&/шаг/.test(сводка.с),сводка.с.slice(-120));
 check('сводка «где я» называет дорогу, по которой идёт игрок',
  сводка.наТракте.includes(сводка.имяТракта),
  {ждали:сводка.имяТракта,сказано:сводка.наТракте.slice(0,110)});

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
