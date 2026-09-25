/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 160: РАЗДЕЛЫ ДЛИННЫХ ОКОН

   Три окна игры нельзя пробежать глазами: меню действий (130 пунктов),
   настройки (шесть десятков управляющих элементов) и руководство (90 глав).
   Заголовки разделов в них были помечены «не читать», и незрячий игрок
   свайпал сквозь них, как сквозь сплошной список.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Меню действий разбито на шестнадцать разделов, и все пункты целы.
   2. Ни один раздел не длиннее шестнадцати пунктов, и самое нужное первым.
   3. С набора 172 меню двухуровневое, как настройки: список разделов,
      раздел открывает свои пункты, назад — на тот же раздел.
   9. Пустой раздел не показывается.
   9. Настройки разбиты на двенадцать разделов внутри семи пунктов, и ни
      одна не пропала.
  10. В пункте настроек есть кнопки оглавления и перескока.
  11. Руководство разбито на девять частей, и каждая глава ровно в одной.
  12. Порядок чтения идёт по частям, а не по месту в массиве.
  13. Глава находит свою часть по номеру из заголовка.
  14. Три действия о разделах есть среди назначаемых жестов, и они свободны.
  15. Самопроверка держит строку sections; модуль, глава 90, README, docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);
 await page.evaluate(()=>{
  window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1–8. Меню действий — пунктами (набор 172) ──
    Меню больше не лента с заголовками-перескоками, а два уровня, как
    настройки: список разделов, потом пункты одного раздела. */
 const меню=await page.evaluate(()=>({
  разделов:AM_GROUPS.length,
  имена:AM_GROUPS.map(g=>g[0]),
  уникИмён:new Set(AM_GROUPS.map(g=>g[0])).size,
  пунктов:AM_ITEMS.length,
  уникПунктов:new Set(AM_ITEMS.map(x=>x[0])).size,
  самыйБольшой:Math.max(...AM_GROUPS.map(g=>g[1].length)),
  пустые:AM_GROUPS.filter(g=>!g[1].length).map(g=>g[0]),
  безПодписи:AM_ITEMS.filter(x=>!(x[1]&&x[1].length>3)).map(x=>x[0]),
  первыеПодРукой:(AM_GROUP_BY_ID.here||[,[]])[1].map(x=>x[0])}));
 check('меню действий разбито на шестнадцать разделов с разными именами, и все сто тридцать пунктов целы',
  меню.разделов===16&&меню.уникИмён===16&&меню.пунктов===131&&меню.уникПунктов===131
  &&меню.пустые.length===0&&меню.безПодписи.length===0,меню);
 check('ни один раздел не длиннее шестнадцати пунктов, а «Здесь и сейчас» — то, что нужно на каждом шагу',
  меню.самыйБольшой<=16
  &&["look","objects","usehere","interact","gather","echo","map","hud"]
    .every(id=>меню.первыеПодРукой.includes(id)),меню);
 const уровни=await page.evaluate(()=>{
  openActionMenu();
  const lay=document.getElementById("actionMenu");
  const видно=()=>visibleInteractive(lay).map(x=>x.dataset.cmd);
  const r={первый:видно(),заголовков:lay.querySelectorAll("."+SEC_CLASS).length};
  CMD.amgroup("here");r.раздел=видно();r.курсор=uiCursor&&uiCursor.dataset.cmd;r.своих=AM_GROUP_BY_ID.here[1].map(x=>"am:"+x[0]);
  closeTopUI();r.назад={открыто:!lay.hidden,курсор:uiCursor&&uiCursor.dataset.cmd};
  closeTopUI();r.закрыто=lay.hidden;
  return r;});
 check('первый уровень — только разделы, «Что нового» и «Закрыть», без заголовков-перескоков; раздел открывает только свои пункты; назад — на тот же раздел',
  уровни.первый.every(c=>/^amgroup:/.test(c)||c==="am:whatsnew"||c==="am:close")&&уровни.первый.slice(-2).join()==="am:whatsnew,am:close"&&уровни.первый.length>=10&&уровни.заголовков===0
  &&уровни.раздел.filter(c=>/^am:/.test(c)).every(c=>уровни.своих.includes(c))
  &&уровни.курсор==="am:look"&&уровни.назад.открыто&&уровни.назад.курсор==="amgroup:here"&&уровни.закрыто,уровни);
 const пустой=await page.evaluate(()=>{
  /* «Начало пути» исчезает, как только выбраны ремесло и народ. */
  const было=G.startCraft,былРод=G.raceChosen;
  G.startCraft="crafter";G.raceChosen=1;
  openActionMenu();
  const есть=[...document.querySelectorAll("#amMenu [data-punkt]")].map(x=>x.dataset.punkt);
  closeActionMenu();
  G.startCraft=было;G.raceChosen=былРод;
  return {есть};});
 check('раздел, в котором сейчас нет ни одного уместного пункта, не показывается вовсе',
  !пустой.есть.includes("start")&&пустой.есть.length>=8,пустой);

 /* ── 9–10. Настройки ── */
 /* Настройки теперь пунктами (набор 167): разделы живут внутри пунктов, и
    заголовок раздела виден, когда его пункт открыт. Обходим все пункты. */
 const настройки=await page.evaluate(()=>{
  CMD.settings();
  const m=document.getElementById("modal-settings");
  const h=[...m.querySelectorAll("."+SEC_CLASS)];
  const ids=[...m.querySelectorAll("input[id^=set],select[id^=set]")].map(x=>x.id);
  const r={разделов:h.length,имена:h.map(x=>x.dataset.secTitle),настроек:ids.length,уник:new Set(ids).size,
   оглавление:!!m.querySelector('[data-cmd="secindex"]'),
   вперёд:!!m.querySelector('.row [data-cmd="secjump"]'),
   назад:!!m.querySelector('[data-cmd="secback"]'),
   подписи:0,видныхГолов:0,вне:[],поПунктам:[]};
  SET_GROUPS.forEach(g=>{
   CMD.setgroup(g.id);
   const видно=visibleInteractive(m);
   const головы=secHeads(m);
   r.видныхГолов+=головы.length;
   /* С 3.6 заголовок называет только своё имя. */
   r.подписи+=головы.filter(x=>(x.dataset.speak||"")===x.dataset.secTitle).length;
   /* Всё, что стоит выше первой настройки пункта, — служебное: закрыть,
      к пунктам, оглавление и перескок. Ни одна настройка не выше. */
   const box=setGroupBox(g.id);
   const первая=видно.findIndex(x=>box.contains(x));
   видно.slice(0,первая).forEach(x=>{const k=x.dataset.cmd||x.id||x.tagName;
    if(!["close","setgroups","secindex","secjump","secback"].includes(k))r.вне.push(g.id+":"+k);});
   /* В пункте из нескольких разделов ни одна настройка не лежит до его
      первого заголовка. */
   if(головы.length>1){const i0=видно.indexOf(головы[0]);
    видно.slice(0,i0).filter(x=>box.contains(x)).forEach(x=>r.вне.push(g.id+":до заголовка:"+(x.id||x.dataset.cmd)));}
   r.поПунктам.push(g.id+":"+setGroupHeads(g.id).length);});
  closeTopUI();
  if(activeLayer())closeTopUI();
  return r;});
 check('настройки разбиты на двенадцать разделов с разными именами внутри семи пунктов, и у каждого видимого заголовка своя подпись',
  настройки.разделов===12&&new Set(настройки.имена).size===12
  &&настройки.подписи===настройки.видныхГолов&&настройки.видныхГолов>=9
  &&настройки.имена.includes("Синтезатор речи")&&настройки.поПунктам.length===7,настройки);
 check('ни одна настройка не осталась вне разделов, и в пункте сверху есть оглавление с перескоком',
  настройки.вне.length===0&&настройки.настроек>=30&&настройки.уник===настройки.настроек
  &&настройки.оглавление&&настройки.вперёд&&настройки.назад,настройки);

 /* ── 11–13. Руководство ── */
 const руководство=await page.evaluate(()=>{
  const все=GUIDE_PARTS.reduce((a,p)=>a.concat(p[2]),[]);
  const порядок=guideOrder();
  /* Глава 90 должна лежать в первой части — она о разделах окон. */
  const номера=GUIDE.map((_,i)=>guideNum(i));
  return {частей:GUIDE_PARTS.length,
   плохие:GUIDE_PARTS.filter(p=>!(p[0]&&p[1]&&p[1].length>20&&p[2].length)).map(p=>p[0]),
   глав:GUIDE.length,вЧастях:все.length,уник:new Set(все).size,
   неНайдены:все.filter(n=>GUIDE_BY_NUM[n]===undefined),
   порядок:порядок.length,уникП:new Set(порядок).size,
   безНомера:номера.filter(n=>!n).length,
   часть90:guidePartOf(GUIDE_BY_NUM[90]),
   часть1:guidePartOf(GUIDE_BY_NUM[1]),
   /* Порядок чтения НЕ совпадает с порядком массива: массив сложился задом
      наперёд, и в этом весь смысл перестройки. */
   иной:порядок.some((v,i)=>v!==i)};});
 check('руководство разбито на девять частей, у каждой есть о чём, и каждая глава ровно в одной',
  руководство.частей===9&&руководство.плохие.length===0
  &&руководство.вЧастях===руководство.глав&&руководство.уник===руководство.глав
  &&руководство.неНайдены.length===0&&руководство.безНомера===0,руководство);
 check('порядок чтения накрывает все главы по одному разу и не совпадает с порядком массива',
  руководство.порядок===руководство.глав&&руководство.уникП===руководство.глав
  &&руководство.иной,руководство);
 check('глава находит свою часть по номеру из заголовка: девяностая — в первой части',
  руководство.часть90==="Часть I. Первые шаги"&&руководство.часть1==="Часть I. Первые шаги",
  руководство);

 const оглавление=await page.evaluate(()=>{
  openGuide();
  const o=document.getElementById("guideOverlay");
  const h=[...o.querySelectorAll("."+SEC_CLASS)];
  const глав=[...o.querySelectorAll(".toc-btn")].length;
  /* «След.» ведёт по смысловому порядку, а не по месту в массиве. */
  /* «След.» ведёт по порядку частей: за какой главой она идёт — спрашиваем
     у самого порядка, а не помним числом. */
  const порядок=guideOrder();
  const ждём=(GUIDE[порядок[порядок.indexOf(GUIDE_BY_NUM[88])+1]]||{}).title||"";
  showChapter(GUIDE_BY_NUM[88]);
  const титул=document.getElementById("chTitle").textContent;
  document.getElementById("chNext").click();
  const дальше=document.getElementById("chTitle").textContent;
  /* Первая глава порядка: «Пред.» на ней недоступна. */
  showChapter(guideOrder()[0]);
  const краяПред=document.getElementById("chPrev").disabled;
  showChapter(guideOrder()[guideOrder().length-1]);
  const краяСлед=document.getElementById("chNext").disabled;
  closeGuide();
  return {частей:h.length,глав,титул,дальше,ждём,краяПред,краяСлед,
   про:h[0]?h[0].dataset.secAbout:""};});
 check('оглавление руководства показывает девять частей и все главы, а «След.» ведёт по смыслу',
  оглавление.частей===9&&оглавление.глав===руководство.глав
  &&/Глава 88/.test(оглавление.титул)&&оглавление.дальше===оглавление.ждём
  &&оглавление.краяПред&&оглавление.краяСлед
  &&(оглавление.про||"").length>20,оглавление);

 /* ── 14. Жесты ── */
 const жесты=await page.evaluate(()=>{
  const ids=["secnext","secprev","secindex"];
  return {есть:ids.filter(id=>!!GEST_ACTION_BY_ID[id]).length,
   действий:GEST_ACTIONS.length,
   /* По умолчанию ни одна фигура ими не занята. */
   заняты:Object.values(GEST_DEFAULTS).filter(a=>ids.includes(a)).length,
   команды:["secjump","secback","secindex"].filter(c=>typeof CMD[c]==="function").length};});
 check('три действия о разделах есть среди назначаемых жестов, свободны по умолчанию и повторены командами',
  жесты.есть===3&&жесты.действий===33&&жесты.заняты===0&&жесты.команды===3,жесты);

 /* ── 15. Свод, модуль, глава, документы ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="sections");
  const m=Modules.get("SECTIONS");
  return {есть:!!r,ok:r&&r.ok,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&typeof m.nav==="function"&&typeof m.refresh==="function"
    &&m.menu().length===16&&m.parts().length===9,
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 90\. Разделы длинных окон/.test(g.title)&&g.body.length>=7)};});
 check('самопроверка держит строку sections, модуль SECTIONS отвечает, глава 90 на месте',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&typeof свод.текст==="string",свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('README и документы описывают разделы длинных окон',
  /Разделы длинных окон/i.test(readme)
  &&/## 56\. Разделы длинных окон/.test(мир)&&/secNav/.test(мир)
  &&/sec-head/.test(вз)&&/`sections`/.test(вз),
  {readme:/Разделы длинных окон/i.test(readme),
   мир:/## 56\. Разделы длинных окон/.test(мир),
   вз:/sec-head/.test(вз)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
