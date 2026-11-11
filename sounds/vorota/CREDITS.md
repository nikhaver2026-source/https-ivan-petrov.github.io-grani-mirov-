# Ворота поселений: деревня, город, замок, подъёмная решётка

Слово игрока (11 ноября 2026): «Найди качественный звук открытия и закрытия
ворот, аутентичный и подходящий игре — ворота в деревню, в город и так далее».
Игрок прослушал пробы и одобрил каждую запись этой папки. Собраны они из живых
записей; чем и из каких отрезков — `tools/pipeline/hron/vorota_sborka.py`.

Обработка у всех одна: отрезки сведены в моно и сложены по порядку (запор —
ход створок — удар), гул ниже 60 Гц срезан, верх поднят (чтобы ворота были
слышны и в динамике телефона), громкость выставлена по замеру (BS.1770), пики
не выше −1 дБ. Формат — FLAC без потерь, 48 кГц, 24 бит.

## Лицензии

- **CC0 1.0** (общественное достояние) — записи BigSoundBank (https://bigsoundbank.com),
  собрания звуков Жозефа Сардена (Joseph Sardin), и запись скрипа дерева из игры
  Stendhal (автор записи — Department64, freesound.org). Текст — `LICENSE-CC0.txt`,
  https://creativecommons.org/publicdomain/zero/1.0/
- **CC BY-SA 3.0** — записи ворот из игры **0 A.D.** (Wildfire Games,
  https://play0ad.com). Записи этой папки, в которые они вошли (ворота города и
  замка), — производные и распространяются под той же лицензией CC BY-SA 3.0.
  Текст — `LICENSE-CC-BY-SA-3.0.txt`, https://creativecommons.org/licenses/by-sa/3.0/

## Записи

| Файл | Где звучит | Из чего собрано | Лицензия |
|---|---|---|---|
| vr_village_open_01 | ворота деревни отворяются | засов амбара отходит (BigSoundBank №1539 «barn-lock-unlocking», https://bigsoundbank.com/barn-lock-unlocking-s1539.html), затем тяжёлая деревянная дверь амбара (№0538 «wooden-barn-door», https://bigsoundbank.com/wooden-barn-door-s0538.html) | CC0 |
| vr_village_open_02 | ворота деревни отворяются | щеколда и ход створки — №0538 «wooden-barn-door» | CC0 |
| vr_village_close_01 | ворота деревни закрываются | створка в косяк — №0538; засов задвигается — №1540 «barn-lock-locking», https://bigsoundbank.com/barn-lock-locking-s1540.html | CC0 |
| vr_village_close_02 | ворота деревни закрываются | удар створки и щеколда — №0538 «wooden-barn-door» | CC0 |
| vr_city_open_01 | городские ворота отворяются (порт, посад, именной город) | ворота городской стены 0 A.D. — `sounds/ad/ad_gate_open_01` | CC BY-SA 3.0 |
| vr_city_open_02 | городские ворота отворяются | скрип дерева под нагрузкой (Stendhal, Department64 — `sounds/fon/fon_ship_creak_01`) и ворота 0 A.D. — `sounds/ad/ad_gate_open_02` | CC BY-SA 3.0 |
| vr_city_close_01 | городские ворота закрываются | ворота 0 A.D. — `sounds/ad/ad_gate_close_01` | CC BY-SA 3.0 |
| vr_city_close_02 | городские ворота закрываются | скрип дерева (`sounds/fon/fon_ship_creak_01`), ворота 0 A.D. (`sounds/ad/ad_gate_close_02`) и глухой удар створок 0 A.D. (`sounds/hall/hall_gate_01`) | CC BY-SA 3.0 |
| vr_castle_open_01 | ворота замка, крепости, цитадели отворяются | цепь тали (BigSoundBank — `sounds/adv/adv_chain_01`), затем ворота 0 A.D. — `sounds/ad/ad_gate_open_02` | CC BY-SA 3.0 |
| vr_castle_open_02 | ворота замка отворяются | засов амбара (BigSoundBank — `sounds/adv/adv_unlock_02`), скрип дерева (`sounds/fon/fon_ship_creak_01`), ворота 0 A.D. — `sounds/ad/ad_gate_open_01` | CC BY-SA 3.0 |
| vr_castle_close_01 | ворота замка закрываются | ворота 0 A.D. (`sounds/ad/ad_gate_close_01`) и цепь тали (`sounds/adv/adv_chain_03`) | CC BY-SA 3.0 |
| vr_castle_close_02 | ворота замка закрываются | ворота 0 A.D. (`sounds/ad/ad_gate_close_02`), глухой удар (`sounds/hall/hall_gate_01`), засов (`sounds/adv/adv_unlock_02`) | CC BY-SA 3.0 |
| vr_grate_up_01 | решётка поднимается | цепь тали (`sounds/adv/adv_chain_02`) и большая железная створка, проигранная медленнее (BigSoundBank №2357 «grinding-metal-barrier-opening-3», https://bigsoundbank.com/grinding-metal-barrier-opening-3-s2357.html) | CC0 |
| vr_grate_down_01 | решётка опускается | цепь тали (`sounds/adv/adv_chain_03`) и удар железной створки, проигранный медленнее (BigSoundBank №2360 «grinding-metal-barrier-closure-3», https://bigsoundbank.com/grinding-metal-barrier-closure-3-s2360.html) | CC0 |

Авторы исходных записей: Joseph Sardin (BigSoundBank); Wildfire Games (0 A.D.);
Department64 (скрип дерева, через игру Stendhal).
