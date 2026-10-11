/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 304: У КАЖДОГО ЗВЕРЯ СВОИ СПОСОБНОСТИ, И БОЙ ЗВЕРЯ СЛЫШЕН (15.0)

   Просьбы игрока: «расширь способности, чтобы они у каждого были абсолютно
   разные: у Феникса одни, у Скорпиона другие, у Голема третьи»; «разные
   звуки на разные способности; лечение — тоже разное, как хозяина, так и
   если он лечит сам себя»; «не слышно, как питомец дерётся, такое чувство,
   что он вообще не дерётся»; «шаги у питомцев тоже должны быть разные».
   1. У каждого из сорока шести родов три способности (с первого, шестого и
      двенадцатого уровня); названия не повторяются, наборы действий у родов
      разные; все звуки способностей на месте.
   2. Окна «Питомцы» и «Зверинец» называют все три способности и с какого
      уровня закрытые откроются; глава руководства о питомцах о них говорит.
   3. Феникс, скорпион и голем: каждая способность звучит своим звуком —
      у одного зверя три разных, у разных зверей разные.
   4. Лечение хозяина звучит у вас и с тёплым отзвуком, своё лечение — у
      самого зверя и с его голосом; звуки разные.
   5. Бой зверя слышен: его удар — после вашего (не раньше полсекунды),
      громкостью боя, а перед ударом — бросок по роду хода.
   6. Голодный зверь бьётся вполсилы, и это сказано один раз за бой;
      раненый назван один раз, а не каждый ход.
   7. Новые действия работают: ослеплённая тварь бьёт мимо, заслон гасит
      удар, ослабленная бьёт слабее, метка усиливает ваш удар в полтора раза,
      расколотая защита — два удара, феникс возрождается раз за бой.
   8. Шаги: у волка, пса, льва, лисы, барсука и варана свой шаг, у
      саламандры — шипящий отзвук; спутник ступает своим шагом.
   9. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  /* каждый звук зверя: файл, когда, откуда, какой громкостью */
  window.ЗЛОГ=[];const at0=ZvSnd.at;ZvSnd.at=function(file,dx,dy,o){ЗЛОГ.push({f:String(file),t:Date.now(),dx:Number(dx)||0,dy:Number(dy)||0,chan:(o&&o.chan)||"fx"});return at0.apply(this,arguments);};
  window.СКАЗАНО=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0.apply(this,arguments);};
  settings.combatPace="turn";G.place=null;G.ship=null;G.zv={};G.hp=900;G.hpMax=900;
  window.ЗВЕРЬ_РОДА=(fam,lvl)=>{const b=ZV_BREEDS.find(b=>b.fam===fam&&b.var==="wild")||ZV_BREEDS.find(b=>b.fam===fam);const a=Zver.make(b.id,{тихо:true,lvl:lvl||12,верн:90});a.сыт=90;return a;};
  window.ФАЙЛЫ=keys=>[].concat(...keys.map(k=>String(k).indexOf("/")>=0?[k]:((SOUND_BANK[k]&&SOUND_BANK[k].f)||[])));
  window.БОЙ=()=>{try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;
   startCombat({x:G.x,y:G.y,monster:{id:"orc",n:"Орк",lvl:3,hp:5000,dmg:9,xp:5,gold:5}});return G.combat;};});

 /* ── 1. Три способности у каждого рода ── */
 const т=await p.evaluate(()=>{const r={нет:[],неТри:[],уровни:[],повторИмён:[],звукНет:[],описаНет:[]};const имена={},наборы={};
  for(const f of ZV_FAMILIES){const L=Zver.abilities({fam:f.id});if(L.length!==3)r.неТри.push(f.id);
   if(L.map(x=>x.ур).join()!=="1,6,12")r.уровни.push(f.id);
   const н=L.map(x=>x.эф).sort().join("+");(наборы[н]=наборы[н]||[]).push(f.id);
   for(const x of L){if(имена[x.n])r.повторИмён.push(x.n);имена[x.n]=1;if(!ZV_ABIL_EFFECTS[x.эф])r.описаНет.push(x.эф);
    for(const layer of (x.зв||[]))for(const k of layer)if(!(String(k).indexOf("/")>=0?ZvSnd.file(k):Bank.has(k)))r.звукНет.push(f.id+": "+k);}}
  r.повторНаборов=Object.values(наборы).filter(x=>x.length>1);r.родов=ZV_FAMILIES.length;r.имён=Object.keys(имена).length;return r;});
 check('1. у каждого из сорока шести родов три способности (1, 6, 12 уровень); имена и наборы не повторяются; все звуки на месте',
  т.родов===46&&т.имён===138&&!т.неТри.length&&!т.уровни.length&&!т.повторИмён.length&&!т.повторНаборов.length&&!т.звукНет.length&&!т.описаНет.length,т);

 /* ── 2. Окна называют все три способности ── */
 const о=await p.evaluate(async()=>{const a=ЗВЕРЬ_РОДА("phoenix",7);const r={};
  Stable.petView(a.uid);await спим(100);r.питомцы=[...document.querySelectorAll("#modal-pets [data-speak]")].map(e=>e.dataset.speak).find(t=>/^Способности:/.test(t))||"";
  while(activeLayer())closeTopUI();
  Zver.beastView(a.uid);await спим(100);r.зверинец=[...document.querySelectorAll("#zvBody [data-speak]")].map(e=>e.dataset.speak).find(t=>/^Способности:/.test(t))||"";
  while(activeLayer())closeTopUI();
  const sec=GUIDE_SECS.find(x=>x.t==="Питомцы и маунты");r.руководство=sec?(sec.body.find(b=>/^СПОСОБНОСТИ\./.test(b))||""):"";return r;});
 const всеТри=t=>/«Пепел возрождения»/.test(t)&&/«Огненное крыло»/.test(t)&&/«Возрождение из пепла».*откроется на уровне 12/.test(t);
 check('2. окна «Питомцы» и «Зверинец» называют все три способности и уровень, с которого откроется закрытая; руководство о них говорит',
  всеТри(о.питомцы)&&всеТри(о.зверинец)&&/три своих способности/.test(о.руководство)&&/лечение хозяина/.test(о.руководство),о);

 /* ── 3 и 4. Звук каждой способности; лечение хозяина и своё ── */
 const з=await p.evaluate(async()=>{const r={звери:{},поз:{}};const cb=БОЙ();
  for(const fam of ["phoenix","scorpion","golem","bear"]){const a=ЗВЕРЬ_РОДА(fam,12);Zver.follow(a.uid);await спим(1200);r.звери[fam]={};
   for(const x of Zver.abilOpen(a)){if(x.эф==="revive")continue;
    G.hp=500;a.hp=Math.max(1,Math.round(Zver.hpMax(a)*0.3));safeFn(()=>Hv.add("poison",1,"проба",true));
    ЗЛОГ.length=0;const t=Zver.effect(a,x,12,cb);await спим(1300);
    r.звери[fam][x.n]={эф:x.эф,текст:t,файлы:ЗЛОГ.map(e=>e.f),dx:ЗЛОГ.map(e=>Math.round(e.dx*100)/100),chan:ЗЛОГ.map(e=>e.chan)};}
   Zver.st().pets=[];}
  try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;});
 const разные=fam=>{const v=Object.values(з.звери[fam]||{});const подп=v.map(x=>x.файлы.filter(f=>!/hero_heart/.test(f)).join("|"));
  return v.length>=2&&v.every(x=>x.текст&&x.файлы.length)&&new Set(подп).size===подп.length;};
 const первые=fam=>Object.values(з.звери[fam]||{}).map(x=>x.файлы[0]);
 const пересеч=[].concat(первые("phoenix")).filter(f=>первые("scorpion").includes(f)||первые("golem").includes(f));
 check('3. феникс, скорпион и голем: у каждой способности свой звук; у разных зверей — разные',
  разные("phoenix")&&разные("scorpion")&&разные("golem")&&!пересеч.length,{з:з.звери,пересеч});
 const лечХоз=(з.звери.phoenix||{})["Пепел возрождения"]||{},лечСебя=(з.звери.bear||{})["Зимний сон"]||{};
 check('4. лечение хозяина — у вас, с тёплым отзвуком; своё лечение — у зверя, с его голосом; звуки разные',
  лечХоз.файлы&&лечХоз.dx.every(d=>Math.abs(d)<0.3)&&лечХоз.файлы.some(f=>/hero_heart/.test(f))&&
  лечСебя.файлы&&лечСебя.dx.every(d=>Math.abs(d)>=0.5)&&лечСебя.файлы.length>=2&&
  !лечСебя.файлы.some(f=>лечХоз.файлы.includes(f)),{хозяина:лечХоз,себя:лечСебя});

 /* ── 5. Бой слышен: удар зверя после вашего, громкостью боя ── */
 const б=await p.evaluate(async()=>{const r={};const cb=БОЙ();await спим(1500);
  const a=ЗВЕРЬ_РОДА("wolf",3);Zver.follow(a.uid);const удар=ФАЙЛЫ(ZvSnd.prof(a).у),бросок=ФАЙЛЫ(["lug_whoosh"].concat(ZvSnd.prof(a).ш));
  const до=cb.hp;ЗЛОГ.length=0;const t0=Date.now();r.текст=Zver.turn(cb,"atk");await спим(1600);
  r.урон=до-cb.hp;const у=ЗЛОГ.find(e=>удар.includes(e.f));r.ударЧерез=у?у.t-t0:null;r.громкость=у?у.chan:null;
  r.бросок=ЗЛОГ.filter(e=>бросок.includes(e.f)&&у&&e.t<=у.t).length;r.все=ЗЛОГ.map(e=>[e.f.split("/").pop(),e.t-t0,e.chan]);
  Zver.st().pets=[];try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;});
 check('5. удар зверя слышен после вашего (не раньше 0,5 с), громкостью боя, с броском перед ударом',
  б.урон>0&&б.ударЧерез>=500&&б.громкость==="combat"&&б.бросок>=1,б);

 /* ── 6. Голодный бьётся вполсилы; раненый назван раз ── */
 const г=await p.evaluate(async()=>{const r={};const cb=БОЙ();await спим(1500);
  const a=ЗВЕРЬ_РОДА("wolf",5),b2=ЗВЕРЬ_РОДА("hound",5);Zver.follow(a.uid);Zver.follow(b2.uid);a.сыт=5;b2.ранен=1;b2.hp=0;
  const до=cb.hp;r.т1=Zver.turn(cb,"atk");r.урон1=до-cb.hp;const до2=cb.hp;r.т2=Zver.turn(cb,"atk");r.урон2=до2-cb.hp;r.сыт=a.сыт;
  Zver.st().pets=[];try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;});
 check('6. голодный бьётся вполсилы (сказано раз за бой), раненый назван один раз',
  /голоден и бьётся вполсилы/.test(г.т1)&&!/голоден/.test(г.т2)&&!/слишком голоден/.test(г.т1+г.т2)&&г.урон1>0&&г.урон2>0&&г.сыт===5&&
  /ранен и не дерётся/.test(г.т1)&&!/ранен и не дерётся/.test(г.т2),г);

 /* ── 7. Новые действия ── */
 const д=await p.evaluate(async()=>{const r={};const cb=БОЙ();await спим(1500);G.zv={};
  /* ослепление: удара нет вовсе */
  cb.zvBlind=1;G.hp=500;const r0=Math.random;Math.random=()=>0.1;let s;try{s=foeStrike({kind:"melee"});}finally{Math.random=r0;}
  r.слепо=[s,G.hp];r.слепоСказано=СКАЗАНО.some(t=>/вслепую — мимо/.test(t));
  /* заслон и ослабление */
  cb.zvWard=10;r.заслон=Zver.guard(15);cb.zvWeak=2;r.слабее=[Zver.guard(20),Zver.guard(20),Zver.guard(20)];
  /* метка и расколотая защита — к вашему удару */
  cb.zvMarkHero=1;r.метка=[bossDamageK("atk"),bossDamageK("atk")];cb.zvBreak=2;r.раскол=[bossDamageK("atk"),bossDamageK("magic"),bossDamageK("atk")];
  /* феникс двенадцатого уровня встаёт раз за бой */
  const ph=ЗВЕРЬ_РОДА("phoenix",12);Zver.follow(ph.uid);ph.hp=3;ЗЛОГ.length=0;Zver.hurt(ph,50);r.встал=[ph.hp,Zver.hpMax(ph),!!ph.ранен];await спим(1200);
  r.звукВстал=ЗЛОГ.map(e=>e.f.split("/").pop());Zver.hurt(ph,5000);r.второй=[ph.hp,!!ph.ранен];
  Zver.st().pets=[];try{if(G.inCombat)endCombat();}catch(_){}G.inCombat=false;G.combat=null;return r;});
 check('7. ослеплённая бьёт мимо, заслон гасит, ослабленная бьёт слабее, метка ×1,5, раскол — два удара, феникс встаёт раз за бой',
  д.слепо[0]===0&&д.слепо[1]===500&&д.слепоСказано&&д.заслон<=5&&д.слабее[0]===15&&д.слабее[1]===15&&д.слабее[2]===20&&
  д.метка[0]===1.5&&д.метка[1]===1&&д.раскол[0]===1.25&&д.раскол[1]===1.25&&д.раскол[2]===1&&
  д.встал[0]===Math.round(д.встал[1]*0.4)&&!д.встал[2]&&д.звукВстал.some(f=>/rebirth/.test(f))&&д.второй[1],д);

 /* ── 8. Шаги у каждого свои ── */
 const ш=await p.evaluate(async()=>{const r={};const роды=["wolf","hound","lion","fox","badger","lizard"];
  r.шаг=Object.fromEntries(роды.map(f=>[f,ZV_SND[f].ш[0]]));r.отзвук=ZV_SND.salamander.шз;
  G.zv={};const a=ЗВЕРЬ_РОДА("hound",3);Zver.follow(a.uid);const свои=ФАЙЛЫ(ZvSnd.prof(a).ш);
  ЗЛОГ.length=0;ZvWalk.mv={x:1,y:0};for(let i=0;i<4;i++){stepSound();await спим(200);}await спим(500);
  r.спутник=ЗЛОГ.filter(e=>свои.includes(e.f)).length;Zver.st().pets=[];return r;});
 check('8. у волка, пса, льва, лисы, барсука и варана свой шаг; у саламандры шипящий отзвук; спутник ступает своим шагом',
  new Set(Object.values(ш.шаг)).size===6&&ш.отзвук==="oc_sizzle"&&ш.спутник>=2,ш);

 check('9. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
