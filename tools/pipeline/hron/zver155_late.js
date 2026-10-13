/* ════════════════════════════════════════════════════════════════════════
   ПИТОМЦЫ И МАУНТЫ: ПРОСЬБЫ ИГРОКА (15.5)
   1. Спешился — скакун идёт рядом, а не остаётся там, где вы сошли («вышел из
      подземелья, а маунта нет»). Пересел на другого — прежний уходит домой, в
      зверинец; «Позвать к себе» приводит любого отовсюду. Везде — «дома, в
      зверинце», а не «в стойле». «Оседлать зверя» сажает на любого скакуна.
   2. Маунта можно отпустить на волю, как питомца (с подтверждением).
   3. Под седлом — только шаг зверя: человеческих шагов в езде и беге нет. У
      копытных — копыта, у лапчатых — новые шаги лап (sounds/zvlapy), у ползучих
      — ползание. Спутник, на котором вы сидите, не шагает ещё и следом.
   4. Питомец в бою бьёт и лечит своим чередом — не только вслед за ударом
      героя; лечение слышно ясно; лекарь (феникс и др.) подлечивает раненого
      хозяина и в пути.
   5. В окнах «Питомцы» и «Маунты» синтезатор не перебивают посторонние фразы:
      фоновые реплики игры ждут, пока окно закроется, и звучат после.
   ════════════════════════════════════════════════════════════════════════ */
/* ── 3. Шаги зверей: копыта, лапы, ползание — у каждого рода свои, без шагов человека ──
   Прежде у многих родов в шаге, езде и беге стояли шаги человека (по траве,
   земле, щебню, песку), чтобы ни один род не звучал как другой; под седлом
   они и слышались как шаги самого героя. Теперь у каждого рода свой склад
   лап или копыт (sounds/zvlapy, из шагов и копыт 0 A.D., CC BY-SA 3.0, и
   синтеза: щелчок когтя, треск углей, звон стекла, мокрый шлепок), а наборы
   по-прежнему не повторяются. */
safeFn(()=>{if(typeof ENC_FOLDER!=="undefined")ENC_FOLDER.zvlapy="animals";
 if(typeof BANK_CATS!=="undefined")BANK_CATS.zvlapy="Шаги лап и копыт: свой ход у каждого зверя и скакуна";
 if(typeof BANK_GROUPS!=="undefined"){const g=BANK_GROUPS.find(g=>g.dirs&&g.dirs.includes("zv"));if(g&&!g.dirs.includes("zvlapy"))g.dirs.push("zvlapy");}});
{const Л="(из шагов и копыт 0 A.D., CC BY-SA 3.0)";const ф=(r,n)=>Array.from({length:n},(_,i)=>`zvlapy/${r}_0${i+1}.flac`);
 const D={zv_paw_walk:[4,"Шаг лап: зверь ступает мягко, передней и задней лапой"],zv_paw_run:[3,"Бег лап: четыре касания, галоп"],
  zv_paw_soft:[3,"Кошачий шаг: лёгкие бархатные лапы"],zv_paw_snow:[3,"Лапы по снегу: мягкий хруст"],zv_paw_heavy:[3,"Тяжёлые лапы большой кошки"],
  zv_paw_trot:[3,"Рысца пса: три частых касания"],zv_paw_light:[3,"Лисий шаг: лёгкое касание и тень второго"],zv_paw_sand:[3,"Мягкие лапы по песку"],
  zv_claw_step:[3,"Лапы с когтями: касание и щелчок когтя"],zv_paw_ember:[3,"Угольный пёс: тяжёлые лапы и треск углей"],
  zv_paw_glass:[3,"Стеклянная рысь: мягкие лапы и звон стекла"],zv_paw_ash:[3,"Пепельный волк: лапы по пеплу, глухо"],
  zv_hoof_light:[3,"Лёгкое копыто оленя"],zv_hoof_heavy:[3,"Тяжёлое копыто: лось и тур"],zv_hoof_cloven:[3,"Раздвоенное копыто: кабан и баран"],
  zv_hoof_stone:[3,"Копыто по камню со стуком"],zv_hoof_ash:[3,"Копыто по пеплу, глухо"],zv_hoof_wet:[3,"Мокрое копыто: шаг и шлепок воды"]};
 for(const [r,[n,d]] of Object.entries(D))SOUND_BANK[r]={f:ф(r,n),d:`${d} ${Л}`};}
