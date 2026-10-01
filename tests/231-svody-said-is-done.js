/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 231: «СВОДЫ» — ЧТО СКАЗАНО, ТО И СДЕЛАНО

   Просьба игрока: как с ловушками — игра говорила, что сработала, а ничего
   не происходило. Здесь каждое событие Сводов проверяется по делу: всякое
   число в сказанном («здоровья +8», «−3 здоровья», «+12 золота», «опыт +6»,
   «мана +4», «вода +30») совпадает с тем, что на самом деле изменилось, а
   звук, который обещан, звучит.
   1. Все четырнадцать ловушек Сводов: свой звук, удар и своё действие.
   2. Ловушка Сводов на полу подземелья: ненайденная срабатывает от шага.
   3. Пять родов моря Сводов: слова перехода совпадают с делом, звучит голос моря.
   4. Пять родов островов Сводов: слова высадки совпадают с делом.
   5. Умения тварей: яд, ржа, панцирь, осколки, натиск, сбой — работают.
   6. Семь заклинаний-легенд: мана, урон, лечение, оцепенение, венец,
      уход тенью и сбой — как сказано.
   7. Шесть зелий Сводов: каждое делает то, что говорит.
   8. Все тринадцать поручений засчитываются своими делами и дают награду.
   9. Сбой мира: каждое сказанное число совпадает с делом.
   10. Реки: дар реки сказан и дан.
   11. Перевёрнутый храм засчитывается как «пустой престол».
   12. Скольжение сквозь тонкую стену: герой по ту сторону, мана −8, звук.
   13. Гнев Молчана — ловушка бьёт больнее; Крылья — ловушка слабее.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,800):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const base=process.argv[2];await page.goto(base+(base.indexOf('?')>=0?'&':'?')+'svody=1');await page.waitForTimeout(1000);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.ИГРАЛО=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{ИГРАЛО.push(r);return b0(r,o);};
  window.СКАЗАНО=[];const s0=Speech.say.bind(Speech);Speech.say=(t,...a)=>{СКАЗАНО.push(String(t));return s0(t,...a);};
  /* Снимок и сверка сказанного с делом. */
  window.СНИМОК=()=>({lv:G.level,hp:G.hp,mana:G.mana,gold:G.gold,xp:G.xp,water:Number(G.water)||0,hour:G.hour+24*G.day});
  window.СВЕРИТЬ=(t,a,b)=>{const ошибки=[];const сум=(re)=>{let v=0,m;const r=new RegExp(re,"g");while((m=r.exec(t)))v+=Number(m[1]);return v;};
   const ждём={hp:сум("здоровья \\+(\\d+)")-сум("−(\\d+) здоровья")-сум("ещё −(\\d+)\\.(?! воды)"),
    gold:сум("\\+(\\d+) золота")+сум("звякнуло (\\d+)"),xp:сум("[Оо]пыт \\+(\\d+)"),mana:сум("мана \\+(\\d+)")-сум("−(\\d+)\\.?(?=[^.]*ман)")-сум("ману: −(\\d+)"),
    water:сум("вода \\+(\\d+)")-сум("−(\\d+) воды")};
   for(const k of ["hp","gold","xp","water"]){if(k==="xp"&&a.lv!==b.lv)continue;const есть=b[k]-a[k];if(ждём[k]&&ждём[k]!==есть)ошибки.push(`${k}: сказано ${ждём[k]}, вышло ${есть}`);}
   return ошибки;};});

 /* ── 1. Четырнадцать ловушек ── */
 const л=await page.evaluate(()=>{
  const out=[];const s=Svody.st();s.shadow={lvl:1,xp:0,hunger:20};s.oath="molchan";s.wrath={};s.body={};
  for(const t of SVD.traps){
   G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Проба",depth:5,x:1,y:1};G.marks={};G.buffs={};
   G.hp=G.hpMax=500;G.mana=G.manaMax=50;G.water=100;G.hour=10;ИГРАЛО.length=0;СКАЗАНО.length=0;
   s.ess={"коготь":3};s.mind=90;const ess0=3;const a=СНИМОК();const голод=s.shadow.hunger;const сбоев=Svody.n("glitch");
   trapFire(1,1,{...TRAPS.find(x=>x.id===t.id),x:1,y:1,глубина:5,состояние:"найдена",урон:Math.round(t.урон*1.4)});
   const b=СНИМОК();const сказ=СКАЗАНО.join(" ");
   const дело={тишина:()=>buffActive("глушь"),кровь:()=>a.hp-b.hp>Math.round(t.урон*1.4),жар:()=>b.mana<a.mana,ржа:()=>buffActive("ржа"),
    зов:()=>/идут/.test(сказ),тень:()=>s.shadow.hunger>голод,сбой:()=>Svody.n("glitch")>сбоев,клятва:()=>/признала/.test(сказ),
    корни:()=>b.hour-a.hour>=1,соль:()=>b.water<a.water,
    слепок:()=>(s.ess["коготь"]||0)<ess0,рассудок:()=>s.mind<90,рой:()=>/Роевики/.test(сказ),нить:()=>s.mind<90}[t.sv];
   out.push({id:t.id,звук:ИГРАЛО.indexOf(t.сраб)>=0,удар:t.зов?true:b.hp<a.hp,действие:!!(дело&&дело()),слова:сказ.indexOf(t.бьёт)>=0});}
  s.oath=null;return out;});
 const плохиеЛ=л.filter(x=>!(x.звук&&x.удар&&x.действие&&x.слова));
 check('1. все четырнадцать ловушек Сводов: свой звук, удар, своё действие и свои слова',л.length===14&&!плохиеЛ.length,плохиеЛ);

 /* ── 2. Ловушка Сводов на полу ── */
 const п=await page.evaluate(()=>{
  for(let bx=2000;bx<2200;bx++){
   G.place={kind:"dungeon",bx,by:2000,stype:"ruins",name:"Проба",depth:8,x:1,y:1};G.marks={};
   const l=curLevel();
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
    if(tileAt(l,x,y)!==".")continue;const t=trapAt(x,y);if(!t||!t.sv)continue;
    for(const [d,[dx,dy]] of Object.entries(DIRV)){if(!/^[NSEW]$/.test(d))continue;const sx=x-dx,sy=y-dy;
     if(tileAt(l,sx,sy)!=="."||trapAt(sx,sy))continue;
     G.place.x=sx;G.place.y=sy;G.hp=G.hpMax=500;ИГРАЛО.length=0;G.inCombat=false;G.combat=null;
     moveInside(d);
     return {bx,ловушка:t.n,удар:G.hp<500,звук:ИГРАЛО.indexOf(t.сраб)>=0,встали:G.place.x===x&&G.place.y===y};}}}
  return {нет:true};});
 check('2. ловушка Сводов на полу подземелья: шаг на ненайденную — звук и удар',!п.нет&&п.удар&&п.звук,п);

 /* ── 3. Моря ── */
 const м=await page.evaluate(()=>{
  const out={};const ошибки=[];
  for(const тип of SVD.seaTypes){
   let x0=null;for(let i=0;i<20000&&x0===null;i++){const t=seaTypeAt(i*50,333*50);if(t.id===тип.id)x0=i*50;}
   if(x0===null){ошибки.push("нет моря "+тип.id);continue;}
   let сказано=0;
   for(let leg=0;leg<40;leg++){
    G.x=x0;G.y=333*50;G.ship={tox:x0,toy:333*50,leg,legs:40,left:5,sea:тип.id};G.hp=G.hpMax=200;G.mana=10;G.manaMax=50;G.buffs={};G.day=5+leg;G.hour=10;
    ИГРАЛО.length=0;const a=СНИМОК();const left=G.ship.left;
    const t=seaLegEffect(G.ship);const b=СНИМОК();
    if(/\d/.test(t))сказано++;
    ошибки.push(...СВЕРИТЬ(t,a,b).map(e=>тип.id+": "+e));
    if(/мана \+(\d+)/.test(t)&&G.mana-10!==Number(t.match(/мана \+(\d+)/)[1]))ошибки.push(тип.id+": мана");
    if(/впустую/.test(t)&&G.ship.left!==left+1)ошибки.push(тип.id+": впустую");
    if(/целый час/.test(t)&&b.hour-a.hour<1)ошибки.push(тип.id+": час");
    if(ИГРАЛО.indexOf(тип.звук)<0)ошибки.push(тип.id+": нет голоса моря");}
   out[тип.id]=сказано;}
  G.ship=null;return {out,ошибки:[...new Set(ошибки)]};});
 check('3. пять родов моря Сводов: каждое сказанное число совпадает с делом, звучит голос моря',!м.ошибки.length&&Object.keys(м.out).length===5,м);

 /* ── 4. Острова ── */
 const о=await page.evaluate(()=>{
  const ошибки=[],слова={};
  for(const t of SVD.isles)for(let k=0;k<6;k++){
   G.ship={tox:G.x,toy:G.y,leg:0,legs:4,left:4,island:{type:t.id,x:1000+k*977,y:2000+k*313,name:"Проба"}};
   G.hp=G.hpMax=200;G.mana=k%2?10:G.manaMax;G.buffs={};ИГРАЛО.length=0;СКАЗАНО.length=0;
   const a=СНИМОК();const e0=JSON.stringify(Svody.st().ess);
   landIsland();const b=СНИМОК();const t2=СКАЗАНО.join(" ");слова[t.id]=t2.slice(0,120);
   ошибки.push(...СВЕРИТЬ(t2,a,b).map(e=>t.id+": "+e));
   if(/мана \+(\d+)/.test(t2)&&b.mana-a.mana!==Number(t2.match(/мана \+(\d+)/)[1]))ошибки.push(t.id+": мана");
   if(/сущност/.test(t2)&&JSON.stringify(Svody.st().ess)===e0)ошибки.push(t.id+": сущность");
   if(/три часа/.test(t2)&&b.hour-a.hour<3)ошибки.push(t.id+": часы");
   if(setTimeout&&ИГРАЛО.indexOf("ship_arrive")<0)ошибки.push(t.id+": нет звука причала");}
  G.ship=null;return {ошибки:[...new Set(ошибки)],слова};});
 check('4. пять родов островов Сводов: слова высадки совпадают с делом',!о.ошибки.length,о);

 /* ── 5. Умения тварей ── */
 const у=await page.evaluate(()=>{
  const m=(ab)=>({id:"wolf",n:"Проба",lvl:3,hp:40,dmg:5,svAbil:ab,sv:"sv_x"});
  const r={};
  G.combat={m:m("яд"),hp:40};G.poisoned=null;for(let i=0;i<60&&!G.poisoned;i++)Svody.onStrike(G.combat.m,5);r.яд=!!G.poisoned;
  G.buffs={};G.combat={m:m("ржа"),hp:40};const а0=atk();for(let i=0;i<60&&!buffActive("ржа");i++)Svody.onStrike(G.combat.m,5);r.ржа=buffActive("ржа")&&atk()<а0;
  G.combat={m:m("панцирь"),hp:40};r.панцирь=Svody.onHit(G.combat.m,10)===7;
  G.hp=100;G.combat={m:m("осколки"),hp:40};Svody.onHit(G.combat.m,10);r.осколки=G.hp===98;
  G.combat={m:m("натиск"),hp:40};const п1=Svody.onStrike(G.combat.m,10),п2=Svody.onStrike(G.combat.m,10);r.натиск=п1>п2;
  G.combat={m:m("сбой"),hp:40};let ноль=false;for(let i=0;i<200&&!ноль;i++)ноль=Svody.onHit(G.combat.m,10)===0;r.сбой=ноль;
  G.buffs={};G.combat=null;return r;});
 check('5. умения тварей Сводов работают: яд, ржа, панцирь, осколки, натиск, сбой',Object.values(у).every(Boolean),у);

 /* ── 6. Заклинания-легенды ── */
 const з=await page.evaluate(()=>{
  const s=Svody.st();s.seals=SVD.spells.map(x=>x.печать);s.oath=null;
  const out={};
  const бой=(hp)=>{const m={...MONSTERS.find(x=>x.id==="wolf"),lvl:3,hp,dmg:5,xp:10,gold:1};try{startCombat({monster:m,x:G.x+1,y:G.y},{});}catch(e){}G.combat.hp=hp;return m;};
  for(const sp of SVD.spells){
   G.hp=G.hpMax=200;G.hp=150;G.mana=G.manaMax=100;G.level=4;
   бой(sp.тень?200:300);const hp0=G.combat.hp;
   const t=Svody.cast(sp.id);
   const r={мана:100-G.mana===sp.мана,t:t.slice(0,90)};
   if(sp.урон&&!sp.тень){const d=Number((t.match(/получает (\d+)/)||[])[1]);r.урон=G.combat&&hp0-G.combat.hp===d;}
   if(sp.лечит){r.лечит=G.hp===150+Number((t.match(/лечитесь на (\d+)/)||[])[1]);r.оцепенел=Svody.onStrike(G.combat.m,9)===0;}
   if(sp.венец){const до=G.combat.hp;Svody.onStrike(G.combat.m,5);r.венец=G.combat.hp<до;}
   if(sp.тень)r.ушли=!G.inCombat&&/ушли тенью/.test(t);
   if(sp.сбой)r.сбой=G.combat&&Math.abs(G.combat.hp-Math.round(hp0*0.67))<=1&&G.hp<150;
   out[sp.id]=r;
   if(G.inCombat)endCombat();}
  /* тень по слабому — добивает */
  G.mana=100;const m=бой(200);G.combat.hp=10;const t=Svody.cast("l_shadow");out.добил=!G.inCombat&&/добил/.test(t);
  return out;});
 const плохиеЗ=Object.entries(з).filter(([k,v])=>typeof v==="object"?Object.entries(v).some(([kk,vv])=>kk!=="t"&&vv!==true):v!==true);
 check('6. семь заклинаний-легенд: мана, урон, лечение, оцепенение, венец, уход тенью и сбой — как сказано',!плохиеЗ.length,{плохиеЗ,з});

 /* ── 7. Зелья ── */
 const з7=await page.evaluate(()=>{
  const s=Svody.st();const out={};
  for(const p of SVD.potions){
   G.potions=[{id:p.id,q:1,стаб:1,день:Number(G.day)||1,срок:10}];G.buffs={};G.mana=10;G.manaMax=50;
   s.shadow={lvl:2,xp:12,hunger:10};const ess0=Object.values(s.ess).reduce((a,b)=>a+(Number(b)||0),0);const solo0=Number(s.solo)||0;
   ИГРАЛО.length=0;СКАЗАНО.length=0;drinkPotion(0);const t=СКАЗАНО.join(" ");
   const ok={тень:()=>s.shadow.hunger===100,сущность:()=>Object.values(s.ess).reduce((a,b)=>a+(Number(b)||0),0)===ess0+1,
    прилив:()=>buffActive("прилив"),тишина:()=>buffActive("тишина шага"),одиночка:()=>(Number(s.solo)||0)===solo0+5,
    жар:()=>buffActive("мощь")&&G.mana===10+Number((t.match(/мана \+(\d+)/)||[0,0])[1]),
    ясность:()=>/рассудок \+\d+/.test(t),противорой:()=>buffActive("противорой"),оплот:()=>buffActive("мощь")}[p.sv];
   out[p.id]={дело:!!(ok&&ok()),звук:ИГРАЛО.some(r=>/^potion_|^cast_potion/.test(r))};}
  while(activeLayer())closeTopUI();return out;});
 check('7. девять зелий Сводов делают то, что говорят, и звучат склянкой',Object.values(з7).every(x=>x.дело&&x.звук),з7);

 /* ── 8. Поручения ── */
 const к=await page.evaluate(()=>{
  const s=Svody.st();s.quests={};s.met={};s.relics=[];s.worn=[];s.seals=[];s.cnt.rivers={};s.cnt.seas={};s.shadow={lvl:0,xp:0,hunger:0};s.body={};s.oath=null;s.wrath={};
  for(const id of Object.keys(s.lands))s.lands[id].decay=50;
  for(const n of SVD.npcs)Svody.take(n.id);
  /* четыре в работе — остальные ждут; делаем по очереди */
  const итог={};const g0=G.gold;
  const сделать={
   rivers:()=>{for(const r of SVD.rivers.slice(0,3))s.cnt.rivers[r.n]=1;Svody.questCheck();},
   deeds:()=>{for(let i=0;i<3;i++)Svody.deedAdd("проба "+i);},
   godseat:()=>{G.ship={island:{type:"sv_godseat",x:5,y:5,name:"П"}};landIsland();G.ship=null;},
   rustgolem:()=>Svody.onWin({id:"golem",n:"Ржавый страж",sv:"sv_rustgolem",lvl:3}),
   traps:()=>{for(let i=0;i<5;i++)Svody.count("traps");},
   claw:()=>Svody.essAdd("коготь",3),
   seas:()=>{for(const t of SVD.seaTypes.slice(0,3)){G.ship={leg:1,left:3};Svody.seaLeg(SEA_BY_ID[t.id],G.ship);}G.ship=null;},
   decay:()=>Svody.decayAdd(Object.keys(s.lands)[0],-40),
   shadow:()=>{G.hour=23;Svody.shadowFeed(2);Svody.shadowFeed(12);G.hour=12;},
   seabeast:()=>Svody.onWin({id:"sv_bellwhale",n:"Колокольный кит",voice:"behemoth",sv:"sv_bellwhale",svSea:true,lvl:7}),
   reforge:()=>{s.ess["чешуя"]=10;G.level=Math.max(G.level,6);Svody.reforge("чешуя");},
   oathdays:()=>{s.oath="sudya";for(let i=0;i<7;i++){G.day++;Svody.daily();}},
   glitch:()=>Svody.glitch(""),
   stronghold:()=>{const l=Svody.land();s.inv={land:l.id,until:G.day+3,kills:0};for(let i=0;i<5;i++)Svody.onWin({id:"wraith",n:"Поглотитель слепков",sv:"sv_devourer",lvl:3});},
   grave:()=>{s.grave={x:G.x,y:G.y,p:null,ess:{"коготь":2},lvl:3};Svody.onWin({id:"wraith",n:"Ваш посмертный двойник",sv:"sv_gravedouble",svGrave:true,lvl:3});},
   svundead:()=>{for(let i=0;i<5;i++)Svody.onWin({id:"wraith",n:"Иссушитель",sv:"sv_drainer",lvl:3});},
   weave:()=>{s.threads.push("n_sila");s.woven=[];Svody.weave("n_sila");},
   choices:()=>{for(let i=0;i<3;i++){s.choice=SVD.choices[i].id;Svody.choose("a");}},
   mercy:()=>{Svody.humAdd(40);},
   swarm:()=>{for(let i=0;i<4;i++)Svody.onWin({id:"spider",n:"Роевик",sv:"sv_swarmling",lvl:3});},
   sanity:()=>{s.mind=45;Svody.mindAdd(-1);Svody.mindAdd(100);}};
  for(let круг=0;круг<10;круг++){
   for(const n of SVD.npcs){if(!s.quests[n.id])Svody.take(n.id);const q=s.quests[n.id];if(!q||q.done||итог[n.id])continue;
    const gold=G.gold;СКАЗАНО.length=0;сделать[n.задание.счёт]();
    if(s.quests[n.id].done){const t=СКАЗАНО.find(x=>/Поручение Сводов исполнено: «/.test(x)&&x.indexOf(n.задание.n)>=0)||"";
     const сказЗолото=Number((t.match(/\+(\d+) золота/)||[])[1]);
     итог[n.id]={золото:!!сказЗолото,реликвия:!n.награда.реликвия||s.relics.indexOf(n.награда.реликвия)>=0,печать:!n.награда.печать||s.seals.indexOf(n.награда.печать)>=0,сказано:!!t};}}}
  const нет=SVD.npcs.filter(n=>!итог[n.id]).map(n=>n.id);
  return {нет,плохие:Object.entries(итог).filter(([k,v])=>!(v.золото&&v.реликвия&&v.печать&&v.сказано)),золото:G.gold-g0};});
 check('8. все поручения засчитываются своими делами, награда сказана и дана',!к.нет.length&&!к.плохие.length&&к.золото>0,к);

 /* ── 9. Сбой мира ── */
 const с=await page.evaluate(()=>{const ошибки=[];const s=Svody.st();s.wrath={};s.oath=null;
  for(let i=0;i<80;i++){G.hp=i%3?G.hpMax:Math.round(G.hpMax/2);G.mana=i%4?20:0;G.manaMax=50;
   const a=СНИМОК();const t=Svody.glitch("");const b=СНИМОК();
   ошибки.push(...СВЕРИТЬ(t,a,b));
   if(/мана вернулась: \+(\d+)/.test(t)&&b.mana-a.mana!==Number(t.match(/\+(\d+)/)[1]))ошибки.push("мана+");
   if(/утекла.*−(\d+)/.test(t)&&a.mana-b.mana!==Number(t.match(/−(\d+)/)[1]))ошибки.push("мана−");
   if(/два часа/.test(t)&&b.hour-a.hour<2)ошибки.push("часы");}
  return [...new Set(ошибки)];});
 check('9. сбой мира: каждое сказанное число совпадает с делом',!с.length,с);

 /* ── 10. Реки ── */
 const р=await page.evaluate(()=>{const s=Svody.st();const ошибки=[];let рек=0;G.place=null;G.ship=null;G.dark=false;if(G.inCombat)endCombat();const was={x:G.x,y:G.y};
  const клетки=[];
  for(let a=0;a<12&&клетки.length<6;a++){let нашли=false;
   for(let i=0;i<400000&&!нашли;i+=37){const x=was.x+a*5000+(i%4000),y=was.y+Math.floor(i/4000)*37;
    const био=biomeAt(x,y);if(био&&["river","stream","waterfall","river_mouth"].indexOf(био.id)>=0){клетки.push([x,y]);нашли=true;}}}
  for(const [x,y] of клетки){
   G.x=x;G.y=y;const w=Svody.waterHere();if(!w||s.cnt.rivers[w.n]===undefined&&false)continue;
   delete s.cnt.rivers[w.n];s.water="";G.hp=Math.round(G.hpMax/2);G.water=50;СКАЗАНО.length=0;
   const a=СНИМОК();Svody.tick();const b=СНИМОК();const t=СКАЗАНО.join(" ");
   if(t.indexOf(w.n)<0){ошибки.push("не названа "+w.n);continue;}
   рек++;ошибки.push(...СВЕРИТЬ(t,a,b).map(e=>w.n+": "+e));
   if(w.дар==="вода"&&!/вода \+/.test(t))ошибки.push(w.n+": дар не сказан");}
  G.x=was.x;G.y=was.y;return {рек,ошибки};});
 check('10. реки: имя и дар реки сказаны, и дар дан',р.рек>=3&&!р.ошибки.length,р);

 /* ── 11. Перевёрнутый храм ── */
 const х=await page.evaluate(()=>{const s=Svody.st();
  for(let bx=3000;bx<6000;bx++){const k=dungeonKindAt(bx,3000,"ruins");if(k&&k.id==="sv_temple"){
   const было=Svody.n("godseat");G.place={kind:"dungeon",bx,by:3000,stype:"ruins",name:"Храм",depth:2,x:1,y:1};s.dk="";СКАЗАНО.length=0;
   Svody.tick();return {bx,засчитан:Svody.n("godseat")===было+1,сказано:СКАЗАНО.some(t=>/перевёрнутый храм/.test(t))};}}
  return {нет:true};});
 check('11. перевёрнутый храм называется на входе и засчитывается как «пустой престол»',!х.нет&&х.засчитан&&х.сказано,х);

 /* ── 12. Скольжение ── */
 const ск=await page.evaluate(()=>{const s=Svody.st();s.shadow={lvl:3,xp:40,hunger:100};
  for(let bx=4000;bx<4200;bx++){G.place={kind:"dungeon",bx,by:4000,stype:"ruins",name:"П",depth:3,x:1,y:1};G.marks={};const l=curLevel();
   for(let y=2;y<l.h-2;y++)for(let x=2;x<l.w-2;x++){if(tileAt(l,x,y)!=="."||tileAt(l,x+1,y)!=="#"||tileAt(l,x+2,y)!==".")continue;
    if(safeFn(()=>passageAt(x+1,y),null))continue;
    G.place.x=x;G.place.y=y;G.mana=G.manaMax=30;G.inCombat=false;G.combat=null;ИГРАЛО.length=0;
    const ответ=Svody.slipArm();moveInside("E");
    return {ответ:ответ.slice(0,40),там:G.place.x===x+2&&G.place.y===y,мана:30-G.mana,звук:ИГРАЛО.indexOf("sv_slip")>=0};}}
  return {нет:true};});
 check('12. скольжение сквозь тонкую стену: герой по ту сторону, мана −8, звук',!ск.нет&&ск.там&&ск.мана===8&&ск.звук,ск);

 /* ── 13. Гнев и Крылья ── */
 const г=await page.evaluate(()=>{const s=Svody.st();const пр=()=>{G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"П",depth:5,x:1,y:1};G.marks={};G.hp=G.hpMax=500;G.buffs={};
   trapFire(1,1,{...TRAPS.find(x=>x.id==="plate"),x:1,y:1,глубина:5,состояние:"найдена",урон:40});return 500-G.hp;};
  s.wrath={};s.body={};const обычно=пр();
  s.wrath={molchan:G.day+5};const гнев=пр();
  s.wrath={};s.body={крыло:3};const крылья=пр();s.body={};
  return {обычно,гнев,крылья,бегство:(()=>{s.body={крыло:2};const k=Svody.fleeK();s.body={};return k;})()};});
 check('13. гнев Молчана — ловушка бьёт больнее; Крылья — слабее и помогают уйти из боя',г.гнев>г.обычно&&г.крылья<г.обычно&&г.бегство>0,г);


 /* ══ 8.0: ПРЕДЕЛЫ ПЕРЕРОЖДЕНИЙ ══ */
 const бой=`(hp,доп)=>{G.place=null;G.ship=null;if(G.inCombat)endCombat();const m={...MONSTERS.find(x=>x.id==="wraith"),lvl:3,hp,dmg:5,xp:10,gold:1,...(доп||{})};try{startCombat({monster:m,x:G.x+1,y:G.y},{});}catch(e){}G.combat.hp=hp;return m;}`;

 /* ── 14. Нежить встаёт; Свет Оплота не даёт ── */
 const в=await page.evaluate(src=>{const бой=eval(src);const out={};
  const m=бой(100,{n:"Дважды павший",sv:"sv_twice",svAbil:"восстаёт"});G.combat.hp=0;СКАЗАНО.length=0;ИГРАЛО.length=0;victory();
  out.встал=G.inCombat&&G.combat&&G.combat.hp===30&&СКАЗАНО.some(x=>/встаёт снова/.test(x))&&ИГРАЛО.indexOf("sv2_rise")>=0;
  G.combat.hp=0;victory();out.второйРаз=!G.inCombat;
  const s=Svody.st();s.seals=SVD.spells.map(x=>x.печать);G.mana=G.manaMax=200;
  бой(30,{n:"Дважды павший",sv:"sv_twice",svAbil:"восстаёт"});const t=Svody.cast("l_oplot");out.свет=!G.inCombat&&/вдвое/.test(t);
  return out;},бой);
 check('14. нежить Сводов встаёт ещё раз (звук и слова), со второго раза падает; Свет Оплота не даёт ей встать',в.встал&&в.второйРаз&&в.свет,в);

 /* ── 15. Умения нежити и роя ── */
 const у2=await page.evaluate(src=>{const бой=eval(src);const r={};const s=Svody.st();
  бой(100,{n:"Иссушитель",sv:"sv_drainer",svAbil:"иссушение"});G.combat.hp=50;const до=G.combat.hp;const d=Svody.onStrike(G.combat.m,10);r.иссушение=G.combat.hp-до===Math.round(d/2);
  s.ess={"коготь":3};let взял=false;for(let i=0;i<60&&!взял;i++){Svody.onStrike(G.combat.m={...G.combat.m,svAbil:"слепок"},6);взял=s.ess["коготь"]<3;}r.слепок=взял;
  G.buffs={};const а0=atk();G.combat.m.svAbil="проклятие";for(let i=0;i<60&&!buffActive("проклятие");i++)Svody.onStrike(G.combat.m,6);r.проклятие=buffActive("проклятие")&&atk()===а0-1;
  G.combat.svHit=0;G.combat.m.svAbil="хор";const х1=Svody.onStrike(G.combat.m,8),х2=Svody.onStrike(G.combat.m,8),х3=Svody.onStrike(G.combat.m,8);r.хор=х3>х2&&х2>х1;
  G.buffs={};G.combat.m.svAbil="холод";const б1=Svody.onStrike(G.combat.m,8);buffSet("тепло",3);const б2=Svody.onStrike(G.combat.m,8);r.холод=б1===б2+2;
  G.combat.m.svAbil="одержимость";G.hp=100;let сам=false;for(let i=0;i<200&&!сам;i++){const v=Svody.onHit(G.combat.m,10);сам=v===0&&G.hp===97;G.hp=100;}r.одержимость=сам;
  G.buffs={};G.combat.m.svAbil="страх";for(let i=0;i<60&&!buffActive("страх");i++)Svody.onStrike(G.combat.m,6);r.страх=buffActive("страх");
  G.combat.m.svAbil="сеть";G.combat.svNet=false;for(let i=0;i<60&&!G.combat.svNet;i++)Svody.onStrike(G.combat.m,6);G.combat.m.svAbil="";r.сеть=G.combat.svNet&&Svody.onHit(G.combat.m,10)===5;
  endCombat();return r;},бой);
 check('15. умения нежити и роя: иссушение лечит тварь ровно на половину удара, слепок крадёт сущность, проклятие, хор растёт, холод без тепла, одержимость, страх, сеть',Object.values(у2).every(Boolean),у2);

 /* ── 16. Посмертный двойник ── */
 const д2=await page.evaluate(async src=>{const s=Svody.st();s.body={};s.wrath={};s.oath=null;s.woven=[];s.mind=100;s.grave=null;
  G.place=null;G.ship=null;if(G.inCombat)endCombat();G.dark=false;
  const x0=G.x,y0=G.y;s.ess={"коготь":10,"тень":3};СКАЗАНО.length=0;
  Svody.onDefeat({n:"кто-то"});
  const g=s.grave;const ушлоК=10-s.ess["коготь"],ушлоТ=3-s.ess["тень"];
  await new Promise(z=>setTimeout(z,2700));
  const слова=СКАЗАНО.join(" ");const сказРас=Number((слова.match(/Рассудок −([\d.]+)/)||[])[1]);
  const рассудокОк=Math.abs((100-s.mind)-сказРас)<0.05;
  /* герой ушёл и вернулся к месту гибели */
  G.x=x0+50;Svody.tick();G.x=x0;G.y=y0;s.graveIn=0;Svody.tick();
  const началось=G.inCombat&&G.combat&&G.combat.m.svGrave;
  G.combat.hp=0;victory();
  return {могила:!!g&&g.ess["коготь"]===ушлоК&&g.ess["тень"]===ушлоТ,рассудокОк,сказРас,началось,вернулось:s.ess["коготь"]>=10&&s.ess["тень"]>=3&&s.ess["коготь"]+s.ess["тень"]<=14,очищено:!s.grave};},бой);
 check('16. падение: треть сущностей у посмертного двойника, рассудок −сказанное; у места гибели встаёт двойник, победа возвращает сущности',д2.могила&&д2.рассудокОк&&д2.началось&&д2.вернулось&&д2.очищено,д2);

 /* ── 17. Нашествие Поглотителей ── */
 const н2=await page.evaluate(()=>{const s=Svody.st();const l=Svody.land();G.place=null;
  s.inv={land:l.id,until:G.day+3,kills:0};Svody.landSt(l.id).decay=80;s.relics=s.relics.filter(x=>x!=="r_oplot");
  const g0=G.gold;СКАЗАНО.length=0;let т="";
  for(let i=0;i<5;i++){const до=Svody.decay(l.id);Svody.onWin({id:"wraith",n:"Поглотитель слепков",sv:"sv_devourer",lvl:3});}
  const выстоял=!s.inv&&s.relics.indexOf("r_oplot")>=0&&Svody.n("stronghold")>0;
  /* провал: срок вышел */
  s.inv={land:l.id,until:G.day-1,kills:2};Svody.landSt(l.id).decay=50;Svody.daily();
  return {выстоял,decay:Svody.decay(l.id),пал:!s.inv&&Svody.decay(l.id)>=60};});
 check('17. нашествие: пять Поглотителей — оплот выстоял (реликвия, счёт); срок вышел — край пал, упадок +10',н2.выстоял&&н2.пал,н2);

 /* ── 18. Выбор на краю ── */
 const в2=await page.evaluate(()=>{const s=Svody.st();const ошибки=[];s.oath=null;s.relics=[];s.worn=[];
  for(const c of SVD.choices)for(const o of ["a","b","r"]){s.choice=c.id;s.mind=60;s.hum=50;G.gold=200;
   const a={hum:s.hum,mind:s.mind,gold:G.gold,hour:G.hour+24*G.day};const t=Svody.choose(o);const b={hum:s.hum,mind:s.mind,gold:G.gold,hour:G.hour+24*G.day};
   const ч=(t.match(/человечность ([+−-]?[\d.]+)/)||[])[1];if(ч!==undefined&&Math.abs(Number(ч.replace("−","-"))-(b.hum-a.hum))>0.05)ошибки.push(c.id+o+": человечность");
   const р=(t.match(/(?<!Чаша Мирры: )рассудок ([+−-]?[\d.]+)/)||[])[1];if(o!=="r"&&р!==undefined&&Math.abs(Number(р.replace("−","-"))-(b.mind-a.mind))>0.05)ошибки.push(c.id+o+": рассудок");
   const з=(t.match(/([+−])(\d+) золота/)||[]);if(з[2]&&(з[1]==="+"?1:-1)*Number(з[2])!==b.gold-a.gold)ошибки.push(c.id+o+": золото");
   const отд=(t.match(/отдано (\d+) золота/)||[])[1];if(отд&&Number(отд)!==a.gold-b.gold)ошибки.push(c.id+o+": отдано");
   if(o==="r"&&(b.hour-a.hour<6||Math.abs(a.mind-b.mind-10)>0.05))ошибки.push(c.id+": отказ");}
  return ошибки;});
 check('18. выбор на краю: человечность, рассудок и золото меняются ровно на сказанное; отказ — шесть часов и рассудок −10',!в2.length,в2);

 /* ── 19. Нити Отлетевших ── */
 const н3=await page.evaluate(src=>{const бой=eval(src);const s=Svody.st();s.threads=["n_sila","n_zrenie","n_stoykost","n_vozvrat"];s.woven=[];s.mind=100;s.oath=null;s.relics=[];s.worn=[];s.body={};s.solo=0;
  const а0=atk(),л0=trapSkill();const t1=Svody.weave("n_sila");const а1=atk();const м1=s.mind;
  const t2=Svody.weave("n_zrenie");const л1=trapSkill();const t3=Svody.weave("n_stoykost");
  const предел=/больше нервы не выдержат/.test(t3);Svody.unweave("n_zrenie");Svody.weave("n_stoykost");
  бой(100,{svAbil:""});const у=Svody.onStrike(G.combat.m,10);endCombat();
  s.woven=["n_vozvrat"];s.ess={"коготь":9};Svody.onDefeat({});const цело=s.ess["коготь"]===9&&!s.grave;
  return {сила:а1===а0+3,рассудок:м1===90&&/Рассудок −10/.test(t1),зрение:л1>л0||л0>=0.95,предел,стойкость:у===8,возврат:цело};},бой);
 check('19. нити Отлетевших: сила +3, зрение, стойкость −2, возврат хранит сущности; рассудок −10; больше двух не вплести',Object.values(н3).every(Boolean),н3);

 /* ── 20. Оружие Сводов ── */
 const о2=await page.evaluate(src=>{const бой=eval(src);const r={};G.gear=[];
  for(const w of SVD.weapons)Svody.weaponGive(w.id);r.вКотомке=G.gear.filter(x=>x.svw).length===6&&G.gear.every(x=>x.slot==="weapon"&&x.val>0);
  const надеть=id=>{G.equip.weapon=G.gear.find(x=>x.svw===id);};
  надеть("svw_oplot");бой(100,{sv:"sv_drainer",svAbil:""});r.оплот=Svody.onHit(G.combat.m,10)===20;
  G.combat.m.sv="sv_twice";надеть("svw_roy");G.combat.m.sv="sv_swarmling";r.рой=Svody.onHit(G.combat.m,10)===15;
  надеть("svw_toplat");G.combat.m.svAbil="панцирь";r.пробой=Svody.onHit(G.combat.m,10)===10;
  надеть("svw_otlet");G.combat.m.svAbil="";G.combat.svStun=0;for(let i=0;i<5;i++)Svody.onHit(G.combat.m,10);r.жало=G.combat.svStun===1&&Svody.onStrike(G.combat.m,10)===0;
  надеть("svw_perer");G.hp=Math.floor(G.hpMax/4);r.отчаяние=Svody.onHit(G.combat.m,10)===15;G.hp=G.hpMax;
  endCombat();G.equip.weapon=null;return r;},бой);
 check('20. оружие Сводов: шесть вещей в котомке; Клинок Оплота вдвое по нежити, Серп +5 по рою, Посох латников пробивает панцирь, Жало оплетает каждым пятым, Меч Перерождённого +5 при ранах',Object.values(о2).every(Boolean),о2);

 /* ── 21. Заклинания 8.0 ── */
 const з2=await page.evaluate(src=>{const бой=eval(src);const s=Svody.st();s.seals=SVD.spells.map(x=>x.печать);s.oath=null;const r={};G.level=4;
  G.mana=G.manaMax=200;бой(300);Svody.cast("l_thread");r.нить=Svody.onStrike(G.combat.m,9)===0&&Svody.onStrike(G.combat.m,9)===0&&Svody.onStrike(G.combat.m,9)>0;endCombat();
  s.mind=70;бой(300);let hp0=G.combat.hp;let t=Svody.cast("l_abyss");r.пропасть=hp0-G.combat.hp===10+Math.round(30/3)+4&&/получает 24/.test(t)&&s.mind===65;endCombat();
  s.mind=80;G.hp=50;G.hpMax=200;бой(300);t=Svody.cast("l_repeat");r.повтор=G.hp===150&&s.mind===70&&/здоровья \+100/.test(t)&&/уже прочитан/.test(Svody.cast("l_repeat"));endCombat();
  s.ess={};бой(300);t=Svody.cast("l_cast");r.слепок=Object.values(s.ess).reduce((a,b)=>a+b,0)===1&&/Слепок вырван/.test(t);endCombat();
  бой(300,{sv:"sv_drainer"});hp0=G.combat.hp;t=Svody.cast("l_oplot");r.свет=hp0-G.combat.hp===2*(10+4)&&/получает 28/.test(t);endCombat();
  return r;},бой);
 check('21. заклинания 8.0: нить снимает два удара, Взгляд Пропасти бьёт по формуле и стоит рассудок, Шаг Повтора лечит раз за бой, Слепок даёт сущность, Свет Оплота вдвое по нежити',Object.values(з2).every(Boolean),з2);

 /* ── 22. Зелья, ловушки и дары 8.0 ── */
 const п2=await page.evaluate(src=>{const бой=eval(src);const s=Svody.st();const r={};
  s.mind=50;G.potions=[{id:"sv_clarity",q:1,стаб:1,день:G.day,срок:10}];СКАЗАНО.length=0;drinkPotion(0);r.ясность=s.mind>=75&&s.mind<=78&&СКАЗАНО.some(x=>/рассудок \+25/.test(x));
  G.buffs={};G.potions=[{id:"sv_antiswarm",q:1,стаб:1,день:G.day,срок:10}];drinkPotion(0);бой(100,{sv:"sv_spitter",svAbil:"яд"});G.poisoned=null;for(let i=0;i<80;i++)Svody.onStrike(G.combat.m,5);r.противорой=!G.poisoned;endCombat();
  while(activeLayer())closeTopUI();
  const пр=(id)=>{G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"П",depth:5,x:1,y:1};G.marks={};G.hp=G.hpMax=500;ИГРАЛО.length=0;СКАЗАНО.length=0;
   const т=TRAPS.find(x=>x.id===id);trapFire(1,1,{...т,x:1,y:1,глубина:5,состояние:"найдена",урон:10});return {звук:ИГРАЛО.indexOf(т.сраб)>=0,слова:СКАЗАНО.join(" ")};};
  s.ess={"коготь":2};let x=пр("sv_cast");r.зеркало=x.звук&&s.ess["коготь"]===1&&/забрало/.test(x.слова);
  s.mind=90;x=пр("sv_rebirthsign");r.знак=x.звук&&s.mind===85&&/Рассудок −5/.test(x.слова);
  s.mind=90;x=пр("sv_threadwire");r.струна=x.звук&&s.mind===87;
  x=пр("sv_hive");r.сот=x.звук&&/Роевики/.test(x.слова);
  /* дары: поглощение лечит; перерождение — вдвое меньше рассудка */
  s.oath="glad";s.favor.glad=40;бой(100,{svAbil:""});G.hp=100;G.hpMax=200;Svody.onHit(G.combat.m,10);r.поглощение=G.hp===102;endCombat();
  s.oath="povtor";s.favor.povtor=15;s.mind=100;s.wrath={};s.relics=[];s.worn=[];s.woven=[];G.place=null;Svody.onDefeat({});r.перерождение=s.mind===92.5;s.oath=null;
  return r;},бой);
 check('22. зелья, ловушки и дары 8.0: ясность +25 рассудка, противорой гасит яд роя, зеркало крадёт сущность, знак −5 рассудка, струна −3, сот — рой; поглощение лечит, перерождение бережёт рассудок',Object.values(п2).every(Boolean),п2);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
