/* ══════════════════════════════════════════════════════════════════
   351 — СОХРАНЕНИЕ ПОСРЕДИ ОСОБЫХ СОСТОЯНИЙ (чек-лист игрока, 4 ноября 2026)
   «Сохраняется ли после загрузки» — не только в чистом поле. Каждый раз
   игра сохраняется, открывается новое окно, «Загрузить игру», и герой
   должен оказаться там же и действовать дальше.
   1. Посреди марша по лестнице вниз (после боя с хранителем шахты, если он
      стоит): после загрузки марш продолжается с той же ступени и приводит на
      ярус ниже.
   2. На втором ярусе подземелья: тот же ярус, шаг идёт.
   3. В городе: тот же город, шаг идёт.
   4. В воздухе (крылатый народ): та же высота, шаг идёт, герой садится.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,1500):''));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();let p=await ctx.newPage();const err=[];p.on('pageerror',e=>err.push(String(e)));
 const U=process.argv[2];await p.goto(U);await p.waitForTimeout(1500);
 const нач=async(pg)=>pg.evaluate(()=>{try{enterGame();}catch(_){}for(let k=0;k<20&&activeLayer();k++)closeTopUI();window.maybeEvent=()=>{};window.__с=[];Speech.say=(t)=>{window.__с.push(String(t).slice(0,140));return null;};
  window.__бой=async(предел)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.weaponDrawn=true;for(let k=0;k<(предел||80)&&G.inCombat;k++){const a=G.combat&&G.combat.arena;const dx=a?a.fx-a.px:0,dy=a?a.fy-a.py:0;const d=Math.abs(dx)>=Math.abs(dy)?(dx>0?"E":"W"):(dy>0?"S":"N");
   if(a&&Arena.dist(a)>1){try{move(d);}catch(_){}await w(260);}else{try{weaponSwing(a?d:"N","swipe");}catch(_){}await w(660);}}};});
 /* загрузить в новом окне и проверить, что герой действует */
 const перезагрузка=async()=>{const p2=await ctx.newPage();p2.on('pageerror',e=>err.push(String(e)));await p.close();p=p2;await p.goto(U);await p.waitForTimeout(1500);
  await p.evaluate(async()=>{window.__с=[];Speech.say=(t)=>{window.__с.push(String(t).slice(0,140));return null;};window.maybeEvent=()=>{};CMD.load();await new Promise(z=>setTimeout(z,1200));for(let k=0;k<20&&activeLayer();k++)closeTopUI();});
  await нач(p);};
 const итог={};
 await нач(p);
 /* 1. на ступенях посреди марша */
 итог.марш=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const x0=G.x,y0=G.y;let c=null;
  for(let r=0;r<200&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(cc&&cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c=cc;}
  G.x=c.x;G.y=c.y;enterPlace(c);await w(50);for(let k=0;k<20&&activeLayer();k++)closeTopUI();G.hpMax=Math.max(G.hpMax,3000);G.hp=G.hpMax;
  const lvl=curLevel();const P=G.place;const T=(x,y)=>tileAt(lvl,x,y);const СТЕНА=new Set(["#","%"]);const от=new Map([[P.x+","+P.y,null]]);const оч=[[P.x,P.y]];let цель=null;
  while(оч.length&&!цель){const [x,y]=оч.shift();for(const [d,v] of Object.entries(DIRV)){const nx=x+v[0],ny=y+v[1];const k=nx+","+ny;if(от.has(k))continue;const t=T(nx,ny);if(СТЕНА.has(t))continue;от.set(k,[x,y,d]);if(t===">"){цель=[nx,ny];break;}оч.push([nx,ny]);}}
  const ходы=[];let k=цель[0]+","+цель[1];while(от.get(k)){const [px,py,d]=от.get(k);ходы.unshift(d);k=px+","+py;}
  for(const d of ходы){move(d);for(let k=0;k<20&&activeLayer();k++)closeTopUI();}const посл=ходы[ходы.length-1];const НАЗАД={N:"S",S:"N",W:"E",E:"W"};
  const лог=[];for(let i=0;i<40&&!G.flight;i++){window.__с.length=0;for(let k=0;k<20&&activeLayer();k++)closeTopUI();if(G.inCombat){G.hp=G.hpMax;await window.__бой(200);лог.push(["бой",G.inCombat,G.hp]);continue;}if(P.arm&&P.arm.x===P.x&&P.arm.y===P.y){const rr=move(P.arm.dir);лог.push(["вниз",rr,P.x,P.y,window.__с.slice(0,2).join("|")]);continue;}move(НАЗАД[посл]);move(посл);лог.push(["назад-вперёд",P.x,P.y,tileAt(lvl,P.x,P.y),JSON.stringify(P.arm),window.__с.slice(-2).join("|")]);}
  if(!G.flight)return {марш:false,лог:лог.slice(0,12),посл};move(G.flight.md);move(G.flight.md);const ступень=G.flight.i,всего=G.flight.n;saveGame(true);return {марш:true,ступень,всего,ярус:P.depth};});
 if(итог.марш.марш){await перезагрузка();
  итог.марш.после=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const f=G.flight;const до={место:G.place&&G.place.kind,ярус:G.place&&G.place.depth,марш:f?[f.i,f.n]:null,слово:window.__с.slice(0,2)};
   for(let i=0;i<60&&G.place&&G.place.depth===до.ярус;i++){if(G.flight)move(G.flight.md);else break;await w(2);}
   return {...до,дошёл:G.place&&G.place.depth,маршПосле:!!G.flight};});}
 /* 2. на втором ярусе подземелья */
 итог.ярус=await p.evaluate(()=>{const P=G.place;if(!P)return {нет:true};saveGame(true);return {ярус:P.depth,x:P.x,y:P.y};});
 await перезагрузка();
 итог.ярус.после=await p.evaluate(()=>{const P=G.place;if(!P)return {место:null};const x0=P.x,y0=P.y;let шаг=false;for(const d of ["N","E","S","W"]){move(d);for(let k=0;k<20&&activeLayer();k++)closeTopUI();if(P.x!==x0||P.y!==y0){шаг=true;break;}}
  return {ярус:P.depth,шаг};});
 /* 3. в городе */
 итог.город=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));safeFn(()=>leavePlace());G.place=null;G.flight=null;for(let k=0;k<20&&activeLayer();k++)closeTopUI();
  const x0=G.x,y0=G.y;let c=null;for(let r=0;r<200&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(cc&&cc.structure&&PLACE_KIND[cc.structure.type]==="city")c=cc;}
  G.x=c.x;G.y=c.y;enterPlace(c);await w(50);for(let k=0;k<20&&activeLayer();k++)closeTopUI();saveGame(true);return {вид:G.place&&G.place.kind,имя:c.structure.name};});
 await перезагрузка();
 итог.город.после=await p.evaluate(()=>{const P=G.place;if(!P)return {место:null};const x0=P.x,y0=P.y;let шаг=false;for(const d of ["N","E","S","W"]){move(d);for(let k=0;k<20&&activeLayer();k++)closeTopUI();if(!G.place||P.x!==x0||P.y!==y0){шаг=true;break;}}
  return {вид:P.kind,шаг,слово:window.__с.slice(0,1)};});
 /* 4. в воздухе (крылатый народ) */
 итог.небо=await p.evaluate(()=>{safeFn(()=>leavePlace());G.place=null;for(let k=0;k<20&&activeLayer();k++)closeTopUI();
  const крылатый=(typeof RACES_DB!=="undefined"?RACES_DB:[]).find(r=>Number(r.fly)>0);if(!крылатый)return {нет:"крылатых нет"};
  G.race=крылатый.n;G.wingTired=0;const ok=takeOff();saveGame(true);return {раса:G.race,взлёт:ok,выс:G.alt};});
 await перезагрузка();
 итог.небо.после=await p.evaluate(()=>{const выс=G.alt;const x0=G.x,y0=G.y;let шаг=false;for(const d of ["N","E","S","W"]){move(d);for(let k=0;k<20&&activeLayer();k++)closeTopUI();if(G.x!==x0||G.y!==y0){шаг=true;break;}}
  let сел=false;for(let i=0;i<5&&G.alt>0;i++)safeFn(()=>descend());сел=!(G.alt>0);return {выс,шаг,сел};});
 const м=итог.марш,я=итог.ярус,г=итог.город,н=итог.небо;
 check('1. посреди марша вниз: после загрузки марш продолжается с той же ступени и ведёт на ярус ниже',
  м.марш&&м.после&&м.после.место==="dungeon"&&м.после.марш&&м.после.марш[0]===м.ступень&&м.после.дошёл===м.ярус+1,м);
 check('2. на втором ярусе подземелья: после загрузки тот же ярус, шаг идёт',я.ярус===2&&я.после&&я.после.ярус===2&&я.после.шаг,я);
 check('3. в городе: после загрузки тот же город, шаг идёт',г.вид==="city"&&г.после&&г.после.вид==="city"&&г.после.шаг,г);
 check('4. в воздухе: после загрузки та же высота, шаг идёт, герой садится',н.взлёт&&н.выс>=1&&н.после&&н.после.выс===н.выс&&н.после.шаг&&н.после.сел,н);
 check('ошибок страницы нет',!err.length,err.slice(0,5));
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fails}/${results.length} PASS`);
 await b.close();process.exit(fails?1:0);})();
