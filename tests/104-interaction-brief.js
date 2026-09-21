/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 104: ЕДИНАЯ СИСТЕМА ВЗАИМОДЕЙСТВИЯ — ЗВУКОВАЯ НАВИГАЦИЯ, ОСМОТР,
   ЖЕСТЫ, ИНВЕНТАРЬ, ОБЪЕКТЫ, ТОРГОВЛЯ, СУБТИТРЫ

   1. Настройка «Подсказки расположения объектов»: полные, минимальные,
      только звук; старый ключ hints выводится из режима. «Субтитры» по
      четырём режимам: реплики и звуки становятся строкой по уровню.
   2. Карта жестов — одна таблица без споров; в исходнике один диспетчер
      касаний, один обработчик кликов и один клавиатуры; окно жестов читает
      таблицу.
   3. Осмотр учитывает сторону взгляда, находит объекты, проходы, живое и
      опасное, говорит коротко и по секторам; выбранное становится целью;
      два пальца вниз ведут к цели или открывают её действия.
   4. Карта места работает и снаружи: сетка и известные точки с маяком;
      журнал дел по разделам с целью, этапом, наградой и последствиями.
   5. Инвентарь по двадцати разделам: разбор по правилам, карточка вещи с
      уроном, состоянием, требованием силы и рангом; действия по разделу и
      месту, недоступное с причиной; «Выбросить» с подтверждением и счётом,
      защита квестового; стопки делятся и сходятся; бой снимает состояние;
      у горна чинят, у чана варят яд и противоядие.
   6. Объекты: у двери открыть, закрыть, запереть, отпереть, подслушать,
      взломать, ключ и чары; запертая держит шаг; у сундука осмотр
      содержимого и замок; у шкафа взять книгу; у стола взять предмет и
      прочесть бумаги; колодец, очаг, лестница; отказ с причиной; модуль.
   7. Торговля: два раздела «Купить» и «Продать» по категориям, карточка
      с ценой и состоянием, подтверждение сделки и счёт, умный торговец.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});
 const src=(()=>{const t=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');return {touchend:(t.match(/addEventListener\('touchend'/g)||[]).length,touchstart:(t.match(/addEventListener\('touchstart'/g)||[]).length,touchmove:(t.match(/addEventListener\('touchmove'/g)||[]).length,click:(t.match(/document\.addEventListener\('click'/g)||[]).length,keydown:(t.match(/document\.addEventListener\("keydown"/g)||[]).length};})();

 /* ── 1. режимы подсказок и субтитров ── */
 const режимы=await page.evaluate(()=>{
  const r={};r.нач={hint:settings.hintMode,sub:settings.subMode};
  r.selects=!!document.getElementById("setHintMode")&&!!document.getElementById("setSubMode")&&!document.getElementById("setHints")&&!document.getElementById("setSubs");
  setHintMode("sound");r.sound=settings.hints;setHintMode("min");r.min=settings.hints;setHintMode("full");r.full=settings.hints;
  const el=document.getElementById("subText");
  setSubMode("off");r.off=[settings.subtitles,sub("важно","important"),el.hidden];
  setSubMode("important");r.imp=[sub("важно","important"),sub("речь","speech"),sub("звук","sound")];
  setSubMode("speech");r.sp=[sub("речь","speech"),sub("звук","sound")];
  setSubMode("sounds");subLastSound=0;r.snd=[sub("звук","sound"),subSound("chime"),el.textContent];
  /* речь идёт в субтитр по уровню */
  setSubMode("important");el.hidden=true;el.textContent="";Speech._speak({text:"Проверка важного",pri:1,parts:null});r.speechImp=el.textContent;Speech.stop();
  el.hidden=true;el.textContent="";Speech._speak({text:"Проверка обычного",pri:2,parts:null});r.speechOrd=el.textContent;Speech.stop();
  setSubMode("sounds");
  /* минимальные подсказки режут описание до первой фразы */
  setHintMode("min");r.shape=Speech._shape("Первая фраза. Вторая фраза. Третья.",{pri:2,cat:"desc",user:false});setHintMode("full");r.shapeFull=Speech._shape("Первая фраза. Вторая фраза.",{pri:2,cat:"desc",user:false});
  return r;});
 check('настройки — списки режимов вместо флажков; hints выводится из режима: звук — ноль, минимум и полные — единица',режимы.selects&&режимы.sound===0&&режимы.min===1&&режимы.full===1,режимы);
 check('субтитры по уровням: выключены — ничего; важные — только важное; реплики — важное и реплики; все звуки — и описание записи',
  режимы.off[0]===0&&режимы.off[1]===false&&режимы.off[2]===true&&режимы.imp.join()==="true,false,false"&&режимы.sp.join()==="true,false"&&режимы.snd[0]===true&&режимы.snd[1]===true&&/🔊/.test(режимы.snd[2]),режимы);
 check('речь становится субтитром по своему уровню: важная — в режиме важных, обычная — нет',/Проверка важного/.test(режимы.speechImp)&&режимы.speechOrd==="",{imp:режимы.speechImp,ord:режимы.speechOrd});
 check('минимальные подсказки оставляют от описания первую фразу, полные — всё',режимы.shape==="Первая фраза."&&/Вторая/.test(режимы.shapeFull),режимы.shape);

 /* ── 2. жесты ── */
 const жесты=await page.evaluate(async()=>{const r={n:GESTURE_MAP.length,conf:Gestures.conflicts(),text:Gestures.text().length,fingers:[...new Set(GESTURE_MAP.map(g=>g.fingers))].sort().join("")};
  CMD.gestures();await new Promise(z=>setTimeout(z,50));r.окно=activeLayer()&&activeLayer().id;r.строк=document.querySelectorAll("#gestBody .list-line, #gestBody div").length;r.изТаблицы=document.getElementById("gestBody").textContent.includes(Gestures.word(GESTURE_MAP[4]));while(activeLayer())closeTopUI();return r;});
 check('карта жестов: пятнадцать записей на четыре числа пальцев, без споров, читается словами',жесты.n===15&&жесты.conf.length===0&&жесты.fingers==="1234"&&жесты.text>500,жесты);
 check('в исходнике один диспетчер касаний, один обработчик кликов и один клавиатуры',src.touchstart===1&&src.touchmove===1&&src.touchend===1&&src.click===1&&src.keydown===1,src);
 check('окно жестов открывается и читает ту же таблицу',жесты.окно==="modal-gestures"&&жесты.изТаблицы,жесты.окно);

 /* ── 3. осмотр и цель ── */
 const осмотр=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};
  G.place=null;G.ship=null;lastMoveDir="N";
  r.sect={N:Look.sector(0,-1),S:Look.sector(0,1),W:Look.sector(-1,0),E:Look.sector(1,0)};
  SAID.length=0;PLAYED.length=0;r.out=Look.open();await пауза(80);r.outSaid=SAID.find(t=>/^Осмотр, лицом на/.test(t))||"";r.outN=Look.list.length;r.outBtns=document.querySelectorAll('#objBody [data-cmd^="looksel:"]').length;
  r.short=r.outSaid.length<600;while(activeLayer())closeTopUI();
  /* внутрь города */
  let ok=false;for(let rr=0;rr<80&&!ok;rr++)for(let dx=-rr;dx<=rr&&!ok;dx++)for(let dy=-rr;dy<=rr&&!ok;dy++){const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]==="city"){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;ok=true;}}
  if(!ok)return r;enterPlace(cellContent(G.x,G.y));await пауза(100);while(activeLayer())closeTopUI();
  SAID.length=0;Look.open();await пауза(60);r.inSaid=SAID.find(t=>/^Осмотр/.test(t))||"";r.kinds=[...new Set(Look.list.map(o=>o.род))];r.sectors=[...new Set(Look.list.map(o=>o.сектор))];
  const adj=Look.list.findIndex(o=>Look.adjacent(o.dx,o.dy)&&o.d>0&&!o.живое&&!o.проход&&o.род!=="опасность"&&o.род!=="проход");r.adjIdx=adj;
  if(adj>=0){SAID.length=0;Look.select(adj);await пауза(40);r.adjTitle=document.getElementById("objTitle").textContent;r.adjBtns=document.querySelectorAll('#objBody [data-cmd^="objact:"]').length;}
  while(activeLayer())closeTopUI();
  const far=Look.list.findIndex(o=>o.d>=3&&!o.живое&&!o.проход);r.farIdx=far;
  if(far>=0){Look.open();await пауза(30);Look.select(far);while(activeLayer())closeTopUI();r.target=Look.target&&Look.target.n;SAID.length=0;handleTwoFingerSwipe("S");await пауза(60);r.farGuide=SAID.find(t=>/^Цель:/.test(t))||"";}
  leavePlace();await пауза(50);while(activeLayer())closeTopUI();
  return r;});
 check('сектора считаются от взгляда: лицом на север — север впереди, юг позади, запад слева, восток справа',осмотр.sect.N==="впереди"&&осмотр.sect.S==="позади"&&осмотр.sect.W==="слева"&&осмотр.sect.E==="справа",осмотр.sect);
 check('осмотр снаружи: короткая сводка по секторам, список объектов с кнопками выбора',осмотр.out===true&&/^Осмотр, лицом на север/.test(осмотр.outSaid)&&осмотр.outN>0&&осмотр.outBtns===осмотр.outN&&осмотр.short,{said:осмотр.outSaid.slice(0,140),n:осмотр.outN});
 check('осмотр внутри находит объекты разных родов по сторонам: двери или проходы, лестницы, жителей',осмотр.kinds&&осмотр.kinds.length>=3&&осмотр.sectors.length>=2,{kinds:осмотр.kinds,sectors:осмотр.sectors});
 check('выбор объекта под рукой открывает его действия; дальняя цель запоминается, и два пальца вниз ведут к ней',
  осмотр.adjIdx>=0&&осмотр.adjBtns>=1&&осмотр.farIdx>=0&&!!осмотр.target&&/^Цель:/.test(осмотр.farGuide),{adj:[осмотр.adjIdx,осмотр.adjTitle,осмотр.adjBtns],far:[осмотр.farIdx,осмотр.target,осмотр.farGuide.slice(0,100)]});

 /* ── 4. карта и журнал ── */
 const картаЖурнал=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};G.place=null;G.ship=null;
  r.open=toggleWindowGesture("modal-map");await пауза(50);r.grid=document.querySelectorAll("#mapGrid button").length;r.pts=document.querySelectorAll("#mapPoints button").length;
  const pts=mapPoints();r.роды=[...new Set(pts.map(p=>p.род))];PLAYED.length=0;SAID.length=0;r.go=mapPointGo(0);await пауза(30);r.goSaid=SAID.slice(-1)[0];
  r.close=toggleWindowGesture("modal-map");r.closed=document.getElementById("modal-map").hidden;
  /* журнал */
  const npc=getNPC(G.x+3,G.y,0);const q={id:"t104q",npc:npc.name,type:"visit",tx:G.x+5,ty:G.y+5,need:1,text:"Дойти до вехи и вернуться.",reward:{gold:10,xp:5},diplo:2,chain:"t104",chainName:"Проверочная цепь",chainStep:0,chainOf:3};
  G.quests=G.quests.filter(x=>x.id!=="t104q"&&x.id!=="t104f");G.quests.push(q);G.quests.push({id:"t104f",npc:npc.name,type:"kill",need:2,have:0,text:"Проваленное.",reward:{gold:1,xp:1},done:true,провал:true});
  toggleWindowGesture("modal-quests");await пауза(40);r.h3=[...document.querySelectorAll("#questList h3")].map(h=>h.textContent);const card=document.querySelector("#questList .list-line[data-speak*='Проверочная']");r.card=card?card.dataset.speak:"";
  toggleWindowGesture("modal-quests");G.quests=G.quests.filter(x=>x.id!=="t104q"&&x.id!=="t104f");
  return r;});
 check('карта снаружи открывается жестом: сетка семь на семь и известные точки с маяком; тот же жест закрывает',картаЖурнал.open===true&&картаЖурнал.grid===49&&картаЖурнал.pts>=3&&картаЖурнал.go===true&&/шаг|вы здесь/.test(картаЖурнал.goSaid)&&картаЖурнал.closed,{pts:картаЖурнал.pts,роды:картаЖурнал.роды});
 check('журнал по разделам: активные, готовые, выполненные, проваленные, цепочки, скрытые; карточка с целью, этапом, наградой и последствиями',
  картаЖурнал.h3.length===6&&/Проваленные \(1\)/.test(картаЖурнал.h3.join(" "))&&/Цепочки \(1\)/.test(картаЖурнал.h3.join(" "))&&/Цель:/.test(картаЖурнал.card)&&/Этап: цепочка «Проверочная цепь», шаг 1 из 3/.test(картаЖурнал.card)&&/Награда: 10 золота, 5 опыта/.test(картаЖурнал.card)&&/Последствия: держава запомнит службу/.test(картаЖурнал.card),{h3:картаЖурнал.h3,card:картаЖурнал.card.slice(0,200)});

 /* ── 5. инвентарь ── */
 const инв=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};
  G.place=null;G.inv={"руда":3,"рановник":1,"салака":2,"жемчуг":1,"слиток":1,"кристалл":2,"трава":4,"грибы":2,"камень":2};G.potions=[{id:"heal",q:1,стаб:0.9,день:G.day,срок:10}];
  G.items=["Зелье здоровья","Свиток: Искра","Факел","Реликвия: Аурис Зарний","Стрелы","Молот Рудного Сердца","Росяная фляга Росаны"];G.tomes={"Трактат «О мере»":{n:"Трактат «О мере»",строка:"Трактат «О мере»: редкий трактат.",дар:"lore",редкость:1,цена:30}};G.items.push("Трактат «О мере»");
  G.gear=G.gear.filter(g=>g&&!/^t104/.test(g.id));G.gear.push({id:"t104s",name:"Дубовый щит",type:"Щит",slot:"armor",rank:1,qual:1,val:3,price:40},{id:"t104h",name:"Кожаный шлем",type:"Шлем",slot:"armor",rank:0,qual:1,val:2,price:20});
  r.catsAll=INV_CATS.length;r.ids=INV_CATS.map(c=>c.id);
  const rows=invAll();const by=n=>(rows.find(x=>x.name===n)||{}).cat;
  r.map={меч:by(G.equip.weapon.name),щит:by("Дубовый щит"),шлем:by("Кожаный шлем"),руда:by("руда"),слиток:by("слиток"),трава:by("рановник"),салака:by("салака"),зелье:by("Зелье здоровья"),свиток:by("Свиток: Искра"),факел:by("Факел"),реликвия:by("Реликвия: Аурис Зарний"),стрелы:by("Стрелы"),молот:by("Молот Рудного Сердца"),фляга:by("Росяная фляга Росаны"),книга:by("Трактат «О мере»")};
  toggleWindowGesture("modal-inventory");await пауза(30);r.h3=[...document.querySelectorAll("#invSections h3")].map(h=>h.textContent);
  r.card=invBrief("equip","weapon");r.cardShield=invBrief("gear",String(G.gear.findIndex(g=>g&&g.id==="t104s")));
  const A=invActionsAll(invRow("equip","weapon"));r.sword={ok:A.ok.map(a=>a.id),blocked:A.blocked.map(a=>a.id),reasons:A.blocked.map(a=>a.почему)};
  const B=invActionsAll(invRow("item",String(G.items.indexOf("Реликвия: Аурис Зарний"))));r.relic={ok:B.ok.map(a=>a.id),drop:(B.blocked.find(a=>a.id==="drop")||{}).почему};
  /* меню вслух */
  invPick("res","руда");SAID.length=0;invActions();await пауза(30);r.menuSaid=SAID.slice(-1)[0];r.menuBlocked=document.querySelectorAll('#invActBody [data-cmd^="invwhy:"]').length;
  SAID.length=0;invWhy("melt","res","руда");r.why=SAID.slice(-1)[0];
  /* выброс */
  SAID.length=0;invDo("drop","res","руда");await пауза(30);r.dropQ=SAID.slice(-1)[0];r.dropBtns=[...document.querySelectorAll('#invActBody button')].map(b=>b.dataset.cmd.split(":").slice(0,2).join(":"));
  invDo("dropn:2","res","руда");r.oreAfter=G.inv["руда"];
  const ri=G.items.indexOf("Реликвия: Аурис Зарний");invPick("item",String(ri));SAID.length=0;invDo("drop","item",String(ri));await пауза(30);r.relicRefuse=SAID.slice(-1)[0];r.relicStill=G.items.includes("Реликвия: Аурис Зарний");
  const ti=G.items.indexOf("Факел");invPick("item",String(ti));SAID.length=0;invDo("drop","item",String(ti));await пауза(30);r.torchQ=SAID.slice(-1)[0];invDo("dropyes","item",String(ti));r.torchGone=!G.items.includes("Факел");
  /* стопки */
  invDo("split","res","трава");r.split=[G.inv["трава"],Object.keys(G.piles||{}).length];invDo("merge","res","трава");r.merge=[G.inv["трава"],Object.keys(G.piles||{}).length];
  /* износ */
  G.equip.weapon.сост=100;gearWear();r.wear=itemCondition(G.equip.weapon);
  /* книга и свиток */
  const bi=G.items.indexOf("Трактат «О мере»");const C=invActionsAll(invRow("item",String(bi)));r.book=C.ok.map(a=>a.id);invDo("study","item",String(bi));r.studied=!!(G.tomeRead&&G.tomeRead["Трактат «О мере»"]);
  /* горн */
  G.place={kind:"house",bx:3,by:3,stype:"forge",name:"x",depth:0,x:1,y:1};let L=null;outer: for(const st of ["forge","castle","village","clanhall"])for(let bx=3;bx<40;bx++)for(let by=3;by<40;by++){const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(tileAt(l,x,y)==="F"){L={bx,by,st,x,y};break outer;}}
  if(L){G.place={kind:"house",bx:L.bx,by:L.by,stype:L.st,name:"Кузня",depth:0,x:L.x,y:L.y};const D=invActionsAll(invRow("equip","weapon"));r.forge=D.ok.map(a=>a.id);G.equip.weapon.сост=40;G.inv["руда"]=2;invDo("repair","equip","weapon");r.repaired=[itemCondition(G.equip.weapon),G.inv["руда"]];
   const E=invActionsAll(invRow("res","руда"));r.forgeOre=E.ok.map(a=>a.id);}
  /* чан */
  G.place={kind:"house",bx:3,by:3,stype:"tower",name:"x",depth:0,x:1,y:1};let K=null;outer2: for(const st of ["tower","school","temple","castle"])for(let bx=3;bx<60;bx++)for(let by=3;by<60;by++){const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(tileAt(l,x,y)==="X"){G.place.bx=bx;G.place.by=by;G.place.stype=st;const pr=safeFn(()=>propAt(x,y),null);if(pr&&pr.id==="cauldron"){K={bx,by,st,x,y};break outer2;}}}
  if(K){G.place={kind:"house",bx:K.bx,by:K.by,stype:K.st,name:"Лаборатория",depth:0,x:K.x,y:K.y};G.inv["грибы"]=2;G.inv["трава"]=4;if(!G.mast)G.mast={};if(typeof mastLevel==="function"&&mastLevel("alchemy")<1){G.mast.alchemy={ур:1,оп:0,работ:0};}
   const F=invActionsAll(invRow("res","грибы"));r.lab=F.ok.map(a=>a.id);invDo("poison","res","грибы");r.poison=[G.items.includes("Яд"),G.inv["грибы"]];invDo("antidote","res","трава");r.antidote=[G.items.includes("Противоядие"),G.inv["трава"]];
   const W=invActionsAll(invRow("equip","weapon"));r.poisonBlade=W.ok.some(a=>a.id==="poisonblade");r.poisonWhy=(W.blocked.find(a=>a.id==="poisonblade")||{}).почему;r.itemsNow=G.items.slice();r.pbDbg={cat:invRow("equip","weapon")&&invRow("equip","weapon").cat,it:typeof (G.equip.weapon),ok:W.ok.map(a=>a.id),bl:W.blocked.map(a=>a.id+"|"+a.почему),can:String(safeFn(()=>ITEM_ACTIONS.find(x=>x.id==="poisonblade").можно(invRow("equip","weapon"),invContext()),"exc"))};if(r.poisonBlade){invDo("poisonblade","equip","weapon");r.bladePoisoned=G.equip.weapon.яд;}}
  G.place=null;while(activeLayer())closeTopUI();
  return r;});
 check('двадцать разделов инвентаря, и каждая вещь ложится в свой: меч — оружие, щит — щиты, шлем — шлемы, руда — ресурсы, слиток — материалы, трава — ингредиенты, рыба — еда, зелье, свиток, факел — инструменты, реликвия — квестовое, стрелы — боеприпасы, вещь Дома — оружие, артефакт бога — магическое, книга',
  инв.catsAll===20&&инв.map.меч==="weapon"&&инв.map.щит==="shield"&&инв.map.шлем==="helm"&&инв.map.руда==="res"&&инв.map.слиток==="material"&&инв.map.трава==="ingredient"&&инв.map.салака==="food"&&инв.map.зелье==="potion"&&инв.map.свиток==="scroll"&&инв.map.факел==="tool"&&инв.map.реликвия==="quest"&&инв.map.стрелы==="ammo"&&инв.map.молот==="weapon"&&инв.map.фляга==="magic"&&инв.map.книга==="book",инв.map);
 check('карточка вещи: имя, род, урон или защита, состояние, требование силы, ранг',/Одноручное оружие\. Урон: \d+\. Состояние: \d+%\. Требование силы: \d+\. Ранг: /.test(инв.card)&&/Щит\. Защита: 3\. Состояние: 100%/.test(инв.cardShield),{card:инв.card,shield:инв.cardShield});
 check('действия по разделу и месту: у меча вне кузницы — осмотреть, снять, использовать, состояние; недоступное — с причиной; меню вслух называет доступное и число недоступных',
  инв.sword.ok.includes("look")&&инв.sword.ok.includes("unequip")&&инв.sword.ok.includes("condition")&&инв.sword.blocked.includes("repair")&&инв.sword.reasons.every(t=>t.length>3)&&/Недоступно/.test(инв.menuSaid)&&инв.menuBlocked>=1&&/нельзя/.test(инв.why),{sword:инв.sword.ok,why:инв.why,menu:инв.menuSaid.slice(0,120)});
 check('«Выбросить»: для стопки — вопрос «сколько» с одной, несколькими, половиной и всей; для вещи — «да или нет»; квестовое защищено',
  /Выбросить сколько\?/.test(инв.dropQ)&&инв.dropBtns.includes("invdo:dropn")&&инв.oreAfter===1&&/защищён/.test(инв.relicRefuse)&&инв.relicStill&&/Выбросить «Факел»\?/.test(инв.torchQ)&&инв.torchGone&&инв.relic.ok.includes("look")&&/защищён/.test(инв.relic.drop||""),{dropQ:инв.dropQ,relic:инв.relicRefuse});
 check('стопка делится на землю и сходится обратно; бой снимает состояние; книга изучается',инв.split[0]===2&&инв.split[1]===1&&инв.merge[0]===4&&инв.merge[1]===0&&инв.wear<100&&инв.book.includes("read")&&инв.book.includes("study")&&инв.book.includes("chapters")&&инв.studied,{split:инв.split,merge:инв.merge,wear:инв.wear,book:инв.book});
 check('у горна меч чинят и закаляют, руду плавят; починка стоит руду и возвращает сто',инв.forge&&инв.forge.includes("repair")&&инв.forge.includes("temper")&&инв.forgeOre&&инв.forgeOre.includes("melt")&&инв.repaired&&инв.repaired[0]===100&&инв.repaired[1]===1,{forge:инв.forge,ore:инв.forgeOre,rep:инв.repaired});
 check('у чана алхимика из грибов варят яд, из травы — противоядие, ядом смазывают клинок',инв.lab&&инв.lab.includes("poison")&&инв.poison&&инв.poison[0]&&инв.poison[1]==null&&инв.antidote&&инв.antidote[0]&&инв.antidote[1]===2&&инв.poisonBlade&&инв.bladePoisoned===3,{lab:инв.lab,poison:инв.poison,antidote:инв.antidote,blade:инв.bladePoisoned,pb:инв.poisonBlade,why:инв.poisonWhy,items:инв.itemsNow,dbg:инв.pbDbg});

 /* ── 6. объекты ── */
 const объекты=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};
  r.module=Modules.has("INTERACTION")&&typeof Interact.actions==="function"&&typeof Interact.why==="function";
  /* уровень с дверью, сундуком, шкафом, столом и колодцем: берём город */
  G.place=null;G.ship=null;let ok=false;for(let rr=0;rr<80&&!ok;rr++)for(let dx=-rr;dx<=rr&&!ok;dx++)for(let dy=-rr;dy<=rr&&!ok;dy++){const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);if(c&&c.structure&&PLACE_KIND[c.structure.type]==="city"){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;ok=true;}}
  if(!ok)return r;enterPlace(cellContent(G.x,G.y));await пауза(80);while(activeLayer())closeTopUI();
  const lvl=curLevel();const p=G.place;
  const find=(pred)=>{for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){const t=tileAt(lvl,x,y);if(pred(t,x,y))return {x,y,t};}return null;};
  const standNext=(pos)=>{for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=pos.x+dx,y=pos.y+dy;if(x>0&&y>0&&x<lvl.w&&y<lvl.h&&tileAt(lvl,x,y)==="."){p.x=x;p.y=y;return true;}}return false;};
  const objAt=(pos)=>{objList=objectsHere();return objList.findIndex(o=>o.x===pos.x&&o.y===pos.y);};
  /* дверь */
  const door=find(t=>t==="+");r.door=!!door;
  if(door&&standNext(door)){G.items=["Ключ сокровищницы"];setPlaceMark(door.x,door.y,"closed");let i=objAt(door);let A=Interact.actions(objList[i]);r.doorActs=A.ok.map(a=>a.id);r.doorBlocked=A.blocked.map(a=>a.id+"|"+a.почему);
   SAID.length=0;doObjAction(i,"eavesdrop");r.eaves=SAID.find(t=>/За дверью/.test(t))||SAID.slice(-1)[0];
   doObjAction(i,"dlock");r.locked=placeMark(door.x,door.y);
   const dir=door.x>p.x?"E":door.x<p.x?"W":door.y>p.y?"S":"N";SAID.length=0;const шаг=moveInside(dir);r.stepLocked=[шаг,p.x===((dir==="E"?1:dir==="W"?-1:0)+p.x)?true:true,SAID.slice(-1)[0]];
   i=objAt(door);A=Interact.actions(objList[i]);r.lockedActs=A.ok.map(a=>a.id);r.whyOpen=Interact.why(i,"dopen");
   doObjAction(i,"dunlock");r.unlocked=placeMark(door.x,door.y);i=objAt(door);doObjAction(i,"dopen");r.opened=placeMark(door.x,door.y);
   i=objAt(door);A=Interact.actions(objList[i]);r.openActs=A.ok.map(a=>a.id);doObjAction(i,"dclose");r.closed=placeMark(door.x,door.y);
   G.items=[];i=objAt(door);A=Interact.actions(objList[i]);r.noKey=A.blocked.find(a=>a.id==="dlock")&&A.blocked.find(a=>a.id==="dlock").почему;}
  /* сундук */
  const chest=find(t=>t==="C");r.chest=!!chest;
  if(chest&&standNext(chest)){const i=objAt(chest);const A=Interact.actions(objList[i]);r.chestActs=A.ok.map(a=>a.id);SAID.length=0;doObjAction(i,"cpeek");r.peek=SAID.find(t=>/Сундук/.test(t))||SAID.slice(-1)[0];}
  /* шкаф или полка */
  const shelf=find((t,x,y)=>t==="K"||(t==="X"&&(()=>{const pr=safeFn(()=>propAt(x,y),null);return pr&&(pr.id==="bookcase"||pr.id==="scrollcase");})()));r.shelf=!!shelf;
  if(shelf&&standNext(shelf)){const i=objAt(shelf);const A=Interact.actions(objList[i]);r.shelfActs=A.ok.map(a=>a.id);const было=G.items.length;if(A.ok.some(a=>a.id==="takebook")){doObjAction(i,"takebook");r.book=[G.items.length-было,G.items[G.items.length-1],invCategoryOf({kind:"item",key:"0",name:G.items[G.items.length-1],it:G.items[G.items.length-1]})];}}
  /* стол: ищем по уровням построек, где он есть */
  let table=find((t,x,y)=>t==="X"&&(()=>{const pr=safeFn(()=>propAt(x,y),null);return pr&&["table","desk","dresser"].includes(pr.id);})());
  if(!table){outerT: for(const st of ["tavern","castle","village","house","tower","school","clanhall"])for(let bx=3;bx<50;bx++)for(let by=3;by<50;by++){const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;G.place={kind:"house",bx,by,stype:st,name:"т",depth:0,x:1,y:1};for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)if(tileAt(l,x,y)==="X"){const pr=safeFn(()=>propAt(x,y),null);if(pr&&["table","desk","dresser"].includes(pr.id)){table={x,y,t:"X",lvl:l};break outerT;}}}}
  r.table=!!table;
  if(table){const L=table.lvl||lvl;const stand=(()=>{for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=table.x+dx,y=table.y+dy;if(x>0&&y>0&&x<L.w&&y<L.h&&tileAt(L,x,y)==="."){G.place.x=x;G.place.y=y;return true;}}return false;})();r.tableStand=stand;}
  if(table&&r.tableStand){const i=objAt(table);const A=Interact.actions(objList[i]);r.tableActs=A.ok.map(a=>a.id);const g0=G.gold,it0=G.items.length,inv0=Number(G.inv["трава"])||0;doObjAction(i,"takeitem");r.took=G.gold>g0||G.items.length>it0||(Number(G.inv["трава"])||0)>inv0;SAID.length=0;doObjAction(i,"readdocs");r.docs=SAID.find(t=>/Бумаги/.test(t))||"";r.docsDbg={said:SAID.slice(-3),can:String(safeFn(()=>IACT.readdocs.можно(objList[i]),"exc")),obj:objList[i]&&{n:objList[i].n,вещь:objList[i].вещь,x:objList[i].x,y:objList[i].y},i};}
  /* колодец: снова на уровне города */
  G.place=p;
  const well=find(t=>t==="W");r.well=!!well;
  if(well&&standNext(well)){const i=objAt(well);const A=Interact.actions(objList[i]);r.wellActs=A.ok.map(a=>a.id);G.gold=50;doObjAction(i,"wellcoin");r.coin=[G.gold,buffActive("удача")];}
  /* лестница */
  const st=find(t=>t===">");r.stairs=!!st;
  if(st&&standNext(st)){const i=objAt(st);const A=Interact.actions(objList[i]);r.stairActs=A.ok.map(a=>a.id);}
  while(activeLayer())closeTopUI();leavePlace();await пауза(50);while(activeLayer())closeTopUI();
  return r;});
 check('модуль взаимодействия: объект → действия → меню → исполнитель; у двери — открыть, подслушать, запереть ключом; недоступное с причиной',
  объекты.module&&объекты.door&&объекты.doorActs.includes("dopen")&&объекты.doorActs.includes("eavesdrop")&&объекты.doorActs.includes("dlock")&&/За дверью/.test(объекты.eaves)&&объекты.doorBlocked.some(t=>/^dclose\|/.test(t)),{acts:объекты.doorActs,blocked:объекты.doorBlocked,eaves:объекты.eaves});
 check('запертая дверь держит шаг и говорит почему; у запертой — отпереть, ключ, взлом, чары; отпёртая открывается и закрывается; без ключа запереть нельзя — причина',
  объекты.locked==="locked"&&объекты.stepLocked&&объекты.stepLocked[0]===false&&/заперта/.test(объекты.stepLocked[2])&&объекты.lockedActs.includes("dunlock")&&объекты.lockedActs.includes("dpick")&&/нельзя/.test(объекты.whyOpen)&&объекты.unlocked==="closed"&&объекты.opened==="open"&&объекты.closed==="closed"&&/ключ/i.test(объекты.noKey||""),{locked:объекты.locked,step:объекты.stepLocked,why:объекты.whyOpen,noKey:объекты.noKey});
 check('сундук: открыть, осмотреть содержимое, забрать всё; осмотр говорит, что внутри, не открывая',объекты.chest&&объекты.chestActs.includes("copen")&&объекты.chestActs.includes("cpeek")&&объекты.chestActs.includes("ctakeall")&&/Сундук/.test(объекты.peek),{acts:объекты.chestActs,peek:объекты.peek});
 check('книжный шкаф: найти книгу, перебрать полку, взять книгу — книга ложится в раздел книг',объекты.shelf&&объекты.shelfActs.includes("findbook")&&объекты.shelfActs.includes("shelf")&&объекты.book&&объекты.book[0]===1&&объекты.book[2]==="book",{acts:объекты.shelfActs,book:объекты.book});
 check('стол: взять предмет, читать документы, открыть ящик, искать тайник — и это что-то даёт',объекты.table&&объекты.tableActs.includes("takeitem")&&объекты.tableActs.includes("readdocs")&&объекты.tableActs.includes("drawer")&&объекты.tableActs.includes("stash")&&объекты.took&&/Бумаги/.test(объекты.docs),{acts:объекты.tableActs,docs:(объекты.docs||"").slice(0,80),dbg:объекты.docsDbg});
 check('колодец: набрать воды, бросить монету на удачу, прислушаться, спустить верёвку; лестница: спуститься и послушать вниз',
  (!объекты.well||(объекты.wellActs.includes("welldrink")&&объекты.wellActs.includes("wellcoin")&&объекты.wellActs.includes("welllisten")&&объекты.coin[0]===49&&объекты.coin[1]===true))&&(!объекты.stairs||(объекты.stairActs.includes("stairlisten"))),{well:объекты.wellActs,coin:объекты.coin,stairs:объекты.stairActs});

 /* ── 7. торговля ── */
 const торг=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));const r={};G.place=null;G.ship=null;
  r.module=Modules.has("TRADE")&&SHOP_CATS.length===15;
  let npc=null;outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);if(c&&c.structure){const n=safeFn(()=>npcsFor(c),[]).find(x=>x.trade);if(n){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;npc=n;break outer;}}}
  if(!npc)return r;r.npc=npc.name;
  G.gold=500;G.inv={"руда":6,"трава":3,"салака":2};G.items=["Свиток: Искра","Реликвия: Аурис Зарний"];G.gear=G.gear.filter(g=>g&&!/^t104/.test(g.id));G.gear.push({id:"t104s",name:"Дубовый щит",type:"Щит",slot:"armor",rank:1,qual:1,val:3,price:40});
  openNPC(npc.key,true);await пауза(40);r.npcBtn=!!document.querySelector('#npcBody [data-cmd^="shop:"]');r.oldBtns=!!document.querySelector('#npcBody [data-cmd^="buy:"]');while(activeLayer())closeTopUI();
  SAID.length=0;r.open=openTrade(npc.key,"buy");await пауза(60);r.окно=activeLayer()&&activeLayer().id;
  r.tabs=[...document.querySelectorAll('#shopBody [data-cmd^="shoptab:"]')].map(b=>b.textContent.trim().slice(0,12));
  r.cats=[...document.querySelectorAll('#shopBody [data-cmd^="shopcat:"]')].map(b=>b.dataset.cmd.split(":")[1]);
  const stock=shopStockRows(npc);r.stockN=stock.length;r.stockCats=[...new Set(stock.map(x=>x.cat))];r.allowedCats=stock.every(x=>SHOP_CAT_BY_ID[x.cat]);
  /* карточка и покупка со счётом */
  const ri=stock.findIndex(x=>x.count);r.hasStack=ri>=0;
  if(ri>=0){SAID.length=0;shopItemCard(ri);await пауза(30);r.card=SAID.slice(-1)[0];r.buyBtns=[...document.querySelectorAll('#shopBody [data-cmd^="shopask:buy"]')].map(b=>b.dataset.cmd);
   const g0=G.gold,name=stock[ri].name,price=stock[ri].price;shopAsk("buy",5);await пауза(20);r.askQ=SAID.slice(-1)[0];shopYes();await пауза(30);r.bought=[g0-G.gold,price*5,Number(G.inv[name])||0];}
  /* Цену берём заново, а не из старого снимка: покупка стопки подняла имя у
     народа, торговец подобрел, и цена к этому мигу уже другая. Сравнивать
     списанное с ценой ДО покупки — значит ловить не ошибку, а расположение. */
  const gi=stock.findIndex(x=>x.s.gear);if(gi>=0){shopItemCard(gi);const g0=G.gold;const price=(shopStockRows(npc)[gi]||{}).price;shopAsk("buy",1);shopYes();await пауза(30);r.boughtGear=[g0-G.gold,price,G.gear.some(g=>g&&g.name===stock[gi].name)];}
  /* продать */
  CMD.shoptab("sell");await пауза(30);const sell=shopSellRows(npc);r.sellOk=sell.filter(x=>x.ок).map(x=>x.name);r.sellNo=sell.filter(x=>!x.ок).map(x=>x.name+"|"+x.почему);r.relicHidden=!sell.some(x=>/Реликвия/.test(x.name));
  const rows=sell.filter(x=>x.ок);const oi=rows.findIndex(x=>x.name==="руда");
  if(oi>=0){shopItemCard(oi);await пауза(20);r.sellCard=SAID.slice(-1)[0];const g0=G.gold;shopAsk("sell",3);r.sellQ=SAID.slice(-1)[0];shopYes();await пауза(30);r.sold=[G.gold-g0,G.inv["руда"]];}
  const d=merchSoul(npc);r.kind=d&&d.вид.id;
  while(activeLayer())closeTopUI();
  return r;});
 check('карточка жителя ведёт в торговлю, старые кнопки прилавка на месте; окно торговли: два раздела и категории из пятнадцати',
  торг.module&&торг.npcBtn&&торг.oldBtns&&торг.open===true&&торг.окно==="modal-shop"&&торг.tabs.length===2&&торг.cats.length>=1&&торг.allowedCats,{tabs:торг.tabs,cats:торг.cats,stockCats:торг.stockCats,kind:торг.kind});
 check('карточка товара с ценой; покупка стопки счётом с подтверждением списывает ровно цену и кладёт товар; снаряжение покупается поштучно',
  торг.hasStack&&/Цена: \d+/.test(торг.card)&&торг.buyBtns.length>=2&&/^Купить «.+» ×5 за \d+/.test(торг.askQ)&&торг.bought&&торг.bought[0]===торг.bought[1]&&торг.bought[2]>=5&&(!торг.boughtGear||(торг.boughtGear[0]===торг.boughtGear[1]&&торг.boughtGear[2])),{card:(торг.card||"").slice(0,120),ask:торг.askQ,bought:торг.bought,gear:торг.boughtGear});
 check('умный торговец: раздел «Продать» берёт своё и объясняет, чего не берёт; реликвия не предлагается; продажа стопки счётом с подтверждением',
  торг.sellOk&&торг.relicHidden&&(торг.sellNo.length===0||торг.sellNo.every(t=>t.split("|")[1].length>3))&&(!торг.sold||(/^Продать «руда» ×3 за \d+/.test(торг.sellQ)&&торг.sold[0]>0&&торг.sold[1]===3)),{ok:торг.sellOk,no:торг.sellNo,sold:торг.sold,q:торг.sellQ});

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
