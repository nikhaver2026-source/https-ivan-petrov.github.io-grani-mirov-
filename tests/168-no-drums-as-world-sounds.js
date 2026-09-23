/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 168: НИ БАРАБАНА ПОД ВИДОМ ЗВУКА МИРА

   Пять папок банка были собраны из сэмплов Sonic Pi и выданы за звуки
   мира: бочки bd_* звучали молотом по наковальне, щелчком замка, тихим
   стуком и ударом по камню; тарелки и хай-хэты — звоном стали и монетами;
   малые барабаны — строем стражи; табла — базаром и караваном; электронная
   драм-машина — сигналами и отметками интерфейса; робот-голоса — нежитью и
   зовом глубины; винил — откатом чар и шипением погоды; синтезаторный бас
   и пэды — подземным гулом; гитара и рояль — мистикой и святилищем. Шаг
   героя то и дело перебивался ударом бочки или тарелки. Вдобавок семнадцать
   маяков жителей и построек звучали синтезом — писком осциллятора.

   Все эти роли слиты с настоящими записями свободных игр, сэмплы удалены.
   Шаг перебивали и ноты оркестра: встреча в пути открывалась тремя нотами
   и свистом портала, погода на ходу — дымкой и звоном, зоны, круги, вехи и
   чудеса природы отвечали флейтой, фисгармонией и колокольчиками. Теперь
   всё, что звучит само на ходу, — запись самого мира.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Папок-подмен blow, troop, bazaar и dark нет ни на диске, ни в
      разделах энциклопедии; в nat остались одиннадцать записей настоящих
      предметов, и каждая принадлежит своей роли.
   2. Ни одни титры не называют источником бочку, тарелку, хай-хэт,
      малый барабан, таблу, драм-машину, винил, робота, синтезаторный бас
      или гитару.
   3. Восемьдесят четыре ушедших имени не зовёт ни одна строка игры, и в
      банке их нет.
   4. Роли, принявшие ушедшие имена, — живые записи, и файл каждой лежит на
      диске.
   5. Смена погоды на ходу звучит порывом ветра, а не шипением пластинки.
   6. Сигнал интерфейса любой высоты — живая запись, а не бочка и не
      драм-машина.
   7. Каждый маяк — живая запись: ни синтеза, ни ноты оркестра; жители и
      постройки, звучавшие писком, звучат голосом или работой.
   8. Голоса богов и весёлые случаи по-прежнему у каждого свои; в пулах
      живых сцен повторов нет.
   9. Самопроверка чиста; README и титры nat рассказывают, что ушло.
  10. Всё, что звучит само на ходу, — запись мира, а не нота: погода,
      встречи в пути, зоны, круги, вехи, станы, чудеса, леса, области,
      города, рудник, фон окрестностей; окно встречи — без оркестровых
      предвестий и свиста портала.
  11. Постоянный фон пещеры, подземелья и глубины — долгая запись, а не
      щелчок; роли из щелчков по сотой доле секунды в банке нет.
  12. Одна запись — одна роль: среди звуков игры нет побайтовых двойников.
  13. Исход встречи в пути — тоже мир: монета на камне звенит монетой,
      сон под звёздами кончается птицами рассвета, ответ на зов клана —
      кличем; нот оркестра в исходах нет, кроме того, что играют в самом
      мире (сказитель, рог колонны).
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const КОРЕНЬ=path.join(__dirname,'..');
const ЗВУКИ=path.join(КОРЕНЬ,'sounds');

const УШЛИ=["body_fall","boom_far","clash_blades","dull_hit","forge_hammer","gust_low","impact_heavy",
 "knock_soft","lock_click","metal_hit","parry_slide","quake_low","ram_door","shatter","stone_hit",
 "deep_call","drone_low","magic_rewind","magic_unwind","pad_underworld","wraith_voice","alarm_drum",
 "bazaar_drum","bell_field","boom","caravan_drum","chime","clang_hard","clang_pedal","clang_soft",
 "clang_splash","clash","clink","deep_thud","dread","drone_calm","drone_dark","drone_deep",
 "dungeon_drone","dungeon_heart","forge_work","guard_march","gurgle","hit_heavy","hit_light",
 "hit_snap","pad_bed","portal_deep","rift_bass","rift_tick","shine","signal","temple_piano",
 "voice_far","water_swash","weird","drill_snare","march_snare","soft_thud","distant_snare",
 "hollow_thud","signal_beep","bazaar_tabla","market_slap","market_tap","market_tone","blip","tick",
 "curse","mechanism","mystic","knock","hiss","muffled_snare","pad",
 "bazaar_loop","dungeon_haunt","god_chord","market_perc","shield_hit","whip","swing","parry","wild"];