safeFn(()=>Object.assign(ZV_LEVEL,{"zvlapy/zv_claw_step_01.flac":1.01,"zvlapy/zv_claw_step_02.flac":1.29,"zvlapy/zv_claw_step_03.flac":1.26,"zvlapy/zv_hoof_ash_01.flac":1.0,"zvlapy/zv_hoof_ash_02.flac":1.0,"zvlapy/zv_hoof_ash_03.flac":1.0,"zvlapy/zv_hoof_cloven_01.flac":1.01,"zvlapy/zv_hoof_cloven_02.flac":1.01,"zvlapy/zv_hoof_cloven_03.flac":1.0,"zvlapy/zv_hoof_heavy_01.flac":1.0,"zvlapy/zv_hoof_heavy_02.flac":1.0,"zvlapy/zv_hoof_heavy_03.flac":1.01,"zvlapy/zv_hoof_light_01.flac":1.0,"zvlapy/zv_hoof_light_02.flac":1.0,"zvlapy/zv_hoof_light_03.flac":1.01,"zvlapy/zv_hoof_stone_01.flac":1.0,"zvlapy/zv_hoof_stone_02.flac":1.0,"zvlapy/zv_hoof_stone_03.flac":1.0,"zvlapy/zv_hoof_wet_01.flac":1.0,"zvlapy/zv_hoof_wet_02.flac":1.01,"zvlapy/zv_hoof_wet_03.flac":1.0,"zvlapy/zv_paw_ash_01.flac":1.0,"zvlapy/zv_paw_ash_02.flac":1.01,"zvlapy/zv_paw_ash_03.flac":1.01,"zvlapy/zv_paw_ember_01.flac":1.09,"zvlapy/zv_paw_ember_02.flac":1.52,"zvlapy/zv_paw_ember_03.flac":1.0,"zvlapy/zv_paw_glass_01.flac":1.0,"zvlapy/zv_paw_glass_02.flac":1.01,"zvlapy/zv_paw_glass_03.flac":1.0,"zvlapy/zv_paw_heavy_01.flac":1.0,"zvlapy/zv_paw_heavy_02.flac":1.01,"zvlapy/zv_paw_heavy_03.flac":1.0,"zvlapy/zv_paw_light_01.flac":1.0,"zvlapy/zv_paw_light_02.flac":1.01,"zvlapy/zv_paw_light_03.flac":1.0,"zvlapy/zv_paw_run_01.flac":1.01,"zvlapy/zv_paw_run_02.flac":1.01,"zvlapy/zv_paw_run_03.flac":1.01,"zvlapy/zv_paw_sand_01.flac":1.0,"zvlapy/zv_paw_sand_02.flac":1.0,"zvlapy/zv_paw_sand_03.flac":1.0,"zvlapy/zv_paw_snow_01.flac":0.91,"zvlapy/zv_paw_snow_02.flac":0.99,"zvlapy/zv_paw_snow_03.flac":1.03,"zvlapy/zv_paw_soft_01.flac":1.0,"zvlapy/zv_paw_soft_02.flac":1.0,"zvlapy/zv_paw_soft_03.flac":1.0,"zvlapy/zv_paw_trot_01.flac":1.01,"zvlapy/zv_paw_trot_02.flac":1.0,"zvlapy/zv_paw_trot_03.flac":1.0,"zvlapy/zv_paw_walk_01.flac":1.0,"zvlapy/zv_paw_walk_02.flac":1.02,"zvlapy/zv_paw_walk_03.flac":1.01,"zvlapy/zv_paw_walk_04.flac":1.02}));
const ЗВ_ШАГ155={
 stag:{ш:["zv_hoof_light"],бег:["zv_ride_gallop","zv_hoof_light"]},
 elk:{ш:["zv_hoof_heavy","tread_hoof"],е:["zv_ride_walk","zv_hoof_heavy"],бег:["zv_ride_trot","zv_hoof_heavy"]},
 wolf:{ш:["zv_paw_walk"],е:["zv_paw_walk"],бег:["zv_paw_run"]},
 lynx:{ш:["zv_paw_soft","zv_paw_snow"]},
 boar:{ш:["zv_hoof_cloven"],е:["tread_hoof","zv_hoof_cloven"]},
 ram:{ш:["zv_hoof_cloven","zv_hoof_stone"],е:["zv_ride_walk","zv_hoof_cloven"],бег:["zv_ride_trot","zv_hoof_cloven"]},
 aurochs:{ш:["zv_hoof_heavy","brute_step"],бег:["brute_step","zv_hoof_heavy"]},
 camel:{ш:["zv_paw_sand"],е:["zv_paw_sand","zv_ride_walk"],бег:["zv_ride_trot","zv_paw_sand"]},
 lion:{ш:["zv_paw_heavy"],е:["zv_paw_heavy"],бег:["zv_paw_run","zv_paw_heavy"]},
 hound:{ш:["zv_paw_trot"]},fox:{ш:["zv_paw_light"]},cat:{ш:["zv_paw_soft"]},
 unicorn:{ш:["zv_hoof_light","tread_hoof"],е:["zv_ride_walk","zv_hoof_light"],бег:["zv_ride_gallop","tread_hoof"]},
 runner:{ш:["zv_claw_step"],е:["zv_claw_step","zv_paw_run"],бег:["zv_paw_run","zv_claw_step"]},
 steed:{ш:["oc_metal_light","horse_step"],е:["oc_metal_light","oc_steam"]},
 centipede:{е:["prop_crawl","zv_claw_step"]},
 salamander:{ш:["zv_paw_sand","prop_crawl"]},
 tortoise:{ш:["brute_step","oc_rock_hit"]},
 scorpion:{ш:["creatures/cr_spider_step.flac","zv_claw_step"]},
 lizard:{ш:["zv_paw_sand","zv_claw_step"]},
 badger:{ш:["zv_claw_step","oc_dig"]}};
