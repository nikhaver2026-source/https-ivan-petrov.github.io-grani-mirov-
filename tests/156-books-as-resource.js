/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 156: КНИГА КАК РЕСУРС (§21 мастер-промпта)

   §21 говорит: «Книги становятся игровым ресурсом», — и перечисляет девять
   вещей, которые книга может открыть, и восемь классов книг. У прочитанной
   страницы было четыре исхода, и пяти родов не существовало вовсе.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Родов знания девять — ровно те, что перечисляет §21.
   2. Классов книг восемь — ровно те, что перечисляет §21.
   3. У каждого рода и каждого класса голос настоящей записью, без синтеза.
   4. Все девять родов достижимы хоть через один класс.
   5. Класс выводится, а не бросается: та же страница — тот же класс.
   6. Состав меняется с глубиной: наверху одно, у дна другое.
   7. Что открывает книга, всегда из того, что может её класс.
   8. Прежние четыре исхода остались на прежних местах: навык, чара,
      легендарный свиток и знание выпадают, как выпадали.
   9. Рецепт ложится в руки по-настоящему.
  10. Специализация открывается целиком, и её чара выписывается из
      гримуара без кристалла.
  11. Координаты дают настоящее место, и оно ложится в молву.
  12. Дело ложится в журнал с целью и наградой.
  13. Тайна открывает тайную бумагу двух держав.
  14. Технология открывает технику у станка на ступень раньше урока.
  15. Часть карты кладёт в молву несколько мест разом.
  16. Запретное чтение держава ставит в вину.
  17. У тома есть класс, он входит в цену и назван словами до чтения.
  18. Самопроверка держит строку books21; модуль, глава, README, docs.
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

 /* ── 1–4. Состав ── */
 const состав=await page.evaluate(()=>{
  const синт=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const плохо=[];
  BOOK_OPENS.forEach(o=>{
   if(!o.n||!o.о||o.о.length<15)плохо.push("род "+o.id+": слова");
   if(!SOUND_BANK[o.звук])плохо.push("род "+o.id+": звука нет");
   else if(синт.test(SOUND_BANK[o.звук].f[0]))плохо.push("род "+o.id+": синтез");});
  BOOK_CLASSES.forEach(c=>{
   if(!c.n||!c.о||c.о.length<20)плохо.push("класс "+c.id+": слова");
   if(!(c.цена>0)||typeof c.вес!=="function")плохо.push("класс "+c.id+": цена/вес");
   if(!Array.isArray(c.открывает)||c.открывает.length<2
      ||c.открывает.some(id=>!BOOK_OPEN_BY_ID[id]))плохо.push("класс "+c.id+": открывает");
   if(!SOUND_BANK[c.звук])плохо.push("класс "+c.id+": звука нет");
   else if(синт.test(SOUND_BANK[c.звук].f[0]))плохо.push("класс "+c.id+": синтез");});
  const недостижимы=BOOK_OPENS.filter(o=>!BOOK_CLASSES.some(c=>c.открывает.includes(o.id))).map(o=>o.id);
  return {родов:BOOK_OPENS.length,классов:BOOK_CLASSES.length,
   родыИд:BOOK_OPENS.map(o=>o.id).join(","),
   классыИд:BOOK_CLASSES.map(c=>c.id).join(","),
   плохо,недостижимы};});
 check('родов знания девять — ровно те, что перечисляет §21',
  состав.родов===9&&состав.родыИд==="recipe,spell,spec,lore,coords,quest,secret,tech,mapfrag",
  {родов:состав.родов,ид:состав.родыИд});
 check('классов книг восемь — ровно те, что перечисляет §21',
  состав.классов===8&&состав.классыИд==="common,treatise,forbidden,diary,mapbook,manuscript,textbook,ancient",
  {классов:состав.классов,ид:состав.классыИд});
 check('у каждого рода и класса есть слова и голос настоящей записью, без синтезированных папок',
  состав.плохо.length===0,состав.плохо);
 check('все девять родов достижимы хоть через один класс',
  состав.недостижимы.length===0,состав.недостижимы);

 /* ── 5–7. Вывод класса ── */
 const вывод=await page.evaluate(()=>{
  const a=bookClassFor(1234,0).id,b=bookClassFor(1234,0).id;
  const верх={},низ={};
  for(let n=1;n<=800;n++){
   верх[bookClassFor(n,0).id]=(верх[bookClassFor(n,0).id]||0)+1;
   низ[bookClassFor(n,60).id]=(низ[bookClassFor(n,60).id]||0)+1;}
  /* Что открывает книга — всегда из того, что может её класс. */
  let чужое=0;
  for(let n=1;n<=600;n++)for(const d of [0,5,20,60]){
   const c=bookClassFor(n,d),o=bookOpenFor(n,d);
   if(!c.открывает.includes(o))чужое++;}
  return {устойчив:a===b,верх,низ,чужое,
   верхКлассов:Object.keys(верх).length,низКлассов:Object.keys(низ).length,
   обычныхВверху:(верх.common||0),обычныхВнизу:(низ.common||0),
   древнихВверху:(верх.ancient||0),древнихВнизу:(низ.ancient||0)};});
 check('класс выводится, а не бросается: та же страница даёт тот же класс',
  вывод.устойчив,{устойчив:вывод.устойчив});
 check('состав меняется с глубиной: наверху больше обычных книг, у дна — древних манускриптов',
  вывод.верхКлассов>=6&&вывод.низКлассов>=6
  &&вывод.обычныхВверху>вывод.обычныхВнизу
  &&вывод.древнихВнизу>вывод.древнихВверху,
  {верх:вывод.верх,низ:вывод.низ});
 check('что открывает книга, всегда из того, что может её класс — ни одного исключения на двух тысячах проб',
  вывод.чужое===0,{чужое:вывод.чужое});

 /* ── 8. Прежние четыре исхода на местах ── */
 const прежние=await page.evaluate(()=>{
  /* Наверху легендарных свитков не бывает вовсе (им нужен третий ярус), а с
     третьего яруса их полоса перекрывает полосу навыка — так было и до §21,
     и трогать это здесь не место. Поэтому навык меряется наверху, легенда —
     в глубине, а чара есть и там и там. */
  const верх={},глубоко={};
  for(let n=1;n<=3000;n++){const t=knowReward(n,0).type;верх[t]=(верх[t]||0)+1;}
  for(let n=1;n<=3000;n++){const t=knowReward(n,40).type;глубоко[t]=(глубоко[t]||0)+1;}
  return {верх,глубоко,
   всеРодыЕсть:BOOK_OPENS.every(o=>верх[o.id]||глубоко[o.id]),
   навык:верх.skill||0,чараВверху:верх.spell||0,чараВнизу:глубоко.spell||0,
   легендаВверху:верх.legend||0,легендаВнизу:глубоко.legend||0};});
 check('прежние исходы остались на своих местах: навык наверху, легендарный свиток в глубине, чара и там и там — а девять родов §21 встречаются все',
  прежние.навык>150&&прежние.чараВверху>200&&прежние.чараВнизу>200
  &&прежние.легендаВверху===0&&прежние.легендаВнизу>200&&прежние.всеРодыЕсть,
  {навык:прежние.навык,чараВверху:прежние.чараВверху,чараВнизу:прежние.чараВнизу,
   легендаВверху:прежние.легендаВверху,легендаВнизу:прежние.легендаВнизу,верх:прежние.верх});

 /* ── 9. Рецепт ── */
 const рецепт=await page.evaluate(()=>{
  G.recipes={};
  const было=ART_RECIPES.filter(r=>!r.общий&&artKnowsRecipe(r.id)).length;
  const слова=bookGrant(777,"recipe");
  const стало=ART_RECIPES.filter(r=>!r.общий&&artKnowsRecipe(r.id)).length;
  return {было,стало,слова:String(слова).slice(0,90),
   тоже:bookGrant(777,"recipe")};});
 check('рецепт ложится в руки по-настоящему: рецептов стало больше, и это сказано словами',
  рецепт.стало===рецепт.было+1&&/Рецепт записан/.test(рецепт.слова),рецепт);

 /* ── 10. Специализация ── */
 const спец=await page.evaluate(()=>{
  G.specBook={};G.spellbook=[];G.spells=[];G.inv={};G.mana=100;
  const слова=bookGrant(888,"spec");
  const открытые=Object.keys(G.specBook||{});
  if(!открытые.length)return {нет:true,слова};
  const id=открытые[0];
  /* Ищем в гримуаре чару этой специализации. Ищем по указателю, а не
     перебором grimAt: в каталоге восемьдесят тысяч записей, и собирать их
     все ради одной — минуты. Код записи хранит номер специализации. */
  const idx=grimBuild();
  const si=SPELL_SPECS.findIndex(s=>s.id===id);
  let поз=-1,позЧужой=-1;
  for(let k=0;k<idx.length;k++){
   const s2=Math.floor(idx[k]/1024);
   if(s2===si&&поз<0)поз=k;
   else if(s2!==si&&позЧужой<0)позЧужой=k;
   if(поз>=0&&позЧужой>=0)break;}
  const i=поз>=0?поз*GRIM_RANKS.length:-1;
  if(i<0)return {нет:true,слова,id};
  const безКристалла=grimLearn(i);
  const вКниге=(G.spellbook||[]).length;
  /* А чужая специализация кристалла по-прежнему требует. */
  const j=позЧужой>=0?позЧужой*GRIM_RANKS.length:-1;
  G.mana=100;
  const чужая=j>=0?grimLearn(j):null;
  return {слова:String(слова).slice(0,80),id,безКристалла,вКниге,чужая,
   кристаллов:Number(G.inv&&G.inv["кристалл"])||0};});
 check('специализация открывается целиком, и её чара выписывается из гримуара без кристалла, а чужая — нет',
  !спец.нет&&спец.безКристалла===true&&спец.вКниге===1&&спец.чужая===false
  &&спец.кристаллов===0,спец);

 /* ── 11. Координаты ── */
 const коорд=await page.evaluate(()=>{
  G.known={};
  const слова=bookGrant(999,"coords");
  const мест=Object.keys(G.known||{}).length;
  return {слова:String(слова).slice(0,120),мест,
   естьЧисла:/\(\d+; \d+\)/.test(String(слова))};});
 check('координаты дают настоящее место числами, и оно ложится в молву',
  коорд.мест>=1&&коорд.естьЧисла,коорд);

 /* ── 12. Дело ── */
 const дело=await page.evaluate(()=>{
  G.quests=[];G.known={};
  const слова=bookGrant(1111,"quest");
  const q=(G.quests||[])[0]||null;
  return {слова:String(слова).slice(0,100),
   есть:!!q,цель:q?(q.tx!=null&&q.ty!=null):false,
   награда:q?!!(q.reward&&q.reward.gold>0&&q.reward.xp>0):false,
   текст:q?q.text.length>30:false};});
 check('дело ложится в журнал: у него есть цель на карте, текст и награда',
  дело.есть&&дело.цель&&дело.награда&&дело.текст,дело);

 /* ── 13. Тайна ── */
 const тайна=await page.evaluate(()=>{
  G.diploKnown={};
  let было=0;
  for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++)
   было+=diploHidden(i,j,G.day).length;
  const слова=bookGrant(1313,"secret");
  let стало=0;
  for(let i=0;i<EMPIRES.length;i++)for(let j=i+1;j<EMPIRES.length;j++)
   стало+=diploHidden(i,j,G.day).length;
  return {было,стало,слова:String(слова).slice(0,120)};});
 check('тайна открывает тайную бумагу двух держав: скрытых бумаг стало меньше',
  тайна.было>0&&тайна.стало===тайна.было-1&&/тайную бумагу/.test(тайна.слова),тайна);

 /* ── 14. Технология ── */
 const техно=await page.evaluate(()=>{
  G.techBook={};G.mast={};
  /* Берём технику второй ступени и ремесло первой: до книги закрыта. */
  const t=TECHS.find(x=>x.ур===2&&x.станки&&x.станки.length);
  if(!t)return {нет:true};
  G.mast[t.маст]={ур:1,оп:0,дел:0};
  const до=techsAt(t.станки[0]).some(x=>x.id===t.id);
  G.techBook[t.id]=1;
  const после=techsAt(t.станки[0]).some(x=>x.id===t.id);
  /* И книга вправду это делает. */
  G.techBook={};
  const слова=bookGrant(1515,"tech");
  const открыто=Object.keys(G.techBook||{}).length;
  return {до,после,открыто,слова:String(слова).slice(0,90),техника:t.id,ступень:t.ур};});
 check('технология открывает технику у станка на ступень раньше урока, и книга вправду её открывает',
  !техно.нет&&техно.до===false&&техно.после===true&&техно.открыто===1
  &&/Разобрана технология/.test(техно.слова),техно);

 /* ── 15. Часть карты ── */
 const карта=await page.evaluate(()=>{
  G.known={};
  const слова=bookGrant(1717,"mapfrag");
  const мест=Object.keys(G.known||{}).length;
  return {мест,слова:String(слова).slice(0,120)};});
 check('часть карты кладёт в молву несколько мест разом, а не одно',
  карта.мест>=3,карта);

 /* ── 16. Запретное чтение ── */
 const запрет=await page.evaluate(()=>{
  /* Ищем страницу, чей класс запретен, и читаем её. */
  let n=-1;
  for(let k=1;k<=4000&&n<0;k++)if(bookClassFor(k,0).id==="forbidden")n=k;
  if(n<0)return {нет:true};
  G.place=null;G.standing=null;
  const emp=EMPIRES[empireIndexAt(G.x,G.y)];
  const до=standOf("fact",emp.short);
  const слова=knowGrant(n,{type:"lore"});
  const после=standOf("fact",emp.short);
  return {n,до,после,слова:String(слова).slice(-90),
   сказано:/запретная/.test(String(слова))};});
 check('запретное чтение держава ставит в вину: доброе имя у державы падает, и об этом говорят',
  !запрет.нет&&запрет.после<запрет.до&&запрет.сказано,запрет);

 /* ── 17. Класс у тома ── */
 const том=await page.evaluate(()=>{
  const a=makeTome({origin:"city",seed:4242,depth:0,page:4242});
  const b=makeTome({origin:"city",seed:4242,depth:0,page:4242});
  const кл=bookClassFor(4242,0);
  /* Цена класса входит в цену тома: дорогой класс дороже дешёвого. */
  let дёшево=null,дорого=null;
  for(let n=1;n<=3000&&!(дёшево&&дорого);n++){
   const c=bookClassFor(n,0);
   if(c.id==="common"&&!дёшево)дёшево=makeTome({origin:"city",seed:n,depth:0,page:n});
   if(c.id==="ancient"&&!дорого)дорого=makeTome({origin:"city",seed:n,depth:0,page:n});}
  return {класс:a.класс,совпало:a.класс===b.класс&&a.класс===кл.id,
   имяКласса:a.классИмя,открывает:a.открывает,
   строка:bookLine(4242,0),
   дёшево:дёшево?дёшево.цена:null,дорого:дорого?дорого.цена:null};});
 check('у тома есть класс, он тот же при повторном спросе, входит в цену и назван словами до чтения',
  том.совпало&&!!том.имяКласса&&!!том.открывает
  &&том.строка.length>40&&том.дорого>том.дёшево,том);

 /* ── 18. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="books21");
  const m=Modules.get("BOOKS");
  return {есть:!!r,ok:r?r.ok:false,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.opens.length===9&&m.classes.length===8
    &&typeof m.classOf==="function"&&typeof m.grant==="function",
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 86\. Книга как ресурс/.test(g.title)&&g.body.length>=5),
   сохранение:(()=>{try{G.specBook={a:1};G.techBook={b:1};saveGame(true);
    const o=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");const g=o.G||o;
    return !!g.specBook&&!!g.techBook;}catch(_){return false;}})()};});
 check('самопроверка держит строку books21, модуль BOOKS отвечает, глава 86 на месте, открытое ложится в сохранение',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.сохранение&&свод.текст.length>40,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 check('README и docs/МИР.md описывают девять родов знания и восемь классов книг',
  /Книга как ресурс/i.test(readme)&&/восемь классов книг/i.test(readme)
  &&/§21/.test(мир)&&/классов/i.test(мир),
  {readme:/Книга как ресурс/i.test(readme),docs:/§21/.test(мир)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
