/* ════════════════════════════════════════════════════════════════════════
   ЕДИНЫЕ ОБРАБОТЧИКИ РЕЧИ И ЗВУКА (после 17.0)
   Разбор обработчиков в сборке 17.0 и решение игрока: «делай всё по тому
   порядку, который ты указал… чтобы игроку ничего не приходилось проверять,
   и всё работало у него на устройстве корректно — как на телефоне, так и на
   компьютере».
   З2. Фон места меняется сразу при смене места: часы звуковой картины тикают
       раз в полторы секунды, и до тика фон поверхности мог звучать в ярусе.
   Р2. Предложение — одним голосом: если в предложении записана только часть,
       а незаписанный остаток длиннее короткого значения (четыре слова и
       больше, без чисел), всё предложение звучит синтезатором, а не запись и
       синтезатор попеременно. Шаблоны «метка: значение» («Погода: туман»,
       «Здоровье: 40 из 50») звучат как прежде.
   З3. У каждого звука — итог: звучит, вокруг (ушёл в звуки вокруг героя),
       выключено, нет записи, не дано (теснота, правило места), не зазвучал,
       ошибка плеера. Итог виден на самом плеере (__итог) и попадает в журнал.
   З6. Журнал речи и звука: что сказано, снято, устарело, сведено; какие звуки
       не прозвучали и почему. Раздел «Звук» меню действий — «Журнал речи и
       звука»: сводка, последние сбои, сохранение в файл.
   Р1. Свежая речь мира: фоновые вести (событие, окружение, описание, предмет,
       приближение), пришедшие из разных моментов, не копятся хвостом — в
       очереди не больше двух новейших; фоновая весть, прождавшая дольше пяти
       секунд, снимается. Мысль, сказанная в одном такте (несколько фраз
       подряд), режется только целиком; ответы на действия игрока, итоги,
       опасность, книги и разговоры не трогаются.
   ════════════════════════════════════════════════════════════════════════ */
const ЖурналРЗ={N:120,речь:[],звук:[],счёт:{речь:{},звук:{}},
 /* вид: «речь» или «звук»; итог — короткое слово; что — фраза или роль звука */
 добавить(вид,итог,что,всегда){
  try{const с=this.счёт[вид];с[итог]=(с[итог]||0)+1;
   /* «сказано» и «звучит» — только счётом: иначе шаги и щелчки вытеснят сбои из журнала */
   if(!всегда&&(итог==="сказано"||итог==="звучит"))return;
   const сп=this[вид];сп.push({t:Date.now(),итог:String(итог),что:String(что||"").slice(0,80)});
   if(сп.length>this.N)сп.splice(0,сп.length-this.N);}catch(_){}},
 очистить(){this.речь=[];this.звук=[];this.счёт={речь:{},звук:{}};},
 сводка(вид){const с=this.счёт[вид];const к=Object.keys(с);if(!к.length)return "пока пусто";
  return к.sort((a,b)=>с[b]-с[a]).map(x=>`${x} — ${с[x]}`).join(", ");},
 текст(){
  const время=t=>{const d=new Date(t);return d.toTimeString().slice(0,8);};
  const L=[`Грань Миров ${typeof GAME_VERSION!=="undefined"?GAME_VERSION:""} — журнал речи и звука, ${new Date().toLocaleString("ru-RU")}`,
   `Устройство: ${navigator.userAgent}`,"",`Речь: ${this.сводка("речь")}.`,`Звук: ${this.сводка("звук")}.`,"","Речь, последние события:"];
  this.речь.forEach(z=>L.push(`${время(z.t)}  ${z.итог}: ${z.что}`));
  L.push("","Звук, последние сбои и перенаправления:");this.звук.forEach(z=>L.push(`${время(z.t)}  ${z.итог}: ${z.что}`));
  return L.join("\n");}};