safeFn(()=>{for(const [k,v] of Object.entries(ЗВ_ШАГ155))if(ZV_SND[k])Object.assign(ZV_SND[k],v);});
safeFn(()=>{const L={ashmare:{а:["zv_hoof_ash"]},
  stonebeetle:{е:["prop_crawl","zv_claw_step"]},
  mistelk:{е:["tread_hoof","zv_hoof_light"],бег:["zv_ride_trot","zv_hoof_light"]},
  boneram:{е:["tread_hoof","zv_hoof_stone"],бег:["zv_ride_trot","zv_hoof_stone"]},
  tidehorse:{е:["zv_ride_walk","zv_hoof_wet"],вода:["oc_splash","stk_splash","oc_swim"]},
  emberhound:{е:["zv_paw_ember"],бег:["zv_pant","zv_paw_run"]},
  glasslynx:{е:["zv_paw_glass"],бег:["zv_paw_glass","lug_whoosh"]},
  ashwolf:{е:["zv_paw_ash"],бег:["zv_pant","zv_paw_ash"]}};
 for(const [k,v] of Object.entries(L))if(ZV_LEGRIDE150[k])Object.assign(ZV_LEGRIDE150[k],v);});
/* под седлом в голосах местности нет чужих шагов человека (шлёп по воде в топи, стук шагов в городе): их легко
   принять за собственные шаги, будто герой сошёл и идёт сам */
safeFn(()=>{const s0=Ambience.spots.bind(Ambience);const ЧЕЛ=/^(tread_(?!hoof)|step_|mtg_step_|lug_step_|oc_step_|hero_step_)/;
 Ambience.spots=function(name){const L=s0(name)||[];return safeFn(()=>Stable.riding(),null)?L.filter(([r])=>!ЧЕЛ.test(String(r))):L;};});
