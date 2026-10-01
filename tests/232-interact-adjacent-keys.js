/* ════════════════════════════════════════════════════════════════════════
   НАБОР 232: ДЕЙСТВИЕ СО ВСЕМ, ЧТО ВПЛОТНУЮ — E И ENTER; F — ТОЛЬКО СБОР

   В приложении для Windows E и Enter у прилавка отвечали «здесь пусто»,
   потому что действие смотрело только под ноги, и до торговца, сундука,
   чана, горна и наковальни приходилось идти через меню действий. Теперь
   одна клавиша действия (E, запасная — Enter) работает со всем, что под
   ногами или вплотную, а F — только сбор ресурса.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Вплотную к торговцу E и Enter начинают разговор с ним.
   2. Вплотную к сундуку E открывает сундук; к станку (вещь-станок,
      горн) — действие с ним.
   3. Повёрнутый к объекту выбирает его, а не соседний.
   4. F только собирает: на ресурсе — сбор, у торговца — не разговор.
   5. Выход и лестница рядом не уводят с уровня: шаг рядом с ними — не дело.
   6. Под ногами пусто и рядом ничего — честное «пусто», как прежде.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return s0(t,o);};
  /* Живые в доме ходят сами; для проверки ходов не нужно. */
  Actors.ensure=function(){};Actors.stop();});
 const жми=async(code,key)=>page.evaluate(([code,key])=>{
  const e=new KeyboardEvent("keydown",{code,key,bubbles:true,cancelable:true});document.dispatchEvent(e);return e.defaultPrevented;},[code,key]);
 /* Найти уровень с плиткой и свободным полом рядом с ней. */
 const найти=(плитки,виды)=>page.evaluate(([плитки,виды])=>{
  for(const st of виды)for(let bx=3;bx<60;bx++)for(let by=3;by<60;by++){
   const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
    if(плитки.indexOf(tileAt(l,x,y))<0)continue;
    for(const [d,[dx,dy]] of Object.entries(DIRV)){
     const sx=x-dx,sy=y-dy;if(tileAt(l,sx,sy)!==".")continue;
     /* Рядом с местом стояния — только этот объект. */
     const иные=Object.values(DIRV).filter(([ax,ay])=>!(ax===dx&&ay===dy)).map(([ax,ay])=>tileAt(l,sx+ax,sy+ay)).filter(t=>t!=="."&&t!=="#");
     if(иные.length)continue;
     return {st,bx,by,x,y,sx,sy,d,t:tileAt(l,x,y)};}}}
  return null;},[плитки,виды]);
 const встать=(м)=>page.evaluate(м=>{while(activeLayer())closeTopUI();if(G.inCombat){G.inCombat=false;G.combat=null;}
  G.place={kind:"house",bx:м.bx,by:м.by,stype:м.st,name:"Проба",depth:0,x:м.sx,y:м.sy};G.loot=null;lastMoveDir=м.d;__said.length=0;},м);

 /* ── 1. торговец ── */
 const торг=await найти(["S"],["tavern","market","village","castle"]);
 const р1={торг};
 if(торг){
  await page.evaluate(()=>{window.__talk=[];const t0=window.talkInside;window.talkInside=function(t,x,y){__talk.push([t,x,y]);return true;};window.__t0=t0;});
  for(const [code,key] of [["KeyE","e"],["Enter","Enter"]]){await встать(торг);await жми(code,key);}
  Object.assign(р1,await page.evaluate(()=>({разговоров:__talk.length,где:__talk[0],сказано:__said.slice(0,2)})));
  await page.evaluate(()=>{window.talkInside=window.__t0;});}
 check('1. вплотную к торговцу E и Enter начинают разговор с ним, а не «здесь пусто»',
  !!торг&&р1.разговоров===2&&р1.где&&р1.где[1]===торг.x&&р1.где[2]===торг.y&&!/собирать нечего|пусто/i.test((р1.сказано||[]).join(" ")),р1);

 /* ── 2. сундук и станок ── */
 const сундук=await найти(["C"],["tavern","castle","village","forge","school","market"]);
 const р2={сундук};
 if(сундук){await page.evaluate(()=>{window.__ch=[];const o=window.openChest;window.openChest=function(x,y){__ch.push([x,y]);return true;};window.__o=o;});
  await встать(сундук);await жми("KeyE","e");
  Object.assign(р2,await page.evaluate(()=>({открыто:__ch.slice()})));await page.evaluate(()=>{window.openChest=window.__o;});}
 const станок=await найти(["X"],["forge","village","castle","tavern","school"]);
 if(станок){await page.evaluate(()=>{window.__pr=[];const o=window.useProp;window.useProp=function(x,y){__pr.push([x,y]);return true;};window.__u=o;});
  await встать(станок);await жми("Enter","Enter");
  Object.assign(р2,{станок,вещь:await page.evaluate(()=>__pr.slice())});await page.evaluate(()=>{window.useProp=window.__u;});}
 check('2. вплотную к сундуку E открывает его; к вещи-станку Enter — действие с ней',
  !!сундук&&р2.открыто.length===1&&р2.открыто[0][0]===сундук.x&&!!станок&&р2.вещь.length===1&&р2.вещь[0][0]===станок.x,р2);

 /* ── 3. повёрнут к объекту ── */
 const р3=await page.evaluate(()=>{
  for(let bx=3;bx<80;bx++)for(let by=3;by<80;by++){const l=safeFn(()=>genLevel(bx,by,0,"tavern"),null);if(!l)continue;
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){if(tileAt(l,x,y)!==".")continue;
    const соседи=Object.entries(DIRV).map(([d,[dx,dy]])=>({d,t:tileAt(l,x+dx,y+dy),x:x+dx,y:y+dy})).filter(z=>["C","X","S","N","K"].indexOf(z.t)>=0);
    if(соседи.length>=2){
     const цель=соседи[1];window.__hit=null;
     const keep={c:openChest,p:useProp,t:talkInside,k:studyKnowledge};
     window.openChest=(x,y)=>{__hit=[x,y];return true;};window.useProp=(x,y)=>{__hit=[x,y];return true;};
     window.talkInside=(t,x,y)=>{__hit=[x,y];return true;};window.studyKnowledge=(x,y)=>{__hit=[x,y];return true;};
     G.place={kind:"house",bx,by,stype:"tavern",name:"П",depth:0,x,y};lastMoveDir=цель.d;G.loot=null;
     fieldInteract();
     window.openChest=keep.c;window.useProp=keep.p;window.talkInside=keep.t;window.studyKnowledge=keep.k;
     return {цель,попал:__hit};}}}
  return {нет:true};});
 check('3. из двух объектов рядом выбирается тот, к которому герой повернулся',!р3.нет&&р3.попал&&р3.попал[0]===р3.цель.x&&р3.попал[1]===р3.цель.y,р3);

 /* ── 4. F на ресурсе собирает ── */
 const р4=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();G.place=null;
  let где=null;for(let i=0;i<40000&&!где;i++){const x=(i*37)%OLD_WORLD,y=(i*91+5)%OLD_WORLD;const c=safeFn(()=>cellContent(x,y),null);if(c&&c.res&&!c.structure)где={x,y};}
  if(!где)return {нет:true};
  G.x=где.x;G.y=где.y;G.depleted={};
  window.__g=0;const a=GEST_ACTION_BY_ID.gather;const d0=a.делать;a.делать=()=>{__g++;return true;};
  window.__fi2=0;const f0=window.fieldInteract;window.fieldInteract=function(){__fi2++;return true;};
  document.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyF",key:"f",bubbles:true,cancelable:true}));
  const наРесурсе={сбор:__g,действие:__fi2};
  /* шаг в сторону — ресурса нет */
  let пусто=null;for(let i=0;i<40000&&!пусто;i++){const x=(i*53+7)%OLD_WORLD,y=(i*29+11)%OLD_WORLD;const c=safeFn(()=>cellContent(x,y),null);if(c&&!c.res&&!c.structure)пусто={x,y};}
  G.x=пусто.x;G.y=пусто.y;__g=0;__fi2=0;
  document.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyF",key:"f",bubbles:true,cancelable:true}));
  const безРесурса={сбор:__g,действие:__fi2};
  a.делать=d0;window.fieldInteract=f0;return {наРесурсе,безРесурса};});
 check('4. F — только сбор: на ресурсе и без него зовёт сбор, действие с объектом не трогает',!р4.нет&&р4.наРесурсе.сбор===1&&р4.наРесурсе.действие===0&&р4.безРесурса.сбор===1&&р4.безРесурса.действие===0,р4);

 /* ── 5. выход и лестница рядом ── */
 const выход=await найти(["G","<"],["tavern","village","castle"]);
 const р5={выход};
 if(выход){await встать(выход);await жми("KeyE","e");
  Object.assign(р5,await page.evaluate(()=>({внутри:!!G.place,сказано:__said.slice(0,2)})));}
 check('5. выход или лестница вплотную не уводят с уровня от нажатия действия',!!выход&&р5.внутри,р5);

 /* ── 6. пусто ── */
 const р6=await page.evaluate(()=>{
  for(let bx=3;bx<80;bx++)for(let by=3;by<80;by++){const l=safeFn(()=>genLevel(bx,by,0,"tavern"),null);if(!l)continue;
   for(let y=2;y<l.h-2;y++)for(let x=2;x<l.w-2;x++){
    let ok=true;for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1&&ok;dx++)if(tileAt(l,x+dx,y+dy)!==".")ok=false;
    if(ok){while(activeLayer())closeTopUI();G.place={kind:"house",bx,by,stype:"tavern",name:"П",depth:0,x,y};G.loot=null;__said.length=0;
     fieldInteract();return {сказано:__said.join(" "),окно:!!activeLayer()};}}}
  return {нет:true};});
 check('6. под ногами и рядом пусто — честное «пусто», окно не открывается',!р6.нет&&/пусто/i.test(р6.сказано)&&!р6.окно,р6);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
