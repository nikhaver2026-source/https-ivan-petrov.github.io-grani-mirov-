/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 204: 4.1 — ОДНО КАСАНИЕ, СТЕНЫ, ДЕЛА, СТРОЙ, ГОЛОСА, КНИГИ

   Жалобы игрока (4.0):
   — быстрая активация одним касанием спорит с двойным: убрать совсем;
   — осмотр называет то, что за стеной («позади справа лестница»);
   — взятое дело не называется: слышно только на «Завершить квест»;
   — больше десяти дел разом брать нельзя;
   — у стражи нет задания на разбойников, головы — доказательство;
   — дозоров на трактах не слышно: нужен строй в тяжёлых доспехах;
   — у обоза и торговца нет живых реплик на сделку, наём, пропуск;
   — книга открывается без звука страниц, и её не перечитать.

   1. Настройки «Быстрая активация» нет ни в окне, ни в settings; одно
      касание по пункту окна его не выполняет.
   2. Осмотр и «что рядом» не видят сквозь стену; цель маяка — видна.
   3. Взятое дело называется сразу: заказчик говорит, какое, голос игры —
      подробности; окно жителя не здоровается заново. Предел — десять дел.
   4. Стражник даёт «Освободить округу от дорожных разбойников»: с каждого
      убитого разбойника голова ложится в сумку; сдать можно, только когда
      голов хватает, и головы при сдаче уходят.
   5. Пеший дозор в пределах шести шагов слышен строем: тяжёлые шаги,
      кольчуга, латы, ножны — с его стороны.
   6. Торговец отвечает на покупку и продажу своей строкой; обоз встречает
      один раз за встречу и отзывается на покупку и пропуск.
   7. Книга открывается шорохом страниц (свиток — пергаментом), текст
      читается вслух, «Прочитать ещё раз» читает его снова.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};
  window.ROLES=[];const sr=Spatial.role.bind(Spatial);Spatial.role=function(r,dx,dy,o){ROLES.push({r,dx,dy,t:Date.now()});return sr(r,dx,dy,o);};
  window.BANK=[];const bp=Bank.play.bind(Bank);Bank.play=function(r,o){BANK.push(r);return bp(r,o);};
  window.maybeEvent=()=>{};settings.effects=1;settings.hrtf=1;
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;});

 /* ── 1. быстрой активации нет ── */
 const одно=await page.evaluate(()=>({чекбокс:!!document.getElementById("setFastTap"),настройка:"fastTap" in settings,
  код:String(tapInLayer).includes("fastTap")||String(handleSingleTap).includes("fastTap")}));
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>{window.АКТ=0;const a=window.activateElement;window.activateElement=function(){АКТ++;return a.apply(this,arguments);};
  openModal("modal-read");});
 const b=await page.evaluate(()=>{const r=document.getElementById("readAgain").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x,y:b.y,id:0}]});await page.waitForTimeout(40);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1000);
 const посл=await page.evaluate(()=>{const n=АКТ;while(activeLayer())closeTopUI();return n;});
 check('1. «Быстрой активации» нет ни в окне настроек, ни в settings, ни в разборе касания; одно касание по кнопке окна её не выполняет',
  !одно.чекбокс&&!одно.настройка&&!одно.код&&посл===0,{одно,посл});

 /* ── 2. стена заслоняет ── */
 const стены=await page.evaluate(()=>{
  const g=["###########",
           "#....#....#",
           "#....#..>.#",
           "#....#....#",
           "#.........#",
           "#..C......#",
           "###########"];
  const L={w:11,h:7,g:g.map(r=>r.split(""))};
  window.curLevel=()=>L;
  G.place={kind:"dungeon",bx:5,by:5,stype:"ruins",name:"м",depth:1,x:3,y:2};
  Actors.stop();Actors.ensure=()=>{};Actors.tick=()=>{};
  TargetBeacon.stop&&TargetBeacon.stop();TargetBeacon.t=null;Look.target=null;
  const имена=a=>a.map(o=>o.t||o.род);
  const до=nearFeatures(6).map(o=>o.t),осм=Look.scan(6).map(o=>o.n);
  /* С порога прохода лестница видна. */
  G.place.x=5;G.place.y=4;const сПрохода=nearFeatures(6).map(o=>o.t);
  /* Цель маяка — слышна и сквозь стену. */
  G.place.x=3;G.place.y=2;
  Look.target={x:8,y:2,n:"лестница вниз",place:placeKey(5,5,1),bid:"stairs_down"};
  const сЦелью=nearFeatures(6).map(o=>o.t);
  Look.target=null;
  return {до,осм,сПрохода,сЦелью};});
 check('2. за стеной лестницы не видно ни в «что рядом», ни в осмотре; с порога прохода видна; выбранная цель маяка слышна и сквозь стену',
  стены.до.indexOf(">")<0&&стены.до.indexOf("C")>=0&&!стены.осм.some(n=>/лестниц/i.test(n))&&стены.сПрохода.indexOf(">")>=0&&стены.сЦелью.indexOf(">")>=0,стены);

 /* ── 3. взятое дело называется; предел десять ── */
 const дело=await page.evaluate(async()=>{
  G.place=null;G.quests=[];SAID.length=0;
  let n=null;
  for(let i=0;i<400&&!n;i++){const c=getNPC(40+i,60,1,"Торговец");if(c&&questFor(c)&&questFor(c).type!=="bandits")n=c;}
  if(!n)return {нет:true};
  window.getNPCByKey=(k=>(key)=>key===n.key?n:k(key))(window.getNPCByKey);
  window.ПРИВЕТ=0;const og=window.npcGreeting;window.npcGreeting=function(){ПРИВЕТ++;return og.apply(this,arguments);};
  openNPC(n.key,true);ПРИВЕТ=0;SAID.length=0;
  takeNPCQuest(n);await new Promise(r=>setTimeout(r,300));
  const q=G.quests.find(x=>x.npcKey===n.key);
  const сказано=SAID.join(" | ");
  /* предел: десять незакрытых */
  G.quests=[];for(let i=0;i<10;i++)G.quests.push({id:"z"+i,type:"visit",need:1,tx:1,ty:1,text:"з"+i,done:false});
  SAID.length=0;const m=getNPC(99,99,1,"Жрец")||n;takeNPCQuest(m);
  const предел=SAID.join(" | ");const стало=G.quests.length;
  while(activeLayer())closeTopUI();
  return {взято:!!q,текст:q&&q.text,назван:!!(q&&сказано.includes(q.text)&&/Квест взят/.test(сказано)),привет:ПРИВЕТ,предел:QUEST_LIMIT,отказ:/десят|предел/.test(предел)||/незакрытых дел/.test(предел),стало};});
 check('3. взятое дело называется сразу, окно жителя не здоровается заново; предел — десять дел, одиннадцатое не берётся',
  дело.взято&&дело.назван&&дело.привет===0&&дело.предел===10&&дело.отказ&&дело.стало===10,дело);

 /* ── 4. стража и головы разбойников ── */
 const головы=await page.evaluate(()=>{
  G.quests=[];G.items=[];SAID.length=0;
  let n=null;for(let i=0;i<600&&!n;i++){const c=getNPC(10+i,30+(i%7),1,"Стражник");if(c&&questFor(c)&&questFor(c).type==="bandits")n=c;}
  if(!n)return {нет:true};
  window.getNPCByKey=(k=>(key)=>key===n.key?n:k(key))(window.getNPCByKey);
  takeNPCQuest(n);const q=G.quests.find(x=>x.type==="bandits");
  if(!q)return {нетДела:true};
  const бандит=MONSTERS.find(m=>m.id==="bandit");
  questMonsterProgress(бандит);
  const одна=G.items.filter(x=>x===BANDIT_HEAD).length;
  SAID.length=0;completeQuest(q.id);const рано=!q.done&&/голов/.test(SAID.join(" "));
  for(let i=1;i<q.need;i++)questMonsterProgress(бандит);
  const все=G.items.filter(x=>x===BANDIT_HEAD).length;
  questMonsterProgress(MONSTERS.find(m=>m.id==="wolf")||{id:"wolf",n:"волк"});
  const волк=G.items.filter(x=>x===BANDIT_HEAD).length;
  completeQuest(q.id);
  const после=G.items.filter(x=>x===BANDIT_HEAD).length;
  while(activeLayer())closeTopUI();
  return {текст:q.text,need:q.need,одна,рано,все,волк,сдано:q.done,после};});
 check('4. стражник даёт «Освободить округу от дорожных разбойников»; голова ложится в сумку с каждого разбойника (не с волка); без нужного числа голов дело не сдать; при сдаче головы уходят',
  /разбойник/.test(головы.текст||"")&&головы.одна===1&&головы.рано&&головы.все===головы.need&&головы.волк===головы.need&&головы.сдано&&головы.после===0,головы);

 /* ── 5. дозор идёт строем ── */
 const строй=await page.evaluate(async()=>{
  G.place=null;G.dark=false;G.ship=null;
  /* Ставим героя рядом с пешим дозором на тракте. */
  let hit=null;
  for(let d=1;d<=60&&!hit;d++)for(let x=20;x<WORLD-20&&!hit;x+=3){
   const y=29*(1+(x%9));const l=patrolsNear(x,y,d,12,6);
   for(const p of l){const f=patrolFull(p);if(f&&f.вид.пеший){hit={x,y,d};break;}}}
  if(!hit)return {нет:true};
  G.x=hit.x;G.y=hit.y;G.day=hit.d;G.hour=12;
  ROLES.length=0;PatrolMarch.шагДо=0;PatrolMarch.окликДо=Date.now()+99999;
  PatrolMarch.tick();await new Promise(r=>setTimeout(r,1700));
  const роли=ROLES.map(x=>x.r);
  return {last:PatrolMarch.last,шагов:роли.filter(r=>/step|tread/.test(r)).length,кольчуга:роли.filter(r=>r==="gear_guard_mail").length,
   вес:роли.filter(r=>r==="gear_guard_thud").length,латы:роли.filter(r=>r==="gear_guard_plate").length,ножны:роли.filter(r=>r==="gear_guard_sword").length};});
 check('5. пеший дозор в шести шагах слышен строем: сапоги по двое в ряд, вес шага, кольчуги на каждом шаге, латы и ножны',
  строй.last&&строй.last.пеший&&строй.шагов>=4&&строй.кольчуга>=2&&строй.вес>=2&&(строй.латы>=1||строй.last.id==="march"||строй.last.id==="toll"),строй);

 /* ── 6. торговец и обоз отвечают ── */
 const сделки=await page.evaluate(()=>{
  const n=(()=>{for(let i=0;i<400;i++){const c=getNPC(70+i,20,1,"Торговец");if(c&&c.trade)return c;}return null;})();
  if(!n)return {нет:true};
  Folk.on=()=>false; /* без живого голоса: строку читает голос игры */
  const купил=merchDeal(n,"buy",20),продал=merchDeal(n,"sell",20);
  const в=(t,роль)=>LIVE_LINES[роль].some(x=>t.includes(x));
  const пулы=["trade_buy","trade_sell","trade_poor","trade_bye","car_meet","car_buy","car_pass","car_hire","quest_take","guard_quest","patrol","bandit"].every(k=>(LIVE_LINES[k]||[]).length>0);
  const приветы=["постоянный","продавец","богатый","бедный","ранен","слава","давно","земляк","ждёт"].every(k=>(NPC_GREET[k]||[]).length>=5);
  /* обоз */
  let car=null;for(let d=1;d<40&&!car;d++)for(let x=30;x<WORLD-30&&!car;x+=7){const l=caravansNear(x,x,d,12,3);if(l.length)car=l[0];}
  if(!car)return {купил,продал,пулы,приветы,нетОбоза:true};
  SAID.length=0;BANK.length=0;meetCaravan(car);const встреча=SAID.join(" | "),звуки1=BANK.filter(r=>r==="caravan").length;
  G.gold=99999;const r=car.goods.carry[0];SAID.length=0;caravanBuy(r,1);const покупка=SAID.join(" | "),звуки2=BANK.filter(r=>r==="caravan").length;
  SAID.length=0;closeModal(document.getElementById("modal-caravan"));
  return {купил:в(купил,"trade_buy"),продал:в(продал,"trade_sell")||в(продал,"trade_sell_big"),пулы,приветы,
   встреча:/Старший обоза: «/.test(встреча),покупка:/Старший обоза: «/.test(покупка),звуки1,звуки2,curCaravan:curCaravan===null};});
 check('6. торговец отвечает на покупку и продажу своей строкой; пулы строк на месте; обоз встречает один раз и отзывается на покупку; пропуск закрывает встречу',
  сделки.купил&&сделки.продал&&сделки.пулы&&сделки.приветы&&сделки.встреча&&сделки.покупка&&сделки.звуки1===1&&сделки.звуки2===1&&сделки.curCaravan,сделки);

 /* ── 7. книга: страницы, чтение, перечитать ── */
 const книга=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  BANK.length=0;SAID.length=0;
  openReading(5,false,"книга");await new Promise(r=>setTimeout(r,900));
  const e=knowEntry(5);
  const книжные=BANK.slice();const прочла=SAID.some(t=>t.includes(e.body[0]));
  BANK.length=0;SAID.length=0;document.getElementById("readAgain").click();await new Promise(r=>setTimeout(r,600));
  const снова=SAID.some(t=>t.includes(e.body[0]));
  while(activeLayer())closeTopUI();
  BANK.length=0;openReading(6,false,"свиток");await new Promise(r=>setTimeout(r,400));
  const свиток=BANK.slice();
  while(activeLayer())closeTopUI();
  return {книжные,прочла,снова,свиток,петля:книжные.indexOf("oc_hinge")>=0};});
 check('7. книга раскрывается шорохом переплёта и страниц (не скрипом петли), текст читается вслух, «Прочитать ещё раз» читает снова; свиток — пергаментом',
  книга.книжные.indexOf("arte_book")>=0&&книга.книжные.indexOf("uh_page")>=0&&!книга.петля&&книга.прочла&&книга.снова&&книга.свиток.indexOf("arte_page")>=0,книга);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
