/* ════════ 15.0: ПИТОМЦЫ И МАУНТЫ — ПОСАДКА, ЗВУК ПРЕЖДЕ СЛОВ ════════
   Жалобы игрока: «забираешься в седло — нет звука, что забрался или
   спешился»; «позвал скакуна, нажал „Забраться“ — он не забирается, шагнул —
   а скакун так и стоит справа»; «не слышно, как питомец ест, как вкладываются
   очки развития». */

/* ── 1. Звук прежде слов ──
   Звуки были, но итог дела звучал в тот же миг и глушил их, а окно питомца,
   обновляясь, тут же перечитывало своё имя поверх итога (и отказ «не
   подпускает вас» пропадал за ним — казалось, что ничего не случилось).
   Теперь в окнах «Питомцы» и «Маунты» после дела окно обновляется молча,
   звук идёт первым, итог — следом. */
const ZV_PAUSE={feed:900,feedall:900,growdo:950,care:800,docare:800,ride:850,off:700,call:1100,equip:650,lequip:650,putart:650,give:600,train:800,task:450,recall:450,role:450,follow:600,release:450};
const ZvSay={тихо:0,
 /* первая фраза дела — через ms (звук успевает прозвучать); окно в это время не перечитывается */
 run(ms,fn,self,args){let первая=true;this.тихо++;
  try{return Speech.на_время(()=>fn.apply(self,args||[]),function(t,o,дальше){if(первая&&!(o&&o.cat==="ui")){первая=false;
    if(ms>0){setTimeout(()=>safeFn(()=>дальше(t,o)),ms);return true;}}return дальше(t,o);},"звук прежде слов");}
  finally{this.tihoOff();}},
 tihoOff(){this.тихо=Math.max(0,this.тихо-1);}};
/* Окно, обновлённое после дела, молчит: курсор встаёт на первую строку без слов. */
safeFn(()=>{const sh0=Stable.show;Stable.show=function(modal,title,html){if(!ZvSay.тихо)return sh0.apply(this,arguments);
 const me=this,a=arguments;
 return Speech.на_время(()=>sh0.apply(me,a),(t,o,дальше)=>{if(o&&o.cat==="ui")return true;return дальше(t,o);},"окно обновляется молча");};});
/* Слова о посадке и спешивании из «Действия здесь», из окна объектов и по главному действию скакуна —
   тоже после звука: следующая фраза с тем же текстом откладывается. */
const ZvLater={t:0,text:"",ms:0};
safeFn(()=>{Speech.use("посадка — звук прежде слов",function(t,o,дальше){
 if(ZvLater.text&&Date.now()-ZvLater.t<150&&String(t)===ZvLater.text){const ms=ZvLater.ms;ZvLater.text="";setTimeout(()=>safeFn(()=>дальше(t,o)),ms);return true;}
 return дальше(t,o);},20);});
safeFn(()=>{const m0=Stable.mountUp;Stable.mountUp=function(k){const до=safeFn(()=>this.riding(),null);const t=m0.apply(this,arguments);
 if(safeFn(()=>this.riding(),null)===k&&до!==k){ZvLater.t=Date.now();ZvLater.text=String(t);ZvLater.ms=ZV_PAUSE.ride;}return t;};});
safeFn(()=>{const d0=Stable.dismountHere;Stable.dismountHere=function(){const до=safeFn(()=>this.riding(),null);const t=d0.apply(this,arguments);
 if(до&&!safeFn(()=>this.riding(),null)){ZvLater.t=Date.now();ZvLater.text=String(t);ZvLater.ms=ZV_PAUSE.off;}return t;};});

/* ── 2. «Сесть верхом» из окна ──
   Удалось — окно закрывается, слышна посадка, затем слова. Не удалось (скакун не
   рядом, не подпускает) — окно скакуна остаётся, и причина звучит последней, а не
   тонет под заново прочитанным окном. */
Stable.rideCmd=function(arg){const key=String(arg||"").split(":").slice(1,3).join(":");
 const t=this.mountUp(key);ZvLater.text="";
 if(safeFn(()=>this.riding(),null)===key){safeFn(()=>{saveGame(true);refresh();});safeFn(()=>closeTopUI());
  setTimeout(()=>safeFn(()=>narrate(t,{interrupt:true})),ZV_PAUSE.ride);return true;}
 ZvSay.тихо++;let r;try{r=this.mountView(key);}finally{ZvSay.tihoOff();}
 narrate(t,{interrupt:true});safeFn(()=>saveGame(true));return r;};
for(const nm of ["petCmd","mntCmd"])safeFn(()=>{const c0=Stable[nm];Stable[nm]=function(arg){const k=String(arg||"").split(":")[0];
 if(nm==="mntCmd"&&k==="ride")return this.rideCmd(arg);
 const ms=ZV_PAUSE[k];if(!ms)return c0.apply(this,arguments);
 return ZvSay.run(ms,c0,this,arguments);};});

/* ── 3. Посадка и спешивание слышны ──
   Посадка: рывок вверх — скрип седла — голос скакуна — его первый шаг под вами.
   Спешивание: скрип седла — прыжок на землю — голос того, с кого сошли. */
Object.assign(ZvSnd,{
 mount(M){const pos={dx:0.3,dy:0.1};this.scene(1600);
  this.play(["lug_whoosh"],Object.assign({maxSec:0.7,gain:0.9},pos));
  this.later(170,()=>this.play(["equip_leather_on","arte_leather"],Object.assign({maxSec:1.2,gain:1.05},pos)));
  this.later(520,()=>{if(M&&M.kind==="zv")this.voice(M.a,{gain:1});else if(M)this.legVoice(M,{gain:1});});
  this.later(980,()=>safeFn(()=>{if(M)ZvWalk.ride(M);}));},
 dismount(M){const pos={dx:0.3,dy:0.1};this.scene(1300);
  this.play(["equip_leather_off","arte_leather"],Object.assign({maxSec:1.2,gain:1.05},pos));
  this.later(300,()=>this.play(["lug_land"],Object.assign({maxSec:0.8,gain:1},{dx:0.15,dy:0.2})));
  this.later(680,()=>{if(M&&M.kind==="zv")this.voice(M.a,{gain:0.85});else if(M)this.legVoice(M,{gain:0.85});});}});

/* ── 4. Очко развития: у каждой ветви свой звук ──
   Клык — оскал, удар когтями и точильный камень; шкура — кожа, кольчуга и глухой
   удар; чутьё — нюх и звон; связь — сердце и тёплый отзвук; ход — по роду хода:
   крылья, копыта, ползучие лапы, плеск, рытьё. Затем — голос зверя. */
const ZV_GROW_SND={
 fang:[["lug_snarl","sv_beast_snarl"],["lug_claw"],["prop_whetstone","lug_knife_sheathe"]],
 hide:[["craft_hide"],["equip_chain_on"],["lug_thud","oc_rock_hit"]],
 sense:[["zv_sniff"],["arc_shine"],["uh_bell"]],
 bond:[["hero_heart"],["heal_bloom"],["zv_purr"]],
 move:{fly:[["zv_wing"],["sky_gust"],["raptor_wing"]],walk:[["tread_hoof","zv_ride_gallop"],["zv_ride_trot"],["lug_whoosh"]],
  crawl:[["prop_crawl"],["lug_claw"],["prop_crawl"]],swim:[["oc_swim"],["oc_splash"],["oc_swim"]],dig:[["oc_dig"],["deep_rocks"],["oc_dig"]]}};
safeFn(()=>{const g0=Zver.grow;Zver.grow=function(u,br){ZvSnd.ветвь=br;try{return g0.apply(this,arguments);}finally{ZvSnd.ветвь=null;}};});
ZvSnd.grow=function(a){const pos=this.near(0);const br=this.ветвь;this.scene(1500);
 let L=ZV_GROW_SND[br];if(br==="move"){const f=safeFn(()=>Zver.fam(a),null);L=ZV_GROW_SND.move[(f&&f.ход)||"walk"]||ZV_GROW_SND.move.walk;}
 if(!L){this.play(["arc_rise","magic_shimmer"],Object.assign({maxSec:1.8,gain:0.85},pos));this.later(520,()=>this.voice(a,{gain:0.85}));return;}
 L.forEach((x,i)=>this.later(i*260,()=>this.play(x,Object.assign({maxSec:1.2,gain:i===0?1:0.9},pos))));
 this.later(L.length*260+120,()=>this.play(["arc_rise"],Object.assign({maxSec:1.2,gain:0.6},pos)));
 this.later(L.length*260+480,()=>this.voice(a,{gain:0.9}));};

