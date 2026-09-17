/* ════════════════════════════════════════════════════════════════════════
   НАБОР 74: АЛХИМИЯ КАК ИССЛЕДОВАНИЕ

   Все прочие ремёсла знают наперёд, что выйдет: руда даёт слиток, кристалл —
   грань. Алхимия так не работает, и списком рецептов её не передашь: её суть
   в том, что свойство ПАРЫ веществ заранее неизвестно, и узнаётся оно только
   опытом — иногда полезным, иногда обжигающим.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Свойство пары постоянно: в одном и том же мире трава с грибами всегда
      дают одно и то же, и порядок не важен. Иначе записывать было бы нечего.
   2. Свойств много и они разные, и среди них есть вредное: опыт без риска —
      не опыт.
   3. Опыт идёт в НЕИЗВЕДАННОЕ и кладёт узнанное в книжку; повтор той же пары
      книжку не растит.
   4. Смесь по записи работает только на том, что уже изведано.
   5. Каждый состав что-то ДЕЛАЕТ: здоровье, сила, вода, время или урон.
   6. Книжка переживает сохранение, и пункт меню появляется только у того,
      кто учился алхимии.
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

 /* ── 1. Свойства описаны, и среди них есть вредное ── */
 const свойства=await page.evaluate(()=>{
  const плохие=ALCH_EFFECTS.filter(e=>!e.id||!e.n||!e.о||typeof e.дать!=="function")
   .map(e=>e.id||"?");
  return {всего:ALCH_EFFECTS.length,плохие,
   естьВред:ALCH_EFFECTS.some(e=>e.вред),
   припасов:ALCH_STOCK.length};});
 check('свойств не меньше восьми, у каждого имя, примета и действие, и среди них есть вредное',
  свойства.всего>=8&&свойства.плохие.length===0&&свойства.естьВред,свойства);
 check('смешивать можно не что попало, а названный припас',
  свойства.припасов>=8,свойства);

 /* ── 2. Свойство пары постоянно и не зависит от порядка ── */
 const постоянство=await page.evaluate(()=>{
  const пары=[["трава","грибы"],["ягоды","кость"],["кристалл","руда"],["дерево","камень"]];
  const прямо=пары.map(([a,b])=>alchEffect(a,b).id);
  const обратно=пары.map(([a,b])=>alchEffect(b,a).id);
  const ещё=пары.map(([a,b])=>alchEffect(a,b).id);
  /* И разные пары дают не одно и то же на все случаи. */
  const все=[];
  for(let i=0;i<ALCH_STOCK.length;i++)for(let j=i+1;j<ALCH_STOCK.length;j++)
   все.push(alchEffect(ALCH_STOCK[i],ALCH_STOCK[j]).id);
  return {прямо,обратно,ещё,
   порядокНеВажен:прямо.join()===обратно.join(),
   устойчиво:прямо.join()===ещё.join(),
   разных:new Set(все).size,парВсего:все.length,
   имена:alchPair("грибы","трава")===alchPair("трава","грибы")};});
 check('свойство пары не зависит от порядка и не меняется от вопроса к вопросу',
  постоянство.порядокНеВажен&&постоянство.устойчиво&&постоянство.имена,постоянство);
 check('разные пары дают разное, а не одно на все случаи',
  постоянство.разных>=5,постоянство);

 /* ── 3. Опыт идёт в неизведанное и растит книжку ── */
 const опыт=await page.evaluate(()=>{
  G.mast={alchemy:{ур:5,оп:0,дел:0}};
  G.alch={};G.hp=200;G.hpMax=200;G.mana=0;G.manaMax=50;G.water=50;G.buffs={};
  G.inv={"трава":9,"грибы":9,"ягоды":9,"кость":9};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const было=Object.keys(G.alch).length;
  const инвДо=Object.values(G.inv).reduce((s,v)=>s+v,0);
  techDo(TECH_BY_ID.assayer,"cauldron");
  const после1=Object.keys(G.alch).length;
  const инвПосле=Object.values(G.inv).reduce((s,v)=>s+v,0);
  /* Второй опыт берёт ДРУГУЮ пару: изведанное он не повторяет. */
  techDo(TECH_BY_ID.assayer,"cauldron");
  const после2=Object.keys(G.alch).length;
  /* Когда всё изведано, опыт честно говорит, что ставить его не над чем. */
  G.inv={"трава":9,"грибы":9};
  G.alch={};G.alch[alchPair("трава","грибы")]=alchEffect("трава","грибы").id;
  const рБыло=реплики.length;
  techDo(TECH_BY_ID.assayer,"cauldron");
  const отказ=реплики.slice(рБыло).some(t=>/ставить не над чем|уже сводили/i.test(t));
  Speech.say=say;
  return {было,после1,после2,инвДо,инвПосле,отказ,
   растёт:после1>было&&после2>после1,
   припасУшёл:инвПосле<инвДо,
   сказало:реплики.length>0};});
 check('опыт кладёт узнанное в книжку и каждый раз берёт новую пару',
  опыт.растёт,опыт);
 check('опыт берёт припас и рассказывает, что вышло',
  опыт.припасУшёл&&опыт.сказало,опыт);
 check('когда всё изведано, опыт честно говорит, что ставить его не над чем',
  опыт.отказ,опыт);

 /* ── 4. Смесь по записи работает только на изведанном ── */
 const смесь=await page.evaluate(()=>{
  G.mast={alchemy:{ур:5,оп:0,дел:0}};
  G.alch={};G.buffs={};G.hp=200;G.hpMax=200;G.water=50;
  G.inv={"трава":9,"грибы":9};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  /* Ничего не изведано — мешать нечего. */
  const инвДо=Object.values(G.inv).reduce((s,v)=>s+v,0);
  techDo(TECH_BY_ID.mix,"cauldron");
  const отказ=реплики.some(t=>/Смешивать нечего|поставьте опыт/i.test(t));
  const инвЦел=Object.values(G.inv).reduce((s,v)=>s+v,0)===инвДо;
  /* Изведали — и та же смесь пошла. */
  G.alch[alchPair("трава","грибы")]=alchEffect("трава","грибы").id;
  const рБыло=реплики.length;
  techDo(TECH_BY_ID.mix,"cauldron");
  const пошла=Object.values(G.inv).reduce((s,v)=>s+v,0)<инвДо
   &&реплики.slice(рБыло).some(t=>/в чану/i.test(t));
  Speech.say=say;
  return {отказ,инвЦел,пошла};});
 check('без записи смешивать нечего, и припас при этом цел',
  смесь.отказ&&смесь.инвЦел,смесь);
 check('изведанный состав мешается по записи',смесь.пошла,смесь);

 /* ── 5. Каждый состав что-то делает ── */
 const дела=await page.evaluate(()=>{
  const итоги=[];
  for(const e of ALCH_EFFECTS){
   G.hp=100;G.hpMax=200;G.mana=0;G.manaMax=50;G.water=50;G.buffs={};
   const до={hp:G.hp,mana:G.mana,вода:G.water,даров:Object.keys(G.buffs||{}).length};
   const строка=safeFn(()=>e.дать(),"");
   const после={hp:G.hp,mana:G.mana,вода:G.water,даров:Object.keys(G.buffs||{}).length};
   итоги.push({id:e.id,
    строка:String(строка||""),
    изменилось:после.hp!==до.hp||после.mana!==до.mana||после.вода!==до.вода
     ||после.даров>до.даров,
    числа:Number.isFinite(G.hp)&&Number.isFinite(G.mana)&&Number.isFinite(G.water)});}
  G.buffs={};
  return {проверено:итоги.length,
   пустые:итоги.filter(o=>!o.изменилось&&o.id!=="bitter").map(o=>o.id),
   безЧисел:итоги.filter(o=>!o.числа).map(o=>o.id),
   безСлов:итоги.filter(o=>!o.строка).map(o=>o.id)};});
 check('каждый состав, кроме пустого, что-то меняет и говорит словами',
  дела.пустые.length===0&&дела.безСлов.length===0,дела);
 check('после любого состава здоровье, сила и вода остались числами',
  дела.безЧисел.length===0,дела.безЧисел);

 /* ── 6. Книжка вслух, пункт меню и сохранение ── */
 const книжка=await page.evaluate(()=>{
  G.mast={};
  const безАлхимии=amAvailable("alchbook");
  G.mast={alchemy:{ур:1,оп:0,дел:0}};
  const сАлхимией=amAvailable("alchbook");
  G.alch={};
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  openAlchBook();
  const пустая=реплики.some(t=>/пуста|узнают опытом/i.test(t));
  G.alch[alchPair("трава","грибы")]=alchEffect("трава","грибы").id;
  openAlchBook();
  const сЗаписью=реплики.some(t=>/изведано 1|грибы и трава|трава и грибы/i.test(t));
  Speech.say=say;
  const raw=serializeSave();
  const вЗаписи=(()=>{try{return !!JSON.parse(raw).alch;}catch(_){return false;}})();
  G.alch={};
  Object.assign(G,JSON.parse(raw));
  const пережила=alchKnown("трава","грибы");
  return {безАлхимии,сАлхимией,пустая,сЗаписью,вЗаписи,пережила};});
 check('пункт книжки есть только у того, кто учился алхимии',
  книжка.безАлхимии===false&&книжка.сАлхимией===true,книжка);
 check('пустая книжка объясняет, где берутся составы, а не молчит',
  книжка.пустая,книжка);
 check('записанный состав читается вслух и переживает сохранение',
  книжка.сЗаписью&&книжка.вЗаписи&&книжка.пережила,книжка);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
