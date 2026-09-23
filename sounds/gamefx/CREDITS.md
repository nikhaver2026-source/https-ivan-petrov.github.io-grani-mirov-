# Игровые звуки из свободных игр

Эта папка заменила пак Fantasy Sound Library (папки `fantasy` и `steps`): лицензии у пака нет. Здесь — настоящие записи из шести свободных игр: драконий рык, голоса гоблинов и кобольдов, удар архимага при сотворении чары, щелчок выбора в меню, шорох открытой сумки, щелчки механизма ловушки. Шаги по земле и по воде лежат в папке `steps`.

Звон монет пака перешёл на уже имевшуюся пригоршню монет Stendhal (роль `treasure`, папка `stendhalfx`): других записей монет под свободной лицензией в играх не нашлось. Глубокая пещера пака уступила место капели подземелья Flare (роль `deep_drip`), а фон под крышей дома — огню очага Flare (роль `wild_hearth`).

## Источники

- **Stendhal** — https://stendhalgame.org · https://github.com/arianne/stendhal: 7 записей.
- **MegaGlest** — https://megaglest.org · https://github.com/MegaGlest/megaglest-data: 7 записей.
- **OpenClonk** — https://www.openclonk.org · https://github.com/openclonk/openclonk: 3 записи.
- **Valyria Tear** — https://github.com/ValyriaTear/ValyriaTear: 1 запись.

## Лицензии

- **CC BY-SA 3.0** — https://creativecommons.org/licenses/by-sa/3.0/, текст рядом: `LICENSE-CC-BY-SA-3.0.txt` (данные MegaGlest). Записи остаются под той же лицензией.
- **CC BY 3.0** — https://creativecommons.org/licenses/by/3.0/, текст рядом: `LICENSE-CC-BY-3.0.txt` (OpenClonk, Valyria Tear).
- **CC0 1.0** — общественное достояние, https://creativecommons.org/publicdomain/zero/1.0/, текст рядом: `LICENSE-CC0.txt` (Stendhal).

Записи под GPL не брались: у Valyria Tear часть звуков под GPL — они пропущены. Шорох ткани Valyria Tear выложен автором под «CC BY 3.0 или GPL», взят по CC BY 3.0. Лицензии Stendhal — по `doc/sources/audio-sfx.txt`; Valyria Tear — по `LICENSES.txt`; MegaGlest — `docs/README.data-license.txt`; OpenClonk — CC BY 3.0 для всех данных игры.

## Обработка

Звук не менялся. Исходники без потерь (FLAC Stendhal, WAV MegaGlest, OpenClonk и Valyria Tear) переложены в FLAC как есть.

## Что здесь и откуда

| Файл | Роль | Что это | Игра | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|---|---|
| `fx_dragon_growl_01.flac` | `dragon_growl` | рёв дракона | Stendhal | frasbr | CC0 | https://freesound.org/people/frasbr/sounds/145729/ | `data/sounds/lossless_sources/roar-dragon-2.flac` |
| `fx_dragon_growl_02.flac` | `dragon_growl` | рык громадного зверя | Stendhal | ibm5155 | CC0 | https://freesound.org/people/ibm5155/sounds/174913/ | `data/sounds/lossless_sources/roar-large-1.flac` |
| `fx_goblin_voice_01.flac` | `goblin_voice` | голос гоблина | Stendhal | spookymodem | CC0 | https://freesound.org/people/spookymodem/sounds/249813/ | `data/sounds/lossless_sources/goblin-01.flac` |
| `fx_goblin_voice_02.flac` | `goblin_voice` | гоблин хихикает | Stendhal | spookymodem | CC0 | https://freesound.org/people/spookymodem/sounds/202096/ | `data/sounds/lossless_sources/goblin-laugh-01.flac` |
| `fx_goblin_voice_03.flac` | `goblin_voice` | гоблин рыгает | Stendhal | ohnobones | CC0 | https://freesound.org/people/ohnobones/sounds/416968/ | `data/sounds/lossless_sources/goblin-burp-01.flac` |
| `fx_goblin_voice_04.flac` | `goblin_voice` | лай кобольда | Stendhal | apolloaiello | CC0 | https://freesound.org/people/apolloaiello/sounds/276267/ | `data/sounds/lossless_sources/kobold_bark-01.flac` |
| `fx_goblin_voice_05.flac` | `goblin_voice` | окрик кобольда | Stendhal | apolloaiello | CC0 | https://freesound.org/people/apolloaiello/sounds/276267/ | `data/sounds/lossless_sources/kobold_bark-02.flac` |
| `fx_inventory_open_01.flac` | `inventory_open` | шорох ткани: сумка раскрылась | Valyria Tear | artisticdude | CC BY 3.0 | https://opengameart.org/users/artisticdude | `data/sounds/cloth_sound.wav` |
| `fx_menu_select_01.flac` | `menu_select` | щелчок выбора | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `data/core/menu/sound/click_a.wav` |
| `fx_menu_select_02.flac` | `menu_select` | щелчок выбора | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `data/core/menu/sound/click_b.wav` |
| `fx_spell_arcane_01.flac` | `spell_arcane` | удар архимага | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/commondata/sounds/archmage_attack2.wav` |
| `fx_spell_arcane_02.flac` | `spell_arcane` | удар архимага | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/commondata/sounds/archmage_attack3.wav` |
| `fx_spell_arcane_03.flac` | `spell_arcane` | удар архимага | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/commondata/sounds/archmage_attack4.wav` |
| `fx_spell_arcane_04.flac` | `spell_arcane` | удар архимага | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/commondata/sounds/archmage_attack6.wav` |
| `fx_spell_arcane_05.flac` | `spell_arcane` | удар архимага | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/commondata/sounds/archmage_attack8.wav` |
| `fx_trap_01.flac` | `trap` | щелчок взведённого механизма | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Objects.ocg/Weapons.ocg/Blunderbuss.ocg/Click1.wav` |
| `fx_trap_02.flac` | `trap` | спуск механизма | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Objects.ocg/Weapons.ocg/Blunderbuss.ocg/Click2.wav` |
| `fx_trap_03.flac` | `trap` | защёлка плиты | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Objects.ocg/WallKit.ocg/Click.wav` |
