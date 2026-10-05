# sounds/voice_npc — жители говорят сами

Приветствие жителя у прилавка, его ответ в разговоре и то, что на ходу
бросают стражник, латник, солдат гарнизона, горожанин и житель посада, и то, чем встречает на пороге места
стражник у ворот, жрец, трактирщик, староста, кузнец, торговец, наставник, смотритель порта. Прежде эти строки читал голос
игры в кавычках; теперь у каждой своя запись и своя интонация.

Записей: 7336

Речь синтезирована 27–29 сентября 2026 года нейроголосами **Gemini** (Google),
модель `gemini-3.8-flash-tts`, через Gemini API (Interactions API,
https://ai.google.dev/gemini-api/docs/speech-generation) ключами API автора игры.
Голоса — готовые голоса Gemini (prebuilt voices); они синтетические и не
воспроизводят голос какого-либо живого человека. ElevenLabs не использован:
кредитов на счёте не осталось (0 из 10 000).

**Условия.** По Gemini API Additional Terms of Service
(https://ai.google.dev/gemini-api/terms) Google не заявляет прав на созданное
содержимое («Google won't claim ownership over that content»), за его
использование отвечает автор игры; соблюдается Generative AI Prohibited Use
Policy (https://policies.google.com/terms/generative-ai/use-policy). Отдельной
лицензии на файлы не требуется; источник назван здесь и в главе руководства
«Кто написал эти звуки».

## Голоса

Голоса нарочно не те, что у голоса игры (Iapetus и Callirrhoe): на слух сразу
ясно, где говорит житель, а где игра.

| Голос Gemini | Каков | Кто говорит | Записей |
|---|---|---|---|
| Alnilam | твёрдый | стражник на обходе и ночной дозор (первый голос стражи) | 175 |
| Orus | твёрдый, пониже | стражник на обходе (второй голос стражи) | 176 |
| Algenib | с хрипотцой | стражник на обходе (третий голос стражи) | 110 |
| Charon | низкий, ровный | латник смены и солдат гарнизона за Гранью | 116 |
| Schedar | ровный, холодный | латник смены за Гранью (второй голос) | 218 |
| Achird | дружелюбный | горожанин и житель посада, староста деревни | 54 |
| Sulafat | тёплый | горожанка и жительница посада, старостиха | 54 |
| Umbriel | лёгкий, разговорный | приветствие и ответ в разговоре жителя, мужской голос; кузнец на пороге кузни | 972 |
| Despina | мягкий | приветствие и ответ в разговоре жительницы, женский голос | 966 |
| Algieba | ровный, уверенный | голос героя: ход «Спросить об истории» (остальные двадцать один — в sounds/voice) | 1 |
| Rasalgethi | зрелый, дорожный | старший обоза, мужской голос; наставник школы, смотритель порта | 66 |
| Gacrux | зрелый, твёрдый | старшая обоза, женский голос; смотрительница порта | 60 |
| Fenrir | резкий, возбуждённый | разбойник (первый голос) | 44 |
| Enceladus | с придыханием | разбойник (второй голос), хозяин схрона | 76 |
| Zubenelgenubi | спокойный, неспешный | жрец на пороге храма, хранитель башни | 40 |
| Vindemiatrix | мягкий, тихий | жрица на пороге храма | 33 |
| Puck | бодрый | трактирщик | 34 |
| Pulcherrima | напористый | трактирщица | 8 |
| Kore | твёрдый | кузнечиха | 60 |
| Sadachbia | живой | торговец на рынке | 970 |
| Laomedeia | бойкий | торговка на рынке | 8 |
| Erinome | ясный | наставница школы | 6 |
| Autonoe | звонкий | хранительница башни | 32 |
| Achernar | мягкий, приглушённый | хозяйка схрона; разбойница в бою | 6 |
| Sadachbia | живой | второй голос жителя (приветствие, разговор, торг, дело) | 970 |
| Leda | молодой | второй голос жительницы | 966 |
| Schedar | ровный | третий голос жителя; владыка нежити в бою (ниже на два полутона, в гулком зале) | 218 |
| Aoede | лёгкий | третий голос жительницы | 162 |
| Zephyr | яркий | корсарша в бою | 26 |
| Kore | твёрдый | старшая войскового обоза | 60 |
| Charon | низкий | старший войскового обоза; дракон в бою (ниже на пять полутонов, в пещере) | — |
| Vindemiatrix | тихий | старшая паломничьего каравана; дух в бою (шёпот с эхом) | — |
| Zubenelgenubi | неспешный | старший паломничьего каравана; страж Предтеч в бою (ниже, с металлом) | — |
| Achird / Erinome | дружелюбный / ясный | старший и старшая рудного обоза | — |
| Alnilam | твёрдый | исполин в бою (ниже на пять полутонов, тяжелее) | — |
| Orus | пониже | бес из-за Грани в бою (ниже на четыре полутона, с хрипом и хором) | — |
| Puck | бодрый | гоблин в бою (выше на пять полутонов) | — |
| Algenib | с хрипотцой | корсар в бою | — |
| Autonoe | звонкий | сирена в бою (с хором и эхом воды) | — |
| Enceladus / Fenrir | с придыханием / резкий | разбойники в бою; Enceladus ещё и дух (шёпот с эхом) | — |

## Как сделано и как проверено

- **Интонация под смысл.** У каждой строки своя короткая интонация (поле
  `style`): стражник предостерегает, ворчит или устало вздыхает, торговец
  зазывает, кузнец отрывист, лекарь заботлив, жрец говорит вполголоса,
  недруг цедит угрозу, житель посада шепчет со страхом. Ответ в разговоре
  звучит по смыслу хода и с поправкой на нрав жителя: «offended, indignant»
  на отвергнутый подкуп, у труса к ней «timid, nervous», у высокомерного —
  «haughty». Варианты по обстоятельствам — «hostile» у недруга, «warm,
  friendly» у своего, «grateful, warm» у того, кому герой недавно помог,
  «resentful, bitter» у того, кому навредил. У всех — «natural
  pace»: без неё интонации «шёпотом» и «угрожающе» растягивали речь.
- **У каждого стражника свой голос.** Строки стражи Грани записаны тремя
  голосами (Alnilam, Orus, Algenib), строки латника смены — двумя (Charon,
  Schedar): стражник говорит своим голосом при каждой встрече, а двое
  стражников на одной улице — разными. Второй и третий голос — файлы с
  суффиксом `_v1` и `_v2`.
- **Женский род.** Женский голос говорит о себе в женском роде («Рада тебя
  видеть», «Я вас не видела»): в описи ниже — то, что произнесено; в игре
  строка ищется по исходному тексту. Обращённое к герою («пока цел») не менялось.
- **Пакетами.** В одном запросе два голоса и до семидесяти четырёх строк; всё —
  166 пакетов и переозвучки неудачных дублей.
- **Разрезка и разборчивость.** Запись пакета дробится по паузам и склеивается
  в строки по распознанному тексту; каждую строку распознаёт русская модель
  GigaAM (sherpa-onnx, `nemo-ctc-giga-am-v2-russian`): не больше 15 % ошибочных
  букв и не медленнее шести знаков в секунду.
- **Громкость.** −18 LUFS по EBU R128 (у записей от -19.1 до -17.6),
  пики не выше -0.9 дБ; FLAC моно 24 кГц без потерь — как речь и отдаёт Gemini (с 4.6; прежде MP3 320 кбит/с 44,1 кГц, но выше 12 кГц в записи ничего нет, и лишний объём ничего не давал).

## Все записи

| Файл | Кто | Голос | Интонация | Текст |
|---|---|---|---|---|
| street_guard_0_g.flac | стражник | Alnilam | watchful, gruff warning | Ходи да оглядывайся. |
| street_guard_1_g.flac | стражник | Alnilam | proud, dutiful | Порядок на улицах — моя забота. |
| street_guard_2_g.flac | стражник | Alnilam | serious, caring advice | Ночью держись освещённых улиц. |
| street_guard_3_g.flac | стражник | Alnilam | impatient, brusque | Проходи, не задерживайся у ворот. |
| street_guard_4_g.flac | стражник | Alnilam | alert, a little worried | Слышал шум у дальнего квартала? Проверю. |
| street_guard_5_g.flac | стражник | Alnilam | dry, stern warning | Оружие в ножнах держи — целее будешь. |
| street_guard_6_g.flac | стражник | Alnilam | helpful, lowered voice, warning | Карманники нынче у рынка. Кошель к поясу. |
| street_guard_7_g.flac | стражник | Alnilam | dry, matter-of-fact | Драк не затевать. Остальное — твоё дело. |
| street_guard_8_g.flac | стражник | Alnilam | businesslike, stern | Видел что подозрительное — скажи. |
| street_guard_9_g.flac | стражник | Alnilam | tired, sighing | Смена кончается, а ночь только начинается. |
| street_guard_10_g.flac | стражник | Alnilam | strict, official | Кто без огня после заката — того спрашиваем. |
| street_guard_11_g.flac | стражник | Alnilam | firm reminder | Ворота на ночь запираем. Не опоздай. |
| street_guard_12_g.flac | стражник | Alnilam | loud, commanding the crowd | Не толпиться! Проходим по одному. |
| street_guard_13_g.flac | стражник | Alnilam | dry, sardonic | Жалобы — к сотнику. А лучше без жалоб. |
| street_guard_14_g.flac | стражник | Alnilam | annoyed, grumbling | Опять телега на мостовой. Чья, не знаешь? |
| street_guard_15_g.flac | стражник | Alnilam | dry humour, suspicious | Спокойно у нас. Пока ты тут не появился. |
| street_guard_16_g.flac | стражник | Alnilam | gruff, decisive | Пьяных — в холодную до утра. Всех. |
| street_guard_17_g.flac | стражник | Alnilam | concerned, lowered voice | Слыхал, за стеной волков видели. Держись дорог. |
| street_guardcold_0_g.flac | стражник недругу | Alnilam | cold, suspicious, threatening | Я тебя запомнил. Веди себя тихо. |
| street_guardcold_1_g.flac | стражник недругу | Alnilam | cold, suspicious, threatening | Глаз с тебя не спущу. |
| street_guardcold_2_g.flac | стражник недругу | Alnilam | cold, suspicious, threatening | Ещё раз увижу — спрошу по-другому. |
| street_guardfriend_6_g.flac | стражник своему | Alnilam | warm, friendly, relaxed | Доброго дня. Если что — зовите. |
| street_night_0_g.flac | ночной дозор | Alnilam | stern, wary, calling out at night | Поздно бродишь. Назови себя или ступай своей дорогой. |
| street_darkguard_0_g.flac | латник смены | Charon | cold, flat, commanding | Имя. Смену назови. |
| street_darkguard_1_g.flac | латник смены | Charon | cold, ominous, quiet | Ты не записан. Пока не записан. |
| street_darkguard_2_g.flac | латник смены | Charon | cold, detached, menacing | Ходишь — ходи. Остановишься — сочтут. |
| street_darkguard_3_g.flac | латник смены | Charon | flat, clipped, advising | К стене ближе. По середине ходят те, кого ищут. |
| street_darkguard_4_g.flac | латник смены | Charon | cold, grim, ominous | Ночью ворота закрыты изнутри. Снаружи их не закрывают. |
| street_darkguard_5_g.flac | латник смены | Charon | flat, strangely approving | Оружие видно. Это хорошо: прятать хуже. |
| street_soldier_0_g.flac | солдат гарнизона | Charon | weary, flat counting | Смена третья. Осталось две. |
| street_soldier_1_g.flac | солдат гарнизона | Charon | grim, hollow, weary | Вчера ушло сорок. Вернулось двенадцать. |
| street_soldier_2_g.flac | солдат гарнизона | Charon | bleak, fatalistic | Нам платят днями. Кто не считает — живёт дольше. |
| street_soldier_3_g.flac | солдат гарнизона | Charon | tense, lowered voice | Не спрашивай, куда роют. Роют вниз. |
| street_soldier_4_g.flac | солдат гарнизона | Charon | urgent, lowered voice, serious | Если услышишь рог дважды — беги к стене, не от неё. |
| street_soldier_5_g.flac | солдат гарнизона | Charon | dry, gruff, mocking | Ты с Грани? Пахнет. Не мной сказано. |
| street_folk_0_g.flac | горожанин | Achird | friendly, kind | Доброго пути. |
| street_folk_0_f_g.flac | горожанин | Sulafat | friendly, kind | Доброго пути. |
| street_folk_1_g.flac | горожанин | Achird | complaining, sighing | Опять подорожало зерно. |
| street_folk_1_f_g.flac | горожанин | Sulafat | complaining, sighing | Опять подорожало зерно. |
| street_folk_2_g.flac | горожанин | Achird | casual small talk | К вечеру обещали дождь. |
| street_folk_2_f_g.flac | горожанин | Sulafat | casual small talk | К вечеру обещали дождь. |
| street_folk_3_g.flac | горожанин | Achird | mildly annoyed | У колодца сегодня очередь. |
| street_folk_3_f_g.flac | горожанин | Sulafat | mildly annoyed | У колодца сегодня очередь. |
| street_folk_4_g.flac | горожанин | Achird | curious gossip | Слыхал, обоз пришёл с востока. |
| street_folk_4_f_g.flac | горожанин | Sulafat | curious gossip | Слыхала, обоз пришёл с востока. |
| street_folk_5_g.flac | горожанин | Achird | cheerful, pleased | Хлеб сегодня удался, у пекаря очередь. |
| street_folk_5_f_g.flac | горожанин | Sulafat | cheerful, pleased | Хлеб сегодня удался, у пекаря очередь. |
| street_folk_6_g.flac | горожанин | Achird | grumbling, disapproving | Мельник опять пьёт, мука будет с камнями. |
| street_folk_6_f_g.flac | горожанин | Sulafat | grumbling, disapproving | Мельник опять пьёт, мука будет с камнями. |
| street_folk_7_g.flac | горожанин | Achird | excited whisper, gossip | Говорят, в подземелье снова нашли золото. |
| street_folk_7_f_g.flac | горожанин | Sulafat | excited whisper, gossip | Говорят, в подземелье снова нашли золото. |
| street_folk_8_g.flac | горожанин | Achird | joyful, beaming, proud | Дочка замуж выходит — всю улицу зовём! |
| street_folk_8_f_g.flac | горожанин | Sulafat | joyful, beaming, proud | Дочка замуж выходит — всю улицу зовём! |
| street_folk_9_g.flac | горожанин | Achird | tired, grumbling | Кузнец опять стучит с рассвета. Спать не даёт. |
| street_folk_9_f_g.flac | горожанин | Sulafat | tired, grumbling | Кузнец опять стучит с рассвета. Спать не даёт. |
| street_folk_10_g.flac | горожанин | Achird | thoughtful, worried | Крышу бы подлатать до осени. |
| street_folk_10_f_g.flac | горожанин | Sulafat | thoughtful, worried | Крышу бы подлатать до осени. |
| street_folk_11_g.flac | горожанин | Achird | puzzled, musing | Рыба нынче мелкая. Река, что ли, обмелела? |
| street_folk_11_f_g.flac | горожанин | Sulafat | puzzled, musing | Рыба нынче мелкая. Река, что ли, обмелела? |
| street_folk_12_g.flac | горожанин | Achird | excited, bustling | Ярмарка скоро. Весь город вверх дном. |
| street_folk_12_f_g.flac | горожанин | Sulafat | excited, bustling | Ярмарка скоро. Весь город вверх дном. |
| street_folk_13_g.flac | горожанин | Achird | amused, chuckling | Сосед корову продал, теперь молоко у меня берёт. |
| street_folk_13_f_g.flac | горожанин | Sulafat | amused, chuckling | Сосед корову продал, теперь молоко у меня берёт. |
| street_folk_14_g.flac | горожанин | Achird | worried, anxious, searching | Не видал моего пса? Рыжий такой. |
| street_folk_14_f_g.flac | горожанин | Sulafat | worried, anxious, searching | Не видал моего пса? Рыжий такой. |
| street_folk_15_g.flac | горожанин | Achird | bitter, complaining | Цены растут, а жалованье нет. |
| street_folk_15_f_g.flac | горожанин | Sulafat | bitter, complaining | Цены растут, а жалованье нет. |
| street_folk_16_g.flac | горожанин | Achird | disapproving gossip | Вчера у трактира опять дрались. |
| street_folk_16_f_g.flac | горожанин | Sulafat | disapproving gossip | Вчера у трактира опять дрались. |
| street_folk_17_g.flac | горожанин | Achird | confidential, approving | Травница с окраины лечит лучше лекаря, и дешевле. |
| street_folk_17_f_g.flac | горожанин | Sulafat | confidential, approving | Травница с окраины лечит лучше лекаря, и дешевле. |
| street_folk_18_g.flac | горожанин | Achird | weary, groaning | Ох, спина. Весь день мешки носил. |
| street_folk_18_f_g.flac | горожанин | Sulafat | weary, groaning | Ох, спина. Весь день мешки носила. |
| street_folk_19_g.flac | горожанин | Achird | friendly warning | Смотри под ноги: тут лужа по колено. |
| street_folk_19_f_g.flac | горожанин | Sulafat | friendly warning | Смотри под ноги: тут лужа по колено. |
| street_folk_20_g.flac | горожанин | Achird | uneasy, superstitious | Храмовый колокол треснул, говорят — к беде. |
| street_folk_20_f_g.flac | горожанин | Sulafat | uneasy, superstitious | Храмовый колокол треснул, говорят — к беде. |
| street_folk_21_g.flac | горожанин | Achird | proud yet anxious, tender | Внук в стражу пошёл. Горжусь, а сердце не на месте. |
| street_folk_21_f_g.flac | горожанин | Sulafat | proud yet anxious, tender | Внук в стражу пошёл. Горжусь, а сердце не на месте. |
| street_folk_22_g.flac | горожанин | Achird | curious, slightly wary | Чужих нынче много. Ты, видать, тоже издалека. |
| street_folk_22_f_g.flac | горожанин | Sulafat | curious, slightly wary | Чужих нынче много. Ты, видать, тоже издалека. |
| street_folk_23_g.flac | горожанин | Achird | hurried, reminding | Поздно уже. Скоро ворота закроют. |
| street_folk_23_f_g.flac | горожанин | Sulafat | hurried, reminding | Поздно уже. Скоро ворота закроют. |
| street_darkfolk_0_g.flac | житель посада | Achird | fearful whisper | Не смотри на меня, я ещё в списке. |
| street_darkfolk_0_f_g.flac | житель посада | Sulafat | fearful whisper | Не смотри на меня, я ещё в списке. |
| street_darkfolk_1_g.flac | житель посада | Achird | anxious, hushed | Соль подорожала: значит, скоро обряд. |
| street_darkfolk_1_f_g.flac | житель посада | Sulafat | anxious, hushed | Соль подорожала: значит, скоро обряд. |
| street_darkfolk_2_g.flac | житель посада | Achird | bitter, hushed, fearful | У нас не спрашивают «как здоровье». У нас спрашивают «сколько осталось». |
| street_darkfolk_2_f_g.flac | житель посада | Sulafat | bitter, hushed, fearful | У нас не спрашивают «как здоровье». У нас спрашивают «сколько осталось». |
| street_darkfolk_3_g.flac | житель посада | Achird | grief, hushed | Вчера забрали соседа. Дом стоит, а порог сточен. |
| street_darkfolk_3_f_g.flac | житель посада | Sulafat | grief, hushed | Вчера забрали соседа. Дом стоит, а порог сточен. |
| street_darkfolk_4_g.flac | житель посада | Achird | frightened whisper | Тише. У стен есть уши, и они не наши. |
| street_darkfolk_4_f_g.flac | житель посада | Sulafat | frightened whisper | Тише. У стен есть уши, и они не наши. |
| street_darkfolk_5_g.flac | житель посада | Achird | fearful, hushed warning | Ты живой. Это заметно издалека, и это плохо. |
| street_darkfolk_5_f_g.flac | житель посада | Sulafat | fearful, hushed warning | Ты живой. Это заметно издалека, и это плохо. |
| greet_torg_0_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_0_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_1_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_1_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_2_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_2_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_3_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_3_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_4_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_4_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_5_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_5_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_6_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_6_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_7_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_7_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_8_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_8_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_9_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_9_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_10_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_10_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_11_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_torg_11_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_kuznya_0_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_0_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_1_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_1_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_2_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_2_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_3_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_3_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_4_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_4_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_5_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_5_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_6_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_6_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_7_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_kuznya_7_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_traktir_0_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_0_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_1_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_1_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_2_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_2_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_3_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_3_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_4_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_4_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_5_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_5_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_6_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_6_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_7_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_traktir_7_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_strazha_0_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_0_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_1_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_1_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_2_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_2_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_3_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_3_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_4_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_4_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_5_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_5_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_6_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_6_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_7_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_7_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_8_g.flac | приветствие: страж у дела | Umbriel | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_strazha_8_f_g.flac | приветствие: страж у дела | Despina | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_lekar_0_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_0_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_1_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_1_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_2_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_2_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_3_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_3_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_4_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_4_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_5_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_5_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_6_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_6_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_7_g.flac | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_lekar_7_f_g.flac | приветствие: лекарь | Despina | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_zhrec_0_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_0_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_1_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_1_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_2_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_2_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_3_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_3_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_4_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_4_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_5_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_5_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_6_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_6_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_7_g.flac | приветствие: жрец | Umbriel | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_zhrec_7_f_g.flac | приветствие: жрец | Despina | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_znanie_0_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_0_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_1_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_1_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_2_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_2_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_3_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_3_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_4_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_4_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_5_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_5_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_6_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_6_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_7_g.flac | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_znanie_7_f_g.flac | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_glub_0_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_0_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_1_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_1_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_2_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_2_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_3_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_3_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_4_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_4_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_5_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_5_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_6_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_6_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_7_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_7_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_8_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_8_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_9_g.flac | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_glub_9_f_g.flac | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_tma_0_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_0_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_1_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_1_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_2_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_2_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_3_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_3_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_4_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Спросишь лишнее — забуду, что видел тебя. |
| greet_tma_4_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Спросишь лишнее — забуду, что видела тебя. |
| greet_tma_5_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_5_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_6_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_6_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_7_g.flac | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_tma_7_f_g.flac | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_obshiy_0_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Доброго дня. |
| greet_obshiy_0_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Доброго дня. |
| greet_obshiy_1_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_1_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_2_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_2_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_3_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_3_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_4_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_4_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_5_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_5_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_6_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_6_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_7_g.flac | приветствие: всякий житель | Umbriel | plain, friendly, natural | Проходи, раз пришёл. |
| greet_obshiy_7_f_g.flac | приветствие: всякий житель | Despina | plain, friendly, natural | Проходи, раз пришёл. |
| greet_svoy_0_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Рад тебя видеть, друг. |
| greet_svoy_0_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Рада тебя видеть, друг. |
| greet_svoy_1_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_1_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_2_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_2_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_3_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_3_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_4_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_4_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_5_g.flac | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя отложил кое-что. Смотри. |
| greet_svoy_5_f_g.flac | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя отложила кое-что. Смотри. |
| greet_holod_0_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Чего тебе? |
| greet_holod_0_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Чего тебе? |
| greet_holod_1_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_1_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_2_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Говори и уходи. |
| greet_holod_2_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Говори и уходи. |
| greet_holod_3_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_3_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_4_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_4_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_5_g.flac | приветствие: холодный | Umbriel | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_holod_5_f_g.flac | приветствие: холодный | Despina | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_vrazhda_0_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_0_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_1_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_1_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_2_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_2_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_3_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_3_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_4_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_4_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_5_g.flac | приветствие: недруг | Umbriel | hostile, menacing, tense | Руки держи на виду. |
| greet_vrazhda_5_f_g.flac | приветствие: недруг | Despina | hostile, menacing, tense | Руки держи на виду. |
| greet_snova_0_g.flac | приветствие: при новой встрече | Umbriel | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_0_f_g.flac | приветствие: при новой встрече | Despina | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_1_g.flac | приветствие: при новой встрече | Umbriel | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_1_f_g.flac | приветствие: при новой встрече | Despina | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_2_g.flac | приветствие: при новой встрече | Umbriel | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_2_f_g.flac | приветствие: при новой встрече | Despina | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_3_g.flac | приветствие: при новой встрече | Umbriel | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_3_f_g.flac | приветствие: при новой встрече | Despina | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_4_g.flac | приветствие: при новой встрече | Umbriel | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_snova_4_f_g.flac | приветствие: при новой встрече | Despina | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_dobro_0_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_0_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_1_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_1_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_2_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_2_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_3_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_3_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_4_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_4_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_5_g.flac | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_dobro_5_f_g.flac | приветствие: помнит добро | Despina | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_zlo_0_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_0_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_1_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_1_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_2_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_2_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_3_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_3_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_4_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_4_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_5_g.flac | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_zlo_5_f_g.flac | приветствие: помнит обиду | Despina | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_utro_0_g.flac | приветствие: утром | Umbriel | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_0_f_g.flac | приветствие: утром | Despina | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_1_g.flac | приветствие: утром | Umbriel | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_1_f_g.flac | приветствие: утром | Despina | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_2_g.flac | приветствие: утром | Umbriel | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_2_f_g.flac | приветствие: утром | Despina | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_3_g.flac | приветствие: утром | Umbriel | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_utro_3_f_g.flac | приветствие: утром | Despina | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_vecher_0_g.flac | приветствие: вечером | Umbriel | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_0_f_g.flac | приветствие: вечером | Despina | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_1_g.flac | приветствие: вечером | Umbriel | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_1_f_g.flac | приветствие: вечером | Despina | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_2_g.flac | приветствие: вечером | Umbriel | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_2_f_g.flac | приветствие: вечером | Despina | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_3_g.flac | приветствие: вечером | Umbriel | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_vecher_3_f_g.flac | приветствие: вечером | Despina | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_noch_0_g.flac | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_0_f_g.flac | приветствие: ночью | Despina | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_1_g.flac | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_1_f_g.flac | приветствие: ночью | Despina | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_2_g.flac | приветствие: ночью | Umbriel | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_2_f_g.flac | приветствие: ночью | Despina | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_3_g.flac | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| greet_noch_3_f_g.flac | приветствие: ночью | Despina | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| dlg_0_0_g.flac | ответ в разговоре | Umbriel | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_0_f_g.flac | ответ в разговоре | Despina | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_1_g.flac | ответ в разговоре | Umbriel | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_1_f_g.flac | ответ в разговоре | Despina | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_2_g.flac | ответ в разговоре | Umbriel | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_2_f_g.flac | ответ в разговоре | Despina | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_3_g.flac | ответ в разговоре | Umbriel | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_3_f_g.flac | ответ в разговоре | Despina | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_4_g.flac | ответ в разговоре (трус) | Umbriel | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_4_f_g.flac | ответ в разговоре (трус) | Despina | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_5_g.flac | ответ в разговоре (подозрительный) | Umbriel | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_5_f_g.flac | ответ в разговоре (подозрительный) | Despina | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_6_g.flac | ответ в разговоре (высокомерный) | Umbriel | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_6_f_g.flac | ответ в разговоре (высокомерный) | Despina | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_7_g.flac | ответ в разговоре (жадный) | Umbriel | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_7_f_g.flac | ответ в разговоре (жадный) | Despina | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_8_g.flac | ответ в разговоре (хитрый) | Umbriel | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_8_f_g.flac | ответ в разговоре (хитрый) | Despina | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_9_g.flac | ответ в разговоре (рациональный) | Umbriel | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_9_f_g.flac | ответ в разговоре (рациональный) | Despina | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_10_g.flac | ответ в разговоре (жестокий) | Umbriel | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_10_f_g.flac | ответ в разговоре (жестокий) | Despina | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_11_g.flac | ответ в разговоре (недруг) | Umbriel | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_11_f_g.flac | ответ в разговоре (недруг) | Despina | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_12_g.flac | ответ в разговоре (недруг) | Umbriel | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_12_f_g.flac | ответ в разговоре (недруг) | Despina | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_13_g.flac | ответ в разговоре (холоден) | Umbriel | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_13_f_g.flac | ответ в разговоре (холоден) | Despina | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_14_g.flac | ответ в разговоре (холоден) | Umbriel | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_14_f_g.flac | ответ в разговоре (холоден) | Despina | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_15_g.flac | ответ в разговоре (свой) | Umbriel | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_15_f_g.flac | ответ в разговоре (свой) | Despina | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_16_g.flac | ответ в разговоре (помнит обиду) | Umbriel | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_16_f_g.flac | ответ в разговоре (помнит обиду) | Despina | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_17_g.flac | ответ в разговоре (помнит добро) | Umbriel | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_0_17_f_g.flac | ответ в разговоре (помнит добро) | Despina | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_1_0_g.flac | ответ в разговоре | Umbriel | shrugging, dismissive | Мало ли что болтают |
| dlg_1_0_f_g.flac | ответ в разговоре | Despina | shrugging, dismissive | Мало ли что болтают |
| dlg_1_1_g.flac | ответ в разговоре | Umbriel | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_1_f_g.flac | ответ в разговоре | Despina | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_2_g.flac | ответ в разговоре | Umbriel | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_2_f_g.flac | ответ в разговоре | Despina | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_3_g.flac | ответ в разговоре | Umbriel | shrugging, dismissive | Не слышал. А и слышал бы — не повторил |
| dlg_1_3_f_g.flac | ответ в разговоре | Despina | shrugging, dismissive | Не слышала. А и слышала бы — не повторила |
| dlg_1_4_g.flac | ответ в разговоре (честный) | Umbriel | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_4_f_g.flac | ответ в разговоре (честный) | Despina | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_5_g.flac | ответ в разговоре (трус) | Umbriel | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_5_f_g.flac | ответ в разговоре (трус) | Despina | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_6_g.flac | ответ в разговоре (фанатик) | Umbriel | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_6_f_g.flac | ответ в разговоре (фанатик) | Despina | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_7_g.flac | ответ в разговоре (подозрительный) | Umbriel | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_7_f_g.flac | ответ в разговоре (подозрительный) | Despina | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_8_g.flac | ответ в разговоре (недруг) | Umbriel | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_8_f_g.flac | ответ в разговоре (недруг) | Despina | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_9_g.flac | ответ в разговоре (холоден) | Umbriel | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_9_f_g.flac | ответ в разговоре (холоден) | Despina | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_10_g.flac | ответ в разговоре (свой) | Umbriel | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_10_f_g.flac | ответ в разговоре (свой) | Despina | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_11_g.flac | ответ в разговоре (помнит обиду) | Umbriel | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_1_11_f_g.flac | ответ в разговоре (помнит обиду) | Despina | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_2_0_g.flac | ответ в разговоре | Umbriel | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_0_f_g.flac | ответ в разговоре | Despina | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_1_g.flac | ответ в разговоре | Umbriel | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_1_f_g.flac | ответ в разговоре | Despina | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_2_g.flac | ответ в разговоре | Umbriel | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_2_f_g.flac | ответ в разговоре | Despina | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_3_g.flac | ответ в разговоре | Umbriel | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_3_f_g.flac | ответ в разговоре | Despina | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_4_g.flac | ответ в разговоре (рациональный) | Umbriel | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_4_f_g.flac | ответ в разговоре (рациональный) | Despina | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_6_g.flac | ответ в разговоре (добрый) | Umbriel | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_6_f_g.flac | ответ в разговоре (добрый) | Despina | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_7_g.flac | ответ в разговоре (подозрительный) | Umbriel | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_7_f_g.flac | ответ в разговоре (подозрительный) | Despina | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_8_g.flac | ответ в разговоре (традиционалист) | Umbriel | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_8_f_g.flac | ответ в разговоре (традиционалист) | Despina | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_9_g.flac | ответ в разговоре (реформатор) | Umbriel | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_9_f_g.flac | ответ в разговоре (реформатор) | Despina | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_10_g.flac | ответ в разговоре (жадный) | Umbriel | thoughtful, agreeing, greedy, calculating | Согласен, если мне с этого не убыток |
| dlg_2_10_f_g.flac | ответ в разговоре (жадный) | Despina | thoughtful, agreeing, greedy, calculating | Согласна, если мне с этого не убыток |
| dlg_2_11_g.flac | ответ в разговоре (недруг) | Umbriel | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_11_f_g.flac | ответ в разговоре (недруг) | Despina | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_12_g.flac | ответ в разговоре (холоден) | Umbriel | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_12_f_g.flac | ответ в разговоре (холоден) | Despina | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_13_g.flac | ответ в разговоре (свой) | Umbriel | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_13_f_g.flac | ответ в разговоре (свой) | Despina | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_14_g.flac | ответ в разговоре (помнит добро) | Umbriel | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_14_f_g.flac | ответ в разговоре (помнит добро) | Despina | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_15_g.flac | ответ в разговоре (помнит обиду) | Umbriel | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_2_15_f_g.flac | ответ в разговоре (помнит обиду) | Despina | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_3_0_g.flac | ответ в разговоре | Umbriel | firm refusal | Нет. И не уговаривайте |
| dlg_3_0_f_g.flac | ответ в разговоре | Despina | firm refusal | Нет. И не уговаривайте |
| dlg_3_1_g.flac | ответ в разговоре | Umbriel | firm refusal | Сказал нет — значит нет |
| dlg_3_1_f_g.flac | ответ в разговоре | Despina | firm refusal | Сказала нет — значит нет |
| dlg_3_2_g.flac | ответ в разговоре | Umbriel | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_2_f_g.flac | ответ в разговоре | Despina | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_3_g.flac | ответ в разговоре | Umbriel | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_3_f_g.flac | ответ в разговоре | Despina | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_4_g.flac | ответ в разговоре (фанатик) | Umbriel | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_4_f_g.flac | ответ в разговоре (фанатик) | Despina | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_5_g.flac | ответ в разговоре (рациональный) | Umbriel | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_5_f_g.flac | ответ в разговоре (рациональный) | Despina | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_6_g.flac | ответ в разговоре (жестокий) | Umbriel | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_6_f_g.flac | ответ в разговоре (жестокий) | Despina | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_7_g.flac | ответ в разговоре (высокомерный) | Umbriel | firm refusal, haughty | Не вам мне указывать |
| dlg_3_7_f_g.flac | ответ в разговоре (высокомерный) | Despina | firm refusal, haughty | Не вам мне указывать |
| dlg_3_8_g.flac | ответ в разговоре (традиционалист) | Umbriel | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_8_f_g.flac | ответ в разговоре (традиционалист) | Despina | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_9_g.flac | ответ в разговоре (добрый) | Umbriel | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_9_f_g.flac | ответ в разговоре (добрый) | Despina | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_10_g.flac | ответ в разговоре (мятежник) | Umbriel | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_10_f_g.flac | ответ в разговоре (мятежник) | Despina | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_11_g.flac | ответ в разговоре (недруг) | Umbriel | firm refusal, hostile | С вами? Никогда |
| dlg_3_11_f_g.flac | ответ в разговоре (недруг) | Despina | firm refusal, hostile | С вами? Никогда |
| dlg_3_12_g.flac | ответ в разговоре (холоден) | Umbriel | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_12_f_g.flac | ответ в разговоре (холоден) | Despina | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_13_g.flac | ответ в разговоре (свой) | Umbriel | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_13_f_g.flac | ответ в разговоре (свой) | Despina | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_14_g.flac | ответ в разговоре (помнит обиду) | Umbriel | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_14_f_g.flac | ответ в разговоре (помнит обиду) | Despina | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_15_g.flac | ответ в разговоре (помнит добро) | Umbriel | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_3_15_f_g.flac | ответ в разговоре (помнит добро) | Despina | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_4_0_g.flac | ответ в разговоре | Umbriel | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_0_f_g.flac | ответ в разговоре | Despina | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_1_g.flac | ответ в разговоре | Umbriel | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_1_f_g.flac | ответ в разговоре | Despina | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_2_g.flac | ответ в разговоре | Umbriel | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_2_f_g.flac | ответ в разговоре | Despina | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_3_g.flac | ответ в разговоре | Umbriel | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_3_f_g.flac | ответ в разговоре | Despina | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_4_g.flac | ответ в разговоре (сострадательный) | Umbriel | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_4_f_g.flac | ответ в разговоре (сострадательный) | Despina | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_5_g.flac | ответ в разговоре (добрый) | Umbriel | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_5_f_g.flac | ответ в разговоре (добрый) | Despina | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_6_g.flac | ответ в разговоре (жадный) | Umbriel | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_6_f_g.flac | ответ в разговоре (жадный) | Despina | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_7_g.flac | ответ в разговоре (прагматик) | Umbriel | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_7_f_g.flac | ответ в разговоре (прагматик) | Despina | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_8_g.flac | ответ в разговоре (трус) | Umbriel | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_8_f_g.flac | ответ в разговоре (трус) | Despina | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_9_g.flac | ответ в разговоре (свой) | Umbriel | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_9_f_g.flac | ответ в разговоре (свой) | Despina | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_10_g.flac | ответ в разговоре (помнит добро) | Umbriel | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_10_f_g.flac | ответ в разговоре (помнит добро) | Despina | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_11_g.flac | ответ в разговоре (холоден) | Umbriel | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_11_f_g.flac | ответ в разговоре (холоден) | Despina | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_12_g.flac | ответ в разговоре (недруг) | Umbriel | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_12_f_g.flac | ответ в разговоре (недруг) | Despina | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_13_g.flac | ответ в разговоре (помнит обиду) | Umbriel | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_4_13_f_g.flac | ответ в разговоре (помнит обиду) | Despina | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_5_0_g.flac | ответ в разговоре | Umbriel | helpless, sad | Мне бы кто помог |
| dlg_5_0_f_g.flac | ответ в разговоре | Despina | helpless, sad | Мне бы кто помог |
| dlg_5_1_g.flac | ответ в разговоре | Umbriel | helpless, sad | Самому бы кто подсобил |
| dlg_5_1_f_g.flac | ответ в разговоре | Despina | helpless, sad | Самой бы кто подсобил |
| dlg_5_2_g.flac | ответ в разговоре | Umbriel | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_2_f_g.flac | ответ в разговоре | Despina | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_3_g.flac | ответ в разговоре | Umbriel | helpless, sad | Не просите, не выйдет |
| dlg_5_3_f_g.flac | ответ в разговоре | Despina | helpless, sad | Не просите, не выйдет |
| dlg_5_4_g.flac | ответ в разговоре (жадный) | Umbriel | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_4_f_g.flac | ответ в разговоре (жадный) | Despina | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_5_g.flac | ответ в разговоре (подозрительный) | Umbriel | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_5_f_g.flac | ответ в разговоре (подозрительный) | Despina | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_6_g.flac | ответ в разговоре (высокомерный) | Umbriel | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_6_f_g.flac | ответ в разговоре (высокомерный) | Despina | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_7_g.flac | ответ в разговоре (сострадательный) | Umbriel | helpless, sad, compassionate, gentle | Рад бы, правда, но сейчас никак |
| dlg_5_7_f_g.flac | ответ в разговоре (сострадательный) | Despina | helpless, sad, compassionate, gentle | Рада бы, правда, но сейчас никак |
| dlg_5_8_g.flac | ответ в разговоре (трус) | Umbriel | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_8_f_g.flac | ответ в разговоре (трус) | Despina | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_9_g.flac | ответ в разговоре (свой) | Umbriel | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_9_f_g.flac | ответ в разговоре (свой) | Despina | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_10_g.flac | ответ в разговоре (недруг) | Umbriel | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_10_f_g.flac | ответ в разговоре (недруг) | Despina | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_11_g.flac | ответ в разговоре (холоден) | Umbriel | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_11_f_g.flac | ответ в разговоре (холоден) | Despina | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_12_g.flac | ответ в разговоре (помнит обиду) | Umbriel | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_5_12_f_g.flac | ответ в разговоре (помнит обиду) | Despina | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_6_0_g.flac | ответ в разговоре | Umbriel | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_0_f_g.flac | ответ в разговоре | Despina | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_1_g.flac | ответ в разговоре | Umbriel | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_1_f_g.flac | ответ в разговоре | Despina | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_2_g.flac | ответ в разговоре | Umbriel | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_2_f_g.flac | ответ в разговоре | Despina | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_3_g.flac | ответ в разговоре | Umbriel | serious, trusting | Договорились. Время покажет |
| dlg_6_3_f_g.flac | ответ в разговоре | Despina | serious, trusting | Договорились. Время покажет |
| dlg_6_4_g.flac | ответ в разговоре (честный) | Umbriel | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_4_f_g.flac | ответ в разговоре (честный) | Despina | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_5_g.flac | ответ в разговоре (хитрый) | Umbriel | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_5_f_g.flac | ответ в разговоре (хитрый) | Despina | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_6_g.flac | ответ в разговоре (рациональный) | Umbriel | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_6_f_g.flac | ответ в разговоре (рациональный) | Despina | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_7_g.flac | ответ в разговоре (добрый) | Umbriel | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_7_f_g.flac | ответ в разговоре (добрый) | Despina | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_8_g.flac | ответ в разговоре (свой) | Umbriel | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_8_f_g.flac | ответ в разговоре (свой) | Despina | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_9_g.flac | ответ в разговоре (помнит добро) | Umbriel | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_9_f_g.flac | ответ в разговоре (помнит добро) | Despina | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_10_g.flac | ответ в разговоре (холоден) | Umbriel | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_10_f_g.flac | ответ в разговоре (холоден) | Despina | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_11_g.flac | ответ в разговоре (недруг) | Umbriel | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_6_11_f_g.flac | ответ в разговоре (недруг) | Despina | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_7_0_g.flac | ответ в разговоре | Umbriel | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_0_f_g.flac | ответ в разговоре | Despina | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_1_g.flac | ответ в разговоре | Umbriel | skeptical, wry | Слова ничего не стоят |
| dlg_7_1_f_g.flac | ответ в разговоре | Despina | skeptical, wry | Слова ничего не стоят |
| dlg_7_2_g.flac | ответ в разговоре | Umbriel | skeptical, wry | Много вас тут обещало |
| dlg_7_2_f_g.flac | ответ в разговоре | Despina | skeptical, wry | Много вас тут обещало |
| dlg_7_3_g.flac | ответ в разговоре | Umbriel | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_3_f_g.flac | ответ в разговоре | Despina | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_4_g.flac | ответ в разговоре (подозрительный) | Umbriel | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_4_f_g.flac | ответ в разговоре (подозрительный) | Despina | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_5_g.flac | ответ в разговоре (жадный) | Umbriel | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_5_f_g.flac | ответ в разговоре (жадный) | Despina | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_6_g.flac | ответ в разговоре (высокомерный) | Umbriel | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_6_f_g.flac | ответ в разговоре (высокомерный) | Despina | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_7_g.flac | ответ в разговоре (помнит обиду) | Umbriel | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_7_f_g.flac | ответ в разговоре (помнит обиду) | Despina | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_8_g.flac | ответ в разговоре (недруг) | Umbriel | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_8_f_g.flac | ответ в разговоре (недруг) | Despina | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_9_g.flac | ответ в разговоре (свой) | Umbriel | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_7_9_f_g.flac | ответ в разговоре (свой) | Despina | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_8_0_g.flac | ответ в разговоре | Umbriel | surprised, conceding | Не думал об этом так |
| dlg_8_0_f_g.flac | ответ в разговоре | Despina | surprised, conceding | Не думала об этом так |
| dlg_8_1_g.flac | ответ в разговоре | Umbriel | surprised, conceding | А ведь вы правы |
| dlg_8_1_f_g.flac | ответ в разговоре | Despina | surprised, conceding | А ведь вы правы |
| dlg_8_2_g.flac | ответ в разговоре | Umbriel | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_2_f_g.flac | ответ в разговоре | Despina | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_3_g.flac | ответ в разговоре | Umbriel | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_3_f_g.flac | ответ в разговоре | Despina | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_4_g.flac | ответ в разговоре (фанатик) | Umbriel | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_4_f_g.flac | ответ в разговоре (фанатик) | Despina | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_6_g.flac | ответ в разговоре (рациональный) | Umbriel | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_6_f_g.flac | ответ в разговоре (рациональный) | Despina | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_7_g.flac | ответ в разговоре (мятежник) | Umbriel | surprised, conceding, rebellious | Вот! Я всегда чувствовал, что всё не так, как нам говорят |
| dlg_8_7_f_g.flac | ответ в разговоре (мятежник) | Despina | surprised, conceding, rebellious | Вот! Я всегда чувствовала, что всё не так, как нам говорят |
| dlg_8_8_g.flac | ответ в разговоре (недруг) | Umbriel | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_8_f_g.flac | ответ в разговоре (недруг) | Despina | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_9_g.flac | ответ в разговоре (свой) | Umbriel | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_9_f_g.flac | ответ в разговоре (свой) | Despina | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_10_g.flac | ответ в разговоре (холоден) | Umbriel | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_8_10_f_g.flac | ответ в разговоре (холоден) | Despina | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_9_0_g.flac | ответ в разговоре | Umbriel | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_0_f_g.flac | ответ в разговоре | Despina | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_1_g.flac | ответ в разговоре | Umbriel | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_1_f_g.flac | ответ в разговоре | Despina | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_2_g.flac | ответ в разговоре | Umbriel | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_2_f_g.flac | ответ в разговоре | Despina | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_3_g.flac | ответ в разговоре | Umbriel | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_3_f_g.flac | ответ в разговоре | Despina | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_4_g.flac | ответ в разговоре (жадный) | Umbriel | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_4_f_g.flac | ответ в разговоре (жадный) | Despina | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_5_g.flac | ответ в разговоре (хитрый) | Umbriel | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_5_f_g.flac | ответ в разговоре (хитрый) | Despina | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_6_g.flac | ответ в разговоре (добрый) | Umbriel | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_6_f_g.flac | ответ в разговоре (добрый) | Despina | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_7_g.flac | ответ в разговоре (рациональный) | Umbriel | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласен |
| dlg_9_7_f_g.flac | ответ в разговоре (рациональный) | Despina | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласна |
| dlg_9_8_g.flac | ответ в разговоре (свой) | Umbriel | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_8_f_g.flac | ответ в разговоре (свой) | Despina | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_9_g.flac | ответ в разговоре (помнит добро) | Umbriel | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_9_f_g.flac | ответ в разговоре (помнит добро) | Despina | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_10_g.flac | ответ в разговоре (холоден) | Umbriel | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_10_f_g.flac | ответ в разговоре (холоден) | Despina | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_11_g.flac | ответ в разговоре (недруг) | Umbriel | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_9_11_f_g.flac | ответ в разговоре (недруг) | Despina | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_10_0_g.flac | ответ в разговоре | Umbriel | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_0_f_g.flac | ответ в разговоре | Despina | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_1_g.flac | ответ в разговоре | Umbriel | firm, businesslike | Ниже не опущу |
| dlg_10_1_f_g.flac | ответ в разговоре | Despina | firm, businesslike | Ниже не опущу |
| dlg_10_2_g.flac | ответ в разговоре | Umbriel | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_2_f_g.flac | ответ в разговоре | Despina | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_3_g.flac | ответ в разговоре | Umbriel | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_3_f_g.flac | ответ в разговоре | Despina | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_4_g.flac | ответ в разговоре (жадный) | Umbriel | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_4_f_g.flac | ответ в разговоре (жадный) | Despina | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_6_g.flac | ответ в разговоре (честный) | Umbriel | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_6_f_g.flac | ответ в разговоре (честный) | Despina | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_7_g.flac | ответ в разговоре (рациональный) | Umbriel | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_7_f_g.flac | ответ в разговоре (рациональный) | Despina | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_8_g.flac | ответ в разговоре (недруг) | Umbriel | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_8_f_g.flac | ответ в разговоре (недруг) | Despina | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_9_g.flac | ответ в разговоре (свой) | Umbriel | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_9_f_g.flac | ответ в разговоре (свой) | Despina | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_10_g.flac | ответ в разговоре (помнит обиду) | Umbriel | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_10_f_g.flac | ответ в разговоре (помнит обиду) | Despina | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_11_g.flac | ответ в разговоре (холоден) | Umbriel | firm, businesslike, cold, curt | Цена сказана |
| dlg_10_11_f_g.flac | ответ в разговоре (холоден) | Despina | firm, businesslike, cold, curt | Цена сказана |
| dlg_11_0_g.flac | ответ в разговоре | Umbriel | conspiratorial, low voice | Я вас не видел |
| dlg_11_0_f_g.flac | ответ в разговоре | Despina | conspiratorial, low voice | Я вас не видела |
| dlg_11_1_g.flac | ответ в разговоре | Umbriel | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_1_f_g.flac | ответ в разговоре | Despina | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_2_g.flac | ответ в разговоре | Umbriel | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_2_f_g.flac | ответ в разговоре | Despina | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_3_g.flac | ответ в разговоре | Umbriel | conspiratorial, low voice | Я глух, слеп и очень занят |
| dlg_11_3_f_g.flac | ответ в разговоре | Despina | conspiratorial, low voice | Я глуха, слепа и очень занята |
| dlg_11_4_g.flac | ответ в разговоре (жадный) | Umbriel | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_4_f_g.flac | ответ в разговоре (жадный) | Despina | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_5_g.flac | ответ в разговоре (трус) | Umbriel | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_5_f_g.flac | ответ в разговоре (трус) | Despina | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_6_g.flac | ответ в разговоре (хитрый) | Umbriel | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_6_f_g.flac | ответ в разговоре (хитрый) | Despina | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_7_g.flac | ответ в разговоре (свой) | Umbriel | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_7_f_g.flac | ответ в разговоре (свой) | Despina | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_8_g.flac | ответ в разговоре (холоден) | Umbriel | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_8_f_g.flac | ответ в разговоре (холоден) | Despina | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_9_g.flac | ответ в разговоре (недруг) | Umbriel | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_11_9_f_g.flac | ответ в разговоре (недруг) | Despina | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_12_0_g.flac | ответ в разговоре | Umbriel | offended, indignant | За кого вы меня держите? |
| dlg_12_0_f_g.flac | ответ в разговоре | Despina | offended, indignant | За кого вы меня держите? |
| dlg_12_1_g.flac | ответ в разговоре | Umbriel | offended, indignant | Уберите это, пока я не позвал стражу |
| dlg_12_1_f_g.flac | ответ в разговоре | Despina | offended, indignant | Уберите это, пока я не позвала стражу |
| dlg_12_2_g.flac | ответ в разговоре | Umbriel | offended, indignant | Меня не купишь |
| dlg_12_2_f_g.flac | ответ в разговоре | Despina | offended, indignant | Меня не купишь |
| dlg_12_3_g.flac | ответ в разговоре | Umbriel | offended, indignant | Деньги держите при себе |
| dlg_12_3_f_g.flac | ответ в разговоре | Despina | offended, indignant | Деньги держите при себе |
| dlg_12_4_g.flac | ответ в разговоре (честный) | Umbriel | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_4_f_g.flac | ответ в разговоре (честный) | Despina | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_6_g.flac | ответ в разговоре (фанатик) | Umbriel | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_6_f_g.flac | ответ в разговоре (фанатик) | Despina | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_7_g.flac | ответ в разговоре (трус) | Umbriel | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_7_f_g.flac | ответ в разговоре (трус) | Despina | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_8_g.flac | ответ в разговоре (свой) | Umbriel | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_8_f_g.flac | ответ в разговоре (свой) | Despina | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_9_g.flac | ответ в разговоре (недруг) | Umbriel | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_9_f_g.flac | ответ в разговоре (недруг) | Despina | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_10_g.flac | ответ в разговоре (помнит добро) | Umbriel | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_12_10_f_g.flac | ответ в разговоре (помнит добро) | Despina | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_13_0_g.flac | ответ в разговоре | Umbriel | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_0_f_g.flac | ответ в разговоре | Despina | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_1_g.flac | ответ в разговоре | Umbriel | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_1_f_g.flac | ответ в разговоре | Despina | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_2_g.flac | ответ в разговоре | Umbriel | correcting, slightly condescending | У нас так не говорят |
| dlg_13_2_f_g.flac | ответ в разговоре | Despina | correcting, slightly condescending | У нас так не говорят |
| dlg_13_3_g.flac | ответ в разговоре | Umbriel | correcting, slightly condescending | Близко, но нет |
| dlg_13_3_f_g.flac | ответ в разговоре | Despina | correcting, slightly condescending | Близко, но нет |
| dlg_13_4_g.flac | ответ в разговоре (высокомерный) | Umbriel | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_4_f_g.flac | ответ в разговоре (высокомерный) | Despina | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_5_g.flac | ответ в разговоре (рациональный) | Umbriel | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_5_f_g.flac | ответ в разговоре (рациональный) | Despina | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_6_g.flac | ответ в разговоре (традиционалист) | Umbriel | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_6_f_g.flac | ответ в разговоре (традиционалист) | Despina | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_7_g.flac | ответ в разговоре (холоден) | Umbriel | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_7_f_g.flac | ответ в разговоре (холоден) | Despina | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_8_g.flac | ответ в разговоре (свой) | Umbriel | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_13_8_f_g.flac | ответ в разговоре (свой) | Despina | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_14_0_g.flac | ответ в разговоре | Umbriel | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_0_f_g.flac | ответ в разговоре | Despina | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_1_g.flac | ответ в разговоре | Umbriel | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_1_f_g.flac | ответ в разговоре | Despina | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_2_g.flac | ответ в разговоре | Umbriel | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_2_f_g.flac | ответ в разговоре | Despina | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_3_g.flac | ответ в разговоре | Umbriel | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_3_f_g.flac | ответ в разговоре | Despina | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_4_g.flac | ответ в разговоре (традиционалист) | Umbriel | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_4_f_g.flac | ответ в разговоре (традиционалист) | Despina | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_5_g.flac | ответ в разговоре (добрый) | Umbriel | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_5_f_g.flac | ответ в разговоре (добрый) | Despina | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_6_g.flac | ответ в разговоре (высокомерный) | Umbriel | pleasantly surprised, warm, haughty | Не ожидал от чужака |
| dlg_14_6_f_g.flac | ответ в разговоре (высокомерный) | Despina | pleasantly surprised, warm, haughty | Не ожидала от чужака |
| dlg_14_7_g.flac | ответ в разговоре (недруг) | Umbriel | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_7_f_g.flac | ответ в разговоре (недруг) | Despina | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_8_g.flac | ответ в разговоре (свой) | Umbriel | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_8_f_g.flac | ответ в разговоре (свой) | Despina | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_9_g.flac | ответ в разговоре (холоден) | Umbriel | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_14_9_f_g.flac | ответ в разговоре (холоден) | Despina | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_15_0_g.flac | ответ в разговоре | Umbriel | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_0_f_g.flac | ответ в разговоре | Despina | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_1_g.flac | ответ в разговоре | Umbriel | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_1_f_g.flac | ответ в разговоре | Despina | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_2_g.flac | ответ в разговоре | Umbriel | suspicious, slow | А дальше? Где остальное? |
| dlg_15_2_f_g.flac | ответ в разговоре | Despina | suspicious, slow | А дальше? Где остальное? |
| dlg_15_3_g.flac | ответ в разговоре | Umbriel | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_3_f_g.flac | ответ в разговоре | Despina | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_4_g.flac | ответ в разговоре (подозрительный) | Umbriel | suspicious, slow, suspicious | Я так и знал, что вы темните |
| dlg_15_4_f_g.flac | ответ в разговоре (подозрительный) | Despina | suspicious, slow, suspicious | Я так и знала, что вы темните |
| dlg_15_5_g.flac | ответ в разговоре (рациональный) | Umbriel | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_5_f_g.flac | ответ в разговоре (рациональный) | Despina | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_6_g.flac | ответ в разговоре (хитрый) | Umbriel | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_6_f_g.flac | ответ в разговоре (хитрый) | Despina | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_7_g.flac | ответ в разговоре (свой) | Umbriel | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_7_f_g.flac | ответ в разговоре (свой) | Despina | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_8_g.flac | ответ в разговоре (недруг) | Umbriel | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_8_f_g.flac | ответ в разговоре (недруг) | Despina | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_9_g.flac | ответ в разговоре (помнит обиду) | Umbriel | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_15_9_f_g.flac | ответ в разговоре (помнит обиду) | Despina | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_16_0_g.flac | ответ в разговоре | Umbriel | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_0_f_g.flac | ответ в разговоре | Despina | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_1_g.flac | ответ в разговоре | Umbriel | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_1_f_g.flac | ответ в разговоре | Despina | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_2_g.flac | ответ в разговоре | Umbriel | contemptuous, cold | Не держите меня за дурака |
| dlg_16_2_f_g.flac | ответ в разговоре | Despina | contemptuous, cold | Не держите меня за дурака |
| dlg_16_3_g.flac | ответ в разговоре | Umbriel | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_3_f_g.flac | ответ в разговоре | Despina | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_4_g.flac | ответ в разговоре (честный) | Umbriel | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_4_f_g.flac | ответ в разговоре (честный) | Despina | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_5_g.flac | ответ в разговоре (хитрый) | Umbriel | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_5_f_g.flac | ответ в разговоре (хитрый) | Despina | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_6_g.flac | ответ в разговоре (жестокий) | Umbriel | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_6_f_g.flac | ответ в разговоре (жестокий) | Despina | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_7_g.flac | ответ в разговоре (подозрительный) | Umbriel | contemptuous, cold, suspicious | Я с первого слова знал, что врёте |
| dlg_16_7_f_g.flac | ответ в разговоре (подозрительный) | Despina | contemptuous, cold, suspicious | Я с первого слова знала, что врёте |
| dlg_16_8_g.flac | ответ в разговоре (свой) | Umbriel | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_8_f_g.flac | ответ в разговоре (свой) | Despina | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_9_g.flac | ответ в разговоре (помнит обиду) | Umbriel | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_9_f_g.flac | ответ в разговоре (помнит обиду) | Despina | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_10_g.flac | ответ в разговоре (недруг) | Umbriel | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_16_10_f_g.flac | ответ в разговоре (недруг) | Despina | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_17_0_g.flac | ответ в разговоре | Umbriel | frightened, pleading | Только не надо... я скажу |
| dlg_17_0_f_g.flac | ответ в разговоре | Despina | frightened, pleading | Только не надо... я скажу |
| dlg_17_1_g.flac | ответ в разговоре | Umbriel | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_1_f_g.flac | ответ в разговоре | Despina | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_2_g.flac | ответ в разговоре | Umbriel | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_2_f_g.flac | ответ в разговоре | Despina | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_3_g.flac | ответ в разговоре | Umbriel | frightened, pleading | Спокойно… договоримся |
| dlg_17_3_f_g.flac | ответ в разговоре | Despina | frightened, pleading | Спокойно… договоримся |
| dlg_17_4_g.flac | ответ в разговоре (трус) | Umbriel | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_4_f_g.flac | ответ в разговоре (трус) | Despina | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_6_g.flac | ответ в разговоре (смелый) | Umbriel | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_6_f_g.flac | ответ в разговоре (смелый) | Despina | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_7_g.flac | ответ в разговоре (недруг) | Umbriel | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_7_f_g.flac | ответ в разговоре (недруг) | Despina | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_8_g.flac | ответ в разговоре (холоден) | Umbriel | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_17_8_f_g.flac | ответ в разговоре (холоден) | Despina | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_18_0_g.flac | ответ в разговоре | Umbriel | defiant, threatening | Убери железо, пока цел |
| dlg_18_0_f_g.flac | ответ в разговоре | Despina | defiant, threatening | Убери железо, пока цел |
| dlg_18_1_g.flac | ответ в разговоре | Umbriel | defiant, threatening | Не на того напал |
| dlg_18_1_f_g.flac | ответ в разговоре | Despina | defiant, threatening | Не на того напал |
| dlg_18_2_g.flac | ответ в разговоре | Umbriel | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_2_f_g.flac | ответ в разговоре | Despina | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_3_g.flac | ответ в разговоре | Umbriel | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_3_f_g.flac | ответ в разговоре | Despina | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_4_g.flac | ответ в разговоре (смелый) | Umbriel | defiant, threatening, bold, confident | Я и не таких видал. Стража! |
| dlg_18_4_f_g.flac | ответ в разговоре (смелый) | Despina | defiant, threatening, bold, confident | Я и не таких видала. Стража! |
| dlg_18_5_g.flac | ответ в разговоре (жестокий) | Umbriel | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_5_f_g.flac | ответ в разговоре (жестокий) | Despina | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_6_g.flac | ответ в разговоре (честный) | Umbriel | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_6_f_g.flac | ответ в разговоре (честный) | Despina | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_7_g.flac | ответ в разговоре (свой) | Umbriel | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_7_f_g.flac | ответ в разговоре (свой) | Despina | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_8_g.flac | ответ в разговоре (помнит обиду) | Umbriel | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_18_8_f_g.flac | ответ в разговоре (помнит обиду) | Despina | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_19_0_g.flac | ответ в разговоре | Umbriel | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_0_f_g.flac | ответ в разговоре | Despina | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_1_g.flac | ответ в разговоре | Umbriel | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_1_f_g.flac | ответ в разговоре | Despina | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_2_g.flac | ответ в разговоре | Umbriel | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_2_f_g.flac | ответ в разговоре | Despina | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_3_g.flac | ответ в разговоре | Umbriel | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_3_f_g.flac | ответ в разговоре | Despina | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_4_g.flac | ответ в разговоре (трус) | Umbriel | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_4_f_g.flac | ответ в разговоре (трус) | Despina | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_5_g.flac | ответ в разговоре (хитрый) | Umbriel | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_5_f_g.flac | ответ в разговоре (хитрый) | Despina | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_6_g.flac | ответ в разговоре (высокомерный) | Umbriel | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_6_f_g.flac | ответ в разговоре (высокомерный) | Despina | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_7_g.flac | ответ в разговоре (недруг) | Umbriel | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_19_7_f_g.flac | ответ в разговоре (недруг) | Despina | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_20_0_g.flac | ответ в разговоре | Umbriel | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_0_f_g.flac | ответ в разговоре | Despina | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_1_g.flac | ответ в разговоре | Umbriel | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_1_f_g.flac | ответ в разговоре | Despina | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_2_g.flac | ответ в разговоре | Umbriel | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_2_f_g.flac | ответ в разговоре | Despina | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_3_g.flac | ответ в разговоре | Umbriel | defiant, bitter | Ищите кого попугливее |
| dlg_20_3_f_g.flac | ответ в разговоре | Despina | defiant, bitter | Ищите кого попугливее |
| dlg_20_4_g.flac | ответ в разговоре (смелый) | Umbriel | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_4_f_g.flac | ответ в разговоре (смелый) | Despina | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_5_g.flac | ответ в разговоре (честный) | Umbriel | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_5_f_g.flac | ответ в разговоре (честный) | Despina | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_6_g.flac | ответ в разговоре (жестокий) | Umbriel | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_6_f_g.flac | ответ в разговоре (жестокий) | Despina | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_7_g.flac | ответ в разговоре (помнит обиду) | Umbriel | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_20_7_f_g.flac | ответ в разговоре (помнит обиду) | Despina | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_21_0_g.flac | ответ в разговоре | Umbriel | angry, threatening | Ещё слово — и будет драка |
| dlg_21_0_f_g.flac | ответ в разговоре | Despina | angry, threatening | Ещё слово — и будет драка |
| dlg_21_1_g.flac | ответ в разговоре | Umbriel | angry, threatening | Не зли меня |
| dlg_21_1_f_g.flac | ответ в разговоре | Despina | angry, threatening | Не зли меня |
| dlg_21_2_g.flac | ответ в разговоре | Umbriel | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_2_f_g.flac | ответ в разговоре | Despina | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_3_g.flac | ответ в разговоре | Umbriel | angry, threatening | Иди своей дорогой |
| dlg_21_3_f_g.flac | ответ в разговоре | Despina | angry, threatening | Иди своей дорогой |
| dlg_21_4_g.flac | ответ в разговоре (жестокий) | Umbriel | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_4_f_g.flac | ответ в разговоре (жестокий) | Despina | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_5_g.flac | ответ в разговоре (добрый) | Umbriel | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_5_f_g.flac | ответ в разговоре (добрый) | Despina | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_6_g.flac | ответ в разговоре (свой) | Umbriel | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_6_f_g.flac | ответ в разговоре (свой) | Despina | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_7_g.flac | ответ в разговоре (недруг) | Umbriel | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_21_7_f_g.flac | ответ в разговоре (недруг) | Despina | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_22_0_g.flac | ответ в разговоре | Umbriel | easygoing, indifferent | Бывает |
| dlg_22_0_f_g.flac | ответ в разговоре | Despina | easygoing, indifferent | Бывает |
| dlg_22_1_g.flac | ответ в разговоре | Umbriel | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_1_f_g.flac | ответ в разговоре | Despina | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_2_g.flac | ответ в разговоре | Umbriel | easygoing, indifferent | Ваше право |
| dlg_22_2_f_g.flac | ответ в разговоре | Despina | easygoing, indifferent | Ваше право |
| dlg_22_3_g.flac | ответ в разговоре | Umbriel | easygoing, indifferent | Понимаю |
| dlg_22_3_f_g.flac | ответ в разговоре | Despina | easygoing, indifferent | Понимаю |
| dlg_22_4_g.flac | ответ в разговоре (добрый) | Umbriel | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_4_f_g.flac | ответ в разговоре (добрый) | Despina | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | easygoing, indifferent, haughty | Как угодно |
| dlg_22_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | easygoing, indifferent, haughty | Как угодно |
| dlg_22_6_g.flac | ответ в разговоре (свой) | Umbriel | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_6_f_g.flac | ответ в разговоре (свой) | Despina | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_7_g.flac | ответ в разговоре (помнит добро) | Umbriel | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_7_f_g.flac | ответ в разговоре (помнит добро) | Despina | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_8_g.flac | ответ в разговоре (холоден) | Umbriel | easygoing, indifferent, cold, curt | Как знаете |
| dlg_22_8_f_g.flac | ответ в разговоре (холоден) | Despina | easygoing, indifferent, cold, curt | Как знаете |
| dlg_23_0_g.flac | ответ в разговоре | Umbriel | impatient, tired | Мы об этом говорили |
| dlg_23_0_f_g.flac | ответ в разговоре | Despina | impatient, tired | Мы об этом говорили |
| dlg_23_1_g.flac | ответ в разговоре | Umbriel | impatient, tired | Я уже ответил вам сегодня |
| dlg_23_1_f_g.flac | ответ в разговоре | Despina | impatient, tired | Я уже ответила вам сегодня |
| dlg_23_2_g.flac | ответ в разговоре | Umbriel | impatient, tired | Опять вы с тем же? |
| dlg_23_2_f_g.flac | ответ в разговоре | Despina | impatient, tired | Опять вы с тем же? |
| dlg_23_3_g.flac | ответ в разговоре | Umbriel | impatient, tired | Сегодня — хватит об этом |
| dlg_23_3_f_g.flac | ответ в разговоре | Despina | impatient, tired | Сегодня — хватит об этом |
| dlg_23_4_g.flac | ответ в разговоре (подозрительный) | Umbriel | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_4_f_g.flac | ответ в разговоре (подозрительный) | Despina | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_5_g.flac | ответ в разговоре (добрый) | Umbriel | impatient, tired, kind, warm | Я же сказал уже — не сердитесь |
| dlg_23_5_f_g.flac | ответ в разговоре (добрый) | Despina | impatient, tired, kind, warm | Я же сказала уже — не сердитесь |
| dlg_23_6_g.flac | ответ в разговоре (жадный) | Umbriel | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_6_f_g.flac | ответ в разговоре (жадный) | Despina | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_7_g.flac | ответ в разговоре (свой) | Umbriel | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_7_f_g.flac | ответ в разговоре (свой) | Despina | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_8_g.flac | ответ в разговоре (недруг) | Umbriel | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_23_8_f_g.flac | ответ в разговоре (недруг) | Despina | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_24_0_g.flac | ответ в разговоре | Umbriel | disappointed, hurt | Я на вас рассчитывал |
| dlg_24_0_f_g.flac | ответ в разговоре | Despina | disappointed, hurt | Я на вас рассчитывала |
| dlg_24_1_g.flac | ответ в разговоре (свой) | Umbriel | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_1_f_g.flac | ответ в разговоре (свой) | Despina | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_2_g.flac | ответ в разговоре (помнит обиду) | Umbriel | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_24_2_f_g.flac | ответ в разговоре (помнит обиду) | Despina | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_25_0_g.flac | ответ в разговоре | Umbriel | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_0_f_g.flac | ответ в разговоре | Despina | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_1_g.flac | ответ в разговоре | Umbriel | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_1_f_g.flac | ответ в разговоре | Despina | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_2_g.flac | ответ в разговоре | Umbriel | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_2_f_g.flac | ответ в разговоре | Despina | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_3_g.flac | ответ в разговоре (жадный) | Umbriel | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_3_f_g.flac | ответ в разговоре (жадный) | Despina | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_4_g.flac | ответ в разговоре (трус) | Umbriel | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_4_f_g.flac | ответ в разговоре (трус) | Despina | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_6_g.flac | ответ в разговоре (свой) | Umbriel | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_6_f_g.flac | ответ в разговоре (свой) | Despina | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_7_g.flac | ответ в разговоре (помнит добро) | Umbriel | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_7_f_g.flac | ответ в разговоре (помнит добро) | Despina | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_8_g.flac | ответ в разговоре (холоден) | Umbriel | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_25_8_f_g.flac | ответ в разговоре (холоден) | Despina | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_26_0_g.flac | ответ в разговоре | Umbriel | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_0_f_g.flac | ответ в разговоре | Despina | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_1_g.flac | ответ в разговоре | Umbriel | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_1_f_g.flac | ответ в разговоре | Despina | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_2_g.flac | ответ в разговоре | Umbriel | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_2_f_g.flac | ответ в разговоре | Despina | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_3_g.flac | ответ в разговоре (рациональный) | Umbriel | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_3_f_g.flac | ответ в разговоре (рациональный) | Despina | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_4_g.flac | ответ в разговоре (свой) | Umbriel | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_4_f_g.flac | ответ в разговоре (свой) | Despina | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_5_g.flac | ответ в разговоре (холоден) | Umbriel | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_26_5_f_g.flac | ответ в разговоре (холоден) | Despina | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_27_0_g.flac | ответ в разговоре | Umbriel | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_0_f_g.flac | ответ в разговоре | Despina | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_1_g.flac | ответ в разговоре | Umbriel | curt, closing the topic | Что было — рассказано |
| dlg_27_1_f_g.flac | ответ в разговоре | Despina | curt, closing the topic | Что было — рассказано |
| dlg_27_2_g.flac | ответ в разговоре | Umbriel | curt, closing the topic | Больше ничего не знаю |
| dlg_27_2_f_g.flac | ответ в разговоре | Despina | curt, closing the topic | Больше ничего не знаю |
| dlg_27_3_g.flac | ответ в разговоре (недруг) | Umbriel | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_3_f_g.flac | ответ в разговоре (недруг) | Despina | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_4_g.flac | ответ в разговоре (свой) | Umbriel | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_27_4_f_g.flac | ответ в разговоре (свой) | Despina | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_28_0_g.flac | ответ в разговоре | Umbriel | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_0_f_g.flac | ответ в разговоре | Despina | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_1_g.flac | ответ в разговоре | Umbriel | worried, grave | В мире всякое творится, слушайте |
| dlg_28_1_f_g.flac | ответ в разговоре | Despina | worried, grave | В мире всякое творится, слушайте |
| dlg_28_2_g.flac | ответ в разговоре | Umbriel | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_2_f_g.flac | ответ в разговоре | Despina | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_3_g.flac | ответ в разговоре (фанатик) | Umbriel | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_3_f_g.flac | ответ в разговоре (фанатик) | Despina | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_4_g.flac | ответ в разговоре (прагматик) | Umbriel | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_4_f_g.flac | ответ в разговоре (прагматик) | Despina | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_5_g.flac | ответ в разговоре (мятежник) | Umbriel | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_5_f_g.flac | ответ в разговоре (мятежник) | Despina | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_6_g.flac | ответ в разговоре (свой) | Umbriel | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_28_6_f_g.flac | ответ в разговоре (свой) | Despina | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_29_0_g.flac | ответ в разговоре | Umbriel | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_0_f_g.flac | ответ в разговоре | Despina | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_1_g.flac | ответ в разговоре | Umbriel | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_1_f_g.flac | ответ в разговоре | Despina | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_2_g.flac | ответ в разговоре | Umbriel | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_2_f_g.flac | ответ в разговоре | Despina | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_3_g.flac | ответ в разговоре (недруг) | Umbriel | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_3_f_g.flac | ответ в разговоре (недруг) | Despina | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_4_g.flac | ответ в разговоре (холоден) | Umbriel | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_29_4_f_g.flac | ответ в разговоре (холоден) | Despina | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_30_0_g.flac | ответ в разговоре | Umbriel | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_0_f_g.flac | ответ в разговоре | Despina | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_1_g.flac | ответ в разговоре | Umbriel | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_1_f_g.flac | ответ в разговоре | Despina | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_2_g.flac | ответ в разговоре | Umbriel | knowing, reassuring | Намёк понят |
| dlg_30_2_f_g.flac | ответ в разговоре | Despina | knowing, reassuring | Намёк понят |
| dlg_30_3_g.flac | ответ в разговоре (хитрый) | Umbriel | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_3_f_g.flac | ответ в разговоре (хитрый) | Despina | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_4_g.flac | ответ в разговоре (свой) | Umbriel | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_30_4_f_g.flac | ответ в разговоре (свой) | Despina | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_31_0_g.flac | ответ в разговоре | Umbriel | convinced, trusting | Раз так — верю вам |
| dlg_31_0_f_g.flac | ответ в разговоре | Despina | convinced, trusting | Раз так — верю вам |
| dlg_31_1_g.flac | ответ в разговоре | Umbriel | convinced, trusting | Ну, если так, другое дело |
| dlg_31_1_f_g.flac | ответ в разговоре | Despina | convinced, trusting | Ну, если так, другое дело |
| dlg_31_2_g.flac | ответ в разговоре | Umbriel | convinced, trusting | Что ж, похоже на правду |
| dlg_31_2_f_g.flac | ответ в разговоре | Despina | convinced, trusting | Что ж, похоже на правду |
| dlg_31_3_g.flac | ответ в разговоре (добрый) | Umbriel | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_3_f_g.flac | ответ в разговоре (добрый) | Despina | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_4_g.flac | ответ в разговоре (свой) | Umbriel | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_31_4_f_g.flac | ответ в разговоре (свой) | Despina | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_32_0_g.flac | ответ в разговоре | Umbriel | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_0_f_g.flac | ответ в разговоре | Despina | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_1_g.flac | ответ в разговоре | Umbriel | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_1_f_g.flac | ответ в разговоре | Despina | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_2_g.flac | ответ в разговоре | Umbriel | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_2_f_g.flac | ответ в разговоре | Despina | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_3_g.flac | ответ в разговоре (жестокий) | Umbriel | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_3_f_g.flac | ответ в разговоре (жестокий) | Despina | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_4_g.flac | ответ в разговоре (недруг) | Umbriel | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_32_4_f_g.flac | ответ в разговоре (недруг) | Despina | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_33_0_g.flac | ответ в разговоре | Umbriel | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_0_f_g.flac | ответ в разговоре | Despina | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_1_g.flac | ответ в разговоре | Umbriel | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_1_f_g.flac | ответ в разговоре | Despina | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_2_g.flac | ответ в разговоре | Umbriel | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_2_f_g.flac | ответ в разговоре | Despina | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_3_g.flac | ответ в разговоре (высокомерный) | Umbriel | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_3_f_g.flac | ответ в разговоре (высокомерный) | Despina | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_4_g.flac | ответ в разговоре (свой) | Umbriel | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_4_f_g.flac | ответ в разговоре (свой) | Despina | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_5_g.flac | ответ в разговоре (недруг) | Umbriel | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_33_5_f_g.flac | ответ в разговоре (недруг) | Despina | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_34_0_g.flac | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_0_f_g.flac | ответ в разговоре | Despina | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_1_g.flac | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_1_f_g.flac | ответ в разговоре | Despina | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_2_g.flac | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_2_f_g.flac | ответ в разговоре | Despina | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_3_g.flac | ответ в разговоре (фанатик) | Umbriel | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_3_f_g.flac | ответ в разговоре (фанатик) | Despina | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_4_g.flac | ответ в разговоре (свой) | Umbriel | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_34_4_f_g.flac | ответ в разговоре (свой) | Despina | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_35_0_g.flac | ответ в разговоре | Umbriel | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_0_f_g.flac | ответ в разговоре | Despina | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_1_g.flac | ответ в разговоре | Umbriel | outraged, indignant, pious | Святотатство! |
| dlg_35_1_f_g.flac | ответ в разговоре | Despina | outraged, indignant, pious | Святотатство! |
| dlg_35_2_g.flac | ответ в разговоре | Umbriel | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_2_f_g.flac | ответ в разговоре | Despina | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_3_g.flac | ответ в разговоре (фанатик) | Umbriel | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_3_f_g.flac | ответ в разговоре (фанатик) | Despina | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_4_g.flac | ответ в разговоре (рациональный) | Umbriel | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_4_f_g.flac | ответ в разговоре (рациональный) | Despina | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_5_g.flac | ответ в разговоре (свой) | Umbriel | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_35_5_f_g.flac | ответ в разговоре (свой) | Despina | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_36_0_g.flac | ответ в разговоре | Umbriel | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_0_f_g.flac | ответ в разговоре | Despina | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_1_g.flac | ответ в разговоре | Umbriel | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_1_f_g.flac | ответ в разговоре | Despina | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_2_g.flac | ответ в разговоре | Umbriel | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_2_f_g.flac | ответ в разговоре | Despina | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_3_g.flac | ответ в разговоре (традиционалист) | Umbriel | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_3_f_g.flac | ответ в разговоре (традиционалист) | Despina | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_4_g.flac | ответ в разговоре (реформатор) | Umbriel | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_4_f_g.flac | ответ в разговоре (реформатор) | Despina | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_5_g.flac | ответ в разговоре (свой) | Umbriel | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_36_5_f_g.flac | ответ в разговоре (свой) | Despina | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_37_0_g.flac | ответ в разговоре | Umbriel | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_0_f_g.flac | ответ в разговоре | Despina | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_1_g.flac | ответ в разговоре | Umbriel | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_1_f_g.flac | ответ в разговоре | Despina | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_2_g.flac | ответ в разговоре | Umbriel | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_2_f_g.flac | ответ в разговоре | Despina | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_3_g.flac | ответ в разговоре (мятежник) | Umbriel | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_3_f_g.flac | ответ в разговоре (мятежник) | Despina | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_4_g.flac | ответ в разговоре (традиционалист) | Umbriel | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_4_f_g.flac | ответ в разговоре (традиционалист) | Despina | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_5_g.flac | ответ в разговоре (недруг) | Umbriel | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_37_5_f_g.flac | ответ в разговоре (недруг) | Despina | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_38_0_g.flac | ответ в разговоре | Umbriel | offended, cold | У нас так не кланяются |
| dlg_38_0_f_g.flac | ответ в разговоре | Despina | offended, cold | У нас так не кланяются |
| dlg_38_1_g.flac | ответ в разговоре | Umbriel | offended, cold | Это что, насмешка? |
| dlg_38_1_f_g.flac | ответ в разговоре | Despina | offended, cold | Это что, насмешка? |
| dlg_38_2_g.flac | ответ в разговоре | Umbriel | offended, cold | Не знаете обычаев — не берите |
| dlg_38_2_f_g.flac | ответ в разговоре | Despina | offended, cold | Не знаете обычаев — не берите |
| dlg_38_3_g.flac | ответ в разговоре (высокомерный) | Umbriel | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_3_f_g.flac | ответ в разговоре (высокомерный) | Despina | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_4_g.flac | ответ в разговоре (свой) | Umbriel | offended, cold, warm, friendly | Ничего, научишься |
| dlg_38_4_f_g.flac | ответ в разговоре (свой) | Despina | offended, cold, warm, friendly | Ничего, научишься |
| dlg_39_0_g.flac | ответ в разговоре | Umbriel | satisfied, businesslike | По рукам, договорились |
| dlg_39_0_f_g.flac | ответ в разговоре | Despina | satisfied, businesslike | По рукам, договорились |
| dlg_39_1_g.flac | ответ в разговоре | Umbriel | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_1_f_g.flac | ответ в разговоре | Despina | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_2_g.flac | ответ в разговоре | Umbriel | satisfied, businesslike | Уговор так уговор |
| dlg_39_2_f_g.flac | ответ в разговоре | Despina | satisfied, businesslike | Уговор так уговор |
| dlg_39_3_g.flac | ответ в разговоре (жадный) | Umbriel | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_3_f_g.flac | ответ в разговоре (жадный) | Despina | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_4_g.flac | ответ в разговоре (свой) | Umbriel | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_4_f_g.flac | ответ в разговоре (свой) | Despina | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_5_g.flac | ответ в разговоре (недруг) | Umbriel | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_39_5_f_g.flac | ответ в разговоре (недруг) | Despina | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_40_0_g.flac | ответ в разговоре | Umbriel | firm, dissatisfied | Так не договоримся |
| dlg_40_0_f_g.flac | ответ в разговоре | Despina | firm, dissatisfied | Так не договоримся |
| dlg_40_1_g.flac | ответ в разговоре | Umbriel | firm, dissatisfied | Мне это не с руки |
| dlg_40_1_f_g.flac | ответ в разговоре | Despina | firm, dissatisfied | Мне это не с руки |
| dlg_40_2_g.flac | ответ в разговоре | Umbriel | firm, dissatisfied | Ищите другой уговор |
| dlg_40_2_f_g.flac | ответ в разговоре | Despina | firm, dissatisfied | Ищите другой уговор |
| dlg_40_3_g.flac | ответ в разговоре (недруг) | Umbriel | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_3_f_g.flac | ответ в разговоре (недруг) | Despina | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_4_g.flac | ответ в разговоре (свой) | Umbriel | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_40_4_f_g.flac | ответ в разговоре (свой) | Despina | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_41_0_g.flac | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_0_f_g.flac | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_1_g.flac | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_1_f_g.flac | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_2_g.flac | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_2_f_g.flac | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_3_g.flac | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_3_f_g.flac | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_4_g.flac | ответ в разговоре (фанатик) | Umbriel | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_4_f_g.flac | ответ в разговоре (фанатик) | Despina | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_5_g.flac | ответ в разговоре (высокомерный) | Umbriel | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_5_f_g.flac | ответ в разговоре (высокомерный) | Despina | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_6_g.flac | ответ в разговоре (рациональный) | Umbriel | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_6_f_g.flac | ответ в разговоре (рациональный) | Despina | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_7_g.flac | ответ в разговоре (трус) | Umbriel | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_7_f_g.flac | ответ в разговоре (трус) | Despina | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_8_g.flac | ответ в разговоре (свой) | Umbriel | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_8_f_g.flac | ответ в разговоре (свой) | Despina | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_9_g.flac | ответ в разговоре (помнит добро) | Umbriel | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_9_f_g.flac | ответ в разговоре (помнит добро) | Despina | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_10_g.flac | ответ в разговоре (холоден) | Umbriel | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_10_f_g.flac | ответ в разговоре (холоден) | Despina | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_11_g.flac | ответ в разговоре (недруг) | Umbriel | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_41_11_f_g.flac | ответ в разговоре (недруг) | Despina | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_42_0_g.flac | ответ в разговоре | Umbriel | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_0_f_g.flac | ответ в разговоре | Despina | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_1_g.flac | ответ в разговоре | Umbriel | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_1_f_g.flac | ответ в разговоре | Despina | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_2_g.flac | ответ в разговоре | Umbriel | dismissive, busy | Не знаю я старины |
| dlg_42_2_f_g.flac | ответ в разговоре | Despina | dismissive, busy | Не знаю я старины |
| dlg_42_3_g.flac | ответ в разговоре (высокомерный) | Umbriel | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_3_f_g.flac | ответ в разговоре (высокомерный) | Despina | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_4_g.flac | ответ в разговоре (недруг) | Umbriel | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_4_f_g.flac | ответ в разговоре (недруг) | Despina | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_5_g.flac | ответ в разговоре (свой) | Umbriel | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| dlg_42_5_f_g.flac | ответ в разговоре (свой) | Despina | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| hero_istoriya_g.flac | герой: ход «Спросить об истории» | Algieba | curious, respectful | Расскажи, что было в этих краях прежде. |
| street_guard_0_v1_g.flac | стражник | Orus | watchful, gruff warning | Ходи да оглядывайся. |
| street_guard_0_v2_g.flac | стражник | Algenib | watchful, gruff warning | Ходи да оглядывайся. |
| street_guard_1_v1_g.flac | стражник | Orus | proud, dutiful | Порядок на улицах — моя забота. |
| street_guard_1_v2_g.flac | стражник | Algenib | proud, dutiful | Порядок на улицах — моя забота. |
| street_guard_2_v1_g.flac | стражник | Orus | serious, caring advice | Ночью держись освещённых улиц. |
| street_guard_2_v2_g.flac | стражник | Algenib | serious, caring advice | Ночью держись освещённых улиц. |
| street_guard_3_v1_g.flac | стражник | Orus | impatient, brusque | Проходи, не задерживайся у ворот. |
| street_guard_3_v2_g.flac | стражник | Algenib | impatient, brusque | Проходи, не задерживайся у ворот. |
| street_guard_4_v1_g.flac | стражник | Orus | alert, a little worried | Слышал шум у дальнего квартала? Проверю. |
| street_guard_4_v2_g.flac | стражник | Algenib | alert, a little worried | Слышал шум у дальнего квартала? Проверю. |
| street_guard_5_v1_g.flac | стражник | Orus | dry, stern warning | Оружие в ножнах держи — целее будешь. |
| street_guard_5_v2_g.flac | стражник | Algenib | dry, stern warning | Оружие в ножнах держи — целее будешь. |
| street_guard_6_v1_g.flac | стражник | Orus | helpful, lowered voice, warning | Карманники нынче у рынка. Кошель к поясу. |
| street_guard_6_v2_g.flac | стражник | Algenib | helpful, lowered voice, warning | Карманники нынче у рынка. Кошель к поясу. |
| street_guard_7_v1_g.flac | стражник | Orus | dry, matter-of-fact | Драк не затевать. Остальное — твоё дело. |
| street_guard_7_v2_g.flac | стражник | Algenib | dry, matter-of-fact | Драк не затевать. Остальное — твоё дело. |
| street_guard_8_v1_g.flac | стражник | Orus | businesslike, stern | Видел что подозрительное — скажи. |
| street_guard_8_v2_g.flac | стражник | Algenib | businesslike, stern | Видел что подозрительное — скажи. |
| street_guard_9_v1_g.flac | стражник | Orus | tired, sighing | Смена кончается, а ночь только начинается. |
| street_guard_9_v2_g.flac | стражник | Algenib | tired, sighing | Смена кончается, а ночь только начинается. |
| street_guard_10_v1_g.flac | стражник | Orus | strict, official | Кто без огня после заката — того спрашиваем. |
| street_guard_10_v2_g.flac | стражник | Algenib | strict, official | Кто без огня после заката — того спрашиваем. |
| street_guard_11_v1_g.flac | стражник | Orus | firm reminder | Ворота на ночь запираем. Не опоздай. |
| street_guard_11_v2_g.flac | стражник | Algenib | firm reminder | Ворота на ночь запираем. Не опоздай. |
| street_guard_12_v1_g.flac | стражник | Orus | loud, commanding the crowd | Не толпиться! Проходим по одному. |
| street_guard_12_v2_g.flac | стражник | Algenib | loud, commanding the crowd | Не толпиться! Проходим по одному. |
| street_guard_13_v1_g.flac | стражник | Orus | dry, sardonic | Жалобы — к сотнику. А лучше без жалоб. |
| street_guard_13_v2_g.flac | стражник | Algenib | dry, sardonic | Жалобы — к сотнику. А лучше без жалоб. |
| street_guard_14_v1_g.flac | стражник | Orus | annoyed, grumbling | Опять телега на мостовой. Чья, не знаешь? |
| street_guard_14_v2_g.flac | стражник | Algenib | annoyed, grumbling | Опять телега на мостовой. Чья, не знаешь? |
| street_guard_15_v1_g.flac | стражник | Orus | dry humour, suspicious | Спокойно у нас. Пока ты тут не появился. |
| street_guard_15_v2_g.flac | стражник | Algenib | dry humour, suspicious | Спокойно у нас. Пока ты тут не появился. |
| street_guard_16_v1_g.flac | стражник | Orus | gruff, decisive | Пьяных — в холодную до утра. Всех. |
| street_guard_16_v2_g.flac | стражник | Algenib | gruff, decisive | Пьяных — в холодную до утра. Всех. |
| street_guard_17_v1_g.flac | стражник | Orus | concerned, lowered voice | Слыхал, за стеной волков видели. Держись дорог. |
| street_guard_17_v2_g.flac | стражник | Algenib | concerned, lowered voice | Слыхал, за стеной волков видели. Держись дорог. |
| street_guardcold_0_v1_g.flac | стражник недругу | Orus | cold, suspicious, threatening | Я тебя запомнил. Веди себя тихо. |
| street_guardcold_0_v2_g.flac | стражник недругу | Algenib | cold, suspicious, threatening | Я тебя запомнил. Веди себя тихо. |
| street_guardcold_1_v1_g.flac | стражник недругу | Orus | cold, suspicious, threatening | Глаз с тебя не спущу. |
| street_guardcold_1_v2_g.flac | стражник недругу | Algenib | cold, suspicious, threatening | Глаз с тебя не спущу. |
| street_guardcold_2_v1_g.flac | стражник недругу | Orus | cold, suspicious, threatening | Ещё раз увижу — спрошу по-другому. |
| street_guardcold_2_v2_g.flac | стражник недругу | Algenib | cold, suspicious, threatening | Ещё раз увижу — спрошу по-другому. |
| street_guardfriend_6_v1_g.flac | стражник своему | Orus | warm, friendly, relaxed | Доброго дня. Если что — зовите. |
| street_guardfriend_6_v2_g.flac | стражник своему | Algenib | warm, friendly, relaxed | Доброго дня. Если что — зовите. |
| street_night_0_v1_g.flac | ночной дозор | Orus | stern, wary, calling out at night | Поздно бродишь. Назови себя или ступай своей дорогой. |
| street_night_0_v2_g.flac | ночной дозор | Algenib | stern, wary, calling out at night | Поздно бродишь. Назови себя или ступай своей дорогой. |
| street_darkguard_0_v1_g.flac | латник смены | Schedar | cold, flat, commanding | Имя. Смену назови. |
| street_darkguard_1_v1_g.flac | латник смены | Schedar | cold, ominous, quiet | Ты не записан. Пока не записан. |
| street_darkguard_2_v1_g.flac | латник смены | Schedar | cold, detached, menacing | Ходишь — ходи. Остановишься — сочтут. |
| street_darkguard_3_v1_g.flac | латник смены | Schedar | flat, clipped, advising | К стене ближе. По середине ходят те, кого ищут. |
| street_darkguard_4_v1_g.flac | латник смены | Schedar | cold, grim, ominous | Ночью ворота закрыты изнутри. Снаружи их не закрывают. |
| street_darkguard_5_v1_g.flac | латник смены | Schedar | flat, strangely approving | Оружие видно. Это хорошо: прятать хуже. |
| street_guard_18_g.flac | стражник | Alnilam | curt, stern | Доброго дня. Не шуми тут. |
| street_guard_18_v1_g.flac | стражник | Orus | curt, stern | Доброго дня. Не шуми тут. |
| street_guard_18_v2_g.flac | стражник | Algenib | curt, stern | Доброго дня. Не шуми тут. |
| street_guard_19_g.flac | стражник | Alnilam | impatient, brusque | Проходи, проходи. Тут тебе не ярмарка. |
| street_guard_19_v1_g.flac | стражник | Orus | impatient, brusque | Проходи, проходи. Тут тебе не ярмарка. |
| street_guard_19_v2_g.flac | стражник | Algenib | impatient, brusque | Проходи, проходи. Тут тебе не ярмарка. |
| street_guard_20_g.flac | стражник | Alnilam | uneasy, watchful | Тихо сегодня. Даже слишком тихо. |
| street_guard_20_v1_g.flac | стражник | Orus | uneasy, watchful | Тихо сегодня. Даже слишком тихо. |
| street_guard_20_v2_g.flac | стражник | Algenib | uneasy, watchful | Тихо сегодня. Даже слишком тихо. |
| street_guard_21_g.flac | стражник | Alnilam | suspicious, then dismissive | Что в мешке? Ладно, ступай. |
| street_guard_21_v1_g.flac | стражник | Orus | suspicious, then dismissive | Что в мешке? Ладно, ступай. |
| street_guard_21_v2_g.flac | стражник | Algenib | suspicious, then dismissive | Что в мешке? Ладно, ступай. |
| street_guard_22_g.flac | стражник | Alnilam | dry, dutiful | Капитан велел глядеть в оба. Вот и гляжу. |
| street_guard_22_v1_g.flac | стражник | Orus | dry, dutiful | Капитан велел глядеть в оба. Вот и гляжу. |
| street_guard_22_v2_g.flac | стражник | Algenib | dry, dutiful | Капитан велел глядеть в оба. Вот и гляжу. |
| street_guard_23_g.flac | стражник | Alnilam | gruff, commanding | Проход не загораживай. |
| street_guard_23_v1_g.flac | стражник | Orus | gruff, commanding | Проход не загораживай. |
| street_guard_23_v2_g.flac | стражник | Algenib | gruff, commanding | Проход не загораживай. |
| street_guard_24_g.flac | стражник | Alnilam | reassuring, protective | Пристанет кто — кричи. Мы рядом. |
| street_guard_24_v1_g.flac | стражник | Orus | reassuring, protective | Пристанет кто — кричи. Мы рядом. |
| street_guard_24_v2_g.flac | стражник | Algenib | reassuring, protective | Пристанет кто — кричи. Мы рядом. |
| street_guard_25_g.flac | стражник | Alnilam | grumbling, warning | Вчера на рынке опять кошель срезали. |
| street_guard_25_v1_g.flac | стражник | Orus | grumbling, warning | Вчера на рынке опять кошель срезали. |
| street_guard_25_v2_g.flac | стражник | Algenib | grumbling, warning | Вчера на рынке опять кошель срезали. |
| street_guard_26_g.flac | стражник | Alnilam | dry, meaningful warning | Мы тебя видим. Помни об этом. |
| street_guard_26_v1_g.flac | стражник | Orus | dry, meaningful warning | Мы тебя видим. Помни об этом. |
| street_guard_26_v2_g.flac | стражник | Algenib | dry, meaningful warning | Мы тебя видим. Помни об этом. |
| street_guard_27_g.flac | стражник | Alnilam | calm, neutral | Иди своей дорогой, путник. |
| street_guard_27_v1_g.flac | стражник | Orus | calm, neutral | Иди своей дорогой, путник. |
| street_guard_27_v2_g.flac | стражник | Algenib | calm, neutral | Иди своей дорогой, путник. |
| street_guard_28_g.flac | стражник | Alnilam | strict, official | Клинок не обнажать. Закон для всех один. |
| street_guard_28_v1_g.flac | стражник | Orus | strict, official | Клинок не обнажать. Закон для всех один. |
| street_guard_28_v2_g.flac | стражник | Algenib | strict, official | Клинок не обнажать. Закон для всех один. |
| street_guard_29_g.flac | стражник | Alnilam | loud, annoyed shout | Эй, не бегать! Людей посшибаешь. |
| street_guard_29_v1_g.flac | стражник | Orus | loud, annoyed shout | Эй, не бегать! Людей посшибаешь. |
| street_guard_29_v2_g.flac | стражник | Algenib | loud, annoyed shout | Эй, не бегать! Людей посшибаешь. |
| street_guard_30_g.flac | стражник | Alnilam | proud, stern | Этот квартал под нашим присмотром. |
| street_guard_30_v1_g.flac | стражник | Orus | proud, stern | Этот квартал под нашим присмотром. |
| street_guard_30_v2_g.flac | стражник | Algenib | proud, stern | Этот квартал под нашим присмотром. |
| street_guard_31_g.flac | стражник | Alnilam | weary, wry | Доспех тяжёлый, а служба ещё тяжелее. |
| street_guard_31_v1_g.flac | стражник | Orus | weary, wry | Доспех тяжёлый, а служба ещё тяжелее. |
| street_guard_31_v2_g.flac | стражник | Algenib | weary, wry | Доспех тяжёлый, а служба ещё тяжелее. |
| street_guard_32_g.flac | стражник | Alnilam | tired, grumbling | Третий обход за день. Ноги гудят. |
| street_guard_32_v1_g.flac | стражник | Orus | tired, grumbling | Третий обход за день. Ноги гудят. |
| street_guard_32_v2_g.flac | стражник | Algenib | tired, grumbling | Третий обход за день. Ноги гудят. |
| street_guard_33_g.flac | стражник | Alnilam | concerned, lowered voice | На тракте опять разбойники. Слыхал? |
| street_guard_33_v1_g.flac | стражник | Orus | concerned, lowered voice | На тракте опять разбойники. Слыхал? |
| street_guard_33_v2_g.flac | стражник | Algenib | concerned, lowered voice | На тракте опять разбойники. Слыхал? |
| street_guard_34_g.flac | стражник | Alnilam | dry, sardonic advice | Не ищи неприятностей — они сами найдут. |
| street_guard_34_v1_g.flac | стражник | Orus | dry, sardonic advice | Не ищи неприятностей — они сами найдут. |
| street_guard_34_v2_g.flac | стражник | Algenib | dry, sardonic advice | Не ищи неприятностей — они сами найдут. |
| street_guard_35_g.flac | стражник | Alnilam | calm, routine | Всё спокойно. Проходи. |
| street_guard_35_v1_g.flac | стражник | Orus | calm, routine | Всё спокойно. Проходи. |
| street_guard_35_v2_g.flac | стражник | Algenib | calm, routine | Всё спокойно. Проходи. |
| street_guard_36_g.flac | стражник | Alnilam | friendly, slightly amused | Приезжий? Смотри, не заблудись в переулках. |
| street_guard_36_v1_g.flac | стражник | Orus | friendly, slightly amused | Приезжий? Смотри, не заблудись в переулках. |
| street_guard_36_v2_g.flac | стражник | Algenib | friendly, slightly amused | Приезжий? Смотри, не заблудись в переулках. |
| street_guard_37_g.flac | стражник | Alnilam | suspicious, watchful | Чужих нынче много. Смотрю за каждым. |
| street_guard_37_v1_g.flac | стражник | Orus | suspicious, watchful | Чужих нынче много. Смотрю за каждым. |
| street_guard_37_v2_g.flac | стражник | Algenib | suspicious, watchful | Чужих нынче много. Смотрю за каждым. |
| street_guard_38_g.flac | стражник | Alnilam | stern, then satisfied | Пошлину у ворот заплатил? То-то же. |
| street_guard_38_v1_g.flac | стражник | Orus | stern, then satisfied | Пошлину у ворот заплатил? То-то же. |
| street_guard_38_v2_g.flac | стражник | Algenib | stern, then satisfied | Пошлину у ворот заплатил? То-то же. |
| street_guard_39_g.flac | стражник | Alnilam | brusque, impatient | Шагай, шагай. Не на что тут глазеть. |
| street_guard_39_v1_g.flac | стражник | Orus | brusque, impatient | Шагай, шагай. Не на что тут глазеть. |
| street_guard_39_v2_g.flac | стражник | Algenib | brusque, impatient | Шагай, шагай. Не на что тут глазеть. |
| street_guardnight_0_g.flac | стражник ночью | Alnilam | sharp challenge, then relaxed | Стой! Кто идёт? А, путник. Ступай. |
| street_guardnight_0_v1_g.flac | стражник ночью | Orus | sharp challenge, then relaxed | Стой! Кто идёт? А, путник. Ступай. |
| street_guardnight_0_v2_g.flac | стражник ночью | Algenib | sharp challenge, then relaxed | Стой! Кто идёт? А, путник. Ступай. |
| street_guardnight_1_g.flac | стражник ночью | Alnilam | stern, wary | Поздно гуляешь. Шёл бы под крышу. |
| street_guardnight_1_v1_g.flac | стражник ночью | Orus | stern, wary | Поздно гуляешь. Шёл бы под крышу. |
| street_guardnight_1_v2_g.flac | стражник ночью | Algenib | stern, wary | Поздно гуляешь. Шёл бы под крышу. |
| street_guardnight_2_g.flac | стражник ночью | Alnilam | gruff, caring | Фонарь бы тебе. В темноте всякое бывает. |
| street_guardnight_2_v1_g.flac | стражник ночью | Orus | gruff, caring | Фонарь бы тебе. В темноте всякое бывает. |
| street_guardnight_2_v2_g.flac | стражник ночью | Algenib | gruff, caring | Фонарь бы тебе. В темноте всякое бывает. |
| street_guardnight_3_g.flac | стражник ночью | Alnilam | stern warning | Ночью по переулкам не шастай. |
| street_guardnight_3_v1_g.flac | стражник ночью | Orus | stern warning | Ночью по переулкам не шастай. |
| street_guardnight_3_v2_g.flac | стражник ночью | Algenib | stern warning | Ночью по переулкам не шастай. |
| street_guardnight_4_g.flac | стражник ночью | Alnilam | hushed, stern | Тише. Город спит. |
| street_guardnight_4_v1_g.flac | стражник ночью | Orus | hushed, stern | Тише. Город спит. |
| street_guardnight_4_v2_g.flac | стражник ночью | Algenib | hushed, stern | Тише. Город спит. |
| street_guardnight_5_g.flac | стражник ночью | Alnilam | tired, sighing | Ночь длинная, а смена ещё длиннее. |
| street_guardnight_5_v1_g.flac | стражник ночью | Orus | tired, sighing | Ночь длинная, а смена ещё длиннее. |
| street_guardnight_5_v2_g.flac | стражник ночью | Algenib | tired, sighing | Ночь длинная, а смена ещё длиннее. |
| street_guardnight_6_g.flac | стражник ночью | Alnilam | suspicious, demanding | Что забыл на улице в такой час? |
| street_guardnight_6_v1_g.flac | стражник ночью | Orus | suspicious, demanding | Что забыл на улице в такой час? |
| street_guardnight_6_v2_g.flac | стражник ночью | Algenib | suspicious, demanding | Что забыл на улице в такой час? |
| street_guardnight_7_g.flac | стражник ночью | Alnilam | lowered voice, warning | Держись света. В тени нынче неспокойно. |
| street_guardnight_7_v1_g.flac | стражник ночью | Orus | lowered voice, warning | Держись света. В тени нынче неспокойно. |
| street_guardnight_7_v2_g.flac | стражник ночью | Algenib | lowered voice, warning | Держись света. В тени нынче неспокойно. |
| street_guardnight_8_g.flac | стражник ночью | Alnilam | firm, official | Ворота заперты до рассвета. |
| street_guardnight_8_v1_g.flac | стражник ночью | Orus | firm, official | Ворота заперты до рассвета. |
| street_guardnight_8_v2_g.flac | стражник ночью | Algenib | firm, official | Ворота заперты до рассвета. |
| street_guardnight_9_g.flac | стражник ночью | Alnilam | calm, confident | Ступай. Ночной дозор своё дело знает. |
| street_guardnight_9_v1_g.flac | стражник ночью | Orus | calm, confident | Ступай. Ночной дозор своё дело знает. |
| street_guardnight_9_v2_g.flac | стражник ночью | Algenib | calm, confident | Ступай. Ночной дозор своё дело знает. |
| street_guardfriend_7_g.flac | стражник своему | Alnilam | glad, warm | А, это ты! Рад видеть. |
| street_guardfriend_7_v1_g.flac | стражник своему | Orus | glad, warm | А, это ты! Рад видеть. |
| street_guardfriend_7_v2_g.flac | стражник своему | Algenib | glad, warm | А, это ты! Рад видеть. |
| street_guardfriend_8_g.flac | стражник своему | Alnilam | relaxed, friendly | Спокойно у нас, друг. Отдыхай. |
| street_guardfriend_8_v1_g.flac | стражник своему | Orus | relaxed, friendly | Спокойно у нас, друг. Отдыхай. |
| street_guardfriend_8_v2_g.flac | стражник своему | Algenib | relaxed, friendly | Спокойно у нас, друг. Отдыхай. |
| street_guardfriend_9_g.flac | стражник своему | Alnilam | protective, friendly | Будут обижать — только скажи. |
| street_guardfriend_9_v1_g.flac | стражник своему | Orus | protective, friendly | Будут обижать — только скажи. |
| street_guardfriend_9_v2_g.flac | стражник своему | Algenib | protective, friendly | Будут обижать — только скажи. |
| street_guardfriend_10_g.flac | стражник своему | Alnilam | warm, welcoming | Своим у нас всегда рады. |
| street_guardfriend_10_v1_g.flac | стражник своему | Orus | warm, welcoming | Своим у нас всегда рады. |
| street_guardfriend_10_v2_g.flac | стражник своему | Algenib | warm, welcoming | Своим у нас всегда рады. |
| street_guardfriend_11_g.flac | стражник своему | Alnilam | cheerful greeting | Здорово! Как дорога? |
| street_guardfriend_11_v1_g.flac | стражник своему | Orus | cheerful greeting | Здорово! Как дорога? |
| street_guardfriend_11_v2_g.flac | стражник своему | Algenib | cheerful greeting | Здорово! Как дорога? |
| street_guardfriend_12_g.flac | стражник своему | Alnilam | respectful, admiring | Слыхал о твоих делах. Уважаю. |
| street_guardfriend_12_v1_g.flac | стражник своему | Orus | respectful, admiring | Слыхал о твоих делах. Уважаю. |
| street_guardfriend_12_v2_g.flac | стражник своему | Algenib | respectful, admiring | Слыхал о твоих делах. Уважаю. |
| street_guardfriend_13_g.flac | стражник своему | Alnilam | hearty, inviting | Заглядывай в караулку, угостим. |
| street_guardfriend_13_v1_g.flac | стражник своему | Orus | hearty, inviting | Заглядывай в караулку, угостим. |
| street_guardfriend_13_v2_g.flac | стражник своему | Algenib | hearty, inviting | Заглядывай в караулку, угостим. |
| street_guardcold_3_g.flac | стражник недругу | Alnilam | cold, suspicious, commanding | Руки держи на виду. |
| street_guardcold_3_v1_g.flac | стражник недругу | Orus | cold, suspicious, commanding | Руки держи на виду. |
| street_guardcold_3_v2_g.flac | стражник недругу | Algenib | cold, suspicious, commanding | Руки держи на виду. |
| street_guardcold_4_g.flac | стражник недругу | Alnilam | contemptuous, cold | Таких, как ты, у нас не жалуют. |
| street_guardcold_4_v1_g.flac | стражник недругу | Orus | contemptuous, cold | Таких, как ты, у нас не жалуют. |
| street_guardcold_4_v2_g.flac | стражник недругу | Algenib | contemptuous, cold | Таких, как ты, у нас не жалуют. |
| street_guardcold_5_g.flac | стражник недругу | Alnilam | threatening, low voice | Одно неверное движение — и в холодную. |
| street_guardcold_5_v1_g.flac | стражник недругу | Orus | threatening, low voice | Одно неверное движение — и в холодную. |
| street_guardcold_5_v2_g.flac | стражник недругу | Algenib | threatening, low voice | Одно неверное движение — и в холодную. |
| street_guardcold_6_g.flac | стражник недругу | Alnilam | hostile, menacing | Проваливай, пока цел. |
| street_guardcold_6_v1_g.flac | стражник недругу | Orus | hostile, menacing | Проваливай, пока цел. |
| street_guardcold_6_v2_g.flac | стражник недругу | Algenib | hostile, menacing | Проваливай, пока цел. |
| street_guardcold_7_g.flac | стражник недругу | Alnilam | cold, hostile | Тебе здесь не рады. Запомни. |
| street_guardcold_7_v1_g.flac | стражник недругу | Orus | cold, hostile | Тебе здесь не рады. Запомни. |
| street_guardcold_7_v2_g.flac | стражник недругу | Algenib | cold, hostile | Тебе здесь не рады. Запомни. |
| street_guardhurt_0_g.flac | стражник раненому | Alnilam | concerned, urging | Ранен? Лекарь в городе есть, не тяни. |
| street_guardhurt_0_v1_g.flac | стражник раненому | Orus | concerned, urging | Ранен? Лекарь в городе есть, не тяни. |
| street_guardhurt_0_v2_g.flac | стражник раненому | Algenib | concerned, urging | Ранен? Лекарь в городе есть, не тяни. |
| street_guardhurt_1_g.flac | стражник раненому | Alnilam | sympathetic, gruff | Эк тебя потрепало. Сходи к лекарю. |
| street_guardhurt_1_v1_g.flac | стражник раненому | Orus | sympathetic, gruff | Эк тебя потрепало. Сходи к лекарю. |
| street_guardhurt_1_v2_g.flac | стражник раненому | Algenib | sympathetic, gruff | Эк тебя потрепало. Сходи к лекарю. |
| street_guardhurt_2_g.flac | стражник раненому | Alnilam | suspicious, surprised | Кровь на тебе. Дрался, что ли? |
| street_guardhurt_2_v1_g.flac | стражник раненому | Orus | suspicious, surprised | Кровь на тебе. Дрался, что ли? |
| street_guardhurt_2_v2_g.flac | стражник раненому | Algenib | suspicious, surprised | Кровь на тебе. Дрался, что ли? |
| street_guardrain_0_g.flac | стражник под дождём | Alnilam | grumbling, wet and miserable | Льёт как из ведра, а служба идёт. |
| street_guardrain_0_v1_g.flac | стражник под дождём | Orus | grumbling, wet and miserable | Льёт как из ведра, а служба идёт. |
| street_guardrain_0_v2_g.flac | стражник под дождём | Algenib | grumbling, wet and miserable | Льёт как из ведра, а служба идёт. |
| street_guardrain_1_g.flac | стражник под дождём | Alnilam | annoyed, grumbling | Доспех ржавеет от такой сырости. |
| street_guardrain_1_v1_g.flac | стражник под дождём | Orus | annoyed, grumbling | Доспех ржавеет от такой сырости. |
| street_guardrain_1_v2_g.flac | стражник под дождём | Algenib | annoyed, grumbling | Доспех ржавеет от такой сырости. |
| street_guardrain_2_g.flac | стражник под дождём | Alnilam | weary, sighing | Под навес бы, да смена не кончилась. |
| street_guardrain_2_v1_g.flac | стражник под дождём | Orus | weary, sighing | Под навес бы, да смена не кончилась. |
| street_guardrain_2_v2_g.flac | стражник под дождём | Algenib | weary, sighing | Под навес бы, да смена не кончилась. |
| street_darkguard_6_g.flac | латник смены | Charon | cold, clipped command | Стоять. Глаза вниз. |
| street_darkguard_6_v1_g.flac | латник смены | Schedar | cold, clipped command | Стоять. Глаза вниз. |
| street_darkguard_7_g.flac | латник смены | Charon | cold, ominous | Твоё имя уже в списке. Или скоро будет. |
| street_darkguard_7_v1_g.flac | латник смены | Schedar | cold, ominous | Твоё имя уже в списке. Или скоро будет. |
| street_darkguard_8_g.flac | латник смены | Charon | flat, menacing | Шаг в сторону — и смена тебя запомнит. |
| street_darkguard_8_v1_g.flac | латник смены | Schedar | flat, menacing | Шаг в сторону — и смена тебя запомнит. |
| street_darkguard_9_g.flac | латник смены | Charon | cold, flat | Здесь не ходят без дела. |
| street_darkguard_9_v1_g.flac | латник смены | Schedar | cold, flat | Здесь не ходят без дела. |
| street_darkguard_10_g.flac | латник смены | Charon | cold, suspicious, ominous | Ты чужой. Чужих у нас считают дважды. |
| street_darkguard_10_v1_g.flac | латник смены | Schedar | cold, suspicious, ominous | Ты чужой. Чужих у нас считают дважды. |
| street_darkguard_11_g.flac | латник смены | Charon | cold, grudging | Проходи. Пока проходи. |
| street_darkguard_11_v1_g.flac | латник смены | Schedar | cold, grudging | Проходи. Пока проходи. |
| greet_postoyan_0_g.flac | приветствие: постоянному покупателю | Umbriel | warm, delighted | А, мой лучший покупатель! Заходи. |
| greet_postoyan_0_f_g.flac | приветствие: постоянному покупателю | Despina | warm, delighted | А, мой лучший покупатель! Заходи. |
| greet_postoyan_1_g.flac | приветствие: постоянному покупателю | Umbriel | proud, pleased | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_1_f_g.flac | приветствие: постоянному покупателю | Despina | proud, pleased | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_2_g.flac | приветствие: постоянному покупателю | Umbriel | confidential, friendly | Для постоянных — цена особая. Смотри. |
| greet_postoyan_2_f_g.flac | приветствие: постоянному покупателю | Despina | confidential, friendly | Для постоянных — цена особая. Смотри. |
| greet_postoyan_3_g.flac | приветствие: постоянному покупателю | Umbriel | teasing, relieved | Я уж думал, ты к соседу переметнулся. |
| greet_postoyan_3_f_g.flac | приветствие: постоянному покупателю | Despina | teasing, relieved | Я уж думала, ты к соседу переметнулся. |
| greet_postoyan_4_g.flac | приветствие: постоянному покупателю | Umbriel | knowing, friendly | Узнаю тебя. Опять за припасами? |
| greet_postoyan_4_f_g.flac | приветствие: постоянному покупателю | Despina | knowing, friendly | Узнаю тебя. Опять за припасами? |
| greet_postoyan_5_g.flac | приветствие: постоянному покупателю | Umbriel | courteous, welcoming | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_5_f_g.flac | приветствие: постоянному покупателю | Despina | courteous, welcoming | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_6_g.flac | приветствие: постоянному покупателю | Umbriel | joking, warm | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_6_f_g.flac | приветствие: постоянному покупателю | Despina | joking, warm | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_7_g.flac | приветствие: постоянному покупателю | Umbriel | cheerful | Опять ты! Я как раз свежий товар разложил. |
| greet_postoyan_7_f_g.flac | приветствие: постоянному покупателю | Despina | cheerful | Опять ты! Я как раз свежий товар разложила. |
| greet_postoyan_8_g.flac | приветствие: постоянному покупателю | Umbriel | sincere, pleased | С тобой торговать — одно удовольствие. |
| greet_postoyan_8_f_g.flac | приветствие: постоянному покупателю | Despina | sincere, pleased | С тобой торговать — одно удовольствие. |
| greet_postoyan_9_g.flac | приветствие: постоянному покупателю | Umbriel | helpful, friendly | Запомнил, что ты берёшь. Отложил кое-что. |
| greet_postoyan_9_f_g.flac | приветствие: постоянному покупателю | Despina | helpful, friendly | Запомнила, что ты берёшь. Отложила кое-что. |
| greet_prodavec_0_g.flac | приветствие: постоянному поставщику | Umbriel | eager, businesslike | С добычей? Показывай, что там у тебя. |
| greet_prodavec_0_f_g.flac | приветствие: постоянному поставщику | Despina | eager, businesslike | С добычей? Показывай, что там у тебя. |
| greet_prodavec_1_g.flac | приветствие: постоянному поставщику | Umbriel | amused, chuckling | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_1_f_g.flac | приветствие: постоянному поставщику | Despina | amused, chuckling | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_2_g.flac | приветствие: постоянному поставщику | Umbriel | businesslike, friendly | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_2_f_g.flac | приветствие: постоянному поставщику | Despina | businesslike, friendly | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_3_g.flac | приветствие: постоянному поставщику | Umbriel | curious, eager | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_3_f_g.flac | приветствие: постоянному поставщику | Despina | curious, eager | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_4_g.flac | приветствие: постоянному поставщику | Umbriel | warm, businesslike | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_4_f_g.flac | приветствие: постоянному поставщику | Despina | warm, businesslike | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_5_g.flac | приветствие: постоянному поставщику | Umbriel | playful, appreciative | С тобой и артели не надо. Что на продажу? |
| greet_prodavec_5_f_g.flac | приветствие: постоянному поставщику | Despina | playful, appreciative | С тобой и артели не надо. Что на продажу? |
| greet_bogat_0_g.flac | приветствие: богатому | Umbriel | greedy, fawning | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_0_f_g.flac | приветствие: богатому | Despina | greedy, fawning | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_1_g.flac | приветствие: богатому | Umbriel | sly, fawning | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_1_f_g.flac | приветствие: богатому | Despina | sly, fawning | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_2_g.flac | приветствие: богатому | Umbriel | obsequious, eager | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_2_f_g.flac | приветствие: богатому | Despina | obsequious, eager | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_3_g.flac | приветствие: богатому | Umbriel | persuasive, smooth | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_3_f_g.flac | приветствие: богатому | Despina | persuasive, smooth | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_4_g.flac | приветствие: богатому | Umbriel | sly, jovial | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_4_f_g.flac | приветствие: богатому | Despina | sly, jovial | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_5_g.flac | приветствие: богатому | Umbriel | confidential, lowered voice | Для важного гостя найдётся кое-что особенное. |
| greet_bogat_5_f_g.flac | приветствие: богатому | Despina | confidential, lowered voice | Для важного гостя найдётся кое-что особенное. |
| greet_bedn_0_g.flac | приветствие: без гроша | Umbriel | dry, a bit sympathetic | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_0_f_g.flac | приветствие: без гроша | Despina | dry, a bit sympathetic | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_1_g.flac | приветствие: без гроша | Umbriel | dry, firm | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_1_f_g.flac | приветствие: без гроша | Despina | dry, firm | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_2_g.flac | приветствие: без гроша | Umbriel | sympathetic, practical | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_2_f_g.flac | приветствие: без гроша | Despina | sympathetic, practical | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_3_g.flac | приветствие: без гроша | Umbriel | businesslike, curt | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_3_f_g.flac | приветствие: без гроша | Despina | businesslike, curt | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_4_g.flac | приветствие: без гроша | Umbriel | wry, dry humour | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_4_f_g.flac | приветствие: без гроша | Despina | wry, dry humour | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_5_g.flac | приветствие: без гроша | Umbriel | kindly, encouraging | Заработаешь — приходи. Я никуда не денусь. |
| greet_bedn_5_f_g.flac | приветствие: без гроша | Despina | kindly, encouraging | Заработаешь — приходи. Я никуда не денусь. |
| greet_ranen_0_g.flac | приветствие: раненому | Umbriel | alarmed, caring | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_0_f_g.flac | приветствие: раненому | Despina | alarmed, caring | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_1_g.flac | приветствие: раненому | Umbriel | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_1_f_g.flac | приветствие: раненому | Despina | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_2_g.flac | приветствие: раненому | Umbriel | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_2_f_g.flac | приветствие: раненому | Despina | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_3_g.flac | приветствие: раненому | Umbriel | gruff, concerned | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_3_f_g.flac | приветствие: раненому | Despina | gruff, concerned | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_4_g.flac | приветствие: раненому | Umbriel | relieved, caring | Живой — и то ладно. Потом о делах. |
| greet_ranen_4_f_g.flac | приветствие: раненому | Despina | relieved, caring | Живой — и то ладно. Потом о делах. |
| greet_ranen_5_g.flac | приветствие: раненому | Umbriel | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_ranen_5_f_g.flac | приветствие: раненому | Despina | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_slava_0_g.flac | приветствие: знаменитому | Umbriel | awed, excited | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_0_f_g.flac | приветствие: знаменитому | Despina | awed, excited | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_1_g.flac | приветствие: знаменитому | Umbriel | respectful, impressed | О вас уже песни поют. Чем могу служить? |
| greet_slava_1_f_g.flac | приветствие: знаменитому | Despina | respectful, impressed | О вас уже песни поют. Чем могу служить? |
| greet_slava_2_g.flac | приветствие: знаменитому | Umbriel | honored, formal | Такой гость — честь для нашего дома. |
| greet_slava_2_f_g.flac | приветствие: знаменитому | Despina | honored, formal | Такой гость — честь для нашего дома. |
| greet_slava_3_g.flac | приветствие: знаменитому | Umbriel | excited, eager | Весь город о вас говорит. Проходите! |
| greet_slava_3_f_g.flac | приветствие: знаменитому | Despina | excited, eager | Весь город о вас говорит. Проходите! |
| greet_slava_4_g.flac | приветствие: знаменитому | Umbriel | delighted, chuckling | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_4_f_g.flac | приветствие: знаменитому | Despina | delighted, chuckling | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_5_g.flac | приветствие: знаменитому | Umbriel | respectful, warm | Слава бежит впереди вас. Рады видеть. |
| greet_slava_5_f_g.flac | приветствие: знаменитому | Despina | respectful, warm | Слава бежит впереди вас. Рады видеть. |
| greet_durn_0_g.flac | приветствие: с дурной славой | Umbriel | wary, cold | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_0_f_g.flac | приветствие: с дурной славой | Despina | wary, cold | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_1_g.flac | приветствие: с дурной славой | Umbriel | suspicious, slow | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_1_f_g.flac | приветствие: с дурной славой | Despina | suspicious, slow | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_2_g.flac | приветствие: с дурной славой | Umbriel | nervous, wary | Держите руки на виду. На всякий случай. |
| greet_durn_2_f_g.flac | приветствие: с дурной славой | Despina | nervous, wary | Держите руки на виду. На всякий случай. |
| greet_durn_3_g.flac | приветствие: с дурной славой | Umbriel | disapproving, stern | С вашей славой в честный дом не ходят. |
| greet_durn_3_f_g.flac | приветствие: с дурной славой | Despina | disapproving, stern | С вашей славой в честный дом не ходят. |
| greet_durn_4_g.flac | приветствие: с дурной славой | Umbriel | defiant, tense | Вас тут боятся. Я — пока нет. |
| greet_durn_4_f_g.flac | приветствие: с дурной славой | Despina | defiant, tense | Вас тут боятся. Я — пока нет. |
| greet_davno_0_g.flac | приветствие: после долгой разлуки | Umbriel | surprised, glad | Давненько тебя видно не было! Где носило? |
| greet_davno_0_f_g.flac | приветствие: после долгой разлуки | Despina | surprised, glad | Давненько тебя видно не было! Где носило? |
| greet_davno_1_g.flac | приветствие: после долгой разлуки | Umbriel | joyful, warm | Сколько лет, сколько зим! Проходи. |
| greet_davno_1_f_g.flac | приветствие: после долгой разлуки | Despina | joyful, warm | Сколько лет, сколько зим! Проходи. |
| greet_davno_2_g.flac | приветствие: после долгой разлуки | Umbriel | relieved, warm | А я уж боялся, что тракт тебя забрал. |
| greet_davno_2_f_g.flac | приветствие: после долгой разлуки | Despina | relieved, warm | А я уж боялась, что тракт тебя забрал. |
| greet_davno_3_g.flac | приветствие: после долгой разлуки | Umbriel | mock reproach, warm | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_3_f_g.flac | приветствие: после долгой разлуки | Despina | mock reproach, warm | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_4_g.flac | приветствие: после долгой разлуки | Umbriel | surprised, relieved | Живой! А мы уж и гадать перестали. |
| greet_davno_4_f_g.flac | приветствие: после долгой разлуки | Despina | surprised, relieved | Живой! А мы уж и гадать перестали. |
| greet_davno_5_g.flac | приветствие: после долгой разлуки | Umbriel | curious, friendly | Тебя не узнать. Долгой была дорога? |
| greet_davno_5_f_g.flac | приветствие: после долгой разлуки | Despina | curious, friendly | Тебя не узнать. Долгой была дорога? |
| greet_dozhd_0_g.flac | приветствие: в дождь | Umbriel | hospitable, warm | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_0_f_g.flac | приветствие: в дождь | Despina | hospitable, warm | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_1_g.flac | приветствие: в дождь | Umbriel | dry, matter-of-fact | В такой дождь только по делу и ходят. |
| greet_dozhd_1_f_g.flac | приветствие: в дождь | Despina | dry, matter-of-fact | В такой дождь только по делу и ходят. |
| greet_dozhd_2_g.flac | приветствие: в дождь | Umbriel | fussy, mildly annoyed | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_2_f_g.flac | приветствие: в дождь | Despina | fussy, mildly annoyed | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_3_g.flac | приветствие: в дождь | Umbriel | weary, sighing | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_3_f_g.flac | приветствие: в дождь | Despina | weary, sighing | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_4_g.flac | приветствие: в дождь | Umbriel | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_4_f_g.flac | приветствие: в дождь | Despina | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_5_g.flac | приветствие: в дождь | Umbriel | grumbling, friendly | Вот погодка! Сапоги у порога оставь. |
| greet_dozhd_5_f_g.flac | приветствие: в дождь | Despina | grumbling, friendly | Вот погодка! Сапоги у порога оставь. |
| greet_zemlyak_0_g.flac | приветствие: земляку | Umbriel | joyful, warm | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_0_f_g.flac | приветствие: земляку | Despina | joyful, warm | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_1_g.flac | приветствие: земляку | Umbriel | warm, welcoming | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_1_f_g.flac | приветствие: земляку | Despina | warm, welcoming | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_2_g.flac | приветствие: земляку | Umbriel | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_2_f_g.flac | приветствие: земляку | Despina | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_3_g.flac | приветствие: земляку | Umbriel | friendly, confidential | Земляку и цена своя. Проходи. |
| greet_zemlyak_3_f_g.flac | приветствие: земляку | Despina | friendly, confidential | Земляку и цена своя. Проходи. |
| greet_zemlyak_4_g.flac | приветствие: земляку | Umbriel | warm, nostalgic | Своих издалека видно. Как там дома? |
| greet_zemlyak_4_f_g.flac | приветствие: земляку | Despina | warm, nostalgic | Своих издалека видно. Как там дома? |
| greet_zemlyak_5_g.flac | приветствие: земляку | Umbriel | glad, warm | Нечасто наших тут встретишь. Садись. |
| greet_zemlyak_5_f_g.flac | приветствие: земляку | Despina | glad, warm | Нечасто наших тут встретишь. Садись. |
| greet_zhdet_0_g.flac | приветствие: про взятое дело | Umbriel | expectant, curious | Ну что, как с моим делом? |
| greet_zhdet_0_f_g.flac | приветствие: про взятое дело | Despina | expectant, curious | Ну что, как с моим делом? |
| greet_zhdet_1_g.flac | приветствие: про взятое дело | Umbriel | reminding, slightly stern | Помнишь, о чём договаривались? |
| greet_zhdet_1_f_g.flac | приветствие: про взятое дело | Despina | reminding, slightly stern | Помнишь, о чём договаривались? |
| greet_zhdet_2_g.flac | приветствие: про взятое дело | Umbriel | impatient, sighing | Жду, жду. Дело само не сделается. |
| greet_zhdet_2_f_g.flac | приветствие: про взятое дело | Despina | impatient, sighing | Жду, жду. Дело само не сделается. |
| greet_zhdet_3_g.flac | приветствие: про взятое дело | Umbriel | worried, reminding | Не забыто ли моё поручение? |
| greet_zhdet_3_f_g.flac | приветствие: про взятое дело | Despina | worried, reminding | Не забыто ли моё поручение? |
| greet_zhdet_4_g.flac | приветствие: про взятое дело | Umbriel | hopeful, eager | Вести есть? Как там с тем делом? |
| greet_zhdet_4_f_g.flac | приветствие: про взятое дело | Despina | hopeful, eager | Вести есть? Как там с тем делом? |
| greet_zhdet_5_g.flac | приветствие: про взятое дело | Umbriel | hopeful, curious | Вижу тебя — значит, есть новости? |
| greet_zhdet_5_f_g.flac | приветствие: про взятое дело | Despina | hopeful, curious | Вижу тебя — значит, есть новости? |
| greet_torg_12_g.flac | приветствие: торговец | Umbriel | brisk, lively market trader | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_12_f_g.flac | приветствие: торговец | Despina | brisk, lively market trader | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_13_g.flac | приветствие: торговец | Umbriel | playful, persuasive | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_13_f_g.flac | приветствие: торговец | Despina | playful, persuasive | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_14_g.flac | приветствие: торговец | Umbriel | proud, lively | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_14_f_g.flac | приветствие: торговец | Despina | proud, lively | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_15_g.flac | приветствие: торговец | Umbriel | sly, playful | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_15_f_g.flac | приветствие: торговец | Despina | sly, playful | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_16_g.flac | приветствие: торговец | Umbriel | admiring, persuasive | Глянь, какая работа! Такое не каждый день. |
| greet_torg_16_f_g.flac | приветствие: торговец | Despina | admiring, persuasive | Глянь, какая работа! Такое не каждый день. |
| greet_torg_17_g.flac | приветствие: торговец | Umbriel | wise, sly | Деньги любят счёт, а товар — хозяина. |
| greet_torg_17_f_g.flac | приветствие: торговец | Despina | wise, sly | Деньги любят счёт, а товар — хозяина. |
| greet_obshiy_8_g.flac | приветствие: всякий житель | Umbriel | friendly, curious | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_8_f_g.flac | приветствие: всякий житель | Despina | friendly, curious | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_9_g.flac | приветствие: всякий житель | Umbriel | friendly, sympathetic | Путник? Дорога дальняя, небось. |
| greet_obshiy_9_f_g.flac | приветствие: всякий житель | Despina | friendly, sympathetic | Путник? Дорога дальняя, небось. |
| greet_obshiy_10_g.flac | приветствие: всякий житель | Umbriel | curious, easygoing | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_10_f_g.flac | приветствие: всякий житель | Despina | curious, easygoing | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_11_g.flac | приветствие: всякий житель | Umbriel | calm, hospitable | Мир дому и тому, кто входит. |
| greet_obshiy_11_f_g.flac | приветствие: всякий житель | Despina | calm, hospitable | Мир дому и тому, кто входит. |
| greet_obshiy_12_g.flac | приветствие: всякий житель | Umbriel | hospitable, warm | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_12_f_g.flac | приветствие: всякий житель | Despina | hospitable, warm | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_13_g.flac | приветствие: всякий житель | Umbriel | cautious, then friendly | Добрый человек? Тогда поговорим. |
| greet_obshiy_13_f_g.flac | приветствие: всякий житель | Despina | cautious, then friendly | Добрый человек? Тогда поговорим. |
| greet_kuznya_8_g.flac | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Молот не ждёт. Чего тебе? |
| greet_kuznya_8_f_g.flac | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Молот не ждёт. Чего тебе? |
| greet_kuznya_9_g.flac | приветствие: кузнец | Umbriel | gruff, businesslike | Кольчугу латать или клинок точить? |
| greet_kuznya_9_f_g.flac | приветствие: кузнец | Despina | gruff, businesslike | Кольчугу латать или клинок точить? |
| greet_kuznya_10_g.flac | приветствие: кузнец | Umbriel | gruff, amused | Искры не боишься? Подходи. |
| greet_kuznya_10_f_g.flac | приветствие: кузнец | Despina | gruff, amused | Искры не боишься? Подходи. |
| greet_traktir_8_g.flac | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper | Заходи, у нас тепло и сухо. |
| greet_traktir_8_f_g.flac | приветствие: трактирщик | Despina | warm, hospitable innkeeper | Заходи, у нас тепло и сухо. |
| greet_traktir_9_g.flac | приветствие: трактирщик | Umbriel | cheerful innkeeper | Кружку пива для начала? |
| greet_traktir_9_f_g.flac | приветствие: трактирщик | Despina | cheerful innkeeper | Кружку пива для начала? |
| greet_traktir_10_g.flac | приветствие: трактирщик | Umbriel | friendly, hospitable | Свободный стол у окна. Садись. |
| greet_traktir_10_f_g.flac | приветствие: трактирщик | Despina | friendly, hospitable | Свободный стол у окна. Садись. |
| greet_lekar_8_g.flac | приветствие: лекарь | Umbriel | gentle, hushed | Тише, тише. Здесь больные спят. |
| greet_lekar_8_f_g.flac | приветствие: лекарь | Despina | gentle, hushed | Тише, тише. Здесь больные спят. |
| greet_lekar_9_g.flac | приветствие: лекарь | Umbriel | calm, caring | Покажи руки. Раны чистые? |
| greet_lekar_9_f_g.flac | приветствие: лекарь | Despina | calm, caring | Покажи руки. Раны чистые? |
| greet_lekar_10_g.flac | приветствие: лекарь | Umbriel | gentle, attentive | Травы свежие, отвар готов. Что беспокоит? |
| greet_lekar_10_f_g.flac | приветствие: лекарь | Despina | gentle, attentive | Травы свежие, отвар готов. Что беспокоит? |
| greet_zhrec_8_g.flac | приветствие: жрец | Umbriel | serene, reverent | Входи с миром, уходи с надеждой. |
| greet_zhrec_8_f_g.flac | приветствие: жрец | Despina | serene, reverent | Входи с миром, уходи с надеждой. |
| greet_zhrec_9_g.flac | приветствие: жрец | Umbriel | quiet, solemn | Боги видят всякого, кто переступает порог. |
| greet_zhrec_9_f_g.flac | приветствие: жрец | Despina | quiet, solemn | Боги видят всякого, кто переступает порог. |
| greet_zhrec_10_g.flac | приветствие: жрец | Umbriel | gentle, reverent | Помолишься с нами или пришёл за советом? |
| greet_zhrec_10_f_g.flac | приветствие: жрец | Despina | gentle, reverent | Помолишься с нами или пришёл за советом? |
| greet_znanie_8_g.flac | приветствие: учёный | Umbriel | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_8_f_g.flac | приветствие: учёный | Despina | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_9_g.flac | приветствие: учёный | Umbriel | fussy, scholarly | Любую книгу — только после того, как руки вымоешь. |
| greet_znanie_9_f_g.flac | приветствие: учёный | Despina | fussy, scholarly | Любую книгу — только после того, как руки вымоешь. |
| greet_znanie_10_g.flac | приветствие: учёный | Umbriel | delighted, scholarly | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_znanie_10_f_g.flac | приветствие: учёный | Despina | delighted, scholarly | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_strazha_9_g.flac | приветствие: страж у дела | Umbriel | stern, official | Порядок знаешь? Тогда проходи. |
| greet_strazha_9_f_g.flac | приветствие: страж у дела | Despina | stern, official | Порядок знаешь? Тогда проходи. |
| greet_strazha_10_g.flac | приветствие: страж у дела | Umbriel | dry, stern | Держи руки на виду, и мы поладим. |
| greet_strazha_10_f_g.flac | приветствие: страж у дела | Despina | dry, stern | Держи руки на виду, и мы поладим. |
| greet_strazha_11_g.flac | приветствие: страж у дела | Umbriel | curt, official | Без дела не задерживайся. |
| greet_strazha_11_f_g.flac | приветствие: страж у дела | Despina | curt, official | Без дела не задерживайся. |
| trade_buy_0_g.flac | торговец: покупка | Umbriel | warm, satisfied | Хороший выбор. Носи на здоровье. |
| trade_buy_0_f_g.flac | торговец: покупка | Despina | warm, satisfied | Хороший выбор. Носи на здоровье. |
| trade_buy_1_g.flac | торговец: покупка | Umbriel | confident, proud | Держи. Сносу не будет. |
| trade_buy_1_f_g.flac | торговец: покупка | Despina | confident, proud | Держи. Сносу не будет. |
| trade_buy_2_g.flac | торговец: покупка | Umbriel | cheerful, businesslike | По рукам! Приятно иметь дело. |
| trade_buy_2_f_g.flac | торговец: покупка | Despina | cheerful, businesslike | По рукам! Приятно иметь дело. |
| trade_buy_3_g.flac | торговец: покупка | Umbriel | friendly, persuasive | Бери, бери. Не пожалеешь. |
| trade_buy_3_f_g.flac | торговец: покупка | Despina | friendly, persuasive | Бери, бери. Не пожалеешь. |
| trade_buy_4_g.flac | торговец: покупка | Umbriel | businesslike, fair | С тебя золото — с меня товар. Честно. |
| trade_buy_4_f_g.flac | торговец: покупка | Despina | businesslike, fair | С тебя золото — с меня товар. Честно. |
| trade_buy_5_g.flac | торговец: покупка | Umbriel | pleased, warm | Вот и славно. Заходи ещё. |
| trade_buy_5_f_g.flac | торговец: покупка | Despina | pleased, warm | Вот и славно. Заходи ещё. |
| trade_buy_6_g.flac | торговец: покупка | Umbriel | proud, serious | Твоё. Береги, второго такого нет. |
| trade_buy_6_f_g.flac | торговец: покупка | Despina | proud, serious | Твоё. Береги, второго такого нет. |
| trade_buy_7_g.flac | торговец: покупка | Umbriel | cheerful | Взято! Пусть служит верно. |
| trade_buy_7_f_g.flac | торговец: покупка | Despina | cheerful | Взято! Пусть служит верно. |
| trade_buy_8_g.flac | торговец: покупка | Umbriel | approving, sincere | Отличная покупка. Я бы и сам взял. |
| trade_buy_8_f_g.flac | торговец: покупка | Despina | approving, sincere | Отличная покупка. Я бы и сама взяла. |
| trade_buy_9_g.flac | торговец: покупка | Umbriel | confidential, generous | Забирай. Цену сбавил только для тебя. |
| trade_buy_9_f_g.flac | торговец: покупка | Despina | confidential, generous | Забирай. Цену сбавила только для тебя. |
| trade_buy_10_g.flac | торговец: покупка | Umbriel | grateful, warm | Спасибо за золото. Удачи в дороге. |
| trade_buy_10_f_g.flac | торговец: покупка | Despina | grateful, warm | Спасибо за золото. Удачи в дороге. |
| trade_buy_11_g.flac | торговец: покупка | Umbriel | lively, joking | Сделка! Смотри не потеряй. |
| trade_buy_11_f_g.flac | торговец: покупка | Despina | lively, joking | Сделка! Смотри не потеряй. |
| trade_buy_big_0_g.flac | торговец: крупная покупка | Umbriel | delighted, laughing | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_0_f_g.flac | торговец: крупная покупка | Despina | delighted, laughing | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_1_g.flac | торговец: крупная покупка | Umbriel | excited, fawning | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_1_f_g.flac | торговец: крупная покупка | Despina | excited, fawning | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_2_g.flac | торговец: крупная покупка | Umbriel | grateful, generous | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_2_f_g.flac | торговец: крупная покупка | Despina | grateful, generous | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_3_g.flac | торговец: крупная покупка | Umbriel | amazed, delighted | Полприлавка разом! Вот это размах. |
| trade_buy_big_3_f_g.flac | торговец: крупная покупка | Despina | amazed, delighted | Полприлавка разом! Вот это размах. |
| trade_buy_big_4_g.flac | торговец: крупная покупка | Umbriel | happy, warm | С таким покупателем и год не страшен. |
| trade_buy_big_4_f_g.flac | торговец: крупная покупка | Despina | happy, warm | С таким покупателем и год не страшен. |
| trade_sell_0_g.flac | торговец: скупает у героя | Umbriel | businesslike, firm | Возьму. Цена честная, не спорь. |
| trade_sell_0_f_g.flac | торговец: скупает у героя | Despina | businesslike, firm | Возьму. Цена честная, не спорь. |
| trade_sell_1_g.flac | торговец: скупает у героя | Umbriel | appraising, satisfied | Неплохая вещица. Держи золото. |
| trade_sell_1_f_g.flac | торговец: скупает у героя | Despina | appraising, satisfied | Неплохая вещица. Держи золото. |
| trade_sell_2_g.flac | торговец: скупает у героя | Umbriel | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_2_f_g.flac | торговец: скупает у героя | Despina | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_3_g.flac | торговец: скупает у героя | Umbriel | appraising, a bit grudging | Хм, сойдёт. Вот твои монеты. |
| trade_sell_3_f_g.flac | торговец: скупает у героя | Despina | appraising, a bit grudging | Хм, сойдёт. Вот твои монеты. |
| trade_sell_4_g.flac | торговец: скупает у героя | Umbriel | eager, businesslike | По рукам. Ещё что-нибудь есть? |
| trade_sell_4_f_g.flac | торговец: скупает у героя | Despina | eager, businesslike | По рукам. Ещё что-нибудь есть? |
| trade_sell_5_g.flac | торговец: скупает у героя | Umbriel | approving | Товар годный. Приноси ещё. |
| trade_sell_5_f_g.flac | торговец: скупает у героя | Despina | approving | Товар годный. Приноси ещё. |
| trade_sell_6_g.flac | торговец: скупает у героя | Umbriel | wry, sighing | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_6_f_g.flac | торговец: скупает у героя | Despina | wry, sighing | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_7_g.flac | торговец: скупает у героя | Umbriel | dry, grudging | Держи золото. Считай, повезло тебе. |
| trade_sell_7_f_g.flac | торговец: скупает у героя | Despina | dry, grudging | Держи золото. Считай, повезло тебе. |
| trade_sell_8_g.flac | торговец: скупает у героя | Umbriel | playful, cheerful | Добро пожаловать на мой склад, вещица! |
| trade_sell_8_f_g.flac | торговец: скупает у героя | Despina | playful, cheerful | Добро пожаловать на мой склад, вещица! |
| trade_sell_9_g.flac | торговец: скупает у героя | Umbriel | sly, firm | Возьму, если больше торговаться не станешь. |
| trade_sell_9_f_g.flac | торговец: скупает у героя | Despina | sly, firm | Возьму, если больше торговаться не станешь. |
| trade_sell_10_g.flac | торговец: скупает у героя | Umbriel | curt, businesslike | Это пойдёт. Вот плата. |
| trade_sell_10_f_g.flac | торговец: скупает у героя | Despina | curt, businesslike | Это пойдёт. Вот плата. |
| trade_sell_11_g.flac | торговец: скупает у героя | Umbriel | pleased, surprised | Как раз этого и не хватало. Беру. |
| trade_sell_11_f_g.flac | торговец: скупает у героя | Despina | pleased, surprised | Как раз этого и не хватало. Беру. |
| trade_sell_big_0_g.flac | торговец: скупает много | Umbriel | amazed, amused | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_0_f_g.flac | торговец: скупает много | Despina | amazed, amused | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_1_g.flac | торговец: скупает много | Umbriel | wry, sighing, amused | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_1_f_g.flac | торговец: скупает много | Despina | wry, sighing, amused | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_2_g.flac | торговец: скупает много | Umbriel | surprised, agreeable | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_2_f_g.flac | торговец: скупает много | Despina | surprised, agreeable | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_3_g.flac | торговец: скупает много | Umbriel | mock complaining, amused | Ты меня разоришь, но товар хорош. |
| trade_sell_big_3_f_g.flac | торговец: скупает много | Despina | mock complaining, amused | Ты меня разоришь, но товар хорош. |
| trade_sell_big_4_g.flac | торговец: скупает много | Umbriel | wry, resigned | Опустошаешь мне кассу. Но беру всё. |
| trade_sell_big_4_f_g.flac | торговец: скупает много | Despina | wry, resigned | Опустошаешь мне кассу. Но беру всё. |
| trade_poor_0_g.flac | торговец: золота не хватает | Umbriel | dry, matter-of-fact | Золота маловато. Доложишь — отдам. |
| trade_poor_0_f_g.flac | торговец: золота не хватает | Despina | dry, matter-of-fact | Золота маловато. Доложишь — отдам. |
| trade_poor_1_g.flac | торговец: золота не хватает | Umbriel | firm, curt | Не хватает монет. Без денег не отдаю. |
| trade_poor_1_f_g.flac | торговец: золота не хватает | Despina | firm, curt | Не хватает монет. Без денег не отдаю. |
| trade_poor_2_g.flac | торговец: золота не хватает | Umbriel | sympathetic, sighing | Эх, на это кошель тонковат. |
| trade_poor_2_f_g.flac | торговец: золота не хватает | Despina | sympathetic, sighing | Эх, на это кошель тонковат. |
| trade_poor_3_g.flac | торговец: золота не хватает | Umbriel | firm, stern | В долг не торгую, не проси. |
| trade_poor_3_f_g.flac | торговец: золота не хватает | Despina | firm, stern | В долг не торгую, не проси. |
| trade_poor_4_g.flac | торговец: золота не хватает | Umbriel | kindly, encouraging | Подкопи ещё немного и возвращайся. |
| trade_poor_4_f_g.flac | торговец: золота не хватает | Despina | kindly, encouraging | Подкопи ещё немного и возвращайся. |
| trade_poor_5_g.flac | торговец: золота не хватает | Umbriel | wry, proverb | Даром только ветер в поле. |
| trade_poor_5_f_g.flac | торговец: золота не хватает | Despina | wry, proverb | Даром только ветер в поле. |
| trade_refuse_0_g.flac | торговец: не берёт | Umbriel | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_0_f_g.flac | торговец: не берёт | Despina | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_1_g.flac | торговец: не берёт | Umbriel | firm, curt | Нет, такое не беру. |
| trade_refuse_1_f_g.flac | торговец: не берёт | Despina | firm, curt | Нет, такое не беру. |
| trade_refuse_2_g.flac | торговец: не берёт | Umbriel | dismissive, weary | Такого у меня и так полон склад. |
| trade_refuse_2_f_g.flac | торговец: не берёт | Despina | dismissive, weary | Такого у меня и так полон склад. |
| trade_refuse_3_g.flac | торговец: не берёт | Umbriel | neutral, helpful | Не мой товар. Попробуй у соседа. |
| trade_refuse_3_f_g.flac | торговец: не берёт | Despina | neutral, helpful | Не мой товар. Попробуй у соседа. |
| trade_bye_0_g.flac | торговец: прощание после торга | Umbriel | warm, friendly | Заходи ещё, всегда рад. |
| trade_bye_0_f_g.flac | торговец: прощание после торга | Despina | warm, friendly | Заходи ещё, всегда рада. |
| trade_bye_1_g.flac | торговец: прощание после торга | Umbriel | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_1_f_g.flac | торговец: прощание после торга | Despina | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_2_g.flac | торговец: прощание после торга | Umbriel | grateful, warm | Спасибо за торг. Не забывай меня. |
| trade_bye_2_f_g.flac | торговец: прощание после торга | Despina | grateful, warm | Спасибо за торг. Не забывай меня. |
| trade_bye_3_g.flac | торговец: прощание после торга | Umbriel | cheerful, sly | Удачи! И помни, где лучшие цены. |
| trade_bye_3_f_g.flac | торговец: прощание после торга | Despina | cheerful, sly | Удачи! И помни, где лучшие цены. |
| trade_bye_4_g.flac | торговец: прощание после торга | Umbriel | friendly, easygoing | Будешь рядом — загляни. |
| trade_bye_4_f_g.flac | торговец: прощание после торга | Despina | friendly, easygoing | Будешь рядом — загляни. |
| trade_bye_5_g.flac | торговец: прощание после торга | Umbriel | polite, satisfied | Приятно было иметь дело. |
| trade_bye_5_f_g.flac | торговец: прощание после торга | Despina | polite, satisfied | Приятно было иметь дело. |
| trade_regular_0_g.flac | торговец: постоянному покупателю | Umbriel | courteous, warm | Для постоянного покупателя — с поклоном. |
| trade_regular_0_f_g.flac | торговец: постоянному покупателю | Despina | courteous, warm | Для постоянного покупателя — с поклоном. |
| trade_regular_1_g.flac | торговец: постоянному покупателю | Umbriel | warm, generous | Постоянным — от души. Приходи снова. |
| trade_regular_1_f_g.flac | торговец: постоянному покупателю | Despina | warm, generous | Постоянным — от души. Приходи снова. |
| trade_regular_2_g.flac | торговец: постоянному покупателю | Umbriel | playful, laughing | Ещё немного — и я тебе медаль вручу. |
| trade_regular_2_f_g.flac | торговец: постоянному покупателю | Despina | playful, laughing | Ещё немного — и я тебе медаль вручу. |
| trade_regular_3_g.flac | торговец: постоянному покупателю | Umbriel | amused, fond | Я твои покупки уже на память знаю. |
| trade_regular_3_f_g.flac | торговец: постоянному покупателю | Despina | amused, fond | Я твои покупки уже на память знаю. |
| trade_regular_4_g.flac | торговец: постоянному покупателю | Umbriel | grateful, jovial | Вот кто меня кормит! Спасибо. |
| trade_regular_4_f_g.flac | торговец: постоянному покупателю | Despina | grateful, jovial | Вот кто меня кормит! Спасибо. |
| quest_take_0_g.flac | заказчик: даёт дело | Umbriel | serious, confiding | Есть для тебя дело. Слушай внимательно. |
| quest_take_0_f_g.flac | заказчик: даёт дело | Despina | serious, confiding | Есть для тебя дело. Слушай внимательно. |
| quest_take_1_g.flac | заказчик: даёт дело | Umbriel | earnest, hopeful | Выручишь — не забуду. Вот что нужно. |
| quest_take_1_f_g.flac | заказчик: даёт дело | Despina | earnest, hopeful | Выручишь — не забуду. Вот что нужно. |
| quest_take_2_g.flac | заказчик: даёт дело | Umbriel | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_2_f_g.flac | заказчик: даёт дело | Despina | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_3_g.flac | заказчик: даёт дело | Umbriel | earnest, a little worried | Мне нужна помощь. Вот в чём дело. |
| quest_take_3_f_g.flac | заказчик: даёт дело | Despina | earnest, a little worried | Мне нужна помощь. Вот в чём дело. |
| quest_story_0_g.flac | заказчик: сюжетное | Umbriel | grave, meaningful | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_0_f_g.flac | заказчик: сюжетное | Despina | grave, meaningful | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_1_g.flac | заказчик: сюжетное | Umbriel | serious, intense | От этого многое зависит. Не подведи. |
| quest_story_1_f_g.flac | заказчик: сюжетное | Despina | serious, intense | От этого многое зависит. Не подведи. |
| quest_faction_0_g.flac | заказчик: фракционное | Umbriel | official, measured | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_0_f_g.flac | заказчик: фракционное | Despina | official, measured | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_1_g.flac | заказчик: фракционное | Umbriel | dry, dutiful | Служба есть служба. Задание такое. |
| quest_faction_1_f_g.flac | заказчик: фракционное | Despina | dry, dutiful | Служба есть служба. Задание такое. |
| quest_case_0_g.flac | заказчик: расследование | Umbriel | suspicious, lowered voice | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_0_f_g.flac | заказчик: расследование | Despina | suspicious, lowered voice | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_1_g.flac | заказчик: расследование | Umbriel | sharp, investigative | Нужны улики, а не слухи. Поищешь? |
| quest_case_1_f_g.flac | заказчик: расследование | Despina | sharp, investigative | Нужны улики, а не слухи. Поищешь? |
| quest_hunt_0_g.flac | заказчик: охота | Umbriel | grim, determined | Тварь повадилась. Выследи её и убей. |
| quest_hunt_0_f_g.flac | заказчик: охота | Despina | grim, determined | Тварь повадилась. Выследи её и убей. |
| quest_hunt_1_g.flac | заказчик: охота | Umbriel | concerned, serious | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_1_f_g.flac | заказчик: охота | Despina | concerned, serious | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_2_g.flac | заказчик: охота | Umbriel | cold, determined | Принеси мне весть, что она мертва. |
| quest_hunt_2_f_g.flac | заказчик: охота | Despina | cold, determined | Принеси мне весть, что она мертва. |
| quest_delivery_0_g.flac | заказчик: доставка | Umbriel | businesslike, urgent | Груз нужно доставить. Ждут его давно. |
| quest_delivery_0_f_g.flac | заказчик: доставка | Despina | businesslike, urgent | Груз нужно доставить. Ждут его давно. |
| quest_delivery_1_g.flac | заказчик: доставка | Umbriel | businesslike, reassuring | Довези товар целым — там заплатят. |
| quest_delivery_1_f_g.flac | заказчик: доставка | Despina | businesslike, reassuring | Довези товар целым — там заплатят. |
| quest_craft_0_g.flac | заказчик: ремесло | Umbriel | appraising, friendly | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_0_f_g.flac | заказчик: ремесло | Despina | appraising, friendly | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_1_g.flac | заказчик: ремесло | Umbriel | earnest, demanding | Сделай мне вещь — хорошую, на совесть. |
| quest_craft_1_f_g.flac | заказчик: ремесло | Despina | earnest, demanding | Сделай мне вещь — хорошую, на совесть. |
| quest_diplom_0_g.flac | заказчик: дипломатия | Umbriel | thoughtful, measured | Тут словом надо, а не мечом. |
| quest_diplom_0_f_g.flac | заказчик: дипломатия | Despina | thoughtful, measured | Тут словом надо, а не мечом. |
| quest_diplom_1_g.flac | заказчик: дипломатия | Umbriel | frustrated, hopeful | Поговори с ними. Меня они слушать не станут. |
| quest_diplom_1_f_g.flac | заказчик: дипломатия | Despina | frustrated, hopeful | Поговори с ними. Меня они слушать не станут. |
| quest_study_0_g.flac | заказчик: исследование | Umbriel | curious, eager | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_0_f_g.flac | заказчик: исследование | Despina | curious, eager | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_1_g.flac | заказчик: исследование | Umbriel | curious, instructive | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_study_1_f_g.flac | заказчик: исследование | Despina | curious, instructive | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_archeo_0_g.flac | заказчик: археология | Umbriel | mysterious, low | Под землёй лежит старое. Подними его. |
| quest_archeo_0_f_g.flac | заказчик: археология | Despina | mysterious, low | Под землёй лежит старое. Подними его. |
| quest_archeo_1_g.flac | заказчик: археология | Umbriel | intrigued, mysterious | Древность ждёт того, кто не побоится копать. |
| quest_archeo_1_f_g.flac | заказчик: археология | Despina | intrigued, mysterious | Древность ждёт того, кто не побоится копать. |
| quest_faith_0_g.flac | заказчик: религия | Umbriel | reverent, solemn | Боги ждут знака. Исполни обет. |
| quest_faith_0_f_g.flac | заказчик: религия | Despina | reverent, solemn | Боги ждут знака. Исполни обет. |
| quest_faith_1_g.flac | заказчик: религия | Umbriel | serene, earnest | Святое дело. Не для корысти — для души. |
| quest_faith_1_f_g.flac | заказчик: религия | Despina | serene, earnest | Святое дело. Не для корысти — для души. |
| quest_magic_0_g.flac | заказчик: магия | Umbriel | uneasy, lowered voice | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_0_f_g.flac | заказчик: магия | Despina | uneasy, lowered voice | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_1_g.flac | заказчик: магия | Umbriel | tense, mysterious | Сила неспокойна. Нужно её унять. |
| quest_magic_1_f_g.flac | заказчик: магия | Despina | tense, mysterious | Сила неспокойна. Нужно её унять. |
| quest_war_0_g.flac | заказчик: война | Umbriel | urgent, grim | Война не ждёт. Нужны люди и припасы. |
| quest_war_0_f_g.flac | заказчик: война | Despina | urgent, grim | Война не ждёт. Нужны люди и припасы. |
| quest_war_1_g.flac | заказчик: война | Umbriel | tense, pleading | Фронт близко. Помоги, чем сможешь. |
| quest_war_1_f_g.flac | заказчик: война | Despina | tense, pleading | Фронт близко. Помоги, чем сможешь. |
| quest_rescue_0_g.flac | заказчик: спасение | Umbriel | anxious, pleading | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_0_f_g.flac | заказчик: спасение | Despina | anxious, pleading | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_1_g.flac | заказчик: спасение | Umbriel | desperate, pleading | Вытащи его живым. Прошу тебя. |
| quest_rescue_1_f_g.flac | заказчик: спасение | Despina | desperate, pleading | Вытащи его живым. Прошу тебя. |
| quest_econ_0_g.flac | заказчик: экономика | Umbriel | shrewd, businesslike | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_0_f_g.flac | заказчик: экономика | Despina | shrewd, businesslike | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_1_g.flac | заказчик: экономика | Umbriel | brisk, urgent | Нужен товар. Много и быстро. |
| quest_econ_1_f_g.flac | заказчик: экономика | Despina | brisk, urgent | Нужен товар. Много и быстро. |
| quest_random_0_g.flac | заказчик: случайное | Umbriel | casual, curious | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_0_f_g.flac | заказчик: случайное | Despina | casual, curious | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_1_g.flac | заказчик: случайное | Umbriel | puzzled, honest | Странное дело, но заплачу честно. |
| quest_random_1_f_g.flac | заказчик: случайное | Despina | puzzled, honest | Странное дело, но заплачу честно. |
| quest_secret_0_g.flac | заказчик: скрытое | Umbriel | whisper, conspiratorial | Только тихо. Об этом — никому. |
| quest_secret_0_f_g.flac | заказчик: скрытое | Despina | whisper, conspiratorial | Только тихо. Об этом — никому. |
| quest_secret_1_g.flac | заказчик: скрытое | Umbriel | hushed, serious | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_secret_1_f_g.flac | заказчик: скрытое | Despina | hushed, serious | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_type_fetch_0_g.flac | заказчик: принести | Umbriel | businesslike, clear | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_0_f_g.flac | заказчик: принести | Despina | businesslike, clear | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_1_g.flac | заказчик: принести | Umbriel | worried, friendly | Запасы кончаются. Добудь, будь другом. |
| quest_type_fetch_1_f_g.flac | заказчик: принести | Despina | worried, friendly | Запасы кончаются. Добудь, будь другом. |
| quest_type_kill_0_g.flac | заказчик: очистить округу | Umbriel | grim, urgent | Округу заполонили твари. Очисти её. |
| quest_type_kill_0_f_g.flac | заказчик: очистить округу | Despina | grim, urgent | Округу заполонили твари. Очисти её. |
| quest_type_kill_1_g.flac | заказчик: очистить округу | Umbriel | angry, desperate | Житья от тварей нет. Перебей их. |
| quest_type_kill_1_f_g.flac | заказчик: очистить округу | Despina | angry, desperate | Житья от тварей нет. Перебей их. |
| quest_type_visit_0_g.flac | заказчик: сходить и посмотреть | Umbriel | uneasy, curious | Сходи туда и погляди, что там творится. |
| quest_type_visit_0_f_g.flac | заказчик: сходить и посмотреть | Despina | uneasy, curious | Сходи туда и погляди, что там творится. |
| quest_type_visit_1_g.flac | заказчик: сходить и посмотреть | Umbriel | worried, serious | Там неладно. Проверь и возвращайся. |
| quest_type_visit_1_f_g.flac | заказчик: сходить и посмотреть | Despina | worried, serious | Там неладно. Проверь и возвращайся. |
| quest_full_0_g.flac | заказчик: дел слишком много | Umbriel | amused, refusing | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_0_f_g.flac | заказчик: дел слишком много | Despina | amused, refusing | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_1_g.flac | заказчик: дел слишком много | Umbriel | firm, reasonable | Сперва закончи начатое, потом приходи. |
| quest_full_1_f_g.flac | заказчик: дел слишком много | Despina | firm, reasonable | Сперва закончи начатое, потом приходи. |
| quest_full_2_g.flac | заказчик: дел слишком много | Umbriel | dry, friendly | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_full_2_f_g.flac | заказчик: дел слишком много | Despina | dry, friendly | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_have_0_g.flac | заказчик: дело уже взято | Umbriel | patient, reminding | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_0_f_g.flac | заказчик: дело уже взято | Despina | patient, reminding | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_1_g.flac | заказчик: дело уже взято | Umbriel | mildly impatient | Моё поручение и так при тебе. |
| quest_have_1_f_g.flac | заказчик: дело уже взято | Despina | mildly impatient | Моё поручение и так при тебе. |
| quest_done_0_g.flac | заказчик: дело сдано | Umbriel | delighted, grateful | Сделано? Вот это дело! Держи награду. |
| quest_done_0_f_g.flac | заказчик: дело сдано | Despina | delighted, grateful | Сделано? Вот это дело! Держи награду. |
| quest_done_1_g.flac | заказчик: дело сдано | Umbriel | grateful, sincere | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_1_f_g.flac | заказчик: дело сдано | Despina | grateful, sincere | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_2_g.flac | заказчик: дело сдано | Umbriel | satisfied, businesslike | Честно заработано. Держи. |
| quest_done_2_f_g.flac | заказчик: дело сдано | Despina | satisfied, businesslike | Честно заработано. Держи. |
| quest_done_3_g.flac | заказчик: дело сдано | Umbriel | proud, warm | Знал, что на тебя можно положиться. |
| quest_done_3_f_g.flac | заказчик: дело сдано | Despina | proud, warm | Знала, что на тебя можно положиться. |
| quest_done_4_g.flac | заказчик: дело сдано | Umbriel | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_4_f_g.flac | заказчик: дело сдано | Despina | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_5_g.flac | заказчик: дело сдано | Umbriel | respectful, warm | Слово своё держишь. Это ценю. |
| quest_done_5_f_g.flac | заказчик: дело сдано | Despina | respectful, warm | Слово своё держишь. Это ценю. |
| car_meet_0_g.flac | старший обоза: встреча | Rasalgethi | loud, friendly call | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_0_f_g.flac | старший обоза: встреча | Gacrux | loud, friendly call | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_1_g.flac | старший обоза: встреча | Rasalgethi | reassuring, friendly | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_1_f_g.flac | старший обоза: встреча | Gacrux | reassuring, friendly | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_2_g.flac | старший обоза: встреча | Rasalgethi | cheerful, welcoming | Доброй дороги! У нас есть чем поторговать. |
| car_meet_2_f_g.flac | старший обоза: встреча | Gacrux | cheerful, welcoming | Доброй дороги! У нас есть чем поторговать. |
| car_meet_3_g.flac | старший обоза: встреча | Rasalgethi | relaxed, inviting | Караван на привале. Подходи, пока стоим. |
| car_meet_3_f_g.flac | старший обоза: встреча | Gacrux | relaxed, inviting | Караван на привале. Подходи, пока стоим. |
| car_meet_4_g.flac | старший обоза: встреча | Rasalgethi | wary, then relieved | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_4_f_g.flac | старший обоза: встреча | Gacrux | wary, then relieved | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_5_g.flac | старший обоза: встреча | Rasalgethi | proud, persuasive | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_5_f_g.flac | старший обоза: встреча | Gacrux | proud, persuasive | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_6_g.flac | старший обоза: встреча | Rasalgethi | tired, hurried | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_6_f_g.flac | старший обоза: встреча | Gacrux | tired, hurried | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_7_g.flac | старший обоза: встреча | Rasalgethi | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_7_f_g.flac | старший обоза: встреча | Gacrux | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_8_g.flac | старший обоза: встреча | Rasalgethi | calming, commanding, then friendly | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_8_f_g.flac | старший обоза: встреча | Gacrux | calming, commanding, then friendly | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_9_g.flac | старший обоза: встреча | Rasalgethi | hopeful, friendly | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_9_f_g.flac | старший обоза: встреча | Gacrux | hopeful, friendly | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_war_0_g.flac | старший обоза: встреча на войне | Rasalgethi | tense, hushed | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_0_f_g.flac | старший обоза: встреча на войне | Gacrux | tense, hushed | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_1_g.flac | старший обоза: встреча на войне | Rasalgethi | grim, apologetic | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_1_f_g.flac | старший обоза: встреча на войне | Gacrux | grim, apologetic | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_2_g.flac | старший обоза: встреча на войне | Rasalgethi | nervous, hurried | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_2_f_g.flac | старший обоза: встреча на войне | Gacrux | nervous, hurried | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_3_g.flac | старший обоза: встреча на войне | Rasalgethi | grim, serious | На такой дороге каждая рука с оружием на счету. |
| car_meet_war_3_f_g.flac | старший обоза: встреча на войне | Gacrux | grim, serious | На такой дороге каждая рука с оружием на счету. |
| car_meet_night_0_g.flac | старший обоза: встреча ночью | Rasalgethi | alarmed, sharp | Кто там в темноте? Назовись! |
| car_meet_night_0_f_g.flac | старший обоза: встреча ночью | Gacrux | alarmed, sharp | Кто там в темноте? Назовись! |
| car_meet_night_1_g.flac | старший обоза: встреча ночью | Rasalgethi | sleepy, grudging | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_1_f_g.flac | старший обоза: встреча ночью | Gacrux | sleepy, grudging | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_2_g.flac | старший обоза: встреча ночью | Rasalgethi | wary, then welcoming | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_night_2_f_g.flac | старший обоза: встреча ночью | Gacrux | wary, then welcoming | Поздно бродишь. Ладно, подходи к огню. |
| car_buy_0_g.flac | старший обоза: продаёт | Rasalgethi | confident, sly | Твоё. Довезёшь — втрое продашь. |
| car_buy_0_f_g.flac | старший обоза: продаёт | Gacrux | confident, sly | Твоё. Довезёшь — втрое продашь. |
| car_buy_1_g.flac | старший обоза: продаёт | Rasalgethi | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_1_f_g.flac | старший обоза: продаёт | Gacrux | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_2_g.flac | старший обоза: продаёт | Rasalgethi | cheerful, brisk | Взято! Деньги в сундук, товар — тебе. |
| car_buy_2_f_g.flac | старший обоза: продаёт | Gacrux | cheerful, brisk | Взято! Деньги в сундук, товар — тебе. |
| car_buy_3_g.flac | старший обоза: продаёт | Rasalgethi | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_3_f_g.flac | старший обоза: продаёт | Gacrux | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_4_g.flac | старший обоза: продаёт | Rasalgethi | friendly, joking | По рукам. Только в дороге не растеряй. |
| car_buy_4_f_g.flac | старший обоза: продаёт | Gacrux | friendly, joking | По рукам. Только в дороге не растеряй. |
| car_buy_5_g.flac | старший обоза: продаёт | Rasalgethi | sincere, warm | Держи. Мы честные купцы, без обмана. |
| car_buy_5_f_g.flac | старший обоза: продаёт | Gacrux | sincere, warm | Держи. Мы честные купцы, без обмана. |
| car_sell_0_g.flac | старший обоза: скупает | Rasalgethi | businesslike | Беру. В городе пригодится. |
| car_sell_0_f_g.flac | старший обоза: скупает | Gacrux | businesslike | Беру. В городе пригодится. |
| car_sell_1_g.flac | старший обоза: скупает | Rasalgethi | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_1_f_g.flac | старший обоза: скупает | Gacrux | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_2_g.flac | старший обоза: скупает | Rasalgethi | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_2_f_g.flac | старший обоза: скупает | Gacrux | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_3_g.flac | старший обоза: скупает | Rasalgethi | loud, commanding, pleased | Грузите на третий воз! Беру всё. |
| car_sell_3_f_g.flac | старший обоза: скупает | Gacrux | loud, commanding, pleased | Грузите на третий воз! Беру всё. |
| car_sell_4_g.flac | старший обоза: скупает | Rasalgethi | fair, calm | Честная цена. Держи монеты. |
| car_sell_4_f_g.flac | старший обоза: скупает | Gacrux | fair, calm | Честная цена. Держи монеты. |
| car_sell_5_g.flac | старший обоза: скупает | Rasalgethi | eager | Годится. Ещё что-нибудь есть? |
| car_sell_5_f_g.flac | старший обоза: скупает | Gacrux | eager | Годится. Ещё что-нибудь есть? |
| car_poor_0_g.flac | старший обоза: золота не хватает | Rasalgethi | dry, firm | Золота не хватит. Мы в долг не возим. |
| car_poor_0_f_g.flac | старший обоза: золота не хватает | Gacrux | dry, firm | Золота не хватит. Мы в долг не возим. |
| car_poor_1_g.flac | старший обоза: золота не хватает | Rasalgethi | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_poor_1_f_g.flac | старший обоза: золота не хватает | Gacrux | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_pass_0_g.flac | старший обоза: обоз пропустили | Rasalgethi | easygoing, friendly | Ну, как знаешь. Доброй дороги! |
| car_pass_0_f_g.flac | старший обоза: обоз пропустили | Gacrux | easygoing, friendly | Ну, как знаешь. Доброй дороги! |
| car_pass_1_g.flac | старший обоза: обоз пропустили | Rasalgethi | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_1_f_g.flac | старший обоза: обоз пропустили | Gacrux | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_2_g.flac | старший обоза: обоз пропустили | Rasalgethi | warm, parting | Счастливо оставаться. Может, свидимся. |
| car_pass_2_f_g.flac | старший обоза: обоз пропустили | Gacrux | warm, parting | Счастливо оставаться. Может, свидимся. |
| car_pass_3_g.flac | старший обоза: обоз пропустили | Rasalgethi | shrugging, friendly | Ничего не нужно? Ладно, нам пора. |
| car_pass_3_f_g.flac | старший обоза: обоз пропустили | Gacrux | shrugging, friendly | Ничего не нужно? Ладно, нам пора. |
| car_pass_4_g.flac | старший обоза: обоз пропустили | Rasalgethi | loud, cheerful command | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_4_f_g.flac | старший обоза: обоз пропустили | Gacrux | loud, cheerful command | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_5_g.flac | старший обоза: обоз пропустили | Rasalgethi | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_pass_5_f_g.flac | старший обоза: обоз пропустили | Gacrux | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_hire_0_g.flac | старший обоза: нанимает в охрану | Rasalgethi | decisive, commanding | Нанят! Держись у последнего воза. |
| car_hire_0_f_g.flac | старший обоза: нанимает в охрану | Gacrux | decisive, commanding | Нанят! Держись у последнего воза. |
| car_hire_1_g.flac | старший обоза: нанимает в охрану | Rasalgethi | appraising, businesslike | Меч при тебе? Отлично. Плата в городе. |
| car_hire_1_f_g.flac | старший обоза: нанимает в охрану | Gacrux | appraising, businesslike | Меч при тебе? Отлично. Плата в городе. |
| car_hire_2_g.flac | старший обоза: нанимает в охрану | Rasalgethi | relieved, welcoming | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_2_f_g.flac | старший обоза: нанимает в охрану | Gacrux | relieved, welcoming | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_3_g.flac | старший обоза: нанимает в охрану | Rasalgethi | businesslike, fair | Договорились. Довезём груз — получишь сполна. |
| car_hire_3_f_g.flac | старший обоза: нанимает в охрану | Gacrux | businesslike, fair | Договорились. Довезём груз — получишь сполна. |
| car_hire_4_g.flac | старший обоза: нанимает в охрану | Rasalgethi | serious, warning | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_4_f_g.flac | старший обоза: нанимает в охрану | Gacrux | serious, warning | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_5_g.flac | старший обоза: нанимает в охрану | Rasalgethi | friendly, reassuring | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_5_f_g.flac | старший обоза: нанимает в охрану | Gacrux | friendly, reassuring | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_busy_0_g.flac | старший обоза: уже при обозе | Rasalgethi | dry, reasonable | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_0_f_g.flac | старший обоза: уже при обозе | Gacrux | dry, reasonable | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_1_g.flac | старший обоза: уже при обозе | Rasalgethi | firm, friendly | Ты другой обоз ведёшь. Сперва доведи его. |
| car_hire_busy_1_f_g.flac | старший обоза: уже при обозе | Gacrux | firm, friendly | Ты другой обоз ведёшь. Сперва доведи его. |
| car_news_0_g.flac | старший обоза: новости | Rasalgethi | conversational, confiding | Слушай, что на дорогах делается. |
| car_news_0_f_g.flac | старший обоза: новости | Gacrux | conversational, confiding | Слушай, что на дорогах делается. |
| car_news_1_g.flac | старший обоза: новости | Rasalgethi | friendly, storyteller | Расскажу, что знаю. Мы много где бываем. |
| car_news_1_f_g.flac | старший обоза: новости | Gacrux | friendly, storyteller | Расскажу, что знаю. Мы много где бываем. |
| car_news_2_g.flac | старший обоза: новости | Rasalgethi | amused, chatty | Новости? Их у нас больше, чем товара. |
| car_news_2_f_g.flac | старший обоза: новости | Gacrux | amused, chatty | Новости? Их у нас больше, чем товара. |
| car_arrive_0_g.flac | старший обоза: дошли, плата | Rasalgethi | relieved, grateful | Дошли! Держи плату, заслужено. |
| car_arrive_0_f_g.flac | старший обоза: дошли, плата | Gacrux | relieved, grateful | Дошли! Держи плату, заслужено. |
| car_arrive_1_g.flac | старший обоза: дошли, плата | Rasalgethi | sincere, grateful | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_1_f_g.flac | старший обоза: дошли, плата | Gacrux | sincere, grateful | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_2_g.flac | старший обоза: дошли, плата | Rasalgethi | satisfied, friendly | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_2_f_g.flac | старший обоза: дошли, плата | Gacrux | satisfied, friendly | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_3_g.flac | старший обоза: дошли, плата | Rasalgethi | relieved, satisfied | Живы, груз цел. Честно заработано. |
| car_arrive_3_f_g.flac | старший обоза: дошли, плата | Gacrux | relieved, satisfied | Живы, груз цел. Честно заработано. |
| guard_quest_0_g.flac | стражник: дело на разбойников | Alnilam | stern, businesslike | Разбойники на тракте совсем обнаглели. Очисти округу — головы принесёшь в доказательство. |
| guard_quest_0_v1_g.flac | стражник: дело на разбойников | Orus | stern, businesslike | Разбойники на тракте совсем обнаглели. Очисти округу — головы принесёшь в доказательство. |
| guard_quest_1_g.flac | стражник: дело на разбойников | Alnilam | tired, hopeful | Нам людей не хватает. Возьмёшься за разбойников на дороге? |
| guard_quest_1_v1_g.flac | стражник: дело на разбойников | Orus | tired, hopeful | Нам людей не хватает. Возьмёшься за разбойников на дороге? |
| guard_quest_2_g.flac | стражник: дело на разбойников | Alnilam | grim, commanding | На тракте грабят обозы. Найди эту шайку и покончи с ней. |
| guard_quest_2_v1_g.flac | стражник: дело на разбойников | Orus | grim, commanding | На тракте грабят обозы. Найди эту шайку и покончи с ней. |
| guard_quest_3_g.flac | стражник: дело на разбойников | Alnilam | dry, official | Капитан платит за каждую голову разбойника. Слово стражи. |
| guard_quest_3_v1_g.flac | стражник: дело на разбойников | Orus | dry, official | Капитан платит за каждую голову разбойника. Слово стражи. |
| guard_quest_4_g.flac | стражник: дело на разбойников | Alnilam | earnest, dutiful | Дорога должна быть безопасной. Помоги нам с этим. |
| guard_quest_4_v1_g.flac | стражник: дело на разбойников | Orus | earnest, dutiful | Дорога должна быть безопасной. Помоги нам с этим. |
| guard_quest_5_g.flac | стражник: дело на разбойников | Alnilam | stern, matter-of-fact | Бандиты засели у тракта. Принеси их головы — получишь награду. |
| guard_quest_5_v1_g.flac | стражник: дело на разбойников | Orus | stern, matter-of-fact | Бандиты засели у тракта. Принеси их головы — получишь награду. |
| guard_quest_wait_0_g.flac | стражник: голов мало | Alnilam | dry, impatient | Ещё не всех? Разбойники сами не кончатся. |
| guard_quest_wait_0_v1_g.flac | стражник: голов мало | Orus | dry, impatient | Ещё не всех? Разбойники сами не кончатся. |
| guard_quest_wait_1_g.flac | стражник: голов мало | Alnilam | stern, dissatisfied | Голов маловато. Тракт всё ещё неспокоен. |
| guard_quest_wait_1_v1_g.flac | стражник: голов мало | Orus | stern, dissatisfied | Голов маловато. Тракт всё ещё неспокоен. |
| guard_quest_done_0_g.flac | стражник: разбойники побиты | Alnilam | pleased, gruff | Вот это работа! Тракт теперь чище. Держи плату. |
| guard_quest_done_0_v1_g.flac | стражник: разбойники побиты | Orus | pleased, gruff | Вот это работа! Тракт теперь чище. Держи плату. |
| guard_quest_done_1_g.flac | стражник: разбойники побиты | Alnilam | satisfied, grim | Головы на месте. Капитан будет доволен. |
| guard_quest_done_1_v1_g.flac | стражник: разбойники побиты | Orus | satisfied, grim | Головы на месте. Капитан будет доволен. |
| guard_quest_done_2_g.flac | стражник: разбойники побиты | Alnilam | grateful, official | Спасибо от всей стражи. Дорога снова безопасна. |
| guard_quest_done_2_v1_g.flac | стражник: разбойники побиты | Orus | grateful, official | Спасибо от всей стражи. Дорога снова безопасна. |
| guard_quest_done_3_g.flac | стражник: разбойники побиты | Alnilam | respectful, gruff | Честная работа. Если понадобишься — позовём. |
| guard_quest_done_3_v1_g.flac | стражник: разбойники побиты | Orus | respectful, gruff | Честная работа. Если понадобишься — позовём. |
| patrol_0_g.flac | дорожный дозор | Alnilam | loud, commanding shout | Дозор державы! Дорогу! |
| patrol_0_v1_g.flac | дорожный дозор | Orus | loud, commanding shout | Дозор державы! Дорогу! |
| patrol_1_g.flac | дорожный дозор | Alnilam | stern, then dismissive | Стой! Проверка. Ладно, проходи. |
| patrol_1_v1_g.flac | дорожный дозор | Orus | stern, then dismissive | Стой! Проверка. Ладно, проходи. |
| patrol_2_g.flac | дорожный дозор | Alnilam | watchful, questioning | Разбойников на пути не видно было? |
| patrol_2_v1_g.flac | дорожный дозор | Orus | watchful, questioning | Разбойников на пути не видно было? |
| patrol_3_g.flac | дорожный дозор | Alnilam | reassuring, stern | Держись тракта, путник. Мы рядом. |
| patrol_3_v1_g.flac | дорожный дозор | Orus | reassuring, stern | Держись тракта, путник. Мы рядом. |
| patrol_4_g.flac | дорожный дозор | Alnilam | loud military command | Шагом марш! Не растягиваться! |
| patrol_4_v1_g.flac | дорожный дозор | Orus | loud military command | Шагом марш! Не растягиваться! |
| patrol_5_g.flac | дорожный дозор | Alnilam | rhythmic marching command, loud | Левой! Левой! Держать строй! |
| patrol_5_v1_g.flac | дорожный дозор | Orus | rhythmic marching command, loud | Левой! Левой! Держать строй! |
| patrol_6_g.flac | дорожный дозор | Alnilam | gruff warning | На обочине не стой — строй идёт. |
| patrol_6_v1_g.flac | дорожный дозор | Orus | gruff warning | На обочине не стой — строй идёт. |
| patrol_7_g.flac | дорожный дозор | Alnilam | calm, proud | Дорога под охраной. Можно не бояться. |
| patrol_7_v1_g.flac | дорожный дозор | Orus | calm, proud | Дорога под охраной. Можно не бояться. |
| bandit_0_g.flac | разбойник: угроза | Fenrir | menacing shout | Кошелёк или жизнь! |
| bandit_0_v1_g.flac | разбойник: угроза | Enceladus | menacing shout | Кошелёк или жизнь! |
| bandit_1_g.flac | разбойник: угроза | Fenrir | mocking, threatening | Стой! Дальше дорога платная. |
| bandit_1_v1_g.flac | разбойник: угроза | Enceladus | mocking, threatening | Стой! Дальше дорога платная. |
| bandit_2_g.flac | разбойник: угроза | Fenrir | gloating, sly | Гляди-ка, одинокий путник. Нам повезло. |
| bandit_2_v1_g.flac | разбойник: угроза | Enceladus | gloating, sly | Гляди-ка, одинокий путник. Нам повезло. |
| bandit_3_g.flac | разбойник: угроза | Fenrir | menacing, calm | Выкладывай всё, что есть, и разойдёмся миром. |
| bandit_3_v1_g.flac | разбойник: угроза | Enceladus | menacing, calm | Выкладывай всё, что есть, и разойдёмся миром. |
| bandit_4_g.flac | разбойник: угроза | Fenrir | threatening, low | Тихо, тихо. Руки от оружия. |
| bandit_4_v1_g.flac | разбойник: угроза | Enceladus | threatening, low | Тихо, тихо. Руки от оружия. |
| bandit_5_g.flac | разбойник: угроза | Fenrir | mocking, loud | Ребята, у нас гость. Встречайте! |
| bandit_5_v1_g.flac | разбойник: угроза | Enceladus | mocking, loud | Ребята, у нас гость. Встречайте! |
| bandit_6_g.flac | разбойник: угроза | Fenrir | sneering | Плати пошлину — нашу, дорожную. |
| bandit_6_v1_g.flac | разбойник: угроза | Enceladus | sneering | Плати пошлину — нашу, дорожную. |
| bandit_7_g.flac | разбойник: угроза | Fenrir | menacing, gloating | Некуда бежать. Мы тут везде. |
| bandit_7_v1_g.flac | разбойник: угроза | Enceladus | menacing, gloating | Некуда бежать. Мы тут везде. |
| bandit_flee_0_g.flac | разбойник: просит пощады | Fenrir | panicked shout | Уходим! Этот не по зубам! |
| bandit_flee_0_v1_g.flac | разбойник: просит пощады | Enceladus | panicked shout | Уходим! Этот не по зубам! |
| bandit_flee_1_g.flac | разбойник: просит пощады | Fenrir | begging, terrified | Пощади! Всё отдам! |
| bandit_flee_1_v1_g.flac | разбойник: просит пощады | Enceladus | begging, terrified | Пощади! Всё отдам! |
| bandit_flee_2_g.flac | разбойник: просит пощады | Fenrir | frightened, gasping | Всё, всё, сдаюсь! |
| bandit_flee_2_v1_g.flac | разбойник: просит пощады | Enceladus | frightened, gasping | Всё, всё, сдаюсь! |
| bandit_flee_3_g.flac | разбойник: просит пощады | Fenrir | panicked, loud | Братцы, спасайся кто может! |
| bandit_flee_3_v1_g.flac | разбойник: просит пощады | Enceladus | panicked, loud | Братцы, спасайся кто может! |
| enter_castle_0_g.flac | на пороге: стражник у ворот замка | Alnilam | stern, checking, then allowing | Стой. Кто таков? Ладно, проходи, только без глупостей. |
| enter_castle_0_v1_g.flac | на пороге: стражник у ворот замка | Orus | stern, checking, then allowing | Стой. Кто таков? Ладно, проходи, только без глупостей. |
| enter_castle_1_g.flac | на пороге: стражник у ворот замка | Alnilam | formal, firm | Добро пожаловать в замок. Оружие держи в ножнах. |
| enter_castle_1_v1_g.flac | на пороге: стражник у ворот замка | Orus | formal, firm | Добро пожаловать в замок. Оружие держи в ножнах. |
| enter_castle_2_g.flac | на пороге: стражник у ворот замка | Alnilam | dutiful, matter-of-fact | Проходи. Лорд нынче не принимает, но двор открыт. |
| enter_castle_2_v1_g.flac | на пороге: стражник у ворот замка | Orus | dutiful, matter-of-fact | Проходи. Лорд нынче не принимает, но двор открыт. |
| enter_castle_3_g.flac | на пороге: стражник у ворот замка | Alnilam | gruff, advising | Ворота открыты до заката. Не задерживайся у казарм. |
| enter_castle_3_v1_g.flac | на пороге: стражник у ворот замка | Orus | gruff, advising | Ворота открыты до заката. Не задерживайся у казарм. |
| enter_castle_4_g.flac | на пороге: стражник у ворот замка | Alnilam | watchful, stern | Гость? Проходи. За порядком тут смотрят строго. |
| enter_castle_4_v1_g.flac | на пороге: стражник у ворот замка | Orus | watchful, stern | Гость? Проходи. За порядком тут смотрят строго. |
| enter_castle_5_g.flac | на пороге: стражник у ворот замка | Alnilam | loud call to other guards | Путник в замок! Пропустить! |
| enter_castle_5_v1_g.flac | на пороге: стражник у ворот замка | Orus | loud call to other guards | Путник в замок! Пропустить! |
| enter_castle_6_g.flac | на пороге: стражник у ворот замка | Alnilam | serious, warning | Держись дороги к двору. На стены чужим нельзя. |
| enter_castle_6_v1_g.flac | на пороге: стражник у ворот замка | Orus | serious, warning | Держись дороги к двору. На стены чужим нельзя. |
| enter_castle_7_g.flac | на пороге: стражник у ворот замка | Alnilam | proud, dutiful | Замок стоит, пока мы стоим. Входи с миром. |
| enter_castle_7_v1_g.flac | на пороге: стражник у ворот замка | Orus | proud, dutiful | Замок стоит, пока мы стоим. Входи с миром. |
| enter_fort_0_g.flac | на пороге: стражник у ворот крепости | Alnilam | tense, brusque | Крепость на военном положении. Проходи и не мешайся. |
| enter_fort_0_v1_g.flac | на пороге: стражник у ворот крепости | Orus | tense, brusque | Крепость на военном положении. Проходи и не мешайся. |
| enter_fort_1_g.flac | на пороге: стражник у ворот крепости | Alnilam | wary, then relieved | Стой! Свой? Ну проходи, гарнизон рад живой душе. |
| enter_fort_1_v1_g.flac | на пороге: стражник у ворот крепости | Orus | wary, then relieved | Стой! Свой? Ну проходи, гарнизон рад живой душе. |
| enter_fort_2_g.flac | на пороге: стражник у ворот крепости | Alnilam | hard, commanding | В крепости порядок один — наш. Уяснил? |
| enter_fort_2_v1_g.flac | на пороге: стражник у ворот крепости | Orus | hard, commanding | В крепости порядок один — наш. Уяснил? |
| enter_fort_3_g.flac | на пороге: стражник у ворот крепости | Alnilam | dry, warning | Проходи. У арсенала не стой, стрелки нервные. |
| enter_fort_3_v1_g.flac | на пороге: стражник у ворот крепости | Orus | dry, warning | Проходи. У арсенала не стой, стрелки нервные. |
| enter_fort_4_g.flac | на пороге: стражник у ворот крепости | Alnilam | suspicious, muttering | Ещё один странник. Лишь бы не лазутчик. |
| enter_fort_4_v1_g.flac | на пороге: стражник у ворот крепости | Orus | suspicious, muttering | Ещё один странник. Лишь бы не лазутчик. |
| enter_fort_5_g.flac | на пороге: стражник у ворот крепости | Alnilam | reassuring, gruff | Добро пожаловать за стены. Здесь безопаснее, чем в поле. |
| enter_fort_5_v1_g.flac | на пороге: стражник у ворот крепости | Orus | reassuring, gruff | Добро пожаловать за стены. Здесь безопаснее, чем в поле. |
| enter_fort_6_g.flac | на пороге: стражник у ворот крепости | Alnilam | hurried, impatient | Проходи быстрее, ворота закрываем. |
| enter_fort_6_v1_g.flac | на пороге: стражник у ворот крепости | Orus | hurried, impatient | Проходи быстрее, ворота закрываем. |
| enter_fort_7_g.flac | на пороге: стражник у ворот крепости | Alnilam | weary, proud | Крепость видела осады и похуже. Входи. |
| enter_fort_7_v1_g.flac | на пороге: стражник у ворот крепости | Orus | weary, proud | Крепость видела осады и похуже. Входи. |
| enter_gate_friend_0_g.flac | на пороге: стражник своему | Alnilam | warm, glad | А, это ты! Проходи, для тебя ворота всегда открыты. |
| enter_gate_friend_0_v1_g.flac | на пороге: стражник своему | Orus | warm, glad | А, это ты! Проходи, для тебя ворота всегда открыты. |
| enter_gate_friend_1_g.flac | на пороге: стражник своему | Alnilam | friendly, hearty | Своих пропускаем без вопросов. С возвращением! |
| enter_gate_friend_1_v1_g.flac | на пороге: стражник своему | Orus | friendly, hearty | Своих пропускаем без вопросов. С возвращением! |
| enter_gate_friend_2_g.flac | на пороге: стражник своему | Alnilam | sincere, friendly | Рад видеть! Про тебя тут только доброе говорят. |
| enter_gate_friend_2_v1_g.flac | на пороге: стражник своему | Orus | sincere, friendly | Рад видеть! Про тебя тут только доброе говорят. |
| enter_gate_friend_3_g.flac | на пороге: стражник своему | Alnilam | cheerful call | Эй, ребята, это наш друг! Пропустите. |
| enter_gate_friend_3_v1_g.flac | на пороге: стражник своему | Orus | cheerful call | Эй, ребята, это наш друг! Пропустите. |
| enter_gate_friend_4_g.flac | на пороге: стражник своему | Alnilam | warm, protective | Проходи, проходи. Если что — зови стражу, поможем. |
| enter_gate_friend_4_v1_g.flac | на пороге: стражник своему | Orus | warm, protective | Проходи, проходи. Если что — зови стражу, поможем. |
| enter_gate_friend_5_g.flac | на пороге: стражник своему | Alnilam | respectful, warm | О, наш герой вернулся. Добро пожаловать домой. |
| enter_gate_friend_5_v1_g.flac | на пороге: стражник своему | Orus | respectful, warm | О, наш герой вернулся. Добро пожаловать домой. |
| enter_gate_cold_0_g.flac | на пороге: стражник недругу | Alnilam | cold, suspicious | Тебя тут не ждали. Проходи, но я смотрю за тобой. |
| enter_gate_cold_0_v1_g.flac | на пороге: стражник недругу | Orus | cold, suspicious | Тебя тут не ждали. Проходи, но я смотрю за тобой. |
| enter_gate_cold_1_g.flac | на пороге: стражник недругу | Alnilam | cold, threatening | Одно лишнее движение — и в темницу. |
| enter_gate_cold_1_v1_g.flac | на пороге: стражник недругу | Orus | cold, threatening | Одно лишнее движение — и в темницу. |
| enter_gate_cold_2_g.flac | на пороге: стражник недругу | Alnilam | hostile, curt | Наслышаны о тебе. Недоброе слышали. |
| enter_gate_cold_2_v1_g.flac | на пороге: стражник недругу | Orus | hostile, curt | Наслышаны о тебе. Недоброе слышали. |
| enter_gate_cold_3_g.flac | на пороге: стражник недругу | Alnilam | cold, dismissive | Проходи молча. И не задерживайся. |
| enter_gate_cold_3_v1_g.flac | на пороге: стражник недругу | Orus | cold, dismissive | Проходи молча. И не задерживайся. |
| enter_gate_cold_4_g.flac | на пороге: стражник недругу | Alnilam | hard, distrustful | Держи руки на виду, чужак. |
| enter_gate_cold_4_v1_g.flac | на пороге: стражник недругу | Orus | hard, distrustful | Держи руки на виду, чужак. |
| enter_gate_cold_5_g.flac | на пороге: стражник недругу | Alnilam | resentful, muttering | Будь моя воля — не пустил бы. |
| enter_gate_cold_5_v1_g.flac | на пороге: стражник недругу | Orus | resentful, muttering | Будь моя воля — не пустил бы. |
| enter_gate_night_0_g.flac | на пороге: ночной стражник | Alnilam | sharp, alarmed, night call | Кто идёт в такой час? Назовись! |
| enter_gate_night_0_v1_g.flac | на пороге: ночной стражник | Orus | sharp, alarmed, night call | Кто идёт в такой час? Назовись! |
| enter_gate_night_1_g.flac | на пороге: ночной стражник | Alnilam | grumbling, sleepy | Ночью ворота на засове. Ладно, проходи, раз пришёл. |
| enter_gate_night_1_v1_g.flac | на пороге: ночной стражник | Orus | grumbling, sleepy | Ночью ворота на засове. Ладно, проходи, раз пришёл. |
| enter_gate_night_2_g.flac | на пороге: ночной стражник | Alnilam | hushed, stern | Тише. Город спит. Не шуми на улицах. |
| enter_gate_night_2_v1_g.flac | на пороге: ночной стражник | Orus | hushed, stern | Тише. Город спит. Не шуми на улицах. |
| enter_gate_night_3_g.flac | на пороге: ночной стражник | Alnilam | wry, wary | Ночь тёмная, а ты один. Храбрый или глупый? |
| enter_gate_night_3_v1_g.flac | на пороге: ночной стражник | Orus | wry, wary | Ночь тёмная, а ты один. Храбрый или глупый? |
| enter_gate_night_4_g.flac | на пороге: ночной стражник | Alnilam | low voice, cautionary | Факел держи ближе. Ночью всякое бродит. |
| enter_gate_night_4_v1_g.flac | на пороге: ночной стражник | Orus | low voice, cautionary | Факел держи ближе. Ночью всякое бродит. |
| enter_gate_night_5_g.flac | на пороге: ночной стражник | Alnilam | tired, helpful | Поздно гуляешь, путник. Трактир ещё открыт. |
| enter_gate_night_5_v1_g.flac | на пороге: ночной стражник | Orus | tired, helpful | Поздно гуляешь, путник. Трактир ещё открыт. |
| enter_clanhall_0_g.flac | на пороге: страж чертога клана | Alnilam | solemn, proud | Дом клана. Здесь чтут старших и помнят кровь. |
| enter_clanhall_0_v1_g.flac | на пороге: страж чертога клана | Orus | solemn, proud | Дом клана. Здесь чтут старших и помнят кровь. |
| enter_clanhall_1_g.flac | на пороге: страж чертога клана | Alnilam | hospitable, gruff | Входи. За столом клана гостю место найдётся. |
| enter_clanhall_1_v1_g.flac | на пороге: страж чертога клана | Orus | hospitable, gruff | Входи. За столом клана гостю место найдётся. |
| enter_clanhall_2_g.flac | на пороге: страж чертога клана | Alnilam | stern, reverent | Сними шапку, чужак. Это чертог предков. |
| enter_clanhall_2_v1_g.flac | на пороге: страж чертога клана | Orus | stern, reverent | Сними шапку, чужак. Это чертог предков. |
| enter_clanhall_3_g.flac | на пороге: страж чертога клана | Alnilam | hushed, firm | Старейшины совещаются. Не шуми. |
| enter_clanhall_3_v1_g.flac | на пороге: страж чертога клана | Orus | hushed, firm | Старейшины совещаются. Не шуми. |
| enter_clanhall_4_g.flac | на пороге: страж чертога клана | Alnilam | measured, warning | Клан гостя не обидит, если гость не обидит клан. |
| enter_clanhall_4_v1_g.flac | на пороге: страж чертога клана | Orus | measured, warning | Клан гостя не обидит, если гость не обидит клан. |
| enter_clanhall_5_g.flac | на пороге: страж чертога клана | Alnilam | jovial, hearty | Ещё один на пир? Проходи, мёда хватит. |
| enter_clanhall_5_v1_g.flac | на пороге: страж чертога клана | Orus | jovial, hearty | Ещё один на пир? Проходи, мёда хватит. |
| enter_warcamp_0_g.flac | на пороге: часовой лагеря | Alnilam | busy, gruff | Лагерь войска. Кто пустил? А, ладно, проходи. |
| enter_warcamp_0_v1_g.flac | на пороге: часовой лагеря | Orus | busy, gruff | Лагерь войска. Кто пустил? А, ладно, проходи. |
| enter_warcamp_1_g.flac | на пороге: часовой лагеря | Alnilam | brusque, hurried | Не путайся под ногами, у нас сборы. |
| enter_warcamp_1_v1_g.flac | на пороге: часовой лагеря | Orus | brusque, hurried | Не путайся под ногами, у нас сборы. |
| enter_warcamp_2_g.flac | на пороге: часовой лагеря | Alnilam | matter-of-fact, directing | К интенданту — налево. К лекарю — за шатрами. |
| enter_warcamp_2_v1_g.flac | на пороге: часовой лагеря | Orus | matter-of-fact, directing | К интенданту — налево. К лекарю — за шатрами. |
| enter_warcamp_3_g.flac | на пороге: часовой лагеря | Alnilam | interested, businesslike | Наёмник? Командиру такие нужны. |
| enter_warcamp_3_v1_g.flac | на пороге: часовой лагеря | Orus | interested, businesslike | Наёмник? Командиру такие нужны. |
| enter_warcamp_4_g.flac | на пороге: часовой лагеря | Alnilam | lowered voice, warning | Тише у шатра воеводы. Он не спал две ночи. |
| enter_warcamp_4_v1_g.flac | на пороге: часовой лагеря | Orus | lowered voice, warning | Тише у шатра воеводы. Он не спал две ночи. |
| enter_warcamp_5_g.flac | на пороге: часовой лагеря | Alnilam | determined, rousing | Скоро выступаем. Хочешь с нами — готовь меч. |
| enter_warcamp_5_v1_g.flac | на пороге: часовой лагеря | Orus | determined, rousing | Скоро выступаем. Хочешь с нами — готовь меч. |
| enter_dark_city_0_g.flac | на пороге: латник смены за Гранью | Charon | cold, flat, commanding | Стоять. Печать. Нет печати? Проходи. Пока. |
| enter_dark_city_0_v1_g.flac | на пороге: латник смены за Гранью | Schedar | cold, flat, commanding | Стоять. Печать. Нет печати? Проходи. Пока. |
| enter_dark_city_1_g.flac | на пороге: латник смены за Гранью | Charon | cold, ominous, quiet | За Гранью гостей не любят. Помни это. |
| enter_dark_city_1_v1_g.flac | на пороге: латник смены за Гранью | Schedar | cold, ominous, quiet | За Гранью гостей не любят. Помни это. |
| enter_dark_city_2_g.flac | на пороге: латник смены за Гранью | Charon | cold, detached, menacing | Ты в посаде Владыки. Здесь живут по его слову. |
| enter_dark_city_2_v1_g.flac | на пороге: латник смены за Гранью | Schedar | cold, detached, menacing | Ты в посаде Владыки. Здесь живут по его слову. |
| enter_dark_city_3_g.flac | на пороге: латник смены за Гранью | Charon | flat, grim | Проходи. Мёртвые на улицах не твоя забота. |
| enter_dark_city_3_v1_g.flac | на пороге: латник смены за Гранью | Schedar | flat, grim | Проходи. Мёртвые на улицах не твоя забота. |
| enter_dark_city_4_g.flac | на пороге: латник смены за Гранью | Charon | cold, menacing | Смена видит всё. Даже то, чего ты не делал. |
| enter_dark_city_4_v1_g.flac | на пороге: латник смены за Гранью | Schedar | cold, menacing | Смена видит всё. Даже то, чего ты не делал. |
| enter_dark_city_5_g.flac | на пороге: латник смены за Гранью | Charon | flat, clipped report | Чужак за воротами. Отметить. |
| enter_dark_city_5_v1_g.flac | на пороге: латник смены за Гранью | Schedar | flat, clipped report | Чужак за воротами. Отметить. |
| enter_dark_city_6_g.flac | на пороге: латник смены за Гранью | Charon | cold, dark humour | Войти легко. Выйти — как повезёт. |
| enter_dark_city_6_v1_g.flac | на пороге: латник смены за Гранью | Schedar | cold, dark humour | Войти легко. Выйти — как повезёт. |
| enter_dark_city_7_g.flac | на пороге: латник смены за Гранью | Charon | low, ominous advice | Держись света. В тени у нас свои хозяева. |
| enter_dark_city_7_v1_g.flac | на пороге: латник смены за Гранью | Schedar | low, ominous advice | Держись света. В тени у нас свои хозяева. |
| enter_dark_shrine_0_g.flac | на пороге: служитель святилища Тьмы | Charon | cold, solemn, commanding | Святилище Тьмы. Преклони голову или уходи. |
| enter_dark_shrine_0_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | cold, solemn, commanding | Святилище Тьмы. Преклони голову или уходи. |
| enter_dark_shrine_1_g.flac | на пороге: служитель святилища Тьмы | Charon | hollow, ominous | Здесь молятся тому, кто не прощает. |
| enter_dark_shrine_1_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | hollow, ominous | Здесь молятся тому, кто не прощает. |
| enter_dark_shrine_2_g.flac | на пороге: служитель святилища Тьмы | Charon | flat, grim, quiet | Кровь на алтаре свежая. Не спрашивай чья. |
| enter_dark_shrine_2_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | flat, grim, quiet | Кровь на алтаре свежая. Не спрашивай чья. |
| enter_dark_shrine_3_g.flac | на пороге: служитель святилища Тьмы | Charon | hushed, cold | Тихо. Жрецы слушают шёпот из-за Грани. |
| enter_dark_shrine_3_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | hushed, cold | Тихо. Жрецы слушают шёпот из-за Грани. |
| enter_dark_shrine_4_g.flac | на пороге: служитель святилища Тьмы | Charon | cold, demanding | Дар принёс? Без дара тут не отвечают. |
| enter_dark_shrine_4_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | cold, demanding | Дар принёс? Без дара тут не отвечают. |
| enter_dark_shrine_5_g.flac | на пороге: служитель святилища Тьмы | Charon | cold, warning whisper | Свечи чёрные не трогай. Это не для живых. |
| enter_dark_shrine_5_v1_g.flac | на пороге: служитель святилища Тьмы | Schedar | cold, warning whisper | Свечи чёрные не трогай. Это не для живых. |
| enter_dark_bazaar_0_g.flac | на пороге: надсмотрщик базара теней | Charon | cold, sly | Базар теней. Всё продаётся, всё покупается. |
| enter_dark_bazaar_0_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | cold, sly | Базар теней. Всё продаётся, всё покупается. |
| enter_dark_bazaar_1_g.flac | на пороге: надсмотрщик базара теней | Charon | dry, grim warning | Кошель держи крепче. Здесь режут не только цены. |
| enter_dark_bazaar_1_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | dry, grim warning | Кошель держи крепче. Здесь режут не только цены. |
| enter_dark_bazaar_2_g.flac | на пороге: надсмотрщик базара теней | Charon | low, conspiratorial | Не спрашивай, откуда товар. И тебя не спросят. |
| enter_dark_bazaar_2_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | low, conspiratorial | Не спрашивай, откуда товар. И тебя не спросят. |
| enter_dark_bazaar_3_g.flac | на пороге: надсмотрщик базара теней | Charon | cold, menacing | Долги здесь отдают кровью. Помни. |
| enter_dark_bazaar_3_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | cold, menacing | Долги здесь отдают кровью. Помни. |
| enter_dark_bazaar_4_g.flac | на пороге: надсмотрщик базара теней | Charon | tense, hurried | Торгуй быстро. Смена скоро обходит ряды. |
| enter_dark_bazaar_4_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | tense, hurried | Торгуй быстро. Смена скоро обходит ряды. |
| enter_dark_bazaar_5_g.flac | на пороге: надсмотрщик базара теней | Charon | cold, dark humour | Души не принимаем. Пока. |
| enter_dark_bazaar_5_v1_g.flac | на пороге: надсмотрщик базара теней | Schedar | cold, dark humour | Души не принимаем. Пока. |
| enter_temple_0_g.flac | на пороге: жрец, жрица | Zubenelgenubi | calm, gentle, serene | Мир тебе, путник. Боги видят входящего. |
| enter_temple_0_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | calm, gentle, serene | Мир тебе, путник. Боги видят входящего. |
| enter_temple_1_g.flac | на пороге: жрец, жрица | Zubenelgenubi | warm, soft | Войди с миром. Здесь всякий найдёт утешение. |
| enter_temple_1_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | warm, soft | Войди с миром. Здесь всякий найдёт утешение. |
| enter_temple_2_g.flac | на пороге: жрец, жрица | Zubenelgenubi | hushed, kind | Тише, дитя. Идёт служба. |
| enter_temple_2_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | hushed, kind | Тише, дитя. Идёт служба. |
| enter_temple_3_g.flac | на пороге: жрец, жрица | Zubenelgenubi | gentle, sorrowful | Свеча у алтаря — за тех, кто не вернулся. Поставишь? |
| enter_temple_3_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | gentle, sorrowful | Свеча у алтаря — за тех, кто не вернулся. Поставишь? |
| enter_temple_4_g.flac | на пороге: жрец, жрица | Zubenelgenubi | caring, reassuring | Ранен? Лекари при храме помогут. Боги милостивы. |
| enter_temple_4_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | caring, reassuring | Ранен? Лекари при храме помогут. Боги милостивы. |
| enter_temple_5_g.flac | на пороге: жрец, жрица | Zubenelgenubi | solemn, blessing | Благословляю твой путь. Пусть Грань будет к тебе добра. |
| enter_temple_5_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | solemn, blessing | Благословляю твой путь. Пусть Грань будет к тебе добра. |
| enter_temple_6_g.flac | на пороге: жрец, жрица | Zubenelgenubi | gentle, knowing | Давно ты не заходил под эти своды. |
| enter_temple_6_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | gentle, knowing | Давно ты не заходила под эти своды. |
| enter_temple_7_g.flac | на пороге: жрец, жрица | Zubenelgenubi | calm, firm | Оставь гнев у порога. Здесь ему не место. |
| enter_temple_7_f_g.flac | на пороге: жрец, жрица | Vindemiatrix | calm, firm | Оставь гнев у порога. Здесь ему не место. |
| enter_tavern_0_g.flac | на пороге: трактирщик, трактирщица | Puck | hearty, welcoming, loud | Заходи, заходи! Садись поближе к огню. |
| enter_tavern_0_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | hearty, welcoming, loud | Заходи, заходи! Садись поближе к огню. |
| enter_tavern_1_g.flac | на пороге: трактирщик, трактирщица | Puck | cheerful, busy | Эль свежий, похлёбка горячая. Чего желаешь? |
| enter_tavern_1_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | cheerful, busy | Эль свежий, похлёбка горячая. Чего желаешь? |
| enter_tavern_2_g.flac | на пороге: трактирщик, трактирщица | Puck | friendly, curious | А, новое лицо! Свободная койка наверху найдётся. |
| enter_tavern_2_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | friendly, curious | А, новое лицо! Свободная койка наверху найдётся. |
| enter_tavern_3_g.flac | на пороге: трактирщик, трактирщица | Puck | good-humoured warning | Только без драк. Вышибала у нас злой. |
| enter_tavern_3_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | good-humoured warning | Только без драк. Вышибала у нас злой. |
| enter_tavern_4_g.flac | на пороге: трактирщик, трактирщица | Puck | warm, chatty | Садись, отдохни с дороги. Новостей — полный зал. |
| enter_tavern_4_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | warm, chatty | Садись, отдохни с дороги. Новостей — полный зал. |
| enter_tavern_5_g.flac | на пороге: трактирщик, трактирщица | Puck | businesslike, jovial | Плати вперёд — и хоть до утра пей. |
| enter_tavern_5_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | businesslike, jovial | Плати вперёд — и хоть до утра пей. |
| enter_tavern_6_g.flac | на пороге: трактирщик, трактирщица | Puck | enthusiastic | Бард сегодня в ударе. Послушай, не пожалеешь. |
| enter_tavern_6_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | enthusiastic | Бард сегодня в ударе. Послушай, не пожалеешь. |
| enter_tavern_7_g.flac | на пороге: трактирщик, трактирщица | Puck | kind, knowing | Устал? По глазам вижу. Налью покрепче. |
| enter_tavern_7_f_g.flac | на пороге: трактирщик, трактирщица | Pulcherrima | kind, knowing | Устал? По глазам вижу. Налью покрепче. |
| enter_village_0_g.flac | на пороге: староста | Achird | warm, rustic, elder | Здравствуй, путник. Деревня у нас тихая, живём трудом. |
| enter_village_0_f_g.flac | на пороге: староста | Sulafat | warm, rustic, elder | Здравствуй, путник. Деревня у нас тихая, живём трудом. |
| enter_village_1_g.flac | на пороге: староста | Achird | hospitable, simple | Гостю рады. Хлеб есть, вода в колодце чистая. |
| enter_village_1_f_g.flac | на пороге: староста | Sulafat | hospitable, simple | Гостю рады. Хлеб есть, вода в колодце чистая. |
| enter_village_2_g.flac | на пороге: староста | Achird | worried, curious | Ты с тракта? Волков по дороге не видал? |
| enter_village_2_f_g.flac | на пороге: староста | Sulafat | worried, curious | Ты с тракта? Волков по дороге не видал? |
| enter_village_3_g.flac | на пороге: староста | Achird | friendly, rustic humour | Проходи. Только скотину не пугай. |
| enter_village_3_f_g.flac | на пороге: староста | Sulafat | friendly, rustic humour | Проходи. Только скотину не пугай. |
| enter_village_4_g.flac | на пороге: староста | Achird | sighing, generous | Урожай нынче скудный. Но гостя накормим. |
| enter_village_4_f_g.flac | на пороге: староста | Sulafat | sighing, generous | Урожай нынче скудный. Но гостя накормим. |
| enter_village_5_g.flac | на пороге: староста | Achird | dignified, friendly | Коли по делу — ко мне. Я тут за старосту. |
| enter_village_5_f_g.flac | на пороге: староста | Sulafat | dignified, friendly | Коли по делу — ко мне. Я тут за старосту. |
| enter_village_6_g.flac | на пороге: староста | Achird | practical, direct | Мужики в поле, так что говори со мной. |
| enter_village_6_f_g.flac | на пороге: староста | Sulafat | practical, direct | Мужики в поле, так что говори со мной. |
| enter_village_7_g.flac | на пороге: староста | Achird | hopeful, pleading | Добрый человек? Нам бы помощь не помешала. |
| enter_village_7_f_g.flac | на пороге: староста | Sulafat | hopeful, pleading | Добрый человек? Нам бы помощь не помешала. |
| enter_forge_0_g.flac | на пороге: кузнец | Umbriel | loud, gruff, busy | Осторожно, горн горячий! Чего надо? |
| enter_forge_0_f_g.flac | на пороге: кузнец | Kore | loud, gruff, busy | Осторожно, горн горячий! Чего надо? |
| enter_forge_1_g.flac | на пороге: кузнец | Umbriel | shouting over hammering | Клинок наточить или новый выковать? Говори громче! |
| enter_forge_1_f_g.flac | на пороге: кузнец | Kore | shouting over hammering | Клинок наточить или новый выковать? Говори громче! |
| enter_forge_2_g.flac | на пороге: кузнец | Umbriel | gruff, matter-of-fact | Металл нынче дорог. Но работа честная. |
| enter_forge_2_f_g.flac | на пороге: кузнец | Kore | gruff, matter-of-fact | Металл нынче дорог. Но работа честная. |
| enter_forge_3_g.flac | на пороге: кузнец | Umbriel | busy, focused | Подожди, дострою подкову. Потом поговорим. |
| enter_forge_3_f_g.flac | на пороге: кузнец | Kore | busy, focused | Подожди, дострою подкову. Потом поговорим. |
| enter_forge_4_g.flac | на пороге: кузнец | Umbriel | appraising, gruff | Доспех твой видал виды. Починить? |
| enter_forge_4_f_g.flac | на пороге: кузнец | Kore | appraising, gruff | Доспех твой видал виды. Починить? |
| enter_forge_5_g.flac | на пороге: кузнец | Umbriel | gruff, proud | В кузне говорят мало. Молот за меня скажет. |
| enter_forge_5_f_g.flac | на пороге: кузнец | Kore | gruff, proud | В кузне говорят мало. Молот за меня скажет. |
| enter_forge_6_g.flac | на пороге: кузнец | Umbriel | complaining, weary | Руды бы побольше — ковал бы вдвое. |
| enter_forge_6_f_g.flac | на пороге: кузнец | Kore | complaining, weary | Руды бы побольше — ковал бы вдвое. |
| enter_forge_7_g.flac | на пороге: кузнец | Umbriel | confident, gruff | Добрая сталь жизнь спасает. Заходи. |
| enter_forge_7_f_g.flac | на пороге: кузнец | Kore | confident, gruff | Добрая сталь жизнь спасает. Заходи. |
| enter_market_0_g.flac | на пороге: торговец на рынке | Sadachbia | loud, lively barker | Подходи, не стесняйся! Товар со всех земель! |
| enter_market_0_f_g.flac | на пороге: торговец на рынке | Laomedeia | loud, lively barker | Подходи, не стесняйся! Товар со всех земель! |
| enter_market_1_g.flac | на пороге: торговец на рынке | Sadachbia | persuasive, loud | Лучшие цены на рынке — у меня! |
| enter_market_1_f_g.flac | на пороге: торговец на рынке | Laomedeia | persuasive, loud | Лучшие цены на рынке — у меня! |
| enter_market_2_g.flac | на пороге: торговец на рынке | Sadachbia | eager, lively | Свежий привоз! Смотри, пока не разобрали. |
| enter_market_2_f_g.flac | на пороге: торговец на рынке | Laomedeia | eager, lively | Свежий привоз! Смотри, пока не разобрали. |
| enter_market_3_g.flac | на пороге: торговец на рынке | Sadachbia | friendly warning, lowered voice | Кошель береги, тут карманники шныряют. |
| enter_market_3_f_g.flac | на пороге: торговец на рынке | Laomedeia | friendly warning, lowered voice | Кошель береги, тут карманники шныряют. |
| enter_market_4_g.flac | на пороге: торговец на рынке | Sadachbia | brisk, businesslike | Торг идёт бойко. Что ищешь, путник? |
| enter_market_4_f_g.flac | на пороге: торговец на рынке | Laomedeia | brisk, businesslike | Торг идёт бойко. Что ищешь, путник? |
| enter_market_5_g.flac | на пороге: торговец на рынке | Sadachbia | cheerful, rapid | Меняю, продаю, покупаю. Спрашивай! |
| enter_market_5_f_g.flac | на пороге: торговец на рынке | Laomedeia | cheerful, rapid | Меняю, продаю, покупаю. Спрашивай! |
| enter_market_6_g.flac | на пороге: торговец на рынке | Sadachbia | loud barker call | Пряности с юга! Ткани с востока! |
| enter_market_6_f_g.flac | на пороге: торговец на рынке | Laomedeia | loud barker call | Пряности с юга! Ткани с востока! |
| enter_market_7_g.flac | на пороге: торговец на рынке | Sadachbia | sly, persuasive | Не проходи мимо, для тебя скидку найду. |
| enter_market_7_f_g.flac | на пороге: торговец на рынке | Laomedeia | sly, persuasive | Не проходи мимо, для тебя скидку найду. |
| enter_school_0_g.flac | на пороге: наставник школы | Rasalgethi | calm, scholarly | Добро пожаловать в школу. Знание — лучший щит. |
| enter_school_0_f_g.flac | на пороге: наставник школы | Erinome | calm, scholarly | Добро пожаловать в школу. Знание — лучший щит. |
| enter_school_1_g.flac | на пороге: наставник школы | Rasalgethi | encouraging, teacherly | Учиться пришёл? Похвально. Начни с азов. |
| enter_school_1_f_g.flac | на пороге: наставник школы | Erinome | encouraging, teacherly | Учиться пришёл? Похвально. Начни с азов. |
| enter_school_2_g.flac | на пороге: наставник школы | Rasalgethi | hushed, strict | Тише, ученики занимаются. |
| enter_school_2_f_g.flac | на пороге: наставник школы | Erinome | hushed, strict | Тише, ученики занимаются. |
| enter_school_3_g.flac | на пороге: наставник школы | Rasalgethi | strict, dry | Книги не рвать, свечи не ронять. Это правило. |
| enter_school_3_f_g.flac | на пороге: наставник школы | Erinome | strict, dry | Книги не рвать, свечи не ронять. Это правило. |
| enter_school_4_g.flac | на пороге: наставник школы | Rasalgethi | helpful, polite | Наставник свободен. Можешь спросить о ступенях. |
| enter_school_4_f_g.flac | на пороге: наставник школы | Erinome | helpful, polite | Наставник свободен. Можешь спросить о ступенях. |
| enter_school_5_g.flac | на пороге: наставник школы | Rasalgethi | wise, measured | Знание дорого стоит. Но незнание дороже. |
| enter_school_5_f_g.flac | на пороге: наставник школы | Erinome | wise, measured | Знание дорого стоит. Но незнание дороже. |
| enter_tower_0_g.flac | на пороге: хранитель башни | Zubenelgenubi | mysterious, warning | Башня ордена. Не трогай то, что светится. |
| enter_tower_0_f_g.flac | на пороге: хранитель башни | Autonoe | mysterious, warning | Башня ордена. Не трогай то, что светится. |
| enter_tower_1_g.flac | на пороге: хранитель башни | Zubenelgenubi | awed, hushed | Магия здесь в самих стенах. Чувствуешь? |
| enter_tower_1_f_g.flac | на пороге: хранитель башни | Autonoe | awed, hushed | Магия здесь в самих стенах. Чувствуешь? |
| enter_tower_2_g.flac | на пороге: хранитель башни | Zubenelgenubi | stern, arcane | Кто пришёл к ордену? Говори, зачем ты здесь. |
| enter_tower_2_f_g.flac | на пороге: хранитель башни | Autonoe | stern, arcane | Кто пришёл к ордену? Говори, зачем ты здесь. |
| enter_tower_3_g.flac | на пороге: хранитель башни | Zubenelgenubi | mysterious, calm | Лестница долгая. Наверху — те, кто знает. |
| enter_tower_3_f_g.flac | на пороге: хранитель башни | Autonoe | mysterious, calm | Лестница долгая. Наверху — те, кто знает. |
| enter_tower_4_g.flac | на пороге: хранитель башни | Zubenelgenubi | urgent, warning | Руны на полу не топчи. Они ещё не остыли. |
| enter_tower_4_f_g.flac | на пороге: хранитель башни | Autonoe | urgent, warning | Руны на полу не топчи. Они ещё не остыли. |
| enter_tower_5_g.flac | на пороге: хранитель башни | Zubenelgenubi | solemn, mysterious | Орден помнит всех, кто сюда поднимался. |
| enter_tower_5_f_g.flac | на пороге: хранитель башни | Autonoe | solemn, mysterious | Орден помнит всех, кто сюда поднимался. |
| enter_port_0_g.flac | на пороге: смотритель порта | Rasalgethi | loud, busy, seafaring | Порт! Смотри под ноги, тут канаты. |
| enter_port_0_f_g.flac | на пороге: смотритель порта | Gacrux | loud, busy, seafaring | Порт! Смотри под ноги, тут канаты. |
| enter_port_1_g.flac | на пороге: смотритель порта | Rasalgethi | helpful, brisk | Корабль ищешь? Спроси у причала, кто куда идёт. |
| enter_port_1_f_g.flac | на пороге: смотритель порта | Gacrux | helpful, brisk | Корабль ищешь? Спроси у причала, кто куда идёт. |
| enter_port_2_g.flac | на пороге: смотритель порта | Rasalgethi | grim, weary | Шторм был ночью. Два судна не вернулись. |
| enter_port_2_f_g.flac | на пороге: смотритель порта | Gacrux | grim, weary | Шторм был ночью. Два судна не вернулись. |
| enter_port_3_g.flac | на пороге: смотритель порта | Rasalgethi | firm, official | Пошлину плати у конторы. Без неё — на борт ни ногой. |
| enter_port_3_f_g.flac | на пороге: смотритель порта | Gacrux | firm, official | Пошлину плати у конторы. Без неё — на борт ни ногой. |
| enter_port_4_g.flac | на пороге: смотритель порта | Rasalgethi | wry, jovial | Рыба свежая, моряки пьяные. Добро пожаловать! |
| enter_port_4_f_g.flac | на пороге: смотритель порта | Gacrux | wry, jovial | Рыба свежая, моряки пьяные. Добро пожаловать! |
| enter_port_5_g.flac | на пороге: смотритель порта | Rasalgethi | cheerful, confident | Ветер попутный. Хороший день для отплытия. |
| enter_port_5_f_g.flac | на пороге: смотритель порта | Gacrux | cheerful, confident | Ветер попутный. Хороший день для отплытия. |
| enter_port_6_g.flac | на пороге: смотритель порта | Rasalgethi | businesslike, offering | Грузчики нужны. Не хочешь подзаработать? |
| enter_port_6_f_g.flac | на пороге: смотритель порта | Gacrux | businesslike, offering | Грузчики нужны. Не хочешь подзаработать? |
| enter_port_7_g.flac | на пороге: смотритель порта | Rasalgethi | grim, sailor wisdom | Море всех принимает. Не всех отпускает. |
| enter_port_7_f_g.flac | на пороге: смотритель порта | Gacrux | grim, sailor wisdom | Море всех принимает. Не всех отпускает. |
| enter_smugglers_0_g.flac | на пороге: хозяин схрона | Enceladus | hushed, suspicious | Тихо. Кто тебя сюда навёл? |
| enter_smugglers_0_f_g.flac | на пороге: хозяин схрона | Achernar | hushed, suspicious | Тихо. Кто тебя сюда навёл? |
| enter_smugglers_1_g.flac | на пороге: хозяин схрона | Enceladus | low, conspiratorial | Здесь не спрашивают имён. И ты не спрашивай. |
| enter_smugglers_1_f_g.flac | на пороге: хозяин схрона | Achernar | low, conspiratorial | Здесь не спрашивают имён. И ты не спрашивай. |
| enter_smugglers_2_g.flac | на пороге: хозяин схрона | Enceladus | whisper, sly | Товар через Грань. Цена — не для слабых. |
| enter_smugglers_2_f_g.flac | на пороге: хозяин схрона | Achernar | whisper, sly | Товар через Грань. Цена — не для слабых. |
| enter_smugglers_3_g.flac | на пороге: хозяин схрона | Enceladus | whispered threat | Страже ни слова. Иначе сам понимаешь. |
| enter_smugglers_3_f_g.flac | на пороге: хозяин схрона | Achernar | whispered threat | Страже ни слова. Иначе сам понимаешь. |
| enter_smugglers_4_g.flac | на пороге: хозяин схрона | Enceladus | wry, hushed | Раз дошёл — значит свой. Или глупый. |
| enter_smugglers_4_f_g.flac | на пороге: хозяин схрона | Achernar | wry, hushed | Раз дошёл — значит свой. Или глупый. |
| enter_smugglers_5_g.flac | на пороге: хозяин схрона | Enceladus | tense, hurried whisper | Быстро говори, чего надо. Тут долго не стоят. |
| enter_smugglers_5_f_g.flac | на пороге: хозяин схрона | Achernar | tense, hurried whisper | Быстро говори, чего надо. Тут долго не стоят. |
| foe_bandit_start_0_g.flac | в бою: разбойник, начало боя | Fenrir | menacing, sneering | Кошелёк или жизнь! Выбирай быстро. |
| foe_bandit_start_0_v1_g.flac | в бою: разбойник, начало боя | Enceladus | menacing, sneering | Кошелёк или жизнь! Выбирай быстро. |
| foe_bandit_start_1_g.flac | в бою: разбойник, начало боя | Fenrir | mocking, cold | Ну всё, путник, приехали. |
| foe_bandit_start_1_v1_g.flac | в бою: разбойник, начало боя | Enceladus | mocking, cold | Ну всё, путник, приехали. |
| foe_bandit_start_2_g.flac | в бою: разбойник, начало боя | Fenrir | shouting to accomplices | Окружай его! Не дай уйти! |
| foe_bandit_start_2_v1_g.flac | в бою: разбойник, начало боя | Enceladus | shouting to accomplices | Окружай его! Не дай уйти! |
| foe_bandit_start_3_g.flac | в бою: разбойник, начало боя | Fenrir | low, threatening | Зря ты свернул на эту дорогу. |
| foe_bandit_start_3_v1_g.flac | в бою: разбойник, начало боя | Enceladus | low, threatening | Зря ты свернул на эту дорогу. |
| foe_bandit_start_4_g.flac | в бою: разбойник, начало боя | Fenrir | greedy, commanding | Снимай всё, что блестит. И без глупостей. |
| foe_bandit_start_4_v1_g.flac | в бою: разбойник, начало боя | Enceladus | greedy, commanding | Снимай всё, что блестит. И без глупостей. |
| foe_bandit_start_5_g.flac | в бою: разбойник, начало боя | Fenrir | gleeful, loud | Гляди-ка, сам пришёл. Бери его! |
| foe_bandit_start_5_v1_g.flac | в бою: разбойник, начало боя | Enceladus | gleeful, loud | Гляди-ка, сам пришёл. Бери его! |
| foe_bandit_start_6_g.flac | в бою: разбойник, начало боя | Fenrir | cruel, grinning | Дорога платная. Плати кровью. |
| foe_bandit_start_6_v1_g.flac | в бою: разбойник, начало боя | Enceladus | cruel, grinning | Дорога платная. Плати кровью. |
| foe_bandit_start_7_g.flac | в бою: разбойник, начало боя | Fenrir | whisper then shout | Тихо, тихо… А теперь — ножом! |
| foe_bandit_start_7_v1_g.flac | в бою: разбойник, начало боя | Enceladus | whisper then shout | Тихо, тихо… А теперь — ножом! |
| foe_bandit_attack_0_g.flac | в бою: разбойник, удар | Fenrir | aggressive shout, effort | Получай! |
| foe_bandit_attack_0_v1_g.flac | в бою: разбойник, удар | Enceladus | aggressive shout, effort | Получай! |
| foe_bandit_attack_1_g.flac | в бою: разбойник, удар | Fenrir | grunting, striking | На, держи! |
| foe_bandit_attack_1_v1_g.flac | в бою: разбойник, удар | Enceladus | grunting, striking | На, держи! |
| foe_bandit_attack_2_g.flac | в бою: разбойник, удар | Fenrir | angry, strained | Стой смирно, хуже будет! |
| foe_bandit_attack_2_v1_g.flac | в бою: разбойник, удар | Enceladus | angry, strained | Стой смирно, хуже будет! |
| foe_bandit_attack_3_g.flac | в бою: разбойник, удар | Fenrir | vicious, striking | Это тебе за дорогу! |
| foe_bandit_attack_3_v1_g.flac | в бою: разбойник, удар | Enceladus | vicious, striking | Это тебе за дорогу! |
| foe_bandit_attack_4_g.flac | в бою: разбойник, удар | Fenrir | furious | Не вертись, зарежу! |
| foe_bandit_attack_4_v1_g.flac | в бою: разбойник, удар | Enceladus | furious | Не вертись, зарежу! |
| foe_bandit_attack_5_g.flac | в бою: разбойник, удар | Fenrir | savage, excited | Вот так! И ещё! |
| foe_bandit_attack_5_v1_g.flac | в бою: разбойник, удар | Enceladus | savage, excited | Вот так! И ещё! |
| foe_bandit_attack_6_g.flac | в бою: разбойник, удар | Fenrir | chasing, shouting | Куда пятишься? Стоять! |
| foe_bandit_attack_6_v1_g.flac | в бою: разбойник, удар | Enceladus | chasing, shouting | Куда пятишься? Стоять! |
| foe_bandit_attack_7_g.flac | в бою: разбойник, удар | Fenrir | frenzied shout | Бей его, бей! |
| foe_bandit_attack_7_v1_g.flac | в бою: разбойник, удар | Enceladus | frenzied shout | Бей его, бей! |
| foe_bandit_hurt_0_g.flac | в бою: разбойник, ранен | Fenrir | pain, rage | Ах ты гад! Кровь пустил! |
| foe_bandit_hurt_0_v1_g.flac | в бою: разбойник, ранен | Enceladus | pain, rage | Ах ты гад! Кровь пустил! |
| foe_bandit_hurt_1_g.flac | в бою: разбойник, ранен | Fenrir | hissing in pain | Больно, зараза! |
| foe_bandit_hurt_1_v1_g.flac | в бою: разбойник, ранен | Enceladus | hissing in pain | Больно, зараза! |
| foe_bandit_hurt_2_g.flac | в бою: разбойник, ранен | Fenrir | surprised, hurt | Он кусается, ребята! |
| foe_bandit_hurt_2_v1_g.flac | в бою: разбойник, ранен | Enceladus | surprised, hurt | Он кусается, ребята! |
| foe_bandit_hurt_3_g.flac | в бою: разбойник, ранен | Fenrir | through gritted teeth | Ничего, заживёт. А тебя — нет! |
| foe_bandit_hurt_3_v1_g.flac | в бою: разбойник, ранен | Enceladus | through gritted teeth | Ничего, заживёт. А тебя — нет! |
| foe_bandit_hurt_4_g.flac | в бою: разбойник, ранен | Fenrir | panting, angry | Проклятье, крепкий попался! |
| foe_bandit_hurt_4_v1_g.flac | в бою: разбойник, ранен | Enceladus | panting, angry | Проклятье, крепкий попался! |
| foe_bandit_low_0_g.flac | в бою: разбойник, на исходе | Fenrir | panicked, begging | Стой! Хватит! Забирай всё! |
| foe_bandit_low_0_v1_g.flac | в бою: разбойник, на исходе | Enceladus | panicked, begging | Стой! Хватит! Забирай всё! |
| foe_bandit_low_1_g.flac | в бою: разбойник, на исходе | Fenrir | terrified, pleading | Пощади, у меня дети! |
| foe_bandit_low_1_v1_g.flac | в бою: разбойник, на исходе | Enceladus | terrified, pleading | Пощади, у меня дети! |
| foe_bandit_low_2_g.flac | в бою: разбойник, на исходе | Fenrir | frightened, backing off | Всё, всё, ухожу! Не бей! |
| foe_bandit_low_2_v1_g.flac | в бою: разбойник, на исходе | Enceladus | frightened, backing off | Всё, всё, ухожу! Не бей! |
| foe_bandit_low_3_g.flac | в бою: разбойник, на исходе | Fenrir | panicked shout | Братцы, бежим, он нас всех положит! |
| foe_bandit_low_3_v1_g.flac | в бою: разбойник, на исходе | Enceladus | panicked shout | Братцы, бежим, он нас всех положит! |
| foe_bandit_low_4_g.flac | в бою: разбойник, на исходе | Fenrir | desperate, breathless | Не убивай, я всё скажу! |
| foe_bandit_low_4_v1_g.flac | в бою: разбойник, на исходе | Enceladus | desperate, breathless | Не убивай, я всё скажу! |
| foe_bandit_taunt_0_g.flac | в бою: разбойник, герой слабеет | Fenrir | cruel, gloating | Шатаешься? Сейчас упадёшь. |
| foe_bandit_taunt_0_v1_g.flac | в бою: разбойник, герой слабеет | Enceladus | cruel, gloating | Шатаешься? Сейчас упадёшь. |
| foe_bandit_taunt_1_g.flac | в бою: разбойник, герой слабеет | Fenrir | greedy, gloating | Ещё удар — и всё твоё станет моим. |
| foe_bandit_taunt_1_v1_g.flac | в бою: разбойник, герой слабеет | Enceladus | greedy, gloating | Ещё удар — и всё твоё станет моим. |
| foe_bandit_taunt_2_g.flac | в бою: разбойник, герой слабеет | Fenrir | mocking laugh | Кровью харкаешь, герой? |
| foe_bandit_taunt_2_v1_g.flac | в бою: разбойник, герой слабеет | Enceladus | mocking laugh | Кровью харкаешь, герой? |
| foe_bandit_death_0_g.flac | в бою: разбойник, гибель | Fenrir | dying, weak, bitter | Будь ты проклят… |
| foe_bandit_death_0_v1_g.flac | в бою: разбойник, гибель | Enceladus | dying, weak, bitter | Будь ты проклят… |
| foe_bandit_death_1_g.flac | в бою: разбойник, гибель | Fenrir | dying whisper, regret | Надо было… в деревне сидеть… |
| foe_bandit_death_1_v1_g.flac | в бою: разбойник, гибель | Enceladus | dying whisper, regret | Надо было… в деревне сидеть… |
| foe_bandit_death_2_g.flac | в бою: разбойник, гибель | Fenrir | dying, faint whisper | Мать… прости… |
| foe_bandit_death_2_v1_g.flac | в бою: разбойник, гибель | Enceladus | dying, faint whisper | Мать… прости… |
| foe_pirate_start_0_g.flac | в бою: корсар, начало боя | Algenib | roaring command | Абордаж! Все на палубу! |
| foe_pirate_start_0_v1_g.flac | в бою: корсар, начало боя | Zephyr | roaring command | Абордаж! Все на палубу! |
| foe_pirate_start_1_g.flac | в бою: корсар, начало боя | Algenib | gleeful, loud | Свистать всех наверх! Добыча сама плывёт! |
| foe_pirate_start_1_v1_g.flac | в бою: корсар, начало боя | Zephyr | gleeful, loud | Свистать всех наверх! Добыча сама плывёт! |
| foe_pirate_start_2_g.flac | в бою: корсар, начало боя | Algenib | mocking, commanding | Спускай паруса, сухопутная крыса! |
| foe_pirate_start_2_v1_g.flac | в бою: корсар, начало боя | Zephyr | mocking, commanding | Спускай паруса, сухопутная крыса! |
| foe_pirate_start_3_g.flac | в бою: корсар, начало боя | Algenib | boisterous, threatening | Этот груз теперь наш! Кто против — за борт! |
| foe_pirate_start_3_v1_g.flac | в бою: корсар, начало боя | Zephyr | boisterous, threatening | Этот груз теперь наш! Кто против — за борт! |
| foe_pirate_start_4_g.flac | в бою: корсар, начало боя | Algenib | savage joy | Море нынче щедрое. Руби их! |
| foe_pirate_start_4_v1_g.flac | в бою: корсар, начало боя | Zephyr | savage joy | Море нынче щедрое. Руби их! |
| foe_pirate_start_5_g.flac | в бою: корсар, начало боя | Algenib | fierce, proud | Красные паруса пощады не знают! |
| foe_pirate_start_5_v1_g.flac | в бою: корсар, начало боя | Zephyr | fierce, proud | Красные паруса пощады не знают! |
| foe_pirate_attack_0_g.flac | в бою: корсар, удар | Algenib | fierce, striking | Отведай стали! |
| foe_pirate_attack_0_v1_g.flac | в бою: корсар, удар | Zephyr | fierce, striking | Отведай стали! |
| foe_pirate_attack_1_g.flac | в бою: корсар, удар | Algenib | shouting | За борт его! |
| foe_pirate_attack_1_v1_g.flac | в бою: корсар, удар | Zephyr | shouting | За борт его! |
| foe_pirate_attack_2_g.flac | в бою: корсар, удар | Algenib | frenzied | Руби канаты, руби его! |
| foe_pirate_attack_2_v1_g.flac | в бою: корсар, удар | Zephyr | frenzied | Руби канаты, руби его! |
| foe_pirate_attack_3_g.flac | в бою: корсар, удар | Algenib | mocking, striking | Вот тебе морской привет! |
| foe_pirate_attack_3_v1_g.flac | в бою: корсар, удар | Zephyr | mocking, striking | Вот тебе морской привет! |
| foe_pirate_attack_4_g.flac | в бою: корсар, удар | Algenib | angry, effort | Держи, крыса палубная! |
| foe_pirate_attack_4_v1_g.flac | в бою: корсар, удар | Zephyr | angry, effort | Держи, крыса палубная! |
| foe_pirate_attack_5_g.flac | в бою: корсар, удар | Algenib | taunting | Не качайся, всё равно достану! |
| foe_pirate_attack_5_v1_g.flac | в бою: корсар, удар | Zephyr | taunting | Не качайся, всё равно достану! |
| foe_pirate_hurt_0_g.flac | в бою: корсар, ранен | Algenib | pain, cursing | Акулья требуха! Задел! |
| foe_pirate_hurt_0_v1_g.flac | в бою: корсар, ранен | Zephyr | pain, cursing | Акулья требуха! Задел! |
| foe_pirate_hurt_1_g.flac | в бою: корсар, ранен | Algenib | angry, hurt | Кровь на палубе — моя! Ну держись! |
| foe_pirate_hurt_1_v1_g.flac | в бою: корсар, ранен | Zephyr | angry, hurt | Кровь на палубе — моя! Ну держись! |
| foe_pirate_hurt_2_g.flac | в бою: корсар, ранен | Algenib | cursing in pain | Тысяча чертей, больно! |
| foe_pirate_hurt_2_v1_g.flac | в бою: корсар, ранен | Zephyr | cursing in pain | Тысяча чертей, больно! |
| foe_pirate_hurt_3_g.flac | в бою: корсар, ранен | Algenib | gritted teeth, defiant | Режешь метко, да меня так не возьмёшь! |
| foe_pirate_hurt_3_v1_g.flac | в бою: корсар, ранен | Zephyr | gritted teeth, defiant | Режешь метко, да меня так не возьмёшь! |
| foe_pirate_low_0_g.flac | в бою: корсар, на исходе | Algenib | panicked | Сдаюсь! Шлюпку мне, шлюпку! |
| foe_pirate_low_0_v1_g.flac | в бою: корсар, на исходе | Zephyr | panicked | Сдаюсь! Шлюпку мне, шлюпку! |
| foe_pirate_low_1_g.flac | в бою: корсар, на исходе | Algenib | begging | Бери добычу, только отпусти! |
| foe_pirate_low_1_v1_g.flac | в бою: корсар, на исходе | Zephyr | begging | Бери добычу, только отпусти! |
| foe_pirate_low_2_g.flac | в бою: корсар, на исходе | Algenib | panicked shout | Все в шлюпки! Бросай корабль! |
| foe_pirate_low_2_v1_g.flac | в бою: корсар, на исходе | Zephyr | panicked shout | Все в шлюпки! Бросай корабль! |
| foe_pirate_low_3_g.flac | в бою: корсар, на исходе | Algenib | terrified | Не топи меня, я плавать не умею! |
| foe_pirate_low_3_v1_g.flac | в бою: корсар, на исходе | Zephyr | terrified | Не топи меня, я плавать не умею! |
| foe_pirate_taunt_0_g.flac | в бою: корсар, герой слабеет | Algenib | mocking laugh | Шатает тебя, как в шторм! |
| foe_pirate_taunt_0_v1_g.flac | в бою: корсар, герой слабеет | Zephyr | mocking laugh | Шатает тебя, как в шторм! |
| foe_pirate_taunt_1_g.flac | в бою: корсар, герой слабеет | Algenib | gloating | Скоро пойдёшь кормить рыб! |
| foe_pirate_taunt_1_v1_g.flac | в бою: корсар, герой слабеет | Zephyr | gloating | Скоро пойдёшь кормить рыб! |
| foe_pirate_taunt_2_g.flac | в бою: корсар, герой слабеет | Algenib | cruel, gloating | Держишься за борт? Недолго осталось! |
| foe_pirate_taunt_2_v1_g.flac | в бою: корсар, герой слабеет | Zephyr | cruel, gloating | Держишься за борт? Недолго осталось! |
| foe_pirate_death_0_g.flac | в бою: корсар, гибель | Algenib | dying whisper | Море… забирает… |
| foe_pirate_death_0_v1_g.flac | в бою: корсар, гибель | Zephyr | dying whisper | Море… забирает… |
| foe_pirate_death_1_g.flac | в бою: корсар, гибель | Algenib | dying, resigned | К рыбам… так к рыбам… |
| foe_pirate_death_1_v1_g.flac | в бою: корсар, гибель | Zephyr | dying, resigned | К рыбам… так к рыбам… |
| foe_pirate_death_2_g.flac | в бою: корсар, гибель | Algenib | dying, faint | Паруса… опустите… |
| foe_pirate_death_2_v1_g.flac | в бою: корсар, гибель | Zephyr | dying, faint | Паруса… опустите… |
| foe_goblin_start_0_g.flac | в бою: гоблин, начало боя | Puck | giggling, greedy, high | Хи-хи! Мясо пришло! |
| foe_goblin_start_1_g.flac | в бою: гоблин, начало боя | Puck | excited, greedy | Блестяшки! У него блестяшки! |
| foe_goblin_start_2_g.flac | в бою: гоблин, начало боя | Puck | shrill, angry | Наш лес! Наша тропа! Твоя смерть! |
| foe_goblin_start_3_g.flac | в бою: гоблин, начало боя | Puck | frantic, gleeful | Режь его, режь, пока толстый! |
| foe_goblin_start_4_g.flac | в бою: гоблин, начало боя | Puck | shrieking call | Все сюда! Тут большой, глупый! |
| foe_goblin_start_5_g.flac | в бою: гоблин, начало боя | Puck | shrill chant | Гоблины не прощают! Гоблины не забывают! |
| foe_goblin_attack_0_g.flac | в бою: гоблин, удар | Puck | gleeful, stabbing | Тык! Тык-тык! |
| foe_goblin_attack_1_g.flac | в бою: гоблин, удар | Puck | cackling | Получи ножиком! |
| foe_goblin_attack_2_g.flac | в бою: гоблин, удар | Puck | mocking, fast | Ай, какой медленный! |
| foe_goblin_attack_3_g.flac | в бою: гоблин, удар | Puck | sneaky giggle | Сзади! Я сзади! |
| foe_goblin_attack_4_g.flac | в бою: гоблин, удар | Puck | feral, excited | Кусь его! |
| foe_goblin_attack_5_g.flac | в бою: гоблин, удар | Puck | frenzied, shrill | Ещё! Ещё! |
| foe_goblin_hurt_0_g.flac | в бою: гоблин, ранен | Puck | squealing | Ай-ай-ай! Больно! |
| foe_goblin_hurt_1_g.flac | в бою: гоблин, ранен | Puck | whining, angry | Нечестно! Нечестно! |
| foe_goblin_hurt_2_g.flac | в бою: гоблин, ранен | Puck | scared, whining | Он злой! Он очень злой! |
| foe_goblin_hurt_3_g.flac | в бою: гоблин, ранен | Puck | shrill pain | Моё ухо! Ухо порезал! |
| foe_goblin_low_0_g.flac | в бою: гоблин, на исходе | Puck | whimpering | Не надо! Отдаю! Всё отдаю! |
| foe_goblin_low_1_g.flac | в бою: гоблин, на исходе | Puck | panicked squeal | Бежим! Бежим в нору! |
| foe_goblin_low_2_g.flac | в бою: гоблин, на исходе | Puck | pathetic, hiding | Я маленький! Меня не видно! |
| foe_goblin_low_3_g.flac | в бою: гоблин, на исходе | Puck | wheedling, desperate | Пощади! Я покажу, где клад! |
| foe_goblin_taunt_0_g.flac | в бою: гоблин, герой слабеет | Puck | cackling | Хи-хи! Устал, большой? |
| foe_goblin_taunt_1_g.flac | в бою: гоблин, герой слабеет | Puck | chanting, gleeful | Падай, падай, падай! |
| foe_goblin_taunt_2_g.flac | в бою: гоблин, герой слабеет | Puck | greedy giggle | Скоро будешь наш ужин! |
| foe_goblin_death_0_g.flac | в бою: гоблин, гибель | Puck | squeaky, fading | Ой… темно… |
| foe_goblin_death_1_g.flac | в бою: гоблин, гибель | Puck | whimpering, dying | Мама… гоблин… |
| foe_goblin_death_2_g.flac | в бою: гоблин, гибель | Puck | dying whine | Не… честно… |
| foe_giant_start_0_g.flac | в бою: исполин, начало боя | Alnilam | booming, menacing | Кто топчет мою землю? |
| foe_giant_start_1_g.flac | в бою: исполин, начало боя | Alnilam | hungry, deep | Маленький. Хрустящий. |
| foe_giant_start_3_g.flac | в бою: исполин, начало боя | Alnilam | deep, contemptuous | Раздавлю, как жука. |
| foe_giant_start_4_g.flac | в бою: исполин, начало боя | Alnilam | sinister | Давно никто не приходил. Иди сюда. |
| foe_giant_start_5_g.flac | в бою: исполин, начало боя | Alnilam | ancient, menacing | Мои кости помнят горы. Твои — сломаются. |
| foe_giant_attack_0_g.flac | в бою: исполин, удар | Alnilam | roaring | Раздавлю! |
| foe_giant_attack_1_g.flac | в бою: исполин, удар | Alnilam | bellowing | Получай, мелюзга! |
| foe_giant_attack_2_g.flac | в бою: исполин, удар | Alnilam | grunting, heavy | Хрусь! |
| foe_giant_attack_3_g.flac | в бою: исполин, удар | Alnilam | roaring command | Лежать! |
| foe_giant_attack_4_g.flac | в бою: исполин, удар | Alnilam | bellowing | Прочь с дороги! |
| foe_giant_attack_5_g.flac | в бою: исполин, удар | Alnilam | furious roar | Размажу по камням! |
| foe_giant_hurt_0_g.flac | в бою: исполин, ранен | Alnilam | angry, surprised, deep | Жжётся! Маленький жжётся! |
| foe_giant_hurt_1_g.flac | в бою: исполин, ранен | Alnilam | deep fury | Ты делаешь больно. Я сделаю больнее. |
| foe_giant_hurt_2_g.flac | в бою: исполин, ранен | Alnilam | growling, deep | Злишь меня! |
| foe_giant_hurt_3_g.flac | в бою: исполин, ранен | Alnilam | dazed, deep | Кровь… моя кровь… |
| foe_giant_low_0_g.flac | в бою: исполин, на исходе | Alnilam | heavy breathing, deep | Не уйдёшь… не уйдёшь живым… |
| foe_giant_low_1_g.flac | в бою: исполин, на исходе | Alnilam | straining, deep | Я… ещё… стою! |
| foe_giant_low_2_g.flac | в бою: исполин, на исходе | Alnilam | desperate, deep | Горы… дайте силы… |
| foe_giant_low_3_g.flac | в бою: исполин, на исходе | Alnilam | grudging, deep | Ты сильный. Для маленького. |
| foe_giant_taunt_0_g.flac | в бою: исполин, герой слабеет | Alnilam | deep, cruel | Ломаешься. Все ломаются. |
| foe_giant_taunt_1_g.flac | в бою: исполин, герой слабеет | Alnilam | deep, mocking | Устал, маленький? Ложись. |
| foe_giant_taunt_2_g.flac | в бою: исполин, герой слабеет | Alnilam | sinister, deep | Я слышу, как бьётся твоё сердце. Всё тише. |
| foe_giant_death_0_g.flac | в бою: исполин, гибель | Alnilam | dying, deep | Горы… зовут… |
| foe_giant_death_1_g.flac | в бою: исполин, гибель | Alnilam | dying | Я… ухожу… в камень… |
| foe_giant_death_2_g.flac | в бою: исполин, гибель | Alnilam | dying, deep whisper | Земля… прими… |
| foe_dragon_start_0_g.flac | в бою: дракон, начало боя | Charon | ancient, regal, contemptuous | Ты пришёл к моему золоту. Смело. Глупо. |
| foe_dragon_start_1_g.flac | в бою: дракон, начало боя | Charon | ancient, ominous | Я видел, как рождались твои царства. Увижу и твой конец. |
| foe_dragon_start_2_g.flac | в бою: дракон, начало боя | Charon | amused, cruel, deep | Ещё один рыцарь. Их кости согревают моё логово. |
| foe_dragon_start_3_g.flac | в бою: дракон, начало боя | Charon | regal, commanding | Склонись, смертный, и умри на коленях. |
| foe_dragon_start_4_g.flac | в бою: дракон, начало боя | Charon | proud, ominous | Мой огонь старше твоих богов. |
| foe_dragon_start_5_g.flac | в бою: дракон, начало боя | Charon | predatory, sinister | Ты пахнешь страхом. Мне нравится этот запах. |
| foe_dragon_attack_0_g.flac | в бою: дракон, удар | Charon | roaring | Гори! |
| foe_dragon_attack_1_g.flac | в бою: дракон, удар | Charon | booming, furious | Пламя очистит тебя! |
| foe_dragon_attack_2_g.flac | в бою: дракон, удар | Charon | fierce, booming | Пепел к пеплу! |
| foe_dragon_attack_3_g.flac | в бою: дракон, удар | Charon | snarling | Ощути мои когти! |
| foe_dragon_attack_4_g.flac | в бою: дракон, удар | Charon | mocking roar | Беги, если сможешь! |
| foe_dragon_attack_5_g.flac | в бою: дракон, удар | Charon | furious roar | Сгори дотла! |
| foe_dragon_hurt_0_g.flac | в бою: дракон, ранен | Charon | outraged, booming | Ты посмел ранить меня? |
| foe_dragon_hurt_1_g.flac | в бою: дракон, ранен | Charon | cold fury | Кровь дракона дорого стоит, смертный. |
| foe_dragon_hurt_2_g.flac | в бою: дракон, ранен | Charon | icy, menacing | Эта рана будет стоить тебе жизни. |
| foe_dragon_hurt_3_g.flac | в бою: дракон, ранен | Charon | surprised, cold, amused | Любопытно. Ты не так слаб, как кажешься. |
| foe_dragon_low_0_g.flac | в бою: дракон, на исходе | Charon | disbelief, straining | Нет… я древнее этих гор… |
| foe_dragon_low_1_g.flac | в бою: дракон, на исходе | Charon | desperate, snarling | Моё золото… не получишь… |
| foe_dragon_low_2_g.flac | в бою: дракон, на исходе | Charon | wounded, vengeful | Я уйду в небо… и вернусь… |
| foe_dragon_low_3_g.flac | в бою: дракон, на исходе | Charon | furious curse | Проклинаю твой род до седьмого колена! |
| foe_dragon_taunt_0_g.flac | в бою: дракон, герой слабеет | Charon | cruel amusement | Ты уже дымишься, смертный. |
| foe_dragon_taunt_1_g.flac | в бою: дракон, герой слабеет | Charon | predatory, mocking | Твоё сердце бьётся, как у зайца. |
| foe_dragon_taunt_2_g.flac | в бою: дракон, герой слабеет | Charon | cold, menacing | Ещё один вздох — и он будет последним. |
| foe_dragon_death_0_g.flac | в бою: дракон, гибель | Charon | dying, vast | Небо… погасло… |
| foe_dragon_death_1_g.flac | в бою: дракон, гибель | Charon | dying, fading | Моё пламя… гаснет… |
| foe_dragon_death_2_g.flac | в бою: дракон, гибель | Charon | dying whisper, greedy | Золото… моё… |
| foe_lich_start_0_g.flac | в бою: владыка нежити, начало боя | Schedar | cold, hollow whisper, longing | Живое тепло… как давно я его не чувствовал. |
| foe_lich_start_1_g.flac | в бою: владыка нежити, начало боя | Schedar | cold, dry, ominous | Твоё имя уже записано. Осталось поставить дату. |
| foe_lich_start_2_g.flac | в бою: владыка нежити, начало боя | Schedar | commanding, hollow | Встаньте, мёртвые. У нас гость. |
| foe_lich_start_3_g.flac | в бою: владыка нежити, начало боя | Schedar | calm, chilling | Смерть — лишь дверь. Я провожу тебя. |
| foe_lich_start_4_g.flac | в бою: владыка нежити, начало боя | Schedar | greedy, hollow | Ещё одна душа в мою корону. |
| foe_lich_start_5_g.flac | в бою: владыка нежити, начало боя | Schedar | cold, amused whisper | Ты дышишь. Это ненадолго. |
| foe_lich_attack_1_g.flac | в бою: владыка нежити, удар | Schedar | hollow, commanding | Холод могилы! |
| foe_lich_attack_2_g.flac | в бою: владыка нежити, удар | Schedar | cruel, hollow | Твои кости — мои! |
| foe_lich_attack_4_g.flac | в бою: владыка нежити, удар | Schedar | chanting, cold | Прах к праху! |
| foe_lich_attack_5_g.flac | в бою: владыка нежити, удар | Schedar | hissing curse | Истлей! |
| foe_lich_hurt_0_g.flac | в бою: владыка нежити, ранен | Schedar | surprised, hollow | Боль… я забыл, что такое боль. |
| foe_lich_hurt_1_g.flac | в бою: владыка нежити, ранен | Schedar | cold, mocking | Ты режешь мёртвую плоть. Она не кровоточит. |
| foe_lich_hurt_2_g.flac | в бою: владыка нежити, ранен | Schedar | dry, hollow laugh | Смешно. Меня уже убивали. |
| foe_lich_hurt_3_g.flac | в бою: владыка нежити, ранен | Schedar | cold, calm | Ты лишь отсрочил неизбежное. |
| foe_lich_low_0_g.flac | в бою: владыка нежити, на исходе | Schedar | fading, vengeful whisper | Я вернусь… я всегда возвращаюсь… |
| foe_lich_low_1_g.flac | в бою: владыка нежити, на исходе | Schedar | desperate hiss | Корона… не отдам… |
| foe_lich_low_2_g.flac | в бою: владыка нежити, на исходе | Schedar | fading whisper | Тьма, прими меня обратно… |
| foe_lich_low_3_g.flac | в бою: владыка нежити, на исходе | Schedar | furious, hollow | Меня нельзя убить дважды! |
| foe_lich_taunt_0_g.flac | в бою: владыка нежити, герой слабеет | Schedar | hungry whisper | Твоя жизнь уходит. Я чувствую её вкус. |
| foe_lich_taunt_1_g.flac | в бою: владыка нежити, герой слабеет | Schedar | cold, promising | Скоро ты встанешь рядом со мной. |
| foe_lich_taunt_2_g.flac | в бою: владыка нежити, герой слабеет | Schedar | chilling whisper | Твоё сердце замедляется. Слушай. |
| foe_lich_death_0_g.flac | в бою: владыка нежити, гибель | Schedar | relieved, fading whisper | Наконец… тишина… |
| foe_lich_death_1_g.flac | в бою: владыка нежити, гибель | Schedar | crumbling, fading | Кости… в пыль… |
| foe_lich_death_2_g.flac | в бою: владыка нежити, гибель | Schedar | fading, awed whisper | Мортана… встречает… |
| foe_fiend_start_0_g.flac | в бою: бес из-за Грани, начало боя | Orus | silky, menacing | Сделка? Нет. Сегодня только плата. |
| foe_fiend_start_1_g.flac | в бою: бес из-за Грани, начало боя | Orus | delighted, sinister | Я слышу, как кричит твоя душа. |
| foe_fiend_start_2_g.flac | в бою: бес из-за Грани, начало боя | Orus | ominous, deep | Из-за Грани пришли мы. За тобой. |
| foe_fiend_start_3_g.flac | в бою: бес из-за Грани, начало боя | Orus | hungry, purring, sinister | Твои страхи пахнут сладко. |
| foe_fiend_start_4_g.flac | в бою: бес из-за Грани, начало боя | Orus | mocking, grand | Добро пожаловать в пекло, смертный. |
| foe_fiend_start_5_g.flac | в бою: бес из-за Грани, начало боя | Orus | whispering, menacing | Я знаю твоё имя. И имена всех, кого ты любишь. |
| foe_fiend_attack_0_g.flac | в бою: бес из-за Грани, удар | Orus | roaring | Пылай! |
| foe_fiend_attack_1_g.flac | в бою: бес из-за Грани, удар | Orus | snarling | Разорву! |
| foe_fiend_attack_2_g.flac | в бою: бес из-за Грани, удар | Orus | sadistic laugh | Кричи громче! |
| foe_fiend_attack_3_g.flac | в бою: бес из-за Грани, удар | Orus | gleeful, cruel | Боль — это только начало! |
| foe_fiend_attack_4_g.flac | в бою: бес из-за Грани, удар | Orus | hissing, furious | Твоя кровь закипит! |
| foe_fiend_attack_5_g.flac | в бою: бес из-за Грани, удар | Orus | whispering, maddening | Я внутри тебя! |
| foe_fiend_hurt_0_g.flac | в бою: бес из-за Грани, ранен | Orus | amused, cold | Ты ранишь меня сталью? Забавно. |
| foe_fiend_hurt_1_g.flac | в бою: бес из-за Грани, ранен | Orus | vengeful, low | За каждую рану заплатишь втрое. |
| foe_fiend_hurt_2_g.flac | в бою: бес из-за Грани, ранен | Orus | maniacal, ecstatic | Больно… Ещё! Сделай ещё больнее! |
| foe_fiend_hurt_3_g.flac | в бою: бес из-за Грани, ранен | Orus | roaring | Ярость моя растёт! |
| foe_fiend_low_0_g.flac | в бою: бес из-за Грани, на исходе | Orus | screaming, desperate | Нет! Грань… зовёт назад… |
| foe_fiend_low_1_g.flac | в бою: бес из-за Грани, на исходе | Orus | vengeful shriek | Я вернусь в твоих снах! |
| foe_fiend_low_2_g.flac | в бою: бес из-за Грани, на исходе | Orus | furious curse | Ты проклят! Проклят навеки! |
| foe_fiend_low_3_g.flac | в бою: бес из-за Грани, на исходе | Orus | desperate, pleading | Хозяин… помоги! |
| foe_fiend_taunt_0_g.flac | в бою: бес из-за Грани, герой слабеет | Orus | purring, sinister | Твоя душа почти моя. |
| foe_fiend_taunt_1_g.flac | в бою: бес из-за Грани, герой слабеет | Orus | mocking, silky | Падай. Я подхвачу. |
| foe_fiend_taunt_2_g.flac | в бою: бес из-за Грани, герой слабеет | Orus | delighted whisper | Я чувствую твой страх. Он растёт. |
| foe_fiend_death_0_g.flac | в бою: бес из-за Грани, гибель | Orus | dying hiss | Обратно… в пламя… |
| foe_fiend_death_1_g.flac | в бою: бес из-за Грани, гибель | Orus | fading, menacing | Это… не конец… |
| foe_fiend_death_2_g.flac | в бою: бес из-за Грани, гибель | Orus | fading, wailing | Грань… закрывается… |
| foe_spirit_start_0_g.flac | в бою: дух, начало боя | Enceladus | ghostly whisper, mournful | Зачем ты пришёл туда, где нет живых? |
| foe_spirit_start_0_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | ghostly whisper, mournful | Зачем ты пришёл туда, где нет живых? |
| foe_spirit_start_1_g.flac | в бою: дух, начало боя | Enceladus | eerie, pleading whisper | Останься с нами… навсегда… |
| foe_spirit_start_1_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | eerie, pleading whisper | Останься с нами… навсегда… |
| foe_spirit_start_2_g.flac | в бою: дух, начало боя | Enceladus | ghostly, shivering whisper | Холодно… мне так холодно… согрей меня… |
| foe_spirit_start_2_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | ghostly, shivering whisper | Холодно… мне так холодно… согрей меня… |
| foe_spirit_start_3_g.flac | в бою: дух, начало боя | Enceladus | hollow warning whisper | Уходи… или стань одним из нас… |
| foe_spirit_start_3_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | hollow warning whisper | Уходи… или стань одним из нас… |
| foe_spirit_start_4_g.flac | в бою: дух, начало боя | Enceladus | eerie, distant | Мы помним этот день. Ты — нет. |
| foe_spirit_start_4_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | eerie, distant | Мы помним этот день. Ты — нет. |
| foe_spirit_start_5_g.flac | в бою: дух, начало боя | Enceladus | whisper, sinister | Ты слышишь нас? Скоро будешь слышать всегда. |
| foe_spirit_start_5_v1_g.flac | в бою: дух, начало боя | Vindemiatrix | whisper, sinister | Ты слышишь нас? Скоро будешь слышать всегда. |
| foe_spirit_attack_0_g.flac | в бою: дух, удар | Enceladus | icy whisper | Замри… |
| foe_spirit_attack_0_v1_g.flac | в бою: дух, удар | Vindemiatrix | icy whisper | Замри… |
| foe_spirit_attack_1_g.flac | в бою: дух, удар | Enceladus | hungry whisper | Отдай своё тепло… |
| foe_spirit_attack_1_v1_g.flac | в бою: дух, удар | Vindemiatrix | hungry whisper | Отдай своё тепло… |
| foe_spirit_attack_2_g.flac | в бою: дух, удар | Enceladus | chilling whisper | Холод… войди в него… |
| foe_spirit_attack_2_v1_g.flac | в бою: дух, удар | Vindemiatrix | chilling whisper | Холод… войди в него… |
| foe_spirit_attack_3_g.flac | в бою: дух, удар | Enceladus | lulling, sinister whisper | Тише… тише… усни… |
| foe_spirit_attack_3_v1_g.flac | в бою: дух, удар | Vindemiatrix | lulling, sinister whisper | Тише… тише… усни… |
| foe_spirit_attack_4_g.flac | в бою: дух, удар | Enceladus | echoing whisper | Мы рядом… мы внутри… |
| foe_spirit_attack_4_v1_g.flac | в бою: дух, удар | Vindemiatrix | echoing whisper | Мы рядом… мы внутри… |
| foe_spirit_attack_5_g.flac | в бою: дух, удар | Enceladus | hollow whisper | Пустота зовёт… |
| foe_spirit_attack_5_v1_g.flac | в бою: дух, удар | Vindemiatrix | hollow whisper | Пустота зовёт… |
| foe_spirit_hurt_0_g.flac | в бою: дух, ранен | Enceladus | wailing, faint | Больно… даже нам больно… |
| foe_spirit_hurt_0_v1_g.flac | в бою: дух, ранен | Vindemiatrix | wailing, faint | Больно… даже нам больно… |
| foe_spirit_hurt_1_g.flac | в бою: дух, ранен | Enceladus | mournful, hurt | Ты рвёшь то, что осталось… |
| foe_spirit_hurt_1_v1_g.flac | в бою: дух, ранен | Vindemiatrix | mournful, hurt | Ты рвёшь то, что осталось… |
| foe_spirit_hurt_2_g.flac | в бою: дух, ранен | Enceladus | sorrowful whisper | Почему… почему ты это делаешь? |
| foe_spirit_hurt_2_v1_g.flac | в бою: дух, ранен | Vindemiatrix | sorrowful whisper | Почему… почему ты это делаешь? |
| foe_spirit_hurt_3_g.flac | в бою: дух, ранен | Enceladus | hissing, pained whisper | Свет… жжёт… |
| foe_spirit_low_0_g.flac | в бою: дух, на исходе | Enceladus | pleading whisper | Отпусти… отпусти нас… |
| foe_spirit_low_0_v1_g.flac | в бою: дух, на исходе | Vindemiatrix | pleading whisper | Отпусти… отпусти нас… |
| foe_spirit_low_1_g.flac | в бою: дух, на исходе | Enceladus | fading whisper | Мы растворяемся… |
| foe_spirit_low_1_v1_g.flac | в бою: дух, на исходе | Vindemiatrix | fading whisper | Мы растворяемся… |
| foe_spirit_low_2_g.flac | в бою: дух, на исходе | Enceladus | sorrowful plea | Не надо… мы тоже были живыми… |
| foe_spirit_low_2_v1_g.flac | в бою: дух, на исходе | Vindemiatrix | sorrowful plea | Не надо… мы тоже были живыми… |
| foe_spirit_low_3_g.flac | в бою: дух, на исходе | Enceladus | fading, mournful | Помни нас… хоть ты помни… |
| foe_spirit_low_3_v1_g.flac | в бою: дух, на исходе | Vindemiatrix | fading, mournful | Помни нас… хоть ты помни… |
| foe_spirit_taunt_0_g.flac | в бою: дух, герой слабеет | Enceladus | eerie whisper | Твоя тень уже с нами. |
| foe_spirit_taunt_0_v1_g.flac | в бою: дух, герой слабеет | Vindemiatrix | eerie whisper | Твоя тень уже с нами. |
| foe_spirit_taunt_1_g.flac | в бою: дух, герой слабеет | Enceladus | hungry whisper | Ещё немного… и ты останешься здесь. |
| foe_spirit_taunt_1_v1_g.flac | в бою: дух, герой слабеет | Vindemiatrix | hungry whisper | Ещё немного… и ты останешься здесь. |
| foe_spirit_taunt_2_g.flac | в бою: дух, герой слабеет | Enceladus | chilling whisper | Сердце стучит всё тише… слушай… |
| foe_spirit_taunt_2_v1_g.flac | в бою: дух, герой слабеет | Vindemiatrix | chilling whisper | Сердце стучит всё тише… слушай… |
| foe_spirit_death_0_g.flac | в бою: дух, гибель | Enceladus | relieved sigh, fading | Свобода… |
| foe_spirit_death_0_v1_g.flac | в бою: дух, гибель | Vindemiatrix | relieved sigh, fading | Свобода… |
| foe_spirit_death_1_g.flac | в бою: дух, гибель | Enceladus | peaceful, fading whisper | Наконец… покой… |
| foe_spirit_death_1_v1_g.flac | в бою: дух, гибель | Vindemiatrix | peaceful, fading whisper | Наконец… покой… |
| foe_spirit_death_2_g.flac | в бою: дух, гибель | Enceladus | fading echo | Мы… уходим… |
| foe_spirit_death_2_v1_g.flac | в бою: дух, гибель | Vindemiatrix | fading echo | Мы… уходим… |
| foe_siren_start_0_g.flac | в бою: сирена, начало боя | Autonoe | alluring, sweet, eerie | Иди ко мне… вода тёплая… |
| foe_siren_start_1_g.flac | в бою: сирена, начало боя | Autonoe | seductive, sing-song | Ты слышишь мою песню? Иди на голос… |
| foe_siren_start_2_g.flac | в бою: сирена, начало боя | Autonoe | sweet, sinister | Столько моряков… и ни один не вернулся. |
| foe_siren_start_3_g.flac | в бою: сирена, начало боя | Autonoe | eerie, longing, tender | Жених мой… наконец-то ты пришёл. |
| foe_siren_start_4_g.flac | в бою: сирена, начало боя | Autonoe | whisper, alluring | Море знает твоё имя. Я тоже. |
| foe_siren_start_5_g.flac | в бою: сирена, начало боя | Autonoe | soothing, sinister | Не бойся глубины… в ней так тихо… |
| foe_siren_attack_0_g.flac | в бою: сирена, удар | Autonoe | shrieking | На дно! |
| foe_siren_attack_1_g.flac | в бою: сирена, удар | Autonoe | commanding, furious | Вода, возьми его! |
| foe_siren_attack_2_g.flac | в бою: сирена, удар | Autonoe | sweet then shrieking | Утони в моих объятиях! |
| foe_siren_attack_3_g.flac | в бою: сирена, удар | Autonoe | hissing | Соль тебе в раны! |
| foe_siren_attack_4_g.flac | в бою: сирена, удар | Autonoe | cruel, sweet | Задержи дыхание… навсегда! |
| foe_siren_attack_5_g.flac | в бою: сирена, удар | Autonoe | shrieking command | Волна, накрой! |
| foe_siren_hurt_0_g.flac | в бою: сирена, ранен | Autonoe | hurt, betrayed | Ты ранишь меня? Меня, что любила тебя? |
| foe_siren_hurt_1_g.flac | в бою: сирена, ранен | Autonoe | cold, hissing | Кровь в воде… акулы услышат. |
| foe_siren_hurt_2_g.flac | в бою: сирена, ранен | Autonoe | bitter, hurt | Жестокий… как все живые. |
| foe_siren_hurt_3_g.flac | в бою: сирена, ранен | Autonoe | sorrowful, eerie | Больно… как в ту ночь… |
| foe_siren_low_0_g.flac | в бою: сирена, на исходе | Autonoe | fading, pleading | Море… забери меня домой… |
| foe_siren_low_1_g.flac | в бою: сирена, на исходе | Autonoe | sorrowful whisper | Не оставляй меня одну… |
| foe_siren_low_2_g.flac | в бою: сирена, на исходе | Autonoe | fading, eerie | Я уйду в глубину… и буду ждать… |
| foe_siren_low_3_g.flac | в бою: сирена, на исходе | Autonoe | desperate, wailing | Верни… верни мне сердце… |
| foe_siren_taunt_0_g.flac | в бою: сирена, герой слабеет | Autonoe | sweet, cruel | Ты уже тонешь, милый. Просто не знаешь. |
| foe_siren_taunt_1_g.flac | в бою: сирена, герой слабеет | Autonoe | lulling, sinister | Слышишь прибой? Это твоя колыбельная. |
| foe_siren_taunt_2_g.flac | в бою: сирена, герой слабеет | Autonoe | whisper, alluring | Ещё шаг… и вода сомкнётся. |
| foe_siren_death_0_g.flac | в бою: сирена, гибель | Autonoe | fading whisper | Прилив… уносит… |
| foe_siren_death_1_g.flac | в бою: сирена, гибель | Autonoe | peaceful, fading | Наконец… тишина глубины… |
| foe_siren_death_2_g.flac | в бою: сирена, гибель | Autonoe | sorrowful, dying | Жених мой… прощай… |
| foe_construct_start_0_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | flat, mechanical, monotone | Нарушитель. Обнаружен. |
| foe_construct_start_1_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | flat, monotone, cold | Проход закрыт. Приказ Предтеч. |
| foe_construct_start_2_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | flat, mechanical | Чужак в охраняемом ярусе. Устранить. |
| foe_construct_start_3_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | cold, monotone | Стража пробуждена. Сопротивление бесполезно. |
| foe_construct_start_4_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | flat, emotionless | Ты не значишься в списках. Ты будешь стёрт. |
| foe_construct_start_5_g.flac | в бою: страж Предтеч, начало боя | Zubenelgenubi | monotone, mechanical | Сеть приказывает: защищать. |
| foe_construct_attack_0_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | flat, mechanical | Удар. |
| foe_construct_attack_1_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | flat, monotone | Подавление. |
| foe_construct_attack_2_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | cold, mechanical | Устранение цели. |
| foe_construct_attack_3_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | flat, monotone | Сила увеличена. |
| foe_construct_attack_4_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | mechanical | Цель в досягаемости. |
| foe_construct_attack_5_g.flac | в бою: страж Предтеч, удар | Zubenelgenubi | flat, monotone | Исполняю. |
| foe_construct_hurt_0_g.flac | в бою: страж Предтеч, ранен | Zubenelgenubi | flat, mechanical | Повреждение корпуса. |
| foe_construct_hurt_1_g.flac | в бою: страж Предтеч, ранен | Zubenelgenubi | monotone, cold | Трещина в рунах. Продолжаю. |
| foe_construct_hurt_2_g.flac | в бою: страж Предтеч, ранен | Zubenelgenubi | flat, emotionless | Урон принят. Задача не изменилась. |
| foe_construct_hurt_3_g.flac | в бою: страж Предтеч, ранен | Zubenelgenubi | monotone, mechanical | Руны гаснут. Перенаправляю силу. |
| foe_construct_low_0_g.flac | в бою: страж Предтеч, на исходе | Zubenelgenubi | flat | Критическое повреждение. |
| foe_construct_low_1_g.flac | в бою: страж Предтеч, на исходе | Zubenelgenubi | fading, mechanical | Связь с сетью… теряется… |
| foe_construct_low_2_g.flac | в бою: страж Предтеч, на исходе | Zubenelgenubi | flat, fading | Приказ… не выполнен… |
| foe_construct_low_3_g.flac | в бою: страж Предтеч, на исходе | Zubenelgenubi | flat, cold | Резерв исчерпан. Последний удар. |
| foe_construct_taunt_0_g.flac | в бою: страж Предтеч, герой слабеет | Zubenelgenubi | flat, mechanical | Цель ослаблена. Завершаю. |
| foe_construct_taunt_1_g.flac | в бою: страж Предтеч, герой слабеет | Zubenelgenubi | cold, monotone | Твоё сопротивление падает. |
| foe_construct_taunt_2_g.flac | в бою: страж Предтеч, герой слабеет | Zubenelgenubi | flat, emotionless | Расчёт: ты не выстоишь. |
| foe_construct_death_0_g.flac | в бою: страж Предтеч, гибель | Zubenelgenubi | fading | Отключение… |
| foe_construct_death_1_g.flac | в бою: страж Предтеч, гибель | Zubenelgenubi | fading, mechanical | Сеть… молчит… |
| foe_construct_death_2_g.flac | в бою: страж Предтеч, гибель | Zubenelgenubi | fading | Страж… уснул… |
| quest_fetch_derevo_0_g.flac | заказчик: принести — дерево | Umbriel | practical, worried | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_0_f_g.flac | заказчик: принести — дерево | Despina | practical, worried | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_0_v1_g.flac | заказчик: принести — дерево | Sadachbia | practical, worried | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_0_v1_f_g.flac | заказчик: принести — дерево | Leda | practical, worried | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_1_g.flac | заказчик: принести — дерево | Umbriel | businesslike, earnest | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_derevo_1_f_g.flac | заказчик: принести — дерево | Despina | businesslike, earnest | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_derevo_1_v1_g.flac | заказчик: принести — дерево | Sadachbia | businesslike, earnest | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_derevo_1_v1_f_g.flac | заказчик: принести — дерево | Leda | businesslike, earnest | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_trava_0_g.flac | заказчик: принести — травы | Umbriel | worried, pleading | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_0_f_g.flac | заказчик: принести — травы | Despina | worried, pleading | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_0_v1_g.flac | заказчик: принести — травы | Sadachbia | worried, pleading | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_0_v1_f_g.flac | заказчик: принести — травы | Leda | worried, pleading | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_1_g.flac | заказчик: принести — травы | Umbriel | brisk, instructive | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_trava_1_f_g.flac | заказчик: принести — травы | Despina | brisk, instructive | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_trava_1_v1_g.flac | заказчик: принести — травы | Sadachbia | brisk, instructive | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_trava_1_v1_f_g.flac | заказчик: принести — травы | Leda | brisk, instructive | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_yagody_0_g.flac | заказчик: принести — ягоды | Umbriel | warm, homely | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_0_f_g.flac | заказчик: принести — ягоды | Despina | warm, homely | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_0_v1_g.flac | заказчик: принести — ягоды | Sadachbia | warm, homely | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_0_v1_f_g.flac | заказчик: принести — ягоды | Leda | warm, homely | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_1_g.flac | заказчик: принести — ягоды | Umbriel | fussy, friendly | Собери ягод, только спелых. Зелёные не возьму. |
| quest_fetch_yagody_1_f_g.flac | заказчик: принести — ягоды | Despina | fussy, friendly | Собери ягод, только спелых. Зелёные не возьму. |
| quest_fetch_yagody_1_v1_g.flac | заказчик: принести — ягоды | Sadachbia | fussy, friendly | Собери ягод, только спелых. Зелёные не возьму. |
| quest_fetch_yagody_1_v1_f_g.flac | заказчик: принести — ягоды | Leda | fussy, friendly | Собери ягод, только спелых. Зелёные не возьму. |
| quest_fetch_kamen_0_g.flac | заказчик: принести — камень | Umbriel | tired, practical | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_0_f_g.flac | заказчик: принести — камень | Despina | tired, practical | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_0_v1_g.flac | заказчик: принести — камень | Sadachbia | tired, practical | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_0_v1_f_g.flac | заказчик: принести — камень | Leda | tired, practical | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_1_g.flac | заказчик: принести — камень | Umbriel | firm, businesslike | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_kamen_1_f_g.flac | заказчик: принести — камень | Despina | firm, businesslike | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_kamen_1_v1_g.flac | заказчик: принести — камень | Sadachbia | firm, businesslike | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_kamen_1_v1_f_g.flac | заказчик: принести — камень | Leda | firm, businesslike | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_ruda_0_g.flac | заказчик: принести — руда | Umbriel | gruff, urgent | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_0_f_g.flac | заказчик: принести — руда | Despina | gruff, urgent | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_0_v1_g.flac | заказчик: принести — руда | Sadachbia | gruff, urgent | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_0_v1_f_g.flac | заказчик: принести — руда | Leda | gruff, urgent | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_1_g.flac | заказчик: принести — руда | Umbriel | gruff, wry | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_ruda_1_f_g.flac | заказчик: принести — руда | Despina | gruff, wry | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_ruda_1_v1_g.flac | заказчик: принести — руда | Sadachbia | gruff, wry | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_ruda_1_v1_f_g.flac | заказчик: принести — руда | Leda | gruff, wry | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_kristall_0_g.flac | заказчик: принести — кристаллы | Umbriel | hushed, mysterious | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_0_f_g.flac | заказчик: принести — кристаллы | Despina | hushed, mysterious | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_0_v1_g.flac | заказчик: принести — кристаллы | Sadachbia | hushed, mysterious | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_0_v1_f_g.flac | заказчик: принести — кристаллы | Leda | hushed, mysterious | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_1_g.flac | заказчик: принести — кристаллы | Umbriel | precise, thoughtful | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_kristall_1_f_g.flac | заказчик: принести — кристаллы | Despina | precise, thoughtful | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_kristall_1_v1_g.flac | заказчик: принести — кристаллы | Sadachbia | precise, thoughtful | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_kristall_1_v1_f_g.flac | заказчик: принести — кристаллы | Leda | precise, thoughtful | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_rakushka_0_g.flac | заказчик: принести — ракушки | Umbriel | light, friendly | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_0_f_g.flac | заказчик: принести — ракушки | Despina | light, friendly | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_0_v1_g.flac | заказчик: принести — ракушки | Sadachbia | light, friendly | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_0_v1_f_g.flac | заказчик: принести — ракушки | Leda | light, friendly | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_1_g.flac | заказчик: принести — ракушки | Umbriel | cheerful, explaining | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_rakushka_1_f_g.flac | заказчик: принести — ракушки | Despina | cheerful, explaining | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_rakushka_1_v1_g.flac | заказчик: принести — ракушки | Sadachbia | cheerful, explaining | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_rakushka_1_v1_f_g.flac | заказчик: принести — ракушки | Leda | cheerful, explaining | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_griby_0_g.flac | заказчик: принести — грибы | Umbriel | warning, friendly | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_0_f_g.flac | заказчик: принести — грибы | Despina | warning, friendly | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_0_v1_g.flac | заказчик: принести — грибы | Sadachbia | warning, friendly | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_0_v1_f_g.flac | заказчик: принести — грибы | Leda | warning, friendly | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_1_g.flac | заказчик: принести — грибы | Umbriel | instructive, calm | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_griby_1_f_g.flac | заказчик: принести — грибы | Despina | instructive, calm | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_griby_1_v1_g.flac | заказчик: принести — грибы | Sadachbia | instructive, calm | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_griby_1_v1_f_g.flac | заказчик: принести — грибы | Leda | instructive, calm | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_kost_0_g.flac | заказчик: принести — кости | Umbriel | curt, secretive | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_0_f_g.flac | заказчик: принести — кости | Despina | curt, secretive | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_0_v1_g.flac | заказчик: принести — кости | Sadachbia | curt, secretive | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_0_v1_f_g.flac | заказчик: принести — кости | Leda | curt, secretive | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_1_g.flac | заказчик: принести — кости | Umbriel | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_fetch_kost_1_f_g.flac | заказчик: принести — кости | Despina | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_fetch_kost_1_v1_g.flac | заказчик: принести — кости | Sadachbia | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_fetch_kost_1_v1_f_g.flac | заказчик: принести — кости | Leda | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_kill_sever_0_g.flac | заказчик: очистить округу — север | Umbriel | grim, urgent | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_0_f_g.flac | заказчик: очистить округу — север | Despina | grim, urgent | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_0_v1_g.flac | заказчик: очистить округу — север | Sadachbia | grim, urgent | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_0_v1_f_g.flac | заказчик: очистить округу — север | Leda | grim, urgent | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_1_g.flac | заказчик: очистить округу — север | Umbriel | angry, determined | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_sever_1_f_g.flac | заказчик: очистить округу — север | Despina | angry, determined | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_sever_1_v1_g.flac | заказчик: очистить округу — север | Sadachbia | angry, determined | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_sever_1_v1_f_g.flac | заказчик: очистить округу — север | Leda | angry, determined | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_yug_0_g.flac | заказчик: очистить округу — юг | Umbriel | worried, urgent | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_0_f_g.flac | заказчик: очистить округу — юг | Despina | worried, urgent | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_0_v1_g.flac | заказчик: очистить округу — юг | Sadachbia | worried, urgent | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_0_v1_f_g.flac | заказчик: очистить округу — юг | Leda | worried, urgent | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_1_g.flac | заказчик: очистить округу — юг | Umbriel | businesslike, grim | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_yug_1_f_g.flac | заказчик: очистить округу — юг | Despina | businesslike, grim | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_yug_1_v1_g.flac | заказчик: очистить округу — юг | Sadachbia | businesslike, grim | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_yug_1_v1_f_g.flac | заказчик: очистить округу — юг | Leda | businesslike, grim | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_zapad_0_g.flac | заказчик: очистить округу — запад | Umbriel | stern, grim | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_0_f_g.flac | заказчик: очистить округу — запад | Despina | stern, grim | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_0_v1_g.flac | заказчик: очистить округу — запад | Sadachbia | stern, grim | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_0_v1_f_g.flac | заказчик: очистить округу — запад | Leda | stern, grim | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_1_g.flac | заказчик: очистить округу — запад | Umbriel | uneasy, lowered voice | Ступай на запад. Там по ночам воют — разберись. |
| quest_kill_zapad_1_f_g.flac | заказчик: очистить округу — запад | Despina | uneasy, lowered voice | Ступай на запад. Там по ночам воют — разберись. |
| quest_kill_zapad_1_v1_g.flac | заказчик: очистить округу — запад | Sadachbia | uneasy, lowered voice | Ступай на запад. Там по ночам воют — разберись. |
| quest_kill_zapad_1_v1_f_g.flac | заказчик: очистить округу — запад | Leda | uneasy, lowered voice | Ступай на запад. Там по ночам воют — разберись. |
| quest_kill_vostok_0_g.flac | заказчик: очистить округу — восток | Umbriel | urgent, fearful | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_0_f_g.flac | заказчик: очистить округу — восток | Despina | urgent, fearful | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_0_v1_g.flac | заказчик: очистить округу — восток | Sadachbia | urgent, fearful | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_0_v1_f_g.flac | заказчик: очистить округу — восток | Leda | urgent, fearful | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_1_g.flac | заказчик: очистить округу — восток | Umbriel | earnest, grim | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_kill_vostok_1_f_g.flac | заказчик: очистить округу — восток | Despina | earnest, grim | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_kill_vostok_1_v1_g.flac | заказчик: очистить округу — восток | Sadachbia | earnest, grim | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_kill_vostok_1_v1_f_g.flac | заказчик: очистить округу — восток | Leda | earnest, grim | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_type_hunt_0_g.flac | заказчик: выследить зверя | Umbriel | serious, emphatic | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_0_f_g.flac | заказчик: выследить зверя | Despina | serious, emphatic | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_0_v1_g.flac | заказчик: выследить зверя | Sadachbia | serious, emphatic | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_0_v1_f_g.flac | заказчик: выследить зверя | Leda | serious, emphatic | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_1_g.flac | заказчик: выследить зверя | Umbriel | stern, instructive | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_1_f_g.flac | заказчик: выследить зверя | Despina | stern, instructive | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_1_v1_g.flac | заказчик: выследить зверя | Sadachbia | stern, instructive | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_1_v1_f_g.flac | заказчик: выследить зверя | Leda | stern, instructive | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_2_g.flac | заказчик: выследить зверя | Umbriel | grim, angry | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_2_f_g.flac | заказчик: выследить зверя | Despina | grim, angry | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_2_v1_g.flac | заказчик: выследить зверя | Sadachbia | grim, angry | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_2_v1_f_g.flac | заказчик: выследить зверя | Leda | grim, angry | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_3_g.flac | заказчик: выследить зверя | Umbriel | warning, intent | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_hunt_3_f_g.flac | заказчик: выследить зверя | Despina | warning, intent | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_hunt_3_v1_g.flac | заказчик: выследить зверя | Sadachbia | warning, intent | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_hunt_3_v1_f_g.flac | заказчик: выследить зверя | Leda | warning, intent | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_visit_2_g.flac | заказчик: сходить и посмотреть | Umbriel | curious, earnest | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_2_f_g.flac | заказчик: сходить и посмотреть | Despina | curious, earnest | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_2_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | curious, earnest | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_2_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | curious, earnest | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_3_g.flac | заказчик: сходить и посмотреть | Umbriel | anxious, brisk | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_3_f_g.flac | заказчик: сходить и посмотреть | Despina | anxious, brisk | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_3_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | anxious, brisk | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_3_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | anxious, brisk | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_4_g.flac | заказчик: сходить и посмотреть | Umbriel | worried, thoughtful | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_4_f_g.flac | заказчик: сходить и посмотреть | Despina | worried, thoughtful | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_4_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | worried, thoughtful | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_4_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | worried, thoughtful | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_5_g.flac | заказчик: сходить и посмотреть | Umbriel | mysterious, hushed | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_type_visit_5_f_g.flac | заказчик: сходить и посмотреть | Despina | mysterious, hushed | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_type_visit_5_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | mysterious, hushed | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_type_visit_5_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | mysterious, hushed | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_type_god_altar_0_g.flac | заказчик: алтарь бога | Umbriel | reverent, earnest | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_0_f_g.flac | заказчик: алтарь бога | Despina | reverent, earnest | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_0_v1_g.flac | заказчик: алтарь бога | Sadachbia | reverent, earnest | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_0_v1_f_g.flac | заказчик: алтарь бога | Leda | reverent, earnest | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_1_g.flac | заказчик: алтарь бога | Umbriel | solemn, calm | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_1_f_g.flac | заказчик: алтарь бога | Despina | solemn, calm | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_1_v1_g.flac | заказчик: алтарь бога | Sadachbia | solemn, calm | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_1_v1_f_g.flac | заказчик: алтарь бога | Leda | solemn, calm | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_2_g.flac | заказчик: алтарь бога | Umbriel | quiet, reverent | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_altar_2_f_g.flac | заказчик: алтарь бога | Despina | quiet, reverent | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_altar_2_v1_g.flac | заказчик: алтарь бога | Sadachbia | quiet, reverent | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_altar_2_v1_f_g.flac | заказчик: алтарь бога | Leda | quiet, reverent | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_relic_0_g.flac | заказчик: святыня | Umbriel | urgent, reverent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_0_f_g.flac | заказчик: святыня | Despina | urgent, reverent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_0_v1_g.flac | заказчик: святыня | Sadachbia | urgent, reverent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_0_v1_f_g.flac | заказчик: святыня | Leda | urgent, reverent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_1_g.flac | заказчик: святыня | Umbriel | pained, pleading | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_1_f_g.flac | заказчик: святыня | Despina | pained, pleading | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_1_v1_g.flac | заказчик: святыня | Sadachbia | pained, pleading | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_1_v1_f_g.flac | заказчик: святыня | Leda | pained, pleading | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_2_g.flac | заказчик: святыня | Umbriel | solemn, sad | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_god_relic_2_f_g.flac | заказчик: святыня | Despina | solemn, sad | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_god_relic_2_v1_g.flac | заказчик: святыня | Sadachbia | solemn, sad | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_god_relic_2_v1_f_g.flac | заказчик: святыня | Leda | solemn, sad | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_hoard_0_g.flac | заказчик: клад | Umbriel | sly, conspiratorial | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_0_f_g.flac | заказчик: клад | Despina | sly, conspiratorial | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_0_v1_g.flac | заказчик: клад | Sadachbia | sly, conspiratorial | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_0_v1_f_g.flac | заказчик: клад | Leda | sly, conspiratorial | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_1_g.flac | заказчик: клад | Umbriel | hushed, eager | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_1_f_g.flac | заказчик: клад | Despina | hushed, eager | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_1_v1_g.flac | заказчик: клад | Sadachbia | hushed, eager | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_1_v1_f_g.flac | заказчик: клад | Leda | hushed, eager | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_2_g.flac | заказчик: клад | Umbriel | whisper, secretive | Там припрятано добро. Только никому ни слова, понял? |
| quest_type_hoard_2_f_g.flac | заказчик: клад | Despina | whisper, secretive | Там припрятано добро. Только никому ни слова, поняла? |
| quest_type_hoard_2_v1_g.flac | заказчик: клад | Sadachbia | whisper, secretive | Там припрятано добро. Только никому ни слова, понял? |
| quest_type_hoard_2_v1_f_g.flac | заказчик: клад | Leda | whisper, secretive | Там припрятано добро. Только никому ни слова, поняла? |
| quest_type_craft_0_g.flac | заказчик: работа мастера | Umbriel | businesslike, hopeful | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_0_f_g.flac | заказчик: работа мастера | Despina | businesslike, hopeful | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_0_v1_g.flac | заказчик: работа мастера | Sadachbia | businesslike, hopeful | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_0_v1_f_g.flac | заказчик: работа мастера | Leda | businesslike, hopeful | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_1_g.flac | заказчик: работа мастера | Umbriel | friendly, appraising | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_1_f_g.flac | заказчик: работа мастера | Despina | friendly, appraising | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_1_v1_g.flac | заказчик: работа мастера | Sadachbia | friendly, appraising | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_1_v1_f_g.flac | заказчик: работа мастера | Leda | friendly, appraising | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_2_g.flac | заказчик: работа мастера | Umbriel | hurried, businesslike | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_craft_2_f_g.flac | заказчик: работа мастера | Despina | hurried, businesslike | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_craft_2_v1_g.flac | заказчик: работа мастера | Sadachbia | hurried, businesslike | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_craft_2_v1_f_g.flac | заказчик: работа мастера | Leda | hurried, businesslike | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_trapwork_0_g.flac | заказчик: ловушки | Umbriel | worried, earnest | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_0_f_g.flac | заказчик: ловушки | Despina | worried, earnest | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_0_v1_g.flac | заказчик: ловушки | Sadachbia | worried, earnest | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_0_v1_f_g.flac | заказчик: ловушки | Leda | worried, earnest | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_1_g.flac | заказчик: ловушки | Umbriel | warning, concerned | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_1_f_g.flac | заказчик: ловушки | Despina | warning, concerned | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_1_v1_g.flac | заказчик: ловушки | Sadachbia | warning, concerned | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_1_v1_f_g.flac | заказчик: ловушки | Leda | warning, concerned | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_2_g.flac | заказчик: ловушки | Umbriel | practical, instructive | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_trapwork_2_f_g.flac | заказчик: ловушки | Despina | practical, instructive | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_trapwork_2_v1_g.flac | заказчик: ловушки | Sadachbia | practical, instructive | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_trapwork_2_v1_f_g.flac | заказчик: ловушки | Leda | practical, instructive | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_delivery_0_g.flac | заказчик: доставка груза | Umbriel | businesslike, shrewd | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_0_f_g.flac | заказчик: доставка груза | Despina | businesslike, shrewd | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_0_v1_g.flac | заказчик: доставка груза | Sadachbia | businesslike, shrewd | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_0_v1_f_g.flac | заказчик: доставка груза | Leda | businesslike, shrewd | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_1_g.flac | заказчик: доставка груза | Umbriel | shrewd, warning | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_1_f_g.flac | заказчик: доставка груза | Despina | shrewd, warning | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_1_v1_g.flac | заказчик: доставка груза | Sadachbia | shrewd, warning | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_1_v1_f_g.flac | заказчик: доставка груза | Leda | shrewd, warning | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_2_g.flac | заказчик: доставка груза | Umbriel | earnest, businesslike | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_type_delivery_2_f_g.flac | заказчик: доставка груза | Despina | earnest, businesslike | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_type_delivery_2_v1_g.flac | заказчик: доставка груза | Sadachbia | earnest, businesslike | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_type_delivery_2_v1_f_g.flac | заказчик: доставка груза | Leda | earnest, businesslike | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_war_2_g.flac | заказчик: война | Umbriel | urgent, grave | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_2_f_g.flac | заказчик: война | Despina | urgent, grave | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_2_v1_g.flac | заказчик: война | Sadachbia | urgent, grave | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_2_v1_f_g.flac | заказчик: война | Leda | urgent, grave | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_3_g.flac | заказчик: война | Umbriel | commanding, grave | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_3_f_g.flac | заказчик: война | Despina | commanding, grave | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_3_v1_g.flac | заказчик: война | Sadachbia | commanding, grave | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_3_v1_f_g.flac | заказчик: война | Leda | commanding, grave | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_4_g.flac | заказчик: война | Umbriel | grim, earnest | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| quest_war_4_f_g.flac | заказчик: война | Despina | grim, earnest | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| quest_war_4_v1_g.flac | заказчик: война | Sadachbia | grim, earnest | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| quest_war_4_v1_f_g.flac | заказчик: война | Leda | grim, earnest | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| quest_rescue_3_g.flac | заказчик: спасение | Umbriel | pleading, urgent | Там наши, в беде. Выручи их — больше некому. |
| quest_rescue_3_f_g.flac | заказчик: спасение | Despina | pleading, urgent | Там наши, в беде. Выручи их — больше некому. |
| quest_rescue_3_v1_g.flac | заказчик: спасение | Sadachbia | pleading, urgent | Там наши, в беде. Выручи их — больше некому. |
| quest_rescue_3_v1_f_g.flac | заказчик: спасение | Leda | pleading, urgent | Там наши, в беде. Выручи их — больше некому. |
| quest_secret_2_g.flac | заказчик: скрытое | Umbriel | whisper, secretive | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_2_f_g.flac | заказчик: скрытое | Despina | whisper, secretive | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_2_v1_g.flac | заказчик: скрытое | Sadachbia | whisper, secretive | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_2_v1_f_g.flac | заказчик: скрытое | Leda | whisper, secretive | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_3_g.flac | заказчик: скрытое | Umbriel | hushed, tense | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_secret_3_f_g.flac | заказчик: скрытое | Despina | hushed, tense | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_secret_3_v1_g.flac | заказчик: скрытое | Sadachbia | hushed, tense | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_secret_3_v1_f_g.flac | заказчик: скрытое | Leda | hushed, tense | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_diplom_2_g.flac | заказчик: дипломатия | Umbriel | calm, diplomatic | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_2_f_g.flac | заказчик: дипломатия | Despina | calm, diplomatic | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_2_v1_g.flac | заказчик: дипломатия | Sadachbia | calm, diplomatic | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_2_v1_f_g.flac | заказчик: дипломатия | Leda | calm, diplomatic | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_3_g.flac | заказчик: дипломатия | Umbriel | earnest, measured | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_diplom_3_f_g.flac | заказчик: дипломатия | Despina | earnest, measured | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_diplom_3_v1_g.flac | заказчик: дипломатия | Sadachbia | earnest, measured | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_diplom_3_v1_f_g.flac | заказчик: дипломатия | Leda | earnest, measured | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_case_2_g.flac | заказчик: расследование | Umbriel | suspicious, serious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_2_f_g.flac | заказчик: расследование | Despina | suspicious, serious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_2_v1_g.flac | заказчик: расследование | Sadachbia | suspicious, serious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_2_v1_f_g.flac | заказчик: расследование | Leda | suspicious, serious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_3_g.flac | заказчик: расследование | Umbriel | irritated, determined | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_case_3_f_g.flac | заказчик: расследование | Despina | irritated, determined | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_case_3_v1_g.flac | заказчик: расследование | Sadachbia | irritated, determined | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_case_3_v1_f_g.flac | заказчик: расследование | Leda | irritated, determined | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_study_2_g.flac | заказчик: исследование | Umbriel | scholarly, eager | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_2_f_g.flac | заказчик: исследование | Despina | scholarly, eager | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_2_v1_g.flac | заказчик: исследование | Sadachbia | scholarly, eager | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_2_v1_f_g.flac | заказчик: исследование | Leda | scholarly, eager | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_3_g.flac | заказчик: исследование | Umbriel | thoughtful, precise | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_study_3_f_g.flac | заказчик: исследование | Despina | thoughtful, precise | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_study_3_v1_g.flac | заказчик: исследование | Sadachbia | thoughtful, precise | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_study_3_v1_f_g.flac | заказчик: исследование | Leda | thoughtful, precise | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_archeo_2_g.flac | заказчик: археология | Umbriel | eager, careful | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_2_f_g.flac | заказчик: археология | Despina | eager, careful | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_2_v1_g.flac | заказчик: археология | Sadachbia | eager, careful | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_2_v1_f_g.flac | заказчик: археология | Leda | eager, careful | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_3_g.flac | заказчик: археология | Umbriel | awed, curious | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_archeo_3_f_g.flac | заказчик: археология | Despina | awed, curious | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_archeo_3_v1_g.flac | заказчик: археология | Sadachbia | awed, curious | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_archeo_3_v1_f_g.flac | заказчик: археология | Leda | awed, curious | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_magic_2_g.flac | заказчик: магия | Umbriel | mysterious, warning | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_2_f_g.flac | заказчик: магия | Despina | mysterious, warning | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_2_v1_g.flac | заказчик: магия | Sadachbia | mysterious, warning | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_2_v1_f_g.flac | заказчик: магия | Leda | mysterious, warning | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_3_g.flac | заказчик: магия | Umbriel | appraising, wry | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_magic_3_f_g.flac | заказчик: магия | Despina | appraising, wry | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_magic_3_v1_g.flac | заказчик: магия | Sadachbia | appraising, wry | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_magic_3_v1_f_g.flac | заказчик: магия | Leda | appraising, wry | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_econ_2_g.flac | заказчик: экономика | Umbriel | shrewd, worried | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_2_f_g.flac | заказчик: экономика | Despina | shrewd, worried | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_2_v1_g.flac | заказчик: экономика | Sadachbia | shrewd, worried | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_2_v1_f_g.flac | заказчик: экономика | Leda | shrewd, worried | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_3_g.flac | заказчик: экономика | Umbriel | businesslike, frustrated | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_econ_3_f_g.flac | заказчик: экономика | Despina | businesslike, frustrated | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_econ_3_v1_g.flac | заказчик: экономика | Sadachbia | businesslike, frustrated | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_econ_3_v1_f_g.flac | заказчик: экономика | Leda | businesslike, frustrated | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_faction_2_g.flac | заказчик: фракционное | Umbriel | earnest, proud | Наши люди просят помощи. Сделаешь — станешь одним из нас. |
| quest_faction_2_f_g.flac | заказчик: фракционное | Despina | earnest, proud | Наши люди просят помощи. Сделаешь — станешь одной из нас. |
| quest_faction_2_v1_g.flac | заказчик: фракционное | Sadachbia | earnest, proud | Наши люди просят помощи. Сделаешь — станешь одним из нас. |
| quest_faction_2_v1_f_g.flac | заказчик: фракционное | Leda | earnest, proud | Наши люди просят помощи. Сделаешь — станешь одной из нас. |
| quest_faction_3_g.flac | заказчик: фракционное | Umbriel | solemn, loyal | Братство помнит тех, кто ему помог. Не подведи. |
| quest_faction_3_f_g.flac | заказчик: фракционное | Despina | solemn, loyal | Братство помнит тех, кто ему помог. Не подведи. |
| quest_faction_3_v1_g.flac | заказчик: фракционное | Sadachbia | solemn, loyal | Братство помнит тех, кто ему помог. Не подведи. |
| quest_faction_3_v1_f_g.flac | заказчик: фракционное | Leda | solemn, loyal | Братство помнит тех, кто ему помог. Не подведи. |
| quest_story_2_g.flac | заказчик: сюжетное | Umbriel | grave, portentous | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_2_f_g.flac | заказчик: сюжетное | Despina | grave, portentous | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_2_v1_g.flac | заказчик: сюжетное | Sadachbia | grave, portentous | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_2_v1_f_g.flac | заказчик: сюжетное | Leda | grave, portentous | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_3_g.flac | заказчик: сюжетное | Umbriel | serious, lowered voice | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_story_3_f_g.flac | заказчик: сюжетное | Despina | serious, lowered voice | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_story_3_v1_g.flac | заказчик: сюжетное | Sadachbia | serious, lowered voice | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_story_3_v1_f_g.flac | заказчик: сюжетное | Leda | serious, lowered voice | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_random_2_g.flac | заказчик: случайное | Umbriel | casual, wry | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_2_f_g.flac | заказчик: случайное | Despina | casual, wry | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_2_v1_g.flac | заказчик: случайное | Sadachbia | casual, wry | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_2_v1_f_g.flac | заказчик: случайное | Leda | casual, wry | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_3_g.flac | заказчик: случайное | Umbriel | plain, businesslike | Работа есть, работа простая. Главное — сделать. |
| quest_random_3_f_g.flac | заказчик: случайное | Despina | plain, businesslike | Работа есть, работа простая. Главное — сделать. |
| quest_random_3_v1_g.flac | заказчик: случайное | Sadachbia | plain, businesslike | Работа есть, работа простая. Главное — сделать. |
| quest_random_3_v1_f_g.flac | заказчик: случайное | Leda | plain, businesslike | Работа есть, работа простая. Главное — сделать. |
| quest_have_2_g.flac | заказчик: дело уже взято | Umbriel | patient, reminding | Ты уже взялся за моё дело. Сперва закончи его. |
| quest_have_2_f_g.flac | заказчик: дело уже взято | Despina | patient, reminding | Ты уже взялась за моё дело. Сперва закончи его. |
| quest_have_2_v1_g.flac | заказчик: дело уже взято | Sadachbia | patient, reminding | Ты уже взялся за моё дело. Сперва закончи его. |
| quest_have_2_v1_f_g.flac | заказчик: дело уже взято | Leda | patient, reminding | Ты уже взялась за моё дело. Сперва закончи его. |
| quest_have_3_g.flac | заказчик: дело уже взято | Umbriel | impatient, reminding | Я жду. Дело-то моё ещё не сделано. |
| quest_have_3_f_g.flac | заказчик: дело уже взято | Despina | impatient, reminding | Я жду. Дело-то моё ещё не сделано. |
| quest_have_3_v1_g.flac | заказчик: дело уже взято | Sadachbia | impatient, reminding | Я жду. Дело-то моё ещё не сделано. |
| quest_have_3_v1_f_g.flac | заказчик: дело уже взято | Leda | impatient, reminding | Я жду. Дело-то моё ещё не сделано. |
| quest_have_4_g.flac | заказчик: дело уже взято | Umbriel | wry, reminding | Не торопись с новым — старое ещё за тобой. |
| quest_have_4_f_g.flac | заказчик: дело уже взято | Despina | wry, reminding | Не торопись с новым — старое ещё за тобой. |
| quest_have_4_v1_g.flac | заказчик: дело уже взято | Sadachbia | wry, reminding | Не торопись с новым — старое ещё за тобой. |
| quest_have_4_v1_f_g.flac | заказчик: дело уже взято | Leda | wry, reminding | Не торопись с новым — старое ещё за тобой. |
| quest_full_3_g.flac | заказчик: дел слишком много | Umbriel | sympathetic, wry | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_3_f_g.flac | заказчик: дел слишком много | Despina | sympathetic, wry | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_3_v1_g.flac | заказчик: дел слишком много | Sadachbia | sympathetic, wry | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_3_v1_f_g.flac | заказчик: дел слишком много | Leda | sympathetic, wry | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_4_g.flac | заказчик: дел слишком много | Umbriel | kind, advising | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| quest_full_4_f_g.flac | заказчик: дел слишком много | Despina | kind, advising | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| quest_full_4_v1_g.flac | заказчик: дел слишком много | Sadachbia | kind, advising | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| quest_full_4_v1_f_g.flac | заказчик: дел слишком много | Leda | kind, advising | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| street_folk_24_g.flac | горожанин | Achird | grumbling | Опять цены подняли. Скоро хлеб на вес золота будет. |
| street_folk_24_f_g.flac | горожанин | Sulafat | grumbling | Опять цены подняли. Скоро хлеб на вес золота будет. |
| street_folk_25_g.flac | горожанин | Achird | excited gossip | Слыхал? У мельника корова двухголовая отелилась. |
| street_folk_25_f_g.flac | горожанин | Sulafat | excited gossip | Слыхал? У мельника корова двухголовая отелилась. |
| street_folk_26_g.flac | горожанин | Achird | uneasy, superstitious | Ночью опять огни над лесом. Не к добру это. |
| street_folk_26_f_g.flac | горожанин | Sulafat | uneasy, superstitious | Ночью опять огни над лесом. Не к добру это. |
| street_folk_27_g.flac | горожанин | Achird | joyful, proud | Дочка замуж выходит. Всем городом гулять будем! |
| street_folk_27_f_g.flac | горожанин | Sulafat | joyful, proud | Дочка замуж выходит. Всем городом гулять будем! |
| street_folk_28_g.flac | горожанин | Achird | tired, groaning | Спина не гнётся. Годы, будь они неладны. |
| street_folk_28_f_g.flac | горожанин | Sulafat | tired, groaning | Спина не гнётся. Годы, будь они неладны. |
| street_folk_29_g.flac | горожанин | Achird | worried | Караван третий день не идёт. Не случилось бы чего. |
| street_folk_29_f_g.flac | горожанин | Sulafat | worried | Караван третий день не идёт. Не случилось бы чего. |
| street_folk_30_g.flac | горожанин | Achird | annoyed | Сосед опять за стенкой молотком стучит. С утра до ночи. |
| street_folk_30_f_g.flac | горожанин | Sulafat | annoyed | Сосед опять за стенкой молотком стучит. С утра до ночи. |
| street_folk_31_g.flac | горожанин | Achird | cheerful, casual | Говорят, в трактире нынче сказитель. Схожу вечером. |
| street_folk_31_f_g.flac | горожанин | Sulafat | cheerful, casual | Говорят, в трактире нынче сказитель. Схожу вечером. |
| street_folk_32_g.flac | горожанин | Achird | sighing, worried | Дождь бы. Огород совсем пересох. |
| street_folk_32_f_g.flac | горожанин | Sulafat | sighing, worried | Дождь бы. Огород совсем пересох. |
| street_folk_33_g.flac | горожанин | Achird | suspicious grumbling | Храм опять собирает на крышу. А куда прошлое делось? |
| street_folk_33_f_g.flac | горожанин | Sulafat | suspicious grumbling | Храм опять собирает на крышу. А куда прошлое делось? |
| street_folk_34_g.flac | горожанин | Achird | indignant | Вчера на рынке у меня кошель срезали. Среди бела дня! |
| street_folk_34_f_g.flac | горожанин | Sulafat | indignant | Вчера на рынке у меня кошель срезали. Среди бела дня! |
| street_folk_35_g.flac | горожанин | Achird | worried yet proud | Мой-то в ополчение записался. Храбрец нашёлся. |
| street_folk_35_f_g.flac | горожанин | Sulafat | worried yet proud | Мой-то в ополчение записался. Храбрец нашёлся. |
| street_folk_36_g.flac | горожанин | Achird | content, friendly | Хорошая погода. Только бы до праздника простояла. |
| street_folk_36_f_g.flac | горожанин | Sulafat | content, friendly | Хорошая погода. Только бы до праздника простояла. |
| street_folk_37_g.flac | горожанин | Achird | irritated | Эй, не толкайся! Места всем хватит. |
| street_folk_37_f_g.flac | горожанин | Sulafat | irritated | Эй, не толкайся! Места всем хватит. |
| street_folk_38_g.flac | горожанин | Achird | hushed, fearful | Про Грань опять шепчутся. Мол, тоньше стала. |
| street_folk_38_f_g.flac | горожанин | Sulafat | hushed, fearful | Про Грань опять шепчутся. Мол, тоньше стала. |
| street_folk_39_g.flac | горожанин | Achird | warm, a bit lonely | Пироги нынче удались. Жаль, угостить некого. |
| street_folk_39_f_g.flac | горожанин | Sulafat | warm, a bit lonely | Пироги нынче удались. Жаль, угостить некого. |
| car_meet_0_v1_g.flac | старший обоза: встреча | Charon | loud, friendly call | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_0_v1_f_g.flac | старший обоза: встреча | Kore | loud, friendly call | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_1_v1_g.flac | старший обоза: встреча | Charon | reassuring, friendly | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_1_v1_f_g.flac | старший обоза: встреча | Kore | reassuring, friendly | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_2_v1_g.flac | старший обоза: встреча | Charon | cheerful, welcoming | Доброй дороги! У нас есть чем поторговать. |
| car_meet_2_v1_f_g.flac | старший обоза: встреча | Kore | cheerful, welcoming | Доброй дороги! У нас есть чем поторговать. |
| car_meet_3_v1_g.flac | старший обоза: встреча | Charon | relaxed, inviting | Караван на привале. Подходи, пока стоим. |
| car_meet_3_v1_f_g.flac | старший обоза: встреча | Kore | relaxed, inviting | Караван на привале. Подходи, пока стоим. |
| car_meet_4_v1_g.flac | старший обоза: встреча | Charon | wary, then relieved | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_4_v1_f_g.flac | старший обоза: встреча | Kore | wary, then relieved | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_5_v1_g.flac | старший обоза: встреча | Charon | proud, persuasive | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_5_v1_f_g.flac | старший обоза: встреча | Kore | proud, persuasive | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_6_v1_g.flac | старший обоза: встреча | Charon | tired, hurried | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_6_v1_f_g.flac | старший обоза: встреча | Kore | tired, hurried | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_7_v1_g.flac | старший обоза: встреча | Charon | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_7_v1_f_g.flac | старший обоза: встреча | Kore | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_8_v1_g.flac | старший обоза: встреча | Charon | calming, commanding, then friendly | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_8_v1_f_g.flac | старший обоза: встреча | Kore | calming, commanding, then friendly | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_9_v1_g.flac | старший обоза: встреча | Charon | hopeful, friendly | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_9_v1_f_g.flac | старший обоза: встреча | Kore | hopeful, friendly | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_war_0_v1_g.flac | старший обоза: встреча на войне | Charon | tense, hushed | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_0_v1_f_g.flac | старший обоза: встреча на войне | Kore | tense, hushed | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_1_v1_g.flac | старший обоза: встреча на войне | Charon | grim, apologetic | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_1_v1_f_g.flac | старший обоза: встреча на войне | Kore | grim, apologetic | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_2_v1_g.flac | старший обоза: встреча на войне | Charon | nervous, hurried | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_2_v1_f_g.flac | старший обоза: встреча на войне | Kore | nervous, hurried | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_3_v1_g.flac | старший обоза: встреча на войне | Charon | grim, serious | На такой дороге каждая рука с оружием на счету. |
| car_meet_war_3_v1_f_g.flac | старший обоза: встреча на войне | Kore | grim, serious | На такой дороге каждая рука с оружием на счету. |
| car_meet_night_0_v1_g.flac | старший обоза: встреча ночью | Charon | alarmed, sharp | Кто там в темноте? Назовись! |
| car_meet_night_0_v1_f_g.flac | старший обоза: встреча ночью | Kore | alarmed, sharp | Кто там в темноте? Назовись! |
| car_meet_night_1_v1_g.flac | старший обоза: встреча ночью | Charon | sleepy, grudging | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_1_v1_f_g.flac | старший обоза: встреча ночью | Kore | sleepy, grudging | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_2_v1_g.flac | старший обоза: встреча ночью | Charon | wary, then welcoming | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_night_2_v1_f_g.flac | старший обоза: встреча ночью | Kore | wary, then welcoming | Поздно бродишь. Ладно, подходи к огню. |
| car_buy_0_v1_g.flac | старший обоза: продаёт | Charon | confident, sly | Твоё. Довезёшь — втрое продашь. |
| car_buy_0_v1_f_g.flac | старший обоза: продаёт | Kore | confident, sly | Твоё. Довезёшь — втрое продашь. |
| car_buy_1_v1_g.flac | старший обоза: продаёт | Charon | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_1_v1_f_g.flac | старший обоза: продаёт | Kore | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_2_v1_g.flac | старший обоза: продаёт | Charon | cheerful, brisk | Взято! Деньги в сундук, товар — тебе. |
| car_buy_2_v1_f_g.flac | старший обоза: продаёт | Kore | cheerful, brisk | Взято! Деньги в сундук, товар — тебе. |
| car_buy_3_v1_g.flac | старший обоза: продаёт | Charon | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_3_v1_f_g.flac | старший обоза: продаёт | Kore | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_4_v1_g.flac | старший обоза: продаёт | Charon | friendly, joking | По рукам. Только в дороге не растеряй. |
| car_buy_4_v1_f_g.flac | старший обоза: продаёт | Kore | friendly, joking | По рукам. Только в дороге не растеряй. |
| car_buy_5_v1_g.flac | старший обоза: продаёт | Charon | sincere, warm | Держи. Мы честные купцы, без обмана. |
| car_buy_5_v1_f_g.flac | старший обоза: продаёт | Kore | sincere, warm | Держи. Мы честные купцы, без обмана. |
| car_sell_0_v1_g.flac | старший обоза: скупает | Charon | businesslike | Беру. В городе пригодится. |
| car_sell_0_v1_f_g.flac | старший обоза: скупает | Kore | businesslike | Беру. В городе пригодится. |
| car_sell_1_v1_g.flac | старший обоза: скупает | Charon | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_1_v1_f_g.flac | старший обоза: скупает | Kore | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_2_v1_g.flac | старший обоза: скупает | Charon | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_2_v1_f_g.flac | старший обоза: скупает | Kore | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_3_v1_g.flac | старший обоза: скупает | Charon | loud, commanding, pleased | Грузите на третий воз! Беру всё. |
| car_sell_3_v1_f_g.flac | старший обоза: скупает | Kore | loud, commanding, pleased | Грузите на третий воз! Беру всё. |
| car_sell_4_v1_g.flac | старший обоза: скупает | Charon | fair, calm | Честная цена. Держи монеты. |
| car_sell_4_v1_f_g.flac | старший обоза: скупает | Kore | fair, calm | Честная цена. Держи монеты. |
| car_sell_5_v1_g.flac | старший обоза: скупает | Charon | eager | Годится. Ещё что-нибудь есть? |
| car_sell_5_v1_f_g.flac | старший обоза: скупает | Kore | eager | Годится. Ещё что-нибудь есть? |
| car_poor_0_v1_g.flac | старший обоза: золота не хватает | Charon | dry, firm | Золота не хватит. Мы в долг не возим. |
| car_poor_0_v1_f_g.flac | старший обоза: золота не хватает | Kore | dry, firm | Золота не хватит. Мы в долг не возим. |
| car_poor_1_v1_g.flac | старший обоза: золота не хватает | Charon | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_poor_1_v1_f_g.flac | старший обоза: золота не хватает | Kore | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_pass_0_v1_g.flac | старший обоза: обоз пропустили | Charon | easygoing, friendly | Ну, как знаешь. Доброй дороги! |
| car_pass_0_v1_f_g.flac | старший обоза: обоз пропустили | Kore | easygoing, friendly | Ну, как знаешь. Доброй дороги! |
| car_pass_1_v1_g.flac | старший обоза: обоз пропустили | Charon | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_1_v1_f_g.flac | старший обоза: обоз пропустили | Kore | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_2_v1_g.flac | старший обоза: обоз пропустили | Charon | warm, parting | Счастливо оставаться. Может, свидимся. |
| car_pass_2_v1_f_g.flac | старший обоза: обоз пропустили | Kore | warm, parting | Счастливо оставаться. Может, свидимся. |
| car_pass_3_v1_g.flac | старший обоза: обоз пропустили | Charon | shrugging, friendly | Ничего не нужно? Ладно, нам пора. |
| car_pass_3_v1_f_g.flac | старший обоза: обоз пропустили | Kore | shrugging, friendly | Ничего не нужно? Ладно, нам пора. |
| car_pass_4_v1_g.flac | старший обоза: обоз пропустили | Charon | loud, cheerful command | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_4_v1_f_g.flac | старший обоза: обоз пропустили | Kore | loud, cheerful command | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_5_v1_g.flac | старший обоза: обоз пропустили | Charon | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_pass_5_v1_f_g.flac | старший обоза: обоз пропустили | Kore | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_hire_0_v1_g.flac | старший обоза: нанимает в охрану | Charon | decisive, commanding | Нанят! Держись у последнего воза. |
| car_hire_0_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | decisive, commanding | Нанят! Держись у последнего воза. |
| car_hire_1_v1_g.flac | старший обоза: нанимает в охрану | Charon | appraising, businesslike | Меч при тебе? Отлично. Плата в городе. |
| car_hire_1_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | appraising, businesslike | Меч при тебе? Отлично. Плата в городе. |
| car_hire_2_v1_g.flac | старший обоза: нанимает в охрану | Charon | relieved, welcoming | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_2_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | relieved, welcoming | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_3_v1_g.flac | старший обоза: нанимает в охрану | Charon | businesslike, fair | Договорились. Довезём груз — получишь сполна. |
| car_hire_3_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | businesslike, fair | Договорились. Довезём груз — получишь сполна. |
| car_hire_4_v1_g.flac | старший обоза: нанимает в охрану | Charon | serious, warning | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_4_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | serious, warning | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_5_v1_g.flac | старший обоза: нанимает в охрану | Charon | friendly, reassuring | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_5_v1_f_g.flac | старший обоза: нанимает в охрану | Kore | friendly, reassuring | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_busy_0_v1_g.flac | старший обоза: уже при обозе | Charon | dry, reasonable | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_0_v1_f_g.flac | старший обоза: уже при обозе | Kore | dry, reasonable | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_1_v1_g.flac | старший обоза: уже при обозе | Charon | firm, friendly | Ты другой обоз ведёшь. Сперва доведи его. |
| car_hire_busy_1_v1_f_g.flac | старший обоза: уже при обозе | Kore | firm, friendly | Ты другой обоз ведёшь. Сперва доведи его. |
| car_news_0_v1_g.flac | старший обоза: новости | Charon | conversational, confiding | Слушай, что на дорогах делается. |
| car_news_0_v1_f_g.flac | старший обоза: новости | Kore | conversational, confiding | Слушай, что на дорогах делается. |
| car_news_1_v1_g.flac | старший обоза: новости | Charon | friendly, storyteller | Расскажу, что знаю. Мы много где бываем. |
| car_news_1_v1_f_g.flac | старший обоза: новости | Kore | friendly, storyteller | Расскажу, что знаю. Мы много где бываем. |
| car_news_2_v1_g.flac | старший обоза: новости | Charon | amused, chatty | Новости? Их у нас больше, чем товара. |
| car_news_2_v1_f_g.flac | старший обоза: новости | Kore | amused, chatty | Новости? Их у нас больше, чем товара. |
| car_arrive_0_v1_g.flac | старший обоза: дошли, плата | Charon | relieved, grateful | Дошли! Держи плату, заслужено. |
| car_arrive_0_v1_f_g.flac | старший обоза: дошли, плата | Kore | relieved, grateful | Дошли! Держи плату, заслужено. |
| car_arrive_1_v1_g.flac | старший обоза: дошли, плата | Charon | sincere, grateful | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_1_v1_f_g.flac | старший обоза: дошли, плата | Kore | sincere, grateful | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_2_v1_g.flac | старший обоза: дошли, плата | Charon | satisfied, friendly | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_2_v1_f_g.flac | старший обоза: дошли, плата | Kore | satisfied, friendly | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_3_v1_g.flac | старший обоза: дошли, плата | Charon | relieved, satisfied | Живы, груз цел. Честно заработано. |
| car_arrive_3_v1_f_g.flac | старший обоза: дошли, плата | Kore | relieved, satisfied | Живы, груз цел. Честно заработано. |
| greet_torg_0_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_0_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_1_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_1_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_2_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_2_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_3_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_3_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_4_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_4_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_5_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_5_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_6_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_6_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_7_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_7_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_8_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_8_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_9_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_9_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_10_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_10_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_11_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_torg_11_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_kuznya_0_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_0_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_1_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_1_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_2_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_2_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_3_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_3_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_4_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_4_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_5_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_5_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_6_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_6_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_7_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_kuznya_7_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_traktir_0_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_0_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_1_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_1_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_2_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_2_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_3_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_3_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_4_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_4_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_5_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_5_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_6_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_6_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_7_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_traktir_7_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_strazha_0_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_0_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_1_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_1_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_2_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_2_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_3_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_3_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_4_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_4_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_5_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_5_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_6_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_6_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_7_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_7_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_8_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_strazha_8_v1_f_g.flac | приветствие: страж у дела | Leda | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_lekar_0_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_0_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_1_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_1_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_2_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_2_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_3_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_3_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_4_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_4_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_5_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_5_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_6_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_6_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_7_v1_g.flac | приветствие: лекарь | Sadachbia | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_lekar_7_v1_f_g.flac | приветствие: лекарь | Leda | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_zhrec_0_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_0_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_1_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_1_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_2_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_2_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_3_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_3_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_4_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_4_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_5_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_5_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_6_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_6_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_7_v1_g.flac | приветствие: жрец | Sadachbia | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_zhrec_7_v1_f_g.flac | приветствие: жрец | Leda | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_znanie_0_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_0_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_1_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_1_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_2_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_2_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_3_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_3_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_4_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_4_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_5_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_5_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_6_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_6_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_7_v1_g.flac | приветствие: учёный | Sadachbia | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_znanie_7_v1_f_g.flac | приветствие: учёный | Leda | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_glub_0_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_0_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_1_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_1_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_2_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_2_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_3_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_3_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_4_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_4_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_5_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_5_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_6_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_6_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_7_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_7_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_8_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_8_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_9_v1_g.flac | приветствие: торговец глубин | Sadachbia | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_glub_9_v1_f_g.flac | приветствие: торговец глубин | Leda | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_tma_0_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_0_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_1_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_1_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_2_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_2_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_3_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_3_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_4_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Спросишь лишнее — забуду, что видел тебя. |
| greet_tma_4_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Спросишь лишнее — забуду, что видела тебя. |
| greet_tma_5_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_5_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_6_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_6_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_7_v1_g.flac | приветствие: житель тёмных земель | Sadachbia | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_tma_7_v1_f_g.flac | приветствие: житель тёмных земель | Leda | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_obshiy_0_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Доброго дня. |
| greet_obshiy_0_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Доброго дня. |
| greet_obshiy_1_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_1_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_2_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_2_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_3_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_3_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_4_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_4_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_5_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_5_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_6_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_6_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_7_v1_g.flac | приветствие: всякий житель | Sadachbia | plain, friendly, natural | Проходи, раз пришёл. |
| greet_obshiy_7_v1_f_g.flac | приветствие: всякий житель | Leda | plain, friendly, natural | Проходи, раз пришёл. |
| greet_svoy_0_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | Рад тебя видеть, друг. |
| greet_svoy_0_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | Рада тебя видеть, друг. |
| greet_svoy_1_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_1_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_2_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_2_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_3_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_3_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_4_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_4_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_5_v1_g.flac | приветствие: старый знакомый | Sadachbia | joyful, warm, glad to see a friend | Для тебя отложил кое-что. Смотри. |
| greet_svoy_5_v1_f_g.flac | приветствие: старый знакомый | Leda | joyful, warm, glad to see a friend | Для тебя отложила кое-что. Смотри. |
| greet_holod_0_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Чего тебе? |
| greet_holod_0_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Чего тебе? |
| greet_holod_1_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_1_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_2_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Говори и уходи. |
| greet_holod_2_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Говори и уходи. |
| greet_holod_3_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_3_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_4_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_4_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_5_v1_g.flac | приветствие: холодный | Sadachbia | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_holod_5_v1_f_g.flac | приветствие: холодный | Leda | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_vrazhda_0_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_0_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_1_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_1_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_2_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_2_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_3_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_3_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_4_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_4_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_5_v1_g.flac | приветствие: недруг | Sadachbia | hostile, menacing, tense | Руки держи на виду. |
| greet_vrazhda_5_v1_f_g.flac | приветствие: недруг | Leda | hostile, menacing, tense | Руки держи на виду. |
| greet_snova_0_v1_g.flac | приветствие: при новой встрече | Sadachbia | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_0_v1_f_g.flac | приветствие: при новой встрече | Leda | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_1_v1_g.flac | приветствие: при новой встрече | Sadachbia | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_1_v1_f_g.flac | приветствие: при новой встрече | Leda | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_2_v1_g.flac | приветствие: при новой встрече | Sadachbia | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_2_v1_f_g.flac | приветствие: при новой встрече | Leda | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_3_v1_g.flac | приветствие: при новой встрече | Sadachbia | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_3_v1_f_g.flac | приветствие: при новой встрече | Leda | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_4_v1_g.flac | приветствие: при новой встрече | Sadachbia | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_snova_4_v1_f_g.flac | приветствие: при новой встрече | Leda | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_dobro_0_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_0_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_1_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_1_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_2_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_2_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_3_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_3_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_4_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_4_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_5_v1_g.flac | приветствие: помнит добро | Sadachbia | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_dobro_5_v1_f_g.flac | приветствие: помнит добро | Leda | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_zlo_0_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_0_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_1_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_1_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_2_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_2_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_3_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_3_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_4_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_4_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_5_v1_g.flac | приветствие: помнит обиду | Sadachbia | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_zlo_5_v1_f_g.flac | приветствие: помнит обиду | Leda | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_utro_0_v1_g.flac | приветствие: утром | Sadachbia | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_0_v1_f_g.flac | приветствие: утром | Leda | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_1_v1_g.flac | приветствие: утром | Sadachbia | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_1_v1_f_g.flac | приветствие: утром | Leda | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_2_v1_g.flac | приветствие: утром | Sadachbia | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_2_v1_f_g.flac | приветствие: утром | Leda | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_3_v1_g.flac | приветствие: утром | Sadachbia | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_utro_3_v1_f_g.flac | приветствие: утром | Leda | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_vecher_0_v1_g.flac | приветствие: вечером | Sadachbia | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_0_v1_f_g.flac | приветствие: вечером | Leda | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_1_v1_g.flac | приветствие: вечером | Sadachbia | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_1_v1_f_g.flac | приветствие: вечером | Leda | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_2_v1_g.flac | приветствие: вечером | Sadachbia | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_2_v1_f_g.flac | приветствие: вечером | Leda | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_3_v1_g.flac | приветствие: вечером | Sadachbia | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_vecher_3_v1_f_g.flac | приветствие: вечером | Leda | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_noch_0_v1_g.flac | приветствие: ночью | Sadachbia | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_0_v1_f_g.flac | приветствие: ночью | Leda | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_1_v1_g.flac | приветствие: ночью | Sadachbia | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_1_v1_f_g.flac | приветствие: ночью | Leda | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_2_v1_g.flac | приветствие: ночью | Sadachbia | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_2_v1_f_g.flac | приветствие: ночью | Leda | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_3_v1_g.flac | приветствие: ночью | Sadachbia | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| greet_noch_3_v1_f_g.flac | приветствие: ночью | Leda | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| dlg_0_0_v1_g.flac | ответ в разговоре | Sadachbia | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_0_v1_f_g.flac | ответ в разговоре | Leda | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_1_v1_g.flac | ответ в разговоре | Sadachbia | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_1_v1_f_g.flac | ответ в разговоре | Leda | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_2_v1_g.flac | ответ в разговоре | Sadachbia | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_2_v1_f_g.flac | ответ в разговоре | Leda | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_3_v1_g.flac | ответ в разговоре | Sadachbia | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_3_v1_f_g.flac | ответ в разговоре | Leda | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_4_v1_g.flac | ответ в разговоре (трус) | Sadachbia | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_4_v1_f_g.flac | ответ в разговоре (трус) | Leda | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_5_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_5_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_6_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_6_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_7_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_7_v1_f_g.flac | ответ в разговоре (жадный) | Leda | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_8_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_8_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_9_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_9_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_10_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_10_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_12_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_12_v1_f_g.flac | ответ в разговоре (недруг) | Leda | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_13_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_13_v1_f_g.flac | ответ в разговоре (холоден) | Leda | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_14_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_14_v1_f_g.flac | ответ в разговоре (холоден) | Leda | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_15_v1_g.flac | ответ в разговоре (свой) | Sadachbia | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_15_v1_f_g.flac | ответ в разговоре (свой) | Leda | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_16_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_16_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_17_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_0_17_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_1_0_v1_g.flac | ответ в разговоре | Sadachbia | shrugging, dismissive | Мало ли что болтают |
| dlg_1_0_v1_f_g.flac | ответ в разговоре | Leda | shrugging, dismissive | Мало ли что болтают |
| dlg_1_1_v1_g.flac | ответ в разговоре | Sadachbia | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_1_v1_f_g.flac | ответ в разговоре | Leda | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_2_v1_g.flac | ответ в разговоре | Sadachbia | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_2_v1_f_g.flac | ответ в разговоре | Leda | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_3_v1_g.flac | ответ в разговоре | Sadachbia | shrugging, dismissive | Не слышал. А и слышал бы — не повторил |
| dlg_1_3_v1_f_g.flac | ответ в разговоре | Leda | shrugging, dismissive | Не слышала. А и слышала бы — не повторила |
| dlg_1_4_v1_g.flac | ответ в разговоре (честный) | Sadachbia | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_4_v1_f_g.flac | ответ в разговоре (честный) | Leda | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_5_v1_g.flac | ответ в разговоре (трус) | Sadachbia | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_5_v1_f_g.flac | ответ в разговоре (трус) | Leda | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_6_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_6_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_7_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_7_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_9_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_9_v1_f_g.flac | ответ в разговоре (холоден) | Leda | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_10_v1_g.flac | ответ в разговоре (свой) | Sadachbia | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_10_v1_f_g.flac | ответ в разговоре (свой) | Leda | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_11_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_1_11_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_2_0_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_0_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_1_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_1_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_2_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_2_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_3_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_3_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_4_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_4_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_6_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_6_v1_f_g.flac | ответ в разговоре (добрый) | Leda | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_7_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_7_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_8_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_8_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_9_v1_g.flac | ответ в разговоре (реформатор) | Sadachbia | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_9_v1_f_g.flac | ответ в разговоре (реформатор) | Leda | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_10_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | thoughtful, agreeing, greedy, calculating | Согласен, если мне с этого не убыток |
| dlg_2_10_v1_f_g.flac | ответ в разговоре (жадный) | Leda | thoughtful, agreeing, greedy, calculating | Согласна, если мне с этого не убыток |
| dlg_2_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_12_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_12_v1_f_g.flac | ответ в разговоре (холоден) | Leda | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_13_v1_g.flac | ответ в разговоре (свой) | Sadachbia | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_13_v1_f_g.flac | ответ в разговоре (свой) | Leda | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_14_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_14_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_15_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_2_15_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_3_0_v1_g.flac | ответ в разговоре | Sadachbia | firm refusal | Нет. И не уговаривайте |
| dlg_3_0_v1_f_g.flac | ответ в разговоре | Leda | firm refusal | Нет. И не уговаривайте |
| dlg_3_1_v1_g.flac | ответ в разговоре | Sadachbia | firm refusal | Сказал нет — значит нет |
| dlg_3_1_v1_f_g.flac | ответ в разговоре | Leda | firm refusal | Сказала нет — значит нет |
| dlg_3_2_v1_g.flac | ответ в разговоре | Sadachbia | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_2_v1_f_g.flac | ответ в разговоре | Leda | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_3_v1_g.flac | ответ в разговоре | Sadachbia | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_3_v1_f_g.flac | ответ в разговоре | Leda | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_4_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_4_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_5_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_5_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_6_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_6_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_7_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | firm refusal, haughty | Не вам мне указывать |
| dlg_3_7_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | firm refusal, haughty | Не вам мне указывать |
| dlg_3_8_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_8_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_9_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_9_v1_f_g.flac | ответ в разговоре (добрый) | Leda | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_10_v1_g.flac | ответ в разговоре (мятежник) | Sadachbia | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_10_v1_f_g.flac | ответ в разговоре (мятежник) | Leda | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | firm refusal, hostile | С вами? Никогда |
| dlg_3_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | firm refusal, hostile | С вами? Никогда |
| dlg_3_12_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_12_v1_f_g.flac | ответ в разговоре (холоден) | Leda | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_13_v1_g.flac | ответ в разговоре (свой) | Sadachbia | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_13_v1_f_g.flac | ответ в разговоре (свой) | Leda | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_14_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_14_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_15_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_3_15_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_4_0_v1_g.flac | ответ в разговоре | Sadachbia | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_0_v1_f_g.flac | ответ в разговоре | Leda | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_1_v1_g.flac | ответ в разговоре | Sadachbia | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_1_v1_f_g.flac | ответ в разговоре | Leda | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_2_v1_g.flac | ответ в разговоре | Sadachbia | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_2_v1_f_g.flac | ответ в разговоре | Leda | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_3_v1_g.flac | ответ в разговоре | Sadachbia | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_3_v1_f_g.flac | ответ в разговоре | Leda | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_4_v1_g.flac | ответ в разговоре (сострадательный) | Sadachbia | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_4_v1_f_g.flac | ответ в разговоре (сострадательный) | Leda | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_5_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_5_v1_f_g.flac | ответ в разговоре (добрый) | Leda | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_6_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_6_v1_f_g.flac | ответ в разговоре (жадный) | Leda | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_7_v1_g.flac | ответ в разговоре (прагматик) | Sadachbia | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_7_v1_f_g.flac | ответ в разговоре (прагматик) | Leda | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_8_v1_g.flac | ответ в разговоре (трус) | Sadachbia | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_8_v1_f_g.flac | ответ в разговоре (трус) | Leda | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_9_v1_g.flac | ответ в разговоре (свой) | Sadachbia | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_9_v1_f_g.flac | ответ в разговоре (свой) | Leda | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_10_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_10_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_11_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_11_v1_f_g.flac | ответ в разговоре (холоден) | Leda | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_12_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_12_v1_f_g.flac | ответ в разговоре (недруг) | Leda | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_13_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_4_13_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_5_0_v1_g.flac | ответ в разговоре | Sadachbia | helpless, sad | Мне бы кто помог |
| dlg_5_0_v1_f_g.flac | ответ в разговоре | Leda | helpless, sad | Мне бы кто помог |
| dlg_5_1_v1_g.flac | ответ в разговоре | Sadachbia | helpless, sad | Самому бы кто подсобил |
| dlg_5_1_v1_f_g.flac | ответ в разговоре | Leda | helpless, sad | Самой бы кто подсобил |
| dlg_5_2_v1_g.flac | ответ в разговоре | Sadachbia | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_2_v1_f_g.flac | ответ в разговоре | Leda | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_3_v1_g.flac | ответ в разговоре | Sadachbia | helpless, sad | Не просите, не выйдет |
| dlg_5_3_v1_f_g.flac | ответ в разговоре | Leda | helpless, sad | Не просите, не выйдет |
| dlg_5_4_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_4_v1_f_g.flac | ответ в разговоре (жадный) | Leda | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_5_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_5_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_6_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_6_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_7_v1_g.flac | ответ в разговоре (сострадательный) | Sadachbia | helpless, sad, compassionate, gentle | Рад бы, правда, но сейчас никак |
| dlg_5_7_v1_f_g.flac | ответ в разговоре (сострадательный) | Leda | helpless, sad, compassionate, gentle | Рада бы, правда, но сейчас никак |
| dlg_5_8_v1_g.flac | ответ в разговоре (трус) | Sadachbia | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_8_v1_f_g.flac | ответ в разговоре (трус) | Leda | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_9_v1_g.flac | ответ в разговоре (свой) | Sadachbia | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_9_v1_f_g.flac | ответ в разговоре (свой) | Leda | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_10_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_10_v1_f_g.flac | ответ в разговоре (недруг) | Leda | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_11_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_11_v1_f_g.flac | ответ в разговоре (холоден) | Leda | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_12_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_5_12_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_6_0_v1_g.flac | ответ в разговоре | Sadachbia | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_0_v1_f_g.flac | ответ в разговоре | Leda | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_1_v1_g.flac | ответ в разговоре | Sadachbia | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_1_v1_f_g.flac | ответ в разговоре | Leda | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_2_v1_g.flac | ответ в разговоре | Sadachbia | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_2_v1_f_g.flac | ответ в разговоре | Leda | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_3_v1_g.flac | ответ в разговоре | Sadachbia | serious, trusting | Договорились. Время покажет |
| dlg_6_3_v1_f_g.flac | ответ в разговоре | Leda | serious, trusting | Договорились. Время покажет |
| dlg_6_4_v1_g.flac | ответ в разговоре (честный) | Sadachbia | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_4_v1_f_g.flac | ответ в разговоре (честный) | Leda | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_5_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_5_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_6_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_6_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_7_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_7_v1_f_g.flac | ответ в разговоре (добрый) | Leda | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_9_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_9_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_10_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_10_v1_f_g.flac | ответ в разговоре (холоден) | Leda | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_6_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_7_0_v1_g.flac | ответ в разговоре | Sadachbia | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_0_v1_f_g.flac | ответ в разговоре | Leda | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_1_v1_g.flac | ответ в разговоре | Sadachbia | skeptical, wry | Слова ничего не стоят |
| dlg_7_1_v1_f_g.flac | ответ в разговоре | Leda | skeptical, wry | Слова ничего не стоят |
| dlg_7_2_v1_g.flac | ответ в разговоре | Sadachbia | skeptical, wry | Много вас тут обещало |
| dlg_7_2_v1_f_g.flac | ответ в разговоре | Leda | skeptical, wry | Много вас тут обещало |
| dlg_7_3_v1_g.flac | ответ в разговоре | Sadachbia | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_3_v1_f_g.flac | ответ в разговоре | Leda | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_4_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_4_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_5_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_5_v1_f_g.flac | ответ в разговоре (жадный) | Leda | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_6_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_6_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_7_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_7_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_9_v1_g.flac | ответ в разговоре (свой) | Sadachbia | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_7_9_v1_f_g.flac | ответ в разговоре (свой) | Leda | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_8_0_v1_g.flac | ответ в разговоре | Sadachbia | surprised, conceding | Не думал об этом так |
| dlg_8_0_v1_f_g.flac | ответ в разговоре | Leda | surprised, conceding | Не думала об этом так |
| dlg_8_1_v1_g.flac | ответ в разговоре | Sadachbia | surprised, conceding | А ведь вы правы |
| dlg_8_1_v1_f_g.flac | ответ в разговоре | Leda | surprised, conceding | А ведь вы правы |
| dlg_8_2_v1_g.flac | ответ в разговоре | Sadachbia | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_2_v1_f_g.flac | ответ в разговоре | Leda | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_3_v1_g.flac | ответ в разговоре | Sadachbia | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_3_v1_f_g.flac | ответ в разговоре | Leda | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_4_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_4_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_6_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_6_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_7_v1_g.flac | ответ в разговоре (мятежник) | Sadachbia | surprised, conceding, rebellious | Вот! Я всегда чувствовал, что всё не так, как нам говорят |
| dlg_8_7_v1_f_g.flac | ответ в разговоре (мятежник) | Leda | surprised, conceding, rebellious | Вот! Я всегда чувствовала, что всё не так, как нам говорят |
| dlg_8_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_9_v1_g.flac | ответ в разговоре (свой) | Sadachbia | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_9_v1_f_g.flac | ответ в разговоре (свой) | Leda | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_10_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_8_10_v1_f_g.flac | ответ в разговоре (холоден) | Leda | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_9_0_v1_g.flac | ответ в разговоре | Sadachbia | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_0_v1_f_g.flac | ответ в разговоре | Leda | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_1_v1_g.flac | ответ в разговоре | Sadachbia | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_1_v1_f_g.flac | ответ в разговоре | Leda | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_2_v1_g.flac | ответ в разговоре | Sadachbia | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_2_v1_f_g.flac | ответ в разговоре | Leda | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_3_v1_g.flac | ответ в разговоре | Sadachbia | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_3_v1_f_g.flac | ответ в разговоре | Leda | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_4_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_4_v1_f_g.flac | ответ в разговоре (жадный) | Leda | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_5_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_5_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_6_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_6_v1_f_g.flac | ответ в разговоре (добрый) | Leda | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_7_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласен |
| dlg_9_7_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласна |
| dlg_9_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_9_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_9_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_10_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_10_v1_f_g.flac | ответ в разговоре (холоден) | Leda | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_9_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_10_0_v1_g.flac | ответ в разговоре | Sadachbia | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_0_v1_f_g.flac | ответ в разговоре | Leda | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_1_v1_g.flac | ответ в разговоре | Sadachbia | firm, businesslike | Ниже не опущу |
| dlg_10_1_v1_f_g.flac | ответ в разговоре | Leda | firm, businesslike | Ниже не опущу |
| dlg_10_2_v1_g.flac | ответ в разговоре | Sadachbia | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_2_v1_f_g.flac | ответ в разговоре | Leda | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_3_v1_g.flac | ответ в разговоре | Sadachbia | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_3_v1_f_g.flac | ответ в разговоре | Leda | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_4_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_4_v1_f_g.flac | ответ в разговоре (жадный) | Leda | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_6_v1_g.flac | ответ в разговоре (честный) | Sadachbia | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_6_v1_f_g.flac | ответ в разговоре (честный) | Leda | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_7_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_7_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_9_v1_g.flac | ответ в разговоре (свой) | Sadachbia | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_9_v1_f_g.flac | ответ в разговоре (свой) | Leda | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_10_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_10_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_11_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | firm, businesslike, cold, curt | Цена сказана |
| dlg_10_11_v1_f_g.flac | ответ в разговоре (холоден) | Leda | firm, businesslike, cold, curt | Цена сказана |
| dlg_11_0_v1_g.flac | ответ в разговоре | Sadachbia | conspiratorial, low voice | Я вас не видел |
| dlg_11_0_v1_f_g.flac | ответ в разговоре | Leda | conspiratorial, low voice | Я вас не видела |
| dlg_11_1_v1_g.flac | ответ в разговоре | Sadachbia | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_1_v1_f_g.flac | ответ в разговоре | Leda | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_2_v1_g.flac | ответ в разговоре | Sadachbia | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_2_v1_f_g.flac | ответ в разговоре | Leda | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_3_v1_g.flac | ответ в разговоре | Sadachbia | conspiratorial, low voice | Я глух, слеп и очень занят |
| dlg_11_3_v1_f_g.flac | ответ в разговоре | Leda | conspiratorial, low voice | Я глуха, слепа и очень занята |
| dlg_11_4_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_4_v1_f_g.flac | ответ в разговоре (жадный) | Leda | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_5_v1_g.flac | ответ в разговоре (трус) | Sadachbia | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_5_v1_f_g.flac | ответ в разговоре (трус) | Leda | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_6_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_6_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_7_v1_g.flac | ответ в разговоре (свой) | Sadachbia | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_7_v1_f_g.flac | ответ в разговоре (свой) | Leda | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_8_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_8_v1_f_g.flac | ответ в разговоре (холоден) | Leda | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_9_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_11_9_v1_f_g.flac | ответ в разговоре (недруг) | Leda | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_12_0_v1_g.flac | ответ в разговоре | Sadachbia | offended, indignant | За кого вы меня держите? |
| dlg_12_0_v1_f_g.flac | ответ в разговоре | Leda | offended, indignant | За кого вы меня держите? |
| dlg_12_1_v1_g.flac | ответ в разговоре | Sadachbia | offended, indignant | Уберите это, пока я не позвал стражу |
| dlg_12_1_v1_f_g.flac | ответ в разговоре | Leda | offended, indignant | Уберите это, пока я не позвала стражу |
| dlg_12_2_v1_g.flac | ответ в разговоре | Sadachbia | offended, indignant | Меня не купишь |
| dlg_12_2_v1_f_g.flac | ответ в разговоре | Leda | offended, indignant | Меня не купишь |
| dlg_12_3_v1_g.flac | ответ в разговоре | Sadachbia | offended, indignant | Деньги держите при себе |
| dlg_12_3_v1_f_g.flac | ответ в разговоре | Leda | offended, indignant | Деньги держите при себе |
| dlg_12_4_v1_g.flac | ответ в разговоре (честный) | Sadachbia | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_4_v1_f_g.flac | ответ в разговоре (честный) | Leda | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_6_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_6_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_7_v1_g.flac | ответ в разговоре (трус) | Sadachbia | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_7_v1_f_g.flac | ответ в разговоре (трус) | Leda | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_9_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_9_v1_f_g.flac | ответ в разговоре (недруг) | Leda | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_10_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_12_10_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_13_0_v1_g.flac | ответ в разговоре | Sadachbia | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_0_v1_f_g.flac | ответ в разговоре | Leda | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_1_v1_g.flac | ответ в разговоре | Sadachbia | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_1_v1_f_g.flac | ответ в разговоре | Leda | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_2_v1_g.flac | ответ в разговоре | Sadachbia | correcting, slightly condescending | У нас так не говорят |
| dlg_13_2_v1_f_g.flac | ответ в разговоре | Leda | correcting, slightly condescending | У нас так не говорят |
| dlg_13_3_v1_g.flac | ответ в разговоре | Sadachbia | correcting, slightly condescending | Близко, но нет |
| dlg_13_3_v1_f_g.flac | ответ в разговоре | Leda | correcting, slightly condescending | Близко, но нет |
| dlg_13_4_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_4_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_5_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_5_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_6_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_6_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_7_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_7_v1_f_g.flac | ответ в разговоре (холоден) | Leda | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_13_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_14_0_v1_g.flac | ответ в разговоре | Sadachbia | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_0_v1_f_g.flac | ответ в разговоре | Leda | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_1_v1_g.flac | ответ в разговоре | Sadachbia | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_1_v1_f_g.flac | ответ в разговоре | Leda | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_2_v1_g.flac | ответ в разговоре | Sadachbia | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_2_v1_f_g.flac | ответ в разговоре | Leda | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_3_v1_g.flac | ответ в разговоре | Sadachbia | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_3_v1_f_g.flac | ответ в разговоре | Leda | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_4_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_4_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_5_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_5_v1_f_g.flac | ответ в разговоре (добрый) | Leda | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_6_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | pleasantly surprised, warm, haughty | Не ожидал от чужака |
| dlg_14_6_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | pleasantly surprised, warm, haughty | Не ожидала от чужака |
| dlg_14_7_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_7_v1_f_g.flac | ответ в разговоре (недруг) | Leda | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_9_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_14_9_v1_f_g.flac | ответ в разговоре (холоден) | Leda | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_15_0_v1_g.flac | ответ в разговоре | Sadachbia | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_0_v1_f_g.flac | ответ в разговоре | Leda | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_1_v1_g.flac | ответ в разговоре | Sadachbia | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_1_v1_f_g.flac | ответ в разговоре | Leda | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_2_v1_g.flac | ответ в разговоре | Sadachbia | suspicious, slow | А дальше? Где остальное? |
| dlg_15_2_v1_f_g.flac | ответ в разговоре | Leda | suspicious, slow | А дальше? Где остальное? |
| dlg_15_3_v1_g.flac | ответ в разговоре | Sadachbia | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_3_v1_f_g.flac | ответ в разговоре | Leda | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_4_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | suspicious, slow, suspicious | Я так и знал, что вы темните |
| dlg_15_4_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | suspicious, slow, suspicious | Я так и знала, что вы темните |
| dlg_15_5_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_5_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_6_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_6_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_7_v1_g.flac | ответ в разговоре (свой) | Sadachbia | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_7_v1_f_g.flac | ответ в разговоре (свой) | Leda | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_9_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_15_9_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_16_0_v1_g.flac | ответ в разговоре | Sadachbia | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_0_v1_f_g.flac | ответ в разговоре | Leda | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_1_v1_g.flac | ответ в разговоре | Sadachbia | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_1_v1_f_g.flac | ответ в разговоре | Leda | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_2_v1_g.flac | ответ в разговоре | Sadachbia | contemptuous, cold | Не держите меня за дурака |
| dlg_16_2_v1_f_g.flac | ответ в разговоре | Leda | contemptuous, cold | Не держите меня за дурака |
| dlg_16_3_v1_g.flac | ответ в разговоре | Sadachbia | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_3_v1_f_g.flac | ответ в разговоре | Leda | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_4_v1_g.flac | ответ в разговоре (честный) | Sadachbia | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_4_v1_f_g.flac | ответ в разговоре (честный) | Leda | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_5_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_5_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_6_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_6_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_7_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | contemptuous, cold, suspicious | Я с первого слова знал, что врёте |
| dlg_16_7_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | contemptuous, cold, suspicious | Я с первого слова знала, что врёте |
| dlg_16_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_9_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_9_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_10_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_16_10_v1_f_g.flac | ответ в разговоре (недруг) | Leda | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_17_0_v1_g.flac | ответ в разговоре | Sadachbia | frightened, pleading | Только не надо... я скажу |
| dlg_17_0_v1_f_g.flac | ответ в разговоре | Leda | frightened, pleading | Только не надо... я скажу |
| dlg_17_1_v1_g.flac | ответ в разговоре | Sadachbia | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_1_v1_f_g.flac | ответ в разговоре | Leda | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_2_v1_g.flac | ответ в разговоре | Sadachbia | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_2_v1_f_g.flac | ответ в разговоре | Leda | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_3_v1_g.flac | ответ в разговоре | Sadachbia | frightened, pleading | Спокойно… договоримся |
| dlg_17_3_v1_f_g.flac | ответ в разговоре | Leda | frightened, pleading | Спокойно… договоримся |
| dlg_17_4_v1_g.flac | ответ в разговоре (трус) | Sadachbia | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_4_v1_f_g.flac | ответ в разговоре (трус) | Leda | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_6_v1_g.flac | ответ в разговоре (смелый) | Sadachbia | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_6_v1_f_g.flac | ответ в разговоре (смелый) | Leda | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_7_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_7_v1_f_g.flac | ответ в разговоре (недруг) | Leda | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_8_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_17_8_v1_f_g.flac | ответ в разговоре (холоден) | Leda | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_18_0_v1_g.flac | ответ в разговоре | Sadachbia | defiant, threatening | Убери железо, пока цел |
| dlg_18_0_v1_f_g.flac | ответ в разговоре | Leda | defiant, threatening | Убери железо, пока цел |
| dlg_18_1_v1_g.flac | ответ в разговоре | Sadachbia | defiant, threatening | Не на того напал |
| dlg_18_1_v1_f_g.flac | ответ в разговоре | Leda | defiant, threatening | Не на того напал |
| dlg_18_2_v1_g.flac | ответ в разговоре | Sadachbia | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_2_v1_f_g.flac | ответ в разговоре | Leda | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_3_v1_g.flac | ответ в разговоре | Sadachbia | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_3_v1_f_g.flac | ответ в разговоре | Leda | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_4_v1_g.flac | ответ в разговоре (смелый) | Sadachbia | defiant, threatening, bold, confident | Я и не таких видал. Стража! |
| dlg_18_4_v1_f_g.flac | ответ в разговоре (смелый) | Leda | defiant, threatening, bold, confident | Я и не таких видала. Стража! |
| dlg_18_5_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_5_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_6_v1_g.flac | ответ в разговоре (честный) | Sadachbia | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_6_v1_f_g.flac | ответ в разговоре (честный) | Leda | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_7_v1_g.flac | ответ в разговоре (свой) | Sadachbia | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_7_v1_f_g.flac | ответ в разговоре (свой) | Leda | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_8_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_18_8_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_19_0_v1_g.flac | ответ в разговоре | Sadachbia | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_0_v1_f_g.flac | ответ в разговоре | Leda | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_1_v1_g.flac | ответ в разговоре | Sadachbia | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_1_v1_f_g.flac | ответ в разговоре | Leda | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_2_v1_g.flac | ответ в разговоре | Sadachbia | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_2_v1_f_g.flac | ответ в разговоре | Leda | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_3_v1_g.flac | ответ в разговоре | Sadachbia | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_3_v1_f_g.flac | ответ в разговоре | Leda | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_4_v1_g.flac | ответ в разговоре (трус) | Sadachbia | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_4_v1_f_g.flac | ответ в разговоре (трус) | Leda | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_5_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_5_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_6_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_6_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_7_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_19_7_v1_f_g.flac | ответ в разговоре (недруг) | Leda | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_20_0_v1_g.flac | ответ в разговоре | Sadachbia | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_0_v1_f_g.flac | ответ в разговоре | Leda | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_1_v1_g.flac | ответ в разговоре | Sadachbia | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_1_v1_f_g.flac | ответ в разговоре | Leda | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_2_v1_g.flac | ответ в разговоре | Sadachbia | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_2_v1_f_g.flac | ответ в разговоре | Leda | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_3_v1_g.flac | ответ в разговоре | Sadachbia | defiant, bitter | Ищите кого попугливее |
| dlg_20_3_v1_f_g.flac | ответ в разговоре | Leda | defiant, bitter | Ищите кого попугливее |
| dlg_20_4_v1_g.flac | ответ в разговоре (смелый) | Sadachbia | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_4_v1_f_g.flac | ответ в разговоре (смелый) | Leda | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_5_v1_g.flac | ответ в разговоре (честный) | Sadachbia | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_5_v1_f_g.flac | ответ в разговоре (честный) | Leda | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_6_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_6_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_7_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_20_7_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_21_0_v1_g.flac | ответ в разговоре | Sadachbia | angry, threatening | Ещё слово — и будет драка |
| dlg_21_0_v1_f_g.flac | ответ в разговоре | Leda | angry, threatening | Ещё слово — и будет драка |
| dlg_21_1_v1_g.flac | ответ в разговоре | Sadachbia | angry, threatening | Не зли меня |
| dlg_21_1_v1_f_g.flac | ответ в разговоре | Leda | angry, threatening | Не зли меня |
| dlg_21_2_v1_g.flac | ответ в разговоре | Sadachbia | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_2_v1_f_g.flac | ответ в разговоре | Leda | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_3_v1_g.flac | ответ в разговоре | Sadachbia | angry, threatening | Иди своей дорогой |
| dlg_21_3_v1_f_g.flac | ответ в разговоре | Leda | angry, threatening | Иди своей дорогой |
| dlg_21_4_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_4_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_5_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_5_v1_f_g.flac | ответ в разговоре (добрый) | Leda | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_6_v1_g.flac | ответ в разговоре (свой) | Sadachbia | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_6_v1_f_g.flac | ответ в разговоре (свой) | Leda | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_7_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_21_7_v1_f_g.flac | ответ в разговоре (недруг) | Leda | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_22_0_v1_g.flac | ответ в разговоре | Sadachbia | easygoing, indifferent | Бывает |
| dlg_22_0_v1_f_g.flac | ответ в разговоре | Leda | easygoing, indifferent | Бывает |
| dlg_22_1_v1_g.flac | ответ в разговоре | Sadachbia | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_1_v1_f_g.flac | ответ в разговоре | Leda | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_2_v1_g.flac | ответ в разговоре | Sadachbia | easygoing, indifferent | Ваше право |
| dlg_22_2_v1_f_g.flac | ответ в разговоре | Leda | easygoing, indifferent | Ваше право |
| dlg_22_3_v1_g.flac | ответ в разговоре | Sadachbia | easygoing, indifferent | Понимаю |
| dlg_22_3_v1_f_g.flac | ответ в разговоре | Leda | easygoing, indifferent | Понимаю |
| dlg_22_4_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_4_v1_f_g.flac | ответ в разговоре (добрый) | Leda | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | easygoing, indifferent, haughty | Как угодно |
| dlg_22_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | easygoing, indifferent, haughty | Как угодно |
| dlg_22_6_v1_g.flac | ответ в разговоре (свой) | Sadachbia | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_6_v1_f_g.flac | ответ в разговоре (свой) | Leda | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_7_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_7_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_8_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | easygoing, indifferent, cold, curt | Как знаете |
| dlg_22_8_v1_f_g.flac | ответ в разговоре (холоден) | Leda | easygoing, indifferent, cold, curt | Как знаете |
| dlg_23_0_v1_g.flac | ответ в разговоре | Sadachbia | impatient, tired | Мы об этом говорили |
| dlg_23_0_v1_f_g.flac | ответ в разговоре | Leda | impatient, tired | Мы об этом говорили |
| dlg_23_1_v1_g.flac | ответ в разговоре | Sadachbia | impatient, tired | Я уже ответил вам сегодня |
| dlg_23_1_v1_f_g.flac | ответ в разговоре | Leda | impatient, tired | Я уже ответила вам сегодня |
| dlg_23_2_v1_g.flac | ответ в разговоре | Sadachbia | impatient, tired | Опять вы с тем же? |
| dlg_23_2_v1_f_g.flac | ответ в разговоре | Leda | impatient, tired | Опять вы с тем же? |
| dlg_23_3_v1_g.flac | ответ в разговоре | Sadachbia | impatient, tired | Сегодня — хватит об этом |
| dlg_23_3_v1_f_g.flac | ответ в разговоре | Leda | impatient, tired | Сегодня — хватит об этом |
| dlg_23_4_v1_g.flac | ответ в разговоре (подозрительный) | Sadachbia | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_4_v1_f_g.flac | ответ в разговоре (подозрительный) | Leda | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_5_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | impatient, tired, kind, warm | Я же сказал уже — не сердитесь |
| dlg_23_5_v1_f_g.flac | ответ в разговоре (добрый) | Leda | impatient, tired, kind, warm | Я же сказала уже — не сердитесь |
| dlg_23_6_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_6_v1_f_g.flac | ответ в разговоре (жадный) | Leda | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_7_v1_g.flac | ответ в разговоре (свой) | Sadachbia | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_7_v1_f_g.flac | ответ в разговоре (свой) | Leda | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_8_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_23_8_v1_f_g.flac | ответ в разговоре (недруг) | Leda | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_24_0_v1_g.flac | ответ в разговоре | Sadachbia | disappointed, hurt | Я на вас рассчитывал |
| dlg_24_0_v1_f_g.flac | ответ в разговоре | Leda | disappointed, hurt | Я на вас рассчитывала |
| dlg_24_1_v1_g.flac | ответ в разговоре (свой) | Sadachbia | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_1_v1_f_g.flac | ответ в разговоре (свой) | Leda | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_2_v1_g.flac | ответ в разговоре (помнит обиду) | Sadachbia | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_24_2_v1_f_g.flac | ответ в разговоре (помнит обиду) | Leda | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_25_0_v1_g.flac | ответ в разговоре | Sadachbia | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_0_v1_f_g.flac | ответ в разговоре | Leda | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_1_v1_g.flac | ответ в разговоре | Sadachbia | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_1_v1_f_g.flac | ответ в разговоре | Leda | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_2_v1_g.flac | ответ в разговоре | Sadachbia | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_2_v1_f_g.flac | ответ в разговоре | Leda | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_3_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_3_v1_f_g.flac | ответ в разговоре (жадный) | Leda | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_4_v1_g.flac | ответ в разговоре (трус) | Sadachbia | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_4_v1_f_g.flac | ответ в разговоре (трус) | Leda | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_6_v1_g.flac | ответ в разговоре (свой) | Sadachbia | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_6_v1_f_g.flac | ответ в разговоре (свой) | Leda | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_7_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_7_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_8_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_25_8_v1_f_g.flac | ответ в разговоре (холоден) | Leda | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_26_0_v1_g.flac | ответ в разговоре | Sadachbia | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_0_v1_f_g.flac | ответ в разговоре | Leda | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_1_v1_g.flac | ответ в разговоре | Sadachbia | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_1_v1_f_g.flac | ответ в разговоре | Leda | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_2_v1_g.flac | ответ в разговоре | Sadachbia | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_2_v1_f_g.flac | ответ в разговоре | Leda | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_3_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_3_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_5_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_26_5_v1_f_g.flac | ответ в разговоре (холоден) | Leda | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_27_0_v1_g.flac | ответ в разговоре | Sadachbia | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_0_v1_f_g.flac | ответ в разговоре | Leda | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_1_v1_g.flac | ответ в разговоре | Sadachbia | curt, closing the topic | Что было — рассказано |
| dlg_27_1_v1_f_g.flac | ответ в разговоре | Leda | curt, closing the topic | Что было — рассказано |
| dlg_27_2_v1_g.flac | ответ в разговоре | Sadachbia | curt, closing the topic | Больше ничего не знаю |
| dlg_27_2_v1_f_g.flac | ответ в разговоре | Leda | curt, closing the topic | Больше ничего не знаю |
| dlg_27_3_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_3_v1_f_g.flac | ответ в разговоре (недруг) | Leda | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_27_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_28_0_v1_g.flac | ответ в разговоре | Sadachbia | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_0_v1_f_g.flac | ответ в разговоре | Leda | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_1_v1_g.flac | ответ в разговоре | Sadachbia | worried, grave | В мире всякое творится, слушайте |
| dlg_28_1_v1_f_g.flac | ответ в разговоре | Leda | worried, grave | В мире всякое творится, слушайте |
| dlg_28_2_v1_g.flac | ответ в разговоре | Sadachbia | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_2_v1_f_g.flac | ответ в разговоре | Leda | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_3_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_3_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_4_v1_g.flac | ответ в разговоре (прагматик) | Sadachbia | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_4_v1_f_g.flac | ответ в разговоре (прагматик) | Leda | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_5_v1_g.flac | ответ в разговоре (мятежник) | Sadachbia | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_5_v1_f_g.flac | ответ в разговоре (мятежник) | Leda | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_6_v1_g.flac | ответ в разговоре (свой) | Sadachbia | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_28_6_v1_f_g.flac | ответ в разговоре (свой) | Leda | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_29_0_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_0_v1_f_g.flac | ответ в разговоре | Leda | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_1_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_1_v1_f_g.flac | ответ в разговоре | Leda | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_2_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_2_v1_f_g.flac | ответ в разговоре | Leda | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_3_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_3_v1_f_g.flac | ответ в разговоре (недруг) | Leda | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_4_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_29_4_v1_f_g.flac | ответ в разговоре (холоден) | Leda | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_30_0_v1_g.flac | ответ в разговоре | Sadachbia | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_0_v1_f_g.flac | ответ в разговоре | Leda | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_1_v1_g.flac | ответ в разговоре | Sadachbia | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_1_v1_f_g.flac | ответ в разговоре | Leda | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_2_v1_g.flac | ответ в разговоре | Sadachbia | knowing, reassuring | Намёк понят |
| dlg_30_2_v1_f_g.flac | ответ в разговоре | Leda | knowing, reassuring | Намёк понят |
| dlg_30_3_v1_g.flac | ответ в разговоре (хитрый) | Sadachbia | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_3_v1_f_g.flac | ответ в разговоре (хитрый) | Leda | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_30_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_31_0_v1_g.flac | ответ в разговоре | Sadachbia | convinced, trusting | Раз так — верю вам |
| dlg_31_0_v1_f_g.flac | ответ в разговоре | Leda | convinced, trusting | Раз так — верю вам |
| dlg_31_1_v1_g.flac | ответ в разговоре | Sadachbia | convinced, trusting | Ну, если так, другое дело |
| dlg_31_1_v1_f_g.flac | ответ в разговоре | Leda | convinced, trusting | Ну, если так, другое дело |
| dlg_31_2_v1_g.flac | ответ в разговоре | Sadachbia | convinced, trusting | Что ж, похоже на правду |
| dlg_31_2_v1_f_g.flac | ответ в разговоре | Leda | convinced, trusting | Что ж, похоже на правду |
| dlg_31_3_v1_g.flac | ответ в разговоре (добрый) | Sadachbia | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_3_v1_f_g.flac | ответ в разговоре (добрый) | Leda | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_31_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_32_0_v1_g.flac | ответ в разговоре | Sadachbia | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_0_v1_f_g.flac | ответ в разговоре | Leda | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_1_v1_g.flac | ответ в разговоре | Sadachbia | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_1_v1_f_g.flac | ответ в разговоре | Leda | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_2_v1_g.flac | ответ в разговоре | Sadachbia | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_2_v1_f_g.flac | ответ в разговоре | Leda | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_3_v1_g.flac | ответ в разговоре (жестокий) | Sadachbia | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_3_v1_f_g.flac | ответ в разговоре (жестокий) | Leda | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_4_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_32_4_v1_f_g.flac | ответ в разговоре (недруг) | Leda | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_33_0_v1_g.flac | ответ в разговоре | Sadachbia | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_0_v1_f_g.flac | ответ в разговоре | Leda | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_1_v1_g.flac | ответ в разговоре | Sadachbia | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_1_v1_f_g.flac | ответ в разговоре | Leda | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_2_v1_g.flac | ответ в разговоре | Sadachbia | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_2_v1_f_g.flac | ответ в разговоре | Leda | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_3_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_3_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_5_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_33_5_v1_f_g.flac | ответ в разговоре (недруг) | Leda | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_34_0_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_0_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_1_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_1_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_2_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_2_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_3_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_3_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_34_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_35_0_v1_g.flac | ответ в разговоре | Sadachbia | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_0_v1_f_g.flac | ответ в разговоре | Leda | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_1_v1_g.flac | ответ в разговоре | Sadachbia | outraged, indignant, pious | Святотатство! |
| dlg_35_1_v1_f_g.flac | ответ в разговоре | Leda | outraged, indignant, pious | Святотатство! |
| dlg_35_2_v1_g.flac | ответ в разговоре | Sadachbia | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_2_v1_f_g.flac | ответ в разговоре | Leda | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_3_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_3_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_4_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_4_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_5_v1_g.flac | ответ в разговоре (свой) | Sadachbia | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_35_5_v1_f_g.flac | ответ в разговоре (свой) | Leda | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_36_0_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_0_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_1_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_1_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_2_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_2_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_3_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_3_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_4_v1_g.flac | ответ в разговоре (реформатор) | Sadachbia | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_4_v1_f_g.flac | ответ в разговоре (реформатор) | Leda | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_5_v1_g.flac | ответ в разговоре (свой) | Sadachbia | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_36_5_v1_f_g.flac | ответ в разговоре (свой) | Leda | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_37_0_v1_g.flac | ответ в разговоре | Sadachbia | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_0_v1_f_g.flac | ответ в разговоре | Leda | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_1_v1_g.flac | ответ в разговоре | Sadachbia | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_1_v1_f_g.flac | ответ в разговоре | Leda | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_2_v1_g.flac | ответ в разговоре | Sadachbia | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_2_v1_f_g.flac | ответ в разговоре | Leda | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_3_v1_g.flac | ответ в разговоре (мятежник) | Sadachbia | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_3_v1_f_g.flac | ответ в разговоре (мятежник) | Leda | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_4_v1_g.flac | ответ в разговоре (традиционалист) | Sadachbia | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_4_v1_f_g.flac | ответ в разговоре (традиционалист) | Leda | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_5_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_37_5_v1_f_g.flac | ответ в разговоре (недруг) | Leda | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_38_0_v1_g.flac | ответ в разговоре | Sadachbia | offended, cold | У нас так не кланяются |
| dlg_38_0_v1_f_g.flac | ответ в разговоре | Leda | offended, cold | У нас так не кланяются |
| dlg_38_1_v1_g.flac | ответ в разговоре | Sadachbia | offended, cold | Это что, насмешка? |
| dlg_38_1_v1_f_g.flac | ответ в разговоре | Leda | offended, cold | Это что, насмешка? |
| dlg_38_2_v1_g.flac | ответ в разговоре | Sadachbia | offended, cold | Не знаете обычаев — не берите |
| dlg_38_2_v1_f_g.flac | ответ в разговоре | Leda | offended, cold | Не знаете обычаев — не берите |
| dlg_38_3_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_3_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | offended, cold, warm, friendly | Ничего, научишься |
| dlg_38_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | offended, cold, warm, friendly | Ничего, научишься |
| dlg_39_0_v1_g.flac | ответ в разговоре | Sadachbia | satisfied, businesslike | По рукам, договорились |
| dlg_39_0_v1_f_g.flac | ответ в разговоре | Leda | satisfied, businesslike | По рукам, договорились |
| dlg_39_1_v1_g.flac | ответ в разговоре | Sadachbia | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_1_v1_f_g.flac | ответ в разговоре | Leda | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_2_v1_g.flac | ответ в разговоре | Sadachbia | satisfied, businesslike | Уговор так уговор |
| dlg_39_2_v1_f_g.flac | ответ в разговоре | Leda | satisfied, businesslike | Уговор так уговор |
| dlg_39_3_v1_g.flac | ответ в разговоре (жадный) | Sadachbia | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_3_v1_f_g.flac | ответ в разговоре (жадный) | Leda | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_5_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_39_5_v1_f_g.flac | ответ в разговоре (недруг) | Leda | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_40_0_v1_g.flac | ответ в разговоре | Sadachbia | firm, dissatisfied | Так не договоримся |
| dlg_40_0_v1_f_g.flac | ответ в разговоре | Leda | firm, dissatisfied | Так не договоримся |
| dlg_40_1_v1_g.flac | ответ в разговоре | Sadachbia | firm, dissatisfied | Мне это не с руки |
| dlg_40_1_v1_f_g.flac | ответ в разговоре | Leda | firm, dissatisfied | Мне это не с руки |
| dlg_40_2_v1_g.flac | ответ в разговоре | Sadachbia | firm, dissatisfied | Ищите другой уговор |
| dlg_40_2_v1_f_g.flac | ответ в разговоре | Leda | firm, dissatisfied | Ищите другой уговор |
| dlg_40_3_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_3_v1_f_g.flac | ответ в разговоре (недруг) | Leda | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_4_v1_g.flac | ответ в разговоре (свой) | Sadachbia | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_40_4_v1_f_g.flac | ответ в разговоре (свой) | Leda | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_41_0_v1_g.flac | ответ в разговоре | Sadachbia | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_0_v1_f_g.flac | ответ в разговоре | Leda | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_1_v1_g.flac | ответ в разговоре | Sadachbia | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_1_v1_f_g.flac | ответ в разговоре | Leda | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_2_v1_g.flac | ответ в разговоре | Sadachbia | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_2_v1_f_g.flac | ответ в разговоре | Leda | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_3_v1_g.flac | ответ в разговоре | Sadachbia | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_3_v1_f_g.flac | ответ в разговоре | Leda | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_4_v1_g.flac | ответ в разговоре (фанатик) | Sadachbia | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_4_v1_f_g.flac | ответ в разговоре (фанатик) | Leda | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_5_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_5_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_6_v1_g.flac | ответ в разговоре (рациональный) | Sadachbia | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_6_v1_f_g.flac | ответ в разговоре (рациональный) | Leda | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_7_v1_g.flac | ответ в разговоре (трус) | Sadachbia | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_7_v1_f_g.flac | ответ в разговоре (трус) | Leda | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_8_v1_g.flac | ответ в разговоре (свой) | Sadachbia | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_8_v1_f_g.flac | ответ в разговоре (свой) | Leda | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_9_v1_g.flac | ответ в разговоре (помнит добро) | Sadachbia | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_9_v1_f_g.flac | ответ в разговоре (помнит добро) | Leda | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_10_v1_g.flac | ответ в разговоре (холоден) | Sadachbia | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_10_v1_f_g.flac | ответ в разговоре (холоден) | Leda | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_11_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_41_11_v1_f_g.flac | ответ в разговоре (недруг) | Leda | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_42_0_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_0_v1_f_g.flac | ответ в разговоре | Leda | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_1_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_1_v1_f_g.flac | ответ в разговоре | Leda | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_2_v1_g.flac | ответ в разговоре | Sadachbia | dismissive, busy | Не знаю я старины |
| dlg_42_2_v1_f_g.flac | ответ в разговоре | Leda | dismissive, busy | Не знаю я старины |
| dlg_42_3_v1_g.flac | ответ в разговоре (высокомерный) | Sadachbia | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_3_v1_f_g.flac | ответ в разговоре (высокомерный) | Leda | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_4_v1_g.flac | ответ в разговоре (недруг) | Sadachbia | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_4_v1_f_g.flac | ответ в разговоре (недруг) | Leda | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_5_v1_g.flac | ответ в разговоре (свой) | Sadachbia | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| dlg_42_5_v1_f_g.flac | ответ в разговоре (свой) | Leda | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| greet_postoyan_0_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | warm, delighted | А, мой лучший покупатель! Заходи. |
| greet_postoyan_0_v1_f_g.flac | приветствие: постоянному покупателю | Leda | warm, delighted | А, мой лучший покупатель! Заходи. |
| greet_postoyan_1_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | proud, pleased | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_1_v1_f_g.flac | приветствие: постоянному покупателю | Leda | proud, pleased | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_2_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | confidential, friendly | Для постоянных — цена особая. Смотри. |
| greet_postoyan_2_v1_f_g.flac | приветствие: постоянному покупателю | Leda | confidential, friendly | Для постоянных — цена особая. Смотри. |
| greet_postoyan_3_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | teasing, relieved | Я уж думал, ты к соседу переметнулся. |
| greet_postoyan_3_v1_f_g.flac | приветствие: постоянному покупателю | Leda | teasing, relieved | Я уж думала, ты к соседу переметнулся. |
| greet_postoyan_4_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | knowing, friendly | Узнаю тебя. Опять за припасами? |
| greet_postoyan_4_v1_f_g.flac | приветствие: постоянному покупателю | Leda | knowing, friendly | Узнаю тебя. Опять за припасами? |
| greet_postoyan_5_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | courteous, welcoming | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_5_v1_f_g.flac | приветствие: постоянному покупателю | Leda | courteous, welcoming | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_6_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | joking, warm | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_6_v1_f_g.flac | приветствие: постоянному покупателю | Leda | joking, warm | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_7_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | cheerful | Опять ты! Я как раз свежий товар разложил. |
| greet_postoyan_7_v1_f_g.flac | приветствие: постоянному покупателю | Leda | cheerful | Опять ты! Я как раз свежий товар разложила. |
| greet_postoyan_8_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | sincere, pleased | С тобой торговать — одно удовольствие. |
| greet_postoyan_8_v1_f_g.flac | приветствие: постоянному покупателю | Leda | sincere, pleased | С тобой торговать — одно удовольствие. |
| greet_postoyan_9_v1_g.flac | приветствие: постоянному покупателю | Sadachbia | helpful, friendly | Запомнил, что ты берёшь. Отложил кое-что. |
| greet_postoyan_9_v1_f_g.flac | приветствие: постоянному покупателю | Leda | helpful, friendly | Запомнила, что ты берёшь. Отложила кое-что. |
| greet_prodavec_0_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | eager, businesslike | С добычей? Показывай, что там у тебя. |
| greet_prodavec_0_v1_f_g.flac | приветствие: постоянному поставщику | Leda | eager, businesslike | С добычей? Показывай, что там у тебя. |
| greet_prodavec_1_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | amused, chuckling | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_1_v1_f_g.flac | приветствие: постоянному поставщику | Leda | amused, chuckling | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_2_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | businesslike, friendly | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_2_v1_f_g.flac | приветствие: постоянному поставщику | Leda | businesslike, friendly | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_3_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | curious, eager | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_3_v1_f_g.flac | приветствие: постоянному поставщику | Leda | curious, eager | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_4_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | warm, businesslike | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_4_v1_f_g.flac | приветствие: постоянному поставщику | Leda | warm, businesslike | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_5_v1_g.flac | приветствие: постоянному поставщику | Sadachbia | playful, appreciative | С тобой и артели не надо. Что на продажу? |
| greet_prodavec_5_v1_f_g.flac | приветствие: постоянному поставщику | Leda | playful, appreciative | С тобой и артели не надо. Что на продажу? |
| greet_bogat_0_v1_g.flac | приветствие: богатому | Sadachbia | greedy, fawning | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_0_v1_f_g.flac | приветствие: богатому | Leda | greedy, fawning | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_1_v1_g.flac | приветствие: богатому | Sadachbia | sly, fawning | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_1_v1_f_g.flac | приветствие: богатому | Leda | sly, fawning | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_2_v1_g.flac | приветствие: богатому | Sadachbia | obsequious, eager | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_2_v1_f_g.flac | приветствие: богатому | Leda | obsequious, eager | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_3_v1_g.flac | приветствие: богатому | Sadachbia | persuasive, smooth | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_3_v1_f_g.flac | приветствие: богатому | Leda | persuasive, smooth | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_4_v1_g.flac | приветствие: богатому | Sadachbia | sly, jovial | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_4_v1_f_g.flac | приветствие: богатому | Leda | sly, jovial | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_5_v1_g.flac | приветствие: богатому | Sadachbia | confidential, lowered voice | Для важного гостя найдётся кое-что особенное. |
| greet_bogat_5_v1_f_g.flac | приветствие: богатому | Leda | confidential, lowered voice | Для важного гостя найдётся кое-что особенное. |
| greet_bedn_0_v1_g.flac | приветствие: без гроша | Sadachbia | dry, a bit sympathetic | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_0_v1_f_g.flac | приветствие: без гроша | Leda | dry, a bit sympathetic | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_1_v1_g.flac | приветствие: без гроша | Sadachbia | dry, firm | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_1_v1_f_g.flac | приветствие: без гроша | Leda | dry, firm | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_2_v1_g.flac | приветствие: без гроша | Sadachbia | sympathetic, practical | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_2_v1_f_g.flac | приветствие: без гроша | Leda | sympathetic, practical | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_3_v1_g.flac | приветствие: без гроша | Sadachbia | businesslike, curt | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_3_v1_f_g.flac | приветствие: без гроша | Leda | businesslike, curt | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_4_v1_g.flac | приветствие: без гроша | Sadachbia | wry, dry humour | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_4_v1_f_g.flac | приветствие: без гроша | Leda | wry, dry humour | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_5_v1_g.flac | приветствие: без гроша | Sadachbia | kindly, encouraging | Заработаешь — приходи. Я никуда не денусь. |
| greet_bedn_5_v1_f_g.flac | приветствие: без гроша | Leda | kindly, encouraging | Заработаешь — приходи. Я никуда не денусь. |
| greet_ranen_0_v1_g.flac | приветствие: раненому | Sadachbia | alarmed, caring | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_0_v1_f_g.flac | приветствие: раненому | Leda | alarmed, caring | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_1_v1_g.flac | приветствие: раненому | Sadachbia | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_1_v1_f_g.flac | приветствие: раненому | Leda | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_2_v1_g.flac | приветствие: раненому | Sadachbia | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_2_v1_f_g.flac | приветствие: раненому | Leda | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_3_v1_g.flac | приветствие: раненому | Sadachbia | gruff, concerned | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_3_v1_f_g.flac | приветствие: раненому | Leda | gruff, concerned | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_4_v1_g.flac | приветствие: раненому | Sadachbia | relieved, caring | Живой — и то ладно. Потом о делах. |
| greet_ranen_4_v1_f_g.flac | приветствие: раненому | Leda | relieved, caring | Живой — и то ладно. Потом о делах. |
| greet_ranen_5_v1_g.flac | приветствие: раненому | Sadachbia | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_ranen_5_v1_f_g.flac | приветствие: раненому | Leda | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_slava_0_v1_g.flac | приветствие: знаменитому | Sadachbia | awed, excited | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_0_v1_f_g.flac | приветствие: знаменитому | Leda | awed, excited | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_1_v1_g.flac | приветствие: знаменитому | Sadachbia | respectful, impressed | О вас уже песни поют. Чем могу служить? |
| greet_slava_1_v1_f_g.flac | приветствие: знаменитому | Leda | respectful, impressed | О вас уже песни поют. Чем могу служить? |
| greet_slava_2_v1_g.flac | приветствие: знаменитому | Sadachbia | honored, formal | Такой гость — честь для нашего дома. |
| greet_slava_2_v1_f_g.flac | приветствие: знаменитому | Leda | honored, formal | Такой гость — честь для нашего дома. |
| greet_slava_3_v1_g.flac | приветствие: знаменитому | Sadachbia | excited, eager | Весь город о вас говорит. Проходите! |
| greet_slava_3_v1_f_g.flac | приветствие: знаменитому | Leda | excited, eager | Весь город о вас говорит. Проходите! |
| greet_slava_4_v1_g.flac | приветствие: знаменитому | Sadachbia | delighted, chuckling | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_4_v1_f_g.flac | приветствие: знаменитому | Leda | delighted, chuckling | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_5_v1_g.flac | приветствие: знаменитому | Sadachbia | respectful, warm | Слава бежит впереди вас. Рады видеть. |
| greet_slava_5_v1_f_g.flac | приветствие: знаменитому | Leda | respectful, warm | Слава бежит впереди вас. Рады видеть. |
| greet_durn_0_v1_g.flac | приветствие: с дурной славой | Sadachbia | wary, cold | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_0_v1_f_g.flac | приветствие: с дурной славой | Leda | wary, cold | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_1_v1_g.flac | приветствие: с дурной славой | Sadachbia | suspicious, slow | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_1_v1_f_g.flac | приветствие: с дурной славой | Leda | suspicious, slow | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_2_v1_g.flac | приветствие: с дурной славой | Sadachbia | nervous, wary | Держите руки на виду. На всякий случай. |
| greet_durn_2_v1_f_g.flac | приветствие: с дурной славой | Leda | nervous, wary | Держите руки на виду. На всякий случай. |
| greet_durn_3_v1_g.flac | приветствие: с дурной славой | Sadachbia | disapproving, stern | С вашей славой в честный дом не ходят. |
| greet_durn_3_v1_f_g.flac | приветствие: с дурной славой | Leda | disapproving, stern | С вашей славой в честный дом не ходят. |
| greet_durn_4_v1_g.flac | приветствие: с дурной славой | Sadachbia | defiant, tense | Вас тут боятся. Я — пока нет. |
| greet_durn_4_v1_f_g.flac | приветствие: с дурной славой | Leda | defiant, tense | Вас тут боятся. Я — пока нет. |
| greet_davno_0_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | surprised, glad | Давненько тебя видно не было! Где носило? |
| greet_davno_0_v1_f_g.flac | приветствие: после долгой разлуки | Leda | surprised, glad | Давненько тебя видно не было! Где носило? |
| greet_davno_1_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | joyful, warm | Сколько лет, сколько зим! Проходи. |
| greet_davno_1_v1_f_g.flac | приветствие: после долгой разлуки | Leda | joyful, warm | Сколько лет, сколько зим! Проходи. |
| greet_davno_2_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | relieved, warm | А я уж боялся, что тракт тебя забрал. |
| greet_davno_2_v1_f_g.flac | приветствие: после долгой разлуки | Leda | relieved, warm | А я уж боялась, что тракт тебя забрал. |
| greet_davno_3_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | mock reproach, warm | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_3_v1_f_g.flac | приветствие: после долгой разлуки | Leda | mock reproach, warm | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_4_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | surprised, relieved | Живой! А мы уж и гадать перестали. |
| greet_davno_4_v1_f_g.flac | приветствие: после долгой разлуки | Leda | surprised, relieved | Живой! А мы уж и гадать перестали. |
| greet_davno_5_v1_g.flac | приветствие: после долгой разлуки | Sadachbia | curious, friendly | Тебя не узнать. Долгой была дорога? |
| greet_davno_5_v1_f_g.flac | приветствие: после долгой разлуки | Leda | curious, friendly | Тебя не узнать. Долгой была дорога? |
| greet_dozhd_0_v1_g.flac | приветствие: в дождь | Sadachbia | hospitable, warm | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_0_v1_f_g.flac | приветствие: в дождь | Leda | hospitable, warm | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_1_v1_g.flac | приветствие: в дождь | Sadachbia | dry, matter-of-fact | В такой дождь только по делу и ходят. |
| greet_dozhd_1_v1_f_g.flac | приветствие: в дождь | Leda | dry, matter-of-fact | В такой дождь только по делу и ходят. |
| greet_dozhd_2_v1_g.flac | приветствие: в дождь | Sadachbia | fussy, mildly annoyed | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_2_v1_f_g.flac | приветствие: в дождь | Leda | fussy, mildly annoyed | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_3_v1_g.flac | приветствие: в дождь | Sadachbia | weary, sighing | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_3_v1_f_g.flac | приветствие: в дождь | Leda | weary, sighing | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_4_v1_g.flac | приветствие: в дождь | Sadachbia | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_4_v1_f_g.flac | приветствие: в дождь | Leda | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_5_v1_g.flac | приветствие: в дождь | Sadachbia | grumbling, friendly | Вот погодка! Сапоги у порога оставь. |
| greet_dozhd_5_v1_f_g.flac | приветствие: в дождь | Leda | grumbling, friendly | Вот погодка! Сапоги у порога оставь. |
| greet_zemlyak_0_v1_g.flac | приветствие: земляку | Sadachbia | joyful, warm | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_0_v1_f_g.flac | приветствие: земляку | Leda | joyful, warm | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_1_v1_g.flac | приветствие: земляку | Sadachbia | warm, welcoming | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_1_v1_f_g.flac | приветствие: земляку | Leda | warm, welcoming | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_2_v1_g.flac | приветствие: земляку | Sadachbia | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_2_v1_f_g.flac | приветствие: земляку | Leda | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_3_v1_g.flac | приветствие: земляку | Sadachbia | friendly, confidential | Земляку и цена своя. Проходи. |
| greet_zemlyak_3_v1_f_g.flac | приветствие: земляку | Leda | friendly, confidential | Земляку и цена своя. Проходи. |
| greet_zemlyak_4_v1_g.flac | приветствие: земляку | Sadachbia | warm, nostalgic | Своих издалека видно. Как там дома? |
| greet_zemlyak_4_v1_f_g.flac | приветствие: земляку | Leda | warm, nostalgic | Своих издалека видно. Как там дома? |
| greet_zemlyak_5_v1_g.flac | приветствие: земляку | Sadachbia | glad, warm | Нечасто наших тут встретишь. Садись. |
| greet_zemlyak_5_v1_f_g.flac | приветствие: земляку | Leda | glad, warm | Нечасто наших тут встретишь. Садись. |
| greet_zhdet_0_v1_g.flac | приветствие: про взятое дело | Sadachbia | expectant, curious | Ну что, как с моим делом? |
| greet_zhdet_0_v1_f_g.flac | приветствие: про взятое дело | Leda | expectant, curious | Ну что, как с моим делом? |
| greet_zhdet_1_v1_g.flac | приветствие: про взятое дело | Sadachbia | reminding, slightly stern | Помнишь, о чём договаривались? |
| greet_zhdet_1_v1_f_g.flac | приветствие: про взятое дело | Leda | reminding, slightly stern | Помнишь, о чём договаривались? |
| greet_zhdet_2_v1_g.flac | приветствие: про взятое дело | Sadachbia | impatient, sighing | Жду, жду. Дело само не сделается. |
| greet_zhdet_2_v1_f_g.flac | приветствие: про взятое дело | Leda | impatient, sighing | Жду, жду. Дело само не сделается. |
| greet_zhdet_3_v1_g.flac | приветствие: про взятое дело | Sadachbia | worried, reminding | Не забыто ли моё поручение? |
| greet_zhdet_3_v1_f_g.flac | приветствие: про взятое дело | Leda | worried, reminding | Не забыто ли моё поручение? |
| greet_zhdet_4_v1_g.flac | приветствие: про взятое дело | Sadachbia | hopeful, eager | Вести есть? Как там с тем делом? |
| greet_zhdet_4_v1_f_g.flac | приветствие: про взятое дело | Leda | hopeful, eager | Вести есть? Как там с тем делом? |
| greet_zhdet_5_v1_g.flac | приветствие: про взятое дело | Sadachbia | hopeful, curious | Вижу тебя — значит, есть новости? |
| greet_zhdet_5_v1_f_g.flac | приветствие: про взятое дело | Leda | hopeful, curious | Вижу тебя — значит, есть новости? |
| greet_torg_12_v1_g.flac | приветствие: торговец | Sadachbia | brisk, lively market trader | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_12_v1_f_g.flac | приветствие: торговец | Leda | brisk, lively market trader | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_13_v1_g.flac | приветствие: торговец | Sadachbia | playful, persuasive | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_13_v1_f_g.flac | приветствие: торговец | Leda | playful, persuasive | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_14_v1_g.flac | приветствие: торговец | Sadachbia | proud, lively | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_14_v1_f_g.flac | приветствие: торговец | Leda | proud, lively | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_15_v1_g.flac | приветствие: торговец | Sadachbia | sly, playful | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_15_v1_f_g.flac | приветствие: торговец | Leda | sly, playful | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_16_v1_g.flac | приветствие: торговец | Sadachbia | admiring, persuasive | Глянь, какая работа! Такое не каждый день. |
| greet_torg_16_v1_f_g.flac | приветствие: торговец | Leda | admiring, persuasive | Глянь, какая работа! Такое не каждый день. |
| greet_torg_17_v1_g.flac | приветствие: торговец | Sadachbia | wise, sly | Деньги любят счёт, а товар — хозяина. |
| greet_torg_17_v1_f_g.flac | приветствие: торговец | Leda | wise, sly | Деньги любят счёт, а товар — хозяина. |
| greet_obshiy_8_v1_g.flac | приветствие: всякий житель | Sadachbia | friendly, curious | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_8_v1_f_g.flac | приветствие: всякий житель | Leda | friendly, curious | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_9_v1_g.flac | приветствие: всякий житель | Sadachbia | friendly, sympathetic | Путник? Дорога дальняя, небось. |
| greet_obshiy_9_v1_f_g.flac | приветствие: всякий житель | Leda | friendly, sympathetic | Путник? Дорога дальняя, небось. |
| greet_obshiy_10_v1_g.flac | приветствие: всякий житель | Sadachbia | curious, easygoing | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_10_v1_f_g.flac | приветствие: всякий житель | Leda | curious, easygoing | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_11_v1_g.flac | приветствие: всякий житель | Sadachbia | calm, hospitable | Мир дому и тому, кто входит. |
| greet_obshiy_11_v1_f_g.flac | приветствие: всякий житель | Leda | calm, hospitable | Мир дому и тому, кто входит. |
| greet_obshiy_12_v1_g.flac | приветствие: всякий житель | Sadachbia | hospitable, warm | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_12_v1_f_g.flac | приветствие: всякий житель | Leda | hospitable, warm | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_13_v1_g.flac | приветствие: всякий житель | Sadachbia | cautious, then friendly | Добрый человек? Тогда поговорим. |
| greet_obshiy_13_v1_f_g.flac | приветствие: всякий житель | Leda | cautious, then friendly | Добрый человек? Тогда поговорим. |
| greet_kuznya_8_v1_g.flac | приветствие: кузнец | Sadachbia | loud, gruff blacksmith, busy | Молот не ждёт. Чего тебе? |
| greet_kuznya_8_v1_f_g.flac | приветствие: кузнец | Leda | loud, gruff blacksmith, busy | Молот не ждёт. Чего тебе? |
| greet_kuznya_9_v1_g.flac | приветствие: кузнец | Sadachbia | gruff, businesslike | Кольчугу латать или клинок точить? |
| greet_kuznya_9_v1_f_g.flac | приветствие: кузнец | Leda | gruff, businesslike | Кольчугу латать или клинок точить? |
| greet_kuznya_10_v1_g.flac | приветствие: кузнец | Sadachbia | gruff, amused | Искры не боишься? Подходи. |
| greet_kuznya_10_v1_f_g.flac | приветствие: кузнец | Leda | gruff, amused | Искры не боишься? Подходи. |
| greet_traktir_8_v1_g.flac | приветствие: трактирщик | Sadachbia | warm, hospitable innkeeper | Заходи, у нас тепло и сухо. |
| greet_traktir_8_v1_f_g.flac | приветствие: трактирщик | Leda | warm, hospitable innkeeper | Заходи, у нас тепло и сухо. |
| greet_traktir_9_v1_g.flac | приветствие: трактирщик | Sadachbia | cheerful innkeeper | Кружку пива для начала? |
| greet_traktir_9_v1_f_g.flac | приветствие: трактирщик | Leda | cheerful innkeeper | Кружку пива для начала? |
| greet_traktir_10_v1_g.flac | приветствие: трактирщик | Sadachbia | friendly, hospitable | Свободный стол у окна. Садись. |
| greet_traktir_10_v1_f_g.flac | приветствие: трактирщик | Leda | friendly, hospitable | Свободный стол у окна. Садись. |
| greet_lekar_8_v1_g.flac | приветствие: лекарь | Sadachbia | gentle, hushed | Тише, тише. Здесь больные спят. |
| greet_lekar_8_v1_f_g.flac | приветствие: лекарь | Leda | gentle, hushed | Тише, тише. Здесь больные спят. |
| greet_lekar_9_v1_g.flac | приветствие: лекарь | Sadachbia | calm, caring | Покажи руки. Раны чистые? |
| greet_lekar_9_v1_f_g.flac | приветствие: лекарь | Leda | calm, caring | Покажи руки. Раны чистые? |
| greet_lekar_10_v1_g.flac | приветствие: лекарь | Sadachbia | gentle, attentive | Травы свежие, отвар готов. Что беспокоит? |
| greet_lekar_10_v1_f_g.flac | приветствие: лекарь | Leda | gentle, attentive | Травы свежие, отвар готов. Что беспокоит? |
| greet_zhrec_8_v1_g.flac | приветствие: жрец | Sadachbia | serene, reverent | Входи с миром, уходи с надеждой. |
| greet_zhrec_8_v1_f_g.flac | приветствие: жрец | Leda | serene, reverent | Входи с миром, уходи с надеждой. |
| greet_zhrec_9_v1_g.flac | приветствие: жрец | Sadachbia | quiet, solemn | Боги видят всякого, кто переступает порог. |
| greet_zhrec_9_v1_f_g.flac | приветствие: жрец | Leda | quiet, solemn | Боги видят всякого, кто переступает порог. |
| greet_zhrec_10_v1_g.flac | приветствие: жрец | Sadachbia | gentle, reverent | Помолишься с нами или пришёл за советом? |
| greet_zhrec_10_v1_f_g.flac | приветствие: жрец | Leda | gentle, reverent | Помолишься с нами или пришёл за советом? |
| greet_znanie_8_v1_g.flac | приветствие: учёный | Sadachbia | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_8_v1_f_g.flac | приветствие: учёный | Leda | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_9_v1_g.flac | приветствие: учёный | Sadachbia | fussy, scholarly | Любую книгу — только после того, как руки вымоешь. |
| greet_znanie_9_v1_f_g.flac | приветствие: учёный | Leda | fussy, scholarly | Любую книгу — только после того, как руки вымоешь. |
| greet_znanie_10_v1_g.flac | приветствие: учёный | Sadachbia | delighted, scholarly | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_znanie_10_v1_f_g.flac | приветствие: учёный | Leda | delighted, scholarly | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_strazha_9_v1_g.flac | приветствие: страж у дела | Sadachbia | stern, official | Порядок знаешь? Тогда проходи. |
| greet_strazha_9_v1_f_g.flac | приветствие: страж у дела | Leda | stern, official | Порядок знаешь? Тогда проходи. |
| greet_strazha_10_v1_g.flac | приветствие: страж у дела | Sadachbia | dry, stern | Держи руки на виду, и мы поладим. |
| greet_strazha_10_v1_f_g.flac | приветствие: страж у дела | Leda | dry, stern | Держи руки на виду, и мы поладим. |
| greet_strazha_11_v1_g.flac | приветствие: страж у дела | Sadachbia | curt, official | Без дела не задерживайся. |
| greet_strazha_11_v1_f_g.flac | приветствие: страж у дела | Leda | curt, official | Без дела не задерживайся. |
| trade_buy_0_v1_g.flac | торговец: покупка | Sadachbia | warm, satisfied | Хороший выбор. Носи на здоровье. |
| trade_buy_0_v1_f_g.flac | торговец: покупка | Leda | warm, satisfied | Хороший выбор. Носи на здоровье. |
| trade_buy_1_v1_g.flac | торговец: покупка | Sadachbia | confident, proud | Держи. Сносу не будет. |
| trade_buy_1_v1_f_g.flac | торговец: покупка | Leda | confident, proud | Держи. Сносу не будет. |
| trade_buy_2_v1_g.flac | торговец: покупка | Sadachbia | cheerful, businesslike | По рукам! Приятно иметь дело. |
| trade_buy_2_v1_f_g.flac | торговец: покупка | Leda | cheerful, businesslike | По рукам! Приятно иметь дело. |
| trade_buy_3_v1_g.flac | торговец: покупка | Sadachbia | friendly, persuasive | Бери, бери. Не пожалеешь. |
| trade_buy_3_v1_f_g.flac | торговец: покупка | Leda | friendly, persuasive | Бери, бери. Не пожалеешь. |
| trade_buy_4_v1_g.flac | торговец: покупка | Sadachbia | businesslike, fair | С тебя золото — с меня товар. Честно. |
| trade_buy_4_v1_f_g.flac | торговец: покупка | Leda | businesslike, fair | С тебя золото — с меня товар. Честно. |
| trade_buy_5_v1_g.flac | торговец: покупка | Sadachbia | pleased, warm | Вот и славно. Заходи ещё. |
| trade_buy_5_v1_f_g.flac | торговец: покупка | Leda | pleased, warm | Вот и славно. Заходи ещё. |
| trade_buy_6_v1_g.flac | торговец: покупка | Sadachbia | proud, serious | Твоё. Береги, второго такого нет. |
| trade_buy_6_v1_f_g.flac | торговец: покупка | Leda | proud, serious | Твоё. Береги, второго такого нет. |
| trade_buy_7_v1_g.flac | торговец: покупка | Sadachbia | cheerful | Взято! Пусть служит верно. |
| trade_buy_7_v1_f_g.flac | торговец: покупка | Leda | cheerful | Взято! Пусть служит верно. |
| trade_buy_8_v1_g.flac | торговец: покупка | Sadachbia | approving, sincere | Отличная покупка. Я бы и сам взял. |
| trade_buy_8_v1_f_g.flac | торговец: покупка | Leda | approving, sincere | Отличная покупка. Я бы и сама взяла. |
| trade_buy_9_v1_g.flac | торговец: покупка | Sadachbia | confidential, generous | Забирай. Цену сбавил только для тебя. |
| trade_buy_9_v1_f_g.flac | торговец: покупка | Leda | confidential, generous | Забирай. Цену сбавила только для тебя. |
| trade_buy_10_v1_g.flac | торговец: покупка | Sadachbia | grateful, warm | Спасибо за золото. Удачи в дороге. |
| trade_buy_10_v1_f_g.flac | торговец: покупка | Leda | grateful, warm | Спасибо за золото. Удачи в дороге. |
| trade_buy_11_v1_g.flac | торговец: покупка | Sadachbia | lively, joking | Сделка! Смотри не потеряй. |
| trade_buy_11_v1_f_g.flac | торговец: покупка | Leda | lively, joking | Сделка! Смотри не потеряй. |
| trade_buy_big_0_v1_g.flac | торговец: крупная покупка | Sadachbia | delighted, laughing | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_0_v1_f_g.flac | торговец: крупная покупка | Leda | delighted, laughing | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_1_v1_g.flac | торговец: крупная покупка | Sadachbia | excited, fawning | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_1_v1_f_g.flac | торговец: крупная покупка | Leda | excited, fawning | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_2_v1_g.flac | торговец: крупная покупка | Sadachbia | grateful, generous | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_2_v1_f_g.flac | торговец: крупная покупка | Leda | grateful, generous | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_3_v1_g.flac | торговец: крупная покупка | Sadachbia | amazed, delighted | Полприлавка разом! Вот это размах. |
| trade_buy_big_3_v1_f_g.flac | торговец: крупная покупка | Leda | amazed, delighted | Полприлавка разом! Вот это размах. |
| trade_buy_big_4_v1_g.flac | торговец: крупная покупка | Sadachbia | happy, warm | С таким покупателем и год не страшен. |
| trade_buy_big_4_v1_f_g.flac | торговец: крупная покупка | Leda | happy, warm | С таким покупателем и год не страшен. |
| trade_sell_0_v1_g.flac | торговец: скупает у героя | Sadachbia | businesslike, firm | Возьму. Цена честная, не спорь. |
| trade_sell_0_v1_f_g.flac | торговец: скупает у героя | Leda | businesslike, firm | Возьму. Цена честная, не спорь. |
| trade_sell_1_v1_g.flac | торговец: скупает у героя | Sadachbia | appraising, satisfied | Неплохая вещица. Держи золото. |
| trade_sell_1_v1_f_g.flac | торговец: скупает у героя | Leda | appraising, satisfied | Неплохая вещица. Держи золото. |
| trade_sell_2_v1_g.flac | торговец: скупает у героя | Sadachbia | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_2_v1_f_g.flac | торговец: скупает у героя | Leda | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_3_v1_g.flac | торговец: скупает у героя | Sadachbia | appraising, a bit grudging | Хм, сойдёт. Вот твои монеты. |
| trade_sell_3_v1_f_g.flac | торговец: скупает у героя | Leda | appraising, a bit grudging | Хм, сойдёт. Вот твои монеты. |
| trade_sell_4_v1_g.flac | торговец: скупает у героя | Sadachbia | eager, businesslike | По рукам. Ещё что-нибудь есть? |
| trade_sell_4_v1_f_g.flac | торговец: скупает у героя | Leda | eager, businesslike | По рукам. Ещё что-нибудь есть? |
| trade_sell_5_v1_g.flac | торговец: скупает у героя | Sadachbia | approving | Товар годный. Приноси ещё. |
| trade_sell_5_v1_f_g.flac | торговец: скупает у героя | Leda | approving | Товар годный. Приноси ещё. |
| trade_sell_6_v1_g.flac | торговец: скупает у героя | Sadachbia | wry, sighing | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_6_v1_f_g.flac | торговец: скупает у героя | Leda | wry, sighing | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_7_v1_g.flac | торговец: скупает у героя | Sadachbia | dry, grudging | Держи золото. Считай, повезло тебе. |
| trade_sell_7_v1_f_g.flac | торговец: скупает у героя | Leda | dry, grudging | Держи золото. Считай, повезло тебе. |
| trade_sell_8_v1_g.flac | торговец: скупает у героя | Sadachbia | playful, cheerful | Добро пожаловать на мой склад, вещица! |
| trade_sell_8_v1_f_g.flac | торговец: скупает у героя | Leda | playful, cheerful | Добро пожаловать на мой склад, вещица! |
| trade_sell_9_v1_g.flac | торговец: скупает у героя | Sadachbia | sly, firm | Возьму, если больше торговаться не станешь. |
| trade_sell_9_v1_f_g.flac | торговец: скупает у героя | Leda | sly, firm | Возьму, если больше торговаться не станешь. |
| trade_sell_10_v1_g.flac | торговец: скупает у героя | Sadachbia | curt, businesslike | Это пойдёт. Вот плата. |
| trade_sell_10_v1_f_g.flac | торговец: скупает у героя | Leda | curt, businesslike | Это пойдёт. Вот плата. |
| trade_sell_11_v1_g.flac | торговец: скупает у героя | Sadachbia | pleased, surprised | Как раз этого и не хватало. Беру. |
| trade_sell_11_v1_f_g.flac | торговец: скупает у героя | Leda | pleased, surprised | Как раз этого и не хватало. Беру. |
| trade_sell_big_0_v1_g.flac | торговец: скупает много | Sadachbia | amazed, amused | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_0_v1_f_g.flac | торговец: скупает много | Leda | amazed, amused | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_1_v1_g.flac | торговец: скупает много | Sadachbia | wry, sighing, amused | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_1_v1_f_g.flac | торговец: скупает много | Leda | wry, sighing, amused | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_2_v1_g.flac | торговец: скупает много | Sadachbia | surprised, agreeable | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_2_v1_f_g.flac | торговец: скупает много | Leda | surprised, agreeable | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_3_v1_g.flac | торговец: скупает много | Sadachbia | mock complaining, amused | Ты меня разоришь, но товар хорош. |
| trade_sell_big_3_v1_f_g.flac | торговец: скупает много | Leda | mock complaining, amused | Ты меня разоришь, но товар хорош. |
| trade_sell_big_4_v1_g.flac | торговец: скупает много | Sadachbia | wry, resigned | Опустошаешь мне кассу. Но беру всё. |
| trade_sell_big_4_v1_f_g.flac | торговец: скупает много | Leda | wry, resigned | Опустошаешь мне кассу. Но беру всё. |
| trade_poor_0_v1_g.flac | торговец: золота не хватает | Sadachbia | dry, matter-of-fact | Золота маловато. Доложишь — отдам. |
| trade_poor_0_v1_f_g.flac | торговец: золота не хватает | Leda | dry, matter-of-fact | Золота маловато. Доложишь — отдам. |
| trade_poor_1_v1_g.flac | торговец: золота не хватает | Sadachbia | firm, curt | Не хватает монет. Без денег не отдаю. |
| trade_poor_1_v1_f_g.flac | торговец: золота не хватает | Leda | firm, curt | Не хватает монет. Без денег не отдаю. |
| trade_poor_2_v1_g.flac | торговец: золота не хватает | Sadachbia | sympathetic, sighing | Эх, на это кошель тонковат. |
| trade_poor_2_v1_f_g.flac | торговец: золота не хватает | Leda | sympathetic, sighing | Эх, на это кошель тонковат. |
| trade_poor_3_v1_g.flac | торговец: золота не хватает | Sadachbia | firm, stern | В долг не торгую, не проси. |
| trade_poor_3_v1_f_g.flac | торговец: золота не хватает | Leda | firm, stern | В долг не торгую, не проси. |
| trade_poor_4_v1_g.flac | торговец: золота не хватает | Sadachbia | kindly, encouraging | Подкопи ещё немного и возвращайся. |
| trade_poor_4_v1_f_g.flac | торговец: золота не хватает | Leda | kindly, encouraging | Подкопи ещё немного и возвращайся. |
| trade_poor_5_v1_g.flac | торговец: золота не хватает | Sadachbia | wry, proverb | Даром только ветер в поле. |
| trade_poor_5_v1_f_g.flac | торговец: золота не хватает | Leda | wry, proverb | Даром только ветер в поле. |
| trade_refuse_0_v1_g.flac | торговец: не берёт | Sadachbia | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_0_v1_f_g.flac | торговец: не берёт | Leda | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_1_v1_g.flac | торговец: не берёт | Sadachbia | firm, curt | Нет, такое не беру. |
| trade_refuse_1_v1_f_g.flac | торговец: не берёт | Leda | firm, curt | Нет, такое не беру. |
| trade_refuse_2_v1_g.flac | торговец: не берёт | Sadachbia | dismissive, weary | Такого у меня и так полон склад. |
| trade_refuse_2_v1_f_g.flac | торговец: не берёт | Leda | dismissive, weary | Такого у меня и так полон склад. |
| trade_refuse_3_v1_g.flac | торговец: не берёт | Sadachbia | neutral, helpful | Не мой товар. Попробуй у соседа. |
| trade_refuse_3_v1_f_g.flac | торговец: не берёт | Leda | neutral, helpful | Не мой товар. Попробуй у соседа. |
| trade_bye_0_v1_g.flac | торговец: прощание после торга | Sadachbia | warm, friendly | Заходи ещё, всегда рад. |
| trade_bye_0_v1_f_g.flac | торговец: прощание после торга | Leda | warm, friendly | Заходи ещё, всегда рада. |
| trade_bye_1_v1_g.flac | торговец: прощание после торга | Sadachbia | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_1_v1_f_g.flac | торговец: прощание после торга | Leda | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_2_v1_g.flac | торговец: прощание после торга | Sadachbia | grateful, warm | Спасибо за торг. Не забывай меня. |
| trade_bye_2_v1_f_g.flac | торговец: прощание после торга | Leda | grateful, warm | Спасибо за торг. Не забывай меня. |
| trade_bye_3_v1_g.flac | торговец: прощание после торга | Sadachbia | cheerful, sly | Удачи! И помни, где лучшие цены. |
| trade_bye_3_v1_f_g.flac | торговец: прощание после торга | Leda | cheerful, sly | Удачи! И помни, где лучшие цены. |
| trade_bye_4_v1_g.flac | торговец: прощание после торга | Sadachbia | friendly, easygoing | Будешь рядом — загляни. |
| trade_bye_4_v1_f_g.flac | торговец: прощание после торга | Leda | friendly, easygoing | Будешь рядом — загляни. |
| trade_bye_5_v1_g.flac | торговец: прощание после торга | Sadachbia | polite, satisfied | Приятно было иметь дело. |
| trade_bye_5_v1_f_g.flac | торговец: прощание после торга | Leda | polite, satisfied | Приятно было иметь дело. |
| trade_regular_0_v1_g.flac | торговец: постоянному покупателю | Sadachbia | courteous, warm | Для постоянного покупателя — с поклоном. |
| trade_regular_0_v1_f_g.flac | торговец: постоянному покупателю | Leda | courteous, warm | Для постоянного покупателя — с поклоном. |
| trade_regular_1_v1_g.flac | торговец: постоянному покупателю | Sadachbia | warm, generous | Постоянным — от души. Приходи снова. |
| trade_regular_1_v1_f_g.flac | торговец: постоянному покупателю | Leda | warm, generous | Постоянным — от души. Приходи снова. |
| trade_regular_2_v1_g.flac | торговец: постоянному покупателю | Sadachbia | playful, laughing | Ещё немного — и я тебе медаль вручу. |
| trade_regular_2_v1_f_g.flac | торговец: постоянному покупателю | Leda | playful, laughing | Ещё немного — и я тебе медаль вручу. |
| trade_regular_3_v1_g.flac | торговец: постоянному покупателю | Sadachbia | amused, fond | Я твои покупки уже на память знаю. |
| trade_regular_3_v1_f_g.flac | торговец: постоянному покупателю | Leda | amused, fond | Я твои покупки уже на память знаю. |
| trade_regular_4_v1_g.flac | торговец: постоянному покупателю | Sadachbia | grateful, jovial | Вот кто меня кормит! Спасибо. |
| trade_regular_4_v1_f_g.flac | торговец: постоянному покупателю | Leda | grateful, jovial | Вот кто меня кормит! Спасибо. |
| quest_take_0_v1_g.flac | заказчик: даёт дело | Sadachbia | serious, confiding | Есть для тебя дело. Слушай внимательно. |
| quest_take_0_v1_f_g.flac | заказчик: даёт дело | Leda | serious, confiding | Есть для тебя дело. Слушай внимательно. |
| quest_take_1_v1_g.flac | заказчик: даёт дело | Sadachbia | earnest, hopeful | Выручишь — не забуду. Вот что нужно. |
| quest_take_1_v1_f_g.flac | заказчик: даёт дело | Leda | earnest, hopeful | Выручишь — не забуду. Вот что нужно. |
| quest_take_2_v1_g.flac | заказчик: даёт дело | Sadachbia | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_2_v1_f_g.flac | заказчик: даёт дело | Leda | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_3_v1_g.flac | заказчик: даёт дело | Sadachbia | earnest, a little worried | Мне нужна помощь. Вот в чём дело. |
| quest_take_3_v1_f_g.flac | заказчик: даёт дело | Leda | earnest, a little worried | Мне нужна помощь. Вот в чём дело. |
| quest_story_0_v1_g.flac | заказчик: сюжетное | Sadachbia | grave, meaningful | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_0_v1_f_g.flac | заказчик: сюжетное | Leda | grave, meaningful | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_1_v1_g.flac | заказчик: сюжетное | Sadachbia | serious, intense | От этого многое зависит. Не подведи. |
| quest_story_1_v1_f_g.flac | заказчик: сюжетное | Leda | serious, intense | От этого многое зависит. Не подведи. |
| quest_faction_0_v1_g.flac | заказчик: фракционное | Sadachbia | official, measured | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_0_v1_f_g.flac | заказчик: фракционное | Leda | official, measured | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_1_v1_g.flac | заказчик: фракционное | Sadachbia | dry, dutiful | Служба есть служба. Задание такое. |
| quest_faction_1_v1_f_g.flac | заказчик: фракционное | Leda | dry, dutiful | Служба есть служба. Задание такое. |
| quest_case_0_v1_g.flac | заказчик: расследование | Sadachbia | suspicious, lowered voice | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_0_v1_f_g.flac | заказчик: расследование | Leda | suspicious, lowered voice | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_1_v1_g.flac | заказчик: расследование | Sadachbia | sharp, investigative | Нужны улики, а не слухи. Поищешь? |
| quest_case_1_v1_f_g.flac | заказчик: расследование | Leda | sharp, investigative | Нужны улики, а не слухи. Поищешь? |
| quest_hunt_0_v1_g.flac | заказчик: охота | Sadachbia | grim, determined | Тварь повадилась. Выследи её и убей. |
| quest_hunt_0_v1_f_g.flac | заказчик: охота | Leda | grim, determined | Тварь повадилась. Выследи её и убей. |
| quest_hunt_1_v1_g.flac | заказчик: охота | Sadachbia | concerned, serious | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_1_v1_f_g.flac | заказчик: охота | Leda | concerned, serious | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_2_v1_g.flac | заказчик: охота | Sadachbia | cold, determined | Принеси мне весть, что она мертва. |
| quest_hunt_2_v1_f_g.flac | заказчик: охота | Leda | cold, determined | Принеси мне весть, что она мертва. |
| quest_delivery_0_v1_g.flac | заказчик: доставка | Sadachbia | businesslike, urgent | Груз нужно доставить. Ждут его давно. |
| quest_delivery_0_v1_f_g.flac | заказчик: доставка | Leda | businesslike, urgent | Груз нужно доставить. Ждут его давно. |
| quest_delivery_1_v1_g.flac | заказчик: доставка | Sadachbia | businesslike, reassuring | Довези товар целым — там заплатят. |
| quest_delivery_1_v1_f_g.flac | заказчик: доставка | Leda | businesslike, reassuring | Довези товар целым — там заплатят. |
| quest_craft_0_v1_g.flac | заказчик: ремесло | Sadachbia | appraising, friendly | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_0_v1_f_g.flac | заказчик: ремесло | Leda | appraising, friendly | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_1_v1_g.flac | заказчик: ремесло | Sadachbia | earnest, demanding | Сделай мне вещь — хорошую, на совесть. |
| quest_craft_1_v1_f_g.flac | заказчик: ремесло | Leda | earnest, demanding | Сделай мне вещь — хорошую, на совесть. |
| quest_diplom_0_v1_g.flac | заказчик: дипломатия | Sadachbia | thoughtful, measured | Тут словом надо, а не мечом. |
| quest_diplom_0_v1_f_g.flac | заказчик: дипломатия | Leda | thoughtful, measured | Тут словом надо, а не мечом. |
| quest_diplom_1_v1_g.flac | заказчик: дипломатия | Sadachbia | frustrated, hopeful | Поговори с ними. Меня они слушать не станут. |
| quest_diplom_1_v1_f_g.flac | заказчик: дипломатия | Leda | frustrated, hopeful | Поговори с ними. Меня они слушать не станут. |
| quest_study_0_v1_g.flac | заказчик: исследование | Sadachbia | curious, eager | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_0_v1_f_g.flac | заказчик: исследование | Leda | curious, eager | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_1_v1_g.flac | заказчик: исследование | Sadachbia | curious, instructive | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_study_1_v1_f_g.flac | заказчик: исследование | Leda | curious, instructive | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_archeo_0_v1_g.flac | заказчик: археология | Sadachbia | mysterious, low | Под землёй лежит старое. Подними его. |
| quest_archeo_0_v1_f_g.flac | заказчик: археология | Leda | mysterious, low | Под землёй лежит старое. Подними его. |
| quest_archeo_1_v1_g.flac | заказчик: археология | Sadachbia | intrigued, mysterious | Древность ждёт того, кто не побоится копать. |
| quest_archeo_1_v1_f_g.flac | заказчик: археология | Leda | intrigued, mysterious | Древность ждёт того, кто не побоится копать. |
| quest_faith_0_v1_g.flac | заказчик: религия | Sadachbia | reverent, solemn | Боги ждут знака. Исполни обет. |
| quest_faith_0_v1_f_g.flac | заказчик: религия | Leda | reverent, solemn | Боги ждут знака. Исполни обет. |
| quest_faith_1_v1_g.flac | заказчик: религия | Sadachbia | serene, earnest | Святое дело. Не для корысти — для души. |
| quest_faith_1_v1_f_g.flac | заказчик: религия | Leda | serene, earnest | Святое дело. Не для корысти — для души. |
| quest_magic_0_v1_g.flac | заказчик: магия | Sadachbia | uneasy, lowered voice | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_0_v1_f_g.flac | заказчик: магия | Leda | uneasy, lowered voice | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_1_v1_g.flac | заказчик: магия | Sadachbia | tense, mysterious | Сила неспокойна. Нужно её унять. |
| quest_magic_1_v1_f_g.flac | заказчик: магия | Leda | tense, mysterious | Сила неспокойна. Нужно её унять. |
| quest_war_0_v1_g.flac | заказчик: война | Sadachbia | urgent, grim | Война не ждёт. Нужны люди и припасы. |
| quest_war_0_v1_f_g.flac | заказчик: война | Leda | urgent, grim | Война не ждёт. Нужны люди и припасы. |
| quest_war_1_v1_g.flac | заказчик: война | Sadachbia | tense, pleading | Фронт близко. Помоги, чем сможешь. |
| quest_war_1_v1_f_g.flac | заказчик: война | Leda | tense, pleading | Фронт близко. Помоги, чем сможешь. |
| quest_rescue_0_v1_g.flac | заказчик: спасение | Sadachbia | anxious, pleading | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_0_v1_f_g.flac | заказчик: спасение | Leda | anxious, pleading | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_1_v1_g.flac | заказчик: спасение | Sadachbia | desperate, pleading | Вытащи его живым. Прошу тебя. |
| quest_rescue_1_v1_f_g.flac | заказчик: спасение | Leda | desperate, pleading | Вытащи его живым. Прошу тебя. |
| quest_econ_0_v1_g.flac | заказчик: экономика | Sadachbia | shrewd, businesslike | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_0_v1_f_g.flac | заказчик: экономика | Leda | shrewd, businesslike | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_1_v1_g.flac | заказчик: экономика | Sadachbia | brisk, urgent | Нужен товар. Много и быстро. |
| quest_econ_1_v1_f_g.flac | заказчик: экономика | Leda | brisk, urgent | Нужен товар. Много и быстро. |
| quest_random_0_v1_g.flac | заказчик: случайное | Sadachbia | casual, curious | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_0_v1_f_g.flac | заказчик: случайное | Leda | casual, curious | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_1_v1_g.flac | заказчик: случайное | Sadachbia | puzzled, honest | Странное дело, но заплачу честно. |
| quest_random_1_v1_f_g.flac | заказчик: случайное | Leda | puzzled, honest | Странное дело, но заплачу честно. |
| quest_secret_0_v1_g.flac | заказчик: скрытое | Sadachbia | whisper, conspiratorial | Только тихо. Об этом — никому. |
| quest_secret_0_v1_f_g.flac | заказчик: скрытое | Leda | whisper, conspiratorial | Только тихо. Об этом — никому. |
| quest_secret_1_v1_g.flac | заказчик: скрытое | Sadachbia | hushed, serious | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_secret_1_v1_f_g.flac | заказчик: скрытое | Leda | hushed, serious | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_type_fetch_0_v1_g.flac | заказчик: принести | Sadachbia | businesslike, clear | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_0_v1_f_g.flac | заказчик: принести | Leda | businesslike, clear | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_1_v1_g.flac | заказчик: принести | Sadachbia | worried, friendly | Запасы кончаются. Добудь, будь другом. |
| quest_type_fetch_1_v1_f_g.flac | заказчик: принести | Leda | worried, friendly | Запасы кончаются. Добудь, будь другом. |
| quest_type_kill_0_v1_g.flac | заказчик: очистить округу | Sadachbia | grim, urgent | Округу заполонили твари. Очисти её. |
| quest_type_kill_0_v1_f_g.flac | заказчик: очистить округу | Leda | grim, urgent | Округу заполонили твари. Очисти её. |
| quest_type_visit_0_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | uneasy, curious | Сходи туда и погляди, что там творится. |
| quest_type_visit_0_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | uneasy, curious | Сходи туда и погляди, что там творится. |
| quest_type_visit_1_v1_g.flac | заказчик: сходить и посмотреть | Sadachbia | worried, serious | Там неладно. Проверь и возвращайся. |
| quest_type_visit_1_v1_f_g.flac | заказчик: сходить и посмотреть | Leda | worried, serious | Там неладно. Проверь и возвращайся. |
| quest_full_0_v1_g.flac | заказчик: дел слишком много | Sadachbia | amused, refusing | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_0_v1_f_g.flac | заказчик: дел слишком много | Leda | amused, refusing | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_1_v1_g.flac | заказчик: дел слишком много | Sadachbia | firm, reasonable | Сперва закончи начатое, потом приходи. |
| quest_full_1_v1_f_g.flac | заказчик: дел слишком много | Leda | firm, reasonable | Сперва закончи начатое, потом приходи. |
| quest_full_2_v1_g.flac | заказчик: дел слишком много | Sadachbia | dry, friendly | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_full_2_v1_f_g.flac | заказчик: дел слишком много | Leda | dry, friendly | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_have_0_v1_g.flac | заказчик: дело уже взято | Sadachbia | patient, reminding | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_0_v1_f_g.flac | заказчик: дело уже взято | Leda | patient, reminding | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_1_v1_g.flac | заказчик: дело уже взято | Sadachbia | mildly impatient | Моё поручение и так при тебе. |
| quest_have_1_v1_f_g.flac | заказчик: дело уже взято | Leda | mildly impatient | Моё поручение и так при тебе. |
| quest_done_0_v1_g.flac | заказчик: дело сдано | Sadachbia | delighted, grateful | Сделано? Вот это дело! Держи награду. |
| quest_done_0_v1_f_g.flac | заказчик: дело сдано | Leda | delighted, grateful | Сделано? Вот это дело! Держи награду. |
| quest_done_1_v1_g.flac | заказчик: дело сдано | Sadachbia | grateful, sincere | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_1_v1_f_g.flac | заказчик: дело сдано | Leda | grateful, sincere | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_2_v1_g.flac | заказчик: дело сдано | Sadachbia | satisfied, businesslike | Честно заработано. Держи. |
| quest_done_2_v1_f_g.flac | заказчик: дело сдано | Leda | satisfied, businesslike | Честно заработано. Держи. |
| quest_done_3_v1_g.flac | заказчик: дело сдано | Sadachbia | proud, warm | Знал, что на тебя можно положиться. |
| quest_done_3_v1_f_g.flac | заказчик: дело сдано | Leda | proud, warm | Знала, что на тебя можно положиться. |
| quest_done_4_v1_g.flac | заказчик: дело сдано | Sadachbia | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_4_v1_f_g.flac | заказчик: дело сдано | Leda | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_5_v1_g.flac | заказчик: дело сдано | Sadachbia | respectful, warm | Слово своё держишь. Это ценю. |
| quest_done_5_v1_f_g.flac | заказчик: дело сдано | Leda | respectful, warm | Слово своё держишь. Это ценю. |
| street_guard_40_g.flac | стражник | Alnilam | brisk, commanding | Не толпимся, проходим! |
| street_guard_40_v1_g.flac | стражник | Orus | brisk, commanding | Не толпимся, проходим! |
| street_guard_40_v2_g.flac | стражник | Algenib | brisk, commanding | Не толпимся, проходим! |
| street_guard_41_g.flac | стражник | Alnilam | serious, watchful | Видел кого подозрительного — сразу к нам. |
| street_guard_41_v1_g.flac | стражник | Orus | serious, watchful | Видел кого подозрительного — сразу к нам. |
| street_guard_41_v2_g.flac | стражник | Algenib | serious, watchful | Видел кого подозрительного — сразу к нам. |
| street_guard_42_g.flac | стражник | Alnilam | tired, grumbling | Сапоги стоптал, а смена всё не кончается. |
| street_guard_42_v1_g.flac | стражник | Orus | tired, grumbling | Сапоги стоптал, а смена всё не кончается. |
| street_guard_42_v2_g.flac | стражник | Algenib | tired, grumbling | Сапоги стоптал, а смена всё не кончается. |
| street_guard_43_g.flac | стражник | Alnilam | stern, matter-of-fact | Ночью ворота закрыты. Кто не успел — ночует в поле. |
| street_guard_43_v1_g.flac | стражник | Orus | stern, matter-of-fact | Ночью ворота закрыты. Кто не успел — ночует в поле. |
| street_guard_43_v2_g.flac | стражник | Algenib | stern, matter-of-fact | Ночью ворота закрыты. Кто не успел — ночует в поле. |
| street_guard_44_g.flac | стражник | Alnilam | wary, firm | Держи руки на виду. Порядок такой. |
| street_guard_44_v1_g.flac | стражник | Orus | wary, firm | Держи руки на виду. Порядок такой. |
| street_guard_44_v2_g.flac | стражник | Algenib | wary, firm | Держи руки на виду. Порядок такой. |
| street_guard_45_g.flac | стражник | Alnilam | dry humor, gruff | Пьяных в канаву, драчунов в холодную. Всё по уставу. |
| street_guard_45_v1_g.flac | стражник | Orus | dry humor, gruff | Пьяных в канаву, драчунов в холодную. Всё по уставу. |
| street_guard_45_v2_g.flac | стражник | Algenib | dry humor, gruff | Пьяных в канаву, драчунов в холодную. Всё по уставу. |
| street_guard_46_g.flac | стражник | Alnilam | low, confiding | Капитан опять не в духе. Лучше ему не попадаться. |
| street_guard_46_v1_g.flac | стражник | Orus | low, confiding | Капитан опять не в духе. Лучше ему не попадаться. |
| street_guard_46_v2_g.flac | стражник | Algenib | low, confiding | Капитан опять не в духе. Лучше ему не попадаться. |
| street_guard_47_g.flac | стражник | Alnilam | concerned, serious | На тракте неспокойно. Один не ходи. |
| street_guard_47_v1_g.flac | стражник | Orus | concerned, serious | На тракте неспокойно. Один не ходи. |
| street_guard_47_v2_g.flac | стражник | Algenib | concerned, serious | На тракте неспокойно. Один не ходи. |
| street_guard_48_g.flac | стражник | Alnilam | stern, warning | Оружие в ножнах держи. Здесь город, а не поле боя. |
| street_guard_48_v1_g.flac | стражник | Orus | stern, warning | Оружие в ножнах держи. Здесь город, а не поле боя. |
| street_guard_48_v2_g.flac | стражник | Algenib | stern, warning | Оружие в ножнах держи. Здесь город, а не поле боя. |
| street_guard_49_g.flac | стражник | Alnilam | weary, wistful | Эх, горячего бы сейчас. Третий час на ветру. |
| street_guard_49_v1_g.flac | стражник | Orus | weary, wistful | Эх, горячего бы сейчас. Третий час на ветру. |
| street_guard_49_v2_g.flac | стражник | Algenib | weary, wistful | Эх, горячего бы сейчас. Третий час на ветру. |
| street_guard_50_g.flac | стражник | Alnilam | impatient, brisk | Проходи, проходи, не задерживай. |
| street_guard_50_v1_g.flac | стражник | Orus | impatient, brisk | Проходи, проходи, не задерживай. |
| street_guard_50_v2_g.flac | стражник | Algenib | impatient, brisk | Проходи, проходи, не задерживай. |
| quest_word_0_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_0_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_0_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_0_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_0_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_0_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палата мастерских открыла наряд: печам недостаёт руды, а плавку останавливать нельзя. |
| quest_word_1_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_1_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_1_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_1_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_1_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_1_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В старой штольне сорвалась печать, и работа пошла разрушением. Палата платит за остановленного голема. |
| quest_word_2_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_2_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_2_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_2_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_2_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_2_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Голос Пика велит проверить дальний перевал: если оттуда идёт дым, империя должна знать раньше соседей. |
| quest_word_3_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_3_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_3_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_3_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_3_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_3_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Гильдия травников выкупает укос: корона объявила войну, а гильдии решают, чем её кормить. |
| quest_word_4_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_4_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_4_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_4_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_4_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_4_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На речной тракт сел разбойник и берёт с барж больше короны. Гильдии платят за одного такого. |
| quest_word_5_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_5_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_5_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_5_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_5_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_5_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Совет гильдий держит округу чистой не мечом, а счётом: столько-то тварей — столько-то серебра. |
| quest_word_6_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_6_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_6_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_6_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_6_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_6_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сход не приказывает, а уговаривает: принесите грибов, и о вас будут говорить как о своём. |
| quest_word_7_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_7_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_7_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_7_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_7_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_7_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У гати снова плачет банши, и перевалка встала. Уговор простой: тише станет — заплатят. |
| quest_word_8_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_8_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_8_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_8_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_8_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_8_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Никто не помнит, чья это тропа. Сход просит дойти и послушать: если там кто-то встал, договор о проходе придётся переписать. |
| quest_word_9_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_9_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_9_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_9_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_9_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_9_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам нужен кристалл: договор с духами воды перезаключают, а дары к нему готовят заранее. |
| quest_word_10_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_10_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_10_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_10_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_10_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_10_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Караванная тропа обрывается там, где под песком идёт исполин. Халиф платит не за храбрость, а за тишину под ногами. |
| quest_word_11_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_11_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_11_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_11_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_11_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_11_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг Имён просит дойти до дальнего оазиса и назвать его вслух: имя, которое некому произнести, теряется. |
| quest_word_12_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_12_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_12_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_12_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_12_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_12_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Ледники держат чужие запасы, а свои резчики сидят без кости. Роспись открыта до конца зимы. |
| quest_word_13_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_13_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_13_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_13_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_13_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_13_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Василиск застудил колодец на зимней дороге. Стужный совет платит зимой, каган — летом; вам заплатят сегодня. |
| quest_word_14_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_14_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_14_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_14_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_14_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_14_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зимняя дорога держится, пока по ней ходят. Совет платит за расчищенные переходы, а не за подвиги. |
| quest_word_15_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_15_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_15_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_15_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_15_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_15_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Верфи скупают ракушку на клей и перламутр: голос на сходе имеет тот, кто владеет килем, а киль надо чем-то смолить. |
| quest_word_16_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_16_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_16_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_16_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_16_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_16_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен встал на мелководье и держит лоцманскую проводку. Республика платит долей, как за поднятое судно. |
| quest_word_17_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_17_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_17_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_17_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_17_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_17_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Адмирала выбирают на один поход, а промеры делают заранее. Дойдите до отметки и вернитесь — этого хватит. |
| quest_word_18_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_18_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_18_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_18_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_18_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_18_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кулак Орды держит власть, пока тридцать племён заняты делом. Займитесь и вы: столько-то тварей — и вас запомнят. |
| quest_word_19_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_19_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_19_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_19_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_19_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_19_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огр отбился от загона и жрёт дань с троп. Орда платит за него, как за пойманного зверя, — и добавляет за скорость. |
| quest_word_20_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_20_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_20_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_20_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_20_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_20_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Костяным шаманам нужна кость: боевых зверей не выкормишь одним мясом. |
| quest_word_21_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_21_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_21_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_21_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_21_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_21_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Круг разрешил взять сушняк: право на сбор здесь стоит дороже самой древесины, и вам его дают даром. |
| quest_word_22_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_22_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_22_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_22_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_22_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_22_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У энта срубили рощу, и гнев его продлится столько, сколько росло дерево. Круг решил не ждать так долго. |
| quest_word_23_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_23_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_23_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_23_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_23_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_23_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Границы Чащи проходят там, докуда достаёт корень. Дойдите до отметки: Круг хочет знать, отвечает ли корень оттуда. |
| quest_word_24_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_24_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_24_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_24_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_24_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_24_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большая плавка назначена на послезавтра, и руды под неё недобрано. Синод считает не людей, а вес: принесите вес. |
| quest_word_25_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_25_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_25_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_25_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_25_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_25_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На каменоломне поселился тролль и берёт пошлину камнем. Пошлину здесь платят только Синоду. |
| quest_word_26_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_26_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_26_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_26_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_26_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_26_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Якорь, отлитый прошлой зимой, лежит непринятым у дальнего мыса. Дойдите и посмотрите, цела ли проушина. |
| quest_word_27_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_27_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_27_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_27_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_27_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_27_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзу для большого отвеса отлить не из чего: кристалл нужен чистый, без жилы. |
| quest_word_28_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_28_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_28_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_28_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_28_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_28_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У обсерватории завёлся призрак и сбивает счёт: отвес при нём качается сам. |
| quest_word_29_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_29_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_29_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_29_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_29_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_29_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На дальней отметке стоит запасной столб. Палата назначила срок проверить его — и срок этот кончается. |
| quest_word_30_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_30_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_30_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_30_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_30_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_30_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перекладным нужен корм, а трава на этом отрезке выбита начисто: до следующего двора её не хватит. |
| quest_word_31_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_31_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_31_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_31_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_31_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_31_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На повороте у колодца обоз ждут не колодец, а разбойники. Сход постановил, что это дело проезжего. |
| quest_word_32_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_32_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_32_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_32_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_32_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_32_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Новый двор поставлен на отметке, но вестей от него нет третью неделю. Дойдите и посмотрите, стоит ли он вообще. |
| quest_word_33_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_33_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_33_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_33_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_33_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_33_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Горло вулкана обкладывают заново, и камня под обкладку недостаёт. Без обкладки стекло не варят. |
| quest_word_34_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_34_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_34_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_34_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_34_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_34_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В карьере завёлся василиск, и рабочие туда не спускаются. Держатель горла спускаться тоже не станет. |
| quest_word_35_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_35_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_35_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_35_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_35_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_35_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отметке была застава, пока её не засыпало пеплом в третий раз. Дойдите и скажите, видно ли ещё крышу. |
| quest_word_36_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_36_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_36_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_36_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_36_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_36_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Выпарным чанам нужен огонь, а на солончаке не растёт ни куста. Дворы проголосовали солью: дрова везти чужаку. |
| quest_word_37_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_37_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_37_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_37_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_37_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_37_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной василиск лёг у старого чана, и кто на него взглянул, тот треснул, как такыр. Чаша «да» полна: платят за него. |
| quest_word_38_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_38_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_38_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_38_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_38_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_38_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сигнальное зеркало на дальней башне молчит третий день. Дворы хотят знать: башня разбита или смотритель уснул. |
| quest_word_39_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_39_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_39_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_39_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_39_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_39_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Вече решило запасти грибов на зиму — решало с весны, так что зима уже близко. Приносите, пока мох не высох. |
| quest_word_40_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_40_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_40_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_40_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_40_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_40_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Мшистый тролль проснулся злым и разворотил гать. Вече долго думало и решило, что думать тут нечего. |
| quest_word_41_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_41_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_41_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_41_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_41_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_41_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На тропах к торфянику расплодились твари. Мшанники за скорое дело не берутся, а вот чужаку заплатят с каждой головы. |
| quest_word_42_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_42_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_42_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_42_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_42_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_42_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отражённый царь велел отшлифовать новое зеркало, дневной подписал. Указ в силе, а кристалла для шлифовки нет. |
| quest_word_43_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_43_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_43_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_43_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_43_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_43_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зеркальный голем в старой мастерской возвращает чары тому, кто их послал. Цари согласились: его надо остановить мечом. |
| quest_word_44_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_44_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_44_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_44_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_44_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_44_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В долине заметили третье небо — лишнее. Указ велит дойти до отметки и сказать, сколько небес видно оттуда. |
| quest_word_45_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_45_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_45_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_45_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_45_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_45_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смолокурни стоят: сосну на подсочку рубить нельзя, а сушняка под котлы нужно втрое. Круг принимает любое дерево. |
| quest_word_46_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_46_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_46_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_46_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_46_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_46_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Смоляной медведь обвалялся в смоле до брони и разоряет подсочку. Стрела его не берёт — круг ищет того, кто возьмёт. |
| quest_word_47_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_47_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_47_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_47_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_47_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_47_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бору стало шумно: твари сбегаются на запах живицы. Круг платит за тишину на просеках, по голове за раз. |
| quest_word_48_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_48_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_48_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_48_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_48_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_48_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Грозовая гарпия села на вестовую тропу, и весть с круч третий день не доходит вниз. Воронцы платят за тропу. |
| quest_word_49_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_49_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_49_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_49_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_49_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_49_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Молния ударила в дальний утёс дважды в одно место — у воронцов это к переменам. Гнездо просит дойти и посмотреть, что там открылось. |
| quest_word_50_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_50_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_50_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_50_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_50_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_50_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | После грозы обвалило гнездовой карниз. Воронцы клеят новый на камень и глину, а камня наверху не набрать. |
| quest_word_51_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_51_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_51_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_51_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_51_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_51_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Жильный тролль грызёт светлую жилу, как каменноед, только делиться не умеет. Без жилы гаснут подземные фонари. |
| quest_word_52_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_52_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_52_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_52_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_52_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_52_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Светлячники держат фонари на рудной пыли, и в нижнем ходу её не осталось. Наряд примет любую руду, лишь бы с блеском. |
| quest_word_53_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_53_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_53_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_53_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_53_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_53_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В тёмных ходах, где фонари уже погасли, завелись твари. Светлячники платят за каждую, чтобы можно было зажечь свет снова. |
| quest_word_54_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_54_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_54_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_54_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_54_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_54_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Туров гонят на зимние выпасы, а сена на перевальных дворах не запасли. Рогачи платят шерстью за каждую вязанку. |
| quest_word_55_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_55_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_55_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_55_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_55_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_55_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Перевальный огр грабит караваны, прикрываясь украденным туром. Дворы договорились: огра не жалеть, тура вернуть. |
| quest_word_56_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_56_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_56_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_56_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_56_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_56_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальнего пастбища не вернулся пастух, а его тур пришёл один. Уговор велит дойти до отметки и посмотреть, что там. |
| quest_word_57_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_57_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_57_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_57_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_57_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_57_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Узловой паук оплёл дорогу между станами, и в его сетях застревает даже звук. Восьмирукие платят за чистую дорогу. |
| quest_word_58_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_58_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_58_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_58_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_58_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_58_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Нить красят ягодным соком, и в этот раз красильщицы извели весь запас. Узел примет любые ягоды, лишь бы тёмные. |
| quest_word_59_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_59_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_59_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_59_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_59_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_59_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Твари повадились рвать сушильные сети на краю станов. Восьмирукие считают дыры и платят за каждую тварь, что их больше не порвёт. |
| quest_word_60_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_60_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_60_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_60_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_60_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_60_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В летописи сказано, что сто лет назад у дальней отметки стоял камень. Мудрецы не торопятся, но проверить хотят при этой жизни. |
| quest_word_61_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_61_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_61_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_61_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_61_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_61_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Летописи пишут на тонких створках, и последняя кончилась на полуслове. Панцири ждут ракушку, чтобы дописать фразу. |
| quest_word_62_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_62_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_62_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_62_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_62_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_62_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Соляной змей греется на тропе к архиву, и старые мудрецы обходят его третью неделю. Им не к спеху, но архив ждёт. |
| quest_word_63_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_63_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_63_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_63_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_63_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_63_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Барханный червь вышел под солнечную тропу, и скарабеи катят солнце в обход, теряя полдня. Скат платит за прямой путь. |
| quest_word_64_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_64_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_64_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_64_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_64_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_64_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Стеклодувам дюн нужен камень под печь — песок они возьмут сами, а камня в барханах нет на три дня пути. |
| quest_word_65_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_65_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_65_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_65_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_65_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_65_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки солнце садится не туда, куда его катили. Скарабеи хотят знать, не сдвинулся ли горизонт. |
| quest_word_66_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_66_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_66_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_66_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_66_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_66_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Завесный призрак вышел из остатка Стены и шепчет караванщикам их вчерашние мысли. Стража шва платит за тишину. |
| quest_word_67_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_67_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_67_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_67_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_67_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_67_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там, где стояла Стена, открылся новый проход. Обет велит дойти до отметки и сказать, держится ли туман по краям. |
| quest_word_68_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_68_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_68_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_68_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_68_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_68_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У шва собираются твари с обеих сторон, и ни одна не знает, где ей место. Стража платит за каждую, кто этот спор закончит. |
| quest_word_69_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_69_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_69_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_69_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_69_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_69_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разбойник в краденой маске обирает норные лавки и выдаёт себя за рыжехвоста. Купцы платят, чтобы маску сняли вместе с головой. |
| quest_word_70_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_70_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_70_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_70_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_70_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_70_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медовые рыжехвосты варят наливку на продажу, а ягод этой осенью мало. Купцы берут всё и платят долей с торга. |
| quest_word_71_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_71_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_71_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_71_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_71_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_71_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки открылась чужая нора с чужим товаром. Купцы хотят знать, кто торгует на их холмах без спросу. |
| quest_word_72_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_72_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_72_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_72_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_72_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_72_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Большой колокол треснул на вечернем звоне. Палата льёт новый, и меди на него нужно больше, чем осталось в городе. |
| quest_word_73_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_73_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_73_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_73_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_73_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_73_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звонный голем ходит по равнине, и каждый удар по нему гудит так, что башни сбиваются с лада. Палата платит за тишину. |
| quest_word_74_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_74_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_74_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_74_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_74_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_74_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Дальняя башня звонит не в лад, хотя звонаря там нет с весны. Палата просит дойти и послушать, кто тянет верёвку. |
| quest_word_75_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_75_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_75_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_75_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_75_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_75_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Корень-страж вышел из-под земли и не узнаёт садовников. Совет просит остановить его, пока он не прошёл сквозь грядки. |
| quest_word_76_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_76_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_76_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_76_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_76_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_76_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подземные сады держатся на грибнице, а её подъели кроты. Совет примет любые грибы для новой закладки. |
| quest_word_77_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_77_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_77_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_77_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_77_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_77_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В нижних ходах завелись твари и грызут корни. Корневики платят за каждую, но просят не топтать грядки. |
| quest_word_78_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_78_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_78_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_78_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_78_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_78_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бессонная мотыльница летит на лампы чтецов и гасит их пыльцой. После неё видят сны наяву — а чтецы не спят нарочно. |
| quest_word_79_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_79_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_79_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_79_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_79_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_79_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Линзы для ночного чтения треснули от холода. Совиноглазые шлифуют новые, если найдётся чистый кристалл. |
| quest_word_80_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_80_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_80_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_80_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_80_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_80_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки по ночам виден свет, которого нет на звёздной карте. Чтецы хотят, чтобы кто-то дошёл и посмотрел вблизи. |
| quest_word_81_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_81_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_81_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_81_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_81_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_81_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Очаг треснул от жара, и его перекладывают. Жаровики ждут камня, который не лопнет в огне, — обычного на равнине нет. |
| quest_word_82_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_82_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_82_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_82_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_82_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_82_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Угольный дракон дышит жаром над шахтами, и металл в руках краснеет сам. Очаги платят закалкой тому, кто его уймёт. |
| quest_word_83_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_83_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_83_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_83_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_83_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_83_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Зольные твари лезут к печам воровать уголь. Жаровики платят за каждую — но не углём, уголь самим нужен. |
| quest_word_84_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_84_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_84_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_84_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_84_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_84_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Шхерная гарпия таскает рыбу из лунок и пугает детей. Нерпичи ныряют под лёд, но в небе драться не умеют. |
| quest_word_85_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_85_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_85_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_85_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_85_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_85_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Подлёдные ловушки плетут из жил и ракушечных грузил. Грузила ушли на дно вместе с сетью — нужны новые. |
| quest_word_86_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_86_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_86_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_86_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_86_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_86_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней шхеры лёд треснул крестом, и нерпичи говорят, что так трескается над кракеном. Проверьте, прежде чем туда пойдут ловцы. |
| quest_word_87_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен поднимается там, где кит-город прошёл вчера, и цепляет за борта. Сход решил: город не свернёт, пусть свернёт кракен. |
| quest_word_87_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен поднимается там, где кит-город прошёл вчера, и цепляет за борта. Сход решил: город не свернёт, пусть свернёт кракен. |
| quest_word_87_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен поднимается там, где кит-город прошёл вчера, и цепляет за борта. Сход решил: город не свернёт, пусть свернёт кракен. |
| quest_word_87_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кракен поднимается там, где кит-город прошёл вчера, и цепляет за борта. Сход решил: город не свернёт, пусть свернёт кракен. |
| quest_word_88_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_88_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_88_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_88_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_88_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_88_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Палубы на ките латают деревом, а в открытом море его не найти. Сход берёт любое — и платит амброй. |
| quest_word_89_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_89_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_89_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_89_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_89_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_89_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кит-город идёт к дальней отметке, а лоцман говорит, что там мель. Сход просит дойти первым и промерить. |
| quest_word_90_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_90_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_90_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_90_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_90_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_90_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Рифовый змей засел в расщелине над садком и бьёт всякого, кто подплывёт. Кораллиды платят жемчугом за свободный садок. |
| quest_word_91_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_91_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_91_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_91_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_91_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_91_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Кораллы растут на кристаллической затравке. Рифоводы начали новый риф, а затравки хватило на половину. |
| quest_word_92_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_92_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_92_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_92_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_92_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_92_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | На отмели расплодились твари и объедают молодой коралл. Рифоводы платят за каждую, кто перестанет есть. |
| quest_word_93_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_93_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_93_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_93_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_93_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_93_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Медузий скат парит над водой и жалит тех, кто зажигает огни. Медузники зовут его родичем, но платят за его уход. |
| quest_word_94_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_94_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_94_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_94_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_94_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_94_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В дальней бухте вода погасла — впервые на памяти медузников. Совет хочет знать, что забрало свет. |
| quest_word_95_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_95_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_95_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_95_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_95_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_95_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Огни в лампах держатся в ракушечных чашах. Чаши бьются, а новых на эту бухту не хватает. |
| quest_word_96_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_96_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_96_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_96_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_96_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_96_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буревестный виверн проснулся в штиль, и будить его было нельзя. Теперь он злой и спит на лоцманской скале. |
| quest_word_97_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_97_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_97_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_97_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_97_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_97_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Буря выбросила на скалы тварей из глубины, и они не уходят обратно. Лоцманы платят за чистый берег, по голове. |
| quest_word_98_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_98_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_98_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_98_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_98_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_98_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Штормом снесло спасательные мостки на скалах. Буревестники строят новые, а дерево сюда привозят только с Круга. |
| quest_word_99_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_99_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_99_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_99_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_99_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_99_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бухтовая банши плачет в пустые раковины, и те отвечают ей хором. Хранители просят унять плач, пока раковины не забыли свои голоса. |
| quest_word_100_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_100_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_100_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_100_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_100_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_100_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | В бухте подросли дети, и каждому нужна своя раковина. Хранители примут все, какие найдутся, — пустые, без чужих голосов. |
| quest_word_101_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_101_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_101_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_101_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_101_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_101_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | С дальней отметки раковины приносят шёпот на незнакомом наречии. Уговор велит дойти и послушать самим. |
| quest_word_102_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_102_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_102_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_102_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_102_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_102_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Облачный рух свил гнездо на счётной площадке и уносит инструменты, как ягнят. Небоглазы платят картой за свободное небо. |
| quest_word_103_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_103_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_103_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_103_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_103_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_103_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Звезда над дальней отметкой сместилась на палец. Счислители хотят, чтобы кто-то встал там и сверил её с картой. |
| quest_word_104_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_104_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_104_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_104_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_104_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_104_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отвес для звёздного счёта должен стоять на камне, а остров сложен из рыхлого туфа. Нужен твёрдый камень. |
| quest_word_105_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_105_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_105_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_105_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_105_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_105_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маскарадный гоблин украл посольскую маску и кричит из-под неё чужими голосами. Масочники платят за маску; гоблина можно не возвращать. |
| quest_word_106_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_106_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_106_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_106_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_106_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_106_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Маски режут из кости и лакируют смолой. Мастерская получила заказ на двенадцать лиц, а кости хватит на три. |
| quest_word_107_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_107_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_107_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_107_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_107_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_107_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У дальней отметки видели человека в маске, которой не делали. Масочники хотят знать, кто снял с них мерку. |
| quest_word_108_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Застава считает всё, что идёт к разлому. Всё, кроме того, что идёт под ней. Принеси три кристалла — дальше не твоя забота. |
| quest_word_108_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Застава считает всё, что идёт к разлому. Всё, кроме того, что идёт под ней. Принеси три кристалла — дальше не твоя забота. |
| quest_word_108_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Застава считает всё, что идёт к разлому. Всё, кроме того, что идёт под ней. Принеси три кристалла — дальше не твоя забота. |
| quest_word_108_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Застава считает всё, что идёт к разлому. Всё, кроме того, что идёт под ней. Принеси три кристалла — дальше не твоя забота. |
| quest_word_109_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_109_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_109_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_109_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_109_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_109_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За Гранью пепел валяется под ногами, а на Грани за него дают, как за серебро. Три меры. Не открывай мешок на свету. |
| quest_word_110_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один мой человек занял у тех, кто за Гранью. Занял костью, отдаёт рудой. Четыре меры — и он снова мой, а не их. |
| quest_word_110_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один мой человек занял у тех, кто за Гранью. Занял костью, отдаёт рудой. Четыре меры — и он снова мой, а не их. |
| quest_word_110_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один мой человек занял у тех, кто за Гранью. Занял костью, отдаёт рудой. Четыре меры — и он снова мой, а не их. |
| quest_word_111_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_111_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_111_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_111_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_111_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_111_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | У меня девять имён и два тела. Пройди к разлому и убей три твари, что там кормятся: если они сыты, остальные семеро не выйдут никогда. |
| quest_word_112_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_112_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_112_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_112_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_112_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_112_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Разлом не заткнёшь, но подход к нему сузить можно. Пять мер камня — и смена перестанет умирать по одному. |
| quest_word_113_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_113_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_113_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_113_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_113_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_113_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Один ушёл и вышел не там. Дойди до отметки и посмотри, что от него осталось. Мне нужно знать, вычёркивать его или искать. |
| quest_word_114_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_114_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_114_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_114_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_114_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_114_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Отнеси слово туда, где меня ещё ждут. Не имя — только слово. Они поймут, что я жив, и перестанут искать. |
| quest_word_115_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_115_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_115_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_115_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_115_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_115_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Сотник берёт травой: у него половина смены кашляет кровью. Четыре меры — и он меня не видел. |
| quest_word_116_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пошли двое. Не люди — то, чем застава ищет. Убей их, и я исчезну по-настоящему. |
| quest_word_116_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пошли двое. Не люди — то, чем застава ищет. Убей их, и я исчезну по-настоящему. |
| quest_word_116_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пошли двое. Не люди — то, чем застава ищет. Убей их, и я исчезну по-настоящему. |
| quest_word_117_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_117_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_117_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_117_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_117_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_117_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Доведи меня до отметки у разлома. Дальше я сам. На Грани меня ждёт верёвка, а за Гранью хотя бы спрашивают имя. |
| quest_word_118_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_118_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_118_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_118_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_118_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_118_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Судья берёт не золотом — золото записывают. Три меры ягод в корзине, и приговор полежит до весны. |
| quest_word_119_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Меня осудили за двоих. Тех двоих я не трогал, но знаю, кто. Убей двух тварей у их двора — они поймут. |
| quest_word_120_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_120_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_120_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_120_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_120_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_120_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Там остались трое из моего дома. Дойди до отметки и оставь знак: они выйдут сами, если поймут, что есть куда. |
| quest_word_121_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_121_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_121_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_121_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_121_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_121_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | Бог, которому я отвечаю, берёт костью. Четыре меры — и он подождёт до полнолуния. Не спрашивай, чьей. |
| quest_word_122_g.flac | заказчик: слово поручения | Umbriel | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| quest_word_122_f_g.flac | заказчик: слово поручения | Despina | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| quest_word_122_v1_g.flac | заказчик: слово поручения | Sadachbia | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| quest_word_122_v1_f_g.flac | заказчик: слово поручения | Leda | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| quest_word_122_v2_g.flac | заказчик: слово поручения | Schedar | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| quest_word_122_v2_f_g.flac | заказчик: слово поручения | Aoede | speaking as a quest giver, explaining the task to a traveller; natural, earnest, clear | За мной пришло то, что носит моё лицо. Убей его. Если ошибёшься, я тебя пойму и не обижусь. |
| r6_0_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_0_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_1_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_1_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_2_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_2_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_3_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_3_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_4_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_4_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_5_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_5_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_6_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_6_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_7_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_7_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_8_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_8_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_9_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_9_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_10_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_10_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_11_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_11_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_12_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_12_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_13_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_13_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_14_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_14_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_15_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Умеете вы сказать. Ладно, уступлю. |
| r6_16_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_16_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_17_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_17_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_18_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_18_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_19_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_19_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_20_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_20_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_21_g.flac | ответ в разговоре | Umbriel | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_21_f_g.flac | ответ в разговоре | Despina | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_22_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_22_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_23_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_23_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_24_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_24_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_25_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Слышал я про обоз на тракте. Вам — втридорога. |
| r6_25_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Слышала я про обоз на тракте. Вам — втридорога. |
| r6_26_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_26_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_27_g.flac | ответ в разговоре | Umbriel | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_27_f_g.flac | ответ в разговоре | Despina | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_28_g.flac | ответ в разговоре | Umbriel | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_28_f_g.flac | ответ в разговоре | Despina | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_29_g.flac | ответ в разговоре | Umbriel | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_29_f_g.flac | ответ в разговоре | Despina | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_30_g.flac | ответ в разговоре | Umbriel | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_30_f_g.flac | ответ в разговоре | Despina | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_31_g.flac | ответ в разговоре | Umbriel | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r6_31_f_g.flac | ответ в разговоре | Despina | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r6_0_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_0_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_1_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_1_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_2_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_2_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_3_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_3_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_4_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_4_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_5_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_5_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_6_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_6_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_7_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_7_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_8_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_8_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_9_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_9_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_10_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_10_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_11_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_11_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_12_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_12_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_13_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_13_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_14_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_14_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_15_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Умеете вы сказать. Ладно, уступлю. |
| r6_16_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_16_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_17_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_17_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_18_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_18_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_19_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_19_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_20_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_20_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_21_v1_g.flac | ответ в разговоре | Sadachbia | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_21_v1_f_g.flac | ответ в разговоре | Leda | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_22_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_22_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_23_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_23_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_24_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_24_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_25_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Слышал я про обоз на тракте. Вам — втридорога. |
| r6_25_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Слышала я про обоз на тракте. Вам — втридорога. |
| r6_26_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_26_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_27_v1_g.flac | ответ в разговоре | Sadachbia | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_27_v1_f_g.flac | ответ в разговоре | Leda | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_28_v1_g.flac | ответ в разговоре | Sadachbia | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_28_v1_f_g.flac | ответ в разговоре | Leda | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_29_v1_g.flac | ответ в разговоре | Sadachbia | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_29_v1_f_g.flac | ответ в разговоре | Leda | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_30_v1_g.flac | ответ в разговоре | Sadachbia | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_30_v1_f_g.flac | ответ в разговоре | Leda | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_31_v1_g.flac | ответ в разговоре | Sadachbia | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r6_31_v1_f_g.flac | ответ в разговоре | Leda | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r6_0_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_0_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Не лезьте в чужие дела — дороже выйдет. |
| r6_1_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_1_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Я вас просил? Нет. Вот и считайте теперь. |
| r6_2_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_2_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Соседей мирить — не ваше ремесло. А моё — считать. |
| r6_3_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_3_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Ещё раз сунетесь между нами — и вовсе не продам. |
| r6_4_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_4_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Посмешищем меня выставили перед соседом. Запомню. |
| r6_5_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_5_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Спасибо, что помирили. Для вас — по-соседски. |
| r6_6_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_6_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Давно бы так. Вам — уступлю. |
| r6_7_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_7_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Камень с души. Берите, не торгуясь. |
| r6_8_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_8_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Вот и ладно. С вас теперь меньше. |
| r6_9_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_9_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Рассорили нас — и довольны? Платите теперь сполна. |
| r6_10_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_10_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Я знаю, чьих рук дело. Цена для вас другая. |
| r6_11_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_11_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | С такими, как вы, торгую дороже. |
| r6_12_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_12_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Разговор вышел скверный. И цена под стать. |
| r6_13_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_13_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Не так со мной говорят. Это вам будет стоить. |
| r6_14_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_14_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Хотите по-хорошему — ведите себя по-хорошему. |
| r6_15_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Умеете вы сказать. Ладно, уступлю. |
| r6_15_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Умеете вы сказать. Ладно, уступлю. |
| r6_16_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_16_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Убедили. Для вас — дешевле. |
| r6_17_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_17_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Слово ваше крепкое. Берите по своей цене. |
| r6_18_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_18_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Вы сдержали слово — и я сдержу: вам дешевле. |
| r6_19_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_19_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Не забуду. Пока я здесь — вам скидка. |
| r6_20_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_20_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Таким людям и продавать приятно. Уступаю. |
| r6_21_v2_g.flac | ответ в разговоре | Schedar | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_21_v2_f_g.flac | ответ в разговоре | Aoede | grateful, warm, friendly | Дело сделано честно. И цена вам будет честная. |
| r6_22_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_22_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Обещали и бросили. Теперь не обессудьте. |
| r6_23_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_23_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Я на вас рассчитывал. Зря, видно. |
| r6_24_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_24_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Брошенное дело дорого стоит — вам. |
| r6_25_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Слышал я про обоз на тракте. Вам — втридорога. |
| r6_25_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Слышала я про обоз на тракте. Вам — втридорога. |
| r6_26_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_26_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | С грабителями дел не веду. Разве что за двойную цену. |
| r6_27_v2_g.flac | ответ в разговоре | Schedar | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_27_v2_f_g.flac | ответ в разговоре | Aoede | resentful, cold, bitter | Деньги-то у вас, небось, обозные? Плачено будет сполна. |
| r6_28_v2_g.flac | ответ в разговоре | Schedar | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_28_v2_f_g.flac | ответ в разговоре | Aoede | caring, gentle healer, calm | Мёртвых я не лечу — моё ремесло для живых. Ищи склеп и ночь, или зелье. |
| r6_29_v2_g.flac | ответ в разговоре | Schedar | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_29_v2_f_g.flac | ответ в разговоре | Aoede | caring, gentle healer, calm | Лечить нечего — ни раны, ни яда. |
| r6_30_v2_g.flac | ответ в разговоре | Schedar | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_30_v2_f_g.flac | ответ в разговоре | Aoede | caring, gentle healer, calm | Вот и всё. Рана чистая, повязка тугая — береги её. |
| r6_31_v2_g.flac | ответ в разговоре | Schedar | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r6_31_v2_f_g.flac | ответ в разговоре | Aoede | caring, gentle healer, calm | Держись. Отвар горький, зато к утру будешь на ногах. |
| r7_0_g.flac | ответ в разговоре | Umbriel | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_0_f_g.flac | ответ в разговоре | Despina | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_1_g.flac | ответ в разговоре | Umbriel | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_1_f_g.flac | ответ в разговоре | Despina | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_2_g.flac | ответ в разговоре | Umbriel | patient, experienced craft teacher, calm | Вашему народу я не должен, а вам — тем более. |
| r7_2_f_g.flac | ответ в разговоре | Despina | patient, experienced craft teacher, calm | Вашему народу я не должна, а вам — тем более. |
| r7_3_g.flac | ответ в разговоре | Umbriel | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_3_f_g.flac | ответ в разговоре | Despina | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_4_g.flac | ответ в разговоре | Umbriel | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_4_f_g.flac | ответ в разговоре | Despina | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_5_g.flac | ответ в разговоре | Umbriel | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r7_5_f_g.flac | ответ в разговоре | Despina | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r7_0_v1_g.flac | ответ в разговоре | Sadachbia | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_0_v1_f_g.flac | ответ в разговоре | Leda | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_1_v1_g.flac | ответ в разговоре | Sadachbia | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_1_v1_f_g.flac | ответ в разговоре | Leda | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_2_v1_g.flac | ответ в разговоре | Sadachbia | patient, experienced craft teacher, calm | Вашему народу я не должен, а вам — тем более. |
| r7_2_v1_f_g.flac | ответ в разговоре | Leda | patient, experienced craft teacher, calm | Вашему народу я не должна, а вам — тем более. |
| r7_3_v1_g.flac | ответ в разговоре | Sadachbia | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_3_v1_f_g.flac | ответ в разговоре | Leda | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_4_v1_g.flac | ответ в разговоре | Sadachbia | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_4_v1_f_g.flac | ответ в разговоре | Leda | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_5_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r7_5_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r7_0_v2_g.flac | ответ в разговоре | Schedar | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_0_v2_f_g.flac | ответ в разговоре | Aoede | patient, experienced craft teacher, calm | Не моё ремесло. |
| r7_1_v2_g.flac | ответ в разговоре | Schedar | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_1_v2_f_g.flac | ответ в разговоре | Aoede | patient, experienced craft teacher, calm | Это вы знаете не хуже меня. Ищите того, кто выше. |
| r7_2_v2_g.flac | ответ в разговоре | Schedar | patient, experienced craft teacher, calm | Вашему народу я не должен, а вам — тем более. |
| r7_2_v2_f_g.flac | ответ в разговоре | Aoede | patient, experienced craft teacher, calm | Вашему народу я не должна, а вам — тем более. |
| r7_3_v2_g.flac | ответ в разговоре | Schedar | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_3_v2_f_g.flac | ответ в разговоре | Aoede | patient, experienced craft teacher, calm | Смотрите и запоминайте: руки помнят лучше головы. |
| r7_4_v2_g.flac | ответ в разговоре | Schedar | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_4_v2_f_g.flac | ответ в разговоре | Aoede | patient, experienced craft teacher, calm | Вот так. Дальше — сами, у станка. |
| r7_5_v2_g.flac | ответ в разговоре | Schedar | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r7_5_v2_f_g.flac | ответ в разговоре | Aoede | thoughtful, a little amused, friendly | Про здешние места вы, похоже, знаете не меньше моего. |
| r8_0_g.flac | ответ в разговоре | Umbriel | thoughtful, a little amused, friendly | Предтечи Грани оставили подземные комплексы, портальные станции, искусственные луны, архивы, машины и автономных стражей. Их сеть когда-то давала развитие всякому разумному; сейчас она разбита, и узлы её открывают по одному — ключом, знанием, языком, энергией и разрешением фракции. |
| r8_0_f_g.flac | ответ в разговоре | Despina | thoughtful, a little amused, friendly | Предтечи Грани оставили подземные комплексы, портальные станции, искусственные луны, архивы, машины и автономных стражей. Их сеть когда-то давала развитие всякому разумному; сейчас она разбита, и узлы её открывают по одному — ключом, знанием, языком, энергией и разрешением фракции. |
| r8_2_g.flac | ответ в разговоре | Umbriel | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_2_f_g.flac | ответ в разговоре | Despina | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_3_f_g.flac | ответ в разговоре | Despina | thoughtful, a little amused, friendly | Здесь Домов нет, и тайн нет. |
| r8_0_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, a little amused, friendly | Предтечи Грани оставили подземные комплексы, портальные станции, искусственные луны, архивы, машины и автономных стражей. Их сеть когда-то давала развитие всякому разумному; сейчас она разбита, и узлы её открывают по одному — ключом, знанием, языком, энергией и разрешением фракции. |
| r8_2_v1_g.flac | ответ в разговоре | Sadachbia | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_2_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_3_v1_f_g.flac | ответ в разговоре | Leda | thoughtful, a little amused, friendly | Здесь Домов нет, и тайн нет. |
| r8_0_v2_g.flac | ответ в разговоре | Schedar | thoughtful, a little amused, friendly | Предтечи Грани оставили подземные комплексы, портальные станции, искусственные луны, архивы, машины и автономных стражей. Их сеть когда-то давала развитие всякому разумному; сейчас она разбита, и узлы её открывают по одному — ключом, знанием, языком, энергией и разрешением фракции. |
| r8_0_v2_f_g.flac | ответ в разговоре | Aoede | thoughtful, a little amused, friendly | Предтечи Грани оставили подземные комплексы, портальные станции, искусственные луны, архивы, машины и автономных стражей. Их сеть когда-то давала развитие всякому разумному; сейчас она разбита, и узлы её открывают по одному — ключом, знанием, языком, энергией и разрешением фракции. |
| r8_2_v2_g.flac | ответ в разговоре | Schedar | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_2_v2_f_g.flac | ответ в разговоре | Aoede | thoughtful, a little amused, friendly | Морфозвери меняют форму по еде, ране, жару, страху и соседям: лесной становится степным за месяц в ковыле. Изучайте останки — Ядро прочтёт отпечаток: где живёт, чем питается, чего боится. |
| r8_3_v2_f_g.flac | ответ в разговоре | Aoede | thoughtful, a little amused, friendly | Здесь Домов нет, и тайн нет. |
| car_arrive_0_v2_f_g.flac | car_arrive | Vindemiatrix | relieved | Дошли! Держи плату, заслужено. |
| car_arrive_0_v2_g.flac | car_arrive | Zubenelgenubi | relieved | Дошли! Держи плату, заслужено. |
| car_arrive_0_v3_f_g.flac | car_arrive | Erinome | relieved | Дошли! Держи плату, заслужено. |
| car_arrive_0_v3_g.flac | car_arrive | Achird | relieved | Дошли! Держи плату, заслужено. |
| car_arrive_1_v2_f_g.flac | car_arrive | Vindemiatrix | sincere | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_1_v2_g.flac | car_arrive | Zubenelgenubi | sincere | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_1_v3_f_g.flac | car_arrive | Erinome | sincere | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_1_v3_g.flac | car_arrive | Achird | sincere | Спасибо за охрану. Без тебя бы не дошли. |
| car_arrive_2_v2_f_g.flac | car_arrive | Vindemiatrix | satisfied | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_2_v2_g.flac | car_arrive | Zubenelgenubi | satisfied | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_2_v3_f_g.flac | car_arrive | Erinome | satisfied | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_2_v3_g.flac | car_arrive | Achird | satisfied | Вот твоё золото. Будешь рядом — нанимайся снова. |
| car_arrive_3_v2_f_g.flac | car_arrive | Vindemiatrix | relieved | Живы, груз цел. Честно заработано. |
| car_arrive_3_v2_g.flac | car_arrive | Zubenelgenubi | relieved | Живы, груз цел. Честно заработано. |
| car_arrive_3_v3_f_g.flac | car_arrive | Erinome | relieved | Живы, груз цел. Честно заработано. |
| car_arrive_3_v3_g.flac | car_arrive | Achird | relieved | Живы, груз цел. Честно заработано. |
| car_buy_0_v2_f_g.flac | car_buy | Vindemiatrix | confident | Твоё. Довезёшь — втрое продашь. |
| car_buy_0_v2_g.flac | car_buy | Zubenelgenubi | confident | Твоё. Довезёшь — втрое продашь. |
| car_buy_0_v3_f_g.flac | car_buy | Erinome | confident | Твоё. Довезёшь — втрое продашь. |
| car_buy_0_v3_g.flac | car_buy | Achird | confident | Твоё. Довезёшь — втрое продашь. |
| car_buy_1_v2_f_g.flac | car_buy | Vindemiatrix | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_1_v2_g.flac | car_buy | Zubenelgenubi | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_1_v3_f_g.flac | car_buy | Erinome | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_1_v3_g.flac | car_buy | Achird | persuasive | Бери, пока есть. До города такого не сыщешь. |
| car_buy_2_v2_f_g.flac | car_buy | Vindemiatrix | cheerful | Взято! Деньги в сундук, товар — тебе. |
| car_buy_2_v2_g.flac | car_buy | Zubenelgenubi | cheerful | Взято! Деньги в сундук, товар — тебе. |
| car_buy_2_v3_f_g.flac | car_buy | Erinome | cheerful | Взято! Деньги в сундук, товар — тебе. |
| car_buy_2_v3_g.flac | car_buy | Achird | cheerful | Взято! Деньги в сундук, товар — тебе. |
| car_buy_3_v2_f_g.flac | car_buy | Vindemiatrix | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_3_v2_g.flac | car_buy | Zubenelgenubi | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_3_v3_f_g.flac | car_buy | Erinome | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_3_v3_g.flac | car_buy | Achird | approving | Добрый выбор. Там, куда идём, это на вес золота. |
| car_buy_4_v2_f_g.flac | car_buy | Vindemiatrix | friendly | По рукам. Только в дороге не растеряй. |
| car_buy_4_v2_g.flac | car_buy | Zubenelgenubi | friendly | По рукам. Только в дороге не растеряй. |
| car_buy_4_v3_f_g.flac | car_buy | Erinome | friendly | По рукам. Только в дороге не растеряй. |
| car_buy_4_v3_g.flac | car_buy | Achird | friendly | По рукам. Только в дороге не растеряй. |
| car_buy_5_v2_f_g.flac | car_buy | Vindemiatrix | sincere | Держи. Мы честные купцы, без обмана. |
| car_buy_5_v2_g.flac | car_buy | Zubenelgenubi | sincere | Держи. Мы честные купцы, без обмана. |
| car_buy_5_v3_f_g.flac | car_buy | Erinome | sincere | Держи. Мы честные купцы, без обмана. |
| car_buy_5_v3_g.flac | car_buy | Achird | sincere | Держи. Мы честные купцы, без обмана. |
| car_hire_0_v2_f_g.flac | car_hire | Vindemiatrix | decisive | Нанят! Держись у последнего воза. |
| car_hire_0_v2_g.flac | car_hire | Zubenelgenubi | decisive | Нанят! Держись у последнего воза. |
| car_hire_0_v3_f_g.flac | car_hire | Erinome | decisive | Нанят! Держись у последнего воза. |
| car_hire_0_v3_g.flac | car_hire | Achird | decisive | Нанят! Держись у последнего воза. |
| car_hire_1_v2_f_g.flac | car_hire | Vindemiatrix | appraising | Меч при тебе? Отлично. Плата в городе. |
| car_hire_1_v2_g.flac | car_hire | Zubenelgenubi | appraising | Меч при тебе? Отлично. Плата в городе. |
| car_hire_1_v3_f_g.flac | car_hire | Erinome | appraising | Меч при тебе? Отлично. Плата в городе. |
| car_hire_1_v3_g.flac | car_hire | Achird | appraising | Меч при тебе? Отлично. Плата в городе. |
| car_hire_2_v2_f_g.flac | car_hire | Vindemiatrix | relieved | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_2_v2_g.flac | car_hire | Zubenelgenubi | relieved | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_2_v3_f_g.flac | car_hire | Erinome | relieved | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_2_v3_g.flac | car_hire | Achird | relieved | Лишняя рука с оружием — в самый раз. Добро пожаловать. |
| car_hire_3_v2_f_g.flac | car_hire | Vindemiatrix | businesslike | Договорились. Довезём груз — получишь сполна. |
| car_hire_3_v2_g.flac | car_hire | Zubenelgenubi | businesslike | Договорились. Довезём груз — получишь сполна. |
| car_hire_3_v3_f_g.flac | car_hire | Erinome | businesslike | Договорились. Довезём груз — получишь сполна. |
| car_hire_3_v3_g.flac | car_hire | Achird | businesslike | Договорились. Довезём груз — получишь сполна. |
| car_hire_4_v2_f_g.flac | car_hire | Vindemiatrix | serious | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_4_v2_g.flac | car_hire | Zubenelgenubi | serious | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_4_v3_f_g.flac | car_hire | Erinome | serious | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_4_v3_g.flac | car_hire | Achird | serious | Охранник? Хорошо. Гляди в оба — на тракте неспокойно. |
| car_hire_5_v2_f_g.flac | car_hire | Vindemiatrix | friendly | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_5_v2_g.flac | car_hire | Zubenelgenubi | friendly | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_5_v3_f_g.flac | car_hire | Erinome | friendly | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_5_v3_g.flac | car_hire | Achird | friendly | По рукам. Если что — кричи, ребята прибегут. |
| car_hire_busy_0_v2_f_g.flac | car_hire_busy | Vindemiatrix | dry | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_0_v2_g.flac | car_hire_busy | Zubenelgenubi | dry | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_0_v3_f_g.flac | car_hire_busy | Erinome | dry | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_0_v3_g.flac | car_hire_busy | Achird | dry | У тебя уже есть наниматель. Двух обозов не сторожат. |
| car_hire_busy_1_v2_f_g.flac | car_hire_busy | Vindemiatrix | firm | Ты другой обоз ведёшь. Сперва доведи его. |
| car_hire_busy_1_v2_g.flac | car_hire_busy | Zubenelgenubi | firm | Ты другой обоз ведёшь. Сперва доведи его. |
| car_hire_busy_1_v3_f_g.flac | car_hire_busy | Erinome | firm | Ты другой обоз ведёшь. Сперва доведи его. |
| car_hire_busy_1_v3_g.flac | car_hire_busy | Achird | firm | Ты другой обоз ведёшь. Сперва доведи его. |
| car_meet_0_v2_f_g.flac | car_meet | Vindemiatrix | loud | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_0_v2_g.flac | car_meet | Zubenelgenubi | loud | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_0_v3_f_g.flac | car_meet | Erinome | loud | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_0_v3_g.flac | car_meet | Achird | loud | Эй, путник! Обоз идёт. Торговать будешь? |
| car_meet_1_v2_f_g.flac | car_meet | Vindemiatrix | reassuring | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_1_v2_g.flac | car_meet | Zubenelgenubi | reassuring | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_1_v3_f_g.flac | car_meet | Erinome | reassuring | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_1_v3_g.flac | car_meet | Achird | reassuring | Стой, не пугайся, мы купцы. Глянешь на товар? |
| car_meet_2_v2_f_g.flac | car_meet | Vindemiatrix | cheerful | Доброй дороги! У нас есть чем поторговать. |
| car_meet_2_v2_g.flac | car_meet | Zubenelgenubi | cheerful | Доброй дороги! У нас есть чем поторговать. |
| car_meet_2_v3_f_g.flac | car_meet | Erinome | cheerful | Доброй дороги! У нас есть чем поторговать. |
| car_meet_2_v3_g.flac | car_meet | Achird | cheerful | Доброй дороги! У нас есть чем поторговать. |
| car_meet_3_v2_f_g.flac | car_meet | Vindemiatrix | relaxed | Караван на привале. Подходи, пока стоим. |
| car_meet_3_v2_g.flac | car_meet | Zubenelgenubi | relaxed | Караван на привале. Подходи, пока стоим. |
| car_meet_3_v3_f_g.flac | car_meet | Erinome | relaxed | Караван на привале. Подходи, пока стоим. |
| car_meet_3_v3_g.flac | car_meet | Achird | relaxed | Караван на привале. Подходи, пока стоим. |
| car_meet_4_v2_f_g.flac | car_meet | Vindemiatrix | wary | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_4_v2_g.flac | car_meet | Zubenelgenubi | wary | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_4_v3_f_g.flac | car_meet | Erinome | wary | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_4_v3_g.flac | car_meet | Achird | wary | Не разбойник? Ну и славно. Меняться будем? |
| car_meet_5_v2_f_g.flac | car_meet | Vindemiatrix | proud | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_5_v2_g.flac | car_meet | Zubenelgenubi | proud | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_5_v3_f_g.flac | car_meet | Erinome | proud | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_5_v3_g.flac | car_meet | Achird | proud | Товар с дальних земель! Смотри, пока не ушли. |
| car_meet_6_v2_f_g.flac | car_meet | Vindemiatrix | tired | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_6_v2_g.flac | car_meet | Zubenelgenubi | tired | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_6_v3_f_g.flac | car_meet | Erinome | tired | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_6_v3_g.flac | car_meet | Achird | tired | Мы с утра в пути. Покупай, продавай — только быстро. |
| car_meet_7_v2_f_g.flac | car_meet | Vindemiatrix | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_7_v2_g.flac | car_meet | Zubenelgenubi | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_7_v3_f_g.flac | car_meet | Erinome | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_7_v3_g.flac | car_meet | Achird | brisk trader | Путник, нужна соль, железо, ткань? Всё есть. |
| car_meet_8_v2_f_g.flac | car_meet | Vindemiatrix | calming | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_8_v2_g.flac | car_meet | Zubenelgenubi | calming | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_8_v3_f_g.flac | car_meet | Erinome | calming | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_8_v3_g.flac | car_meet | Achird | calming | Охрана, спокойно, это не разбойник. Подходи, добрый человек. |
| car_meet_9_v2_f_g.flac | car_meet | Vindemiatrix | hopeful | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_9_v2_g.flac | car_meet | Zubenelgenubi | hopeful | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_9_v3_f_g.flac | car_meet | Erinome | hopeful | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_9_v3_g.flac | car_meet | Achird | hopeful | Дорога длинная, а покупатель редкий. Заглянешь? |
| car_meet_night_0_v2_f_g.flac | car_meet_night | Vindemiatrix | alarmed | Кто там в темноте? Назовись! |
| car_meet_night_0_v2_g.flac | car_meet_night | Zubenelgenubi | alarmed | Кто там в темноте? Назовись! |
| car_meet_night_0_v3_f_g.flac | car_meet_night | Erinome | alarmed | Кто там в темноте? Назовись! |
| car_meet_night_0_v3_g.flac | car_meet_night | Achird | alarmed | Кто там в темноте? Назовись! |
| car_meet_night_1_v2_f_g.flac | car_meet_night | Vindemiatrix | sleepy | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_1_v2_g.flac | car_meet_night | Zubenelgenubi | sleepy | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_1_v3_f_g.flac | car_meet_night | Erinome | sleepy | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_1_v3_g.flac | car_meet_night | Achird | sleepy | Ночью обоз не торгует. Но для тебя сделаем исключение. |
| car_meet_night_2_v2_f_g.flac | car_meet_night | Vindemiatrix | wary | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_night_2_v2_g.flac | car_meet_night | Zubenelgenubi | wary | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_night_2_v3_f_g.flac | car_meet_night | Erinome | wary | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_night_2_v3_g.flac | car_meet_night | Achird | wary | Поздно бродишь. Ладно, подходи к огню. |
| car_meet_war_0_v2_f_g.flac | car_meet_war | Vindemiatrix | tense | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_0_v2_g.flac | car_meet_war | Zubenelgenubi | tense | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_0_v3_f_g.flac | car_meet_war | Erinome | tense | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_0_v3_g.flac | car_meet_war | Achird | tense | Тише. Мы идём через фронт. Торгуй, но не мешкай. |
| car_meet_war_1_v2_f_g.flac | car_meet_war | Vindemiatrix | grim | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_1_v2_g.flac | car_meet_war | Zubenelgenubi | grim | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_1_v3_f_g.flac | car_meet_war | Erinome | grim | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_1_v3_g.flac | car_meet_war | Achird | grim | Война кругом, а торговать надо. Цены, уж извини, злые. |
| car_meet_war_2_v2_f_g.flac | car_meet_war | Vindemiatrix | nervous | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_2_v2_g.flac | car_meet_war | Zubenelgenubi | nervous | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_2_v3_f_g.flac | car_meet_war | Erinome | nervous | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_2_v3_g.flac | car_meet_war | Achird | nervous | Солдат по дороге не видно? Тогда быстро меняемся. |
| car_meet_war_3_v2_f_g.flac | car_meet_war | Vindemiatrix | grim | На такой дороге каждая рука с оружием на счету. |
| car_meet_war_3_v2_g.flac | car_meet_war | Zubenelgenubi | grim | На такой дороге каждая рука с оружием на счету. |
| car_meet_war_3_v3_f_g.flac | car_meet_war | Erinome | grim | На такой дороге каждая рука с оружием на счету. |
| car_meet_war_3_v3_g.flac | car_meet_war | Achird | grim | На такой дороге каждая рука с оружием на счету. |
| car_news_0_v2_f_g.flac | car_news | Vindemiatrix | conversational | Слушай, что на дорогах делается. |
| car_news_0_v2_g.flac | car_news | Zubenelgenubi | conversational | Слушай, что на дорогах делается. |
| car_news_0_v3_f_g.flac | car_news | Erinome | conversational | Слушай, что на дорогах делается. |
| car_news_0_v3_g.flac | car_news | Achird | conversational | Слушай, что на дорогах делается. |
| car_news_1_v2_f_g.flac | car_news | Vindemiatrix | friendly | Расскажу, что знаю. Мы много где бываем. |
| car_news_1_v2_g.flac | car_news | Zubenelgenubi | friendly | Расскажу, что знаю. Мы много где бываем. |
| car_news_1_v3_f_g.flac | car_news | Erinome | friendly | Расскажу, что знаю. Мы много где бываем. |
| car_news_1_v3_g.flac | car_news | Achird | friendly | Расскажу, что знаю. Мы много где бываем. |
| car_news_2_v2_f_g.flac | car_news | Vindemiatrix | amused | Новости? Их у нас больше, чем товара. |
| car_news_2_v2_g.flac | car_news | Zubenelgenubi | amused | Новости? Их у нас больше, чем товара. |
| car_news_2_v3_f_g.flac | car_news | Erinome | amused | Новости? Их у нас больше, чем товара. |
| car_news_2_v3_g.flac | car_news | Achird | amused | Новости? Их у нас больше, чем товара. |
| car_pass_0_v2_f_g.flac | car_pass | Vindemiatrix | easygoing | Ну, как знаешь. Доброй дороги! |
| car_pass_0_v2_g.flac | car_pass | Zubenelgenubi | easygoing | Ну, как знаешь. Доброй дороги! |
| car_pass_0_v3_f_g.flac | car_pass | Erinome | easygoing | Ну, как знаешь. Доброй дороги! |
| car_pass_0_v3_g.flac | car_pass | Achird | easygoing | Ну, как знаешь. Доброй дороги! |
| car_pass_1_v2_f_g.flac | car_pass | Vindemiatrix | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_1_v2_g.flac | car_pass | Zubenelgenubi | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_1_v3_f_g.flac | car_pass | Erinome | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_1_v3_g.flac | car_pass | Achird | loud command to drivers | Трогай! Обоз идёт дальше. |
| car_pass_2_v2_f_g.flac | car_pass | Vindemiatrix | warm | Счастливо оставаться. Может, свидимся. |
| car_pass_2_v2_g.flac | car_pass | Zubenelgenubi | warm | Счастливо оставаться. Может, свидимся. |
| car_pass_2_v3_f_g.flac | car_pass | Erinome | warm | Счастливо оставаться. Может, свидимся. |
| car_pass_2_v3_g.flac | car_pass | Achird | warm | Счастливо оставаться. Может, свидимся. |
| car_pass_3_v2_f_g.flac | car_pass | Vindemiatrix | shrugging | Ничего не нужно? Ладно, нам пора. |
| car_pass_3_v2_g.flac | car_pass | Zubenelgenubi | shrugging | Ничего не нужно? Ладно, нам пора. |
| car_pass_3_v3_f_g.flac | car_pass | Erinome | shrugging | Ничего не нужно? Ладно, нам пора. |
| car_pass_3_v3_g.flac | car_pass | Achird | shrugging | Ничего не нужно? Ладно, нам пора. |
| car_pass_4_v2_f_g.flac | car_pass | Vindemiatrix | loud | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_4_v2_g.flac | car_pass | Zubenelgenubi | loud | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_4_v3_f_g.flac | car_pass | Erinome | loud | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_4_v3_g.flac | car_pass | Achird | loud | Пропускаем путника! Эй, возчики, трогай! |
| car_pass_5_v2_f_g.flac | car_pass | Vindemiatrix | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_pass_5_v2_g.flac | car_pass | Zubenelgenubi | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_pass_5_v3_f_g.flac | car_pass | Erinome | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_pass_5_v3_g.flac | car_pass | Achird | caring warning | Береги себя на тракте. Разбойники шалят. |
| car_poor_0_v2_f_g.flac | car_poor | Vindemiatrix | dry | Золота не хватит. Мы в долг не возим. |
| car_poor_0_v2_g.flac | car_poor | Zubenelgenubi | dry | Золота не хватит. Мы в долг не возим. |
| car_poor_0_v3_f_g.flac | car_poor | Erinome | dry | Золота не хватит. Мы в долг не возим. |
| car_poor_0_v3_g.flac | car_poor | Achird | dry | Золота не хватит. Мы в долг не возим. |
| car_poor_1_v2_f_g.flac | car_poor | Vindemiatrix | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_poor_1_v2_g.flac | car_poor | Zubenelgenubi | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_poor_1_v3_f_g.flac | car_poor | Erinome | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_poor_1_v3_g.flac | car_poor | Achird | sympathetic | Кошель пустоват. Ну, может, в другой раз. |
| car_sell_0_v2_f_g.flac | car_sell | Vindemiatrix | businesslike | Беру. В городе пригодится. |
| car_sell_0_v2_g.flac | car_sell | Zubenelgenubi | businesslike | Беру. В городе пригодится. |
| car_sell_0_v3_f_g.flac | car_sell | Erinome | businesslike | Беру. В городе пригодится. |
| car_sell_0_v3_g.flac | car_sell | Achird | businesslike | Беру. В городе пригодится. |
| car_sell_1_v2_f_g.flac | car_sell | Vindemiatrix | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_1_v2_g.flac | car_sell | Zubenelgenubi | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_1_v3_f_g.flac | car_sell | Erinome | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_1_v3_g.flac | car_sell | Achird | agreeable | Хорошо, заберём. Вот плата. |
| car_sell_2_v2_f_g.flac | car_sell | Vindemiatrix | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_2_v2_g.flac | car_sell | Zubenelgenubi | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_2_v3_f_g.flac | car_sell | Erinome | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_2_v3_g.flac | car_sell | Achird | pleased | Как раз этого нам в дорогу и не хватало. |
| car_sell_3_v2_f_g.flac | car_sell | Vindemiatrix | loud | Грузите на третий воз! Беру всё. |
| car_sell_3_v2_g.flac | car_sell | Zubenelgenubi | loud | Грузите на третий воз! Беру всё. |
| car_sell_3_v3_f_g.flac | car_sell | Erinome | loud | Грузите на третий воз! Беру всё. |
| car_sell_3_v3_g.flac | car_sell | Achird | loud | Грузите на третий воз! Беру всё. |
| car_sell_4_v2_f_g.flac | car_sell | Vindemiatrix | fair | Честная цена. Держи монеты. |
| car_sell_4_v2_g.flac | car_sell | Zubenelgenubi | fair | Честная цена. Держи монеты. |
| car_sell_4_v3_f_g.flac | car_sell | Erinome | fair | Честная цена. Держи монеты. |
| car_sell_4_v3_g.flac | car_sell | Achird | fair | Честная цена. Держи монеты. |
| car_sell_5_v2_f_g.flac | car_sell | Vindemiatrix | eager | Годится. Ещё что-нибудь есть? |
| car_sell_5_v2_g.flac | car_sell | Zubenelgenubi | eager | Годится. Ещё что-нибудь есть? |
| car_sell_5_v3_f_g.flac | car_sell | Erinome | eager | Годится. Ещё что-нибудь есть? |
| car_sell_5_v3_g.flac | car_sell | Achird | eager | Годится. Ещё что-нибудь есть? |
| dlg_0_0_v2_f_g.flac | dlg | Aoede | evasive | Я в такие дела не лезу |
| dlg_0_0_v2_g.flac | dlg | Schedar | evasive | Я в такие дела не лезу |
| dlg_0_10_v2_f_g.flac | dlg | Aoede | evasive | Проваливай с такими вопросами |
| dlg_0_10_v2_g.flac | dlg | Schedar | evasive | Проваливай с такими вопросами |
| dlg_0_11_v2_f_g.flac | dlg | Aoede | evasive | С вами я ни о чём говорить не стану |
| dlg_0_11_v2_g.flac | dlg | Schedar | evasive | С вами я ни о чём говорить не стану |
| dlg_0_12_v2_f_g.flac | dlg | Aoede | evasive | Ищите дураков в другом месте |
| dlg_0_12_v2_g.flac | dlg | Schedar | evasive | Ищите дураков в другом месте |
| dlg_0_13_v2_f_g.flac | dlg | Aoede | evasive | Спрашивайте кого другого |
| dlg_0_13_v2_g.flac | dlg | Schedar | evasive | Спрашивайте кого другого |
| dlg_0_14_v2_f_g.flac | dlg | Aoede | evasive | Не до вас сейчас |
| dlg_0_14_v2_g.flac | dlg | Schedar | evasive | Не до вас сейчас |
| dlg_0_15_v2_f_g.flac | dlg | Aoede | evasive | Тебе бы сказать, да нечего |
| dlg_0_15_v2_g.flac | dlg | Schedar | evasive | Тебе бы сказать, да нечего |
| dlg_0_16_v2_f_g.flac | dlg | Aoede | evasive | После того, что было? Ничего вам не скажу |
| dlg_0_16_v2_g.flac | dlg | Schedar | evasive | После того, что было? Ничего вам не скажу |
| dlg_0_17_v2_f_g.flac | dlg | Aoede | evasive | Вам бы помочь, да правда не знаю |
| dlg_0_17_v2_g.flac | dlg | Schedar | evasive | Вам бы помочь, да правда не знаю |
| dlg_0_1_v2_f_g.flac | dlg | Aoede | evasive | Спросите кого другого, я тут сбоку |
| dlg_0_1_v2_g.flac | dlg | Schedar | evasive | Спросите кого другого, я тут сбоку |
| dlg_0_2_v2_f_g.flac | dlg | Aoede | evasive | Моё дело маленькое — ничего не знаю |
| dlg_0_2_v2_g.flac | dlg | Schedar | evasive | Моё дело маленькое — ничего не знаю |
| dlg_0_3_v2_f_g.flac | dlg | Aoede | evasive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_3_v2_g.flac | dlg | Schedar | evasive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_4_v2_f_g.flac | dlg | Aoede | evasive | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_4_v2_g.flac | dlg | Schedar | evasive | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_5_v2_f_g.flac | dlg | Aoede | evasive | А вам-то зачем? Нет, не скажу |
| dlg_0_5_v2_g.flac | dlg | Schedar | evasive | А вам-то зачем? Нет, не скажу |
| dlg_0_6_v2_f_g.flac | dlg | Aoede | evasive | Я не пересказываю базарные сплетни |
| dlg_0_6_v2_g.flac | dlg | Schedar | evasive | Я не пересказываю базарные сплетни |
| dlg_0_7_v2_f_g.flac | dlg | Aoede | evasive | Бесплатно я даже время не говорю |
| dlg_0_7_v2_g.flac | dlg | Schedar | evasive | Бесплатно я даже время не говорю |
| dlg_0_8_v2_f_g.flac | dlg | Aoede | evasive | Может, и знаю. Но не вам и не сегодня |
| dlg_0_8_v2_g.flac | dlg | Schedar | evasive | Может, и знаю. Но не вам и не сегодня |
| dlg_0_9_v2_f_g.flac | dlg | Aoede | evasive | Наверняка не знаю, а гадать не стану |
| dlg_0_9_v2_g.flac | dlg | Schedar | evasive | Наверняка не знаю, а гадать не стану |
| dlg_10_0_v2_f_g.flac | dlg | Aoede | firm | Цена одна для всех. Берёте или нет? |
| dlg_10_0_v2_g.flac | dlg | Schedar | firm | Цена одна для всех. Берёте или нет? |
| dlg_10_10_v2_f_g.flac | dlg | Aoede | firm | С вами торговаться не буду |
| dlg_10_10_v2_g.flac | dlg | Schedar | firm | С вами торговаться не буду |
| dlg_10_11_v2_f_g.flac | dlg | Aoede | firm | Цена сказана |
| dlg_10_11_v2_g.flac | dlg | Schedar | firm | Цена сказана |
| dlg_10_1_v2_f_g.flac | dlg | Aoede | firm | Ниже не опущу |
| dlg_10_1_v2_g.flac | dlg | Schedar | firm | Ниже не опущу |
| dlg_10_2_v2_f_g.flac | dlg | Aoede | firm | Не нравится — идите к соседу |
| dlg_10_2_v2_g.flac | dlg | Schedar | firm | Не нравится — идите к соседу |
| dlg_10_3_v2_f_g.flac | dlg | Aoede | firm | Товар хороший, и цена у него своя |
| dlg_10_3_v2_g.flac | dlg | Schedar | firm | Товар хороший, и цена у него своя |
| dlg_10_4_v2_f_g.flac | dlg | Aoede | firm | Скорее удавлюсь, чем уступлю |
| dlg_10_4_v2_g.flac | dlg | Schedar | firm | Скорее удавлюсь, чем уступлю |
| dlg_10_5_v2_f_g.flac | dlg | Aoede | firm | Я не торгуюсь, как на базаре |
| dlg_10_5_v2_g.flac | dlg | Schedar | firm | Я не торгуюсь, как на базаре |
| dlg_10_6_v2_f_g.flac | dlg | Aoede | firm | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_6_v2_g.flac | dlg | Schedar | firm | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_7_v2_f_g.flac | dlg | Aoede | firm | Посчитайте сами: дешевле не выходит |
| dlg_10_7_v2_g.flac | dlg | Schedar | firm | Посчитайте сами: дешевле не выходит |
| dlg_10_8_v2_f_g.flac | dlg | Aoede | firm | Вам — вдвое. Не нравится — дверь там |
| dlg_10_8_v2_g.flac | dlg | Schedar | firm | Вам — вдвое. Не нравится — дверь там |
| dlg_10_9_v2_f_g.flac | dlg | Aoede | firm | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_9_v2_g.flac | dlg | Schedar | firm | Уступить бы тебе, да и так в убыток торгую |
| dlg_11_0_v2_f_g.flac | dlg | Aoede | conspiratorial | Я вас не видела |
| dlg_11_0_v2_g.flac | dlg | Schedar | conspiratorial | Я вас не видел |
| dlg_11_1_v2_f_g.flac | dlg | Aoede | conspiratorial | Какие деньги? Ничего не было |
| dlg_11_1_v2_g.flac | dlg | Schedar | conspiratorial | Какие деньги? Ничего не было |
| dlg_11_2_v2_f_g.flac | dlg | Aoede | conspiratorial | Считайте, мы не встречались |
| dlg_11_2_v2_g.flac | dlg | Schedar | conspiratorial | Считайте, мы не встречались |
| dlg_11_3_v2_f_g.flac | dlg | Aoede | conspiratorial | Я глуха, слепа и очень занята |
| dlg_11_3_v2_g.flac | dlg | Schedar | conspiratorial | Я глух, слеп и очень занят |
| dlg_11_4_v2_f_g.flac | dlg | Aoede | conspiratorial | Щедро. Для вас — что угодно |
| dlg_11_4_v2_g.flac | dlg | Schedar | conspiratorial | Щедро. Для вас — что угодно |
| dlg_11_5_v2_f_g.flac | dlg | Aoede | conspiratorial | Только быстро, пока никто не смотрит |
| dlg_11_5_v2_g.flac | dlg | Schedar | conspiratorial | Только быстро, пока никто не смотрит |
| dlg_11_6_v2_f_g.flac | dlg | Aoede | conspiratorial | Разумный подход. Я умею молчать |
| dlg_11_6_v2_g.flac | dlg | Schedar | conspiratorial | Разумный подход. Я умею молчать |
| dlg_11_7_v2_f_g.flac | dlg | Aoede | conspiratorial | Для тебя — могила. Никому ни слова |
| dlg_11_7_v2_g.flac | dlg | Schedar | conspiratorial | Для тебя — могила. Никому ни слова |
| dlg_11_8_v2_f_g.flac | dlg | Aoede | conspiratorial | Деньги взяты. Разговора не было |
| dlg_11_8_v2_g.flac | dlg | Schedar | conspiratorial | Деньги взяты. Разговора не было |
| dlg_11_9_v2_f_g.flac | dlg | Aoede | conspiratorial | Деньги возьму, но друзьями нам не быть |
| dlg_11_9_v2_g.flac | dlg | Schedar | conspiratorial | Деньги возьму, но друзьями нам не быть |
| dlg_12_0_v2_f_g.flac | dlg | Aoede | offended | За кого вы меня держите? |
| dlg_12_0_v2_g.flac | dlg | Schedar | offended | За кого вы меня держите? |
| dlg_12_10_v2_f_g.flac | dlg | Aoede | offended | Вам я и так помогаю, зачем деньги? |
| dlg_12_10_v2_g.flac | dlg | Schedar | offended | Вам я и так помогаю, зачем деньги? |
| dlg_12_1_v2_f_g.flac | dlg | Aoede | offended | Уберите это, пока я не позвала стражу |
| dlg_12_1_v2_g.flac | dlg | Schedar | offended | Уберите это, пока я не позвал стражу |
| dlg_12_2_v2_f_g.flac | dlg | Aoede | offended | Меня не купишь |
| dlg_12_2_v2_g.flac | dlg | Schedar | offended | Меня не купишь |
| dlg_12_3_v2_f_g.flac | dlg | Aoede | offended | Деньги держите при себе |
| dlg_12_3_v2_g.flac | dlg | Schedar | offended | Деньги держите при себе |
| dlg_12_4_v2_f_g.flac | dlg | Aoede | offended | Честь не продаётся. Ступайте |
| dlg_12_4_v2_g.flac | dlg | Schedar | offended | Честь не продаётся. Ступайте |
| dlg_12_5_v2_f_g.flac | dlg | Aoede | offended | Вы смеете? Мне? |
| dlg_12_5_v2_g.flac | dlg | Schedar | offended | Вы смеете? Мне? |
| dlg_12_6_v2_f_g.flac | dlg | Aoede | offended | Боги видят, что вы сделали |
| dlg_12_6_v2_g.flac | dlg | Schedar | offended | Боги видят, что вы сделали |
| dlg_12_7_v2_f_g.flac | dlg | Aoede | offended | Нет-нет, я в таком не участвую! |
| dlg_12_7_v2_g.flac | dlg | Schedar | offended | Нет-нет, я в таком не участвую! |
| dlg_12_8_v2_f_g.flac | dlg | Aoede | offended | От тебя — и такое? Обидно |
| dlg_12_8_v2_g.flac | dlg | Schedar | offended | От тебя — и такое? Обидно |
| dlg_12_9_v2_f_g.flac | dlg | Aoede | offended | Ещё раз — и позову стражу |
| dlg_12_9_v2_g.flac | dlg | Schedar | offended | Ещё раз — и позову стражу |
| dlg_13_0_v2_f_g.flac | dlg | Aoede | correcting | Вы путаете. Так говорят приезжие |
| dlg_13_0_v2_g.flac | dlg | Schedar | correcting | Вы путаете. Так говорят приезжие |
| dlg_13_1_v2_f_g.flac | dlg | Aoede | correcting | Это вы где-то не то прочитали |
| dlg_13_1_v2_g.flac | dlg | Schedar | correcting | Это вы где-то не то прочитали |
| dlg_13_2_v2_f_g.flac | dlg | Aoede | correcting | У нас так не говорят |
| dlg_13_2_v2_g.flac | dlg | Schedar | correcting | У нас так не говорят |
| dlg_13_3_v2_f_g.flac | dlg | Aoede | correcting | Близко, но нет |
| dlg_13_3_v2_g.flac | dlg | Schedar | correcting | Близко, но нет |
| dlg_13_4_v2_f_g.flac | dlg | Aoede | correcting | Нахватались по верхам. Бывает у чужаков |
| dlg_13_4_v2_g.flac | dlg | Schedar | correcting | Нахватались по верхам. Бывает у чужаков |
| dlg_13_5_v2_f_g.flac | dlg | Aoede | correcting | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_5_v2_g.flac | dlg | Schedar | correcting | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_6_v2_f_g.flac | dlg | Aoede | correcting | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_6_v2_g.flac | dlg | Schedar | correcting | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_7_v2_f_g.flac | dlg | Aoede | correcting | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_7_v2_g.flac | dlg | Schedar | correcting | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_8_v2_f_g.flac | dlg | Aoede | correcting | Не то, друг. Но за старание спасибо |
| dlg_13_8_v2_g.flac | dlg | Schedar | correcting | Не то, друг. Но за старание спасибо |
| dlg_14_0_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Редко кто из чужих знает это |
| dlg_14_0_v2_g.flac | dlg | Schedar | pleasantly surprised | Редко кто из чужих знает это |
| dlg_14_1_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Вот это да — будто свой |
| dlg_14_1_v2_g.flac | dlg | Schedar | pleasantly surprised | Вот это да — будто свой |
| dlg_14_2_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Где вы этому научились? |
| dlg_14_2_v2_g.flac | dlg | Schedar | pleasantly surprised | Где вы этому научились? |
| dlg_14_3_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Теперь с вами можно говорить по-настоящему |
| dlg_14_3_v2_g.flac | dlg | Schedar | pleasantly surprised | Теперь с вами можно говорить по-настоящему |
| dlg_14_4_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Уважаю. Обычай — это корни |
| dlg_14_4_v2_g.flac | dlg | Schedar | pleasantly surprised | Уважаю. Обычай — это корни |
| dlg_14_5_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Приятно! Садитесь, поговорим |
| dlg_14_5_v2_g.flac | dlg | Schedar | pleasantly surprised | Приятно! Садитесь, поговорим |
| dlg_14_6_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Не ожидала от чужака |
| dlg_14_6_v2_g.flac | dlg | Schedar | pleasantly surprised | Не ожидал от чужака |
| dlg_14_7_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Даже недруг, а обычай знает. Уважаю |
| dlg_14_7_v2_g.flac | dlg | Schedar | pleasantly surprised | Даже недруг, а обычай знает. Уважаю |
| dlg_14_8_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Ты у нас уже почти свой |
| dlg_14_8_v2_g.flac | dlg | Schedar | pleasantly surprised | Ты у нас уже почти свой |
| dlg_14_9_v2_f_g.flac | dlg | Aoede | pleasantly surprised | Хм. Удивили |
| dlg_14_9_v2_g.flac | dlg | Schedar | pleasantly surprised | Хм. Удивили |
| dlg_15_0_v2_f_g.flac | dlg | Aoede | suspicious | Вы чего-то не договариваете? |
| dlg_15_0_v2_g.flac | dlg | Schedar | suspicious | Вы чего-то не договариваете? |
| dlg_15_1_v2_f_g.flac | dlg | Aoede | suspicious | Что-то в вашем рассказе не сходится |
| dlg_15_1_v2_g.flac | dlg | Schedar | suspicious | Что-то в вашем рассказе не сходится |
| dlg_15_2_v2_f_g.flac | dlg | Aoede | suspicious | А дальше? Где остальное? |
| dlg_15_2_v2_g.flac | dlg | Schedar | suspicious | А дальше? Где остальное? |
| dlg_15_3_v2_f_g.flac | dlg | Aoede | suspicious | Полуправда хуже лжи, знаете ли |
| dlg_15_3_v2_g.flac | dlg | Schedar | suspicious | Полуправда хуже лжи, знаете ли |
| dlg_15_4_v2_f_g.flac | dlg | Aoede | suspicious | Я так и знала, что вы темните |
| dlg_15_4_v2_g.flac | dlg | Schedar | suspicious | Я так и знал, что вы темните |
| dlg_15_5_v2_f_g.flac | dlg | Aoede | suspicious | Нет второй половины. Где она? |
| dlg_15_5_v2_g.flac | dlg | Schedar | suspicious | Нет второй половины. Где она? |
| dlg_15_6_v2_f_g.flac | dlg | Aoede | suspicious | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_6_v2_g.flac | dlg | Schedar | suspicious | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_7_v2_f_g.flac | dlg | Aoede | suspicious | Друг, от меня-то зачем таиться? |
| dlg_15_7_v2_g.flac | dlg | Schedar | suspicious | Друг, от меня-то зачем таиться? |
| dlg_15_8_v2_f_g.flac | dlg | Aoede | suspicious | Опять хитрите. Всё вижу |
| dlg_15_8_v2_g.flac | dlg | Schedar | suspicious | Опять хитрите. Всё вижу |
| dlg_15_9_v2_f_g.flac | dlg | Aoede | suspicious | Один раз вы уже обманули. Хватит |
| dlg_15_9_v2_g.flac | dlg | Schedar | suspicious | Один раз вы уже обманули. Хватит |
| dlg_16_0_v2_f_g.flac | dlg | Aoede | contemptuous | Врёте. И плохо врёте |
| dlg_16_0_v2_g.flac | dlg | Schedar | contemptuous | Врёте. И плохо врёте |
| dlg_16_10_v2_f_g.flac | dlg | Aoede | contemptuous | Лгун. Все будут знать |
| dlg_16_10_v2_g.flac | dlg | Schedar | contemptuous | Лгун. Все будут знать |
| dlg_16_1_v2_f_g.flac | dlg | Aoede | contemptuous | Сказки рассказывайте детям |
| dlg_16_1_v2_g.flac | dlg | Schedar | contemptuous | Сказки рассказывайте детям |
| dlg_16_2_v2_f_g.flac | dlg | Aoede | contemptuous | Не держите меня за дурака |
| dlg_16_2_v2_g.flac | dlg | Schedar | contemptuous | Не держите меня за дурака |
| dlg_16_3_v2_f_g.flac | dlg | Aoede | contemptuous | Ложь у вас на лбу написана |
| dlg_16_3_v2_g.flac | dlg | Schedar | contemptuous | Ложь у вас на лбу написана |
| dlg_16_4_v2_f_g.flac | dlg | Aoede | contemptuous | Лгать мне в лицо? Как не стыдно |
| dlg_16_4_v2_g.flac | dlg | Schedar | contemptuous | Лгать мне в лицо? Как не стыдно |
| dlg_16_5_v2_f_g.flac | dlg | Aoede | contemptuous | Врать надо тоньше. Учитесь |
| dlg_16_5_v2_g.flac | dlg | Schedar | contemptuous | Врать надо тоньше. Учитесь |
| dlg_16_6_v2_f_g.flac | dlg | Aoede | contemptuous | Ещё одно враньё — и язык укорочу |
| dlg_16_6_v2_g.flac | dlg | Schedar | contemptuous | Ещё одно враньё — и язык укорочу |
| dlg_16_7_v2_f_g.flac | dlg | Aoede | contemptuous | Я с первого слова знала, что врёте |
| dlg_16_7_v2_g.flac | dlg | Schedar | contemptuous | Я с первого слова знал, что врёте |
| dlg_16_8_v2_f_g.flac | dlg | Aoede | contemptuous | Зачем врёшь своему? Обидно |
| dlg_16_8_v2_g.flac | dlg | Schedar | contemptuous | Зачем врёшь своему? Обидно |
| dlg_16_9_v2_f_g.flac | dlg | Aoede | contemptuous | Опять за старое? Второй раз не поверю |
| dlg_16_9_v2_g.flac | dlg | Schedar | contemptuous | Опять за старое? Второй раз не поверю |
| dlg_17_0_v2_f_g.flac | dlg | Aoede | frightened | Только не надо... я скажу |
| dlg_17_0_v2_g.flac | dlg | Schedar | frightened | Только не надо... я скажу |
| dlg_17_1_v2_f_g.flac | dlg | Aoede | frightened | Хорошо, хорошо! Всё скажу |
| dlg_17_1_v2_g.flac | dlg | Schedar | frightened | Хорошо, хорошо! Всё скажу |
| dlg_17_2_v2_f_g.flac | dlg | Aoede | frightened | Не трогайте меня, я всё сделаю |
| dlg_17_2_v2_g.flac | dlg | Schedar | frightened | Не трогайте меня, я всё сделаю |
| dlg_17_3_v2_f_g.flac | dlg | Aoede | frightened | Спокойно… договоримся |
| dlg_17_3_v2_g.flac | dlg | Schedar | frightened | Спокойно… договоримся |
| dlg_17_4_v2_f_g.flac | dlg | Aoede | frightened | Пощадите! Всё, что хотите! |
| dlg_17_4_v2_g.flac | dlg | Schedar | frightened | Пощадите! Всё, что хотите! |
| dlg_17_5_v2_f_g.flac | dlg | Aoede | frightened | …Вы об этом пожалеете. Но — ладно |
| dlg_17_5_v2_g.flac | dlg | Schedar | frightened | …Вы об этом пожалеете. Но — ладно |
| dlg_17_6_v2_f_g.flac | dlg | Aoede | frightened | Ладно. Ваша сила. Пока |
| dlg_17_6_v2_g.flac | dlg | Schedar | frightened | Ладно. Ваша сила. Пока |
| dlg_17_7_v2_f_g.flac | dlg | Aoede | frightened | Ненавижу вас. Но скажу |
| dlg_17_7_v2_g.flac | dlg | Schedar | frightened | Ненавижу вас. Но скажу |
| dlg_17_8_v2_f_g.flac | dlg | Aoede | frightened | Уберите. Всё скажу |
| dlg_17_8_v2_g.flac | dlg | Schedar | frightened | Уберите. Всё скажу |
| dlg_18_0_v2_f_g.flac | dlg | Aoede | defiant | Убери железо, пока цел |
| dlg_18_0_v2_g.flac | dlg | Schedar | defiant | Убери железо, пока цел |
| dlg_18_1_v2_f_g.flac | dlg | Aoede | defiant | Не на того напал |
| dlg_18_1_v2_g.flac | dlg | Schedar | defiant | Не на того напал |
| dlg_18_2_v2_f_g.flac | dlg | Aoede | defiant | Пугать меня вздумал? Стража! |
| dlg_18_2_v2_g.flac | dlg | Schedar | defiant | Пугать меня вздумал? Стража! |
| dlg_18_3_v2_f_g.flac | dlg | Aoede | defiant | Сейчас ты об этом пожалеешь |
| dlg_18_3_v2_g.flac | dlg | Schedar | defiant | Сейчас ты об этом пожалеешь |
| dlg_18_4_v2_f_g.flac | dlg | Aoede | defiant | Я и не таких видала. Стража! |
| dlg_18_4_v2_g.flac | dlg | Schedar | defiant | Я и не таких видал. Стража! |
| dlg_18_5_v2_f_g.flac | dlg | Aoede | defiant | Попробуй только — останешься без руки |
| dlg_18_5_v2_g.flac | dlg | Schedar | defiant | Попробуй только — останешься без руки |
| dlg_18_6_v2_f_g.flac | dlg | Aoede | defiant | Угроз я не боюсь. Стража, сюда! |
| dlg_18_6_v2_g.flac | dlg | Schedar | defiant | Угроз я не боюсь. Стража, сюда! |
| dlg_18_7_v2_f_g.flac | dlg | Aoede | defiant | Ты что, своего пугать вздумал? |
| dlg_18_7_v2_g.flac | dlg | Schedar | defiant | Ты что, своего пугать вздумал? |
| dlg_18_8_v2_f_g.flac | dlg | Aoede | defiant | Вот оно, твоё настоящее лицо |
| dlg_18_8_v2_g.flac | dlg | Schedar | defiant | Вот оно, твоё настоящее лицо |
| dlg_19_0_v2_f_g.flac | dlg | Aoede | tense | Чего вы хотите? Только тихо |
| dlg_19_0_v2_g.flac | dlg | Schedar | tense | Чего вы хотите? Только тихо |
| dlg_19_1_v2_f_g.flac | dlg | Aoede | tense | Ладно… Что вам нужно? |
| dlg_19_1_v2_g.flac | dlg | Schedar | tense | Ладно… Что вам нужно? |
| dlg_19_2_v2_f_g.flac | dlg | Aoede | tense | Не здесь. Говорите, чего хотите |
| dlg_19_2_v2_g.flac | dlg | Schedar | tense | Не здесь. Говорите, чего хотите |
| dlg_19_3_v2_f_g.flac | dlg | Aoede | tense | Тише. Договоримся |
| dlg_19_3_v2_g.flac | dlg | Schedar | tense | Тише. Договоримся |
| dlg_19_4_v2_f_g.flac | dlg | Aoede | tense | Только никому! Я сделаю, что скажете |
| dlg_19_4_v2_g.flac | dlg | Schedar | tense | Только никому! Я сделаю, что скажете |
| dlg_19_5_v2_f_g.flac | dlg | Aoede | tense | Хорошо сыграно. Каковы условия? |
| dlg_19_5_v2_g.flac | dlg | Schedar | tense | Хорошо сыграно. Каковы условия? |
| dlg_19_6_v2_f_g.flac | dlg | Aoede | tense | Вы пожалеете об этом. Но — говорите |
| dlg_19_6_v2_g.flac | dlg | Schedar | tense | Вы пожалеете об этом. Но — говорите |
| dlg_19_7_v2_f_g.flac | dlg | Aoede | tense | Будьте вы прокляты. Говорите, что нужно |
| dlg_19_7_v2_g.flac | dlg | Schedar | tense | Будьте вы прокляты. Говорите, что нужно |
| dlg_1_0_v2_f_g.flac | dlg | Aoede | shrugging | Мало ли что болтают |
| dlg_1_0_v2_g.flac | dlg | Schedar | shrugging | Мало ли что болтают |
| dlg_1_10_v2_f_g.flac | dlg | Aoede | shrugging | Врать не стану: ничего путного не слышно |
| dlg_1_10_v2_g.flac | dlg | Schedar | shrugging | Врать не стану: ничего путного не слышно |
| dlg_1_11_v2_f_g.flac | dlg | Aoede | shrugging | Чтобы вы потом разнесли? Нет уж |
| dlg_1_11_v2_g.flac | dlg | Schedar | shrugging | Чтобы вы потом разнесли? Нет уж |
| dlg_1_1_v2_f_g.flac | dlg | Aoede | shrugging | Слухов тут больше, чем людей, — не собираю |
| dlg_1_1_v2_g.flac | dlg | Schedar | shrugging | Слухов тут больше, чем людей, — не собираю |
| dlg_1_2_v2_f_g.flac | dlg | Aoede | shrugging | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_2_v2_g.flac | dlg | Schedar | shrugging | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_3_v2_f_g.flac | dlg | Aoede | shrugging | Не слышала. А и слышала бы — не повторила |
| dlg_1_3_v2_g.flac | dlg | Schedar | shrugging | Не слышал. А и слышал бы — не повторил |
| dlg_1_4_v2_f_g.flac | dlg | Aoede | shrugging | Врать не хочу, а правды не знаю |
| dlg_1_4_v2_g.flac | dlg | Schedar | shrugging | Врать не хочу, а правды не знаю |
| dlg_1_5_v2_f_g.flac | dlg | Aoede | shrugging | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_5_v2_g.flac | dlg | Schedar | shrugging | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_6_v2_f_g.flac | dlg | Aoede | shrugging | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_6_v2_g.flac | dlg | Schedar | shrugging | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_7_v2_f_g.flac | dlg | Aoede | shrugging | Кто вас подослал выспрашивать? |
| dlg_1_7_v2_g.flac | dlg | Schedar | shrugging | Кто вас подослал выспрашивать? |
| dlg_1_8_v2_f_g.flac | dlg | Aoede | shrugging | Вам — ни слова |
| dlg_1_8_v2_g.flac | dlg | Schedar | shrugging | Вам — ни слова |
| dlg_1_9_v2_f_g.flac | dlg | Aoede | shrugging | Сплетен не держу |
| dlg_1_9_v2_g.flac | dlg | Schedar | shrugging | Сплетен не держу |
| dlg_20_0_v2_f_g.flac | dlg | Aoede | defiant | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_0_v2_g.flac | dlg | Schedar | defiant | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_1_v2_f_g.flac | dlg | Aoede | defiant | Шантажом меня не возьмёшь |
| dlg_20_1_v2_g.flac | dlg | Schedar | defiant | Шантажом меня не возьмёшь |
| dlg_20_2_v2_f_g.flac | dlg | Aoede | defiant | Иди и рассказывай. Я не боюсь |
| dlg_20_2_v2_g.flac | dlg | Schedar | defiant | Иди и рассказывай. Я не боюсь |
| dlg_20_3_v2_f_g.flac | dlg | Aoede | defiant | Ищите кого попугливее |
| dlg_20_3_v2_g.flac | dlg | Schedar | defiant | Ищите кого попугливее |
| dlg_20_4_v2_f_g.flac | dlg | Aoede | defiant | Пусть знают все. Мне скрывать нечего |
| dlg_20_4_v2_g.flac | dlg | Schedar | defiant | Пусть знают все. Мне скрывать нечего |
| dlg_20_5_v2_f_g.flac | dlg | Aoede | defiant | Лучше правда, чем жить у вас на крючке |
| dlg_20_5_v2_g.flac | dlg | Schedar | defiant | Лучше правда, чем жить у вас на крючке |
| dlg_20_6_v2_f_g.flac | dlg | Aoede | defiant | Скажешь хоть слово — и тебя не найдут |
| dlg_20_6_v2_g.flac | dlg | Schedar | defiant | Скажешь хоть слово — и тебя не найдут |
| dlg_20_7_v2_f_g.flac | dlg | Aoede | defiant | Я вас больше не боюсь |
| dlg_20_7_v2_g.flac | dlg | Schedar | defiant | Я вас больше не боюсь |
| dlg_21_0_v2_f_g.flac | dlg | Aoede | angry | Ещё слово — и будет драка |
| dlg_21_0_v2_g.flac | dlg | Schedar | angry | Ещё слово — и будет драка |
| dlg_21_1_v2_f_g.flac | dlg | Aoede | angry | Не зли меня |
| dlg_21_1_v2_g.flac | dlg | Schedar | angry | Не зли меня |
| dlg_21_2_v2_f_g.flac | dlg | Aoede | angry | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_2_v2_g.flac | dlg | Schedar | angry | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_3_v2_f_g.flac | dlg | Aoede | angry | Иди своей дорогой |
| dlg_21_3_v2_g.flac | dlg | Schedar | angry | Иди своей дорогой |
| dlg_21_4_v2_f_g.flac | dlg | Aoede | angry | Язык свой придержи, а то вырву |
| dlg_21_4_v2_g.flac | dlg | Schedar | angry | Язык свой придержи, а то вырву |
| dlg_21_5_v2_f_g.flac | dlg | Aoede | angry | Не надо так. Я не хочу ссоры |
| dlg_21_5_v2_g.flac | dlg | Schedar | angry | Не надо так. Я не хочу ссоры |
| dlg_21_6_v2_f_g.flac | dlg | Aoede | angry | Не надо, друг. Не порти то, что было |
| dlg_21_6_v2_g.flac | dlg | Schedar | angry | Не надо, друг. Не порти то, что было |
| dlg_21_7_v2_f_g.flac | dlg | Aoede | angry | Давно хочется дать вам по зубам |
| dlg_21_7_v2_g.flac | dlg | Schedar | angry | Давно хочется дать вам по зубам |
| dlg_22_0_v2_f_g.flac | dlg | Aoede | easygoing | Бывает |
| dlg_22_0_v2_g.flac | dlg | Schedar | easygoing | Бывает |
| dlg_22_1_v2_f_g.flac | dlg | Aoede | easygoing | Что ж, не всякий разговор к добру |
| dlg_22_1_v2_g.flac | dlg | Schedar | easygoing | Что ж, не всякий разговор к добру |
| dlg_22_2_v2_f_g.flac | dlg | Aoede | easygoing | Ваше право |
| dlg_22_2_v2_g.flac | dlg | Schedar | easygoing | Ваше право |
| dlg_22_3_v2_f_g.flac | dlg | Aoede | easygoing | Понимаю |
| dlg_22_3_v2_g.flac | dlg | Schedar | easygoing | Понимаю |
| dlg_22_4_v2_f_g.flac | dlg | Aoede | easygoing | Ничего, в другой раз |
| dlg_22_4_v2_g.flac | dlg | Schedar | easygoing | Ничего, в другой раз |
| dlg_22_5_v2_f_g.flac | dlg | Aoede | easygoing | Как угодно |
| dlg_22_5_v2_g.flac | dlg | Schedar | easygoing | Как угодно |
| dlg_22_6_v2_f_g.flac | dlg | Aoede | easygoing | Ничего, друг. В другой раз |
| dlg_22_6_v2_g.flac | dlg | Schedar | easygoing | Ничего, друг. В другой раз |
| dlg_22_7_v2_f_g.flac | dlg | Aoede | easygoing | Не беда. Вы и так много сделали |
| dlg_22_7_v2_g.flac | dlg | Schedar | easygoing | Не беда. Вы и так много сделали |
| dlg_22_8_v2_f_g.flac | dlg | Aoede | easygoing | Как знаете |
| dlg_22_8_v2_g.flac | dlg | Schedar | easygoing | Как знаете |
| dlg_23_0_v2_f_g.flac | dlg | Aoede | impatient | Мы об этом говорили |
| dlg_23_0_v2_g.flac | dlg | Schedar | impatient | Мы об этом говорили |
| dlg_23_1_v2_f_g.flac | dlg | Aoede | impatient | Я уже ответила вам сегодня |
| dlg_23_1_v2_g.flac | dlg | Schedar | impatient | Я уже ответил вам сегодня |
| dlg_23_2_v2_f_g.flac | dlg | Aoede | impatient | Опять вы с тем же? |
| dlg_23_2_v2_g.flac | dlg | Schedar | impatient | Опять вы с тем же? |
| dlg_23_3_v2_f_g.flac | dlg | Aoede | impatient | Сегодня — хватит об этом |
| dlg_23_3_v2_g.flac | dlg | Schedar | impatient | Сегодня — хватит об этом |
| dlg_23_4_v2_f_g.flac | dlg | Aoede | impatient | Зачем спрашивать дважды? |
| dlg_23_4_v2_g.flac | dlg | Schedar | impatient | Зачем спрашивать дважды? |
| dlg_23_5_v2_f_g.flac | dlg | Aoede | impatient | Я же сказала уже — не сердитесь |
| dlg_23_5_v2_g.flac | dlg | Schedar | impatient | Я же сказал уже — не сердитесь |
| dlg_23_6_v2_f_g.flac | dlg | Aoede | impatient | За второй ответ — отдельная плата |
| dlg_23_6_v2_g.flac | dlg | Schedar | impatient | За второй ответ — отдельная плата |
| dlg_23_7_v2_f_g.flac | dlg | Aoede | impatient | Друг, ты повторяешься |
| dlg_23_7_v2_g.flac | dlg | Schedar | impatient | Друг, ты повторяешься |
| dlg_23_8_v2_f_g.flac | dlg | Aoede | impatient | Сколько можно? Уходите |
| dlg_23_8_v2_g.flac | dlg | Schedar | impatient | Сколько можно? Уходите |
| dlg_24_0_v2_f_g.flac | dlg | Aoede | disappointed | Я на вас рассчитывала |
| dlg_24_0_v2_g.flac | dlg | Schedar | disappointed | Я на вас рассчитывал |
| dlg_24_1_v2_f_g.flac | dlg | Aoede | disappointed | От друга — и такое |
| dlg_24_1_v2_g.flac | dlg | Schedar | disappointed | От друга — и такое |
| dlg_24_2_v2_f_g.flac | dlg | Aoede | disappointed | Опять подвели. Как всегда |
| dlg_24_2_v2_g.flac | dlg | Schedar | disappointed | Опять подвели. Как всегда |
| dlg_25_0_v2_f_g.flac | dlg | Aoede | willing | Слушайте, расскажу, что знаю |
| dlg_25_0_v2_g.flac | dlg | Schedar | willing | Слушайте, расскажу, что знаю |
| dlg_25_1_v2_f_g.flac | dlg | Aoede | willing | Спрашиваете — отвечу |
| dlg_25_1_v2_g.flac | dlg | Schedar | willing | Спрашиваете — отвечу |
| dlg_25_2_v2_f_g.flac | dlg | Aoede | willing | Садитесь, раз интересно |
| dlg_25_2_v2_g.flac | dlg | Schedar | willing | Садитесь, раз интересно |
| dlg_25_3_v2_f_g.flac | dlg | Aoede | willing | Скажу. Но в следующий раз — за монету |
| dlg_25_3_v2_g.flac | dlg | Schedar | willing | Скажу. Но в следующий раз — за монету |
| dlg_25_4_v2_f_g.flac | dlg | Aoede | willing | Только тихо, ладно? Вот что тут творится |
| dlg_25_4_v2_g.flac | dlg | Schedar | willing | Только тихо, ладно? Вот что тут творится |
| dlg_25_5_v2_f_g.flac | dlg | Aoede | willing | Так и быть, просвещу вас |
| dlg_25_5_v2_g.flac | dlg | Schedar | willing | Так и быть, просвещу вас |
| dlg_25_6_v2_f_g.flac | dlg | Aoede | willing | Тебе — всё как есть |
| dlg_25_6_v2_g.flac | dlg | Schedar | willing | Тебе — всё как есть |
| dlg_25_7_v2_f_g.flac | dlg | Aoede | willing | Вам расскажу без утайки |
| dlg_25_7_v2_g.flac | dlg | Schedar | willing | Вам расскажу без утайки |
| dlg_25_8_v2_f_g.flac | dlg | Aoede | willing | Коротко: вот что тут было |
| dlg_25_8_v2_g.flac | dlg | Schedar | willing | Коротко: вот что тут было |
| dlg_26_0_v2_f_g.flac | dlg | Aoede | patient | Да, про это уже шла речь. Вот как было |
| dlg_26_0_v2_g.flac | dlg | Schedar | patient | Да, про это уже шла речь. Вот как было |
| dlg_26_1_v2_f_g.flac | dlg | Aoede | patient | Повторю, раз не расслышали |
| dlg_26_1_v2_g.flac | dlg | Schedar | patient | Повторю, раз не расслышали |
| dlg_26_2_v2_f_g.flac | dlg | Aoede | patient | Слушайте ещё раз, внимательнее |
| dlg_26_2_v2_g.flac | dlg | Schedar | patient | Слушайте ещё раз, внимательнее |
| dlg_26_3_v2_f_g.flac | dlg | Aoede | patient | По порядку, ещё раз |
| dlg_26_3_v2_g.flac | dlg | Schedar | patient | По порядку, ещё раз |
| dlg_26_4_v2_f_g.flac | dlg | Aoede | patient | Для тебя — хоть дважды |
| dlg_26_4_v2_g.flac | dlg | Schedar | patient | Для тебя — хоть дважды |
| dlg_26_5_v2_f_g.flac | dlg | Aoede | patient | Последний раз повторяю |
| dlg_26_5_v2_g.flac | dlg | Schedar | patient | Последний раз повторяю |
| dlg_27_0_v2_f_g.flac | dlg | Aoede | curt | Больше мне добавить нечего |
| dlg_27_0_v2_g.flac | dlg | Schedar | curt | Больше мне добавить нечего |
| dlg_27_1_v2_f_g.flac | dlg | Aoede | curt | Что было — рассказано |
| dlg_27_1_v2_g.flac | dlg | Schedar | curt | Что было — рассказано |
| dlg_27_2_v2_f_g.flac | dlg | Aoede | curt | Больше ничего не знаю |
| dlg_27_2_v2_g.flac | dlg | Schedar | curt | Больше ничего не знаю |
| dlg_27_3_v2_f_g.flac | dlg | Aoede | curt | Отстаньте со своими расспросами |
| dlg_27_3_v2_g.flac | dlg | Schedar | curt | Отстаньте со своими расспросами |
| dlg_27_4_v2_f_g.flac | dlg | Aoede | curt | Честно, друг, больше ничего не знаю |
| dlg_27_4_v2_g.flac | dlg | Schedar | curt | Честно, друг, больше ничего не знаю |
| dlg_28_0_v2_f_g.flac | dlg | Aoede | worried | Времена неспокойные, вот что скажу |
| dlg_28_0_v2_g.flac | dlg | Schedar | worried | Времена неспокойные, вот что скажу |
| dlg_28_1_v2_f_g.flac | dlg | Aoede | worried | В мире всякое творится, слушайте |
| dlg_28_1_v2_g.flac | dlg | Schedar | worried | В мире всякое творится, слушайте |
| dlg_28_2_v2_f_g.flac | dlg | Aoede | worried | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_2_v2_g.flac | dlg | Schedar | worried | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_3_v2_f_g.flac | dlg | Aoede | worried | Боги гневаются, вот и неспокойно |
| dlg_28_3_v2_g.flac | dlg | Schedar | worried | Боги гневаются, вот и неспокойно |
| dlg_28_4_v2_f_g.flac | dlg | Aoede | worried | Торговля встала, вот главное |
| dlg_28_4_v2_g.flac | dlg | Schedar | worried | Торговля встала, вот главное |
| dlg_28_5_v2_f_g.flac | dlg | Aoede | worried | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_5_v2_g.flac | dlg | Schedar | worried | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_6_v2_f_g.flac | dlg | Aoede | worried | Тебе скажу как есть: худо в мире |
| dlg_28_6_v2_g.flac | dlg | Schedar | worried | Тебе скажу как есть: худо в мире |
| dlg_29_0_v2_f_g.flac | dlg | Aoede | dismissive | Моё дело — свой двор, а не весь мир |
| dlg_29_0_v2_g.flac | dlg | Schedar | dismissive | Моё дело — свой двор, а не весь мир |
| dlg_29_1_v2_f_g.flac | dlg | Aoede | dismissive | Не знаю я, что там за горами |
| dlg_29_1_v2_g.flac | dlg | Schedar | dismissive | Не знаю я, что там за горами |
| dlg_29_2_v2_f_g.flac | dlg | Aoede | dismissive | Мне бы тут управиться, не до мира |
| dlg_29_2_v2_g.flac | dlg | Schedar | dismissive | Мне бы тут управиться, не до мира |
| dlg_29_3_v2_f_g.flac | dlg | Aoede | dismissive | Про мир спросите у кого-нибудь другого |
| dlg_29_3_v2_g.flac | dlg | Schedar | dismissive | Про мир спросите у кого-нибудь другого |
| dlg_29_4_v2_f_g.flac | dlg | Aoede | dismissive | Не интересуюсь |
| dlg_29_4_v2_g.flac | dlg | Schedar | dismissive | Не интересуюсь |
| dlg_2_0_v2_f_g.flac | dlg | Aoede | thoughtful | Пожалуй, вы правы |
| dlg_2_0_v2_g.flac | dlg | Schedar | thoughtful | Пожалуй, вы правы |
| dlg_2_10_v2_f_g.flac | dlg | Aoede | thoughtful | Согласна, если мне с этого не убыток |
| dlg_2_10_v2_g.flac | dlg | Schedar | thoughtful | Согласен, если мне с этого не убыток |
| dlg_2_11_v2_f_g.flac | dlg | Aoede | thoughtful | Не люблю вас, но тут вы правы |
| dlg_2_11_v2_g.flac | dlg | Schedar | thoughtful | Не люблю вас, но тут вы правы |
| dlg_2_12_v2_f_g.flac | dlg | Aoede | thoughtful | Ладно. На этот раз соглашусь |
| dlg_2_12_v2_g.flac | dlg | Schedar | thoughtful | Ладно. На этот раз соглашусь |
| dlg_2_13_v2_f_g.flac | dlg | Aoede | thoughtful | С тобой спорить — себе дороже. Прав ты |
| dlg_2_13_v2_g.flac | dlg | Schedar | thoughtful | С тобой спорить — себе дороже. Прав ты |
| dlg_2_14_v2_f_g.flac | dlg | Aoede | thoughtful | Вам я верю. Будь по-вашему |
| dlg_2_14_v2_g.flac | dlg | Schedar | thoughtful | Вам я верю. Будь по-вашему |
| dlg_2_15_v2_f_g.flac | dlg | Aoede | thoughtful | Правы. Хоть и не хочется это признавать |
| dlg_2_15_v2_g.flac | dlg | Schedar | thoughtful | Правы. Хоть и не хочется это признавать |
| dlg_2_1_v2_f_g.flac | dlg | Aoede | thoughtful | Убедили. Сделаю по-вашему |
| dlg_2_1_v2_g.flac | dlg | Schedar | thoughtful | Убедили. Сделаю по-вашему |
| dlg_2_2_v2_f_g.flac | dlg | Aoede | thoughtful | Что ж, в ваших словах есть толк |
| dlg_2_2_v2_g.flac | dlg | Schedar | thoughtful | Что ж, в ваших словах есть толк |
| dlg_2_3_v2_f_g.flac | dlg | Aoede | thoughtful | Может, и правда пора посмотреть иначе |
| dlg_2_3_v2_g.flac | dlg | Schedar | thoughtful | Может, и правда пора посмотреть иначе |
| dlg_2_4_v2_f_g.flac | dlg | Aoede | thoughtful | Доводы весомые. Принимаю |
| dlg_2_4_v2_g.flac | dlg | Schedar | thoughtful | Доводы весомые. Принимаю |
| dlg_2_5_v2_f_g.flac | dlg | Aoede | thoughtful | Редко признаю чужую правоту, но тут — да |
| dlg_2_5_v2_g.flac | dlg | Schedar | thoughtful | Редко признаю чужую правоту, но тут — да |
| dlg_2_6_v2_f_g.flac | dlg | Aoede | thoughtful | Раз вы так считаете — так и быть |
| dlg_2_6_v2_g.flac | dlg | Schedar | thoughtful | Раз вы так считаете — так и быть |
| dlg_2_7_v2_f_g.flac | dlg | Aoede | thoughtful | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_7_v2_g.flac | dlg | Schedar | thoughtful | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_8_v2_f_g.flac | dlg | Aoede | thoughtful | Деды бы поспорили, но я соглашусь |
| dlg_2_8_v2_g.flac | dlg | Schedar | thoughtful | Деды бы поспорили, но я соглашусь |
| dlg_2_9_v2_f_g.flac | dlg | Aoede | thoughtful | Вот это дело! Давно пора было так думать |
| dlg_2_9_v2_g.flac | dlg | Schedar | thoughtful | Вот это дело! Давно пора было так думать |
| dlg_30_0_v2_f_g.flac | dlg | Aoede | knowing | Понимаю. Можете на меня положиться |
| dlg_30_0_v2_g.flac | dlg | Schedar | knowing | Понимаю. Можете на меня положиться |
| dlg_30_1_v2_f_g.flac | dlg | Aoede | knowing | Можно не продолжать, всё ясно |
| dlg_30_1_v2_g.flac | dlg | Schedar | knowing | Можно не продолжать, всё ясно |
| dlg_30_2_v2_f_g.flac | dlg | Aoede | knowing | Намёк понят |
| dlg_30_2_v2_g.flac | dlg | Schedar | knowing | Намёк понят |
| dlg_30_3_v2_f_g.flac | dlg | Aoede | knowing | Понимаю больше, чем вы сказали |
| dlg_30_3_v2_g.flac | dlg | Schedar | knowing | Понимаю больше, чем вы сказали |
| dlg_30_4_v2_f_g.flac | dlg | Aoede | knowing | Для тебя — сделаю |
| dlg_30_4_v2_g.flac | dlg | Schedar | knowing | Для тебя — сделаю |
| dlg_31_0_v2_f_g.flac | dlg | Aoede | convinced | Раз так — верю вам |
| dlg_31_0_v2_g.flac | dlg | Schedar | convinced | Раз так — верю вам |
| dlg_31_1_v2_f_g.flac | dlg | Aoede | convinced | Ну, если так, другое дело |
| dlg_31_1_v2_g.flac | dlg | Schedar | convinced | Ну, если так, другое дело |
| dlg_31_2_v2_f_g.flac | dlg | Aoede | convinced | Что ж, похоже на правду |
| dlg_31_2_v2_g.flac | dlg | Schedar | convinced | Что ж, похоже на правду |
| dlg_31_3_v2_f_g.flac | dlg | Aoede | convinced | Верю. Людям надо верить |
| dlg_31_3_v2_g.flac | dlg | Schedar | convinced | Верю. Людям надо верить |
| dlg_31_4_v2_f_g.flac | dlg | Aoede | convinced | Тебе — верю |
| dlg_31_4_v2_g.flac | dlg | Schedar | convinced | Тебе — верю |
| dlg_32_0_v2_f_g.flac | dlg | Aoede | angry outburst | Да что вы понимаете! Ладно, слушайте |
| dlg_32_0_v2_g.flac | dlg | Schedar | angry outburst | Да что вы понимаете! Ладно, слушайте |
| dlg_32_1_v2_f_g.flac | dlg | Aoede | angry outburst | Довели! Так знайте же |
| dlg_32_1_v2_g.flac | dlg | Schedar | angry outburst | Довели! Так знайте же |
| dlg_32_2_v2_f_g.flac | dlg | Aoede | angry outburst | Хватит! Скажу, раз так хотите |
| dlg_32_2_v2_g.flac | dlg | Schedar | angry outburst | Хватит! Скажу, раз так хотите |
| dlg_32_3_v2_f_g.flac | dlg | Aoede | angry outburst | Ах так? Получайте правду |
| dlg_32_3_v2_g.flac | dlg | Schedar | angry outburst | Ах так? Получайте правду |
| dlg_32_4_v2_f_g.flac | dlg | Aoede | angry outburst | Ненавижу вас. Но слушайте |
| dlg_32_4_v2_g.flac | dlg | Schedar | angry outburst | Ненавижу вас. Но слушайте |
| dlg_33_0_v2_f_g.flac | dlg | Aoede | heated | Вы не знаете, о чём говорите! |
| dlg_33_0_v2_g.flac | dlg | Schedar | heated | Вы не знаете, о чём говорите! |
| dlg_33_1_v2_f_g.flac | dlg | Aoede | heated | Чушь! Всё не так |
| dlg_33_1_v2_g.flac | dlg | Schedar | heated | Чушь! Всё не так |
| dlg_33_2_v2_f_g.flac | dlg | Aoede | heated | Спорить с вами — время терять |
| dlg_33_2_v2_g.flac | dlg | Schedar | heated | Спорить с вами — время терять |
| dlg_33_3_v2_f_g.flac | dlg | Aoede | heated | Куда вам со мной спорить |
| dlg_33_3_v2_g.flac | dlg | Schedar | heated | Куда вам со мной спорить |
| dlg_33_4_v2_f_g.flac | dlg | Aoede | heated | Нет, друг, тут ты неправ |
| dlg_33_4_v2_g.flac | dlg | Schedar | heated | Нет, друг, тут ты неправ |
| dlg_33_5_v2_f_g.flac | dlg | Aoede | heated | От вас другого и не ждёшь |
| dlg_33_5_v2_g.flac | dlg | Schedar | heated | От вас другого и не ждёшь |
| dlg_34_0_v2_f_g.flac | dlg | Aoede | thoughtful | Может, боги и вправду так рассудили |
| dlg_34_0_v2_g.flac | dlg | Schedar | thoughtful | Может, боги и вправду так рассудили |
| dlg_34_1_v2_f_g.flac | dlg | Aoede | thoughtful | Над этим стоит помолиться |
| dlg_34_1_v2_g.flac | dlg | Schedar | thoughtful | Над этим стоит помолиться |
| dlg_34_2_v2_f_g.flac | dlg | Aoede | thoughtful | В ваших словах есть вера |
| dlg_34_2_v2_g.flac | dlg | Schedar | thoughtful | В ваших словах есть вера |
| dlg_34_3_v2_f_g.flac | dlg | Aoede | thoughtful | Вы говорите, как истинно верующий |
| dlg_34_3_v2_g.flac | dlg | Schedar | thoughtful | Вы говорите, как истинно верующий |
| dlg_34_4_v2_f_g.flac | dlg | Aoede | thoughtful | С тобой и о богах говорить легко |
| dlg_34_4_v2_g.flac | dlg | Schedar | thoughtful | С тобой и о богах говорить легко |
| dlg_35_0_v2_f_g.flac | dlg | Aoede | outraged | Не вам судить о богах! |
| dlg_35_0_v2_g.flac | dlg | Schedar | outraged | Не вам судить о богах! |
| dlg_35_1_v2_f_g.flac | dlg | Aoede | outraged | Святотатство! |
| dlg_35_1_v2_g.flac | dlg | Schedar | outraged | Святотатство! |
| dlg_35_2_v2_f_g.flac | dlg | Aoede | outraged | Боги вам этого не простят |
| dlg_35_2_v2_g.flac | dlg | Schedar | outraged | Боги вам этого не простят |
| dlg_35_3_v2_f_g.flac | dlg | Aoede | outraged | Замолчите, пока небо не услышало! |
| dlg_35_3_v2_g.flac | dlg | Schedar | outraged | Замолчите, пока небо не услышало! |
| dlg_35_4_v2_f_g.flac | dlg | Aoede | outraged | Вера не спор, её не переспоришь |
| dlg_35_4_v2_g.flac | dlg | Schedar | outraged | Вера не спор, её не переспоришь |
| dlg_35_5_v2_f_g.flac | dlg | Aoede | outraged | Не надо, друг. Это святое |
| dlg_35_5_v2_g.flac | dlg | Schedar | outraged | Не надо, друг. Это святое |
| dlg_36_0_v2_f_g.flac | dlg | Aoede | thoughtful | В этом есть правда, как ни крути |
| dlg_36_0_v2_g.flac | dlg | Schedar | thoughtful | В этом есть правда, как ни крути |
| dlg_36_1_v2_f_g.flac | dlg | Aoede | thoughtful | С податями и вправду перегнули |
| dlg_36_1_v2_g.flac | dlg | Schedar | thoughtful | С податями и вправду перегнули |
| dlg_36_2_v2_f_g.flac | dlg | Aoede | thoughtful | Может, и вправду пора менять порядки |
| dlg_36_2_v2_g.flac | dlg | Schedar | thoughtful | Может, и вправду пора менять порядки |
| dlg_36_3_v2_f_g.flac | dlg | Aoede | thoughtful | Не люблю перемен, но тут вы правы |
| dlg_36_3_v2_g.flac | dlg | Schedar | thoughtful | Не люблю перемен, но тут вы правы |
| dlg_36_4_v2_f_g.flac | dlg | Aoede | thoughtful | Наконец-то кто-то говорит дело |
| dlg_36_4_v2_g.flac | dlg | Schedar | thoughtful | Наконец-то кто-то говорит дело |
| dlg_36_5_v2_f_g.flac | dlg | Aoede | thoughtful | Вот и у меня те же мысли |
| dlg_36_5_v2_g.flac | dlg | Schedar | thoughtful | Вот и у меня те же мысли |
| dlg_37_0_v2_f_g.flac | dlg | Aoede | stern | Власть — не вашего ума дело |
| dlg_37_0_v2_g.flac | dlg | Schedar | stern | Власть — не вашего ума дело |
| dlg_37_1_v2_f_g.flac | dlg | Aoede | stern | Про такое вслух не говорят |
| dlg_37_1_v2_g.flac | dlg | Schedar | stern | Про такое вслух не говорят |
| dlg_37_2_v2_f_g.flac | dlg | Aoede | stern | Держава как стояла, так и будет стоять |
| dlg_37_2_v2_g.flac | dlg | Schedar | stern | Держава как стояла, так и будет стоять |
| dlg_37_3_v2_f_g.flac | dlg | Aoede | stern | Власть? Да она нас и не спрашивает |
| dlg_37_3_v2_g.flac | dlg | Schedar | stern | Власть? Да она нас и не спрашивает |
| dlg_37_4_v2_f_g.flac | dlg | Aoede | stern | Порядок заведён не нами |
| dlg_37_4_v2_g.flac | dlg | Schedar | stern | Порядок заведён не нами |
| dlg_37_5_v2_f_g.flac | dlg | Aoede | stern | Донести бы на вас за такие речи |
| dlg_37_5_v2_g.flac | dlg | Schedar | stern | Донести бы на вас за такие речи |
| dlg_38_0_v2_f_g.flac | dlg | Aoede | offended | У нас так не кланяются |
| dlg_38_0_v2_g.flac | dlg | Schedar | offended | У нас так не кланяются |
| dlg_38_1_v2_f_g.flac | dlg | Aoede | offended | Это что, насмешка? |
| dlg_38_1_v2_g.flac | dlg | Schedar | offended | Это что, насмешка? |
| dlg_38_2_v2_f_g.flac | dlg | Aoede | offended | Не знаете обычаев — не берите |
| dlg_38_2_v2_g.flac | dlg | Schedar | offended | Не знаете обычаев — не берите |
| dlg_38_3_v2_f_g.flac | dlg | Aoede | offended | Чужакам наших обычаев не понять |
| dlg_38_3_v2_g.flac | dlg | Schedar | offended | Чужакам наших обычаев не понять |
| dlg_38_4_v2_f_g.flac | dlg | Aoede | offended | Ничего, научишься |
| dlg_38_4_v2_g.flac | dlg | Schedar | offended | Ничего, научишься |
| dlg_39_0_v2_f_g.flac | dlg | Aoede | satisfied | По рукам, договорились |
| dlg_39_0_v2_g.flac | dlg | Schedar | satisfied | По рукам, договорились |
| dlg_39_1_v2_f_g.flac | dlg | Aoede | satisfied | Что ж, такое обоим подходит |
| dlg_39_1_v2_g.flac | dlg | Schedar | satisfied | Что ж, такое обоим подходит |
| dlg_39_2_v2_f_g.flac | dlg | Aoede | satisfied | Уговор так уговор |
| dlg_39_2_v2_g.flac | dlg | Schedar | satisfied | Уговор так уговор |
| dlg_39_3_v2_f_g.flac | dlg | Aoede | satisfied | По рукам, но моя доля побольше |
| dlg_39_3_v2_g.flac | dlg | Schedar | satisfied | По рукам, но моя доля побольше |
| dlg_39_4_v2_f_g.flac | dlg | Aoede | satisfied | Со своим всегда договоримся |
| dlg_39_4_v2_g.flac | dlg | Schedar | satisfied | Со своим всегда договоримся |
| dlg_39_5_v2_f_g.flac | dlg | Aoede | satisfied | Договорились. Но глаз с вас не спущу |
| dlg_39_5_v2_g.flac | dlg | Schedar | satisfied | Договорились. Но глаз с вас не спущу |
| dlg_3_0_v2_f_g.flac | dlg | Aoede | firm refusal | Нет. И не уговаривайте |
| dlg_3_0_v2_g.flac | dlg | Schedar | firm refusal | Нет. И не уговаривайте |
| dlg_3_10_v2_f_g.flac | dlg | Aoede | firm refusal | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_10_v2_g.flac | dlg | Schedar | firm refusal | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_11_v2_f_g.flac | dlg | Aoede | firm refusal | С вами? Никогда |
| dlg_3_11_v2_g.flac | dlg | Schedar | firm refusal | С вами? Никогда |
| dlg_3_12_v2_f_g.flac | dlg | Aoede | firm refusal | Нет. Разговор окончен |
| dlg_3_12_v2_g.flac | dlg | Schedar | firm refusal | Нет. Разговор окончен |
| dlg_3_13_v2_f_g.flac | dlg | Aoede | firm refusal | Прости, друг, но тут не уступлю |
| dlg_3_13_v2_g.flac | dlg | Schedar | firm refusal | Прости, друг, но тут не уступлю |
| dlg_3_14_v2_f_g.flac | dlg | Aoede | firm refusal | Вам, после всего? Нет |
| dlg_3_14_v2_g.flac | dlg | Schedar | firm refusal | Вам, после всего? Нет |
| dlg_3_15_v2_f_g.flac | dlg | Aoede | firm refusal | Уважаю вас, но нет |
| dlg_3_15_v2_g.flac | dlg | Schedar | firm refusal | Уважаю вас, но нет |
| dlg_3_1_v2_f_g.flac | dlg | Aoede | firm refusal | Сказала нет — значит нет |
| dlg_3_1_v2_g.flac | dlg | Schedar | firm refusal | Сказал нет — значит нет |
| dlg_3_2_v2_f_g.flac | dlg | Aoede | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_2_v2_g.flac | dlg | Schedar | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_3_v2_f_g.flac | dlg | Aoede | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_3_v2_g.flac | dlg | Schedar | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_4_v2_f_g.flac | dlg | Aoede | firm refusal | Моя правда крепче ваших слов |
| dlg_3_4_v2_g.flac | dlg | Schedar | firm refusal | Моя правда крепче ваших слов |
| dlg_3_5_v2_f_g.flac | dlg | Aoede | firm refusal | Доводы слабые. Нет |
| dlg_3_5_v2_g.flac | dlg | Schedar | firm refusal | Доводы слабые. Нет |
| dlg_3_6_v2_f_g.flac | dlg | Aoede | firm refusal | Ещё раз начнёте — пожалеете |
| dlg_3_6_v2_g.flac | dlg | Schedar | firm refusal | Ещё раз начнёте — пожалеете |
| dlg_3_7_v2_f_g.flac | dlg | Aoede | firm refusal | Не вам мне указывать |
| dlg_3_7_v2_g.flac | dlg | Schedar | firm refusal | Не вам мне указывать |
| dlg_3_8_v2_f_g.flac | dlg | Aoede | firm refusal | Так не заведено, и так не будет |
| dlg_3_8_v2_g.flac | dlg | Schedar | firm refusal | Так не заведено, и так не будет |
| dlg_3_9_v2_f_g.flac | dlg | Aoede | firm refusal | Не сердитесь, но нет. Не могу |
| dlg_3_9_v2_g.flac | dlg | Schedar | firm refusal | Не сердитесь, но нет. Не могу |
| dlg_40_0_v2_f_g.flac | dlg | Aoede | firm | Так не договоримся |
| dlg_40_0_v2_g.flac | dlg | Schedar | firm | Так не договоримся |
| dlg_40_1_v2_f_g.flac | dlg | Aoede | firm | Мне это не с руки |
| dlg_40_1_v2_g.flac | dlg | Schedar | firm | Мне это не с руки |
| dlg_40_2_v2_f_g.flac | dlg | Aoede | firm | Ищите другой уговор |
| dlg_40_2_v2_g.flac | dlg | Schedar | firm | Ищите другой уговор |
| dlg_40_3_v2_f_g.flac | dlg | Aoede | firm | С вами никаких уговоров |
| dlg_40_3_v2_g.flac | dlg | Schedar | firm | С вами никаких уговоров |
| dlg_40_4_v2_f_g.flac | dlg | Aoede | firm | Прости, друг, так не выйдет |
| dlg_40_4_v2_g.flac | dlg | Schedar | firm | Прости, друг, так не выйдет |
| dlg_41_0_v2_f_g.flac | dlg | Aoede | storyteller | Давняя это история. Слушайте |
| dlg_41_0_v2_g.flac | dlg | Schedar | storyteller | Давняя это история. Слушайте |
| dlg_41_10_v2_f_g.flac | dlg | Aoede | storyteller | Коротко расскажу, и хватит |
| dlg_41_10_v2_g.flac | dlg | Schedar | storyteller | Коротко расскажу, и хватит |
| dlg_41_11_v2_f_g.flac | dlg | Aoede | storyteller | Расскажу. Может, поумнеете |
| dlg_41_11_v2_g.flac | dlg | Schedar | storyteller | Расскажу. Может, поумнеете |
| dlg_41_1_v2_f_g.flac | dlg | Aoede | storyteller | Было это давно, слушайте |
| dlg_41_1_v2_g.flac | dlg | Schedar | storyteller | Было это давно, слушайте |
| dlg_41_2_v2_f_g.flac | dlg | Aoede | storyteller | Старики так рассказывают |
| dlg_41_2_v2_g.flac | dlg | Schedar | storyteller | Старики так рассказывают |
| dlg_41_3_v2_f_g.flac | dlg | Aoede | storyteller | Про это у нас каждый ребёнок знает |
| dlg_41_3_v2_g.flac | dlg | Schedar | storyteller | Про это у нас каждый ребёнок знает |
| dlg_41_4_v2_f_g.flac | dlg | Aoede | storyteller | Слушайте, и да будут боги свидетелями |
| dlg_41_4_v2_g.flac | dlg | Schedar | storyteller | Слушайте, и да будут боги свидетелями |
| dlg_41_5_v2_f_g.flac | dlg | Aoede | storyteller | Вам, приезжим, полезно знать |
| dlg_41_5_v2_g.flac | dlg | Schedar | storyteller | Вам, приезжим, полезно знать |
| dlg_41_6_v2_f_g.flac | dlg | Aoede | storyteller | По летописям было так |
| dlg_41_6_v2_g.flac | dlg | Schedar | storyteller | По летописям было так |
| dlg_41_7_v2_f_g.flac | dlg | Aoede | storyteller | Только это между нами, ладно? |
| dlg_41_7_v2_g.flac | dlg | Schedar | storyteller | Только это между нами, ладно? |
| dlg_41_8_v2_f_g.flac | dlg | Aoede | storyteller | Тебе расскажу, как деды рассказывали |
| dlg_41_8_v2_g.flac | dlg | Schedar | storyteller | Тебе расскажу, как деды рассказывали |
| dlg_41_9_v2_f_g.flac | dlg | Aoede | storyteller | Вам — с удовольствием расскажу |
| dlg_41_9_v2_g.flac | dlg | Schedar | storyteller | Вам — с удовольствием расскажу |
| dlg_42_0_v2_f_g.flac | dlg | Aoede | dismissive | Историю пусть книжники рассказывают |
| dlg_42_0_v2_g.flac | dlg | Schedar | dismissive | Историю пусть книжники рассказывают |
| dlg_42_1_v2_f_g.flac | dlg | Aoede | dismissive | Не до сказок мне сейчас |
| dlg_42_1_v2_g.flac | dlg | Schedar | dismissive | Не до сказок мне сейчас |
| dlg_42_2_v2_f_g.flac | dlg | Aoede | dismissive | Не знаю я старины |
| dlg_42_2_v2_g.flac | dlg | Schedar | dismissive | Не знаю я старины |
| dlg_42_3_v2_f_g.flac | dlg | Aoede | dismissive | Не для чужих ушей наша история |
| dlg_42_3_v2_g.flac | dlg | Schedar | dismissive | Не для чужих ушей наша история |
| dlg_42_4_v2_f_g.flac | dlg | Aoede | dismissive | С вами прошлым делиться? Нет |
| dlg_42_4_v2_g.flac | dlg | Schedar | dismissive | С вами прошлым делиться? Нет |
| dlg_42_5_v2_f_g.flac | dlg | Aoede | dismissive | Прости, друг, не мастак я рассказывать |
| dlg_42_5_v2_g.flac | dlg | Schedar | dismissive | Прости, друг, не мастак я рассказывать |
| dlg_4_0_v2_f_g.flac | dlg | Aoede | reluctant | Ладно. Но это в последний раз |
| dlg_4_0_v2_g.flac | dlg | Schedar | reluctant | Ладно. Но это в последний раз |
| dlg_4_10_v2_f_g.flac | dlg | Aoede | reluctant | Вам не откажу: вы меня выручали |
| dlg_4_10_v2_g.flac | dlg | Schedar | reluctant | Вам не откажу: вы меня выручали |
| dlg_4_11_v2_f_g.flac | dlg | Aoede | reluctant | Держите. И больше не просите |
| dlg_4_11_v2_g.flac | dlg | Schedar | reluctant | Держите. И больше не просите |
| dlg_4_12_v2_f_g.flac | dlg | Aoede | reluctant | Бери и уходи |
| dlg_4_12_v2_g.flac | dlg | Schedar | reluctant | Бери и уходи |
| dlg_4_13_v2_f_g.flac | dlg | Aoede | reluctant | Помогу. Но помнить буду всё |
| dlg_4_13_v2_g.flac | dlg | Schedar | reluctant | Помогу. Но помнить буду всё |
| dlg_4_1_v2_f_g.flac | dlg | Aoede | reluctant | Помогу. Но вы теперь мне должны |
| dlg_4_1_v2_g.flac | dlg | Schedar | reluctant | Помогу. Но вы теперь мне должны |
| dlg_4_2_v2_f_g.flac | dlg | Aoede | reluctant | Так и быть, только никому ни слова |
| dlg_4_2_v2_g.flac | dlg | Schedar | reluctant | Так и быть, только никому ни слова |
| dlg_4_3_v2_f_g.flac | dlg | Aoede | reluctant | Хорошо. Но больше с таким не приходите |
| dlg_4_3_v2_g.flac | dlg | Schedar | reluctant | Хорошо. Но больше с таким не приходите |
| dlg_4_4_v2_f_g.flac | dlg | Aoede | reluctant | Конечно помогу. Как не помочь |
| dlg_4_4_v2_g.flac | dlg | Schedar | reluctant | Конечно помогу. Как не помочь |
| dlg_4_5_v2_f_g.flac | dlg | Aoede | reluctant | Для хорошего человека не жалко |
| dlg_4_5_v2_g.flac | dlg | Schedar | reluctant | Для хорошего человека не жалко |
| dlg_4_6_v2_f_g.flac | dlg | Aoede | reluctant | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_6_v2_g.flac | dlg | Schedar | reluctant | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_7_v2_f_g.flac | dlg | Aoede | reluctant | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_7_v2_g.flac | dlg | Schedar | reluctant | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_8_v2_f_g.flac | dlg | Aoede | reluctant | Ох… ладно, только чтобы без неприятностей |
| dlg_4_8_v2_g.flac | dlg | Schedar | reluctant | Ох… ладно, только чтобы без неприятностей |
| dlg_4_9_v2_f_g.flac | dlg | Aoede | reluctant | Для тебя — хоть сто раз |
| dlg_4_9_v2_g.flac | dlg | Schedar | reluctant | Для тебя — хоть сто раз |
| dlg_5_0_v2_f_g.flac | dlg | Aoede | helpless | Мне бы кто помог |
| dlg_5_0_v2_g.flac | dlg | Schedar | helpless | Мне бы кто помог |
| dlg_5_10_v2_f_g.flac | dlg | Aoede | helpless | Вам? Даже не просите |
| dlg_5_10_v2_g.flac | dlg | Schedar | helpless | Вам? Даже не просите |
| dlg_5_11_v2_f_g.flac | dlg | Aoede | helpless | Не могу и не хочу |
| dlg_5_11_v2_g.flac | dlg | Schedar | helpless | Не могу и не хочу |
| dlg_5_12_v2_f_g.flac | dlg | Aoede | helpless | После того, как вы со мной обошлись? Нет |
| dlg_5_12_v2_g.flac | dlg | Schedar | helpless | После того, как вы со мной обошлись? Нет |
| dlg_5_1_v2_f_g.flac | dlg | Aoede | helpless | Самой бы кто подсобил |
| dlg_5_1_v2_g.flac | dlg | Schedar | helpless | Самому бы кто подсобил |
| dlg_5_2_v2_f_g.flac | dlg | Aoede | helpless | Не могу. Своих забот по горло |
| dlg_5_2_v2_g.flac | dlg | Schedar | helpless | Не могу. Своих забот по горло |
| dlg_5_3_v2_f_g.flac | dlg | Aoede | helpless | Не просите, не выйдет |
| dlg_5_3_v2_g.flac | dlg | Schedar | helpless | Не просите, не выйдет |
| dlg_5_4_v2_f_g.flac | dlg | Aoede | helpless | Задаром? Нет уж |
| dlg_5_4_v2_g.flac | dlg | Schedar | helpless | Задаром? Нет уж |
| dlg_5_5_v2_f_g.flac | dlg | Aoede | helpless | С чего бы мне вам помогать? |
| dlg_5_5_v2_g.flac | dlg | Schedar | helpless | С чего бы мне вам помогать? |
| dlg_5_6_v2_f_g.flac | dlg | Aoede | helpless | Я не бегаю по поручениям чужаков |
| dlg_5_6_v2_g.flac | dlg | Schedar | helpless | Я не бегаю по поручениям чужаков |
| dlg_5_7_v2_f_g.flac | dlg | Aoede | helpless | Рада бы, правда, но сейчас никак |
| dlg_5_7_v2_g.flac | dlg | Schedar | helpless | Рад бы, правда, но сейчас никак |
| dlg_5_8_v2_f_g.flac | dlg | Aoede | helpless | Помог бы, но боюсь ввязаться в беду |
| dlg_5_8_v2_g.flac | dlg | Schedar | helpless | Помог бы, но боюсь ввязаться в беду |
| dlg_5_9_v2_f_g.flac | dlg | Aoede | helpless | Прости, друг, сейчас нечем помочь |
| dlg_5_9_v2_g.flac | dlg | Schedar | helpless | Прости, друг, сейчас нечем помочь |
| dlg_6_0_v2_f_g.flac | dlg | Aoede | serious | Запомню. Слово дороже золота |
| dlg_6_0_v2_g.flac | dlg | Schedar | serious | Запомню. Слово дороже золота |
| dlg_6_10_v2_f_g.flac | dlg | Aoede | serious | Посмотрим, чего оно стоит |
| dlg_6_10_v2_g.flac | dlg | Schedar | serious | Посмотрим, чего оно стоит |
| dlg_6_11_v2_f_g.flac | dlg | Aoede | serious | Сдержите — может, и помиримся |
| dlg_6_11_v2_g.flac | dlg | Schedar | serious | Сдержите — может, и помиримся |
| dlg_6_1_v2_f_g.flac | dlg | Aoede | serious | Ловлю на слове. Не подведите |
| dlg_6_1_v2_g.flac | dlg | Schedar | serious | Ловлю на слове. Не подведите |
| dlg_6_2_v2_f_g.flac | dlg | Aoede | serious | Хорошо. Буду ждать, что сдержите |
| dlg_6_2_v2_g.flac | dlg | Schedar | serious | Хорошо. Буду ждать, что сдержите |
| dlg_6_3_v2_f_g.flac | dlg | Aoede | serious | Договорились. Время покажет |
| dlg_6_3_v2_g.flac | dlg | Schedar | serious | Договорились. Время покажет |
| dlg_6_4_v2_f_g.flac | dlg | Aoede | serious | Слово — это всё, что у нас есть. Верю |
| dlg_6_4_v2_g.flac | dlg | Schedar | serious | Слово — это всё, что у нас есть. Верю |
| dlg_6_5_v2_f_g.flac | dlg | Aoede | serious | Запомню. Я всё запоминаю |
| dlg_6_5_v2_g.flac | dlg | Schedar | serious | Запомню. Я всё запоминаю |
| dlg_6_6_v2_f_g.flac | dlg | Aoede | serious | Принято. Проверю, когда придёт срок |
| dlg_6_6_v2_g.flac | dlg | Schedar | serious | Принято. Проверю, когда придёт срок |
| dlg_6_7_v2_f_g.flac | dlg | Aoede | serious | Верю вам. Не знаю почему, но верю |
| dlg_6_7_v2_g.flac | dlg | Schedar | serious | Верю вам. Не знаю почему, но верю |
| dlg_6_8_v2_f_g.flac | dlg | Aoede | serious | Верю тебе, как себе |
| dlg_6_8_v2_g.flac | dlg | Schedar | serious | Верю тебе, как себе |
| dlg_6_9_v2_f_g.flac | dlg | Aoede | serious | Вы уже держали слово. Верю |
| dlg_6_9_v2_g.flac | dlg | Schedar | serious | Вы уже держали слово. Верю |
| dlg_7_0_v2_f_g.flac | dlg | Aoede | skeptical | Обещать вы горазды. Посмотрим |
| dlg_7_0_v2_g.flac | dlg | Schedar | skeptical | Обещать вы горазды. Посмотрим |
| dlg_7_1_v2_f_g.flac | dlg | Aoede | skeptical | Слова ничего не стоят |
| dlg_7_1_v2_g.flac | dlg | Schedar | skeptical | Слова ничего не стоят |
| dlg_7_2_v2_f_g.flac | dlg | Aoede | skeptical | Много вас тут обещало |
| dlg_7_2_v2_g.flac | dlg | Schedar | skeptical | Много вас тут обещало |
| dlg_7_3_v2_f_g.flac | dlg | Aoede | skeptical | Посмотрим, что от этого останется завтра |
| dlg_7_3_v2_g.flac | dlg | Schedar | skeptical | Посмотрим, что от этого останется завтра |
| dlg_7_4_v2_f_g.flac | dlg | Aoede | skeptical | Кто обещает легко, тот легко и забывает |
| dlg_7_4_v2_g.flac | dlg | Schedar | skeptical | Кто обещает легко, тот легко и забывает |
| dlg_7_5_v2_f_g.flac | dlg | Aoede | skeptical | Обещаниями сыт не будешь |
| dlg_7_5_v2_g.flac | dlg | Schedar | skeptical | Обещаниями сыт не будешь |
| dlg_7_6_v2_f_g.flac | dlg | Aoede | skeptical | Ваши обещания мне ни к чему |
| dlg_7_6_v2_g.flac | dlg | Schedar | skeptical | Ваши обещания мне ни к чему |
| dlg_7_7_v2_f_g.flac | dlg | Aoede | skeptical | Прошлое слово вы уже нарушили |
| dlg_7_7_v2_g.flac | dlg | Schedar | skeptical | Прошлое слово вы уже нарушили |
| dlg_7_8_v2_f_g.flac | dlg | Aoede | skeptical | Ваши обещания — ветер |
| dlg_7_8_v2_g.flac | dlg | Schedar | skeptical | Ваши обещания — ветер |
| dlg_7_9_v2_f_g.flac | dlg | Aoede | skeptical | Ты уж не подведи |
| dlg_7_9_v2_g.flac | dlg | Schedar | skeptical | Ты уж не подведи |
| dlg_8_0_v2_f_g.flac | dlg | Aoede | surprised | Не думала об этом так |
| dlg_8_0_v2_g.flac | dlg | Schedar | surprised | Не думал об этом так |
| dlg_8_10_v2_f_g.flac | dlg | Aoede | surprised | Допустим. Убедили |
| dlg_8_10_v2_g.flac | dlg | Schedar | surprised | Допустим. Убедили |
| dlg_8_1_v2_f_g.flac | dlg | Aoede | surprised | А ведь вы правы |
| dlg_8_1_v2_g.flac | dlg | Schedar | surprised | А ведь вы правы |
| dlg_8_2_v2_f_g.flac | dlg | Aoede | surprised | Сдаюсь — тут вы меня переспорили |
| dlg_8_2_v2_g.flac | dlg | Schedar | surprised | Сдаюсь — тут вы меня переспорили |
| dlg_8_3_v2_f_g.flac | dlg | Aoede | surprised | Что ж, умеете вы спорить |
| dlg_8_3_v2_g.flac | dlg | Schedar | surprised | Что ж, умеете вы спорить |
| dlg_8_4_v2_f_g.flac | dlg | Aoede | surprised | …Мне надо это обдумать. Одному |
| dlg_8_4_v2_g.flac | dlg | Schedar | surprised | …Мне надо это обдумать. Одному |
| dlg_8_5_v2_f_g.flac | dlg | Aoede | surprised | Неприятно признавать, но вы правы |
| dlg_8_5_v2_g.flac | dlg | Schedar | surprised | Неприятно признавать, но вы правы |
| dlg_8_6_v2_f_g.flac | dlg | Aoede | surprised | Логика на вашей стороне. Признаю |
| dlg_8_6_v2_g.flac | dlg | Schedar | surprised | Логика на вашей стороне. Признаю |
| dlg_8_7_v2_f_g.flac | dlg | Aoede | surprised | Вот! Я всегда чувствовала, что всё не так, как нам говорят |
| dlg_8_7_v2_g.flac | dlg | Schedar | surprised | Вот! Я всегда чувствовал, что всё не так, как нам говорят |
| dlg_8_8_v2_f_g.flac | dlg | Aoede | surprised | Правы. Но это ничего не меняет |
| dlg_8_8_v2_g.flac | dlg | Schedar | surprised | Правы. Но это ничего не меняет |
| dlg_8_9_v2_f_g.flac | dlg | Aoede | surprised | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_9_v2_g.flac | dlg | Schedar | surprised | Вот за что тебя ценю: голова у тебя светлая |
| dlg_9_0_v2_f_g.flac | dlg | Aoede | grudging | Ваша взяла. Уступлю |
| dlg_9_0_v2_g.flac | dlg | Schedar | grudging | Ваша взяла. Уступлю |
| dlg_9_10_v2_f_g.flac | dlg | Aoede | grudging | Уступлю, но только сейчас |
| dlg_9_10_v2_g.flac | dlg | Schedar | grudging | Уступлю, но только сейчас |
| dlg_9_11_v2_f_g.flac | dlg | Aoede | grudging | Забирайте и не возвращайтесь |
| dlg_9_11_v2_g.flac | dlg | Schedar | grudging | Забирайте и не возвращайтесь |
| dlg_9_1_v2_f_g.flac | dlg | Aoede | grudging | Ладно, по рукам, — но себе в убыток |
| dlg_9_1_v2_g.flac | dlg | Schedar | grudging | Ладно, по рукам, — но себе в убыток |
| dlg_9_2_v2_f_g.flac | dlg | Aoede | grudging | Грабёж, но пусть будет так |
| dlg_9_2_v2_g.flac | dlg | Schedar | grudging | Грабёж, но пусть будет так |
| dlg_9_3_v2_f_g.flac | dlg | Aoede | grudging | Уговорили. Только другим не рассказывайте |
| dlg_9_3_v2_g.flac | dlg | Schedar | grudging | Уговорили. Только другим не рассказывайте |
| dlg_9_4_v2_f_g.flac | dlg | Aoede | grudging | Режете меня без ножа… ладно, берите |
| dlg_9_4_v2_g.flac | dlg | Schedar | grudging | Режете меня без ножа… ладно, берите |
| dlg_9_5_v2_f_g.flac | dlg | Aoede | grudging | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_5_v2_g.flac | dlg | Schedar | grudging | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_6_v2_f_g.flac | dlg | Aoede | grudging | Для вас — скину. Носите на здоровье |
| dlg_9_6_v2_g.flac | dlg | Schedar | grudging | Для вас — скину. Носите на здоровье |
| dlg_9_7_v2_f_g.flac | dlg | Aoede | grudging | По такой цене я ещё в прибытке. Согласна |
| dlg_9_7_v2_g.flac | dlg | Schedar | grudging | По такой цене я ещё в прибытке. Согласен |
| dlg_9_8_v2_f_g.flac | dlg | Aoede | grudging | Своему — со скидкой |
| dlg_9_8_v2_g.flac | dlg | Schedar | grudging | Своему — со скидкой |
| dlg_9_9_v2_f_g.flac | dlg | Aoede | grudging | За прошлое — уступлю |
| dlg_9_9_v2_g.flac | dlg | Schedar | grudging | За прошлое — уступлю |
| enter_castle_0_v2_g.flac | enter_castle | Algenib | stern | Стой. Кто таков? Ладно, проходи, только без глупостей. |
| enter_castle_1_v2_g.flac | enter_castle | Algenib | formal | Добро пожаловать в замок. Оружие держи в ножнах. |
| enter_castle_2_v2_g.flac | enter_castle | Algenib | dutiful | Проходи. Лорд нынче не принимает, но двор открыт. |
| enter_castle_3_v2_g.flac | enter_castle | Algenib | gruff | Ворота открыты до заката. Не задерживайся у казарм. |
| enter_castle_4_v2_g.flac | enter_castle | Algenib | watchful | Гость? Проходи. За порядком тут смотрят строго. |
| enter_castle_5_v2_g.flac | enter_castle | Algenib | loud call to other guards | Путник в замок! Пропустить! |
| enter_castle_6_v2_g.flac | enter_castle | Algenib | serious | Держись дороги к двору. На стены чужим нельзя. |
| enter_castle_7_v2_g.flac | enter_castle | Algenib | proud | Замок стоит, пока мы стоим. Входи с миром. |
| enter_clanhall_0_v2_g.flac | enter_clanhall | Algenib | solemn | Дом клана. Здесь чтут старших и помнят кровь. |
| enter_clanhall_1_v2_g.flac | enter_clanhall | Algenib | hospitable | Входи. За столом клана гостю место найдётся. |
| enter_clanhall_2_v2_g.flac | enter_clanhall | Algenib | stern | Сними шапку, чужак. Это чертог предков. |
| enter_clanhall_3_v2_g.flac | enter_clanhall | Algenib | hushed | Старейшины совещаются. Не шуми. |
| enter_clanhall_4_v2_g.flac | enter_clanhall | Algenib | measured | Клан гостя не обидит, если гость не обидит клан. |
| enter_clanhall_5_v2_g.flac | enter_clanhall | Algenib | jovial | Ещё один на пир? Проходи, мёда хватит. |
| enter_fort_0_v2_g.flac | enter_fort | Algenib | tense | Крепость на военном положении. Проходи и не мешайся. |
| enter_fort_1_v2_g.flac | enter_fort | Algenib | wary | Стой! Свой? Ну проходи, гарнизон рад живой душе. |
| enter_fort_2_v2_g.flac | enter_fort | Algenib | hard | В крепости порядок один — наш. Уяснил? |
| enter_fort_3_v2_g.flac | enter_fort | Algenib | dry | Проходи. У арсенала не стой, стрелки нервные. |
| enter_fort_4_v2_g.flac | enter_fort | Algenib | suspicious | Ещё один странник. Лишь бы не лазутчик. |
| enter_fort_5_v2_g.flac | enter_fort | Algenib | reassuring | Добро пожаловать за стены. Здесь безопаснее, чем в поле. |
| enter_fort_6_v2_g.flac | enter_fort | Algenib | hurried | Проходи быстрее, ворота закрываем. |
| enter_fort_7_v2_g.flac | enter_fort | Algenib | weary | Крепость видела осады и похуже. Входи. |
| enter_gate_cold_0_v2_g.flac | enter_gate_cold | Algenib | cold | Тебя тут не ждали. Проходи, но я смотрю за тобой. |
| enter_gate_cold_1_v2_g.flac | enter_gate_cold | Algenib | cold | Одно лишнее движение — и в темницу. |
| enter_gate_cold_2_v2_g.flac | enter_gate_cold | Algenib | hostile | Наслышаны о тебе. Недоброе слышали. |
| enter_gate_cold_3_v2_g.flac | enter_gate_cold | Algenib | cold | Проходи молча. И не задерживайся. |
| enter_gate_cold_4_v2_g.flac | enter_gate_cold | Algenib | hard | Держи руки на виду, чужак. |
| enter_gate_cold_5_v2_g.flac | enter_gate_cold | Algenib | resentful | Будь моя воля — не пустил бы. |
| enter_gate_friend_0_v2_g.flac | enter_gate_friend | Algenib | warm | А, это ты! Проходи, для тебя ворота всегда открыты. |
| enter_gate_friend_1_v2_g.flac | enter_gate_friend | Algenib | friendly | Своих пропускаем без вопросов. С возвращением! |
| enter_gate_friend_2_v2_g.flac | enter_gate_friend | Algenib | sincere | Рад видеть! Про тебя тут только доброе говорят. |
| enter_gate_friend_3_v2_g.flac | enter_gate_friend | Algenib | cheerful call | Эй, ребята, это наш друг! Пропустите. |
| enter_gate_friend_4_v2_g.flac | enter_gate_friend | Algenib | warm | Проходи, проходи. Если что — зови стражу, поможем. |
| enter_gate_friend_5_v2_g.flac | enter_gate_friend | Algenib | respectful | О, наш герой вернулся. Добро пожаловать домой. |
| enter_gate_night_0_v2_g.flac | enter_gate_night | Algenib | sharp | Кто идёт в такой час? Назовись! |
| enter_gate_night_1_v2_g.flac | enter_gate_night | Algenib | grumbling | Ночью ворота на засове. Ладно, проходи, раз пришёл. |
| enter_gate_night_2_v2_g.flac | enter_gate_night | Algenib | hushed | Тише. Город спит. Не шуми на улицах. |
| enter_gate_night_3_v2_g.flac | enter_gate_night | Algenib | wry | Ночь тёмная, а ты один. Храбрый или глупый? |
| enter_gate_night_4_v2_g.flac | enter_gate_night | Algenib | low voice | Факел держи ближе. Ночью всякое бродит. |
| enter_gate_night_5_v2_g.flac | enter_gate_night | Algenib | tired | Поздно гуляешь, путник. Трактир ещё открыт. |
| enter_warcamp_0_v2_g.flac | enter_warcamp | Algenib | busy | Лагерь войска. Кто пустил? А, ладно, проходи. |
| enter_warcamp_1_v2_g.flac | enter_warcamp | Algenib | brusque | Не путайся под ногами, у нас сборы. |
| enter_warcamp_2_v2_g.flac | enter_warcamp | Algenib | matter-of-fact | К интенданту — налево. К лекарю — за шатрами. |
| enter_warcamp_3_v2_g.flac | enter_warcamp | Algenib | interested | Наёмник? Командиру такие нужны. |
| enter_warcamp_4_v2_g.flac | enter_warcamp | Algenib | lowered voice | Тише у шатра воеводы. Он не спал две ночи. |
| enter_warcamp_5_v2_g.flac | enter_warcamp | Algenib | determined | Скоро выступаем. Хочешь с нами — готовь меч. |
| foe_bandit_attack_0_v2_g.flac | foe_bandit_attack | Achernar | aggressive shout | Получай! |
| foe_bandit_attack_1_v2_g.flac | foe_bandit_attack | Achernar | grunting | На, держи! |
| foe_bandit_attack_2_v2_g.flac | foe_bandit_attack | Achernar | angry | Стой смирно, хуже будет! |
| foe_bandit_attack_3_v2_g.flac | foe_bandit_attack | Achernar | vicious | Это тебе за дорогу! |
| foe_bandit_attack_4_v2_g.flac | foe_bandit_attack | Achernar | furious | Не вертись, зарежу! |
| foe_bandit_attack_5_v2_g.flac | foe_bandit_attack | Achernar | savage | Вот так! И ещё! |
| foe_bandit_attack_6_v2_g.flac | foe_bandit_attack | Achernar | chasing | Куда пятишься? Стоять! |
| foe_bandit_attack_7_v2_g.flac | foe_bandit_attack | Achernar | frenzied shout | Бей его, бей! |
| foe_bandit_death_0_v2_g.flac | foe_bandit_death | Achernar | dying | Будь ты проклят… |
| foe_bandit_death_1_v2_g.flac | foe_bandit_death | Achernar | dying whisper | Надо было… в деревне сидеть… |
| foe_bandit_death_2_v2_g.flac | foe_bandit_death | Achernar | dying | Мать… прости… |
| foe_bandit_hurt_0_v2_g.flac | foe_bandit_hurt | Achernar | pain | Ах ты гад! Кровь пустил! |
| foe_bandit_hurt_1_v2_g.flac | foe_bandit_hurt | Achernar | hissing in pain | Больно, зараза! |
| foe_bandit_hurt_2_v2_g.flac | foe_bandit_hurt | Achernar | surprised | Он кусается, ребята! |
| foe_bandit_hurt_3_v2_g.flac | foe_bandit_hurt | Achernar | through gritted teeth | Ничего, заживёт. А тебя — нет! |
| foe_bandit_hurt_4_v2_g.flac | foe_bandit_hurt | Achernar | panting | Проклятье, крепкий попался! |
| foe_bandit_low_0_v2_g.flac | foe_bandit_low | Achernar | panicked | Стой! Хватит! Забирай всё! |
| foe_bandit_low_1_v2_g.flac | foe_bandit_low | Achernar | terrified | Пощади, у меня дети! |
| foe_bandit_low_2_v2_g.flac | foe_bandit_low | Achernar | frightened | Всё, всё, ухожу! Не бей! |
| foe_bandit_low_3_v2_g.flac | foe_bandit_low | Achernar | panicked shout | Братцы, бежим, он нас всех положит! |
| foe_bandit_low_4_v2_g.flac | foe_bandit_low | Achernar | desperate | Не убивай, я всё скажу! |
| foe_bandit_start_0_v2_g.flac | foe_bandit_start | Achernar | menacing | Кошелёк или жизнь! Выбирай быстро. |
| foe_bandit_start_1_v2_g.flac | foe_bandit_start | Achernar | mocking | Ну всё, путник, приехали. |
| foe_bandit_start_2_v2_g.flac | foe_bandit_start | Achernar | shouting to accomplices | Окружай его! Не дай уйти! |
| foe_bandit_start_3_v2_g.flac | foe_bandit_start | Achernar | low | Зря ты свернул на эту дорогу. |
| foe_bandit_start_4_v2_g.flac | foe_bandit_start | Achernar | greedy | Снимай всё, что блестит. И без глупостей. |
| foe_bandit_start_5_v2_g.flac | foe_bandit_start | Achernar | gleeful | Гляди-ка, сам пришёл. Бери его! |
| foe_bandit_start_6_v2_g.flac | foe_bandit_start | Achernar | cruel | Дорога платная. Плати кровью. |
| foe_bandit_start_7_v2_g.flac | foe_bandit_start | Achernar | whisper then shout | Тихо, тихо… А теперь — ножом! |
| foe_bandit_taunt_0_v2_g.flac | foe_bandit_taunt | Achernar | cruel | Шатаешься? Сейчас упадёшь. |
| foe_bandit_taunt_1_v2_g.flac | foe_bandit_taunt | Achernar | greedy | Ещё удар — и всё твоё станет моим. |
| foe_bandit_taunt_2_v2_g.flac | foe_bandit_taunt | Achernar | mocking laugh | Кровью харкаешь, герой? |
| greet_bedn_0_v2_f_g.flac | greet_бедный | Aoede | dry | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_0_v2_g.flac | greet_бедный | Schedar | dry | Карманы пустые? Посмотреть-то можно. |
| greet_bedn_1_v2_f_g.flac | greet_бедный | Aoede | dry | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_1_v2_g.flac | greet_бедный | Schedar | dry | В долг не даю. Но поглядеть не запрещаю. |
| greet_bedn_2_v2_f_g.flac | greet_бедный | Aoede | sympathetic | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_2_v2_g.flac | greet_бедный | Schedar | sympathetic | Небогато нынче? Бывает. Продать есть что? |
| greet_bedn_3_v2_f_g.flac | greet_бедный | Aoede | businesslike | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_3_v2_g.flac | greet_бедный | Schedar | businesslike | Без золота разговор короткий. Что есть на обмен? |
| greet_bedn_4_v2_f_g.flac | greet_бедный | Aoede | wry | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_4_v2_g.flac | greet_бедный | Schedar | wry | Пустой кошель — не порок. Но и не покупка. |
| greet_bedn_5_v2_f_g.flac | greet_бедный | Aoede | kindly | Заработаешь — приходи. Я никуда не денусь. |
| greet_bedn_5_v2_g.flac | greet_бедный | Schedar | kindly | Заработаешь — приходи. Я никуда не денусь. |
| greet_bogat_0_v2_f_g.flac | greet_богатый | Aoede | greedy | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_0_v2_g.flac | greet_богатый | Schedar | greedy | О, кошель-то тяжёлый. Проходи, проходи! |
| greet_bogat_1_v2_f_g.flac | greet_богатый | Aoede | sly | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_1_v2_g.flac | greet_богатый | Schedar | sly | Звон слышу издалека. Для тебя — лучшее. |
| greet_bogat_2_v2_f_g.flac | greet_богатый | Aoede | obsequious | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_2_v2_g.flac | greet_богатый | Schedar | obsequious | Богатому гостю — лучший угол и лучший товар. |
| greet_bogat_3_v2_f_g.flac | greet_богатый | Aoede | persuasive | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_3_v2_g.flac | greet_богатый | Schedar | persuasive | С таким кошелём грех уйти с пустыми руками. |
| greet_bogat_4_v2_f_g.flac | greet_богатый | Aoede | sly | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_4_v2_g.flac | greet_богатый | Schedar | sly | Вижу, дела идут в гору. Может, и мне перепадёт? |
| greet_bogat_5_v2_f_g.flac | greet_богатый | Aoede | confidential | Для важного гостя найдётся кое-что особенное. |
| greet_bogat_5_v2_g.flac | greet_богатый | Schedar | confidential | Для важного гостя найдётся кое-что особенное. |
| greet_davno_0_v2_f_g.flac | greet_давно | Aoede | surprised | Давненько тебя видно не было! Где носило? |
| greet_davno_0_v2_g.flac | greet_давно | Schedar | surprised | Давненько тебя видно не было! Где носило? |
| greet_davno_1_v2_f_g.flac | greet_давно | Aoede | joyful | Сколько лет, сколько зим! Проходи. |
| greet_davno_1_v2_g.flac | greet_давно | Schedar | joyful | Сколько лет, сколько зим! Проходи. |
| greet_davno_2_v2_f_g.flac | greet_давно | Aoede | relieved | А я уж боялась, что тракт тебя забрал. |
| greet_davno_2_v2_g.flac | greet_давно | Schedar | relieved | А я уж боялся, что тракт тебя забрал. |
| greet_davno_3_v2_f_g.flac | greet_давно | Aoede | mock reproach | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_3_v2_g.flac | greet_давно | Schedar | mock reproach | Давно не заходишь. Забываешь старых знакомых. |
| greet_davno_4_v2_f_g.flac | greet_давно | Aoede | surprised | Живой! А мы уж и гадать перестали. |
| greet_davno_4_v2_g.flac | greet_давно | Schedar | surprised | Живой! А мы уж и гадать перестали. |
| greet_davno_5_v2_f_g.flac | greet_давно | Aoede | curious | Тебя не узнать. Долгой была дорога? |
| greet_davno_5_v2_g.flac | greet_давно | Schedar | curious | Тебя не узнать. Долгой была дорога? |
| greet_dobro_0_v2_f_g.flac | greet_добро | Aoede | grateful | А, это вы! Спасибо за прошлое. |
| greet_dobro_0_v2_g.flac | greet_добро | Schedar | grateful | А, это вы! Спасибо за прошлое. |
| greet_dobro_1_v2_f_g.flac | greet_добро | Aoede | grateful | Помню добро. Заходите. |
| greet_dobro_1_v2_g.flac | greet_добро | Schedar | grateful | Помню добро. Заходите. |
| greet_dobro_2_v2_f_g.flac | greet_добро | Aoede | grateful | Вам здесь всегда рады. |
| greet_dobro_2_v2_g.flac | greet_добро | Schedar | grateful | Вам здесь всегда рады. |
| greet_dobro_3_v2_f_g.flac | greet_добро | Aoede | grateful | О, вот кто нас выручил! |
| greet_dobro_3_v2_g.flac | greet_добро | Schedar | grateful | О, вот кто нас выручил! |
| greet_dobro_4_v2_f_g.flac | greet_добро | Aoede | grateful | Для вас — всё самое лучшее. |
| greet_dobro_4_v2_g.flac | greet_добро | Schedar | grateful | Для вас — всё самое лучшее. |
| greet_dobro_5_v2_f_g.flac | greet_добро | Aoede | grateful | Не забуду, что вы для нас сделали. |
| greet_dobro_5_v2_g.flac | greet_добро | Schedar | grateful | Не забуду, что вы для нас сделали. |
| greet_dozhd_0_v2_f_g.flac | greet_дождь | Aoede | hospitable | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_0_v2_g.flac | greet_дождь | Schedar | hospitable | Мокро снаружи? Вставай ближе к огню. |
| greet_dozhd_1_v2_f_g.flac | greet_дождь | Aoede | dry | В такой дождь только по делу и ходят. |
| greet_dozhd_1_v2_g.flac | greet_дождь | Schedar | dry | В такой дождь только по делу и ходят. |
| greet_dozhd_2_v2_f_g.flac | greet_дождь | Aoede | fussy | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_2_v2_g.flac | greet_дождь | Schedar | fussy | Отряхнись у порога, с тебя течёт. |
| greet_dozhd_3_v2_f_g.flac | greet_дождь | Aoede | weary | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_3_v2_g.flac | greet_дождь | Schedar | weary | Льёт и льёт. Хоть торговля под крышей. |
| greet_dozhd_4_v2_f_g.flac | greet_дождь | Aoede | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_4_v2_g.flac | greet_дождь | Schedar | cheerful | Дождь делу не помеха — заходи. |
| greet_dozhd_5_v2_f_g.flac | greet_дождь | Aoede | grumbling | Вот погодка! Сапоги у порога оставь. |
| greet_dozhd_5_v2_g.flac | greet_дождь | Schedar | grumbling | Вот погодка! Сапоги у порога оставь. |
| greet_durn_0_v2_f_g.flac | greet_дурная | Aoede | wary | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_0_v2_g.flac | greet_дурная | Schedar | wary | Слыхали мы о вас. Всякое слыхали. |
| greet_durn_1_v2_f_g.flac | greet_дурная | Aoede | suspicious | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_1_v2_g.flac | greet_дурная | Schedar | suspicious | Говорят о вас недоброе. Посмотрим, правда ли. |
| greet_durn_2_v2_f_g.flac | greet_дурная | Aoede | nervous | Держите руки на виду. На всякий случай. |
| greet_durn_2_v2_g.flac | greet_дурная | Schedar | nervous | Держите руки на виду. На всякий случай. |
| greet_durn_3_v2_f_g.flac | greet_дурная | Aoede | disapproving | С вашей славой в честный дом не ходят. |
| greet_durn_3_v2_g.flac | greet_дурная | Schedar | disapproving | С вашей славой в честный дом не ходят. |
| greet_durn_4_v2_f_g.flac | greet_дурная | Aoede | defiant | Вас тут боятся. Я — пока нет. |
| greet_durn_4_v2_g.flac | greet_дурная | Schedar | defiant | Вас тут боятся. Я — пока нет. |
| greet_glub_0_v2_f_g.flac | greet_глубь | Aoede | low voice | Тише. Здесь торгуют без свидетелей. |
| greet_glub_0_v2_g.flac | greet_глубь | Schedar | low voice | Тише. Здесь торгуют без свидетелей. |
| greet_glub_1_v2_f_g.flac | greet_глубь | Aoede | low voice | Живой? Уже хорошо. Что берёшь? |
| greet_glub_1_v2_g.flac | greet_глубь | Schedar | low voice | Живой? Уже хорошо. Что берёшь? |
| greet_glub_2_v2_f_g.flac | greet_глубь | Aoede | low voice | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_2_v2_g.flac | greet_глубь | Schedar | low voice | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_3_v2_f_g.flac | greet_глубь | Aoede | low voice | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_3_v2_g.flac | greet_глубь | Schedar | low voice | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_4_v2_f_g.flac | greet_глубь | Aoede | low voice | Садись у огня, погрейся. Потом о цене. |
| greet_glub_4_v2_g.flac | greet_глубь | Schedar | low voice | Садись у огня, погрейся. Потом о цене. |
| greet_glub_5_v2_f_g.flac | greet_глубь | Aoede | low voice | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_5_v2_g.flac | greet_глубь | Schedar | low voice | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_6_v2_f_g.flac | greet_глубь | Aoede | low voice | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_6_v2_g.flac | greet_глубь | Schedar | low voice | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_7_v2_f_g.flac | greet_глубь | Aoede | low voice | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_7_v2_g.flac | greet_глубь | Schedar | low voice | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_8_v2_f_g.flac | greet_глубь | Aoede | low voice | Кто спустился, тот платит. Такое правило. |
| greet_glub_8_v2_g.flac | greet_глубь | Schedar | low voice | Кто спустился, тот платит. Такое правило. |
| greet_glub_9_v2_f_g.flac | greet_глубь | Aoede | low voice | Руду беру, кости беру. Вопросов не задаю. |
| greet_glub_9_v2_g.flac | greet_глубь | Schedar | low voice | Руду беру, кости беру. Вопросов не задаю. |
| greet_holod_0_v2_f_g.flac | greet_холод | Aoede | cold | Чего тебе? |
| greet_holod_0_v2_g.flac | greet_холод | Schedar | cold | Чего тебе? |
| greet_holod_1_v2_f_g.flac | greet_холод | Aoede | cold | Быстрее. Мне некогда. |
| greet_holod_1_v2_g.flac | greet_холод | Schedar | cold | Быстрее. Мне некогда. |
| greet_holod_2_v2_f_g.flac | greet_холод | Aoede | cold | Говори и уходи. |
| greet_holod_2_v2_g.flac | greet_холод | Schedar | cold | Говори и уходи. |
| greet_holod_3_v2_f_g.flac | greet_холод | Aoede | cold | Знаем тебя. Не с лучшей стороны. |
| greet_holod_3_v2_g.flac | greet_холод | Schedar | cold | Знаем тебя. Не с лучшей стороны. |
| greet_holod_4_v2_f_g.flac | greet_холод | Aoede | cold | Ну? Я слушаю. Недолго. |
| greet_holod_4_v2_g.flac | greet_холод | Schedar | cold | Ну? Я слушаю. Недолго. |
| greet_holod_5_v2_f_g.flac | greet_холод | Aoede | cold | Опять ты. Ладно, говори. |
| greet_holod_5_v2_g.flac | greet_холод | Schedar | cold | Опять ты. Ладно, говори. |
| greet_kuznya_0_v2_f_g.flac | greet_кузня | Aoede | loud | Осторожно, окалина летит. |
| greet_kuznya_0_v2_g.flac | greet_кузня | Schedar | loud | Осторожно, окалина летит. |
| greet_kuznya_10_v2_f_g.flac | greet_кузня | Aoede | gruff | Искры не боишься? Подходи. |
| greet_kuznya_10_v2_g.flac | greet_кузня | Schedar | gruff | Искры не боишься? Подходи. |
| greet_kuznya_1_v2_f_g.flac | greet_кузня | Aoede | loud | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_1_v2_g.flac | greet_кузня | Schedar | loud | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_2_v2_f_g.flac | greet_кузня | Aoede | loud | Горн горячий, говори быстро. |
| greet_kuznya_2_v2_g.flac | greet_кузня | Schedar | loud | Горн горячий, говори быстро. |
| greet_kuznya_3_v2_f_g.flac | greet_кузня | Aoede | loud | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_3_v2_g.flac | greet_кузня | Schedar | loud | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_4_v2_f_g.flac | greet_кузня | Aoede | loud | Железо слушает руку, а не язык. |
| greet_kuznya_4_v2_g.flac | greet_кузня | Schedar | loud | Железо слушает руку, а не язык. |
| greet_kuznya_5_v2_f_g.flac | greet_кузня | Aoede | loud | Погоди, докую — остынет. |
| greet_kuznya_5_v2_g.flac | greet_кузня | Schedar | loud | Погоди, докую — остынет. |
| greet_kuznya_6_v2_f_g.flac | greet_кузня | Aoede | loud | Доспех править будем или новый ковать? |
| greet_kuznya_6_v2_g.flac | greet_кузня | Schedar | loud | Доспех править будем или новый ковать? |
| greet_kuznya_7_v2_f_g.flac | greet_кузня | Aoede | loud | Сталь у меня звонкая. Послушай. |
| greet_kuznya_7_v2_g.flac | greet_кузня | Schedar | loud | Сталь у меня звонкая. Послушай. |
| greet_kuznya_8_v2_f_g.flac | greet_кузня | Aoede | loud | Молот не ждёт. Чего тебе? |
| greet_kuznya_8_v2_g.flac | greet_кузня | Schedar | loud | Молот не ждёт. Чего тебе? |
| greet_kuznya_9_v2_f_g.flac | greet_кузня | Aoede | gruff | Кольчугу латать или клинок точить? |
| greet_kuznya_9_v2_g.flac | greet_кузня | Schedar | gruff | Кольчугу латать или клинок точить? |
| greet_lekar_0_v2_f_g.flac | greet_лекарь | Aoede | caring | Где болит? Показывай. |
| greet_lekar_0_v2_g.flac | greet_лекарь | Schedar | caring | Где болит? Показывай. |
| greet_lekar_10_v2_f_g.flac | greet_лекарь | Aoede | gentle | Травы свежие, отвар готов. Что беспокоит? |
| greet_lekar_10_v2_g.flac | greet_лекарь | Schedar | gentle | Травы свежие, отвар готов. Что беспокоит? |
| greet_lekar_1_v2_f_g.flac | greet_лекарь | Aoede | caring | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_1_v2_g.flac | greet_лекарь | Schedar | caring | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_2_v2_f_g.flac | greet_лекарь | Aoede | caring | Раны промывать надо, а не ждать. |
| greet_lekar_2_v2_g.flac | greet_лекарь | Schedar | caring | Раны промывать надо, а не ждать. |
| greet_lekar_3_v2_f_g.flac | greet_лекарь | Aoede | caring | Отвар горький, зато живой уйдёшь. |
| greet_lekar_3_v2_g.flac | greet_лекарь | Schedar | caring | Отвар горький, зато живой уйдёшь. |
| greet_lekar_4_v2_f_g.flac | greet_лекарь | Aoede | caring | Не трогай склянки, в них не вода. |
| greet_lekar_4_v2_g.flac | greet_лекарь | Schedar | caring | Не трогай склянки, в них не вода. |
| greet_lekar_5_v2_f_g.flac | greet_лекарь | Aoede | caring | Опять порезы? Береги себя. |
| greet_lekar_5_v2_g.flac | greet_лекарь | Schedar | caring | Опять порезы? Береги себя. |
| greet_lekar_6_v2_f_g.flac | greet_лекарь | Aoede | caring | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_6_v2_g.flac | greet_лекарь | Schedar | caring | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_7_v2_f_g.flac | greet_лекарь | Aoede | caring | Бледный ты. Давно ел? |
| greet_lekar_7_v2_g.flac | greet_лекарь | Schedar | caring | Бледный ты. Давно ел? |
| greet_lekar_8_v2_f_g.flac | greet_лекарь | Aoede | gentle | Тише, тише. Здесь больные спят. |
| greet_lekar_8_v2_g.flac | greet_лекарь | Schedar | gentle | Тише, тише. Здесь больные спят. |
| greet_lekar_9_v2_f_g.flac | greet_лекарь | Aoede | calm | Покажи руки. Раны чистые? |
| greet_lekar_9_v2_g.flac | greet_лекарь | Schedar | calm | Покажи руки. Раны чистые? |
| greet_noch_0_v2_f_g.flac | greet_ночь | Aoede | sleepy | Ночь на дворе. Чего не спится? |
| greet_noch_0_v2_g.flac | greet_ночь | Schedar | sleepy | Ночь на дворе. Чего не спится? |
| greet_noch_1_v2_f_g.flac | greet_ночь | Aoede | sleepy | Тише, люди спят. |
| greet_noch_1_v2_g.flac | greet_ночь | Schedar | sleepy | Тише, люди спят. |
| greet_noch_2_v2_f_g.flac | greet_ночь | Aoede | sleepy | В такой час? Ну, заходи. |
| greet_noch_2_v2_g.flac | greet_ночь | Schedar | sleepy | В такой час? Ну, заходи. |
| greet_noch_3_v2_f_g.flac | greet_ночь | Aoede | sleepy | Ночью добрые люди дома сидят. |
| greet_noch_3_v2_g.flac | greet_ночь | Schedar | sleepy | Ночью добрые люди дома сидят. |
| greet_obshiy_0_v2_f_g.flac | greet_общий | Aoede | plain | Доброго дня. |
| greet_obshiy_0_v2_g.flac | greet_общий | Schedar | plain | Доброго дня. |
| greet_obshiy_10_v2_f_g.flac | greet_общий | Aoede | curious | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_10_v2_g.flac | greet_общий | Schedar | curious | Ну, здравствуй. Что нового на свете? |
| greet_obshiy_11_v2_f_g.flac | greet_общий | Aoede | calm | Мир дому и тому, кто входит. |
| greet_obshiy_11_v2_g.flac | greet_общий | Schedar | calm | Мир дому и тому, кто входит. |
| greet_obshiy_12_v2_f_g.flac | greet_общий | Aoede | hospitable | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_12_v2_g.flac | greet_общий | Schedar | hospitable | О, гость. Проходи, не стой на пороге. |
| greet_obshiy_13_v2_f_g.flac | greet_общий | Aoede | cautious | Добрый человек? Тогда поговорим. |
| greet_obshiy_13_v2_g.flac | greet_общий | Schedar | cautious | Добрый человек? Тогда поговорим. |
| greet_obshiy_1_v2_f_g.flac | greet_общий | Aoede | plain | А, путник. Чем могу? |
| greet_obshiy_1_v2_g.flac | greet_общий | Schedar | plain | А, путник. Чем могу? |
| greet_obshiy_2_v2_f_g.flac | greet_общий | Aoede | plain | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_2_v2_g.flac | greet_общий | Schedar | plain | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_3_v2_f_g.flac | greet_общий | Aoede | plain | Слушаю тебя. |
| greet_obshiy_3_v2_g.flac | greet_общий | Schedar | plain | Слушаю тебя. |
| greet_obshiy_4_v2_f_g.flac | greet_общий | Aoede | plain | Говори, только недолго — дела. |
| greet_obshiy_4_v2_g.flac | greet_общий | Schedar | plain | Говори, только недолго — дела. |
| greet_obshiy_5_v2_f_g.flac | greet_общий | Aoede | plain | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_5_v2_g.flac | greet_общий | Schedar | plain | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_6_v2_f_g.flac | greet_общий | Aoede | plain | Новое лицо. Откуда будешь? |
| greet_obshiy_6_v2_g.flac | greet_общий | Schedar | plain | Новое лицо. Откуда будешь? |
| greet_obshiy_7_v2_f_g.flac | greet_общий | Aoede | plain | Проходи, раз пришёл. |
| greet_obshiy_7_v2_g.flac | greet_общий | Schedar | plain | Проходи, раз пришёл. |
| greet_obshiy_8_v2_f_g.flac | greet_общий | Aoede | friendly | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_8_v2_g.flac | greet_общий | Schedar | friendly | Здравствуй, здравствуй. Каким ветром? |
| greet_obshiy_9_v2_f_g.flac | greet_общий | Aoede | friendly | Путник? Дорога дальняя, небось. |
| greet_obshiy_9_v2_g.flac | greet_общий | Schedar | friendly | Путник? Дорога дальняя, небось. |
| greet_postoyan_0_v2_f_g.flac | greet_постоянный | Aoede | warm | А, мой лучший покупатель! Заходи. |
| greet_postoyan_0_v2_g.flac | greet_постоянный | Schedar | warm | А, мой лучший покупатель! Заходи. |
| greet_postoyan_1_v2_f_g.flac | greet_постоянный | Aoede | proud | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_1_v2_g.flac | greet_постоянный | Schedar | proud | Снова ко мне? Правильно, у меня лучше всех. |
| greet_postoyan_2_v2_f_g.flac | greet_постоянный | Aoede | confidential | Для постоянных — цена особая. Смотри. |
| greet_postoyan_2_v2_g.flac | greet_постоянный | Schedar | confidential | Для постоянных — цена особая. Смотри. |
| greet_postoyan_3_v2_f_g.flac | greet_постоянный | Aoede | teasing | Я уж думала, ты к соседу переметнулся. |
| greet_postoyan_3_v2_g.flac | greet_постоянный | Schedar | teasing | Я уж думал, ты к соседу переметнулся. |
| greet_postoyan_4_v2_f_g.flac | greet_постоянный | Aoede | knowing | Узнаю тебя. Опять за припасами? |
| greet_postoyan_4_v2_g.flac | greet_постоянный | Schedar | knowing | Узнаю тебя. Опять за припасами? |
| greet_postoyan_5_v2_f_g.flac | greet_постоянный | Aoede | courteous | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_5_v2_g.flac | greet_постоянный | Schedar | courteous | Постоянному покупателю — первый выбор. Прошу. |
| greet_postoyan_6_v2_f_g.flac | greet_постоянный | Aoede | joking | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_6_v2_g.flac | greet_постоянный | Schedar | joking | Твоё золото у меня в сундуке уже место греет. |
| greet_postoyan_7_v2_f_g.flac | greet_постоянный | Aoede | cheerful | Опять ты! Я как раз свежий товар разложила. |
| greet_postoyan_7_v2_g.flac | greet_постоянный | Schedar | cheerful | Опять ты! Я как раз свежий товар разложил. |
| greet_postoyan_8_v2_f_g.flac | greet_постоянный | Aoede | sincere | С тобой торговать — одно удовольствие. |
| greet_postoyan_8_v2_g.flac | greet_постоянный | Schedar | sincere | С тобой торговать — одно удовольствие. |
| greet_postoyan_9_v2_f_g.flac | greet_постоянный | Aoede | helpful | Запомнила, что ты берёшь. Отложила кое-что. |
| greet_postoyan_9_v2_g.flac | greet_постоянный | Schedar | helpful | Запомнил, что ты берёшь. Отложил кое-что. |
| greet_prodavec_0_v2_f_g.flac | greet_продавец | Aoede | eager | С добычей? Показывай, что там у тебя. |
| greet_prodavec_0_v2_g.flac | greet_продавец | Schedar | eager | С добычей? Показывай, что там у тебя. |
| greet_prodavec_1_v2_f_g.flac | greet_продавец | Aoede | amused | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_1_v2_g.flac | greet_продавец | Schedar | amused | Полсклада уже твоим добром забито. Неси ещё. |
| greet_prodavec_2_v2_f_g.flac | greet_продавец | Aoede | businesslike | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_2_v2_g.flac | greet_продавец | Schedar | businesslike | Своему поставщику плачу честно. Что сегодня? |
| greet_prodavec_3_v2_f_g.flac | greet_продавец | Aoede | curious | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_3_v2_g.flac | greet_продавец | Schedar | curious | Опять с мешком? Ну-ка, развязывай. |
| greet_prodavec_4_v2_f_g.flac | greet_продавец | Aoede | warm | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_4_v2_g.flac | greet_продавец | Schedar | warm | Хороший товар всегда возьму. Особенно у тебя. |
| greet_prodavec_5_v2_f_g.flac | greet_продавец | Aoede | playful | С тобой и артели не надо. Что на продажу? |
| greet_prodavec_5_v2_g.flac | greet_продавец | Schedar | playful | С тобой и артели не надо. Что на продажу? |
| greet_ranen_0_v2_f_g.flac | greet_ранен | Aoede | alarmed | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_0_v2_g.flac | greet_ранен | Schedar | alarmed | Ох, да ты весь в крови! Садись, отдышись. |
| greet_ranen_1_v2_f_g.flac | greet_ранен | Aoede | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_1_v2_g.flac | greet_ранен | Schedar | concerned | Кто ж тебя так? Лекарь тут недалеко. |
| greet_ranen_2_v2_f_g.flac | greet_ранен | Aoede | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_2_v2_g.flac | greet_ранен | Schedar | worried | На ногах едва стоишь. Может, сперва к лекарю? |
| greet_ranen_3_v2_f_g.flac | greet_ранен | Aoede | gruff | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_3_v2_g.flac | greet_ранен | Schedar | gruff | Перевяжись хоть. Кровью весь пол закапаешь. |
| greet_ranen_4_v2_f_g.flac | greet_ранен | Aoede | relieved | Живой — и то ладно. Потом о делах. |
| greet_ranen_4_v2_g.flac | greet_ранен | Schedar | relieved | Живой — и то ладно. Потом о делах. |
| greet_ranen_5_v2_f_g.flac | greet_ранен | Aoede | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_ranen_5_v2_g.flac | greet_ранен | Schedar | sympathetic | Эк тебя потрепало. Воды дать? |
| greet_slava_0_v2_f_g.flac | greet_слава | Aoede | awed | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_0_v2_g.flac | greet_слава | Schedar | awed | Неужто это вы? Наслышаны, наслышаны! |
| greet_slava_1_v2_f_g.flac | greet_слава | Aoede | respectful | О вас уже песни поют. Чем могу служить? |
| greet_slava_1_v2_g.flac | greet_слава | Schedar | respectful | О вас уже песни поют. Чем могу служить? |
| greet_slava_2_v2_f_g.flac | greet_слава | Aoede | honored | Такой гость — честь для нашего дома. |
| greet_slava_2_v2_g.flac | greet_слава | Schedar | honored | Такой гость — честь для нашего дома. |
| greet_slava_3_v2_f_g.flac | greet_слава | Aoede | excited | Весь город о вас говорит. Проходите! |
| greet_slava_3_v2_g.flac | greet_слава | Schedar | excited | Весь город о вас говорит. Проходите! |
| greet_slava_4_v2_f_g.flac | greet_слава | Aoede | delighted | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_4_v2_g.flac | greet_слава | Schedar | delighted | Знаменитость у меня! Соседи обзавидуются. |
| greet_slava_5_v2_f_g.flac | greet_слава | Aoede | respectful | Слава бежит впереди вас. Рады видеть. |
| greet_slava_5_v2_g.flac | greet_слава | Schedar | respectful | Слава бежит впереди вас. Рады видеть. |
| greet_snova_0_v2_f_g.flac | greet_снова | Aoede | wry | Снова ты? Ну, заходи. |
| greet_snova_0_v2_g.flac | greet_снова | Schedar | wry | Снова ты? Ну, заходи. |
| greet_snova_1_v2_f_g.flac | greet_снова | Aoede | wry | Вернулся? Значит, понравилось. |
| greet_snova_1_v2_g.flac | greet_снова | Schedar | wry | Вернулся? Значит, понравилось. |
| greet_snova_2_v2_f_g.flac | greet_снова | Aoede | wry | Опять пришёл. Что на этот раз? |
| greet_snova_2_v2_g.flac | greet_снова | Schedar | wry | Опять пришёл. Что на этот раз? |
| greet_snova_3_v2_f_g.flac | greet_снова | Aoede | wry | Помню тебя. Садись. |
| greet_snova_3_v2_g.flac | greet_снова | Schedar | wry | Помню тебя. Садись. |
| greet_snova_4_v2_f_g.flac | greet_снова | Aoede | wry | А, это ты. С прошлого раза ничего не изменилось. |
| greet_snova_4_v2_g.flac | greet_снова | Schedar | wry | А, это ты. С прошлого раза ничего не изменилось. |
| greet_strazha_0_v2_f_g.flac | greet_стража | Aoede | stern | Стой. Кто таков и зачем? |
| greet_strazha_0_v2_g.flac | greet_стража | Schedar | stern | Стой. Кто таков и зачем? |
| greet_strazha_10_v2_f_g.flac | greet_стража | Aoede | dry | Держи руки на виду, и мы поладим. |
| greet_strazha_10_v2_g.flac | greet_стража | Schedar | dry | Держи руки на виду, и мы поладим. |
| greet_strazha_11_v2_f_g.flac | greet_стража | Aoede | curt | Без дела не задерживайся. |
| greet_strazha_11_v2_g.flac | greet_стража | Schedar | curt | Без дела не задерживайся. |
| greet_strazha_1_v2_f_g.flac | greet_стража | Aoede | stern | Оружие в ножнах держи. |
| greet_strazha_1_v2_g.flac | greet_стража | Schedar | stern | Оружие в ножнах держи. |
| greet_strazha_2_v2_f_g.flac | greet_стража | Aoede | stern | Проходи, но без шума. |
| greet_strazha_2_v2_g.flac | greet_стража | Schedar | stern | Проходи, но без шума. |
| greet_strazha_3_v2_f_g.flac | greet_стража | Aoede | stern | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_3_v2_g.flac | greet_стража | Schedar | stern | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_4_v2_f_g.flac | greet_стража | Aoede | stern | Ночью по одному не ходи. |
| greet_strazha_4_v2_g.flac | greet_стража | Schedar | stern | Ночью по одному не ходи. |
| greet_strazha_5_v2_f_g.flac | greet_стража | Aoede | stern | Приказ есть приказ. Чего надо? |
| greet_strazha_5_v2_g.flac | greet_стража | Schedar | stern | Приказ есть приказ. Чего надо? |
| greet_strazha_6_v2_f_g.flac | greet_стража | Aoede | stern | Смена долгая, говори короче. |
| greet_strazha_6_v2_g.flac | greet_стража | Schedar | stern | Смена долгая, говори короче. |
| greet_strazha_7_v2_f_g.flac | greet_стража | Aoede | stern | Бумаги есть? Покажи. |
| greet_strazha_7_v2_g.flac | greet_стража | Schedar | stern | Бумаги есть? Покажи. |
| greet_strazha_8_v2_f_g.flac | greet_стража | Aoede | stern | Спокойно у ворот — и слава богам. |
| greet_strazha_8_v2_g.flac | greet_стража | Schedar | stern | Спокойно у ворот — и слава богам. |
| greet_strazha_9_v2_f_g.flac | greet_стража | Aoede | stern | Порядок знаешь? Тогда проходи. |
| greet_strazha_9_v2_g.flac | greet_стража | Schedar | stern | Порядок знаешь? Тогда проходи. |
| greet_svoy_0_v2_f_g.flac | greet_свой | Aoede | joyful | Рада тебя видеть, друг. |
| greet_svoy_0_v2_g.flac | greet_свой | Schedar | joyful | Рад тебя видеть, друг. |
| greet_svoy_1_v2_f_g.flac | greet_свой | Aoede | joyful | Для тебя — всегда время. |
| greet_svoy_1_v2_g.flac | greet_свой | Schedar | joyful | Для тебя — всегда время. |
| greet_svoy_2_v2_f_g.flac | greet_свой | Aoede | joyful | А вот и ты! Заходи. |
| greet_svoy_2_v2_g.flac | greet_свой | Schedar | joyful | А вот и ты! Заходи. |
| greet_svoy_3_v2_f_g.flac | greet_свой | Aoede | joyful | Своих не забываем. Садись. |
| greet_svoy_3_v2_g.flac | greet_свой | Schedar | joyful | Своих не забываем. Садись. |
| greet_svoy_4_v2_f_g.flac | greet_свой | Aoede | joyful | О, наш человек! Что нового? |
| greet_svoy_4_v2_g.flac | greet_свой | Schedar | joyful | О, наш человек! Что нового? |
| greet_svoy_5_v2_f_g.flac | greet_свой | Aoede | joyful | Для тебя отложила кое-что. Смотри. |
| greet_svoy_5_v2_g.flac | greet_свой | Schedar | joyful | Для тебя отложил кое-что. Смотри. |
| greet_tma_0_v2_f_g.flac | greet_тьма | Aoede | hushed | Говори быстро. Нас считают. |
| greet_tma_0_v2_g.flac | greet_тьма | Schedar | hushed | Говори быстро. Нас считают. |
| greet_tma_1_v2_f_g.flac | greet_тьма | Aoede | hushed | Ты не отсюда. Это слышно. |
| greet_tma_1_v2_g.flac | greet_тьма | Schedar | hushed | Ты не отсюда. Это слышно. |
| greet_tma_2_v2_f_g.flac | greet_тьма | Aoede | hushed | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_2_v2_g.flac | greet_тьма | Schedar | hushed | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_3_v2_f_g.flac | greet_тьма | Aoede | hushed | Тише. Надсмотрщик близко. |
| greet_tma_3_v2_g.flac | greet_тьма | Schedar | hushed | Тише. Надсмотрщик близко. |
| greet_tma_4_v2_f_g.flac | greet_тьма | Aoede | hushed | Спросишь лишнее — забуду, что видела тебя. |
| greet_tma_4_v2_g.flac | greet_тьма | Schedar | hushed | Спросишь лишнее — забуду, что видел тебя. |
| greet_tma_5_v2_f_g.flac | greet_тьма | Aoede | hushed | Живым здесь не рады. Но я — не здесь. |
| greet_tma_5_v2_g.flac | greet_тьма | Schedar | hushed | Живым здесь не рады. Но я — не здесь. |
| greet_tma_6_v2_f_g.flac | greet_тьма | Aoede | hushed | Что принёс с той стороны? Покажи. |
| greet_tma_6_v2_g.flac | greet_тьма | Schedar | hushed | Что принёс с той стороны? Покажи. |
| greet_tma_7_v2_f_g.flac | greet_тьма | Aoede | hushed | Не называй имени. Имя — это долг. |
| greet_tma_7_v2_g.flac | greet_тьма | Schedar | hushed | Не называй имени. Имя — это долг. |
| greet_torg_0_v2_f_g.flac | greet_торг | Aoede | brisk | Смотри, выбирай. Руками не мни. |
| greet_torg_0_v2_g.flac | greet_торг | Schedar | brisk | Смотри, выбирай. Руками не мни. |
| greet_torg_10_v2_f_g.flac | greet_торг | Aoede | brisk | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_10_v2_g.flac | greet_торг | Schedar | brisk | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_11_v2_f_g.flac | greet_торг | Aoede | brisk | Последний такой остался. Правда последний. |
| greet_torg_11_v2_g.flac | greet_торг | Schedar | brisk | Последний такой остался. Правда последний. |
| greet_torg_12_v2_f_g.flac | greet_торг | Aoede | brisk | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_12_v2_g.flac | greet_торг | Schedar | brisk | Подходи, не стесняйся! Товар лицом покажу. |
| greet_torg_13_v2_f_g.flac | greet_торг | Aoede | playful | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_13_v2_g.flac | greet_торг | Schedar | playful | Купишь — не пожалеешь, не купишь — пожалеешь. |
| greet_torg_14_v2_f_g.flac | greet_торг | Aoede | proud | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_14_v2_g.flac | greet_торг | Schedar | proud | У меня сегодня привоз. Свежее не найдёшь. |
| greet_torg_15_v2_f_g.flac | greet_торг | Aoede | sly | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_15_v2_g.flac | greet_торг | Schedar | sly | Торгуюсь до последнего медяка, так и знай. |
| greet_torg_16_v2_f_g.flac | greet_торг | Aoede | admiring | Глянь, какая работа! Такое не каждый день. |
| greet_torg_16_v2_g.flac | greet_торг | Schedar | admiring | Глянь, какая работа! Такое не каждый день. |
| greet_torg_17_v2_f_g.flac | greet_торг | Aoede | wise | Деньги любят счёт, а товар — хозяина. |
| greet_torg_17_v2_g.flac | greet_торг | Schedar | wise | Деньги любят счёт, а товар — хозяина. |
| greet_torg_1_v2_f_g.flac | greet_торг | Aoede | brisk | Товар свежий, цена честная — почти. |
| greet_torg_1_v2_g.flac | greet_торг | Schedar | brisk | Товар свежий, цена честная — почти. |
| greet_torg_2_v2_f_g.flac | greet_торг | Aoede | brisk | Золото есть? Тогда поговорим. |
| greet_torg_2_v2_g.flac | greet_торг | Schedar | brisk | Золото есть? Тогда поговорим. |
| greet_torg_3_v2_f_g.flac | greet_торг | Aoede | brisk | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_3_v2_g.flac | greet_торг | Schedar | brisk | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_4_v2_f_g.flac | greet_торг | Aoede | brisk | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_4_v2_g.flac | greet_торг | Schedar | brisk | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_5_v2_f_g.flac | greet_торг | Aoede | brisk | Не стой в проходе, покупатели за тобой. |
| greet_torg_5_v2_g.flac | greet_торг | Schedar | brisk | Не стой в проходе, покупатели за тобой. |
| greet_torg_6_v2_f_g.flac | greet_торг | Aoede | brisk | За погляд денег не беру. Пока. |
| greet_torg_6_v2_g.flac | greet_торг | Schedar | brisk | За погляд денег не беру. Пока. |
| greet_torg_7_v2_f_g.flac | greet_торг | Aoede | brisk | С дороги? Значит, есть что продать. |
| greet_torg_7_v2_g.flac | greet_торг | Schedar | brisk | С дороги? Значит, есть что продать. |
| greet_torg_8_v2_f_g.flac | greet_торг | Aoede | brisk | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_8_v2_g.flac | greet_торг | Schedar | brisk | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_9_v2_f_g.flac | greet_торг | Aoede | brisk | Весы у меня верные, не сомневайся. |
| greet_torg_9_v2_g.flac | greet_торг | Schedar | brisk | Весы у меня верные, не сомневайся. |
| greet_traktir_0_v2_f_g.flac | greet_трактир | Aoede | warm | Садись к огню, похлёбка горячая. |
| greet_traktir_0_v2_g.flac | greet_трактир | Schedar | warm | Садись к огню, похлёбка горячая. |
| greet_traktir_10_v2_f_g.flac | greet_трактир | Aoede | friendly | Свободный стол у окна. Садись. |
| greet_traktir_10_v2_g.flac | greet_трактир | Schedar | friendly | Свободный стол у окна. Садись. |
| greet_traktir_1_v2_f_g.flac | greet_трактир | Aoede | warm | Комната наверху свободна, если не храпишь. |
| greet_traktir_1_v2_g.flac | greet_трактир | Schedar | warm | Комната наверху свободна, если не храпишь. |
| greet_traktir_2_v2_f_g.flac | greet_трактир | Aoede | warm | Чего налить? Пиво у нас своё. |
| greet_traktir_2_v2_g.flac | greet_трактир | Schedar | warm | Чего налить? Пиво у нас своё. |
| greet_traktir_3_v2_f_g.flac | greet_трактир | Aoede | warm | Новости? Здесь их больше, чем пива. |
| greet_traktir_3_v2_g.flac | greet_трактир | Schedar | warm | Новости? Здесь их больше, чем пива. |
| greet_traktir_4_v2_f_g.flac | greet_трактир | Aoede | warm | Ноги вытирай, пол только выскоблили. |
| greet_traktir_4_v2_g.flac | greet_трактир | Schedar | warm | Ноги вытирай, пол только выскоблили. |
| greet_traktir_5_v2_f_g.flac | greet_трактир | Aoede | warm | Грей руки. Ночь нынче злая. |
| greet_traktir_5_v2_g.flac | greet_трактир | Schedar | warm | Грей руки. Ночь нынче злая. |
| greet_traktir_6_v2_f_g.flac | greet_трактир | Aoede | warm | Платят вперёд. Ничего личного. |
| greet_traktir_6_v2_g.flac | greet_трактир | Schedar | warm | Платят вперёд. Ничего личного. |
| greet_traktir_7_v2_f_g.flac | greet_трактир | Aoede | warm | О дороге спроси — здесь все с дороги. |
| greet_traktir_7_v2_g.flac | greet_трактир | Schedar | warm | О дороге спроси — здесь все с дороги. |
| greet_traktir_8_v2_f_g.flac | greet_трактир | Aoede | warm | Заходи, у нас тепло и сухо. |
| greet_traktir_8_v2_g.flac | greet_трактир | Schedar | warm | Заходи, у нас тепло и сухо. |
| greet_traktir_9_v2_f_g.flac | greet_трактир | Aoede | cheerful innkeeper | Кружку пива для начала? |
| greet_traktir_9_v2_g.flac | greet_трактир | Schedar | cheerful innkeeper | Кружку пива для начала? |
| greet_utro_0_v2_f_g.flac | greet_утро | Aoede | fresh | Доброе утро. Рано вы. |
| greet_utro_0_v2_g.flac | greet_утро | Schedar | fresh | Доброе утро. Рано вы. |
| greet_utro_1_v2_f_g.flac | greet_утро | Aoede | fresh | С утра пораньше — и уже по делам? |
| greet_utro_1_v2_g.flac | greet_утро | Schedar | fresh | С утра пораньше — и уже по делам? |
| greet_utro_2_v2_f_g.flac | greet_утро | Aoede | fresh | Утро доброе. Только открылись. |
| greet_utro_2_v2_g.flac | greet_утро | Schedar | fresh | Утро доброе. Только открылись. |
| greet_utro_3_v2_f_g.flac | greet_утро | Aoede | fresh | Доброе утро, путник. |
| greet_utro_3_v2_g.flac | greet_утро | Schedar | fresh | Доброе утро, путник. |
| greet_vecher_0_v2_f_g.flac | greet_вечер | Aoede | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_0_v2_g.flac | greet_вечер | Schedar | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_1_v2_f_g.flac | greet_вечер | Aoede | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_1_v2_g.flac | greet_вечер | Schedar | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_2_v2_f_g.flac | greet_вечер | Aoede | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_2_v2_g.flac | greet_вечер | Schedar | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_3_v2_f_g.flac | greet_вечер | Aoede | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_vecher_3_v2_g.flac | greet_вечер | Schedar | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_vrazhda_0_v2_f_g.flac | greet_вражда | Aoede | hostile | Уходи, пока цел. |
| greet_vrazhda_0_v2_g.flac | greet_вражда | Schedar | hostile | Уходи, пока цел. |
| greet_vrazhda_1_v2_f_g.flac | greet_вражда | Aoede | hostile | Тебе здесь не рады. |
| greet_vrazhda_1_v2_g.flac | greet_вражда | Schedar | hostile | Тебе здесь не рады. |
| greet_vrazhda_2_v2_f_g.flac | greet_вражда | Aoede | hostile | Ещё шаг — и позову стражу. |
| greet_vrazhda_2_v2_g.flac | greet_вражда | Schedar | hostile | Ещё шаг — и позову стражу. |
| greet_vrazhda_3_v2_f_g.flac | greet_вражда | Aoede | hostile | С такими, как ты, не говорю. |
| greet_vrazhda_3_v2_g.flac | greet_вражда | Schedar | hostile | С такими, как ты, не говорю. |
| greet_vrazhda_4_v2_f_g.flac | greet_вражда | Aoede | hostile | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_4_v2_g.flac | greet_вражда | Schedar | hostile | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_5_v2_f_g.flac | greet_вражда | Aoede | hostile | Руки держи на виду. |
| greet_vrazhda_5_v2_g.flac | greet_вражда | Schedar | hostile | Руки держи на виду. |
| greet_zemlyak_0_v2_f_g.flac | greet_земляк | Aoede | joyful | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_0_v2_g.flac | greet_земляк | Schedar | joyful | Свой! По говору слышу. Здравствуй, земляк. |
| greet_zemlyak_1_v2_f_g.flac | greet_земляк | Aoede | warm | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_1_v2_g.flac | greet_земляк | Schedar | warm | Родная кровь! Для земляка — всегда пожалуйста. |
| greet_zemlyak_2_v2_f_g.flac | greet_земляк | Aoede | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_2_v2_g.flac | greet_земляк | Schedar | pleasantly surprised | Из наших будешь? Тогда и разговор другой. |
| greet_zemlyak_3_v2_f_g.flac | greet_земляк | Aoede | friendly | Земляку и цена своя. Проходи. |
| greet_zemlyak_3_v2_g.flac | greet_земляк | Schedar | friendly | Земляку и цена своя. Проходи. |
| greet_zemlyak_4_v2_f_g.flac | greet_земляк | Aoede | warm | Своих издалека видно. Как там дома? |
| greet_zemlyak_4_v2_g.flac | greet_земляк | Schedar | warm | Своих издалека видно. Как там дома? |
| greet_zemlyak_5_v2_f_g.flac | greet_земляк | Aoede | glad | Нечасто наших тут встретишь. Садись. |
| greet_zemlyak_5_v2_g.flac | greet_земляк | Schedar | glad | Нечасто наших тут встретишь. Садись. |
| greet_zhdet_0_v2_f_g.flac | greet_ждёт | Aoede | expectant | Ну что, как с моим делом? |
| greet_zhdet_0_v2_g.flac | greet_ждёт | Schedar | expectant | Ну что, как с моим делом? |
| greet_zhdet_1_v2_f_g.flac | greet_ждёт | Aoede | reminding | Помнишь, о чём договаривались? |
| greet_zhdet_1_v2_g.flac | greet_ждёт | Schedar | reminding | Помнишь, о чём договаривались? |
| greet_zhdet_2_v2_f_g.flac | greet_ждёт | Aoede | impatient | Жду, жду. Дело само не сделается. |
| greet_zhdet_2_v2_g.flac | greet_ждёт | Schedar | impatient | Жду, жду. Дело само не сделается. |
| greet_zhdet_3_v2_f_g.flac | greet_ждёт | Aoede | worried | Не забыто ли моё поручение? |
| greet_zhdet_3_v2_g.flac | greet_ждёт | Schedar | worried | Не забыто ли моё поручение? |
| greet_zhdet_4_v2_f_g.flac | greet_ждёт | Aoede | hopeful | Вести есть? Как там с тем делом? |
| greet_zhdet_4_v2_g.flac | greet_ждёт | Schedar | hopeful | Вести есть? Как там с тем делом? |
| greet_zhdet_5_v2_f_g.flac | greet_ждёт | Aoede | hopeful | Вижу тебя — значит, есть новости? |
| greet_zhdet_5_v2_g.flac | greet_ждёт | Schedar | hopeful | Вижу тебя — значит, есть новости? |
| greet_zhrec_0_v2_f_g.flac | greet_жрец | Aoede | quiet | Мир тебе, путник. |
| greet_zhrec_0_v2_g.flac | greet_жрец | Schedar | quiet | Мир тебе, путник. |
| greet_zhrec_10_v2_f_g.flac | greet_жрец | Aoede | gentle | Помолишься с нами или пришёл за советом? |
| greet_zhrec_10_v2_g.flac | greet_жрец | Schedar | gentle | Помолишься с нами или пришёл за советом? |
| greet_zhrec_1_v2_f_g.flac | greet_жрец | Aoede | quiet | Боги слышат. Говори тише. |
| greet_zhrec_1_v2_g.flac | greet_жрец | Schedar | quiet | Боги слышат. Говори тише. |
| greet_zhrec_2_v2_f_g.flac | greet_жрец | Aoede | quiet | Свеча горит — значит, ты не один. |
| greet_zhrec_2_v2_g.flac | greet_жрец | Schedar | quiet | Свеча горит — значит, ты не один. |
| greet_zhrec_3_v2_f_g.flac | greet_жрец | Aoede | quiet | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_3_v2_g.flac | greet_жрец | Schedar | quiet | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_4_v2_f_g.flac | greet_жрец | Aoede | quiet | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_4_v2_g.flac | greet_жрец | Schedar | quiet | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_5_v2_f_g.flac | greet_жрец | Aoede | quiet | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_5_v2_g.flac | greet_жрец | Schedar | quiet | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_6_v2_f_g.flac | greet_жрец | Aoede | quiet | Кто кается — того слушают. |
| greet_zhrec_6_v2_g.flac | greet_жрец | Schedar | quiet | Кто кается — того слушают. |
| greet_zhrec_7_v2_f_g.flac | greet_жрец | Aoede | quiet | Благослови тебя небо. Чем помочь? |
| greet_zhrec_7_v2_g.flac | greet_жрец | Schedar | quiet | Благослови тебя небо. Чем помочь? |
| greet_zhrec_8_v2_f_g.flac | greet_жрец | Aoede | serene | Входи с миром, уходи с надеждой. |
| greet_zhrec_8_v2_g.flac | greet_жрец | Schedar | serene | Входи с миром, уходи с надеждой. |
| greet_zhrec_9_v2_f_g.flac | greet_жрец | Aoede | quiet | Боги видят всякого, кто переступает порог. |
| greet_zhrec_9_v2_g.flac | greet_жрец | Schedar | quiet | Боги видят всякого, кто переступает порог. |
| greet_zlo_0_v2_f_g.flac | greet_зло | Aoede | resentful | Опять вы. После того, что было... |
| greet_zlo_0_v2_g.flac | greet_зло | Schedar | resentful | Опять вы. После того, что было... |
| greet_zlo_1_v2_f_g.flac | greet_зло | Aoede | resentful | Не думайте, что всё забыто. |
| greet_zlo_1_v2_g.flac | greet_зло | Schedar | resentful | Не думайте, что всё забыто. |
| greet_zlo_2_v2_f_g.flac | greet_зло | Aoede | resentful | Чего пришли? Мало вам? |
| greet_zlo_2_v2_g.flac | greet_зло | Schedar | resentful | Чего пришли? Мало вам? |
| greet_zlo_3_v2_f_g.flac | greet_зло | Aoede | resentful | Помню, как вы со мной обошлись. |
| greet_zlo_3_v2_g.flac | greet_зло | Schedar | resentful | Помню, как вы со мной обошлись. |
| greet_zlo_4_v2_f_g.flac | greet_зло | Aoede | resentful | Держитесь подальше. Всё помню. |
| greet_zlo_4_v2_g.flac | greet_зло | Schedar | resentful | Держитесь подальше. Всё помню. |
| greet_zlo_5_v2_f_g.flac | greet_зло | Aoede | resentful | Вы ещё смеете сюда приходить? |
| greet_zlo_5_v2_g.flac | greet_зло | Schedar | resentful | Вы ещё смеете сюда приходить? |
| greet_znanie_0_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Не шуми, я считаю. |
| greet_znanie_0_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Не шуми, я считаю. |
| greet_znanie_10_v2_f_g.flac | greet_знание | Aoede | delighted | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_znanie_10_v2_g.flac | greet_знание | Schedar | delighted | Вопрос? Прекрасно. Вопросы я люблю. |
| greet_znanie_1_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Книги любят тишину и чистые руки. |
| greet_znanie_1_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Книги любят тишину и чистые руки. |
| greet_znanie_2_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Спрашивай. Если знаю — скажу. |
| greet_znanie_2_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Спрашивай. Если знаю — скажу. |
| greet_znanie_3_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Ученье долгое. Разговор — короче. |
| greet_znanie_3_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Ученье долгое. Разговор — короче. |
| greet_znanie_4_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Чернила сохнут, говори по делу. |
| greet_znanie_4_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Чернила сохнут, говори по делу. |
| greet_znanie_5_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_5_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_6_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Осторожно, свитки не сшиты. |
| greet_znanie_6_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Осторожно, свитки не сшиты. |
| greet_znanie_7_v2_f_g.flac | greet_знание | Aoede | thoughtful scholar | Ты грамоте учён? Хорошо. |
| greet_znanie_7_v2_g.flac | greet_знание | Schedar | thoughtful scholar | Ты грамоте учён? Хорошо. |
| greet_znanie_8_v2_f_g.flac | greet_знание | Aoede | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_8_v2_g.flac | greet_знание | Schedar | absent-minded scholar | А, посетитель. Осторожно, чернила. |
| greet_znanie_9_v2_f_g.flac | greet_знание | Aoede | fussy | Любую книгу — только после того, как руки вымоешь. |
| greet_znanie_9_v2_g.flac | greet_знание | Schedar | fussy | Любую книгу — только после того, как руки вымоешь. |
| guard_quest_0_v2_g.flac | guard_quest | Algenib | stern | Разбойники на тракте совсем обнаглели. Очисти округу — головы принесёшь в доказательство. |
| guard_quest_1_v2_g.flac | guard_quest | Algenib | tired | Нам людей не хватает. Возьмёшься за разбойников на дороге? |
| guard_quest_2_v2_g.flac | guard_quest | Algenib | grim | На тракте грабят обозы. Найди эту шайку и покончи с ней. |
| guard_quest_3_v2_g.flac | guard_quest | Algenib | dry | Капитан платит за каждую голову разбойника. Слово стражи. |
| guard_quest_4_v2_g.flac | guard_quest | Algenib | earnest | Дорога должна быть безопасной. Помоги нам с этим. |
| guard_quest_5_v2_g.flac | guard_quest | Algenib | stern | Бандиты засели у тракта. Принеси их головы — получишь награду. |
| guard_quest_done_0_v2_g.flac | guard_quest_done | Algenib | pleased | Вот это работа! Тракт теперь чище. Держи плату. |
| guard_quest_done_1_v2_g.flac | guard_quest_done | Algenib | satisfied | Головы на месте. Капитан будет доволен. |
| guard_quest_done_2_v2_g.flac | guard_quest_done | Algenib | grateful | Спасибо от всей стражи. Дорога снова безопасна. |
| guard_quest_done_3_v2_g.flac | guard_quest_done | Algenib | respectful | Честная работа. Если понадобишься — позовём. |
| guard_quest_wait_0_v2_g.flac | guard_quest_wait | Algenib | dry | Ещё не всех? Разбойники сами не кончатся. |
| guard_quest_wait_1_v2_g.flac | guard_quest_wait | Algenib | stern | Голов маловато. Тракт всё ещё неспокоен. |
| patrol_0_v2_g.flac | patrol | Algenib | loud | Дозор державы! Дорогу! |
| patrol_1_v2_g.flac | patrol | Algenib | stern | Стой! Проверка. Ладно, проходи. |
| patrol_2_v2_g.flac | patrol | Algenib | watchful | Разбойников на пути не видно было? |
| patrol_3_v2_g.flac | patrol | Algenib | reassuring | Держись тракта, путник. Мы рядом. |
| patrol_4_v2_g.flac | patrol | Algenib | loud military command | Шагом марш! Не растягиваться! |
| patrol_5_v2_g.flac | patrol | Algenib | rhythmic marching command | Левой! Левой! Держать строй! |
| patrol_6_v2_g.flac | patrol | Algenib | gruff warning | На обочине не стой — строй идёт. |
| patrol_7_v2_g.flac | patrol | Algenib | calm | Дорога под охраной. Можно не бояться. |
| quest_archeo_0_v2_f_g.flac | quest_archeo | Aoede | mysterious | Под землёй лежит старое. Подними его. |
| quest_archeo_0_v2_g.flac | quest_archeo | Schedar | mysterious | Под землёй лежит старое. Подними его. |
| quest_archeo_1_v2_f_g.flac | quest_archeo | Aoede | intrigued | Древность ждёт того, кто не побоится копать. |
| quest_archeo_1_v2_g.flac | quest_archeo | Schedar | intrigued | Древность ждёт того, кто не побоится копать. |
| quest_archeo_2_v2_f_g.flac | quest_archeo | Aoede | eager | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_2_v2_g.flac | quest_archeo | Schedar | eager | В старых руинах есть то, что мне нужно. Раскопай, но бережно. |
| quest_archeo_3_v2_f_g.flac | quest_archeo | Aoede | awed | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_archeo_3_v2_g.flac | quest_archeo | Schedar | awed | Предтечи оставили там что-то. Найди — и мир станет немного понятнее. |
| quest_case_0_v2_f_g.flac | quest_case | Aoede | suspicious | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_0_v2_g.flac | quest_case | Schedar | suspicious | Здесь что-то нечисто. Нужно разобраться. |
| quest_case_1_v2_f_g.flac | quest_case | Aoede | sharp | Нужны улики, а не слухи. Поищешь? |
| quest_case_1_v2_g.flac | quest_case | Schedar | sharp | Нужны улики, а не слухи. Поищешь? |
| quest_case_2_v2_f_g.flac | quest_case | Aoede | suspicious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_2_v2_g.flac | quest_case | Schedar | suspicious | Тут дело тёмное. Разберись, кто виноват, — а я уж решу, что с ним делать. |
| quest_case_3_v2_f_g.flac | quest_case | Aoede | irritated | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_case_3_v2_g.flac | quest_case | Schedar | irritated | Кто-то врёт, и я хочу знать кто. Поспрашивай, погляди. |
| quest_craft_0_v2_f_g.flac | quest_craft | Aoede | appraising | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_0_v2_g.flac | quest_craft | Schedar | appraising | Руки у тебя, говорят, умелые. Нужна работа. |
| quest_craft_1_v2_f_g.flac | quest_craft | Aoede | earnest | Сделай мне вещь — хорошую, на совесть. |
| quest_craft_1_v2_g.flac | quest_craft | Schedar | earnest | Сделай мне вещь — хорошую, на совесть. |
| quest_delivery_0_v2_f_g.flac | quest_delivery | Aoede | businesslike | Груз нужно доставить. Ждут его давно. |
| quest_delivery_0_v2_g.flac | quest_delivery | Schedar | businesslike | Груз нужно доставить. Ждут его давно. |
| quest_delivery_1_v2_f_g.flac | quest_delivery | Aoede | businesslike | Довези товар целым — там заплатят. |
| quest_delivery_1_v2_g.flac | quest_delivery | Schedar | businesslike | Довези товар целым — там заплатят. |
| quest_diplom_0_v2_f_g.flac | quest_diplom | Aoede | thoughtful | Тут словом надо, а не мечом. |
| quest_diplom_0_v2_g.flac | quest_diplom | Schedar | thoughtful | Тут словом надо, а не мечом. |
| quest_diplom_1_v2_f_g.flac | quest_diplom | Aoede | frustrated | Поговори с ними. Меня они слушать не станут. |
| quest_diplom_1_v2_g.flac | quest_diplom | Schedar | frustrated | Поговори с ними. Меня они слушать не станут. |
| quest_diplom_2_v2_f_g.flac | quest_diplom | Aoede | calm | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_2_v2_g.flac | quest_diplom | Schedar | calm | Нужно поговорить с соседями. Словом тут можно больше, чем мечом. |
| quest_diplom_3_v2_f_g.flac | quest_diplom | Aoede | earnest | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_diplom_3_v2_g.flac | quest_diplom | Schedar | earnest | Отнеси им моё слово. И постарайся, чтобы его услышали. |
| quest_done_0_v2_f_g.flac | quest_done | Aoede | delighted | Сделано? Вот это дело! Держи награду. |
| quest_done_0_v2_g.flac | quest_done | Schedar | delighted | Сделано? Вот это дело! Держи награду. |
| quest_done_1_v2_f_g.flac | quest_done | Aoede | grateful | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_1_v2_g.flac | quest_done | Schedar | grateful | Спасибо. Выручка твоя дорогого стоит. |
| quest_done_2_v2_f_g.flac | quest_done | Aoede | satisfied | Честно заработано. Держи. |
| quest_done_2_v2_g.flac | quest_done | Schedar | satisfied | Честно заработано. Держи. |
| quest_done_3_v2_f_g.flac | quest_done | Aoede | proud | Знала, что на тебя можно положиться. |
| quest_done_3_v2_g.flac | quest_done | Schedar | proud | Знал, что на тебя можно положиться. |
| quest_done_4_v2_f_g.flac | quest_done | Aoede | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_4_v2_g.flac | quest_done | Schedar | enthusiastic | Вот это работа! Приходи ещё. |
| quest_done_5_v2_f_g.flac | quest_done | Aoede | respectful | Слово своё держишь. Это ценю. |
| quest_done_5_v2_g.flac | quest_done | Schedar | respectful | Слово своё держишь. Это ценю. |
| quest_econ_0_v2_f_g.flac | quest_econ | Aoede | shrewd | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_0_v2_g.flac | quest_econ | Schedar | shrewd | Дело денежное. Добудь — и в накладе не останешься. |
| quest_econ_1_v2_f_g.flac | quest_econ | Aoede | brisk | Нужен товар. Много и быстро. |
| quest_econ_1_v2_g.flac | quest_econ | Schedar | brisk | Нужен товар. Много и быстро. |
| quest_econ_2_v2_f_g.flac | quest_econ | Aoede | shrewd | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_2_v2_g.flac | quest_econ | Schedar | shrewd | Цены скачут, товар пропадает. Помоги наладить дело — не пожалеешь. |
| quest_econ_3_v2_f_g.flac | quest_econ | Aoede | businesslike | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_econ_3_v2_g.flac | quest_econ | Schedar | businesslike | Торговля встала. Разберись, в чём загвоздка, и я заплачу. |
| quest_faction_0_v2_f_g.flac | quest_faction | Aoede | official | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_0_v2_g.flac | quest_faction | Schedar | official | Это поручение не от меня — от тех, кому я служу. |
| quest_faction_1_v2_f_g.flac | quest_faction | Aoede | dry | Служба есть служба. Задание такое. |
| quest_faction_1_v2_g.flac | quest_faction | Schedar | dry | Служба есть служба. Задание такое. |
| quest_faction_2_v2_f_g.flac | quest_faction | Aoede | earnest | Наши люди просят помощи. Сделаешь — станешь одной из нас. |
| quest_faction_2_v2_g.flac | quest_faction | Schedar | earnest | Наши люди просят помощи. Сделаешь — станешь одним из нас. |
| quest_faction_3_v2_f_g.flac | quest_faction | Aoede | solemn | Братство помнит тех, кто ему помог. Не подведи. |
| quest_faction_3_v2_g.flac | quest_faction | Schedar | solemn | Братство помнит тех, кто ему помог. Не подведи. |
| quest_faith_0_v2_f_g.flac | quest_faith | Aoede | reverent | Боги ждут знака. Исполни обет. |
| quest_faith_0_v2_g.flac | quest_faith | Schedar | reverent | Боги ждут знака. Исполни обет. |
| quest_faith_1_v2_f_g.flac | quest_faith | Aoede | serene | Святое дело. Не для корысти — для души. |
| quest_faith_1_v2_g.flac | quest_faith | Schedar | serene | Святое дело. Не для корысти — для души. |
| quest_fetch_derevo_0_v2_f_g.flac | quest_fetch_derevo | Aoede | practical | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_0_v2_g.flac | quest_fetch_derevo | Schedar | practical | Дров и бруса не хватает — зима близко. Принеси дерева, сколько сказал. |
| quest_fetch_derevo_1_v2_f_g.flac | quest_fetch_derevo | Aoede | businesslike | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_derevo_1_v2_g.flac | quest_fetch_derevo | Schedar | businesslike | Мне нужно хорошее дерево, сухое, без гнили. Найдёшь — заплачу честно. |
| quest_fetch_griby_0_v2_f_g.flac | quest_fetch_griby | Aoede | warning | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_0_v2_g.flac | quest_fetch_griby | Schedar | warning | Грибов принеси. Только не бледных — те не для еды. |
| quest_fetch_griby_1_v2_f_g.flac | quest_fetch_griby | Aoede | instructive | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_griby_1_v2_g.flac | quest_fetch_griby | Schedar | instructive | Нужны грибы для зелья. Ищи в сырых местах, у корней. |
| quest_fetch_kamen_0_v2_f_g.flac | quest_fetch_kamen | Aoede | tired | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_0_v2_g.flac | quest_fetch_kamen | Schedar | tired | Стена осыпается, камня нет. Принеси камня — поправим. |
| quest_fetch_kamen_1_v2_f_g.flac | quest_fetch_kamen | Aoede | firm | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_kamen_1_v2_g.flac | quest_fetch_kamen | Schedar | firm | Мне нужен камень, крепкий, без трещин. Остальное — моя забота. |
| quest_fetch_kost_0_v2_f_g.flac | quest_fetch_kost | Aoede | curt | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_0_v2_g.flac | quest_fetch_kost | Schedar | curt | Кости нужны. Не спрашивай зачем — просто принеси. |
| quest_fetch_kost_1_v2_f_g.flac | quest_fetch_kost | Aoede | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_fetch_kost_1_v2_g.flac | quest_fetch_kost | Schedar | businesslike | Принеси кости зверя, крепкие. Резчику работы на месяц. |
| quest_fetch_kristall_0_v2_f_g.flac | quest_fetch_kristall | Aoede | hushed | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_0_v2_g.flac | quest_fetch_kristall | Schedar | hushed | Кристаллы нужны для обряда. Найди их — только осторожно, они поют. |
| quest_fetch_kristall_1_v2_f_g.flac | quest_fetch_kristall | Aoede | precise | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_kristall_1_v2_g.flac | quest_fetch_kristall | Schedar | precise | Принеси кристаллов. Чистых, светлых. Мутные мне ни к чему. |
| quest_fetch_rakushka_0_v2_f_g.flac | quest_fetch_rakushka | Aoede | light | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_0_v2_g.flac | quest_fetch_rakushka | Schedar | light | Ракушек бы мне, перламутровых. На берегу их полно, если знать места. |
| quest_fetch_rakushka_1_v2_f_g.flac | quest_fetch_rakushka | Aoede | cheerful | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_rakushka_1_v2_g.flac | quest_fetch_rakushka | Schedar | cheerful | Собери ракушек. Из них у нас и пуговицы, и обереги. |
| quest_fetch_ruda_0_v2_f_g.flac | quest_fetch_ruda | Aoede | gruff | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_0_v2_g.flac | quest_fetch_ruda | Schedar | gruff | Горн стынет без руды. Добудь мне руды, и я в долгу не останусь. |
| quest_fetch_ruda_1_v2_f_g.flac | quest_fetch_ruda | Aoede | gruff | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_ruda_1_v2_g.flac | quest_fetch_ruda | Schedar | gruff | Руда нужна, да побольше. Кузня без неё — просто сарай. |
| quest_fetch_trava_0_v2_f_g.flac | quest_fetch_trava | Aoede | worried | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_0_v2_g.flac | quest_fetch_trava | Schedar | worried | Травы кончились, а люди болеют. Собери мне трав, прошу тебя. |
| quest_fetch_trava_1_v2_f_g.flac | quest_fetch_trava | Aoede | brisk | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_trava_1_v2_g.flac | quest_fetch_trava | Schedar | brisk | Нужны травы, свежие, не вялые. Где растут — я сказал. |
| quest_fetch_yagody_0_v2_f_g.flac | quest_fetch_yagody | Aoede | warm | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_0_v2_g.flac | quest_fetch_yagody | Schedar | warm | Ягод бы мне. Детям на зиму, да и на настойку хватит. |
| quest_fetch_yagody_1_v2_f_g.flac | quest_fetch_yagody | Aoede | fussy | Собери ягод, только спелых. Зелёные не возьму. |
| quest_fetch_yagody_1_v2_g.flac | quest_fetch_yagody | Schedar | fussy | Собери ягод, только спелых. Зелёные не возьму. |
| quest_full_0_v2_f_g.flac | quest_full | Aoede | amused | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_0_v2_g.flac | quest_full | Schedar | amused | Куда тебе ещё? У тебя и так десяток дел. |
| quest_full_1_v2_f_g.flac | quest_full | Aoede | firm | Сперва закончи начатое, потом приходи. |
| quest_full_1_v2_g.flac | quest_full | Schedar | firm | Сперва закончи начатое, потом приходи. |
| quest_full_2_v2_f_g.flac | quest_full | Aoede | dry | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_full_2_v2_g.flac | quest_full | Schedar | dry | Дел у тебя по горло. Разгрузись — тогда поговорим. |
| quest_full_3_v2_f_g.flac | quest_full | Aoede | sympathetic | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_3_v2_g.flac | quest_full | Schedar | sympathetic | У тебя и так дел по горло. Разгребись сначала. |
| quest_full_4_v2_f_g.flac | quest_full | Aoede | kind | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| quest_full_4_v2_g.flac | quest_full | Schedar | kind | Столько поручений разом никто не унесёт. Приходи, как освободишься. |
| quest_have_0_v2_f_g.flac | quest_have | Aoede | patient | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_0_v2_g.flac | quest_have | Schedar | patient | Моё дело уже у тебя. Сделай сначала его. |
| quest_have_1_v2_f_g.flac | quest_have | Aoede | mildly impatient | Моё поручение и так при тебе. |
| quest_have_1_v2_g.flac | quest_have | Schedar | mildly impatient | Моё поручение и так при тебе. |
| quest_have_2_v2_f_g.flac | quest_have | Aoede | patient | Ты уже взялась за моё дело. Сперва закончи его. |
| quest_have_2_v2_g.flac | quest_have | Schedar | patient | Ты уже взялся за моё дело. Сперва закончи его. |
| quest_have_3_v2_f_g.flac | quest_have | Aoede | impatient | Я жду. Дело-то моё ещё не сделано. |
| quest_have_3_v2_g.flac | quest_have | Schedar | impatient | Я жду. Дело-то моё ещё не сделано. |
| quest_have_4_v2_f_g.flac | quest_have | Aoede | wry | Не торопись с новым — старое ещё за тобой. |
| quest_have_4_v2_g.flac | quest_have | Schedar | wry | Не торопись с новым — старое ещё за тобой. |
| quest_hunt_0_v2_f_g.flac | quest_hunt | Aoede | grim | Тварь повадилась. Выследи её и убей. |
| quest_hunt_0_v2_g.flac | quest_hunt | Schedar | grim | Тварь повадилась. Выследи её и убей. |
| quest_hunt_1_v2_f_g.flac | quest_hunt | Aoede | concerned | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_1_v2_g.flac | quest_hunt | Schedar | concerned | Зверь опасный. Будь осторожен на охоте. |
| quest_hunt_2_v2_f_g.flac | quest_hunt | Aoede | cold | Принеси мне весть, что она мертва. |
| quest_hunt_2_v2_g.flac | quest_hunt | Schedar | cold | Принеси мне весть, что она мертва. |
| quest_kill_sever_0_v2_f_g.flac | quest_kill_sever | Aoede | grim | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_0_v2_g.flac | quest_kill_sever | Schedar | grim | На севере твари расплодились, житья не дают. Иди туда и перебей их. |
| quest_kill_sever_1_v2_f_g.flac | quest_kill_sever | Aoede | angry | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_sever_1_v2_g.flac | quest_kill_sever | Schedar | angry | Ступай на север. Там зверьё совсем обнаглело — проучи его. |
| quest_kill_vostok_0_v2_f_g.flac | quest_kill_vostok | Aoede | urgent | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_0_v2_g.flac | quest_kill_vostok | Schedar | urgent | С востока лезут твари. Иди на восток и перебей их, пока не дошли до нас. |
| quest_kill_vostok_1_v2_f_g.flac | quest_kill_vostok | Aoede | earnest | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_kill_vostok_1_v2_g.flac | quest_kill_vostok | Schedar | earnest | Ступай на восток. Люди туда ходить боятся — сделай так, чтобы перестали. |
| quest_kill_yug_0_v2_f_g.flac | quest_kill_yug | Aoede | worried | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_0_v2_g.flac | quest_kill_yug | Schedar | worried | С юга приходят твари, режут скот. Иди на юг и очисти округу. |
| quest_kill_yug_1_v2_f_g.flac | quest_kill_yug | Aoede | businesslike | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_yug_1_v2_g.flac | quest_kill_yug | Schedar | businesslike | Ступай на юг. Сколько тварей там положишь — столько и заплачу. |
| quest_kill_zapad_0_v2_f_g.flac | quest_kill_zapad | Aoede | stern | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_0_v2_g.flac | quest_kill_zapad | Schedar | stern | На западе завелась нечисть. Иди туда и не возвращайся, пока не очистишь. |
| quest_kill_zapad_1_v2_f_g.flac | quest_kill_zapad | Aoede | uneasy | Ступай на запад. Там по ночам воют — разберись. |
| quest_kill_zapad_1_v2_g.flac | quest_kill_zapad | Schedar | uneasy | Ступай на запад. Там по ночам воют — разберись. |
| quest_magic_0_v2_f_g.flac | quest_magic | Aoede | uneasy | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_0_v2_g.flac | quest_magic | Schedar | uneasy | Тут чары замешаны. Без знающего не справиться. |
| quest_magic_1_v2_f_g.flac | quest_magic | Aoede | tense | Сила неспокойна. Нужно её унять. |
| quest_magic_1_v2_g.flac | quest_magic | Schedar | tense | Сила неспокойна. Нужно её унять. |
| quest_magic_2_v2_f_g.flac | quest_magic | Aoede | mysterious | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_2_v2_g.flac | quest_magic | Schedar | mysterious | Эфир там неспокоен. Узнай почему — и не трогай руками, что светится. |
| quest_magic_3_v2_f_g.flac | quest_magic | Aoede | appraising | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_magic_3_v2_g.flac | quest_magic | Schedar | appraising | Мне нужен кто-то, кто не боится чар. Похоже, это ты. |
| quest_random_0_v2_f_g.flac | quest_random | Aoede | casual | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_0_v2_g.flac | quest_random | Schedar | casual | Подвернулось тут одно дело. Возьмёшься? |
| quest_random_1_v2_f_g.flac | quest_random | Aoede | puzzled | Странное дело, но заплачу честно. |
| quest_random_1_v2_g.flac | quest_random | Schedar | puzzled | Странное дело, но заплачу честно. |
| quest_random_2_v2_f_g.flac | quest_random | Aoede | casual | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_2_v2_g.flac | quest_random | Schedar | casual | Дело так себе, но платят исправно. Возьмёшься? |
| quest_random_3_v2_f_g.flac | quest_random | Aoede | plain | Работа есть, работа простая. Главное — сделать. |
| quest_random_3_v2_g.flac | quest_random | Schedar | plain | Работа есть, работа простая. Главное — сделать. |
| quest_rescue_0_v2_f_g.flac | quest_rescue | Aoede | anxious | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_0_v2_g.flac | quest_rescue | Schedar | anxious | Человек пропал. Найди его, пока не поздно. |
| quest_rescue_1_v2_f_g.flac | quest_rescue | Aoede | desperate | Вытащи его живым. Прошу тебя. |
| quest_rescue_1_v2_g.flac | quest_rescue | Schedar | desperate | Вытащи его живым. Прошу тебя. |
| quest_rescue_3_v2_f_g.flac | quest_rescue | Aoede | pleading | Там наши, в беде. Выручи их — больше некому. |
| quest_rescue_3_v2_g.flac | quest_rescue | Schedar | pleading | Там наши, в беде. Выручи их — больше некому. |
| quest_secret_0_v2_f_g.flac | quest_secret | Aoede | whisper | Только тихо. Об этом — никому. |
| quest_secret_0_v2_g.flac | quest_secret | Schedar | whisper | Только тихо. Об этом — никому. |
| quest_secret_1_v2_f_g.flac | quest_secret | Aoede | hushed | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_secret_1_v2_g.flac | quest_secret | Schedar | hushed | Дело тайное. Если спросят — ты ничего не знаешь. |
| quest_secret_2_v2_f_g.flac | quest_secret | Aoede | whisper | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_2_v2_g.flac | quest_secret | Schedar | whisper | Дело тихое. Сделаешь — забудь, что я тебя просил. |
| quest_secret_3_v2_f_g.flac | quest_secret | Aoede | hushed | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_secret_3_v2_g.flac | quest_secret | Schedar | hushed | Об этом никто не должен знать. Ни стража, ни соседи. |
| quest_story_0_v2_f_g.flac | quest_story | Aoede | grave | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_0_v2_g.flac | quest_story | Schedar | grave | Это только начало. Дело большое, слушай с самого начала. |
| quest_story_1_v2_f_g.flac | quest_story | Aoede | serious | От этого многое зависит. Не подведи. |
| quest_story_1_v2_g.flac | quest_story | Schedar | serious | От этого многое зависит. Не подведи. |
| quest_story_2_v2_f_g.flac | quest_story | Aoede | grave | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_2_v2_g.flac | quest_story | Schedar | grave | Это дело больше, чем кажется. С него всё только начинается. |
| quest_story_3_v2_f_g.flac | quest_story | Aoede | serious | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_story_3_v2_g.flac | quest_story | Schedar | serious | Слушай внимательно. От этого зависит больше, чем ты думаешь. |
| quest_study_0_v2_f_g.flac | quest_study | Aoede | curious | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_0_v2_g.flac | quest_study | Schedar | curious | Мне нужно знать. Разузнай, прочти, дойди. |
| quest_study_1_v2_f_g.flac | quest_study | Aoede | curious | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_study_1_v2_g.flac | quest_study | Schedar | curious | Сходи и посмотри своими глазами. Потом расскажешь. |
| quest_study_2_v2_f_g.flac | quest_study | Aoede | scholarly | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_2_v2_g.flac | quest_study | Schedar | scholarly | Мне нужны сведения. Разузнай всё, что сможешь, и запиши. |
| quest_study_3_v2_f_g.flac | quest_study | Aoede | thoughtful | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_study_3_v2_g.flac | quest_study | Schedar | thoughtful | Изучи это место. Каждая мелочь может оказаться важной. |
| quest_take_0_v2_f_g.flac | quest_take | Aoede | serious | Есть для тебя дело. Слушай внимательно. |
| quest_take_0_v2_g.flac | quest_take | Schedar | serious | Есть для тебя дело. Слушай внимательно. |
| quest_take_1_v2_f_g.flac | quest_take | Aoede | earnest | Выручишь — не забуду. Вот что нужно. |
| quest_take_1_v2_g.flac | quest_take | Schedar | earnest | Выручишь — не забуду. Вот что нужно. |
| quest_take_2_v2_f_g.flac | quest_take | Aoede | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_2_v2_g.flac | quest_take | Schedar | businesslike | Работа есть, плата будет. Слушай. |
| quest_take_3_v2_f_g.flac | quest_take | Aoede | earnest | Мне нужна помощь. Вот в чём дело. |
| quest_take_3_v2_g.flac | quest_take | Schedar | earnest | Мне нужна помощь. Вот в чём дело. |
| quest_type_craft_0_v2_f_g.flac | quest_type_craft | Aoede | businesslike | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_0_v2_g.flac | quest_type_craft | Schedar | businesslike | Мне нужна работа мастера. Сделай, как умеешь, а я оценю. |
| quest_type_craft_1_v2_f_g.flac | quest_type_craft | Aoede | friendly | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_1_v2_g.flac | quest_type_craft | Schedar | friendly | Руки у тебя, вижу, откуда надо растут. Выручи — сработай мне вещь. |
| quest_type_craft_2_v2_f_g.flac | quest_type_craft | Aoede | hurried | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_craft_2_v2_g.flac | quest_type_craft | Schedar | hurried | Заказ срочный. Сделаешь быстро — заплачу сверху. |
| quest_type_delivery_0_v2_f_g.flac | quest_type_delivery | Aoede | businesslike | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_0_v2_g.flac | quest_type_delivery | Schedar | businesslike | Довези груз в целости. Там за него дадут втрое больше, чем здесь. |
| quest_type_delivery_1_v2_f_g.flac | quest_type_delivery | Aoede | shrewd | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_1_v2_g.flac | quest_type_delivery | Schedar | shrewd | Отвезёшь товар — получишь долю. Только в дороге не зевай. |
| quest_type_delivery_2_v2_f_g.flac | quest_type_delivery | Aoede | earnest | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_type_delivery_2_v2_g.flac | quest_type_delivery | Schedar | earnest | Груз ценный, путь неблизкий. Доставишь — будем друзьями. |
| quest_type_fetch_0_v2_f_g.flac | quest_type_fetch | Aoede | businesslike | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_0_v2_g.flac | quest_type_fetch | Schedar | businesslike | Принеси, что прошу. Сколько сказано — столько и неси. |
| quest_type_fetch_1_v2_f_g.flac | quest_type_fetch | Aoede | worried | Запасы кончаются. Добудь, будь другом. |
| quest_type_fetch_1_v2_g.flac | quest_type_fetch | Schedar | worried | Запасы кончаются. Добудь, будь другом. |
| quest_type_god_altar_0_v2_f_g.flac | quest_type_god_altar | Aoede | reverent | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_0_v2_g.flac | quest_type_god_altar | Schedar | reverent | Алтарь заброшен, и бог недоволен. Сходи, поклонись и принеси дар. |
| quest_type_god_altar_1_v2_f_g.flac | quest_type_god_altar | Aoede | solemn | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_1_v2_g.flac | quest_type_god_altar | Schedar | solemn | Боги ждут. Дойди до алтаря и соверши обряд, как положено. |
| quest_type_god_altar_2_v2_f_g.flac | quest_type_god_altar | Aoede | quiet | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_altar_2_v2_g.flac | quest_type_god_altar | Schedar | quiet | У старого алтаря давно не горел огонь. Зажги его снова. |
| quest_type_god_relic_0_v2_f_g.flac | quest_type_god_relic | Aoede | urgent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_0_v2_g.flac | quest_type_god_relic | Schedar | urgent | Святыня пропала. Найди её и верни в храм — боги отблагодарят. |
| quest_type_god_relic_1_v2_f_g.flac | quest_type_god_relic | Aoede | pained | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_1_v2_g.flac | quest_type_god_relic | Schedar | pained | Реликвию унесли недостойные руки. Верни её, прошу тебя. |
| quest_type_god_relic_2_v2_f_g.flac | quest_type_god_relic | Aoede | solemn | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_god_relic_2_v2_g.flac | quest_type_god_relic | Schedar | solemn | Без святыни храм пустеет. Найди её, где бы она ни была. |
| quest_type_hoard_0_v2_f_g.flac | quest_type_hoard | Aoede | sly | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_0_v2_g.flac | quest_type_hoard | Schedar | sly | Говорят, там клад лежит. Найдёшь — поделим по-честному. |
| quest_type_hoard_1_v2_f_g.flac | quest_type_hoard | Aoede | hushed | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_1_v2_g.flac | quest_type_hoard | Schedar | hushed | Старый тайник где-то рядом. Раскопай его, а я скажу, что с ним делать. |
| quest_type_hoard_2_v2_f_g.flac | quest_type_hoard | Aoede | whisper | Там припрятано добро. Только никому ни слова, поняла? |
| quest_type_hoard_2_v2_g.flac | quest_type_hoard | Schedar | whisper | Там припрятано добро. Только никому ни слова, понял? |
| quest_type_hunt_0_v2_f_g.flac | quest_type_hunt | Aoede | serious | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_0_v2_g.flac | quest_type_hunt | Schedar | serious | Есть одна тварь, особая. Обычного зверя не надо — мне нужна именно она. |
| quest_type_hunt_1_v2_f_g.flac | quest_type_hunt | Aoede | stern | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_1_v2_g.flac | quest_type_hunt | Schedar | stern | Выследи ту тварь, о которой я говорю. Остальных не трогай — зря потратишь силы. |
| quest_type_hunt_2_v2_f_g.flac | quest_type_hunt | Aoede | grim | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_2_v2_g.flac | quest_type_hunt | Schedar | grim | Эта тварь уже троих задрала. Найди её. Только её. |
| quest_type_hunt_3_v2_f_g.flac | quest_type_hunt | Aoede | warning | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_hunt_3_v2_g.flac | quest_type_hunt | Schedar | warning | Охота не простая: зверь хитрый и следы путает. Не упусти. |
| quest_type_kill_0_v2_f_g.flac | quest_type_kill | Aoede | grim | Округу заполонили твари. Очисти её. |
| quest_type_kill_0_v2_g.flac | quest_type_kill | Schedar | grim | Округу заполонили твари. Очисти её. |
| quest_type_trapwork_0_v2_f_g.flac | quest_type_trapwork | Aoede | worried | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_0_v2_g.flac | quest_type_trapwork | Schedar | worried | Там ловушки стоят, старые. Обезвредь их, пока кто-нибудь не покалечился. |
| quest_type_trapwork_1_v2_f_g.flac | quest_type_trapwork | Aoede | warning | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_1_v2_g.flac | quest_type_trapwork | Schedar | warning | Кто-то наставил капканов на тропе. Разберись с ними — только осторожно. |
| quest_type_trapwork_2_v2_f_g.flac | quest_type_trapwork | Aoede | practical | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_trapwork_2_v2_g.flac | quest_type_trapwork | Schedar | practical | Проверь ловушки. Какие сломаны — почини, какие чужие — сними. |
| quest_type_visit_0_v2_f_g.flac | quest_type_visit | Aoede | uneasy | Сходи туда и погляди, что там творится. |
| quest_type_visit_0_v2_g.flac | quest_type_visit | Schedar | uneasy | Сходи туда и погляди, что там творится. |
| quest_type_visit_1_v2_f_g.flac | quest_type_visit | Aoede | worried | Там неладно. Проверь и возвращайся. |
| quest_type_visit_1_v2_g.flac | quest_type_visit | Schedar | worried | Там неладно. Проверь и возвращайся. |
| quest_type_visit_2_v2_f_g.flac | quest_type_visit | Aoede | curious | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_2_v2_g.flac | quest_type_visit | Schedar | curious | Сходи туда и посмотри своими глазами. Потом расскажешь мне, что видел. |
| quest_type_visit_3_v2_f_g.flac | quest_type_visit | Aoede | anxious | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_3_v2_g.flac | quest_type_visit | Schedar | anxious | Мне нужно знать, что там творится. Дойди до места — и назад. |
| quest_type_visit_4_v2_f_g.flac | quest_type_visit | Aoede | worried | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_4_v2_g.flac | quest_type_visit | Schedar | worried | Туда давно никто не ходил. Проверь, цело ли всё, и возвращайся. |
| quest_type_visit_5_v2_f_g.flac | quest_type_visit | Aoede | mysterious | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_type_visit_5_v2_g.flac | quest_type_visit | Schedar | mysterious | Дойди до отметки, что я назвал. Там кое-что есть — поймёшь, когда увидишь. |
| quest_war_0_v2_f_g.flac | quest_war | Aoede | urgent | Война не ждёт. Нужны люди и припасы. |
| quest_war_0_v2_g.flac | quest_war | Schedar | urgent | Война не ждёт. Нужны люди и припасы. |
| quest_war_1_v2_f_g.flac | quest_war | Aoede | tense | Фронт близко. Помоги, чем сможешь. |
| quest_war_1_v2_g.flac | quest_war | Schedar | tense | Фронт близко. Помоги, чем сможешь. |
| quest_war_2_v2_f_g.flac | quest_war | Aoede | urgent | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_2_v2_g.flac | quest_war | Schedar | urgent | Война у ворот. Нам нужен каждый клинок — встань за нас. |
| quest_war_3_v2_f_g.flac | quest_war | Aoede | commanding | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_3_v2_g.flac | quest_war | Schedar | commanding | Враг наступает. Выполни приказ — и держава тебя не забудет. |
| quest_war_4_v2_f_g.flac | quest_war | Aoede | grim | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| quest_war_4_v2_g.flac | quest_war | Schedar | grim | На фронте тяжело. Помоги нашим, и получишь по заслугам. |
| trade_buy_0_v2_f_g.flac | trade_buy | Aoede | warm | Хороший выбор. Носи на здоровье. |
| trade_buy_0_v2_g.flac | trade_buy | Schedar | warm | Хороший выбор. Носи на здоровье. |
| trade_buy_10_v2_f_g.flac | trade_buy | Aoede | grateful | Спасибо за золото. Удачи в дороге. |
| trade_buy_10_v2_g.flac | trade_buy | Schedar | grateful | Спасибо за золото. Удачи в дороге. |
| trade_buy_11_v2_f_g.flac | trade_buy | Aoede | lively | Сделка! Смотри не потеряй. |
| trade_buy_11_v2_g.flac | trade_buy | Schedar | lively | Сделка! Смотри не потеряй. |
| trade_buy_1_v2_f_g.flac | trade_buy | Aoede | confident | Держи. Сносу не будет. |
| trade_buy_1_v2_g.flac | trade_buy | Schedar | confident | Держи. Сносу не будет. |
| trade_buy_2_v2_f_g.flac | trade_buy | Aoede | cheerful | По рукам! Приятно иметь дело. |
| trade_buy_2_v2_g.flac | trade_buy | Schedar | cheerful | По рукам! Приятно иметь дело. |
| trade_buy_3_v2_f_g.flac | trade_buy | Aoede | friendly | Бери, бери. Не пожалеешь. |
| trade_buy_3_v2_g.flac | trade_buy | Schedar | friendly | Бери, бери. Не пожалеешь. |
| trade_buy_4_v2_f_g.flac | trade_buy | Aoede | businesslike | С тебя золото — с меня товар. Честно. |
| trade_buy_4_v2_g.flac | trade_buy | Schedar | businesslike | С тебя золото — с меня товар. Честно. |
| trade_buy_5_v2_f_g.flac | trade_buy | Aoede | pleased | Вот и славно. Заходи ещё. |
| trade_buy_5_v2_g.flac | trade_buy | Schedar | pleased | Вот и славно. Заходи ещё. |
| trade_buy_6_v2_f_g.flac | trade_buy | Aoede | proud | Твоё. Береги, второго такого нет. |
| trade_buy_6_v2_g.flac | trade_buy | Schedar | proud | Твоё. Береги, второго такого нет. |
| trade_buy_7_v2_f_g.flac | trade_buy | Aoede | cheerful | Взято! Пусть служит верно. |
| trade_buy_7_v2_g.flac | trade_buy | Schedar | cheerful | Взято! Пусть служит верно. |
| trade_buy_8_v2_f_g.flac | trade_buy | Aoede | approving | Отличная покупка. Я бы и сама взяла. |
| trade_buy_8_v2_g.flac | trade_buy | Schedar | approving | Отличная покупка. Я бы и сам взял. |
| trade_buy_9_v2_f_g.flac | trade_buy | Aoede | confidential | Забирай. Цену сбавила только для тебя. |
| trade_buy_9_v2_g.flac | trade_buy | Schedar | confidential | Забирай. Цену сбавил только для тебя. |
| trade_buy_big_0_v2_f_g.flac | trade_buy_big | Aoede | delighted | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_0_v2_g.flac | trade_buy_big | Schedar | delighted | Ого, сколько! Сегодня у меня праздник. |
| trade_buy_big_1_v2_f_g.flac | trade_buy_big | Aoede | excited | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_1_v2_g.flac | trade_buy_big | Schedar | excited | Вот это покупатель! Всё завернём в лучшем виде. |
| trade_buy_big_2_v2_f_g.flac | trade_buy_big | Aoede | grateful | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_2_v2_g.flac | trade_buy_big | Schedar | grateful | Щедро! За такое — скидка в следующий раз. |
| trade_buy_big_3_v2_f_g.flac | trade_buy_big | Aoede | amazed | Полприлавка разом! Вот это размах. |
| trade_buy_big_3_v2_g.flac | trade_buy_big | Schedar | amazed | Полприлавка разом! Вот это размах. |
| trade_buy_big_4_v2_f_g.flac | trade_buy_big | Aoede | happy | С таким покупателем и год не страшен. |
| trade_buy_big_4_v2_g.flac | trade_buy_big | Schedar | happy | С таким покупателем и год не страшен. |
| trade_bye_0_v2_f_g.flac | trade_bye | Aoede | warm | Заходи ещё, всегда рада. |
| trade_bye_0_v2_g.flac | trade_bye | Schedar | warm | Заходи ещё, всегда рад. |
| trade_bye_1_v2_f_g.flac | trade_bye | Aoede | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_1_v2_g.flac | trade_bye | Schedar | friendly | Доброй дороги. Возвращайся за новым. |
| trade_bye_2_v2_f_g.flac | trade_bye | Aoede | grateful | Спасибо за торг. Не забывай меня. |
| trade_bye_2_v2_g.flac | trade_bye | Schedar | grateful | Спасибо за торг. Не забывай меня. |
| trade_bye_3_v2_f_g.flac | trade_bye | Aoede | cheerful | Удачи! И помни, где лучшие цены. |
| trade_bye_3_v2_g.flac | trade_bye | Schedar | cheerful | Удачи! И помни, где лучшие цены. |
| trade_bye_4_v2_f_g.flac | trade_bye | Aoede | friendly | Будешь рядом — загляни. |
| trade_bye_4_v2_g.flac | trade_bye | Schedar | friendly | Будешь рядом — загляни. |
| trade_bye_5_v2_f_g.flac | trade_bye | Aoede | polite | Приятно было иметь дело. |
| trade_bye_5_v2_g.flac | trade_bye | Schedar | polite | Приятно было иметь дело. |
| trade_poor_0_v2_f_g.flac | trade_poor | Aoede | dry | Золота маловато. Доложишь — отдам. |
| trade_poor_0_v2_g.flac | trade_poor | Schedar | dry | Золота маловато. Доложишь — отдам. |
| trade_poor_1_v2_f_g.flac | trade_poor | Aoede | firm | Не хватает монет. Без денег не отдаю. |
| trade_poor_1_v2_g.flac | trade_poor | Schedar | firm | Не хватает монет. Без денег не отдаю. |
| trade_poor_2_v2_f_g.flac | trade_poor | Aoede | sympathetic | Эх, на это кошель тонковат. |
| trade_poor_2_v2_g.flac | trade_poor | Schedar | sympathetic | Эх, на это кошель тонковат. |
| trade_poor_3_v2_f_g.flac | trade_poor | Aoede | firm | В долг не торгую, не проси. |
| trade_poor_3_v2_g.flac | trade_poor | Schedar | firm | В долг не торгую, не проси. |
| trade_poor_4_v2_f_g.flac | trade_poor | Aoede | kindly | Подкопи ещё немного и возвращайся. |
| trade_poor_4_v2_g.flac | trade_poor | Schedar | kindly | Подкопи ещё немного и возвращайся. |
| trade_poor_5_v2_f_g.flac | trade_poor | Aoede | wry | Даром только ветер в поле. |
| trade_poor_5_v2_g.flac | trade_poor | Schedar | wry | Даром только ветер в поле. |
| trade_refuse_0_v2_f_g.flac | trade_refuse | Aoede | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_0_v2_g.flac | trade_refuse | Schedar | dismissive | Это мне не нужно. Неси кому другому. |
| trade_refuse_1_v2_f_g.flac | trade_refuse | Aoede | firm | Нет, такое не беру. |
| trade_refuse_1_v2_g.flac | trade_refuse | Schedar | firm | Нет, такое не беру. |
| trade_refuse_2_v2_f_g.flac | trade_refuse | Aoede | dismissive | Такого у меня и так полон склад. |
| trade_refuse_2_v2_g.flac | trade_refuse | Schedar | dismissive | Такого у меня и так полон склад. |
| trade_refuse_3_v2_f_g.flac | trade_refuse | Aoede | neutral | Не мой товар. Попробуй у соседа. |
| trade_refuse_3_v2_g.flac | trade_refuse | Schedar | neutral | Не мой товар. Попробуй у соседа. |
| trade_regular_0_v2_f_g.flac | trade_regular | Aoede | courteous | Для постоянного покупателя — с поклоном. |
| trade_regular_0_v2_g.flac | trade_regular | Schedar | courteous | Для постоянного покупателя — с поклоном. |
| trade_regular_1_v2_f_g.flac | trade_regular | Aoede | warm | Постоянным — от души. Приходи снова. |
| trade_regular_1_v2_g.flac | trade_regular | Schedar | warm | Постоянным — от души. Приходи снова. |
| trade_regular_2_v2_f_g.flac | trade_regular | Aoede | playful | Ещё немного — и я тебе медаль вручу. |
| trade_regular_2_v2_g.flac | trade_regular | Schedar | playful | Ещё немного — и я тебе медаль вручу. |
| trade_regular_3_v2_f_g.flac | trade_regular | Aoede | amused | Я твои покупки уже на память знаю. |
| trade_regular_3_v2_g.flac | trade_regular | Schedar | amused | Я твои покупки уже на память знаю. |
| trade_regular_4_v2_f_g.flac | trade_regular | Aoede | grateful | Вот кто меня кормит! Спасибо. |
| trade_regular_4_v2_g.flac | trade_regular | Schedar | grateful | Вот кто меня кормит! Спасибо. |
| trade_sell_0_v2_f_g.flac | trade_sell | Aoede | businesslike | Возьму. Цена честная, не спорь. |
| trade_sell_0_v2_g.flac | trade_sell | Schedar | businesslike | Возьму. Цена честная, не спорь. |
| trade_sell_10_v2_f_g.flac | trade_sell | Aoede | curt | Это пойдёт. Вот плата. |
| trade_sell_10_v2_g.flac | trade_sell | Schedar | curt | Это пойдёт. Вот плата. |
| trade_sell_11_v2_f_g.flac | trade_sell | Aoede | pleased | Как раз этого и не хватало. Беру. |
| trade_sell_11_v2_g.flac | trade_sell | Schedar | pleased | Как раз этого и не хватало. Беру. |
| trade_sell_1_v2_f_g.flac | trade_sell | Aoede | appraising | Неплохая вещица. Держи золото. |
| trade_sell_1_v2_g.flac | trade_sell | Schedar | appraising | Неплохая вещица. Держи золото. |
| trade_sell_2_v2_f_g.flac | trade_sell | Aoede | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_2_v2_g.flac | trade_sell | Schedar | businesslike | Беру. Такое всегда найдёт покупателя. |
| trade_sell_3_v2_f_g.flac | trade_sell | Aoede | appraising | Хм, сойдёт. Вот твои монеты. |
| trade_sell_3_v2_g.flac | trade_sell | Schedar | appraising | Хм, сойдёт. Вот твои монеты. |
| trade_sell_4_v2_f_g.flac | trade_sell | Aoede | eager | По рукам. Ещё что-нибудь есть? |
| trade_sell_4_v2_g.flac | trade_sell | Schedar | eager | По рукам. Ещё что-нибудь есть? |
| trade_sell_5_v2_f_g.flac | trade_sell | Aoede | approving | Товар годный. Приноси ещё. |
| trade_sell_5_v2_g.flac | trade_sell | Schedar | approving | Товар годный. Приноси ещё. |
| trade_sell_6_v2_f_g.flac | trade_sell | Aoede | wry | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_6_v2_g.flac | trade_sell | Schedar | wry | Ладно, беру. Хоть и переплачиваю. |
| trade_sell_7_v2_f_g.flac | trade_sell | Aoede | dry | Держи золото. Считай, повезло тебе. |
| trade_sell_7_v2_g.flac | trade_sell | Schedar | dry | Держи золото. Считай, повезло тебе. |
| trade_sell_8_v2_f_g.flac | trade_sell | Aoede | playful | Добро пожаловать на мой склад, вещица! |
| trade_sell_8_v2_g.flac | trade_sell | Schedar | playful | Добро пожаловать на мой склад, вещица! |
| trade_sell_9_v2_f_g.flac | trade_sell | Aoede | sly | Возьму, если больше торговаться не станешь. |
| trade_sell_9_v2_g.flac | trade_sell | Schedar | sly | Возьму, если больше торговаться не станешь. |
| trade_sell_big_0_v2_f_g.flac | trade_sell_big | Aoede | amazed | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_0_v2_g.flac | trade_sell_big | Schedar | amazed | Целый мешок! Ну, считай, разбогатеешь. |
| trade_sell_big_1_v2_f_g.flac | trade_sell_big | Aoede | wry | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_1_v2_g.flac | trade_sell_big | Schedar | wry | Всё беру. Кошель мой худеет на глазах. |
| trade_sell_big_2_v2_f_g.flac | trade_sell_big | Aoede | surprised | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_2_v2_g.flac | trade_sell_big | Schedar | surprised | Столько добра разом? Ладно, по рукам. |
| trade_sell_big_3_v2_f_g.flac | trade_sell_big | Aoede | mock complaining | Ты меня разоришь, но товар хорош. |
| trade_sell_big_3_v2_g.flac | trade_sell_big | Schedar | mock complaining | Ты меня разоришь, но товар хорош. |
| trade_sell_big_4_v2_f_g.flac | trade_sell_big | Aoede | wry | Опустошаешь мне кассу. Но беру всё. |
| trade_sell_big_4_v2_g.flac | trade_sell_big | Schedar | wry | Опустошаешь мне кассу. Но беру всё. |
| r6_15_g.flac | dlg | Umbriel | grateful | Умеете вы сказать. Ладно, уступлю. |
| r6_15_v1_f_g.flac | dlg | Leda | grateful | Умеете вы сказать. Ладно, уступлю. |
