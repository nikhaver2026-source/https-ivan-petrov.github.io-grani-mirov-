/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 150: ВТОРОЕ УСИЛЕНИЕ (§7 мастер-промпта)

   §7 показывает сборку заклинания из ядра, стихии, формы и НЕСКОЛЬКИХ
   модификаторов: «ядро — удар, стихия — молния, форма — цепь, модификатор
   — металл, модификатор — распространение». Составитель брал ровно одно
   усиление, и вся вторая половина примера была недоступна.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Спорных пар шесть, все из настоящих усилений, у каждой своё слово,
      и ни одна не повторяется.
   2. Судья взаимен: порядок усилений не меняет ответа; на несогласных
      парах и на «без усиления» он молчит.
   3. Одно и то же усиление дважды не кладут, и об этом сказано словами.
   4. Прежнее не сломалось: чара с одним усилением собирается ровно как
      раньше — то же имя, та же цена, тот же опознаватель.
   5. Два усиления дороже одного, и имя несёт оба.
   6. Числа умножаются на оба: дальность, радиус, подготовка, перезарядка.
   7. Признаки берутся от обоих: кровное и двойное вместе и платятся
      телом, и срабатывают дважды.
   8. Тихое молчит в паре с чем угодно.
   9. Слотов два только с третьей ступени рун или артефакторики.
  10. Окно: до третьей ступени раздел заперт и причина названа; с третьей
      — пятнадцать усилений и кнопка «одно», спорные помечены.
  11. Собранная пара творится по-настоящему и не отвечает пустотой.
  12. Гримуар остался на одном усилении: у его записей второго нет.
  13. Самопроверка мира держит строку «modpair»; модуль, глава, README,
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

 /* ── 1–3. Судья пар ── */
 const судья=await page.evaluate(()=>{
  const плохие=MOD_PAIR_BAD.filter(([a,b,поч])=>!(MOD_BY_ID[a]&&MOD_BY_ID[b]&&a!==b&&поч&&поч.length>12));
  const ключи=MOD_PAIR_BAD.map(([a,b])=>[a,b].sort().join("|"));
  const невзаимные=MOD_PAIR_BAD.filter(([a,b])=>modPairIncompat(a,b)!==modPairIncompat(b,a));
  /* Все прочие пары должны молчать. */
  const ложные=[];
  const ид=SPELL_MODS.map(m=>m.id).filter(x=>x!=="none");
  ид.forEach(a=>ид.forEach(b=>{
   if(a===b)return;
   const спор=MOD_PAIR_BAD.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
   const ответ=modPairIncompat(a,b);
   if(спор&&!ответ)ложные.push(["молчит зря",a,b]);
   if(!спор&&ответ)ложные.push(["спорит зря",a,b,ответ]);}));
  return {всего:MOD_PAIR_BAD.length,плохие,
   уник:new Set(ключи).size,невзаимных:невзаимные.length,
   ложные:ложные.slice(0,4),ложныхВсего:ложные.length,
   сНикем:[modPairIncompat("none","slow"),modPairIncompat("quick","none"),modPairIncompat("","")],
   самССобой:modPairIncompat("quick","quick"),
   слова:MOD_PAIR_BAD.map(([,,п])=>п.length)};});
 check('спорных пар шесть, все настоящие, со словом и без повторов',
  судья.всего===6&&судья.плохие.length===0&&судья.уник===6,судья);
 check('судья взаимен, молчит без второго усиления и не спорит там, где спора нет',
  судья.невзаимных===0&&судья.ложныхВсего===0
  &&судья.сНикем.every(x=>x===""),судья);
 check('одно и то же усиление дважды не кладут, и об этом сказано словами',
  /дважды/.test(судья.самССобой),судья.самССобой);

 /* ── 4–8. Сборка ── */
 const сборка=await page.evaluate(()=>{
  const одно=composeSpell("fire","bolt","quick",1,null,null);
  const пусто=composeSpell("fire","bolt","quick",1,null,null,"none");
  const два=composeSpell("fire","bolt","quick",1,null,null,"far");
  /* Числа: подготовка и перезарядка тоже от обоих. */
  /* Щит на теле не расширить — судья прав; берём волну, у неё радиус есть. */
  const стойк=composeSpell("earth","wave","lasting",1,null,null,"wide");
  const один_ст=composeSpell("earth","wave","lasting",1,null,null);
  const крв=composeSpell("blood","bolt","bloodpay",1,null,null,"twin");
  const мк=modMerged(крв);
  const тих=composeSpell("fire","bolt","silent",1,null,null,"far");
  const тих2=composeSpell("fire","bolt","far",1,null,null,"silent");
  return {
   какРаньше:одно.n===пусто.n&&одно.cost===пусто.cost&&одно.id===пусто.id&&!одно.усиление2,
   одно:{n:одно.n,cost:одно.cost,д:одно.дальность},
   два:{n:два.n,cost:два.cost,д:два.дальность,у2:два.усиление2,id:два.id},
   дороже:два.cost>одно.cost,имяОба:/быстрое и дальнее/.test(два.n),
   дальшe:два.дальность>одно.дальность,
   сложилось:!стойк.ошибка&&!один_ст.ошибка,
   радиус:стойк.радиус>один_ст.радиус,
   подготовка:стойк.подготовка>один_ст.подготовка,
   откат:стойк.откат>=один_ст.откат,
   крв:{кровью:!!мк.кровью,повтор:мк.повтор,k:мк.k},
   тихо:[тих.голос,тих2.голос,modMerged(тих).id,modMerged(тих2).id]};});
 check('чара с одним усилением собирается ровно как раньше',
  сборка.какРаньше,сборка);
 check('два усиления дороже одного, и имя несёт оба',
  сборка.дороже&&сборка.имяОба&&сборка.два.у2==="far"&&/_far$/.test(сборка.два.id),сборка);
 check('числа умножаются на оба: дальность, радиус, подготовка, перезарядка',
  сборка.сложилось&&сборка.дальшe&&сборка.радиус&&сборка.подготовка&&сборка.откат,сборка);
 check('признаки берутся от обоих: кровное и двойное вместе платятся телом и бьют дважды',
  сборка.крв.кровью&&сборка.крв.повтор===2&&сборка.крв.k>1,сборка.крв);
 check('тихое молчит в паре с чем угодно и в любом порядке',
  сборка.тихо[0]===null&&сборка.тихо[1]===null
  &&сборка.тихо[2]==="silent"&&сборка.тихо[3]==="silent",сборка.тихо);

 /* ── 9. Слоты ── */
 const слоты=await page.evaluate(()=>{
  const было=G.mast;
  G.mast={};const н=modSlots();
  G.mast={runes:{ур:2,оп:0,дел:0}};const два=modSlots();
  G.mast={runes:{ур:3,оп:0,дел:0}};const три=modSlots();
  G.mast={arte:{ур:3,оп:0,дел:0}};const арте=modSlots();
  G.mast=было;
  return {н,два,три,арте};});
 check('второе усиление открывается с третьей ступени рун или артефакторики',
  слоты.н===1&&слоты.два===1&&слоты.три===2&&слоты.арте===2,слоты);

 /* ── 10. Окно ── */
 const окно=await page.evaluate(()=>{
  const найти=(вид)=>{const C=25000;
   for(let rr=1;rr<=60;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
    const c=safeFn(()=>cellContent(C+dx,C+dy),null);
    if(c&&c.structure&&c.structure.type===вид)return {x:C+dx,y:C+dy,c};}return null;};
  const м=найти("tower")||найти("school")||найти("temple");
  if(!м)return {нет:"башни"};
  G.x=м.x;G.y=м.y;enterPlace(м.c);
  SF.school="fire";SF.form="bolt";SF.mod="quick";SF.mod2="none";SF.core=null;SF.elem=null;
  /* без ступени */
  G.mast={};spellForgeRender();
  const box=document.getElementById("sfBody");
  const заперто=/Второе усиление кладёт тот/.test(box.innerHTML);
  const кн0=box.querySelectorAll('[data-cmd^="sfmod2:"]').length;
  /* со ступенью */
  G.mast={runes:{ур:3,оп:0,дел:0}};spellForgeRender();
  const кн=[...box.querySelectorAll('[data-cmd^="sfmod2:"]')];
  const одно=box.querySelector('[data-cmd="sfmod2:"]');
  const спорн=э=>э.getAttribute("data-speak");
  const slow=box.querySelector('[data-cmd="sfmod2:slow"]');
  const far=box.querySelector('[data-cmd="sfmod2:far"]');
  const немых=box.querySelectorAll('button:not([data-speak]),.list-line:not([data-speak])').length;
  /* выбор второго усиления и проба */
  CMD.sfmod2("far");
  const проба=box.querySelector('[data-speak*="Выйдет"]');
  const текст=проба?проба.getAttribute("data-speak"):"";
  /* первое усиление не трогали */
  const перв=SF.mod;
  CMD.sfmod2("");
  const сброс=SF.mod2;
  for(let i=0;i<10&&activeLayer();i++)closeTopUI();
  G.place=null;G.mast={};
  return {заперто,кн0,кнопок:кн.length,есть1:!!одно,
   спорноеПомечено:!!slow&&/Нельзя вместе/.test(спорн(slow)),
   можно:!!far&&/Можно/.test(спорн(far)),
   немых,текст:текст.slice(0,140),перв,сброс};});
 check('до третьей ступени раздел заперт и причина названа; с третьей — пятнадцать усилений и «одно»',
  !окно.нет&&окно.заперто&&окно.кн0===0&&окно.кнопок===16&&окно.есть1
  &&окно.спорноеПомечено&&окно.можно&&окно.немых===0,окно);
 check('выбор второго усиления виден в пробе, первое не трогается, пустой выбор возвращает «одно»',
  !окно.нет&&/быстрое и дальнее/.test(окно.текст)&&окно.перв==="quick"&&окно.сброс==="none",окно);

 /* ── 11. Пара творится по-настоящему ── */
 const бой=await page.evaluate(()=>{
  G.hp=400;G.hpMax=400;G.mana=400;G.manaMax=400;G.inCombat=false;G.combat=null;G.place=null;
  const rec=composeSpell("fire","bolt","quick",2,null,null,"far");
  if(!rec||rec.ошибка)return {ошибка:rec&&rec.ошибка};
  const out=String(castCustomEffect(rec)||"");
  const пусто=!out.trim()||/ничего не изменилось|сорвались/.test(out);
  /* И кровная пара вправду берёт здоровье. */
  const кр=composeSpell("blood","bolt","bloodpay",2,null,null,"twin");
  const было=G.hp;const out2=String(castCustomEffect(кр)||"");
  return {out:out.slice(0,90),пусто,взяло:было-G.hp,
   out2:out2.slice(0,90),пусто2:!out2.trim()||/сорвались/.test(out2)};});
 check('собранная пара творится по-настоящему, и кровная пара вправду берёт здоровье',
  !бой.ошибка&&!бой.пусто&&!бой.пусто2&&бой.взяло>0,бой);

 /* ── 12. Гримуар остался на одном ── */
 const грим=await page.evaluate(()=>{
  const n=grimCount();const сВторым=[];
  for(let i=0;i<n;i+=97){const r=grimAt(i);if(r&&r.усиление2)сВторым.push(r.n);}
  return {всего:n,сВторым:сВторым.slice(0,3),сколько:сВторым.length};});
 check('гримуар остался на одном усилении: второго у его записей нет',
  грим.сколько===0&&грим.всего>=14000,грим);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="modpair");
  const гл=GUIDE.find(g=>/Второе усиление/i.test(g.title));
  const W=Modules.get("WEAVE");
  return {строка:!!r,ок:r&&r.ok===true,
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   пар:W&&W.pairs?W.pairs.length:0,
   судья:W?W.pairWhyNot("quick","slow"):"",
   слоты:W?W.slots():0,
   двумя:!!(W&&W.compose("fire","bolt","quick",1,null,null,"far")),
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «modpair» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль WEAVE отдаёт пары, судью, слоты и сборку с двумя усилениями',
  свод.пар===6&&/торопит/.test(свод.судья)&&свод.слоты>=1&&свод.двумя,свод);
 check('в руководстве есть глава о втором усилении',свод.глава&&свод.строкГлавы>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о втором усилении и спорных парах',
  /Второе усиление/i.test(readme)&&/третьей ступени/i.test(readme)
  &&/быстрое и неспешное/i.test(readme));
 check('docs/МИР.md держит устройство второго усиления',
  /MOD_PAIR_BAD/.test(mir)&&/modPairIncompat/.test(mir)&&/modSlots/.test(mir)
  &&/modMerged/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
