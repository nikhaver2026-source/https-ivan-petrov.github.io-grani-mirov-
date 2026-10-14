/* ════════════════════════════════════════════════════════════════════════
   НАБОР 335: ЗЕЛЬЯ ОДИННАДЦАТИ РАНГОВ, ОБОРУДОВАНИЕ АЛХИМИКА, НЕ НАКЛАДЫВАЮТСЯ; СЫРЬЁ ВТОРОЙ ЧАСТИ (17.0)

   Просьба игрока: «расширь список зелий от ранга простое до божественное… зелья двойного назначения только
   изготовить или получить в награду… шкуры от необработанной до выделанной, дублёной… мех, кровь и прочее»;
   мастер-промпт: одиннадцать рангов, пятнадцать именных двойных, не складываются, оборудование; семнадцать
   ступеней шкуры, четырнадцать — меха; минералы, самоцветы, магические минералы, органика.

   1. Одиннадцать рангов (простое…божественное), пятнадцать двойных; имена «Превосходное зелье здоровья»,
      «Небесное зелье тени».
   2. Оборудование: превосходное без перегонного куба — отказ с причиной; с кубом — варится; героическое —
      реторта, мифическое — атанор, божественное — покровительство бога. Куб — у травника; всё оборудование
      можно смастерить.
   3. Не накладываются: слабое зелье того же рода при действующем сильном — отказ, склянка цела; более сильное —
      пьётся. Пятое зелье рангов за час — вполсилы, со словами.
   4. Награды больших дел: прежняя мера (0…6) переводится в ранги: «великое» — шестой ранг из одиннадцати.
   5. Сохранения: зелья прежней меры (семь рангов) пересчитываются на одиннадцать при загрузке, один раз.
   6. Сырьё второй части: 72 рода с ценой; ступени шкуры и меха — в «Материалах», минералы и самоцветы — в
      «Ресурсах»; карточка — что это и на что идёт. Ступеней шкуры — семнадцать, меха — четырнадцать.
   7. Добыча: камень в горах даёт минералы; с туши оленя — рог, копыто, жир; хитин с жука; пастьба — шерсть.
   8. Передел: известь, золка, голь, пикель, дубление после пикеля (больше кожи), замша, стриженый мех,
      склянки из кварцевого песка — у своих станков и работают.
   9. Торг: у кузнеца — известь, графит, глина или соль; у городского торговца — самоцветы.
   10. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const page=await (await browser.newContext()).newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1000);
 const войти=async()=>{await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};
  window.__окно=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.getElementById("eventBody")||{}).textContent||"",пункты:(curEvent&&curEvent.choices||[]).map(c=>String(c.l))}:null;};
  window.__пункт=re=>{const i=curEvent&&curEvent.choices?curEvent.choices.findIndex(c=>re.test(String(c.l))):-1;if(i>=0){resolveEvent(i);return true;}return false;};
  /* бои — без окна боя: записываем, кто вышел, победу даём сами */
  window.__бои=[];window.startCombat=(c)=>{__бои.push(c&&c.monster);return true;};
  window.__победа=async()=>{const m=__бои.shift();if(m){questMonsterProgress(m);}await new Promise(z=>setTimeout(z,50));return !!m;};
  window.__ц=()=>Цепи170.активные().find(c=>c.tid==="rabotka");
  window.__на=(x,y)=>{__закрыть();G.place=null;G.inCombat=false;G.x=x;G.y=y;Цепи170.проверить();};
  /* проход шага: что бы ни требовал шаг — сделать это, как сделал бы игрок */
  window.__w=ms=>new Promise(z=>setTimeout(z,ms));
  window.__дай=что=>{for(const k in что)G.inv[k]=Math.max(Number(G.inv[k])||0,что[k]);};
  window.__засада=async(c,p)=>{__на(p.tx,p.ty);let i=0;while(!p.done&&i<40){i++;if(!__бои.length){Цепи170.проверить();await __w(1800);}if(__бои.length){await __победа();await __w(80);}}__бои.length=0;__закрыть();};
  window.__сделать=async(c,p,выбор)=>{const idx=Цепи170.номер(c,p);if(!Array.isArray(G.items))G.items=[];
   switch(p.вид){
    case "идти":case "найти":__на(p.tx,p.ty);await __w(60);break;
    case "говорить":if(p.дикая){__на(p.tx,p.ty);await __w(80);if(!__окно())Цепи170.здесь(c.id,idx);await __w(40);}else{if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);}__пункт(/./);await __w(80);__закрыть();break;
    case "принести":__дай(p.что);if(p.дикая){__на(p.tx,p.ty);await __w(80);if(!__окно()||!__пункт(/Отдать/)){__закрыть();Цепи170.здесь(c.id,idx);await __w(40);}__пункт(/Отдать/);await __w(80);__пункт(/Дальше/);await __w(80);}
     else{if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);__пункт(/Дальше/);await __w(80);}__закрыть();break;
    case "починить":(p.инстр||[]).forEach(t=>{if(!G.items.includes(t))G.items.push(t);});__дай(p.мат||{});if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(60);__закрыть();break;
    case "заплатить":G.gold=Math.max(Number(G.gold)||0,p.n+10);if(p.tx!=null)__на(p.tx,p.ty);Цепи170.сделать(c.id,idx);await __w(40);__пункт(/Дальше/);await __w(80);__закрыть();break;
    case "засада":await __засада(c,p);break;
    case "убить":{const o=p.около;if(o){G.place=null;G.x=o.x;G.y=o.y;}for(let i=(p.есть||0);i<p.n&&!p.done;i++){questMonsterProgress({id:"wolf",n:"Волк",lvl:2});await __w(20);}__закрыть();break;}
    case "ждать":p.до=Цепи170.сейчас();Цепи170.проверить();await __w(60);break;
    case "выбор":Цепи170.решить(c.id);await __w(40);if(!__пункт(выбор||/./))__пункт(/./);await __w(150);__закрыть();break;
    case "отношение":addStand("vill",p.ключ||p.куда,100);Цепи170.проверить();await __w(60);break;}};
  window.__пройти=async(c,стоп,выбор)=>{let n=0;while(!c.done&&n<90){n++;const ш=Цепи170.текущий(c);if(!ш)break;if(стоп&&стоп(ш,c))return true;
    if(ш.вид==="дела"){const p=ш.под.find(p=>!p.done&&p.вес!==0)||ш.под.find(p=>!p.done);await __сделать(c,p,выбор);}else await __сделать(c,ш,выбор);await __w(40);}
   return c.done;};});};
 await войти();
 /* ── 1–2. Ранги, двойные, оборудование ── */
 const з=await page.evaluate(async()=>{const o={};const Z=Зелья170;o.рангов=Z.РАНГИ.length;o.двойных=Object.keys(Z.ДВОЙНЫЕ).length;o.имя4=Z.имя("heal",4,false);o.имяТень=Z.имя("shadow",9,true);
  o.всего=POTIONS.filter(p=>p.р170).length;G.mast=G.mast||{};G.mast.alchemy={ур:5,оп:0,дел:0};
  const дай=n=>{for(const k in n)G.inv[k]=Math.max(Number(G.inv[k])||0,n[k]);};
  G.items=(G.items||[]).filter(x=>!["Перегонный куб","Стеклянная реторта","Атанор"].includes(x));if(!G.items.includes("Ступка с пестиком"))G.items.push("Ступка с пестиком");
  дай(Z.нужно("heal",4,false));o.безКуба=Z.сварить("heal",4,false);o.речь1=__said.slice(-1)[0];
  G.items.push("Перегонный куб");o.сКубом=Z.сварить("heal",4,false);o.есть4=(G.potions||[]).some(r=>r.id==="r170_heal_5");
  o.реторта=Z.почему("heal",6,false);G.items.push("Стеклянная реторта");o.атанор=Z.почему("mana",8,false);G.items.push("Атанор");G.patron=null;o.бог=Z.почему("mana",10,false);
  const тр={x:41000,y:41000,prof:"Торговец"};o.травник=Torg.toolsFor(тр,{вид:{id:"snadob"}}).map(id=>TORG_TOOLS[id]&&TORG_TOOLS[id].n);
  o.крафт=CRAFT_RECIPES.filter(r=>r.з170).map(r=>r.n);return o;});
 check('1. одиннадцать рангов и пятнадцать двойных (154+135 зелий); имена «Превосходное зелье здоровья», «Небесное зелье тени»',
  з.рангов===11&&з.двойных===15&&з.всего===289&&з.имя4==="Превосходное зелье здоровья"&&з.имяТень==="Небесное зелье тени",з);
 check('2. превосходное без перегонного куба — отказ с причиной, с кубом — варится; героическое — реторта, мифическое — атанор, божественное — бог; куб у травника; оборудование можно смастерить',
  з.безКуба===false&&/перегонный куб/.test(з.речь1||"")&&з.сКубом&&з.есть4&&/реторт/.test(з.реторта)&&/атанор/.test(з.атанор)&&/покровительств/.test(з.бог)&&з.травник.includes("Перегонный куб")&&з.крафт.length===3,з);

 /* ── 3. Не накладываются ── */
 const н=await page.evaluate(async()=>{const o={};G.з170={действует:{},глотки:[]};G.potions=[];
  potionGive("r170_resist_5",{q:1});potionGive("r170_resist_3",{q:1});potionGive("r170_resist_7",{q:1});
  const i=id=>G.potions.findIndex(r=>r.id===id);
  o.сильное=drinkPotion(i("r170_resist_5"));o.слабое=drinkPotion(i("r170_resist_3"));o.речь=__said.slice(-1)[0];o.осталось=i("r170_resist_3")>=0;
  o.ещёСильнее=drinkPotion(i("r170_resist_7"));
  G.з170.глотки=[];for(let k=0;k<5;k++)potionGive("r170_heal_1",{q:1,стаб:1});G.hpMax=Math.max(200,G.hpMax);let h=[];const r0=Math.random;Math.random=()=>0;
  for(let k=0;k<5;k++){G.hp=1;const b=G.hp;drinkPotion(i("r170_heal_1"));h.push(G.hp-b);}Math.random=r0;
  o.прибавки=h;await __w(1400);o.перебор=__said.some(t=>/Пятое зелье за час/.test(t));return o;});
 check('3. не накладываются: слабое при действующем сильном — отказ, склянка цела; сильнее — пьётся; пятое за час — вполсилы',
  н.сильное&&н.слабое===false&&/не складываются/.test(н.речь||"")&&н.осталось&&н.ещёСильнее&&н.прибавки[4]<н.прибавки[3]&&н.перебор,н);

 /* ── 4–5. Награды и сохранения ── */
 const с=await page.evaluate(async()=>{const o={};G.potions=[];o.награда=Зелья170.наградой(4,false,123);o.наградаД=Зелья170.наградой(3,true,77);
  G.potions=[{id:"r170_heal_7",q:1,стаб:0.9,день:1,срок:30},{id:"r170_mana_5",q:1,стаб:0.9,день:1,срок:30},{id:"r170_d_balance_3",q:1,стаб:0.9,день:1,срок:30},{id:"heal",q:1,стаб:0.9,день:1,срок:30}];
  delete G.з170v;saveGame(true);await __w(200);loadGame();await __w(900);__закрыть();o.после=G.potions.map(r=>r.id);o.флаг=G.з170v;
  saveGame(true);await __w(200);loadGame();await __w(900);__закрыть();o.второй=G.potions.map(r=>r.id);return o;});
 check('4. награда по прежней мере: «великое» — пятый ранг; двойное — ранг из той же меры',/^Великое /.test(с.награда)&&/^Отборн/.test(с.наградаД),с);
 check('5. сохранения: прежние семь рангов пересчитаны на одиннадцать (божественное → 11, великое → 6, крепкое двойное → 3), прочие зелья не тронуты, второй раз не пересчитывает',
  JSON.stringify(с.после)===JSON.stringify(["r170_heal_11","r170_mana_6","r170_d_balance_3","heal"])&&с.флаг===2&&JSON.stringify(с.второй)===JSON.stringify(с.после),с);

 /* ── 6–9. Сырьё второй части ── */
 const р=await page.evaluate(async()=>{const o={};o.всего=RES170B.length;o.цены=RES170B.every(r=>RES_BASE[r.n]>0);
  o.шкура=RES170.concat(RES170B).filter(r=>r.род==="выделка"||r.род==="ступень шкуры").length+["мездрёная шкура","выделанная кожа"].filter(n=>RES_BASE[n]>0).length;
  o.мех=RES170.concat(RES170B).filter(r=>/выделка меха|ступень меха/.test(r.род)).length;
  G.inv["голь"]=1;G.inv["кварц"]=1;const rows=Inventory.rows();const rg=rows.find(x=>x.name==="голь"),rk=rows.find(x=>x.name==="кварц");o.голь=rg?Inventory.section(rg):"";o.кварц=rk?Inventory.section(rk):"";
  o.карточка=Сырьё170.карточка("обсидиан",2);
  let гора=null;for(let i=0;i<900&&!гора;i++){const x=30000+i*53,y=52000+(i%7)*41;const b=biomeAt(x,y);if(b&&Сырьё170.край(b.id)==="горы")гора={x,y};}
  o.гора=!!гора;let мин=0;if(гора){G.place=null;for(let k=0;k<300&&!мин;k++){G.x=гора.x+k;G.y=гора.y;const b=biomeAt(G.x,G.y);if(!b||Сырьё170.край(b.id)!=="горы")continue;const до=Object.assign({},G.inv);
    Сырьё170.сбор(null,"камень",null);const п=Сырьё170.МИНЕРАЛЫ.горы.filter(k2=>(Number(G.inv[k2])||0)>(Number(до[k2])||0));if(п.length)мин=п[0];}}o.минерал=мин;
  const r0=Math.random;Math.random=()=>0.01;const до2={рог:Number(G.inv["рог"])||0,копыто:Number(G.inv["копыто"])||0,жир:Number(G.inv["животный жир"])||0,хитин:Number(G.inv["хитин"])||0};
  Сырьё170.сТуши({id:"deer",n:"Благородный олень",lvl:2});Сырьё170.сТуши({id:"beetle",n:"Панцирный жук",lvl:2});Math.random=r0;
  o.туша={рог:(Number(G.inv["рог"])||0)-до2.рог,копыто:(Number(G.inv["копыто"])||0)-до2.копыто,жир:(Number(G.inv["животный жир"])||0)-до2.жир,хитин:(Number(G.inv["хитин"])||0)-до2.хитин};
  o.семьи=[foeFamily({id:"deer",n:"Благородный олень"}),foeFamily({id:"beetle",n:"Панцирный жук"})];
  o.пастьба=JSON.stringify((Хозяйство170.РАБОТЫ.find(r=>r.id==="pasti")||{}).себе||{});
  G.mast.smith={ур:3,оп:0,дел:0};G.mast.leather={ур:4,оп:0,дел:0};G.mast.alchemy={ур:3,оп:0,дел:0};const at=(ст,n)=>techsAt(ст,true).find(t=>t.n===n);
  const r1=Math.random;Math.random=()=>0.99;const сделать=(ст,n,дать,что)=>{const t=at(ст,n);if(!t)return "нет работы";for(const k in дать)G.inv[k]=дать[k];const b=Number(G.inv[что])||0;techDo(t,ст);return (Number(G.inv[что])||0)-b;};
  o.передел={известь:сделать("smelter","Обжечь известь",{"камень":3,"древесный уголь":1},"известь"),золка:сделать("tanpit","Золить шкуру",{"отмоченная шкура":2,"известь":1},"золёная шкура"),
   голь:сделать("tanpit","Обезволосить шкуру",{"золёная шкура":2},"голь"),пикель:сделать("tanpit","Пикелевать голь",{"голь":2,"квасцы":1,"каменная соль":1},"пикелёванная шкура"),
   дубление:сделать("tanpit","Дубить пикелёванную шкуру",{"пикелёванная шкура":2,"дубовое корьё":2},"дублёная кожа"),замша:сделать("tanpit","Выделать замшу",{"голь":1,"животный жир":1},"замша"),
   стрижка:сделать("tanpit","Остричь мех",{"выделанный мех":1},"стриженый мех"),склянки:сделать("smelter","Отлить склянки",{"песок кварцевый":2,"древесный уголь":1},"пустая склянка")};Math.random=r1;
  let кузн=[],город=[];for(let i=0;i<20;i++){const к=getNPC(41000+i*97,42000+i*13,0,"Кузнец");кузн=кузн.concat(stockFor(к).map(s=>s.n));}
  const cityN=(()=>{for(let i=0;i<6000;i++){const x=35000+i*31,y=45000+(i%17)*29;if(safeFn(()=>isCityAt(x,y),null))return {x,y};}return null;})();
  if(cityN)for(let i=0;i<12;i++){const t=getNPC(cityN.x,cityN.y,i,"Торговец");город=город.concat(stockFor(t).map(s=>s.n));}
  o.кузнецМинералы=["известь","графит","гончарная глина","каменная соль"].filter(n=>кузн.includes(n));o.городСамоцветы=Сырьё170.ГОРОД2.filter(n=>город.includes(n));o.город=!!cityN;
  return o;});
 check('6. сырьё второй части: 72 рода с ценой; шкура — 17 ступеней и драконья кожа, мех — 14; голь — в «Материалах», кварц — в «Ресурсах»; карточка',
  р.всего===72&&р.цены&&р.шкура===18&&р.мех===14&&р.голь==="material"&&р.кварц==="res"&&/Обсидиан: 2 шт/.test(р.карточка||""),р);
 check('7. добыча: камень в горах даёт минерал; с оленя — рог, копыто, жир; хитин с жука; пастьба даёт шерсть',
  р.гора&&!!р.минерал&&р.туша.рог>=1&&р.туша.копыто>=1&&р.туша.жир>=1&&(р.семьи[1]!=="crawler"||р.туша.хитин>=1)&&/шерсть/.test(р.пастьба),р);
 check('8. передел: известь, золка, голь, пикель, дубление после пикеля (три кожи из двух), замша, стриженый мех, склянки — работают',
  р.передел.известь===2&&р.передел.золка===2&&р.передел.голь===2&&р.передел.пикель===2&&р.передел.дубление===3&&р.передел.замша===1&&р.передел.стрижка===1&&р.передел.склянки===3,р.передел);
 check('9. торг: у кузнецов — минералы (известь, графит, глина, соль), у городских торговцев — самоцветы',р.кузнецМинералы.length>=2&&(!р.город||р.городСамоцветы.length>=1),{к:р.кузнецМинералы,г:р.городСамоцветы,город:р.город});
 check('10. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();
