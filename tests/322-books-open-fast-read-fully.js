/* ════════════════════════════════════════════════════════════════════════
   НАБОР 322: КНИГИ ОТКРЫВАЮТСЯ СРАЗУ И ЧИТАЮТСЯ ДО КОНЦА (15.5)

   Жалоба игрока: «иногда книги открываются медленно; прочитанные — быстро, а
   иногда очень долго»; «не всё игра прочитывает синтезатором, либо книга
   открывается не полностью, хотя фрагменты небольшие». Причины: окно книги
   объявляло себя и строку под фокусом, и объявление обрывалось; чтение ждало
   за объявлением закрытия прежнего окна; у кусков, которые читает синтезатор
   внутри голоса Gemini, не было своего сторожа (запнувшийся кусок держал
   чтение до сорока секунд и терял остаток); eSpeak считал длинный текст
   целиком; при краткой и минимальной подробности строка книги, на которую
   игрок перешёл сам, обрезалась до одной-двух фраз.
   1. Окно книги открывается молча: ни имени окна, ни строки под фокусом;
      чтение начинается со слов «Книга раскрыта» через 0,45 с, перелистнутая
      страница («Страница открыта») — через 0,3 с.
   2. Чтение обрывает объявление окна («Окно … закрыто») и не ждёт его.
   3. При краткой и минимальной подробности строка книги, на которую игрок
      перешёл сам, и строка, которую он нажал, звучат целиком; речь мира
      по-прежнему сокращается.
   4. Голос Gemini: кусок, который синтезатор уронил (не начал и молчит),
      подаётся ещё раз, а молчащий — снимается, и чтение идёт дальше до
      конца (onDone), без общего сторожа.
   5. eSpeak читает длинный текст по предложениям: первое — сразу, следующее
      считается, пока звучит текущее; короткий — целиком. Латиница — русскими
      буквами (английского словаря в сборке нет: прежде слово молчало).
   5б. Знаки, на которых eSpeak прежде лез в английский словарь («×», «−», «→», «·», «–», неразрывный
      пробел, кавычки-лапки, буквы с надстрочными знаками, греческие, «1-2», «-5», одинокое «…»), — словами
      или паузой: ни одной ошибки словаря; римское число после слова — цифрой («акт II» — «акт 2»).
      (16.0, долгая игра) И тире в начале реплики, после знака и после реплики в кавычках («— Пять», «Итог: — 5»,
      «Стой!» — кричит), тире вплотную к числу или слову («—5», «слово—слово»), висячий дефис («слово-», «-слово»,
      «сине- и»), дефис между буквой и числом («Е-2»), многоточие в начале фразы («...Вы»); дефис внутри слова
      («кто-то», «красно-белый») остаётся.
   4б. Кусок без единой записи голос Gemini отдаёт запасному синтезатору
      целиком и «звучит», пока тот говорит: общий сторож речи не снимает его
      через две секунды как тишину (так терялся остаток страницы).
   6. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));let словарь=0;page.on('console',m=>{if(/_dict/.test(m.text()))словарь++;});
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};window.meetCaravan=()=>false;
  safeFn(()=>{Actors.tick=()=>{};});
  window.FAKE={log:[],cancels:0,cur:null,
   speak(text,o){this.log.push({t:text,ms:performance.now()});this.cur=o;setTimeout(()=>{try{o.onstart&&o.onstart();}catch(e){}},0);return true;},
   cancel(){this.cancels++;this.cur=null;},speaking(){return !!this.cur;},
   end(){const o=this.cur;this.cur=null;if(o&&o.onend)o.onend();},reset(){this.log=[];this.cancels=0;this.cur=null;}};
  window.ФЕЙК=()=>{Speech.adapter=window.FAKE;Speech._chunk=t=>[String(t)];Speech.stop();Speech.recent.clear();FAKE.reset();
   settings.speech=1;settings.autoSpeech=1;settings.verbosity="normal";settings.srMode="auto";};
  ФЕЙК();
  window.КНИГА=()=>{const L=knowLayout();for(let i=0;i<L.total;i++){const e=knowEntry(i);if(e&&e.body&&e.body.some(b=>(String(b).match(/[.!?…]/g)||[]).length>=3))return i;}return 0;};});

 /* ── 1. окно молча, чтение через 0,45 с / 0,3 с ── */
 const о1=await page.evaluate(async()=>{ФЕЙК();const n=КНИГА();const t0=performance.now();openReading(n,true);
  await new Promise(q=>setTimeout(q,900));const a=FAKE.log.map(x=>({t:x.t.slice(0,40),ms:Math.round(x.ms-t0)}));
  FAKE.end();FAKE.reset();const t1=performance.now();openReading(n,false);await new Promise(q=>setTimeout(q,700));
  const b=FAKE.log.map(x=>({t:x.t.slice(0,40),ms:Math.round(x.ms-t1)}));FAKE.end();while(activeLayer())closeTopUI();return {a,b};});
 const чтение=о1.a.find(x=>/^Книга раскрыта/.test(x.t)),лист=о1.b.find(x=>/^Страница открыта/.test(x.t));
 check('1. окно книги открывается молча (ни имени окна, ни строки под фокусом); «Книга раскрыта» — через 0,45 с, «Страница открыта» — через 0,3 с',
  о1.a.length===1&&чтение&&чтение.ms>=420&&чтение.ms<=650&&о1.b.length===1&&лист&&лист.ms>=270&&лист.ms<=500,о1);

 /* ── 2. чтение обрывает объявление окна ── */
 const о2=await page.evaluate(async()=>{ФЕЙК();Speech.say("Окно «Инвентарь» закрыто. Игровое поле.",{cat:"ui",pri:1,interrupt:true});
  await new Promise(q=>setTimeout(q,30));const c0=FAKE.cancels;
  narrate("Книга раскрыта. Трактат: Проба. Первая строка.",{interrupt:true,pri:1,cat:"read"});await new Promise(q=>setTimeout(q,30));
  const r={обрыв:FAKE.cancels>c0,сейчас:FAKE.log.length?FAKE.log[FAKE.log.length-1].t.slice(0,20):"",очередь:Speech.queue.length};FAKE.end();return r;});
 check('2. чтение обрывает объявление окна и звучит сразу, а не после него',о2.обрыв&&/^Книга раскрыта/.test(о2.сейчас)&&о2.очередь===0,о2);

 /* ── 3. подробность: строка книги целиком ── */
 const о3=await page.evaluate(async()=>{const r={};const n=КНИГА();
  for(const v of ["brief","min"]){ФЕЙК();settings.verbosity=v;openReading(n,true);await new Promise(q=>setTimeout(q,600));FAKE.end();FAKE.reset();
   const кн=[...document.querySelectorAll("#readBody button")];const стр=кн.find(b=>(b.dataset.speak.match(/[.!?…]/g)||[]).length>=3)||кн[1];
   lastAnnounced="";setCursor(стр);await new Promise(q=>setTimeout(q,30));const листнул=FAKE.log.length?FAKE.log[FAKE.log.length-1].t:"";FAKE.end();FAKE.reset();
   стр.click();await new Promise(q=>setTimeout(q,30));const нажал=FAKE.log.length?FAKE.log[FAKE.log.length-1].t:"";FAKE.end();FAKE.reset();
   Speech.say("Первая фраза. Вторая фраза. Третья фраза, лишняя.",{pri:2});await new Promise(q=>setTimeout(q,30));const мир=FAKE.log.length?FAKE.log[0].t:"";FAKE.end();
   r[v]={строка:стр.dataset.speak.length,листнул:листнул.length,нажал:нажал.length,мир};while(activeLayer())closeTopUI();}
  settings.verbosity="normal";return r;});
 check('3. при краткой и минимальной подробности строка книги — и пролистанная, и нажатая — звучит целиком; речь мира сокращается',
  ["brief","min"].every(v=>о3[v].листнул===о3[v].строка&&о3[v].нажал===о3[v].строка)&&о3.brief.мир==="Первая фраза. Вторая фраза."&&о3.min.мир==="Первая фраза.",о3);

 /* ── 4. голос Gemini: уроненный кусок — ещё раз, молчащий — снимается, чтение до конца ── */
 const о4=await page.evaluate(async()=>{const r={};Speech.stop();
  /* запасной синтезатор, который роняет первый кусок (не начинает, молчит), а остальные говорит */
  let подач=0;const фал={name:"fake",speak(t,o){подач++;const моя=подач;if(моя===1){this._идёт=false;return true;}this._идёт=true;
    setTimeout(()=>{try{o.onstart&&o.onstart();}catch(_){}},10);setTimeout(()=>{this._идёт=false;try{o.onend&&o.onend();}catch(_){}},300);return true;},
   cancel(){this._идёт=false;},speaking(){return !!this._идёт;}};
  const fb0=Speech._gvFallback;Speech._gvFallback=()=>фал;const a=Speech._geminiAdapter();Speech._gvFallback=fb0;
  Speech.gvLoad();const t00=performance.now();while(Speech.gvLoad().state!=="ready"&&performance.now()-t00<8000)await new Promise(q=>setTimeout(q,100));
  /* первый кусок — запись (тогда куски синтезатора идут под своим сторожем), дальше — синтезатор */
  const запись=(Speech.gvParts("Инвентарь.")[0]||{}).url||null;r.запись=!!запись;
  const gp0=Speech.gvParts;Speech.gvParts=t=>[{url:запись,t:"Инвентарь."},{url:null,t:"Первый кусок синтезатора."},{url:null,t:"Второй кусок синтезатора."},{url:null,t:"Третий кусок."}];
  const ж0=Речь.журнал.length;const t0=performance.now();let конец=null;
  a.speak("три куска",{rate:1,volume:1,onend(){конец=performance.now()-t0;}});
  while(performance.now()-t0<9000&&конец==null)await new Promise(q=>setTimeout(q,50));
  Speech.gvParts=gp0;
  r.конец=конец==null?null:Math.round(конец);r.подач=подач;r.журнал=Речь.журнал.slice(ж0).map(x=>x.что).filter(x=>/Gemini/.test(x));return r;});
 check('4. Gemini: кусок, который синтезатор уронил, подан ещё раз; чтение дошло до конца за секунды, а не через сорок',
  о4.запись&&о4.конец!=null&&о4.конец<8000&&о4.подач>=4&&о4.журнал.some(x=>/подан снова/.test(x)),о4);

 /* ── 4б. кусок без единой записи — целиком у запасного синтезатора, и голос Gemini «звучит», пока тот говорит ── */
 const о4б=await page.evaluate(async()=>{const r={};Speech.stop();
  const фал={name:"fake",speak(t,o){this._идёт=true;setTimeout(()=>{try{o.onstart&&o.onstart();}catch(_){}},10);setTimeout(()=>{this._идёт=false;try{o.onend&&o.onend();}catch(_){}},2600);return true;},
   cancel(){this._идёт=false;},speaking(){return !!this._идёт;}};
  const fb0=Speech._gvFallback;Speech._gvFallback=()=>фал;const a=Speech._geminiAdapter();Speech._gvFallback=fb0;
  const gp0=Speech.gvParts;Speech.gvParts=t=>[{url:null,t:"Врата державы стоят у цитадели на клетке двадцать четыре."}];
  let конец=false;a.speak("кусок без записей",{rate:1,volume:1,onend(){конец=true;}});
  await new Promise(q=>setTimeout(q,1900));r.звучитНа19=a.звучит();await new Promise(q=>setTimeout(q,1000));r.конец=конец;r.звучитПосле=a.звучит();
  Speech.gvParts=gp0;return r;});
 check('4б. Gemini: кусок без единой записи звучит запасным синтезатором целиком — сторож речи не принимает его за тишину и не снимает (остаток страницы не теряется)',
  о4б.звучитНа19===true&&о4б.конец===true&&о4б.звучитПосле===false,о4б);

 /* ── 5. eSpeak: длинное — по предложениям ── */
 const о5=await page.evaluate(async()=>{const r={};ESpeak.load();const t0=performance.now();while(!ESpeak.ready()&&performance.now()-t0<15000)await new Promise(q=>setTimeout(q,100));
  r.готов=ESpeak.ready();if(!r.готов)return r;
  const w0=ESpeak.wav;const вызовы=[];ESpeak.wav=function(t){вызовы.push({n:String(t).length,ms:Math.round(performance.now()-t1)});return w0.apply(this,arguments);};
  const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const el=this;setTimeout(()=>{try{el.onended&&el.onended();}catch(_){}},60);return Promise.resolve();};
  const a=Speech._espeakAdapter();const длинный="Книга раскрыта. Трактат о древних машинах Предтеч. Первая глава рассказывает о том, как строили подъёмники. Вторая глава — о сети силы и её узлах. Третья глава говорит о стражах и о том, как их будить.";
  let конец=false;const t1=performance.now();a.speak(длинный,{volume:1,onend(){конец=true;}});
  const t2=performance.now();while(!конец&&performance.now()-t2<8000)await new Promise(q=>setTimeout(q,30));
  r.длинный={вызовов:вызовы.length,длины:вызовы.map(x=>x.n),конец};вызовы.length=0;конец=false;
  a.speak("Сумка. Карта.",{volume:1,onend(){конец=true;}});const t3=performance.now();while(!конец&&performance.now()-t3<4000)await new Promise(q=>setTimeout(q,30));
  r.короткий={вызовов:вызовы.length,конец};HTMLMediaElement.prototype.play=pl;ESpeak.wav=w0;
  r.латиница=ESpeak.кир("Нажмите F1, затем Shift и NVDA.");return r;});
 check('5. eSpeak читает длинный текст по предложениям (первое сразу, следующее — пока звучит текущее), короткий — целиком',
  о5.готов&&о5.длинный.вызовов>=2&&о5.длинный.длины.every(n=>n<150&&n>=60)&&о5.длинный.конец&&о5.короткий.вызовов===1&&о5.короткий.конец
  &&!/[A-Za-z]/.test(о5.латиница)&&/эф один/.test(о5.латиница),о5);

 /* ── 5б. eSpeak: знаки — словами или паузой, без английского словаря ── */
 const о5б=await page.evaluate(()=>{const r={};if(!ESpeak.ready())return r;
  const T=["Зелье ×3, урон −5 → щит.","Пункт · второй • третий.","Шаг 1–2, код 7-4-1, сила -5.","Он сказал „да“ и “нет”, ‘так’.","1\u00a0000 золотых, 5\u202f000 монет.",
   "Café, naïve, Ł, ß.","Ω и α, µ.","Жара 30°, ½ пуда, 5 м², 5 €.","Немота, акт II «Шов под штольнями».","…","—","Огонь 🔥 горит ★ ✓.",
   "— Пять шагов.","Итог: — 5.","«Стой!» — кричит он.","Клетка Е-2, слово-, -слово, сине- и красно-белый, кто-то.","...Вы об этом пожалеете.","Цена —5, слово—слово."];
  r.текст=T.map(t=>ESpeak.кир(ESpeak.рим(ESpeak.чист(t))));r.звук=T.map(t=>!!ESpeak.wav(t,5,1,"m"));return r;});
 await page.waitForTimeout(300);
 check('5б. eSpeak: знаки и чужие буквы — словами или паузой, ни одной ошибки английского словаря; «акт II» — «акт 2»',
  о5б.текст&&словарь===0&&о5б.текст.every(t=>/^[\t\n\r\x20-\x7E\u0410-\u044F\u0401\u0451«»—№\u0301]*$/.test(t)&&!/[A-Za-z]/.test(t))
  &&/акт 2/.test(о5б.текст[8])&&/на 3/.test(о5б.текст[0])&&/минус 5/.test(о5б.текст[2])&&о5б.текст[9]===""&&о5б.звук.slice(0,9).every(Boolean)
  &&/^\s*Пять шагов/.test(о5б.текст[12])&&о5б.текст[13]==="Итог: 5."&&!/—/.test(о5б.текст[14])
  &&/Е 2, слово, слово, сине и красно-белый, кто-то\./.test(о5б.текст[15])&&/^Вы об этом/.test(о5б.текст[16])
  &&/Цена — 5, слово — слово/.test(о5б.текст[17])&&о5б.звук.slice(12).every(Boolean),{словарь,т:о5б.текст});

 check('6. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
