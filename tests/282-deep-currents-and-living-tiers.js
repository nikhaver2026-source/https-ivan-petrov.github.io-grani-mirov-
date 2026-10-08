/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 282: 13.5 — ГЛУБЬ 2: ЖИВЫЕ ЯРУСЫ И ТЕЧЕНИЯ МИФОВ

   Просьбы игрока: «в подземельях почему-то ни квестов, ничего этого нет»;
   «наполнение каждого яруса должно быть уникальным — квесты, персонажи,
   монстры, ресурсы, артефакты, механизмы, экосистема; поверхности,
   ловушки, заклинания, лестницы»; «просмотри мифологии разных стран —
   китайскую, японскую, английскую, индийскую, французскую — переработай
   оригинально и встрой глубоко в Грань».

   1. У каждого яруса своё: имя, ресурс, реликвия, твари и тварь течения,
      течение, закон, диковина, пол и лестница; течения чередуются.
   2. Приход на ярус говорит о течении; пол и лестница звучат по ярусу.
   3. Жители стоят прямо в ярусе; с ними говорят и берут дело в журнал.
   4. Диковина: просит своего и отвечает исходом; второй раз не отдаёт.
   5. Алтарь течения: дар — один знак из трёх, и только один.
   6. Легенда течения: пять шагов — жетоны, хранитель, владыка, награда.
   7. Тварь течения: свой навык и свой приём раз в три хода.
   8. Круг Пяти Перемен: сдерживающая сила бьёт сильнее сдерживаемой.
   9. Отвар течения варится из здешнего и пьётся.
  10. Перемена яруса меняется сама и слышна; предчувствие после шагов.
  11. Течения в мире: летопись у входа и слухи.
  12. Всё переживает сохранение; ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};G.level=14;G.hpMax=400;G.hp=400;G.mana=200;G.manaMax=200;G.gold=500;
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__said.push(String(t));return s0(t,o);};});

 /* ── 1 ── */
 const у=await p.evaluate(async()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1500&&!c;y+=41){const cc=cellContent(x,y);
   if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon"&&Deep.spec(x,y,cc.structure.type).N>=12)c={x,y,t:cc.structure.type};}
  window.__dg=c;const s=Deep.spec(c.x,c.y,c.t);const sig=[];for(let i=1;i<=s.N;i++)sig.push(Deep.tierSig(s,i));
  const uniq=a=>new Set(a).size===a.length;const curs=sig.map(g=>g.cur);let same=0;for(let i=1;i<curs.length;i++)if(curs[i]===curs[i-1])same++;
  const full=sig.every(g=>g.cur&&MYTH_BY_ID[g.cur]&&g.laws.length>=1&&g.mf&&g.mf.myth&&g.curio!=null&&g.surf&&SURF_ROLE[g.surf]&&STAIR_SET[g.stair]&&g.fauna.length===3);
  /* другое подземелье — другие ярусы */
  let c2=null;for(let x=c.x+500;x<60000&&!c2;x+=37)for(let y=1000;y<1500&&!c2;y+=41){const cc=cellContent(x,y);if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon")c2={x,y,t:cc.structure.type};}
  const s2=Deep.spec(c2.x,c2.y,c2.t);const g2=Deep.tierSig(s2,1);
  return {N:s.N,names:uniq(sig.map(g=>g.name)),res:uniq(sig.map(g=>g.res)),relic:uniq(sig.map(g=>g.relic)),full,curs:new Set(curs).size,same,
   other:g2.name!==sig[0].name||g2.cur!==sig[0].cur||g2.mf.n!==sig[0].mf.n,surfs:new Set(sig.map(g=>g.surf)).size};});
 check('1. у каждого яруса своё: имя, ресурс, реликвия, твари, течение, закон, диковина, пол, лестница',у.names&&у.res&&у.relic&&у.full&&у.curs>=3&&у.same<у.N/2&&у.other&&у.surfs>=3,у);

 /* ── 2 ── */
 const в=await p.evaluate(async()=>{const c=window.__dg;G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  changeDepth(1-G.place.depth,{bypass:true});await new Promise(r=>setTimeout(r,1500));while(activeLayer())closeTopUI();
  const s=Deep.here();const x=Deep.st(s);delete (x.mythTold||{})[1];const g=Deep.sigOf();const line=Deep.tierLine(1);
  return {line,surf:indoorSurface(),want:g.surf,stair:stairSet()===STAIR_SET[g.stair],fl:flightLen(1),seen:!!G.myth&&!!G.myth.seen[g.cur]};});
 check('2. приход на ярус говорит о течении, законе, перемене и поле; пол и лестница — по ярусу',/течение «/.test(в.line)&&/Закон:/.test(в.line)&&/Перемена:/.test(в.line)&&в.surf===в.want&&в.stair&&в.fl>=4&&в.seen,в);

 /* ── 3 ── */
 const ж=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);let t=0;for(let i=1;i<=s.N&&!t;i++)if(Deep.npcsOn(s,x,i).length)t=i;if(!t)return {none:1};
  changeDepth(t-G.place.depth,{bypass:true});await new Promise(r=>setTimeout(r,1500));while(activeLayer())closeTopUI();
  const acts=Deep.actors();const a=acts[0];const r={tier:t,actors:acts.length};if(!a)return r;
  G.place.x=a.x;G.place.y=a.y+1;r.near=!!Deep.npcNear(1);r.label=Deep.talkLabel();r.menu=amAvailable("deeptalk");
  Deep.useHere();r.talk=document.getElementById("dpBody").innerHTML;
  const n=Deep.npcNear(1).n;Deep.questsEnsure(s,x);const q=Deep.offerOf(s,x,n);r.offer=!!q;
  if(q){const before=(G.quests||[]).length;Deep.qTake(q.id);r.journal=(G.quests||[]).length===before+1&&G.quests.some(e=>e.type==="deep"&&e.deep&&e.deep.qid===q.id);}
  while(activeLayer())closeTopUI();return r;});
 check('3. жители стоят прямо в ярусе; разговор «Действием здесь»; дело — в журнал',!ж.none&&ж.actors>=1&&ж.near&&/^Поговорить: /.test(ж.label)&&ж.menu&&/Спросить, что/.test(ж.talk)&&(!ж.offer||ж.journal),ж);

 /* ── 4 ── */
 const д=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const d=G.place.depth;const g=Deep.sigOf();const def=Deep.curioDef(s,d);
  const e=Deep.els(s,x,d).find(z=>z.t==="curio");G.place.x=e.x;G.place.y=e.y;
  G.inv[g.res]=5;G.gold=500;G.water=50;G.items=(G.items||[]).concat(["Факел"]);
  Deep.el("curio:c"+d);const view=document.getElementById("dpBody").innerHTML;
  const before=JSON.stringify([G.gold,G.inv[g.res],G.hp,G.xp,G.mana,(G.myth.signs||{})]);Deep.cmd(`cur:${d}:give`);const res=document.getElementById("dpBody").innerHTML;
  const gone=!Deep.els(s,x,d).some(z=>z.t==="curio");Deep.cmd(`cur:${d}:touch`);const again=window.__said.slice(-3).join(" | ")+" "+(document.getElementById("dpBody").innerHTML||"");
  while(activeLayer())closeTopUI();
  return {n:def.cd.n,view:/cur:\d+:give/.test(view)&&/cur:\d+:touch/.test(view),res:res.slice(0,300),took:!!x.curio[d],gone,again:/уже отдала/.test(again),
   changed:JSON.stringify([G.gold,G.inv[g.res],G.hp,G.xp,G.mana,(G.myth.signs||{})])!==before||/ничего не происходит|тайного|уже/.test(res)};});
 check('4. диковина: просит своё, отвечает исходом, второй раз не отдаёт',д.view&&д.took&&д.gone&&д.again&&д.changed,д);

 /* ── 5 ── */
 const а=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const cid=Deep.sigOf().cur;const t=Deep.altarTier(s,cid);
  changeDepth(t-G.place.depth,{bypass:true});await new Promise(r=>setTimeout(r,1200));while(activeLayer())closeTopUI();
  const e=Deep.els(s,x,t).find(z=>z.t==="altar");G.place.x=e.x;G.place.y=e.y;Deep.useHere();const v=document.getElementById("dpBody").innerHTML;
  const picks=[...document.querySelectorAll('#dpBody [data-cmd^="dp:altarpick:"]')].map(b=>b.dataset.cmd.slice(3));
  const had=(G.myth.signs[cid]||[]).length;if(picks[0])Deep.cmd(picks[0]);const after=(G.myth.signs[cid]||[]).length;
  if(picks[1])Deep.cmd(picks[1]);const twice=(G.myth.signs[cid]||[]).length;const v2=document.getElementById("dpBody").innerHTML;
  while(activeLayer())closeTopUI();window.__cid=cid;return {t,cid,picks:picks.length,had,after,twice,legend:/legstart:/.test(v),taken:/Дар алтаря взят|уже одарил/.test(v2)};});
 check('5. алтарь течения: дар — один знак из трёх, второй не даётся',а.picks>=1&&а.picks<=3&&а.after===а.had+1&&а.twice===а.after&&а.legend&&а.taken,а);

 /* ── 6 ── */
 const л=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const cid=window.__cid;const C=MYTH_BY_ID[cid];const r={steps:[]};
  Deep.legStart(cid);r.steps.push(x.leg&&x.leg.st);const q=Deep.legQ(s,x);r.journal=G.quests.some(e=>e.id===Deep.jid(s,q));
  for(let k=0;k<3;k++)Deep.legToken(s,x,cid);await new Promise(r0=>setTimeout(r0,700));r.steps.push(x.leg.st);
  Deep.legGive("altar");r.steps.push(x.leg.st);
  Deep.legLord(cid);const m=G.combat&&G.combat.m;r.lord=!!(m&&m.dw&&m.dw.lord===cid);r.lordName=m&&m.n;r.myth=m&&m.dw&&m.dw.myth;
  if(G.combat){G.combat.hp=0;victory();}await new Promise(r0=>setTimeout(r0,300));while(activeLayer())closeTopUI();r.steps.push(x.leg.st);
  Deep.legFinish(cid);r.steps.push(x.leg.st);const it=C.легенда.награда;r.item=G.myth.items.some(z=>z.c===cid&&z.i===it)&&(G.items||[]).some(t=>t===`Вещь течения: ${C.вещи[it].n}`);
  r.done=!!q.done;r.jdone=!!(G.quests.find(e=>e.id===Deep.jid(s,q))||{}).done;r.note=(document.getElementById("dpBody").innerHTML||"").slice(0,200);
  r.awaken=C.легенда.дар!=="awaken"||(G.myth.aw[Deep.wName()]>=30);while(activeLayer())closeTopUI();return r;});
 check('6. легенда течения: жетоны, хранитель, владыка, награда — пять шагов и запись в журнале',JSON.stringify(л.steps)==="[1,2,3,4,5]"&&л.journal&&л.lord&&/владыка течения/.test(л.lordName||"")&&л.item&&л.done&&л.jdone&&л.awaken,л);

 /* ── 7 ── */
 const т=await p.evaluate(()=>{const s=Deep.here();const d=G.place.depth;const g=Deep.sigOf();const rnd=Math.random;Math.random=()=>0.01;
  const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf"),{hp:400,dmg:4,lvl:3,xp:20,gold:5});startCombat({x:G.place.x,y:G.place.y,monster:m});Math.random=rnd;
  const cb=G.combat;const r={myth:m.dw&&m.dw.myth,want:g.mf.myth,sk:m.dw&&m.dw.skills.includes(g.mf.sk),n:m.n};const A=MYTH_BY_ID[g.mf.cur].твари.find(z=>z.id===g.mf.myth);
  const B=m.dw.B;const b0=JSON.stringify([B.cleave,B.dodge,B.minions,cb.hp,G.mana]);const t1=Deep.turn(cb,"atk");const t2=Deep.turn(cb,"atk");
  r.move=t2.indexOf(A.ход.t)>=0;r.changed=JSON.stringify([B.cleave,B.dodge,B.minions,cb.hp,G.mana])!==b0||A.ход.k==="fear";
  G.combat.hp=0;victory();while(activeLayer())closeTopUI();return r;});
 check('7. тварь течения: своё имя, свой навык и свой приём раз в три хода',т.myth===т.want&&т.sk&&т.move&&т.changed,т);

 /* ── 8 ── */
 const к=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);let t=0;for(let i=1;i<=s.N&&!t;i++)if(Deep.tierSig(s,i).cur==="krug")t=i;if(!t)return {none:1};
  const d0=G.place.depth;G.place.depth=t;const ph=Deep.phaseOf(s,t);const strong=Object.keys(MYTH_RESTRAIN).find(k=>MYTH_RESTRAIN[k]===ph.f.sch);const weak=MYTH_RESTRAIN[ph.f.sch];
  const keepFx=Deep.mythFx;Deep.mythFx=()=>[];const ks=Deep.mythDmgK("spell",strong),kw=Deep.mythDmgK("spell",weak),kp=Deep.mythDmgK("spell",strong==="air"?"plants":strong);Deep.mythFx=keepFx;
  G.place.depth=d0;return {phase:ph.f.n,strong,weak,ks,kw,kp};});
 check('8. Круг Пяти Перемен: сдерживающая сила бьёт сильнее, сдерживаемая — слабее',к.none||(к.ks>1.2&&к.kw<1&&(к.strong!=="air"||к.kp===к.ks)),к);

 /* ── 9 ── */
 const о=await p.evaluate(()=>{const s=Deep.here();const x=Deep.st(s);const d=G.place.depth;const g=Deep.sigOf();G.inv[g.res]=4;
  const n0=G.myth.brews.length;const t=Deep.brewMake(s,x,d,false);const made=G.myth.brews.length===n0+1&&G.inv[g.res]===2;
  G.hp=50;G.mana=10;G.myth.skv=6;const b=G.myth.brews[G.myth.brews.length-1];const B=MYTH_BY_ID[b.c].отвары[b.i];
  const before=JSON.stringify([G.hp,G.mana,G.myth.skv,G.hour,G.myth.buff]);Deep.brewDrink(G.myth.brews.length-1);
  const drunk=G.myth.brews.length===n0&&JSON.stringify([G.hp,G.mana,G.myth.skv,G.hour,G.myth.buff])!==before;const v=document.getElementById("dpBody").innerHTML;
  while(activeLayer())closeTopUI();return {t,made,drunk,said:/Вы пьёте/.test(v),B:B.n};});
 check('9. отвар течения: варится из здешнего, пьётся и действует',о.made&&о.drunk&&о.said,о);

 /* ── 10 ── */
 const п=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const d=G.place.depth;window.__said.length=0;
  x.ph=x.ph||{};const ph0=Deep.phaseOf(s,d);x.ph[d]=ph0.k;let k=0;while(Deep.phaseOf(s,d).k===ph0.k&&k<30){G.hour=(Number(G.hour)||0)+1;if(G.hour>=24){G.hour-=24;G.day++;}k++;}
  x.ts=x.ts||{};x.ts[d]=9;x.feel={};Deep.step(G.place.x,G.place.y);await new Promise(r=>setTimeout(r,300));
  const said=window.__said.join(" | ");return {phase:/Перемена яруса: /.test(said),feel:/Предчувствие: /.test(said),said:said.slice(0,400)};});
 check('10. перемена яруса меняется сама и слышна; после шагов — предчувствие',п.phase&&п.feel,п);

 /* ── 11 ── */
 const м=await p.evaluate(()=>{const c=window.__dg;dungLoreCache.clear();const l=dungeonLore(c.x,c.y,c.t);const rnd=Math.random;let tale="";
  Math.random=()=>0.05;try{tale=rumor();}finally{Math.random=rnd;}
  const names=MYTH_CURRENTS.map(z=>z.n);return {lore:/Из глубины сюда просачиваются течения/.test(l.о),tale,mythTale:MYTH_CURRENTS.some(C=>tale.indexOf(C.n)>=0||tale.indexOf(C.ист)>=0||tale.indexOf(C.легенда.n)>=0)};});
 check('11. течения в мире: летопись у входа и сказы в слухах',м.lore&&м.mythTale,м);

 /* ── 12 ── */
 const с=await p.evaluate(()=>{const before=JSON.stringify(G.myth);const key=Deep.here().key;const leg=JSON.stringify(G.deep[key].leg);saveGame(true);const raw=store.get(SAVE_KEY);G.myth={};G.deep={};applySave(raw,"набор 282");
  return {same:JSON.stringify(G.myth)===before,leg:JSON.stringify((G.deep[key]||{}).leg)===leg};});
 check('12. течения и легенда переживают сохранение',с.same&&с.leg,с);
 check('13. ошибок страницы нет',errors.length===0,errors.slice(0,5));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