/* спутники следом — своим шагом; тот, на ком вы сидите, следом не шагает */
ZvWalk.follow=function(){const pets=safeFn(()=>Zver.pets(),[])||[];const s=Zver.st();const inWater=safeFn(()=>/water|sea|coast|lake|river/.test(cellContent(G.x,G.y).terrain[0]),false);
 pets.filter(a=>a.uid!==s.mount).slice(0,2).forEach((a,i)=>{if(a.ранен||a.задание)return;const f=Zver.fam(a);if(!f)return;
  const редко=pets.length>1?(this.n+i)%2:(f.ход==="fly"?this.n%2:f.ход==="dig"?this.n%3:0);if(редко)return;
  const p=ZvSnd.prof(a);const суша=f.ход==="swim"&&!inWater;const L=суша?({seaserp:["prop_crawl"],hippocamp:["zv_hoof_wet"],otter:["zv_paw_light"]}[f.id]||["zv_paw_walk"]):(p.ш||["zv_paw_walk"]);const pos=ZvSnd.behind(i);
  ZvSnd.later(130+i*110,()=>ZvSnd.play(L,Object.assign({maxSec:1,gain:0.55,rate:ZvSnd.rate(a)},pos)));
  if(!суша)ZvSnd.stepAccent(a,pos,130+i*110);
  if(Math.random()<0.035)ZvSnd.later(600+i*400,()=>ZvSnd.voice(a,Object.assign({gain:0.7,i},ZvSnd.behind(i))));});};
/* звуки зверей громче и ярче: прибавка и подъём верхней середины */
safeFn(()=>{const at0=ZvSnd.at;ZvSnd.at=function(file,dx,dy,o){o=Object.assign({},o||{});o.gain=(o.gain===undefined?0.85:Number(o.gain)||0)*1.35;
 const ig=ЗвукСреда.играть;ЗвукСреда.играть=function(url,оп){if(оп&&оп.eq&&оп.eq.f===2800)оп=Object.assign({},оп,{eq:{f:3400,q:0.7,g:5.5},звери:true});return ig.call(this,url,оп);};
 try{return at0.call(this,file,dx,dy,o);}finally{ЗвукСреда.играть=ig;}};});
/* ── 1. Скакун идёт рядом; прочие — дома, в зверинце ── */
const Маунт155={
 прятать:0,зван:null,
 рядом(k){Stable.st().pos[k]={w:"рядом"};},
 идёт(k){return (Stable.st().pos[k]||{}).w==="рядом";},
 домой(k){delete Stable.st().pos[k];},
 слезть(k){if(!k)return;if(k.startsWith("zv:"))Zver.st().mount=null;else G.mount=null;},
 /* слова о посадке и спешивании звучат после звука седла (ZvLater): новые слова — на место прежних */
 позже(t0,t){safeFn(()=>{if(typeof ZvLater!=="undefined"&&ZvLater.text===String(t0))ZvLater.text=String(t);});return t;},
 /* отпустить на волю: зверь — со снаряжением на нём; со скакуна тайных палат снаряжение — в сумку */
 отпустить(k){const M=Stable.mBy(k);if(!M)return "Такого скакуна нет.";const b=Stable.st();
  if(Stable.riding()===k)this.слезть(k);delete b.pos[k];if(b.last155===k)delete b.last155;delete b.legCare[k];
  if(M.kind==="zv"){safeFn(()=>ZvSnd.voice(M.a,{gain:0.8}));return Zver.release(M.a.uid);}
  const id=M.id;G.mounts=(G.mounts||[]).filter(x=>x!==id);if(G.mount===id)G.mount=null;
  const gear=b.legGear[id]||{};const s=Zver.st();for(const [slot,mat] of Object.entries(gear)){const kk=Zver.gearKey(slot,mat);s.gear[kk]=(Number(s.gear[kk])||0)+1;}
  delete b.legGear[id];delete b.legLv[id];safeFn(()=>ZvSnd.legVoice(M,{gain:0.8}));
  return `${M.n} уходит на волю.${Object.keys(gear).length?" Снаряжение с него — в сумке.":""}`;}};
/* старые сохранения: скакун, оставленный «там, где сошли», идёт рядом */
safeFn(()=>{const s0=Stable.st.bind(Stable);Stable.st=function(){const b=s0();
 if(!b.v155){b.v155=1;for(const k of Object.keys(b.pos)){const p=b.pos[k];if(p&&p.w!=="рядом")b.pos[k]={w:"рядом"};}}return b;};});
safeFn(()=>{const pn0=Stable.posNear.bind(Stable);Stable.posNear=function(p,R){if(p&&p.w==="рядом")return G.ship?null:{dx:0,dy:0,d:0,рядом:true};return pn0(p,R);};});
/* Идущий рядом скакун — не в счёте «что рядом» и подходов (он всегда здесь — не твердить о нём на каждом шаге),
   но в окне «Что вокруг» он есть, как сундук: «Сесть верхом» и прочее. «Действие здесь» сажает в седло, когда
   больше делать здесь нечего или скакуна только что позвали; иначе — то, что здесь есть. */
