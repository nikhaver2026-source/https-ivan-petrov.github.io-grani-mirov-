"""release155h.py — книги открываются быстро и читаются целиком (жалоба игрока: «некоторые книги открываются медленно,
прочитанные — быстро, а иногда очень долго; либо не всё прочитывает синтезатор, либо книга открывается не полностью»).
Правки основы игры (index_before_mater.html):
 1. Окно книги не называет себя и фокус садится молча: страницу читает сама книга («Книга раскрыта. …»); раньше
    название окна и строка под фокусом начинали звучать — грузили записи, запускали синтезатор — и через 0,9 с их
    обрывал текст книги. Текст идёт раньше: 0,45 с после открытия (0,3 — при листании).
 2. Записанные куски страницы плеер открывает заранее, сразу при открытии окна, — при первом чтении так же быстро,
    как при повторном.
 3. Голос Gemini: за каждым куском синтезатора — свой сторож: не начал звучать за 1,6 с и молчит — подать ещё раз,
    потом идти дальше; звучит втрое дольше возможного — снять. Раньше уроненный синтезатором кусок держал чтение,
    пока общий сторож речи через ~40 с не перескакивал дальше, теряя остаток страницы.
 4. Голос Gemini честно говорит, звучит ли он (запись играет, синтезатор говорит или идёт переход между кусками), и
    общий сторож речи замечает его тишину за полторы секунды, как у синтезатора устройства.
 5. eSpeak: длинный текст считается по предложениям — первое звучит сразу, следующее считается, пока звучит
    предыдущее; раньше весь текст считался целиком в главном потоке, и игра стояла, пока не досчитает.
Повторный запуск ничего не меняет."""
B="/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read();n=0
def rep(a,b):
    global s,n
    if b in s:return
    assert s.count(a)==1,("нет или не один раз",a[:90],s.count(a))
    s=s.replace(a,b,1);n+=1
# 1. окно книги — молча; фокус — молча; текст раньше
rep('''function openModal(id){const m=document.getElementById(id);if(!m||!m.hidden)return;''',
    '''function openModal(id,о){const m=document.getElementById(id);if(!m||!m.hidden)return;''')
rep(''' safeFn(()=>{
  const имя=modalTitleText(m);
  const пункт=cb?((cb.dataset&&cb.dataset.speak)||(cb.textContent||"").trim().replace(/\\s+/g," ")):"";''',
''' safeFn(()=>{
  /* (15.5) Окно, которое представит себя само (книга читает «Книга раскрыта. …»), себя не называет: иначе его
     имя начинало звучать — грузило записи и синтезатор — и тут же обрывалось текстом окна. */
  if(о&&о.тихо)return;
  const имя=modalTitleText(m);
  const пункт=cb?((cb.dataset&&cb.dataset.speak)||(cb.textContent||"").trim().replace(/\\s+/g," ")):"";''')
rep(''' if(m.hidden)openModal("modal-read");
 const первыйПункт=body.querySelector("button");if(первыйПункт)первыйПункт.focus();''',
''' if(m.hidden)openModal("modal-read",{тихо:true});
 /* (15.5) Фокус — молча: страницу читает сама книга, строка под фокусом не начинает звучать, чтобы её тут же
    оборвали. Записанные куски страницы плеер открывает сразу — к началу чтения они готовы. */
 const первыйПункт=body.querySelector("button");if(первыйПункт){silentFocus=true;try{первыйПункт.focus();}catch(_){}silentFocus=false;}
 const текстКниги=`${/свиток|связка/.test(какая)?"Свиток развёрнут":первый?"Книга раскрыта":"Страница открыта"}. ${родКниги.n[0].toUpperCase()+родКниги.n.slice(1)}: ${e.title}. ${e.body.join(" ")}`;
 safeFn(()=>Speech.gvWarmText(текстКниги,4));''')
