/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 134: ВЛАДЫКИ ЯРУСОВ — КРУПНЫЙ СТРАЖ ТОЖЕ БОСС (§26 брифа)

   §26 требует от КАЖДОГО крупного босса девяти вещей: уникального звука,
   стиля боя, фаз, реакций на действия игрока, окружения, слабостей,
   сопротивлений, редкого лута и истории. И чтобы после победы мир отозвался.

   У шести мировых боссов это было. У стражей двадцать пятого, пятидесятого,
   семьдесят пятого яруса и дна — нет: только имя, здоровье и удар покрепче.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Четыре владыки, у каждого все девять и своя живая запись на каждый
      из пяти звуков.
   2. Владыка встаёт ровно на своих ярусах, на соседних — обычный страж.
   3. Крупный страж — настоящий босс: у него есть boss-описатель, история
      и стиль; у обычного их нет.
   4. ОДИН ОБРАБОТЧИК НА ВСЕХ: bossDef читает оба справочника, и боссовая
      машина находит владыку так же, как мирового босса.
   5. Фазы переключаются по здоровью, и у каждой свои слова.
   6. Слабости и сопротивления применяются, и по-разному у разных владык.
   7. Механика фазы работает: вполсилы, «магия не берёт», «без бегства».
   8. Победа отдаёт редкий припас и отзывается в мире.
   9. Самопроверка мира держит строку «guards»; руководство, README и docs
      рассказывают о четырёх владыках.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(r);return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>({
  сколько:GUARD_LORDS.length,
  имена:GUARD_LORDS.map(l=>l.n),
  стили:GUARD_LORDS.map(l=>l.стиль),
  девять:GUARD_LORDS.every(l=>l.n&&l.род&&l.история&&l.стиль&&l.припас&&l.откликСлова
    &&l.фазы.length===3&&l.отклик&&l.земля&&l.земля.победа&&l.земля.поражение),
  записи:GUARD_LORDS.every(l=>["дальний","ближний","голос","фаза","смерть"]
    .every(k=>SOUND_BANK[l.звуки[k]])),
  своихГолосов:new Set(GUARD_LORDS.map(l=>l.звуки.голос)).size,
  фазыСоСловами:GUARD_LORDS.every(l=>l.фазы.every(f=>f.n&&f.о&&f.множ>0)),
  историйРазных:new Set(GUARD_LORDS.map(l=>l.история)).size}));
 check('четыре владыки ярусов, и у каждого все девять: имя, история, стиль, фазы, отклики, припас и отзыв мира',
  состав.сколько===4&&состав.девять&&состав.фазыСоСловами,состав);
 check('у каждого пять своих настоящих записей, и голоса у четверых разные',
  состав.записи&&состав.своихГолосов===4,состав);
 check('стили боя разные: натиск, измор, чары, хитрость',
  new Set(состав.стили).size===4,состав.стили);
 check('история у каждого своя, а не общая отписка',состав.историйРазных===4);

 /* ── 2. где они стоят ── */
 const ярусы=await page.evaluate(()=>{
  const пары=[25,50,75,100,24,26,49,51,99,1,10].map(d=>[d,(guardLordFor(d)||{}).id||null]);
  return {пары,дно:MAX_DEPTH};});
 check('владыка встаёт ровно на двадцать пятом, пятидесятом, семьдесят пятом и на дне',
  ярусы.пары.filter(([d,id])=>id).map(([d])=>d).join(",")==="25,50,75,100",ярусы.пары);
 check('на соседних ярусах крупного стража нет',
  ярусы.пары.filter(([d])=>[24,26,49,51,99,1,10].indexOf(d)>=0).every(([,id])=>id===null),
  ярусы.пары);

 /* ── 3. страж получает лицо ── */
 const стражи=await page.evaluate(()=>{
  const g25=guardianAt(1200,1200,25),g50=guardianAt(1200,1200,50),g10=guardianAt(1200,1200,10);
  const снять=g=>g?{босс:!!g.boss,владыка:g.владыка||null,стиль:g.стиль||null,
   история:!!g.история,имя:String(g.n).slice(0,70),голос:g.snd||null}:null;
  return {g25:снять(g25),g50:снять(g50),g10:снять(g10)};});
 check('крупный страж — настоящий босс: у него описатель, владыка, стиль, история и голос',
  стражи.g25.босс&&стражи.g25.владыка==="gl_watch"&&стражи.g25.стиль&&стражи.g25.история
  &&стражи.g50.владыка==="gl_keeper",стражи);
 check('имя крупного стража начинается с имени владыки',
  /^Дозорный Порога/.test(стражи.g25.имя)&&/^Хранитель Свода/.test(стражи.g50.имя),
  {g25:стражи.g25.имя,g50:стражи.g50.имя});
 check('обычный страж остался обычным: ни описателя, ни стиля, ни истории',
  !стражи.g10.босс&&!стражи.g10.стиль&&!стражи.g10.история,стражи.g10);

 /* ── 4. один обработчик на всех ── */
 const общий=await page.evaluate(()=>({
  естьBossDef:typeof bossDef==="function",
  находитВладык:GUARD_LORDS.every(l=>bossDef(l.id)===l),
  находитМировых:WORLD_BOSSES.every(b=>bossDef(b.id)===b),
  чужогоНет:bossDef("нет_такого")===null,
  /* Все шесть функций боссовой машины должны ходить через bossDef. */
  черезBossDef:["bossPhaseOf","bossPhaseCheck","bossDamageK","bossVictory","bossDefeat"]
   .filter(n=>{try{return String(eval(n)).indexOf("BOSS_BY_ID[")>=0;}catch(_){return false;}})}));
 check('bossDef находит и мировых боссов, и владык ярусов, и не выдумывает чужих',
  общий.естьBossDef&&общий.находитВладык&&общий.находитМировых&&общий.чужогоНет,общий);
 check('боссовая машина ходит через общий справочник, а не мимо него',
  общий.черезBossDef.length===0,общий.черезBossDef);

 /* ── 5, 6, 7. фазы, отклики, механика ── */
 const бой=await page.evaluate(()=>{
  const о={};
  const g=guardianAt(1200,1200,25);
  G.inCombat=true;G.combat={m:g,hp:g.hp};
  о.фаза1=g.boss.phase;
  о.слова1=(bossPhaseOf(g)||{}).n;
  G.combat.hp=Math.round(g.hp*0.5);safeFn(()=>bossPhaseCheck());
  о.фаза2=G.combat.m.boss.phase;о.слова2=(bossPhaseOf(G.combat.m)||{}).n;
  G.combat.hp=Math.round(g.hp*0.1);safeFn(()=>bossPhaseCheck());
  о.фаза3=G.combat.m.boss.phase;о.слова3=(bossPhaseOf(G.combat.m)||{}).n;
  о.дозорСвет=safeFn(()=>bossDamageK("spell","light"),1);
  о.дозорТьма=safeFn(()=>bossDamageK("spell","dark"),1);
  G.inCombat=false;G.combat=null;
  /* Другой владыка — другие слабости. */
  const k=guardianAt(1200,1200,50);
  G.inCombat=true;G.combat={m:k,hp:k.hp};
  о.хранительВода=safeFn(()=>bossDamageK("spell","water"),1);
  о.хранительЗемля=safeFn(()=>bossDamageK("spell","earth"),1);
  /* Механика второй фазы Хранителя: клинок берёт вполсилы. */
  G.combat.hp=Math.round(k.hp*0.5);safeFn(()=>bossPhaseCheck());
  о.клинокВполсилы=safeFn(()=>bossDamageK("atk"),1);
  /* Механика последней фазы Древнего: бежать некуда. */
  const a=guardianAt(1200,1200,MAX_DEPTH);
  G.combat={m:a,hp:Math.round(a.hp*0.1)};safeFn(()=>bossPhaseCheck());
  о.безБегства=(bossPhaseOf(G.combat.m)||{}).механика;
  G.inCombat=false;G.combat=null;
  return о;});
 check('фазы переключаются по здоровью, и у каждой свои слова',
  бой.фаза1===1&&бой.фаза2===2&&бой.фаза3===3
  &&бой.слова1&&бой.слова2&&бой.слова3
  &&new Set([бой.слова1,бой.слова2,бой.слова3]).size===3,бой);
 check('слабости и сопротивления работают, и у разных владык они разные',
  бой.дозорСвет>1&&бой.дозорТьма<1&&бой.хранительВода>1&&бой.хранительЗемля<1,бой);
 check('механика фазы работает: у Хранителя клинок берёт вполсилы, у Древнего бежать некуда',
  бой.клинокВполсилы<1&&бой.безБегства==="без бегства",бой);

 /* ── 8. победа ── */
 const победа=await page.evaluate(()=>{
  const g=guardianAt(1200,1200,50);
  G.inv=G.inv||{};const было=Number(G.inv[GUARD_LORD_BY_ID.gl_keeper.припас])||0;
  G.bosses={};G.titles=[];
  __said.length=0;__played.length=0;
  G.inCombat=true;G.combat={m:g,hp:0};
  safeFn(()=>bossVictory(g));
  const стало=Number(G.inv[GUARD_LORD_BY_ID.gl_keeper.припас])||0;
  G.inCombat=false;G.combat=null;
  return {припасДо:было,припасПосле:стало,
   отмечен:!!(G.bosses&&G.bosses.gl_keeper),
   сказано:__said.join(" ").slice(0,140),
   звучало:__played.length>0,
   мир:/свод осел|обвалов/i.test(__said.join(" "))};});
 check('победа над владыкой отдаёт его редкий припас и отмечает его павшим',
  победа.припасПосле>победа.припасДо&&победа.отмечен,победа);
 check('после победы мир отзывается словами, и это слышно',
  победа.мир&&победа.звучало,победа);

 /* ── 9. самопроверка и тексты ── */
 const свод=await page.evaluate(()=>{const r=worldSelfCheck();
  const гл=GUIDE.find(g=>/Владыки ярусов/i.test(g.title));
  return {g:r.find(x=>x.id==="guards"),плохие:r.filter(x=>!x.ok).map(x=>x.id),
   глава:!!гл,строк:гл?гл.body.length:0,
   текст:safeFn(()=>Guards.text(50),"").slice(0,120),
   текстПустого:safeFn(()=>Guards.text(10),"").slice(0,80)};});
 check('самопроверка мира держит зелёную строку «guards»',
  !!свод.g&&свод.g.ok===true,свод.g);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('модуль называет владыку яруса, а на обычном честно говорит, что его нет',
  /Хранитель Свода/.test(свод.текст)&&/крупного стража здесь нет/.test(свод.текстПустого),свод);
 check('в руководстве есть глава о владыках ярусов',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о четырёх владыках и о том, что обработчик общий',
  /Владыки ярусов/i.test(readme)&&/Дозорный Порога/.test(readme)
  &&/тем же\s+обработчиком/i.test(readme));
 check('docs/МИР.md держит таблицу владык и правило одного справочника',
  /GUARD_LORDS/.test(mir)&&/bossDef/.test(mir)&&/guardLordFor/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
