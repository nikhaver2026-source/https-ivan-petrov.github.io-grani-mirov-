# sounds/voice — живая речь народов

Четыреста семь записей русской речи: оклик расы и народа (280), слово ремесла
(46 мужских и 46 женских), общее слово (7 и 7) и голос героя (21). С версии 3.7
все они произнесены нейроголосами **Gemini** (Google), модель
`gemini-3.8-flash-tts`. Запись моно, 44,1 кГц, MP3 320 кбит/с, громкость
−18 LUFS (у каждой реплики от −18,7 до −17,3), пики не выше −1,2 дБ. Имена
файлов оканчиваются на `_g`: служебный работник кэширует записи как
неизменные, поэтому новое поколение голосов живёт под новыми именами.

## Откуда

Речь синтезирована 25 сентября 2026 года через Gemini API (Interactions API,
https://ai.google.dev/gemini-api/docs/speech-generation) ключами API автора игры.
Голоса — готовые голоса Gemini (prebuilt voices), тринадцать из тридцати. Автор
голосов — Google; голоса синтетические и не воспроизводят голос какого-либо
живого человека.

**Условия.** По Gemini API Additional Terms of Service
(https://ai.google.dev/gemini-api/terms) Google не заявляет прав на созданное
содержимое («Google won't claim ownership over that content»), за его
использование отвечает автор игры; соблюдается Generative AI
Prohibited Use Policy (https://policies.google.com/terms/generative-ai/use-policy).
Отдельной лицензии на файлы не требуется; источник назван здесь и в главе
руководства «Кто написал эти звуки».

**Почему тут синтез, когда в игре только живые записи.** Правило «никаких
синтезированных звуков» относится к звукам мира: шагу, удару, двери, ветру.
Речь — другое: живых русских записей на двести восемьдесят народов взять негде,
и озвучку заказал сам автор игры.

## Голоса

Регистр народа задан самим голосом, а не сдвигом высоты: прежний опыт показал,
что сдвиг портит звук. Число в таблице народа (`VOICE_RACES`) — лишь лёгкая
поправка темпа для ремесленных и общих реплик, чтобы и они шли в регистре народа.

| Голос Gemini | Каков | Кто говорит | Записей |
|---|---|---|---|
| Algenib | хриплый, низкий | огры, орки, тролли, минотавры, циклопы, големы и другие грубые народы низкого регистра | 31 |
| Charon | низкий, ровный | великаны, титаны, драконы-прародители, левиафаны, энты, вирмы — древние и огромные | 35 |
| Orus | твёрдый | гномы, кентавры, оборотни, тифлинги, рунные карлы и другие народы пониже среднего | 37 |
| Enceladus | с придыханием | тенеходцы, вещуны, курганные шаманы, безымянные, сфинксы — таинственные | 19 |
| Achird | дружелюбный | люди и близкие к ним народы среднего регистра | 29 |
| Puck | живой | полурослики, сатиры, фавны, лепреконы, аракокры — малые и бойкие | 28 |
| Gacrux | зрелый | наги, кровавая знать, морозные вейры — низкий женский регистр | 14 |
| Sulafat | тёплый | лунные и серебряные эльфы, ламии, русалки, полуденницы | 30 |
| Achernar | мягкий | эльфы, феи, сильфы, сирины, дриады, фениксы — лёгкие и певучие | 37 |
| Leda | звонкий | гоблинки, кобольды, норушки, гарпии — бойкие и звонкие | 20 |
| Iapetus | чёткий | мужское слово ремесла и мужские общие слова | 53 |
| Erinome | чёткий | женское слово ремесла и женские общие слова | 53 |
| Algieba | ровный, уверенный | голос героя: двадцать один ход разговора | 21 |

## Как сделано и как проверено

- **Пакетами.** В одном запросе два голоса и до семидесяти четырёх реплик; у
  каждой реплики своя короткая интонация (поле `style`): «rough and gruff» у
  грубых народов, «soft and melodic» у лёгких, «whispering» у Шепчущего, «in
  pain» у слова боли, «menacing» у угрозы героя. Все реплики вместе с
  переозвучками — одиннадцать запросов.
- **Разрезка.** Запись пакета дробится по паузам мельче, чем нужно, и куски
  склеиваются в реплики по распознанному тексту; одиночные вдохи по краям
  отброшены, спереди 80 мс тишины, сзади 100 мс.
- **Разборчивость.** Каждую реплику распознаёт русская модель GigaAM
  (sherpa-onnx, `nemo-ctc-giga-am-v2-russian`). Порог — не больше 12 % ошибочных
  букв и не медленнее восьми знаков в секунду. Первые дубли трёх голосов
  (Algenib, Gacrux, Enceladus) вышли заметно медленнее нужного, а в одном пакете
  местами прозвучало слово «пауза» — эти шестьдесят четыре реплики переозвучены
  с интонацией «natural pace»; ещё семь — отдельными дублями.
- **Итог.** 369 реплик распознаются буква в букву, 406 — с долей ошибок не выше
  12 %; одну — «Конь чует дорогу раньше всадника» — распознаватель слышит как
  «кончуй»: это слияние на стыке слов, а не ошибка голоса. Средняя оценка
  DNSMOS P.835 OVRL — 3,17 (у прежних записей 3,14); ниже всех голос с придыханием
  Enceladus — придыхание оценка считает шумом, а у таинственных народов оно
  нарочно.

## Все записи

### Оклик расы и народа (race_*_g) — 280

| Файл | Народ | Что говорит | Голос |
|---|---|---|---|
| race_lyudi_g.mp3 | Люди | «Чужак в наших полях виден издалека» | Achird |
| race_elfy_g.mp3 | Эльфы | «Ты ступаешь громко даже когда молчишь» | Achernar |
| race_gnomy_g.mp3 | Гномы | «Долг записан в камне, а камень терпелив» | Orus |
| race_orki_g.mp3 | Орки | «Кто не держит слово, тот не удержит и топор» | Algenib |
| race_polurosliki_g.mp3 | Полурослики | «Дорога кормит идущего, садись и ешь» | Puck |
| race_gobliny_g.mp3 | Гоблины | «Мне бы твой сапог, а тебе бы мой нож» | Leda |
| race_trolli_g.mp3 | Тролли | «Камень я переживу, тебя тем более» | Algenib |
| race_ogry_g.mp3 | Огры | «Мало говорю, много ем, редко ошибаюсь» | Algenib |
| race_koboldy_g.mp3 | Кобольды | «Мы копали тут раньше вас всех» | Leda |
| race_zverolyudy_g.mp3 | Зверолюды | «Ты пахнешь дорогой и чужим страхом» | Orus |
| race_garpii_g.mp3 | Гарпии | «Сверху всё видно, и тебя тоже видели» | Leda |
| race_minotavry_g.mp3 | Минотавры | «В лабиринте прямых путей не бывает» | Algenib |
| race_kentavry_g.mp3 | Кентавры | «Пешему со мной не по пути» | Orus |
| race_vervolfy_g.mp3 | Вервольфы | «Днём мы соседи, ночью я за себя не отвечаю» | Orus |
| race_driady_g.mp3 | Дриады | «Бери столько, сколько вырастет снова» | Achernar |
| race_satiry_g.mp3 | Сатиры | «Сначала выпьем, потом решим, враги мы или нет» | Puck |
| race_favny_g.mp3 | Фавны | «Свирель слышна дальше, чем крик» | Puck |
| race_fei_g.mp3 | Феи | «Кто нас не видит, тот про нас и не врёт» | Achernar |
| race_leprekony_g.mp3 | Лепреконы | «Счёт дружбе не помеха, а основа» | Puck |
| race_krovavye_fei_g.mp3 | Кровавые феи | «Мы берём мелочью, но берём всегда» | Achernar |
| race_rusalki_g.mp3 | Русалки | «Море возвращает своё, и тебя вернёт» | Sulafat |
| race_undiny_g.mp3 | Ундины | «Вода не держит следов, а память держит» | Achernar |
| race_arakokry_g.mp3 | Аракокры | «Небо не делится, и дорога тоже» | Puck |
| race_pegasy_g.mp3 | Пегасы | «Тяжёлого я не понесу» | Achernar |
| race_nebesnye_tabunschiki_g.mp3 | Небесные табунщики | «Табун ходит там, где ветер ровный» | Puck |
| race_oblachnye_skakuny_g.mp3 | Облачные скакуны | «Держись крепче или не держись вовсе» | Achernar |
| race_yascherolyudy_g.mp3 | Ящеролюды | «Холодная кровь не значит пустое сердце» | Algenib |
| race_ciklopy_g.mp3 | Циклопы | «Один глаз, зато смотрит прямо» | Algenib |
| race_nagi_g.mp3 | Наги | «Суди сам, но судить будут и тебя» | Gacrux |
| race_tiflingi_g.mp3 | Тифлинги | «За мою кровь мне уже заплатили сполна» | Orus |
| race_dzhinny_g.mp3 | Джинны | «Имя — это договор, и ты его уже подписал» | Achird |
| race_peschanye_dzhinny_g.mp3 | Песчаные джинны | «В песках слово дороже воды» | Puck |
| race_golemy_g.mp3 | Големы | «Мне приказали стоять, и я стою» | Algenib |
| race_kamennorozhdennye_g.mp3 | Каменнорождённые | «Мы старше ваших имён и переживём их» | Algenib |
| race_silfy_g.mp3 | Сильфы | «Мы бываем там, где вы только дышите» | Achernar |
| race_motylkovye_g.mp3 | Мотыльковые | «На свет летят не от глупости, а от нужды» | Achernar |
| race_steklyannye_silfidy_g.mp3 | Стеклянные сильфиды | «Тронешь — зазвенит, и все услышат» | Achernar |
| race_salamandry_g.mp3 | Саламандры | «Сгори и начни заново, это не угроза» | Achird |
| race_runnye_karly_g.mp3 | Рунные карлы | «Рука дрогнет — руна солжёт» | Orus |
| race_kostyanye_shamany_g.mp3 | Костяные шаманы | «Кость помнит дольше, чем мясо» | Algenib |
| race_drakonidy_g.mp3 | Дракониды | «Кровь предков горяча, а долг холоден» | Algenib |
| race_tenehodcy_g.mp3 | Тенеходцы | «Всё имеет цену, включая молчание» | Enceladus |
| race_pepelnye_velikany_g.mp3 | Пепельные великаны | «Мы ходим там, где всё уже сгорело» | Charon |
| race_moroznye_veyry_g.mp3 | Морозные вейры | «Зима рассудит, кто был прав» | Gacrux |
| race_kristallidy_g.mp3 | Кристаллиды | «Свет проходит сквозь нас и не врёт» | Achernar |
| race_efirnye_stranniki_g.mp3 | Эфирные странники | «Мы здесь ненадолго, как и ты» | Puck |
| race_lunnye_elfy_g.mp3 | Лунные эльфы | «Ночью видно больше, чем днём» | Sulafat |
| race_feniksy_g.mp3 | Фениксы | «Я уже умирал, это не страшно» | Achernar |
| race_svetlorozhdennye_g.mp3 | Светлорождённые | «Клятва дороже жизни, и жизнь это знает» | Sulafat |
| race_aasimary_g.mp3 | Аасимары | «Мне велено помогать, а не выбирать кому» | Achird |
| race_drevnie_enty_g.mp3 | Древние энты | «Спешка — болезнь коротко живущих» | Charon |
| race_lesoviki_g.mp3 | Лесовики | «Лес пропустил тебя, значит и я пропущу» | Puck |
| race_shtormovye_virmy_g.mp3 | Штормовые вирмы | «Гром идёт впереди нас, а мы не спешим» | Charon |
| race_zvezdnye_tkachi_g.mp3 | Звёздные ткачи | «Нить уже протянута, ты просто её не видишь» | Achernar |
| race_glubinnye_leviafany_g.mp3 | Глубинные левиафаны | «На нашей глубине свет — чужак» | Charon |
| race_hronoscy_g.mp3 | Хроносцы | «Мы уже говорили это, ты просто не помнишь» | Puck |
| race_pustotniki_g.mp3 | Пустотники | «Там, откуда мы, нет ни верха, ни низа» | Enceladus |
| race_pervorozhdennye_zari_g.mp3 | Перворождённые Зари | «Первый свет был наш, остальное ваше» | Sulafat |
| race_titany_grani_g.mp3 | Титаны Грани | «Мы держали небо, пока вы учились ходить» | Charon |
| race_drakony_praroditeli_g.mp3 | Драконы-прародители | «Имя, которым ты нас зовёшь, мы дали себе сами» | Charon |
| race_gribozhory_g.mp3 | Грибожоры | «Сырость кормит, а свет только сушит» | Algenib |
| race_pepelnye_deti_g.mp3 | Пепельные дети | «Пепел тёплый, садись, пока не остыл» | Sulafat |
| race_kozhany_g.mp3 | Кожаны | «Днём нас нет, и ночью нас тоже нет» | Puck |
| race_utoplenniki_g.mp3 | Утопленники | «Вода нас не отпустила, и тебя не отпустит» | Algenib |
| race_padalschiki_korvaksa_g.mp3 | Падальщики Корвакса | «Мы приходим после, и нам всегда есть что взять» | Enceladus |
| race_chervehody_g.mp3 | Червеходы | «Ход прорыт, а идти или нет — твоё дело» | Algenib |
| race_bezymyannye_g.mp3 | Безымянные | «Имени нет, спрашивать нечего» | Enceladus |
| race_golodnye_g.mp3 | Голодные | «Мы не злые, мы просто никогда не сыты» | Algenib |
| race_kostyanki_g.mp3 | Костянки | «Мясо уходит, кость остаётся» | Enceladus |
| race_shepchuschie_g.mp3 | Шепчущие | «Слушай ниже, я говорю не сюда» | Gacrux |
| race_krovniki_g.mp3 | Кровники | «Долг крови считают до последней капли» | Gacrux |
| race_zerkalcy_g.mp3 | Зеркальцы | «Посмотри на меня и скажи, кто из нас настоящий» | Sulafat |
| race_snovidcy_g.mp3 | Сновидцы | «Ты спишь, просто ещё не заметил» | Achernar |
| race_mnogorukie_g.mp3 | Многорукие | «Чем больше рук, тем меньше споров» | Algenib |
| race_tleyuschie_g.mp3 | Тлеющие | «Горим медленно, зато давно» | Orus |
| race_slepcy_niksora_g.mp3 | Слепцы Никсора | «Глаза нам мешали, мы их отдали» | Enceladus |
| race_vyvodok_ulury_g.mp3 | Выводок Улуры | «Нас много, и мать считает каждого» | Leda |
| race_pustotelye_g.mp3 | Пустотелые | «Внутри у нас место, и оно не занято» | Charon |
| race_krovavaya_znat_g.mp3 | Кровавая знать | «Кровь бывает голубой, а бывает нужной» | Gacrux |
| race_kostyanye_schetchiki_g.mp3 | Костяные счётчики | «Мы считаем всё, и тебя уже посчитали» | Enceladus |
| race_dvoyniki_g.mp3 | Двойники | «Я уже был тобой, и мне не понравилось» | Achird |
| race_shelkopryady_snov_g.mp3 | Шелкопряды снов | «Нить сна тонка, но держит крепче верёвки» | Achernar |
| race_gnilokoronnye_g.mp3 | Гнилокоронные | «Корона осталась, голова не обязательна» | Algenib |
| race_solyanye_vdovy_g.mp3 | Соляные вдовы | «Соль сушит слёзы, поэтому мы их не льём» | Gacrux |
| race_pepelnye_kuznecy_g.mp3 | Пепельные кузнецы | «Горн остыл, а заказы остались» | Charon |
| race_drevnie_bezymyannye_g.mp3 | Древние безымянные | «Имени нет, а память есть» | Charon |
| race_terzayuschie_g.mp3 | Терзающие | «Мы не спорим, мы разбираем» | Algenib |
| race_uglezhogi_izoldy_g.mp3 | Углежоги Изольды | «Уголь горит, пока о нём не вспомнят» | Orus |
| race_provozvestniki_g.mp3 | Провозвестники | «День назначен, и он уже близко» | Achird |
| race_nasledniki_harga_g.mp3 | Наследники Харга | «Харг ушёл, а счёт остался за нами» | Orus |
| race_lunnye_obratnye_g.mp3 | Лунные обратные | «Мы растём, когда луна убывает» | Sulafat |
| race_poslednie_g.mp3 | Последние | «После нас никого, и это не жалоба» | Enceladus |
| race_pepelokrylye_g.mp3 | Пепелокрылые | «Крылья в пепле, а летим выше вас» | Achernar |
| race_kostokrylye_g.mp3 | Костокрылые | «Кость лёгкая, если её выточить» | Puck |
| race_zerkalnye_pticy_g.mp3 | Зеркальные птицы | «В небе отражается то, чего внизу нет» | Achernar |
| race_krovostrizhi_g.mp3 | Кровострижи | «Мы бьём на лету и не возвращаемся» | Leda |
| race_gnilokrylye_g.mp3 | Гнилокрылые | «Летим низко, пахнем скверно, зато долетаем» | Puck |
| race_solyanye_krachki_g.mp3 | Соляные крачки | «Над солью ветер ровный, держись за нами» | Achernar |
| race_uglekrylye_g.mp3 | Углекрылые | «Искры с крыльев падают, берегись» | Puck |
| race_sonnye_skaty_g.mp3 | Сонные скаты | «Мы спим в полёте, и это никому не мешает» | Charon |
| race_shepotokrylye_g.mp3 | Шёпотокрылые | «Наши крылья не шумят, потому и слышно нас поздно» | Achernar |
| race_mnogokrylye_g.mp3 | Многокрылые | «Считать крылья бесполезно, их больше» | Puck |
| race_provozvestniki_neba_g.mp3 | Провозвестники неба | «Сверху срок виден раньше» | Achird |
| race_pustokrylye_g.mp3 | Пустокрылые | «Под нами нет тени, посмотри сам» | Enceladus |
| race_terzayuschie_v_nebe_g.mp3 | Терзающие в небе | «Сверху выбирают, снизу только ждут» | Algenib |
| race_drevnie_krylatye_g.mp3 | Древние крылатые | «Небо было нашим до того, как стало вашим» | Charon |
| race_aeronidy_g.mp3 | Аэрониды | «Нас носит ветер, а не своя воля» | Achernar |
| race_sumerechniki_g.mp3 | Сумеречники | «Между днём и ночью есть полоса, мы в ней живём» | Puck |
| race_yadokrylye_g.mp3 | Ядокрылые | «Не дыши глубоко рядом с нами» | Leda |
| race_mnogoglazye_vestniki_g.mp3 | Многоглазые вестники | «Смотрим всеми глазами и всё равно не всё видим» | Gacrux |
| race_pepelnye_pegasy_g.mp3 | Пепельные пегасы | «Возим только тех, кто не боится золы» | Gacrux |
| race_poslednie_krylya_g.mp3 | Последние крылья | «Нас мало, поэтому мы считаем каждого» | Charon |
| race_bolotniki_g.mp3 | Болотники | «Иди за мной след в след, иначе болото тебя оставит» | Orus |
| race_kovylniki_g.mp3 | Ковыльники | «Ветер в степи один, а дорог под ним тысяча» | Sulafat |
| race_berestyaniki_g.mp3 | Берестяники | «Что записано на бересте, то и было» | Achird |
| race_deltoviki_g.mp3 | Дельтовики | «Река всегда знает, куда ей течь» | Sulafat |
| race_kunyaki_g.mp3 | Куньяки | «Меня тут не было, и ты меня не видел» | Puck |
| race_bobrecy_g.mp3 | Бобрецы | «Сначала плотина, разговоры потом» | Orus |
| race_skalniki_g.mp3 | Скальники | «На перевал без меня не ходи» | Achird |
| race_norushki_g.mp3 | Норушки | «Под полом всё слышно, и я всё слышала» | Leda |
| race_zemleroyki_g.mp3 | Землеройки | «Глаза врут, а земля никогда» | Orus |
| race_zhabolyudy_g.mp3 | Жаболюды | «Ква — это не песня, это предупреждение» | Orus |
| race_sychi_g.mp3 | Сычи | «Ночью видно то, что днём прячется» | Achird |
| race_solevary_g.mp3 | Солевары | «Соль и хлеб, путник, а там поговорим» | Achird |
| race_medvelaki_g.mp3 | Медвелаки | «Разбудишь зря — пожалеешь до весны» | Orus |
| race_lisoviny_g.mp3 | Лисовины | «Честная цена? Какая честная, такая и цена» | Leda |
| race_vodyaniki_g.mp3 | Водяники | «Без поклона в мою воду не заходи» | Algenib |
| race_kikimory_g.mp3 | Кикиморы | «Шорох в осоке — это я, а не ветер» | Leda |
| race_domoviki_g.mp3 | Домовики | «Кто печь бережёт, того и печь бережёт» | Puck |
| race_poleviki_g.mp3 | Полевики | «Межу не трогай, и хлеб будет» | Puck |
| race_vetrenicy_g.mp3 | Ветреницы | «Ветер принёс вести, а ты слушай» | Achernar |
| race_polozy_g.mp3 | Полозы | «Жилу покажу тому, кто не жаден» | Orus |
| race_ineeviki_g.mp3 | Инеевики | «Холод не злой, он честный» | Algenib |
| race_murashniki_g.mp3 | Мурашники | «Нас много, и каждый знает своё дело» | Leda |
| race_pryadilschiki_g.mp3 | Прядильщики | «Каждая нить куда-нибудь ведёт» | Sulafat |
| race_lamii_g.mp3 | Ламии | «Послушай песню, путник, она недолгая» | Sulafat |
| race_siriny_g.mp3 | Сирины | «Не слушай меня долго, дорогу забудешь» | Achernar |
| race_sfinksy_g.mp3 | Сфинксы | «Ответь, и пройдёшь. Не ответишь — останешься» | Enceladus |
| race_ognekrovnye_g.mp3 | Огнекровные | «Тронешь — обожжёшься. Предупреждаю один раз» | Orus |
| race_kamneglazy_g.mp3 | Камнеглазы | «Смотри в сторону, когда говоришь со мной» | Enceladus |
| race_tumanniki_g.mp3 | Туманники | «Меня не видно, но я здесь» | Sulafat |
| race_nochnicy_g.mp3 | Ночницы | «Темнота мне дом, а тебе дорога» | Achernar |
| race_pancirniki_g.mp3 | Панцирники | «Куда спешить? Я ещё успею» | Algenib |
| race_micelidy_g.mp3 | Мицелиды | «Все мы из одного корня, путник» | Gacrux |
| race_srebrorogi_g.mp3 | Сребророги | «Иди за светом, и выйдешь» | Sulafat |
| race_yantarniki_g.mp3 | Янтарники | «В янтаре всё хранится, и ты тоже сохранишься» | Sulafat |
| race_alkonosty_g.mp3 | Алконосты | «Поплачь, путник, а потом я спою» | Achernar |
| race_grifony_g.mp3 | Грифоны | «Выбери высоту, и я выберу тебя» | Orus |
| race_skalogrudye_velikany_g.mp3 | Скалогрудые великаны | «Моя наковальня — эта гора» | Charon |
| race_moroki_g.mp3 | Мороки | «Ты видишь меня таким, каким хочешь» | Sulafat |
| race_poludennicy_g.mp3 | Полуденницы | «В полдень работают, а не бродят» | Sulafat |
| race_zhemchuzhnye_sireny_g.mp3 | Жемчужные сирены | «Море помнит всех, кто в нём пел» | Achernar |
| race_runovedy_g.mp3 | Руноведы | «Каждая трещина в мире — это строка» | Orus |
| race_inistye_velikany_g.mp3 | Инистые великаны | «Зима не спешит, и я не спешу» | Charon |
| race_zhar_pticy_g.mp3 | Жар-птицы | «Одно перо — и ночь не страшна» | Achernar |
| race_gromovniki_g.mp3 | Громовники | «Слышишь раскат? Это я здороваюсь» | Charon |
| race_gorynychi_g.mp3 | Горынычи | «Три головы, а решать всё равно мне» | Charon |
| race_veschuny_g.mp3 | Вещуны | «Завтра я уже видел, а ты ещё нет» | Enceladus |
| race_hraniteli_poroga_g.mp3 | Хранители Порога | «Проходи, если пора. А если нет — возвращайся» | Charon |
| race_oblachnye_kity_g.mp3 | Облачные киты | «Я плыву, а берег сам ко мне приходит» | Charon |
| race_korni_mira_g.mp3 | Корни Мира | «Под тобой мы, путник, и мы держим» | Charon |
| race_beznachalnye_g.mp3 | Безначальные | «Я помню, как ты родился, и как ещё родишься» | Gacrux |
| race_pervye_zveri_g.mp3 | Первые Звери | «Каждый зверь в лесу — мой внук» | Charon |
| race_spyaschie_gory_g.mp3 | Спящие Горы | «Не буди меня без нужды, я держу мир» | Charon |
| race_rechane_g.mp3 | Речане | «Река кормит, река и судит» | Achird |
| race_sumerechnye_elfy_g.mp3 | Сумеречные эльфы | «На опушке видно обе стороны мира» | Achernar |
| race_mednoborcy_g.mp3 | Медноборцы | «Медь поёт, если её правильно ударить» | Orus |
| race_stepnye_orki_g.mp3 | Степные орки | «Вепрь бежит, орк правит, степь молчит» | Algenib |
| race_holmichi_g.mp3 | Холмичи | «Сначала обед, потом приключения» | Puck |
| race_svalochniki_g.mp3 | Свалочники | «Выбросил? Значит, моё» | Puck |
| race_svechnye_koboldy_g.mp3 | Свечные кобольды | «Без свечи в шахте ни шагу» | Leda |
| race_rysi_lyudi_g.mp3 | Рысьи люди | «Рысь ждёт, а потом не промахивается» | Achird |
| race_skalistye_garpii_g.mp3 | Скалистые гарпии | «Кричу громче бури, и буря слушает» | Leda |
| race_labirintniki_g.mp3 | Лабиринтники | «Выход есть всегда, но не для всех» | Algenib |
| race_kovylnye_kentavry_g.mp3 | Ковыльные кентавры | «Стрела быстрее ветра, если её пустил кентавр» | Orus |
| race_lunnye_volkolaki_g.mp3 | Лунные волколаки | «Сегодня луна не полная, тебе повезло» | Orus |
| race_gornye_arakokry_g.mp3 | Горные аракокры | «С высоты видно, кто врёт» | Puck |
| race_tinnye_yaschery_g.mp3 | Тинные ящеры | «Ил тёплый, а ты замёрз» | Orus |
| race_kuznechnye_ciklopy_g.mp3 | Кузнечные циклопы | «Один глаз, одна наковальня, один удар» | Charon |
| race_hramovye_nagi_g.mp3 | Храмовые наги | «Храм затоплен, но боги в нём не утонули» | Sulafat |
| race_pogranichnye_tiflingi_g.mp3 | Пограничные тифлинги | «Грань близко, а страх далеко» | Achird |
| race_gornovye_salamandry_g.mp3 | Горновые саламандры | «Холодно мне только без огня» | Achird |
| race_pechatniki_run_g.mp3 | Печатники рун | «Печать поставлена — дверь молчит» | Orus |
| race_kurgannye_shamany_g.mp3 | Курганные шаманы | «Курган помнит больше, чем летопись» | Enceladus |
| race_mednocheshuynye_g.mp3 | Медночешуйные | «Слово драконида крепче чешуи» | Orus |
| race_polnochnye_hodoki_g.mp3 | Полночные ходоки | «Полночь — моя дорога» | Enceladus |
| race_tleyuschie_ispoliny_g.mp3 | Тлеющие исполины | «Пепел тёплый, пока я здесь» | Charon |
| race_metelnye_veyry_g.mp3 | Метельные вейры | «Метель за мной, а ты вперёд иди» | Gacrux |
| race_zvonkie_kristallidy_g.mp3 | Звонкие кристаллиды | «Слышишь звон? Это я отвечаю» | Achernar |
| race_zvezdnye_skitalcy_g.mp3 | Звёздные скитальцы | «Между звёздами тоже есть дороги» | Puck |
| race_serebryanye_elfy_g.mp3 | Серебряные эльфы | «Луна — наша память о свете» | Sulafat |
| race_plamennye_vestniki_g.mp3 | Пламенные вестники | «Сгорю и вернусь с новостями» | Achernar |
| race_shkvalnye_virmy_g.mp3 | Шквальные вирмы | «Шторм — это мой шаг» | Charon |
| race_tkachi_sozvezdiy_g.mp3 | Ткачи созвездий | «Одна нить от звезды к тебе» | Achernar |
| race_bezdonnye_g.mp3 | Бездонные | «Там, где я живу, нет дна» | Charon |
| race_chasovschiki_vechnosti_g.mp3 | Часовщики вечности | «Минута у тебя, а вечность у меня» | Achird |
| race_deti_bezmolviya_g.mp3 | Дети безмолвия | «Тишина говорит громче слов» | Enceladus |
| race_rassvetnye_g.mp3 | Рассветные | «Первый луч мой, остальные твои» | Sulafat |
| race_stolpy_grani_g.mp3 | Столпы Грани | «Небо тяжёлое, но я держу» | Charon |
| race_drevneyshie_krylya_g.mp3 | Древнейшие крылья | «Я помню, когда горы были молоды» | Charon |
| race_gateviki_g.mp3 | Гатевики | «Гать держит тех, кто её уважает» | Achird |
| race_tabunschiki_kovylya_g.mp3 | Табунщики ковыля | «Конь чует дорогу раньше всадника» | Achird |
| race_gramotei_beresty_g.mp3 | Грамотеи бересты | «Каждое слово на бересте живёт сто лет» | Achird |
| race_plotogony_g.mp3 | Плотогоны | «Плот не тонет, если держать течение» | Achird |
| race_sosnovye_kunyaki_g.mp3 | Сосновые куньяки | «На сосне меня никто не достанет» | Leda |
| race_melniki_zaprud_g.mp3 | Мельники запруд | «Вода крутит колесо, а колесо кормит» | Orus |
| race_karnizniki_g.mp3 | Карнизники | «Шаг на карнизе один, и он верный» | Achird |
| race_ambarnye_norushki_g.mp3 | Амбарные норушки | «Зерно пересчитано, не беспокойся» | Leda |
| race_kornesluhi_g.mp3 | Корнеслухи | «Корень скажет, где вода» | Orus |
| race_trostnikovye_pevcy_g.mp3 | Тростниковые певцы | «Закат спели, теперь можно спать» | Orus |
| race_bashennye_sychi_g.mp3 | Башенные сычи | «С башни видно все звёзды и все беды» | Achird |
| race_varnichane_g.mp3 | Варничане | «Варница дымит — значит, соль будет» | Achird |
| race_bortniki_g.mp3 | Бортники | «Мёд мой, пчёлы мои, а ты гость» | Orus |
| race_ognehvostye_g.mp3 | Огнехвостые | «Хвост видишь? Больше ничего не увидишь» | Achernar |
| race_omutniki_g.mp3 | Омутники | «Омут тихий, пока ты тихий» | Algenib |
| race_osochnicy_g.mp3 | Осочницы | «В осоке тропа, а в тропе я» | Leda |
| race_zapechniki_g.mp3 | Запечники | «Печь тёплая, и мне тепло» | Puck |
| race_mezheviki_g.mp3 | Межевики | «Межа не для того, чтобы её топтать» | Puck |
| race_vyuzhnicy_g.mp3 | Вьюжницы | «Вьюга поёт, а я подпеваю» | Achernar |
| race_mednye_polozy_g.mp3 | Медные полозы | «Медь мне сестра, а ты мне кто?» | Orus |
| race_naledniki_g.mp3 | Наледники | «Наледь крепкая, пока я на ней» | Algenib |
| race_lesnye_murashi_g.mp3 | Лесные мураши | «Холм растёт, и мы растём» | Leda |
| race_shelkopryady_tishiny_g.mp3 | Шелкопряды тишины | «Тише, нить не любит шума» | Sulafat |
| race_oazisnye_lamii_g.mp3 | Оазисные ламии | «Вода есть, но за песню» | Sulafat |
| race_roschevye_siriny_g.mp3 | Рощевые сирины | «В роще поют, а не спорят» | Achernar |
| race_hraniteli_zagadok_g.mp3 | Хранители загадок | «Загадка у меня одна, ответов много» | Enceladus |
| race_gornokrovnye_g.mp3 | Горнокровные | «Лава мне по колено» | Orus |
| race_molchuny_vzglyada_g.mp3 | Молчуны взгляда | «Я уже сказал. Взглядом» | Enceladus |
| race_rassvetnye_tumanniki_g.mp3 | Рассветные туманники | «Солнце встанет, и меня не станет» | Sulafat |
| race_peschernye_nochnicy_g.mp3 | Пещерные ночницы | «В пещере эхо — мой второй голос» | Achernar |
| race_pribrezhnye_pancirniki_g.mp3 | Прибрежные панцирники | «Отмель тёплая, спешить некуда» | Algenib |
| race_gribnicy_glubin_g.mp3 | Грибницы глубин | «Сад под землёй растёт в темноте» | Gacrux |
| race_belye_lani_g.mp3 | Белые лани | «Я пришла — значит, беда рядом. Иди за мной» | Sulafat |
| race_yantarnye_ozherelniki_g.mp3 | Янтарные ожерельники | «На каждой бусине — прадед» | Sulafat |
| race_uteshitelnicy_g.mp3 | Утешительницы | «Горе уйдёт, песня останется» | Achernar |
| race_strazhi_zolotyh_gor_g.mp3 | Стражи золотых гор | «Золото тут есть. Тебе не достанется» | Orus |
| race_nakovalschiki_g.mp3 | Наковальщики | «Бью раз, и гора звенит» | Charon |
| race_zerkalnye_moroki_g.mp3 | Зеркальные мороки | «Посмотри в воду. Видишь? Это я» | Sulafat |
| race_zhneicy_poludnya_g.mp3 | Жнеицы полудня | «Жни, пока солнце высоко» | Sulafat |
| race_sadovnicy_glubin_g.mp3 | Садовницы глубин | «В саду на дне всегда тихо» | Achernar |
| race_sshivateli_grani_g.mp3 | Сшиватели Грани | «Трещина есть, а нить у меня» | Enceladus |
| race_yarly_vyugi_g.mp3 | Ярлы вьюги | «Ярл сказал — вьюга пришла» | Charon |
| race_sadovye_zhar_pticy_g.mp3 | Садовые жар-птицы | «В саду светло и ночью» | Achernar |
| race_raskatnye_g.mp3 | Раскатные | «Первый гром — это мой» | Charon |
| race_trehglavye_g.mp3 | Трёхглавые | «Три головы, три мнения» | Charon |
| race_voroni_veschuny_g.mp3 | Вороньи вещуны | «Будет так, как я сказал» | Enceladus |
| race_privratniki_g.mp3 | Привратники | «Дверь открою, но не сегодня» | Charon |
| race_oblachnye_pastuhi_g.mp3 | Облачные пастухи | «Туча за мной, и дождь за тучей» | Charon |
| race_glubinnye_korni_g.mp3 | Глубинные корни | «Земля бьётся, и я слышу» | Algenib |
| race_svideteli_g.mp3 | Свидетели | «Я видел это раньше тебя» | Gacrux |
| race_zverinye_praotcy_g.mp3 | Звериные праотцы | «Лес зовёт меня отцом» | Charon |
| race_sny_kamnya_g.mp3 | Сны камня | «Сплю и вижу камень» | Charon |
| race_gorcy_g.mp3 | Горцы | «Горы держат слово, и мы тоже» | Achird |
| race_tisovye_elfy_g.mp3 | Тисовые эльфы | «Тис гнётся, но не ломается» | Achird |
| race_zheleznoborodye_g.mp3 | Железнобородые | «Борода железная, слово тоже» | Orus |
| race_pepelnye_orki_g.mp3 | Пепельные орки | «Пепел во рту, огонь в сердце» | Algenib |
| race_rechnye_polurosliki_g.mp3 | Речные полурослики | «Лодка — это дом, который плавает» | Leda |
| race_peschernye_gobliny_g.mp3 | Пещерные гоблины | «В темноте я вижу, а ты нет» | Puck |
| race_lovushechniki_g.mp3 | Ловушечники | «Не наступай туда. И туда тоже» | Puck |
| race_barsuchi_lyudi_g.mp3 | Барсучьи люди | «Нора моя, и спорить не о чем» | Orus |
| race_vetrenye_garpii_g.mp3 | Ветреные гарпии | «Ветер в лицо — лучший ветер» | Leda |
| race_rogatye_strazhi_g.mp3 | Рогатые стражи | «Ворота мои, рога мои» | Algenib |
| race_lesnye_kentavry_g.mp3 | Лесные кентавры | «Лес лечит, а я помогаю» | Sulafat |
| race_serye_bratya_g.mp3 | Серые братья | «Стая рядом, даже когда её не видно» | Orus |
| race_beregovye_arakokry_g.mp3 | Береговые аракокры | «Море внизу, небо вверху, я посередине» | Leda |
| race_peschanye_yaschery_g.mp3 | Песчаные ящеры | «Жара — это просто тепло» | Orus |
| race_pastuhi_ciklopy_g.mp3 | Пастухи-циклопы | «Овцы считаны, все на месте» | Algenib |
| race_klyukvenniki_g.mp3 | Клюквенники | «Клюква кислая, а жизнь сладкая» | Sulafat |
| race_kumysniki_g.mp3 | Кумысники | «Кумыс пьют сидя, а скачут стоя» | Achird |
| race_lykodery_g.mp3 | Лыкодеры | «Лапти сплету, дорога сама пойдёт» | Achird |
| race_kamyshniki_g.mp3 | Камышники | «Камыш шумит — значит, всё спокойно» | Sulafat |
| race_skalnye_kunyaki_g.mp3 | Скальные куньяки | «В расщелине меня не найти» | Puck |
| race_plotinschiki_g.mp3 | Плотинщики | «Плотина стоит, пока я стою» | Orus |
| race_syrovary_g.mp3 | Сыровары | «Сыр с горы вкуснее, проверь» | Sulafat |
| race_podpolnye_norushki_g.mp3 | Подпольные норушки | «Под половицей всё слышно» | Leda |
| race_berlozhniki_g.mp3 | Берложники | «Зима длинная, а я терпеливый» | Algenib |
| race_lesnye_sychi_g.mp3 | Лесные сычи | «Ельник спит, а я за него не сплю» | Achird |
| race_morskie_solevary_g.mp3 | Морские солевары | «Море отдаёт соль тому, кто ждёт» | Achird |
| race_zhilniki_g.mp3 | Жильники | «Жила вон там, под твоими ногами» | Orus |
| race_yadovitye_kvakshi_g.mp3 | Ядовитые квакши | «Не трогай меня, и я не трону» | Gacrux |

### Слово ремесла (prof_*_g и prof_*_f_g) — 46 и 46

| Файл | Ремесло | Что говорит | Голос |
|---|---|---|---|
| prof_komendant_g.mp3 | Комендант | «Ворота закрываются на закате, опоздаешь — ночуй под стеной» | Iapetus |
| prof_komendant_f_g.mp3 | Комендант | «Ворота закрываются на закате, опоздаешь — ночуй под стеной» | Erinome |
| prof_strazhnik_g.mp3 | Стражник | «Оружие на виду держи, так спокойнее нам обоим» | Iapetus |
| prof_strazhnik_f_g.mp3 | Стражник | «Оружие на виду держи, так спокойнее нам обоим» | Erinome |
| prof_lekar_g.mp3 | Лекарь | «Рану покажи сразу, а не когда почернеет» | Iapetus |
| prof_lekar_f_g.mp3 | Лекарь | «Рану покажи сразу, а не когда почернеет» | Erinome |
| prof_pravitel_g.mp3 | Правитель | «Говори коротко, у меня таких как ты с утра дюжина» | Iapetus |
| prof_pravitel_f_g.mp3 | Правитель | «Говори коротко, у меня таких как ты с утра дюжина» | Erinome |
| prof_sovetnik_g.mp3 | Советник | «Это можно решить, но не сегодня и не даром» | Iapetus |
| prof_sovetnik_f_g.mp3 | Советник | «Это можно решить, но не сегодня и не даром» | Erinome |
| prof_hranitel_pamyati_g.mp3 | Хранитель Памяти | «Я помню тех, кого уже некому помнить» | Iapetus |
| prof_hranitel_pamyati_f_g.mp3 | Хранитель Памяти | «Я помню тех, кого уже некому помнить» | Erinome |
| prof_inspektor_nadzora_g.mp3 | Инспектор Надзора | «Лицензия есть, или будем считать, что нет» | Iapetus |
| prof_inspektor_nadzora_f_g.mp3 | Инспектор Надзора | «Лицензия есть, или будем считать, что нет» | Erinome |
| prof_stareyshina_g.mp3 | Старейшина | «Слушай сюда, потом переспрашивать не будешь» | Iapetus |
| prof_stareyshina_f_g.mp3 | Старейшина | «Слушай сюда, потом переспрашивать не будешь» | Erinome |
| prof_fermer_g.mp3 | Фермер | «Укос вышел худой, зато свой» | Iapetus |
| prof_fermer_f_g.mp3 | Фермер | «Укос вышел худой, зато свой» | Erinome |
| prof_celitelnica_g.mp3 | Целительница | «Пей до дна и не морщись» | Iapetus |
| prof_celitelnica_f_g.mp3 | Целительница | «Пей до дна и не морщись» | Erinome |
| prof_shahter_issledovatel_g.mp3 | Шахтёр-исследователь | «Ниже сорокового яруса я не хожу и тебе не советую» | Iapetus |
| prof_shahter_issledovatel_f_g.mp3 | Шахтёр-исследователь | «Ниже сорокового яруса я не хожу и тебе не советую» | Erinome |
| prof_ohotnik_na_morfozverey_g.mp3 | Охотник на морфозверей | «Тварь меняет облик, а повадку не меняет» | Iapetus |
| prof_ohotnik_na_morfozverey_f_g.mp3 | Охотник на морфозверей | «Тварь меняет облик, а повадку не меняет» | Erinome |
| prof_strannik_g.mp3 | Странник | «Иду откуда шёл и туда же вернусь» | Iapetus |
| prof_strannik_f_g.mp3 | Странник | «Иду откуда шла и туда же вернусь» | Erinome |
| prof_poglotitel_g.mp3 | Поглотитель | «Не подходи близко, я не всегда успеваю остановиться» | Iapetus |
| prof_poglotitel_f_g.mp3 | Поглотитель | «Не подходи близко, я не всегда успеваю остановиться» | Erinome |
| prof_kapitan_g.mp3 | Капитан | «На борт берём с грузом, без груза плати вдвое» | Iapetus |
| prof_kapitan_f_g.mp3 | Капитан | «На борт берём с грузом, без груза плати вдвое» | Erinome |
| prof_torgovec_g.mp3 | Торговец | «Цена моя честная, торговаться будешь у соседа» | Iapetus |
| prof_torgovec_f_g.mp3 | Торговец | «Цена моя честная, торговаться будешь у соседа» | Erinome |
| prof_gruzchik_g.mp3 | Грузчик | «Отойди, уроню — сам виноват» | Iapetus |
| prof_gruzchik_f_g.mp3 | Грузчик | «Отойди, уроню — сам виноват» | Erinome |
| prof_portalnyy_inzhener_g.mp3 | Портальный инженер | «Разлом дышит ровно, входить можно» | Iapetus |
| prof_portalnyy_inzhener_f_g.mp3 | Портальный инженер | «Разлом дышит ровно, входить можно» | Erinome |
| prof_izgnannik_doma_g.mp3 | Изгнанник Дома | «Дома у меня больше нет, а память осталась» | Iapetus |
| prof_izgnannik_doma_f_g.mp3 | Изгнанник Дома | «Дома у меня больше нет, а память осталась» | Erinome |
| prof_voennyy_kartograf_g.mp3 | Военный картограф | «Карта свежая, вчерашняя уже врёт» | Iapetus |
| prof_voennyy_kartograf_f_g.mp3 | Военный картограф | «Карта свежая, вчерашняя уже врёт» | Erinome |
| prof_naslednik_pavshego_doma_g.mp3 | Наследник павшего Дома | «Мой Дом сожгли, имя не сожгли» | Iapetus |
| prof_naslednik_pavshego_doma_f_g.mp3 | Наследник павшего Дома | «Мой Дом сожгли, имя не сожгли» | Erinome |
| prof_traktirschik_g.mp3 | Трактирщик | «Похлёбка горячая, слухи тоже» | Iapetus |
| prof_traktirschik_f_g.mp3 | Трактирщик | «Похлёбка горячая, слухи тоже» | Erinome |
| prof_posetitel_g.mp3 | Посетитель | «Садись, если не будешь мешать» | Iapetus |
| prof_posetitel_f_g.mp3 | Посетитель | «Садись, если не будешь мешать» | Erinome |
| prof_glava_klana_g.mp3 | Глава клана | «В клан входят делом, а не словом» | Iapetus |
| prof_glava_klana_f_g.mp3 | Глава клана | «В клан входят делом, а не словом» | Erinome |
| prof_voin_klana_g.mp3 | Воин клана | «За своих стою, чужих не трогаю первым» | Iapetus |
| prof_voin_klana_f_g.mp3 | Воин клана | «За своих стою, чужих не трогаю первой» | Erinome |
| prof_magistr_g.mp3 | Магистр | «Сначала докажи, что понял, потом проси научить» | Iapetus |
| prof_magistr_f_g.mp3 | Магистр | «Сначала докажи, что понял, потом проси научить» | Erinome |
| prof_uchenik_g.mp3 | Ученик | «Мне ещё нельзя, но я всё равно попробую» | Iapetus |
| prof_uchenik_f_g.mp3 | Ученик | «Мне ещё нельзя, но я всё равно попробую» | Erinome |
| prof_nastavnik_puti_g.mp3 | Наставник Пути | «Ступень не даётся, ступень берётся» | Iapetus |
| prof_nastavnik_puti_f_g.mp3 | Наставник Пути | «Ступень не даётся, ступень берётся» | Erinome |
| prof_arhivist_g.mp3 | Архивист | «Это записано, только записано неправильно» | Iapetus |
| prof_arhivist_f_g.mp3 | Архивист | «Это записано, только записано неправильно» | Erinome |
| prof_zhrec_g.mp3 | Жрец | «Бог слышит, даже когда молчит» | Iapetus |
| prof_zhrec_f_g.mp3 | Жрец | «Бог слышит, даже когда молчит» | Erinome |
| prof_kuznec_g.mp3 | Кузнец | «Железо не любит спешки и не прощает её» | Iapetus |
| prof_kuznec_f_g.mp3 | Кузнец | «Железо не любит спешки и не прощает её» | Erinome |
| prof_master_yader_g.mp3 | Мастер Ядер | «Ядро откликается на руку, а не на золото» | Iapetus |
| prof_master_yader_f_g.mp3 | Мастер Ядер | «Ядро откликается на руку, а не на золото» | Erinome |
| prof_mag_otshelnik_g.mp3 | Маг-отшельник | «Я ушёл сюда не для разговоров» | Iapetus |
| prof_mag_otshelnik_f_g.mp3 | Маг-отшельник | «Я ушла сюда не для разговоров» | Erinome |
| prof_obryadchik_g.mp3 | Обрядчик | «Обряд начат, выйти уже нельзя» | Iapetus |
| prof_obryadchik_f_g.mp3 | Обрядчик | «Обряд начат, выйти уже нельзя» | Erinome |
| prof_sluzhka_g.mp3 | Служка | «Мне велено проводить, дальше сами» | Iapetus |
| prof_sluzhka_f_g.mp3 | Служка | «Мне велено проводить, дальше сами» | Erinome |
| prof_schetchik_kostey_g.mp3 | Счётчик костей | «Считаю всех, и тебя посчитаю» | Iapetus |
| prof_schetchik_kostey_f_g.mp3 | Счётчик костей | «Считаю всех, и тебя посчитаю» | Erinome |
| prof_nadsmotrschik_g.mp3 | Надсмотрщик | «Работать будешь молча» | Iapetus |
| prof_nadsmotrschik_f_g.mp3 | Надсмотрщик | «Работать будешь молча» | Erinome |
| prof_shepchuschiy_g.mp3 | Шепчущий | «Наклонись, я не повторяю» | Iapetus |
| prof_shepchuschiy_f_g.mp3 | Шепчущий | «Наклонись, я не повторяю» | Erinome |
| prof_menyala_klyatv_g.mp3 | Меняла клятв | «Одну клятву на другую меняю с доплатой» | Iapetus |
| prof_menyala_klyatv_f_g.mp3 | Меняла клятв | «Одну клятву на другую меняю с доплатой» | Erinome |
| prof_otverzhennyy_g.mp3 | Отверженный | «Меня не звали и ты не зови» | Iapetus |
| prof_otverzhennyy_f_g.mp3 | Отверженный | «Меня не звали и ты не зови» | Erinome |
| prof_vladyka_g.mp3 | Владыка | «Ты стоишь передо мной по моей воле» | Iapetus |
| prof_vladyka_f_g.mp3 | Владыка | «Ты стоишь передо мной по моей воле» | Erinome |
| prof_kontrabandist_g.mp3 | Контрабандист | «Через Грань вожу всё, кроме совести» | Iapetus |
| prof_kontrabandist_f_g.mp3 | Контрабандист | «Через Грань вожу всё, кроме совести» | Erinome |
| prof_sotnik_zastavy_g.mp3 | Сотник заставы | «Застава пропускает по счёту, а не по лицу» | Iapetus |
| prof_sotnik_zastavy_f_g.mp3 | Сотник заставы | «Застава пропускает по счёту, а не по лицу» | Erinome |
| prof_dezertir_g.mp3 | Дезертир | «Я оттуда ушёл, и тебе бы не ходить» | Iapetus |
| prof_dezertir_f_g.mp3 | Дезертир | «Я оттуда ушла, и тебе бы не ходить» | Erinome |
| prof_prigovorennyy_g.mp3 | Приговорённый | «Срок назначен, осталось дожить» | Iapetus |
| prof_prigovorennyy_f_g.mp3 | Приговорённый | «Срок назначен, осталось дожить» | Erinome |
| prof_otstupnik_g.mp3 | Отступник | «От своих я отрёкся сам, не спрашивай почему» | Iapetus |
| prof_otstupnik_f_g.mp3 | Отступник | «От своих я отреклась сама, не спрашивай почему» | Erinome |

### Общее слово (say_*_g и say_*_f_g) — 7 и 7

| Файл | Что говорит | Голос |
|---|---|---|
| say_soglasie_g.mp3 | «Ладно, будь по-твоему» | Iapetus |
| say_soglasie_f_g.mp3 | «Ладно, будь по-твоему» | Erinome |
| say_otkaz_g.mp3 | «Нет, и не проси» | Iapetus |
| say_otkaz_f_g.mp3 | «Нет, и не проси» | Erinome |
| say_somnenie_g.mp3 | «Не знаю, надо подумать» | Iapetus |
| say_somnenie_f_g.mp3 | «Не знаю, надо подумать» | Erinome |
| say_torg_g.mp3 | «Такую цену я не назову» | Iapetus |
| say_torg_f_g.mp3 | «Такую цену я не назову» | Erinome |
| say_proschanie_g.mp3 | «Ступай с миром» | Iapetus |
| say_proschanie_f_g.mp3 | «Ступай с миром» | Erinome |
| say_ugroza_g.mp3 | «Ещё слово, и разговор пойдёт иначе» | Iapetus |
| say_ugroza_f_g.mp3 | «Ещё слово, и разговор пойдёт иначе» | Erinome |
| say_bol_g.mp3 | «Ох, больно же» | Iapetus |
| say_bol_f_g.mp3 | «Ох, больно же» | Erinome |

### Голос героя (hero_*_g) — 21 ход разговора

| Файл | Что говорит | Голос |
|---|---|---|
| hero_znanie_g.mp3 | «Я знаю про эти земли больше, чем ты думаешь» | Algieba |
| hero_kultura_g.mp3 | «У твоего народа так не принято, я помню» | Algieba |
| hero_nedoskazat_g.mp3 | «Скажу половину, остальное додумай сам» | Algieba |
| hero_rassprosit_g.mp3 | «Расскажи, что тут у вас творится» | Algieba |
| hero_utochnit_g.mp3 | «Повтори, я хочу услышать это ещё раз» | Algieba |
| hero_sluhi_g.mp3 | «Что говорят в этих краях» | Algieba |
| hero_sobytiya_g.mp3 | «Как там война и цены» | Algieba |
| hero_ubedit_g.mp3 | «Послушай меня и подумай ещё раз» | Algieba |
| hero_diplom_g.mp3 | «Давай сойдёмся на середине» | Algieba |
| hero_prosit_g.mp3 | «Прошу об одолжении, и я его не забуду» | Algieba |
| hero_obeshat_g.mp3 | «Даю слово, и слово моё держится» | Algieba |
| hero_sporit_g.mp3 | «Тут ты неправ, и я это докажу» | Algieba |
| hero_vera_g.mp3 | «Твой бог тебя об этом не просил» | Algieba |
| hero_vlast_g.mp3 | «Власть здесь держится не на тебе» | Algieba |
| hero_torg_g.mp3 | «Это дорого, и мы оба знаем» | Algieba |
| hero_podkup_g.mp3 | «Возьми и забудь, что видел меня» | Algieba |
| hero_obman_g.mp3 | «Всё было совсем не так» | Algieba |
| hero_zapugat_g.mp3 | «Подумай, чем это кончится для тебя» | Algieba |
| hero_shantazh_g.mp3 | «Я знаю о тебе то, что знать не должен» | Algieba |
| hero_provoc_g.mp3 | «Ну давай, скажи это вслух» | Algieba |
| hero_otkaz_g.mp3 | «Нет, и разговор окончен» | Algieba |

## Прежние поколения

До версии 3.7 речь была собрана из трёх источников: сто пятьдесят девять записей
ElevenLabs (`eleven_multilingual_v2`, платный тариф автора игры), двести два оклика
рас и народов — свободные русские голоса Piper (Apache-2.0), сорок шесть женских
реплик ремёсел и общих слов — Supertonic 3 (MIT, OpenRAIL-M). Все они заменены
записями Gemini и из папки убраны; тексты реплик остались прежними.
