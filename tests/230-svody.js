/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 230: «СВОДЫ» — НОВЫЙ СЛОЙ МИРА (8.0: ВО ВСЕХ СБОРКАХ)

   С 8.0 Своды есть в Android, Windows и браузере; адрес с ?svody=0
   открывает прежний мир без них.
   1. С ?svody=0 Сводов нет: ни раздела меню, ни новых ловушек, морей,
      островов, подземелий, трав и зелий.
   2. Без параметра: раздел «Своды» в меню действий, версия 14.0, все списки
      пополнены; в каждом наборе данных нужное число записей, имена
      не повторяются, у всех ссылок есть цель (твари → роды MONSTERS,
      ловушки → роды ловушек, звуки → роли банка).
   3. Сорок девять записей sounds/svody: FLAC 48 кГц / 24 бита, у каждой роли
      свой файл, все описаны в CREDITS.md.
   4. Небо живёт: за двадцать суток отношения богов меняются, войны и
      союзы попадают в летопись неба; встать на сторону в войне — милость
      одному и гнев другому, присяга и смена присяги — с гневом прежнего.
   5. Край, упадок и воды: край определяется, упадок растёт сам и
      отступает от побед; реки, озёра и моря получают имена.
   6. Тварь Сводов в бою: порода, своё умение; победа даёт сущность,
      перековка поднимает черту и удар; тень просыпается ночью.
   7. Ловушка Сводов срабатывает звуком и своим действием; поручение
      «пять ловушек» засчитывается за снятые ловушки и даёт реликвию.
   8. Окно «Своды»: свиток и все тринадцать разделов открываются без ошибок.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const base=process.argv[2];const sv=base;const без=base+(base.indexOf('?')>=0?'&':'?')+'svody=0';

 /* ── 1. Без Сводов ── */
 {const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(без);await page.waitForTimeout(800);
  const р=await page.evaluate(()=>({on:SVODY_ON,group:AM_GROUPS.some(g=>g[0]==="Своды"),
   ловушки:TRAPS.filter(t=>/^sv_/.test(t.id)).length,моря:SEA_TYPES.filter(t=>/^sv_/.test(t.id)).length,
   острова:ISLAND_TYPES.filter(t=>/^sv_/.test(t.id)).length,зелья:POTIONS.filter(t=>/^sv_/.test(t.id)).length,
   травы:PLANTS.filter(t=>/^sv_/.test(t.id)).length,твари:SEA_MONSTERS.filter(t=>/^sv_/.test(t.id)).length,
   подземелья:Object.keys(DUNGEON_KIND_BY_ID).filter(k=>/^sv_/.test(k)).length,версия:GAME_VERSION,модуль:Modules.has("SVODY")}));
  check('1. с ?svody=0 Сводов нет — прежний мир для проверок',
   !р.on&&!р.group&&!р.ловушки&&!р.моря&&!р.острова&&!р.зелья&&!р.травы&&!р.твари&&!р.подземелья&&!р.модуль&&!errors.length,{р,errors});
  await page.close();}

 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(sv);await page.waitForTimeout(1000);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.ИГРАЛО=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{ИГРАЛО.push(r);return b0(r,o);};
  window.СКАЗАНО=[];const s0=Speech.say.bind(Speech);Speech.say=(t,...a)=>{СКАЗАНО.push(String(t));return s0(t,...a);};});

 /* ── 2. Данные и связи ── */
 const д=await page.evaluate(()=>{
  const сум=Svody.summary();
  const имена=[...SVD.gods,...SVD.peoples,...SVD.lands,...SVD.beasts,...SVD.seaBeasts,...SVD.relics,...SVD.spells,...SVD.npcs].map(x=>x.n);
  const дубли=имена.filter((n,i)=>имена.indexOf(n)!==i);
  const роли=new Set(Object.keys(SOUND_BANK));
  const звуки=[...SVD.gods.map(g=>g.звук),...SVD.beasts.map(b=>b.звук),...SVD.seaBeasts.map(b=>b.звук),...SVD.traps.flatMap(t=>[t.покой,t.сраб]),
   ...SVD.seaTypes.map(t=>t.звук),...SVD.isles.map(t=>t.звук),...SVD.dungeons.flatMap(d=>[d.звук,...d.голоса.map(g=>g[0])]),...SVD.spells.map(s=>s.звук)];
  const безЗвука=[...new Set(звуки.filter(r=>!роли.has(r)))];
  const родыТварей=SVD.beasts.flatMap(b=>b.база).filter(id=>!MONSTERS.some(m=>m.id===id));
  const родыЛовушек=SVD.traps.filter(t=>!TRAP_KIND_BY_ID[t.род]).map(t=>t.id);
  const тварьЗемли=SVD.lands.flatMap(l=>l.звери).filter(id=>!SVD_BEAST_BY_ID[id]);
  const богиЗемель=SVD.lands.filter(l=>!SVD_GOD_BY_ID[l.бог]||!SVD_PEOPLE_BY_ID[l.народ]).map(l=>l.id);
  const персонажи=SVD.npcs.filter(n=>!SVD_PEOPLE_BY_ID[n.народ]||!SVD_LAND_BY_ID[n.край]||(n.награда.реликвия&&!SVD_RELIC_BY_ID[n.награда.реликвия])||(n.награда.печать&&!SVD.spells.some(s=>s.печать===n.награда.печать))).map(n=>n.id);
  const печатиБезПоручения=SVD.spells.filter(s=>!SVD.npcs.some(n=>n.награда.печать===s.печать)).map(s=>s.id);
  const травыЗелья=SVD.plants.flatMap(p=>p.рецепты).filter(id=>!POTION_BY_ID[id]);
  const зельяНиши=SVD.potions.flatMap(p=>p.из).filter(c=>!PLANT_CAT_BY_ID[c]);
  const твариРек=SVD.dungeons.flatMap(d=>d.твари).filter(id=>!MONSTERS.some(m=>m.id===id));
  return {сум,дубли,безЗвука,родыТварей,родыЛовушек,тварьЗемли,богиЗемель,персонажи,печатиБезПоручения,травыЗелья,зельяНиши,твариРек,
   версия:GAME_VERSION,group:AM_GROUPS.find(g=>g[0]==="Своды"),cmds:(AM_GROUPS.find(g=>g[0]==="Своды")||[0,[]])[1].filter(([c])=>typeof CMD[c]!=="function").map(x=>x[0]),
   вСписках:{ловушки:TRAPS.filter(t=>/^sv_/.test(t.id)).length,моря:SEA_TYPES.filter(t=>/^sv_/.test(t.id)).length,острова:ISLAND_TYPES.filter(t=>/^sv_/.test(t.id)).length,
    зелья:POTIONS.filter(t=>/^sv_/.test(t.id)&&typeof t.дать==="function").length,травы:PLANTS.filter(t=>/^sv_/.test(t.id)).length,твари:SEA_MONSTERS.filter(t=>/^sv_/.test(t.id)).length,
    подземелья:Object.keys(DUNGEON_KIND_BY_ID).filter(k=>/^sv_/.test(k)).length}};});
 const с=д.сум;
 check('2а. раздел «Своды» в меню действий, у каждого пункта своя команда, версия 8.5',
  !!д.group&&д.group[1].length===13&&!д.cmds.length&&д.версия==="14.0",{cmds:д.cmds,версия:д.версия});
 check('2б. объём: 27 богов восьми родов (+Хранители), 20 народов, 18 краёв, 5 океанов, 16 морей, 5 родов моря, 16 рек, 12 озёр, 8 архипелагов, 5 островов, 40+5 тварей, 14 ловушек, 10 подземелий, 11 трав, 9 зелий, 18 реликвий, 12 легенд, 21 персонаж, 6 видов оружия, 6 нитей, 8 выборов',
  с.богов===27&&с.родов===9&&с.народов===20&&с.краёв===18&&с.океанов===5&&с.морей===16&&с.родовМоря===5&&с.рек===16&&с.озёр===12&&с.архипелагов===8&&с.островов===5&&с.тварей===40&&с.морскихТварей===5&&с.ловушек===14&&с.подземелий===10&&с.трав===11&&с.зелий===9&&с.реликвий===18&&с.легенд===12&&с.персонажей===21&&с.оружия===6&&с.нитей===6&&с.выборов===8,с);
 check('2в. списки игры пополнены: ловушки, моря, острова, морские твари, подземелья, травы, зелья (с действием)',
  д.вСписках.ловушки===14&&д.вСписках.моря===5&&д.вСписках.острова===5&&д.вСписках.твари===5&&д.вСписках.подземелья===10&&д.вСписках.травы===11&&д.вСписках.зелья===9,д.вСписках);
 check('2г. имена не повторяются, все связи ведут куда надо (звуки, роды тварей и ловушек, земли, персонажи, печати, травы → зелья)',
  !д.дубли.length&&!д.безЗвука.length&&!д.родыТварей.length&&!д.родыЛовушек.length&&!д.тварьЗемли.length&&!д.богиЗемель.length&&!д.персонажи.length&&!д.печатиБезПоручения.length&&!д.травыЗелья.length&&!д.зельяНиши.length&&!д.твариРек.length,д);

 /* ── 3. Звуки ── */
 const роли=await page.evaluate(()=>Object.keys(SOUND_BANK).filter(r=>/^sv2?_/.test(r)).map(r=>({r,f:SOUND_BANK[r].f})));
 const кредиты=fs.readFileSync(path.join(ROOT,'sounds','svody','CREDITS.md'),'utf8');
 const плохие=роли.filter(x=>{const п=path.join(ROOT,'sounds',x.f[0]);if(x.f.length!==1||!fs.existsSync(п))return true;
  const r=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,sample_rate,bits_per_raw_sample','-of','csv=p=0',п],{encoding:'utf8'}).trim();
  return r!=="flac,48000,24"||кредиты.indexOf(path.basename(п))<0;}).map(x=>x.r);
 check('3. сорок девять записей Сводов: FLAC 48 кГц / 24 бита, у каждой роли свой файл, все в CREDITS.md',
  роли.length===49&&new Set(роли.map(x=>x.f[0])).size===49&&!плохие.length,{n:роли.length,плохие});

 /* ── 4. Небо ── */
 const н=await page.evaluate(()=>{
  const s=Svody.st();const пары=Svody.pairs();
  const до=пары.map(([a,b])=>Svody.rel(a,b));
  const словаДо=пары.map(([a,b])=>Svody.relWord(a,b));
  for(let i=0;i<20;i++){G.day=(Number(G.day)||1)+1;Svody.tick();}
  const после=пары.map(([a,b])=>Svody.rel(a,b));
  const изменилось=до.filter((v,i)=>Math.abs(v-после[i])>0.5).length;
  const войны=Svody.wars().length;
  /* сторона в войне */
  let w=Svody.wars().find(([a,b])=>SVD_GOD_BY_ID[a]&&SVD_GOD_BY_ID[b]);
  if(!w){const [a,b]=["molchan","kolokol"];s.rel[Svody.key(a,b)]=-90;w=[a,b];}
  const [a,b]=w;const fa=Svody.favor(a),fb=Svody.favor(b);
  const ответ=Svody.side(a,b);
  const сторона={ответ,милостьЗа:Svody.favor(a)-fa,милостьПротив:Svody.favor(b)-fb,гнев:Svody.wrathful().indexOf(b)>=0,задание:!!s.task};
  /* присяга и смена */
  s.wrath={};const п1=Svody.swear("keyna");const п2=Svody.swear("zvonstrazh");
  return {пар:пары.length,изменилось,войны,летопись:s.chron.length,словаДо:new Set(словаДо).size,сторона,п1,п2,гневКейны:Svody.wrathful().indexOf("keyna")>=0,присяга:s.oath};});
 check('4а. между богами пары отношений (с Хранителями Грани), за двадцать суток отношения меняются и попадают в летопись неба',
  н.пар>=400&&н.изменилось>н.пар/3&&н.словаДо>=4,н);
 check('4б. встать на сторону в войне: милость одному, гнев другому и небесное поручение',
  н.сторона.милостьЗа>0&&н.сторона.милостьПротив<0&&н.сторона.гнев&&н.сторона.задание,н.сторона);
 check('4в. присяга принята; смена присяги — гнев прежнего бога',/Присяга принята/.test(н.п1)&&/гневается/.test(н.п2)&&/Прежняя присяга разорвана/.test(н.п2)&&н.гневКейны&&н.присяга==="zvonstrazh",{п1:н.п1,п2:н.п2});

 /* ── 5. Край, упадок, воды ── */
 const к=await page.evaluate(()=>{
  const l=Svody.land();Svody.landSt(l.id).decay=40;const до=Svody.decay(l.id);
  G.day++;Svody.tick();const выросло=Svody.decay(l.id)-до;
  Svody.decayAdd(l.id,-10);const сбит=Svody.decay(l.id);
  /* воды: найти реку, озеро и архипелаг поблизости */
  const нашлось={};const was={x:G.x,y:G.y};
  for(let i=0;i<400000&&Object.keys(нашлось).length<3;i+=37){const x=was.x+(i%4000),y=was.y+Math.floor(i/4000)*37;
   const b=biomeAt(x,y);if(!b)continue;
   const k=["river","stream","waterfall","river_mouth"].indexOf(b.id)>=0?"river":(b.id==="lake"||b.id==="lakeland")?"lake":b.id==="archipelago"?"arch":null;
   if(k&&!нашлось[k]){G.x=x;G.y=y;const w=Svody.waterHere();нашлось[k]=w&&w.n;}}
  G.x=was.x;G.y=was.y;
  /* море под килем */
  G.ship={tox:G.x+100,toy:G.y,leg:0,legs:4,left:4};const м=Svody.waterHere();G.ship=null;
  let родСводов=null;for(let x=0;x<400&&!родСводов;x++){const t=seaTypeAt(x*50,7*50);if(/^sv_/.test(t.id))родСводов=t.id;}
  return {край:l.n,выросло,сбит,до,воды:нашлось,море:м&&м.n,океан:м&&м.ocean.n,родСводов};});
 check('5а. край определяется, упадок растёт за сутки сам и отступает от дел',!!к.край&&к.выросло>0&&к.сбит<к.до+к.выросло,к);
 check('5б. реки, озёра, архипелаги и моря получают имена Сводов; пять родов морей Сводов встречаются в море',
  !!к.воды.river&&!!к.море&&!!к.океан&&!!к.родСводов&&Object.keys(к.воды).length>=2,к);

 /* ── 6. Тварь Сводов, сущность, перековка, тень ── */
 const б=await page.evaluate(async()=>{
  const s=Svody.st();s.body={};s.ess={};s.shadow={lvl:0,xp:0,hunger:0};
  /* бой с волком, пока не станет тварью Сводов */
  let m=null,тварь=null;
  for(let i=0;i<300&&!тварь;i++){m={...MONSTERS.find(x=>x.id==="wolf"),lvl:G.level,hp:40,dmg:5,xp:20,gold:5};
   Svody.onCombat(m,{x:G.x+i*3,y:G.y+i*7});if(m.sv)тварь=m;}
  if(!тварь)return {нет:true};
  const атакаДо=atk();
  G.hour=23;ИГРАЛО.length=0;
  Svody.onWin(тварь);
  const сущ={...s.ess};const тень=s.shadow.lvl;
  /* перековка когтя */
  s.ess["коготь"]=10;G.level=Math.max(Number(G.level)||1,4);
  /* ломка выпадает случайно (25 %) — здесь проверяется сама перековка */
  const r0=Math.random;Math.random=()=>0.99;const ответ=Svody.reforge("коготь");Math.random=r0;const атакаПосле=atk();
  G.hour=12;
  return {тварь:тварь.n,умение:тварь.svAbil,сущ,тень,ответ,атакаДо,атакаПосле,звук:ИГРАЛО.slice(0,6)};});
 check('6а. тварь Сводов в бою: своя порода и умение',!б.нет&&!!б.умение&&SVD_NAMES_OK(б.тварь),б);
 check('6б. победа над тварью Сводов даёт сущность, ночью просыпается тень',Object.values(б.сущ||{}).some(v=>v>0)&&б.тень>=1,б);
 check('6в. перековка поднимает черту «Когти» и удар',/Когти, ступень 1/.test(б.ответ||"")&&б.атакаПосле>б.атакаДо,{ответ:б.ответ,до:б.атакаДо,после:б.атакаПосле});

 /* ── 7. Ловушка Сводов и поручение ── */
 const л=await page.evaluate(()=>{
  const s=Svody.st();
  const т=TRAPS.find(t=>t.id==="sv_blade");
  G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Проба",depth:5,x:1,y:1};G.marks={};
  G.hp=G.hpMax=500;ИГРАЛО.length=0;СКАЗАНО.length=0;
  trapFire(1,1,{...т,x:1,y:1,глубина:5,состояние:"найдена",урон:12});
  const сработала={урон:500-G.hp,звук:ИГРАЛО.indexOf("sv_trap_blade")>=0,слова:СКАЗАНО.filter(t=>/серп|Порез/.test(t))};
  /* поручение вдовы: пять снятых ловушек */
  s.met={};s.quests={};s.relics=[];s.worn=[];
  G.x=0;G.y=0;
  const взято=Svody.take("vdova");
  const золотоДо=G.gold;
  for(let i=0;i<5;i++)Svody.count("traps");
  return {сработала,взято,исполнено:s.quests.vdova&&s.quests.vdova.done,реликвия:s.relics.indexOf("r_molchan")>=0,золото:G.gold-золотоДо};});
 check('7а. ловушка Сводов срабатывает своим звуком, ударом и своим действием',л.сработала.урон>12&&л.сработала.звук&&л.сработала.слова.length>0,л.сработала);
 check('7б. поручение «пять ловушек» засчитывается за снятые ловушки и даёт золото и реликвию',/Пять ловушек/.test(л.взято)&&л.исполнено&&л.реликвия&&л.золото>0,л);

 /* ── 8. Окно ── */
 const о=await page.evaluate(async()=>{const out={};
  G.place=null;while(activeLayer())closeTopUI();
  for(const c of ["svody","svgods","svwars","svland","svwaters","svbody","svshadow","svsongs","svquests","svrelics","svspells","svbest","svlimits"]){
   CMD[c]();await new Promise(z=>setTimeout(z,30));
   const box=document.getElementById("svBody");out[c]=box?box.querySelectorAll("[data-speak]").length:0;}
  CMD.sv("race:perv");out.race=document.querySelectorAll("#svBody [data-cmd^='sv:god:']").length;
  CMD.sv("god:veyra");out.god=document.getElementById("svTitle").textContent;
  out.открыто=!document.getElementById("modal-svody").hidden;
  while(activeLayer())closeTopUI();return out;});
 check('8. окно «Своды»: свиток и тринадцать разделов открываются, у каждого есть пункты',
  ["svody","svgods","svwars","svland","svwaters","svbody","svshadow","svsongs","svquests","svrelics","svspells","svbest","svlimits"].every(c=>о[c]>=2)&&о.race===4&&о.god==="Вейра Первая Волна"&&о.открыто,о);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
function SVD_NAMES_OK(n){return typeof n==="string"&&n.length>3;}