rep('''  narrate(`${что}. ${родКниги.n[0].toUpperCase()+родКниги.n.slice(1)}: ${e.title}. ${e.body.join(" ")}`,{interrupt:true,pri:1,cat:"read"});}),первый?900:650);''',
    '''  narrate(текстКниги,{interrupt:true,pri:1,cat:"read"});}),первый?450:300);''')
# 2. записанные куски длинного текста — заранее (Speech.gvWarmText); warm принимает предел
rep('''   warm(urls){if(Плееры.вкл)return 0;let n=0;
    (urls||[]).slice(0,3).forEach(u=>{if(!u||пул.has(u))return;try{const a=аудио(u);a.preload="auto";a.load();n++;}catch(_){}});
    return n;},''',
'''   warm(urls,сколько){if(Плееры.вкл)return 0;let n=0;
    (urls||[]).slice(0,Math.max(1,Math.min(6,сколько||3))).forEach(u=>{if(!u||пул.has(u))return;try{const a=аудио(u);a.preload="auto";a.load();n++;}catch(_){}});
    return n;},''')
rep(''' gvWarm(texts){try{const a=this.adapter;if(!a||a.name!=="gemini"||!a.warm)return 0;''',
''' /* (15.5) Записанные куски одного длинного текста (страница книги) — заранее, все сразу (до четырёх). */
 gvWarmText(text,сколько){try{const a=this._adapter();if(!a||a.name!=="gemini"||!a.warm)return 0;
  let x=String(text||"").replace(/\\s+/g," ").trim();if(!x)return 0;if(typeof deskText==="function")x=deskText(x);
  return a.warm(this.gvParts(x).filter(p=>p.url).map(p=>p.url),сколько||6);}catch(_){return 0;}},
 gvWarm(texts){try{const a=this.adapter;if(!a||a.name!=="gemini"||!a.warm)return 0;''')
# 3–4. голос Gemini: сторож куска синтезатора; честное «звучит ли»; записи — заранее
rep('''  let ток=0,эл=null,идёт=false;
  const стоп=()=>{const a=эл;эл=null;if(a){try{a.onended=null;a.onerror=null;a.pause();}catch(_){}}};
  const аудио=url=>{let a=пул.get(url);''',
'''  let ток=0,эл=null,идёт=false,послШаг=0;
  const стоп=()=>{const a=эл;эл=null;if(a){try{a.onended=null;a.onerror=null;a.pause();}catch(_){}}};
  const аудио=url=>{let a=пул.get(url);''')
