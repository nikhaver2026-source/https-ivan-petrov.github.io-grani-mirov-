/* ═══════════════════════════════════════════════════════════════════════════
   14.6: ЗВЕРИ СЛЫШНЫ — СПУТНИК, ВЕРХОВАЯ ЕЗДА, РОСТ; ТОРГОВЛЯ СО СЧЁТОМ
   ───────────────────────────────────────────────────────────────────────────
   Просьбы игрока: «выбрал спутником инеистого скорпиона — пусть ходит со мной,
   дерётся, и это слышно его звуками: рычание и прочее; у разных питомцев
   разные звуки»; «сел на питомца-маунта — звуки езды, ползания или полёта,
   смотря по маунту»; «настоящие качественные звуки, когда кормишь зверей;
   звуки снаряжения и развития; новый уровень — не только словом, но и
   звуком; звук, когда питомец что-то подбирает или выполняет задание»;
   «звуки ярче, чтобы не терялись: феникс при кормлении еле слышен»; «питомец
   дошёл до второго уровня, а очков развития не получил»; «у торговца —
   отдельно „Купить“ и „Продать“, и сколько — свайпом вверх или вниз».
   1. Звуковой облик зверя (ZV_SND): у каждого из сорока шести родов свой
      голос, рык, удар, шаг, езда и манера есть; высота голоса — по роду и
      росту; облик (инеистый, огненный, теневой…) добавляет к удару свой
      отзвук: жало инеистого скорпиона хрустит льдом.
   2. Ярче: записи зверей идут своим трактом, громкость выровнена по самой
      записи (ZV_LEVEL, замерено при сборке), середина чуть поднята —
      тихий голос феникса больше не тонет.
   3. Спутник идёт следом: шаг за спиной, крылья у летучих, плеск у
      плавучих, рытьё у роющих; голос время от времени; в начале боя — рык;
      в бою — свой удар с места твари; раненый взвизгивает.
   4. Верхом: шаг маунта вместо шагов героя — копыта (шагом, а на бегу —
      рысью и галопом), мягкие лапы, тяжёлая поступь, ползание, крылья,
      плеск, рытьё. Сесть и спешиться — скрип седла.
   5. Кормление — живые записи (BigSoundBank, CC0): конь жуёт морковь,
      хрустит яблоко; мясо, мелочь, жвалы, кристаллы, рыба, огонь — каждый
      ест по-своему; сытая кошка мурлычет. Снаряжение — по месту (седло,
      узда, попона, подковы, ошейник…), развитие — нарастающий отзвук, новый
      уровень — голос зверя и перезвон, находка — нюх и находка,
      возвращение с задания — шаги и голос; уход (ласка, чистка, игра,
      лечение) — свои звуки.
   6. Очко развития — с каждым новым уровнем (прежде раз в три уровня, и на
      втором уровне очков не было); фраза об уровне после кормления больше
      не пропадает.
   7. Спутник сам подбирает находки в пути — то, что растёт и лежит в этой
      местности.
   8. Торговля: окна «Купить» и «Продать» раздельны — в каждом только свой
      товар; сколько — свайпом вверх или вниз по товару (стрелками вверх и
      вниз в Windows), двойное касание (Enter) — сделка.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Звуковой облик зверя ──
   г — голос, р — рык, у — удар, ш — шаг спутника, е — езда шагом, бег — езда
   на бегу, ест — манера есть (ZV_EAT), п — высота (скорость записи), сыт —
   что слышно от сытого и обласканного, з — отзвук к голосу (крик феникса —
   с треском пламени). Запись — роль банка или путь файла. */
