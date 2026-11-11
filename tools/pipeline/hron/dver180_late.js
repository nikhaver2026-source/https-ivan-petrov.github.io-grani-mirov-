/* ════════════════════════════════════════════════════════════════════════
   ДВЕРЬ И ВОРОТА СЛЫШНЫ (слова игрока, 11 ноября 2026)

   ДВЕРЬ. «Оставь прежний звук двери. Просто сделай его ярче, потому что
   сейчас его в игре практически не слышно».
   Замер показал, что так и было: «дверь закрывается» записана на −30 LUFS
   (почти тишина), «дверь отпирается» — на −26, а «дверь открывается» шла на
   половинной громкости и под рассказом терялась. Сам звук остаётся прежним:
   створка, петли и удар в косяк. Меняется вот что:
   1) роли двери переходят на копии прежних записей — ярче (верх поднят) и
      громче, по замеру громкости (hron/dver_yarche.py; копии без потерь лежат
      рядом с исходниками, суффикс «_y»);
   2) связка деревянной, тяжёлой и скрипучей двери играет громче: открыть,
      закрыть, запереть, отпереть, толкнуть запертую;
   3) звук двери и ворот — событие, а не «звук мира»: когда вокруг тесно
      (рассказ, фон места, шаги), игра убавляла его вдвое; теперь уступает не
      больше пятой части.

   ВОРОТА. «Найди качественный звук открытия и закрытия ворот, аутентичный:
   ворота в деревню, в город и так далее… вводи в игру и проверь, чтобы они
   были слышны и использовались, потому что далеко не всегда слышно открытие
   и закрытие, или вообще не слышно».
   Отчего их не было слышно: при входе звучала запись «ворота поставлены»,
   которая почти вся ниже 300 Гц (динамик телефона этого не отдаёт), на
   половинной громкости, да ещё убавленная вдвое теснотой; в деревню входили
   под звук двери дома; на выходе звучала «дверь закрывается» на −30 LUFS.
   Теперь у поселения свои ворота — записи, которые игрок прослушал и одобрил
   (hron/vorota_sborka.py, sounds/vorota): деревня — деревянные створки и
   засов; город (порт, посад, именной город) — тяжёлые створки городской
   стены; замок, крепость, цитадель — цепь ворота, засов и окованные створки;
   решётка — цепь и скрип железа. Ворота звучат:
   • когда стража пропускает в поселение (створки начинают раньше рассказа
     о месте);
   • при входе без стражи — один раз, не дважды; прежняя глухая запись
     порога под ними больше не звучит;
   • при выходе из поселения — створки закрываются за спиной;
   • когда герой сам отворяет ворота на улице поселения — со стороны ворот;
   • в связке «ворота» и «решётка» у дверей этого рода.
   Дверь дома внутри поселения остаётся дверью. */
const Дверь180={
 /* во сколько раз громче связка двери */
 ярче:1.6,
 роды:["wood","heavy","creaky"],
 состояния:["open","close","lock","unlock","locked"],
 копии:{oc_door_open:["oc/oc_door_open_01_y.flac","oc/oc_door_open_02_y.flac"],
  oc_door_close:["oc/oc_door_close_01_y.flac","oc/oc_door_close_02_y.flac"],
  oc_door_unlock:["oc/oc_door_unlock_01_y.flac"],
  deep_door:["deep/deep_door_01_y.flac"]},
 громкость(kind,state,gain){const g=gain==null?0.55:Number(gain)||0;
  const род=(typeof DOOR_SOUND!=="undefined"&&DOOR_SOUND[kind])?kind:"wood";
  return this.роды.includes(род)&&this.состояния.includes(state)?Math.min(1,g*this.ярче):g;},
 /* сыграть запись как событие: со стороны (если дана) или прямо; теснота её почти не убавляет */
 играть(role,o){const f=()=>{
   if((o.dx||o.dy)&&safeFn(()=>Spatial.role(role,o.dx,o.dy,{gain:o.gain,maxSec:o.maxSec,prio:"high"}),false))return true;
   return !!Bank.play(role,{gain:o.gain,maxSec:o.maxSec,pitchVar:o.pitchVar==null?0.05:o.pitchVar,prio:"high"});};
  return typeof Гул155!=="undefined"&&Гул155&&typeof Гул155.в==="function"?Гул155.в("событие",f,this,[]):f();}};
