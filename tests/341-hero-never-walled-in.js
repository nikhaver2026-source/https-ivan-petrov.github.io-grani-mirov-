/* ═══════════════════════════════════════════════════════════════════════
   341 — ГЕРОЙ НЕ ЗАМУРОВАН (после 17.5, просьба игрока)
   «В последней версии игры я оказался в подземелье, в тупике, на одной
   клетке, а по четырём сторонам стены. И выбраться я не смог».
   Проверяется:
   1. Сохранение, где клетка героя — толща камня (ярус лёг иначе), после
      загрузки ставит героя на проход, от которого шагами дойти до выхода.
   2. Обычное сохранение в ярусе и в тайной палате после загрузки — на той
      же клетке: защита не трогает законное место.
   3. Шаг, когда со всех четырёх сторон стена, выводит к проходу.
   4. Вход на ярус проверяет клетку: герой, поставленный в камень, выходит.
   5. Перенос слышен: игра говорит, что герой выбрался к проходу.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const ctx=await browser.newContext();
 const новая=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(()=>{window.__gvAuto=true;window.__tts=[];
   try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
   window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
    stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
  await p.goto(process.argv[2]);await p.waitForTimeout(900);
  await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};
   window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){window.__said.push(String(t));return s0(t,o);};});return p;};
 /* осмотр: клетка героя и достижим ли выход */
 const осмотр=p=>p.evaluate(()=>{const pl=G.place;if(!pl)return {нет:true};const lvl=curLevel();const t=(x,y)=>tileAt(lvl,x,y);
  const об=НеЗамурован.область(lvl,pl.x,pl.y);return {x:pl.x,y:pl.y,клетка:t(pl.x,pl.y),выход:об.some(([x,y])=>НеЗамурован.выходЛи(lvl,x,y)),область:об.length,тайник:!!pl.тайник};});
 const вПодземелье=`(()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
   G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();if(G.inCombat){G.inCombat=false;G.combat=null;}})()`;
 /* клетка толщи камня: стена со стенами со всех четырёх сторон */
 const вКамень=`(()=>{const lvl=curLevel();for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){
   if([[0,0],[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>tileAt(lvl,x+dx,y+dy)==="#")){G.place.x=x;G.place.y=y;return {x,y};}}return null;})()`;

 /* 1. загрузка сохранения с клеткой в камне */
 let a=await новая();
 const камень=await a.evaluate(new Function(`${вПодземелье};return ${вКамень};`));
 const raw1=await a.evaluate(()=>serializeSave());await a.close();
 let b=await новая();
 await b.evaluate(raw=>applySave(raw,"проба"),raw1);await b.waitForTimeout(1600);
 const п1=await осмотр(b);const сказано1=await b.evaluate(()=>window.__said.join(" | "));
 check('1. сохранение с клеткой в толще камня: после загрузки герой на проходе, выход достижим',
  !!камень&&п1.клетка!=="#"&&п1.выход&&п1.область>10,{камень,п1});
 check('5. игра говорит, что герой выбрался к проходу',/выбрались к ближайшему проходу/.test(сказано1),сказано1.slice(-300));
 await b.close();

 /* 2. законные места не трогаются: ярус и тайная палата */
 a=await новая();
 const до2=await a.evaluate(new Function(`${вПодземелье};const lvl=curLevel();for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)if(tileAt(lvl,x,y)==="."&&связно(lvl,x,y)){G.place.x=x;G.place.y=y;return {x,y};}return null;
   function связно(l,x,y){return НеЗамурован.область(l,x,y).some(([cx,cy])=>НеЗамурован.выходЛи(l,cx,cy));}`));
 const raw2=await a.evaluate(()=>serializeSave());
 const тайник=await a.evaluate(()=>{G.place={kind:"dungeon",bx:1200,by:1300,stype:"dungeon",name:"Проба",depth:3,x:1,y:1};
  const l=curLevel();let w=null;for(let y=2;y<l.h-2&&!w;y++)for(let x=2;x<l.w-2;x++){if(tileAt(l,x,y)==="#"&&tileAt(l,x+1,y)==="."&&!propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,undefined)){w={x,y};break;}}
  G.place.x=w.x+1;G.place.y=w.y;const v=secretVault(G.place.bx,G.place.by,w.x,w.y);secretMark(v.ключ,"найден");passageNote(w.x,w.y,null,true);
  enterSecret(w.x,w.y,null,true);const lv=curLevel();G.place.x=lv.находка?lv.находка.x:G.place.x;G.place.y=lv.находка?lv.находка.y:G.place.y;return {x:G.place.x,y:G.place.y,тайник:!!G.place.тайник};});
 const raw3=await a.evaluate(()=>serializeSave());await a.close();
 b=await новая();await b.evaluate(raw=>applySave(raw,"проба"),raw2);await b.waitForTimeout(1200);const п2=await осмотр(b);await b.close();
 b=await новая();await b.evaluate(raw=>applySave(raw,"проба"),raw3);await b.waitForTimeout(1200);const п3=await осмотр(b);await b.close();
 check('2. обычное место в ярусе после загрузки — та же клетка',!!до2&&п2.x===до2.x&&п2.y===до2.y,{до2,п2});
 check('2б. тайная палата после загрузки — та же клетка, палата на месте',тайник.тайник&&п3.тайник&&п3.x===тайник.x&&п3.y===тайник.y&&п3.выход,{тайник,п3});

 /* 3. шаг в замурованной клетке выводит к проходу */
 a=await новая();
 const п4=await a.evaluate(new Function(`${вПодземелье};const к=${вКамень};const до={x:G.place.x,y:G.place.y};moveInside("N");
   const lvl=curLevel();const об=НеЗамурован.область(lvl,G.place.x,G.place.y);
   return {к,до,после:{x:G.place.x,y:G.place.y,клетка:tileAt(lvl,G.place.x,G.place.y)},выход:об.some(([x,y])=>НеЗамурован.выходЛи(lvl,x,y))};`));
 check('3. шаг, когда со всех сторон стена, выводит к проходу с выходом',!!п4.к&&п4.после.клетка!=="#"&&п4.выход,п4);

 /* 4. вход на ярус: клетка проверяется */
 const п5=await a.evaluate(new Function(`const до=G.place.depth;safeFn(()=>markGuardianDead(G.place.bx,G.place.by,G.place.depth));
   const ok=changeDepth(1,{bypass:true});while(activeLayer())closeTopUI();
   const lvl=curLevel();const об=НеЗамурован.область(lvl,G.place.x,G.place.y);
   return {ok,глуб:G.place.depth,клетка:tileAt(lvl,G.place.x,G.place.y),выход:об.some(([x,y])=>НеЗамурован.выходЛи(lvl,x,y))};`));
 check('4. на новом ярусе герой стоит там, откуда достижим выход',п5.ok&&п5.клетка!=="#"&&п5.выход,п5);
 await a.close();

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
