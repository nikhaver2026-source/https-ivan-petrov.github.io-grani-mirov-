/* ════════════════════════════════════════════════════════════════════════
   НАБОР 56: У КАЖДОГО МЕСТА И КАЖДОГО СОБЫТИЯ СВОЙ ГОЛОС

   Игра слепая, и музыка в ней не украшение, а сообщение. Если две земли
   звучат одной темой, они на слух одно место. Если награда за цепочку в
   двадцать шагов звучит так же, как выученный жест, разницы между ними нет.

   Здесь проверяется, что тема есть у каждой местности — включая семь земель
   за Гранью, которые прежде темы не находили и потому рисовались
   осциллятором, — что пояса глубины сменяют друг друга по мере спуска и что
   ни одно событие не делит первый голос с другим.
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

 /* ── 1. У каждой местности есть настоящая тема ── */
 const места=await page.evaluate(()=>{
  const ключи=[...new Set([...Object.keys(AMB),...Object.keys(DARK_AMB),...Object.keys(MUSIC_TRACK)])];
  const oo=SFX.prototype.osc,on=SFX.prototype.noise;let синт=0;
  SFX.prototype.osc=function(){синт++;return oo.apply(this,arguments);};
  SFX.prototype.noise=function(){синт++;return on.apply(this,arguments);};
  const безТемы=[],рисуют=[];
  for(const k of ключи){
   const до=синт;Music.stop();Music.start(k);
   if(!Music.track)безТемы.push(k);
   if(синт>до)рисуют.push(k);}
  Music.stop();
  SFX.prototype.osc=oo;SFX.prototype.noise=on;
  return {проверено:ключи.length,безТемы,рисуют,тем:Object.keys(MUSIC_TRACK).length};});
 check('тем места больше сорока',места.тем>=40,места.тем);
 check('у каждой местности есть настоящая запись темы',!места.безТемы.length,места.безТемы);
 check('ни одна местность не рисует музыку',!места.рисуют.length,места.рисуют);

 /* ── 2. Тёмные земли: свои темы, не занятые обычным миром ── */
 const тьма=await page.evaluate(()=>{
  const тёмные=Object.keys(DARK_AMB);
  const света=Object.keys(AMB).map(k=>MUSIC_TRACK[k]);
  const нет=тёмные.filter(k=>!MUSIC_TRACK[k]);
  const общие=тёмные.filter(k=>света.includes(MUSIC_TRACK[k]));
  return {тёмных:тёмные.length,нет,общие,
   темы:Object.fromEntries(тёмные.map(k=>[k,MUSIC_TRACK[k]]))};});
 check('у всех семи земель за Гранью есть своя тема',тьма.тёмных>=7&&!тьма.нет.length,тьма.нет);
 check('тьма не звучит темами обычного мира',!тьма.общие.length,тьма.общие);

 /* ── 3. Ни одно место не делит тему с другим ── */
 const повторы=await page.evaluate(()=>{
  const пары=Object.entries(MUSIC_TRACK);
  const счёт={};пары.forEach(([,v])=>счёт[v]=(счёт[v]||0)+1);
  return Object.keys(счёт).filter(v=>счёт[v]>1)
   .map(v=>v+"←"+пары.filter(([,x])=>x===v).map(([k])=>k).join(","));});
 check('две местности не звучат одной темой',!повторы.length,повторы);

 /* ── 4. Пояса глубины: спуск слышен ── */
 const глубина=await page.evaluate(()=>{
  const ярусы=[1,5,10,11,25,30,31,50,55,56,70,80,81,95,99,100];
  const темы=ярусы.map(d=>[d,MUSIC_TRACK[depthTrack(d)]]);
  const разных=new Set(темы.map(([,t])=>t));
  const пусто=темы.filter(([,t])=>!t).map(([d])=>d);
  return {темы,разных:разных.size,пусто,
   наверху:depthTrack(0),дно:depthTrack(100)};});
 check('у каждого яруса есть запись темы',!глубина.пусто.length,глубина.пусто);
 check('глубина разбита не меньше чем на пять поясов',глубина.разных>=5,глубина.разных);
 check('на поверхности глубинной темы нет',глубина.наверху==="prologue",глубина.наверху);
 check('у самого дна своя тема',глубина.дно==="depth_abyss",глубина.дно);

 /* ── 4б. Двенадцать орденов башен: у каждого своя тема ──
    Башня — не «вид постройки», а орден: две башни разных орденов не должны
    звучать одинаково, иначе орден на слух неразличим. */
 const башни=await page.evaluate(()=>{
  const ид=TOWER_ORDERS.map(o=>o.id);
  const нет=ид.filter(id=>!MUSIC_TRACK["tower_"+id]);
  const темы=ид.map(id=>MUSIC_TRACK["tower_"+id]);
  const счёт={};темы.forEach(t=>счёт[t]=(счёт[t]||0)+1);
  const общие=Object.keys(счёт).filter(t=>счёт[t]>1);
  const нетЗаписи=темы.filter(t=>t&&!Bank.has(t));
  /* Тема ордена не должна совпадать с общей темой вида построек. */
  const сОбщей=ид.filter(id=>MUSIC_TRACK["tower_"+id]===MUSIC_TRACK.pl_tower);
  return {орденов:ид.length,нет,общие,нетЗаписи,сОбщей};});
 check('орденов башен двенадцать и у каждого своя тема',
  башни.орденов>=12&&!башни.нет.length,башни.нет);
 check('два ордена не звучат одной темой',!башни.общие.length,башни.общие);
 check('у темы ордена есть настоящая запись',!башни.нетЗаписи.length,башни.нетЗаписи);
 check('орден не звучит общей темой башен',!башни.сОбщей.length,башни.сОбщей);

 /* ── 5. События: награды, достижения, опыт ── */
 const события=await page.evaluate(()=>{
  const ids=Object.keys(EVENT_THEME);
  const нетРоли=[];
  ids.forEach(id=>{const т=EVENT_THEME[id];
   if(!Bank.has(т.роль))нетРоли.push(id+"→"+т.роль);
   (т.следом||[]).forEach(([р])=>{if(!Bank.has(р))нетРоли.push(id+"→"+р);});});
  const первые=ids.map(id=>EVENT_THEME[id].роль);
  const счёт={};первые.forEach(р=>счёт[р]=(счёт[р]||0)+1);
  const общие=Object.keys(счёт).filter(р=>счёт[р]>1)
   .map(р=>р+"←"+ids.filter(id=>EVENT_THEME[id].роль===р).join(","));
  const безОписания=ids.filter(id=>!EVENT_THEME[id].о);
  return {всего:ids.length,нетРоли,общие,безОписания,ids};});
 check('событий в таблице не меньше двадцати',события.всего>=20,события.всего);
 check('каждое событие ссылается на запись, которая есть в банке',!события.нетРоли.length,события.нетРоли.slice(0,8));
 check('ни одно событие не делит первый голос с другим',!события.общие.length,события.общие);
 check('у каждого события есть описание',!события.безОписания.length,события.безОписания);

 /* ── 6. Темы событий действительно звучат и не рисуются ── */
 const звучат=await page.evaluate(async()=>{
  const oo=SFX.prototype.osc,on=SFX.prototype.noise;let синт=0;
  SFX.prototype.osc=function(){синт++;return oo.apply(this,arguments);};
  SFX.prototype.noise=function(){синт++;return on.apply(this,arguments);};
  const bp=Bank.play.bind(Bank);let сыграно=0;
  Bank.play=function(){const e=bp.apply(null,arguments);if(e)сыграно++;return e;};
  const немые=[];
  for(const id of Object.keys(EVENT_THEME)){
   const до=сыграно;
   if(!eventTheme(id,{}))немые.push(id+" (нет в таблице)");
   else if(сыграно===до)немые.push(id+" (молчит)");
   await new Promise(r=>setTimeout(r,40));}
  await new Promise(r=>setTimeout(r,1800));   /* догоняем отложенные голоса */
  Bank.play=bp;SFX.prototype.osc=oo;SFX.prototype.noise=on;
  return {немые,синт,сыграно,событий:Object.keys(EVENT_THEME).length};});
 check('каждое событие звучит настоящей записью',!звучат.немые.length,звучат.немые.slice(0,8));
 check('темы событий не рисуются',звучат.синт===0,звучат.синт);
 check('у события звучит не один голос, а связка',звучат.сыграно>звучат.событий,
  {сыграно:звучат.сыграно,событий:звучат.событий});

 /* ── 7. Незнакомое событие не проходит молча ── */
 const строгость=await page.evaluate(()=>eventTheme("такого-события-нет",{}));
 check('опечатка в имени события возвращает «нет», а не тишину',строгость===false,строгость);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
