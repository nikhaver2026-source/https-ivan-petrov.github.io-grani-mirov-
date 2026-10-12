/* ════════════════════════════════════════════════════════════════════════
   НАБОР 308: 14.7 — ДВЕРИ, СТРАЖА У ВОРОТ, «ПОСТУЧАТЬСЯ / ОТКРЫТЬ»,
   СОКРОВИЩНИЦА, КЛАВИШИ H И SHIFT+H

   Просьбы игрока: «главный игрок сам открывал двери — они не должны быть
   открыты по умолчанию; открывает по двойному касанию или ключом»; «не было
   автоматического входа в поселения: на входе встречает стража — кто, зачем,
   откуда и куда — и берёт плату за вход по репутации, отношению и заслугам»;
   «входит в кузницу, в мастерскую — меню: постучаться или открыть»; «открыл
   сокровищницу ключом, а войти не может — ни двойным касанием, никак»;
   «в Windows на H — только здоровье, на Shift+H — всё остальное».
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__тихо=()=>{G.inCombat=false;G.combat=null;safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  window.__окно=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.querySelector("#eventBody .list-line")||{}).textContent,выбор:(curEvent&&curEvent.choices||[]).map(c=>c.l)}:null;};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};});
 const W=ms=>page.waitForTimeout(ms);

 /* ── 1. дверь в подземелье: упёрся — закрыта; двойное касание — открыл; ещё раз — прошёл ── */
 const д=await page.evaluate(()=>{
  for(let bx=0;bx<10;bx++)for(let by=0;by<10;by++){const lvl=genLevel(bx,by,1,"ruins");
   for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){if(lvl.g[y][x]!=="+")continue;
    for(const [dir,v] of Object.entries(DIRV)){const sx=x-v[0],sy=y-v[1],ox=x+v[0],oy=y+v[1];
     if(lvl.g[sy]&&lvl.g[sy][sx]==="."&&lvl.g[oy]&&lvl.g[oy][ox]==="."){
      G.place={kind:"dungeon",bx,by,stype:"ruins",depth:1,name:"м",x:sx,y:sy};G.marks={};__тихо();
      const o={};__said=[];moveInside(dir);o.упёрся=G.place.x===sx&&G.place.y===sy;o.слова=__said.join(" | ");o.закрыта=placeMark(x,y)!=="open";
      __said=[];fieldInteract();o.открыл=placeMark(x,y)==="open";o.стоит=G.place.x===sx&&G.place.y===sy;o.слова2=__said.join(" | ").slice(0,160);
      __тихо();__said=[];fieldInteract();o.прошёл=G.place.x===ox&&G.place.y===oy;
      /* запертая: без ключа — держит; с ключом — двойное касание отпирает */
      G.place.x=sx;G.place.y=sy;G.place.door147=null;setPlaceMark(x,y,"locked");G.items=(G.items||[]).filter(i=>!/ключ/i.test(i));
      __said=[];moveInside(dir);fieldInteract();o.безКлюча=placeMark(x,y)==="locked"&&G.place.x===sx&&G.place.y===sy;
      const hk=window.hasKey;window.hasKey=()=>true;__said=[];fieldInteract();o.ключом=placeMark(x,y)==="open";o.словаКлюча=__said.join(" | ").slice(0,120);window.hasKey=hk;
      return o;}}}}
  return {нет:true};});
 check('1. шаг в закрытую дверь не открывает её: герой упирается, игра говорит, что дверь закрыта',
  д.упёрся&&д.закрыта&&/закрыта\. Двойное касание — открыть/.test(д.слова),д);
 check('2. двойное касание открывает дверь (герой на месте), второе — проводит насквозь',д.открыл&&д.стоит&&д.прошёл&&/открыли дверь/.test(д.слова2),д);
 check('3. запертая дверь без ключа держит, с ключом двойное касание отпирает и открывает',д.безКлюча&&д.ключом&&/Ключ повернулся/.test(д.словаКлюча),д);

 /* ── 4–5. сокровищница: ключ по двойному касанию, вход двойным касанием и шагом ── */
 const с=await page.evaluate(()=>{
  for(let bx=0;bx<8;bx++)for(let by=0;by<8;by++)for(let d=2;d<=3;d++){const lvl=genLevel(bx,by,d,"ruins");const v=lvl.vault;if(!v)continue;
   const внутри=(x,y)=>x>=v.x0&&x<v.x0+v.w&&y>=v.y0&&y<v.y0+v.h;
   for(const [dir,vv] of Object.entries(DIRV)){const sx=v.door.x-vv[0],sy=v.door.y-vv[1],ix=v.door.x+vv[0],iy=v.door.y+vv[1];
    if(!(lvl.g[sy]&&lvl.g[sy][sx]==="."&&!внутри(sx,sy)&&внутри(ix,iy)&&lvl.g[iy][ix]==="."))continue;
    G.place={kind:"dungeon",bx,by,stype:"ruins",depth:d,name:"м",x:sx,y:sy};G.marks={};G.vaults={};G.items=[VAULT_KEY];__тихо();
    const o={};__said=[];moveInside(dir);o.держит=G.place.x===sx&&G.place.y===sy&&!vaultIsOpen(v.door.x,v.door.y);o.слова=__said.join(" | ");
    __said=[];fieldInteract();o.ключУшёл=!(G.items||[]).includes(VAULT_KEY);o.открыта=vaultIsOpen(v.door.x,v.door.y);
    __тихо();__said=[];fieldInteract();o.внутри=вСокровищнице(curLevel(),G.place.x,G.place.y);o.слова2=__said.join(" | ").slice(0,200);
    /* открыта из меню, герой повернулся в другую сторону: двойное касание всё равно вводит */
    G.place.x=sx;G.place.y=sy;G.place.door147=null;lastMoveDir=dir==="N"?"E":"N";__тихо();fieldInteract();o.изМеню=вСокровищнице(curLevel(),G.place.x,G.place.y);
    /* отметка двери потерялась (палата помнится в G.vaults): шаг проходит в проём */
    G.place.x=sx;G.place.y=sy;G.place.door147=null;G.marks={};__тихо();moveInside(dir);o.шагом=G.place.x===v.door.x&&G.place.y===v.door.y;
    __тихо();moveInside(dir);o.шагомВнутри=вСокровищнице(curLevel(),G.place.x,G.place.y);
    return o;}}
  return {нет:true};});
 check('4. сокровищница: шаг упирается, двойное касание поворачивает ключ (ключ уходит), следующее двойное касание вводит в палату',
  с.держит&&/Ключ при вас: двойное касание/.test(с.слова)&&с.ключУшёл&&с.открыта&&с.внутри,с);
 check('5. в открытую сокровищницу входят двойным касанием с любой стороны и шагом — даже если отметка двери потерялась',с.изМеню&&с.шагом&&с.шагомВнутри,с);

 /* ── 6–8. город: дверь дома — «Постучаться / Открыть дверь / Отойти»; ночью заперто; служба в доме — сразу ── */
 const г=await page.evaluate(()=>{const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;G.hour=12;G.place=null;enterPlace(cellContent(c.x,c.y));const lvl=curLevel();
  for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){if(lvl.g[y][x]!=="+")continue;
   for(const [dir,v] of Object.entries(DIRV)){const sx=x-v[0],sy=y-v[1];if(tileAt(lvl,sx,sy)!==".")continue;
    G.place.x=sx;G.place.y=sy;const дом=Двери147.дом({x,y,dir,вид:"дверь"});if(!дом||дом.имя!=="трактир")continue;
    G.marks={};__тихо();__said=[];moveInside(dir);const o={слова:__said.join(" | "),упёрся:G.place.x===sx&&G.place.y===sy};
    __said=[];fieldInteract();o.окно=__окно();window.__дверь={x,y,dir,sx,sy};return o;}}
  return {нет:true};});
 await page.evaluate(()=>{__said=[];resolveEvent(1);});await W(700);
 const г2=await page.evaluate(()=>{const d=__дверь;return {открыта:placeMark(d.x,d.y)==="open",вошёл:G.place.x!==d.sx||G.place.y!==d.sy,где:[G.place.x,G.place.y],журнал:(G.journal||[]).slice(-2)};});
 check('6. дверь трактира в городе: упёрся — «закрыта: трактир», двойное касание — «Постучаться», «Открыть дверь», «Отойти»; открыл — вошёл',
  г.упёрся&&/закрыта: трактир\. Двойное касание — постучаться или открыть/.test(г.слова)&&г.окно&&г.окно.выбор.join()==="Постучаться,Открыть дверь,Отойти"&&г2.открыта&&г2.вошёл,{г,г2});
 const н=await page.evaluate(async()=>{const lvl=curLevel();G.hour=23;
  for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){if(lvl.g[y][x]!=="+"||placeMark(x,y)==="open")continue;
   for(const [dir,v] of Object.entries(DIRV)){const sx=x-v[0],sy=y-v[1];if(tileAt(lvl,sx,sy)!==".")continue;
    G.place.x=sx;G.place.y=sy;const дом=Двери147.дом({x,y,dir,вид:"дверь"});if(!дом||!дом.жилой)continue;
    __тихо();moveInside(dir);fieldInteract();const o={окно:__окно()};__said=[];resolveEvent(1);o.открыть=__said.join(" | ");o.заперто=placeMark(x,y)!=="open";
    /* стук: в городе вас уважают — хозяин откроет */
    const имя=(isCityAt(G.place.bx,G.place.by)||{}).name||G.place.name;G.standing=G.standing||{};G.standing["city:"+имя]=40;
    G.place.door147=null;moveInside(dir);fieldInteract();__said=[];resolveEvent(0);
    await new Promise(r=>setTimeout(r,2000));o.стук=__said.join(" | ").slice(0,200);o.открылиНаСтук=placeMark(x,y)==="open";o.вошёл=G.place.x!==sx||G.place.y!==sy;
    G.hour=12;return o;}}
  return {нет:true};});
 check('7. ночью жилой дом заперт изнутри — «Открыть дверь» не открывает; на стук хозяин открывает тому, кого уважают',
  н.окно&&/Сейчас ночь/.test(н.окно.текст)&&/Заперто изнутри/.test(н.открыть)&&н.заперто&&/Вы постучали/.test(н.стук)&&н.открылиНаСтук&&н.вошёл,н);
 const сл=await page.evaluate(()=>{__закрыть();const lvl=curLevel();let м=null;for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="H")м={x,y};
  G.place.x=м.x;G.place.y=м.y;G.hp=10;G.hpMax=100;G.gold=500;__said=[];const r=useHere();return {r,окно:__окно(),hp:G.hp};});
 check('8. лечебница в доме лечит сразу: в дом уже вошли через его дверь, второго стука нет',сл.r===true&&!сл.окно&&сл.hp===100,сл);

 /* ── 9. мастерская на улице: стук, вошёл — работа; дальше без нового стука ── */
 const м=await page.evaluate(()=>{__закрыть();const lvl=curLevel();G.hour=12;let z=null;
  for(let y=0;y<lvl.h&&!z;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)==="Z"&&обл147(lvl,x,y,УЛИЦА147).n>=УЛИЦА147){z={x,y};break;}
  if(!z)return {нет:true};G.place.x=z.x;G.place.y=z.y;G.place.in147=null;__said=[];const r=useHere();return {z,r,окно:__окно()};});
 await page.evaluate(()=>{__said=[];resolveEvent(0);});await W(1700);
 const м2=await page.evaluate(()=>{const o={слова:__said.join(" | ").slice(0,300),внутри:G.place.in147};__said=[];o.r=useHere();o.окно=__окно();o.сразу=__said.join(" | ").slice(0,120);return o;});
 check('9. мастерская на улице: «Постучаться» — ответ из-за двери и работа мастерской; вошли — дальше без нового стука',
  м.окно&&/дверь/.test(м.окно.заголовок)&&м.окно.выбор[0]==="Постучаться"&&/Вы постучали/.test(м2.слова)&&!!м2.внутри&&!м2.окно&&м2.сразу.length>10,{м,м2});

 /* ── 10. постройка на карте мира — тот же выбор; «Открыть дверь» днём вводит внутрь ── */
 const п=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());G.place=null;G.hour=12;
  let f=null;for(let d=1;d<400&&!f;d++)for(let dx=-d;dx<=d&&!f;dx++)for(const dy of [-d,d]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);
   if(c.structure&&["tavern","forge","temple","market","school"].includes(c.structure.type)){f={x,y,t:c.structure.type,n:c.structure.name};break;}}
  if(!f)return {нет:true};G.x=f.x;G.y=f.y;__said=[];const r=fieldInteract();const o={f,r,окно:__окно(),вошёлСразу:!!G.place};
  __said=[];resolveEvent(1);o.вошёл=!!G.place&&G.place.name===f.n;return o;});
 check('10. постройка на карте мира: двойное касание — «Постучаться / Открыть дверь / Отойти», а не вход с ходу; «Открыть дверь» днём вводит',
  п.окно&&п.окно.выбор.join()==="Постучаться,Открыть дверь,Отойти"&&!п.вошёлСразу&&п.вошёл,п);

 /* ── 11–12. ворота деревни: кто, куда, плата; заплатил — вошёл; второй раз — без платы ── */
 const в=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());G.place=null;G.hour=12;G.gold=100;G.standing={};G.gate147={};G.titles=[];G.deeds={};G.level=1;
  let f=null;for(let d=1;d<300&&!f;d++)for(let dx=-d;dx<=d&&!f;dx++)for(const dy of [-d,d]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);if(c.structure&&c.structure.type==="village"){f={x,y,n:c.structure.name};break;}}
  window.__дер=f;G.x=f.x;G.y=f.y;const o={};fieldInteract();o.кто=__окно();o.вошёлСразу=!!G.place;resolveEvent(0);o.куда=__окно();resolveEvent(0);o.плата=__окно();
  __said=[];resolveEvent(0);return o;});
 await W(800);
 const в2=await page.evaluate(()=>({золото:G.gold,вошёл:!!G.place&&G.place.name===__дер.n,пропуск:Object.keys(G.gate147||{}).length,слова:__said.join(" | ").slice(0,160)}));
 const в3=await page.evaluate(()=>{safeFn(()=>leavePlace());G.place=null;G.x=__дер.x;G.y=__дер.y;__said=[];fieldInteract();return {слова:__said.join(" | "),окно:__окно()};});
 await W(800);
 const в4=await page.evaluate(()=>({вошёл:!!G.place,золото:G.gold}));
 check('11. у ворот деревни стража: «Стой! Кто таков…» → «куда и зачем» → «Плата за вход — 2 золотых»; с ходу не входят',
  в.кто&&/Стой! Кто такова? и откуда/.test(в.кто.текст)&&в.кто.выбор.length===5&&!в.вошёлСразу&&/куда идёшь и зачем/.test(в.куда.текст)&&/Плата за вход — 2 золотых/.test(в.плата.текст),в);
 check('12. заплатил — вошёл, золото списано, пропуск на день; второй раз стража пускает без платы',
  в2.вошёл&&в2.золото===98&&в2.пропуск===1&&/уже платила?»/.test(в3.слова)&&!в3.окно&&в4.вошёл&&в4.золото===98,{в2,в3,в4});

 /* ── 13. плата зависит от отношения, заслуг, часа и цели; дурная слава — отказ и мзда ── */
 const ц=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());G.place=null;G.titles=[];G.deeds={};G.level=1;
  const nc=NAMED_CITIES[0];const f={x:nc.x,y:nc.y,c:cellContent(nc.x,nc.y)};if(!f.c.structure||f.c.structure.type!=="castle")return {нет:true,t:f.c.structure&&f.c.structure.type};const c=f.c;const имя=(isCityAt(f.x,f.y)||{}).name||c.structure.name;
  const при=(s,h,цель)=>{G.standing={};if(s)G.standing["city:"+имя]=s;G.hour=h;const П=Стража147.плата(c,цель);return П.отказ?"отказ":П.плата;};
  const o={обычно:при(0,12,"рынок"),рады:при(30,12,"рынок"),уважают:при(60,12,"рынок"),присматривают:при(-10,12,"рынок"),неверят:при(-30,12,"рынок"),
   ночью:при(0,23,"рынок"),торговцу:при(0,12,"торг"),паломнику:при(0,12,"храм"),доверяют:при(80,12,"рынок"),дурная:при(-80,12,"рынок")};
  G.titles=["а","б","в","г","д"];o.заслуги=Стража147.заслуги();o.поЗаслугам=при(0,12,"рынок");G.titles=[];G.standing={};G.hour=12;return o;});
 check('13. плата за вход у замка: 8 обычно, меньше тем, кому рады и кого уважают, больше тем, за кем присматривают; ночью дороже; торговцу сбор, паломнику скидка; по заслугам и доверию — даром; с дурной славой — отказ',
  ц.обычно===8&&ц.рады===4&&ц.уважают===2&&ц.присматривают===12&&ц.неверят===20&&ц.ночью===12&&ц.торговцу===10&&ц.паломнику===7&&ц.доверяют===0&&ц.дурная==="отказ"&&ц.заслуги>=60&&ц.поЗаслугам===0,ц);
 const мз=await page.evaluate(()=>{const f=__дер;G.place=null;G.gate147={};G.gold=100;G.x=f.x;G.y=f.y;const имя=(isCityAt(f.x,f.y)||{}).name;G.standing={};G.standing["city:"+имя]=-80;
  fieldInteract();resolveEvent(1);resolveEvent(0);const o={окно:__окно()};__said=[];resolveEvent(0);return o;});
 await W(800);
 const мз2=await page.evaluate(()=>{const emp=empireAt(__дер.x,__дер.y);return {вошёл:!!G.place,золото:G.gold,розыск:standOf("crime",emp.short)};});
 check('14. с дурной славой стража не пускает: остаётся мзда — она пропускает, но запоминается',
  мз.окно&&/Не пущу/.test(мз.окно.текст)&&/^Дать мзду/.test(мз.окно.выбор[0])&&мз2.вошёл&&мз2.золото===90&&мз2.розыск>=1,{мз,мз2});

 /* ── 15. шаг на поселение: «вы у ворот, тут стража»; второй шаг — к страже ── */
 const ш=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());G.place=null;G.standing={};G.gate147={};G.hour=12;const f=__дер;
  G.x=f.x+1;G.y=f.y;G.atDoor=null;__said=[];move("W");const o={слова:__said.filter(t=>/ворот|Шагните/.test(t)),у:!!G.atDoor};
  __закрыть();move("W");o.окно=__окно();o.вошёлСразу=!!G.place;__закрыть();return o;});
 check('15. шаг на деревню: «вы у ворот, тут стража», второй шаг ведёт к страже, а не внутрь',
  ш.у&&ш.слова.some(t=>/вы у ворот, тут стража\. Шагните ещё раз на запад или коснитесь дважды — подойдёте к страже/.test(t))&&ш.окно&&/^Ворота/.test(ш.окно.заголовок)&&!ш.вошёлСразу,ш);

 /* ── 16. городские ворота изнутри: упёрся — закрыты, двойное касание — отворил, шаг — в воротах ── */
 const гв=await page.evaluate(()=>{const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;G.place=null;enterPlace(cellContent(c.x,c.y));const lvl=curLevel();G.marks={};
  for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++){if(tileAt(lvl,x,y)!=="G")continue;
   for(const [dir,v] of Object.entries(DIRV)){const sx=x-v[0],sy=y-v[1];if(tileAt(lvl,sx,sy)!==".")continue;
    G.place.x=sx;G.place.y=sy;__тихо();__said=[];moveInside(dir);const o={слова:__said.join(" | "),стоит:G.place.x===sx&&G.place.y===sy};
    __said=[];fieldInteract();o.отворил=placeMark(x,y)==="open";o.слова2=__said.join(" | ");moveInside(dir);o.вВоротах=G.place.x===x&&G.place.y===y;return o;}}
  return {нет:true};});
 check('16. городские ворота изнутри: шаг упирается в закрытые, двойное касание отворяет, шаг ставит в ворота',
  гв.стоит&&/Городские ворота .* закрыты/.test(гв.слова)&&гв.отворил&&/отворили городские ворота/.test(гв.слова2)&&гв.вВоротах,гв);

 /* ── 17. клавиши: H и Tab — только здоровье; Shift+H — всё остальное; в бою так же ── */
 const к=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());__тихо();
  const жми=(code,shift)=>{__said=[];document.dispatchEvent(new KeyboardEvent("keydown",{code,key:code.startsWith("Key")?code.slice(3).toLowerCase():code,shiftKey:!!shift,bubbles:true,cancelable:true}));return __said.join(" | ");};
  const o={H:жми("KeyH"),Tab:жми("Tab"),ShiftH:жми("KeyH",true)};
  G.inCombat=true;G.combat={m:{n:"волк",hp:10},hp:10};o.бойH=жми("KeyH");o.бойShiftH=жми("KeyH",true);__тихо();
  o.помощь=keyHelpText();return o;});
 const тольк=t=>/^Здоровье \d+ из \d+\.$/.test(t);
 check('17. H и Tab — только здоровье; Shift+H — ступень, воля, эфир, мана, уровень, опыт, золото, время и место без здоровья; в бою так же',
  тольк(к.H)&&тольк(к.Tab)&&/Ступень/.test(к.ShiftH)&&/Мана/.test(к.ShiftH)&&/Золото/.test(к.ShiftH)&&!/Здоровье/.test(к.ShiftH)
  &&тольк(к.бойH)&&/^Идёт бой/.test(к.бойShiftH)&&!/Здоровье/.test(к.бойShiftH)&&/Shift\+H/.test(к.помощь),к);

 /* ── 18. руководство ── */
 const р=await page.evaluate(()=>{const все=GUIDE_SRC.map(c=>c.body.join(" ")).join(" ");
  return {двери:/Все двери закрыты, пока вы не откроете их сами/.test(все),дома:/ДОМА В ГОРОДЕ/.test(все)&&/«Постучаться», «Открыть дверь» или «Отойти»/.test(все),
   стража:/СТРАЖА У ВОРОТ/.test(все)&&/плата за вход/.test(все),клавиши:/Shift\+H — всё остальное о герое/.test(все),
   сокровищница:/отпираете дверь двойным касанием/.test(все)};});
 check('18. руководство: закрытые двери, дома в городе, стража у ворот, сокровищница и клавиши H / Shift+H',р.двери&&р.дома&&р.стража&&р.клавиши&&р.сокровищница,р);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
