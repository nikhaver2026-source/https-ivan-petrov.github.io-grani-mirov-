/* ════════════════════════════════════════════════════════════════════════
   НАБОР 318: ПИТОМЕЦ БЬЁТСЯ И ЛЕЧИТ САМ; ОКНА ЗВЕРЕЙ БЕЗ ЛИШНИХ ФРАЗ (15.5)

   Просьбы игрока: питомец должен сражаться вне зависимости от того, бьёт ли
   игрок монстра; не слышно, как питомец дерётся и лечит, а лечение феникса
   «не работает»; в меню питомцев и маунтов синтезатор перехватывает лишние
   фразы.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=1;settings.music=0;
  /* речь — записываем на входе в очередь: обёртки (окна зверей, тихий бой) работают как в игре */
  window.__said=[];Speech.enqueue=function(t,o){window.__said.push([String(t),o||{}]);return null;};
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();};
  window.__феникс=()=>{const s=Zver.st();const br=ZV_BREEDS.find(x=>x.fam==="phoenix");const a=Zver.make(br.id);s.list.push(a);s.pets=[a.uid];a.сыт=90;a.верн=90;return a;};
  window.__бой=(hp)=>{const m={...MONSTERS[0],lvl:5,hp:hp||400,dmg:0,xp:5,gold:1};startCombat({x:G.x,y:G.y,monster:m});return G.combat;};
  G.place=null;G.hpMax=200;G.hp=200;});

 /* ── 1. феникс — лекарь по роду ── */
 const ф=await page.evaluate(()=>{const a=__феникс();return {роль:a.роль,роли:ZV_FAMILY_BY_ID.phoenix.роли};});
 check('1. феникс по роду — лекарь (первая роль рода)',ф.роль==="healer",ф);

 /* ── 2–4. в бою питомец бьёт своим чередом, без ударов героя; лечит — слышно и сказано ── */
 const б=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));G.hp=60;__said.length=0;const cb=__бой(400);const foe0=cb.hp,hp0=G.hp;
  const строки=[];const cl=window.cbLog;window.cbLog=function(t){строки.push(String(t));return cl.apply(this,arguments);};
  const j0=ZvSnd.журнал.length;await sl(7600);window.cbLog=cl;
  const жур=ZvSnd.журнал.slice(Math.max(0,ZvSnd.журнал.length-40));
  const o={урон:foe0-(G.combat?G.combat.hp:foe0),лечение:G.hp-hp0,журнал:строки.filter(t=>/Феникс/.test(t)).slice(0,2).join(" | "),
   лечЗвук:жур.filter(([f])=>/heal_bloom/.test(f)).map(([,g])=>g),удары:жур.filter(([f])=>!/heal_bloom|magic_shimmer/.test(f)).length,
   слова:__said.filter(([t])=>/лечит вас/.test(t)).map(([t,o])=>({t,урон:o.урон}))};
  safeFn(()=>endCombat());return o;});
 check('2. в бою питомец бьёт тварь своим чередом, даже когда герой не бьёт: урон идёт, удары слышны со стороны твари',
  б.урон>0&&б.удары>=2&&/Феникс/.test(б.журнал),б);
 check('3. лечение феникса работает и в бою без ударов героя: здоровье прибавляется, лечение звучит ясно (цветение громче прежнего)',
  б.лечение>0&&б.лечЗвук.length>=1&&Math.max(...б.лечЗвук)>=0.5,б);
 check('4. лечение сказано коротко и проходит тихий бой — как весть о своём здоровье',
  б.слова.length>=1&&б.слова.every(x=>/^Феникс лечит вас: \+\d+\.$/.test(x.t)&&x.урон==="me"),б.слова);

 /* ── 5. вслед за ударом героя питомец ходит, как прежде, а свой черёд не удваивает ── */
 const г=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));G.hp=200;const cb=__бой(400);await sl(300);
  let n=0;const t0=Zver.turn;Zver.turn=function(){n++;return t0.apply(this,arguments);};
  try{fight("atk");const после=n;await sl(1500);return {послеУдара:после,заПолторы:n-после,zvLast:!!cb.zvLast};}
  finally{Zver.turn=t0;safeFn(()=>endCombat());}});
 check('5. вслед за ударом героя питомец ходит, как прежде, и в ближние две секунды свой черёд не повторяет',г.послеУдара===1&&г.заПолторы===0&&г.zvLast,г);

 /* ── 6. голодный не дерётся ── */
 const х=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const a=Zver.pets()[0];a.сыт=5;const cb=__бой(400);const foe0=cb.hp;await sl(3600);
  const o={урон:foe0-(G.combat?G.combat.hp:foe0)};safeFn(()=>endCombat());a.сыт=90;return o;});
 check('6. голодный питомец своим чередом не бьётся',х.урон===0,х);

 /* ── 7. в пути лекарь подлечивает раненого хозяина; вслух — не на каждый раз ── */
 const п=await page.evaluate(()=>{G.hp=150;__said.length=0;const hp0=G.hp;for(let i=0;i<24;i++)ЗвБой155.путь();
  const o={лечение:G.hp-hp0,слова:__said.map(([t])=>t).filter(t=>/лечит|залечил/.test(t))};
  G.hp=G.hpMax-1;ЗвБой155.шаг=7;ЗвБой155.путь();o.полное=G.hp===G.hpMax;o.слова2=__said.map(([t])=>t).filter(t=>/залечил/.test(t));return o;});
 check('7. в пути феникс раз в восемь шагов подлечивает раненого; вслух — первое лечение и полное здоровье, а не каждый раз',
  п.лечение>0&&п.слова.length===1&&/лечит вас в пути/.test(п.слова[0])&&п.полное&&п.слова2.length===1,п);

 /* ── 8–9. окна «Питомцы» и «Маунты»: фоновые фразы ждут закрытия окна ── */
 const о=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={};
  for(const [k,open] of [["питомцы",()=>Stable.petsHome()],["маунты",()=>Stable.mountsHome()]]){
   __закрыть();open();__said.length=0;
   narrate("Проверка: Феникс что-то учуял и приносит камень.",{interrupt:false,pri:2});
   narrate("Проверка: пока вас не было, питомцы ходили на задания.",{interrupt:false});
   narrate("Здоровье на исходе!",{interrupt:false});
   narrate("Пункт окна.",{interrupt:true,nav:true});
   const при=__said.map(([t])=>t);__закрыть();await sl(1700);
   o[k]={приОткрытом:при,послеЗакрытия:__said.map(([t])=>t).slice(при.length)};}
  return o;});
 const ок=x=>x.приОткрытом.length===2&&x.приОткрытом.includes("Здоровье на исходе!")&&x.приОткрытом.includes("Пункт окна.")&&
  x.послеЗакрытия.some(t=>/учуял/.test(t)&&/ходили на задания/.test(t));
 check('8. в окне «Питомцы» фоновые фразы игры не перебивают чтение окна: ждут закрытия и звучат после; важное и пункты окна — сразу',ок(о.питомцы),о.питомцы);
 check('9. в окне «Маунты» — так же',ок(о.маунты),о.маунты);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
