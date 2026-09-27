# sounds/voice_npc — жители говорят сами

Приветствие жителя у прилавка, его ответ в разговоре и то, что на ходу
бросают стражник, латник, солдат гарнизона, горожанин и житель посада. Прежде эти строки читал голос
игры в кавычках; теперь у каждой своя запись и своя интонация.

Записей: 1130

Речь синтезирована 27 сентября 2026 года нейроголосами **Gemini** (Google),
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
| Alnilam | твёрдый | стражник на обходе и ночной дозор | 29 |
| Charon | низкий, ровный | латник смены и солдат гарнизона за Гранью | 12 |
| Achird | дружелюбный | горожанин и житель посада | 30 |
| Sulafat | тёплый | горожанка и жительница посада | 30 |
| Umbriel | лёгкий, разговорный | приветствие и ответ в разговоре жителя, мужской голос | 514 |
| Despina | мягкий | приветствие и ответ в разговоре жительницы, женский голос | 514 |
| Algieba | ровный, уверенный | голос героя: ход «Спросить об истории» (остальные двадцать один — в sounds/voice) | 1 |

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
- **Женский род.** Женский голос говорит о себе в женском роде («Рада тебя
  видеть», «Я вас не видела»): в описи ниже — то, что произнесено; в игре
  строка ищется по исходному тексту. Обращённое к герою («пока цел») не менялось.
- **Пакетами.** В одном запросе два голоса и до семидесяти четырёх строк; всё —
  18 пакетов и переозвучки неудачных дублей.
- **Разрезка и разборчивость.** Запись пакета дробится по паузам и склеивается
  в строки по распознанному тексту; каждую строку распознаёт русская модель
  GigaAM (sherpa-onnx, `nemo-ctc-giga-am-v2-russian`): не больше 15 % ошибочных
  букв и не медленнее шести знаков в секунду.
- **Громкость.** −18 LUFS по EBU R128 (у записей от -18.8 до -17.6),
  пики не выше -1.0 дБ; моно 44,1 кГц, MP3 320 кбит/с.

## Все записи

