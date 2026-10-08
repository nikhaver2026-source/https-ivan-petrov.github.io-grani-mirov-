/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 278: 12.5 — ЯЙЦА ЗВЕРЕЙ ВИДНЫ, НОВЫЙ ПИТОМЕЦ ЗВЕНИТ

   Жалоба игрока: «Подобрал яйцо скорпиона после убийства вампира, а его
   нет нигде — ни в инвентаре, ни в зверинце». Яйцо лежало в гнезде
   зверинца, но о нём говорило только число «Яиц 1» в первой строке.
   Просьба: яркий звук, когда игрок получает питомца.

   1. Яйцо из добычи видно в зверинце отдельной строкой: какой зверь,
      когда вылупится, откуда.
   2. Яйцо видно в котомке, в разделе «Прочее», с описанием; торговец его
      не покупает, действий с ним нет — и ничего не ломается.
   3. Найденное яйцо и новый зверь (покупка, приручение, вылупление)
      звучат яркой темой «питомец обретён» — волшебным перезвоном.
   4. Яйцо вылупляется: строка уходит, зверь встаёт в зверинец.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__темы=[];const было=window.eventTheme;window.eventTheme=(id,o)=>{window.__темы.push(id);return было(id,o);};});

 /* ── 1 ── */
 const з=await p.evaluate(()=>{G.zv={};G.day=10;__темы.length=0;
  const t=Zver.egg("scorpion","добыча");const темыЯйца=__темы.slice();Zver.home();const box=document.getElementById("zvBody")||document.getElementById("modal-zver");
  const html=box?box.innerHTML:"";while(activeLayer())closeTopUI();
  return {t,строка:/Яйцо: скорпион\. Вылупится через \d/.test(html),откуда:/найдено: добыча/.test(html),темы:темыЯйца};});
 await p.evaluate(t=>{window.__яйцоЗвенит=t.includes("reward_pet");},з.темы);
 check('1. яйцо из добычи видно в зверинце: зверь, срок, откуда',з.строка&&з.откуда&&/котомке/.test(з.t),з);

 /* ── 2 ── */
 const к=await p.evaluate(()=>{const rows=invAll().filter(r=>r.kind==="egg");const r=rows[0]||{};
  const brief=invBrief("egg",r.key);const act=invActionsAll(r);
  INV.cat=null;renderInventory();invOpenCat("other");const html=document.getElementById("invSections").innerHTML;
  invPick("egg",r.key);
  while(activeLayer())closeTopUI();
  return {n:rows.length,раздел:r.раздел,brief,ok:act.ok.length,html:/Яйцо: скорпион/.test(html)};});
 check('2. яйцо видно в котомке в разделе «Прочее», с описанием, без действий',
  к.n===1&&к.раздел==="other"&&к.html&&/гнезде зверинца/.test(к.brief)&&к.ok===0,к);
 const торг=await p.evaluate(()=>{const было=window.merchantBuys;window.merchantBuys=()=>({цена:5});
  let rows=[];try{rows=shopSellRows(null)||[];}catch(e){rows=[{ошибка:String(e)}];}window.merchantBuys=было;
  return {всего:rows.length,яйца:rows.filter(r=>r&&(r.kind==="egg"||(r.row&&r.row.kind==="egg"))).length,ошибка:(rows[0]||{}).ошибка};});
 check('2б. торговец не берёт яйцо на продажу',торг.всего>0&&торг.яйца===0&&!торг.ошибка,торг);

 /* ── 3 ── */
 const зв=await p.evaluate(()=>{const r={};
  r.яйцо=window.__яйцоЗвенит;__темы.length=0;
  const b=ZV_BREEDS.find(x=>x.fam==="scorpion")||ZV_BREEDS[0];Zver.make(b.id,{});r.новый=__темы.includes("reward_pet");
  __темы.length=0;Zver.make(b.id,{тихо:true});r.тихо=!__темы.includes("reward_pet");
  r.тема=EVENT_THEME.reward_pet;return r;}).catch(e=>({ошибка:String(e)}));
 check('3. найденное яйцо и новый зверь звучат яркой темой «питомец обретён» (волшебный перезвон)',
  зв.яйцо&&зв.новый&&зв.тихо&&зв.тема&&зв.тема.роль==="arc_chimes",зв);

 /* ── 4 ── */
 const в=await p.evaluate(()=>{const s=Zver.st();const до=s.list.length;__темы.length=0;
  G.day=(Number(G.day)||1)+10;const t=Zver.hatch();
  return {t,яиц:s.eggs.length,зверей:s.list.length-до,звук:__темы.includes("reward_pet"),вКотомке:invAll().filter(r=>r.kind==="egg").length};});
 check('4. яйцо вылупляется: строка уходит, скорпион в зверинце, звенит',
  в.яиц===0&&в.зверей===1&&в.вКотомке===0&&/вылупился/.test(в.t)&&в.звук,в);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
