/* ════════════════════════════════════════════════════════════════════════
   НАБОР 317: СКАКУН ИДЁТ РЯДОМ, ОТПУСТИТЬ НА ВОЛЮ, ЕЗДА БЕЗ ШАГОВ ГЕРОЯ (15.5)

   Просьбы игрока: под седлом в звук езды вплетались обычные шаги, будто
   герой идёт сам; спешился — приливный конь оставался на месте, и, выйдя из
   подземелья, игрок оставался без маунта; везде — «дома, в зверинце», а не
   «в стойле»; маунта можно отпустить на волю, как питомца.
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
 await page.evaluate(()=>{settings.effects=1;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();};
  window.__ЧЕЛ=/(^|\/)(mtg\/[a-z]+_footstep|tread\/tread_(?!hoof)|steps\/|oc\/oc_step_|lug\/lug_step_|hero\/hero_step|gear\/)/;
  window.__звуки=[];const mk=Bank.make;Bank.make=function(f){__звуки.push(String(f));return mk.apply(this,arguments);};
  const ig=ЗвукСреда.играть;ЗвукСреда.играть=function(u){__звуки.push(String(u).replace(/^sounds\//,""));return ig.apply(this,arguments);};
  window.__конь=()=>{const s=Zver.st();const br=ZV_BREEDS.find(x=>x.fam==="horse");const a=Zver.make(br.id);s.list.push(a);a.сыт=90;a.верн=90;return a;};
  window.__прилив=Object.keys(MOUNT_BY_ID).find(k=>/прилив/i.test(MOUNT_BY_ID[k].n));
  window.__подземелье=(d)=>{G.place={kind:"dungeon",bx:25010,by:25100,stype:"cave_entrance",depth:d||2,name:"x",x:1,y:1};const L=curLevel();
   for(let y=1;y<L.h-1;y++)for(let x=1;x<L.w-2;x++)if(L.g[y][x]==="."&&L.g[y][x+1]==="."){G.place.x=x;G.place.y=y;return L;}return L;};
  window.__окноТекст=()=>((document.getElementById("mountsBody")||{}).textContent||"")+" "+((document.getElementById("petsBody")||{}).textContent||"");
  window.__кнопки=()=>[...document.querySelectorAll("#mountsBody [data-cmd],#petsBody [data-cmd]")].map(e=>e.textContent.trim());
  G.gold=3000;G.place=null;G.mounts=[];G.mount=null;});

 /* ── 1. таблицы шагов и езды: ни одного шага человека ── */
 const т=await page.evaluate(()=>{const files=x=>{x=String(x);if(x.indexOf("/")>=0)return [x];return (SOUND_BANK[x]&&SOUND_BANK[x].f)||["?"+x];};
  const bad=L=>[].concat(L||[]).flatMap(files).filter(f=>__ЧЕЛ.test(f)||f[0]==="?");const out=[];
  for(const f of ZV_FAMILIES){const p=ZV_SND[f.id]||{};for(const k of ["ш","е","бег","шз"]){const x=bad(p[k]);if(x.length)out.push(f.id+"."+k+":"+x[0]);}
   if(f.ход==="walk"&&!(p.е||p.ш))out.push(f.id+": нет шага");}
  for(const [id,P] of Object.entries(ZV_LEGRIDE150))for(const k of ["е","бег","вода","а"]){const x=bad(P[k]);if(x.length)out.push(id+"."+k+":"+x[0]);}
  return {плохих:out.slice(0,8),родов:ZV_FAMILIES.length,лапы:Bank.has("zv_paw_walk")&&Bank.has("zv_paw_run")};});
 check('1. у всех родов зверей и скакунов тайных палат шаг, езда, бег и примета — без шагов человека; есть шаги лап',т.плохих.length===0&&т.родов>=40&&т.лапы,т);

 /* ── 2. под седлом звучит только скакун: на карте, бегом и в подземелье ── */
 const е=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={};
  /* без случайных схваток в пути: шаги твари — её шаги, а проверяем езду */
  const ехать=async()=>{const sc=window.startCombat;window.startCombat=()=>false;if(G.inCombat)safeFn(()=>endCombat());
   try{return await ехать0();}finally{window.startCombat=sc;}};
  const ехать0=async()=>{const шагиГероя=[];const pl=window.playLeveled;window.playLeveled=function(r){шагиГероя.push(String(r));return pl.apply(this,arguments);};
   ZvSnd.журнал.length=0;const жур=[];const note=ZvSnd.note;ZvSnd.note=function(f,g){жур.push(String(f));return note.apply(this,arguments);};
   try{for(let i=0;i<4;i++){move(["E","W"][i%2]);await sl(420);}
    safeFn(()=>{runState.active=true;});for(let i=0;i<3;i++){move(["E","W"][i%2]);await sl(360);}safeFn(()=>{runState.active=false;});
    __подземелье(2);for(let i=0;i<3;i++){moveInside(["E","W"][i%2]);await sl(420);}G.place=null;}
   finally{window.playLeveled=pl;ZvSnd.note=note;}
   /* шаг героя (playLeveled — его единственный путь) верхом не звучит; всё, что звучит у седла, — ход скакуна */
   return {шагиГероя:шагиГероя.filter(r=>/^(tread_|step_|mtg_step_|lug_step_|oc_step_|hero_step_|gear_)/.test(r)),человек:жур.filter(f=>__ЧЕЛ.test(f)),
    скакун:жур.filter(f=>/zv_ride_|tread_hoof|horse_step|oc_splash|oc_swim|zv_hoof|zvlapy/.test(f)).length};};
  const a=__конь();o.сесть=Zver.ride(a.uid);o.конь=await ехать();
  G.mounts=[__прилив];Stable.call("leg:"+__прилив);o.пересел=Stable.mountUp("leg:"+__прилив);o.прилив=await ехать();
  o.гдеКонь=Stable.mWhere(Stable.mBy("zv:"+a.uid));return o;});
 check('2. под седлом коня и приливного коня — копыта и ход скакуна, ни одного шага героя (карта, бег, подземелье)',
  /^Вы верхом/.test(е.сесть)&&!е.конь.шагиГероя.length&&!е.конь.человек.length&&е.конь.скакун>=4&&!е.прилив.шагиГероя.length&&!е.прилив.человек.length&&е.прилив.скакун>=4,е);
 check('3. пересел на другого скакуна — прежний уходит домой, в зверинец, и это сказано',
  /уходит домой, в зверинец/.test(е.пересел)&&е.гдеКонь==="дома, в зверинце",{пересел:е.пересел,где:е.гдеКонь});

 /* ── 4. спутник, на котором сидите, следом не шагает ── */
 const сп=await page.evaluate(()=>{G.mount=null;const a=__конь();const s=Zver.st();s.pets=[a.uid];Zver.ride(a.uid);
  const zp=ZvSnd.play;let n=0;ZvSnd.play=function(){n++;return false;};const later=ZvSnd.later;ZvSnd.later=(ms,fn)=>fn();
  try{for(let i=0;i<4;i++){ZvWalk.n++;ZvWalk.follow();}}finally{ZvSnd.play=zp;ZvSnd.later=later;}
  const o={верхом:Stable.riding(),шагов:n};Zver.dismount&&Zver.dismount();s.pets=[];Маунт155.домой("zv:"+a.uid);return o;});
 check('4. спутник, на котором вы сидите, не шагает ещё и следом',/^zv:/.test(сп.верхом)&&сп.шагов===0,сп);

 /* ── 5. спешился — скакун идёт рядом; из подземелья выходит с вами ── */
 const р=await page.evaluate(()=>{const o={};const k="leg:"+__прилив;G.mounts=[__прилив];Stable.call(k);Stable.mountUp(k);
  o.текст=Stable.dismountHere();o.pos=JSON.stringify(Stable.st().pos[k]);
  __подземелье(3);o.вПодземелье=Stable.mWhere(Stable.mBy(k));o.близко=!!Stable.posNear(Stable.st().pos[k],1);
  G.place=null;o.наКарте=Stable.mWhere(Stable.mBy(k));o.объектом=Stable.near(1).length;
  o.кнопка=(Stable.mountView(k),__кнопки().find(t=>/рядом$/.test(t))||"");__закрыть();
  /* «Что вокруг»: скакун есть, как сундук; «Действие здесь» — при другом деле здесь не сажает, без дела — сажает */
  const об=objectsHere(true).filter(x=>x.вид==="mount");o.вОкне=об.map(x=>x.n);o.действия=об[0]?actionsFor(об[0]).map(a=>a.n):[];
  if(G.inCombat)safeFn(()=>endCombat());const bm=BeastMeet.here;BeastMeet.here=()=>null;   /* случайная встреча в пути — не помеха проверке */
  const oh=window.oh0objs;window.oh0objs=()=>[{n:"сундук",вид:"chest",d:0}];let уж;try{Маунт155.зван=null;уж=Stable.riding();useHere();o.приДеле=Stable.riding();}finally{window.oh0objs=oh;}
  __закрыть();window.oh0objs=()=>[];try{useHere();o.безДела=Stable.riding();}finally{window.oh0objs=oh;BeastMeet.here=bm;}
  if(Stable.riding())Stable.dismountHere();__закрыть();return o;});
 check('5. спешились — скакун идёт рядом с вами, и в подземелье, и после выхода; сесть снова можно отовсюду',
  /идёт рядом с вами/.test(р.текст)&&р.pos==='{"w":"рядом"}'&&р.вПодземелье==="идёт рядом с вами"&&р.наКарте==="идёт рядом с вами"&&р.близко&&/рядом$/.test(р.кнопка),р);
 check('6. идущий рядом скакун не твердится в «что рядом», но в окне «Что вокруг» он есть, как сундук; «Действие здесь» сажает в седло, только когда больше делать здесь нечего',
  р.объектом===0&&р.вОкне.length===1&&/идёт рядом/.test(р.вОкне[0])&&р.действия.some(n=>/Забраться|Сесть|Взлететь/.test(n))&&!р.приДеле&&/^leg:/.test(р.безДела||""),
  {объектом:р.объектом,вОкне:р.вОкне,действия:р.действия,приДеле:р.приДеле,безДела:р.безДела});

 /* ── 7. «Оседлать зверя» — на любого скакуна ── */
 const о=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));__said.length=0;CMD.zvride();await sl(1100);
  const o={верхом:Stable.riding(),слова:__said.slice()};__said.length=0;CMD.zvride();await sl(1000);o.слез=Stable.riding();o.слова2=__said.slice();
  o.доступно=amAvailable("zvride");return o;});
 check('7. «Оседлать зверя» сажает и на скакуна тайных палат (на последнего, на ком ехали), и спешивает; слова — после звука седла',
  о.верхом==="leg:"+(await page.evaluate(()=>__прилив))&&о.слова.some(t=>/в седле/.test(t))&&!о.слез&&о.слова2.some(t=>/идёт рядом/.test(t))&&о.доступно,о);

 /* ── 8. «дома, в зверинце» — везде, «в стойле» — нигде ── */
 const д=await page.evaluate(()=>{const k="leg:"+__прилив;const o={};const a=__конь();
  Stable.mountsHome();o.маунты=__окноТекст();__закрыть();Stable.mountView("zv:"+a.uid);o.вид=__окноТекст();__закрыть();
  Stable.petsHome();o.питомцы=__окноТекст();Stable.petView(a.uid);o.питомец=__окноТекст()+" "+__кнопки().join(" ");__закрыть();
  o.взять=Zver.follow(a.uid);o.оставить=Zver.follow(a.uid);
  return {стойло:/стойл/.test(o.маунты+o.вид+o.питомцы+o.питомец+o.взять+o.оставить),дома:/дома, в зверинце/.test(o.вид+o.питомец+o.оставить),
   сошли:/Скакун, с которого вы сошли, идёт рядом с вами/.test(o.маунты),оставить:o.оставить};});
 check('8. в окнах «Маунты» и «Питомцы» и в словах о спутниках — «дома, в зверинце», нигде не «в стойле»',!д.стойло&&д.дома&&д.сошли,д);

 /* ── 9. «Оставить дома» и «Позвать к себе» ── */
 const х=await page.evaluate(()=>{const k="leg:"+__прилив;const o={};Stable.mountView(k);o.кнопкаДома=__кнопки().includes("Оставить дома, в зверинце");
  Stable.mntCmd("home155:"+k);o.дома=Stable.mWhere(Stable.mBy(k));Stable.mountView(k);o.позвать=__кнопки().find(t=>/^Позвать к себе/.test(t))||"";
  o.зов=Stable.call(k);o.после=Stable.mWhere(Stable.mBy(k));__закрыть();return o;});
 check('9. «Оставить дома, в зверинце» отправляет скакуна домой; «Позвать к себе» приводит его, и он идёт рядом',
  х.кнопкаДома&&х.дома==="дома, в зверинце"&&/дома, в зверинце/.test(х.позвать)&&/идёт рядом с вами/.test(х.зов)&&х.после==="идёт рядом с вами",х);

 /* ── 10. отпустить на волю ── */
 const в=await page.evaluate(()=>{const k="leg:"+__прилив;const o={};const s=Zver.st();Stable.st().legGear[__прилив]={saddle:"leather"};const g0=Object.values(s.gear).reduce((a,b)=>a+b,0);
  Stable.mountView(k);o.кнопка=__кнопки().includes("Отпустить на волю");
  Stable.mntCmd("free:"+k);o.вопрос=__окноТекст();o.варианты=__кнопки();
  Stable.mntCmd("view:"+k);o.передумал=!!Stable.mBy(k);
  Stable.mntCmd("free:"+k+":yes");o.нет=!Stable.mBy(k)&&!(G.mounts||[]).includes(__прилив);o.снаряжение=Object.values(s.gear).reduce((a,b)=>a+b,0)-g0;
  const a=__конь();const kz="zv:"+a.uid;Stable.mntCmd("free:"+kz+":yes");o.зверь=!Stable.mBy(kz)&&!s.list.some(x=>x.uid===a.uid);
  o.слова=__said.slice(-3);__закрыть();return o;});
 check('10. маунта можно отпустить на волю: кнопка, вопрос с «Нет, оставить», уходит навсегда; снаряжение скакуна тайных палат — в сумке',
  в.кнопка&&/уйдёт на волю навсегда/.test(в.вопрос)&&в.варианты.some(t=>/^Да, отпустить/.test(t))&&в.варианты.includes("Нет, оставить")&&в.передумал&&в.нет&&в.снаряжение===1&&в.зверь,в);

 /* ── 11. старое сохранение: скакун, оставленный «там, где сошли», идёт рядом ── */
 const с=await page.evaluate(async()=>{const a=__конь();const k="zv:"+a.uid;const b=Stable.st();delete b.v155;b.pos[k]={w:"world",x:G.x+40,y:G.y+40};
  const o={было:JSON.stringify(b.pos[k])};Stable.st();o.стало=JSON.stringify(Stable.st().pos[k]);o.где=Stable.mWhere(Stable.mBy(k));
  saveGame(true);await new Promise(r=>setTimeout(r,300));loadGame();await new Promise(r=>setTimeout(r,800));
  o.послеЗагрузки=Stable.mWhere(Stable.mBy(k));return o;});
 check('11. старое сохранение: скакун, оставленный на месте, после загрузки идёт рядом с вами, и это сохраняется',
  с.стало==='{"w":"рядом"}'&&с.где==="идёт рядом с вами"&&с.послеЗагрузки==="идёт рядом с вами",с);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
