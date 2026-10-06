/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 246: 9.5 — ПРИПАС У СВОЕГО ОБЪЕКТА, «САМОУЧКА», СДЕЛАННОЕ ДАЁТ СВОЁ

   Жалобы игрока:
   • не каждый ресурс применялся у своего объекта (грибы — жаровня, руда —
     горн); у жаровни было одно «Применить в ремесле», и то не работало;
   • если нельзя — пусть игра скажет почему;
   • сделанное без учения ремесла — достижение «Самоучка» с рангами;
   • у объекта — свой список действий с припасом (пожарить, сварить…);
   • сделанные вещи сами должны что-то давать.

   1. У жаровни с грибами — свои действия: пожарить, подвялить; общего
      «Применить в ремесле» нет. У чана — похлёбка.
   2. Чего здесь не сделать — сказано почему и где применяют.
   3. Жареные грибы выходят и ложатся в «Еду»; без учения стряпни это
      «самоучкой», первая работа — достижение «Самоучка».
   4. Руда у горна без учения кузнечного дела плавится самоучкой.
   5. Десять работ самоучкой в одном ремесле открывают его на ступени ученика;
      ранги «Самоучки» растут, срыв без учения реже.
   6. Сделанное даёт своё: жареные грибы — сила удара, похлёбка на костях —
      стойкость к яду; уголь раздувает горн; шкура → мездрёная → выделанная
      кожа (со щёлоком) → подшитый доспех; древко с наконечником — копьё.
   7. У каждого действия — объекты, которые есть в игре, и звуки, которые есть
      в банке; у каждого сделанного материала есть своё применение.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return n0(t,o);};
  window.__где=["brazier"];window.invContext=()=>({станки:new Set(__где.filter(x=>STANOK_NAME[x])),вещи:new Set(__где),алтарь:null,торговец:null,житель:null,ночь:false,бой:false});
  G.mast={};G.selfTaught=null;G.items=[];G.inv={"грибы":6};Math.random=()=>0.99;});

 /* ── 1 ── */
 const п1=await p.evaluate(()=>{const a=invActionsAll(invRow("res","грибы"));
  __где=["cauldron"];const b=invActionsAll(invRow("res","грибы"));__где=["brazier"];
  return {жаровня:a.ok.map(x=>x.n),чан:b.ok.map(x=>x.n)};});
 check('1. у жаровни с грибами — «Пожарить» и «Подвялить», без общего «Применить в ремесле»; у чана — похлёбка',
  п1.жаровня.some(n=>/Пожарить грибы — жаровня/.test(n))&&п1.жаровня.some(n=>/Подвялить/.test(n))&&!п1.жаровня.some(n=>/Применить в ремесле/.test(n))
  &&п1.чан.some(n=>/грибную похлёбку/.test(n))&&!п1.чан.some(n=>/Пожарить/.test(n)),п1);

 /* ── 2 ── */
 const п2=await p.evaluate(()=>{__где=["anvil"];const a=invActionsAll(invRow("res","грибы"));__где=["brazier"];
  const r=a.blocked.find(x=>x.id==="craft");return r?r.почему:"";});
 check('2. у наковальни грибы не применить — сказано почему и где применяют',/наковальня — не для этого/.test(п2)&&/Грибы применяют: .*жаровня/.test(п2),п2);

 /* ── 3 ── */
 const п3=await p.evaluate(()=>{__said.length=0;invDo("oa_roast_mush","res","грибы");
  const ряд=invAll().find(r=>r.name==="Жареные грибы");
  return {есть:G.items.includes("Жареные грибы"),раздел:ряд&&ряд.cat,грибов:G.inv["грибы"],ранг:G.selfTaught&&G.selfTaught.ранг,said:__said.join(" | ")};});
 await p.waitForTimeout(1100);
 const сказано3=await p.evaluate(()=>__said.join(" | "));
 check('3. жареные грибы выходят и лежат в «Еде»; без учения стряпни — самоучкой, и это достижение «Самоучка»',
  п3.есть&&п3.раздел==="food"&&п3.грибов===5&&п3.ранг===1&&/самоучкой/.test(п3.said)&&/Достижение «Самоучка»/.test(сказано3),{п3,сказано3});

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{__где=["forge"];G.inv["руда"]=4;const a=invActionsAll(invRow("res","руда"));
  const ок=a.ok.some(x=>x.id==="craft");invDo("craft","res","руда");__где=["brazier"];
  return {ок,слиток:G.inv["слиток"]||0,руда:G.inv["руда"]||0,кузнец:mastLevel("smith")};});
 check('4. руда у горна без учения кузнечного дела плавится самоучкой',п4.ок&&п4.слиток===1&&п4.руда===0&&п4.кузнец===0,п4);

 /* ── 5 ── */
 const п5=await p.evaluate(()=>{const r0=selfTaughtRisk(0.25);G.inv["грибы"]=40;
  for(let i=0;i<10;i++)invDo("oa_roast_mush","res","грибы");
  return {стряпня:mastLevel("cook"),ранг:G.selfTaught.ранг,n:G.selfTaught.n,риск0:r0,риск:selfTaughtRisk(0.25),
   имя:invActionsAll(invRow("res","грибы")).ok.map(x=>x.n).find(n=>/Пожарить/.test(n))};});
 check('5. десять работ самоучкой открывают стряпню на ступени ученика; ранг «Самоучки» вырос, срыв реже, дальше — уже не самоучкой',
  п5.стряпня===1&&п5.ранг>=2&&п5.риск<п5.риск0&&!/самоучкой/.test(п5.имя),п5);

 /* ── 6 ── */
 const п6=await p.evaluate(()=>{const r={};
  const съесть=имя=>{G.items.push(имя);const i=G.items.lastIndexOf(имя);invDo("eat","item",String(i));};
  G.buffs={};съесть("Жареные грибы");r.мощь=buffActive("мощь");
  G.items.push("Похлёбка на костях");съесть("Похлёбка на костях");r.стойкость=buffActive("стойкость");
  __где=["forge"];G.inv["древесный уголь"]=1;invDo("oa_coal_forge","res","древесный уголь");r.рука=buffActive("твёрдая рука");
  __где=["bench"];G.inv["шкура"]=1;invDo("oa_scrape","res","шкура");r.мездра=G.inv["мездрёная шкура"]||0;
  __где=["cauldron"];G.inv["щёлок"]=1;invDo("oa_tan","res","мездрёная шкура");r.кожа=G.inv["выделанная кожа"]||0;
  __где=["bench"];invDo("oa_line_armor","res","выделанная кожа");r.страж=buffActive("страж");
  __где=["anvil"];G.inv["древко"]=1;G.inv["слиток"]=1;invDo("oa_spear_head","res","древко");r.копьё=(G.gear||[]).some(g=>g.name==="Копьё с железным наконечником"&&g.slot==="weapon");
  __где=["brazier"];return r;});
 check('6. сделанное даёт своё: грибы — сила, похлёбка на костях — стойкость, уголь — ровный горн, шкура → кожа → подшитый доспех, древко → копьё',
  п6.мощь&&п6.стойкость&&п6.рука&&п6.мездра===1&&п6.кожа===1&&п6.страж&&п6.копьё,п6);

 /* ── 7 ── */
 const п7=await p.evaluate(()=>{const объекты=new Set([...PROPS.map(x=>x.id),...FINDS.map(x=>x.id),...Object.keys(STANOK_NAME),"altar"]);
  const чужие=[],беззвука=[],безимени=[];
  OBJ_ACTS.forEach(a=>{a.at.forEach(o=>{if(!объекты.has(o))чужие.push(a.id+":"+o);if(objName(o)===o)безимени.push(o);});(a.звук||[]).forEach(z=>{if(!SOUND_BANK[z])беззвука.push(a.id+":"+z);});});
  const сделанное=new Set();OBJ_ACTS.forEach(a=>Object.keys(a.даёт||{}).forEach(k=>сделанное.add(k)));
  const бездела=[...сделанное].filter(k=>!OBJ_ACTS.some(a=>a.res.includes(k))&&!TECHS.some(t=>t.берёт&&t.берёт[k])&&!OBJ_ACTS.some(a=>a.ещё&&a.ещё[k]));
  const еда=OBJ_ACTS.filter(a=>a.вещь).map(a=>a.вещь).filter(n=>!FOOD_EFFECTS[n]);
  return {чужие,беззвука,безимени,бездела,еда,всего:OBJ_ACTS.length};});
 check('7. объекты действий есть в игре и названы вслух, звуки есть в банке; у каждого сделанного материала есть применение, у каждой еды — свой эффект',
  !п7.чужие.length&&!п7.беззвука.length&&!п7.безимени.length&&!п7.бездела.length&&!п7.еда.length&&п7.всего>=40,п7);

 /* ── 8 ── */
 const п8=await p.evaluate(()=>{G.inv={"грибы":1};const o={плитка:"X",вещь:"brazier",x:1,y:1,d:0};
  const сп=actionsFor(o).map(a=>({id:a.id,n:a.n}));const жар=actionsFor(o).find(a=>a.id==="oa:roast_mush");
  const до=G.items.length;if(жар)жар.делать(o);
  const инфо=actionsFor(o).find(a=>a.id==="oa:info");
  const горн=actionsFor({плитка:"F",станок:"forge",x:2,y:2,d:0}).map(a=>a.n);
  return {сп,сделано:G.items.length>до,инфо:инфо&&инфо.о,горн};});
 check('8. в меню самой жаровни — «Пожарить грибы» и «Подвялить», что ещё здесь делают и что нужно; у горна — плавка самоучкой',
  п8.сп.some(a=>a.id==="oa:roast_mush")&&п8.сп.some(a=>a.id==="oa:dry_mush")&&п8.сделано&&/Жаровня: .*грибы/.test(п8.инфо||"")
  &&п8.горн.some(n=>/Плавить руду/.test(n)),п8);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