/* ── З2. Фон места — сразу при смене места ── */
safeFn(()=>{if(typeof bankUpdateAmbient!=="function")return;const b0=bankUpdateAmbient;
 bankUpdateAmbient=function(){const r=b0.apply(this,arguments);
  safeFn(()=>{if(typeof Scape!=="undefined"&&Scape.bed&&!safeFn(()=>Prologue.active(),false))Scape.bed();});return r;};});

/* ── Р2. Предложение — одним голосом ── */
safeFn(()=>{const S=Speech;if(!S||typeof S.gvParts!=="function")return;const g0=S.gvParts;
 S.gvPartsRaw=function(){return g0.apply(this,arguments);};
 const конец=t=>/[.!?…]["»”)]*\s*$/.test(String(t));
 /* незаписанный остаток «длинный», если в нём четыре слова и больше и нет чисел: число или имя — значение шаблона */
 const длинно=t=>{const s=String(t).trim();if(/\d/.test(s))return false;return s.split(/\s+/).filter(w=>/[а-яёa-z]/i.test(w)).length>=4;};
 S.gvParts=function(text){const ч=g0.apply(this,arguments);
  if(!Array.isArray(ч)||ч.length<2||!ч.some(x=>x&&x.url))return ч;
  const out=[];let пр=[];
  const сброс=()=>{if(!пр.length)return;const синт=пр.filter(x=>!x.url);
   if(синт.length&&синт.length<пр.length&&длинно(синт.map(x=>x.t).join(" "))){out.push({t:пр.map(x=>x.t).join(" ").replace(/\s+/g," ").trim(),url:null,одним:true});
    safeFn(()=>ЖурналРЗ.добавить("речь","одним голосом",пр.map(x=>x.t).join(" ")));}
   else out.push(...пр);пр=[];};
  for(const x of ч){пр.push(x);if(конец(x.t))сброс();}
  сброс();
  /* соседние куски синтезатора — одним куском */
  const сл=[];for(const x of out){const l=сл[сл.length-1];if(l&&!l.url&&!x.url)l.t=(l.t+" "+x.t).replace(/\s+/g," ").trim();else сл.push(Object.assign({},x));}
  return сл;};});

/* ── З3. Итог каждого звука ── */
const СторожЗвука={ждут:[],т:null,
 ждать(el,роль){
  try{if(!el||!el.addEventListener||el.__сторож)return;el.__сторож=1;const з={el,роль,t:Date.now(),ok:false};
   el.addEventListener("playing",()=>{з.ok=true;},{once:true});
   el.addEventListener("error",()=>{if(!з.ok){з.ok=true;el.__итог="ошибка плеера";ЖурналРЗ.добавить("звук","ошибка плеера",роль);}},{once:true});
   this.ждут.push(з);if(this.ждут.length>64)this.ждут.shift();
   if(!this.т)this.т=Такт.каждые(1000,()=>this.обход(),"сторож звука");}catch(_){}},
 обход(){const now=Date.now();const ост=[];
  for(const з of this.ждут){if(з.ok)continue;const el=з.el;
   /* звук, поставленный до сворачивания игры, не судим: свёрнутая игра притушила его сама */
   if(з.t<(Такт.проснулся||0))continue;
   if(el.__stopped||(el.paused&&el.currentTime>0)||el.ended)continue;
   if(now-з.t<2500){ост.push(з);continue;}
   /* игра свёрнута: звук не идёт не по своей вине */
   if(document.hidden)continue;
   el.__итог="не зазвучал";ЖурналРЗ.добавить("звук","не зазвучал",з.роль);}
  this.ждут=ост;if(!ост.length&&this.т){this.т();this.т=null;}}};
safeFn(()=>{if(typeof Bank==="undefined"||typeof Bank.play!=="function")return;const p0=Bank.play;
 Bank.play=function(role){let r;
  try{r=p0.apply(this,arguments);}catch(e){safeFn(()=>ЖурналРЗ.добавить("звук","ошибка",role));throw e;}
  safeFn(()=>{let итог;
   if(r&&(r.__around||(typeof AROUND_STUB!=="undefined"&&r===AROUND_STUB)))итог="вокруг";
   else if(r&&r.tagName){итог="звучит";try{r.__итог="звучит";}catch(_){}СторожЗвука.ждать(r,role);}
   else if(r)итог="звучит";
   else итог=!Bank.enabled||settings.effects===0?"выключено":!safeFn(()=>Bank.has(role),true)?"нет записи":"не дано";
   ЖурналРЗ.добавить("звук",итог,role);
   Bank.итог={роль:role,итог,t:Date.now()};});
  return r;};});

/* ── З6. Речь — в журнал ── */
safeFn(()=>{const S=Speech;if(!S)return;
 const ИТОГ={COMPLETED:"сказано",FAILED:"не сказано",CANCELLED:"снято",REPLACED:"заменено",DEDUPED:"повтор снят",DROPPED:"не сказано по настройкам",EXPIRED:"устарело"};
 const f0=S._finish;S._finish=function(m,state){safeFn(()=>ЖурналРЗ.добавить("речь",ИТОГ[state]||String(state),m&&m.text));return f0.apply(this,arguments);};
 /* Р3: снятое новой фразой — с именем правила очереди, не сказанное — с именем фильтра */
 const c0=S._cut;S._cut=function(m,state){if(m)safeFn(()=>ЖурналРЗ.добавить("речь",(ИТОГ[state]||String(state))+(this._решает&&state==="CANCELLED"?` (${this._решает})`:""),m.text));return c0.apply(this,arguments);};
 const e0=S.enqueue;S.enqueue=function(){const m=e0.apply(this,arguments);
  safeFn(()=>{if(m&&(m.state==="DROPPED"||m.state==="DEDUPED"))ЖурналРЗ.добавить("речь",m.state==="DROPPED"&&m.причина?`не сказано: ${m.причина}`:ИТОГ[m.state],m.text);});return m;};
 const dq0=S._dropQueued;S._dropQueued=function(minPri,state){const до=this.queue.slice();const n=dq0.apply(this,arguments);
  if(n)safeFn(()=>{for(const x of до)if(!this.queue.includes(x))ЖурналРЗ.добавить("речь",(ИТОГ[state]||String(state))+" из очереди"+(this._решает?` (${this._решает})`:""),x.text);});return n;};
 const p0=S._pump;S._pump=function(){const было=this.queue.slice();const r=p0.apply(this,arguments);
  safeFn(()=>{for(const m of было)if(m.state==="EXPIRED"&&!m.__вЖурнале){m.__вЖурнале=1;ЖурналРЗ.добавить("речь","устарело",m.text);}});return r;};});

/* ── Р1. Свежая речь мира ── */
const СвежаяРечь={ФОН:new Set(["event","context","spatial","desc","object","approach"]),ПРЕДЕЛ:2,СРОК:5000,
 фон(m){return !!m&&!m.user&&!m.nav&&!m.keep&&!m.persistent&&!m.herald&&!(m.notBefore>0)&&m.pri>=3&&this.ФОН.has(m.cat);},
 /* очередь: фоновые вести из разных тактов — не больше двух новейших тактов */
 проредить(S,m){
  const ф=S.queue.filter(x=>x.state==="QUEUED"&&this.фон(x));if(!ф.length)return;
  const такты=[...new Set(ф.map(x=>x.task))].sort((a,b)=>b-a);
  if(такты.length<=this.ПРЕДЕЛ)return;
  const оставить=new Set(такты.slice(0,this.ПРЕДЕЛ));
  const снять=ф.filter(x=>!оставить.has(x.task));
  if(!снять.length)return;
  S.queue=S.queue.filter(x=>!снять.includes(x));
  for(const x of снять){x.state="EXPIRED";S.stats.expired++;safeFn(()=>ЖурналРЗ.добавить("речь","сведено к свежему",x.text));
   if(x.onDone)setTimeout(()=>{try{x.onDone();}catch(_){}},10);}}};
safeFn(()=>{const S=Speech;if(!S)return;const e0=S.enqueue;
 S.enqueue=function(){const m=e0.apply(this,arguments);
  safeFn(()=>{if(!m||m.state!=="QUEUED"||!СвежаяРечь.фон(m))return;
   if(!(m.ttl>0)||m.ttl>СвежаяРечь.СРОК)m.ttl=СвежаяРечь.СРОК;
   СвежаяРечь.проредить(this,m);});
  return m;};});

/* ── З6. Окно журнала ── */
safeFn(()=>{if(typeof CMD==="undefined")return;
 Object.assign(CMD,{rzjournal(){
  const Ж=ЖурналРЗ;const сбои=Ж.звук.slice(-6).reverse().map(z=>`${z.итог}: ${z.что}`).join("; ");
  const речь=Ж.речь.slice(-4).reverse().map(z=>`${z.итог}: «${z.что}»`).join("; ");
  const t=`Речь: ${Ж.сводка("речь")}. Звук: ${Ж.сводка("звук")}.${сбои?` Последние сбои звука: ${сбои}.`:" Сбоев звука нет."}${речь?` Последнее в речи: ${речь}.`:""}`;
  return выбор147("Журнал речи и звука",t,[
   {l:"Сохранить журнал в файл",run:()=>{safeFn(()=>{const blob=new Blob([Ж.текст()],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);
     const a=document.createElement("a");a.href=url;a.download=`grani-zhurnal-rechi-i-zvuka-${Date.now()}.txt`;a.style.display="none";document.body.appendChild(a);a.click();
     setTimeout(()=>{try{document.body.removeChild(a);URL.revokeObjectURL(url);}catch(_){}},4000);});
    narrate("Журнал речи и звука сохранён в файл.",{key:"rzj"});}},
   {l:"Очистить журнал",run:()=>{Ж.очистить();narrate("Журнал речи и звука очищен.",{key:"rzj"});}},
   {l:"Назад",run:()=>{}}]);}});
 safeFn(()=>{const g=AM_GROUPS.find(x=>x[2]&&x[2].id==="sound")||AM_GROUPS.find(x=>x[0]==="Звук");
  if(g&&!g[1].some(z=>z[0]==="rzjournal")){const i=g[1].findIndex(z=>z[0]==="encyc");g[1].splice(i>=0?i:g[1].length,0,["rzjournal","Журнал речи и звука"]);}});});

/* ── З1. Короткие одиночные звуки — из памяти ──
   Одиночный звук (шаг, щелчок, удар, находка) прежде заводил на каждый раз свой медиаплеер; на телефоне плееров
   у страницы ограниченно, и в тесноте новые не открывались — в том числе запись голоса. Теперь звук, прозвучавший
   однажды, раскодируется в память (кэш последних, на телефоне до 40 МБ, на компьютере до 64 МБ) и дальше звучит из
   неё — без плеера, сразу и точно по времени. Первый раз, петли, эхо подземелья, небесный отклик, звуки пролога и
   всё, что не раскодировалось, — прежним плеером. Запись голоса Gemini остаётся на плеере: ускоренную речь
   (по умолчанию в 2,8 раза) браузер сжимает без смены высоты лучше, чем это можно сделать в памяти. */
const ПамятьЗвука={кэш:new Map(),ждут:new Map(),плохо:new Set(),байт:0,сбоев:0,выключено:false,раз:0,
 /* постоянные усилители (как каналы среды): звук из памяти берёт свободный и отдаёт, отыграв; узлы движка не копятся */
 усилители:[],ЗАПАС:16,
 усилитель(ctx){let у=this.усилители.find(x=>!x.занят&&x.ctx===ctx);
  const выход=()=>safeFn(()=>Телефон.выход(ctx),null)||ctx.destination;
  if(!у&&this.усилители.length<this.ЗАПАС){const g=ctx.createGain();g.gain.value=0;g.connect(выход());у={g,ctx,занят:false};this.усилители.push(у);}
  if(!у){const g=ctx.createGain();g.connect(выход());у={g,ctx,занят:false,разовый:true};}
  у.занят=true;return у;},
 отпустить(у){if(!у)return;if(у.разовый){try{у.g.disconnect();}catch(_){}return;}try{у.g.gain.value=0;}catch(_){}у.занят=false;},
 ПРЕДЕЛ:(/Android|Mobile|iPhone|iPad/i.test(navigator.userAgent||"")?40:64)*1e6,ДЛИНА:8,
 вкл(){try{return !this.выключено&&typeof fetch==="function"&&location.protocol!=="file:"&&!!(AE.ctx&&AE.ctx.state==="running");}catch(_){return false;}},
 взять(url){const z=this.кэш.get(url);if(!z)return null;this.кэш.delete(url);this.кэш.set(url,z);return z.buf;},
 загрузить(url){
  if(!url||this.кэш.has(url)||this.ждут.has(url)||this.плохо.has(url)||this.ждут.size>=6)return;
  const ctx=AE.ctx;if(!ctx)return;
  const p=fetch(url).then(r=>{if(!r.ok)throw new Error("нет файла");return r.arrayBuffer();})
   .then(ab=>new Promise((res,rej)=>{try{const q=ctx.decodeAudioData(ab,res,rej);if(q&&q.then)q.then(res,rej);}catch(e){rej(e);}}))
   .then(buf=>{if(!buf||!(buf.duration>0)||buf.duration>this.ДЛИНА){this.плохо.add(url);return;}
    const b=buf.length*buf.numberOfChannels*4;this.кэш.set(url,{buf,b});this.байт+=b;this.ужать();})
   .catch(()=>{this.плохо.add(url);if(++this.сбоев>=20&&!this.кэш.size){this.выключено=true;safeFn(()=>ЖурналРЗ.добавить("звук","память выключена: файлы не читаются","",true));}})
   .finally(()=>this.ждут.delete(url));
  this.ждут.set(url,p);},
 ужать(){while(this.байт>this.ПРЕДЕЛ&&this.кэш.size){const [k,v]=this.кэш.entries().next().value;this.кэш.delete(k);this.байт-=v.b;}}};

/* Звук из памяти с повадками плеера: громкость, скорость, пауза, «закончился», «зазвучал» — всё, чем игра управляет
   одиночным звуком, работает так же. Звучит напрямую в выход, как и плеер одиночного звука. */
class ЗвукИзПамяти extends EventTarget{
 constructor(url,buf){super();this.tagName="AUDIO";this.__память=true;this._buf=buf;this.src=url;this.currentSrc=url;this._vol=1;this._rate=1;
  this.loop=false;this._muted=false;this.paused=true;this.ended=false;this.readyState=4;this.networkState=1;this.error=null;this.preload="auto";
  this.duration=buf.duration;this._off=0;this._t0=0;this._s=null;this._g=null;this._у=null;this.preservesPitch=true;this.mozPreservesPitch=true;this.defaultPlaybackRate=1;
  this.onended=null;this.onerror=null;this.onplaying=null;this.onpause=null;}
 get volume(){return this._vol;}
 set volume(v){this._vol=Math.max(0,Math.min(1,Number(v)||0));this._усилить();}
 get muted(){return this._muted;}
 set muted(v){this._muted=!!v;this._усилить();}
 get playbackRate(){return this._rate;}
 set playbackRate(v){const r=Math.max(0.25,Math.min(4,Number(v)||1));if(this._s&&!this.paused){this._off=this.currentTime;this._t0=AE.ctx.currentTime;}
  this._rate=r;try{if(this._s)this._s.playbackRate.value=r;}catch(_){}}
 get currentTime(){if(this.paused||!this._s)return this._off;let t=this._off+(AE.ctx.currentTime-this._t0)*this._rate;
  if(this.loop&&this.duration>0)t%=this.duration;return Math.min(this.duration,t);}
 set currentTime(v){const t=Math.max(0,Math.min(this.duration,Number(v)||0));const шло=!this.paused;if(шло)this._стоп();this._off=t;if(шло){this.paused=true;this._пуск();}}
 _усилить(){try{if(this._g)this._g.gain.value=this._muted?0:this._vol;}catch(_){}}
 _стоп(){const s=this._s;this._s=null;if(s){try{s.onended=null;s.stop();}catch(_){}try{s.disconnect();}catch(_){}}
  if(this._у){ПамятьЗвука.отпустить(this._у);this._у=null;}this._g=null;}
 _событие(t){const e=new Event(t);try{this.dispatchEvent(e);}catch(_){}const h=this["on"+t];if(typeof h==="function")try{h.call(this,e);}catch(_){}}
 /* запуск — только через Звук.играть (он зовёт play); перемотка звучащей записи перезапускает её сама (_пуск) */
 play(){return this._пуск();}
 _пуск(){
  if(!this._buf||!this.src)return Promise.reject(new DOMException("нет записи","NotSupportedError"));
  if(!this.paused)return Promise.resolve();
  try{const ctx=AE.ctx;if(this._off>=this.duration)this._off=0;
   const s=ctx.createBufferSource();s.buffer=this._buf;s.loop=!!this.loop;s.playbackRate.value=this._rate;
   const у=ПамятьЗвука.усилитель(ctx);const g=у.g;g.gain.value=this._muted?0:this._vol;s.connect(g);
   this._s=s;this._у=у;this._g=g;this._t0=ctx.currentTime;this.paused=false;this.ended=false;
   s.onended=()=>{if(this._s!==s)return;this._стоп();this.paused=true;if(!this.loop){this.ended=true;this._off=0;this._событие("ended");}};
   s.start(0,this._off);
   Promise.resolve().then(()=>{if(this._s===s){this._событие("play");this._событие("playing");}});
   return Promise.resolve();}
  catch(e){this._стоп();this.paused=true;return Promise.reject(e);}}
 pause(){if(this.paused)return;this._off=this.currentTime;this._стоп();this.paused=true;this._событие("pause");}
 load(){if(!this.src){this._стоп();this.paused=true;this._buf=null;}}
 removeAttribute(n){if(n==="src"){this.src="";this.currentSrc="";}}
 getAttribute(n){return n==="src"?this.src:null;}
 setAttribute(n,v){if(n==="src"){this.src=String(v);this.currentSrc=this.src;}}
 hasAttribute(n){return n==="src"&&!!this.src;}
 canPlayType(){return "probably";}}

safeFn(()=>{if(typeof Bank==="undefined"||typeof Bank.make!=="function")return;const m1=Bank.make;
 Bank.make=function(file,volume,loop,rate){
  /* З5: варианты одной роли — одной громкости (поправка по замеру; петли — без поправки: их громкость ведёт Bank) */
  if(!loop)try{const k=ПОПРАВКА_ГРОМКОСТИ[file];if(k>0)volume=(Number(volume)||0)*k;}catch(_){}
  try{
   const особо=loop||safeFn(()=>typeof Небо165!=="undefined"&&Небо165.на,false)||safeFn(()=>typeof Эхо165!=="undefined"&&Эхо165.надо(),false)||safeFn(()=>Prologue.active(),false);
   if(!особо&&ПамятьЗвука.вкл()){
    const url=this.url(file);const buf=ПамятьЗвука.взять(url);
    if(buf){
     /* громкость по тесноте — как у прежнего плеера одиночного звука (Гул155) */
     const кл=safeFn(()=>Гул155.кл,null);if(кл&&кл!=="музыка")volume=Math.min(0.95,(Number(volume)||0)*safeFn(()=>Гул155.множ(кл),1));
     const a=new ЗвукИзПамяти(url,buf);a.volume=volume;if(rate&&rate!==1)a.playbackRate=Math.max(0.5,Math.min(2,rate));
     this.plays++;this.fails=0;ПамятьЗвука.раз++;
     try{Звук.играть(a,"запись");}catch(_){return m1.apply(this,arguments);}
     return a;}
    ПамятьЗвука.загрузить(url);}}
  catch(_){}
  return m1.call(this,file,volume,loop,rate);};});

/* ── Р6. Общий распорядитель голосов и приглушение без «дыхания» ──
   Диктор, жители, герой, боги и твари уже не говорят друг поверх друга (житель ждёт диктора, диктор — жителя,
   герой и тварь — по очереди); здесь — одна точка, где видно, кто говорит и когда станет тихо (Пол), и
   приглушение фона без «дыхания»: прежде между двумя фразами подряд музыка и фон на миг поднимались и тут же
   снова приглушались. Теперь приглушение отпускается только через 0,45 с тишины. */
const Пол={УДЕРЖАНИЕ:450,
 кто(){return safeFn(()=>Речь.кто(),[]);},
 /* через сколько миллисекунд замолчат все голоса (0 — тихо уже) */
 свободенЧерез(){let d=0;
  if(safeFn(()=>Speech.speaking&&!!Speech.current,false))d=Math.max(d,this.УДЕРЖАНИЕ);
  d=Math.max(d,safeFn(()=>Folk.послеВсех(),0)||0);
  if(safeFn(()=>Intro.playing,false))d=Math.max(d,1000);
  return d;},
 тихо(){return this.свободенЧерез()===0;}};
safeFn(()=>{const S=Speech;if(!S||typeof S._duck!=="function")return;const d0=S._duck;let т=null;
 S._duck=function(on){
  if(on){if(т){clearTimeout(т);т=null;}return d0.call(this,true);}
  if(!this.ducking||т)return;
  т=setTimeout(()=>{т=null;if(!(this.speaking&&this.current))d0.call(this,false);},Пол.УДЕРЖАНИЕ);};});

/* ── З4. Одни часы: события вместо опроса ──
   Дела звука и речи идут по общему такту (Такт в основе): звуковая картина, живые вокруг, фон чертога, гул места,
   вести окна зверей, сторож звука. Смена места уже меняет фон сразу (З2); здесь — смена дня и ночи: фон поля
   и леса меняется в ту же минуту, а не на ближайшем ударе часов звуковой картины. */
safeFn(()=>{if(typeof Clock==="undefined"||typeof Clock.tick!=="function")return;const t0=Clock.tick;
 Clock.tick=function(){const н0=safeFn(()=>isNight(),null);const r=t0.apply(this,arguments);
  safeFn(()=>{if(safeFn(()=>isNight(),null)!==н0&&typeof Scape!=="undefined"&&Scape.bed&&!safeFn(()=>Prologue.active(),false))Scape.bed();});
  return r;};});

/* ── З5. Громкость записей — по замеру; режим «динамик телефона» ──
   Громкость каждой записи звуков, у роли которых несколько вариантов, один раз измерена по стандарту громкости
   (BS.1770, взвешивание K, наибольшая мгновенная громкость; hron/zvuk_lufs.py). Поправка выравнивает варианты
   одной роли к средней громкости этой роли (не больше чем на 6 дБ): шаг, удар или крик больше не прыгают по
   громкости от варианта к варианту, а сама роль звучит так же громко, как была настроена на слух.
   «Динамик телефона»: одиночные звуки мира (шаги, дальние твари, капель, щелчки меню) идут через мягкое сжатие —
   тихое поднято примерно на 7 дБ, громкое почти не меняется. Речь, музыка и фон не трогаются, чтобы фон не
   заглушал голос. На телефоне режим включён сам, на компьютере выключен; флажок — в настройках громкости. */
const ПОПРАВКА_ГРОМКОСТИ=/*@LUFS175@*/{};
const Телефон={ctx:null,_вход:null,_c:null,_mk:null,
 /* телефон: Android или iOS по строке браузера, либо главный указатель — палец (а не мышь, как у ноутбука с сенсором) */
 телефон(){if(safeFn(()=>isDesktopApp(),false))return false;
  if(/Android|iPhone|iPad|iPod/i.test(String(navigator.userAgent||"")))return true;
  return (Number(navigator.maxTouchPoints)||0)>0&&!!safeFn(()=>matchMedia("(pointer: coarse)").matches,false);},
 вкл(){return settings.phoneSpeaker===1;},
 /* точка, куда звучат одиночные звуки из памяти: сжатие или прямо в выход */
 выход(ctx){if(!ctx)return null;
  if(this.ctx!==ctx||!this._вход){this.ctx=ctx;this._вход=ctx.createGain();
   const c=ctx.createDynamicsCompressor();c.threshold.value=-24;c.knee.value=10;c.ratio.value=2;c.attack.value=0.004;c.release.value=0.18;
   const mk=ctx.createGain();mk.gain.value=2.24;c.connect(mk);mk.connect(ctx.destination);this._c=c;this._mk=mk;this.применить();}
  return this._вход;},
 применить(){const ctx=this.ctx;if(!ctx||!this._вход)return;try{this._вход.disconnect();}catch(_){}
  try{this._вход.connect(this.вкл()?this._c:ctx.destination);}catch(_){}},
 флажок(){const el=document.getElementById("setPhoneSpk");if(el)el.checked=settings.phoneSpeaker===1;}};
/* по умолчанию: на телефоне включено, на компьютере выключено; выбор игрока сохраняется */
safeFn(()=>{if(settings.phoneSpeaker!==0&&settings.phoneSpeaker!==1)settings.phoneSpeaker=Телефон.телефон()?1:0;
 Телефон.флажок();setTimeout(()=>safeFn(()=>Телефон.флажок()),0);
 document.addEventListener("change",e=>{if(e.target&&e.target.id==="setPhoneSpk")setTimeout(()=>safeFn(()=>Телефон.применить()),0);},true);});

/* ── (17.0) Android: «Сохранить в файл» — в папку «Загрузки» телефона ──
   В приложении Android ссылка blob: со скачиванием молча пропускалась: игра говорила «выгружено в файл», а файла не
   было. Теперь сохранение игры и журнал речи и звука уходят в «Загрузки» через мост приложения
   (GraniTTS.saveDownload). Содержимое берётся из самого Blob (адрес blob: страница прочесть не может — его не
   пускают правила безопасности страницы). В браузере и на компьютере моста нет — всё как прежде. */
safeFn(()=>{const м=window.GraniTTS;if(!(м&&typeof м.saveDownload==="function"))return;
 const блобы=new Map();const с0=URL.createObjectURL,о0=URL.revokeObjectURL;
 /* адрес blob: держит свой Blob и так, пока его не отпустят, — запись в таблице памяти не прибавляет */
 URL.createObjectURL=function(o){const u=с0.apply(URL,arguments);try{if(o instanceof Blob)блобы.set(u,o);}catch(_){}return u;};
 URL.revokeObjectURL=function(u){блобы.delete(u);return о0.apply(URL,arguments);};
 const клик0=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){
  const b=this.download?блобы.get(String(this.href||"")):null;
  if(b){const имя=String(this.download);
   b.text().then(t=>{let ok=false;try{ok=!!м.saveDownload(имя,String(b.type||"text/plain"),t);}catch(_){ok=false;}
    if(!ok)narrate("Файл в папку «Загрузки» записать не удалось: в памяти телефона мало места или нет доступа.",{interrupt:false});})
    .catch(()=>narrate("Файл в папку «Загрузки» записать не удалось.",{interrupt:false}));
   return;}
  return клик0.apply(this,arguments);};});
