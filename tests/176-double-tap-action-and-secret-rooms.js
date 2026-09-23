/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 176: ДЕЙСТВИЕ — ДВОЙНЫМ КАСАНИЕМ, ТАЙНЫЙ ХОД ВЕДЁТ ВНУТРЬ

   Две жалобы игрока. Первая: действие с сундуком, статуей и прочим висело
   на свайпе двумя пальцами вниз, а тот же свайп закрывает окна — и одно
   мешало другому. Вторая: рычаг открывал тайный ход, но войти в него было
   нельзя. Касания — настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Двойное касание одним пальцем по полю — действие здесь: вход в
      постройку, сундук под ногами. Одиночное касание по-прежнему не делает
      ничего.
   2. Свайп двумя пальцами вниз только закрывает: на пустом поле он не
      действует, а говорит, что действие — двойным касанием; закрыв окно,
      повторный свайп не трогает сундук.
   3. Взведённая кнопка сильнее поля: второе касание мимо неё выполняет её.
   4. Привязки: «закрыть окно» стоит на двух пальцах вниз, «взаимодействие»
      можно повесить туда обратно, и тогда свайп ведёт себя по-старому.
   5. Тайный ход за вещью: вещь открывает ход, двойное касание переносит
      героя в палату — настоящее место со своим отзвуком, лазом и находкой.
      Находку берут, дойдя до неё; выбираются шагом в стену с лаза.
   6. Рычаг: ход за кладкой открывается и в него можно войти — двойным
      касанием рядом, повторной тягой и пунктом меню «Войти в тайный ход».
   7. Простукивание стены: шаг в отъехавшую кладку уводит внутрь.
   8. Старые сохранения: ход, открытый до правки, тоже впускает.
   9. Палата не берёт чужого: ни ловушек яруса, ни живности, ни спуска; из
      палаты «выйти» — значит выбраться лазом; сохранение внутри палаты
      восстанавливается.
   10. Руководство, самопроверка, README, docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const ROOT=path.resolve(__dirname,'..');
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(400);
 await page.evaluate(()=>{window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};
  settings.fastTap=0;while(activeLayer())closeTopUI();});
 const said=()=>page.evaluate(()=>window.__said.slice());
 const clr=()=>page.evaluate(()=>{window.__said.length=0;});
 async function tap(x=195,y=430){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(50);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(110);}
 async function dbl(x=195,y=430){await tap(x,y);await tap(x,y);await page.waitForTimeout(250);}
 async function swipe(dx,dy,fingers=1,steps=6){
  const x=150,y=430;
  const pts=k=>Array.from({length:fingers},(_,i)=>({x:x+i*45+Math.round(dx*k/steps),y:y+Math.round(dy*k/steps),id:i}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(0)});
  await page.waitForTimeout(16);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(k)});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(260);}

 /* ── 1. Двойное касание по полю — вход в постройку ── */
 const вход=await page.evaluate(()=>{
  G.place=null;G.ship=null;G.inCombat=false;G.alt=0;
  const W=WORLD>>1;
  for(let r=0;r<400;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=cellContent(W+dx,W+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]==="house"&&!airOnly(c.structure.type)){G.x=W+dx;G.y=W+dy;return {x:G.x,y:G.y,имя:c.structure.name};}}
  return null;});
 check('нашлась постройка для проверки входа',!!вход,вход);
 await clr();
 await tap();await page.waitForTimeout(900);
 const послеОдного=await page.evaluate(()=>!!G.place);
 await dbl();
 const послеДвойного=await page.evaluate(()=>({внутри:!!G.place,имя:G.place&&G.place.name}));
 check('одиночное касание поля ничего не делает',послеОдного===false,{послеОдного});
 check('двойное касание одним пальцем по полю — действие здесь: герой входит в постройку',
  послеДвойного.внутри===true,послеДвойного);

 /* ── 1б. Сундук под ногами ── */
 const сундук=await page.evaluate(()=>{
  const lvl=curLevel();
  for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)if(tileAt(lvl,x,y)==="C"){G.place.x=x;G.place.y=y;return {x,y};}
  return null;});
 if(сундук){
  await page.evaluate(()=>{window.__oc=0;const o=openChest;window.openChest=function(){__oc++;return o.apply(this,arguments);};});
  await dbl();
  const открыт=await page.evaluate(()=>window.__oc);
  check('двойное касание на сундуке открывает сундук',открыт===1,{открыт});
 }else check('двойное касание на сундуке открывает сундук (в постройке сундука нет — проверено входом)',true);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 2. Свайп двумя вниз только закрывает ── */
 await page.evaluate(()=>{window.__fi=0;const f=fieldInteract;window.fieldInteract=function(){__fi++;return f.apply(this,arguments);};
  window.__uh=0;const u=useHere;window.useHere=function(){__uh++;return u.apply(this,arguments);};});
 await clr();
 await swipe(0,170,2);
 const пусто=await page.evaluate(()=>({fi:__fi,uh:__uh}));
 const речьПусто=await said();
 check('на пустом поле свайп двумя вниз не действует',пусто.fi===0&&пусто.uh===0,пусто);
 check('и говорит, что закрывать нечего и что действие — двойное касание',
  речьПусто.some(t=>/Закрывать нечего/.test(t)&&/двойное касание/i.test(t)),речьПусто.slice(0,3));
 await page.evaluate(()=>{__fi=0;__uh=0;openActionMenu();});await page.waitForTimeout(200);
 await swipe(0,170,2);
 const закрыл=await page.evaluate(()=>({слой:!!activeLayer(),fi:__fi,uh:__uh}));
 await swipe(0,170,2);
 const второй=await page.evaluate(()=>({слой:!!activeLayer(),fi:__fi,uh:__uh}));
 check('свайп двумя вниз закрывает окно',закрыл.слой===false&&закрыл.fi===0,закрыл);
 check('повторный свайп после закрытия не трогает то, что рядом: конфликта больше нет',второй.fi===0&&второй.uh===0,второй);

 /* ── 3. Взведённая кнопка сильнее поля ── */
 const кнопка=await page.evaluate(()=>{
  const b=document.createElement("button");b.textContent="Проба";b.id="t176btn";document.body.appendChild(b);
  window.__btn=0;b.addEventListener("click",()=>{__btn++;});
  __fi=0;touchGate.lastUiTap=0;touchGate.lastUiEl=null;
  handleSingleTap(b,0,0,Date.now());
  handleSingleTap(null,0,0,Date.now()+120);
  const r={кнопка:__btn,поле:__fi};b.remove();return r;});
 check('второе касание мимо взведённой кнопки выполняет кнопку, а не действие на поле',
  кнопка.кнопка===1&&кнопка.поле===0,кнопка);

 /* ── 4. Привязки ── */
 const привязки=await page.evaluate(()=>{
  const r={умолч:GEST_DEFAULTS["2swipeS"],закрыть:!!GEST_ACTION_BY_ID.close,взаим:!!GEST_ACTION_BY_ID.interact,
   действий:GEST_ACTIONS.length,карта:GESTURE_MAP.find(g=>g.fingers===1&&g.kind==="tap2").n,
   свайп:GESTURE_MAP.find(g=>g.fingers===2&&g.kind==="swipe"&&g.dir==="S").n};
  const было=JSON.stringify(G.gestBind||{});
  gestBind("2swipeS","interact");
  r.привязано=gestActionId("2swipeS");
  G.gestBind=JSON.parse(было);
  return r;});
 check('на двух пальцах вниз по умолчанию — «закрыть окно», взаимодействие остаётся действием для привязки',
  привязки.умолч==="close"&&привязки.закрыть&&привязки.взаим&&привязки.действий===33&&привязки.привязано==="interact",привязки);
 check('карта жестов: двойное касание одним пальцем — действие на поле, два вниз — только закрыть',
  /на поле — действие/.test(привязки.карта)&&/ничего не делает/.test(привязки.свайп),привязки);
 await page.evaluate(()=>{G.gestBind=G.gestBind||{};G.gestBind["2swipeS"]="interact";__fi=0;});
 await swipe(0,170,2);
 const постарому=await page.evaluate(()=>{const r=__fi;delete G.gestBind["2swipeS"];return r;});
 check('повесив «взаимодействие» на два пальца вниз, игрок возвращает прежнее поведение',постарому===1,{постарому});
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 5. Тайный ход за вещью ── */
 const вещь=await page.evaluate(()=>{
  G.place=null;G.secrets={};G.passages={};
  for(let bx=300;bx<1400;bx+=3){
   const by=bx+11;
   G.place={kind:"house",bx,by,stype:"tavern",depth:0,name:"Проба",x:1,y:1};
   const lvl=curLevel();
   for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){
    if(tileAt(lvl,x,y)!=="X")continue;
    const pr=safeFn(()=>propAt(x,y),null);
    if(pr&&propHidesSwitch(bx,by,0,x,y,pr.id)){G.place.x=x;G.place.y=y;safeFn(()=>Room.set());return {bx,by,x,y,вещь:pr.n};}}}
  G.place=null;return null;});
 check('в постройке нашлась вещь с тайным ходом',!!вещь,вещь);
 await clr();
 await page.evaluate(()=>{window.fieldInteract=fieldInteract;Look.target=null;useProp(G.place.x,G.place.y);});
 const открыт=await said();
 check('вещь открывает ход и говорит, как войти',
  открыт.some(t=>/Открывается ход/.test(t)&&/Коснитесь поля дважды/.test(t)),открыт.slice(-2));
 await clr();
 await dbl();
 const палата=await page.evaluate(()=>{
  const p=G.place,lvl=curLevel();
  return {внутри:!!p.тайник,под:tileAt(lvl,p.x,p.y),отзвук:Room.kind,есть:!!lvl.находка,
   клетки:lvl.g.map(r=>r.join("")).join("/"),находка:lvl.находка,поз:[p.x,p.y]};});
 const речьВход=await said();
 check('двойное касание переносит героя в тайную палату: он стоит на лазе',
  палата.внутри&&палата.под==="Q",палата);
 check('у палаты свой тесный отзвук, лаз и находка',
  палата.отзвук==="vault"&&палата.есть&&/Q/.test(палата.клетки)&&/O/.test(палата.клетки),палата);
 check('о входе сказано: что за палата, где находка и где лаз',
  речьВход.some(t=>/тайной палате/.test(t)&&/Находка лежит/.test(t)&&/Лаз назад/.test(t)),речьВход.slice(-2));
 /* Шагами — к находке. */
 const шаги=[];
 for(let i=0;i<24;i++){
  const d=await page.evaluate(()=>{const p=G.place,н=curLevel().находка;
   if(p.x===н.x&&p.y===н.y)return null;
   return p.x<н.x?"E":p.x>н.x?"W":p.y<н.y?"S":"N";});
  if(!d)break;
  шаги.push(d);
  await swipe(d==="E"?170:d==="W"?-170:0,d==="S"?170:d==="N"?-170:0,1);}
 const уНаходки=await page.evaluate(()=>tileAt(curLevel(),G.place.x,G.place.y));
 check('до находки доходят обычными шагами',уНаходки==="O",{уНаходки,шаги});
 const доНаграды=await page.evaluate(()=>({g:G.gold,n:(G.artifacts||[]).length+(G.items||[]).length+(G.abilities||[]).length+(G.skills||[]).length+(G.spells||[]).length+(G.mounts||[]).length}));
 await clr();
 await dbl();
 const награда=await page.evaluate(()=>({g:G.gold,n:(G.artifacts||[]).length+(G.items||[]).length+(G.abilities||[]).length+(G.skills||[]).length+(G.spells||[]).length+(G.mounts||[]).length,
  клетка:tileAt(curLevel(),G.place.x,G.place.y)}));
 check('двойное касание на находке — награда и золото, а клетка пустеет',
  награда.n===доНаграды.n+1&&награда.g>доНаграды.g&&награда.клетка==="q",{доНаграды,награда});
 /* Назад к лазу и шаг в стену. */
 for(let i=0;i<24;i++){
  const d=await page.evaluate(()=>{const p=G.place,q=curLevel().entry;
   if(p.x===q.x&&p.y===q.y)return null;
   return p.x<q.x?"E":p.x>q.x?"W":p.y<q.y?"S":"N";});
  if(!d)break;
  await swipe(d==="E"?170:d==="W"?-170:0,d==="S"?170:d==="N"?-170:0,1);}
 await clr();
 await swipe(-170,0,1);
 const вышел=await page.evaluate(()=>({внутри:!!G.place.тайник,поз:[G.place.x,G.place.y],отзвук:Room.kind}));
 check('шаг с лаза в стену выводит назад, на ту же клетку, откуда входили',
  вышел.внутри===false&&вышел.поз[0]===вещь.x&&вышел.поз[1]===вещь.y&&вышел.отзвук!=="vault",{вышел,вещь});
 const пустая=await page.evaluate(()=>{window.__said.length=0;useProp(G.place.x,G.place.y);return {внутри:!!G.place.тайник,said:window.__said.slice()};});
 check('в опустевшую палату второй раз не зовут',!пустая.внутри,пустая);

 /* ── 6. Рычаг: ход за кладкой ── */
 const рыч=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place=null;
  for(let bx=500;bx<2500;bx+=3)for(const dp of [1,2,3]){
   const by=bx+3;
   G.place={kind:"dungeon",bx,by,stype:"ruins",depth:dp,name:"Р",x:1,y:1};
   const L=curLevel();
   for(let y=1;y<L.h-1;y++)for(let x=1;x<L.w-1;x++){
    if(L.g[y][x]!=="X")continue;const pr=propAt(x,y);if(!pr||pr.id!=="lever")continue;
    if(leverKind(x,y)!=="ход")continue;
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[0,0]])
     if(propHidesSwitch(bx,by,dp,x+dx,y+dy,undefined)){G.place=null;return {bx,by,dp,x,y,cx:x+dx,cy:y+dy};}}}
  G.place=null;return null;});
 check('нашёлся рычаг, который открывает ход',!!рыч,рыч);
 if(рыч){
  const тяга=await page.evaluate((r)=>{
   G.secrets={};G.passages={};G.marks={};
   G.place={kind:"dungeon",bx:r.bx,by:r.by,stype:"ruins",depth:r.dp,name:"Р",x:r.x,y:r.y};
   window.__said.length=0;
   IACT.pull.делать({x:r.x,y:r.y,плитка:"X",вещь:"lever",n:"рычаг"});
   const меню=(()=>{try{const l=objectsHere().find(z=>z.x===r.x&&z.y===r.y);return l?(actionsFor(l)||[]).map(a=>a.id):null;}catch(_){return null;}})();
   return {said:window.__said.slice(),ход:!!passageAt(r.x,r.y),пункт:IACT.enterpass.можно({x:r.x,y:r.y}),меню};},рыч);
  check('рычаг открывает ход, и он записан',тяга.ход&&тяга.said.some(t=>/Открывается ход/.test(t)),тяга.said.slice(-2));
  check('у рычага появляется пункт «Войти в тайный ход», и он в меню рычага',
   тяга.пункт===true&&Array.isArray(тяга.меню)&&тяга.меню.indexOf("enterpass")>=0,{меню:тяга.меню});
  await clr();
  await dbl();
  const вошёл=await page.evaluate(()=>({внутри:!!(G.place&&G.place.тайник)}));
  check('двойное касание у рычага переносит в палату за кладкой',вошёл.внутри===true,вошёл);
  const повтор=await page.evaluate((r)=>{
   exitSecret();
   window.__said.length=0;
   IACT.pull.делать({x:r.x,y:r.y,плитка:"X",вещь:"lever",n:"рычаг"});
   const внутри=!!G.place.тайник;exitSecret();return {внутри};},рыч);
  check('опущенный рычаг больше не отвечает «своё отработал», а ведёт в ход',повтор.внутри===true,повтор);
  /* Старое сохранение: ход открыт, записи о нём нет. */
  const старое=await page.evaluate((r)=>{
   G.passages={};
   IACT.pull.делать({x:r.x,y:r.y,плитка:"X",вещь:"lever",n:"рычаг"});
   const внутри=!!G.place.тайник;if(внутри)exitSecret();return {внутри};},рыч);
  check('ход, открытый в старом сохранении, тоже впускает',старое.внутри===true,старое);
  await page.evaluate(()=>{G.place=null;});
 }

 /* ── 7. Простукивание: шаг в отъехавшую кладку ── */
 const стена=await page.evaluate(()=>{
  G.secrets={};G.passages={};G.marks={};
  for(let bx=900;bx<3000;bx+=5)for(const dp of [1,2]){
   const by=bx+7;
   G.place={kind:"dungeon",bx,by,stype:"ruins",depth:dp,name:"С",x:1,y:1};
   const L=curLevel();
   for(let y=1;y<L.h-1;y++)for(let x=1;x<L.w-1;x++){
    if(L.g[y][x]!=="#")continue;
    if(!propHidesSwitch(bx,by,dp,x,y,undefined))continue;
    for(const [dx,dy,dir] of [[0,1,"N"],[0,-1,"S"],[1,0,"W"],[-1,0,"E"]]){
     const sx=x+dx,sy=y+dy;if(sx<1||sy<1||sx>=L.w-1||sy>=L.h-1)continue;
     if(L.g[sy][sx]==="."){G.place.x=sx;G.place.y=sy;
      IACT.hollow.делать({x,y,плитка:"#",n:"стена"});
      const открыт=!!passageAt(x,y);
      window.__said.length=0;
      moveInside(dir);
      const внутри=!!G.place.тайник;
      const r={bx,by,x,y,открыт,внутри};
      if(внутри){
       /* Палата не берёт чужого. */
       const lvl=curLevel();
       r.ловушек=0;for(let yy=0;yy<lvl.h;yy++)for(let xx=0;xx<lvl.w;xx++)if(trapAt(xx,yy))r.ловушек++;
       Actors.ensure();r.живность=Actors.list.length;
       r.спуск=changeDepth(1);
       /* Сохранение внутри палаты восстанавливается. */
       const снимок=JSON.parse(JSON.stringify(G.place));
       secretRoomCache.clear();
       G.place=снимок;
       r.восстановлено=!!(curLevel()&&curLevel().тайник&&tileAt(curLevel(),G.place.x,G.place.y)==="Q");
       r.выйти=(leavePlace(),!!G.place&&!G.place.тайник);}
      G.place=null;return r;}}}}
  G.place=null;return null;});
 check('нашлась стена с ходом за кладкой',!!стена,стена);
 if(стена){
  check('простукивание открывает ход, и шаг в отъехавшую кладку уводит внутрь',стена.открыт&&стена.внутри,стена);
  check('в палате нет ни ловушек яруса, ни живности',стена.ловушек===0&&стена.живность===0,стена);
  check('из палаты не спускаются, а «выйти» — значит выбраться лазом',стена.спуск===false&&стена.выйти===true,стена);
  check('сохранение внутри палаты восстанавливает её',стена.восстановлено===true,стена);}

 /* ── 10. Руководство, самопроверка, документы ── */
 const док=await page.evaluate(()=>{
  const гл=GUIDE.find(g=>/Глава 99\./.test(g.title));
  const гл2=GUIDE.find(g=>/Глава 2\. Жесты/.test(g.title));
  const c=JSON.stringify(worldSelfCheck());
  return {глава:гл?гл.title:null,абз:гл?гл.body.length:0,часть:GUIDE_PARTS.find(p=>p[2].indexOf(99)>=0)?.[0]||null,
   гл2:гл2&&гл2.body.some(t=>/на игровом поле — действие здесь/.test(t)),
   сверка:/"secretroom"/.test(c)&&!/"secretroom","ok":false/.test(c),news:NEWS_V};});
 check('глава 99 в первой части, глава 2 говорит о двойном касании на поле',
  !!док.глава&&док.абз>=6&&/Часть I\./.test(док.часть||"")&&док.гл2,док);
 check('самопроверка мира знает тайную палату',док.сверка,док);
 check('новость для вернувшихся — десятая',док.news===10,док.news);
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(ROOT,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 const tr=fs.readFileSync(path.join(ROOT,'tests','README.md'),'utf8');
 check('README, docs и список наборов знают о правке',
  /Действие — двойным касанием/.test(readme)&&/набор 176/.test(вз)&&/176-double-tap-action-and-secret-rooms/.test(tr));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