const Ворота180={
 громкость:0.9,длина:7,
 /* через сколько после начала створок начинается рассказ о месте */
 пауза:450,
 имена:{village:"ворота деревни",city:"городские ворота",castle:"ворота замка"},
 /* какие ворота у поселения: деревня; город (порт, посад, именной город); замок (замок, крепость, цитадель) */
 род(stype,x,y){
  if(stype==="village")return "village";
  if(stype==="port"||stype==="burg")return "city";
  if(stype==="castle")return safeFn(()=>cityAt(x,y),null)?"city":"castle";
  if(stype==="fortress"||stype==="citadel")return "castle";
  return null;},
 /* ворота поселения, в котором герой сейчас (на поверхности) */
 тут(){const p=G.place;if(!p||p.kind!=="city"||(Number(p.depth)||0)>0||p.тайник)return null;return this.род(p.stype,p.bx,p.by);},
 /* сыграть ворота: что — "open" или "close" */
 звук(род,что,o){o=o||{};const role="vr_"+род+"_"+(что==="close"?"close":"open");
  if(!safeFn(()=>Bank.has(role),false))return false;
  this._играло={t:Date.now(),род,что};
  return !!safeFn(()=>Дверь180.играть(role,{gain:o.gain==null?this.громкость:o.gain,maxSec:this.длина,dx:o.dx||0,dy:o.dy||0,pitchVar:0.03}),false);},
 /* вход в поселение и выход из него зовут «дверь места» без стороны: вместо неё — ворота.
    Возвращает null, если это не переход через ворота поселения. */
 переход(state,o){if(o.dx||o.dy)return null;const now=Date.now();
  if(state==="open"&&now-(this._вход||0)<700){const род=this.тут();if(!род)return null;
   /* стража уже отворила ворота — второй раз не звучат */
   const и=this._играло;if(и&&и.что==="open"&&now-и.t<3000)return true;
   return this.звук(род,"open")||null;}
  if(state==="close"&&this._выход&&now-this._выход.t<400){const род=this._выход.род;this._выход=null;if(!род)return null;
   return this.звук(род,"close")||null;}
  return null;}};
/* ── записи ── */
safeFn(()=>{Object.keys(Дверь180.копии).forEach(r=>{if(SOUND_BANK[r])SOUND_BANK[r].f=Дверь180.копии[r].slice();});});
safeFn(()=>{const W="(ворота 0 A.D., Wildfire Games, CC BY-SA 3.0)",B="(BigSoundBank, Joseph Sardin, CC0)";
 Object.assign(SOUND_BANK,{
  vr_village_open:{f:["vorota/vr_village_open_01.flac","vorota/vr_village_open_02.flac"],d:`Ворота деревни отворяются: засов и тяжёлая деревянная створка ${B}`},
  vr_village_close:{f:["vorota/vr_village_close_01.flac","vorota/vr_village_close_02.flac"],d:`Ворота деревни закрываются: створка в косяк и засов ${B}`},
  vr_city_open:{f:["vorota/vr_city_open_01.flac","vorota/vr_city_open_02.flac"],d:`Городские ворота отворяются: запор, скрип больших петель, долгий ход створок ${W}`},
  vr_city_close:{f:["vorota/vr_city_close_01.flac","vorota/vr_city_close_02.flac"],d:`Городские ворота закрываются: ход створок и глухой удар ${W}`},
  vr_castle_open:{f:["vorota/vr_castle_open_01.flac","vorota/vr_castle_open_02.flac"],d:`Ворота замка отворяются: цепь ворота или засов, затем окованные створки ${W}`},
  vr_castle_close:{f:["vorota/vr_castle_close_01.flac","vorota/vr_castle_close_02.flac"],d:`Ворота замка закрываются: ход створок, удар, цепь или засов ${W}`},
  vr_grate_up:{f:["vorota/vr_grate_up_01.flac"],d:`Решётка поднимается: цепь и скрип железа ${B}`},
  vr_grate_down:{f:["vorota/vr_grate_down_01.flac"],d:`Решётка опускается: цепь и удар железа ${B}`}});
 if(typeof BANK_CATS!=="undefined")BANK_CATS.vorota="Ворота поселений: деревня, город, замок; подъёмная решётка";
 if(typeof BANK_GROUPS!=="undefined"){const g=BANK_GROUPS.find(g=>g.dirs.includes("adv"))||BANK_GROUPS.find(g=>g.dirs.includes("oc"));if(g&&!g.dirs.includes("vorota"))g.dirs.push("vorota");}
 if(typeof ENC_FOLDER!=="undefined")ENC_FOLDER.vorota="mech";
 /* связка рода «ворота» и «решётка» */
 Object.assign(DOOR_SOUND.gate,{open:["vr_city_open"],close:["vr_city_close"]});
 Object.assign(DOOR_SOUND.grate,{open:["vr_grate_up"],close:["vr_grate_down"]});});
