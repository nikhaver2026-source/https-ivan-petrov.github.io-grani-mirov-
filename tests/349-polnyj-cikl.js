/* ══════════════════════════════════════════════════════════════════
   349 — ПОЛНЫЙ ЦИКЛ ОБЪЕКТОВ ИГРЫ (чек-лист игрока, 3–4 ноября 2026)
   «Проверять необходимо не только наличие объектов, но и полный цикл их
   существования»: существует ли, можно ли обнаружить, озвучивается ли,
   можно ли взять, исчезает ли, восстанавливается ли, сохраняется ли.
   1. Звуковой банк: у каждой роли есть записи, каждая запись лежит на диске
      (проверяется запросом к серверу).
   2. Твари основных реестров: имя, здоровье, урон, опыт, свой голос; имена
      не повторяются.
   3. Ресурсы, полный цикл: виден в осмотре, звучит маяком, собирается,
      иссякает, иссякшая жила переживает загрузку, через сутки родит снова.
   4. Места и подземелья: у каждого уровня есть выход, лестница вниз
      достижима, до каждой важной вещи (сундук, житель, лавка, алтарь,
      книги, горн, логово) можно дойти.
   5. Вещи сумы: каждое доступное действие с каждой вещью отвечает без сбоя.
   6. Все команды игры: ни одна не падает, в открывшихся окнах у каждой
      кнопки есть имя для голоса.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,1500):''));
(async()=>{
 const browser=await chromium.launch();const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.goto(process.argv[2]);await p.waitForTimeout(1500);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};window.open=()=>null;});

 /* ── 1. Звуковой банк ── */
 const п1=await p.evaluate(async()=>{const файлы=new Set();const пустые=[];for(const k in SOUND_BANK){const f=SOUND_BANK[k].f||[];if(!f.length)пустые.push(k);f.forEach(x=>файлы.add(x));}
  const base=location.href.replace(/[^/]*$/,"");const нет=[];const все=[...файлы];
  for(let i=0;i<все.length;i+=40){await Promise.all(все.slice(i,i+40).map(async f=>{try{const r=await fetch(base+"sounds/"+f,{method:"HEAD"});if(!r.ok)нет.push(f);}catch(_){нет.push(f);}}));}
  return {ролей:Object.keys(SOUND_BANK).length,файлов:все.length,пустые:пустые.slice(0,5),нет:нет.slice(0,10)};});
 check('1. звуковой банк: у каждой роли есть записи, каждая запись на месте',п1.ролей>=1000&&п1.файлов>=2000&&!п1.пустые.length&&!п1.нет.length,п1);

 /* ── 2. Твари ── */
 const п2=await p.evaluate(()=>{const твари=[];const add=(сп,о)=>(сп||[]).forEach(m=>твари.push({о,m}));
  add(MONSTERS,"MONSTERS");add(typeof DARK_MONSTERS!=="undefined"?DARK_MONSTERS:[],"DARK");add(typeof SEA_MONSTERS!=="undefined"?SEA_MONSTERS:[],"SEA");add(typeof UNDEAD_MONSTERS!=="undefined"?UNDEAD_MONSTERS:[],"UNDEAD");
  const плохо=[];const имена=new Map();
  for(const {о,m} of твари){const в=[];if(!m.n)в.push("нет имени");for(const k of ["hp","dmg","xp"])if(m[k]!=null&&!(Number(m[k])>0))в.push(k);
   if(!safeFn(()=>foeVoice(m),null)&&!safeFn(()=>bankFoeRole(m),null)&&!(m.snd&&SOUND_BANK[m.snd]))в.push("нет голоса");
   const k=о+":"+m.n;имена.set(k,(имена.get(k)||0)+1);if(в.length)плохо.push(о+" "+(m.id||m.n)+": "+в.join(","));}
  return {тварей:твари.length,плохо:плохо.slice(0,8),дубли:[...имена].filter(([,n])=>n>1).map(([k])=>k).slice(0,8)};});
 check('2. твари основных реестров: имя, здоровье, урон, опыт и свой голос у каждой; имена не повторяются',п2.тварей>=100&&!п2.плохо.length&&!п2.дубли.length,п2);

 /* ── 3. Ресурсы ── */
 const п3=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));Speech.say=()=>null;G.level=30;
  ["Кирка","Топор лесоруба","Корзина","Свежевальный нож","Лопата"].forEach(n=>{if(!(G.items||[]).includes(n))G.items.push(n);});
  const сумма=()=>Object.values(G.inv).reduce((s,v)=>s+(+v||0),0);const x0=G.x,y0=G.y;const виды=new Map();
  for(let r=0;r<400&&виды.size<10;r+=(r<120?1:3))for(let dx=-r;dx<=r;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);
   if(c&&c.res&&!c.structure&&!c.monster&&!виды.has(c.res.name)&&!(G.depleted&&G.depleted[c.x+","+c.y]))виды.set(c.res.name,c);}
  const плохо=[];const итог=[];
  for(const [имя,c] of виды){G.place=null;G.inCombat=false;G.x=c.x+1;G.y=c.y;
   const осмотр=(Look.scan(4)||[]).some(z=>z.x===c.x&&z.y===c.y&&z.род==="ресурс");
   const звук=!!(BEACON_ROLE[c.res.beacon]||BEACON_SAMPLE[c.res.beacon]||BEACONS[c.res.beacon]);
   G.x=c.x;G.y=c.y;const s0=сумма();for(let k=0;k<10;k++){try{CMD.gather();}catch(_){}await w(3);while(activeLayer())closeTopUI();}
   const собрано=сумма()-s0;const s1=сумма();try{CMD.gather();}catch(_){}while(activeLayer())closeTopUI();const пусто=сумма()===s1;
   saveGame(true);G.depleted={};loadGame();const помнит=!!(G.depleted&&G.depleted[c.x+","+c.y]);
   Clock.advance(48);G.x=c.x;G.y=c.y;const s2=сумма();try{CMD.gather();}catch(_){}while(activeLayer())closeTopUI();const родит=сумма()>s2;
   итог.push(имя);if(!(осмотр&&звук&&собрано>0&&пусто&&помнит&&родит))плохо.push({имя,осмотр,звук,собрано,пусто,помнит,родит});}
  G.x=x0;G.y=y0;return {видов:итог.length,итог,плохо};});
 check('3. ресурсы, полный цикл: в осмотре, маяком, собираются, иссякают, помнятся после загрузки, через сутки родят снова',п3.видов>=5&&!п3.плохо.length,п3);

 /* ── 4. Проходимость мест и подземелий ── */
 const п4=await p.evaluate(()=>{const ВАЖНО=new Set("CNPBSAFWKVHJDUIZLRMY>".split(""));const СТЕНА=new Set(["#","%"]);
  const мест=[];const x0=G.x,y0=G.y;const по=new Map();
  for(let r=0;r<500&&мест.length<60;r+=2)for(let dx=-r;dx<=r&&мест.length<60;dx+=2)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);
   if(!c||!c.structure||!PLACE_KIND[c.structure.type])continue;const t=c.structure.type;if((по.get(t)||0)>=3)continue;по.set(t,(по.get(t)||0)+1);мест.push(c);}
  let уровней=0;const плохо=[];
  for(const c of мест){const t=c.structure.type;const подз=PLACE_KIND[t]==="dungeon";const max=safeFn(()=>{G.place={bx:c.x,by:c.y,depth:1,stype:t};return maxDepthHere();},99);
   for(const d of (подз?[1,2,4,7]:[0])){if(подз&&d>max)continue;let lvl=null;try{lvl=genLevel(c.x,c.y,d,t);}catch(e){плохо.push(t+" "+d+": "+String(e).slice(0,50));continue;}
    уровней++;G.place={bx:c.x,by:c.y,depth:d,stype:t,x:1,y:1};const T=(x,y)=>safeFn(()=>tileAt(lvl,x,y),null);
    let st=null;for(let y=0;y<lvl.h&&!st;y++)for(let x=0;x<lvl.w&&!st;x++){const tt=T(x,y);if(tt==="<"||(d===0&&tt==="G"))st=[x,y];}
    if(!st){плохо.push(`${t} ${c.x},${c.y}/${d}: нет выхода`);continue;}
    const вид=new Set([st.join(",")]);const оч=[st];while(оч.length){const [x,y]=оч.shift();for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+ax)+","+(y+ay);if(вид.has(k))continue;const tt=T(x+ax,y+ay);if(tt==null||СТЕНА.has(tt))continue;вид.add(k);оч.push([x+ax,y+ay]);}}
    let вниз=0,внизДост=0;const нет=[];
    for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++){const tt=T(x,y);if(!ВАЖНО.has(tt))continue;const ок=вид.has(x+","+y)||[[1,0],[-1,0],[0,1],[0,-1]].some(([ax,ay])=>вид.has((x+ax)+","+(y+ay)));
     if(tt===">"){вниз++;if(ок)внизДост++;}if(!ок)нет.push(tt+"@"+x+","+y);}
    if(подз&&d<max&&!внизДост)плохо.push(`${t} ${c.x},${c.y}/${d}: лестница вниз ${вниз?"недостижима":"отсутствует"}`);
    if(нет.length)плохо.push(`${t} ${c.x},${c.y}/${d}: недостижимо ${нет.slice(0,5).join(" ")}`);}}
  G.place=null;return {уровней,видов:по.size,плохо:плохо.slice(0,10)};});
 check('4. места и подземелья: у каждого уровня выход, лестница вниз достижима, до каждой важной вещи можно дойти',п4.уровней>=60&&п4.видов>=12&&!п4.плохо.length,п4);

 /* ── 5. Действия с вещами ── */
 const п5=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));Speech.say=()=>null;G.level=40;G.str=G.agi=G.mind=G.cha=60;G.gold=9999;
  for(let i=0;i<30;i++){const it=safeFn(()=>genLoot(G.x+i,G.y+i*3,i*97+11,30),null);if(it)G.gear.push(it);}
  ["Зелье здоровья","Факел","Верёвка","Хлеб","Лопата"].forEach(n=>G.items.push(n));["трава","дерево","руда","камень","кристалл","Хлеб"].forEach(k=>G.inv[k]=(+G.inv[k]||0)+5);
  const снимок=JSON.stringify(G);const сброс=()=>{const o=JSON.parse(снимок);for(const k of Object.keys(G))if(!(k in o))delete G[k];Object.assign(G,o);};
  const n0=invAll().length;let действий=0;const сбои=[];
  for(let ri=0;ri<n0;ri++)for(const a of ITEM_ACTIONS){сброс();while(activeLayer())closeTopUI();const row=invAll()[ri];if(!row)continue;if(a.cats&&!a.cats.includes(row.cat))continue;
   INV.sel={kind:row.kind,key:row.key};const ctx=safeFn(()=>invContext(),{станки:new Set()});let мож;try{мож=a.можно?a.можно(row,ctx):true;}catch(e){сбои.push(a.id+"/можно: "+String(e).slice(0,60));continue;}
   if(мож!==true)continue;действий++;try{const v=a.делать(row,ctx,()=>true);if(v&&v.then)await Promise.race([v,w(200)]);}catch(e){сбои.push(a.id+" "+row.name+": "+String(e).slice(0,70));}}
  сброс();while(activeLayer())closeTopUI();return {строк:n0,действий,сбои:сбои.slice(0,8)};});
 check('5. вещи сумы: каждое доступное действие с каждой вещью выполняется без сбоя',п5.строк>=30&&п5.действий>=150&&!п5.сбои.length,п5);

 /* ── 6. Все команды ── */
 const п6=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));Speech.say=()=>null;G.level=20;G.gold=5000;
  const опасно=/^(newgame|reset|wipe|delsave|deletesave|exitgame|quit|import|export|warm|reload|restart|savefile|loadfile|slotdel|slotload|slotsave|download|share|feedback|rate|exit|logout|clear|voicelist|tutor)$/i;
  const имя=el=>(el.dataset.speak||el.getAttribute("aria-label")||(el.labels&&el.labels[0]&&el.labels[0].textContent)||el.textContent||"").replace(/\s+/g," ").trim();
  const ключи=Object.keys(CMD).filter(k=>typeof CMD[k]==="function"&&!опасно.test(k));const сбои=[];const немые=[];let окон=0;const x0=G.x,y0=G.y;
  for(const k of ключи){G.place=null;G.x=x0;G.y=y0;G.inCombat=false;G.combat=null;G.hp=G.hpMax;while(activeLayer())closeTopUI();
   try{const v=CMD[k]();if(v&&v.then)await Promise.race([v,w(300)]);}catch(e){сбои.push(k+": "+String(e).slice(0,70));}
   await w(10);const lay=activeLayer();if(lay){окон++;[...lay.querySelectorAll("button,[data-cmd],input,select")].forEach(el=>{if(!el.hidden&&!имя(el))немые.push(k+":"+(el.dataset.cmd||el.id||el.tagName));});}
   let i=0;while(activeLayer()&&i++<6)closeTopUI();try{if(G.inCombat)endCombat();}catch(_){}}
  return {команд:ключи.length,окон,сбои:сбои.slice(0,8),немые:немые.slice(0,8)};});
 check('6. все команды игры: ни одна не падает, в каждом открывшемся окне у каждой кнопки есть имя для голоса',п6.команд>=400&&п6.окон>=80&&!п6.сбои.length&&!п6.немые.length,п6);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fail} passed, ${fail} failed`);
 await browser.close();process.exit(fail?1:0);})();
