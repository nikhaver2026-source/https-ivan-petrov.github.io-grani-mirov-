/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 190: ВСЕ ЧЕТЫРЕСТА СЕМЬ РЕПЛИК — ГОЛОСАМИ GEMINI

   Просьба игрока (версия 3.7): «Озвучь все четыреста семь реплик через
   Gemini». Голоса — высшего качества.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. В sounds/voice ровно четыреста семь записей, все — нового поколения
      (имя оканчивается на «_g»); записей прежних поколений нет.
   2. Поколение в игре одно: VOICE_GEN — «_g»; каждый народ, ремесло
      (мужская и женская запись), общее слово и ход героя находит свой файл,
      длина каждой известна игре; в именах народов нет прежнего «_2».
   3. Все записи — от 320 кбит/с, моно, 44,1 кГц.
   4. Титры называют Gemini, модель gemini-3.8-flash-tts, условия и все
      тринадцать голосов; числа записей по голосам складываются в 407; у
      каждой записи строка с русским текстом и именем голоса.
   5. Игра зовёт записи нового поколения: оклик, слово ремесла и общее
      слово — в мужском и женском голосе, ход героя.
   6. Ни одна реплика не растянута: не медленнее шести знаков в секунду
      (первые дубли трёх голосов выходили вдвое медленнее — их переозвучили).
   7. Прежние голоса ушли и из списка записей, пришедших до правила
      «320 кбит/с».
   8. Выпуск новостей 21, версия 3.7, глава о живой речи и титры
      руководства называют Gemini и голоса.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');const SND=path.join(ROOT,'sounds');const VOICE=path.join(SND,'voice');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','format=bit_rate,duration:stream=channels,sample_rate','-of','json',file],{encoding:'utf8'});
 try{const j=JSON.parse(p.stdout);return {br:Math.round(+j.format.bit_rate/1000),dur:+j.format.duration,ch:j.streams[0].channels,sr:+j.streams[0].sample_rate};}catch(_){return null;}}
const ГОЛОСА=["Algenib","Charon","Orus","Enceladus","Achird","Puck","Gacrux","Sulafat","Achernar","Leda","Iapetus","Erinome","Algieba"];

