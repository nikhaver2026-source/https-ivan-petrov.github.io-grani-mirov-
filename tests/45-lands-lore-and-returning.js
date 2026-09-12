/* ════════════════════════════════════════════════════════════════════════
   МОЛВА О ЗЕМЛЯХ: МИР, КОТОРЫЙ УЗНАЮТ И К КОТОРОМУ ВОЗВРАЩАЮТСЯ

   Мир был огромен и совершенно безымянен. Игрок помнил дорогу только
   ногами: вышел из деревни, прошёл десять шагов — и деревни больше нет
   нигде, кроме его собственной памяти. Спросить дорогу было не у кого:
   жители рассказывали байки, но не про соседние земли. Возвращаться было
   некуда и незачем.

   Теперь знание о землях собирается. Вошёл в постройку — она записана как
   виденная своими глазами, вместе с промыслом. Расспросил трактирщика,
   странника или стражу — они назовут ближнее место, которого вы ещё не
   знаете, и оно ляжет в молву как услышанное. Окно «Молва о землях»
   держит всё это списком от ближнего к дальнему: что за место, чем живёт,
   чем там торгуют, сколько до него шагов и в какой стороне — и подаёт
   маяк с той стороны.

   Здесь проверяется, что знание действительно собирается, не врёт, не
   повторяется, переживает запись и что окно доступно на слух.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Вход в постройку — это знание о ней ── */
 const вход=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};G.place=null;G.ship=null;G.x=1000;G.y=1000;
  enterPlace({x:1004,y:997,structure:{type:"village",name:"Ольховка",beacon:"village"}});
  while(activeLayer())closeTopUI();G.place=null;
  const z=knownList()[0]||null;
  /* Второй вход в то же место не заводит второй записи. */
  enterPlace({x:1004,y:997,structure:{type:"village",name:"Ольховка",beacon:"village"}});
  while(activeLayer())closeTopUI();G.place=null;
  return {мест:knownList().length,запись:z,
   расстояние:z&&z.d,сторона:z&&z.dir};});
 check('вход в постройку записывает её в молву как виденную своими глазами',
  вход.мест===1&&!!вход.запись&&вход.запись.был===true,вход);
 check('в записи есть вид места, его промысел, сторона и расстояние',
  !!вход.запись&&!!вход.запись.вид&&!!вход.запись.промысел&&
  вход.расстояние>0&&/север|юг|восток|запад/.test(вход.сторона||""),вход.запись);
 check('повторный приход не заводит второй записи о том же месте',
  вход.мест===1,{мест:вход.мест});

 /* ── 2. Молва от жителя ── */
 const молва=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};G.place=null;G.x=1000;G.y=1000;G.rep={};
  const teller=getNPC(G.x,G.y,0,"Трактирщик");
  const кузнец=getNPC(G.x,G.y,0,"Кузнец");
  window.__said=[];
  const ok=askAboutLands(teller.key);
  const сказано=речь();
  const после=knownList();
  window.__said=[];
  const отказ=кузнец?askAboutLands(кузнец.key):null;
  const словоОтказа=речь();
  return {рассказал:ok,мест:после.length,слышанное:после.filter(z=>!z.был).length,
   назвал:!!(после[0]&&сказано.includes(после[0].name)),
   сторонаВСлове:/север|юг|восток|запад|шаг/.test(сказано),
   кузнецРассказал:отказ,словоОтказа:словоОтказа.slice(0,90),
   ктоРассказывает:LANDS_TELLERS.length};});
 check('житель дорог рассказывает о ближней земле, и она ложится в молву',
  молва.рассказал===true&&молва.мест===1&&молва.слышанное===1,молва);
 check('в рассказе названы место, сторона и расстояние',
  молва.назвал===true&&молва.сторонаВСлове===true,молва);
 check('кузнец о дальних землях не рассказывает, и это объясняется',
  молва.кузнецРассказал===false&&/не рассказывает|не его дело/.test(молва.словоОтказа),
  {ответ:молва.словоОтказа});

 /* ── 3. Молва не повторяется и не врёт ── */
 const повтор=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};G.x=1000;G.y=1000;
  const teller=getNPC(G.x,G.y,0,"Трактирщик");
  const названные=[];
  for(let i=0;i<6;i++){
   const было=knownList().length;
   safeFn(()=>askAboutLands(teller.key));
   const стало=knownList();
   if(стало.length>было)названные.push(стало.find(z=>!z.был&&!названные.some(n=>n.x===z.x&&n.y===z.y)));}
  const список=knownList().filter(z=>!z.был);
  /* Всё названное действительно стоит на тех клетках, где сказано. */
  const врёт=список.filter(z=>{
   const c=safeFn(()=>cellContent(z.x,z.y),null);
   return !c||!c.structure||c.structure.name!==z.name;});
  const ключи=Object.keys(G.known);
  return {названо:список.length,врёт:врёт.map(z=>z.name).slice(0,3),
   безПовторов:ключи.length===new Set(ключи).size&&ключи.length===список.length};});
 check('за несколько расспросов молва прибавляет разные места',
  повтор.названо>=2,{названо:повтор.названо});
 check('всё, что названо молвой, действительно стоит на своей клетке',
  повтор.врёт.length===0,повтор.врёт);

 /* ── 4. Слышанное становится виденным, когда дошли ── */
 const дошли=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};G.x=1000;G.y=1000;
  notePlace(1010,1010,"tavern","Кривой ковш","молва");
  const до=knownList()[0];
  enterPlace({x:1010,y:1010,structure:{type:"tavern",name:"Кривой ковш",beacon:"tavern"}});
  while(activeLayer())closeTopUI();G.place=null;
  const после=knownList()[0];
  return {до:до&&до.был,после:после&&после.был,мест:knownList().length};});
 check('дошли до слышанного — запись становится виденной, а не второй',
  дошли.до===false&&дошли.после===true&&дошли.мест===1,дошли);

 /* ── 5. Окно молвы ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};G.x=1000;G.y=1000;
  notePlace(1004,1000,"village","Ольховка","был");
  notePlace(1000,1030,"forge","Три искры","молва");
  notePlace(1000,1012,"temple","Тихий Порог","молва");
  window.__said=[];
  CMD.known();
  const строки=[...document.querySelectorAll("#knownList .list-line")].map(e=>e.textContent.replace(/\s+/g," ").trim());
  const порядок=knownList().map(z=>z.d);
  const кнопка=document.querySelector('#knownList button[data-cmd^="knownping"]');
  window.__said=[];
  if(кнопка)activateElement(кнопка);
  const маяк=речь();
  const слой=activeLayer()&&activeLayer().id;
  while(activeLayer())closeTopUI();
  return {слой,строк:строки.length,
   поПорядку:порядок.every((d,i)=>i===0||d>=порядок[i-1]),
   видели:строки.some(t=>/видели сами/.test(t)),
   маяк:маяк.slice(0,120),
   естьКнопки:document.querySelectorAll("#knownList button").length};});
 check('окно молвы открывается и перечисляет известные места',
  окно.слой==="modal-known"&&окно.строк>=4,окно);
 check('места идут от ближнего к дальнему',окно.поПорядку===true,окно);
 check('окно считает, сколько мест видели своими глазами',окно.видели===true,окно);
 check('по строке места можно подать маяк с его стороны',
  /шаг|здесь/.test(окно.маяк),{маяк:окно.маяк});

 /* ── 6. Пустая молва не молчит ── */
 const пусто=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};window.__said=[];
  CMD.known();
  const t=речь();
  const строк=document.querySelectorAll("#knownList .list-line").length;
  while(activeLayer())closeTopUI();
  return {сказано:t.slice(0,140),строк};});
 check('пустая молва объясняет, как её наполнить',
  /Молва о землях пуста|расспрашивайте/i.test(пусто.сказано)&&пусто.строк===1,пусто);

 /* ── 7. Знание переживает запись и починку ── */
 const запись=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.known={};
  notePlace(1004,1000,"village","Ольховка","был");
  notePlace(1000,1030,"forge","Три искры","молва");
  const было=knownList().length;
  saveGame(true);
  G.known={};
  loadGame(true);
  const стало=knownList().length;
  const видели=knownList().filter(z=>z.был).length;
  /* Порча записи не роняет игру. */
  G.known="ерунда";
  const чинит=safeFn(()=>GameIntegrity.repair(),false);
  const после=safeFn(()=>knownList().length,-1);
  return {было,стало,видели,чинит,после};});
 check('молва переживает запись и загрузку',
  запись.было===2&&запись.стало===2&&запись.видели===1,запись);
 check('испорченная молва чинится, а не роняет игру',
  запись.после===0,запись);

 /* ── 8. Прополка не трогает того, где были сами ── */
 const прополка=await page.evaluate(()=>{
  G.known={};
  for(let i=0;i<520;i++)notePlace(1200+i,1300,"village","Слух "+i,"молва");
  notePlace(999,999,"castle","Своими глазами","был");
  const до=Object.keys(G.known).length;
  pruneState(false);
  const после=Object.keys(G.known).length;
  const свои=knownList().filter(z=>z.был).map(z=>z.name);
  G.known={};
  return {до,после,свои};});
 check('молва не растёт без предела, но виденное своими глазами не стирается',
  прополка.после<=500&&прополка.после<прополка.до&&
  прополка.свои.indexOf("Своими глазами")>=0,прополка);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
