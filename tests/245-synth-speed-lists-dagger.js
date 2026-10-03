/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 245: 9.5 — БЫСТРЫЙ СИНТЕЗАТОР, СПИСКИ СТРЕЛКАМИ, НОВЫЙ КИНЖАЛ,
   ТОЛЬКО ПОЛНЫЕ СБОРКИ

   Жалобы игрока:
   • RHVoice (из NVDA) отвечает медленно;
   • синтезатор, договаривающий незаписанное, медленный и тихий рядом с
     голосом Gemini — нужен свой темп до 7,0 и своя громкость;
   • выбор синтезатора — стрелками вправо и влево, Enter раскрывает список,
     по нему — вверх и вниз;
   • голос Gemini перебивает фразу обозника и торговца при покупке;
   • звук кинжала «очень плохой»;
   • выкладывать только полные сборки.

   1. Ползунки «Скорость синтезатора» (1–7) и «Громкость синтезатора»
      (10–200 %): синтез получает свой темп и громкость, записи Gemini — свой.
   2. Запасной синтезатор голоса Gemini говорит темпом и громкостью синтезатора.
   3. Списки в окне: вправо и влево — соседний пункт; Enter раскрывает список,
      вверх и вниз — выбор, Enter — выбрать, Escape — закрыть без изменений.
   4. Мост Windows: речь RHVoice и eSpeak звучит потоком (waveOut) по мере
      синтеза; темп приходит множителем, предел RHVoice поднят до пяти.
   5. Покупка: игра ждёт, пока доиграет живой голос жителя (и из пакета).
   6. Кинжал: свои записи без потерь (FLAC 48 кГц / 24 бит) — удар, взмах
      простого кинжала, выхватывание.
   7. Сборки: обычных архивов и APK нет, выпуски несут ссылку на полные.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
