/* ════════════════════════════════════════════════════════════════════════
   ГОРОДА ЗА ГРАНЬЮ, ПОГРАНИЧНЫЙ ЛЮД И ПЛАХА

   У тёмных земель была вера, была власть и была глубина — но не было
   городов: игрок ходил по пеплу от святилища к яме и ни разу не слышал
   улицы. Теперь у каждой из восьми империй стоит твердыня со своей сменой
   и гарнизоном, а между ними — посады.

   Разломы стояли пустые: шагнул — и ты за Гранью. Но дыра между мирами не
   бывает пустой: возле неё кормится пять сортов людей — контрабандист,
   сотник заставы, дезертир, приговорённый и отступник, — и все их дела
   связывают два мира.

   И наконец, у мира появилась цена за проступок. У каждого города есть
   день и час, когда вершат суд; за Гранью то же самое случается втрое чаще
   и куда хуже. Смотреть необязательно: можно выкупить, вмешаться, а за
   Гранью — принять долю.

   Здесь проверяется, что всё это есть, находится в мире, звучит по-своему
   и что ни один ответ не бесплатен.
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

 /* ── 1. У каждой империи стоит твердыня ── */
 const твердыни=await page.evaluate(()=>{
  G.dark=true;G.place=null;darkCache.clear();
  const беды=[];const имена=new Set();
  DARK_EMPIRES.forEach(e=>{
   const c=darkCell(e.cap.x,e.cap.y);
   if(!c.structure||c.structure.type!=="citadel")беды.push(e.id+": нет твердыни");
   else{имена.add(c.structure.name);
    if(PLACE_KIND[c.structure.type]!=="city")беды.push(e.id+": твердыня не город");
    if(c.structure.name.indexOf(e.n)<0)беды.push(e.id+": твердыня не названа империей");}});
  /* Посады разбросаны между твердынями. */
  let посадов=0;
  for(let x=200;x<1800;x+=11)for(let y=200;y<1800;y+=13){
   const c=darkCell(x,y);
   if(c.structure&&c.structure.type==="burg")посадов++;}
  const свойПол=(()=>{const было=new Set();
   ["citadel","burg","shrine","den","hold","bazaar"].forEach(st=>{
    G.place={kind:PLACE_KIND[st],bx:300,by:300,stype:st,depth:0,name:"м",x:1,y:1};
    было.add(roomKind());});
   G.place=null;return было.size;})();
  G.dark=false;
  return {беды:беды.slice(0,4),имён:имена.size,посадов,свойПол};});
 check('у каждой из восьми тёмных империй стоит своя твердыня',
  твердыни.беды.length===0&&твердыни.имён===8,твердыни);
 check('между твердынями разбросаны посады',твердыни.посадов>=6,твердыни.посадов);
 check('у твердыни и посада своя акустика, не как у святилища и притона',
  твердыни.свойПол===6,твердыни.свойПол);

 /* ── 2. Улицу за Гранью держат смена и гарнизон ── */
 const улица=await page.evaluate(()=>{
  G.dark=true;
  const имп=DARK_EMPIRES[0];
  G.place={kind:"city",bx:имп.cap.x,by:имп.cap.y,stype:"citadel",depth:0,
   name:"Твердыня",x:3,y:3};
  Actors.stop();Actors.spawn("проверка");
  const виды={};Actors.list.forEach(a=>{виды[a.kind]=(виды[a.kind]||0)+1;});
  const имена=Actors.list.map(a=>a.name);
  Actors.stop();
  /* В городе Грани гарнизона нет — там дозор и горожане. */
  G.dark=false;
  G.place={kind:"city",bx:500,by:500,stype:"castle",depth:0,name:"Цитадель",x:3,y:3};
  Actors.stop();Actors.spawn("проверка2");
  const светВиды={};Actors.list.forEach(a=>{светВиды[a.kind]=(светВиды[a.kind]||0)+1;});
  Actors.stop();G.place=null;
  return {виды,имена:[...new Set(имена)],светВиды,
   строк:{стража:DARK_GUARD_LINES.length,солдаты:DARK_SOLDIER_LINES.length,
    жители:DARK_FOLK_LINES.length}};});
 check('в твердыне стоит смена, гарнизон и те, кто ещё в списке',
  улица.виды.guard>=4&&улица.виды.soldier>=2&&улица.виды.folk>=2,улица.виды);
 check('за Гранью их и зовут иначе: латник смены, солдат гарнизона, житель посада',
  улица.имена.some(n=>/латник/i.test(n))&&улица.имена.some(n=>/солдат/i.test(n))&&
  улица.имена.some(n=>/житель/i.test(n)),улица.имена);
 check('в городе Грани гарнизона нет: там дозор и горожане',
  !улица.светВиды.soldier&&улица.светВиды.guard>=2,улица.светВиды);
 check('улица за Гранью говорит своими словами, и их много',
  улица.строк.стража>=5&&улица.строк.солдаты>=5&&улица.строк.жители>=5,улица.строк);

 /* ── 3. Схрон у разлома ── */
 const схрон=await page.evaluate(()=>{
  G.dark=false;G.place=null;contentCache.clear();
  /* Сперва ищем разломы, потом смотрим, что стоит рядом с каждым: так
     проверяется сама связь, а не удача выборки. */
  const разломы=[];
  for(let x=100;x<1900&&разломы.length<40;x+=3)
   for(let y=100;y<1900&&разломы.length<40;y+=7)
    if(safeFn(()=>riftAt(x,y),false))разломы.push({x,y});
  let схронов=0,рядом=0,имена=new Set(),свои=0;
  разломы.forEach(r=>{
   /* Схрон ставится в трёх шагах от разлома — там его и ищем. */
   const c=cellContent(r.x+SMUG_DX,r.y+SMUG_DY);
   if(!c.structure||c.structure.type!=="smugglers")return;
   схронов++;имена.add(c.structure.name);
   if(safeFn(()=>riftNear(c.x,c.y,5),false))рядом++;
   свои++;});
  /* И наоборот: ни один схрон не стоит там, где разлома рядом нет. */
  let сирот=0;
  for(let x=100;x<1900;x+=3)for(let y=100;y<1900;y+=53){
   const c=cellContent(x,y);
   if(c.structure&&c.structure.type==="smugglers"&&
      !safeFn(()=>riftAt(x-SMUG_DX,y-SMUG_DY),false))сирот++;}
  return {схронов,разломов:разломы.length,рядом,имён:имена.size,сирот,
   вид:PLACE_KIND.smugglers,профессий:(PROFS.smugglers||[]).length,
   людей:BORDER_FOLK.length};});
 check('схроны стоят в мире, и их не один-два',
  схрон.разломов>=20&&схрон.схронов>=8,схрон);
 check('каждый схрон стоит рядом с разломом, а не где придётся',
  схрон.схронов>0&&схрон.рядом===схрон.схронов&&схрон.сирот===0,схрон);
 check('схроны называются по-разному, и в них можно войти как в дом',
  схрон.имён>=3&&схрон.вид==="house",схрон);
 check('в схроне сидит пять сортов пограничного люда',
  схрон.профессий===5&&схрон.людей===5,схрон);

 /* ── 4. Дела пограничного люда связывают два мира ── */
 const дела=await page.evaluate(()=>{
  G.dark=false;G.place=null;
  const беды=[];
  BORDER_FOLK.forEach(б=>{
   if(!б.n||!б.о||б.о.length<20)беды.push(б.id+": не описан");
   if(!(б.строки||[]).length)беды.push(б.id+": молчит");
   if(!SOUND_BANK[б.голос]&&!BEACONS[б.голос])беды.push(б.id+": нет голоса "+б.голос);
   const пул=BORDER_DEEDS[б.id]||[];
   if(пул.length<3)беды.push(б.id+": меньше трёх дел");
   пул.forEach(д=>{if(!д.т||д.т.length<40)беды.push(б.id+": дело без слов");});});
  /* Заказчик с пометкой получает своё дело, а без пометки — обычное. */
  const свой=getNPC(600,600,0,"Контрабандист");
  const чужой=getNPC(600,600,0,"Фермер");
  const q1=safeFn(()=>questFor(свой),null);
  const q2=safeFn(()=>questFor(чужой),null);
  /* Типы дел разные: не одни «принеси три штуки». */
  const типы=new Set();
  BORDER_FOLK.forEach(б=>{
   for(let i=0;i<9;i++){
    const n=getNPC(600+i*13,600+i*7,0,б.n);
    const q=safeFn(()=>borderQuestFor(n),null);
    if(q)типы.add(q.type);}});
  return {беды:беды.slice(0,4),
   помечен:свой.border==="smuggler",неПомечен:!чужой.border,
   своёДело:!!(q1&&q1.граница),обычное:!!(q2&&!q2.граница),
   типов:[...типы]};});
 check('все пятеро описаны, говорят и звучат',дела.беды.length===0,дела.беды);
 check('пограничный люд помечен, и дело находит своего заказчика',
  дела.помечен&&дела.неПомечен&&дела.своёДело&&дела.обычное,дела);
 check('дела пограничного люда разных видов, а не одно на всех',
  дела.типов.length>=3,дела.типов);

 /* ── 5. Наказание: место и день дают одно и то же ── */
 const суд=await page.evaluate(()=>{
  G.dark=false;
  /* Ищем день, когда в этом городе судят: не каждый день судный. */
  let день=0;for(let d=1;d<=80&&!день;d++)if(punishAt(500,500,d))день=d;
  const a=punishAt(500,500,день),b=punishAt(500,500,день);
  let другой=0;for(let d=день+1;d<=день+80&&!другой;d++)if(punishAt(500,500,d))другой=d;
  const c=другой?punishAt(500,500,другой):null;
  /* За Гранью судят чаще. */
  let светлых=0,тёмных=0;
  for(let i=0;i<400;i++){G.dark=false;if(punishAt(100+i*3,200+i*7,5))светлых++;
   G.dark=true;if(punishAt(100+i*3,200+i*7,5))тёмных++;}
  G.dark=false;
  const беды=[];
  [["Грань",PUNISH_LIGHT],["Грань за",PUNISH_DARK]].forEach(([где,пул])=>{
   пул.forEach(п=>{
    if(!п.n||!п.вина||!п.как||п.как.length<30)беды.push(где+": "+п.id);
    if(!SOUND_BANK[п.звук]&&!BEACONS[п.звук])беды.push(где+" нет звука "+п.звук);
    if(!(п.ц>0)||!(п.тяж>=1&&п.тяж<=5))беды.push(где+" цена/тяжесть "+п.id);});});
  const идСвет=new Set(PUNISH_LIGHT.map(p=>p.id));
  const идТьма=new Set(PUNISH_DARK.map(p=>p.id));
  const общих=[...идСвет].filter(i=>идТьма.has(i)).length;
  return {день,другой,
   одинаково:!!(a&&b&&a.id===b.id&&a.час===b.час),
   другойДень:!!(a&&c)&&(a.id!==c.id||a.час!==c.час),
   светлых,тёмных,беды:беды.slice(0,4),
   видовСвет:PUNISH_LIGHT.length,видовТьма:PUNISH_DARK.length,общих};});
 check('наказание выводится из места и дня: его можно застать нарочно',
  суд.одинаково===true,суд);
 check('за Гранью судят заметно чаще, чем на Грани',
  суд.тёмных>суд.светлых*2,{светлых:суд.светлых,тёмных:суд.тёмных});
 check('видов наказания много, все описаны и звучат',
  суд.видовСвет>=8&&суд.видовТьма>=12&&суд.беды.length===0,суд.беды.length?суд.беды:
  {свет:суд.видовСвет,тьма:суд.видовТьма});
 check('за Гранью наказывают не тем же, чем на Грани',суд.общих===0,суд.общих);

 /* ── 6. Площадь: четыре ответа, и ни один не бесплатный ── */
 const площадь=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.punished={};G.gold=100000;G.hp=G.hpMax=500;G.inCombat=false;
  /* Ищем город и день, когда там судят. */
  let нашли=null;
  for(let d=1;d<=60&&!нашли;d++){
   const п=punishAt(500,500,d);
   if(п)нашли={d,п};}
  if(!нашли)return {нет:true};
  G.day=нашли.d;G.hour=нашли.п.час;
  G.place={kind:"city",bx:500,by:500,stype:"castle",depth:0,name:"Цитадель",x:3,y:3};
  const идёт=!!punishHere()&&!punishHere().поздно;
  const доступно={площадь:amAvailable("punish"),выкуп:amAvailable("punishransom"),
   сила:amAvailable("punishbreak"),доля:amAvailable("punishshare")};
  window.__said=[];
  safeFn(()=>punishLook());
  const слова=речь();
  /* Выкуп стоит золота и запоминается. */
  const золотоДо=G.gold;
  safeFn(()=>punishRansom());
  const золотоПосле=G.gold;
  const кончено=!!(punishHere()||{}).кончено;
  /* Второй раз в тот же день — уже не судят. */
  window.__said=[];
  const повтор=safeFn(()=>punishRansom(),null);
  const словаПовтора=речь();
  /* Не тот час — опоздали. */
  G.punished={};G.hour=(нашли.п.час+6)%24;
  const поздно=!!(punishHere()||{}).поздно;
  while(activeLayer())closeTopUI();G.place=null;
  return {день:нашли.d,час:нашли.п.час,идёт,доступно,
   слова:слова.slice(0,260),потрачено:золотоДо-золотоПосле,кончено,
   повтор:повтор===false,словаПовтора:словаПовтора.slice(0,120),поздно};});
 check('в городе бывает день и час, когда судят',
  !площадь.нет&&площадь.идёт===true,площадь.день);
 check('пока суд идёт, в меню есть площадь, выкуп и вмешательство',
  площадь.доступно&&площадь.доступно.площадь&&площадь.доступно.выкуп&&
  площадь.доступно.сила,площадь.доступно);
 check('доли на Грани не берут: этот ответ есть только за Гранью',
  площадь.доступно&&площадь.доступно.доля===false,площадь.доступно);
 check('площадь называет вину, способ и цену выкупа',
  /вина/i.test(площадь.слова||'')&&/золот/i.test(площадь.слова||''),
  (площадь.слова||'').slice(0,200));
 check('выкуп стоит золота и закрывает суд на этот день',
  площадь.потрачено>0&&площадь.кончено===true,
  {потрачено:площадь.потрачено,кончено:площадь.кончено});
 check('второй раз в тот же день выкупать некого',
  площадь.повтор===true&&/кончено|некого/i.test(площадь.словаПовтора||''),
  площадь.словаПовтора);
 check('не в тот час — опоздали, и это сказано словами',площадь.поздно===true);

 /* ── 7. Вмешательство и доля ── */
 const ответы=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  /* Вмешательство на Грани: драка со стражей и потеря доброго имени. */
  G.dark=false;G.punished={};G.hp=G.hpMax=900;G.inCombat=false;G.combat=null;
  let св=null;for(let d=1;d<=60&&!св;d++){const п=punishAt(500,500,d);if(п)св={d,п};}
  G.day=св.d;G.hour=св.п.час;
  G.place={kind:"city",bx:500,by:500,stype:"castle",depth:0,name:"Цитадель",x:3,y:3};
  const раса=safeFn(()=>raceHere(),null);
  const репДо=раса?repOf(раса):0;
  safeFn(()=>punishBreak());
  const бой=!!G.inCombat,враг=G.combat&&G.combat.m&&G.combat.m.n;
  const репПосле=раса?repOf(раса):0;
  safeFn(()=>{G.inCombat=false;G.combat=null;});
  while(activeLayer())closeTopUI();
  /* Доля за Гранью: здоровьем вперёд, золотом и верой после. */
  G.dark=true;G.punished={};G.hp=G.hpMax=900;G.gold=0;G.darkFaith={};
  const имп=DARK_EMPIRES[0];
  let т=null;for(let d=1;d<=30&&!т;d++){const п=punishAt(имп.cap.x,имп.cap.y,d);if(п)т={d,п};}
  G.day=т.d;G.hour=т.п.час;
  G.place={kind:"city",bx:имп.cap.x,by:имп.cap.y,stype:"citadel",depth:0,
   name:"Твердыня",x:3,y:3};
  const доляЕсть=amAvailable("punishshare");
  const hpДо=G.hp;
  safeFn(()=>punishShare());
  const итог={бой,враг,репДо,репПосле,доляЕсть,
   здоровьеВзяли:hpДо-G.hp,золото:G.gold,
   вера:Object.values(G.darkFaith||{}).reduce((a,b)=>a+b,0)};
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.punished={};
  return итог;});
 check('вмешательство на Грани — настоящая драка со стражей помоста',
  ответы.бой===true&&/стража|смена/i.test(ответы.враг||''),
  {бой:ответы.бой,враг:ответы.враг});
 check('за вмешательство народ спрашивает: доброе имя падает',
  ответы.репПосле<ответы.репДо,{до:ответы.репДо,после:ответы.репПосле});
 check('доля есть только за Гранью, и она берётся здоровьем',
  ответы.доляЕсть===true&&ответы.здоровьеВзяли>0,ответы);
 check('за долю платят золотом, и тёмный бог становится ближе',
  ответы.золото>0&&ответы.вера>0,{золото:ответы.золото,вера:ответы.вера});

 /* ── 8. Отсуженное помнится, но недолго, и чинится ── */
 const память=await page.evaluate(()=>{
  G.dark=false;G.day=50;G.punished={};
  G.place={kind:"city",bx:500,by:500,stype:"castle",depth:0,name:"Ц",x:1,y:1};
  safeFn(()=>markPunishDone());
  const своё=Object.keys(G.punished).length;
  G.punished["9,9,3,l"]=1;
  safeFn(()=>pruneState(false));
  const осталось=Object.keys(G.punished);
  G.punished="сломано";
  safeFn(()=>GameIntegrity.repair());
  const починено=G.punished&&typeof G.punished==="object"&&!Array.isArray(G.punished);
  G.punished={};G.place=null;
  return {своё,осталось,починено};});
 check('отсуженное сегодня помнится, а позавчерашнее забывается',
  память.своё===1&&память.осталось.length===1&&
  память.осталось[0].indexOf(",50,")>0,память);
 check('битая запись о суде чинится, а не роняет игру',память.починено===true);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
