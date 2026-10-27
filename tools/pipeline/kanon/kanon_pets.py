"""kanon_pets.py — питомцы и скакуны канона как звери «Грани Миров» (18.0).

Каждый из 68 — свой род (ZV_FAMILY_BY_ID) с одной породой: характеристики, корм, роли и ход из канона;
три способности (с 1-го, 6-го и 12-го уровня) со своими звуками; свой набор звуков голоса, рыка, удара,
шага, езды и бега — ни у кого не повторяется (ни с 46 родами игры, ни между собой); дары в пути — по месту
и поре; особые дела (находки, чутьё, заслон, лечение) — их исполняет модуль kanon180_late.js.
  build(canon) → (список записей, ошибки)."""
import hashlib, json, re

Т = {  # пулы звуков по типу звучания: голос, рык, удар, шаг, езда, бег
 "hearth": dict(г=["wild_hearth","zv_purr","sv_rat_growl","oc_cracker"], р=["sv_rat_growl","oc_pshsh","lug_snarl"], у=["oc_wood_dull","lug_thud","oc_soft_hit"], ш=["tread_wood","mtg_step_wood","oc_step_soft"]),
 "weasel": dict(г=["oc_rustle","sv2_chitter","zm_laugh_small","oc_bat_noise"], р=["lug_snarl","sv2_chitter","zm_chitter"], у=["lug_knife_slice","blade_dagger","hit_knife"], ш=["zv_paw_light","oc_rustle","zv_paw_soft"]),
 "draft": dict(г=["beasts_horse","oc_cattle_snort","zv_neigh"], р=["oc_cattle_snort","brute_roar","beasts_cattle"], у=["zv_hoof_heavy","lug_impact","lug_thud"], ш=["zv_hoof_heavy","horse_step","mtg_cart"], е=["zv_ride_walk","mtg_cart","zv_hoof_heavy"], бег=["zv_ride_trot","zv_hoof_heavy","zv_ride_gallop"]),
 "wolf": dict(г=["wolf_howl","sv_wolf_snarl","zm_growl","sv_were_growl"], р=["sv_were_growl","lug_growl","zm_growl","sv_wolf_snarl"], у=["es_crunch","lug_flesh","blade_flesh"], ш=["zv_paw_walk","zv_paw_run","zv_paw_ash","tread_grass"], е=["zv_paw_run","zv_paw_walk","lug_bush","tread_grass"], бег=["zv_paw_run","zv_paw_trot","lug_bush"]),
 "salamander": dict(г=["ash_crackle","oc_sizzle","mtg_lava","oc_inflame"], р=["mtg_lava","oc_pshsh","oc_sizzle"], у=["oc_fireball","ash_crackle","oc_sizzle"], ш=["prop_crawl","zv_claw_step","mtg_step_hard"]),
 "goblin": dict(г=["zm_laugh_small","oc_bat_noise","prop_coins","foe_goblin_pain"], р=["foe_goblin_hit","zm_laugh","foe_goblin_cast"], у=["lug_knife_slice","hit_knife","oc_grab"], ш=["zv_paw_light","oc_step_soft","mtg_step_dirt"]),
 "lizard": dict(г=["sv_snake","zm_breath","zm_growl_wet","sv_lamia"], р=["sv_snake","zm_growl_wet","sv_serpent"], у=["lug_claw","foe_burrow_hit","es_crunch"], ш=["prop_crawl","zv_claw_step","mtg_crumble","zv_paw_sand"], е=["prop_crawl","mtg_crumble","zv_claw_step"], бег=["zv_claw_step","mtg_crumble","zv_paw_sand"]),
 "seal": dict(г=["oc_cattle_snort","oc_splash","oc_bubble","sv_sea_song"], р=["oc_cattle_snort","oc_bubble"], у=["lug_splatter","oc_splash","oc_organic_hit"], ш=["oc_splash","mtg_step_water","oc_swim"], е=["oc_swim","oc_splash","mtg_step_water"], бег=["oc_swim","oc_splash","oc_dive"]),
 "spiritfox": dict(г=["chant_ether","arc_chimes","oc_dog_whine","zm_laugh"], р=["zm_laugh","arc_rise","chant_ether"], у=["oc_zap","arc_hit"], ш=["zv_paw_light","oc_rustle","zv_paw_soft"]),
 "bug": dict(г=["oc_metal_light","sv2_chitter","stk_clock","zm_chitter"], р=["oc_trap_mech","zm_chitter","sv2_chitter"], у=["lug_claw","oc_metal_light","oc_trap_mech"], ш=["zv_claw_step","mtg_step_metal","prop_crawl"]),
 "stormelk": dict(г=["brute_roar","oc_zap","oc_thunder","oc_electrical"], р=["oc_thunder","brute_roar"], у=["oc_zap","lug_impact"], ш=["zv_hoof_heavy","tread_grass","zv_hoof_light"], е=["zv_hoof_heavy","oc_electrical","zv_ride_walk"], бег=["zv_ride_gallop","oc_thunder","zv_hoof_heavy"]),
 "climber": dict(г=["wild_owl","lug_bush","oc_rustle","oc_chirp"], р=["lug_bush","oc_tree_crack"], у=["lug_claw","oc_wood_hit"], ш=["lug_bush","oc_rustle","tread_wood"], е=["lug_bush","oc_rustle","oc_tree_crack"], бег=["lug_bush","oc_rustle","oc_tree_crack"]),
 "bird": dict(г=["oc_chirp","wild_birds","wild_raven","crow","bird_owl","wild_owl","prop_pigeon","bird_rooster"], р=["raptor_cry","bird_hawk","crow","wild_raven"], у=["hit_knife","lug_claw","lug_whoosh_hit"], ш=["zv_wing","oc_bat_flutter","raptor_wing","prop_pigeon"], е=["raptor_wing","wyrm_wing","zv_wing","sky_gust"], бег=["sky_gust","wyrm_wing","raptor_wing"]),
 "cat": dict(г=["zv_purr","sv_beast_snarl","lug_snarl","oc_growl","oc_pshsh"], р=["sv_beast_snarl","lug_snarl","oc_pshsh","sv_beast_roar"], у=["lug_claw","blade_dagger","lug_knife_slice"], ш=["zv_paw_soft","zv_paw_light","zv_paw_walk","zv_paw_heavy"]),
 "horse": dict(г=["zv_neigh","beasts_horse","oc_cattle_snort"], р=["oc_cattle_snort","beasts_horse","zv_neigh"], у=["tread_hoof","zv_hoof_stone","lug_thud"], ш=["horse_step","zv_hoof_light","tread_hoof","zv_hoof_stone"], е=["zv_ride_walk","zv_ride_trot","tread_hoof","zv_hoof_light"], бег=["zv_ride_gallop","zv_ride_trot","tread_hoof"]),
 "goat": dict(г=["zv_bleat","beasts_sheep"], р=["zv_bleat","oc_cattle_snort","beasts_sheep"], у=["lug_impact","zv_hoof_stone"], ш=["zv_hoof_stone","zv_hoof_cloven","tread_gravel"], е=["zv_hoof_stone","mtg_step_gravel","zv_hoof_cloven"], бег=["zv_hoof_light","zv_ride_trot","zv_hoof_stone"]),
 "amphib": dict(г=["sv_frog","oc_splash","oc_bubble"], р=["sv_frog","zm_chew"], у=["lug_splatter","oc_organic_hit"], ш=["mtg_step_water","oc_splash","zv_hoof_wet"]),
 "crier": dict(г=["bird_rooster","zm_scream","raptor_cry"], р=["zm_scream","raptor_cry","bird_hawk"], у=["lug_claw","hit_knife"], ш=["zv_claw_step","mtg_step_dirt","zv_paw_light"]),
 "whale": dict(г=["sv_sea_song","sv_trunk","sv_siren","oc_fan"], р=["sv_trunk","arc_breath"], у=["lug_whoosh_hit","gale_hit"], ш=["oc_fan","sky_gust"], е=["oc_fan","sky_gust","oc_swim"], бег=["sky_gust","oc_fan"]),
 "sandrunner": dict(г=["es_crunch","sv_snake","zv_pant","lug_snarl"], р=["sv_snake","lug_snarl"], у=["es_crunch","lug_flesh"], ш=["zv_paw_sand","mtg_step_sand","tread_sand"], е=["tread_sand","zv_paw_sand","mtg_step_sand"], бег=["zv_paw_run","tread_sand","zv_paw_sand"]),
 "deer": dict(г=["oc_cattle_snort","chant_ether","sv_shadow"], р=["oc_cattle_snort","sv_shadow"], у=["lug_impact","tread_hoof"], ш=["zv_hoof_light","tread_grass"], е=["zv_hoof_light","oc_rustle","tread_grass"], бег=["zv_hoof_light","zv_ride_trot","oc_rustle"]),
 "imp": dict(г=["zm_laugh_small","oc_cracker","oc_sizzle","oc_inflame","ash_crackle","foe_goblin_cast"], р=["mtg_lava","oc_fireball","lug_fire"], у=["oc_fireball","ash_crackle"], ш=["zv_paw_ember","tread_gravel","mtg_step_dirt"]),
 "dog": dict(г=["zv_bark","oc_dog_bark","lug_bark","zv_pant","oc_dog_whine","oc_dog_snuff"], р=["sv_wolf_snarl","lug_growl","zm_growl","lug_bark"], у=["es_crunch","lug_flesh","blade_flesh"], ш=["zv_paw_trot","zv_paw_walk","zv_paw_run","zv_claw_step"]),
 "burrow": dict(г=["sv_rat_growl","oc_dig","zv_sniff"], р=["sv_rat_growl","foe_burrow_pain"], у=["foe_burrow_hit","lug_claw"], ш=["oc_dig","mtg_dig_gravel","zv_claw_step"], е=["mtg_dig_gravel","oc_dig","prop_crawl"], бег=["oc_dig","mtg_crumble","mtg_dig_gravel"]),
 "doll": dict(г=["oc_wood_creak","oc_hinge","oc_wood_dull","ship_creak"], р=["oc_wood_hit","oc_hinge"], у=["oc_wood_hit","lug_thud"], ш=["mtg_step_wood","tread_wood","oc_wood_dull"], е=["mtg_step_wood","oc_wood_creak","tread_wood"], бег=["tread_wood","oc_wood_hit","mtg_step_wood"]),
 "eyes": dict(г=["oc_rustle","prop_mush","sp_hum"], р=["zm_nightmare","prop_mush"], у=["oc_organic_hit","prop_mush"], ш=["oc_rustle","prop_mush"]),
 "undead": dict(г=["zm_bone","sv2_crypt_rat","foe_bone_pain","sv2_grave_growl"], р=["sv2_rise","sv2_grave_growl"], у=["foe_bone_hit","foe_grave_hit"], ш=["zm_bone","tread_hoof"], е=["tread_hoof","zm_bone"], бег=["zv_ride_gallop","zm_bone"]),
 "crab": dict(г=["lug_claw","oc_metal_light","mtg_crumble","oc_bubble"], р=["oc_trap_mech","lug_claw"], у=["lug_claw","oc_trap_mech","es_crunch"], ш=["zv_claw_step","mtg_step_sand","prop_crawl"], е=["zv_claw_step","mtg_crumble","mtg_step_sand"], бег=["zv_claw_step","mtg_step_sand","mtg_crumble"]),
 "mule": dict(г=["oc_cattle_snort","bell_small","zv_bleat"], р=["oc_cattle_snort","bell_small"], у=["zv_hoof_stone","lug_thud"], ш=["zv_hoof_stone","tread_hoof"], е=["zv_ride_walk","bell_small","zv_hoof_stone"], бег=["zv_ride_trot","bell_small"]),
 "insect": dict(г=["zm_insect","sv2_chitter","zm_chitter","oc_mosquito","sp_buzz"], р=["sv2_swarm","zm_chitter","sv2_chitter"], у=["sv2_swarm_bite","lug_claw"], ш=["prop_crawl","zv_claw_step","oc_mosquito","sp_buzz"]),
 "glass": dict(г=["oc_glass_hit","magic_shimmer","artifact_hum","arc_chimes"], р=["crystal_shatter","mtg_glass"], у=["oc_glass_break","crystal_shatter"], ш=["mtg_step_glass","zv_paw_glass"], е=["mtg_step_glass","oc_glass_hit","zv_paw_glass"], бег=["mtg_step_glass","magic_shimmer"]),
 "stone": dict(г=["oc_rock_hit","mtg_crumble","es_crunch","mtg_rubble"], р=["brute_roar","oc_rockfall","mtg_rubble"], у=["lug_impact","mtg_stone_hit","oc_rock_hit"], ш=["brute_step","mtg_step_hard","lug_step_stone"], е=["brute_step","mtg_step_hard","oc_rock_hit"], бег=["brute_step","oc_quake"]),
 "bovine": dict(г=["zv_moo","beasts_cattle","oc_cattle_snort","sv_trunk"], р=["beasts_cattle","brute_roar"], у=["lug_impact","zv_hoof_heavy","brute_step"], ш=["zv_hoof_heavy","brute_step","zv_hoof_cloven"], е=["zv_hoof_heavy","brute_step","zv_ride_walk"], бег=["zv_ride_trot","zv_hoof_heavy","brute_step"]),
 "elk": dict(г=["oc_cattle_snort","brute_roar","zv_moo"], р=["brute_roar","oc_cattle_snort"], у=["lug_impact","zv_hoof_heavy"], ш=["zv_hoof_heavy","oc_tree_crack","tread_grass"], е=["zv_hoof_heavy","lug_bush","tread_grass"], бег=["zv_ride_trot","lug_bush","zv_hoof_heavy"]),
 "tree": dict(г=["oc_tree_crack","oc_wood_creak","ship_creak","oc_rustle"], р=["oc_tree_fall","oc_tree_crack"], у=["oc_wood_hit","lug_impact"], ш=["oc_tree_crack","oc_wood_dull"], е=["oc_wood_creak","lug_bush","oc_wood_dull"], бег=["oc_tree_crack","oc_wood_creak"]),
 "skyray": dict(г=["oc_fan","sp_hum","sv_shadow"], р=["arc_rise","sv_shadow"], у=["oc_zap","lug_whoosh_hit"], ш=["oc_fan","sv_slip"], е=["oc_fan","sv_slip","sky_gust"], бег=["sky_gust","sv_slip","oc_fan"]),
 "jelly": dict(г=["sp_hum","oc_fan","magic_hum"], р=["arc_rise","magic_hum"], у=["oc_zap","arc_hit"], ш=["oc_fan","magic_hum"], е=["oc_fan","magic_hum","sky_gust"], бег=["sky_gust","oc_fan"]),
}
# способности 2-я и 3-я — по типу (название, действие)
ТА = {
 "hearth":[("Подножка из-под лавки","stun"),("Тёплый бок","ward")], "weasel":[("Укус в жилу","bleed"),("Тень в траве","dodge")],
 "draft":[("Грудью на тварь","taunt"),("Копыто в подкове","crit")], "wolf":[("Волчья хватка","bleed"),("Вой из чащи","fear")],
 "salamander":[("Каменная шкурка","ward"),("Жар горна","weaken")], "goblin":[("Удар исподтишка","crit"),("Шмыг в сторону","dodge")],
 "lizard":[("Броня из плит","ward"),("Хват челюстями","bleed")], "seal":[("Скользкий бок","dodge"),("Нырок с ударом","crit")],
 "spiritfox":[("Огонёк-обманка","blind"),("Дух-хранитель","ward")], "bug":[("Клешнёй по броне","break"),("Панцирный щиток","ward")],
 "stormelk":[("Грозовой топот","quake"),("Рога вожака","bleed")], "climber":[("Лиана-петля","snare"),("Прыжок с ветки","double")],
 "bird":[("Крыло в глаза","blind"),("Клевок сверху","crit")], "cat":[("Когти наотмашь","bleed"),("Кошачий увёрт","dodge")],
 "horse":[("Удар с наскока","crit"),("Встать на дыбы","fear")], "goat":[("Боднуть с разбега","crit"),("Упереться рогами","taunt")],
 "amphib":[("Липкий язык","snare"),("Кожный яд","weaken")], "crier":[("Клевок в колено","bleed"),("Хлопанье крыльев","dodge")],
 "whale":[("Хвост по ветру","stun"),("Песня глубин","heal")], "sandrunner":[("Щелчок зубов","bleed"),("Песок в глаза","blind")],
 "deer":[("Скачок в туман","dodge"),("Рога вестника","bleed")], "imp":[("Шипение искр","blind"),("Мелкая пакость","weaken")],
 "dog":[("Рывок за горло","bleed"),("Сторожевой лай","fear")], "burrow":[("Подкоп под ноги","snare"),("Укрытие в норе","selfheal")],
 "doll":[("Деревянный кулак","stun"),("Шарнирный уворот","dodge")], "eyes":[("Слепящий взгляд","blind"),("Стебельки-путы","snare")],
 "undead":[("Холод могилы","weaken"),("Костяной удар","break")], "crab":[("Клешня-тиски","snare"),("Панцирь вперёд","ward")],
 "mule":[("Упрямство","taunt"),("Копыто назад","crit")], "insect":[("Жужжащий рой","blind"),("Жвала","bleed")],
 "glass":[("Звон стекла","fear"),("Стеклянная грань","ward")], "stone":[("Каменная ступня","quake"),("Осыпь","break")],
 "bovine":[("Рогом снизу","crit"),("Тяжкий шаг","quake")], "elk":[("Ломать подлесок","break"),("Лосиный скачок","dodge")],
 "tree":[("Ветви-плети","double"),("Смола на раны","selfheal")], "skyray":[("Волнистый край","dodge"),("Удар хвостом","stun")],
 "jelly":[("Студёный купол","ward"),("Длинные нити","snare")],
}
ОБЩИЙ = {  # запас по ролям: им дополняется набор, когда свои сочетания заняты
 "у": ["lug_claw","lug_flesh","blade_flesh","es_crunch","lug_thud","lug_impact","oc_organic_hit","oc_projectile_hit","lug_whoosh_hit","hit_knife","blade_dagger",
       "lug_knife_slice","oc_general_hit","foe_brute_hit","foe_burrow_hit","foe_bone_hit","lug_splatter","oc_wood_hit","mtg_stone_hit","oc_rock_hit","gale_hit","oc_grab"],
 "р": ["lug_growl","lug_snarl","oc_growl","sv_beast_snarl","brute_roar","zm_growl","sv_rat_growl","oc_cattle_snort","sv_snake","oc_pshsh"],
 "г": ["oc_cattle_snort","zv_sniff","oc_rustle","oc_growl","lug_growl"],
 "бег": ["zv_ride_trot","zv_ride_gallop","tread_hoof","zv_hoof_light","zv_hoof_stone","zv_paw_run","sky_gust","lug_bush"],
 "е": ["zv_ride_walk","tread_hoof","zv_hoof_light","zv_hoof_stone","zv_hoof_heavy","lug_bush"],
 "ш": ["zv_paw_walk","zv_paw_soft","zv_claw_step","mtg_step_dirt","tread_grass","oc_step_soft"]}

