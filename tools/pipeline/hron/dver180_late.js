/* ════════════════════════════════════════════════════════════════════════
   ДВЕРЬ СЛЫШНА (слово игрока, 11 ноября 2026)

   «Оставь прежний звук двери. Просто сделай его ярче, потому что сейчас его
   в игре практически не слышно».

   Замер показал, что так и было: «дверь закрывается» записана на −30 LUFS
   (почти тишина), «дверь отпирается» — на −26, а «дверь открывается» шла на
   половинной громкости и под рассказом терялась. Сам звук остаётся прежним:
   створка, петли и удар в косяк. Меняется две вещи:
   1) роли двери переходят на копии прежних записей — ярче (верх поднят) и
      громче, по замеру громкости (hron/dver_yarche.py; копии без потерь лежат
      рядом с исходниками, суффикс «_y»);
   2) связка деревянной, тяжёлой и скрипучей двери играет громче: открыть,
      закрыть, запереть, отпереть, толкнуть запертую.
   Взлом, пролом и двери иного рода (железо, ворота, решётка, тайная,
   магическая) звучат по-прежнему. */
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
  return this.роды.includes(род)&&this.состояния.includes(state)?Math.min(1,g*this.ярче):g;}};
safeFn(()=>{Object.keys(Дверь180.копии).forEach(r=>{if(SOUND_BANK[r])SOUND_BANK[r].f=Дверь180.копии[r].slice();});});
safeFn(()=>{const d0=doorSound;
 doorSound=function(kind,state,opts){const o=Object.assign({},opts||{});o.gain=Дверь180.громкость(kind,state,o.gain);return d0.call(this,kind,state,o);};});
