/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 293: 14.5 — ЗВУК ХРОНИКИ И РЕЖИССЁР С ПРОВЕРКОЙ
   (ФАЗЫ VIII–IX «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Мастер-промпт, VIII: индивидуальные звуковые профили, городской
   звуковой ландшафт; IX: «интегрировать динамическую генерацию событий и
   контента с проверкой непротиворечивости и ограничениями симуляции».
    1. Все звуки фаз III–VIII — настоящие записи банка, не синтез.
    2. Фон живого города меняется с его состоянием: ночная крепость
       Сар-Дорна, гул башни и сквозняк руин Вальтерна, вода под сваями
       Лиорена, притон Виррена, посад Ульма.
    3. Легендарная вещь звучит своим голосом; новый сюжет — колоколом.
    4. Годное новое Режиссёра проходит проверку и встаёт в мир; все
       тридцать родов нового, что он рождает, проходят её без ложных
       отказов (поручения, вещи из кожи, союзы — тоже).
    5. Негодное отзывается — из мира Режиссёра и из таблиц игры — с
       причиной в хронике: чужие ниши трав, несложимые чары, тварь не из
       бестиария, земля, которой нет (и всё, что на неё ссылалось).
    6. Пределы: у рода нового — свой предел в мире, за день — не больше
       шести новинок; дойдя до предела, Режиссёр ждёт.
    7. При загрузке сохранения проверяется всё придуманное прежде.
    8. Окно Режиссёра называет проверку и пределы; глава руководства;
       ошибок страницы нет.
    9. Поражение — не дальний путь: перенос павшего героя к столице не
       засчитывается шагами поручения Режиссёра «Дальний путь» (раньше
       поражение платило его наградой); настоящий путь после — засчитывается.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const pb=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return pb(r,o);};
  window.З={выйти(){while(G.place)leavePlace();while(activeLayer())closeTopUI();},
   войти(id){З.выйти();const c=NAMED_CITIES.find(z=>z.id===id);G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();}};});

 /* ── 1–3. звук ── */
 const зв=await p.evaluate(()=>{const r={};const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const роли=HronSound.roles();r.ролей=роли.length;
  r.нет=роли.filter(x=>!SOUND_BANK[x]||!Array.isArray(SOUND_BANK[x].f)||!SOUND_BANK[x].f.length);
  r.синтез=роли.filter(x=>SOUND_BANK[x]&&(SOUND_BANK[x].f||[]).some(f=>СИНТЕЗ.test(String(f))));
  /* фон живых городов */
  G.lc={};G.hour=23;З.войти("sardorn");r.сардорнНочь=bankAmbientRole();G.hour=12;r.сардорнДень=bankAmbientRole();
  З.войти("valtern");const s=LiveCity.st().ядро;s.з=90;s.д=Number(G.day);r.ядроГорит=bankAmbientRole();s.з=10;r.ядроГаснет=bankAmbientRole();
  З.войти("lioren");Weather.cur="Ливень";r.ливень=bankAmbientRole();Weather.cur="Ясно";r.сухо=bankAmbientRole();
  G.hour=23;З.войти("virren");r.виррен=bankAmbientRole();G.hour=12;З.выйти();
  const q=LiveCity.ulmAt();G.x=q.x;G.y=q.y;enterPlace(cellContent(q.x,q.y));while(activeLayer())closeTopUI();r.ульм=bankAmbientRole();З.выйти();
  /* голос легендарной вещи и колокол нового сюжета */
  G.mag={};Magia.grant("talker","проба");const a=MAT_ISLES.find(x=>x.id==="zatonuv");const i0=matIslands(a)[0];G.x=i0.x;G.y=i0.y;G.mana=100;PLAYED.length=0;
  Magia.use("talker");r.голосВещи=PLAYED.includes("gr_mech");
  G.tales={};PLAYED.length=0;const C=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.crisis(k));const c=EMPIRES[C].cap;G.x=c.x;G.y=c.y;const d=Number(G.day);
  Throne.openCrisis(C,d,[{n:"Звонкая Проба",ж:1,b:d-30*360,l:1,г:0,t:1},{n:"Гулкий Проба",ж:0,b:d-25*360,l:1,г:0,t:2}],"проба");
  for(const w of warsAt(d))Tales.st().seen["война:"+Math.min(w.a,w.b)+":"+Math.max(w.a,w.b)]=d;
  const T=Tales.find();r.колокол=!!T&&PLAYED.includes("bell_small");return r;});
 check('1. все звуки фаз III–VIII — настоящие записи банка, не синтез',зв.ролей>=60&&зв.нет.length===0&&зв.синтез.length===0,зв);
 check('2. фон живого города меняется с его состоянием',
  зв.сардорнНочь==="bed_fortress"&&зв.сардорнДень!=="bed_fortress"&&зв.ядроГорит==="bed_tower"&&зв.ядроГаснет==="bed_ruins"
  &&зв.ливень==="bed_port"&&зв.сухо==="bed_market"&&зв.виррен==="bed_smugglers"&&зв.ульм==="bed_burg",зв);
 check('3. легендарная вещь звучит своим голосом; новый сюжет мира — малым колоколом',зв.голосВещи&&зв.колокол,зв);

 /* ── 4–6. проверка и пределы ── */
 const пр=await p.evaluate(()=>{const r={};G.dchk={};const g=Neuro.gen();
  /* годное */
  const ок0=DirCheck.st().ок;const до=g.potions.length;const t=Neuro.forge("potion");r.годное=!!t&&g.potions.length===до+1&&DirCheck.st().ок>ок0&&!!POTION_BY_ID[g.potions[g.potions.length-1].id];
  /* негодное зелье не встаёт в таблицу варки */
  const плохое={id:"gp_проба",n:"Проба негодного зелья",из:["нет_такой","и_такой"],эф:[["hp",1]],срок:10,стаб:0.7};
  Neuro.regPotion(плохое);r.зельеНеВстало=!POTION_BY_ID.gp_проба;
  g.potions.push(плохое);const n1=DirCheck.audit();r.зельеОтозвано=n1>=1&&!g.potions.includes(плохое)&&DirCheck.st().отказ.some(x=>x.n==="Проба негодного зелья"&&/ниши трав/.test(x.why));
  r.хроника=(g.chron||[]).some(x=>/Режиссёр отозвал «Проба негодного зелья»/.test(String(x)));
  /* несложимые чары: и из мира Режиссёра, и из списка чар */
  let bad=null;outer:for(const sc of SCHOOLS)for(const f of SPELL_FORMS){if(safeFn(()=>spellIncompat(sc.id,f.id,"none"),"")){bad={school:sc.id,форма:f.id};break outer;}}
  const рец={id:"gs_проба",n:"Проба несложимых чар",custom:true,school:bad.school,форма:bad.форма,усиление:"none"};SPELLS.push(рец);
  g.spells.push({id:"gs_проба",n:"Проба несложимых чар",rec:рец});DirCheck.audit();r.чарыОтозваны=!g.spells.some(x=>x.id==="gs_проба")&&!SPELLS.includes(рец);
  /* тварь не из бестиария; земля, которой нет, — и всё, что на неё ссылалось */
  g.beasts.push({id:"gb_проба",n:"Проба выдуманной твари",base:"нет_такой",земля:null,k:1});
  const земля={id:"gl_проба",n:"Проба дальних земель",terr:"forest",x:-5,y:10,r:3,fam:"bird",опасность:2};g.lands.push(земля);
  g.beasts.push({id:"gb_проба2",n:"Проба твари с той земли",base:MONSTERS[0].id,земля:"gl_проба",k:1});
  g.peoples.push({id:"gn_проба",n:"Проба народа с той земли",земля:"gl_проба",ethos:"проба"});
  DirCheck.audit();r.тварьОтозвана=!g.beasts.some(x=>x.id==="gb_проба");r.земляОтозвана=!g.lands.includes(земля);
  r.каскад=!g.beasts.some(x=>x.id==="gb_проба2")&&!g.peoples.some(x=>x.id==="gn_проба");
  /* пределы рода и дня */
  const пред0=DirCheck.st().пред;const lim=DCHK_LIMIT.potions;DCHK_LIMIT.potions=g.potions.length;r.пределРода=Neuro.forge("potion")===""&&DirCheck.st().пред===пред0+1;DCHK_LIMIT.potions=lim;
  DirCheck.st().день=Number(G.day);DirCheck.st().сегодня=DCHK_DAY;r.пределДня=Neuro.forge("beast")===""&&DirCheck.st().пред===пред0+2;
  G.day=Number(G.day)+1;r.назавтра=!!Neuro.forge("weapon");
  return r;});
 check('4. годное новое Режиссёра проходит проверку и встаёт в мир',пр.годное,пр);
 const все=await p.evaluate(()=>{const r={отказы:{},ок:0};const d0=G.day,x0=G.x,y0=G.y,l0=G.level;
  for(let run=0;run<3;run++){G.gen={};G.dchk={};G.level=10+run*5;G.x=300+run*9000;G.y=300+run*7000;G.day=1+run*50;
   const n=()=>{const s=DirCheck.st();s.день=Number(G.day);s.сегодня=0;};["people","land","clan"].forEach(a=>{n();Neuro.forge(a);});
   for(let k=0;k<2;k++)for(const a of NEURO_ARMS){n();const o=DirCheck.st().отказ.length;if(safeFn(()=>Neuro.forge(a),""))r.ок++;
    for(const x of DirCheck.st().отказ.slice(o))r.отказы[a+": "+x.why]=(r.отказы[a+": "+x.why]||0)+1;}}
  /* вещь из ресурса, которого нет среди основных припасов, но который знает мир (зеркальный осколок тёмных земель) — годна,
     а из выдуманного — нет: так отзывались вещи из сохранений 12.5–14.0 */
  r.осколок=DirCheck.why("arts",{id:"ga_old",n:"Оправа без рамы Проба",цена:120,нужно:{"зеркальный осколок":4,"самоцвет":2}},G.gen)==="";
  r.выдумка=DirCheck.why("arts",{id:"ga_bad",n:"Оправа из ничего",цена:120,нужно:{"нет_такого_ресурса":4}},G.gen)!=="";
  G.day=d0;G.x=x0;G.y=y0;G.level=l0;return r;});
 check('4б. все роды нового, что рождает Режиссёр, проходят проверку: ложных отказов нет (и у вещей из любого ресурса мира)',!Object.keys(все.отказы).length&&все.ок>=150&&все.осколок&&все.выдумка,все);
 check('5а. зелье из чужих ниш не встаёт в таблицу варки и отзывается с причиной в хронике',пр.зельеНеВстало&&пр.зельеОтозвано&&пр.хроника,пр);
 check('5б. несложимые чары отзываются и из мира Режиссёра, и из списка чар',пр.чарыОтозваны,пр);
 check('5в. тварь не из бестиария и земля за пределами мира отзываются, а с землёй — всё, что на неё ссылалось',пр.тварьОтозвана&&пр.земляОтозвана&&пр.каскад,пр);
 check('6. у рода нового — свой предел, за день — не больше шести новинок; назавтра Режиссёр снова придумывает',пр.пределРода&&пр.пределДня&&пр.назавтра,пр);

 /* ── 7–8. загрузка, окно, руководство ── */
 const зг=await p.evaluate(()=>{const r={};const g=Neuro.gen();(g.places=g.places||[]).push({id:"gc_проба",kind:"город",n:"Проба города за краем",x:WORLD_MAX+10,y:5,r:2,народ:null});
  saveGame(true);G.gen={};loadGame();r.отозванПриЗагрузке=!Neuro.gen().places.some(x=>x.id==="gc_проба");
  Neuro.view();const тело=document.body.innerText||"";r.окно=/Проверка Режиссёра: принято \d+, отозвано \d+/.test(тело)&&/Пределы мира:/.test(тело);while(activeLayer())closeTopUI();
  const гл=guideSec(/Режиссёр Грани/);r.глава=!!гл&&гл.body.some(t=>/ПРОВЕРКА И ПРЕДЕЛЫ/.test(t));
  const гл2=guideSec(/Живые города/);r.главаЗвук=!!гл2&&гл2.body.some(t=>/ФОН ГОРОДА/.test(t));return r;});
 check('7. при загрузке сохранения негодное придуманное прежде отзывается',зг.отозванПриЗагрузке,зг);
 check('8а. окно Режиссёра называет, сколько принято и отозвано, и пределы мира',зг.окно,зг);
 check('8б. руководство: проверка и пределы Режиссёра, фон живых городов',зг.глава&&зг.главаЗвук,зг);
 /* ── 9. поражение — не дальний путь ── */
 const пж=await p.evaluate(()=>{const r={};while(G.place)leavePlace();const s2=Director.st2();
  const c=NAMED_CITIES.find(z=>{const e=empireAt(z.x,z.y);return Math.abs(e.cap.x-z.x)+Math.abs(e.cap.y-z.y)>200;});
  G.x=c.x+3;G.y=c.y;s2.q=s2.q.filter(q=>q.type!=="travel");
  s2.q.push({id:"q293",type:"travel",prog:0,need:60,взят:Number(G.day),до:Number(G.day)+6,x:G.x,y:G.y,n:"Дальний путь: проба",награда:{gold:42}});
  G.gold=80;G.hp=1;G.combat={m:{n:"проверка",hp:0,dmg:0}};defeat();while(activeLayer())closeTopUI();
  r.золото=G.gold;r.поручение=s2.q.some(q=>q.id==="q293");
  G.x+=70;Director.qProgress("travel");r.путь=!s2.q.some(q=>q.id==="q293");return r;});
 check('9. поражение — не дальний путь: перенос к столице не исполняет поручение и не платит; настоящий путь после засчитывается',
  пж.золото<80&&пж.поручение&&пж.путь,пж);
 check('8в. ошибок страницы нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИтого: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