(async()=>{
 /* ── 1. записи на диске ── */
 const mp3=fs.readdirSync(VOICE).filter(f=>f.endsWith('.mp3'));
 const прежние=mp3.filter(f=>!/_g\.mp3$/.test(f));
 check('1. в sounds/voice четыреста семь записей, все нового поколения («_g»), прежних нет',
  mp3.length===407&&прежние.length===0,{всего:mp3.length,прежние:прежние.slice(0,4)});

 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(600);

 /* ── 2. поколение в игре ── */
 const игра=await page.evaluate(()=>{
  const G=VOICE_GEN,need=[];
  Object.values(VOICE_RACES).forEach(v=>need.push("race_"+v[0]+G));
  Object.values(VOICE_PROFS).forEach(v=>{need.push("prof_"+v[0]+G);if(v[1])need.push("prof_"+v[0]+"_f"+G);});
  VOICE_SAY.forEach(k=>{need.push("say_"+k+G);need.push("say_"+k+"_f"+G);});
  VOICE_HERO.forEach(k=>need.push("hero_"+k+G));
  return {G,need,len:VOICE_LEN,слагов2:Object.values(VOICE_RACES).filter(v=>/_2$/.test(v[0])).map(v=>v[0])};});
 const безФайла=игра.need.filter(k=>!fs.existsSync(path.join(VOICE,k+'.mp3')));
 const безДлины=игра.need.filter(k=>!(игра.len[k]>0));
 const ключи=Object.keys(игра.len);
 check('2. VOICE_GEN — «_g»; каждый народ, ремесло, общее слово и ход героя находит свой файл и длину; в именах народов нет «_2»',
  игра.G==="_g"&&игра.need.length===407&&new Set(игра.need).size===407&&безФайла.length===0&&безДлины.length===0
  &&ключи.length===407&&ключи.every(k=>/_g$/.test(k))&&игра.слагов2.length===0,
  {G:игра.G,нужно:игра.need.length,безФайла:безФайла.slice(0,3),безДлины:безДлины.slice(0,3),слагов2:игра.слагов2.slice(0,3)});

 /* ── 3. качество записей ── */
 const инфо=mp3.map(f=>({f,i:probe(path.join(VOICE,f))}));
 const слабые=инфо.filter(x=>!x.i||x.i.br<320||x.i.ch!==1||x.i.sr!==44100);
 check('3. все четыреста семь записей — от 320 кбит/с, моно, 44,1 кГц',слабые.length===0,слабые.slice(0,4));

 /* ── 4. титры ── */
 const титры=fs.readFileSync(path.join(VOICE,'CREDITS.md'),'utf8');
 const строки=титры.split('\n').filter(l=>/^\| [a-z0-9_]+_g\.mp3 \|/.test(l));
 const поГолосам={};let сумма=0;
 for(const v of ГОЛОСА){const m=титры.match(new RegExp("\\| "+v+" \\| [^|]+\\| [^|]+\\| (\\d+) \\|"));поГолосам[v]=m?+m[1]:0;сумма+=поГолосам[v];}
 const безСтроки=mp3.filter(f=>!строки.some(l=>l.startsWith('| '+f+' |')));
 const плохиеСтроки=строки.filter(l=>{const t=(l.match(/«([^»]+)»/)||[])[1]||"";const g=l.trim().replace(/\|\s*$/,'').split('|').pop().trim();
  return !/^[А-Яа-яЁё0-9 ,.!?—–\-:;]+$/.test(t)||ГОЛОСА.indexOf(g)<0;});
 check('4. титры называют Gemini, модель, условия и все тринадцать голосов; записей по голосам 407; у каждой записи строка с русским текстом и голосом',
  /Gemini/.test(титры)&&/gemini-3\.8-flash-tts/.test(титры)&&/Additional Terms of Service/.test(титры)&&/ai\.google\.dev\/gemini-api\/terms/.test(титры)
  &&сумма===407&&ГОЛОСА.every(v=>поГолосам[v]>0)&&строки.length===407&&безСтроки.length===0&&плохиеСтроки.length===0,
  {поГолосам,сумма,строк:строки.length,безСтроки:безСтроки.slice(0,3),плохиеСтроки:плохиеСтроки.slice(0,2)});

 /* ── 5. игра зовёт новое поколение ── */
 const пути=await page.evaluate(()=>{
  const женНарод=Object.entries(VOICE_RACES).find(([n,v])=>v[2]==="ж")[0];
  const мужНарод="Люди";
  const путь=[];const s0=Folk.сказать;Folk.сказать=function(p){путь.push(p);return true;};
  try{
   Folk.народ({race:мужНарод,key:"м0"});Folk.народ({race:женНарод,key:"ж0"});
   Folk.ремесло({race:мужНарод,key:"м1",prof:"Кузнец"});Folk.ремесло({race:женНарод,key:"ж1",prof:"Кузнец"});
   Folk.общее({race:мужНарод,key:"м2"},"torg");Folk.общее({race:женНарод,key:"ж2"},"torg");
   Folk.герой("torg");
  }finally{Folk.сказать=s0;}
  return {путь,жен:VOICE_RACES[женНарод][0],муж:VOICE_RACES[мужНарод][0]};});
 const ждём=["race_"+пути.муж+"_g","race_"+пути.жен+"_g","prof_kuznec_g","prof_kuznec_f_g","say_torg_g","say_torg_f_g","hero_torg_g"];
 check('5. оклик, слово ремесла, общее слово и ход героя звучат записями нового поколения, в мужском и женском голосе',
  JSON.stringify(пути.путь)===JSON.stringify(ждём),{путь:пути.путь,ждём});

 /* ── 6. темп ── */
 const тексты={};строки.forEach(l=>{const f=l.slice(2,l.indexOf('.mp3'));const t=(l.match(/«([^»]+)»/)||[])[1];if(t)тексты[f]=t;});
 const медленные=Object.entries(тексты).map(([k,t])=>({k,темп:t.length/Math.max(0.3,(игра.len[k]||9)-0.18)})).filter(x=>x.темп<6).map(x=>[x.k,Math.round(x.темп*10)/10]);
 check('6. ни одна реплика не растянута: не медленнее шести знаков в секунду',
  Object.keys(тексты).length===407&&медленные.length===0,медленные.slice(0,5));

 /* ── 7. список битрейтов ── */
 const база=fs.readFileSync(path.join(SND,'BITRATE_BASELINE.txt'),'utf8');
 check('7. прежние голоса ушли и из списка записей, пришедших до правила «320 кбит/с»',
  !/^sounds\/voice\//m.test(база),база.split('\n').filter(l=>l.startsWith('sounds/voice/')).slice(0,3));

 /* ── 8. новость, версия, руководство ── */
 const свод=await page.evaluate(()=>{
  const гл=GUIDE.find(g=>/Живая речь народов/i.test(g.title));
  const титры=GUIDE.find(g=>/Кто написал эти звуки/i.test(g.title));
  const н=NEWS.find(n=>n.v===21)||{};
  return {v:GAME_VERSION,title:document.title,news:NEWS_V,н:н.н||"",т:н.т||"",
   глава:гл?гл.body.join(" "):"",титры:титры?титры.body.join(" "):""};});
 const gradle=fs.readFileSync(path.join(ROOT,'android','app','build.gradle'),'utf8');
 check('8. выпуск новостей 21 и версия 3.7; глава о живой речи называет голоса, титры — Gemini и условия',
  свод.v==="3.7"&&/Alpha 3\.7/.test(свод.title)&&/versionName '3\.7'/.test(gradle)&&свод.news===21
  &&/Gemini/.test(свод.н+свод.т)&&/четыреста семь/.test(свод.т)
  &&["Algenib","Charon","Orus","Enceladus","Achird","Puck","Gacrux","Sulafat","Achernar","Leda","Iapetus","Erinome","Algieba"].every(v=>свод.глава.includes(v))
  &&/Gemini/.test(свод.титры)&&/Additional Terms of Service/.test(свод.титры),
  {v:свод.v,news:свод.news,н:свод.н});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
