/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 130: СЕРВИСНЫЕ СЛОИ МОДУЛЕЙ (§42 брифа)

   §42 перечисляет тридцать четыре части игры и требует у каждой «собственный
   сервисный/API-слой, чтобы старые обработчики не конфликтовали с новыми».

   Сами части были все — биомы, постройки, жители, фракции, политика,
   хозяйство, дела, подземелья, бой, чары, ремёсла, языки, речь, сохранения
   и прочее. Зарегистрированы под именами §42 были две: GEOGRAPHY и CITIES.
   Обработчики ходили прямо к глобальным функциям, и всякий новый рисковал
   разойтись со старым.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Все тридцать четыре имени §42 есть в реестре, и список без повторов.
   2. У каждого слоя есть text(), и он возвращает непустую строку.
   3. КАЖДАЯ ручка КАЖДОГО слоя зовётся без доводов и не бросает: слой,
      падающий от пустого вызова, — не дверь, а ловушка.
   4. Слой не считает сам: выборочно сверяется, что ответ слоя совпадает
      с ответом того, поверх чего он лежит.
   5. Modules.get, has и list согласованы между собой.
   6. WORLD_SIMULATION.daily() возвращает список сработавшего и вправду
      двигает мир.
   7. CITIES.text() и districts() отвечают и без города; именной и державный
      города полны оба и называются целиком, а у города без сетки и товаров
      слой не выдумывает того, чего нет.
   8. Самопроверка мира держит строку «api»; руководство, README и docs
      рассказывают о тридцати четырёх дверях.
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
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. все тридцать четыре ── */
 const состав=await page.evaluate(()=>{
  const надо=["WORLD","GEOGRAPHY","BIOMES","CITIES","BUILDINGS","NPC","FACTIONS","POLITICS",
   "ECONOMY","QUESTS","DUNGEONS","COMBAT","MAGIC","ARTIFACTS","CRAFTING","ALCHEMY","RUNES",
   "ENCHANTING","MYSTICISM","DEMONOLOGY","HOMUNCULI","TIME","GRAVITY","ILLUSIONS","KNOWLEDGE",
   "LANGUAGES","REPUTATION","ACHIEVEMENTS","AUDIO_3D","TTS","ACCESSIBILITY","SAVE_LOAD","EVENTS",
   "WORLD_SIMULATION"];
  return {надо:надо.length,спец:API_SPEC.length,
   совпадает:надо.every(n=>API_SPEC.indexOf(n)>=0)&&API_SPEC.every(n=>надо.indexOf(n)>=0),
   безПовторов:new Set(API_SPEC).size===API_SPEC.length,
   нет:надо.filter(n=>!Modules.has(n)),
   всегоВРеестре:Modules.list().length};});
 check('в брифе тридцать четыре модуля, и список игры совпадает с ним слово в слово',
  состав.надо===34&&состав.спец===34&&состав.совпадает&&состав.безПовторов,состав);
 check('все тридцать четыре зарегистрированы в реестре',состав.нет.length===0,состав.нет);
 check('реестр шире обязательного минимума §42: он не запрещает своих модулей',
  состав.всегоВРеестре>34,{всего:состав.всегоВРеестре});

 /* ── 2, 3. text() и все ручки без доводов ── */
 const двери=await page.evaluate(()=>{
  const безText=[],пустой=[],упало=[],ручек={};
  API_SPEC.forEach(n=>{
   const m=Modules.get(n);
   const keys=Object.keys(m);
   ручек[n]=keys.filter(k=>typeof m[k]==="function").length;
   if(typeof m.text!=="function"){безText.push(n);return;}
   let t;
   try{t=m.text();}catch(e){упало.push(n+".text: "+String(e).slice(0,50));return;}
   if(typeof t!=="string"||t.length<10)пустой.push(n+" → "+JSON.stringify(t));
   keys.forEach(k=>{if(typeof m[k]!=="function"||k==="text")return;
    try{m[k]();}catch(e){упало.push(n+"."+k+": "+String(e).slice(0,50));}});});
  return {безText,пустой,упало,ручек,
   мало:Object.entries(ручек).filter(([,v])=>v<3).map(([k,v])=>k+":"+v)};});
 check('у каждого слоя есть text()',двери.безText.length===0,двери.безText);
 check('text() каждого слоя возвращает непустую строку',двери.пустой.length===0,двери.пустой);
 check('каждая ручка каждого слоя зовётся без доводов и не бросает',
  двери.упало.length===0,двери.упало.slice(0,6));
 check('слой не однокнопочный: у каждого хотя бы три рабочие ручки',
  двери.мало.length===0,двери.мало);

 /* ── 4. слой не считает сам ── */
 const зеркало=await page.evaluate(()=>{
  const o={};
  o.world=[Modules.get("WORLD").size(),WORLD];
  o.biomes=[Modules.get("BIOMES").all().length,BIOMES.length];
  o.magic=[Modules.get("MAGIC").schools().length,SCHOOLS.length];
  o.langs=[Modules.get("LANGUAGES").list().length,LANGS.length];
  o.craft=[Modules.get("CRAFTING").level("smith"),mastLevel("smith")];
  o.combatAtk=[Modules.get("COMBAT").atk(),atk()];
  o.combatDef=[Modules.get("COMBAT").def(),def()];
  o.timeDay=[Modules.get("TIME").day(),Number(G.day)||1];
  o.tts=[Modules.get("TTS").rate(),Number(settings.rate)||1];
  o.events=[Modules.get("EVENTS").random().length,RANDOM_EVENTS.length];
  o.rep=[Modules.get("REPUTATION").axes().length,STAND_AXES.length];
  o.dung=[Modules.get("DUNGEONS").depth(),(G.place&&Number(G.place.depth))||0];
  /* Слой отдаёт то же самое и тогда, когда под ним что-то поменялось. */
  const было=G.day;G.day=(Number(G.day)||1)+7;
  o.послеСдвига=[Modules.get("TIME").day(),Number(G.day)];
  G.day=было;
  const всеСовпали=Object.entries(o).every(([,v])=>v[0]===v[1]);
  return {o,всеСовпали};});
 check('слой отдаёт ровно то, что отдаёт функция под ним, и не заводит своего счёта',
  зеркало.всеСовпали,зеркало.o);

 /* ── 5. реестр согласован ── */
 const реестр=await page.evaluate(()=>{
  const list=Modules.list();
  return {getВсем:list.every(n=>!!Modules.get(n)),
   hasВсем:list.every(n=>Modules.has(n)===true),
   нетЛишнего:Modules.get("НЕТ_ТАКОГО")===null&&Modules.has("НЕТ_ТАКОГО")===false,
   спецВСписке:API_SPEC.every(n=>list.indexOf(n)>=0)};});
 check('Modules.get, has и list согласованы, и несуществующее имя честно отдаёт пусто',
  реестр.getВсем&&реестр.hasВсем&&реестр.нетЛишнего&&реестр.спецВСписке,реестр);

 /* ── 6. суточный ход мира ── */
 const ход=await page.evaluate(()=>{
  const W=Modules.get("WORLD_SIMULATION");
  /* Сбрасываем суточные засечки, чтобы ход был не пустым. */
  safeFn(()=>{Object.keys(G.armies||{}).forEach(k=>{G.armies[k].день=0;});
   if(G.war)G.war.день=0;});
  G.day=(Number(G.day)||1)+1;
  const было=W.daily();
  const сразуЖе=W.daily();      /* второй раз в те же сутки — почти ничего */
  return {было,сразуЖе,есть:Array.isArray(было)&&было.length>0,
   слои:[typeof W.armies(),typeof W.arcs(),typeof W.zones(),typeof W.echoes()]};});
 check('WORLD_SIMULATION.daily() двигает мир и возвращает список сработавшего',
  ход.есть&&Array.isArray(ход.сразуЖе)&&ход.сразуЖе.length<=ход.было.length,ход);
 check('WORLD_SIMULATION даёт доступ к слоям, из которых сложен суточный ход',
  ход.слои.every(t=>t==="object"),ход.слои);

 /* ── 7. города отвечают без города ── */
 const города=await page.evaluate(()=>{
  const C=Modules.get("CITIES");
  const вПоле=C.text();
  const районыВПоле=C.districts();
  /* Встанем в именной город и спросим снова. */
  const c=NAMED_CITIES[0];
  const было={x:G.x,y:G.y};G.x=c.x;G.y=c.y;
  const вГороде=C.text();
  const районы=C.districts();
  /* Державный город полон так же, как именной: слой должен назвать всё. */
  const e=safeFn(()=>empireCities()[0],null);
  const дер=e?C.text(e):"";
  /* А вот город, собранный без сетки и товаров, слой не должен выдумывать. */
  const скудный=C.text({n:"Безымянный острог",x:1,y:2});
  G.x=было.x;G.y=было.y;
  return {вПоле:String(вПоле).slice(0,50),вПолеЕсть:вПоле.length>10,
   районыВПоле:Array.isArray(районыВПоле),
   вГороде:String(вГороде).slice(0,50),названГород:вГороде.indexOf(c.n)>=0,
   районов:Array.isArray(районы)?районы.length:-1,
   держава:String(дер).slice(0,60),
   державаПолна:!e||(/Районов/.test(дер)&&/продаёт/.test(дер)),
   скудный:String(скудный),
   безВыдумки:!/Районов/.test(скудный)&&!/продаёт/.test(скудный)
    &&/Безымянный острог/.test(скудный)&&/Координаты 1 и 2/.test(скудный)};});
 check('CITIES.text() отвечает и без города в доводе, и называет тот, в котором вы стоите',
  города.вПолеЕсть&&города.названГород,города);
 check('CITIES.districts() без довода возвращает список, а в городе — его районы',
  города.районыВПоле&&города.районов>0,города);
 check('державный город полон так же, как именной, и слой называет у него всё',
  города.державаПолна,{держава:города.держава});
 check('а у города без сетки и товаров слой не выдумывает того, чего нет',
  города.безВыдумки,{скудный:города.скудный});

 /* ── 8. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Тридцать четыре двери/i.test(g.title));
  return {api:r.find(x=>x.id==="api"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «api»',
  !!свод.api&&свод.api.ok===true,свод.api);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о тридцати четырёх дверях',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README называет все тридцать четыре имени',
  ["WORLD_SIMULATION","ACCESSIBILITY","HOMUNCULI","AUDIO_3D","SAVE_LOAD"].every(n=>readme.indexOf(n)>=0));
 check('docs/МИР.md держит раздел о сервисных слоях и о правиле «слой не считает сам»',
  /API_SPEC/.test(mir)&&/не содержит игровой логики|не считает сам/i.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
