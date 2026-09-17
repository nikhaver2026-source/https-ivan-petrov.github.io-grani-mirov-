/* ════════════════════════════════════════════════════════════════════════
   НАБОР 66: НАБЕГИ — ВОЙНА ДОХОДИТ ДО ДЕРЕВЕНЬ

   Война была в сводке и в цене, но не на земле. Державы воевали годами, а
   деревня на границе стояла целёхонька и торговала как ни в чём не бывало:
   «идёт война» было строкой в докладе, а не тем, что слышно.

   ЧТО ЗДЕСЬ ПРОВЕРЯЕТСЯ ПО-НАСТОЯЩЕМУ.

   1. НАБЕГ БЫВАЕТ ТАМ, ГДЕ ЕМУ МЕСТО. Только деревня, только в войну и
      прежде всего на рубеже. Если бы жгли одинаково везде, набег перестал бы
      что-либо значить: «война» снова стала бы ровным фоном.

   2. НАБЕГ ПРОХОДИТ. Четыре дня и четыре лица; на пятый день той же деревни
      в том же состоянии быть не должно.

   3. НАБЕГ МЕНЯЕТ ЗЕМЛЮ. У пепелища встреч больше — это обратная сторона
      разъезда, который встречи убавляет. Мир, который ничего не меняет, —
      декорация.

   4. ЦЕНА. Расчёт встреч идёт для всякой спрошенной клетки. Набеги считаются
      на квадрат и сперва отсеиваются одним дешёвым хешем: без этого обход
      округи подорожал бы в разы.
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

 /* ── 1. Четыре лица набега, и у каждого свои живые записи ── */
 const лица=await page.evaluate(()=>{
  const плохие=RAID_PHASE.filter(p=>!p.id||!p.n||!p.о
   ||!SOUND_BANK[p.звук]||!SOUND_BANK[p.след]).map(p=>p.id||"?");
  return {всего:RAID_PHASE.length,плохие,дней:RAID_DAYS,
   молва:!!(RUMOR_LADDER&&RUMOR_LADDER.война)};});
 check('у набега четыре лица, и у каждого две живые записи',
  лица.всего>=4&&лица.плохие.length===0&&лица.дней===4,лица);
 check('в лестнице молвы есть война',лица.молва,лица);

 /* ── 2. Набег бывает только у деревни и только в войну ── */
 const где=await page.evaluate(()=>{
  const O=25000;
  let деревень=0,набегов=0,неДеревня=0,безВойны=0;
  for(let x=O-350;x<O+350;x++)for(let y=O-350;y<O+350;y++){
   const н=raidAt(x,y,12);
   if(!н)continue;
   набегов++;
   if(settlementSeed(x,y)!=="village")неДеревня++;
   const i=empireIndexAt(x,y);
   if(!warsAt(12).some(w=>w.a===i||w.b===i))безВойны++;}
  for(let x=O-350;x<O+350;x+=3)for(let y=O-350;y<O+350;y+=3)
   if(settlementSeed(x,y)==="village")деревень++;
  return {набегов,деревень,неДеревня,безВойны,войн:warsAt(12).length};});
 check('набег бывает только у деревни',где.неДеревня===0,где);
 check('и только там, где держава воюет',где.безВойны===0,где);
 check('набеги в мире вообще случаются',где.войн===0||где.набегов>0,где);

 /* ── 3. Жгут рубеж, а не сердце земли ── */
 const рубеж=await page.evaluate(()=>{
  /* Сравниваем долю сожжённых деревень у самой границы и возле престола. */
  const день=12;
  const войны=warsAt(день);
  if(!войны.length)return {нет:true};
  const w=войны[0],a=EMPIRES[w.a],b=EMPIRES[w.b];
  const счёт=(cx,cy,R)=>{
   let дер=0,жгут=0;
   for(let x=cx-R;x<cx+R;x+=2)for(let y=cy-R;y<cy+R;y+=2){
    if(x<0||y<0||x>=WORLD||y>=WORLD)continue;
    if(settlementSeed(x,y)!=="village")continue;
    дер++;if(raidAt(x,y,день))жгут++;}
   return {дер,жгут,доля:жгут/Math.max(1,дер)};};
  const серёдка=счёт(a.cap.x,a.cap.y,120);
  const граница=счёт(Math.round((a.cap.x+b.cap.x)/2),Math.round((a.cap.y+b.cap.y)/2),120);
  return {серёдка,граница,рубежЧаще:граница.доля>серёдка.доля};});
 check('на рубеже жгут чаще, чем у престола',
  рубеж.нет||(рубеж.граница.дер>0&&рубеж.серёдка.дер>0&&рубеж.рубежЧаще),рубеж);

 /* ── 4. Набег проходит: за четыре дня лицо меняется ── */
 const время=await page.evaluate(()=>{
  const O=25000;let точка=null;
  outer: for(let x=O-350;x<O+350;x++)for(let y=O-350;y<O+350;y++)
   if(raidAt(x,y,12)){точка={x,y};break outer;}
  if(!точка)return {нет:true};
  const лица=[];
  for(let d=12;d<=19;d++){const н=raidAt(точка.x,точка.y,d);лица.push(н?н.фаза.id:"—");}
  /* И при этом в один и тот же день всё то же самое. */
  const дважды=raidAt(точка.x,точка.y,12).фаза.id===raidAt(точка.x,точка.y,12).фаза.id;
  return {точка,лица,разных:new Set(лица).size,устойчиво:дважды};});
 check('за неделю лицо набега меняется, а не стоит на месте',
  !время.нет&&время.разных>=2,время);
 check('и в один и тот же день оно всегда то же',!время.нет&&время.устойчиво,время);

 /* ── 5. ГЛАВНОЕ: у пепелища встреч больше ── */
 const влияние=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.ship=null;G.day=12;G.hour=12;
  const места=[];
  for(let x=O-500;x<O+500&&места.length<25;x++)for(let y=O-500;y<O+500&&места.length<25;y++)
   if(raidAt(x,y,G.day))места.push({x,y});
  if(места.length<5)return {нет:true,нашлось:места.length};
  let рядом=0,далеко=0,пар=0;
  for(const м of места){
   const fx=м.x+70,fy=м.y+70;
   if(fx>=WORLD||fy>=WORLD)continue;
   пар++;
   /* Клетка в двух шагах от пепелища и клетка в семидесяти. */
   if(cellContent(м.x+2,м.y).monster)рядом++;
   if(cellContent(fx,fy).monster)далеко++;}
  const опасность={у:raidDanger(места[0].x+1,места[0].y),
   вдали:raidDanger(места[0].x+70,места[0].y+70)};
  return {пар,рядом,далеко,опасность,мест:места.length};});
 check('у пепелища мера опасности выше, чем в семидесяти шагах',
  !влияние.нет&&влияние.опасность.у>влияние.опасность.вдали
  &&влияние.опасность.у>=1.5&&влияние.опасность.вдали===1,влияние);
 check('и это видно по встречам: у пепелища тварей не меньше, чем вдали',
  !влияние.нет&&влияние.пар>=5&&влияние.рядом>=влияние.далеко,влияние);

 /* ── 6. Деревня называет себя разорённой, и это слышно при приходе ── */
 const приход=await page.evaluate(()=>{
  const O=25000;let точка=null;
  outer: for(let x=O-500;x<O+500;x++)for(let y=O-500;y<O+500;y++)
   if(raidAt(x,y,12)){точка={x,y};break outer;}
  if(!точка)return {нет:true};
  G.dark=false;G.place=null;G.ship=null;G.day=12;G.hour=12;
  contentCache.clear();
  const c=cellContent(точка.x,точка.y);
  const реплики=[],звуки=[];
  const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  G.x=точка.x;G.y=точка.y;
  lastArrive=null;
  arrive("N");
  Speech.say=say;Bank.play=bp;
  return {имя:c.structure&&c.structure.name,есть:!!(c.structure&&c.structure.набег),
   вИмени:!!(c.structure&&/набег|разорена|выжжена|отстраивается/.test(c.structure.name||"")),
   сказали:реплики.filter(t=>/набег|разорена|выжжена|отстраивается|война/i.test(t)),
   звучало:звуки.some(z=>/siege|raven|craft_wood|fire|wind/.test(z)),
   молва:(G.rumors||[]).some(r=>r.в==="война")};});
 check('разорённая деревня называет себя в самом имени',
  !приход.нет&&приход.есть&&приход.вИмени,приход);
 check('приход к ней слышен вслух и живой записью',
  !приход.нет&&приход.сказали.length>0&&приход.звучало,
  {сказали:(приход.сказали||[]).slice(0,2),звучало:приход.звучало});
 check('о набеге заводится молва, и дальше она идёт без игрока',
  !приход.нет&&приход.молва,приход);

 /* ── 7. Цена: обход округи не должен подорожать ── */
 const цена=await page.evaluate(()=>{
  const O=25000;
  G.dark=false;G.place=null;G.day=12;G.hour=12;
  contentCache.clear();raidBlockCache.clear();
  const t0=performance.now();
  for(let x=O-60;x<O+60;x++)for(let y=O-60;y<O+60;y++)cellContent(x,y);
  const t1=performance.now();
  return {мс:Math.round(t1-t0),клеток:120*120,память:raidBlockCache.size};});
 check('обход четырнадцати тысяч клеток укладывается в три секунды',
  цена.мс<3000,цена);
 /* Смысл проверки — «на квадрат, а не на клетку», то есть выборок должно быть
    во много раз меньше, чем клеток. Точное число зависит от размера квадрата,
    и его пришлось уменьшить: набор 58 показал, что при разбросанных клетках
    дорога цена ПРОМАХА, а не попадания. Поэтому здесь стоит отношение, а не
    магическое число. */
 check('набеги считаются на квадрат, а не на клетку',
  цена.память>0&&цена.память<цена.клеток/20,цена);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
