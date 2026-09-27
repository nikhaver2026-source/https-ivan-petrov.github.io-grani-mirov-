/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 193: «СИНТЕЗАТОР» — ВСТРОЕННЫЙ ГОЛОС (ЖЕНСКИЙ И МУЖСКОЙ) И ГОЛОС УСТРОЙСТВА

   Просьба игрока (выпуск новостей 24): «Раздели, чтобы в настройках был пункт „Встроенный
   голос", затем пункт „Выбор голоса" — „Женский" и „Мужской". Также пункт
   „Голос устройства" и рядом „Выбор голоса устройства". Всё это — в пункте
   „Синтезатор"». И: «записывать фразы живыми голосами Gemini и внедрять их во
   всю игру».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. В пункте «Синтезатор речи» первые четыре пункта — «Встроенный голос»,
      «Выбор голоса», «Голос устройства», «Выбор голоса устройства»; у
      «Выбора голоса» ровно два варианта — «Женский» и «Мужской». При
      встроенном голосе виден только «Выбор голоса»; голоса телефона — только
      при голосе устройства.
   2. «Встроенный голос» и «Голос устройства» — одна
      настройка: включён ровно один; выключить включённый — вернуться к
      встроенному голосу.
   3. «Женский» — записи Callirrhoe (sounds/gvoice_f) и нейросеть sova;
      «Мужской» — записи Iapetus (sounds/gvoice) и нейросеть igm; опись
      выбранного голоса грузится, выбор переживает перезагрузку.
   4. Женский банк: опись, у каждой записи файл, лишних нет, FLAC моно
      24 кГц; титры называют Callirrhoe, Gemini и условия, число сходится.
   5. Записанная фраза женского банка звучит записью женского голоса.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const GF=path.join(__dirname,'..','sounds','gvoice_f');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_name,channels,sample_rate','-of','json',file],{encoding:'utf8'});
 try{const s=JSON.parse(p.stdout).streams[0];return {c:s.codec_name,ch:s.channels,sr:+s.sample_rate};}catch(_){return null;}}
