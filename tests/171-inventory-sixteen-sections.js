/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 171: КОТОМКА ИЗ ШЕСТНАДЦАТИ РАЗДЕЛОВ И ТРИНАДЦАТЬ МЕСТ НА ТЕЛЕ

   Раздел «Аксессуары» держал вперемешку плащи, кольца и амулеты, а мест на
   теле было три: шлем надевался вместо кольчуги, кольцо снимало плащ. Меню
   действий показывало и невозможное — «Недоступно сейчас» с причинами, —
   и незрячий игрок выслушивал список того, чего сделать нельзя. Теперь
   котомка разложена по шестнадцати разделам, у каждой вещи своё место на
   теле, надетое входит в удар, защиту и характеристики, а меню знает только
   возможное здесь и сейчас. Касания — настоящие события устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шестнадцать разделов по порядку, каждая вещь пёстрой котомки ложится
      ровно в свой, и в окне раздела только его вещи.
   2. Тринадцать мест: голова, уши, шея, плечи, торс, руки, запястье,
      пальцы обеих рук, пояс, ноги, оружие и щит; вещь знает своё место.
   3. Живые жесты: три пальца вниз — котомка; двойное касание по «Шлемам»;
      свайп вправо листает вещи; свайп вверх на вещи под фокусом — без
      двойного касания — открывает её действия, и в меню нет ни одного
      невозможного пункта.
   4. «Надеть» двойным касанием: шлем на голове, пометка «надето, на
      голове», фокус остался на шлеме, игра назвала место и прибавку.
   5. Меню по месту и состоянию: «Починить» — только у наковальни и при
      руде; вдали от станка его нет. Разделить — только стопку.
   6. Два кольца: оба пальца заняты — два пункта, каждый называет кольцо,
      которое снимется.
   7. Бой: доспех, шлем и сапоги не надевают и не снимают, кольцо — можно,
      оружие меняют, книгу не читают, зелье пьют.
   8. Надетое работает: защита и удар растут, серьги дают чутьё, пояс —
      ношу, сапоги — скорость, шлем — здоровье, железный доспех глушит
      скрытность, изношенная вещь даёт вполсилы.
   9. Щит принимает удар на себя: слышно щит, игра говорит «Щит принял
      удар», и урон вдвое меньше.
  10. Сапоги слышно в шаге: кованые — звон, кожаные — мягко.
  11. Вечный холод без плаща тратит воду, с плащом — нет.
  12. Сохранение: надетое переживает выход из котомки и перезагрузку;
      старое сохранение с местом «acc» и шлемом вместо доспеха разбирается
      само — ничего не потеряно и не удвоено.
  13. После «Снять» фокус стоит на той же вещи; после «Выбросить» — на её
      месте в списке.
  14. Перчатки, сапоги, браслеты и серьги выпадают в добыче; перчатки и
      сапоги шьют в кожевенной яме, и сшитое ложится в свой раздел.
  15. Карточка героя называет надетое; самопроверка держит строку inv16;
      глава 94 в первой части; README и docs описывают котомку.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(2600);
 await page.evaluate(()=>{window.СКАЗАНО=[];const о=Speech.say.bind(Speech);
  Speech.say=function(t,x){window.СКАЗАНО.push(String(t));return о(t,x);};
  window.ЗВУЧАЛО=[];const б=Bank.play.bind(Bank);Bank.play=function(r,o){window.ЗВУЧАЛО.push(String(r));return б(r,o);};});

 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',
  {type,touchPoints:type==='touchEnd'?[]:[{x:Math.round(x),y:Math.round(y),id:1}]});
 const tap=async(x,y)=>{await touch('touchStart',x,y);await page.waitForTimeout(50);await touch('touchEnd',x,y);};
 const dbl=async(x,y)=>{await tap(x,y);await page.waitForTimeout(110);await tap(x,y);await page.waitForTimeout(300);};
 const свайп=async(dx,dy)=>{const x=195,y=420;
  await touch('touchStart',x,y);
  for(let i=1;i<=5;i++){await page.waitForTimeout(18);await touch('touchMove',x+dx*i/5,y+dy*i/5);}
  await page.waitForTimeout(18);await touch('touchEnd',x+dx,y+dy);await page.waitForTimeout(260);};
 const пальцами=async(n,dx,dy)=>{
  const pts=[];for(let i=0;i<n;i++)pts.push({x:110+i*50,y:430});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});
  for(let k=1;k<=6;k++){await page.waitForTimeout(18);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/6,y:p.y+dy*k/6,id:i}))});}
  await page.waitForTimeout(18);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);};
 const закрытьВсё=()=>page.evaluate(()=>{for(let i=0;i<30&&activeLayer();i++)closeTopUI();});
 const пусто=id=>page.evaluate(id=>{
  const h=document.querySelector('#'+id+' header h2');const r=h.getBoundingClientRect();
  return {x:r.left+8,y:r.top+r.height/2};},id);
 const курсор=()=>page.evaluate(()=>uiCursor&&uiCursor.dataset&&uiCursor.dataset.cmd);
 const долистать=async(pred,max=40)=>{
  for(let i=0;i<max;i++){const c=await курсор();if(c&&pred(c))return true;await свайп(200,0);}
  return false;};

 /* Пёстрая котомка: по вещи на каждый раздел и место. */
 await page.evaluate(()=>{
  G.place=null;G.inCombat=false;G.combat=null;
  const w=G.equip.weapon;G.equip={weapon:w};
  G.gear=G.gear.filter(g=>g&&w&&g.id===w.id);
  const g=(id,name,type,slot,val,extra)=>Object.assign({id:"t171_"+id,name,type,slot,rank:1,qual:1,val,price:40},extra||{});
  G.gear.push(
   g("axe","Простой стальной кинжал","Кинжал","weapon",7),
   g("shield","Простой стальной щит","Щит","armor",6),
   g("mail","Простая железная кольчуга","Кольчуга","armor",10),
   g("cloak","Простой кожаный плащ","Плащ","acc",4),
   g("belt","Простой кожаный пояс","Пояс","acc",3),
   g("helm","Простой стальной шлем","Шлем","armor",6,{сост:50}),
   g("gloves","Простые кожаные перчатки","Перчатки","armor",3),
   g("boots","Простые железные сапоги","Сапоги","armor",4),
   g("ring1","Простое серебряное кольцо","Кольцо","acc",5),
   g("ring2","Грубое железное кольцо","Кольцо","acc",3,{rank:0,qual:0}),
   g("ring3","Отличное лунное кольцо","Кольцо","acc",20,{rank:3,qual:3}),
   g("brace","Простой серебряный браслет","Браслет","acc",4),
   g("amul","Простой серебряный амулет","Амулет","acc",4),
   g("ears","Простые серебряные серьги","Серьги","acc",4),
   g("uniq","Ведро бездонного колодца","Амулет","acc",22,{единственная:"u_well",rank:5,qual:5}));
  G.inv={"руда":3,"рановник":2,"слиток":1,"салака":2};
  G.items=["Факел","Свиток: Искра","Стрелы","Реликвия: Аурис Зарний","Трактат «О мере»","Клановая гривна"];
  G.tomes={"Трактат «О мере»":{n:"Трактат «О мере»",строка:"Трактат «О мере»: редкий трактат.",дар:"lore",редкость:1,цена:30}};
  G.potions=[{id:"heal",q:1,стаб:0.9,день:G.day,срок:10}];
  G.artifacts=[];const a=ART.make({дом:"run",ранг:2,кач:3,seed:7,имя:"Проверочный оберег",откуда:"из проверки"});G.artifacts.push(a);
  G.charged=[{вид:"wand",грим:5,заряд:5,макс:5}];G.comps={};
  G.quests=[];G.water=150;
 });

 /* ── 1. шестнадцать разделов ── */
 const разделы=await page.evaluate(()=>{
  const rows=invAll();const где=n=>(rows.find(x=>x.name===n)||{}).раздел;
  const m={кинжал:где("Простой стальной кинжал"),щит:где("Простой стальной щит"),кольчуга:где("Простая железная кольчуга"),
   плащ:где("Простой кожаный плащ"),пояс:где("Простой кожаный пояс"),шлем:где("Простой стальной шлем"),перчатки:где("Простые кожаные перчатки"),
   сапоги:где("Простые железные сапоги"),кольцо:где("Простое серебряное кольцо"),браслет:где("Простой серебряный браслет"),
   амулет:где("Простой серебряный амулет"),серьги:где("Простые серебряные серьги"),ведро:где("Ведро бездонного колодца"),
   оберег:где("Проверочный оберег"),жезл:(rows.find(x=>x.kind==="charged")||{}).раздел,свиток:где("Свиток: Искра"),стрелы:где("Стрелы"),
   салака:где("салака"),зелье:(rows.find(x=>x.kind==="potion")||{}).раздел,рановник:где("рановник"),руда:где("руда"),слиток:где("слиток"),
   факел:где("Факел"),реликвия:где("Реликвия: Аурис Зарний"),книга:где("Трактат «О мере»"),гривна:где("Клановая гривна")};
  CMD.inv();
  const box=document.getElementById("invSections");
  const пункты=[...box.querySelectorAll("[data-punkt]")].map(b=>b.dataset.punkt);
  /* каждое окно раздела: только свои вещи, и всех вместе — столько же, сколько строк */
  const чужих=[],всего={n:0};
  INV_SECTIONS.forEach(c=>{invOpenCat(c.id);
   [...box.querySelectorAll('[data-cmd^="invpick:"]')].forEach(b=>{всего.n++;
    const [,k,key]=b.dataset.cmd.split(":");const r=invRow(k,decodeURIComponent(key));if(!r||r.раздел!==c.id)чужих.push(c.id+":"+(r&&r.name));});});
  closeTopUI();
  return {m,пункты,порядок:INV_SECTIONS.map(c=>c.id),имена:INV_SECTIONS.map(c=>c.n),чужих,всего:всего.n,строк:rows.length,
   однажды:rows.every(r=>INV_SECTION_BY_ID[r.раздел])};});
 const ждём={кинжал:"weapon",щит:"armor",кольчуга:"armor",плащ:"armor",пояс:"armor",шлем:"helm",перчатки:"gloves",сапоги:"boots",
  кольцо:"ring",браслет:"bracelet",амулет:"amulet",серьги:"amulet",ведро:"artifact",оберег:"artifact",жезл:"artifact",свиток:"consumable",
  стрелы:"consumable",салака:"consumable",зелье:"potion",рановник:"res",руда:"res",слиток:"material",факел:"tool",реликвия:"quest",книга:"other",гривна:"amulet"};
 const мимо=Object.keys(ждём).filter(k=>разделы.m[k]!==ждём[k]).map(k=>k+"→"+разделы.m[k]);
 check('1. шестнадцать разделов по порядку; каждая вещь ложится ровно в свой, и в окне раздела только его вещи',
  разделы.порядок.join(",")==="weapon,armor,helm,gloves,boots,ring,bracelet,amulet,artifact,consumable,potion,res,material,tool,quest,other"
  &&разделы.имена.join(",")==="Оружие,Броня,Шлемы,Перчатки,Обувь,Кольца,Браслеты,Амулеты,Артефакты,Расходники,Зелья,Ресурсы,Материалы,Инструменты,Квестовые предметы,Прочее"
  &&разделы.пункты.join(",")===разделы.порядок.join(",")&&мимо.length===0&&разделы.чужих.length===0
  &&разделы.всего===разделы.строк&&разделы.однажды,{мимо,чужих:разделы.чужих,всего:разделы.всего,строк:разделы.строк});

 /* ── 2. тринадцать мест ── */
 const места=await page.evaluate(()=>{
  const м=n=>equipPlaceOf(G.gear.find(x=>x.name===n));
  return {ids:EQUIP_PLACES.map(p=>p.id),имена:EQUIP_PLACES.map(p=>p.n),
   щит:м("Простой стальной щит"),кольчуга:м("Простая железная кольчуга"),плащ:м("Простой кожаный плащ"),пояс:м("Простой кожаный пояс"),
   шлем:м("Простой стальной шлем"),перчатки:м("Простые кожаные перчатки"),сапоги:м("Простые железные сапоги"),кольцо:м("Простое серебряное кольцо"),
   браслет:м("Простой серебряный браслет"),амулет:м("Простой серебряный амулет"),серьги:м("Простые серебряные серьги"),кинжал:м("Простой стальной кинжал")};});
 check('2. тринадцать мест на теле — голова, уши, шея, плечи, торс, руки, запястье, пальцы обеих рук, пояс, ноги, оружие и щит; вещь знает своё',
  места.ids.length===13&&["Голова","Уши","Шея","Плечи","Торс","Руки","Запястье","Пальцы левой руки","Пальцы правой руки","Пояс","Ноги"].every(n=>места.имена.includes(n))
  &&места.щит==="shield"&&места.кольчуга==="armor"&&места.плащ==="cloak"&&места.пояс==="belt"&&места.шлем==="helm"&&места.перчатки==="gloves"
  &&места.сапоги==="boots"&&места.кольцо==="ring"&&места.браслет==="bracelet"&&места.амулет==="amulet"&&места.серьги==="ears"&&места.кинжал==="weapon",места);

 /* ── 3. живые жесты ── */
 await закрытьВсё();
 await пальцами(3,0,170);
 const открыто=await page.evaluate(()=>!document.getElementById("modal-inventory").hidden&&!INV.cat);
 await page.evaluate(()=>{resetCursor();});
 const доШлемов=await долистать(c=>c==="invcat:helm");
 {const п=await пусто("modal-inventory");await dbl(п.x,п.y);}
 const вШлемах=await page.evaluate(()=>({раздел:INV.cat,курсор:uiCursor&&uiCursor.dataset.cmd,выбрано:INV.sel}));
 /* свайп вправо — к следующей вещи: в шлемах одна вещь, дальше «назад» */
 await свайп(200,0);
 const послеСвайпа=await курсор();
 await свайп(-200,0);
 const вернулись=await курсор();
 await page.evaluate(()=>{СКАЗАНО.length=0;});
 await свайп(0,-170);
 const меню=await page.evaluate(()=>{
  const m=document.getElementById("modal-invact");
  const кнопки=[...m.querySelectorAll('[data-cmd^="invdo:"]')].map(b=>b.dataset.cmd.split(":")[1]);
  const row=INV.sel&&invRow(INV.sel.kind,INV.sel.key);
  return {открыто:!m.hidden,кнопки,почему:m.querySelectorAll('[data-cmd^="invwhy:"]').length,
   надпись:/Недоступно/.test(m.textContent),вещь:row&&row.name,ok:row?invActionsAll(row).ok.map(a=>a.id):[],
   сказано:СКАЗАНО.slice(-1)[0]||""};});
 check('3. три пальца вниз — котомка; двойное касание по «Шлемам»; свайп листает вещи; свайп вверх на вещи под фокусом открывает её действия, и в меню нет невозможного',
  открыто&&доШлемов&&вШлемах.раздел==="helm"&&/^invpick:gear:/.test(вШлемах.курсор||"")&&вШлемах.выбрано===null
  &&послеСвайпа==="invcats"&&вернулись===вШлемах.курсор
  &&меню.открыто&&меню.вещь==="Простой стальной шлем"&&меню.кнопки.join()===меню.ok.join()&&меню.почему===0&&!меню.надпись
  &&меню.кнопки.includes("wear")&&!меню.кнопки.includes("unequip")&&!меню.кнопки.includes("repair")&&/^Простой стальной шлем:/.test(меню.сказано),
  {вШлемах,послеСвайпа,вернулись,меню});

 /* ── 4. «Надеть» двойным касанием ── */
 await page.evaluate(()=>{resetCursor();СКАЗАНО.length=0;});
 const доНадеть=await долистать(c=>/^invdo:wear:/.test(c),12);
 {const п=await пусто("modal-invact");await dbl(п.x,п.y);}
 await page.waitForTimeout(250);
 const надето=await page.evaluate(()=>{
  const h=G.equip.helm;const c=uiCursor&&uiCursor.dataset.cmd;
  return {шлем:h&&h.name,вСуме:G.gear.some(x=>x.id==="t171_helm"),курсор:c,
   надпись:(uiCursor&&uiCursor.dataset.speak)||"",окно:!document.getElementById("modal-invact").hidden,
   сказано:СКАЗАНО.filter(t=>/Надето на голове/.test(t)).join(" ")};});
 check('4. «Надеть» двойным касанием: шлем на голове и не лежит в суме, фокус на нём же с пометкой «надето, на голове», игра назвала место и прибавку',
  доНадеть&&надето.шлем==="Простой стальной шлем"&&!надето.вСуме&&надето.курсор==="invpick:equip:helm"&&/надето, на голове/.test(надето.надпись)
  &&!надето.окно&&/Надето на голове: Простой стальной шлем\. Даёт: защита \+\d+, здоровье \+\d+/.test(надето.сказано),надето);

 /* ── 5. меню по месту и состоянию ── */
 const место=await page.evaluate(()=>{
  const было=window.invContext;const r={};
  const ids=row=>invActionsAll(row).ok.map(a=>a.id);
  r.вдали=ids(invRow("equip","helm"));
  window.invContext=()=>Object.assign(было(),{станки:new Set(["anvil"])});
  r.уНаковальни=ids(invRow("equip","helm"));
  const руда=G.inv["руда"];delete G.inv["руда"];r.безРуды=ids(invRow("equip","helm"));G.inv["руда"]=руда;
  window.invContext=было;
  r.стопка=ids(invRow("res","руда"));r.одна=ids(invRow("res","слиток"));
  r.нетТорговца=ids(invRow("res","руда")).includes("sell");
  return r;});
 check('5. «Починить» — только у наковальни и при руде, вдали его нет; разделить — только стопку; без торговца «Продать» нет',
  !место.вдали.includes("repair")&&место.уНаковальни.includes("repair")&&!место.безРуды.includes("repair")
  &&место.стопка.includes("split")&&!место.одна.includes("split")&&!место.нетТорговца,место);

 /* ── 6. два кольца ── */
 const кольца=await page.evaluate(()=>{
  const row=n=>invAll().find(x=>x.name===n);
  invDo("wear","gear",row("Простое серебряное кольцо").key);
  const свободно=invActionsAll(row("Грубое железное кольцо")).ok.map(a=>a.n);
  invDo("wear","gear",row("Грубое железное кольцо").key);
  const A=invActionsAll(row("Отличное лунное кольцо")).ok;
  return {левое:G.equip.ring&&G.equip.ring.name,правое:G.equip.ring2&&G.equip.ring2.name,свободно,
   пункты:A.map(a=>a.n),ids:A.map(a=>a.id)};});
 check('6. кольца на пальцах обеих рук; оба заняты — два пункта, и каждый называет кольцо, которое снимется',
  кольца.левое==="Простое серебряное кольцо"&&кольца.правое==="Грубое железное кольцо"&&кольца.свободно.some(n=>/Надеть$/.test(n))
  &&кольца.ids.includes("wear")&&кольца.ids.includes("wear2")
  &&кольца.пункты.some(n=>/Надеть на палец левой руки вместо: Простое серебряное кольцо/.test(n))
  &&кольца.пункты.some(n=>/Надеть на палец правой руки вместо: Грубое железное кольцо/.test(n)),кольца);

 /* ── 7. бой ── */
 const бой=await page.evaluate(()=>{
  const row=n=>invAll().find(x=>x.name===n);
  const ids=r=>invActionsAll(r).ok.map(a=>a.id);
  G.inCombat=true;
  const r={шлем:ids(invRow("equip","helm")),сапоги:ids(row("Простые железные сапоги")),кольцо:ids(invRow("equip","ring")),
   кинжал:ids(row("Простой стальной кинжал")),книга:ids(row("Трактат «О мере»")),зелье:ids(invAll().find(x=>x.kind==="potion")),
   амулет:ids(row("Простой серебряный амулет"))};
  G.inCombat=false;
  r.мирШлем=ids(invRow("equip","helm"));
  return r;});
 check('7. в бою доспех, шлем и сапоги не надевают и не снимают; кольцо и амулет — можно; оружие меняют; книгу не читают; зелье пьют',
  !бой.шлем.includes("unequip")&&!бой.сапоги.includes("wear")&&бой.кольцо.includes("unequip")&&бой.амулет.includes("wear")
  &&бой.кинжал.includes("equip")&&!бой.книга.includes("read")&&!бой.книга.includes("study")&&бой.зелье.includes("drink")
  &&бой.мирШлем.includes("unequip"),бой);

 /* ── 8. надетое работает ── */
 const статы=await page.evaluate(()=>{
  const row=n=>invAll().find(x=>x.name===n);
  const снимок=()=>({def:def(),atk:atk(),чутьё:ART.sum("чутьё"),ноша:Math.round(derived("carry")),скорость:ART.sum("скорость"),
   здоровье:ART.sum("здоровье"),скрытность:ART.sum("скрытность"),удача:ART.sum("удача")});
  const r={до:снимок()};
  invDo("wear","gear",row("Простые серебряные серьги").key);r.серьги=снимок();
  invDo("wear","gear",row("Простой кожаный пояс").key);r.пояс=снимок();
  invDo("wear","gear",row("Простые железные сапоги").key);r.сапоги=снимок();
  invDo("wear","gear",row("Простая железная кольчуга").key);r.кольчуга=снимок();
  const h=G.equip.helm;const сост=h.сост;h.сост=20;r.изношен=снимок();r.карточка=invBrief("equip","helm");h.сост=сост;
  return r;});
 check('8. надетое работает: защита и удар выросли, серьги дали чутьё, пояс — ношу, сапоги — скорость, шлем — здоровье, кольца — удачу, железо глушит скрытность, изношенное — вполсилы',
  статы.до.def>3&&статы.до.atk>15&&статы.до.здоровье>0&&статы.до.удача>0
  &&статы.серьги.чутьё>статы.до.чутьё&&статы.пояс.ноша>статы.серьги.ноша&&статы.сапоги.скорость>статы.пояс.скорость
  &&статы.кольчуга.def>статы.сапоги.def&&статы.кольчуга.скрытность<статы.сапоги.скрытность
  &&статы.изношен.def<статы.кольчуга.def&&статы.изношен.здоровье<статы.кольчуга.здоровье&&/вполсилы, вещь изношена/.test(статы.карточка),статы);

 /* ── 9. щит в бою ── */
 const щит=await page.evaluate(async()=>{
  const row=n=>invAll().find(x=>x.name===n);
  invDo("wear","gear",row("Простой стальной щит").key);
  const шанс=shieldBlockChance(G.equip.shield);
  G.hp=G.hpMax=500;
  startCombat({x:G.x,y:G.y,monster:{id:"wolf",n:"Волк",snd:"mgrowl",fx:"growl",lvl:2,hp:99999,dmg:40,xp:1,gold:0,biomes:["forest"]}},{dir:"N",close:true});
  /* Бой подвижный: тварь отвечает, только когда вплотную и наготове. */
  if(G.combat.arena){G.combat.arena.readyAt=0;G.combat.arena.wind=null;}
  const rnd=Math.random;Math.random=()=>0.01;
  СКАЗАНО.length=0;ЗВУЧАЛО.length=0;const hp0=G.hp;
  try{fight("atk");}catch(e){}
  await new Promise(r=>setTimeout(r,900));
  Math.random=rnd;
  const r={шанс,принял:СКАЗАНО.some(t=>/Щит принял удар/.test(t)),звук:ЗВУЧАЛО.filter(x=>/shield/.test(x)),урон:hp0-G.hp,бой:!!G.inCombat,
   карточка:invBrief("equip","shield")};
  safeFn(()=>endCombat());while(activeLayer())closeTopUI();
  return r;});
 check('9. щит принимает удар на себя: игра говорит «Щит принял удар», звучит сам щит, урон меньше полного; карточка называет долю',
  щит.шанс>=0.1&&щит.принял&&щит.звук.some(x=>/oc_shield_metal/.test(x))&&щит.урон>0&&щит.урон<40
  &&/принимает удар на себя в \d+ случаях из ста/.test(щит.карточка),щит);

 /* ── 10. сапоги в шаге ── */
 const шаг=await page.evaluate(()=>{
  const r={};G.place=null;
  r.железо=stepProfile("grass");
  const сап=G.equip.boots;G.equip.boots=Object.assign({},сап,{name:"Простые кожаные сапоги"});r.кожа=stepProfile("grass");
  G.equip.boots=null;r.босиком=stepProfile("grass");G.equip.boots=сап;
  const роли=p=>p.layers.map(l=>l[0]);
  return {железо:[r.железо.boots,роли(r.железо)],кожа:[r.кожа.boots,роли(r.кожа)],босиком:r.босиком.boots,
   громче:r.железо.gain>r.кожа.gain};});
 check('10. сапоги слышно в шаге: кованые звенят и громче, кожаные ступают мягко',
  шаг.железо[0]==="metal"&&шаг.железо[1].includes("hero_step_metal")&&шаг.кожа[0]==="leather"&&шаг.кожа[1].includes("hero_step_leather")
  &&шаг.босиком===null&&шаг.громче,шаг);

 /* ── 11. вечный холод ── */
 const холод=await page.evaluate(()=>{
  const было=Zones.here;Zones.here=()=>({id:"t171_cold",правило:"cold",n:"Проба холода",x:0,y:0});
  G.coldSaid=null;СКАЗАНО.length=0;
  const плащ=G.equip.cloak;G.equip.cloak=null;G.water=100;Zones.step();const без=G.water;
  const сказано=СКАЗАНО.some(t=>/без плаща/.test(t));
  const row=invAll().find(x=>x.name==="Простой кожаный плащ");invDo("wear","gear",row.key);
  G.water=100;Zones.step();const с=G.water;
  Zones.here=было;
  return {без,с,сказано,плащ:G.equip.cloak&&G.equip.cloak.name};});
 check('11. вечный холод без плаща тратит воду и говорит об этом; с плащом на плечах — нет',
  холод.без<100&&холод.с===100&&холод.сказано&&холод.плащ==="Простой кожаный плащ",холод);

 /* ── 12. сохранение ── */
 const доВыхода=await page.evaluate(()=>{
  CMD.inv();closeTopUI();   /* выход из котомки ничего не сбрасывает */
  saveGame(true);
  return Object.fromEntries(Object.entries(G.equip).filter(([,v])=>v).map(([k,v])=>[k,v.name]));});
 await page.reload();await page.waitForTimeout(900);
 const послеЗагрузки=await page.evaluate(()=>{try{loadGame();}catch(e){return {ошибка:String(e)};}
  return {надето:Object.fromEntries(Object.entries(G.equip).filter(([,v])=>v).map(([k,v])=>[k,v.name])),
   дубли:G.gear.filter(g=>Object.values(G.equip).some(e=>e&&e!==G.equip.weapon&&e.id&&e.id===g.id)).length};});
 const старое=await page.evaluate(()=>{
  const w=G.equip.weapon;
  G.equip={weapon:w,armor:{id:"old_h",name:"Кожаный шлем",type:"Шлем",slot:"armor",val:2},acc:{id:"old_c",name:"Простое стальное кольцо",type:"Кольцо",slot:"acc",val:3}};
  G.gear=G.gear.filter(g=>g&&g.id!=="old_h"&&g.id!=="old_c");
  normalizeWeaponState();
  return {места:Object.fromEntries(Object.entries(G.equip).map(([k,v])=>[k,v&&v.name])),acc:"acc" in G.equip,
   вСуме:G.gear.filter(g=>g.id==="old_h"||g.id==="old_c").length};});
 check('12. надетое переживает выход из котомки и перезагрузку; старое сохранение разбирается само — шлем на голову, кольцо на палец, ничего не удвоено',
  JSON.stringify(послеЗагрузки.надето)===JSON.stringify(доВыхода)&&Object.keys(доВыхода).length>=9&&послеЗагрузки.дубли===0
  &&старое.места.helm==="Кожаный шлем"&&старое.места.ring==="Простое стальное кольцо"&&!старое.места.armor&&!старое.acc&&старое.вСуме===0,
  {доВыхода,послеЗагрузки,старое});

 /* ── 13. фокус после действия ── */
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(600);
 const фокус=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const разбор=cmd=>{const [,k,key]=String(cmd||"").split(":");return invRow(k,decodeURIComponent(key||""));};
  const шлем=G.equip.helm&&G.equip.helm.name;
  CMD.inv();invOpenCat("helm");
  const helm=document.querySelector('#invSections [data-cmd="invpick:equip:helm"]');
  if(helm)setCursor(helm,false);
  invActions();invDo("unequip","equip","helm");
  const послеСнять=uiCursor&&uiCursor.dataset.cmd;const r0=разбор(послеСнять);
  invOpenCat("ring");
  const все=[...document.querySelectorAll('#invSections [data-cmd^="invpick:"]')];
  const второй=все[1];setCursor(второй,false);const имяВторого=разбор(второй.dataset.cmd).name;
  invActions();const sel=INV.sel;const row=invRow(sel.kind,sel.key);
  invDo("dropyes",sel.kind,sel.key);
  const послеВыброса=uiCursor&&uiCursor.dataset.cmd;const всеПосле=[...document.querySelectorAll('#invSections [data-cmd^="invpick:"]')].map(b=>b.dataset.cmd);
  const r={шлем,послеСнять,имя:r0&&r0.name,вСуме:r0&&r0.kind,имяВторого,выброшено:row&&row.name,
   нет:!invAll().some(x=>x.it===(row&&row.it)),послеВыброса,место:всеПосле.indexOf(послеВыброса),было:все.length,осталось:всеПосле.length};
  while(activeLayer())closeTopUI();
  return r;});
 check('13. после «Снять» фокус на той же вещи, теперь в суме; после «Выбросить» — на её месте в списке',
  !!фокус.шлем&&фокус.имя===фокус.шлем&&фокус.вСуме==="gear"&&/^invpick:gear:/.test(фокус.послеСнять||"")
  &&фокус.выброшено===фокус.имяВторого&&фокус.нет&&фокус.осталось===фокус.было-1&&фокус.место===Math.min(1,фокус.осталось-1),фокус);

 /* ── 14. добыча и ремесло ── */
 const добыча=await page.evaluate(()=>{
  const роды={};for(let i=0;i<3000;i++){const it=genLoot(100+i%61,300+Math.floor(i/61),i*11+5,12);роды[it.type]=(роды[it.type]||0)+1;}
  const глуб={};for(let i=0;i<300;i++){const it=deepLoot(40,i);глуб[it.type]=1;}
  const t=PROD_STEPS.find(x=>x.id==="pr_gloves"),s=PROD_STEPS.find(x=>x.id==="pr_boots");
  const было=G.gear.length;const it=prodGear(t);const it2=prodGear(s);
  const r={роды,глуб:Object.keys(глуб),перчатки:!!t&&t.станки.includes("tanpit")&&t.вещь.тип==="Перчатки",сапоги:!!s&&s.вещь.тип==="Сапоги",
   сшито:[it.name,invSectionOf({kind:"gear",it,name:it.name}),equipPlaceOf(it)],стачано:[it2.name,invSectionOf({kind:"gear",it:it2,name:it2.name}),equipPlaceOf(it2)],
   имя:itemName("Сапоги",2,1)};
  G.gear.splice(было,2);return r;});
 check('14. перчатки, сапоги, браслеты и серьги выпадают в добыче и в глубине; перчатки и сапоги шьют в кожевенной яме, и сшитое ложится в свой раздел',
  ["Перчатки","Сапоги","Браслет","Серьги"].every(t=>добыча.роды[t]>50)&&["Перчатки","Сапоги"].every(t=>добыча.глуб.includes(t))
  &&добыча.перчатки&&добыча.сапоги&&добыча.сшито[1]==="gloves"&&добыча.сшито[2]==="gloves"&&/перчатки$/.test(добыча.сшито[0])
  &&добыча.стачано[1]==="boots"&&добыча.стачано[2]==="boots"&&добыча.имя==="Добротные железные сапоги",добыча);

 /* ── 15. карточка героя, самопроверка, глава, README, docs ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();const r=rows.find(x=>x.id==="inv16");
  openModal("modal-character");safeFn(()=>renderCharacter());
  const герой=[...document.querySelectorAll("#modal-character [data-speak]")].map(x=>x.dataset.speak).find(t=>/^Надето \d+ из 13 мест/.test(t))||"";
  while(activeLayer())closeTopUI();
  return {есть:!!r,ok:r&&r.ok,плохие:rows.filter(x=>!x.ok).map(x=>x.id),герой,
   глава:GUIDE.some(g=>/Глава 94\. Инвентарь: шестнадцать разделов и тринадцать мест на теле/.test(g.title)&&g.body.length>=10),
   часть:guidePartOf(GUIDE_BY_NUM[94]),модуль:Inventory.sections.length===16&&Inventory.places.length===13&&typeof Inventory.text()==="string"};});
 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('15. карточка героя называет надетое; самопроверка держит строку inv16; глава 94 в первой части; модуль отвечает',
  свод.есть&&свод.ok&&/в руке — /.test(свод.герой)&&свод.глава&&свод.часть==="Часть I. Первые шаги"&&свод.модуль,свод);
 check('ни одна строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);
 check('README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают котомку из шестнадцати разделов (набор 171)',
  /Котомка из шестнадцати разделов/.test(readme)&&/## Котомка из шестнадцати разделов и тринадцать мест на теле \(набор 171\)/.test(вз)
  &&/EQUIP_PLACES/.test(вз)&&/invSectionOf/.test(вз),{readme:/Котомка из шестнадцати разделов/.test(readme),docs:/набор 171/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
