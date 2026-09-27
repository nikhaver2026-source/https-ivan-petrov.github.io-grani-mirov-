# sounds/voice_npc — жители говорят сами

Приветствие жителя у прилавка и то, что на ходу бросают стражник, латник,
солдат гарнизона, горожанин и житель посада. Прежде эти строки читал голос
игры в кавычках; теперь у каждой своя запись и своя интонация.

Записей: 321

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
| Umbriel | лёгкий, разговорный | приветствие жителя у прилавка, мужское | 110 |
| Despina | мягкий | приветствие жительницы у прилавка, женское | 110 |

## Как сделано и как проверено

- **Интонация под смысл.** У каждой строки своя короткая интонация (поле
  `style`): стражник предостерегает, ворчит или устало вздыхает, торговец
  зазывает, кузнец отрывист, лекарь заботлив, жрец говорит вполголоса,
  недруг цедит угрозу, житель посада шепчет со страхом. У всех — «natural
  pace»: без неё интонации «шёпотом» и «угрожающе» растягивали речь.
- **Пакетами.** В одном запросе два голоса и до семидесяти четырёх строк; всё —
  пять запросов.
- **Разрезка и разборчивость.** Запись пакета дробится по паузам и склеивается
  в строки по распознанному тексту; каждую строку распознаёт русская модель
  GigaAM (sherpa-onnx, `nemo-ctc-giga-am-v2-russian`): не больше 15 % ошибочных
  букв и не медленнее шести знаков в секунду.
- **Громкость.** −18 LUFS по EBU R128 (у записей от -18.6 до -17.8),
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
| street_folk_4_f_g.mp3 | горожанин | Sulafat | curious gossip | Слыхал, обоз пришёл с востока. |
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
| street_folk_18_f_g.mp3 | горожанин | Sulafat | weary, groaning | Ох, спина. Весь день мешки носил. |
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
| greet_tma_4_f_g.mp3 | приветствие: житель тёмных земель | Despina | hushed, fearful, hurried | Спросишь лишнее — забуду, что видел тебя. |
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
| greet_svoy_0_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Рад тебя видеть, друг. |
| greet_svoy_1_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_1_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя — всегда время. |
| greet_svoy_2_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_2_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | А вот и ты! Заходи. |
| greet_svoy_3_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_3_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Своих не забываем. Садись. |
| greet_svoy_4_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_4_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | О, наш человек! Что нового? |
| greet_svoy_5_g.mp3 | приветствие: старый знакомый | Umbriel | joyful, warm, glad to see a friend | Для тебя отложил кое-что. Смотри. |
| greet_svoy_5_f_g.mp3 | приветствие: старый знакомый | Despina | joyful, warm, glad to see a friend | Для тебя отложил кое-что. Смотри. |
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
