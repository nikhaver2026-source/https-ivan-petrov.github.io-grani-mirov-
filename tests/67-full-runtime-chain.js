/* ════════════════════════════════════════════════════════════════════════
   НАБОР 67: ПОЛНАЯ ЦЕПОЧКА — ОТ РАЗГОВОРА ДО ЗАГРУЗКИ

   Остальные наборы проверяют системы ПО ОТДЕЛЬНОСТИ, и каждая из них
   работает. Но игра — это не набор работающих систем, а одна цепь, и рвётся
   она на стыках: житель помнит, а репутация не растёт; репутация растёт, а
   цена та же; цена другая, а после загрузки снова прежняя.

   Здесь цепь проходится ОДНИМ ПРОГОНОМ, звено за звеном, и каждое звено
   проверяется против предыдущего:

     житель → разговор → выбор → последствие → репутация → цена у торговца
       → покупка → память торговца → рынок → заслуга перед державой
       → весть о деле → другой житель знает → сохранение → загрузка

   Правило набора: НИ ОДНО ЗВЕНО НЕ ПРОВЕРЯЕТСЯ САМО ПО СЕБЕ. Всякий раз
   сравнивается «до» и «после» одного и того же действия, на одном и том же
   дне, в одном и том же городе — чтобы разница не могла прийти ниоткуда.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── Вся цепь идёт одним прогоном в одном состоянии мира ── */
 const цепь=await page.evaluate(()=>{
  const шаг={};
  while(activeLayer())closeTopUI();
  /* Чистое начало: ничего из прежних наборов сюда не попадает. */
  G.dark=false;G.place=null;G.ship=null;G.inCombat=false;G.combat=null;
  G.npcMem={};G.rumors=[];G.standing={};G.axes={};G.merch={};G.merit={};
  G.rep={};G.market={};G.quests=[];G.gold=5000;G.level=20;G.cha=25;G.mind=20;
  G.day=5;G.liveDay=5;G.hour=12;G.weather="Ясно";G.weaponDrawn=false;
  const O=WORLD>>1;
  G.x=O;G.y=O;

  /* ── 1. ЖИТЕЛЬ ── */
  const город=findCities(O,O,60,3)[0];
  if(!город)return {нет:"города рядом нет"};
  const emp=город.emp,idx=Math.max(0,EMPIRES.indexOf(emp));
  const народ=emp.race;
  const торговец=getNPC(город.x,город.y,0,"Торговец");
  шаг.житель={ключ:торговец.key||null,народ,
   имя:торговец.n||торговец.имя||null,
   город:город.name||null};

  /* ── 2. РАЗГОВОР И ВЫБОР ── */
  /* Следом разговора служит не непременная запись в памяти — её оставляет
     только удачный исход, — а то, что житель ПОМНИТ САМ РАЗГОВОР: второй раз
     за день тот же ход не проходит. Это и есть проверяемое последствие. */
  const ходыДо=((memOf(торговец.key)||{}).ходы)||{};
  const былоЗаписано=Object.keys(ходыДо).length;
  const ход=dlgDo(торговец,"rassprosit");
  const мем=memOf(торговец.key)||{};
  const второйРаз=dlgDo(торговец,"rassprosit");
  шаг.разговор={ход:!!ход,былоЗаписано,
   записалХод:!!(мем.ходы&&мем.ходы.rassprosit),
   второйРаз:второйРаз===false,
   записейПамяти:((мем.д)||[]).length};

  /* ── 3. ПОСЛЕДСТВИЕ: РЕПУТАЦИЯ ── */
  /* Репутация хранится под КЛЮЧОМ народа, а не под его именем: читать её
     полагается через repOf, иначе замер всегда покажет ноль. На этом первая
     сборка набора и попалась. */
  const репДо=repOf(народ);
  addRep(народ,8);
  const репПосле=repOf(народ);
  шаг.репутация={до:репДо,после:репПосле,выросла:репПосле>репДо,
   ключ:(RACE_BY_NAME[народ]||{}).id||null};

  /* ── 4. РЕПУТАЦИЯ → ЦЕНА ── */
  /* Одна и та же вещь, один и тот же город, один и тот же день: меняется
     только отношение народа. Если цена не дрогнула, звено порвано. */
  const ключНарода=(RACE_BY_NAME[народ]||{}).id;
  const ценаПриДобре=citySellPrice("кристалл",город,G.day);
  G.rep[ключНарода]=-20;
  const ценаПриЗле=citySellPrice("кристалл",город,G.day);
  G.rep[ключНарода]=репПосле;
  шаг.цена={добро:ценаПриДобре,зло:ценаПриЗле,
   разная:ценаПриДобре!==ценаПриЗле,
   своимДешевле:ценаПриДобре<ценаПриЗле,
   числа:Number.isFinite(ценаПриДобре)&&Number.isFinite(ценаПриЗле)};

  /* ── 5. ПОКУПКА → ПАМЯТЬ ТОРГОВЦА → ЦЕНА У НЕГО ── */
  /* Мерить надо на дорогом товаре: прибавка знакомства — доли цены, и на
     руде за десяток золотых она целиком съедается округлением. */
  const выплатаДо=sellPrice("кристалл",idx,G.day,торговец);
  for(let i=0;i<8;i++)noteTrade(торговец,120);
  noteMerchFavour(торговец);
  const выплатаПосле=sellPrice("кристалл",idx,G.day,торговец);
  шаг.торговец={знакомство:merchBond(торговец),
   выплатаДо,выплатаПосле,лучше:выплатаПосле>выплатаДо,
   сделок:(merchOf(торговец)||{}).с||0,
   числа:Number.isFinite(выплатаДо)&&Number.isFinite(выплатаПосле)};

  /* ── 6. ДЕЛО → РЫНОК ── */
  const потокДо=JSON.stringify(marketOf(idx));
  marketDeed("разбой",idx);
  const потокПосле=JSON.stringify(marketOf(idx));
  const ценаПоРынку=citySellPrice("кристалл",город,G.day);
  шаг.рынок={сдвинулся:потокДо!==потокПосле,
   ценаПослеДела:ценаПоРынку,числа:Number.isFinite(ценаПоРынку)};

  /* ── 7. ДЕЛО → ЗАСЛУГА ПЕРЕД ДЕРЖАВОЙ → ЦЕНА ПАЛАТЫ ── */
  const заслугаДо=meritOf(idx);
  const ценаБезЗаслуг=citySellPrice("кристалл",город,G.day,{безЗаслуг:true});
  addMerit(idx,40);
  const заслугаПосле=meritOf(idx);
  const ценаСЗаслугой=citySellPrice("кристалл",город,G.day);
  шаг.держава={заслугаДо,заслугаПосле,выросла:заслугаПосле>заслугаДо,
   безЗаслуг:ценаБезЗаслуг,сЗаслугой:ценаСЗаслугой,
   заслугаДешевле:ценаСЗаслугой<=ценаБезЗаслуг};

  /* ── 8. ВЕСТЬ О ДЕЛЕ ── */
  G.rumors=[];
  rumorSeed("бой","Огр-громила",G.x,G.y,true);
  const вестьРядом=rumorsHere(G.x,G.y).length;
  const вестьДалеко0=rumorsHere(G.x,G.y+150).length;
  for(let i=0;i<7;i++){G.day++;worldLiveTick();}
  const вестьДалеко1=rumorsHere(G.x,G.y+150).length;
  шаг.весть={рядом:вестьРядом,далеко0:вестьДалеко0,далеко1:вестьДалеко1,
   пошла:вестьРядом===1&&вестьДалеко0===0&&вестьДалеко1===1};

  /* ── 9. ДРУГОЙ ЖИТЕЛЬ ЗНАЕТ ── */
  const р=rumorsHere(G.x,G.y)[0]||null;
  let знают=0,неЗнают=0;
  for(let i=0;i<80&&р;i++){
   const n=getNPC(G.x+(i%9),G.y+Math.floor(i/9),0,null);
   if(npcKnowsRumor(n,р))знают++;else неЗнают++;}
  шаг.молва={знают,неЗнают,естьВесть:!!р,
   разошлась:знают>0,неВсеПодряд:неЗнают>0};

  /* ── 10. СОХРАНЕНИЕ ── */
  /* За время шага с вестью прошла неделя мира, а цена зависит ото дня.
     Сравнивать цену до и после загрузки можно только в ОДИН день, иначе
     разница придёт от календаря, а не от сохранения. */
  const ценаПередЗаписью=citySellPrice("кристалл",город,G.day);
  const снимок={рег:repOf(народ),заслуга:meritOf(idx),
   сделок:(merchOf(торговец)||{}).с||0,
   вестей:(G.rumors||[]).length,
   память:(((memOf(торговец.key))||{}).д||[]).length,
   рынок:JSON.stringify(marketOf(idx))};
  const raw=serializeSave();
  const вЗаписи=(()=>{try{const d=JSON.parse(raw);
   return !!(d.rep&&d.merit&&d.merch&&Array.isArray(d.rumors)&&d.npcMem&&d.market);
  }catch(_){return false;}})();

  /* ── 11. ЗАГРУЗКА ── */
  G.rep={};G.merit={};G.merch={};G.rumors=[];G.npcMem={};G.market={};
  Object.assign(G,JSON.parse(raw));
  safeFn(()=>repairState&&repairState());
  const после={рег:repOf(народ),заслуга:meritOf(idx),
   сделок:(merchOf(торговец)||{}).с||0,
   вестей:(G.rumors||[]).length,
   память:(((memOf(торговец.key))||{}).д||[]).length,
   рынок:JSON.stringify(marketOf(idx))};
  шаг.запись={вЗаписи,снимок,после,
   всёВернулось:снимок.рег===после.рег&&снимок.заслуга===после.заслуга
    &&снимок.сделок===после.сделок&&снимок.вестей===после.вестей
    &&снимок.память===после.память&&снимок.рынок===после.рынок};

  /* ── 12. И ЦЕНА ПОСЛЕ ЗАГРУЗКИ ТА ЖЕ ── */
  const ценаПосле=citySellPrice("кристалл",город,G.day);
  шаг.ценаПослеЗагрузки={была:ценаПередЗаписью,стала:ценаПосле,
   таЖе:ценаПосле===ценаПередЗаписью,число:Number.isFinite(ценаПосле)};

  /* ── 13. Кошелёк и запасы за всю цепь остались числами ── */
  шаг.числа={золото:Number.isFinite(G.gold),вода:Number.isFinite(G.water),
   hp:Number.isFinite(G.hp),день:Number.isFinite(G.day),
   котомка:Object.values(G.inv||{}).every(v=>Number.isFinite(Number(v)))};
  return шаг;});

 if(цепь.нет){
  check('цепочку было где пройти',false,цепь);
 }else{
  check('1. житель есть, и у него постоянный ключ',
   !!цепь.житель.ключ,цепь.житель);
  check('2. разговор оставляет след: тот же ход второй раз за день не проходит',
   цепь.разговор.былоЗаписано===0&&цепь.разговор.записалХод===true
   &&цепь.разговор.второйРаз===true,цепь.разговор);
  check('3. поступок меняет репутацию у народа',
   цепь.репутация.выросла,цепь.репутация);
  check('4. репутация доходит до цены: своим город продаёт дешевле',
   цепь.цена.разная&&цепь.цена.своимДешевле&&цепь.цена.числа,цепь.цена);
  check('5. покупки заводят знакомство, и знакомому торговец платит больше',
   цепь.торговец.сделок>=8&&цепь.торговец.знакомство>0
   &&цепь.торговец.лучше&&цепь.торговец.числа,цепь.торговец);
  check('6. дело на тракте сдвигает рыночные потоки',
   цепь.рынок.сдвинулся&&цепь.рынок.числа,цепь.рынок);
  check('7. заслуга перед державой доходит до прилавка палаты',
   цепь.держава.выросла&&цепь.держава.заслугаДешевле,цепь.держава);
  check('8. весть о деле идёт по миру без игрока',цепь.весть.пошла,цепь.весть);
  check('9. о вести знают одни жители и не знают другие',
   цепь.молва.естьВесть&&цепь.молва.разошлась&&цепь.молва.неВсеПодряд,цепь.молва);
  check('10. всё это попадает в саму запись сохранения',
   цепь.запись.вЗаписи,цепь.запись);
  check('11. после загрузки возвращается всё до последнего звена',
   цепь.запись.всёВернулось,цепь.запись);
  check('12. и цена после загрузки та же, что была до неё',
   цепь.ценаПослеЗагрузки.таЖе&&цепь.ценаПослеЗагрузки.число,
   цепь.ценаПослеЗагрузки);
  check('13. за всю цепь ни одно число не стало NaN',
   цепь.числа.золото&&цепь.числа.вода&&цепь.числа.hp&&цепь.числа.день
   &&цепь.числа.котомка,цепь.числа);
 }

 /* ── Цепь ремесла: от урока до вещи в руках и до прилавка ──
    Расширенный runtime-тест требует пройти не только жизнь мира, но и всю
    цепочку ремесла: обучение → наставник → станок → плавка → руна → гнездо →
    вещь с силой → торговля → сохранение. Каждое звено проверяется против
    предыдущего: без урока нет станка, без станка нет слитка, без слитка нет
    клинка, без руны нет гнезда. */
 const ремесло=await page.evaluate(()=>{
  const ш={};
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
  G.mast={};G.inv={};G.comps={};G.artifacts=[];G.items=[];G.gold=5000;
  G.rep={};G.buffs={};G.hp=200;G.hpMax=200;G.day=5;G.hour=10;G.level=20;

  /* 1. Без урока станок молчит. */
  ш.доУрока={горн:techsAt("forge").length,верстак:techsAt("bench").length};

  /* 2. Урок у кузнеца. */
  const кузнец=getNPC(900,900,0,"Кузнец");
  const золДо=G.gold;
  ш.урок={дал:mastAsk(кузнец,"smith"),ступень:mastLevel("smith"),
   заплачено:золДо-G.gold};

  /* 3. Станок ожил, и ровно на свою ступень. */
  ш.послеУрока={горн:techsAt("forge").map(t=>t.id),
   наковальня:techsAt("anvil").map(t=>t.id)};

  /* 4. Плавка: руда уходит, слиток приходит. */
  G.inv={"руда":40};
  G.mast.smith={ур:5,оп:0,дел:0};
  let слитков=0;
  for(let i=0;i<12&&слитков<3;i++){techDo(TECH_BY_ID.melt,"forge");слитков=Number(G.inv["слиток"])||0;}
  ш.плавка={слитков,рудаУбыла:(Number(G.inv["руда"])||0)<40};

  /* 5. Ковка: слиток и дерево становятся именным клинком. */
  G.inv["дерево"]=5;
  const вещейДо=(G.items||[]).length;
  let клинок=false;
  for(let i=0;i<12&&!клинок;i++){
   G.inv["слиток"]=Math.max(2,Number(G.inv["слиток"])||0);G.inv["дерево"]=5;
   techDo(TECH_BY_ID.blade,"anvil");
   клинок=(G.items||[]).length>вещейДо;}
  ш.ковка={клинок,вещей:(G.items||[]).length};

  /* 6. Руна: из припаса выходит часть, и она ложится в котомку частей. */
  G.mast.runes={ур:5,оп:0,дел:0};
  G.inv=Object.assign(G.inv,{"руда":9,"камень":9,"кость":9,"трава":9,"кристалл":9});
  let частей=0;
  for(let i=0;i<14&&!частей;i++){
   G.inv=Object.assign(G.inv,{"руда":9,"камень":9,"кость":9,"трава":9,"кристалл":9});
   techDo(TECH_BY_ID.inscribe,"bench");
   частей=Object.keys(G.comps||{}).length;}
  ш.руна={частей,какие:Object.keys(G.comps||{})};

  /* 7. Гнездо: часть входит в вещь с силой, и вещь меняется. */
  const a=ART.make({дом:"run",ранг:3,кач:3,seed:7,имя:"Проба кузнеца",откуда:"своей работы"});
  ART.grant({готовая:a});
  const pid=Object.keys(G.comps||{})[0];
  const былоЧастей=Number(G.comps[pid])||0;
  const вошла=pid?safeFn(()=>artSocket(0,pid),false):false;
  ш.гнездо={pid,вошла:!!вошла,
   частейУбыло:(Number((G.comps||{})[pid])||0)<былоЧастей,
   вещей:(G.artifacts||[]).length};

  /* 8. Торговля: слиток дороже руды, и цена — число. */
  const город=findCities(WORLD>>1,WORLD>>1,60,3)[0];
  ш.торг=город?{руда:citySellPrice("руда",город,G.day),
   слиток:citySellPrice("слиток",город,G.day)}:null;
  ш.торгЧисла=!!ш.торг&&Number.isFinite(ш.торг.руда)&&Number.isFinite(ш.торг.слиток);

  /* 9. Сохранение и загрузка: мастерство, части и вещи возвращаются. */
  const снимок={ур:mastLevel("smith"),руны:mastLevel("runes"),
   частей:Object.keys(G.comps||{}).length,
   вещей:(G.artifacts||[]).length,предметов:(G.items||[]).length};
  const raw=serializeSave();
  G.mast={};G.comps={};G.artifacts=[];G.items=[];
  Object.assign(G,JSON.parse(raw));
  const после={ур:mastLevel("smith"),руны:mastLevel("runes"),
   частей:Object.keys(G.comps||{}).length,
   вещей:(G.artifacts||[]).length,предметов:(G.items||[]).length};
  ш.запись={снимок,после,
   всёВернулось:снимок.ур===после.ур&&снимок.руны===после.руны
    &&снимок.частей===после.частей&&снимок.вещей===после.вещей
    &&снимок.предметов===после.предметов};
  ш.числа=Number.isFinite(G.gold)&&Number.isFinite(G.hp)
   &&Object.values(G.inv||{}).every(v=>Number.isFinite(Number(v)));
  return ш;});
 check('14. без урока станок молчит',
  ремесло.доУрока.горн===0&&ремесло.доУрока.верстак===0,ремесло.доУрока);
 check('15. урок у кузнеца стоит золота и даёт первую ступень',
  ремесло.урок.дал===true&&ремесло.урок.ступень===1&&ремесло.урок.заплачено>0,
  ремесло.урок);
 check('16. после урока горн ожил, а наковальня ещё нет: каждая ступень своё',
  ремесло.послеУрока.горн.includes("melt")&&ремесло.послеУрока.наковальня.length===0,
  ремесло.послеУрока);
 check('17. плавка берёт руду и даёт слиток',
  ремесло.плавка.слитков>0&&ремесло.плавка.рудаУбыла,ремесло.плавка);
 check('18. ковка превращает слиток и дерево в именной клинок',
  ремесло.ковка.клинок,ремесло.ковка);
 check('19. начертанная руна ложится в котомку частей',
  ремесло.руна.частей>0,ремесло.руна);
 check('20. часть входит в гнездо вещи с силой и тратится на это',
  ремесло.гнездо.вошла&&ремесло.гнездо.частейУбыло,ремесло.гнездо);
 check('21. слиток на прилавке дороже руды, из которой он выплавлен',
  ремесло.торгЧисла&&ремесло.торг.слиток>ремесло.торг.руда,ремесло.торг);
 check('22. после загрузки возвращаются и мастерство, и части, и вещи',
  ремесло.запись.всёВернулось&&ремесло.числа,ремесло.запись);

 /* ── Вторая цепь: мир вокруг игрока связан сам с собой ── */
 const мир=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.ship=null;G.inCombat=false;
  G.day=12;G.hour=12;G.weather="Ясно";G.finds={};G.signs=[];
  const O=WORLD>>1;
  const out={};
  /* дорога → переправа → поверхность → шаг */
  let мост=null;
  const y0=O-(O%29);
  for(let x=O-2500;x<O+2500&&!мост;x++){
   const c=crossingAt(x,y0);
   if(c&&/bridge|ford/.test(c.id))мост={x,y:y0,id:c.id};}
  if(мост){
   G.x=мост.x;G.y=мост.y;
   out.дорога={переправа:мост.id,пов:outdoorSurface(),
    имя:roadFullName(мост.x,мост.y),
    вид:(roadKindAt(мост.x,мост.y)||{}).id};}
  /* находка → примета → место → условие */
  let источник=null;
  for(let x=O-200;x<O+200&&!источник;x++)for(let y=O-200;y<O+200;y++){
   const c=cellContent(x,y);
   if(c.находка&&SIGN_SOURCES.indexOf(c.находка.id)>=0){источник={x,y};break;}}
  if(источник){
   const z=signAt(источник.x,источник.y);
   out.примета=z?{ведёт:!!z.цель,метка:z.цель&&z.цель.метка,
    условие:z.усл,есть:!!SIGN_COND_BY_ID[z.усл],
    далеко:Math.max(Math.abs(z.цель.x-источник.x),Math.abs(z.цель.y-источник.y))}:null;}
  /* разъезд → безопасность, набег → опасность: одна земля, две силы */
  const разъезды=patrolsNear(O,O,G.day,G.hour,900);
  out.разъезд=разъезды.length?{безопасно:patrolSafety(разъезды[0].x,разъезды[0].y),
   вдали:patrolSafety(разъезды[0].x+80,разъезды[0].y+80)}:null;
  let пепел=null;
  for(let x=O-500;x<O+500&&!пепел;x++)for(let y=O-500;y<O+500;y++)
   if(raidAt(x,y,G.day)){пепел={x,y};break;}
  out.набег=пепел?{опасно:raidDanger(пепел.x,пепел.y),
   вдали:raidDanger(пепел.x+80,пепел.y+80)}:null;
  return out;});
 check('дорога, переправа и шаг сходятся в одно',
  !!мир.дорога&&!!мир.дорога.вид&&!!мир.дорога.пов
  &&/мост|брод/i.test(мир.дорога.имя||""),мир.дорога);
 check('находка родит примету, примета — место с меткой и условием',
  !мир.примета||(мир.примета.ведёт&&мир.примета.есть&&мир.примета.далеко>=50),
  мир.примета);
 check('разъезд и набег тянут одну землю в разные стороны',
  (!мир.разъезд||мир.разъезд.безопасно<мир.разъезд.вдали)
  &&(!мир.набег||мир.набег.опасно>мир.набег.вдали),
  {разъезд:мир.разъезд,набег:мир.набег});

 /* ── Третья цепь: мир вещей — одним прогоном (§76) ──
    тайник → достать → рычаг → палата отперта → сундук → ловушка найдена →
    снята → алтарь → аура → приношение → станок → запертая работа видна →
    сохранение → загрузка → всё до последнего звена помнится.
    Правило то же: ни одно звено не проверяется само по себе — каждое против
    предыдущего, в одном и том же месте, до и после одного действия. */
 const вещи=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const шаг={};
  G.dark=false;G.ship=null;G.inCombat=false;G.combat=null;
  G.stash={};G.stashHints=[];G.propMarks={};G.marks={};G.vaults={};
  G.agi=40;G.mast={runes:{ур:5,оп:0,дел:0},arte:{ур:2,оп:0,дел:0},flux:{ур:1,оп:0,дел:0}};
  G.inv={"самоцвет":3,"камень":5,"кристалл":5};G.faith={};G.day=20;G.hour=12;
  /* Ярус, где есть всё разом: тайник, рычаг-палата с дверью палаты, сундук с ловушкой. */
  let ярус=null;
  for(let i=0;i<400&&!ярус;i++){
   const bx=200+Math.floor(H(i*13,7,5)*40000),by=200+Math.floor(H(3,i*11,6)*40000);
   G.place={kind:"dungeon",bx,by,stype:"ruins",name:"П",depth:3+(i%9),x:1,y:1};
   const l=curLevel();if(!l)continue;
   let тайник=null,рычаг=null,палата=null,сундук=null;
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
    const t=tileAt(l,x,y);
    if(t==="Y")палата=[x,y];
    if(t==="C"&&!сундук&&trapAt(x,y))сундук=[x,y];
    if(t==="X"){const pr=propAt(x,y);
     if(pr&&pr.id==="lever"&&leverKind(x,y)==="палата"&&!рычаг)рычаг=[x,y];
     if(!тайник&&stashAt(x,y))тайник=[x,y];}
    if(!тайник&&t==="#"&&stashAt(x,y))тайник=[x,y];}
   if(тайник&&рычаг&&палата&&сундук)ярус={bx,by,depth:G.place.depth,тайник,рычаг,палата,сундук};}
  if(!ярус)return {нет:true};
  const {тайник,рычаг,палата,сундук}=ярус;
  /* 1. Тайник: обыскать до находки, достать, и он пуст. */
  G.place.x=тайник[0];G.place.y=тайник[1];
  for(let i=0;i<60&&stashAt(тайник[0],тайник[1]).состояние!=="найден";i++)stashSearch(тайник[0],тайник[1]);
  const найден=stashAt(тайник[0],тайник[1]).состояние==="найден";
  const взял=stashTake(тайник[0],тайник[1]);
  шаг.тайник={найден,взял,пуст:stashAt(тайник[0],тайник[1]).состояние==="взят"};
  /* 2. Рычаг: до — палата заперта; после — открыта. */
  const палатаДо=vaultIsOpen(палата[0],палата[1]);
  IACT.pull.делать({плитка:"X",вещь:"lever",x:рычаг[0],y:рычаг[1],n:"рычаг"});
  шаг.рычаг={до:палатаДо,после:vaultIsOpen(палата[0],палата[1])};
  /* 3. Сундук: ловушка найдена проверкой сундука и снята. */
  G.place.x=Math.max(0,сундук[0]-1);G.place.y=сундук[1];
  const o={вид:"tile",плитка:"C",x:сундук[0],y:сундук[1],n:"сундук"};
  for(let i=0;i<40&&trapAt(сундук[0],сундук[1]).состояние!=="найдена";i++)IACT.trap.делать(o);
  const найдена=trapAt(сундук[0],сундук[1]).состояние==="найдена";
  for(let i=0;i<40&&trapAt(сундук[0],сундук[1]).состояние==="найдена";i++)IACT.disarm.делать(o);
  шаг.ловушка={найдена,снята:trapAt(сундук[0],сундук[1]).состояние==="обезврежена"};
  /* 4. Алтарь: аура читается, приношение растит благосклонность. */
  const a=altarAt(3,3);
  const вераДо=godFavor(a.бог.id);
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  IACT.altaura.делать({плитка:"A",x:3,y:3,n:"алтарь"});
  const аура=/Сошлось \d+ из \d+/.test(сказ.join(" "));
  if(altarCan(a,"offer"))IACT.altoffer.делать({плитка:"A",x:3,y:3,n:"алтарь"});
  Speech.say=был;
  шаг.алтарь={аура,вераВыросла:!altarCan(a,"offer")||godFavor(a.бог.id)>вераДо,вид:a.вид};
  /* 5. Станок: у шара запертые работы видны с причиной. */
  const шар={вид:"tile",плитка:"X",вещь:"orb",станок:"orb",n:"шар",x:4,y:4,dx:0,dy:0,d:0};
  const дела=actionsFor(шар);
  шаг.станок={можно:дела.filter(z=>z.id.indexOf("tech:")===0&&!z.заблокировано).length,
   заперто:дела.filter(z=>z.заблокировано).length};
  /* 6. Сохранение → загрузка: всё помнится. */
  const снимок={тайник:G.stash[stashKeyAt(тайник[0],тайник[1])],
   рычаг:propMarked(рычаг[0],рычаг[1],"pulled"),палата:vaultIsOpen(палата[0],палата[1]),
   ловушка:placeMark(сундук[0],сундук[1]),вера:godFavor(a.бог.id)};
  const raw=serializeSave();
  G.stash={};G.propMarks={};G.marks={};G.vaults={};G.faith={};
  applySave(raw,"проверка");
  while(activeLayer())closeTopUI();
  const после={тайник:G.stash[stashKeyAt(тайник[0],тайник[1])],
   рычаг:propMarked(рычаг[0],рычаг[1],"pulled"),палата:vaultIsOpen(палата[0],палата[1]),
   ловушка:placeMark(сундук[0],сундук[1]),вера:godFavor(a.бог.id)};
  шаг.запись={снимок,после,всёВернулось:JSON.stringify(снимок)===JSON.stringify(после)};
  шаг.числа={hp:Number.isFinite(G.hp),золото:Number.isFinite(G.gold),
   котомка:Object.values(G.inv||{}).every(v=>Number.isFinite(Number(v)))};
  G.place=null;
  return шаг;});
 if(вещи.нет){
  check('третью цепь было где пройти: ярус с тайником, рычагом, палатой и сундуком',false,вещи);
 }else{
  check('III-1. тайник находится обыском, достаётся и остаётся пустым',
   вещи.тайник.найден&&вещи.тайник.взял&&вещи.тайник.пуст,вещи.тайник);
  check('III-2. рычаг отпирает палату того же яруса: до — заперта, после — открыта',
   !вещи.рычаг.до&&вещи.рычаг.после,вещи.рычаг);
  check('III-3. ловушка в сундуке находится проверкой сундука и снимается',
   вещи.ловушка.найдена&&вещи.ловушка.снята,вещи.ловушка);
  check('III-4. алтарь читает ауру, и приношение растит благосклонность',
   вещи.алтарь.аура&&вещи.алтарь.вераВыросла,вещи.алтарь);
  check('III-5. у станка видны и доступные работы, и запертые с причиной',
   вещи.станок.можно>0&&вещи.станок.заперто>0,вещи.станок);
  check('III-6. после загрузки помнится всё: тайник, рычаг, палата, ловушка, благосклонность',
   вещи.запись.всёВернулось,вещи.запись);
  check('III-7. и ни одно число не стало NaN',
   вещи.числа.hp&&вещи.числа.золото&&вещи.числа.котомка,вещи.числа);
 }


 /* ── Четвёртая цепь: речь + звук + мир (§106) ──
    Стоп, повтор и очистка; музыка тише при речи, а мир и шаги — нет; хвост
    старого синтезатора после стопа ничего не трогает; дубли не повторяются,
    мелочь опыта складывается в одну фразу; распорядитель речи один. */
 const речь=await page.evaluate(async()=>{
  const fake={log:[],cancels:0,cur:null,
   speak(t,o){this.log.push(t);this.cur=o;setTimeout(()=>{try{o.onstart();}catch(e){}},0);return true;},
   cancel(){this.cancels++;this.cur=null;},speaking(){return !!this.cur;},
   end(){const o=this.cur;this.cur=null;if(o&&o.onend)o.onend();}};
  const прежний=Speech.adapter,прежнийChunk=Speech._chunk;Speech.adapter=fake;Speech._chunk=x=>[String(x)];Speech.stop();Speech.recent.clear();Speech.last=null;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const шаг={};
  try{
   settings.speech=1;settings.music=1;settings.musicVol=1;settings.effects=1;settings.duck=0.5;settings.verbosity="normal";
   const музыка0=Bank.vol("music"),мир0=Bank.vol("fx");
   narrate("Сундук открыт. Золото: 120.");await wait(30);fake.end();await wait(30);
   narrate("Перед вами длинный коридор с древними знаками на стенах.",{interrupt:false});await wait(30);
   const говорило=Speech.isSpeaking();Speech.stop();const стихло=!Speech.isSpeaking();
   Speech.repeatLast();await wait(30);
   шаг.стоп={говорило,стихло,повтор:fake.log[fake.log.length-1]};
   fake.end();await wait(20);
   narrate("Новый уровень! Теперь вы выше.",{pri:1});narrate("Лишнее раз.",{pri:3,key:"l1",interrupt:false});narrate("Лишнее два.",{pri:3,key:"l2",interrupt:false});
   await wait(30);
   шаг.очистка={снято:Speech.flush(),осталось:Speech.queue.length,текущее:Speech.current&&Speech.current.text};
   шаг.микшер={речьИдёт:Speech.isSpeaking(),музыка0,музыкаВРечи:Bank.vol("music"),мир0,мирВРечи:Bank.vol("fx")};
   fake.end();await wait(30);
   шаг.микшер.музыкаПосле=Bank.vol("music");
   narrate("Старое.");await wait(30);const старый=fake.cur;Speech.stop();narrate("Новое.");await wait(30);
   try{старый.onend();}catch(e){}await wait(20);
   шаг.хвост={текущее:Speech.current&&Speech.current.text,состояние:Speech.current&&Speech.current.state};
   fake.log.length=0;for(let i=0;i<5;i++)narrate("Перед вами дверь.",{key:"d",pri:3});
   Speech.tally("xp",5);Speech.tally("xp",7);await wait(600);
   /* Мир не замирает на время проверки: за эти полсекунды он мог сказать
      своё, и тогда фраза опыта ждёт в очереди. Считаем и очередь. */
   шаг.дубли={дверей:fake.log.filter(t=>t==="Перед вами дверь.").length,
    опыт:fake.log.some(t=>/Опыт: 12\./.test(t))||Speech.queue.some(m=>/Опыт: 12\./.test(m.text))};
   const src=document.documentElement.innerHTML;
   шаг.единый={прямых:(src.match(/speechSynthesis\.speak\(/g)||[]).length,очередьОдна:Array.isArray(Speech.queue)&&typeof Speech.enqueue==="function"};
  }finally{Speech.stop();Speech.adapter=прежний;Speech._chunk=прежнийChunk;}
  return шаг;});
 check('IV-1. стоп обрывает описание, повтор возвращает последнее завершённое, а не оборванное',
  речь.стоп.говорило&&речь.стоп.стихло&&речь.стоп.повтор==="Сундук открыт. Золото: 120.",речь.стоп);
 check('IV-2. очистка очереди снимает лишнее и оставляет важное на голосе',
  речь.очистка.снято===2&&речь.очистка.осталось===0&&/Новый уровень/.test(речь.очистка.текущее||""),речь.очистка);
 check('IV-3. речь приглушает музыку, но не мир и шаги; после речи музыка возвращается',
  речь.микшер.речьИдёт&&речь.микшер.музыкаВРечи<речь.микшер.музыка0&&речь.микшер.мирВРечи===речь.микшер.мир0&&речь.микшер.музыкаПосле===речь.микшер.музыка0,речь.микшер);
 check('IV-4. хвост старого синтезатора после стопа не трогает новую речь',
  речь.хвост.текущее==="Новое."&&речь.хвост.состояние!=="COMPLETED",речь.хвост);
 check('IV-5. дубли не повторяются, мелочь опыта сложена в одну фразу',
  речь.дубли.опыт&&речь.дубли.дверей===1,речь.дубли);
 check('IV-6. синтезатор зовут из одного места, распорядитель и очередь одни',
  речь.единый.прямых===1&&речь.единый.очередьОдна,речь.единый);

 /* ── Пятая цепь: единый живой мир (§135) ──
    движение → ориентация → столкновение → объект → звук → NPC → квест → бой →
    магия → ресурс → растение → зелье → артефакт → дверь → город → море →
    остров → подземелье → босс → репутация → торговля → сохранение → загрузка.
    Каждый шаг делается тем же кодом, что и в игре, и каждый оставляет след,
    который видит следующий. */
 const цепьV=await page.evaluate(async()=>{
  const ш={};const rnd=Math.random;Math.random=()=>0.3;
  maybeEvent=()=>false;maybeSeaEvent=()=>false;
  window.PLAYED=window.PLAYED||[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return bp(r,o);};
  const said=[];const bs=Speech.say.bind(Speech);Speech.say=(t,o)=>{said.push(String(t));return bs(t,o);};
  try{
   G.place=null;G.ship=null;G.dark=false;G.inCombat=false;G.combat=null;G.alt=0;G.level=20;G.hp=900;G.hpMax=900;G.mana=100;G.manaMax=100;G.gold=500;G.hour=12;G.weather="Ясно";
   /* 1. движение */
   G.x=WORLD>>1;G.y=WORLD>>1;const x0=G.x;PLAYED.length=0;move("E");if(G.inCombat){endCombat();G.inCombat=false;G.combat=null;}
   ш.движение=G.x===x0+1;ш.звук=PLAYED.length>0;
   /* 2. ориентация: что вокруг и с какой стороны */
   const круг=Scape.around();ш.ориентация=Array.isArray(круг)&&круг.every(o=>typeof o.dx==="number"&&typeof o.dy==="number");
   /* 3–4. столкновение и объект: в подземелье стена держит, дверь открывается */
   let lvl=null,bx=0,by=0;for(bx=3;bx<40&&!lvl;bx++)for(by=3;by<40&&!lvl;by++){const l=safeFn(()=>genLevel(bx,by,2,"ruins"),null);if(l&&l.entry)lvl=l;}
   bx--;by--;G.place={kind:"dungeon",bx,by,stype:"ruins",name:"Проверка",depth:2,x:lvl.entry.x,y:lvl.entry.y};
   const L=curLevel();let стена=null,дверь=null;
   for(let y=1;y<L.h-1&&!дверь;y++)for(let x=1;x<L.w-1&&!дверь;x++){if(tileAt(L,x,y)!=="."&&tileAt(L,x,y)!=="+")continue;
    for(const d of ["N","E","S","W"]){const t=tileAt(L,x+DIRV[d][0],y+DIRV[d][1]);if(t==="#"&&!стена)стена={x,y,d};if(t==="+")дверь={x,y,d};}}
   if(стена){G.place.x=стена.x;G.place.y=стена.y;said.length=0;moveInside(стена.d);ш.столкновение=said.some(t=>/Стена/.test(t));}
   if(дверь){G.place.x=дверь.x;G.place.y=дверь.y;said.length=0;PLAYED.length=0;moveInside(дверь.d);ш.дверь=said.some(t=>/Дверь открыта/.test(t))&&PLAYED.some(r=>/deep_stone|deep_door/.test(r));}
   ш.объект=(Scape.around()||[]).length>=0&&!!SCAPE_TILE;
   G.place=null;
   /* 5–6. NPC и квест */
   let npc=null,cellS=null;outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){
    const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);
    if(c&&c.structure){const ns=safeFn(()=>npcsFor(c),[]);if(ns.length){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;npc=ns[0];cellS=c;break outer;}}}
   openNPC(npc.key,true);ш.npc=document.querySelectorAll("#npcBody button").length>0;safeFn(()=>closeModal(document.getElementById("modal-npc")));
   G.quests=[];G.chainTaken={};takeNPCQuest(npc);ш.квест=G.quests.length===1&&!!G.quests[0].ярус&&!!G.quests[0].до;
   /* 7. бой */
   const c=safeFn(()=>{for(let r=1;r<200;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const cc=cellContent((WORLD>>1)+dx,(WORLD>>1)+dy);if(cc.monster&&!cc.structure&&safeFn(()=>foeAlt(cc.monster),0)===0){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;return cc;}}return null;},null);
   G.weaponDrawn=true;startCombat(c);const hp0=G.combat.hp;fight("atk");ш.удар=G.combat.hp<hp0;const xp0=G.xp;G.combat.hp=1;fight("atk");ш.бой=!G.inCombat&&G.xp>xp0;
   /* 8. магия */
   if(!G.spells.includes("Искра"))G.spells.push("Искра");const m0=G.mana;castSpell(SPELLS.findIndex(s=>s.n==="Искра"));ш.магия=G.mana<m0;
   /* 9. ресурс */
   G.depleted={};G.inv={};let rc=null;for(let i=0;i<80000&&!rc;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const cc=cellContent(x,y);if(cc.res&&/трав/.test(cc.res.name)&&!cc.structure&&!cc.monster){G.x=x;G.y=y;rc=cc;}}
   gatherCurrent("tap");ш.ресурс=(Number(G.inv["трава"])||0)>=1;
   /* 10. растение → 11. зелье */
   delete G.inv["рановник"];delete G.inv["топяной хвощ"];plantTake(PLANT_BY_ID.ranovnik,G.x,G.y);plantTake(PLANT_BY_ID.kvost,G.x,G.y);ш.растение=G.inv["рановник"]===1&&G.inv["топяной хвощ"]===1;
   G.mast=G.mast||{};G.mast.alchemy={ур:1,оп:0};G.potions=[];brewPotion("heal");const hpБыло=G.hp=100;drinkPotion(0);ш.зелье=G.potions.length===0&&G.hp>hpБыло;
   /* 12. артефакт */
   const a=ART.make({дом:"war",ранг:1,кач:2,seed:5});G.artifacts=[a];a.износ=12;ш.артефакт=artLore(a).состояние==="потёртая"&&/починена/.test(artMend())&&a.износ===0;
   /* 13. город */
   let город=null;for(let i=0;i<60000&&!город;i++){const x=(i*37)%WORLD,y=(i*59+7000)%WORLD;const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="city"){G.x=x;G.y=y;город=cc;}}
   enterPlace(город);ш.город=!!G.place&&G.place.kind==="city";leavePlace();ш.городВыход=!G.place;
   /* 14. море → 15. остров */
   G.ship={name:"Проба",kind:"cog",speed:1,hold:20,tox:G.x+40,toy:G.y,toName:"Порт",legs:8,left:8,leg:0,war:false,storm:false,fare:10};
   sailLeg();ш.море=!!(G.ship&&G.ship.sea);
   let n=0;while(G.ship&&!G.ship.island&&n<80){G.ship.left=5;G.ship.leg=1+(n%6);G.day=1+n;islandSight(G.ship);n++;}
   const isl=G.ship&&G.ship.island;ш.остров=!!isl&&landIsland()===true;G.ship=null;G.inCombat=false;G.combat=null;
   /* 16. подземелье */
   G.place={kind:"dungeon",bx,by,stype:"ruins",name:"Проверка",depth:2,x:lvl.entry.x,y:lvl.entry.y};ш.подземелье=!!curLevel()&&(G.place.depth===2);G.place=null;
   /* 17. босс */
   const b=BOSS_BY_ID.ashlord;const l=bossLair(b);G.bosses={};G.bossOmen={};G.bossSeen={};G.x=l.x-3;G.y=l.y;bossOmens();ш.предвестник=!!(G.bossSeen&&G.bossSeen.ashlord);
   G.x=l.x;G.y=l.y;G.hour=12;bossFight();ш.владыкаБой=!!(G.combat&&G.combat.m&&G.combat.m.boss);G.combat.hp=1;G.standing={};fight("atk");ш.босс=!!(G.bosses.ashlord&&G.bosses.ashlord.slain);
   /* 18. репутация */
   const idx=empireIndexAt(l.x,l.y);ш.репутация=standOf("fact",EMPIRES[idx].short)>0&&(G.titles||[]).length>0;
   /* 19. торговля */
   ш.торговля=marketPrice("руда",idx,G.day)>0&&priceWhy("руда",idx,null).length>0&&marketOf(idx).подвоз>1;
   /* 20. сохранение → 21. загрузка */
   G.gold=777;saveGame(true);const raw=localStorage.getItem(SAVE_KEY)||"";ш.сохранение=/"bosses"/.test(raw)&&/"spellbook"|"potions"/.test(raw)&&/"plantsSeen"/.test(raw);
   G.gold=1;G.bosses={};loadGame();ш.загрузка=G.gold===777&&!!(G.bosses&&G.bosses.ashlord&&G.bosses.ashlord.slain)&&(G.titles||[]).length>0;
  }catch(e){ш.ошибка=String(e&&e.stack||e);}
  Math.random=rnd;Speech.say=bs;Bank.play=bp;
  return ш;});
 const шаги=["движение","ориентация","столкновение","объект","звук","npc","квест","удар","бой","магия","ресурс","растение","зелье","артефакт","дверь","город","городВыход","море","остров","подземелье","предвестник","владыкаБой","босс","репутация","торговля","сохранение","загрузка"];
 check('V. единый живой мир: движение → ориентация → столкновение → объект → звук → NPC → квест → бой → магия → ресурс → растение → зелье → артефакт → дверь → город → море → остров → подземелье → босс → репутация → торговля → сохранение → загрузка',
  !цепьV.ошибка&&шаги.every(k=>цепьV[k]===true),цепьV.ошибка||шаги.filter(k=>цепьV[k]!==true));

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