ТА.update({
 "dog":[("Рывок за горло","bleed"),("Сторожевой лай","fear"),("Мёртвая хватка","crit"),("Прыжок на грудь","stun"),("Цепкие зубы","snare"),("Злой рык","weaken"),
        ("Трепка","double"),("Отскок","dodge"),("Нюх на слабину","mark"),("Лай-набат","taunt"),("Зализать рану","selfheal"),("Клыки в загривок","break")],
 "cat":[("Когти наотмашь","bleed"),("Кошачий увёрт","dodge"),("Прыжок на спину","crit"),("Шерсть дыбом","fear"),("Лапой по глазам","blind"),("Двойной взмах","double"),
        ("Мягкая засада","mark"),("Шипение в морду","weaken"),("Вылизаться","selfheal"),("Хватка за холку","snare"),("Коготь в щель","break"),("Удар хвостом","stun")],
 "horse":[("Удар с наскока","crit"),("Встать на дыбы","fear"),("Задние копыта","stun"),("Укус коня","bleed"),("Боковой скок","dodge"),("Грудью в строй","taunt"),
          ("Топот в упор","quake"),("Разбег по прямой","double"),("Храп в лицо","weaken"),("Копыто по щиту","break"),("Чуткое ухо","mark"),("Тёплый бок коня","ward"),
          ("Галоп сквозь","double"),("Вздыбленная грива","fear")],
 "bird":[("Крыло в глаза","blind"),("Клевок сверху","crit"),("Когти с налёта","bleed"),("Свечой вверх","dodge"),("Крик над ухом","fear"),("Бить крыльями","double"),
         ("Высмотреть слабину","mark"),("Перья-обманка","weaken"),("Камнем вниз","stun"),("Хватка лапами","snare")],
 "insect":[("Жужжащий рой","blind"),("Жвала","bleed"),("Липкая нить","snare"),("Мельтешение","dodge"),("Жало в шов","break"),("Гул над ухом","weaken"),("Укус-искра","stun"),("Пыль с крыл","fear")],
 "burrow":[("Подкоп под ноги","snare"),("Укрытие в норе","selfheal"),("Когти копателя","bleed"),("Ком земли","blind")],
 "imp":[("Шипение искр","blind"),("Мелкая пакость","weaken"),("Укус с подскока","bleed"),("Прыг за спину","dodge")],
 "doll":[("Деревянный кулак","stun"),("Шарнирный уворот","dodge"),("Нитки-путы","snare"),("Двойной стук","double")],
 "crab":[("Клешня-тиски","snare"),("Панцирь вперёд","ward"),("Боковой щипок","bleed"),("Пена в глаза","blind")],
 "lizard":[("Броня из плит","ward"),("Хват челюстями","bleed"),("Хвост наотмашь","stun"),("Каменный рёв","fear")],
 "wolf":[("Волчья хватка","bleed"),("Вой из чащи","fear"),("Рвать с ходу","double"),("Обход со спины","crit")],
 "bovine":[("Рогом снизу","crit"),("Тяжкий шаг","quake"),("Поддеть на рога","stun"),("Стена из боков","taunt")],
 "sandrunner":[("Щелчок зубов","bleed"),("Песок в глаза","blind"),("Отскок по дюне","dodge"),("Удар ногой","crit")]})

