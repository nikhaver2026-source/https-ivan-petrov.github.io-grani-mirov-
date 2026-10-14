/* ════════════════════════════════════════════════════════════════════════
   НАБОР 332: «НУ И РАБОТКА» — БОЛЬШОЕ ДЕЛО КУЗНЕЦА ОТ НАЧАЛА ДО КОНЦА (17.0)

   Просьба игрока: квест у любого кузнеца — «Ну и работка», принести драготировой руды; глухая деревня за
   500–2000 шагов; кузнеца там нет — отношение деревни до предела; стражник у ворот рассказывает про старика и
   соседнюю деревню за 100–300 шагов; у тамошнего кузнеца куча дел (руда с болота, жердина из леса, крыша,
   разбойники, заказы); дальше — штольня, жила и награда.

   1. Кузнец предлагает «Ну и работку» (и только кузнец: у старейшины её нет); взятое дело — в списке заданий
      одной строкой с шагом; цель — в метках (Ctrl+G).
   2. Деревня A — за 500–2000 шагов от кузнеца, деревня B — за 100–300 от A; обе — настоящие деревни мира.
   3. В деревне A: шаг «дойти» закрывается сам; дозорный до доверия молчит (ворота как обычно).
   4. «Помочь по хозяйству»: работа с инструментом поднимает отношение деревни, без инструмента — отказ с
      причиной; та же работа второй раз — не раньше чем через двенадцать часов.
   5. Отношение 100 — шаг закрыт; у ворот дозорный сам рассказывает про старика и называет деревню B.
   6. В B: кнопка шага в окне деревни — разговор с кузнецом, «куча дел»: семь дел в любом порядке.
   7. Дела: болото даёт болотную руду, лес — жердину; отдать; крыша — молоток, доски, гвозди; разбойничий стан —
      три боя; заказы — крица и уголь. Без нужного — отказ с причиной.
   8. Штольня: старик под завалом (отдать траву и еду), твари штольни, жила драготира — три куска руды.
   9. Выбор: оставить старика — молот старого мастера; вернуться к своему кузнецу — драготировый клинок,
      золото, опыт, зелья; дело закрыто, повторно не предлагается.
   10. Драготировый клинок растёт с хозяином: каждые три победы — урон +1.
   11. Сохранение и загрузка: начатое большое дело помнит шаг и цели.
   12. Ошибок страницы нет.
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
  window.__на=(x,y)=>{__закрыть();G.place=null;G.inCombat=false;G.x=x;G.y=y;Цепи170.проверить();};});};
 await войти();

 /* ── 1–2. Кузнец предлагает; деревни на своих расстояниях ── */
 const н=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  G.x=40000;G.y=41000;G.place=null;G.level=8;G.gold=5000;
  const к=getNPC(G.x,G.y,0,"Кузнец"),с=getNPC(G.x,G.y,0,"Старейшина");
  const o={кузнец:Цепи170.предложения(к).map(t=>t.id),старейшина:Цепи170.предложения(с).map(t=>t.id)};
  npcQuestsView(к.key);o.кнопка=!!document.querySelector('#npcBody [data-cmd="c170:offer~'+к.key+'~rabotka"]');
  Цепи170.предложить(к.key,"rabotka");await w(50);o.окно=__окно();__пункт(/Взяться/);await w(100);__закрыть();
  const c=__ц();o.взято=!!c;if(!c)return o;window.__кузнец=к;
  const A=c.шаги[0],B=c.шаги[3];o.A={x:A.tx,y:A.ty,имя:A.куда};o.B={x:B.tx,y:B.ty,имя:B.куда};
  o.dA=Math.max(Math.abs(A.tx-к.x),Math.abs(A.ty-к.y));o.dB=Math.max(Math.abs(B.tx-A.tx),Math.abs(B.ty-A.ty));
  o.деревниA=cellContent(A.tx,A.ty).structure.type;o.деревниB=cellContent(B.tx,B.ty).structure.type;
  o.задание=(G.quests||[]).filter(q=>q.type==="chain170").map(q=>q.text);
  o.метка=(G.metki165||[]).some(m=>m.x===A.tx&&m.y===A.ty);return o;});
 check('1. кузнец предлагает «Ну и работку» (кнопка в «Заданиях», окно с речью про драготир), у старейшины её нет; взятое дело — в списке заданий и метках',
  н.кузнец.includes("rabotka")&&!н.старейшина.includes("rabotka")&&н.кнопка&&н.окно&&/драготиров/.test(н.окно.текст)&&н.взято&&
  н.задание.length===1&&/Ну и работка», шаг 1 из 12/.test(н.задание[0])&&н.метка,н);
 check('2. деревня A — за 500–2000 шагов от кузнеца, B — за 100–300 от A; обе — деревни мира',
  н.dA>=450&&н.dA<=2200&&н.dB>=90&&н.dB<=330&&н.деревниA==="village"&&н.деревниB==="village",{dA:н.dA,dB:н.dB,A:н.деревниA,B:н.деревниB});

 /* ── 3–5. Деревня A: отношение и дозорный ── */
 const а=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const c=__ц();const A=c.шаги[0];
  __на(A.tx,A.ty);await w(50);const o={шаг:c.шаг,вид:c.шаги[c.шаг].вид};
  const cell=cellContent(A.tx,A.ty);const имя=Хозяйство170.имяДеревни(cell);o.имя=имя;
  /* ворота до доверия: обычная стража */
  Стража147.встреча(cell);await w(50);const ок=__окно();o.ворота=ок?ок.текст.slice(0,120):"";__закрыть();o.шагПосле=c.шаг;
  /* хозяйство: без мотыги — отказ; с мотыгой — отношение растёт; повтор — отказ */
  G.items=(G.items||[]).filter(x=>x!=="Мотыга");const было=Хозяйство170.отношение(имя);
  o.без=Хозяйство170.сделать("ogorod");o.безРечь=__said.slice(-1)[0];
  G.items.push("Мотыга");o.с=Хозяйство170.сделать("ogorod");o.стало=Хозяйство170.отношение(имя);o.было=было;
  o.повтор=Хозяйство170.сделать("ogorod");o.повторРечь=__said.slice(-1)[0];
  /* окно деревни: «Помочь по хозяйству» */
  openBuilding(cell);o.кнопкаХоз=!!document.querySelector('#bldBody [data-cmd="hoz170"]');__закрыть();
  /* остальное отношение — делами общины; затем ворота */
  addStand("vill",имя,100-Хозяйство170.отношение(имя));Цепи170.проверить();await w(50);o.шагОтн=c.шаг;o.видОтн=c.шаги[c.шаг].вид;
  Стража147.встреча(cell);await w(50);const ок2=__окно();o.рассказ=ок2?ок2.текст:"";__пункт(/Понятно/);await w(100);__закрыть();o.шагСтраж=c.шаг;o.видСтраж=c.шаги[c.шаг].вид;
  return o;});
 check('3. в деревне A шаг «дойти» закрылся сам; до доверия у ворот — обычная стража, шаг не сдвинулся',а.шаг===1&&а.вид==="отношение"&&/Стой|Кто|пропуск|Проходи|ворот/i.test(а.ворота)&&а.шагПосле===1,а);
 check('4. «Помочь по хозяйству»: без мотыги — отказ с причиной; с мотыгой — отношение растёт; повтор — «через N ч»; кнопка в окне деревни',
  а.без===false&&/мотыга/i.test(а.безРечь||"")&&а.с===true&&а.стало>а.было&&а.повтор===false&&/через \d+ ч/.test(а.повторРечь||"")&&а.кнопкаХоз,а);
 check('5. отношение 100 — шаг закрыт; у ворот дозорный сам рассказывает про старика и называет соседнюю деревню; дальше — идти в B',
  а.шагОтн===2&&/неделю назад ушёл/.test(а.рассказ)&&new RegExp(н.B.имя).test(а.рассказ)&&а.шагСтраж===3&&а.видСтраж==="идти",{рассказ:а.рассказ.slice(0,300),шаг:а.шагСтраж});

 /* ── 6–7. Деревня B: кузнец и куча дел ── */
 const б=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const c=__ц();const B=c.шаги[3];
  __на(B.tx,B.ty);await w(50);const o={шаг:c.шаг};const cell=cellContent(B.tx,B.ty);
  openBuilding(cell);const btn=document.querySelector('#bldBody button[data-cmd^="c170:do~"]');o.кнопка=btn?btn.textContent:"";
  if(btn)CMD.c170(String(btn.dataset.cmd).slice(5));await w(50);const ок=__окно();o.жалоба=ок?ок.текст:"";__пункт(/Понятно/);await w(100);__закрыть();
  const д=c.шаги[c.шаг];o.дела=д.вид;o.подел=д.под.length;o.виды=д.под.map(p=>p.вид);
  /* без молотка — отказ */
  G.items=(G.items||[]).filter(x=>x!=="Плотницкий молоток");const кр=д.под.findIndex(p=>p.вид==="починить");o.безМолотка=Цепи170.сделать(c.id,кр);o.речьМ=__said.slice(-1)[0];
  /* болото и лес */
  const бол=д.под.find(p=>p.вид==="найти"&&p.вещь==="болотная руда"),лес=д.под.find(p=>p.вещь==="жердина");
  __на(бол.tx,бол.ty);await w(50);o.руда=Number(G.inv["болотная руда"])||0;__на(лес.tx,лес.ty);await w(50);o.жердина=Number(G.inv["жердина"])||0;
  __на(B.tx,B.ty);
  for(const p of д.под.slice()){if(p.done||p.вид!=="принести")continue;for(const k in p.что)G.inv[k]=Math.max(Number(G.inv[k])||0,p.что[k]);
   Цепи170.сделать(c.id,д.под.indexOf(p));await w(30);__пункт(/Дальше/);await w(60);__закрыть();}
  G.items.push("Плотницкий молоток");G.inv["доска"]=10;G.inv["гвозди"]=30;Цепи170.сделать(c.id,кр);await w(50);__закрыть();
  /* разбойничий стан: три боя */
  const ст=д.под.find(p=>p.вид==="засада");__на(ст.tx,ст.ty);await w(2000);o.бой=__бои.length>0;o.враг=__бои[0]?__бои[0].n:"";
  for(let i=0;i<3;i++){await __победа();await w(3400);}__закрыть();
  o.всё=д.под.map(p=>!!p.done);o.шагПосле=c.шаг;o.видПосле=c.шаги[c.шаг].вид;
  return o;});
 check('6. в B в окне деревни — кнопка шага; кузнец жалуется на заказы, руду, крышу, разбойников, жердину и болото; дальше — семь дел',
  /Поговорить/.test(б.кнопка)&&/заказов куча/.test(б.жалоба)&&/жердин/.test(б.жалоба)&&/болот/.test(б.жалоба)&&б.дела==="дела"&&б.подел===7,б);
 check('7. дела: без молотка — отказ; болото — шесть комьев болотной руды, лес — жердина; разбойничий стан — бой; все семь закрыты, дальше — разговор',
  б.безМолотка===false&&/молоток/i.test(б.речьМ||"")&&б.руда>=6&&б.жердина>=1&&б.бой&&б.всё.every(Boolean)&&б.видПосле==="говорить",б);

 /* ── 8–9. Штольня, выбор, награда ── */
 const ш=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const c=__ц();const B=c.шаги[3];const o={};
  __на(B.tx,B.ty);openBuilding(cellContent(B.tx,B.ty));const btn=document.querySelector('#bldBody button[data-cmd^="c170:do~"]');o.кнопкаB=btn?btn.textContent:(document.getElementById("bldBody")||{}).textContent.slice(0,200);o.боёв=!!G.inCombat;if(btn)CMD.c170(String(btn.dataset.cmd).slice(5));await w(50);
  o.рассказ=(__окно()||{}).текст||"";__пункт(/Понятно/);await w(100);__закрыть();
  const шт=c.шаги[c.шаг];o.вид=шт.вид;G.inv["трава"]=5;G.inv["Еда в дорогу"]=2;__на(шт.tx,шт.ty);await w(1700);
  const ок=__окно();o.старик=ок?ок.текст:"";o.отдать=ок?ок.пункты:[];__пункт(/Отдать/);await w(200);__закрыть();
  await w(2400);o.бойШтольни=__бои.length>0;for(let i=0;i<3;i++){await __победа();await w(3400);}__закрыть();await w(1800);Цепи170.проверить();await w(1800);__закрыть();
  o.руда=Number(G.inv["драготировая руда"])||0;o.видВыбор=c.шаги[c.шаг].вид;
  /* выбор: оставить старика — молот */
  Цепи170.решить(c.id);await w(50);const в=__окно();o.выбор=в?в.пункты:[];__пункт(/Оставить/);await w(150);__закрыть();
  o.видДомой=c.шаги[c.шаг].вид;
  /* домой к своему кузнецу */
  const к=window.__кузнец;__на(к.x,к.y);const gold0=G.gold;const gear0=(G.gear||[]).length;
  openNPC(к.key,true);const b2=document.querySelector('#npcBody button[data-cmd^="c170:do~"]');o.кнопкаДома=b2?b2.textContent:"";if(b2)CMD.c170(String(b2.dataset.cmd).slice(5));await w(50);
  o.финалТекст=(__окно()||{}).текст||"";__пункт(/Дальше/);await w(300);__закрыть();
  o.done=!!c.done;o.золото=G.gold-gold0;const it=(G.gear||[]).find(x=>x&&x.драготир);o.клинок=it?{name:it.name,val:it.val}:null;
  o.молот=(G.items||[]).includes("Молот старого мастера");o.заглушка=(G.quests||[]).find(q=>q.цепь170===c.id);o.заглушка=o.заглушка?o.заглушка.done:null;
  o.снова=Цепи170.предложения(к).map(t=>t.id);o.зельяРангов=(G.potions||[]).filter(r=>String(r.id).startsWith("r170_")).length;
  /* клинок растёт */
  __бои.length=0;if(it){G.equip=G.equip||{};G.equip.weapon=it;const v0=it.val;for(let i=0;i<6;i++)questMonsterProgress({id:"wolf",n:"Волк",lvl:2});o.рост=it.val-v0;}
  return o;});
 check('8. кузнец B рассказывает про штольню; старик под завалом просит траву и еду; твари штольни — бой; жила — три куска драготировой руды',
  /штольн/.test(ш.рассказ)&&ш.вид==="идти"&&/Придавило/.test(ш.старик)&&ш.бойШтольни&&ш.руда>=3&&ш.видВыбор==="выбор",ш);
 check('9. выбор (проводить или оставить); оставили — молот старого мастера; свой кузнец берёт руду: драготировый клинок, золото, зелья; дело закрыто и больше не предлагается',
  ш.выбор.length===2&&ш.молот&&/Ну и работка/.test(ш.финалТекст)&&ш.done&&ш.заглушка===true&&ш.клинок&&/Драготировый клинок/.test(ш.клинок.name)&&ш.золото>0&&ш.зельяРангов>=2&&!ш.снова.includes("rabotka"),ш);
 check('10. драготировый клинок растёт с хозяином: шесть побед — урон +2',ш.рост===2,ш.рост);

 /* ── 11. Сохранение и загрузка ── */
 const с=await page.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const n=getNPC(41000,40000,0,"Торговец");G.x=n.x;G.y=n.y;const t=ЦЕПИ170.find(x=>x.id==="oboz");Цепи170.начать(t,n);await w(50);__закрыть();
  const c=Цепи170.активные().find(x=>x.tid==="oboz");const до={шаг:c.шаг,цель:[c.шаги[0].tx,c.шаги[0].ty],всего:c.шаги.length};
  saveGame(true);await w(200);G.цепи170=null;loadGame();await w(900);__закрыть();
  const c2=Цепи170.активные().find(x=>x.tid==="oboz");return {до,после:c2?{шаг:c2.шаг,цель:[c2.шаги[0].tx,c2.шаги[0].ty],всего:c2.шаги.length}:null,сделано:(G.цепи170||{}).сделано};});
 check('11. сохранение и загрузка: начатое большое дело помнит шаг и цели; закрытое помнится закрытым',
  с.после&&с.после.шаг===с.до.шаг&&с.после.цель[0]===с.до.цель[0]&&с.после.цель[1]===с.до.цель[1]&&с.сделано&&с.сделано.rabotka===1,с);
 check('12. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();
