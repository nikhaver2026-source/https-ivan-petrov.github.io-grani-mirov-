/* ════════════════════════════════════════════════════════════════════════
   НАБОР 310: 15.0 — НЕМОТА (НУЛЕВОЙ ПРЕДЕЛ), прототип

   ТЗ «Нулевой Предел»: не отдельный пласт, а встроенная в существующий мир
   система — Немота стоит в уже существующих аномальных зонах и в глубине
   ярусов, меняет чары через общие законы игры; Тихая Мера — полевая наука
   существующей школы «Подавление чар», двенадцать приёмов из опыта, плата
   волей; места Сильвен, Боргин, Драгош, Немые штольни на пустых клетках у
   начала игры; круг отношений «орден»; первое дело — «Записки о Пределе».
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;window.maybeGuardPatrol=()=>{};window.maybeWildlife=()=>{};
  window.__тихо=()=>{G.inCombat=false;G.combat=null;safeFn(()=>{if(Actors&&Actors.list)Actors.list.length=0;});};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};
  window.__зона=Zones.all().find(z=>z.правило==="silence");
  window.__ci=n=>SPELLS.findIndex(s=>s.n===n);});

 /* ── 1. глубина Немоты: зоны тишины, места у начала, ярусы ── */
 const г=await page.evaluate(()=>{const z=__зона;const p=G.place;G.place=null;
  const o={зонаСередина:Немота.мир(z.x,z.y),зонаКрай:Немота.мир(z.x+z.r,z.y),вне:Немота.мир(z.x+z.r+3,z.y),
   тишь:Немота.мир(24905,24655),тишьКрай:Немота.мир(24911,24655),сильвен:Немота.мир(24898,24665),копи:Немота.мир(24938,25290),
   ярусы:[1,39,40,60,80,95].map(d=>Немота.ярус(d))};G.place=p;return o;});
 check('1. Немота стоит в существующих зонах «мёртвой тишины» (3 в середине, 2 у края), у мест 15.0 (Сильвенская Тишь; Боргинские копи, пока их глушитель перегружен, — 3) и в глубине ярусов (с 40-го — шёпот, с 80-го — немота)',
  г.зонаСередина===3&&г.зонаКрай===2&&г.вне===0&&г.тишь===3&&г.тишьКрай===2&&г.сильвен===0&&г.копи===3&&г.ярусы.join()==="0,0,1,2,3,4",г);

 /* ── 2. вход в Немоту слышен и назван ── */
 const в=await page.evaluate(()=>{const z=__зона;G.place=null;Немота.ст().было=0;G.x=z.x+z.r+1;G.y=z.y;__said=[];move("W");
  const o={слова:__said.filter(t=>/Немота/.test(t))};__said=[];move("E");move("E");o.выход=__said.filter(t=>/Немота/.test(t));__тихо();return o;});
 check('2. шаг в поле Немоты называет её ступень и что она делает с чарами; выход тоже слышен',
  в.слова.some(t=>/Немота, глушь — чары дороже на треть/.test(t))&&в.выход.some(t=>/Немота отступила/.test(t)),в);

 /* ── 3. чары школ в Немоте дороже и срываются; чары подавления — свои ── */
 const ч=await page.evaluate(()=>{const z=__зона;G.place=null;G.x=z.x;G.y=z.y;__тихо();
  const искра=SPELLS[__ci("Искра")];const глушь=SPELLS[__ci("Глушь")];
  const o={kИскра:Power.spellK(искра),kГлушь:Power.spellK(глушь)};
  if(!G.spells.includes("Искра"))G.spells.push("Искра");if(!G.spells.includes("Глушь"))G.spells.push("Глушь");
  G.manaMax=999;let срыв=0,срывГлушь=0;const ор=Math.random;Math.random=()=>0.2;
  for(let i=0;i<5;i++){G.mana=999;__said=[];castSpell(__ci("Искра"));if(__said.some(t=>/«Искра» сорвалось: Немота/.test(t)))срыв++;
   G.mana=999;__said=[];castSpell(__ci("Глушь"));if(__said.some(t=>/«Глушь» сорвалось: Немота/.test(t)))срывГлушь++;}
  Math.random=ор;o.срыв=срыв;o.срывГлушь=срывГлушь;return o;});
 check('3. в Немоте третьей ступени чары школ дороже в 1,6 раза и срываются; чары школы «Подавление чар» не срываются и дешевле',
  Math.abs(ч.kИскра-1.6)<0.01&&ч.kГлушь<1&&ч.срыв===5&&ч.срывГлушь===0,ч);

 /* ── 4. зелье «немота» (Перекрой) — личная Немота мёртвой речи ── */
 const з=await page.evaluate(()=>{G.place=null;G.x=25000;G.y=25000;const до=Немота.здесь();buffSet("немота",1);const после=Немота.здесь();delete G.buffs["немота"];return {до,после};});
 check('4. зелье «немота» даёт герою личную Немоту четвёртой ступени — «колдовать нельзя», как и обещано в его описании',з.до===0&&з.после===4,з);

 /* ── 5. приёмы не продаются: открываются опытом в Немоте; плата — воля ── */
 const о=await page.evaluate(()=>{const z=__зона;G.place=null;__тихо();G.spells=(G.spells||[]).filter(n=>!НЕМ_ПРИЁМЫ.some(t=>t.n===n));G.nem={};
  const o={вАкадемии:SchoolSpells.ofSchool("counter").map(s=>s.n),приёмовВШколе:SCHOOL_SPELLS.filter(s=>s.тихое).length};
  G.x=z.x+2;G.y=z.y;__said=[];for(let i=0;i<10;i++){move(i%2?"E":"W");__тихо();}
  o.нить=G.spells.includes("Услышать нить");o.слова=__said.filter(t=>/Тихая Мера: вы научились/.test(t));
  safeFn(()=>Energy.ensure());G.will=0;__said=[];castSpell(__ci("Услышать нить"));o.безВоли=__said.join(" | ");
  G.will=10;G.mana=50;__said=[];castSpell(__ci("Услышать нить"));o.воля=G.will;o.сотворено=__said.some(t=>/«Услышать нить» сотворено/.test(t));return o;});
 check('5. приёмы Тихой Меры не продаются (в академии — три прежние чары школы); десять шагов в Немоте открывают «Услышать нить»; без воли приём не творится, с волей — творится и тратит её',
  о.вАкадемии.join()==="Глушь,Немота,Зеркало отказа"&&о.приёмовВШколе===0&&о.нить&&о.слова.length===1&&/нужно 1 единица воли/.test(о.безВоли)&&о.воля===9&&о.сотворено,о);

 /* ── 6. бой: приглушение, купол, отвод, впитывание, перегрузка ── */
 const б=await page.evaluate(()=>{const z=__зона;G.place=null;G.x=z.x;G.y=z.y;__тихо();
  for(const t of НЕМ_ПРИЁМЫ)if(!G.spells.includes(t.n))G.spells.push(t.n);G.will=99;G.willMax=99;G.mana=99;G.manaMax=99;G.hp=G.hpMax=500;
  const маг=Object.assign({},MONSTERS.find(m=>Немота.маг(m))||MONSTERS[0]);const зверь=Object.assign({},MONSTERS.find(m=>!Немота.маг(m)));
  const бой=m=>{__тихо();G.combat=null;G.inCombat=true;G.combat={m:Object.assign({},m,{hp:400,dmg:12}),hp:400};return G.combat;};
  const o={маг:маг.n,зверь:зверь.n};
  let cb=бой(зверь);__said=[];castSpell(__ci("Приглушить"));o.слаб=Number(cb.zvWeak)||0;
  cb=бой(маг);castSpell(__ci("Купол тиши"));const h0=G.hp;o.купол=foeStrike({kind:"bolt"})===0&&G.hp===h0;
  cb=бой(маг);castSpell(__ci("Отвести"));const f0=cb.hp;const h1=G.hp;foeStrike({kind:"bolt"});o.отвод=cb.hp<f0&&G.hp===h1;
  cb=бой(маг);castSpell(__ci("Впитать"));G.mana=10;const h2=G.hp;foeStrike({kind:"bolt"});o.впит=G.mana>10&&G.hp===h2;
  cb=бой(маг);const f1=cb.hp;castSpell(__ci("Перегрузить"));o.перегрузМаг=cb.hp<f1&&(Number(cb.svStun)||0)>=1;
  cb=бой(зверь);const h3=G.hp;__said=[];castSpell(__ci("Перегрузить"));o.откат=G.hp<h3&&__said.some(t=>/не колдует/.test(t));
  __тихо();return o;});
 check('6. в бою приёмы действуют через общие боевые состояния: приглушение ослабляет удар твари, купол гасит её чару, отвод отправляет чару назад, впитывание кладёт её в ману, перегрузка бьёт заклинателя и оглушает — а не заклинателю даёт откат по вам',
  б.слаб>=3&&б.купол&&б.отвод&&б.впит&&б.перегрузМаг&&б.откат,б);

 /* ── 7. вне боя: нить находит ловушку, «Усыпить чары» её снимает, «Переписать условие» открывает запертое ── */
 const п=await page.evaluate(()=>{__тихо();let наш=null;
  for(let bx=0;bx<20&&!наш;bx++)for(let by=0;by<20&&!наш;by++){const lvl=genLevel(3000+bx,3000+by,6,"ruins");
   G.place={kind:"dungeon",bx:3000+bx,by:3000+by,stype:"ruins",depth:6,name:"м",x:1,y:1};G.marks={};
   for(let y=2;y<lvl.h-2&&!наш;y++)for(let x=2;x<lvl.w-2&&!наш;x++){const л=trapAt(x,y);if(л&&л.состояние==="не найдена"){
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0],[2,0],[0,2]]){const t=tileAt(lvl,x+dx,y+dy);if(t==="."&&!trapAt(x+dx,y+dy)){наш={x,y,hx:x+dx,hy:y+dy};break;}}}}}
  if(!наш)return {нет:true};G.place.x=наш.hx;G.place.y=наш.hy;G.will=99;G.mana=99;G.spellCD={};
  __said=[];castSpell(__ci("Услышать нить"));const o={нить:__said.join(" | ").slice(0,300),найдена:(trapAt(наш.x,наш.y)||{}).состояние};
  G.spellCD={};__said=[];castSpell(__ci("Усыпить чары"));o.уснула=__said.join(" | ").slice(0,200);o.отметка=placeMark(наш.x,наш.y);
  /* запертая дверь рядом */
  const L=curLevel();let д=null;for(let y=1;y<L.h-1&&!д;y++)for(let x=1;x<L.w-1&&!д;x++){if(L.g[y][x]!=="+")continue;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(tileAt(L,x+dx,y+dy)==="."){д={x,y,hx:x+dx,hy:y+dy};break;}}
  if(д){G.place.x=д.hx;G.place.y=д.hy;setPlaceMark(д.x,д.y,"locked");G.spellCD={};__said=[];castSpell(__ci("Переписать условие"));o.дверь=placeMark(д.x,д.y);o.словаДвери=__said.join(" | ").slice(0,160);}
  G.place=null;return o;});
 check('7. «Услышать нить» находит скрытую ловушку (она становится найденной), «Усыпить чары» её усыпляет, «Переписать условие» открывает запертую дверь',
  !п.нет&&/Нить звенит/.test(п.нить)&&п.найдена==="найдена"&&/уснула/.test(п.уснула)&&п.отметка==="trap_off"&&п.дверь==="open",п);

 /* ── 8. места 15.0: Сильвен, Боргин, Драгош, Немые штольни — со стражей у ворот ── */
 const м=await page.evaluate(()=>{__тихо();__закрыть();G.place=null;G.gate147={};G.standing={};G.gold=100;G.hour=12;
  const o={места:НЕМ_МЕСТА.map(м=>{const c=cellContent(м.x,м.y);return (c.structure&&c.structure.name===м.n&&c.structure.type===м.тип)?м.n:null;})};
  o.поселения=["Сильвен","Боргин","Драгош"].map(n=>{const м=НЕМ_МЕСТА.find(x=>x.n===n);return (isCityAt(м.x,м.y)||{}).name;});
  G.x=24898;G.y=24665;fieldInteract();const m=document.getElementById("modal-event");o.стража=m&&!m.hidden?document.getElementById("eventTitle").textContent:null;__закрыть();
  o.ордена=НЕМ_ОРДЕНА.length;o.круг=!!STAND_SCOPE_BY_ID.orden;return o;});
 check('8. на карте у начала игры — Сильвен, Боргин, Драгош и Немые штольни; у ворот Сильвена встречает стража (14.7); двенадцать орденов и круг отношений «орден»',
  м.места.every(Boolean)&&м.поселения.join()==="Сильвен,Боргин,Драгош"&&/^Ворота: Сильвен/.test(м.стража||"")&&м.ордена===12&&м.круг,м);

 /* ── 9. «Записки о Пределе»: дело Звёздной Меры с наградой и последствием ── */
 const з2=await page.evaluate(()=>{__тихо();__закрыть();G.place=null;G.nem=G.nem||{};delete G.nem.записки;G.quests=[];
  G.spells=(G.spells||[]).filter(n=>n!=="Услышать нить");
  const c=cellContent(24898,24665);const ns=npcsFor(c)||[];const L=ns.length?sideQuestsFor(ns[0]):[];const q=L.find(x=>x.id==="nem_zapiski");
  const o={есть:!!q,первым:L[0]&&L[0].id==="nem_zapiski"};if(!q)return o;G.quests.push(q);
  for(const [x,y] of НЕМ_ТОЧКИ){__тихо();G.x=x+1;G.y=y;move("W");__тихо();if(!(q.got||[]).length||G.x!==x){G.x=x;G.y=y;Q150.onStep();}}
  o.сделано=Q150.сделано(q);const s0=standOf("orden","zvm");__said=[];completeQuest(q.id);
  o.стенд=standOf("orden","zvm")-s0;o.нить=G.spells.includes("Услышать нить");o.повтор=!!(sideQuestsFor(ns[0])||[]).find(x=>x.id==="nem_zapiski");return o;});
 check('9. жители Сильвена первым предлагают «Записки о Пределе»: три замера в Сильвенской Тиши — и Звёздная Мера ценит вас выше, а Ваэль учит «Услышать нить»; второй раз дела не дают',
  з2.есть&&з2.первым&&з2.сделано&&з2.стенд>=12&&з2.нить&&!з2.повтор,з2);

 /* ── 10. Немые штольни: Немота растёт с ярусом, жилы дают немой кварц ── */
 const ш=await page.evaluate(()=>{__тихо();G.place=null;G.x=24936;G.y=25289;G.gate147={};enterPlace(cellContent(24936,25289));__закрыть();
  const o={вошли:!!G.place,гл:[]};for(let i=0;i<4;i++){o.гл.push(Немота.здесь());changeDepth(1,{bypass:true});__закрыть();}
  const L=curLevel();let ж=null;for(let y=0;y<L.h&&!ж;y++)for(let x=0;x<L.w;x++)if(tileAt(L,x,y)==="R"){ж={x,y};break;}
  if(ж){G.place.x=ж.x;G.place.y=ж.y;const до=Number((G.inv||{})["немой кварц"])||0;__said=[];useHere();o.кварц=(Number(G.inv["немой кварц"])||0)-до;}
  safeFn(()=>{while(G.place)leavePlace();});return o;});
 check('10. в Немых штольнях Немота растёт с каждым ярусом, а жилы дают немой кварц',ш.вошли&&ш.гл[0]>=2&&ш.гл[3]>=ш.гл[0]&&ш.гл[3]>=3&&(ш.кварц==null||ш.кварц>0),ш);

 /* ── 11. правила кузни и школ целы ── */
 const к=await page.evaluate(()=>({ядер:SPELL_CORES.length,школ:SCHOOLS.length,поТри:SCHOOLS.every(sc=>SchoolSpells.ofSchool(sc.id).length===3),
  приёмов:SPELLS.filter(s=>s.тихое).length,всеПоняты:SPELLS.filter(s=>s.тихое).every(s=>s.school==="counter"&&!!FORM_BY_ID[s.форма])}));
 check('11. кузня и школы целы: шестнадцать ядер, у каждой школы три школьных чары; двенадцать приёмов Тихой Меры — в общем списке чар, школа «Подавление чар»',
  к.ядер===16&&к.поТри&&к.приёмов===12&&к.всеПоняты,к);

 /* ── 12. сохранение ── */
 const с=await page.evaluate(async()=>{G.nem=G.nem||{};G.nem.счёт=Object.assign({},G.nem.счёт,{нить:2});saveGame(true);const до=JSON.stringify(G.nem);
  await new Promise(r=>setTimeout(r,300));loadGame();await new Promise(r=>setTimeout(r,800));return {до,после:JSON.stringify(G.nem)};});
 check('12. опыт Тихой Меры и дела Немоты сохраняются и загружаются',с.до===с.после&&/нить/.test(с.после),с);

 /* ── 13. с третьей ступени перенос не работает; звук чар в Немоте глуше ── */
 const пр=await page.evaluate(()=>{const z=Zones.all().find(z=>z.правило==="silence");G.place=null;G.x=z.x;G.y=z.y;G.inCombat=false;G.combat=null;
  const o={d:Немота.здесь()};o.шаг=castCustomEffect({custom:true,n:"проба",ядро:"shift",school:"fire",форма:"ward",сила:1,cost:1,id:"probe_shift"});
  __said=[];o.узел=Grani.transit({id:"n0",x:z.x,y:z.y});o.узелСлова=__said.join(" | ").slice(0,120);
  const калька=[];const b0=Bank.play;Bank.play=(r,op)=>{калька.push(Number(op&&op.gain)||0);return true;};const ef=settings.effects;settings.effects=1;
  spellAudio(SPELLS.find(s=>s.n==="Искра"));const тихо=калька.slice();калька.length=0;G.x=25000;G.y=25000;spellAudio(SPELLS.find(s=>s.n==="Искра"));const громко=калька.slice();
  Bank.play=b0;settings.effects=ef;o.тихо=Math.max(0,...тихо);o.громко=Math.max(0,...громко);return o;});
 check('13. в Немоте третьей ступени шаг сквозь пространство не выходит и узел Сети молчит («перенос не работает»); звук чар в Немоте глуше, чем на обычной земле',
  пр.d===3&&/перенос здесь не работает/.test(пр.шаг)&&пр.узел===false&&/Узел молчит/.test(пр.узелСлова)&&пр.тихо>0&&пр.тихо<пр.громко,пр);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
