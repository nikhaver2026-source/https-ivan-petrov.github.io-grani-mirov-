/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 294: 14.5 — ДОЛГИЙ ПРОГОН И СТАРЫЕ СОХРАНЕНИЯ
   (ФАЗА X «БЕСКОНЕЧНОЙ ХРОНИКИ»: ТЕСТИРОВАНИЕ И СТАБИЛИЗАЦИЯ)
   Мастер-промпт, X: модульные, интеграционные, нагрузочные тесты,
   проверка сохранений и совместимости; 18: создание и загрузка новых
   сущностей, сохранение последствий, отсутствие дублирования
   обработчиков; «миграция старых сохранений».
    1. Сохранение 14.0 (без престолов, магии Грани, живых городов, сюжетов
       и проверки Режиссёра) загружается: всё новое достраивается само,
       окна открываются, сохранение снова пишется.
    2. Год мира (триста шестьдесят дней всех систем): быстро, без ошибок,
       записи всех модулей ограничены, сохранение не разбухает.
    3. Все окна хроники открываются подряд и закрываются; ни один пункт
       меню хроники не молчит.
    4. Ни один такт дня не подключён дважды: один день — одна смена
       дня каждого модуля.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};});

 /* ── 1. сохранение 14.0 ── */
 const ст=await p.evaluate(()=>{const r={};saveGame(true);const raw=localStorage.getItem(SAVE_KEY);const j=JSON.parse(raw);
  const новые=["thr","mag","lc","tales","dchk","mater"];const удалено=новые.filter(k=>k in j);новые.forEach(k=>{delete j[k];});
  localStorage.setItem(SAVE_KEY,JSON.stringify(j));r.удалено=удалено;
  ["thr","mag","lc","tales","dchk"].forEach(k=>{delete G[k];});const ош0=0;
  loadGame();while(activeLayer())closeTopUI();
  r.престолы=!!safeFn(()=>Throne.ruler(0),null);r.магия=!!safeFn(()=>Magia.st(),null)&&Array.isArray(G.mag.пр);
  r.города=!!safeFn(()=>LiveCity.st(),null);r.сюжеты=Array.isArray(safeFn(()=>Tales.st().list,null));r.проверка=Number.isFinite(safeFn(()=>DirCheck.st().ок,NaN));
  const окна=[()=>Throne.home(),()=>Magia.home(),()=>Magia.legendsHome(),()=>LiveCity.home(),()=>Tales.home()];let открыто=0;
  for(const f of окна){try{f();открыто++;}catch(e){}while(activeLayer())closeTopUI();}r.окна=открыто;
  saveGame(true);r.пишется=/"mag"/.test(localStorage.getItem(SAVE_KEY)||"")&&/"lc"/.test(localStorage.getItem(SAVE_KEY)||"");
  return r;});
 check('1. сохранение 14.0 загружается: престолы, магия, живые города, сюжеты и проверка Режиссёра достраиваются сами, окна открываются, сохранение пишется',
  ст.престолы&&ст.магия&&ст.города&&ст.сюжеты&&ст.проверка&&ст.окна===5&&ст.пишется,ст);

 /* ── 4 (раньше года): один день — одна смена дня каждого модуля ── */
 const тк=await p.evaluate(()=>{const r={};const сч={};const обёрнуть=(имя,o,f)=>{const old=o[f].bind(o);o[f]=function(){сч[имя]=(сч[имя]||0)+1;return old.apply(this,arguments);};};
  обёрнуть("престолы",Throne,"tick");обёрнуть("магия",Magia,"tick");обёрнуть("сюжеты",Tales,"tick");обёрнуть("проверка",DirCheck,"audit");
  G.day=(Number(G.day)||1)+1;Director.worldDay();r.счёт=сч;return r;});
 check('4. один день мира — ровно одна смена дня у престолов, магии, сюжетов и проверки Режиссёра: обработчики не подключены дважды',
  тк.счёт.престолы===1&&тк.счёт.магия===1&&тк.счёт.сюжеты===1&&тк.счёт.проверка===1,тк);

 /* ── 2. год мира ── */
 const год=await p.evaluate(()=>{const r={};saveGame(true);const до=(localStorage.getItem(SAVE_KEY)||"").length;const ош0=0;
  const t0=performance.now();let сбоев=0;
  for(let k=0;k<360;k++){G.day=(Number(G.day)||1)+1;try{Director.worldDay();}catch(e){сбоев++;}}
  r.мс=Math.round(performance.now()-t0);r.сбоев=сбоев;
  saveGame(true);const после=(localStorage.getItem(SAVE_KEY)||"").length;r.кб=[Math.round(до/1024),Math.round(после/1024)];
  r.сюжетов=Tales.st().list.length;r.молвы=(G.rumors||[]).length;r.отказов=DirCheck.st().отказ.length;r.вестейДвора=(Throne.st().ev||[]).length;
  r.порчи=(G.mag&&G.mag.пр||[]).length;r.придумано=Object.values(Neuro.gen()).filter(Array.isArray).reduce((a,x)=>a+x.length,0);
  r.пределы=Object.entries(DCHK_LIMIT).filter(([k,v])=>(Neuro.gen()[k]||[]).length>v).map(([k])=>k);
  return r;});
 check('2. год мира без сбоев и быстро; записи модулей ограничены; сохранение растёт умеренно',
  год.сбоев===0&&год.мс<120000&&год.сюжетов<=30&&год.молвы<=60&&год.отказов<=40&&год.вестейДвора<=30&&год.пределы.length===0&&(год.кб[1]-год.кб[0])<400,год);

 /* ── 3. окна и пункты меню хроники ── */
 const мн=await p.evaluate(()=>{const r={};const пункты=["mater","thrones","rites","legends","livecity","tales"];const молчат=[];
  for(const c of пункты){if(typeof CMD[c]!=="function"){молчат.push(c+":нет");continue;}SAID.length=0;let открыл=false;
   try{const до=activeLayer();CMD[c]();открыл=!!activeLayer()&&activeLayer()!==до;}catch(e){молчат.push(c+":"+String(e).slice(0,40));}
   if(!открыл&&!SAID.length)молчат.push(c);while(activeLayer())closeTopUI();}
  r.молчат=молчат;r.пунктов=пункты.length;return r;});
 check('3. все окна хроники открываются подряд и закрываются; ни один пункт меню хроники не молчит',мн.молчат.length===0,мн);
 check('ошибок страницы нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИтого: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