const ПРИНЯЛИ=["od_fall","oc_thunder","lug_metal","lug_thud","stk_hammer","sky_gust","lug_impact",
 "oc_wood_dull","oc_lock","mtg_metal_hit","od_blade","oc_quake","siege_ram","oc_glass_break",
 "mtg_stone_hit","es_abyss","cave_deep","oc_drone_die","wraith_die","amb_abyss","od_undead",
 "siege_alarm_city","ad_market_sel","oc_metal_dull","es_boom","beasts_camel","uh_bell",
 "oc_shield_metal","lug_clank","oc_metal_light","stk_clang","battle_sword","arte_coins","oc_rock_hit",
 "stk_dark","deep_1","deep_2","deep_3","deep_4","deep_5","es_hit","ad_forge_sel","hero_step_metal",
 "stk_goo","oc_soft_hit","lug_whoosh_hit","mus_tower_steklo","deep_portal","es_ion","oc_electrical",
 "arte_find","oc_crystal_comm","uh_chapel","foe_undead_cast","oc_splash","oc_trap_illusion",
 "throng_march","guard_shout","od_gold","ad_trade","trade_m","oc_ui_select","oc_trap_magic",
 "oc_wheels","oc_wood_hit","oc_res_venom","sky_storm","spell_initiate","lug_knife_slice"];
