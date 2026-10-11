/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 305: ЗАДАНИЯ РАЗНЫЕ — ДЕСЯТЬ ПОБОЧНЫХ, ОСНОВНОЕ С ЦЕЛЬЮ (15.0)

   Просьба игрока: «чтобы убить можно было не только двух монстров, а
   каких-то конкретно, или куда-то сходить в подземелье, или ещё что-то;
   задания абсолютно разнообразные, основные и побочные; побочных не три, а
   десять».
   1. У жителя десять побочных на день, все разных родов; у стражи — тоже
      десять, из пятнадцати родов службы; окно «Задания» показывает десять.
   2. Среди побочных есть новые роды: твари определённого рода, подземелье
      (спуск или нечисть названного подземелья), подземный клад, логово,
      ночная охота, вожак, межевые камни, сторожевой зверь; у каждого — что
      сделать и сколько сделано словами.
   3. Счёт идёт сам: убитая тварь нужного рода, у логова, ночью, сильная;
      тварь подземелья на нужном ярусе; спуск на ярус; подземный сундук;
      межа; приручённый зверь — и каждый шаг слышен словом.
   4. Несделанное не сдаётся (называется, чего не хватает), сделанное
      сдаётся с наградой.
   5. Основное задание: «очисти округу — убей монстров» почти исчезло,
      вместо него — дела с целью (род тварей, подземелье, логово, ночь,
      вожак, обход меж, спуск); именная охота — на тварь этих мест.
   6. Незакрытых дел можно держать до двадцати; руководство об этом говорит.
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.СКАЗАНО=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0.apply(this,arguments);};
  /* житель и стражник поблизости */
  let npc=null,guard=null;
  outer:for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
   const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!c||!c.structure)continue;const L=safeFn(()=>npcsFor(c),[])||[];
   if(!npc)npc=L.find(n=>!GUARD_RE.test(String(n.prof||""))&&Q150.dungeons(n).length);if(!guard)guard=L.find(n=>GUARD_RE.test(String(n.prof||"")));if(npc&&guard)break outer;}
  window.ЖИТЕЛЬ=npc;window.СТРАЖ=guard;});

 /* ── 1. Десять побочных ── */
 const д=await p.evaluate(()=>{const r={};const s=sideQuestsFor(ЖИТЕЛЬ),g=sideQuestsFor(СТРАЖ);
  r.жит=s.map(q=>q.вид);r.страж=g.map(q=>q.вид);r.родовЖит=SIDE_KINDS.length;r.родовСтраж=GUARD_KINDS.length;
  npcQuestsView(ЖИТЕЛЬ.key);r.кнопок=[...document.querySelectorAll('#npcBody button[data-cmd^="qprev:"]')].filter(b=>/~s\d/.test(b.dataset.cmd)).length;
  while(activeLayer())closeTopUI();return r;});
 check('1. у жителя десять побочных на день, все разных родов; у стражи десять из пятнадцати родов; окно показывает десять',
  д.жит.length===10&&new Set(д.жит).size===10&&д.страж.length===10&&new Set(д.страж).size===10&&д.родовЖит>=16&&д.родовСтраж>=15&&д.кнопок===10,д);

 /* ── 2. Новые роды и их слова ── */
 const н=await p.evaluate(()=>{const r={слова:{}};const все=[];
  /* перебор дней: все роды жителя и стражи появляются */
  const d0=G.day;for(let d=1;d<=12;d++){G.day=d;все.push(...sideQuestsFor(ЖИТЕЛЬ),...sideQuestsFor(СТРАЖ));}G.day=d0;
  r.типы=[...new Set(все.map(q=>q.type))].sort();
  for(const t of ["kill_fam","dng_depth","dng_kill","dng_chest","zone_kill","night_kill","elite","explore","tame"]){const q=все.find(x=>x.type===t);
   r.слова[t]=q?[q.заглавие,questNeedText(q),qProgressText(q)]:null;}
  return r;});
 const нов=["kill_fam","dng_depth","dng_kill","dng_chest","zone_kill","night_kill","elite","explore","tame"];
 check('2. новые роды побочных: род тварей, подземелье, клад, логово, ночь, вожак, межи, сторожевой зверь — у каждого слова «что» и «сколько»',
  нов.every(t=>н.слова[t]&&н.слова[t].every(x=>x&&x.length>3)),н);

 /* ── 3. Счёт идёт сам ── */
 const с=await p.evaluate(async()=>{const r={};G.quests=[];G.place=null;
  const взять=(t,доп)=>{const все=[];const d0=G.day;for(let d=1;d<=20&&!все.some(q=>q.type===t);d++){G.day=d;все.push(...sideQuestsFor(ЖИТЕЛЬ),...sideQuestsFor(СТРАЖ));}G.day=d0;
   const q=все.find(x=>x.type===t);Object.assign(q,доп||{});q.done=false;q.have=0;G.quests.push(q);return q;};
  const мон=(id,lvl)=>Object.assign({},MONSTERS.find(m=>m.id===id)||MONSTERS[0],{lvl:lvl||1});
  /* род тварей */
  const kf=взять("kill_fam");const чужая=MONSTERS.find(m=>foeFamily(m)!==kf.fam),своя=MONSTERS.find(m=>foeFamily(m)===kf.fam);
  СКАЗАНО.length=0;questMonsterProgress(мон(чужая.id));r.чужая=kf.have;questMonsterProgress(мон(своя.id));r.своя=kf.have;r.словоШага=СКАЗАНО.some(t=>/Задание «.*»: 1 из/.test(t));
  /* ночь */
  const nk=взять("night_kill");G.hour=13;questMonsterProgress(мон("wolf"));r.днём=nk.have;G.hour=23;questMonsterProgress(мон("wolf"));r.ночью=nk.have;G.hour=12;
  /* вожак */
  const el=взять("elite");questMonsterProgress(мон("wolf",1));r.слабый=el.have;questMonsterProgress(мон("wolf",el.lvl+1));r.сильный=el.have;
  /* логово */
  const zk=взять("zone_kill");G.x=zk.tx+10;G.y=zk.ty;questMonsterProgress(мон("wolf"));r.далеко=zk.have;G.x=zk.tx+2;G.y=zk.ty-1;questMonsterProgress(мон("wolf"));r.уЛогова=zk.have;
  /* подземелье: тварь на нужном ярусе названного подземелья */
  const dk=взять("dng_kill");G.place={kind:"dungeon",bx:dk.bx,by:dk.by,depth:Math.max(1,dk.depth)-1||0};
  if(dk.depth>1){questMonsterProgress(мон("wolf"));r.выше=dk.have;}else r.выше=0;
  G.place.depth=dk.depth;questMonsterProgress(мон("wolf"));r.наЯрусе=dk.have;G.place.bx+=3;questMonsterProgress(мон("wolf"));r.чужоеПодз=dk.have;
  /* спуск на ярус */
  const dd=взять("dng_depth");G.place={kind:"dungeon",bx:dd.bx||1,by:dd.by||1,depth:1};Q150.onDepth();r.ярус1=!!dd.doneFlag;G.place.depth=dd.depth;Q150.onDepth();r.ярусN=!!dd.doneFlag;
  /* подземный сундук */
  const ch=взять("dng_chest");G.place=null;Q150.onChest();r.сундукНаверху=ch.have;G.place={kind:"dungeon",bx:1,by:1,depth:1};Q150.onChest();r.сундукВнизу=ch.have;G.place=null;
  /* межи */
  const ex=взять("explore");for(const [x,y] of ex.pts){G.x=x;G.y=y;Q150.onStep();}r.межи=[(ex.got||[]).length,!!ex.doneFlag];
  /* сторожевой зверь */
  const tm=взять("tame");Director.note("tame","проба");r.приручён=tm.have;
  r.все=G.quests.map(q=>[q.type,Q150.сделано(q)]);return r;});
 check('3. счёт идёт сам: род, ночь, вожак, логово, подземелье и ярус, сундук, межи, приручение; шаг звучит словом',
  с.чужая===0&&с.своя===1&&с.словоШага&&с.днём===0&&с.ночью===1&&с.слабый===0&&с.сильный===1&&с.далеко===0&&с.уЛогова===1&&
  с.выше===0&&с.наЯрусе===1&&с.чужоеПодз===1&&!с.ярус1&&с.ярусN&&с.сундукНаверху===0&&с.сундукВнизу===1&&
  с.межи[0]===3&&с.межи[1]&&с.приручён===1,с);

 /* ── 4. Сдать: несделанное — нет, сделанное — с наградой ── */
 const сд=await p.evaluate(()=>{const r={};G.quests=[];const все=[];const d0=G.day;for(let d=1;d<=12;d++){G.day=d;все.push(...sideQuestsFor(ЖИТЕЛЬ));}G.day=d0;
  const q=все.find(x=>x.type==="kill_fam");q.done=false;q.have=0;G.quests.push(q);
  СКАЗАНО.length=0;const g0=G.gold;completeQuest(q.id);r.несделано=[q.done,G.gold-g0,СКАЗАНО.join(" ").slice(0,200)];
  q.have=q.need;const g1=G.gold;completeQuest(q.id);r.сделано=[q.done,G.gold-g1];return r;});
 check('4. несделанное не сдаётся и называет, чего не хватает; сделанное сдаётся с наградой',
  !сд.несделано[0]&&сд.несделано[1]===0&&/ещё не выполнено/.test(сд.несделано[2])&&сд.сделано[0]&&сд.сделано[1]>0,сд);

 /* ── 5. Основное задание с целью ── */
 const о=await p.evaluate(()=>{const seen=new Set(),types={};let n=0,общих=0,охотЧужих=0,охот=0;const R=90;
  for(let dy=-R;dy<=R;dy+=2)for(let dx=-R;dx<=R;dx+=2){const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!c||!c.structure)continue;
   for(const z of (safeFn(()=>npcsFor(c),[])||[])){if(seen.has(z.key))continue;seen.add(z.key);const q=safeFn(()=>questFor(z),null);if(!q)continue;n++;types[q.type]=(types[q.type]||0)+1;
    if(q.type==="kill"&&/^Очисти округу/.test(q.text))общих++;
    if(q.type==="hunt"&&q.monsterId){охот++;const м=MONSTERS.find(m=>m.id===q.monsterId);if(м&&!(м.biomes||[]).includes(Q150.terr(z)))охотЧужих++;}}}
  return {n,types,общих,охот,охотЧужих};});
 const новыхОсн=["kill_fam","dng_kill","zone_kill","night_kill","elite","explore","dng_depth"].filter(t=>(о.types[t]||0)>0).length;
 check('5. основное: «очисти округу» почти исчезло, вместо него — дела с целью; именная охота — на здешнюю тварь',
  о.n>=200&&о.общих/о.n<0.03&&новыхОсн>=6&&о.охотЧужих===0,о);

 /* ── 6. Предел дел ── */
 const пр=await p.evaluate(()=>{const s=GUIDE_SECS.find(x=>x.body.some(b=>/десять побочных/.test(b)));const b=s?s.body.find(b=>/десять побочных/.test(b)):"";
  return {предел:QUEST_LIMIT,руководство:/десять побочных/.test(b)&&/до двадцати незакрытых дел/.test(b)&&/подземелье/.test(b)};});
 check('6. незакрытых дел можно держать до двадцати; руководство говорит о десяти побочных и новых родах дел',пр.предел===20&&пр.руководство,пр);
 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
