/* ════════════════════════════════════════════════════════════════════════
   НАБОР 324: ЖИВЫЕ ЗАДАНИЯ НА ПОВЕРХНОСТИ — ПОВОРОТЫ, ВЫБОР, ПРОДОЛЖЕНИЯ (15.5)

   Просьба игрока: квесты на поверхности — интереснее, живее, разнообразнее,
   непредсказуемее.
   1. Новые просьбы жителей: загадки старца, тайна поселения, просьба мастера,
      гонец с шифром — встречаются среди побочных.
   2. Скрытые повороты: почти у половины дел, семи родов; заранее не названы.
   3. «Загадки старца»: до разгаданных загадок не сдаётся, счёт идёт от
      взятия; разгадал — сдаётся с наградой.
   4. Засада в пути: «Засада!» — драться, откупиться, заговорить зубы
      загадкой; откуп берёт золото; «драться» начинает бой.
   5. Заговорить зубы: загадка в окне выбора, верный ответ — шайка уходит.
   6. Попутчик: поделился — при сдаче добро вернётся или пропадёт кошель.
   7. Соперник при сдаче: поделить — половина награды уходит; назавтра —
      «Месть соперника» у того же жителя.
   8. Ложь заказчика: рассказать старосте — опыт; назавтра «Правда о деле».
   9. Ларец с загадкой, проклятая находка, выбор награды — свои развязки.
   10. Гонец с шифром: шифр разгадан — «несите письмо»; дошёл — выполнено.
   11. Тайна поселения как задание: распутал — сдаётся.
   12. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,800):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  Bank.play=()=>true;window.maybeEvent=()=>{};window.meetCaravan=()=>false;safeFn(()=>{Actors.tick=()=>{};});
  window.__закрыть=()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();curEvent=null;};
  window.__событие=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,
   текст:(document.querySelector("#eventBody .list-line")||{}).textContent,выбор:(curEvent&&curEvent.choices||[]).map(c=>c.l)}:null;};
  window.__выбрать=re=>{const c=(curEvent&&curEvent.choices||[]);const i=c.findIndex(x=>re.test(x.l));if(i<0)return false;resolveEvent(i);return true;};
  window.__решить=z=>{if(z.ui==="выбор")return CMD.rd("a:"+z.opts.indexOf(z.ans));if(z.ui==="ряд"){for(const k of z.ans)CMD.rd("i:"+k);return true;}
   const п=z.шаги;let ходы=[];if(п.вид==="кувшины")ходы=СводШаги.кувшины.решить(п.a,п.b,п.t);else if(п.вид==="переправа")ходы=["2","0","1","2","3","0","2"];
   else if(п.вид==="мост"){const t=п.t;ходы=2*t[1]<=t[0]+t[2]?["01","0","23","1","01"]:["03","0","02","0","01"];}
   else if(п.вид==="ханой"){const h=(n,a,b,c)=>{if(!n)return;h(n-1,a,c,b);ходы.push(`${a}${c}`);h(n-1,b,a,c);};h(п.n,п.с,[0,1,2].find(x=>x!==п.с&&x!==п.ц),п.ц);}
   else if(п.вид==="монета"){CMD.rd("s:"+encodeURIComponent("w1-3|4-6"));const и=СводИгра.сост[z.id].итоги[0];const куч=/равновесии/.test(и)?[7,8,9]:/левая/.test(и)?[1,2,3]:[4,5,6];
    CMD.rd("s:"+encodeURIComponent(`w${куч[0]}|${куч[1]}`));const и2=СводИгра.сост[z.id].итоги[1];return CMD.rd("s:n"+(/равновесии/.test(и2)?куч[2]:/левая/.test(и2)?куч[0]:куч[1]));}
   for(const д of ходы)CMD.rd("s:"+encodeURIComponent(д));return true;};
  /* деревня с жителем, не стражником */
  window.__дер=null;for(let r=1;r<400&&!__дер;r++)for(let dx=-r;dx<=r&&!__дер;dx++)for(const dy of [-r,r]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);
   if(c.structure&&c.structure.type==="village"){const n=(npcsFor(c)||[]).find(n=>!GUARD_RE.test(String(n.prof||"")));if(n){__дер={x,y,n:c.structure.name,key:n.key};break;}}}
  G.x=__дер.x;G.y=__дер.y;G.place=null;G.свод={};G.живые={};G.quests=[];G.gold=500;
  /* дело с заданным поворотом, уже выполненное (для проверки сдачи) */
  window.__дело=(поворот,доп)=>{const n=getNPCByKey(__дер.key);const id=`t${Math.random().toString(36).slice(2,8)}`;
   const q=Object.assign({id,type:"svod_n",need:1,have:0,база:СводИгра.ст().всего-1,npc:n.name,npcKey:n.key,побочный:true,заглавие:"Проба",text:"проба",reward:{gold:60,xp:20},race:n.race,поворот,взятоДень:G.day},доп||{});
   G.quests.push(q);return q;};});
 const W=ms=>page.waitForTimeout(ms);

 /* ── 1. новые просьбы среди побочных ── */
 const р=await page.evaluate(()=>{const n=getNPCByKey(__дер.key);const виды={};const d0=G.day;
  for(let d=1;d<=40;d++){G.day=d;for(const q of sideQuestsFor(n))виды[q.вид]=(виды[q.вид]||0)+1;}G.day=d0;
  return {виды,новых:["старец","тайна","мастер","гонец"].filter(k=>виды[k])};});
 check('1. новые просьбы — загадки старца, тайна поселения, просьба мастера, гонец с шифром — встречаются среди побочных',р.новых.length===4,р);

 /* ── 2. повороты: почти у половины, семи родов ── */
 const п=await page.evaluate(()=>{const o={всего:0,с:0,роды:{}};for(let i=0;i<600;i++){const q={id:"x"+i+"s"+(i*7)};Живые.взято(q);o.всего++;if(q.поворот){o.с++;o.роды[q.поворот]=(o.роды[q.поворот]||0)+1;}}return o;});
 check('2. скрытые повороты — почти у половины дел (40–56%), все семь родов',п.с/п.всего>0.4&&п.с/п.всего<0.56&&Object.keys(п.роды).length===7,п);

 /* ── 3. загадки старца ── */
 const с=await page.evaluate(()=>{const n=getNPCByKey(__дер.key);let q=null;const d0=G.day;
  for(let d=1;d<=40&&!q;d++){G.day=d;q=sideQuestsFor(n).find(x=>x.вид==="старец")||null;}if(!q)return {нет:true};
  const i=sideQuestsFor(n).findIndex(z=>z.id===q.id);npcQuestPick(n.key,"s"+i);const x=G.quests.find(z=>z.id===q.id);x.поворот=null;const o={база:x.база,нужно:x.need,прогресс0:qProgressText(x)};
  __said=[];completeQuest(x.id);o.отказ=__said.slice(-1)[0];
  СводИгра.домой();for(const z of СводИгра.список.slice(0,x.need)){СводИгра.открыть(z,{вид:"место"});__решить(z);}__закрыть();
  o.прогресс1=qProgressText(x);const g0=G.gold;completeQuest(x.id);o.сдано=x.done;o.золото=G.gold-g0;return o;});
 check('3. «Загадки старца»: счёт от взятия («0 из N»), до разгаданных не сдаётся; разгадал N — сдано с наградой',
  !с.нет&&/^0 из/.test(с.прогресс0)&&/не выполнено/.test(с.отказ)&&new RegExp("^"+с.нужно+" из").test(с.прогресс1)&&с.сдано&&с.золото>0,с);

 /* ── 4–5. засада ── */
 const з=await page.evaluate(async()=>{__закрыть();const o={};const q=__дело("засада");q.поворотШаг=3;q.шагов=0;q.done=false;q.база=СводИгра.ст().всего;
  for(let i=0;i<3;i++)Живые.шаг();o.окно=__событие();const g0=G.gold;__выбрать(/^Откупиться/);o.откуп=g0-G.gold;o.итог=q.поворотИтог;
  const q2=__дело("засада");q2.поворотШаг=1;q2.шагов=0;q2.база=СводИгра.ст().всего;Живые.шаг();__выбрать(/^Драться/);await new Promise(r=>setTimeout(r,800));o.бой=!!(G.inCombat||G.combat);
  G.inCombat=false;G.combat=null;__закрыть();
  const q3=__дело("засада");q3.поворотШаг=1;q3.шагов=0;q3.база=СводИгра.ст().всего;Живые.шаг();__выбрать(/^Заговорить/);o.спор=__событие();
  return o;});
 /* верный ответ в споре — по самой загадке */
 const з2=await page.evaluate(()=>{const ev=__событие();if(!ev)return {нет:true};const ans=Живые._спор&&Живые._спор.ans;
  const x0=G.xp;const ok=__выбрать(new RegExp("^"+(ans?ans[0].toUpperCase()+ans.slice(1):"$^").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$"));return {ans,ok,опыт:G.xp-x0,сказано:__said.slice(-1)[0]};});
 check('4. засада в пути: «Засада!» — драться, откупиться, заговорить зубы; откуп берёт золото; «драться» начинает бой',
  з.окно&&з.окно.заголовок==="Засада!"&&з.окно.выбор.some(x=>/^Драться/.test(x))&&з.окно.выбор.some(x=>/^Откупиться/.test(x))&&з.окно.выбор.some(x=>/^Заговорить/.test(x))
  &&з.откуп>0&&з.итог==="было"&&з.бой,з);
 check('5. заговорить зубы: загадка в окне выбора; верный ответ — шайка расступается, опыт',з.спор&&з.спор.заголовок==="Спор загадкой"&&з.спор.выбор.length>=3&&з2.ok&&з2.опыт>0&&/расступается/.test(з2.сказано),{з:з.спор,з2});

 /* ── 6. попутчик ── */
 const пп=await page.evaluate(async()=>{__закрыть();G.inCombat=false;G.combat=null;const o={};G.inv["Еда в дорогу"]=2;
  let q=null;for(let i=0;i<40;i++){const t=__дело("попутчик");if(Живые.h(t.id,"поп")%2){q=t;break;}G.quests.pop();}
  q.поворотШаг=1;q.шагов=0;Живые.шаг();o.окно=__событие();__выбрать(/^Поделиться/);o.еда=G.inv["Еда в дорогу"];o.кто=q.попутчик;
  const g0=G.gold;completeQuest(q.id);await new Promise(r=>setTimeout(r,2200));o.золото=G.gold-g0;o.сказано=__said.slice(-3).join(" | ");return o;});
 check('6. попутчик: «Поделиться едой» — еда убывает; при сдаче добро возвращается кошелём',
  пп.окно&&пп.окно.заголовок==="Попутчик"&&пп.еда===1&&пп.кто==="знатный"&&пп.золото>60&&/не забыл добра/.test(пп.сказано),пп);

 /* ── 7. соперник и продолжение ── */
 const сп=await page.evaluate(async()=>{__закрыть();const o={};const q=__дело("соперник");const g0=G.gold;completeQuest(q.id);o.заплачено=G.gold-g0;
  await new Promise(r=>setTimeout(r,1900));o.окно=__событие();const g1=G.gold;__выбрать(/^Поделить/);o.отдано=g1-G.gold;o.след=G.живые.следы[q.npcKey];
  const n=getNPCByKey(__дер.key);G.day+=1;const L=sideQuestsFor(n);o.первое=L[0]&&L[0].заглавие;o.всего=L.length;G.day-=1;return o;});
 check('7. соперник при сдаче: «Поделить» — уходит половина награды; назавтра у того же жителя «Месть соперника»',
  сп.окно&&сп.окно.заголовок==="Соперник"&&сп.окно.выбор.length===3&&Math.abs(сп.отдано-Math.round(сп.заплачено/2))<=1&&сп.след&&сп.первое==="Месть соперника",сп);

 /* ── 8. ложь ── */
 const лж=await page.evaluate(async()=>{__закрыть();delete G.живые.следы[__дер.key];const o={};const q=__дело("ложь");completeQuest(q.id);await new Promise(r=>setTimeout(r,1900));
  o.окно=__событие();const x0=G.xp;__выбрать(/^Рассказать старосте/);o.опыт=G.xp-x0;const n=getNPCByKey(__дер.key);G.day+=1;o.первое=(sideQuestsFor(n)[0]||{}).заглавие;G.day-=1;return o;});
 check('8. ложь заказчика: «Правда о деле» — промолчать, доплата, старосте; рассказал старосте — опыт; назавтра «Правда о деле»',
  лж.окно&&лж.окно.заголовок==="Правда о деле"&&лж.окно.выбор.length===3&&лж.опыт>0&&лж.первое==="Правда о деле",лж);

 /* ── 9. ларец, проклятие, выбор награды ── */
 const пр=await page.evaluate(async()=>{__закрыть();const o={};
  const q1=__дело("ключ");completeQuest(q1.id);await new Promise(r=>setTimeout(r,1900));o.ларец=__событие();__выбрать(/^Разгадать/);o.спор=__событие();
  const ans=Живые._спор&&Живые._спор.ans;
  const inv0=JSON.stringify(G.inv);const g0=G.gold;if(ans)__выбрать(new RegExp("^"+(ans[0].toUpperCase()+ans.slice(1)).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$"));o.ларецЗолото=G.gold-g0;o.ларецВещь=JSON.stringify(G.inv)!==inv0;
  __закрыть();const q2=__дело("проклятие");completeQuest(q2.id);await new Promise(r=>setTimeout(r,1900));o.проклятие=__событие();const g2=G.gold;__выбрать(/^Снять порчу/);o.порча=g2-G.gold;o.оберег=Number(G.inv["оберег"])||0;
  __закрыть();const q3=__дело("выбор");completeQuest(q3.id);await new Promise(r=>setTimeout(r,1900));o.выбор=__событие();const inv3=JSON.stringify(G.inv);__выбрать(/^Вещь/);o.вещь=JSON.stringify(G.inv)!==inv3;return o;});
 check('9. ларец с загадкой (разгадал — золото и вещь), проклятая находка (снять порчу — 15 золота и оберег), выбор награды (вещь)',
  пр.ларец&&пр.ларец.заголовок==="Запертый ларец"&&пр.спор&&пр.спор.заголовок==="Спор загадкой"&&пр.ларецЗолото>0&&пр.ларецВещь
  &&пр.проклятие&&пр.проклятие.заголовок==="Проклятая находка"&&пр.порча===15&&пр.оберег>=1&&пр.выбор&&пр.выбор.заголовок==="Чем взять награду"&&пр.вещь,пр);

 /* ── 10. гонец с шифром ── */
 const г=await page.evaluate(()=>{__закрыть();const n=getNPCByKey(__дер.key);let q=null;const d0=G.day;for(let d=1;d<=60&&!q;d++){G.day=d;q=sideQuestsFor(n).find(x=>x.вид==="гонец")||null;}
  if(!q)return {нет:true};const i=sideQuestsFor(n).findIndex(z=>z.id===q.id);npcQuestPick(n.key,"s"+i);__закрыть();const x=G.quests.find(z=>z.id===q.id);x.поворот=null;const o={до:qProgressText(x)};
  let z=null;for(let k=0;k<50&&!z;k++){const c=Свод.загадка("п",Свод.номерПо("п","шифр",k));if(!СводИгра.решена(c))z=c;}СводИгра.открыть(z,{вид:"место"});__решить(z);__закрыть();
  o.шифр=qProgressText(x);G.x=x.tx;G.y=x.ty;Живые.шаг();o.дошёл=x.doneFlag;G.x=__дер.x;G.y=__дер.y;const g0=G.gold;completeQuest(x.id);o.сдано=x.done;o.золото=G.gold-g0;return o;});
 check('10. гонец с шифром: «шифр ещё не разгадан» → разгадал — «несите письмо»; дошёл до поселения — выполнено и сдано',
  !г.нет&&/шифр ещё не разгадан/.test(г.до)&&/несите письмо/.test(г.шифр)&&г.дошёл&&г.сдано&&г.золото>0,г);

 /* ── 11. тайна поселения как задание ── */
 const т=await page.evaluate(async()=>{__закрыть();G.свод.тайны={};const n=getNPCByKey(__дер.key);let q=null;for(let d=1;d<=60&&!q;d++){G.day=d;q=sideQuestsFor(n).find(x=>x.вид==="тайна")||null;}
  if(!q)return {нет:true};const i=sideQuestsFor(n).findIndex(z=>z.id===q.id);npcQuestPick(n.key,"s"+i);__закрыть();const x=G.quests.find(z=>z.id===q.id);x.поворот=null;const o={до:qProgressText(x)};
  G.x=__дер.x;G.y=__дер.y;const м=СводИгра.место();const тн=СводИгра.тайна(м.поселение);const всего=СводИгра.шагиТайны(тн).length;
  for(let k=0;k<всего;k++){const шаг=СводИгра.шагиТайны(тн)[тн.шаг];CMD.rd("t:"+СводИгра.темаШага(шаг,м));CMD.rd("my");await new Promise(r=>setTimeout(r,120));__решить(СводИгра.z);}
  __закрыть();o.после=qProgressText(x);completeQuest(x.id);o.сдано=x.done;return o;});
 check('11. «Тайна поселения» как задание: шаги тайны считаются; распутал — «вернитесь к заказчику», сдано',!т.нет&&/шаг 1 из/.test(т.до)&&/распутана/.test(т.после)&&т.сдано,т);

 check('12. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
