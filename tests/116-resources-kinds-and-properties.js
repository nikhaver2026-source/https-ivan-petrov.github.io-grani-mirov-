/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 116: ДЕВЯТНАДЦАТЬ РОДОВ РЕСУРСОВ И СЕМЬ СВОЙСТВ (§17 брифа)

   1. Данные: девятнадцать родов, у каждого способ добычи, обработка, рынок
      и свои сезоны; девять новых ресурсов с ценой, значком, маяком и родом;
      всякое правило аномальной зоны родит свой ресурс.
   2. Семь свойств есть у любого ресурса: у земного, у глубинного, у нового.
   3. Сезон не украшение: не в свой сезон ресурс дороже.
   4. С убитой твари берут по её природе: с волка шкуру, с паука яд, с
      голема — ни крови, ни нутра.
   5. Аномальная зона родит по своему правилу и отдаёт раз в сутки.
   6. Рунный камень вырубают в руинах, раз в сутки и не везде.
   7. Сума называет добычу и говорит, что нынче не сезон.
   8. Строки меню видны там, где им место.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const SEASON_IDS=["spring","summer","autumn","winter"];
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.родов=RES_KINDS.length;
  r.родыОк=RES_KINDS.every(k=>k.n&&k.добыча&&k.обработка&&k.рынок&&k.res.length&&k.сезоны.length
   &&k.сезоны.every(c=>SEASONS.some(x=>x.id===c)));
  r.сезонов=RES_SEASONS.length;r.сейчас=safeFn(()=>seasonNow().id,null);
  r.порыМира=SEASONS.map(x=>x.id).join();r.свои=RES_SEASONS.join();
  const новые=["шкура","орган","кровь","яд","эссенция","эфир","осколок времени","тяжёлый минерал","рунный камень"];
  r.новых=новые.length;
  r.безЦены=новые.filter(x=>!RES_BASE[x]);
  r.безЗначка=новые.filter(x=>!(x in RESICON));
  r.безМаяка=новые.filter(x=>!SOUND_BANK[BEACON_ROLE[RESBEACON[x]]]);
  r.безРода=новые.filter(x=>!RES_KIND_BY_RES[x]);
  r.зоныБез=ANOM_RULES.filter(x=>!ZONE_RES[x.id]).map(x=>x.id);
  r.модуль=!!Modules.get("RES");
  const sc=worldSelfCheck();const s=sc.find(x=>x.id==="res");r.строка=s?s.ok:null;
  /* Эхо-скан называет ресурс голосом маяка. Девять поздних ресурсов делили
     четыре чужих маяка — на слух шкура не отличалась от кости, а эфир от
     кристалла. Теперь у каждого свой маяк, своя запись и своё имя. */
  r.маяки=новые.map(x=>RESBEACON[x]);
  r.маяковРазных=new Set(r.маяки).size;
  r.делятСоСтарым=r.маяки.filter(b=>["res_tree","res_stone","res_ore","res_herbs",
   "res_berry","res_crystal","res_shell","res_bone"].indexOf(b)>=0);
  r.безИмени=r.маяки.filter(b=>!BEACON_INFO[b]);
  r.чужаяЗапись=новые.filter(x=>!/^oc_res_/.test(BEACON_ROLE[RESBEACON[x]]||""));
  return r;});
 check('у девяти поздних ресурсов девять своих маяков: своя запись, своё имя и ни одного общего со старыми',
  данные.маяковРазных===9&&данные.делятСоСтарым.length===0&&данные.безИмени.length===0
  &&данные.чужаяЗапись.length===0,
  {маяки:данные.маяки,разных:данные.маяковРазных,общие:данные.делятСоСтарым,
   безИмени:данные.безИмени,чужая:данные.чужаяЗапись});
 check('девятнадцать родов ресурсов, у каждого способ добычи, обработка, рынок и свои поры; поры берутся те же, что у мира, а не свои',
  данные.родов===19&&данные.родыОк&&данные.сезонов===4&&данные.свои===данные.порыМира&&
  SEASON_IDS.indexOf(данные.сейчас)>=0,данные);
 check('девять новых ресурсов с ценой, значком, звучащим маяком и родом; всякое правило зоны родит своё; модуль на месте и самопроверка мира его видит',
  данные.новых===9&&данные.безЦены.length===0&&данные.безЗначка.length===0&&данные.безМаяка.length===0&&
  данные.безРода.length===0&&данные.зоныБез.length===0&&данные.модуль&&данные.строка===true,данные);

 /* ── 2. семь свойств у любого ── */
 const свойства=await page.evaluate(()=>{
  const r={};const поля=["регион","сезон","глубина","редкость","добыча","обработка","рынок"];
  const проба=["дерево","руда","кость","эхокристалл","первый металл","шкура","эфир","осколок времени","пепел","треска"];
  r.пустые=проба.filter(res=>{const i=Res.info(res);return поля.some(f=>!i[f]||String(i[f]).length<3);});
  r.глубинный=Res.info("эхокристалл").глубина;
  r.земной=Res.info("дерево").глубина;
  r.редкости=[...new Set(проба.map(x=>Res.info(x).редкость))].length;
  r.текст=Res.text("эфир");
  r.нет=Res.text("нет такого");
  return r;});
 check('семь свойств есть у любого ресурса — земного, глубинного и нового; глубина глубинной породы названа ярусом, а редкость читается по цене',
  свойства.пустые.length===0&&/яруса и ниже/.test(свойства.глубинный)&&/с поверхности/.test(свойства.земной)&&
  свойства.редкости>=3&&/Регион: /.test(свойства.текст)&&/Сезон: /.test(свойства.текст)&&
  /Редкость: /.test(свойства.текст)&&/Покупает /.test(свойства.текст)&&/Такого ресурса нет/.test(свойства.нет),свойства);

 /* ── 3. сезон решает ── */
 const сезон=await page.evaluate(()=>{
  const r={};
  /* грибы — осенние: весной они не в сезон и дороже */
  /* Пора в мире длится двадцать четыре дня: весна 1–24, лето 25–48,
     осень 49–72, зима 73–96. */
  const наДень=(d)=>{G.day=d;return {сезон:seasonNow().id,вСезон:Res.inSeason("грибы"),k:Res.priceK("грибы")};};
  r.весна=наДень(1);r.лето=наДень(30);r.осень=наДень(55);r.зима=наДень(80);
  r.дороже=r.весна.k>r.осень.k&&r.осень.k===1;
  r.круглыйГод=[1,30,55,80].every(dd=>{G.day=dd;return Res.inSeason("камень");});
  G.day=1;
  return r;});
 check('сезон не украшение: грибы в свой сезон стоят как стоят, а вне его дороже; камень идёт круглый год',
  сезон.осень.сезон==="autumn"&&сезон.осень.вСезон&&!сезон.весна.вСезон&&сезон.дороже&&сезон.круглыйГод,сезон);

 /* ── 4. добыча с убитой твари ── */
 const добыча=await page.evaluate(()=>{
  const r={};G.dark=false;G.skills=[];
  const сотня=(id,lvl)=>{G.inv={};for(let i=0;i<200;i++)Res.fromKill({id,lvl:lvl||5});return Object.keys(G.inv).sort();};
  r.волк=сотня("wolf");
  r.паук=сотня("spider");
  r.голем=сотня("golem");
  r.дракон=сотня("dragon");
  G.inv={};r.пусто=Res.fromKill({});
  return r;});
 check('с убитой твари берут по её природе: с волка шкуру и нутро, с паука яд, с голема — ничего, с дракона и шкуру, и нутро, и кровь',
  добыча.волк.indexOf("шкура")>=0&&добыча.волк.indexOf("орган")>=0&&добыча.волк.indexOf("яд")<0&&
  добыча.паук.indexOf("яд")>=0&&добыча.голем.length===0&&
  добыча.дракон.indexOf("шкура")>=0&&добыча.дракон.indexOf("кровь")>=0&&добыча.пусто==="",добыча);

 /* ── 5. зона родит по правилу ── */
 const зона=await page.evaluate(()=>{
  const r={};G.place=null;G.ship=null;G.zoneTake={};G.inv={};G.day=10;
  const z=Zones.all()[0];G.x=z.x;G.y=z.y;
  r.правило=z.правило;r.ждём=ZONE_RES[z.правило];
  PLAYED.length=0;
  r.первое=Res.fromZone();
  r.взято=Object.keys(G.inv).join();
  r.звук=PLAYED.includes("oc_diamond");
  r.второе=Res.fromZone();
  G.day=11;r.назавтра=Res.fromZone();
  /* разные правила — разные ресурсы */
  const родит=[...new Set(Zones.all().slice(0,40).map(x=>ZONE_RES[x.правило]))];
  r.разных=родит.length;
  return r;});
 check('аномальная зона родит то, что следует из её правила, звучит, отдаёт раз в сутки и назавтра снова; разные правила родят разное',
  зона.взято===зона.ждём&&/взято/.test(зона.первое)&&зона.звук&&/уже брали/.test(зона.второе)&&
  /взято/.test(зона.назавтра)&&зона.разных>=3,зона);

 /* ── 6. рунный камень в руинах ── */
 const руины=await page.evaluate(()=>{
  const r={};G.zoneTake={};G.inv={};G.day=20;
  G.place={kind:"place",bx:777,by:777,stype:"ruins",depth:0,name:"Руины пробы",x:2,y:2};
  let т="",n=0;
  while(n++<25&&!/рунный камень ×1/.test(т)){G.zoneTake={};т=Res.fromRuins();}
  r.вышло=т;r.вСуме=Number(G.inv["рунный камень"])||0;
  r.второе=Res.fromRuins();
  G.place={kind:"place",bx:777,by:777,stype:"tavern",depth:0,name:"Таверна",x:2,y:2};
  r.неТам=Res.fromRuins();
  G.place=null;
  return r;});
 check('рунный камень вырубают из кладки в руинах: выходит не всегда, но выходит; ту же кладку за сутки дважды не разберёшь, а в таверне её нет вовсе',
  /рунный камень ×1/.test(руины.вышло)&&руины.вСуме>=1&&/уже разобрали/.test(руины.второе)&&
  /руин здесь нет/.test(руины.неТам),руины);

 /* ── 7. сума и рассказ ── */
 const сума=await page.evaluate(()=>{
  const r={};G.inv={};r.пусто=Res.bag();
  G.day=1;G.inv={"грибы":3,"камень":5};
  r.есть=Res.bag();
  r.список=Res.listText();
  return r;});
 check('сума называет добычу и честно говорит, что нынче не сезон; рассказ о ресурсах называет все девятнадцать родов и нынешний сезон',
  /ресурсов нет/.test(сума.пусто)&&/грибы ×3/.test(сума.есть)&&/не сезон/.test(сума.есть)&&
  /камень ×5/.test(сума.есть)&&/19 родов/.test(сума.список)&&/Сейчас /.test(сума.список),сума);

 /* ── 8. меню ── */
 const меню=await page.evaluate(()=>{
  const r={};const м=JSON.stringify(AM_GROUPS);
  const строки=["resinfo","resbag","reszone","resruins"];
  r.вМеню=строки.filter(c=>!м.includes('"'+c+'"'));
  r.команды=строки.filter(c=>typeof CMD[c]!=="function");
  G.place=null;G.x=1000;G.y=1000;
  r.вПолеЗона=amAvailable("reszone");r.вПолеРуины=amAvailable("resruins");
  const z=Zones.all()[0];G.x=z.x;G.y=z.y;r.вЗоне=amAvailable("reszone");
  G.place={kind:"place",bx:777,by:777,stype:"ruins",depth:0,name:"Руины",x:2,y:2};
  r.вРуинах=amAvailable("resruins");G.place=null;
  SAID.length=0;CMD.resinfo();r.сказано=SAID.some(t=>/19 родов/.test(t));
  SAID.length=0;CMD.resbag();r.сумаГоворит=SAID.join(" ").length>5;
  return r;});
 check('у каждой строки своя команда; «взять в зоне» видно только в зоне, «вырубить камень» — только в руинах, и обе отвечают вслух',
  меню.вМеню.length===0&&меню.команды.length===0&&меню.вПолеЗона===false&&меню.вПолеРуины===false&&
  меню.вЗоне===true&&меню.вРуинах===true&&меню.сказано&&меню.сумаГоворит,меню);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
