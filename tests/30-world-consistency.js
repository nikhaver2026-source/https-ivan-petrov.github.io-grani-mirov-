/* ════════════════════════════════════════════════════════════════════════
   СОГЛАСОВАННОСТЬ МИРА

   Мир описан несколькими таблицами, и они ссылаются друг на друга: бог знает
   свой клан и соперника, клан — бога, народ и державу, держава — свой пантеон
   и свои народы, чудовище — местность и звук, задание — ресурс, событие —
   запись из банка. Стоит одной ссылке указать в пустоту, и игрок слышит
   «Соперник: нет», «Бог: —» или молчание там, где ждал ответа.

   Набор проверяет каждую ссылку в обе стороны. Он ничего не жмёт и ничего не
   ждёт: только читает таблицы игры и сверяет их между собой.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 const D=await page.evaluate(()=>{
  const godIds=new Set(PANTHEON.map(g=>g.id));
  const clanNames=new Set(CLANS), raceNames=new Set(ALL_RACE_NAMES);
  const empNames=new Set(EMPIRES.map(e=>e.name)), empShort=new Set(EMPIRES.map(e=>e.short));
  const terrains=new Set(Object.keys(RESBYT).concat(["coast","swamp","sea"]));
  const scenes=new Set(Object.keys(SOUNDS)), roles=new Set(Object.keys(SOUND_BANK));
  const emp=n=>EMPIRES.find(e=>e.name===n||e.short===n);
  const внеДержав=r=>/вне держав/i.test(r||"");

  const боги={
   всего:PANTHEON.length,
   безСоперника:PANTHEON.filter(g=>!godIds.has(g.rival)).map(g=>g.n+" → "+g.rival),
   самСебеСоперник:PANTHEON.filter(g=>g.rival===g.id).map(g=>g.n),
   чужойКлан:PANTHEON.filter(g=>!clanNames.has(g.clan)).map(g=>g.n+" → "+g.clan),
   пустыеПоля:PANTHEON.filter(g=>["id","n","ep","dom","sym","day","myth","boon","taboo","clan","fx"]
     .some(k=>g[k]===undefined||g[k]==="")).map(g=>g.n),
   дниПовторы:Object.entries(PANTHEON.reduce((a,g)=>(a[g.day]=(a[g.day]||0)+1,a),{}))
     .filter(([,n])=>n>1).map(([d,n])=>`день ${d}: ${n}`)};

  const кланы={
   всего:CLAN_DB.length,
   чужойБог:CLAN_DB.filter(c=>!godIds.has(c.god)).map(c=>c.n+" → "+c.god),
   чужойНарод:CLAN_DB.filter(c=>!raceNames.has(c.race)).map(c=>c.n+" → "+c.race),
   врагСам:CLAN_DB.filter(c=>c.foe===c.n).map(c=>c.n),
   пустыеПоля:CLAN_DB.filter(c=>["n","god","race","seat","creed","hist"]
     .some(k=>!c[k])).map(c=>c.n)};

  const народы={
   всего:RACES_DB.length,
   чужойБог:RACES_DB.filter(r=>!godIds.has(r.god)).map(r=>r.n+" → "+r.god),
   чужойКлан:RACES_DB.filter(r=>!clanNames.has(r.clan)).map(r=>r.n+" → "+r.clan),
   чужаяДержава:RACES_DB.filter(r=>!внеДержав(r.emp)&&!empNames.has(r.emp)&&!empShort.has(r.emp))
     .map(r=>r.n+" → "+r.emp),
   чужаяМестность:RACES_DB.filter(r=>(r.home||[]).some(t=>!terrains.has(t))).map(r=>r.n),
   чужойРесурс:RACES_DB.filter(r=>(r.res||[]).some(x=>!LAND_RES.includes(x))).map(r=>r.n),
   странныйРанг:RACES_DB.filter(r=>!(r.rank>=0&&r.rank<RANKS.length)).map(r=>r.n+" ранг "+r.rank),
   пустыеПоля:RACES_DB.filter(r=>["n","hist","econ","pol","war"].some(k=>!r[k])).map(r=>r.n),
   ключиПовторы:(()=>{const s=new Set(),d=[];RACES_DB.forEach(r=>{if(s.has(r.id))d.push(r.id);s.add(r.id);});return d;})()};

  const державы={
   всего:EMPIRES.length,
   чужойБог:EMPIRES.filter(e=>!godIds.has(e.god)).map(e=>e.name+" → "+e.god),
   чужойПравящий:EMPIRES.filter(e=>!raceNames.has(e.race)).map(e=>e.name+" → "+e.race),
   чужойНарод:EMPIRES.filter(e=>(e.races||[]).some(n=>!raceNames.has(n))).map(e=>e.name),
   правящегоНетВСписке:EMPIRES.filter(e=>e.races&&!e.races.includes(e.race)).map(e=>e.name),
   чужаяМестность:EMPIRES.filter(e=>(e.terrains||[]).some(t=>!terrains.has(t))).map(e=>e.name),
   чужойТовар:EMPIRES.filter(e=>(e.exports||[]).concat(e.imports||[]).some(x=>!LAND_RES.includes(x))).map(e=>e.name),
   вывозИВвозОдно:EMPIRES.filter(e=>(e.exports||[]).some(x=>(e.imports||[]).includes(x))).map(e=>e.name),
   безСтолицы:EMPIRES.filter(e=>!e.cap||typeof e.cap.x!=="number").map(e=>e.name)};

  /* Связь народ ↔ держава должна сходиться в обе стороны. */
  const связьНародДержава={
   народЗнаетДержавуАОнаЕгоНет:RACES_DB.filter(r=>{
    if(внеДержав(r.emp))return false;const e=emp(r.emp);return e&&!(e.races||[]).includes(r.n);})
    .map(r=>r.n+" → "+r.emp),
   державаЗнаетНародАОнВнеДержав:(()=>{const out=[];
    EMPIRES.forEach(e=>(e.races||[]).forEach(n=>{
     const r=RACE_BY_NAME[n];if(r&&внеДержав(r.emp))out.push(e.short+" → "+n);}));
    return out;})(),
   /* Народ может жить сразу в нескольких державах: поле emp — родина, а не
      единственное место обитания. Расхождением считаем только разрыв связи в
      одну сторону: родина не знает своего народа, или народ вне держав, а
      держава числит его подданным. */
   рассеяние:(()=>{const out=[];
    EMPIRES.forEach(e=>(e.races||[]).forEach(n=>{
     const r=RACE_BY_NAME[n];
     if(r&&!внеДержав(r.emp)&&r.emp!==e.name&&r.emp!==e.short)out.push(`${n}: родина «${r.emp}», живут и в «${e.short}»`);}));
    return out;})()};

  const чудовища={
   всего:MONSTERS.length,
   ключиПовторы:(()=>{const s=new Set(),d=[];MONSTERS.forEach(m=>{if(s.has(m.id))d.push(m.id);s.add(m.id);});return d;})(),
   уровниНаоборот:MONSTERS.filter(m=>m.min>m.max).map(m=>m.n),
   чужаяМестность:MONSTERS.filter(m=>(m.biomes||[]).some(t=>!terrains.has(t))).map(m=>m.n),
   безСцены:MONSTERS.filter(m=>!scenes.has(m.snd)).map(m=>m.n+" → "+m.snd),
   пустыеПоля:MONSTERS.filter(m=>["id","n","snd","fx"].some(k=>!m[k])).map(m=>m.n)};

  const события={
   всего:EVENTS.length,
   ключиПовторы:(()=>{const s=new Set(),d=[];EVENTS.forEach(e=>{if(s.has(e.id))d.push(e.id);s.add(e.id);});return d;})(),
   чужаяРоль:EVENTS.filter(e=>e.snd&&!roles.has(e.snd)).map(e=>e.id+" → "+e.snd),
   безВыборов:[],сломанныеВыборы:[]};
  EVENTS.forEach(e=>{
   try{const ch=e.choices(eventContext());
    if(!ch||!ch.length)события.безВыборов.push(e.id);
    (ch||[]).forEach((c,i)=>{if(!c.l||typeof c.run!=="function")события.сломанныеВыборы.push(e.id+"["+i+"]");});
   }catch(err){события.сломанныеВыборы.push(e.id+": "+err.message);}});

  const ctx0={god:PANTHEON[0],tier:1,race:"Люди",clan:CLANS[0],emp:EMPIRES[0],
   npc:{race:"Люди",prof:"Жрец",key:"k"},city:null};
  const цепочки={всего:Object.keys(CHAIN_DB).length,плохиеШаги:[]};
  Object.entries(CHAIN_DB).forEach(([k,ch])=>{
   if(!ch.n)цепочки.плохиеШаги.push(k+": нет имени");
   (ch.steps||[]).forEach((mk,i)=>{
    if(typeof mk!=="function"){цепочки.плохиеШаги.push(`${k}[${i}]: шаг не функция`);return;}
    let st;try{st=mk(ctx0);}catch(err){цепочки.плохиеШаги.push(`${k}[${i}]: падает — ${err.message}`);return;}
    if(!st||!st.text)цепочки.плохиеШаги.push(`${k}[${i}]: нет текста`);
    else if(!st.type)цепочки.плохиеШаги.push(`${k}[${i}]: нет типа`);
    else if(!st.reward||(!st.reward.gold&&!st.reward.xp))цепочки.плохиеШаги.push(`${k}[${i}]: нет награды`);
    else if(st.type==="fetch"&&!LAND_RES.includes(st.res))цепочки.плохиеШаги.push(`${k}[${i}]: ресурс «${st.res}» не собрать`);
    else if(st.need!==undefined&&(st.need<=0||st.need>20))цепочки.плохиеШаги.push(`${k}[${i}]: количество ${st.need}`);});});

  const звук={
   сцен:scenes.size,ролей:roles.size,
   сценаБезПоля:Object.entries(SOUNDS).filter(([,s])=>!s.name||!s.desc||!s.icon||typeof s.build!=="function"||!(s.dur>0)).map(([k])=>k),
   росльБезОписания:Object.entries(SOUND_BANK).filter(([,e])=>!e.d).map(([k])=>k),
   рольБезФайлов:Object.entries(SOUND_BANK).filter(([,e])=>!e.f||!e.f.length).map(([k])=>k),
   /* Маяк звучит либо записью, либо синтезом. Беда — только когда нет ни того,
      ни другого: тогда объект под ногами просто молчит. */
   маякНемой:[...new Set(Object.values(RESBEACON))].filter(r=>!SOUND_BANK[r]&&!BEACON_SAMPLE[r]&&!BEACONS[r]),
   маякТолькоСинтез:[...new Set(Object.values(RESBEACON))].filter(r=>!SOUND_BANK[r]&&!BEACON_SAMPLE[r]&&!!BEACONS[r])};

  return {боги,кланы,народы,державы,связьНародДержава,чудовища,события,цепочки,звук};
 });

 check('в пантеоне двенадцать богов, у каждого есть все поля',
  D.боги.всего===12&&!D.боги.пустыеПоля.length,D.боги.пустыеПоля);
 check('у каждого бога соперник — существующий бог, и не он сам',
  !D.боги.безСоперника.length&&!D.боги.самСебеСоперник.length,
  {нет:D.боги.безСоперника,сам:D.боги.самСебеСоперник});
 check('клан каждого бога есть в списке кланов',!D.боги.чужойКлан.length,D.боги.чужойКлан);
 check('священные дни богов не пересекаются',!D.боги.дниПовторы.length,D.боги.дниПовторы);

 check('у каждого клана есть бог, народ и все поля',
  !D.кланы.чужойБог.length&&!D.кланы.чужойНарод.length&&!D.кланы.пустыеПоля.length,
  {бог:D.кланы.чужойБог,народ:D.кланы.чужойНарод,поля:D.кланы.пустыеПоля});
 check('ни один клан не враждует сам с собой',!D.кланы.врагСам.length,D.кланы.врагСам);

 check('в каталоге сорок пять народов, у каждого заполнено досье',
  D.народы.всего===45&&!D.народы.пустыеПоля.length,{всего:D.народы.всего,пустые:D.народы.пустыеПоля});
 check('у каждого народа существующие бог, клан и держава',
  !D.народы.чужойБог.length&&!D.народы.чужойКлан.length&&!D.народы.чужаяДержава.length,
  {бог:D.народы.чужойБог,клан:D.народы.чужойКлан,держава:D.народы.чужаяДержава});
 check('народы живут в настоящей местности и собирают настоящие ресурсы',
  !D.народы.чужаяМестность.length&&!D.народы.чужойРесурс.length,
  {местность:D.народы.чужаяМестность,ресурс:D.народы.чужойРесурс});
 check('ранги народов в пределах шкалы, ключи не повторяются',
  !D.народы.странныйРанг.length&&!D.народы.ключиПовторы.length,
  {ранг:D.народы.странныйРанг,ключи:D.народы.ключиПовторы});

 check('у каждой державы существующие бог, правящий народ и столица',
  D.державы.всего===8&&!D.державы.чужойБог.length&&!D.державы.чужойПравящий.length&&!D.державы.безСтолицы.length,
  D.державы);
 check('правящий народ числится среди народов своей державы',
  !D.державы.правящегоНетВСписке.length,D.державы.правящегоНетВСписке);
 check('державы торгуют настоящими товарами и не ввозят то, что вывозят',
  !D.державы.чужойТовар.length&&!D.державы.вывозИВвозОдно.length,
  {товар:D.державы.чужойТовар,оба:D.державы.вывозИВвозОдно});

 check('народ и держава знают друг о друге одинаково',
  !D.связьНародДержава.народЗнаетДержавуАОнаЕгоНет.length
  &&!D.связьНародДержава.державаЗнаетНародАОнВнеДержав.length,
  {родинаНеЗнает:D.связьНародДержава.народЗнаетДержавуАОнаЕгоНет,
   вДержавеВнеДержавный:D.связьНародДержава.державаЗнаетНародАОнВнеДержав});

 check('у каждого чудовища свой ключ, местность и звук для «Прослушать»',
  !D.чудовища.ключиПовторы.length&&!D.чудовища.чужаяМестность.length
  &&!D.чудовища.безСцены.length&&!D.чудовища.пустыеПоля.length,
  D.чудовища);
 check('уровни чудовищ не перевёрнуты',!D.чудовища.уровниНаоборот.length,D.чудовища.уровниНаоборот);

 check('у каждого события свой ключ, живые выборы и настоящая запись',
  !D.события.ключиПовторы.length&&!D.события.безВыборов.length
  &&!D.события.сломанныеВыборы.length&&!D.события.чужаяРоль.length,
  D.события);

 check('все шаги всех цепочек заданий строятся и осмысленны',
  !D.цепочки.плохиеШаги.length,D.цепочки.плохиеШаги);

 check('у каждой звуковой сцены есть имя, описание, значок и построение',
  !D.звук.сценаБезПоля.length,D.звук.сценаБезПоля);
 check('у каждой роли банка есть описание и файлы',
  !D.звук.росльБезОписания.length&&!D.звук.рольБезФайлов.length,
  {описание:D.звук.росльБезОписания,файлы:D.звук.рольБезФайлов});
 check('ни один ресурсный маяк не молчит',!D.звук.маякНемой.length,D.звук.маякНемой);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
