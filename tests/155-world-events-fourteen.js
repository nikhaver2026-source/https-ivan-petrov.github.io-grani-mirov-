/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 155: ЧЕТЫРНАДЦАТЬ РОДОВ МИРОВЫХ СОБЫТИЙ (§23 мастер-промпта)

   §23 требует, чтобы мир САМ заводил войны, восстания, эпидемии, голод,
   пожары, наводнения, магические штормы, открытия шахт, обвалы,
   нашествия, появление владык, открытие порталов, разрушение городов и
   торговые кризисы, и чтобы у всякого события были восемь свойств:
   CAUSE, STAGE, LOCATION, PARTICIPANTS, RESOURCES, CONSEQUENCES,
   SOUND_PROFILE, END_CONDITIONS.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Родов четырнадцать — ровно те, что перечисляет §23.
   2. У каждого рода все восемь свойств, и ни одно не пустое.
   3. Звуковой профиль — четыре настоящие записи, ни одной из
      синтезированных папок.
   4. Ресурсы настоящие: всё, чего касается событие, есть в мире.
   5. Повод считается от состояния державы, а не от жребия: без гор не
      откроют штольню, без врагов не начнётся война, у сытого не будет
      голода.
   6. События выводятся, а не хранятся: тот же день — тот же список.
   7. За два года случаются все четырнадцать родов.
   8. Ступень растёт по ходу срока и доходит до последней.
   9. Место названо по имени, и у каждого рода оно своё.
  10. Условие конца сильнее срока: переменился мир — событие погасло.
  11. Четыре следствия настоящие и в берегах: цена, дороги, прилавок,
      встречи.
  12. Встречи не ломают дешёвое сито: raidDanger не выходит за 2,2.
  13. Вечных денег нет ни при одном событии.
  14. Вестник объявляет начавшееся один раз, со звуковым профилем.
  15. Объяснение цены называет событие; «Вести мира» говорят списком.
  16. Самопроверка держит строку wevents; модуль, глава, README, docs.
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
  window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  window.SAID=[];const o=Speech.say.bind(Speech);
  Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1–4. Состав ── */
 const состав=await page.evaluate(()=>{
  const синт=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const нет=[];
  WEVENT_KINDS.forEach(k=>{
   const плохо=[];
   if(!k.n||!k.о||k.о.length<10)плохо.push("имя");
   if(typeof k.повод!=="function"||typeof k.поводСлово!=="function")плохо.push("повод");
   if(!Array.isArray(k.ступени)||k.ступени.length<3)плохо.push("ступени");
   if(!k.где)плохо.push("место");
   if(!Array.isArray(k.кто)||k.кто.length<3)плохо.push("участники");
   if(!Array.isArray(k.рес)||k.рес.length<3)плохо.push("ресурсы");
   if(typeof k.цена!=="function"||!k.дороги||!k.прилавок||!k.встречи)плохо.push("следствия");
   if(!SOUND_BANK[k.звук]||!Array.isArray(k.голоса)||k.голоса.length!==3
      ||k.голоса.some(г=>!SOUND_BANK[г]))плохо.push("звук");
   if(!k.конецСлово||typeof k.конец!=="function")плохо.push("конец");
   if(плохо.length)нет.push(k.id+": "+плохо.join("/"));});
  const синтез=WEVENT_KINDS.filter(k=>[k.звук].concat(k.голоса)
   .some(г=>SOUND_BANK[г]&&синт.test(SOUND_BANK[г].f[0]))).map(k=>k.id);
  const чужие=[];
  WEVENT_KINDS.forEach(k=>k.рес.forEach(r=>{
   if(!RES_BASE[r]&&!(typeof PROD_GOODS!=="undefined"&&PROD_GOODS.some(g=>g.n===r)))чужие.push(k.id+"/"+r);}));
  return {всего:WEVENT_KINDS.length,уник:new Set(WEVENT_KINDS.map(k=>k.id)).size,
   ид:WEVENT_KINDS.map(k=>k.id).join(","),нет,синтез,чужие};});
 check('родов мировых событий четырнадцать — ровно те, что перечисляет §23',
  состав.всего===14&&состав.уник===14
  &&состав.ид==="war,revolt,plague,famine,fire,flood,mstorm,mineopen,collapse,invasion,boss,portal,cityfall,tradecrisis",
  {всего:состав.всего,ид:состав.ид});
 check('у каждого рода все восемь свойств: повод, ступени, место, участники, ресурсы, следствия, звук и условие конца',
  состав.нет.length===0,состав.нет);
 check('звуковой профиль — четыре настоящие записи, ни одной из синтезированных папок',
  состав.синтез.length===0,состав.синтез);
 check('ресурсы настоящие: всё, чего касается событие, есть в мире',
  состав.чужие.length===0,состав.чужие);

 /* ── 5. Повод от состояния ── */
 const повод=await page.evaluate(()=>{
  const k=id=>WEVENT_KINDS.find(x=>x.id===id);
  const база={враги:[],напряжение:[],союзники:[],гнёт:0,нехватка:0.1,деф:{},раздор:"наследники делят престол ещё при живом правителе",
   война:false,войн:0,горы:false,вода:false,академия:false,бог:"stone",сила:100,порог:100,запретных:2,ввоз:[],вывоз:[]};
  const с=(доп)=>Object.assign({},база,доп);
  return {
   войнаБезВрагов:k("war").повод(с({})),
   войнаСВрагом:k("war").повод(с({враги:[1],война:true})),
   штольняБезГор:k("mineopen").повод(с({})),
   штольняВГорах:k("mineopen").повод(с({горы:true})),
   голодСытый:k("famine").повод(с({})),
   голодный:k("famine").повод(с({деф:{"трава":0.5}})),
   потопБезВоды:k("flood").повод(с({})),
   потопУВоды:k("flood").повод(с({вода:true})),
   восстаниеТихо:k("revolt").повод(с({})),
   восстаниеРаздор:k("revolt").повод(с({раздор:"знать против цехов: спор о податях"})),
   всеВБерегах:WEVENT_KINDS.every(x=>{const v=x.повод(с({}));return v>=0&&v<=1;})};});
 check('повод считается от состояния: без врагов войны почти нет, без гор не бьют штольню, сытому не грозит голод, без воды нет половодья, без раздора нет восстания',
  повод.войнаСВрагом>повод.войнаБезВрагов*5&&повод.штольняВГорах>повод.штольняБезГор*5
  &&повод.голодный>повод.голодСытый*5&&повод.потопУВоды>повод.потопБезВоды*4
  &&повод.восстаниеРаздор>повод.восстаниеТихо*5&&повод.всеВБерегах,повод);

 /* ── 6–7. Вывод и разнообразие ── */
 const вывод=await page.evaluate(()=>{
  const a=worldEvents(200).map(e=>e.id).sort().join("|");
  WEVENT_CACHE.clear();
  const b=worldEvents(200).map(e=>e.id).sort().join("|");
  const виды={};let всего=0;
  for(let d=7;d<=728;d+=7){worldEvents(d).forEach(e=>{виды[e.вид]=(виды[e.вид]||0)+1;всего++;});}
  const нет=WEVENT_KINDS.map(k=>k.id).filter(id=>!виды[id]);
  const наДень=[];
  for(let d=30;d<=400;d+=37)наДень.push(worldEvents(d).length);
  return {совпало:a===b,событий:a?a.split("|").length:0,виды,нет,всего,наДень};});
 check('события выводятся, а не хранятся: тот же день — тот же список, и он не пуст',
  вывод.совпало&&вывод.событий>0,{совпало:вывод.совпало,событий:вывод.событий});
 check('за два года случаются все четырнадцать родов, и мир не тонет в них — на день их единицы, а не сотни',
  вывод.нет.length===0&&вывод.всего>200
  &&вывод.наДень.every(n=>n>=1&&n<=60),{нет:вывод.нет,всего:вывод.всего,наДень:вывод.наДень});

 /* ── 8. Ступени ── */
 const ступени=await page.evaluate(()=>{
  /* Находим событие в самом начале и проходим его срок до конца. */
  let нач=null;
  for(let d=7;d<=364&&!нач;d+=1){
   const e=worldEvents(d).find(x=>x.прошло===0);
   if(e)нач={день:d,id:e.id,держава:e.держава,вид:e.вид,срок:e.срок};}
  if(!нач)return {нет:true};
  const путь=[];
  for(let d=нач.день;d<нач.день+нач.срок;d++){
   const e=worldEvents(d).find(x=>x.id===нач.id);
   путь.push(e?e.ступень:-1);}
  const живые=путь.filter(x=>x>=0);
  const растёт=живые.every((x,i)=>i===0||x>=живые[i-1]);
  const после=worldEvents(нач.день+нач.срок).some(x=>x.id===нач.id);
  return {вид:нач.вид,срок:нач.срок,путь,ступеней:new Set(живые).size,растёт,после,
   первая:живые[0],последняя:живые[живые.length-1]};});
 check('ступень растёт по ходу срока, доходит до последней и по исходе срока событие кончается',
  !ступени.нет&&ступени.первая===0&&ступени.растёт&&ступени.ступеней>=3&&ступени.после===false,
  {вид:ступени.вид,ступеней:ступени.ступеней,первая:ступени.первая,последняя:ступени.последняя,после:ступени.после});

 /* ── 9. Место ── */
 const место=await page.evaluate(()=>{
  const виды=new Set(),безИмени=[],чужое=[];
  for(let d=7;d<=364;d+=7)worldEvents(d).forEach(e=>{
   виды.add(WEVENT_BY_ID[e.вид].где);
   if(!e.место||!e.место.имя||e.место.имя.length<3)безИмени.push(e.id);
   const надо=WEVENT_BY_ID[e.вид].где;
   if(e.место.что!==надо)чужое.push(e.вид+": "+e.место.что+"≠"+надо);});
  return {родовМест:виды.size,места:Array.from(виды),безИмени:безИмени.slice(0,3),чужое:чужое.slice(0,3)};});
 check('место названо по имени, и у каждого рода оно своё: держава, город, область, рудник или подземелье',
  место.родовМест>=5&&место.безИмени.length===0&&место.чужое.length===0,место);

 /* ── 10. Условие конца сильнее срока ── */
 const конец=await page.evaluate(()=>{
  /* Ищем войну, начавшуюся больше двух дней назад, и снимаем войну в мире. */
  let нашли=null;
  for(let d=7;d<=364&&!нашли;d+=1){
   const e=worldEvents(d).find(x=>x.вид==="war"&&x.прошло>=3);
   if(e)нашли={день:d,id:e.id,держава:e.держава,прошло:e.прошло};}
  if(!нашли)return {нет:true};
  const было=worldEvents(нашли.день).some(x=>x.id===нашли.id);
  const ор=empireAtWar,орВ=warsAt,орР=relationAt;
  empireAtWar=()=>false;warsAt=()=>[];relationAt=()=>0;
  FACTION_MOVE_CACHE.clear();WEVENT_CACHE.clear();
  const стало=worldEvents(нашли.день).some(x=>x.id===нашли.id);
  empireAtWar=ор;warsAt=орВ;relationAt=орР;
  FACTION_MOVE_CACHE.clear();WEVENT_CACHE.clear();
  const вернулось=worldEvents(нашли.день).some(x=>x.id===нашли.id);
  return {прошло:нашли.прошло,было,стало,вернулось};});
 check('условие конца сильнее срока: война кончилась в мире — кончилось и событие, вернулась — вернулось',
  !конец.нет&&конец.было===true&&конец.стало===false&&конец.вернулось===true,конец);

 /* ── 11–12. Следствия ── */
 const следствия=await page.evaluate(()=>{
  const вне=[],движется={цена:0,дороги:0,прилавок:0,встречи:0};
  for(let d=7;d<=364;d+=7)EMPIRES.forEach((e,i)=>{
   const dd=weventRoadK(i,d),p=weventWidthK(i,d),m=weventMeetK(i,d);
   if(!(dd>=0.8&&dd<=1.8)||!(p>=0.35&&p<=1.3)||!(m>=0.6&&m<=1.6))вне.push([e.short,d,dd,p,m]);
   if(dd!==1)движется.дороги++;if(p!==1)движется.прилавок++;if(m!==1)движется.встречи++;
   ["руда","трава","эфир","дерево","полотно"].forEach(res=>{
    const c=weventPriceK(res,i,d);
    if(!(c>=0.6&&c<=2))вне.push([e.short,res,c]);
    if(c!==1)движется.цена++;});});
  return {вне:вне.slice(0,4),движется};});
 check('четыре следствия настоящие и в берегах: цена, дороги, прилавок и встречи — каждое хоть раз сдвигается и ни разу не выходит за пределы',
  следствия.вне.length===0&&Object.keys(следствия.движется).every(k=>следствия.движется[k]>0),следствия);

 const сито=await page.evaluate(()=>{
  const был={x:G.x,y:G.y};
  let макс=0,мин=99,проб=0;
  for(let k=0;k<400;k++){
   const x=300+((k*911)%49000),y=300+((k*577)%49000);
   const v=raidDanger(x,y);
   if(v>макс)макс=v;if(v<мин)мин=v;проб++;}
  G.x=был.x;G.y=был.y;
  return {макс:Math.round(макс*100)/100,мин:Math.round(мин*100)/100,проб};});
 check('встречи не ломают дешёвое сито: множитель набега с мировыми событиями нигде не выходит за 2,2',
  сито.макс<=2.2001&&сито.мин>=0.5&&сито.проб===400,сито);

 /* ── 13. Вечных денег нет ── */
 const деньги=await page.evaluate(()=>{
  const было=Number(G.day);
  const петли=[],товары=["руда","трава","камень","кристалл","слиток","полотно","эфир","дерево"];
  let сравнений=0;
  for(let d=7;d<=364;d+=7){
   G.day=d;
   EMPIRES.forEach((e,i)=>товары.forEach(res=>{
    const куп=marketPrice(res,i,d),прод=sellPrice(res,i,d,null);
    сравнений++;
    if(прод>=куп)петли.push([e.short,res,куп,прод,weventsOf(i,d).map(x=>x.вид).join("+")]);}));}
  G.day=было;
  return {петли:петли.slice(0,4),сравнений};});
 check('вечных денег нет ни при одном мировом событии: продажа нигде не обгоняет покупку — больше четырёх тысяч сравнений',
  деньги.петли.length===0&&деньги.сравнений>4000,деньги);

 /* ── 14. Вестник ── */
 const вестник=await page.evaluate(()=>{
  const было=Number(G.day);
  G.weventSaid={};
  /* Ищем день, когда в землях игрока что-то начинается. */
  const i=empireIndexAt(G.x,G.y);
  let день=null;
  for(let d=7;d<=728&&день===null;d++){
   if(weventsOf(i,d).some(e=>e.прошло===0))день=d;}
  if(день===null){G.day=было;return {нет:true};}
  G.day=день;
  PLAYED.length=0;SAID.length=0;
  const первый=weventAnnounce();
  const звук=PLAYED.slice(),реч=SAID.slice();
  const ev=weventsOf(i,день).find(e=>e.прошло===0);
  const второй=weventAnnounce();
  G.day=было;
  return {первый,второй,
   звучал:звук.includes(ev.звук),
   сказал:реч.some(t=>/Вести мира: /.test(t)),
   впамяти:!!G.weventSaid[ev.id],
   вид:ev.вид};});
 check('вестник объявляет начавшееся один раз, со звуком своего рода, и помнит, о чём уже говорил',
  !вестник.нет&&вестник.первый===true&&вестник.второй===false
  &&вестник.звучал&&вестник.сказал&&вестник.впамяти,вестник);

 /* ── 15. Слова ── */
 const слова=await page.evaluate(()=>{
  const было=Number(G.day);
  const i=empireIndexAt(G.x,G.y);
  let день=null;
  for(let d=7;d<=728&&день===null;d++)if(weventsOf(i,d).length)день=d;
  if(день===null){G.day=было;return {нет:true};}
  G.day=день;
  const ev=weventsOf(i,день)[0];
  const стр=weventLine(ev);
  const сводка=weventsText();
  /* Объяснение цены называет событие там, где оно двигает цену. */
  let почему="";
  const вид=WEVENT_BY_ID[ev.вид];
  const двинутый=ev.ресурсы.find(r=>вид.цена(r)!==1);
  if(двинутый)почему=priceWhy(двинутый,i,null);
  G.day=было;
  return {стр,длина:стр.length,
   естьСтупень:/Ступень \d+ из \d+: /.test(стр),
   естьПовод:/Повод: /.test(стр),
   естьКто:/Кого касается: /.test(стр),
   естьЧто:/Чего касается: /.test(стр),
   естьСледствие:/Из этого следует: /.test(стр),
   естьКонец:/Кончится, /.test(стр),
   сводка:сводка.slice(0,80),сводкаДлина:сводка.length,
   вПочему:/вести мира: /.test(почему),двинутый};});
 check('строка события называет ступень, повод, участников, ресурсы, следствия и условие конца; «Вести мира» говорят списком, а объяснение цены называет событие',
  !слова.нет&&слова.естьСтупень&&слова.естьПовод&&слова.естьКто&&слова.естьЧто
  &&слова.естьСледствие&&слова.естьКонец&&слова.сводкаДлина>50&&слова.вПочему,слова);

 /* ── 16. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="wevents");
  const m=Modules.get("WORLDEVENTS");
  return {есть:!!r,ok:r?r.ok:false,
   плохие:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!m&&m.kinds.length===14&&typeof m.all==="function"&&typeof m.priceK==="function"
    &&typeof m.here==="function"&&typeof m.daily==="function",
   текст:m?m.text():"",
   глава:GUIDE.some(g=>/Глава 85\. Вести мира/.test(g.title)&&g.body.length>=5),
   кнопка:(()=>{try{return JSON.stringify(AM_GROUPS).indexOf("wevents")>0;}catch(_){return false;}})(),
   команда:typeof CMD.wevents==="function",
   сохранение:(()=>{try{G.weventSaid={"war:0:1":1};saveGame(true);
    const o=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");const g=o.G||o;
    return !!g.weventSaid;}catch(_){return false;}})()};});
 check('самопроверка держит строку wevents, модуль WORLDEVENTS отвечает, глава 85 на месте, кнопка и команда есть, память вестника ложится в сохранение',
  свод.есть&&свод.ok&&свод.модуль&&свод.глава&&свод.кнопка&&свод.команда&&свод.сохранение
  &&свод.текст.length>20,свод);
 check('ни одна другая строка самопроверки не покраснела',свод.плохие.length===0,свод.плохие);

 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const мир=fs.readFileSync(path.join(корень,'docs','МИР.md'),'utf8');
 check('README и docs/МИР.md описывают четырнадцать родов мировых событий и восемь их свойств',
  /четырнадцать родов мировых событий/i.test(readme)&&/восемь свойств/i.test(readme)
  &&/§23/.test(мир)&&/мировых событий/i.test(мир),
  {readme:/четырнадцать родов мировых событий/i.test(readme),docs:/§23/.test(мир)});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(r=>console.log(r));
 const fail=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\nИТОГО: ${results.length-fail} прошло, ${fail} провалено.`);
 process.exit(fail?1:0);
})();