safeFn(()=>{const n0=Stable.near.bind(Stable);Stable.near=function(R){return (n0(R)||[]).filter(x=>!(x&&x.M&&Маунт155.идёт(x.M.k)));};});
safeFn(()=>{const o0=Stable.objects.bind(Stable);Stable.objects=function(){const out=o0()||[];if(Маунт155.прятать||G.ship)return out;
 for(const M of this.mountsAll()){if(!Маунт155.идёт(M.k)||this.riding()===M.k)continue;const x=G.place?G.place.x:G.x,y=G.place?G.place.y:G.y;
  out.push({вид:"mount",mk:M.k,n:`${M.n} — ваш скакун, идёт рядом`,x,y,dx:0,dy:0,d:0,маяк:null,
   о:`${this.cap(this.verb(M).toLowerCase())} — главное действие. ${M.kind==="zv"?Zver.fam(M.a).о:M.m.d}`,
   состояние:M.kind==="zv"?`сытость ${Math.round(M.a.сыт)}, верность ${Math.round(M.a.верн)}`:`выучка «${MOUNT_TRAIN[this.legLv(M.id)].n}»`,
   главное:()=>{narrate(this.mountUp(M.k),{interrupt:true});safeFn(()=>{saveGame(true);refresh();});}});}
 return out;};});
safeFn(()=>{const u0=useHere;useHere=matKeep(u0,function(){
 try{if(!G.inCombat&&!G.ship&&!safeFn(()=>BeastMeet.here(),false)&&!Stable.riding()){
   const M=Stable.mountsAll().find(M=>Маунт155.идёт(M.k));
   if(M&&(Маунт155.зван===M.k||!(safeFn(()=>oh0objs(),[])||[]).length)){Маунт155.зван=null;const t=Stable.mountUp(M.k);narrate(t,{interrupt:true});safeFn(()=>{saveGame(true);refresh();});return true;}}}catch(_){}
 Маунт155.прятать++;try{return u0.apply(this,arguments);}finally{Маунт155.прятать--;}});});
safeFn(()=>{const w0=Stable.posWords.bind(Stable);Stable.posWords=function(p){if(!p)return "дома, в зверинце";if(p.w==="рядом")return "идёт рядом с вами";return w0(p);};});
safeFn(()=>{const w0=Stable.petWhere.bind(Stable);Stable.petWhere=function(a){return String(w0(a)).replace("дома, в стойле зверинца","дома, в зверинце");};});
safeFn(()=>{const f0=Zver.follow.bind(Zver);Zver.follow=function(u){return String(f0(u)).replace("остаётся в стойле","остаётся дома, в зверинце").replace("Оставьте одного в стойле","Оставьте одного дома, в зверинце");};});
safeFn(()=>{const b0=Zver.brief.bind(Zver);Zver.brief=function(a){return String(b0(a)).replace(/в стойле/g,"дома, в зверинце");};});
safeFn(()=>{const b0=Zver.btn.bind(Zver);Zver.btn=function(c,l,sp){const r=x=>x==null?x:String(x).replace("Оставить в стойле","Оставить дома, в зверинце");return b0(c,r(l),r(sp));};});
/* спешиться: скакун идёт рядом */
safeFn(()=>{const d0=Stable.dismountHere;Stable.dismountHere=function(){const k=safeFn(()=>this.riding(),null);const M=k?safeFn(()=>this.mBy(k),null):null;
 const t=d0.apply(this,arguments);if(k&&!safeFn(()=>this.riding(),null)){Маунт155.рядом(k);
  return Маунт155.позже(t,`Вы спешились. ${M?M.n:"Скакун"} идёт рядом с вами. Снова в седло — «Оседлать зверя» в меню действий или в окне «Маунты».`);}
 return t;};});
safeFn(()=>{const d0=Zver.dismount;Zver.dismount=function(){const a=this.mount();const r=d0.apply(this,arguments);if(a)safeFn(()=>Маунт155.рядом("zv:"+a.uid));return r;};});
safeFn(()=>{const dm0=dismissMount;dismissMount=function(){const id=G.mount;if(!id)return dm0.apply(this,arguments);
 const sv=Speech.say;Speech.say=function(t,o){return sv.call(Speech,String(t).replace("отходит в сторону и ждёт","идёт рядом с вами"),o);};
 let r;try{r=dm0.apply(this,arguments);}finally{Speech.say=sv;}safeFn(()=>Маунт155.рядом("leg:"+id));return r;};});
