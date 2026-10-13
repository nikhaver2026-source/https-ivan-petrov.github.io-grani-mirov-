/* ════════════════════════════════════════════════════════════════════════
   НАБОР 311: 15.0 — ТВАРИ НЕМОТЫ

   Семь родов Немоты стоят в общем порядке тварей: свой голос вида, род,
   роль на поле схватки, добыча; встают в полях Немоты вместо здешних зверей
   и в Немых штольнях по ярусам; особенности держатся в общих местах (удар
   героя, удар твари, начало боя), и у каждой есть способ её одолеть.
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
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__тихо=()=>{if(G.combat&&G.combat.monsterTimer)clearTimeout(G.combat.monsterTimer);safeFn(()=>Arena.stop());G.inCombat=false;G.combat=null;safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};
  window.__ci=n=>SPELLS.findIndex(s=>s.n===n);
  /* бой с тварью Немоты без поля схватки и без её собственного хода */
  window.__бой=(id,hp)=>{__тихо();const t=НЕМ_ТВАРЬ[id];const m=Object.assign({},t,{lvl:6,hp:hp||200,dmg:10,xp:80,gold:10});
   G.inCombat=true;G.combat={m,hp:m.hp,key:"t",own:false,alt:0};return G.combat;};
  G.hp=G.hpMax=900;G.manaMax=999;G.mana=999;safeFn(()=>Energy.ensure());G.will=99;G.willMax=99;
  for(const n of ["Искра",...НЕМ_ПРИЁМЫ.map(t=>t.n)])if(!G.spells.includes(n))G.spells.push(n);});

 /* ── 1. в общем порядке тварей: свой голос, род, роль на поле ── */
 const п=await page.evaluate(()=>{FoeVoices.map=null;const map=FoeVoices.build();const ключ=v=>v.idle+"#"+v.v+"@"+v.rate;
  const все={};for(const id of Object.keys(map)){const k=ключ(map[id]);(все[k]=все[k]||[]).push(id);}
  const нем=НЕМ_ТВАРИ.map(m=>({id:m.id,голос:ключ(FoeVoices.of(m)),род:foeFamily(m),роль:arenaRole(m)}));
  return {нем,делят:нем.filter(x=>(все[x.голос]||[]).length!==1).map(x=>x.id),вMONSTERS:MONSTERS.some(m=>m.нем)};});
 const роль=Object.fromEntries(п.нем.map(x=>[x.id,x.роль]));
 check('1. семь тварей Немоты: у каждой свой голос вида (ни с кем не делит), свой род; немохвост — хищник, страж-глушитель — громада, Владыка — колдун; в общий список охоты прежних заданий они не попадают',
  п.нем.length===7&&!п.делят.length&&роль.nem_hound==="fast"&&роль.nem_warden==="brute"&&роль.nem_lord==="caster"&&!п.вMONSTERS,п);

 /* ── 2. поля Немоты: вместо здешних зверей — её твари; вне полей — ни одной ── */
 const ж=await page.evaluate(()=>{G.place=null;
  /* Встречи зависят от часа мира, а новая игра начинается с часа, выведенного из настоящих часов: вечером
     доля тварей Немоты на этом клочке падала ниже половины, днём была выше. Считаем в полдень — всегда одинаково. */
  G.hour=12;safeFn(()=>contentCache.clear());let поле=0,нем=0,вне=0,немВне=0;
  for(let y=24645;y<=24665;y++)for(let x=24895;x<=24915;x++){const c=cellContent(x,y);if(c&&c.monster&&Немота.мир(x,y)>=2){поле++;if(c.monster.нем)нем++;}}
  for(let i=0;i<4000;i++){const x=24000+(i*37)%2000,y=24000+(i*91)%2000;if(Немота.мир(x,y)>0)continue;const c=cellContent(x,y);if(c&&c.monster){вне++;if(c.monster.нем)немВне++;}}
  return {поле,нем,вне,немВне};});
 check('2. в Сильвенской Тиши встречаются твари Немоты (больше половины встреч), вне полей Немоты — ни одной',ж.нем>0&&ж.нем*2>=ж.поле&&ж.вне>0&&ж.немВне===0,ж);

 /* ── 3. Немые штольни: свои твари по ярусам, страж седьмого — Владыка; прочие подземелья не тронуты ── */
 const ш=await page.evaluate(()=>{const p0=G.place;
  G.place={kind:"dungeon",bx:24936,by:25289,stype:"cave_entrance",depth:1,name:"Немые штольни",x:1,y:1};const я1=dungeonPool(MONSTERS.slice(0,3)).map(m=>m.id);
  G.place.depth=4;const я4=dungeonPool(MONSTERS.slice(0,3)).map(m=>m.id);
  const с1=guardianAt(24936,25289,1),с7=guardianAt(24936,25289,7);
  G.place={kind:"dungeon",bx:3100,by:3100,stype:"ruins",depth:4,name:"р",x:1,y:1};const чужой=dungeonPool(MONSTERS.filter(m=>m.biomes.includes("cave"))).some(m=>m.нем);
  const чужСтраж=guardianAt(3100,3100,4);const глубь=(G.place.depth=70,dungeonPool(MONSTERS.filter(m=>m.biomes.includes("cave"))).some(m=>m.нем));
  G.place=p0;return {я1,я4,с1:с1&&c1n(с1),с7:с7&&с7.n,с7нем:с7&&с7.нем,с7ур:с7&&с7.lvl,чужой,чужСтраж:!!(чужСтраж&&чужСтраж.нем),глубь};
  function c1n(g){return g.n+" / "+g.нем;}});
 check('3. в Немых штольнях водятся только твари Немоты (с четвёртого яруса — и страж-глушитель), шахту седьмого яруса стережёт Владыка Немоты; в обычном подземелье прежние твари, и лишь на глубоких ярусах с Немотой к ним прибавляются её',
  ш.я1.every(id=>/^nem_/.test(id))&&ш.я4.includes("nem_warden")&&/Владыка Немоты/.test(ш.с7||"")&&ш.с7нем==="lord"&&!ш.чужой&&!ш.чужСтраж&&ш.глубь,ш);

 /* ── 4. искроед ест чары школ; «Погасить свойство» отнимает голод ── */
 const и=await page.evaluate(()=>{G.place=null;G.x=25000;G.y=25000;const cb=__бой("nem_sparkeater",200);cb.hp=150;G.mana=500;G.spellCD={};
  __said=[];castSpell(__ci("Искра"));const o={hp1:cb.hp,слова:__said.join(" | ").slice(0,200),мана:500-G.mana};
  G.will=99;G.spellCD={};__said=[];castSpell(__ci("Погасить свойство"));o.голод=!!cb.немГолодСнят;o.слова2=__said.join(" | ").slice(0,200);
  const h=cb.hp;G.mana=500;G.spellCD={};__said=[];castSpell(__ci("Искра"));o.hp3=cb.hp;o.ранен=cb.hp<h;__тихо();return o;});
 check('4. искроед втягивает чару школы (мана ушла, ему прибавилось здоровья); «Погасить свойство» гасит голод — и та же чара уже ранит',
  и.hp1>150&&и.мана>0&&/втянул вашу чару/.test(и.слова)&&и.голод&&/голод погашен/.test(и.слова2)&&и.ранен,и);

 /* ── 5. рой тиши: клинок вязнет, «Развеять тишью» рассыпает ── */
 const р=await page.evaluate(()=>{const cb=__бой("nem_swarm",300);const клинок=Undead.onHit(cb.m,20);G.will=99;G.spellCD={};
  const h=cb.hp;__said=[];castSpell(__ci("Развеять тишью"));const o={клинок,развеял:h-cb.hp,слова:__said.join(" | ").slice(0,160)};__тихо();return o;});
 check('5. рой тиши: удар оружием вполсилы (20 → 10), «Развеять тишью» бьёт его тяжело',р.клинок===10&&р.развеял>=15&&/Рой рассыпается/.test(р.слова),р);

 /* ── 6. страж-глушитель: поле на ступень глубже, панцирь, «Расшатать», «Перегрузить» ── */
 const с=await page.evaluate(()=>{G.place=null;G.x=25000;G.y=25000;__тихо();const вне=Немота.здесь();const cb=__бой("nem_warden",400);
  const o={вне,вБою:Немота.здесь(),панцирь:Undead.onHit(cb.m,20)};cb.zvBreak=2;o.расшатан=Undead.onHit(cb.m,20);cb.zvBreak=0;
  G.will=99;G.spellCD={};const h=cb.hp;__said=[];castSpell(__ci("Перегрузить"));o.урон=h-cb.hp;o.оцеп=Number(cb.svStun)||0;o.поле=Немота.здесь();o.слова=__said.join(" | ").slice(0,200);__тихо();return o;});
 check('6. страж-глушитель: в бою с ним Немота на ступень глубже, панцирь гасит три (20 → 17), после «Расшатать» удар полный; «Перегрузить» рвёт его глушитель — урон, оцепенение на два хода, поле гаснет',
  с.вне===0&&с.вБою===1&&с.панцирь===17&&с.расшатан===20&&с.урон>=20&&с.оцеп>=2&&с.поле===0&&/Глушитель в груди стража лопнул/.test(с.слова),с);

 /* ── 7. немохвост: глушащий укус удваивает цену чар школ; на звук чары в Немоте он приходит сам ── */
 const н=await page.evaluate(async()=>{G.place=null;G.x=25000;G.y=25000;const cb=__бой("nem_hound",300);const искра=SPELLS[__ci("Искра")];const k0=Power.spellK(искра);
  const ор=Math.random;Math.random=()=>0.1;Undead.onStrike(cb.m,10);Math.random=ор;const o={заглушка:cb.немЗаглушка,k:Power.spellK(искра)/k0};
  G.mana=500;G.spellCD={};castSpell(__ci("Искра"));o.после=cb.немЗаглушка;__тихо();
  const z=Zones.all().find(z=>z.правило==="silence");G.x=z.x;G.y=z.y;Немота.ст().зов=0;G.mana=500;
  Math.random=()=>0.05;__said=[];castSpell(__ci("Искра"));Math.random=ор;await new Promise(r=>setTimeout(r,1500));
  o.пришёл=!!(G.combat&&G.combat.m&&G.combat.m.нем==="hound");o.слова=__said.filter(t=>/немохвост/.test(t)).slice(0,1);__тихо();return o;});
 check('7. глушащий укус немохвоста: две следующие чары школ вдвое дороже (после одной чары остаётся одна); чара школы в поле Немоты зовёт немохвоста — он выходит на звук',
  н.заглушка===2&&Math.abs(н.k-2)<0.01&&н.после===1&&н.пришёл&&н.слова.length===1,н);

 /* ── 8. выгоревший: жадное касание, купол тиши, Приют Тишайших ── */
 const в=await page.evaluate(async()=>{const cb=__бой("nem_burnt",200);cb.hp=150;G.mana=50;Undead.onStrike(cb.m,10);const o={мана:50-G.mana,лечился:cb.hp-150};
  cb.немКупол=3;G.mana=50;Undead.onStrike(cb.m,10);o.подКуполом=50-G.mana;cb.немКупол=0;
  G.standing=G.standing||{};G.standing["guild:priyut"]=30;const xp=G.xp;cb.hp=40;updateCombat();await new Promise(r=>setTimeout(r,900));
  o.сдался=!G.combat;o.опыт=G.xp-xp;o.приют=standOf("guild","priyut");__тихо();return o;});
 check('8. выгоревший: касание забирает три маны и лечит его; под куполом тиши — ничего; при доверии Приюта Тишайших раненый опускает руки: бой окончен миром, половина опыта, Приют ценит выше',
  в.мана===3&&в.лечился===3&&в.подКуполом===0&&в.сдался&&в.опыт>0&&в.приют>30,в);

 /* ── 9. слухач: бежит раненым; упущенный — тревога в штольнях ── */
 const л=await page.evaluate(async()=>{__тихо();G.place=null;const t=НЕМ_ТВАРЬ.nem_listener;startCombat({x:G.x,y:G.y,monster:Object.assign({},t,{lvl:3,hp:60,dmg:5,xp:20,gold:5})});
  const o={трус:!!(G.combat&&G.combat.arena&&G.combat.arena.coward)};Немота.ст().тревога=0;Arena.foeEscaped();o.тревога=Немота.ст().тревога;
  G.place={kind:"dungeon",bx:24936,by:25289,stype:"cave_entrance",depth:2,name:"Немые штольни",x:1,y:1};
  const m=Undead.prep(Object.assign({},НЕМ_ТВАРЬ.nem_swarm,{lvl:3,hp:50,dmg:6}),2);o.ур=m.lvl;o.предупреждён=!!m.предупреждён;o.послеТревога=Немота.ст().тревога;G.place=null;__тихо();return o;});
 check('9. слухач Немоты бежит раненым; упущенный — поднимает тревогу: следующая тварь штолен выходит на два уровня сильнее, и тревога тратится',
  л.трус&&л.тревога===1&&л.ур===5&&л.предупреждён&&л.послеТревога===0,л);

 /* ── 10. Владыка Немоты: колдун, слово тишины, вбирает тишину один раз ── */
 const вл=await page.evaluate(async()=>{const cb=__бой("nem_lord",400);const o={маг:Немота.маг(cb.m),ест:НемТвари.ест(cb)};G.mana=50;cb.немРод="bolt";Undead.onStrike(cb.m,10);o.слово=50-G.mana;
  cb.hp=190;updateCombat();await new Promise(r=>setTimeout(r,900));o.вобрал=cb.hp-190;cb.hp=150;updateCombat();await new Promise(r=>setTimeout(r,900));o.второй=cb.hp-150;__тихо();return o;});
 check('10. Владыка Немоты — колдун (против него работает «Перегрузить»), ест чары, его слово тишины гасит шесть маны; на половине здоровья один раз вбирает тишину',
  вл.маг&&вл.ест&&вл.слово===6&&вл.вобрал===60&&вл.второй===0,вл);

 /* ── 11. начало боя называет тварь и способ; бестиарий; добыча ── */
 const б=await page.evaluate(async()=>{__тихо();G.place=null;Немота.ст().твари={};__said=[];const t=НЕМ_ТВАРЬ.nem_sparkeater;
  startCombat({x:G.x,y:G.y,monster:Object.assign({},t,{lvl:3,hp:60,dmg:5,xp:20,gold:5})});await new Promise(r=>setTimeout(r,2200));
  const o={слово:__said.filter(t=>/Тварь Немоты/.test(t)).slice(0,1)};__тихо();
  renderBestiary();const h=document.getElementById("bestList").innerHTML;o.бест=(h.match(/nemvoice:/g)||[]).length;o.раздел=/Твари Немоты/.test(h);
  o.добыча=НЕМ_ТВАРИ.every(m=>Spoils.list(m).some(([r])=>SPOIL_PRICE[r]>0));o.род=(RES_KIND_BY_RES["тишь-смола"]||{}).id;o.сердце=Spoils.roll(Object.assign({},НЕМ_ТВАРЬ.nem_lord,{lvl:16}),()=>0.99).includes("сердце Немоты");return o;});
 check('11. в начале первого боя тварь названа, с умениями и способом её взять; в бестиарии раздел «Твари Немоты» с голосами всех семи; у каждой своя добыча с ценой (тишь-смола — в прежнем роде «трофеи тварей»), с Владыки всегда — «сердце Немоты»',
  б.слово.length===1&&/Чем взять/.test(б.слово[0])&&б.бест===7&&б.раздел&&б.добыча&&б.род==="trophy"&&б.сердце,б);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
