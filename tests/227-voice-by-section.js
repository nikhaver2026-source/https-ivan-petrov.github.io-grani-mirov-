/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 227: ОДИН ГОЛОС НА ВСЁ, ВЕСТНИК — ДРУГИМ; «ПО РАЗДЕЛАМ» — ПО ВЫБОРУ

   Просьба игрока (8.0): вся игра, настройки, меню, здоровье — одним голосом
   Gemini, а достижения и события — другим. «По разделам» остаётся выбором.
   1. По умолчанию — «Мужской: вся игра…; достижения и события — женским»;
      в «Выборе голоса» есть и женский, и «По разделам».
   2. В настройках звучит голос настроек (Callirrhoe), в игре — голос игры
      (Iapetus): одна и та же фраза берётся из разных описей.
   3. Главное меню, «Настройки персонажа» и меню действий — раздел «меню»;
      пока опись голоса меню не записана, меню говорит голосом настроек.
   4. «Женский везде» и «Мужской везде» по-прежнему дают один голос на всё.
   5. Прежний выбор «по разделам» (и старый мужской по умолчанию) переходит
      на мужской один раз, выбравший женский — остаётся при нём.
   6. Достижения и события звучат вестником — вторым голосом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
const w=ms=>new Promise(z=>setTimeout(z,ms));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);

 /* ── 1. Выбор по умолчанию ── */
 const в=await page.evaluate(()=>({gv:settings.gvVoice,опции:[...document.querySelectorAll('#setGvVoice option')].map(o=>o.value+":"+o.textContent)}));
 check('1. «По разделам» — выбор по умолчанию и пункт в «Выборе голоса»',
  в.gv==="m"&&в.опции.length===3&&/^m:Мужской: вся игра/.test(в.опции[0])&&в.опции.some(o=>/^z:По разделам/.test(o))&&в.опции.some(o=>/^f:Женский/.test(o)),в);

 /* ── 2–3. Разделы ── */
 const р=await page.evaluate(async()=>{settings.gvVoice="z";Speech.gvLoad();for(let i=0;i<60&&(Speech.GVOICES.m.state!=="ready"||Speech.GVOICES.f.state!=="ready");i++)await new Promise(z=>setTimeout(z,100));
  const снимок=()=>({раздел:Speech.gvSection(),опись:Speech.GVOICE.glob,клип:Speech.gvClip("Настройки")});
  const out={титул:снимок()};
  CMD.settings();await new Promise(z=>setTimeout(z,200));out.настройки=снимок();
  while(activeLayer())closeTopUI();
  try{openHeroSetup();}catch(_){}await new Promise(z=>setTimeout(z,200));out.герой=снимок();
  while(activeLayer())closeTopUI();
  try{enterGame();}catch(_){}while(activeLayer())closeTopUI();out.игра=снимок();
  try{openActionMenu();}catch(_){}await new Promise(z=>setTimeout(z,150));out.меню=снимок();
  while(activeLayer())closeTopUI();
  out.menuOn=GV_MENU_ON;return out;});
 check('2. настройки — голос настроек (Callirrhoe), игра — голос игры (Iapetus), одна фраза из разных описей',
  р.настройки.раздел==="set"&&р.настройки.опись==="GVOICE_BANK_F"&&р.игра.раздел==="game"&&р.игра.опись==="GVOICE_BANK"
  &&/gvoice_f\//.test(р.настройки.клип||"")&&/gvoice\//.test(р.игра.клип||""),р);
 check('3. главное меню, «Настройки персонажа» и меню действий — раздел «меню»; без описи меню — голосом настроек',
  [р.титул,р.герой,р.меню].every(x=>x.раздел==="menu"&&x.опись===(р.menuOn?"GVOICE_BANK_MENU":"GVOICE_BANK_F")),{титул:р.титул,герой:р.герой,меню:р.меню});

 /* ── 4. Один голос на всё ── */
 const о=await page.evaluate(()=>{const out={};
  for(const v of ["f","m"]){settings.gvVoice=v;out[v]=[Speech.GVOICE.glob];CMD.settings();out[v].push(Speech.GVOICE.glob);while(activeLayer())closeTopUI();}
  settings.gvVoice="z";return out;});
 check('4. «Женский везде» и «Мужской везде» — один голос во всех разделах',
  о.f.every(g=>g==="GVOICE_BANK_F")&&о.m.every(g=>g==="GVOICE_BANK"),о);

 /* ── 5. Перенос прежнего выбора ── */
 const п={};
 for(const [было,надо] of [["m","m"],["f","f"],["z","m"]]){
  const c2=await browser.newContext();const p2=await c2.newPage();
  await p2.goto(process.argv[2]);await p2.waitForTimeout(600);
  const ключ=await p2.evaluate(()=>{for(const k of Object.keys(localStorage)){try{const j=JSON.parse(localStorage.getItem(k));if(j&&typeof j==="object"&&"gvVoice" in j)return k;}catch(_){}}return null;});
  await p2.evaluate(([k,v])=>{const j=JSON.parse(localStorage.getItem(k));j.gvVoice=v;delete j.gvZ;delete j.gvOne;localStorage.setItem(k,JSON.stringify(j));},[ключ,было]);
  await p2.reload();await p2.waitForTimeout(800);
  п[было]=await p2.evaluate(()=>settings.gvVoice);п[было+"_ok"]=п[было]===надо;
  await c2.close();}
 check('5. прежний выбор «по разделам» и мужской переходят на мужской, женский остаётся',п.m_ok&&п.f_ok&&п.z_ok,п);

 /* ── 6. Вестник: достижения и события — вторым голосом ── */
 const в6=await page.evaluate(()=>{const out={};const был=Speech.current;
  for(const v of ["m","f"]){settings.gvVoice=v;
   Speech.current={cat:"achieve",herald:true};const a=Speech.GVOICE.glob;
   Speech.current={cat:"event"};const e=Speech.GVOICE.glob;
   Speech.current={cat:"ui"};const u=Speech.GVOICE.glob;
   out[v]={достижение:a,событие:e,меню:u,класс:Speech._classify("Мировое событие: засуха. Продлится три дня.",{}).cat};}
  Speech.current=был;settings.gvVoice="m";return out;});
 check('6. достижения и события — вестником (вторым голосом), всё прочее — основным',
  в6.m.достижение==="GVOICE_BANK_F"&&в6.m.событие==="GVOICE_BANK_F"&&в6.m.меню==="GVOICE_BANK"
  &&в6.f.достижение==="GVOICE_BANK"&&в6.f.событие==="GVOICE_BANK"&&в6.f.меню==="GVOICE_BANK_F"&&в6.m.класс==="event",в6);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
