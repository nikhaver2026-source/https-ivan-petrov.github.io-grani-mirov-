/* ════════════════════════════════════════════════════════════════════════
   НАБОР 323: СВОД ЗАГАДОК — МЕСТА, ТАЙНЫ ПОСЕЛЕНИЙ, ЛЕГЕНДЫ, ЯРУСЫ (15.5)

   Просьба игрока: загадок на поверхности — больше шести тысяч, в подземельях —
   больше двадцати пяти тысяч, а лучше всего больше сорока тысяч; простые,
   средние, сложные, уникальные, многоступенчатые; механики — из книг, игр и
   фильмов; загадки — в городах, деревнях и зданиях.
   1. Свод: поверхность ≥ 6000, подземелья ≥ 25 000, всего ≥ 40 000.
   2. Все загадки свода перебраны: ни одной пары одинаковых; у каждой загадки
      с выбором ответ есть среди вариантов, варианты не повторяются.
   3. В деревне: «Загадки места» в разделе «Квесты» меню действий и в окне постройки; окно —
      три загадки (простая, средняя, сложная), другие места деревни, тайна.
   4. Загадка с выбором: неверный ответ — попыток меньше; верный — золото,
      опыт, загадка разгадана и записана; подсказка уменьшает награду.
   5. Загадка на слух (звонница): «Прослушать» играет колокола по нотам,
      ввод верного напева решает её; обряд после первого шага — по памяти.
   6. Удары кузнеца: звучат удары и один глухой — на своём месте.
   7. Пошаговые: кувшины решаются ходами, переправа с ошибкой — «всё сначала»,
      монета — двумя взвешиваниями.
   8. Тайна поселения: шаги по разным местам, след ведёт дальше, в конце —
      награда и запись в журнале.
   9. Легенда у столицы: ошибка — всё с первой загадки; разгадана — дар.
   10. Ярус подземелья: в окне яруса — «Загадки яруса»; три загадки свода
       подземелий; все три — тайник и ресурс яруса.
   11. В городе на улице — площадные загадки.
   12. Счёт загадок сохраняется вместе с игрой.
   13. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];const rec=t=>{window.__said.push(String(t));return true;};Speech.say=rec;Speech.request=rec;
  window.__звуки=[];Bank.play=function(role){return true;};const зв0=СводИгра.звук.bind(СводИгра);СводИгра.звук=function(role,o){window.__звуки.push(role);return зв0(role,o);};
  window.maybeEvent=()=>{};window.meetCaravan=()=>false;safeFn(()=>{Actors.tick=()=>{};});
  window.__закрыть=()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();curEvent=null;};
  window.__окно=()=>{const m=document.getElementById("modal-zag");if(!m||m.hidden)return null;return {заголовок:document.getElementById("zagTitle").textContent,
   кнопки:[...document.querySelectorAll("#zagBody [data-cmd]")].map(b=>({cmd:b.dataset.cmd,t:b.textContent.trim()})),строки:[...document.querySelectorAll("#zagBody .list-line")].map(x=>x.textContent)};};
  /* решатель: как сыграл бы внимательный игрок */
  window.__решить=z=>{if(z.ui==="выбор")return CMD.rd("a:"+z.opts.indexOf(z.ans));
   if(z.ui==="ряд"){for(const k of z.ans)CMD.rd("i:"+k);return true;}
   const п=z.шаги;let ходы=[];
   if(п.вид==="кувшины")ходы=СводШаги.кувшины.решить(п.a,п.b,п.t);
   else if(п.вид==="переправа")ходы=["2","0","1","2","3","0","2"];
   else if(п.вид==="мост"){const t=п.t;ходы=2*t[1]<=t[0]+t[2]?["01","0","23","1","01"]:["03","0","02","0","01"];}
   else if(п.вид==="ханой"){const h=(n,a,b,c)=>{if(!n)return;h(n-1,a,c,b);ходы.push(`${a}${c}`);h(n-1,b,a,c);};h(п.n,п.с,[0,1,2].find(x=>x!==п.с&&x!==п.ц),п.ц);}
   else if(п.вид==="монета"){CMD.rd("s:"+encodeURIComponent("w1-3|4-6"));const и=СводИгра.сост[z.id].итоги[0];const куч=/равновесии/.test(и)?[7,8,9]:/левая/.test(и)?[1,2,3]:[4,5,6];
    CMD.rd("s:"+encodeURIComponent(`w${куч[0]}|${куч[1]}`));const и2=СводИгра.сост[z.id].итоги[1];const n=/равновесии/.test(и2)?куч[2]:/левая/.test(и2)?куч[0]:куч[1];return CMD.rd("s:n"+n);}
   for(const д of ходы)CMD.rd("s:"+encodeURIComponent(д));return true;};
  window.__найти=(тип,R)=>{for(let r=1;r<(R||400);r++)for(let dx=-r;dx<=r;dx++)for(const dy of [-r,r]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);if(c.structure&&c.structure.type===тип)return {x,y,n:c.structure.name};}return null;};});
 const W=ms=>page.waitForTimeout(ms);

 /* ── 1–2. свод: сколько и без повторов ── */
 const св=await page.evaluate(()=>{const o={п:Свод.размер("п"),д:Свод.размер("д"),всего:Свод.всего(),повторов:0,ошибок:[],ур:{1:0,2:0,3:0},механик:new Set()};const s=new Set();const t0=performance.now();
  for(const где of ["п","д"])for(let i=0;i<Свод.размер(где);i++){const z=Свод.загадка(где,i);const p=Свод.подпись(z);if(s.has(p))o.повторов++;else s.add(p);o.ур[z.ур]++;o.механик.add(z.мех);
   if(z.ui==="выбор"&&(!z.opts.includes(z.ans)||new Set(z.opts).size!==z.opts.length||z.opts.length<3))o.ошибок.push(z.id);
   if(z.ui==="ряд"&&!(Array.isArray(z.ans)&&z.ans.length&&z.ans.every(k=>z.sym[k])))o.ошибок.push(z.id);
   if(!z.q||/undefined|NaN|\[object/.test(z.q))o.ошибок.push(z.id+":текст");}
  o.механик=o.механик.size;o.мс=Math.round(performance.now()-t0);o.ошибок=o.ошибок.slice(0,5);return o;});
 check('1. свод: на поверхности больше 6000 загадок, в подземельях больше 25 000, всего больше 40 000',св.п>=6000&&св.д>=25000&&св.всего>=40000,св);
 check('2. все загадки свода разные; у загадок с выбором верный ответ среди трёх-четырёх разных вариантов; простые, средние и сложные, двадцать с лишним механик',
  св.повторов===0&&!св.ошибок.length&&св.ур[1]>1000&&св.ур[2]>1000&&св.ур[3]>1000&&св.механик>=20,св);

 /* ── 3. деревня: раздел «Квесты», окно постройки, окно загадок ── */
 const д=await page.evaluate(()=>{__закрыть();G.place=null;G.inCombat=false;G.свод={};const f=__найти("village");G.x=f.x;G.y=f.y;window.__дер=f;const o={деревня:f.n};
  o.вМеню=AM_GROUPS.find(g=>g[2]&&g[2].id==="quests")[1].some(x=>x[0]==="zagadki");o.большой=Math.max(...AM_GROUPS.map(g=>g[1].length));o.доступно=amAvailable("zagadki");
  openBuilding(cellContent(f.x,f.y));o.вОкнеПостройки=!!document.querySelector('#bldBody [data-cmd="zagadki"]');__закрыть();
  __said=[];CMD.zagadki();o.окно=__окно();o.сказано=__said.slice(-1)[0]||"";return o;});
 check('3. деревня: «Загадки места» в разделе «Квесты» меню действий и в окне постройки; окно — три загадки (простая, средняя, сложная), другие места деревни, тайна поселения',
  д.вМеню&&д.большой<=16&&д.доступно&&д.вОкнеПостройки&&д.окно&&/^Загадки: колодец/.test(д.окно.заголовок)&&д.окно.кнопки.filter(b=>/^rd:z:/.test(b.cmd)).length===3
  &&/^Простая/.test(д.окно.кнопки[0].t)&&/^Средняя/.test(д.окно.кнопки[1].t)&&/^Сложная/.test(д.окно.кнопки[2].t)
  &&д.окно.кнопки.some(b=>/^rd:t:трактир/.test(b.cmd))&&д.окно.кнопки.some(b=>/^rd:t:кузница/.test(b.cmd))&&д.окно.строки.concat(д.окно.кнопки.map(b=>b.t)).some(t=>/Тайна «/.test(t))
  &&/^Загадки: колодец\./.test(д.сказано),д);

 /* ── 4. выбор: неверно, верно, подсказка ── */
 const в=await page.evaluate(()=>{const o={};const z=СводИгра.список.find(z=>z.ui==="выбор");o.мех=z.мех;CMD.rd("z:"+СводИгра.список.indexOf(z));o.вопросСказан=__said.slice(-1)[0].includes(z.q.slice(0,30));
  const неверн=z.opts.findIndex(x=>x!==z.ans);CMD.rd("a:"+неверн);o.ош=G.свод.ош[z.id];o.послеОшибки=__said.slice(-1)[0];
  const g0=G.gold,x0=G.xp;CMD.rd("a:"+z.opts.indexOf(z.ans));o.золото=G.gold-g0;o.опыт=G.xp-x0;o.записана=!!G.свод.р[z.id];o.всего=G.свод.всего;o.итог=__said.slice(-1)[0];
  o.окноПосле=__окно().строки.join(" | ").slice(0,120);
  /* подсказка: другая загадка того же места */
  CMD.rd("back");const z2=СводИгра.список.find(q=>q.ui==="выбор"&&!СводИгра.решена(q));if(!z2)return o;CMD.rd("z:"+СводИгра.список.indexOf(z2));CMD.rd("h");o.подсказка=__окно().строки.some(t=>/^Подсказка 1:/.test(t));
  const баз={1:10,2:26,3:55}[z2.ур];const g1=G.gold;CMD.rd("a:"+z2.opts.indexOf(z2.ans));o.сПодсказкой=G.gold-g1;o.предел=Math.round(баз*0.75*1.16);return o;});
 check('4. загадка с выбором: условие звучит; неверный ответ — «попыток осталось 2»; верный — золото и опыт, загадка записана; с подсказкой награда меньше',
  в.вопросСказан&&в.ош&&в.ош.n===1&&/неверно.*Попыток сегодня осталось: 2/.test(в.послеОшибки)&&в.золото>0&&в.опыт>0&&в.записана&&в.всего===1&&/^.*Верно! Награда:/.test(в.итог)
  &&/уже разгадана/.test(в.окноПосле)&&в.подсказка&&в.сПодсказкой>0&&в.сПодсказкой<=в.предел,в);

 /* ── 5. звонница: колокола по нотам, ввод напева; обряд — по памяти ── */
 const з=await page.evaluate(async()=>{const o={};let z=null;for(let k=0;k<400&&!z;k++){const c=Свод.загадка("п",Свод.номерПо("п","звон",k));if(c.ans.length>=4&&new Set(c.ans).size>=3)z=c;}
  СводИгра.открыть(z,{вид:"место"});o.кнопки=__окно().кнопки.map(b=>b.t);__звуки=[];CMD.rd("play");await new Promise(q=>setTimeout(q,900+z.ans.length*800+300));
  o.сыграно=__звуки.slice();o.надо=z.ans.map(a=>z.sym[a][1]);
  /* фокус остаётся на нажатой кнопке, имя загадки не повторяется */
  const кн=document.querySelector('#zagBody [data-cmd="rd:i:'+((z.ans[0]+1)%z.sym.length)+'"]');кн.focus();кн.click();
  o.фокус=document.activeElement&&document.activeElement.dataset.cmd===кн.dataset.cmd;o.отклик=__said.slice(-1)[0];
  for(let i=1;i<z.ans.length;i++)CMD.rd("i:"+z.ans[i]);o.ошибка=__said.slice(-1)[0];
  const g0=G.gold;for(const k of z.ans)CMD.rd("i:"+k);o.решена=СводИгра.решена(z);o.золото=G.gold-g0;
  let об=null;for(let k=0;k<200&&!об;k++){const c=Свод.загадка("п",Свод.номерПо("п","обр",k));if(c.ans.length>=4)об=c;}СводИгра.открыть(об,{вид:"место"});o.обрядДо=__окно().строки[0];CMD.rd("i:"+об.ans[0]);o.обрядПосле=__окно().строки[0];
  return o;});
 check('5. звонница: «Прослушать» играет колокола по нотам напева; нажатая кнопка держит фокус, звучит только «Колокол. 1 из N»; неверный напев — сброс ввода; верный — загадка решена и награда; обряд после первого шага — «по памяти»',
  з.кнопки.includes("Прослушать")&&JSON.stringify(з.сыграно)===JSON.stringify(з.надо)&&з.фокус&&/^[А-ЯЁ][а-яё ]+\. 1 из \d+\.$/.test(з.отклик||"")&&/Не тот порядок/.test(з.ошибка)&&з.решена&&з.золото>0
  &&/обряд/.test(з.обрядДо)&&/по памяти/.test(з.обрядПосле),з);

 /* ── 6. удары кузнеца ── */
 const у=await page.evaluate(async()=>{let z=null;for(let k=0;k<255&&!z;k++){const c=Свод.загадка("п",Свод.номерПо("п","удар",k));if(c.звук&&c.звук.глух)z=c;}
  СводИгра.открыть(z,{вид:"место"});__звуки=[];CMD.rd("play");await new Promise(q=>setTimeout(q,900+z.звук.n*950+300));
  return {n:z.звук.n,глух:z.звук.глух,звуки:__звуки.slice()};});
 check('6. удары кузнеца: звучит столько ударов по наковальне, сколько сказано, и один глухой — на своём месте',
  у.звуки.length===у.n&&у.звуки[у.глух-1]==="oc_wood_dull"&&у.звуки.filter(x=>x==="anvil").length===у.n-1,у);

 /* ── 7. пошаговые: кувшины, переправа с ошибкой, монета ── */
 const ш=await page.evaluate(()=>{const o={};const кув=Свод.загадка("п",Свод.номерПо("п","кув",3));СводИгра.открыть(кув,{вид:"место"});o.кувКнопки=__окно().кнопки.length;__решить(кув);o.кув=СводИгра.решена(кув);
  const пер=Свод.загадка("п",Свод.номерПо("п","пер",1));СводИгра.открыть(пер,{вид:"место"});CMD.rd("s:1");o.провал=__said.slice(-1)[0];o.сброс=JSON.stringify(СводИгра.сост[пер.id]);__решить(пер);o.пер=СводИгра.решена(пер);
  const мон=Свод.загадка("п",Свод.номерПо("п","мон",5));СводИгра.открыть(мон,{вид:"место"});__решить(мон);o.мон=СводИгра.решена(мон);o.взвешено=СводИгра.сост[мон.id].итоги;return o;});
 check('7. пошаговые: кувшины решаются переливаниями; в переправе ошибка — «съел… Всё сначала» и берега снова полные; монета — двумя взвешиваниями',
  ш.кув&&ш.кувКнопки>=8&&/Пока вы плыли, .* (съел|съела|задрал).*Всё сначала/.test(ш.провал)&&/"л":\[0,0,0\]/.test(ш.сброс)&&ш.пер&&ш.мон&&ш.взвешено.length===2,ш);

 /* ── 8. тайна поселения ── */
 const т=await page.evaluate(async()=>{__закрыть();G.x=__дер.x;G.y=__дер.y;const o={шаги:[]};const м=СводИгра.место();const тн=СводИгра.тайна(м.поселение);o.тайна=СВОД_ТАЙНЫ[тн.t].n;
  const всего=СводИгра.шагиТайны(тн).length;o.всего=всего;const g0=G.gold,ж0=G.journal.length;
  for(let i=0;i<всего;i++){const шаг=СводИгра.шагиТайны(тн)[тн.шаг];const где=СводИгра.темаШага(шаг,м);
   /* в другом месте след только назван */
   const чужое=м.темы.find(x=>x!==где);if(чужое&&i===0){CMD.rd("t:"+чужое);o.чужое=__окно().строки.find(t=>/Тайна «/.test(t))||"";}
   CMD.rd("t:"+где);const кн=__окно().кнопки.find(b=>b.cmd==="rd:my");if(!кн){o.нетКнопки=где;break;}CMD.rd("my");await new Promise(q=>setTimeout(q,120));
   const z=СводИгра.z;o.шаги.push(где+":"+z.мех);__решить(z);await new Promise(q=>setTimeout(q,30));}
  o.конец=!!G.свод.тайны[м.поселение].конец;o.золото=G.gold-g0;o.журнал=G.journal.slice(0,3).join(" | ").slice(0,200);o.итог=__окно()&&__окно().строки[0];return o;});
 check('8. тайна поселения: шаги в разных местах (в чужом месте след только назван), в конце — «Тайна … разгадана», награда и запись в журнале',
  т.шаги.length===т.всего&&т.всего>=3&&т.конец&&т.золото>=200&&/Тайна «.*» разгадана/.test(т.итог||"")&&/Тайна «.*» разгадана/.test(т.журнал)&&(!т.чужое||/Следующий след — /.test(т.чужое)),т);

 /* ── 9. легенда у столицы ── */
 const л=await page.evaluate(async()=>{__закрыть();const f=__найти("castle",600)||__найти("citadel",600);G.x=f.x;G.y=f.y;const o={где:f.n};CMD.zagadki();const кн=__окно().кнопки.find(b=>/^rd:leg:/.test(b.cmd));o.кнопка=кн&&кн.t;
  if(!кн)return o;CMD.rd(кн.cmd.slice(3));await new Promise(q=>setTimeout(q,120));const L=СводИгра.ctx.L;o.легенда=L.n;
  /* первая верно, вторая неверно — всё сначала */
  __решить(СводИгра.z);o.второй=СводИгра.z.n;const z2=СводИгра.z;CMD.rd("a:"+z2.opts.findIndex(x=>x!==z2.ans));o.сброс=СводИгра.z.n;o.словоСброса=__said.slice(-1)[0];
  const g0=G.gold;for(let i=0;i<L.z.length;i++)__решить(СводИгра.z);o.дар=Number(G.inv[L.дар])||0;o.золото=G.gold-g0;o.готово=!!G.свод.лег[L.id].готово;o.итог=__окно().строки[0];return o;});
 check('9. легенда у столицы: «Легенда: …»; ошибка — всё с первой загадки; разгадана — дар легенды, золото, запись',
  !!л.кнопка&&/2 из/.test(л.второй||"")&&/1 из/.test(л.сброс||"")&&/начинается заново/.test(л.словоСброса||"")&&л.дар===1&&л.золото>=300&&л.готово&&/разгадана/.test(л.итог||""),л);

 /* ── 10. ярус подземелья ── */
 const я=await page.evaluate(async()=>{__закрыть();G.place=null;let c=null;for(let r=1;r<200&&!c;r++)for(let dx=-r;dx<=r&&!c;dx++)for(const dy of [-r,r]){const cc=cellContent(G.x+dx,G.y+dy);
   if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"&&!airOnly(cc.structure.type)){c={x:G.x+dx,y:G.y+dy,cc};break;}}
  G.x=c.x;G.y=c.y;enterPlace(c.cc);__закрыть();if(!Deep.on())changeDepth(1,{bypass:true});__закрыть();G.inCombat=false;const o={on:Deep.on(),ярус:Deep.tierNo()};
  Deep.home();o.вОкнеЯруса=[...document.querySelectorAll("#dpBody [data-cmd]")].some(b=>b.dataset.cmd==="rd:deep");CMD.rd("deep");o.окно=__окно();
  const inv0=JSON.stringify(G.inv);const g0=G.gold;for(const z of СводИгра.список.slice()){СводИгра.открыть(z,{вид:"ярус",s:СводИгра.м.s,d:СводИгра.м.d});__решить(z);}
  o.решено=СводИгра.список.filter(z=>СводИгра.решена(z)).length;o.итог=__said.slice(-3).join(" | ");o.тайник=!!(G.свод.тайник&&G.свод.тайник[СводИгра.м.ключ]);o.золото=G.gold-g0;o.инвентарь=JSON.stringify(G.inv)!==inv0;return o;});
 check('10. ярус подземелья: в окне яруса — «Загадки яруса»; три загадки свода подземелий; все три разгаданы — тайник, золото и ресурс яруса',
  я.on&&я.вОкнеЯруса&&я.окно&&/^Загадки яруса/.test(я.окно.заголовок)&&я.решено===3&&я.тайник&&/открылся тайник/.test(я.итог)&&я.золото>0&&я.инвентарь,я);

 /* ── 11. город: на улице — площадные загадки ── */
 const г=await page.evaluate(()=>{__закрыть();safeFn(()=>leavePlace());G.place=null;const c=NAMED_CITIES[0];G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));__закрыть();G.inCombat=false;
  const м=СводИгра.место();CMD.zagadki();return {место:м&&{темы:м.темы,город:м.город},окно:__окно()&&__окно().заголовок};});
 check('11. в городе на улице — «Загадки: площадь»',г.место&&г.место.город&&г.место.темы[0]==="площадь"&&/^Загадки: площадь/.test(г.окно||""),г);

 /* ── 12. сохранение ── */
 const с=await page.evaluate(()=>{const s=JSON.parse(serializeSave());return {всего:s.свод&&s.свод.всего,G:G.свод.всего,тайн:s.свод&&Object.keys(s.свод.тайны||{}).length,лег:s.свод&&Object.keys(s.свод.лег||{}).length};});
 check('12. счёт загадок, тайны и легенды сохраняются вместе с игрой',с.всего===с.G&&с.всего>=8&&с.тайн>=1&&с.лег>=1,с);

 check('13. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
