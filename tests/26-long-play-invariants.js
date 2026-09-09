const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 /* Долгая случайная игра: три тысячи действий подряд — ходьба, вход в места,
    спуск, бой, торг, задания, сбор, крафт, молитвы, сохранение. После каждого
    действия проверяются законы мира: здоровье в своих пределах, золото не
    уходит в минус, час в сутках, ничего не превращается в «не число», в
    списке нет двух живых заданий с одним номером, запасы не отрицательны.
    Такая проверка ловит то, чего не видно в отдельных наборах: последствия
    сочетаний, которые вручную не соберёшь. */
 const play=await page.evaluate(async()=>{
  const bad=[];const seen={};
  const num=v=>typeof v==="number"&&isFinite(v);
  const law=(step,act)=>{
   if(!num(G.hp)||G.hp<0||G.hp>G.hpMax)bad.push({step,act,закон:"здоровье",v:[G.hp,G.hpMax]});
   if(!num(G.mana)||G.mana<0||G.mana>G.manaMax)bad.push({step,act,закон:"мана",v:[G.mana,G.manaMax]});
   if(!num(G.gold)||G.gold<0)bad.push({step,act,закон:"золото",v:G.gold});
   if(!num(G.hour)||G.hour<0||G.hour>=24)bad.push({step,act,закон:"час",v:G.hour});
   if(!num(G.day)||G.day<1)bad.push({step,act,закон:"день",v:G.day});
   if(!num(G.xp)||G.xp<0)bad.push({step,act,закон:"опыт",v:G.xp});
   if(!num(G.level)||G.level<1)bad.push({step,act,закон:"уровень",v:G.level});
   if(!num(G.water)||G.water<0)bad.push({step,act,закон:"вода",v:G.water});
   for(const k in G.inv){const v=G.inv[k];
    if(!num(v)||v<0)bad.push({step,act,закон:"запас "+k,v});}
   const live=(G.quests||[]).filter(q=>!q.done).map(q=>q.id);
   const dup=live.filter((x,i)=>live.indexOf(x)!==i);
   if(dup.length)bad.push({step,act,закон:"два живых задания с одним номером",v:dup[0]});
   if(openQuests().length>QUEST_LIMIT)bad.push({step,act,закон:"незакрытых дел больше предела",v:openQuests().length});
   if((G.quests||[]).length>400)bad.push({step,act,закон:"список заданий растёт без предела",v:G.quests.length});
   if(G.place&&!curLevel())bad.push({step,act,закон:"игрок внутри места без уровня"});
   if(G.ship&&G.place)bad.push({step,act,закон:"одновременно на корабле и в здании"});
   if(G.ship){
    if(!num(G.ship.left)||G.ship.left<0)bad.push({step,act,закон:"переходы до порта",v:G.ship.left});
    if(!num(G.ship.hold)||G.ship.hold<=0)bad.push({step,act,закон:"трюм",v:G.ship.hold});
    if(cargoUnits()>shipHold())bad.push({step,act,закон:"груза больше, чем берёт трюм",v:[cargoUnits(),shipHold()]});}
   if(G.equip){
    for(const slot of ["weapon","armor","acc"]){
     const it=G.equip[slot];
     if(it&&(typeof it!=="object"||it.slot!==slot||!num(Number(it.val))))
      bad.push({step,act,закон:"испорченное снаряжение в слоте "+slot,v:it&&it.name});}}
   if(!Array.isArray(G.gear))bad.push({step,act,закон:"снаряжение перестало быть списком"});
   if(!Array.isArray(G.artifacts))bad.push({step,act,закон:"артефакты перестали быть списком"});
  };
  const acts=[
   ["шаг",()=>move(["N","E","S","W"][Math.floor(Math.random()*4)])],
   ["шаг",()=>move(["N","E","S","W"][Math.floor(Math.random()*4)])],
   ["шаг внутри",()=>{if(G.place)moveInside(["N","E","S","W"][Math.floor(Math.random()*4)]);}],
   ["действие здесь",()=>useHere()],
   ["осмотреться",()=>look()],
   ["взаимодействие",()=>{if(!G.place)interactHere();}],
   ["сбор",()=>gatherCurrent()],
   ["бой: удар",()=>{if(G.inCombat)fight("atk");}],
   ["бой: побег",()=>{if(G.inCombat)fight("flee");}],
   ["сохранение",()=>saveGame(true)],
   ["сложность",()=>setDifficulty(["calm","normal","harsh"][Math.floor(Math.random()*3)])],
   ["крафт",()=>{
    /* Материалы кладём через ту же дверь, что и игра: с оглядкой на трюм. */
    ["камень","дерево","трава","ягоды"].forEach(r=>evGive(r,2));
    CMD.craftdo(Math.floor(Math.random()*5));}],
   ["торг: взять квест",()=>{const n=getNPC(G.x,G.y,0,null);takeNPCQuest(n);}],
   ["торг: сдать квест",()=>{const q=(G.quests||[]).find(x=>!x.done);if(q)completeQuest(q.id);}],
   ["покупка",()=>{const n=getNPC(G.x,G.y,0,"Торговец");G.gold+=200;buyItem(n.key,0);}],
   ["продажа",()=>{const n=getNPC(G.x,G.y,0,"Торговец");
    /* Руду для продажи кладём через ту же дверь, что и игра: прямая запись в
       запасы обходила трюм и сама же нарушала закон, который проверяется
       ниже. На корабле продавать всё равно некому — торговец стоит в доме. */
    evGive("руда",3);
    sellResource(n.key,"руда",Math.random()<0.5);}],
   ["отказ от дела",()=>{const q=openQuests()[0];if(q&&Math.random()<0.5)dropQuest(q.id);}],
   ["молитва",()=>prayToGod(PANTHEON[Math.floor(Math.random()*PANTHEON.length)].id)],
   ["событие",()=>{G.lastEventAt=0;maybeEvent("step");
    if(curEvent)resolveEvent(Math.floor(Math.random()*curEvent.choices.length));}],
   ["живые",()=>{if(G.place){Actors.ensure();Actors.tick();}}],
   ["в море",()=>{
    if(G.ship){sailLeg();return;}
    /* садимся на первый попавшийся рейс из ближнего порта */
    const port=findCities(G.x,G.y,40,6).find(c=>c.type==="port");
    if(!port)return;
    G.place=null;G.x=port.x;G.y=port.y;
    openHarbor();
    const list=G.harborShips||[];
    if(list.length){G.gold+=list[0].fare+50;boardShip(0);}
    while(activeLayer())closeTopUI();}],
   ["рыбалка",()=>{
    if(!G.items.includes("Удочка"))G.items.push("Удочка");
    startFishing();
    if(G.fishing){G.fishing.bite=true;G.fishing.fish=FISH[0];hookFish&&hookFish();}}],
   ["заклинание",()=>{G.mana=G.manaMax;castSpell(Math.floor(Math.random()*(SPELLS.length||1)));}],
   ["снаряжение",()=>{const list=weaponList();if(list.length)equipWeaponIndex(Math.floor(Math.random()*list.length));}],
   ["груз",()=>{
    const port=findCities(G.x,G.y,40,6).find(c=>c.type==="port");
    if(!port)return;
    G.place=null;G.x=port.x;G.y=port.y;G.gold+=500;
    buyLot(["руда","камень","дерево"][Math.floor(Math.random()*3)],[1,5,10][Math.floor(Math.random()*3)]);
    while(activeLayer())closeTopUI();}],
   ["план города",()=>{if(G.place&&G.place.kind==="city")cityPlan();}],
   ["сохранение в слот",()=>{saveToSlot(1+Math.floor(Math.random()*3));while(activeLayer())closeTopUI();}],
  ];
  /* Игрок то и дело заходит куда-нибудь и выходит обратно. */
  const wander=i=>{
   if(i%150===0){
    G.place=null;G.ship=null;
    const st=["castle","village","port","tavern","ruins","cave_entrance","tower","clanhall","temple"][Math.floor(Math.random()*9)];
    enterPlace({x:400+i,y:600+((i*7)%900),structure:{type:st,name:"Место "+i,beacon:"village"}});}
   if(i%370===0&&G.place)changeDepth(1);
   if(i%450===0&&G.place)leavePlace();
  };
  const orig=Speech.say;Speech.say=()=>{};
  const T0=Date.now();
  for(let i=0;i<3000&&bad.length<12;i++){
   wander(i);
   const [name,fn]=acts[Math.floor(Math.random()*acts.length)];
   seen[name]=(seen[name]||0)+1;
   try{fn();}catch(e){bad.push({step:i,act:name,закон:"исключение",v:String(e.message||e)});}
   /* Окна закрываем, как это делает игрок. */
   let guard=0;while(activeLayer()&&guard++<5)closeTopUI();
   law(i,name);
  }
  Speech.say=orig;
  while(activeLayer())closeTopUI();
  return {шагов:3000,секунд:Math.round((Date.now()-T0)/1000),нарушений:bad.length,
   примеры:bad.slice(0,6),действия:seen,
   итог:{золото:G.gold,день:G.day,уровень:G.level,заданий:(G.quests||[]).length,
    незакрытых:openQuests().length,
    следов:Object.keys(G.marks||{}).length}};});
 check('три тысячи случайных действий не нарушают ни одного закона мира',
  play.нарушений===0,{нарушений:play.нарушений,примеры:play.примеры});
 check('за долгую игру мир остаётся осмысленным',
  play.итог.день>=1&&play.итог.уровень>=1&&play.итог.незакрытых<=8,play.итог);
 check('все виды действий действительно случились',
  Object.keys(play.действия).length>=15,{видов:Object.keys(play.действия).length,секунд:play.секунд});

 /* Сохранение после долгой игры должно и записаться, и прочитаться обратно. */
 const save=await page.evaluate(()=>{
  const before={gold:G.gold,day:G.day,level:G.level,x:G.x,y:G.y,quests:(G.quests||[]).length};
  const ok=saveGame(true);
  const raw=store.get(SAVE_KEY);
  G.gold=0;G.day=1;G.level=1;
  const back=applySave(raw,"проверка");
  return {ok,back,совпало:G.gold===before.gold&&G.day===before.day&&G.level===before.level,
   размерКБ:Math.round((raw||"").length/1024),before};});
 check('после долгой игры сохранение пишется и читается обратно',
  save.ok===true&&save.back===true&&save.совпало===true,save);
 check('сохранение не разрослось сверх разумного',save.размерКБ<600,{килобайт:save.размерКБ});

 /* Предел дел и отказ от дела — отдельно и прицельно. */
 const limit=await page.evaluate(()=>{
  G.quests=[];G.chainTaken={};G.rep={};
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  let взято=0;
  for(let i=0;i<20;i++){
   const n=getNPC(1000+i*13,1000+i*7,0,"Старейшина");
   const before=openQuests().length;
   takeNPCQuest(n);
   while(activeLayer())closeTopUI();
   if(openQuests().length>before)взято++;}
  const отказ=said.some(t=>/незакрытых дел/.test(t));
  const q=openQuests()[0];
  const репДо=repOf(q.race);
  const сброшено=dropQuest(q.id);
  const репПосле=repOf(q.race);
  const местоОсвободилось=openQuests().length===QUEST_LIMIT-1;
  const n2=getNPC(1234,4321,0,"Старейшина");
  takeNPCQuest(n2);
  while(activeLayer())closeTopUI();
  Speech.say=o;
  return {взято,предел:QUEST_LIMIT,открыто:openQuests().length,отказПрозвучал:отказ,
   сброшено,местоОсвободилось,репУпала:репПосле<репДо};});
 check('больше восьми незакрытых дел взять нельзя, и игра объясняет почему',
  limit.взято===limit.предел&&limit.отказПрозвучал===true,limit);
 check('от дела можно отказаться: место освобождается, репутация падает',
  limit.сброшено===true&&limit.местоОсвободилось===true&&limit.репУпала===true&&limit.открыто===limit.предел,limit);

 check('ни одной ошибки страницы за всю игру',errors.length===0,errors.slice(0,4));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