const ZV_SND={
 roc:      {г:["raptor_cry"],р:["raptor_cry","wyrm_wing"],у:["lug_claw"],ш:["zv_wing","raptor_wing"],е:["raptor_wing","zv_wing"],ест:"мясо",п:0.82},
 griffin:  {г:["sv_beast_snarl","raptor_cry"],р:["sv_beast_roar"],у:["lug_claw"],ш:["zv_wing","raptor_wing"],е:["raptor_wing","wyrm_wing"],ест:"мясо",п:0.96},
 wyvern:   {г:["wyrm_roar"],р:["wyrm_roar"],у:["foe_wyrm_hit"],ш:["wyrm_wing"],е:["wyrm_wing"],ест:"мясо",п:1.12},
 drake:    {г:["wyrm_dark","dragon_growl"],р:["dragon_growl"],у:["foe_wyrm_hit"],ш:["sp_wings"],е:["sp_wings","wyrm_wing"],ест:"мясо",п:0.9},
 pegasus:  {г:["zv_neigh","beasts_horse"],р:["oc_cattle_snort"],у:["tread_hoof"],ш:["zv_ride_walk"],е:["zv_wing","raptor_wing"],ест:"трава",п:1.1},
 skyray:   {г:["oc_fan"],р:["arc_breath"],у:["lug_whoosh_hit"],ш:["oc_fan"],е:["oc_fan","sky_gust"],ест:"рыба",п:0.9},
 dragonfly:{г:["oc_mosquito"],р:["zm_insect"],у:["sv2_swarm_bite"],ш:["oc_mosquito"],е:["oc_mosquito","sp_buzz"],ест:"жвалы",п:1},
 raven:    {г:["wild_raven","crow"],р:["crow"],у:["lug_claw"],ш:["zv_wing"],ест:"клюёт",п:1.08},
 owl:      {г:["bird_owl","wild_owl"],р:["wild_owl"],у:["lug_claw"],ш:["zv_wing","oc_bat_flutter"],ест:"клюёт",п:1},
 hawk:     {г:["bird_hawk"],р:["raptor_cry"],у:["lug_claw"],ш:["zv_wing"],ест:"мясо",п:1.16},
 bat:      {г:["oc_bat_noise"],р:["creatures/cr_bat_attack.flac"],у:["creatures/cr_bat_attack.flac"],ш:["oc_bat_flutter"],ест:"мелочь",п:1.12},
 moth:     {г:["zm_chitter"],р:["zm_insect"],у:["oc_bat_flutter"],ш:["oc_bat_flutter"],ест:"жвалы",п:1.32},
 phoenix:  {г:["bird_hawk","raptor_cry"],з:"lug_fire_start",р:["raptor_cry","lug_fire"],у:["cast_fire"],ш:["zv_wing","lug_fire"],ест:"огонь",п:0.9},
 horse:    {г:["zv_neigh","beasts_horse"],р:["oc_cattle_snort"],у:["tread_hoof"],ш:["horse_step"],е:["zv_ride_walk"],бег:["zv_ride_trot","zv_ride_gallop"],ест:"трава",п:1},
 stag:     {г:["oc_cattle_snort"],р:["beasts_cattle"],у:["tread_hoof"],ш:["tread_hoof"],е:["zv_ride_walk"],бег:["zv_ride_gallop"],ест:"трава",п:1.14},
 elk:      {г:["beast_bull","oc_cattle_snort"],р:["beast_bull"],у:["tread_hoof"],ш:["tread_hoof"],е:["zv_ride_walk"],бег:["zv_ride_trot"],ест:"трава",п:0.88},
 wolf:     {г:["wolf_howl","sv_wolf_snarl"],р:["sv_wolf_snarl","lug_growl"],у:["lug_claw"],ш:["oc_step_soft"],е:["oc_step_soft","lug_step_grass"],ест:"мясо",п:1,сыт:"zv_pant"},
 lynx:     {г:["lug_growl"],р:["sv_beast_snarl"],у:["lug_claw"],ш:["oc_step_soft"],ест:"мясо",п:1.16,сыт:"zv_purr"},
 bear:     {г:["brute_roar"],р:["zm_growl_deep"],у:["foe_brute_hit"],ш:["brute_step"],е:["brute_step"],ест:"мясо",п:0.94},
 boar:     {г:["zv_pig","beasts_pig"],р:["beast_pig"],у:["foe_brute_hit"],ш:["tread_hoof"],е:["tread_hoof","zv_ride_walk"],ест:"трава",п:0.95},
 ram:      {г:["zv_bleat","beasts_sheep"],р:["beast_sheep"],у:["lug_thud"],ш:["tread_hoof"],е:["zv_ride_walk"],бег:["zv_ride_trot"],ест:"трава",п:1.2},
 aurochs:  {г:["zv_moo","beast_bull"],р:["beasts_cattle"],у:["lug_thud"],ш:["brute_step"],е:["zv_ride_walk","brute_step"],бег:["zv_ride_gallop"],ест:"трава",п:0.8},
 camel:    {г:["beasts_camel"],р:["beasts_camel"],у:["tread_hoof"],ш:["tread_sand"],е:["tread_sand"],бег:["zv_ride_trot"],ест:"трава",п:1},
 lion:     {г:["beasts_lion"],р:["sv_beast_roar"],у:["lug_claw"],ш:["oc_step_soft"],е:["oc_step_soft"],ест:"мясо",п:1,сыт:"zv_purr"},
 hound:    {г:["zv_bark","oc_dog_bark"],р:["oc_growl"],у:["lug_flesh"],ш:["oc_step_soft"],ест:"мясо",п:1,сыт:"zv_pant"},
 fox:      {г:["lug_bark"],р:["lug_snarl"],у:["lug_claw"],ш:["oc_step_soft"],ест:"мелочь",п:1.26,сыт:"zv_pant"},
 cat:      {г:["lug_snarl"],р:["lug_snarl"],у:["lug_claw"],ш:["oc_step_soft"],ест:"мелочь",п:1.45,сыт:"zv_purr"},
 unicorn:  {г:["zv_neigh","beasts_horse"],р:["oc_cattle_snort"],у:["tread_hoof"],ш:["horse_step"],е:["zv_ride_walk"],бег:["zv_ride_gallop"],ест:"трава",п:1.2},
 runner:   {г:["sv_snake","raptor_cry"],р:["sv_snake"],у:["lug_claw"],ш:["lug_step_grass"],е:["lug_step_grass","oc_step_hard"],ест:"мясо",п:1.2},
 golem:    {г:["craft_stone"],р:["beasts_giant"],у:["lug_thud"],ш:["golem_step"],е:["golem_step"],ест:"хрум",п:0.8},
 steed:    {г:["oc_steam"],р:["oc_steam"],у:["mtg_step_metal"],ш:["mtg_step_metal"],е:["mtg_step_metal","oc_steam"],ест:"хрум",п:1},
 beetle:   {г:["zm_insect"],р:["zm_chitter"],у:["lug_thud"],ш:["creatures/cr_spider_step.flac"],е:["creatures/cr_spider_step.flac","prop_crawl"],ест:"жвалы",п:0.8},
 spider:   {г:["creatures/cr_spider_emerge.flac"],р:["creatures/cr_spider_attack.flac"],у:["creatures/cr_spider_attack.flac"],ш:["creatures/cr_spider_step.flac"],е:["creatures/cr_spider_step.flac"],ест:"жвалы",п:1},
 centipede:{г:["stk_goo","zm_chitter"],р:["sv2_swarm_bite"],у:["sv2_swarm_bite"],ш:["creatures/cr_spider_step.flac"],е:["creatures/cr_spider_step.flac"],ест:"жвалы",п:0.9},
 serpent:  {г:["sv_serpent","serpent_hiss"],р:["sv_serpent"],у:["serpent_hiss"],ш:["prop_crawl"],е:["prop_crawl"],ест:"мясо",п:1},
 salamander:{г:["oc_sizzle"],р:["lug_fire_start"],у:["lug_fire"],ш:["oc_step_soft"],ест:"огонь",п:1.2},
 tortoise: {г:["serpent_hiss"],р:["serpent_hiss"],у:["oc_rock_hit"],ш:["brute_step"],е:["brute_step","oc_rock_hit"],ест:"трава",п:0.7},
 scorpion: {г:["lug_claw","zm_chitter"],р:["sv_snake"],у:["lug_claw","sv2_swarm_bite"],ш:["creatures/cr_spider_step.flac"],е:["creatures/cr_spider_step.flac","prop_crawl"],ест:"жвалы",п:0.94},
 snail:    {г:["creatures/cr_slime_emerge.flac"],р:["creatures/cr_slime_attack.flac"],у:["creatures/cr_slime_attack.flac"],ш:["creatures/cr_slime_step.flac"],е:["creatures/cr_slime_step.flac"],ест:"слизь",п:0.85},
 lizard:   {г:["sv_lamia","sv_snake"],р:["serpent_hiss"],у:["lug_claw"],ш:["oc_step_soft"],ест:"мясо",п:1.26},
 hippocamp:{г:["zv_neigh"],р:["oc_cattle_snort"],у:["oc_splash"],ш:["oc_swim"],е:["oc_swim","oc_splash"],ест:"рыба",п:1.3},
 seaserp:  {г:["zm_growl_wet","sv_serpent"],р:["zm_growl_wet"],у:["stk_splash"],ш:["oc_swim"],е:["oc_swim","stk_splash"],ест:"рыба",п:0.86},
 otter:    {г:["oc_chirp"],р:["lug_snarl"],у:["oc_splash"],ш:["oc_swim","oc_step_soft"],ест:"рыба",п:1.3},
 mole:     {г:["sv_rat_growl"],р:["sv_rat_growl"],у:["foe_burrow_hit"],ш:["oc_dig"],е:["oc_dig","od_dig"],ест:"мелочь",п:0.9},
 worm:     {г:["foe_burrow_pain","zm_growl_wet"],р:["zm_growl_wet"],у:["foe_burrow_hit"],ш:["od_dig"],е:["od_dig","mtg_dig_gravel"],ест:"слизь",п:0.8},
 badger:   {г:["oc_growl"],р:["sv_rat_growl"],у:["lug_claw"],ш:["oc_step_soft"],ест:"мелочь",п:1.1}};
/* Манера есть. */
const ZV_EAT={трава:["zv_eat_herb"],хрусть:["zv_eat_crunch"],мясо:["zv_eat_bone","zm_chew"],мелочь:["zv_eat_crunch","zm_chew"],клюёт:["zv_eat_crunch"],
 жвалы:["zm_chitter","lug_claw"],хрум:["es_crunch","craft_stone"],рыба:["oc_fish_munch","oc_splash"],слизь:["stk_goo"],огонь:["lug_fire_start","oc_sizzle"]};
/* Отзвук облика к удару: стихия облика слышна. */
const ZV_STIH_SND={огонь:"lug_fire",гроза:"lug_whoosh_hit",свет:"arc_shine",руны:"arc_shine",туман:"sv_slip",тьма:"sv_shadow",кристалл:"crystal_shatter",
 смерть:"zm_bone",жизнь:"heal_bloom",лёд:"mtg_step_ice",эфир:"arc_shine",механизм:"lug_clank",разлом:"sv_glitch",нить:"sv_slip",порядок:"arc_shine",вода:"oc_splash"};
/* Звук места снаряжения. */
const ZV_GEAR_SND={saddle:["arte_leather","equip_leather_on"],bridle:["equip_belt_on"],barding:null,shoes:["lug_clank","equip_boots_on"],bags:["equip_belt_on","arte_object"],
 collar:["equip_belt_on","equip_amulet_on"],armor:null,amulet:["equip_amulet_on"],claws:["equip_blade_on"],wings:["equip_cloak_on"],brow:["equip_helm_on"],
 plates:["equip_plate_on"],fins:["equip_bracelet_on"],spades:["equip_blade_on"]};
/* Громкость каждой записи — к одному уровню (замер при сборке: пик и громкость). */
const ZV_LEVEL=/*@ZV_LEVEL@*/{};

