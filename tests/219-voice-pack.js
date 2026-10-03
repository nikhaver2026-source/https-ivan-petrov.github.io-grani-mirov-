/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 219: 4.8 — ГОЛОСОВОЙ ПАКЕТ GEMINI ОТДЕЛЬНЫМ ФАЙЛОМ

   Просьба игрока: голосовой пакет — отдельным файлом, все голоса — в игре.
   В APK и архив для Windows больше записей не помещается (предел GitHub —
   2 ГиБ на файл), поэтому всё, что Gemini прочёл сверх вшитого, лежит в
   sounds/gvoice_pack и выходит отдельным файлом GraniMirov-voicepack.zip.

   1. Пакет подключается сам: обе описи (мужская и женская) грузятся, в каждой
      не меньше пятисот фраз (в 4.9 пункты настроек переехали в сборку), у каждой фразы файл; с описями сборок пакет не
      пересекается.
   2. Фраза из пакета звучит записью пакета, фраза из сборки — записью сборки.
   3. В «Синтезаторе» сказано, что пакет подключён; в приложении — кнопка
      «Установить голосовой пакет», и после установки опись перечитывается.
   4. Приложение для Windows читает пакет прямо из zip, без распаковки.
   5. В APK и архив для Windows пакет не кладётся; пакет собирается в свой
      выпуск; Android отдаёт его по тому же адресу.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');const {execFileSync}=require('child_process');
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
  for(let i=0;i<80&&!(Speech.GVOICES.m.pack.state==="ready"&&Speech.GVOICES.f.pack.state==="ready");i++)await new Promise(z=>setTimeout(z,100));
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

 /* ── 3 ── */
 const строка=await page.evaluate(()=>{gvPackUi();return {h:document.getElementById("gvPackHint").textContent,b:document.getElementById("btnGvPack").textContent};});
 const стол=await (await browser.newContext()).newPage();
 await стол.addInitScript(()=>{window.__vp=0;window.graniDesktop={version:"5.0",platform:"win32",quit(){},installVoicePack(){window.__vp++;return Promise.resolve(true);}};});
 await стол.goto(process.argv[2]);await стол.waitForTimeout(900);
 const уст=await стол.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  Speech.gvLoad();await new Promise(z=>setTimeout(z,800));gvPackUi();const кнопка=document.getElementById("btnGvPack").textContent;
  const s0=Speech.GVOICES.m.pack.state;window.__said=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return n0(t,o);};
  CMD.gvpack();await new Promise(z=>setTimeout(z,1200));
  return {кнопка,вызвано:window.__vp,сказано:__said.slice(),state:Speech.GVOICES.m.pack.state,s0};});
 check('3. в «Синтезаторе» сказано, что пакет подключён; в приложении кнопка ставит пакет и опись перечитывается',
  /подключён: ещё \d+/.test(строка.h)&&/Обновить голосовой пакет|Установить голосовой пакет/.test(уст.кнопка)&&уст.вызвано===1&&уст.сказано.some(t=>/Голосовой пакет установлен/.test(t))&&уст.state==="ready",{строка,уст});

 /* ── 4 ── */
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vp-'));const zip=path.join(tmp,'GraniMirov-voicepack.zip');
 const src=path.join(tmp,'src');fs.mkdirSync(path.join(src,'gvoice_pack','m'),{recursive:true});
 const id=P.m.p[kp];fs.copyFileSync(path.join(ROOT,'sounds/gvoice_pack/m',id+'.flac'),path.join(src,'gvoice_pack/m',id+'.flac'));
 fs.copyFileSync(path.join(ROOT,'sounds/gvoice_pack/m/bank.js'),path.join(src,'gvoice_pack/m/bank.js'));
 execFileSync('zip',['-0','-q','-r',zip,'gvoice_pack'],{cwd:src});
 const {VoicePack}=require(path.join(ROOT,'desktop','voicepack.js'));
 const vp=new VoicePack({getPath:k=>k==='userData'?path.join(tmp,'data'):path.join(tmp,'нет')});
 const поставлен=vp.install(zip);const данные=await vp.read('m/'+id+'.flac');
 const совпадает=!!данные&&Buffer.compare(данные,fs.readFileSync(path.join(ROOT,'sounds/gvoice_pack/m',id+'.flac')))===0;
 const main=fs.readFileSync(path.join(ROOT,'desktop/main.js'),'utf8');
 check('4. приложение для Windows читает пакет прямо из zip и отдаёт его по адресу sounds/gvoice_pack/',
  поставлен&&совпадает&&vp.info().installed&&/\/sounds\/gvoice_pack\//.test(main)&&/grani-voicepack-install/.test(main),{поставлен,совпадает});

 /* ── 5 ── */
 const wf=f=>fs.readFileSync(path.join(ROOT,'.github/workflows',f),'utf8');
 const java=fs.readFileSync(path.join(ROOT,'android/app/src/main/java/io/github/granimirov/MainActivity.java'),'utf8');
 /* 6.0: приложение для Windows несёт пакет в себе (полная сборка без сжатия — артефакт);
    с 9.5 выкладывается только она; приложение без пакета по-прежнему умеет
    само скачать его из «voicepack-latest» (VoicePack.autoFetch). */
 const win=wf('windows.yml'),vpjs=fs.readFileSync(path.join(ROOT,'desktop','voicepack.js'),'utf8');
 check('5. обычного APK нет, пакет кладётся только в полный; Windows несёт его в полной сборке, а приложение без пакета докачивает его само; пакет собирается в свой выпуск, Android отдаёт его по тому же адресу',
  /rm -rf "\$P"\/sounds\/gvoice_pack/.test(wf('android.yml'))&&!/rm -rf "\$G"\/sounds\/gvoice_pack/.test(win)&&/upload-artifact/.test(win)&&/windows-full\.zip/.test(win)
  &&/autoFetch/.test(vpjs)&&/voicepack-latest/.test(vpjs)&&/voicepack-latest/.test(wf('voicepack.yml'))
  &&/GraniMirov-voicepack\.zip/.test(wf('voicepack.yml'))&&/\/assets\/www\/sounds\/gvoice_pack\//.test(java)&&/installVoicePack/.test(java));

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
