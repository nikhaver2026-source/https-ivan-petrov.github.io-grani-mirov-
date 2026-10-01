# sounds/potion — зелье выпито

Шесть склянок, у каждого рода зелий своя (`POTION_SOUND` в index.html).
Все файлы — FLAC без потерь, 48 кГц, 24 бита, моно, громкость −14 LUFS,
пик не выше −1 дБ.

| Файл | Что слышно | Зелья |
|---|---|---|
| potion_vial.flac | пробка из стеклянного флакона, три глотка, стеклянный звон | мана, восприятие, ночное зрение, магический след |
| potion_long.flac | протяжная пробка, льющееся питьё, громкий глоток | зелье здоровья из лавки, лечебное, очищение |
| potion_cork.flac | открыть флакон, три коротких глотка, заткнуть обратно | противоядие, маскировка, изменение голоса, твёрдая рука |
| potion_elixir.flac | глотки зелья и тихий отзвук стекла | сила, сопротивления, мутационный состав |
| potion_quick.flac | короткое зелье, 0,6 с | скорость; зелье здоровья, выпитое посреди боя |
| potion_clay.flac | глухая пробка глиняной фляги, бульканье, глоток | восстановление сил, дыхание под водой, защита от холода и жара |

Роль `cast_potion` (сбор яда, алхимические чары) берёт любую из шести.

## Источники

| Файл | Записи | Автор | Лицензия |
|---|---|---|---|
| potion_vial | vial-glass-uncork-01 | Jan Schupke, Tinysized SFX Library | CC0 |
| | Gulping (465405) | nataliedmc, Freesound | CC0 |
| | ambi_glass_rub | Sonic Pi | CC0 |
| potion_long | long bottle cork open (506142) | mitchanary, Freesound | CC0 |
| | drink, drinking liquid (445970) | Breviceps, Freesound | CC0 |
| | Drinking gulp (724223) | sapphicrabbit, Freesound | **CC BY 4.0** |
| potion_cork | bottle-glass-uncork-01, bottle-glass-cork-01 | Jan Schupke, Tinysized SFX Library | CC0 |
| | Gulp (2) (151233) | OwlStorm, Freesound | CC0 |
| | gulp.wav (400374) | sabbyt2, Freesound | CC0 |
| potion_elixir | Potion drink swallow (574077) | ValentinPetiteau, Freesound | CC0 |
| | ambi_glass_hum | Sonic Pi | CC0 |
| potion_quick | PotionDrinkLONG.wav (41529) | Jamius, Freesound | **CC BY 4.0** |
| potion_clay | bottle-clay-uncork-01 | Jan Schupke, Tinysized SFX Library | CC0 |
| | drink, drinking liquid (445970) | Breviceps, Freesound | CC0 |
| | Gulping (465405) | nataliedmc, Freesound | CC0 |
| | ambi_glass_hum | Sonic Pi | CC0 |

Ссылки:
- https://freesound.org/people/nataliedmc/sounds/465405/
- https://freesound.org/people/mitchanary/sounds/506142/
- https://freesound.org/people/Breviceps/sounds/445970/
- https://freesound.org/people/sapphicrabbit/sounds/724223/ — «Drinking gulp» by sapphicrabbit, CC BY 4.0 (обрезано, выровнено по громкости, сведено с другими записями)
- https://freesound.org/people/OwlStorm/sounds/151233/
- https://freesound.org/people/sabbyt2/sounds/400374/
- https://freesound.org/people/ValentinPetiteau/sounds/574077/
- https://freesound.org/people/Jamius/sounds/41529/ — «PotionDrinkLONG.wav» by Jamius, CC BY 4.0 (выровнено по громкости, подняты верха)
- Tinysized SFX Library, Jan Schupke (http://www.vehiclemusic.eu), CC0
- Sonic Pi, https://github.com/sonic-pi-net/sonic-pi/tree/dev/etc/samples, CC0

Обработка: пересчёт на 48 кГц (soxr), срез ниже 90 Гц, подъём 3,5–4,5 кГц и
верхов для яркости, мягкая компрессия и ограничитель, громкость −14 LUFS.
Прежние три сборки (potion_drink_01–03) убраны: их сменили эти шесть.

CC0: https://creativecommons.org/publicdomain/zero/1.0/
CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