| Файл | Кто | Голос | Интонация | Текст |
|---|---|---|---|---|
| street_guard_0_g.mp3 | стражник | Alnilam | watchful, gruff warning | Ходи да оглядывайся. |
| street_guard_1_g.mp3 | стражник | Alnilam | proud, dutiful | Порядок на улицах — моя забота. |
| street_guard_2_g.mp3 | стражник | Alnilam | serious, caring advice | Ночью держись освещённых улиц. |
| street_guard_3_g.mp3 | стражник | Alnilam | impatient, brusque | Проходи, не задерживайся у ворот. |
| street_guard_4_g.mp3 | стражник | Alnilam | alert, a little worried | Слышал шум у дальнего квартала? Проверю. |
| street_guard_5_g.mp3 | стражник | Alnilam | dry, stern warning | Оружие в ножнах держи — целее будешь. |
| street_guard_6_g.mp3 | стражник | Alnilam | helpful, lowered voice, warning | Карманники нынче у рынка. Кошель к поясу. |
| street_guard_7_g.mp3 | стражник | Alnilam | dry, matter-of-fact | Драк не затевать. Остальное — твоё дело. |
| street_guard_8_g.mp3 | стражник | Alnilam | businesslike, stern | Видел что подозрительное — скажи. |
| street_guard_9_g.mp3 | стражник | Alnilam | tired, sighing | Смена кончается, а ночь только начинается. |
| street_guard_10_g.mp3 | стражник | Alnilam | strict, official | Кто без огня после заката — того спрашиваем. |
| street_guard_11_g.mp3 | стражник | Alnilam | firm reminder | Ворота на ночь запираем. Не опоздай. |
| street_guard_12_g.mp3 | стражник | Alnilam | loud, commanding the crowd | Не толпиться! Проходим по одному. |
| street_guard_13_g.mp3 | стражник | Alnilam | dry, sardonic | Жалобы — к сотнику. А лучше без жалоб. |
| street_guard_14_g.mp3 | стражник | Alnilam | annoyed, grumbling | Опять телега на мостовой. Чья, не знаешь? |
| street_guard_15_g.mp3 | стражник | Alnilam | dry humour, suspicious | Спокойно у нас. Пока ты тут не появился. |
| street_guard_16_g.mp3 | стражник | Alnilam | gruff, decisive | Пьяных — в холодную до утра. Всех. |
| street_guard_17_g.mp3 | стражник | Alnilam | concerned, lowered voice | Слыхал, за стеной волков видели. Держись дорог. |
| street_guardcold_0_g.mp3 | стражник недругу | Alnilam | cold, suspicious, threatening | Я тебя запомнил. Веди себя тихо. |
| street_guardcold_1_g.mp3 | стражник недругу | Alnilam | cold, suspicious, threatening | Глаз с тебя не спущу. |
| street_guardcold_2_g.mp3 | стражник недругу | Alnilam | cold, suspicious, threatening | Ещё раз увижу — спрошу по-другому. |
| street_guardfriend_0_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | Рад тебя видеть, друг. |
| street_guardfriend_1_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | Для тебя — всегда время. |
| street_guardfriend_2_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | А вот и ты! Заходи. |
| street_guardfriend_3_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | Своих не забываем. Садись. |
| street_guardfriend_4_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | О, наш человек! Что нового? |
| street_guardfriend_5_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | Для тебя отложил кое-что. Смотри. |
| street_guardfriend_6_g.mp3 | стражник своему | Alnilam | warm, friendly, relaxed | Доброго дня. Если что — зовите. |
| street_night_0_g.mp3 | ночной дозор | Alnilam | stern, wary, calling out at night | Поздно бродишь. Назови себя или ступай своей дорогой. |
| street_darkguard_0_g.mp3 | латник смены | Charon | cold, flat, commanding | Имя. Смену назови. |
| street_darkguard_1_g.mp3 | латник смены | Charon | cold, ominous, quiet | Ты не записан. Пока не записан. |
| street_darkguard_2_g.mp3 | латник смены | Charon | cold, detached, menacing | Ходишь — ходи. Остановишься — сочтут. |
| street_darkguard_3_g.mp3 | латник смены | Charon | flat, clipped, advising | К стене ближе. По середине ходят те, кого ищут. |
| street_darkguard_4_g.mp3 | латник смены | Charon | cold, grim, ominous | Ночью ворота закрыты изнутри. Снаружи их не закрывают. |
| street_darkguard_5_g.mp3 | латник смены | Charon | flat, strangely approving | Оружие видно. Это хорошо: прятать хуже. |
| street_soldier_0_g.mp3 | солдат гарнизона | Charon | weary, flat counting | Смена третья. Осталось две. |
| street_soldier_1_g.mp3 | солдат гарнизона | Charon | grim, hollow, weary | Вчера ушло сорок. Вернулось двенадцать. |
| street_soldier_2_g.mp3 | солдат гарнизона | Charon | bleak, fatalistic | Нам платят днями. Кто не считает — живёт дольше. |
| street_soldier_3_g.mp3 | солдат гарнизона | Charon | tense, lowered voice | Не спрашивай, куда роют. Роют вниз. |
| street_soldier_4_g.mp3 | солдат гарнизона | Charon | urgent, lowered voice, serious | Если услышишь рог дважды — беги к стене, не от неё. |
| street_soldier_5_g.mp3 | солдат гарнизона | Charon | dry, gruff, mocking | Ты с Грани? Пахнет. Не мной сказано. |
| street_folk_0_g.mp3 | горожанин | Achird | friendly, kind | Доброго пути. |
| street_folk_0_f_g.mp3 | горожанин | Sulafat | friendly, kind | Доброго пути. |
| street_folk_1_g.mp3 | горожанин | Achird | complaining, sighing | Опять подорожало зерно. |
| street_folk_1_f_g.mp3 | горожанин | Sulafat | complaining, sighing | Опять подорожало зерно. |
| street_folk_2_g.mp3 | горожанин | Achird | casual small talk | К вечеру обещали дождь. |
| street_folk_2_f_g.mp3 | горожанин | Sulafat | casual small talk | К вечеру обещали дождь. |
| street_folk_3_g.mp3 | горожанин | Achird | mildly annoyed | У колодца сегодня очередь. |
| street_folk_3_f_g.mp3 | горожанин | Sulafat | mildly annoyed | У колодца сегодня очередь. |
| street_folk_4_g.mp3 | горожанин | Achird | curious gossip | Слыхал, обоз пришёл с востока. |
| street_folk_4_f_g.mp3 | горожанин | Sulafat | curious gossip | Слыхала, обоз пришёл с востока. |
| street_folk_5_g.mp3 | горожанин | Achird | cheerful, pleased | Хлеб сегодня удался, у пекаря очередь. |
| street_folk_5_f_g.mp3 | горожанин | Sulafat | cheerful, pleased | Хлеб сегодня удался, у пекаря очередь. |
| street_folk_6_g.mp3 | горожанин | Achird | grumbling, disapproving | Мельник опять пьёт, мука будет с камнями. |
| street_folk_6_f_g.mp3 | горожанин | Sulafat | grumbling, disapproving | Мельник опять пьёт, мука будет с камнями. |
| street_folk_7_g.mp3 | горожанин | Achird | excited whisper, gossip | Говорят, в подземелье снова нашли золото. |
| street_folk_7_f_g.mp3 | горожанин | Sulafat | excited whisper, gossip | Говорят, в подземелье снова нашли золото. |
| street_folk_8_g.mp3 | горожанин | Achird | joyful, beaming, proud | Дочка замуж выходит — всю улицу зовём! |
| street_folk_8_f_g.mp3 | горожанин | Sulafat | joyful, beaming, proud | Дочка замуж выходит — всю улицу зовём! |
| street_folk_9_g.mp3 | горожанин | Achird | tired, grumbling | Кузнец опять стучит с рассвета. Спать не даёт. |
| street_folk_9_f_g.mp3 | горожанин | Sulafat | tired, grumbling | Кузнец опять стучит с рассвета. Спать не даёт. |
| street_folk_10_g.mp3 | горожанин | Achird | thoughtful, worried | Крышу бы подлатать до осени. |
| street_folk_10_f_g.mp3 | горожанин | Sulafat | thoughtful, worried | Крышу бы подлатать до осени. |
| street_folk_11_g.mp3 | горожанин | Achird | puzzled, musing | Рыба нынче мелкая. Река, что ли, обмелела? |
| street_folk_11_f_g.mp3 | горожанин | Sulafat | puzzled, musing | Рыба нынче мелкая. Река, что ли, обмелела? |
| street_folk_12_g.mp3 | горожанин | Achird | excited, bustling | Ярмарка скоро. Весь город вверх дном. |
| street_folk_12_f_g.mp3 | горожанин | Sulafat | excited, bustling | Ярмарка скоро. Весь город вверх дном. |
| street_folk_13_g.mp3 | горожанин | Achird | amused, chuckling | Сосед корову продал, теперь молоко у меня берёт. |
| street_folk_13_f_g.mp3 | горожанин | Sulafat | amused, chuckling | Сосед корову продал, теперь молоко у меня берёт. |
| street_folk_14_g.mp3 | горожанин | Achird | worried, anxious, searching | Не видал моего пса? Рыжий такой. |
| street_folk_14_f_g.mp3 | горожанин | Sulafat | worried, anxious, searching | Не видал моего пса? Рыжий такой. |
| street_folk_15_g.mp3 | горожанин | Achird | bitter, complaining | Цены растут, а жалованье нет. |
| street_folk_15_f_g.mp3 | горожанин | Sulafat | bitter, complaining | Цены растут, а жалованье нет. |
| street_folk_16_g.mp3 | горожанин | Achird | disapproving gossip | Вчера у трактира опять дрались. |
| street_folk_16_f_g.mp3 | горожанин | Sulafat | disapproving gossip | Вчера у трактира опять дрались. |
| street_folk_17_g.mp3 | горожанин | Achird | confidential, approving | Травница с окраины лечит лучше лекаря, и дешевле. |
| street_folk_17_f_g.mp3 | горожанин | Sulafat | confidential, approving | Травница с окраины лечит лучше лекаря, и дешевле. |
| street_folk_18_g.mp3 | горожанин | Achird | weary, groaning | Ох, спина. Весь день мешки носил. |
| street_folk_18_f_g.mp3 | горожанин | Sulafat | weary, groaning | Ох, спина. Весь день мешки носила. |
| street_folk_19_g.mp3 | горожанин | Achird | friendly warning | Смотри под ноги: тут лужа по колено. |
| street_folk_19_f_g.mp3 | горожанин | Sulafat | friendly warning | Смотри под ноги: тут лужа по колено. |
| street_folk_20_g.mp3 | горожанин | Achird | uneasy, superstitious | Храмовый колокол треснул, говорят — к беде. |
| street_folk_20_f_g.mp3 | горожанин | Sulafat | uneasy, superstitious | Храмовый колокол треснул, говорят — к беде. |
| street_folk_21_g.mp3 | горожанин | Achird | proud yet anxious, tender | Внук в стражу пошёл. Горжусь, а сердце не на месте. |
| street_folk_21_f_g.mp3 | горожанин | Sulafat | proud yet anxious, tender | Внук в стражу пошёл. Горжусь, а сердце не на месте. |
| street_folk_22_g.mp3 | горожанин | Achird | curious, slightly wary | Чужих нынче много. Ты, видать, тоже издалека. |
| street_folk_22_f_g.mp3 | горожанин | Sulafat | curious, slightly wary | Чужих нынче много. Ты, видать, тоже издалека. |
| street_folk_23_g.mp3 | горожанин | Achird | hurried, reminding | Поздно уже. Скоро ворота закроют. |
| street_folk_23_f_g.mp3 | горожанин | Sulafat | hurried, reminding | Поздно уже. Скоро ворота закроют. |
| street_darkfolk_0_g.mp3 | житель посада | Achird | fearful whisper | Не смотри на меня, я ещё в списке. |
| street_darkfolk_0_f_g.mp3 | житель посада | Sulafat | fearful whisper | Не смотри на меня, я ещё в списке. |
| street_darkfolk_1_g.mp3 | житель посада | Achird | anxious, hushed | Соль подорожала: значит, скоро обряд. |
| street_darkfolk_1_f_g.mp3 | житель посада | Sulafat | anxious, hushed | Соль подорожала: значит, скоро обряд. |
| street_darkfolk_2_g.mp3 | житель посада | Achird | bitter, hushed, fearful | У нас не спрашивают «как здоровье». У нас спрашивают «сколько осталось». |
| street_darkfolk_2_f_g.mp3 | житель посада | Sulafat | bitter, hushed, fearful | У нас не спрашивают «как здоровье». У нас спрашивают «сколько осталось». |
| street_darkfolk_3_g.mp3 | житель посада | Achird | grief, hushed | Вчера забрали соседа. Дом стоит, а порог сточен. |
| street_darkfolk_3_f_g.mp3 | житель посада | Sulafat | grief, hushed | Вчера забрали соседа. Дом стоит, а порог сточен. |
| street_darkfolk_4_g.mp3 | житель посада | Achird | frightened whisper | Тише. У стен есть уши, и они не наши. |
| street_darkfolk_4_f_g.mp3 | житель посада | Sulafat | frightened whisper | Тише. У стен есть уши, и они не наши. |
| street_darkfolk_5_g.mp3 | житель посада | Achird | fearful, hushed warning | Ты живой. Это заметно издалека, и это плохо. |
| street_darkfolk_5_f_g.mp3 | житель посада | Sulafat | fearful, hushed warning | Ты живой. Это заметно издалека, и это плохо. |
| greet_torg_0_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_0_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Смотри, выбирай. Руками не мни. |
| greet_torg_1_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_1_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Товар свежий, цена честная — почти. |
| greet_torg_2_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_2_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Золото есть? Тогда поговорим. |
| greet_torg_3_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_3_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Заходи, заходи. Сегодня уступлю, если не жадничать. |
| greet_torg_4_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_4_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Что ищешь — то и найдём. Чего нет — достанем. |
| greet_torg_5_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_5_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Не стой в проходе, покупатели за тобой. |
| greet_torg_6_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_6_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | За погляд денег не беру. Пока. |
| greet_torg_7_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_7_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | С дороги? Значит, есть что продать. |
| greet_torg_8_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_8_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Меняю, покупаю, продаю. Спрашивай. |
| greet_torg_9_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_9_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Весы у меня верные, не сомневайся. |
| greet_torg_10_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_10_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Тише, не торгуйся вслух — соседи услышат, цены поднимут. |
| greet_torg_11_g.mp3 | приветствие: торговец | Umbriel | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_torg_11_f_g.mp3 | приветствие: торговец | Despina | brisk, lively market trader, persuasive | Последний такой остался. Правда последний. |
| greet_kuznya_0_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_0_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Осторожно, окалина летит. |
| greet_kuznya_1_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_1_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Клинок принёс? Покажи, где зазубрина. |
| greet_kuznya_2_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_2_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Горн горячий, говори быстро. |
| greet_kuznya_3_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_3_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Подкову, гвоздь или меч — всё куётся. |
| greet_kuznya_4_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_4_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Железо слушает руку, а не язык. |
| greet_kuznya_5_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_5_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Погоди, докую — остынет. |
| greet_kuznya_6_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_6_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Доспех править будем или новый ковать? |
| greet_kuznya_7_g.mp3 | приветствие: кузнец | Umbriel | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_kuznya_7_f_g.mp3 | приветствие: кузнец | Despina | loud, gruff blacksmith, busy | Сталь у меня звонкая. Послушай. |
| greet_traktir_0_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_0_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Садись к огню, похлёбка горячая. |
| greet_traktir_1_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_1_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Комната наверху свободна, если не храпишь. |
| greet_traktir_2_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_2_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Чего налить? Пиво у нас своё. |
| greet_traktir_3_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_3_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Новости? Здесь их больше, чем пива. |
| greet_traktir_4_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_4_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Ноги вытирай, пол только выскоблили. |
| greet_traktir_5_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_5_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Грей руки. Ночь нынче злая. |
| greet_traktir_6_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_6_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | Платят вперёд. Ничего личного. |
| greet_traktir_7_g.mp3 | приветствие: трактирщик | Umbriel | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_traktir_7_f_g.mp3 | приветствие: трактирщик | Despina | warm, hospitable innkeeper, cheerful | О дороге спроси — здесь все с дороги. |
| greet_strazha_0_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_0_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Стой. Кто таков и зачем? |
| greet_strazha_1_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_1_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Оружие в ножнах держи. |
| greet_strazha_2_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_2_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Проходи, но без шума. |
| greet_strazha_3_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_3_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Жалобы — к старшему. Дело — ко мне. |
| greet_strazha_4_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_4_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Ночью по одному не ходи. |
| greet_strazha_5_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_5_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Приказ есть приказ. Чего надо? |
| greet_strazha_6_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_6_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Смена долгая, говори короче. |
| greet_strazha_7_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_7_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Бумаги есть? Покажи. |
| greet_strazha_8_g.mp3 | приветствие: страж у дела | Umbriel | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_strazha_8_f_g.mp3 | приветствие: страж у дела | Despina | stern, dry, official guard | Спокойно у ворот — и слава богам. |
| greet_lekar_0_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_0_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Где болит? Показывай. |
| greet_lekar_1_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_1_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Сядь. Руку дай, пульс послушаю. |
| greet_lekar_2_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_2_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Раны промывать надо, а не ждать. |
| greet_lekar_3_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_3_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Отвар горький, зато живой уйдёшь. |
| greet_lekar_4_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_4_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Не трогай склянки, в них не вода. |
| greet_lekar_5_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_5_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Опять порезы? Береги себя. |
| greet_lekar_6_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_6_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Дыши ровно. Сейчас посмотрим. |
| greet_lekar_7_g.mp3 | приветствие: лекарь | Umbriel | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_lekar_7_f_g.mp3 | приветствие: лекарь | Despina | caring, gentle healer, calm | Бледный ты. Давно ел? |
| greet_zhrec_0_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_0_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Мир тебе, путник. |
| greet_zhrec_1_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_1_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Боги слышат. Говори тише. |
| greet_zhrec_2_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_2_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Свеча горит — значит, ты не один. |
| greet_zhrec_3_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_3_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | С чем пришёл: с молитвой или с бедой? |
| greet_zhrec_4_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_4_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Здесь не лгут. Здесь и так всё видно. |
| greet_zhrec_5_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_5_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Сними шапку, путник. Здесь святое место. |
| greet_zhrec_6_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_6_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Кто кается — того слушают. |
| greet_zhrec_7_g.mp3 | приветствие: жрец | Umbriel | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_zhrec_7_f_g.mp3 | приветствие: жрец | Despina | quiet, reverent, serene | Благослови тебя небо. Чем помочь? |
| greet_znanie_0_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_0_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Не шуми, я считаю. |
| greet_znanie_1_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_1_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Книги любят тишину и чистые руки. |
| greet_znanie_2_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_2_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Спрашивай. Если знаю — скажу. |
| greet_znanie_3_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_3_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Ученье долгое. Разговор — короче. |
| greet_znanie_4_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_4_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Чернила сохнут, говори по делу. |
| greet_znanie_5_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_5_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Любопытство — первая ступень знания. Проходи. |
| greet_znanie_6_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_6_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Осторожно, свитки не сшиты. |
| greet_znanie_7_g.mp3 | приветствие: учёный | Umbriel | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_znanie_7_f_g.mp3 | приветствие: учёный | Despina | thoughtful scholar, soft, a bit absent-minded | Ты грамоте учён? Хорошо. |
| greet_glub_0_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_0_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Тише. Здесь торгуют без свидетелей. |
| greet_glub_1_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_1_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Живой? Уже хорошо. Что берёшь? |
| greet_glub_2_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_2_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Факелы, верёвка, хлеб. Остальное — дорого. |
| greet_glub_3_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_3_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Наверх далеко, а я рядом. За это и плата. |
| greet_glub_4_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_4_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Садись у огня, погрейся. Потом о цене. |
| greet_glub_5_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_5_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Что нашёл внизу — покажи. Может, куплю. |
| greet_glub_6_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_6_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Не оглядывайся. Твари сюда не суются — огня боятся. |
| greet_glub_7_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_7_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Я тут давно. Дольше, чем ты думаешь. |
| greet_glub_8_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_8_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Кто спустился, тот платит. Такое правило. |
| greet_glub_9_g.mp3 | приветствие: торговец глубин | Umbriel | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_glub_9_f_g.mp3 | приветствие: торговец глубин | Despina | low voice, wary, secretive trader | Руду беру, кости беру. Вопросов не задаю. |
| greet_tma_0_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_0_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Говори быстро. Нас считают. |
| greet_tma_1_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_1_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Ты не отсюда. Это слышно. |
| greet_tma_2_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_2_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Цена — не в золоте. Но золото тоже возьму. |
| greet_tma_3_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_3_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Тише. Надсмотрщик близко. |
| greet_tma_4_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Спросишь лишнее — забуду, что видел тебя. |
| greet_tma_4_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Спросишь лишнее — забуду, что видела тебя. |
| greet_tma_5_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_5_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Живым здесь не рады. Но я — не здесь. |
| greet_tma_6_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_6_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Что принёс с той стороны? Покажи. |
| greet_tma_7_g.mp3 | приветствие: житель тёмных земель | Umbriel | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_tma_7_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Не называй имени. Имя — это долг. |
| greet_obshiy_0_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Доброго дня. |
| greet_obshiy_0_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Доброго дня. |
| greet_obshiy_1_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_1_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | А, путник. Чем могу? |
| greet_obshiy_2_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_2_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Здравствуй. Нечасто к нам заходят. |
| greet_obshiy_3_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_3_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Слушаю тебя. |
| greet_obshiy_4_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_4_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Говори, только недолго — дела. |
| greet_obshiy_5_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_5_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Опять дожди, а у меня крыша течёт. |
| greet_obshiy_6_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_6_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Новое лицо. Откуда будешь? |
| greet_obshiy_7_g.mp3 | приветствие: всякий житель | Umbriel | plain, friendly, natural | Проходи, раз пришёл. |
| greet_obshiy_7_f_g.mp3 | приветствие: всякий житель | Despina | plain, friendly, natural | Проходи, раз пришёл. |
| greet_svoy_0_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Рад тебя видеть, друг. |
| greet_svoy_0_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Рада тебя видеть, друг. |
| greet_svoy_1_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_1_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_2_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_2_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_3_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_3_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_4_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_4_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_5_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя отложил кое-что. Смотри. |
| greet_svoy_5_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя отложила кое-что. Смотри. |
| greet_holod_0_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Чего тебе? |
| greet_holod_0_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Чего тебе? |
| greet_holod_1_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_1_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Быстрее. Мне некогда. |
| greet_holod_2_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Говори и уходи. |
| greet_holod_2_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Говори и уходи. |
| greet_holod_3_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_3_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Знаем тебя. Не с лучшей стороны. |
| greet_holod_4_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_4_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Ну? Я слушаю. Недолго. |
| greet_holod_5_g.mp3 | приветствие: холодный | Umbriel | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_holod_5_f_g.mp3 | приветствие: холодный | Despina | cold, irritated, impatient | Опять ты. Ладно, говори. |
| greet_vrazhda_0_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_0_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | Уходи, пока цел. |
| greet_vrazhda_1_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_1_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | Тебе здесь не рады. |
| greet_vrazhda_2_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_2_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | Ещё шаг — и позову стражу. |
| greet_vrazhda_3_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_3_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | С такими, как ты, не говорю. |
| greet_vrazhda_4_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_4_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | Не подходи. Я всё про тебя знаю. |
| greet_vrazhda_5_g.mp3 | приветствие: недруг | Umbriel | hostile, menacing, tense | Руки держи на виду. |
| greet_vrazhda_5_f_g.mp3 | приветствие: недруг | Despina | hostile, menacing, tense | Руки держи на виду. |
| greet_snova_0_g.mp3 | приветствие: при новой встрече | Umbriel | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_0_f_g.mp3 | приветствие: при новой встрече | Despina | wry, slightly amused | Снова ты? Ну, заходи. |
| greet_snova_1_g.mp3 | приветствие: при новой встрече | Umbriel | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_1_f_g.mp3 | приветствие: при новой встрече | Despina | wry, slightly amused | Вернулся? Значит, понравилось. |
| greet_snova_2_g.mp3 | приветствие: при новой встрече | Umbriel | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_2_f_g.mp3 | приветствие: при новой встрече | Despina | wry, slightly amused | Опять пришёл. Что на этот раз? |
| greet_snova_3_g.mp3 | приветствие: при новой встрече | Umbriel | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_3_f_g.mp3 | приветствие: при новой встрече | Despina | wry, slightly amused | Помню тебя. Садись. |
| greet_snova_4_g.mp3 | приветствие: при новой встрече | Umbriel | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_snova_4_f_g.mp3 | приветствие: при новой встрече | Despina | wry, slightly amused | А, это ты. С прошлого раза ничего не изменилось. |
| greet_dobro_0_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_0_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | А, это вы! Спасибо за прошлое. |
| greet_dobro_1_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_1_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | Помню добро. Заходите. |
| greet_dobro_2_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_2_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | Вам здесь всегда рады. |
| greet_dobro_3_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_3_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | О, вот кто нас выручил! |
| greet_dobro_4_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_4_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | Для вас — всё самое лучшее. |
| greet_dobro_5_g.mp3 | приветствие: помнит добро | Umbriel | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_dobro_5_f_g.mp3 | приветствие: помнит добро | Despina | grateful, warm, welcoming | Не забуду, что вы для нас сделали. |
| greet_zlo_0_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_0_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Опять вы. После того, что было... |
| greet_zlo_1_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_1_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Не думайте, что всё забыто. |
| greet_zlo_2_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_2_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Чего пришли? Мало вам? |
| greet_zlo_3_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_3_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Помню, как вы со мной обошлись. |
| greet_zlo_4_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_4_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Держитесь подальше. Всё помню. |
| greet_zlo_5_g.mp3 | приветствие: помнит обиду | Umbriel | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_zlo_5_f_g.mp3 | приветствие: помнит обиду | Despina | resentful, bitter, cold | Вы ещё смеете сюда приходить? |
| greet_utro_0_g.mp3 | приветствие: утром | Umbriel | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_0_f_g.mp3 | приветствие: утром | Despina | fresh, friendly morning greeting | Доброе утро. Рано вы. |
| greet_utro_1_g.mp3 | приветствие: утром | Umbriel | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_1_f_g.mp3 | приветствие: утром | Despina | fresh, friendly morning greeting | С утра пораньше — и уже по делам? |
| greet_utro_2_g.mp3 | приветствие: утром | Umbriel | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_2_f_g.mp3 | приветствие: утром | Despina | fresh, friendly morning greeting | Утро доброе. Только открылись. |
| greet_utro_3_g.mp3 | приветствие: утром | Umbriel | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_utro_3_f_g.mp3 | приветствие: утром | Despina | fresh, friendly morning greeting | Доброе утро, путник. |
| greet_vecher_0_g.mp3 | приветствие: вечером | Umbriel | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_0_f_g.mp3 | приветствие: вечером | Despina | tired evening greeting | Добрый вечер. Скоро закрываемся. |
| greet_vecher_1_g.mp3 | приветствие: вечером | Umbriel | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_1_f_g.mp3 | приветствие: вечером | Despina | tired evening greeting | Вечер уже. Чего так поздно? |
| greet_vecher_2_g.mp3 | приветствие: вечером | Umbriel | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_2_f_g.mp3 | приветствие: вечером | Despina | tired evening greeting | Добрый вечер, путник. |
| greet_vecher_3_g.mp3 | приветствие: вечером | Umbriel | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_vecher_3_f_g.mp3 | приветствие: вечером | Despina | tired evening greeting | К ночи дело, говорите быстрее. |
| greet_noch_0_g.mp3 | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_0_f_g.mp3 | приветствие: ночью | Despina | sleepy, hushed night greeting | Ночь на дворе. Чего не спится? |
| greet_noch_1_g.mp3 | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_1_f_g.mp3 | приветствие: ночью | Despina | sleepy, hushed night greeting | Тише, люди спят. |
| greet_noch_2_g.mp3 | приветствие: ночью | Umbriel | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_2_f_g.mp3 | приветствие: ночью | Despina | sleepy, hushed night greeting | В такой час? Ну, заходи. |
| greet_noch_3_g.mp3 | приветствие: ночью | Umbriel | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| greet_noch_3_f_g.mp3 | приветствие: ночью | Despina | sleepy, hushed night greeting | Ночью добрые люди дома сидят. |
| dlg_0_0_g.mp3 | ответ в разговоре | Umbriel | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_0_f_g.mp3 | ответ в разговоре | Despina | evasive, dismissive | Я в такие дела не лезу |
| dlg_0_1_g.mp3 | ответ в разговоре | Umbriel | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_1_f_g.mp3 | ответ в разговоре | Despina | evasive, dismissive | Спросите кого другого, я тут сбоку |
| dlg_0_2_g.mp3 | ответ в разговоре | Umbriel | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_2_f_g.mp3 | ответ в разговоре | Despina | evasive, dismissive | Моё дело маленькое — ничего не знаю |
| dlg_0_3_g.mp3 | ответ в разговоре | Umbriel | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_3_f_g.mp3 | ответ в разговоре | Despina | evasive, dismissive | Не моего ума дело, и не вашего, по-хорошему |
| dlg_0_4_g.mp3 | ответ в разговоре (трус) | Umbriel | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_4_f_g.mp3 | ответ в разговоре (трус) | Despina | evasive, dismissive, timid, nervous | Тише вы… Не знаю ничего и знать не хочу |
| dlg_0_5_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_5_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | evasive, dismissive, suspicious | А вам-то зачем? Нет, не скажу |
| dlg_0_6_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_6_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | evasive, dismissive, haughty | Я не пересказываю базарные сплетни |
| dlg_0_7_g.mp3 | ответ в разговоре (жадный) | Umbriel | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_7_f_g.mp3 | ответ в разговоре (жадный) | Despina | evasive, dismissive, greedy, calculating | Бесплатно я даже время не говорю |
| dlg_0_8_g.mp3 | ответ в разговоре (хитрый) | Umbriel | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_8_f_g.mp3 | ответ в разговоре (хитрый) | Despina | evasive, dismissive, sly | Может, и знаю. Но не вам и не сегодня |
| dlg_0_9_g.mp3 | ответ в разговоре (рациональный) | Umbriel | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_9_f_g.mp3 | ответ в разговоре (рациональный) | Despina | evasive, dismissive, calm, rational | Наверняка не знаю, а гадать не стану |
| dlg_0_10_g.mp3 | ответ в разговоре (жестокий) | Umbriel | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_10_f_g.mp3 | ответ в разговоре (жестокий) | Despina | evasive, dismissive, harsh, cruel | Проваливай с такими вопросами |
| dlg_0_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | evasive, dismissive, hostile | С вами я ни о чём говорить не стану |
| dlg_0_12_g.mp3 | ответ в разговоре (недруг) | Umbriel | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_12_f_g.mp3 | ответ в разговоре (недруг) | Despina | evasive, dismissive, hostile | Ищите дураков в другом месте |
| dlg_0_13_g.mp3 | ответ в разговоре (холоден) | Umbriel | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_13_f_g.mp3 | ответ в разговоре (холоден) | Despina | evasive, dismissive, cold, curt | Спрашивайте кого другого |
| dlg_0_14_g.mp3 | ответ в разговоре (холоден) | Umbriel | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_14_f_g.mp3 | ответ в разговоре (холоден) | Despina | evasive, dismissive, cold, curt | Не до вас сейчас |
| dlg_0_15_g.mp3 | ответ в разговоре (свой) | Umbriel | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_15_f_g.mp3 | ответ в разговоре (свой) | Despina | evasive, dismissive, warm, friendly | Тебе бы сказать, да нечего |
| dlg_0_16_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_16_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | evasive, dismissive, resentful, bitter | После того, что было? Ничего вам не скажу |
| dlg_0_17_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_0_17_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | evasive, dismissive, grateful, warm | Вам бы помочь, да правда не знаю |
| dlg_1_0_g.mp3 | ответ в разговоре | Umbriel | shrugging, dismissive | Мало ли что болтают |
| dlg_1_0_f_g.mp3 | ответ в разговоре | Despina | shrugging, dismissive | Мало ли что болтают |
| dlg_1_1_g.mp3 | ответ в разговоре | Umbriel | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_1_f_g.mp3 | ответ в разговоре | Despina | shrugging, dismissive | Слухов тут больше, чем людей, — не собираю |
| dlg_1_2_g.mp3 | ответ в разговоре | Umbriel | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_2_f_g.mp3 | ответ в разговоре | Despina | shrugging, dismissive | Язык без костей, а у меня память на чужие басни короткая |
| dlg_1_3_g.mp3 | ответ в разговоре | Umbriel | shrugging, dismissive | Не слышал. А и слышал бы — не повторил |
| dlg_1_3_f_g.mp3 | ответ в разговоре | Despina | shrugging, dismissive | Не слышала. А и слышала бы — не повторила |
| dlg_1_4_g.mp3 | ответ в разговоре (честный) | Umbriel | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_4_f_g.mp3 | ответ в разговоре (честный) | Despina | shrugging, dismissive, sincere | Врать не хочу, а правды не знаю |
| dlg_1_5_g.mp3 | ответ в разговоре (трус) | Umbriel | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_5_f_g.mp3 | ответ в разговоре (трус) | Despina | shrugging, dismissive, timid, nervous | Про такое вслух не говорят. Не спрашивайте |
| dlg_1_6_g.mp3 | ответ в разговоре (фанатик) | Umbriel | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_6_f_g.mp3 | ответ в разговоре (фанатик) | Despina | shrugging, dismissive, zealous, fervent | Пустое это всё. Слушайте лучше, что говорят боги |
| dlg_1_7_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_7_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | shrugging, dismissive, suspicious | Кто вас подослал выспрашивать? |
| dlg_1_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | shrugging, dismissive, hostile | Вам — ни слова |
| dlg_1_9_g.mp3 | ответ в разговоре (холоден) | Umbriel | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_9_f_g.mp3 | ответ в разговоре (холоден) | Despina | shrugging, dismissive, cold, curt | Сплетен не держу |
| dlg_1_10_g.mp3 | ответ в разговоре (свой) | Umbriel | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_10_f_g.mp3 | ответ в разговоре (свой) | Despina | shrugging, dismissive, warm, friendly | Врать не стану: ничего путного не слышно |
| dlg_1_11_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_1_11_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | shrugging, dismissive, resentful, bitter | Чтобы вы потом разнесли? Нет уж |
| dlg_2_0_g.mp3 | ответ в разговоре | Umbriel | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_0_f_g.mp3 | ответ в разговоре | Despina | thoughtful, agreeing | Пожалуй, вы правы |
| dlg_2_1_g.mp3 | ответ в разговоре | Umbriel | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_1_f_g.mp3 | ответ в разговоре | Despina | thoughtful, agreeing | Убедили. Сделаю по-вашему |
| dlg_2_2_g.mp3 | ответ в разговоре | Umbriel | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_2_f_g.mp3 | ответ в разговоре | Despina | thoughtful, agreeing | Что ж, в ваших словах есть толк |
| dlg_2_3_g.mp3 | ответ в разговоре | Umbriel | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_3_f_g.mp3 | ответ в разговоре | Despina | thoughtful, agreeing | Может, и правда пора посмотреть иначе |
| dlg_2_4_g.mp3 | ответ в разговоре (рациональный) | Umbriel | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_4_f_g.mp3 | ответ в разговоре (рациональный) | Despina | thoughtful, agreeing, calm, rational | Доводы весомые. Принимаю |
| dlg_2_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | thoughtful, agreeing, haughty | Редко признаю чужую правоту, но тут — да |
| dlg_2_6_g.mp3 | ответ в разговоре (добрый) | Umbriel | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_6_f_g.mp3 | ответ в разговоре (добрый) | Despina | thoughtful, agreeing, kind, warm | Раз вы так считаете — так и быть |
| dlg_2_7_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_7_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | thoughtful, agreeing, suspicious | Ладно. Но если окажется не так, я вспомню этот разговор |
| dlg_2_8_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_8_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | thoughtful, agreeing, stern, old-fashioned | Деды бы поспорили, но я соглашусь |
| dlg_2_9_g.mp3 | ответ в разговоре (реформатор) | Umbriel | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_9_f_g.mp3 | ответ в разговоре (реформатор) | Despina | thoughtful, agreeing, eager | Вот это дело! Давно пора было так думать |
| dlg_2_10_g.mp3 | ответ в разговоре (жадный) | Umbriel | thoughtful, agreeing, greedy, calculating | Согласен, если мне с этого не убыток |
| dlg_2_10_f_g.mp3 | ответ в разговоре (жадный) | Despina | thoughtful, agreeing, greedy, calculating | Согласна, если мне с этого не убыток |
| dlg_2_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | thoughtful, agreeing, hostile | Не люблю вас, но тут вы правы |
| dlg_2_12_g.mp3 | ответ в разговоре (холоден) | Umbriel | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_12_f_g.mp3 | ответ в разговоре (холоден) | Despina | thoughtful, agreeing, cold, curt | Ладно. На этот раз соглашусь |
| dlg_2_13_g.mp3 | ответ в разговоре (свой) | Umbriel | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_13_f_g.mp3 | ответ в разговоре (свой) | Despina | thoughtful, agreeing, warm, friendly | С тобой спорить — себе дороже. Прав ты |
| dlg_2_14_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_14_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | thoughtful, agreeing, grateful, warm | Вам я верю. Будь по-вашему |
| dlg_2_15_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_2_15_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | thoughtful, agreeing, resentful, bitter | Правы. Хоть и не хочется это признавать |
| dlg_3_0_g.mp3 | ответ в разговоре | Umbriel | firm refusal | Нет. И не уговаривайте |
| dlg_3_0_f_g.mp3 | ответ в разговоре | Despina | firm refusal | Нет. И не уговаривайте |
| dlg_3_1_g.mp3 | ответ в разговоре | Umbriel | firm refusal | Сказал нет — значит нет |
| dlg_3_1_f_g.mp3 | ответ в разговоре | Despina | firm refusal | Сказала нет — значит нет |
| dlg_3_2_g.mp3 | ответ в разговоре | Umbriel | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_2_f_g.mp3 | ответ в разговоре | Despina | firm refusal | Красиво говорите, но я останусь при своём |
| dlg_3_3_g.mp3 | ответ в разговоре | Umbriel | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_3_f_g.mp3 | ответ в разговоре | Despina | firm refusal | Зря стараетесь. Не сегодня |
| dlg_3_4_g.mp3 | ответ в разговоре (фанатик) | Umbriel | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_4_f_g.mp3 | ответ в разговоре (фанатик) | Despina | firm refusal, zealous, fervent | Моя правда крепче ваших слов |
| dlg_3_5_g.mp3 | ответ в разговоре (рациональный) | Umbriel | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_5_f_g.mp3 | ответ в разговоре (рациональный) | Despina | firm refusal, calm, rational | Доводы слабые. Нет |
| dlg_3_6_g.mp3 | ответ в разговоре (жестокий) | Umbriel | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_6_f_g.mp3 | ответ в разговоре (жестокий) | Despina | firm refusal, harsh, cruel | Ещё раз начнёте — пожалеете |
| dlg_3_7_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | firm refusal, haughty | Не вам мне указывать |
| dlg_3_7_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | firm refusal, haughty | Не вам мне указывать |
| dlg_3_8_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_8_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | firm refusal, stern, old-fashioned | Так не заведено, и так не будет |
| dlg_3_9_g.mp3 | ответ в разговоре (добрый) | Umbriel | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_9_f_g.mp3 | ответ в разговоре (добрый) | Despina | firm refusal, kind, warm | Не сердитесь, но нет. Не могу |
| dlg_3_10_g.mp3 | ответ в разговоре (мятежник) | Umbriel | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_10_f_g.mp3 | ответ в разговоре (мятежник) | Despina | firm refusal, rebellious | Меня уже раз уговорили — хватило на всю жизнь |
| dlg_3_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | firm refusal, hostile | С вами? Никогда |
| dlg_3_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | firm refusal, hostile | С вами? Никогда |
| dlg_3_12_g.mp3 | ответ в разговоре (холоден) | Umbriel | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_12_f_g.mp3 | ответ в разговоре (холоден) | Despina | firm refusal, cold, curt | Нет. Разговор окончен |
| dlg_3_13_g.mp3 | ответ в разговоре (свой) | Umbriel | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_13_f_g.mp3 | ответ в разговоре (свой) | Despina | firm refusal, warm, friendly | Прости, друг, но тут не уступлю |
| dlg_3_14_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_14_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | firm refusal, resentful, bitter | Вам, после всего? Нет |
| dlg_3_15_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_3_15_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | firm refusal, grateful, warm | Уважаю вас, но нет |
| dlg_4_0_g.mp3 | ответ в разговоре | Umbriel | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_0_f_g.mp3 | ответ в разговоре | Despina | reluctant, sighing | Ладно. Но это в последний раз |
| dlg_4_1_g.mp3 | ответ в разговоре | Umbriel | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_1_f_g.mp3 | ответ в разговоре | Despina | reluctant, sighing | Помогу. Но вы теперь мне должны |
| dlg_4_2_g.mp3 | ответ в разговоре | Umbriel | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_2_f_g.mp3 | ответ в разговоре | Despina | reluctant, sighing | Так и быть, только никому ни слова |
| dlg_4_3_g.mp3 | ответ в разговоре | Umbriel | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_3_f_g.mp3 | ответ в разговоре | Despina | reluctant, sighing | Хорошо. Но больше с таким не приходите |
| dlg_4_4_g.mp3 | ответ в разговоре (сострадательный) | Umbriel | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_4_f_g.mp3 | ответ в разговоре (сострадательный) | Despina | reluctant, sighing, compassionate, gentle | Конечно помогу. Как не помочь |
| dlg_4_5_g.mp3 | ответ в разговоре (добрый) | Umbriel | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_5_f_g.mp3 | ответ в разговоре (добрый) | Despina | reluctant, sighing, kind, warm | Для хорошего человека не жалко |
| dlg_4_6_g.mp3 | ответ в разговоре (жадный) | Umbriel | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_6_f_g.mp3 | ответ в разговоре (жадный) | Despina | reluctant, sighing, greedy, calculating | Сделаю. Сочтёмся потом — я запомню |
| dlg_4_7_g.mp3 | ответ в разговоре (прагматик) | Umbriel | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_7_f_g.mp3 | ответ в разговоре (прагматик) | Despina | reluctant, sighing, matter-of-fact | Помогу, если и мне с того что-то будет. Будет? |
| dlg_4_8_g.mp3 | ответ в разговоре (трус) | Umbriel | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_8_f_g.mp3 | ответ в разговоре (трус) | Despina | reluctant, sighing, timid, nervous | Ох… ладно, только чтобы без неприятностей |
| dlg_4_9_g.mp3 | ответ в разговоре (свой) | Umbriel | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_9_f_g.mp3 | ответ в разговоре (свой) | Despina | reluctant, sighing, warm, friendly | Для тебя — хоть сто раз |
| dlg_4_10_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_10_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | reluctant, sighing, grateful, warm | Вам не откажу: вы меня выручали |
| dlg_4_11_g.mp3 | ответ в разговоре (холоден) | Umbriel | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_11_f_g.mp3 | ответ в разговоре (холоден) | Despina | reluctant, sighing, cold, curt | Держите. И больше не просите |
| dlg_4_12_g.mp3 | ответ в разговоре (недруг) | Umbriel | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_12_f_g.mp3 | ответ в разговоре (недруг) | Despina | reluctant, sighing, hostile | Бери и уходи |
| dlg_4_13_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_4_13_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | reluctant, sighing, resentful, bitter | Помогу. Но помнить буду всё |
| dlg_5_0_g.mp3 | ответ в разговоре | Umbriel | helpless, sad | Мне бы кто помог |
| dlg_5_0_f_g.mp3 | ответ в разговоре | Despina | helpless, sad | Мне бы кто помог |
| dlg_5_1_g.mp3 | ответ в разговоре | Umbriel | helpless, sad | Самому бы кто подсобил |
| dlg_5_1_f_g.mp3 | ответ в разговоре | Despina | helpless, sad | Самой бы кто подсобил |
| dlg_5_2_g.mp3 | ответ в разговоре | Umbriel | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_2_f_g.mp3 | ответ в разговоре | Despina | helpless, sad | Не могу. Своих забот по горло |
| dlg_5_3_g.mp3 | ответ в разговоре | Umbriel | helpless, sad | Не просите, не выйдет |
| dlg_5_3_f_g.mp3 | ответ в разговоре | Despina | helpless, sad | Не просите, не выйдет |
| dlg_5_4_g.mp3 | ответ в разговоре (жадный) | Umbriel | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_4_f_g.mp3 | ответ в разговоре (жадный) | Despina | helpless, sad, greedy, calculating | Задаром? Нет уж |
| dlg_5_5_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_5_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | helpless, sad, suspicious | С чего бы мне вам помогать? |
| dlg_5_6_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_6_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | helpless, sad, haughty | Я не бегаю по поручениям чужаков |
| dlg_5_7_g.mp3 | ответ в разговоре (сострадательный) | Umbriel | helpless, sad, compassionate, gentle | Рад бы, правда, но сейчас никак |
| dlg_5_7_f_g.mp3 | ответ в разговоре (сострадательный) | Despina | helpless, sad, compassionate, gentle | Рада бы, правда, но сейчас никак |
| dlg_5_8_g.mp3 | ответ в разговоре (трус) | Umbriel | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_8_f_g.mp3 | ответ в разговоре (трус) | Despina | helpless, sad, timid, nervous | Помог бы, но боюсь ввязаться в беду |
| dlg_5_9_g.mp3 | ответ в разговоре (свой) | Umbriel | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_9_f_g.mp3 | ответ в разговоре (свой) | Despina | helpless, sad, warm, friendly | Прости, друг, сейчас нечем помочь |
| dlg_5_10_g.mp3 | ответ в разговоре (недруг) | Umbriel | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_10_f_g.mp3 | ответ в разговоре (недруг) | Despina | helpless, sad, hostile | Вам? Даже не просите |
| dlg_5_11_g.mp3 | ответ в разговоре (холоден) | Umbriel | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_11_f_g.mp3 | ответ в разговоре (холоден) | Despina | helpless, sad, cold, curt | Не могу и не хочу |
| dlg_5_12_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_5_12_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | helpless, sad, resentful, bitter | После того, как вы со мной обошлись? Нет |
| dlg_6_0_g.mp3 | ответ в разговоре | Umbriel | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_0_f_g.mp3 | ответ в разговоре | Despina | serious, trusting | Запомню. Слово дороже золота |
| dlg_6_1_g.mp3 | ответ в разговоре | Umbriel | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_1_f_g.mp3 | ответ в разговоре | Despina | serious, trusting | Ловлю на слове. Не подведите |
| dlg_6_2_g.mp3 | ответ в разговоре | Umbriel | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_2_f_g.mp3 | ответ в разговоре | Despina | serious, trusting | Хорошо. Буду ждать, что сдержите |
| dlg_6_3_g.mp3 | ответ в разговоре | Umbriel | serious, trusting | Договорились. Время покажет |
| dlg_6_3_f_g.mp3 | ответ в разговоре | Despina | serious, trusting | Договорились. Время покажет |
| dlg_6_4_g.mp3 | ответ в разговоре (честный) | Umbriel | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_4_f_g.mp3 | ответ в разговоре (честный) | Despina | serious, trusting, sincere | Слово — это всё, что у нас есть. Верю |
| dlg_6_5_g.mp3 | ответ в разговоре (хитрый) | Umbriel | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_5_f_g.mp3 | ответ в разговоре (хитрый) | Despina | serious, trusting, sly | Запомню. Я всё запоминаю |
| dlg_6_6_g.mp3 | ответ в разговоре (рациональный) | Umbriel | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_6_f_g.mp3 | ответ в разговоре (рациональный) | Despina | serious, trusting, calm, rational | Принято. Проверю, когда придёт срок |
| dlg_6_7_g.mp3 | ответ в разговоре (добрый) | Umbriel | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_7_f_g.mp3 | ответ в разговоре (добрый) | Despina | serious, trusting, kind, warm | Верю вам. Не знаю почему, но верю |
| dlg_6_8_g.mp3 | ответ в разговоре (свой) | Umbriel | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_8_f_g.mp3 | ответ в разговоре (свой) | Despina | serious, trusting, warm, friendly | Верю тебе, как себе |
| dlg_6_9_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_9_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | serious, trusting, grateful, warm | Вы уже держали слово. Верю |
| dlg_6_10_g.mp3 | ответ в разговоре (холоден) | Umbriel | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_10_f_g.mp3 | ответ в разговоре (холоден) | Despina | serious, trusting, cold, curt | Посмотрим, чего оно стоит |
| dlg_6_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_6_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | serious, trusting, hostile | Сдержите — может, и помиримся |
| dlg_7_0_g.mp3 | ответ в разговоре | Umbriel | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_0_f_g.mp3 | ответ в разговоре | Despina | skeptical, wry | Обещать вы горазды. Посмотрим |
| dlg_7_1_g.mp3 | ответ в разговоре | Umbriel | skeptical, wry | Слова ничего не стоят |
| dlg_7_1_f_g.mp3 | ответ в разговоре | Despina | skeptical, wry | Слова ничего не стоят |
| dlg_7_2_g.mp3 | ответ в разговоре | Umbriel | skeptical, wry | Много вас тут обещало |
| dlg_7_2_f_g.mp3 | ответ в разговоре | Despina | skeptical, wry | Много вас тут обещало |
| dlg_7_3_g.mp3 | ответ в разговоре | Umbriel | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_3_f_g.mp3 | ответ в разговоре | Despina | skeptical, wry | Посмотрим, что от этого останется завтра |
| dlg_7_4_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_4_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | skeptical, wry, suspicious | Кто обещает легко, тот легко и забывает |
| dlg_7_5_g.mp3 | ответ в разговоре (жадный) | Umbriel | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_5_f_g.mp3 | ответ в разговоре (жадный) | Despina | skeptical, wry, greedy, calculating | Обещаниями сыт не будешь |
| dlg_7_6_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_6_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | skeptical, wry, haughty | Ваши обещания мне ни к чему |
| dlg_7_7_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_7_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | skeptical, wry, resentful, bitter | Прошлое слово вы уже нарушили |
| dlg_7_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | skeptical, wry, hostile | Ваши обещания — ветер |
| dlg_7_9_g.mp3 | ответ в разговоре (свой) | Umbriel | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_7_9_f_g.mp3 | ответ в разговоре (свой) | Despina | skeptical, wry, warm, friendly | Ты уж не подведи |
| dlg_8_0_g.mp3 | ответ в разговоре | Umbriel | surprised, conceding | Не думал об этом так |
| dlg_8_0_f_g.mp3 | ответ в разговоре | Despina | surprised, conceding | Не думала об этом так |
| dlg_8_1_g.mp3 | ответ в разговоре | Umbriel | surprised, conceding | А ведь вы правы |
| dlg_8_1_f_g.mp3 | ответ в разговоре | Despina | surprised, conceding | А ведь вы правы |
| dlg_8_2_g.mp3 | ответ в разговоре | Umbriel | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_2_f_g.mp3 | ответ в разговоре | Despina | surprised, conceding | Сдаюсь — тут вы меня переспорили |
| dlg_8_3_g.mp3 | ответ в разговоре | Umbriel | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_3_f_g.mp3 | ответ в разговоре | Despina | surprised, conceding | Что ж, умеете вы спорить |
| dlg_8_4_g.mp3 | ответ в разговоре (фанатик) | Umbriel | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_4_f_g.mp3 | ответ в разговоре (фанатик) | Despina | surprised, conceding, zealous, fervent | …Мне надо это обдумать. Одному |
| dlg_8_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | surprised, conceding, haughty | Неприятно признавать, но вы правы |
| dlg_8_6_g.mp3 | ответ в разговоре (рациональный) | Umbriel | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_6_f_g.mp3 | ответ в разговоре (рациональный) | Despina | surprised, conceding, calm, rational | Логика на вашей стороне. Признаю |
| dlg_8_7_g.mp3 | ответ в разговоре (мятежник) | Umbriel | surprised, conceding, rebellious | Вот! Я всегда чувствовал, что всё не так, как нам говорят |
| dlg_8_7_f_g.mp3 | ответ в разговоре (мятежник) | Despina | surprised, conceding, rebellious | Вот! Я всегда чувствовала, что всё не так, как нам говорят |
| dlg_8_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | surprised, conceding, hostile | Правы. Но это ничего не меняет |
| dlg_8_9_g.mp3 | ответ в разговоре (свой) | Umbriel | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_9_f_g.mp3 | ответ в разговоре (свой) | Despina | surprised, conceding, warm, friendly | Вот за что тебя ценю: голова у тебя светлая |
| dlg_8_10_g.mp3 | ответ в разговоре (холоден) | Umbriel | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_8_10_f_g.mp3 | ответ в разговоре (холоден) | Despina | surprised, conceding, cold, curt | Допустим. Убедили |
| dlg_9_0_g.mp3 | ответ в разговоре | Umbriel | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_0_f_g.mp3 | ответ в разговоре | Despina | grudging, conceding | Ваша взяла. Уступлю |
| dlg_9_1_g.mp3 | ответ в разговоре | Umbriel | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_1_f_g.mp3 | ответ в разговоре | Despina | grudging, conceding | Ладно, по рукам, — но себе в убыток |
| dlg_9_2_g.mp3 | ответ в разговоре | Umbriel | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_2_f_g.mp3 | ответ в разговоре | Despina | grudging, conceding | Грабёж, но пусть будет так |
| dlg_9_3_g.mp3 | ответ в разговоре | Umbriel | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_3_f_g.mp3 | ответ в разговоре | Despina | grudging, conceding | Уговорили. Только другим не рассказывайте |
| dlg_9_4_g.mp3 | ответ в разговоре (жадный) | Umbriel | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_4_f_g.mp3 | ответ в разговоре (жадный) | Despina | grudging, conceding, greedy, calculating | Режете меня без ножа… ладно, берите |
| dlg_9_5_g.mp3 | ответ в разговоре (хитрый) | Umbriel | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_5_f_g.mp3 | ответ в разговоре (хитрый) | Despina | grudging, conceding, sly | Хорошо торгуетесь. Уступлю — на этот раз |
| dlg_9_6_g.mp3 | ответ в разговоре (добрый) | Umbriel | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_6_f_g.mp3 | ответ в разговоре (добрый) | Despina | grudging, conceding, kind, warm | Для вас — скину. Носите на здоровье |
| dlg_9_7_g.mp3 | ответ в разговоре (рациональный) | Umbriel | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласен |
| dlg_9_7_f_g.mp3 | ответ в разговоре (рациональный) | Despina | grudging, conceding, calm, rational | По такой цене я ещё в прибытке. Согласна |
| dlg_9_8_g.mp3 | ответ в разговоре (свой) | Umbriel | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_8_f_g.mp3 | ответ в разговоре (свой) | Despina | grudging, conceding, warm, friendly | Своему — со скидкой |
| dlg_9_9_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_9_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | grudging, conceding, grateful, warm | За прошлое — уступлю |
| dlg_9_10_g.mp3 | ответ в разговоре (холоден) | Umbriel | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_10_f_g.mp3 | ответ в разговоре (холоден) | Despina | grudging, conceding, cold, curt | Уступлю, но только сейчас |
| dlg_9_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_9_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | grudging, conceding, hostile | Забирайте и не возвращайтесь |
| dlg_10_0_g.mp3 | ответ в разговоре | Umbriel | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_0_f_g.mp3 | ответ в разговоре | Despina | firm, businesslike | Цена одна для всех. Берёте или нет? |
| dlg_10_1_g.mp3 | ответ в разговоре | Umbriel | firm, businesslike | Ниже не опущу |
| dlg_10_1_f_g.mp3 | ответ в разговоре | Despina | firm, businesslike | Ниже не опущу |
| dlg_10_2_g.mp3 | ответ в разговоре | Umbriel | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_2_f_g.mp3 | ответ в разговоре | Despina | firm, businesslike | Не нравится — идите к соседу |
| dlg_10_3_g.mp3 | ответ в разговоре | Umbriel | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_3_f_g.mp3 | ответ в разговоре | Despina | firm, businesslike | Товар хороший, и цена у него своя |
| dlg_10_4_g.mp3 | ответ в разговоре (жадный) | Umbriel | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_4_f_g.mp3 | ответ в разговоре (жадный) | Despina | firm, businesslike, greedy, calculating | Скорее удавлюсь, чем уступлю |
| dlg_10_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | firm, businesslike, haughty | Я не торгуюсь, как на базаре |
| dlg_10_6_g.mp3 | ответ в разговоре (честный) | Umbriel | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_6_f_g.mp3 | ответ в разговоре (честный) | Despina | firm, businesslike, sincere | Цена честная, клянусь. Меньше — себе в убыток |
| dlg_10_7_g.mp3 | ответ в разговоре (рациональный) | Umbriel | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_7_f_g.mp3 | ответ в разговоре (рациональный) | Despina | firm, businesslike, calm, rational | Посчитайте сами: дешевле не выходит |
| dlg_10_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | firm, businesslike, hostile | Вам — вдвое. Не нравится — дверь там |
| dlg_10_9_g.mp3 | ответ в разговоре (свой) | Umbriel | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_9_f_g.mp3 | ответ в разговоре (свой) | Despina | firm, businesslike, warm, friendly | Уступить бы тебе, да и так в убыток торгую |
| dlg_10_10_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_10_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | firm, businesslike, resentful, bitter | С вами торговаться не буду |
| dlg_10_11_g.mp3 | ответ в разговоре (холоден) | Umbriel | firm, businesslike, cold, curt | Цена сказана |
| dlg_10_11_f_g.mp3 | ответ в разговоре (холоден) | Despina | firm, businesslike, cold, curt | Цена сказана |
| dlg_11_0_g.mp3 | ответ в разговоре | Umbriel | conspiratorial, low voice | Я вас не видел |
| dlg_11_0_f_g.mp3 | ответ в разговоре | Despina | conspiratorial, low voice | Я вас не видела |
| dlg_11_1_g.mp3 | ответ в разговоре | Umbriel | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_1_f_g.mp3 | ответ в разговоре | Despina | conspiratorial, low voice | Какие деньги? Ничего не было |
| dlg_11_2_g.mp3 | ответ в разговоре | Umbriel | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_2_f_g.mp3 | ответ в разговоре | Despina | conspiratorial, low voice | Считайте, мы не встречались |
| dlg_11_3_g.mp3 | ответ в разговоре | Umbriel | conspiratorial, low voice | Я глух, слеп и очень занят |
| dlg_11_3_f_g.mp3 | ответ в разговоре | Despina | conspiratorial, low voice | Я глуха, слепа и очень занята |
| dlg_11_4_g.mp3 | ответ в разговоре (жадный) | Umbriel | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_4_f_g.mp3 | ответ в разговоре (жадный) | Despina | conspiratorial, low voice, greedy, calculating | Щедро. Для вас — что угодно |
| dlg_11_5_g.mp3 | ответ в разговоре (трус) | Umbriel | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_5_f_g.mp3 | ответ в разговоре (трус) | Despina | conspiratorial, low voice, timid, nervous | Только быстро, пока никто не смотрит |
| dlg_11_6_g.mp3 | ответ в разговоре (хитрый) | Umbriel | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_6_f_g.mp3 | ответ в разговоре (хитрый) | Despina | conspiratorial, low voice, sly | Разумный подход. Я умею молчать |
| dlg_11_7_g.mp3 | ответ в разговоре (свой) | Umbriel | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_7_f_g.mp3 | ответ в разговоре (свой) | Despina | conspiratorial, low voice, warm, friendly | Для тебя — могила. Никому ни слова |
| dlg_11_8_g.mp3 | ответ в разговоре (холоден) | Umbriel | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_8_f_g.mp3 | ответ в разговоре (холоден) | Despina | conspiratorial, low voice, cold, curt | Деньги взяты. Разговора не было |
| dlg_11_9_g.mp3 | ответ в разговоре (недруг) | Umbriel | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_11_9_f_g.mp3 | ответ в разговоре (недруг) | Despina | conspiratorial, low voice, hostile | Деньги возьму, но друзьями нам не быть |
| dlg_12_0_g.mp3 | ответ в разговоре | Umbriel | offended, indignant | За кого вы меня держите? |
| dlg_12_0_f_g.mp3 | ответ в разговоре | Despina | offended, indignant | За кого вы меня держите? |
| dlg_12_1_g.mp3 | ответ в разговоре | Umbriel | offended, indignant | Уберите это, пока я не позвал стражу |
| dlg_12_1_f_g.mp3 | ответ в разговоре | Despina | offended, indignant | Уберите это, пока я не позвала стражу |
| dlg_12_2_g.mp3 | ответ в разговоре | Umbriel | offended, indignant | Меня не купишь |
| dlg_12_2_f_g.mp3 | ответ в разговоре | Despina | offended, indignant | Меня не купишь |
| dlg_12_3_g.mp3 | ответ в разговоре | Umbriel | offended, indignant | Деньги держите при себе |
| dlg_12_3_f_g.mp3 | ответ в разговоре | Despina | offended, indignant | Деньги держите при себе |
| dlg_12_4_g.mp3 | ответ в разговоре (честный) | Umbriel | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_4_f_g.mp3 | ответ в разговоре (честный) | Despina | offended, indignant, sincere | Честь не продаётся. Ступайте |
| dlg_12_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | offended, indignant, haughty | Вы смеете? Мне? |
| dlg_12_6_g.mp3 | ответ в разговоре (фанатик) | Umbriel | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_6_f_g.mp3 | ответ в разговоре (фанатик) | Despina | offended, indignant, zealous, fervent | Боги видят, что вы сделали |
| dlg_12_7_g.mp3 | ответ в разговоре (трус) | Umbriel | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_7_f_g.mp3 | ответ в разговоре (трус) | Despina | offended, indignant, timid, nervous | Нет-нет, я в таком не участвую! |
| dlg_12_8_g.mp3 | ответ в разговоре (свой) | Umbriel | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_8_f_g.mp3 | ответ в разговоре (свой) | Despina | offended, indignant, warm, friendly | От тебя — и такое? Обидно |
| dlg_12_9_g.mp3 | ответ в разговоре (недруг) | Umbriel | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_9_f_g.mp3 | ответ в разговоре (недруг) | Despina | offended, indignant, hostile | Ещё раз — и позову стражу |
| dlg_12_10_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_12_10_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | offended, indignant, grateful, warm | Вам я и так помогаю, зачем деньги? |
| dlg_13_0_g.mp3 | ответ в разговоре | Umbriel | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_0_f_g.mp3 | ответ в разговоре | Despina | correcting, slightly condescending | Вы путаете. Так говорят приезжие |
| dlg_13_1_g.mp3 | ответ в разговоре | Umbriel | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_1_f_g.mp3 | ответ в разговоре | Despina | correcting, slightly condescending | Это вы где-то не то прочитали |
| dlg_13_2_g.mp3 | ответ в разговоре | Umbriel | correcting, slightly condescending | У нас так не говорят |
| dlg_13_2_f_g.mp3 | ответ в разговоре | Despina | correcting, slightly condescending | У нас так не говорят |
| dlg_13_3_g.mp3 | ответ в разговоре | Umbriel | correcting, slightly condescending | Близко, но нет |
| dlg_13_3_f_g.mp3 | ответ в разговоре | Despina | correcting, slightly condescending | Близко, но нет |
| dlg_13_4_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_4_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | correcting, slightly condescending, haughty | Нахватались по верхам. Бывает у чужаков |
| dlg_13_5_g.mp3 | ответ в разговоре (рациональный) | Umbriel | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_5_f_g.mp3 | ответ в разговоре (рациональный) | Despina | correcting, slightly condescending, calm, rational | Неверно. Проверьте, откуда вы это взяли |
| dlg_13_6_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_6_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | correcting, slightly condescending, stern, old-fashioned | Так только в новых книжках пишут, у нас по-другому |
| dlg_13_7_g.mp3 | ответ в разговоре (холоден) | Umbriel | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_7_f_g.mp3 | ответ в разговоре (холоден) | Despina | correcting, slightly condescending, cold, curt | Прежде чем умничать, узнайте хоть что-то |
| dlg_13_8_g.mp3 | ответ в разговоре (свой) | Umbriel | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_13_8_f_g.mp3 | ответ в разговоре (свой) | Despina | correcting, slightly condescending, warm, friendly | Не то, друг. Но за старание спасибо |
| dlg_14_0_g.mp3 | ответ в разговоре | Umbriel | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_0_f_g.mp3 | ответ в разговоре | Despina | pleasantly surprised, warm | Редко кто из чужих знает это |
| dlg_14_1_g.mp3 | ответ в разговоре | Umbriel | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_1_f_g.mp3 | ответ в разговоре | Despina | pleasantly surprised, warm | Вот это да — будто свой |
| dlg_14_2_g.mp3 | ответ в разговоре | Umbriel | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_2_f_g.mp3 | ответ в разговоре | Despina | pleasantly surprised, warm | Где вы этому научились? |
| dlg_14_3_g.mp3 | ответ в разговоре | Umbriel | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_3_f_g.mp3 | ответ в разговоре | Despina | pleasantly surprised, warm | Теперь с вами можно говорить по-настоящему |
| dlg_14_4_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_4_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | pleasantly surprised, warm, stern, old-fashioned | Уважаю. Обычай — это корни |
| dlg_14_5_g.mp3 | ответ в разговоре (добрый) | Umbriel | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_5_f_g.mp3 | ответ в разговоре (добрый) | Despina | pleasantly surprised, warm, kind, warm | Приятно! Садитесь, поговорим |
| dlg_14_6_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | pleasantly surprised, warm, haughty | Не ожидал от чужака |
| dlg_14_6_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | pleasantly surprised, warm, haughty | Не ожидала от чужака |
| dlg_14_7_g.mp3 | ответ в разговоре (недруг) | Umbriel | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_7_f_g.mp3 | ответ в разговоре (недруг) | Despina | pleasantly surprised, warm, hostile | Даже недруг, а обычай знает. Уважаю |
| dlg_14_8_g.mp3 | ответ в разговоре (свой) | Umbriel | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_8_f_g.mp3 | ответ в разговоре (свой) | Despina | pleasantly surprised, warm, warm, friendly | Ты у нас уже почти свой |
| dlg_14_9_g.mp3 | ответ в разговоре (холоден) | Umbriel | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_14_9_f_g.mp3 | ответ в разговоре (холоден) | Despina | pleasantly surprised, warm, cold, curt | Хм. Удивили |
| dlg_15_0_g.mp3 | ответ в разговоре | Umbriel | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_0_f_g.mp3 | ответ в разговоре | Despina | suspicious, slow | Вы чего-то не договариваете? |
| dlg_15_1_g.mp3 | ответ в разговоре | Umbriel | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_1_f_g.mp3 | ответ в разговоре | Despina | suspicious, slow | Что-то в вашем рассказе не сходится |
| dlg_15_2_g.mp3 | ответ в разговоре | Umbriel | suspicious, slow | А дальше? Где остальное? |
| dlg_15_2_f_g.mp3 | ответ в разговоре | Despina | suspicious, slow | А дальше? Где остальное? |
| dlg_15_3_g.mp3 | ответ в разговоре | Umbriel | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_3_f_g.mp3 | ответ в разговоре | Despina | suspicious, slow | Полуправда хуже лжи, знаете ли |
| dlg_15_4_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | suspicious, slow, suspicious | Я так и знал, что вы темните |
| dlg_15_4_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | suspicious, slow, suspicious | Я так и знала, что вы темните |
| dlg_15_5_g.mp3 | ответ в разговоре (рациональный) | Umbriel | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_5_f_g.mp3 | ответ в разговоре (рациональный) | Despina | suspicious, slow, calm, rational | Нет второй половины. Где она? |
| dlg_15_6_g.mp3 | ответ в разговоре (хитрый) | Umbriel | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_6_f_g.mp3 | ответ в разговоре (хитрый) | Despina | suspicious, slow, sly | Недомолвки — мой хлеб. Меня так не проведёшь |
| dlg_15_7_g.mp3 | ответ в разговоре (свой) | Umbriel | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_7_f_g.mp3 | ответ в разговоре (свой) | Despina | suspicious, slow, warm, friendly | Друг, от меня-то зачем таиться? |
| dlg_15_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | suspicious, slow, hostile | Опять хитрите. Всё вижу |
| dlg_15_9_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_15_9_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | suspicious, slow, resentful, bitter | Один раз вы уже обманули. Хватит |
| dlg_16_0_g.mp3 | ответ в разговоре | Umbriel | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_0_f_g.mp3 | ответ в разговоре | Despina | contemptuous, cold | Врёте. И плохо врёте |
| dlg_16_1_g.mp3 | ответ в разговоре | Umbriel | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_1_f_g.mp3 | ответ в разговоре | Despina | contemptuous, cold | Сказки рассказывайте детям |
| dlg_16_2_g.mp3 | ответ в разговоре | Umbriel | contemptuous, cold | Не держите меня за дурака |
| dlg_16_2_f_g.mp3 | ответ в разговоре | Despina | contemptuous, cold | Не держите меня за дурака |
| dlg_16_3_g.mp3 | ответ в разговоре | Umbriel | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_3_f_g.mp3 | ответ в разговоре | Despina | contemptuous, cold | Ложь у вас на лбу написана |
| dlg_16_4_g.mp3 | ответ в разговоре (честный) | Umbriel | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_4_f_g.mp3 | ответ в разговоре (честный) | Despina | contemptuous, cold, sincere | Лгать мне в лицо? Как не стыдно |
| dlg_16_5_g.mp3 | ответ в разговоре (хитрый) | Umbriel | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_5_f_g.mp3 | ответ в разговоре (хитрый) | Despina | contemptuous, cold, sly | Врать надо тоньше. Учитесь |
| dlg_16_6_g.mp3 | ответ в разговоре (жестокий) | Umbriel | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_6_f_g.mp3 | ответ в разговоре (жестокий) | Despina | contemptuous, cold, harsh, cruel | Ещё одно враньё — и язык укорочу |
| dlg_16_7_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | contemptuous, cold, suspicious | Я с первого слова знал, что врёте |
| dlg_16_7_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | contemptuous, cold, suspicious | Я с первого слова знала, что врёте |
| dlg_16_8_g.mp3 | ответ в разговоре (свой) | Umbriel | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_8_f_g.mp3 | ответ в разговоре (свой) | Despina | contemptuous, cold, warm, friendly | Зачем врёшь своему? Обидно |
| dlg_16_9_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_9_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | contemptuous, cold, resentful, bitter | Опять за старое? Второй раз не поверю |
| dlg_16_10_g.mp3 | ответ в разговоре (недруг) | Umbriel | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_16_10_f_g.mp3 | ответ в разговоре (недруг) | Despina | contemptuous, cold, hostile | Лгун. Все будут знать |
| dlg_17_0_g.mp3 | ответ в разговоре | Umbriel | frightened, pleading | Только не надо... я скажу |
| dlg_17_0_f_g.mp3 | ответ в разговоре | Despina | frightened, pleading | Только не надо... я скажу |
| dlg_17_1_g.mp3 | ответ в разговоре | Umbriel | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_1_f_g.mp3 | ответ в разговоре | Despina | frightened, pleading | Хорошо, хорошо! Всё скажу |
| dlg_17_2_g.mp3 | ответ в разговоре | Umbriel | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_2_f_g.mp3 | ответ в разговоре | Despina | frightened, pleading | Не трогайте меня, я всё сделаю |
| dlg_17_3_g.mp3 | ответ в разговоре | Umbriel | frightened, pleading | Спокойно… договоримся |
| dlg_17_3_f_g.mp3 | ответ в разговоре | Despina | frightened, pleading | Спокойно… договоримся |
| dlg_17_4_g.mp3 | ответ в разговоре (трус) | Umbriel | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_4_f_g.mp3 | ответ в разговоре (трус) | Despina | frightened, pleading, timid, nervous | Пощадите! Всё, что хотите! |
| dlg_17_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | frightened, pleading, haughty | …Вы об этом пожалеете. Но — ладно |
| dlg_17_6_g.mp3 | ответ в разговоре (смелый) | Umbriel | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_6_f_g.mp3 | ответ в разговоре (смелый) | Despina | frightened, pleading, bold, confident | Ладно. Ваша сила. Пока |
| dlg_17_7_g.mp3 | ответ в разговоре (недруг) | Umbriel | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_7_f_g.mp3 | ответ в разговоре (недруг) | Despina | frightened, pleading, hostile | Ненавижу вас. Но скажу |
| dlg_17_8_g.mp3 | ответ в разговоре (холоден) | Umbriel | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_17_8_f_g.mp3 | ответ в разговоре (холоден) | Despina | frightened, pleading, cold, curt | Уберите. Всё скажу |
| dlg_18_0_g.mp3 | ответ в разговоре | Umbriel | defiant, threatening | Убери железо, пока цел |
| dlg_18_0_f_g.mp3 | ответ в разговоре | Despina | defiant, threatening | Убери железо, пока цел |
| dlg_18_1_g.mp3 | ответ в разговоре | Umbriel | defiant, threatening | Не на того напал |
| dlg_18_1_f_g.mp3 | ответ в разговоре | Despina | defiant, threatening | Не на того напал |
| dlg_18_2_g.mp3 | ответ в разговоре | Umbriel | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_2_f_g.mp3 | ответ в разговоре | Despina | defiant, threatening | Пугать меня вздумал? Стража! |
| dlg_18_3_g.mp3 | ответ в разговоре | Umbriel | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_3_f_g.mp3 | ответ в разговоре | Despina | defiant, threatening | Сейчас ты об этом пожалеешь |
| dlg_18_4_g.mp3 | ответ в разговоре (смелый) | Umbriel | defiant, threatening, bold, confident | Я и не таких видал. Стража! |
| dlg_18_4_f_g.mp3 | ответ в разговоре (смелый) | Despina | defiant, threatening, bold, confident | Я и не таких видала. Стража! |
| dlg_18_5_g.mp3 | ответ в разговоре (жестокий) | Umbriel | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_5_f_g.mp3 | ответ в разговоре (жестокий) | Despina | defiant, threatening, harsh, cruel | Попробуй только — останешься без руки |
| dlg_18_6_g.mp3 | ответ в разговоре (честный) | Umbriel | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_6_f_g.mp3 | ответ в разговоре (честный) | Despina | defiant, threatening, sincere | Угроз я не боюсь. Стража, сюда! |
| dlg_18_7_g.mp3 | ответ в разговоре (свой) | Umbriel | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_7_f_g.mp3 | ответ в разговоре (свой) | Despina | defiant, threatening, warm, friendly | Ты что, своего пугать вздумал? |
| dlg_18_8_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_18_8_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | defiant, threatening, resentful, bitter | Вот оно, твоё настоящее лицо |
| dlg_19_0_g.mp3 | ответ в разговоре | Umbriel | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_0_f_g.mp3 | ответ в разговоре | Despina | tense, hushed, nervous | Чего вы хотите? Только тихо |
| dlg_19_1_g.mp3 | ответ в разговоре | Umbriel | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_1_f_g.mp3 | ответ в разговоре | Despina | tense, hushed, nervous | Ладно… Что вам нужно? |
| dlg_19_2_g.mp3 | ответ в разговоре | Umbriel | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_2_f_g.mp3 | ответ в разговоре | Despina | tense, hushed, nervous | Не здесь. Говорите, чего хотите |
| dlg_19_3_g.mp3 | ответ в разговоре | Umbriel | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_3_f_g.mp3 | ответ в разговоре | Despina | tense, hushed, nervous | Тише. Договоримся |
| dlg_19_4_g.mp3 | ответ в разговоре (трус) | Umbriel | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_4_f_g.mp3 | ответ в разговоре (трус) | Despina | tense, hushed, nervous, timid, nervous | Только никому! Я сделаю, что скажете |
| dlg_19_5_g.mp3 | ответ в разговоре (хитрый) | Umbriel | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_5_f_g.mp3 | ответ в разговоре (хитрый) | Despina | tense, hushed, nervous, sly | Хорошо сыграно. Каковы условия? |
| dlg_19_6_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_6_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | tense, hushed, nervous, haughty | Вы пожалеете об этом. Но — говорите |
| dlg_19_7_g.mp3 | ответ в разговоре (недруг) | Umbriel | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_19_7_f_g.mp3 | ответ в разговоре (недруг) | Despina | tense, hushed, nervous, hostile | Будьте вы прокляты. Говорите, что нужно |
| dlg_20_0_g.mp3 | ответ в разговоре | Umbriel | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_0_f_g.mp3 | ответ в разговоре | Despina | defiant, bitter | Рассказывайте кому хотите. Мне терять нечего |
| dlg_20_1_g.mp3 | ответ в разговоре | Umbriel | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_1_f_g.mp3 | ответ в разговоре | Despina | defiant, bitter | Шантажом меня не возьмёшь |
| dlg_20_2_g.mp3 | ответ в разговоре | Umbriel | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_2_f_g.mp3 | ответ в разговоре | Despina | defiant, bitter | Иди и рассказывай. Я не боюсь |
| dlg_20_3_g.mp3 | ответ в разговоре | Umbriel | defiant, bitter | Ищите кого попугливее |
| dlg_20_3_f_g.mp3 | ответ в разговоре | Despina | defiant, bitter | Ищите кого попугливее |
| dlg_20_4_g.mp3 | ответ в разговоре (смелый) | Umbriel | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_4_f_g.mp3 | ответ в разговоре (смелый) | Despina | defiant, bitter, bold, confident | Пусть знают все. Мне скрывать нечего |
| dlg_20_5_g.mp3 | ответ в разговоре (честный) | Umbriel | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_5_f_g.mp3 | ответ в разговоре (честный) | Despina | defiant, bitter, sincere | Лучше правда, чем жить у вас на крючке |
| dlg_20_6_g.mp3 | ответ в разговоре (жестокий) | Umbriel | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_6_f_g.mp3 | ответ в разговоре (жестокий) | Despina | defiant, bitter, harsh, cruel | Скажешь хоть слово — и тебя не найдут |
| dlg_20_7_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_20_7_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | defiant, bitter, resentful, bitter | Я вас больше не боюсь |
| dlg_21_0_g.mp3 | ответ в разговоре | Umbriel | angry, threatening | Ещё слово — и будет драка |
| dlg_21_0_f_g.mp3 | ответ в разговоре | Despina | angry, threatening | Ещё слово — и будет драка |
| dlg_21_1_g.mp3 | ответ в разговоре | Umbriel | angry, threatening | Не зли меня |
| dlg_21_1_f_g.mp3 | ответ в разговоре | Despina | angry, threatening | Не зли меня |
| dlg_21_2_g.mp3 | ответ в разговоре | Umbriel | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_2_f_g.mp3 | ответ в разговоре | Despina | angry, threatening | Думаешь, я дам себя разозлить? Не выйдет |
| dlg_21_3_g.mp3 | ответ в разговоре | Umbriel | angry, threatening | Иди своей дорогой |
| dlg_21_3_f_g.mp3 | ответ в разговоре | Despina | angry, threatening | Иди своей дорогой |
| dlg_21_4_g.mp3 | ответ в разговоре (жестокий) | Umbriel | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_4_f_g.mp3 | ответ в разговоре (жестокий) | Despina | angry, threatening, harsh, cruel | Язык свой придержи, а то вырву |
| dlg_21_5_g.mp3 | ответ в разговоре (добрый) | Umbriel | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_5_f_g.mp3 | ответ в разговоре (добрый) | Despina | angry, threatening, kind, warm | Не надо так. Я не хочу ссоры |
| dlg_21_6_g.mp3 | ответ в разговоре (свой) | Umbriel | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_6_f_g.mp3 | ответ в разговоре (свой) | Despina | angry, threatening, warm, friendly | Не надо, друг. Не порти то, что было |
| dlg_21_7_g.mp3 | ответ в разговоре (недруг) | Umbriel | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_21_7_f_g.mp3 | ответ в разговоре (недруг) | Despina | angry, threatening, hostile | Давно хочется дать вам по зубам |
| dlg_22_0_g.mp3 | ответ в разговоре | Umbriel | easygoing, indifferent | Бывает |
| dlg_22_0_f_g.mp3 | ответ в разговоре | Despina | easygoing, indifferent | Бывает |
| dlg_22_1_g.mp3 | ответ в разговоре | Umbriel | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_1_f_g.mp3 | ответ в разговоре | Despina | easygoing, indifferent | Что ж, не всякий разговор к добру |
| dlg_22_2_g.mp3 | ответ в разговоре | Umbriel | easygoing, indifferent | Ваше право |
| dlg_22_2_f_g.mp3 | ответ в разговоре | Despina | easygoing, indifferent | Ваше право |
| dlg_22_3_g.mp3 | ответ в разговоре | Umbriel | easygoing, indifferent | Понимаю |
| dlg_22_3_f_g.mp3 | ответ в разговоре | Despina | easygoing, indifferent | Понимаю |
| dlg_22_4_g.mp3 | ответ в разговоре (добрый) | Umbriel | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_4_f_g.mp3 | ответ в разговоре (добрый) | Despina | easygoing, indifferent, kind, warm | Ничего, в другой раз |
| dlg_22_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | easygoing, indifferent, haughty | Как угодно |
| dlg_22_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | easygoing, indifferent, haughty | Как угодно |
| dlg_22_6_g.mp3 | ответ в разговоре (свой) | Umbriel | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_6_f_g.mp3 | ответ в разговоре (свой) | Despina | easygoing, indifferent, warm, friendly | Ничего, друг. В другой раз |
| dlg_22_7_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_7_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | easygoing, indifferent, grateful, warm | Не беда. Вы и так много сделали |
| dlg_22_8_g.mp3 | ответ в разговоре (холоден) | Umbriel | easygoing, indifferent, cold, curt | Как знаете |
| dlg_22_8_f_g.mp3 | ответ в разговоре (холоден) | Despina | easygoing, indifferent, cold, curt | Как знаете |
| dlg_23_0_g.mp3 | ответ в разговоре | Umbriel | impatient, tired | Мы об этом говорили |
| dlg_23_0_f_g.mp3 | ответ в разговоре | Despina | impatient, tired | Мы об этом говорили |
| dlg_23_1_g.mp3 | ответ в разговоре | Umbriel | impatient, tired | Я уже ответил вам сегодня |
| dlg_23_1_f_g.mp3 | ответ в разговоре | Despina | impatient, tired | Я уже ответила вам сегодня |
| dlg_23_2_g.mp3 | ответ в разговоре | Umbriel | impatient, tired | Опять вы с тем же? |
| dlg_23_2_f_g.mp3 | ответ в разговоре | Despina | impatient, tired | Опять вы с тем же? |
| dlg_23_3_g.mp3 | ответ в разговоре | Umbriel | impatient, tired | Сегодня — хватит об этом |
| dlg_23_3_f_g.mp3 | ответ в разговоре | Despina | impatient, tired | Сегодня — хватит об этом |
| dlg_23_4_g.mp3 | ответ в разговоре (подозрительный) | Umbriel | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_4_f_g.mp3 | ответ в разговоре (подозрительный) | Despina | impatient, tired, suspicious | Зачем спрашивать дважды? |
| dlg_23_5_g.mp3 | ответ в разговоре (добрый) | Umbriel | impatient, tired, kind, warm | Я же сказал уже — не сердитесь |
| dlg_23_5_f_g.mp3 | ответ в разговоре (добрый) | Despina | impatient, tired, kind, warm | Я же сказала уже — не сердитесь |
| dlg_23_6_g.mp3 | ответ в разговоре (жадный) | Umbriel | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_6_f_g.mp3 | ответ в разговоре (жадный) | Despina | impatient, tired, greedy, calculating | За второй ответ — отдельная плата |
| dlg_23_7_g.mp3 | ответ в разговоре (свой) | Umbriel | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_7_f_g.mp3 | ответ в разговоре (свой) | Despina | impatient, tired, warm, friendly | Друг, ты повторяешься |
| dlg_23_8_g.mp3 | ответ в разговоре (недруг) | Umbriel | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_23_8_f_g.mp3 | ответ в разговоре (недруг) | Despina | impatient, tired, hostile | Сколько можно? Уходите |
| dlg_24_0_g.mp3 | ответ в разговоре | Umbriel | disappointed, hurt | Я на вас рассчитывал |
| dlg_24_0_f_g.mp3 | ответ в разговоре | Despina | disappointed, hurt | Я на вас рассчитывала |
| dlg_24_1_g.mp3 | ответ в разговоре (свой) | Umbriel | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_1_f_g.mp3 | ответ в разговоре (свой) | Despina | disappointed, hurt, warm, friendly | От друга — и такое |
| dlg_24_2_g.mp3 | ответ в разговоре (помнит обиду) | Umbriel | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_24_2_f_g.mp3 | ответ в разговоре (помнит обиду) | Despina | disappointed, hurt, resentful, bitter | Опять подвели. Как всегда |
| dlg_25_0_g.mp3 | ответ в разговоре | Umbriel | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_0_f_g.mp3 | ответ в разговоре | Despina | willing, open, conversational | Слушайте, расскажу, что знаю |
| dlg_25_1_g.mp3 | ответ в разговоре | Umbriel | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_1_f_g.mp3 | ответ в разговоре | Despina | willing, open, conversational | Спрашиваете — отвечу |
| dlg_25_2_g.mp3 | ответ в разговоре | Umbriel | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_2_f_g.mp3 | ответ в разговоре | Despina | willing, open, conversational | Садитесь, раз интересно |
| dlg_25_3_g.mp3 | ответ в разговоре (жадный) | Umbriel | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_3_f_g.mp3 | ответ в разговоре (жадный) | Despina | willing, open, conversational, greedy, calculating | Скажу. Но в следующий раз — за монету |
| dlg_25_4_g.mp3 | ответ в разговоре (трус) | Umbriel | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_4_f_g.mp3 | ответ в разговоре (трус) | Despina | willing, open, conversational, timid, nervous | Только тихо, ладно? Вот что тут творится |
| dlg_25_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | willing, open, conversational, haughty | Так и быть, просвещу вас |
| dlg_25_6_g.mp3 | ответ в разговоре (свой) | Umbriel | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_6_f_g.mp3 | ответ в разговоре (свой) | Despina | willing, open, conversational, warm, friendly | Тебе — всё как есть |
| dlg_25_7_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_7_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | willing, open, conversational, grateful, warm | Вам расскажу без утайки |
| dlg_25_8_g.mp3 | ответ в разговоре (холоден) | Umbriel | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_25_8_f_g.mp3 | ответ в разговоре (холоден) | Despina | willing, open, conversational, cold, curt | Коротко: вот что тут было |
| dlg_26_0_g.mp3 | ответ в разговоре | Umbriel | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_0_f_g.mp3 | ответ в разговоре | Despina | patient, explaining again | Да, про это уже шла речь. Вот как было |
| dlg_26_1_g.mp3 | ответ в разговоре | Umbriel | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_1_f_g.mp3 | ответ в разговоре | Despina | patient, explaining again | Повторю, раз не расслышали |
| dlg_26_2_g.mp3 | ответ в разговоре | Umbriel | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_2_f_g.mp3 | ответ в разговоре | Despina | patient, explaining again | Слушайте ещё раз, внимательнее |
| dlg_26_3_g.mp3 | ответ в разговоре (рациональный) | Umbriel | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_3_f_g.mp3 | ответ в разговоре (рациональный) | Despina | patient, explaining again, calm, rational | По порядку, ещё раз |
| dlg_26_4_g.mp3 | ответ в разговоре (свой) | Umbriel | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_4_f_g.mp3 | ответ в разговоре (свой) | Despina | patient, explaining again, warm, friendly | Для тебя — хоть дважды |
| dlg_26_5_g.mp3 | ответ в разговоре (холоден) | Umbriel | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_26_5_f_g.mp3 | ответ в разговоре (холоден) | Despina | patient, explaining again, cold, curt | Последний раз повторяю |
| dlg_27_0_g.mp3 | ответ в разговоре | Umbriel | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_0_f_g.mp3 | ответ в разговоре | Despina | curt, closing the topic | Больше мне добавить нечего |
| dlg_27_1_g.mp3 | ответ в разговоре | Umbriel | curt, closing the topic | Что было — рассказано |
| dlg_27_1_f_g.mp3 | ответ в разговоре | Despina | curt, closing the topic | Что было — рассказано |
| dlg_27_2_g.mp3 | ответ в разговоре | Umbriel | curt, closing the topic | Больше ничего не знаю |
| dlg_27_2_f_g.mp3 | ответ в разговоре | Despina | curt, closing the topic | Больше ничего не знаю |
| dlg_27_3_g.mp3 | ответ в разговоре (недруг) | Umbriel | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_3_f_g.mp3 | ответ в разговоре (недруг) | Despina | curt, closing the topic, hostile | Отстаньте со своими расспросами |
| dlg_27_4_g.mp3 | ответ в разговоре (свой) | Umbriel | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_27_4_f_g.mp3 | ответ в разговоре (свой) | Despina | curt, closing the topic, warm, friendly | Честно, друг, больше ничего не знаю |
| dlg_28_0_g.mp3 | ответ в разговоре | Umbriel | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_0_f_g.mp3 | ответ в разговоре | Despina | worried, grave | Времена неспокойные, вот что скажу |
| dlg_28_1_g.mp3 | ответ в разговоре | Umbriel | worried, grave | В мире всякое творится, слушайте |
| dlg_28_1_f_g.mp3 | ответ в разговоре | Despina | worried, grave | В мире всякое творится, слушайте |
| dlg_28_2_g.mp3 | ответ в разговоре | Umbriel | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_2_f_g.mp3 | ответ в разговоре | Despina | worried, grave | Цены растут, войны не кончаются — вот вам и новости |
| dlg_28_3_g.mp3 | ответ в разговоре (фанатик) | Umbriel | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_3_f_g.mp3 | ответ в разговоре (фанатик) | Despina | worried, grave, zealous, fervent | Боги гневаются, вот и неспокойно |
| dlg_28_4_g.mp3 | ответ в разговоре (прагматик) | Umbriel | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_4_f_g.mp3 | ответ в разговоре (прагматик) | Despina | worried, grave, matter-of-fact | Торговля встала, вот главное |
| dlg_28_5_g.mp3 | ответ в разговоре (мятежник) | Umbriel | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_5_f_g.mp3 | ответ в разговоре (мятежник) | Despina | worried, grave, rebellious | Власть жиреет, народ беднеет — вот и все новости |
| dlg_28_6_g.mp3 | ответ в разговоре (свой) | Umbriel | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_28_6_f_g.mp3 | ответ в разговоре (свой) | Despina | worried, grave, warm, friendly | Тебе скажу как есть: худо в мире |
| dlg_29_0_g.mp3 | ответ в разговоре | Umbriel | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_0_f_g.mp3 | ответ в разговоре | Despina | dismissive, grumbling | Моё дело — свой двор, а не весь мир |
| dlg_29_1_g.mp3 | ответ в разговоре | Umbriel | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_1_f_g.mp3 | ответ в разговоре | Despina | dismissive, grumbling | Не знаю я, что там за горами |
| dlg_29_2_g.mp3 | ответ в разговоре | Umbriel | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_2_f_g.mp3 | ответ в разговоре | Despina | dismissive, grumbling | Мне бы тут управиться, не до мира |
| dlg_29_3_g.mp3 | ответ в разговоре (недруг) | Umbriel | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_3_f_g.mp3 | ответ в разговоре (недруг) | Despina | dismissive, grumbling, hostile | Про мир спросите у кого-нибудь другого |
| dlg_29_4_g.mp3 | ответ в разговоре (холоден) | Umbriel | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_29_4_f_g.mp3 | ответ в разговоре (холоден) | Despina | dismissive, grumbling, cold, curt | Не интересуюсь |
| dlg_30_0_g.mp3 | ответ в разговоре | Umbriel | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_0_f_g.mp3 | ответ в разговоре | Despina | knowing, reassuring | Понимаю. Можете на меня положиться |
| dlg_30_1_g.mp3 | ответ в разговоре | Umbriel | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_1_f_g.mp3 | ответ в разговоре | Despina | knowing, reassuring | Можно не продолжать, всё ясно |
| dlg_30_2_g.mp3 | ответ в разговоре | Umbriel | knowing, reassuring | Намёк понят |
| dlg_30_2_f_g.mp3 | ответ в разговоре | Despina | knowing, reassuring | Намёк понят |
| dlg_30_3_g.mp3 | ответ в разговоре (хитрый) | Umbriel | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_3_f_g.mp3 | ответ в разговоре (хитрый) | Despina | knowing, reassuring, sly | Понимаю больше, чем вы сказали |
| dlg_30_4_g.mp3 | ответ в разговоре (свой) | Umbriel | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_30_4_f_g.mp3 | ответ в разговоре (свой) | Despina | knowing, reassuring, warm, friendly | Для тебя — сделаю |
| dlg_31_0_g.mp3 | ответ в разговоре | Umbriel | convinced, trusting | Раз так — верю вам |
| dlg_31_0_f_g.mp3 | ответ в разговоре | Despina | convinced, trusting | Раз так — верю вам |
| dlg_31_1_g.mp3 | ответ в разговоре | Umbriel | convinced, trusting | Ну, если так, другое дело |
| dlg_31_1_f_g.mp3 | ответ в разговоре | Despina | convinced, trusting | Ну, если так, другое дело |
| dlg_31_2_g.mp3 | ответ в разговоре | Umbriel | convinced, trusting | Что ж, похоже на правду |
| dlg_31_2_f_g.mp3 | ответ в разговоре | Despina | convinced, trusting | Что ж, похоже на правду |
| dlg_31_3_g.mp3 | ответ в разговоре (добрый) | Umbriel | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_3_f_g.mp3 | ответ в разговоре (добрый) | Despina | convinced, trusting, kind, warm | Верю. Людям надо верить |
| dlg_31_4_g.mp3 | ответ в разговоре (свой) | Umbriel | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_31_4_f_g.mp3 | ответ в разговоре (свой) | Despina | convinced, trusting, warm, friendly | Тебе — верю |
| dlg_32_0_g.mp3 | ответ в разговоре | Umbriel | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_0_f_g.mp3 | ответ в разговоре | Despina | angry outburst, losing temper | Да что вы понимаете! Ладно, слушайте |
| dlg_32_1_g.mp3 | ответ в разговоре | Umbriel | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_1_f_g.mp3 | ответ в разговоре | Despina | angry outburst, losing temper | Довели! Так знайте же |
| dlg_32_2_g.mp3 | ответ в разговоре | Umbriel | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_2_f_g.mp3 | ответ в разговоре | Despina | angry outburst, losing temper | Хватит! Скажу, раз так хотите |
| dlg_32_3_g.mp3 | ответ в разговоре (жестокий) | Umbriel | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_3_f_g.mp3 | ответ в разговоре (жестокий) | Despina | angry outburst, losing temper, harsh, cruel | Ах так? Получайте правду |
| dlg_32_4_g.mp3 | ответ в разговоре (недруг) | Umbriel | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_32_4_f_g.mp3 | ответ в разговоре (недруг) | Despina | angry outburst, losing temper, hostile | Ненавижу вас. Но слушайте |
| dlg_33_0_g.mp3 | ответ в разговоре | Umbriel | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_0_f_g.mp3 | ответ в разговоре | Despina | heated, arguing loudly | Вы не знаете, о чём говорите! |
| dlg_33_1_g.mp3 | ответ в разговоре | Umbriel | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_1_f_g.mp3 | ответ в разговоре | Despina | heated, arguing loudly | Чушь! Всё не так |
| dlg_33_2_g.mp3 | ответ в разговоре | Umbriel | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_2_f_g.mp3 | ответ в разговоре | Despina | heated, arguing loudly | Спорить с вами — время терять |
| dlg_33_3_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_3_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | heated, arguing loudly, haughty | Куда вам со мной спорить |
| dlg_33_4_g.mp3 | ответ в разговоре (свой) | Umbriel | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_4_f_g.mp3 | ответ в разговоре (свой) | Despina | heated, arguing loudly, warm, friendly | Нет, друг, тут ты неправ |
| dlg_33_5_g.mp3 | ответ в разговоре (недруг) | Umbriel | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_33_5_f_g.mp3 | ответ в разговоре (недруг) | Despina | heated, arguing loudly, hostile | От вас другого и не ждёшь |
| dlg_34_0_g.mp3 | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_0_f_g.mp3 | ответ в разговоре | Despina | thoughtful, reverent, conceding | Может, боги и вправду так рассудили |
| dlg_34_1_g.mp3 | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_1_f_g.mp3 | ответ в разговоре | Despina | thoughtful, reverent, conceding | Над этим стоит помолиться |
| dlg_34_2_g.mp3 | ответ в разговоре | Umbriel | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_2_f_g.mp3 | ответ в разговоре | Despina | thoughtful, reverent, conceding | В ваших словах есть вера |
| dlg_34_3_g.mp3 | ответ в разговоре (фанатик) | Umbriel | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_3_f_g.mp3 | ответ в разговоре (фанатик) | Despina | thoughtful, reverent, conceding, zealous, fervent | Вы говорите, как истинно верующий |
| dlg_34_4_g.mp3 | ответ в разговоре (свой) | Umbriel | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_34_4_f_g.mp3 | ответ в разговоре (свой) | Despina | thoughtful, reverent, conceding, warm, friendly | С тобой и о богах говорить легко |
| dlg_35_0_g.mp3 | ответ в разговоре | Umbriel | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_0_f_g.mp3 | ответ в разговоре | Despina | outraged, indignant, pious | Не вам судить о богах! |
| dlg_35_1_g.mp3 | ответ в разговоре | Umbriel | outraged, indignant, pious | Святотатство! |
| dlg_35_1_f_g.mp3 | ответ в разговоре | Despina | outraged, indignant, pious | Святотатство! |
| dlg_35_2_g.mp3 | ответ в разговоре | Umbriel | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_2_f_g.mp3 | ответ в разговоре | Despina | outraged, indignant, pious | Боги вам этого не простят |
| dlg_35_3_g.mp3 | ответ в разговоре (фанатик) | Umbriel | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_3_f_g.mp3 | ответ в разговоре (фанатик) | Despina | outraged, indignant, pious, zealous, fervent | Замолчите, пока небо не услышало! |
| dlg_35_4_g.mp3 | ответ в разговоре (рациональный) | Umbriel | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_4_f_g.mp3 | ответ в разговоре (рациональный) | Despina | outraged, indignant, pious, calm, rational | Вера не спор, её не переспоришь |
| dlg_35_5_g.mp3 | ответ в разговоре (свой) | Umbriel | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_35_5_f_g.mp3 | ответ в разговоре (свой) | Despina | outraged, indignant, pious, warm, friendly | Не надо, друг. Это святое |
| dlg_36_0_g.mp3 | ответ в разговоре | Umbriel | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_0_f_g.mp3 | ответ в разговоре | Despina | thoughtful, grudging agreement | В этом есть правда, как ни крути |
| dlg_36_1_g.mp3 | ответ в разговоре | Umbriel | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_1_f_g.mp3 | ответ в разговоре | Despina | thoughtful, grudging agreement | С податями и вправду перегнули |
| dlg_36_2_g.mp3 | ответ в разговоре | Umbriel | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_2_f_g.mp3 | ответ в разговоре | Despina | thoughtful, grudging agreement | Может, и вправду пора менять порядки |
| dlg_36_3_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_3_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | thoughtful, grudging agreement, stern, old-fashioned | Не люблю перемен, но тут вы правы |
| dlg_36_4_g.mp3 | ответ в разговоре (реформатор) | Umbriel | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_4_f_g.mp3 | ответ в разговоре (реформатор) | Despina | thoughtful, grudging agreement, eager | Наконец-то кто-то говорит дело |
| dlg_36_5_g.mp3 | ответ в разговоре (свой) | Umbriel | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_36_5_f_g.mp3 | ответ в разговоре (свой) | Despina | thoughtful, grudging agreement, warm, friendly | Вот и у меня те же мысли |
| dlg_37_0_g.mp3 | ответ в разговоре | Umbriel | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_0_f_g.mp3 | ответ в разговоре | Despina | stern, warning, uneasy | Власть — не вашего ума дело |
| dlg_37_1_g.mp3 | ответ в разговоре | Umbriel | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_1_f_g.mp3 | ответ в разговоре | Despina | stern, warning, uneasy | Про такое вслух не говорят |
| dlg_37_2_g.mp3 | ответ в разговоре | Umbriel | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_2_f_g.mp3 | ответ в разговоре | Despina | stern, warning, uneasy | Держава как стояла, так и будет стоять |
| dlg_37_3_g.mp3 | ответ в разговоре (мятежник) | Umbriel | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_3_f_g.mp3 | ответ в разговоре (мятежник) | Despina | stern, warning, uneasy, rebellious | Власть? Да она нас и не спрашивает |
| dlg_37_4_g.mp3 | ответ в разговоре (традиционалист) | Umbriel | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_4_f_g.mp3 | ответ в разговоре (традиционалист) | Despina | stern, warning, uneasy, stern, old-fashioned | Порядок заведён не нами |
| dlg_37_5_g.mp3 | ответ в разговоре (недруг) | Umbriel | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_37_5_f_g.mp3 | ответ в разговоре (недруг) | Despina | stern, warning, uneasy, hostile | Донести бы на вас за такие речи |
| dlg_38_0_g.mp3 | ответ в разговоре | Umbriel | offended, cold | У нас так не кланяются |
| dlg_38_0_f_g.mp3 | ответ в разговоре | Despina | offended, cold | У нас так не кланяются |
| dlg_38_1_g.mp3 | ответ в разговоре | Umbriel | offended, cold | Это что, насмешка? |
| dlg_38_1_f_g.mp3 | ответ в разговоре | Despina | offended, cold | Это что, насмешка? |
| dlg_38_2_g.mp3 | ответ в разговоре | Umbriel | offended, cold | Не знаете обычаев — не берите |
| dlg_38_2_f_g.mp3 | ответ в разговоре | Despina | offended, cold | Не знаете обычаев — не берите |
| dlg_38_3_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_3_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | offended, cold, haughty | Чужакам наших обычаев не понять |
| dlg_38_4_g.mp3 | ответ в разговоре (свой) | Umbriel | offended, cold, warm, friendly | Ничего, научишься |
| dlg_38_4_f_g.mp3 | ответ в разговоре (свой) | Despina | offended, cold, warm, friendly | Ничего, научишься |
| dlg_39_0_g.mp3 | ответ в разговоре | Umbriel | satisfied, businesslike | По рукам, договорились |
| dlg_39_0_f_g.mp3 | ответ в разговоре | Despina | satisfied, businesslike | По рукам, договорились |
| dlg_39_1_g.mp3 | ответ в разговоре | Umbriel | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_1_f_g.mp3 | ответ в разговоре | Despina | satisfied, businesslike | Что ж, такое обоим подходит |
| dlg_39_2_g.mp3 | ответ в разговоре | Umbriel | satisfied, businesslike | Уговор так уговор |
| dlg_39_2_f_g.mp3 | ответ в разговоре | Despina | satisfied, businesslike | Уговор так уговор |
| dlg_39_3_g.mp3 | ответ в разговоре (жадный) | Umbriel | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_3_f_g.mp3 | ответ в разговоре (жадный) | Despina | satisfied, businesslike, greedy, calculating | По рукам, но моя доля побольше |
| dlg_39_4_g.mp3 | ответ в разговоре (свой) | Umbriel | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_4_f_g.mp3 | ответ в разговоре (свой) | Despina | satisfied, businesslike, warm, friendly | Со своим всегда договоримся |
| dlg_39_5_g.mp3 | ответ в разговоре (недруг) | Umbriel | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_39_5_f_g.mp3 | ответ в разговоре (недруг) | Despina | satisfied, businesslike, hostile | Договорились. Но глаз с вас не спущу |
| dlg_40_0_g.mp3 | ответ в разговоре | Umbriel | firm, dissatisfied | Так не договоримся |
| dlg_40_0_f_g.mp3 | ответ в разговоре | Despina | firm, dissatisfied | Так не договоримся |
| dlg_40_1_g.mp3 | ответ в разговоре | Umbriel | firm, dissatisfied | Мне это не с руки |
| dlg_40_1_f_g.mp3 | ответ в разговоре | Despina | firm, dissatisfied | Мне это не с руки |
| dlg_40_2_g.mp3 | ответ в разговоре | Umbriel | firm, dissatisfied | Ищите другой уговор |
| dlg_40_2_f_g.mp3 | ответ в разговоре | Despina | firm, dissatisfied | Ищите другой уговор |
| dlg_40_3_g.mp3 | ответ в разговоре (недруг) | Umbriel | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_3_f_g.mp3 | ответ в разговоре (недруг) | Despina | firm, dissatisfied, hostile | С вами никаких уговоров |
| dlg_40_4_g.mp3 | ответ в разговоре (свой) | Umbriel | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_40_4_f_g.mp3 | ответ в разговоре (свой) | Despina | firm, dissatisfied, warm, friendly | Прости, друг, так не выйдет |
| dlg_41_0_g.mp3 | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_0_f_g.mp3 | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Давняя это история. Слушайте |
| dlg_41_1_g.mp3 | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_1_f_g.mp3 | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Было это давно, слушайте |
| dlg_41_2_g.mp3 | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_2_f_g.mp3 | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Старики так рассказывают |
| dlg_41_3_g.mp3 | ответ в разговоре | Umbriel | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_3_f_g.mp3 | ответ в разговоре | Despina | storyteller, unhurried, a little mysterious | Про это у нас каждый ребёнок знает |
| dlg_41_4_g.mp3 | ответ в разговоре (фанатик) | Umbriel | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_4_f_g.mp3 | ответ в разговоре (фанатик) | Despina | storyteller, unhurried, a little mysterious, zealous, fervent | Слушайте, и да будут боги свидетелями |
| dlg_41_5_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_5_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | storyteller, unhurried, a little mysterious, haughty | Вам, приезжим, полезно знать |
| dlg_41_6_g.mp3 | ответ в разговоре (рациональный) | Umbriel | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_6_f_g.mp3 | ответ в разговоре (рациональный) | Despina | storyteller, unhurried, a little mysterious, calm, rational | По летописям было так |
| dlg_41_7_g.mp3 | ответ в разговоре (трус) | Umbriel | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_7_f_g.mp3 | ответ в разговоре (трус) | Despina | storyteller, unhurried, a little mysterious, timid, nervous | Только это между нами, ладно? |
| dlg_41_8_g.mp3 | ответ в разговоре (свой) | Umbriel | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_8_f_g.mp3 | ответ в разговоре (свой) | Despina | storyteller, unhurried, a little mysterious, warm, friendly | Тебе расскажу, как деды рассказывали |
| dlg_41_9_g.mp3 | ответ в разговоре (помнит добро) | Umbriel | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_9_f_g.mp3 | ответ в разговоре (помнит добро) | Despina | storyteller, unhurried, a little mysterious, grateful, warm | Вам — с удовольствием расскажу |
| dlg_41_10_g.mp3 | ответ в разговоре (холоден) | Umbriel | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_10_f_g.mp3 | ответ в разговоре (холоден) | Despina | storyteller, unhurried, a little mysterious, cold, curt | Коротко расскажу, и хватит |
| dlg_41_11_g.mp3 | ответ в разговоре (недруг) | Umbriel | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_41_11_f_g.mp3 | ответ в разговоре (недруг) | Despina | storyteller, unhurried, a little mysterious, hostile | Расскажу. Может, поумнеете |
| dlg_42_0_g.mp3 | ответ в разговоре | Umbriel | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_0_f_g.mp3 | ответ в разговоре | Despina | dismissive, busy | Историю пусть книжники рассказывают |
| dlg_42_1_g.mp3 | ответ в разговоре | Umbriel | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_1_f_g.mp3 | ответ в разговоре | Despina | dismissive, busy | Не до сказок мне сейчас |
| dlg_42_2_g.mp3 | ответ в разговоре | Umbriel | dismissive, busy | Не знаю я старины |
| dlg_42_2_f_g.mp3 | ответ в разговоре | Despina | dismissive, busy | Не знаю я старины |
| dlg_42_3_g.mp3 | ответ в разговоре (высокомерный) | Umbriel | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_3_f_g.mp3 | ответ в разговоре (высокомерный) | Despina | dismissive, busy, haughty | Не для чужих ушей наша история |
| dlg_42_4_g.mp3 | ответ в разговоре (недруг) | Umbriel | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_4_f_g.mp3 | ответ в разговоре (недруг) | Despina | dismissive, busy, hostile | С вами прошлым делиться? Нет |
| dlg_42_5_g.mp3 | ответ в разговоре (свой) | Umbriel | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| dlg_42_5_f_g.mp3 | ответ в разговоре (свой) | Despina | dismissive, busy, warm, friendly | Прости, друг, не мастак я рассказывать |
| hero_istoriya_g.mp3 | герой: ход «Спросить об истории» | Algieba | curious, respectful | Расскажи, что было в этих краях прежде. |
