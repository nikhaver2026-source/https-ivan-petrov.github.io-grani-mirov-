/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 147: ГРИМУАР И СПЕЦИАЛИЗАЦИИ ШКОЛ (§6 мастер-промпта до конца)

   Школ было тридцать четыре, и четырёх дисциплин среди них не значилось
   вовсе: энергетики, биомантии, астральной науки и магической инженерии.
   А у школ не было специализаций, и каталога заклинаний не было тоже:
   составитель собирал по одному, и увидеть, что вообще можно собрать,
   было негде.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Школ тридцать восемь, четыре новые полны: семейство, стихия, голос,
      все семь звуковых слоёв — и все звуки настоящие, не синтез.
   2. Именных чар стало сто четырнадцать: по три у каждой из тридцати
      восьми, и новые проходят того же судью, что и прежние.
   3. Специализаций сто пятьдесят две, по четыре на школу, у каждой своё
      ядро, своя стихия и своя настоящая запись голоса.
   4. Указатель каталога держит только годные четвёрки: ни одной записи,
      которую нельзя применить.
   5. В каталоге не меньше четырнадцати тысяч заклинаний, и ни одна
      специализация не пуста.
   6. Каждая запись настоящая: имя, цена, дальность, откат, условия,
      голос — и всё это выведено тем же составителем.
   7. Имена уникальны и не сталкиваются ни с именными чарами школ, ни с
      начальными двенадцатью.
   8. Три ступени одной четвёрки идут подряд и растут по силе.
   9. Ничего не хранится: тот же номер даёт то же заклинание, и указатель
      не зависит от порядка вызовов.
  10. Окно составителя показывает гримуар: шапка, школы, специализации,
      двенадцать строк, листание — и ни одной немой строки.
  11. Отбор сужает: школа, потом специализация; листание ходит по кругу.
  12. Выписка настоящая: кристалл и мана уходят, заклинание попадает в
      список, творится и второй раз не берётся.
  13. Самопроверка мира держит строку «grimoire»; модуль, глава, README,
      docs.
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

 /* ── 1. Четыре новые школы полны ── */
 const школы=await page.evaluate(()=>{
  const НОВЫЕ=["power","biomancy","astro","engine"];
  /* Синтезированные сцены лежат в семи папках — настоящие записи во всех
     прочих. Смотреть надо на файл, а не на имя роли: имя роли о папке
     ничего не говорит. */
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const пусто=[],синт=[];
  НОВЫЕ.forEach(id=>{
   const sc=MSCHOOL_BY_ID[id];
   if(!sc||!sc.сем||!sc.звук||!sc.голос){пусто.push(id);return;}
   if(!SOUND_BANK[sc.звук]||!SOUND_BANK[sc.голос])пусто.push(id+":банк");
   if(синтез(sc.звук))синт.push(id+":звук");
   if(синтез(sc.голос))синт.push(id+":голос");
   const a=SCHOOL_AUDIO[id]||{};
   SPELL_LAYERS.forEach(l=>{
    if(!a[l]||!SOUND_BANK[a[l]])пусто.push(id+":"+l);
    else if(синтез(a[l]))синт.push(id+":"+l);});
   if(!elemOfSchool(id))пусто.push(id+":стихия");});
  return {всего:SCHOOLS.length,пусто,синт,
   стихии:НОВЫЕ.map(id=>elemOfSchool(id).id),
   семьи:НОВЫЕ.map(id=>MSCHOOL_BY_ID[id].сем)};});
 check('школ тридцать восемь, четыре новые полны и звучат настоящими записями',
  школы.всего===38&&школы.пусто.length===0&&школы.синт.length===0,школы);

 /* ── 2. Сто четырнадцать именных чар ── */
 const именные=await page.evaluate(()=>{
  const неПоТри=SCHOOLS.filter(sc=>SCHOOL_SPELLS.filter(s=>s.school===sc.id).length!==3).map(sc=>sc.id);
  const поСудье=SCHOOL_SPELLS.filter(s=>safeFn(()=>spellIncompat(s.school,s.форма,"none"),"")!=="").map(s=>s.n);
  const неполные=SCHOOL_SPELLS.filter(s=>!(s.n&&s.о&&s.school&&s.форма&&s.cost>0&&s.ранг>=1&&s.ранг<=3)).map(s=>s.id);
  const вСписке=SCHOOL_SPELLS.filter(s=>SPELLS.some(x=>x.n===s.n)).length;
  return {всего:SCHOOL_SPELLS.length,уник:new Set(SCHOOL_SPELLS.map(s=>s.n)).size,
   неПоТри,поСудье,неполные,вСписке};});
 check('именных чар сто четырнадцать: по три у каждой из тридцати восьми',
  именные.всего===114&&именные.уник===114&&именные.неПоТри.length===0
  &&именные.поСудье.length===0&&именные.неполные.length===0&&именные.вСписке===114,именные);

 /* ── 3. Сто пятьдесят две специализации ── */
 const спец=await page.evaluate(()=>{
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const плохие=SPELL_SPECS.filter(sp=>!(MSCHOOL_BY_ID[sp.школа]&&CORE_BY_ID[sp.ядро]&&ELEM_BY_ID[sp.стихия]
   &&SOUND_BANK[sp.звук]&&!синтез(sp.звук)&&sp.n&&sp.о)).map(sp=>sp.id);
  const неПоЧетыре=SCHOOLS.filter(sc=>specsOfSchool(sc.id).length!==4).map(sc=>sc.id);
  /* Специализации одной школы должны отличаться ядром: иначе это одно и то же. */
  const одинаковые=SCHOOLS.filter(sc=>new Set(specsOfSchool(sc.id).map(x=>x.ядро)).size<4).map(sc=>sc.id);
  return {всего:SPELL_SPECS.length,уник:new Set(SPELL_SPECS.map(x=>x.id)).size,
   плохие,неПоЧетыре,одинаковые,
   ядер:new Set(SPELL_SPECS.map(x=>x.ядро)).size,
   стихий:new Set(SPELL_SPECS.map(x=>x.стихия)).size};});
 check('специализаций сто пятьдесят две, по четыре на школу, у каждой своё ядро и стихия',
  спец.всего===152&&спец.уник===152&&спец.плохие.length===0
  &&спец.неПоЧетыре.length===0&&спец.одинаковые.length===0&&спец.ядер>=10&&спец.стихий>=10,спец);

 /* ── 4–5. Указатель: только годные четвёрки, ни одной пустой ветви ── */
 const указатель=await page.evaluate(()=>{
  const idx=grimBuild();
  let негодных=0;
  for(let k=0;k<idx.length;k++){
   const sp=SPELL_SPECS[Math.floor(idx[k]/1024)];
   const f=SPELL_FORMS[Math.floor((idx[k]%1024)/32)];
   const m=SPELL_MODS[idx[k]%32];
   if(spellIncompat(sp.школа,f.id,m.id,sp.ядро,sp.стихия))негодных++;}
  const поСпец=SPELL_SPECS.map(sp=>grimFind(sp.школа,sp.id).length);
  const поШколам=SCHOOLS.map(sc=>grimFind(sc.id,null).length);
  return {четвёрок:idx.length,всего:grimCount(),негодных,
   пустыхСпец:поСпец.filter(n=>n===0).length,минСпец:Math.min(...поСпец),
   пустыхШкол:поШколам.filter(n=>n===0).length,минШкола:Math.min(...поШколам),
   безОтбора:grimFind(null,null).length};});
 check('указатель держит только годные четвёрки, и каждая даёт три ступени',
  указатель.негодных===0&&указатель.всего===указатель.четвёрок*3
  &&указатель.безОтбора===указатель.всего,указатель);
 check('в каталоге не меньше четырнадцати тысяч заклинаний, и ни одна ветвь не пуста',
  указатель.всего>=14000&&указатель.пустыхСпец===0&&указатель.пустыхШкол===0
  &&указатель.минСпец>0,указатель);

 /* ── 6–7. Каждая запись настоящая, и имена не сталкиваются ── */
 const записи=await page.evaluate(()=>{
  const n=grimCount();const имена=new Set();const дубли=[];
  let битых=0;const плохие=[];
  for(let i=0;i<n;i++){
   const r=grimAt(i);
   if(!r||r.ошибка){битых++;continue;}
   if(!(r.n&&r.cost>0&&r.дальность>=0&&r.откат>=0&&r.условия&&r.вид
        &&SPEC_BY_ID[r.спец]&&MSCHOOL_BY_ID[r.school]&&SOUND_BANK[r.голос])){
    if(плохие.length<5)плохие.push(r.n||i);continue;}
   if(имена.has(r.n)){if(дубли.length<5)дубли.push(r.n);}else имена.add(r.n);}
  return {всего:n,битых,плохие,дубли,уник:имена.size,
   сИменными:SCHOOL_SPELLS.filter(s=>имена.has(s.n)).map(s=>s.n).slice(0,5),
   сНачальными:SPELLS.filter(s=>имена.has(s.n)&&!s.custom).map(s=>s.n).slice(0,5)};});
 check('каждая из двадцати шести тысяч записей настоящая: цена, дальность, откат, условия, голос',
  записи.битых===0&&записи.плохие.length===0&&записи.всего>=14000,записи);
 check('имена уникальны и не сталкиваются ни с именными чарами, ни с начальными',
  записи.уник===записи.всего&&записи.дубли.length===0
  &&записи.сИменными.length===0&&записи.сНачальными.length===0,записи);

 /* ── 8. Три ступени подряд и по возрастающей ── */
 const ступени=await page.evaluate(()=>{
  const плохие=[];
  for(let k=0;k<200;k++){
   const i=k*41*3;/* начало четвёрки */
   const a=grimAt(i),b=grimAt(i+1),c=grimAt(i+2);
   if(!a||!b||!c){плохие.push(["нет",i]);continue;}
   if(!(a.ступень===1&&b.ступень===2&&c.ступень===3)){плохие.push(["порядок",i]);continue;}
   if(!(a.спец===b.спец&&b.спец===c.спец)){плохие.push(["спец",i]);continue;}
   if(!(a.cost<=b.cost&&b.cost<=c.cost)){плохие.push(["цена",i,a.cost,b.cost,c.cost]);continue;}
   if(!(/малое$/.test(a.n)&&/полное$/.test(b.n)&&/высшее$/.test(c.n)))плохие.push(["слово",i,a.n]);}
  return {плохие:плохие.slice(0,4),проверено:200,
   ступеней:GRIM_RANKS.length,слова:GRIM_RANKS.map(r=>r.n)};});
 check('три ступени одной четвёрки идут подряд и дорожают',
  ступени.плохие.length===0&&ступени.ступеней===3,ступени);

 /* ── 9. Ничего не хранится ── */
 const вывод=await page.evaluate(()=>{
  const было=[100,5000,26000].map(i=>grimAt(i).n);
  /* Порядок вызовов не должен менять ответ. */
  grimFind("fire","plamya");grimAt(7);grimFind(null,null);grimByName(было[0]);
  const стало=[100,5000,26000].map(i=>grimAt(i).n);
  const найдено=grimByName(было[0]);
  /* Отрицательные и запредельные номера заворачиваются, а не падают. */
  const края=[grimAt(-1),grimAt(grimCount()),grimAt(1e9)].map(r=>!!(r&&r.n));
  return {совпало:было.every((x,k)=>x===стало[k]),было,
   поИмени:!!найдено&&найдено.n===было[0],края};});
 check('тот же номер даёт то же заклинание, порядок вызовов ничего не меняет',
  вывод.совпало&&вывод.поИмени&&вывод.края.every(Boolean),вывод);

 /* ── 10–11. Окно: гримуар, отбор, листание ── */
 const окно=await page.evaluate(()=>{
  G.place={stype:"tower"};
  openModal("modal-spellforge");spellForgeRender();
  const box=document.getElementById("sfBody");
  if(!box)return {нет:true};
  const немых=box.querySelectorAll('button:not([data-speak]),.list-line:not([data-speak])').length;
  const естьШапка=/<h3>Гримуар/.test(box.innerHTML);
  const школКн=box.querySelectorAll('[data-cmd^="grimschool:"]').length;
  /* Без отбора специализаций не показывают: их сто пятьдесят две. */
  const спецДо=box.querySelectorAll('[data-cmd^="grimspec:"]').length;
  CMD.grimschool("biomancy");
  const спецПосле=box.querySelectorAll('[data-cmd^="grimspec:"]').length;
  const шапка=box.querySelector('[data-speak*="Отобрано"]').getAttribute("data-speak");
  const строкШк=box.querySelectorAll('[data-cmd^="grimlearn:"]').length;
  CMD.grimspec(specsOfSchool("biomancy")[0].id);
  const строкСп=box.querySelectorAll('[data-cmd^="grimlearn:"]').length;
  const первая=box.querySelector('[data-cmd^="grimlearn:"]').getAttribute("data-speak");
  /* Листание по кругу: с первой назад — на последнюю. */
  const было=GRIM.стр;CMD.grimpage(1);const вперёд=GRIM.стр;
  CMD.grimpage(-1);const назад=GRIM.стр;CMD.grimpage(-1);const кругом=GRIM.стр;
  const страниц=Math.ceil(grimFind(GRIM.школа,GRIM.спец).length/GRIM.накрупно);
  /* Выбор специализации подтягивает её школу. */
  CMD.grimschool("");CMD.grimspec("plamya");
  const школаПоСпец=GRIM.школа;
  return {немых,естьШапка,школКн,спецДо,спецПосле,строкШк,строкСп,
   шапка:шапка.slice(0,40),первая:первая.slice(0,60),
   было,вперёд,назад,кругом,страниц,школаПоСпец,
   сужает:grimFind("biomancy",null).length>grimFind("biomancy",specsOfSchool("biomancy")[0].id).length};});
 check('окно составителя показывает гримуар, и ни одна строка не молчит',
  !окно.нет&&окно.естьШапка&&окно.немых===0&&окно.школКн===39
  &&окно.спецДо===0&&окно.спецПосле===5&&окно.строкШк===12&&окно.строкСп===12
  &&/Сращивание|Панцирь|Рост|Обмен/.test(окно.первая),окно);
 check('отбор сужает, выбор специализации подтягивает школу, листание ходит по кругу',
  окно.сужает&&окно.школаПоСпец==="fire"&&окно.было===0&&окно.вперёд===1
  &&окно.назад===0&&окно.кругом===окно.страниц-1,окно);

 /* ── 12. Выписка настоящая ── */
 const выписка=await page.evaluate(()=>{
  G.place={stype:"tower"};G.inv=G.inv||{};
  const ном=grimFind("engine","karkas")[4];
  const rec=grimAt(ном);
  /* Без кристалла не выписать. */
  delete G.inv["кристалл"];G.mana=99;
  const безКристалла=grimLearn(ном);
  /* Без маны — тоже. */
  G.inv["кристалл"]=2;G.mana=3;
  const безМаны=grimLearn(ном);
  G.mana=99;
  const было=(G.spellbook||[]).length;
  const взял=grimLearn(ном);
  const стало=(G.spellbook||[]).length;
  const вSPELLS=SPELLS.find(x=>x.n===rec.n);
  const снова=grimLearn(ном);
  /* Готовое заклинание творится: спросим у того же обработчика. */
  let творится=null;
  try{творится=typeof spellPlan==="function"?!!spellPlan(вSPELLS):null;}catch(e){творится="ошибка";}
  return {имя:rec.n,безКристалла,безМаны,взял,было,стало,
   вSPELLS:!!вSPELLS,custom:!!(вSPELLS&&вSPELLS.custom),снова,
   кристаллов:G.inv["кристалл"],мана:G.mana,творится};});
 check('выписка берёт кристалл и мана, кладёт в книгу и второй раз не берётся',
  выписка.безКристалла===false&&выписка.безМаны===false&&выписка.взял===true
  &&выписка.стало===выписка.было+1&&выписка.вSPELLS&&выписка.custom
  &&выписка.снова===false&&выписка.кристаллов===1&&выписка.мана===84,выписка);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="grimoire");
  const гл=GUIDE.find(g=>/Гримуар/.test(g.title));
  return {строка:!!r,ок:r&&r.ок!==false&&r.ok!==false,нота:r&&String(r.note).slice(0,60),
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:Modules.has("GRIMOIRE"),
   текст:String(Modules.get("GRIMOIRE").text()).slice(0,80),
   счёт:Modules.get("GRIMOIRE").count(),
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «grimoire» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль GRIMOIRE зарегистрирован и отвечает',
  свод.модуль===true&&/Гримуар/.test(свод.текст)&&свод.счёт>=14000,свод);
 check('в руководстве есть глава о гримуаре',свод.глава&&свод.строкГлавы>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх школах и каталоге',
  /Гримуар/i.test(readme)&&/биомантия/i.test(readme)&&/астральная наука/i.test(readme)
  &&/магическая инженерия/i.test(readme)&&/специализаци/i.test(readme));
 check('docs/МИР.md держит устройство каталога',
  /SPELL_SPECS/.test(mir)&&/grimBuild/.test(mir)&&/grimAt/.test(mir)
  &&/spellIncompat/.test(mir)&&/GRIMOIRE/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
