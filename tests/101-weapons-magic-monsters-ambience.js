/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 101: ОРУЖИЕ, ЯЗЫК ШКОЛ, ПРОФИЛИ ТВАРЕЙ И ЖИВОЕ ОКРУЖЕНИЕ

   1. У семи родов оружия по двенадцать состояний, у лука и копья — ещё
      спуск, полёт, дерево и камень; род оружия читается по имени; материал
      твари решает, чем отвечает удар.
   2. Удар по голему — броня и тяжесть, промах — свист; вынуть и убрать —
      свои состояния.
   3. У каждой школы семь слоёв записями; заклинание идёт по слоям каналом
      чар; базовые заклинания знают свою стихию.
   4. Двенадцать родов тварей на пятнадцать реплик; род читается по имени;
      в бою тварь замечает, кличет, бьёт, стонет, боится, гибнет.
   5. Наборы окружения: не меньше шестнадцати мест; голоса звучат из
      случайной точки вокруг, не повторяясь подряд; дождь и ночь добавляют
      свои; таверна смеётся и звенит кружками, город гремит телегами.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push([String(r),(o&&o.kind)||"fx"]);return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{PLAYED.push([String(r),(o&&o.kind)||"fx"]);return sr(r,dx,dy,Object.assign({},o||{},{gain:0.01,maxSec:0.4}));};
  window.roles=()=>PLAYED.map(x=>x[0]);window.kinds=()=>PLAYED.map(x=>x[1]);});

 /* ── 1. Оружие ── */
 const оружие=await page.evaluate(()=>{
  /* Состояния оружия — то же самое: словарь нужен проверке, не игре. */
  const WEAPON_STATES=["draw","sheathe","swing","hit","block","parry","hit_armor",
   "hit_flesh","hit_bone","miss","drop","clash"];
  const нет=[];
  for(const k in WEAPON_SOUND){const m=WEAPON_SOUND[k];
   WEAPON_STATES.forEach(st=>{const l=m[st]||(st==="swing"&&m.shoot);if(!l||!l.length)нет.push(k+":"+st);else l.forEach(r=>{if(!Bank.has(r))нет.push(k+":"+r);});});}
  const лук=["shoot","fly","hit_wood","hit_stone"].filter(st=>!WEAPON_SOUND.bow[st]);
  const копьё=["shoot","fly"].filter(st=>!WEAPON_SOUND.spear[st]);
  const кл=n=>{G.equip.weapon={name:n,slot:"weapon"};return weaponClass();};
  const классы={топор:кл("Боевой топор"),булава:кл("Булава"),лук:кл("Длинный лук"),кинжал:кл("Кинжал"),посох:кл("Посох"),копьё:кл("Копьё"),меч:кл("Меч")};
  const мат={скелет:foeMaterial({id:"skeleton"}),голем:foeMaterial({id:"golem"}),волк:foeMaterial({id:"wolf"}),страж:foeMaterial({id:"city_guard"})};
  return {родов:Object.keys(WEAPON_SOUND).length,нет,лук,копьё,классы,мат};});
 check('семь родов оружия, у каждого двенадцать состояний записями',оружие.родов>=7&&!оружие.нет.length,оружие.нет.slice(0,8));
 check('лук знает спуск, полёт, дерево и камень; копьё — бросок и полёт',!оружие.лук.length&&!оружие.копьё.length,{лук:оружие.лук,копьё:оружие.копьё});
 check('род оружия читается по имени',
  оружие.классы.топор==="axe"&&оружие.классы.булава==="mace"&&оружие.классы.лук==="bow"&&оружие.классы.кинжал==="dagger"&&оружие.классы.посох==="staff"&&оружие.классы.копьё==="spear"&&оружие.классы.меч==="sword",оружие.классы);
 check('материал твари: скелет — кость, голем и страж — броня, волк — плоть',
  оружие.мат.скелет==="bone"&&оружие.мат.голем==="armor"&&оружие.мат.страж==="armor"&&оружие.мат.волк==="flesh",оружие.мат);

 /* ── 2. Удары ── */
 const удары=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};G.equip.weapon={name:"Меч",slot:"weapon"};
  /* Считается только боевой канал. За эти четверть секунды может доиграть
     хвост музыки открытия земли — «свирель села» и её тёмный рог идут через
     семьсот миллисекунд после самого открытия, — и он не имеет к удару
     никакого отношения. Прежняя проверка ловила его и падала не на том. */
  PLAYED.length=0;r.кость=weaponSound("hit_bone",{cls:"sword"});await пауза(250);
  r.костьРоли=PLAYED.filter(x=>x[1]==="combat").map(x=>x[0]);
  r.костьКанал=PLAYED.filter(x=>x[1]==="combat").map(x=>x[1]);
  r.костьВсё=roles();
  r.нет=weaponSound("такого-нет");
  G.inCombat=true;G.combat={m:{id:"golem",n:"Голем",lvl:3,hp:50},hp:50,key:G.x+","+G.y,alt:0};
  PLAYED.length=0;playWeaponCombatSfx(true,"E",20);await пауза(700);r.голем=roles();
  PLAYED.length=0;playWeaponCombatSfx(false,"E",5);await пауза(400);r.промах=roles();
  G.inCombat=false;G.combat=null;
  G.weaponDrawn=false;PLAYED.length=0;drawWeapon();r.вынуть=G.lastWeaponSound&&G.lastWeaponSound.state;
  sheatheWeapon();r.убрать=G.lastWeaponSound&&G.lastWeaponSound.state;
  while(activeLayer())closeTopUI();
  return r;});
 check('удар по кости звучит костью каналом боя; неизвестное состояние — «нет»',
  удары.кость===true&&удары.костьРоли[0]==="foe_bone_hit"&&удары.костьРоли.length>0
  &&удары.костьКанал.every(k=>k==="combat")&&удары.нет===false,
  {боевые:удары.костьРоли,всё:удары.костьВсё});
 check('тяжёлый удар по голему: замах героя, попадание, броня и тяжесть',
  удары.голем.includes("hero_swing")&&удары.голем.includes("lug_sword")&&удары.голем.includes("metal_hit")&&удары.голем.includes("impact_heavy"),удары.голем);
 check('промах свистит, а не бьёт',удары.промах.includes("lug_whoosh_hit")&&!удары.промах.includes("lug_sword"),удары.промах);
 check('вынуть и убрать оружие — свои состояния модели',удары.вынуть==="draw"&&удары.убрать==="sheathe",{вынуть:удары.вынуть,убрать:удары.убрать});

 /* ── 3. Чары ── */
 const чары=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const ids=SCHOOLS.map(s=>s.id).concat(["ice","lightning"]);
  r.нетШколы=ids.filter(id=>!SCHOOL_AUDIO[id]);
  r.нетСлоя=[];r.нетЗаписи=[];
  for(const id in SCHOOL_AUDIO)SPELL_LAYERS.forEach(l=>{const role=SCHOOL_AUDIO[id][l];if(!role)r.нетСлоя.push(id+":"+l);else if(!Bank.has(role))r.нетЗаписи.push(id+":"+role);});
  r.школ=Object.keys(SCHOOL_AUDIO).length;
  r.искра=spellSchoolGuess({n:"Искра"});r.игла=spellSchoolGuess({n:"Ледяная игла"});r.шар=spellSchoolGuess({n:"Огненный шар"});
  PLAYED.length=0;r.ок=spellAudio({n:"Огненный шар"},{school:"fire"});await пауза(2100);
  const порядок=SPELL_LAYERS.map(l=>SCHOOL_AUDIO.fire[l]);
  /* Считаем только голоса школы: живая картина и окружение звучат сами по себе. */
  const свои=PLAYED.filter(x=>порядок.includes(x[0]));
  r.роли=свои.map(x=>x[0]);r.каналы=свои.map(x=>x[1]);r.слоёв=G.lastSpell.layers.length;r.школа=G.lastSpell.school;
  r.поПорядку=порядок.every((role,i)=>r.роли.indexOf(role)>=0)&&r.роли.indexOf(порядок[0])<r.роли.indexOf(порядок[4]);
  /* Настоящий каст базового заклинания. */
  G.mana=99;G.spells=G.spells||[];if(!G.spells.includes("Искра"))G.spells.push("Искра");
  PLAYED.length=0;castSpell(SPELLS.findIndex(s=>s.n==="Искра"));await пауза(2100);
  const кастРоли=SPELL_LAYERS.map(l=>(SCHOOL_AUDIO[G.lastSpell.school]||SCHOOL_AUDIO.generic)[l]||SCHOOL_AUDIO.generic[l]);
  const кастСвои=PLAYED.filter(x=>кастРоли.includes(x[0]));
  r.каст=кастСвои.map(x=>x[0]);r.кастКаналы=кастСвои.map(x=>x[1]);r.кастШкола=G.lastSpell.school;
  return r;});
 check('у всех школ чар, а также льда и молнии, есть свой язык из семи слоёв записями',
  !чары.нетШколы.length&&!чары.нетСлоя.length&&!чары.нетЗаписи.length&&чары.школ>=28,{нетШколы:чары.нетШколы,нетСлоя:чары.нетСлоя.slice(0,5),нетЗаписи:чары.нетЗаписи.slice(0,5),школ:чары.школ});
 check('базовые заклинания знают стихию: искра — молния, игла — лёд, шар — огонь',чары.искра==="lightning"&&чары.игла==="ice"&&чары.шар==="fire",чары);
 check('огненный шар идёт семью слоями по порядку каналом чар',
  чары.ок&&чары.слоёв===7&&чары.школа==="fire"&&чары.поПорядку&&чары.каналы.every(k=>k==="magic"),{роли:чары.роли,каналы:[...new Set(чары.каналы)]});
 check('настоящий каст «Искры» тоже слоями и целиком каналом чар',чары.каст.length>=6&&чары.кастКаналы.filter(k=>k==="magic").length/чары.кастКаналы.length>=0.85,{роли:чары.каст.slice(0,9),каналы:[...new Set(чары.кастКаналы)]});

 /* ── 4. Твари ── */
 const твари=await page.evaluate(async()=>{
  /* Словарь реплик твари. Держать его в файле игры незачем: игра зовёт
     реплики по имени, а полноту профиля проверяет этот набор. */
  const FOE_CUES=["breath","move","step","idle","warcry","attack","hurt","wound",
   "death","aggro","detect","lose","fear","victory","unique"];
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={нет:[]};
  for(const f in MONSTER_PROFILE)FOE_CUES.forEach(c=>{const role=MONSTER_PROFILE[f][c];if(!role)r.нет.push(f+":"+c);else if(!Bank.has(role))r.нет.push(f+":"+role);});
  r.родов=Object.keys(MONSTER_PROFILE).length;r.реплик=FOE_CUES.length;
  r.семьи={wolf:foeFamily({id:"wolf"}),skeleton:foeFamily({id:"skeleton"}),dragon:foeFamily({id:"dragon"}),golem:foeFamily({id:"golem"}),kraken:foeFamily({id:"kraken"}),
   goblin:foeFamily({id:"goblin"}),wraith:foeFamily({id:"wraith"}),ashborn:foeFamily({id:"d_ashborn"}),troll:foeFamily({id:"troll"}),harpy:foeFamily({id:"harpy"}),spider:foeFamily({id:"spider"}),zombie:foeFamily({id:"zombie"})};
  while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
  const m=Object.assign({},MONSTERS.find(x=>x.id==="wolf"),{lvl:1,hp:30,xp:5});
  G.lastFoeCue=null;PLAYED.length=0;
  startCombat({x:G.x,y:G.y,monster:m});
  r.заметил=G.lastFoeCue&&G.lastFoeCue.cue;await пауза(800);r.клич=G.lastFoeCue&&G.lastFoeCue.cue;
  r.семья=G.lastFoeCue&&G.lastFoeCue.family;
  r.атака=foeProfileCue(m,"attack");r.атакаРоль=G.lastFoeCue.role;
  const кан=PLAYED.filter(x=>x[0]===r.атакаРоль).map(x=>x[1]);r.атакаКанал=кан[кан.length-1];
  G.combat.hp=10;playMonsterSound(m);r.пульс=G.lastFoeCue&&G.lastFoeCue.cue;
  G.combat.hp=5;PLAYED.length=0;victory();await пауза(500);r.гибель=G.lastFoeCue&&G.lastFoeCue.cue;
  const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;G.loot=null;while(activeLayer())closeTopUI();
  return r;});
 check('двенадцать родов тварей на пятнадцать реплик, все записями',твари.родов>=12&&твари.реплик===15&&!твари.нет.length,твари.нет.slice(0,8));
 check('род твари читается по имени',
  твари.семьи.wolf==="beast"&&твари.семьи.skeleton==="bone"&&твари.семьи.dragon==="dragon"&&твари.семьи.golem==="construct"&&твари.семьи.kraken==="deep"&&твари.семьи.goblin==="humanoid"&&твари.семьи.wraith==="spirit"&&твари.семьи.ashborn==="fiend"&&твари.семьи.troll==="giant"&&твари.семьи.harpy==="bird"&&твари.семьи.spider==="crawler"&&твари.семьи.zombie==="undead",твари.семьи);
 check('в бою волк замечает, потом кличет; атака — когтем каналом боя; пульс — дыхание, ход или голос; гибель — своя',
  твари.заметил==="detect"&&твари.клич==="warcry"&&твари.семья==="beast"&&твари.атака===true&&твари.атакаРоль==="lug_claw"&&твари.атакаКанал==="combat"&&["breath","move","idle"].includes(твари.пульс)&&твари.гибель==="death",твари);

 /* ── 5. Окружение ── */
 const окр=await page.evaluate(async()=>{
  const r={нет:[]};
  for(const n in AMBIENCE_SET){const st=AMBIENCE_SET[n];[].concat(st.spots,st.rain||[],st.night||[]).forEach(([role])=>{if(!Bank.has(role))r.нет.push(n+":"+role);});}
  r.наборов=Object.keys(AMBIENCE_SET).length;
  r.таверна=AMBIENCE_SET.tavern.spots.map(x=>x[0]);r.город=AMBIENCE_SET.city.spots.map(x=>x[0]);
  const было={place:G.place,w:G.weather};
  G.place={kind:"house",stype:"tavern",depth:0,bx:1,by:1,x:2,y:2};r.вТаверне=ambienceSetFor();
  G.place={kind:"dungeon",stype:"dungeon",depth:3,bx:1,by:1,x:2,y:2};r.вГлубине=ambienceSetFor();
  G.place=null;
  let лес=null;outer:for(let q=1;q<400;q++)for(let dx=-q;dx<=q;dx+=Math.max(1,q))for(let dy=-q;dy<=q;dy+=Math.max(1,q)){
   const x=G.x+dx,y=G.y+dy;if(x<2||y<2||x>=WORLD-2||y>=WORLD-2)continue;if(cellContent(x,y).terrain[0]==="forest"){лес={x,y};break outer;}}
  const бx=G.x,бy=G.y;
  if(лес){G.x=лес.x;G.y=лес.y;}
  r.вЛесу=ambienceSetFor();
  G.weather="Дождь";r.сДождём=Ambience.spots("forest").map(x=>x[0]).includes("oc_rain");G.weather="Ясно";
  settings.effects=1;settings.scape=1;while(activeLayer())closeTopUI();G.inCombat=false;
  Ambience.reset();const ряд=[];
  for(let i=0;i<12;i++){Ambience.next=0;Ambience.set=r.вЛесу;const ok=Ambience.tick();ряд.push(ok?Ambience.lastSpot.role:null);}
  r.ряд=ряд;r.всеЗвучали=ряд.every(Boolean);r.повторов=ряд.filter((v,i)=>i>0&&v===ряд[i-1]).length;
  r.вокруг=Ambience.lastSpot&&(Math.abs(Ambience.lastSpot.dx)+Math.abs(Ambience.lastSpot.dy))>=1.5;
  r.изНабора=ряд.every(x=>Ambience.spots(r.вЛесу).some(([role])=>role===x));
  G.x=бx;G.y=бy;G.place=было.place;G.weather=было.w;
  r.лавка=Bank.has(SCAPE_VOICE.shop.role);
  return r;});
 check('наборов окружения не меньше шестнадцати, все голоса записями',окр.наборов>=16&&!окр.нет.length,{наборов:окр.наборов,нет:окр.нет.slice(0,8)});
 check('таверна смеётся и звенит кружками, город гремит телегами и кричит стражей',
  окр.таверна.includes("oc_laugh")&&окр.таверна.includes("oc_glass_hit")&&окр.город.includes("mtg_cart")&&окр.город.includes("guard_shout"),{таверна:окр.таверна.slice(0,6),город:окр.город.slice(0,6)});
 check('набор выбирается по месту: таверна, глубина, лес',окр.вТаверне==="tavern"&&окр.вГлубине==="dungeon"&&окр.вЛесу==="forest",окр);
 check('дождь добавляет лесу свои голоса',окр.сДождём===true);
 check('двенадцать тактов окружения: все звучат, из своего набора, вокруг игрока и без повтора подряд',
  окр.всеЗвучали&&окр.изНабора&&окр.вокруг&&окр.повторов===0,{ряд:окр.ряд,повторов:окр.повторов});
 check('голос лавки в живой картине — существующая запись',окр.лавка);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const passed=results.filter(r=>r.startsWith('PASS')).length;
 console.log(`ИТОГО: ${passed} из ${results.length}`);
 process.exit(passed===results.length?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
