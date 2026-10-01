/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 231: «СВОДЫ» — ЧТО СКАЗАНО, ТО И СДЕЛАНО

   Просьба игрока: как с ловушками — игра говорила, что сработала, а ничего
   не происходило. Здесь каждое событие Сводов проверяется по делу: всякое
   число в сказанном («здоровья +8», «−3 здоровья», «+12 золота», «опыт +6»,
   «мана +4», «вода +30») совпадает с тем, что на самом деле изменилось, а
   звук, который обещан, звучит.
   1. Все десять ловушек Сводов: свой звук, удар и своё действие.
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

 /* ── 1. Десять ловушек ── */
 const л=await page.evaluate(()=>{
  const out=[];const s=Svody.st();s.shadow={lvl:1,xp:0,hunger:20};s.oath="molchan";s.wrath={};s.body={};
  for(const t of SVD.traps){
   G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Проба",depth:5,x:1,y:1};G.marks={};G.buffs={};
   G.hp=G.hpMax=500;G.mana=G.manaMax=50;G.water=100;G.hour=10;ИГРАЛО.length=0;СКАЗАНО.length=0;
   const a=СНИМОК();const голод=s.shadow.hunger;const сбоев=Svody.n("glitch");
   trapFire(1,1,{...TRAPS.find(x=>x.id===t.id),x:1,y:1,глубина:5,состояние:"найдена",урон:Math.round(t.урон*1.4)});
   const b=СНИМОК();const сказ=СКАЗАНО.join(" ");
   const дело={тишина:()=>buffActive("глушь"),кровь:()=>a.hp-b.hp>Math.round(t.урон*1.4),жар:()=>b.mana<a.mana,ржа:()=>buffActive("ржа"),
    зов:()=>/идут/.test(сказ),тень:()=>s.shadow.hunger>голод,сбой:()=>Svody.n("glitch")>сбоев,клятва:()=>/признала/.test(сказ),
    корни:()=>b.hour-a.hour>=1,соль:()=>b.water<a.water}[t.sv];
   out.push({id:t.id,звук:ИГРАЛО.indexOf(t.сраб)>=0,удар:t.зов?true:b.hp<a.hp,действие:!!(дело&&дело()),слова:сказ.indexOf(t.бьёт)>=0});}
  s.oath=null;return out;});
 const плохиеЛ=л.filter(x=>!(x.звук&&x.удар&&x.действие&&x.слова));
 check('1. все десять ловушек Сводов: свой звук, удар, своё действие и свои слова',л.length===10&&!плохиеЛ.length,плохиеЛ);

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
    жар:()=>buffActive("мощь")&&G.mana===10+Number((t.match(/мана \+(\d+)/)||[0,0])[1])}[p.sv];
   out[p.id]={дело:!!(ok&&ok()),звук:ИГРАЛО.some(r=>/^potion_|^cast_potion/.test(r))};}
  while(activeLayer())closeTopUI();return out;});
 check('7. шесть зелий Сводов делают то, что говорят, и звучат склянкой',Object.values(з7).every(x=>x.дело&&x.звук),з7);

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
   glitch:()=>Svody.glitch("")};
  for(let круг=0;круг<6;круг++){
   for(const n of SVD.npcs){if(!s.quests[n.id])Svody.take(n.id);const q=s.quests[n.id];if(!q||q.done||итог[n.id])continue;
    const gold=G.gold;СКАЗАНО.length=0;сделать[n.задание.счёт]();
    if(s.quests[n.id].done){const t=СКАЗАНО.find(x=>/Поручение Сводов исполнено: «/.test(x)&&x.indexOf(n.задание.n)>=0)||"";
     const сказЗолото=Number((t.match(/\+(\d+) золота/)||[])[1]);
     итог[n.id]={золото:!!сказЗолото,реликвия:!n.награда.реликвия||s.relics.indexOf(n.награда.реликвия)>=0,печать:!n.награда.печать||s.seals.indexOf(n.награда.печать)>=0,сказано:!!t};}}}
  const нет=SVD.npcs.filter(n=>!итог[n.id]).map(n=>n.id);
  return {нет,плохие:Object.entries(итог).filter(([k,v])=>!(v.золото&&v.реликвия&&v.печать&&v.сказано)),золото:G.gold-g0};});
 check('8. все тринадцать поручений засчитываются своими делами, награда сказана и дана',!к.нет.length&&!к.плохие.length&&к.золото>0,к);

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

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
