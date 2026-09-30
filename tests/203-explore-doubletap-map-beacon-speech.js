/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 203: ОЩУПЫВАНИЕ БЕЗ БЕГА, ДВОЙНОЕ КАСАНИЕ, КАРТА С МАЯКОМ, ГОЛОС ПРИ ЛИСТАНИИ

   Жалобы игрока (4.0):
   — двойное касание одним пальцем отрабатывает не так: с выбранной целью
     оно отвечало «Цель: …, подойдите», хотя под ногами был сундук;
   — на уроке ощупывания («коснитесь и ведите пальцем») герой бежит;
   — карта — тремя пальцами влево, ближайшие объекты — двумя пальцами
     влево, и в обоих по двойному касанию на объекте включается маяк;
   — при быстром листании меню и настроек голос порой замолкает.

   1. Медленное ведение пальцем по полю — ощупывание: ни бега, ни шага; урок
      ощупывания засчитан. Быстрый свайп с удержанием — бег, как прежде.
   2. С выбранной целью двойное касание по полю делает то, что под ногами
      (сундук), а на пустом полу — говорит, где цель.
   3. Три пальца влево — карта, два пальца влево — осмотреться.
   4. Двойное касание по точке карты делает её целью: карта закрывается,
      маяк звучит со стороны точки; в карте есть «Снять цель и маяк».
   5. Запись голоса, которая не зазвучала (плеер завис), за секунду
      договаривается синтезатором; пул плееров голоса не больше восьми.
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
 async function drag(x0,y0,x1,y1,ms,steps,hold){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:0}]});
  for(let k=1;k<=steps;k++){await page.waitForTimeout(ms/steps);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*k/steps,y:y0+(y1-y0)*k/steps,id:0}]});}
  if(hold)await page.waitForTimeout(hold);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);}
 async function multiSwipe(n,dx,dy){
  const pts=[];for(let i=0;i<n;i++)pts.push({x:100+i*45,y:450});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});await page.waitForTimeout(30);
  for(let k=1;k<=6;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/6,y:p.y+dy*k/6,id:i}))});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);}
 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(40);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(90);}

 /* ── 1. ощупывание и бег ── */
 await page.evaluate(()=>{
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.weaponDrawn=false;settings.explore=1;
  window.ХОДЫ=[];const mv=window.move;window.move=function(d){ХОДЫ.push(d);return mv.apply(this,arguments);};
  window.БЕГ=0;const sr=window.startRun;window.startRun=function(){БЕГ++;return sr.apply(this,arguments);};
  Tutor.on=true;Tutor.i=Tutor.steps.findIndex(s=>s.want==="explore");Tutor.tries=1;window.maybeEvent=()=>{};});
 await drag(120,420,240,440,1300,26,0);
 const медленно=await page.evaluate(()=>({ходы:ХОДЫ.length,бег:БЕГ,урок:Tutor.on===false||Tutor.i>Tutor.steps.findIndex(s=>s.want==="explore")}));
 await page.evaluate(()=>{ХОДЫ.length=0;БЕГ=0;Tutor.stop(true);stopRun();});
 await drag(120,420,260,420,60,4,600);
 const быстро=await page.evaluate(()=>({бег:БЕГ,ходы:ХОДЫ.length}));
 await page.evaluate(()=>{stopRun();ХОДЫ.length=0;});
 check('1. медленное ведение по полю — ощупывание: ни бега, ни шага, урок ощупывания засчитан; быстрый свайп с удержанием — бег',
  медленно.ходы===0&&медленно.бег===0&&медленно.урок&&быстро.бег>=1,{медленно,быстро});

 /* ── 2. двойное касание с выбранной целью ── */
 const двойное=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));const r={};
  let L=null,bx,by;for(bx=3;bx<40&&!L;bx++)for(by=3;by<40&&!L;by++){const l=genLevel(bx,by,2,"ruins");if(l&&l.entry)L=l;}bx--;by--;
  let старт=null;for(let y=1;y<L.h-1&&!старт;y++)for(let x=1;x<L.w-8&&!старт;x++){let ok=true;for(let k=0;k<8;k++)if(L.g[y][x+k]!=="."){ok=false;break;}if(ok)старт={x,y};}
  const сет=(x,y,t)=>{if(typeof L.g[y]==="string")L.g[y]=L.g[y].slice(0,x)+t+L.g[y].slice(x+1);else L.g[y][x]=t;};
  сет(старт.x+6,старт.y,"C");
  G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:старт.x,y:старт.y};
  window.curLevel=()=>L;Actors.stop();Actors.ensure=()=>{};Actors.tick=()=>{};
  settings.targetBeacon="constant";
  Look.open();await w(80);const i=Look.list.findIndex(o=>o.t==="C");CMD.looksel(i);await w(80);
  r.цель=!!Look.target;
  /* Встали на другой сундук под ногами. */
  сет(старт.x,старт.y,"C");
  const было=window.openChest;window.СУНДУК=0;window.openChest=function(){СУНДУК++;return true;};
  const сказано=[];const ps=Speech._push.bind(Speech);Speech._push=function(m){сказано.push(String(m&&m.text));return ps(m);};
  const pf=Speech._pushFront.bind(Speech);Speech._pushFront=function(m){сказано.push(String(m&&m.text));return pf(m);};
  fieldInteract();await w(50);
  r.сундукПодНогами=СУНДУК;r.сказалЦель=сказано.some(t=>/^Цель:/.test(t));
  /* На пустом полу — где цель. */
  сет(старт.x,старт.y,".");сказано.length=0;window.СУНДУК=0;
  fieldInteract();await w(50);
  r.пустоЦель=сказано.some(t=>/^Цель: /.test(t));r.пустоСундук=СУНДУК;
  window.openChest=было;Speech._push=ps;Speech._pushFront=pf;
  CMD.looktargetoff();
  return r;});
 check('2. с выбранной целью двойное касание делает то, что под ногами (сундук), а на пустом полу называет, где цель',
  двойное.цель&&двойное.сундукПодНогами===1&&!двойное.сказалЦель&&двойное.пустоЦель&&двойное.пустоСундук===0,двойное);

 /* ── 3. три влево — карта, два влево — осмотреться ── */
 await page.evaluate(()=>{while(activeLayer())closeTopUI();Speech.stop();});
 await multiSwipe(3,-170,0);
 const карта=await page.evaluate(()=>!document.getElementById("modal-map").hidden);
 await multiSwipe(3,-170,0);
 const картаЗакрыта=await page.evaluate(()=>document.getElementById("modal-map").hidden);
 await multiSwipe(2,-170,0);
 const осмотр=await page.evaluate(()=>!document.getElementById("modal-object").hidden&&document.getElementById("modal-map").hidden);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 const умолчания=await page.evaluate(()=>({два:GEST_DEFAULTS["2swipeW"],три:GEST_DEFAULTS["3swipeW"]}));
 check('3. три пальца влево — карта (тот же жест закрывает), два пальца влево — осмотреться',
  карта&&картаЗакрыта&&осмотр&&умолчания.два==="look"&&умолчания.три==="map",{карта,картаЗакрыта,осмотр,умолчания});

 /* ── 4. точка карты — цель и маяк ── */
 const точка=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));const r={};
  window.PINGS=[];const tp=TargetBeacon.ping.bind(TargetBeacon);TargetBeacon.ping=function(q,g){if(q)PINGS.push({dx:q.dx,dy:q.dy});return tp(q,g);};
  toggleWindowGesture("modal-map");await w(80);
  const pts=mapPoints();const i=pts.findIndex(o=>o.d>=2);r.точек=pts.length;r.i=i;
  if(i<0)return r;
  const o=pts[i];r.ждём={dx:o.dx,dy:o.dy};
  CMD.mappt(String(i));await w(60);
  r.закрыта=document.getElementById("modal-map").hidden;r.цель=TargetBeacon.t&&TargetBeacon.t.n;
  await w(1700);r.удары=PINGS.slice(0,3);
  toggleWindowGesture("modal-map");await w(60);
  r.снять=/looktargetoff/.test(document.getElementById("mapPoints").innerHTML);
  CMD.looktargetoff();await w(40);r.снята=!TargetBeacon.t;
  TargetBeacon.ping=tp;
  return r;});
 check('4. двойное касание по точке карты — цель: карта закрывается, маяк звучит со стороны точки; в карте есть «Снять цель и маяк»',
  точка.i>=0&&точка.закрыта&&!!точка.цель&&точка.удары.length>=1&&точка.удары.every(p=>p.dx===точка.ждём.dx&&p.dy===точка.ждём.dy)
  &&точка.снять&&точка.снята,точка);

 /* ── 5. немая запись голоса ── */
 const голос=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));const r={};
  for(let i=0;i<30&&Speech.gvLoad().state!=="ready";i++)await w(200);
  r.банк=Speech.gvLoad().state;
  const фраза="Настройки";
  r.естьЗапись=Speech.gvParts(фраза).some(x=>x.url);
  /* Запас голоса Gemini — голос устройства, выбранный в настройках: адаптер
     его берётся в миг, когда запись не зазвучала (_voiceAdapter), поэтому
     подмена держится всё ожидание. */
  const запас=[];const dev=Speech._voiceAdapter;
  Speech._voiceAdapter=()=>({name:"fake",speak(t,o){запас.push(t);setTimeout(()=>o.onend&&o.onend(),20);return true;},cancel(){},speaking(){return false;}});
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){return new Promise(()=>{});};
  const a=Speech._geminiAdapter();
  let конец=0;const t0=Date.now();
  a.speak(фраза,{rate:1,volume:1,onend(){конец=Date.now()-t0;}});
  await w(1600);
  Speech._voiceAdapter=dev;
  HTMLMediaElement.prototype.play=play;
  r.запас=запас.slice();r.конец=конец;
  const src=document.documentElement.innerHTML;
  r.пул=/if\(пул\.size>8\)/.test(src);
  return r;});
 check('5. запись голоса, которая не зазвучала, за секунду договаривается синтезатором; пул плееров голоса — восемь',
  голос.банк==="ready"&&голос.естьЗапись&&голос.запас.length>=1&&голос.конец>0&&голос.конец<1600&&голос.пул,голос);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\n${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 await browser.close();
})();
