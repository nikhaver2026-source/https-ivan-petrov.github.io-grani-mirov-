/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 299: 14.6 — ЗВЕРИ СЛЫШНЫ, ВЕРХОВАЯ ЕЗДА, РОСТ; ЛАВКА СО СЧЁТОМ

   Просьбы игрока:
   — «выбрал спутником инеистого скорпиона — пусть ходит со мной, дерётся, и
     это слышно его звуками; у разных питомцев разные звуки»;
   — «сел на маунта — звуки езды, ползания или полёта, смотря по маунту»;
   — «настоящие звуки, когда кормишь; звуки снаряжения, развития, нового
     уровня, находки и задания»; «ярче: феникс при кормлении еле слышен»;
   — «питомец дошёл до второго уровня, а очков развития не получил»;
   — «глава руководства о питомцах и маунтах»;
   — «у торговца — отдельно „Купить“ и „Продать“; сколько — свайпом вверх
     или вниз по товару».
   1. У каждого рода свой звуковой облик: голос, рык, удар, шаг; все записи
      есть; облики голосов не повторяются; громкость каждой записи замерена.
   2. Ярче: звуки зверей идут своим трактом и могут быть громче единицы;
      тихий голос феникса поднят.
   3. Спутник идёт следом — шаги звучат за спиной; в начале боя рык; удар
      инеистого скорпиона — со льдом; рана — визг.
   4. Верхом вместо шагов героя — шаг маунта: копыта шагом, на бегу —
      рысь или галоп; летающий хлопает крыльями; посадка и спешивание
      звучат.
   5. Кормление: живая запись еды по роду; сытая кошка мурлычет; фраза о
      новом уровне не пропадает; уровень звучит после еды.
   6. Очко развития — с каждым уровнем: на втором уровне одно, и оно
      вкладывается; окно «Развитие» говорит новое правило.
   7. Спутник сам находит в пути то, что здесь растёт: нюх и находка.
   8. Снаряжение и уход звучат своим.
   9. Лавка: окно «Купить» — только товары, «Продать» — только своё;
      свайп вверх или вниз — сколько, двойное касание — сделка; в Windows
      стрелки, Enter и пробел; стопка зелий продаётся счётом.
   10. Руководство: «Питомцы и маунты» и абзац о лавке.
   11. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 const cdp=await ctx.newCDPSession(p);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:0}]});
 async function swipe(fx,fy,tx,ty){await touch('touchStart',fx,fy);for(let i=1;i<=6;i++){await touch('touchMove',fx+(tx-fx)*i/6,fy+(ty-fy)*i/6);await p.waitForTimeout(16);}await touch('touchEnd',tx,ty);await p.waitForTimeout(180);}
 async function tap(x,y){await touch('touchStart',x,y);await p.waitForTimeout(30);await touch('touchEnd',x,y);await p.waitForTimeout(60);}
 const вверх=()=>swipe(200,520,200,360),вниз=()=>swipe(200,360,200,520);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.СКАЗАНО=[];const e0=Speech.enqueue.bind(Speech);Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0(t,o);};
  window.ПЛЕЕР=[];const p0=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){ПЛЕЕР.push(String(this.src).split("/sounds/").pop());return p0.apply(this,arguments);};
  window.ПОЛЗ=[];const sp=Sliders.play.bind(Sliders);Sliders.play=function(el,d){ПОЛЗ.push([+el.value,d]);return sp(el,d);};
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  /* Мир молчит: обоз, крики и птицы не путаются со звуками зверя. */
  window.ЗВЕРЬ=()=>ZvSnd.журнал.map(x=>x[0]);
  G.place=null;G.ship=null;G.zv={};G.hp=900;G.hpMax=900;});

 /* ── 1. Звуковой облик ── */
 const о=await p.evaluate(()=>{const нет=[],роли=new Set(),файлы=new Set();
  const есть=r=>String(r).indexOf("/")>=0?true:Bank.has(r);
  for(const f of ZV_FAMILIES){const pp=ZV_SND[f.id];if(!pp){нет.push(f.id+": нет облика");continue;}
   for(const k of ["г","р","у","ш"])for(const r of (pp[k]||[])){if(!есть(r))нет.push(f.id+"."+k+": "+r);роли.add(r);}
   for(const k of ["е","бег"])for(const r of (pp[k]||[])){if(!есть(r))нет.push(f.id+"."+k+": "+r);роли.add(r);}
   if(pp.сыт&&!Bank.has(pp.сыт))нет.push(f.id+".сыт");if(!ZV_EAT[pp.ест])нет.push(f.id+".ест");}
  for(const L of Object.values(ZV_EAT))for(const r of L){if(!Bank.has(r))нет.push("еда: "+r);роли.add(r);}
  for(const r of Object.values(ZV_STIH_SND)){if(!Bank.has(r))нет.push("облик: "+r);роли.add(r);}
  for(const r of роли){if(String(r).indexOf("/")>=0)файлы.add(r);else (SOUND_BANK[r].f||[]).forEach(x=>файлы.add(x));}
  const без=[...файлы].filter(f=>!(Number(ZV_LEVEL[f])>0));
  const sig={};for(const [id,pp] of Object.entries(ZV_SND)){const k=pp.г[0]+"@"+pp.п;(sig[k]=sig[k]||[]).push(id);}
  const повтор=Object.values(sig).filter(x=>x.length>1);
  const kk=Object.values(ZV_LEVEL);
  return {родов:ZV_FAMILIES.length,обликов:Object.keys(ZV_SND).length,нет,без:без.slice(0,8),повтор,
   k:[Math.min(...kk),Math.max(...kk)],zv:["zv_eat_herb","zv_eat_crunch","zv_eat_bone","zv_purr","zv_pant","zv_sniff","zv_neigh","zv_moo","zv_bleat","zv_pig","zv_bark","zv_wing","zv_ride_walk","zv_ride_trot","zv_ride_gallop"].filter(r=>!Bank.has(r))};});
 const zvFiles=fs.readdirSync(path.join(ROOT,'sounds','zv')).filter(f=>/\.flac$/.test(f));
 check('1. у каждого рода свой звуковой облик; все записи на месте; голоса не повторяются; громкость каждой записи замерена',
  о.родов>=40&&о.обликов===о.родов&&!о.нет.length&&!о.без.length&&!о.повтор.length&&о.k[0]>=0.5&&о.k[1]<=8&&!о.zv.length
  &&zvFiles.length>=30&&fs.existsSync(path.join(ROOT,'sounds','zv','CREDITS.md'))&&fs.existsSync(path.join(ROOT,'sounds','zv','LICENSE-CC0.txt')),
  {о,файлов:zvFiles.length});

 /* ── 2. Ярче ── */
 const я=await p.evaluate(async()=>{ZvSnd.журнал.length=0;
  const ph=ZV_BREEDS.find(b=>b.fam==="phoenix");const a=Zver.make(ph.id,{тихо:true});
  /* тихий крик феникса поднят; голос феникса — птичий крик с треском пламени (выбор без случая) */
  for(let i=0;i<3;i++){ZvSnd.play(["bird_hawk"],{gain:1});await спим(40);}
  const r0=Math.random;Math.random=()=>0;try{ZvSnd.voice(a,{gain:1});}finally{Math.random=r0;}await спим(400);
  const гр=ZvSnd.журнал.map(x=>x[1]);
  return {гр,k:ZvSnd.k("mg/bird_hawk_01.ogg"),на:Spatial.on(),записи:ЗВЕРЬ()};});
 check('2. ярче: звуки зверей идут своим трактом и бывают громче единицы; тихий голос феникса поднят',
  я.на&&я.гр.length>=4&&Math.max(...я.гр)>1&&я.k>1.2&&я.записи.some(f=>/bird_hawk|raptor_cry/.test(f))&&я.записи.some(f=>/lug_fire_start/.test(f)),я);

 /* ── 3. Спутник: следом, бой ── */
 const сп=await p.evaluate(async()=>{const r={};G.zv={};
  const b=ZV_BREEDS.find(b=>b.fam==="scorpion"&&(ZV_VARIANT_BY_ID[b.var]||{}).стих==="лёд");const a=Zver.make(b.id,{тихо:true,верн:80});a.сыт=90;
  ZvSnd.журнал.length=0;r.взят=Zver.follow(a.uid);await спим(700);r.голосВзять=ЗВЕРЬ();
  const шаг=ZvSnd.prof(a).ш.map(x=>x.indexOf("/")>=0?x:SOUND_BANK[x].f).flat();
  ZvSnd.журнал.length=0;ZvWalk.mv={x:1,y:0};for(let i=0;i<4;i++){stepSound();await спим(160);}await спим(500);
  r.шаги=ЗВЕРЬ().filter(f=>шаг.includes(f)).length;r.шагФайл=шаг[0];
  /* шаги звучат за спиной: идём на восток — спутник с запада */
  r.сзади=ZvSnd.behind(0).dx<0;
  ZvSnd.журнал.length=0;settings.combatPace="live";
  startCombat({x:G.x,y:G.y,monster:{id:"orc",n:"Орк",lvl:3,hp:500,dmg:9,xp:5,gold:5}});await спим(1400);
  const рык=(ZvSnd.prof(a).р||[]).map(x=>x.indexOf("/")>=0?x:SOUND_BANK[x].f).flat();r.рык=ЗВЕРЬ().filter(f=>рык.includes(f)).length;
  ZvSnd.журнал.length=0;ПЛЕЕР.length=0;r.ход=Zver.turn(G.combat,"attack");await спим(1000);
  r.удар=ЗВЕРЬ();r.лёд=ЗВЕРЬ().some(f=>SOUND_BANK.mtg_step_ice.f.includes(f));
  r.клешня=ПЛЕЕР.filter(f=>/lug_claw/.test(f)).length;
  ZvSnd.журнал.length=0;Zver.hurt(a,3);await спим(500);r.визг=ЗВЕРЬ().length;
  try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;});
 check('3. спутник идёт следом — шаги за спиной своим звуком; в начале боя рык; удар инеистого скорпиона — со льдом, без двойного звука; рана — визг',
  /идёт с вами/.test(сп.взят)&&сп.голосВзять.length>=1&&сп.шаги>=2&&сп.сзади&&сп.рык>=1&&сп.удар.length>=2&&сп.лёд&&сп.клешня<=1&&сп.визг>=1,сп);

 /* ── 4. Верхом ── */
 const вх=await p.evaluate(async()=>{const r={};G.zv={};G.mount=null;
  const hb=ZV_BREEDS.find(b=>b.fam==="horse");const m=Zver.make(hb.id,{тихо:true,верн:90});
  ZvSnd.журнал.length=0;r.сесть=Zver.ride(m.uid);await спим(800);r.посадка=ЗВЕРЬ();
  const шагГероя=new Set([].concat(...["step_grass","step_dirt","step_stone","step_sand","step_snow","step_wood","step_water","step_mud","fx_step"].filter(x=>SOUND_BANK[x]).map(x=>SOUND_BANK[x].f)));
  ZvSnd.журнал.length=0;ПЛЕЕР.length=0;runState.active=false;for(let i=0;i<4;i++){stepSound();await спим(220);}await спим(300);
  r.шагом=ЗВЕРЬ().filter(f=>/zv_ride_walk/.test(f)).length;
  r.сапоги=ПЛЕЕР.filter(f=>/footstep|fx_step|step_/.test(f)&&!/zv_|creatures|tread_hoof/.test(f));
  ZvSnd.журнал.length=0;runState.active=true;for(let i=0;i<4;i++){stepSound();await спим(200);}runState.active=false;await спим(300);
  r.бегом=ЗВЕРЬ().filter(f=>/zv_ride_(trot|gallop)/.test(f)).length;
  ZvSnd.журнал.length=0;r.сошёл=Zver.dismount();await спим(600);r.спешился=ЗВЕРЬ();
  /* летающий маунт — крылья */
  const fb=ZV_BREEDS.find(b=>ZV_FAMILY_BY_ID[b.fam].ездовой&&ZV_FAMILY_BY_ID[b.fam].ход==="fly");const f=Zver.make(fb.id,{тихо:true,верн:90});
  Zver.ride(f.uid);await спим(500);ZvSnd.журнал.length=0;for(let i=0;i<3;i++){stepSound();await спим(220);}await спим(300);
  const кр=(ZvSnd.prof(f).е||ZvSnd.prof(f).ш).map(x=>x.indexOf("/")>=0?x:SOUND_BANK[x].f).flat();
  r.крылья=ЗВЕРЬ().filter(x=>кр.includes(x)).length;r.летун=fb.fam;Zver.dismount();
  return r;});
 check('4. верхом вместо шагов героя — копыта; на бегу — рысь или галоп; летающий — крылья; посадка и спешивание звучат',
  /^Вы верхом/.test(вх.сесть)&&вх.посадка.length>=1&&вх.шагом>=3&&!вх.сапоги.length&&вх.бегом>=3&&вх.спешился.length>=1&&вх.крылья>=2,вх);

 /* ── 5. Кормление ── */
 const к=await p.evaluate(async()=>{const r={};G.zv={};
  const hb=ZV_BREEDS.find(b=>b.fam==="horse");const h=Zver.make(hb.id,{тихо:true});h.сыт=10;
  const корм=Zver.fam(h).корм[0];G.inv[ZV_FOOD[корм]]=(Number(G.inv[ZV_FOOD[корм]])||0)+3;
  h.xp=Zver.need(h)-1;ZvSnd.журнал.length=0;r.конь=Zver.feed(h.uid);await спим(400);r.ест=ЗВЕРЬ().slice();await спим(4000);r.всё=ЗВЕРЬ();
  /* звук уровня (перезвон) ждёт конца еды, а не звучит поверх */
  r.уровень=ЗВЕРЬ().findIndex(f=>SOUND_BANK.arc_shine.f.includes(f)||SOUND_BANK.uh_bell.f.includes(f));r.еда=ЗВЕРЬ().findIndex(f=>/zv_eat_(herb|crunch)/.test(f));
  const cb=ZV_BREEDS.find(b=>b.fam==="cat");const c=Zver.make(cb.id,{тихо:true});c.сыт=10;const ck=Zver.fam(c).корм[0];G.inv[ZV_FOOD[ck]]=(Number(G.inv[ZV_FOOD[ck]])||0)+2;
  ZvSnd.журнал.length=0;r.кошка=Zver.feed(c.uid);await спим(2600);r.мур=ЗВЕРЬ().some(f=>/zv_purr/.test(f));
  const wb=ZV_BREEDS.find(b=>b.fam==="wolf");const w=Zver.make(wb.id,{тихо:true});w.сыт=10;const wk=Zver.fam(w).корм[0];G.inv[ZV_FOOD[wk]]=(Number(G.inv[ZV_FOOD[wk]])||0)+2;
  ZvSnd.журнал.length=0;r.волк=Zver.feed(w.uid);await спим(2200);r.кость=ЗВЕРЬ().some(f=>/zv_eat_bone|zm\/chew/.test(f));
  return r;});
 check('5. кормление: конь жуёт, волк грызёт, сытая кошка мурлычет; фраза о новом уровне не пропадает, уровень звучит после еды',
  /вырос до уровня 2: очко развития/.test(к.конь)&&к.ест.some(f=>/zv_eat_(herb|crunch)/.test(f))&&к.уровень>к.еда&&к.еда>=0&&к.мур&&к.кость&&!/ест рыба|ест трава/.test(к.кошка),к);

 /* ── 6. Очки развития ── */
 const ро=await p.evaluate(async()=>{const r={};G.zv={};
  const b=ZV_BREEDS.find(b=>b.fam==="wolf");const a=Zver.make(b.id,{тихо:true});a.lvl=1;a.xp=0;
  r.п1=Zver.points(a);r.вырос=Zver.xp(a,Zver.need(a));r.п2=[a.lvl,Zver.points(a)];
  ZvSnd.журнал.length=0;r.вложено=Zver.grow(a.uid,ZV_BRANCHES[0].id);await спим(900);r.звук=ЗВЕРЬ().some(f=>/arcane_rise|magic_shimmer|shimmer/.test(f));
  r.ещё=Zver.grow(a.uid,ZV_BRANCHES[1].id);
  safeFn(()=>Stable.growView("pet",a.uid));await спим(200);
  r.окно=((document.getElementById("petsBody")||{}).textContent||"").slice(0,160);
  for(let i=0;i<5;i++)Zver.xp(a,Zver.need(a));r.п7=[a.lvl,Zver.points(a)];
  return r;});
 check('6. очко развития с каждым уровнем: на втором — одно, вкладывается со звуком; дальше — «следующее на уровне 3»; уровень 7 — шесть очков',
  ро.п1===0&&ро.п2[0]===2&&ро.п2[1]===1&&/ступень 1/.test(ро.вложено)&&ро.звук&&/следующее — на уровне 3/.test(ро.ещё)&&ро.п7[1]===ро.п7[0]-1&&/очко — с каждым новым уровнем/.test(ро.окно),ро);

 /* ── 7. Находка в пути ── */
 const н=await p.evaluate(async()=>{const r={};G.zv={};G.place=null;G.ship=null;G.inCombat=false;
  const b=ZV_BREEDS.find(b=>b.fam==="hound")||ZV_BREEDS.find(b=>b.fam==="wolf");const a=Zver.make(b.id,{тихо:true,верн:80});a.сыт=90;a.роль="scout";Zver.st().pets=[a.uid];
  while(activeLayer())closeTopUI();   /* 15.5: при открытом окне «Питомцы» фоновые фразы ждут его закрытия */
  const s=Zver.st();s.steps=100;s.findAt=0;const было=JSON.stringify(G.inv);const r0=Math.random;Math.random=()=>0.001;
  ZvSnd.журнал.length=0;СКАЗАНО.length=0;try{ZvFind.step();}finally{Math.random=r0;}await спим(1600);
  r.нашёл=СКАЗАНО.filter(t=>/учуял/.test(t));r.нюх=ЗВЕРЬ().some(f=>/zv_sniff/.test(f));r.сума=JSON.stringify(G.inv)!==было;Zver.st().pets=[];return r;});
 check('7. спутник сам находит в пути то, что здесь растёт: нюх, находка в суме, слово',н.нашёл.length>=1&&н.нюх&&н.сума,н);

 /* ── 8. Снаряжение и уход ── */
 const су=await p.evaluate(async()=>{const r={};G.zv={};while(activeLayer())closeTopUI();await спим(3500);   /* отзвучали сценки прежних проверок */
  const b=ZV_BREEDS.find(b=>b.fam==="horse");const a=Zver.make(b.id,{тихо:true,верн:80});
  const mat=ZV_MATERIALS.find(m=>!m.рес)||ZV_MATERIALS[0];Zver.st().gear["saddle:"+mat.id]=1;
  ZvSnd.журнал.length=0;r.надел=Zver.equip(a.uid,"saddle",mat.id);await спим(1000);r.звук=ЗВЕРЬ();
  ZvSnd.журнал.length=0;r.уход=safeFn(()=>Stable.care(a.uid,"groom"),"");await спим(1200);r.уходЗвук=ЗВЕРЬ();
  return r;});
 check('8. снаряжение и уход звучат своим: кожа седла и голос зверя, щётка',
  су.звук.length>=2&&су.уходЗвук.length>=1,су);

 /* ── 9. Лавка ── */
 await p.evaluate(async()=>{while(activeLayer())closeTopUI();G.zv={};G.place=null;G.ship=null;let npc=null;
  outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){const c=safeFn(()=>cellContent((OLD_WORLD>>1)+dx,(OLD_WORLD>>1)+dy),null);if(c&&c.structure){const n=safeFn(()=>npcsFor(c),[]).find(x=>x.trade);if(n){G.x=(OLD_WORLD>>1)+dx;G.y=(OLD_WORLD>>1)+dy;npc=n;break outer;}}}
  window.__npc=npc.key;G.gold=600;G.inv={"руда":12};G.potions=[];potionGive("strength",{q:1});potionGive("strength",{q:1});potionGive("strength",{q:1});potionGive("strength",{q:1});
  G.items=(G.items||[]).filter(x=>x!=="Факел").concat(["Факел","Факел","Факел","Факел","Факел"]);
  openTrade(npc.key,"buy");await спим(300);
  const b=[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].find(x=>+x.dataset.shopmax>5);setCursor(b,true);ПОЛЗ.length=0;});
 const л1=await p.evaluate(()=>({заголовок:document.getElementById("shopTitle").textContent,
  вверху:[...document.querySelectorAll('#shopBody > *')].slice(0,3).map(x=>x.dataset&&x.dataset.cmd||x.tagName),
  окна:[...document.querySelectorAll('#shopBody [data-cmd^="shoptab:"]')].map(b=>b.dataset.cmd),
  последняя:(()=>{const it=[...document.querySelectorAll('#shopBody button')];return it[it.length-1].dataset.cmd;})(),
  кнопок1510:document.querySelectorAll('#shopBody [data-cmd^="shopnow:"]').length,
  строк:document.querySelectorAll('#shopBody [data-cmd^="shopitem:"][data-shopmax]').length,
  продажа:[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].filter(b=>b.dataset.shoptab!=="buy").length,
  курсор:uiCursor.dataset.cmd,цена:+uiCursor.dataset.shopprice,золото:G.gold}));
 await вверх();await вверх();await вверх();await вниз();
 const л2=await p.evaluate(()=>({n:uiCursor.dataset.shopn,текст:uiCursor.textContent,сказано:СКАЗАНО.slice(-1)[0]||"",полз:ПОЛЗ.length}));
 await tap(195,400);await tap(195,400);await p.waitForTimeout(500);
 const л3=await p.evaluate(()=>({золото:G.gold,сказано:СКАЗАНО.filter(t=>/^Куплено/.test(t)).slice(-1)[0]||"",курсор:uiCursor&&uiCursor.dataset.cmd}));
 check('9а. окно «Купить»: сразу товары, по строке на товар; другое окно — в конце; свайп вверх или вниз — сколько, со щелчком; двойное касание покупает столько',
  /: купить$/.test(л1.заголовок)&&л1.окна.length===1&&л1.окна[0]==="shoptab:sell"&&л1.последняя==="shoptab:sell"&&!л1.кнопок1510&&л1.строк>=3&&!л1.продажа
  &&!л1.вверху.some(x=>/^shoptab|^shopcat/.test(x))&&л2.n==="3"&&/купить 3/.test(л2.текст)&&/^3 из \d+/.test(л2.сказано)&&л2.полз>=4
  &&л1.золото-л3.золото===л1.цена*3&&/×3 за/.test(л3.сказано)&&л3.курсор===л1.курсор,{л1,л2,л3});
 const л4=await p.evaluate(async()=>{CMD.shoptab("sell");await спим(300);
  return {заголовок:document.getElementById("shopTitle").textContent,курсор:uiCursor&&uiCursor.className,
   строки:[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].map(b=>[b.dataset.shoptab,b.dataset.shopmax,b.textContent.trim()]),
   окна:[...document.querySelectorAll('#shopBody [data-cmd^="shoptab:"]')].map(b=>b.dataset.cmd)};});
 await p.evaluate(()=>{window.graniDesktop={};const b=[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')].find(x=>/руда/.test(x.textContent));setCursor(b,true);});
 const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(150);};
 await key("ArrowUp");await key("ArrowUp");await key("ArrowUp");await key("ArrowUp");await key("ArrowDown");
 const л5=await p.evaluate(()=>({n:uiCursor.dataset.shopn,сказано:СКАЗАНО.slice(-1)[0]||""}));
 await key("Enter");await p.waitForTimeout(500);
 const л6=await p.evaluate(()=>({руда:G.inv["руда"],сказано:СКАЗАНО.filter(t=>/^Продано/.test(t)).slice(-1)[0]||""}));
 /* стопка не-ресурсов (зелья, одинаковые вещи) — счётом: прежде уходила одна, сколько ни выбрано */
 const стопка=await p.evaluate(()=>{const n=shopNpc();const rows=shopSellRows(n).filter(x=>x.ок);
  const r=rows.find(x=>!["res","rare","plant","fish"].includes(x.row.kind)&&x.n>=3);if(!r)return null;
  const b=document.querySelector(`#shopBody [data-cmd="shopitem:${rows.indexOf(r)}"]`);if(b)setCursor(b,true);return {имя:r.name,вид:r.row.kind,n:r.n,есть:!!b};});
 if(стопка&&стопка.есть){await key("ArrowUp");await key("ArrowUp");await key("Enter");await p.waitForTimeout(500);}
 const л7=await p.evaluate(имя=>({осталось:имя?((invAll().find(x=>x.name===имя)||{}).n||0):-1,сказано:СКАЗАНО.filter(t=>/^Продано/.test(t)).slice(-1)[0]||""}),стопка&&стопка.имя);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#shopBody [data-cmd^="shopitem:"]')][0];if(b)setCursor(b,true);});
 await key("Space");await p.waitForTimeout(300);
 const л8=await p.evaluate(()=>({карточка:[...document.querySelectorAll('#shopBody [data-cmd^="shopask:"]')].length,назад:!!document.querySelector('#shopBody [data-cmd="shopback"]')}));
 check('9б. окно «Продать»: только своё; другое окно — «Купить»; в Windows стрелки — сколько, Enter — продать; стопка зелий продаётся счётом; пробел — карточка',
  /: продать$/.test(л4.заголовок)&&/list-line/.test(л4.курсор||"")&&л4.строки.length>=1&&л4.строки.every(x=>x[0]==="sell")&&л4.окна.join()==="shoptab:buy"
  &&л5.n==="4"&&/^4 из 12/.test(л5.сказано)&&л6.руда===8&&/руда — 4 шт\./.test(л6.сказано)
  &&!!стопка&&стопка.есть&&л7.осталось===стопка.n-3&&/— 3 шт\./.test(л7.сказано)&&л8.карточка>=1&&л8.назад,{л4,л5,л6,стопка,л7,л8});

 /* ── 10. Руководство ── */
 const р=await p.evaluate(()=>{while(activeLayer())closeTopUI();
  const s=GUIDE_SECS.find(x=>x.t==="Питомцы и маунты");const все=s?s.body.join(" "):"";
  const лавка=GUIDE_SECS.some(x=>x.body.some(b=>/^ЛАВКА: КУПИТЬ И ПРОДАТЬ\./.test(b)&&/свайп вверх или вниз/.test(b)));
  return {есть:!!s,абзацев:s?s.body.length:0,очки:/С каждым новым уровнем — очко развития/.test(все),езда:/вместо ваших шагов слышен (только )?ход маунта/.test(все),
   голос:/свой голос, рык, удар, шаг/.test(все),лавка,глава:(GUIDE.find(g=>/питомцы и маунты/.test(g.title))||{}).title||"",глав:GUIDE.length};});
 check('10. руководство: раздел «Питомцы и маунты» (спутник, голос, кормление, очки, езда) и абзац о лавке со счётом',
  р.есть&&р.абзацев>=8&&р.очки&&р.езда&&р.голос&&р.лавка&&/питомцы и маунты/.test(р.глава)&&р.глав<=20,р);

 /* ── 12. Окна «Питомцы» и «Маунты»: тем же звуком, без двойников ── */
 const ок=await p.evaluate(async()=>{const r={};while(activeLayer())closeTopUI();G.zv={};G.mount=null;G.place=null;G.ship=null;G.inCombat=false;
  const БАНК=[];const bp=Bank.play.bind(Bank);Bank.play=function(rl,o){БАНК.push(rl);return bp(rl,o);};
  const жать=c=>{const b=[...document.querySelectorAll('button[data-cmd]')].find(x=>x.dataset.cmd===c);if(b)activateElement(b);return !!b;};
  const mk=(f,o)=>Zver.make(ZV_BREEDS.find(b=>b.fam===f).id,Object.assign({тихо:true,верн:90},o||{}));
  const конь=mk("horse"),кот=mk("cat"),волк=mk("wolf"),скорп=mk("scorpion");G.mounts=["ashmare"];
  const сцена=async(fn,ms)=>{БАНК.length=0;ZvSnd.журнал.length=0;await fn();await спим(ms||1800);return {банк:БАНК.slice(),зверь:ЗВЕРЬ()};};
  CMD.mounts();await спим(150);
  r.зов=await сцена(async()=>{CMD.mnt("view:zv:"+конь.uid);await спим(120);r.кнЗов=жать("mnt:call:zv:"+конь.uid);},2200);
  r.сесть=await сцена(async()=>{CMD.mnt("view:zv:"+конь.uid);await спим(120);r.кнСесть=жать("mnt:ride:zv:"+конь.uid);},1500);r.верхом=Stable.riding();
  r.сойти=await сцена(async()=>{CMD.mounts();await спим(120);r.кнСойти=жать("mnt:off");},1800);r.пешком=!Stable.riding();
  r.палаты=await сцена(async()=>{CMD.mnt("view:leg:ashmare");await спим(120);жать("mnt:call:leg:ashmare");await спим(2200);CMD.mnt("view:leg:ashmare");await спим(120);жать("mnt:ride:leg:ashmare");},1500);
  while(activeLayer())closeTopUI();CMD.mounts();await спим(120);жать("mnt:off");await спим(800);
  r.чесать=await сцена(async()=>{CMD.pet("care:"+кот.uid);await спим(120);жать("pet:docare:"+кот.uid+":groom");},1800);
  r.задание=await сцена(async()=>{CMD.pet("tasks:"+кот.uid);await спим(120);const b=document.querySelector('#petsBody button[data-cmd^="pet:task:'+кот.uid+':"]');if(b)activateElement(b);},2200);
  [конь,волк,скорп].forEach(a=>{a.сыт=20;const f=Zver.fam(a);for(const k of f.корм)G.inv[ZV_FOOD[k]]=(Number(G.inv[ZV_FOOD[k]])||0)+3;});
  r.всех=await сцена(async()=>{CMD.pets();await спим(120);жать("pet:feedall");},400);
  /* через 0,4 с звучит только первая сценка; остальные — по очереди */
  r.всехСразу=r.всех.зверь.filter(f=>/zv_eat|chew|chitter/.test(f)).length;await спим(5200);r.всехПотом=ЗВЕРЬ().filter(f=>/zv_eat|chew|chitter/.test(f)).length;
  while(activeLayer())closeTopUI();Bank.play=bp;return r;});
 const копыта=x=>x.банк.filter(b=>b==="horse_step").length;
 check('12. окна «Питомцы» и «Маунты»: зов — шаги и голос; посадка — седло и голос без стука копыт; «Спешиться здесь» — седло; скакун палат — один голос; вычёсывание — одна щётка; задание — шаги уходят; «Накормить всех» — по очереди',
  ок.кнЗов&&ок.кнСесть&&ок.кнСойти&&/^zv:/.test(ок.верхом||"")&&ок.пешком
  &&ок.зов.зверь.some(f=>/zv_ride_walk/.test(f))&&ок.зов.зверь.some(f=>/zv_neigh|beasts_horse/.test(f))&&!копыта(ок.зов)
  &&ок.сесть.зверь.some(f=>/leather/.test(f))&&!копыта(ок.сесть)
  &&ок.сойти.зверь.some(f=>/leather|lug_land/.test(f))&&!копыта(ок.сойти)
  &&!копыта(ок.палаты)&&!ок.палаты.банк.includes("beasts_horse")
  &&!ок.чесать.банк.includes("oc_rustle")&&ок.чесать.зверь.filter(f=>/craft_hide|arte_leather/.test(f)).length===1
  &&ок.задание.зверь.filter(f=>/step|tread|creatures|zv_paw|zv_hoof|zv_claw/.test(f)).length>=3   /* 15.5: шаги лап и копыт — zvlapy */
  &&ок.всехСразу<=1&&ок.всехПотом>=2,ок);

 check('11. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
