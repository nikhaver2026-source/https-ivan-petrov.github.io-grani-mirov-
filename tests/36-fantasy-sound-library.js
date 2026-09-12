/* ════════════════════════════════════════════════════════════════════════
   ЖИВАЯ ФЭНТЕЗИЙНАЯ БИБЛИОТЕКА

   Двести семьдесят шесть записей из двух свободных игр под лицензией
   CC BY-SA 3.0: Flare (Clint Bellanger) и 0 A.D. (Wildfire Games). Набор
   проверяет, что записи на месте и целы, что каждая роль звучит в мире, а
   не лежит мёртвым грузом, что указание авторства есть и в файлах рядом с
   записями, и в самой игре — это условие лицензии, а не украшение, — и что
   первый уровень энциклопедии остался проходимым свайпом, когда папок с
   записями стало сорок.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.resolve(__dirname,'..');
const NEW_DIRS=["arte","deep","foe","cast","hero","wild","trade","score",
 "battle","siege","craft","beasts","throng","tread","sky","hall"];
(async()=>{
 /* ── 1. Файлы на месте, целы и подписаны ── */
 const плохие=[],безКредитов=[],безЛицензии=[];
 let файлов=0;
 for(const d of NEW_DIRS){
  const dir=path.join(ROOT,'sounds',d);
  if(!fs.existsSync(dir)){плохие.push(d+": папки нет");continue;}
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.ogg'));
  if(!files.length)плохие.push(d+": пусто");
  файлов+=files.length;
  for(const f of files){
   const p=path.join(dir,f);
   const buf=fs.readFileSync(p,{start:0,end:4});
   if(buf.slice(0,4).toString('latin1')!=='OggS')плохие.push(d+'/'+f+": не Ogg");
   if(fs.statSync(p).size<200)плохие.push(d+'/'+f+": пустой файл");}
  const cr=path.join(dir,'CREDITS.md');
  if(!fs.existsSync(cr))безКредитов.push(d);
  else{
   const t=fs.readFileSync(cr,'utf8');
   /* Лицензия требует назвать автора и лицензию — оба должны быть в файле. */
   if(!/CC BY-SA 3\.0/.test(t))безКредитов.push(d+": не названа лицензия");
   if(!/Clint Bellanger|Wildfire Games/.test(t))безКредитов.push(d+": не назван автор");
   if(!/creativecommons\.org/.test(t))безКредитов.push(d+": нет ссылки на лицензию");
   /* Каждая запись папки должна стоять в таблице. */
   for(const f of files){const n=f.replace(/\.ogg$/,"");
    if(!t.includes(n))безКредитов.push(d+"/"+n+": нет строки в CREDITS.md");}}
  if(!fs.existsSync(path.join(dir,'LICENSE-CC-BY-SA-3.0.txt')))безЛицензии.push(d);}
 check('все новые записи на месте, целы и в формате Ogg',
  !плохие.length&&файлов>=250,{плохие:плохие.slice(0,5),файлов});
 check('у каждой папки есть CREDITS.md с автором, лицензией и полным списком',
  !безКредитов.length,безКредитов.slice(0,6));
 check('рядом с записями лежит текст лицензии CC BY-SA 3.0',!безЛицензии.length,безЛицензии);

 /* ── 2. Игра ── */
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 const банк=await page.evaluate(dirs=>{
  const набор=new Set(dirs);
  const роли=Object.keys(SOUND_BANK).filter(r=>набор.has((SOUND_BANK[r].f[0]||"").split("/")[0]));
  const безОписания=роли.filter(r=>!SOUND_BANK[r].d);
  const безФайлов=роли.filter(r=>!SOUND_BANK[r].f||!SOUND_BANK[r].f.length);
  /* Ни одна запись не должна числиться в двух ролях сразу. */
  const счёт={};Object.keys(SOUND_BANK).forEach(r=>SOUND_BANK[r].f.forEach(f=>{счёт[f]=(счёт[f]||0)+1;}));
  const дубли=Object.keys(счёт).filter(f=>счёт[f]>1);
  return {ролей:роли.length,безОписания,безФайлов,дубли:дубли.slice(0,5),
   всего:soundTotals(),папок:new Set(Object.keys(SOUND_BANK).map(r=>(SOUND_BANK[r].f[0]||"").split("/")[0])).size};},NEW_DIRS);
 check('новых ролей банка не меньше полутора сотен, у каждой описание и файлы',
  банк.ролей>=150&&!банк.безОписания.length&&!банк.безФайлов.length,
  {ролей:банк.ролей,описание:банк.безОписания.slice(0,3),файлы:банк.безФайлов.slice(0,3)});
 check('ни одна запись не числится в двух ролях сразу',!банк.дубли.length,банк.дубли);
 check('звуков в игре стало больше тысячи',банк.всего.всего>1000,банк.всего);

 /* ── 3. Каждая новая роль звучит в мире ── */
 const молчат=await page.evaluate(dirs=>{
  const набор=new Set(dirs);
  const роли=Object.keys(SOUND_BANK).filter(r=>набор.has((SOUND_BANK[r].f[0]||"").split("/")[0]));
  /* Ищем упоминание роли в исходнике игры вне объявления самого банка. */
  const src=document.documentElement.innerHTML;
  const i=src.indexOf("const SOUND_BANK={");
  const j=src.indexOf("const MONSTER_BANK={",i);
  const вне=src.slice(0,i)+src.slice(j);
  return роли.filter(r=>vне_ищем(вне,r));
  function vне_ищем(t,r){return t.indexOf('"'+r+'"')<0&&t.indexOf("'"+r+"'")<0;}},NEW_DIRS);
 check('каждая новая роль где-то звучит, а не лежит мёртвым грузом',
  !молчат.length,молчат.slice(0,8));

 /* ── 4. Разделы энциклопедии: всё покрыто и всё проходится свайпом ── */
 const разделы=await page.evaluate(()=>{
  const папки=new Set(Object.keys(SOUND_BANK).map(r=>(SOUND_BANK[r].f[0]||"").split("/")[0]));
  const вРазделах=new Set();BANK_GROUPS.forEach(g=>g.dirs.forEach(d=>вРазделах.add(d)));
  const пустые=BANK_GROUPS.filter(g=>!bankRolesIn(g.dirs).length).map(g=>g.n);
  const лишние=[...вРазделах].filter(d=>!папки.has(d));
  openModal("modal-encyclopedia");buildEncycCats();
  const слой=document.getElementById("modal-encyclopedia");
  const out={внеРазделов:[...папки].filter(d=>!вРазделах.has(d)),пустые,лишние,
   разделов:document.querySelectorAll('#encycCats .sound-card').length,
   пунктов:cursorItems(слой).length,
   имена:[...document.querySelectorAll('#encycCats .sound-card b')].map(x=>x.textContent)};
  while(activeLayer())closeTopUI();
  return out;});
 check('ни одна папка записей не осталась вне разделов',
  !разделы.внеРазделов.length,разделы.внеРазделов);
 check('в разделах нет пустых и нет ссылок на несуществующие папки',
  !разделы.пустые.length&&!разделы.лишние.length,{пустые:разделы.пустые,лишние:разделы.лишние});
 check('первый уровень энциклопедии проходится свайпом',
  разделы.пунктов<=40&&разделы.разделов>=25,{пунктов:разделы.пунктов,разделов:разделы.разделов});
 check('новые разделы названы и стоят в каталоге',
  ["Оружие, удары и война","Находки, вещи и артефакты","Ремёсла, добыча и стройка",
   "Люди, рынок и торг","Музыка мира","Герой и природа вокруг"]
   .every(n=>разделы.имена.includes(n)),разделы.имена);

 /* ── 5. Указание авторства в самой игре ── */
 const кредиты=await page.evaluate(()=>{
  openModal("modal-encyclopedia");buildEncycCats();
  const t=document.getElementById("encycCredits").textContent;
  while(activeLayer())closeTopUI();
  const гл=GUIDE.map(g=>g.title+" "+g.body.join(" ")).join(" ");
  return {энц:t,вРуководстве:гл};});
 check('энциклопедия называет Flare, 0 A.D. и лицензию CC BY-SA 3.0',
  /Flare/.test(кредиты.энц)&&/Clint Bellanger/.test(кредиты.энц)
  &&/0 A\.D\./.test(кредиты.энц)&&/Wildfire Games/.test(кредиты.энц)
  &&/CC BY-SA 3\.0|Attribution-ShareAlike/.test(кредиты.энц),кредиты.энц.slice(0,200));
 check('руководство называет авторов и лицензию новых записей',
  /Clint Bellanger/.test(кредиты.вРуководстве)&&/Wildfire Games/.test(кредиты.вРуководстве)
  &&/CC BY-SA/.test(кредиты.вРуководстве),
  (кредиты.вРуководстве.match(/[^.]*Bellanger[^.]*\./)||["нет"])[0].slice(0,150));

 /* ── 6. Музыка мира: настоящие темы вместо синтеза ── */
 const муз=await page.evaluate(()=>{
  const нет=Object.values(MUSIC_TRACK).filter(r=>!SOUND_BANK[r]);
  Music.stop();
  Music.start("town");
  const тема=Music.track;
  Music.stop();
  const после=Music.track;
  Music.start("battle");const бой=Music.track;
  Music.stop();
  return {нет,тема,после,бой,тем:new Set(Object.values(MUSIC_TRACK)).size};});
 check('каждая тема музыки существует в банке',!муз.нет.length,муз.нет);
 check('музыка мира берёт настоящую запись и отпускает её при остановке',
  муз.тема==="score_town"&&муз.после===null&&муз.бой==="score_battle",муз);

 /* ── 7. Записи действительно проигрываются браузером ──
    Проверяем не выборкой байт, а тем же способом, каким их слушает игрок:
    через звуковой элемент. Собственная политика безопасности игры запрещает
    страничные запросы к записям, и это правильно — слушать их разрешено, а
    выкачивать скриптом нет. */
 const игра=await page.evaluate(async dirs=>{
  const набор=new Set(dirs);
  const роли=Object.keys(SOUND_BANK).filter(r=>набор.has((SOUND_BANK[r].f[0]||"").split("/")[0]));
  const проба=[];const seen=new Set();
  for(const r of роли){const d=(SOUND_BANK[r].f[0]||"").split("/")[0];
   if(seen.has(d))continue;seen.add(d);проба.push(r);}
  const плохие=[];
  await Promise.all(проба.map(r=>new Promise(done=>{
   const f=SOUND_BANK[r].f[0];
   const a=new Audio("sounds/"+f);a.preload="metadata";
   const t=setTimeout(()=>{плохие.push(r+": не загрузилась");done();},8000);
   a.addEventListener("loadedmetadata",()=>{clearTimeout(t);
    if(!(a.duration>0.05))плохие.push(r+": длительность "+a.duration);
    done();},{once:true});
   a.addEventListener("error",()=>{clearTimeout(t);
    плохие.push(r+": "+((a.error&&a.error.code)||"ошибка"));done();},{once:true});
  })));
  return {проверено:проба.length,плохие};},NEW_DIRS);
 check('запись из каждой новой папки проигрывается браузером',
  !игра.плохие.length&&игра.проверено===NEW_DIRS.length,игра);

 /* ── SuperTuxKart: сорок записей с пофайловым авторством ──
    Библиотека росла четвёртый раз, и каждый раз одни и те же грабли: роль
    объявили, а файла нет; файл положили, а роль никуда не подключили; папку
    добавили, а в каталог энциклопедии не внесли — и раздел пропал из свода.
    Здесь всё это проверяется разом, включая то, ради чего записи и брались:
    что они и вправду звучат в игре, а не лежат мёртвым грузом. */
 const стк=await page.evaluate(async()=>{
  const роли=Object.keys(SOUND_BANK).filter(k=>SOUND_BANK[k].f.some(f=>f.startsWith("stk/")));
  const файлы=[...new Set(роли.flatMap(k=>SOUND_BANK[k].f).filter(f=>f.startsWith("stk/")))];
  const битые=[];
  for(const f of файлы){
   const ок=await new Promise(res=>{const a=new Audio(Bank.url(f));a.preload="metadata";
    const t=setTimeout(()=>res(false),8000);
    a.addEventListener("loadedmetadata",()=>{clearTimeout(t);res(a.duration>0.05);},{once:true});
    a.addEventListener("error",()=>{clearTimeout(t);res(false);},{once:true});});
   if(!ок)битые.push(f);}
  /* Папка обязана быть в каталоге разделов и в группе энциклопедии. */
  const вКаталоге=!!BANK_CATS["stk"];
  const вГруппе=BANK_GROUPS.some(g=>(g.dirs||[]).includes("stk"));
  /* Каждая тема мира указывает на существующую роль. */
  const темыНет=Object.entries(MUSIC_TRACK).filter(([,v])=>!SOUND_BANK[v]).map(([k,v])=>k+"→"+v);
  /* Роли не лежат мёртвым грузом: игра их зовёт. */
  const исходник=document.documentElement.outerHTML;
  /* Объявление роли в банке идёт без кавычек (stk_river:{...}), а всякий её
     вызов — в кавычках. Значит, роль зовут, если имя в кавычках встречается
     хоть раз. */
  const мёртвые=роли.filter(r=>исходник.indexOf('"'+r+'"')<0);
  return {ролей:роли.length,файлов:файлы.length,битые,вКаталоге,вГруппе,темыНет,мёртвые,
   темМира:Object.keys(MUSIC_TRACK).length};});
 check('сорок записей SuperTuxKart на месте и читаются браузером',
  стк.файлов>=40&&стк.битые.length===0,{файлов:стк.файлов,битые:стк.битые.slice(0,5)});
 check('их папка внесена и в каталог разделов, и в группу энциклопедии',
  стк.вКаталоге&&стк.вГруппе,{каталог:стк.вКаталоге,группа:стк.вГруппе});
 check('ни одна новая роль не лежит мёртвым грузом: игра зовёт каждую',
  стк.мёртвые.length===0,стк.мёртвые.slice(0,6));
 check('оркестр мира вырос, и каждая тема указывает на существующую запись',
  стк.темМира>=29&&стк.темыНет.length===0,{тем:стк.темМира,нет:стк.темыНет});

 /* ── Три новые библиотеки: Luanti, OpenDungeons и Endless Sky ──
    Проверяется то же, что и у SuperTuxKart, и сверх того — авторство:
    каждая папка обязана нести свой CREDITS.md, иначе запись в игре есть, а
    сказать, чья она, нечем. */
 const новые=await page.evaluate(async()=>{
  const пачки=["mtg","od","es"];
  const итог={};
  for(const пап of пачки){
   const роли=Object.keys(SOUND_BANK).filter(k=>SOUND_BANK[k].f.some(f=>f.startsWith(пап+"/")));
   const файлы=[...new Set(роли.flatMap(k=>SOUND_BANK[k].f).filter(f=>f.startsWith(пап+"/")))];
   const битые=[];
   for(const f of файлы.slice(0,40)){
    const ок=await new Promise(res=>{const a=new Audio(Bank.url(f));a.preload="metadata";
     const t=setTimeout(()=>res(false),8000);
     a.addEventListener("loadedmetadata",()=>{clearTimeout(t);res(a.duration>0.03);},{once:true});
     a.addEventListener("error",()=>{clearTimeout(t);res(false);},{once:true});});
    if(!ок)битые.push(f);}
   const исходник=document.documentElement.outerHTML;
   итог[пап]={ролей:роли.length,файлов:файлы.length,битые,
    вКаталоге:!!BANK_CATS[пап],
    вГруппе:BANK_GROUPS.some(g=>(g.dirs||[]).includes(пап)),
    мёртвые:роли.filter(r=>исходник.indexOf('"'+r+'"')<0)};}
  return итог;});
 for(const [пап,и] of Object.entries(новые)){
  check(`записи «${пап}» на месте, читаются браузером и подключены ролями`,
   и.файлов>=60&&и.битые.length===0&&и.ролей>=14,
   {папка:пап,файлов:и.файлов,ролей:и.ролей,битые:и.битые.slice(0,4)});
  check(`папка «${пап}» внесена в каталог и в группу энциклопедии, и ни одна её роль не мертва`,
   и.вКаталоге&&и.вГруппе&&и.мёртвые.length===0,
   {папка:пап,каталог:и.вКаталоге,группа:и.вГруппе,мёртвые:и.мёртвые.slice(0,5)});}
 /* Авторство: у каждой заимствованной папки свой список авторов и лицензий.
    Читаем с диска, а не из страницы: игре запрещены сетевые запросы, и это
    правильно — но проверке нужен сам файл. */
 const титры={};
 for(const пап of ["stk","mtg","od","es"]){
  const f=path.join(__dirname,"..","sounds",пап,"CREDITS.md");
  try{
   const t=fs.readFileSync(f,"utf8");
   титры[пап]={есть:true,строк:t.split("\n").length,
    лицензия:/CC|обществен/i.test(t),ссылка:/http/.test(t),
    авторы:/[Аа]втор/.test(t)};
  }catch(e){титры[пап]={есть:false,ошибка:String(e).slice(0,40)};}}
 check('у каждой заимствованной библиотеки есть свои титры: авторы, лицензия и ссылка',
  Object.values(титры).every(x=>x.есть&&x.лицензия&&x.ссылка&&x.авторы&&x.строк>10),титры);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
