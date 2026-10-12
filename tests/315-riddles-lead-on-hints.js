/* ════════════════════════════════════════════════════════════════════════
   НАБОР 315: 15.0 — ЗАГАДКИ ВЕДУТ ДАЛЬШЕ, У КАЖДОЙ — НЕБОЛЬШАЯ ПОДСКАЗКА

   Просьба игрока: «проверь, чтобы все загадки, как логические, так и
   другие, вели к чему-то — к продолжению загадки или к тому, что натолкнёт
   на продолжение; и чтобы у трудной загадки были небольшие подсказки —
   не ответ, а намёк».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Логическая загадка яруса — настоящая, из списка загадок, и разная в
      разных подземельях; надпись у рычагов называет второй рычаг словами,
      которые подходят только к нему.
   2. Замку, которому нужна загадка яруса, загадка на этом ярусе есть.
   3. Окно загадки яруса: «Подсказка» — две ступени, вторая вычёркивает
      неверные ответы; ответа целиком нет.
   4. Решённая загадка говорит, что дальше: комбинацию к запертому
      механизму (и механизм её принимает); награда «ход» не бывает пустой.
   5. Житель, знающий машины, называет комбинацию.
   6. Чертог: подсказки головоломки (где ключ, первый шаг), запертого хода
      с загадкой и с рунами, плиты-загадки.
   7. Череп загадывает по-настоящему: мимо — другая загадка; угадали —
      пароль яруса.
   8. Ключ из головоломки — к запертой двери яруса, и слово говорит, к какой.
   9. Шут Кривой Короны и зачёт Буревала: подсказка вычёркивает один ответ;
      после ответа — что дальше.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;G.tutorDone=1;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;safeFn(()=>{Actors.tick=()=>{};Actors.ensure=()=>{};});
  window.__кнопки=(sel)=>[...document.querySelectorAll(sel+" [data-cmd]")].map(b=>({cmd:b.dataset.cmd,t:b.textContent}));
  window.__строки=(sel)=>[...document.querySelectorAll(sel+" .list-line")].map(b=>b.textContent);
  /* подземелья мира: первые четыреста */
  window.__подземелья=()=>{if(window.__пз)return window.__пз;const out=[];
   for(let x=1000;x<90000&&out.length<400;x+=37)for(let y=1000;y<1600&&out.length<400;y+=41){const cc=cellContent(x,y);
    if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon")out.push({x,y,t:cc.structure.type});}
   return (window.__пз=out);};
  window.__в=(d,tier)=>{G.place={kind:"dungeon",bx:d.x,by:d.y,stype:d.t,depth:tier,x:2,y:2,name:"Подземелье"};safeFn(()=>curLevel());return Deep.here();};
  /* чертог — как в наборе 275 */
  window.__T={
   find(pred,from){for(let k=0;k<CH_N;k++){const i=((from||0)+k*37)%CH_N;const s=Chertog.spec(i);if(s.type==="group"||s.type==="raid"||s.unique)continue;for(let f=0;f<s.floors;f++){InstanceGenerator._fc=new Map();const F=InstanceGenerator.floor(i,f,1);const x=pred(F,s);if(x)return {i,f,x};}}return null;},
   start(i,f,room){const s=Chertog.spec(i);G.ch={seal:6};G.level=Math.max(40,s.level);G.hpMax=900;G.hp=900;G.mana=400;G.manaMax=400;G.gold=3000;G.day=20;G.hv=null;G.poisoned=null;G.buffs={};G.faith={[s.god]:9};
    G.place=null;InstanceGenerator._fc=new Map();Chertog.enter({i,x:G.x,y:G.y},0);const r=Chertog.run();r.v=1;InstanceState.rec(i).v=1;r.floor=f;r.room=room||0;InstanceGenerator._fc=new Map();while(activeLayer())closeTopUI();return Chertog.cur();}};});

 /* ── 1. логическая загадка и рычаги ── */
 const з1=await page.evaluate(()=>{const o={загадок:0,чужих:0,вопросы:new Set(),рычагов:0,кривых:[],замкиБез:[]};const qs=new Set(CH_RIDDLES.map(r=>r[0]));
  const ОП={"Солнце":"светит днём","Луна":"растёт и убывает","Звезда":"ведёт путников ночью","Ключ":"отпирает двери"};
  for(const d of __подземелья()){const s=Deep.spec(d.x,d.y,d.t);
   for(const p of s.puzzles){if(p.type==="riddle"){o.загадок++;o.вопросы.add(p.q);const rr=CH_RIDDLES.find(r=>r[0]===p.q);
     if(!qs.has(p.q)||!rr||p.a!==rr[1]||p.opts.length!==4||p.opts.indexOf(p.a)<0)o.чужих++;}
    if(p.type==="levers"){o.рычагов++;const S=p.sym.map(z=>z[0]);if(p.о.indexOf("то, что "+ОП[S[p.ans[1]]])<0||p.о.indexOf(S[p.ans[0]])<0||p.о.indexOf(S[p.ans[2]])<0)o.кривых.push(p.о);}}
   for(const L of s.locks){const K=DEEP_LOCK_KINDS[L.kind];
    if(K.треб==="puzzle"&&!s.puzzles.some(p=>p.tier===L.tier))o.замкиБез.push(L.kind+"@"+L.tier);
    if(K.треб==="timepz"&&!s.puzzles.some(p=>p.tier===L.tier&&p.type==="time"))o.замкиБез.push(L.kind+"@"+L.tier);}}
  o.разных=o.вопросы.size;delete o.вопросы;o.кривых=o.кривых.slice(0,2);o.замкиБез=o.замкиБез.slice(0,4);return o;});
 check('1. логическая загадка яруса — из списка загадок (вопрос, верный ответ и три неверных), разная в разных подземельях; надпись у рычагов называет второй рычаг только его приметой',
  з1.загадок>=10&&!з1.чужих&&з1.разных>=6&&з1.рычагов>=5&&!з1.кривых.length,з1);
 check('2. замку, которому нужна загадка своего яруса (рунный, многорычажный, временной), загадка на этом ярусе есть',!з1.замкиБез.length,з1);

 /* ── 3. окно загадки: две подсказки, вычеркнутые ответы ── */
 const з3=await page.evaluate(()=>{let hit=null;
  for(const d of __подземелья()){const s=Deep.spec(d.x,d.y,d.t);const p=s.puzzles.find(q=>q.type==="riddle");if(p){hit={d,p:p.id,tier:p.tier};break;}}
  if(!hit)return {нет:1};const s=__в(hit.d,hit.tier);const x=Deep.st(s);const p=s.puzzles.find(q=>q.id===hit.p);delete x.solved[p.id];x.hint150={};
  Deep.near=()=>true;const o={};
  Deep.puzzle(p.id);let к=__кнопки("#dpBody");o.ответов0=к.filter(b=>/^dp:pzans:/.test(b.cmd)).length;o.кнопка0=к.some(b=>b.cmd==="dp:pzhint:"+p.id);
  Deep.cmd("pzhint:"+p.id);o.строки1=__строки("#dpBody").filter(t=>/^Подсказка \d/.test(t));к=__кнопки("#dpBody");o.ответов1=к.filter(b=>/^dp:pzans:/.test(b.cmd)).length;
  Deep.cmd("pzhint:"+p.id);o.строки2=__строки("#dpBody").filter(t=>/^Подсказка \d/.test(t));к=__кнопки("#dpBody");o.ответов2=к.filter(b=>/^dp:pzans:/.test(b.cmd)).map(b=>b.t.toLowerCase());
  o.кнопка2=к.some(b=>/pzhint/.test(b.cmd));o.верный=o.ответов2.indexOf(p.a.toLowerCase())>=0;
  /* другая загадка — колокола: подсказка о числе ударов и первом звуке */
  const pb=Deep.genPuzzle("p_bells_t","bells",hit.tier,Deep.rng(7));s.puzzles.push(pb);const H=Загадки150.депПодсказки(pb);o.колокол=H[1];o.колоколОк=H[1]===`Первым звучит ${pb.sym[pb.ans[0]][0]}.`;
  s.puzzles.pop();delete Deep.near;while(activeLayer())closeTopUI();return o;});
 check('3. в окне загадки «Подсказка»: первая ступень — неверный ответ отпал, вторая — ещё один; остаются два ответа с верным, кнопки больше нет; у колоколов вторая подсказка — первый звук',
  !з3.нет&&з3.ответов0===4&&з3.кнопка0&&з3.строки1.length===1&&з3.ответов1===3&&з3.строки2.length===2&&з3.ответов2.length===2&&з3.верный&&!з3.кнопка2&&з3.колоколОк,з3);

 /* ── 4. что дальше: комбинация к механизму; «ход» не пустой ── */
 const з4=await page.evaluate(()=>{let hit=null;
  for(const d of __подземелья()){const s=Deep.spec(d.x,d.y,d.t);const p=s.puzzles.find(q=>["bells","runes","levers"].includes(q.type));
   const m=s.mechs.find(m=>!["core","console","guard","generator","lift","door","valve","space"].includes(m.kind));if(p&&m){hit={d,p:p.id,m:m.id,tier:p.tier};break;}}
  if(!hit)return {нет:1};const s=__в(hit.d,hit.tier);const x=Deep.st(s);const p=s.puzzles.find(q=>q.id===hit.p);const m=s.mechs.find(z=>z.id===hit.m);
  for(const q of s.mechs)Deep.setM(x,q,"ok");Deep.setM(x,m,"combo");x.code=false;delete x.know.consolecode;delete x.know["mcode"+m.id];delete x.solved[p.id];
  for(const L of s.locks)x.locks[L.id]=1;
  Deep.near=()=>true;const o={};__said=[];Deep.pzSolve(s,x,p);o.слово=__said.find(t=>/^Загадка решена!/.test(t))||"";o.знает=!!x.know["mcode"+m.id];
  G.place.depth=m.tier;Deep.mechAct(m.id,"code");o.состояние=Deep.mst(x,m);
  /* «ход» без тайных ходов на ярусе */
  const p2=s.puzzles.find(q=>q.id!==p.id)||p;delete x.solved[p2.id];const был=p2.reward;p2.reward="ход";for(const z of s.secrets)if(z.tier===p2.tier)x.found[z.id]=1;
  const g0=G.gold;__said=[];Deep.pzSolve(s,x,p2);o.ход=__said.find(t=>/^Загадка решена!/.test(t))||"";o.золото=G.gold-g0;p2.reward=был;
  delete Deep.near;while(activeLayer())closeTopUI();return o;});
 check('4. решённая загадка говорит, что дальше: комбинация к запертому механизму — и механизм её принимает; награда «ход» не бывает пустым щелчком',
  !з4.нет&&/комбинация/.test(з4.слово)&&з4.знает&&з4.состояние==="active"&&!/щёлкнул скрытый засов/.test(з4.ход)&&(/(найден тайный путь:|открыл(?:ся|ась|ось)) .+ на \d+-м ярусе/.test(з4.ход)||з4.золото>0),з4);

 /* ── 5. житель, знающий машины, помнит комбинацию ── */
 const з5=await page.evaluate(()=>{let hit=null;
  for(const d of __подземелья()){const s=Deep.spec(d.x,d.y,d.t);const m=s.mechs.find(m=>!["core","console","guard","generator","lift","door","valve","space"].includes(m.kind));
   if(s.npcs.length&&m){hit={d,m:m.id,tier:m.tier};break;}}
  if(!hit)return {нет:1};const s=__в(hit.d,hit.tier);const x=Deep.st(s);const m=s.mechs.find(z=>z.id===hit.m);const n=s.npcs[0];const знал=n.знает;n.знает="mech";
  for(const q of s.mechs)Deep.setM(x,q,"ok");Deep.setM(x,m,"combo");x.code=false;delete x.know["mcode"+m.id];const z=Deep.nst(x,n);z.att=20;z.t=hit.tier;z.st="жив";
  __said=[];Deep.ask(n.id);const o={слово:__said.find(t=>t.indexOf(n.n+":")===0)||"",знает:!!x.know["mcode"+m.id]};n.знает=знал;while(activeLayer())closeTopUI();return o;});
 check('5. житель, знающий машины, называет комбинацию к запертой: «Ввести комбинацию» у механизма сработает',!з5.нет&&з5.знает&&/Комбинацию я помню/.test(з5.слово)&&!/ярусе [^.«»]+\. [а-яё]/.test(з5.слово),з5);

 /* ── 6. чертог: головоломка, ход с загадкой и с рунами, плита ── */
 const з6=await page.evaluate(()=>{const T=__T;const o={};
  const h1=T.find(F=>F.rooms.find(r=>r.t==="puzzle"&&r.pz&&["levers","bells","runes","dials","tiles"].includes(r.pz.kind)&&F.rooms.some(q=>q.objs.some(z=>z.hint===r.id))));
  let c=T.start(h1.i,h1.f,h1.x.id);const клад=c.F.rooms.find(q=>q.objs.some(z=>z.hint===c.room.id));__said=[];
  Chertog.view();o.кнопка=__кнопки("#chBody").some(b=>b.cmd==="ch:pzhint");
  Chertog.cmd("pzhint");o.п1=__said.find(t=>/^Подсказка 1:/.test(t))||"";Chertog.cmd("pzhint");o.п2=__said.find(t=>/^Подсказка 2:/.test(t))||"";
  o.кнопкаПосле=__кнопки("#chBody").some(b=>b.cmd==="ch:pzhint");const pz=c.room.pz;
  const первый=pz.kind==="bells"?CH_BELLS[pz.ans[0]][0]:String(pz.ans[0]);o.п1Ок=o.п1.indexOf(`в комнате «${клад.name}»`)>=0;o.п2Ок=o.п2.indexOf(первый)>=0;Chertog.leave();
  const h2=T.find(F=>F.edges.find(e=>e.lock==="riddle"),11);c=T.start(h2.i,h2.f,h2.x.a);const e=h2.x;
  Chertog.edgeView(e.id);o.ответов0=__кнопки("#chBody").filter(b=>/^ch:ans:/.test(b.cmd)).length;Chertog.cmd("eh:"+e.id);Chertog.cmd("eh:"+e.id);
  const ост=__кнопки("#chBody").filter(b=>/^ch:ans:/.test(b.cmd)).map(b=>b.t);o.ответов2=ост.length;o.верныйЕсть=ост.some(t=>t==="Ответ: "+CH_RIDDLES[e.riddle][1]);
  o.ходСтроки=__строки("#chBody").filter(t=>/^Подсказка \d/.test(t)).length;Chertog.leave();
  const h3=T.find(F=>F.edges.find(e=>e.lock==="rune"),17);c=T.start(h3.i,h3.f,h3.x.a);const e3=h3.x;__said=[];Chertog.cmd("eh:"+e3.id);Chertog.cmd("eh:"+e3.id);
  o.руна1=__said.find(t=>/^Подсказка 1:/.test(t))||"";o.руна2=__said.find(t=>/^Подсказка 2:/.test(t))||"";o.руныОк=/в комнате «/.test(o.руна1)&&o.руна2.indexOf("Первая руна слова — "+e3.word[0])>=0;
  /* плита-загадка */
  const R=Chertog.rs(c.room.id);c.room.trap="riddleplate";delete R.t;InstanceTrapEngine.onEnter(Chertog.cur());const c2=Chertog.cur();
  o.плитаНайдена=R.t==="found";const до=(InstanceTrapEngine.buttons(c2).match(/trap:ans~/g)||[]).length;Chertog.cmd("trap:hint");Chertog.cmd("trap:hint");
  const после=InstanceTrapEngine.buttons(Chertog.cur());o.плита=[до,(после.match(/trap:ans~/g)||[]).length];o.плитаВерный=после.indexOf("trap:ans~"+Загадки150.плитаЗагадка(Chertog.cur())[1])>=0;
  Chertog.leave();return o;});
 check('6. чертог: у головоломки «Подсказка» — сперва в какой комнате надпись или фреска, потом первый шаг; у хода с загадкой подсказки вычёркивают два неверных ответа; у рунной арки — где слово и первая руна; у плиты-загадки — два неверных ответа',
  з6.кнопка&&з6.п1Ок&&з6.п2Ок&&!з6.кнопкаПосле&&з6.ответов0===4&&з6.ответов2===2&&з6.верныйЕсть&&з6.ходСтроки===2&&з6.руныОк&&з6.плитаНайдена&&з6.плита[0]===4&&з6.плита[1]===2&&з6.плитаВерный,з6);

 /* ── 7. череп ── */
 const з7=await page.evaluate(()=>{const T=__T;const o={};
  const h=T.find(F=>(F.npcs||[]).length&&F.edges.some(e=>e.lock==="riddle")?F.npcs[0]:null,23);const c=T.start(h.i,h.f,h.x.room);const n=InstanceNPCSystem.at(c,c.room.id);
  if(!n)return {нет:1};n.role="skull";const x=InstanceNPCSystem.ns(c,n);delete x.skWon;x.skTry=0;x.skHint=0;
  InstanceNPCSystem.act("riddle");o.окно=(document.getElementById("chTitle")||{}).textContent;const к=__кнопки("#chBody").filter(b=>/^ch:skans:/.test(b.cmd));o.ответов=к.length;
  const z1=Загадки150.черепЗагадка(c,n,x);const неверный=z1.q[2][0];__said=[];Chertog.cmd("skans:"+неверный);o.мимо=__said.some(t=>/Мимо!/.test(t));
  const z2=Загадки150.черепЗагадка(c,n,x);o.другая=z2.q[0]!==z1.q[0];
  __said=[];Chertog.cmd("skans:"+z2.q[1]);o.угадал=!!x.skWon;o.пароль=__said.find(t=>/клацает зубами/.test(t))||"";
  const дверь=c.F.edges.find(e=>e.lock==="riddle");o.парольОк=o.пароль.indexOf(CH_RIDDLES[дверь.riddle][1])>=0;Chertog.leave();return o;});
 check('7. череп загадывает по-настоящему: мимо — смех и другая загадка; угадали — называет пароль яруса (ответ немому привратнику)',
  !з7.нет&&з7.окно==="Загадки черепа"&&з7.ответов===4&&з7.мимо&&з7.другая&&з7.угадал&&з7.парольОк,з7);

 /* ── 8. ключ из головоломки — к запертой двери ── */
 const з8=await page.evaluate(()=>{const T=__T;const o={};
  const h=T.find(F=>{const r=F.rooms.find(r=>r.t==="puzzle"&&r.pz&&["levers","runes","dials","tiles"].includes(r.pz.kind));const d=F.edges.find(e=>e.lock==="door"&&["iron","bone","bronze"].includes(e.need));return r&&d?{r:r.id,d:d.id}:null;},29);
  const c=T.start(h.i,h.f,h.x.r);c.room.pzReward="key";delete Chertog.rs(c.room.id).p;c.r.pzSeq=[];c.r.keys={};const need=c.F.edges[h.x.d].need;
  __said=[];for(const v of c.room.pz.ans)InstancePuzzleEngine.step(String(v));o.слово=__said.find(t=>/Головоломка решена!/.test(t))||"";o.ключ=Chertog.key(need);
  o.ок=o.слово.indexOf(CH_KEYS[need])>=0&&/подходит к запертой двери/.test(o.слово);Chertog.leave();return o;});
 check('8. ключ из головоломки чертога — тот, что нужен запертой двери яруса, и слово говорит, к какой двери',з8.ок&&з8.ключ===1,з8);

 /* ── 9. шут и зачёт ── */
 const з9=await page.evaluate(()=>{const s=Spletenie.st();const o={};
  s.riddleNow=1;s.riddleDay=Spletenie.day();delete s.riddleHint;Spletenie.mView("korona");const до=__кнопки("#spBody").filter(b=>/^sp:riddle:/.test(b.cmd)).length;
  o.кнопка=__кнопки("#spBody").some(b=>b.cmd==="sp:riddlehint");Spletenie.cmd("riddlehint");
  const после=__кнопки("#spBody").filter(b=>/^sp:riddle:/.test(b.cmd));o.шут=[до,после.length];o.верныйЕсть=после.some(b=>b.cmd==="sp:riddle:"+SPL.riddles[1].верно);
  o.ответ=Spletenie.riddleAnswer(SPL.riddles[1].верно);
  s.school="stihii";s.examNow=3;s.examDay=Spletenie.day();delete s.examHint;Spletenie.mView("buria");const д2=__кнопки("#spBody").filter(b=>/^sp:exam:/.test(b.cmd)).length;
  Spletenie.cmd("examhint");const п2=__кнопки("#spBody").filter(b=>/^sp:exam:/.test(b.cmd));o.зачёт=[д2,п2.length];o.зачётВерный=п2.some(b=>b.cmd==="sp:exam:"+SPL.exams[3].верно);
  s.exams=1;o.сдан=Spletenie.examAnswer(SPL.exams[3].верно);while(activeLayer())closeTopUI();return o;});
 check('9. шут Кривой Короны и зачёт Буревала: подсказка вычёркивает один неверный ответ; после ответа — что дальше (следующая загадка, сколько зачётов до диплома)',
  з9.кнопка&&з9.шут[0]===3&&з9.шут[1]===2&&з9.верныйЕсть&&/Следующую загадку шут загадает через два дня/.test(з9.ответ)&&з9.зачёт[0]===3&&з9.зачёт[1]===2&&з9.зачётВерный&&/из пяти/.test(з9.сдан),з9);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
