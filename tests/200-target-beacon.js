/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 200: МАЯК ЦЕЛИ ИЗ «ОСМОТРЕТЬСЯ»

   1. Выбор объекта в осмотре (двойное касание по пункту) закрывает окно и
      включает маяк: удары звучат со стороны цели — смещение совпадает с
      положением цели относительно игрока.
   2. Чем ближе игрок, тем чаще удары; шагнул — сторона и расстояние удара
      сместились вместе с ним.
   3. Дошёл вплотную — «Цель рядом», маяк смолкает.
   4. Ушёл с яруса — маяк снимается сам.
   5. Режим «по жесту»: маяк молчит, пока игрок не проведёт двумя пальцами
      вверх; тогда звучит «Цель: сундук, N шагов, справа» и один удар маяка.
   6. В окне осмотра есть «Снять цель и маяк»; настройка «Маяк цели» есть
      и сохраняется.
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
 const cdp=await ctx.newCDPSession(page);
 async function multiSwipe(n,dx,dy,steps=6){
  const pts=[];for(let i=0;i<n;i++)pts.push({x:100+i*45,y:450});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});await page.waitForTimeout(30);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/steps,y:p.y+dy*k/steps,id:i}))});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);}
 /* Ярус с прямым ходом в семь клеток и сундуком на его конце; твари не ходят. */
 const готово=await page.evaluate(()=>{
  window.SPOKEN=[];const ps=Speech._push.bind(Speech);Speech._push=function(m){SPOKEN.push(String(m&&m.text));return ps(m);};
  const pf=Speech._pushFront.bind(Speech);Speech._pushFront=function(m){SPOKEN.push(String(m&&m.text));return pf(m);};
  /* Удары именно маяка цели: эхо стен и маяки самого осмотра сюда не попадают. */
  window.PINGS=[];const tp=TargetBeacon.ping.bind(TargetBeacon);TargetBeacon.ping=function(r,g){if(r)PINGS.push({dx:r.dx,dy:r.dy,t:Date.now()});return tp(r,g);};
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;settings.fastTap=0;settings.hints=1;settings.hintMode="full";settings.compass=0;settings.effects=1;settings.hrtf=1;
  let L=null,bx,by;for(bx=3;bx<40&&!L;bx++)for(by=3;by<40&&!L;by++){const l=genLevel(bx,by,2,"ruins");if(l&&l.entry)L=l;}bx--;by--;
  let старт=null;
  for(let y=1;y<L.h-1&&!старт;y++)for(let x=1;x<L.w-8&&!старт;x++){let ok=true;for(let k=0;k<8;k++){if(L.g[y][x+k]!=="."){ok=false;break;}}if(ok)старт={x,y};}
  if(!старт)return false;
  const сет=(x,y,t)=>{if(typeof L.g[y]==="string")L.g[y]=L.g[y].slice(0,x)+t+L.g[y].slice(x+1);else L.g[y][x]=t;};
  for(let y=Math.max(0,старт.y-7);y<=Math.min(L.h-1,старт.y+7);y++)for(let x=Math.max(0,старт.x-7);x<=Math.min(L.w-1,старт.x+14);x++){const t=L.g[y][x];if(t!=="#"&&t!==".")сет(x,y,".");}
  сет(старт.x+6,старт.y,"C");
  G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:старт.x,y:старт.y};
  window.curLevel=()=>L;window.__старт=старт;
  Actors.stop();Actors.ensure=()=>{};Actors.tick=()=>{};window.maybeEvent=()=>{};
  return true;});
 check('0. ярус для проверки готов',готово);

 /* ── 1–2. выбор в осмотре, удары со стороны цели, учащение ── */
 const маяк=await page.evaluate(async()=>{
  const r={};const w=ms=>new Promise(res=>setTimeout(res,ms));
  settings.targetBeacon="constant";
  Look.open();await w(100);
  const i=Look.list.findIndex(o=>o.t==="C");r.вСписке=i>=0;
  PINGS.length=0;SPOKEN.length=0;
  CMD.looksel(i);await w(150);
  r.окноЗакрыто=document.getElementById("modal-object").hidden;
  r.сказано=SPOKEN.filter(t=>/^Цель:/.test(t));
  r.маякЕсть=!!TargetBeacon.t;
  await w(3200);
  r.далеко=PINGS.map(p=>({dx:p.dx,dy:p.dy}));
  const инт=(a)=>a.length>1?(a[a.length-1].t-a[0].t)/(a.length-1):null;
  r.интДалеко=инт(PINGS);
  /* Три шага к цели: удары теперь с трёх шагов и чаще. */
  moveInside("E");moveInside("E");moveInside("E");
  PINGS.length=0;await w(2600);
  r.близко=PINGS.map(p=>({dx:p.dx,dy:p.dy}));
  r.интБлизко=инт(PINGS);
  /* До сундука три шага: ещё два — и он вплотную. */
  SPOKEN.length=0;moveInside("E");moveInside("E");await w(1200);
  r.прибыл=SPOKEN.filter(t=>/^Цель рядом: сундук/.test(t));
  r.маякСнят=!TargetBeacon.t;
  PINGS.length=0;await w(1500);r.тишина=PINGS.length;
  return r;});
 check('1. выбор сундука в осмотре закрывает окно, говорит «Цель…» и включает маяк; удары идут справа, с шести шагов',
  маяк.вСписке&&маяк.окноЗакрыто&&маяк.сказано.length>=1&&маяк.маякЕсть&&маяк.далеко.length>=2&&маяк.далеко.every(p=>p.dx===6&&p.dy===0),маяк);
 check('2. после трёх шагов удары смещаются (три шага, справа) и звучат чаще',
  маяк.близко.length>=2&&маяк.близко.every(p=>p.dx===3&&p.dy===0)&&маяк.интБлизко<маяк.интДалеко,{далеко:маяк.интДалеко,близко:маяк.интБлизко,удары:маяк.близко});
 check('3. вплотную — «Цель рядом», маяк смолкает',маяк.прибыл.length>=1&&маяк.маякСнят&&маяк.тишина===0,маяк);

 /* ── 4. ушёл с яруса — маяк снят ── */
 const ушёл=await page.evaluate(async()=>{
  const w=ms=>new Promise(res=>setTimeout(res,ms));
  G.place.x=window.__старт.x;G.place.y=window.__старт.y;
  Look.open();await w(80);const i=Look.list.findIndex(o=>o.t==="C");CMD.looksel(i);await w(900);
  const был=!!TargetBeacon.t;SPOKEN.length=0;
  G.place.depth=3;await w(2500);
  const r={был,снят:!TargetBeacon.t,сказано:SPOKEN.filter(t=>/Маяк цели снят/.test(t))};
  G.place.depth=2;return r;});
 check('4. ушёл с яруса — маяк снимается сам и говорит об этом',ушёл.был&&ушёл.снят&&ушёл.сказано.length>=1,ушёл);

 /* ── 5. режим «по жесту» ── */
 await page.evaluate(async()=>{
  const w=ms=>new Promise(res=>setTimeout(res,ms));
  settings.targetBeacon="gesture";G.place.x=window.__старт.x;G.place.y=window.__старт.y;
  Look.open();await w(80);const i=Look.list.findIndex(o=>o.t==="C");CMD.looksel(i);await w(100);
  PINGS.length=0;await w(2200);window.__молчит=PINGS.length;SPOKEN.length=0;Speech.stop();});
 await multiSwipe(2,0,-170);await page.waitForTimeout(700);
 const жест=await page.evaluate(()=>({молчит:window.__молчит,сказано:SPOKEN.slice(),удары:PINGS.map(p=>({dx:p.dx,dy:p.dy}))}));
 check('5. «по жесту»: маяк молчит; два пальца вверх — «Цель: сундук, шесть шагов, справа» и один удар справа',
  жест.молчит===0&&жест.сказано.some(t=>/^Цель: сундук, шесть шагов, справа\./.test(t))&&жест.удары.length===1&&жест.удары[0].dx===6,жест);

 /* ── 6. снять цель, настройка ── */
 const снять=await page.evaluate(async()=>{
  const w=ms=>new Promise(res=>setTimeout(res,ms));
  Look.open();await w(80);
  const есть=/looktargetoff/.test(document.getElementById("objBody").innerHTML);
  CMD.looktargetoff();await w(80);
  const sel=document.getElementById("setTargetBeacon");
  const r={есть,снята:!TargetBeacon.t&&!Look.target,настройка:!!sel&&sel.options.length===2};
  sel.value="gesture";sel.dispatchEvent(new Event("change"));r.сохранено=JSON.parse(store.get("gm29set")||"{}").targetBeacon==="gesture";
  sel.value="constant";sel.dispatchEvent(new Event("change"));
  r.раздел=sel.closest("[data-set-group]").dataset.setGroup;
  return r;});
 check('6. в осмотре есть «Снять цель и маяк»; настройка «Маяк цели» (постоянно / по жесту) в разделе доступности сохраняется',
  снять.есть&&снять.снята&&снять.настройка&&снять.сохранено&&снять.раздел==="ui",снять);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\n${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 await browser.close();
})();
