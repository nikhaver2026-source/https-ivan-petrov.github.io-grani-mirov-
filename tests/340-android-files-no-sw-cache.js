/* ═══════════════════════════════════════════════════════════════════════
   340 — приложение Android: файлы на телефон и никакого лишнего кэша (17.0).
   1. В приложении (есть мост GraniTTS.saveDownload) «Сохранить в файл» отдаёт
      сохранение игры мосту — имя gran-mirov-day…-lvl….json, тип JSON, весь
      текст сохранения, — а не ссылке blob:, которую WebView молча пропускал.
   2. Журнал речи и звука тоже уходит мостом (.txt).
   3. Мост не смог записать — игра говорит об этом, а не молчит.
   4. В браузере (моста нет) скачивание идёт как прежде — обычным файлом.
   5. На адресе приложения (appassets.androidplatform.net) служебный работник
      не ставится, а прежний кэш записей удаляется: записи лежат в APK, и
      вторая копия в данных приложения отнимала бы гигабайты.
   6. На сайте работник ставится, как прежде.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
const URL0=process.argv[2];
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const войти=async p=>{await p.waitForTimeout(1000);
  await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
   window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return s0(t,o);};});};

 /* ── 1–3: приложение (мост с saveDownload) ── */
 {const ctx=await browser.newContext({acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  let скачано=0;p.on('download',()=>скачано++);
  await p.addInitScript(()=>{window.__saved=[];window.__ok=true;
   window.GraniTTS={saveDownload(n,m,t){window.__saved.push({n,m,t});return window.__ok;}};});
  await p.goto(URL0);await войти(p);
  await p.evaluate(()=>exportSaveFile());await p.waitForTimeout(800);
  const п1=await p.evaluate(()=>{const z=__saved[0]||{};let ok=false;try{ok=!!JSON.parse(z.t);}catch(_){}
   let тот=false;try{тот=typeof z.t==="string"&&z.t.slice(0,40)===serializeSave().slice(0,40)&&"hp" in JSON.parse(z.t);}catch(_){}
   return {n:z.n,m:z.m,длина:(z.t||"").length,сохранение:ok,тот,сказано:__said.join(" | ")};});
  check('1. приложение: «Сохранить в файл» отдаёт сохранение мосту в «Загрузки» — имя, JSON, весь текст',
   /^gran-mirov-day\d+-lvl\d+\.json$/.test(п1.n||"")&&/application\/json/.test(п1.m||"")&&п1.сохранение&&п1.тот&&п1.длина>1000&&скачано===0&&/папке загрузок/.test(п1.сказано),{...п1,скачано});
  const п2=await p.evaluate(async()=>{__saved.length=0;
   const blob=new Blob(["журнал: проба"],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download="grani-zhurnal-rechi-i-zvuka-1.txt";document.body.appendChild(a);a.click();
   await new Promise(r=>setTimeout(r,600));return __saved.map(z=>({n:z.n,m:z.m,t:z.t}));});
  check('2. журнал речи и звука — тоже мостом, текстом',п2.length===1&&п2[0].n==="grani-zhurnal-rechi-i-zvuka-1.txt"&&/^text\/plain/.test(п2[0].m)&&п2[0].t==="журнал: проба"&&скачано===0,п2);
  const п3=await p.evaluate(async()=>{__ok=false;__said.length=0;exportSaveFile();await new Promise(r=>setTimeout(r,800));return __said.join(" | ");});
  check('3. мост не записал — игра говорит, что записать не удалось',/записать не удалось/.test(п3),п3);
  await ctx.close();}

 /* ── 4: браузер — скачивание как прежде ── */
 {const ctx=await browser.newContext({acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(URL0);await войти(p);
  const ждём=p.waitForEvent('download',{timeout:8000}).catch(()=>null);
  await p.evaluate(()=>exportSaveFile());const d=await ждём;
  check('4. браузер: сохранение скачивается файлом, как прежде',!!d&&/^gran-mirov-day\d+-lvl\d+\.json$/.test(d.suggestedFilename()),d&&d.suggestedFilename());
  await ctx.close();}

 /* ── 5: адрес приложения — без работника, прежний кэш удалён ── */
 {const base=URL0.replace(/index\.html.*$/,"");
  const ctx=await browser.newContext();const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('https://appassets.androidplatform.net/**',async r=>{
   const u=new URL(r.request().url());let rel=u.pathname.replace(/^\/assets\/www\//,"");if(u.pathname==="/kesh.html")rel="__kesh";
   if(rel==="__kesh"){await r.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>k</title>"});return;}
   try{const res=await ctx.request.get(base+rel);await r.fulfill({status:res.status(),headers:res.headers(),body:await res.body()});}
   catch(_){await r.fulfill({status:404,body:""});}});
  /* прежний кэш записей, как его оставил бы работник */
  await p.goto('https://appassets.androidplatform.net/kesh.html');
  const было=await p.evaluate(async()=>{const c=await caches.open("grani-v1-media");await c.put("/assets/www/sounds/x.flac",new Response("x"));return (await caches.keys()).length;});
  await p.addInitScript(()=>{window.__reg=0;try{const r0=ServiceWorkerContainer.prototype.register;
   ServiceWorkerContainer.prototype.register=function(){window.__reg++;return r0.apply(this,arguments);};}catch(_){}});
  await p.goto('https://appassets.androidplatform.net/assets/www/index.html');await p.waitForTimeout(2500);
  const п5=await p.evaluate(async()=>({рег:window.__reg,кэши:await caches.keys(),игра:typeof enterGame}));
  check('5. в приложении работник не ставится, прежний кэш записей удалён',было===1&&п5.рег===0&&п5.кэши.length===0&&п5.игра==="function",{было,...п5});
  await ctx.close();}

 /* ── 6: сайт — работник ставится ── */
 {const ctx=await browser.newContext();const p=await ctx.newPage();
  await p.addInitScript(()=>{window.__reg=0;try{const r0=ServiceWorkerContainer.prototype.register;
   ServiceWorkerContainer.prototype.register=function(){window.__reg++;return r0.apply(this,arguments);};}catch(_){}});
  await p.goto(URL0);await p.waitForTimeout(2000);
  const рег=await p.evaluate(()=>window.__reg);
  check('6. на сайте работник ставится, как прежде',рег===1,рег);
  await ctx.close();}

 check('7. без ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
