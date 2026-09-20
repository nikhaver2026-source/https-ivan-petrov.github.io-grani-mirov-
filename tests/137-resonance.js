/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 137: РЕЗОНАНС — СОГЛАСИЕ ГЕРОЯ, ВЕЩИ И ЧАРЫ (§8 мастер-промпта)

   Заклинание не висит в пустоте: его творит ЭТОТ герой, держа в руках ЭТУ
   вещь. §8 требует считать совместимость, устойчивость, цену и вероятность
   побочного действия — и чтобы всё это было настоящим, а не украшением.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Восемнадцать стихий связаны попарно; родство и рознь ВЗАИМНЫ, одна
      пара не бывает разом и роднёй и рознью, стихия не в связи с собой.
   2. Склад героя считается из того, что у него есть: выученные чары,
      носимые вещи, равновесие мира. Ничего не берётся из воздуха.
   3. Стихия вещи читается сперва по её свойствам, потом по направлению.
   4. Четыре числа считаются для любой чары и не выходят за берега.
   5. Согласие вправду меняется: своя стихия дороже нуля, враждебная ниже.
   6. Цена и сила слушают согласие в разные стороны.
   7. Срыв падает с ростом согласия.
   8. Шесть родов срыва, и каждый ВПРАВДУ что-то делает.
   9. Отдача слышна в ударе, в защите и в цене чар.
  10. Цена чары в бою вправду умножается на резонанс.
  11. Панель магии называет согласие до траты маны.
  12. Самопроверка мира держит строку «resonance»; глава, README и docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(String(r));return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. связи стихий ── */
 const связи=await page.evaluate(()=>{
  const невзаимныеР=[],невзаимныеРо=[],иТоИДругое=[],сама=[];
  Object.keys(RESO_BOND).forEach(a=>{
   (RESO_BOND[a].родня||[]).forEach(b=>{
    if(!(RESO_BOND[b]&&(RESO_BOND[b].родня||[]).indexOf(a)>=0))невзаимныеР.push(a+"→"+b);
    if((RESO_BOND[a].рознь||[]).indexOf(b)>=0)иТоИДругое.push(a+"/"+b);});
   (RESO_BOND[a].рознь||[]).forEach(b=>{
    if(!(RESO_BOND[b]&&(RESO_BOND[b].рознь||[]).indexOf(a)>=0))невзаимныеРо.push(a+"→"+b);});
   if((RESO_BOND[a].родня||[]).indexOf(a)>=0||(RESO_BOND[a].рознь||[]).indexOf(a)>=0)сама.push(a);});
  return {сколько:Object.keys(RESO_BOND).length,
   безСвязи:SPELL_ELEMENTS.filter(e=>!RESO_BOND[e.id]).map(e=>e.id),
   невзаимныеР,невзаимныеРо,иТоИДругое,сама,
   огоньВода:Resonance.связь(ELEM_BY_ID.e_fire,ELEM_BY_ID.e_water),
   огоньГроза:Resonance.связь(ELEM_BY_ID.e_fire,ELEM_BY_ID.e_storm),
   огоньОгонь:Resonance.связь(ELEM_BY_ID.e_fire,ELEM_BY_ID.e_fire),
   огоньРазум:Resonance.связь(ELEM_BY_ID.e_fire,ELEM_BY_ID.e_mind)};});
 check('восемнадцать стихий, и у каждой свои связи',
  связи.сколько===18&&связи.безСвязи.length===0,связи);
 check('родство взаимно: односторонней приязни у стихий не бывает',
  связи.невзаимныеР.length===0,связи.невзаимныеР);
 check('рознь взаимна тоже',связи.невзаимныеРо.length===0,связи.невзаимныеРо);
 check('одна пара не бывает разом и роднёй и рознью, и стихия не в связи с собой',
  связи.иТоИДругое.length===0&&связи.сама.length===0,связи);
 check('связь считается по четырём ступеням: своя, родная, чужая, враждебная',
  связи.огоньОгонь===1&&связи.огоньГроза===0.5&&связи.огоньРазум===0&&связи.огоньВода<0,связи);

 /* ── 2. склад героя из того, что у него есть ── */
 const склад=await page.evaluate(()=>{
  const было={spells:G.spells,arts:G.artifacts,order:G.order};
  const o={};
  G.spells=[];G.artifacts=[];G.order=0;
  o.пустой=Object.keys(Resonance.склад()).length;
  o.безСтихии=Resonance.своя();
  /* Выученные чары кладут свой вес. */
  G.spells=SCHOOL_SPELLS.filter(s=>s.school==="fire").map(s=>s.n);
  o.огненный=(Resonance.своя()||{}).id;
  /* Равновесие тоже слышно. */
  G.spells=[];G.order=80;
  o.порядок=(Resonance.своя()||{}).id;
  G.order=-80;
  o.хаос=(Resonance.своя()||{}).id;
  /* Вещь добавляет свой вес, но меньше чары. */
  G.order=0;G.spells=[];
  G.artifacts=[ART.make({дом:"elem",ранг:3,seed:11})];
  o.отВещи=(Resonance.своя()||{}).id;
  o.весВещи=Resonance.склад();
  G.spells=было.spells;G.artifacts=было.arts;G.order=было.order;
  return o;});
 check('без чар, вещей и равновесия склад героя пуст и стихии у него нет',
  склад.пустой===0&&склад.безСтихии===null,склад);
 check('выученные огненные чары делают героя огненным',склад.огненный==="e_fire",склад);
 check('порядок и хаос в мире тоже слышны в складе',
  склад.порядок==="e_order"&&склад.хаос==="e_chaos",склад);
 check('вещь силы кладёт свой вес в склад',
  !!склад.отВещи&&Object.keys(склад.весВещи).length>0,склад);

 /* ── 3. стихия вещи: сперва свойства, потом направление ── */
 const вещи=await page.evaluate(()=>{
  const o={};
  /* Направление без говорящих свойств читается по направлению. */
  const все=ART_DIRS.map(d=>({дом:d.id,стихия:(Resonance.вещьСтихия(ART.make({дом:d.id,ранг:1,seed:7}))||{}).id}));
  o.поНаправлению=все;
  o.безСтихии=все.filter(x=>!x.стихия).map(x=>x.дом);
  /* Свойство громче направления: воинская вещь со школой льда звучит льдом. */
  const a=ART.make({дом:"war",ранг:3,seed:3});
  a.база={"шк_лёд":9,"сопр_лёд":0.2};
  o.поСвойству=(Resonance.вещьСтихия(a)||{}).id;
  o.направлениеВоенной=RESO_DIR_ELEM.war;
  o.статы=Object.keys(RESO_STAT_ELEM).filter(k=>!ART_STAT_BY_ID[k]);
  return o;});
 check('у каждого из тринадцати направлений вещи есть своя стихия',
  вещи.безСтихии.length===0&&вещи.поНаправлению.length===13,вещи);
 check('свойство вещи громче её направления: ледяная воинская звучит льдом',
  вещи.поСвойству==="e_ice"&&вещи.направлениеВоенной==="e_fire",вещи);
 check('все свойства, по которым читается стихия, в игре есть',вещи.статы.length===0,вещи.статы);

 /* ── 4–7. четыре числа, и они вправду меняются ── */
 const числа=await page.evaluate(()=>{
  const было={spells:G.spells,arts:G.artifacts,order:G.order};
  const огонь=SPELLS.find(x=>x.n==="Искра запала");
  const o={};
  /* Ничего своего: согласие около нуля. */
  G.spells=[];G.artifacts=[];G.order=0;G.mast={};
  o.ровно=Resonance.of(огонь);
  /* Герой огненный: согласие вверх. */
  G.spells=SCHOOL_SPELLS.filter(s=>s.school==="fire").map(s=>s.n);
  o.свой=Resonance.of(огонь);
  /* Герой ледяной: огонь ему наперекор. */
  G.spells=SCHOOL_SPELLS.filter(s=>s.school==="crystal").map(s=>s.n);
  o.чужой=Resonance.of(огонь);
  /* Берега соблюдены у всех ста двух школьных чар. */
  const вне=[];
  SCHOOL_SPELLS.forEach(sp=>{const r=Resonance.of(SPELLS.find(x=>x.n===sp.n)||sp);
   if(!(r.согласие>=-1&&r.согласие<=1&&r.устойчивость>0&&r.устойчивость<1
     &&r.ценаK>=0.75&&r.ценаK<=1.4&&r.силаK>=0.8&&r.силаK<=1.25
     &&r.срыв>=0&&r.срыв<=0.45))вне.push(sp.n);});
  o.вне=вне;
  o.слово=Resonance.слово(огонь);
  G.spells=было.spells;G.artifacts=было.arts;G.order=было.order;
  return o;});
 check('своя стихия даёт согласие выше, чем никакая; враждебная — ниже нуля',
  числа.свой.согласие>числа.ровно.согласие&&числа.чужой.согласие<0,
  {ровно:числа.ровно.согласие,свой:числа.свой.согласие,чужой:числа.чужой.согласие});
 check('цена и сила слушают согласие в разные стороны',
  числа.свой.ценаK<числа.ровно.ценаK&&числа.чужой.ценаK>числа.ровно.ценаK
  &&числа.свой.силаK>числа.ровно.силаK&&числа.чужой.силаK<числа.ровно.силаK,
  {ценаK:[числа.чужой.ценаK,числа.ровно.ценаK,числа.свой.ценаK],
   силаK:[числа.чужой.силаK,числа.ровно.силаK,числа.свой.силаK]});
 check('устойчивость растёт с согласием, а срыв падает',
  числа.свой.устойчивость>числа.чужой.устойчивость&&числа.свой.срыв<числа.чужой.срыв,
  {уст:[числа.чужой.устойчивость,числа.свой.устойчивость],
   срыв:[числа.чужой.срыв,числа.свой.срыв]});
 check('все сто два школьных заклинания держатся в берегах',числа.вне.length===0,числа.вне);
 check('четыре числа называются одной строкой словами',
  /согласие|в лад|складно|ровно|туго|наперекор/.test(числа.слово)
  &&/устойчивость/.test(числа.слово)&&/мана ×/.test(числа.слово)&&/срыв/.test(числа.слово),числа.слово);

 /* ── 8. шесть срывов, и каждый вправду делает дело ── */
 const срывы=await page.evaluate(()=>{
  const мёртвые=[],слова={};
  RESO_BREAKS.forEach(b=>{
   G.hp=300;G.hpMax=300;G.mana=300;G.manaMax=300;G.buffs={};G.spellCD={};
   G.hour=10;G.day=5;G.order=0;G.spells=SCHOOL_SPELLS.slice(0,4).map(s=>s.n);
   const до=JSON.stringify([G.hp,G.mana,G.hour,G.day,G.buffs,G.spellCD,G.order]);
   const слово=String(b.делать(0.8)||"");
   const после=JSON.stringify([G.hp,G.mana,G.hour,G.day,G.buffs,G.spellCD,G.order]);
   if(!слово.trim()||до===после)мёртвые.push(b.id+" → "+слово);else слова[b.id]=слово;});
  return {сколько:RESO_BREAKS.length,мёртвые,слова,
   безЗвука:RESO_BREAKS.filter(b=>!SOUND_BANK[b.звук]).map(b=>b.id),
   безСрыва:SPELL_ELEMENTS.filter(e=>!RESO_BREAK_BY_ELEM[e.id]).map(e=>e.id),
   уник:new Set(RESO_BREAKS.map(b=>b.id)).size};});
 check('шесть родов срыва, у каждого своя настоящая запись',
  срывы.сколько===6&&срывы.уник===6&&срывы.безЗвука.length===0,срывы);
 check('у каждой из восемнадцати стихий есть свой срыв',срывы.безСрыва.length===0,срывы.безСрыва);
 check('§38: каждый срыв вправду меняет состояние мира, а не только говорит',
  срывы.мёртвые.length===0,срывы.мёртвые);
 check('каждый срыв говорит своими словами',
  new Set(Object.values(срывы.слова)).size===6,Object.values(срывы.слова).slice(0,2));

 /* ── 9. отдача слышна в ударе, защите и цене чар ── */
 const отдача=await page.evaluate(()=>{
  /* Морока из прошлой проверки могла оставить чару на перезарядке: часы
     плетения сбрасываются, иначе меряется не цена, а молчание. */
  G.buffs={};G.spellCD={};G.mana=300;G.manaMax=300;G.hp=300;G.hpMax=300;
  G.artifacts=[];G.order=0;
  const a0=atk(),d0=def();
  buffSet("отдача",3);
  const a1=atk(),d1=def();
  /* Цена чары при отдаче выше. */
  const sp=SPELLS.find(x=>x.n==="Искра запала");
  G.spells=[sp.n];G.mana=300;
  const до1=G.mana;castSpell(SPELLS.indexOf(sp));const сОтдачей=до1-G.mana;
  G.buffs={};G.spellCD={};G.mana=300;
  const до2=G.mana;castSpell(SPELLS.indexOf(sp));const безОтдачи=до2-G.mana;
  G.buffs={};
  return {удар:[a0,a1],защита:[d0,d1],сОтдачей,безОтдачи};});
 check('отдача отнимает от удара и от защиты',
  отдача.удар[1]<отдача.удар[0]&&отдача.защита[1]<отдача.защита[0],отдача);
 check('при отдаче чара обходится дороже',отдача.сОтдачей>отдача.безОтдачи,отдача);

 /* ── 10. цена чары вправду умножается на резонанс ── */
 const цена=await page.evaluate(()=>{
  const было={spells:G.spells,arts:G.artifacts,order:G.order};
  const sp=SPELLS.find(x=>x.n==="Искра запала");
  const i=SPELLS.indexOf(sp);
  const взять=()=>{G.buffs={};G.spellCD={};G.mana=400;G.manaMax=400;G.hp=300;G.hpMax=300;
   G.inCombat=false;G.combat=null;const до=G.mana;castSpell(i);return до-G.mana;};
  G.artifacts=[];G.order=0;
  G.spells=SCHOOL_SPELLS.filter(s=>s.school==="fire").map(s=>s.n);
  const свой=взять();
  G.spells=SCHOOL_SPELLS.filter(s=>s.school==="crystal").map(s=>s.n).concat([sp.n]);
  const чужой=взять();
  G.spells=было.spells;G.artifacts=было.arts;G.order=было.order;G.buffs={};G.spellCD={};
  return {свой,чужой,цена:sp.cost};});
 check('своя стихия обходится дешевле чужой — и это видно по потраченной мане',
  цена.свой<цена.чужой,цена);

 /* ── 11. панель магии называет согласие ── */
 const панель=await page.evaluate(async()=>{
  G.spells=SCHOOL_SPELLS.slice(0,3).map(s=>s.n).concat(["Искра"]);
  safeOpenMagicPanel();
  await new Promise(r=>setTimeout(r,120));
  const кн=Array.from(document.querySelectorAll('#magicSlots button'));
  const сРезонансом=кн.filter(b=>/Созвучие:/.test(String(b.dataset.speak||"")));
  const образец=сРезонансом.length?сРезонансом[0].dataset.speak:"";
  /* Неизученное не обещает созвучия: его ещё не с чем сверять. */
  const неизученные=кн.filter(b=>/не изучено/.test(b.textContent));
  const молчат=неизученные.every(b=>!/Созвучие:/.test(String(b.dataset.speak||"")));
  closeMagicPanel();
  return {всего:кн.length,сРезонансом:сРезонансом.length,образец,молчат};});
 check('панель магии называет созвучие у изученных чар и не обещает его у прочих',
  панель.сРезонансом>=3&&панель.молчат
  &&/согласие|устойчивость/.test(панель.образец),панель);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Резонанс/i.test(g.title));
  return {r:r.find(x=>x.id==="resonance"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("RESONANCE"),текст:String(Modules.get("RESONANCE").text())};});
 check('самопроверка мира держит зелёную строку «resonance»',
  !!свод.r&&свод.r.ok===true,свод.r);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль резонанса зарегистрирован и говорит о себе',
  свод.модуль&&/Ваша стихия/.test(свод.текст)&&/18 стихий/.test(свод.текст),свод.текст);
 check('в руководстве есть глава о резонансе',свод.глава&&свод.строк>=7,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх числах и о взаимности связей',
  /Резонанс/i.test(readme)&&/четыре числа/i.test(readme)
  &&/связи взаимны/i.test(readme)&&/Срыв настоящий/i.test(readme));
 check('docs/МИР.md держит формулы и таблицу срывов',
  /RESO_BOND/.test(mir)&&/RESO_BREAKS/.test(mir)&&/устойчивость/.test(mir)&&/ценаK/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
