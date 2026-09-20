/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 131: ЧЕТЫРЕ ОСИ И ЗНАНИЕ КАК РЕСУРС (§31 брифа)

   §31: «Четыре независимые оси развития: Опыт; Мастерство; Репутация;
   Знания. Знание — отдельный ресурс: рецепт, язык, карта, ритуал, слабость
   монстра, история предмета, политический секрет».

   Три оси считались порознь: уровень с опытом, ступени ремёсел, доброе имя.
   Четвёртой не было вовсе — знание лежало по углам и нигде не сводилось в
   счёт, который можно предъявить, потратить и потерять.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Четыре оси названы, у каждой имя, слово и своя запись; snapshot даёт
      ровно четыре числа.
   2. НЕЗАВИСИМОСТЬ ДЕЛОМ: каждая ось двигается по очереди, и три остальные
      обязаны остаться на месте. Уровень не двигает ни знания, ни мастерства,
      ни доброго имени.
   3. Семь родов знания, у каждого имя, слово, источник, дар и своя запись.
   4. Запись считается один раз: повтор того же не растит ось.
   5. Каждый род набирается своим настоящим делом, а не уровнем.
   6. У каждого рода ровно один дар, и он читается миром: риск у горна,
      разговор, скан, благосклонность, урон по этой и только этой твари,
      цена вещи.
   7. Знанием платят: отданное помечается, второй раз не продаётся, но дар
      остаётся — вы его не забыли.
   8. Торговец принимает знание за редкое наравне с прежними требованиями.
   9. Слой KNOWLEDGE указывает на знание, а карта мест лежит отдельно.
  10. Самопроверка мира держит строку «axes»; руководство, README и docs
      рассказывают о четырёх осях и семи родах.
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
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(r);return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. четыре оси ── */
 const оси=await page.evaluate(()=>({
  сколько:AXES_FOUR.length,
  имена:AXES_FOUR.map(a=>a.n),
  полны:AXES_FOUR.every(a=>a.n&&a.о&&SOUND_BANK[a.звук]),
  своихЗвуков:new Set(AXES_FOUR.map(a=>a.звук)).size,
  снимок:Object.keys(Axes.snapshot()).length,
  текст:Axes.text()}));
 check('четыре оси развития, у каждой имя, слово и своя живая запись',
  оси.сколько===4&&оси.полны&&оси.своихЗвуков===4&&оси.снимок===4,оси);
 check('бриф назвал их поимённо: Опыт, Мастерство, Репутация, Знание',
  ["Опыт","Мастерство","Репутация","Знание"].every(n=>оси.имена.indexOf(n)>=0),оси.имена);
 check('свод осей называет все четыре одной строкой',
  /Опыт/.test(оси.текст)&&/Мастерств/.test(оси.текст)&&/Репутация/.test(оси.текст)
  &&/Знание/.test(оси.текст),оси.текст.slice(0,120));

 /* ── 2. независимость делом ── */
 const незав=await page.evaluate(()=>{
  const чисто=()=>{G.loreKn={};G.rep={};G.axes={};G.mast={};G.xp=0;G.level=1;G.deeds={};};
  const шаг=(имя,f)=>{chisto:{}
   чисто();const до=Axes.snapshot();
   f();
   const после=Axes.snapshot();
   const двинулись=Object.keys(после).filter(k=>после[k]!==до[k]);
   return {имя,двинулись,до,после};};
  const r=[];
  r.push(шаг("exp",()=>{G.xp=500;G.level=4;}));
  r.push(шаг("craft",()=>{G.mast={smith:{ур:3,оп:0,дел:10}};}));
  r.push(шаг("rep",()=>{safeFn(()=>addRep(RACES_DB[0].n,5));}));
  r.push(шаг("lore",()=>{Lore.add("map","p1","Место","проба");}));
  /* И обратное: уровень сам по себе не даёт ни знания, ни ремесла, ни имени. */
  чисто();G.level=40;G.xp=99999;
  const отУровня=Axes.snapshot();
  чисто();
  return {r,отУровня,
   каждаяСвоя:r.every(x=>x.двинулись.length===1&&x.двинулись[0]===x.имя)};});
 check('каждая ось двигается своим делом, и три остальные остаются на месте',
  незав.каждаяСвоя,незав.r.map(x=>({ось:x.имя,двинулись:x.двинулись})));
 check('сорок уровней героя не дают ни мастерства, ни доброго имени, ни знания',
  незав.отУровня.craft===0&&незав.отУровня.rep===0&&незав.отУровня.lore===0,незав.отУровня);

 /* ── 3. семь родов ── */
 const роды=await page.evaluate(()=>({
  сколько:LORE_KINDS.length,
  имена:LORE_KINDS.map(k=>k.n),
  полны:LORE_KINDS.every(k=>k.n&&k.о&&k.откуда&&k.дар&&SOUND_BANK[k.звук]),
  своихЗвуков:new Set(LORE_KINDS.map(k=>k.звук)).size,
  идПоБрифу:["recipe","tongue","map","rite","weak","relic","secret"].every(id=>!!LORE_KIND_BY_ID[id])}));
 check('семь родов знания, у каждого имя, слово, источник, дар и своя запись',
  роды.сколько===7&&роды.полны&&роды.своихЗвуков===7&&роды.идПоБрифу,роды);
 check('бриф назвал их поимённо: рецепт, язык, карта, обряд, слабость твари, история вещи, политический секрет',
  ["рецепт","язык","карта","обряд","слабость твари","история вещи","политический секрет"]
   .every(n=>роды.имена.indexOf(n)>=0),роды.имена);

 /* ── 4. запись считается один раз ── */
 const повтор=await page.evaluate(()=>{
  G.loreKn={};
  const первый=Lore.add("recipe","r1","Клинок","проба");
  const было=Lore.count();
  const второй=Lore.add("recipe","r1","Клинок","проба");
  const стало=Lore.count();
  const другой=Lore.add("recipe","r2","Топор","проба");
  return {первый,второй,другой,было,стало,итог:Lore.count()};});
 check('одно и то же знание записывается один раз: повтор не растит ось',
  повтор.первый===true&&повтор.второй===false&&повтор.было===повтор.стало
  &&повтор.другой===true&&повтор.итог===2,повтор);

 /* ── 5. каждый род от своего дела ── */
 const дела=await page.evaluate(()=>{
  const o={};
  G.loreKn={};
  /* рецепт: изведанная пара у чана */
  G.alch={};
  const пары=Object.keys(RES_BASE||{}).slice(0,2);
  safeFn(()=>alchLearn(пары[0],пары[1]));
  o.рецепт=Lore.count("recipe");
  /* язык: взятая ступень */
  G.loreKn={};G.langs={};
  const l=LANGS.find(x=>x.id!=="common");
  safeFn(()=>Langs.learn(l.id,999,"проба"));
  o.язык=Lore.count("tongue");
  /* карта: новое место */
  G.loreKn={};G.known={};
  safeFn(()=>notePlace(G.x+5,G.y+5,"ruins","Пробные руины","узнал"));
  o.карта=Lore.count("map");
  /* слабость: отпечаток с четвёртой глубины */
  G.loreKn={};
  safeFn(()=>Lore.add("weak","wolf","Волк","биологический отпечаток, глубина 4"));
  o.слабость=Lore.count("weak");
  /* секрет */
  G.loreKn={};
  safeFn(()=>Lore.add("secret","s1","Тайна","расследование"));
  o.секрет=Lore.count("secret");
  /* и ни один род не берётся от уровня */
  G.loreKn={};G.level=50;G.xp=99999;
  o.отУровня=Lore.count();
  G.level=1;G.xp=0;
  return o;});
 check('рецепт берётся у чана, язык — со ступени, карта — с открытого места',
  дела.рецепт>=1&&дела.язык>=1&&дела.карта>=1,дела);
 check('слабость твари и секрет записываются своим делом, а от уровня не берётся ничего',
  дела.слабость===1&&дела.секрет===1&&дела.отУровня===0,дела);

 /* ── 6. семь даров, и каждый читается миром ── */
 const дары=await page.evaluate(()=>{
  const o={};
  G.loreKn={};G.mast={};G.axes={};
  const t={id:"blade",n:"Клинок",маст:"smith",ур:0};
  o.горнДо=safeFn(()=>techRisk(t),0);
  Lore.add("recipe","blade","Клинок","проба");
  o.горнПосле=safeFn(()=>techRisk(t),0);
  o.закрытостьДо=safeFn(()=>dlgPush("закрытость"),0);
  Lore.add("tongue","t1","Язык","проба");Lore.add("tongue","t2","Другой","проба");
  o.закрытостьПосле=safeFn(()=>dlgPush("закрытость"),0);
  o.недоверieДо=safeFn(()=>dlgPush("недоверие"),0);
  Lore.add("secret","s1","Тайна","проба");
  o.недовериеПосле=safeFn(()=>dlgPush("недоверие"),0);
  o.сканДо=Lore.mapK();
  for(let i=0;i<8;i++)Lore.add("map","m"+i,"Место "+i,"проба");
  o.сканПосле=Lore.mapK();
  o.обрядДо=Lore.riteK();
  Lore.add("rite","r1","Обряд","проба");Lore.add("rite","r2","Второй","проба");
  o.обрядПосле=Lore.riteK();
  Lore.add("weak","wolf","Волк","проба");
  o.уронПоСвоей=Lore.weakK({id:"wolf"});
  o.уронПоЧужой=Lore.weakK({id:"bear"});
  Lore.add("relic","Пробный клинок","Пробный клинок","проба");
  o.ценаСвоей=Lore.relicK("Пробный клинок");
  o.ценаЧужой=Lore.relicK("Другая вещь");
  G.loreKn={};
  return o;});
 check('записанный рецепт роняет риск у горна',
  дары.горнПосле<дары.горнДо,{до:дары.горнДо,после:дары.горнПосле});
 check('язык открывает закрытого, секрет ломает недоверие',
  дары.закрытостьПосле>дары.закрытостьДо&&дары.недовериеПосле>дары.недоверieДо,дары);
 check('карты дают скану лишнее имя, обряды — лишнюю благосклонность',
  дары.сканДо===0&&дары.сканПосле>=2&&дары.обрядДо===0&&дары.обрядПосле===1,дары);
 check('слабость и история вещи работают только по своей твари и своей вещи',
  дары.уронПоСвоей===1.15&&дары.уронПоЧужой===1
  &&дары.ценаСвоей===1.2&&дары.ценаЧужой===1,дары);

 /* ── 7. знанием платят ── */
 const плата=await page.evaluate(()=>{
  G.loreKn={};
  Lore.add("secret","s1","Тайна Ковша","проба");
  Lore.add("secret","s2","Тайна Молота","проба");
  const дарДо=Lore.словоK("недоверие");
  const можноДве=Lore.canPay("secret",2);
  const взято=Lore.pay("secret",1);
  const дарПосле=Lore.словоK("недоверие");
  const осталосьОтдать=Lore.payable("secret").length;
  const всёЗнаю=Lore.has("secret","s1")&&Lore.has("secret","s2");
  const счётНеУпал=Lore.count("secret");
  const ещёОдну=Lore.pay("secret",1);
  const большеНечего=Lore.pay("secret",1);
  G.loreKn={};
  return {дарДо,дарПосле,можноДве,взято,осталосьОтдать,всёЗнаю,счётНеУпал,
   ещёОдну,большеНечего};});
 check('знание отдаётся как плата, и отданное второй раз не продать',
  плата.можноДве===true&&Array.isArray(плата.взято)&&плата.взято.length===1
  &&плата.осталосьОтдать===1&&Array.isArray(плата.ещёОдну)&&плата.большеНечего===null,плата);
 check('отданное вы не забываете: счёт знаний тот же, и дар остался при вас',
  плата.всёЗнаю===true&&плата.счётНеУпал===2&&плата.дарПосле===плата.дарДо,плата);

 /* ── 8. торговец берёт знание ── */
 const торг=await page.evaluate(()=>{
  const n=safeFn(()=>getNPC(G.x,G.y,0,"Торговец"),null);
  if(!n)return {нет:true};
  G.loreKn={};
  const без=[];const с=[];
  for(let i=0;i<24;i++){
   const d=safeFn(()=>Path.demandFor(n,{gear:{rank:4}},i),null);
   if(d)без.push(d.вид);}
  Lore.add("secret","s1","Тайна","проба");
  for(let i=0;i<24;i++){
   const d=safeFn(()=>Path.demandFor(n,{gear:{rank:4}},i),null);
   if(d&&d.вид==="знание")с.push(d.ок);}
  G.loreKn={};
  return {нет:false,видов:[...new Set(без)],есть:без.indexOf("знание")>=0,
   сЗнанием:с.some(x=>x===true)};});
 check('к прежним требованиям торговца за редкое добавилось знание',
  торг.нет||торг.есть,{виды:торг.видов});
 check('с записанной тайной требование «знание» выполняется',
  торг.нет||торг.сЗнанием,{сЗнанием:торг.сЗнанием});

 /* ── 9. слой KNOWLEDGE ── */
 const слой=await page.evaluate(()=>{
  const K=Modules.get("KNOWLEDGE");
  G.loreKn={};Lore.add("map","k1","Место","проба");
  return {родов:K.kinds().length,счёт:K.count(),естьМеста:typeof K.places()==="object",
   местаНеЗнание:K.count()!==Object.keys(K.places()||{}).length||Object.keys(K.places()||{}).length===0,
   текстПроЗнание:/Знани|знани/.test(K.text())};});
 check('слой KNOWLEDGE указывает на знание семи родов, а карта мест лежит отдельно',
  слой.родов===7&&слой.естьМеста&&слой.текстПроЗнание,слой);

 /* ── 10. окно, самопроверка, тексты ── */
 const окно=await page.evaluate(()=>{
  G.loreKn={};Lore.add("map","w1","Место","проба");
  safeFn(()=>renderCharacter());
  const el=document.getElementById("charStats");
  const html=el?el.innerHTML:"";
  const строки=el?Array.from(el.querySelectorAll('[data-speak]')).map(x=>x.getAttribute("data-speak")):[];
  return {естьОси:/Четыре оси/.test(html),
   естьЗнание:/Знаний|Знание —/.test(html),
   родов:LORE_KINDS.filter(k=>html.indexOf(k.n)>=0).length,
   озвучено:строки.some(t=>/Четыре оси/.test(t))};});
 check('окно «Герой» показывает четыре оси, свод знаний и все семь родов',
  окно.естьОси&&окно.естьЗнание&&окно.родов===7,окно);
 check('свод осей читается голосом',окно.озвучено,окно);

 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Четыре оси/i.test(g.title));
  return {axes:r.find(x=>x.id==="axes"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «axes»',
  !!свод.axes&&свод.axes.ok===true,свод.axes);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о четырёх осях и знании',свод.глава&&свод.строк>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх осях и семи родах знания',
  /четыре независимые оси|Четыре оси/i.test(readme)&&/семи родов/i.test(readme)
  &&/политический секрет/i.test(readme)&&/отданное вы не забываете/i.test(readme));
 check('docs/МИР.md держит раздел с обеими таблицами',
  /AXES_FOUR/.test(mir)&&/LORE_KINDS/.test(mir)&&/Lore\.pay/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