/* ── 5. «Действие здесь»: только что позванный скакун — первым ──
   Скакун стоит под ногами (его позвали) — «Действие здесь» сажает в седло, а не
   открывает узел Сети или вещи рядом. Встреча с диким зверем по-прежнему главнее. */
safeFn(()=>{const u0=useHere;useHere=matKeep(u0,function(){
 if(!G.inCombat&&!G.ship&&!safeFn(()=>BeastMeet.here(),false)&&!safeFn(()=>Stable.riding(),null)){
  const тут=(safeFn(()=>Stable.near(0),[])||[]).find(x=>x.d===0);
  if(тут){const t=Stable.mountUp(тут.M.k);narrate(t,{interrupt:true});safeFn(()=>{saveGame(true);refresh();});return true;}}
 return u0.apply(this,arguments);});});

/* ── 6. Способности: у каждого рода три своих ──
   Просьба игрока: «у Феникса одни, у Скорпиона другие, у Голема третьи…»; «разные
   звуки на разные способности; лечение — тоже разное: лечит хозяина или сам себя».
   У каждого из сорока шести родов три способности: первая — с первого уровня,
   вторая — с шестого, третья — с двенадцатого. В бою за ход зверь пробует одну
   из открытых, наугад; «Возрождение из пепла» и «Девять жизней» срабатывают сами,
   раз за бой. У каждой способности свой звук: удар и чары — у твари, лечение
   хозяина и заслон — у вас, своё лечение и уловки — у самого зверя.
   Строка: [название, действие, шанс за ход, с какого уровня, слои звука]. */
