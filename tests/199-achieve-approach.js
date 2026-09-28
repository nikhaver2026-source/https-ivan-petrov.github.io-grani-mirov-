/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 199: ДОСТИЖЕНИЯ ПРИ КРАТКОЙ ПОДРОБНОСТИ, ОБЪЕКТЫ ЗА ЧЕТЫРЕ ШАГА

   1. Достижение (новая ступень мастерства) при минимальной и краткой
      подробности звучит целиком, пока включён флажок «Озвучивать достижения
      при краткой и минимальной подробности»; выключен — молчит (остаются
      звук и журнал). При стандартной подробности звучит всегда.
   2. Объект, вошедший в круг четырёх шагов, называется отдельной вестью со
      стороной и расстоянием: без сторон света — «Справа сундук. Четыре
      шага.», со сторонами света — «на востоке». Подробность её не режет.
      Флажок «Называть объекты за четыре шага» её выключает; при подсказках
      «только звук» она молчит.
   3. Свайп двумя пальцами вверх внутри подземелья — «что рядом»: стороны и
      шаги до объектов. Снаружи — прежний повтор речи.
   4. Флажки есть в настройках и сохраняются; дальность «объектов рядом»
      выбирается от одного до шести шагов и действует и на весть, и на жест.
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
 await page.evaluate(()=>{
  /* Принятое в очередь — то, что и вправду прозвучит: отброшенное распорядителем сюда не попадает. */
  window.SPOKEN=[];const ps=Speech._push.bind(Speech);Speech._push=function(m){SPOKEN.push(String(m&&m.text));return ps(m);};
  const pf=Speech._pushFront.bind(Speech);Speech._pushFront=function(m){SPOKEN.push(String(m&&m.text));return pf(m);};
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;settings.fastTap=0;settings.hints=1;settings.hintMode="full";});

 /* ── 1. достижения ── */
 const дост=await page.evaluate(async()=>{
  const r={};const w=ms=>new Promise(res=>setTimeout(res,ms));
  if(!G.mast||typeof G.mast!=="object")G.mast={};
  const id=Object.keys(MAST_BY_ID)[0];
  /* Одинаковая весть в пределах окна дублей молчала бы: окно чистится перед каждым прогоном. */
  const поднять=()=>{G.mast[id]={ур:1,оп:0,дел:0};Speech.stop();Speech.recent.clear();SPOKEN.length=0;mastGain(id,10000);};
  settings.verbosity="min";settings.sayAchieve=1;поднять();await w(60);
  r.минВкл=SPOKEN.filter(t=>/Мастерство растёт/.test(t));
  settings.verbosity="brief";поднять();await w(60);
  r.кратВкл=SPOKEN.filter(t=>/Мастерство растёт/.test(t)&&/Открылось/.test(t));
  settings.verbosity="min";settings.sayAchieve=0;поднять();await w(60);
  r.минВыкл=SPOKEN.filter(t=>/Мастерство растёт/.test(t));
  settings.verbosity="normal";поднять();await w(60);
  r.стандартВыкл=SPOKEN.filter(t=>/Мастерство растёт/.test(t));
  settings.sayAchieve=1;settings.verbosity="normal";Speech.stop();
  return r;});
 check('1. достижение при минимальной и краткой подробности звучит целиком с флажком и молчит без него; при стандартной — всегда',
  дост.минВкл.length>=1&&дост.кратВкл.length>=1&&дост.минВыкл.length===0&&дост.стандартВыкл.length>=1,дост);

 /* ── 2. объекты за четыре шага ── */
 const подход=await page.evaluate(async()=>{
  const r={};const w=ms=>new Promise(res=>setTimeout(res,ms));
  /* Ярус, где от входа прямая дорожка ведёт к объекту: ставим сундук сами. */
  let L=null,bx,by;for(bx=3;bx<40&&!L;bx++)for(by=3;by<40&&!L;by++){const l=genLevel(bx,by,2,"ruins");if(l&&l.entry)L=l;}bx--;by--;
  /* Ищем на ярусе прямой ход в шесть клеток пола по горизонтали. */
  let старт=null;
  for(let y=1;y<L.h-1&&!старт;y++)for(let x=1;x<L.w-7&&!старт;x++){
   let ok=true;for(let k=0;k<7;k++){if(L.g[y][x+k]!=="."){ok=false;break;}}
   if(ok)старт={x,y};}
  r.нашёлХод=!!старт;if(!старт)return r;window.__старт={x:старт.x,y:старт.y};
  /* Вокруг хода — ничего, кроме пола и стен: чистим круг, чтобы весть была только о сундуке. */
  for(let y=Math.max(0,старт.y-5);y<=Math.min(L.h-1,старт.y+5);y++)for(let x=Math.max(0,старт.x-5);x<=Math.min(L.w-1,старт.x+12);x++){
   const t=L.g[y][x];if(t!=="#"&&t!==".")L.g[y]=L.g[y].substring?L.g[y].slice(0,x)+"."+L.g[y].slice(x+1):(L.g[y][x]=".",L.g[y]);}
  const сет=(x,y,t)=>{if(typeof L.g[y]==="string")L.g[y]=L.g[y].slice(0,x)+t+L.g[y].slice(x+1);else L.g[y][x]=t;};
  сет(старт.x+6,старт.y,"C");
  G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:старт.x,y:старт.y};
  /* Бродячие твари яруса затеяли бы бой посреди проверки: здесь они не ходят. */
  Actors.stop();Actors.ensure=()=>{};Actors.tick=()=>{};window.maybeEvent=()=>{};G.inCombat=false;
  const lvlKey=curLevel;window.curLevel=()=>L;
  settings.compass=0;settings.verbosity="min";settings.approach=1;
  approachCues();                              /* первый вызов на ярусе только запоминает */
  SPOKEN.length=0;moveInside("E");await w(80);  /* сундук теперь в пяти шагах — ещё молчит */
  r.пятьШагов=SPOKEN.filter(t=>/сундук/i.test(t));
  SPOKEN.length=0;moveInside("E");await w(80);  /* четыре шага: «Справа сундук. Четыре шага.» */
  r.четыреШага=SPOKEN.filter(t=>/сундук/i.test(t));
  SPOKEN.length=0;moveInside("E");await w(80);  /* уже назван — не повторяется */
  r.повтор=SPOKEN.filter(t=>/Справа сундук/.test(t));
  /* Свайп двумя пальцами вверх: что рядом. */
  Speech.stop();SPOKEN.length=0;
  window.__L=L;
  return r;});
 await multiSwipe(2,0,-170);
 const рядом=await page.evaluate(()=>SPOKEN.slice());
 const выкл=await page.evaluate(async()=>{
  const r={};const w=ms=>new Promise(res=>setTimeout(res,ms));const L=window.__L;
  /* Каждый опыт — с одной и той же точки: сундук в шести шагах, два шага к нему. */
  const сначала=()=>{G.place.x=window.__старт.x;G.place.y=window.__старт.y;approachCues();SPOKEN.length=0;};
  /* Флажок выключен — вести нет. */
  settings.approach=0;сначала();moveInside("E");moveInside("E");await w(80);
  r.выкл=SPOKEN.filter(t=>/сундук/i.test(t)&&/шаг/i.test(t));
  /* Стороны света включены: «на востоке». */
  settings.approach=1;settings.compass=1;сначала();moveInside("E");moveInside("E");await w(80);
  r.компас=SPOKEN.filter(t=>/сундук/i.test(t));
  /* Подсказки «только звук» — молчит. */
  settings.hintMode="sound";settings.hints=0;сначала();moveInside("E");moveInside("E");await w(80);
  r.звук=SPOKEN.filter(t=>/сундук/i.test(t)&&/шаг/i.test(t));
  settings.hints=1;settings.hintMode="full";
  /* Дальность два шага: сундук называется, когда до него два шага, а не четыре. */
  settings.approachR="2";settings.compass=0;сначала();
  const шаги=[];for(let k=0;k<5;k++){SPOKEN.length=0;moveInside("E");await w(40);шаги.push(SPOKEN.filter(t=>/сундук/i.test(t)&&/шаг/i.test(t)));}
  r.дальность2=шаги;settings.approachR=4;
  settings.hintMode="full";settings.compass=1;settings.verbosity="normal";
  return r;});
 check('2. сундук, вошедший в круг четырёх шагов, называется со стороной и расстоянием даже при минимальной подробности, один раз',
  подход.нашёлХод&&подход.пятьШагов.length===0&&подход.четыреШага.some(t=>/^Справа сундук\. Четыре шага\.$/.test(t))&&подход.повтор.length===0,подход);
 check('3. свайп двумя пальцами вверх в подземелье — что рядом: сторона и шаги',
  рядом.some(t=>/^Рядом: справа сундук, (один шаг|два шага|три шага)\./.test(t)),рядом);
 check('4. флажок выключен — молчит; со сторонами света — «на востоке»; при «только звук» — молчит',
  выкл.выкл.length===0&&выкл.компас.some(t=>/^На востоке сундук\. Четыре шага\.$/.test(t))&&выкл.звук.length===0,выкл);
 check('4б. дальность «2 шага»: сундук называется только на четвёртом шаге к нему, за два шага',
  выкл.дальность2.slice(0,3).every(x=>x.length===0)&&выкл.дальность2[3].some(t=>/^Справа сундук\. Два шага\.$/.test(t)),выкл.дальность2);

 /* ── 5. флажки в настройках ── */
 const флажки=await page.evaluate(()=>{
  const a=document.getElementById("setSayAchieve"),b=document.getElementById("setApproach"),c=document.getElementById("setApproachR");
  const r={есть:!!a&&!!b,разделA:a&&a.closest("[data-set-group]").dataset.setGroup,разделB:b&&b.closest("[data-set-group]").dataset.setGroup};
  b.checked=false;b.dispatchEvent(new Event("change"));r.сохранено=JSON.parse(store.get("gm29set")||"{}").approach===0;
  b.checked=true;b.dispatchEvent(new Event("change"));
  a.checked=false;a.dispatchEvent(new Event("change"));r.сохраненоA=JSON.parse(store.get("gm29set")||"{}").sayAchieve===0;
  a.checked=true;a.dispatchEvent(new Event("change"));
  r.дальностьЕсть=!!c&&c.options.length===6&&c.value==="4";c.value="6";c.dispatchEvent(new Event("change"));
  r.дальность6=approachR()===6&&JSON.parse(store.get("gm29set")||"{}").approachR==="6";c.value="4";c.dispatchEvent(new Event("change"));
  return r;});
 check('5. флажки «Озвучивать достижения…» (голос рассказчика) и «Называть объекты рядом» с дальностью 1–6 шагов (доступность) есть и сохраняются',
  флажки.есть&&флажки.разделA==="speech"&&флажки.разделB==="ui"&&флажки.сохранено&&флажки.сохраненоA&&флажки.дальностьЕсть&&флажки.дальность6,флажки);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\n${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 await browser.close();
})();
