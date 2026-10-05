/* ══════════════════════════════════════════════════════════════════
   256 — БЫСТРОЕ ЛИСТАНИЕ НЕ ПРОПУСКАЕТ ПУНКТ (9.5.2, просьба игрока)
   «Когда быстро листаешь меню, диалог, настройки, голос бывает пропускает
   пункт и не проговаривает его — и Gemini, и синтезатор». Проверяется:
   1. Синтезатор молча потерял поданную фразу (не начал её) — игра подаёт
      её ещё раз, и пункт звучит.
   2. Синтезатор ответил ошибкой, не начав, или «кончил» фразу мгновенно,
      не начав её, — тоже повтор, один раз.
   3. Обычная фраза, которая началась и кончилась, не повторяется никогда;
      сломанный синтезатор не держит очередь: второй потери не ждут.
   4. Мост Android сообщает о начале фразы (GraniTTSStart, hasStart).
   5. При листании записи Gemini соседних пунктов открываются заранее.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 /* Поддельный синтезатор браузера: поведение задаётся списком на каждую фразу. */
 const прогон=async(план)=>p.evaluate(async(план)=>{
  settings.speech=1;settings.ttsEngine="device";Speech.stop({user:false});
  Speech.adapter=null;Speech._kind=null;Speech._useNative=()=>false;Speech.deskNoMs=()=>false;
  const слышно=[];let k=0;
  window.SpeechSynthesisUtterance=function(t){this.text=t;};
  speechSynthesis.cancel=()=>{};
  speechSynthesis.speak=u=>{const как=план[k++]||"ok";
   if(как==="drop")return;
   if(как==="error"){setTimeout(()=>u.onerror&&u.onerror({}),20);return;}
   if(как==="instant"){setTimeout(()=>u.onend&&u.onend(),10);return;}
   setTimeout(()=>{u.onstart&&u.onstart();слышно.push(u.text);setTimeout(()=>u.onend&&u.onend(),120);},20);};
  Object.defineProperty(speechSynthesis,"speaking",{configurable:true,get:()=>false});
  Object.defineProperty(speechSynthesis,"pending",{configurable:true,get:()=>false});
  const было=Speech.stats.retried||0;
  Speech.say("Настройки звука",{interrupt:true,nav:true});
  await new Promise(r=>setTimeout(r,5200));
  return {слышно,подано:k,повторов:(Speech.stats.retried||0)-было,занят:!!Speech.current};},план);

 const п1=await прогон(["drop","ok"]);
 check('1. синтезатор потерял фразу — она подана снова и прозвучала',п1.слышно.includes("Настройки звука")&&п1.повторов===1&&!п1.занят,п1);
 const п2=await прогон(["error","ok"]);
 check('2а. ошибка до начала — повтор, пункт звучит',п2.слышно.includes("Настройки звука")&&п2.повторов===1,п2);
 const п3=await прогон(["instant","ok"]);
 check('2б. мгновенный «конец» без начала — повтор, пункт звучит',п3.слышно.includes("Настройки звука")&&п3.повторов===1,п3);
 const п4=await прогон(["ok","ok"]);
 check('3а. обычная фраза не повторяется',п4.слышно.length===1&&п4.повторов===0&&п4.подано===1,п4);
 const п5=await прогон(["drop","drop","ok"]);
 check('3б. второй потери не ждут: повтор один, очередь свободна',п5.повторов===1&&п5.подано===2&&!п5.занят,п5);

 const java=fs.readFileSync(path.join(R,'android/app/src/main/java/io/github/granimirov/MainActivity.java'),'utf8');
 const src=fs.readFileSync(path.join(R,'index.html'),'utf8');
 check('4. мост Android сообщает о начале фразы',/onStart\(String id\) \{ callJs\("GraniTTSStart", id\); \}/.test(java)
  &&/public boolean hasStart\(\) \{ return true; \}/.test(java)&&/window\.GraniTTSStart=id=>/.test(src)&&/o\.onstart&&!честно/.test(src));

 /* 5: записи соседей наготове */
 const п6=await p.evaluate(async()=>{
  settings.ttsEngine="gemini";Speech.adapter=null;Speech._kind=null;
  const g=Speech.gvLoad();for(let i=0;i<40&&g.state!=="ready";i++)await new Promise(r=>setTimeout(r,100));
  const a=Speech._adapter();if(!a||a.name!=="gemini")return {нет:"gemini",kind:Speech._kind,g:g.state};
  let открыто=[];const был=a.warm;a.warm=urls=>{открыто=urls.slice();return был(urls);};
  openModal("modal-settings");await new Promise(r=>setTimeout(r,300));
  const it=cursorItems(navLayer());if(it.length<3)return {мало:it.length};
  setCursor(it[0]);
  const ждали=[it[1],it[2]].map(navTextOf).map(t=>{const ч=Speech.gvParts(deskText(t));return ч[0]&&ч[0].url;}).filter(Boolean);
  a.warm=был;Speech.stop({user:false});while(activeLayer())closeTopUI();
  return {открыто,ждали};});
 check('5. записи Gemini соседних пунктов открываются заранее',п6&&!п6.нет&&!п6.мало&&п6.ждали.length>0&&п6.ждали.every(u=>п6.открыто.includes(u)),п6);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
