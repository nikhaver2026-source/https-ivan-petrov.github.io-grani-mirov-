/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 99: У СОБЫТИЯ СВОЙ ЗВУК, И КАЖДЫЙ РАЗ ДРУГОЙ

   Значимое событие звучит связкой живых записей (музыки в событиях больше
   нет), у каждого события пул вариантов по ярусам значимости, и один и тот
   же вариант не идёт подряд.

   1. Пулы собраны: у каждого события не меньше трёх вариантов, все записи
      есть в банке, ярусы покрывают требуемые наборы.
   2. Выбор не повторяется подряд, обходит все варианты яруса и помнится
      между запусками; ярус выбирает только своё.
   3. Новый уровень: обычный, каждый пятый — редкий, каждый десятый —
      эпический; рост уровня и вправду зовёт пул.
   4. Дела: ярус сдачи по кругу дела, цепочка — цепочкой, тёмное — тайным.
   5. Рядовая победа — без звука события; победа над много сильнейшим — с ним.
   6. Новая держава и новый род места звучат один раз; награда — по рангу
      вещи, обычная — звуком вещи.
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

 /* ── 1. Пулы ── */
 const пулы=await page.evaluate(()=>{
  const out={мало:[],нет:[],ярусы:{}};
  for(const id of Object.keys(EVENT_POOL)){
   const p=EVENT_POOL[id];
   if(p.length<3)out.мало.push(id+":"+p.length);
   p.forEach(v=>{if(!Bank.has(v.роль))out.нет.push(id+"→"+v.роль);(v.следом||[]).forEach(([r])=>{if(!Bank.has(r))out.нет.push(id+"→"+r);});});
   out.ярусы[id]=[...new Set(p.map(v=>v.ярус).filter(Boolean))];}
  const надо={levelup:["normal","rare","epic"],quest_done:["normal","success","hard","chain","chapter","unexpected"],
   quest_take:["normal","important","chain","story","secret","epic"],achieve:["normal","rare","epic","hidden","story"],
   reward:["common","valuable","rare","unique","legendary","artifact","story"]};
  out.нехватка=[];
  for(const id in надо)надо[id].forEach(t=>{if(!(out.ярусы[id]||[]).includes(t))out.нехватка.push(id+":"+t);});
  out.событий=Object.keys(EVENT_POOL).length;
  out.обычныхУровня=EVENT_POOL.levelup.filter(v=>v.ярус==="normal").length;
  return out;});
 check('пулов звука событий не меньше двенадцати',пулы.событий>=12,пулы.событий);
 check('у каждого события не меньше трёх вариантов',!пулы.мало.length,пулы.мало);
 check('каждая запись пула есть в банке',!пулы.нет.length,пулы.нет.slice(0,8));
 check('ярусы покрывают: уровень, сдача, взятие, достижение, награда',!пулы.нехватка.length,пулы.нехватка);
 check('у обычного уровня не меньше пяти вариантов: героический, целительный, магический, спокойный, храмовый',пулы.обычныхУровня>=5,пулы.обычныхУровня);

 /* ── 2. Выбор без повторов ── */
 const выбор=await page.evaluate(()=>{
  EventPick.reset();
  const ряд=[];for(let i=0;i<30;i++){eventTheme("levelup",{tier:"normal",gain:0});ряд.push(EventPick.last.i);}
  const подряд=ряд.some((v,i)=>i>0&&v===ряд[i-1]);
  const обычные=new Set(EVENT_POOL.levelup.map((v,i)=>v.ярус==="normal"?i:-1).filter(i=>i>=0));
  const всеОбычные=[...обычные].every(i=>ряд.includes(i));
  const толькоОбычные=ряд.every(i=>обычные.has(i));
  const эпик=[];for(let i=0;i<6;i++){eventTheme("levelup",{tier:"epic",gain:0});эпик.push(EVENT_POOL.levelup[EventPick.last.i].ярус);}
  const чужой=eventTheme("levelup",{tier:"нет-такого",gain:0});
  let сырое={};try{сырое=JSON.parse(store.get("gm29jh")||"{}");}catch(_){}
  const награда=[];for(let i=0;i<8;i++){eventTheme("reward",{tier:"rare",gain:0});награда.push(EventPick.last.i);}
  const rareIdx=EVENT_POOL.reward.map((v,i)=>v.ярус==="rare"?i:-1).filter(i=>i>=0);
  return {ряд,подряд,всеОбычные,толькоОбычные,эпик,чужой,помнит:Array.isArray(сырое.levelup)&&сырое.levelup.length>0,
   награда,двеРедкие:rareIdx.length===2&&!награда.some((v,i)=>i>0&&v===награда[i-1])};});
 check('тридцать уровней подряд — ни одного повтора варианта',!выбор.подряд,выбор.ряд.slice(0,12));
 check('обычный ярус обходит все свои темы и не берёт чужие',выбор.всеОбычные&&выбор.толькоОбычные);
 check('эпический ярус даёт только эпическую тему',выбор.эпик.every(t=>t==="epic"),выбор.эпик);
 check('неизвестный ярус не молчит, а берёт из всего пула',выбор.чужой===true);
 check('память выбора лежит в сохранённых настройках',выбор.помнит);
 check('две редкие награды чередуются',выбор.двеРедкие,выбор.награда);

 /* ── 3. Уровень ── */
 const уровень=await page.evaluate(()=>{
  const ярусы=[1,4,5,7,10,15,20].map(l=>l+":"+levelTier(l));
  const роли=[];const o=Bank.play;Bank.play=function(r,opts){роли.push([r,(opts&&opts.kind)||"fx"]);return o.call(this,r,Object.assign({},opts||{},{gain:0,maxSec:0.3}));};
  const было=G.level;G.level=9;G.xp=xpNeed(9)+1;EventPick.last=null;
  checkLevelUp();
  Bank.play=o;
  const муз=роли.filter(x=>x[1]==="event").map(x=>x[0]);
  const first=EventPick.last&&EVENT_POOL.levelup[EventPick.last.i];
  return {ярусы,стало:G.level,событие:EventPick.last&&EventPick.last.id,ярус:EventPick.last&&EventPick.last.tier,муз,первый:first&&first.роль};});
 check('ярус уровня: пятый и пятнадцатый — редкий, десятый и двадцатый — эпический, прочие — обычный',
  uровняOk(уровень.ярусы),уровень.ярусы);
 function uровняOk(a){return a.join()==="1:normal,4:normal,5:rare,7:normal,10:epic,15:rare,20:epic";}
 check('рост до десятого уровня зовёт эпический вариант пула каналом событий',
  уровень.стало===10&&уровень.событие==="levelup"&&уровень.ярус==="epic"&&уровень.муз.includes(уровень.первый),уровень);

 /* ── 4. Дела ── */
 const дела=await page.evaluate(()=>{
  const мир=G.quests.find(q=>questTier(q).id==="world")||null;
  return {цепь:questDoneTier({chain:"x"}),тьма:questTakeTier({тьма:true,деяние:"x"}),
   точечное:questDoneTier({type:"fetch",need:1}),взятьЦепь:questTakeTier({chain:"x"}),
   миров:мир?questDoneTier(мир):"chapter"};});
 check('сдача: цепочка — цепочкой, точечное — обычной, мировое — главой',
  дела.цепь==="chain"&&дела.точечное==="normal"&&дела.миров==="chapter",дела);
 check('взятие: тёмное дело — тайным, цепочка — цепочкой',дела.тьма==="secret"&&дела.взятьЦепь==="chain",дела);

 /* Отложенные голоса прежних тем догорают, чтобы не попасть в чужой счёт. */
 await page.waitForTimeout(2600);
 /* ── 5. Победы ── */
 const победы=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  /* Звук события узнаётся по каналу событий: строй и клич звучат в мире и
     сами по себе, поэтому смотрим не на имя записи, а на то, что её позвал пул. */
  const бой=async(lvl)=>{
   while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;
   const m=Object.assign({},MONSTERS.find(x=>!x.fly)||MONSTERS[0],{lvl,hp:5,xp:10});
   const роли=[];const o=Bank.play;Bank.play=function(r,opts){роли.push([r,(opts&&opts.kind)||"fx"]);return o.call(this,r,Object.assign({},opts||{},{gain:0,maxSec:0.3}));};
   EventPick.last=null;
   startCombat({x:G.x,y:G.y,monster:m});
   G.combat.hp=0;victory();
   await пауза(700);
   Bank.play=o;
   const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;G.loot=null;
   return {музыки:роли.filter(x=>x[1]==="event").map(x=>x[0]),событие:EventPick.last&&EventPick.last.id};};
  const обычная=await бой(Math.max(1,G.level-1));
  const великая=await бой(G.level+6);
  return {обычная,великая};});
 check('рядовая победа обходится без звука события: только сам бой',победы.обычная.музыки.length===0&&победы.обычная.событие!=="victory_great",победы.обычная);
 check('победа над много сильнейшим зовёт звук великой победы из пула',победы.великая.событие==="victory_great"&&победы.великая.музыки.length>0,победы.великая);

 /* ── 6. Земли, места, награды ── */
 const земли=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  G.seenEmp={};G.seenKinds={};EventPick.last=null;
  const первая=regionDiscovered("Проверочная держава"),вторая=regionDiscovered("Проверочная держава");
  await пауза(1100);
  const земля=EventPick.last&&EventPick.last.id;
  EventPick.last=null;
  const храм=placeDiscovered("temple","house"),храм2=placeDiscovered("temple","house"),дом=placeDiscovered("house","house");
  await пауза(1400);
  const место=EventPick.last&&{id:EventPick.last.id,tier:EventPick.last.tier};
  const ранги=[0,1,2,3,4,5].map(r=>rewardTierOf({rank:r}));
  EventPick.last=null;G.loot=[{type:"gold",amount:3},{type:"gear",item:{name:"Проверочный клинок",rank:3,qual:2,val:1,slot:"weapon"}}];
  takeLoot();await пауза(600);
  const добыча=EventPick.last&&{id:EventPick.last.id,tier:EventPick.last.tier};
  EventPick.last=null;G.loot=[{type:"gear",item:{name:"Простой нож",rank:0,qual:1,val:1,slot:"weapon"}}];
  const роли=[];const o=Bank.play;Bank.play=function(r,opts){роли.push(r);return o.call(this,r,Object.assign({},opts||{},{gain:0,maxSec:0.3}));};
  takeLoot();await пауза(600);Bank.play=o;
  const обычная=EventPick.last&&{id:EventPick.last.id,tier:EventPick.last.tier};
  return {первая,вторая,земля,храм,храм2,дом,место,ранги,добыча,обычная,обычныеРоли:роли.slice(0,6)};});
 check('новая держава звучит один раз: второй вход молчит',земли.первая===true&&земли.вторая===false&&земли.земля==="region_new",земли);
 check('новый род места звучит своим ярусом один раз, а дом — не событие',земли.храм===true&&земли.храм2===false&&земли.дом===false&&земли.место&&земли.место.id==="place_new"&&земли.место.tier==="temple",земли.место);
 check('ярус награды по рангу: обычный, ценный, редкий, единственный, легендарный',земли.ранги.join()==="common,valuable,rare,unique,legendary,legendary",земли.ранги);
 check('эпическая вещь в добыче зовёт единственную награду',земли.добыча&&земли.добыча.id==="reward"&&земли.добыча.tier==="unique",земли.добыча);
 check('обычная вещь звучит вещью: ярус common, без музыкального первого голоса',земли.обычная&&земли.обычная.tier==="common"&&земли.обычныеРоли.includes("arte_find"),{обычная:земли.обычная,роли:земли.обычныеРоли});

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const passed=results.filter(r=>r.startsWith('PASS')).length;
 console.log(`ИТОГО: ${passed} из ${results.length}`);
 process.exit(passed===results.length?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
