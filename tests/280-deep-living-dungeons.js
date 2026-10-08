/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 280: 12.5 — ГЛУБЬ: ПОДЗЕМЕЛЬЕ — ЖИВОЙ МИР

   Просьба игрока: превратить каждое обычное подземелье в самостоятельный,
   многоярусный, развивающийся мир — с историей, экосистемой, населением,
   экономикой, механизмами, загадками, ресурсами, тварями, боссами,
   поручениями и цепочками событий; модульно; всё прежнее работает.

   1. Класс и ярусы: малое 2–5 … легендарное 50+; ярусы уходят от камня к
      магии и сну камня; у яруса — своя порода, тепло, свет, история.
   2. Вход на ярус: своя речь яруса, отклик, музыка, пол, ловушки породы.
   3. Окно «Ярус подземелья»: разделы, вещи по месту, маяк.
   4. Тварь яруса — местная порода с рангом и памятью рода.
   5. Экосистема живёт сама: сутки меняют её, выбитые хищники рождают события.
   6. Энергосеть и цепочка «Сердце древнего механизма» до решения о ядре.
   7. Клапан: вода уходит вниз и затапливает ярус ниже.
   8. Тайное ищут чувствами; лаз уводит вниз мимо стража.
   9. Загадка решается; замок открывается только своим ключом.
  10. Пути вниз: чарами мимо стража.
  11. Владыка: шесть фаз, арена, память о поражении, победа.
  12. Поручения с причиной; фракции, союз и предательство.
  13. Состояние подземелья переживает сохранение.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};G.level=12;G.hpMax=300;G.hp=300;G.mana=200;G.manaMax=200;});

 /* ── 1 ── */
 const к=await p.evaluate(()=>{const r={cls:{},bad:[],mono:0,tot:0};let n=0;
  for(let x=1000;x<60000&&n<160;x+=53)for(let y=1000;y<1600&&n<160;y+=61){const c=cellContent(x,y);if(!(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"))continue;n++;
   const s=Deep.spec(x,y,c.structure.type);r.cls[s.cls.id]=(r.cls[s.cls.id]||0)+1;if(s.N<s.cls.ярусы[0]||s.N>s.cls.ярусы[1])r.bad.push([s.cls.id,s.N]);
   let ok=1;for(let i=2;i<=s.N;i++)if(DEEP_BIOME_BY_ID[s.tiers[i].b].м+1<DEEP_BIOME_BY_ID[s.tiers[i-1].b].м)ok=0;r.mono+=ok;r.tot++;}
  return r;});
 check('1. классы и число ярусов по классу; ярусы уходят от камня вглубь, к магии',Object.keys(к.cls).length>=3&&!к.bad.length&&к.mono===к.tot,к);

 /* ── 2 ── */
 const в=await p.evaluate(async()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"&&Deep.spec(x,y,cc.structure.type).N>=5&&Deep.spec(x,y,cc.structure.type).net)c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();if(G.place.depth===0)changeDepth(1,{bypass:true});
  await new Promise(r=>setTimeout(r,1800));window.__deepAt=c;const s=Deep.here();const said=[];
  return {on:Deep.on(),N:s.N,line:Deep.tierLine(G.place.depth),room:roomKind(),track:underTrack(G.place.depth),surf:indoorSurface(),trap:!!Deep.trapPick(G.place,G.place.x,G.place.y),name:s.n,cls:s.cls.n};});
 check('2. вход на ярус: своя речь, отклик, музыка, пол и ловушки породы',в.on&&/^Ярус 1 из \d+, подземелье «/.test(в.line)&&/^deep_/.test(в.room)&&!!в.track&&!!в.surf&&в.trap,в);

 /* ── 3 ── */
 const о=await p.evaluate(()=>{CMD.deep();const html=document.getElementById("dpBody").innerHTML;const b=[...document.querySelectorAll('#dpBody [data-cmd^="dp:"]')].map(e=>e.dataset.cmd);
  CMD.dp("things");const th=[...document.querySelectorAll('#dpBody [data-cmd^="dp:el:"]')].map(e=>e.dataset.cmd);let el="";if(th[0]){CMD.dp(th[0].slice(3));el=document.getElementById("dpBody").innerHTML;}
  while(activeLayer())closeTopUI();return {b,th:th.length,el:/шаг|вплотную|под ногами/.test(el),sec:/История яруса/.test(html)};});
 check('3. окно «Ярус подземелья»: история, разделы, вещи по месту с расстоянием',о.sec&&["dp:listen","dp:things","dp:folk","dp:secret","dp:paths","dp:quests","dp:eco","dp:fac","dp:boss","dp:atlas","dp:chron"].every(k=>о.b.includes(k))&&(о.th===0||о.el),о);

 /* ── 4 ── */
 const т=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);const i=G.place.depth;const p0=x.eco[i].p;const m=Object.assign({},MONSTERS.find(z=>z.id==="spider"),{hp:30,dmg:5,lvl:3,xp:20,gold:5});
  startCombat({x:G.place.x,y:G.place.y,monster:m});const r={n:m.n,dw:!!m.dw,rank:m.dw&&m.dw.rank};G.combat.hp=0;victory();
  return Object.assign(r,{eco:x.eco[i].p<p0,kills:Object.values(x.evo).reduce((a,v)=>a+v.kills,0)});});
 check('4. тварь яруса — местная порода с рангом; её смерть меняет экосистему и память рода',т.dw&&!/^Паук-тенетник$/.test(т.n)&&т.eco&&т.kills>=1,т);

 /* ── 5 ── */
 const э=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);const i=G.place.depth;const before=JSON.stringify(x.eco);x.eco[i].p=0.05;x.eco[i].h=1;x.eco[i].lowP=3;
  Deep.sim(s,x,3);return {changed:JSON.stringify(x.eco)!==before,inv:!!x.eco[i].inv,ev:x.ev.length,chron:x.chron.length,why:x.ev.every(e=>e.why)};});
 check('5. экосистема живёт сама; выбитые хищники рождают событие с причиной',э.changed&&э.inv&&э.ev>=1&&э.why,э);

 /* ── 6 ── */
 const ц=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);const r={steps:[]};const at=t=>{G.place.depth=t;};const core=s.mechs.find(m=>m.kind==="core");
  Deep.near=()=>true;at(core.tier);Deep.mechAct(core.id,"look");r.steps.push(x.chain.s);
  const eng=s.npcs.find(n=>n.role==="engineer");Deep.nst(x,eng).t=G.place.depth;Deep.eng(eng.id);r.steps.push(x.chain.s);
  const need=DEEP_BIOME_BY_ID[s.tiers[s.net.core].b].ресурсы[0];G.inv[need]=5;Deep.eng(eng.id);r.steps.push(x.chain.s);
  G.inv["древняя шестерня"]=2;G.inv["латунный клапан"]=1;Deep.chainCheck(s,x);r.steps.push(x.chain.s);
  G.inv["энергетический кристалл"]=1;Deep.chainCheck(s,x);r.steps.push(x.chain.s);
  const g=s.mechs.find(m=>m.kind==="generator");at(g.tier);if(["damaged","repair"].includes(Deep.mst(x,g)))Deep.mechAct(g.id,"repair");Deep.mechAct(g.id,"on");at(core.tier);Deep.coreWake();r.steps.push(x.chain.s);r.power=Deep.power(s,x);
  Deep.route("doors");r.steps.push(x.chain.s);const door=s.mechs.find(m=>m.kind==="door");at(door.tier);Deep.openDoor(door.id);r.steps.push(x.chain.s);r.code=x.code;
  const con=s.mechs.find(m=>m.kind==="console");at(con.tier);Deep.mechAct(con.id,"code");r.friendly=Deep.defenseFriendly(s,x);
  const gm=s.mechs.find(m=>m.kind==="guard");at(gm.tier);Deep.mechAct(gm.id,"guard");if(G.combat){G.combat.hp=0;victory();}r.steps.push(x.chain.s);
  Deep.chainChoice("settle");r.steps.push(x.chain.s);r.choice=x.chain.choice;while(activeLayer())closeTopUI();delete Deep.near;return r;});
 check('6. энергосеть и цепочка «Сердце древнего механизма»: десять этапов до решения о ядре',ц.steps[ц.steps.length-1]===10&&ц.power>=1&&ц.code&&ц.friendly&&/поселен/.test(ц.choice||""),ц);

 /* ── 7 ── */
 const к2=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);let v=s.mechs.find(m=>m.kind==="valve"&&m.tier<s.N);if(!v){v={id:"mv",kind:"valve",tier:1,st0:"open"};s.mechs.push(v);}
  Deep.near=()=>true;G.place.depth=v.tier;Deep.mechAct(v.id,"valve");const dry=x.eco[v.tier].w;Deep.mechAct(v.id,"valve");const flood=x.flood[v.tier+1];delete Deep.near;while(activeLayer())closeTopUI();return {dry,flood};});
 check('7. клапан: перекрыли — ярус сохнет; открыли — ярус ниже затапливает',к2.dry===0&&к2.flood===1,к2);

 /* ── 8 ── */
 const л=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);G.place.depth=1;const z=s.secrets.find(q=>q.tier===1)||s.secrets[0];G.place.depth=z.tier;
  const how={sound:"listen",draft:"listen",vibe:"touch",heat:"touch",smell:"smell",echo:"magic",item:"torch"}[z.cue];G.items=(G.items||[]).concat(["Факел"]);for(let k=0;k<12&&!x.found[z.id];k++)Deep.search(how);
  z.gives="лаз вниз";z.to=Math.min(s.N,z.tier+2);Deep.near=()=>true;const d0=G.place.depth;Deep.secretUse(z.id);delete Deep.near;while(activeLayer())closeTopUI();
  return {found:!!x.found[z.id],from:d0,to:G.place.depth,want:z.to};});
 check('8. тайный ход находят чувством; лаз уводит на несколько ярусов вниз мимо стражей',л.found&&л.to===л.want&&л.to>л.from,л);

 /* ── 9 ── */
 const з=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);let pz=s.puzzles.find(q=>q.type==="bells");if(!pz){pz=Deep.genPuzzle("ptest","bells",1,Deep.rng(5));s.puzzles.push(pz);}
  Deep.near=()=>true;G.place.depth=pz.tier;pz.ans.forEach(k=>Deep.pzIn(pz.id,k));const solved=!!x.solved[pz.id];
  let L=s.locks.find(l=>l.kind==="plain");if(!L){L=Deep.genLock("ltest","plain",1,s,Deep.rng(9));s.locks.push(L);}G.place.depth=L.tier;Deep.lockTry(L.id,null);const без=!x.locks[L.id];
  G.inv["ключ от чужой двери"]=1;Deep.lockTry(L.id,null);const чужой=!x.locks[L.id];G.inv[L.key]=1;Deep.lockTry(L.id,null);delete Deep.near;while(activeLayer())closeTopUI();
  return {solved,без,чужой,свой:!!x.locks[L.id]};});
 check('9. загадка решается; замок открывает только свой ключ',з.solved&&з.без&&з.чужой&&з.свой,з);

 /* ── 10 ── */
 const п=await p.evaluate(()=>{const s=Deep.here();G.place.depth=Math.max(1,Math.min(s.N-1,2));G.mana=100;const g=guardianHere();const ps=Deep.paths().map(x=>x[0]);const d0=G.place.depth;
  if(ps.includes("magic"))Deep.pathGo("magic");while(activeLayer())closeTopUI();return {g:!!g,ps,from:d0,to:G.place.depth};});
 check('10. пути вниз: силой, чарами и прочими; чары проводят мимо стража',п.ps.includes("down")&&(!п.g||(п.ps.includes("magic")&&п.to===п.from+1)),п);

 /* ── 11 ── */
 const б=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);G.place.depth=s.N;G.hp=G.hpMax;Deep.fightBoss();const m=G.combat&&G.combat.m;const def=bossDef(m.boss.id);
  const r={phases:def.фазы.length,deep:def.deep,arena:Deep.arenaObjs().length};G.combat.hp=Math.round(m.hp*0.6);bossPhaseCheck();fight("defend");r.phase=m.boss.phase;
  /* поражение без переноса в город: память владыки — та же, что зовёт defeat() */
  Deep.onLose(m);endCombat();r.learn=(x.boss.learn||[]).slice();G.hp=G.hpMax;Deep.fightBoss();const m2=G.combat.m;r.counter=!!m2.dw.counter;G.combat.hp=0;victory();r.dead=!!x.boss.dead;
  r.weapon=(G.gear||[]).some(it=>it&&/владыки/.test(it.name||""));while(activeLayer())closeTopUI();return r;});
 check('11. владыка: шесть фаз и арена; поражение учит его; победа даёт вещь с историей',б.phases===6&&б.deep&&б.arena>=2&&б.phase>=3&&б.learn.length>=1&&б.counter&&б.dead&&б.weapon,б);

 /* ── 12 ── */
 const ф=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);Deep.questsEnsure(s,x);const q=x.quests.filter(z=>!z.done);const f=s.factions[0];x.rep[f.id]=55;Deep.ally(f.id);const ally=!!x.ally[f.id];Deep.betray(f.id);
  while(activeLayer())closeTopUI();return {n:q.length,why:q.every(z=>z.why),ally,betrayed:!x.ally[f.id]&&x.rep[f.id]<0};});
 check('12. поручения с причиной; союз и предательство меняют репутацию',ф.n>=1&&ф.why&&ф.ally&&ф.betrayed,ф);

 /* ── 13 ── */
 const с=await p.evaluate(()=>{const key=Deep.here().key;const before=JSON.stringify(G.deep[key].chain)+JSON.stringify(G.deep[key].locks);saveGame(true);const raw=store.get(SAVE_KEY);G.deep={};applySave(raw,"набор 280");
  return {same:JSON.stringify((G.deep[key]||{}).chain)+JSON.stringify((G.deep[key]||{}).locks)===before};});
 check('13. состояние подземелья переживает сохранение',с.same,с);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