const ZV_ABIL150={
 roc:[["Удар крылом","stun",0.15,1,[["sky_gust","oc_gust"],["lug_whoosh_hit"]]],["Буря перьев","blind",0.15,6,[["sp_wings","wyrm_wing"],["gale_hit"]]],["Камень с высоты","crit",0.14,12,[["lug_whoosh"],["oc_rockfall","mtg_stone_hit"]]]],
 griffin:[["Когти грифона","bleed",0.2,1,[["lug_claw"],["blade_flesh","lug_flesh"]]],["Львиный рык","fear",0.16,6,[["sv_beast_roar","beasts_lion"]]],["Пике с небес","mark",0.14,12,[["raptor_wing"],["lug_whoosh"],["raptor_cry"]]]],
 wyvern:[["Жало виверны","poison",0.2,1,[["foe_wyrm_hit"],["oc_trap_poison","oc_res_venom"]]],["Хлёст хвостом","stun",0.14,6,[["lug_whoosh_hit"],["lug_thud"]]],["Кислотный плевок","break",0.15,12,[["sp_acid"],["oc_sizzle"]]]],
 drake:[["Огненное дыхание","burn",0.22,1,[["fire_spell_fly","flame_cast"],["fire_spell_hit","oc_fireball"]]],["Чешуя дракона","ward",0.15,6,[["gear_plate","equip_plate_on"],["arc_shine"]]],["Драконий рёв","weaken",0.15,12,[["dragon_growl","wyrm_roar"],["creatures/cr_dragon_emerge.flac"]]]],
 pegasus:[["Светлое копыто","heal",0.2,1,[["tread_hoof"],["heal_bloom"],["arc_chimes"]]],["Порыв крыльев","dodge",0.18,6,[["zv_wing"],["sky_gust"]]],["Небесный свет","blind",0.14,12,[["spell_light"],["arc_shine"]]]],
 skyray:[["Тень ската","fear",0.2,1,[["sv_shadow"],["oc_fan"]]],["Электрический хвост","stun",0.15,6,[["oc_zap","cast_shock"],["oc_electrical"]]],["Облачный покров","ward",0.14,12,[["sky_gust"],["spell_ward","cast_shield"]]]],
 dragonfly:[["Вихрь крыльев","double",0.2,1,[["sp_buzz","oc_mosquito"],["lug_whoosh_hit"]]],["Мерцание","dodge",0.2,6,[["oc_mosquito"],["magic_woosh"]]],["Укус-игла","bleed",0.16,12,[["creatures/cr_hornet_attack.flac"],["lug_knife_slice"]]]],
 raven:[["Вещий крик","fear",0.22,1,[["wild_raven","crow"],["zm_whisper"]]],["Клевок в глаз","blind",0.16,6,[["lug_claw"],["crow"]]],["Дурное знамение","weaken",0.15,12,[["omen","sv_god_omen"],["crow"]]]],
 owl:[["Бесшумный налёт","crit",0.2,1,[["oc_bat_flutter"],["lug_claw"]]],["Ночной взгляд","mark",0.16,6,[["wild_owl","bird_owl"],["arc_shine"]]],["Совиный покой","regen",0.14,12,[["bird_owl"],["chant_ether"],["heal_bloom"]]]],
 hawk:[["Пике","crit",0.25,1,[["raptor_wing"],["lug_whoosh"],["lug_claw"]]],["Когти-крючья","bleed",0.18,6,[["lug_claw"],["lug_flesh"]]],["Зоркий глаз","mark",0.16,12,[["bird_hawk"],["arc_shine"]]]],
 bat:[["Ультразвук","stun",0.12,1,[["creatures/cr_bat_sonic_special.flac"]]],["Кровопийца","drain",0.18,6,[["creatures/cr_bat_attack.flac"],["sv2_drain"]]],["Эхо в темноте","mark",0.15,12,[["oc_bat_noise"],["gr_spot_pulse"]]]],
 moth:[["Светящаяся пыльца","heal",0.25,1,[["oc_bat_flutter"],["magic_shimmer"],["heal_bloom"]]],["Сонная пыльца","snare",0.12,6,[["magic_shimmer"],["gr_spot_breath"]]],["Слепящий свет","blind",0.16,12,[["oc_trap_light","spell_light"]]]],
 phoenix:[["Пепел возрождения","heal",0.3,1,[["ash_crackle"],["heal_bloom"],["arc_chimes"]]],["Огненное крыло","burn",0.2,6,[["sp_wings"],["oc_inflame","fire_spell_hit"]]],["Возрождение из пепла","revive",1,12,[["oc_fireball","lug_fire_start"],["sv2_rebirth"],["raptor_cry"]]]],
 horse:[["Удар копытом","stun",0.12,1,[["tread_hoof"],["lug_thud"]]],["Галоп","double",0.16,6,[["zv_ride_gallop"],["lug_whoosh_hit"]]],["Дыбы","fear",0.15,12,[["zv_neigh","beasts_horse"],["tread_hoof"]]]],
 stag:[["Рога оленя","bleed",0.15,1,[["oc_wood_hit"],["blade_flesh"]]],["Лесной зов","regen",0.14,6,[["oc_cattle_snort"],["ad_leaves","plant_spell_hit"],["heal_bloom"]]],["Олений скачок","dodge",0.18,12,[["tread_hoof"],["lug_land"]]]],
 elk:[["Таран","stun",0.15,1,[["lug_impact"],["oc_wood_hit"]]],["Лопаты рогов","taunt",0.15,6,[["oc_wood_dull"],["beast_bull"]]],["Растоптать","break",0.14,12,[["stomp","hit_ground"],["lug_break"]]]],
 wolf:[["Стайная хватка","double",0.2,1,[["lug_claw"],["lug_flesh"]]],["Вой стаи","weaken",0.15,6,[["wolf_howl"]]],["Хватка за лапу","snare",0.1,12,[["sv_wolf_snarl"],["blade_flesh"]]]],
 lynx:[["Прыжок рыси","crit",0.25,1,[["lug_whoosh"],["lug_claw"]]],["Тихая тень","dodge",0.2,6,[["sv_slip"],["oc_step_soft"]]],["Рваные раны","bleed",0.18,12,[["lug_snarl"],["lug_knife_slice"]]]],
 bear:[["Медвежья хватка","stun",0.18,1,[["zm_growl_deep"],["foe_brute_hit"]]],["Медвежья шкура","taunt",0.16,6,[["brute_roar"],["gear_guard_thud"]]],["Зимний сон","selfheal",0.15,12,[["zm_growl_deep"],["od_heal","sv2_rise"]]]],
 boar:[["Клыки вепря","bleed",0.2,1,[["beast_pig","zv_pig"],["blade_flesh"]]],["Слепая ярость","crit",0.15,6,[["beasts_pig"],["foe_brute_hit"]]],["Подсечка","break",0.14,12,[["mtg_step_dirt","hit_ground"],["lug_thud"]]]],
 ram:[["Разбег","stun",0.15,1,[["tread_hoof"],["lug_impact"]]],["Крепкий лоб","shield",0.18,6,[["oc_rock_hit"],["cast_block"]]],["Горное упрямство","taunt",0.14,12,[["zv_bleat","beasts_sheep"],["gear_guard_thud"]]]],
 aurochs:[["Рога тура","crit",0.18,1,[["beast_bull"],["blade_spear"]]],["Топот стада","quake",0.14,6,[["stomp"],["oc_earthquake","cast_quake"]]],["Бычья стойкость","selfheal",0.14,12,[["zv_moo"],["od_heal"]]]],
 camel:[["Плевок","blind",0.16,1,[["beasts_camel"],["ooze_splat"]]],["Терпение пустыни","regen",0.14,6,[["tread_sand"],["heal_bloom"]]],["Удар коленом","stun",0.13,12,[["lug_thud"],["tread_hoof"]]]],
 lion:[["Царский рык","fear",0.25,1,[["beasts_lion","sv_beast_roar"]]],["Прыжок на холку","crit",0.18,6,[["lug_whoosh"],["lug_claw"],["lug_flesh"]]],["Гордость прайда","mark",0.15,12,[["sv_beast_roar"],["cast_warcry"]]]],
 hound:[["Хватка за горло","bleed",0.2,1,[["oc_growl"],["lug_flesh"]]],["Верный страж","taunt",0.18,6,[["zv_bark","oc_dog_bark"],["gear_guard_thud"]]],["Зализать раны","heal",0.18,12,[["oc_dog_whine","zv_pant"],["heal_bloom"]]]],
 fox:[["Лисья хитрость","dodge",0.25,1,[["lug_bark"],["sv_slip"]]],["Обманный выпад","crit",0.16,6,[["lug_whoosh"],["lug_snarl"]]],["Хвост-метёлка","blind",0.15,12,[["oc_rustle","sky_leaves"],["lug_whoosh"]]]],
 cat:[["Когти-бритвы","bleed",0.2,1,[["lug_snarl"],["lug_knife_slice"]]],["Мурлыканье","regen",0.16,6,[["zv_purr"],["heal_bloom"]]],["Девять жизней","revive",1,12,[["lug_snarl"],["sv2_rebirth"],["zv_purr"]]]],
 unicorn:[["Рог исцеления","heal",0.3,1,[["arc_chimes"],["heal_bloom","spell_heal"]]],["Очищение","cleanse",0.2,6,[["spell_light"],["od_heal"]]],["Удар рогом","crit",0.18,12,[["blade_spear"],["arc_hit"]]]],
 runner:[["Рывок ящера","double",0.2,1,[["oc_step_hard"],["lug_claw"]]],["Серповидный коготь","bleed",0.18,6,[["sv_snake"],["lug_knife_slice"]]],["Отвлекающий бросок","mark",0.16,12,[["lug_whoosh"],["mtg_step_hard"],["sv_snake"]]]],
 golem:[["Каменная стена","shield",0.25,1,[["golem_step"],["mtg_stone_hit","cast_block"]]],["Сокрушительный удар","stun",0.16,6,[["golem_hit"],["mtg_crumble"]]],["Землетрясение","quake",0.14,12,[["oc_earthquake","cast_quake"],["oc_rockfall"]]]],
 steed:[["Паровой рывок","double",0.15,1,[["oc_steam"],["mtg_metal_hit"]]],["Медный панцирь","ward",0.16,6,[["lug_clank"],["equip_plate_on"]]],["Искровой разряд","stun",0.14,12,[["oc_electrical","oc_spark"],["cast_shock"]]]],
 beetle:[["Панцирь жука","shield",0.25,1,[["deep_rocks"],["oc_shield_block"]]],["Рог-таран","stun",0.14,6,[["lug_impact"],["oc_rock_hit"]]],["Жвалы-ножницы","break",0.15,12,[["zm_chitter"],["lug_break"]]]],
 spider:[["Паутина","snare",0.14,1,[["creatures/cr_spider_netshot_special.flac"]]],["Ядовитый укус","poison",0.2,6,[["creatures/cr_spider_attack.flac"],["oc_res_venom"]]],["Кокон","selfheal",0.14,12,[["sv2_thread"],["od_heal"]]]],
 centipede:[["Яд сотни ног","poison",0.25,1,[["sv2_swarm_bite"],["oc_trap_poison"]]],["Сотня ударов","double",0.18,6,[["prop_crawl"],["sv2_swarm_bite"]]],["Кольцо сколопендры","taunt",0.14,12,[["zm_chitter"],["prop_crawl"]]]],
 serpent:[["Удушающие кольца","snare",0.12,1,[["prop_crawl"],["sv_serpent"]]],["Ядовитые клыки","poison",0.2,6,[["serpent_hiss"],["oc_res_venom"]]],["Гипнотический взгляд","weaken",0.15,12,[["sv_lamia"],["zm_whisper"]]]],
 salamander:[["Огненная кожа","burn",0.25,1,[["oc_sizzle"],["lug_fire"]]],["Тёплый огонь","regen",0.16,6,[["ad_fire_crackle","wild_hearth"],["heal_bloom"]]],["Пламя в жилах","selfheal",0.15,12,[["oc_inflame"],["sv2_rise"]]]],
 tortoise:[["Укрыться в панцире","shield",0.3,1,[["oc_rock_hit"],["cast_shield"]]],["Древний покой","selfheal",0.16,6,[["deep_drip"],["od_heal"]]],["Живая крепость","taunt",0.16,12,[["oc_rock_hit"],["gear_guard_thud"]]]],
 scorpion:[["Жало скорпиона","poison",0.25,1,[["w_v_stiletto_hit","battle_stab"],["oc_res_venom"]]],["Клешни","stun",0.15,6,[["lug_claw"],["oc_trap_mech"]]],["Хитиновая броня","shield",0.15,12,[["equip_chain_on"],["oc_shield_block"]]]],
 snail:[["Липкая слизь","weaken",0.18,1,[["stk_goo"],["ooze_splat"]]],["Целебная слизь","heal",0.2,6,[["creatures/cr_slime_step.flac"],["heal_bloom"]]],["Перламутровый щит","ward",0.15,12,[["oc_glass_hit","sp_crystal"],["spell_ward"]]]],
 lizard:[["Ядовитая слюна","poison",0.2,1,[["sv_snake"],["ooze_splat"]]],["Отбросить хвост","dodge",0.2,6,[["prop_crawl"],["sv_slip"]]],["Солнечный жар","selfheal",0.14,12,[["tread_sand"],["sv2_rise"]]]],
 hippocamp:[["Волна","stun",0.15,1,[["water_spell_hit"],["oc_splash"]]],["Морская пена","heal",0.18,6,[["oc_bubble"],["heal_bloom"]]],["Водяная завеса","ward",0.15,12,[["stk_splash"],["spell_ward"]]]],
 seaserp:[["Кольца морского змея","snare",0.12,1,[["oc_swim"],["sv_serpent"]]],["Глубинный рёв","fear",0.18,6,[["zm_growl_wet"],["stk_deepsea"]]],["Водоворот","quake",0.14,12,[["oc_dive"],["water_spell_hit"]]]],
 otter:[["Ловкость выдры","dodge",0.25,1,[["oc_splash"],["oc_chirp"]]],["Речная прохлада","regen",0.16,6,[["oc_waterdrop","wild_river"],["heal_bloom"]]],["Камнем по панцирю","break",0.15,12,[["oc_rock_hit"],["lug_break"]]]],
 mole:[["Подкоп","crit",0.2,1,[["oc_dig"],["foe_burrow_hit"]]],["Земляной вал","shield",0.16,6,[["od_dig"],["mtg_rubble"]]],["Обвал","quake",0.14,12,[["oc_rockfall"],["deep_rocks"]]]],
 worm:[["Проглотить","drain",0.18,1,[["foe_burrow_hit"],["zm_chew"]]],["Едкий сок","break",0.16,6,[["stk_goo"],["oc_corrode"]]],["Дрожь земли","quake",0.14,12,[["od_dig"],["oc_quake"]]]],
 badger:[["Барсучья ярость","double",0.2,1,[["oc_growl"],["lug_claw"]]],["Толстая шкура","taunt",0.15,6,[["sv_rat_growl"],["gear_guard_thud"]]],["Укрытие в норе","selfheal",0.15,12,[["oc_dig"],["od_heal"]]]]};