const flac=f=>{const b=fs.readFileSync(f);if(b.slice(0,4).toString()!=="fLaC")return null;
 const si=b.slice(8,8+34);const sr=(si[10]<<12)|(si[11]<<4)|(si[12]>>4);const ch=((si[12]>>1)&7)+1;const bits=(((si[12]&1)<<4)|(si[13]>>4))+1;return {sr,ch,bits};};
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const ctx=await browser.newContext();const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{window.__calls=[];
  window.GraniTTS={speak(t,r,v,id){__calls.push([String(t),r,v]);setTimeout(()=>window.GraniTTSDone&&GraniTTSDone(id),20);},stop(){},isSpeaking(){return false;},setVoice(){},
   getVoices(){return JSON.stringify([{id:"A",name:"Aleksandr — RHVoice",lang:"ru-RU",local:true}]);}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 /* ── 1 ── */
 const п1=await p.evaluate(async()=>{
  const r=document.getElementById("setSynthRate"),v=document.getElementById("setSynthVol");
  const шкала={rmin:r&&r.min,rmax:r&&r.max,vmin:v&&v.min,vmax:v&&v.max};
  r.value=7;r.dispatchEvent(new Event("input"));v.value=150;v.dispatchEvent(new Event("input"));
  settings.rate=5;__calls.length=0;
  Speech.say("Число 48217 и имя Зарубаэль",{interrupt:true});await new Promise(z=>setTimeout(z,1200));
  const c=__calls.find(x=>/48217/.test(x[0]));
  return {шкала,вызов:c,set:[settings.synthRate,settings.synthVol],темпGemini:Speech.gvTempo(settings.rate)};});
 check('1. «Скорость синтезатора» 1–7 и «Громкость синтезатора» 10–200 %: синтез говорит своим темпом и громкостью',
  п1.шкала.rmin==="1"&&п1.шкала.rmax==="7"&&п1.шкала.vmin==="10"&&п1.шкала.vmax==="200"
  &&п1.вызов&&п1.вызов[1]===7&&Math.abs(п1.вызов[2]-1.5)<1e-9&&п1.set[0]===7&&п1.set[1]===1.5,п1);

 /* ── 2 ── */
 const src=fs.readFileSync(path.join(R,'index.html'),'utf8');
 check('2. запасной синтезатор голоса Gemini — темпом и громкостью синтезатора; записи — темпом озвучки',
  /запас\.speak\(t,\{rate:self\.synthRate\(\),volume:self\.synthVolume\(o\.volume\)/.test(src)
  &&/rate:синтез\?this\.synthRate\(\):\+settings\.rate\|\|1/.test(src)&&/const темп=self\.gvTempo\(o\.rate\)/.test(src));

 /* ── 3 ── */
 await p.evaluate(()=>{CMD.settings("tts");setCursor(document.getElementById("setVerbosity"),true);});
 const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(80);};
 const st=()=>p.evaluate(()=>{const el=document.getElementById("setVerbosity");return {v:el.value,size:el.size,раскрыт:!!SelKeys.el,окно:(activeLayer()||{}).id};});
 const ш=[];
 await key('ArrowRight');ш.push(await st());await key('ArrowLeft');ш.push(await st());
 await key('Enter');ш.push(await st());await key('ArrowUp');ш.push(await st());
 await key('Escape');ш.push(await st());
 await key('Enter');await key('ArrowDown');await key('Enter');ш.push(await st());
 check('3. список: вправо — следующий, влево — прежний; Enter раскрывает, вверх — выбор, Escape — закрыть без изменений, Enter — выбрать',
  ш[0].v==="full"&&ш[1].v==="normal"&&ш[2].раскрыт&&ш[2].size>1&&ш[3].v==="brief"&&!ш[4].раскрыт&&ш[4].v==="normal"&&ш[4].окно==="modal-settings"
  &&!ш[5].раскрыт&&ш[5].v==="full",ш);

 /* ── 4 ── */
 const {CS_SOURCE,Sapi}=require(path.join(R,'desktop','sapi.js'));
 check('4. мост: RHVoice и eSpeak звучат потоком (waveOut) по мере синтеза; темп — множителем, предел RHVoice — пять',
  /class GraniWave/.test(CS_SOURCE)&&/waveOutOpen/.test(CS_SOURCE)&&/waveOutWrite/.test(CS_SOURCE)&&/sink\(a, rate\)/.test(CS_SOURCE)
  &&/max_rate=5/.test(CS_SOURCE)&&/public static double Tempo/.test(CS_SOURCE)&&/RhSpeak\(rh, p\[4\], tempo, vol2\)/.test(CS_SOURCE)
  &&Sapi.rate(7)==="7.00"&&Sapi.rate(0.5)==="0.50");

 /* ── 5 ── */
 const п5=await p.evaluate(()=>{const a=new Audio();a.src="sounds/gvoice_pack/npc/x.flac";
  Object.defineProperty(a,"paused",{value:false});
  Bank.shots=Bank.shots||[];a.__voice=true;Bank.shots.push(a);const да=Folk.звучитЛи();Bank.shots.pop();return {да,после:Folk.звучитЛи()};});
 check('5. покупка: пока звучит голос жителя (и из голосового пакета), игра не перебивает его своей фразой',
  п5.да===true&&п5.после===false&&/m\.ждётЖителя/.test(src),п5);

 /* ── 6 ── */
 const т=await p.evaluate(()=>({swing:WEAPON_TIERS.dagger.swing,draw:WEAPON_TIERS.dagger.draw,hit:WEAPON_SOUND.dagger.hit,
  файлы:[...SOUND_BANK.blade_dagger.f,...SOUND_BANK.w_dagger_draw_t0.f,...SOUND_BANK.w_dagger_swing_t1.f,...SOUND_BANK.w_dagger_swing_t0.f]}));
 const форматы=т.файлы.map(f=>flac(path.join(R,'sounds',f)));
 const кредит=fs.readFileSync(path.join(R,'sounds','blade','CREDITS.md'),'utf8')+fs.readFileSync(path.join(R,'sounds','weapons','CREDITS.md'),'utf8');
 check('6. кинжал: удар, взмах простого кинжала и выхватывание — свои записи без потерь (FLAC 48 кГц / 24 бит), авторы записаны',
  т.swing[0]==="w_dagger_swing_t0"&&т.swing[1]==="w_dagger_swing_t1"&&т.draw[0]==="w_dagger_draw_t0"&&т.hit[0]==="blade_dagger"
  &&форматы.every(x=>x&&x.sr===48000&&x.bits===24)&&т.файлы.every(f=>кредит.includes(path.basename(f).replace(/_0\d\.flac$/,"")))
  &&/apple-cut/.test(кредит)&&/Dagger_Hit_Metal/.test(кредит),{т,форматы});

 /* ── 7 ── */
 const wa=fs.readFileSync(path.join(R,'.github','workflows','android.yml'),'utf8');
 const ww=fs.readFileSync(path.join(R,'.github','workflows','windows.yml'),'utf8');
 check('7. выкладываются только полные сборки: обычного APK, AAB и архива нет, выпуски несут ссылку на полные',
  /-full\.apk/.test(wa)&&!/grani-mirov-[\d.]+\.(apk|aab)\b/.test(wa)&&/gh release create android-latest --target/.test(wa)
  &&/windows-full\.zip/.test(ww)&&!/GraniMirov-[\d.]+-windows\.zip/.test(ww)&&!/voices\.zip/.test(ww)&&/gh release create windows-latest --target/.test(ww)
  &&/upload-artifact/.test(wa)&&/upload-artifact/.test(ww));

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
