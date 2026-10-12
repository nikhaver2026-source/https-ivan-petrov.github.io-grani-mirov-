/* ════════════════════════════════════════════════════════════════════════
   НАБОР 312: 15.0 — ВЕЩИ ТИХОЙ МЕРЫ, МАСТЕРСКАЯ ГИЛЬДИИ, ДОМ ЗВЁЗДНОЙ МЕРЫ,
   ДОСМОТР И КОМЕНДАТУРА ДРАГОША

   Приборы лежат в общей котомке и применяются общим «Использовать»;
   снаряжение надевается на свои места и работает в общих местах боя;
   мастерская Гильдии продаёт и делает на заказ из добытого в Немоте и того,
   что уже было в мире; лучшее — своим (отношение ордена); в Драгоше глушитель
   без грамоты досматривают.
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
  window.__тихо=()=>{if(G.combat&&G.combat.monsterTimer)clearTimeout(G.combat.monsterTimer);safeFn(()=>Arena.stop());G.inCombat=false;G.combat=null;};
  window.__закрыть=()=>{while(activeLayer())closeTopUI();curEvent=null;};
  window.__окно=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.getElementById("eventBody")||{}).textContent||"",пункты:(curEvent&&curEvent.choices||[]).map(c=>String(c.l))}:null;};
  window.__пункт=re=>{const o=__окно();if(!o)return false;const i=curEvent&&curEvent.choices?curEvent.choices.findIndex(c=>re.test(String(c.l))):-1;
   if(i>=0){resolveEvent(i);return true;}return false;};
  window.__ряд=n=>{const i=G.items.indexOf(n);return invRow("item",String(i));};
  G.gold=5000;G.place=null;G.standing={};G.nem={};G.inv=G.inv||{};G.hp=G.hpMax=900;G.manaMax=999;G.mana=999;});

 /* ── 1. мастерская Гильдии из окна Боргина; камертон в общей котомке ── */
 const м=await page.evaluate(async()=>{const c=cellContent(24941,25294);openBuilding(c);const o={кнопка:!!document.querySelector('#bldBody [data-cmd="nemguild"]')};
  CMD.nemguild();await new Promise(r=>setTimeout(r,300));o.окно=(__окно()||{}).заголовок;o.пункты=(__окно()||{}).пункты;
  __пункт(/Купить приборы/);const з=G.gold;__said=[];__пункт(/^Камертон Немоты/);o.плата=з-G.gold;o.есть=G.items.includes("Камертон Немоты");
  const р=__ряд("Камертон Немоты");o.раздел=р&&р.cat;o.описание=invBrief("item",р.key).slice(0,90);o.действия=invActionList("item",р.key).map(a=>a.n.trim());__закрыть();return o;});
 check('1. в окне Боргина — «Мастерская Гильдии Тихой Меры»; купленный камертон лежит в общей котомке среди инструментов, с описанием и общим «Использовать»',
  м.кнопка&&м.окно==="Мастерская Гильдии Тихой Меры"&&м.плата===80&&м.есть&&м.раздел==="tool"&&/вилка на костяной ручке/.test(м.описание)&&м.действия.includes("Использовать"),м);

 /* ── 2. камертон: где Немота и куда тянет звон ── */
 const к=await page.evaluate(()=>{G.place=null;G.x=24905;G.y=24640;const р=__ряд("Камертон Немоты");let t="";
  ITEM_ACTIONS.find(a=>a.id==="use").делать(р,invContext(),x=>{t=x;return true;});const o={вдали:t};G.x=24905;G.y=24655;
  ITEM_ACTIONS.find(a=>a.id==="use").делать(р,invContext(),x=>{t=x;return true;});o.вПоле=t;return o;});
 check('2. камертон вне поля называет сторону и шаги до ближнего поля Немоты, в поле — её ступень',
  /Звон тянет юг: Сильвенская Тишь, 15 шагов/.test(к.вдали)&&/Немота здесь: немота/.test(к.вПоле),к);

 /* ── 3. лучшее — своим: плащ тиши после сданного кварца ── */
 const п=await page.evaluate(()=>{const o={};o.отказ=НемВещи.купить("Плащ тиши");G.inv["немой кварц"]=6;o.сдал1=НемВещи.сдать("gtm");G.nem.сдал.gtm=0;o.сдал2=НемВещи.сдать("gtm");
  o.отношение=standOf("guild","gtm");const з=G.gold;o.купил=НемВещи.купить("Плащ тиши");o.плата=з-G.gold;const пл=G.gear.find(g=>g.name==="Плащ тиши");
  o.нем=пл&&пл.нем;o.черта=пл&&пл.черта;o.место=пл&&equipPlaceOf(пл);o.текст=standText(null);return o;});
 check('3. плащ тиши Гильдия отдаёт только своим: без отношения — отказ с причиной; дважды сданный кварц поднимает отношение до 12 — и плащ продан дешевле (тихий шаг, место — плечи); орден виден в общих отношениях — в прежнем круге «в гильдии»',
  /нужно отношение Гильдии Тихой Меры не ниже 10/.test(п.отказ)&&/Принято/.test(п.сдал1)&&п.отношение===12&&/Куплено: Плащ тиши/.test(п.купил)&&п.плата<220&&п.нем==="тишь"&&п.черта==="quiet"&&п.место==="cloak"&&/в гильдии \(Гильдия Тихой Меры\): нейтральность \(12\)/.test(п.текст),п);

 /* ── 4. снаряжение в бою: плащ, перстень, щит отвода, клинок безгласия ── */
 const с=await page.evaluate(()=>{const o={};const t=Object.assign({},MONSTERS.find(m=>m.id==="wraith"),{lvl:8,hp:500,dmg:30});
  const бой=()=>{__тихо();G.inCombat=true;G.combat={m:Object.assign({},t),hp:500};return G.combat;};
  const ор=Math.random;Math.random=()=>0.5;G.equip.cloak=null;G.equip.ring=null;G.equip.shield=null;
  let cb=бой();G.hp=900;foeStrike({kind:"bolt"});o.без=900-G.hp;
  G.equip.cloak=G.gear.find(g=>g.name==="Плащ тиши");cb=бой();G.hp=900;foeStrike({kind:"bolt"});o.сПлащом=900-G.hp;G.equip.cloak=null;
  G.equip.ring=НемВещи.вещь("Перстень впитывания");cb=бой();G.hp=900;G.mana=10;foeStrike({kind:"bolt"});o.мана=G.mana-10;G.equip.ring=null;
  G.equip.shield=НемВещи.вещь("Щит отвода");Math.random=()=>0.1;cb=бой();G.hp=900;const r=foeStrike({kind:"bolt"});o.отвод={урон:900-G.hp,твари:500-cb.hp,r};G.equip.shield=null;
  Math.random=()=>0.9;const w0=G.equip.weapon;G.equip.weapon=НемВещи.вещь("Клинок безгласия");cb=бой();o.клинок=Undead.onHit(cb.m,20);
  const волк=Object.assign({},MONSTERS.find(m=>m.id==="wolf"),{lvl:3,hp:50});G.combat.m=волк;o.клинокВолк=Undead.onHit(волк,20);G.equip.weapon=w0;Math.random=ор;__тихо();return o;});
 check('4. плащ тиши гасит пятую часть вреда от чар, перстень впитывания кладёт треть в ману, щит отвода возвращает чару твари, клинок безгласия режет тварь Немоты на две пятых глубже (обычного волка — как прежде)',
  с.без>0&&с.сПлащом<=Math.round(с.без*0.8)&&с.мана>=Math.floor(с.без/4)&&с.мана<=Math.ceil(с.без/3)&&с.отвод.урон===0&&с.отвод.твари>0&&с.клинок===28&&с.клинокВолк===20,с);

 /* ── 5. глушитель: заряды, купол в бою и вне боя, зарядка кварцем ── */
 const г=await page.evaluate(()=>{const o={};o.купил=НемВещи.купить("Переносной глушитель");o.заряды=НемВещи.глушитель();const р=()=>__ряд("Переносной глушитель");
  __тихо();G.inCombat=true;G.combat={m:Object.assign({},НЕМ_ТВАРЬ.nem_hound,{lvl:3,hp:50,dmg:5}),hp:50};let t="";
  ITEM_ACTIONS.find(a=>a.id==="use").делать(р(),invContext(),x=>{t=x;return true;});o.вБою=G.combat.немКупол;o.слова=t.slice(0,60);__тихо();
  G.place=null;G.x=25000;G.y=25000;ITEM_ACTIONS.find(a=>a.id==="use").делать(р(),invContext(),x=>{t=x;return true;});o.вокруг=Немота.здесь();o.после=НемВещи.глушитель();G.nem.купол=0;
  G.inv["немой кварц"]=1;o.действия=invActionList("item",р().key).map(a=>a.n.trim());ITEM_ACTIONS.find(a=>a.id==="nemcharge").делать(р(),invContext(),x=>{t=x;return true;});o.заряжен=НемВещи.глушитель();return o;});
 check('5. переносной глушитель: три заряда; в бою — купол на четыре хода, вне боя — час Немоты вокруг; пустеет по заряду; «Зарядить немым кварцем» — плюс три',
  /Куплено: Переносной глушитель/.test(г.купил)&&г.заряды===3&&г.вБою===4&&г.вокруг>=3&&г.после===1&&г.действия.includes("Зарядить немым кварцем")&&г.заряжен===4,г);

 /* ── 6. звонкий кристалл: в Немоте чары не срываются и дорожают как в шёпоте ── */
 const з=await page.evaluate(()=>{const o={};НемВещи.купить("Звонкий кристалл");const z=Zones.all().find(z=>z.правило==="silence");G.place=null;G.x=z.x;G.y=z.y;
  const искра=SPELLS.find(s=>s.n==="Искра");if(!G.spells.includes("Искра"))G.spells.push("Искра");o.kДо=Power.spellK(искра);let t="";
  ITEM_ACTIONS.find(a=>a.id==="use").делать(__ряд("Звонкий кристалл"),invContext(),x=>{t=x;return true;});o.слова=t.slice(0,50);o.остался=G.items.includes("Звонкий кристалл");
  o.kПосле=Power.spellK(искра);const ор=Math.random;Math.random=()=>0.01;let срыв=0;G.nem.зов=1e9;
  for(let i=0;i<3;i++){G.mana=999;__said=[];castSpell(SPELLS.indexOf(искра));if(__said.some(t=>/«Искра» сорвалось: Немота/.test(t)))срыв++;}Math.random=ор;o.срыв=срыв;delete G.buffs["звон"];return o;});
 check('6. звонкий кристалл истрачен на звон: час в Немоте чары школ не срываются и дорожают не больше, чем в шёпоте (1,6 → 1,15)',
  Math.abs(з.kДо-1.6)<0.01&&Math.abs(з.kПосле-1.15)<0.01&&!з.остался&&з.срыв===0&&/зазвенел/.test(з.слова),з);

 /* ── 7. заказ из своего: материал — Немоты и прежнего мира ── */
 const о=await page.evaluate(()=>{const o={};G.inv["тишь-смола"]=2;G.inv["мшаный войлок"]=1;const час=G.hour;const з=G.gold;const i=НЕМ_ЗАКАЗЫ.findIndex(x=>x.что==="Плащ тиши");
  const до=G.gear.filter(g=>g.name==="Плащ тиши").length;o.итог=НемВещи.заказать(i);o.плата=з-G.gold;o.плащей=G.gear.filter(g=>g.name==="Плащ тиши").length-до;
  o.смола=G.inv["тишь-смола"]||0;o.войлок=G.inv["мшаный войлок"]||0;o.нет=НемВещи.заказать(i);
  G.inv["тишь-смола"]=1;o.печать=НемВещи.заказать(НЕМ_ЗАКАЗЫ.findIndex(x=>x.что==="Печать «Сшить»"));return o;});
 check('7. заказ у мастера: плащ тиши из двух тишь-смол и мшаного войлока за плату меньше цены готового; материал списан; без материала — отказ с перечнем; печать «Сшить» — из одной смолы',
  /«Плащ тиши» готов/.test(о.итог)&&о.плата<60&&о.плащей===1&&о.смола===0&&о.войлок===0&&/не хватает: тишь-смола 0 из 2/.test(о.нет)&&/«Печать «Сшить»» готова/.test(о.печать),о);

 /* ── 8. печать «Сшить» чинит надетое ── */
 const ш=await page.evaluate(()=>{const пл=G.gear.find(g=>g.name==="Плащ тиши");G.equip.cloak=пл;пл.сост=30;let t="";
  ITEM_ACTIONS.find(a=>a.id==="use").делать(__ряд("Печать «Сшить»"),invContext(),x=>{t=x;return true;});return {сост:пл.сост,слова:t.slice(0,80),осталась:G.items.includes("Печать «Сшить»")};});
 check('8. печать «Сшить» тает на швах: надетый плащ из 30 — в 70, печать истрачена',ш.сост===70&&!ш.осталась&&/сшито/.test(ш.слова),ш);

 /* ── 9. дом Звёздной Меры: дело, записи ── */
 const в=await page.evaluate(async()=>{const o={};G.quests=[];G.nem.записки=false;const c=cellContent(24898,24665);openBuilding(c);o.кнопка=!!document.querySelector('#bldBody [data-cmd="nemvael"]');
  CMD.nemvael();await new Promise(r=>setTimeout(r,300));o.окно=(__окно()||{}).заголовок;__said=[];__пункт(/Взять дело/);o.дело=(G.quests||[]).some(q=>q.id==="nem_zapiski");
  const q=G.quests.find(q=>q.id==="nem_zapiski");q.got=[0,1,2];q.have=3;q.doneFlag=true;НемЛюди.ваэль();o.отдать=(__окно()||{пункты:[]}).пункты.some(p=>/Отдать «Записки о Пределе»/.test(p));
  const s0=standOf("guild","zvm");__пункт(/Отдать «Записки/);o.сделано=!!(G.quests.find(q=>q.id==="nem_zapiski")||{}).done;o.орден=standOf("guild","zvm")-s0;
  G.inv["обрывок записей"]=1;const з=G.gold;o.обрывок=НемВещи.сдать("zvm");o.плата=G.gold-з;__закрыть();return o;});
 check('9. в Сильвене — «Дом Звёздной Меры»: Ваэль даёт «Записки о Пределе», принимает их, когда замеры сделаны (Звёздная Мера ценит выше), и платит за обрывки записей',
  в.кнопка&&в.окно==="Дом Звёздной Меры"&&в.дело&&в.отдать&&в.сделано&&в.орден>=12&&/Принято: обрывок записей/.test(в.обрывок)&&в.плата===15,в);

 /* ── 10. Драгош: досмотр глушителя без грамоты, затем обычная стража; комендатура ── */
 const д=await page.evaluate(async()=>{const o={};G.gate147={};G.nem.грамота=false;if(!G.items.includes("Переносной глушитель"))НемВещи.дать("Переносной глушитель");
  G.x=25000;G.y=25300;fieldInteract();await new Promise(r=>setTimeout(r,100));o.первое=(__окно()||{}).заголовок;__пункт(/Отдать глушитель/);o.дальше=(__окно()||{}).заголовок;
  __пункт(/К воротам/);await new Promise(r=>setTimeout(r,100));o.стража=(__окно()||{}).заголовок;o.изъят=!G.items.includes("Переносной глушитель");o.затвор=standOf("guild","dz");__закрыть();
  НемВещи.дать("Переносной глушитель");НемВещи.дать("Грамота на глушитель");G.gate147={};fieldInteract();await new Promise(r=>setTimeout(r,100));o.сГрамотой=(__окно()||{}).заголовок;__закрыть();
  G.inv["шестерня Зодчих"]=2;const з=G.gold;o.шестерни=НемВещи.сдать("dz");o.плата=G.gold-з;o.затвор2=standOf("guild","dz");return o;});
 check('10. в Драгош с глушителем без грамоты сперва досмотр (отдать, пошлина, слово Гильдии), потом обычная стража; с грамотой — сразу стража; комендатура берёт шестерни Зодчих',
  д.первое==="Досмотр: Драгош"&&д.дальше==="Досмотр: Драгош"&&/^Ворота: Драгош/.test(д.стража||"")&&д.изъят&&д.затвор===3&&/^Ворота: Драгош/.test(д.сГрамотой||"")&&/Принято: шестерня Зодчих/.test(д.шестерни)&&д.плата===60&&д.затвор2===11,д);

 /* ── 11. ступень отношения ордена названа его именем; сохранение ── */
 const и=await page.evaluate(async()=>{__said=[];G.standing["guild:gtm"]=20;addStand("guild","gtm",10);const o={слово:__said.filter(t=>/Гильдия Тихой Меры: теперь/.test(t)).slice(0,1)};
  saveGame(true);const до=JSON.stringify({g:G.nem.глушитель,гр:G.nem.грамота,с:G.standing["guild:gtm"]});await new Promise(r=>setTimeout(r,300));loadGame();await new Promise(r=>setTimeout(r,800));
  o.до=до;o.после=JSON.stringify({g:G.nem.глушитель,гр:G.nem.грамота,с:G.standing["guild:gtm"]});return o;});
 check('11. переход ступени отношения ордена назван его именем («Гильдия Тихой Меры: теперь симпатия»); заряды глушителя, грамота и отношения сохраняются',и.слово.length===1&&и.до===и.после,и);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
