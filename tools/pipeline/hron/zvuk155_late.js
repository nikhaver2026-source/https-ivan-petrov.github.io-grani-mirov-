/* ════════════════════════════════════════════════════════════════════════
   ЗВУК БЕЗ ПЕРЕГРУЗА (15.5)
   Жалоба игрока: «примерно через час игры звук начинает очень сильно
   перегружаться». Утечки нет: за двадцать пять минут непрерывной игры не
   прибавилось ни плееров, ни узлов звукового движка, ни таймеров. Перегруз —
   от тесноты: к часу игры у героя спутники и скакун, задания с маяками,
   Режиссёр, погода, ярусы Глуби, и разом звучат двадцать–двадцать шесть
   записей, каждая — в свою полную силу. Сумма выходила за предел: на выходе
   звукового движка пик доходил до 1,48 при пределе 1, а прямые плееры
   складывались поверх него.
   Теперь:
   1. На выходе движка — ограничитель: пики не переходят предела, а то, что
      и так ниже предела, звучит как прежде (собственный подъём сжатия
      браузера снят).
   2. Тесно — тише мир. Перед каждым новым звуком считается, сколько уже
      звучит. Когда тесно, новый звук мира подаётся тише (не больше чем
      вдвое), фоновый — заметно тише (до трети). Шаги и звуки героя, звери,
      окна, маяки, голоса и события убавляются не больше чем на пятую часть:
      их слышно всегда. Сверх предела голосов, как и прежде, уступает самый
      дальний и неважный звук, а не молчит новый.
   3. Фон места плавно приседает, пока тесно, и возвращается, когда стихнет.
   4. Шаги героя — громче прежнего на сорок долей из ста, его удары, щит,
      зелья и чары — на четверть: свой шаг и свой удар слышны вровень со
      звуками мира, а не под ними.
   ════════════════════════════════════════════════════════════════════════ */