for _t, _add in {"bug":[("Звонкий панцирь","ward"),("Тиканье-обманка","dodge"),("Ржавая стружка","blind")],
                 "crab":[("Солёный панцирь","ward"),("Бочком в сторону","dodge"),("Клешнёй по щиту","break")],
                 "burrow":[("Земляной вал","ward"),("Нора-ловушка","snare"),("Шорох под ногами","fear"),("Броня копателя","taunt")],
                 "insect":[("Мерцание крыл","dodge"),("Звон над полем","fear"),("Хитиновый наруч","ward")],
                 "bovine":[("Плечом в бок","stun"),("Мерный звон","weaken"),("Широкая грудь","taunt"),("Ярмо силы","crit")]}.items():
    ТА[_t] = ТА[_t] + _add

ЭФ_ЗВ = {"stun":["lug_thud","lug_impact","mtg_stone_hit"], "bleed":["blade_flesh","lug_flesh","lug_knife_slice"], "poison":["oc_res_venom","oc_trap_poison","sv2_drain"],
 "burn":["oc_fireball","ash_crackle","mtg_lava"], "fear":["sv_beast_roar","brute_roar","sv2_wail","zm_scream"], "heal":["heal_bloom","od_heal","arc_chimes"],
 "crit":["blade_dagger","lug_flesh","w_v_ring_hit"], "double":["lug_whoosh_hit","lug_whoosh","oc_swing"], "dodge":["sv_slip","lug_whoosh","lug_land"],
 "mark":["oc_find_track","oc_find_listen","zv_sniff"], "blind":["arc_shine","spell_light","magic_shimmer"], "weaken":["sv2_drain","zm_breath","magic_hum"],
 "break":["oc_trap_mech","mtg_stone_hit","oc_shield_metal"], "ward":["spell_ward","cast_shield","oc_shield_block","arc_shine"], "taunt":["gear_guard_thud","oc_shield_wood","lug_growl"],
 "snare":["oc_trap_living","oc_line_snap","sv_trap_coil"], "selfheal":["od_heal","heal_bloom","zv_purr"], "quake":["oc_quake","oc_earthquake","brute_step"],
 "cleanse":["od_heal","spell_light"], "lifesteal":["sv2_drain","zm_breath"]}

