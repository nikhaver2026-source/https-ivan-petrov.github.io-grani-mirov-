/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 133: ЧАРЫ ШКОЛ — ПО ТРИ НА КАЖДУЮ ИЗ ТРИДЦАТИ ЧЕТЫРЁХ

   Школ заклинаний в игре тридцать четыре: у каждой своё семейство, свой
   голос и свои семь звуковых слоёв. Именных заклинаний у них не было ни
   одного — двенадцать старых чар не принадлежали никакой школе, и «Школа
   огня» была словом без единого огненного слова за ним.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Сто два заклинания, ровно по три у каждой из тридцати четырёх школ,
      и все имена разные.
   2. Форма подходит семейству своей школы: исцеляющей стрелы не бывает.
   3. Все попали в общий список чар и творятся тем же слотом.
   4. НИ ОДНО НЕ ПУСТОЕ: все сто два творятся поимённо, ни одно не падает
      и ни одно не отвечает «ничего не изменилось».
   5. У каждого звук и голос своей школы и все семь слоёв — настоящими
      записями из банка.
   6. Три ступени с требованиями, и требование называется вслух.
   7. Цена и мана растут со ступенью.
   8. Выученное не учится дважды, списывает золото и ложится в дневник,
      реестр знаний и знание рода «рецепт».
   9. В окне Академии есть раздел со всеми школами, и каждая кнопка озвучена.
  10. Самопроверка мира держит строку «schoolspells»; руководство, README
      и docs рассказывают о ста двух чарах.
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

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>{
  const поШколам=SCHOOLS.map(sc=>[sc.id,SchoolSpells.ofSchool(sc.id).length]);
  const имена=SCHOOL_SPELLS.map(s=>s.n);
  return {всего:SCHOOL_SPELLS.length,школ:SCHOOLS.length,
   неПоТри:поШколам.filter(([,v])=>v!==3).map(([k])=>k),
   уникальны:new Set(имена).size===имена.length,
   полны:SCHOOL_SPELLS.every(s=>s.n&&s.о&&s.school&&s.форма&&s.cost>0&&s.ранг>=1&&s.ранг<=3),
   ступеней:[...new Set(SCHOOL_SPELLS.map(s=>s.ранг))].sort(),
   примерОгня:SchoolSpells.ofSchool("fire").map(s=>s.n),
   примерВремени:SchoolSpells.ofSchool("time").map(s=>s.n)};});
 /* Набор 147 довёл школы до тридцати восьми, и каждая новая получила свои
    три именных чары: сто два стало ста четырнадцатью. */
 check('сто четырнадцать заклинаний, ровно по три у каждой из тридцати восьми школ',
  состав.всего===114&&состав.школ===38&&состав.неПоТри.length===0,состав);
 check('все имена разные, и у каждого есть слово, школа, форма, цена и ступень',
  состав.уникальны&&состав.полны&&состав.ступеней.join(",")==="1,2,3",состав);
 check('заклинания названы по своей школе: у Огня огненные, у Времени временны́е',
  /Искра|Огненный|горнил/i.test(состав.примерОгня.join(" "))
  &&/час|Замедленн|упущенн/i.test(состав.примерВремени.join(" ")),
  {огонь:состав.примерОгня,время:состав.примерВремени});

 /* ── 2. форма подходит семейству ── */
 const формы=await page.evaluate(()=>{
  const чужие=SCHOOL_SPELLS.filter(s=>{
   const sc=MSCHOOL_BY_ID[s.school],f=FORM_BY_ID[s.форма];
   return !sc||!f||f.сем.indexOf(sc.сем)<0;}).map(s=>`${s.n} (${s.форма}/${(MSCHOOL_BY_ID[s.school]||{}).сем})`);
  /* И та же проверка тем же судьёй, что судит составителя. */
  const поСудье=SCHOOL_SPELLS.filter(s=>safeFn(()=>spellIncompat(s.school,s.форма,"none"),"")!=="")
   .map(s=>s.n);
  return {чужие:чужие.slice(0,4),поСудье:поСудье.slice(0,4)};});
 check('форма каждого заклинания подходит семейству своей школы',
  формы.чужие.length===0,формы.чужие);
 check('тот же судья, что судит составителя, не отвергает ни одного из ста двух',
  формы.поСудье.length===0,формы.поСудье);

 /* ── 3. в общем списке ── */
 const вСписке=await page.evaluate(()=>({
  нашлись:SCHOOL_SPELLS.filter(s=>SPELLS.some(x=>x.n===s.n)).length,
  сCustom:SCHOOL_SPELLS.filter(s=>SPELLS.some(x=>x.n===s.n&&x.custom)).length,
  всегоЧар:SPELLS.length}));
 check('все сто два попали в общий список чар и творятся тем же слотом',
  вСписке.нашлись===114&&вСписке.сCustom===114,вСписке);

 /* ── 4. ни одно не пустое ── */
 const творение=await page.evaluate(()=>{
  const пустые=[],упали=[];
  const былоЗолото=G.gold,былиЧары=G.spells;
  G.manaMax=9999;
  SCHOOL_SPELLS.forEach(sp=>{
   G.spells=[sp.n];G.spellCD={};G.mana=9999;G.hp=Math.max(1,G.hpMax-40);
   const i=SPELLS.findIndex(x=>x.n===sp.n);
   __said.length=0;
   try{castSpell(i);}catch(e){упали.push(sp.n+": "+String(e).slice(0,40));return;}
   const t=__said.join(" ");
   if(/ничего не изменилось|Чары сорвались/.test(t))пустые.push(sp.n);});
  G.gold=былоЗолото;G.spells=былиЧары;
  return {пустые:пустые.slice(0,5),упали:упали.slice(0,5),проверено:SCHOOL_SPELLS.length};});
 check('все сто два творятся и ни одно не падает',
  творение.упали.length===0,творение.упали);
 check('ни одно не отвечает «ничего не изменилось»: пустых чар среди них нет',
  творение.пустые.length===0,творение.пустые);

 /* ── 5. звук ── */
 const звук=await page.evaluate(()=>{
  const безЗвука=SCHOOL_SPELLS.filter(s=>{const sc=MSCHOOL_BY_ID[s.school];
   return !sc||!SOUND_BANK[sc.звук]||!SOUND_BANK[sc.голос];}).map(s=>s.n);
  const безСлоёв=SCHOOLS.filter(sc=>{const a=SCHOOL_AUDIO[sc.id]||{};
   return !SPELL_LAYERS.every(l=>SOUND_BANK[a[l]]);}).map(sc=>sc.id);
  return {безЗвука:безЗвука.slice(0,4),безСлоёв:безСлоёв.slice(0,4),слоёв:SPELL_LAYERS.length};});
 check('у каждого заклинания звук и голос своей школы — настоящие записи',
  звук.безЗвука.length===0,звук.безЗвука);
 check('у каждой школы все семь звуковых слоёв настоящими записями',
  звук.безСлоёв.length===0&&звук.слоёв===7,звук);
 const слышно=await page.evaluate(()=>{
  const sp=SchoolSpells.ofSchool("fire")[0];
  const sc=MSCHOOL_BY_ID.fire;
  G.spells=[sp.n];G.spellCD={};G.mana=9999;
  __played.length=0;
  castSpell(SPELLS.findIndex(x=>x.n===sp.n));
  return {сыграно:__played.slice(0,6),ждали:sc.голос,естьГолос:__played.indexOf(sc.голос)>=0};});
 check('творение звучит голосом своей школы',слышно.естьГолос,слышно);

 /* ── 6, 7. ступени, требования и цена ── */
 const ступени=await page.evaluate(()=>{
  G.spells=[];G.gold=99999;G.mast={};G.deeds={};G.academy=null;
  const о={};
  const пер=SCHOOL_SPELLS.find(s=>s.ранг===1&&s.school==="fire");
  const вто=SCHOOL_SPELLS.find(s=>s.ранг===2&&s.school==="fire");
  const тре=SCHOOL_SPELLS.find(s=>s.ранг===3&&s.school==="fire");
  о.перваяСвободна=SchoolSpells.нельзя(пер)==="";
  о.втораяНельзя=SchoolSpells.нельзя(вто);
  о.третьяНельзя=SchoolSpells.нельзя(тре);
  /* Магическая ветвь третьей ступени обязана открыть вторую. */
  G.deeds.casts=400;G.spells=[];
  о.ветвь=safeFn(()=>branchRank("magic"),0);
  о.втораяПослеВетви=SchoolSpells.нельзя(вто);
  о.цены=[SchoolSpells.цена(пер),SchoolSpells.цена(вто),SchoolSpells.цена(тре)];
  о.маны=[пер.cost,вто.cost,тре.cost];
  G.deeds={};G.spells=[];
  return о;});
 check('первая ступень берётся сразу, вторая и третья — нет, и обе говорят чего не хватает',
  ступени.перваяСвободна&&/курс факультета/.test(ступени.втораяНельзя)
  &&/второй курс/.test(ступени.третьяНельзя),ступени);
 check('магическая ветвь третьей ступени открывает вторую ступень чар',
  ступени.ветвь>=3&&ступени.втораяПослеВетви==="",
  {ветвь:ступени.ветвь,бар:ступени.втораяПослеВетви});
 check('цена и мана растут со ступенью',
  ступени.цены[0]<ступени.цены[1]&&ступени.цены[1]<ступени.цены[2]
  &&ступени.маны[0]<ступени.маны[1]&&ступени.маны[1]<ступени.маны[2],ступени);

 /* ── 8. обучение ── */
 const учение=await page.evaluate(()=>{
  G.spells=[];G.gold=99999;G.lore={};G.deeds={};
  const sp=SCHOOL_SPELLS.find(s=>s.ранг===1&&s.school==="water");
  const золотоДо=G.gold;
  const итог=SchoolSpells.learn(sp.n);
  const золотоПосле=G.gold;
  const повтор=SchoolSpells.learn(sp.n);
  const дорого=(()=>{G.gold=1;const s2=SCHOOL_SPELLS.find(x=>x.ранг===1&&x.school==="earth");
   const t=SchoolSpells.learn(s2.n);G.gold=99999;return t;})();
  return {итог:String(итог).slice(0,80),
   списало:золотоДо-золотоПосле===SchoolSpells.цена(sp),
   цена:SchoolSpells.цена(sp),
   знаю:(G.spells||[]).indexOf(sp.n)>=0,
   повтор:String(повтор),
   дорого:String(дорого).slice(0,60),
   вЗнании:safeFn(()=>Lore.has("recipe",`spell:${sp.id}`),false),
   вРеестре:safeFn(()=>{const L=Ledger.ensure();
    return (L["чары"]||[]).some(e=>String(e.n).indexOf(sp.n)>=0);},false)};});
 check('выученное заклинание ложится в память и списывает ровно свою цену',
  учение.знаю&&учение.списало,учение);
 check('дважды одно и то же не учится, а без денег не учится вовсе',
  /уже знаете/.test(учение.повтор)&&/золота/.test(учение.дорого),учение);
 check('выученное пишется в реестр знаний и в знание рода «рецепт» (§31)',
  учение.вРеестре&&учение.вЗнании,учение);

 /* ── 9. окно Академии ── */
 const окно=await page.evaluate(()=>{
  G.spells=[];
  safeFn(()=>renderAcademy());
  const el=document.getElementById("acSpells");
  if(!el)return {нет:true};
  const кнопки=Array.from(el.querySelectorAll("button"))
   .filter(x=>String(x.dataset.cmd||"").indexOf("learnspell:")===0);
  const строки=Array.from(el.querySelectorAll("[data-speak]"));
  const школВТексте=SCHOOLS.filter(sc=>el.innerHTML.indexOf(sc.n)>=0).length;
  return {нет:false,кнопок:кнопки.length,
   всеОзвучены:кнопки.every(x=>(x.getAttribute("data-speak")||"").length>20),
   строк:строки.length,школВТексте,
   естьСвод:/Чар школ 114/.test(el.innerHTML)};});
 check('в окне Академии есть раздел со всеми тридцатью восемью школами и сводом',
  !окно.нет&&окно.школВТексте===38&&окно.естьСвод,окно);
 check('у каждого невыученного заклинания своя озвученная кнопка',
  !окно.нет&&окно.кнопок>=100&&окно.всеОзвучены,окно);

 /* ── 10. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Чары школ/i.test(g.title));
  return {ss:r.find(x=>x.id==="schoolspells"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «schoolspells»',
  !!свод.ss&&свод.ss.ok===true,свод.ss);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о чарах школ',свод.глава&&свод.строк>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о ста двух чарах и о том, что ни одно не пустое',
  /сто два заклинания|Чары школ/i.test(readme)&&/Ни одно не пустое/i.test(readme)
  &&/исцеляющей\s+стрелы/i.test(readme));
 check('docs/МИР.md держит таблицу форм по семействам и правила ступеней',
  /SCHOOL_SPELLS/.test(mir)&&/spellIncompat/.test(mir)&&/SCHOOL_AUDIO/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
