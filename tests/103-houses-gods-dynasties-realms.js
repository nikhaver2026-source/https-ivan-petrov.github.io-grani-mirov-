/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 103: ВЕЛИКИЕ ДОМА, МАЛЫЕ БОГИ, ДИНАСТИИ И МАЛЫЕ КОРОЛЕВСТВА

   1. Двадцать четыре Дома: двенадцать света по двенадцати державам и двенадцать
      тёмных по двенадцати тёмным империям; у каждого девиз, герб, гербовый
      сигнал записью, зал, товар и нужда, вещь, стиль, школа, пять ступеней,
      союзник, враг, три дела, противник и слух; всякая клетка мира — чья-то.
   2. Вход в земли Дома: сигнал, слово, впервые — музыка; «где я» и карточка
      жителя называют Дом; положение по ступеням со звуком; враг Дома теряет.
   3. Служба: дело Дома через жителя и сдача поднимают положение; клятва
      в зале со второй ступени; вызов бойцу и победа; лавка Дома с третьей;
      цена товара Дома ниже, нужды — выше; окно Домов и меню.
   4. Малые боги: двадцать по областям и двенадцать по тёмным империям — вместе
      тридцать два и тридцать девять; у каждого сфера, культ, святое место,
      обряд, жрецы, табу, артефакт, чудо, друг и враг, праздник, погода,
      цена, школа, голос записью; бог этих мест у каждой области; молитва
      в храме раз в день с даром; чудо с десятой благосклонности; праздник
      двигает погоду, цену, ману и объявляется музыкой; паломничество.
   5. Династии двенадцати держав и двенадцати тёмных империй: правитель, наследники,
      оппозиция, шпионы, раздор, школы чар, товар, войско, которое меняется
      войной; вести о наследниках; окно политики заполнено.
   6. Малые королевства: четыре по областям и четыре за Гранью, вход, товар
      дешевле; реестр модулей; сохранение держит новые поля.
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
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});

 /* ── 1. Дома: данные и покрытие ── */
 const дома=await page.evaluate(()=>{
  const r={};
  r.всего=HOUSES.length;r.свет=HOUSES.filter(h=>h.тип==="свет").length;r.тьма=HOUSES.filter(h=>h.тип==="тьма").length;
  r.имена=new Set(HOUSES.map(h=>h.n)).size;r.ids=new Set(HOUSES.map(h=>h.id)).size;
  r.поля=HOUSES.filter(h=>!h.девиз||!h.герб||!h.мотив||!h.зал||!h.econ||h.товар.length!==2||h.нужда.length!==2||!h.вещь||!h.стиль||!h.школа||h.ранги.length!==5||!h.союзник||!h.враг||h.дела.length!==3||!h.противник||!h.противник.n||!h.слух).map(h=>h.id);
  r.нетЗаписи=HOUSES.filter(h=>!Bank.has(h.мотив)||!Bank.has(h.зал)).map(h=>h.id+":"+h.мотив+"/"+h.зал);
  r.мотивы=new Set(HOUSES.map(h=>h.мотив)).size;
  r.школы=HOUSES.filter(h=>!SCHOOLS.some(s=>s.id===h.школа)).map(h=>h.id);
  r.связи=HOUSES.filter(h=>!HOUSE_BY_ID[h.союзник]||!HOUSE_BY_ID[h.враг]||h.союзник===h.id||h.враг===h.id).map(h=>h.id);
  r.товар=HOUSES.filter(h=>h.товар.concat(h.нужда).some(x=>!RESICON[x])).map(h=>h.id);
  r.державы=HOUSES.filter(h=>h.тип==="свет"?!EMPIRES[h.держава]:!DARK_EMPIRES.some(e=>e.id===h.держава)).map(h=>h.id);
  r.сиденья=HOUSES.every(h=>h.x>=0&&h.x<WORLD&&h.y>=0&&h.y<WORLD);
  r.держСвет=new Set(HOUSES.filter(h=>h.тип==="свет").map(h=>h.держава)).size;r.держТьма=new Set(HOUSES.filter(h=>h.тип==="тьма").map(h=>h.держава)).size;
  /* каждая клетка света — чья-то, и все двенадцать встречаются */
  const было=G.dark;G.dark=false;const seen=new Set();let пусто=0;
  for(let x=500;x<WORLD;x+=2450)for(let y=500;y<WORLD;y+=2450){const h=houseAt(x,y);if(!h)пусто++;else seen.add(h.id);}
  r.покрытиеСвет=seen.size;r.пустоСвет=пусто;
  r.своя=HOUSES.filter(h=>h.тип==="свет").every(h=>{const a=houseAt(h.x,h.y);return a&&a.id===h.id&&EMPIRES[h.держава]===empireAt(h.x,h.y);});
  G.dark=true;const seenD=new Set();for(let x=0;x<2100;x+=100)for(let y=0;y<2100;y+=100){const h=houseAt(x,y);if(h)seenD.add(h.id);}
  r.покрытиеТьма=seenD.size;
  r.свояТьма=HOUSES.filter(h=>h.тип==="тьма").every(h=>{const a=houseAt(h.x,h.y);return a&&a.id===h.id;});
  G.dark=было;
  r.реестр=["HOUSES","GODS","EMPIRES","REALMS"].every(m=>Modules.has(m));
  return r;});
 check('двадцать четыре Дома: двенадцать света и двенадцать тёмных, имена и ключи не повторяются, все поля на месте',
  дома.всего===24&&дома.свет===12&&дома.тьма===12&&дома.имена===24&&дома.ids===24&&!дома.поля.length,{поля:дома.поля});
 check('у каждого Дома гербовый сигнал и зал записями, школа из состава чар, союзник и враг — настоящие Дома, товар — настоящие ресурсы',
  !дома.нетЗаписи.length&&!дома.школы.length&&!дома.связи.length&&!дома.товар.length&&!дома.державы.length&&дома.сиденья,{записи:дома.нетЗаписи,школы:дома.школы,связи:дома.связи,товар:дома.товар});
 check('гербовые сигналы разные не меньше чем у двадцати Домов',дома.мотивы>=20,дома.мотивы);
 check('Дома света покрывают все двенадцать держав, тёмные — все двенадцать империй; каждая клетка света принадлежит какому-то Дому и все двенадцать встречаются',
  дома.держСвет===12&&дома.держТьма===12&&дома.покрытиеСвет===12&&дома.пустоСвет===0&&дома.своя,{покрытие:дома.покрытиеСвет,пусто:дома.пустоСвет});
 check('за Гранью все двенадцать тёмных Домов достижимы и каждый хозяин своего зала',дома.покрытиеТьма===12&&дома.свояТьма,дома.покрытиеТьма);
 check('реестр модулей знает Дома, богов, державы и малые королевства',дома.реестр);

 /* ── 2. Вход в земли, где я, житель, положение ── */
 const вход=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};const было={x:G.x,y:G.y,dark:G.dark};
  G.dark=false;G.place=null;G.ship=null;G.seenHouses={};Houses._last=null;
  const h=HOUSE_BY_ID.brod;G.x=h.x+3;G.y=h.y+1;if(G.x%29===0)G.x++;
  SAID.length=0;PLAYED.length=0;EventPick.last=null;
  const ок=Houses.arrive(cellContent(G.x,G.y));await пауза(1000);
  r.вход={ок,сказано:SAID.find(t=>/Земли Дома/.test(t))||"",впервые:!!SAID.find(t=>/впервые/.test(t)),сигнал:PLAYED.includes(h.мотив),музыка:EventPick.last&&EventPick.last.id,ярус:EventPick.last&&EventPick.last.tier};
  r.второй=Houses.arrive(cellContent(G.x,G.y));
  r.память=!!G.seenHouses[h.id];
  /* где я */
  SAID.length=0;handleThreeFingerSwipe("E");await пауза(60);
  r.гдея=SAID.find(t=>/Вы здесь/.test(t))||"";
  /* житель */
  const n=getNPC(G.x,G.y,0);openNPC(n.key,true);await пауза(50);
  const body=document.getElementById("npcBody").textContent;
  r.житель={дом:body.includes("Земли Дома «"+h.n+"»"),бог:/Чтит также/.test(body)};
  while(activeLayer())closeTopUI();
  /* положение и ступени */
  G.standing=G.standing||{};delete G.standing["house:"+h.id];delete G.standing["house:"+h.враг];
  r.ступень0=Houses.rankName(h.id);
  SAID.length=0;PLAYED.length=0;
  Houses.add(h.id,12);await пауза(50);
  r.ступень1={имя:Houses.rankName(h.id),ранг:Houses.rank(h.id),сказано:SAID.find(t=>/вы теперь/.test(t))||"",сигнал:PLAYED.includes(h.мотив),враг:standOf("house",h.враг)};
  Houses.add(h.id,80);
  r.ступень5={имя:Houses.rankName(h.id),ранг:Houses.rank(h.id),положение:standOf("house",h.id)};
  r.имяПятой=h.ранги[4];
  G.x=было.x;G.y=было.y;G.dark=было.dark;
  return r;});
 check('вход в земли Дома: слово, гербовый сигнал записью, впервые — музыка открытия своего яруса, память; второй раз молчит',
  вход.вход.ок&&/Земли Дома/.test(вход.вход.сказано)&&вход.вход.впервые&&вход.вход.сигнал&&вход.вход.музыка==="region_new"&&вход.вход.ярус==="light"&&вход.второй===false&&вход.память,вход.вход);
 check('«где я» называет земли Дома',/земли Дома/.test(вход.гдея),вход.гдея.slice(0,160));
 check('карточка жителя называет Дом земель и малого бога, которого здесь чтут',вход.житель.дом&&вход.житель.бог,вход.житель);
 check('положение у Дома по ступеням: чужак, затем первая ступень со словом и сигналом, враг Дома теряет половину; пятая ступень на девяноста',
  вход.ступень0==="чужак"&&вход.ступень1.ранг===1&&/вы теперь/.test(вход.ступень1.сказано)&&вход.ступень1.сигнал&&вход.ступень1.враг<0&&вход.ступень5.ранг===5&&вход.ступень5.имя===вход.имяПятой&&вход.ступень5.положение>=90,вход.ступень1);

 /* ── 3. Служба, клятва, вызов, лавка, рынок, окно ── */
 const служба=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};const было={x:G.x,y:G.y,dark:G.dark,gold:G.gold};
  G.dark=false;G.place=null;G.ship=null;
  const h=HOUSE_BY_ID.chasha;G.x=h.x;G.y=h.y;
  G.standing=G.standing||{};delete G.standing["house:"+h.id];G.house=null;
  /* дело Дома */
  const npc=getNPC(h.x+1,h.y,0);
  const q=Houses.questFor(npc);
  r.дело=q?{дом:q.дом,type:q.type,есть:!!q.text&&!!q.reward&&q.text.includes(h.n)}:null;
  if(q){G.quests=G.quests.filter(x=>x.id!==q.id);G.quests.push(q);
   if(q.type==="visit")q.doneFlag=true;else if(q.type==="kill")q.have=q.need;else if(q.type==="fetch")G.inv[q.res]=(G.inv[q.res]||0)+q.need;
   const до=standOf("house",h.id);SAID.length=0;completeQuest(q.id);await пауза(300);
   r.сдача={рост:standOf("house",h.id)-до,сказано:SAID.find(t=>/запомнит службу/.test(t))||""};}
  /* дело через общий раздатчик: жребий Дома существует в questFor */
  r.вРаздатчике=String(questFor).includes("Houses.questFor");
  /* клятва: рано, потом со второй ступени */
  SAID.length=0;r.клятваРано=Houses.join(h.id);r.клятваРаноСлово=SAID.find(t=>/ступени/.test(t))||"";
  Houses.add(h.id,30,true);
  SAID.length=0;PLAYED.length=0;EventPick.last=null;r.клятва=Houses.join(h.id);await пауза(900);
  r.клятваИтог={дом:G.house,сигнал:PLAYED.includes(h.мотив),зал:PLAYED.includes(h.зал),музыка:EventPick.last&&EventPick.last.id,сказано:SAID.find(t=>/Клятва принята/.test(t))||""};
  /* скидка на ману своей школы */
  r.мана=Houses.manaDiscount({n:"x",school:h.школа,школа:h.школа,custom:true});
  /* вызов бойцу и победа */
  r.вызов=Houses.challenge(h.id);await пауза(200);
  r.бой=G.inCombat&&G.combat&&G.combat.m&&G.combat.m.дом&&G.combat.m.дом.id===h.id&&G.combat.m.дом.как==="вызов";
  const доБоя=standOf("house",h.id);
  if(r.бой){G.combat.hp=0;victory();await пауза(700);const ov=document.getElementById("lootOverlay");if(ov)ov.hidden=true;G.loot=null;while(activeLayer())closeTopUI();}
  r.победа={рост:standOf("house",h.id)-доБоя,журнал:G.journal.some(t=>/Вызов в зале Дома/.test(t))};
  /* лавка Дома */
  G.gold=1000;G.gear=G.gear.filter(g=>!g||g.id!=="house_"+h.id);
  Houses.add(h.id,60,true);r.ранг=Houses.rank(h.id);
  r.лавка=Houses.buy(h.id);const вещь=G.gear.find(g=>g&&g.id==="house_"+h.id);
  r.вещь=вещь?{имя:вещь.name,стиль:вещь.стиль,ранг:вещь.rank}:null;r.золото=G.gold;
  r.повтор=Houses.buy(h.id);
  /* рынок: товар Дома дешевле, нужда дороже */
  r.цена={товар:Houses.priceK(h.товар[0]),нужда:Houses.priceK(h.нужда[0]),чужое:Houses.priceK("кость")};
  const idx=empireIndexAt(G.x,G.y);
  r.рынок={здесь:marketPrice(h.товар[0],idx,G.day)};
  /* окно Домов */
  CMD.houses();await пауза(60);
  r.окно={здесь:document.getElementById("hHere").textContent.includes(h.n),кнопки:document.getElementById("hHere").querySelectorAll("button").length,
   свет:document.getElementById("hLight").querySelectorAll(".list-line").length,тьма:document.getElementById("hDark").querySelectorAll(".list-line").length,
   мой:document.getElementById("hMine").textContent.includes(h.n)};
  while(activeLayer())closeTopUI();
  r.меню=AM_GROUPS.some(g=>g[1].some(x=>x[0]==="houses"))&&AM_GROUPS.some(g=>g[1].some(x=>x[0]==="house"))&&typeof CMD.house==="function";
  /* уход */
  r.уход=Houses.leave();r.безДома=G.house===null;
  G.gold=было.gold;G.x=было.x;G.y=было.y;G.dark=было.dark;
  return r;});
 check('дело Дома собирается по его списку с пометкой Дома и его именем в тексте; сдача поднимает положение и говорит о службе',
  служба.дело&&служба.дело.дом==="chasha"&&служба.дело.есть&&служба.сдача&&служба.сдача.рост>=5&&/запомнит службу/.test(служба.сдача.сказано)&&служба.вРаздатчике,{дело:служба.дело,сдача:служба.сдача});
 check('клятва Дому: рано — отказ со ступенью, со второй — принята: сигнал, зал, музыка титула, слово',
  служба.клятваРано===false&&/ступени/.test(служба.клятваРаноСлово)&&служба.клятва===true&&служба.клятваИтог.дом==="chasha"&&служба.клятваИтог.сигнал&&служба.клятваИтог.зал&&служба.клятваИтог.музыка==="reward_title"&&/Клятва принята/.test(служба.клятваИтог.сказано),служба.клятваИтог);
 check('вызов бойцу Дома в зале — бой с бойцом Дома; победа поднимает положение и ложится в журнал',служба.вызов===true&&служба.бой&&служба.победа.рост>=6&&служба.победа.журнал,служба.победа);
 check('лавка Дома с третьей ступени продаёт вещь Дома его стиля; второй раз не продаёт',служба.ранг>=3&&служба.лавка===true&&служба.вещь&&служба.вещь.стиль==="стеклянный"&&служба.вещь.ранг>=3&&служба.золото<1000&&служба.повтор===false,служба.вещь);
 check('рынок Дома: свой товар дешевле, нужда дороже, чужое без изменений',служба.цена.товар<1&&служба.цена.нужда>1&&служба.цена.чужое===1&&служба.рынок.здесь>0,служба.цена);
 check('окно Домов: Дом этих земель с кнопками зала, двенадцать и двенадцать строк, ваш Дом назван; меню знает Дома',
  служба.окно.здесь&&служба.окно.кнопки>=4&&служба.окно.свет===12&&служба.окно.тьма===12&&служба.окно.мой&&служба.меню,служба.окно);
 check('уход из Дома снимает клятву',служба.уход===true&&служба.безДома);

 /* ── 4. Малые боги ── */
 const боги=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};const было={x:G.x,y:G.y,dark:G.dark,day:G.day,hp:G.hp};
  r.всего=LESSER_GODS.length;r.свет=Gods.light().length;r.тьма=Gods.dark().length;r.счёт=Gods.counts();
  r.поля=LESSER_GODS.filter(g=>!g.ep||!g.сфера||!g.культ||!g.святое||!g.обряд||!g.жрецы||!g.табу||!g.ключ||!g.артефакт||!g.чудо||!g.друг||!g.враг||!g.праздник||!g.погода||!g.цена||!g.школа||!g.дар||!g.звук).map(g=>g.id);
  r.нетЗаписи=LESSER_GODS.filter(g=>!Bank.has(g.звук)).map(g=>g.id+":"+g.звук);
  r.праздники=new Set(LESSER_GODS.map(g=>g.праздник)).size;
  r.погода=LESSER_GODS.filter(g=>!WEATHER_KINDS.some(w=>w.id===g.погода)).map(g=>g.id);
  r.школы=LESSER_GODS.filter(g=>!SCHOOLS.some(s=>s.id===g.школа)).map(g=>g.id);
  r.враги=LESSER_GODS.filter(g=>!(LESSER_GOD_BY_ID[g.враг]||GOD_BY_ID[g.враг]||DARK_GOD_BY_ID[g.враг])).map(g=>g.id);
  r.области=new Set(Gods.light().map(g=>g.область)).size;r.империи=new Set(Gods.dark().map(g=>g.держава)).size;
  /* бог этих мест у каждой области */
  G.dark=false;const местные=new Set();REGIONS.forEach(reg=>{const c=regionCenter(reg);const g=Gods.local(Math.round(c.x),Math.round(c.y));if(g)местные.add(g.id);});
  r.местные=местные.size;
  G.dark=true;const тёмные=new Set();DARK_EMPIRES.forEach(e=>{const g=Gods.local(e.cap.x,e.cap.y);if(g)тёмные.add(g.id);});r.тёмныеМестные=тёмные.size;G.dark=false;
  /* праздник: погода, цена, мана */
  const g=LESSER_GODS.find(x=>x.id==="lg_sneg");
  G.day=g.праздник+Gods.cycle;
  r.праздникСегодня=Gods.festivalToday().some(x=>x.id===g.id);
  const w1={};Gods.weather(w1);r.погодаПраздника=w1[g.погода];
  /* Круг праздников берётся у мира: он не всегда тридцатидневный. */
  const круг=Gods.cycle;
  G.day=g.праздник+круг+1;const w2={};Gods.weather(w2);r.погодаБудня=w2[g.погода]||0;
  r.цена={праздник:Gods.priceK(g.цена.res,g.праздник+круг),будни:Gods.priceK(g.цена.res,g.праздник+круг+1)};
  G.day=g.праздник+круг;r.мана=Gods.manaDiscount({n:"x",школа:g.школа,school:g.школа,custom:true});
  r.перемирие={мир:Gods.truceToday(LESSER_GODS.find(x=>x.мир).праздник),нет:Gods.truceToday(1)};
  /* объявление праздника музыкой */
  G.festivalDay=null;SAID.length=0;PLAYED.length=0;EventPick.last=null;
  r.такт=Gods.tick();await пауза(1100);
  r.объявление={сказано:SAID.find(t=>/Сегодня праздник/.test(t))||"",голос:PLAYED.includes(g.звук),музыка:EventPick.last&&EventPick.last.id,ярус:EventPick.last&&EventPick.last.tier,повтор:Gods.tick()};
  r.новости=worldNews(G.day).some(t=>t.includes(g.n));
  G.day=было.day;
  /* молитва в храме */
  let храм=null;
  for(let d=0;d<120&&!храм;d++)for(let x=-d;x<=d&&!храм;x+=Math.max(1,d*2))for(let y=-d;y<=d&&!храм;y++){const cx=было.x+x,cy=было.y+y;const c=cellContent(cx,cy);if(c.structure&&c.structure.type==="temple")храм={x:cx,y:cy};}
  if(!храм)for(let x=0;x<WORLD&&!храм;x+=37)for(let y=0;y<WORLD&&!храм;y+=53){const c=cellContent(x,y);if(c.structure&&c.structure.type==="temple")храм={x,y};}
  r.храм=!!храм;
  if(храм){G.x=храм.x;G.y=храм.y;G.place=null;G.ship=null;
   const местный=Gods.local(G.x,G.y);r.местный=местный&&местный.n;
   const кнопки=Gods.templeButtons(cellContent(G.x,G.y));r.кнопка=кнопки.includes("praysmall:"+местный.id);
   G.faithSmall={};G.prayedSmall={};G.godGifts={};G.hp=Math.max(1,G.hpMax-40);G.mana=0;G.water=10;
   SAID.length=0;PLAYED.length=0;
   r.молитва=Gods.pray(местный.id);await пауза(50);
   r.молитваИтог={благ:Gods.favor(местный.id),голос:PLAYED.includes(местный.звук),сказано:SAID.find(t=>t.includes(местный.n))||"",титул:Gods.title(местный.id)};
   r.повторМолитвы=Gods.pray(местный.id);
   /* чудо */
   G.items=(G.items||[]).filter(x=>x!==местный.артефакт);SAID.length=0;EventPick.last=null;
   Gods.addFavor(местный.id,9);await пауза(700);
   r.чудо={вещь:G.items.includes(местный.артефакт),сказано:SAID.find(t=>/Чудо/.test(t))||"",музыка:EventPick.last&&EventPick.last.id,запись:!!G.godGifts[местный.id]};
   /* паломничество */
   const npc=getNPC(G.x,G.y,0,"Жрец");const q=Gods.questFor(npc);
   r.паломничество=q?{тип:q.type,бог:q.малыйБог,текст:/Паломничество/.test(q.text)}:null;
   if(q){G.quests=G.quests.filter(x=>x.id!==q.id);G.quests.push(q);q.doneFlag=true;const до=Gods.favor(q.малыйБог);SAID.length=0;completeQuest(q.id);await пауза(300);
    r.сдача={рост:Gods.favor(q.малыйБог)-до,сказано:SAID.find(t=>/услышал/.test(t))||""};}
   /* пантеон: раздел малых богов */
   CMD.pantheon();await пауза(80);
   const el=document.getElementById("godSmall");
   r.пантеон={строк:el.querySelectorAll(".list-line").length-1,шапка:el.textContent.includes("32")&&el.textContent.includes("39"),молиться:el.querySelectorAll("button").length>0};
   while(activeLayer())closeTopUI();}
  /* вне храма молиться нельзя */
  G.x=было.x;G.y=было.y;G.place=null;
  {let открытая=null;for(let d=1;d<60&&!открытая;d++){const c=cellContent(было.x+d,было.y);if(!c.structure&&!c.monster)открытая={x:было.x+d,y:было.y};}
   if(открытая){G.x=открытая.x;G.y=открытая.y;G.prayedSmall={};r.внеХрама=Gods.pray(LESSER_GODS[0].id);}}
  G.x=было.x;G.y=было.y;G.dark=было.dark;G.hp=было.hp;
  return r;});
 check('тридцать два малых бога: двадцать по областям света, двенадцать по тёмным империям; с пантеоном и тёмными богами — тридцать два и тридцать девять',
  боги.всего===32&&боги.свет===20&&боги.тьма===12&&боги.счёт.свет===32&&боги.счёт.тьма===39&&боги.области===20&&боги.империи===12,боги.счёт);
 check('у каждого малого бога все поля, голос записью, свой день праздника, настоящая погода, школа и враг',
  !боги.поля.length&&!боги.нетЗаписи.length&&боги.праздники===32&&!боги.погода.length&&!боги.школы.length&&!боги.враги.length,{поля:боги.поля,записи:боги.нетЗаписи,погода:боги.погода,враги:боги.враги});
 check('у каждой области и каждой тёмной империи свой бог этих мест',боги.местные===20&&боги.тёмныеМестные===12,{свет:боги.местные,тьма:боги.тёмныеМестные});
 check('праздник бога: погода тянется к его, цена его товара меняется, чары его школы дешевле на ману, боги мира останавливают осады',
  боги.праздникСегодня&&боги.погодаПраздника>=40&&боги.погодаБудня===0&&боги.цена.праздник<1&&боги.цена.будни===1&&боги.мана===1&&боги.перемирие.мир===true&&боги.перемирие.нет===false,{погода:[боги.погодаПраздника,боги.погодаБудня],цена:боги.цена,мана:боги.мана});
 check('такт дня объявляет праздник словом, голосом бога и музыкой праздника один раз; новости знают праздник',
  боги.такт===true&&/Сегодня праздник/.test(боги.объявление.сказано)&&боги.объявление.голос&&боги.объявление.музыка==="festival"&&боги.объявление.ярус==="light"&&боги.объявление.повтор===false&&боги.новости,боги.объявление);
 check('храм предлагает молитву малому богу этих мест; молитва даёт благосклонность, голос и слово; второй раз в день — отказ; вне храма — отказ',
  боги.храм&&боги.кнопка&&боги.молитва===true&&боги.молитваИтог.благ===1&&боги.молитваИтог.голос&&боги.молитваИтог.сказано&&боги.молитваИтог.титул==="слушатель"&&боги.повторМолитвы===false&&боги.внеХрама===false,{кнопка:боги.кнопка,итог:боги.молитваИтог,повтор:боги.повторМолитвы,вне:боги.внеХрама});
 check('чудо с десятой благосклонности: артефакт бога в суме, слово, музыка награды, один раз',
  боги.чудо&&боги.чудо.вещь&&/Чудо/.test(боги.чудо.сказано)&&боги.чудо.музыка==="reward"&&боги.чудо.запись,боги.чудо);
 check('паломничество к святому месту бога этих мест; сдача поднимает благосклонность на три и бог «услышал»',
  боги.паломничество&&боги.паломничество.тип==="visit"&&боги.паломничество.текст&&боги.сдача&&боги.сдача.рост===3&&/услышал/.test(боги.сдача.сказано),{п:боги.паломничество,с:боги.сдача});
 /* Окно показывало одних малых: великие и тёмные в нём не значились, хотя
    досье теперь есть у всех. Строк должно быть семьдесят одна — весь
    пантеон, — а счёт в шапке прежний: тридцать два и тридцать девять. */
 check('пантеон показывает всех богов: семьдесят одна строка, счёт тридцать два и тридцать девять, кнопки молитвы в храме',
  боги.пантеон&&боги.пантеон.строк===71&&боги.пантеон.шапка&&боги.пантеон.молиться,боги.пантеон);

 /* ── 5. Династии, войско, малые королевства ── */
 const держ=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};const было={x:G.x,y:G.y,dark:G.dark,day:G.day};
  r.свет=EMPIRE_EXTRA.length;r.тьма=Object.keys(DARK_EMPIRE_EXTRA).length;
  const полн=ex=>ex&&ex.династия&&ex.правит&&ex.лет&&ex.наследники.length===3&&ex.оппозиция&&ex.оппозиция.n&&ex.оппозиция.хочет&&ex.шпионы&&ex.шпионы.n&&ex.шпионы.где&&ex.конфликт&&ex.школы.length>=3&&ex.школы.length<=5&&ex.школы.every(s=>SCHOOLS.some(x=>x.id===s))&&ex.войско&&ex.войско.полки&&ex.войско.мораль&&ex.войско.снабжение&&ex.ресурс&&Bank.has(ex.звук);
  r.полныеСвет=EMPIRE_EXTRA.every(полн);r.полныеТьма=DARK_EMPIRES.every(e=>полн(DARK_EMPIRE_EXTRA[e.id]));
  r.династии=new Set(EMPIRE_EXTRA.map(x=>x.династия).concat(Object.values(DARK_EMPIRE_EXTRA).map(x=>x.династия))).size;
  /* войско меняется войной: ищем день войны и день мира для одной державы */
  let война=null,мир=null;
  for(let d=1;d<400&&!(война&&мир);d++){const w=warsAt(d).some(x=>x.a===0||x.b===0);if(w&&!война)война=d;if(!w&&!мир)мир=d;}
  r.дни={война,мир};
  if(война&&мир){const a=Empires.army(0,война),b=Empires.army(0,мир);r.войско={война:a,мир:b,больше:a.полки>b.полки,дух:a.мораль<b.мораль};}
  r.текст=Empires.text(0);r.текстТьмы=Empires.darkText("kost");
  r.досье=factionText(0).includes("Династия");
  /* вести о наследниках */
  G.dynNews=[];G.dynDay=null;G.day=9;r.такт=Empires.tick();r.весть=(G.dynNews[0]||"");
  r.вНовостях=worldNews(G.day).some(t=>/заявляет права|пойманы/.test(t));
  G.day=было.day;
  /* окно политики */
  CMD.politics();await пауза(80);
  r.окно={династии:document.getElementById("polDynasties").querySelectorAll(".list-line").length,тьма:document.getElementById("polDarkEmp").querySelectorAll(".list-line").length,
   королевства:document.getElementById("polRealms").querySelectorAll(".list-line").length,дома:document.getElementById("polHouses").querySelectorAll(".list-line").length};
  while(activeLayer())closeTopUI();
  /* малые королевства */
  r.королевств=MINOR_REALMS.length;r.свК=MINOR_REALMS.filter(x=>x.тип==="свет").length;r.тьК=MINOR_REALMS.filter(x=>x.тип==="тьма").length;
  r.поляК=MINOR_REALMS.filter(x=>!x.n||!x.short||!x.gov||!x.econ||!x.ресурс||!x.войско||!Bank.has(x.звук)||!x.о||x.x==null||x.сюзерен==null).map(x=>x.id);
  G.dark=false;G.place=null;G.ship=null;
  const k=MINOR_REALMS.find(x=>x.тип==="свет");
  r.область=regionIndexAt(k.x,k.y)===k.область;
  r.наМесте=realmAt(k.x,k.y)&&realmAt(k.x,k.y).id===k.id;
  r.далеко=realmAt(k.x+2400,k.y+2400)===null||realmAt(k.x+2400,k.y+2400).id!==k.id;
  G.x=k.x+2;G.y=k.y;G.seenRealms={};Realms._last=null;SAID.length=0;PLAYED.length=0;EventPick.last=null;
  r.вход=Realms.arrive(cellContent(G.x,G.y));await пауза(900);
  r.входИтог={сказано:SAID.find(t=>/Малое королевство/.test(t))||"",голос:PLAYED.includes(k.звук),музыка:EventPick.last&&EventPick.last.id,впервые:!!G.seenRealms[k.id],повтор:Realms.arrive(cellContent(G.x,G.y))};
  r.ценаК={своё:Realms.priceK(k.ресурс),чужое:Realms.priceK(k.ресурс==="кость"?"трава":"кость")};
  G.dark=true;const kd=MINOR_REALMS.find(x=>x.тип==="тьма");r.тёмное=realmAt(kd.x,kd.y)&&realmAt(kd.x,kd.y).id===kd.id&&realmAt(k.x,k.y)===null;G.dark=false;
  r.тексты=MINOR_REALMS.every(x=>Realms.text(x).includes(x.n));
  /* сохранение */
  G.house="brod";G.faithSmall={lg_rosa:2};G.seenHouses={brod:1};G.seenRealms={mr_otmel:1};
  saveGame(true);const raw=JSON.parse(localStorage.getItem(SAVE_KEY));const g=raw.G||raw;
  r.сохранение=g.house==="brod"&&g.faithSmall&&g.faithSmall.lg_rosa===2&&g.seenHouses&&g.seenHouses.brod===1&&g.seenRealms&&g.seenRealms.mr_otmel===1&&g.standing&&"house:brod" in g.standing;
  G.house=null;
  G.x=было.x;G.y=было.y;G.dark=было.dark;
  return r;});
 check('двенадцать династий держав и двенадцать тёмных: правитель, три наследника, оппозиция, шпионы, раздор, три–пять школ чар, войско, товар, зал записью; имена династий не повторяются',
  держ.свет===12&&держ.тьма===12&&держ.полныеСвет&&держ.полныеТьма&&держ.династии===24,{св:держ.полныеСвет,т:держ.полныеТьма,д:держ.династии});
 check('войско считается из обстоятельств: в день войны полков больше, а духа меньше, чем в день мира',держ.войско&&держ.войско.больше&&держ.войско.дух,держ.дни);
 check('досье державы читает династию, наследников, оппозицию, шпионов и войско; тёмная империя — тоже',
  /Династия/.test(держ.текст)&&/Наследники/.test(держ.текст)&&/Оппозиция/.test(держ.текст)&&/Шпионы/.test(держ.текст)&&/Войско/.test(держ.текст)&&/Наследники/.test(держ.текстТьмы)&&держ.досье,держ.текст.slice(0,120));
 check('каждый девятый день наследник заявляет права: весть в новостях мира',держ.такт===true&&/заявляет права/.test(держ.весть)&&держ.вНовостях,держ.весть);
 check('окно политики: двенадцать династий, двенадцать тёмных империй, восемь малых королевств, двадцать четыре Дома',
  держ.окно.династии===12&&держ.окно.тьма===12&&держ.окно.королевства===8&&держ.окно.дома===24,держ.окно);
 check('восемь малых королевств: четыре по областям света и четыре за Гранью, все поля и голос записью, сюзерен назначен',
  держ.королевств===8&&держ.свК===4&&держ.тьК===4&&!держ.поляК.length&&держ.тексты,держ.поляК);
 check('малое королевство стоит в своей области, узнаётся на месте и не узнаётся далеко; тёмное — только за Гранью',
  держ.область&&держ.наМесте&&держ.далеко&&держ.тёмное);
 check('вход в малое королевство: слово, голос, впервые — музыка места, память; второй раз молчит; свой товар дешевле',
  держ.вход===true&&/Малое королевство/.test(держ.входИтог.сказано)&&держ.входИтог.голос&&держ.входИтог.музыка==="place_new"&&держ.входИтог.впервые&&держ.входИтог.повтор===false&&держ.ценаК.своё<1&&держ.ценаК.чужое===1,держ.входИтог);
 check('сохранение держит Дом, благосклонность малых богов, память о Домах и королевствах, положение у Дома',держ.сохранение);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
