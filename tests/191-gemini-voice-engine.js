/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 191: ИГРА ГОВОРИТ ГОЛОСОМ GEMINI; ПОДЗЕМЕЛЬЕ СЛЫШНО СКВОЗЬ МУЗЫКУ

   Просьбы игрока (версия 3.9): «встроенный синтезатор неразборчивый,
   некачественный и с медленным откликом — сгенерируй голос Gemini и
   реализуй его как синтезатор с быстрым откликом»; «усиль фоновые звуки
   подземелья — с музыкой их не слышно».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Опись записей (sounds/gvoice/bank_2.js) грузится; записей не меньше
      тысячи; у каждой есть файл, лишних файлов нет; все — FLAC без потерь,
      моно, 24 кГц.
   2. Титры папки называют Gemini, голос Iapetus и условия Gemini API; число
      записей в титрах совпадает с описью.
   3. «Голос Gemini» — первый пункт выбора синтезатора; у игрока он по
      умолчанию, под автоматикой — нет (проверки слушают синтезатор
      устройства).
   4. Прежний выбор «синтезатор устройства» или «встроенный голос» один раз
      меняется на Gemini; голос ElevenLabs не трогается.
   5. Записанная фраза звучит записью сразу — меньше чем через 30 мс после
      команды, без синтезатора; темп — ползунок скорости, высота голоса
      сохраняется.
   6. Смешанный текст: записанное предложение — записью, остальное —
      синтезатором устройства, по порядку и без пропусков.
   7. Незаписанный текст целиком говорит синтезатор устройства.
   8. Новая фраза обрывает недосказанную запись.
   9. Пункты окна настроек почти все записаны: не меньше восьмидесяти
      процентов текста звучит голосом Gemini.
  10. Под землёй музыка звучит на 0,6 своей громкости, наверху — полностью.
  11. Петли глубины выровнены: копии без потерь «_n», не тише −23 LUFS;
      под землёй фон места идёт с долей 0,95.
  12. Приложение для Android (есть мост GraniTTS) и браузер — одна версия
      3.9, и в приложении тоже говорит голос Gemini: пункт выбора есть,
      выпуск о нём есть, записи кладутся в сборку.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');const SND=path.join(ROOT,'sounds');const GV=path.join(SND,'gvoice');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_name,channels,sample_rate','-of','json',file],{encoding:'utf8'});
 try{const s=JSON.parse(p.stdout).streams[0];return {c:s.codec_name,ch:s.channels,sr:+s.sample_rate};}catch(_){return null;}}
function lufs(file){
 const p=spawnSync('ffmpeg',['-nostdin','-i',file,'-af','ebur128','-f','null','-'],{encoding:'utf8'});
 const m=[...String(p.stderr).matchAll(/I:\s+(-?[\d.]+) LUFS/g)];return m.length?+m[m.length-1][1]:null;}

