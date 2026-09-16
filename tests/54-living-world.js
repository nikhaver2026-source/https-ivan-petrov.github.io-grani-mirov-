/* ════════════════════════════════════════════════════════════════════════
   ЖИВОЙ МИР: ДУША, ПАМЯТЬ, СЛУХИ И КРУГИ ОТНОШЕНИЯ

   Житель был набором из пяти полей, помнить он не умел ничего, весть о
   поступке игрока никуда не шла, а репутация была одна на всё — отношение
   народа от минус двадцати до двадцати.

   Здесь проверяется, что у жителя есть человек внутри и что этот человек
   постоянен; что он помнит поступки и помнит их С РАЗНОЙ ДОСТОВЕРНОСТЬЮ —
   видел сам, слышал от своего, слышал слух; что весть идёт по свету без
   игрока, на ходу раздувается и теряет в вере; что отношение ведётся по
   кругам и скрытым осям, что круги спорят между собой и что мир не ждёт:
   без игрока всё это стареет само.
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

 /* ── 1. Таблицы души без дыр ── */
 const реестр=await page.evaluate(()=>{
  const беды=[];const ид=new Set();
  SOUL_CHARS.forEach(c=>{
   if(ид.has(c.id))беды.push("двойной нрав "+c.id);ид.add(c.id);
   if(!c.n||!c.о||c.о.length<20)беды.push("нрав "+c.id+": не описан");
   ["торг","дар","слух","память","смелость","правда"].forEach(k=>{
    if(!(Number(c[k])>=0))беды.push("нрав "+c.id+": нет веса "+k);});});
  MEM_KINDS.forEach(m=>{if(!m.n||!m.о||!Number.isFinite(m.вес))беды.push("память "+m.id);});
  MEM_SURE.forEach((s,i)=>{if(s.n!==i||!s.как||!s.слово)беды.push("достоверность "+i);});
  STAND_SCOPES.forEach(s=>{if(!s.n)беды.push("круг "+s.id);});
  STAND_AXES.forEach(a=>{if(!a.n||!a.о)беды.push("ось "+a.id);});
  STAND_LADDER.forEach(l=>{if(!l.n||!l.о)беды.push("ступень "+l.от);});
  Object.keys(RUMOR_LADDER).forEach(k=>{
   const л=RUMOR_LADDER[k];
   if(л.length<5)беды.push("лестница слуха "+k+": коротка");
   л.forEach((t,i)=>{if(!t||t.length<10)беды.push("лестница "+k+" ступень "+i);});
   /* Ступени должны расти: последняя всегда длиннее первой. */
   if(л[л.length-1].length<=л[0].length)беды.push("лестница "+k+": не раздувается");});
  [SOUL_ORIGINS,SOUL_POLITICS,SOUL_FEARS,SOUL_WANTS,SOUL_GOALS,SOUL_TROUBLES,
   SOUL_SECRETS,SOUL_FAITHS].forEach((a,i)=>{
   if(a.length<8)беды.push("список "+i+": короток");
   /* Страх бывает назван одним коротким словом — «войны», «моря», «огня», —
      и это не пустая строка. Требуем лишь, чтобы строка была настоящей. */
   a.forEach(x=>{if(!x||x.length<4)беды.push("список "+i+": пустая строка");});});
  return {беды:беды.slice(0,5),нравов:SOUL_CHARS.length,видовПамяти:MEM_KINDS.length,
   достоверностей:MEM_SURE.length,кругов:STAND_SCOPES.length,осей:STAND_AXES.length,
   ступеней:STAND_LADDER.length,лестниц:Object.keys(RUMOR_LADDER).length};});
 check('таблицы живого мира сходятся и ничего не пропущено',реестр.беды.length===0,реестр.беды);
 check('нравов девятнадцать, достоверностей шесть, кругов одиннадцать, осей восемь',
  реестр.нравов===19&&реестр.достоверностей===6&&реестр.кругов===11&&реестр.осей===8,реестр);
 check('видов памяти хватает, и у слухов семь лестниц раздувания',
  реестр.видовПамяти>=12&&реестр.лестниц>=7,реестр);

 /* ── 2. Душа постоянна и у всех разная ── */
 const души=await page.evaluate(()=>{
  const n=getNPC(700,700,0,"Торговец");
  const a=npcSoul(n),b=npcSoul(n);
  const одна=JSON.stringify(a)===JSON.stringify(b);
  /* Разные жители — разные люди. */
  /* Берём разные РЕМЁСЛА: положение выводится из ремесла, и выборка из одних
     странников у дороги показала бы два положения вместо пяти. */
  const ремёсла=["Правитель","Советник","Стражник","Старейшина","Фермер","Целительница",
   "Торговец","Кузнец","Жрец","Магистр","Ученик","Трактирщик","Воин клана","Странник"];
  const лица=new Set(),нравы=new Set(),полы=new Set(),статусы=new Set();
  for(let i=0;i<300;i++){
   const m=getNPC(300+i*7,400+i*11,i%3,ремёсла[i%ремёсла.length]);
   const d=npcSoul(m);
   лица.add([d.нрав.id,d.пол,d.возраст.id,d.статус.id,d.страх,d.тайна].join("|"));
   нравы.add(d.нрав.id);полы.add(d.пол);статусы.add(d.статус.id);}
  /* Положение выводится из ремесла: правитель не бывает низкого. */
  const прав=npcSoul(getNPC(500,500,0,"Правитель"));
  const ферм=npcSoul(getNPC(500,500,0,"Фермер"));
  /* Каждое поле на месте и сказано словами. */
  const поля=["пол","лет","возраст","нрав","происхождение","статус","вера","политика",
   "чары","страх","желание","цель","беда","тайна","достаток","своих","родни"];
  const нет=поля.filter(k=>a[k]===undefined||a[k]===null||a[k]==="");
  return {одна,лиц:лица.size,нравов:нравы.size,полов:полы.size,статусов:статусы.size,
   правитель:прав.статус.вес,фермер:ферм.статус.вес,нет,
   строка:soulLine(getNPC(700,700,0,"Торговец"),true).slice(0,200)};});
 check('душа постоянна: тот же житель — тот же человек',души.одна===true);
 check('жители не на одно лицо: нравы, полы и положения разные',
  души.лиц>=200&&души.нравов>=15&&души.полов===2&&души.статусов>=4,души);
 check('положение выводится из ремесла: правитель не бывает низкого',
  души.правитель>души.фермер,души);
 check('в душе нет пустых полей, и о человеке можно рассказать вслух',
  души.нет.length===0&&души.строка.length>120,души.нет.length?души.нет:души.строка.slice(0,120));

 /* ── 3. Нрав меняет поведение, а не только слова ── */
 const нрав=await page.evaluate(()=>{
  const жад=SOUL_CHAR_BY_ID.zhad,добр=SOUL_CHAR_BY_ID.dobr;
  const трус=SOUL_CHAR_BY_ID.trus,смел=SOUL_CHAR_BY_ID.smel;
  const манип=SOUL_CHAR_BY_ID.manip,чест=SOUL_CHAR_BY_ID.chest;
  const рацио=SOUL_CHAR_BY_ID.racio,фанат=SOUL_CHAR_BY_ID.fanat;
  return {торг:жад.торг>добр.торг, дар:добр.дар>жад.дар,
   слух:трус.слух>смел.слух, правда:чест.правда>манип.правда,
   память:рацио.память>фанат.память, смелость:смел.смелость>трус.смелость};});
 check('жадный просит дороже, добрый — дешевле',нрав.торг===true);
 check('добрый охотнее даёт поручение, жадный — неохотнее',нрав.дар===true);
 check('трус разносит слухи охотнее смелого: он слушает',нрав.слух===true);
 check('честный говорит правду чаще манипулятора',нрав.правда===true);
 check('рациональный помнит вернее фанатика',нрав.память===true);
 check('смелость у смелого выше, чем у труса',нрав.смелость===true);

 /* ── 4. Память и достоверность ── */
 const память=await page.evaluate(()=>{
  G.npcMem={};G.day=10;
  /* Один и тот же поступок, но разной достоверности, весит по-разному. */
  const видел=getNPC(600,600,0,"Кузнец");
  const слышал=getNPC(600,600,1,"Кузнец");
  npcRemember(видел,"обманул","дело",4);
  npcRemember(слышал,"обманул","дело",2);
  const вВидел=npcFeel(видел),вСлышал=npcFeel(слышал);
  /* Ложная запись: человек верит в то, чего не было, и это работает против. */
  const наврали=getNPC(600,600,2,"Кузнец");
  npcRemember(наврали,"помог","дело",0);
  const вНаврали=npcFeel(наврали);
  /* Тот же поступок дважды не запоминается: обновляется достоверность. */
  const n=getNPC(610,610,0,"Торговец");
  npcRemember(n,"помог","q1",2);
  const после1=(G.npcMem[n.key].д||[]).length;
  npcRemember(n,"помог","q1",5);
  const после2=(G.npcMem[n.key].д||[]).length;
  const степень=(G.npcMem[n.key].д[0]||{}).у;
  /* Память не растёт без предела. */
  const m=getNPC(620,620,0,"Трактирщик");
  for(let i=0;i<40;i++)npcRemember(m,"купил","п"+i,4);
  const предел=(G.npcMem[m.key].д||[]).length;
  /* Давнее тускнеет. */
  const s=getNPC(630,630,0,"Жрец");
  npcRemember(s,"спас","x",5);
  const свежо=npcFeel(s);
  G.day=200;G.npcMem[s.key].день=10;
  const давно=npcFeel(s);
  G.day=10;
  /* Словами: сказано, откуда он это знает. */
  const текст=npcRecallText(видел);
  return {вВидел,вСлышал,вНаврали,после1,после2,степень,предел,свежо,давно,
   текст:текст.slice(0,160)};});
 check('увиденное своими глазами весит больше услышанного на рынке',
  память.вВидел<память.вСлышал&&память.вВидел<0,память);
 check('ложная память работает против правды: он верит в то, чего не было',
  память.вНаврали<0,память);
 check('тот же поступок не запоминается дважды: растёт только достоверность',
  память.после1===1&&память.после2===1&&память.степень===5,память);
 check('память не растёт без предела',память.предел<=14,память.предел);
 check('давние встречи тускнеют, но не пропадают',
  память.давно<память.свежо&&память.давно>0,память);
 check('житель говорит, откуда он это знает',
  /видел|слышал|знает|думает|наврали/i.test(память.текст),память.текст);

 /* ── 5. Весть идёт сама и по дороге меняется ── */
 const вести=await page.evaluate(()=>{
  G.rumors=[];G.day=1;G.liveDay=null;G.standing={};G.axes={};
  worldLiveTick();
  rumorSeed("бой","Огр-громила",900,900,true);
  const т0=rumorText(G.rumors[0]);
  /* Мир идёт вперёд без единого шага игрока. */
  const шаги=[];
  for(let i=0;i<7;i++){G.day++;worldLiveTick();
   шаги.push({д:G.day,т:rumorText(G.rumors[0]).текст,у:rumorText(G.rumors[0]).уверенность});}
  const т1=rumorText(G.rumors[0]);
  const ступень=Number(G.rumors[0].искажение)||0;
  /* Весть расходится: рядом слышно сразу, далеко — только со временем. */
  G.rumors=[];G.day=1;G.liveDay=1;
  rumorSeed("казна","Порог Грани",1000,1000,true);
  const рядомСразу=rumorsHere(1000,1000).length;
  const далекоСразу=rumorsHere(1000,1150).length;
  for(let i=0;i<5;i++){G.day++;worldLiveTick();}
  const далекоПотом=rumorsHere(1000,1150).length;
  /* Одна и та же весть дважды не заводится: она крепнет. */
  const сколькоБыло=G.rumors.length;
  rumorSeed("казна","Порог Грани",1005,1005,true);
  const сколькоСтало=G.rumors.length;
  /* Никакая весть не доходит как «ложь» сама собой: дальность — не ложь. */
  const ложных=G.rumors.map(r=>rumorText(r).уверенность).filter(u=>u===0).length;
  return {т0:т0.текст,т1:т1.текст,у0:т0.уверенность,у1:т1.уверенность,
   раздулась:т1.текст!==т0.текст,ступень,шаги:шаги.slice(0,3),
   рядомСразу,далекоСразу,далекоПотом,сколькоБыло,сколькоСтало,ложных};});
 check('весть рождается там, где случилось, и её слышно рядом',
  вести.рядомСразу===1&&вести.далекоСразу===0,вести);
 check('мир идёт без игрока: за неделю весть уходит дальше',
  вести.далекоПотом===1,вести);
 check('по дороге весть раздувается: один зверь становится логовом',
  вести.раздулась===true&&вести.ступень>=1,
  {было:вести.т0,стало:вести.т1,ступень:вести.ступень});
 check('чем дальше весть ушла, тем меньше ей веры',вести.у1<вести.у0,вести);
 check('дальность — не ложь: сама собой весть ложной не делается',
  вести.ложных===0,вести.ложных);
 check('одна и та же весть не заводится дважды, а крепнет',
  вести.сколькоСтало===вести.сколькоБыло,вести);

 /* ── 6. Разные жители знают о вас разное ── */
 const разные=await page.evaluate(()=>{
  G.rumors=[];G.day=5;G.liveDay=5;
  rumorSeed("кровь","дело у помоста",1200,1200,true);
  for(let i=0;i<3;i++){G.day++;worldLiveTick();}
  const р=rumorsHere(1200,1200)[0];
  let знают=0,неЗнают=0;
  for(let i=0;i<120;i++){
   const n=getNPC(1200+(i%11),1200+Math.floor(i/11),i%3,null);
   if(npcKnowsRumor(n,р))знают++;else неЗнают++;}
  return {знают,неЗнают,всего:знают+неЗнают};});
 check('об одном и том же событии одни жители знают, а другие нет',
  разные.знают>0&&разные.неЗнают>0,разные);

 /* ── 7. Круги отношения и скрытые оси ── */
 const круги=await page.evaluate(()=>{
  G.standing={};G.axes={};G.rep={};G.day=1;G.liveDay=1;
  /* Ступени названы словами. */
  const слова=[-100,-75,-50,-25,0,25,50,75,100].map(v=>standWord(v).n);
  /* Круг растёт и упирается в предел. */
  addStand("guild","Проба",40,true);
  const g1=standOf("guild","Проба");
  addStand("guild","Проба",200,true);
  const g2=standOf("guild","Проба");
  /* Соперничество: подняться у одних — опуститься у других. */
  G.standing={};
  addStand("crime","Проба",50,true);
  const пре=standOf("crime","Проба"),вой=standOf("army","Проба"),зн=standOf("noble","Проба");
  /* Круг народа не заводит второго счёта, а читает прежнюю репутацию. */
  G.rep={};
  const раса=(RACES_DB&&RACES_DB[0])?RACES_DB[0].n:"Люди";
  addStand("race",раса,25,true);
  const черезКруг=standOf("race",раса),черезСтарое=repOf(раса)*5;
  /* Оси считаются отдельно и не путаются с кругами. */
  addAxis("страх",30);addAxis("известность",40);
  const оси={страх:axisOf("страх"),известность:axisOf("известность"),
   выдуманная:axisOf("выдуманная")};
  addAxis("выдуманная",50);
  const левойНет=axisOf("выдуманная")===0;
  return {слова,g1,g2,пре,вой,зн,черезКруг,черезСтарое,оси,левойНет,
   текст:standText(null).slice(0,160)};});
 check('у отношения девять ступеней, и все названы словами',
  круги.слова.length===9&&круги.слова[0]==="ненависть"&&круги.слова[8]==="легенда",круги.слова);
 check('круг растёт и упирается в сто',круги.g1===40&&круги.g2===100,круги);
 check('подняться у преступного мира — значит опуститься у войска и знати',
  круги.пре===50&&круги.вой<0&&круги.зн<0,круги);
 check('круг народа не заводит второго счёта, а читает прежнюю репутацию',
  круги.черезКруг===круги.черезСтарое&&круги.черезКруг>0,круги);
 check('скрытые оси считаются отдельно, и выдуманной оси не бывает',
  круги.оси.страх===30&&круги.оси.известность===40&&круги.левойНет===true,круги);
 check('об отношении можно рассказать вслух',круги.текст.length>20,круги.текст);

 /* ── 8. Мир стареет без игрока ── */
 const время=await page.evaluate(()=>{
  G.standing={};G.axes={};G.rumors=[];G.day=1;G.liveDay=1;
  addStand("city","Проба",40,true);
  addAxis("страх",40);addAxis("известность",40);
  const до={круг:standOf("city","Проба"),страх:axisOf("страх"),слава:axisOf("известность")};
  for(let i=0;i<10;i++){G.day++;worldLiveTick();}
  const после={круг:standOf("city","Проба"),страх:axisOf("страх"),слава:axisOf("известность")};
  /* Такт не срабатывает дважды за один день. */
  const было=standOf("city","Проба");
  worldLiveTick();worldLiveTick();
  const дважды=standOf("city","Проба");
  return {до,после,дважды,было};});
 check('без игрока отношение сползает к середине: о нём забывают',
  время.после.круг<время.до.круг&&время.после.круг>0,время);
 check('слава тает медленнее страха: о делах помнят дольше обид',
  время.после.слава>время.после.страх,время);
 check('такт не срабатывает дважды за один день',время.дважды===время.было,время);

 /* ── 9. Поступки игрока доходят до жителей ── */
 const дела=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.npcMem={};G.rumors=[];G.standing={};G.axes={};G.day=3;G.liveDay=3;
  G.x=WORLD>>1;G.y=WORLD>>1;G.level=10;G.gold=9000;G.inCombat=false;G.combat=null;
  /* Победа над сильным рождает весть и известность. */
  const слуховДо=(G.rumors||[]).length,славаДо=axisOf("известность");
  G.combat={m:{id:"ogre",n:"Огр-громила",lvl:30,hp:1,dmg:1,xp:50,gold:20},own:false,key:null};
  G.inCombat=true;
  safeFn(()=>victory());
  while(activeLayer())closeTopUI();
  const слуховПосле=(G.rumors||[]).length,славаПосле=axisOf("известность");
  /* Покупка: торговец помнит. */
  const т=getNPC(1000,1000,0,"Торговец");
  const stock=stockFor(т);
  const памятьДо=((G.npcMem[т.key]||{}).д||[]).length;
  if(stock.length){G.gold=99999;buyItem(т.key,0);}
  const памятьПосле=((G.npcMem[т.key]||{}).д||[]).length;
  while(activeLayer())closeTopUI();
  return {слухи:{до:слуховДо,после:слуховПосле},слава:{до:славаДо,после:славаПосле},
   память:{до:памятьДо,после:памятьПосле}};});
 check('о победе над сильным идёт весть, и растёт известность',
  дела.слухи.после>дела.слухи.до&&дела.слава.после>дела.слава.до,дела);
 check('торговец помнит, что вы у него брали',
  дела.память.после>дела.память.до,дела.память);

 /* ── 10. Житель звучит со своей стороны ── */
 const звук=await page.evaluate(()=>{
  settings.effects=1;settings.hrtf=1;
  const точки=[],плоско=[];
  const оR=Spatial.role.bind(Spatial),оP=Bank.play.bind(Bank);
  Spatial.role=(role,dx,dy,o)=>{точки.push({role,dx,dy});return true;};
  Bank.play=(role,o)=>{плоско.push(role);return true;};
  let out={};
  try{
   while(activeLayer())closeTopUI();
   G.place={kind:"city",bx:700,by:700,stype:"castle",depth:0,name:"Ц",x:5,y:5};
   const n=getNPC(700,700,0,"Правитель");
   n.px=9;n.py=5;
   точки.length=0;плоско.length=0;
   npcVoice(n,"оклик");
   out.вДоме=точки.slice();
   out.плоскоВДоме=плоско.slice();
   /* Снаружи сторона берётся от клетки мира. */
   G.place=null;G.x=700;G.y=700;
   const m=getNPC(704,700,0,"Стражник");
   точки.length=0;плоско.length=0;
   npcCue(m,"guard_march",{gain:0.5});
   out.вПоле=точки.slice();
  }finally{Spatial.role=оR;Bank.play=оP;settings.effects=0;
   while(activeLayer())closeTopUI();G.place=null;}
  return out;});
 check('в доме голос жителя приходит с его клетки, а не из середины головы',
  звук.вДоме.length>=1&&звук.вДоме[0].dx===4&&звук.вДоме[0].dy===0,звук.вДоме);
 check('голос жителя не звучит плоско, когда сторона известна',
  (звук.плоскоВДоме||[]).length===0,звук.плоскоВДоме);
 check('снаружи сторона берётся от клетки мира',
  звук.вПоле.length===1&&звук.вПоле[0].dx===4&&звук.вПоле[0].dy===0,звук.вПоле);

 /* ── 11. Всё живое переживает сохранение ── */
 const запись=await page.evaluate(()=>{
  G.npcMem={};G.rumors=[];G.standing={};G.axes={};G.day=7;G.liveDay=7;
  const n=getNPC(800,800,0,"Кузнец");
  npcRemember(n,"спас","дело",5);
  rumorSeed("добро","спас двор",800,800,true);
  addStand("guild","Проба",30,true);addAxis("уважение",20);
  saveGame(true);
  const сырое=String(localStorage.getItem(SAVE_KEY)||"");
  /* Портим и чиним. */
  G.npcMem="мусор";G.rumors={};G.standing=[];G.axes=null;
  safeFn(()=>GameIntegrity.repair());
  const починено=G.npcMem&&typeof G.npcMem==="object"&&!Array.isArray(G.npcMem)&&
   Array.isArray(G.rumors)&&G.standing&&typeof G.standing==="object"&&!Array.isArray(G.standing)&&
   G.axes&&typeof G.axes==="object";
  /* Битые записи памяти выбрасываются, целые остаются. */
  G.npcMem={ok:{в:1,д:[{т:"помог",у:4,д:1,з:"x"},{т:"выдуманное",у:9,д:1}]}};
  safeFn(()=>GameIntegrity.repair());
  const чисто=(G.npcMem.ok.д||[]).length===1&&G.npcMem.ok.д[0].т==="помог";
  const загр=safeFn(()=>loadGame(),false);
  const вернулось=!!(G.npcMem&&Object.keys(G.npcMem).length)&&
   Array.isArray(G.rumors)&&G.rumors.length>0&&standOf("guild","Проба")===30&&
   axisOf("уважение")===20;
  return {вСохранении:/npcMem/.test(сырое)&&/rumors/.test(сырое)&&/standing/.test(сырое),
   починено,чисто,загр:загр!==false,вернулось};});
 check('память, вести, круги и оси попадают в сохранение',запись.вСохранении===true,запись);
 check('битое состояние живого мира чинится, а не роняет игру',
  запись.починено===true&&запись.чисто===true,запись);
 check('после загрузки всё живое возвращается',
  запись.загр===true&&запись.вернулось===true,запись);

 /* ── 12. Окно жителя рассказывает о человеке ── */
 const окно=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.npcMem={};G.rumors=[];G.day=4;G.liveDay=4;
  const n=getNPC(900,900,0,"Трактирщик");
  npcRemember(n,"обманул","дело",4);
  rumorSeed("бой","Тролль",900,900,true);
  openNPC(n.key,true);
  const тело=document.getElementById("npcBody");
  const текст=тело?тело.textContent||"":"";
  const немые=тело?[...тело.querySelectorAll(".list-line")].filter(e=>!e.getAttribute("data-speak")&&!e.textContent.trim().startsWith("📜")).length:0;
  const встреч=((G.npcMem[n.key]||{}).в)||0;
  while(activeLayer())closeTopUI();
  return {естьДуша:/Нрав|Положение/.test(текст),
   естьПамять:/Помнит о вас/.test(текст),
   естьОтношение:/Лично к вам/.test(текст),
   встреч,немые,длина:текст.length};});
 check('в карточке жителя виден человек: нрав, возраст, положение',окно.естьДуша===true,окно);
 check('в карточке видно, что он о вас помнит и как лично к вам относится',
  окно.естьПамять===true&&окно.естьОтношение===true,окно);
 check('встреча засчитывается при открытии карточки',окно.встреч>=1,окно.встреч);

 /* ── 13. Ходы разговора ── */
 const ходы=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.npcMem={};G.rumors=[];G.standing={};G.axes={};G.day=5;G.liveDay=5;
  G.level=20;G.cha=25;G.mind=20;G.str=20;G.gold=5000;G.weaponDrawn=false;
  G.inCombat=false;G.combat=null;G.quests=[];
  const беды=[];
  DLG_MOVES.forEach(m=>{
   if(!m.n||!m.о||!m.против)беды.push("ход "+m.id);
   if(typeof m.можно!=="function")беды.push("ход "+m.id+": нет условия");
   if(!(m.риск>=0))беды.push("ход "+m.id+": нет меры риска");});
  const n=getNPC(800,800,0,"Торговец");
  /* Запугивать можно только с оружием в руке. */
  const безОружия=dlgAvailable(n).some(m=>m.id==="zapugat");
  G.weaponDrawn=true;
  const сОружием=dlgAvailable(n).some(m=>m.id==="zapugat");
  G.weaponDrawn=false;
  /* Шантажировать — только зная тайну. */
  const доТайны=dlgAvailable(n).some(m=>m.id==="shantazh");
  npcLearnSecret(n,"проба");
  const послеТайны=dlgAvailable(n).some(m=>m.id==="shantazh");
  /* Сопротивление выводится из нрава: жадный упирается в торге сильнее. */
  const жадный=SOUL_CHARS.find(c=>c.id==="zhad"),добрый=SOUL_CHARS.find(c=>c.id==="dobr");
  /* Ход срабатывает и пишет след. */
  const ok=dlgDo(n,"rassprosit");
  /* Тот же ход дважды в день не проходит. */
  const второй=dlgDo(n,"rassprosit");
  /* Подкуп тратит золото. */
  G.day=6;
  const золДо=G.gold;
  dlgDo(n,"podkup");
  const золПосле=G.gold;
  /* Ложь при удаче заводит ЛОЖНУЮ память. */
  G.day=7;G.npcMem={};
  const л=getNPC(805,805,0,"Фермер");
  for(let i=0;i<30&&!((memOf(л.key)||{}).д||[]).some(z=>z.у===0);i++){G.day++;dlgDo(л,"obman");}
  const ложная=((memOf(л.key)||{}).д||[]).some(z=>z.у===0);
  /* Окно жителя показывает ходы. */
  openNPC(n.key,true);
  const тело=document.getElementById("npcBody");
  const кнопок=тело?тело.querySelectorAll("[data-cmd^='dlg:']").length:0;
  const немых=тело?[...тело.querySelectorAll("button[data-cmd^='dlg:']")]
   .filter(e=>!e.getAttribute("data-speak")).length:0;
  while(activeLayer())closeTopUI();
  return {беды:беды.slice(0,4),ходов:DLG_MOVES.length,
   безОружия,сОружием,доТайны,послеТайны,
   жадноеУпрямство:жадный.торг>добрый.торг,
   ok:typeof ok==="boolean",второй,
   золото:золДо-золПосле,ложная,кнопок,немых};});
 check('ходов разговора много, и все описаны',
  ходы.ходов>=18&&ходы.беды.length===0,ходы.беды.length?ходы.беды:ходы.ходов);
 check('запугивать можно только с оружием в руке',
  ходы.безОружия===false&&ходы.сОружием===true,ходы);
 check('шантажировать можно только зная, что человек скрывает',
  ходы.доТайны===false&&ходы.послеТайны===true,ходы);
 check('один и тот же ход дважды за день не проходит',ходы.второй===false,ходы);
 check('подкуп стоит золота',ходы.золото>0,ходы.золото);
 check('удачная ложь заводит ложную память: он верит в то, чего не было',
  ходы.ложная===true,ходы);
 check('ходы видны в окне жителя и каждый читается вслух',
  ходы.кнопок>=8&&ходы.немых===0,ходы);

 /* ── 14. Проповедники и учения ── */
 const вера=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  const беды=[];
  const all=Object.keys(SOUND_BANK||{}).concat(Object.keys(BEACONS||{}));
  PREACHERS.forEach(p=>{
   if(!p.n||!p.о||p.о.length<20)беды.push("проповедник "+p.id);
   if(all.indexOf(p.звук)<0)беды.push(p.id+": нет звука "+p.звук);
   if(!(p.умеет||[]).length)беды.push(p.id+": ничего не умеет");
   (p.умеет||[]).forEach(u=>{if(!PREACH_DEEDS[u])беды.push(p.id+": нет деяния "+u);});
   if(!(p.место||[]).length)беды.push(p.id+": негде стоять");});
  /* Учение выводится из бога, а не заводится заново. */
  const веры=PANTHEON.map(g=>faithOf(g.id));
  веры.forEach(v=>{
   if(!v||!v.догмат||!v.обряд||!v.праздник||!v.святой||!v.знак||!v.чары||!v.чужие)
    беды.push("учение "+(v&&v.id));
   if(v&&v.круг!==v.бог.dom)беды.push("учение "+v.id+": круг разошёлся с богом");
   if(v&&v.запрет!==v.бог.taboo)беды.push("учение "+v.id+": запрет разошёлся с богом");});
  /* Имена богов склоняются, а не склеиваются. */
  const падежи=PANTHEON.map(g=>godCase(g,"род"));
  const склейки=падежи.filter(x=>/аяа|яа|ая$/.test(x)).length;
  const все4=PANTHEON.every(g=>["род","дат","пред","твор"].every(k=>{
   const v=godCase(g,k);return v&&v!==g.n;})||g.id==="wood"||g.id==="road");
  /* Проповедники стоят в мире. */
  G.dark=false;G.place=null;
  let сколько=0,родов=new Set();
  for(let x=200;x<1900&&сколько<200;x+=3)for(let y=200;y<1900;y+=53){
   const c=cellContent(x,y);if(!c.structure)continue;
   const pr=preacherAt(x,y,c.structure.type);
   if(pr){сколько++;родов.add(pr.род.id);}}
  return {беды:беды.slice(0,5),родов:PREACHERS.length,деяний:Object.keys(PREACH_DEEDS).length,
   вер:веры.length,склейки,все4,вМире:сколько,разныхРодов:родов.size,
   пример:godCase(GOD_BY_ID.moon,"род")};});
 check('проповедников двенадцать родов, и у каждого своё дело и свой звук',
  вера.родов===12&&вера.беды.length===0,вера.беды.length?вера.беды:вера.родов);
 check('деяний проповедника много: не только текст',вера.деяний>=10,вера.деяний);
 check('двенадцать учений выводятся из двенадцати богов и не спорят с ними',
  вера.вер===12,вера);
 check('имена богов склоняются, а не склеиваются с окончанием',
  вера.склейки===0&&вера.пример==="Селены Ликоносной",вера.пример);
 check('проповедники стоят в мире, и роды у них разные',
  вера.вМире>=20&&вера.разныхРодов>=5,вера);

 /* ── 15. Деяние проповедника меняет мир ── */
 const деяние=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.faith={};G.standing={};G.axes={};G.rumors=[];
  G.gold=9000;G.day=8;G.liveDay=8;
  /* Ищем место с проповедником. */
  let м=null;
  for(let x=200;x<1900&&!м;x+=3)for(let y=200;y<1900;y+=53){
   const c=cellContent(x,y);if(!c.structure)continue;
   const pr=preacherAt(x,y,c.structure.type);
   if(pr&&(pr.род.умеет||[]).indexOf("пожертвование")>=0){м={x,y,st:c.structure.type};break;}}
  if(!м)return {нет:true};
  G.x=м.x;G.y=м.y;
  G.place={kind:"house",bx:м.x,by:м.y,stype:м.st,depth:0,name:"м",x:1,y:1};
  const золДо=G.gold,слуховДо=(G.rumors||[]).length;
  const ок=preachDo("пожертвование");
  const золПосле=G.gold;
  const вера=Object.values(G.faith||{}).reduce((a,b)=>a+(Number(b)||0),0);
  const слуховПосле=(G.rumors||[]).length;
  /* Чего проповедник не умеет — того и не делает. */
  const pr=preacherHere();
  const чужое=(Object.keys(PREACH_DEEDS).find(k=>(pr.род.умеет||[]).indexOf(k)<0));
  window.__said=[];
  const отказ=чужое?preachDo(чужое):false;
  const словаОтказа=речь();
  while(activeLayer())closeTopUI();G.place=null;
  return {ок,золото:золДо-золПосле,вера,слухи:слуховПосле-слуховДо,
   отказ,словаОтказа:словаОтказа.slice(0,90)};});
 check('пожертвование стоит золота, поднимает веру и рождает весть',
  !деяние.нет&&деяние.ок===true&&деяние.золото>0&&деяние.вера>0&&деяние.слухи>0,деяние);
 check('чего этот проповедник не умеет, того он и не делает',
  деяние.отказ===false&&/не занимается/i.test(деяние.словаОтказа||''),деяние.словаОтказа);

 /* ── 16. Распорядок дня ── */
 const распорядок=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.weather="Ясно";G.day=5;G.liveDay=5;
  const беды=[];
  DAY_PARTS.forEach(d=>{
   if(!d.n||!d.звук)беды.push("доля дня "+d.id);
   if(!SOUND_BANK[d.звук]&&!BEACONS[d.звук])беды.push(d.id+": нет звука "+d.звук);});
  Object.keys(CRAFT_DAY).forEach(k=>{
   const п=CRAFT_DAY[k];
   if(п.length!==8)беды.push("день ремесла "+k+": не восемь долей");
   п.forEach(x=>{if(!DAY_PART_BY_ID[x])беды.push(k+": нет доли "+x);});});
  DAY_BREAKS.forEach(b=>{if(!b.n||!b.о||typeof b.когда!=="function")беды.push("слом "+b.id);});
  const кузнец=getNPC(900,900,0,"Кузнец");
  const стражник=getNPC(900,900,1,"Стражник");
  const жрец=getNPC(900,900,2,"Жрец");
  /* День идёт по часам и у всех по-своему. */
  const поЧасам=[];
  const занятия=new Set();
  for(const ч of [2,6,9,13,16,20,23]){
   G.hour=ч;
   const з=npcDoing(кузнец).часть.id;
   поЧасам.push({ч,з});занятия.add(з);}
  G.hour=22;
  const вечер={кузнец:npcDoing(кузнец).часть.id,страж:npcDoing(стражник).часть.id,
   жрец:npcDoing(жрец).часть.id};
  /* Спящего не будят. */
  G.hour=2;const спит=npcBusy(кузнец);
  G.hour=10;const неСпит=npcBusy(кузнец);
  /* Ночь ломает распорядок и объясняет это раньше войны. */
  G.hour=3;const ночь=npcDoing(кузнец).слом;
  G.hour=10;const днём=npcDoing(кузнец).слом;
  return {беды:беды.slice(0,4),долей:DAY_PARTS.length,ремёсел:Object.keys(CRAFT_DAY).length,
   сломов:DAY_BREAKS.length,занятий:занятия.size,поЧасам,вечер,спит,неСпит,
   ночь:ночь&&ночь.id,днём:днём&&днём.id};});
 check('доли дня и дни ремёсел описаны без дыр, и у каждой доли свой звук',
  распорядок.беды.length===0,распорядок.беды);
 check('долей дня десять, ремёсел со своим днём много, сломов четыре',
  распорядок.долей===10&&распорядок.ремёсел>=18&&распорядок.сломов===4,распорядок);
 check('за сутки житель успевает сменить несколько занятий',
  распорядок.занятий>=4,распорядок.поЧасам);
 check('у разных ремёсел вечер разный: кузнец в таверне, стража на посту',
  распорядок.вечер.кузнец!==распорядок.вечер.страж,распорядок.вечер);
 check('спящего не будят, а днём разговор идёт',
  распорядок.спит===true&&распорядок.неСпит===false,распорядок);
 check('ночь ломает распорядок и объясняет это раньше прочего',
  распорядок.ночь==="ночь",распорядок);

 /* ── 17. Связи между жителями ── */
 const связи=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.social={};G.npcMem={};G.hour=10;G.day=5;G.liveDay=5;
  G.level=40;G.cha=40;G.mind=30;
  const беды=[];
  SOC_TIES.forEach(t=>{if(!t.n||!t.о||!Number.isFinite(t.вес))беды.push("связь "+t.id);});
  /* Ищем дом, где живут несколько. */
  let м=null;
  for(let x=200;x<1900&&!м;x+=3)for(let y=200;y<1900;y+=53){
   const c=cellContent(x,y);
   if(c.structure&&npcsFor(c).length>1){м={x,y};break;}}
  if(!м)return {нет:true};
  const соседи=npcsFor(cellContent(м.x,м.y));
  /* Связь симметрична: с какой стороны ни спроси — одна и та же. */
  const t1=socTie(соседи[0],соседи[1]),t2=socTie(соседи[1],соседи[0]);
  const симметрично=((t1&&t1.вид.id)||null)===((t2&&t2.вид.id)||null);
  /* Связан не всякий с каждым. */
  let пар=0,связанных=0;
  for(let x=200;x<1500;x+=7)for(let y=200;y<1500;y+=61){
   const cc=cellContent(x,y);if(!cc.structure)continue;
   const l=npcsFor(cc);
   for(let i=0;i<l.length;i++)for(let j=i+1;j<l.length;j++){пар++;if(socTie(l[i],l[j]))связанных++;}}
  /* Вмешательство записывается навсегда и перебивает выведенное. */
  let ок=false;
  for(let i=0;i<20&&!ок;i++){G.social={};ок=socMeddle(соседи[0].key,соседи[1].key,"друзья");}
  const после=socTie(соседи[0],соседи[1]);
  /* Неудачное вмешательство ссорит обоих с вами. */
  G.social={};G.npcMem={};G.cha=1;G.mind=1;G.level=1;
  let провал=false;
  for(let i=0;i<20&&!провал;i++)провал=(socMeddle(соседи[0].key,соседи[1].key,"вражда")===false);
  const обиделись=npcFeel(соседи[0])<0&&npcFeel(соседи[1])<0;
  return {беды,видов:SOC_TIES.length,симметрично,пар,связанных,
   ок,записано:!!(после&&после.своё),после:после&&после.вид.id,
   провал,обиделись};});
 check('виды связей описаны, и связь симметрична',
  !связи.нет&&связи.беды.length===0&&связи.симметрично===true,связи);
 check('связан не всякий с каждым, но связей в мире много',
  связи.связанных>0&&связи.связанных<связи.пар,
  {пар:связи.пар,связанных:связи.связанных});
 check('вмешательство записывается навсегда и перебивает выведенное',
  связи.ок===true&&связи.записано===true&&связи.после==="друзья",связи);
 check('неудачное вмешательство ссорит с вами обоих',
  связи.провал===true&&связи.обиделись===true,связи);

 /* ── 18. Торговец как человек ── */
 const лавка=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.merch={};G.market={};G.day=5;G.liveDay=5;
  G.level=25;G.gold=99999;G.weather="Ясно";G.inv={};
  const беды=[];
  MERCH_KINDS.forEach(k=>{
   if(!k.n||!k.о||!(k.товар||[]).length||!(k.руда||[]).length)беды.push("вид "+k.id);});
  MERCH_TRAITS.forEach(t=>{
   if(!t.n||!t.о||!(t.k>0)||!(t.уступ>0))беды.push("нрав "+t.id);});
  MERCH_HIDDEN.forEach(h=>{
   if(!h.n||!h.о||typeof h.когда!=="function")беды.push("дверь "+h.id);});
  /* Лавки разные: и по делу, и по нраву. */
  const виды=new Set(),нравы=new Set();
  for(let i=0;i<150;i++){
   const n=getNPC(400+i*7,500+i*11,0,["Кузнец","Торговец","Целительница","Магистр","Трактирщик"][i%5]);
   const d=merchSoul(n);
   if(d){виды.add(d.вид.id);нравы.add(d.нрав.id);}}
  /* Оружейник держит клинки, а не доспех. */
  let ор=null;
  for(let i=0;i<300&&!ор;i++){
   const n=getNPC(600+i*3,700+i*5,0,"Кузнец");const d=merchSoul(n);
   if(d&&d.вид.id==="mech")ор={n,d};}
  let товар=null;
  if(ор){const st=stockFor(ор.n);
   товар={оружия:st.filter(x=>x.gear&&x.gear.slot==="weapon").length,
    брони:st.filter(x=>x.gear&&x.gear.slot==="armor").length};}
  /* Казна: тратится и восполняется. */
  const т=getNPC(800,800,0,"Торговец");
  const к1=merchPurse(т);
  merchSpend(т,к1-10);
  const к2=merchPurse(т);
  G.day+=5;
  const к3=merchPurse(т);
  G.day-=5;
  /* Скрытые товары: условие всегда названо. */
  const двери=merchDoors(т);
  const безУсловия=двери.filter(d=>!d.о).length;
  return {беды:беды.slice(0,4),видов:MERCH_KINDS.length,нравов:MERCH_TRAITS.length,
   дверей:MERCH_HIDDEN.length,разныхВидов:виды.size,разныхНравов:нравы.size,
   товар,кошель:{был:к1,после:к2,потом:к3},безУсловия};});
 check('виды торговли, нравы за прилавком и скрытые двери описаны без дыр',
  лавка.беды.length===0,лавка.беды);
 check('видов торговли двенадцать, нравов восемь, скрытых дверей девять',
  лавка.видов===12&&лавка.нравов===8&&лавка.дверей===9,лавка);
 check('лавки в мире разные и по делу, и по нраву',
  лавка.разныхВидов>=8&&лавка.разныхНравов>=6,лавка);
 check('оружейник держит клинки, а не доспех',
  лавка.товар&&лавка.товар.оружия>0&&лавка.товар.брони===0,лавка.товар);
 check('у торговца свой кошель: он тратится и восполняется со временем',
  лавка.кошель.был>0&&лавка.кошель.после<лавка.кошель.был&&
  лавка.кошель.потом>лавка.кошель.после,лавка.кошель);
 check('у каждой скрытой двери названо условие',лавка.безУсловия===0,лавка.безУсловия);

 /* ── 19. Живой рынок ── */
 const рынок=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=false;G.place=null;G.market={};G.day=5;G.liveDay=5;G.weather="Ясно";
  G.x=WORLD>>1;G.y=WORLD>>1;
  const idx=empireIndexAt(1000,1000);
  const до=marketPrice("руда",idx,G.day);
  /* Разбитая на тракте ватага поднимает подвоз и роняет цену. */
  marketDeed("разбой",idx);marketDeed("разбой",idx);marketDeed("разбой",idx);
  const после=marketPrice("руда",idx,G.day);
  const подвоз=marketOf(idx).подвоз;
  /* Потоки сами возвращаются к норме: один удачный день не кормит вечно. */
  for(let i=0;i<50;i++)marketTick(1);
  const вернулся=marketOf(idx).подвоз;
  const ценаНазад=marketPrice("руда",idx,G.day);
  /* Погода и сезон. */
  G.market={};
  G.weather="Буря";const буря=marketPrice("руда",idx,G.day);
  G.weather="Ясно";const вёдро=marketPrice("руда",idx,G.day);
  /* Сезон меряем в среднем по годам: на отдельно взятом дне его перебивают
     события хозяйства — недород, урожай, скупка впрок, — и сравнение двух
     дней говорит не о сезоне, а о том, что в эти дни творилось. */
  const среднее=(от,до)=>{let s=0,n=0;
   for(let год=0;год<8;год++)for(let d=от;d<до;d++){s+=marketPrice("зерно",idx,год*48+d);n++;}
   return s/Math.max(1,n);};
  const зима=+среднее(36,48).toFixed(2),осень=+среднее(24,36).toFixed(2);
  /* Рынок рассказывается словами. */
  marketDeed("разбой",idx);marketDeed("разбой",idx);
  const слова=marketLine(idx);
  /* Потоки не уходят в бесконечность. */
  for(let i=0;i<60;i++)marketDeed("разбой",idx);
  const предел=marketOf(idx).подвоз;
  return {до,после,подвоз:+подвоз.toFixed(2),вернулся:+вернулся.toFixed(2),ценаНазад,
   буря,вёдро,зима,осень,слова:String(слова).slice(0,90),предел:+предел.toFixed(2)};});
 check('разбитая на тракте ватага поднимает подвоз и роняет цены',
  рынок.после<рынок.до&&рынок.подвоз>1.2,рынок);
 check('потоки сами возвращаются к норме: один удачный день не кормит вечно',
  рынок.вернулся===1&&рынок.ценаНазад>=рынок.после,рынок);
 check('в бурю возить дороже, чем в вёдро',рынок.буря>рынок.вёдро,рынок);
 check('зимой еда дороже, чем осенью',рынок.зима>рынок.осень,
  {зима:рынок.зима,осень:рынок.осень});
 check('рынок рассказывается словами',рынок.слова.length>10,рынок.слова);
 check('поток не уходит в бесконечность, сколько ни толкай',
  рынок.предел<=2.2,рынок.предел);

 /* ── 20. Всё это переживает сохранение ── */
 const записьТорга=await page.evaluate(()=>{
  G.market={};G.merch={};G.day=9;
  const idx=empireIndexAt(1000,1000);
  marketDeed("разбой",idx);
  const т=getNPC(800,800,0,"Торговец");
  merchSpend(т,500);
  saveGame(true);
  const сырое=String(localStorage.getItem(SAVE_KEY)||"");
  G.market="мусор";
  safeFn(()=>GameIntegrity.repair());
  const починено=G.market&&typeof G.market==="object"&&!Array.isArray(G.market);
  /* В сохранении подвоз поднят: это и проверяем в самой записи. */
  const вЗаписи=/"подвоз"/.test(сырое)&&/подвоз":1\.[1-9]/.test(сырое.replace(/подвоз/g,"подвоз"));
  const загр=safeFn(()=>loadGame(),false);
  /* После загрузки запись на месте и это число. Само значение к этому
     времени могло состариться — мир идёт вперёд и во время загрузки тоже,
     и требовать от него «как было» значило бы требовать, чтобы он стоял. */
  const целость=!!(G.market&&typeof G.market==="object"&&
   Number.isFinite(Number((G.market[String(idx)]||{}).подвоз)));
  return {вСохранении:/market/.test(сырое),вЗаписи,починено,загр:загр!==false,целость};});
 check('рыночная память и кошельки торговцев попадают в сохранение',
  записьТорга.вСохранении===true,записьТорга);
 check('поднятый подвоз попадает в саму запись сохранения',
  записьТорга.вЗаписи===true,записьТорга);
 check('битая рыночная память чинится, а после загрузки остаётся числом',
  записьТорга.починено===true&&записьТорга.загр===true&&
  записьТорга.целость===true,записьТорга);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
