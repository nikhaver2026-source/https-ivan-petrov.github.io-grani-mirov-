/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 269: 11.0 — ЕДИНЫЙ ОБРАБОТЧИК ЗВУКА И ЕДИНЫЙ ОБРАБОТЧИК РЕЧИ

   Просьба игрока: единый обработчик звука и единый обработчик речи, оба —
   самого высокого качества, чтобы со звуком не было бед ни на iPhone, ни на
   Android, ни на Windows.

   ЗВУК
   1. Все записи запускаются через Звук.играть: в файле нет ни одного
      el.play() мимо него.
   2. Отказ браузера без касания (NotAllowedError) звук не теряет: запись
      ждёт касания и звучит с ним, устаревшая — нет; обрыв (AbortError) — не
      сбой; синхронная ошибка достаётся вызывающему; пустая запись открытия
      («тихо») журнал не засоряет; речь касания не ждёт; сторож замечает
      запись, которая «играет» молча.
   3. Запись, которая не загрузилась, — в журнале с именем файла.
   4. Движок поднимается из «interrupted» (звонок на iPhone): на возврате в
      игру, даже если игра не сворачивалась; свёрнутую игру не будит; касание
      будит; из AE.ensure просит не чаще раза в три секунды.
   5. Петля, остановленная системой, заводится снова; остановленная игрой —
      нет.
   6. Слушатель касаний постоянный: касание доигрывает ждущее и открывает
      закрывшуюся дверь речи.
   РЕЧЬ
   7. Кто говорит: голос игры, персонаж, фон; жест «повторить или
      прервать»: говорит житель — тишина, а не повтор поверх него; тишина —
      повтор; говорит игра — тишина.
   8. «Стоп» глушит и голос, которого Folk по папке не знает (бог), а
      уличную реплику (фон мира) — нет.
   9. Голос, который не зазвучал, снимается, и очередь голосов идёт дальше.
   10. Синтезатор, трижды подряд не сказавший фразы, сбрасывается; удача
       обнуляет счёт.
   11. Жест, действие карты жестов, клавиши и кнопка стопа идут через Речь;
       голоса жителей запускаются со сторожем, речь — без ожидания касания;
       AE.ensure будит движок через Звук; отладочная панель знает оба
       обработчика.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 /* 1. play() — только внутри единого обработчика */
 const нач=html.indexOf('const Звук={'),кон=html.indexOf('safeFn(()=>Звук.следить());');
 const все=[];let k=-1;while((k=html.indexOf('.play()',k+1))>=0)все.push(k);
 const мимо=все.filter(x=>x<нач||x>кон).map(x=>html.slice(Math.max(0,x-70),x+8));
 check('1. все записи запускаются через Звук.играть: el.play() мимо него нет',
  нач>0&&кон>нач&&все.length>=1&&мимо.length===0,{всего:все.length,мимо:мимо.slice(0,4)});

 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  const пауза=мс=>new Promise(res=>setTimeout(res,мс));
  const тик=async()=>{for(let i=0;i<4;i++)await null;};
  const out={};
  /* Поддельный плеер: play() отвечает так, как велит испытание. */
  /* Журнал — кольцо (60 строк): новое ищем по времени и по имени файла, а не по длине. */
  const после=(t,rx)=>Звук.журнал.filter(з=>з.t>=t&&(!rx||rx.test(з.файл)));
  const плеер=(ответ,имя)=>({paused:true,ended:false,currentTime:0,src:"http://x/sounds/test/"+(имя||"x")+".flac",currentSrc:"",loop:false,error:null,__вызовов:0,слух:{},
   addEventListener(t,f){(this.слух[t]=this.слух[t]||[]).push(f);},
   removeEventListener(t,f){this.слух[t]=(this.слух[t]||[]).filter(x=>x!==f);},
   removeAttribute(){},load(){},pause(){this.paused=true;},
   play(){this.__вызовов++;const o=typeof ответ==="function"?ответ(this):ответ;
    if(o==="бросок"){const e=new Error("бросок");e.name="NotSupportedError";throw e;}
    if(o==="ок"){this.paused=false;return Promise.resolve();}
    const e=new Error(o);e.name=o;return Promise.reject(e);}});
  /* ── 2. отказы ── */
  Звук.ждут.length=0;
  /* После первого касания отказ — уже беда и идёт в журнал (до него — норма). */
  const былоPrimed0=Speech.primed;Speech.primed=true;
  const t0=Date.now();
  let раз=0;const a=плеер(()=>++раз===1?"NotAllowedError":"ок","wait_269");
  const pr=Звук.играть(a,"запись");out.обещание=!!(pr&&pr.then);
  await пауза(30);
  out.ждёт=Звук.ждут.some(з=>з.el===a);
  out.записьОтказа=после(t0,/wait_269/).some(з=>/ждёт касания/.test(з.что));
  Speech.primed=былоPrimed0;
  /* а до касания — только счёт */
  const tД=Date.now();Speech.primed=false;const до=плеер("NotAllowedError","before_269");Звук.играть(до,"запись");await пауза(20);
  out.доКасанияНеВЖурнале=после(tД,/before_269/).length===0&&Звук.ждут.some(з=>з.el===до);Speech.primed=былоPrimed0;
  Звук.касание({type:"keydown"});await пауза(30);
  out.доиграна=a.__вызовов===2&&!a.paused&&!Звук.ждут.some(з=>з.el===a);
  const b=плеер("NotAllowedError");Звук.играть(b,"шаг",{срок:50});await пауза(120);
  Звук.касание({type:"keydown"});await пауза(20);
  out.устаревшая=b.__вызовов===1;
  const сб0=Звук.счёт.сбой,t1=Date.now();const c=плеер("AbortError","abort_269");Звук.играть(c,"запись");await пауза(20);
  out.обрыв=Звук.счёт.сбой===сб0&&после(t1,/abort_269/).length===0&&!Звук.ждут.some(з=>з.el===c);
  let брошено=false;try{Звук.играть(плеер("бросок"),"запись");}catch(e){брошено=!!e&&e.name==="NotSupportedError";}
  out.бросок=брошено;
  const t2=Date.now();const e1=плеер("NotAllowedError","quiet_269");Звук.играть(e1,"запас",{тихо:true});await пауза(20);
  out.тихо=после(t2,/quiet_269/).length===0&&!Звук.ждут.some(з=>з.el===e1);
  let отказано=null;const f1=плеер("NotAllowedError");
  Звук.играть(f1,"речь",{повтор:false,наОтказ:(el,почему)=>{отказано=почему;}});await пауза(20);
  out.безПовтора=!Звук.ждут.some(з=>з.el===f1)&&отказано==="NotAllowedError";
  let сторож=null;const g1=плеер("ок");Звук.играть(g1,"голос",{повтор:false,сторож:120,наОтказ:(el,почему)=>{сторож=почему;}});
  await пауза(220);out.сторож=сторож==="сторож";
  let сторож2=null;const h1=плеер("ок");Звук.играть(h1,"голос",{повтор:false,сторож:120,наОтказ:()=>{сторож2="разбудили";}});
  (h1.слух.playing||[]).forEach(f=>f());await пауза(220);out.сторож2=сторож2===null;
  /* ── 3. записи нет на сервере ── */
  const t3=Date.now();
  const нет=new Audio("sounds/__missing_269__.flac");try{Звук.играть(нет,"запись",{повтор:false});}catch(_){}
  for(let i=0;i<30&&!после(t3,/__missing_269__/).length;i++)await пауза(100);
  out.нетФайла=после(t3,/__missing_269__/).map(з=>з.что);
  /* ── 4. движок из «interrupted» (только синхронно и микрозадачами:
     таймеры игры поддельного движка не увидят) ── */
  const настоящий=AE.ctx,былоHushed=AudioLife.hushed;
  const ложный=st=>({state:st,__звук:true,resumes:0,resume(){this.resumes++;this.state="running";return Promise.resolve();},addEventListener(){}});
  AE.ctx=ложный("interrupted");AudioLife.hushed=false;
  const t4=Date.now();
  out.возвратБезЗатишья=AudioLife.wake()===false;await тик();
  out.подъёмИзПрерван=AE.ctx.state==="running"&&AE.ctx.resumes===1&&после(t4).some(з=>/прерван/.test(з.что));
  AE.ctx=ложный("suspended");AudioLife.hushed=true;
  out.свёрнутаяМолчит=Звук.поднять("возврат")===false&&AE.ctx.resumes===0;
  Звук.касание({type:"keydown"});await тик();
  out.касаниеБудит=AudioLife.hushed===false&&AE.ctx.resumes>=1;
  AE.ctx=ложный("interrupted");AE.ctx.resume=function(){this.resumes++;return new Promise(()=>{});};
  Звук._подъём=0;AE.ensure();AE.ensure();AE.ensure();
  out.ensureРедко=AE.ctx.resumes===1;
  AE.ctx=настоящий;Звук._подъём=0;AudioLife.hushed=былоHushed;
  /* ── 5. петли ── */
  const петля=плеер("ок");петля.loop=true;
  Bank.loops.set("__испытание269",{el:петля,el2:null,paused:false,kind:"ambient",gain:1,file:"x"});
  out.петляЗаведена=Звук.петли()>=1&&петля.__вызовов===1;
  петля.paused=true;Bank.loops.get("__испытание269").paused=true;const вызовов=петля.__вызовов;
  Звук.петли();out.петляИгрыНеТрогается=петля.__вызовов===вызовов;
  Bank.loops.delete("__испытание269");
  /* ── 6. постоянный слушатель касаний ── */
  let р6=0;const k6=плеер(()=>++р6===1?"NotAllowedError":"ок");Звук.играть(k6,"запись");await пауза(20);
  window.dispatchEvent(new KeyboardEvent("keydown",{key:"Shift"}));await пауза(20);
  out.слушатель=k6.__вызовов===2;
  const о=Speech._открыто,былоРечь=о.речь,былоPrimed=Speech.primed;
  о.речь=false;Speech.primed=true;
  window.dispatchEvent(new KeyboardEvent("keydown",{key:"Shift"}));
  out.дверьРечи=Speech._открыто.речь===true||!("speechSynthesis" in window);
  о.речь=былоРечь||о.речь;Speech.primed=былоPrimed;
  /* ── 7. кто говорит и жест ── */
  const оIs=Speech.isSpeaking,оRep=Speech.repeatLast,оStop=Speech.stop,оЗвучит=Folk.звучитЛи,оСмолк=Folk.смолкнуть;
  const лог=[];
  Speech.repeatLast=function(){лог.push("повтор");return true;};
  Speech.stop=function(o){лог.push("стоп");return оStop.call(this,o);};
  Folk.смолкнуть=function(всё){лог.push("смолкнуть");return оСмолк.call(this,всё);};
  Speech.isSpeaking=()=>false;Folk.звучитЛи=()=>true;
  out.ктоЖитель=Речь.кто();out.жестЖитель=Речь.тихоИлиПовтор();out.логЖитель=лог.slice();лог.length=0;
  Folk.звучитЛи=()=>false;Folk.очередь.length=0;
  out.ктоТишина=Речь.кто();out.жестТишина=Речь.тихоИлиПовтор();out.логТишина=лог.slice();лог.length=0;
  Speech.isSpeaking=()=>true;
  out.ктоИгра=Речь.кто();out.жестИгра=Речь.тихоИлиПовтор();out.логИгра=лог.slice();лог.length=0;
  Speech.isSpeaking=оIs;Folk.звучитЛи=оЗвучит;
  /* ── 8. стоп: голос бога — да, уличная реплика — нет ── */
  const бог=плеер("ок");бог.paused=false;бог.__voice=true;бог.src=бог.currentSrc="http://x/sounds/voice_god/god_zarya_bless_g.flac";
  const улица=плеер("ок");улица.paused=false;улица.__voice=true;улица.src=улица.currentSrc="http://x/sounds/voice_npc/street_269.flac";
  Folk.фонПути.add("voice_npc/street_269.flac");
  Bank.shots.push(бог,улица);
  out.ктоСГолосами=Речь.кто();
  Речь.стоп();
  out.богЗамолк=!!бог.__stopped&&!Bank.shots.includes(бог);
  out.улицаОсталась=!улица.__stopped&&Bank.shots.includes(улица);
  out.логСтоп=лог.slice();лог.length=0;
  Bank.shots=Bank.shots.filter(x=>x!==улица);Folk.фонПути.delete("voice_npc/street_269.flac");
  Speech.repeatLast=оRep;Speech.stop=оStop;Folk.смолкнуть=оСмолк;
  /* ── 9. голос, который не зазвучал ── */
  const немой=плеер("ок");немой.__voice=true;немой.src="http://x/sounds/voice_npc/test_269.flac";
  Bank.shots.push(немой);Folk.звучитДо=Date.now()+8000;
  const tР=Date.now();
  out.снятОтвет=Речь.голосНеЗазвучал(немой,"сторож");
  out.голосСнят=!!немой.__stopped&&!Bank.shots.includes(немой);
  out.очередьДальше=Folk.звучитДо<=Date.now()+5;
  out.журналГолоса=Речь.журнал.some(з=>з.t>=tР&&/снята/.test(з.что)&&/test_269/.test(з.текст));
  /* ── 10. сброс заевшего синтезатора ── */
  const о2=Speech._открыто.речь,с0=Речь.счёт.сброс,оАд=Speech._adapter,h0=AudioLife.hushed;
  Речь.подряд=0;Речь._сбросТ=0;Speech._adapter=()=>({name:"web"});AudioLife.hushed=false;
  Речь.неСказано({text:"раз"});Речь.неСказано({text:"два"});
  out.дваБезСброса=Речь.счёт.сброс===с0;
  Речь.неСказано({text:"три"});
  out.сброс=Речь.счёт.сброс===с0+1&&Speech._открыто.речь===false&&Речь.подряд===0;
  Речь.неСказано({text:"раз"});Речь.сказано();out.удачаОбнуляет=Речь.подряд===0;
  Speech._adapter=оАд;Speech._открыто.речь=о2;AudioLife.hushed=h0;
  /* ── 11. отладочная панель ── */
  out.панельЗвук=String(Modules.get("AUDIO_MIXER_CORE").text());
  out.панельРечь=String(Modules.get("TTS").text());
  out.hub=Modules.get("AUDIO_MIXER_CORE").hub()===Звук&&Modules.get("TTS").hub()===Речь;
  out.отчёт=(Звук.отчёт()+"\n"+Речь.отчёт()).length;
  return out;});
 const места={
  жест:html.includes('if(dir==="S"){Речь.тихоИлиПовтор();return;}'),
  карта:html.includes('делать:()=>{Речь.тихоИлиПовтор();return true;}'),
  клавиша:html.includes('speechstop(){Речь.стоп();'),
  альт:html.includes('e.preventDefault();Речь.стоп();vib(15);return;}'),
  кнопка:html.includes('const sp=$("btnStopSpeech");if(sp)sp.addEventListener("click",()=>{Речь.стоп();vib(15);});'),
  голоса:(html.match(/Звук\.играть\(el,"голос",\{повтор:false,сторож:3000,наОтказ:\(e,почему\)=>Речь\.голосНеЗазвучал\(e,почему\)\}\)/g)||[]).length===2,
  речь:(html.match(/Звук\.играть\(a,"речь",\{повтор:false\}\)/g)||[]).length===2,
  ensure:html.includes('ensure(){if(this.ctx){safeFn(()=>Звук.поднять("ensure"));return this.ctx;}')};
 check('2. отказ без касания не теряет звук: ждёт и звучит с касанием, устаревшее — нет; обрыв — не сбой; ошибка — вызывающему; «тихо» не в журнале; речь касания не ждёт; сторож видит немую запись',
  r.обещание&&r.ждёт&&r.записьОтказа&&r.доКасанияНеВЖурнале&&r.доиграна&&r.устаревшая&&r.обрыв&&r.бросок&&r.тихо&&r.безПовтора&&r.сторож&&r.сторож2,
  {обещание:r.обещание,ждёт:r.ждёт,записьОтказа:r.записьОтказа,доКасания:r.доКасанияНеВЖурнале,доиграна:r.доиграна,устаревшая:r.устаревшая,обрыв:r.обрыв,бросок:r.бросок,тихо:r.тихо,безПовтора:r.безПовтора,сторож:r.сторож,сторож2:r.сторож2});
 check('3. незагруженная запись — в журнале с именем файла',r.нетФайла.length>=1,r.нетФайла);
 check('4. движок из «interrupted»: возврат без затишья поднимает, свёрнутую игру не будит, касание будит, из ensure — не чаще раза в 3 с',
  r.возвратБезЗатишья&&r.подъёмИзПрерван&&r.свёрнутаяМолчит&&r.касаниеБудит&&r.ensureРедко,
  {возврат:r.возвратБезЗатишья,подъём:r.подъёмИзПрерван,свёрнутая:r.свёрнутаяМолчит,касание:r.касаниеБудит,ensure:r.ensureРедко});
 check('5. петля, остановленная системой, заводится; остановленная игрой — нет',r.петляЗаведена&&r.петляИгрыНеТрогается,
  {заведена:r.петляЗаведена,игры:r.петляИгрыНеТрогается});
 check('6. постоянный слушатель касаний доигрывает ждущее и открывает закрывшуюся дверь речи',r.слушатель&&r.дверьРечи,
  {слушатель:r.слушатель,дверь:r.дверьРечи});
 check('7. кто говорит; жест: житель говорит — тишина, а не повтор поверх; тишина — повтор; говорит игра — тишина',
  r.ктоЖитель.includes("персонаж")&&r.жестЖитель==="тихо"&&r.логЖитель.includes("стоп")&&r.логЖитель.includes("смолкнуть")&&!r.логЖитель.includes("повтор")
  &&r.ктоТишина.length===0&&r.жестТишина==="повтор"&&r.логТишина.join()==="повтор"
  &&r.ктоИгра.includes("игра")&&r.жестИгра==="тихо"&&!r.логИгра.includes("повтор"),
  {житель:[r.ктоЖитель,r.жестЖитель,r.логЖитель],тишина:[r.ктоТишина,r.жестТишина,r.логТишина],игра:[r.ктоИгра,r.жестИгра,r.логИгра]});
 check('8. «стоп» глушит и голос бога (Folk его по папке не знает), а уличную реплику — нет',
  r.ктоСГолосами.includes("персонаж")&&r.ктоСГолосами.includes("фон")&&r.богЗамолк&&r.улицаОсталась&&r.логСтоп.includes("стоп")&&r.логСтоп.includes("смолкнуть"),
  {кто:r.ктоСГолосами,бог:r.богЗамолк,улица:r.улицаОсталась,лог:r.логСтоп});
 check('9. голос, который не зазвучал, снимается, и очередь голосов идёт дальше',r.снятОтвет&&r.голосСнят&&r.очередьДальше&&r.журналГолоса,
  {ответ:r.снятОтвет,снят:r.голосСнят,очередь:r.очередьДальше,журнал:r.журналГолоса});
 check('10. трижды не сказано — сброс синтезатора, удача обнуляет счёт',r.дваБезСброса&&r.сброс&&r.удачаОбнуляет,
  {два:r.дваБезСброса,сброс:r.сброс,удача:r.удачаОбнуляет});
 check('11. жест, карта жестов, клавиши и кнопка — через Речь; голоса со сторожем; речь без ожидания касания; ensure через Звук; панель знает оба обработчика',
  Object.values(места).every(Boolean)&&r.hub&&/Движок звука/.test(r.панельЗвук)&&/голос игры/.test(r.панельРечь)&&r.отчёт>40,
  {места,hub:r.hub,звук:r.панельЗвук.slice(-140),речь:r.панельРечь.slice(-160)});
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(x=>x.startsWith('FAIL'))?1:0);
})();
