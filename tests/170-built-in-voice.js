/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 170: ВСТРОЕННЫЙ ГОЛОС ИГРЫ

   Русская нейросеть Piper говорит прямо на устройстве, в отдельном потоке,
   через onnxruntime-web. Настоящая модель весит шестьдесят мегабайт, и
   проверка её не качает: вместо неё отдаётся крошечная модель той же формы
   (tests/fixtures/fake-voice.onnx) — вход «номера звуков», выход «волна».
   Так проверяется весь путь, кроме самого тембра: разбор текста, поток,
   onnxruntime, проигрывание, конец фразы, отмена, запасной голос.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. В разделе «Синтезатор речи» есть пункт «Встроенный голос игры».
   2. Разбор текста в звуки совпадает с эталоном голоса на фразах игры:
      служебные слова, числа словами, знаки препинания.
  2б. «Ю» после согласной несёт метку, на которой учился голос («люк»,
      «ключ»), а «чу» — без неё («кольчуга»).
   3. Слово, которого нет в словаре, всё равно получает звуки и ударение.
   4. Поток поднимает onnxruntime и модель, игра объявляет, что голос готов.
   5. Фраза звучит встроенным голосом: волна приходит, начало и конец фразы
      отмечаются, очередь речи идёт дальше.
   6. Длинный текст из многих предложений дочитывается до конца.
   7. Новая реплика обрывает недочитанную — как у синтезатора устройства.
   8. Модели нет нигде — игра честно говорит об этом и продолжает говорить
      синтезатором устройства.
   9. Части голоса лежат в папке игры, у движка есть лицензия, служебный
      работник не стирает кэш модели.
  9б. Сама модель и её настройки лежат в папке игры и не зависят от
      Hugging Face; служебный работник не кладёт её второй копией в кэш.
  10. На устройстве нет ни одного русского голоса — игра сама включает
      встроенный голос и говорит об этом; есть русский голос — не трогает.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const КОРЕНЬ=path.join(__dirname,'..');
const ПОДДЕЛКА=fs.readFileSync(path.join(__dirname,'fixtures','fake-voice.onnx'));

