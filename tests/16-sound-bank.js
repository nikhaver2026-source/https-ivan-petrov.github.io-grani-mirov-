const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{/* Регистрация service worker без sw.js рядом — известный безобидный no-op игры. */
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 const reqs=[];page.on('request',r=>{if(/\/sounds\//.test(r.url()))reqs.push(r.url().split('/sounds/')[1]);});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 // 1. Банк: роли, файлы, отсутствие повторов
 const bank=await page.evaluate(()=>{
  const roles=Object.keys(SOUND_BANK);
  const files=roles.flatMap(r=>SOUND_BANK[r].f);
  const dup=files.filter((v,i,a)=>a.indexOf(v)!==i);
  const cats=[...new Set(files.map(f=>f.split("/")[0]))];
  const noDesc=roles.filter(r=>!SOUND_BANK[r].d);
  return {roles:roles.length,files:files.length,dup,cats,noDesc};});
 check('банк собран: роли и записи без повторов',bank.roles>=57&&bank.files>=179&&!bank.dup.length,{r:bank.roles,f:bank.files,cats:bank.cats.length});
 check('у каждой роли есть описание',bank.noDesc.length===0,bank.noDesc);

 // 2. Файлы банка действительно доступны
 /* Политика безопасности игры запрещает fetch (connect-src 'none'), поэтому
    доступность записей проверяется так же, как их грузит сама игра — элементом audio. */
 const avail=await page.evaluate(async()=>{
  const files=Object.values(SOUND_BANK).flatMap(b=>b.f);
  const sample=[files[0],files[Math.floor(files.length/3)],files[Math.floor(files.length/2)],files[files.length-1]];
  const res=[];
  for(const f of sample){
   const ok=await new Promise(r=>{const a=new Audio("sounds/"+f);
    a.addEventListener("loadedmetadata",()=>r({d:a.duration}),{once:true});
    a.addEventListener("error",()=>r(null),{once:true});
    setTimeout(()=>r(null),5000);});
   res.push({f,ok:!!ok,dur:ok&&Math.round(ok.d*10)/10});}
  return res;});
 check('файлы банка лежат по своим путям и читаются',avail.every(a=>a.ok),avail.map(a=>a.f.split("/")[1]+":"+(a.ok?a.dur+"с":"нет")));

 // 3. Фон места переключается по роли
 const amb=await page.evaluate(()=>{
  const out={};
  G.place=null;G.ship=null;
  const c=cellContent(G.x,G.y);
  out.land=bankAmbientRole();
  G.place={kind:"dungeon",bx:G.x,by:G.y,stype:"ruins",name:"т",depth:4,x:1,y:1};out.deep=bankAmbientRole();
  G.place={kind:"city",bx:G.x,by:G.y,stype:"village",name:"т",depth:0,x:1,y:1};out.city=bankAmbientRole();
  G.place=null;G.ship={storm:false};out.sea=bankAmbientRole();
  G.ship={storm:true};out.storm=bankAmbientRole();
  G.ship=null;
  return out;});
 check('фон подбирается по месту: земля, глубина, город, море, шторм',
  amb.deep==='deep_4'&&amb.city==='amb_city'&&amb.sea==='sea_open'&&amb.storm==='sea_storm'&&/^(amb_|sea_|port)/.test(amb.land),amb);

 // 4. Банк реально проигрывает и подгружает файлы
 const played=await page.evaluate(()=>{
  const el=Bank.play("god",{seed:3,gain:0.5,maxSec:2});
  const loop=Bank.loop("place","sea_open",{seed:1,gain:0.4});
  return {shot:!!el,shotSrc:el&&el.src.split("/sounds/")[1],loop:!!loop,loopSrc:loop&&loop.src.split("/sounds/")[1],enabled:Bank.enabled};});
 await page.waitForTimeout(800);
 check('банк проигрывает записи и грузит их из папки sounds',played.shot&&played.loop&&played.enabled,played);
 check('запросы к файлам звука уходят',reqs.length>0,reqs.slice(0,3));

 // 5. Порты в мире
 const ports=await page.evaluate(()=>{
  const list=findPorts(G.x,G.y,60,8);
  const viaCell=[];
  for(const p of list.slice(0,3)){const c=cellContent(p.x,p.y);viaCell.push(c.structure&&c.structure.type);}
  return {n:list.length,names:list.slice(0,2).map(p=>p.name),viaCell,
   coast:list.every(p=>terrainAt(p.x,p.y)[0]==="coast")};});
 check('порты стоят на побережье и видны в мире',ports.n>0&&ports.coast&&ports.viaCell.every(t=>t==="port"),ports);

 // 6. Рейсы: назначение, плата, переходы
 const ships=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];
  if(!p)return {none:true};
  const list=portShips(p,G.day);
  return {port:p.name,n:list.length,
   valid:list.every(s=>s.fare>0&&s.legs>=2&&s.to&&(s.to.x!==p.x||s.to.y!==p.y)),
   sample:list[0]&&{to:list[0].to.name,fare:list[0].fare,legs:list[0].legs,kind:list[0].kind.n}};});
 check('у порта есть рейсы с платой и числом переходов',ships.none||(ships.n>0&&ships.valid),ships);

 // 7. Посадка, плавание и прибытие
 const voyage=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];
  G.x=p.x;G.y=p.y;G.place=null;G.ship=null;G.gold=1000;G.hp=100;
  openHarbor();
  const btn=document.querySelector('[data-cmd^="board:"]');
  if(!btn)return {noShip:true};
  const g0=G.gold;
  CMD.board(btn.dataset.cmd.split(":")[1]);
  if(!G.ship)return {notBoarded:true,gold:G.gold};
  const start={name:G.ship.name,to:G.ship.toName,legs:G.ship.legs,left:G.ship.left,fare:g0-G.gold};
  const from=[G.x,G.y];
  let steps=0;
  while(G.ship&&steps<40){sailLeg();steps++;if(G.inCombat){endCombat();}}
  return {start,steps,arrivedAt:[G.x,G.y],moved:from[0]!==G.x||from[1]!==G.y,
   ship:G.ship,port:(cellContent(G.x,G.y).structure||{}).type};});
 check('посадка на корабль берёт плату и начинает рейс',voyage.noShip||(voyage.start&&voyage.start.fare>0&&voyage.start.legs>=2),voyage.start);
 check('плавание доходит до порта назначения',voyage.noShip||(!voyage.ship&&voyage.moved&&voyage.port==="port"),
  {steps:voyage.steps,port:voyage.port,at:voyage.arrivedAt});

 // 8. Шторм и морские события не ломают состояние
 const sea=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];
  G.x=p.x;G.y=p.y;G.gold=1000;G.hp=100;G.ship=null;
  openHarbor();const btn=document.querySelector('[data-cmd^="board:"]');
  if(!btn)return {skip:true};
  CMD.board(btn.dataset.cmd.split(":")[1]);
  let storms=0,events=0,bad=[];
  for(let i=0;i<30&&G.ship;i++){
   const before=G.hp;
   sailLeg();
   if(G.ship&&G.ship.storm)storms++;
   if(G.inCombat){events++;endCombat();}
   if(!(G.hp>0)||!Number.isFinite(G.gold))bad.push([i,G.hp,G.gold]);}
  return {storms,events,bad,hp:G.hp,gold:G.gold};});
 check('шторма и морские события не портят состояние',sea.skip||(sea.bad.length===0&&sea.hp>0&&Number.isFinite(sea.gold)),sea);

 // 9. Экран торговли показывает порты и рейсы
 const tr=await page.evaluate(()=>{
  G.ship=null;CMD.trade();
  return {ports:document.querySelectorAll('#tradePorts .list-line').length,
   speak:(document.querySelector('#tradePorts .list-line')||{dataset:{}}).dataset.speak||""};});
 check('порты и рейсы попали в экран торговли',tr.ports>0&&/Рейс|рейс/.test(tr.speak),{n:tr.ports,s:tr.speak.slice(0,60)});

 // 10. Энциклопедия перечисляет банк
 const enc=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();CMD.encyc();
  const разделы=[...document.querySelectorAll('#encycCats .sound-card b')].map(x=>x.textContent);
  /* Открываем раздел живых записей моря и смотрим, что внутри именно роли банка. */
  const i=разделы.findIndex(t=>/Море, порты/.test(t));
  if(i>=0)document.querySelectorAll('#encycCats .sound-card')[i].click();
  return {разделов:разделы.length,разделы,
   вРазделе:document.querySelectorAll('#encycOneGrid .sound-card').length,
   заголовок:document.getElementById('encycOneTitle').textContent};});
 check('энциклопедия разложена по разделам, и раздел моря полон',
  enc.разделов>=20&&/Море/.test(enc.заголовок)&&enc.вРазделе>=8,enc);

 // 11. Маяки порта и корабля
 const bk=await page.evaluate(()=>({port:!!BEACONS.port,ship:!!BEACONS.ship,
  infoP:!!BEACON_INFO.port,infoS:!!BEACON_INFO.ship}));
 check('маяки порта и корабля есть и описаны',bk.port&&bk.ship&&bk.infoP&&bk.infoS,bk);

 // 12. Без папки sounds игра продолжает работать на синтезированных звуках
 const fb=await page.evaluate(()=>{
  Bank.enabled=true;
  const el=Bank.play("god",{seed:1});
  Bank.enabled=false;               /* имитируем отсутствие папки */
  const none=Bank.play("god",{seed:1});
  const loop=Bank.loop("place","sea_open",{seed:1});
  let ok=true;
  try{bankUpdateAmbient();refresh();look();}catch(e){ok=false;}
  Bank.enabled=true;
  return {had:!!el,none:none===null,loop:loop===null,ok};});
 check('без записей банка игра не ломается и молча звучит синтезом',fb.none&&fb.loop&&fb.ok,fb);

 console.log(results.join('\n'));
 console.log('\nЗапрошено файлов звука: '+reqs.length);
 console.log('Ошибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
