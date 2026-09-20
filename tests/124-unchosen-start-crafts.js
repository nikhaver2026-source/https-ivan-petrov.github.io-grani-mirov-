/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 124: НЕИЗБРАННЫЙ — С ЧЕГО НАЧИНАЕТСЯ ГЕРОЙ (§10 брифа)

   §10 требует, чтобы игрок мог начать обычным человеком с обычным
   ремеслом, а дальше расти естественно. В мире этого не было вовсе: герой
   входил ниоткуда, без прошлого и без ремесла, одинаковый у всех. Первый
   час игры был одинаков и для того, кто хочет торговать, и для того, кто
   хочет копать.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шесть ремёсел, у каждого имя, присказка, совет, настоящий навык из
      общего списка, набор вещей, деньги и свой голос; ни навык, ни голос
      не повторяются, а ресурсы набора есть в мире.
   2. Выбор стоит только в начале пути и виден в меню действий; сделанный
      выбор закрывает раздел, и второй раз ремесло не переигрывают.
   3. Выбор и вправду даёт: навык выучен, вещи в суме, ресурсы в суме,
      золото прибавилось, и всё это названо словом.
   4. Ремесло не класс: навык из общего списка, и тот же навык можно было
      бы выучить и без выбора.
   5. Можно не выбирать вовсе: мир не требует выбора и работает без него.
   6. Выбор ложится в сохранение; самопроверка мира держит строку
      «startcraft», руководство и README о ремёслах начала рассказывают.
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
 const состав=await page.evaluate(()=>({
  всего:START_CRAFTS.length,
  имена:START_CRAFTS.map(c=>c.n),
  безПрисказки:START_CRAFTS.filter(c=>!c.о||!c.совет).map(c=>c.id),
  навыковРазных:new Set(START_CRAFTS.map(c=>c.навык)).size,
  звуковРазных:new Set(START_CRAFTS.map(c=>c.звук)).size,
  навыкаНет:START_CRAFTS.filter(c=>!SKILL_BY_ID[c.навык]).map(c=>c.id),
  звукаНет:START_CRAFTS.filter(c=>!SOUND_BANK[c.звук]).map(c=>c.id),
  безНабора:START_CRAFTS.filter(c=>!(c.золото>0)||!Array.isArray(c.вещи)||!c.вещи.length).map(c=>c.id),
  ресурсаНет:START_CRAFTS.filter(c=>Object.keys(c.ресурсы||{}).some(r=>!RES_BASE[r])).map(c=>c.id),
  командаНет:START_CRAFTS.filter(c=>typeof CMD["craft_"+c.id]!=="function").map(c=>c.id)}));
 check('шесть ремёсел, у каждого имя, присказка и совет',
  состав.всего===6&&состав.безПрисказки.length===0,состав);
 check('у каждого свой навык из общего списка и свой голос, и ничего не повторяется',
  состав.навыковРазных===6&&состав.звуковРазных===6
  &&состав.навыкаНет.length===0&&состав.звукаНет.length===0,состав);
 check('у каждого настоящий набор: вещи, деньги и ресурсы, которые в мире есть',
  состав.безНабора.length===0&&состав.ресурсаНет.length===0,состав);
 check('каждое ремесло вызывается своей командой меню',состав.командаНет.length===0,состав.командаНет);

 /* ── 2. выбор стоит только в начале ── */
 const начало=await page.evaluate(()=>{
  G.startCraft=null;G.level=1;G.quests=[];G.day=1;
  const свежий={открыт:startCraftOpen(),вМеню:START_CRAFTS.every(c=>amAvailable("craft_"+c.id))};
  G.level=4;const поУровню=startCraftOpen();
  G.level=1;G.quests=[{id:"x"}];const поДелу=startCraftOpen();
  G.quests=[];G.day=9;const поДню=startCraftOpen();
  G.day=1;
  return {свежий,поУровню,поДелу,поДню,сноваОткрыт:startCraftOpen()};});
 check('в самом начале выбор стоит и все шесть видны в меню действий',
  начало.свежий.открыт===true&&начало.свежий.вМеню===true,начало.свежий);
 check('выбор закрывается, когда путь уже начат: уровень, дело или прошедшие дни',
  начало.поУровню===false&&начало.поДелу===false&&начало.поДню===false
  &&начало.сноваОткрыт===true,начало);

 /* ── 3–4. выбор даёт настоящее ── */
 const выбор=await page.evaluate(()=>{
  const речь=()=>__said.join(" | ");
  G.startCraft=null;G.level=1;G.quests=[];G.day=1;
  G.gold=0;G.skills=[];G.items=[];G.inv={};
  __played.length=0;__said.length=0;
  const взял=startCraftPick("crafter");
  const c=START_CRAFT_BY_ID.crafter;
  const из={взял,слово:речь(),
   навык:hasSkill(c.навык),золото:G.gold,
   вещи:(c.вещи||[]).every(в=>(G.items||[]).includes(в)),
   ресурсы:Object.keys(c.ресурсы).every(r=>(Number(G.inv[r])||0)>=c.ресурсы[r]),
   голос:__played.indexOf(c.звук)>=0,
   вЛетописи:(G.journal||[]).some?true:true};
  /* Второй раз — отказ, и раздел меню закрыт. */
  __said.length=0;
  из.второй={ok:startCraftPick("trader"),слово:речь(),вМеню:amAvailable("craft_trader")};
  /* Тот же навык можно выучить и без выбора: ремесло не класс. */
  G.startCraft=null;G.skills=[];
  из.навыкБезВыбора=safeFn(()=>learnSkill("haggler"),false)&&hasSkill("haggler");
  return из;});
 check('выбор даёт навык, вещи, ресурсы и деньги',
  выбор.взял===true&&выбор.навык&&выбор.вещи&&выбор.ресурсы&&выбор.золото>0,выбор);
 check('выбор назван словом: ремесло, навык, что в суме и первый совет',
  /начинаете как ремесленник/i.test(выбор.слово)&&/Навык/.test(выбор.слово)
  &&/В суме/.test(выбор.слово)&&/жилы камня|станок/i.test(выбор.слово),
  выбор.слово.slice(0,240));
 check('у выбора свой голос',выбор.голос===true);
 check('второй раз ремесло не переигрывают, и раздел меню закрывается',
  выбор.второй.ok===false&&/не переигрывают/.test(выбор.второй.слово)
  &&выбор.второй.вМеню===false,выбор.второй);
 check('ремесло — не класс: тот же навык учится и без выбора',
  выбор.навыкБезВыбора===true);

 /* ── 5. можно не выбирать ── */
 const без=await page.evaluate(()=>{
  G.startCraft=null;G.level=1;G.quests=[];G.day=1;
  /* Мир должен работать и без выбора: проходим обычный круг действий. */
  const ошибки=[];
  [()=>look(),()=>refresh(),()=>renderInventory(),()=>worldSelfCheck()]
   .forEach((f,i)=>{try{f();}catch(e){ошибки.push(i+": "+e);}});
  return {ремесло:startCraftOf(),ошибки};});
 check('можно не выбирать вовсе: мир работает и без ремесла',
  без.ремесло===null&&без.ошибки.length===0,без);

 /* ── 6. сохранение, самопроверка, свод правил ── */
 const итог=await page.evaluate(()=>{
  G.startCraft=null;G.level=1;G.quests=[];G.day=1;G.skills=[];
  startCraftPick("seeker");
  const raw=safeFn(()=>serializeSave(),"")||"";
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Неизбранный/i.test(g.title));
  return {вСохранении:raw.indexOf("startCraft")>=0&&/seeker/.test(raw),
   startcraft:(r.find?r.find(x=>x&&x.id==="startcraft"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('выбор ложится в сохранение',итог.вСохранении,итог);
 check('самопроверка мира держит зелёную строку «startcraft»',
  !!итог.startcraft&&итог.startcraft.ok===true,итог.startcraft);
 check('вся остальная самопроверка мира тоже зелёная',итог.плохие.length===0,итог.плохие);
 check('в руководстве есть глава о ремёслах начала',итог.глава&&итог.строк>=4,итог);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о шести ремёслах начала',
  /неизбранн/i.test(readme)&&/ремесленник/i.test(readme)&&/счётчик/i.test(readme)
  &&/писар/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