/* пересел: прежний — домой; позвать — идёт рядом; запомнить, на ком ехали */
safeFn(()=>{const u0=Stable.mountUp;Stable.mountUp=function(k){const prev=safeFn(()=>this.riding(),null);const t=u0.apply(this,arguments);
 if(this.riding()===k){const b=this.st();b.last155=k;delete b.pos[k];
  if(prev&&prev!==k){Маунт155.домой(prev);const P=this.mBy(prev);return Маунт155.позже(t,`${t} ${P?P.n:"Прежний скакун"} уходит домой, в зверинец.`);}}
 return t;};});
safeFn(()=>{const l0=Stable.leaveCurrent;Stable.leaveCurrent=function(keep){const k=this.riding();if(!k||k===keep)return l0.apply(this,arguments);
 Маунт155.слезть(k);Маунт155.домой(k);return k;};});
safeFn(()=>{const r0=Zver.ride;Zver.ride=function(u){const r=r0.apply(this,arguments);if(/^Вы верхом/.test(String(r)))safeFn(()=>{const b=Stable.st();b.last155="zv:"+Number(u);delete b.pos["zv:"+Number(u)];});return r;};});
safeFn(()=>{const c0=Stable.call;Stable.call=function(k){const M=this.mBy(k);const r=c0.apply(this,arguments);
 if(M&&this.riding()!==k&&!G.ship&&/приходит/.test(String(r))){Маунт155.рядом(k);
  Маунт155.зван=k;return `Вы зовёте — и ${M.n} приходит и идёт рядом с вами. ${this.verb(M)} — кнопкой здесь, «Действием здесь» или «Оседлать зверя» в меню действий.`;}
 return r;};});
/* окно «Маунты»: слова о том, где кто; «Оставить дома» и «Отпустить на волю» */
safeFn(()=>{const h0=Stable.mountsHome;Stable.mountsHome=function(){const l0=this.line;
 this.line=function(t){return l0.call(this,String(t).replace(/Скакун, с которого вы сошли, ждёт на том месте:[^.]*\./,"Скакун, с которого вы сошли, идёт рядом с вами; прочие — дома, в зверинце: «Позвать к себе» приводит любого."));};
 try{return h0.apply(this,arguments);}finally{this.line=l0;}};});
safeFn(()=>{const v0=Stable.mountView;Stable.mountView=function(k){const M=this.mBy(k);if(!M)return v0.apply(this,arguments);const s0=this.show;
 this.show=function(modal,title,html){let доп="";if(this.riding()!==k&&Маунт155.идёт(k))доп+=this.btn(`mnt:home155:${k}`,"Оставить дома, в зверинце");
  доп+=this.btn(`mnt:free:${k}`,"Отпустить на волю");
  const back=`<button type="button" class="item" data-cmd="mnt:home"`;const i=String(html).lastIndexOf(back);
  return s0.call(this,modal,title,i>=0?html.slice(0,i)+доп+html.slice(i):html+доп);};
 try{return v0.apply(this,arguments);}finally{this.show=s0;}};});
safeFn(()=>{const c0=Stable.mntCmd;Stable.mntCmd=function(arg){const parts=String(arg||"").split(":");const op=parts[0];const k=parts.slice(1,3).join(":");
 if(op==="home155"){const M=this.mBy(k);if(!M)return this.mountsHome();Маунт155.домой(k);safeFn(()=>Bank.play(this.voice(M),{gain:0.5,maxSec:2}));
  narrate(`${M.n} уходит домой, в зверинец: позовите — и придёт.`,{interrupt:true});safeFn(()=>saveGame(true));return this.mountView(k);}
 if(op==="free"){const M=this.mBy(k);if(!M)return this.mountsHome();
  if(parts[3]!=="yes")return this.show("modal-mounts",`Отпустить: ${M.n}?`,this.line(`${M.n} уйдёт на волю навсегда.`)+this.btn(`mnt:free:${k}:yes`,`Да, отпустить ${M.n}`)+this.btn(`mnt:view:${k}`,"Нет, оставить"));
  const t=Маунт155.отпустить(k);narrate(t,{interrupt:true});safeFn(()=>{saveGame(true);refresh();});return this.mountsHome();}
 return c0.apply(this,arguments);};});
