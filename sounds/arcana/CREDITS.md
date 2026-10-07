# Звуки чар без тока (версия 11.0)

Игрок: «Искра сейчас звучит почему-то как электричество. Такого быть не должно».
Электрический гул, треск разряда и сигналы машин (OpenClonk) ушли из звукового
языка школ магии; их место заняли записи волшебства — нарастающий гул чар,
выпуски и попадания стихий, сияние, исцеление, тёмные чары, призрачное пение.
Ток остался только у чар молнии и силы — и он теперь настоящий гром и удар молнии.

Вторая волна (тоже 11.0): гул силового поля на оберегах (SuperTuxKart), электрическое
потрескивание у магического круга, ядра и рун и разряд «Zap» (OpenClonk) заменены
записями Tim — смычок по металлу, нарастающий шум чар и хлёсткий удар. Роли
`stk_ward`, `oc_electrical` и `oc_zap` сохранили имена и сменили записи; старые файлы удалены.

## Наборы и лицензии

| Набор | Автор | Лицензия | Где |
|---|---|---|---|
| Magic Attacks Bundle | Tim (timothyadan) | CC BY (на странице — «CC-BY»; соблюдаются условия CC BY 4.0: имя автора и ссылка) | https://timothyadan.itch.io/magic-attacks-bundle |
| Basic Spell Impacts [Free/CC0] | Lentikula | CC0 1.0 | https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx |
| Healing Spell Impacts [Free/CC0] | Lentikula | CC0 1.0 | https://lentikula.itch.io/healing-spell-impacts |
| Druid Spell Impacts [Free/CC0] | Lentikula | CC0 1.0 | https://lentikula.itch.io/druid-spell-impacts |
| 3 dark magic spells | qubodup | CC0 1.0 | https://opengameart.org/content/3-dark-magic-spells |
| Ghost | Ogrebane | CC0 1.0 | https://opengameart.org/content/ghost |
| Torch Fire Spell | spookymodem | CC BY 3.0 | https://opengameart.org/content/torch-fire-spell |
| Creepy Incoherent Chanting | OwlishMedia | CC0 1.0 | https://opengameart.org/content/creepy-incoherent-chanting |

**Credit:** Magic Attacks Bundle by Tim (timothyadan.itch.io), CC BY; Torch Fire Spell by spookymodem (OpenGameArt), CC BY 3.0.

## Что изменено

Все файлы — FLAC 44,1 кГц, 16 бит, стерео, без потерь. Длинные нарастания взяты
окном 2,2–3 с вокруг громкой части, края смягчены; громкость выровнена как в
`sounds/LOUDNESS_4.2.md`: звучащая часть −18 дБ, пик не выше −1 дБ полной
шкалы (короткие удары, упёршиеся в пик, тише). Больше ничего не менялось.

