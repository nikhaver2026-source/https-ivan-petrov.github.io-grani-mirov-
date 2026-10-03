/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 250: 9.5 — КУЗНЕЦ РЯДОМ С ГОРНОМ, ЛЕКАРЬ, КОТОРЫЙ ЛЕЧИТ

   Жалобы игрока:
   • житель стоит прямо на объекте, у которого работают (горн): он должен
     стоять или ходить рядом, неподалёку;
   • жители говорят «иди к лекарю», а лекаря нет — нужен лекарь, который
     лечит за золото или за выполненное задание.

   1. Кузнец стоит на свободной клетке в шаге-двух от горна, не на нём, и со
      временем переходит на другое место рядом.
   2. Горн под ногами — работа у горна (его действия), а не разговор; встать
      к кузнецу — разговор с ним; в списке «что вокруг» он отдельно.
   3. В храме рядом со жрецом — целительница, в крепости — лекарь, в деревне —
      целительница; у лекаря пункт «Лечение».
   4. Лечение за золото: здоровье полное, яд снят, золото списано.
   5. Даром — в счёт сданного дела этого места, одно лечение за дело.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};});

 /* ── 1, 2 ── */
 const п1=await p.evaluate(()=>{
  let L=null;outer: for(const st of ["forge","clanhall","castle","village"])for(let bx=3;bx<40;bx++)for(let by=3;by<40;by++){
   G.place={kind:"house",bx,by,stype:st,name:"x",depth:0,x:1,y:1};
   const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(tileAt(l,x,y)==="F"&&keeperSpots(l,x,y).length>=2){L={bx,by,st,x,y};break outer;}}
  if(!L)return {нет:true};
  G.place={kind:"house",bx:L.bx,by:L.by,stype:L.st,name:"Кузня",depth:0,x:L.x,y:L.y};
  const l=curLevel();
  window.__keeperShift=0;const a=keeperSpot(l,L.x,L.y);
  const места=new Set();for(let i=0;i<12;i++){window.__keeperShift=i*KEEPER_STEP_MS;const s=keeperSpot(l,L.x,L.y);места.add(s[0]+","+s[1]);}
  window.__keeperShift=0;
  const наГорне=a[0]===L.x&&a[1]===L.y,далеко=Math.max(Math.abs(a[0]-L.x),Math.abs(a[1]-L.y));
  /* горн под ногами */
  SAID.length=0;useHere();const окно1=activeLayer()&&activeLayer().id;const действия=[...document.querySelectorAll('#objBody [data-cmd^="objact:"]')].map(b=>b.textContent.trim());
  while(activeLayer())closeTopUI();
  /* к кузнецу */
  G.place.x=a[0];G.place.y=a[1];SAID.length=0;useHere();const окно2=activeLayer()&&activeLayer().id;const кто=document.getElementById("npcTitle").textContent;
  while(activeLayer())closeTopUI();
  /* что вокруг */
  G.place.x=L.x;G.place.y=L.y;const вокруг=objectsHere(true).map(o=>o.n);
  return {наГорне,далеко,мест:места.size,окно1,действия:действия.slice(0,6),окно2,кто,вокруг};});
 check('1. кузнец стоит рядом с горном (в шаге-двух), не на нём, и со временем переходит на другое место',
  п1.нет||(!п1.наГорне&&п1.далеко>=1&&п1.далеко<=2&&п1.мест>=2),п1);
 check('2. горн под ногами — его работы; к кузнецу — разговор; в «что вокруг» кузнец отдельно',
  п1.нет||(п1.окно1==="modal-object"&&п1.действия.length>0&&п1.окно2==="modal-npc"&&!!п1.кто&&п1.вокруг.some(n=>/кузнец .*у горна/.test(n))&&п1.вокруг.some(n=>/горн/.test(n))),п1);

 /* ── 3 ── */
 const п3=await p.evaluate(()=>{const r={};
  const найти=вид=>{const C=OLD_WORLD>>1;for(let rr=1;rr<160;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;const c=safeFn(()=>cellContent(C+dx,C+dy),null);if(c&&c.structure&&c.structure.type===вид)return c;}return null;};
  const люди=вид=>{const c=найти(вид);return c?npcsFor(c):[];};
  const храм=люди("temple"),крепость=люди("fortress"),деревня=люди("village");
  r.храм=храм.map(n=>n.prof);r.крепость=крепость.map(n=>n.prof);r.деревня=деревня.map(n=>n.prof);
  const h=храм.find(isHealer)||деревня.find(isHealer);
  window.__h=h;window.getNPCByKey=(k=>(key)=>key===h.key?h:k(key))(window.getNPCByKey);
  openNPC(h.key,true);r.кнопка=!!document.querySelector('#npcBody [data-cmd^="npcheal:"]');while(activeLayer())closeTopUI();
  return r;});
 check('3. в храме — целительница, в крепости — лекарь, в деревне — целительница; у лекаря пункт «Лечение»',
  п3.храм.includes("Жрец")&&п3.храм.some(x=>/Целител/.test(x))&&(!п3.крепость.length||п3.крепость.some(x=>/Лекар/.test(x)))&&п3.деревня.some(x=>/Целител/.test(x))&&п3.кнопка,п3);

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{const h=__h;G.hp=10;G.hpMax=100;G.gold=500;G.buffs=G.buffs||{};G.buffs["яд"]=5;
  const цена=healPrice(h);CMD.npcheal(h.key);const кн=[...document.querySelectorAll('#npcBody button')].map(b=>b.dataset.cmd);
  SAID.length=0;CMD.npchealdo(h.key+"~gold");
  return {цена,кн,hp:G.hp,яд:!!G.buffs["яд"],gold:G.gold,said:SAID.join(" | ").slice(0,300)};});
 check('4. лечение за золото: здоровье полное, яд снят, золото списано',
  п4.hp===100&&!п4.яд&&п4.gold===500-п4.цена&&п4.кн.some(c=>/~gold$/.test(c||""))&&/Здоровье 100 из 100/.test(п4.said),п4);

 /* ── 5 ── */
 const п5=await p.evaluate(()=>{const h=__h;G.hp=20;const g0=G.gold;
  const без=healCredits(h).length;SAID.length=0;CMD.npchealdo(h.key+"~credit");const отказ=G.hp===20;
  G.quests=(G.quests||[]).concat([{id:"t250",npcKey:`${h.x},${h.y},0`,type:"visit",done:true,text:"дело"}]);
  const с=healCredits(h).length;CMD.npchealdo(h.key+"~credit");const hp1=G.hp;
  G.hp=30;CMD.npchealdo(h.key+"~credit");
  return {без,отказ,с,hp1,hp2:G.hp,gold:G.gold===g0};});
 check('5. даром — в счёт сданного дела этого места, одно лечение за дело',
  п5.без===0&&п5.отказ&&п5.с===1&&п5.hp1===100&&п5.hp2===30&&п5.gold,п5);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