for(const k of Object.keys(ZV_ABIL150))ZV_ABIL150[k]=ZV_ABIL150[k].map(([n,эф,ш,ур,зв])=>({n,эф,ш,ур,зв}));
Object.assign(ZV_ABIL_EFFECTS,{
 weaken:"ослабляет: два удара твари слабее на четверть",break:"раскалывает защиту: два ваших удара сильнее на четверть",
 regen:"три хода подряд лечит хозяина",mark:"метит тварь: ваш следующий удар в полтора раза сильнее",
 blind:"слепит: следующий удар твари может пройти мимо",drain:"вытягивает силу твари и лечит себя",
 selfheal:"залечивает свои раны",revive:"раз за бой встаёт после смертельной раны",
 taunt:"вызывает удар на себя: принимает большую часть следующего удара твари",snare:"опутывает: тварь теряет два хода",
 quake:"сотрясает землю: урон, и тварь бьёт слабее",ward:"ставит заслон: гасит часть следующего удара твари",
 cleanse:"снимает с хозяина яд и другие недуги боя"});
/* Способности рода: все три; открытые — по уровню. */
Zver.abilities=function(a){const L=a&&ZV_ABIL150[a.fam];if(L)return L;const x=a&&ZV_ABILITIES[a.fam];return x?[Object.assign({ур:1,зв:null},x)]:[];};
Zver.abilOpen=function(a){const lvl=Number(a&&a.lvl)||1;return this.abilities(a).filter(x=>lvl>=x.ур);};
/* В бою за ход — одна открытая способность наугад (сама собой срабатывающие — не в счёт). */
safeFn(()=>{const ab0=Zver.ability;Zver.ability=function(a){const open=this.abilOpen(a).filter(x=>x.эф!=="revive");
 if(!open.length)return ab0.apply(this,arguments);return this._вБою?open[Math.floor(Math.random()*open.length)]:open[0];};});
function zvAbilWords(a){const lvl=Number(a&&a.lvl)||1;
 return Zver.abilities(a).map(x=>`«${x.n}» — ${ZV_ABIL_EFFECTS[x.эф]||""}${x.эф==="revive"?"":`, шанс ${Math.round(x.ш*100)} %`}${lvl<x.ур?` (откроется на уровне ${x.ур})`:""}`).join("; ");}
/* В окнах зверя («Зверинец» и «Питомцы») — все три способности. */
for(const [obj,nm] of [[Zver,"beastView"],[Stable,"petView"]])safeFn(()=>{const v0=obj[nm];if(typeof v0!=="function")return;
 obj[nm]=function(u){const a=Zver.byUid(u);const l0=this.line;
  if(a)this.line=function(t){t=String(t);if(/^Способности: /.test(t))t=t.replace(/^Способности: (?:«[^»]*» — [^;]*?(?=; облик|\. Умения|\.$)|нет)/,"Способности: "+zvAbilWords(a));return l0.call(this,t);};
  try{return v0.apply(this,arguments);}finally{this.line=l0;}};});

/* ── 7. Что делают новые способности ── */
const ZvAbilSnd={
 OWNER:new Set(["heal","regen","ward","shield","cleanse"]),SELF:new Set(["selfheal","dodge","taunt","revive"]),
 MAGIC:new Set(["heal","regen","ward","cleanse","blind","mark","weaken"]),
 очередь:null,   /* во время хода зверей звуки копятся и звучат сценой после удара */
 pos(a,x){const i=Math.max(0,(safeFn(()=>Zver.pets(),[])||[]).indexOf(a));
  if(this.OWNER.has(x.эф))return {dx:0.12,dy:0.08};if(this.SELF.has(x.эф))return ZvSnd.near(i);return ZvSnd.atFoe(i);},
 /* Слои способности по очереди; длительность сцены — в мс. */
 /* Способность без своего звука (облик, умение, артефакт): отзвук стихии облика и звук действия. */
 EFF:{stun:[["lug_impact"]],poison:[["oc_res_venom","oc_trap_poison"]],bleed:[["blade_flesh"]],burn:[["lug_fire","fire_spell_hit"]],double:[["lug_whoosh_hit"]],
  crit:[["lug_impact"],["blade_flesh"]],fear:[["zm_dread"]],heal:[["heal_bloom"]],shield:[["cast_block"]],lifesteal:[["sv2_drain"]],dodge:[["sv_slip"]]},
 layers(a,x){if(x&&x.зв)return x.зв;const base=this.EFF[x&&x.эф]||[["arc_hit"]];
  const va=safeFn(()=>Zver.varAbility(a),null);if(va&&x&&va.n===x.n){const v=safeFn(()=>Zver.variant(a),null);const ст=v&&ZV_STIH_SND[v.стих];if(ст)return [[ст]].concat(base);}
  return base;},
 dur(a,x){return this.layers(a,x).length*230+260;},
 now(a,x){const L=this.layers(a,x);const p=this.pos(a,x);const chan=this.MAGIC.has(x.эф)?"magic":"combat";
  L.forEach((layer,j)=>ZvSnd.later(j*230,()=>ZvSnd.play(layer,Object.assign({maxSec:1.6,gain:j?1:1.1,chan},p))));
  /* своё лечение — довольный голос зверя после звука; лечение хозяина — тёплый отзвук у вас */
  if(x.эф==="selfheal"||x.эф==="revive")ZvSnd.later(L.length*230+80,()=>{const pr=ZvSnd.prof(a);if(pr.сыт&&Bank.has(pr.сыт))ZvSnd.play([pr.сыт],Object.assign({maxSec:1.6,gain:0.85},p));else ZvSnd.voice(a,Object.assign({gain:0.85},p));});
  if(x.эф==="heal"||x.эф==="regen")ZvSnd.later(L.length*230+60,()=>ZvSnd.play(["hero_heart"],{dx:0,dy:0,maxSec:0.9,gain:0.45}));},
 play(a,x){if(this.очередь){this.очередь.push([a,x]);return;}this.now(a,x);}};