| Файл | Что звучит | Исходник | Автор | Лицензия | Длина, с | Было → стало, дБ |
|---|---|---|---|---|---|---|
| `arcane_charge_01.flac` | чары копят силу: нарастающий волшебный гул | Arcane_BuildupF1.flac | Tim | CC BY | 2.4 | -31.6 → -18.0 |
| `arcane_rise_01.flac` | чары взмывают: гул уходит вверх | Arcane_Buildup_PitchbendF1.flac | Tim | CC BY | 2.4 | -30.9 → -18.0 |
| `arcane_breath_01.flac` | дыхание чар: воздух втягивается в заклинание | Breath_Buildup1.flac | Tim | CC BY | 2.2 | -32.2 → -18.0 |
| `arcane_cast_01.flac` | волшебный выпуск: чары срываются с рук | Arcane_AttackF1.flac | Tim | CC BY | 2.44 | -30.1 → -18.0 |
| `arcane_hit_01.flac` | волшебное попадание | Arcane_ImpactF1.flac | Tim | CC BY | 1.7 | -30.7 → -21.2 |
| `arcane_shine_01.flac` | сияние: светлый отзвук после чар | Shine_Impact1.flac | Tim | CC BY | 1.86 | -29.9 → -18.0 |
| `flame_cast_01.flac` | огненный выпуск | Fire_AttackF1.flac | Tim | CC BY | 1.71 | -17.8 → -18.0 |
| `flame_hit_01.flac` | огненное попадание | Fire_ImpactF1.flac | Tim | CC BY | 1.79 | -15.8 → -18.0 |
| `flame_whoosh_01.flac` | пламя летит | Flame_Attack1.flac | Tim | CC BY | 1.71 | -17.6 → -18.0 |
| `ember_crackle_01.flac` | треск углей и пепла | Crackle_Impact1.flac | Tim | CC BY | 1.43 | -42.5 → -24.8 |
| `frost_cast_01.flac` | ледяной выпуск | Ice_AttackF1.flac | Tim | CC BY | 1.24 | -24.2 → -18.9 |
| `frost_hit_01.flac` | ледяное попадание | Ice_ImpactF1.flac | Tim | CC BY | 2.98 | -25.4 → -25.5 |
| `crystal_shatter_01.flac` | хрусталь разлетается | GlassBreak1.flac | Tim | CC BY | 0.98 | -25.6 → -24.3 |
| `gale_hit_01.flac` | порыв ветра бьёт | Wind_Impact1.flac | Tim | CC BY | 2.27 | -29.5 → -18.0 |
| `ooze_cast_01.flac` | вязкая жижа срывается | Slime_AttackF1.flac | Tim | CC BY | 1.8 | -18.8 → -18.0 |
| `ooze_splat_01.flac` | шлепок жижи | Splat1.flac | Tim | CC BY | 0.68 | -23.7 → -21.8 |
| `arcane_charge_02.flac` | чары копят силу: нарастающий волшебный гул | Arcane_BuildupF2.flac | Tim | CC BY | 2.4 | -31.8 → -18.0 |
| `arcane_rise_02.flac` | чары взмывают: гул уходит вверх | Arcane_Buildup_PitchbendF2.flac | Tim | CC BY | 2.4 | -31.8 → -18.0 |
| `arcane_breath_02.flac` | дыхание чар: воздух втягивается в заклинание | Breath_Buildup2.flac | Tim | CC BY | 2.2 | -33.5 → -18.0 |
| `arcane_cast_02.flac` | волшебный выпуск: чары срываются с рук | Arcane_AttackF2.flac | Tim | CC BY | 2.57 | -30.2 → -18.0 |
| `arcane_hit_02.flac` | волшебное попадание | Arcane_ImpactF2.flac | Tim | CC BY | 1.75 | -30.8 → -19.7 |
| `arcane_shine_02.flac` | сияние: светлый отзвук после чар | Shine_Impact2.flac | Tim | CC BY | 1.85 | -29.1 → -18.0 |
| `flame_cast_02.flac` | огненный выпуск | Fire_AttackF2.flac | Tim | CC BY | 1.75 | -18.5 → -18.0 |
| `flame_hit_02.flac` | огненное попадание | Fire_ImpactF2.flac | Tim | CC BY | 1.86 | -17.9 → -18.0 |
| `flame_whoosh_02.flac` | пламя летит | Flame_Attack2.flac | Tim | CC BY | 1.7 | -18.3 → -18.0 |
| `ember_crackle_02.flac` | треск углей и пепла | Crackle_Impact2.flac | Tim | CC BY | 2.11 | -43.4 → -26.1 |
| `frost_cast_02.flac` | ледяной выпуск | Ice_AttackF2.flac | Tim | CC BY | 1.25 | -24.6 → -18.0 |
| `frost_hit_02.flac` | ледяное попадание | Ice_ImpactF2.flac | Tim | CC BY | 2.92 | -24.9 → -25.9 |
| `crystal_shatter_02.flac` | хрусталь разлетается | GlassBreak2.flac | Tim | CC BY | 0.61 | -23.6 → -22.7 |
| `gale_hit_02.flac` | порыв ветра бьёт | Wind_Impact2.flac | Tim | CC BY | 2.27 | -27.6 → -18.0 |
| `ooze_cast_02.flac` | вязкая жижа срывается | Slime_AttackF2.flac | Tim | CC BY | 1.82 | -20.6 → -18.0 |
| `ooze_splat_02.flac` | шлепок жижи | Splat2.flac | Tim | CC BY | 0.87 | -23.9 → -19.7 |
| `arcane_charge_03.flac` | чары копят силу: нарастающий волшебный гул | Arcane_BuildupF3.flac | Tim | CC BY | 2.4 | -30.0 → -18.0 |
| `arcane_rise_03.flac` | чары взмывают: гул уходит вверх | Arcane_Buildup_PitchbendF3.flac | Tim | CC BY | 2.4 | -31.3 → -18.0 |
| `arcane_breath_03.flac` | дыхание чар: воздух втягивается в заклинание | Breath_Buildup3.flac | Tim | CC BY | 2.2 | -34.9 → -18.0 |
| `arcane_cast_03.flac` | волшебный выпуск: чары срываются с рук | Arcane_AttackF3.flac | Tim | CC BY | 2.47 | -29.7 → -18.0 |
| `arcane_hit_03.flac` | волшебное попадание | Arcane_ImpactF3.flac | Tim | CC BY | 1.59 | -39.4 → -23.7 |
| `arcane_shine_03.flac` | сияние: светлый отзвук после чар | Shine_Impact3.flac | Tim | CC BY | 1.92 | -31.1 → -18.0 |
| `flame_cast_03.flac` | огненный выпуск | Fire_AttackF3.flac | Tim | CC BY | 1.75 | -16.4 → -18.0 |
| `flame_hit_03.flac` | огненное попадание | Fire_ImpactF3.flac | Tim | CC BY | 1.56 | -15.9 → -18.0 |
| `flame_whoosh_03.flac` | пламя летит | Flame_Attack3.flac | Tim | CC BY | 1.75 | -11.6 → -18.0 |
| `ember_crackle_03.flac` | треск углей и пепла | Crackle_Impact3.flac | Tim | CC BY | 1.56 | -42.6 → -25.0 |
| `frost_cast_03.flac` | ледяной выпуск | Ice_AttackF3.flac | Tim | CC BY | 1.24 | -24.2 → -18.0 |
| `frost_hit_03.flac` | ледяное попадание | Ice_ImpactF3.flac | Tim | CC BY | 2.45 | -26.1 → -27.3 |
| `crystal_shatter_03.flac` | хрусталь разлетается | GlassBreak3.flac | Tim | CC BY | 0.37 | -28.1 → -22.7 |
| `gale_hit_03.flac` | порыв ветра бьёт | Wind_Impact3.flac | Tim | CC BY | 2.27 | -29.4 → -18.0 |
| `ooze_cast_03.flac` | вязкая жижа срывается | Slime_AttackF3.flac | Tim | CC BY | 1.78 | -25.9 → -18.0 |
| `ooze_splat_03.flac` | шлепок жижи | Splat3.flac | Tim | CC BY | 0.79 | -23.5 → -20.1 |
| `frost_charge_01.flac` | холод сгущается | Ice_BuildupF2.flac | Tim | CC BY | 2.4 | -38.8 → -18.0 |
| `frost_charge_02.flac` | холод сгущается | Ice_BuildupF3.flac | Tim | CC BY | 2.4 | -37.7 → -18.0 |
| `arcane_chimes_01.flac` | волшебный перезвон | Chimes.flac | Tim | CC BY | 2.6 | -42.7 → -21.3 |
| `heal_bloom_01.flac` | исцеление расцветает светом | Healing Spell Impact 1.flac | Lentikula | CC0 | 2.27 | -14.1 → -18.0 |
| `heal_bloom_02.flac` | исцеление расцветает светом | Healing Spell Impact 2.flac | Lentikula | CC0 | 1.98 | -14.7 → -18.0 |
| `heal_bloom_03.flac` | исцеление расцветает светом | Healing Spell Impact 4.flac | Lentikula | CC0 | 1.66 | -16.0 → -18.0 |
| `heal_bloom_04.flac` | исцеление расцветает светом | Healing Spell Impact 6.flac | Lentikula | CC0 | 2.55 | -16.5 → -18.0 |
| `heal_bloom_05.flac` | исцеление расцветает светом | Healing Spell Impact 7.flac | Lentikula | CC0 | 2.22 | -16.9 → -18.0 |
| `heal_bloom_06.flac` | исцеление расцветает светом | Healing Spell Impact 9.flac | Lentikula | CC0 | 1.45 | -19.6 → -19.8 |
| `heal_bloom_07.flac` | исцеление расцветает светом | Healing Spell Impact 10.flac | Lentikula | CC0 | 1.27 | -14.6 → -18.0 |
| `heal_bloom_08.flac` | исцеление расцветает светом | Healing Spell Impact 14.flac | Lentikula | CC0 | 1.74 | -13.5 → -18.0 |
| `fire_burst_01.flac` | огненный разрыв | Fire Spell Impact 1.flac | Lentikula | CC0 | 2.39 | -9.3 → -18.0 |
| `ice_burst_01.flac` | ледяной разрыв | Ice Spell Impact 1.flac | Lentikula | CC0 | 2.04 | -14.0 → -18.0 |
| `water_burst_01.flac` | водяной разрыв | Water Spell Impact 1.flac | Lentikula | CC0 | 2.01 | -12.8 → -18.0 |
| `bolt_burst_01.flac` | удар молнии (только для чар молнии) | Lightning Spell Impact 1.flac | Lentikula | CC0 | 3.68 | -13.5 → -18.0 |
| `earth_burst_01.flac` | каменный разрыв | Earth Spell Impact 1.flac | Lentikula | CC0 | 2.31 | -9.4 → -18.0 |
| `plant_burst_01.flac` | разрыв живой поросли | Plant Spell Impact 1.flac | Lentikula | CC0 | 1.83 | -7.8 → -18.0 |
| `wind_burst_01.flac` | ветряной разрыв | Wind Spell Impact 1.flac | Lentikula | CC0 | 3.06 | -10.8 → -18.0 |
| `fire_burst_02.flac` | огненный разрыв | Fire Spell Impact 2.flac | Lentikula | CC0 | 2.84 | -11.8 → -18.0 |
| `ice_burst_02.flac` | ледяной разрыв | Ice Spell Impact 2.flac | Lentikula | CC0 | 2.46 | -13.0 → -18.0 |
| `water_burst_02.flac` | водяной разрыв | Water Spell Impact 2.flac | Lentikula | CC0 | 2.34 | -12.0 → -18.0 |
| `bolt_burst_02.flac` | удар молнии (только для чар молнии) | Lightning Spell Impact 2.flac | Lentikula | CC0 | 4.56 | -17.9 → -18.3 |
| `earth_burst_02.flac` | каменный разрыв | Earth Spell Impact 2.flac | Lentikula | CC0 | 1.55 | -8.2 → -18.0 |
| `plant_burst_02.flac` | разрыв живой поросли | Plant Spell Impact 2.flac | Lentikula | CC0 | 2.63 | -10.6 → -18.0 |
| `wind_burst_02.flac` | ветряной разрыв | Wind Spell Impact 2.flac | Lentikula | CC0 | 2.95 | -9.4 → -18.0 |
| `fire_burst_03.flac` | огненный разрыв | Fire Spell Impact 3.flac | Lentikula | CC0 | 1.87 | -11.4 → -18.0 |
| `ice_burst_03.flac` | ледяной разрыв | Ice Spell Impact 3.flac | Lentikula | CC0 | 1.95 | -12.5 → -18.0 |
| `water_burst_03.flac` | водяной разрыв | Water Spell Impact 3.flac | Lentikula | CC0 | 2.77 | -14.6 → -18.0 |
| `bolt_burst_03.flac` | удар молнии (только для чар молнии) | Lightning Spell Impact 3.flac | Lentikula | CC0 | 3.75 | -12.6 → -18.0 |
| `earth_burst_03.flac` | каменный разрыв | Earth Spell Impact 3.flac | Lentikula | CC0 | 2.11 | -10.0 → -18.0 |
| `plant_burst_03.flac` | разрыв живой поросли | Plant Spell Impact 3.flac | Lentikula | CC0 | 2.01 | -7.7 → -18.0 |
| `wind_burst_03.flac` | ветряной разрыв | Wind Spell Impact 3.flac | Lentikula | CC0 | 2.72 | -12.2 → -18.0 |
| `fire_burst_04.flac` | огненный разрыв | Fire Spell Impact 4.flac | Lentikula | CC0 | 1.87 | -7.5 → -18.0 |
| `ice_burst_04.flac` | ледяной разрыв | Ice Spell Impact 4.flac | Lentikula | CC0 | 1.85 | -13.7 → -18.0 |
| `water_burst_04.flac` | водяной разрыв | Water Spell Impact 4.flac | Lentikula | CC0 | 1.84 | -13.2 → -18.0 |
| `bolt_burst_04.flac` | удар молнии (только для чар молнии) | Lightning Spell Impact 4.flac | Lentikula | CC0 | 3.59 | -13.0 → -18.0 |
| `earth_burst_04.flac` | каменный разрыв | Earth Spell Impact 4.flac | Lentikula | CC0 | 1.69 | -8.0 → -18.0 |
| `plant_burst_04.flac` | разрыв живой поросли | Plant Spell Impact 4.flac | Lentikula | CC0 | 3.13 | -7.3 → -18.0 |
| `wind_burst_04.flac` | ветряной разрыв | Wind Spell Impact 4.flac | Lentikula | CC0 | 3.65 | -13.8 → -18.0 |
| `fire_burst_05.flac` | огненный разрыв | Fire Spell Impact 5.flac | Lentikula | CC0 | 1.87 | -12.4 → -18.0 |
| `ice_burst_05.flac` | ледяной разрыв | Ice Spell Impact 5.flac | Lentikula | CC0 | 1.35 | -14.8 → -18.0 |
| `water_burst_05.flac` | водяной разрыв | Water Spell Impact 5.flac | Lentikula | CC0 | 2.4 | -19.2 → -19.5 |
| `bolt_burst_05.flac` | удар молнии (только для чар молнии) | Lightning Spell Impact 5.flac | Lentikula | CC0 | 3.71 | -12.6 → -18.0 |
| `earth_burst_05.flac` | каменный разрыв | Earth Spell Impact 5.flac | Lentikula | CC0 | 2.73 | -7.4 → -18.0 |
| `plant_burst_05.flac` | разрыв живой поросли | Plant Spell Impact 5.flac | Lentikula | CC0 | 2.34 | -5.9 → -18.0 |
| `wind_burst_05.flac` | ветряной разрыв | Wind Spell Impact 5.flac | Lentikula | CC0 | 2.58 | -10.1 → -18.0 |
| `dark_spell_01.flac` | тёмные чары | fout-01.flac | qubodup | CC0 | 2.84 | -9.1 → -18.0 |
| `dark_spell_02.flac` | тёмные чары | fout-02.flac | qubodup | CC0 | 1.18 | -10.5 → -18.0 |
| `dark_spell_03.flac` | тёмные чары | fout-03.flac | qubodup | CC0 | 2.96 | -10.4 → -18.0 |
| `portal_open_01.flac` | проход раскрывается | ghost.flac | Ogrebane | CC0 | 3.08 | -11.2 → -18.0 |
| `torch_whoosh_01.flac` | взмах огня | Waving_Torch.flac | spookymodem | CC BY 3.0 | 3.2 | -22.0 → -18.0 |
| `chant_ether_01.flac` | призрачное пение обряда | ethereal_chant_Subclip 02_02.flac | OwlishMedia | CC0 | 2.8 | -33.8 → -18.9 |
| `chant_ether_02.flac` | призрачное пение обряда | ethereal_chant_Subclip 13_13.flac | OwlishMedia | CC0 | 2.49 | -21.3 → -18.0 |
| `chant_ether_03.flac` | призрачное пение обряда | ethereal_chant_Subclip 21_21.flac | OwlishMedia | CC0 | 2.8 | -20.7 → -18.0 |
| `arcane_slap_01.flac` | хлёсткий удар чар (роль oc_zap) | Slap_Impact1.flac | Tim | CC BY | 0.29 | -26.8 → -20.1 |
| `arcane_slap_02.flac` | хлёсткий удар чар (роль oc_zap) | Slap_Impact2.flac | Tim | CC BY | 0.29 | -28.1 → -19.1 |
| `arcane_slap_03.flac` | хлёсткий удар чар (роль oc_zap) | Slap_Impact3.flac | Tim | CC BY | 0.29 | -24.7 → -20.7 |
| `power_hum_01.flac` | гул силы: круг, ядро, руны (роль oc_electrical) | Noise_Buildup.flac | Tim | CC BY | 2.6 | -38.2 → -18.0 |
| `power_hum_02.flac` | гул силы: круг, ядро, руны (роль oc_electrical) | Noise_Buildup1.flac | Tim | CC BY | 2.6 | -42.0 → -18.0 |
| `power_hum_03.flac` | гул силы: круг, ядро, руны (роль oc_electrical) | Noise_Buildup2.flac | Tim | CC BY | 2.6 | -38.3 → -18.0 |
| `power_hum_04.flac` | гул силы: круг, ядро, руны (роль oc_electrical) | Noise_Attack.flac | Tim | CC BY | 2.0 | -28.3 → -18.0 |
| `ward_hum_01.flac` | гул оберега: смычок по металлу (роль stk_ward) | Scrape_Buildup1.flac | Tim | CC BY | 2.6 | -32.7 → -18.0 |
| `ward_hum_02.flac` | гул оберега: смычок по металлу (роль stk_ward) | Scrape_Buildup2.flac | Tim | CC BY | 2.6 | -37.5 → -18.0 |
| `ward_hum_03.flac` | гул оберега: смычок по металлу (роль stk_ward) | Scrape_Buildup3.flac | Tim | CC BY | 2.6 | -31.6 → -18.0 |