rep('''    const мой=++ток;стоп();идёт=true;
    let начато=false;
    const старт=()=>{if(!начато){начато=true;if(o.onstart)o.onstart();}};
    const темп=self.gvTempo(o.rate);
    let шаг=null;
    const голосом=(t,i)=>{
     if(!запас){шаг(i+1);return;}
     старт();
     const ok=запас.speak(t,{rate:self.synthRate(),volume:self.synthVolume(o.volume),onstart(){},
      onend(){if(мой===ток)шаг(i+1);},onerror(){if(мой===ток)шаг(i+1);}});
     if(!ok)шаг(i+1);};
    шаг=i=>{
     if(мой!==ток)return;''',
'''    const мой=++ток;стоп();идёт=true;послШаг=Date.now();
    let начато=false;
    const старт=()=>{if(!начато){начато=true;if(o.onstart)o.onstart();}};
    const темп=self.gvTempo(o.rate);
    /* (15.5) Записанные куски — заранее: плеер открывает их сразу, пока звучит первый. */
    if(!Плееры.вкл)safeFn(()=>части.filter(x=>x.url).slice(0,4).forEach(x=>{if(!пул.has(x.url)){const a=аудио(x.url);a.preload="auto";a.load();}}));
    let шаг=null;
    /* ── КУСОК СИНТЕЗАТОРА ПОД СТОРОЖЕМ (15.5) ──
       Синтезатор устройства после частых обрывов иногда молча роняет фразу: не начинает её и не сообщает о конце.
       Раньше цепочка ждала этот конец, и чтение страницы стояло, пока общий сторож речи (для длинного куска —
       около сорока секунд) не перескакивал дальше, теряя остаток. Теперь у куска свой сторож: не начал звучать
       за 1,6 с и молчит — подать ещё раз; снова молчит или звучит втрое дольше возможного — следующий кусок. */
    const голосом=(t,i)=>{
     if(!запас){шаг(i+1);return;}
     старт();послШаг=Date.now();
     let закрыт=false,попытка=0,начат=false;const t0=Date.now();
     const темпС=Math.max(0.5,Math.min(5,self.synthTempo(self.synthRate())));
     const предел=2500+Math.round(String(t).length/(14*темпС)*1000*3);
     let сторож=null,тихо=0;
     const дальше=()=>{if(закрыт)return;закрыт=true;clearInterval(сторож);if(мой===ток)шаг(i+1);};
     const подать=()=>{const моя=++попытка;
      return запас.speak(t,{rate:self.synthRate(),volume:self.synthVolume(o.volume),onstart(){if(моя===попытка)начат=true;},
       onend(){if(моя===попытка&&мой===ток)дальше();},onerror(){if(моя===попытка&&мой===ток)дальше();}});};
     if(!подать()){дальше();return;}
     сторож=setInterval(()=>{if(закрыт||мой!==ток){clearInterval(сторож);return;}
      const прошло=Date.now()-t0;const говорит=safeFn(()=>!!(запас.speaking&&запас.speaking()),true);
      тихо=говорит?0:тихо+1;if(говорит)послШаг=Date.now();
      if(!начат&&!говорит&&прошло>1600&&попытка<2){safeFn(()=>Речь.записать("игра","синтезатор уронил кусок — подан снова (Gemini)",t));
       try{запас.cancel();}catch(_){}setTimeout(()=>{if(!закрыт&&мой===ток&&!подать())дальше();},120);return;}
      if((тихо>=3&&прошло>1800)||прошло>предел){if(прошло>предел)try{запас.cancel();}catch(_){}
       safeFn(()=>Речь.записать("игра",(прошло>предел?"кусок звучал втрое дольше":"синтезатор умолк без конца")+" — сторож куска снял (Gemini)",t));дальше();}},500);};
    шаг=i=>{
     if(мой!==ток)return;
     послШаг=Date.now();''')
rep('''   cancel(){ток++;идёт=false;стоп();if(запас)запас.cancel();},
   /* ── СОСЕДИ НАГОТОВЕ (9.5.2, просьба игрока) ──''',
'''   cancel(){ток++;идёт=false;стоп();if(запас)запас.cancel();},
   /* (15.5) Звучит ли голос Gemini на самом деле: играет запись, говорит синтезатор — или идёт переход между
      кусками (открывается следующая запись). Общий сторож речи по этому замечает тишину за полторы секунды. */
   звучит(){if(!идёт)return false;if(эл&&!эл.paused)return true;
    try{if(запас&&запас.speaking&&запас.speaking())return true;}catch(_){}
    return Date.now()-послШаг<1800;},
   /* ── СОСЕДИ НАГОТОВЕ (9.5.2, просьба игрока) ──''')
# общий сторож речи: тишину голоса Gemini замечает так же, как у синтезатора устройства
rep('''   else if(a&&a.name==="native")говорит=safeFn(()=>!!a.speaking(),true);
   тихо=говорит?0:тихо+1;
   const умолк=a&&(a.name==="web"||a.name==="native")&&тихо>=2&&прошло>1500;''',
'''   else if(a&&a.name==="native")говорит=safeFn(()=>!!a.speaking(),true);
   /* (15.5) Голос Gemini — по тому, звучит ли запись или синтезатор: застрявший кусок снимается за полторы секунды. */
   else if(a&&a.name==="gemini"&&a.звучит)говорит=safeFn(()=>!!a.звучит(),true);
   тихо=говорит?0:тихо+1;
   const умолк=a&&(a.name==="web"||a.name==="native"||(a.name==="gemini"&&!!a.звучит))&&тихо>=2&&прошло>1500;''')
