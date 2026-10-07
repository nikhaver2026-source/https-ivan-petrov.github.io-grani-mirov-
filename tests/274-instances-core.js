/* Инстансы Грани (чертоги, 12.0): ядро движка по мастер-промпту игрока.
   «Каждый инстанс — самостоятельная история, экосистема и приключение, а не
   набор комнат и противников». Набор проверяет:
   — каталог: шесть тысяч разных имён, 25 категорий со своим откликом, шагом,
     фоном и правилом, гибриды, виды (одиночный, испытание одиночки,
     групповой, рейд), ранги, шесть сложностей, единственные и скрытые;
   — паспорт каждого инстанса: откуда, зачем, что сейчас, фракции,
     экономика, конфликт, опасности, тайна, атмосфера, правило;
   — генератор: постоянный слой (ходы, замки, механизмы, жители, книги) не
     зависит ни от захода, ни от сложности; каждый замок решаем — ключ,
     слово, мелодия, рычаг или механизм лежат до замка;
   — память мира: двери, механизмы, жители, головоломки помнятся между
     заходами в виде «F1.DOOR_07 = OPEN»; повторный заход меняет
     переменный слой; сохранение переживает круг через JSON;
   — единая шина: у модуля на событие ровно один обработчик. */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* ── 1. каталог ── */
 const кат=await p.evaluate(()=>{const r={};const names=new Set(),types={},cats={},ranks=[0,0,0,0,0,0,0];let hyb=0,uni=0,hid=0,lore=0;
  for(let i=0;i<CH_N;i++){const s=Chertog.spec(i);names.add(s.n);types[s.type]=(types[s.type]||0)+1;cats[s.cat.id]=1;ranks[s.rank]++;if(s.hybrid)hyb++;if(s.unique)uni++;if(s.hidden)hid++;
   const L=s.lore;if(L&&L.откуда&&L.зачем&&L.сейчас&&L.фракции.length&&L.экономика&&L.конфликт&&L.опасности&&L.тайна&&L.атмосфера&&L.правило)lore++;}
  Object.assign(r,{uniq:names.size,types,cats:Object.keys(cats).length,ranks,hyb,uni,hid,lore,diffs:INST_DIFFS.length,catsData:INST_CATS.length});
  r.catFields=INST_CATS.every(c=>c.акустика&&c.шаг&&c.фон.length>=2&&c.правило&&c.пр&&c.мех.length&&c.ловушки.length&&c.ресурс.length&&ROOM["inst_"+c.id]&&ROOM["inst_"+c.id].sec===c.акустика.sec);
  r.rules=new Set(INST_CATS.map(c=>c.правило)).size;r.hybRules=INST_HYBRID.every(h=>h.м&&h.ж&&h.ср&&h.мн&&h.правило);
  const raid=Array.from({length:CH_N},(_,i)=>Chertog.spec(i)).find(s=>s.type==="raid");r.raidParty=raid&&raid.party;r.raidRank=raid&&raid.rank;
  return r;});
 check('1. шесть тысяч чертогов с разными именами; 25 категорий — у каждой свой отклик, шаг, фон и правило; одиночные, испытания одиночки, групповые и рейды на пятерых; все семь рангов',
  кат.uniq===6000&&кат.cats===25&&кат.catsData===25&&кат.rules===25&&кат.catFields&&кат.types.solo>0&&кат.types.soloonly>0&&кат.types.group>0&&кат.types.raid>0&&кат.raidParty===5&&кат.raidRank>=4&&кат.ranks.every(x=>x>0),кат);
 check('1б. у каждого паспорт: откуда, зачем, что сейчас, фракции, экономика, конфликт, опасности, тайна, атмосфера, правило; гибриды, единственные, скрытые; шесть сложностей',
  кат.lore===6000&&кат.hyb>100&&кат.hybRules&&кат.uni>20&&кат.hid>100&&кат.diffs===6,кат);

 /* ── 2. генератор: постоянство и решаемость ── */
 const ген=await p.evaluate(()=>{const r={visitDiff:0,diffDiff:0,unsolvable:[],floors:0,mech:new Set(),locks:new Set(),secrets:new Set(),trapTypes:new Set(),npcs:0,books:new Set(),cues:new Set(),patrols:0};
  const sig=F=>JSON.stringify([F.edges.slice(0,F.n0-1).map(e=>[e.a,e.b,e.lock]),F.mechs.map(m=>[m.kind,m.room,m.state]),F.npcs.filter(n=>n.id<100).map(n=>[n.id,n.role,n.n,n.hidden]),F.books.map(b=>[b.kind,b.room])]);
  const st=Chertog.st();
  for(let k=0;k<60;k++){const i=(k*257+11)%CH_N;const s=Chertog.spec(i);
   for(let f=0;f<=s.floors;f++){r.floors++;
    InstanceGenerator._fc=new Map();const A=InstanceGenerator.floor(i,f,1);InstanceGenerator._fc=new Map();const B=InstanceGenerator.floor(i,f,9);if(sig(A)!==sig(B))r.visitDiff++;
    st.run={i,floor:f,room:0,diff:0,v:3,fs:{},keys:{},stats:{}};InstanceGenerator._fc=new Map();const C0=InstanceGenerator.floor(i,f,3);
    st.run.diff=5;InstanceGenerator._fc=new Map();const C5=InstanceGenerator.floor(i,f,3);st.run=null;if(sig(C0)!==sig(C5))r.diffDiff++;
    /* каждый замок дерева решаем в порядке номеров комнат: нужное лежит раньше */
    for(const F of [A,C5])for(const e of F.edges){if(e.id>=F.n0-1||e.lock==="open")continue;const before=x=>F.rooms.some(q=>q.id<e.b&&x(q));let ok=true;
     switch(e.lock){
      case "door":ok=e.need==="treasury"?F.rooms.some(q=>q.drop==="treasury"):before(q=>q.objs.some(o=>o.key===e.need));break;
      case "star":ok=F.rooms.some(q=>q.drop==="star")||before(q=>q.objs.some(o=>o.key==="star"));break;
      case "rune":ok=before(q=>q.objs.some(o=>o.word===e.id));break;case "note":ok=before(q=>q.objs.some(o=>o.melody===e.id));break;
      case "god":ok=before(q=>q.objs.some(o=>o.t==="altar"));break;case "gear":ok=before(q=>q.objs.some(o=>o.key==="gear"));break;
      case "sluice":ok=before(q=>q.objs.some(o=>o.t==="sluicelever"));break;case "hold":ok=before(q=>q.objs.some(o=>o.hold===e.id));break;
      case "mech":case "energy":ok=F.mechs[e.mech]&&F.mechs[e.mech].room<e.b;break;}
     if(!ok)r.unsolvable.push(`${i}/${f}/${e.id}:${e.lock}`);}
    A.mechs.forEach(m=>r.mech.add(m.kind));A.edges.forEach(e=>{r.locks.add(e.lock);if(e.sk)r.secrets.add(e.sk);if(e.cue)r.cues.add(e.cue);});
    A.rooms.filter(x=>x.trap).forEach(x=>r.trapTypes.add((INST_TRAPS.find(t=>t.id===x.trap)||{}).тип));r.npcs+=A.npcs.length;A.books.forEach(b=>r.books.add(b.kind));r.patrols+=A.patrols.length;}}
  for(const k of ["mech","locks","secrets","trapTypes","books","cues"])r[k]=r[k].size;r.unsolvable=r.unsolvable.slice(0,5);return r;});
 check('2. постоянный слой яруса — ходы, замки, механизмы, жители, книги — одинаков при любом заходе и любой сложности',ген.visitDiff===0&&ген.diffDiff===0,ген);
 check('2б. каждый замок решаем: ключ, слово, мелодия, алтарь, рычаг или механизм лежат в комнате до замка; в ярусах механизмы, тайные ходы со звуковыми признаками, ловушки, жители, книги и дозоры',
  ген.unsolvable.length===0&&ген.mech>=12&&ген.secrets>=8&&ген.cues>=5&&ген.trapTypes>=8&&ген.npcs>100&&ген.books>=9&&ген.patrols>20&&ген.locks>=14,ген);

 /* ── 3. заход, память мира, повторный заход ── */
 const пам=await p.evaluate(()=>{const r={};const pickE=()=>{for(const e of Chertog.near(600,true)){const s=Chertog.spec(e.i);if(s.type==="solo"&&!s.unique&&!s.dyn&&s.floors>=2)return e;}return null;};
  const e=pickE();G.ch={seal:6};G.level=40;G.hpMax=500;G.hp=500;G.x=e.x;G.y=e.y;G.day=10;const s=Chertog.spec(e.i);
  Chertog.enter(e);const run=Chertog.run();r.v1=run.v;r.title=document.getElementById("chTitle").textContent;
  const c=Chertog.cur();const F=Chertog.fs(0);
  /* открыть дверь, оживить механизм, убить жителя, решить головоломку */
  const door=c.F.edges.find(x=>x.id<c.F.n0-1&&x.lock!=="open"&&x.lock!=="shadow")||c.F.edges[1];F.e[door.id]="open";Inst.emit("doorOpened",{i:s.i,f:0,edge:door.id,lock:door.lock});
  const m=c.F.mechs[0];if(m){InstanceMechanismEngine.set(c,m.id,"ACTIVE","проверка");}
  const n=c.F.npcs.find(x=>x.id<100);if(n){Inst.emit("npcKilled",{i:s.i,f:0,npc:n.id});}
  const pz=c.F.rooms.find(x=>x.t==="puzzle");if(pz)Inst.emit("puzzleSolved",{i:s.i,f:0,room:pz.id});
  r.keys=InstanceState.dump(s.i);r.keyFmt=r.keys.every(x=>/^(F\d+\.[A-Z]+_\d{2}|[A-Z_]+) = /.test(x));
  r.doorKey=InstanceState.get(s.i,InstanceState.key(0,"DOOR",door.id));
  /* сохранение — через JSON */
  const snap=JSON.stringify(InstancePersistence.snapshot());InstancePersistence.restore(JSON.parse(snap));r.roundtrip=JSON.stringify(InstancePersistence.snapshot())===snap;
  Chertog.leave();r.leftRun=!Chertog.run();G.day=12;
  Chertog.enter(e);if(!Chertog.run())Chertog.cmd("diff:0");const run2=Chertog.run();r.v2=run2&&run2.v;
  const c2=Chertog.cur();const F2=Chertog.fs(0);r.doorStill=F2.e[door.id]==="open";r.mechStill=m?InstanceMechanismEngine.state(c2,m.id):"нет";
  r.npcGone=n?!InstanceNPCSystem.alive(c2,c2.F.npcs.find(x=>x.id===n.id)):true;r.pzStill=pz?!!(F2.r[pz.id]||{}).p:true;
  r.offline=document.getElementById("chBody").textContent.slice(0,600);
  /* переменный слой меняется от захода */
  let changed=0;for(let f=0;f<s.floors;f++){InstanceGenerator._fc=new Map();const a=InstanceGenerator.floor(s.i,f,1),b=InstanceGenerator.floor(s.i,f,2);
   if(JSON.stringify(a.rooms.map(x=>x.t))!==JSON.stringify(b.rooms.map(x=>x.t))||JSON.stringify(a.patrols)!==JSON.stringify(b.patrols))changed++;}
  r.varChanged=changed;Chertog.leave();return r;});
 check('3. память мира — ключи вида «F1.DOOR_07 = OPEN»; открытая дверь, ожившим механизм, погибший житель и решённая головоломка остаются такими при следующем заходе',
  пам.keyFmt&&пам.doorKey==="OPEN"&&пам.doorStill&&пам.mechStill==="ACTIVE"&&пам.npcGone&&пам.pzStill&&пам.v1===1&&пам.v2===2,пам);
 check('3б. повторный заход меняет переменный слой (логова, ловушки, дозоры) и рассказывает, что изменилось; сохранение переживает круг через JSON',
  пам.varChanged>0&&/чертог|помнит|следы/i.test(пам.offline)&&пам.roundtrip&&пам.leftRun,пам);

 /* ── 4. шина событий ── */
 const шина=await p.evaluate(()=>{const r={};r.mods=Object.keys(Inst.mods);r.dups=Object.keys(Inst.subs).filter(k=>new Set(Inst.handlers(k)).size!==Inst.handlers(k).length);
  let a=0,b=0;Inst.on("__проба","Проба",()=>a++);Inst.on("__проба","Проба",()=>b++);Inst.emit("__проба",{});r.once=Inst.handlers("__проба").length===1&&a===0&&b===1;delete Inst.subs.__проба;
  r.events=Object.keys(Inst.subs).length;r.stateSubs=["doorOpened","secretDiscovered","mechanismStateChanged","npcKilled","npcSaved","trapDisabled","resourceDepleted","bossKilled","puzzleSolved","outcomeChosen"].every(k=>Inst.handlers(k).includes("InstanceState"));
  r.manager=typeof Chertog.enter==="function"&&typeof Chertog.view==="function";return r;});
 const нужные=["InstanceGenerator","InstanceState","InstanceQuestEngine","InstanceNPCSystem","InstanceTrapEngine","InstanceMechanismEngine","InstancePuzzleEngine","InstanceLootEngine","InstanceBossEngine","InstanceMonsterAI","InstanceAudioEngine","InstanceEventEngine","InstanceDifficultyEngine","InstanceRewardEngine","InstancePersistence","InstanceDirectorIntegration"];
 check('4. все модули из мастер-промпта на месте и работают через одну шину: у модуля на событие ровно один обработчик, повторная подписка заменяет прежнюю',
  нужные.every(m=>шина.mods.includes(m))&&шина.manager&&шина.dups.length===0&&шина.once&&шина.stateSubs&&шина.events>=25,шина);

 check('5. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
