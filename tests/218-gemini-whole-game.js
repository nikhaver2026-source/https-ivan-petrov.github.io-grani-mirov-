/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 218: 4.8 — ВСЯ ИГРА ГОЛОСОМ GEMINI

   Просьба игрока: чтобы вся игра была озвучена голосом Gemini.

   1. Незаписанное предложение делится по двоеточию и тире: записанная часть
      звучит записью, синтезатор договаривает только остальное.
   2. Обе описи (мужской Iapetus и женский Callirrhoe) выросли: в каждой не
      меньше 5500 фраз (было 4995 и 4932), у каждой фразы свой файл.
   3. Окно настроек и меню действий звучат голосом Gemini не меньше чем на
      девять десятых текста — у обоих голосов (числа — «100%» ползунка —
      договаривает синтезатор, они не в счёт).
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');
const опись=(dir,re)=>{const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const f=(html.match(re)||[])[1];
 const t=fs.readFileSync(path.join(ROOT,'sounds',dir,f),'utf8');return {f,p:JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1)).p};};
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  settings.gvVoice="f";Speech.gvLoad();settings.gvVoice="m";Speech.gvLoad();
  for(let i=0;i<60&&!(Speech.GVOICES.m.map&&Speech.GVOICES.f.map);i++)await new Promise(z=>setTimeout(z,100));});

 /* ── 1 ── */
 const части=await page.evaluate(()=>{
  const g=Speech.GVOICES.m;const ключи=Object.keys(g.map);
  const метка=ключи.find(k=>/^[а-я]+$/.test(k)&&k.length>4)||"погода";
  const т=метка[0].toUpperCase()+метка.slice(1)+": Кирзамбарская пустошь 17.";
  settings.gvVoice="m";const p=Speech.gvParts(т);
  const т2="Общая громкость — 100%";
  return {т,p:p.map(x=>({t:x.t,rec:!!x.url})),т2,p2:Speech.gvParts(т2).map(x=>({t:x.t,rec:!!x.url}))};});
 check('1. «Метка: имя» — метка звучит записью, остальное договаривает синтезатор',
  части.p.length===2&&части.p[0].rec&&!части.p[1].rec,части);

 /* ── 2 ── */
 const m=опись('gvoice',/url:"sounds\/gvoice\/(bank_\d+\.js)"/),f=опись('gvoice_f',/url:"sounds\/gvoice_f\/(bank_f\d+\.js)"/);
 const безФайла=(d,o)=>Object.values(o.p).filter(id=>!fs.existsSync(path.join(ROOT,'sounds',d,id+'.flac')));
 const н={m:Object.keys(m.p).length,f:Object.keys(f.p).length,безФайлаM:безФайла('gvoice',m).length,безФайлаF:безФайла('gvoice_f',f).length};
 check('2. обе описи выросли: не меньше 5450 фраз у каждого голоса, у каждой свой файл',н.m>=5450&&н.f>=5450&&!н.безФайлаM&&!н.безФайлаF,н);

 /* ── 3 ── */
 const доля=await page.evaluate(async()=>{
  const тексты=[];const взять=()=>{const lay=navLayer()||document;visibleInteractive(lay).forEach(el=>{const t=el.dataset.speak||el.getAttribute('aria-label')||labelTextOf(el)||(el.textContent||'').trim();if(t)тексты.push(t);});};
  while(activeLayer())closeTopUI();CMD.settings();await new Promise(z=>setTimeout(z,300));взять();
  for(const g of SET_GROUPS){try{setGroupOpen(g.id);}catch(_){}await new Promise(z=>setTimeout(z,120));взять();}
  while(activeLayer())closeTopUI();openActionMenu();await new Promise(z=>setTimeout(z,200));взять();
  while(activeLayer())closeTopUI();
  const out={};
  for(const v of ["m","f"]){settings.gvVoice=v;let все=0,зап=0;const мимо=[];
   тексты.forEach(t=>{const ч=Speech.gvParts(t);ч.forEach(x=>{if(!/[а-яё]/i.test(x.t))return;все+=x.t.length;if(x.url)зап+=x.t.length;else if(мимо.length<12)мимо.push(x.t);});});
   out[v]={доля:Math.round(зап/Math.max(1,все)*1000)/10,мимо};}
  settings.gvVoice="m";return {пунктов:тексты.length,...out};});
 check('3. настройки и меню звучат голосом Gemini не меньше чем на 90 % текста — у обоих голосов',
  доля.пунктов>50&&доля.m.доля>=90&&доля.f.доля>=90,доля);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