safeFn(()=>{const e0=Zver.effect;Zver.effect=function(a,x,d,cb){let r;const lvl=Number(a.lvl)||1;
 switch(x&&x.эф){
  case "weaken":cb.zvWeak=Math.max(Number(cb.zvWeak)||0,2);r=`${a.n}: «${x.n}» — тварь ослабла, два её удара слабее.`;break;
  case "break":cb.zvBreak=2;r=`${a.n}: «${x.n}» — защита твари расколота, два ваших удара сильнее.`;break;
  case "regen":{if(G.hp>=G.hpMax&&(Number(cb.zvRegen)||0)>0){r="";break;}const h=Math.max(1,Math.round(2+lvl*0.3));cb.zvRegen=3;cb.zvRegenH=h;cb.zvRegenN=a.n;cb.zvRegenUid=a.uid;
   const сейчас=Math.min(h,Math.max(0,G.hpMax-G.hp));G.hp+=сейчас;r=`${a.n}: «${x.n}» — лечит вас три хода${сейчас?`, +${сейчас}`:""}.`;break;}
  case "mark":cb.zvMarkHero=1;r=`${a.n}: «${x.n}» — тварь помечена, ваш следующий удар в полтора раза сильнее.`;break;
  case "blind":cb.zvBlind=1;r=`${a.n}: «${x.n}» — тварь ослеплена, следующий удар может пройти мимо.`;break;
  case "drain":{const z=Math.max(1,Math.round(d*0.5));cb.hp-=z;const до=this.hp(a);this.cure(a,z);const h=this.hp(a)-до;r=`${a.n}: «${x.n}» — вытягивает силу твари: ещё ${z}${h>0?`, себе +${h}`:""}.`;break;}
  case "selfheal":{const m=this.hpMax(a),до=this.hp(a);if(до>=m){r="";break;}this.cure(a,Math.max(3,Math.round(m*0.3)));r=`${a.n}: «${x.n}» — залечивает свои раны, +${this.hp(a)-до}.`;break;}
  case "taunt":cb.zvGuard=Math.max(Number(cb.zvGuard)||0,0.6);cb.zvGuardUid=a.uid;r=`${a.n}: «${x.n}» — вызывает удар твари на себя.`;break;
  case "snare":cb.путы=Math.max(Number(cb.путы)||0,2);r=`${a.n}: «${x.n}» — тварь опутана и теряет два хода.`;break;
  case "quake":{const z=Math.max(1,Math.round(d*0.7));cb.hp-=z;cb.zvWeak=Math.max(Number(cb.zvWeak)||0,1);r=`${a.n}: «${x.n}» — земля дрожит: ещё ${z}, и тварь бьёт слабее.`;break;}
  case "ward":{const w=Math.max(4,Math.round(5+lvl*1.2));cb.zvWard=Math.max(Number(cb.zvWard)||0,w);r=`${a.n}: «${x.n}» — заслон погасит до ${w} урона.`;break;}
  case "cleanse":{const снято=safeFn(()=>Hv.cureList(Hv.list().map(y=>y[0]).filter(id=>HV_DEFS[id]&&HV_DEFS[id].бой),1),[])||[];if(!снято.length){r="";break;}r=`${a.n}: «${x.n}» — снимает с вас: ${снято.join(", ")}.`;break;}
  case "revive":r="";break;
  default:r=e0.apply(this,arguments);}
 if(r&&x)ZvAbilSnd.play(a,x);
 return r;};});
/* Удар твари: ослабленная бьёт слабее, заслон гасит часть удара. */
safeFn(()=>{const g0=Zver.guard;Zver.guard=function(dmg){const cb=G.combat;if(!cb)return g0.apply(this,arguments);let d=Number(dmg)||0;const msg=[];
 if(d>0&&(Number(cb.zvWeak)||0)>0){cb.zvWeak--;d=Math.max(1,Math.round(d*0.75));}
 if(d>0&&(Number(cb.zvWard)||0)>0){const w=Math.min(d-1,cb.zvWard);cb.zvWard=0;if(w>0){d-=w;msg.push(`Заслон гасит ${w}.`);
  safeFn(()=>ZvSnd.play(["cast_block","oc_shield_block"],{dx:0.1,dy:0.05,maxSec:1,gain:0.8,chan:"magic"}));}}
 if(msg.length)safeFn(()=>narrate(msg.join(" "),{interrupt:false}));
 return g0.call(this,d);};});
/* Ослеплённая тварь бьёт мимо: удара нет вовсе — только свист. */
safeFn(()=>{const f0=foeStrike;foeStrike=matKeep(f0,function(o){const cb=G.combat;
 if(cb&&cb.zvBlind){cb.zvBlind=0;if(Math.random()<0.55){const m=cb.m;
  safeFn(()=>Bank.play("hit_air",{kind:"combat",gain:0.6,maxSec:2}));
  narrate(` ${m.n} бьёт вслепую — мимо!`,{key:"enemyhit",pri:1,ttl:1500,cat:"combat",interrupt:false});
  safeFn(()=>{updateCombat();refresh();});return 0;}}
 return f0.apply(this,arguments);});});
/* Метка и расколотая защита — к вашему удару. */
safeFn(()=>{const k0=bossDamageK;bossDamageK=matKeep(k0,function(kind){let k=k0.apply(this,arguments);const cb=G.combat;
 if(cb&&k>0&&(kind==="atk"||kind==="magic"||kind==="spell")){
  if(cb.zvMarkHero){cb.zvMarkHero=0;k*=1.5;}
  if((Number(cb.zvBreak)||0)>0){cb.zvBreak--;k*=1.25;}}
 return k;});});
/* «Возрождение из пепла», «Девять жизней»: смертельная рана — и зверь встаёт снова, раз за бой. */
safeFn(()=>{const h0=Zver.hurt;Zver.hurt=function(a,n){const cb=G.combat;
 if(a&&cb&&G.inCombat&&n>0&&!a.ранен){const rv=this.abilOpen(a).find(x=>x.эф==="revive");
  if(rv&&this.hp(a)-Math.round(n)<=0){cb.zvRevived=cb.zvRevived||{};
   if(!cb.zvRevived[a.uid]){cb.zvRevived[a.uid]=1;a.hp=Math.max(1,Math.round(this.hpMax(a)*0.4));ZvAbilSnd.now(a,rv);
    safeFn(()=>narrate(`${a.n}: «${rv.n}» — падает и встаёт снова, здоровье ${a.hp}.`,{interrupt:false}));return;}}}
 return h0.apply(this,arguments);};});

/* ── 8. Бой зверя слышен ──
   Жалоба: «не слышно, как питомец дерётся, такое чувство, что он вообще не дерётся».
   Удар зверя звучал в тот же миг, что ваш удар, ответ твари и речь, и тонул в них.
   Теперь после вашего удара идёт сцена зверя: бросок (крылья, шаг и свист, шорох,
   всплеск, рытьё), его удар у твари, отзвук облика, затем звук сработавшей
   способности или рык; второй спутник — следом за первым. Удары зверей идут
   громкостью боя, чары — громкостью магии.
   Голодный зверь не стоит в стороне, а бьётся вполсилы (и это сказано один раз
   за бой, с жалобным голосом); раненый назван один раз за бой, а не каждый ход. */
const ZV_LUNGE={walk:["lug_whoosh"],crawl:["prop_crawl"],swim:["oc_splash","stk_splash"],dig:["oc_dig","od_dig"]};
const ZV_FIGHT_START=560;
ZvSnd.fightScene=function(a,i,t0,abils){const p=this.prof(a);const f=safeFn(()=>Zver.fam(a),null);const ход=(f&&f.ход)||"walk";
 const pos=this.atFoe(i);const rate=this.rate(a);
 this.later(t0,()=>{if(ход==="fly")this.play(p.ш||["zv_wing"],Object.assign({},pos,{maxSec:0.7,gain:0.85,chan:"combat",rate}));
  else{this.play(ZV_LUNGE[ход]||ZV_LUNGE.walk,Object.assign({},pos,{maxSec:0.6,gain:0.7,chan:"combat"}));
   if(ход==="walk")this.play(p.ш||["oc_step_soft"],Object.assign({},pos,{maxSec:0.5,gain:0.6,chan:"combat",rate}));}});
 this.later(t0+170,()=>this.play(p.у||p.р,Object.assign({maxSec:1.6,rate,chan:"combat"},pos,{gain:1.15})));
 const v=safeFn(()=>Zver.variant(a),null);const ст=v&&ZV_STIH_SND[v.стих];
 if(ст)this.later(t0+250,()=>this.play([ст],Object.assign({maxSec:1.4,gain:0.75,chan:"combat"},pos)));
 let t=t0+560;
 for(const x of abils){const x0=x;this.later(t,()=>ZvAbilSnd.now(a,x0));t+=ZvAbilSnd.dur(a,x0);}
 if(!abils.length&&Math.random()<0.4){this.later(t-200,()=>this.growl(a,Object.assign({gain:0.85},pos)));t+=200;}
 return t-t0;};
