/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 211: 4.6 — РЕЧЬ В БОЮ, ГОЛОСА ЗАКАЗЧИКОВ И ОБОЗОВ, БАЛЛАДЫ,
   ТИХИЙ ШАГ, ПЕРЕКЛЮЧАТЕЛИ, МЕЧ, ЖУРНАЛ ДЕЛ, РУКОВОДСТВО

   Жалобы игрока (4.4):
   — разобранный стартовый меч снова появляется в сумке, а продать его нельзя;
   — переключатель в настройках не слышно: нужен свой звук на включение и
     свой на выключение;
   — разбойники и разумные твари в бою молчат, большие — пусть говорят
     страшно;
   — при ходьбе называются проходы и стороны света: нужно только то, что
     впереди и в скольких шагах;
   — сказитель не поёт; журнал дел говорит «0 незавершённых», хотя дело
     взято; руководство — сто глав вразнобой;
   — квест заказчик не озвучивает, у обозников и жителей одинаковые голоса.

   1. Стартовый меч: разобранный не возвращается, продаётся, как всё оружие.
   2. Переключатель в окне звучит своей записью: включение и выключение —
      разные файлы.
   3. «Тихий шаг» (по умолчанию включён): шаг без смены места молчит.
   4. Взятое дело видно в журнале сразу: окно заданий называет число дел.
   5. В бою говорят: разбойник, исполин, дракон, дух, страж Предтеч; зверь
      молчит. Начало, удар, рана, край, гибель — свои пулы; большие звучат
      записью, пропущенной через понижение.
   6. Поручение — словами заказчика: руда, север, выслеживание.
   7. Три пары голосов у жителей, у обозов — по роду.
   8. Восемь баллад: файлы на месте, песня не повторяется, пока не спеты
      все; шаг обрывает песню.
   9. Руководство: 31 глава подряд в девяти частях, прежние главы — разделы.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.maybeEvent=()=>{};settings.effects=1;G.inCombat=false;G.combat=null;G.place=null;G.ship=null;
  window.FILES=[];const bf=Bank.file.bind(Bank);Bank.file=function(p,o){FILES.push(String(p));return bf(p,o);};
  window.SAID=[];const fr=Folk.реплика.bind(Folk);Folk.реплика=function(р,с,n,ж,o){SAID.push({р,с,голос:o&&o.голос,rate:o&&o.rate});return fr(р,с,n,ж,o);};});

 /* ── 1. меч ── */
 const меч=await page.evaluate(()=>{
  const r={};normalizeWeaponState();
  r.естьСперва=G.gear.some(x=>x.id===DEFAULT_WEAPON.id)||!!(G.equip.weapon&&G.equip.weapon.id===DEFAULT_WEAPON.id);
  const row=invAll().find(x=>x.it&&x.it.id===DEFAULT_WEAPON.id);
  r.вПродаже=!!row&&shopSellRows(getNPC(G.x,G.y,0,"Торговец")).some(x=>x.row.it&&x.row.it.id===DEFAULT_WEAPON.id);
  if(row)invRemoveItem(row);
  normalizeWeaponState();normalizeWeaponState();
  r.вернулся=G.gear.some(x=>x.id===DEFAULT_WEAPON.id)||!!(G.equip.weapon&&G.equip.weapon.id===DEFAULT_WEAPON.id);
  r.метка=G.starterGiven;
  return r;});
 check('1. стартовый меч продаётся, а разобранный или проданный — не возвращается',
  меч.естьСперва&&меч.вПродаже&&!меч.вернулся&&меч.метка===1,меч);

 /* ── 2. переключатели ── */
 const пер=await page.evaluate(()=>{
  const r={файлы:[UI_BANK.ui_toggle_on,UI_BANK.ui_toggle_off]};
  openModal("modal-settings");
  const box=document.querySelector('#modal-settings input[type=checkbox]');
  r.есть=!!box;
  if(box){box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));r.первый=Toggles.last&&Toggles.last.on;
   box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));r.второй=Toggles.last&&Toggles.last.on;
   box.checked=!box.checked;box.dispatchEvent(new Event('change',{bubbles:true}));}
  return r;});
 const tf=пер.файлы.map(f=>path.join(ROOT,'sounds',f));
 check('2. переключатель звучит: включение и выключение — две разные записи без потерь',
  пер.есть&&пер.первый!==пер.второй&&typeof пер.первый==="boolean"&&пер.файлы[0]!==пер.файлы[1]
  &&tf.every(f=>fs.existsSync(f)&&/\.flac$/.test(f)),пер);
 await page.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>{if(!m.hidden)safeFn(()=>closeModal(m));});});

 /* ── 3. тихий шаг ── */
 const тихо=await page.evaluate(()=>{
  const r={умолч:settings.quietWalk};
  settings.quietWalk=1;
  enterPlace({x:700,y:700,structure:{type:"village",name:"Проба",beacon:"village"}});
  let ok=0;for(let i=0;i<12&&!(QuietWalk.last&&QuietWalk.last.тихо);i++){const d=["N","E","S","W"][i%4];QuietWalk.last=null;const p=G.place,x=p.x,y=p.y;move(d);
   if(p.x!==x||p.y!==y){ok++;r.сказано=QuietWalk.last&&QuietWalk.last.сказано;}}
  r.шагнул=ok>0;r.тихо=QuietWalk.last&&QuietWalk.last.тихо;
  r.бездир=!/(север|юг|запад|восток|проход)/i.test(String(r.сказано||""));
  /* без тихого шага описание клетки звучит, как прежде */
  settings.quietWalk=0;QuietWalk.last=null;for(let i=0;i<8&&!QuietWalk.last;i++){move(["S","W","N","E"][i%4]);}
  r.громко=!!(QuietWalk.last&&QuietWalk.last.сказано&&!QuietWalk.last.тихо);
  settings.quietWalk=1;safeFn(()=>leavePlace());G.place=null;
  return r;});
 check('3. «Тихий шаг» включён по умолчанию: при ходьбе не звучат проходы и стороны света',
  тихо.умолч!==0&&тихо.шагнул&&тихо.тихо===true&&тихо.бездир&&тихо.громко,тихо);

 /* ── 4. журнал дел ── */
 const журнал=await page.evaluate(()=>{
  const r={};G.quests=[];
  let n=null;for(let i=0;i<6&&!n;i++){const c=findCities(G.x,G.y,60,6)[i];if(!c)break;for(let j=0;j<4;j++){const x=getNPC(c.x,c.y,j);const q=safeFn(()=>questFor(x),null);if(q){n=x;break;}}}
  r.нашёл=!!n;if(!n)return r;
  takeNPCQuest(n);
  r.открыто=openQuests().length;
  openModal("modal-quests");
  r.итог=typeof modalSummary==="function"?modalSummary("modal-quests"):"";
  r.список=document.querySelectorAll('#modal-quests .item, #modal-quests .list-line, #modal-quests button').length;
  safeFn(()=>closeModal(document.getElementById("modal-quests")));
  return r;});
 check('4. взятое дело сразу в журнале: окно заданий называет «Незакрытых дел 1»',
  журнал.нашёл&&журнал.открыто>=1&&/Незакрытых дел [1-9]/.test(журнал.итог)&&журнал.список>0,журнал);

 /* ── 5. речь в бою ── */
 const бой=await page.evaluate(()=>{
  const r={};
  const find=id=>MONSTERS.find(m=>m.id===id)||DARK_MONSTERS.find(m=>m.id===id)||DEEP_MONSTERS.find(m=>m.id===id);
  r.кто={bandit:FoeTalk.who(find("bandit")),troll:FoeTalk.who(find("troll")),dragon:FoeTalk.who(find("dragon")),
   wraith:FoeTalk.who(find("wraith")),golem:FoeTalk.who(find("golem")),wolf:FoeTalk.who(find("wolf")),spider:FoeTalk.who(find("spider"))};
  const пулы=["bandit","pirate","goblin","giant","dragon","lich","fiend","spirit","siren","construct"];
  const миги=["start","attack","hurt","low","taunt","death"];
  r.безПула=[];пулы.forEach(p=>миги.forEach(c=>{const a=LIVE_LINES["foe_"+p+"_"+c];if(!a||a.length<3)r.безПула.push(p+"_"+c);}));
  /* записано ли: в описи голосов есть хоть одна строка каждого рода */
  r.записано=пулы.filter(p=>Object.keys(VOICE_NPC["foe_"+p+"_start"]||{}).length>0);
  /* ход боя */
  const m=Object.assign({hp:120},find("troll"));m.hp=m.hp||120;G.inCombat=true;G.combat={m,hp:m.hp,key:"0,0",alt:0};
  safeFn(()=>Arena.init(G.combat,{}));Arena.stop();
  FoeTalk.start(m);r.начало=FoeTalk.last&&FoeTalk.last.роль;
  G.combat.hp=Math.floor(m.hp*0.45);FoeTalk.следить();r.рана=FoeTalk.last&&FoeTalk.last.роль;
  G.combat.hp=Math.floor(m.hp*0.2);FoeTalk.следить();r.край=FoeTalk.last&&FoeTalk.last.роль;
  const был=FoeTalk.last;FoeTalk.следить();r.неПовтор=FoeTalk.last===был;
  G.hp=Math.max(1,Math.floor(G.hpMax*0.2));FoeTalk.удар();r.насмешка=FoeTalk.last&&FoeTalk.last.роль;
  FoeTalk.гибель(m);r.гибель=FoeTalk.last&&FoeTalk.last.роль;
  G.hp=G.hpMax;G.inCombat=false;G.combat=null;
  const wolf=find("wolf");r.волк=FoeTalk.сказать("start",{m:wolf});
  return r;});
 check('5a. говорят разбойник, исполин, дракон, дух и страж Предтеч; волк и паук молчат',
  бой.кто.bandit==="bandit"&&бой.кто.troll==="giant"&&бой.кто.dragon==="dragon"&&бой.кто.wraith==="spirit"&&бой.кто.golem==="construct"
  &&бой.кто.wolf===null&&бой.кто.spider===null&&бой.волк===false,бой.кто);
 check('5b. у каждого из десяти родов шесть мигов боя, не меньше трёх строк в каждом, и они записаны',
  бой.безПула.length===0&&бой.записано.length===10,{без:бой.безПула,записано:бой.записано});
 check('5c. в бою тварь говорит: начало, рана (половина), край (четверть) — по разу; насмешка слабеющему герою; последние слова',
  бой.начало==="foe_giant_start"&&бой.рана==="foe_giant_hurt"&&бой.край==="foe_giant_low"&&бой.неПовтор
  &&бой.насмешка==="foe_giant_taunt"&&бой.гибель==="foe_giant_death",бой);
 /* большие звучат ниже: запись дракона и исполина пропущена через понижение (длина против обычной) */
 const opis=fs.readFileSync(path.join(ROOT,'sounds','voice_npc','CREDITS.md'),'utf8');
 check('5d. в титрах записей названы речь в бою и страшные голоса больших (ниже на пять полутонов)',
  /в бою: дракон/.test(opis)&&/в бою: исполин/.test(opis)&&/пять полутонов/.test(opis));

 /* ── 6. поручение словами заказчика ── */
 const дело=await page.evaluate(()=>({
  руда:questVoicePool({type:"fetch",res:"руда"}),север:questVoicePool({type:"kill",text:"Очисти округу: убей 2 монстров. Иди на север, держись"}),
  зверь:questVoicePool({type:"hunt"}),алтарь:questVoicePool({type:"god_altar"}),иное:questVoicePool({type:"fetch",res:"небывалое"}),
  записано:["quest_fetch_ruda","quest_kill_sever","quest_type_hunt"].every(p=>Object.keys(VOICE_NPC[p]||{}).length>0)}));
 check('6. заказчик говорит само поручение: руда, север, выследить зверя, алтарь; прочее — строкой рода дела',
  дело.руда==="quest_fetch_ruda"&&дело.север==="quest_kill_sever"&&дело.зверь==="quest_type_hunt"&&дело.алтарь==="quest_type_god_altar"
  &&/^quest_/.test(дело.иное)&&дело.записано,дело);

 /* ── 7. голоса ── */
 const голоса=await page.evaluate(()=>{
  const r={};
  const пары=new Set();for(let i=0;i<40;i++)пары.add(Folk.пара({key:`${i*7},${i*13},${i%3}`}));r.пар=[...пары].sort();
  const n={key:"5,5,1",race:"Люди",name:"Тест"};r.тотЖе=Folk.пара(n)===Folk.пара(Object.assign({},n));
  /* записаны ли вторая и третья пары у приветствий */
  const g=VOICE_NPC.greet||{};const маски=Object.values(g).map(e=>Number(e[2])||1);
  r.сТремя=маски.filter(m=>(m&7)===7).length;r.всего=маски.length;
  /* обозы */
  const car=k=>({kind:{id:k},from:{x:1,y:2},to:{x:3,y:4},name:"обоз"});
  r.обоз={trade:carVoice(car("trade")).голос,war:carVoice(car("war")).голос,pilgrim:carVoice(car("pilgrim")).голос,ore:carVoice(car("ore")).голос};
  const cm=VOICE_NPC.car_meet||{};r.обозЗаписан=Object.values(cm).some(e=>((Number(e[2])||1)&14)===14);
  SAID.length=0;safeFn(()=>carSay(car("war"),"car_meet"));r.сказалВойсковой=SAID[0]&&SAID[0].голос;
  return r;});
 check('7a. у жителей три пары голосов, один житель всегда своей парой, приветствия записаны всеми тремя',
  голоса.пар.join()==="0,1,2"&&голоса.тотЖе&&голоса.сТремя>=голоса.всего*0.9,голоса);
 check('7b. у обоза свой старший по роду: торговый, войсковой, паломничий и рудный звучат разными голосами',
  new Set(Object.values(голоса.обоз)).size===4&&голоса.обозЗаписан&&(голоса.сказалВойсковой===1||голоса.сказалВойсковой===undefined),голоса.обоз);

 /* ── 8. баллады ── */
 const песни=await page.evaluate(()=>{
  const r={n:BALLADS.length,файлы:BALLADS.map(b=>Ballads.файл(b))};
  G.balladsHeard=[];const спето=[];
  for(let i=0;i<BALLADS.length;i++){const b=Ballads.спеть();спето.push(b&&b.id);}
  r.всеРазные=new Set(спето).size===BALLADS.length;
  r.звучало=FILES.filter(f=>/ballad\//.test(f)).length;
  r.шагОбрывает=(()=>{Ballads.спеть();const was=!!Ballads.el;move("N");return was&&!Ballads.el;})();
  return r;});
 const bf=песни.файлы.map(f=>path.join(ROOT,'sounds',f));
 check('8. восемь баллад о мире: файлы на месте, песня не повторяется, пока не спеты все, шаг обрывает песню',
  песни.n===8&&bf.every(f=>fs.existsSync(f)&&fs.statSync(f).size>300000)&&песни.всеРазные&&песни.звучало>=8&&песни.шагОбрывает,
  {песни,нет:bf.filter(f=>!fs.existsSync(f))});

 /* ── 9. руководство ── */
 const рук=await page.evaluate(()=>{
  const номера=GUIDE.map(g=>+((g.title.match(/Глава (\d+)/)||[])[1]||0));
  return {глав:GUIDE.length,подряд:номера.every((n,i)=>n===i+1),частей:GUIDE_PARTS.length,
   разделов:GUIDE_SECS.length,все:Object.keys(GUIDE_OLD).length,
   версия:guideHas(/Версия 4\.6/,2),жесты:(GUIDE[GUIDE_OLD[88]]||{}).title};});
 check('9. руководство: не больше 20 глав с номерами подряд в семи частях; прежние главы — разделы; истории версий в нём нет (она в «Что нового»)',
  рук.глав<=20&&рук.подряд&&рук.частей===7&&рук.все>=90&&!рук.версия&&/[Жж]есты/.test(рук.жесты||""),рук);

 /* ── 10. жесты во время боя ── */
 const жб=await page.evaluate(()=>{
  const r={};G.gestBindCombat={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  r.внеБоя=gestCombatRun(2,"swipe","W");
  const m=Object.assign({hp:200},MONSTERS.find(x=>x.id==="wolf"));m.hp=200;
  G.inCombat=true;G.combat={m,hp:200,key:"0,0",alt:0};safeFn(()=>Arena.init(G.combat,{}));Arena.stop();
  G.hp=Math.max(1,G.hpMax-40);G.water=100;
  const до=G.hp;r.зелье=gestCombatRun(2,"swipe","W");r.полечился=G.hp>до;
  r.прочее=gestCombatRun(2,"swipe","E");
  gestCombatBind("3swipeE","flee");r.назначено=gestCombatId("3swipeE")==="flee";
  gestCombatBind("2swipeE","potion");r.одноМесто=gestCombatId("2swipeW")==="none"&&gestCombatId("2swipeE")==="potion";
  gestCombatReset();r.сброс=gestCombatId("2swipeW")==="potion"&&gestCombatId("3swipeE")==="none";
  openModal("modal-settings");renderGestCombat();r.списков=document.querySelectorAll('#gestCombatRow select[data-gestc]').length;
  r.окноМешает=gestCombatRun(2,"swipe","W");safeFn(()=>closeModal(document.getElementById("modal-settings")));
  G.inCombat=false;G.combat=null;G.hp=G.hpMax;
  return r;});
 check('10. в бою свайп двумя пальцами влево выпивает зелье, вне боя и поверх окна — нет; в настройках раздел «Жесты во время боя» на все 33 фигуры, переназначение и сброс',
  жб.внеБоя===false&&жб.зелье===true&&жб.полечился&&жб.прочее===false&&жб.назначено&&жб.одноМесто&&жб.сброс&&жб.списков===33&&жб.окноМешает===false,жб);

 /* ── 11. осмотреться при тихом шаге; достижение не обрывается шагом ── */
 const ос=await page.evaluate(()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  settings.quietWalk=1;G.inCombat=false;G.combat=null;
  /* в мире */
  handleTwoFingerSwipe("W");let l=activeLayer();r.мир=!!(l&&l.id==="modal-object")&&document.querySelectorAll('#objBody .list-line').length>0;
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  /* в поселении */
  enterPlace({x:700,y:700,structure:{type:"village",name:"Проба",beacon:"village"}});
  handleTwoFingerSwipe("W");l=activeLayer();r.вМесте=!!(l&&l.id==="modal-object")&&Look.list.length>0;
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  safeFn(()=>leavePlace());G.place=null;
  /* достижение: действие игрока его не снимает */
  settings.speech=1;settings.sayAchieve=undefined;settings.verbosity="normal";
  const m=Speech.say("Новый уровень! Вы достигли 7 уровня.");
  r.род=m&&m.cat;r.держится=!!(m&&m.persistent);
  Speech.userCut();
  r.живо=!!m&&m.state!=="CANCELLED"&&m.state!=="DROPPED";
  settings.verbosity="brief";const m2=Speech.say("Достижение: первый клад.");r.кратко=!!m2&&m2.state!=="DROPPED";
  settings.verbosity="normal";
  return r;});
 check('11. «осмотреться» работает при «Тихом шаге» — в мире и внутри места; достижение звучит и не обрывается следующим действием игрока',
  ос.мир&&ос.вМесте&&ос.род==="achieve"&&ос.держится&&ос.живо&&ос.кратко,ос);

 /* ── 12. уличные голоса в фоне ── */
 const фон=await page.evaluate(()=>{
  const r={};settings.effects=1;settings.folk=1;
  Folk.смолкнуть(true);Folk.занятоДо=0;Folk.звучитДо=0;
  const t=Object.keys(VOICE_NPC.guard||{})[0];
  r.сказал=Folk.реплика("guard",t,{x:G.x+2,y:G.y},false,{всегда:true,фон:true});
  const now=Date.now();
  r.неДержит=Folk.занятоДо<=now+5&&Folk.звучитДо<=now+5;
  r.вФоне=Folk.фонПути.size>0;
  Folk.смолкнуть(true);r.пережил=Folk.фонПути.size>0;
  /* обычная реплика по-прежнему в очереди */
  const t2=Object.keys(VOICE_NPC.greet||{})[0];
  Folk.приветствие({key:"1,1,1",race:"Люди",name:"Проба"},t2,{всегда:true});
  r.приветствиеДержит=Math.max(Folk.занятоДо,Folk.звучитДо)>Date.now();
  Folk.смолкнуть(true);
  return r;});
 check('12. уличная реплика стражи и горожан звучит в фоне: голос игры её не ждёт, действие игрока её не обрывает; приветствие у прилавка — по-прежнему по очереди',
  фон.сказал&&фон.неДержит&&фон.вФоне&&фон.пережил&&фон.приветствиеДержит,фон);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
