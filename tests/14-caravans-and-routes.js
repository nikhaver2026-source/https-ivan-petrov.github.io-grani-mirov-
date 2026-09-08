const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(200);

 // Полный торговый рейс: купить в одном городе, дойти, продать в другом с прибылью
 const run=await page.evaluate(()=>{
  const r=bestRoutes(G.x,G.y,G.day,6)[0];
  if(!r)return {none:true};
  const qty=4;
  // приходим в город-источник и покупаем в лавке
  G.x=r.from.x;G.y=r.from.y;G.gold=1000;G.inv={};
  const seller=getNPC(r.from.x,r.from.y,8,"Торговец");
  const stock=stockFor(seller);
  const item=stock.find(o=>o.res&&o.n===r.res);
  if(!item)return {noStock:true,res:r.res,offered:stock.filter(o=>o.res).map(o=>o.n)};
  const idx=stock.indexOf(item);
  const g0=G.gold;
  for(let i=0;i<qty;i++)buyItem(seller.key,idx);
  const spent=g0-G.gold, have=Number(G.inv[r.res])||0;
  // идём в город назначения и продаём
  G.x=r.to.x;G.y=r.to.y;
  const buyer=getNPC(r.to.x,r.to.y,8,"Торговец");
  const g1=G.gold;
  sellResource(buyer.key,r.res,true);
  const earned=G.gold-g1;
  return {res:r.res,from:r.from.name,to:r.to.name,dist:r.dist,spent,have,earned,profit:earned-spent};});
 check('торговый рейс между городами приносит прибыль',run.none||run.noStock||(run.have>0&&run.profit>0),run);

 // Цена одного товара в лавках двух городов действительно разная
 const diff=await page.evaluate(()=>{
  const cs=findCities(G.x,G.y,40,8);
  const res="руда";
  const rows=cs.map(c=>({city:c.name,buy:citySellPrice(res,c,G.day),sell:cityBuyPrice(res,c,G.day)}));
  const min=Math.min(...rows.map(r=>r.buy)),max=Math.max(...rows.map(r=>r.sell));
  return {rows:rows.slice(0,4),spread:max-min};});
 check('разница цен между городами создаёт торговую прибыль',diff.spread>0,diff);

 // Караван предупреждается маяком в эхо-скане
 const scan=await page.evaluate(async()=>{
  const rts=caravanRoutes(G.x,G.y,G.day);
  if(!rts.length)return {none:true};
  const st=caravanState(rts[0],G.day,G.hour);
  if(!st)return {none:true};
  G.x=st.x+3;G.y=st.y;
  let said="";const o=Speech.say;Speech.say=t=>{said+=" "+t;};
  try{await scanSpeak();}finally{Speech.say=o;}
  return {said:said.slice(0,200),hasCaravan:/обоз|караван/i.test(said)};});
 check('эхо-скан слышит обозы на дорогах',scan.none||scan.hasCaravan,scan.said);

 // Событие засады доступно только сопровождающему обоз
 const amb=await page.evaluate(()=>{
  G.place=null;G.quests=[];
  const c=eventContext();
  const e=EVENTS.find(x=>x.id==="ambush");
  const without=e.ok(c);
  G.quests=[{id:"e1",type:"escort",done:false,city:"Тест",tx:1,ty:1,reward:{gold:50,xp:10}}];
  const withEsc=e.ok(c);
  openEvent(e,c);
  const btns=document.querySelectorAll('#eventBody [data-cmd^="evt:"]').length;
  CMD.evt("2"); // бросить обоз
  return {without,withEsc,btns,failed:!!G.quests[0].failed,done:G.quests[0].done};});
 check('засада на обоз возможна только во время сопровождения',!amb.without&&amb.withEsc&&amb.btns===3,amb);
 check('брошенный обоз закрывает задание без платы',amb.failed&&amb.done);

 console.log(results.join('\n'));
 console.log('\nОшибки страницы: '+(errors.length?errors.slice(0,4).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
