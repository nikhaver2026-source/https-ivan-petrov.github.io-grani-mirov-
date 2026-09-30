/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 214: 4.7 — НАСТРОЙКИ ПЕРСОНАЖА В ГЛАВНОМ МЕНЮ

   Просьба игрока: до входа в мир — настройки персонажа пунктами: пол, раса,
   народ, внешность и голос. Сначала раса и народ: от них зависит, какая
   бывает внешность; у каждой расы свои параметры, их много — характер,
   волосы, кожа, глаза, телосложение, рост и черты, присущие расе и народу.
   Голоса живые, не меньше пяти на каждый пол, и при выборе голоса видны
   только голоса выбранного пола. Мужчина говорит мужским голосом, женщина —
   женским. От расы и облика зависит и то, как героя встречают.

   1. В главном меню есть «Настройки персонажа»; новая история («Начать
      историю», «Без пролога») сперва открывает их. Пункты: пол, раса,
      народ, внешность, голос, описание, готово.
   2. У каждой расы не меньше девяти параметров облика и своя особенность;
      у разных родов тела разные параметры (кожа, мех, чешуя, перо, кора).
   3. Народ добавляет родовой цвет и примету народа.
   4. Голосов не меньше пяти на каждый пол; в списке — только голоса пола
      героя; голос другого пола не выбирается; смена пола меняет и голос.
   5. Каждый голос записан: все ходы разговора и образец — FLAC на месте.
   6. Герой говорит выбранным голосом; женщина не говорит мужским голосом;
      стон от раны — голосом пола героя.
   7. Первое впечатление: земляк теплее, давний враг народа холоднее; оно
      входит в отношение народа только у собранного героя.
   8. «Готово» делает расу происхождением и ведёт в пролог; после начала
      пути расу не сменить, голос — можно.
   9. Жест закрытия возвращает на уровень выше: вариант → внешность → пункты.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);

 /* ── 1. ── */
 const меню=await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('#screen-title [data-cmd]')].map(b=>b.dataset.cmd);
  window.__intro=0;const si=window.startIntro;window.startIntro=function(){window.__intro++;};
  CMD.story();
  const open=!document.getElementById("modal-hero").hidden;
  const пункты=[...document.querySelectorAll("#heroBody [data-punkt]")].map(b=>b.dataset.punkt);
  return {btn:btn.indexOf("hero")>=0&&btn.indexOf("hero")<btn.indexOf("story"),open,пункты,интро:window.__intro};});
 check('1. «Настройки персонажа» в главном меню; новая история открывает их первыми',
  меню.btn&&меню.open&&меню.интро===0&&["sex","race","people","look","voice","about","done"].every(p=>меню.пункты.includes(p)),меню);

 /* ── 2. ── */
 const облик=await page.evaluate(()=>{
  const мало=[],безОсобой=[];
  RACES_DB.forEach(r=>{const ps=heroLookParams(r.id,"");if(ps.length<9)мало.push(r.id+":"+ps.length);
   if(!ps.some(p=>p.k==="особое"))безОсобой.push(r.id);});
  const ключи=id=>heroLookParams(id,"").map(p=>p.k);
  const общие=["нрав","телосложение","рост","глаза"];
  return {мало,безОсобой,рас:RACES_DB.length,
   человек:ключи("human"),дракон:ключи("dragonborn"),дриада:ключи("dryad"),гарпия:ключи("harpy"),зверь:ключи("beastkin"),
   общие:["human","dragonborn","dryad","golem","fae"].every(id=>общие.every(k=>ключи(id).includes(k))),
   рост:[heroLookParams("halfling","").find(p=>p.k==="рост").opts[2],heroLookParams("titan","").find(p=>p.k==="рост").opts[2]],
   кожаОрка:heroLookParams("orc","").find(p=>p.k==="кожа").opts};});
 check('2. у каждой расы ≥9 параметров облика и своя особенность; род тела даёт свои параметры',
  !облик.мало.length&&!облик.безОсобой.length&&облик.общие
  &&облик.человек.includes("кожа")&&облик.человек.includes("волосы")&&облик.дракон.includes("чешуя")&&!облик.дракон.includes("волосы")
  &&облик.дриада.includes("кора")&&облик.гарпия.includes("оперение")&&облик.зверь.includes("мех")
  &&/110 см/.test(облик.рост[0])&&/м$/.test(облик.рост[1])&&облик.кожаОрка.includes("Зелёная"),облик);

 /* ── 3. ── */
 const народ=await page.evaluate(()=>{
  heroSet("race","elf");heroOpen("people");
  const список=[...document.querySelectorAll("#heroBody button")].map(b=>b.textContent);
  heroSet("people","1");
  const h=G.hero;const ps=heroLookParams(h.race,h.people);
  return {список,народ:h.people,кожа:ps.find(p=>p.k==="кожа").opts[0],волосы:ps.find(p=>p.k==="волосы").opts[0],примета:!!ps.find(p=>p.k==="примета")};});
 check('3. народ добавляет родовой цвет и примету',
  народ.народ==="Сумеречные эльфы"&&/Сумеречно/.test(народ.кожа)&&/Сумеречно/.test(народ.волосы)&&народ.примета&&народ.список.length>=3,народ);

 /* ── 4. ── */
 const голоса=await page.evaluate(()=>{
  const r={м:HERO_VOICES["м"].length,ж:HERO_VOICES["ж"].length};
  heroSet("sex","ж");r.голосПослеСмены=G.hero.voice;
  heroOpen("voice");r.список=[...document.querySelectorAll("#heroBody [data-hero-voice]")].map(b=>b.dataset.heroVoice);
  r.чужой=heroSet("voice","fenrir");r.свой=heroSet("voice","autonoe");r.итог=G.hero.voice;
  heroSet("sex","м");r.муж=G.hero.voice;
  heroOpen("voice");r.списокМ=[...document.querySelectorAll("#heroBody [data-hero-voice]")].map(b=>b.dataset.heroVoice);
  r.ids={м:HERO_VOICES["м"].map(v=>v.id),ж:HERO_VOICES["ж"].map(v=>v.id)};
  return r;});
 check('4. не меньше пяти голосов на пол; в списке только голоса пола героя; чужой не выбирается',
  голоса.м>=5&&голоса.ж>=5&&голоса.ids.ж.includes(голоса.голосПослеСмены)
  &&JSON.stringify(голоса.список)===JSON.stringify(голоса.ids.ж)&&голоса.чужой===false&&голоса.свой===true&&голоса.итог==="autonoe"
  &&голоса.ids.м.includes(голоса.муж)&&JSON.stringify(голоса.списокМ)===JSON.stringify(голоса.ids.м),голоса);

 /* ── 5. ── */
 const записи=await page.evaluate(()=>({lines:HERO_VOICE_LINES,len:HERO_VOICE_LEN,ходы:VOICE_HERO.concat(Object.keys(VOICE_NPC.hero||{})),
  ids:HERO_VOICES["м"].concat(HERO_VOICES["ж"]).map(v=>v.id)}));
 const нетХодов=[],нетФайлов=[],неFlac=[];
 записи.ids.forEach(id=>{
  const файлы=["obrazec_"+id+"_g"];
  if(id!=="algieba"){записи.ходы.forEach(х=>{if(!(записи.lines[id]||[]).includes(х))нетХодов.push(id+":"+х);else файлы.push(`hero_${х}_${id}_g`);});}
  файлы.forEach(f=>{const p=path.join(ROOT,'sounds/voice_hero',f+'.flac');
   if(!fs.existsSync(p))нетФайлов.push(f);else if(fs.readFileSync(p).slice(0,4).toString()!=='fLaC')неFlac.push(f);});});
 const опись=fs.existsSync(path.join(ROOT,'sounds/voice_hero/CREDITS.md'));
 check('5. каждым голосом записаны все ходы разговора и образец; FLAC и опись на месте',
  !нетХодов.length&&!нетФайлов.length&&!неFlac.length&&опись,{нетХодов:нетХодов.slice(0,8),нетФайлов:нетФайлов.slice(0,8),неFlac,опись});

 /* ── 6. ── */
 const речь=await page.evaluate(()=>{
  const пути=[];const было=Folk.сказать;Folk.сказать=function(путь,n,o){пути.push((o&&o.dir||"")+путь);return true;};
  const bank=[];const bp=Bank.play.bind(Bank);Bank.play=function(r,o){bank.push(r);return true;};
  const h=G.hero;const r={};
  h.made=1;
  h.пол="ж";h.voice="kore";Folk.герой("torg");r.жен=пути.slice();
  пути.length=0;h.voice="algieba";r.женАльгиеба=Folk.герой("torg");r.женАльгиебаПути=пути.slice();
  h.voice="kore";playWoundSfx(8);r.стонЖ=bank.filter(x=>/^hero_pain/.test(x));
  bank.length=0;пути.length=0;
  h.пол="м";h.voice="fenrir";Folk.герой("sporit");r.муж=пути.slice();
  h.voice="algieba";пути.length=0;Folk.герой("sporit");r.мужПрежний=пути.slice();
  playWoundSfx(8);r.стонМ=bank.filter(x=>/^hero_pain/.test(x));
  Folk.сказать=было;Bank.play=bp;
  return r;});
 check('6. герой говорит выбранным голосом своего пола; стон от раны — голосом пола героя',
  речь.жен[0]==="voice_hero/hero_torg_kore_g"&&речь.женАльгиеба===false&&!речь.женАльгиебаПути.length
  &&речь.стонЖ[0]==="hero_pain_f"&&речь.муж[0]==="voice_hero/hero_sporit_fenrir_g"&&речь.мужПрежний[0]==="hero_sporit_g"&&речь.стонМ[0]==="hero_pain_m",речь);

 /* ── 7. ── */
 const впечатление=await page.evaluate(()=>{
  const h=G.hero;h.race="elf";h.people="";h.look.нрав=0;
  const враг=RACES_DB.find(r=>r.id!=="elf"&&heroEnemies("elf",r.id));
  h.made=0;const безГероя=heroRegard("Эльфы");const отнБез=attitudeOf("Эльфы").rep;
  h.made=1;
  return {безГероя,земляк:heroRegard("Эльфы"),враг:враг&&враг.n,кВрагу:враг?heroRegard(враг.n):null,
   отн:attitudeOf("Эльфы").rep-отнБез,все:RACES_DB.every(r=>Math.abs(heroRegard(r.n))<=6),
   сводка:heroRegardSummary(h)};});
 check('7. земляк теплее, давний враг холоднее; впечатление входит в отношение только у собранного героя',
  впечатление.безГероя===0&&впечатление.земляк>0&&впечатление.враг&&впечатление.кВрагу<0&&впечатление.отн===впечатление.земляк
  &&впечатление.все&&/теплее/.test(впечатление.сводка),впечатление);

 /* ── 8. ── */
 const готово=await page.evaluate(async()=>{
  G.hero.made=0;
  const m=document.getElementById("modal-hero");if(m.hidden)openHeroSetup("story");else HEROUI.after="story";
  heroSet("race","dwarf");heroSet("sex","ж");heroSet("voice","vindemiatrix");
  heroOpen("done");await new Promise(z=>setTimeout(z,400));
  const r={race:G.race,chosen:G.raceChosen,made:G.hero.made,закрыто:m.hidden,интро:window.__intro,жен:heroVoiceFemale(),
   раса:startRaceOpen()};
  entered=true;
  r.сменаРасы=heroSet("race","orc");r.раса2=G.hero.race;r.сменаГолоса=heroSet("voice","kore");r.голос=G.hero.voice;
  entered=false;
  return r;});
 check('8. «Готово» — раса становится происхождением и начинается пролог; после начала пути раса не меняется, голос меняется',
  готово.race==="Гномы"&&готово.chosen===1&&готово.made===1&&готово.закрыто&&готово.интро===1&&готово.жен&&готово.раса===false
  &&готово.сменаРасы===false&&готово.раса2==="dwarf"&&готово.сменаГолоса===true&&готово.голос==="kore",готово);

 /* ── 9. ── */
 const назад=await page.evaluate(()=>{
  G.hero.made=0;openHeroSetup(null);heroOpen("look");heroParam("глаза");
  const r=[HEROUI.view];closeTopUI();r.push(HEROUI.view);closeTopUI();r.push(HEROUI.view);closeTopUI();
  r.push(document.getElementById("modal-hero").hidden);return r;});
 check('9. жест закрытия: вариант → внешность → пункты → окно закрыто',
  JSON.stringify(назад)===JSON.stringify(["param","look","menu",true]),назад);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