/* Громкость боя или магии для звуков зверя (по умолчанию — прочие звуки). */
safeFn(()=>{const at0=ZvSnd.at;ZvSnd.at=function(file,dx,dy,o){const ch=o&&o.chan;if(!ch||ch==="fx")return at0.apply(this,arguments);
 const v0=Bank.vol;Bank.vol=function(k){return v0.call(this,k==="fx"?ch:k);};try{return at0.apply(this,arguments);}finally{Bank.vol=v0;}};});
safeFn(()=>{const t0=Zver.turn;Zver.turn=function(cb,act){if(!cb||!cb.m)return t0.apply(this,arguments);
 const pets=this.pets()||[];cb.zvSaid=cb.zvSaid||{};let pre="";
 /* голодный бьётся вполсилы: сила и так вдвое меньше при сытости ниже двадцати */
 const голод=[];for(const a of pets)if((Number(a.сыт)||0)<10&&!a.ранен&&this.hp(a)>0){голод.push([a,a.сыт]);a.сыт=10;}
 /* лечение на три хода («Лесной зов», «Мурлыканье»…) */
 if((Number(cb.zvRegen)||0)>0){cb.zvRegen--;const h=Math.min(Number(cb.zvRegenH)||2,Math.max(0,G.hpMax-G.hp));
  if(h>0){G.hp+=h;pre+=`${cb.zvRegenN||"Зверь"} лечит вас: +${h}.`;ZvSnd.later(300,()=>ZvSnd.play(["heal_bloom"],{dx:0.1,dy:0.05,maxSec:1.2,gain:0.75,chan:"magic"}));}}
 const бойцы=pets.filter(a=>(Number(a.сыт)||0)>=10&&!a.ранен&&this.hp(a)>0);
 const later0=ZvSnd.later;ZvSnd.later=function(){};   /* прежняя сцена 14.6 не звучит поверх новой */
 ZvAbilSnd.очередь=[];this._вБою=true;let r;
 try{r=t0.apply(this,arguments);}
 finally{ZvSnd.later=later0;this._вБою=false;for(const [a,s] of голод)a.сыт=s;}
 const q=ZvAbilSnd.очередь||[];ZvAbilSnd.очередь=null;
 safeFn(()=>{let t=ZV_FIGHT_START;for(const a of бойцы){const i=Math.max(0,pets.indexOf(a));t+=ZvSnd.fightScene(a,i,t,q.filter(e=>e[0]===a).map(e=>e[1]))+140;}
  for(const [a,x] of q)if(бойцы.indexOf(a)<0)ZvSnd.later(t,()=>ZvAbilSnd.now(a,x));});
 for(const [a] of голод){const k="h"+a.uid;if(cb.zvSaid[k])continue;cb.zvSaid[k]=1;const ж=safeFn(()=>Zver.fam(a).g==="ж",false);
  pre+=` ${a.n} голод${ж?"на":"ен"} и бьётся вполсилы — покормите ${ж?"её":"его"} после боя.`;
  const i=Math.max(0,pets.indexOf(a));ZvSnd.later(ZV_FIGHT_START-250,()=>ZvSnd.voice(a,Object.assign({gain:0.6,rate:ZvSnd.rate(a,1.25)},ZvSnd.near(i))));}
 r=String(r||"");
 for(const a of pets)if(a.ранен||this.hp(a)<=0){const s=`${a.n} ранен и не дерётся.`;const k="w"+a.uid;if(cb.zvSaid[k])r=r.split(s).join("");else cb.zvSaid[k]=1;}
 return (pre+" "+r).replace(/\s+/g," ").trim();};});

/* ── 9. Шаги и езда — у каждого свои ──
   Девять родов ступали одним и тем же мягким шагом. Теперь у каждого свой: волк —
   по траве, пёс — когтями по щебню, лев — тяжёлой лапой, лиса — легко, барсук —
   скребёт, варан — по песку, рысь — мягко по снегу; у копытных — свой стук,
   у морского змея и выдры — свой плеск. У некоторых шаг с отзвуком: саламандра
   шипит, феникс потрескивает, единорог звенит, механический скакун пыхтит паром,
   голем осыпает камешки, скорпион щёлкает клешнями. Верхом — тот же облик:
   каждый маунт под седлом звучит по-своему. */
const ZV_STEP150={
 roc:{ш:["zv_wing","sky_gust"]},griffin:{ш:["raptor_wing","wyrm_wing"]},pegasus:{ш:["zv_wing"]},hawk:{ш:["raptor_wing"]},owl:{ш:["oc_bat_flutter"]},
 dragonfly:{ш:["sp_buzz","oc_mosquito"]},skyray:{ш:["oc_fan","sky_gust"]},phoenix:{ш:["zv_wing"],шз:"lug_fire"},
 wolf:{ш:["lug_step_grass","mtg_step_grass"],е:["lug_step_grass","oc_step_soft"]},lynx:{ш:["oc_step_soft","tread_snow"]},
 lion:{ш:["mtg_step_dirt","step_dirt"],е:["mtg_step_dirt","oc_step_soft"]},hound:{ш:["mtg_step_gravel","tread_gravel"]},fox:{ш:["tread_grass"]},
 badger:{ш:["tread_gravel","mtg_step_dirt"]},stag:{ш:["tread_hoof","mtg_step_grass"],е:["tread_hoof","zv_ride_walk"]},
 elk:{ш:["mtg_step_dirt","tread_hoof"],е:["zv_ride_walk","mtg_step_dirt"]},boar:{ш:["mtg_step_dirt"],е:["tread_hoof","mtg_step_dirt"]},
 ram:{ш:["mtg_step_gravel","tread_hoof"],е:["tread_hoof","mtg_step_gravel"]},aurochs:{е:["brute_step","zv_ride_walk"]},
 unicorn:{шз:"arc_chimes"},runner:{ш:["mtg_step_hard","oc_step_hard"],е:["mtg_step_hard","lug_step_grass"]},steed:{шз:"oc_steam"},golem:{шз:"deep_rocks"},
 centipede:{ш:["prop_crawl","creatures/cr_spider_step.flac"]},salamander:{ш:["oc_step_soft"],шз:"oc_sizzle"},tortoise:{ш:["brute_step","mtg_step_hard"]},
 scorpion:{шз:"lug_claw"},lizard:{ш:["tread_sand","mtg_step_sand"]},seaserp:{ш:["stk_splash","oc_swim"]},otter:{ш:["oc_splash","oc_swim"]},
 worm:{ш:["od_dig","mtg_dig_gravel"]}};
for(const [k,v] of Object.entries(ZV_STEP150))if(ZV_SND[k])Object.assign(ZV_SND[k],v);
/* Отзвук шага: изредка, тише самого шага. */
ZvSnd.stepAccent=function(a,pos,ms){const p=this.prof(a);if(p.шз&&Math.random()<0.3)this.later((ms||0)+120,()=>this.play([p.шз],Object.assign({maxSec:0.8,gain:0.38},pos)));};
/* Спутники следом — ZvWalk.follow в zver155_late.js (там же отзвук за шагом). */
safeFn(()=>{const r0=ZvWalk.ride;ZvWalk.ride=function(M){const ok=r0.apply(this,arguments);if(M&&M.kind==="zv")ZvSnd.stepAccent(M.a,{dx:0,dy:0.15},0);return ok;};});

/* ── 10. Скакуны тайных палат: у каждого свой ход (15.0) ──
   Просьба игрока: «маунт, на котором едешь, должен и звучать как этот маунт».
   Скакуны тайных палат звучали лишь по роду хода: все ходячие — одним конским
   шагом, так что каменный жук, угольный пёс и стеклянная рысь шли под седлом,
   как лошадь. Теперь у каждого свой шаг, свой бег, свой ход по воде и своя
   примета, что слышна через несколько шагов: кобылица — копытом по пеплу, жук —
   ползком по щебню со стуком панциря, олень — мягко по траве с туманным ветром,
   рух — крылом с дальним громом, баран — копытом по камню с костяным стуком,
   приливный конь — по воде и в волну, пёс — лапами с треском углей, рысь — по
   стеклу со звоном, червь — сквозь породу с капелью, волк — по пеплу с рыком. */
