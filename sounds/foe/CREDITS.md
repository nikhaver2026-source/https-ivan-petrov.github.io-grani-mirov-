# Твари: удары, боль, гибель

Записи в этой папке взяты из свободной игры **Flare** (Free/Libre Action
Roleplaying Engine) — одиночной фэнтезийной ролевой игры в тёмном стиле.

**Автор:** Clint Bellanger и участники проекта Flare (contributors retain
copyrights to their original contributions).
**Проект:** https://flarerpg.org · https://github.com/flareteam/flare-game
**Лицензия художественной части и данных:** Creative Commons
Attribution-ShareAlike 3.0 (CC BY-SA 3.0), допускаются более поздние версии:
https://creativecommons.org/licenses/by-sa/3.0/

Условия соблюдены: указано авторство, названа лицензия, записи остаются под
той же лицензией. Файлы переименованы по игровым ролям; сам звук не изменён.

| Файл | Роль в игре | Исходный файл Flare |
|---|---|---|
| foe_bone_die_02 | костяк разбит вдребезги | `fantasycore/soundfx/enemies/skeleton_critdie.ogg` |
| foe_bone_hit_01 | костяк бьёт | `fantasycore/soundfx/enemies/skeleton_phys.ogg` |
| foe_bone_pain_01 | костяку больно | `fantasycore/soundfx/enemies/skeleton_hit.ogg` |
| foe_brute_die_01 | громада падает | `fantasycore/soundfx/enemies/minotaur_die.ogg` |
| foe_brute_die_02 | громада повержена | `fantasycore/soundfx/enemies/minotaur_critdie.ogg` |
| foe_brute_hit_01 | громада бьёт | `fantasycore/soundfx/enemies/minotaur_phys.ogg` |
| foe_brute_pain_01 | громаде больно | `fantasycore/soundfx/enemies/minotaur_hit.ogg` |
| foe_burrow_die_01 | подземная тварь падает | `fantasycore/soundfx/enemies/antlion_die.ogg` |
| foe_burrow_die_02 | подземная тварь разбита | `fantasycore/soundfx/enemies/antlion_critdie.ogg` |
| foe_burrow_hit_01 | подземная тварь бьёт | `fantasycore/soundfx/enemies/antlion_phys.ogg` |
| foe_burrow_pain_01 | подземной твари больно | `fantasycore/soundfx/enemies/antlion_hit.ogg` |
| foe_goblin_cast_01 | гоблин колдует | `fantasycore/soundfx/enemies/goblin_ment.ogg` |
| foe_goblin_die_01 | гоблин падает | `fantasycore/soundfx/enemies/goblin_die.ogg` |
| foe_goblin_hit_01 | гоблин бьёт | `fantasycore/soundfx/enemies/goblin_phys.ogg` |
| foe_goblin_pain_01 | гоблину больно | `fantasycore/soundfx/enemies/goblin_hit.ogg` |
| foe_grave_die_01 | могильная тварь упокоена | `fantasycore/soundfx/enemies/grave_die.ogg` |
| foe_grave_hit_01 | могильная тварь бьёт | `fantasycore/soundfx/enemies/grave_attack.ogg` |
| foe_grave_pain_01 | могильной твари больно | `fantasycore/soundfx/enemies/grave_hit.ogg` |
| foe_wyrm_cast_01 | крылатая тварь дышит силой | `fantasycore/soundfx/enemies/wyvern_ment.ogg` |
| foe_wyrm_die_01 | крылатая тварь падает | `fantasycore/soundfx/enemies/wyvern_die.ogg` |
| foe_wyrm_hit_01 | крылатая тварь бьёт | `fantasycore/soundfx/enemies/wyvern_phys.ogg` |
| foe_wyrm_pain_01 | крылатой твари больно | `fantasycore/soundfx/enemies/wyvern_hit.ogg` |

## Не из Flare

Запись Flare `zombie_ment.ogg` — зомби, который по-английски тянет «brains» — убрана:
словами в игре говорят только по-русски. На её месте — стон нежити из свободной
игры **Stendhal** (https://stendhalgame.org), из исходников без потерь
`data/sounds/lossless_sources`; перекодировано в FLAC без потерь, в один канал.
Лицензия CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/), текст рядом —
`LICENSE-CC0.txt`.

| Файл | Роль в игре | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|
| foe_undead_cast_01 | нежить стонет | ArriGD | CC0 | https://freesound.org/people/ArriGD/sounds/144005/ | `lossless_sources/undead-5.flac` |

## Версия 3.3: нежить и костяки ярче

Удар, боль и гибель нежити Flare были записаны в 22 кГц и сжаты около
65–100 кбит/с — глухо и тускло. Их сменили записи из исходников без потерь
Stendhal (`data/sounds/lossless_sources`), выровненные по пику −1 дБ с мягким
сжатием динамики; FLAC, один канал, 44,1 кГц. Там же костяк получил сухой
стук рассыпающихся костей и скрипучий смех. Тексты лицензий рядом:
`LICENSE-CC0.txt`, `LICENSE-CC-BY-3.0.txt`.

| Файл | Роль в игре | Автор | Лицензия | Первоисточник | Файл в Stendhal |
|---|---|---|---|---|---|
| foe_undead_hit_02 | нежить бьёт: рык | Ogrebane | CC0 | https://opengameart.org/content/monster-sound-effects-2 | `lossless_sources/monster-1.flac` |
| foe_undead_pain_02 | нежити больно | Ogrebane | CC0 | https://opengameart.org/content/monster-sound-effects-2 | `lossless_sources/monster-2.flac` |
| foe_undead_die_03 | нежить упокоена: рык и предсмертный стон | Ogrebane; Dorothy Jean Thompson (pyro13djt) | CC0; CC BY 3.0 | https://opengameart.org/content/monster-sound-effects-2 · https://freesound.org/people/pyro13djt/sounds/256032/ | `lossless_sources/monster-16.flac` + `lossless_sources/undead-06.flac` |
| foe_undead_die_04 | нежить упокоена: предсмертный стон | Dorothy Jean Thompson (pyro13djt) | CC BY 3.0 | https://freesound.org/people/pyro13djt/sounds/256032/ | `lossless_sources/undead-06.flac` |
| foe_bone_die_03 | костяк рассыпается | Jordan Irwin (AntumDeluge) | CC0 | https://opengameart.org/node/16324 | `lossless_sources/bones-2.flac` |
| foe_bone_pain_02 | костяк скрипуче смеётся | Nanakisan | CC BY 3.0 | https://freesound.org/people/Nanakisan/sounds/253524/ | `lossless_sources/skeleton-laugh-01.flac` |
