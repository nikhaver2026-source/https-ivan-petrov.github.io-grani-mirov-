/* ══════════════════════════════════════════════════════════════════
   260 — ЗАМОРЬЕ: ТРИ ЗЕМЛИ ЗА ВНЕШНИМ МОРЕМ (9.5.4)
   «Изучи „Канашибари“, китайскую, японскую и скандинавскую мифологии,
   переработай оригинально и встрой глубоко в Грань: земли, тварей
   (страшных, со страшными звуками), ресурсы, артефакты, богов, расы,
   народы, многоярусные подземелья со своими тварями, ресурсами,
   артефактами, заклинаниями и свитками; острова, моря, реки, озёра;
   новые расы и народы — в выбор персонажа; всё — в историю мира».
   Проверяется:
   1. Девять держав Заморья в юго-восточном углу: суша под престолами,
      своя область, младший бог, дар, задания, учителя и голос держав;
      Дальний Круг остаётся двадцатью четырьмя державами.
   2. Девять рас с досье и двумя народами — в выборе героя; облик и рост.
   3. Твари Заморья: в бою на земле Заморья тварь становится ужасом
      своей земли — имя, сила, умение и свой страшный голос.
   4. Три подземелья в сто ярусов: полосы со своими тварями, ресурсом,
      свитком и стражем; за стража — реликвия; подземелья встречаются
      только в Заморье.
   5. Город Ста Синих Фонарей: быличка (верный и неверный ответ),
      здешняя еда держит, ставка навыком, памятью или чувством.
   6. Заклинания — только по свиткам; печать на лоб бьёт мертвеца вдвое.
   7. Воды: моря, реки, озёра, архипелаги, роды морей и острова;
      морской путь китоглавов от островных врат Круга до пристаней.
   8. Звуки Заморья — свои файлы без потерь, с титрами; окно «Заморье»
      открывается и читает летопись.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.GraniTTS={speak(t,r,v,id){setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),20);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,...a){SAID.push(String(t));return n0(t,...a);};});

 /* 1. Державы */
 const d=await p.evaluate(()=>{
  const r={зам:ZAM_REALMS.length,круг:DK_REALMS.length,дальних:FAR_REALMS.length,земли:{}};
  r.пусто=ZAM_REALMS.filter(e=>!e.name||!e.gov||!e.econ||!e.hist||!GOD_BY_ID[e.god]||!(e.exports||[]).length).map(e=>e.short);
  r.угол=ZAM_REALMS.every(e=>Math.hypot(e.cap.x,e.cap.y)/WORLD>0.95&&e.cap.x<WORLD&&e.cap.y<WORLD);
  r.свои=ZAM_REALMS.every(e=>empireAt(e.cap.x,e.cap.y)===e);
  r.суша=ZAM_REALMS.filter(e=>biomeAt(e.cap.x,e.cap.y).база==="coast").map(e=>e.short);
  r.области=ZAM_REALMS.filter((e,i)=>regionAt(e.cap.x,e.cap.y)!==REGIONS[DK_REGION_FIRST+24+i]).map(e=>e.short);
  r.боги=ZAM_REALMS.filter((e,i)=>!LESSER_GODS.some(g=>g.область===DK_REGION_FIRST+24+i)).map(e=>e.short);
  r.дары=ZAM_REALMS.filter(e=>!DK_GIFTS[e.short]||!(RES_BASE[DK_GIFTS[e.short].n]>0)).map(e=>e.short);
  r.задания=ZAM_REALMS.filter(e=>{const q=EMPIRE_QUESTS[EMPIRES.indexOf(e)];return !q||!(q.дела||[]).length;}).map(e=>e.short);
  r.учителя=ZAM_REALMS.filter(e=>!EMPIRE_TEACH[EMPIRES.indexOf(e)]).map(e=>e.short);
  r.голоса=EMPIRE_VOICE.length>=EMPIRES.length&&EMPIRE_VOICE.every(v=>Bank.has(v));
  r.города=ZAM_REALMS.every(e=>empireCitiesOf(EMPIRES.indexOf(e)).length>=4);
  r.праздники=Gods.cycle;
  ZAM_REALMS.forEach(e=>{r.земли[e.заморье]=(r.земли[e.заморье]||0)+1;});
  return r;});
 check('1. девять держав Заморья в углу мира на своей суше: область, бог, дар, задания, учителя, голос, города; Круг — двадцать четыре',
  d.зам===9&&d.круг===24&&d.дальних===33&&!d.пусто.length&&d.угол&&d.свои&&!d.суша.length&&!d.области.length&&!d.боги.length
  &&!d.дары.length&&!d.задания.length&&!d.учителя.length&&d.голоса&&d.города&&d.праздники===105&&d.земли.yasen===3&&d.земли.nebo===3&&d.земли.fonar===3,d);

 /* 2. Расы и народы в выборе героя */
 const р=await p.evaluate(()=>{
  const новые=RACES_DB.filter(r=>/^zm_/.test(r.id));
  return {n:новые.length,
   пусто:новые.filter(r=>["n","hist","econ","pol","war","myth","tr"].some(k=>!r[k])||!GOD_BY_ID[r.god]||!CLANS.includes(r.clan)||(r.br||[]).length<2).map(r=>r.n),
   выбор:новые.filter(r=>!RACES.includes(r.n)).map(r=>r.n),
   народыВыбор:новые.flatMap(r=>r.br).filter(n=>!RACES.includes(n)),
   облик:новые.filter(r=>!HERO_RACE_FEATURE[r.id]||!HERO_KIND[r.id]||!HERO_HEIGHT[r.id]).map(r=>r.n),
   голос:новые.flatMap(r=>[r.n].concat(r.br)).filter(n=>!VOICE_RACES[n]),
   справка:новые.flatMap(r=>r.br).filter(n=>!PEOPLE_INFO[n]),
   вДержаве:ZAM_REALMS.every(e=>e.races.includes(e.race))};});
 check('2. девять рас Заморья с досье и двумя народами — в выборе героя, с обликом, ростом, голосом и справкой',
  р.n===9&&!р.пусто.length&&!р.выбор.length&&!р.народыВыбор.length&&!р.облик.length&&!р.голос.length&&!р.справка.length&&р.вДержаве,р);

 /* 3. Твари */
 const т=await p.evaluate(()=>{
  const e=ZAM_REALMS.find(x=>x.short==="Сто Фонарей");G.place=null;G.x=e.cap.x+40;G.y=e.cap.y+40;G.hour=23;
  const roles=[];const was=Bank.play.bind(Bank);Bank.play=(r,o)=>{roles.push(r);return was(r,o);};
  const m={id:"banshee",n:"Стенающая банши",hp:40,dmg:5,xp:30,lvl:5};
  const h0=Zamorye.h;Zamorye.h=()=>0.1;Zamorye.onCombat(m,{x:G.x,y:G.y});
  const r={zm:m.zm,n:m.n,hp:m.hp,dmg:m.dmg,умение:m.zmAbil,звук:m.zmSnd,зверьЗемли:(ZMR_BEAST_BY_ID[m.zm]||{}).land};
  Zamorye.h=h0;
  /* в Средоточии — не трогается */
  G.x=25000;G.y=25000;const m2={id:"banshee",n:"Стенающая банши",hp:40,dmg:5};Zamorye.onCombat(m2,{});r.вЯдре=m2.n;
  /* умения в бою */
  G.combat={m,hp:m.hp};G.hp=100;G.hpMax=100;G.food=100;
  const мс={...m,zmAbil:"голод"};let d0=0;for(let i=0;i<20;i++)d0+=Zamorye.onStrike(мс,5);r.еда=G.food;
  const прыг={zm:"zb_hopper",zmAbil:"прыжок",n:"Скачущий мертвец"};G.combat={m:прыг,hp:50};r.прыжок=Zamorye.onHit(прыг,20);
  G.combat=null;
  setTimeout(()=>{},0);r.голоса=ZMR.beasts.filter(b=>!SOUND_BANK[b.звук]).map(b=>b.id);
  r.страшных=ZMR.beasts.filter(b=>/^zm_/.test(b.звук)).length;
  r.безРода=ZMR.beasts.filter(b=>b.база.some(id=>!MONSTERS.find(x=>x.id===id))).map(b=>b.id);
  Bank.play=was;return r;});
 check('3. на земле Заморья тварь становится ужасом своей земли: имя, сила, умение, свой страшный голос; в Средоточии — прежняя',
  т.zm&&т.зверьЗемли==="fonar"&&т.n!=="Стенающая банши"&&т.hp>40&&т.dmg>5&&т.умение&&/^zm_/.test(т.звук||"")&&т.вЯдре==="Стенающая банши"
  &&т.еда<100&&т.прыжок<20&&!т.голоса.length&&т.страшных>=25&&!т.безРода.length,т);

 /* 4. Подземелья */
 const п=await p.evaluate(()=>{
  const r={};
  const e=ZAM_REALMS.find(x=>x.short==="Девять Небес");
  const роды=new Set();for(let i=0;i<300;i++){const k=dungeonKindAt(e.cap.x+i*37,e.cap.y-i*53,"ruins");if(k)роды.add(k.id);}
  r.вНебесах=[...роды].filter(id=>/^zd_/.test(id));
  const ядро=new Set();for(let i=0;i<300;i++){const k=dungeonKindAt(1000+i*37,1000+i*53,"ruins");if(k)ядро.add(k.id);}
  r.вЯдре=[...ядро].filter(id=>/^zd_/.test(id));
  const big=ZMR.dungeons.filter(k=>k.zm!=="small");
  r.полосы=big.map(k=>k.ярусы.length);r.до100=big.every(k=>k.ярусы[k.ярусы.length-1].до===100);
  r.поля=ZMR.dungeons.every(k=>k.n&&k.о&&k.примета&&k.голоса.every(([g])=>Bank.has(g))&&k.твари.every(t=>MONSTERS.find(m=>m.id===t))&&DUNGEON_KIND_BY_ID[k.id]);
  r.полосыПолны=big.every(k=>k.ярусы.every(b=>b.n&&b.твари.every(id=>ZMR_BEAST_BY_ID[id])&&ZMR_RES_BY_ID[b.ресурс]&&b.страж&&b.страж.n&&SOUND_BANK[b.страж.звук]&&(!b.свиток||ZMR_SPELL_BY_ID[b.свиток])&&(!b.реликвия||ZMR_RELIC_BY_ID[b.реликвия])));
  r.свитков=new Set(big.flatMap(k=>k.ярусы.map(b=>b.свиток).filter(Boolean))).size;
  r.реликвий=new Set(big.flatMap(k=>k.ярусы.map(b=>b.реликвия).filter(Boolean))).size;
  /* страж полосы и реликвия за него */
  const k=ZMR_DUNGEON_BY_ID.zd_lanterns;const was=Zamorye.kind;Zamorye.kind=()=>k;const wd=Zamorye.depth;Zamorye.depth=()=>49;
  G.place={bx:e.cap.x,by:e.cap.y,depth:49,stype:"ruins"};G.x=ZAM_REALMS.find(x=>x.short==="Сто Фонарей").cap.x;G.y=ZAM_REALMS.find(x=>x.short==="Сто Фонарей").cap.y;
  G.place.bx=G.x;G.place.by=G.y;G.zm=null;
  const m={id:"wraith",n:"Призрак",hp:50,dmg:6,xp:30};Zamorye.onCombat(m,{});r.страж=m.n;r.босс=m.zm==="boss";
  Zamorye.onWin(m);r.реликвия=Zamorye.st().relics.slice();r.ресурс=Number(G.inv["тушь из темноты"])||0;r.свиток=Zamorye.st().spells.slice();
  Zamorye.kind=was;Zamorye.depth=wd;G.place=null;
  /* ловушки — свои в подземельях Заморья */
  r.ловушки=ZMR.traps.every(t=>SOUND_BANK[t.покой]&&SOUND_BANK[t.сраб]&&TRAP_KIND_BY_ID[t.род]);
  return r;});
 check('4. три подземелья в сто ярусов полосами (6, 10 и 9) со своими тварями, ресурсом, свитком и стражем; за стража — реликвия; только в Заморье',
  п.вНебесах.length>=1&&п.вЯдре.length===0&&JSON.stringify(п.полосы)==="[6,10,9]"&&п.до100&&п.поля&&п.полосыПолны&&п.свитков>=10&&п.реликвий>=10
  &&п.страж==="Обиженная из колодца"&&п.босс&&п.реликвия.includes("zl_mask")&&п.ресурс>=3&&п.свиток.includes("zs_tale")&&п.ловушки,п);

 /* 5. Город Фонарей */
 const г=await p.evaluate(()=>{
  const r={};const k=ZMR_DUNGEON_BY_ID.zd_lanterns;const was=Zamorye.kind;Zamorye.kind=()=>k;const wd=Zamorye.depth;Zamorye.depth=()=>30;
  G.zm=null;G.hp=100;G.hpMax=100;G.food=10;G.water=10;
  r.еда=Zamorye.eatHere();r.держит=Zamorye.st().ate;r.сытость=G.food;
  const s=Zamorye.st();s.taleNow="t_smile";const плохо=Zamorye.taleAnswer(0);r.плохо=G.hp<100&&/повязку/.test(плохо);
  s.taleNow="t_smile";const хп=G.hp;const хорошо=Zamorye.taleAnswer(2);r.хорошо=/досказана/.test(хорошо)&&Zamorye.st().ate===0;
  const xp0=Number(G.xp)||0;G.xp=1000;let пр=0,выи=0;
  const rnd=Math.random;Math.random=()=>0.99;s.stakeDay=null;const t1=Zamorye.stake("g_dice","memory");Math.random=rnd;r.проигрыш=/проиграли/.test(t1)&&G.xp<1000;
  Math.random=()=>0.01;s.stakeDay=null;G.hour=(Number(G.hour)||0)+1;const t2=Zamorye.stake("g_candles","skill");Math.random=rnd;r.выигрыш=/выиграли/.test(t2);
  r.вне=(()=>{Zamorye.kind=()=>null;return /Город/.test(Zamorye.stake("g_dice","skill"));})();
  Zamorye.kind=was;Zamorye.depth=wd;return r;});
 check('5. Город Фонарей: здешняя еда держит, неверный ответ былички ранит, верный отпускает; ставка памятью проигрывает опыт, выигрыш даёт еду',
  /держит крепче/.test(г.еда)&&г.держит===1&&г.сытость>10&&г.плохо&&г.хорошо&&г.проигрыш&&г.выигрыш&&г.вне,г);

 /* 6. Заклинания */
 const з=await p.evaluate(()=>{
  const r={};G.zm=null;G.mana=100;G.manaMax=100;G.inCombat=true;
  const m={id:"wraith",n:"Скачущий мертвец",zm:"zb_hopper",zmAbil:"прыжок",hp:200};G.combat={m,hp:200};
  r.безСвитка=/не выучено/.test(Zamorye.cast("zs_seal"));
  Zamorye.st().spells.push("zs_seal");const t=Zamorye.cast("zs_seal");r.печать=/цепенеет/.test(t);r.урон=200-G.combat.hp;
  r.печатан=!!G.combat.zmSealed;r.удар=Zamorye.onHit(m,20);
  G.inCombat=false;G.combat=null;
  r.все=ZMR.spells.every(s=>s.n&&s.мана>0&&SOUND_BANK[s.звук]&&(s.урон||s.бегство));
  return r;});
 check('6. заклинания Заморья — только по свиткам; печать на лоб цепенит мертвеца и снимает его стойкость',
  з.безСвитка&&з.печать&&з.урон>=20&&з.печатан&&з.удар===20&&з.все,з);

 /* 7. Воды и морской путь */
 const в=await p.evaluate(()=>{
  const r={};const e=ZAM_REALMS.find(x=>x.short==="Девять Корней");
  r.море=seaTypeAt(e.cap.x+100,e.cap.y+100).id;
  r.вода=Zamorye.waterNear(e.cap.x,e.cap.y);
  r.воды=Object.keys(ZMR.rivers).length===3&&Object.values(ZMR.lakes).every(a=>a.length>=2)&&Object.values(ZMR.seas).every(a=>a.length>=3)&&Object.values(ZMR.archipelagos).every(a=>a.length>=1);
  r.острова=ZMR.isles.every(i=>ISLAND_BY_ID[i.id]&&SOUND_BANK[i.звук]);
  const ост=DK_REALMS.find(x=>x.остров);const откуда=portalNodeAt(ост.cap.x,ост.cap.y);
  const куда=Zamorye.voyageNodes(откуда);r.пристаней=куда.length;
  const f=portalFare(откуда,куда[0]);r.путь=f.open&&f.gold===120&&f.hours===48;
  G.x=ост.cap.x;G.y=ост.cap.y;G.place=null;G.ship=null;G.gold=1000;G.portals=[];
  r.дошли=portalTravel(куда[0].x+","+куда[0].y);r.где=empireAt(G.x,G.y).заморье||null;
  return r;});
 check('7. воды Заморья: свой род моря у берегов, реки, озёра, моря, архипелаги, острова; корабль китоглавов до пристаней за 120 золотых',
  в.море==="zm_rimesea"&&в.вода&&в.вода.n&&в.воды&&в.острова&&в.пристаней===3&&в.путь&&в.дошли&&!!в.где,в);

 /* 8. Звуки, окно и летопись */
 const о=await p.evaluate(()=>{
  const r={};const roles=Object.keys(SOUND_BANK).filter(k=>/^zm_/.test(k));r.ролей=roles.length;
  r.файлы=roles.flatMap(k=>SOUND_BANK[k].f);r.разделы=roles.filter(k=>!roleSection(k)).length;
  CMD.zamorye();r.окно=!document.getElementById("modal-zamorye").hidden;r.строк=document.querySelectorAll("#zmBody [data-speak]").length;
  CMD.zm("chron");r.летопись=document.getElementById("zmBody").textContent.includes("Стеклянное Небо");
  CMD.zm("deep");r.полосы=document.getElementById("zmBody").textContent.includes("Синий Светоч");
  closeTopUI();r.меню=AM_ITEMS.some(([c])=>c==="zamorye");
  return r;});
 const нет=о.файлы.filter(f=>!fs.existsSync(path.join(ROOT,'sounds',f)));
 const непотерь=о.файлы.filter(f=>!/\.flac$/.test(f));
 const титры=fs.existsSync(path.join(ROOT,'sounds','zm','CREDITS.md'))&&/Little Robot Sound Factory/.test(fs.readFileSync(path.join(ROOT,'sounds','zm','CREDITS.md'),'utf8'));
 check('8. звуки Заморья — свои файлы без потерь с титрами и разделом энциклопедии; окно «Заморье» с летописью и подземельями; пункт в меню',
  о.ролей>=20&&!нет.length&&!непотерь.length&&!о.разделы&&титры&&о.окно&&о.строк>=8&&о.летопись&&о.полосы&&о.меню,{о:{...о,файлы:о.файлы.length},нет,непотерь,титры});

 check('нет ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const fail=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\nИтог: ${results.length-fail} PASS, ${fail} FAIL`);
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
