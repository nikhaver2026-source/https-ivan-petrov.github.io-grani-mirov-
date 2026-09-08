const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. Рыба стала товаром: значки, базовые цены, рыночные цены
 const goods=await page.evaluate(()=>{
  const fish=FISH.map(f=>f.n);
  return {fish:fish.length,
   icons:fish.filter(n=>!RESICON[n]),
   base:fish.filter(n=>!RES_BASE[n]),
   priced:fish.map(n=>marketPrice(n,0,G.day)).every(p=>p>0),
   inTrade:fish.filter(n=>TRADE_GOODS.includes(n)).length,
   landPool:LAND_RES.length,
   questPool:(()=>{const npc=getNPC(G.x,G.y,0);const q=questFor(npc);return q.type!=="fetch"||LAND_RES.includes(q.res);})()};});
 check('улов стал полноценным товаром',goods.icons.length===0&&goods.base.length===0&&goods.priced,goods);
 check('в квестах на сбор просят только то, что растёт на земле',goods.questPool&&goods.landPool===9);

 // 2. Снасти делаются в мастерской
 const craft=await page.evaluate(()=>{
  G.inv={дерево:5,трава:8,ягоды:2,камень:3};G.items=[];
  CMD.craft();
  const recipes=[...document.querySelectorAll('#craftList .list-line')].map(d=>d.textContent.split("—")[0].trim());
  CMD.craftdo(3);CMD.craftdo(4);
  return {recipes,items:G.items.slice(),rod:hasTackle("rod"),net:hasTackle("net")};});
 check('удочка и сеть делаются и дают снасть',craft.rod&&craft.net,{items:craft.items});

 // 3. Места для рыбалки
 const spots=await page.evaluate(()=>{
  const out={};
  G.ship=null;G.place=null;
  const p=findPorts(G.x,G.y,60,8)[0];
  G.x=p.x;G.y=p.y;out.port=fishingSpot();
  // берег рядом с портом
  outer: for(let r=1;r<12;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(p.x+dx,p.y+dy);
   if(c.terrain[0]==="coast"&&!c.structure){G.x=p.x+dx;G.y=p.y+dy;break outer;}}
  out.coast=fishingSpot();
  G.x=1000;G.y=1000;
  const c=cellContent(1000,1000);out.land=fishingSpot();out.landTerr=c.terrain[0];
  G.ship={left:1,legs:4};out.sea=fishingSpot();
  G.ship=null;
  return out;});
 check('рыбачить можно у причала, на берегу и с борта, но не в поле',
  spots.port==="port"&&spots.coast==="coast"&&spots.sea==="deep"&&!spots.land,spots);

 // 4. Полный цикл: заброс, поклёвка, подсечка
 const fishing=await page.evaluate(async()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.ship=null;G.place=null;
  G.items=["Удочка","Рыболовная сеть"];G.inv={};
  const log=[];const orig=Speech.say;Speech.say=t=>log.push(t);
  let caught=0,cast=0,early=0;
  /* Игрок реагирует на звук поклёвки, а не спит фиксированное время:
     ждём появления клёва и подсекаем сразу, как в настоящей игре. */
  for(let i=0;i<12;i++){
   if(!startFishing())break;
   cast++;
   let hooked=false;
   for(let t=0;t<70;t++){
    await new Promise(r=>setTimeout(r,100));
    if(G.fishing&&G.fishing.bite){if(hookFish())caught++;hooked=true;break;}
    if(!G.fishing)break;                        /* пустая поклёвка */
   }
   if(G.fishing)endFishing();
  }
  // подсечка до поклёвки — промах
  startFishing();const tooEarly=hookFish()===false;early=tooEarly?1:0;
  Speech.say=orig;
  const inv=Object.entries(G.inv).filter(([k])=>FISH_BY_NAME[k]);
  return {cast,caught,early,inv,logSample:log.filter(t=>/Клюёт|Есть!|Сорвалось|Пусто/.test(t)).slice(0,4)};});
 check('рыбалка ловит рыбу: заброс, поклёвка, подсечка',fishing.caught>0&&fishing.inv.length>0,
  {cast:fishing.cast,caught:fishing.caught,inv:fishing.inv});
 check('подсечка до поклёвки не засчитывается',fishing.early===1);

 // 5. Улов продаётся в порту
 const sell=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;
  const fishName=Object.keys(G.inv).find(k=>FISH_BY_NAME[k])||"треска";
  G.inv[fishName]=(Number(G.inv[fishName])||0)+3;G.gold=0;
  const npc=getNPC(p.x,p.y,8,"Торговец");
  sellResource(npc.key,fishName,true);
  return {fishName,gold:G.gold,left:Number(G.inv[fishName])||0};});
 check('улов продаётся торговцу порта',sell.gold>0&&sell.left===0,sell);

 // 6. Грузовые партии: опт дешевле розницы
 const lots=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.ship=null;G.place=null;G.gold=5000;G.inv={};
  const pf=cityProfile(p);const res=pf.surplus[0];
  const unit=citySellPrice(res,p,G.day);
  const p5=lotPrice(res,p,G.day,5),p10=lotPrice(res,p,G.day,10);
  openHarbor();
  const has=!!document.querySelector('[data-cmd^="lot10:"]');
  const g0=G.gold;CMD.lot10(res);
  return {res,unit,p5,p10,has,bought:Number(G.inv[res])||0,spent:g0-G.gold,
   cheaper:p10/10<unit&&p5/5<=unit};});
 check('партии продаются оптом и дешевле розницы',lots.has&&lots.bought===10&&lots.cheaper,lots);

 // 7. Трюм ограничивает погрузку
 const hold=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.gold=5000;
  G.inv={руда:200};                       /* заведомо больше любого трюма */
  openHarbor();
  const btns=[...document.querySelectorAll('[data-cmd^="board:"]')];
  const before=G.ship;
  CMD.board(btns[0].dataset.cmd.split(":")[1]);
  const refused=!G.ship;
  G.inv={руда:5};
  CMD.board(btns[0].dataset.cmd.split(":")[1]);
  const boarded=!!G.ship;
  const info=G.ship&&{hold:G.ship.hold,load:cargoUnits()};
  return {refused,boarded,info,ships:G.harborShips.map(s=>s.hold)};});
 check('трюм ограничивает погрузку и указан у каждого судна',hold.refused&&hold.boarded&&hold.info.hold>0,hold);

 // 8. Морской подряд: взятие, срок, сдача в порту
 const freight=await page.evaluate(()=>{
  G.ship=null;const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.quests=[];G.gold=0;G.inv={};
  openHarbor();
  const has=!!document.querySelector('[data-cmd^="freight:"]');
  CMD.freight(0);
  const q=G.quests[0];
  if(!q)return {has,noQuest:true};
  const early=(()=>{completeQuest(q.id);return q.done;})();     /* без груза — не сдать */
  G.inv[q.res]=q.need;
  G.x=q.tx;G.y=q.ty;
  completeQuest(q.id);
  return {has,type:q.type,city:q.city,due:q.due,earlyDone:early,done:q.done,gold:G.gold,left:Number(G.inv[q.res])||0};});
 check('морской подряд берётся и сдаётся в порту назначения',
  freight.has&&freight.type==="freight"&&!freight.earlyDone&&freight.done&&freight.gold>0&&freight.left===0,freight);

 // 9. Шторм может смыть груз, но не ломает состояние
 const storm=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.gold=3000;G.hp=100;G.ship=null;G.quests=[];
  G.inv={руда:10};
  openHarbor();const b=document.querySelector('[data-cmd^="board:"]');CMD.board(b.dataset.cmd.split(":")[1]);
  let bad=0,lost=0;const start=Number(G.inv["руда"])||0;
  for(let i=0;i<60&&G.ship;i++){
   G.ship.storm=false;G.ship.left=5;
   const before=Number(G.inv["руда"])||0;
   sailLeg();
   if(G.inCombat)endCombat();
   const now=Number(G.inv["руда"])||0;
   if(now<before)lost+=before-now;
   if(!(G.hp>0)||!Number.isFinite(G.gold)||now<0)bad++;
   const m=document.getElementById("modal-pirate");if(m&&!m.hidden){curPirates=null;closeModal(m);}
  }
  return {start,lost,bad,hp:G.hp};});
 check('шторм иногда смывает груз и не портит состояние',storm.bad===0&&storm.hp>0,storm);

 // 10. Рыбалка с борта и голод по времени
 const atSea=await page.evaluate(async()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.ship=null;G.gold=3000;G.inv={};G.items=["Рыболовная сеть"];
  openHarbor();const b=document.querySelector('[data-cmd^="board:"]');CMD.board(b.dataset.cmd.split(":")[1]);
  const h0=G.hour+ (G.day*24);
  const ok=startFishing();
  await new Promise(r=>setTimeout(r,6200));
  let caught=false;
  if(G.fishing&&G.fishing.bite)caught=hookFish();
  else if(G.fishing)endFishing();
  if(G.inCombat)endCombat();
  return {ok,caught,spot:"sea",time:(G.hour+G.day*24)-h0,inv:Object.keys(G.inv)};});
 check('с борта судна тоже ловится',atSea.ok&&atSea.time>0,atSea);

 /* Морские встречи тоже кладут добычу в трюм. Раньше сеть матросов делала это,
    не спрашивая места, и груз переваливал за вместимость судна: случайный
    прогон ловил это лишь изредка, поэтому проверяем прямо. */
 const net=await page.evaluate(()=>{
  if(G.inCombat)endCombat();
  while(activeLayer())closeTopUI();
  if(G.fishing)endFishing();
  if(!G.ship)return {нет:"нет судна"};
  const hold=shipHold();
  G.inv={};G.inv["руда"]=hold;          /* трюм забит под завязку */
  const before=cargoUnits();
  let сеть=0,попыток=0;
  /* Гоняем морское событие, пока не выпадет именно сеть с находкой. */
  const origRandom=Math.random;
  try{
   for(let i=0;i<200&&сеть===0;i++){
    попыток++;
    let k=0;
    Math.random=()=>{k++;return k===1?0:k===2?0.75:0.5;}; /* встреча случилась, выпала сеть */
    if(maybeSeaEvent())сеть++;
   }
  }finally{Math.random=origRandom;}
  return {трюм:hold,было:before,стало:cargoUnits(),сеть,попыток,бой:G.inCombat,
   окно:activeLayer()&&activeLayer().id,судно:!!G.ship};});
 /* С борта нельзя «собрать» ресурс с клетки суши под килем: так трюм набивался
    сверх вместимости в обход всех проверок груза. */
 const deck=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  if(G.fishing)endFishing();
  if(G.inCombat)endCombat();
  if(!G.ship)return {нет:"нет судна"};
  G.inv={};
  const c=cellContent(G.x,G.y);
  const было=cargoUnits();
  const ответ=gatherCurrent("tap");
  return {ресурсПодКилем:!!(c&&c.res),собрано:ответ,было,стало:cargoUnits()};});
 check('с палубы нельзя собирать ресурсы суши',
  !deck.нет&&deck.собрано===false&&deck.стало===deck.было,deck);

 check('находка морской сети не выходит за пределы трюма',
  !net.нет&&net.сеть>0&&net.стало<=net.трюм&&net.стало===net.было,net);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