const ZV_LEGRIDE150={
 ashmare:    {е:["zv_ride_walk","tread_hoof"],бег:["zv_ride_gallop"],а:["mtg_step_sand"],ак:3},
 stonebeetle:{е:["prop_crawl","mtg_step_gravel"],бег:["prop_crawl","deep_rocks"],а:["lug_clank","deep_stone"],ак:3},
 mistelk:    {е:["tread_hoof","mtg_step_grass"],бег:["zv_ride_trot","tread_grass"],а:["sky_wind","deep_wind"],ак:4},
 stormroc:   {е:["zv_wing","sky_gust"],бег:["zv_wing","lug_whoosh"],а:["sky_thunder"],ак:6},
 boneram:    {е:["tread_hoof","mtg_step_gravel"],бег:["zv_ride_trot","mtg_step_hard"],а:["lug_staff","lug_thud"],ак:3},
 tidehorse:  {е:["zv_ride_walk","mtg_step_water"],бег:["zv_ride_gallop","oc_splash"],вода:["oc_splash","mtg_step_water","stk_splash"],а:["sea_calm"],ак:4},
 emberhound: {е:["mtg_step_dirt","lug_step_stone"],бег:["zv_pant","mtg_step_dirt"],а:["oc_fire","lug_fire"],ак:3},
 glasslynx:  {е:["mtg_step_glass"],бег:["mtg_step_glass","lug_whoosh"],а:["oc_glass_hit"],ак:3},
 wormrider:  {е:["stk_goo","oc_dig"],бег:["oc_dig","deep_rocks"],а:["deep_drip"],ак:4},
 ashwolf:    {е:["lug_step_stone","mtg_step_sand"],бег:["zv_pant","mtg_step_sand"],а:["lug_growl","lug_snarl"],ак:5}};
safeFn(()=>{const r0=ZvWalk.ride;ZvWalk.ride=function(M){
 const id=M&&M.kind!=="zv"&&M.m&&M.m.id;const P=id&&ZV_LEGRIDE150[id];if(!P)return r0.apply(this,arguments);
 const run=safeFn(()=>!!runState.active,false);
 const вода=!G.place&&safeFn(()=>/water|sea|coast|lake|river/.test(cellContent(G.x,G.y).terrain[0]),false);
 const L=(вода&&P.вода)?P.вода:(run?P.бег:P.е);const pos={dx:0,dy:0.15};
 const ok=ZvSnd.play(L,Object.assign({maxSec:run?0.75:1,gain:run?0.95:0.88},pos));
 this.legN=(Number(this.legN)||0)+1;
 if(P.а&&this.legN%(P.ак||3)===0)ZvSnd.later(140,()=>ZvSnd.play(P.а,Object.assign({maxSec:0.9,gain:0.4},pos)));
 if(Math.random()<0.03)ZvSnd.later(520,()=>ZvSnd.legVoice(M,{gain:0.6}));
 return ok;};});

/* ── 11. Особенность в седле: у каждого ездового рода своя (15.0) ──
   Прежде дар ездового зверя шёл от рода хода: все ходячие укорачивали шаг, все
   летучие поднимали на крыло — конь от лося и голема отличался лишь числами.
   Теперь у каждого из тридцати двух ездовых родов своя особенность в седле с
   именем: конь — неутомимая рысь и место во вьюке, рух — высокий круг (выше на
   крыле и видно дальше), вепрь — клыки вперёд (удар с разбега), змей — беззвучный
   ход, голем — каменная спина (втрое больше поклажи), гиппокамп — волна под
   копытом (морской путь короче). Она прибавляется к дару рода хода, называется
   при посадке и в окне маунта; голодный зверь отдаёт её вполовину. */
const ZV_RIDE150={
 roc:{n:"Высокий круг",о:"поднимает выше прочих, и сверху видно дальше",д:{крыло:1,скан:1}},
 griffin:{n:"Когти с неба",о:"бьёт с налёта вместе с вами",д:{урон:0.12}},
 wyvern:{n:"Сумеречный лёт",о:"видит в сумерках и бьёт ядовитым хвостом",д:{ночь:1,урон:0.06}},
 drake:{n:"Драконий страх",о:"твари в пути разбегаются, а удар с разбега сильнее",д:{скрытность:0.12,урон:0.1}},
 pegasus:{n:"Лёгкое крыло",о:"и по земле идёт вполлёта: дорога короче",д:{шаг:0.08}},
 skyray:{n:"Облачный путь",о:"скользит тихо и над водой",д:{скрытность:0.1,море:0.1}},
 dragonfly:{n:"Тысяча глаз",о:"видит всё вокруг: чует на две клетки дальше",д:{скан:2}},
 horse:{n:"Неутомимая рысь",о:"дорога короче, и во вьюке место ещё на одну вещь",д:{шаг:0.08,добыча:1}},
 stag:{n:"Лесная тропа",о:"идёт тихо и легко",д:{скрытность:0.1,шаг:0.04}},
 elk:{n:"Сквозь чащу",о:"ломится напрямик и несёт поклажу",д:{шаг:0.06,добыча:1}},
 wolf:{n:"Чутьё стаи",о:"чует дальше и видит ночью",д:{скан:1,ночь:1}},
 bear:{n:"Медвежья мощь",о:"удар с разбега сильнее, поклажи больше",д:{урон:0.12,добыча:1}},
 boar:{n:"Клыки вперёд",о:"врезается в тварь клыками: удар с разбега сильнее всех",д:{урон:0.15}},
 ram:{n:"Горный разбег",о:"бьёт рогами с разбега и не сбавляет шага",д:{урон:0.1,шаг:0.03}},
 aurochs:{n:"Тяжёлый вьюк",о:"несёт на две вещи больше",д:{добыча:2}},
 camel:{n:"Караванный шаг",о:"идёт долго без отдыха и несёт поклажу",д:{шаг:0.1,добыча:1}},
 lion:{n:"Царский рык",о:"твари уступают дорогу, удар с разбега сильнее",д:{скрытность:0.08,урон:0.08}},
 unicorn:{n:"Светлый рог",о:"рог светит в темноте и чует чары вокруг",д:{ночь:1,скан:1}},
 runner:{n:"Рывок бегуна",о:"быстрее коня: дорога короче всех ходячих",д:{шаг:0.12}},
 golem:{n:"Каменная спина",о:"несёт втрое больше поклажи",д:{добыча:3}},
 steed:{n:"Пружинный ход",о:"медные ноги не устают, а стрелки в груди чуют жилы",д:{шаг:0.1,скан:1}},
 beetle:{n:"Панцирь-щит",о:"несёт поклажу под панцирем и бодается",д:{добыча:1,урон:0.05}},
 spider:{n:"По стенам",о:"идёт тихо и видит в темноте",д:{скрытность:0.12,ночь:1}},
 centipede:{n:"Сотня ног",о:"быстро и неслышно стелется по земле",д:{шаг:0.06,скрытность:0.06}},
 serpent:{n:"Беззвучный ход",о:"ползёт так тихо, что встречи почти не случаются",д:{скрытность:0.18}},
 tortoise:{n:"Дом на спине",о:"на панцире помещается вдвое больше поклажи",д:{добыча:2,скрытность:0.04}},
 scorpion:{n:"Жало наготове",о:"бьёт жалом вместе с вами и видит ночью",д:{урон:0.1,ночь:1}},
 snail:{n:"Целый дом",о:"везёт целый дом поклажи и ползёт неслышно",д:{добыча:2,скрытность:0.08}},
 hippocamp:{n:"Волна под копытом",о:"морской путь короче",д:{море:0.15}},
 seaserp:{n:"Глубинный ход",о:"рассекает воду и бьёт из глубины",д:{море:0.12,урон:0.08}},
 mole:{n:"Нюх на жилы",о:"чует жилы на две клетки дальше и несёт находки",д:{скан:2,добыча:1}},
 worm:{n:"Сквозь породу",о:"идёт под землёй: чует дальше, а наверху его не слышно",д:{скан:1,скрытность:0.1}}};
