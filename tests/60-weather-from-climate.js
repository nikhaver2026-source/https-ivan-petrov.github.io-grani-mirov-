/* ════════════════════════════════════════════════════════════════════════
   НАБОР 60: ПОГОДА ИЗ КЛИМАТА

   Погода бросалась жребием из пяти видов, одинаково для всей карты:
   в пустыне лил дождь, на леднике стояла жара, над морем не вставал туман.

   Хуже того, СНЕГ И ТУМАН ВЫПАСТЬ НЕ МОГЛИ ВОВСЕ: у них есть записи, свои
   поверхности под ногой и твари, которые на них отзываются, — но жребий их не
   выдавал ни разу. А в игре уже было содержимое, привязанное к «метели» и
   «ливню», которых не бывало в природе: условие написано, погода под него не
   наступает никогда.

   Здесь проверяется не список видов, а то, что погода СЛЕДУЕТ ИЗ МЕСТА:
   в пустыне не льёт, на леднике не жарко, зимой дождь становится снегом, а
   туман ложится к рассвету и расходится к полудню.
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

 /* Одна точка на каждый нужный биом — ОДНИМ проходом. Перебирать карту
    заново на каждый биом нельзя: редкий биом уводит поиск на все пятьдесят
    тысяч клеток, и проверка встаёт. */
 const точки=await page.evaluate(()=>{
  const нужны=["desert","glacier","ancient_forest","mire","shore"];
  const т={};
  for(let i=0;i<50000&&Object.keys(т).length<нужны.length;i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   const bm=safeFn(()=>biomeAt(x,y),null);
   if(bm&&нужны.includes(bm.id)&&!т[bm.id])т[bm.id]={x,y};}
  window.__точки=т;
  window.__доли=(id,день,час)=>{
   const p=window.__точки[id];if(!p)return null;
   const бx=G.x,бy=G.y,бд=G.day,бч=G.hour,бм=G.place,бк=G.ship;
   G.place=null;G.ship=null;G.alt=0;G.x=p.x;G.y=p.y;G.day=день;G.hour=час;
   const c={};
   for(let i=0;i<3000;i++){const w=rollWeather();c[w]=(c[w]||0)+1;}
   G.x=бx;G.y=бy;G.day=бд;G.hour=бч;G.place=бм;G.ship=бк;
   const d={};for(const k in c)d[k]=Math.round(c[k]/30*10)/10;
   return d;};
  return Object.keys(т);});
 check('нашлись пустыня, ледник, древний лес, топь и берег',точки.length>=5,точки);

 /* ── 1. Виды погоды ── */
 const виды=await page.evaluate(()=>({
  всего:WEATHER_KINDS.length,
  безОписания:WEATHER_KINDS.filter(w=>!w.о).map(w=>w.id),
  повторы:WEATHER_KINDS.length-new Set(WEATHER_KINDS.map(w=>w.id)).size,
  нет:["Снег","Метель","Туман","Град","Песчаная буря","Ливень","Зной"].filter(id=>!WEATHER_BY_ID[id])}));
 check('видов погоды не меньше двенадцати',виды.всего>=12,виды.всего);
 check('снег, метель, туман, град, песчаная буря, ливень и зной существуют',!виды.нет.length,виды.нет);
 check('у каждой погоды есть описание и нет повторов',
  !виды.безОписания.length&&виды.повторы===0,виды);

 /* ── 2. Пустыня: не льёт, но заносит ── */
 const пустыня=await page.evaluate(()=>window.__доли("desert",30,13));
 check('в пустыне почти не бывает дождя и грозы',
  (пустыня["Дождь"]||0)+(пустыня["Гроза"]||0)+(пустыня["Ливень"]||0)<4,пустыня);
 check('в пустыне поднимается песчаная буря',(пустыня["Песчаная буря"]||0)>5,пустыня);

 /* ── 3. Ледник: снег даже в разгар лета ── */
 const ледник=await page.evaluate(()=>window.__доли("glacier",30,13));
 check('на леднике снег идёт даже летом',(ледник["Снег"]||0)+(ледник["Метель"]||0)>4,ледник);
 check('на леднике не льёт дождь',(ледник["Дождь"]||0)+(ледник["Ливень"]||0)<2,ледник);

 /* ── 4. Пора года превращает дождь в снег ── */
 const лесЛето=await page.evaluate(()=>window.__доли("ancient_forest",30,13));
 const лесЗима=await page.evaluate(()=>window.__доли("ancient_forest",80,13));
 check('в лесу летом идут дожди',
  (лесЛето["Дождь"]||0)+(лесЛето["Ливень"]||0)+(лесЛето["Гроза"]||0)>8,лесЛето);
 check('в том же лесу зимой дождь сменяется снегом',
  (лесЗима["Снег"]||0)+(лесЗима["Метель"]||0)>8&&
  (лесЗима["Дождь"]||0)+(лесЗима["Ливень"]||0)<4,{лето:лесЛето,зима:лесЗима});

 /* ── 5. Туман ложится к рассвету и расходится к полудню ── */
 const рассвет=await page.evaluate(()=>window.__доли("mire",30,6));
 const полдень=await page.evaluate(()=>window.__доли("mire",30,13));
 check('на топях к рассвету встаёт туман',(рассвет["Туман"]||0)>15,рассвет);
 check('к полудню туман расходится',
  (полдень["Туман"]||0)<(рассвет["Туман"]||0)*0.6,
  {рассвет:рассвет["Туман"],полдень:полдень["Туман"]});

 /* ── 6. Погода остаётся жребием, а не расписанием ──
    Две проверки стерегут от противоположных крайностей: климат не должен
    выродиться в одну погоду на биом, но и не должен всё уравнять. */
 const жребий=await page.evaluate(()=>{
  const d=window.__доли("ancient_forest",30,13);
  return {видов:Object.keys(d).length,самый:Math.max(...Object.values(d))};});
 check('в одном месте выпадает несколько разных погод',жребий.видов>=4,жребий);
 check('ни одна погода не заслоняет все прочие',жребий.самый<70,жребий.самый);

 /* ── 7. Погода меняет то, по чему идёшь ── */
 const поверхности=await page.evaluate(()=>{
  const p=window.__точки["ancient_forest"];
  const бx=G.x,бy=G.y,бw=G.weather;
  G.place=null;G.ship=null;G.x=p.x;G.y=p.y;
  const было={};
  ["Ясно","Ливень","Метель","Песчаная буря","Снег"].forEach(w=>{
   G.weather=w;было[w]=safeFn(()=>outdoorSurface(),null);});
  G.x=бx;G.y=бy;G.weather=бw;
  return было;});
 check('ливень размывает землю',поверхности["Ливень"]==="mud",поверхности);
 check('метель и снег ложатся под ноги',
  поверхности["Метель"]==="snow"&&поверхности["Снег"]==="snow",поверхности);
 check('в ясную погоду поверхность своя, а не погодная',
  поверхности["Ясно"]!=="mud"&&поверхности["Ясно"]!=="snow",поверхности);

 /* ── 8. У каждой непогоды есть голос ── */
 const немые=await page.evaluate(()=>{
  const карта={"Дождь":"sky_rain","Ливень":"stk_rain","Гроза":"sky_thunder","Ветрено":"sky_gust",
   "Снег":"sky_snow","Метель":"sky_snow","Град":"stk_crash",
   "Песчаная буря":"sky_gust","Зной":"amb_desert","Туман":"sky_leaves","Облачно":"sky_wind"};
  return WEATHER_KINDS.filter(w=>w.id!=="Ясно")
   .filter(w=>!карта[w.id]||!Bank.has(карта[w.id])).map(w=>w.id);});
 check('у каждой непогоды есть своя запись',!немые.length,немые);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
