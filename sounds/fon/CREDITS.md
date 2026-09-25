# Фоны и голоса мест из свободных игр

Эта папка заменила пак Neo HQ Mystic Sounds (папки `sea`, `ambience`, `places`, `dungeon`): у пака не было лицензии, а его «фоны» оказались мистическими подкладками, а не звуком мира. Здесь — настоящие записи из четырёх свободных игр: море и шторм, лес, горы, пустыня, топи, равнина и тракт, голоса подземелья по глубине, логово, рынок, кузница, таверна, зал клана, обоз, порт и корабли.

## Источники

- **Stendhal** — https://stendhalgame.org · https://github.com/arianne/stendhal: 31 запись.
- **0 A.D.** — https://play0ad.com · https://github.com/0ad/0ad: 12 записей.
- **MegaGlest** — https://megaglest.org · https://github.com/MegaGlest/megaglest-data: 8 записей.
- **Valyria Tear** — https://github.com/ValyriaTear/ValyriaTear: 3 записи.

## Лицензии

- **CC BY-SA 3.0** — https://creativecommons.org/licenses/by-sa/3.0/, текст рядом: `LICENSE-CC-BY-SA-3.0.txt` (все данные 0 A.D. и MegaGlest, часть Valyria Tear). Записи остаются под той же лицензией.
- **CC BY 3.0** — https://creativecommons.org/licenses/by/3.0/, текст рядом: `LICENSE-CC-BY-3.0.txt`.
- **CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/, текст рядом: `LICENSE-CC-BY-4.0.txt`.
- **CC0 1.0** — общественное достояние, https://creativecommons.org/publicdomain/zero/1.0/, текст рядом: `LICENSE-CC0.txt`.
- **Общественное достояние** — записи Службы рыбы и дикой природы США и soundbible.com.

Записи под GPL не брались нарочно (у Valyria Tear и Wyrmsun часть звуков под GPL — они пропущены). Лицензии Stendhal — по `doc/sources/audio-sfx.txt`, `audio-weather.txt`, `audio-loop.txt` и `audio-music.txt` игры; Valyria Tear — по `LICENSES.txt`; 0 A.D. — `binaries/data/mods/public/audio/LICENSE.txt`; MegaGlest — `docs/README.data-license.txt`.

## Обработка

Звук не менялся: ни громкости, ни обрезки, ни эффектов. Исходники без потерь из Stendhal (`data/sounds/lossless_sources`) и WAV MegaGlest переложены в FLAC как есть. Короткие OGG-записи 0 A.D. переложены в FLAC без потерь. Долгие OGG-петли (фоны земель и глубины) перекодированы в OGG Vorbis 320 кбит/с, моно — в стерео, по правилу «320 кбит/с всему новому».

## Что здесь и откуда