const ПОДМЕНЫ=["blow","troop","bazaar","dark"];
const НОТЫ=/^(inst|orch|arms|spell|relic|mood|folk|score|blow|troop|bazaar|dark|surf)\//;

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(1500);

 /* ── 1. папки ── */
 const naт=fs.readdirSync(path.join(ЗВУКИ,'nat')).filter(f=>!/^(CREDITS|LICENSE)/.test(f)).sort();
 const папки=await page.evaluate(ПОДМЕНЫ=>{
  const разделы=BANK_GROUPS.reduce((a,g)=>a.concat(g.dirs||[]),[]);
  const владельцы={};Object.keys(SOUND_BANK).forEach(r=>SOUND_BANK[r].f.forEach(f=>{владельцы[f]=r;}));
  return {вРазделах:ПОДМЕНЫ.filter(d=>разделы.includes(d)||BANK_CATS[d]),владельцы,
   natВРазделах:разделы.includes("nat")&&!!BANK_CATS.nat};},ПОДМЕНЫ);
 const наДиске=ПОДМЕНЫ.filter(d=>fs.existsSync(path.join(ЗВУКИ,d)));
 const ничьи=naт.filter(f=>!папки.владельцы['nat/'+f]);
 check('1. папок-подмен нет ни на диске, ни в энциклопедии; в nat одиннадцать записей настоящих предметов, у каждой своя роль',
  наДиске.length===0&&папки.вРазделах.length===0&&naт.length===11&&ничьи.length===0&&папки.natВРазделах
  &&naт.join(",")==="artifact_hum_01.flac,bell_big_01.flac,bell_small_01.flac,choir_01.flac,crow_01.flac,door_wood_01.flac,magic_hum_01.flac,magic_shimmer_01.flac,magic_woosh_01.flac,shop_till_01.flac,vent_01.flac",
  {наДиске,вРазделах:папки.вРазделах,nat:naт,ничьи});

 /* ── 2. титры ── */
 const УДАРНЫЕ=/\|\s*[^|]*\b(bd_|drum_|sn_|hat_|ride_|elec_|tabla_|loop_tabla|loop_perc|glitch_|vinyl_|mehackit_|bass_|guit_|tbd_)[a-z0-9_]*[^|]*\|\s*$/m;
 const титры=[];
 for(const d of fs.readdirSync(ЗВУКИ)){
  const f=path.join(ЗВУКИ,d,'CREDITS.md');
  if(!fs.existsSync(f))continue;
  fs.readFileSync(f,'utf8').split('\n').forEach((л,i)=>{if(/^\|/.test(л)&&УДАРНЫЕ.test(л))титры.push(d+':'+(i+1)+': '+л.slice(0,80));});}
 check('2. ни одни титры не называют источником бочку, тарелку, малый барабан, таблу, драм-машину, винил, робота, синтезаторный бас или гитару',
  титры.length===0,титры.slice(0,5));

 /* ── 3. ушедшие имена ── */
 const src=fs.readFileSync(path.join(КОРЕНЬ,'index.html'),'utf8');
 const ЗОВ=r=>new RegExp('(Bank\\.(play|has|pick|panned)|Spatial\\.role|natShot|snd:|звук:|роль:|голос:|шутка:|маркер:|сраб:|покой:|мотив:|следом:\\[\\[)\\s*\\(?\\s*"'+r+'"');
 const зовут=УШЛИ.filter(r=>ЗОВ(r).test(src));
 const вБанке=await page.evaluate(УШЛИ=>УШЛИ.filter(r=>!!SOUND_BANK[r]),УШЛИ);
 check('3. восемьдесят четыре ушедших имени не зовёт ни одна строка, и в банке их нет',
  УШЛИ.length===84&&зовут.length===0&&вБанке.length===0,{зовут,вБанке});

 /* ── 4. принявшие роли — живые записи ── */
 const принявшие=await page.evaluate(ПРИНЯЛИ=>ПРИНЯЛИ.map(r=>[r,(SOUND_BANK[r]||{}).f||[]]),ПРИНЯЛИ);
 const плохиеПринявшие=принявшие.filter(([r,f])=>!f.length||f.some(x=>НОТЫ.test(x)||!fs.existsSync(path.join(ЗВУКИ,x))));
 check('4. роли, принявшие ушедшие имена, — живые записи из папок мира, и файл каждой лежит на диске',
  плохиеПринявшие.length===0,плохиеПринявшие.slice(0,5));

 /* ── 5. смена погоды на ходу ── */
 const погода=await page.evaluate(async()=>{
  const было={play:Bank.play,roll:rollWeather,rnd:Math.random,eff:settings.effects};
  const сыграно=[];
  Bank.play=function(r,o){сыграно.push(String(r));return было.play.call(Bank,r,o);};
  settings.effects=1;G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.alt=0;
  /* Погода катится на каждом шаге и каждый раз выпадает другая: ливень,
     ясно, ливень, ясно — смена на каждом шаге. */
  G.weather="Ясно";let n=0;window.rollWeather=()=>(++n%2?"Ливень":"Ясно");
  Math.random=()=>0.1;
  try{
   for(const d of ["E","W","E","W"])safeFn(()=>move(d));
  }finally{Math.random=было.rnd;window.rollWeather=было.roll;Bank.play=было.play;settings.effects=было.eff;
   while(activeLayer())closeTopUI();}
  return сыграно;});
 check('5. смена погоды на ходу звучит порывом ветра, а не шипением пластинки',
  погода.includes("sky_gust")&&!погода.includes("hiss"),погода.slice(0,20));

 /* ── 6. сигнал интерфейса ── */
 const сигнал=await page.evaluate(()=>{
  const было=Bank.play;const сыграно=[];
  Bank.play=function(r,o){сыграно.push(String(r));return было.call(Bank,r,o);};
  try{[200,450,750,1050,1500].forEach(f=>UI.blip(f,0.05,0.05));}finally{Bank.play=было;}
  return {сыграно,пул:LIVE_BLIP.slice(),файлы:LIVE_BLIP.map(r=>((SOUND_BANK[r]||{}).f||[])[0]||null)};});
 check('6. сигнал интерфейса любой высоты — живая запись, а не бочка и не драм-машина',
  сигнал.пул.length===5&&new Set(сигнал.пул).size===5&&сигнал.файлы.every(f=>f&&!НОТЫ.test(f)&&!/^nat\//.test(f))
  &&сигнал.сыграно.length>=5&&сигнал.сыграно.every(r=>сигнал.пул.includes(r)),сигнал);

 /* ── 7. маяки ── */
 const маяки=await page.evaluate(()=>{
  const ids=new Set([...Object.keys(BEACON_ROLE),...Object.keys(BEACON_SAMPLE),...Object.keys(BEACONS||{})]);
  const out=[];
  ids.forEach(id=>{const роль=BEACON_ROLE[id];const файлы=роль&&SOUND_BANK[роль]?SOUND_BANK[роль].f:[];
   const один=BEACON_SAMPLE[id]||null;out.push({id,роль:роль||null,файлы,один});});
  return out;});
 const синтезом=маяки.filter(m=>!m.файлы.length&&!m.один).map(m=>m.id);
 const нотой=маяки.filter(m=>m.файлы.concat(m.один?[m.один]:[]).some(f=>НОТЫ.test(f))).map(m=>m.id);
 const нетФайла=маяки.filter(m=>m.файлы.concat(m.один?[m.один]:[]).some(f=>!fs.existsSync(path.join(ЗВУКИ,f)))).map(m=>m.id);
 const жители=["npc_ruler","npc_guard","npc_merchant","npc_scholar","npc_bartender","npc_common","npc_elder",
  "npc_farmer","npc_healer","npc_clanlead","npc_warrior","npc_apprentice","npc_traveler","house","barracks","throne","ship"];
 const жителиЖивы=жители.every(id=>{const m=маяки.find(x=>x.id===id);return m&&m.файлы.length>0;});
 check('7. каждый маяк — живая запись без синтеза и без ноты оркестра; жители и постройки звучат голосом или работой',
  маяки.length>=70&&синтезом.length===0&&нотой.length===0&&нетФайла.length===0&&жителиЖивы,
  {синтезом,нотой,нетФайла,жителиЖивы});

 /* ── 8. уникальность ── */
 const свои=await page.evaluate(()=>{
  const боги={};GODS_ALL.forEach(g=>{(боги[g.звук]=боги[g.звук]||[]).push(g.id);});
  const зв={},шт={};MIRTH_EVENTS.forEach(m=>{(зв[m.звук]=зв[m.звук]||[]).push(m.id);(шт[m.шутка]=шт[m.шутка]||[]).push(m.id);});
  const пулы=Object.entries(LIVE_INSTEAD).filter(([k,v])=>Array.isArray(v)&&new Set(v).size!==v.length).map(([k])=>k);
  return {богиДубли:Object.entries(боги).filter(([,v])=>v.length>1),богиНет:GODS_ALL.filter(g=>!SOUND_BANK[g.звук]).map(g=>g.id),
   весёлыеДубли:Object.entries(зв).filter(([,v])=>v.length>1).concat(Object.entries(шт).filter(([,v])=>v.length>1)),пулы};});
 check('8. голоса богов и весёлые случаи по-прежнему у каждого свои, в пулах живых сцен повторов нет',
  !свои.богиДубли.length&&!свои.богиНет.length&&!свои.весёлыеДубли.length&&!свои.пулы.length,свои);

 /* ── 9. самопроверка и документы ── */
 const свод=await page.evaluate(()=>worldSelfCheck().filter(x=>!x.ok).map(x=>x.id));
 const readme=fs.readFileSync(path.join(КОРЕНЬ,'README.md'),'utf8');
 const титрыNat=fs.readFileSync(path.join(ЗВУКИ,'nat','CREDITS.md'),'utf8');
 check('9. самопроверка чиста; README и титры nat рассказывают, что ушло и почему',
  свод.length===0&&/Ни барабана под видом звука мира/.test(readme)&&/Что отсюда ушло и почему/.test(титрыNat),
  {свод,readme:/Ни барабана под видом звука мира/.test(readme)});

 /* ── 10. что звучит само на ходу ── */
 const ходьба=await page.evaluate(()=>{
  const роли=[],где={};
  const add=(r,k)=>{if(!r)return;роли.push(r);(где[r]=где[r]||[]).push(k);};
  /* погода: Weather.set зовёт банк — перехватываем, ничего не играя */
  const было=Bank.play,сыграно=[];
  Bank.play=function(r){сыграно.push(String(r));return null;};
  try{["Дождь","Ливень","Гроза","Туман","Снег","Метель","Град","Песчаная буря","Зной","Ветрено","Облачно"]
   .forEach(w=>{try{Weather.set(w);}catch(_){}});}
  finally{Bank.play=было;try{Weather.clear();}catch(_){}}
  сыграно.forEach(r=>add(r,"погода"));
  EVENTS.forEach(e=>add(e.snd,"встреча "+e.id));
  ANOM_RULES.forEach(x=>add(x.маркер,"зона "+x.id));
  LANDMARKS.concat(CAMP_KINDS).forEach(x=>add(x.звук,"место "+x.id));
  Object.values(FOREST_KINDS).forEach(k=>k.звук.forEach(r=>add(r,"лес "+k.n)));
  REGIONS.forEach(x=>x.звук.forEach(r=>add(r,"область "+x.id)));
  CITY_TRADES.forEach(x=>x.звук.forEach(r=>add(r,"город "+x.id)));
  LIGHT_CIRCLES.forEach(x=>add(x.голос,"круг "+x.n));
  DUNG_TYPES.forEach(x=>add(x.звук,"подземелье "+x.id));
  DEEP_FAMILIES.forEach(x=>add(x.звук,"семья "+x.id));
  PARANOIA.forEach(x=>add(x.звук,"признак "+x.id));
  DEEP_NODES.concat(DEEP_EVENTS,DEEP_COMPLEX).forEach(x=>add(x.звук,"веха "+x.n));
  MINE_BRANCHES.concat(MINE_RULES).forEach(x=>add(x.звук,"рудник "+x.n));
  const черты=[];(function обход(v){if(Array.isArray(v))v.forEach(обход);
   else if(v&&typeof v==="object"){if(typeof v.звук==="string")черты.push(v);Object.values(v).forEach(обход);}})(PLACE_TRAITS);
  черты.forEach(x=>add(x.звук,"черта "+(x.n||x.id)));
  Object.entries(AMBIENCE_SET).forEach(([k,v])=>[].concat(v.spots||[],v.rain||[],v.night||[]).forEach(p=>add(p[0],"окрестность "+k)));
  return {роли:[...new Set(роли)].map(r=>[r,(SOUND_BANK[r]||{}).f||[],где[r]]),
   окно:String(openEvent),встреча:String(maybeEvent)};});
 /* Инструмент, который играет сам мир: сказитель на дороге и ярмарке играет
    сам, костяные трубы звонницы — сквозняк. */
 const СВОИ={bard:"сказитель играет сам",crypt_organ:"трубы звонницы играет сквозняк"};
 const наНоте=ходьба.роли.filter(([r,f])=>!СВОИ[r]&&(!f.length||f.some(x=>НОТЫ.test(x))))
  .map(([r,,g])=>r+" ← "+g.slice(0,2).join(", "));
 const предвестия=/omen_swell|fx_omen|pad_rift|beacon\("portal"/.test(ходьба.окно)||/violin_omen/.test(ходьба.встреча);
 const безЗвука=await page.evaluate(()=>EVENTS.filter(e=>!e.snd&&e.id!=="omen").map(e=>e.id));
 check('10. всё, что звучит само на ходу, — запись мира, а не нота: погода, встречи, зоны, круги, вехи, станы, чудеса, леса, области, города; окно встречи без оркестровых предвестий',
  ходьба.роли.length>=150&&наНоте.length===0&&!предвестия&&безЗвука.length===0,
  {наНоте:наНоте.slice(0,8),предвестия,безЗвука,всего:ходьба.роли.length});

 /* ── 11. постоянный фон пещеры и подземелья ── */
 const фон=await page.evaluate(()=>{
  const было={loop:Bank.loop,rk:window.roomKind,eff:settings.effects,en:Bank.enabled};
  const взято={};let вид=null;
  try{settings.effects=1;Bank.enabled=true;
   Bank.loop=function(ch,r){if(ch==="scape")взято[вид]=r;return true;};
   for(const к of ["cave","dungeon","deep"]){вид=к;window.roomKind=()=>к;Scape.bedKind=null;Scape.bed();}
  }finally{Bank.loop=было.loop;window.roomKind=было.rk;settings.effects=было.eff;Bank.enabled=было.en;Scape.bedKind=null;}
  return {роли:Object.entries(взято).map(([к,r])=>[к,r,(SOUND_BANK[r]||{}).f||[]]),щелчки:!!SOUND_BANK.mine_deep};});
 const короткий=фон.роли.filter(([,,f])=>!f.length||f.some(x=>!fs.existsSync(path.join(ЗВУКИ,x))
  ||fs.statSync(path.join(ЗВУКИ,x)).size<100000));
 check('11. постоянный фон пещеры, подземелья и глубины — долгая запись, а не щелчок; роли из щелчков в банке нет',
  фон.роли.length===3&&короткий.length===0&&!фон.щелчки,{фон:фон.роли.map(([к,r])=>к+"="+r),короткий,щелчки:фон.щелчки});

 /* ── 12. одна запись — одна роль ── */
 const хеши={};
 (function обход(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())обход(p);
  else if(/\.(ogg|mp3|flac|wav)$/i.test(e.name)){const h=crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
   (хеши[h]=хеши[h]||[]).push(path.relative(ЗВУКИ,p));}}})(ЗВУКИ);
 const двойники=Object.values(хеши).filter(v=>v.length>1);
 check('12. одна запись — одна роль: среди звуков игры нет побайтовых двойников',
  двойники.length===0,двойники.slice(0,5));

 /* ── 13. исходы встреч ── */
 const исходы=await page.evaluate(()=>{
  const ноты=Object.keys(SOUND_BANK).filter(r=>SOUND_BANK[r].f.some(f=>/^(inst|orch|arms|spell|relic|mood|folk|score)\//.test(f)));
  const СВОИ=["bard","horn_gate"];
  const out=[];
  EVENTS.forEach(e=>{const src=String(e.choices);
   ноты.forEach(r=>{if(!СВОИ.includes(r)&&src.includes('"'+r+'"'))out.push(e.id+": "+r);});});
  return out;});
 check('13. исход встречи в пути звучит миром, а не нотой оркестра',исходы.length===0,исходы.slice(0,8));

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
