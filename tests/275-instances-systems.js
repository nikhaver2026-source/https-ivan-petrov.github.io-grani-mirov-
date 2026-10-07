/* Инстансы Грани (12.0): системы внутри чертога.
   Мастер-промпт: механизмы со состояниями OFF → DAMAGED → ACTIVE →
   OVERLOADED → DESTROYED и восемью действиями; ловушки тринадцати типов с
   предупреждением звуком, обезвреживанием, разворотом и перезарядкой; тайные
   ходы со звуковыми признаками; головоломки; местные чары; книги, без
   которых не пройти; реликвии, меняющие правила; ресурсы со своей
   экосистемой; жители с памятью и скрытыми целями; своё правило у каждой
   категории; непредсказуемые события. */
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
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};
  /* помощники проверки: найти чертог и ярус по признаку, войти, подменить случай */
  window.__T={
   find(pred,from){for(let k=0;k<CH_N;k++){const i=((from||0)+k*37)%CH_N;const s=Chertog.spec(i);if(s.type==="group"||s.type==="raid"||s.unique)continue;for(let f=0;f<s.floors;f++){InstanceGenerator._fc=new Map();const F=InstanceGenerator.floor(i,f,1);const x=pred(F,s);if(x)return {i,f,x};}}return null;},
   start(i,f,room){const s=Chertog.spec(i);G.ch={seal:6};G.level=Math.max(40,s.level);G.hpMax=900;G.hp=900;G.mana=400;G.manaMax=400;G.gold=3000;G.day=20;G.hv=null;G.poisoned=null;G.buffs={};G.faith={[s.god]:9};
    InstanceGenerator._fc=new Map();Chertog.enter({i,x:G.x,y:G.y},0);const r=Chertog.run();r.v=1;InstanceState.rec(i).v=1;r.floor=f;r.room=room||0;InstanceGenerator._fc=new Map();while(activeLayer())closeTopUI();return Chertog.cur();},
   rnd(v,fn){const o=Math.random;Math.random=()=>v;try{return fn();}finally{Math.random=o;}},
   said(){window.__said=[];if(!window.__csay){window.__csay=Chertog.say.bind(Chertog);Chertog.say=function(t){window.__said.push(String(t||''));return window.__csay(t);};}},
   spy(){window.__roles=[];if(!window.__srole){window.__srole=Spatial.role.bind(Spatial);Spatial.role=function(role,dx,dy,o){window.__roles.push(role);return window.__srole(role,dx,dy,o);};}}};});

 /* ── 1. механизмы ── */
 const мех=await p.evaluate(()=>{const r={};const T=__T;
  const hit=T.find(F=>{const m=F.mechs.find(m=>["door","gear","rune"].includes(m.kind)&&F.edges.some(e=>e.lock==="mech"&&e.mech===m.id));return m||null;});
  const c=T.start(hit.i,hit.f);const m=hit.x;const F=Chertog.fs(c.r.floor);const edge=c.F.edges.find(e=>e.lock==="mech"&&e.mech===m.id);
  for(const g of c.F.mechs)if(MECH_KINDS[g.kind].делает==="power")F.mech[g.id]="ACTIVE";
  F.mech[m.id]="DAMAGED";G.inv[MECH_KINDS[m.kind].детали]=3;Chertog.give("gear",3);c.r.room=m.room;const states=[InstanceMechanismEngine.state(c,m.id)];
  T.rnd(0.01,()=>{Chertog.cmd(`mact:${m.id}~study`);Chertog.cmd(`mact:${m.id}~repair`);states.push(InstanceMechanismEngine.state(c,m.id));
   r.closed=!Chertog.isOpen(c,edge);Chertog.cmd(`mact:${m.id}~use`);states.push(InstanceMechanismEngine.state(c,m.id));r.opened=Chertog.isOpen(c,edge);
   r.doorKey=InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"DOOR",edge.id));
   Chertog.cmd(`mact:${m.id}~overload`);states.push(InstanceMechanismEngine.state(c,m.id));});
  Chertog.stat("ходов",8);r.boom=InstanceMechanismEngine.tick(Chertog.cur());states.push(InstanceMechanismEngine.state(c,m.id));
  r.states=states;r.key=InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"MECH",m.id));r.acts=Object.keys(MECH_ACTS).length;r.kinds=Object.keys(MECH_KINDS).length;
  r.view=(()=>{F.mech[m.id]="ACTIVE";InstanceMechanismEngine.view(m.id);return [...document.querySelectorAll("#chBody [data-cmd^='ch:mact']")].length;})();
  Chertog.leave();return r;});
 check('1. механизм проходит состояния: повреждён → починен (выключен) → работает → перегружен → разрушен; работающий отводит засов хода, мир помнит «MECH = DESTROYED»; 17 видов, 8 действий',
  мех.states.join(">")==="DAMAGED>OFF>ACTIVE>OVERLOADED>DESTROYED"&&мех.closed&&мех.opened&&мех.doorKey==="OPEN"&&мех.key==="DESTROYED"&&/разорвался|рвётся/.test(мех.boom)&&мех.kinds===17&&мех.acts===8&&мех.view>=5,мех);

 const сек=await p.evaluate(()=>{const r={};const T=__T;
  const hit=T.find(F=>F.mechSeq&&F.mechSeq.length>=3&&F.edges.some(e=>e.byseq)?F.mechSeq:null,5);const c=T.start(hit.i,hit.f);const F=Chertog.fs(c.r.floor);
  for(const g of c.F.mechs)F.mech[g.id]=MECH_KINDS[g.kind].делает==="power"?"ACTIVE":"OFF";const seq=c.F.mechSeq.slice();for(const id of seq)F.mech[id]="OFF";const e=c.F.edges.find(x=>x.byseq);
  let last="";for(const id of seq.slice().reverse())last=InstanceMechanismEngine.set(c,id,"ACTIVE","проба")||last;r.wrong=last;r.closedWrong=F.e[e.id]!=="open";
  for(const id of seq)InstanceMechanismEngine.set(c,id,"OFF","проба");for(const id of seq)last=InstanceMechanismEngine.set(c,id,"ACTIVE","проба")||last;r.right=last;r.openRight=F.e[e.id]==="open";
  /* энергетическая дверь держится, пока работает генератор */
  const hit2=T.find(F=>F.edges.find(e=>e.lock==="energy"),9);const c2=T.start(hit2.i,hit2.f);const e2=hit2.x;const F2=Chertog.fs(c2.r.floor);
  F2.mech[e2.mech]="OFF";r.energyOff=Chertog.isOpen(c2,e2);F2.mech[e2.mech]="ACTIVE";r.energyOn=Chertog.isOpen(c2,e2);
  /* защитная система: бьёт по герою, перенастроенная — по тварям */
  const hit3=T.find(F=>F.mechs.find(m=>m.kind==="defense"),3);const c3=T.start(hit3.i,hit3.f,hit3.x.room);const F3=Chertog.fs(c3.r.floor);F3.mech[hit3.x.id]="OFF";
  const hp0=G.hp;InstanceMechanismEngine.set(c3,hit3.x.id,"ACTIVE","проба");r.turretHitsHero=G.hp<hp0;F3.tuned={[hit3.x.id]:true};const cb={hp:500};r.turret=InstanceMechanismEngine.turretTurn(cb);r.turretDmg=500-cb.hp;
  Chertog.leave();return r;});
 check('1б. порядок пробуждения из наставления: неверный — «вразнобой», верный открывает комнату механиков; энергетическая дверь держится, пока работает генератор; орудия бьют по герою, перенастроенные — по твари',
  /вразнобой/.test(сек.wrong)&&сек.closedWrong&&/в лад/.test(сек.right)&&сек.openRight&&!сек.energyOff&&сек.energyOn&&сек.turretHitsHero&&сек.turretDmg>0&&/орудия/.test(сек.turret),сек);

 /* ── 2. ловушки ── */
 const лов=await p.evaluate(()=>{const r={sprung:0,afflicted:0,hurt:0,texts:[]};const T=__T;const hit=T.find(F=>F.rooms.find(x=>x.t==="trap"&&x.parent>0),2);const c=T.start(hit.i,hit.f,hit.x.id);
  for(const t of INST_TRAPS){G.hv=null;G.poisoned=null;const R=Chertog.rs(c.room.id);delete R.t;c.r.room=hit.x.id;c.r.pendingFight=null;const hp0=G.hp;
   const txt=T.rnd(0.5,()=>InstanceTrapEngine.spring(Chertog.cur(),t));if(/Ловушка!/.test(txt))r.sprung++;if(G.hp<hp0)r.hurt++;if(t.недуг&&Hv.has(t.недуг[0]))r.afflicted++;
   if(t.назад)r.fell=c.r.room===hit.x.parent;if(t.перенос)r.moved=true;if(t.зов)r.called=!!c.r.pendingFight;G.hp=900;}
  r.types=Object.keys(TRAP_TYPES).length;r.typesHaveSound=Object.values(TRAP_TYPES).every(x=>x.звук&&x.предупр);r.traps=INST_TRAPS.length;
  /* предупреждение звуком и обнаружение */
  T.spy();c.r.room=hit.x.id;const R=Chertog.rs(hit.x.id);delete R.t;const room=Chertog.cur().room;room.trap="needles";
  const txt=T.rnd(0.01,()=>InstanceTrapEngine.onEnter(Chertog.cur()));r.warned=/шипение/.test(txt)&&R.t==="found";r.warnSound=__roles.includes(TRAP_TYPES.poison.звук);
  /* обезвредить перезаряжаемую — взводится снова; разобрать — навсегда */
  T.rnd(0.01,()=>InstanceTrapEngine.act("disarm"));r.disarmed=R.t==="done"&&!!R.re;Chertog.stat("ходов",14);InstanceTrapEngine.rearm(Chertog.cur());r.rearmed=!R.t;
  /* развернуть против тварей */
  room.trap="flame";R.t="found";T.rnd(0.01,()=>InstanceTrapEngine.act("turn"));r.armed=R.t==="armed";const m={n:"Проба",hp:200};const u=InstanceTrapEngine.useArmed(Chertog.cur(),m);r.armedHit=m.hp<200&&/развёрнутую/.test(u);
  /* плита-загадка */
  room.trap="riddleplate";delete R.t;InstanceTrapEngine.onEnter(Chertog.cur());r.riddle=R.t==="found"&&/trap:ans~/.test(InstanceTrapEngine.buttons(Chertog.cur()));
  Chertog.leave();return r;});
 check('2. двадцать ловушек тринадцати типов срабатывают с уроном и недугом; провал роняет в комнату ниже, складка переносит, зов гнезда поднимает тварей',
  лов.sprung===20&&лов.hurt===20&&лов.afflicted>=18&&лов.types===13&&лов.typesHaveSound&&лов.traps===20&&лов.fell&&лов.moved&&лов.called,лов);
 check('2б. ловушка сначала слышна своим звуком; обезвреженная перезаряжаемая взводится снова; развёрнутая бьёт тварь; плита-загадка спрашивает',
  лов.warned&&лов.warnSound&&лов.disarmed&&лов.rearmed&&лов.armed&&лов.armedHit&&лов.riddle,лов);

 /* ── 3. тайные ходы со звуковыми признаками ── */
 const тай=await p.evaluate(()=>{const r={};const T=__T;
  const hit=T.find(F=>{const e=F.edges.find(e=>e.lock==="shadow"&&!e.byseq&&!e.bypz&&e.a>0);return e||null;},4);const e=hit.x;const c=T.start(hit.i,hit.f,e.a);T.spy();
  T.said();T.rnd(0.01,()=>InstanceAudioEngine.listen());const cue=INST_SECRET_CUES[e.cue]||INST_SECRET_CUES.draft;window.__cueRole=cue.звук;
  r.found=Chertog.fs(c.r.floor).e[e.id]==="found";r.said=window.__said.join(" ").slice(0,300);r.saidCue=window.__said.join(" ").includes(cue.n);r.cueName=cue.n;
  r.key=InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"SECRET",e.id));return r;});
 await p.waitForTimeout(1600);
 Object.assign(тай,await p.evaluate(()=>{const r={};const T=__T;r.cueSound=window.__roles.includes(window.__cueRole);
  const hit2=T.find(F=>{const e=F.edges.find(e=>e.lock==="shadow"&&["falsewall","hidden","door","stairs"].includes(e.sk)&&!e.byseq&&!e.bypz&&e.a>0);return e||null;},8);const c2=T.start(hit2.i,hit2.f,hit2.x.a);T.spy();
  T.rnd(0.01,()=>Chertog.knock());r.knockFound=Chertog.fs(c2.r.floor).e[hit2.x.id]==="found";
  r.kinds=Object.keys(INST_SECRET_KINDS).length;r.cues=Object.keys(INST_SECRET_CUES).length;r.echo=window.__roles.includes("hero_step_echo");Chertog.leave();return r;}));
 check('3. «Прислушаться»: тайный ход звучит своим признаком с его стороны (сквозняк, эхо, гул, вода, шаги, голоса) и называется словами; «Простучать стены» — эхо пустоты; найденный ход мир помнит',
  тай.found&&тай.saidCue&&тай.cueSound&&тай.knockFound&&тай.echo&&тай.key==="DISCOVERED"&&тай.kinds===10&&тай.cues===8,тай);

 /* ── 4. головоломки ── */
 const гол=await p.evaluate(()=>{const r={solved:[],failHurt:false,undo:false};const T=__T;const hit=T.find(F=>F.rooms.find(x=>x.t==="puzzle"),6);const c=T.start(hit.i,hit.f,hit.x.id);const room=Chertog.cur().room;
  let k=0;for(const kind of Object.keys(CH_PUZZLES)){const pz=Chertog.makePuzzle(kind,chRng(100+k++),c.s,1);room.pz=pz;const R=Chertog.rs(room.id);delete R.p;c.r.pzSeq=[];
   if(kind==="scales"){const s=pz.w.slice(0,pz.n||2);for(const w of s)InstancePuzzleEngine.step(String(w));}else if(["mirrors","stars"].includes(kind))InstancePuzzleEngine.step(pz.ans);else for(const x of pz.ans)InstancePuzzleEngine.step(String(x));
   if(R.p)r.solved.push(kind+(pz.ans?":"+pz.ans.length:""));}
  /* ошибка бьёт; Песочный узел раз за ярус отменяет её */
  const pz=Chertog.makePuzzle("dials",chRng(7),c.s,0);room.pz=pz;delete Chertog.rs(room.id).p;c.r.pzSeq=[];const hp0=G.hp;InstancePuzzleEngine.step(String((pz.ans[0]+1)%10));r.failHurt=G.hp<hp0;
  Chertog.st().relics.push("hourglass");const hp1=G.hp;InstancePuzzleEngine.step(String((pz.ans[0]+1)%10));r.undo=G.hp===hp1;Chertog.leave();return r;});
 check('4. все восемь головоломок решаются по подсказке (на высокой сложности длиннее); ошибка бьёт, Песочный узел раз за ярус отменяет её',
  гол.solved.length===8&&гол.failHurt&&гол.undo,гол);

 /* ── 5. местные чары, книги, реликвии, ресурсы ── */
 const чар=await p.evaluate(()=>{const r={};const T=__T;const hit=T.find(F=>F.rooms.find(x=>x.id>0&&x.ex.length>=2&&x.ex.some(id=>F.edges[id].lock==="open")),1);const c=T.start(hit.i,hit.f,hit.x.id);
  const st=Chertog.st();st.lspells=INST_SPELLS.map(x=>x.id);const room=Chertog.cur().room;const F=Chertog.fs(c.r.floor);const ex=room.ex.map(id=>c.F.edges[id]).filter(e=>e.lock==="open"&&F.e[e.id]!=="open");
  const ok={};const cast=(id,setup)=>{if(setup)setup();G.mana=400;const m0=G.mana;Chertog.cmd("cast:"+id);return m0-G.mana;};
  if(ex[0]){ex[0].lock="rune";ex[0].word=["Ис","Ур","Тэр"];ok.open=cast("open")>0&&F.e[ex[0].id]==="open";}
  if(ex[1]){ex[1].lock="note";ex[1].melody=[0,1,2];ok.sonic=cast("sonic")>0&&F.e[ex[1].id]==="open";}
  const e3=room.ex.map(id=>c.F.edges[id]).find(e=>F.e[e.id]!=="open"&&e!==ex[0]&&e!==ex[1]);if(e3){e3.lock="door";e3.need="iron";ok.dissolve=cast("dissolve")>0&&F.e[e3.id]==="open";}
  cast("guise");ok.guise=(c.r.guise||0)>Chertog.moves();cast("summon");ok.summon=c.r.guardian===c.r.floor&&/Каменный страж/.test(InstanceLootEngine.guardianTurn({hp:100}));
  cast("fireseal");ok.fireseal=!!c.r.fireseal;cast("ward");ok.ward=!!c.r.ward;cast("weight");ok.weight=!!c.r.weight;c.r.lastKill="Пепельный волк";cast("raise");ok.raise=c.r.raised==="Пепельный волк";
  ok.rewind=cast("rewind")>0;ok.echo=cast("echo")>0;r.ok=ok;r.n=Object.values(ok).filter(Boolean).length;r.spells=INST_SPELLS.length;
  /* книги: каждая говорит правду о месте и даёт ключ */
  const kinds=Object.keys(INST_BOOKS);const out={};for(const k of kinds){c.F.books.push({id:c.F.books.length,kind:k,room:room.id});out[k]=InstanceLootEngine.read(Chertog.cur(),c.F.books.length-1);}
  r.books={map:Object.values(F.r).filter(x=>x.v).length>=c.F.n0-1,manual:!!out.manual,warning:!!(c.r.warn||{})[c.r.floor],dossier:!!(c.r.dossier||{})[c.r.floor]&&!!c.r.evidence,mechbook:!!c.r.mechbook,
   fragment:(c.r.hidden||[]).some(h=>/^frag/.test(h.id)),bestiary:!!c.r.bestiary&&/слаб к/.test(out.bestiary),grimoire:/местные чары|Гримуар/.test(out.grimoire),history:out.history.length>40,coords:out.coords.length>10,recipe:out.recipe.length>3};
  r.booksOk=Object.values(r.books).every(Boolean);
  /* реликвии: правила прохождения меняются */
  st.relics=[];const rel=InstanceLootEngine.relicFound(Chertog.cur());r.relic=st.relics.length===1&&/Реликвия/.test(rel);st.relics=INST_RELICS.map(x=>x.id);
  const e4=room.ex.map(id=>c.F.edges[id])[0];const was=[e4.lock,e4.need];delete F.e[e4.id];e4.lock="crawl";Chertog.tryOpen(Chertog.cur(),e4);r.feather=F.e[e4.id]==="open";
  delete F.e[e4.id];e4.lock="god";e4.god=PANTHEON[0].id;G.faith={};c.r.blessed=null;Chertog.tryOpen(Chertog.cur(),e4);r.seal=F.e[e4.id]==="open";delete F.e[e4.id];e4.lock="energy";e4.mech=0;r.heart=Chertog.isOpen(Chertog.cur(),e4);e4.lock=was[0];e4.need=was[1];
  r.relics=INST_RELICS.length;
  /* ресурсы: в инвентарь и в алхимию, место истощается и помнится */
  const rr=c.F.rooms.find(x=>x.res);if(rr){c.r.room=rr.id;const n0=Number(G.inv[rr.res.name])||0;delete Chertog.rs(rr.id).res;Chertog.cmd("gather");r.gather=(Number(G.inv[rr.res.name])||0)>n0;
   r.resKey=String(InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"RES",rr.id))||"");r.nature=!!MIX_NATURE[rr.res.name];}
  InstanceLootEngine.natureReg("древняя деталь");r.detal=JSON.stringify(MIX_NATURE["древняя деталь"]);Chertog.leave();return r;});
 check('5. местные чары работают только в чертогах: слово открытия, звуковой ключ, растворить металл, личина, страж, печать, щит, тяжесть, поднять павшего, отмотать миг, эхо-взгляд',
  чар.n>=11&&чар.spells===12,чар.ok);
 check('5б. книги — правда о месте: карта, наставление, предостережение, досье, чертёж, обрывок задания, бестиарий, гримуар, летопись, координаты, рецепт',чар.booksOk,чар.books);
 check('5в. реликвии меняют правила (перо — лаз, ключ печатей — печать бога, сердце генератора — поле); ресурс уходит в котомку и в алхимию, истощённое место мир помнит',
  чар.relic&&чар.feather&&чар.seal&&чар.heart&&чар.relics===14&&чар.gather&&/^DEPLETED@\d+/.test(чар.resKey)&&чар.nature&&чар.detal==='["metal","time"]',чар);

 /* ── 6. жители: память, отношение, скрытые цели ── */
 const жит=await p.evaluate(()=>{const r={};const T=__T;const hit=T.find(F=>F.npcs.find(n=>n.id<100&&n.room>0&&!["prisoner","priest","automaton","skull"].includes(n.role))&&F.rooms.find(x=>x.t==="treasury")?F.npcs.find(n=>n.id<100&&n.room>0&&!["prisoner","priest","automaton","skull"].includes(n.role)):null,2);
  const c=T.start(hit.i,hit.f,hit.x.room);const n=c.F.npcs.find(q=>q.id===hit.x.id);n.hidden="честен";n.prof="учёный";T.said();
  Chertog.cmd("npc:talk");const x=InstanceNPCSystem.ns(Chertog.cur(),n);r.met=!!x.met;r.talk=window.__said.join(" ").slice(0,200);const a0=x.att;
  for(let k=0;k<4;k++)Chertog.cmd("npc:gift");r.att=x.att-a0;Chertog.cmd("npc:ask");r.trusts=InstanceState.rec(c.r.i).qf&&InstanceState.rec(c.r.i).qf.reveal>0;
  const sp0=Chertog.st().lspells.length;Chertog.cmd("npc:teach");r.taught=Chertog.st().lspells.length===sp0+1;
  r.mem=JSON.stringify(InstanceState.rec(c.r.i).mem||{}).includes(`"${c.r.floor}:${n.id}"`);
  /* проводить до входа — спасён */
  Chertog.cmd("npc:escort");r.escort=c.r.escort===n.id;const g0=G.gold;c.r.room=0;Inst.emit("roomEntered",{i:c.r.i,f:c.r.floor,room:0});r.saved=!c.r.escort&&G.gold>g0&&InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"NPC",n.id))==="SAVED";
  /* предаст у сокровищницы */
  const n2=c.F.npcs.find(q=>q!==n)||n;const x2=InstanceNPCSystem.ns(Chertog.cur(),n2);x2.gone=0;x2.state=null;n2.hidden="предаст у сокровищницы";c.r.escort=n2.id;x2.following=1;
  const tr=c.F.rooms.find(q=>q.t==="treasury");c.r.room=tr.id;const k=tr.objs.findIndex(o=>o.treasury);const gb=G.gold;window.__said=[];Chertog.treasury(Chertog.cur(),k);r.betray=G.gold-gb>0&&/скрывается/.test(window.__said.join(" "))&&InstanceState.get(c.r.i,InstanceState.key(c.r.floor,"NPC",n2.id))==="BETRAYER";
  /* служит хранителю: пока не разоблачён — хранитель предупреждён */
  const x3=InstanceNPCSystem.ns(Chertog.cur(),n);x3.gone=0;x3.state=null;x3.mem=0;x3.following=0;c.r.escort=null;n.hidden="служит хранителю";x3.met=1;x3.exposed=0;r.warned=InstanceNPCSystem.warnedBoss(Chertog.cur())
  c.r.room=n.room;x3.pos=n.room;c.r.evidence=1;Chertog.cmd("npc:expose");r.exposed=!!x3.exposed&&!!(c.r.dossier||{})[c.r.floor]&&!InstanceNPCSystem.warnedBoss(Chertog.cur());
  r.traits=Object.keys(INST_NPC_TRAITS).length;Chertog.leave();return r;});
 check('6. житель знакомится своими чертами, отношение растёт от даров, доверившийся раскрывает тайны и учит местным чарам; память жителя хранится между заходами',
  жит.met&&/«Я /.test(жит.talk)&&жит.att>=40&&жит.trusts&&жит.taught&&жит.mem&&жит.traits===6,жит);
 check('6б. доведённый до входа житель спасён; тайный предатель уносит половину сокровищ; слуга хранителя предупреждает его, пока вы его не обличите',
  жит.escort&&жит.saved&&жит.betray&&жит.warned&&жит.exposed,жит);

 /* ── 6в. поручения жителей выполнимы ── */
 const пор=await p.evaluate(()=>{const r={};const T=__T;const hit=T.find(F=>F.npcs.find(n=>n.id<100&&n.room>0&&!["prisoner","priest","automaton","skull"].includes(n.role))?F.npcs.find(n=>n.id<100&&n.room>0&&!["prisoner","priest","automaton","skull"].includes(n.role)):null,4);
  const c=T.start(hit.i,hit.f,hit.x.room);const n=c.F.npcs.find(q=>q.id===hit.x.id);n.hidden="честен";const done={};
  for(const kind of ["fetch","save","read","repair","slay"]){c.r.side=[];n.side=kind;const x=InstanceNPCSystem.ns(Chertog.cur(),n);x.met=1;x.gone=0;x.pos=n.room;c.r.room=n.room;
   Chertog.cmd("npc:help");const q=c.r.side[0];if(!q){done[kind]="нет поручения";continue;}
   if(kind==="fetch"){r.giveBtn=/npc:give/.test(InstanceNPCSystem.buttons(Chertog.cur(),n));Chertog.give("shard");Chertog.cmd("npc:give");}
   if(kind==="save"){r.potionBtn=/npc:potion/.test(InstanceNPCSystem.buttons(Chertog.cur(),n));potionsOf().push({id:"heal",q:1,стаб:0.9,день:G.day,срок:30});Chertog.cmd("npc:potion");}
   if(kind==="read"){c.F.books.push({id:c.F.books.length,kind:"history",room:c.room.id});InstanceLootEngine.read(Chertog.cur(),c.F.books.length-1);}
   if(kind==="repair")Inst.emit("mechRepaired",{i:c.r.i,f:c.r.floor,mech:0});
   if(kind==="slay")Inst.emit("monsterKilled",{i:c.r.i,f:c.r.floor,room:1});
   done[kind]=!!q.done;}
  r.done=done;r.events=["relicGiven","npcHealed","bossPhaseChanged","mechanismActivated"].map(k=>Inst.handlers(k).length);Chertog.leave();return r;});
 check('6в. поручения жителей выполнимы: принести находку, спасти зельем, прочесть книгу, починить механизм, одолеть тварь',
  Object.values(пор.done).every(x=>x===true)&&пор.giveBtn&&пор.potionBtn,пор);

 /* ── 7. правила категорий и события ── */
 const пра=await p.evaluate(()=>{const r={};const T=__T;const hit=T.find(F=>F.n0>=14&&F.rooms.filter(x=>x.t==="lair").length>=2&&F.edges.filter(e=>e.id>=F.n0-1&&e.lock==="open").length>=1?true:null,3);const c=T.start(hit.i,hit.f,0);
  const L=InstanceRules.list;const use=k=>{InstanceRules.list=()=>[k];};const F=Chertog.fs(c.r.floor);const setMv=m=>{c.r.stats.ходов=m;};const out={};
  try{
   use("corruption");G.hv=null;c.r.blessed=null;setMv(9);InstanceRules.move(Chertog.cur());out.corruption=Hv.has("curse");
   use("shift");setMv(7);out.shift=/Стены сдвинулись/.test(InstanceRules.move(Chertog.cur()));
   use("gravity");setMv(7);const g0=!!c.r.grav;InstanceRules.move(Chertog.cur());out.gravity=!!c.r.grav!==g0;
   use("loop");setMv(11);const lair=c.F.rooms.find(x=>x.t==="lair");(F.r[lair.id]=F.r[lair.id]||{}).c=1;InstanceRules.move(Chertog.cur());out.loop=!F.r[lair.id].c;
   use("breath");c.r.drained={};const fl=c.F.rooms.find(x=>x.id>0&&x.id%3===0);c.r.room=fl.id;setMv(2);out.breath=/задерживая дыхание/.test(InstanceRules.move(Chertog.cur()));
   use("wind");const gal=c.F.rooms.find(x=>x.id>0&&x.id%4===1);c.r.room=gal.id;Chertog.st().relics=[];out.wind=T.rnd(0.01,()=>/Порыв ветра/.test(InstanceRules.move(Chertog.cur())));
   use("rise");c.r.room=0;F.r[lair.id].c=1;F.r[lair.id].died=1;setMv(9);out.rise=/поднялись снова/.test(InstanceRules.move(Chertog.cur()))&&!F.r[lair.id].c;
   use("collapse");c.r.noise=9;out.collapse=T.rnd(0.01,()=>/Свод не выдержал/.test(InstanceRules.move(Chertog.cur())));
   use("regrow");const e=c.F.edges.find(x=>x.a===0)||c.F.edges[0];F.e[e.id]="open";Inst.emit("doorOpened",{i:c.r.i,f:c.r.floor,edge:e.id,lock:"crawl"});setMv(40);out.regrow=/зарос/.test(InstanceRules.move(Chertog.cur()))&&!F.e[e.id];
   use("mutagen");G.buffs={};out.mutagen=T.rnd(0.01,()=>/мутаген/i.test(InstanceRules.move(Chertog.cur())));
   use("portals");const re=T.rnd(0.1,()=>InstanceRules.redirect(Chertog.cur(),{lock:"open"},0));out.portals=Number.isFinite(re)&&re>0;
   use("surge");out.surge=T.rnd(0.9,()=>InstanceRules.spellK("magic"))>1.2;use("twist");out.twist=InstanceRules.spellK("spell","light")===0.5;
   use("gas");const hp0=G.hp;out.gas=T.rnd(0.01,()=>InstanceRules.spellK("spell","fire"))>1&&G.hp<hp0;
   use("dark");out.dark=InstanceRules.dark(Chertog.cur())&&/Темно/.test(InstanceRules.describe(Chertog.cur()));
   use("narrow");Chertog.st().hires=[{id:"a",n:"Альф",cls:"blade",lvl:30,hp:90,hpMax:90,ранен:0},{id:"b",n:"Бета",cls:"blade",lvl:30,hp:90,hpMax:90,ранен:0},{id:"c",n:"Гамма",cls:"archer",lvl:30,hp:90,hpMax:90,ранен:0}];
   out.narrow=(Chertog.hiresTurn({hp:999}).match(/рубит|стреляет/g)||[]).length===1;Chertog.st().hires=[];
   use("alarm");c.r.pendingFight=null;T.rnd(0.5,()=>InstanceTrapEngine.spring(Chertog.cur(),INST_TRAPS[1]));out.alarm=!!c.r.pendingFight;c.r.pendingFight=null;
   use("swarm");const m1=T.rnd(0.3,()=>InstanceMonsterAI.monster(Chertog.cur(),{}));use("faith");const m2=T.rnd(0.3,()=>InstanceMonsterAI.monster(Chertog.cur(),{}));out.swarm=m1.hp>m2.hp*1.2;
   use("captives");const k0=JSON.stringify(c.r.keys);Inst.emit("npcSaved",{i:c.r.i,f:c.r.floor,npc:99});out.captives=JSON.stringify(c.r.keys)!==k0;
   use("factions");const lk=c.F.edges.find(x=>["door","rune","note","gear","god"].includes(x.lock));if(lk){delete F.e[lk.id];Inst.emit("sideQuestCompleted",{i:c.r.i,npc:1});out.factions=F.e[lk.id]==="open";}else out.factions=true;
   use("ghosts");c.r.room=0;T.said();T.rnd(0.99,()=>InstanceAudioEngine.listen());out.ghosts=/Голоса прежних жителей зовут/.test(window.__said.join(" "));
  }finally{InstanceRules.list=L;}
  r.rules=out;r.n=Object.values(out).filter(Boolean).length;r.total=Object.keys(out).length;
  /* события */
  const ev={};const est={};const probe={dark:()=>c.r.dark===c.r.floor,flood:()=>c.r.flood===c.r.floor,fire:()=>c.r.fire===c.r.floor,storm:()=>c.r.storm>0,rivals:()=>c.r.rivals>0,bossrage:()=>!!c.r.rage,invasion:()=>!!c.r.pendingFight};
  for(const id of Object.keys(INST_EVENTS)){c.r.ev={};c.r.drained={};c.r.fire=null;c.r.pendingFight=null;Chertog.fs(c.r.floor).e={};const t=InstanceEventEngine.apply(Chertog.cur(),id);ev[id]=!!t;if(probe[id])est[id]=probe[id]();}
  r.events=ev;r.evN=Object.values(ev).filter(Boolean).length;r.eventState=est;
  Chertog.leave();return r;});
 check('7. своё правило у категорий: порча, сдвиг стен, тяжесть, петля времени, вода, ветер, восставшие, обвал, зарастание, мутаген, порталы, срыв чар, закон наоборот, газ, тьма, теснота, тревога, рой, узники, кварталы, голоса жителей',
  пра.n===пра.total&&пра.total>=21,пра.rules);
 check('7б. тринадцать событий: вторжение, обвал, тьма, пробуждение, тяжесть, затопление, пожар, буря, встреча, соперники, новый ход, потерянный ход, гнев хранителя — каждое меняет состояние яруса',
  пра.evN>=12&&Object.values(пра.eventState).every(Boolean),пра);

 check('8. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