/* «Оседлать зверя» — на любого скакуна: на того, на ком ехали, или на идущего рядом */
safeFn(()=>{CMD.zvride=function(){const k=Stable.riding();
 if(k){const t=Stable.dismountHere();narrate(t,{interrupt:true});safeFn(()=>{saveGame(true);refresh();});return;}
 const b=Stable.st();const все=Stable.mountsAll();let k2=b.last155&&Stable.mBy(b.last155)?b.last155:null;
 if(!k2){const M=все.find(M=>Маунт155.идёт(M.k));if(M)k2=M.k;}
 if(!k2&&все.length)k2=все[0].k;
 if(!k2){narrate("Скакуна нет: ездовых зверей покупают и приручают в зверинцах, а скакунов тайных палат находят в самих палатах.",{interrupt:true});return;}
 if(G.ship){narrate("На палубе в седло не садятся.",{interrupt:true});return;}
 if(!Маунт155.идёт(k2))Маунт155.рядом(k2);
 const t=Stable.mountUp(k2);narrate(t,{interrupt:true});safeFn(()=>{saveGame(true);refresh();});};});
safeFn(()=>{const a0=amAvailable;amAvailable=function(cmd){if(cmd==="zvride")return !!safeFn(()=>Stable.riding()||Stable.mountsAll().length>0,false);return a0.apply(this,arguments);};});
/* ── 4. Питомец бьётся и лечит своим чередом ── */
const ЗвБой155={таймер:null,
 пауза(){return 2400+Math.floor(Math.random()*900);},
 бойцы(){return (safeFn(()=>Zver.pets(),[])||[]).filter(a=>!a.ранен&&safeFn(()=>Zver.hp(a),0)>0&&(Number(a.сыт)||0)>=10&&!a.задание&&a.uid!==Zver.st().mount);},
 пуск(){if(this.таймер)return;const тик=()=>{this.таймер=null;if(!G.inCombat||!G.combat)return;safeFn(()=>this.ход());if(G.inCombat&&G.combat)this.таймер=setTimeout(тик,this.пауза());};
  this.таймер=setTimeout(тик,this.пауза());},
 свой:false,
 ход(){const cb=G.combat;if(!G.inCombat||!cb||!cb.m||!(Number(cb.hp)>0))return false;if(!this.бойцы().length)return false;
  if(Date.now()-(Number(cb.zvLast)||0)<2000)return false;   /* только что бил вслед за героем */
  let t="";this.свой=true;try{t=Zver.turn(cb,"pet");}finally{this.свой=false;}
  /* удары слышны звуком со стороны твари; строка — в журнале боя (тихий бой их не озвучивает) */
  if(t)safeFn(()=>cbLog(t));
  safeFn(()=>updateCombat());
  if(!(cb.hp>0)&&G.inCombat&&G.combat===cb)safeFn(()=>victory());
  return true;},
 /* лечение — и вслух, коротко: тихий бой пропускает его, как вести о своём здоровье */
 сказатьЛечение(t,л){const m=/лечит вас: \+(\d+)/.exec(String(t||""));if(!m||!л)return;
  if(!this.свой&&safeFn(()=>settings.cbSpeech===1,false))return;   /* журнал боя и так прочитан целиком */
  narrate(`${л.n} лечит вас: +${m[1]}.`,{interrupt:false,урон:"me",pri:2});},
 /* лечение слышно ясно: цветение, перезвон и голос лекаря */
 звукЛечения(t,a){if(!/лечит вас[:,] \+\d+/.test(String(t||"")))return;const pos=ZvSnd.near(0);
  ZvSnd.later(250,()=>ZvSnd.play(["heal_bloom"],Object.assign({maxSec:1.6,gain:1.1,chan:"magic"},pos)));
  ZvSnd.later(430,()=>ZvSnd.play(["magic_shimmer"],Object.assign({maxSec:1.2,gain:0.6,chan:"magic"},pos)));
  if(a)ZvSnd.later(720,()=>ZvSnd.voice(a,Object.assign({gain:0.75},pos)));},
 /* в пути: лекарь подлечивает раненого хозяина — раз в восемь шагов */
 шаг:0,сказал:0,
 путь(){if(G.inCombat||G.ship)return;const hpM=Number(G.hpMax)||0;if(!(Number(G.hp)<hpM))return;this.шаг++;if(this.шаг<8)return;
  const л=(safeFn(()=>Zver.pets(),[])||[]).find(a=>a.роль==="healer"&&!a.ранен&&safeFn(()=>Zver.hp(a),0)>0&&(Number(a.сыт)||0)>=10&&!a.задание);if(!л)return;this.шаг=0;
  const h=Math.max(1,Math.min(hpM-G.hp,Math.round(1+(Number(л.lvl)||1)*0.4+((л.ветви&&л.ветви.bond)||0)+safeFn(()=>Zver.skill(л,"healer"),0)*0.3)));
  G.hp=Math.min(hpM,(Number(G.hp)||0)+h);this.звукЛечения(`лечит вас: +${h}`,л);
  /* вслух — не на каждый раз: первое лечение после затишья и полное здоровье */
  const ж=safeFn(()=>Zver.fam(л).g==="ж",false)?"а":"";const now=Date.now();
  if(G.hp>=hpM){this.сказал=now;narrate(`${л.n} залечил${ж} ваши раны: здоровье полное, ${hpM}.`,{interrupt:false,pri:2});}
  else if(now-this.сказал>45000){this.сказал=now;narrate(`${л.n} лечит вас в пути: +${h}. Здоровье ${Math.round(G.hp)} из ${hpM}.`,{interrupt:false,pri:2});}}};
