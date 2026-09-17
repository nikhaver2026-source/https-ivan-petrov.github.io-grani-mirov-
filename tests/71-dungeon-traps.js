/* ════════════════════════════════════════════════════════════════════════
   НАБОР 71: ЛОВУШКИ ПОДЗЕМЕЛИЙ

   Подземелье было опасно только тварями: пол под ногами не значил ничего, и
   идти по нему можно было не глядя. Между тем половина страха подземелья —
   именно в полу.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Ловушки бывают только там, где им место: под землёй, на проходе, и чем
      глубже, тем гуще. Наверху, в трактире и в поле, плиты не проседают.
   2. Ловушка выводится из места: та же клетка — та же ловушка.
   3. Ненайденная срабатывает от шага — в этом вся её суть. Найденную игрок
      переступает сам.
   4. Проверка пола находит то, что рядом, и это помнится: обезвреженная
      обезврежена навсегда, и запись переживает сохранение.
   5. Снятие может сорваться, и тогда ловушка бьёт. Ремесло без риска — не
      ремесло, и это правило здесь то же, что у горна.
   6. Каждая ловушка звучит и объясняется словами.
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

 /* ── 1. Таблица полна ── */
 const таблица=await page.evaluate(()=>{
  const плохие=TRAPS.filter(t=>!t.id||!t.n||!t.о||!t.бьёт
   ||!SOUND_BANK[t.покой]||!SOUND_BANK[t.сраб]||!(t.урон>=0)).map(t=>t.id||"?");
  return {всего:TRAPS.length,плохие,
   видов:[...new Set(TRAPS.map(t=>t.вид))],
   естьЧары:TRAPS.some(t=>t.вид==="чары"),
   естьЗвон:TRAPS.some(t=>t.зов),естьЯд:TRAPS.some(t=>t.яд)};});
 check('ловушек не меньше десяти, и у каждой имя, приметы, урон и две живые записи',
  таблица.всего>=10&&таблица.плохие.length===0,таблица);
 check('они разного рода: камень, железо, верёвка, состав и чары',
  таблица.видов.length>=4&&таблица.естьЧары&&таблица.естьЗвон&&таблица.естьЯд,таблица);

 /* ── 2. Только под землёй, и чем глубже, тем гуще ── */
 const где=await page.evaluate(()=>{
  const счёт=(depth)=>{
   G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth,x:1,y:1};
   const l=curLevel();if(!l)return {нет:true};
   let пол=0,ловушек=0,неПол=0;
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
    const t=tileAt(l,x,y);
    const л=trapAt(x,y);
    if(t==="."||t==="C"){пол++;if(л)ловушек++;}
    else if(л)неПол++;}
   return {пол,ловушек,неПол,доля:ловушек/Math.max(1,пол)};};
  const мелко=счёт(1),глубоко=счёт(18);
  /* Наверху — ни одной. */
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Дом",depth:0,x:1,y:1};
  const l=curLevel();
  let наверху=0;
  for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(trapAt(x,y))наверху++;
  /* И в поле тоже. */
  G.place=null;G.x=25000;G.y=25000;
  const вПоле=!!trapAt(25000,25000);
  return {мелко,глубоко,наверху,вПоле,
   глубжеГуще:глубоко.доля>мелко.доля};});
 check('ловушки только на проходе и в сундуках, а не в стенах',
  !где.мелко.нет&&где.мелко.неПол===0&&где.глубоко.неПол===0,где);
 check('чем глубже, тем их гуще',где.глубжеГуще,
  {мелко:где.мелко.доля,глубоко:где.глубоко.доля});
 check('ни в доме наверху, ни в чистом поле ловушек нет',
  где.наверху===0&&где.вПоле===false,где);

 /* ── 3. Та же клетка — та же ловушка ── */
 const устойчиво=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:9,x:1,y:1};
  G.marks={};
  const l=curLevel();
  const снять=()=>{const o=[];
   for(let y=0;y<l.h&&o.length<12;y++)for(let x=0;x<l.w;x++){
    const л=trapAt(x,y);if(л)o.push(x+","+y+":"+л.id);}
   return o.join("|");};
  const раз=снять();
  safeFn(()=>{contentCache.clear();});
  return {совпало:раз===снять(),сколько:раз.split("|").filter(Boolean).length,раз:раз.slice(0,80)};});
 check('та же клетка помнит ту же ловушку',
  устойчиво.совпало&&устойчиво.сколько>0,устойчиво);

 /* ── 4. Ненайденная срабатывает от шага, найденную переступают ── */
 const шаг=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:9,x:1,y:1};
  G.marks={};G.hp=200;G.hpMax=200;G.inCombat=false;G.flight=null;
  const l=curLevel();
  /* Ищем ловушку, к которой можно шагнуть с соседней клетки. */
  let цель=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   const л=trapAt(x,y);if(!л||л.зов)continue;
   for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
    if(tileAt(l,x-dx,y-dy)!=="."&&tileAt(l,x-dx,y-dy)!=="C")continue;
    цель={x,y,dx,dy,id:л.id};break outer;}}
  if(!цель)return {нет:true};
  const дир={"0,-1":"N","0,1":"S","-1,0":"W","1,0":"E"}[цель.dx+","+цель.dy];
  const реплики=[],звуки=[];
  const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  /* Первый заход: ловушка не найдена — шаг её и сработает. */
  G.place.x=цель.x-цель.dx;G.place.y=цель.y-цель.dy;
  const hpДо=G.hp;
  moveInside(дир);
  const hpПосле=G.hp;
  const сработала=реплики.some(t=>/Плита|болт|шипы|камнем|дым|пламя|стужей|холодом|колокол|Жила/i.test(t));
  const метка=placeMark(цель.x,цель.y);
  /* Второй заход: ловушка найдена — её переступают. */
  G.marks={};
  setPlaceMark(цель.x,цель.y,"trap_on");
  G.place.x=цель.x-цель.dx;G.place.y=цель.y-цель.dy;G.hp=200;
  const рБыло=реплики.length;
  moveInside(дир);
  const переступил=реплики.slice(рБыло).some(t=>/переступили/i.test(t));
  Speech.say=say;Bank.play=bp;
  while(activeLayer())closeTopUI();
  return {цель,hpДо,hpПосле,сработала,метка,переступил,
   ранило:hpПосле<hpДо,звучало:звуки.length>0};});
 check('шаг по ненайденной ловушке её срабатывает, и это слышно словами',
  !шаг.нет&&шаг.сработала&&шаг.звучало,шаг);
 check('сработавшая ловушка ранит и больше не взведена',
  !шаг.нет&&шаг.ранило&&шаг.метка==="trap_off",шаг);
 check('найденную ловушку игрок переступает сам',!шаг.нет&&шаг.переступил,шаг);

 /* ── 5. Проверка пола находит то, что рядом ── */
 const поиск=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:14,x:1,y:1};
  G.marks={};G.hp=200;G.hpMax=200;G.agi=30;G.skills=["tracker","deepsense"];
  const l=curLevel();
  /* Встаём рядом с ловушкой. */
  let цель=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   if(!trapAt(x,y))continue;
   for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
    const px=x+dx,py=y+dy;
    if(tileAt(l,px,py)!==".")continue;
    цель={x,y,px,py};break outer;}}
  if(!цель)return {нет:true};
  G.place.x=цель.px;G.place.y=цель.py;
  const реплики=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{реплики.push(String(t));return say(t,o);};
  /* Ищем настойчиво: удача не с первого раза. */
  let нашли=false;
  for(let i=0;i<40&&!нашли;i++){trapProbe();нашли=placeMark(цель.x,цель.y)==="trap_on";}
  const после=trapAt(цель.x,цель.y);
  const найденная=trapFound();
  /* Пол — такой же объект дерева действий. */
  const объекты=objectsHere();
  const пол=объекты.find(o=>o.вид==="floor");
  const действия=пол?actionsFor(пол).map(a=>a.id):[];
  Speech.say=say;
  while(activeLayer())closeTopUI();
  return {нашли,состояние:после&&после.состояние,
   естьНайденная:!!найденная,
   естьПол:!!пол,действия,
   сказало:реплики.some(t=>/Найдено|ничего/i.test(t))};});
 check('проверка пола находит ловушку рядом и говорит о ней',
  !поиск.нет&&поиск.нашли&&поиск.состояние==="найдена"&&поиск.сказало,поиск);
 check('пол под ногами — такой же объект с действиями',
  !поиск.нет&&поиск.естьПол&&поиск.действия.includes("trap")
  &&поиск.действия.includes("disarm"),поиск);

 /* ── 6. Снятие может сорваться, и это тоже последствие ── */
 const снятие=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:9,x:1,y:1};
  const l=curLevel();
  let цель=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   const л=trapAt(x,y);if(л&&!л.зов){цель={x,y};break outer;}}
  if(!цель)return {нет:true};
  let снято=0,сорвано=0;
  for(let i=0;i<60;i++){
   G.marks={};setPlaceMark(цель.x,цель.y,"trap_on");
   G.hp=200;G.hpMax=200;G.agi=10;G.skills=[];G.mast={};G.artifacts=[];
   G.place.x=цель.x;G.place.y=цель.y;
   const hpДо=G.hp;
   trapDisarm(цель.x,цель.y);
   if(G.hp<hpДо)сорвано++;else снято++;}
  /* И умелому снимается чаще. */
  G.agi=40;G.skills=["tracker","deepsense"];G.mast={runes:{ур:5,оп:0,дел:0}};
  const умелому=trapSkill();
  G.agi=10;G.skills=[];G.mast={};
  const неумелому=trapSkill();
  while(activeLayer())closeTopUI();
  return {снято,сорвано,умелому,неумелому,умелееЛучше:умелому>неумелому};});
 check('снятие ловушки может сорваться, и тогда она бьёт',
  !снятие.нет&&снятие.сорвано>0&&снятие.снято>0,снятие);
 check('умелому ловушки даются лучше, чем неумелому',
  !снятие.нет&&снятие.умелееЛучше,снятие);

 /* ── 7. Обезвреженная помнится и переживает сохранение ── */
 const память=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Проба",depth:9,x:1,y:1};
  const l=curLevel();
  let цель=null;
  outer: for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)
   if(trapAt(x,y)){цель={x,y};break outer;}
  if(!цель)return {нет:true};
  G.marks={};setPlaceMark(цель.x,цель.y,"trap_off");
  const до=trapAt(цель.x,цель.y).состояние;
  const raw=serializeSave();
  G.marks={};
  const между=trapAt(цель.x,цель.y).состояние;
  Object.assign(G,JSON.parse(raw));
  const после=trapAt(цель.x,цель.y).состояние;
  return {до,между,после,
   пережила:до==="обезврежена"&&между==="не найдена"&&после==="обезврежена"};});
 check('обезвреженная ловушка помнится и переживает сохранение',
  !память.нет&&память.пережила,память);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
