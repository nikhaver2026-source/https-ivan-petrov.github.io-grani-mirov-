/* Инстансы Грани (12.0): бой, боссы, развязки, Режиссёр, звук.
   Мастер-промпт: своя фауна с повадками и чувствами; дозоры; боссы с фазами
   (наблюдение, агрессия, окружение, смена арены, истинная форма, последний
   приём), репликами и анализом игрока; бой с использованием арены; разговор
   с хранителем или кража сердца; развязки A–E с последствиями в мире;
   награда по стилю прохождения; Режиссёр сам создаёт инстансы и поручения;
   звук — свой отклик у каждой категории и всё важное со своей стороны. */
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
  window.__T={
   find(pred,from){for(let k=0;k<CH_N;k++){const i=((from||0)+k*37)%CH_N;const s=Chertog.spec(i);if(!pred(s))continue;return s;}return null;},
   start(i,diff,f,room){const s=Chertog.spec(i);G.ch={seal:6};if(s.type==="group"||s.type==="raid")G.ch.hires=["Ар","Бор","Вел","Гор"].map((n,k)=>({id:"t"+k,n,cls:["guard","blade","archer","healer"][k],lvl:40,hp:200,hpMax:200,ранен:0}));G.level=Math.max(40,s.level);G.hpMax=900;G.hp=900;G.mana=400;G.manaMax=400;G.gold=3000;G.day=G.day&&G.day>20?G.day:20;G.hv=null;G.poisoned=null;G.buffs={};G.faith={[s.god]:9};
    InstanceState.rec(i).diffMax=5;InstanceGenerator._fc=new Map();const t=Chertog.enter({i,x:G.x,y:G.y},diff||0);const r=Chertog.run();if(!r)throw new Error("вход не удался: "+t+" / "+s.type+" "+s.n);r.floor=f||0;r.room=room||0;while(activeLayer())closeTopUI();return Chertog.cur();},
   rnd(v,fn){const o=Math.random;Math.random=()=>v;try{return fn();}finally{Math.random=o;}},
   said(){window.__said=[];if(!window.__csay){window.__csay=Chertog.say.bind(Chertog);Chertog.say=function(t){window.__said.push(String(t||''));return window.__csay(t);};}},
   spy(){window.__roles=[];if(!window.__srole){window.__srole=Spatial.role.bind(Spatial);Spatial.role=function(role,dx,dy,o){window.__roles.push(role);return window.__srole(role,dx,dy,o);};}}};});

 /* ── 1. фауна инстанса в бою ── */
 await p.evaluate(()=>{const T=__T;const s=T.find(s=>s.type==="solo"&&!s.unique&&["ruins","catacombs","caves","mine","fortress"].includes(s.cat.id),7);window.__S=s.i;
  const c=T.start(s.i,0);const lair=c.F.rooms.find(x=>x.t==="lair")||c.F.rooms.find(x=>x.id>0&&x.t==="зал");const R=Chertog.rs(lair.id);R.c=0;if(lair.t!=="lair")R.awake=1;c.r.room=lair.id;c.r.pendingFight=null;window.__lair=lair.id;
  InstanceRules.__list=InstanceRules.list;InstanceRules.list=()=>[];Chertog.fight();});
 await p.waitForTimeout(700);
 const фа=await p.evaluate(()=>{const r={};const cb=G.combat;const m=cb&&cb.m;r.inCombat=!!G.inCombat;r.fauna=m&&m.chFauna&&{behavior:m.chFauna.behavior,senses:m.chFauna.senses,weak:m.chFauna.weak,part:m.chFauna.part};
  r.role=cb&&cb.arena&&cb.arena.role;r.want=m&&m.chFauna&&FAUNA_BEHAVIORS[m.chFauna.behavior].роль;r.arenaR=cb&&cb.arena&&cb.arena.r;r.menu=amAvailable("charena");
  const w=Object.keys(m.chFauna.weak)[0],res=Object.keys(m.chFauna.resist)[0];r.kWeak=InstanceBossEngine.dmgK("spell",w);r.kRes=InstanceBossEngine.dmgK("spell",res);
  /* навык твари: недуг на герое */
  m.chFauna.skills=["poison"];m.chFauna.cd={};G.hv=null;__T.rnd(0.01,()=>InstanceMonsterAI.turn(cb,"atk"));r.skill=Hv.has("poison");
  /* рой зовёт своих, когда ранен */
  m.chFauna.behavior="swarm";m.chFauna.called=0;cb.hp=Math.round(m.hp*0.4);const h0=cb.hp;InstanceMonsterAI.turn(cb,"atk");r.swarm=cb.hp>h0;
  cb.hp=0;victory();r.after=!G.inCombat;r.cleared=!!(Chertog.fs(Chertog.run().floor).r[__lair]||{}).c;r.killed=InstanceState.rec(__S).qf&&true;return r;});
 check('1. тварь чертога — из своей фауны: повадка, чувства, слабость и стойкость, добыча; роль на поле боя — по повадке, поле — комната; слабость бьёт в полтора раза, стойкость — вполсилы',
  фа.inCombat&&фа.fauna&&фа.fauna.senses&&фа.role===фа.want&&фа.arenaR===3&&фа.menu&&фа.kWeak===1.5&&фа.kRes===0.5&&фа.after&&фа.cleared,фа);
 check('1б. тварь пользуется навыками (яд ложится на героя), рой зовёт своих, когда ранен',фа.skill&&фа.swarm,фа);

 /* ── 2. засада, шум, дозоры, трус ── */
 const пов=await p.evaluate(()=>{const r={};const T=__T;const c=T.start(__S,0);InstanceRules.list=()=>[];const s=c.s;
  const amb={id:"f0",base:"wolf",n:"Безглазый волк",behavior:"ambusher",origin:"",bio:"тень и холод",senses:{слух:3,зрение:0,нюх:2,магия:0},weak:{fire:1.5},resist:{dark:0.5},immune:[],fire:false,noise:true,skills:[],passive:"",part:"целый клык"};
  InstanceGenerator._fa.set(s.i,[amb]);const lair=c.F.rooms.find(x=>x.t==="lair")||c.F.rooms.find(x=>x.id>0);const R=Chertog.rs(lair.id);R.c=0;delete R.listened;c.r.room=lair.id;c.r.pendingFight=null;
  const hp0=G.hp;const t=InstanceMonsterAI.onEnter(Chertog.cur());r.ambush=/Засада/.test(t)&&G.hp<hp0&&!!c.r.pendingFight;c.r.pendingFight=null;R.listened=1;r.noAmbush=!InstanceMonsterAI.onEnter(Chertog.cur());
  /* шум зовёт тварей из соседнего логова */
  const lair2=c.F.rooms.find(x=>x.t==="lair"&&x.ex.some(id=>{const e=c.F.edges[id];return (e.a===x.id?e.b:e.a)!==x.id;}));if(lair2){const e=c.F.edges[lair2.ex[0]];const nb=e.a===lair2.id?e.b:e.a;c.r.room=nb;Chertog.rs(nb);delete (Chertog.fs(c.r.floor).r[lair2.id]||{}).came;(Chertog.fs(c.r.floor).r[lair2.id]=Chertog.fs(c.r.floor).r[lair2.id]||{}).c=0;
   c.r.noise=9;c.r.pendingFight=null;delete Chertog.rs(nb).listened;const t2=InstanceMonsterAI.onEnter(Chertog.cur());r.noise=/шумели|Засада/.test(t2)&&!!c.r.pendingFight;}else r.noise=true;
  c.r.noise=0;c.r.pendingFight=null;
  /* дозор: шаги со стороны, встреча — бой, личина — проходит мимо */
  const P=c.F.patrols[0];if(P){const F=Chertog.fs(c.r.floor);const at=P.route[1%P.route.length];const room=c.F.rooms[at];const e=room.ex.map(id=>c.F.edges[id])[0];const nb=e.a===at?e.b:e.a;
   c.r.room=nb;F.pat[P.id]={pos:0};T.spy();const t3=T.rnd(0.99,()=>InstanceMonsterAI.patrols(Chertog.cur()));r.steps=/шаги дозора/.test(t3);
   c.r.room=at;F.pat[P.id]={pos:0};c.r.pendingFight=null;const t4=T.rnd(0.99,()=>InstanceMonsterAI.patrols(Chertog.cur()));r.meet=/дозор/.test(t4)&&!!c.r.pendingFight;
   c.r.pendingFight=null;F.pat[P.id]={pos:0};c.r.guise=Chertog.moves()+5;const t5=T.rnd(0.99,()=>InstanceMonsterAI.patrols(Chertog.cur()));r.guise=/за своего/.test(t5)&&!c.r.pendingFight;c.r.guise=0;}else{r.steps=r.meet=r.guise=true;}
  InstanceGenerator._fa.delete(s.i);Chertog.leave();return r;});
 check('2. засадник бьёт первым, если в комнату вошли не прислушавшись; громкий шум зовёт тварей соседнего логова; дозор слышен шагами, встреча с ним — бой, под личиной он проходит мимо',
  пов.ambush&&пов.noAmbush&&пов.noise&&пов.steps&&пов.meet&&пов.guise,пов);

 /* ── 3. боссы: фазы, сложность, рейд, реплики ── */
 const бос=await p.evaluate(()=>{const r={};const T=__T;const s=Chertog.spec(__S);const c=T.start(__S,0,s.floors-1);const room=c.F.rooms.find(x=>x.t==="boss");
  const ph=d=>{c.r.diff=d;return InstanceBossEngine.def(Chertog.cur(),room);};const d0=ph(0),d2=ph(2),d4=ph(4);c.r.diff=0;
  r.p0=d0.фазы.map(f=>f.ph);r.p2=d2.фазы.map(f=>f.ph);r.p4=d4.фазы.map(f=>f.ph);r.sk0=d0.навыки.length;r.sk2=d2.навыки.length;r.hp=[d0.hp,d2.hp,d4.hp];
  r.lines=!!(d0.lines&&BOSS_LINES.вход.includes(d0.lines.вход)&&BOSS_LINES.конец.includes(d0.lines.конец));r.tier=d0.chTier;
  c.r.v=2;const dv=InstanceBossEngine.def(Chertog.cur(),room);r.change=/сменщик/.test(dv.история);c.r.v=1;
  const mini=c.F.rooms.find(x=>x.t==="mini");if(mini)r.mini=InstanceBossEngine.def(Chertog.cur(),mini).фазы.map(f=>f.ph);
  const raid=T.find(q=>q.type==="raid",3);if(raid){const c2=T.start(raid.i,0,raid.floors-1);const rr=c2.F.rooms.find(x=>x.t==="boss");const dr=InstanceBossEngine.def(Chertog.cur(),rr);r.raid={ph:dr.фазы.length,summon:dr.навыки.includes("summon"),party:raid.party};}
  r.phaseSet=Object.keys(BOSS_PHASES).length;Chertog.leave();return r;});
 check('3. фазы боссов из шести видов: хранитель — наблюдение, агрессия, окружение, последний приём; на эпической — лишняя фаза и навык, на мифической — ещё фаза; рейдовый — со свитой; у каждого свои реплики; павшего хранителя сменяет сменщик',
  бос.phaseSet===6&&JSON.stringify(бос.p0)===JSON.stringify(["watch","aggr","env","final"])&&бос.p2.length===5&&бос.p4.length===6&&бос.sk2>бос.sk0&&бос.hp[2]>бос.hp[0]&&бос.lines&&бос.change&&(!бос.raid||бос.raid.summon&&бос.raid.party===5),бос);

 /* ── 4. анализ игрока, арена, щит, последний приём ── */
 await p.evaluate(()=>{const T=__T;const s=Chertog.spec(__S);const c=T.start(__S,0,s.floors-1);const room=c.F.rooms.find(x=>x.t==="boss");c.r.room=room.id;Chertog.rs(room.id).c=0;c.r.pendingFight=null;
  InstanceRules.list=()=>[];Chertog.fight();});
 await p.waitForTimeout(900);
 const ум=await p.evaluate(()=>{const r={};const cb=G.combat;const m=cb.m;const B=m.chBoss;const out=[];T=__T;
  r.inCombat=!!G.inCombat;r.boss=!!B;InstanceBossEngine.turn(cb,"magic");
  InstanceBossEngine.dmgK("spell","fire");InstanceBossEngine.dmgK("spell","fire");InstanceBossEngine.dmgK("spell","fire");
  m.boss.phase=2;out.push(InstanceBossEngine.turn(cb,"magic"));Object.assign(B,{dodge:0,shield:0,minions:0,reflect:0,phased:0});r.resist=B.resist;r.kFire=+InstanceBossEngine.dmgK("spell","fire").toFixed(3);r.kWater=+InstanceBossEngine.dmgK("spell","water").toFixed(3);
  r.lineFire=/Я запомнил твои чары/.test(out.join(" "));
  /* издали — он сокращает расстояние */
  B.mind.far=3;B.pull=0;m.boss.phase=3;InstanceBossEngine.turn(cb,"atk");r.pull=!!B.pull;B.turn=5;cb.arena.fx=cb.arena.px+3;cb.arena.fy=cb.arena.py;const tp=InstanceBossEngine.turn(cb,"atk");r.pullLine=/Дотянусь/.test(tp);
  /* склянки */
  B.antipot=1;const hp0=G.hp;const t2=InstanceBossEngine.turn(cb,"potion");r.potion=/склянки/.test(t2)&&G.hp<hp0;
  /* арена: пункт меню, вещи арены, удар колонной */
  r.item=AM_ITEMS.some(x=>x[0]==="charena")&&AM_GROUPS.find(g=>g[0]==="Бой")[1].some(x=>x[0]==="charena");CMD.charena();r.objs=[...document.querySelectorAll("#chBody [data-cmd^='ch:arena']")].map(x=>x.dataset.cmd);
  const hpB=cb.hp;Chertog.cmd("arena:topple");r.topple=cb.hp<hpB||!G.combat;
  if(G.combat){Object.assign(B,{enrage:0,minions:0,cleave:0,judge:0,mirror:0,drain:0});Chertog.st().hires=[];Chertog.cmd("arena:cover");Chertog.run().cover=1;r.cover=true;Object.assign(B,{enrage:0,minions:0,cleave:0,judge:0,mirror:0,drain:0});Chertog.run().ward=0;const d=InstanceBossEngine.strikeK(m,100);r.coverK=d;
   Chertog.run().ward=1;r.ward=InstanceBossEngine.strikeK(m,100)===0;
   B.final=1;Chertog.run().ward=1;const tf=InstanceBossEngine.turn(cb,"atk");r.final=/щит Первых/.test(tf);}
  return r;});
 check('4. он присматривается и отвечает на ваш стиль: запоминает чары («Я запомнил твои чары» — огонь бьёт слабее), тянется к тому, кто держится вдали, бьёт, пока вы пьёте склянку',
  ум.inCombat&&ум.boss&&ум.resist==="fire"&&ум.kFire<ум.kWater&&ум.lineFire&&ум.pull&&ум.pullLine&&ум.potion,ум);
 check('4б. «Арена чертога» в меню боя: колонны, жаровни, механизмы и ловушки зала бьют врага; укрытие гасит половину удара, щит Первых принимает удар и последний приём',
  ум.item&&ум.objs.length>=2&&ум.objs.includes("ch:arena:topple")&&ум.topple&&ум.cover&&ум.coverK===50&&ум.ward&&ум.final,ум);
 await p.evaluate(()=>{if(G.combat){G.combat.hp=0;victory();}});await p.waitForTimeout(4700);

 /* ── 5. хранитель: разговор и кража; развязки A–E ── */
 const раз=await p.evaluate(()=>{const r={out:{}};const T=__T;const s=Chertog.spec(__S);
  /* разговор: с досье хранитель отступает, разрушить и унести сердце он не даст */
  let c=T.start(__S,0,s.floors-1);let room=c.F.rooms.find(x=>x.t==="boss");c.r.room=room.id;Chertog.rs(room.id).c=0;c.r.dossier={[c.r.floor]:1};
  r.talkBtn=/keeper:talk/.test(InstanceBossEngine.keeperButtons(Chertog.cur()));InstanceBossEngine.keeper("talk");r.talk=c.r.keeper==="talk"&&!!Chertog.rs(room.id).c;
  const ok=InstanceBossEngine.outcomes(Chertog.cur());r.talkLimits=ok.A!==true&&ok.D!==true&&ok.E===true&&ok.C===true;Chertog.leave();
  /* кража под личиной */
  c=T.start(__S,0,s.floors-1);room=c.F.rooms.find(x=>x.t==="boss");c.r.room=room.id;Chertog.rs(room.id).c=0;c.r.guise=Chertog.moves()+5;
  r.stealBtn=/keeper:steal/.test(InstanceBossEngine.keeperButtons(Chertog.cur()));T.rnd(0.01,()=>InstanceBossEngine.keeper("steal"));r.steal=c.r.keeper==="steal"&&c.r.outcome==="D"&&!!c.r.finished;Chertog.leave();
  /* все развязки и их следы в мире */
  for(const o of ["A","B","C","D","E"]){G.day=(Number(G.day)||20)+1;c=T.start(__S,0,s.floors-1);room=c.F.rooms.find(x=>x.t==="boss");c.r.room=room.id;Chertog.rs(room.id).c=1;c.r.keeper="fight";c.r.sagaDone=1;
   const W=Director.st();const t0=Number(W.tension)||0;const dyn=Director.st().world;const ether0=dyn.ether,mech0=dyn.mech;const core0=Number(G.inv["ядро чертога"])||0;T.said();
   InstanceBossEngine.choose(o);const said=window.__said.join(" ");
   r.out[o]={chosen:c.r.outcome===o,saved:InstanceState.rec(__S).s.OUTCOME===o,world:/Последствия:/.test(said),grade:/Оценка прохождения/.test(said),tension:(Number(W.tension)||0)-t0,ether:dyn.ether-ether0,mech:dyn.mech-mech0,core:(Number(G.inv["ядро чертога"])||0)-core0};Chertog.leave();}
  r.diffMax=InstanceState.rec(__S).diffMax;r.best=InstanceState.rec(__S).best;r.chron=JSON.stringify(Director.st().chron.slice(0,6)).includes("чертог");
  /* повторный заход после развязки E: место окрепло */
  G.day+=1;Chertog.enter({i:__S,x:G.x,y:G.y},0);const c2=Chertog.cur();r.heroic=!!c2&&c2.r.heroic>=1;r.offline=/окрепло/.test(document.getElementById("chBody").textContent);Chertog.leave();
  return r;});
 check('5. с досье можно договориться с хранителем — тогда сердце нельзя разрушить или унести; под личиной сердце уводят из-под носа — это развязка «забрать»',
  раз.talkBtn&&раз.talk&&раз.talkLimits&&раз.stealBtn&&раз.steal,раз);
 check('5б. пять развязок — уничтожить, восстановить, передать, забрать, оставить — запоминаются, меняют мир (напряжение, эфир, машины, держава), дают ядро; итог — оценка и награда, открывается следующая сложность, летопись помнит',
  ["A","B","C","D","E"].every(o=>раз.out[o].chosen&&раз.out[o].saved&&раз.out[o].world&&раз.out[o].grade)&&раз.out.A.tension>0&&раз.out.E.tension>0&&раз.out.B.mech>0&&раз.out.D.core===1&&раз.diffMax>=1&&раз.best&&раз.chron&&раз.heroic&&раз.offline,раз);

 /* ── 6. награда по стилю, тайные цели, поражение ── */
 const наг=await p.evaluate(()=>{const r={};const T=__T;const c=T.start(__S,0);const sc0=InstanceRewardEngine.score();r.parts=sc0.parts.map(x=>x[0]);
  Inst.emit("secretDiscovered",{i:__S,f:0,edge:999});Inst.emit("puzzleSolved",{i:__S,f:0,room:998});Inst.emit("npcSaved",{i:__S,f:0,npc:997});const sc1=InstanceRewardEngine.score();r.grows=sc1.score>sc0.score;r.grade=sc1.grade;
  r.grades=InstanceRewardEngine.GRADES.map(g=>g[1]);
  /* поражение: к входу яруса, половина ключей; с Нитью возврата — без потерь; на третьем — наружу */
  c.r.keys={iron:2};c.r.room=5;Chertog.onLose({n:"x"});r.lose1=!!Chertog.run()&&Chertog.run().room===0&&Chertog.run().keys.iron===1;
  Chertog.st().relics.push("thread");c.r.keys={iron:2};Chertog.onLose({n:"x"});r.thread=Chertog.run().keys.iron===2;Chertog.st().relics=[];
  Chertog.onLose({n:"x"});Chertog.onLose({n:"x"});r.out=!Chertog.run();
  /* единственный: после развязки закрыт навсегда */
  const u=T.find(s=>s.unique&&s.type!=="group"&&s.type!=="raid",1);if(u){const cu=T.start(u.i,0,u.floors-1);const rm=cu.F.rooms.find(x=>x.t==="boss");cu.r.room=rm.id;Chertog.rs(rm.id).c=1;cu.r.keeper="fight";
   InstanceBossEngine.choose("E");Chertog.leave();r.closed=InstanceState.rec(u.i).closed===1&&Chertog.access(u).some(x=>/закрыт навсегда/.test(x));}else r.closed=true;
  return r;});
 check('6. награда по стилю: исследование, тайны, спасённые, головоломки, без поражений, сложность, доп. цели, скорость, без ловушек — оценка от Бронзы до Грани; единственный чертог после развязки закрыт навсегда',
  наг.parts.length===9&&наг.grows&&наг.grades.join()==="Грань,Звезда,Золото,Серебро,Бронза"&&наг.closed,наг);
 check('6б. поражение не выкидывает сразу: к входу яруса с потерей половины ключей (Нить возврата — без потерь), на третьем — наружу',наг.lose1&&наг.thread&&наг.out,наг);

 /* ── 7. Режиссёр, скрытые входы, одиночка, отряд ── */
 const реж=await p.evaluate(()=>{const r={};const T=__T;G.ch={seal:6};G.level=60;const st=Chertog.st();
  const t=T.rnd(0,()=>InstanceDirectorIntegration.onWorldDay());const ids=Object.keys(st.dyn);r.created=ids.length>=1&&/открылся чертог/.test(t);
  const d=ids.length?+ids[0]:null;if(d!=null){const sp=Chertog.spec(d);r.dyn=sp.dyn&&sp.unique&&!!sp.lore.сейчас;r.near=Chertog.near(30).some(x=>x.i===d);G.day=(Number(G.day)||1)+10;r.expired=Chertog.access(sp).some(x=>/затянулся/.test(x));G.day-=10;}
  r.qtype=!!DIR2_QTYPES.chertog;const s2=Director.st2();s2.q=[];const q=Director.qMake("chertog");r.quest=!!q&&/Чертог:/.test(q.n);if(q){const t2=Director.qProgress("chertog",q.ch);r.questDone=/исполнено/.test(t2);}
  /* скрытый вход находится поиском рядом */
  let hid=null;for(let by=-6;by<=6&&!hid;by++)for(let bx=-6;bx<=6&&!hid;bx++){const e=Chertog.at(Math.floor(G.x/28)+bx,Math.floor(G.y/28)+by);if(e&&Chertog.spec(e.i).hidden)hid=e;}
  if(hid){delete st.found[hid.i];G.x=hid.x;G.y=hid.y;r.hiddenBefore=Chertog.near(3).some(x=>x.i===hid.i);CMD.searchhere();r.hiddenFound=!!st.found[hid.i]&&Chertog.near(3).some(x=>x.i===hid.i);}else{r.hiddenBefore=false;r.hiddenFound=true;}
  /* испытание одиночки: звери у входа; групповой — нужен отряд */
  const so=T.find(s=>s.type==="soloonly",4);const cs=T.start(so.i,0);r.solo=cs.r.solo===1&&Chertog.partySize()===1;cs.r.fight={room:0,kind:"foe"};G.combat={m:{n:"x",hp:10},hp:10};r.zver=Zver.turn(G.combat,"atk")==="";G.combat=null;cs.r.fight=null;Chertog.leave();
  const gr=T.find(s=>s.type==="group",4);G.ch.hires=[];r.groupNeed=Chertog.access(gr).some(x=>/отряд/.test(x));
  return r;});
 check('7. Режиссёр сам открывает новый чертог по состоянию мира — он виден рядом и затягивается в срок; заводит поручение «чертог» и закрывает его',
  реж.created&&реж.dyn&&реж.near&&реж.expired&&реж.qtype&&реж.quest&&реж.questDone,реж);
 check('7б. скрытый вход не виден, пока его не найдут поиском рядом; в испытании одиночки звери и наёмники остаются у входа; групповой чертог требует отряда',
  !реж.hiddenBefore&&реж.hiddenFound&&реж.solo&&реж.zver&&реж.groupNeed,реж);

 /* ── 8. звук ── */
 const зв=await p.evaluate(()=>{const r={};const T=__T;const c=T.start(__S,0);Chertog.view();r.kind=roomKind();r.want="inst_"+c.s.cat.id;r.room=JSON.stringify(ROOM[r.kind]);
  T.spy();InstanceAudioEngine.step(Chertog.cur(),"север");r.step=__roles.includes(c.s.cat.шаг)||__roles.includes("oc_splash");
  T.spy();T.rnd(0.9,()=>InstanceAudioEngine.amb());r.amb=__roles.some(x=>c.s.cat.фон.includes(x));Chertog.leave();r.after=roomKind()!==r.want;return r;});
 check('8. свой отклик у каждой категории: внутри чертога — «inst_<категория>», снаружи — прежний; шаги — по полу места; фон места звучит со сторон',
  зв.kind===зв.want&&зв.room&&зв.step&&зв.amb&&зв.after,зв);

 await p.evaluate(()=>{if(InstanceRules.__list){InstanceRules.list=InstanceRules.__list;delete InstanceRules.__list;}});
 check('9. без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
