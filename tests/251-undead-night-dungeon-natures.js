/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 251: 9.5 — НЕЖИТЬ, НОЧЬ, ТРОФЕИ И СВОЙСТВА ПОДЗЕМЕЛИЙ

   Просьбы игрока:
   • больше нежити — вампиры, мертвецы и прочие, свой бог, игра за нежить;
   • ночью своя, мрачная музыка; нежить выходит на дороги, с неё падает своё;
   • нежить разных уровней в подземельях, со своими атаками, чарами, умениями;
   • с тварей падают свои ресурсы — обычные и редкие; с рунных големов —
     руны, и чем лучше руна, тем реже;
   • подземелья разные: «твари встречаются на 15% реже», «раны заживают
     быстрее», «тайников на 30% меньше», свои усиления и ослабления.

   1. Четырнадцать видов нежити: у каждого мифология, повадки, голос, род и
      умения; ступени от первого уровня до шестнадцатого.
   2. Бог нежити Навий: в пантеоне (свой день круга, досье, голос) и
      покровитель трёх народов нежити; народы выбираются в начале пути.
   3. Герою-нежити не нужны еда и вода; лекарь живых мёртвых не лечит;
      вампир пьёт кровь ударом; лич встаёт раз в бою (филактерия).
   4. Умения в бою: кровопийство лечит тварь, скелет держит режущее, лич
      встаёт снова.
   5. Ночью на дороге поднимается нежить по уровню героя; днём — нет.
   6. Ночью наверху своя тема, днём — дневная.
   7. Трофеи: у вида и рода свои; руны голема — чем лучше, тем реже.
   8. Свойства подземелий: у разных подземелий разные числа и знаки места;
      числа работают (ловушки, твари, раскладка), звучат в описании яруса.
   9. Нежить в подземелье: старшая — глубже.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.clock="steps";
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};});

 /* ── 1 ── */
 const п1=await p.evaluate(()=>{const u=MONSTERS.filter(m=>m.нежить);
  return {n:u.length,безЛора:u.filter(m=>!MONSTER_LORE[m.id]).map(m=>m.id),безПовадок:u.filter(m=>!m.нрав||!m.био).map(m=>m.id),
   безГолоса:u.filter(m=>!MONSTER_VOICE[m.id]).map(m=>m.id),безУмений:u.filter(m=>!UNDEAD_ABIL[m.id]).map(m=>m.id),
   роды:[...new Set(u.map(m=>foeFamily(m)))],мин:Math.min(...u.map(m=>m.min)),макс:Math.max(...u.map(m=>m.max)),
   вампир:u.some(m=>m.id==="vampire"),лич:u.some(m=>m.id==="lich")};});
 check('1. четырнадцать видов нежити: мифология, повадки, голос, род и умения; ступени с первого по шестнадцатый уровень',
  п1.n===14&&!п1.безЛора.length&&!п1.безПовадок.length&&!п1.безГолоса.length&&!п1.безУмений.length&&п1.мин===1&&п1.макс===16&&п1.вампир&&п1.лич
  &&["bone","undead","spirit"].every(r=>п1.роды.includes(r)),п1);

 /* ── 2 ── */
 const п2=await p.evaluate(()=>{const g=Gods.byId("navy");
  const народы=RACES_DB.filter(r=>r.god==="navy").map(r=>r.n);
  const кнопки=(()=>{G.raceChosen=0;G.level=1;G.quests=[];G.day=1;openRacePick();const b=[...document.querySelectorAll('#racePickBody [data-cmd^="racepick:"]')].map(x=>x.dataset.cmd);while(activeLayer())closeTopUI();return b;})();
  return {бог:g&&g.n,день:g&&g.праздник,звук:g&&!!SOUND_BANK[g.звук],вкруге:GODS_ALL.includes(g),покровитель:godOfRace("Вампиры").id,народы,
   выбор:["racepick:undead","racepick:vampire","racepick:lichkin"].every(c=>кнопки.includes(c)),ветви:raceInfo("Ночные графы").id,клан:CLAN_BY_NAME["Бледный Двор"]&&CLAN_BY_NAME["Бледный Двор"].god};});
 check('2. Навий — бог нежити: в пантеоне со своим днём и голосом, покровитель трёх народов нежити; их можно выбрать в начале пути',
  п2.бог==="Навий Бессмертный"&&п2.день===96&&п2.звук&&п2.вкруге&&п2.покровитель==="navy"&&п2.народы.length===3&&п2.выбор&&п2.ветви==="vampire"&&п2.клан==="navy",п2);

 /* ── 3 ── */
 const п3=await p.evaluate(()=>{const r={};const было=G.race;
  G.race="Неупокоенные";settings.survival="full";const S=Survival.state();S.hunger=50;S.thirst=50;
  const cm=settings.clock;settings.clock="real";Body.tick(1);settings.clock=cm;r.голод=S.hunger;r.жажда=S.thirst;
  /* лекарь */
  SAID.length=0;const h={key:"t251h",name:"Целительница",prof:"Целительница",x:0,y:0};
  window.getNPCByKey=(k=>key=>key==="t251h"?h:k(key))(window.getNPCByKey);G.hp=10;G.hpMax=100;
  /* (9.5.1) Записанный ответ лекарь говорит своим голосом (Folk.ответ) — его текст тоже считается сказанным. */
  if(typeof Folk!=="undefined"&&Folk.ответ&&!Folk.__t251){const f0=Folk.ответ.bind(Folk);Folk.ответ=function(n,t,o){SAID.push(String(t));return f0(n,t,o);};Folk.__t251=1;}
  healerHeal("t251h","gold");r.лекарь=SAID.join(" | ").slice(0,160);r.hp=G.hp;
  /* вампир пьёт кровь */
  G.race="Вампиры";G.hp=50;G.combat={m:{id:"wolf",n:"Волк",hp:100},hp:100};r.удар=Undead.onHit(G.combat.m,30);r.кровь=G.hp;
  /* лич: филактерия */
  G.race="Личи";G.hp=5;G.combat={m:{id:"wolf",n:"Волк",hp:100},hp:100};const d=Undead.onStrike(G.combat.m,50);r.лич={d,hp:G.hp};
  G.combat=null;G.race=было;return r;});
 check('3. нежити не нужны еда и вода; лекарь живых не лечит; вампир пьёт кровь ударом; лич встаёт раз в бою',
  п3.голод===0&&п3.жажда===0&&/Мёртвых я не лечу/.test(п3.лекарь)&&п3.hp===10&&п3.кровь>50&&п3.лич.d===0&&п3.лич.hp===25,п3);

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{const r={};G.race="Люди";G.place=null;
  const вамп={...MONSTERS.find(m=>m.id==="vampire"),lvl:6,hp:100};G.combat={m:вамп,hp:40};
  Undead.onStrike(вамп,20);r.вампир=G.combat.hp;
  const ск={...MONSTERS.find(m=>m.id==="skeleton"),lvl:2,hp:30};G.combat={m:ск,hp:30};
  const старое=G.equip.weapon;G.equip.weapon={name:"Меч",type:"Меч",val:5};r.меч=Undead.onHit(ск,10);
  G.equip.weapon={name:"Булава",type:"Булава",val:5};r.кл=weaponClass();r.булава=Undead.onHit(ск,10);G.equip.weapon=старое;
  const лич={...MONSTERS.find(m=>m.id==="lich"),lvl:12,hp:200};const cb={m:лич,hp:0};r.встал=Undead.rise(cb);r.hpЛича=cb.hp;r.второй=Undead.rise(cb);
  G.combat=null;return r;});
 check('4. умения нежити в бою: вампир лечится кровью, скелет держит режущее и ломается от дробящего, лич встаёт снова — один раз',
  п4.вампир>40&&п4.меч===8&&(п4.кл!=="mace"||п4.булава===13)&&п4.встал===true&&п4.hpЛича===100&&п4.второй===false,п4);

 /* ── 5 ── */
 const п5=await p.evaluate(()=>{const r={};G.place=null;G.level=7;G.inCombat=false;G.combat=null;
  const c=cellContent(G.x,G.y);
  G.hour=23;r.ночью=NightDead.can(c)||!!c.structure;const m=NightDead.pick(c,()=>0.5);r.m={id:m.id,lvl:m.lvl,min:m.min,нежить:Undead.is(m)};
  r.новичку=[...new Set(Array.from({length:200},(_, i)=>{G.level=1;return NightDead.pick(c).id;}))];
  G.hour=12;r.днём=NightDead.can(c);G.level=7;return r;});
 check('5. ночью на дороге поднимается нежить по уровню героя (новичку — младшая), днём — нет',
  п5.ночью&&п5.m.нежить&&п5.m.lvl>=п5.m.min&&п5.днём===false&&п5.новичку.length>0,п5);
 const п5б=await p.evaluate(ids=>ids.every(id=>MONSTERS.find(m=>m.id===id).min<=3),п5.новичку);
 check('5б. новичку ночью попадается только младшая нежить (ступень не выше третьей)',п5б,п5.новичку);

 /* ── 6 ── */
 const п6=await p.evaluate(()=>{G.place=null;G.inCombat=false;G.hour=23;const ночь=Music.dayNight("forest");G.hour=12;const день=Music.dayNight("forest");
  G.hour=23;G.place={kind:"dungeon",depth:1,bx:1,by:1};const под=Music.dayNight("forest");G.place=null;G.hour=12;
  return {ночь,день,под,есть:!!SOUND_BANK[Music.NIGHT_ROLE[ночь]]};});
 check('6. ночью наверху своя мрачная тема, днём — дневная, под землёй ночь музыку не меняет',
  п6.ночь==="night_wood"&&п6.день==="forest"&&п6.под==="forest"&&п6.есть,п6);

 /* ── 7 ── */
 const п7=await p.evaluate(()=>{const r={};
  const лест=RUNE_LADDER.map(x=>x[1]);r.убывает=лест.every((v,i)=>i===0||v<лест[i-1]);
  r.дороже=RUNE_LADDER.every((x,i)=>i===0||RES_BASE[x[0]]>RES_BASE[RUNE_LADDER[i-1][0]]);
  const g={id:"golem",lvl:5};const счёт={};let n=0;const rnd=()=>{n=(n*9301+49297)%233280;return n/233280;};
  for(let i=0;i<30000;i++)Spoils.roll(g,rnd).forEach(x=>счёт[x]=(счёт[x]||0)+1);r.счёт=счёт;
  r.лич=Spoils.list({id:"lich"}).map(x=>x[0]);r.волк=Spoils.list({id:"wolf"}).map(x=>x[0]);
  r.род=(RES_KIND_BY_RES["вампирья кровь"]||{}).id;r.руна=(RES_KIND_BY_RES["руна Предтеч"]||{}).id;
  G.inv=G.inv||{};const до=JSON.stringify(G.inv);let т="";for(let i=0;i<30&&!т;i++)т=Spoils.fromKill({id:"vampire",n:"Вампир",lvl:8});r.т=т;
  return r;});
 const с=п7.счёт;
 check('7. трофеи: у вида и рода свои; руны голема — чем лучше, тем реже и дороже; трофей ложится в котомку и называется',
  п7.убывает&&п7.дороже&&с["простая руна"]>с["руна стихий"]&&с["руна стихий"]>с["руна силы"]&&с["руна силы"]>(с["древняя руна"]||0)&&(с["древняя руна"]||0)>(с["руна Предтеч"]||0)
  &&п7.лич.includes("фрагмент филактерии")&&п7.волк.includes("целый клык")&&п7.род==="grave"&&п7.руна==="rune"&&/Трофеи:/.test(п7.т),п7);

 /* ── 8 ── */
 const п8=await p.evaluate(()=>{const r={};const тексты=new Set(),наборы=new Set();let знаков=0;
  for(let i=0;i<40;i++){const pl={bx:1000+i*37,by:2000+i*53,depth:3+(i%30),stype:"ruins"};const n=DNature.of(pl);
   тексты.add(DNature.text(pl));наборы.add(n.свойства.map(s=>s.id).sort().join());знаков+=n.знаки.length;}
  r.разных=тексты.size;r.наборов=наборы.size;r.знаков=знаков;
  /* числа работают: ловушки и бродячие твари */
  const pl={bx:1000,by:2000,depth:5,stype:"ruins"};const n=DNature.of(pl);r.пример=DNature.text(pl);
  r.проценты=n.свойства.every(s=>s.p>=10&&s.p<=40&&/\d+%/.test(s.текст));
  DNature._c[DNature.key(pl)]={свойства:[{id:"traps",k:0.5,p:50,текст:"ловушек на 50% меньше"},{id:"chests",k:1.5,p:50,текст:"тайников и сундуков на 50% больше"}],знаки:[],d:5,кинд:""};
  r.ловушки=DNature.k("traps",pl);r.сундуки=DNature.count(4,"chests",pl.bx,pl.by,pl.depth,pl.stype);
  /* описание яруса */
  G.place={kind:"dungeon",bx:1000,by:2000,depth:5,stype:"ruins",x:2,y:2,name:"x"};r.описание=/Свойства подземелья: ловушек на 50% меньше/.test(safeFn(()=>describeHere(true),""));
  delete DNature._c[DNature.key(pl)];G.place=null;return r;});
 check('8. у подземелий разные свойства с процентами и знаки места; числа работают и звучат в описании яруса',
  п8.разных>=30&&п8.наборов>=10&&п8.знаков>0&&п8.проценты&&п8.ловушки===0.5&&п8.сундуки===6&&п8.описание,п8);

 /* ── 9 ── */
 const п9=await p.evaluate(()=>{const ids=d=>{G.place={kind:"dungeon",bx:5,by:5,depth:d,stype:"ruins"};return [...new Set(Undead.pool(MONSTERS.filter(m=>m.biomes.includes("cave"))).filter(m=>m.нежить).map(m=>m.id))];};
  const r={мелко:ids(1),глубоко:ids(20)};G.place=null;
  const m=Undead.prep({...MONSTERS.find(x=>x.id==="lich"),lvl:3,hp:50,dmg:5,xp:10,gold:5},20);r.лич=m.lvl;return r;});
 check('9. в подземелье нежить по глубине: мелко — младшая, глубоко — лич и старейшина; уровень не ниже ступени вида',
  !п9.мелко.includes("lich")&&п9.мелко.length>0&&п9.глубоко.includes("lich")&&п9.глубоко.includes("vampirelord")&&п9.лич>=10,п9);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
