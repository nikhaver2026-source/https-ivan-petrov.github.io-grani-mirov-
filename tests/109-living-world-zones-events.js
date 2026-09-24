/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 109: ЖИВОЙ МИР — АНОМАЛЬНЫЕ ЗОНЫ, МЕСТА СИЛЫ, МИРОВЫЕ И СЛУЧАЙНЫЕ
   СОБЫТИЯ, АРМИИ И ФРОНТ, СУДЬБЫ ЖИТЕЛЕЙ, ОТГОЛОСКИ, ПРОРОЧЕСТВА

   1. Данные: двадцать правил зон со звуком, признаком, маршрутом, ресурсом
      и опасностью; сто зон по местам; шестьдесят мест силы пяти родов;
      десять мировых событий; четырнадцать случайных; шесть пророчеств;
      восемь ступеней судьбы; самопроверка мира.
   2. Зона: вход называет правило, признак, безопасный путь и опасность,
      звучит и пишется в реестр; первое открытие даёт опыт; правило работает
      на шаге (время, вода, износ, припасы) и на встречах и чарах.
   3. Место силы: вход называет дар, школа его стихии дешевле, погода
      тянется к своей, обряд раз в день даёт травы и оберег.
   4. Мировое событие: начинается со звуком и летописью, меняет цены,
      встречи, чары и сеть, кончается по сроку.
   5. Случайное событие: доля зависит от состояния мира; событие приходит
      по условию, звучит и ложится в отголоски.
   6. Армии: восемь свойств — численность, командование, мораль, снабжение,
      разведка, транспорт, магическая поддержка, осадные средства; фронт
      двигается сам; служба по одному разу в день. Семь ролей §23 и то, что
      каждая из них делает, проверяет отдельный набор 128 — здесь сверяется
      только, что окно живого мира показывает их все.
   7. Судьбы: разговор заводит судьбу, день двигает её ступенями, смерть
      оставляет наследство; строка судьбы в окне жителя.
   8. Отголоски и пророчества: сон доносит прошедшее; пророчество слышат,
      ускоряют, задерживают и срывают; сбывшееся звучит и пишется.
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
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};r.rules=ANOM_RULES.length;r.rulesOk=ANOM_RULES.every(x=>SOUND_BANK[x.маркер]&&x.как&&x.маршрут&&RES_BASE[x.ресурс]&&x.опасность&&x.о);
  const z=Zones.all();r.zones=z.length;r.zonesOk=z.every(x=>ANOM_BY_ID[x.правило]&&x.x>=0&&x.x<WORLD&&x.y>=0&&x.y<WORLD&&x.r>=6)&&new Set(z.map(x=>x.id)).size===z.length;
  r.power=Power.all().length;r.powerOk=POWER_PLACES.every(p=>SOUND_BANK[p.звук]&&MSCHOOL_BY_ID[p.школа]&&WEATHER_BY_ID[p.погода]&&RES_BASE[p.трава]&&p.дар);
  r.global=GLOBAL_EVENTS.length;r.globalOk=GLOBAL_EVENTS.every(e=>SOUND_BANK[e.звук]&&e.срок>0&&typeof e.начать==="function");
  /* Случайных событий четырнадцать; два события Сопряжения живут только на
     время мирового события и считаются отдельно (§5). */
  r.random=RANDOM_EVENTS.filter(e=>!/^(conj_|mirth_)/.test(e.id)).length;
  r.randomMirth=RANDOM_EVENTS.filter(e=>e.id.indexOf("mirth_")===0).length;
  r.randomConj=RANDOM_EVENTS.filter(e=>e.id.indexOf("conj_")===0).length;
  r.randomOk=RANDOM_EVENTS.every(e=>SOUND_BANK[e.звук]&&typeof e.когда==="function"&&typeof e.делать==="function");
  r.proph=PROPHECIES.length;r.prophOk=PROPHECIES.every(p=>p.текст&&p.ускорить&&typeof p.условие==="function"&&typeof p.итог==="function"&&typeof p.срыв==="function");
  r.arcs=ARC_STEPS.length;
  r.modules=["ZONES","POWER","GLOBAL","HAPPEN","ARMIES","ARCS","ECHOES","PROPHECY"].every(m=>Modules.get?!!Modules.get(m):true);
  const sc=worldSelfCheck();const row=sc.find(x=>x.id==="living");r.selfcheck=row?row.ok:null;
  return r;});
 check('двадцать правил зон со звуком, признаком, маршрутом, настоящим ресурсом и опасностью; сто зон с разными именами внутри мира; шестьдесят мест силы пяти родов со звуком, школой, погодой и травой',
  данные.rules===20&&данные.rulesOk&&данные.zones===100&&данные.zonesOk&&данные.power===60&&данные.powerOk,данные);
 check('десять мировых событий, четырнадцать случайных (и двенадцать весёлых), шесть пророчеств, восемь ступеней судьбы, восемь модулей; самопроверка мира видит живой мир',
  данные.global===10&&данные.globalOk&&данные.random===14&&данные.randomConj===2&&данные.randomMirth===12&&данные.randomOk&&данные.proph===6&&данные.prophOk&&данные.arcs===8&&данные.modules&&данные.selfcheck===true,данные);

 /* ── 2. зона ── */
 const зона=await page.evaluate(()=>{
  const r={};G.place=null;G.ship=null;G.seenZones={};G.zoneNow=null;G.ledger=null;Ledger.ensure();
  const z=Zones.all().find(x=>ANOM_BY_ID[x.правило].id==="fast")||Zones.all()[0];
  const бx=G.x,бy=G.y;G.x=z.x;G.y=z.y;r.тут=!!Zones.here()&&Zones.here().id===z.id;
  PLAYED.length=0;SAID.length=0;JT.length=0;const xp=Number(G.xp)||0;
  r.первый=Zones.arrive();r.слова=SAID.find(t=>new RegExp(z.n).test(t))||"";r.звук=PLAYED.length>0;r.опыт=(Number(G.xp)||0)-xp>=20;r.летопись=JT.some(t=>/Аномальная зона/.test(t));r.реестр=Ledger.has("координаты",new RegExp(z.n));
  r.повтор=Zones.arrive();
  r.правилоВСловах=/Признак: /.test(r.слова)&&/Безопасно — /.test(r.слова)&&/Опасность: /.test(r.слова);
  /* правило работает на шаге */
  const rule=ANOM_BY_ID[z.правило];const час=Number(G.hour)||0,вода=Number(G.water)||0;r.шаг=Zones.step();
  r.времяИлиВода=(rule.id==="fast"||rule.id==="slow")?(Number(G.hour)||0)!==час:(rule.id==="heavy"||rule.id==="heat")?(Number(G.water)||0)<вода:true;
  r.spellK=Zones.spellK();r.encK=Zones.encounterK();r.ресурс=Zones.resourceHere();r.text=Zones.text();
  G.x=бx;G.y=бy;Zones.arrive();r.вне=Zones.here()===null||Zones.here()!==z;
  return r;});
 check('вход в зону звучит и называет правило, признак, безопасный путь и опасность; первое открытие даёт опыт, летопись и запись в реестр; повторный вход молчит; правило работает на шаге, на чарах, встречах и ресурсе',
  зона.тут&&зона.первый===true&&зона.слова.length>0&&зона.правилоВСловах&&зона.звук&&зона.опыт&&зона.летопись&&зона.реестр&&зона.повтор===false&&зона.шаг===true&&зона.времяИлиВода&&зона.spellK>0&&зона.encK>0&&зона.ресурс&&/радиус|Радиус/.test(зона.text),зона);

 /* ── 3. место силы ── */
 const место=await page.evaluate(()=>{
  const r={};G.place=null;G.seenPower={};G.powerNow=null;G.powerRite=0;Energy.ensure();G.will=10;G.mana=G.manaMax=30;G.inv={};G.buffs={};G.order=0;
  const p=Power.all()[0];const k=POWER_BY_ID[p.вид];const бx=G.x,бy=G.y;G.x=p.x;G.y=p.y;
  PLAYED.length=0;SAID.length=0;r.вход=Power.arrive();r.слова=SAID.find(t=>new RegExp(k.n).test(t))||"";r.звук=PLAYED.length>0;r.повтор=Power.arrive();
  const sp={n:"проба",school:k.школа,cost:10};const sp2={n:"проба2",school:k.школа==="water"?"fire":"water",cost:10};
  r.своя=Power.spellK(sp);r.чужая=Power.spellK(sp2);
  const w={};w[k.погода]=10;Power.weather(w,p.x,p.y);r.погода=w[k.погода];
  r.трава=Power.herb();const порядок=Balance.get();r.обряд=Power.rite();r.ресурс=Number(G.inv[k.трава])||0;r.оберег=buffActive("оберег");r.порядок=Balance.get()-порядок;r.дважды=Power.rite();
  G.x=бx;G.y=бy;Power.arrive();r.text=Power.text();
  return r;});
 check('вход в место силы звучит и называет дар; школа его стихии дешевле, чужая — нет; погода тянется к своей; обряд раз в день даёт травы, оберег и клонит к порядку',
  место.вход===true&&место.слова.length>0&&место.звук&&место.повтор===false&&место.своя===0.6&&место.чужая===1&&место.погода>10&&место.трава&&/Обряд у места/.test(место.обряд)&&место.ресурс===2&&место.оберег&&место.порядок>=3&&/раз в день/.test(место.дважды),место);

 /* ── 4. мировое событие ── */
 const событие=await page.evaluate(()=>{
  const r={};G.global=null;G.day=50;r.нет=Global.text();r.k0=Global.k("цены");
  PLAYED.length=0;JT.length=0;SAID.length=0;r.старт=Global.start("plague");r.звук=PLAYED.length>0;r.летопись=JT.some(t=>/Мировое событие: Эпидемия/.test(t));r.сказано=SAID.find(t=>/Мировое событие: Эпидемия/.test(t))||"";
  r.k1=Global.k("цены");r.цена=[marketPrice("руда",0,50)];
  G.global=null;r.цена.push(marketPrice("руда",0,50));
  Global.start("conjunction");r.встречи=Global.k("встречи");r.отголосок=Echoes.list().some(e=>/Сопряжение Грани/.test(e.n));
  G.day=Number(G.global.до)+1;SAID.length=0;r.кончилось=Global.cur();r.конецСлова=SAID.find(t=>/кончилось/.test(t))||"";
  return r;});
 check('мировое событие начинается со звуком, словами и летописью, меняет цены и встречи, ложится в отголоски и кончается по сроку',
  /Мировых событий сейчас нет/.test(событие.нет)&&событие.k0===1&&/Эпидемия/.test(событие.старт)&&событие.звук&&событие.летопись&&событие.сказано.length>0&&событие.k1===1.25&&событие.цена[0]>событие.цена[1]&&событие.встречи===1.4&&событие.отголосок&&событие.кончилось===null&&/кончилось/.test(событие.конецСлова),событие);

 /* ── 5. случайное событие ── */
 const случай=await page.evaluate(()=>{
  const r={};G.place=null;G.inCombat=false;G.combat=null;G.global=null;G.order=0;G.day=60;G.hour=12;
  r.chance0=Happen.chance();Global.start("plague");r.chance1=Happen.chance();G.global=null;
  G.inv={};PLAYED.length=0;SAID.length=0;G.echoes=[];r.caravan=Happen.fire("caravan");r.еда=Number(G.inv["Еда в дорогу"])||0;r.звук=PLAYED.length>0;r.отголосок=(G.echoes||[]).length>0;
  G.place={kind:"city",bx:G.x,by:G.y,stype:"castle",name:"Проба",depth:0,x:1,y:1};r.вГороде=Happen.fire("caravan");
  G.place=null;G.weather="Ясно";r.снег=Happen.fire("snow");
  r.тик=typeof Happen.tick==="function";
  return r;});
 check('доля случайного события растёт от состояния мира; событие приходит по своему условию, звучит, говорит и ложится в отголоски; неподходящее объясняет отказ',
  случай.chance1>случай.chance0&&/Случай: обоз/.test(случай.caravan||"")&&случай.еда===1&&случай.звук&&случай.отголосок&&/сейчас такого не случается/.test(случай.вГороде||"")&&/сейчас такого не случается/.test(случай.снег||"")&&случай.тик,случай);

 /* ── 6. армии ── */
 const армии=await page.evaluate(()=>{
  const r={};G.armies={};G.serveDay=0;G.inCombat=false;G.combat=null;G.inv={};G.gold=0;
  const a=Armies.state(0);r.поля=["числ","мораль","снабжение","разведка","транспорт","чары","фронт"].filter(k=>a[k]==null);
  r.сила=Armies.strength(0)>0;
  /* найти день с войной */
  let день=null;for(let d=1;d<400&&день===null;d++){if((warsAt(d)||[]).length)день=d;}
  r.война=день!==null;if(день!==null){G.day=день;const w=warsAt(день)[0];const до=Armies.state(w.a).фронт;r.tick=Armies.tick();r.сдвиг=Armies.state(w.a).фронт!==до||Armies.state(w.a).снабжение<70;
   G.x=EMPIRES[w.a].cap.x;G.y=EMPIRES[w.a].cap.y;G.serveDay=0;r.scout=Armies.serve("scout");r.дважды=Armies.serve("scout");
   G.serveDay=0;r.подвозНет=Armies.serve("supply");G.inv["руда"]=3;G.serveDay=0;r.подвоз=Armies.serve("supply");r.золото=G.gold;
   G.serveDay=0;r.командНет=Armies.serve("command");
   G.serveDay=0;r.вылазка=Armies.serve("raid");r.бой=!!(G.inCombat&&G.combat&&/дозор/i.test(G.combat.m.n));if(r.бой){G.combat.hp=0;victory();}}
  r.text=Armies.text();return r;});
 check('у армии есть численность, мораль, снабжение, разведка, транспорт и чары; фронт двигается сам и ест снабжение; служба разведкой, подвозом и вылазкой — по разу в день, командование требует ветви',
  армии.поля.length===0&&армии.сила&&армии.война&&армии.tick===true&&армии.сдвиг&&/Разведка для/.test(армии.scout||"")&&/уже отслужили/.test(армии.дважды||"")&&/две руды/.test(армии.подвозНет||"")&&/Подвоз для/.test(армии.подвоз||"")&&армии.золото===40&&/командование/.test(армии.командНет||"")&&армии.бой,армии);

 /* ── 7. судьбы ── */
 const судьбы=await page.evaluate(()=>{
  const r={};G.arcs={};G.echoes=[];G.day=70;
  const n=getNPC(20000,20000,0,"Кузнец");const a=Arcs.note(n);r.завели=!!a&&a.имя===n.name;r.поля=["лет","семья","имущество","долги","травмы","шаги","жив"].filter(k=>a[k]==null);
  r.повтор=Arcs.note(n)===a;
  JT.length=0;const шаг=Arcs.step(n.key);r.шаг=шаг;r.шагов=a.шаги.length;r.летопись=JT.length>0;r.отголосок=(G.echoes||[]).some(e=>e.род==="судьба");
  r.line=Arcs.line(n);
  /* смерть оставляет наследство */
  a.лет=70;a.травмы=2;for(let i=0;i<30&&a.жив;i++){G.day=70+i;Arcs.step(n.key);}
  r.умер=!a.жив;r.наследство=a.наследство!=null;
  r.text=Arcs.text();return r;});
 check('разговор заводит судьбу жителя с возрастом, семьёй, имуществом, долгами и травмами; ступень судьбы пишется в летопись и отголоски; строка судьбы есть в окне; смерть оставляет наследство',
  судьбы.завели&&судьбы.поля.length===0&&судьбы.повтор&&судьбы.шаг&&судьбы.шагов>=1&&судьбы.летопись&&судьбы.отголосок&&/list-line/.test(судьбы.line||"")&&судьбы.умер&&судьбы.наследство&&/Судеб на памяти/.test(судьбы.text),судьбы);

 /* ── 8. отголоски и пророчества ── */
 const судьба=await page.evaluate(()=>{
  const r={};G.echoes=[];G.proph={};G.ledger=null;Ledger.ensure();Energy.ensure();G.will=10;G.mana=G.manaMax=30;G.day=80;
  r.пусто=Echoes.dream();Echoes.add("проба вести","проба");r.сон=Echoes.dream();r.вРеестре=Ledger.list("история").some(e=>e.откуда==="отголосок");
  r.hear=Prophecy.hear("gate");r.услышано=!!(G.proph.gate&&G.proph.gate.услышано);
  const c0=Prophecy.chance("gate");r.ускор=Prophecy.push("gate","ускорить");const c1=Prophecy.chance("gate");r.рост=c1>c0;
  r.задерж=Prophecy.push("gate","задержать");const c2=Prophecy.chance("gate");r.спад=c2<c1;
  PLAYED.length=0;r.срыв=Prophecy.push("gate","сорвать");r.сорвано=G.proph.gate.сбылось===false;r.снова=Prophecy.push("gate","ускорить");
  /* сбывшееся */
  Prophecy.hear("blade");G.proph.blade.ускорено=5;G.deeds={kills:60};const rnd=Math.random;Math.random=()=>0;const g=G.gold;JT.length=0;r.daily=Prophecy.daily();Math.random=rnd;
  r.сбылось=G.proph.blade.сбылось===true;r.награда=G.gold-g;r.летопись=JT.some(t=>/Пророчество сбылось/.test(t));
  r.text=Prophecy.text();return r;});
 check('сон доносит прошедшее и пишется в реестр; пророчество слышат, ускоряют и задерживают долей, срывают насовсем; сбывшееся платит, звучит и пишется в летопись',
  /Снов не было/.test(судьба.пусто)&&/проба вести/.test(судьба.сон)&&судьба.вРеестре&&/Пророчество Врат/.test(судьба.hear)&&судьба.услышано&&/подтолкнули/.test(судьба.ускор||"")&&судьба.рост&&/придержали/.test(судьба.задерж||"")&&судьба.спад&&/сорвано/.test(судьба.срыв||"")&&судьба.сорвано&&/уже/.test(судьба.снова||"")&&судьба.daily===true&&судьба.сбылось&&судьба.награда===150&&судьба.летопись&&/Пророчество Клинка: сбылось/.test(судьба.text),судьба);

 /* ── 9. окно и меню ── */
 const окно=await page.evaluate(async()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();SAID.length=0;CMD.living();await new Promise(res=>setTimeout(res,80));
  r.окно=activeLayer()&&activeLayer().id;r.секции=["lwZone","lwPower","lwGlobal","lwArmies","lwArcs","lwEchoes","lwProph"].filter(id=>!(document.getElementById(id)||{}).innerHTML);
  r.служба=document.querySelectorAll('#lwArmies [data-cmd^="serve:"]').length;r.пророчества=document.querySelectorAll('#lwProph [data-cmd^="proph:hear~"]').length;
  r.сказано=SAID.find(t=>/^Живой мир\./.test(t))||"";
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();r.меню=JSON.stringify(AM_GROUPS).includes('"living"');
  return r;});
 check('окно «Живой мир» с семью разделами, семью службами в войске и шестью пророчествами, говорит состояние; строка в меню действий',
  окно.окно==="modal-living"&&окно.секции.length===0&&окно.служба===7&&окно.пророчества===6&&окно.сказано.length>0&&окно.меню,окно);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
