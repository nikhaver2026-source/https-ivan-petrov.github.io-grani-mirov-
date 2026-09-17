/* ════════════════════════════════════════════════════════════════════════
   НАБОР 75: ДЕЛА ПРО ТОТ САМЫЙ МИР И ВТОРОЙ ПУТЬ

   Мир оброс станками, полками, ловушками и приметами, а заказы у жителей
   остались те же, что и в первый день: принеси руду, убей монстра, дойди до
   отметки. Всё новое жило само по себе, и ни один житель про это не
   спрашивал — значит, у игрока не было ни одной причины к этому вернуться.

   И закрывался заказ ровно одним способом. Не смог или не захотел — дело
   висело в списке до отказа с потерей репутации. Второго выхода не было
   нигде, хотя в жизни он есть почти всегда: заплати, найми, расскажи.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Четыре новых рода дел собираются и каждый называет, ГДЕ это делается.
   2. Они достижимы в настоящем мире, а не только по прямому вызову, и не
      съели собой обычные заказы.
   3. Счёт ведёт сам мир: работа у станка, прочтённая страница, взятый клад.
      Чужое ремесло и перечитанная страница не считаются.
   4. Сдать раньше времени нельзя, и отказ называет числа.
   5. У дела есть второй путь: золотом или словом. Он всегда платит меньше.
   6. Второй путь требует основания: за слово надо что-то знать, за откуп —
      иметь чем платить. Дважды его не применить.
   7. Всё это слышно: кнопка озвучена, прогресс читается без «undefined».
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. Четыре рода дел собираются и говорят, где это делать ── */
 const роды=await page.evaluate(()=>{
  const проба=(prof)=>{
   const n=getNPC(1000,1000,0,prof);n.prof=prof;
   return worldQuestFor(n,0.05);};
  const k=проба("Кузнец"),m=проба("Магистр"),s=проба("Стражник"),t=проба("Странник");
  return {
   craft:k&&{тип:k.type,need:k.need,have:k.have,маст:k.маст,текст:k.text,
    станок:/горн|наковальн|чан|очаг|верстак|точило|круг|шар|стан|шкаф|полка|зеркал|кадильниц/i.test(k.text),
    наставник:/урок|наставник|ученик/i.test(k.text),золото:k.reward.gold,опыт:k.reward.xp},
   study:m&&{тип:m.type,need:m.need,полки:/полок|полк/i.test(m.text),язык:/язык|разобрать/i.test(m.text),золото:m.reward.gold},
   trapwork:s&&{тип:s.type,need:s.need,низ:/подземель/i.test(s.text),
    честно:/сработавшая не считается/i.test(s.text),золото:s.reward.gold},
   hoard:t&&{тип:t.type,need:t.need,где:/зол[еа] кострищ|межев|тайник/i.test(t.text),
    услов:/услови/i.test(t.text),золото:t.reward.gold},
   /* Не у всякого жителя есть такое дело, и жребий свой. */
   неВсем:worldQuestFor(getNPC(1000,1000,0,"Фермер"),0.9)===null,
   чужому:worldQuestFor(getNPC(1000,1000,0,"Грузчик"),0.05)!==null};});
 check('дело «сделать своими руками» собирается и называет станок и наставника',
  роды.craft&&роды.craft.тип==="craft"&&роды.craft.need>=1&&роды.craft.станок&&роды.craft.наставник,роды.craft);
 check('дело «прочесть страницы» собирается и называет полки и чужой язык',
  роды.study&&роды.study.тип==="study"&&роды.study.need>=2&&роды.study.полки&&роды.study.язык,роды.study);
 check('дело «снять ловушки» собирается, зовёт вниз и считает только снятое руками',
  роды.trapwork&&роды.trapwork.тип==="trapwork"&&роды.trapwork.низ&&роды.trapwork.честно,роды.trapwork);
 check('дело «взять клад по примете» собирается и объясняет, где приметы и что у них условие',
  роды.hoard&&роды.hoard.тип==="hoard"&&роды.hoard.где&&роды.hoard.услов,роды.hoard);
 check('дело даётся не каждому и не всякий раз: жребий свой',
  роды.неВсем&&роды.чужому,роды);
 check('за новые дела платят и золотом, и опытом',
  [роды.craft,роды.study,роды.trapwork,роды.hoard].every(q=>q&&q.золото>0),роды);

 /* ── 2. Достижимость в настоящем мире ── */
 const обход=await page.evaluate(()=>{
  const типы={};let жителей=0;
  for(let x=200;x<9000;x+=89)for(let y=200;y<9000;y+=89){
   const c=cellContent(x,y);
   if(!c||!c.structure)continue;
   const profs=PROFS[c.structure.type]||PROFS.traveler;
   for(let i=0;i<profs.length;i++){
    const n=getNPC(x,y,i);if(!n)continue;
    жителей++;
    let q=null;try{q=questFor(n);}catch(e){}
    if(q&&q.type)типы[q.type]=(типы[q.type]||0)+1;}}
  return {жителей,типы};});
 const новые=["craft","study","trapwork","hoard"].filter(t=>!(обход.типы[t]>0));
 check('все четыре новых рода дел вправду встречаются у жителей мира, а не только по прямому вызову',
  новые.length===0,{жителей:обход.жителей,новые,типы:обход.типы});
 check('новые дела не съели старые: обычные заказы по-прежнему выдаются',
  ["fetch","kill","hunt","visit"].filter(t=>(обход.типы[t]||0)>0).length>=3,обход.типы);
 check('новые дела — заметная доля, но не большинство',
  (()=>{const н=["craft","study","trapwork","hoard"].reduce((s,t)=>s+(обход.типы[t]||0),0);
   const всего=Object.values(обход.типы).reduce((s,v)=>s+v,0);
   return всего>0&&н/всего>0.03&&н/всего<0.5;})(),
  {всего:Object.values(обход.типы).reduce((s,v)=>s+v,0),типы:обход.типы});

 /* ── 3. Счёт ведёт сам мир ── */
 const счёт=await page.evaluate(()=>{
  G.quests=[];G.mast={smith:{ур:5,оп:0,дел:0},cook:{ур:5,оп:0,дел:0}};
  const t=TECHS.find(x=>x.маст==="smith"&&x.берёт&&Object.keys(x.берёт).length);
  const другое=TECHS.find(x=>x.маст==="cook"&&x.берёт&&Object.keys(x.берёт).length);
  const надо=4;
  G.quests.push({id:"тест_craft",npc:"Проверка",type:"craft",маст:"smith",need:надо,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:100,xp:50}});
  const дай=(теха)=>{for(const k in (теха.берёт||{}))G.inv[k]=(Number(G.inv[k])||0)+200;
   if(теха.род){const ч=techPart(теха);if(ч)for(const r of (ч.из||[]))G.inv[r]=(Number(G.inv[r])||0)+200;}};
  дай(t);дай(другое);
  const q=()=>Number(G.quests[0].have)||0;
  /* У станка рука иногда срывается — это не отменяется, а учитывается:
     считается удавшаяся работа, и только она. Удача видна по выходу. */
  const выход=Object.keys(t.даёт||{})[0];
  const сколько=()=>Number(G.inv[выход])||0;
  let успехов=0,шагов=0;
  while(успехов<надо+2&&шагов<40){
   const было=сколько();techDo(t,t.станки[0]);шагов++;
   if(сколько()>было)успехов++;}
  const свои=q();
  /* Чужое ремесло не считается никогда. */
  const доЧужого=q();
  for(let i=0;i<6;i++)techDo(другое,другое.станки[0]);
  const чужое=q()-доЧужого;
  return {чужое,успехов,шагов,свои,надо,техника:t.id,чужая:другое.id,выход};});
 check('удавшаяся работа по нужному ремеслу двигает счёт заказа',
  счёт.успехов>счёт.надо&&счёт.свои===счёт.надо,счёт);
 check('работа по чужому ремеслу заказ не двигает',счёт.чужое===0,счёт);
 check('счёт не растёт выше того, что просили, сколько ни работай',счёт.свои===счёт.надо,счёт);

 const чтение=await page.evaluate(()=>{
  G.quests=[{id:"тест_study",npc:"Проверка",type:"study",need:3,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:80,xp:60}}];
  G.know=[];
  const было=G.quests[0].have;
  studyPage(11,0,"Проверка.");
  const после=G.quests[0].have;
  studyPage(11,0,"Проверка.");              /* перечитывание не считается */
  const снова=G.quests[0].have;
  studyPage(12,0,"Проверка.");
  return {было,после,снова,третья:G.quests[0].have};});
 check('прочтённая страница двигает счёт выписок',чтение.после===чтение.было+1,чтение);
 check('перечитанная страница счёт не двигает: считается узнанное, а не касание',
  чтение.снова===чтение.после,чтение);
 check('следующая новая страница снова считается',чтение.третья===чтение.снова+1,чтение);

 const клад=await page.evaluate(()=>{
  G.quests=[{id:"тест_hoard",npc:"Проверка",type:"hoard",need:1,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:120,xp:70}}];
  G.signs=[{ключ:"zтест",от:{x:G.x,y:G.y},цель:{x:G.x,y:G.y,имя:"старый межевой камень"},
   усл:"",приз:{вид:"оружие",что:SECRET_BLADES[0]},род:"оружие",
   текст:"проверочная примета",золото:100}];
  const золДо=G.gold;
  const ок=takeTreasure(G.x,G.y);
  return {ок,счёт:G.quests[0].have,золото:G.gold>золДо};});
 check('взятый по примете клад двигает счёт заказа',клад.ок&&клад.счёт===1,клад);

 const хуки=await page.evaluate(()=>({
  ловушка:String(trapDisarm).includes('questWorldTick("trapwork")'),
  клад:String(takeTreasure).includes('questWorldTick("hoard")'),
  страница:String(studyPage).includes('questWorldTick("study")'),
  станок:(String(techDo).match(/questWorldTick\("craft"/g)||[]).length}));
 check('счётчик врезан во все четыре места мира, и у станка — на обоих исходах',
  хуки.ловушка&&хуки.клад&&хуки.страница&&хуки.станок>=2,хуки);

 /* ── 4. Сдать раньше времени нельзя ── */
 const рано=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.quests=[{id:"тест_рано",npc:"Проверка",type:"trapwork",need:3,have:1,done:false,
   race:G.race,text:"проверка",reward:{gold:90,xp:40}}];
  const золДо=G.gold;
  completeQuest("тест_рано");
  Speech.say=был;
  const t=сказ.join(" ");
  return {сдано:G.quests[0].done,золото:G.gold===золДо,
   числа:/1 из 3/.test(t),второй:/второй путь/i.test(t),текст:t.slice(0,220)};});
 check('раньше срока дело не сдаётся и золота за него не платят',
  !рано.сдано&&рано.золото,рано);
 check('отказ называет числа и подсказывает второй путь',рано.числа&&рано.второй,рано);

 /* ── 5 и 6. Второй путь ── */
 const второй=await page.evaluate(()=>{
  const мк=(тип,доп)=>Object.assign({id:"т_"+тип,npc:"Проверка",type:тип,need:2,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:200,xp:100}},доп||{});
  const есть=t=>!!qAltFor(мк(t));
  return {
   выкуп:(qAltFor(мк("craft"))||{}).id,
   найм:(qAltFor(мк("trapwork"))||{}).id,
   слово:(qAltFor(мк("hoard"))||{}).id,
   старым:есть("fetch")&&есть("kill")&&есть("delivery"),
   цепочке:qAltFor(мк("fetch",{chain:"кузнечная"}))===null,
   тёмному:qAltFor(мк("fetch",{тёмнаяНаграда:"дар"}))===null,
   сданному:qAltFor(мк("fetch",{done:true}))===null,
   цена:qAltPrice(мк("craft"))>0,
   словоДаром:qAltPrice(мк("hoard"))===0};});
 check('у работы второй путь — откуп, у боя и ловушек — наём, у клада и выписок — слово',
  второй.выкуп==="выкуп"&&второй.найм==="найм"&&второй.слово==="слово",второй);
 check('второй путь есть и у старых заказов: принести, убить, довезти',второй.старым,второй);
 check('шаг цепочки, тёмное дело и уже сданное второго пути не знают',
  второй.цепочке&&второй.тёмному&&второй.сданному,второй);
 check('за откуп платят золотом, за слово — не платят ничем',
  второй.цена&&второй.словоДаром,второй);

 const платят=await page.evaluate(()=>{
  const сделать=()=>{G.quests=[{id:"т_плата",npc:"Проверка",type:"craft",маст:"smith",need:1,have:1,done:false,
   race:G.race,text:"проверка",reward:{gold:400,xp:200}}];};
  G.gold=100000;
  /* Опыт на высоком уровне никуда не уходит: повышение съело бы разницу
     и превратило бы измерение в шум. */
  const чисто=()=>{G.level=40;G.xp=0;};
  сделать();чисто();const зол1=G.gold;completeQuest("т_плата");
  const честно={золото:G.gold-зол1,опыт:G.xp,уровень:G.level};
  сделать();чисто();const зол2=G.gold;const цена=qAltPrice(G.quests[0]);
  completeQuestAlt("т_плата");
  const путём={золото:G.gold-зол2+цена,опыт:G.xp,цена,уровень:G.level};
  return {честно,путём,сдано:G.quests[0].done,метка:G.quests[0].путь,
   безПовышений:честно.уровень===40&&путём.уровень===40};});
 check('второй путь закрывает дело и помечает, каким способом',
  платят.сдано&&платят.метка==="выкуп",платят);
 check('за второй путь платят заметно меньше, чем за сделанное своими руками',
  платят.безПовышений&&платят.путём.золото<платят.честно.золото
  &&платят.путём.опыт>0&&платят.путём.опыт<платят.честно.опыт,платят);

 const основание=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  /* Слово требует, чтобы было что рассказать. */
  G.signs=[];
  G.quests=[{id:"т_слово",npc:"Проверка",type:"hoard",need:1,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:200,xp:100}}];
  const безПриметы=completeQuestAlt("т_слово");
  G.signs=[{ключ:"zт",от:{x:G.x,y:G.y},цель:{x:G.x+3,y:G.y,имя:"тур"},усл:"",приз:null,
   род:"оружие",текст:"примета",золото:50}];
  const сПриметой=completeQuestAlt("т_слово");
  const приметаУшла=(signsOpen()||[]).length===0;
  /* Выписки: пересказывать рано, пока не прочтена половина. */
  G.quests=[{id:"т_поло",npc:"Проверка",type:"study",need:4,have:1,done:false,
   race:G.race,text:"проверка",reward:{gold:200,xp:100}}];
  const рано=completeQuestAlt("т_поло");
  G.quests[0].have=2;
  const впору=completeQuestAlt("т_поло");
  /* Откуп без денег. */
  G.gold=0;
  G.quests=[{id:"т_бедный",npc:"Проверка",type:"craft",маст:"smith",need:2,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:200,xp:100}}];
  const безДенег=completeQuestAlt("т_бедный");
  /* Дважды не закрыть. */
  G.gold=100000;
  G.quests=[{id:"т_два",npc:"Проверка",type:"craft",маст:"smith",need:2,have:0,done:false,
   race:G.race,text:"проверка",reward:{gold:200,xp:100}}];
  const раз=completeQuestAlt("т_два"),два=completeQuestAlt("т_два");
  Speech.say=был;
  const t=сказ.join(" ");
  return {безПриметы,сПриметой,приметаУшла,рано,впору,безДенег,раз,два,
   молчит:сказ.length<6,золотоВслух:/золота/.test(t),текст:t.slice(0,240)};});
 check('слово без того, что рассказать, не принимается, а с приметой — принимается',
  основание.безПриметы===false&&основание.сПриметой===true,основание);
 check('указанная примета уходит из рук: слово тоже чего-то стоит',основание.приметаУшла,основание);
 check('пересказ выписок рано не проходит, а с половины прочитанного — проходит',
  основание.рано===false&&основание.впору===true,основание);
 check('откуп без денег отказывает, и отказ называет цену вслух',
  основание.безДенег===false&&основание.золотоВслух,основание);
 check('второй путь нельзя применить дважды',основание.раз===true&&основание.два===false,основание);
 check('ни один отказ не молчит',!основание.молчит,основание);

 /* ── 7. Всё это слышно ── */
 const слышно=await page.evaluate(()=>{
  G.gold=100000;
  G.quests=[{id:"т_вид",npc:"Проверка",type:"craft",маст:"smith",need:2,have:0,done:false,
    race:G.race,text:"сделать две работы",reward:{gold:200,xp:100}},
   {id:"т_вид2",npc:"Проверка",type:"hoard",need:1,have:0,done:false,
    race:G.race,text:"взять клад",reward:{gold:200,xp:100}}];
  renderQuests();
  const html=document.getElementById("questList").innerHTML;
  const кнопки=[...document.getElementById("questList").querySelectorAll('[data-cmd^="qalt:"]')];
  const прогресс=["craft","study","trapwork","hoard"].map(t=>
   qProgressText({type:t,need:3,have:1,маст:"smith"}));
  return {кнопок:кнопки.length,
   озвучены:кнопки.every(b=>(b.getAttribute("data-speak")||"").length>25),
   цена:/\(\d+\)/.test(html),
   прогресс,безДыр:прогресс.every(p=>p&&!/undefined|NaN/.test(p))};});
 check('в окне дел у каждого дела стоит кнопка второго пути',слышно.кнопок===2,слышно);
 check('кнопка второго пути озвучена и называет цену',слышно.озвучены&&слышно.цена,слышно);
 /* Кнопка должна не «быть», а работать: нажатие закрывает дело вторым путём. */
 const нажатие=await page.evaluate(()=>{
  const b=document.querySelector('[data-cmd="qalt:т_вид"]');
  if(!b)return {нашлась:false};
  b.click();
  const q=(G.quests||[]).find(x=>x.id==="т_вид");
  return {нашлась:true,сдано:!!(q&&q.done),путь:q&&q.путь};});
 check('нажатие на кнопку второго пути и вправду закрывает дело',
  нажатие.нашлась&&нажатие.сдано&&нажатие.путь==="выкуп",нажатие);
 check('прогресс всех четырёх родов читается вслух без дыр',слышно.безДыр,слышно);

 const взятие=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.quests=[];
  /* Житель с делом про мир: кузнец у горна. */
  const n=getNPC(1000,1000,0,"Кузнец");n.prof="Кузнец";
  const q=worldQuestFor(n,0.05);
  G.quests.push(Object.assign({have:0,done:false,race:n.race},q));
  const текст=`${q.text} ${qProgressText(G.quests[0])}`;
  Speech.say=был;
  return {дыр:/undefined|NaN|\[object/.test(текст),текст:текст.slice(0,200)};});
 check('текст нового дела и его прогресс не содержат служебного мусора',!взятие.дыр,взятие);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