| Файл | Роль | Что это | Игра | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|---|---|
| `fon_sea_open_01.flac` | `sea_open` | вода плещет о борт | Stendhal | pawsound | CC0 | https://freesound.org/people/pawsound/sounds/154879/ | `data/sounds/lossless_sources/loop/water-sloshing-01.flac` |
| `fon_sea_calm_01.flac` | `sea_calm` | лёгкий ветер над тихой водой | Stendhal | Dennis Johansson (MrAuralization) | CC0 | https://freesound.org/people/MrAuralization/sounds/243617/ | `data/sounds/lossless_sources/weather/wind_light.flac` |
| `fon_sea_storm_01.flac` | `sea_storm` | штормовой ветер | Stendhal | stewdio2003 | CC0 | https://freesound.org/people/stewdio2003/sounds/238374/ | `data/sounds/lossless_sources/weather/wind_heavy.flac` |
| `fon_sea_storm_02.flac` | `sea_storm` | ливень | Stendhal | Marcus Dellicompagni (PoundSound) | CC0 | https://freesound.org/people/dingo1/sounds/134721 | `data/sounds/lossless_sources/weather/rain_heavy.flac` |
| `fon_sea_storm_03.flac` | `sea_storm` | гроза с ливнем | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/desert2/sounds/rain.wav` |
| `fon_ship_creak_01.flac` | `ship_creak` | долгий скрип дерева под нагрузкой | Stendhal | Department64 | CC0 | https://freesound.org/people/Department64/sounds/95262/ | `data/sounds/lossless_sources/creak-tree-2.flac` |
| `fon_ship_depart_01.flac` | `ship_depart` | корабль трогается: вода у борта | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/actor/ship/ship_move.ogg` |
| `fon_ship_depart_02.flac` | `ship_depart` | корабль на ходу | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/actor/ship/smove_21.ogg` |
| `fon_ship_arrive_01.flac` | `ship_arrive` | корабль подходит на вёслах | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/actor/ship/warship_move_01.ogg` |
| `fon_ship_arrive_02.flac` | `ship_arrive` | корабль у причала | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/actor/ship/ship_select_01.ogg` |
| `fon_port_horn_01.flac` | `port_horn` | гудок парома у пристани | Stendhal | Inchadney | CC BY 4.0 | https://freesound.org/s/157284/ | `data/sounds/lossless_sources/ferry/arrive.flac` |
| `fon_port_01.flac` | `port` | причал: снасти и вода | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_dock.ogg` |
| `fon_port_02.flac` | `port` | портовый склад | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_storehouse.ogg` |
| `fon_amb_forest_01.ogg` | `amb_forest` | березняк днём | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/birch_forest/sounds/day.ogg` |
| `fon_amb_forest_02.ogg` | `amb_forest` | тёмный лес днём | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/dark_forest/sounds/day.ogg` |
| `fon_amb_forest_03.ogg` | `amb_forest` | птичья песня в кронах | Valyria Tear | Koertes | CC BY-SA 3.0 | https://opengameart.org/users/koertes | `data/music/koertes-ccby-birdsongloop16s.ogg` |
| `fon_amb_mountain_01.flac` | `amb_mountain` | ветер на высоте | Stendhal | Félix Blume | CC0 | https://freesound.org/people/felix.blume/sounds/146436/ | `data/sounds/lossless_sources/weather/wind.flac` |
| `fon_amb_mountain_02.ogg` | `amb_mountain` | порывистый горный ветер | Stendhal | Jonathan Shaw (InspectorJ) | CC BY 3.0 | https://freesound.org/people/InspectorJ/sounds/376415/ | `data/sounds/loop/wind-01.ogg` |
| `fon_amb_mountain_03.ogg` | `amb_mountain` | ветер в горах | Valyria Tear | Blender Foundation | CC BY 3.0 | https://opengameart.org/content/ambient-mountain-river-wind-and-forest-and-waterfall | `data/sounds/mountain_wind.ogg` |
| `fon_amb_desert_01.ogg` | `amb_desert` | пустыня днём | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/desert2/sounds/day.ogg` |
| `fon_amb_desert_02.ogg` | `amb_desert` | пустыня ночью | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/desert2/sounds/night.ogg` |
| `fon_amb_swamp_01.ogg` | `amb_swamp` | папоротниковая низина: лягушки и насекомые | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/fernland/sounds/night.ogg` |
| `fon_amb_swamp_02.ogg` | `amb_swamp` | сырой лес ночью: сверчки и лягушки | Valyria Tear | Benboncan, dobroide (свод Bertram) | CC BY 3.0 | https://freesound.org/people/Benboncan/sounds/64544/ | `data/music/forest_at_night.ogg` |
| `fon_amb_swamp_03.ogg` | `amb_swamp` | тёмная чаща ночью | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/dark_forest/sounds/night.ogg` |
| `fon_amb_plains_01.ogg` | `amb_plains` | день в поле | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/ambient/dayscape/day_temperate_gen_02.ogg` |
| `fon_amb_plains_02.ogg` | `amb_plains` | весенний луг | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `tilesets/spring/sounds/day.ogg` |
| `fon_amb_road_01.ogg` | `amb_road` | день у дороги | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/ambient/dayscape/day_temperate_gen_03.ogg` |
| `fon_amb_city_01.flac` | `amb_city` | городская площадь | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_civ_center.ogg` |
| `fon_amb_city_02.flac` | `amb_city` | гул собравшихся горожан | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_theater.ogg` |
| `fon_amb_cave_01_n.flac` | `amb_cave` | вода в каменной чаше | Stendhal | pawsound | CC0 | https://freesound.org/people/pawsound/sounds/154881/ | `data/sounds/lossless_sources/water-slosh-02.flac` |
| `fon_amb_cave_02_n.flac` | `amb_cave` | летучая мышь под сводом | Stendhal | polymorpheva | CC0 | https://freesound.org/people/polymorpheva/sounds/104205/ | `data/sounds/lossless_sources/bat-3.flac` |
| `fon_deep_1_01.flac` | `deep_1` | летучие мыши в подвале | Stendhal | polymorpheva | CC0 | https://freesound.org/people/polymorpheva/sounds/104205/ | `data/sounds/lossless_sources/bat-1.flac` |
| `fon_deep_1_02.flac` | `deep_1` | крылья в темноте | Stendhal | polymorpheva | CC0 | https://freesound.org/people/polymorpheva/sounds/104205/ | `data/sounds/lossless_sources/bat-2.flac` |
| `fon_deep_2_01.flac` | `deep_2` | лопата в плотном грунте | Stendhal | andersmmg | CC BY 3.0 | https://freesound.org/s/516318/ | `data/sounds/lossless_sources/shovel_dig.flac` |
| `fon_deep_3_01.flac` | `deep_3` | дальний гул в толще | Stendhal | Dave Welsh | CC0 | https://freesound.org/people/Dave%20Welsh/sounds/194364/ | `data/sounds/lossless_sources/weather/thunder-05.flac` |
| `fon_deep_3_02.flac` | `deep_3` | раскат под горой | Stendhal | Xythe | CC0 | https://freesound.org/people/Xythe/sounds/37299/ | `data/sounds/lossless_sources/weather/thunder-07.flac` |
| `fon_deep_4_01.flac` | `deep_4` | тяжёлое дыхание в темноте | Stendhal | noahpardo | CC0 | https://freesound.org/people/noahpardo/sounds/345734/ | `data/sounds/lossless_sources/ogre-groan-01.flac` |
| `fon_deep_4_02.flac` | `deep_4` | стон из глубины | Stendhal | noahpardo | CC0 | https://freesound.org/people/noahpardo/sounds/345734/ | `data/sounds/lossless_sources/ogre-groan-02.flac` |
| `fon_deep_5_01.ogg` | `deep_5` | голоса из-под корней мира | Stendhal | Adam Webb | общественное достояние | https://soundbible.com/1883-Scary-Demon-Haunting.html | `data/music/ambiance-demon-1.ogg` |
| `fon_deep_5_02.flac` | `deep_5` | шёпот мёртвых | Stendhal | Dorothy Jean Thompson (pyro13djt) | CC BY 3.0 | https://freesound.org/people/pyro13djt/sounds/256032/ | `data/sounds/lossless_sources/undead-06.flac` |
| `fon_lair_01.flac` | `lair` | рык зверя в логове | Stendhal | U.S. Fish & Wildlife Service | общественное достояние | https://fws.gov/video/sound.htm | `data/sounds/lossless_sources/bear-01.flac` |
| `fon_lair_02.flac` | `lair` | ворчание из логова | Stendhal | U.S. Fish & Wildlife Service | общественное достояние | https://fws.gov/video/sound.htm | `data/sounds/lossless_sources/bear-02.flac` |
| `fon_lair_03.flac` | `lair` | зверь ворочается в логове | Stendhal | tylerandbergsd | CC BY 3.0 | https://freesound.org/people/tylerandbergsd/sounds/416859/ | `data/sounds/lossless_sources/bear-03.flac` |
| `fon_market_01.flac` | `market` | звон выручки | Stendhal | Lucish_ | CC BY 3.0 | https://freesound.org/s/554841/ | `data/sounds/lossless_sources/cha-ching.flac` |
| `fon_forge_01.flac` | `forge` | точильный камень | Stendhal | j1987 | CC0 | https://freesound.org/people/j1987/sounds/95007/ | `data/sounds/lossless_sources/loop-grind-stone-1.flac` |
| `fon_forge_02.flac` | `forge` | металл по металлу | Stendhal | qubodup | CC0 | https://freesound.org/people/qubodup/sounds/182821/ | `data/sounds/lossless_sources/pick-metallic-1.flac` |
| `fon_tavern_01.flac` | `tavern` | смех завсегдатая | Stendhal | Jordan Irwin (AntumDeluge) | CC0 | https://stendhalgame.org | `data/sounds/lossless_sources/laugh-old-man-01.flac` |
| `fon_tavern_02.flac` | `tavern` | хохот за столом | Stendhal | Jordan Irwin (AntumDeluge) | CC0 | https://stendhalgame.org | `data/sounds/lossless_sources/laugh-old-man-02.flac` |
| `fon_tavern_03.flac` | `tavern` | пробка из бутыли | Stendhal | fryzu82 | CC0 | https://freesound.org/people/fryzu82/sounds/142325/ | `data/sounds/lossless_sources/cork-pop-1.flac` |
| `fon_tavern_04.flac` | `tavern` | икота выпивохи | Stendhal | ceoux | CC0 | https://freesound.org/people/ceoux/sounds/338196/ | `data/sounds/lossless_sources/hiccup-01.flac` |
| `fon_clanhall_01.flac` | `clanhall` | казарма клана | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_barracks.ogg` |
| `fon_clanhall_02.flac` | `clanhall` | оплот клана | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `audio/interface/select/building/sel_fortress.ogg` |
| `fon_caravan_01.flac` | `caravan` | фырканье вьючной лошади | Stendhal | Andune | CC BY 3.0 | https://freesound.org/people/Andune/sounds/61605/ | `data/sounds/lossless_sources/horse-snort-01.flac` |
| `fon_caravan_02.flac` | `caravan` | ржание в обозе | Stendhal | Jonathan Shaw (InspectorJ) | CC BY 3.0 | https://freesound.org/people/InspectorJ/sounds/419231/ | `data/sounds/lossless_sources/horse-whinny-02.flac` |

Долгие фоны подземелья, города, пещеры и порта взяты из уже имеющихся настоящих петель: капель и сквозняк подземелья (Flare, папка `deep`), гул толщи и давление глубины (SuperTuxKart, папка `stk`), бездна (MegaGlest, папка `mg`), торговые ряды и причалы (0 A.D., папка `hall`). Роли `deep_1`…`deep_5`, `amb_city`, `amb_cave` и `port` остались голосами этих мест и звучат записями из таблицы выше.

## Версия 3.9: громкость глубины

Петли глубины звучали слишком тихо под музыкой, поэтому заменены копиями, выровненными по громкости (EBU R128, линейное усиление и ограничитель пиков), без потерь, FLAC, 16 бит; суффикс «_n». Сам звук не менялся, только громкость. Прежние файлы убраны.

| Файл | Было | Стало |
|---|---|---|
| fon_amb_cave_01_n.flac | −20,4 LUFS | −18,5 LUFS |
| fon_amb_cave_02_n.flac | −26,5 LUFS | −19,1 LUFS |