/* ── 2. Свой тракт: ярче и со своей стороны ── */
const ZvSnd={live:0,журнал:[],
 /* журнал: последние сорок записей — [файл, громкость] (для проверки слухом и набора 299) */
 note(f,g){this.журнал.push([f,Math.round(g*100)/100]);if(this.журнал.length>40)this.журнал.shift();},
 on(){try{return !!(settings.effects&&Bank.enabled);}catch(_){return false;}},
 prof(a){const f=a&&safeFn(()=>Zver.fam(a),null);return (f&&ZV_SND[f.id])||ZV_SND.wolf;},
 rate(a,k){const p=this.prof(a);return Math.max(0.5,Math.min(2,(Number(p.п)||1)*(k||1)*(0.97+Math.random()*0.06)));},
 file(r){if(!r)return null;if(String(r).indexOf("/")>=0)return r;if(!Bank.has(r))return null;return safeFn(()=>Vary.file(r),null)||SOUND_BANK[r].f[0];},
 pick(list){const L=(list||[]).filter(r=>String(r).indexOf("/")>=0||Bank.has(r));if(!L.length)return null;return this.file(L[Math.floor(Math.random()*L.length)]);},
 k(file){const v=Number(ZV_LEVEL[file]);return v>0?v:1;},
 at(file,dx,dy,o){
  o=o||{};if(!file||!this.on())return false;const gain=o.gain===undefined?0.85:Number(o.gain)||0;const k=this.k(file);
  if(this.live>=10)return false;
  if(!safeFn(()=>Spatial.on(),false)){this.note(file,Bank.vol("fx")*Math.min(1.43,gain*k));return !!safeFn(()=>Bank.file(file,{gain:Math.min(1.43,gain*k),kind:"fx",maxSec:o.maxSec||3,rate:o.rate||1}),null);}
  try{
   const ctx=Spatial.ensure();if(!ctx)return false;
   /* (15.0) Звук зверя — через канал единой звуковой среды: объёмный путь,
      середина чуть поднята, отклик помещения — постоянная цепочка канала. */
   const v=Math.max(0,Math.min(3,Bank.vol("fx")*gain*k));
   const h=ЗвукСреда.играть(Bank.url(file),{путь:"pan",dx:Number(dx)||0,dy:Number(dy)||0,dz:Number(o.dz)||0,roll:1.1,
    eq:{f:2800,q:0.8,g:3.5},gain:v,dry:"room",wet:Room.conv?0.22:0,rate:(o.rate&&o.rate!==1)?o.rate:1});
   if(!h)return false;
   const el=h.el;
   this.live++;this.note(file,v);let done=false;
   const stop=()=>{if(done)return;done=true;this.live=Math.max(0,this.live-1);h.стоп();};
   h.приСнятии(stop);
   el.addEventListener("ended",stop,{once:true});setTimeout(stop,Math.max(0.3,o.maxSec||3)*1000+200);
   Звук.играть(el,"мир");return true;
  }catch(_){return false;}},
 play(list,o){o=o||{};const f=this.pick(list);return f?this.at(f,o.dx,o.dy,o):false;},
 later(ms,fn){setTimeout(()=>safeFn(fn),Math.max(0,ms|0));},
 /* Где зверь: рядом с героем (окно), за спиной (в пути), у твари (в бою). */
 near(i){return {dx:i?-0.7:0.7,dy:0.25};},
 behind(i){const m=ZvWalk.mv;const len=Math.hypot(m.x,m.y)||1;const bx=-m.x/len,by=-m.y/len;const s=i?-0.55:0.55;
  return (m.x||m.y)?{dx:bx*0.9+(-by)*s,dy:by*0.9+bx*s}:{dx:s,dy:0.7};},
 atFoe(i){const s=safeFn(()=>foeSpot(),null)||{dx:0,dy:-0.6,dz:0};return {dx:s.dx*0.75+(i?-0.35:0.35),dy:s.dy*0.75,dz:s.dz||0};},
 voice(a,o){o=o||{};const p=this.prof(a);const pos=Object.assign({maxSec:2.6,rate:this.rate(a)},this.near(o.i),o);const ok=this.play(p.г,pos);
  if(ok&&p.з)this.later(120,()=>this.play([p.з],Object.assign({},pos,{maxSec:1.4,gain:(Number(pos.gain)||0.85)*0.6,rate:1})));return ok;},
 growl(a,o){o=o||{};const p=this.prof(a);return this.play(p.р||p.г,Object.assign({maxSec:2.4,rate:this.rate(a,0.96)},this.near(o.i),o));},
 hit(a,o){o=o||{};const p=this.prof(a);const pos=Object.assign(this.atFoe(o.i),o);const ok=this.play(p.у||p.р,Object.assign({maxSec:1.6,rate:this.rate(a)},pos));
  const v=safeFn(()=>Zver.variant(a),null);const ст=v&&ZV_STIH_SND[v.стих];if(ст)this.later(110,()=>this.play([ст],Object.assign({maxSec:1.4,gain:0.7},pos)));return ok;},
 pain(a,o){o=o||{};const p=this.prof(a);return this.play(p.г,Object.assign({maxSec:1.2,rate:this.rate(a,1.3),gain:0.8},this.near(o.i),o));},
 step(a,o){o=o||{};const p=this.prof(a);return this.play(p.ш||["oc_step_soft"],Object.assign({maxSec:1.1,gain:0.55,rate:this.rate(a)},o));}};

/* ── 3. Сценки: еда, рост, снаряжение, находка, возвращение, уход ── */
Object.assign(ZvSnd,{
 /* Кормление: корм в руке — зверь ест своей манерой — сытый голос (кошки мурлычут). */
 feed(a,k,люб){const p=this.prof(a);const pos=this.near(0);const род=ZV_EAT[p.ест]||ZV_EAT.мясо;
  const травоядный=p.ест==="трава";this.scene(травоядный?3000:2500);
  this.play(["arte_object","mtg_place"],Object.assign({maxSec:0.8,gain:0.55},pos));
  this.later(220,()=>this.play(травоядный&&Math.random()<0.4?ZV_EAT.хрусть:род,Object.assign({maxSec:2.6,gain:1,rate:p.ест==="клюёт"?1.5:p.ест==="мелочь"?1.2:1},pos)));
  this.later(травоядный?2300:1700,()=>{if(p.сыт&&Bank.has(p.сыт))this.play([p.сыт],Object.assign({maxSec:2.6,gain:0.9},pos));else this.voice(a,{gain:люб?0.95:0.8});});},
 /* Новый уровень: голос зверя и перезвон — слышно и без слов. */
 /* Сценка идёт (еда, находка, возвращение, уход) — звук уровня ждёт её конца, а не звучит поверх. */
 scene(ms){this.after=Math.max(Number(this.after)||0,Date.now()+ms);},
 level(a){this.later(60,()=>{const w=(Number(this.after)||0)-Date.now();if(w>0)this.later(w,()=>this.levelNow(a));else this.levelNow(a);});},
 levelNow(a){const pos=this.near(0);this.voice(a,{gain:1});
  this.later(260,()=>this.play(["arc_shine"],Object.assign({maxSec:1.6,gain:0.9},pos)));
  this.later(620,()=>this.play(["uh_bell"],Object.assign({maxSec:2.2,gain:0.7},pos)));},
 /* Очко развития вложено: нарастающий отзвук и голос. */
 grow(a){const pos=this.near(0);this.play(["arc_rise","magic_shimmer"],Object.assign({maxSec:1.8,gain:0.85},pos));this.later(520,()=>this.voice(a,{gain:0.85}));},
 /* Снаряжение надето: звук места (и материала) — и голос зверя. */
 equip(a,slot,mat){const pos=this.near(0);let L=ZV_GEAR_SND[slot];
  if(!L){L=mat==="leather"||mat==="feather"?["equip_leather_on"]:mat==="mail"||mat==="scale"||mat==="chitin"?["equip_chain_on"]:["equip_plate_on"];}
  this.play(L,Object.assign({maxSec:1.6,gain:0.85},pos));
  if(["rune","crystal","star","pearl","cog"].includes(mat))this.later(300,()=>this.play(["arc_shine"],Object.assign({maxSec:1.2,gain:0.6},pos)));
  this.later(650,()=>this.voice(a,{gain:0.75}));},
 /* Находка в пути: нюх, лапа, находка и довольный голос. */
 find(a,i){const pos=this.behind(i);this.scene(1700);this.play(["zv_sniff","oc_step_soft"],Object.assign({maxSec:1.2,gain:0.8,rate:this.rate(a)},pos));
  this.later(450,()=>this.play(["oc_dig","prop_pantry"],Object.assign({maxSec:0.9,gain:0.6},pos)));
  this.later(900,()=>safeFn(()=>UI.natStep("b_pickup",0.6,1)));this.later(1150,()=>this.voice(a,Object.assign({gain:0.9},pos)));},
 /* Возвращение с задания: шаги издали — голос — добыча. */
 back(a,добыча){const p=this.prof(a);this.scene(добыча?2400:1800);for(let i=0;i<4;i++){const t=i/3;this.later(i*300,()=>this.play(p.ш||["oc_step_soft"],{dx:2.4-2.0*t,dy:-2.6+2.2*t,maxSec:0.9,gain:0.45+0.3*t,rate:this.rate(a)}));}
  this.later(1300,()=>this.voice(a,{gain:0.95}));if(добыча)this.later(1800,()=>this.play(["arte_coins","b_pickup"],Object.assign({maxSec:1.4,gain:0.6},this.near(0))));},
 /* Уход: ласка — довольный голос или мурлыканье; чистка — щётка; игра — бег и голос; лечение — отвар и голос. */
 care(a,k){const p=this.prof(a);const pos=this.near(0);this.scene(1400);
  if(k==="talk"){if(p.сыт&&Bank.has(p.сыт))this.play([p.сыт],Object.assign({maxSec:2.6,gain:0.9},pos));else this.voice(a,{gain:0.75});}
  else if(k==="groom"){this.play(["craft_hide","arte_leather"],Object.assign({maxSec:1.4,gain:0.75},pos));this.later(900,()=>this.voice(a,{gain:0.7}));}
  else if(k==="play"){for(let i=0;i<3;i++)this.later(i*230,()=>this.step(a,{dx:1.2-i*0.8,dy:-0.6+i*0.4,gain:0.7}));this.later(800,()=>this.voice(a,{gain:0.9}));}
  else if(k==="heal"){this.play(["heal_bloom"],Object.assign({maxSec:1.6,gain:0.8},pos));this.later(700,()=>this.voice(a,{gain:0.7}));}
  else this.voice(a,{gain:0.75});},
 /* Сесть и спешиться: скрип седла, голос маунта. */
 mount(M){const pos={dx:0.3,dy:0.1};this.play(["arte_leather","equip_leather_on"],Object.assign({maxSec:1.2,gain:0.8},pos));
  this.later(380,()=>{if(M&&M.kind==="zv")this.voice(M.a,{gain:0.9});else if(M&&M.m&&M.m.b)this.play([M.m.b],Object.assign({maxSec:2,gain:0.85},pos));});},
 dismount(){this.play(["equip_leather_off","arte_leather"],{dx:0.3,dy:0.1,maxSec:1.2,gain:0.75});this.later(260,()=>this.play(["lug_land"],{dx:0.2,dy:0.2,maxSec:0.8,gain:0.6}));}});

