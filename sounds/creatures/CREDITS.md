# Голоса существ из свободных игр

Эта папка заменила пак Classic Monster Sounds (автор Coucassi, папка `monsters`, 42 реплики): лицензии у пака не было. Здесь — голоса восьми существ игры: крылатая тварь, громада, дракон, призрак, рой, орочья глотка, слизь и глубинное, паук. У каждого — появление, удар, боль, гибель и шаг, у крылатой твари ещё звуковая атака, у паука — плевок паутиной. Все 41 реплик — отдельные записи из трёх свободных игр; ни одна не взята у другого звука игры (поступь громады служит ещё и ролью «Тяжёлая поступь» — это тот же зверь).

## Источники

- **Stendhal** — https://stendhalgame.org · https://github.com/arianne/stendhal: 18 записей.
- **MegaGlest** — https://megaglest.org · https://github.com/MegaGlest/megaglest-data: 15 записей.
- **OpenClonk** — https://www.openclonk.org · https://github.com/openclonk/openclonk: 8 записей.

## Лицензии

- **CC BY-SA 3.0** — https://creativecommons.org/licenses/by-sa/3.0/, текст рядом: `LICENSE-CC-BY-SA-3.0.txt` (данные MegaGlest). Записи остаются под той же лицензией.
- **CC BY 3.0** — https://creativecommons.org/licenses/by/3.0/, текст рядом: `LICENSE-CC-BY-3.0.txt` (OpenClonk и часть записей Stendhal).
- **CC0 1.0** — общественное достояние, https://creativecommons.org/publicdomain/zero/1.0/, текст рядом: `LICENSE-CC0.txt`.
- **Общественное достояние** — записи Службы рыбы и дикой природы США и Службы национальных парков США (soundbible.com).

Записи под GPL не брались. Лицензии Stendhal — по `doc/sources/audio-sfx.txt`; MegaGlest — `docs/README.data-license.txt`; OpenClonk — CC BY 3.0 для всех данных игры.

## Обработка и качество

Звук не менялся: ни громкости, ни обрезки. Все записи — **FLAC без потерь**, и исходники тоже без потерь: WAV MegaGlest и OpenClonk и FLAC из `lossless_sources` Stendhal переложены как есть. Одно исключение — гудение роя: в Stendhal оно есть только в OGG (моно, 98 кбит/с) и переложено в FLAC без дальнейших потерь. Гудение без потерь в свободных играх нашлось одно — улей MegaGlest, — но оно уже звучит пасекой среди звуков мира, а для слепого игрока одна запись с двумя смыслами путает. Шаги 0 A.D. (OGG) заменены поступью драконьего всадника MegaGlest и шорохом Stendhal без потерь. Рой берёт шаг у своего же появления: отдельной записи полёта роя в играх нет.

## Что здесь и откуда

