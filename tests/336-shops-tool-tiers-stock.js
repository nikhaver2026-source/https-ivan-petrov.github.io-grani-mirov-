/* ════════════════════════════════════════════════════════════════════════
   НАБОР 336: ЛАВКИ — ИНСТРУМЕНТ ТРЁХ СТУПЕНЕЙ, ЗАПАС НА ДЕНЬ, ЦЕНА ОТ СПРОСА, ТОРГОВЦЫ-ЗНАТОКИ (17.0)

   Просьба игрока: «Добавь торговцам различные товары, типа грабли, мотыги и прочее, прочее»; мастер-промпт:
   варианты инструмента, особые торговцы с ограниченным запасом и живой ценой.

   1. Инструмент трёх ступеней: у двенадцати орудий есть «добротной работы» и «мастерской работы»; скобяной ряд
      продаёт добротные, в городе бывают и мастерские; оба можно смастерить; лежат в «Инструментах».
   2. Лучший инструмент заменяет простой: работа по хозяйству с добротной мотыгой без простой — идёт; отношения
      больше (+2), часов меньше; на сборе дерева мастерский топор даёт две лишние вязанки.
   3. Запас на день: выкупили всё — «приходите завтра»; цена растёт с каждой купленной сегодня штукой; назавтра —
      снова полный запас и прежняя цена; в окне торговли — «осталось N».
   4. Торговцы-знатоки в городах: рудознатец, меховщик, аптекарь — со своим товаром; кто он — сказано в окне жителя.
   5. Ошибок страницы нет.
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
 /* ── 1–2. Ступени инструмента ── */
 const и=await page.evaluate(async()=>{const o={};const L=Лавка170;o.ступеней=L.ОРУДИЯ.filter(b=>TORG_TOOL_BY_NAME[L.имя(b,1)]&&TORG_TOOL_BY_NAME[L.имя(b,2)]).length;
  const инстр=Torg.toolsFor({x:41000,y:41000,prof:"Торговец",key:"t1"},{вид:{id:"instr"}}).map(id=>TORG_TOOLS[id]&&TORG_TOOLS[id].n);o.ряд=инстр.filter(n=>/добротной работы/.test(n)).length;
  let город=null;for(let i=0;i<6000&&!город;i++){const x=35000+i*31,y=45000+(i%17)*29;if(safeFn(()=>isCityAt(x,y),null))город={x,y};}
  let маст=0;if(город)for(let i=0;i<10;i++){маст+=Torg.toolsFor({x:город.x,y:город.y,prof:"Кузнец",key:"k"+i},{вид:{id:"instr"}}).filter(id=>/_t2$/.test(id)).length;}o.мастерских=маст;
  o.крафт=CRAFT_RECIPES.filter(r=>r.л170).length;
  G.items=(G.items||[]).filter(x=>!/^Мотыга/.test(x));const t=TORG_TOOL_BY_NAME["Мотыга (добротной работы)"];G.gold=1000;o.купил=Torg.buy("shop",null,{n:t.n,торг:t.id,price:t.цена},1);
  const rows=Inventory.rows();const r=rows.find(x=>x.name==="Мотыга (добротной работы)");o.раздел=r?Inventory.section(r):"";o.есть=Torg.has("Мотыга");o.ступень=L.ступень("Мотыга");
  /* хозяйство с добротной мотыгой */
  let V=null;for(let i=0;i<4000&&!V;i++){const x=39000+i*7,y=40500+(i%13)*11;if(settlementSeed(x,y)==="village"){const c=cellContent(x,y);if(c&&c.structure&&c.structure.type==="village")V={x,y,c};}}
  G.place=null;G.x=V.x;G.y=V.y;const имя=Хозяйство170.имяДеревни(V.c);G.standing["vill:"+имя]=0;G.standing["city:"+имя]=0;Хозяйство170.ст();for(const k in G.хоз170)delete G.хоз170[k];Слава170.ст().день={};
  const ч0=G.hour,д0=G.day;const s0=__said.length;o.работа=Хозяйство170.сделать("ogorod");o.прирост=Хозяйство170.отношение(имя);o.речь=__said.slice(s0).find(t=>/гряд/.test(t))||"";o.часов=((G.day-д0)*24+(G.hour-ч0));
  /* сбор: мастерский топор */
  G.items=(G.items||[]).filter(x=>!/^Топор лесоруба/.test(x));G.items.push("Топор лесоруба (мастерской работы)");const g=ToolKit.gather("дерево");o.сбор=g;
  return o;});
 check('1. двенадцать орудий в трёх ступенях; скобяной ряд — добротные, в городе бывают мастерские; крафт обеих ступеней; добротная мотыга — в «Инструментах»',
  и.ступеней===12&&и.ряд>=6&&и.мастерских>=1&&и.крафт===24&&и.купил&&и.раздел==="tool"&&и.есть&&и.ступень===1,и);
 check('2. добротная мотыга заменяет простую: работа идёт, отношения +9 (7+2), часов меньше трёх; мастерский топор — лишние вязанки',
  и.работа===true&&и.прирост===9&&и.часов<3&&/добротной работы/.test(и.речь||"")&&и.сбор&&и.сбор.n===3,и);

 /* ── 3. Запас на день и цена от спроса ── */
 const з=await page.evaluate(async()=>{const o={};const L=Лавка170;let n=null,idx=-1;
  for(let i=0;i<40&&idx<0;i++){const k=getNPC(41000+i*97,42000+i*13,0,"Кузнец");const st=stockFor(k);const j=st.findIndex(s=>s.res&&s.n==="древесный уголь");if(j>=0){n=k;idx=j;}}
  if(!n)return {нет:true};G.gold=100000;G.cargo=null;const st0=stockFor(n);o.лимит=st0[idx].остаток;o.цена0=st0[idx].price;
  const до=Number(G.inv["древесный уголь"])||0;for(let k=0;k<o.лимит;k++)buyItem(n.key,idx);o.купил=(Number(G.inv["древесный уголь"])||0)-до;
  const st1=stockFor(n);o.цена1=st1[idx].price;o.остаток=st1[idx].остаток;buyItem(n.key,idx);o.лишний=(Number(G.inv["древесный уголь"])||0)-до;o.речь=__said.slice(-1)[0];
  SHOP.key=n.key;SHOP.tab="buy";const ri=shopStockRows(n).findIndex(r=>r.i===idx);SHOP.sel={idx:ri,tab:"buy"};openModal("modal-shop");renderShop();await __w(50);
  const b=document.querySelector('#shopBody [data-cmd="shopitem:'+ri+'"]');o.кнопка=b?(b.dataset.shopextra+" | "+(b.dataset.speak||"")+" | max "+b.dataset.shopmax):"";
  /* покупка счётом — тоже из запаса */
  G.day=(Number(G.day)||1)+1;const до2=Number(G.inv["древесный уголь"])||0;SHOP.confirm={tab:"buy",count:o.лимит+5};shopYes();await __w(50);o.счётом=(Number(G.inv["древесный уголь"])||0)-до2;
  SHOP.confirm={tab:"buy",count:3};shopYes();await __w(50);o.счётомЕщё=(Number(G.inv["древесный уголь"])||0)-до2;__закрыть();
  G.day=(Number(G.day)||1)+1;const st2=stockFor(n);o.назавтра={остаток:st2[idx].остаток,цена:st2[idx].price};return o;});
 check('3. запас на день: выкуплено всё — «приходите завтра», цена росла с каждой штукой; в окне — «весь запас выкуплен»; покупка счётом — не больше остатка; назавтра — снова запас и цена без наценки',
  !з.нет&&з.лимит>=6&&з.купил===з.лимит&&з.лишний===з.лимит&&/Приходите завтра/.test(з.речь||"")&&з.цена1>з.цена0&&з.остаток===0&&/выкуплен/.test(з.кнопка||"")&&з.счётом>0&&з.счётом<=з.лимит+1&&з.счётомЕщё===з.счётом&&з.назавтра.остаток>=6&&з.назавтра.цена<з.цена1,з);

 /* ── 4. Знатоки ── */
 const к=await page.evaluate(async()=>{const o={};const L=Лавка170;let город=null;for(let i=0;i<6000&&!город;i++){const x=35000+i*31,y=45000+(i%17)*29;if(safeFn(()=>isCityAt(x,y),null))город={x,y};}
  const виды={};let пример=null;for(let i=0;i<60;i++){const n=getNPC(город.x,город.y,i,"Торговец");const з=L.знаток(n);if(!з)continue;виды[з]=(виды[з]||0)+1;
   if(!пример){пример={n,з};}}
  o.виды=виды;if(пример){const st=stockFor(пример.n);o.товар=st.filter(s=>s.знаток===пример.з).map(s=>s.n);G.x=пример.n.x;G.y=пример.n.y;openNPC(пример.n.key,true);const l=document.querySelector("#npcBody .lavka170");o.строка=l?l.textContent:"";__закрыть();}
  o.деревня=L.знаток({prof:"Торговец",x:40000,y:41000,key:"x"});return o;});
 check('4. знатоки в городе: рудознатец, меховщик, аптекарь — со своим товаром; в окне жителя сказано, кто он',
  Object.keys(к.виды).length>=2&&к.товар&&к.товар.length>=5&&/рудознатец|меховщик|аптекарь/.test(к.строка||""),к);
 check('5. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);})();