/* ── 4. Верхом и следом ── */
const ZvWalk={mv:{x:0,y:-1},last:null,n:0,
 here(){if(G.inCombat&&G.combat&&G.combat.arena){const a=G.combat.arena;return {x:Number(a.px)||0,y:Number(a.py)||0,k:"a"};}
  if(G.place)return {x:Number(G.place.x)||0,y:Number(G.place.y)||0,k:"p"};return {x:G.x,y:G.y,k:"w"};},
 track(){const h=this.here();const l=this.last;if(l&&l.k===h.k){const dx=h.x-l.x,dy=h.y-l.y;if(dx||dy)this.mv={x:Math.sign(dx),y:Math.sign(dy)};}this.last=h;},
 /* Маунт: зверь из зверинца или скакун тайных палат. */
 mount(){const k=safeFn(()=>Stable.riding(),null);return k?safeFn(()=>Stable.mBy(k),null):null;},
 /* Шаг маунта под седоком: по роду хода и по бегу. */
 ride(M){const run=safeFn(()=>!!runState.active,false);
  if(M.kind==="zv"){const a=M.a,p=ZvSnd.prof(a);const L=(run&&p.бег)?p.бег:(p.е||p.ш);return ZvSnd.play(L,{dx:0,dy:0.15,maxSec:run?0.75:1,gain:run?0.95:0.85,rate:(run&&p.бег)?1:ZvSnd.rate(a)});}
  const ход=safeFn(()=>Stable.moveOf(M),"walk");
  const L={fly:["zv_wing","raptor_wing"],swim:["oc_swim","oc_splash"],crawl:["prop_crawl","creatures/cr_spider_step.flac"],dig:["oc_dig"],walk:run?["zv_ride_trot","zv_ride_gallop"]:["zv_ride_walk"]}[ход]||["zv_ride_walk"];
  return ZvSnd.play(L,{dx:0,dy:0.15,maxSec:run?0.75:1,gain:0.9});},
 /* Спутники идут следом: каждый своим шагом, с опозданием на полшага. */
 follow(){const pets=safeFn(()=>Zver.pets(),[])||[];const inWater=safeFn(()=>/water|sea|coast|lake|river/.test(cellContent(G.x,G.y).terrain[0]),false);
  pets.slice(0,2).forEach((a,i)=>{if(a.ранен||a.задание)return;const f=Zver.fam(a);if(!f)return;
   /* двое спутников ступают по очереди: на шаг героя — один шаг зверя, а не три шага разом */
   const редко=pets.length>1?(this.n+i)%2:(f.ход==="fly"?this.n%2:f.ход==="dig"?this.n%3:0);if(редко)return;
   const p=ZvSnd.prof(a);const L=f.ход==="swim"&&!inWater?["oc_step_soft"]:(p.ш||["oc_step_soft"]);
   ZvSnd.later(130+i*110,()=>ZvSnd.play(L,Object.assign({maxSec:1,gain:0.55,rate:ZvSnd.rate(a)},ZvSnd.behind(i))));
   /* голос в пути — изредка */
   if(Math.random()<0.035)ZvSnd.later(600+i*400,()=>ZvSnd.voice(a,Object.assign({gain:0.7,i},ZvSnd.behind(i))));});},
 step(){this.n++;this.track();const M=this.mount();if(M){safeFn(()=>this.ride(M));}safeFn(()=>this.follow());safeFn(()=>ZvFind.step());return !!M;}};
/* Шаг героя: верхом — шаг маунта вместо шагов героя; спутники — следом. */
safeFn(()=>{const s0=stepSound;stepSound=matKeep(s0,function(){
 const верхом=!!safeFn(()=>ZvWalk.mount(),null);
 if(!верхом)s0.apply(this,arguments);
 safeFn(()=>ZvWalk.step());});});
/* Внутри здания и подземелья шаг звучит своим путём (playStep): верхом — маунт. */
safeFn(()=>{const m0=moveInside;moveInside=matKeep(m0,function(){
 const r=m0.apply(this,arguments);safeFn(()=>{const h=ZvWalk.here();const l=ZvWalk.last;if(!l||l.x!==h.x||l.y!==h.y)ZvWalk.step();});return r;});});
safeFn(()=>{const p0=playStep;playStep=matKeep(p0,function(){
 if(G.place&&!G.inCombat&&safeFn(()=>ZvWalk.mount(),null))return true;   /* верхом — шаг маунта, не сапог */
 return p0.apply(this,arguments);});});

/* ── 5. Находки в пути ── */
const ZvFind={step(){
 if(G.place||G.inCombat||G.ship||G.flight)return;const pets=safeFn(()=>Zver.pets(),[])||[];if(!pets.length)return;
 const s=Zver.st();s.findAt=Number(s.findAt)||0;s.steps=(Number(s.steps)||0)+1;if(s.steps-s.findAt<45)return;
 pets.slice(0,2).forEach((a,i)=>{if(a.ранен||(Number(a.сыт)||0)<20)return;
  const шанс=(a.роль==="scout"||a.роль==="bearer"?1/70:1/140)*(1+0.1*((a.ветви&&a.ветви.sense)||0));if(Math.random()>=шанс||s.steps-s.findAt<45)return;
  const terr=safeFn(()=>cellContent(G.x,G.y).terrain[0],"plains");const pool=(typeof RESBYT!=="undefined"&&RESBYT[terr]&&RESBYT[terr].length)?RESBYT[terr]:(typeof LAND_RES!=="undefined"?LAND_RES:["камень"]);
  const k=pool[Math.floor(Math.random()*pool.length)];if(!k)return;G.inv[k]=(Number(G.inv[k])||0)+1;s.findAt=s.steps;
  const рост=Zver.xp(a,2)||"";ZvSnd.find(a,i);
  setTimeout(()=>safeFn(()=>narrate(`${a.n} что-то учуял${Zver.fam(a).g==="ж"?"а":""} и приносит: ${k}.${рост}`,{interrupt:false,pri:2})),900);});}};

