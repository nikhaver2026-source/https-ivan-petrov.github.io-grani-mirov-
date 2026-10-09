/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 286: 14.0 — ВЕЛИКАЯ СЕТЬ ГРАНЕЙ (ФАЗА II «БЕСКОНЕЧНОЙ ХРОНИКИ»)

   Мир Грани — одна из Граней Реальности. Проверяется, что это работает в
   игре, а не только в описании:
   1. Десять классов реальностей; шестнадцать Граней по имени и малые по
      зерну — у каждой законы, класс, эпоха, опасность (народ и бог — у всех,
      кроме погибших).
   2. Узлы стоят на клетках мира по квадратам (тот же мир — те же узлы),
      видны как постройка «узел Сети», сокрытые слышны только с чутьём 30.
   3. Чутьё («Прислушаться к Граням») находит ближайший узел и растёт.
   4. У каждого вида узла своё условие и цена: врата — мана, дорога —
      сумерки, кристалл — кристалл, круг — ночь и подношение, замок — ключ;
      урочная Грань закрыта, пока небо не то.
   5. Удачный переход: герой в Грани — своя карта (врата назад, врата дальше,
      логова), Грань записана в известные и в хронику.
   6. Законы действуют: время Грани идёт в такт шага, чары её школ сильнее
      (и в уроне по владыкам), тяжесть, вещество.
   7. Каждая ошибка перехода даёт своё: не та Грань, пропавшие дни, потеря
      ноши, сдвиг магии на три дня, страж Порога в бою.
   8. Клетки Грани: надпись — свидетельство, житель, жила (межмировое
      вещество, оно продаётся), алтарь, механизм, врата дальше, врата домой.
   9. Свидетельства сопоставляются: доли версий, независимые роды источников
      весят больше, решение — только с тремя свидетельствами, у каждой версии
      своё следствие в игре; три свидетельства эпохи Сшивателей дают ключ.
  10. Меню, окно, сохранение и день Сети.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const p=await (await browser.newContext()).newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const ss0=Speech.say.bind(Speech);Speech.say=(t,o)=>{SAID.push(String(t));try{return ss0(t,o);}catch(_){return true;}};
  const out={};
  /* 1 */
  out.классы=GRAN_CLASSES.length;
  const плохие=[];
  for(const f of Grani.all()){const з=f.законы||{};
   if(!GRAN_CLASS_BY_ID[f.класс]||!HRON_ERA_BY_ID[f.эпоха]||["время","тяжесть","магия","свет","вещество","сознание"].some(k=>typeof з[k]!=="number")||!f.опасно)плохие.push(f.id);
   if(f.класс!=="dead"&&(!f.народы.length||!f.боги.length))плохие.push(f.id+":народ");}
  out.граней=Grani.all().length;out.именных=GRANI_MAIN.length;out.плохие=плохие;
  out.эпох=HRON_ERAS.length;out.эпохиПолны=HRON_ERAS.every(e=>e.события.length&&e.народы.length&&e.спор&&e.итог&&e.годы);
  out.версий=HRON_VERSIONS.length;out.свид=HRON_EVIDENCE.length;
  out.свидВерны=HRON_EVIDENCE.every(e=>e.надёжность>0&&e.надёжность<=1&&Object.keys(e.за).every(v=>HRON_VERSION_BY_ID[v])&&HRON_ERA_BY_ID[e.эпоха]);
  /* 2: узел в квадрате Средоточия рядом с началом */
  G.grani={};const s=Grani.st();G.place=null;G.dark=false;
  let node=null;for(let sx=1;sx<4&&!node;sx++)for(let sy=1;sy<4&&!node;sy++){const n=Grani.nodeInSector(sx,sy,Grani.SECT_CORE);if(n&&!n.hidden)node=n;}
  out.узел=!!node;
  if(node){out.тот_же=JSON.stringify(Grani.nodeInSector(Math.floor(node.x/Grani.SECT_CORE),Math.floor(node.y/Grani.SECT_CORE),Grani.SECT_CORE))===JSON.stringify(node);
   contentCache.clear();const c=cellContent(node.x,node.y);out.постройка=c.structure&&c.structure.type;out.имяУзла=c.structure&&c.structure.name;}
  let скр=null;for(let sx=0;sx<40&&!скр;sx++)for(let sy=0;sy<40&&!скр;sy++){const n=Grani.nodeInSector(sx,sy,Grani.SECT_FAR);if(n&&n.hidden)скр=n;}
  if(скр){s.sense=0;out.скрытВиден0=Grani.visible(скр);s.sense=35;out.скрытВиден35=Grani.visible(скр);s.sense=0;}
  /* 3 */
  if(node){G.x=node.x+40;G.y=node.y+30;SAID.length=0;const was=s.sense;Grani.sense();out.чутьё=SAID.join(" ");out.чутьёРост=s.sense>was;}
  /* 4 */
  if(node){G.x=node.x;G.y=node.y;}
  const ус={};
  G.mana=5;ус.врата=!!Grani.need({kind:"gate",gran:"greencoil"});G.mana=99;ус.вратаОк=!Grani.need({kind:"gate",gran:"greencoil"});
  G.hour=13;ус.дорога=!!Grani.need({kind:"road",gran:"greencoil"});G.hour=19;ус.дорогаОк=!Grani.need({kind:"road",gran:"greencoil"});
  G.inv=G.inv||{};G.inv["кристалл"]=0;ус.кристалл=!!Grani.need({kind:"crystal",gran:"greencoil"});G.inv["кристалл"]=2;ус.кристаллОк=!Grani.need({kind:"crystal",gran:"greencoil"});
  G.hour=12;G.gold=50;ус.круг=!!Grani.need({kind:"circle",gran:"greencoil"});G.hour=23;ус.кругОк=!Grani.need({kind:"circle",gran:"greencoil"});
  ус.замок=!!Grani.need({kind:"key",gran:"greencoil"});s.keys.greencoil=1;ус.замокОк=!Grani.need({kind:"key",gran:"greencoil"});delete s.keys.greencoil;
  G.day=5;ус.урочная=!!Grani.need({kind:"rift",gran:"lanternsea"});G.day=14;ус.урочнаяОк=!Grani.need({kind:"rift",gran:"lanternsea"});
  out.условия=ус;
  /* 5: удачный переход */
  G.hour=12;G.mana=99;G.day=20;
  const n5={x:G.x,y:G.y,kind:"gate",gran:"slowwater",stab:1,hidden:false,key:G.x+","+G.y};
  Grani._rnd=()=>0.01;SAID.length=0;
  out.переход=Grani.transit(n5);out.вГрани=Grani.inFacet()&&G.place.gran.id==="slowwater";
  const lvl=curLevel();const букв={};for(const row of lvl.g)for(const ch of row)букв[ch]=(букв[ch]||0)+1;
  out.карта={w:lvl.w,h:lvl.h,вход:lvl.g[lvl.entry.y][lvl.entry.x],E:букв.E||0,M:букв.M||0,R:букв.R||0,K:букв.K||0,N:букв.N||0,A:букв.A||0};
  out.известна=!!s.known.slowwater;out.хроника=s.chron.some(t=>/впервые открыта Грань «Медленная Вода»/.test(t));
  out.описание=SAID.join(" ");
  /* 6: законы */
  const h0=Number(G.hour);Grani.onStep();out.времяШаг=Math.round((Number(G.hour)-h0)*1000)/1000;
  out.магияВремя=Grani.magicK("time");out.магияОгонь=Grani.magicK("fire");
  out.уронЧар=bossDamageK("spell","time")/Math.max(1e-9,(()=>{const k=Grani.magicK;Grani.magicK=()=>1;const v=bossDamageK("spell","time");Grani.magicK=k;return v;})());
  out.законыСлова=Grani.lawsText(Grani.facet("slowwater"));
  /* 8: клетки Грани */
  const найти=ch=>{for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]===ch)return {x,y};return null;};
  const встать=ch=>{const c=найти(ch);if(c){G.place.x=c.x;G.place.y=c.y;}return c;};
  const кл={};
  if(встать("K")){const n0=Object.keys(s.ev).length;useHere();кл.надпись=Object.keys(s.ev).length>n0;}
  if(встать("N")){SAID.length=0;useHere();кл.житель=SAID.join(" ").slice(0,200);}
  if(встать("R")){const f=Grani.cur();const до=JSON.stringify(G.inv);useHere();кл.жила=JSON.stringify(G.inv)!==до;кл.цена=marketPrice(f.ресурс,0,1);}
  if(встать("A")){G.hp=1;G.mana=0;useHere();кл.алтарь=G.hp>1&&G.mana>0;}
  out.клетки=кл;
  /* врата дальше по Сети */
  /* врата, за которыми Грань сейчас открыта (урочная в свой срок закрыта — это верно) */
  {let c=null;for(let y=0;y<lvl.h&&!c;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]==="E"){const g=Grani.gateTarget(x,y);if(g&&Grani.condOk(g)){c={x,y};break;}}
   if(c){G.place.x=c.x;G.place.y=c.y;}}
  if(tileAt(curLevel(),G.place.x,G.place.y)==="E"){G.mana=99;const было=G.place.gran.id;Grani._rnd=()=>0.01;useHere();out.дальше={было,стало:G.place&&G.place.gran&&G.place.gran.id,сосед:Grani.neighbors(Grani.facet(было)).some(g=>g.id===(G.place&&G.place.gran&&G.place.gran.id))};}
  /* механизм в рукотворной Грани */
  Grani.arrive(Grani.facet("brasscourt"),{key:"t,1"},{});
  {const L=curLevel();let c=null;for(let y=0;y<L.h&&!c;y++)for(let x=0;x<L.w;x++)if(L.g[y][x]==="I"){c={x,y};break;}
   if(c){G.place.x=c.x;G.place.y=c.y;s.sense=0;SAID.length=0;useHere();out.механизмЖдёт=/ждёт число/.test(SAID.join(" "));
    s.sense=15;const n0=Object.keys(s.ev).length,g0=Number(G.gold);useHere();out.механизм=Object.keys(s.ev).length>n0||Number(G.gold)>g0;}}
  /* врата домой */
  встать("<");const back=G.place.gran.back;useHere();out.домой=!G.place&&G.x===back.x&&G.y===back.y;
  /* 7: ошибки перехода */
  const ош={};const mode=(m)=>{Grani.failMode=()=>m;};const fm=Grani.failMode;
  const рnd=[0.99,0.5,0.5,0.5,0.5,0.5];
  G.mana=999;G.gold=100;G.inv["руда"]=9;
  const попробуй=(m)=>{if(Grani.inFacet())Grani.leave();mode(m);let i=0;Grani._rnd=()=>i++===0?0.99:0.3;const d0=Number(G.day),g0=Number(G.gold);
   G.inCombat=false;G.combat=null;Grani.transit({x:G.x,y:G.y,kind:"gate",gran:"greencoil",stab:0.6,key:"t,"+m});return {d0,g0};};
  {попробуй("сосед");ош.сосед=G.place&&G.place.gran&&G.place.gran.id!=="greencoil"&&Grani.neighbors(Grani.facet("greencoil")).some(g=>g.id===G.place.gran.id);}
  {const {d0}=попробуй("время");ош.время=Number(G.day)>d0;}
  {const {g0}=попробуй("ноша");ош.ноша=Number(G.gold)<g0;}
  {попробуй("магия");ош.магия=!!(s.shift&&s.shift.until>=Number(G.day)&&(s.shift.k===0.5||s.shift.k===1.5));}
  {попробуй("страж");Grani.guardian();ош.страж=!!G.inCombat&&G.combat&&/Страж Покрова/.test(String((G.combat.m||G.combat.monster||{}).n||JSON.stringify(G.combat).slice(0,300)));G.inCombat=false;G.combat=null;}
  Grani.failMode=fm;out.ошибки=ош;
  if(Grani.inFacet())Grani.leave();s.shift=null;
  /* 9: свидетельства */
  s.ev={};s.verdict="";
  out.решениеРано=Grani.adopt("error");
  Grani.addEvidence("ev02","набор");Grani.addEvidence("ev11","набор");Grani.addEvidence("ev19","набор");Grani.addEvidence("ev04","набор");
  const A=Grani.assess();out.доли=A;out.сумма=A.reduce((a,x)=>a+x.доля,0);out.первая=A[0].id;
  out.решение=Grani.adopt("error");out.верность=s.verdict;
  const ch0=Grani.chance({kind:"rift",gran:"greencoil",stab:0.5});s.verdict="";const ch1=Grani.chance({kind:"rift",gran:"greencoil",stab:0.5});out.ошибкаМастеров=ch0>ch1;
  s.verdict="outside";const R1=Grani.senseRadius();s.verdict="";out.извне=R1>Grani.senseRadius();
  /* ключ: три свидетельства эпохи Сшивателей */
  s.ev={};s.keys={};for(const id of ["ev02","ev08","ev10"])Grani.addEvidence(id,"набор");out.ключ=Object.keys(s.keys).length;
  /* 10: меню, окно, сохранение, день */
  G.place=null;if(node){G.x=node.x;G.y=node.y;}
  out.меню={gsense:amAvailable("gsense"),gstep:amAvailable("gstep"),gleave:amAvailable("gleave"),grani:amAvailable("grani")};
  Grani.home();const m=document.getElementById("modal-grani");out.окно=!!m&&!m.hidden&&m.querySelectorAll("button").length>=5;closeTopUI();
  const save=JSON.parse(JSON.stringify(G.grani));G.grani=null;G.grani=save;out.сохранение=Grani.st().transits===save.transits&&Object.keys(Grani.st().known).length>0;
  const s2=Grani.st();s2.nodes["1,1"]={used:1};s2.chron=[];for(let d=0;d<12;d++)Grani.onDay(100+d);out.день=s2.chron.some(t=>/неустойчив|окреп/.test(t));
  Grani._rnd=null;Speech.say=ss0;
  return out;});
 check('1. десять классов, 16 Граней по имени и малые по зерну, у каждой законы, класс, эпоха и опасность; эпохи, версии, свидетельства полны',
  r.классы===10&&r.именных===16&&r.граней>=100&&!r.плохие.length&&r.эпох>=7&&r.эпохиПолны&&r.версий>=3&&r.свид>=24&&r.свидВерны,
  {классы:r.классы,граней:r.граней,плохие:r.плохие,эпох:r.эпох,версий:r.версий,свид:r.свид});
 check('2. узлы на клетках мира — те же при каждом обращении, видны постройкой; сокрытый слышен только с чутьём',
  r.узел&&r.тот_же&&r.постройка==="grannode"&&r.скрытВиден0===false&&r.скрытВиден35===true,{постройка:r.постройка,имя:r.имяУзла,скр0:r.скрытВиден0,скр35:r.скрытВиден35});
 check('3. чутьё находит ближайший узел и растёт',/Ближайший узел/.test(r.чутьё||"")&&r.чутьёРост,{чутьё:(r.чутьё||"").slice(0,200)});
 check('4. у каждого вида узла своё условие и цена; урочная Грань закрыта не в свой срок',
  Object.values(r.условия).every(Boolean),r.условия);
 check('5. удачный переход ведёт в Грань: своя карта (врата назад, врата дальше, логова, жилы, надписи), Грань — в известных и в хронике',
  r.переход&&r.вГрани&&r.карта.вход==="<"&&r.карта.E>=1&&r.карта.M>=3&&r.карта.R>=1&&r.карта.K>=1&&r.известна&&r.хроника,{карта:r.карта,описание:(r.описание||"").slice(0,240)});
 check('6. законы действуют: время Грани идёт в такт шага, чары её школ сильнее (и в уроне), чуждые — слабее',
  r.времяШаг>0.05&&r.магияВремя>1.2&&r.магияОгонь<1&&Math.abs(r.уронЧар-r.магияВремя)<0.01,{времяШаг:r.времяШаг,время:r.магияВремя,огонь:r.магияОгонь,урон:r.уронЧар,слова:r.законыСлова});
 check('7. каждая ошибка перехода даёт своё: не та Грань, пропавшие дни, потеря ноши, сдвиг магии, страж Порога',
  Object.values(r.ошибки).every(Boolean)&&Object.keys(r.ошибки).length===5,r.ошибки);
 check('8. клетки Грани: надпись — свидетельство, житель говорит, жила даёт вещество (оно продаётся), алтарь отвечает; врата дальше — в соседнюю Грань; механизм ждёт числа; врата домой',
  r.клетки.надпись&&!!r.клетки.житель&&r.клетки.жила&&r.клетки.цена>0&&r.клетки.алтарь&&r.дальше&&r.дальше.сосед&&r.механизмЖдёт&&r.механизм&&r.домой,
  {клетки:r.клетки,дальше:r.дальше,механизмЖдёт:r.механизмЖдёт,механизм:r.механизм,домой:r.домой});
 check('9. свидетельства: доли версий, решение — с трёх свидетельств, у версии своё следствие; ключ Сшивателей по трём свидетельствам их эпохи',
  r.решениеРано===false&&Math.abs(r.сумма-100)<=2&&r.первая==="error"&&r.решение&&r.верность==="error"&&r.ошибкаМастеров&&r.извне&&r.ключ===1,
  {доли:r.доли,решение:r.решение,ключ:r.ключ});
 check('10. меню, окно Сети, сохранение и день Сети',
  r.меню.grani&&r.меню.gsense&&r.меню.gstep&&!r.меню.gleave&&r.окно&&r.сохранение&&r.день,{меню:r.меню,окно:r.окно,сохранение:r.сохранение,день:r.день});
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
