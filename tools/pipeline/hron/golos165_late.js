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
    setTimeout(()=>safeFn(()=>{const c0=VOICE_MIX.cap;VOICE_MIX.cap=Math.max(c0,cap);Голос165.ясно=true;try{s0.call(self,путь,n,o2);}finally{VOICE_MIX.cap=c0;Голос165.ясно=false;}
     Голос165.тварьДо=Date.now()+Math.round(self.длина(путь,o2.rate)*1000);}),жди);return true;}
   const r=s0.apply(this,args);if(r)Голос165.тварьДо=now+Math.round(this.длина(путь,o.rate)*1000);return r;}
  /* реплика героя посреди слова твари ждёт его конца */
  if(/^hero_/.test(String(путь||""))&&!(o&&o.ждал165)){const до=Голос165.тварьДо;
   if(до>now+60){const жди=Math.min(3500,до-now+150);const o2=Object.assign({},o||{},{ждал165:1});
    this.геройДо=Math.max(Number(this.геройДо)||0,now+жди+Math.round(this.длина(путь,o2.rate)*1000));
    setTimeout(()=>safeFn(()=>s0.call(self,путь,n,o2)),жди);return true;}}}catch(_){}
 return s0.apply(this,arguments);},s0);});
