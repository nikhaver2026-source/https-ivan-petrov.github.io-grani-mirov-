/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 222: СКАЗИТЕЛЬ ПОЁТ ПОД АРФУ — «В ЛАД» И «ПОД ПЕРЕБОР»

   Просьба игрока: сказитель поёт песни под музыкальный инструмент, и так,
   чтобы одни песни совпадали с инструментом, а другие шли под него как
   под аккомпанемент. Во всех сборках — веб, Android, Windows.

   1. Восемь баллад двух родов: четыре «в лад» (арфа вторит голосу нота в
      ноту), четыре «под перебор» (у арфы свой ровный перебор).
   2. Файлы — MP3 320 кбит/с, 44,1 кГц, стерео, 55–90 секунд; арфа —
      VSCO-2 Community Edition (CC0), записано в CREDITS.
   3. Арфа звучит с первых секунд: в зачине, до голоса, не тишина.
   4. Сказитель у дороги и певец в таверне говорят, как звучит арфа в этой
      песне, и песня звучит файлом.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync,spawnSync}=require('child_process');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.FILES=[];const bf=Bank.file.bind(Bank);Bank.file=function(p,o){FILES.push(String(p));return bf(p,o);};
  window.SAID=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,...a){SAID.push(String(t));return n0(t,...a);};});

 /* ── 1 ── */
 const роды=await page.evaluate(()=>({лад:BALLADS.filter(b=>b.лад==="лад").map(b=>b.id),перебор:BALLADS.filter(b=>b.лад==="перебор").map(b=>b.id),
  фЛад:Ballads.арфа(BALLADS.find(b=>b.лад==="лад")),фПер:Ballads.арфа(BALLADS.find(b=>b.лад==="перебор")),файлы:BALLADS.map(b=>Ballads.файл(b))}));
 check('1. восемь баллад: четыре «в лад» и четыре «под перебор», у каждой своё слово об арфе',
  роды.лад.length===4&&роды.перебор.length===4&&/вторит/.test(роды.фЛад)&&/перебор/.test(роды.фПер),роды);

 /* ── 2 ── */
 const плохие=[];const тишина=[];
 for(const f of роды.файлы){
  const p=path.join(ROOT,'sounds',f);
  if(!fs.existsSync(p)){плохие.push({f,нет:true});continue;}
  const j=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=bit_rate,sample_rate,channels:format=duration','-of','json',p]).toString());
  const st=j.streams[0],d=+j.format.duration;
  if(+st.bit_rate<320000||+st.sample_rate!==44100||+st.channels!==2||d<55||d>90)плохие.push({f,br:st.bit_rate,sr:st.sample_rate,ch:st.channels,d});
  /* ── 3: громкость зачина (0,8–4,5 с), где поёт одна арфа ── */
  const err=spawnSync('ffmpeg',['-hide_banner','-nostats','-ss','0.8','-t','3.7','-i',p,'-af','volumedetect','-f','null','-'],{encoding:'utf8'}).stderr||'';
  const m=err.match(/mean_volume:\s*(-?[\d.]+) dB/);
  if(!m||+m[1]<-50)тишина.push({f,mean:m&&m[1]});
 }
 const cr=fs.readFileSync(path.join(ROOT,'sounds/ballad/CREDITS.md'),'utf8');
 check('2. песни — MP3 320 кбит/с, 44,1 кГц, стерео, 55–90 с; арфа VSCO-2 CE (CC0) записана в CREDITS',
  плохие.length===0&&/VSCO-2/.test(cr)&&/CC0/.test(cr),плохие);
 check('3. в зачине каждой песни звучит арфа, а не тишина',тишина.length===0,тишина);

 /* ── 4 ── */
 const рассказ=await page.evaluate(async()=>{
  const r={};G.gold=100;G.balladsHeard=[];
  const ev=EVENTS.find(e=>e.id==="bard_road");const c=cellContent(G.x,G.y);
  r.текст=ev.text(c);
  SAID.length=0;FILES.length=0;ev.choices(c)[0].run();r.дорога=SAID.find(t=>/Сказитель поёт/.test(t))||"";
  await new Promise(res=>setTimeout(res,2900));r.файлДорога=FILES.some(f=>/ballad\//.test(f));
  SAID.length=0;FILES.length=0;tavernService("song");r.таверна=SAID.find(t=>/Певец/.test(t))||"";
  await new Promise(res=>setTimeout(res,2500));r.файлТаверна=FILES.some(f=>/ballad\//.test(f));
  safeFn(()=>Ballads.stop(true));return r;});
 check('4. сказитель — с арфой; у дороги и в таверне сказано, как звучит арфа, и песня звучит файлом',
  /арф/.test(рассказ.текст)&&/(вторит|перебор)/.test(рассказ.дорога)&&/арф/.test(рассказ.таверна)&&/(вторит|перебор)/.test(рассказ.таверна)
  &&рассказ.файлДорога&&рассказ.файлТаверна,рассказ);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
