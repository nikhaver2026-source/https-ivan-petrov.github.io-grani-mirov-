# Шаги по земле и воде

Эта папка заменила шаги пака Fantasy Sound Library (десять шагов по земле и восемь по воде без лицензии). Здесь — настоящие записи шагов из четырёх свободных игр.

## Источники и лицензии

- **0 A.D.** (Wildfire Games) — https://play0ad.com · https://github.com/0ad/0ad: четыре шага по утоптанной земле. CC BY-SA 3.0, текст рядом: `LICENSE-CC-BY-SA-3.0.txt`; записи остаются под той же лицензией.
- **Wyrmsun** — https://github.com/Andrettin/Wyrmsun: три шага по сору, листве и сырой земле, автор TinyWorlds. CC0 1.0 по `sounds/credits.txt` игры, текст рядом: `LICENSE-CC0.txt`. Шаги Wyrmsun под GPL (step_dirt, step_stone) не брались.
- **Stendhal** — https://stendhalgame.org: шаг по воде, автор pawsound. CC0 1.0, по `doc/sources/audio-sfx.txt`.
- **Valyria Tear** — https://github.com/ValyriaTear/ValyriaTear: всплеск под ногой, автор Michel Baradari. CC BY 3.0, по `LICENSES.txt`, текст рядом: `LICENSE-CC-BY-3.0.txt`.

## Обработка

Звук не менялся: OGG 0 A.D., WAV Wyrmsun и Valyria Tear и FLAC Stendhal переложены в FLAC без потерь.

| Файл | Роль | Что это | Игра | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|---|---|
| `fx_step_dirt_01.flac` | `step_dirt` | шаг по утоптанной земле | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `binaries/data/mods/public/audio/actor/singlesteps/fs_gravel4.ogg` |
| `fx_step_dirt_02.flac` | `step_dirt` | шаг по утоптанной земле | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `binaries/data/mods/public/audio/actor/singlesteps/fs_gravel5.ogg` |
| `fx_step_dirt_03.flac` | `step_dirt` | шаг по утоптанной земле | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `binaries/data/mods/public/audio/actor/singlesteps/fs_gravel6.ogg` |
| `fx_step_dirt_04.flac` | `step_dirt` | шаг по утоптанной земле | 0 A.D. | Wildfire Games | CC BY-SA 3.0 | — | `binaries/data/mods/public/audio/actor/singlesteps/fs_gravel7.ogg` |
| `fx_step_dirt_05.flac` | `step_dirt` | шаг по сору и листве | Wyrmsun | TinyWorlds | CC0 | https://opengameart.org/users/tinyworlds | `sounds/movement/step_leaves/step_leaves_1.wav` |
| `fx_step_dirt_06.flac` | `step_dirt` | шаг по сору и листве | Wyrmsun | TinyWorlds | CC0 | https://opengameart.org/users/tinyworlds | `sounds/movement/step_leaves/step_leaves_2.wav` |
| `fx_step_dirt_07.flac` | `step_dirt` | шаг по сырой земле | Wyrmsun | TinyWorlds | CC0 | https://opengameart.org/users/tinyworlds | `sounds/movement/step_mud/step_mud.wav` |
| `fx_step_water_01.flac` | `step_water` | шаг по воде | Stendhal | pawsound | CC0 | https://freesound.org/people/pawsound/sounds/154881/ | `data/sounds/lossless_sources/water-slosh-03.flac` |
| `fx_step_water_02.flac` | `step_water` | всплеск под ногой | Valyria Tear | Michel Baradari | CC BY 3.0 | https://opengameart.org/content/water-splashes | `data/sounds/watersplash.wav` |