safeFn(()=>{const t0=Zver.turn;Zver.turn=function(cb,act){const r=t0.apply(this,arguments);if(cb)cb.zvLast=Date.now();
 safeFn(()=>{if(!/лечит вас: \+\d+/.test(String(r||"")))return;const л=(this.pets()||[]).find(a=>a.роль==="healer")||(this.pets()||[])[0];
  ЗвБой155.звукЛечения(r,л);ЗвБой155.сказатьЛечение(r,л);});return r;};});
safeFn(()=>{const sc0=startCombat;startCombat=matKeep(sc0,function(){const r=sc0.apply(this,arguments);
 safeFn(()=>{if(G.inCombat&&ЗвБой155.бойцы().length)ЗвБой155.пуск();});return r;});});
safeFn(()=>{const s0=ZvWalk.step.bind(ZvWalk);ZvWalk.step=function(){Маунт155.зван=null;const r=s0.apply(this,arguments);safeFn(()=>ЗвБой155.путь());return r;};});
/* ── 5. Окна «Питомцы» и «Маунты»: фоновые реплики ждут закрытия окна ── */
const ОкноЗвери155={очередь:[],
 открыто(){const L=safeFn(()=>activeLayer(),null);return !!(L&&(L.id==="modal-pets"||L.id==="modal-mounts"));},
 /* фоновая реплика: сказана без перебивания и не по просьбе игрока; важное (пали, на исходе, уровень) — сразу */
 фон(t,o){if(!o||o.interrupt!==false||o.user||o.nav||o.урон||o.речь)return false;
  if(["ui","combat","danger","achieve","approach"].includes(o.cat))return false;
  if(o.pri!=null&&Number(o.pri)<=1)return false;
  return !/на исходе|критическ|смертельн|вы пали|вы погиб|умира|новый уровень/i.test(String(t||""));},
 сброс(){if(!this.очередь.length||this.открыто())return;const q=this.очередь.splice(0);const now=Date.now();
  const t=[...new Set(q.filter(x=>now-x.t<90000).map(x=>x.s))];if(t.length)setTimeout(()=>safeFn(()=>Speech.say(t.join(" "),{interrupt:false})),450);}};
safeFn(()=>{const s0=Speech.say;Speech.say=function(t,o){
 try{if(ОкноЗвери155.открыто()&&ОкноЗвери155.фон(t,o)){
   ОкноЗвери155.очередь.push({s:String(t),t:Date.now()});if(ОкноЗвери155.очередь.length>12)ОкноЗвери155.очередь.shift();return true;}}catch(_){}
 return s0.apply(Speech,arguments);};});
safeFn(()=>{setInterval(()=>safeFn(()=>ОкноЗвери155.сброс()),1000);});
