/* ══════════════════════════════════════════════════════════════════
   347 — НОЧНОЙ ДОЗОР СО СТРАЖЕЙ (3 ноября 2026, просьба игрока)
   «Чтобы игрок реально ходил со стражей в ночном дозоре, чтобы он мог
   навестись на стражу, и она озвучивалась, показывалась ему как тоже
   маячком. Только звук маяка должен быть другой». Проверяется:
   1. Ночью у поселения дозор выходит: двое стражников с именами и
      голосами, пять постов и возврат к воротам; днём — отказ.
   2. Маяк дозора включается сам, звенит кольчугой (не колокольчиком
      обычного маяка) и идёт за стражником.
   3. Стражники идут по постам, их шаги слышны с их стороны; отставшего
      героя десятник ждёт и зовёт голосом стражи.
   4. Стражники видны в осмотре; выбор — маяк на стражника; B называет,
      где он.
   5. Обход до конца: плата, опыт, отношение; снова — не раньше чем через
      двенадцать часов. Ушёл далеко — дозор уходит без героя.
   6. В деревне «Выйти в ночной дозор со стражей» — настоящий обход; у ворот
      ночью — «Пойти с ночным дозором вокруг стен»; в меню действий — пункт.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__сказано=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__сказано.push(String(t));return null;};
  window.__звук=[];const a0=Spatial.at.bind(Spatial);Spatial.at=function(f,dx,dy,o){window.__звук.push({f:String(f),dx,dy});return a0(f,dx,dy,o);};
  const r0=Spatial.role.bind(Spatial);Spatial.role=function(r,dx,dy,o){window.__звук.push({r:String(r),dx,dy});return r0(r,dx,dy,o);};
  const b0=Bank.play.bind(Bank);Bank.play=function(r,o){window.__звук.push({b:String(r)});return b0(r,o);};
  window.__реплики=[];const f0=Folk.реплика.bind(Folk);Folk.реплика=function(роль,строка,n,ж,o){window.__реплики.push({роль,строка,голос:o&&o.голос});return f0(роль,строка,n,ж,o);};
  /* поселения со стражей рядом */
  const x0=G.x,y0=G.y;window.__мест=[];
  for(let r=0;r<80&&window.__мест.length<4;r++)for(let dx=-r;dx<=r&&window.__мест.length<4;dx++)for(const dy of [-r,r]){const c=safeFn(()=>cellContent(x0+dx,y0+dy),null);
   if(c&&c.structure&&ВОРОТА147[c.structure.type]&&!window.__мест.some(m=>m.x===c.x&&m.y===c.y))window.__мест.push({x:c.x,y:c.y,t:c.structure.type});}});
 const мест=await p.evaluate(()=>window.__мест);

 /* ── 1 ── */
 const п1=await p.evaluate(async(м)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  G.place=null;G.x=м.x;G.y=м.y;G.hour=13;const днём=Дозор.начать();const отказ=window.__сказано.slice(-1)[0]||"";
  G.hour=22;window.__сказано.length=0;Дозор.ШАГ=100000;const ок=Дозор.начать();const st=G.дозор;
  return {днём,отказ:отказ.slice(0,80),ок,идёт:Дозор.идёт(),стража:st.стража.map(g=>g.кто+" "+g.имя+" голос "+g.голос),постов:st.посты.length,
   конец:!!st.посты[st.посты.length-1].конец,имена:st.стража[0].имя!==st.стража[1].имя,голоса:st.стража[0].голос!==st.стража[1].голос};},мест[0]);
 check('1. днём дозор не выходит; ночью — двое стражников с разными именами и голосами, пять постов и возврат к воротам',
  мест.length>0&&!п1.днём&&/только ночью/.test(п1.отказ)&&п1.ок&&п1.идёт&&п1.постов===6&&п1.конец&&п1.имена&&п1.голоса,{мест,п1});

 /* ── 2 ── */
 const п2=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  await w(1300);const t=TargetBeacon.t;const g=Дозор.страж(0);
  /* отойти, чтобы маяк звенел */
  G.x=g.x+2;G.y=g.y;window.__звук.length=0;TargetBeacon.tick();await w(50);
  const пинг=window.__звук.filter(z=>z.f).map(z=>z.f);
  const колокол=пинг.some(f=>/bell_small/.test(f));const кольчуга=пинг.some(f=>/guard_mail/.test(f));
  const пуск=TargetBeacon.lastCue;
  /* стражник шагнул — маяк за ним */
  g.x+=3;TargetBeacon.tick();const следит=TargetBeacon.t&&TargetBeacon.t.x===g.x;
  return {цель:t&&t.n,дозор:!!(t&&t.дозор),пинг,колокол,кольчуга,пуск,следит};});
 check('2. маяк дозора включается сам, звенит кольчугой, а не колокольчиком обычного маяка, и идёт за стражником',
  п2.дозор&&/десятник/.test(п2.цель)&&п2.кольчуга&&!п2.колокол&&п2.пуск&&п2.пуск.дозор&&п2.следит,п2);

 /* ── 3 ── */
 const п3=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const st=G.дозор;const L=st.стража[0];st.стража.forEach(g=>{g.x=st.где.x;g.y=st.где.y;});G.x=L.x;G.y=L.y;st.тревог=2;
  const путь=[];window.__звук.length=0;
  for(let i=0;i<4;i++){G.x=L.x;G.y=L.y;Дозор.такт();clearTimeout(Дозор._t);путь.push(L.x+","+L.y);}
  const шаги=window.__звук.filter(z=>z.r==="step_dirt").length;
  /* отстал */
  const до=L.x+","+L.y;G.x=L.x+6;G.y=L.y;st.зов=0;window.__реплики.length=0;window.__сказано.length=0;Дозор.такт();clearTimeout(Дозор._t);
  const ждёт=(L.x+","+L.y)===до;const зов=window.__реплики.filter(r=>r.роль==="patrol").map(r=>r.строка);
  const подсказка=window.__сказано.find(t=>/ждёт вас/.test(t))||"";
  return {путь,шаги,ждёт,зов,подсказка:подсказка.slice(0,90),разные:new Set(путь).size};});
 check('3. стражники идут по постам, шаги слышны с их стороны; отставшего десятник ждёт и зовёт голосом стражи',
  п3.разные>=3&&п3.шаги>=3&&п3.ждёт&&п3.зов.length>=1&&/ждёт вас/.test(п3.подсказка),п3);

 /* ── 4 ── */
 const п4=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const st=G.дозор;const S=st.стража[1];G.x=S.x+3;G.y=S.y+1;
  const list=Look.scan(6);const стр=list.filter(o=>o.дозор);
  Look.list=list;const i=list.findIndex(o=>o.дозор&&o.кто===1);if(i>=0)Look.select(i);await w(50);
  const t=TargetBeacon.t;window.__сказано.length=0;beaconWhere();const где=window.__сказано.slice(-1)[0]||"";
  return {вОсмотре:стр.map(o=>o.n),цель:t&&t.n,кто:t&&t.кто,дозор:!!(t&&t.дозор),где:где.slice(0,80)};});
 check('4. стражники видны в осмотре живыми целями; выбор — маяк дозора на стражника; B называет, где он',
  п4.вОсмотре.length===2&&п4.дозор&&п4.кто===1&&/стражник/.test(п4.цель)&&/стражник/.test(п4.где)&&/(шаг|рядом)/.test(п4.где),п4);

 /* ── 5 ── */
 const п5=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const st=G.дозор;const L=st.стража[0];st.тревог=2;const g0=G.gold,x0=G.xp,l0=G.level;
  for(let i=0;i<200&&Дозор.идёт();i++){G.x=L.x;G.y=L.y;G.inCombat=false;Дозор.такт();clearTimeout(Дозор._t);}
  const конец=!Дозор.идёт();const итог=window.__сказано.find(t=>/Дозор окончен/.test(t))||"";
  const снова=Дозор.начать(cellContent(st.где.x,st.где.y));const отказ=window.__сказано.slice(-1)[0]||"";
  return {конец,плата:G.gold-g0,опыт:G.xp!==x0||G.level!==l0,итог:итог.slice(0,140),снова,отказ:отказ.slice(0,100),маякСнят:!(TargetBeacon.t&&TargetBeacon.t.дозор)};});
 check('5а. обход до конца: плата, опыт и отношение, маяк дозора гаснет; снова — не раньше чем через двенадцать часов',
  п5.конец&&п5.плата>0&&п5.опыт&&/Отношение/.test(п5.итог)&&!п5.снова&&/через \d+/.test(п5.отказ)&&п5.маякСнят,п5);
 const п5б=await p.evaluate(async(м)=>{if(!м)return {нет:true};
  G.x=м.x;G.y=м.y;G.place=null;G.hour=23;Дозор.ШАГ=100000;const ок=Дозор.начать();clearTimeout(Дозор._t);
  const L=Дозор.страж(0);G.x=L.x+15;G.y=L.y;window.__сказано.length=0;Дозор.такт();clearTimeout(Дозор._t);
  return {ок,ушёл:!Дозор.идёт(),слово:(window.__сказано.slice(-1)[0]||"").slice(0,100)};},мест[1]);
 check('5б. ушёл дальше двенадцати шагов — дозор уходит без героя',п5б.нет||(п5б.ок&&п5б.ушёл&&/без вас/.test(п5б.слово)),п5б);

 /* ── 6 ── */
 const п6=await p.evaluate(async(мест)=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const out={};const д=мест.find(m=>m.t==="village");
  if(д){G.x=д.x;G.y=д.y;G.place=null;G.hour=22;G.дозор.кд={};delete Хозяйство170.ст()[Хозяйство170.имяДеревни(cellContent(д.x,д.y))+":dozor"];
   const р=Хозяйство170.РАБОТЫ.find(x=>x.id==="dozor");out.работа=р.n;out.деревня=Хозяйство170.сделать("dozor");out.идёт=Дозор.идёт();
   if(Дозор.идёт())Дозор.бросить("проба");}
  const к=мест.find(m=>m.t!=="village")||мест[0];G.x=к.x;G.y=к.y;G.place=null;G.hour=22;G.дозор.кд={};
  while(activeLayer())closeTopUI();Стража147.встреча(cellContent(к.x,к.y));await w(100);
  const lay=activeLayer();out.ворота=lay?[...lay.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(t=>/дозор/i.test(t)):[];
  while(activeLayer())closeTopUI();
  out.меню=amAvailable("dozor");out.пункт=AM_GROUPS.find(x=>x[0]==="Мир")[1].some(z=>z[0]==="dozor");
  G.hour=12;out.меню_днём=amAvailable("dozor");return out;},мест);
 check('6. в деревне «Выйти в ночной дозор со стражей» — настоящий обход; у ворот ночью — «Пойти с ночным дозором»; в меню действий — пункт ночью, днём — нет',
  (п6.работа===undefined||(/ночной дозор/.test(п6.работа)&&п6.деревня&&п6.идёт))&&п6.ворота.length>=1&&п6.меню&&п6.пункт&&!п6.меню_днём,п6);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;console.log(`\n${results.length-fail} passed, ${fail} failed`);
 await browser.close();process.exit(fail?1:0);})();