async function страница(browser,модель){
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},serviceWorkers:'block'});
 await ctx.route('**/*.onnx',r=>модель?r.fulfill({status:200,body:ПОДДЕЛКА,headers:{'content-type':'application/octet-stream','content-length':String(ПОДДЕЛКА.length)}}):r.fulfill({status:404,body:'нет'}));
 await ctx.route('**/*.onnx.json',r=>r.fulfill({status:404,body:'нет'}));
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker|404/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(700);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(1200);
 /* Запасной голос устройства в проверке — поддельный: записывает, что сказал. */
 await page.evaluate(()=>{
  window.__устройство=[];window.__сказано=[];
  Speech._webAdapter=function(){return {name:"web",speak(t,o){window.__устройство.push(t);if(o.onstart)setTimeout(o.onstart,5);setTimeout(()=>o.onend&&o.onend(),20);return true;},cancel(){},speaking(){return false;}};};
  const было=Speech.say.bind(Speech);Speech.say=function(t,o){window.__сказано.push(String(t));return было(t,o);};
  settings.speech=1;settings.rate=1;Speech.adapter=null;Speech._kind=null;});
 return {ctx,page,errors};}

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const {ctx,page,errors}=await страница(browser,true);
 const ждать=async(cond,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await page.evaluate(cond))return Date.now()-t0;await page.waitForTimeout(150);}return -1;};

 /* ── 1. пункт в настройках ── */
 const пункт=await page.evaluate(()=>{const s=document.getElementById("setTtsEngine");
  return s?[...s.options].map(o=>o.value+"="+o.textContent):[];});
 check('1. в разделе «Синтезатор речи» есть пункт «Встроенный голос игры»',пункт.some(x=>/^grani=Встроенный голос игры/.test(x)),пункт);

 /* ── 4. поток и модель ── */
 await page.evaluate(()=>{settings.ttsEngine="grani";Speech.adapter=null;Speech._kind=null;Speech.graniStart();});
 const готов=await ждать(()=>Speech.graniState()==="ready",30000);
 const сообщено=await page.evaluate(()=>window.__сказано.some(t=>/Встроенный голос готов/.test(t)));
 check('4. поток поднимает onnxruntime и модель, игра объявляет, что голос готов',готов>=0&&сообщено,{мс:готов,state:await page.evaluate(()=>Speech.graniState())});

 /* ── 2–3. разбор ── */
 const разбор=await page.evaluate(()=>new Promise(ok=>{
  const w=Speech._grani.worker;const фразы=["Привет, путник! Здоровье на исходе, зелье в суме.","Вы нашли меч. Здоровье: 12 из 40.","Окно «Событие». Выбрано: первый пункт.","Кельвор Зарний пришёл."];
  const r=[];let n=0;
  const h=e=>{if(e.data&&e.data.type==="phonemes"){r[e.data.id]=e.data.parts;if(++n===фразы.length){w.removeEventListener("message",h);ok(r);}}};
  w.addEventListener("message",h);
  фразы.forEach((t,i)=>w.postMessage({type:"phonemes",id:i,text:t}));
  setTimeout(()=>ok(r),5000);}));
 const эталон=[["prʲivʲˈet, pˈutʲnʲik!","zdʌrˈovjjɪ nə ɪsxˈodʲi, ʑˈeɭjjɪ f sumʲˈe."],
  ["vˈy naʃɭʲˈɪ mʲˈetʃʲ.","zdʌrˈovjjɪ: dvʲinˈɑttsʌtʲ ɪs sʌrˈok."],
  ["ʌknˈo sʌbˈytʲijɪ.","vˈybrʌnʌ: pʲˈervyj pˈunkt."]];
 const совпало=эталон.every((е,i)=>JSON.stringify(разбор[i])===JSON.stringify(е));
 check('2. разбор текста в звуки совпадает с эталоном голоса: служебные слова, числа словами, знаки',совпало,{разбор:разбор.slice(0,3)});
 /* «ю» после согласной несёт метку, с которой голос учился; после «ч» — нет. */
 const сЮ=await page.evaluate(()=>new Promise(ok=>{
  const w=Speech._grani.worker;
  const h=e=>{if(e.data&&e.data.type==="phonemes"&&e.data.id==="ю"){w.removeEventListener("message",h);ok(e.data.parts);}};
  w.addEventListener("message",h);w.postMessage({type:"phonemes",id:"ю",text:"Люк и ключ, кольчуга."});
  setTimeout(()=>ok(null),5000);}));
 const сЮстрока=(сЮ||[]).join(" ");
 check('2б. «ю» после согласной размечено, как учился голос, а «чу» — без метки',
  сЮстрока.indexOf('ɭʲˈu"k')>=0&&сЮстрока.indexOf('kɭʲˈu"tʃʲ')>=0&&/tʃʲˈuɡa/.test(сЮстрока)&&!/tʃʲˈu"/.test(сЮстрока),сЮ);
 const незнакомое=(разбор[3]||[])[0]||"";
 check('3. слово, которого нет в словаре, всё равно получает звуки и ударение',/kʲ.*ɭv.*ˈ/.test(незнакомое)&&/prʲiʃˈoɭ/.test(незнакомое),незнакомое);

 /* ── 5. фраза встроенным голосом ── */
 const фраза=await page.evaluate(async()=>{
  window.__волн=0;const было=Speech._graniMsg.bind(Speech);
  Speech._graniMsg=function(m){if(m&&m.type==="audio")window.__волн++;return было(m);};
  window.__устройство.length=0;
  const до=Speech.stats.spoken,сторож=Speech.stats.rescued||0;
  Speech.say("Двойное касание — выбрать.",{pri:1,user:true});
  Speech.say("Следом вторая фраза.",{pri:2,interrupt:false,ttl:20000});
  await new Promise(r=>setTimeout(r,6000));
  return {волн:window.__волн,сказано:Speech.stats.spoken-до,сторож:(Speech.stats.rescued||0)-сторож,устройство:window.__устройство.slice(),адаптер:Speech.adapter&&Speech.adapter.name};});
 check('5. фраза звучит встроенным голосом: волна приходит, конец фразы отмечается, очередь идёт дальше',
  фраза.адаптер==="grani"&&фраза.волн>=2&&фраза.сказано>=2&&фраза.сторож===0&&фраза.устройство.length===0,фраза);

 /* ── 6. длинный текст ── */
 const длинный=Array.from({length:6},(_,i)=>`Предмет ${i+1}: меч из закалённой стали, лежит в суме.`).join(" ");
 const долгий=await page.evaluate(async t=>{window.__волн=0;const до=Speech.stats.spoken;
  Speech.say(t,{pri:1,user:true});
  const t0=Date.now();while(Date.now()-t0<15000&&Speech.stats.spoken===до)await new Promise(r=>setTimeout(r,200));
  return {волн:window.__волн,дочитан:Speech.stats.spoken>до};},длинный);
 check('6. длинный текст из многих предложений дочитывается до конца',долгий.дочитан&&долгий.волн>=6,долгий);

 /* ── 7. обрыв ── */
 const обрыв=await page.evaluate(async t=>{
  const до=Speech.stats.cut;Speech.say(t,{pri:2,user:true});
  await new Promise(r=>setTimeout(r,300));
  Speech.say("Стоп, новое.",{pri:2,user:true});
  await new Promise(r=>setTimeout(r,2500));
  return {обрезано:Speech.stats.cut-до,говорит:Speech.adapter.speaking(),последнее:(Speech.last&&Speech.last.text)||""};},длинный);
 check('7. новая реплика обрывает недочитанную',обрыв.обрезано>=1&&/Стоп, новое/.test(обрыв.последнее),обрыв);
 check('страница с встроенным голосом не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await ctx.close();

 /* ── 8. модели нет ── */
 const б=await страница(browser,false);
 const нет=await б.page.evaluate(async()=>{
  settings.ttsEngine="grani";Speech.adapter=null;Speech._kind=null;Speech.graniStart();
  const t0=Date.now();while(Date.now()-t0<20000&&Speech.graniState()==="loading")await new Promise(r=>setTimeout(r,200));
  window.__устройство.length=0;
  Speech.say("Фраза без модели.",{pri:1,user:true});
  await new Promise(r=>setTimeout(r,800));
  return {state:Speech.graniState(),честно:window.__сказано.some(t=>/не скачался/.test(t)),устройство:window.__устройство.slice()};});
 check('8. модели нет нигде — игра честно говорит об этом и продолжает говорить синтезатором устройства',
  нет.state==="failed"&&нет.честно&&нет.устройство.includes("Фраза без модели."),нет);
 await б.ctx.close();

 /* ── 10. нет русского голоса ── */
 const в=await страница(browser,true);
 const авто=await в.page.evaluate(async()=>{
  settings.ttsEngine="device";Speech._graniAuto=false;Speech._grani=null;Speech.adapter=null;Speech._kind=null;
  const было=speechSynthesis.getVoices.bind(speechSynthesis);
  speechSynthesis.getVoices=()=>[{name:"Samantha",lang:"en-US",localService:true}];
  const нет=Speech._graniAutoCheck();
  const t0=Date.now();while(Date.now()-t0<20000&&Speech.graniState()!=="ready")await new Promise(r=>setTimeout(r,200));
  const r1={включил:нет,вид:Speech._wantKind(),сказал:window.__сказано.some(t=>/нет русского голоса/.test(t))};
  Speech._graniAuto=false;Speech.adapter=null;Speech._kind=null;
  speechSynthesis.getVoices=()=>[{name:"Milena",lang:"ru-RU",localService:true}];
  const r2=Speech._graniAutoCheck();
  speechSynthesis.getVoices=было;
  return {...r1,приРусском:r2,видПриРусском:Speech._wantKind()};});
 check('10. нет ни одного русского голоса — игра сама включает встроенный голос и говорит об этом; есть русский — не трогает',
  авто.включил&&авто.вид==="grani"&&авто.сказал&&авто.приРусском===false&&авто.видПриРусском==="device",авто);
 await в.ctx.close();

 /* ── 9. файлы ── */
 const есть=f=>fs.existsSync(path.join(КОРЕНЬ,'tts',f));
 const sw=fs.readFileSync(path.join(КОРЕНЬ,'sw.js'),'utf8');
 const лиц=есть('ort/LICENSE.txt')&&/MIT License/.test(fs.readFileSync(path.join(КОРЕНЬ,'tts','ort','LICENSE.txt'),'utf8'));
 const кредиты=есть('CREDITS.md')&&/CC0/.test(fs.readFileSync(path.join(КОРЕНЬ,'tts','CREDITS.md'),'utf8'));
 const безGPL=!/espeak/i.test(fs.readFileSync(path.join(КОРЕНЬ,'tts','ru-g2p.js'),'utf8'));
 check('9. части голоса в папке игры, у движка и голоса указаны лицензии, кэш модели не стирается, разбор без eSpeak',
  ['grani-tts-worker.js','ru-g2p.js','ru-lex.tsv','ru-stress.json','ort/ort.wasm.min.js','ort/ort-wasm-simd-threaded.wasm','ort/ort-wasm-simd-threaded.mjs'].every(есть)
  &&лиц&&кредиты&&безGPL&&/k!==VOICE/.test(sw)&&/grani-tts-v1/.test(sw),{лиц,кредиты,безGPL});

 /* ── 9б. сама модель лежит в папке игры ── Hugging Face из России открывается
    через раз, поэтому голос не должен зависеть от него: модель и её
    настройки идут вместе с игрой, а служебный работник не кладёт шестьдесят
    мегабайт второй копией в кэш записей (их хранит сам поток голоса). */
 const модель=path.join(КОРЕНЬ,'tts','ru_RU-sova200-medium.onnx');
 const весМодели=fs.existsSync(модель)?fs.statSync(модель).size:0;
 let настройки=null;
 try{настройки=JSON.parse(fs.readFileSync(модель+'.json','utf8'));}catch(_){}
 const карта=настройки&&настройки.phoneme_id_map||{};
 check('9б. модель голоса и её настройки лежат в папке игры: 22 050 Гц, метка «\"» в таблице звуков, в кэш записей не дублируется',
  весМодели>50e6&&настройки&&настройки.audio&&настройки.audio.sample_rate===22050
  &&Array.isArray(карта['"'])&&карта['"'][0]===150&&/pathname\.endsWith\("\.onnx"\)\)return;/.test(sw),
  {мб:Math.round(весМодели/1e6),частота:настройки&&настройки.audio&&настройки.audio.sample_rate,метка:карта['"']});

 /* ── 11. два встроенных голоса, женский по умолчанию ── Прежний «Денис»
    распознавался хуже всех; теперь женский sova200 и мужской igm3804. */
 const голоса=Object.values({sova:'ru_RU-sova200-medium.onnx',igm:'ru_RU-igm3804-medium.onnx'})
  .map(f=>{const p=path.join(КОРЕНЬ,'tts',f);let j=null;try{j=JSON.parse(fs.readFileSync(p+'.json','utf8'));}catch(_){}
   return {f,мб:fs.existsSync(p)?Math.round(fs.statSync(p).size/1e6):0,частота:j&&j.audio&&j.audio.sample_rate,метка:j&&j.phoneme_id_map&&j.phoneme_id_map['"']};});
 const выбор=await (async()=>{const p=await browser.newPage();await p.goto(process.argv[2]);await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{const был=settings.graniVoice;
   settings.graniVoice=undefined;const поУмолчанию=Speech.GRANI_MODELS[0];
   settings.graniVoice="igm";const мужской=Speech.GRANI_MODELS[0];
   settings.graniVoice="чепуха";const запас=Speech.GRANI_MODELS[0];settings.graniVoice=был;
   const sel=document.getElementById("setGraniVoice");
   return {поУмолчанию,мужской,запас,пункты:sel?[...sel.options].map(o=>o.value):[],имя:sel&&sel.getAttribute("aria-label"),
    дениса:document.documentElement.innerHTML.indexOf("denis")>=0};});
  await p.close();return r;})();
 const денисНет=!fs.existsSync(path.join(КОРЕНЬ,'tts','ru_RU-denis-medium.onnx'));
 check('11. два встроенных голоса в папке игры: женский sova200 и мужской igm3804, 22 050 Гц, та же таблица звуков',
  голоса.every(g=>g.мб>50&&g.частота===22050&&Array.isArray(g.метка)&&g.метка[0]===150),голоса);
 check('11б. по умолчанию говорит женский, мужской выбирается в настройках, прежнего «Дениса» нет',
  /sova200/.test(выбор.поУмолчанию)&&/igm3804/.test(выбор.мужской)&&/sova200/.test(выбор.запас)
  &&выбор.пункты.join()==="sova,igm"&&!!выбор.имя&&!выбор.дениса&&денисНет,{выбор,денисНет});

 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
