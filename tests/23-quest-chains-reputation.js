const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // ── Цепочки заданий ──
 const chains=await page.evaluate(()=>{
  const ids=Object.keys(CHAIN_DB);
  const bad=[];
  const n={key:"1,1,0",x:1000,y:1000,name:"Проверяющий",race:"Люди",prof:"Жрец",tier:2};
  ids.forEach(id=>{
   CHAIN_DB[id].steps.forEach((_,i)=>{
    const q=makeChainQuest(n,id,i);
    if(!q)return bad.push(id+" шаг "+(i+1)+": не собрался");
    if(!q.text||!q.reward||!q.type)bad.push(id+" шаг "+(i+1)+": неполный");
    if(q.chainStep!==i||q.chainOf!==CHAIN_DB[id].steps.length)bad.push(id+" шаг "+(i+1)+": сбит счёт шагов");
    if(!qProgressText(q))bad.push(id+" шаг "+(i+1)+": нет описания прогресса");});});
  const rewardsGrow=ids.every(id=>{
   const r=CHAIN_DB[id].steps.map((f,i)=>makeChainQuest(n,id,i).reward.gold);
   return r[0]<r[r.length-1];});
  return {ids,bad,rewardsGrow,кому:["Жрец","Глава клана","Правитель","Торговец","Магистр","Ученик","Фермер"].map(p=>chainForNPC({prof:p}))};});
 check('пять цепочек, каждый шаг собирается в настоящее задание',
  chains.ids.length===5&&chains.bad.length===0,{цепочек:chains.ids,плохие:chains.bad.slice(0,4)});
 check('награда на последнем шаге больше, чем на первом',chains.rewardsGrow===true);
 check('цепочку даёт тот, кому она к лицу',
  JSON.stringify(chains.кому)===JSON.stringify(["temple","clan","war","trade","net","net",null]),chains.кому);
 check('опись сети ведёт к вратам чужой державы',
  chains.ids.includes("net"),chains.ids);

 const flow=await page.evaluate(()=>{
  G.quests=[];G.chainTaken={};G.chainsDone=0;
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const n={key:"1,1,0",x:1000,y:1000,name:"Жрец Проверяющий",race:"Люди",prof:"Жрец",tier:1};
  const steps=[];
  let q=makeChainQuest(n,"temple",0);
  G.quests.push(q);
  for(let i=0;i<3;i++){
   const cur=G.quests.find(x=>!x.done);
   if(!cur)break;
   steps.push({шаг:cur.chainStep,текст:cur.text.slice(0,30)});
   cur.done=true;
   advanceChain(cur);
  }
  Speech.say=o;
  return {steps,всего:G.quests.length,завершено:G.chainsDone,
   сказано:said.filter(t=>/продолжение|Цепочка/i.test(t)).length};});
 check('сдал шаг — тут же получил следующий, и так до конца цепочки',
  flow.steps.length===3&&flow.steps[0].шаг===0&&flow.steps[2].шаг===2&&flow.всего===3,flow.steps);
 check('завершение цепочки отмечается и объявляется',flow.завершено===1&&flow.сказано>=3,
  {завершено:flow.завершено,реплик:flow.сказано});

 // Цепочка проходится целиком, каждый шаг платит ровно обещанное,
 // а повторная сдача не платит ничего
 const full=await page.evaluate(()=>{
  const satisfy=q=>{
   q.doneFlag=true;q.have=q.need||1;
   if(q.res)G.inv[q.res]=(q.need||1)+9;
   if(q.tx!=null){G.x=q.tx;G.y=q.ty;}
   if(q.type==="god_relic"){const g=GOD_BY_ID[q.godId];G.items.push("Реликвия: "+g.n);}
   if(q.type==="god_altar"){G.place={kind:"dungeon",bx:1,by:1,depth:2,x:1,y:1,stype:"ruins",name:"п"};G.altarPrayed=q.godId;}
   if(q.type==="war_raid"){q.base=0;G.dungeonKills=(q.need||1)+5;q.have=q.need;}};
  const out={};
  for(const chain of Object.keys(CHAIN_DB)){
   G.quests=[];G.chainTaken={};G.gold=0;G.items=[];G.inv={};G.chainsDone=0;G.place=null;
   const n={key:"2,2,0",x:1000,y:1000,name:"Заказчик",race:"Люди",prof:"Жрец",tier:1};
   G.quests.push(makeChainQuest(n,chain,0));
   const steps=[];
   for(let i=0;i<5;i++){
    const q=G.quests.find(x=>!x.done);
    if(!q)break;
    satisfy(q);
    const g=G.gold,want=questPay(q).gold;
    completeQuest(q.id);
    steps.push({шаг:q.chainStep,выплата:G.gold-g,обещано:want,сдан:!!q.done});
    G.place=null;}
   /* повторная сдача уже сданного не должна платить */
   const done=G.quests.find(x=>x.done);
   const g2=G.gold;
   if(done)completeQuest(done.id);
   out[chain]={шагов:steps.length,ровно:steps.every(s=>s.сдан&&s.выплата===s.обещано),
    заданий:G.quests.length,завершена:G.chainsDone===1,повтор:G.gold-g2};}
  return out;});
 const chainsOk=Object.values(full);
 check('каждая цепочка проходится все три шага подряд',
  chainsOk.length===5&&chainsOk.every(c=>c.шагов===3&&c.заданий===3&&c.завершена),full);
 check('каждый шаг платит ровно то, что обещал, и ни монетой больше',
  chainsOk.every(c=>c.ровно),full);
 check('повторная сдача уже сданного не платит ничего',
  chainsOk.every(c=>c.повтор===0),Object.fromEntries(Object.entries(full).map(([k,v])=>[k,v.повтор])));

 // У шагов цепочки разные номера — иначе сдача находит не то задание
 const ids=await page.evaluate(()=>{
  const n={key:"3,3,0",x:1000,y:1000,name:"З",race:"Люди",prof:"Жрец",tier:1};
  const list=CHAIN_DB.temple.steps.map((_,i)=>makeChainQuest(n,"temple",i).id);
  return {list,разных:new Set(list).size};});
 check('у шагов одной цепочки номера разные',ids.разных===ids.list.length,ids.list);

 // ── Отношение народа ──
 const att=await page.evaluate(()=>{
  const probe=r=>{G.rep={};G.clan=null;addRep("Люди",r);const a=attitudeOf("Люди");
   return {id:a.id,priceK:a.priceK,refuses:a.refuses};};
  return {friend:probe(15),warm:probe(7),plain:probe(0),cold:probe(-6),hostile:probe(-14)};});
 check('пять ступеней отношения, от своего до враждебного',
  att.friend.id==="friend"&&att.warm.id==="warm"&&att.plain.id==="plain"&&att.cold.id==="cold"&&att.hostile.id==="hostile",
  Object.fromEntries(Object.entries(att).map(([k,v])=>[k,v.id])));
 check('свой платит меньше, чужой больше',
  att.friend.priceK<1&&att.plain.priceK===1&&att.cold.priceK>1&&att.hostile.priceK>att.cold.priceK,
  {свой:att.friend.priceK,чужой:att.cold.priceK,враг:att.hostile.priceK});
 check('за чертой торговли нет',att.hostile.refuses===true&&att.cold.refuses===false);

 const clanFoe=await page.evaluate(()=>{
  G.rep={};G.clan=null;
  const my=CLAN_DB.find(c=>c.foe&&CLAN_BY_NAME[c.foe]);
  if(!my)return {skip:true};
  const foeRace=CLAN_BY_NAME[my.foe].race;
  const before=attitudeOf(foeRace).rep;
  G.clan=my.n;
  const after=attitudeOf(foeRace).rep;
  G.clan=null;
  return {clan:my.n,foe:my.foe,foeRace,before,after};});
 check('народ клана-соперника холоднее к члену вашего клана',
  clanFoe.skip||clanFoe.after<clanFoe.before,clanFoe);

 const trade=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  G.rep={};G.clan=null;
  const n=getNPC(1000,1000,0,"Торговец");
  /* Народ жителя выводится из его координат, поэтому портим репутацию
     именно у его народа, а не у выдуманного. */
  addRep(n.race,-15);
  const key=n.key;
  // карточка не показывает товары враждебному народу
  openNPC(key,true);
  const body=document.getElementById("npcBody").innerHTML;
  const hasGoods=/data-cmd="buy:/.test(body);
  const refusalShown=/не торгуют/.test(body);
  closeTopUI();
  // и покупка не проходит
  const gold0=G.gold;
  buyItem(key,0);
  const goldSame=G.gold===gold0;
  G.rep={};
  Speech.say=o;
  return {hasGoods,refusalShown,goldSame,said:said.slice(0,2)};});
 check('враждебному народу лавка закрыта: ни товаров, ни покупки',
  trade.hasGoods===false&&trade.refusalShown===true&&trade.goldSame===true,trade);

 // ── Кварталы города ──
 const city=await page.evaluate(()=>{
  G.place=null;
  enterPlace({x:1400,y:1400,structure:{type:"castle",name:"Цитадель",beacon:"castle"}});
  const l=curLevel();
  const names=[...new Set(l.blocks.map(b=>b.name))];
  const zones=new Set();
  for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++){
   if(tileAt(l,x,y)==="#")continue;
   const z=whereInCity(x,y);
   if(z)zones.add(z);}
  // проход по улице объявляет смену квартала
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  G.place.x=l.entry.x;G.place.y=l.entry.y;G.place.zone=null;
  /* Змейкой по городу: так путь пересекает и улицы, и кварталы. */
  for(let i=0;i<120;i++){
   const dir=(i%14<6)?"E":(i%14<7)?"S":(i%14<13)?"W":"S";
   moveInside(dir);
   if(!G.place)break;}
  Speech.say=o;
  const zoneSaid=said.filter(t=>/^(Торговый|Кузнечный|Храмовый|Складской|Жилой|Главная|Улица|Городские|Квартал)/.test(t)).length;
  return {кварталов:names.length,имена:names,зон:[...zones],названо:zoneSaid};});
 /* Кварталы теперь носят собственные имена города («Оружейный двор»), а не
    общие «торговый квартал», поэтому проверяем по списку кварталов уровня. */
 check('в городе есть названные кварталы, улицы и ворота',
  city.кварталов>=4&&city.имена.filter(n=>city.зон.includes(n)).length>=3
  &&city.зон.includes("улица")&&city.зон.includes("городские ворота"),
  {кварталов:city.кварталов,найдено:city.имена.filter(n=>city.зон.includes(n)).length,зоны:city.зон.slice(0,4)});
 check('на ходу игра называет, в какую часть города вы вошли',city.названо>=2,{реплик:city.названо});

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
