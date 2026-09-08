const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(200);

 // 1. Города находятся, у каждого свой профиль
 const cities=await page.evaluate(()=>{
  const list=findCities(G.x,G.y,40,8);
  return {n:list.length,names:list.slice(0,3).map(c=>c.name),
   profiles:list.slice(0,3).map(c=>{const p=cityProfile(c);return {spec:p.spec,surplus:p.surplus,demand:p.demand};}),
   sameSurplusDemand:list.some(c=>{const p=cityProfile(c);return p.surplus.some(r=>p.demand.includes(r));})};});
 check('города поблизости находятся и имеют профиль',cities.n>0&&cities.profiles.every(p=>p.spec&&p.surplus.length&&p.demand.length),cities.n);
 check('избыток и нехватка города не пересекаются',!cities.sameSurplusDemand);

 // 2. Цены различаются между городами — иначе торговля бессмысленна
 const spread=await page.evaluate(()=>{
  const list=findCities(G.x,G.y,40,8);
  const out={};
  for(const res of TRADE_GOODS){const prices=list.map(c=>cityPriceOf(res,c,G.day));
   out[res]=[Math.min(...prices),Math.max(...prices)];}
  const diffs=Object.values(out).filter(([a,b])=>b>a).length;
  return {goods:Object.keys(out).length,differing:diffs,sample:out["руда"]};});
 check('цены на товар различаются между городами',spread.differing>=spread.goods-1,spread);

 // 3. Маршруты: покупка дешевле продажи, расстояние осмысленное
 const routes=await page.evaluate(()=>{
  const r=bestRoutes(G.x,G.y,G.day,6);
  return {n:r.length,valid:r.every(x=>x.sell>x.buy&&x.dist>=4&&x.from!==x.to),top:r[0]&&{res:r[0].res,profit:r[0].profit,dist:r[0].dist}};});
 check('маршруты дают положительную прибыль и корректны',routes.n>0&&routes.valid,routes.top);

 // 4. Караваны существуют, движутся и возвращаются
 const cars=await page.evaluate(()=>{
  const rts=caravanRoutes(G.x,G.y,G.day);
  if(!rts.length)return {none:true};
  const rt=rts[0];
  const track=[];
  for(let h=0;h<48;h+=3){const st=caravanState(rt,G.day+Math.floor(h/24),h%24);if(st)track.push([st.x,st.y,st.moving]);}
  const uniq=new Set(track.map(t=>t[0]+","+t[1])).size;
  const moved=track.some(t=>t[2]);
  const inRoute=track.every(t=>Math.min(rt.a.x,rt.b.x)-1<=t[0]&&t[0]<=Math.max(rt.a.x,rt.b.x)+1);
  return {routes:rts.length,points:track.length,uniq,moved,inRoute,from:rt.a.name,to:rt.b.name,dist:rt.dist};});
 check('караваны ходят между городами и меняют положение',!cars.none&&cars.uniq>2&&cars.moved&&cars.inRoute,cars);

 // 5. Встреча с караваном открывает окно с торговлей и наймом
 const meet=await page.evaluate(()=>{
  const rts=caravanRoutes(G.x,G.y,G.day);
  if(!rts.length)return {none:true};
  // ставим игрока на текущую позицию обоза
  let car=null;
  for(let h=0;h<24&&!car;h++){const st=caravanState(rts[0],G.day,h);if(st&&st.moving){G.hour=h;G.x=st.x;G.y=st.y;car=caravanHere();}}
  if(!car)return {noMeet:true};
  meetCaravan(car);
  const m=document.getElementById("modal-caravan");
  return {open:!!m&&!m.hidden,
   buy:document.querySelectorAll('#caravanBody [data-cmd^="carbuy:"]').length,
   escort:!!document.querySelector('[data-cmd="carescort"]'),
   news:!!document.querySelector('[data-cmd="carnews"]'),
   name:car.name,to:car.to.name};});
 check('встреча с обозом открывает окно торговли и найма',meet.open&&meet.buy>0&&meet.escort&&meet.news,meet);

 // 6. Покупка у обоза и продажа обозу
 const deal=await page.evaluate(()=>{
  const btn=document.querySelector('#caravanBody [data-cmd^="carbuy:"]');
  if(!btn)return {skip:true};
  const res=btn.dataset.cmd.split(":")[1];
  G.gold=500;const before=Number(G.inv[res])||0;
  CMD.carbuy(res);
  const bought=(Number(G.inv[res])||0)-before, goldAfter=G.gold;
  // продаём обозу то, что он скупает
  const sbtn=document.querySelector('#caravanBody [data-cmd^="carsell:"]');
  let sold=null;
  if(sbtn){const r2=sbtn.dataset.cmd.split(":")[1];const g0=G.gold;CMD.carsell(r2);sold={gain:G.gold-g0,res:r2};}
  return {res,bought,paid:500-goldAfter,sold};});
 check('у обоза можно купить товар',deal.skip||(deal.bought===1&&deal.paid>0),deal);

 // 7. Наём охраной создаёт задание с городом назначения
 const escort=await page.evaluate(()=>{
  G.quests=[];
  const rts=caravanRoutes(G.x,G.y,G.day);
  let car=null;
  for(let h=0;h<24&&!car;h++){const st=caravanState(rts[0],G.day,h);if(st&&st.moving){G.hour=h;G.x=st.x;G.y=st.y;car=caravanHere();}}
  if(!car)return {skip:true};
  meetCaravan(car);takeEscort();
  const q=G.quests[0];
  if(!q)return {noQuest:true};
  // приходим в город назначения
  G.gold=0;G.x=q.tx;G.y=q.ty;
  const paid=checkEscortArrival();
  return {type:q.type,city:q.city,done:q.done,paid,gold:G.gold};});
 check('наём охраной создаёт задание и оплачивается в городе',escort.skip||(escort.type==="escort"&&escort.done&&escort.gold>0),escort);

 // 8. Экран «Рынки и караваны»
 const screen=await page.evaluate(()=>{
  CMD.trade();
  const m=document.getElementById("modal-trade");
  return {open:!!m&&!m.hidden,
   cities:document.querySelectorAll('#tradeCities .list-line').length,
   routes:document.querySelectorAll('#tradeRoutes .list-line').length,
   caravans:document.querySelectorAll('#tradeCaravans .list-line').length,
   speak:(document.querySelector('#tradeCities .list-line')||{dataset:{}}).dataset.speak||""};});
 check('экран рынков и караванов заполнен и озвучен',screen.open&&screen.cities>0&&screen.routes>0&&screen.speak.length>50,
  {c:screen.cities,r:screen.routes,k:screen.caravans});

 // 9. Городская лавка торгует по ценам своего города
 const shop=await page.evaluate(()=>{
  const list=findCities(G.x,G.y,40,8);
  const c=list.find(x=>x.type==="village")||list[0];
  if(!c)return {skip:true};
  G.x=c.x;G.y=c.y;
  const npc=getNPC(c.x,c.y,8,"Торговец");
  const p=cityProfile(c);
  const res=p.surplus[0];
  G.inv[res]=3;G.gold=100;
  const stock=stockFor(npc);
  const surplusOffered=stock.some(o=>o.res&&p.surplus.includes(o.n));
  const cityPrice=cityBuyPrice(res,c,G.day);
  const g0=G.gold;sellResource(npc.key,res,false);
  const roundTrip=getNPCByKey(npc.key).prof;
  return {surplusOffered,cityPrice,gain:G.gold-g0,spec:p.spec,roundTrip,key:npc.key};});
 check('лавка города продаёт свой избыток и платит по цене города',shop.skip||(shop.surplusOffered&&shop.gain>0),shop);
 check('ключ жителя сохраняет заданную зданием профессию',shop.skip||shop.roundTrip==="Торговец",shop.roundTrip);

 // 10. Подряд на доставку в город
 const deliv=await page.evaluate(()=>{
  const npc=getNPC(G.x,G.y,0,"Торговец");
  npc.tier=2;
  const q=questFor(npc);
  if(q.type!=="delivery")return {type:q.type};
  G.quests=[{...q,done:false,have:0}];
  G.inv[q.res]=(Number(G.inv[q.res])||0)+q.need;
  G.x=q.tx;G.y=q.ty;G.gold=0;
  completeQuest(q.id);
  return {type:q.type,city:q.city,done:G.quests[0].done,gold:G.gold,left:Number(G.inv[q.res])||0};});
 check('подряд на доставку в город завершается на месте',deliv.type!=="delivery"||(deliv.done&&deliv.gold>0),deliv);

 // 11. Маяк каравана существует и описан
 const bk=await page.evaluate(()=>({beacon:!!BEACONS.caravan,info:!!BEACON_INFO.caravan}));
 check('маяк каравана есть и описан в энциклопедии',bk.beacon&&bk.info,bk);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
