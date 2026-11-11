# Подземелья: лестницы, двери, камень

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
| deep_cart_01 | рудничная вагонетка | `empyrean_campaign/soundfx/environment/minecart.ogg` |
| deep_door_01 | дверь открывается | `fantasycore/soundfx/door_open.ogg` |
| deep_portal_01 | переход портала | `fantasycore/soundfx/environment/teleporter.ogg` |
| deep_rocks_01 | осыпь камней | `empyrean_campaign/soundfx/environment/falling_rocks.ogg` |
| deep_stairs_01 | шаги по каменным ступеням | `fantasycore/soundfx/environment/stairs.ogg` |
| deep_stone_01 | каменная плита отходит | `fantasycore/soundfx/environment/stone_open.ogg` |
| deep_wind_01_n | сквозняк в подземелье | `fantasycore/soundfx/environment/cave_wind_loop.ogg` |
| deep_wood_01 | деревянная створка | `fantasycore/soundfx/wood_open.ogg` |

## Версия 3.9: громкость глубины

Петли глубины звучали слишком тихо под музыкой, поэтому заменены копиями, выровненными по громкости (EBU R128, линейное усиление и ограничитель пиков), без потерь, FLAC, 16 бит; суффикс «_n». Сам звук не менялся, только громкость. Прежние файлы убраны.

| Файл | Было | Стало |
|---|---|---|
| deep_wind_01_n.flac | −17,9 LUFS | −18,0 LUFS |

## Дверь ярче и громче (11 ноября 2026)

Удар двери в косяк (`deep_door_01`) в игре терялся. Сделана изменённая копия
той же записи Flare: верх поднят (+6,5 дБ выше 2,5 кГц), гул ниже 70 Гц срезан,
громкость выставлена по замеру (BS.1770), пик не выше −1 дБ; длина и сам звук
прежние. Копия — FLAC без потерь, под той же лицензией CC BY-SA 3.0; исходная
запись лежит рядом без изменений. Чем сделано — `tools/pipeline/hron/dver_yarche.py`.

| Файл | Из какой записи | Было | Стало |
|---|---|---|---|
| deep_door_01_y.flac | deep_door_01 | −21,1 LUFS | −15,9 LUFS, ярче |
