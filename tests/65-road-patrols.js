/* ════════════════════════════════════════════════════════════════════════
   НАБОР 65: РАЗЪЕЗДЫ НА ТРАКТАХ

   Обозы по трактам ходили, а держава по ним не ходила вовсе: тракт был
   дорогой без хозяина. Между тем дорога тем и отличается от тропы, что за
   ней кто-то следит, — и для игрока это не украшение, а СВЕДЕНИЕ.

   ГЛАВНАЯ ПРОВЕРКА ЗДЕСЬ — НЕ «РАЗЪЕЗД ЕСТЬ», А «РАЗЪЕЗД ЧТО-ТО МЕНЯЕТ».
   Живой мир, который ничего не меняет, — это декорация: обоз, мимо которого
   можно пройти, ничего не заметив, ничем не отличается от его отсутствия.
   Поэтому здесь меряется частота встреч с тварями рядом с разъездом и вдали
   от него, на одних и тех же клетках и в один и тот же час.

   ВТОРАЯ ПРОВЕРКА — ЦЕНА. Расчёт встреч идёт для всякой спрошенной клетки, а
   эхо-скан и поиск мест спрашивают сотни тысяч за раз. Разъезды считаются на
   квадрат тридцать два на тридцать два, а не на клетку; если эта память
   сломается, набор это увидит по времени обхода.
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

 /* ── 1. Таблица видов полна и звучит живыми записями ── */
 const виды=await page.evaluate(()=>{
  const плохие=PATROL_KIND.filter(p=>!p.id||!p.n||!p.о||!p.людей
   ||!SOUND_BANK[p.звук]||!SOUND_BANK[p.голос]).map(p=>p.id||"?");
  return {всего:PATROL_KIND.length,плохие,голос:!!(SCAPE_VOICE&&SCAPE_VOICE.patrol)};});
 check('видов разъезда не меньше четырёх, и у каждого две живые записи',
  виды.всего>=4&&виды.плохие.length===0,виды);
 check('у разъезда есть голос в звуковой картине',виды.голос,виды);

 /* ── 2. Разъезды стоят на трактах, и только на тех, за которыми следят ── */
 const где=await page.evaluate(()=>{
  const O=25000;
  const все=patrolsNear(O,O,10,12,600);
  const наТракте=все.every(p=>p.x%29===0||p.y%29===0);
  const виды={};
  for(const p of все){
   const rt=p.rt,k=tractKind(rt.kind,rt.line);
   виды[k.id]=(виды[k.id]||0)+1;}
  return {всего:все.length,наТракте,виды,
   заброшенных:(виды.abandoned||0)+(виды.old||0)};});
 check('разъезды идут по трактам, а не по полю',где.всего>0&&где.наТракте,где);
 check('на заброшенных путях и старых дорогах державы нет',
  где.заброшенных===0,где);

 /* ── 3. Разъезд движется: за сутки он в другом месте ── */
 const ход=await page.evaluate(()=>{
  const O=25000;
  const снимок=ч=>patrolsNear(O,O,10,ч,300).map(p=>p.x+","+p.y).join("|");
  const утро=снимок(6),вечер=снимок(18);
  /* И при этом он тот же самый, если спросить дважды. */
  const дважды=снимок(6)===утро;
  return {утро:утро.slice(0,80),вечер:вечер.slice(0,80),
   сдвинулся:утро!==вечер,устойчив:дважды};});
 check('за день разъезд проходит свой отрезок и оказывается в другом месте',
  ход.сдвинулся,ход);
 check('и при этом в тот же час он всегда там же',ход.устойчив,ход);

 /* ── 4. ГЛАВНОЕ: рядом с разъездом встреч меньше ── */
 const влияние=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.day=10;G.hour=12;
  /* Одна пара клеток ничего не докажет: тварь стоит или не стоит, и разница
     в одну встречу перевесит всё. Поэтому берём СОРОК разъездов и для каждого
     считаем клетку под ним и клетку на том же тракте в шестидесяти шагах —
     одна земля, один час, разница только в разъезде. */
  const все=patrolsNear(O,O,G.day,G.hour,1200).slice(0,40);
  if(все.length<10)return {нет:true,нашлось:все.length};
  let рядом=0,далеко=0,пар=0;
  for(const p of все){
   const вдольX=(p.y%29===0);
   const fx=вдольX?p.x+60:p.x,fy=вдольX?p.y:p.y+60;
   if(fx<0||fy<0||fx>=WORLD||fy>=WORLD)continue;
   пар++;
   if(cellContent(p.x,p.y).monster)рядом++;
   if(cellContent(fx,fy).monster)далеко++;}
  const p0=все[0],вдольX0=(p0.y%29===0);
  const охрана={у:patrolSafety(p0.x,p0.y),
   вдали:patrolSafety(вдольX0?p0.x+60:p0.x,вдольX0?p0.y:p0.y+60)};
  return {пар,рядом,далеко,охрана,
   долиРядом:+(рядом/Math.max(1,пар)).toFixed(3),
   долиДалеко:+(далеко/Math.max(1,пар)).toFixed(3)};});
 check('у самого разъезда мера безопасности строже, чем в шестидесяти шагах',
  !влияние.нет&&влияние.охрана.у<влияние.охрана.вдали
  &&влияние.охрана.у<=0.4&&влияние.охрана.вдали===1,влияние);
 check('и это видно по встречам: под разъездом тварей не больше, чем вдали от него',
  !влияние.нет&&влияние.пар>=10&&влияние.рядом<=влияние.далеко,влияние);

 /* ── 5. Цена: обход округи не должен подорожать ── */
 const цена=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.day=10;G.hour=12;
  contentCache.clear();
  const t0=performance.now();
  for(let x=O-60;x<O+60;x++)for(let y=O-60;y<O+60;y++)cellContent(x,y);
  const t1=performance.now();
  return {мс:Math.round(t1-t0),клеток:120*120,
   память:patrolBlockCache.size};});
 check('обход четырнадцати тысяч клеток укладывается в три секунды',
  цена.мс<3000,цена);
 check('разъезды считаются на квадрат, а не на клетку',
  цена.память>0&&цена.память<400,цена);

 /* ── 6. Встреча: разъезд говорит, что впереди ── */
 const встреча=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.day=10;G.hour=12;
  const все=patrolsNear(O,O,G.day,G.hour,900);
  if(!все.length)return {нет:true};
  const p=все[0];
  const поперёк=(p.y%29===0)?{dx:0,dy:13}:{dx:13,dy:0};
  const реплики=[],звуки=[];
  const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  G.x=p.x;G.y=p.y;G.gold=100;
  const тут=patrolHere();
  const пунктРядом=amAvailable("patrol");
  meetPatrol();
  const первая=реплики[0]||"";
  const звучало=звуки.length>0;
  /* В десятке шагов поперёк тракта разъезда нет: пункт меню обязан пропасть,
     а игра — ответить словами, а не промолчать. */
  G.x=p.x+поперёк.dx;G.y=p.y+поперёк.dy;
  const вдали=patrolHere();
  const пунктВдали=amAvailable("patrol");
  meetPatrol();
  const последняя=реплики[реплики.length-1]||"";
  Speech.say=say;Bank.play=bp;
  return {есть:!!тут,имя:тут&&тут.имя,вдалиНет:!вдали,
   пунктРядом,пунктВдали,первая,последняя,звучало,
   числа:Number.isFinite(G.gold)};});
 check('на клетке разъезда он есть и называет себя, державу и тракт',
  !встреча.нет&&встреча.есть&&/разъезд|дозор|гонец|объезд/i.test(встреча.имя||"")
  &&/держав/i.test(встреча.первая||""),
  {имя:встреча.имя,первая:(встреча.первая||"").slice(0,200)});
 check('встреча звучит живыми записями',!встреча.нет&&встреча.звучало,встреча);
 check('в десятке шагов от тракта разъезда уже нет',
  !встреча.нет&&встреча.вдалиНет,встреча);
 check('пункт «Окликнуть разъезд» есть рядом с ним и пропадает вдали',
  !встреча.нет&&встреча.пунктРядом===true&&встреча.пунктВдали===false,встреча);
 check('вдали от тракта игре есть что ответить, и кошелёк остался числом',
  !встреча.нет&&/Разъезда рядом нет/.test(встреча.последняя||"")&&встреча.числа,
  {последняя:(встреча.последняя||"").slice(0,140)});

 /* ── 7. Разъезд слышно эхо-сканом ── */
 const слышно=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.day=10;G.hour=12;
  const все=patrolsNear(O,O,G.day,G.hour,900);
  if(!все.length)return {нет:true};
  const p=все[0];
  G.x=p.x+2;G.y=p.y+(p.y%29===0?1:0);
  if(G.x===p.x&&G.y===p.y)G.x+=1;
  const около=safeFn(()=>Scape.around(),[])||[];
  return {есть:около.some(o=>o.kind==="patrol"),виды:[...new Set(около.map(o=>o.kind))]};});
 check('разъезд слышно в звуковой картине с соседних клеток',
  !слышно.нет&&слышно.есть,слышно);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
