/* probe_zv.js — проверка тварей, зверей и баффов канона в собранной игре. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker|fetching the script/i.test(m.text()))errs.push('console: '+m.text());});
 await p.goto(process.argv[2]||'http://127.0.0.1:8903/https-ivan-petrov.github.io-grani-mirov-/index.html');await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();window.maybeEvent=()=>{};G.level=20;G.gold=99999;});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const o={};const F=k=>String(k).indexOf("/")>=0?[k]:((SOUND_BANK[k]&&SOUND_BANK[k].f)||[]);
  o.тварей=КАНОН_ТВАРИ.length;o.зверей=КАНОН_ЗВЕРИ.length;
  o.родов=КАНОН_ЗВЕРИ.filter(x=>ZV_FAMILY_BY_ID[x.id]&&ZV_BREED_BY_ID[x.id]&&ZV_SND[x.id]&&ZV_ABIL150[x.id]).length;
  /* звуки: наборы по ролям уникальны среди всех родов (игры и канона), всё есть в банке и выровнено */
  const роды=ZV_FAMILIES.map(f=>f.id).concat(КАНОН_ЗВЕРИ.map(x=>x.id));const повт=[],нет=[],безГр=[];
  for(const r of ["г","р","у","ш","е","бег"]){const м={};for(const id of роды){const P=ZV_SND[id]||КАНОН_ЗВ_СНД[id];if(!P||!Array.isArray(P[r]))continue;const k=[...P[r]].sort().join("+");(м[k]=м[k]||[]).push(id);
    for(const s of P[r]){if(!Bank.has(s))нет.push(id+":"+s);for(const f of F(s))if(!(Number(ZV_LEVEL[f])>0))безГр.push(f);}}
   for(const [k,v] of Object.entries(м))if(v.length>1&&v.some(id=>КАНОН_ЗВЕРЬ[id]))повт.push(r+" "+k+" "+v.join(","));}
  o.повторЗвуков=повт.slice(0,6);o.нетЗвука=[...new Set(нет)].slice(0,6);o.безГромкости=[...new Set(безГр)].slice(0,6);
  const ab={};const абП=[];for(const id of роды)for(const a of (ZV_ABIL150[id]||[])){const k=JSON.stringify(a.зв);(ab[k]=ab[k]||[]).push(id+":"+a.n);
   for(const L of (a.зв||[]))for(const s of L)if(!Bank.has(s))абП.push(a.n+":"+s);}
  o.способностейВсего=Object.values(ZV_ABIL150).flat().length;o.повторСпособностей=Object.values(ab).filter(v=>v.length>1&&v.some(x=>КАНОН_ЗВЕРЬ[x.split(":")[0]])).slice(0,5);o.звукСпособностиНет=абП.slice(0,5);
  return o;});
 /* зверь канона: окно, дары по месту, бой, особые дела */
 r.звери=await p.evaluate(async()=>{const o={};const s=Zver.st();s.list=[];s.pets=[];s.mount=null;
  const волк=КАНОН_ЗВЕРИ.find(x=>x.имя==="Седой волк Подлеска");const a=Zver.make(волк.id,{тихо:true,lvl:8,верн:90});a.сыт=90;
  Zver.beastView(a.uid);const box=document.getElementById("zvBody");o.окно=box?box.textContent.slice(0,600):"нет окна";
  o.дарыСловами=Zver.giftWords(a);
  s.mount=a.uid;const рел=КанонЗвери.рельеф;КанонЗвери.рельеф=()=>"forest";o.шагВЛесу=mountGift("шаг");КанонЗвери.рельеф=()=>"plains";o.шагВСтепи=mountGift("шаг");КанонЗвери.рельеф=рел;
  /* спутник-галка и домовёнок: весть и лечение */
  const галка=Zver.make(КАНОН_ЗВЕРИ.find(x=>x.имя==="Вещая галка").id,{тихо:true,lvl:3,верн:90});галка.сыт=90;
  const дом=Zver.make(КАНОН_ЗВЕРИ.find(x=>x.имя==="Очажный домовёнок").id,{тихо:true,lvl:3,верн:90});дом.сыт=90;
  s.pets=[галка.uid,дом.uid];o.спутники=КанонЗвери.рядом().map(a=>a.n);
  const сказано=[];const e0=Speech.enqueue;Speech.enqueue=function(t){сказано.push(String(t));return e0.apply(this,arguments);};
  G.hp=Math.max(1,G.hpMax-20);const hp0=G.hp;const рнд=Math.random;Math.random=()=>0.01;
  Канон.ст().часЗверей=Math.floor(G.day*24+G.hour)-3;КанонЗвери.час();Math.random=рнд;o.лечение=G.hp-hp0;o.делаДня=сказано.slice(-2);
  o.слухов=(Молва170.ст().слухи||[]).length;
  /* бой: тварь канона, звери рядом */
  const m0=КАНОН_ТВАРИ.find(m=>КанонТвари.есть(m,"засада"))||КАНОН_ТВАРИ[0];const m=Object.assign({},m0,{lvl:5,hp:300,dmg:4,xp:5,gold:10});
  const лог=сказано;const n1=сказано.length;
  try{startCombat({x:G.x,y:G.y,monster:m},{});await new Promise(r=>setTimeout(r,2800));
   for(let i=0;i<4&&G.inCombat;i++){fight("atk");await new Promise(r=>setTimeout(r,900));}
   o.бой=лог.slice(n1,n1+10).map(t=>t.slice(0,140));o.сказаноВБою=сказано.filter(t=>/учуял|засов|стая/i.test(t)).slice(0,3);if(G.inCombat)endCombat();}catch(e){o.бой="ошибка "+e;}
  Speech.enqueue=e0;
  /* встреча в природе и приручение */
  s.tame=null;Канон.ст().встречаЗверя=0;const cc=cellContent;cellContent=(x,y)=>Object.assign({},cc(x,y),{terrain:["forest"]});
  Math.random=()=>0.001;КанонЗвери.шаг(true);Math.random=рнд;cellContent=cc;o.встреча=s.tame&&ZV_BREED_BY_ID[s.tame.breed].n;
  if(s.tame){const f=ZV_FAMILY_BY_ID[ZV_BREED_BY_ID[s.tame.breed].fam];G.inv[ZV_FOOD[f.корм[0]]]=5;Math.random=()=>0.01;o.приручение=Zver.tame();Math.random=рнд;}
  /* зверинец: в каком-нибудь городе среди товара есть зверь канона */
  const ss=Zver.shopSeed;let нашли=null;for(let i=0;i<60&&!нашли;i++){Zver.shopSeed=()=>[1000+i*37,2000+i*11];const L=Zver.shop();const k=L.find(b=>b.кн);if(k)нашли=k.n+" за "+Zver.price(k);}Zver.shopSeed=ss;o.зверинец=нашли;
  return o;});
 /* баффы канона */
 r.баффы=await p.evaluate(async()=>{const o={};G.buffs={};
  buffSet("кн_разум",4);buffSet("страх",3);o.страхПодРазумом=buffActive("страх");delete G.buffs["кн_разум"];
  o.бегствоБезСледа=Morpho.fleeK({id:"wolf"});buffSet("кн_след",4);o.бегствоСоСледом=Morpho.fleeK({id:"wolf"});delete G.buffs["кн_след"];
  const c=cellContent(G.x,G.y);let n0=0,n1=0;for(let i=0;i<200;i++){if(beastAt(G.x+i,G.y,cellContent(G.x+i,G.y),1))n0++;}
  buffSet("кн_убежище",4);for(let i=0;i<200;i++){if(beastAt(G.x+i,G.y,cellContent(G.x+i,G.y),1))n1++;}delete G.buffs["кн_убежище"];o.встречБез=n0;o.встречВУбежище=n1;
  const m={id:"wolf",n:"Волк",lvl:3,hp:200,dmg:3,xp:1,gold:1};startCombat({x:G.x,y:G.y,monster:m},{});await new Promise(r=>setTimeout(r,500));
  buffSet("кн_отражение",4);const hp0=G.combat.hp;buffSet("проклятие",3);o.проклятиеОтражено=!buffActive("проклятие")&&G.combat.hp<hp0;if(G.inCombat)endCombat();
  buffSet("кн_засов",4);startCombat({x:G.x,y:G.y,monster:Object.assign({},m)},{});o.засовПуты=G.combat&&G.combat.путы;if(G.inCombat)endCombat();
  o.прогноз=Канон.прогноз();o.прорыв=Канон.закрытьПрорыв();
  return o;});
 /* вещи канона */
 r.вещи=await p.evaluate(async()=>{const o={};o.всего=КАНОН_ВЕЩИ.length;G.artifacts=[];G.level=100;
  const a=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.имя==="Кольцо пяти зарядов").id,"проба");o.описание=ART.describe(a,true);o.работает=ART.works(a);
  const b=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.имя==="Почерневший орден света").id,"проба");
  const m={id:"skeleton",n:"Скелет",lvl:3,hp:300,dmg:6,xp:1,gold:1};startCombat({x:G.x,y:G.y,monster:m},{});await new Promise(r=>setTimeout(r,400));
  const hp0=G.hp;const d=Undead.onStrike(m,10);o.ударПоглощён=d===0;o.зарядов=КанонВещи.ст().заряды;o.ударПоНежити=Undead.onHit(m,30);if(G.inCombat)endCombat();
  const c=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.ранг>=7).id,"проба");G.level=5;o.высокийРангНеСлушается=!ART.works(c);G.level=20;
  o.спелК=(()=>{const k=КанонВещи.дать(КАНОН_ВЕЩИ.find(x=>x.имя==="Камертон усилителя").id,"проба");G.level=100;const sp={n:"проба",school:"strings"};const v=Power.spellK(sp);const w=Power.spellK({n:"проба",school:"fire"});G.level=20;return [v,w];})();
  return o;});

 console.log(JSON.stringify(r,null,1));console.log("ошибок страницы",errs.length,errs.slice(0,6));await b.close();})();
