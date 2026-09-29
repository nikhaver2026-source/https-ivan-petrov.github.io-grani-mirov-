/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 210: 4.4 — ЖИВАЯ КАПЕЛЬ ПЕЩЕРЫ, ТЯЖЁЛЫЙ ШАГ СТРАЖИ, ЗАБЫТЫЕ ЗАПИСИ

   Жалобы игрока (4.3):
   — капель в подземелье всё равно звучит не так: старые записи убрать и
     найти новые;
   — стражник ходит обычным шагом: нужен тяжёлый шаг со звоном доспехов и
     оружия, качество записей — не ниже 320 кбит/с;
   — неиспользуемые записи проверить: нужные подключить, лишние убрать.

   1. Капель — живая запись пещеры без потерь (FLAC) и долгая запись не ниже
      320 кбит/с; старой записи нет; титры и лицензия на месте.
   2. Петля капели наверху — долгой записью, под землёй — не петлёй.
   3. Дозор у стен города звучит тяжёлым шагом: сапог, вес, кольчуга, латы,
      ножны; лёгкого шага горожанина нет. Записи стражи — без потерь.
   4. На улице стражник слышен раньше горожан, даже если горожане ближе.
   5. Забытые записи звучат: осадная машина и выстрел башни — в осаде,
      гибель мечника — у разбойника, огненная стрела — у огненного лука.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const kbps=f=>{try{return Math.round(Number(execFileSync('ffprobe',['-v','error','-show_entries','format=bit_rate','-of','csv=p=0',path.join(ROOT,'sounds',f)]).toString().trim())/1000);}catch(_){return 0;}};
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{
  window.ROLES=[];const sr=Spatial.role.bind(Spatial);Spatial.role=function(r,dx,dy,o){ROLES.push({r,dx,dy,rate:o&&o.rate});return sr(r,dx,dy,o);};
  window.AT=[];const sa=Spatial.at.bind(Spatial);Spatial.at=function(f,dx,dy,o){AT.push(String(f));return sa(f,dx,dy,o);};
  window.PLAYED=[];const bp=Bank.play.bind(Bank);Bank.play=function(r,o){PLAYED.push(r);return bp(r,o);};
  window.maybeEvent=()=>{};settings.effects=1;settings.hrtf=1;G.inCombat=false;G.combat=null;G.place=null;G.ship=null;AE.ensure();Spatial.ensure();});

 /* ── 1–2. капель ── */
 const кап=await page.evaluate(()=>({
  файлы:SOUND_BANK.deep_drip.f.slice(),долгая:SOUND_BANK.cave_leak.f.slice(),
  старая:Object.values(SOUND_BANK).some(b=>b.f.some(f=>/deep_drip_01_n/.test(f))),
  раздел:roleSection("cave_leak"),папка:!!BANK_CATS.cave}));
 const титры=fs.existsSync(path.join(ROOT,'sounds/cave/CREDITS.md'))&&fs.existsSync(path.join(ROOT,'sounds/cave/LICENSE-CC-BY-SA-4.0.txt'));
 const нетСтарой=!fs.existsSync(path.join(ROOT,'sounds/deep/deep_drip_01_n.flac'));
 check('1. капель — живая пещерная запись: четыре отрывка без потерь и долгая запись от 320 кбит/с; старой записи нет; титры и лицензия на месте',
  кап.файлы.length===4&&кап.файлы.every(f=>/\.flac$/.test(f)&&fs.existsSync(path.join(ROOT,'sounds',f)))&&kbps(кап.долгая[0])>=320
  &&!кап.старая&&нетСтарой&&титры&&кап.папка,{кап,титры,нетСтарой,kbps:kbps(кап.долгая[0])});
 const петля=await page.evaluate(()=>{
  const r={};
  G.place=null;Bank.stop("t");const el=Bank.loop("t","deep_drip",{gain:0.1,kind:"ambient"});
  const rec=Bank.loops.get("t");r.наверху=rec&&rec.role;Bank.stop("t");
  G.place={depth:2,bx:1,by:1,kind:"dungeon",stype:"ruins",x:5,y:5};
  const el2=Bank.loop("t","cave_leak",{gain:0.1,kind:"ambient"});r.подЗемлёй=!!el2||!!Bank.loops.get("t");
  G.place=null;Bank.stop("t");return r;});
 check('2. петля капели наверху — долгой записью, под землёй петли нет (капают места свода)',петля.наверху==="cave_leak"&&!петля.подЗемлёй,петля);

 /* ── 3. дозор у стен ── */
 const дозор=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  /* ищем город рядом */
  let c=null;for(let x=200;x<WORLD-200&&!c;x+=97){const l=findCities(x,x,6,3).filter(z=>z.d<=5&&z.d>=2);if(l.length)c={x,l};}
  if(!c)return {нетГорода:true};
  G.x=c.x;G.y=c.x;G.place=null;
  const r0=Math.random;Math.random=()=>0.01;
  ROLES.length=0;AT.length=0;try{maybeGuardPatrol();}finally{Math.random=r0;}
  await w(4200);
  r.роли=[...new Set(ROLES.map(x=>x.r))];r.шагов=ROLES.filter(x=>x.r==="gear_guard_thud").length;
  r.лёгкий=AT.some(f=>/oc_step_soft/.test(f));
  r.ниже=ROLES.filter(x=>x.r==="mtg_step_gravel").every(x=>x.rate<0.9);
  return r;});
 const стража=["guard_mail_01.flac","guard_plate_01.flac","guard_sword_01.flac","guard_thud_01.flac"].every(f=>fs.existsSync(path.join(ROOT,'sounds/gear',f)));
 check('3. дозор у стен — тяжёлый шаг: сапог ниже тоном, вес, кольчуга, латы, ножны; лёгкого шага горожанина нет; записи стражи без потерь',
  !дозор.нетГорода&&["gear_guard_thud","gear_guard_mail","gear_guard_plate","gear_guard_sword"].every(x=>дозор.роли.includes(x))&&дозор.шагов>=5&&!дозор.лёгкий&&дозор.ниже&&стража,дозор);

 /* ── 4. стражник раньше горожан ── */
 const улица=await page.evaluate(()=>{
  const L={w:12,h:7,g:["############","#..........#","#..........#","#..........#","#..........#","#..........#","############"].map(r=>r.split(""))};
  const cl0=window.curLevel;window.curLevel=()=>L;
  G.place={kind:"city",stype:"burg",bx:3,by:3,depth:0,x:5,y:3,name:"Город"};
  const a1={id:100,kind:"folk",x:4,y:3,name:"Горожанин"},a2={id:101,kind:"folk",x:6,y:3,name:"Горожанин"},g={id:1,kind:"guard",x:9,y:3,name:"Стражник",голос:0};
  Actors.list=[a1,a2,g];Actors.key="t";
  const шагали=[];const st0=Actors.step.bind(Actors);Actors.step=(a,d)=>{шагали.push(a.kind);return true;};
  const fr0=Actors.free.bind(Actors);Actors.free=()=>true;
  Actors.tick();Actors.step=st0;Actors.free=fr0;
  window.curLevel=cl0;Actors.list=[];G.place=null;
  return {шагали};});
 check('4. на улице стражник слышен раньше горожан, даже если горожане ближе; слышны двое',улица.шагали.length===2&&улица.шагали[0]==="guard",улица);

 /* ── 5. забытые записи ── */
 const забытые=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  const src=String(warWatch);r.осада=/siege_roll/.test(src)&&/tower_shot/.test(src);
  const b=MONSTERS.find(m=>m.id==="bandit");
  G.inCombat=true;G.combat={m:b,key:"",alt:0,hp:1};
  foeProfileCue(b,"death");r.мечник=G.lastFoeCue&&G.lastFoeCue.role;
  const gob=MONSTERS.find(m=>m.id==="goblin");foeProfileCue(gob,"death");r.гоблин=G.lastFoeCue&&G.lastFoeCue.role;
  const w0=G.equip.weapon;G.equip.weapon={name:"Огненный лук",type:"Лук",slot:"weapon",val:5};
  ROLES.length=0;playWeaponCombatSfx(true,"N",6);await w(600);
  r.стрела=ROLES.some(x=>x.r==="hit_firearrow");
  G.equip.weapon={name:"Ясеневый лук",type:"Лук",slot:"weapon",val:5};ROLES.length=0;playWeaponCombatSfx(true,"N",6);await w(600);
  r.простой=ROLES.some(x=>x.r==="hit_firearrow");
  G.equip.weapon=w0;G.inCombat=false;G.combat=null;
  return r;});
 check('5. осадная машина и выстрел башни звучат в осаде, разбойник гибнет как мечник (гоблин — по-своему), огненная стрела — только у огненного лука',
  забытые.осада&&забытые.мечник==="blade_die"&&забытые.гоблин!=="blade_die"&&забытые.стрела&&!забытые.простой,забытые);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