/* ── 6. Рост: очко развития с каждым уровнем; уровень слышен ── */
Zver.points=function(a){return Math.max(0,(Number(a&&a.lvl)||1)-1);};
Zver.xp=function(a,n){if(!a||(Number(a.lvl)||1)>=30)return "";a.xp=(Number(a.xp)||0)+n;let t="",вырос=0;
 while(a.xp>=this.need(a)&&a.lvl<30){a.xp-=this.need(a);a.lvl++;вырос++;t+=` ${a.n} вырос${Zver.fam(a)&&Zver.fam(a).g==="ж"?"ла":""} до уровня ${a.lvl}: очко развития — в окне «Развитие».`;
  safeFn(()=>journal(`${a.n}: уровень ${a.lvl}, очко развития.`));}
 if(вырос)safeFn(()=>ZvSnd.level(a));return t;};
safeFn(()=>{const g0=Zver.grow;Zver.grow=function(u,br){const a=this.byUid(u);const до=a?this.spent(a):0;
 const sp0=this.play;this.play=function(){};let r;try{r=g0.apply(this,arguments);}finally{this.play=sp0;}
 if(a&&this.spent(a)>до)safeFn(()=>ZvSnd.grow(a));
 else if(a&&/свободных очков нет/.test(String(r)))r=`${a.n}: свободных очков нет; следующее — на уровне ${(Number(a.lvl)||1)+1}.`;
 return r;};});
/* В окне «Развитие» — новое правило словами. */
safeFn(()=>{const gv=Stable.growView;Stable.growView=function(){const l0=this.line;this.line=function(t){return l0.call(this,String(t).replace("очко — каждые три уровня","очко — с каждым новым уровнем"));};
 try{return gv.apply(this,arguments);}finally{this.line=l0;}};});

/* ── 7. Снаряжение, верховая езда, спутник ── */
safeFn(()=>{const e0=Zver.equip;Zver.equip=function(u,slot,mat){const a=this.byUid(u);const было=a&&a.снар&&a.снар[slot];
 const bp=Bank.play;Bank.play=function(r,o){if(/^equip_/.test(String(r)))return null;return bp.apply(this,arguments);};
 let t;try{t=e0.apply(this,arguments);}finally{Bank.play=bp;}
 if(a&&a.снар&&a.снар[slot]===mat&&было!==mat)safeFn(()=>ZvSnd.equip(a,slot,mat));return t;};});
safeFn(()=>{const r0=Zver.ride;Zver.ride=function(u){const sp=this.play,bp=Bank.play;this.play=function(){};Bank.play=function(r,o){if(r==="horse_step")return null;return bp.apply(this,arguments);};
 let t;try{t=r0.apply(this,arguments);}finally{this.play=sp;Bank.play=bp;}
 if(/^Вы верхом/.test(String(t)))safeFn(()=>{const a=this.byUid(u);ZvSnd.mount({kind:"zv",a});});return t;};});
safeFn(()=>{const d0=Zver.dismount;Zver.dismount=function(){const был=!!this.mount();const t=d0.apply(this,arguments);if(был)safeFn(()=>ZvSnd.dismount());return t;};});
safeFn(()=>{const f0=Zver.follow;Zver.follow=function(u){const sp=this.play;this.play=function(){};let t;try{t=f0.apply(this,arguments);}finally{this.play=sp;}
 const a=this.byUid(u);if(a&&/идёт с вами/.test(String(t)))safeFn(()=>{ZvSnd.voice(a,{gain:0.9});ZvSnd.later(450,()=>ZvSnd.step(a,Object.assign({gain:0.7},ZvSnd.near(0))));});
 return t;};});
/* Скакун тайных палат и прочие маунты: посадка — скрип седла и голос. */
safeFn(()=>{const ks=Object.keys(Stable).filter(k=>typeof Stable[k]==="function"&&/riding\(\)/.test(String(Stable[k]))&&/Zver\.ride/.test(String(Stable[k])));
 for(const k of ks){const f0=Stable[k];Stable[k]=function(key){const до=safeFn(()=>this.riding(),null);const r=f0.apply(this,arguments);
  const после=safeFn(()=>this.riding(),null);if(после&&после!==до&&String(после).startsWith("leg:"))safeFn(()=>ZvSnd.mount(this.mBy(после)));return r;};}});

/* ── 8. Бой: рык в начале, удары — со стороны твари, рана — визг ── */
safeFn(()=>{const t0=Zver.turn;Zver.turn=function(cb,act){
 const бойцы=(this.pets()||[]).filter(a=>(Number(a.сыт)||0)>=10&&!a.ранен&&this.hp(a)>0);
 const sp=this.play;this.play=function(){};let r;try{r=t0.apply(this,arguments);}finally{this.play=sp;}   /* прежний общий звук рода — не поверх своего удара */
 бойцы.forEach((a,i)=>ZvSnd.later(260+i*240,()=>{ZvSnd.hit(a,{i,gain:0.95});if(Math.random()<0.45)ZvSnd.later(140,()=>ZvSnd.growl(a,Object.assign({gain:0.8},ZvSnd.atFoe(i))));}));
 return r;};});
safeFn(()=>{const h0=Zver.hurt;Zver.hurt=function(a,n){const sp=this.play;this.play=function(){};const был=!!(a&&a.ранен);
 try{h0.apply(this,arguments);}finally{this.play=sp;}
 if(a&&n>0){const i=Math.max(0,(this.pets()||[]).indexOf(a));safeFn(()=>ZvSnd.pain(a,Object.assign({gain:a.ранен&&!был?1:0.8},G.inCombat?ZvSnd.atFoe(i):ZvSnd.near(i))));}};});
safeFn(()=>{const sc=startCombat;startCombat=matKeep(sc,function(){const r=sc.apply(this,arguments);
 /* рык — после первого грохота схватки (клич, шум толпы), а не поверх него */
 safeFn(()=>{const pets=(Zver.pets()||[]).filter(a=>!a.ранен);pets.slice(0,2).forEach((a,i)=>ZvSnd.later(950+i*420,()=>ZvSnd.growl(a,Object.assign({gain:0.8},ZvSnd.near(i)))));});
 return r;});});

/* ── 9. Задания и уход ── */
safeFn(()=>{const f0=Stable.finish;Stable.finish=function(a){const zp=Zver.play;Zver.play=function(){};let t;try{t=f0.apply(this,arguments);}finally{Zver.play=zp;}
 if(t)safeFn(()=>ZvSnd.back(a,/:\s/.test(String(t))&&!/клада не нашлось|весть не дошла|вокруг пусто/.test(String(t))));return t;};});
safeFn(()=>{const c0=Stable.care;if(typeof c0!=="function")return;Stable.care=function(u,k){const a=Zver.byUid(u);const zp=Zver.play,bp=Bank.play;
 Zver.play=function(){};let t;try{t=c0.apply(this,arguments);}finally{Zver.play=zp;}
 if(a&&t&&!/^(Сначала|Нельзя|Не )/.test(String(t)))safeFn(()=>ZvSnd.care(a,k));return t;};});

/* ── 10. Торговля: «Купить» и «Продать» — два окна; сколько — свайпом ──
   Прежде окно лавки начиналось с переключателя разделов и списка категорий,
   а у товара стояли четыре кнопки «Купить 1, 5, 10, на всё». Теперь окно
   «Купить» (или «Продать») — сразу товары, по одной строке на товар. На
   строке свайп вверх или вниз (в Windows — стрелки вверх и вниз) меняет
   счёт: по одной до десяти, дальше по пять, по десять, по пятьдесят — до
   всего, на что хватает золота (или всей стопки); двойное касание (Enter) —
   сделка сразу, пробел в Windows — карточка товара. Категории и переход в
   другое окно — в конце списка. Стопка продаётся счётом у любых вещей:
   прежде зелья и одинаковые вещи уходили по одной, сколько ни выбрано. */
