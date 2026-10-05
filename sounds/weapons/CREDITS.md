# Оружие по ступеням качества (версия 8.5)

Звук оружия зависит от его редкости и качества: грубое звучит глухо, простое —
просто, добротное — чисто, редкое — звонко, легендарное — поёт и отзывается
чарами. Свои записи у меча, кинжала, топора, булавы, посоха, копья, лука и
арбалета. Роли — `w_…` в SOUND_BANK, ступени — таблица WEAPON_TIERS в index.html.

Все файлы — моно FLAC 48 кГц, 24 бит, без потерь. Срез гула ниже 40 Гц, тишина
по краям срезана, пересчёт частоты — SoX (soxr, точность 28 бит), пик −1 дБ TP.
Исходники записаны в 192 кГц / 24 бит (Still North Media) и 48 кГц / 24 бит
(Vehicle, JC Sounds).

**Лицензии.** CC0 — общественное достояние
(https://creativecommons.org/publicdomain/zero/1.0/): Still North Media
(stillnorth.media), Vehicle (Jan Schupke, vehicle.itch.io). CC BY 4.0 — с
указанием автора (https://creativecommons.org/licenses/by/4.0/): **Credit: JC
Sounds** (jcsounds.itch.io).

| Файлы | Что звучит | Источник, автор, лицензия |
|---|---|---|
| `sword_swing_t1_01.flac` … `sword_swing_t1_06.flac` | взмах простого меча: сабля, катана | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `sword_swing_t2_01.flac` … `sword_swing_t2_11.flac` | взмах добротного стального меча | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `sword_swing_t3_01.flac` … `sword_swing_t3_03.flac` | звонкий взмах редкого меча | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0; JC Sounds, «Pirate Pack Vol 1», CC BY 4.0 |
| `sword_swing_t4_01.flac` … `sword_swing_t4_03.flac` | поющий взмах легендарного меча | JC Sounds, «Pirate Pack Vol 1», CC BY 4.0; JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `blade_parry_t1_01.flac` … `blade_parry_t1_04.flac` | простой клинок о клинок | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `blade_parry_t2_01.flac` … `blade_parry_t2_11.flac` | сталь о сталь: норманнский меч, катана, сабля | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `blade_parry_t3_01.flac` … `blade_parry_t3_06.flac` | звонкое парирование | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `blade_parry_t4_01.flac` … `blade_parry_t4_04.flac` | долгий звон лучшей стали | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `sword_armor_t3_01.flac` … `sword_armor_t3_03.flac` | клинок по латам | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `heavy_armor_t3_01.flac` … `heavy_armor_t3_03.flac` | тяжёлый клинок, топор, булава по латам | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `sword_draw_t0_01.flac` … `sword_draw_t0_02.flac` | клинок из грубых кожаных ножен | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `sword_draw_t2_01.flac` … `sword_draw_t2_05.flac` | сабля из ножен | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `sword_draw_t4_01.flac` … `sword_draw_t4_02.flac` | клинок из ножен со звоном | JC Sounds, «Pirate Pack Vol 1», CC BY 4.0 |
| `sword_sheathe_t0_01.flac` … `sword_sheathe_t0_05.flac` | клинок в грубые ножны | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `sword_sheathe_t2_01.flac` … `sword_sheathe_t2_03.flac` | сабля в ножны | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `dagger_swing_t0_01.flac` … `dagger_swing_t0_03.flac` | глухой взмах грубого кинжала (9.5: те же записи, срез выше 2,8 кГц) | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `dagger_swing_t1_01.flac` … `dagger_swing_t1_06.flac` | взмах сакса и кинжала | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `dagger_swing_t3_01.flac` … `dagger_swing_t3_03.flac` | быстрый взмах кинжала | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `dagger_draw_t0_01.flac` … `dagger_draw_t0_02.flac` | сакс из ножен (9.5) | Vehicle (Jan Schupke), «Fantasy Sound Effects (Tinysized SFX)» (`seax-unsheathe-01/02`), CC0 |
| `dagger_draw_t2_01.flac` … `dagger_draw_t2_03.flac` | нож из ножен | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `dagger_sheathe_t0_01.flac` … `dagger_sheathe_t0_02.flac` | нож в ножны | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `dagger_sheathe_t2_01.flac` … `dagger_sheathe_t2_03.flac` | нож в ножны | Vehicle (Jan Schupke), «Fantasy Weapons and Apparel SFX Library», CC0 |
| `heavy_swing_t2_01.flac` … `heavy_swing_t2_06.flac` | взмах топора | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `heavy_swing_t3_01.flac` … `heavy_swing_t3_03.flac` | взмах тяжёлого клинка | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `bow_shoot_t0_01.flac` … `bow_shoot_t0_03.flac` | выстрел скифского лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_shoot_t1_01.flac` … `bow_shoot_t1_04.flac` | выстрел скифского лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_shoot_t2_01.flac` … `bow_shoot_t2_03.flac` | выстрел английского длинного лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_shoot_t3_01.flac` … `bow_shoot_t3_02.flac` | выстрел лука | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `bow_shoot_t4_01.flac` … `bow_shoot_t4_02.flac` | выстрел длинного лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_draw_t0_01.flac` … `bow_draw_t0_03.flac` | натяжение скифского лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_draw_t2_01.flac` … `bow_draw_t2_03.flac` | натяжение длинного лука | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `bow_draw_t3_01.flac` … `bow_draw_t3_02.flac` | натяжение лука | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `arrow_fly_t0_01.flac` … `arrow_fly_t0_04.flac` | стрела пролетает | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `arrow_fly_t3_01.flac` … `arrow_fly_t3_04.flac` | тяжёлая стрела пролетает | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `arrow_hit_t3_01.flac` … `arrow_hit_t3_02.flac` | стрела попадает | JC Sounds, «Fantasy SFX Pack Vol 1», CC BY 4.0 |
| `xbow_shoot_01.flac` … `xbow_shoot_03.flac` | выстрел арбалета | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `xbow_draw_01.flac` | арбалет взведён | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `xbow_fly_01.flac` … `xbow_fly_03.flac` | болт пролетает | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `spear_swing_t0_01.flac` … `spear_swing_t0_03.flac` | взмах копья | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `spear_swing_t2_01.flac` … `spear_swing_t2_03.flac` | взмах копья | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |
| `staff_parry_01.flac` … `staff_parry_06.flac` | древко о древко | Still North Media, «The Medieval Weapons Sound Effects Library» (Ben Jaszczak, Brian Nelson), CC0 |

## Голоса клинков (версия 9.5.3)

У каждого клинка свой голос: звонкий, тяжёлый или тонкий меч, нож или стилет
(функция `weaponVoice` и роли `w_v_…` в index.html). Голос по слову в имени
вещи, иначе — по самой вещи: один меч всегда звучит одинаково, другой — иначе.

Обработка: моно FLAC 48 кГц, 24 бит; срез ниже 40 Гц, тишина по краям срезана,
пик −1 дБ, громкость не выше −16…−21 LUFS по роли. Тяжёлый голос — те же
записи на 3–4 полутона ниже, тонкий и стилет — на 2–4 полутона выше.
Удар по плоти у звонкого и тяжёлого клинка — запись рассечения плоти из
`blade/blade_flesh_*.flac` (авторы и лицензии — в sounds/blade/CREDITS.md,
производные файлы наследуют их лицензии) и звон стали Vehicle поверх.

**Лицензии.** CC0: Vehicle (Jan Schupke, «Fantasy Weapons and Apparel SFX
Library», «Fantasy Sound Effects (Tinysized SFX)»), Kenney (kenney.nl, «RPG
Audio»), Still North Media. CC BY 4.0: **Credit: JC Sounds**. GPL-3.0:
Veloren (veloren.net, автор Eden; https://www.gnu.org/licenses/gpl-3.0.html).

| Файлы | Что звучит | Источник |
|---|---|---|
| `voice_ring_hit_01.flac`, `voice_ring_hit_02.flac`, `voice_ring_hit_03.flac`, `voice_ring_hit_04.flac`, `voice_ring_hit_05.flac` | звонкий клинок по плоти | blade_flesh_01–05 + `sword-knife-clash-13/14/15/16/21` (Vehicle, CC0) |
| `voice_ring_parry_01.flac`, `voice_ring_parry_02.flac`, `voice_ring_parry_03.flac`, `voice_ring_parry_04.flac`, `voice_ring_parry_05.flac`, `voice_ring_parry_06.flac` | звонкий клинок о клинок | `sword-knife-clash-13/14/15/16/21/22` (Vehicle, CC0) |
| `voice_ring_draw_01.flac`, `voice_ring_draw_02.flac`, `voice_ring_draw_03.flac` | звонкий клинок из ножен | `sword-thermos-scrape-01/02/04` (Vehicle, CC0) |
| `voice_heavy_hit_01.flac`, `voice_heavy_hit_02.flac`, `voice_heavy_hit_03.flac`, `voice_heavy_hit_04.flac`, `voice_heavy_hit_05.flac` | тяжёлый клинок по плоти | blade_flesh_06/07/08/04/02 −3 пт + `sword-knife-clash-27` −4 пт (Vehicle, CC0) |
| `voice_heavy_parry_01.flac`, `voice_heavy_parry_02.flac`, `voice_heavy_parry_03.flac`, `voice_heavy_parry_04.flac`, `voice_heavy_parry_05.flac` | тяжёлый клинок о клинок | `sword-knife-clash-23/24/25/26/28` −4 пт (Vehicle, CC0) |
| `voice_heavy_draw_01.flac`, `voice_heavy_draw_02.flac`, `voice_heavy_draw_03.flac`, `voice_heavy_draw_04.flac` | тяжёлый клинок из ножен | `sword-table-leg-scrape-01…04` (Vehicle, CC0) |
| `voice_heavy_swing_01.flac`, `voice_heavy_swing_02.flac`, `voice_heavy_swing_03.flac`, `voice_heavy_swing_04.flac` | взмах тяжёлого клинка | `sword_swing_t2_01/03/05/08` −3 пт (Still North Media, CC0) |
| `voice_thin_hit_01.flac`, `voice_thin_hit_02.flac`, `voice_thin_hit_03.flac`, `voice_thin_hit_04.flac` | тонкий клинок: укол | `knifeSlice`, `knifeSlice2` (Kenney, CC0); dagger_stab_01/03 +2 пт; звон `sword-knife-clash-38/41` (Vehicle, CC0) |
| `voice_thin_parry_01.flac`, `voice_thin_parry_02.flac`, `voice_thin_parry_03.flac`, `voice_thin_parry_04.flac`, `voice_thin_parry_05.flac` | тонкий клинок о клинок | `sword-knife-clash-30/34/37/38/43` +2 пт (Vehicle, CC0) |
| `voice_thin_draw_01.flac`, `voice_thin_draw_02.flac`, `voice_thin_draw_03.flac` | тонкий клинок из ножен | `metal-knife-scrape-01/02`, `handsaw-knife-scrape-01` (Vehicle, Tinysized, CC0) |
| `voice_thin_swing_01.flac`, `voice_thin_swing_02.flac`, `voice_thin_swing_03.flac`, `voice_thin_swing_04.flac` | свист тонкого клинка | `sword_swing_t1_02/04/05/06` +2 пт (Still North Media, CC0) |
| `voice_knife_hit_01.flac`, `voice_knife_hit_02.flac`, `voice_knife_hit_03.flac`, `voice_knife_hit_04.flac` | нож: рез | `knifeSlice`, `knifeSlice2` (Kenney, CC0); dagger_stab_04/02 +1 пт |
| `voice_knife_draw_01.flac`, `voice_knife_draw_02.flac`, `voice_knife_draw_03.flac` | нож из ножен | `drawKnife1`, `drawKnife2` (Kenney, CC0); `knife-unsheathe-01` (Vehicle, CC0) |
| `voice_knife_parry_01.flac`, `voice_knife_parry_02.flac`, `voice_knife_parry_03.flac` | нож о клинок | `sword-knife-clash-39/40/19` +3 пт (Vehicle, CC0) |
| `voice_stiletto_hit_01.flac`, `voice_stiletto_hit_02.flac`, `voice_stiletto_hit_03.flac`, `voice_stiletto_hit_04.flac` | стилет: укол | dagger_stab_05/06/01/02 +3 пт (Vehicle, CC0; JC Sounds, CC BY 4.0) |
| `voice_stiletto_draw_01.flac`, `voice_stiletto_sheathe_01.flac` | стилет из ножен и в ножны | `weapon/dagger_out.ogg`, `weapon/dagger_in.ogg` — Eden, Veloren, GPL-3.0 |
| `voice_stiletto_parry_01.flac`, `voice_stiletto_parry_02.flac` | стилет о клинок | `sword-knife-clash-18` +4 пт (Vehicle, CC0) |
| `sword_equip_01.flac` | меч на поясе | `sfx_sword_equip.flac` — **Credit: JC Sounds**, «Pirate Pack Vol 1», CC BY 4.0 |