(async()=>{
 /* ── 1. опись и файлы ── */
 const js=fs.readFileSync(path.join(GV,'bank_2.js'),'utf8');
 const bank=JSON.parse(js.slice(js.indexOf('{'),js.lastIndexOf('}')+1));
 const ids=Object.values(bank.p);const файлы=fs.readdirSync(GV).filter(f=>f.endsWith('.flac'));
 const нет=ids.filter(id=>!fs.existsSync(path.join(GV,id+'.flac')));
 const лишние=файлы.filter(f=>ids.indexOf(f.slice(0,-5))<0);
 const выборка=ids.filter((_,i)=>i%Math.max(1,Math.floor(ids.length/60))===0);
 const плохие=выборка.map(id=>({id,i:probe(path.join(GV,id+'.flac'))})).filter(x=>!x.i||x.i.c!=='flac'||x.i.ch!==1||x.i.sr!==24000);
 check('1. опись записей голоса Gemini: не меньше тысячи фраз, у каждой файл, лишних нет, FLAC моно 24 кГц',
  ids.length>=1000&&new Set(ids).size===ids.length&&нет.length===0&&лишние.length===0&&плохие.length===0,
  {фраз:ids.length,нет:нет.slice(0,3),лишние:лишние.slice(0,3),плохие:плохие.slice(0,3)});

 /* ── 2. титры ── */
 const титры=fs.readFileSync(path.join(GV,'CREDITS.md'),'utf8');
 const числа=(титры.match(/Записей:\s*(\d+)/)||[])[1];
 check('2. титры называют Gemini, голос Iapetus и условия; число записей совпадает с описью',
  /Gemini/.test(титры)&&/Iapetus/.test(титры)&&/gemini-3\.8-flash-tts/.test(титры)&&/ai\.google\.dev\/gemini-api\/terms/.test(титры)
  &&+числа===ids.length,{числа,фраз:ids.length});

 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);

 /* ── 3. выбор и умолчание ── */
 const выбор=await page.evaluate(()=>{const e=document.getElementById("setTtsEngine");
  const r={первый:e&&e.options[0].value,подпись:e&&e.options[0].text,автоматика:gvDefaultEngine(),сейчас:settings.ttsEngine};
  window.__gvAuto=true;r.игрок=gvDefaultEngine();window.__gvAuto=false;return r;});
 check('3. «Голос Gemini» — первый пункт выбора синтезатора; у игрока по умолчанию, под автоматикой — синтезатор устройства',
  выбор.первый==="gemini"&&/Gemini/.test(выбор.подпись)&&выбор.игрок==="gemini"&&выбор.автоматика==="device"&&выбор.сейчас==="device",выбор);

 /* ── 4. перенос прежнего выбора ── */
 const перенос=[];
 for(const [было,ждём] of [["grani","gemini"],["device","gemini"],["eleven","eleven"]]){
  const c2=await browser.newContext();
  await c2.addInitScript(b=>{try{window.__gvAuto=true;window.__introAuto=false;
   localStorage.setItem("gm29set",JSON.stringify({ttsEngine:b,rateFast:1,elevenKey:"ключ-для-проверки",elevenVoice:"v"}));}catch(_){}},было);
  const p2=await c2.newPage();await p2.goto(process.argv[2]);await p2.waitForTimeout(500);
  const r=await p2.evaluate(()=>({e:settings.ttsEngine,f:settings.gvOn}));
  перенос.push([было,r.e,r.f]);await c2.close();
  if(r.e!==ждём||r.f!==1)перенос.push("ПРОМАХ");}
 check('4. прежний синтезатор устройства и встроенный голос один раз меняются на Gemini, ElevenLabs остаётся',
  перенос.indexOf("ПРОМАХ")<0&&перенос.length===3,перенос);

 /* ── 5–8. адаптер ── */
 const адаптер=await page.evaluate(async()=>{
  const log=[];const pl=HTMLMediaElement.prototype.play,pa=HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play=function(){if(/gvoice/.test(this.src))log.push({k:"play",f:this.src.split('/').pop(),r:this.playbackRate,pp:this.preservesPitch!==false,t:performance.now()});return pl.call(this);};
  HTMLMediaElement.prototype.pause=function(){if(/gvoice/.test(this.src))log.push({k:"pause",f:this.src.split('/').pop(),t:performance.now()});return pa.call(this);};
  speechSynthesis.speak=u=>{log.push({k:"tts",x:u.text,t:performance.now()});setTimeout(()=>{try{u.onstart&&u.onstart();u.onend&&u.onend();}catch(_){}},30);};
  try{window.GraniTTS=undefined;}catch(_){}
  settings.ttsEngine="gemini";Speech.adapter=null;Speech._kind=null;Speech.gvLoad();
  for(let i=0;i<40&&Speech.GVOICE.state!=="ready";i++)await new Promise(r=>setTimeout(r,50));
  const ключи=Object.keys(Speech.GVOICE.map||{});
  const запись=window.GVOICE_BANK&&window.GVOICE_BANK.top&&ключи.find(k=>Speech.GVOICE.map[k]===window.GVOICE_BANK.top[0]);
  const фраза=Speech.gvParts("Игровое поле.")[0].url?"Игровое поле.":запись;
  const out={state:Speech.GVOICE.state,фраза,темпОжидаем:Speech.gvTempo(settings.rate)};
  const ждать=ms=>new Promise(r=>setTimeout(r,ms));
  Speech.stop();log.length=0;
  const t0=performance.now();Speech.say(фраза,{interrupt:true});
  await ждать(120);out.п5=log.slice();out.t0=t0;
  Speech.stop();await ждать(80);log.length=0;
  Speech.say(фраза+" Золота прибавилось 1234 монеты.",{interrupt:true});
  await ждать(4000);out.п6=log.slice();
  Speech.stop();await ждать(80);log.length=0;
  Speech.say("Квазимодо восемнадцать раз прыгнул через Зюйдвестский мост.",{interrupt:true});
  await ждать(300);out.п7=log.slice();
  Speech.stop();await ждать(80);log.length=0;
  Speech.say(фраза,{interrupt:true});await ждать(40);
  Speech.say("Квазимодо прыгнул через мост.",{interrupt:true,user:true});await ждать(150);
  out.п8=log.slice();
  return out;});
 const п5=адаптер.п5.find(x=>x.k==="play");
 check('5. записанная фраза звучит записью сразу (меньше 30 мс), без синтезатора; темп — ползунок скорости, высота сохраняется',
  адаптер.state==="ready"&&!!п5&&п5.t-адаптер.t0<30&&!адаптер.п5.some(x=>x.k==="tts")
  &&Math.abs(п5.r-адаптер.темпОжидаем)<0.01&&п5.pp,{state:адаптер.state,фраза:адаптер.фраза,п5:адаптер.п5.slice(0,3),t0:адаптер.t0,темп:адаптер.темпОжидаем});
 const п6=адаптер.п6.filter(x=>x.k==="play"||x.k==="tts");
 check('6. смешанный текст: записанное — записью, затем остальное — синтезатором устройства, по порядку',
  п6.length===2&&п6[0].k==="play"&&п6[1].k==="tts"&&/1234/.test(п6[1].x)&&п6[1].t>=п6[0].t,адаптер.п6);
 check('7. незаписанный текст целиком говорит синтезатор устройства',
  !адаптер.п7.some(x=>x.k==="play")&&адаптер.п7.filter(x=>x.k==="tts").length===1,адаптер.п7);
 const п8=адаптер.п8;const ip=п8.findIndex(x=>x.k==="play"),ipa=п8.findIndex(x=>x.k==="pause"),itt=п8.findIndex(x=>x.k==="tts");
 check('8. новая фраза обрывает недосказанную запись',ip>=0&&ipa>ip&&itt>ipa,п8);

 /* ── 9. покрытие окна настроек ── */
 const покрытие=await page.evaluate(async()=>{
  const окна=[];let знаков=0,записано=0;const мимо=[];
  for(const g of [undefined,"sound","tts","speech","ui","gest","diff","save"]){
   try{for(let i=0;i<8&&activeLayer();i++)closeTopUI();}catch(_){}
   try{CMD.settings(g);}catch(_){}await new Promise(r=>setTimeout(r,150));
   const lay=navLayer();if(!lay)continue;
   visibleInteractive(lay).forEach(el=>{
    let t=el.dataset&&el.dataset.speak||el.getAttribute("aria-label")||(el.textContent||"").trim().replace(/\s+/g," ");
    if(!t)t=labelTextOf(el);if(!t||t.length>120)return;
    const n=t.length,c=Speech.gvCover(t);знаков+=n;записано+=n*c;if(c<1&&мимо.length<12)мимо.push(t);});}
  try{for(let i=0;i<8&&activeLayer();i++)closeTopUI();}catch(_){}
  return {доля:записано/Math.max(1,знаков),знаков,мимо};});
 check('9. пункты окна настроек записаны: не меньше восьмидесяти процентов текста звучит голосом Gemini',
  покрытие.доля>=0.8,{доля:Math.round(покрытие.доля*1000)/10,знаков:покрытие.знаков,мимо:покрытие.мимо});

 /* ── 10–11. подземелье ── */
 const глубь=await page.evaluate(()=>{
  const было=G.place;const r={};
  G.place=null;r.наверху=depthMusicDuck();r.музыкаНаверху=Bank.vol("music");
  G.place={depth:2,bx:1,by:1,kind:"dungeon",stype:"dungeon"};r.внизу=depthMusicDuck();r.музыкаВнизу=Bank.vol("music");
  const вызовы=[];const l0=Bank.loop.bind(Bank);
  Bank.loop=function(ch,role,o){вызовы.push([ch,role,o&&o.gain]);return null;};
  try{bankUpdateAmbient();}catch(e){r.ошибка=String(e);}
  Bank.loop=l0;G.place=было;
  r.вызовы=вызовы;r.петли=DEPTH_LOOP.map(k=>SOUND_BANK[k]&&SOUND_BANK[k].f[0]);return r;});
 check('10. под землёй музыка звучит на 0,6 своей громкости, наверху — полностью',
  глубь.наверху===1&&глубь.внизу===0.6&&(глубь.музыкаНаверху===0||Math.abs(глубь.музыкаВнизу/глубь.музыкаНаверху-0.6)<0.001),глубь);
 const уровни=глубь.петли.map(f=>[f,f&&lufs(path.join(SND,f))]);
 const место=глубь.вызовы.find(x=>x[0]==="place");
 check('11. петли глубины выровнены: «_n.flac», не тише −23 LUFS; под землёй фон места идёт с долей 0,95',
  уровни.every(([f,l])=>/_n\.flac$/.test(f||"")&&l!==null&&l>=-23)&&!!место&&место[2]===0.95,{уровни,вызовы:глубь.вызовы});

 /* ── 12. приложение и браузер ── */
 const браузер=await page.evaluate(()=>({v:GAME_VERSION,title:document.title,on:GVOICE_ON,n23:NEWS.some(n=>n.v===23)}));
 const cA=await browser.newContext();
 await cA.addInitScript(()=>{window.GraniTTS={speak(){},stop(){},isSpeaking(){return false;},getVoices(){return "[]";}};window.__gvAuto=true;
  try{localStorage.setItem("gm29set",JSON.stringify({ttsEngine:"gemini",rateFast:1}));}catch(_){}});
 const pA=await cA.newPage();await pA.goto(process.argv[2]);await pA.waitForTimeout(600);
 const прил=await pA.evaluate(()=>{try{CMD.settings("tts");}catch(_){}
  const e=document.getElementById("setTtsEngine");
  return {v:GAME_VERSION,title:document.title,on:GVOICE_ON,вид:Speech._wantKind(),пункт:!!(e&&e.querySelector('option[value="gemini"]')),
   n23:NEWS.some(n=>n.v===23),nv:NEWS_V,движок:settings.ttsEngine};});
 await cA.close();
 const сборка=fs.readFileSync(path.join(ROOT,'.github','workflows','android.yml'),'utf8');
 check('12. приложение для Android и браузер — одна версия 3.9; в приложении тоже голос Gemini, записи идут в сборку',
  браузер.v==="3.9"&&/Alpha 3\.9/.test(браузер.title)&&браузер.on&&браузер.n23
  &&прил.v==="3.9"&&/Alpha 3\.9/.test(прил.title)&&прил.on&&прил.вид==="gemini"&&прил.пункт&&прил.n23&&прил.движок==="gemini"
  &&!/sounds\/gvoice/.test(сборка)&&/cp -r sounds/.test(сборка)&&/grani-mirov-3\.9\.apk/.test(сборка),{браузер,прил});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
