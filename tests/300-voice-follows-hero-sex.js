/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 300: ГОЛОС ИГРЫ — ПО ПОЛУ ГЕРОЯ

   Просьба игрока: «выбрал женский пол героя — значит, и голос Gemini
   женский: все реплики, разговоры с торговцами и прочее».
   1. Пока героя не собирали, голос игры прежний (мужской по умолчанию).
   2. Выбран женский пол — голос игры женский, и слово о выборе звучит уже
      им; выбран мужской — мужской.
   3. «Готово»: голос остаётся по полу героини.
   4. Голос, выбранный игроком в настройках, пол героя больше не меняет.
   5. Загрузка сохранения с героиней — женский голос; выбор игрока
      сохраняется и при загрузке.
   6. Голос героини в разговоре — её собственный, из женских голосов героя.
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 const r=await p.evaluate(()=>{const r={};
  settings.gvVoice="m";delete settings.gvVoiceManual;
  G.hero=null;const h=heroEnsure();h.made=0;h.пол="м";
  r.доСборки=settings.gvVoice;
  /* 2. пол в окне героя */
  heroSet("sex","ж");r.женский=settings.gvVoice;r.главный=Speech.gvMain()===Speech.GVOICES.f;r.голосГероини=G.hero.voice;
  r.ходГероини=heroVoicePath("torg");
  heroSet("sex","м");r.мужской=settings.gvVoice;
  heroSet("sex","ж");
  /* 3. «Готово» */
  heroDone();r.готово=settings.gvVoice;r.собран=!!G.hero.made;
  /* 4. выбор игрока в настройках */
  const sel=document.getElementById("setGvVoice");sel.value="m";sel.dispatchEvent(new Event("change",{bubbles:true}));
  r.выбор=settings.gvVoice;r.сам=!!settings.gvVoiceManual;
  G.hero.made=0;heroSet("sex","ж");r.послеВыбора=settings.gvVoice;
  /* 5. загрузка */
  delete settings.gvVoiceManual;settings.gvVoice="m";G.hero.пол="ж";G.hero.voice="kore";G.hero.made=1;
  saveGame(true);settings.gvVoice="m";const raw=store.get(SAVE_KEY);applySave(raw,"набор 300");r.загрузка=settings.gvVoice;
  settings.gvVoiceManual=1;settings.gvVoice="m";applySave(raw,"набор 300");r.загрузкаВыбор=settings.gvVoice;
  return r;});
 check('1. пока героя не собирали, голос игры прежний',r.доСборки==="m",r);
 check('2. выбран женский пол — голос игры женский (им и звучит слово о выборе); мужской — мужской',r.женский==="f"&&r.главный&&r.мужской==="m",r);
 check('3. «Готово»: голос по полу героини',r.готово==="f"&&r.собран,r);
 check('4. голос, выбранный в настройках, пол героя не меняет',r.выбор==="m"&&r.сам&&r.послеВыбора==="m",r);
 check('5. загрузка: героиня — женский голос; выбор игрока сохраняется',r.загрузка==="f"&&r.загрузкаВыбор==="m",r);
 check('6. реплика героини в разговоре — её собственным женским голосом',HERO_F.includes(r.голосГероини)&&/^hero_torg_/.test(r.ходГероини||""),r);
 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
const HERO_F=["kore","aoede","autonoe","vindemiatrix","pulcherrima","laomedeia"];