| Файл | Существо | Реплика | Что это | Игра | Автор | Лицензия | Первоисточник | Файл в игре |
|---|---|---|---|---|---|---|---|---|
| `cr_bat_emerge.flac` | крылатая тварь | появление | визг крылатой твари | Stendhal | lazr2012 | CC BY 3.0 | https://freesound.org/people/lazr2012/sounds/169298/ | `data/sounds/lossless_sources/gargoyle-01.flac` |
| `cr_bat_attack.flac` | крылатая тварь | удар | шипение в броске | Stendhal | Zabuhailo | CC0 | https://freesound.org/s/146960/ | `data/sounds/lossless_sources/vampirette_hiss-01.flac` |
| `cr_bat_damage.flac` | крылатая тварь | боль | писк от боли | Stendhal | JoseAgudelo | CC0 | https://freesound.org/people/JoseAgudelo/sounds/472399/ | `data/sounds/lossless_sources/rat-squeak-03.flac` |
| `cr_bat_death.flac` | крылатая тварь | гибель | предсмертный визг | Stendhal | Kevin Smith (TKZ Productions) | CC BY 3.0 | https://opengameart.org/node/50710 | `data/sounds/lossless_sources/minimare-die.flac` |
| `cr_bat_sonic_special.flac` | крылатая тварь | звуковая атака | пронзительный писк | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Bat.ocg/Chirp.wav` |
| `cr_bat_step.flac` | крылатая тварь | шаг | взмахи крыльев | Stendhal | winsx87 | CC0 | https://freesound.org/people/winsx87/sounds/152024/ | `data/sounds/lossless_sources/bird-pigeon-flap-1.flac` |
| `cr_behemoth_emerge.flac` | громада | появление | рёв громады | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/behemoth/sounds/behemoth_select1.wav` |
| `cr_behemoth_attack.flac` | громада | удар | удар громады | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/behemoth/sounds/behemoth_attack1g.wav` |
| `cr_behemoth_damage.flac` | громада | боль | рык боли | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/behemoth/sounds/behemoth_ack1.wav` |
| `cr_behemoth_death.flac` | громада | гибель | грузное падение | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Mooq.ocg/DieFat.wav` |
| `cr_behemoth_step.flac` | громада | шаг | тяжёлая поступь | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/persian/units/elephant/sounds/elewalk2.wav` |
| `cr_dragon_emerge.flac` | дракон | появление | рык чёрного дракона | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/evil_dragon/sounds/evil_dragon_select1.wav` |
| `cr_dragon_attack.flac` | дракон | удар | рёв атаки | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/evil_dragon/sounds/evil_dragon_ack1.wav` |
| `cr_dragon_damage.flac` | дракон | боль | дракон ранен | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/evil_dragon/sounds/evil_dragon_hit1.wav` |
| `cr_dragon_death.flac` | дракон | гибель | гибель дракона | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/evil_dragon/sounds/evil_dragon_die1.wav` |
| `cr_dragon_step.flac` | дракон | шаг | поступь дракона | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/dragon_rider/sounds/dr_walk2.wav` |
| `cr_ghost_emerge.flac` | призрак | появление | голос призрачного доспеха | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/ghost_armor/sounds/ghost_armor_select1.wav` |
| `cr_ghost_attack.flac` | призрак | удар | удар призрака | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/ghost_armor/sounds/ghost_armor_attack6.wav` |
| `cr_ghost_damage.flac` | призрак | боль | стон призрака | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/ghost_armor/sounds/ghost_armor_ack1.wav` |
| `cr_ghost_death.flac` | призрак | гибель | призрак развеивается | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/ghost_armor/sounds/ghost_armor_select2.wav` |
| `cr_ghost_step.flac` | призрак | шаг | шелест в воздухе | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/ghost_armor/sounds/ghost_armor_attack7.wav` |
| `cr_hornet_emerge.flac` | рой | появление | гудение роя | Stendhal | nps.gov | общественное достояние | https://soundbible.com/971-Bee.html | `data/sounds/bee-1.ogg` |
| `cr_hornet_attack.flac` | рой | удар | стрёкот и жало | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Chippie.ocg/Talk1.wav` |
| `cr_hornet_damage.flac` | рой | боль | стрёкот от боли | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Chippie.ocg/Talk2.wav` |
| `cr_hornet_death.flac` | рой | гибель | тварь смолкла | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Mooq.ocg/Die1.wav` |
| `cr_orc_emerge.flac` | орочья глотка | появление | рык из глотки | Stendhal | dersuperanton | CC BY 3.0 | https://freesound.org/people/dersuperanton/sounds/434462/ | `data/sounds/lossless_sources/cyclops-grunt-01.flac` |
| `cr_orc_attack.flac` | орочья глотка | удар | боевой вопль | Stendhal | Tim Kahn | CC BY 3.0 | https://freesound.org/people/tim.kahn/sounds/163728/ | `data/sounds/lossless_sources/ogre-yell-01.flac` |
| `cr_orc_damage.flac` | орочья глотка | боль | хрип от удара | Stendhal | SmallQuadruped | CC0 | https://freesound.org/people/SmallQuadruped/sounds/42201/ | `data/sounds/lossless_sources/grunt-large-1.flac` |
| `cr_orc_death.flac` | орочья глотка | гибель | предсмертный крик | Stendhal | pandaplague | CC0 | https://freesound.org/people/pandaplague/sounds/89359/ | `data/sounds/lossless_sources/cyclops-scream-01.flac` |
| `cr_orc_step.flac` | орочья глотка | шаг | тяжёлый шаг | MegaGlest | MegaGlest Team | CC BY-SA 3.0 | — | `techs/megapack/factions/magic/units/dragon_rider/sounds/dr_walk1.wav` |
| `cr_slime_emerge.flac` | слизь и глубинное | появление | шипение из глубины | Stendhal | columbia23 | CC BY 3.0 | https://freesound.org/people/columbia23/sounds/395396/ | `data/sounds/lossless_sources/naga_hiss-01.flac` |
| `cr_slime_attack.flac` | слизь и глубинное | удар | бросок с шипением | Stendhal | columbia23 | CC BY 3.0 | https://freesound.org/people/columbia23/sounds/395396/ | `data/sounds/lossless_sources/naga_hiss-02.flac` |
| `cr_slime_damage.flac` | слизь и глубинное | боль | взвизг от боли | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Puka.ocg/Hurt1.wav` |
| `cr_slime_death.flac` | слизь и глубинное | гибель | тварь издыхает | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Puka.ocg/Die.wav` |
| `cr_slime_step.flac` | слизь и глубинное | шаг | вязкое волочение | Stendhal | altfuture | CC0 | https://freesound.org/people/altfuture/sounds/174634/ | `data/sounds/lossless_sources/loop-drag-slimy-1.flac` |
| `cr_spider_emerge.flac` | паук | появление | сухой треск | Stendhal | fws.gov | общественное достояние | https://soundbible.com/237-Rattlesnake-Rattle.html | `data/sounds/lossless_sources/rattlesnake-1.flac` |
| `cr_spider_attack.flac` | паук | удар | щёлканье жвал | Stendhal | Ogrebane | CC0 | https://opengameart.org/content/monster-sound-effects-2 | `data/sounds/lossless_sources/monster-11.flac` |
| `cr_spider_damage.flac` | паук | боль | визг от боли | Stendhal | Ogrebane | CC0 | https://opengameart.org/content/monster-sound-effects-2 | `data/sounds/lossless_sources/monster-12.flac` |
| `cr_spider_death.flac` | паук | гибель | тварь издыхает | Stendhal | Ogrebane | CC0 | https://opengameart.org/content/monster-sound-effects-2 | `data/sounds/lossless_sources/monster-14.flac` |
| `cr_spider_netshot_special.flac` | паук | выстрел паутиной | плевок паутиной | OpenClonk | The OpenClonk Team | CC BY 3.0 | — | `planet/Sound.ocg/Animals.ocg/Mooq.ocg/Spit1.wav` |
| `cr_spider_step.flac` | паук | шаг | шорох лапок по камню | Stendhal | Jordan Irwin (AntumDeluge) | CC0 | https://opengameart.org/node/81247 | `data/sounds/lossless_sources/scrape-1.flac` |
