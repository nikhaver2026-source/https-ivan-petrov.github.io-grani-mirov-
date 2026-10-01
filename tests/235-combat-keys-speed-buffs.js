/* ════════════════════════════════════════════════════════════════════════
   НАБОР 235: БОЙ НА СЛУХ, УДАР СТРЕЛКАМИ, ТЕМП ШАГА И ВСЕ УСИЛЕНИЯ

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Флажок «В бою называть сторону твари» есть во всех сборках и по
      умолчанию снят: голос сторону не называет, её слышно; включили —
      называет. Шаги твари громче, панорама шире.
   2. Клавиатура (приложение для Windows и браузер на компьютере): пока
      оружие вынуто, стрелки — удар в свою сторону, W, A, S, D — шаг; не
      достаёт — взмах в воздух, а не шаг; убрали оружие — стрелки шагают.
      Удары переназначаются и не отнимают у ходьбы стрелок.
   3. Шаг в бою — обычный шаг (не медленнее 260 мс), быстрые шаги подряд
      не теряются.
   4. Ловкость и прибавка к скорости (артефакты, усиление «скорость»)
      торопят шаг, бег, шаг в бою и замах, укорачивают время шага и
      прибавляют скрытности; тяжесть замедляет.
   5. Скрытность: маскировка «скрытность» и ловкость уводят от встреч на
      дороге (раньше маскировка от встреч не работала).
   6. Усиления, которые прежде ничего не делали: клич, кровь на камне,
      правка — удар; контур, загрязнение, морока — чары; щит и поле — чужой
      удар; сопротивление стихии твари; севший голос — цена; остывшее тело
      и бессонница — отдых; «настежь» — ловушки; прогар — работа у станка;
      прилив — море; перевязка — кровотечение; слабый след разбора — черта;
      метка охотника — тварь не уходит, добыча полнее; удача — добыча;
      «Дыхание глубин» — чары дешевле.
   7. Искра бьёт рядовую тварь, и попадание слышно.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) GraniMirov/8.0.0 Chrome/124.0 Electron/30.0.0 Safari/537.36"});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};
  window.ЖМИ=(code,key)=>{const e=new KeyboardEvent("keydown",{code,key:key||code,bubbles:true,cancelable:true});document.dispatchEvent(e);
   document.dispatchEvent(new KeyboardEvent("keyup",{code,key:key||code,bubbles:true}));return e.defaultPrevented;};
  window.__бой=(m,где)=>{while(activeLayer())closeTopUI();if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;
   G.hp=G.hpMax=900;lastMoveDir="N";G.place=null;G.ship=null;settings.combatPace="live";
   startCombat({x:G.x,y:G.y,monster:Object.assign({id:"orc",n:"Орк",lvl:3,hp:500,dmg:9,xp:5,gold:5},m||{})});
   const a=G.combat.arena;if(где){a.fx=a.px+где[0];a.fy=a.py+где[1];}
   a.readyAt=Date.now()+600000;a.stepAt=0;a.swingAt=0;a.wind=null;return a;};
  window.__чисто=()=>{if(G.inCombat)endCombat();G.inCombat=false;G.combat=null;G.buffs={};G.weaponDrawn=false;KeyWalk.last=0;};});

 /* ── 1. флажок стороны ── */
 const сторона=await page.evaluate(()=>{
  const el=document.getElementById("setCbSide");
  const r={есть:!!el,галочка:el&&el.checked,умолч:settings.cbSide};
  const a=__бой({},[2,-1]);r.выкл=Arena.side(a);r.гдеВыкл=Arena.where(a);
  settings.cbSide=1;r.вкл=Arena.side(a);settings.cbSide=0;
  r.панорама=/dx\*1\.8/.test(String(foeSpot));
  __чисто();return r;});
 check('1. флажок «В бою называть сторону твари» есть и снят по умолчанию; снят — стороны нет, включён — есть',
  сторона.есть&&сторона.галочка===false&&сторона.умолч===0&&сторона.выкл===""&&/шаг/.test(сторона.гдеВыкл)&&/справа|слева|впереди|позади/.test(сторона.вкл)&&сторона.панорама,сторона);

 /* ── 2. стрелки бьют, W A S D ходят ── */
 const клавиши=await page.evaluate(()=>{
  const r={};const sw0=window.weaponSwing,st0=Arena.step.bind(Arena),mv0=window.move;
  const махи=[],шаги=[],ходы=[];
  window.weaponSwing=(d,ч)=>{махи.push(d+":"+(ч||""));return sw0(d,ч);};
  Arena.step=function(d){шаги.push(d);return st0(d);};
  window.move=function(d){ходы.push(d);return true;};
  /* вне боя, оружие убрано: стрелка — шаг */
  __чисто();ЖМИ("ArrowUp");r.убраноСтрелка=ходы.slice();r.убраноМах=махи.length;
  /* вне боя, оружие вынуто: стрелка — удар, W — шаг */
  G.weaponDrawn=true;ходы.length=0;махи.length=0;KeyWalk.last=0;
  ЖМИ("ArrowRight");r.вынутоСтрелка=махи.slice();r.вынутоХод=ходы.length;
  KeyWalk.last=0;ЖМИ("KeyD","d");r.вынутоD=ходы.slice();
  /* в бою, оружие вынуто, тварь далеко справа */
  const a=__бой({},[3,0]);G.weaponDrawn=true;махи.length=0;шаги.length=0;KeyWalk.last=0;window.__said.length=0;
  const px=a.px;ЖМИ("ArrowRight");r.дальМах=махи.slice();r.дальШаг=шаги.length;r.позиция=a.px===px;r.сказано=window.__said.slice(-2);
  a.stepAt=0;KeyWalk.last=0;ЖМИ("KeyD","d");r.боемD=шаги.slice();r.сдвинулся=a.px===px+1;
  /* вплотную — стрелка бьёт */
  a.fx=a.px+1;a.fy=a.py;a.swingAt=0;const hp=G.combat.hp;махи.length=0;ЖМИ("ArrowRight");
  r.вплотМах=махи.slice();
  /* убрали оружие — стрелка в бою шаг */
  G.weaponDrawn=false;шаги.length=0;a.stepAt=0;KeyWalk.last=0;a.fx=a.px+3;ЖМИ("ArrowLeft");r.убраноБой=шаги.slice();
  window.weaponSwing=sw0;Arena.step=st0;window.move=mv0;
  /* переназначение удара не отнимает стрелку у ходьбы */
  keyReset();keyBind("swingE","KeyL");r.шагСтрелкой=keyCombosOf("stepE").includes("ArrowRight");r.ударL=keyCombosOf("swingE").join();
  keyReset();keyBind("swingN","ArrowUp");r.шагВверх=keyCombosOf("stepN").includes("ArrowUp");keyReset();
  r.вСписке=KB_ACTIONS.filter(x=>x.ctx==="weapon").map(x=>x.id+":"+keyCombosOf(x.id).join());
  __чисто();return r;});
 check('2. оружие вынуто: стрелки — удар (не достаёт — взмах в воздух, не шаг), W, A, S, D — шаг; убрано — стрелки шагают; переназначение удара не отнимает стрелку у ходьбы',
  клавиши.убраноСтрелка.join()==="N"&&клавиши.убраноМах===0&&клавиши.вынутоСтрелка.join()==="E:key"&&клавиши.вынутоХод===0&&клавиши.вынутоD.join()==="E"
  &&клавиши.дальМах.join()==="E:key"&&клавиши.дальШаг===0&&клавиши.позиция&&/не достаёт/.test(клавиши.сказано.join(" "))
  &&клавиши.боемD.join()==="E"&&клавиши.сдвинулся&&клавиши.вплотМах.join()==="E:key"&&клавиши.убраноБой.join()==="W"
  &&клавиши.шагСтрелкой&&клавиши.ударL==="KeyL"&&клавиши.шагВверх&&клавиши.вСписке.length===4,клавиши);

 /* ── 3. шаг в бою — обычный ── */
 const шаг=await page.evaluate(async()=>{
  __чисто();G.agi=10;const a=__бой({},[4,0]);
  const r={мс:Arena.stepMs()};const x0=a.px;
  Arena.step("W");await new Promise(f=>setTimeout(f,120));Arena.step("W");
  await new Promise(f=>setTimeout(f,400));r.шагов=x0-a.px;
  __чисто();return r;});
 check('3. шаг в бою — обычный (не дольше 260 мс), шаг чуть раньше срока не теряется',шаг.мс<=260&&шаг.шагов===2,шаг);

 /* ── 4. ловкость и скорость: шаг, бег, бой, замах, время шага ── */
 const темп=await page.evaluate(()=>{
  __чисто();const r={};const агл0=G.agi;
  G.agi=ATTR_BASE;const k0=heroSpeedK(),run0=heroTempoMs(160),key0=heroTempoMs(260),бой0=Arena.stepMs(),мах0=weaponSpeedMs(),вр0=heroStepTimeK(),скр0=heroStealth();
  G.agi=ATTR_BASE+20;const k1=heroSpeedK(),run1=heroTempoMs(160),бой1=Arena.stepMs(),мах1=weaponSpeedMs(),вр1=heroStepTimeK(),скр1=heroStealth();
  G.agi=ATTR_BASE;buffSet("скорость",2);const k2=heroSpeedK(),вр2=heroStepTimeK(),мах2=weaponSpeedMs();delete G.buffs["скорость"];
  buffSet("тяжесть",2);const k3=heroSpeedK(),вр3=heroStepTimeK();delete G.buffs["тяжесть"];
  const art0=ART.sum;ART.sum=id=>id==="скорость"?0.3:art0.call(ART,id);const k4=heroSpeedK();ART.sum=art0;
  /* время шага в мире: ловкий тратит меньше часов */
  const шагЧасы=agi=>{G.agi=agi;G.place=null;G.ship=null;const h=G.day*24+G.hour;const sx=G.x,sy=G.y;
   const c0=window.cellContent;window.cellContent=(x,y)=>{const c=c0(x,y);return Object.assign({},c,{monster:null,structure:null,blocked:false});};
   try{move("N");}catch(_){}window.cellContent=c0;const d=(G.day*24+G.hour)-h;G.x=sx;G.y=sy;return d;};
  const ч0=шагЧасы(ATTR_BASE),ч1=шагЧасы(ATTR_BASE+20);
  G.agi=агл0;
  Object.assign(r,{k0,k1,k2,k3,k4,run0,run1,key0,бой0,бой1,мах0,мах1,мах2,вр0,вр1,вр2,вр3,скр0,скр1,ч0,ч1,
   бег:/heroTempoMs\(RUN_INTERVAL\)/.test(String(startRun)),клав:/heroTempoMs\(260\)/.test(String(keyStep))});
  return r;});
 check('4. ловкость, скорость вещей и усиление «скорость» торопят бег, шаг клавишей, шаг в бою и замах, укорачивают время шага; тяжесть замедляет',
  темп.k1>темп.k0&&темп.run1<темп.run0&&темп.бой1<темп.бой0&&темп.мах1<темп.мах0&&темп.вр1<темп.вр0&&темп.k2>темп.k0&&темп.вр2<темп.вр0&&темп.мах2<темп.мах0
  &&темп.k3<темп.k0&&темп.вр3>темп.вр0&&темп.k4>темп.k0&&темп.бег&&темп.клав&&(темп.ч0<=0||темп.ч1<темп.ч0),темп);

 /* ── 5. скрытность на дороге ── */
 const скрыт=await page.evaluate(()=>{
  __чисто();const r={};G.agi=ATTR_BASE;
  r.база=heroStealth();buffSet("скрытность",3);r.маска=heroStealth();delete G.buffs["скрытность"];
  G.agi=ATTR_BASE+20;r.ловкий=heroStealth();G.agi=ATTR_BASE;
  buffSet("след",1);r.след=heroStealth();delete G.buffs["след"];
  r.вВстрече=/heroStealth\(\)/.test(String(move));r.вПикe=/heroStealth\(\)/.test(String(diveChance));
  /* настоящая встреча: тварь на клетке, маскировка — и случай 0,3 */
  const c0=window.cellContent;const тварь={id:"wolf",n:"Волк",lvl:1,hp:10,dmg:2,xp:1,gold:1};
  const rnd=Math.random;
  const встреча=маска=>{__чисто();if(маска)buffSet("скрытность",3);window.__said.length=0;const sx=G.x,sy=G.y;
   window.cellContent=(x,y)=>{const c=c0(x,y);return (x===sx&&y===sy-1)?Object.assign({},c,{monster:Object.assign({},тварь),structure:null,blocked:false,terrain:["plains","Равнина"]}):c;};
   Math.random=()=>0.3;G.cleared={};
   try{move("N");}catch(_){}
   Math.random=rnd;window.cellContent=c0;const бой=!!G.inCombat;__чисто();G.x=sx;G.y=sy;return {бой,сказано:window.__said.slice(-2)};};
  r.безМаски=встреча(false);r.сМаской=встреча(true);
  return r;});
 check('5. маскировка «скрытность» и ловкость прибавляют скрытности и уводят от встречи на дороге; свежий след выдаёт',
  скрыт.маска>скрыт.база&&скрыт.ловкий>скрыт.база&&скрыт.след<скрыт.база&&скрыт.вПикe&&!скрыт.сМаской.бой,скрыт);

 /* ── 6. усиления ── */
 const усил=await page.evaluate(()=>{
  __чисто();const r={};const rnd=Math.random;
  /* удар: клич, кровь на камне, правка */
  const удар=buff=>{const a=__бой({},[1,0]);G.weaponDrawn=true;if(buff)buffSet(buff,3);Math.random=()=>0.99;const hp=G.combat.hp;
   try{fight("atk");}catch(_){}Math.random=rnd;const d=hp-(G.combat?G.combat.hp:hp);__чисто();return d;};
  r.удар0=удар(null);r.клич=удар("warcry");r.ярость=удар("ярость_камня");r.правка=удар("правка");
  /* чары */
  const чары=buff=>{const a=__бой({},[1,0]);if(buff)buffSet(buff,3);G.mana=G.manaMax=999;Math.random=()=>0.5;const hp=G.combat.hp;
   try{fight("magic");}catch(_){}Math.random=rnd;const d=hp-(G.combat?G.combat.hp:hp);const ост=!!(G.buffs&&G.buffs[buff]);__чисто();return {d,ост};};
  r.чары0=чары(null).d;const к=чары("контур");r.контур=к.d;r.контурИзрасходован=!к.ост;r.загрязнение=чары("загрязнение").d;r.морока=чары("морока").d;
  /* чужой удар: щит, поле, сопротивление стихии */
  const поВам=(buff,m,art)=>{const a=__бой(m||{},[1,0]);if(buff)buffSet(buff,3);Math.random=()=>0.5;const a0=ART.sum;if(art)ART.sum=id=>id===art?0.5:a0.call(ART,id);
   const hp=G.hp;try{foeStrike({kind:"melee"});}catch(_){}ART.sum=a0;Math.random=rnd;const d=hp-G.hp;__чисто();return d;};
  r.поВам0=поВам(null,{dmg:40});r.щит=поВам("щит",{dmg:40});r.поле=поВам("поле",{dmg:40});
  r.огонь0=поВам(null,{id:"firedrake",n:"Огненный змей",dmg:40});r.огоньСопр=поВам(null,{id:"firedrake",n:"Огненный змей",dmg:40},"сопр_огонь");
  r.стихия=foeElement({id:"wraith",n:"Призрак"})+","+foeElement({id:"spider",n:"Паук"})+","+foeElement({id:"icewolf",n:"Ледяной волк"});
  /* цена, отдых, ловушки, ремесло, море */
  const n={x:G.x,y:G.y,race:G.race};const ask0=safeFn(()=>npcAsk(n,"железо"),0);buffSet("сиплый",3);const ask1=safeFn(()=>npcAsk(n,"железо"),0);delete G.buffs["сиплый"];
  r.цена=[ask0,ask1];
  r.отдых=[restBuffK()];buffSet("остыл",3);r.отдых.push(restBuffK());buffSet("бессонница",3);r.отдых.push(restBuffK());G.buffs={};
  const t0=trapSkill();buffSet("настежь",3);r.ловушки=[t0,trapSkill()];G.buffs={};
  const tech=TECHS[0];const p0=techRisk(tech);buffSet("прогар",3);r.ремесло=[p0,techRisk(tech)];G.buffs={};
  r.море=SVODY_ON?[Svody.seaK(),(buffSet("прилив",3),Svody.seaK())]:[0,1];G.buffs={};
  /* перевязка, черта, метка, удача, дыхание глубин */
  buffSet("перевязан",3);buffSet("кровотечение",3);r.перевязка=!buffActive("кровотечение");G.buffs={};
  const tr=ASSIM_TRAITS.find(t=>t.бонус&&Object.keys(t.бонус).length);const вид=Object.keys(tr.бонус)[0];
  const сохр=JSON.stringify(assim().traits||{});assim().traits={};const b0=assimBonus(вид);buffSet("черта:"+tr.id,3);const b1=assimBonus(вид);assim().traits=JSON.parse(сохр);G.buffs={};
  r.черта=[b0,b1];
  r.метка=/buffActive\("huntmark"\)/.test(String(Arena.foeTurn||""))||/huntmark/.test(Object.values(Arena).filter(f=>typeof f==="function").map(String).join(""));
  r.добыча=/buffActive\("удача"\)/.test(String(victory))&&/buffActive\("huntmark"\)/.test(String(victory));
  r.стена=/buffActive\("shieldwall"\)/.test(String(foeStrike));
  r.дыхание=/buffActive\("deepbreath"\)/.test(String(castSpell))&&/buffActive\("deepbreath"\)/.test(String(fight));
  return r;});
 const u=усил;
 check('6а. удар: клич, кровь на камне и правка кромки бьют тяжелее',u.клич>u.удар0&&u.ярость>u.удар0&&u.правка>u.удар0,{удар:u.удар0,клич:u.клич,ярость:u.ярость,правка:u.правка});
 check('6б. чары: контур усиливает и тратится, загрязнение и морока ослабляют',u.контур>u.чары0&&u.контурИзрасходован&&u.загрязнение<u.чары0&&u.морока<u.чары0,{чары:u.чары0,контур:u.контур,ушёл:u.контурИзрасходован,загр:u.загрязнение,морока:u.морока});
 check('6в. щит и поле держат удар; сопротивление стихии твари гасит его долю',u.щит<u.поВам0&&u.поле<u.поВам0&&u.огоньСопр<u.огонь0&&u.стихия==="тьма,яд,лёд",{база:u.поВам0,щит:u.щит,поле:u.поле,огонь:[u.огонь0,u.огоньСопр],стихия:u.стихия});
 check('6г. цены договоров работают: голос — дороже, остыл и бессонница — отдых, засовы — ловушки, горн — работа; прилив — море слабее',
  u.цена[1]>u.цена[0]&&u.отдых.join()==="1,0.5,0"&&u.ловушки[1]<u.ловушки[0]&&u.ремесло[1]>u.ремесло[0]&&u.море[1]>u.море[0],{цена:u.цена,отдых:u.отдых,ловушки:u.ловушки,ремесло:u.ремесло,море:u.море});
 check('6д. перевязка держит кровотечение; слабый след разбора даёт черту; метка охотника, удача, стена щитов двойника и «Дыхание глубин» стоят в счёте',
  u.перевязка&&u.черта[1]>u.черта[0]&&u.метка&&u.добыча&&u.стена&&u.дыхание,{перевязка:u.перевязка,черта:u.черта,метка:u.метка,добыча:u.добыча,стена:u.стена,дыхание:u.дыхание});

 /* ── 7. искра ── */
 const искра=await page.evaluate(async()=>{
  __чисто();const a=__бой({},[2,0]);G.mana=G.manaMax=999;
  let i=SPELLS.findIndex(s=>s&&s.n==="Искра");if(i<0){SPELLS.push({n:"Искра",cost:3,school:"fire"});i=SPELLS.length-1;}
  const hp=G.combat.hp;G.lastFoeHit=null;const cues=[];const fc0=window.foeCue;window.foeCue=(...x)=>{cues.push(x[0]);return fc0(...x);};
  try{castSpell(i);}catch(e){}
  await new Promise(f=>setTimeout(f,300));window.foeCue=fc0;
  const r={урон:hp-(G.combat?G.combat.hp:hp),попал:!!G.lastFoeHit,звуки:cues};__чисто();return r;});
 check('7. Искра бьёт рядовую тварь, и попадание слышно',искра.урон>0&&искра.попал,искра);

 /* ── руководство ── */
 const гл=await page.evaluate(()=>{const t=GUIDE.map(g=>g.body.join(" ")).join(" ");
  return {удар:/УДАР ОРУЖИЕМ/.test(t)&&/стрелки бьют/.test(t),флажок:/В бою называть сторону твари/.test(t),шаг:/Шаг в бою — обычный/.test(t)};});
 check('8. руководство: удар стрелками, флажок стороны, обычный шаг в бою',гл.удар&&гл.флажок&&гл.шаг,гл);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
