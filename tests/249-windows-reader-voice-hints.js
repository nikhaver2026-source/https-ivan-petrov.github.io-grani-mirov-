/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 249: 9.5 — WINDOWS: ГОЛОС ЧТЕЦА ЭКРАНА САМ, ПОДСКАЗКИ ДЛЯ КЛАВИАТУРЫ

   Жалобы игрока:
   • в приложении для Windows голос нужно было выбирать руками — пусть игра
     сама берёт движок, который стоит у игрока: NVDA или JAWS;
   • подсказки, «Что нового» и руководство в приложении для Windows
     говорили как на Android: «двойное касание», «свайп», «два пальца».

   1. Мост: запущен NVDA — по умолчанию голос NVDA; только JAWS — голос JAWS;
      чтец не запущен — синтезатор и голос из настроек NVDA (nvda.ini).
   2. Игра на Windows сама берёт помеченный мостом голос чтеца; в списке
      голосов первый пункт — «Сам: голос вашего чтеца экрана».
   3. Выбрал игрок другой голос — игра его не перебивает; «Сам» возвращает
      голос чтеца.
   4. Жест в речи и подсказке становится клавишей той же команды (с учётом
      переназначения), касание — Enter и стрелками, TalkBack — NVDA или JAWS.
   5. «Что нового», руководство и окна в приложении для Windows — без
      жестов и касаний; в браузере и на телефоне тексты прежние.
   6. Голосов Microsoft в приложении для Windows нет совсем (они медленные):
      ни в мосте, ни в списке игры, ни голосами Chromium; без чтеца говорит
      RHVoice или eSpeak NG, что идут вместе с игрой.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const R=path.join(__dirname,'..');