function zvRide150(a){const f=a&&safeFn(()=>Zver.fam(a),null);return f&&f.ездовой?ZV_RIDE150[f.id]||null:null;}
safeFn(()=>{const g0=Zver.gift;Zver.gift=function(a,k){const v=g0.apply(this,arguments);
 const R=zvRide150(a);const t=R&&R.д[k];if(!t)return v;
 const x=((Number(a.сыт)||0)<20&&k!=="крыло"&&k!=="ночь")?t/2:t;
 if(k==="шаг"||k==="море"){const b=v==null?1:Number(v);return Math.round(Math.max(0.4,b-x)*100)/100;}
 if(k==="скрытность")return Math.round(Math.min(0.6,(Number(v)||0)+x)*100)/100;
 if(k==="урон"){const b=v==null?1:Number(v);return Math.round(Math.min(1.5,b+x)*100)/100;}
 if(k==="ночь")return 1;
 const r=Math.round((Number(v)||0)+x);return r>0?r:null;};});
/* В окне маунта и в карточке зверя особенность названа первой. */
safeFn(()=>{const w0=Zver.giftWords;Zver.giftWords=function(a){const out=w0.apply(this,arguments);const R=zvRide150(a);
 if(R&&Array.isArray(out))out.unshift(`«${R.n}» — ${R.о}`);return out;};});
/* При посадке на ездового зверя особенность звучит после слов о посадке (и тоже после звука). */
safeFn(()=>{const m0=Stable.mountUp;Stable.mountUp=function(k){const до=safeFn(()=>this.riding(),null);const t=m0.apply(this,arguments);
 if(до===k||safeFn(()=>this.riding(),null)!==k)return t;
 const M=safeFn(()=>this.mBy(k),null);const R=M&&M.kind==="zv"?zvRide150(M.a):null;if(!R)return t;
 const t2=`${t} Особенность в седле — «${R.n}»: ${R.о}.`;if(ZvLater.text===String(t))ZvLater.text=t2;return t2;};});

/* ── 12. Свои звуки у каждого рода (14.7) ──
   Просьба игрока: «делай каждому уникальные звуки». Прежде тринадцать родов били
   одним и тем же ударом когтей, пегас, конь и единорог ржали одним голосом, а у
   кошки и саламандры, у совы, летучей мыши и мотылька был общий шаг. Теперь ни
   один род не делит с другим ни голос, ни рык, ни удар, ни шаг, ни езду, ни бег:
   ворон клюёт, сова бьёт неслышно, волк смыкает челюсти, рысь режет, пегас бьёт
   порывом крыла, единорог — чарами рога, голем — каменным кулаком; кот шипит,
   выдра стрекочет, тур ревёт быком; у единорога голос с перезвоном, у пегаса —
   с шумом крыльев; у каждого копытного и бегущего свой бег. */
const ZV_UNIQ147={
 horse:{г:["zv_neigh","beasts_horse"]},pegasus:{г:["beasts_horse"],з:"sky_gust",р:["sky_gust"],у:["hit_air"],ш:["zv_wing","tread_hoof"],е:["zv_wing","zv_ride_walk"]},
 unicorn:{г:["zv_neigh"],з:"arc_chimes",р:["arc_charge"],у:["arc_hit"],ш:["tread_hoof","mtg_step_hard"],е:["zv_ride_walk","mtg_step_hard"],бег:["zv_ride_gallop","mtg_step_hard"]},
 griffin:{р:["raptor_cry","sv_beast_snarl"],у:["blade_flesh"]},lion:{р:["beasts_lion","sv_beast_roar"],у:["lug_impact"]},
 hippocamp:{г:["zv_neigh","sv_sea_song"],з:"oc_splash",р:["oc_bubble"],у:["water_spell_hit"]},dragonfly:{р:["sp_buzz"],у:["hit_arrow"]},
 stag:{у:["blade_blunt"],бег:["zv_ride_gallop","tread_grass"]},aurochs:{р:["beast_bull","brute_roar"],у:["hit_ground"],ш:["lug_land","tread_hoof"],бег:["brute_step","lug_land"]},
 fox:{р:["lug_bark"],у:["w_v_knife_hit"]},cat:{р:["oc_pshsh"],у:["lug_knife_slice"],ш:["lug_step_snow"]},otter:{р:["sv2_chitter"]},
 runner:{р:["raptor_cry","zm_chitter"],у:["battle_stab"]},tortoise:{р:["zm_breath"]},seaserp:{р:["zm_growl_wet","stk_deepsea"]},worm:{р:["zm_chew"]},
 mole:{р:["sv2_crypt_rat"],у:["mtg_crumble"]},roc:{у:["lug_whoosh_hit","gale_hit"]},raven:{у:["hit_knife"],ш:["lug_whoosh"]},owl:{у:["blade_swing_cut"],ш:["oc_rustle"]},
 hawk:{у:["w_v_stiletto_hit"]},wolf:{у:["es_crunch"]},lynx:{у:["blade_dagger"]},lizard:{у:["w_v_thin_hit"]},badger:{у:["lug_claw"]},
 wyvern:{у:["blade_spear"]},elk:{у:["oc_wood_hit"],бег:["zv_ride_trot","mtg_step_dirt"]},camel:{у:["stomp"],бег:["zv_ride_trot","tread_sand"]},
 ram:{у:["oc_wood_dull"],бег:["zv_ride_trot","mtg_step_gravel"]},boar:{у:["battle_pike"]},golem:{у:["golem_hit"]},beetle:{у:["oc_metal_dull"],ш:["oc_metal_light","prop_crawl"],е:["prop_crawl","oc_metal_light"]},
 moth:{ш:["sp_hum"]},scorpion:{ш:["mtg_step_sand","creatures/cr_spider_step.flac"]},centipede:{е:["prop_crawl","mtg_step_sand"]}};
for(const [k,v] of Object.entries(ZV_UNIQ147))if(ZV_SND[k])Object.assign(ZV_SND[k],v);

/* ── 13. Свои звуки способностей (14.7) ──
   Три пары способностей звучали одинаково (рык грифона и рык льва, хватка ястреба
   и волка, когти рыси и кошки), а пять прыжков и пять ударов когтей начинались одним
   взмахом. Теперь у каждой способности свой набор: грифон кричит орлом и шипит,
   ястреб бьёт стилетом когтя после крика, волк — рык и хруст челюстей, рысь режет
   кинжалом, кошка шипит; прыжки — с приземлением, порывом, скольжением. */
const ZV_ABILSND147={
 griffin:{"Когти грифона":[["blade_flesh"],["lug_claw"]],"Львиный рык":[["raptor_cry"],["sv_beast_snarl"]],"Пике с небес":[["sky_gust"],["lug_whoosh"],["raptor_cry"]]},
 hawk:{"Когти-крючья":[["bird_hawk"],["w_v_stiletto_hit"]]},
 wolf:{"Стайная хватка":[["sv_wolf_snarl"],["es_crunch"]]},
 lynx:{"Прыжок рыси":[["lug_land"],["blade_dagger"]],"Рваные раны":[["blade_dagger"],["blade_flesh"]]},
 cat:{"Когти-бритвы":[["oc_pshsh"],["lug_knife_slice"]]},
 roc:{"Камень с высоты":[["sky_gust"],["oc_rockfall","mtg_stone_hit"]]},
 lion:{"Прыжок на холку":[["brute_step"],["lug_impact"],["lug_flesh"]]},
 fox:{"Обманный выпад":[["sv_slip"],["w_v_knife_hit"]]},
 runner:{"Отвлекающий бросок":[["mtg_step_hard"],["hit_knife"],["sv_snake"]]},
 raven:{"Клевок в глаз":[["hit_knife"],["crow"]]},
 scorpion:{"Клешни":[["oc_trap_mech"],["lug_claw"]]},
 pegasus:{"Светлое копыто":[["arc_shine"],["heal_bloom"],["tread_hoof"]],"Небесный свет":[["sky_gust"],["spell_light"],["arc_shine"]]},
 stag:{"Олений скачок":[["lug_land"],["tread_grass"]]},
 ram:{"Разбег":[["mtg_step_gravel"],["lug_impact"]]},
 unicorn:{"Очищение":[["od_heal"],["spell_light"]]}};
for(const [fam,m] of Object.entries(ZV_ABILSND147))for(const x of (ZV_ABIL150[fam]||[]))if(m[x.n])x.зв=m[x.n];
