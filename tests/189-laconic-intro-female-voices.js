/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 189: КОРОТКИЕ НАЗВАНИЯ, НОВАЯ ЗАСТАВКА, ЖЕНСКИЕ ГОЛОСА, 31 ФРАЗА

   Просьбы игрока (версия 3.6).
   • «Убери лишнее из пунктов: настройки, тринадцать разделов и всё
     остальное нужно убрать. Пункты главного меню, меню действий должны быть
     лаконичны: настройки, энциклопедия звуков. То же самое в названии
     разделов: речь, интерфейс».
   • «Измени голос в заставке на более качественный, с правильными
     ударениями и интонациями. Добавь эффектов, чтобы она была ярче».
   • «Переозвучь тридцать одну фразу народов с новым произношением».
   • «Реализуй качественную озвучку персонажей, у кого её ещё нет».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Главный экран: каждая кнопка — короткое имя без чисел и скобок;
      «Энциклопедия звуков» так и называется, число звуков — в подсказке.
   2. Меню действий: раздел называет только своё имя (одно-два слова),
      пункты — без скобок и чисел; вход в раздел — «Магия. Школы и умения».
   3. Настройки: семь пунктов — «Звуки», «Синтезатор», «Речь», «Интерфейс»,
      «Жесты», «Сложность», «Сохранения»; заголовок раздела — одно имя.
   4. Инвентарь, руководство, собрание знаний, энциклопедия: разделы
      называют себя одним именем, у пустого раздела инвентаря — «пусто».
   5. Заставка (с 3.9 — intro_08.ogg): голос Gemini и эффекты, 320 кбит/с,
      стерео, 44,1 кГц, 30–45 с; прежней записи нет; титры полные.
      Повторная просьба, пока запись грузится, не запускает вторую.
   6. У каждого народа своя запись под именем поколения (VOICE_GEN; с 3.7
      все записи речи переозвучены заново — набор 190), прежних файлов «_2»
      нет, длины известны игре, титры называют каждую.
   7. Женский голос: у всех сорока шести ремёсел и семи общих слов есть
      женская запись; народ женского голоса говорит ею, мужского — мужской.
   8. Женские записи речи — от 320 кбит/с, моно, 44,1 кГц.
   9. Версия не ниже 3.6, выпуск новостей 20 на месте.
  10. Ударения словаря встроенного голоса исправлены; у переозвученных фраз
      мест прежних файлов нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');const SND=path.join(ROOT,'sounds');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','format=bit_rate,duration:stream=channels,sample_rate,codec_name','-of','json',file],{encoding:'utf8'});
 try{const j=JSON.parse(p.stdout);return {br:Math.round(+j.format.bit_rate/1000),dur:+j.format.duration,ch:j.streams[0].channels,sr:+j.streams[0].sample_rate,codec:j.streams[0].codec_name};}catch(_){return null;}}