/* ── дверь: громче, событием; ворота — вместо двери места ── */
safeFn(()=>{const d0=doorSound;
 doorSound=function(kind,state,opts){
  const m=DOOR_SOUND[kind]||DOOR_SOUND.wood;const list=m[state];if(!list||!list.length)return false;
  const o=Object.assign({gain:0.55,maxSec:3,dx:0,dy:0},opts||{});
  /* вход в поселение и выход из него — ворота поселения, один раз */
  const в=Ворота180.переход(state,o);if(в!==null)return в;
  /* род «ворота»: створки того поселения, где герой; вне поселения — городские */
  if(kind==="gate"&&(state==="open"||state==="close")&&Ворота180.звук(Ворота180.тут()||"city",state,{dx:o.dx,dy:o.dy}))return true;
  const g0=Дверь180.громкость(kind,state,opts&&opts.gain);
  const play=(role,g)=>Дверь180.играть(role,{gain:g,maxSec:/^vr_/.test(role)?Math.max(o.maxSec,Ворота180.длина):o.maxSec,dx:o.dx,dy:o.dy});
  safeFn(()=>play(list[0],/^vr_/.test(list[0])?Math.max(g0,Ворота180.громкость):g0));
  list.slice(1).forEach((r,i)=>setTimeout(()=>safeFn(()=>play(r,g0*0.75)),180+i*160));
  return true;};});
/* дверь дома в порту и посаде — деревянная дверь, а не ворота (прежде род двери брался по роду места) */
safeFn(()=>{const k0=doorKindHere;doorKindHere=function(tile){const k=k0.apply(this,arguments);
 return k==="gate"&&tile==="+"&&Ворота180.тут()?"wood":k;};});
/* герой сам распахивает дверь: створка, петли и удар в косяк — всё событием */
safeFn(()=>{if(typeof Двери147==="undefined"||typeof Гул155==="undefined")return;const р0=Двери147.распахнуть;
 Двери147.распахнуть=function(){return Гул155.в("событие",р0,this,arguments);};});
/* вход и выход: пометить, что «дверь места» сейчас — ворота поселения */
safeFn(()=>{const e0=enterPlace;enterPlace=function(c){Ворота180._вход=Date.now();
 Ворота180._порог=safeFn(()=>Ворота180.род(c.structure.type,c.x,c.y),null);
 try{return e0.apply(this,arguments);}finally{Ворота180._порог=null;}};});
/* порог поселения с воротами: прежняя глухая запись «ворота поставлены» вторым слоем не нужна — отворяются сами ворота */
safeFn(()=>{const p0=Bank.play;Bank.play=function(role,o){if(role==="hall_gate"&&Ворота180._порог)return null;return p0.apply(this,arguments);};});
safeFn(()=>{const l0=leavePlace;leavePlace=function(){const p=G.place;
 Ворота180._выход={t:Date.now(),род:safeFn(()=>Ворота180.тут(),null)};
 return l0.apply(this,arguments);};});
/* стража пропустила: отворяются ворота этого поселения */
safeFn(()=>{if(typeof Стража147==="undefined")return;
 Стража147.войти=function(c){const потом=this._потом;this._потом=null;
  const род=safeFn(()=>Ворота180.род(c.structure.type,c.x,c.y),null);
  const сыграло=!!(род&&safeFn(()=>Ворота180.звук(род,"open"),false));
  if(!сыграло)safeFn(()=>{Bank.play("hall_gate",{gain:0.6,maxSec:4});});
  setTimeout(()=>safeFn(()=>потом?потом():enterPlace(c)),сыграло?Ворота180.пауза:450);};});
/* герой сам отворяет ворота на улице поселения: створки слышны со стороны ворот */
safeFn(()=>{if(typeof Двери147==="undefined")return;const д0=Двери147.действие;
 Двери147.действие=function(d){
  if(d&&d.вид==="ворота"&&!this.открыта(d)){const род=Ворота180.тут();
   if(род){const {dx,dy}=this.dxdy(d);setPlaceMark(d.x,d.y,"open");
    safeFn(()=>beaconAt("gate",dx,dy,0,1));safeFn(()=>Ворота180.звук(род,"open",{dx,dy}));
    narrate(`Вы отворили городские ворота ${dirWhere(d.dir)}. Шагните или коснитесь дважды ещё раз — встанете в воротах.`,{interrupt:true});return true;}}
  return д0.apply(this,arguments);};});
