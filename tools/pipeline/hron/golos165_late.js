/* ════════════════════════════════════════════════════════════════════════
   ЭХО ПОДЗЕМЕЛИЙ, ГОЛОС БОГОВ С НЕБА, ГОЛОС ТВАРИ — ГРОМЧЕ И В СВОЙ ЧЕРЁД
   (после 16.0)
   Просьбы игрока: «в подземельях перестало работать эхо — проверь, чтобы
   единый обработчик звука отрабатывал это корректно»; «голос богов без эха,
   а оно должно быть всегда — это голос с небес»; «голос говорящих монстров
   громче: за фразами героя их не слышно, особенно призраков и тех, у кого
   низкий голос (Огр-громила, Ржавый Страж)»; «голос героя наслаивается на
   голос монстра — пусть говорят по очереди».
   1. Эхо. Отзвук помещения есть у звука, который идёт каналом единой
      звуковой среды (шаги, голоса, звуки с места). Короткие звуки банка —
      дверь, рычаг, сундук, удар, рык, обвал — шли простым плеером, мимо
      среды, и под сводом звучали сухо, как в поле. Теперь под землёй, в
      храме, замке, на лестнице и в тайных ходах они идут каналом среды с
      долей отзвука места; наверху — как прежде.
   2. Боги. Голос бога (слово и голос стихии) идёт в свой небесный отклик —
      долгий, светлый, с ранним отражением, — где бы ни стоял герой.
   3. Тварь. Слово твари в бою громче (дух и сирена, исполин, страж-голем,
      владыка нежити, дракон — заметно громче), с подъёмом разборчивости.
   4. Очередь. Тварь не говорит поверх героя: её слово ждёт, пока герой
      договорит; реплика героя, пришедшая посреди слова твари, ждёт его
      конца (не дольше трёх с половиной секунд).
   ════════════════════════════════════════════════════════════════════════ */
const обёртка165g=(w,f0)=>{try{Object.defineProperty(w,"toString",{value:function(){return String(f0);},configurable:true,writable:true});}catch(_){}return w;};
/* ── 1. Эхо под сводом ── */
const Эхо165={
 ГУЛКО:/^(cave|dungeon|deep|temple|castle|stairs|vault|d_|deep_)/,
 место(){try{const p=G.place;if(!p||G.ship)return false;if((Number(p.depth)||0)>0||p.тайник)return true;
  const k=String(Room.ak||Room.kind||"");return this.ГУЛКО.test(k);}catch(_){return false;}},
 надо(){if(!settings.effects||!safeFn(()=>Bank.canPan(),false)||!Room.conv)return false;
  const кл=safeFn(()=>Гул155.кл,null);if(кл==="ui"||кл==="музыка"||кл==="маяк")return false;
  return this.место();},
 доля(){return 0.6;}};
safeFn(()=>{const m0=Bank.make;Bank.make=обёртка165g(function(file,volume,loop,rate){
 const небо=Небо165.на&&!loop;
 if(!loop&&(небо||Эхо165.надо())){
  const h=safeFn(()=>ЗвукСреда.играть(this.url(file),{путь:"flat",gain:Math.max(0,Math.min(1,Number(volume)||0)),dry:"fx",
   wet:небо?0.8:Эхо165.доля(),conv:небо?Небо165.conv():null,rate:(rate&&rate!==1)?rate:1}),null);
  if(h&&h.el){const el=h.el;el.__эхо165=1;
   el.addEventListener("error",()=>{if(el.__stopped)return;this.fails++;if(this.plays===0&&this.fails>=4)this.enabled=false;},{once:true});
   el.addEventListener("loadeddata",()=>{this.plays++;this.fails=0;},{once:true});
   el.addEventListener("ended",()=>{try{h.стоп();}catch(_){}},{once:true});
   try{Звук.играть(el,"запись");}catch(_){}
   return el;}}
 return m0.apply(this,arguments);},m0);});

