/* ════════════════════════════════════════════════════════════════════════
   НАБОР 69: МАСТЕРСТВА, НАСТАВНИКИ И РАБОТА У СТАНКА

   Ремесло было одной кнопкой на пять рецептов: нажал — получил. Учиться
   нечему, ошибиться негде, станок не нужен — рецепты работали посреди поля.
   И список рецептов был записан ДВАЖДЫ: отдельно для показа и отдельно для
   исполнения. Два списка одного и того же — не запас, а обещание разойтись.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Список рецептов ОДИН. Показ и дело берут одно и то же; поправишь одно —
      поправится и другое.
   2. Первый уровень не даётся за уровень героя. В ученики надо проситься к
      тому, кто сам умеет, и выше себя он не научит.
   3. Работа идёт У СТАНКА. У горна своё, у наковальни своё, и доступно только
      то, до чего доросло мастерство.
   4. Работа МЕНЯЕТ мир: припас уходит, добыча приходит, опыт растёт, а на
      низком уровне работа срывается и припас пропадает зря. Ремесло без риска
      — это выдача, а не ремесло.
   5. Всё это переживает сохранение: знания не исчезают после загрузки.
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

 /* ── 1. Таблицы полны и связаны между собой ── */
 const таблицы=await page.evaluate(()=>{
  const плохиеМ=MASTERY.filter(m=>!m.id||!m.n||!m.о||!Array.isArray(m.станки)||!m.станки.length)
   .map(m=>m.id||"?");
  const плохиеТ=TECHS.filter(t=>!t.id||!t.n||!t.о||!t.значок||!MAST_BY_ID[t.маст]
   ||!Array.isArray(t.станки)||!t.станки.length||!SOUND_BANK[t.звук]
   ||(t.след&&!SOUND_BANK[t.след])).map(t=>t.id||"?");
  /* Станок каждой техники обязан быть в списке станков её мастерства. */
  const чужие=TECHS.filter(t=>!t.станки.every(s=>MAST_BY_ID[t.маст].станки.indexOf(s)>=0))
   .map(t=>t.id);
  /* Каждому мастерству кто-то учит, иначе его не начать. */
  const некому=MASTERY.filter(m=>!Object.keys(MAST_TEACH).some(p=>(MAST_TEACH[p]||{})[m.id]>0))
   .map(m=>m.id);
  /* У каждого станка есть имя вслух. */
  const безИмени=[...new Set(MASTERY.flatMap(m=>m.станки))].filter(s=>!STANOK_NAME[s]);
  return {мастерств:MASTERY.length,техник:TECHS.length,
   плохиеМ,плохиеТ,чужие,некому,безИмени,ступеней:MAST_RANK.length};});
 check('мастерств не меньше шести, и у каждого имя, описание и станки',
  таблицы.мастерств>=6&&таблицы.плохиеМ.length===0,таблицы);
 check('техник не меньше восемнадцати, и у каждой мастерство, станок и живые записи',
  таблицы.техник>=18&&таблицы.плохиеТ.length===0,таблицы);
 check('станок техники принадлежит её же мастерству',таблицы.чужие.length===0,таблицы.чужие);
 check('каждому мастерству есть у кого учиться',таблицы.некому.length===0,таблицы.некому);
 check('у каждого станка есть имя, которое можно сказать вслух',
  таблицы.безИмени.length===0,таблицы.безИмени);

 /* ── 2. Список простых рецептов ОДИН на показ и на дело ── */
 const рецепты=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.inv={"камень":9,"дерево":9,"трава":9,"ягоды":9};
  G.items=[];
  openModal("modal-craft");renderCraft();
  const тело=document.getElementById("craftList");
  const кнопки=[...тело.querySelectorAll("button[data-cmd^='craftdo']")];
  const немые=кнопки.filter(e=>!e.getAttribute("data-speak")).length;
  /* Имя в окне и имя, которое скажут при создании, — из одного места. */
  const вОкне=кнопки.map(e=>(e.getAttribute("data-speak")||"").replace(/^Создать /,"").split(".")[0]);
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  CMD.craftdo(2);   /* Факел */
  Speech.say=say;
  while(activeLayer())closeTopUI();
  return {рецептов:CRAFT_RECIPES.length,кнопок:кнопки.length,немые,вОкне,
   имена:CRAFT_RECIPES.map(r=>r.n),
   совпало:вОкне.join("|")===CRAFT_RECIPES.map(r=>r.n).join("|"),
   сказано:реплики.find(t=>/Создано/.test(t))||"",
   факел:(G.items||[]).includes("Факел")};});
 check('рецептов в окне столько же, сколько в списке, и имена те же',
  рецепты.кнопок===рецепты.рецептов&&рецепты.совпало&&рецепты.немые===0,рецепты);
 check('создание берёт тот же рецепт, что показано, и вправду даёт вещь',
  рецепты.факел&&/Факел/.test(рецепты.сказано||""),рецепты);

 /* ── 3. Первый уровень не даётся за уровень героя ── */
 const учёба=await page.evaluate(()=>{
  G.mast={};G.gold=5000;G.level=40;G.rep={};
  const безУчителя=MASTERY.map(m=>mastLevel(m.id));
  /* Опыт некуда класть, пока не было урока. */
  mastGain("smith",100);
  const послеОпыта=mastLevel("smith");
  /* Наставник: кузнец учит ковке, но не алхимии. */
  const кузнец=getNPC(900,900,0,"Кузнец");
  const учит=(mastTeaches(кузнец)||[]).map(z=>z.id);
  const золДо=G.gold;
  const далКовку=mastAsk(кузнец,"smith");
  const золПосле=G.gold;
  const далАлхимию=mastAsk(кузнец,"alchemy");
  /* Выше себя наставник не научит. */
  G.mast.smith={ур:4,оп:0,дел:0};
  const выше=mastAsk(кузнец,"smith");
  /* Без золота урока нет. */
  G.mast={};G.gold=0;
  const безДенег=mastAsk(кузнец,"smith");
  return {безУчителя,послеОпыта,учит,далКовку,далАлхимию,выше,безДенег,
   ценаУрока:золДо-золПосле};});
 check('до урока мастерств нет ни одного, и опыт класть некуда',
  учёба.безУчителя.every(v=>v===0)&&учёба.послеОпыта===0,учёба);
 check('кузнец учит ковке и не учит алхимии',
  учёба.учит.includes("smith")&&!учёба.учит.includes("alchemy")
  &&учёба.далКовку===true&&учёба.далАлхимию===false,учёба);
 check('урок стоит золота, и без золота его не дают',
  учёба.ценаУрока>0&&учёба.безДенег===false,учёба);
 check('выше себя наставник не научит',учёба.выше===false,учёба);

 /* ── 4. Работа идёт у станка, и станок решает, что можно ── */
 const станок=await page.evaluate(()=>{
  G.mast={smith:{ур:1,оп:0,дел:0}};
  const уГорна=techsAt("forge").map(t=>t.id);
  const уНаковальни=techsAt("anvil").map(t=>t.id);
  const уЧана=techsAt("cauldron").map(t=>t.id);
  G.mast={smith:{ур:3,оп:0,дел:0}};
  const уНаковальни3=techsAt("anvil").map(t=>t.id);
  G.mast={};
  const безМастерства=techsAt("forge").map(t=>t.id);
  return {уГорна,уНаковальни,уЧана,уНаковальни3,безМастерства};});
 check('без мастерства у станка не работают вовсе',
  станок.безМастерства.length===0,станок);
 check('у горна своё, у наковальни своё, и чужое мастерство туда не лезет',
  станок.уГорна.includes("melt")&&!станок.уГорна.includes("blade")
  &&станок.уЧана.length===0,станок);
 check('что можно у наковальни, решает ступень мастерства',
  станок.уНаковальни.length===0&&станок.уНаковальни3.includes("blade"),станок);

 /* ── 5. Работа меняет мир: припас уходит, добыча приходит, опыт растёт ── */
 const работа=await page.evaluate(()=>{
  const итоги=[];
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  for(const t of TECHS){
   /* Ставим мастерство с запасом, чтобы неудача не мешала мерить дело. */
   G.mast={};G.mast[t.маст]={ур:5,оп:0,дел:0};
   G.inv={"руда":20,"кристалл":20,"трава":20,"ягоды":20,"грибы":20,"дерево":20,
    "камень":20,"кость":20,"слиток":20,"тёмная смола":20,"самоцвет":20,"жильный камень":20};
   G.items=[];G.comps={};G.hp=10;G.hpMax=100;G.mana=0;G.manaMax=50;G.water=10;
   G.artifacts=[];G.day=5;G.hour=10;
   const доИнв=Object.values(G.inv).reduce((s,v)=>s+v,0);
   const доОп=mastOf(t.маст).оп,доДел=mastOf(t.маст).дел;
   const доЧас=G.day*24+G.hour;
   const зБыло=звуки.length,рБыло=реплики.length;
   const ок=techDo(t,t.станки[0]);
   const после={инв:Object.values(G.inv).reduce((s,v)=>s+v,0),
    оп:mastOf(t.маст).оп,дел:mastOf(t.маст).дел,
    час:G.day*24+G.hour,вещей:(G.items||[]).length,
    частей:Object.keys(G.comps||{}).length,
    hp:G.hp,вода:G.water};
   итоги.push({id:t.id,ок:ок===true,
    припасУшёл:после.инв<доИнв,
    делоЗасчитано:после.дел>доДел||после.оп!==доОп,
    времяУшло:после.час>доЧас,
    сказало:реплики.length>рБыло,прозвучало:звуки.length>зБыло,
    числа:Number.isFinite(G.gold)&&Number.isFinite(G.hp)&&Number.isFinite(G.water)
     &&Object.values(G.inv).every(v=>Number.isFinite(v))});}
  Bank.play=bp;Speech.say=say;
  return {проверено:итоги.length,итоги,
   неСделались:итоги.filter(o=>!o.ок).map(o=>o.id),
   безПрипаса:итоги.filter(o=>!o.припасУшёл).map(o=>o.id),
   безДела:итоги.filter(o=>!o.делоЗасчитано).map(o=>o.id),
   безВремени:итоги.filter(o=>!o.времяУшло).map(o=>o.id),
   немые:итоги.filter(o=>!o.сказало).map(o=>o.id),
   беззвучные:итоги.filter(o=>!o.прозвучало).map(o=>o.id),
   безЧисел:итоги.filter(o=>!o.числа).map(o=>o.id)};});
 check('все техники срабатывают у своего станка',
  работа.проверено>=18&&работа.неСделались.length===0,работа.неСделались);
 /* Две работы припаса не берут и брать не должны: разбор вещи и разбор письма.
    Смотреть и читать — не тратить. Времени они стоят наравне со всеми, и это
    здесь и проверяется; всё остальное обязано брать припас. */
 /* Семь работ припаса не берут, и каждая по своей причине. Разбор вещи,
    разбор письма, прочтение морока и чтение следа времени — потому что
    смотреть и читать не значит тратить. Возврат слепка — потому что платой
    был сам слепок, снятый раньше и за припас. «Собрать гомункула» и «Обряды
    демонолога» — потому что это не работа у станка, а ДВЕРЬ в свою систему:
    там свой выбор частей, свои требования и свой припас, и берётся он там, а
    не здесь. Времени стоит всякая работа, и это здесь тоже проверяется. */
 check('припас берут все работы, кроме чтения, возврата слепка и двух дверей; времени стоит всякая',
  работа.безПрипаса.slice().sort().join(",")==="analyze,decipher,echoes,potion,recall,rites,unveil,vessel"
  &&работа.безВремени.length===0,
  {безПрипаса:работа.безПрипаса,безВремени:работа.безВремени});
 check('каждая работа засчитывается в мастерство',работа.безДела.length===0,работа.безДела);
 check('каждая работа говорит и звучит',
  работа.немые.length===0&&работа.беззвучные.length===0,работа);
 check('после каждой работы запасы, здоровье и вода остались числами',
  работа.безЧисел.length===0,работа.безЧисел);

 /* ── 6. Ремесло без риска — это выдача. На пределе работа срывается ── */
 const риск=await page.evaluate(()=>{
  const t=TECH_BY_ID.melt;
  G.mast={smith:{ур:1,оп:0,дел:0}};
  const наПределе=techRisk(t);
  G.mast={smith:{ур:5,оп:0,дел:0}};
  const сЗапасом=techRisk(t);
  /* И срыв действительно случается: гоняем работу много раз. */
  G.mast={smith:{ур:1,оп:0,дел:0}};
  let срывов=0,удач=0;
  for(let i=0;i<60;i++){
   G.inv={"руда":40};G.hour=8;G.day=5;
   const инвДо=Number(G.inv["руда"])||0;
   const слитДо=Number(G.inv["слиток"])||0;
   techDo(t,"forge");
   if((Number(G.inv["слиток"])||0)>слитДо)удач++;else срывов++;}
  return {наПределе,сЗапасом,строже:наПределе>сЗапасом,срывов,удач};});
 check('на пределе мастерства работа срывается чаще, чем с запасом',
  риск.строже&&риск.наПределе>=0.2,риск);
 check('срывы и вправду случаются, но работа всё же выходит',
  риск.срывов>0&&риск.удач>0,риск);

 /* ── 7. Знания переживают сохранение ── */
 const сейв=await page.evaluate(()=>{
  G.mast={smith:{ур:3,оп:17,дел:9},alchemy:{ур:1,оп:4,дел:2}};
  const до={smith:mastLevel("smith"),оп:mastOf("smith").оп,
   alch:mastLevel("alchemy"),техник:techsAt("forge").length};
  const raw=serializeSave();
  const вЗаписи=(()=>{try{return !!JSON.parse(raw).mast;}catch(_){return false;}})();
  G.mast={};
  Object.assign(G,JSON.parse(raw));
  const после={smith:mastLevel("smith"),оп:mastOf("smith").оп,
   alch:mastLevel("alchemy"),техник:techsAt("forge").length};
  return {до,после,вЗаписи,
   тоЖе:до.smith===после.smith&&до.оп===после.оп&&до.alch===после.alch
    &&до.техник===после.техник};});
 check('мастерства попадают в саму запись сохранения',сейв.вЗаписи,сейв);
 check('после загрузки уровень, опыт и доступные техники те же',сейв.тоЖе,сейв);

 /* ── 8. Расклад по мастерствам говорит, что есть и у кого учиться ── */
 const расклад=await page.evaluate(()=>{
  G.mast={smith:{ур:2,оп:5,дел:3}};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  openMastery();
  Speech.say=say;
  const s=реплики.join(" ");
  return {есть:/кузнечное дело/.test(s),ступень:/подмастерье/.test(s),
   ктоУчит:/Кузнец/.test(s),строка:s.slice(0,240),
   доступно:amAvailable("mastery")};});
 check('расклад называет ремесло, ступень и того, у кого учиться',
  расклад.есть&&расклад.ступень&&расклад.ктоУчит,{строка:расклад.строка});
 check('пункт «Мастерства» доступен',расклад.доступно===true,расклад);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
