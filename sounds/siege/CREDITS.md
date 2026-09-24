# Война: осада, тревога, вести

Записи в этой папке взяты из свободной игры **0 A.D.** (Empires Ascendant) —
исторической стратегии о войнах древности.

**Автор:** Wildfire Games.
**Проект:** https://play0ad.com · https://gitea.wildfiregames.com/0ad/0ad
**Лицензия художественной части:** Creative Commons Attribution-ShareAlike 3.0
(CC BY-SA 3.0): https://creativecommons.org/licenses/by-sa/3.0/

Условия соблюдены: указано авторство, названа лицензия, записи остаются под
той же лицензией. Файлы переименованы по игровым ролям; сам звук не изменён.

| Файл | Роль в игре | Исходный файл 0 A.D. |
|---|---|---|
| siege_alarm_city_01 | тревога: город под ударом | `audio/interface/alarm/alarmattackcity_1.ogg` |
| siege_alarm_raid_01 | тревога: набег | `audio/interface/alarm/alarmattackunit_1.ogg` |
| siege_alarm_war_01 | тревога: война | `audio/interface/alarm/alarmattackplayer_1.ogg` |
| siege_ballista_01 | баллиста стреляет | `audio/attack/siege/ballist_attack_01.ogg` |
| siege_defeat_01 | поражение объявлено | `audio/interface/alarm/alarmdefeat_1.ogg` |
| siege_fire_01 | огонь по стенам | `audio/attack/fire/c_11.ogg` |
| siege_fire_02 | горящий снаряд | `audio/attack/fire/sp_11.ogg` |
| siege_garrison_01 | гарнизон в стенах | `audio/interface/alarm/alarmgarrison_1.ogg` |
| siege_herodead_01 | герой пал | `audio/interface/alarm/alarmherodead_1.ogg` |
| siege_herojoin_01 | герой примкнул | `audio/interface/alarm/alarmherojoin_1.ogg` |
| siege_onager_01 | камнемёт бьёт | `audio/attack/siege/onager_shooting_11.ogg` |
| siege_onager_02 | камнемёт разворачивают | `audio/attack/siege/onager_moving_11.ogg` |
| siege_phase_01 | держава переходит в новую пору | `audio/interface/alarm/alarmresearchphase_1.ogg` |
| siege_ram_01 | таран бьёт в ворота | `audio/attack/siege/ram_attack.ogg` |
| siege_ram_02 | таран катят | `audio/attack/siege/ram_move.ogg` |
| siege_victory_01 | победа объявлена | `audio/interface/alarm/alarmvictory_1.ogg` |

## Тревога засады и нападение диких

Две сигнальные записи 0 A.D. (Wildfire Games, CC BY-SA 3.0) — без мелодии, шум и удары. Переложены из OGG в FLAC без потерь, звук не менялся. Звучат в роли `danger` вместе с оскалом и рыком тварей Stendhal.

| Файл | Что это | Исходный файл 0 A.D. |
|---|---|---|
| `siege_alarm_ambush_01.flac` | тревога: на отряд напали | `audio/interface/alarm/alarmattackunit_1.ogg` |
| `siege_alarm_wild_01.flac` | тревога: напали дикие | `audio/interface/alarm/alarm_attacked_gaia_01.ogg` |

## Версия 3.3: камнемёт и попадание по башне

Выстрел камнемёта и удар по башне собраны заново из записей без потерь трёх
свободных игр. Прежние (OGG около 65 кбит/с, 22 кГц) звучали глухо. Теперь
каждая запись — настоящий слой за слоем: скрип натянутого рычага, выстрел,
дальний удар камня; удар камня в кладку и осыпь обломков. Громкость выровнена
по пику −1 дБ, динамика мягко сжата; FLAC, один канал, 44,1 кГц.

Источники и лицензии:
- **MegaGlest** (https://megaglest.org, проект MegaGlest и участники) — CC BY-SA 3.0,
  исходные WAV из `techs/megapack/commondata/sounds/`; текст — `LICENSE-CC-BY-SA-3.0.txt`.
- **OpenClonk** (https://www.openclonk.org, The OpenClonk Team) — CC BY 3.0,
  `planet/Sound.ocg/Hits.ocg/Materials.ocg/`; текст — `LICENSE-CC-BY-3.0.txt`.
- **Stendhal** (https://stendhalgame.org), `data/sounds/lossless_sources/rocks-1.flac`,
  автор Allan K Zepeda (ALLANZ10D), CC0 — https://freesound.org/people/ALLANZ10D/sounds/155934/;
  текст — `LICENSE-CC0.txt`.

Сведённые записи распространяются под CC BY-SA 3.0.

| Файл | Что это | Из чего собрано |
|---|---|---|
| `siege_catapult_01.flac` | камнемёт: скрип рычага и выстрел | OpenClonk `Wood.ocg/WoodCreak3.ogg` + MegaGlest `catapult_attack1.wav` |
| `siege_catapult_02.flac` | камнемёт: скрип рычага и выстрел | OpenClonk `Wood.ocg/WoodCreak2.ogg` + MegaGlest `catapult_attack2.wav` |
| `siege_catapult_03.flac` | камнемёт: выстрел и дальний удар камня | OpenClonk `Wood.ocg/WoodCreak1.ogg` + MegaGlest `catapult_attack1.wav` + `catapult_hit2.wav` |
| `siege_tower_hit_01.flac` | камень бьёт в башню, сыплются обломки | MegaGlest `tower_hit1.wav` + OpenClonk `Rock.ocg/Rockfall1.wav` |
| `siege_tower_hit_02.flac` | камень бьёт в башню, сыплются обломки | MegaGlest `tower_hit2.wav` + OpenClonk `Rock.ocg/Rockfall2.wav` |
| `siege_tower_hit_03.flac` | камень бьёт в башню, осыпь | MegaGlest `tower_hit3.wav` + Stendhal `rocks-1.flac` |
| `siege_tower_hit_04.flac` | тяжёлый снаряд в стену, обломки | MegaGlest `catapult_hit1.wav` + OpenClonk `Rock.ocg/Rockfall1.wav` |
