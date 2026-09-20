/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 115: ДЕСЯТЬ РОДОВ ЛОВУШЕК И СЕМЬ СПОСОБОВ ИХ НАЙТИ (§15 брифа)

   1. Данные: десять родов, у каждого звук, суть и то, чем его снимают;
      семь способов со звуком, своими родами и честным отказом; шестнадцать
      ловушек, у каждой род, и ни один род не пустует.
   2. Наверху все семь отвечают одно и то же и ничего не тратят.
   3. Под землёй способ находит ловушку, называет её род и то, чем снимать;
      второй раз говорит, что уже найдена.
   4. Свой род способ берёт увереннее чужого; рискованный опыт берёт всё.
   5. Отказы честные и по делу: без маны, без навыка, без вещи, без
      спутника, в бою — и каждый называет, чего не хватает.
   6. Щуп ловчего сильнее верёвки, верёвка — факела.
   7. Снятие зависит от рода: знак снимают знанием рун, пасть — клинком.
   8. Семь строк меню видны под землёй и скрыты наверху.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  /* Найти ярус, на котором есть ненайденная ловушка, и встать на неё. */
  window.НАЛОВУШКУ=(род)=>{
   for(let n=0;n<40;n++){
    G.place={kind:"dungeon",bx:3000+n*29,by:3000+n*17,stype:"ruins",depth:20,name:"Проба яруса",x:1,y:1};
    const lvl=safeFn(()=>curLevel(),null);if(!lvl)continue;
    for(let y=1;y<40;y++)for(let x=1;x<40;x++){
     const л=safeFn(()=>trapAt(x,y),null);
     if(!л||л.состояние!=="не найдена")continue;
     if(род&&л.род!==род)continue;
     G.place.x=x;G.place.y=y;return {...л};}}
   return null;};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.родов=TRAP_KINDS.length;
  r.родыОк=TRAP_KINDS.every(k=>SOUND_BANK[k.звук]&&k.n&&k.о&&k.снять);
  r.способов=TRAP_FINDS.length;
  r.способыОк=TRAP_FINDS.every(w=>SOUND_BANK[w.звук]&&w.n&&w.о&&w.роды.length&&typeof w.можно==="function"
   &&w.роды.every(x=>TRAP_KIND_BY_ID[x])&&w.время>0);
  r.ловушек=TRAPS.length;
  r.безРода=TRAPS.filter(t=>!TRAP_KIND_BY_ID[t.род]).map(t=>t.id);
  r.пустые=TRAP_KINDS.filter(k=>!TRAPS.some(t=>t.род===k.id)).map(k=>k.id);
  r.модуль=!!Modules.get("TRAPS");
  const sc=worldSelfCheck();const s=sc.find(x=>x.id==="traps");
  r.строка=s?s.ok:null;
  r.текст=Traps.text();
  return r;});
 check('десять родов ловушек, у каждого звук, суть и то, чем его снимают; семь способов со звуком, своими родами и ценой времени',
  данные.родов===10&&данные.родыОк&&данные.способов===7&&данные.способыОк,данные);
 check('шестнадцать ловушек, у каждой род, ни один род не пустует; модуль на месте, самопроверка мира его видит, и рассказ называет все семь способов',
  данные.ловушек===16&&данные.безРода.length===0&&данные.пустые.length===0&&данные.модуль&&данные.строка===true
  &&/десять родов/.test(данные.текст)&&/слух/.test(данные.текст)&&/рискованный опыт/.test(данные.текст),данные);

 /* ── 2. наверху ── */
 const наверху=await page.evaluate(()=>{
  G.place=null;G.ship=null;G.inCombat=false;G.mana=G.manaMax=100;G.skills=["tracker"];
  if(!Array.isArray(G.items))G.items=[];if(G.items.indexOf("Верёвка")<0)G.items.push("Верёвка");
  const было=G.mana;
  const о=TRAP_FINDS.map(w=>Traps.find(w.id));
  return {ответы:о,мана:G.mana===было,всеПроСушу:о.every(t=>/под землёй/.test(t))};});
 check('наверху все семь способов отвечают одинаково честно и ничего не тратят',
  наверху.всеПроСушу&&наверху.мана,наверху);

 /* ── 3. под землёй способ находит ── */
 const нашли=await page.evaluate(()=>{
  const r={};G.inCombat=false;G.mana=G.manaMax=100;G.skills=["tracker"];G.agi=60;
  const л=НАЛОВУШКУ(null);
  if(!л)return {нет:true};
  r.род=л.род;r.имя=л.n;
  PLAYED.length=0;
  /* Берём тот способ, который этот род и берёт: иначе мерялась бы удача. */
  const w=TRAP_FINDS.find(x=>x.роды.indexOf(л.род)>=0&&x.id!=="risk")||TRAP_FINDS[1];
  r.способ=w.id;
  let т="";for(let i=0;i<40&&!/Найдено/.test(т);i++)т=Traps.find(w.id);
  r.текст=т;r.звук=PLAYED.length>0;
  r.состояние=(safeFn(()=>trapAt(G.place.x,G.place.y),null)||{}).состояние;
  r.повтор=Traps.find(w.id);
  return r;});
 check('под землёй способ находит ловушку, называет её род и то, чем её снимать, и звучит; второй раз говорит, что она уже найдена',
  !нашли.нет&&/Найдено/.test(нашли.текст)&&/Снимается/.test(нашли.текст)&&нашли.звук&&
  нашли.состояние==="найдена"&&/уже найдена/.test(нашли.повтор),нашли);

 /* ── 4. свой род против чужого ── */
 const шансы=await page.evaluate(()=>{
  const r={};G.skills=[];G.agi=20;G.mana=100;
  if(!Array.isArray(G.items))G.items=[];
  r.свой=Traps.chance("analyze","magic");r.чужой=Traps.chance("analyze","mech");
  r.слухСвой=Traps.chance("listen","sound");r.слухЧужой=Traps.chance("listen","space");
  r.риск=Traps.chance("risk","time");
  r.нетСпособа=Traps.chance("нет такого","mech");
  return r;});
 check('свой род способ берёт увереннее чужого, а рискованный опыт берёт любой; несуществующий способ не берёт ничего',
  шансы.свой>шансы.чужой&&шансы.слухСвой>шансы.слухЧужой&&шансы.риск===0.95&&шансы.нетСпособа===0,шансы);

 /* ── 5. честные отказы ── */
 const отказы=await page.evaluate(()=>{
  const r={};НАЛОВУШКУ(null);
  G.inCombat=false;G.skills=[];G.items=[];G.homs=null;G.mount=null;G.mana=0;
  r.анализ=Traps.find("analyze");r.манаЦела=(Number(G.mana)||0)===0;
  r.след=Traps.find("track");
  r.предмет=Traps.find("tool");
  r.спутник=Traps.find("companion");
  G.mana=100;G.inCombat=true;r.слух=Traps.find("listen");G.inCombat=false;
  return r;});
 check('отказ называет, чего не хватает: маны на разбор чар, навыка следопыта, щупа или верёвки, спутника, тишины в бою',
  /шесть маны/.test(отказы.анализ)&&отказы.манаЦела&&/не учили/.test(отказы.след)&&
  /щуп ловчего, верёвка или факел/.test(отказы.предмет)&&/ни гомункула, ни скакуна/.test(отказы.спутник)&&
  /в бою пол не слушают/.test(отказы.слух),отказы);

 /* ── 6. вещь решает ── */
 const вещи=await page.evaluate(()=>{
  /* Ловкость здесь нарочно мала: у ловкого героя чутьё и так упирается в
     предел, и вклад вещи в нём не виден. Меряем именно вещь. */
  const r={};G.skills=[];G.agi=1;
  G.items=[];r.без=trapTool();
  G.items=["Факел"];r.факел=Traps.chance("tool","mech");
  G.items=["Верёвка"];r.верёвка=Traps.chance("tool","mech");
  G.items=["Щуп ловчего"];r.щуп=Traps.chance("tool","mech");
  r.имя=(trapTool()||{}).n;
  /* щуп продаётся в подземной лавке */
  G.place={kind:"dungeon",bx:3000,by:3000,stype:"ruins",depth:5,name:"Проба",x:1,y:1};
  const n=getNPC(G.x,G.y,0,"Торговец");
  r.вЛавке=safeFn(()=>stockFor(n).some(o=>o.n==="Щуп ловчего"),false);
  return r;});
 check('щуп ловчего сильнее верёвки, верёвка сильнее факела, без вещи способа нет; щуп продают в подземной лавке',
  вещи.без===null&&вещи.щуп>вещи.верёвка&&вещи.верёвка>вещи.факел&&вещи.имя==="щуп ловчего"&&вещи.вЛавке,вещи);

 /* ── 7. снятие зависит от рода ── */
 const снятие=await page.evaluate(()=>{
  /* Промах по ловушке — это её срабатывание: второй попытки на той же
     ловушке не бывает. Поэтому на каждую попытку берём свежую. */
  const r={};G.agi=90;G.skills=["tracker"];G.mana=100;G.hp=G.hpMax=90000;
  let т="",рода=[];
  for(let i=0;i<30&&!/обезврежена/.test(т);i++){
   const л=НАЛОВУШКУ("magic");if(!л)break;
   рода.push(л.род);
   setPlaceMark(G.place.x,G.place.y,"trap_on");
   SAID.length=0;trapDisarm(G.place.x,G.place.y);
   const сказ=SAID.join(" ");
   if(/обезврежена/.test(сказ))т=сказ;}
  r.род=рода[0]||null;r.попыток=рода.length;r.текст=т;
  r.знанием=/обезврежена знанием рун/.test(т);
  /* и живую снимают клинком, а не тем же знанием */
  let тж="";
  for(let i=0;i<30&&!/обезврежена/.test(тж);i++){
   const л=НАЛОВУШКУ("living");if(!л)break;
   setPlaceMark(G.place.x,G.place.y,"trap_on");
   G.equip=G.equip||{};G.equip.weapon={id:1,name:"Проба",type:"Меч",val:20};
   SAID.length=0;trapDisarm(G.place.x,G.place.y);
   const сказ=SAID.join(" ");
   if(/обезврежена/.test(сказ))тж=сказ;}
  r.живая=тж;r.клинком=/обезврежена клинком/.test(тж);
  r.фразы=new Set(TRAP_KINDS.map(k=>k.снять)).size;
  return r;});
 check('ловушка снимается тем, чем её род и снимают: знак — знанием рун, живая пасть — клинком, и у родов разные способы снятия',
  снятие.род==="magic"&&снятие.знанием&&снятие.клинком&&снятие.фразы>=5,снятие);

 /* ── 8. меню и команды ── */
 const меню=await page.evaluate(async()=>{
  const r={};const м=JSON.stringify(AM_GROUPS);
  const строки=["traps","traplisten","trapprobe","trapscan","traptrack","traptool","trapmate","traprisk"];
  r.вМеню=строки.filter(c=>!м.includes('"'+c+'"'));
  r.команды=строки.filter(c=>typeof CMD[c]!=="function");
  G.place=null;r.наверхуВидно=строки.filter(c=>c!=="traps").filter(c=>amAvailable(c));
  G.place={kind:"dungeon",bx:3000,by:3000,stype:"ruins",depth:7,name:"Проба",x:1,y:1};
  r.внизуВидно=строки.filter(c=>c!=="traps").filter(c=>amAvailable(c)).length;
  SAID.length=0;CMD.traps();r.сказано=SAID.some(t=>/десять родов/.test(t));
  SAID.length=0;CMD.traprisk();r.рискОтвечает=SAID.join(" ").length>10;
  return r;});
 check('семь строк меню и восьмая с рассказом есть у каждой своя команда; под землёй они видны, наверху скрыты, и каждая отвечает вслух',
  меню.вМеню.length===0&&меню.команды.length===0&&меню.наверхуВидно.length===0&&
  меню.внизуВидно===7&&меню.сказано&&меню.рискОтвечает,меню);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