const SHOP_ONE=s=>!!(s&&(s.gear||s.артефакт||s.часть||s.том||s.вещь||s.фляга||s.вода));
const ShopCount={
 q(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");},
 gold(k){return `${k} ${plural(k,"золотой","золотых","золотых")}`;},
 hint(tab){const д=tab==="buy"?"купить":"продать";
  return isDesktopApp()?`Стрелки вверх и вниз на товаре — сколько, Enter — ${д}, пробел — подробнее; влево и вправо — к другому товару.`
   :`Свайп вверх или вниз на товаре — сколько, двойное касание — ${д}; вправо и влево — к другому товару.`;},
 /* Шаг счёта: по одной до десяти, дальше по пять, по десять, по пятьдесят. */
 step(n,max,d){let m;
  if(d>0)m=n<10?n+1:n<50?Math.floor(n/5)*5+5:n<100?Math.floor(n/10)*10+10:Math.floor(n/50)*50+50;
  else m=n<=10?n-1:n<=50?Math.ceil(n/5)*5-5:n<=100?Math.ceil(n/10)*10-10:Math.ceil(n/50)*50-50;
  return Math.max(1,Math.min(max,m));},
 /* Сколько можно: купить — на что хватает золота (поштучное — одну), продать — вся стопка. */
 maxOf(tab,r){if(tab==="buy"){if(!r.count||SHOP_ONE(r.s))return 1;return Math.max(1,Math.min(999,Math.floor((Number(G.gold)||0)/Math.max(1,r.price))));}
  return Math.max(1,Number(r.n)||1);},
 on(el){return !!(el&&el.dataset&&el.dataset.shopmax&&/^shopitem:\d+$/.test(el.dataset.cmd||""));},
 text(o,n){const д=o.tab==="buy"?"купить":"продать";
  return `${o.name}${o.tab==="sell"&&o.max>1?` ×${o.max}`:""} — ${o.price}${o.max>1?` · ${д} ${n} (${o.price*n})`:""}`;},
 say(o,n){const д=o.tab==="buy"?"Купить":"Продать";const цена=`${this.gold(o.price)}${o.шт?" за штуку":""}`;
  const head=o.tab==="buy"?`${o.name} — ${цена}.`:`${o.name}${o.max>1?`, у вас ${o.max}`:""} — ${цена}.`;
  const счёт=o.max>1?` ${д} ${n} из ${o.max} — ${this.gold(o.price*n)}. ${isDesktopApp()?"Стрелки вверх и вниз":"Свайп вверх или вниз"} — сколько.`:"";
  return `${head}${счёт}${o.extra?" "+o.extra:""}${o.card?" "+o.card:""}`;},
 of(el){const d=el.dataset;return {tab:d.shoptab==="sell"?"sell":"buy",name:d.shopname||"",price:Number(d.shopprice)||0,max:Number(d.shopmax)||1,шт:d.shopunit==="1",card:d.shopcard||"",extra:d.shopextra||""};},
 /* Строка товара: одна кнопка; счёт живёт в ней самой. */
 row(tab,r,idx){const max=this.maxOf(tab,r);const шт=tab==="buy"?!!r.count:(Number(r.n)||1)>1;
  let extra="";if(tab==="buy"){if((Number(G.gold)||0)<r.price)extra=`Не хватает золота: нужно ${r.price}, у вас ${G.gold}.`;
   else if(r.доступно&&r.доступно!=="доступно")extra=`${r.доступно[0].toUpperCase()+r.доступно.slice(1)}.`;}
  const card=tab==="buy"?`${r.card||""}${r.треб?" "+r.треб:""}`.trim():String(r.card||"").trim();
  const o={tab,name:r.name,price:r.price,max,шт,card,extra};
  return `<button class="item" data-cmd="shopitem:${idx}" data-shoptab="${tab}" data-shopmax="${max}" data-shopn="1" data-shopprice="${r.price}" data-shopunit="${шт?1:0}"`
   +` data-shopname="${this.q(r.name)}" data-shopcard="${this.q(card)}" data-shopextra="${this.q(extra)}" data-speak="${this.q(this.say(o,1))}">${(SHOP_CAT_BY_ID[r.cat]||{}).з||""} ${this.q(this.text(o,1))}</button>`;},
 nudge(d){const el=uiCursor;if(!this.on(el))return false;const o=this.of(el);const n0=Math.max(1,Number(el.dataset.shopn)||1);
  if(o.max<=1){safeFn(()=>Sliders.play({min:0,max:1,value:d>0?1:0},d));
   narrate(o.tab==="buy"?(o.extra&&/золота/.test(o.extra)?o.extra:"Эта вещь продаётся одна."):"Эта вещь у вас одна.",{interrupt:true,cat:"ui"});return true;}
  const n=this.step(n0,o.max,d);el.dataset.shopn=String(n);
  const край=n===n0;
  safeFn(()=>{el.textContent=`${(el.textContent.match(/^\S*\s/)||[""])[0]}${this.text(o,n)}`;});
  el.dataset.speak=this.say(o,n);
  safeFn(()=>Sliders.play({min:1,max:o.max,value:n},d));
  narrate(`${n} из ${o.max} — ${this.gold(o.price*n)}${край?(d>0?(o.tab==="buy"?". Больше не хватает золота":". Это вся стопка"):". Меньше одной нельзя"):""}.`,{interrupt:true,cat:"ui"});
  return true;},
 /* Двойное касание (Enter) — сделка выбранным счётом, сразу. */
 deal(el){const n=shopNpc();if(!n){narrate("Окно торговли не открыто: подойдите к торговцу и откройте «Торговля».");return false;}
  const o=this.of(el);const idx=Number(String(el.dataset.cmd).split(":")[1]);const k=Math.max(1,Math.min(o.max,Number(el.dataset.shopn)||1));
  SHOP.tab=o.tab;SHOP.sel={idx,tab:o.tab};SHOP.confirm=null;return shopAsk(o.tab,k);}};
/* Продажа счётом любой стопки: ресурсы — одной сделкой, прочее — по штуке, одной фразой. */
function shopSellN(n,r,count){
 const row0=r.row;const имя=row0.name,вид=row0.kind;const k=Math.max(1,Math.min(Number(r.n)||1,Number(count)||1));
 if(["res","rare","plant","fish"].includes(вид))return shopSellRes(n,row0.key,k);
 if(k<=1)return sellRowTo(n,row0,(t)=>{narrate(t,{interrupt:true});return true;});
 const g0=Number(G.gold)||0;let продано=0;
 const bp=Bank.play,up=UI.pickup;Bank.play=function(){return null;};UI.pickup=function(){};
 try{for(let i=0;i<k;i++){
   const row=i===0?row0:(invAll().find(x=>x.kind===вид&&x.name===имя&&x.cat!=="quest")||null);
   if(!row||!merchantBuys(n,row).ок)break;
   let ок=false;sellRowTo(n,row,()=>{ок=true;return true;});if(!ок)break;продано++;}}
 finally{Bank.play=bp;UI.pickup=up;}
 const сумма=(Number(G.gold)||0)-g0;
 if(!продано){narrate("Не продано: торговец больше не берёт.",{interrupt:true});return false;}
 safeFn(()=>{UI.pickup();Bank.play("treasure",{seed:сумма,gain:0.8});Bank.play("od_gold",{seed:сумма,gain:0.45,maxSec:3});});
 const ост=(invAll().find(x=>x.kind===вид&&x.name===имя)||{}).n||0;
 narrate(`Продано: ${имя} — ${продано} шт. за ${сумма} золота.${ост?` Осталось ${ост}.`:""} Всего золота: ${G.gold}.${safeFn(()=>merchDeal(n,"sell",сумма),"")||""}`,{interrupt:true});
 journal(`Продажа: ${имя} ×${продано} за ${сумма} золота.`);return true;}
/* Окно лавки: только свой раздел; товары по категориям; категории и другое окно — в конце. */
safeFn(()=>{const r0=renderShop;renderShop=matKeep(r0,function(){
 const n=shopNpc();const box=document.getElementById("shopBody");if(!box)return false;
 if(!n){box.innerHTML=`<div class="list-line" tabindex="0">Торговец ушёл.</div>`;return false;}
 const tab=SHOP.tab==="sell"?"sell":"buy";SHOP.tab=tab;const d=safeFn(()=>merchSoul(n),null);const q=s=>ShopCount.q(s);
 const t=document.getElementById("shopTitle");if(t)t.textContent=`${n.name}: ${tab==="buy"?"купить":"продать"}`;
 const buyRows=shopStockRows(n),sellAll=shopSellRows(n),sellRows=sellAll.filter(r=>r.ок);
 const rows=tab==="buy"?buyRows:sellRows;
 const дела=safeFn(()=>econLine(G.x,G.y,n),"")||"";
 const сколько=tab==="buy"?`Купить: ${rows.length} ${plural(rows.length,"товар","товара","товаров")}`:`Продать: торговец возьмёт ${rows.length} ${plural(rows.length,"вещь","вещи","вещей")} из вашей сумы`;
 const шапка=`${n.name}, ${safeFn(()=>Род.ремесло(n),"торговец")}${d?`, ${d.вид.n}: ${d.вид.о}`:""}. ${сколько}. Золота у вас ${G.gold}${d?`, у торговца около ${safeFn(()=>merchPurse(n),0)}`:""}.${дела?" "+дела:""}${rows.length?" "+ShopCount.hint(tab):""}`;
 let html=`<div class="list-line" tabindex="0" data-speak="${q(шапка)}">${q(n.name)}${d?` — ${q(d.вид.n)}`:""} · ${tab==="buy"?"купить":"продать"} · у вас ${G.gold}</div>`;
 const строка=r=>ShopCount.row(tab,r,rows.indexOf(r));const поЦене=(x,y)=>x.price-y.price;
 const shown=SHOP.cat?rows.filter(r=>r.cat===SHOP.cat):rows;
 if(!rows.length)html+=`<div class="list-line" tabindex="0">${tab==="buy"?"На прилавке пусто.":"Из вашего этот торговец ничего не берёт."}</div>`;
 else if(SHOP.cat){const c=SHOP_CAT_BY_ID[SHOP.cat];html+=`<h3>${c?c.n:"Прочее"} (${shown.length})</h3>`+(shown.slice().sort(поЦене).map(строка).join("")||`<div class="list-line" tabindex="0">Здесь пусто.</div>`);}
 else html+=SHOP_CATS.map(c=>{const в=shown.filter(r=>r.cat===c.id).sort(поЦене);return в.length?`<h3>${c.n} (${в.length})</h3>`+в.map(строка).join(""):"";}).join("")
  +(()=>{const пр=shown.filter(r=>!SHOP_CAT_BY_ID[r.cat]);return пр.length?`<h3>Прочее (${пр.length})</h3>`+пр.map(строка).join(""):"";})();
 /* что не берёт — с причиной */
 if(tab==="sell"){const нет=sellAll.filter(r=>!r.ок).slice(0,6);if(нет.length)html+=`<h3>Не берёт</h3>`+нет.map(r=>`<div class="list-line" tabindex="0" data-speak="${q(r.name+": не берёт — "+r.почему)}">${q(r.name)} — ${q(r.почему)}</div>`).join("");}
 /* скрытый товар */
 if(tab==="buy"&&d)safeFn(()=>{const закр=merchDoors(n).filter(x=>!x.открыто);if(закр.length)html+=`<h3>Под прилавком</h3>`+закр.map(x=>`<div class="list-line" tabindex="0" data-speak="${q(x.n+": закрыто, нужно "+x.о)}">${q(x.n)} — нужно: ${q(x.о)}</div>`).join("");});
 /* категории — сузить список */
 const cats=SHOP_CATS.filter(c=>rows.some(r=>r.cat===c.id));
 if(cats.length)html+=`<h3>Категории</h3><button class="item" data-cmd="shopcat:all" data-speak="${q(`Все ${tab==="buy"?"товары":"ваши вещи"}: ${rows.length}.`)}">${SHOP.cat?"":"Выбрано. "}Все (${rows.length})</button>`
  +cats.map(c=>{const k=rows.filter(r=>r.cat===c.id).length;return `<button class="item" data-cmd="shopcat:${c.id}" data-speak="${q(`Только ${c.n.toLowerCase()}: ${k}.`)}">${SHOP.cat===c.id?"Выбрано. ":""}${c.з} ${c.n} (${k})</button>`;}).join("");
 /* другое окно — отдельно, в самом конце */
 html+=`<h3>Другое окно</h3>`+(tab==="buy"
  ?`<button class="item" data-cmd="shoptab:sell" data-speak="${q(`Окно «Продать»: торговец возьмёт ${sellRows.length} ${plural(sellRows.length,"вещь","вещи","вещей")} из вашей сумы.`)}">Окно «Продать» (${sellRows.length})</button>`
  :`<button class="item" data-cmd="shoptab:buy" data-speak="${q(`Окно «Купить»: ${buyRows.length} ${plural(buyRows.length,"товар","товара","товаров")} на прилавке.`)}">Окно «Купить» (${buyRows.length})</button>`);
 box.innerHTML=html;return true;});});
/* Строка товара: двойное касание — сделка выбранным счётом (карточка — пробелом и из «Назад»). */
safeFn(()=>{const c0=CMD.shopitem;CMD.shopitem=function(i){
 const el=document.querySelector(`#shopBody [data-cmd="shopitem:${Number(i)}"]`);
 if(el&&ShopCount.on(el))return ShopCount.deal(el);
 return c0.apply(this,arguments);};});
/* Другое окно открывается с начала: шапка называет, что в нём и как выбирать счёт. */
safeFn(()=>{CMD.shoptab=function(t){SHOP.tab=t==="sell"?"sell":"buy";SHOP.cat=null;SHOP.sel=null;SHOP.confirm=null;renderShop();
 safeFn(()=>{resetCursor();const el=document.querySelector('#shopBody .list-line, #shopBody button')||ensureCursor(navLayer());if(el)setCursor(el,true);});};});
/* Категория: список сужается, выбор встаёт на первый товар. */
safeFn(()=>{CMD.shopcat=function(c){SHOP.cat=c==="all"?null:c;SHOP.sel=null;renderShop();
 const первый=document.querySelector('#shopBody [data-cmd^="shopitem:"]');
 const имя=SHOP.cat?`Только ${(((SHOP_CAT_BY_ID[SHOP.cat]||{}).n)||c).toLowerCase()}.`:"Все товары.";
 if(первый){safeFn(()=>setCursor(первый,false));narrate(`${имя} ${первый.dataset.speak||""}`,{interrupt:true});}
 else narrate(имя,{interrupt:true});};});
/* «Назад» из карточки — на ту же строку товара. */
safeFn(()=>{const b0=CMD.shopback;CMD.shopback=function(){const i=SHOP.sel?SHOP.sel.idx:null;const r=b0.apply(this,arguments);
 safeFn(()=>{if(i==null)return;const el=document.querySelector(`#shopBody [data-cmd="shopitem:${i}"]`);if(el)setCursor(el,false);});return r;};});
/* Продать счётом из карточки — тоже любой стопкой. */
safeFn(()=>{const y0=shopYes;shopYes=matKeep(y0,function(){const n=shopNpc();const c=SHOP.confirm;
 if(n&&c&&SHOP.sel&&c.tab==="sell"&&c.count>1){const r=shopSellRows(n).filter(x=>x.ок)[SHOP.sel.idx];
  if(r&&!["res","rare","plant","fish"].includes(r.row.kind)){SHOP.confirm=null;shopSellN(n,r,c.count);SHOP.sel=null;saveGame(true);refresh();renderShop();return true;}}
 return y0.apply(this,arguments);});});

/* ── 11. Окна «Питомцы» и «Маунты»: тем же звуком, без двойников ──
   Игрок кормит, садится, спешивается и ухаживает через окна, а там у
   каждого действия был свой старый тихий звук — и он звучал вместе с
   новым: посадка через «Маунты» стучала копытами даже у жука и птицы, а
   голос скакуна тайных палат звучал дважды; «Спешиться здесь» вместо
   скрипа седла давало копыта; вычёсывание звучало двумя звуками сразу;
   «Накормить всех» кормило всех зверей разом, и сценки ложились одна на
   другую. Теперь каждое действие окна звучит одной сценкой своего зверя. */
/* Скакун тайных палат: свой голос (b) и ход (moveOf). */
Object.assign(ZvSnd,{
 /* Тихо внутри: на время вызова старые звуки банка молчат (свой тракт ZvSnd звучит). */
 hush(fn,ctx,args,also){const bp=Bank.play,zp=Zver.play;Bank.play=function(){return null;};if(also!==false)Zver.play=function(){};
  try{return fn.apply(ctx,args);}finally{Bank.play=bp;Zver.play=zp;}},
 legVoice(M,o){const r=M&&M.m&&M.m.b;return r?this.play([r],Object.assign({maxSec:2.2,gain:0.9},this.near(0),o||{})):false;},
 /* Шаги зверя или скакуна: zv — шаг рода, скакун палат — по ходу. */
 stepsOf(M){if(!M)return ["oc_step_soft"];if(M.kind==="zv"){const p=this.prof(M.a);return p.е||p.ш||["oc_step_soft"];}
  const ход=safeFn(()=>Stable.moveOf(M),"walk");return {fly:["zv_wing","raptor_wing"],swim:["oc_swim","oc_splash"],crawl:["prop_crawl","creatures/cr_spider_step.flac"],dig:["oc_dig"]}[ход]||["zv_ride_walk"];},
 /* Уходит (задание, на волю): голос — и шаги удаляются. */
 leave(a,далеко){const p=this.prof(a);this.scene(1800);this.voice(a,{gain:0.9});
  for(let i=0;i<4;i++){const t=i/3;this.later(380+i*300,()=>this.play(p.ш||["oc_step_soft"],{dx:0.4+2.0*t,dy:-0.4-(далеко?2.6:2.0)*t,maxSec:0.9,gain:0.75-0.35*t,rate:this.rate(a)}));}},
 /* Скакун идёт на зов: шаги издали — голос. */
 come(M){const L=this.stepsOf(M);this.scene(1800);const rate=M&&M.kind==="zv"?this.rate(M.a):1;
  for(let i=0;i<4;i++){const t=i/3;this.later(i*280,()=>this.play(L,{dx:2.2-1.8*t,dy:-2.4+2.1*t,maxSec:0.9,gain:0.45+0.35*t,rate}));}
  this.later(1250,()=>{if(M&&M.kind==="zv")this.voice(M.a,{gain:0.95});else this.legVoice(M,{gain:0.95});});},
 /* Уход за скакуном: щётка — довольный голос. */
 careMount(M){if(M&&M.kind==="zv")return this.care(M.a,"groom");this.scene(1400);
  this.play(["craft_hide","arte_leather"],Object.assign({maxSec:1.4,gain:0.75},this.near(0)));this.later(900,()=>this.legVoice(M,{gain:0.8}));},
 /* Снаряжение и выучка скакуна палат. */
 equipLeg(M,slot){this.play(ZV_GEAR_SND[slot]||["equip_leather_on"],Object.assign({maxSec:1.6,gain:0.85},this.near(0)));this.later(650,()=>this.legVoice(M,{gain:0.75}));},
 trainLeg(M){this.play(["arc_rise","magic_shimmer"],Object.assign({maxSec:1.8,gain:0.85},this.near(0)));this.later(520,()=>this.legVoice(M,{gain:0.9}));}});
/* Спешиться: скрип седла, шаг на землю — и голос того, с кого сошли. */
safeFn(()=>{const d0=ZvSnd.dismount;ZvSnd.dismount=function(M){d0.call(this);if(M)this.later(600,()=>{if(M.kind==="zv")this.voice(M.a,{gain:0.7});else this.legVoice(M,{gain:0.7});});};});
/* «Сесть верхом» из окна: без лишнего стука копыт и второго голоса. */
safeFn(()=>{const m0=Stable.mountUp;Stable.mountUp=function(k){return ZvSnd.hush(m0,this,arguments,false);};});
/* «Спешиться здесь»: скрип седла вместо копыт. */
safeFn(()=>{const d0=Stable.dismountHere;Stable.dismountHere=function(){const k=safeFn(()=>this.riding(),null);const M=k?safeFn(()=>this.mBy(k),null):null;
 const t=ZvSnd.hush(d0,this,arguments);if(k&&!safeFn(()=>this.riding(),null))safeFn(()=>ZvSnd.dismount(M));return t;};});
/* Позвать скакуна: шаги издали и голос. */
safeFn(()=>{const c0=Stable.call;Stable.call=function(k){const t=ZvSnd.hush(c0,this,arguments);if(/приходит/.test(String(t)))safeFn(()=>ZvSnd.come(this.mBy(k)));return t;};});
/* Почистить скакуна. */
safeFn(()=>{const c0=Stable.mountCare;Stable.mountCare=function(k){const t=ZvSnd.hush(c0,this,arguments);if(/^Вы чистите/.test(String(t)))safeFn(()=>ZvSnd.careMount(this.mBy(k)));return t;};});
/* Снаряжение и выучка скакуна тайных палат. */
safeFn(()=>{const e0=Stable.legEquip;Stable.legEquip=function(id,slot){const t=ZvSnd.hush(e0,this,arguments);if(/надето/.test(String(t)))safeFn(()=>ZvSnd.equipLeg(this.mBy("leg:"+id),slot));return t;};});
safeFn(()=>{const t0=Stable.train;Stable.train=function(id){const t=ZvSnd.hush(t0,this,arguments);if(/выучка «/.test(String(t)))safeFn(()=>ZvSnd.trainLeg(this.mBy("leg:"+id)));return t;};});
/* Уход за питомцем: вычёсывание — одна щётка, а не две. */
safeFn(()=>{const c1=Stable.care;Stable.care=function(u,k){ZvSnd.вУходе=(ZvSnd.вУходе|0)+1;try{return ZvSnd.hush(c1,this,arguments,false);}finally{ZvSnd.вУходе--;}};});
/* На задание: голос — и шаги уходят; отозвать — шаги назад. */
safeFn(()=>{const s0=Stable.taskStart;Stable.taskStart=function(u){const a=Zver.byUid(u);const было=a&&a.задание;const t=ZvSnd.hush(s0,this,arguments);
 if(a&&a.задание&&a.задание!==было)safeFn(()=>ZvSnd.leave(a,true));return t;};});
safeFn(()=>{const r0=Stable.taskRecall;Stable.taskRecall=function(u){const a=Zver.byUid(u);const t=r0.apply(this,arguments);if(a&&/возвращается/.test(String(t)))safeFn(()=>ZvSnd.back(a,false));return t;};});
/* На волю: голос — и шаги уходят далеко. */
safeFn(()=>{const r0=Zver.release;Zver.release=function(u){const a=this.byUid(u);const t=r0.apply(this,arguments);if(a&&/на волю/.test(String(t)))safeFn(()=>ZvSnd.leave(a,true));return t;};});
/* Новый зверь (купленный, вылупившийся): его голос — ярко, своим трактом. */
safeFn(()=>{const b0=Zver.buy;Zver.buy=function(id){const до=this.st().list.length;const zp=this.play;this.play=function(){};let t;try{t=b0.apply(this,arguments);}finally{this.play=zp;}
 if(this.st().list.length>до){const a=this.st().list[this.st().list.length-1];ZvSnd.later(450,()=>ZvSnd.voice(a,{gain:1}));}return t;};});
safeFn(()=>{const h0=Zver.hatch;Zver.hatch=function(){const до=this.st().list.length;const zp=this.play;this.play=function(){};let t;try{t=h0.apply(this,arguments);}finally{this.play=zp;}
 const нов=this.st().list.slice(до);нов.slice(0,2).forEach((a,i)=>ZvSnd.later(300+i*1400,()=>{ZvSnd.play(["craft_stone","mtg_place"],Object.assign({maxSec:0.8,gain:0.6},ZvSnd.near(i)));ZvSnd.later(250,()=>ZvSnd.voice(a,{gain:1,i}));}));return t;};});
/* Звериное зелье дано: глоток — и голос. */
safeFn(()=>{const g0=Zver.give;Zver.give=function(u){const a=this.byUid(u);const t=g0.apply(this,arguments);if(a&&!ZvSnd.вУходе&&!/нет|в сумке нет/.test(String(t).slice(0,40)))ZvSnd.later(500,()=>ZvSnd.voice(a,{gain:0.85}));return t;};});
/* «Накормить всех»: сценки по очереди, не больше трёх, звук уровня — один. */
safeFn(()=>{const f0=Zver.feedAll;Zver.feedAll=function(){const fd=ZvSnd.feed,lv=ZvSnd.level;let n=0,lvl=0;
 ZvSnd.feed=function(a,k,люб){const i=n++;if(i>=3)return;if(!i)return fd.call(this,a,k,люб);this.scene(1700*i+2600);this.later(1700*i,()=>fd.call(this,a,k,люб));};
 ZvSnd.level=function(a){if(lvl++)return;return lv.call(this,a);};
 try{return f0.apply(this,arguments);}finally{ZvSnd.feed=fd;ZvSnd.level=lv;}};});
