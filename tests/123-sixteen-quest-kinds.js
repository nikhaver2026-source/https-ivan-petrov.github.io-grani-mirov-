/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 123: ШЕСТНАДЦАТЬ РОДОВ ДЕЛ (§25 брифа)

   §25 перечисляет роды дел: сюжетные, фракционные, расследования, охота,
   доставка, ремесло, дипломатия, исследования, археология, религия, магия,
   война, спасение, экономика, случайные и скрытые.

   Дела в мире были, и разные, но рода у них не было: в журнале лежала
   россыпь «принеси», «убей», «дойди», и чем одно дело отличается от
   соседнего, можно было понять, только прочитав текст целиком. Четырёх
   родов не было вовсе: дипломатии, археологии, спасения и скрытых дел.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шестнадцать родов, у каждого имя, пояснение и своя живая запись; ни
      имя, ни запись не повторяются.
   2. Род находится у дела любого вида — ни одно дело не остаётся без рода,
      и виды разложены по родам осмысленно.
   3. Четыре новых рода и вправду выдаются: у каждого есть ремёсла, которые
      их дают, и дело выходит со своей целью и наградой.
   4. Дипломатия ведёт на престол соседней державы и по сдаче поднимает обе;
      спасение оставляет весть; археология записывает поднятое; скрытое не
      называет ни награды, ни заказчика.
   5. Род звучит своей записью и называется словом, когда дело берут и
      когда сдают.
   6. Самопроверка мира держит строку «questkinds», руководство и README о
      родах рассказывают.
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
  всего:QUEST_KINDS.length,
  имена:QUEST_KINDS.map(k=>k.n),
  именРазных:new Set(QUEST_KINDS.map(k=>k.n)).size,
  идРазных:new Set(QUEST_KINDS.map(k=>k.id)).size,
  звуковРазных:new Set(QUEST_KINDS.map(k=>k.звук)).size,
  безПояснения:QUEST_KINDS.filter(k=>!k.о).map(k=>k.id),
  нетВБанке:QUEST_KINDS.filter(k=>!SOUND_BANK[k.звук]).map(k=>k.id),
  поБрифу:["story","faction","case","hunt","delivery","craft","diplom","study",
   "archeo","faith","magic","war","rescue","econ","random","secret"]
   .filter(id=>!QUEST_KIND_BY_ID[id])}));
 check('шестнадцать родов, и все шестнадцать — те, что названы в бриф-листе',
  состав.всего===16&&состав.идРазных===16&&состав.поБрифу.length===0,состав);
 check('у каждого рода имя, пояснение и своя живая запись, и ничего не повторяется',
  состав.именРазных===16&&состав.звуковРазных===16
  &&состав.безПояснения.length===0&&состав.нетВБанке.length===0,состав);

 /* ── 2. род есть у любого дела ── */
 const разбор=await page.evaluate(()=>{
  const виды=["fetch","visit","kill","hunt","study","craft","trapwork","hoard","delivery",
   "freight","escort","portal_run","war_raid","war_supply","god_altar","god_relic"];
  const поВиду={};виды.forEach(t=>{const k=questKind({type:t});поВиду[t]=k?k.id:null;});
  /* Полторы тысячи настоящих дел из мира: род должен найтись у каждого. */
  const роды={};let всего=0,безРода=0;
  for(let i=0;i<1500;i++){
   const n=safeFn(()=>getNPC((200+i*271)%50000,(300+i*397)%50000,i%3),null);
   if(!n)continue;
   const q=safeFn(()=>questFor(n),null);if(!q)continue;
   всего++;const k=safeFn(()=>questKind(q),null);
   if(!k){безРода++;continue;}
   роды[k.id]=(роды[k.id]||0)+1;}
  return {поВиду,всего,безРода,роды,родовВстретилось:Object.keys(роды).length};});
 check('у дела любого вида есть род, и ни один вид не остался без разбора',
  Object.values(разбор.поВиду).every(Boolean),разбор.поВиду);
 check('виды разложены по родам осмысленно',
  разбор.поВиду.hoard==="archeo"&&разбор.поВиду.trapwork==="rescue"
  &&разбор.поВиду.freight==="delivery"&&разбор.поВиду.war_raid==="war"
  &&разбор.поВиду.god_relic==="faith"&&разбор.поВиду.portal_run==="magic"
  &&разбор.поВиду.craft==="craft"&&разбор.поВиду.fetch==="econ",разбор.поВиду);
 check('полторы тысячи настоящих дел мира — и ни одного без рода',
  разбор.всего>=1000&&разбор.безРода===0&&разбор.родовВстретилось>=5,
  {всего:разбор.всего,безРода:разбор.безРода,роды:разбор.роды});

 /* ── 3. четыре новых рода выдаются ── */
 const новые=await page.evaluate(()=>{
  const итог={};
  ["diplom","archeo","rescue","secret"].forEach(род=>{
   const профы=Object.keys(WORLD_QUEST_BY_PROF).filter(p=>WORLD_QUEST_BY_PROF[p]===род);
   итог[род]={профессий:профы.length,дело:null};
   for(let i=0;i<60&&!итог[род].дело;i++){
    const n=safeFn(()=>getNPC((1000+i*97)%50000,(2000+i*131)%50000,0,профы[0]),null);
    if(!n)continue;
    const q=safeFn(()=>worldQuestFor(n,0.1),null);
    if(!q)continue;
    const k=questKind(q);
    if(!k||k.id!==род)continue;
    итог[род].дело={тип:q.type,род:k.id,есть:{tx:q.tx!==undefined,ty:q.ty!==undefined},
     текст:String(q.text).slice(0,90),
     золото:q.reward&&q.reward.gold,опыт:q.reward&&q.reward.xp,
     сосед:q.соседДержава||null,кого:q.кого||null,находка:q.находка||null,скрытое:!!q.скрытое};}});
  return итог;});
 check('у каждого нового рода есть свои ремёсла, которые его дают',
  ["diplom","archeo","rescue","secret"].every(r=>новые[r].профессий>=3),
  Object.fromEntries(Object.entries(новые).map(([k,v])=>[k,v.профессий])));
 check('каждый новый род и вправду выдаётся делом с целью и наградой',
  ["diplom","archeo","rescue","secret"].every(r=>новые[r].дело
   &&новые[r].дело.есть.tx&&новые[r].дело.есть.ty
   &&новые[r].дело.золото>0&&новые[r].дело.опыт>0),новые);
 check('дипломатия ведёт к соседней державе, спасение называет человека, археология — находку, скрытое помечено',
  новые.diplom.дело.сосед&&новые.rescue.дело.кого&&новые.archeo.дело.находка
  &&новые.secret.дело.скрытое===true,
  {сосед:новые.diplom.дело.сосед,кого:новые.rescue.дело.кого,
   находка:новые.archeo.дело.находка,скрытое:новые.secret.дело.скрытое});

 /* ── 4. последствия сдачи ── */
 const сдача=await page.evaluate(()=>{
  const было=(кого)=>safeFn(()=>standOf("fact",кого),0);
  /* Дипломатия. */
  G.standing={};
  const q1={id:"t1",npc:"Проверка",type:"visit",род:"diplom",tx:G.x,ty:G.y,
   соседДержава:EMPIRES[1].short,своя:EMPIRES[0].short};
  const дип={до:[было(EMPIRES[0].short),было(EMPIRES[1].short)]};
  const слово1=safeFn(()=>questKindDone(q1),"");
  дип.после=[было(EMPIRES[0].short),было(EMPIRES[1].short)];дип.слово=слово1;
  /* Спасение. */
  const q2={id:"t2",npc:"Проверка",type:"visit",род:"rescue",tx:G.x,ty:G.y,кого:"Виран"};
  const слово2=safeFn(()=>questKindDone(q2),"");
  /* Археология. */
  const q3={id:"t3",npc:"Проверка",type:"fetch",род:"archeo",res:"древняя кость",
   находка:"древняя кость из руин"};
  const слово3=safeFn(()=>questKindDone(q3),"");
  /* Скрытое. */
  const q4={id:"t4",npc:"Проверка",type:"fetch",род:"secret",скрытое:true,res:"эфир"};
  const слово4=safeFn(()=>questKindDone(q4),"");
  /* Карточка скрытого дела не называет награды до конца. */
  const карточкаДо=safeFn(()=>questCardHtml(Object.assign({},q4,{reward:{gold:99,xp:99},done:false})),"");
  const карточкаПосле=safeFn(()=>questCardHtml(Object.assign({},q4,{reward:{gold:99,xp:99},done:true})),"");
  return {дип,слово2,слово3,слово4,
   скрытоеДо:/не названа/.test(карточкаДо),скрытоеПосле:/99 золота/.test(карточкаПосле),
   родВКарточке:/Род:/.test(карточкаДо)};});
 check('сдача дипломатического дела поднимает обе державы и говорит об этом',
  сдача.дип.после[0]>сдача.дип.до[0]&&сдача.дип.после[1]>сдача.дип.до[1]
  &&/запомнят/.test(сдача.дип.слово),сдача.дип);
 check('спасение оставляет весть, археология записывает поднятое, скрытое молчит о заказчике',
  /жив/.test(сдача.слово2)&&/руин/.test(сдача.слово3)&&/не назвал/.test(сдача.слово4),
  {спасение:сдача.слово2,археология:сдача.слово3,скрытое:сдача.слово4});
 check('скрытое дело не называет награды до конца, а после сдачи называет',
  сдача.скрытоеДо&&сдача.скрытоеПосле,
  {до:сдача.скрытоеДо,после:сдача.скрытоеПосле});
 check('карточка дела называет род',сдача.родВКарточке);

 /* ── 5. род звучит ── */
 const голос=await page.evaluate(async()=>{
  const итог={};
  for(const род of ["hunt","delivery","diplom","secret"]){
   __played.length=0;
   const k=QUEST_KIND_BY_ID[род];
   const сыграл=questKindCue({род,type:"visit",tx:1,ty:1},{gain:0.3,maxSec:1});
   итог[род]={сыграл,ждали:k.звук,слышно:__played.indexOf(k.звук)>=0};}
  return итог;});
 check('голос рода — та самая запись, что записана за родом',
  Object.values(голос).every(v=>v.сыграл&&v.слышно),голос);

 /* ── 6. самопроверка, руководство, README ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Шестнадцать родов дел/i.test(g.title));
  return {questkinds:(r.find?r.find(x=>x&&x.id==="questkinds"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «questkinds»',
  !!свод.questkinds&&свод.questkinds.ok===true,свод.questkinds);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о родах дел',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о шестнадцати родах дел и четырёх новых',
  /шестнадцать родов|шестнадцати родов/i.test(readme)&&/дипломати/i.test(readme)
  &&/археологи/i.test(readme)&&/спасени/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