# имя: тип, свои звуки по ролям, первая способность, дары [(ключ, прибавка, пора/место)], особые дела, где водится, с какого уровня приручить
P = {
 "Очажный домовёнок": ("hearth", {}, ("Тёплая ладошка","heal",0.25), [("скан",1,None)], ["лечит_час:1","будит"], ["plains","forest","road"], 1),
 "Ночная ласка Безлунной": ("weasel", {}, ("Бросок из тьмы","crit",0.22), [("ночь",1,None),("скрытность",0.15,"ночь")], ["тайник_ночь"], ["forest","swamp"], 3),
 "Острожный тяжеловоз": ("draft", {}, ("Тяжёлое копыто","stun",0.15), [("добыча",2,None),("стойк",3,None)], ["часть_удара:0.1"], ["plains","road"], 4),
 "Седой волк Подлеска": ("wolf", {}, ("Лесная засада","crit",0.2), [("шаг",0.25,"лес"),("скрытность",0.2,"лес")], ["стая"], ["forest"], 6),
 "Рудная саламандра": ("salamander", {}, ("Плевок жаром","burn",0.22), [("скан",2,"пещера")], ["жила"], ["cave","mountains"], 4),
 "Гоблинский шнырь": ("goblin", {}, ("Подножка","stun",0.15), [("добыча",1,None)], ["ловушки","детали"], ["cave","road"], 2),
 "Каменный ящер-тягач": ("lizard", {"г":["sv_snake"]}, ("Каменный хвост","stun",0.16), [("шаг",0.2,"пещера"),("добыча",2,"пещера")], ["завал"], ["cave","mountains"], 6),
 "Прибойный конь-нерпа": ("seal", {}, ("Удар ластами","stun",0.14), [("море",0.35,None)], [], ["coast"], 5),
 "Дух-лисёнок бубна": ("spiritfox", {}, ("Духовная роса","heal",0.25), [], ["усиления_дольше","лечит_час:1"], ["plains","forest"], 3),
 "Ржавый жучок-собиратель": ("bug", {}, ("Ржавая клешня","break",0.15), [], ["части"], ["cave","road"], 2),
 "Грозовой лось-вожак": ("stormelk", {}, ("Разряд рогов","stun",0.18), [("шаг",0.35,"гроза"),("шаг",0.1,"степь")], ["чует_нечисть"], ["plains"], 8),
 "Лиановый древолаз": ("climber", {}, ("Удар сверху","crit",0.2), [("скрытность",0.25,"лес"),("шаг",0.15,"лес")], ["чует_засаду"], ["forest","swamp"], 5),
 "Вещая галка": ("bird", {"г":["crow","oc_chirp"]}, ("Клевок в темя","blind",0.16), [("скан",1,None)], ["весть"], ["plains","road"], 1),
 "Подвальный кот-оберег": ("cat", {"г":["zv_purr","oc_pshsh"]}, ("Шипение на нечисть","fear",0.2), [], ["чует_нечисть"], ["road","plains"], 2),
 "Посольский иноходец": ("horse", {"е":["zv_ride_walk","gear_guard_mail"]}, ("Ровный удар","stun",0.12), [("шаг",0.25,"дорога")], ["без_пошлины"], ["road"], 5),
 "Мостовой козёл-скалолаз": ("goat", {}, ("Рога в бок","stun",0.15), [("шаг",0.2,"горы"),("шаг",0.15,"город")], ["без_пошлины"], ["mountains"], 4),
 "Горькая жаба травника": ("amphib", {}, ("Горькая слизь","poison",0.2), [], ["снять_яд","коренья"], ["swamp"], 2),
 "Боевой крикун арены": ("crier", {}, ("Боевой крик","fear",0.25), [], ["промах_первого"], ["plains","road"], 3),
 "Облачный кит-малютка": ("whale", {}, ("Гул колокола","weaken",0.16), [("добыча",3,None),("крыло",2,None),("шаг",-0.1,None)], [], ["mountains","coast"], 10),
 "Песчаный бегун арены": ("sandrunner", {}, ("Рывок по песку","double",0.2), [("шаг",0.35,"пустыня")], ["первый_удар"], ["desert"], 6),
 "Сумеречный кот-двуглаз": ("cat", {"г":["oc_growl","zv_purr"]}, ("Двойной взгляд","mark",0.18), [], ["чует_морок"], ["forest","road"], 3),
 "Счастливая сорока": ("bird", {"г":["oc_chirp","prop_coins"]}, ("Блестящая обманка","dodge",0.2), [], ["удача","монета"], ["plains","forest"], 2),
 "Боевой мерин наёмника": ("horse", {"г":["oc_cattle_snort"]}, ("Грудью вперёд","stun",0.14), [("стойк",2,None)], ["часть_удара:0.2"], ["road","plains"], 6),
 "Сумеречный олень-вестник": ("deer", {}, ("Туманный рог","blind",0.15), [("шаг",0.35,"сумерки"),("скрытность",0.2,"сумерки")], ["чует_морок"], ["forest","plains"], 7),
 "Мелкий бес-прислужник": ("imp", {}, ("Уголь в лицо","burn",0.2), [], ["монета"], ["cave","desert"], 3),
 "Колокольный щенок ордена": ("dog", {"г":["bell_small","zv_bark"]}, ("Звон по бесам","fear",0.2), [], ["чует_бесов"], ["road","plains"], 3),
 "Огнегривый конь преисподней": ("horse", {"г":["beasts_horse","mtg_fire"],"е":["zv_hoof_ash","tread_hoof"],"бег":["zv_ride_gallop","mtg_fire"]}, ("Огненная грива","burn",0.22), [("шаг",0.15,None),("урон",0.15,None)], ["бегство"], ["desert","mountains"], 10),
 "Серный ползун": ("burrow", {"г":["oc_sizzle","mtg_crumble"]}, ("Серный выдох","poison",0.18), [("скан",2,"пещера")], ["роет"], ["cave"], 7),
 "Кукла-подмастерье": ("doll", {}, ("Деревянный щит","ward",0.2), [], ["заслон1"], ["road"], 2),
 "Волчонок полнолуния": ("dog", {"г":["oc_dog_whine","wolf_howl"]}, ("Лунная хватка","bleed",0.2), [], ["сила_полнолуние","чует_морок"], ["forest"], 3),
 "Серый волк-оборотень": ("wolf", {"г":["sv_were_growl"]}, ("Хватка оборотня","bleed",0.2), [("шаг",0.35,"ночь"),("шаг",-0.05,None)], [], ["forest","plains"], 8),
 "Ходули-кукла": ("doll", {}, ("Удар ходулей","stun",0.12), [("шаг",0.2,"болото")], [], ["swamp"], 5),
 "Костяной котёнок": ("cat", {"г":["zv_purr","zm_bone"]}, ("Костяной коготь","bleed",0.18), [], ["чует_нечисть"], ["swamp","road"], 3),
 "Ручной многоглаз": ("eyes", {}, ("Сотня глаз","mark",0.2), [("скан",2,None)], ["чует_засаду"], ["swamp","cave"], 4),
 "Приручённый камнежор": ("lizard", {"г":["mtg_crumble","zm_growl_wet"]}, ("Каменный укус","break",0.16), [("шаг",0.15,"горы"),("добыча",2,None)], ["самоцвет"], ["mountains"], 8),
 "Мёртвый жеребец Погоста": ("undead", {}, ("Мёртвый топот","fear",0.18), [("шаг",0.2,"ночь")], ["нежить_мимо"], ["swamp","plains"], 8),
 "Звонкий сычонок": ("bird", {"г":["bird_owl","oc_bat_noise"]}, ("Звенящий крик","stun",0.12), [], ["будит"], ["forest"], 2),
 "Угольный бесёнок": ("imp", {"г":["oc_cracker","wild_fire"]}, ("Тёплый уголёк","heal",0.2), [], ["тепло","лечит_час:1"], ["cave","mountains"], 3),
 "Соляной рак-тяжеловоз": ("crab", {}, ("Солёная клешня","bleed",0.15), [("стойк",3,None),("море",0.2,None)], ["стихии_слабее"], ["coast"], 7),
 "Звонарский мул": ("mule", {}, ("Удар задом","stun",0.14), [("шаг",0.1,None),("скан",1,"ночь")], ["чует_морок"], ["road","mountains"], 4),
 "Стеклянный светлячок": ("insect", {"г":["magic_shimmer","oc_mosquito"]}, ("Слепящий отблеск","blind",0.18), [("скан",3,None)], ["тайник"], ["forest","swamp"], 3),
 "Волкодав-переросток": ("dog", {"г":["wolf_howl","zm_growl"]}, ("Хватка волкодава","bleed",0.2), [], ["пугает_слабых"], ["plains","road"], 5),
 "Долгоногий бегунец": ("sandrunner", {"г":["wild_birds"]}, ("Пинок долгонога","stun",0.13), [("шаг",0.2,"пустыня"),("шаг",0.2,"степь")], ["вода"], ["desert","plains"], 5),
 "Стеклянный конь-страж": ("glass", {}, ("Стеклянный рог","crit",0.15), [("стойк",3,None),("добыча",1,None)], [], ["mountains","desert"], 9),
 "Голем-подмастерье": ("stone", {}, ("Каменная ладонь","taunt",0.18), [], ["починка"], ["mountains","cave"], 5),
 "Ручной щебёнок": ("crab", {"г":["mtg_crumble","oc_rock_hit"]}, ("Щипок","bleed",0.15), [("скан",1,"пещера")], ["самоцвет"], ["cave","coast"], 3),
 "Рудничный пони": ("horse", {"ш":["zv_hoof_stone","mtg_step_hard"]}, ("Упрямый толчок","stun",0.12), [("добыча",2,None),("шаг",0.15,"пещера")], [], ["cave","mountains"], 2),
 "Скальный бык-рогач": ("bovine", {}, ("Таран рогача","stun",0.2), [("урон",0.25,None)], ["завал"], ["mountains"], 8),
 "Светлая гончая": ("dog", {"г":["zv_bark","oc_metal_light"]}, ("Светлая хватка","bleed",0.2), [("скан",2,None)], ["чует_морок"], ["plains","road"], 5),
 "Струнный сверчок": ("insect", {"г":["kn_str_pluck","zm_insect"]}, ("Песня в лад","heal",0.2), [], ["усиления_дольше"], ["plains","forest"], 2),
 "Дружинный тяжеловес": ("horse", {"г":["gear_guard_mail","beasts_horse"],"ш":["zv_hoof_heavy","horse_step"]}, ("Строевой удар","stun",0.15), [("стойк",2,None)], ["часть_удара:0.1","чует_морок"], ["road","plains"], 6),
 "Изнаночный скат": ("skyray", {}, ("Изнаночная тень","fear",0.18), [("крыло",2,None),("скрытность",0.25,"сумерки")], [], ["mountains","plains"], 9),
 "Барсучонок-копатель": ("burrow", {}, ("Острые когти","bleed",0.16), [], ["коренья"], ["forest"], 2),
 "Безглазый рысёнок": ("cat", {"г":["oc_growl","zv_paw_soft"]}, ("Прыжок на звук","crit",0.22), [], ["чует_засаду","чует_морок"], ["forest","mountains"], 5),
 "Лосиха-лесовуха": ("elk", {}, ("Удар лосихи","stun",0.15), [("шаг",0.25,"лес"),("шаг",0.25,"болото")], [], ["forest","swamp"], 5),
 "Корневой ходун": ("tree", {}, ("Корни-путы","snare",0.18), [("стойк",4,None),("шаг",-0.1,None)], ["лечит_час:2"], ["forest"], 12),
 "Ворон-перебежчик": ("bird", {"г":["crow","zm_whisper"]}, ("Клюв доносчика","mark",0.18), [], ["весть"], ["road","plains"], 3),
 "Щенок каменного пса": ("dog", {"г":["oc_rock_hit","zv_bark"]}, ("Каменные челюсти","taunt",0.18), [("стойк",3,None)], ["сторож"], ["mountains"], 4),
 "Гербовый иноходец": ("horse", {"г":["zv_neigh","oc_cattle_snort"],"е":["zv_ride_walk","zv_hoof_light"]}, ("Парадный удар","stun",0.1), [("шаг",0.2,"город"),("шаг",0.1,"дорога")], ["без_пошлины"], ["road"], 6),
 "Грифон Сокольского дома": ("bird", {"г":["raptor_cry","sv_beast_snarl"],"е":["raptor_wing","wyrm_wing"]}, ("Когти герба","bleed",0.2), [("крыло",3,None),("урон",0.15,None)], [], ["mountains"], 14),
 "Ручной трутень": ("insect", {"г":["sp_buzz","artifact_hum"]}, ("Кристальное жало","poison",0.16), [], ["ядро"], ["cave","mountains"], 4),
 "Пустотный щенок": ("dog", {"г":["sv_slip","oc_warp"]}, ("Удар из складки","dodge",0.22), [], ["чует_морок"], ["plains","mountains"], 7),
 "Большая ветрянка": ("jelly", {}, ("Жгучие щупальца","poison",0.18), [("крыло",2,None),("шаг",-0.05,None),("добыча",1,None)], [], ["mountains","coast"], 8),
 "Подгородний броненосец": ("burrow", {"г":["oc_metal_dull","sv_rat_growl"]}, ("Броня в шар","ward",0.2), [("стойк",3,None)], ["ловушки","роет"], ["cave","plains"], 6),
 "Ручная эфирная моль": ("insect", {"г":["oc_rustle","oc_mosquito"]}, ("Пыльца морока","blind",0.18), [], ["чует_морок"], ["forest","plains"], 3),
 "Котёнок-сросток": ("cat", {"г":["zv_purr","oc_chirp"]}, ("Двойной коготь","double",0.18), [], ["тепло"], ["plains","forest","desert"], 4),
 "Конь двух слоёв": ("horse", {"г":["sv_slip","zv_neigh"],"е":["sv_slip","tread_hoof"]}, ("Удар из слоя","dodge",0.18), [], ["сквозь"], ["plains","road"], 10),
 "Колокольный вол": ("bovine", {"г":["bell_big","zv_moo"]}, ("Колокольный удар","stun",0.15), [], ["убежище"], ["road","plains"], 6),
}
ОСОБЫЕ = {"лечит_час","будит","тайник","тайник_ночь","часть_удара","стая","жила","ловушки","детали","завал","усиления_дольше","части","чует_нечисть","чует_засаду",
          "весть","без_пошлины","снять_яд","коренья","промах_первого","первый_удар","чует_морок","удача","монета","чует_бесов","бегство","роет","заслон1",
          "сила_полнолуние","нежить_мимо","самоцвет","тепло","стихии_слабее","вода","пугает_слабых","починка","сторож","ядро","убежище","сквозь"}
