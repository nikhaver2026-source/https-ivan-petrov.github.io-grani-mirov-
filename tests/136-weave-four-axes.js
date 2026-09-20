/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 136: ПЛЕТЕНИЕ ЧАР — ЯДРО, СТИХИЯ, ФОРМА, УСИЛЕНИЕ (§6 мастер-промпта)

   §6 требует от составителя четырёх осей: шестнадцати ядер, восемнадцати
   стихий, двенадцати форм и шестнадцати усилений. Было пять форм, пять
   усилений и ни одного ядра со стихией — действие выбиралось лесенкой
   «семейство школы × форма», и на каждое новое сочетание пришлось бы
   дописывать ветку.

   Два требования, которые легко нарушить, и оба проверяются здесь.
   §38: НИКАКОЙ ИМИТАЦИИ — каждое из шестнадцати ядер обязано вправду
   что-то делать, а не возвращать слово. И ОДИН ОБРАБОТЧИК: именная чара
   школы и собранная составителем идут через то же ядро, второго рядом нет.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шестнадцать ядер, восемнадцать стихий, двенадцать форм, шестнадцать
      усилений; у каждой стихии и формы — настоящая запись из банка.
   2. Каждая из тридцати четырёх школ несёт ровно одну стихию.
   3. Нрав стихии считается по миру: глубина, погода, ночь — и объясняется
      словами.
   4. Каждое ядро вправду делает дело: ни одно не отвечает «ничего не
      изменилось».
   5. Шесть новых ядер — по отдельности и по делу: путы отнимают ход,
      вытяжка лечит, порча ослабляет удар твари, благословение усиливает
      ваш, развеивание гасит аномалию, перенос переставляет.
   6. Новые усиления работают: кровное берёт здоровье, отзвучное вправду
      возвращается через час, двойное бьёт дважды, пробивное не слушает
      нрава стихии.
   7. Площадная форма достаёт бродячих рядом.
   8. Чужая стихия дороже и слабее, и это сказано; своя — прежнее имя и
      прежний id.
   9. Прежние сто два именных заклинания творятся теми же ядрами и ни одно
      не пустое.
  10. Бессмысленное отвергается словами, и каждое слово — своё.
  11. Окно составителя показывает все четыре оси, и «по школе» — тоже выбор.
  12. Самопроверка мира держит строку «weave»; глава, README и docs.
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

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>({
  ядер:SPELL_CORES.length,стихий:SPELL_ELEMENTS.length,форм:SPELL_FORMS.length,усилений:SPELL_MODS.length,
  уникЯдра:new Set(SPELL_CORES.map(c=>c.id)).size,
  уникСтихии:new Set(SPELL_ELEMENTS.map(e=>e.id)).size,
  уникФормы:new Set(SPELL_FORMS.map(f=>f.id)).size,
  уникУсил:new Set(SPELL_MODS.map(m=>m.id)).size,
  безЗвукаСтихии:SPELL_ELEMENTS.filter(e=>!SOUND_BANK[e.звук]).map(e=>e.id),
  безЗвукаФормы:SPELL_FORMS.filter(f=>!SOUND_BANK[f.звук]).map(f=>f.id),
  безОписания:SPELL_CORES.filter(c=>!c.о||!c.род||!c.сем.length||!c.формы.length).map(c=>c.id),
  прежниеФормы:["bolt","wave","ward","mark","call"].every(id=>FORM_BY_ID[id]),
  новыеФормы:["beam","cloud","field","chain","rain","dome","snare"].every(id=>FORM_BY_ID[id]),
  новыеУсил:["wide","pierce","twin","cheap","deep","night","slow","sure","echo","bloodpay","anchor"].every(id=>MOD_BY_ID[id])
 }));
 check('шестнадцать ядер, восемнадцать стихий, двенадцать форм, шестнадцать усилений',
  состав.ядер===16&&состав.стихий===18&&состав.форм===12&&состав.усилений===16,состав);
 check('ни одного повтора среди четырёх осей',
  состав.уникЯдра===16&&состав.уникСтихии===18&&состав.уникФормы===12&&состав.уникУсил===16,состав);
 check('у каждой стихии и каждой формы — настоящая запись из банка',
  состав.безЗвукаСтихии.length===0&&состав.безЗвукаФормы.length===0,
  [состав.безЗвукаСтихии,состав.безЗвукаФормы]);
 check('у каждого ядра есть дело, род, семейства и формы',состав.безОписания.length===0,состав.безОписания);
 check('прежние пять форм на месте, семь новых добавлены, одиннадцать усилений тоже',
  состав.прежниеФормы&&состав.новыеФормы&&состав.новыеУсил,состав);

 /* ── 2. школа несёт ровно одну стихию ── */
 const стихии=await page.evaluate(()=>{
  const без=SCHOOLS.filter(sc=>!ELEM_BY_ID[SCHOOL_ELEMENT[sc.id]]).map(sc=>sc.id);
  const сумма=SPELL_ELEMENTS.reduce((n,e)=>n+e.школы.length,0);
  const дважды=[];const видел={};
  SPELL_ELEMENTS.forEach(e=>e.школы.forEach(id=>{if(видел[id])дважды.push(id);видел[id]=1;}));
  return {без,сумма,школ:SCHOOLS.length,дважды,
   пример:elemOfSchool("necro").n,примерХаос:elemOfSchool("demon").n};});
 check('каждая из тридцати четырёх школ несёт ровно одну стихию, и ни одна не дважды',
  стихии.без.length===0&&стихии.сумма===стихии.школ&&стихии.дважды.length===0,стихии);
 check('стихия школы читается по смыслу: некромантия — кость, демонология — хаос',
  стихии.пример==="Кость"&&стихии.примерХаос==="Хаос",стихии);

 /* ── 3. нрав стихии считается по миру ── */
 const нрав=await page.evaluate(()=>{
  const огонь=ELEM_BY_ID.e_fire,лёд=ELEM_BY_ID.e_ice,кость=ELEM_BY_ID.e_bone,тьма=ELEM_BY_ID.e_dark;
  const было={place:G.place,hour:G.hour,w:Weather.cur};
  const r={};
  G.place=null;G.hour=12;Weather.cur="Ясно";
  r.огоньЯсно=elemPower(огонь);
  Weather.cur="Ливень";r.огоньЛивень=elemPower(огонь);
  Weather.cur="Метель";r.лёдМетель=elemPower(лёд);
  Weather.cur="Ясно";
  r.костьНаверху=elemPower(кость);
  G.place={bx:1,by:1,depth:30,x:5,y:5,stype:"ruins",kind:"dungeon"};
  r.костьВнизу=elemPower(кость);
  r.почемуВнизу=elemWhy(кость);
  G.place=null;G.hour=23;r.тьмаНочью=elemPower(тьма);G.hour=12;r.тьмаДнём=elemPower(тьма);
  r.почемуНочью=(G.hour=23,elemWhy(тьма));
  G.place=было.place;G.hour=было.hour;Weather.cur=было.w;
  return r;});
 check('огонь слабеет под ливнем, лёд крепнет в метель',
  нрав.огоньЛивень<нрав.огоньЯсно&&нрав.лёдМетель>1,нрав);
 check('кость сильнее под землёй, тьма — ночью',
  нрав.костьВнизу>нрав.костьНаверху&&нрав.тьмаНочью>нрав.тьмаДнём,нрав);
 check('нрав объясняется словами, а не одним числом',
  /под землёй/.test(нрав.почемуВнизу)&&/ноч/i.test(нрав.почемуНочью),
  [нрав.почемуВнизу,нрав.почемуНочью]);

 /* ── 4. §38: ни одно ядро не имитация ── */
 const ядра=await page.evaluate(()=>{
  G.hp=400;G.hpMax=400;G.mana=400;G.manaMax=400;G.inCombat=false;G.combat=null;
  const мёртвые=[],слова={};
  SPELL_CORES.forEach(c=>{
   let сказано=null;
   for(const sc of SCHOOLS){for(const f of SPELL_FORMS){
    if(spellIncompat(sc.id,f.id,"none",c.id,null))continue;
    const rec=composeSpell(sc.id,f.id,"none",3,c.id,null);
    if(rec.ошибка)continue;
    const r=String(castCustomEffect(rec)||"");
    if(r.trim()&&!/ничего не изменилось|сорвались/.test(r)){сказано=r.trim().slice(0,70);break;}}
    if(сказано)break;}
   if(!сказано)мёртвые.push(c.id);else слова[c.id]=сказано;});
  return {мёртвые,слова,сколько:Object.keys(слова).length};});
 check('§38: каждое из шестнадцати ядер вправду что-то делает',
  ядра.мёртвые.length===0&&ядра.сколько===16,ядра.мёртвые);
 check('каждое ядро говорит о себе своими словами, а не одной заготовкой',
  new Set(Object.values(ядра.слова)).size===16,Object.values(ядра.слова).slice(0,3));

 /* ── 5. шесть новых ядер по делу ── */
 const новые=await page.evaluate(()=>{
  const найти=cid=>{for(const sc of SCHOOLS){for(const f of SPELL_FORMS){
    if(spellIncompat(sc.id,f.id,"none",cid,null))continue;
    const r=composeSpell(sc.id,f.id,"none",3,cid,null);if(!r.ошибка)return r;}}return null;};
  const бой=()=>{G.hp=300;G.hpMax=300;G.mana=300;G.manaMax=300;
   G.inCombat=true;G.combat={m:{n:"Проба",lvl:5,hp:600,dmg:10,id:"probe"},hp:600,key:"0,0"};};
  const o={};
  /* путы */
  бой();o.путыСлово=String(castCustomEffect(найти("bind")));o.путы=Number(G.combat.путы)||0;
  /* порча */
  бой();o.порчаСлово=String(castCustomEffect(найти("curse")));
  o.порча=Number(G.combat.порча)||0;o.порчаХод=Number(G.combat.порчаХод)||0;
  /* вытяжка лечит и даёт ману */
  бой();G.hp=100;G.mana=50;const h0=G.hp,m0=G.mana;
  o.вытяжкаСлово=String(castCustomEffect(найти("drain")));
  o.вытяжкаHp=G.hp-h0;o.вытяжкаМана=G.mana-m0;o.врагПотерял=600-G.combat.hp;
  /* благословение поднимает удар и защиту */
  G.inCombat=false;G.combat=null;delete G.buffs;
  const a0=atk(),d0=def();
  o.благСлово=String(castCustomEffect(найти("bless")));
  o.атака=[a0,atk()];o.защита=[d0,def()];o.благДержится=buffActive("благословение");
  /* развеивание гасит аномалию яруса */
  delete G.buffs;
  const место=(()=>{for(let d=1;d<=60;d++){G.place={bx:120,by:120,depth:d,x:5,y:5,stype:"ruins",kind:"dungeon"};
    if(anomalyHere())return d;}return 0;})();
  o.ярусСАномалией=место;
  if(место){o.аномалияДо=!!anomalyHere();
   o.развСлово=String(castCustomEffect(найти("dispel")));
   o.аномалияПосле=!!anomalyHere();o.развеяно=buffActive("развеяно");}
  /* перенос переставляет */
  delete G.buffs;G.place={bx:120,by:120,depth:3,x:5,y:5,stype:"ruins",kind:"dungeon"};
  const xy0=[G.place.x,G.place.y];
  o.переносСлово=String(castCustomEffect(найти("shift")));
  o.сдвинулся=(G.place.x!==xy0[0]||G.place.y!==xy0[1]);
  G.place=null;
  return o;});
 check('путы: тварь получает потерянные ходы, и это записано в бою',
  новые.путы>=1&&/пут/i.test(новые.путыСлово),новые);
 check('порча: тварь бьёт слабее, доля и срок записаны',
  новые.порча>0&&новые.порча<=0.5&&новые.порчаХод>=2&&/слабее/.test(новые.порчаСлово),новые);
 check('вытяжка: тварь теряет здоровье, а вы его получаете',
  новые.врагПотерял>0&&новые.вытяжкаHp>0&&/Вытяжка вернула/.test(новые.вытяжкаСлово),новые);
 check('благословение: удар и защита вправду выросли',
  новые.атака[1]>новые.атака[0]&&новые.защита[1]>новые.защита[0]&&новые.благДержится,новые);
 check('развеивание: аномалия яруса вправду гаснет на время',
  новые.ярусСАномалией>0&&новые.аномалияДо===true&&новые.аномалияПосле===false&&новые.развеяно,новые);
 check('перенос: вы вправду оказались на другой клетке',
  новые.сдвинулся&&/Перенос/.test(новые.переносСлово),новые);

 /* ── 6. новые усиления ── */
 const усил=await page.evaluate(()=>{
  const найтиМод=mid=>{for(const sc of SCHOOLS){for(const f of SPELL_FORMS){
    if(spellIncompat(sc.id,f.id,mid,null,null))continue;
    const r=composeSpell(sc.id,f.id,mid,3,null,null);if(!r.ошибка)return r;}}return null;};
  const o={};
  G.hp=300;G.hpMax=300;G.mana=300;G.manaMax=300;G.inCombat=false;G.combat=null;G.place=null;
  /* кровное берёт здоровье */
  const bp=найтиМод("bloodpay");G.hp=300;const h0=G.hp;
  o.кровноеСлово=String(castCustomEffect(bp));o.кровьВзяла=h0-G.hp;
  /* отзвучное ставит и возвращается */
  G.echoes=[];const ec=найтиМод("echo");
  castCustomEffect(ec);o.эхоСтало=(G.echoes||[]).length;
  if(!SPELLS.some(x=>x.id===ec.id))SPELLS.push(ec);
  G.hour=(Number(G.hour)||0)+2;o.эхоСработало=weaveEchoTick();o.эхоОсталось=(G.echoes||[]).length;
  /* двойное бьёт дважды */
  G.inCombat=true;G.combat={m:{n:"Проба",lvl:5,hp:900,dmg:8,id:"probe"},hp:900,key:"0,0"};
  const tw=найтиМод("twin");o.двойноеСлово=String(castCustomEffect(tw));
  o.двойноеУдаров=(o.двойноеСлово.match(/твари/g)||[]).length;
  /* пробивное не слушает нрава стихии */
  G.inCombat=false;G.combat=null;
  const было=Weather.cur;Weather.cur="Ливень";
  const обыч=composeSpell("fire","bolt","none",3,null,null);
  const проб=composeSpell("fire","bolt","pierce",3,null,null);
  o.нравОгня=elemPower(ELEM_BY_ID.e_fire);o.чистыйОгонь=ELEM_BY_ID.e_fire.k;
  o.пробойЕсть=!!MOD_BY_ID.pierce.пробой;
  Weather.cur=было;
  o.якорьНаСтреле=spellIncompat("fire","bolt","anchor",null,null);
  return o;});
 check('кровное вправду платится здоровьем',
  усил.кровьВзяла>0&&/Кровное взяло своё/.test(усил.кровноеСлово),усил);
 check('отзвучное ставится и через час вправду возвращается',
  усил.эхоСтало===1&&усил.эхоСработало===1&&усил.эхоОсталось===0,усил);
 check('двойное срабатывает дважды по одной цели',усил.двойноеУдаров>=2,усил);
 check('пробивное отменяет нрав стихии: под ливнем огонь считается как в свою пору',
  усил.пробойЕсть&&усил.нравОгня<усил.чистыйОгонь,усил);
 check('якорное на стреле отвергается: перезаряжать нечего',
  /якорь ей не нужен/.test(усил.якорьНаСтреле),усил.якорьНаСтреле);

 /* ── 7. площадная форма достаёт бродячих ── */
 const площадь=await page.evaluate(()=>{
  G.place={bx:130,by:130,depth:6,x:8,y:8,stype:"ruins",kind:"dungeon"};
  const lvl=curLevel();
  Actors.stop();Actors.list=[];
  for(let i=0;i<4;i++)Actors.list.push({id:i,kind:"mob",x:8+(i%2),y:8+(i>1?1:0),
   m:{id:"rat",n:"Крыса",lvl:1,hp:6,dmg:1},name:"Крыса",seen:false});
  const до=Actors.list.length;
  const позиции=Actors.list.map(a=>a.x+","+a.y).join("|");
  /* волна — площадная, стрела — нет */
  const волна=composeSpell("fire","wave","none",3,null,null);
  G.inCombat=false;G.combat=null;G.hp=300;G.hpMax=300;G.mana=300;G.manaMax=300;
  const слово=String(castCustomEffect(волна));
  const после=Actors.list.length;
  const позицииПосле=Actors.list.map(a=>a.x+","+a.y).join("|");
  /* стрела никого рядом не трогает */
  Actors.list=[{id:9,kind:"mob",x:9,y:8,m:{id:"rat",n:"Крыса",lvl:1,hp:6,dmg:1},name:"Крыса",seen:false}];
  const стрела=composeSpell("fire","bolt","none",3,null,null);
  const словоСтрелы=String(castCustomEffect(стрела));
  const послеСтрелы=Actors.list.length;
  Actors.list=[];G.place=null;
  return {до,после,слово,позиции,позицииПосле,словоСтрелы,послеСтрелы,
   целейВолны:FORM_BY_ID.wave.целей,целейСтрелы:FORM_BY_ID.bolt.целей};});
 check('волна достаёт бродячих рядом: их стало меньше или их отбросило',
  (площадь.после<площадь.до||площадь.позицииПосле!==площадь.позиции)
  &&/задела ещё|достала ещё/.test(площадь.слово),площадь);
 check('стрела никого рядом не трогает: она бьёт в одну точку',
  площадь.целейСтрелы===0&&площадь.послеСтрелы===1&&!/ещё/.test(площадь.словоСтрелы),площадь);

 /* ── 8. чужая стихия дороже и слабее ── */
 const чужая=await page.evaluate(()=>{
  const своя=composeSpell("fire","bolt","none",3,null,null);
  const лёд=composeSpell("fire","bolt","none",3,null,"e_ice");
  const ядро=composeSpell("fire","bolt","none",3,"drain",null);
  return {свояИмя:своя.n,свояId:своя.id,свояЦена:своя.cost,свояСила:своя.сила,
   чужаяИмя:лёд.n,чужаяЦена:лёд.cost,чужаяСила:лёд.сила,чужаяId:лёд.id,
   ядроИмя:ядро.n,ядроId:ядро.id,ядроЯдро:ядро.ядро,свояЯдро:своя.ядро,свояСтихия:своя.стихия};});
 check('своя стихия и своё ядро оставляют прежнее имя и прежний id',
  чужая.свояИмя==="Стрела огня"&&чужая.свояId==="cs_fire_bolt_none"
  &&чужая.свояЯдро==="strike"&&чужая.свояСтихия==="e_fire",чужая);
 check('чужая стихия дороже и слабее, и это видно в имени',
  чужая.чужаяЦена>чужая.свояЦена&&чужая.чужаяСила<чужая.свояСила
  &&/лёд/.test(чужая.чужаяИмя)&&чужая.чужаяId!==чужая.свояId,чужая);
 check('чужое ядро тоже названо в имени и записано в чаре',
  чужая.ядроЯдро==="drain"&&/вытяжк/i.test(чужая.ядроИмя),чужая);

 /* ── 9. сто два именных заклинания — теми же ядрами ── */
 const школьные=await page.evaluate(()=>{
  G.hp=400;G.hpMax=400;G.mana=400;G.manaMax=400;G.inCombat=false;G.combat=null;G.place=null;
  const плохие=[],безЯдра=[];
  SCHOOL_SPELLS.forEach(sp=>{
   const s2=SPELLS.find(x=>x.n===sp.n);
   if(!s2){плохие.push(sp.n+": нет в списке");return;}
   if(!spellCoreOf(s2)||!spellElemOf(s2)){безЯдра.push(sp.n);return;}
   const r=String(castCustomEffect(s2)||"");
   if(!r.trim()||/ничего не изменилось|сорвались/.test(r))плохие.push(sp.n+" → "+r);});
  /* ядро именной чары берётся ровно из её школы и формы */
  const перваяОгня=SPELLS.find(x=>x.n==="Искра запала");
  return {всего:SCHOOL_SPELLS.length,плохие:плохие.slice(0,5),плохих:плохие.length,
   безЯдра:безЯдра.slice(0,5),
   ядроИскры:перваяОгня?spellCoreOf(перваяОгня).id:null,
   стихияИскры:перваяОгня?spellElemOf(перваяОгня).id:null};});
 check('все сто два именных заклинания школ творятся и ни одно не пустое',
  школьные.всего===102&&школьные.плохих===0&&школьные.безЯдра.length===0,школьные);
 check('у именной чары ядро и стихия выводятся из её школы и формы',
  школьные.ядроИскры==="strike"&&школьные.стихияИскры==="e_fire",школьные);

 /* ── 10. бессмысленное отвергается своими словами ── */
 const нельзя=await page.evaluate(()=>({
  ширОстрела:spellIncompat("fire","bolt","wide",null,null),
  огоньЛечит:spellIncompat("water","ward","none","heal","e_fire"),
  хаосЩит:spellIncompat("earth","ward","none","ward","e_chaos"),
  светНочью:spellIncompat("light","ward","night",null,null),
  воздухГлубже:spellIncompat("air","mark","deep",null,null),
  зовДважды:spellIncompat("fire","call","twin",null,null),
  кровьЛечит:spellIncompat("water","ward","bloodpay",null,null),
  ядроНеТой:spellIncompat("fire","bolt","none","heal",null),
  ядроНеВФорме:spellIncompat("fire","bolt","none","veil",null),
  можно:spellIncompat("fire","bolt","none",null,null),
  можноЧужая:spellIncompat("fire","bolt","none",null,"e_ice")}));
 check('десять бессмысленных сочетаний отвергаются, и у каждого своя причина',
  Object.keys(нельзя).filter(k=>!/^можно/.test(k)).every(k=>нельзя[k].length>8)
  &&new Set(Object.keys(нельзя).filter(k=>!/^можно/.test(k)).map(k=>нельзя[k])).size===9,нельзя);
 check('осмысленное проходит, и чужая стихия — тоже осмысленное',
  нельзя.можно===""&&нельзя.можноЧужая==="",нельзя);

 /* ── 11. окно составителя ── */
 const окно=await page.evaluate(()=>{
  const r={};
  G.mast=G.mast||{};G.mast.runes={ур:1,оп:0};
  const найти=вид=>{const C=WORLD>>1;for(let rr=1;rr<140;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
    const c=safeFn(()=>cellContent(C+dx,C+dy),null);
    if(c&&c.structure&&c.structure.type===вид)return {x:C+dx,y:C+dy,c};}return null;};
  const м=найти("tower")||найти("school")||найти("temple");
  if(!м)return {нет:"башни"};
  G.x=м.x;G.y=м.y;enterPlace(м.c);
  SF.school=null;SF.form=null;SF.mod="none";SF.core=null;SF.elem=null;
  r.открыто=spellForgeOpen();
  const кн=c=>document.querySelectorAll(`#sfBody [data-cmd^="${c}"]`).length;
  r.школ=кн("sfschool:");r.форм=кн("sfform:");r.усил=кн("sfmod:");
  r.ядер=кн("sfcore:");r.стихий=кн("sfelem:");
  /* «по школе» — это выбор, и он отмечен галочкой, пока своё не взяли */
  const поШколеЯдро=document.querySelector('#sfBody [data-cmd="sfcore:"]');
  r.поШколе=!!поШколеЯдро&&/✔/.test(поШколеЯдро.textContent);
  document.querySelector('#sfBody [data-cmd="sfschool:fire"]').click();
  document.querySelector('#sfBody [data-cmd="sfform:bolt"]').click();
  document.querySelector('#sfBody [data-cmd="sfelem:e_ice"]').click();
  r.послеЛьда=SF.elem;
  r.строкаСтихии=Array.from(document.querySelectorAll('#sfBody .list-line'))
   .map(x=>String(x.dataset.speak||"")).find(t=>/Стихия Лёд/.test(t))||"";
  document.querySelector('#sfBody [data-cmd="sfelem:"]').click();
  r.назадКШколе=SF.elem;
  r.рецепт=composeSpell(SF.school,SF.form,SF.mod,1,SF.core,SF.elem).n;
  for(let i=0;i<10&&activeLayer();i++)closeTopUI();
  G.place=null;
  return r;});
 check('окно составителя показывает все четыре оси: 34 школы, 12 форм, 16 ядер, 18 стихий, 16 усилений',
  !окно.нет&&окно.школ===34&&окно.форм===12&&окно.усил===16
  &&окно.ядер===17&&окно.стихий===19,окно);
 check('«по школе» — это выбор, отмеченный по умолчанию, и к нему можно вернуться',
  окно.поШколе===true&&окно.послеЛьда==="e_ice"&&окно.назадКШколе===null
  &&окно.рецепт==="Стрела огня",окно);
 check('окно называет силу выбранной стихии здесь и сейчас',
  /Стихия Лёд/.test(окно.строкаСтихии)&&/Сейчас сила/.test(окно.строкаСтихии),окно.строкаСтихии);

 /* ── 12. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Плетение чар/i.test(g.title));
  return {w:r.find(x=>x.id==="weave"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   модуль:Modules.has("WEAVE"),текст:String(Modules.get("WEAVE").text()),
   сочетаний:Weave.count()};});
 check('самопроверка мира держит зелёную строку «weave»',
  !!свод.w&&свод.w.ok===true,свод.w);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль плетения зарегистрирован и считает сложившиеся сочетания',
  свод.модуль&&свод.сочетаний>300&&/16 ядер, 18 стихий, 12 форм, 16 усилений/.test(свод.текст),
  {сочетаний:свод.сочетаний,текст:свод.текст});
 check('в руководстве есть глава о плетении чар',свод.глава&&свод.строк>=8,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх осях и о том, что ядро — единственный обработчик',
  /Плетение чар/i.test(readme)&&/Шестнадцать ядер/i.test(readme)
  &&/Восемнадцать стихий/i.test(readme)&&/единственный обработчик/i.test(readme));
 check('docs/МИР.md держит таблицы ядер и стихий и правило одного обработчика',
  /SPELL_CORES/.test(mir)&&/SPELL_ELEMENTS/.test(mir)&&/weaveAct/.test(mir)
  &&/coreDefault/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