const Гул155={кл:null,фонК:1,пред:null,лим:null,тТ:0,тЗ:{L:0,n:0},счёт:{убавлено:0},
 ШАГ:/^(tread_|step_|mtg_step_|lug_step_|oc_step_|hero_step_|gear_|fx_step_)|^(deep_stairs|stk_bridge|lug_land|oc_swim)$/,
 ГЕРОЙ:/^(battle_|blade_|hit_|oc_bow_|oc_arrow_|oc_javelin_|oc_shield_|lug_knife_|lug_staff|lug_whoosh|hero_|cast_|spell_|potion_|equip_|cry_)|^(mg_spear|oc_swing|oc_weapon_hit|oc_general_hit|oc_projectile_hit|oc_organic_hit|lug_clank|lug_flesh|lug_impact|lug_metal|lug_sword|lug_thud|stk_clang|od_blade|mtg_glass|magic_shimmer|heal_bloom|arc_hit)$/,
 ФАЙЛ_ШАГ:/^(tread|mtg|steps)\/|^oc\/oc_step_|^zvlapy\//,
 /* Ограничитель на выходе движка. Сжатие браузера по стандарту Web Audio само
    поднимает всё на величину, зависящую от порога и колена (у разных браузеров
    чуть по-разному); этот подъём снят усилителем после сжатия. Сколько снимать,
    меряется один раз на пробном движке без звука: тихий тон через то же сжатие. */
 ПОРОГ:-4,КОЛЕНО:3,СЖАТИЕ:20,снять:0,
 сжатие(ctx){const c=ctx.createDynamicsCompressor();c.threshold.value=this.ПОРОГ;c.knee.value=this.КОЛЕНО;c.ratio.value=this.СЖАТИЕ;c.attack.value=0.003;c.release.value=0.25;return c;},
 оценка(){const T=this.ПОРОГ,полн=T+(0-T)/this.СЖАТИЕ;return 1/Math.pow(10,(-полн*0.6)/20);},
 цепь(ctx){const c=this.сжатие(ctx);const g=ctx.createGain();g.gain.value=this.снять||this.оценка();c.connect(g);return {c,g};},
 мерить(){if(this.снять||this.мерю)return;const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OAC)return;this.мерю=true;
  try{const sr=22050,ctx=new OAC(1,Math.round(sr*0.3),sr);const o=ctx.createOscillator();o.frequency.value=440;const a=ctx.createGain();a.gain.value=0.05;
   const c=this.сжатие(ctx);o.connect(a);a.connect(c);c.connect(ctx.destination);o.start();
   const fin=buf=>{try{const d=buf.getChannelData(0);let m=0;for(let i=Math.floor(d.length/2);i<d.length;i++)m=Math.max(m,Math.abs(d[i]));
     const k=m>0?0.05/m:0;if(k>0.2&&k<2){this.снять=k;if(this.после)this.после.gain.value=k;}}catch(_){}};
   const p=ctx.startRendering();if(p&&p.then)p.then(fin).catch(()=>{});else ctx.oncomplete=e=>fin(e.renderedBuffer);}catch(_){}},
 предел(ctx){if(!ctx||this.пред===ctx||!AE.master)return;this.пред=ctx;
  try{const {c,g}=this.цепь(ctx);AE.master.disconnect();AE.master.connect(c);g.connect(ctx.destination);this.лим=c;this.после=g;}
  catch(_){try{AE.master.connect(ctx.destination);}catch(__){}}},
 /* Сколько звучит разом: прямые плееры — по громкости, каналы среды — по
    усилению (с шиной эффектов). Петли фона и музыки — отдельно (фонК). */
 теснота(){const now=Date.now();if(now-this.тТ<120)return this.тЗ;let L=0,n=0;
  const fx=Math.max(0.05,Number(settings.fxVol)||0.7);
  try{for(const r of Voices.list){const e=r&&r.el;if(!e||e.__канал||e.paused||e.ended||e.__stopped)continue;L+=Math.min(1,Number(e.volume)||0);n++;}}catch(_){}
  try{for(const к of ЗвукСреда.каналы){if(!к.занят||!к.el||к.el.paused)continue;let g=0;try{g=к.g.gain.value;}catch(_){}L+=Math.min(1,g*fx);n++;}}catch(_){}
  this.тТ=now;this.тЗ={L,n};return this.тЗ;},
 /* род звука: окна, голоса, музыка и события (награда, задание, достижение) — свои; фон — только то, что
    подано каналом фона; прочее — мир */
 класс(role,kind,o){const c=safeFn(()=>Bank.chanOf(kind),"world");role=String(role||"");
  if(c==="ui")return "ui";if(c==="npc"||(o&&o.voice))return "голос";if(c==="music")return "музыка";
  if(kind==="event"||(o&&o.prio==="high"))return "событие";
  if(/^zv_/.test(role))return "зверь";
  if(this.ШАГ.test(role))return "шаг";
  if(this.ГЕРОЙ.test(role))return "герой";
  if(c==="ambient")return "фон";
  return "мир";},
 /* Множитель громкости нового звука по тесноте и роду. */
 множ(кл){const {L}=this.теснота();const T=1.5;const r=L>T?T/L:1;let k;   /* «событие», «ui», «голос», «маяк», «шаг», «герой», «зверь» — защищены */
  if(кл==="фон")k=Math.max(0.3,Math.pow(r,0.8));
  else if(кл==="мир")k=Math.max(0.5,Math.pow(r,0.55));
  else k=Math.max(0.8,Math.pow(r,0.25));
  if(k<0.999)this.счёт.убавлено++;
  if(кл==="шаг")k*=1.4;else if(кл==="герой")k*=1.25;
  return k;},
 в(кл,f,th,args){const п=this.кл;this.кл=кл;try{return f.apply(th,args);}finally{this.кл=п;}},
 /* Фон места приседает, пока тесно; возвращается медленнее, чем уходит. */
 тик(){const {L}=this.теснота();const цель=L>1.4?Math.max(0.55,Math.pow(1.4/L,0.6)):1;const б=this.фонК;
  this.фонК=б+(цель-б)*(цель<б?0.45:0.12);if(Math.abs(цель-this.фонК)<0.005)this.фонК=цель;
  if(this.фонК<1)this.приглушить();else if(б<1)safeFn(()=>Bank.refresh());},
 /* петли фона места — тише на фонК; громкость канала «фон» (Bank.vol) не меняется */
 приглушить(){const k=this.фонК;try{Bank.loops.forEach(c=>{if(!c||c.fading||!c.el||Bank.chanOf(c.kind)!=="ambient")return;
   const v=Math.max(0,Math.min(1,Bank.vol(c.kind)*(Number(c.gain)||0)*k));if(Math.abs(c.el.volume-v)>0.004)c.el.volume=v;});}catch(_){}}};