/* ── 2. Небесный отклик для голоса богов ── */
const Небо165={
 на:false,_c:null,_g:null,
 conv(){try{if(this._c)return this._c;const ctx=AE.ensure();if(!ctx||!Room.ensure())return null;
  const c=ctx.createConvolver();
  /* долгий светлый хвост (собор под открытым небом) и ранние отражения — голос сверху, отовсюду */
  c.buffer=Room.impulse(4.6,1.25,7800,4);
  const g=ctx.createGain();g.gain.value=0.9;c.connect(g);g.connect(AE.fx);this._c=c;this._g=g;return c;}catch(_){return null;}},
 бог(url){return /\/voice_god\//.test(String(url||""));}};
safeFn(()=>{const i0=ЗвукСреда.играть;ЗвукСреда.играть=обёртка165g(function(url,о){о=о||{};
 try{if(Небо165.бог(url)||Небо165.на){const c=Небо165.conv();if(c)о=Object.assign({},о,{conv:c,wet:Math.max(Number(о.wet)||0,0.8)});}
  if(Голос165.ясно&&о.voice)о=Object.assign({},о,{eq:{f:2600,q:0.9,g:5}});}catch(_){}
 return i0.call(this,url,о);},i0);});
safeFn(()=>{const g0=godVoice;godVoice=обёртка165g(function(){Небо165.на=true;try{return g0.apply(this,arguments);}finally{Небо165.на=false;}},g0);});

/* ── 3–4. Голос твари: громче и в свой черёд ── */
const Голос165={
 ясно:false,тварьДо:0,
 /* во сколько раз громче прежнего слово твари по её роду */
 ГРОМЧЕ:{spirit:1.6,siren:1.5,giant:1.55,construct:1.55,lich:1.5,dragon:1.4,fiend:1.35,bandit:1.2,pirate:1.2,goblin:1.2},
 род(роль){const m=/^foe_([a-z]+)_/.exec(String(роль||""));return m?m[1]:null;},
 /* отложенное слово — в общем списке ожидания голосов: «смолкнуть» снимает и его */
 отложить(F,f,мс){const ждут=F.ждут||(F.ждут=[]);const т=setTimeout(()=>{const i=ждут.indexOf(т);if(i>=0)ждут.splice(i,1);safeFn(f);},мс);ждут.push(т);return т;},
 сейчас(){return Date.now();}};
safeFn(()=>{const r0=Folk.реплика;Folk.реплика=обёртка165g(function(роль,строка,n,жен,o){
 if(!(o&&o.фон&&o.чётко))return r0.apply(this,arguments);
 const к=Голос165.ГРОМЧЕ[Голос165.род(роль)]||1.25;const o2=Object.assign({},o,{gain:(Number(o.gain)||VOICE_MIX.gain)*к,тварь165:1});
 const cap0=VOICE_MIX.cap;VOICE_MIX.cap=Math.max(cap0,3.6);Голос165.ясно=true;
 try{return r0.call(this,роль,строка,n,жен,o2);}finally{VOICE_MIX.cap=cap0;Голос165.ясно=false;}},r0);});
safeFn(()=>{const s0=Folk.сказать;Folk.сказать=обёртка165g(function(путь,n,o){
 try{const now=Date.now();const self=this,args=arguments;
  /* слово твари ждёт, пока договорит герой */
  if(o&&o.фон&&o.чётко&&!o.ждал165){const до=Number(this.геройДо)||0;
   if(до>now+60){const жди=Math.min(4000,до-now+220);const o2=Object.assign({},o,{ждал165:1});const cap=VOICE_MIX.cap;
    Голос165.отложить(self,()=>{const c0=VOICE_MIX.cap;VOICE_MIX.cap=Math.max(c0,cap);Голос165.ясно=true;try{s0.call(self,путь,n,o2);}finally{VOICE_MIX.cap=c0;Голос165.ясно=false;}
     Голос165.тварьДо=Date.now()+Math.round(self.длина(путь,o2.rate)*1000);},жди);return true;}
   const r=s0.apply(this,args);if(r)Голос165.тварьДо=now+Math.round(this.длина(путь,o.rate)*1000);return r;}
  /* реплика героя посреди слова твари ждёт его конца */
  if(/^hero_/.test(String(путь||""))&&!(o&&o.ждал165)){const до=Голос165.тварьДо;
   if(до>now+60){const жди=Math.min(3500,до-now+150);const o2=Object.assign({},o||{},{ждал165:1});
    this.геройДо=Math.max(Number(this.геройДо)||0,now+жди+Math.round(this.длина(путь,o2.rate)*1000));
    Голос165.отложить(self,()=>s0.call(self,путь,n,o2),жди);return true;}}}catch(_){}
 return s0.apply(this,arguments);},s0);});

/* ── 5. Смена отклика помещения не держит шаг ──
   Просьба игрока: «при быстром перемещении в лазах, тайных проходах, а иногда и в подземельях шаги зависают».
   Замер под нагрузкой (процессор вчетверо медленнее, как на телефоне): на каждом переходе — в лаз и из лаза,
   на новый ярус, в тайный ход — шаг ждал смены отклика помещения больше десятой доли секунды. Отклик
   пересчитывался прямо в шаге (сотни тысяч отсчётов шума), а узел свёртки готовил его заново даже для места,
   где герой был минуту назад.
   Теперь за входом отклика стоят четыре готовых узла — ярус, тайник (каморка и ходы) и прежнее место: туда, где герой уже был,
   отклик переключается мгновенно, а хвост прежнего отзвучивает сам. Новый отклик строится в простое сразу
   после шага — пока звучит прежний; отклик тайников готовится заранее, пока герой ходит по ярусу. Сам
   расчёт отклика втрое быстрее, а размер места берётся ступенями: похожие залы делят один отклик. */
const Отклик165={ПУЛ:4,пул:new Map(),акт:null,хочу:null,ждём:false,
 /* тайник — две ступени: каморка и целые ходы (их размеры близки) */
 ступень(size,ak){const v=Number(size)||1;if(ak==="vault")return v<0.9?0.6:1.3;return Math.round(v*10)/10;},
 ключ(ak,size){return ak+":"+this.ступень(size,ak).toFixed(2);},
 простой(f,мс){const ри=window.requestIdleCallback;if(ри)ри(()=>safeFn(f),{timeout:мс||500});else setTimeout(()=>safeFn(f),60);},
 /* узел свёртки: из пула, а новый (дорого) — только когда можно */
 узел(ak,size,строить){const к=this.ключ(ak,size);const e=this.пул.get(к);
  if(e){this.пул.delete(к);this.пул.set(к,e);return e;}
  if(!строить)return null;const ctx=AE.ctx;if(!ctx||!Room.wet)return null;
  const c=ctx.createConvolver();c.buffer=(this.буфер||Room.buffer).call(Room,ak,size);
  const n={к,c,вых:false,сек:c.buffer?c.buffer.duration:1,т:0};this.пул.set(к,n);
  while(this.пул.size>this.ПУЛ){const старый=[...this.пул.values()].find(x=>x!==this.акт&&x!==n);if(!старый)break;this.снять(старый);this.пул.delete(старый.к);}
  return n;},
 снять(e){clearTimeout(e.т);try{Room.conv.disconnect(e.c);}catch(_){}try{e.c.disconnect();}catch(_){}e.вых=false;},
 включить(e){if(!e||e===this.акт)return;const вход=Room.conv;clearTimeout(e.т);
  if(!e.вых){try{e.c.connect(Room.wet);e.вых=true;}catch(_){}}
  try{вход.connect(e.c);}catch(_){}
  const п=this.акт;this.акт=e;
  if(п){try{вход.disconnect(п.c);}catch(_){}
   /* хвост прежнего доигрывает (к секунде он почти затих); потом узел отключён от выхода и сил не тратит */
   п.т=setTimeout(()=>{if(this.акт!==п&&п.вых){try{п.c.disconnect();}catch(_){}п.вых=false;}},Math.min(1200,Math.round(п.сек*1000)+400));}
  /* частая смена мест: звучат не больше двух узлов — нынешний и последний прежний */
  for(const x of this.пул.values())if(x!==e&&x!==п&&x.вых){clearTimeout(x.т);try{x.c.disconnect();}catch(_){}x.вых=false;}},
 /* место сменилось: готовый отклик — сразу, новый — в простое */
 поставить(ak,size){this.хочу={ak,size};const e=this.узел(ak,size,false);
  if(e){this.включить(e);this.загодя();return;}
  if(!this.акт){this.включить(this.узел(ak,size,true));this.загодя();return;}
  if(this.ждём)return;this.ждём=true;
  this.простой(()=>{this.ждём=false;const х=this.хочу;if(!х)return;this.включить(this.узел(х.ak,х.size,true));this.загодя();});},
 /* заранее, в простое: тайная палата этого яруса и небесный отклик голоса богов */
 загодя(){if(this._загодя)return;this._загодя=true;
  setTimeout(()=>this.простой(()=>{this._загодя=false;const p=G.place;
   if(p&&!p.тайник&&!G.flight&&(Number(p.depth)||0)>0){this.узел("vault",0.6,true);this.узел("vault",1.3,true);}
   if(typeof Небо165!=="undefined"&&!Небо165._c)Небо165.conv();},2500),700);},
 /* кто-то положил готовый буфер прямо во вход */
 готовый(b){const ctx=AE.ctx;if(!ctx||!b)return;const c=ctx.createConvolver();c.buffer=b;
  const n={к:"свой:"+(this.n=(this.n||0)+1),c,вых:false,сек:b.duration,т:0};this.пул.set(n.к,n);this.включить(n);}};
/* вход отклика — шина: каналы среды и все источники подключаются к ней, как прежде к узлу свёртки */
safeFn(()=>{const e0=Room.ensure;Room.ensure=function(){
 if(this.conv&&this.conv.__вход165)return true;
 const старый=this.conv;if(!старый&&!e0.call(this))return false;
 const ctx=AE.ctx;if(!ctx)return !!this.conv;
 const вход=ctx.createGain();вход.gain.value=1;вход.__вход165=true;
 Object.defineProperty(вход,"buffer",{configurable:true,get(){const a=Отклик165.акт;return a?a.c.buffer:null;},
  set(b){if(b&&b.отклик165)Отклик165.поставить(b.ak,b.size);else Отклик165.готовый(b);}});
 /* прежний узел свёртки (собран базой) становится первым в пуле */
 const c=this.conv;try{c.disconnect();}catch(_){}
 if(c&&c.buffer){const n={к:this.ak&&this.size?Отклик165.ключ(this.ak,this.size):"база",c,вых:false,сек:c.buffer.duration,т:0};Отклик165.пул.set(n.к,n);this.conv=вход;Отклик165.включить(n);}
 else this.conv=вход;
 return true;};});
/* сама смена места: отклик берётся из пула или строится в простое, а не в шаге */
/* ступени размера: залы, близкие по площади, делят один отклик */
safeFn(()=>{const b1=Room.buffer;Room.buffer=function(kind,size){return b1.call(this,kind,Отклик165.ступень(size,kind));};Отклик165.буфер=Room.buffer;});
safeFn(()=>{const s1=Room.set;Room.set=function(){const b0=this.buffer;
 this.buffer=function(ak,size){return {отклик165:1,ak,size};};
 let r;try{r=s1.apply(this,arguments);}finally{this.buffer=b0;}
 /* место прежнее, а отклика ещё нет (вход собран после первой смены) — поставить */
 if(!Отклик165.акт&&this.conv&&this.conv.__вход165&&this.ak)safeFn(()=>Отклик165.поставить(this.ak,this.size));
 return r;};});
/* расчёт отклика: огибающая по узлам через 64 отсчёта вместо степени на каждом */
safeFn(()=>{Room.impulse=function(sec,decay,damp,early){
 const ctx=AE.ctx,rate=ctx.sampleRate,len=Math.max(1,Math.floor(rate*sec));
 const buf=ctx.createBuffer(2,len,rate);const a=Math.exp(-2*Math.PI*Math.max(200,damp)/rate),b=1-a,Ш=64;
 for(let c=0;c<2;c++){const d=buf.getChannelData(c);let z=0;
  for(let i0=0;i0<len;i0+=Ш){const i1=Math.min(len,i0+Ш);const e0=Math.pow(1-i0/len,decay),e1=Math.pow(1-i1/len,decay);
   const de=(e1-e0)/(i1-i0);let e=e0;for(let i=i0;i<i1;i++){z=(Math.random()*2-1)*b+z*a;d[i]=z*e;e+=de;}}
  if(early>0)for(let k=1;k<=early;k++){const t=Math.floor(rate*(0.008*k*(1+0.35*c)+0.004*k*k));if(t<len)d[t]+=(k%2?1:-1)*0.55/Math.sqrt(k);}}
 return buf;};});
