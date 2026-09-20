/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 107: РАЗГОВОР С ПРОВЕРКАМИ, РАССЛЕДОВАНИЯ, СИНДИКАТЫ, НАДЗОР,
   ЭСХАТИЧЕСКАЯ МАГИЯ, ПОСЛЕДНИЙ ДОМ, РАЗВЯЗКИ ДЕЛ

   1. Данные: шесть дел с тремя версиями и уликами известных родов, восемь
      синдикатов со звуком, городами и областью, девять цепочек с тремя и
      более развязками, три хода разговора; самопроверка мира.
   2. Разговор: «Сослаться на знание» решается реестром, а не жребием;
      «По обычаю его народа» — языком; недосказанность откладывает
      последствие, и оно приходит через дни словами, осями и кругами.
   3. Расследование: дело города, улики по родам с требованиями и причиной
      отказа, свидетель через язык, версия без улик не держится, верное
      обвинение платит, ложное — бьёт по городу и приходит спустя дни.
   4. Синдикаты: территория, дань, договор, информатор, расследование,
      шантаж с должником через три дня, союз, бой с громилой.
   5. Надзор: закрет держит чары в городе, лицензия — нарушение на счёт,
      штраф назавтра, лицензия за восемьдесят, договор, погашение, стража
      на воротах при трёх нарушениях.
   6. Эсхатическая магия: у останков по лицензии — память, причина смерти,
      защитный дух; без лицензии — причина словами.
   7. Последний Дом: родословная, предатели, кнопки наследника; цепочка
      из пяти шагов с пятью развязками; дело ждёт решения и вступает в силу
      при сдаче; окно и меню.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};r.cases=CASE_TEMPLATES.length;r.casesOk=CASE_TEMPLATES.every(t=>t.о&&t.место&&t.версии.length===3&&t.улики.every(k=>CLUE_KINDS[k])&&t.версии.every(v=>v.улики.every(k=>t.улики.includes(k))));
  r.synd=SYNDICATES.length;r.syndOk=SYNDICATES.every(x=>SOUND_BANK[x.звук]&&x.города.length>=2&&x.города.every(id=>NAMED_CITY_BY_ID[id])&&REGIONS[x.область]&&x.правила&&x.лидер&&x.конфликт.length===2);
  r.decisions=Object.keys(DECISIONS).length;r.decOk=Object.values(DECISIONS).every(d=>Object.keys(d).length>=3&&Object.values(d).every(x=>x.n&&x.о&&typeof x.effect==="function"));
  r.chains=["deeper","border_war","shards","lasthouse","beast","price","undercity","maskface","endless"].filter(id=>!CHAIN_DB[id]);
  const n={key:"3,3,0",x:15000,y:18000,name:"Проба",race:"Люди",prof:"Магистр",tier:1};
  r.lastSteps=["deeper","border_war","shards","lasthouse","beast","price","undercity","maskface","endless"].map(id=>{const st=CHAIN_DB[id].steps;const q=makeChainQuest(n,id,st.length-1);return [id,st.length,(q.решения||[]).length,!!q.diplo];});
  r.moves=["znanie","kultura","nedoskazat"].filter(id=>!DLG_MOVE_BY_ID[id]);r.profs=["Инспектор Надзора","Наследник павшего Дома"].filter(p=>!TIERP[p]||!NPCBEACON[p]);
  r.modules=["TALK","CASES","SYNDICATES","OVERSIGHT","ESCHA","LASTHOUSE"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="cases");r.selfcheck=row?row.ok:null;
  return r;});
 check('шесть дел с тремя версиями и уликами известных родов; восемь синдикатов со звуком, городами, областью, правилами, главой и спором; девять цепочек по три и более развязки на последнем шаге с дипломатией',
  данные.cases===6&&данные.casesOk&&данные.synd===8&&данные.syndOk&&данные.decisions===9&&данные.decOk&&данные.chains.length===0&&данные.lastSteps.every(x=>x[1]>=3&&x[2]>=3&&x[3]),данные);
 check('три хода разговора, два новых ремесла в таблицах, шесть модулей; самопроверка мира видит расследования',
  данные.moves.length===0&&данные.profs.length===0&&данные.modules&&данные.selfcheck===true,{moves:данные.moves,profs:данные.profs,self:данные.selfcheck});

 /* ── 2. разговор ── */
 const разговор=await page.evaluate(()=>{
  const r={};G.ledger=null;Ledger.ensure();G.langs={common:{ур:3,оп:0}};G.homeLang="common";G.pending=[];G.place=null;G.dark=false;
  const n=getNPC(15000,18000,0,"Торговец");const emp=EMPIRES[Math.max(0,empireIndexAt(n.x,n.y))];
  r.knows0=Talk.knows(n).знает;r.fixed0=Talk.fixed(n,DLG_MOVE_BY_ID.znanie);
  Ledger.add("политика",`Держава «${emp.short}»: наследник спорит с советом`,"проба");r.knows1=Talk.knows(n).знает;r.fixed1=Talk.fixed(n,DLG_MOVE_BY_ID.znanie);
  r.cult0=Talk.fixed(n,DLG_MOVE_BY_ID.kultura);const l=Langs.ofNPC(n);if(l.id!=="common")G.langs[l.id]={ур:2,оп:0};else Ledger.add("история",`Народ ${n.race}: обычаи`,"проба");r.cult1=Talk.fixed(n,DLG_MOVE_BY_ID.kultura);
  r.dice=Talk.fixed(n,DLG_MOVE_BY_ID.nedoskazat);
  /* ход с проверкой знания через настоящий исполнитель */
  G.day=20;const mem=memOf(n.key);if(mem)mem.ходы={};SAID.length=0;const ок=dlgDo(n,"znanie");r.doOk=ок;r.doСказ=SAID.find(t=>/Сослаться на знание/.test(t))||"";r.скрытая=Ledger.list("политика").some(e=>e.откуда==="скрытая ветвь");
  /* отложенное последствие */
  G.pending=[];const было=axisOf("подозрение");Talk.later(2,"проба последствия",{оси:[["подозрение",3]],золото:-5});r.pendingN=(G.pending||[]).length;r.pendingText=Talk.pendingText();
  G.gold=50;r.daily0=Talk.daily();G.day=22;SAID.length=0;r.daily1=Talk.daily();r.сказано=SAID.find(t=>/Спустя дни: проба последствия/.test(t))||"";r.ось=axisOf("подозрение")-было;r.золото=G.gold;r.pendingAfter=(G.pending||[]).length;
  return r;});
 check('«Сослаться на знание» решается реестром: без записи о державе — нет, с записью — да; обычай — языком его народа; недосказанность — жребием; ход через исполнителя открывает скрытую ветвь в реестр',
  разговор.knows0===false&&разговор.fixed0===false&&разговор.knows1===true&&разговор.fixed1===true&&разговор.cult0===false&&разговор.cult1===true&&разговор.dice===null&&разговор.doOk===true&&/знаете о/.test(разговор.doСказ)&&разговор.скрытая,{knows:[разговор.knows0,разговор.knows1],cult:[разговор.cult0,разговор.cult1],dice:разговор.dice,сказ:разговор.doСказ.slice(0,120),скрытая:разговор.скрытая});
 check('отложенное последствие ждёт своего дня, потом звучит словами «Спустя дни», двигает ось и золото и снимается',
  разговор.pendingN===1&&/день 22/.test(разговор.pendingText)&&разговор.daily0===0&&разговор.daily1===1&&разговор.сказано.length>0&&разговор.ось===3&&разговор.золото===45&&разговор.pendingAfter===0,разговор);

 /* ── 3. расследование ── */
 const дело=await page.evaluate(()=>{
  const r={};G.cases={};G.pending=[];G.place=null;G.x=1000;G.y=1000;r.вне=Cases.here();r.need=Cases.need();
  const c=NAMED_CITIES.find(x=>x.id==="mellian");G.x=c.x;G.y=c.y;const h=Cases.here();r.дело=h?{n:h.t.n,улик:h.t.улики.length,версий:h.t.версии.length}:null;r.text=Cases.text();
  r.outside=Cases.can("температура");
  G.place={kind:"city",bx:c.x,by:c.y,stype:"castle",name:c.n,depth:0,x:1,y:1};
  G.core=null;r.noCore=h.t.улики.includes("мана")?Cases.can("мана"):"—";G.mask=null;G.skills=(G.skills||[]).filter(s=>s!=="tracker");r.noNose=h.t.улики.includes("запах")?Cases.can("запах"):"—";
  PLAYED.length=0;const k0=h.t.улики.find(k=>["температура","звук","вещь"].includes(k));r.find=k0?Cases.find(k0):"";r.звук=PLAYED.length>0;r.again=k0?Cases.find(k0):"";r.реестр=Ledger.list("политика").some(e=>e.откуда==="расследование");
  /* свидетель: без языка — обрывки */
  const св=getNPC(c.x,c.y,0,"Фермер");G.langs={common:{ур:3,оп:0}};G.homeLang="common";const l=Langs.ofNPC(св);if(h.t.улики.includes("показание")){if(l.id!=="common"){G.langs[l.id]={ур:0,оп:0};r.askNo=Cases.ask(св);}G.langs[l.id]={ур:2,оп:0};r.askYes=Cases.ask(св);r.btn=Cases.npcButtons(getNPC(c.x,c.y,1,"Стражник"));}
  /* обвинение без улик */
  const ложная=h.t.версии.find(v=>v.id!==h.верная);const нужны=ложная.улики.filter(k=>!h.st.улики[k]);r.weak=нужны.length?Cases.accuse(ложная.id):"—";
  /* добываем всё, что нужно ложной версии, и обвиняем неверно */
  G.core={форма:"crystal",точки:[],заряд:10,записи:[],день:1};G.items=G.items||[];G.mask="hunter";G.mast=G.mast||{};G.mast.runes={ур:1,оп:0,дел:0};G.licenses={};G.licenses[EMPIRES[Math.max(0,empireIndexAt(c.x,c.y))].short+":necro"]=1;
  ложная.улики.forEach(k=>{if(!h.st.улики[k])Cases.find(k);});const стало=standOf("city",h.c.name);r.wrong=Cases.accuse(ложная.id);r.cityDrop=standOf("city",h.c.name)-стало;r.pending=(G.pending||[]).length;r.closed=Cases.accuse(h.верная);
  /* второе дело в другом городе — верное обвинение */
  const c2=NAMED_CITIES.find(x=>x.id==="arkel");G.x=c2.x;G.y=c2.y;G.place={kind:"city",bx:c2.x,by:c2.y,stype:"castle",name:c2.n,depth:0,x:1,y:1};const h2=Cases.here();G.licenses[EMPIRES[Math.max(0,empireIndexAt(c2.x,c2.y))].short+":necro"]=1;r.found2=[];
  const верная=h2.t.версии.find(v=>v.id===h2.верная);верная.улики.forEach(k=>{if(k==="показание"){const w=getNPC(c2.x,c2.y,2,"Торговец");r.found2.push(Cases.ask(w).slice(0,60));}else r.found2.push(Cases.find(k).slice(0,60));});
  const g=G.gold,ст2=standOf("city",h2.c.name);PLAYED.length=0;r.right=Cases.accuse(h2.верная);r.gold=G.gold-g;r.cityUp=standOf("city",h2.c.name)-ст2;r.solved=Cases.solved();r.колокол=PLAYED.includes("uh_bell");
  G.place=null;G.mask=null;return r;});
 check('дело есть только в городе; у дела улики по родам и три версии; улику вне стен не ищут, без Ядра нет следа маны, без нюха — запаха; найденная улика звучит, ложится в реестр и не дублируется',
  дело.вне===null&&/в городе/.test(дело.need)&&дело.дело&&дело.дело.улик>=4&&дело.дело.версий===3&&/Дело «/.test(дело.text)&&/войти в город/.test(дело.outside)&&(дело.noCore==="—"||/Ядро/.test(дело.noCore))&&(дело.noNose==="—"||/нюх/.test(дело.noNose))&&/Улика найдена/.test(дело.find)&&дело.звук&&/уже найдена/.test(дело.again)&&дело.реестр,{дело:дело.дело,outside:дело.outside,noCore:дело.noCore,noNose:дело.noNose,find:(дело.find||"").slice(0,80),again:дело.again});
 check('свидетель без языка даёт обрывки, с языком — показание; версия без улик не держится; ложное обвинение роняет город и откладывает последствие, дело закрыто; верное обвинение платит золотом, поднимает город и звучит колоколом',
  (дело.askNo===undefined||/обрывки/.test(дело.askNo))&&(дело.askYes===undefined||/Улика найдена/.test(дело.askYes))&&(дело.btn===undefined||/caseask:/.test(дело.btn)||дело.btn==="")&&(дело.weak==="—"||/не держится/.test(дело.weak))&&/не подтвердилось/.test(дело.wrong)&&дело.cityDrop===-4&&дело.pending===1&&/уже закрыто/.test(дело.closed)&&/Верно/.test(дело.right)&&дело.gold>=60&&дело.cityUp===6&&дело.solved===1&&дело.колокол,Object.assign({},дело,{text:undefined,find:undefined}));

 /* ── 4. синдикаты ── */
 const синд=await page.evaluate(()=>{
  const r={};G.synd={};G.pending=[];G.inCombat=false;G.combat=null;G.place=null;G.x=1000;G.y=1000;r.none=Syndicates.here();r.need=Syndicates.need();
  const s=SYNDICATES[1];const c=NAMED_CITY_BY_ID[s.города[0]];G.x=c.x;G.y=c.y;const h=Syndicates.here();r.here=h?h.id:null;r.text=Syndicates.text();
  G.gold=10;r.payNo=Syndicates.act("pay");G.gold=200;r.pay=Syndicates.act("pay");r.отн=Syndicates.state(s.id).отн;
  r.investNo=(()=>{G.cases={};G.ledger=null;Ledger.ensure();return Syndicates.act("investigate");})();r.blackNo=Syndicates.act("blackmail");
  Ledger.add("политика","а","п");Ledger.add("политика","б","п");Ledger.add("политика","в","п");r.invest=Syndicates.act("investigate");r.тайна=Syndicates.state(s.id).тайна;
  const g=G.gold;r.black=Syndicates.act("blackmail");r.blackGold=G.gold-g;r.pending=(G.pending||[]).length;r.pendingБой=!!((G.pending||[])[0]||{}).бой;
  r.ally=Syndicates.act("ally");r.союз=Syndicates.state(s.id).союз;G.day=40;r.info=Syndicates.act("info");r.infoAgain=Syndicates.act("info");
  r.side=Syndicates.act("side");
  Syndicates.act("fight");r.бой=!!(G.inCombat&&G.combat&&G.combat.m&&/Громила/.test(G.combat.m.n));if(r.бой){G.combat.hp=0;victory();}r.после=G.inCombat;
  /* должник приходит через три дня */
  G.pending=[{день:41,текст:"должник",бой:{id:"synd_debt",n:"Должник",snd:"mgrowl",fx:"growl",lvl:2,hp:10,dmg:1,xp:1,gold:0}}];G.day=41;Talk.daily();r.должник=!!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.n==="Должник");if(r.должник){G.combat.hp=0;victory();}
  return r;});
 check('синдикат виден только на своей территории; дань за тридцать, договор, расследование по опыту, шантаж по тайне с должником через три дня, союз, информатор раз в день, сторона во внутреннем споре, бой с громилой',
  синд.none===null&&/на него выходят/.test(синд.need)&&синд.here==="keys"&&/Правила: /.test(синд.text)&&/не хватает/.test(синд.payNo)&&/Дань уплачена/.test(синд.pay)&&синд.отн===3&&/нужен опыт/.test(синд.investNo)&&/нечем/.test(синд.blackNo)&&/переворот/.test(синд.invest)&&синд.тайна&&/Шантаж удался/.test(синд.black)&&синд.blackGold===50&&синд.pending===1&&синд.pendingБой&&/Союз заключён/.test(синд.ally)&&синд.союз&&синд.info.length>5&&/уже говорил/.test(синд.infoAgain)&&/теперь за/.test(синд.side)&&синд.бой&&синд.после===false&&синд.должник,синд);

 /* ── 5. Надзор ── */
 const надзор=await page.evaluate(()=>{
  const r={};G.wanted={};G.licenses={};G.ovContract={};G.pending=[];G.place=null;G.inCombat=false;G.combat=null;
  const c=NAMED_CITIES.find(x=>x.id==="mellian");G.x=c.x;G.y=c.y;const law=Oversight.lawHere();r.law={запрет:law.запрет.length>=1,лицензия:law.лицензия.length>=1,пересечение:law.запрет.filter(x=>law.лицензия.includes(x))};
  const sp={n:"проба",school:law.запрет[0],cost:1};r.forbidCity=Oversight.forbids(sp);G.x=1000;G.y=1000;r.forbidField=Oversight.forbids(sp);G.x=c.x;G.y=c.y;
  const lic={n:"проба2",school:law.лицензия[0],cost:1};SAID.length=0;r.licNo=Oversight.forbids(lic);r.wanted=Oversight.wanted(law.emp);r.сказ=SAID.find(t=>/Надзор «/.test(t))||"";r.pending=(G.pending||[]).length;
  const nonNecro=law.лицензия.find(x=>x!=="necro")||law.лицензия[0];G.gold=50;G.level=3;r.licPoor=Oversight.license(nonNecro);G.gold=200;r.lic=Oversight.license(nonNecro);r.has=Oversight.hasLicense(nonNecro,law.emp);r.goldAfter=G.gold;r.licAgain=Oversight.license(nonNecro);
  r.afterLic=Oversight.forbids({n:"проба3",school:nonNecro,cost:1});r.wanted2=Oversight.wanted(law.emp);
  r.contract=Oversight.contract();r.contractAgain=Oversight.contract();
  G.wanted[law.emp.short]=3;G.ovStop=0;SAID.length=0;r.arrive=Oversight.arrive();r.arriveСказ=SAID.find(t=>/Стража Надзора/.test(t))||"";r.settlePoor=(()=>{G.gold=10;return Oversight.settle();})();G.gold=200;r.settle=Oversight.settle();r.wanted3=Oversight.wanted(law.emp);
  r.text=Oversight.text();r.btns=Oversight.npcButtons(getNPC(c.x,c.y,0,"Инспектор Надзора"));r.btnsNo=Oversight.npcButtons(getNPC(c.x,c.y,0,"Фермер"));
  return r;});
 check('закон державы: запрет и лицензии не пересекаются; запретная школа в городе не творится, в поле — творится; лицензионная без лицензии — нарушение со словами и штрафом назавтра; лицензия за восемьдесят снимает нарушение; договор; стража при трёх нарушениях; погашение; кнопки инспектора',
  надзор.law.запрет&&надзор.law.лицензия&&надзор.law.пересечение.length===0&&/под запретом/.test(надзор.forbidCity||"")&&надзор.forbidField===null&&надзор.licNo===null&&надзор.wanted===1&&/Надзор «/.test(надзор.сказ)&&надзор.pending===1&&/не хватает/.test(надзор.licPoor)&&/Лицензия выдана/.test(надзор.lic)&&надзор.has&&надзор.goldAfter===120&&/уже есть/.test(надзор.licAgain)&&надзор.afterLic===null&&надзор.wanted2===1&&/Договор: /.test(надзор.contract)&&/уже есть/.test(надзор.contractAgain)&&надзор.arrive===true&&надзор.arriveСказ.length>0&&/не хватает/.test(надзор.settlePoor)&&/погашены/.test(надзор.settle)&&надзор.wanted3===0&&/Надзор державы/.test(надзор.text)&&/ovact:license/.test(надзор.btns)&&надзор.btnsNo==="",надзор);

 /* ── 6. эсхатическая магия ── */
 const эсха=await page.evaluate(()=>{
  const r={};G.licenses={};G.wanted={};G.pending=[];G.ledger=null;Ledger.ensure();Energy.ensure();G.mana=G.manaMax=30;G.will=10;G.buffs={};
  const c=NAMED_CITIES.find(x=>x.id==="mellian");G.x=c.x;G.y=c.y;G.place=null;const law=Oversight.lawHere();r.cityNo=Escha.allowedHere();r.why=Escha.why();
  G.x=1000;G.y=1000;r.field=Escha.allowedHere();
  r.noRemains=Escha.memory(null);
  G.place={kind:"dungeon",bx:1000,by:1000,stype:"ossuary",name:"Костница",depth:1,x:1,y:1};r.remains=Escha.remainsHere(null);PLAYED.length=0;r.memory=Escha.memory(null);r.mana=G.mana;r.звук=PLAYED.includes("uh_bell");r.реестр=Ledger.list("история").some(e=>e.откуда==="эсхатическая магия");
  G.mast=G.mast||{};G.mast.alchemy={ур:0,оп:0,дел:0};G.sci={};r.causeNo=Escha.cause(null);G.mast.alchemy={ур:1,оп:0,дел:0};r.cause=Escha.cause(null);
  r.ward=Escha.ward();r.оберег=buffActive("оберег")&&buffActive("дух-хранитель");G.mana=0;r.wardNo=Escha.ward();
  const o={плитка:"X",вещь:"bones",x:1,y:1};r.bonesObj=Escha.remainsHere(o);G.place=null;r.bonesField=Escha.remainsHere({плитка:"X",вещь:"bones"});
  r.acts=typeof IACT!=="undefined"&&!!IACT.lastmemory&&!!IACT.causeofdeath;r.text=Escha.text();
  return r;});
 check('эсхатическая магия: в городе без лицензии некромантии нельзя и сказано почему, в поле можно; память читают только у останков — в костнице, у груды костей; чтение берёт ману, звучит и ложится в реестр; причина смерти требует алхимии; защитный дух даёт оберег, без маны — отказ; действия у костей зарегистрированы',
  эсха.cityNo===false&&/некромант|лицензи|запрет/.test(эсха.why||"")&&эсха.field===true&&/Останков рядом нет/.test(эсха.noRemains)&&эсха.remains===true&&/Остаточная память: последним он видел/.test(эсха.memory)&&эсха.mana===26&&эсха.звук&&эсха.реестр&&/алхими/.test(эсха.causeNo)&&/Причина смерти: /.test(эсха.cause)&&/Защитный дух встал/.test(эсха.ward)&&эсха.оберег&&/не хватает энергии/.test(эсха.wardNo)&&эсха.bonesObj&&эсха.bonesField&&эсха.acts&&/Эсхатическая магия/.test(эсха.text),эсха);

 /* ── 7. Последний Дом и развязки ── */
 const дом=await page.evaluate(async()=>{
  const r={};G.lastHouse=null;G.ledger=null;Ledger.ensure();G.items=[];G.quests=[];G.chainTaken={};G.inv={};G.gold=0;G.place=null;G.chainsDone=0;G.lore=[];G.dungeonKills=0;
  r.text=LastHouse.text();r.gen=LastHouse.genealogy();r.tr=LastHouse.traitors();r.знает=G.lastHouse.знает&&G.lastHouse.предатели===3;r.реестр=Ledger.has("история",/Тихой Заводи/)&&Ledger.has("политика",/Предатели/);
  const n=getNPC(15000,18000,0,"Наследник павшего Дома");r.btns=LastHouse.npcButtons(n);r.chain=chainForNPC(n);
  const nn={key:"7,7,0",x:15000,y:18000,name:"Наследник",race:"Люди",prof:"Наследник павшего Дома",tier:1};
  G.quests.push(makeChainQuest(nn,"lasthouse",0));const steps=[];
  for(let i=0;i<7;i++){const q=G.quests.find(x=>!x.done);if(!q)break;q.doneFlag=true;q.have=q.need||1;G.dungeonKills=(q.need||1)+5;if(q.res)G.inv[q.res]=(q.need||1)+2;if(q.tx!=null){G.x=q.tx;G.y=q.ty;}
   if(q.решения&&!q.решение){SAID.length=0;completeQuest(q.id);r.ждёт=SAID.find(t=>/ждёт решения/.test(t))||"";r.stillOpen=!q.done;
    openModal("modal-quests");renderQuests();r.кнопки=document.querySelectorAll('#questList [data-cmd^="qdecide:"]').length;closeModal(document.getElementById("modal-quests"));
    r.decide=questDecide(q.id,"newhouse");r.решение=q.решение;}
   SAID.length=0;completeQuest(q.id);steps.push([q.chainStep,q.done]);if(q.решение)r.сдача=SAID.find(t=>/Развязка: /.test(t))||"";G.place=null;}
  r.steps=steps;r.печать=(G.items||[]).includes("Печать Заводи");r.реестрРазвязки=Ledger.has("история",/Последний Дом: Основать новый Дом/);
  /* окно и меню */
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.cases();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["csCase","csSynd","csOversight","csEscha","csHouse","csPending"].filter(id=>!(document.getElementById(id)||{}).innerHTML);r.сказано=SAID.find(t=>/^Расследования, синдикаты, Надзор\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();r.меню=JSON.stringify(AM_GROUPS).includes('"cases"');
  return r;});
 check('Последний Дом: род, наследство, враг, реликвии, архив, школа; родословная и предатели ложатся в реестр; у наследника кнопки и цепочка; дело с развязками ждёт решения, журнал показывает пять развязок, выбранная вступает в силу при сдаче — Печать Заводи в суме и запись в реестре; окно с шестью разделами и меню',
  /Дом Тихой Заводи/.test(дом.text)&&/Родословная/.test(дом.gen)&&/Список предателей/.test(дом.tr)&&дом.знает&&дом.реестр&&/lasthouse:/.test(дом.btns)&&дом.chain==="lasthouse"&&/ждёт решения/.test(дом.ждёт||"")&&дом.stillOpen===true&&дом.кнопки===5&&/Решено: Основать новый Дом/.test(дом.decide)&&дом.решение==="newhouse"&&дом.steps.length===5&&дом.steps.every(s=>s[1])&&/Новый Дом основан/.test(дом.сдача||"")&&дом.печать&&дом.реестрРазвязки&&дом.окно==="modal-cases"&&дом.секции.length===0&&дом.сказано.length>0&&дом.меню,{ждёт:(дом.ждёт||"").slice(0,80),кнопки:дом.кнопки,decide:дом.decide,steps:дом.steps,сдача:(дом.сдача||"").slice(0,100),печать:дом.печать,окно:дом.окно,секции:дом.секции});

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