# 5. eSpeak: длинный текст — по предложениям
rep('''   speak(text,o){
    if(!ESpeak.ready()){ESpeak.load();return запас?запас.speak(text,o):false;}
    const мой=++ток;стоп();
    let wav=null;try{wav=ESpeak.wav(String(text),self.synthRate(),self.synthVolume(o.volume),пол);}catch(_){wav=null;}
    if(!wav)return запас?запас.speak(text,o):false;''',
'''   speak(text,o){
    if(!ESpeak.ready()){ESpeak.load();return запас?запас.speak(text,o):false;}
    const мой=++ток;стоп();
    /* (15.5) Длинный текст — по предложениям: первое звучит сразу, следующее считается, пока звучит
       предыдущее. Раньше весь текст считался целиком в главном потоке, и игра стояла, пока не досчитает. */
    const куски=(()=>{const t=String(text);if(t.length<140)return null;const ss=t.match(/[^.!?…;]+[.!?…;]*/g)||[t];const out=[];
     ss.forEach(x=>{x=x.trim();if(!x)return;if(out.length&&out[out.length-1].length<60)out[out.length-1]+=" "+x;else out.push(x);});return out.length>1?out:null;})();
    if(куски){let k=0,готов=null,начат=false;идёт=true;
     const синт=x=>{try{return ESpeak.wav(x,self.synthRate(),self.synthVolume(o.volume),пол);}catch(_){return null;}};
     const следующий=()=>{if(мой!==ток)return;
      if(k>=куски.length){стоп();идёт=false;if(o.onend)o.onend();return;}
      const w=готов||синт(куски[k]);готов=null;k++;if(!w){следующий();return;}
      const a=(self._плеер&&self._открыто&&self._открыто.плеер)?self._плеер:new Audio();
      if(ссылка){try{URL.revokeObjectURL(ссылка);}catch(_){}}ссылка=URL.createObjectURL(w);эл=a;
      a.onended=()=>{if(мой!==ток||эл!==a)return;следующий();};
      a.onerror=()=>{if(мой!==ток||эл!==a)return;следующий();};
      try{a.playbackRate=1;a.defaultPlaybackRate=1;a.volume=Math.max(0,Math.min(1,+o.volume||1));}catch(_){}
      try{a.src=ссылка;const pr=Звук.играть(a,"речь",{повтор:false});if(!начат){начат=true;if(o.onstart)o.onstart();}
       if(pr&&pr.catch)pr.catch(()=>{if(мой===ток&&эл===a)следующий();});}catch(_){следующий();return;}
      setTimeout(()=>{if(мой===ток&&k<куски.length&&!готов)готов=синт(куски[k]);},40);};
     следующий();return true;}
    let wav=null;try{wav=ESpeak.wav(String(text),self.synthRate(),self.synthVolume(o.volume),пол);}catch(_){wav=null;}
    if(!wav)return запас?запас.speak(text,o):false;''')
# 6. страница книги обрывает речь окон (имя закрытого окна, «выбрано»), а не ждёт её конца
rep("""   if(m.interrupt&&m.pri<=1){this._dropQueued(2,"CANCELLED");this._push(m);return m;}
   this._push(m);return m;}""",
"""   /* (15.5) Книга главнее речи окон: страница, которую игрок открыл, обрывает имя закрытого или открытого окна
      и «выбрано», а не ждёт их конца (тревогу, итог дела и вести — не трогает). */
   if(m.interrupt&&m.cat==="read"&&cur.pri>=1&&!cur.keep&&!cur.herald&&(cur.cat==="ui"||cur.cat==="menu"||cur.nav)){
    this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this._pushFront(m);this._pump();return m;}
   if(m.interrupt&&m.pri<=1){this._dropQueued(2,"CANCELLED");this._push(m);return m;}
   this._push(m);return m;}""")
open(B,"w",encoding="utf-8").write(s);print("правок",n)