/* ограничитель — как только движок поднят; подъём сжатия мерится сразу (пробный движок звука не требует) */
safeFn(()=>Гул155.мерить());
safeFn(()=>{const e0=AE.ensure;AE.ensure=function(){const ctx=e0.apply(this,arguments);if(ctx&&Гул155.пред!==ctx)safeFn(()=>Гул155.предел(ctx));return ctx;};
 if(AE.ctx)Гул155.предел(AE.ctx);});
/* род звука — по его роли и каналу */
safeFn(()=>{const p0=Bank.play;Bank.play=function(role,o){o=o||{};const кл=Гул155.кл||Гул155.класс(role,o.kind||"fx",o);
 return Гул155.в(кл,p0,this,arguments);};});
safeFn(()=>{const f0=Bank.file;Bank.file=function(path,o){o=o||{};const p=String(path||"");
 const кл=Гул155.кл||(/(^|\/)hero_[mf]_/.test(p)?"герой":Гул155.ФАЙЛ_ШАГ.test(p)?"шаг":Гул155.класс("",o.kind||"fx",o));
 return Гул155.в(кл,f0,this,arguments);};});
safeFn(()=>{const b0=Bank.panned;Bank.panned=function(){return Гул155.в("маяк",b0,this,arguments);};});
safeFn(()=>{const c0=Звук.щелчок;Звук.щелчок=function(){return Гул155.в("ui",c0,this,arguments);};});
safeFn(()=>{const l0=playLeveled;playLeveled=matKeep(l0,function(role,o){const кл=Гул155.кл||(Гул155.ШАГ.test(String(role||""))?"шаг":Гул155.класс(role,(o&&o.kind)||"fx"));
 return Гул155.в(кл,l0,this,arguments);});});
safeFn(()=>{const a0=ZvSnd.at;ZvSnd.at=function(){return Гул155.в("зверь",a0,this,arguments);};});
/* звук с места (голоса местности, твари, жители): род — по каналу */
safeFn(()=>{const a0=Spatial.at;Spatial.at=function(path,dx,dy,o){const кл=Гул155.кл||Гул155.класс("",(o&&o.kind)||"fx",o);
 return Гул155.в(кл,a0,this,arguments);};});
/* прямой плеер одиночного звука: громкость по тесноте (петли фона и музыки заводятся без рода — их не трогаем) */
safeFn(()=>{const m0=Bank.make;Bank.make=function(file,volume,loop,rate){const кл=Гул155.кл;
 if(кл&&!loop&&кл!=="музыка"){volume=Math.min(0.95,(Number(volume)||0)*Гул155.множ(кл));}
 return m0.call(this,file,volume,loop,rate);};});
/* канал единой звуковой среды: усиление по тесноте */
safeFn(()=>{const i0=ЗвукСреда.играть;ЗвукСреда.играть=function(url,о){о=о||{};const кл=Гул155.кл||(о.voice?"голос":"мир");
 if(кл!=="музыка"){о=Object.assign({},о,{gain:(Number(о.gain)||0)*Гул155.множ(кл)});}
 return i0.call(this,url,о);};});
safeFn(()=>{Такт.каждые(350,()=>safeFn(()=>Гул155.тик()),"гул места");});