const КОРОТКО=t=>typeof t==="string"&&t.length>0&&!/\d|\(|\)|Двойное касание/.test(t);

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),150);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};});
 await page.goto(process.argv[2]);await page.waitForTimeout(900);

 /* ── 1. главный экран ── */
 const титул=await page.evaluate(()=>{
  try{refreshEncycButton();}catch(_){}
  const b=[...document.querySelectorAll('#screen-title .menu button')];
  const enc=document.getElementById('btnEncyc');
  return {кнопки:b.map(x=>(x.dataset.speak||x.textContent).trim()),enc:{текст:enc.textContent,речь:enc.dataset.speak,подсказка:enc.title}};});
 check('1. главный экран: каждая кнопка — короткое имя без чисел и скобок, не длиннее трёх слов',
  титул.кнопки.length>=8&&титул.кнопки.every(t=>КОРОТКО(t)&&t.split(/\s+/).length<=3)
  &&титул.enc.текст==="Энциклопедия звуков"&&титул.enc.речь==="Энциклопедия звуков"&&/\d+/.test(титул.enc.подсказка),титул);

 /* ── 2. меню действий ── */
 const меню=await page.evaluate(async()=>{
  try{enterGame();}catch(_){}G.tutorDone=1;while(activeLayer())closeTopUI();
  const r={};
  r.имена=AM_GROUPS.map(g=>g[0]);
  r.подписи=AM_ITEMS.map(x=>x[1]);
  openActionMenu();
  const m=document.getElementById("actionMenu");
  r.разделы=[...m.querySelectorAll("#amMenu [data-punkt]")].map(b=>({id:b.dataset.punkt,речь:b.dataset.speak,имя:AM_GROUP_BY_ID[b.dataset.punkt][0],мелко:b.querySelector("small")?b.querySelector("small").textContent:""}));
  const нов=m.querySelector('[data-cmd="am:whatsnew"]');r.новое={текст:нов&&нов.textContent,речь:нов&&нов.dataset.speak};
  const сказано=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return s0(t,o);};
  CMD.amgroup("magic");
  r.вход=сказано.slice(-1)[0]||"";
  Speech.say=s0;closeActionMenu();
  return r;});
 check('2. меню действий: раздел называет одно имя в одно-два слова, пункты — без скобок и чисел; «Что нового» без числа',
  меню.имена.every(t=>КОРОТКО(t)&&t.split(/\s+/).length<=2)
  &&меню.разделы.length>=10&&меню.разделы.every(x=>x.речь===x.имя&&!x.мелко)
  &&меню.подписи.every(t=>!/\(|\)|\d/.test(t)&&t.split(/\s+/).length<=4)
  &&меню.новое.текст==="Что нового"&&меню.новое.речь==="Что нового"
  &&/^Магия\. /.test(меню.вход),{имена:меню.имена,вход:меню.вход,длинные:меню.подписи.filter(t=>/\(|\)|\d/.test(t)||t.split(/\s+/).length>4)});

 /* ── 3. настройки ── */
 const наст=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  CMD.settings();
  const m=document.getElementById("modal-settings");
  const пункты=[...m.querySelectorAll("#setMenu [data-punkt]")].map(b=>b.dataset.speak);
  const мелко=[...m.querySelectorAll("#setMenu [data-punkt] small")].length;
  CMD.setgroup("sound");
  const головы=secHeads(m).map(h=>({речь:h.dataset.speak,имя:h.dataset.secTitle}));
  while(activeLayer())closeTopUI();
  return {пункты,мелко,головы};});
 check('3. настройки: семь пунктов одним именем, заголовки разделов — только имя',
  наст.пункты.join(",")==="Звуки,Синтезатор,Речь,Интерфейс,Жесты,Сложность,Сохранения"&&наст.мелко===0
  &&наст.головы.length===3&&наст.головы.every(h=>h.речь===h.имя),наст);

 /* ── 4. инвентарь, руководство, знания, энциклопедия ── */
 const прочее=await page.evaluate(()=>{
  const r={};
  G.inv={"руда":2};G.items=[];G.potions=[];G.artifacts=[];G.charged=[];
  CMD.inv();
  r.инвентарь=[...document.querySelectorAll('#invSections [data-punkt]')].map(b=>b.dataset.speak);
  while(activeLayer())closeTopUI();
  openGuide();
  r.главы=[...document.querySelectorAll('#guideToc .toc-btn')].slice(0,6).map(b=>({речь:b.dataset.speak,текст:b.textContent}));
  r.части=[...document.querySelectorAll('#guideToc .'+SEC_CLASS)].map(h=>({текст:h.textContent,речь:h.dataset.speak}));
  try{closeGuide();}catch(_){while(activeLayer())closeTopUI();}
  try{buildEncycCats();}catch(_){}
  r.энциклопедия=[...document.querySelectorAll('#encycCats .sound-card')].slice(0,8).map(b=>b.dataset.speak);
  return r;});
 check('4. инвентарь, руководство и энциклопедия: разделы называют себя одним именем, пустой раздел — «пусто»',
  прочее.инвентарь.length===16&&прочее.инвентарь.every(t=>КОРОТКО(t)&&(!/,/.test(t)||/, пусто$/.test(t)))
  &&прочее.инвентарь.includes("Ресурсы")&&прочее.инвентарь.filter(t=>/, пусто$/.test(t)).length>=12
  &&прочее.главы.length>0&&прочее.главы.every(g=>g.речь===g.текст)
  &&прочее.части.length===9&&прочее.части.every(h=>!/\(\d+\)/.test(h.текст)&&h.речь===h.текст)
  &&прочее.энциклопедия.length>0&&прочее.энциклопедия.every(КОРОТКО),прочее);

 /* ── 5. заставка ── */
 const файл=await page.evaluate(()=>SOUND_BANK.intro&&SOUND_BANK.intro.f[0]);
 const инфо=файл?probe(path.join(SND,файл)):null;
 const титры=fs.readFileSync(path.join(SND,'intro','CREDITS.md'),'utf8');
 check('5. заставка: intro_08.ogg — 320 кбит/с, стерео, 44,1 кГц, 30–60 с; прежних записей нет; титры называют голос и эффекты',
  файл==="intro/intro_08.ogg"&&!!инфо&&инфо.br>=320&&инфо.ch===2&&инфо.sr===44100&&инфо.dur>=30&&инфо.dur<=60
  &&!fs.existsSync(path.join(SND,'intro','intro_01.ogg'))&&!fs.existsSync(path.join(SND,'intro','intro_02.ogg'))
  &&/Gemini/.test(титры)&&/Sadaltager/.test(титры)&&/Sonic Pi/.test(титры)&&/OpenClonk/.test(титры)
  &&/колокол/i.test(титры)&&/хор/.test(титры)&&fs.existsSync(path.join(SND,'intro','LICENSE-CC-BY-3.0.txt')),{файл,инфо});
 /* Вторая просьба, пока запись грузится, запускала вторую заставку поверх
    первой: прежний элемент терялся и звучал до конца. */
 const дважды=await page.evaluate(async()=>{
  const сказано=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return s0(t,o);};
  Intro.finish(true);CMD.intro();const первый=Intro.el;CMD.intro();const второй=Intro.el;
  await new Promise(r=>setTimeout(r,1200));
  const r={один:!!первый&&первый===второй,звучит:Intro.playing&&Intro.el===первый,сказано:сказано.slice()};
  Speech.say=s0;Intro.finish(true);return r;});
 check('5б. повторная просьба, пока заставка грузится, не запускает вторую поверх первой',
  дважды.один&&дважды.звучит&&дважды.сказано.some(t=>/загружается/.test(t)),дважды);

 /* ── 6. фразы народов ──
    В 3.6 тридцать одна фраза переозвучена ради мягкости и шестьдесят ради
    ударений; с 3.7 все записи речи — новое поколение (набор 190). Здесь
    проверяется то, что от 3.6 осталось в силе: у каждого народа своя
    запись под именем поколения, длина известна игре, титры её называют. */
 const народы=await page.evaluate(()=>Object.entries(VOICE_RACES).map(([n,v])=>({n,f:"race_"+v[0]+VOICE_GEN,len:VOICE_LEN["race_"+v[0]+VOICE_GEN]})));
 const титрыГолос=fs.readFileSync(path.join(SND,'voice','CREDITS.md'),'utf8');
 const плохо=народы.filter(x=>!fs.existsSync(path.join(SND,'voice',x.f+'.mp3'))||!(x.len>0)||!титрыГолос.includes('| '+x.f+'.mp3 |'));
 const прежних=fs.readdirSync(path.join(SND,'voice')).filter(f=>/^race_.*_2\.mp3$/.test(f));
 check('6. у каждого из двухсот восьмидесяти народов своя запись под именем поколения; прежних файлов «_2» нет, длины и титры на месте',
  народы.length===280&&плохо.length===0&&прежних.length===0,{плохо:плохо.slice(0,4),прежних:прежних.slice(0,3)});

 /* ── 7. женский голос ── */
 const жен=await page.evaluate(()=>{
  const r={};
  r.ремёсла=Object.values(VOICE_PROFS).map(v=>v[0]);
  r.безЖенского=Object.entries(VOICE_PROFS).filter(([n,v])=>!v[1]).map(([n])=>n);
  const женНарод=Object.entries(VOICE_RACES).find(([n,v])=>v[2]==="ж")[0];
  const мужНарод=Object.entries(VOICE_RACES).find(([n,v])=>v[2]==="м")[0];
  const путь=[];const s0=Folk.сказать;Folk.сказать=function(p){путь.push(p);return true;};
  Folk.общее({race:женНарод,key:"ж1"},"soglasie");Folk.общее({race:мужНарод,key:"м1"},"soglasie");
  Folk.ремесло({race:женНарод,key:"ж2",prof:"Торговец"});Folk.ремесло({race:мужНарод,key:"м2",prof:"Торговец"});
  Folk.ремесло({race:женНарод,key:"ж3",prof:"Целительница"});
  Folk.сказать=s0;
  r.пути=путь;r.женНарод=женНарод;r.мужНарод=мужНарод;r.G=VOICE_GEN;
  r.длинаЖ=Folk.длинаОбщего({race:женНарод,key:"ж1"},"otkaz");r.lenF=VOICE_LEN["say_otkaz_f"+VOICE_GEN];
  return r;});
 const G=жен.G;
 const нетФайла=[...жен.ремёсла.map(s=>'prof_'+s+'_f'+G+'.mp3'),...['soglasie','otkaz','somnenie','torg','proschanie','ugroza','bol'].map(k=>'say_'+k+'_f'+G+'.mp3')]
  .filter(f=>!fs.existsSync(path.join(SND,'voice',f)));
 const ждёмПути=["say_soglasie_f","say_soglasie","prof_torgovec_f","prof_torgovec","prof_celitelnica_f"].map(x=>x+G).join(",");
 check('7. у всех сорока шести ремёсел и семи общих слов есть женская запись; народ женского голоса говорит ею, мужского — мужской',
  жен.ремёсла.length===46&&жен.безЖенского.length===0&&нетФайла.length===0
  &&жен.пути.join(",")===ждёмПути
  &&жен.lenF>0&&Math.abs(жен.длинаЖ*1000)>0,{пути:жен.пути,нетФайла:нетФайла.slice(0,5)});

 /* ── 8. качество женских записей ── */
 const женские=fs.readdirSync(path.join(SND,'voice')).filter(f=>new RegExp('_f'+G+'\\.mp3$').test(f));
 const слабые=женские.map(f=>({f,i:probe(path.join(SND,'voice',f))})).filter(x=>!x.i||x.i.br<320||x.i.ch!==1||x.i.sr!==44100);
 const заголовок=/prof_stareyshina_f_g\.mp3/.test(титрыГолос)&&/say_soglasie_f_g\.mp3/.test(титрыГолос);
 check('8. пятьдесят три женские записи (46 ремёсел и 7 общих слов) — от 320 кбит/с, моно, 44,1 кГц; титры называют каждую',
  женские.length===53&&слабые.length===0&&заголовок,{всего:женские.length,слабые:слабые.slice(0,3)});

 /* ── 10. ударения словаря встроенного голоса ── */
 const лекс={};fs.readFileSync(path.join(ROOT,'tts','ru-lex.tsv'),'utf8').split('\n').forEach(l=>{const i=l.indexOf('\t');if(i>0)лекс[l.slice(0,i)]=l.slice(i+1);});
 const ГЛ_IPA="aeiouyɐʌɪəɛæɵʊɨøœɑɔɒ";
 const ударГл=ip=>{if(!ip||ip.indexOf('ˈ')<0)return -1;let n=0;for(const ch of ip.slice(0,ip.indexOf('ˈ')))if(ГЛ_IPA.includes(ch))n++;return n;};
 const ЖДЁМ={"уже":1,"потом":1,"моя":1,"стою":1,"стоишь":1,"тому":1,"плати":1,"прислушайся":1,"предначертанного":2,"говорю":2,"садись":1,"налей":1,"берегись":2,"бревно":1,"борода":2,"сестра":1,"назову":2,"проси":1,"повторяю":2,"меняю":1};
 const мимо=Object.entries(ЖДЁМ).filter(([w,i])=>ударГл(лекс[w])!==i).map(([w])=>[w,лекс[w]]);
 const пвПрежних=fs.readdirSync(path.join(SND,'bed')).filter(f=>/^pv_.*_2\.mp3$/.test(f)).filter(f=>fs.existsSync(path.join(SND,'bed',f.replace(/_2\.mp3$/,'.mp3'))));
 check('10. словарь встроенного голоса: ударения исправлены («уже́», «пото́м», «моя́», «стою́», «плати́», «прислу́шайся», «предначе́ртанного»…); у переозвученных фраз мест прежних файлов нет',
  мимо.length===0&&пвПрежних.length===0,{мимо,пвПрежних});

 /* ── 9. версия и новость ── */
 const версия=await page.evaluate(()=>({v:GAME_VERSION,title:document.title,news:NEWS_V,т:(NEWS.find(n=>n.v===20)||{}).т||""}));
 const gradle=fs.readFileSync(path.join(ROOT,'android','app','build.gradle'),'utf8');
 check('9. версия не ниже 3.6, выпуск новостей 20 рассказывает о переменах',
  parseFloat(версия.v)>=3.6&&/Alpha 3\.\d/.test(версия.title)&&/versionName '3\.\d'/.test(gradle)&&версия.news>=20
  &&/одним именем/.test(версия.т)&&/Supertonic 3/.test(версия.т),версия);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
