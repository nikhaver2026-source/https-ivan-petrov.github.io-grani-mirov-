/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 287 — ЗВУК СЕТИ ГРАНЕЙ (14.0)
   Сеть Граней получила свои записи (sounds/hron) и встроена в звуковой мир:
   1. Все роли gr_* есть в банке; у каждой — описание и файлы из sounds/hron.
   2. У каждого из десяти классов Граней свой фон (класс.звук = gr_amb_*),
      свой отзвук (ROOM.gran_*) и свои голоса места (AMBIENCE_SET.gran_*).
   3. В Грани: фон места — фон её класса (не огонь очага), отзвук — её
      класса (не «дом»), голоса места — только её собственные.
   4. Узлы Сети звучат своими маяками: у каждого рода — свой (gr_node_*).
   5. Переход: голос узла, затем gr_transit; прибытие — gr_arrive; срыв —
      звук своего рода; возвращение — gr_return; отказ — gr_deny.
   6. Чутьё, свидетельство, вывод, алтарь, жители, сбор, механизм, запись —
      свои звуки; страж Покрова говорит голосом gr_warden.
   7. В энциклопедии звуков — свой раздел «Сеть Граней».
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const p=await (await browser.newContext()).newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  const out={};
  /* звуки, которые игра просит сыграть */
  window.PLAYED=[];const bp0=Bank.play.bind(Bank);Bank.play=(role,o)=>{PLAYED.push(role);try{return bp0(role,o);}catch(_){return null;}};
  /* 1 */
  const роли=Object.keys(SOUND_BANK).filter(k=>/^gr_/.test(k));
  out.ролей=роли.length;
  out.плохиеРоли=роли.filter(k=>!SOUND_BANK[k].d||!SOUND_BANK[k].f.length||SOUND_BANK[k].f.some(f=>!/^hron\//.test(f)));
  /* 2 */
  out.классы=GRAN_CLASSES.map(c=>({id:c.id,фон:c.звук,есть:Bank.has(c.звук),отзвук:!!ROOM["gran_"+c.id],голоса:(AMBIENCE_SET["gran_"+c.id]||{spots:[]}).spots.map(s=>s[0])}));
  out.голосаЕсть=out.классы.every(c=>c.голоса.length>=2&&c.голоса.every(r=>/^gr_spot_/.test(r)&&Bank.has(r)));
  out.фоныРазные=new Set(GRAN_CLASSES.map(c=>c.звук)).size===GRAN_CLASSES.length;
  /* 4 */
  out.маяки=GRAN_NODE_KINDS.map(k=>{const st=Grani.structure({kind:k.id,key:"1,1",gran:"slowwater"});
   return {род:k.id,маяк:st.beacon,роль:BEACON_ROLE[st.beacon],голос:k.звук,есть:Bank.has(BEACON_ROLE[st.beacon]||"")};});
  /* 5: удачный переход и прибытие */
  G.grani={};const s=Grani.st();G.place=null;G.dark=false;G.hour=12;G.mana=99;G.day=20;
  const n5={x:G.x,y:G.y,kind:"crystal",gran:"slowwater",stab:1,hidden:false,key:G.x+","+G.y};
  G.inv=G.inv||{};G.inv["кристалл"]=3;
  Grani._rnd=()=>0.01;PLAYED.length=0;
  out.переход=Grani.transit(n5);
  await new Promise(z=>setTimeout(z,700));
  out.звукиПерехода=PLAYED.slice();
  /* 3: в Грани */
  const cls=Grani.cls(Grani.cur()).id;out.класс=cls;
  out.отзвук=roomKind();out.набор=ambienceSetFor();out.фон=bankAmbientRole();
  out.голосаМеста=Ambience.spots(ambienceSetFor());
  out.всеСвои=out.голосаМеста.length>0&&out.голосаМеста.every(([r])=>/^gr_spot_/.test(r));
  /* 6: действия внутри */
  PLAYED.length=0;Grani.sense();out.чутьё=PLAYED.slice();
  const ev=HRON_EVIDENCE.find(e=>!s.ev[e.id]);PLAYED.length=0;Grani.addEvidence(ev.id,"проверка");out.свид=PLAYED.slice();
  for(const e of HRON_EVIDENCE.filter(e=>!s.ev[e.id]).slice(0,3))s.ev[e.id]={day:Number(G.day)||1,where:"проверка"};
  const v=HRON_VERSIONS[0];PLAYED.length=0;Grani.adopt(v.id);
  out.вывод=PLAYED.slice();out.версия=s.verdict;
  const lvl=curLevel();const найти=ch=>{for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(lvl.g[y][x]===ch)return {x,y};return null;};
  const пробовать=(ch,fn)=>{const c=найти(ch);if(!c)return null;PLAYED.length=0;safeFn(()=>fn(c.x,c.y));return PLAYED.slice();};
  out.алтарь=пробовать("A",(x,y)=>Grani.altar(x,y));
  out.жители=пробовать("N",(x,y)=>Grani.talk(x,y));
  out.сбор=пробовать("R",(x,y)=>Grani.gather(x,y));
  out.механизм=пробовать("I",(x,y)=>Grani.mechanism(x,y));
  out.запись=пробовать("K",(x,y)=>Grani.readRecord(x,y));
  /* возвращение */
  PLAYED.length=0;Grani.leave();out.возврат=PLAYED.slice();out.дома=!Grani.inFacet();
  out.фонДома=bankAmbientRole();out.отзвукДома=roomKind();
  /* срывы: каждый род — свой звук */
  out.срывы={};
  for(const mode of ["сосед","время","ноша","магия","страж"]){
   G.place=null;G.inCombat=false;G.combat=null;G.mana=99;
   Grani.failMode=()=>mode;Grani.chance=()=>0;Grani._rnd=()=>0.5;
   PLAYED.length=0;Grani.transit({x:G.x,y:G.y,kind:"gate",gran:"slowwater",stab:0.1,hidden:false,key:"t"+mode});
   await new Promise(z=>setTimeout(z,1950));
   out.срывы[mode]=PLAYED.filter(r=>/^gr_fail_/.test(r));
   if(G.inCombat){out.стражГолос=G.combat&&G.combat.m&&G.combat.m.звук;out.стражСцена=SCAPE_FOE[G.combat.m.id];G.inCombat=false;G.combat=null;}
   if(Grani.inFacet())Grani.leave();}
  /* отказ */
  G.place=null;G.mana=0;PLAYED.length=0;Grani.transit({x:G.x,y:G.y,kind:"gate",gran:"slowwater",stab:1,hidden:false,key:"deny"});
  out.отказ=PLAYED.slice();
  /* 7 */
  out.раздел=!!ENC_BY_ID.grani&&roleSection("gr_transit")==="grani"&&roleSection("gr_amb_dead")==="grani";
  return out;});
 const ж=(a,b)=>Array.isArray(a)&&a.includes(b);
 check('1. все роли Сети Граней в банке, с описанием и файлами из sounds/hron',r.ролей>=50&&r.плохиеРоли.length===0,{ролей:r.ролей,плохие:r.плохиеРоли});
 check('2. у каждого класса Грани свой фон, свой отзвук и не меньше двух своих голосов места',
  r.классы.length===10&&r.классы.every(c=>/^gr_amb_/.test(c.фон)&&c.есть&&c.отзвук)&&r.голосаЕсть&&r.фоныРазные,r.классы);
 check('3. в Грани звучат её фон, её отзвук и только её голоса места',
  r.отзвук==="gran_"+r.класс&&r.набор==="gran_"+r.класс&&r.фон==="gr_amb_"+r.класс&&r.всеСвои,
  {класс:r.класс,отзвук:r.отзвук,набор:r.набор,фон:r.фон,голоса:r.голосаМеста});
 check('4. у каждого рода узла свой маяк и голос',
  r.маяки.length===6&&r.маяки.every(m=>m.маяк==="gr_node_"+m.род&&m.роль===m.маяк&&m.голос===m.маяк&&m.есть),r.маяки);
 check('5. переход: голос узла, затем переход и прибытие; возвращение — свой звук, дома снова свой фон',
  r.переход&&ж(r.звукиПерехода,"gr_node_crystal")&&ж(r.звукиПерехода,"gr_transit")&&ж(r.звукиПерехода,"gr_arrive")&&ж(r.возврат,"gr_return")&&r.дома&&!/^gr_/.test(r.фонДома)&&!/^gran_/.test(r.отзвукДома),
  {переход:r.звукиПерехода,возврат:r.возврат,фонДома:r.фонДома,отзвукДома:r.отзвукДома});
 check('5б. каждый род срыва звучит своим звуком, отказ узла — своим',
  ж(r.срывы.сосед,"gr_fail_neighbor")&&ж(r.срывы.время,"gr_fail_time")&&ж(r.срывы.ноша,"gr_fail_cargo")&&ж(r.срывы.магия,"gr_fail_magic")&&ж(r.срывы.страж,"gr_fail_guard")&&ж(r.отказ,"gr_deny"),
  {срывы:r.срывы,отказ:r.отказ});
 check('6. чутьё, свидетельство и вывод — свои звуки; страж Покрова говорит своим голосом',
  ж(r.чутьё,"gr_sense")&&ж(r.свид,"gr_evidence")&&(!r.версия||ж(r.вывод,"gr_verdict"))&&r.стражГолос==="gr_warden"&&r.стражСцена==="gr_warden",
  {чутьё:r.чутьё,свид:r.свид,вывод:r.вывод,версия:r.версия,страж:r.стражГолос,сцена:r.стражСцена});
 check('6б. алтарь, жители, сбор, механизм и запись в Грани звучат своими записями',
  [["алтарь","gr_altar"],["жители","gr_native"],["сбор","gr_gather"],["механизм","gr_mech"],["запись","gr_record"]].every(([k,v])=>r[k]===null||ж(r[k],v))
  &&[r.алтарь,r.жители,r.сбор,r.механизм,r.запись].filter(Boolean).length>=2,
  {алтарь:r.алтарь,жители:r.жители,сбор:r.сбор,механизм:r.механизм,запись:r.запись});
 check('7. в энциклопедии звуков свой раздел «Сеть Граней»',r.раздел===true);
 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
})();
