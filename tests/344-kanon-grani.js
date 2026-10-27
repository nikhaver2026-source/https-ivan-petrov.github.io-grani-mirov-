/* ════════════════════════════════════════════════════════════════════════
   НАБОР 344: ПРЕДАНИЯ ГРАНИ (КАНОН, 18.0)

   Просьба игрока: «встроить глубоко в Грань Миров, чтобы всё взаимодействовало и
   не конфликтовало с текущими механиками; проверить старые дублирующие и мёртвые
   обработчики; качественные звуки для всего нового».
   1. Магия: шестьдесят школ, двадцать форм, двести сорок специализаций, сто восемьдесят
      чар академии; все чары канона совместимы и есть в общем списке; каждая новая форма
      творится в бою без ошибок.
   2. Твари канона: восемьдесят восемь; в мире изредка встречаются; повадки ложатся на
      сам бой (засада — на новый бой, а не на прошлый: Undead.onStart зовётся раньше G.combat).
   3. Баффы канона действуют: заслон мыслей не пускает страх, след сбивает погоню,
      укрытие уводит тварей, засов отнимает у твари ход, отражение возвращает порчу.
   4. Звери канона: шестьдесят восемь родов со своей породой; наборы звуков по ролям и
      главный голос с высотой не повторяют ни одного рода; все записи на месте и
      выровнены; у каждой способности свой звук; встреча и приручение; зверинец; дары по месту.
   5. Вещи канона: восемьдесят три артефакта; дело в описании; заряды гасят удар;
      сильная вещь не слушается новичка; чары своей школы сильнее.
   6. Края: семнадцать; Режиссёр открывает край; в поселении — люди, умения, чары,
      вещи, дела, здания, бог; у каждого умения и каждой чары наставника есть учитель.
   7. Глава руководства 141 о преданиях Грани.
   8. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  G.place=null;G.ship=null;G.inCombat=false;G.level=30;G.gold=99999;G.mana=999;G.manaMax=999;
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  window.ФАЙЛЫ=k=>String(k).indexOf("/")>=0?[k]:((SOUND_BANK[k]&&SOUND_BANK[k].f)||[]);
  window.СКАЗАНО=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0.apply(this,arguments);};
  window.БОЙ=(m)=>{startCombat({x:G.x,y:G.y,monster:Object.assign({lvl:5,hp:400,dmg:4,xp:5,gold:5},m)},{});return G.combat;};});

 /* ── 1. Магия ── */
 const м=await p.evaluate(async()=>{const o={школ:SCHOOLS.length,форм:SPELL_FORMS.length,спец:SPELL_SPECS.length,чарАкадемии:SCHOOL_SPELLS.length};
  o.несовм=Object.values(КАНОН_ЧАРЫ).filter(s=>spellIncompat(s.school,s.форма,"none",s.ядро,s.стихия)).map(s=>s.n);
  o.нетВСписке=Object.values(КАНОН_ЧАРЫ).filter(s=>!SPELLS.some(x=>x.n===s.n)).map(s=>s.n);
  o.формы={};for(const fm of ["echoform","thread","ring","trail","knot","loop","whisper","vow"]){const sp=Object.values(КАНОН_ЧАРЫ).find(s=>s.форма===fm);
   if(!sp){o.формы[fm]="нет";continue;}try{БОЙ({id:"wolf",n:"Волк"});const t=castCustomEffect(sp);o.формы[fm]=!!t&&String(t).length>10;await спим(300);if(G.inCombat)endCombat();}catch(e){o.формы[fm]="ошибка "+e;}}
  return o;});
 check('1. шестьдесят школ, двадцать форм, двести сорок специализаций, сто восемьдесят чар академии; чары канона совместимы и в списке; каждая форма творится',
  м.школ===60&&м.форм===20&&м.спец===240&&м.чарАкадемии===180&&!м.несовм.length&&!м.нетВСписке.length&&Object.values(м.формы).every(v=>v===true),м);

 /* ── 2. Твари канона ── */
 const т=await p.evaluate(async()=>{const o={всего:(KN.creatures||[]).filter(c=>!c.канон2).length};  /* (Альфа 1.5) канон II считает набор 346 */let встреч=0;
  for(let i=0;i<600;i++){const x=G.x+i*7,y=G.y+i*3;const c=cellContent(x,y);const m=safeFn(()=>beastAt(x,y,c,1),null);if(m&&m.кн)встреч++;}o.встречКанона=встреч;
  const мз=КАНОН_ТВАРИ.find(m=>КанонТвари.есть(m,"засада"));G.buffs={};
  const cb=БОЙ(Object.assign({},мз));o.засадаНаЭтомБою=cb.кнЗасада===1;await спим(2200);o.повадки=СКАЗАНО.some(t=>t.indexOf(мз.n)>=0&&/Повадки|засад/.test(t));if(G.inCombat)endCombat();
  return o;});
 check('2. восемьдесят восемь тварей канона; в мире встречаются; засада ложится на новый бой, повадки названы',
  т.всего===88&&т.встречКанона>0&&т.засадаНаЭтомБою&&т.повадки,т);

 /* ── 3. Баффы канона ── */
 const б=await p.evaluate(async()=>{const o={};G.buffs={};
  buffSet("кн_разум",4);buffSet("страх",3);o.страхНеВзят=!buffActive("страх");G.buffs={};
  o.бегство=[Morpho.fleeK({id:"wolf"})];buffSet("кн_след",4);o.бегство.push(Morpho.fleeK({id:"wolf"}));G.buffs={};
  let n0=0,n1=0;for(let i=0;i<200;i++){if(beastAt(G.x+i,G.y,cellContent(G.x+i,G.y),1))n0++;}buffSet("кн_убежище",4);
  for(let i=0;i<200;i++){if(beastAt(G.x+i,G.y,cellContent(G.x+i,G.y),1))n1++;}G.buffs={};o.встреч=[n0,n1];
  buffSet("кн_засов",4);const cb=БОЙ({id:"wolf",n:"Волк"});o.засов=cb.путы>=1;if(G.inCombat)endCombat();
  БОЙ({id:"wolf",n:"Волк"});buffSet("кн_отражение",4);const hp0=G.combat.hp;buffSet("проклятие",3);o.отражение=!buffActive("проклятие")&&G.combat.hp<hp0;if(G.inCombat)endCombat();
  return o;});
 check('3. баффы канона действуют: страх, погоня, укрытие, засов, отражение',
  б.страхНеВзят&&б.бегство[1]>б.бегство[0]&&б.встреч[1]<б.встреч[0]*0.5&&б.засов&&б.отражение,б);

 /* ── 4. Звери канона ── */
 const з=await p.evaluate(async()=>{const o={зверей:КАНОН_ЗВЕРИ.length};o.родов=КАНОН_ЗВЕРИ.filter(x=>ZV_FAMILY_BY_ID[x.id]&&ZV_BREED_BY_ID[x.id]&&КАНОН_ЗВ_СНД[x.id]&&ZV_ABIL150[x.id]&&ZV_ABIL150[x.id].length===3).length;
  const роды=ZV_FAMILIES.map(f=>f.id).concat(КАНОН_ЗВЕРИ.map(x=>x.id));const П=id=>ZV_SND[id]||КАНОН_ЗВ_СНД[id];const повт=[],нет=[],безГр=[];
  for(const r of ["г","р","у","ш","е","бег"]){const мм={};for(const id of роды){const P=П(id);if(!P||!Array.isArray(P[r]))continue;const k=[...P[r]].sort().join("+");(мм[k]=мм[k]||[]).push(id);
    for(const s of P[r]){if(String(s).indexOf("/")<0&&!Bank.has(s))нет.push(id+":"+s);for(const f of ФАЙЛЫ(s))if(!(Number(ZV_LEVEL[f])>0))безГр.push(f);}}
   for(const v of Object.values(мм))if(v.length>1)повт.push(r+":"+v.join(","));}
  const sig={};for(const id of роды){const P=П(id);const k=P.г[0]+"@"+P.п;(sig[k]=sig[k]||[]).push(id);}
  o.повторНабора=повт.slice(0,4);o.повторГолоса=Object.values(sig).filter(v=>v.length>1).slice(0,4);o.нетЗвука=нет.slice(0,4);o.безГромкости=[...new Set(безГр)].slice(0,4);
  const ab={};for(const id of роды)for(const a of (ZV_ABIL150[id]||[])){const k=JSON.stringify(a.зв);(ab[k]=ab[k]||[]).push(a.n);}o.повторСпособности=Object.values(ab).filter(v=>v.length>1).slice(0,3);
  o.облик=ZvSnd.prof({fam:КАНОН_ЗВЕРИ[0].id})===КАНОН_ЗВ_СНД[КАНОН_ЗВЕРИ[0].id];
  /* встреча и приручение */
  const s=Zver.st();s.list=[];s.pets=[];s.mount=null;s.tame=null;Канон.ст().встречаЗверя=0;const cc=cellContent;cellContent=(x,y)=>Object.assign({},cc(x,y),{terrain:["forest"]});
  const r0=Math.random;Math.random=()=>0.001;КанонЗвери.шаг(true);Math.random=r0;cellContent=cc;o.встреча=!!(s.tame&&КАНОН_ЗВЕРЬ[s.tame.breed]);
  /* зверинец */
  const ss=Zver.shopSeed;let есть=false;for(let i=0;i<60&&!есть;i++){Zver.shopSeed=()=>[1000+i*37,2000+i*11];есть=Zver.shop().some(b=>b.кн);}Zver.shopSeed=ss;o.зверинец=есть;
  /* дары по месту: волк Подлеска в лесу быстрее, чем в степи */
  const волк=Zver.make(КАНОН_ЗВЕРИ.find(x=>x.имя==="Седой волк Подлеска").id,{тихо:true,lvl:8,верн:90});волк.сыт=90;s.mount=волк.uid;
  const рел=КанонЗвери.рельеф;КанонЗвери.рельеф=()=>"forest";const л=mountGift("шаг");КанонЗвери.рельеф=()=>"plains";const ст=mountGift("шаг");КанонЗвери.рельеф=рел;o.шаг=[л,ст];
  Zver.beastView(волк.uid);o.окно=/Особенность/.test((document.getElementById("zvBody")||{}).textContent||"");s.mount=null;
  return o;});
 check('4. шестьдесят восемь зверей канона: свои роды и способности, звуки не повторяются и выровнены, встреча, зверинец, дары по месту, особенность в окне',
  з.зверей===68&&з.родов===68&&!з.повторНабора.length&&!з.повторГолоса.length&&!з.нетЗвука.length&&!з.безГромкости.length&&!з.повторСпособности.length
  &&з.облик&&з.встреча&&з.зверинец&&з.шаг[0]<з.шаг[1]&&з.окно,з);

 /* ── 5. Вещи канона ── */
 const в=await p.evaluate(async()=>{const o={всего:КАНОН_ВЕЩИ.filter(x=>!x.канон2).length};  /* (Альфа 1.5) канон II считает набор 346 */G.artifacts=[];G.level=100;
  const a=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.имя==="Кольцо пяти зарядов").id,"проба");o.дело=/Дело:/.test(ART.describe(a,true));
  const m={id:"skeleton",n:"Скелет",lvl:3,hp:300,dmg:6,xp:1,gold:1};БОЙ(m);await спим(200);o.заряд=Undead.onStrike(m,10)===0;if(G.inCombat)endCombat();
  const k=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.имя==="Камертон усилителя").id,"проба");o.школа=Power.spellK({n:"проба",school:"strings"})>Power.spellK({n:"проба",school:"fire"});
  const c=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.ранг>=7).id,"проба");G.level=5;o.неСлушается=!ART.works(c);G.level=30;G.artifacts=[];
  return o;});
 check('5. восемьдесят три вещи канона: дело в описании, заряды гасят удар, школа сильнее, сильная вещь не слушается новичка',
  в.всего===83&&в.дело&&в.заряд&&в.школа&&в.неСлушается,в);

 /* ── 6. Края ── */
 const к=await p.evaluate(async()=>{const o={краёв:КАНОН_КРАЯ.length};let ev=null;const oe=openEvent;
  openEvent=function(spec){ev={title:spec.title(),choices:spec.choices()};return true;};
  const k=КанонКрай.следующий();o.открытие=/Открылся край/.test(Neuro.newLand(Neuro.gen().n++,Math.random));const g=Neuro.gen();
  const pl=g.places.find(x=>x.кнКрай===k.id);G.x=pl.x;G.y=pl.y;o.место=!!КанонКрай.место();useHere();o.окно=!!ev&&ev.title===pl.n&&ev.choices.length>3;
  const учитель=k.люди.find(c=>c.учит.length);КанонМесто.человек(учитель.id);const i=ev.choices.findIndex(c=>/^Учиться: /.test(c.l));ev.choices[i].run();o.умение=КанонУмения.мои().length===1;
  const даёт=k.люди.find(c=>c.дело);КанонМесто.человек(даёт.id);ev.choices.find(c=>/^Взять дело/.test(c.l)).run();
  const t=КАНОН_ТВАРЬ[даёт.дело.тварь];БОЙ(Object.assign({},t,{hp:20,dmg:1}));await спим(200);G.combat.hp=0;victory();await спим(2800);
  КанонМесто.человек(даёт.id);const з0=G.gold;const сдать=ev.choices.find(c=>/^Сдать дело/.test(c.l));if(сдать)сдать.run();o.награда=G.gold-з0;
  openEvent=oe;o.край=!!Канон.край(pl.x,pl.y);
  o.учатВсе=КАНОН_УМЕНИЯ.every(u=>Object.values(КАНОН_ЛЮДИ).some(c=>c.учит.indexOf(u.id)>=0));o.чарыВсе=(KN.extraSpells||[]).every(s=>Object.values(КАНОН_ЛЮДИ).some(c=>c.чары.indexOf(s.n)>=0));
  return o;});
 check('6. семнадцать краёв: Режиссёр открывает край, поселение открывается, умение выучено, дело взято и сдано; у всех умений и чар есть учитель',
  к.краёв===17&&к.открытие&&к.место&&к.окно&&к.умение&&к.награда>0&&к.край&&к.учатВсе&&к.чарыВсе,к);

 /* ── 7. Руководство ── */
 const г=await p.evaluate(()=>({имя:GUIDE_SEC_NAME[141]||"",есть:(document.getElementById("guideText")||document.body).innerHTML.indexOf("Предания Грани")>=0||String(typeof GUIDE!=="undefined"?JSON.stringify(GUIDE).slice(0,0):"")!==null}));
 check('7. глава руководства 141 о преданиях Грани',/Предания Грани/.test(г.имя),г);

 check('8. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