ДАРЫ = {"шаг","скрытность","море","добыча","скан","крыло","ночь","урон","стойк"}
ПОРЫ = {None,"лес","степь","пустыня","горы","болото","берег","дорога","пещера","город","ночь","сумерки","гроза","полнолуние"}


def pid(name): return "kp_" + str(int(hashlib.md5(name.encode()).hexdigest(), 16) % 100000)


def build(canon, bank, used_snd, used_abil, kn_sounds, used_abil_names=(), used_sig0=()):
    ош = []; out = []
    have = set(bank) | set(kn_sounds)
    pets = [z for z in canon if z["вид"] in ("питомец", "скакун")]
    for z in pets:
        if z["имя"] not in P: ош.append(f"зверь канона «{z['имя']}» без разметки")
    for n in P:
        if not any(z["имя"] == n for z in pets): ош.append(f"разметка «{n}» без зверя в каноне")
    # уникальность звуков: по ролям — наборы, отсортированные, не повторяются
    used = {r: set(v) for r, v in used_snd.items()}
    abil_used = set(used_abil)
    тип_счёт = {}
    имена_исп = set(used_abil_names)
    used_sig = set(used_sig0)
    for z in pets:
        if z["имя"] not in P: continue
        тип, свои, а1, дары, особ, биомы, ур = P[z["имя"]]
        if тип not in Т: ош.append(f"{z['имя']}: нет типа {тип}"); continue
        пул = Т[тип]; prof = {}
        роли = ["г", "р", "у", "ш"] + (["е", "бег"] if z["ездовой"] else [])
        for r in роли:
            base = list(dict.fromkeys((свои.get(r) or []) + (пул.get(r) or (пул["ш"] if r in ("е", "бег") else []))))
            base = [x for x in base if x in have]
            for x in (свои.get(r) or []) + (пул.get(r) or []):
                if x not in have: ош.append(f"{z['имя']}: звука «{x}» нет в банке")
            cand = []
            for i in range(len(base)):
                for j in range(i + 1, len(base)): cand.append((base[i], base[j]))
            cand += [(x,) for x in base]
            for i in range(len(base)):
                for j in range(i + 1, len(base)):
                    for k in range(j + 1, len(base)): cand.append((base[i], base[j], base[k]))
            общ = [x for x in ОБЩИЙ.get(r, []) if x in have and x not in base]
            for x in base[:2]:
                for g in общ: cand.append((x, g))
            ok = None
            for c in cand:
                key = "+".join(sorted(c))
                if key not in used.setdefault(r, set()): ok = list(c); used[r].add(key); break
            if not ok: ош.append(f"{z['имя']}: роль {r} — нет свободного набора звуков")
            prof[r] = ok or base[:1]
        корм0 = z["корм"][0]
        prof["ест"] = "мясо" if корм0 in ("мясо", "рыба", "кость") else "трава"
        # высота: по размеру зверя; главный голос с высотой не повторяет ни одного рода (как требует набор 299)
        п0 = {1: 1.15, 2: 1.05, 3: 0.95, 4: 0.85}.get(int(z["р"]), 1.0)
        for шаг in (0, 0.04, -0.04, 0.08, -0.08, 0.12, -0.12, 0.16, -0.16, 0.2, -0.2):
            п = round(п0 + шаг, 2)
            if f"{prof['г'][0]}@{п}" not in used_sig: break
        used_sig.add(f"{prof['г'][0]}@{п}"); prof["п"] = п
        # способности: первая — своя, ещё две — по типу
        k = тип_счёт.get(тип, 0); тип_счёт[тип] = k + 1
        ab = [а1]
        L = [x for x in ТА[тип] if x[1] != а1[1]]
        i = 2 * k
        while len(ab) < 3 and i < 2 * k + 3 * len(L):
            n2, e2 = L[i % len(L)]; i += 1
            if n2 in имена_исп or any(e2 == x[1] for x in ab): continue
            ab.append((n2, e2, 0.15))
        while len(ab) < 3:
            n2, e2 = L[len(ab) % len(L)]; ab.append((f"{n2}: {z['род']}", e2, 0.15))
        for x in ab: имена_исп.add(x[0])
        if len(ab) < 3: ab.append(("Злость рода", "crit" if а1[1] != "crit" else "stun", 0.14))
        ab = ab[:3]; abl = []
        for (n, эф, ш), ур_ in zip(ab, (1, 6, 12)):
            голос = [x for x in prof["г"] + prof["р"] + prof["у"]]
            зэф = [x for x in ЭФ_ЗВ.get(эф, ["lug_thud"]) if x in have]
            зв = None
            for g in голос + (пул.get("у") or []):
                for e in зэф:
                    key = json.dumps([[g], [e]])
                    if key not in abil_used and g != e: зв = [[g], [e]]; abil_used.add(key); break
                if зв: break
            if not зв: ош.append(f"{z['имя']}: способность «{n}» — нет свободного звука")
            abl.append(dict(n=n, эф=эф, ш=ш, ур=ур_, зв=зв or [["lug_thud"]]))
        for k_, v_, c_ in дары:
            if k_ not in ДАРЫ: ош.append(f"{z['имя']}: дар {k_}")
            if c_ not in ПОРЫ: ош.append(f"{z['имя']}: пора {c_}")
        for o in особ:
            if o.split(":")[0] not in ОСОБЫЕ: ош.append(f"{z['имя']}: особое {o}")
        р = int(z["р"]); ред = {1: 1, 2: 2, 3: 2, 4: 3}[р]
        out.append(dict(id=pid(z["имя"]), имя=z["имя"], род=z["род"], g=z["g"], ход=z["ход"], р=р, ред=ред, ездовой=bool(z["ездовой"]), корм=z["корм"],
                        роли=z["роли"], сила=z["сила"], стойк=z["стойк"], ловк=z["ловк"], чутьё=z["чутьё"], о=z["о"].rstrip("."), особенность=z["особенность"],
                        уход=z.get("уход", ""), звукО=z.get("звук", ""), снд=prof, способности=abl, дары=[list(x) for x in дары], особ=особ, биомы=биомы, ур=ур,
                        пакет=z["пакет"]))
    ids = [x["id"] for x in out]
    if len(set(ids)) != len(ids): ош.append("повтор id зверя канона")
    return out, ош
