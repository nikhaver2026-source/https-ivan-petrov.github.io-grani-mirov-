/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 291: 14.5 — ЖИВЫЕ ГОРОДА (ФАЗА VI «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Мастер-промпт, 2.4: города, что перемещаются по маршрутам, меняют
   улицы по времени суток, связаны с другими измерениями, перестраиваются
   механизмами, скрываются в пространственных карманах, растут под землёй
   трудом жителей, открывают и закрывают районы сами; поселения, чья
   архитектура зависит от режима, погоды или магического ядра. «Изменения
   моделировать правилами, а не случайной заменой описаний»; игрок изучает
   закономерности, собирает карты состояний, ищет постоянные ориентиры и
   безопасные маршруты; перемены слышны.
    1. Десять живых городов: у каждого свой закон, своё место в мире.
    2. Закрытый квартал закрыт по-настоящему: ворота не пускают с улицы,
       изнутри выпускают; площадь и главная улица не меняются.
    3. Сар-Дорн — сутки; Ран-Каир — кольца каждые четыре часа; Кассар —
       створки по кругу и ключ хранителя; Нор-Каэль — растёт и с помощью
       рудой быстрее; Вальтерн — ядро гаснет и заряжается кристаллами;
       Лиорен — вода в дождь; Тарвек — военный закон в войну и смуту.
    4. Астерион: в полную луну Портальный двор открыт, и сквозь шов виден
       узел Сети Граней — он ложится в знания.
    5. Виррен днём в кармане: на его месте туман; ночью стоит в мире; на
       рассвете выносит гостей за ворота.
    6. Ульм ходит по кругу Лиорен — Виррен — Астерион; улицы его одни и те
       же; сходят с его спины там, где он сейчас.
    7. Перемены слышны и ложатся в карту состояний; увидев достаточно, герой
       знает закономерность, час перемены и безопасный путь; события — в
       летописи и молве; временный проход звенит.
    8. Окно «Живые города», пункт меню, глава руководства, сохранение,
       ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const pb=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return pb(r,o);};
  window.Ж={
   выйти(){while(G.place)leavePlace();while(activeLayer())closeTopUI();},
   войти(id){Ж.выйти();const c=NAMED_CITIES.find(z=>z.id===id);G.x=c.x;G.y=c.y;G.place=null;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();return curLevel();},
   /* улица перед дверью квартала и шаг в неё */
   кДвери(lvl,i){const b=lvl.blocks[i];const D=LiveCity.doors(lvl)[i];for(const z of D){let s=null;
     if(z.y===b.y0)s={x:z.x,y:z.y-1,d:"S"};else if(z.y===b.y1)s={x:z.x,y:z.y+1,d:"N"};else if(z.x===b.x0)s={x:z.x-1,y:z.y,d:"E"};else if(z.x===b.x1)s={x:z.x+1,y:z.y,d:"W"};
     if(s&&tileAt(lvl,s.x,s.y)!=="#"){G.place.x=s.x;G.place.y=s.y;return s;}}return null;},
   шаг(lvl,i){const s=Ж.кДвери(lvl,i);if(!s)return {нет:true};SAID.length=0;const x0=G.place.x,y0=G.place.y;moveInside(s.d);
    return {сдвинулся:G.place.x!==x0||G.place.y!==y0||/Дверь открыта/.test(SAID.join(" ")),сказ:SAID.join(" ")};},
   внутрь(lvl,i){const b=lvl.blocks[i];G.place.x=b.x0+1;G.place.y=b.y0+1;}};});

 /* ── 1–2. десять городов; Сар-Дорн: сутки; ворота держат с улицы, изнутри выпускают ── */
 const сд=await p.evaluate(()=>{const r={};G.lc={};
  r.городов=LC_CITIES.length;r.места=LC_CITIES.filter(L=>!LiveCity.pos(L)).map(L=>L.id);r.роды=new Set(LC_CITIES.map(L=>L.род)).size;
  G.hour=12;const lvl=Ж.войти("sardorn");r.город=!!lvl&&lvl.kind==="city";const sp=LiveCity.special(lvl);r.ночнойРынок=lvl.blocks[sp].name;
  r.входСказ=SAID.some(t=>/Сар-Дорн — улицы по времени суток: день/.test(t));
  const S=LiveCity.state(LC_BY_ID.sardorn,lvl);r.день=S.id==="день"&&S.закрыто.has(sp)&&S.закрыто.size===1;
  r.рынокДнём=Ж.шаг(lvl,sp);
  const край=lvl.blocks.findIndex((b,i)=>i!==sp&&LiveCity.edge(lvl,b));r.крайДнём=Ж.шаг(lvl,край);
  G.hour=22;SAID.length=0;PLAYED.length=0;LiveCity.check();r.колокол=PLAYED.includes("bell_big")&&SAID.some(t=>/ночь: кварталы у стен заперты/.test(t));
  r.крайНочью=Ж.шаг(lvl,край);r.рынокНочью=Ж.шаг(lvl,sp);
  Ж.внутрь(lvl,край);const b=lvl.blocks[край];const D=LiveCity.doors(lvl)[край][0];
  /* изнутри: стоим у двери внутри квартала и выходим */
  const внутрь=D.y===b.y0?{x:D.x,y:D.y+1,d:"N"}:D.y===b.y1?{x:D.x,y:D.y-1,d:"S"}:D.x===b.x0?{x:D.x+1,y:D.y,d:"W"}:{x:D.x-1,y:D.y,d:"E"};
  G.place.x=внутрь.x;G.place.y=внутрь.y;SAID.length=0;moveInside(внутрь.d);r.изнутри=!/заперт/.test(SAID.join(" "));
  r.ориентиры=/Площадь и главная улица не меняются никогда/.test(LiveCity.lookText());
  r.карта=Object.keys(G.lc.seen.sardorn||{});r.понял=LiveCity.learned(LC_BY_ID.sardorn);
  r.безопасно=LiveCity.safe(LC_BY_ID.sardorn,lvl).length>0;Ж.выйти();return r;});
 check('1. десять живых городов, у каждого своё место в мире и свой закон',сд.городов===10&&сд.места.length===0&&сд.роды===10,сд);
 check('2а. Сар-Дорн днём: Ночной рынок заперт, кварталы у стен открыты; при входе слышно, что сейчас',
  сд.город&&сд.ночнойРынок==="Ночной рынок"&&сд.входСказ&&сд.день&&сд.рынокДнём.сдвинулся===false&&/спит до заката/.test(сд.рынокДнём.сказ)&&сд.крайДнём.сдвинулся===true,сд);
 check('2б. в девять вечера — колокол: кварталы у стен заперты с улицы, Ночной рынок пускает; изнутри квартала выпускают всегда',
  сд.колокол&&сд.крайНочью.сдвинулся===false&&/заперт на ночь/.test(сд.крайНочью.сказ)&&сд.рынокНочью.сдвинулся===true&&сд.изнутри,сд);
 check('7а. площадь и главная улица — постоянные ориентиры; два состояния — закономерность и безопасный путь',
  сд.ориентиры&&сд.карта.length===2&&сд.понял&&сд.безопасно,сд);

 /* ── 3. кольца, створки, штольни, ядро, вода, военный закон ── */
 const ст=await p.evaluate(()=>{const r={};G.lc={};
  /* Ран-Каир: каждые четыре часа следующая треть */
  {const lvl=Ж.войти("rankair");const L=LC_BY_ID.rankair;const A=[];for(const h of [0,4,8,12]){G.hour=h;A.push([...LiveCity.state(L,lvl).закрыто].join(","));}
   r.кольца=A[0]!==A[1]&&A[1]!==A[2]&&A[0]===A[3]&&A.every(x=>x.length>0);
   G.hour=1;SAID.length=0;PLAYED.length=0;LiveCity.check();G.hour=4;LiveCity.check();r.скрежет=PLAYED.includes("cast_quake");Ж.выйти();}
  /* Кассар: створки по кругу; ключ хранителя держит */
  {const lvl=Ж.войти("kassar");const L=LC_BY_ID.kassar;G.hour=6;const k=[...LiveCity.state(L,lvl).закрыто][0];
   const ш=Ж.шаг(lvl,k);r.створки=ш.сдвинулся===false&&/сомкнут створками/.test(ш.сказ);
   G.inv=G.inv||{};delete G.inv["рунный камень"];r.безКлюча=LiveCity.key()===false;G.inv["рунный камень"]=1;r.ключ=LiveCity.key()&&LiveCity.state(L,lvl).закрыто.size===0;
   r.сКлючом=Ж.шаг(lvl,k).сдвинулся===true;G.hour=12;r.ключДоПоворота=LiveCity.state(L,lvl).закрыто.size===1;Ж.выйти();}
  /* Нор-Каэль: три квартала сначала, каждые пять дней ещё, помощь рудой — быстрее */
  {const lvl=Ж.войти("norkael");const L=LC_BY_ID.norkael;const N=lvl.blocks.length;const g0=LiveCity.grown(lvl);
   r.сначала=g0===3;const закр=[...LiveCity.state(L,lvl).закрыто];const ш=Ж.шаг(lvl,закр[0]);r.непрорыт=ш.сдвинулся===false&&/ещё не прорыт/.test(ш.сказ);
   G.inv.руда=3;r.помощь=LiveCity.help()&&LiveCity.grown(lvl)===4;r.второйРаз=LiveCity.help()===false;
   G.day=Number(G.day)+5;r.черезПять=LiveCity.grown(lvl)===5;r.всего=N;Ж.выйти();}
  /* Вальтерн: ядро гаснет — мосты обесточены; кристаллы заряжают */
  {const lvl=Ж.войти("valtern");const L=LC_BY_ID.valtern;const s=LiveCity.st().ядро;s.з=40;s.д=Number(G.day);r.горит=LiveCity.state(L,lvl).id==="ядро горит";
   G.day=Number(G.day)+2;const S=LiveCity.state(L,lvl);r.гаснет=S.id==="ядро гаснет"&&S.закрыто.size>0;
   const k=[...S.закрыто][0];const ш=Ж.шаг(lvl,k);r.обесточен=ш.сдвинулся===false&&/обесточен/.test(ш.сказ);
   G.inv.кристалл=2;r.заряд=LiveCity.charge()&&LiveCity.core()===70&&LiveCity.state(L,lvl).id==="ядро горит";Ж.выйти();}
  /* Лиорен: дождь — нижний ряд под водой */
  {const lvl=Ж.войти("lioren");const L=LC_BY_ID.lioren;Weather.cur="Ясно";r.сухо=LiveCity.state(L,lvl).закрыто.size===0;
   Weather.cur="Ливень";const S=LiveCity.state(L,lvl);const низ=LiveCity.bottom(lvl);r.вода=S.закрыто.size>0&&[...S.закрыто].every(i=>lvl.blocks[i].y1===низ);Weather.cur="Ясно";Ж.выйти();}
  /* Тарвек: смута державы — военный закон */
  {const lvl=Ж.войти("tarvek");const L=LC_BY_ID.tarvek;const i=LiveCity.realm(L);const d0=Number(G.day);
   const воюет=dd=>warsAt(dd).some(w=>w.a===i||w.b===i);
   r.войной=воюет(d0)?LiveCity.state(L,lvl).id==="военный закон"&&/держава воюет|спор о престоле/.test(LiveCity.state(L,lvl).n):true;
   let d=d0;while(d<d0+600&&(воюет(d)||Throne.crisis(i)))d++;G.day=d;
   const мир=LiveCity.state(L,lvl);r.доСмуты=мир.id;
   if(!Throne.crisis(i))Throne.openCrisis(i,d,[{n:"Агния Проба",ж:1,b:d-30*360,l:1,г:0,t:1},{n:"Гордей Проба",ж:0,b:d-25*360,l:1,г:0,t:2}],"проба");
   const S=LiveCity.state(L,lvl);r.закон=S.id==="военный закон"&&S.закрыто.size>0&&/спор о престоле/.test(S.n);G.day=d0;Ж.выйти();}
  return r;});
 check('3а. Ран-Каир: каждые четыре часа механизм отрезает следующую треть кварталов, и это слышно',ст.кольца&&ст.скрежет,ст);
 check('3б. Кассар: створки смыкаются по кругу; ключ хранителя — рунный камень — держит их до поворота',ст.створки&&ст.безКлюча&&ст.ключ&&ст.сКлючом&&ст.ключДоПоворота,ст);
 check('3в. Нор-Каэль: прорыто три квартала, непрорытый не пускает; помощь рудой — ещё квартал, раз в день; через пять дней — ещё',
  ст.сначала&&ст.непрорыт&&ст.помощь&&ст.второйРаз&&ст.черезПять,ст);
 check('3г. Вальтерн: ядро слабеет, ниже трети мосты обесточены; два кристалла снова зажигают ядро',ст.горит&&ст.гаснет&&ст.обесточен&&ст.заряд,ст);
 check('3д. Лиорен: в ливень нижний ряд кварталов под водой, в сухую погоду открыт',ст.сухо&&ст.вода,ст);
 check('3е. Тарвек: в мирные дни город открыт; война или спор о престоле державы — военный закон, кварталы у стен за баррикадами',ст.войной&&ст.доСмуты==="мир"&&ст.закон,ст);

 /* ── 4. Астерион: шов в полную луну ── */
 const ас=await p.evaluate(()=>{const r={};G.lc={};const L=LC_BY_ID.asterion;
  for(let d=Number(G.day);d<Number(G.day)+60;d++){G.day=d;if(Grani.moonWord()!=="полная")break;}
  const lvl=Ж.войти("asterion");const sp=LiveCity.special(lvl);r.двор=lvl.blocks[sp].name;
  const ш=Ж.шаг(lvl,sp);r.запечатан=ш.сдвинулся===false&&/шов между мирами открывается в полную луну/.test(ш.сказ);
  for(let d=Number(G.day);d<Number(G.day)+60;d++){G.day=d;if(Grani.moonWord()==="полная")break;}
  const gs=Grani.st();const было=Object.keys(gs.nodes||{}).length;SAID.length=0;
  r.открыт=Ж.шаг(lvl,sp).сдвинулся===true;Ж.внутрь(lvl,sp);LiveCity.check();
  r.узел=Object.keys(gs.nodes||{}).length===было+1&&SAID.some(t=>/Сквозь шов портального квартала видна Грань/.test(t));
  Ж.выйти();return r;});
 check('4. Астерион: Портальный двор запечатан до полной луны; в полную луну открыт, и сквозь шов в знания ложится узел Сети Граней',
  ас.двор==="Портальный двор"&&ас.запечатан&&ас.открыт&&ас.узел,ас);

 /* ── 5. Виррен: карман ── */
 const ви=await p.evaluate(()=>{const r={};G.lc={};const c=NAMED_CITIES.find(z=>z.id==="virren");Ж.выйти();
  G.hour=12;r.деньПусто=!cellContent(c.x,c.y).structure;G.x=c.x;G.y=c.y;SAID.length=0;look();r.туман=SAID.some(t=>/Виррен ушёл в карман пространства/.test(t));
  G.hour=22;r.ночьюГород=!!cellContent(c.x,c.y).structure;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();r.вошёл=!!G.place;
  G.hour=6;SAID.length=0;LiveCity.check();r.вынесло=!G.place&&SAID.some(t=>/уходит в карман пространства/.test(t));G.hour=12;return r;});
 check('5. Виррен днём в кармане — на его месте туман; ночью стоит в мире; на рассвете выносит гостей за ворота',ви.деньПусто&&ви.туман&&ви.ночьюГород&&ви.вошёл&&ви.вынесло,ви);

 /* ── 6. Ульм ── */
 const ул=await p.evaluate(()=>{const r={};G.lc={};Ж.выйти();
  const маршрут=[];for(let d=0;d<24;d++){const q=LiveCity.ulmAt(d);маршрут.push(q.стоит!=null?"с"+q.стоит:"п");}
  r.стоянки=маршрут.filter(x=>x[0]==="с").length===6&&маршрут.slice(0,2).join()==="с0,с0"&&маршрут.slice(8,10).join()==="с1,с1"&&маршрут.slice(16,18).join()==="с2,с2";
  const d0=Number(G.day);const q=LiveCity.ulmAt();const c=cellContent(q.x,q.y);r.вМире=!!(c.structure&&c.structure.live==="ulm");
  G.x=q.x;G.y=q.y;enterPlace(c);while(activeLayer())closeTopUI();r.вошёл=!!G.place&&G.place.live==="ulm";const g1=JSON.stringify(curLevel().g);
  /* другой день — та же черепаха в другом месте: улицы те же */
  let d2=d0+3;while(LiveCity.ulmAt(d2).x===q.x&&LiveCity.ulmAt(d2).y===q.y)d2++;
  const q2=LiveCity.ulmAt(d2);G.day=d2;r.вМиреПотом=!!(cellContent(q2.x,q2.y).structure||{}).live&&!(cellContent(q.x,q.y).structure||{}).live;
  const lv2=genLevel(q2.x,q2.y,0,"burg");r.теЖеУлицы=JSON.stringify(lv2.g)===g1&&JSON.stringify(curLevel().g)===g1;
  leavePlace();r.сошёл=G.x===q2.x&&G.y===q2.y;G.day=d0;return r;});
 check('6. Ульм ходит по кругу трёх городов с двухдневными стоянками; в мире стоит там, где черепаха; улицы одни и те же; сходят там, где он сейчас',
  ул.стоянки&&ул.вМире&&ул.вМиреПотом&&ул.вошёл&&ул.теЖеУлицы&&ул.сошёл,ул);

 /* ── 7–8. летопись, молва, звон, окно, меню, руководство, сохранение ── */
 const ок=await p.evaluate(()=>{const r={};G.lc={};
  /* событие: новый квартал Нор-Каэля — в летопись и молву */
  {const lvl=Ж.войти("norkael");G.inv.руда=3;LiveCity.st().рост.день=0;const n0=(G.rumors||[]).length;LiveCity.help();
   r.летопись=Ledger.has("история",/горняки прорыли новый квартал/);r.молва=(G.rumors||[]).some(x=>x.в==="город"&&/прорыли новый квартал/.test(x.что));
   /* временный проход звенит у ворот */
   const T=[...LiveCity.temp(LC_BY_ID.norkael,lvl)];const S=LiveCity.state(LC_BY_ID.norkael,lvl);const откр=T.find(i=>!S.закрыто.has(i));
   PLAYED.length=0;LiveCity._зв={};if(откр!=null){Ж.кДвери(lvl,откр);LiveCity.check();}r.звон=PLAYED.includes("arc_chimes");
   CMD.livecity();const m=document.getElementById("modal-livecity");r.окно=!!m&&!m.hidden;const тело=m&&m.querySelector("#lcBody");
   r.немых=тело?тело.querySelectorAll("button:not([data-speak])").length:-1;r.городов=тело?тело.querySelectorAll("h3").length:0;r.помочь=!!(тело&&тело.querySelector('[data-cmd="lc:help"]'));
   r.текст=тело?тело.textContent:"";closeModal(m);Ж.выйти();}
  SAID.length=0;CMD.lc("непонятное");r.немоНет=SAID.some(t=>/Такого дела в живом городе нет/.test(t));
  r.меню=amAvailable("livecity")&&AM_GROUPS.find(g=>g[0]==="Мир")[1].some(x=>x[0]==="livecity");
  r.глава=!!guideSec(/Живые города/);
  const до=JSON.stringify(G.lc);saveGame(true);G.lc={};loadGame();r.сохр=JSON.stringify(G.lc)===до&&до.length<3000;
  return r;});
 check('7б. перемены — в летописи и молве; у ворот временного прохода звенит',ок.летопись&&ок.молва&&ок.звон,ок);
 check('8а. окно «Живые города»: десять городов, карта состояний, дела гостя; кнопки озвучены; непонятное дело не молчит',
  ок.окно&&ок.городов===10&&ок.немых===0&&ок.помочь&&/Карта состояний/.test(ок.текст)&&ок.немоНет,ок);
 check('8б. пункт «Живые города» в разделе «Мир»; глава руководства; увиденное переживает сохранение',ок.меню&&ок.глава&&ок.сохр,ок);
 check('8в. ошибок страницы нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИтого: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
