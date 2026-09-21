/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 160: РАЗДЕЛЫ ДЛИННЫХ ОКОН

   Три окна игры нельзя пробежать глазами: меню действий (130 пунктов),
   настройки (шесть десятков управляющих элементов) и руководство (90 глав).
   Заголовки разделов в них были помечены «не читать», и незрячий игрок
   свайпал сквозь них, как сквозь сплошной список.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Меню действий разбито на четырнадцать разделов, и все пункты целы.
   2. Ни один раздел не длиннее шестнадцати пунктов, и самое нужное первым.
   3. Заголовок в меню — настоящий пункт окна, и он называет число пунктов.
   4. Число пунктов считается по живому окну, а не по массиву.
   5. Двойное касание по заголовку перескакивает к следующему разделу.
   6. Перескок ходит по кругу и умеет назад.
   7. Оглавление вслух называет все разделы с числами.
   8. Пустой раздел не показывается.
   9. Настройки разбиты на десять разделов, и ни одна настройка не пропала.
  10. В настройках есть кнопки оглавления и перескока.
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

 /* ── 1–2. Разбивка меню действий ── */
 const меню=await page.evaluate(()=>({
  разделов:AM_GROUPS.length,
  имена:AM_GROUPS.map(g=>g[0]),
  уникИмён:new Set(AM_GROUPS.map(g=>g[0])).size,
  пунктов:AM_ITEMS.length,
  уникПунктов:new Set(AM_ITEMS.map(x=>x[0])).size,
  самыйБольшой:Math.max(...AM_GROUPS.map(g=>g[1].length)),
  пустые:AM_GROUPS.filter(g=>!g[1].length).map(g=>g[0]),
  безПодписи:AM_ITEMS.filter(x=>!(x[1]&&x[1].length>3)).map(x=>x[0]),
  первыеПодРукой:(AM_GROUPS.find(g=>g[0]==="Сейчас под рукой")||[,[]])[1].map(x=>x[0])}));
 check('меню действий разбито на четырнадцать разделов с разными именами, и все сто тридцать пунктов целы',
  меню.разделов===14&&меню.уникИмён===14&&меню.пунктов===130&&меню.уникПунктов===130
  &&меню.пустые.length===0&&меню.безПодписи.length===0,меню);
 check('ни один раздел не длиннее шестнадцати пунктов, а под рукой — то, что нужно на каждом шагу',
  меню.самыйБольшой<=16
  &&["look","objects","usehere","interact","gather","echo","map","hud"]
    .every(id=>меню.первыеПодРукой.includes(id)),меню);

 /* ── 3–4. Заголовок как пункт ── */
 const заголовки=await page.evaluate(()=>{
  openActionMenu();
  const lay=document.getElementById("actionMenu");
  const h=[...lay.querySelectorAll("."+SEC_CLASS)];
  const все=visibleInteractive(lay);
  const первый=h[0];
  /* Сколько пунктов игра насчитала первому заголовку и сколько их на деле. */
  const сказано=(/(\d+)\s+пункт/.exec(первый.dataset.speak||"")||[])[1];
  let руками=0;
  for(let i=все.indexOf(первый)+1;i<все.length;i++){
   if(все[i].classList.contains(SEC_CLASS))break;
   руками++;}
  const r={есть:h.length,вСписке:h.every(x=>все.includes(x)),
   скомандой:h.every(x=>x.dataset.cmd==="secjump"),
   назван:/Раздел «/.test(первый.dataset.speak||""),
   сказано:Number(сказано),руками,
   имена:h.map(x=>x.dataset.secTitle)};
  closeActionMenu();
  return r;});
 check('заголовок раздела — настоящий пункт окна: курсор его берёт, у него есть команда и имя',
  заголовки.есть>=8&&заголовки.вСписке&&заголовки.скомандой&&заголовки.назван
  &&new Set(заголовки.имена).size===заголовки.есть,заголовки);
 check('число пунктов в заголовке считается по живому окну, а не по массиву',
  заголовки.сказано>0&&заголовки.сказано===заголовки.руками,заголовки);

 /* ── 5–6. Перескок ── */
 const перескок=await page.evaluate(()=>{
  openActionMenu();
  const lay=document.getElementById("actionMenu");
  ensureCursor(lay);
  const h=[...lay.querySelectorAll("."+SEC_CLASS)];
  const имя=el=>el&&el.dataset?el.dataset.secTitle||el.textContent:null;
  /* Ставим курсор в середину первого раздела и перескакиваем. */
  const все=visibleInteractive(lay);
  setCursor(все[все.indexOf(h[0])+2],false);
  const откуда=uiCursor.dataset.cmd;
  secNav("next");const после=имя(uiCursor);
  secNav("next");const вторая=имя(uiCursor);
  secNav("prev");const назад=имя(uiCursor);
  /* По кругу: с последнего — на первый. */
  setCursor(h[h.length-1],false);
  secNav("next");const круг=имя(uiCursor);
  const оглавление=secIndexText(lay);
  closeActionMenu();
  return {откуда,после,вторая,назад,круг,первый:имя(h[0]),второй:имя(h[1]),
   оглавление,разделов:h.length};});
 check('двойное касание по заголовку перескакивает через весь раздел к следующему',
  перескок.откуда&&/^am:/.test(перескок.откуда)
  &&перескок.после===перескок.второй&&перескок.после!==перескок.первый,перескок);
 check('перескок умеет назад и ходит по кругу: с последнего раздела — на первый',
  перескок.назад===перескок.второй&&перескок.вторая!==перескок.после
  &&перескок.круг===перескок.первый,перескок);
 check('оглавление вслух называет все разделы с числом пунктов в каждом',
  new RegExp('Разделов '+перескок.разделов).test(перескок.оглавление)
  &&(перескок.оглавление.match(/пункт/g)||[]).length>=перескок.разделов,
  перескок.оглавление.slice(0,160));

 /* ── 8. Пустой раздел не показывается ── */
 const пустой=await page.evaluate(()=>{
  /* «Начало пути» исчезает, как только ремесло выбрано. */
  const было=G.startCraft;
  G.startCraft="crafter";
  openActionMenu();
  const есть=[...document.getElementById("actionMenu").querySelectorAll("."+SEC_CLASS)]
   .map(x=>x.dataset.secTitle);
  closeActionMenu();
  G.startCraft=было;
  return {есть,ремесло:"crafter"};});
 check('раздел, в котором сейчас нет ни одного уместного пункта, не показывается вовсе',
  !пустой.есть.includes("Начало пути")&&пустой.есть.length>=8,пустой);

 /* ── 9–10. Настройки ── */
 const настройки=await page.evaluate(()=>{
  CMD.settings();
  const m=document.getElementById("modal-settings");
  const h=[...m.querySelectorAll("."+SEC_CLASS)];
  /* Все управляющие элементы настроек должны лежать ПОСЛЕ первого заголовка:
     ни одна настройка не осталась вне разделов. */
  const все=visibleInteractive(m);
  const перваяГолова=все.indexOf(h[0]);
  const вне=все.slice(0,перваяГолова).map(x=>x.id||x.dataset.cmd||x.tagName);
  const ids=[...m.querySelectorAll("input[id^=set],select[id^=set]")].map(x=>x.id);
  const r={разделов:h.length,имена:h.map(x=>x.dataset.secTitle),
   вне,настроек:ids.length,уник:new Set(ids).size,
   оглавление:!!m.querySelector('[data-cmd="secindex"]'),
   вперёд:!!m.querySelector('.row [data-cmd="secjump"]'),
   назад:!!m.querySelector('[data-cmd="secback"]'),
   подписи:h.map(x=>x.dataset.speak).filter(t=>/Раздел «/.test(t||"")).length};
  if(activeLayer())closeTopUI();
  return r;});
 check('настройки разбиты на десять разделов с разными именами, и у каждого своя подпись',
  настройки.разделов===10&&new Set(настройки.имена).size===10
  &&настройки.подписи===10,настройки);
 check('ни одна настройка не осталась вне разделов, и сверху есть оглавление с перескоком',
  настройки.вне.every(x=>x==="close"||x==="secindex"||x==="secjump"||x==="secback")
  &&настройки.настроек>=30&&настройки.уник===настройки.настроек
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
  return {частей:h.length,глав,титул,дальше,краяПред,краяСлед,
   про:h[0]?h[0].dataset.secAbout:""};});
 check('оглавление руководства показывает девять частей и все главы, а «След.» ведёт по смыслу',
  оглавление.частей===9&&оглавление.глав===руководство.глав
  &&/Глава 88/.test(оглавление.титул)&&/Глава 90/.test(оглавление.дальше)
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
  жесты.есть===3&&жесты.действий===32&&жесты.заняты===0&&жесты.команды===3,жесты);

 /* ── 15. Свод, модуль, глава, документы ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="sections");
  const m=Modules.get("SECTIONS");
  return {есть:!!r,ok:r&&r.ok,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&typeof m.nav==="function"&&typeof m.refresh==="function"
    &&m.menu().length===14&&m.parts().length===9,
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