(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);

 /* ── 1. порядок пунктов и что видно при каждом голосе ── */
 const пункты=await page.evaluate(()=>{
  const box=document.querySelector('.set-group[data-set-group="tts"]');
  const все=[...box.querySelectorAll("input,select")].filter(x=>!x.closest("label[hidden]:not([data-eng])")&&!(x.closest("label")&&x.closest("label").querySelector("#setTtsEngine")));
  const имя=x=>{const l=x.closest("label");const b=l&&l.querySelector("b");return (b?b.textContent:(l?l.childNodes[0].textContent:"")).trim();};
  const видно=()=>[...box.querySelectorAll("input,select,button")].filter(x=>{const h=x.closest("[hidden]");return !h||h===box;}).map(x=>x.id);
  const g=document.getElementById("setGvVoice");const b=document.getElementById("setEngBuiltin"),d=document.getElementById("setEngDevice");
  if(!b.checked)b.click();const вст=видно();
  d.click();const устр=видно();
  b.click();
  return {id:все.slice(0,4).map(x=>x.id),имена:все.slice(0,4).map(имя),
   варианты:g?[...g.options].map(o=>o.textContent.trim()):[],группа:(SET_GROUPS.find(x=>x.id==="tts")||{}).n,вст,устр};});
 const устрПоля=["setVoice","setVoiceLocal","setVoiceLang","btnVoiceList"];
 check('1. в «Синтезаторе» по порядку: Встроенный голос, Выбор голоса (Женский, Мужской), Голос устройства, Выбор голоса устройства',
  пункты.имена.join("|")==="Встроенный голос|Выбор голоса|Голос устройства|Выбор голоса устройства"
  &&пункты.варианты.join()==="Женский,Мужской"&&/Синтезатор/.test(пункты.группа||""),пункты);
 check('1б. при встроенном голосе виден только «Выбор голоса»; голоса телефона — только при голосе устройства; ElevenLabs нет',
  пункты.вст.includes("setGvVoice")&&устрПоля.every(i=>!пункты.вст.includes(i))
  &&!пункты.устр.includes("setGvVoice")&&устрПоля.every(i=>пункты.устр.includes(i))
  &&["setEngBuiltin","setEngDevice"].every(i=>пункты.вст.includes(i)&&пункты.устр.includes(i))
  &&!пункты.вст.some(i=>/Eleven/.test(i))&&!пункты.устр.some(i=>/Eleven/.test(i)),
  {вст:пункты.вст,устр:пункты.устр});

 /* ── 2. переключатели — одна настройка ── */
 const пере=await page.evaluate(()=>{
  const b=document.getElementById("setEngBuiltin"),d=document.getElementById("setEngDevice");
  const снимок=()=>({e:settings.ttsEngine,b:b.checked,d:d.checked});const r={};
  if(!d.checked)d.click();r.устройство=снимок();
  b.click();r.встроенный=снимок();
  b.click();r.безВстроенного=снимок();
  d.click();r.безУстройства=снимок();
  return r;});
 check('2. включён ровно один: встроенный голос или голос устройства; выключить включённый — включить другой',
  пере.устройство.e==="device"&&пере.устройство.d&&!пере.устройство.b
  &&пере.встроенный.e==="gemini"&&пере.встроенный.b&&!пере.встроенный.d
  &&пере.безВстроенного.e==="device"&&пере.безВстроенного.d&&!пере.безВстроенного.b
  &&пере.безУстройства.e==="gemini"&&пере.безУстройства.b,пере);

 /* ── 3. женский и мужской ── */
 const выбор=await page.evaluate(async()=>{
  const g=document.getElementById("setGvVoice");const r={};
  g.value="f";g.dispatchEvent(new Event("change"));
  for(let i=0;i<60&&Speech.GVOICE.state!=="ready";i++)await new Promise(z=>setTimeout(z,50));
  r.ж={v:settings.gvVoice,n:settings.graniVoice,dir:Speech.GVOICE.dir,state:Speech.GVOICE.state,модель:Speech.GRANI_MODELS[0],
   голос:(window.GVOICE_BANK_F||{}).voice,фраз:Object.keys(Speech.GVOICE.map||{}).length};
  g.value="m";g.dispatchEvent(new Event("change"));
  for(let i=0;i<60&&Speech.GVOICE.state!=="ready";i++)await new Promise(z=>setTimeout(z,50));
  r.м={v:settings.gvVoice,n:settings.graniVoice,dir:Speech.GVOICE.dir,state:Speech.GVOICE.state,модель:Speech.GRANI_MODELS[0],голос:(window.GVOICE_BANK||{}).voice};
  g.value="f";g.dispatchEvent(new Event("change"));return r;});
 await page.reload();await page.waitForTimeout(700);
 const после=await page.evaluate(()=>({v:settings.gvVoice,поле:document.getElementById("setGvVoice").value}));
 check('3. «Женский» — записи Callirrhoe и нейросеть sova, «Мужской» — Iapetus и igm; выбор переживает перезагрузку',
  выбор.ж.v==="f"&&выбор.ж.n==="sova"&&выбор.ж.dir==="sounds/gvoice_f/"&&выбор.ж.state==="ready"&&выбор.ж.голос==="Callirrhoe"&&/sova200/.test(выбор.ж.модель)
  &&выбор.м.v==="m"&&выбор.м.n==="igm"&&выбор.м.dir==="sounds/gvoice/"&&выбор.м.state==="ready"&&выбор.м.голос==="Iapetus"&&/igm3804/.test(выбор.м.модель)
  &&после.v==="f"&&после.поле==="f",{выбор,после});

 /* ── 4. женский банк на диске ── */
 const js=fs.readFileSync(path.join(GF,'bank_f1.js'),'utf8');
 const bank=JSON.parse(js.slice(js.indexOf('{'),js.lastIndexOf('}')+1));
 const ids=Object.values(bank.p);const файлы=fs.readdirSync(GF).filter(f=>f.endsWith('.flac'));
 const нет=ids.filter(id=>!fs.existsSync(path.join(GF,id+'.flac')));const лишние=файлы.filter(f=>ids.indexOf(f.slice(0,-5))<0);
 const выборка=ids.filter((_,i)=>i%Math.max(1,Math.floor(ids.length/40))===0);
 const плохие=выборка.map(id=>({id,i:probe(path.join(GF,id+'.flac'))})).filter(x=>!x.i||x.i.c!=='flac'||x.i.ch!==1||x.i.sr!==24000);
 const титры=fs.readFileSync(path.join(GF,'CREDITS.md'),'utf8');const числа=(титры.match(/Записей:\s*(\d+)/)||[])[1];
 check('4. женский банк: не меньше тысячи фраз, у каждой файл, лишних нет, FLAC моно 24 кГц; титры — Callirrhoe, Gemini, условия, число сходится',
  ids.length>=1000&&new Set(ids).size===ids.length&&нет.length===0&&лишние.length===0&&плохие.length===0
  &&/Callirrhoe/.test(титры)&&/gemini-3\.8-flash-tts/.test(титры)&&/ai\.google\.dev\/gemini-api\/terms/.test(титры)&&+числа===ids.length,
  {фраз:ids.length,нет:нет.slice(0,3),лишние:лишние.slice(0,3),плохие:плохие.slice(0,3),числа});

 /* ── 5. записанная фраза звучит женской записью ── */
 const звук=await page.evaluate(async()=>{
  settings.ttsEngine="gemini";Speech.adapter=null;Speech._kind=null;
  for(let i=0;i<60&&Speech.GVOICE.state!=="ready";i++)await new Promise(z=>setTimeout(z,50));
  const k=Object.keys(Speech.GVOICE.map)[0];const parts=Speech.gvParts(k);
  return {k,url:parts[0]&&parts[0].url,вид:Speech._wantKind()};});
 check('5. записанная фраза при «Женском» — запись из sounds/gvoice_f',/^sounds\/gvoice_f\/gf\d+\.flac$/.test(звук.url||"")&&звук.вид==="gemini",звук);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
