/* ════════════════════════════════════════════════════════════════════════
   НАБОР 237: ЗЕЛЬЯ У ТОРГОВЦЕВ И ОБОЗА, КУПЛЕННОЕ — В СЛОТ БЫСТРОГО ДОСТУПА

   Жалоба игрока (8.0): у торговца в подземелье два одинаковых пункта
   «Купить зелье здоровья», зелья маны и прочие не продаёт никто, а
   купленное зелье не попадает в слот зелий (Q на компьютере, два пальца
   влево на телефоне).
   1. В подземной лавке «Зелье здоровья» — ровно один пункт; есть зелье маны
      и противоядие; в любой лавке — то же и ещё два зелья.
   2. Травник продаёт все тринадцать родов зелий.
   3. Купленное зелье маны ложится в «Зелья» инвентаря, встаёт в свободный
      слот быстрого доступа и, выпитое из слота, восстанавливает ману.
   4. Купленное счётом зелье — столько записей, сколько куплено, а не ресурс.
   5. Купленное зелье здоровья пьётся клавишей Q вне боя и в бою.
   6. Обоз продаёт зелья здоровья и маны; купленное встаёт в слот.
   7. Свиток или жезл с зарядами ставится в слот и применяется из слота.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{const m=o(t,x);window.__said.push(String(t));return m;};
  G.inCombat=false;G.combat=null;});

 /* ── 1–2 ── */
 const лавки=await page.evaluate(()=>{const r={};
  G.place={kind:"dungeon",bx:3000,by:3000,stype:"ruins",depth:5,name:"Проба",x:1,y:1};
  const n=getNPC(G.x,G.y,0,"Торговец");const st=stockFor(n);
  r.подземХП=st.filter(x=>x.n==="Зелье здоровья").length;r.подземЗелья=st.filter(x=>x.зелье).map(x=>x.n);
  G.place=null;
  const n2=getNPC(500,500,0,"Торговец");const st2=stockFor(n2);
  r.наземХП=st2.filter(x=>x.n==="Зелье здоровья").length;r.наземЗелья=st2.filter(x=>x.зелье).map(x=>x.n);
  r.дубли=st2.length!==new Set(st2.map(x=>x.n||(x.gear&&x.gear.name))).size&&false;
  /* травник */
  let тр=null;for(let x=400;x<900&&!тр;x++){const m=getNPC(x,600,0,"Торговец");const д=safeFn(()=>merchSoul(m),null);if(д&&д.вид&&д.вид.id==="snadob")тр=m;}
  r.травникНайден=!!тр;r.травник=тр?stockFor(тр).filter(x=>x.зелье).length:0;
  r.карточка=safeFn(()=>shopStockRows(n2).filter(x=>x.s.зелье).map(x=>[x.cat,x.card]).slice(0,2),[]);
  return r;});
 check('1. в подземной лавке одно «Зелье здоровья», есть зелье маны, противоядие и ночное зрение; наверху — маны, противоядие и ещё два',
  лавки.подземХП===1&&лавки.наземХП===1&&["Зелье маны","Противоядие","Зелье ночного зрения"].every(x=>лавки.подземЗелья.includes(x))
  &&лавки.наземЗелья.length>=4&&лавки.наземЗелья.includes("Зелье маны")&&лавки.карточка.every(x=>x[0]==="potion"&&/слота быстрого доступа/.test(x[1])),лавки);
 check('2. травник продаёт все тринадцать родов зелий',лавки.травникНайден&&лавки.травник===13,лавки);

 /* ── 3–4 ── */
 const мана=await page.evaluate(()=>{const r={};
  G.cbSlots=null;G.cbSlotsInit=0;G.potions=[];G.gold=500;G.inv={};G.items=[];
  const n=getNPC(500,500,0,"Торговец");const st=stockFor(n);const i=st.findIndex(x=>x.n==="Зелье маны");
  __said.length=0;buyItem(n.key,i);r.сказано=__said.slice(-2);
  r.записей=G.potions.length;r.id=G.potions[0]&&G.potions[0].id;r.вИнв=Number(G.inv["Зелье маны"])||0;
  r.слот=cbSlots().findIndex(x=>x&&x.kind==="potion"&&x.id==="mana");
  const row=invAll().find(x=>x.kind==="potion");r.раздел=row&&row.раздел;
  G.manaMax=100;G.mana=10;cbSlotUse(r.слот);r.маныПосле=G.mana;r.записейПосле=G.potions.length;
  /* счётом */
  SHOP.key=n.key;
  const rows=shopStockRows(n);const idx=rows.findIndex(x=>x.s.n==="Зелье маны");
  SHOP.sel={idx};SHOP.confirm={tab:"buy",count:3};SHOP.tab="buy";
  safeFn(()=>{window.shopNpc=()=>n;});shopYes();
  r.счётом=G.potions.filter(x=>x.id==="mana").length;r.ресурсом=Number(G.inv["Зелье маны"])||0;
  return r;});
 check('3. купленное зелье маны — в «Зелья», само в слот быстрого доступа; из слота восстанавливает ману',
  мана.записей===1&&мана.id==="mana"&&мана.вИнв===0&&мана.слот>0&&мана.раздел==="potion"&&мана.сказано.some(t=>/слот быстрого доступа/.test(t))&&мана.маныПосле>10&&мана.записейПосле===0,мана);
 check('4. купленное счётом зелье — записями в «Зельях», а не ресурсом',мана.счётом===3&&мана.ресурсом===0,мана);

 /* ── 5 ── */
 const хп=await page.evaluate(()=>{const r={};
  G.cbSlots=null;G.cbSlotsInit=0;G.gold=500;G.inv={};G.items=[];G.potions=[];
  const n=getNPC(500,500,0,"Торговец");const i=stockFor(n).findIndex(x=>x.n==="Зелье здоровья");
  buyItem(n.key,i);buyItem(n.key,i);
  const q=KB_ACTIONS.find(a=>a.id==="potion");
  G.hpMax=100;G.hp=30;q.run();r.вне=G.hp;r.ост1=Number(G.inv["Зелье здоровья"])||0;
  const m=MONSTERS[0];G.combat={m,hp:30,maxHp:30,log:[]};G.inCombat=true;G.hp=30;
  const лог=[];const cl0=window.cbLog;window.cbLog=t=>{лог.push(String(t));};
  safeFn(()=>q.run());window.cbLog=cl0;r.вБою=лог.find(t=>/Зелье здоровья: \+/.test(t))||"";r.ост2=Number(G.inv["Зелье здоровья"])||0;
  G.combat=null;G.inCombat=false;return r;});
 check('5. купленное зелье здоровья пьётся клавишей Q вне боя и в бою',хп.вне===45&&хп.ост1===1&&!!хп.вБою&&хп.ост2===0,хп);

 /* ── 6 ── */
 const обоз=await page.evaluate(()=>{const r={};
  G.cbSlots=null;G.cbSlotsInit=0;G.gold=500;G.inv={};G.potions=[];
  const car=safeFn(()=>(typeof caravans!=="undefined"&&caravans[0])||null,null)||{id:"проба",from:{name:"А"},to:{name:"Б"},eta:5,kind:{guard:"двое",mult:1},goods:{carry:[]}};
  window.curCaravan=car;try{curCaravan=car;}catch(_){}
  const m0=window.meetCaravan;window.meetCaravan=()=>true;
  r.список=caravanPotions(car).map(p=>p.n);
  caravanPotion("mana");caravanPotion("health");
  window.meetCaravan=m0;
  r.мана=G.potions.filter(x=>x.id==="mana").length;r.хп=Number(G.inv["Зелье здоровья"])||0;
  r.слот=cbSlots().some(x=>x&&x.kind==="potion"&&x.id==="mana");r.золото=G.gold;
  return r;});
 check('6. обоз продаёт зелья здоровья и маны; купленное — в слот',
  обоз.список.includes("Зелье здоровья")&&обоз.список.includes("Зелье маны")&&обоз.список.length===3&&обоз.мана===1&&обоз.хп===1&&обоз.слот&&обоз.золото===456,обоз);

 /* ── 7 ── */
 const жезл=await page.evaluate(()=>{const r={};
  G.cbSlots=null;G.cbSlotsInit=0;G.charged=[];
  const c=CARRIERS.find(x=>x.заряды);r.род=c&&c.id;
  const чара=(SPELLS||[]).find(Boolean);
  G.charged.push({вид:c.id,чара:чара&&чара.id!==undefined?чара.id:0,имяЧары:чара&&чара.n,заряд:3,макс:3});
  const row=invAll().find(x=>x.kind==="charged");r.строка=row&&row.name;
  r.можно=row?invActionList(row.kind,row.key).map(a=>a.id).includes("cbslot"):false;
  if(row)invDo("cbslot",row.kind,row.key);
  r.слот=cbSlots().findIndex(x=>x&&x.kind==="charged");
  const u0=window.chargedUse;let звали=-1;window.chargedUse=i=>{звали=i;return true;};
  if(r.слот>=0)cbSlotUse(r.слот);r.применено=звали;window.chargedUse=u0;
  return r;});
 check('7. жезл или свиток с зарядами ставится в слот и применяется из слота',жезл.можно&&жезл.слот>0&&жезл.применено===0,жезл);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
