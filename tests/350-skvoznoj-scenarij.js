/* ══════════════════════════════════════════════════════════════════
   350 — СКВОЗНОЙ СЦЕНАРИЙ ИГРЫ (чек-лист игрока, п. 27, 4 ноября 2026)
   Один герой проходит путь от главного экрана до продолжения после
   повторной загрузки, и на каждом шаге проверяется не наличие кнопки,
   а итог: что изменилось в мире и в суме.
   1. Главный экран: игра открылась, номер версии на месте.
   2. Создание персонажа: «Начать историю» открывает героя — пол, раса,
      народ, «Готово — в путь».
   3. Пролог: звучит первая сцена; «Пропустить» — мир.
   4. Первое место: осмотр называет местность и что рядом.
   5. Житель: разговор открывается, задание берётся и стоит в журнале.
   6. Сбор: герой шагом приходит к ресурсу и собирает его в суму.
   7. Ремесло: рецепт из собранного забирает сырьё и даёт вещь.
   8. Торговля: купленное продаётся дешевле, чем куплено.
   9. Бой: шаг на клетку с тварью — бой; тварь побеждена ударами, опыт
      вырос, клетка очищена, полоса боя убрана.
   10. Подземелье: вход, шаги до лестницы вниз, бой с хранителем шахты (если
       он стоит), марш — второй ярус; выход.
   11. Сохранение и повторная загрузка: новое окно, «Загрузить игру» —
       место, золото, опыт, сума, задания те же.
   12. Продолжение: шаг идёт, взятое задание сдаётся, награда приходит один
       раз.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const T0=Date.now();const check=(n,c,e)=>{results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,1500):''));if(process.env.DBG)console.error(((Date.now()-T0)/1000).toFixed(1)+'с',n.slice(0,40),c);};
(async()=>{
 const browser=await chromium.launch();const errors=[];
 const ctx=await browser.newContext();
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.goto(process.argv[2]);await p.waitForTimeout(1500);

 /* ── 1. Главный экран ── */
 const п1=await p.evaluate(()=>{const t=document.getElementById("screen-title");return {виден:!!t&&!t.hidden,версия:(document.getElementById("gameVersion")||{}).textContent||"",
  кнопок:document.querySelectorAll("#screen-title button").length};});
 check('1. главный экран открыт, номер версии на месте',п1.виден&&/Альфа|\d/.test(п1.версия)&&п1.кнопок>=8,п1);

 const БОЙ=`window.__бой=async(предел)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.weaponDrawn=true;
  for(let k=0;k<(предел||80)&&G.inCombat;k++){const a=G.combat&&G.combat.arena;
   const dx=a?a.fx-a.px:0,dy=a?a.fy-a.py:0;const d=Math.abs(dx)>=Math.abs(dy)?(dx>0?"E":"W"):(dy>0?"S":"N");
   if(a&&Arena.dist(a)>1){try{move(d);}catch(_){}await w(260);}
   else{try{weaponSwing(a?d:"N","swipe");}catch(_){}await w(safeFn(()=>weaponSpeedMs(),600)+60);}}};`;
 await p.evaluate(БОЙ);
 await p.evaluate(()=>{window.__сказ=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){window.__сказ.push(String(t));return null;};window.maybeEvent=()=>{};window.open=()=>null;});

 /* ── 2. Создание персонажа: «Начать историю» сначала открывает героя ── */
 const п2=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const кн=sel=>document.querySelector(sel);
  кн('#screen-title button[data-cmd="story"]').click();await w(400);const слой=activeLayer();const окно=слой&&слой.id;
  const пункты=[...document.querySelectorAll('#heroBody [data-punkt]')].map(x=>x.dataset.punkt);
  /* пол — женский, раса — первая открытая не человек, если есть; народ — первый */
  кн('#heroBody [data-punkt="sex"]').click();await w(150);const ж=кн('#heroBody [data-cmd="heroset:sex:ж"]');ж&&ж.click();await w(150);
  кн('#heroBody [data-punkt="race"]').click();await w(150);
  const расы=[...document.querySelectorAll('#heroBody [data-cmd^="heroset:race:"]')].filter(x=>!x.classList.contains("empty"));const раса=расы.find(x=>!/human/.test(x.dataset.cmd))||расы[0];
  раса&&раса.click();await w(150);
  const нар=кн('#heroBody [data-punkt="people"]');let народ="";if(нар){нар.click();await w(150);const п=кн('#heroBody [data-cmd^="heroset:people:1"]');if(п){п.click();await w(150);}}
  const h=heroEnsure();народ=h.people;const итог={окно,пункты,пол:h.пол,раса:h.race,народ};
  window.__сказ.length=0;кн('#heroBody [data-punkt="done"]').click();await w(1800);
  итог.готов=!!h.made&&window.__сказ.some(t=>/Герой готов/.test(t));итог.окноЗакрыто=!document.getElementById("modal-hero")||document.getElementById("modal-hero").hidden;
  return итог;});
 check('2. создание персонажа: «Начать историю» открывает героя; пол, раса, народ выбираются; «Готово — в путь»',
  п2.окно==="modal-hero"&&п2.пункты.includes("done")&&п2.пол==="ж"&&!!п2.раса&&п2.готов&&п2.окноЗакрыто,п2);

 /* ── 3. Пролог ── */
 const п3=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const intro=document.getElementById("screen-intro");const текст=(document.getElementById("prose")||{}).textContent||"";const пролог={виден:!!intro&&!intro.hidden,текст:текст.length};
  window.__сказ.length=0;document.querySelector('#screen-intro button[data-cmd="enter"]').click();await w(800);
  const g=document.getElementById("screen-game");return {...пролог,мир:!!g&&!g.hidden,вошли:window.__сказ.some(t=>/Вы вошли в мир/.test(t)),раса:G.race};});
 check('3. пролог: первая сцена звучит, «Пропустить» ведёт в мир героем выбранной расы',п3.виден&&п3.текст>40&&п3.мир&&п3.вошли&&!!п3.раса,п3);

 /* ── 4. Первое место ── */
 const п4=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  window.__сказ.length=0;safeFn(()=>look());await w(200);const c=cellContent(G.x,G.y);const сл=window.__сказ.join(" ");
  const рядом=(safeFn(()=>Look.scan(6),[])||[]).length;return {местность:c.terrain[1],назвал:сл.includes(String(c.terrain[1]).slice(0,5)),рядом,слово:сл.slice(0,160)};});
 check('4. первое место: осмотр называет местность, вокруг есть что услышать',п4.назвал&&п4.рядом>0,п4);

 /* ── 5. Житель и задание ── */
 const п5=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.level=Math.max(Number(G.level)||1,3);const x0=G.x,y0=G.y;let найдено=null;
  for(let r=0;r<120&&!найдено;r++)for(let dx=-r;dx<=r&&!найдено;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(!c||!c.structure)continue;
   const ns=safeFn(()=>npcsFor(c),[])||[];for(let i=0;i<ns.length&&!найдено;i++){const n=ns[i];if(!n)continue;const до=(G.quests||[]).length;G.x=c.x;G.y=c.y;
    try{CMD.qtake(n.key||`${c.x},${c.y},${i}`);}catch(_){}await w(5);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();const q=(G.quests||[])[до];
    if(q&&q.type==="fetch"&&q.res)найдено={q,n};else if(q)G.quests.splice(до,1);}}
  if(!найдено)return {найдено:false};const q=найдено.q;window.__q=q.id;
  const жур=safeFn(()=>questsText(),"")||"";return {найдено:true,тип:q.type,ресурс:q.res,нужно:q.need,вЖурнале:жур.includes(String(q.text||"").slice(0,20)),заказчик:q.npc};});
 check('5. житель даёт задание, оно стоит в журнале',п5.найдено&&п5.вЖурнале,п5);

 /* ── 6. Сбор ── */
 const п6=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));["Кирка","Топор лесоруба","Корзина","Лопата"].forEach(n=>{if(!(G.items||[]).includes(n))G.items.push(n);});
  const x0=G.x,y0=G.y;let c=null;
  for(let r=1;r<150&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(cc&&cc.res&&!cc.structure&&!cc.monster&&!(G.depleted&&G.depleted[cc.x+","+cc.y]))c=cc;}
  if(!c)return {нашёл:false};
  /* шагом: встать рядом и шагнуть на клетку */
  let пришёл=false;for(const [d,v] of Object.entries(DIRV)){G.place=null;G.x=c.x-v[0];G.y=c.y-v[1];for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();try{move(d);}catch(_){}await w(5);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
   if(G.inCombat){try{endCombat();}catch(_){}G.inCombat=false;}if(G.x===c.x&&G.y===c.y){пришёл=true;break;}}
  const имя=c.res.name;const до=Number(G.inv[имя])||0;const сум=()=>Object.values(G.inv).reduce((s,v)=>s+(+v||0),0);const s0=сум();
  for(let k=0;k<3;k++){try{CMD.gather();}catch(_){}await w(5);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();}
  window.__рес=имя;return {нашёл:true,пришёл,имя,собрано:сум()-s0};});
 check('6. сбор: герой шагом приходит к ресурсу и собирает его в суму',п6.нашёл&&п6.пришёл&&п6.собрано>0,п6);

 /* ── 7. Ремесло ── */
 const п7=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const имя=window.__рес;
  let i=CRAFT_RECIPES.findIndex(r=>r.из&&r.из[имя]);if(i<0)i=0;const rc=CRAFT_RECIPES[i];
  for(const k in rc.из)if((Number(G.inv[k])||0)<rc.из[k])G.inv[k]=rc.из[k];
  const было=Object.fromEntries(Object.keys(rc.из).map(k=>[k,Number(G.inv[k])||0]));const снимок=JSON.stringify({inv:G.inv,items:G.items,gear:(G.gear||[]).length});
  G.gold=Math.max(Number(G.gold)||0,500);try{CMD.craftdo(i);}catch(_){}await w(10);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  const ушло=Object.keys(rc.из).every(k=>(Number(G.inv[k])||0)<было[k]);return {рецепт:rc.n,изСобранного:!!rc.из[имя],ушло,появилось:снимок!==JSON.stringify({inv:G.inv,items:G.items,gear:(G.gear||[]).length})};});
 check('7. ремесло: рецепт забирает сырьё и даёт вещь',п7.ушло&&п7.появилось,п7);

 /* ── 8. Торговля ── */
 const п8=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const x0=G.x,y0=G.y;const торг=[];
  for(let r=0;r<120&&торг.length<8;r++)for(let dx=-r;dx<=r&&торг.length<8;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(!c||!c.structure)continue;
   (safeFn(()=>npcsFor(c),[])||[]).forEach((n,i)=>{if(торг.length<8&&n&&n.trade)торг.push({key:`${c.x},${c.y},${i}`,c});});}
  if(!торг.length)return {торговец:false};const ключ=row=>row.kind+":"+row.key+":"+row.name;
  for(const t of торг){G.x=t.c.x;G.y=t.c.y;const n=getNPCByKey(t.key);if(!n)continue;G.gold=Math.max(Number(G.gold)||0,3000);
   openTrade(t.key,"buy");await w(10);const rows=safeFn(()=>shopStockRows(n),[])||[];
   for(let i=0;i<Math.min(rows.length,30);i++){const до=new Map(invAll().map(r=>[ключ(r),r.n||1]));const g0=G.gold;try{CMD.shopitem(i);await w(5);if(G.gold===g0){CMD.shopitem(i);await w(5);}}catch(_){continue;}
    for(let __k=0;__k<20&&activeLayer()&&activeLayer().id!=="modal-shop";__k++)closeTopUI();const заплачено=g0-G.gold;if(заплачено<=0)continue;
    const row=invAll().find(r=>(r.n||1)>(до.get(ключ(r))||0));if(!row)continue;const штук=(row.n||1)-(до.get(ключ(row))||0);
    const берёт=safeFn(()=>merchantBuys(n,row).ок,false);if(!берёт)continue;const цена=safeFn(()=>sellPriceOf(n,row),0);
    for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();return {торговец:true,торговцев:торг.length,вещь:row.name,купить:Math.round(заплачено/штук),продать:цена};}
   for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();}
  return {торговец:true,торговцев:торг.length,вещь:null};});
 check('8. торговля: купленное здесь же принимают дешевле, чем продали',п8.торговец&&п8.вещь&&п8.продать<п8.купить,п8);

 /* ── 9. Бой: настоящая встреча — шаг на клетку с тварью ── */
 const п9=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  G.hp=G.hpMax;const x0=G.x,y0=G.y;let c=null;
  for(let r=1;r<120&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(cc&&cc.monster&&!cc.structure&&!G.cleared[cc.x+","+cc.y])c=cc;}
  if(!c)return {тварь:null};const m=c.monster;const xp0=Number(G.xp)||0,l0=Number(G.level)||1;let начат=false;
  for(const [d,v] of Object.entries(DIRV)){G.place=null;G.x=c.x-v[0];G.y=c.y-v[1];for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();try{move(d);}catch(_){}await w(50);
   if(G.inCombat){начат=true;break;}}
  await window.__бой(160);await w(300);const bar=document.getElementById("combatBar");
  return {тварь:m.n,уровень:m.lvl,начат,кончен:!G.inCombat,опыт:(Number(G.xp)||0)-xp0+((Number(G.level)||1)-l0)*1000,ждалось:m.xp,
   ушла:!!G.cleared[c.x+","+c.y],полоса:!bar||bar.hidden,жив:G.hp>0};});
 check('9. бой: шаг на тварь начинает бой, тварь побеждена ударами, опыт вырос, клетка очищена, полоса боя убрана',
  п9.начат&&п9.кончен&&п9.опыт>0&&п9.ушла&&п9.полоса,п9);

 /* ── 10. Подземелье ── */
 const п10=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const x0=G.x,y0=G.y;let c=null;
  for(let r=0;r<200&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(cc&&cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c=cc;}
  if(!c)return {нашёл:false};G.x=c.x;G.y=c.y;try{enterPlace(c);}catch(_){}await w(50);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  const вошёл=!!(G.place&&G.place.kind==="dungeon");const d0=G.place?Number(G.place.depth):0;
  const бой=async()=>{if(!G.inCombat)return;G.hp=G.hpMax;await window.__бой(120);if(G.inCombat){try{endCombat();}catch(_){}G.inCombat=false;}};
  const СТЕНА=new Set(["#","%"]);const путь=()=>{const lvl=curLevel();const P=G.place;const T=(x,y)=>tileAt(lvl,x,y);const ключ=(x,y)=>x+","+y;
   const от=new Map([[ключ(P.x,P.y),null]]);const оч=[[P.x,P.y]];let цель=null;
   while(оч.length&&!цель){const [x,y]=оч.shift();for(const [d,v] of Object.entries(DIRV)){if(Math.abs(v[0])+Math.abs(v[1])!==1)continue;const nx=x+v[0],ny=y+v[1];const k=ключ(nx,ny);if(от.has(k))continue;const t=T(nx,ny);if(СТЕНА.has(t))continue;от.set(k,[x,y,d]);if(t===">"){цель=[nx,ny];break;}оч.push([nx,ny]);}}
   if(!цель)return null;const ходы=[];let k=ключ(цель[0],цель[1]);while(от.get(k)){const [px,py,d]=от.get(k);ходы.unshift(d);k=ключ(px,py);}return ходы;};
  let шагов=0,ярус=d0;const ходы=путь()||[];
  for(const d of ходы){for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();await бой();try{move(d);}catch(_){}шагов++;await w(5);}
  /* стоим на ступенях: ещё шаг в ту же сторону — вниз. На шахте может стоять хранитель: тогда бой, а после него —
     сойти со ступеней, встать снова и шагнуть вниз; марш — шагами до конца. */
  const посл=ходы[ходы.length-1];const НАЗАД={N:"S",S:"N",W:"E",E:"W"};let хранитель=null;
  for(let k=0;k<80&&G.place&&Number(G.place.depth)===d0;k++){for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
   if(G.inCombat){хранитель=хранитель||(G.combat&&G.combat.m&&G.combat.m.n);G.hpMax=Math.max(G.hpMax,2000);G.hp=G.hpMax;await window.__бой(200);continue;}
   const P=G.place;if(G.flight){try{move(G.flight.md);}catch(_){}await w(5);continue;}
   if(P.arm&&P.arm.x===P.x&&P.arm.y===P.y){try{move(P.arm.dir);}catch(_){}await w(5);continue;}
   try{move(НАЗАД[посл]);}catch(_){}await w(5);try{move(посл);}catch(_){}await w(5);}
  ярус=G.place?Number(G.place.depth):-1;
  try{leavePlace();}catch(_){}await w(50);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  return {нашёл:true,вошёл,d0,путь:ходы.length,шагов,хранитель,ярус,вышел:!G.place};});
 check('10. подземелье: вход, шаги до лестницы, хранитель шахты, марш вниз — следующий ярус, выход',п10.нашёл&&п10.вошёл&&п10.путь>0&&п10.ярус===п10.d0+1&&п10.вышел,п10);

 /* ── 11. Сохранение и повторная загрузка ── */
 const снимок=await p.evaluate(()=>{for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();saveGame();const сум=Object.values(G.inv).reduce((s,v)=>s+(+v||0),0);
  return {x:G.x,y:G.y,gold:G.gold,xp:G.xp,level:G.level,сум,items:(G.items||[]).length,quests:(G.quests||[]).map(q=>q.id).join("|"),q:window.__q,рес:window.__рес};});
 const p2=await ctx.newPage();p2.on('pageerror',e=>errors.push(String(e)));p2.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.close();await p2.goto(process.argv[2]);await p2.waitForTimeout(1500);
 const п11=await p2.evaluate(async(с)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));window.__сказ=[];Speech.say=function(t){window.__сказ.push(String(t));return null;};window.maybeEvent=()=>{};
  document.querySelector('#screen-title button[data-cmd="load"]').click();await w(1500);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  const g=document.getElementById("screen-game");const сум=Object.values(G.inv).reduce((s,v)=>s+(+v||0),0);
  const теперь={x:G.x,y:G.y,gold:G.gold,xp:G.xp,level:G.level,сум,items:(G.items||[]).length,quests:(G.quests||[]).map(q=>q.id).join("|")};
  const разн=Object.keys(теперь).filter(k=>теперь[k]!==с[k]);return {мир:!!g&&!g.hidden,разн,теперь};},снимок);
 check('11. повторная загрузка в новом окне: место, золото, опыт, сума и задания те же',п11.мир&&!п11.разн.length,{п11,снимок});

 /* ── 12. Продолжение ── */
 const п12=await p2.evaluate(async(с)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();
  const x0=G.x,y0=G.y;let шаг=false;for(const d of ["N","E","S","W"]){try{move(d);}catch(_){}await w(10);for(let __k=0;__k<20&&activeLayer();__k++)closeTopUI();if(G.inCombat){try{endCombat();}catch(_){}G.inCombat=false;}if(G.x!==x0||G.y!==y0){шаг=true;break;}}
  const q=(G.quests||[]).find(x=>x.id===с.q);if(!q)return {шаг,задание:false};G.inv[q.res]=(Number(G.inv[q.res])||0)+(Number(q.need)||1);
  const g0=G.gold;window.__сказ.length=0;try{CMD.qdone(q.id);}catch(_){}await w(50);const плата=G.gold-g0;
  const g1=G.gold;try{CMD.qdone(q.id);}catch(_){}await w(50);
  return {шаг,задание:true,сдано:!!q.done,плата,второйРаз:G.gold-g1,слово:(window.__сказ.find(t=>/Квест выполнен/.test(t))||"").slice(0,120)};},снимок);
 check('12. продолжение: шаг идёт, взятое задание сдаётся, награда приходит один раз',п12.шаг&&п12.задание&&п12.сдано&&п12.плата>0&&п12.второйРаз===0,п12);

 check('ошибок страницы нет',!errors.length,errors.slice(0,5));
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fails}/${results.length} PASS`);
 await browser.close();process.exit(fails?1:0);
})();
