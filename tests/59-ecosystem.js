/* ════════════════════════════════════════════════════════════════════════
   НАБОР 59: ЭКОСИСТЕМА — ПОВАДКИ, ЛОГОВА И СТАИ

   Твари стояли на клетках. Вид выбирался жребием из тех, кому подходит
   базовый рельеф, и всё различие между полуднем и полуночью сводилось к тому,
   что ночью их вдвое больше. Ни логова, ни стаи, ни поры года.

   Мира нет в памяти, поэтому стадо негде «водить» по карте. Но повадка и не
   требует хранения: она выражается ЗАВИСИМОСТЬЮ. Кого игрок встретит здесь,
   зависит от часа, погоды, поры года, близости воды и близости логова. Мир
   меняется сам по себе, смотрит на него игрок или нет, и одинаково для всех,
   кто придёт сюда в тот же час того же дня.

   Здесь проверяется не наличие полей в таблице, а то, что СЛЫШНО:
   волки выходят в сумерки, грозовой ястреб — в бурю, змей уходит в зиму,
   василиск в зиму выходит, мотыльница летит роем, а дракон всегда один.
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

 /* Перепись мира при заданных часе, погоде и дне. */
 await page.evaluate(()=>{window.__перепись=(час,погода,день,сколько)=>{
  const бх=G.hour,бп=G.weather,бд=G.day;
  G.hour=час;G.weather=погода;G.day=день;
  safeFn(()=>contentCache.clear());
  const кто={};let n=0,стайных=0,логовных=0,ровноОдин=0;
  for(let i=0;i<(сколько||40000);i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   const c=safeFn(()=>cellContent(x,y),null);
   if(!c||!c.monster)continue;
   n++;кто[c.monster.id]=(кто[c.monster.id]||0)+1;
   if((c.monster.стаей||1)>1)стайных++;else ровноОдин++;
   if(c.monster.логово)логовных++;}
  G.hour=бх;G.weather=бп;G.day=бд;safeFn(()=>contentCache.clear());
  return {всего:n,видов:Object.keys(кто).length,кто,стайных,логовных,ровноОдин};};});

 /* ── 1. Повадки приписаны тем же тварям, а не заведены зверинцем ── */
 const свод=await page.evaluate(()=>{
  const безПовадок=MONSTERS.filter(m=>!m.нрав||!m.био||!m.стая);
  const чужие=Object.keys(BEAST_ECO).filter(id=>!MONSTERS.some(m=>m.id===id));
  const пустыеБио=MONSTERS.filter(m=>m.био&&!m.био.length).map(m=>m.id);
  /* каждый биом из повадок должен существовать в мире */
  const нетТаких=[];
  MONSTERS.forEach(m=>(m.био||[]).forEach(b=>{if(!BIOME_BY_ID[b])нетТаких.push(m.id+"→"+b);}));
  return {тварей:MONSTERS.length,безПовадок:безПовадок.map(m=>m.id),чужие,пустыеБио,нетТаких};});
 check('повадки есть у каждой твари',!свод.безПовадок.length,свод.безПовадок);
 check('в повадках нет тварей, которых нет в мире',!свод.чужие.length,свод.чужие);
 check('каждый биом повадки существует',!свод.нетТаких.length,свод.нетТаких.slice(0,6));

 /* ── 2. Времена года ── */
 const поры=await page.evaluate(()=>{
  const имена=[1,30,55,80,110].map(d=>seasonAt(d).n);
  const всеРазные=new Set(SEASONS.map(s=>s.id)).size;
  const цикл=seasonAt(1).id===seasonAt(1+SEASON_DAYS*SEASONS.length).id;
  const безОписания=SEASONS.filter(s=>!s.о).length;
  return {имена,пор:SEASONS.length,всеРазные,цикл,безОписания};});
 check('пор года четыре и все разные',поры.пор===4&&поры.всеРазные===4,поры);
 check('пора меняется с днями и год замыкается',
  new Set(поры.имена).size>=3&&поры.цикл===true,поры.имена);
 check('у каждой поры есть описание',поры.безОписания===0,поры.безОписания);

 /* ── 3. Ночь поднимает зверьё ── */
 const день=await page.evaluate(()=>window.__перепись(13,"Ясно",30));
 const ночь=await page.evaluate(()=>window.__перепись(1,"Ясно",30));
 check('зверьё встречается и днём, и ночью',день.всего>200&&ночь.всего>200,
  {день:день.всего,ночь:ночь.всего});
 check('ночью зверья заметно больше',ночь.всего>день.всего*1.2,
  {день:день.всего,ночь:ночь.всего});
 check('весь бестиарий встречается в мире',день.видов>=20&&ночь.видов>=20,
  {день:день.видов,ночь:ночь.видов});

 /* ── 4. Час решает, кто вышел ── */
 check('волк выходит в сумерки и ночь, а днём его меньше вдвое',
  (ночь.кто.wolf||0)>(день.кто.wolf||0)*1.5,
  {день:день.кто.wolf||0,ночь:ночь.кто.wolf||0});
 check('ночная мотыльница летит ночью, а не в полдень',
  (ночь.кто.nightmoth||0)>(день.кто.nightmoth||0)*2,
  {день:день.кто.nightmoth||0,ночь:ночь.кто.nightmoth||0});

 /* ── 5. Погода поднимает своих ── */
 const гроза=await page.evaluate(()=>window.__перепись(13,"Гроза",30));
 check('грозовой ястреб появляется в бурю',
  (гроза.кто.stormhawk||0)>(день.кто.stormhawk||0)*1.6,
  {ясно:день.кто.stormhawk||0,гроза:гроза.кто.stormhawk||0});
 check('в бурю зверья в целом меньше',гроза.всего<день.всего,
  {ясно:день.всего,гроза:гроза.всего});

 /* ── 6. Пора года разводит теплолюбивых и хладолюбивых ── */
 const лето=await page.evaluate(()=>window.__перепись(13,"Ясно",30));
 const зима=await page.evaluate(()=>window.__перепись(13,"Ясно",80));
 check('в зиму пора года сменилась',
  await page.evaluate(()=>seasonAt(30).id!==seasonAt(80).id),
  await page.evaluate(()=>[seasonAt(30).n,seasonAt(80).n]));
 check('змей уходит в зиму',(зима.кто.serpent||0)<(лето.кто.serpent||0)*0.75,
  {лето:лето.кто.serpent||0,зима:зима.кто.serpent||0});
 check('ледяной василиск в зиму выходит',(зима.кто.basilisk||0)>(лето.кто.basilisk||0),
  {лето:лето.кто.basilisk||0,зима:зима.кто.basilisk||0});

 /* ── 7. Стаи и одиночки ── */
 const стаи=await page.evaluate(()=>{
  const одиночки=["dragon","kraken","sandworm","golem","treant","banshee","basilisk"];
  const плохо=[];let стайных=0,всего=0;
  for(let i=0;i<40000;i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   const c=safeFn(()=>cellContent(x,y),null);
   if(!c||!c.monster)continue;
   всего++;
   const n=Number(c.monster.стаей)||1;
   if(n>1)стайных++;
   if(одиночки.includes(c.monster.id)&&n!==1)плохо.push(c.monster.id+":"+n);
   const пред=c.monster.стая?c.monster.стая[1]:1;
   if(n>пред)плохо.push(c.monster.id+" сверх предела:"+n);}
  return {всего,стайных,доля:Math.round(стайных/Math.max(1,всего)*100),плохо:плохо.slice(0,6)};});
 check('стаями ходит заметная часть зверья',стаи.доля>=20&&стаи.доля<=80,стаи.доля);
 check('одиночки всегда одни, и ни одна стая не больше своего предела',
  !стаи.плохо.length,стаи.плохо);

 /* ── 8. Логова: у своей земли тварь встречается чаще ── */
 const логова=await page.evaluate(()=>{
  const волк=MONSTERS.find(m=>m.id==="wolf");
  if(!волк)return null;
  /* Ищем клетку у самого логова и клетку на краю удела того же вида. */
  let близко=0,далеко=0,бл=0,дл=0;
  for(let i=0;i<60000;i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   const p=safeFn(()=>lairPull(волк,x,y),0);
   const вЛесу=safeFn(()=>{const b=biomeAt(x,y);return b&&волк.био.indexOf(b.id)>=0;},false);
   if(!вЛесу)continue;
   const c=safeFn(()=>cellContent(x,y),null);
   /* Занятая клетка в счёт не идёт: где стоит постройка или лежит ресурс,
      зверю не бывать вовсе, и такие клетки говорят о землепользовании, а не
      о том, гуще ли зверь у логова. Раньше они считались наравне с пустыми,
      и достаточно было поставить в лесу несколько станов, чтобы разница у
      логова и на краю сошлась к порогу. */
   if(!c||c.structure||c.res)continue;
   const он=!!(c.monster&&c.monster.id==="wolf");
   if(p>0.75){бл++;if(он)близко++;}
   else if(p<0.15){дл++;if(он)далеко++;}}
  /* Доля считается без округления: на долях процента округление до десятой
     само по себе решало исход проверки. */
  return {бл,дл,близко,далеко,
   уЛогова:близко/Math.max(1,бл),наКраю:далеко/Math.max(1,дл),
   кратно:Math.round((близко/Math.max(1,бл))/Math.max(1e-9,далеко/Math.max(1,дл))*100)/100};});
 check('выборка у логова и на краю удела набралась',
  логова&&логова.бл>=50&&логова.дл>=50,логова);
 check('у логова тварь встречается чаще, чем на краю удела — в полтора раза и больше',
  логова&&логова.уЛогова>логова.наКраю*1.5,
  {бл:логова&&логова.бл,дл:логова&&логова.дл,близко:логова&&логова.близко,
   далеко:логова&&логова.далеко,кратно:логова&&логова.кратно});

 /* ── 9. Мир одинаков для всех, кто придёт в тот же час ── */
 const устойчиво=await page.evaluate(()=>{
  const снять=()=>{safeFn(()=>contentCache.clear());
   return [[26000,26000],[31000,12000],[7000,44000]].map(([x,y])=>{
    const c=cellContent(x,y);return c.monster?c.monster.id+":"+c.monster.стаей:"—";}).join("|");};
  G.hour=3;G.weather="Ясно";G.day=30;
  const раз=снять(),два=снять();
  return {совпало:раз===два,раз};});
 check('в тот же час того же дня мир одинаков',устойчиво.совпало,устойчиво.раз);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
