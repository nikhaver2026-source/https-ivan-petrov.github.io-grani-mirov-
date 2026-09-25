/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 187: ЗАСТАВКА ПРИ ЗАПУСКЕ

   Просьба игрока: при запуске игры — заставка, красивая музыка и
   русскоязычный красивый качественный голос: «Добро пожаловать в Грань
   Миров. Мир, где всё возможно» — и краткая торжественная весть о мире.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Запись заставки на месте: без потерь или от 320 кбит/с, стерео,
      от двадцати до шестидесяти секунд, звучит в полную силу.
   2. При запуске (браузер разрешает звук) заставка начинает звучать сама.
   3. Пока она звучит, речь игры ждёт; любое касание или клавиша обрывает
      заставку за четверть секунды, и отложенная речь звучит.
   4. Выключенная в настройках заставка при запуске молчит; пункт
      настройки есть.
   5. Кнопка «Прослушать заставку» на главном экране запускает её снова.
   6. Титры называют музыку и голос.
   7. Под автоматикой без явной просьбы заставка сама не звучит — прочие
      проверки не ждут её полминуты.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const SND=path.join(__dirname,'..','sounds');

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  /* Под автоматикой заставка сама молчит, чтобы не задерживать прочие
     проверки; здесь её зовут явно — как у игрока. */
  window.__introAuto=true;
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),200);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){}};});

 /* ── 1. запись ── */
 await page.goto(process.argv[2]);await page.waitForTimeout(400);
 const файл=await page.evaluate(()=>SOUND_BANK.intro&&SOUND_BANK.intro.f[0]);
 const p=файл?spawnSync('ffprobe',['-v','error','-show_entries','format=bit_rate,duration:stream=channels,codec_name','-of','json',path.join(SND,файл)],{encoding:'utf8'}):null;
 let инфо=null;try{const j=JSON.parse(p.stdout);инфо={br:Math.round(+j.format.bit_rate/1000),dur:+j.format.duration,ch:j.streams[0].channels,codec:j.streams[0].codec_name};}catch(_){}
 const пик=файл?(((spawnSync('ffmpeg',['-nostdin','-hide_banner','-i',path.join(SND,файл),'-af','volumedetect','-f','null','-'],{encoding:'utf8'}).stderr||'').match(/max_volume: (-?[\d.]+) dB/)||[])[1]):null;
 check('1. запись заставки: от 320 кбит/с или без потерь, стерео, 20–60 секунд, в полную силу',
  !!инфо&&(инфо.codec==="flac"||инфо.br>=320)&&инфо.ch===2&&инфо.dur>=20&&инфо.dur<=60&&+пик>=-3,{файл,инфо,пик});

 /* ── 2. сама начинает звучать ── */
 await page.waitForTimeout(1500);
 const старт=await page.evaluate(()=>({playing:Intro.playing,done:Intro.done,src:Intro.el&&Intro.el.src.split("/sounds/")[1]}));
 check('2. при запуске заставка звучит сама',старт.playing===true&&старт.src===файл,старт);

 /* ── 3. речь ждёт; клавиша обрывает ── */
 const ждёт=await page.evaluate(async()=>{
  window.__tts.length=0;narrate("Проверка: игра хочет сказать.",{interrupt:false});
  await new Promise(r=>setTimeout(r,700));
  return {сказано:window.__tts.slice(),играет:Intro.playing};});
 /* Заставка доиграла — отложенная речь звучит. */
 const доиграла=await page.evaluate(async()=>{Intro.finish(false);await new Promise(r=>setTimeout(r,900));
  return {сказано:window.__tts.slice(),done:Intro.done};});
 check('3. пока звучит заставка, речь игры ждёт',ждёт.играет&&!ждёт.сказано.some(t=>/игра хочет сказать/.test(t)),ждёт);
 check('3б. заставка кончилась — отложенная речь звучит',доиграла.done&&доиграла.сказано.some(t=>/игра хочет сказать/.test(t)),доиграла);
 /* Снова заставка — и клавиша её обрывает за четверть секунды. */
 await page.evaluate(async()=>{CMD.intro();await new Promise(r=>setTimeout(r,1500));});
 const шла=await page.evaluate(()=>Intro.playing);
 await page.keyboard.press("Shift");
 await page.waitForTimeout(500);
 const после=await page.evaluate(()=>({играет:Intro.playing,done:Intro.done,cut:Intro.cut}));
 check('3в. любая клавиша обрывает заставку',шла&&!после.играет&&после.done&&после.cut,{шла,после});

 /* ── 4. выключатель ── */
 const пункт=await page.evaluate(()=>{const el=document.getElementById("setIntro");return !!el&&el.type==="checkbox";});
 await page.evaluate(()=>{settings.intro=0;saveSettings();});
 await page.reload();await page.waitForTimeout(1500);
 const выкл=await page.evaluate(()=>({playing:Intro.playing,el:!!Intro.el}));
 check('4. в настройках есть «Заставка при запуске»; выключенная — молчит',пункт&&!выкл.playing&&!выкл.el,{пункт,выкл});

 /* ── 5. кнопка на главном экране ── */
 const кнопка=await page.evaluate(async()=>{
  const b=document.querySelector('#screen-title button[data-cmd="intro"]');
  const r={есть:!!b,текст:b&&b.textContent};
  CMD.intro();await new Promise(t=>setTimeout(t,1200));r.играет=Intro.playing;
  Intro.stop();settings.intro=1;saveSettings();return r;});
 check('5. кнопка «Прослушать заставку» запускает её снова',кнопка.есть&&/заставк/i.test(кнопка.текст)&&кнопка.играет,кнопка);

 /* ── 6. титры ── */
 const титры=fs.existsSync(path.join(SND,"intro/CREDITS.md"))?fs.readFileSync(path.join(SND,"intro/CREDITS.md"),"utf8"):"";
 check('6. титры называют музыку, автора, лицензию, голос и источники эффектов',
  /Road to Victory/.test(титры)&&/Moonthief/.test(титры)&&/CC BY-SA 4\.0/.test(титры)&&/Gemini/.test(титры)&&/Sadaltager/.test(титры)
  &&/Sonic Pi/.test(титры)&&/CC0/.test(титры)&&/OpenClonk/.test(титры)&&/CC BY 3\.0/.test(титры),титры.slice(0,200));

 /* ── 7. автоматика без просьбы ── */
 {const p2=await ctx.newPage();
  await p2.goto(process.argv[2]);await p2.waitForTimeout(1500);
  const тихо=await p2.evaluate(()=>({webdriver:navigator.webdriver===true,playing:Intro.playing,el:!!Intro.el,
   кнопкой:(()=>{const ok=Intro.start(false);const r=Intro.playing||!!Intro.el;Intro.stop();return ok&&r;})()}));
  await p2.close();
  check('7. под автоматикой без явной просьбы заставка сама молчит, но кнопкой звучит',
   тихо.webdriver&&!тихо.playing&&тихо.кнопкой,тихо);}

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
