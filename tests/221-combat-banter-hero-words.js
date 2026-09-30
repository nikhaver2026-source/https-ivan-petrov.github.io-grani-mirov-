/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 221: 5.0 — ПЕРЕПАЛКА В БОЮ, КРИКИ, СЛОВО ГЕРОЯ НА ПОРОГЕ И В ПУТИ

   Просьба игрока:
   — чтобы было слышно, что говорят твари (призраки в подземелье и другие);
   — чтобы герой в бою говорил: грозил зверю («я пущу тебя на шкуру», «я из
     тебя сделаю шашлык»), отвечал разумному врагу, а враг — ему; бранно,
     серьёзно или с юмором; при слабом здоровье — подсказкой; фраз — двадцать
     тысяч;
   — крики героя от ударов и крики врагов, того же разбойника;
   — чтобы герой отвечал встречающим («к лекарю налево» — «понял, спасибо»)
     и отзывался в каждом месте — удивлением, страхом; на каждую расу и народ
     — около пяти тысяч реплик, по характеру героя.

   1. Разных реплик в бою больше двадцати тысяч; у разумных врагов — свои.
   2. У героя каждой расы больше пяти тысяч реплик на пороге и в пути, и у
      двух рас они свои (слова народа: бог, земля, клан).
   3. Тон — по характеру: вспыльчивый чаще бранится, благородный говорит
      серьёзно, весёлый шутит.
   4. В бою: зверю герой грозит сам; разумному врагу отвечает, и враг отвечает
      герою; при трети здоровья герой говорит, что ему худо (подсказка), когда
      враг слабеет — что враг едва стоит; у героини — в женском роде.
   5. Слово твари громче фона, и музыка с шумом схватки на это время стихают.
   6. Крики: у героя несколько записей; разбойник вскрикивает и падает с
      человеческим криком, а не голосом гоблина.
   7. На пороге герой отвечает встречающему по смыслу его слов; в новой
      местности — отзывается; флажок «Герой говорит сам» всё это выключает.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  settings.effects=1;settings.heroTalk=1;G.inCombat=false;G.combat=null;G.place=null;G.ship=null;G.dark=false;
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};});

 /* ── 1 ── */
 const о1=await page.evaluate(()=>Перепалка.всего());
 check('1. разных реплик в бою больше двадцати тысяч, у разумных врагов свои',о1.всего>=20000&&о1.герой>=20000&&о1.враги>=500,о1);

 /* ── 2 ── */
 const о2=await page.evaluate(()=>{
  const ids=RACES_DB.filter((r,i)=>i%23===0).map(r=>r.id).slice(0,8);
  const счёт={};ids.forEach(id=>счёт[id]=СловоГероя.всего(id));
  /* Слова народа: у людей и у эльфов строки разные. */
  const строки=id=>{G.hero=Object.assign({},G.hero||{},{made:1,race:id,people:""});const out=new Set();
   for(let i=0;i<400;i++)out.add(СловоГероя.строка("forest",{тон:"серь"}));return [...out];};
  const л=строки("human"),э=строки("elf");
  const своиЛ=л.filter(t=>/люди|Серебряные Реки|Стальные Крылья/.test(t)).length,своиЭ=э.filter(t=>/эльфы|Вечная Чаща|Зелёный Круг/.test(t)).length;
  const чужие=л.filter(t=>/эльфы|Вечная Чаща/.test(t)).length;
  return {счёт,мин:Math.min(...Object.values(счёт)),своиЛ,своиЭ,чужие};});
 check('2. у героя каждой расы больше пяти тысяч реплик на пороге и в пути, у каждой расы свои слова народа',
  о2.мин>=5000&&о2.своиЛ>0&&о2.своиЭ>0&&о2.чужие===0,о2);

 /* ── 3 ── */
 const о3=await page.evaluate(()=>{
  const доли=id=>{const с={серь:0,юмор:0,руг:0};for(let i=0;i<600;i++)с[Реплики.тон(id)]++;return с;};
  return {hot:доли("hot"),noble:доли("noble"),cheer:доли("cheer")};});
 check('3. тон по характеру: вспыльчивый бранится, благородный серьёзен, весёлый шутит',
  о3.hot.руг>о3.hot.серь&&о3.hot.руг>о3.hot.юмор&&о3.noble.серь>о3.noble.юмор+о3.noble.руг&&о3.cheer.юмор>о3.cheer.серь+о3.cheer.руг,о3);

 /* ── 4 ── */
 const о4=await page.evaluate(async()=>{
  const w=ms=>new Promise(z=>setTimeout(z,ms));
  const find=id=>MONSTERS.find(m=>m.id===id)||DARK_MONSTERS.find(m=>m.id===id)||DEEP_MONSTERS.find(m=>m.id===id);
  G.hero=Object.assign({},G.hero||{},{made:1,пол:"м",race:"human"});G.hero.look=Object.assign({},G.hero.look||{},{нрав:3});
  const r={};
  /* Зверь: герой грозит сам. */
  const wolf=Object.assign({},find("wolf"),{hp:100});G.inCombat=true;G.combat={m:wolf,hp:wolf.hp,key:"0,0",alt:0};
  SAID.length=0;Перепалка.было=0;for(let i=0;i<6&&!SAID.some(t=>/^Вы: «/.test(t));i++){Перепалка.было=0;Перепалка.начало(wolf);}
  r.зверь=SAID.find(t=>/^Вы: «/.test(t))||"";
  /* Край твари — подсказка героя. */
  G.combat.hp=Math.floor(wolf.hp*0.2);SAID.length=0;Перепалка.удар(wolf);await w(400);
  r.крайТвари=Перепалка.last&&Перепалка.last.миг;
  /* Свой край — подсказка. */
  G.hp=Math.max(1,Math.floor(G.hpMax*0.25));SAID.length=0;Перепалка.рана(wolf,5);
  r.свойКрай=Перепалка.last&&Перепалка.last.миг;r.свойКрайТекст=Перепалка.last&&Перепалка.last.t;
  /* Разумный враг: герой отвечает, враг отвечает герою. */
  const b=Object.assign({},find("bandit"),{hp:100});G.combat={m:b,hp:b.hp,key:"0,0",alt:0};G.hp=G.hpMax;
  SAID.length=0;Перепалка.было=0;
  const was=Math.random;Math.random=()=>0.01;
  Перепалка.сказать("reply",b,{ответ:true,шанс:1});
  Math.random=was;
  await w(5500);
  r.перепалка=SAID.filter(t=>/^Вы: «|^Разбойник[^:]*: «|: «/.test(t)).slice(0,4);
  r.вразОтвет=Перепалка.last&&Перепалка.last.кто;
  /* Героиня: в женском роде. */
  G.hero.пол="ж";
  const жен=[];for(let i=0;i<200;i++)жен.push(Перепалка.строка("low",wolf,"серь"));
  r.героиня=жен.find(t=>/ранена|готова|упала|одна/.test(t))||"";
  r.мужВЖен=жен.filter(t=>/(?<![А-Яа-яЁё])я (?:не )?[а-яё]+(?:ал|ил|ел|ёл)(?![А-Яа-яЁё])/.test(t)).length;
  G.hero.пол="м";G.inCombat=false;G.combat=null;G.hp=G.hpMax;
  return r;});
 check('4. зверю герой грозит, разумному отвечает и слышит ответ; подсказки о своём и чужом крае; героиня — в женском роде',
  /^Вы: «/.test(о4.зверь)&&о4.крайТвари==="foeLow"&&о4.свойКрай==="low"&&о4.вразОтвет==="враг"&&о4.перепалка.length>=2&&о4.мужВЖен===0,о4);

 /* ── 5 ── */
 const о5=await page.evaluate(()=>{
  const до={music:speechDuck("music"),combat:speechDuck("combat")};
  VoiceDuck.на(800);
  const во={music:speechDuck("music"),combat:speechDuck("combat")};
  const src=String(Folk.сказать);
  return {до,во,громче:/чётко\)\{оп\.gain=\(o\.gain\|\|VOICE_MIX\.gain\)\*1\.3/.test(src),флаг:/чётко:true/.test(String(FoeTalk.сказать))};});
 check('5. слово твари громче фона, музыка и шум схватки под ним стихают',
  о5.громче&&о5.флаг&&о5.во.music<о5.до.music&&о5.во.combat<о5.до.combat,о5);

 /* ── 6 ── */
 const о6=await page.evaluate(()=>{
  const role=n=>(typeof SND!=="undefined"&&SND[n])||null;
  const find=id=>MONSTERS.find(m=>m.id===id);
  const b=Object.assign({},find("bandit"));G.inCombat=true;G.combat={m:b,hp:b.hp,key:"0,0",alt:0,голосРечи:0};
  G.lastFoeCry=null;playRealMonsterCue(b,"damage",0.6);const удар=G.lastFoeCry&&G.lastFoeCry.role;
  G.lastFoeCry=null;playRealMonsterCue(b,"death",0.6);const смерть=G.lastFoeCry&&G.lastFoeCry.role;
  G.combat.голосРечи=2;G.lastFoeCry=null;playRealMonsterCue(b,"death",0.6);const смертьЖ=G.lastFoeCry&&G.lastFoeCry.role;
  G.inCombat=false;G.combat=null;
  return {герой:Bank.has("cry_hero_m")&&Bank.has("cry_hero_f"),удар,смерть,смертьЖ,
   рана:/cry_hero_f":"cry_hero_m"/.test(String(playWoundSfx))};});
 check('6. крики: у героя свои записи, разбойник вскрикивает и падает по-человечески, разбойница — женским криком',
  о6.герой&&о6.рана&&о6.удар==="cry_foe_m"&&о6.смерть==="die_foe_m"&&о6.смертьЖ==="die_foe_f",о6);

 /* ── 7 ── */
 const о7=await page.evaluate(()=>{
  const r={};
  r.виды={путь:СловоГероя.вид("К лекарю налево, за стойкой."),предупр:СловоГероя.вид("Оружие убери, чужак."),торг:СловоГероя.вид("Товар свежий, цена честная."),
   вопрос:СловоГероя.вид("Какими судьбами?"),привет:СловоГероя.вид("Добро пожаловать!")};
  SAID.length=0;СловоГероя.было=0;СловоГероя.ответ("К лекарю налево.",{кто:"Трактирщик"});
  r.ответ=SAID.find(t=>/^Вы: «/.test(t))||"";r.ctx=СловоГероя.last&&СловоГероя.last.ctx;
  const was=Math.random;Math.random=()=>0.01;
  SAID.length=0;СловоГероя.было=0;СловоГероя.местность("swamp");r.болото=SAID.find(t=>/^Вы: «/.test(t))||"";
  settings.heroTalk=0;SAID.length=0;СловоГероя.было=0;СловоГероя.местность("forest");r.выкл=SAID.filter(t=>/^Вы: «/.test(t)).length;
  G.combat={m:MONSTERS.find(m=>m.id==="wolf"),hp:10,key:"0,0",alt:0};Перепалка.было=0;r.выклБой=Перепалка.сказать("start",G.combat.m);G.combat=null;
  settings.heroTalk=1;Math.random=was;
  r.флажок=!!document.getElementById("setHeroTalk");
  return r;});
 check('7. на пороге герой отвечает по смыслу («понял, спасибо»), в новой местности отзывается; флажок выключает всё',
  о7.виды.путь==="путь"&&о7.виды.предупр==="предупр"&&о7.виды.торг==="торг"&&о7.виды.вопрос==="вопрос"&&о7.виды.привет==="привет"
  &&/^Вы: «/.test(о7.ответ)&&о7.ctx==="путь"&&/^Вы: «/.test(о7.болото)&&о7.выкл===0&&о7.выклБой===false&&о7.флажок,о7);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
