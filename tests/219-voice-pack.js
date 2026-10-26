/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 219: ГОЛОСОВОЙ ПАКЕТ GEMINI — ВНУТРИ ИГРЫ (с 26 октября без установки отдельным файлом)

   Всё, что Gemini прочёл сверх описей сборки, лежит в sounds/gvoice_pack — в самой игре (полный APK, полная
   сборка для Windows, сайт). Правило сборок: игрок ничего не скачивает и не ставит отдельно.

   1. Пакет подключается сам: обе описи (мужская и женская) грузятся, в каждой
      не меньше пятисот фраз (в 4.9 пункты настроек переехали в сборку), у каждой фразы файл; с описями сборок пакет не
      пересекается.
   2. Фраза из пакета звучит записью пакета, фраза из сборки — записью сборки.
   3. (26 октября) Отдельного пакета больше нет: в «Синтезаторе» нет кнопки и строки о пакете, нет команды
      установки и отклика приложения, руководство не зовёт его скачивать.
   4. Приложение для Windows не ставит и не докачивает пакет — записи отдаются из папки игры.
   5. Пакет — в полном APK и в полной сборке для Windows; отдельного выпуска пакета нет; Android не ставит
      пакет из файла, но убирает поставленный когда-то.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');
const опись=f=>{const t=fs.readFileSync(f,'utf8');return JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));};
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const P={m:опись(path.join(ROOT,'sounds/gvoice_pack/m/bank.js')),f:опись(path.join(ROOT,'sounds/gvoice_pack/f/bank.js'))};
 const B={m:опись(path.join(ROOT,'sounds/gvoice',html.match(/url:"sounds\/gvoice\/(bank_\d+\.js)"/)[1])).p,
  f:опись(path.join(ROOT,'sounds/gvoice_f',html.match(/url:"sounds\/gvoice_f\/(bank_f\d+\.js)"/)[1])).p};
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 const загрузка=await page.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  for(const v of ["m","f"]){settings.gvVoice=v;Speech.gvLoad();}settings.gvVoice="m";
  /* ждём и описи сборки: с 17 октября опись сборки (21 тыс. фраз) догружается позже пакета */
  for(let i=0;i<80&&!(Speech.GVOICES.m.pack.state==="ready"&&Speech.GVOICES.f.pack.state==="ready"&&Speech.GVOICES.m.state==="ready"&&Speech.GVOICES.f.state==="ready");i++)await new Promise(z=>setTimeout(z,100));
  return {m:Speech.GVOICES.m.pack.state,f:Speech.GVOICES.f.pack.state,nm:Speech.GVOICES.m.pack.n,nf:Speech.GVOICES.f.pack.n};});
 const безФайла=v=>Object.values(P[v].p).filter(id=>!fs.existsSync(path.join(ROOT,'sounds/gvoice_pack',v,id+'.flac'))).length;
 const пересеч=v=>Object.keys(P[v].p).filter(k=>k in B[v]).length;
 check('1. обе описи пакета грузятся сами; в каждой ≥500 фраз, у каждой файл, со сборкой не пересекаются',
  загрузка.m==="ready"&&загрузка.f==="ready"&&загрузка.nm>=500&&загрузка.nf>=500&&!безФайла('m')&&!безФайла('f')&&!пересеч('m')&&!пересеч('f'),
  {загрузка,безФайла:[безФайла('m'),безФайла('f')],пересеч:[пересеч('m'),пересеч('f')]});

 /* ── 2 ── */
 const kp=Object.keys(P.m.p)[0],tp=P.m.t[P.m.p[kp]],kb=Object.keys(B.m)[0];
 const клипы=await page.evaluate(([tp,kb])=>{settings.gvVoice="m";return {пакет:Speech.gvClip(tp),сборка:Speech.gvClip(kb)};},[tp,kb]);
 const звучит=await page.evaluate(async url=>new Promise(res=>{const a=new Audio(url);a.oncanplaythrough=()=>res(a.duration>0.2);a.onerror=()=>res(false);a.load();setTimeout(()=>res(false),5000);}),клипы.пакет);
 check('2. фраза пакета звучит записью пакета, фраза сборки — записью сборки',
  /^sounds\/gvoice_pack\/m\/p\d+\.flac$/.test(клипы.пакет||"")&&/^sounds\/gvoice\/gv\d+\.flac$/.test(клипы.сборка||"")&&звучит,{tp,клипы,звучит});

 /* ── 3 ── (26 октября) установка отдельного пакета убрана: всё внутри игры */
 const ui=await page.evaluate(()=>({кнопка:!!document.getElementById("btnGvPack"),строка:!!document.getElementById("gvPackHint"),
  команда:typeof CMD==="object"&&typeof CMD.gvpack,отклик:typeof window.GraniVoicePackDone,стр:typeof window.gvPackUi}));
 const рук=/GraniMirov-voicepack|Установить голосовой пакет|voicepack-latest/.test(html);
 check('3. в «Синтезаторе» нет кнопки и строки о голосовом пакете, нет команды установки и отклика приложения; руководство не зовёт скачивать пакет',
  !ui.кнопка&&!ui.строка&&ui.команда==="undefined"&&ui.отклик==="undefined"&&ui.стр==="undefined"&&!рук,{ui,рук});

 /* ── 4 ── */
 const main=fs.readFileSync(path.join(ROOT,'desktop/main.js'),'utf8'),pre=fs.readFileSync(path.join(ROOT,'desktop/preload.js'),'utf8');
 const vpjs=fs.existsSync(path.join(ROOT,'desktop','voicepack.js'));
 check('4. приложение для Windows не ставит и не докачивает пакет: записи отдаются из папки игры, сети нет',
  !vpjs&&!/voicepack|VoicePack|autoFetch|\bnet\b\s*}\s*=\s*require/.test(main)&&!/installVoicePack|voicePackInfo/.test(pre),{vpjs});

 /* ── 5 ── */
 const wf=f=>fs.readFileSync(path.join(ROOT,'.github/workflows',f),'utf8');
 const java=fs.readFileSync(path.join(ROOT,'android/app/src/main/java/io/github/granimirov/MainActivity.java'),'utf8');
 const win=wf('windows.yml');
 check('5. пакет — в полном APK и в полной сборке для Windows; отдельного выпуска пакета нет; Android не ставит пакет из файла, но убирает прежний',
  /* 14.5: полный APK несёт все записи с пакетом (android/full-apk.py берёт всю папку sounds) */
  /full-apk\.py "\$SMALL" sounds/.test(wf('android.yml'))&&!/gvoice_pack/.test(fs.readFileSync(path.join(ROOT,'android','full-apk.py'),'utf8'))&&!/rm -rf "\$G"\/sounds\/gvoice_pack/.test(win)&&/upload-artifact/.test(win)&&/windows-full\.zip/.test(win)
  &&!fs.existsSync(path.join(ROOT,'.github/workflows/voicepack.yml'))
  &&!/installVoicePack|voicePackBuiltin|REQ_PACK/.test(java)&&/voicepack\.zip/.test(java)&&/builtinPack\(\)/.test(java));

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
