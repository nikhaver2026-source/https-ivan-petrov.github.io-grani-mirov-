/* ════════════════════════════════════════════════════════════════════════
   НАБОР 58: ОГРОМНЫЙ МИР

   Мир вырос с двух тысяч клеток по стороне до пятидесяти: с четырёх
   миллионов клеток до двух с половиной миллиардов, в шестьсот двадцать пять
   раз по площади.

   Это возможно только потому, что МИРА НЕТ В ПАМЯТИ: ни одна клетка нигде не
   хранится, всё выводится из координат числовой свёрткой в тот миг, когда об
   этой клетке спросили. Поэтому здесь проверяется не «карта построилась», а
   ровно те четыре вещи, которые от такого роста ломаются:

   1. Далёкий угол мира должен быть настоящей землёй, а не пустотой, и на тех
      же координатах всегда одним и тем же — иначе сохранение соврёт игроку.
   2. Престолы держав должны остаться разложены по всей карте. Они стояли на
      числах, подобранных под старый мир, и сбились бы в угол в четыре сотых
      карты, оставив остальное ничьей землёй.
   3. Кэши должны иметь предел. Пока мир был мал, их рост упирался в размер
      мира сам собой; теперь башен миллионы.
   4. Сохранение не должно расти вместе с миром: оно хранит не карту, а только
      то, что игрок изменил.
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

 /* ── 1. Размер и начало пути ── */
 const размер=await page.evaluate(()=>({
  world:WORLD,клеток:WORLD*WORLD,
  старт:{x:G.x,y:G.y},середина:WORLD>>1}));
 check('мир — пятьдесят тысяч клеток по стороне',размер.world>=50000,размер.world);
 check('в мире больше двух миллиардов клеток',размер.клеток>=2e9,размер.клеток);
 check('путь начинается в середине мира, а не в углу старого',
  Math.abs(размер.старт.x-размер.середина)<=2&&Math.abs(размер.старт.y-размер.середина)<=2,размер.старт);

 /* ── 2. Далёкие углы — настоящая земля ──
    Если бы содержимое выводилось из чего-то, подобранного под старый мир,
    дальний угол оказался бы пуст или однообразен. */
 const углы=await page.evaluate(()=>{
  const точки=[[5,5],[WORLD-6,5],[5,WORLD-6],[WORLD-6,WORLD-6],
   [WORLD>>1,WORLD>>1],[40000,7000],[12345,48321]];
  const о=точки.map(([x,y])=>{
   const c=safeFn(()=>cellContent(x,y),null);
   return c?{x,y,t:c.terrain&&c.terrain[0],имя:c.empire&&c.empire.short,
    есть:!!(c.structure||c.res||c.monster)}:null;});
  return {пусто:о.filter(v=>!v||!v.t).length,
   рельефов:[...new Set(о.filter(Boolean).map(v=>v.t))].length,
   держав:[...new Set(о.filter(Boolean).map(v=>v.имя))].length,
   точки:о};});
 check('в каждом углу мира есть настоящая земля',углы.пусто===0,углы.точки);
 check('далёкие земли не однообразны: рельеф разный',углы.рельефов>=3,углы.рельефов);
 check('далёкие земли принадлежат разным державам',углы.держав>=3,углы.держав);

 /* ── 3. Одно и то же место всегда одно и то же ──
    Сохранение хранит координаты, а не карту: если свёртка неустойчива,
    вернувшийся игрок найдёт на месте леса пустыню. */
 const устойчиво=await page.evaluate(()=>{
  const точки=[[47000,3000],[100,49000],[25000,25000],[3,WORLD-1]];
  const снять=()=>точки.map(([x,y])=>{const c=cellContent(x,y);
   return [c.terrain[0],c.empire.short,c.structure?c.structure.type:"-",
    c.res?c.res.id||c.res.type||"р":"-"].join("|");});
  const раз=снять();
  safeFn(()=>contentCache.clear());
  const два=снять();
  return {совпало:раз.every((v,i)=>v===два[i]),раз,два};});
 check('после сброса кэша место остаётся тем же',устойчиво.совпало,
  {раз:устойчиво.раз,два:устойчиво.два});

 /* ── 4. Престолы разложены по всей карте ── */
 const престолы=await page.evaluate(()=>{
  const c=EMPIRES.map(e=>e.cap);
  const вне=c.filter(p=>p.x<0||p.y<0||p.x>=WORLD||p.y>=WORLD);
  const xs=c.map(p=>p.x),ys=c.map(p=>p.y);
  const охватX=(Math.max(...xs)-Math.min(...xs))/WORLD;
  const охватY=(Math.max(...ys)-Math.min(...ys))/WORLD;
  const разных=new Set(c.map(p=>p.x+","+p.y)).size;
  return {держав:c.length,вне,охватX,охватY,разных};});
 check('престолов двенадцать и все внутри мира',
  престолы.держав===12&&!престолы.вне.length,престолы.вне);
 check('престолы стоят на разных местах',престолы.разных===12,престолы.разных);
 check('престолы разложены по всей карте, а не сбились в угол',
  престолы.охватX>0.8&&престолы.охватY>0.8,
  {поX:Math.round(престолы.охватX*100)/100,поY:Math.round(престолы.охватY*100)/100});

 /* ── 5. Кэши не растут без предела ── */
 const кэши=await page.evaluate(()=>{
  const было={};
  /* Ходим по далёким и разным местам: в старом мире такой обход был бы
     невозможен — там просто нет стольких разных клеток. */
  for(let i=0;i<9000;i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   safeFn(()=>cellContent(x,y));
   if(i%40===0)safeFn(()=>towerAt(x,y));
   if(i%60===0)safeFn(()=>dungeonLore(x,y,1+(i%90)));}
  const имена={contentCache,towerCache,dungLoreCache,darkCache,spurCache};
  for(const k in имена)было[k]=имена[k].size;
  return было;});
 const предел={contentCache:6000,towerCache:4000,dungLoreCache:4000,darkCache:6000,spurCache:1200};
 const разбух=Object.keys(предел).filter(k=>кэши[k]>предел[k]);
 check('после девяти тысяч далёких клеток кэши держат предел',!разбух.length,
  {размеры:кэши,разбухли:разбух});

 /* ── 6. Скорость: клетка выводится, а не ищется ── */
 const скорость=await page.evaluate(()=>{
  /* Разогрев: меряется цена клетки, а не первый прогон компилятора. */
  for(let i=0;i<1500;i++){const x=(i*31)%WORLD,y=(i*17+9000)%WORLD;safeFn(()=>cellContent(x,y),null);}
  const t=performance.now();
  let n=0;
  for(let i=0;i<20000;i++){
   const x=(i*31)%WORLD,y=(i*17+9000)%WORLD;
   if(safeFn(()=>cellContent(x,y),null))n++;}
  return {мс:Math.round(performance.now()-t),клеток:n};});
 check('двадцать тысяч далёких клеток выводятся быстрее секунды',
  скорость.мс<1000&&скорость.клеток===20000,скорость);

 /* ── 7. Сохранение хранит не карту ──
    Мир в шестьсот раз больше не должен стоить ни байта в сохранении. */
 const сохранение=await page.evaluate(async()=>{
  safeFn(()=>saveGame(true));
  const до=(store.get("gm29save")||"").length;
  for(let i=0;i<4000;i++){const x=(i*7919)%WORLD,y=(i*104729)%WORLD;safeFn(()=>cellContent(x,y));}
  safeFn(()=>saveGame(true));
  const после=(store.get("gm29save")||"").length;
  return {до,после,рост:после-до};});
 check('сохранение не растёт от того, что мир обошли',
  сохранение.рост<4000,сохранение);
 check('сохранение вообще есть и невелико',
  сохранение.после>0&&сохранение.после<900000,сохранение.после);

 /* ── 8. Край мира на месте ── */
 const край=await page.evaluate(()=>{
  G.place=null;G.ship=null;
  G.x=WORLD-1;G.y=WORLD-1;
  safeFn(()=>step("в"));safeFn(()=>step("ю"));
  const уголДальний={x:G.x,y:G.y};
  G.x=0;G.y=0;
  safeFn(()=>step("з"));safeFn(()=>step("с"));
  const уголБлижний={x:G.x,y:G.y};
  G.x=WORLD>>1;G.y=WORLD>>1;
  return {уголДальний,уголБлижний,предел:WORLD-1};});
 check('за дальний край мира не уйти',
  край.уголДальний.x===край.предел&&край.уголДальний.y===край.предел,край.уголДальний);
 check('за ближний край мира не уйти',
  край.уголБлижний.x===0&&край.уголБлижний.y===0,край.уголБлижний);

 /* ── 9. Дороги и селения работают и в дальних землях ── */
 const дальние=await page.evaluate(()=>{
  let дорог=0,селений=0,подземелий=0;
  for(let i=0;i<2600;i++){
   const x=44000+((i*37)%900),y=41000+((i*53)%900);
   if(isRoad(x,y))дорог++;
   const c=safeFn(()=>cellContent(x,y),null);
   if(c&&c.structure){селений++;if(c.structure.type==="dungeon")подземелий++;}}
  return {дорог,селений,подземелий};});
 check('в дальних землях есть дороги',дальние.дорог>0,дальние);
 check('в дальних землях есть постройки',дальние.селений>0,дальние);

 /* ── 10. Опасность растёт с удалением, а не упирается в предел ──
    Уровень твари считался от расстояния до престола, делённого на число под
    старый мир. Когда мир вырос в двадцать пять раз, мера перестала работать, и
    девяносто один процент тварей встал на ПРЕДЕЛЬНЫЙ уровень: новичок за
    околицей встречал предельных драконов. Ни одна проверка этого не видела —
    наборы смотрят, что тварь есть и что бой работает, а не какого она уровня. */
 const опасность=await page.evaluate(()=>{
  const уровни=[],предельных=[];
  let найдено=0;
  for(let i=0;i<60000&&найдено<900;i++){
   const x=(i*7919)%WORLD,y=(i*104729)%WORLD;
   const c=safeFn(()=>cellContent(x,y),null);
   if(!c||!c.monster)continue;
   найдено++;
   уровни.push(c.monster.lvl);
   if(c.monster.lvl>=c.monster.max)предельных.push(1);}
  уровни.sort((a,b)=>a-b);
  return {тварей:найдено,
   средний:Math.round(уровни.reduce((a,b)=>a+b,0)/Math.max(1,уровни.length)*10)/10,
   наПределе:Math.round(предельных.length/Math.max(1,найдено)*1000)/10,
   разных:new Set(уровни).size,
   низ:уровни[0],верх:уровни[уровни.length-1]};});
 check('твари в мире встречаются',опасность.тварей>=200,опасность.тварей);
 check('мир не состоит из предельно сильных тварей',
  опасность.наПределе<25,опасность);
 check('уровни тварей разнятся, а не слиплись в один',
  опасность.разных>=3,опасность);
 check('средний уровень твари по миру умеренный',
  опасность.средний>=1&&опасность.средний<=8,опасность.средний);

 /* ── 11. Кошелёк остаётся числом после любой сделки ──
    Спросить у обоза товар, которого он не везёт, давало цену «не число», а
    сравнение «золота меньше, чем NaN» ложно — поэтому вычитание проходило, и
    кошелёк превращался в NaN НАВСЕГДА, без единого слова игроку. Тихая порча
    счёта хуже отказа. */
 const кошелёк=await page.evaluate(()=>{
  const было=G.gold=500;
  const шаги=[];
  const car=safeFn(()=>{
   const rt=(typeof caravanRoutes==="function")?caravanRoutes(G.x,G.y,G.day)[0]:null;
   return rt?caravanState(rt,G.day,Math.floor(G.hour)):null;},null);
  if(car)safeFn(()=>meetCaravan(car));
  ["такого-товара-нет","",null,undefined,"руда"].forEach(t=>{
   safeFn(()=>caravanBuy(t,1));
   шаги.push({товар:String(t),золото:G.gold,число:Number.isFinite(G.gold)});
   safeFn(()=>caravanSell(t,false));
   шаги.push({товар:String(t)+"/продажа",золото:G.gold,число:Number.isFinite(G.gold)});});
  const порча=шаги.filter(ш=>!ш.число);
  G.gold=было;
  return {обозЕсть:!!car,порча,шагов:шаги.length};});
 check('золото остаётся числом после любой сделки с обозом',
  !кошелёк.порча.length,кошелёк.порча.slice(0,4));

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