(async()=>{
 /* ── 1 ── */
 const {autoVoiceName,nvdaIni,isMsVoice}=require(path.join(R,'desktop','sapi.js'));
 const голоса=[{name:"Microsoft Irina",kind:"sapi",default:true,lang:"ru-RU"},{name:"Aleksandr",kind:"rhvoice",lang:"ru-RU"},{name:"Anna",kind:"rhvoice",lang:"ru-RU"},
  {name:"eSpeak NG — Russian",kind:"espeak",lang:"ru-RU"}];
 const nv=autoVoiceName(голоса.concat([{name:"NVDA — голос чтеца экрана",kind:"sr"},{name:"JAWS — голос чтеца экрана",kind:"sr"}]),{synth:"",voice:""});
 const jw=autoVoiceName(голоса.concat([{name:"JAWS — голос чтеца экрана",kind:"sr"}]),{synth:"",voice:""});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'grani-nvda-'));fs.mkdirSync(path.join(tmp,'nvda'));
 fs.writeFileSync(path.join(tmp,'nvda','nvda.ini'),"schemaVersion = 11\n[speech]\n\tsynth = RHVoice\n\t[[RHVoice]]\n\t\tvoice = Anna\n\t\trate = 60\n[[espeak]]\n");
 const ad0=process.env.APPDATA;process.env.APPDATA=tmp;const ini=nvdaIni();process.env.APPDATA=ad0;
 const изIni=autoVoiceName(голоса,ini);
 const безВсего=autoVoiceName(голоса,{synth:"",voice:""},"");
 /* без запущенного чтеца: голос SAPI 5 и голос Windows из настроек NVDA, голос из настроек JAWS */
 const сапи=autoVoiceName(голоса.concat([{name:"Elena",kind:"sapi",lang:"ru-RU"}]),{synth:"sapi5",voice:"HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Speech\\Voices\\Tokens\\RHVoice_Elena"},"");
 const виндовс=autoVoiceName(голоса.concat([{name:"Microsoft Pavel",kind:"onecore",lang:"ru-RU"}]),{synth:"onecore",voice:"HKEY\\Tokens\\MSTTS_V110_ruRU_PavelM"},"");
 const джос=autoVoiceName(голоса,{synth:"",voice:""},"[Options]\nSynthesizer=sapi5\nVoice=Aleksandr");
 check('1. мост: NVDA запущен — голос NVDA; только JAWS — голос JAWS; без чтеца — голос из настроек NVDA (RHVoice, eSpeak, SAPI 5) или JAWS, которым мост говорит сам; иначе RHVoice — не голос Microsoft',
  /^NVDA/.test(nv)&&/^JAWS/.test(jw)&&ini.synth==="rhvoice"&&ini.voice==="Anna"&&изIni==="Anna"&&безВсего==="Aleksandr"&&сапи==="Elena"&&виндовс==="Aleksandr"&&джос==="Aleksandr",{nv,jw,ini,изIni,безВсего,сапи,виндовс,джос});

 const browser=await chromium.launch();
 const errors=[];
 const открыть=async(desk)=>{const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(d=>{window.__voice="";
   if(d)window.graniDesktop={version:"9.5.1",platform:"win32",quit(){}};
   window.GraniTTS={speak(t,r,v,id){setTimeout(()=>window.GraniTTSDone&&GraniTTSDone(id),20);},stop(){},isSpeaking(){return false;},setVoice(n){window.__voice=n;},
    getVoices(){return JSON.stringify([{id:"Aleksandr",name:"Aleksandr",lang:"ru-RU",local:true,engine:"RHVoice из дополнения NVDA, без NVDA"},
     {id:"NVDA — голос чтеца экрана",name:"NVDA — голос чтеца экрана",lang:"ru-RU",local:true,engine:"чтец экрана, NVDA",auto:true},
     {id:"Microsoft Pavel",name:"Microsoft Pavel",lang:"ru-RU",local:true,engine:"Windows"}]);}};},desk);
  await p.goto(process.argv[2]);await p.waitForTimeout(900);
  await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});
  return p;};

 /* ── 2, 3 ── */
 const p=await открыть(true);
 const п2=await p.evaluate(()=>{const t=document.getElementById("setTtsEngine");if(t){t.value="device";t.dispatchEvent(new Event("change"));}
  Speech.fillVoices();const sel=document.getElementById("setVoice");
  const r={первый:sel.options[0]&&sel.options[0].textContent,значение:sel.value,голос:(Speech._nativeVoice||{}).name,мосту:window.__voice};
  Speech.pickVoice("native:Aleksandr",{say:false});Speech.fillVoices();
  r.ручной=(Speech._nativeVoice||{}).name;r.авто=settings.voiceAuto;
  Speech.pickVoice("auto",{say:false});r.снова=(Speech._nativeVoice||{}).name;r.авто2=settings.voiceAuto;
  return r;});
 check('2. на Windows игра сама берёт голос чтеца экрана; первый пункт списка — «Сам: голос вашего чтеца экрана»',
  /^Сам: голос вашего чтеца экрана — сейчас NVDA/.test(п2.первый||"")&&п2.значение==="auto"&&/^NVDA/.test(п2.голос||"")&&/^NVDA/.test(п2.мосту||""),п2);
 check('3. выбранный игроком голос не перебивается; «Сам» возвращает голос чтеца',
  п2.ручной==="Aleksandr"&&п2.авто===0&&/^NVDA/.test(п2.снова||"")&&п2.авто2===1,п2);

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{const r={};
  r.a=deskText("Двойное касание — карточка и сделка.");
  r.b=deskText("Свайп вправо — следующая сцена, свайп влево — прежняя.");
  r.c=deskText("Два пальца вниз — закрыть окно. Свайп тремя пальцами вниз — инвентарь.");
  r.d=deskText("Касание двумя пальцами — собрать ресурс. Подходит для TalkBack и VoiceOver.");
  keyBind("inv","KeyZ");r.e=deskText("Свайп тремя пальцами вниз — инвентарь.");keyReset();
  const said=[];const s0=Speech.enqueue.bind(Speech);const п=Speech.queue;
  r.речь=deskText("Двойным касанием одним пальцем выберите пункт.");
  return r;});
 check('4. жест становится клавишей той же команды (и после переназначения), касание — Enter и стрелками, TalkBack — NVDA или JAWS',
  п4.a==="Enter — карточка и сделка."&&/^Стрелка вправо — следующая сцена, стрелка влево — прежняя\.$/.test(п4.b)
  &&/^Клавиша Esc — закрыть окно\. Клавиша I — инвентарь\.$/.test(п4.c)&&/^Клавиша F — собрать ресурс\. Подходит для NVDA или JAWS\.$/.test(п4.d)
  &&/Клавиша Z — инвентарь/.test(п4.e)&&/^Клавишей Enter выберите пункт\.$/.test(п4.речь),п4);

 /* ── 5 ── */
 const re=/свайп|касани|пальц|TalkBack|VoiceOver/i;
 const п5=await p.evaluate(async src=>{const re=new RegExp(src,"i");const out={};
  CMD.whatsnew();await new Promise(r=>setTimeout(r,150));out.новости=(activeLayer()?activeLayer().textContent:"").split(/(?<=[.!?])\s/).filter(l=>re.test(l)).slice(0,3);
  while(activeLayer())closeTopUI();
  openGuide();await new Promise(r=>setTimeout(r,150));let g="";
  for(const b of [...activeLayer().querySelectorAll("[data-cmd]")].slice(0,40)){try{b.click();}catch(_){}await new Promise(r=>setTimeout(r,15));g+=" "+(activeLayer()?activeLayer().textContent:"");}
  out.рук=g.split(/(?<=[.!?])\s/).filter(l=>re.test(l)).slice(0,3);out.длина=g.length;
  while(activeLayer())closeTopUI();
  /* речь тоже проходит перевод */
  const сказано=[];const sp=window.GraniTTS.speak;window.GraniTTS.speak=function(t,r,v,id){сказано.push(String(t));return sp.apply(this,arguments);};
  Speech.say("Свайп двумя пальцами вниз — закрыть окно.",{interrupt:true});await new Promise(r=>setTimeout(r,600));
  window.GraniTTS.speak=sp;out.сказано=сказано.join(" | ");
  return out;},re.source);
 const pw=await открыть(false);
 const п5б=await pw.evaluate(()=>({перевод:deskText("Двойное касание — карточка."),окно:document.body.textContent.includes("касани")}));
 check('5. «Что нового», руководство, окна и речь на Windows — без жестов и касаний; в браузере тексты прежние',
  !п5.новости.length&&!п5.рук.length&&п5.длина>1000&&!/свайп|пальц/i.test(п5.сказано)&&п5б.перевод==="Двойное касание — карточка."&&п5б.окно,{п5,п5б});

 /* ── 6 ── */
 const мс=[{name:"Microsoft Irina",kind:"sapi",vendor:"Microsoft"},{name:"Microsoft Pavel",kind:"onecore"},{name:"Elena",kind:"platform"},{name:"Aleksandr",kind:"rhvoice"},{name:"Acapela Alyona",kind:"sapi",vendor:"Acapela"},{name:"NVDA — голос чтеца экрана",kind:"sr"}].map(v=>v.name+":"+isMsVoice(v));
 const п6=await p.evaluate(()=>{const все=Speech.allVoices().map(v=>v.name);const список=Speech.voices().map(v=>v.name);
  let web=0;try{web=(speechSynthesis.getVoices()||[]).length;}catch(_){}
  settings.voiceAuto=0;settings.voice="";Speech._nativeVoice=null;Speech.voice=null;Speech.adapter=null;Speech._kind=null;const t=document.getElementById("setTtsEngine");if(t){t.value="device";t.dispatchEvent(new Event("change"));}
  const a=Speech._adapter();return {все,список,web,адаптер:a&&a.name};});
 check('6. голосов Microsoft на Windows нет: мост их не отдаёт, в списке игры их нет, Chromium не говорит; говорит мост',
  мс.join()==="Microsoft Irina:true,Microsoft Pavel:true,Elena:true,Aleksandr:false,Acapela Alyona:false,NVDA — голос чтеца экрана:false"
  &&!п6.все.some(n=>/microsoft/i.test(n))&&!п6.список.some(n=>/microsoft/i.test(n))&&п6.все.includes("Aleksandr")&&п6.адаптер==="native",{мс,п6});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
