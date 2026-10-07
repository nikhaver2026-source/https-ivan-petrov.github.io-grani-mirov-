/* Недуги: яды, проклятия, стужа, жар и прочее, что остаётся после боя.
   Жалоба игрока: «не работают системы ядов и различных умений у монстров и
   боссов — игрок убивает монстра без последствий; последствия должны быть
   от проклятий, ядов, заморозки, жара, холода, и игрок должен уметь всё это
   нейтрализовать». Набор проверяет:
   — у каждого рода тварей свои недуги, у иных тварей по имени — свои;
     сильная тварь даёт ступень выше; защита заранее работает;
   — недуг бьёт по часам мира и в бою за ход, вне боя насмерть не убивает,
     проходит в срок, а стойкое проклятие само не проходит;
   — проклятие, стужа ослабляют удар; страх, слепота и оглушение срывают его;
   — в настоящем бою паук травит, и яд звучит в сводке хода;
   — снимают: новые и прежние зелья, травы, вода, огонь, светлые чары,
     лекарь в городе, молитва, отдых; окно «Недуги» и пункт меню. */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};G.hv=null;G.poisoned=null;G.buffs={};});

 /* ── 1. недуги по родам и именам ── */
 const роды=await p.evaluate(()=>{const r={};const rnd=Math.random;Math.random=()=>0.0;
  const mk=(id,extra)=>Object.assign({},MONSTERS.find(q=>q.id===id)||{id,n:id},{lvl:G.level},extra||{});
  try{
   const test=(id,extra)=>{G.hv=null;G.poisoned=null;G.buffs={};Hv.onHit(mk(id,extra),5);return Hv.list().map(x=>x[0]).sort().join(",");};
   r.волк=test("wolf");r.паук=test("spider");r.дракон=test("dragon");r.призрак=test("wraith");r.василиск=test("basilisk");
   G.hv=null;Hv.onHit(mk("spider",{lvl:G.level+7}),5);r.ступеньСильной=Hv.stage("poison");
   G.hv=null;Hv.onHit(mk("spider"),5);Hv.onHit(mk("spider"),5);r.ступеньПовтора=Hv.stage("poison");
   G.hv=null;G.buffs={};buffSet("тепло",4);Hv.onHit({id:"x",n:"Ледяной великан",lvl:G.level},5);r.теплоЗащищает=!Hv.has("frost");
  }finally{Math.random=rnd;}
  r.родов=Object.keys(HV_FAMILY).length;r.недугов=Object.keys(HV_DEFS).length;
  /* стойкость вдвое снижает шанс */
  G.hv=null;G.poisoned=null;G.buffs={};Math.random=()=>0.2;try{buffSet("стойкость",4);Hv.onHit(mk("spider"),5);r.стойкость=!Hv.has("poison");}finally{Math.random=rnd;}
  return r;});
 check('1. у каждого рода свои недуги: волк — кровь, паук — яд, дракон — ожог, призрак — страх, василиск — камень; двенадцать недугов',
  /bleed/.test(роды.волк)&&/poison/.test(роды.паук)&&/burn/.test(роды.дракон)&&/fear/.test(роды.призрак)&&/stone/.test(роды.василиск)&&роды.недугов===12&&роды.родов===12,роды);
 check('1б. сильная тварь — третья ступень, повтор поднимает ступень; зелье тепла не пускает стужу, стойкость вдвое снижает шанс',
  роды.ступеньСильной===3&&роды.ступеньПовтора===2&&роды.теплоЗащищает&&роды.стойкость,роды);

 /* ── 2. урон по часам и в бою ── */
 const время=await p.evaluate(()=>{const r={};G.hv=null;G.poisoned=null;G.buffs={};G.hp=G.hpMax;const s=Hv.st();s.t=Hv.now();
  Hv.add("poison",2,"проба");const h0=G.hp;G.hour+=2;Hv.tick();r.ядЗаДваЧаса=h0-G.hp;
  G.hp=3;s.t=Hv.now();G.hour+=3;Hv.tick();r.неУбивает=G.hp>=1;
  G.hour+=10;r.ядПрошёл=!Hv.has("poison")&&!G.poisoned;
  Hv.add("curse",2,"проба");G.hour+=40;r.проклятиеДержится=Hv.has("curse");
  G.hp=G.hpMax;Hv.add("bleed",2);const h1=G.hp;r.ход=Hv.combatTurn();r.урон=h1-G.hp;
  return r;});
 check('2. яд второй ступени бьёт по часам (−8 за два часа), вне боя насмерть не убивает, проходит в срок; стойкое проклятие само не проходит',
  время.ядЗаДваЧаса===8&&время.неУбивает&&время.ядПрошёл&&время.проклятиеДержится,время);
 check('2б. в бою кровь берёт своё каждый ход, и это звучит в сводке',время.урон===2&&/кровотечение −2/.test(время.ход),время);

 /* ── 3. удар героя ── */
 const удар=await p.evaluate(()=>{const r={};G.hv=null;G.buffs={};r.чисто=heroBuffK("удар");
  Hv.add("curse",2);r.проклят=heroBuffK("удар");G.hv=null;Hv.add("frost",1);r.стужа=heroBuffK("удар");
  G.hv=null;Hv.add("stun",1);r.оглушён=heroBuffK("удар");r.срыв=Hv.takeSlip();r.оглушениеПрошло=!Hv.has("stun");
  G.hv=null;Hv.add("fear",3);const rnd=Math.random;Math.random=()=>0.01;try{r.страх=heroBuffK("удар");r.срывСтраха=Hv.takeSlip();}finally{Math.random=rnd;}
  G.hv=null;return r;});
 check('3. проклятие и стужа ослабляют удар; оглушение и страх срывают его, и это сказано',
  удар.проклят<удар.чисто*0.75&&удар.стужа<удар.чисто&&удар.оглушён===0&&/Оглушение/.test(удар.срыв)&&удар.оглушениеПрошло&&удар.страх===0&&/Страх/.test(удар.срывСтраха),удар);

 /* ── 4. настоящий бой ── */
 const бой=await p.evaluate(()=>{const r={};G.hv=null;G.poisoned=null;G.buffs={};G.place=null;G.hp=G.hpMax;
  const m=Object.assign({},MONSTERS.find(q=>q.id==="spider"),{lvl:G.level,hp:500,dmg:4});startCombat({x:G.x,y:G.y,monster:m});
  const rnd=Math.random;Math.random=()=>0.001;try{foeStrike({kind:"melee"});}finally{Math.random=rnd;}
  r.отравлен=Hv.has("poison");G.combat.hp=500;fight("atk");r.журнал=cbLog2text();endCombat();G.hv=null;G.poisoned=null;return r;});
 check('4. в настоящем бою паук травит, и яд звучит в сводке хода',бой.отравлен&&/яд −/.test(бой.журнал),бой);

 /* ── 5. снятие ── */
 const снятие=await p.evaluate(()=>{const r={};const pots=potionsOf();
  r.вЛавке=HV_POTIONS.every(x=>SHOP_POTIONS.some(s=>s.id===x.id)&&POTION_BY_ID[x.id]);
  G.hv=null;G.buffs={};Hv.add("frost",2);pots.push({id:"warm",q:1,стаб:1,день:G.day,срок:30});drinkPotion(pots.length-1);r.согрелся=!Hv.has("frost")&&buffActive("тепло");
  Hv.add("poison",1);pots.push({id:"antidote",q:1,стаб:1,день:G.day,срок:30});drinkPotion(pots.length-1);r.противоядие=!Hv.has("poison");
  Hv.add("curse",2);pots.push({id:"holy",q:1,стаб:1,день:G.day,срок:30});drinkPotion(pots.length-1);r.святаяВода=!Hv.has("curse");
  G.inv=G.inv||{};G.inv["трава"]=3;Hv.add("bleed",2);Hv.act("herb");r.травы=!Hv.has("bleed");
  G.water=50;Hv.add("burn",1);Hv.act("water");r.вода=!Hv.has("burn");
  G.place={kind:"city",bx:G.x,by:G.y,stype:"village",name:"Тест",depth:0,x:1,y:1};
  Hv.add("weak",1);Hv.act("fire");r.огонь=!Hv.has("weak");
  G.gold=1000;Hv.add("disease",2);Hv.add("stone",1);const g0=G.gold;Hv.act("healer");r.лекарь=!Hv.has("disease")&&!Hv.has("stone")&&G.gold<g0;
  G.place=null;G.spells=(G.spells||[]).concat(["Свет исцеления"]);G.mana=50;Hv.add("disease",1);Hv.act("light");r.чары=!Hv.has("disease");
  Hv.add("fear",1);r.молитва=Hv.onPray("zarya").length>0&&!Hv.has("fear");
  Hv.add("mana",1);Survival.rest();r.отдых=!Hv.has("mana");
  return r;});
 check('5. шесть новых зелий в лавках; согревающее снимает стужу и греет, прежнее противоядие — яд, святая вода — проклятие',
  снятие.вЛавке&&снятие.согрелся&&снятие.противоядие&&снятие.святаяВода,снятие);
 check('5б. травы снимают кровь, вода — ожог, огонь — истощение, лекарь — всё за золото, светлые чары — лихорадку, молитва — страх, отдых — порчу маны',
  снятие.травы&&снятие.вода&&снятие.огонь&&снятие.лекарь&&снятие.чары&&снятие.молитва&&снятие.отдых,снятие);

 /* ── 6. окно ── */
 const окно=await p.evaluate(()=>{const r={};G.hv=null;Hv.add("poison",2,"паук");G.inv["трава"]=2;
  CMD.hvhome();const b=document.getElementById("hvBody");r.текст=b.textContent.slice(0,200);r.кнопок=b.querySelectorAll("button").length;
  r.меню=AM_ITEMS.some(x=>x[0]==="hvhome");while(activeLayer())closeTopUI();G.hv=null;G.poisoned=null;return r;});
 check('6. окно «Недуги» называет недуг, ступень, урон и чем снять; пункт меню на месте',/яд, ступень 2/.test(окно.текст)&&окно.кнопок>=1&&окно.меню,окно);

 check('7. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
