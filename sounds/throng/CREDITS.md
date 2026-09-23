# Люди: крики, кличи и голоса без слов

Слова в игре звучат только по-русски. Всё, что житель говорит словами, —
живые русские голоса (`sounds/voice`) и голос, которым игра читает текст.
В этой папке — только то, что человек издаёт без слов: смешок, оклик,
покашливание, «м-гм», вскрик, клич и предсмертный крик. Они ложатся под
русскую речь жителя и звучат в сценах, но ни одного чужого слова в них нет.

**Что ушло.** Раньше двенадцать записей этой папки были репликами отрядов
0 A.D. на латыни, греческом и персидском: «за работу», «иду», три клича,
«в бой», два приветствия, «к старшему», «строй», «отход» и «слушаюсь».
Для русской игры это была чужая речь посреди русской, и все двенадцать
убраны. «Строй идёт» теперь звучит гулом толпы, что валит в бой
(OpenClonk, `oc/oc_group_attack_01`), «за работу» — каменотёсом за
работой, «иду» — шагами по гравию: эти записи уже были в игре.

**Изменения:** файлы переименованы по ролям; новые записи перекодированы из
WAV и FLAC в FLAC без потерь, в один канал — чтобы источник звучал в своей
точке пространства. Сам звук не изменён.

## 0 A.D. — предсмертные крики

**Автор:** Wildfire Games. **Проект:** https://play0ad.com ·
https://gitea.wildfiregames.com/0ad/0ad
**Лицензия:** Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0):
https://creativecommons.org/licenses/by-sa/3.0/ — текст рядом,
`LICENSE-CC-BY-SA-3.0.txt`. Записи остаются под той же лицензией.

| Файл | Роль в игре | Исходный файл 0 A.D. |
|---|---|---|
| throng_die_f_01 | крик умирающей | `audio/actor/human/death/female_death_01.ogg` |
| throng_die_f_02 | крик умирающей | `audio/actor/human/death/female_death_02.ogg` |
| throng_die_f_03 | крик умирающей | `audio/actor/human/death/female_death_03.ogg` |
| throng_die_m_01 | крик умирающего | `audio/actor/human/death/male_death_01.ogg` |
| throng_die_m_02 | крик умирающего | `audio/actor/human/death/male_death_02.ogg` |
| throng_die_m_03 | крик умирающего | `audio/actor/human/death/male_death_03.ogg` |
| throng_die_m_04 | крик умирающего | `audio/actor/human/death/male_death_04.ogg` |

## MegaGlest — кличи

**Автор:** проект MegaGlest и его участники. **Проект:** https://megaglest.org ·
https://github.com/MegaGlest/megaglest-data
**Лицензия:** Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0):
https://creativecommons.org/licenses/by-sa/3.0/ — текст рядом,
`LICENSE-CC-BY-SA-3.0.txt`. Записи остаются под той же лицензией.

| Файл | Роль в игре | Исходный файл MegaGlest (`techs/megapack/commondata/sounds/`) |
|---|---|---|
| throng_cry_01 | клич воина, без слов | `guard_attack5.wav` |
| throng_cry_02 | клич воина, без слов | `guard_attack9.wav` |
| throng_cry_03 | клич воина, без слов | `horseman_attack12.wav` |
| throng_fight_01 | «в бой» — выкрик без слов | `guard_attack4.wav` |

## OpenClonk — оклик и испуг

**Автор:** The OpenClonk Team and contributors. **Проект:** https://www.openclonk.org ·
https://github.com/openclonk/openclonk
**Лицензия:** Creative Commons Attribution 3.0 Unported (CC BY 3.0):
https://creativecommons.org/licenses/by/3.0/ — текст рядом, `LICENSE-CC-BY-3.0.txt`.

| Файл | Роль в игре | Исходный файл OpenClonk (`planet/Sound.ocg/Clonk.ocg/Skin.ocg/`) |
|---|---|---|
| throng_hail_m_01 | весёлый мужской оклик без слов | `Adventurer.ocg/Confirm2.wav` |
| throng_retreat_01 | испуганный вскрик: отход | `Adventurer.ocg/Shock1.wav` |
| throng_retreat_02 | испуганный вскрик: отход | `Adventurer.ocg/Shock3.wav` |

## Stendhal — смешок, «м-гм» и покашливание

Записи взяты из свободной ролевой игры **Stendhal** (https://stendhalgame.org ·
https://github.com/arianne/stendhal), из её исходников без потерь
`data/sounds/lossless_sources`. Авторы и лицензии — пофайлово, как в
`doc/sources/audio-sfx.txt` самой игры. Тексты лицензий рядом:
`LICENSE-CC-BY-3.0.txt` (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/)
и `LICENSE-CC0.txt` (CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/).

| Файл | Роль в игре | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|
| throng_hail_f_01 | приветливый женский смешок | Ch0cchi | CC BY 3.0 | https://freesound.org/people/Ch0cchi/sounds/15288/ | `lossless_sources/giggle-female-01.flac` |
| throng_yes_01 | согласное «м-гм» | esperar | CC0 | https://freesound.org/people/esperar/sounds/170767/ | `lossless_sources/npc/mm_hmm_female-01.flac` |
| throng_lord_01 | старший откашливается перед словом | FrostyFrost | CC0 | https://freesound.org/people/FrostyFrost/sounds/348364/ | `lossless_sources/cough-male-02.flac` |
