/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 263: 10.0 — ОПЫТЫ СО СМЕСЯМИ, ГОТОВКА БЕЗ ПРЕДЕЛА, НАХОДКА ЗА ЗАВАЛОМ

   Жалобы и просьбы игрока:
   • жарить грибы на жаровне выходило один раз: пункт пропадал, хотя грибы
     ещё были (брали по два), а светогриб и трутник не жарились вовсе;
   • смешивать зелья, травы и прочее — у чана, у жаровни, у очага, а можно и
     во фляге, — и получать разное;
   • в зале за разобранным завалом находку у мёртвого сторожа не поднять:
     «под ногами ничего нет».

   1. «Пожарить грибы» повторяется, пока есть хоть один гриб, и работает со
      светогрибом и трутником.
   2. У зелья в котомке — «Смешать с…»; выбор второго и места; здоровье и
      мана в чане дают зелье равновесия.
   3. Два одинаковых зелья — то же, но крепче; трава и дурманник — противоядие;
      сухое с сухим во фляге не смешать, и сказано почему.
   4. Одна пара в одном месте всегда даёт одно и то же; опыт пишется в книгу,
      книга видна в окне «Зелья», первый опыт — достижение.
   5. У чана — «Опыт: смешать два припаса».
   6. У каждого места опыта и у каждого зелья опыта звуки есть в банке.
   7. Палата за ходом, открытым завалом (без рычага), отдаёт находку.
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
  window.__где=["brazier"];window.invContext=()=>({станки:new Set(),вещи:new Set(__где),алтарь:null,торговец:null,житель:null,ночь:false,бой:false});
  G.mast={};G.selfTaught=null;G.items=[];G.mixBook={};Math.random=()=>0.99;});

 const п1=await p.evaluate(()=>{G.inv={"грибы":3,"светогриб":1};const r=[];
  for(let i=0;i<3;i++){r.push(invActionsAll(invRow("res","грибы")).ok.some(a=>a.id==="oa_roast_mush"));invDo("oa_roast_mush","res","грибы");}
  return {r,грибов:G.inv["грибы"]||0,жареных:G.items.filter(x=>x==="Жареные грибы").length,
   светогриб:invActionsAll(invRow("plant","светогриб")).ok.some(a=>a.id==="oa_roast_mush")};});
 check('1. «Пожарить грибы» повторяется, пока есть хоть один гриб; светогриб тоже жарится',
  п1.r.every(Boolean)&&п1.грибов===0&&п1.жареных===3&&п1.светогриб,п1);

 const п2=await p.evaluate(()=>{__где=["cauldron"];G.potions=[];potionGive("heal");potionGive("mana");G.water=0;
  const row=invAll().find(x=>x.kind==="potion"&&x.it.id==="heal");
  const есть=invActionsAll(row).ok.some(a=>a.id==="mixwith");
  openModal("modal-inventory");renderInventory();invDo("mixwith",row.kind,row.key);
  const кнопок=document.querySelectorAll('#invActBody [data-cmd^="mixsel:"]').length;
  CMD.mixsel(MIX_UI.list.findIndex(x=>x.ид==="p:mana"));
  while(activeLayer())closeTopUI();
  return {есть,кнопок,зелья:G.potions.map(x=>x.id)};});
 check('2. у зелья — «Смешать с…», список вторых припасов; здоровье и мана в чане — зелье равновесия',
  п2.есть&&п2.кнопок>=1&&п2.зелья.length===1&&п2.зелья[0]==="balance",п2);

 const п3=await p.evaluate(()=>{G.potions=[];potionGive("heal");potionGive("heal");G.inv={"трава":1,"чёрный дурманник":1,"ягоды":1};G.water=60;
  const h=invAll().filter(x=>x.kind==="potion");const same=mixOutcome(mixIngr(h[0]),mixIngr(h[1]),"brazier");
  const t=mixIngr(invRow("res","трава")),d=mixIngr(invRow("plant","чёрный дурманник")),я=mixIngr(invRow("res","ягоды"));
  return {same,anti:mixOutcome(t,d,"cauldron"),flask:mixOutcome(t,я,"flask"),места:mixPlacesHere(new Set(["cauldron"]))};});
 check('3. два одинаковых зелья — крепче; трава и дурманник — противоядие; сухое с сухим во фляге — нельзя, с причиной',
  п3.same.id==="heal"&&п3.same.q>1.2&&п3.anti.id==="antidote"&&п3.flask.род==="нельзя"&&/фляге/.test(п3.flask.почему)&&п3.места.join()==="cauldron,flask",п3);

 const п4=await p.evaluate(()=>{G.mixBook={};G.inv={"грибы":2,"кристалл":2};__said.length=0;
  const a=mixIngr(invRow("res","грибы")),b=mixIngr(invRow("res","кристалл"));
  const o1=JSON.stringify(mixOutcome(a,b,"brazier")),o2=JSON.stringify(mixOutcome(a,b,"brazier"));
  const т=mixDo(a,b,"brazier");
  openModal("modal-potions");renderPotions();const окно=document.getElementById("potBody").textContent;closeModal(document.getElementById("modal-potions"));
  return {одинаково:o1===o2,записей:Object.keys(G.mixBook).length,т,книга:mixBookText(),вОкне:/Книга опытов, записей 1/.test(окно),грибов:G.inv["грибы"]};});
 check('4. одна пара в одном месте — один исход; опыт в книге и в окне «Зелья»; первый опыт — достижение «Любопытный»',
  п4.одинаково&&п4.записей===1&&п4.вОкне&&/Любопытный/.test(п4.т)&&п4.грибов===1,п4);

 const п5=await p.evaluate(()=>{G.inv={"грибы":2,"трава":2};const o={плитка:"X",вещь:"cauldron",x:1,y:1,d:0};
  const есть=actionsFor(o).some(a=>a.id==="mixhere");const у=actionsFor({плитка:"X",вещь:"statue",x:1,y:1,d:0}).some(a=>a.id==="mixhere");return {есть,у};});
 check('5. у чана — «Опыт: смешать два припаса», у статуи — нет',п5.есть&&!п5.у,п5);

 const п6=await p.evaluate(()=>{const нет=[];Object.values(MIX_PLACES).forEach(m=>m.звук.forEach(z=>{if(!SOUND_BANK[z])нет.push(z);}));
  ["stk_goo","magic_shimmer","lug_fire_start","oc_corrode","oc_splash","oc_sizzle"].forEach(z=>{if(!SOUND_BANK[z])нет.push(z);});
  const опыт=POTIONS.filter(x=>x.опыт).map(x=>x.id);const безДела=опыт.filter(id=>typeof POTION_BY_ID[id].дать!=="function");
  return {нет,опыт:опыт.length,безДела,вРецептах:MIX_SPECIAL.every(r=>!!POTION_BY_ID[r.id])};});
 check('6. звуки опытов есть в банке; у каждого зелья опыта своё действие; особые сочетания ведут к настоящим зельям',
  !п6.нет.length&&п6.опыт>=9&&!п6.безДела.length&&п6.вРецептах,п6);

 const п7=await p.evaluate(()=>{G.place={kind:"dungeon",bx:1200,by:1300,stype:"dungeon",name:"Проба",depth:3,x:1,y:1};
  const l=curLevel();let w=null;
  for(let y=2;y<l.h-2&&!w;y++)for(let x=2;x<l.w-2;x++){if(tileAt(l,x,y)==="#"&&tileAt(l,x+1,y)==="."&&!propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,undefined)){w={x,y};break;}}
  G.place.x=w.x+1;G.place.y=w.y;const v=secretVault(G.place.bx,G.place.by,w.x,w.y);secretMark(v.ключ,"найден");passageNote(w.x,w.y,null,true);
  enterSecret(w.x,w.y,null,true);const lv=curLevel();G.place.x=lv.находка.x;G.place.y=lv.находка.y;
  const g0=G.gold;const r=takeSecretHere();const out={r,золото:G.gold-g0,взято:secretTaken(v.ключ)};exitSecret();G.place=null;return out;});
 check('7. палата за ходом, открытым завалом, отдаёт находку',п7.r&&п7.золото>0&&п7.взято,п7);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
