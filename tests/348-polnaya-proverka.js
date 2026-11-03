/* ══════════════════════════════════════════════════════════════════
   348 — ПОЛНАЯ ПРОВЕРКА ИГРЫ ПО РАЗДЕЛАМ (3 ноября 2026, просьба игрока)
   «Проверь всю игру по пунктам… голоса при быстром пролистывании меню не
   замолкали — прерываться могут, но не замолкать… рост уровня как игрока,
   так и монстров: при спуске в подземелье монстры сильнее и опыта больше…
   чтобы нельзя было искусственно накручивать золото… никаких читерств».
   1. Настройки: у каждого элемента есть имя для голоса; каждый меняет свою
      настройку.
   2. Речь, быстрое листание пяти меню на пяти скоростях (синтезатор с
      настоящими задержками): последний пункт договаривается до конца.
   3. Фоновая весть мира не срезает пункт меню.
   4. Синтезатор, теряющий фразы при частой подаче (бывает на телефонах):
      пункт, на котором стоит игрок, всё равно звучит.
   5. Записанный голос: при быстром листании последний пункт звучит до конца.
   6. Твари подземелья: чем глубже, тем выше уровень, здоровье, урон, опыт и
      золото; с уровнем героя — так же.
   7. Ремесло: каждый рецепт срабатывает — ингредиенты уходят, вещь приходит.
   8. Торговля без накрутки: ни у одного торговца нельзя купить и тут же
      продать (ему или соседу по месту) дороже.
   9. Жила ресурса иссякает: повторный сбор пустой клетки ничего не даёт.
   10. Живой бой: частые нажатия удара не бьют чаще, чем позволяет оружие.
   11. Постройки и жители: каждое окно открывается, у каждой кнопки есть имя.
   12. Карточки вещей; сохранение и загрузка без потерь.
   13. Одна награда — один раз: знание мира, работа в деревне.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,1500):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
 const ctx=await browser.newContext();
 /* мост Android до загрузки игры: движок теряет фразу, поданную меньше чем через 120 мс после прежней (или после остановки) */
 await ctx.addInitScript(()=>{const T0=Date.now();window.__tts=[];let cur=null,stopAt=-1e9,last=-1e9;
  window.__ttsOn=false;window.GraniTTS={hasStart(){return true;},isSpeaking(){return !!cur;},setVoice(){},getVoices(){return "[]";},
   speak(text,rate,vol,id){const t=Date.now()-T0;const u={text:String(text),id,t};window.__tts.push(u);
    if(cur){clearTimeout(cur.a);clearTimeout(cur.b);cur.cut=t;cur=null;}
    const пред=last;last=t;if(window.__drop&&(t-stopAt<120||t-пред<120)){u.dropped=true;return;}
    cur=u;u.a=setTimeout(()=>{u.start=Date.now()-T0;window.GraniTTSStart&&window.GraniTTSStart(id);},70);
    u.b=setTimeout(()=>{u.end=Date.now()-T0;if(cur===u)cur=null;window.GraniTTSDone&&window.GraniTTSDone(id);},70+35*String(text).length);},
   stop(){stopAt=Date.now()-T0;if(cur){clearTimeout(cur.a);clearTimeout(cur.b);cur.cut=stopAt;cur=null;}}};});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};try{Folk.смолкнуть(true);}catch(_){}});

 /* ── 1. Настройки ── */
 const п1=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));CMD.settings();await w(300);
  const имя=x=>((x.labels&&x.labels[0]&&x.labels[0].textContent)||x.getAttribute("aria-label")||x.dataset.speak||x.title||"").replace(/\s+/g," ").trim();
  const снимок=()=>{const o=JSON.parse(JSON.stringify(settings));o.__жесты=JSON.stringify(safeFn(()=>gestBinds(),{}))+JSON.stringify(safeFn(()=>gestCombatBinds(),{}));return o;};
  const разн=(a,b)=>Object.keys(Object.assign({},a,b)).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));
  const out={всего:0,безИмени:[],немые:[]};
  for(const g of SET_GROUPS){const box=setGroupBox(g.id);if(!box)continue;
   for(const x of box.querySelectorAll('input,select')){out.всего++;if(!имя(x))out.безИмени.push(g.id+":"+x.id);
    /* выбор синтезатора — пара переключателей: уже выбранный не снимается щелчком, это не поломка */
    if(x.id==="setEngDevice"||x.id==="setEngBuiltin")continue;
    const до=снимок();
    if(x.type==="checkbox"){x.checked=!x.checked;x.dispatchEvent(new Event("change",{bubbles:true}));x.dispatchEvent(new Event("input",{bubbles:true}));}
    else if(x.type==="range"){x.value=(+x.value===+x.max)?x.min:x.max;x.dispatchEvent(new Event("input",{bubbles:true}));x.dispatchEvent(new Event("change",{bubbles:true}));}
    else if(x.tagName==="SELECT"){if(x.options.length<2)continue;x.selectedIndex=(x.selectedIndex+1)%x.options.length;x.dispatchEvent(new Event("change",{bubbles:true}));}
    await w(5);const d=разн(до,снимок());if(!d.length)out.немые.push(g.id+":"+(x.id||имя(x).slice(0,30)));
    for(const k of d)if(k!=="__жесты")settings[k]=до[k];}}
  while(activeLayer())closeTopUI();return out;});
 check('1. настройки: у каждого элемента есть имя для голоса, каждый меняет свою настройку',п1.всего>=100&&!п1.безИмени.length&&!п1.немые.length,п1);

 /* общий движок-синтезатор для 2–3 */
 await p.evaluate(()=>{const T0=performance.now();window.__T=()=>Math.round(performance.now()-T0);window.__лог=[];let cur=null;
  window.__ENG={name:"fake",speak(text,o){if(cur){cur.cut=__T();clearTimeout(cur.a);clearTimeout(cur.b);}const u={text:String(text),t:__T(),o};cur=u;window.__лог.push(u);
    u.a=setTimeout(()=>{u.start=__T();try{o.onstart&&o.onstart();}catch(_){}},60);
    u.b=setTimeout(()=>{u.end=__T();if(cur===u)cur=null;try{o.onend&&o.onend();}catch(_){}},60+Math.min(4000,35*String(text).length));return true;},
   cancel(){if(cur){cur.cut=__T();clearTimeout(cur.a);clearTimeout(cur.b);cur=null;}},speaking(){return !!cur;}};
  window.__ad0=Speech._adapter;Speech._adapter=function(){return this.adapter=window.__ENG;};settings.ttsEngine="device";Speech.adapter=null;Speech._kind=null;
  window.__метка=el=>(el&&(el.dataset.speak||el.getAttribute("aria-label")||(el.labels&&el.labels[0]&&el.labels[0].textContent)||el.textContent)||"").replace(/\s+/g," ").trim();
  window.__листать=async(n,шаг)=>{for(let i=0;i<n;i++){document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",bubbles:true}));await new Promise(z=>setTimeout(z,шаг));}};});

 /* ── 2. Быстрое листание ── */
 const п2=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const меню={настройки:()=>CMD.settings(),управление:()=>{CMD.settings();CMD.setgroup("gest");},действия:()=>CMD.menu(),инвентарь:()=>CMD.inv(),руководство:()=>CMD.guide()};
  const плохо=[];let всего=0;
  for(const [имя,откр] of Object.entries(меню))for(const шаг of [25,45,90,180,350]){
   while(activeLayer())closeTopUI();await w(100);Speech.stop();try{откр();}catch(e){плохо.push(имя+": "+e);continue;}await w(900);
   const lay=navLayer();if(!lay){плохо.push(имя+": нет окна");continue;}const n=Math.min(cursorItems(lay).length-1,12);if(n<3){плохо.push(имя+": мало пунктов");continue;}
   window.__лог.length=0;await __листать(n,шаг);const фокус=__метка(document.activeElement).slice(0,14);await w(4300);
   const пп=window.__лог.filter(u=>фокус&&u.text.includes(фокус));const з=пп[пп.length-1];всего++;
   if(!з||!з.end||з.cut)плохо.push(`${имя}/${шаг}: «${фокус}» ${з?(з.cut?"срезан":"не досказан"):"не подан"}`);}
  while(activeLayer())closeTopUI();return {всего,плохо};});
 check('2. быстрое листание пяти меню на пяти скоростях: последний пункт всегда договаривается до конца',п2.всего>=20&&!п2.плохо.length,п2);

 /* ── 3. Фоновая весть не срезает пункт ── */
 const п3=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const вести=[()=>Speech.say("Слышен обоз: Паломничий караван, с запада, 2 шага.",{interrupt:false}),()=>narrate("Мир меняется: волна Магии.",{interrupt:false}),()=>Speech.spatial("Справа стена.")];
  const плохо=[];
  for(const весть of вести){while(activeLayer())closeTopUI();await w(100);Speech.stop();CMD.settings();await w(900);
   window.__лог.length=0;await __листать(6,40);const фокус=__метка(document.activeElement).slice(0,10);await w(120);весть();await w(4500);
   const пп=window.__лог.filter(u=>u.text.includes(фокус));const з=пп[пп.length-1];if(!з||!з.end||з.cut)плохо.push(фокус);}
  while(activeLayer())closeTopUI();Speech._adapter=window.__ad0;Speech.adapter=null;Speech._kind=null;return {плохо};});
 check('3. фоновая весть мира (обоз, событие, сторона) ждёт: пункт меню не срезается',!п3.плохо.length,п3);

 /* ── 4. Мост Android, теряющий фразы ── */
 const п4=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  settings.ttsEngine="device";Speech.adapter=null;Speech._kind=null;const имя=safeFn(()=>Speech._adapter().name,"?");
  /* мост сообщал о начале фраз — игра знает, что молчание о начале значит потерю */
  Speech.say("Проба голоса.",{interrupt:true});await w(1200);
  const плохо=[];const итог=[];
  for(const шаг of [25,40,90]){while(activeLayer())closeTopUI();await w(150);Speech.stop();CMD.settings();await w(1200);
   window.__drop=true;window.__tts.length=0;await __листать(7,шаг);const фокус=__метка(document.activeElement).slice(0,10);await w(5500);window.__drop=false;
   const пп=window.__tts.filter(u=>u.text.includes(фокус));const з=пп.find(u=>u.end&&!u.cut);итог.push({шаг,фокус,подач:пп.length,досказан:!!з});if(!з)плохо.push(шаг);}
  while(activeLayer())closeTopUI();return {адаптер:имя,итог,плохо};});
 check('4. синтезатор, теряющий фразы при частой подаче: пункт, на котором стоит игрок, всё равно звучит',п4.адаптер==="native"&&!п4.плохо.length,п4);

 /* ── 5. Записанный голос ── */
 const п5=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  window.GraniTTS=undefined;settings.ttsEngine="gemini";settings.gvVoice="m";Speech.adapter=null;Speech._kind=null;Speech.gvLoad();
  for(let i=0;i<80&&!Speech.GVOICES.m.map;i++)await w(100);
  const T=window.__T;const лог=[];const pl0=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){const src=String(this.src||"");if(/gvoice/.test(src)){const u={t:T(),src:src.slice(-14)};лог.push(u);const el=this;
   el.addEventListener("ended",()=>{u.end=T();},{once:true});el.addEventListener("pause",()=>{if(!u.end)u.stop=T();},{once:true});}return pl0.apply(this,arguments);};
  const плохо=[];const итог=[];
  for(const шаг of [400,40,25]){while(activeLayer())closeTopUI();await w(150);Speech.stop();CMD.settings();await w(1200);лог.length=0;
   await __листать(7,шаг);await w(3000);const z=лог[лог.length-1];итог.push({шаг,записей:лог.length,конец:!!(z&&z.end&&(!z.stop||z.stop>=z.end-5))});
   if(!z||!z.end)плохо.push(шаг);}
  HTMLMediaElement.prototype.play=pl0;while(activeLayer())closeTopUI();return {итог,плохо};});
 check('5. записанный голос: при быстром листании прежние записи обрываются, последний пункт звучит до конца',п5.итог.every(x=>x.записей>=1)&&!п5.плохо.length,п5);

 /* ── 6. Рост тварей ── */
 const п6=await p.evaluate(async()=>{Speech.say=()=>null;settings.combatPace="turn";const bx=G.x,by=G.y;
  const бой=(d,L,k)=>{G.level=L;G.place={bx,by,depth:d,stype:"dungeon",x:5,y:5};G.inCombat=false;G.combat=null;try{startInsideCombat(3+k,4+k*2);}catch(e){return null;}
   const m=G.combat&&G.combat.m;const r=m?{lvl:+m.lvl,hp:+G.combat.hp||+m.hp,dmg:+m.dmg,xp:+m.xp,gold:+m.gold}:null;try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;};
  const ср=(arr,f)=>arr.reduce((s,x)=>s+x[f],0)/arr.length;
  const гл={};for(const d of [1,3,10,20,40,80]){const a=[];for(let k=0;k<8;k++){const r=бой(d,10,k);if(r)a.push(r);}гл[d]=a.length?{lvl:ср(a,"lvl"),hp:ср(a,"hp"),dmg:ср(a,"dmg"),xp:ср(a,"xp"),gold:ср(a,"gold")}:null;}
  const ур={};for(const L of [1,10,30,60]){const a=[];for(let k=0;k<6;k++){const r=бой(3,L,k);if(r)a.push(r);}ур[L]=a.length?{lvl:ср(a,"lvl"),xp:ср(a,"xp"),dmg:ср(a,"dmg")}:null;}
  G.place=null;G.level=1;
  const растёт=(o,ks)=>{const v=Object.values(o);return v.every(x=>x)&&ks.every(k=>v.every((x,i)=>i===0||x[k]>v[i-1][k]));};
  const кривая=[1,2,5,10,30,60].map(l=>xpNeed(l));
  return {гл,ур,глубже:растёт(гл,["lvl","hp","dmg","xp","gold"]),сУровнем:растёт(ур,["lvl","xp","dmg"]),кривая,кривая_растёт:кривая.every((v,i)=>!i||v>кривая[i-1])};});
 check('6. твари подземелья: глубже — выше уровень, здоровье, урон, опыт и золото; с уровнем героя — так же; кривая опыта героя растёт',
  п6.глубже&&п6.сУровнем&&п6.кривая_растёт,п6);

 /* ── 7. Ремесло ── */
 const п7=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.level=60;G.gold=999999;const сбои=[];
  const снимок=()=>JSON.stringify({inv:G.inv,items:G.items,gear:(G.gear||[]).length});
  for(let i=0;i<CRAFT_RECIPES.length;i++){const rc=CRAFT_RECIPES[i];for(const k in rc.из)G.inv[k]=(Number(G.inv[k])||0)+rc.из[k]*2;
   const до=снимок();const было=Object.fromEntries(Object.keys(rc.из).map(k=>[k,G.inv[k]]));let e=null;try{CMD.craftdo(i);}catch(x){e=String(x).slice(0,80);}
   await w(2);while(activeLayer())closeTopUI();const ушло=Object.keys(rc.из).every(k=>(Number(G.inv[k])||0)<было[k]);
   if(e||!ушло||до===снимок())сбои.push(rc.n+(e?": "+e:""));}
  return {рецептов:CRAFT_RECIPES.length,сбои};});
 check('7. ремесло: каждый рецепт срабатывает — ингредиенты уходят, вещь приходит',п7.рецептов>=40&&!п7.сбои.length,п7);

 /* ── 8. Торговля без накрутки ── */
 const п8=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.level=40;
  const торг=[];const x0=G.x,y0=G.y;
  for(let r=0;r<70&&торг.length<24;r++)for(let dx=-r;dx<=r&&торг.length<24;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);
   if(!c||!c.structure)continue;(npcsFor(c)||[]).forEach((n,i)=>{if(n&&n.trade&&торг.length<24)торг.push({key:`${c.x},${c.y},${i}`,тип:c.structure.type,c});});}
  /* военный стан — обязательно: там была лазейка */
  for(let r=70;r<400&&!торг.some(t=>t.тип==="warcamp");r+=3)for(let dx=-r;dx<=r&&!торг.some(t=>t.тип==="warcamp");dx+=3)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);
   if(c&&c.structure&&c.structure.type==="warcamp")(npcsFor(c)||[]).forEach((n,i)=>{if(n&&n.trade)торг.push({key:`${c.x},${c.y},${i}`,тип:"warcamp",c});});}
  const ключ=row=>row.kind+":"+row.key+":"+row.name;const убыток=[];let проверено=0;
  for(const t of торг){const n=getNPCByKey(t.key);if(!n)continue;G.x=t.c.x;G.y=t.c.y;G.gold=1e7;openTrade(t.key,"buy");await w(2);
   const соседи=(npcsFor(t.c)||[]).filter(x=>x&&x.trade);const rows=safeFn(()=>shopStockRows(n),[]);
   for(let i=0;i<Math.min(rows.length,24);i++){const до=new Map(invAll().map(r=>[ключ(r),r.n||1]));const g0=G.gold;
    try{CMD.shopitem(i);await w(2);if(G.gold===g0){CMD.shopitem(i);await w(2);}}catch(_){continue;}
    while(activeLayer()&&activeLayer().id!=="modal-shop")closeTopUI();const заплачено=g0-G.gold;if(заплачено<=0)continue;
    const новые=invAll().filter(r=>(r.n||1)>(до.get(ключ(r))||0));if(!новые.length)continue;const row=новые[0];const штук=(row.n||1)-(до.get(ключ(row))||0);const за1=заплачено/Math.max(1,штук);
    проверено++;for(const s of соседи){const берёт=safeFn(()=>merchantBuys(s,row).ок,false);const sell=safeFn(()=>sellPriceOf(s,row),0);
     if(берёт&&sell>=за1&&за1>1)убыток.push(`${t.тип}: ${row.name} ${Math.round(за1)}→${sell}`);}}
   while(activeLayer())closeTopUI();}
  return {торговцев:торг.length,стан:торг.some(t=>t.тип==="warcamp"),проверено,убыток:[...new Set(убыток)]};});
 check('8. торговля без накрутки: купить и тут же продать дороже нельзя ни у одного торговца и ни у его соседа (военный стан — тоже)',
  п8.торговцев>=10&&п8.стан&&п8.проверено>=100&&!п8.убыток.length,п8);

 /* ── 9. Жила иссякает ── */
 const п9=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));G.place=null;const x0=G.x,y0=G.y;let рес=null;
  for(let r=0;r<40&&!рес;r++)for(let dx=-r;dx<=r&&!рес;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(c&&c.res&&!c.structure&&!c.monster&&!(G.depleted&&G.depleted[c.x+","+c.y]))рес=c;}
  if(!рес)return {нет:true};G.x=рес.x;G.y=рес.y;const сумма=()=>Object.values(G.inv).reduce((s,v)=>s+(+v||0),0);const по=[];
  for(let k=0;k<10;k++){const s=сумма();try{CMD.gather();}catch(_){}await w(10);while(activeLayer())closeTopUI();по.push(сумма()-s);}
  return {рес:рес.res.name,по,хвост:по.slice(-5).every(x=>x===0),было:по.some(x=>x>0)};});
 check('9. жила ресурса иссякает: повторный сбор пустой клетки ничего не даёт',п9.нет||(п9.было&&п9.хвост),п9);

 /* ── 10. Перезарядка удара ── */
 const п10=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));settings.combatPace="live";G.weaponDrawn=true;G.hp=G.hpMax=5000;G.inCombat=false;G.combat=null;
  startCombat({x:G.x,y:G.y,monster:{id:"ogre",n:"Огр-проба",lvl:5,hp:100000,dmg:0,xp:1,gold:0}});await w(300);
  const a=G.combat.arena;if(a){a.fx=a.px+1;a.fy=a.py;a.readyAt=Date.now()+600000;}
  const сказ=[];const s0=Speech.say;Speech.say=(t)=>{сказ.push(String(t));return null;};const t0=Date.now();
  for(let i=0;i<40;i++){try{weaponSwing("E","swipe");}catch(_){}await w(25);}
  const мс=Date.now()-t0;await w(400);Speech.say=s0;const ударов=сказ.filter(t=>/^Вы ударили/.test(t)).length;const ms=safeFn(()=>weaponSpeedMs(),600);try{endCombat();}catch(_){}G.inCombat=false;G.combat=null;
  return {ударов,мс,перезарядка:ms,предел:Math.ceil(мс/ms)+1};});
 check('10. живой бой: сорок нажатий удара подряд бьют не чаще, чем позволяет перезарядка оружия',п10.ударов>=1&&п10.ударов<=п10.предел,п10);

 /* ── 11. Постройки и жители ── */
 const п11=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));Speech.say=()=>null;G.level=30;G.gold=99999;
  const имя=el=>(el.dataset.speak||el.getAttribute("aria-label")||el.textContent||"").replace(/\s+/g," ").trim();
  const out={видов:0,профессий:new Set(),сбои:[],немые:[]};const x0=G.x,y0=G.y;const виды=new Map();
  for(let r=0;r<260&&виды.size<40;r+=2)for(let dx=-r;dx<=r;dx+=2)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(c&&c.structure&&!виды.has(c.structure.type))виды.set(c.structure.type,c);}
  for(const [т,c] of виды){G.place=null;G.x=c.x;G.y=c.y;G.inCombat=false;while(activeLayer())closeTopUI();out.видов++;
   try{openBuilding(c);}catch(x){out.сбои.push(т+": "+String(x).slice(0,80));}await w(20);const lay=activeLayer();if(!lay)out.сбои.push(т+": окно не открылось");
   (lay?[...lay.querySelectorAll("button,[data-cmd]")]:[]).forEach(k=>{if(!имя(k))out.немые.push(т+": "+(k.dataset.cmd||""));});while(activeLayer())closeTopUI();
   (safeFn(()=>npcsFor(c),[])||[]).forEach((n,i)=>{if(!n)return;out.профессий.add(n.prof);try{openNPC(`${c.x},${c.y},${i}`);}catch(x){out.сбои.push(n.prof+": "+String(x).slice(0,80));}
    const l2=activeLayer();if(!l2)out.сбои.push(n.prof+": окно не открылось");(l2?[...l2.querySelectorAll("button,[data-cmd]")]:[]).forEach(k=>{if(!имя(k))out.немые.push(n.prof+": "+(k.dataset.cmd||""));});
    while(activeLayer())closeTopUI();});}
  G.place=null;G.x=x0;G.y=y0;return {видов:out.видов,профессий:out.профессий.size,сбои:out.сбои,немые:out.немые.slice(0,10)};});
 check('11. постройки и жители: окно каждого вида постройки и каждого жителя открывается, у каждой кнопки есть имя для голоса',
  п11.видов>=15&&п11.профессий>=15&&!п11.сбои.length&&!п11.немые.length,п11);

 /* ── 12. Карточки вещей и сохранение ── */
 const п12=await p.evaluate(async()=>{["Факел","Верёвка","Лопата","Ведро"].forEach(n=>{if(!(G.items||[]).includes(n))G.items.push(n);});
  ["дерево","камень","руда","трава","кристалл","кость","шкура","стальной слиток","тиснёная кожа"].forEach(k=>G.inv[k]=(+G.inv[k]||0)+2);
  const безКарты=[];let всего=0;for(const row of (safeFn(()=>invAll(),[])||[])){всего++;const t=safeFn(()=>invBrief(row.kind,row.key),"");if(!t||String(t).trim().length<3)безКарты.push(row.name);}
  const снимок=()=>JSON.stringify({gold:G.gold,xp:G.xp,level:G.level,inv:G.inv,items:G.items,x:G.x,y:G.y,day:G.day});
  const до=снимок();saveGame(true);G.gold=1;G.inv={};G.items=[];loadGame();const после=снимок();
  return {всего,безКарты,сохранение:до===после};});
 check('12. у каждой вещи сумы есть карточка; сохранение и загрузка возвращают золото, опыт, уровень, вещи и место',п12.всего>=10&&!п12.безКарты.length&&п12.сохранение,п12);

 /* ── 13. Одна награда — один раз ── */
 const п13=await p.evaluate(async()=>{const out={};
  /* знание мира: второе то же знание не записывается и опыта не даёт */
  const xp0=G.xp,l0=G.level;const раз1=Lore.add("map","проба-аудит-1","Проба аудита");const xp1=G.xp;const раз2=Lore.add("map","проба-аудит-1","Проба аудита");
  out.знание={раз1,раз2,опытВторой:G.xp-xp1};
  /* работа в деревне: та же работа той же деревни — не чаще раза в двенадцать часов */
  const x0=G.x,y0=G.y;let д=null;for(let r=0;r<120&&!д;r++)for(let dx=-r;dx<=r&&!д;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);if(c&&c.structure&&c.structure.type==="village")д=c;}
  if(д){G.place=null;G.x=д.x;G.y=д.y;G.hour=10;const имя=Хозяйство170.имяДеревни(д);delete Хозяйство170.ст()[имя+":deti"];
   const v0=Хозяйство170.отношение(имя);const a=Хозяйство170.сделать("deti");const v1=Хозяйство170.отношение(имя);const b=Хозяйство170.сделать("deti");const v2=Хозяйство170.отношение(имя);
   out.работа={первая:a,вторая:b,прибавка1:v1-v0,прибавка2:v2-v1};}
  G.x=x0;G.y=y0;return out;});
 check('13. одна награда — один раз: знание мира второй раз не записывается и опыта не даёт; та же работа в деревне — не чаще раза в двенадцать часов',
  п13.знание.раз1&&!п13.знание.раз2&&п13.знание.опытВторой===0&&(!п13.работа||(п13.работа.первая&&!п13.работа.вторая&&п13.работа.прибавка2===0)),п13);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fail} passed, ${fail} failed`);
 await browser.close();process.exit(fail?1:0);})();
