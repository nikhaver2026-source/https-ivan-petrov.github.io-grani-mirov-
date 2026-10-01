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
| race_feniksy_g.mp3 | Фениксы | «Я уже умирала, это не страшно» | Achernar |
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
| race_svideteli_g.mp3 | Свидетели | «Я видела это раньше тебя» | Gacrux |
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

## Оклики народов голосом другого пола (4.7)

Житель другого пола, чем голос народа, окликает своей записью. Записано 30 сентября 2026 года голосами Gemini, проверено распознаванием речи; −18 LUFS, 44,1 кГц, MP3 320 кбит/с.

| Файл | Народ | Текст | Голос |
|---|---|---|---|
| race_aasimary_x_g.mp3 | Аасимары (женский голос) | «Мне велено помогать, а не выбирать кому» | Despina |
| race_aeronidy_x_g.mp3 | Аэрониды (мужской голос) | «Нас носит ветер, а не своя воля» | Charon |
| race_alkonosty_x_g.mp3 | Алконосты (мужской голос) | «Поплачь, путник, а потом я спою» | Orus |
| race_ambarnye_norushki_x_g.mp3 | Амбарные норушки (мужской голос) | «Зерно пересчитано, не беспокойся» | Algenib |
| race_arakokry_x_g.mp3 | Аракокры (женский голос) | «Небо не делится, и дорога тоже» | Gacrux |
| race_barsuchi_lyudi_x_g.mp3 | Барсучьи люди (женский голос) | «Нора моя, и спорить не о чем» | Achernar |
| race_bashennye_sychi_x_g.mp3 | Башенные сычи (женский голос) | «С башни видно все звёзды и все беды» | Achernar |
| race_belye_lani_x_g.mp3 | Белые лани (мужской голос) | «Я пришёл — значит, беда рядом. Иди за мной» | Achird |
| race_beregovye_arakokry_x_g.mp3 | Береговые аракокры (мужской голос) | «Море внизу, небо вверху, я посередине» | Orus |
| race_berestyaniki_x_g.mp3 | Берестяники (женский голос) | «Что записано на бересте, то и было» | Despina |
| race_berlozhniki_x_g.mp3 | Берложники (женский голос) | «Зима длинная, а я терпеливая» | Sulafat |
| race_bezdonnye_x_g.mp3 | Бездонные (женский голос) | «Там, где я живу, нет дна» | Leda |
| race_beznachalnye_x_g.mp3 | Безначальные (мужской голос) | «Я помню, как ты родился, и как ещё родишься» | Achird |
| race_bezymyannye_x_g.mp3 | Безымянные (женский голос) | «Имени нет, спрашивать нечего» | Leda |
| race_bobrecy_x_g.mp3 | Бобрецы (женский голос) | «Сначала плотина, разговоры потом» | Erinome |
| race_bolotniki_x_g.mp3 | Болотники (женский голос) | «Иди за мной след в след, иначе болото тебя оставит» | Sulafat |
| race_bortniki_x_g.mp3 | Бортники (женский голос) | «Мёд мой, пчёлы мои, а ты гость» | Leda |
| race_chasovschiki_vechnosti_x_g.mp3 | Часовщики вечности (женский голос) | «Минута у тебя, а вечность у меня» | Leda |
| race_chervehody_x_g.mp3 | Червеходы (женский голос) | «Ход прорыт, а идти или нет — твоё дело» | Achernar |
| race_ciklopy_x_g.mp3 | Циклопы (женский голос) | «Один глаз, зато смотрит прямо» | Leda |
| race_deltoviki_x_g.mp3 | Дельтовики (мужской голос) | «Река всегда знает, куда ей течь» | Charon |
| race_deti_bezmolviya_x_g.mp3 | Дети безмолвия (женский голос) | «Тишина говорит громче слов» | Kore |
| race_domoviki_x_g.mp3 | Домовики (женский голос) | «Кто печь бережёт, того и печь бережёт» | Gacrux |
| race_drakonidy_x_g.mp3 | Дракониды (женский голос) | «Кровь предков горяча, а долг холоден» | Leda |
| race_drakony_praroditeli_x_g.mp3 | Драконы-прародители (женский голос) | «Имя, которым ты нас зовёшь, мы дали себе сами» | Leda |
| race_drevneyshie_krylya_x_g.mp3 | Древнейшие крылья (женский голос) | «Я помню, когда горы были молоды» | Sulafat |
| race_drevnie_bezymyannye_x_g.mp3 | Древние безымянные (женский голос) | «Имени нет, а память есть» | Leda |
| race_drevnie_enty_x_g.mp3 | Древние энты (женский голос) | «Спешка — болезнь коротко живущих» | Kore |
| race_drevnie_krylatye_x_g.mp3 | Древние крылатые (женский голос) | «Небо было нашим до того, как стало вашим» | Achernar |
| race_driady_x_g.mp3 | Дриады (мужской голос) | «Бери столько, сколько вырастет снова» | Puck |
| race_dvoyniki_x_g.mp3 | Двойники (женский голос) | «Я уже была тобой, и мне не понравилось» | Achernar |
| race_dzhinny_x_g.mp3 | Джинны (женский голос) | «Имя — это договор, и ты его уже подписал» | Leda |
| race_efirnye_stranniki_x_g.mp3 | Эфирные странники (женский голос) | «Мы здесь ненадолго, как и ты» | Despina |
| race_elfy_x_g.mp3 | Эльфы (мужской голос) | «Ты ступаешь громко даже когда молчишь» | Orus |
| race_favny_x_g.mp3 | Фавны (женский голос) | «Свирель слышна дальше, чем крик» | Sulafat |
| race_fei_x_g.mp3 | Феи (мужской голос) | «Кто нас не видит, тот про нас и не врёт» | Charon |
| race_feniksy_x_g.mp3 | Фениксы (мужской голос) | «Я уже умирал, это не страшно» | Enceladus |
| race_garpii_x_g.mp3 | Гарпии (мужской голос) | «Сверху всё видно, и тебя тоже видели» | Iapetus |
| race_gateviki_x_g.mp3 | Гатевики (женский голос) | «Гать держит тех, кто её уважает» | Despina |
| race_glubinnye_korni_x_g.mp3 | Глубинные корни (женский голос) | «Земля бьётся, и я слышу» | Leda |
| race_glubinnye_leviafany_x_g.mp3 | Глубинные левиафаны (женский голос) | «На нашей глубине свет — чужак» | Sulafat |
| race_gnilokoronnye_x_g.mp3 | Гнилокоронные (женский голос) | «Корона осталась, голова не обязательна» | Achernar |
| race_gnilokrylye_x_g.mp3 | Гнилокрылые (женский голос) | «Летим низко, пахнем скверно, зато долетаем» | Erinome |
| race_gnomy_x_g.mp3 | Гномы (женский голос) | «Долг записан в камне, а камень терпелив» | Despina |
| race_gobliny_x_g.mp3 | Гоблины (мужской голос) | «Мне бы твой сапог, а тебе бы мой нож» | Orus |
| race_golemy_x_g.mp3 | Големы (женский голос) | «Мне приказали стоять, и я стою» | Despina |
| race_golodnye_x_g.mp3 | Голодные (женский голос) | «Мы не злые, мы просто никогда не сыты» | Erinome |
| race_gorcy_x_g.mp3 | Горцы (женский голос) | «Горы держат слово, и мы тоже» | Leda |
| race_gornokrovnye_x_g.mp3 | Горнокровные (женский голос) | «Лава мне по колено» | Erinome |
| race_gornovye_salamandry_x_g.mp3 | Горновые саламандры (женский голос) | «Холодно мне только без огня» | Leda |
| race_gornye_arakokry_x_g.mp3 | Горные аракокры (женский голос) | «С высоты видно, кто врёт» | Erinome |
| race_gorynychi_x_g.mp3 | Горынычи (женский голос) | «Три головы, а решать всё равно мне» | Erinome |
| race_gramotei_beresty_x_g.mp3 | Грамотеи бересты (женский голос) | «Каждое слово на бересте живёт сто лет» | Leda |
| race_gribnicy_glubin_x_g.mp3 | Грибницы глубин (мужской голос) | «Сад под землёй растёт в темноте» | Orus |
| race_gribozhory_x_g.mp3 | Грибожоры (женский голос) | «Сырость кормит, а свет только сушит» | Kore |
| race_grifony_x_g.mp3 | Грифоны (женский голос) | «Выбери высоту, и я выберу тебя» | Achernar |
| race_gromovniki_x_g.mp3 | Громовники (женский голос) | «Слышишь раскат? Это я здороваюсь» | Sulafat |
| race_holmichi_x_g.mp3 | Холмичи (женский голос) | «Сначала обед, потом приключения» | Erinome |
| race_hramovye_nagi_x_g.mp3 | Храмовые наги (мужской голос) | «Храм затоплен, но боги в нём не утонули» | Achird |
| race_hraniteli_poroga_x_g.mp3 | Хранители Порога (женский голос) | «Проходи, если пора. А если нет — возвращайся» | Gacrux |
| race_hraniteli_zagadok_x_g.mp3 | Хранители загадок (женский голос) | «Загадка у меня одна, ответов много» | Achernar |
| race_hronoscy_x_g.mp3 | Хроносцы (женский голос) | «Мы уже говорили это, ты просто не помнишь» | Leda |
| race_ineeviki_x_g.mp3 | Инеевики (женский голос) | «Холод не злой, он честный» | Leda |
| race_inistye_velikany_x_g.mp3 | Инистые великаны (женский голос) | «Зима не спешит, и я не спешу» | Sulafat |
| race_kamennorozhdennye_x_g.mp3 | Каменнорождённые (женский голос) | «Мы старше ваших имён и переживём их» | Leda |
| race_kamneglazy_x_g.mp3 | Камнеглазы (женский голос) | «Смотри в сторону, когда говоришь со мной» | Gacrux |
| race_kamyshniki_x_g.mp3 | Камышники (мужской голос) | «Камыш шумит — значит, всё спокойно» | Orus |
| race_karnizniki_x_g.mp3 | Карнизники (женский голос) | «Шаг на карнизе один, и он верный» | Erinome |
| race_kentavry_x_g.mp3 | Кентавры (женский голос) | «Пешему со мной не по пути» | Leda |
| race_kikimory_x_g.mp3 | Кикиморы (мужской голос) | «Шорох в осоке — это я, а не ветер» | Charon |
| race_klyukvenniki_x_g.mp3 | Клюквенники (мужской голос) | «Клюква кислая, а жизнь сладкая» | Charon |
| race_koboldy_x_g.mp3 | Кобольды (мужской голос) | «Мы копали тут раньше вас всех» | Algenib |
| race_kornesluhi_x_g.mp3 | Корнеслухи (женский голос) | «Корень скажет, где вода» | Gacrux |
| race_korni_mira_x_g.mp3 | Корни Мира (женский голос) | «Под тобой мы, путник, и мы держим» | Despina |
| race_kostokrylye_x_g.mp3 | Костокрылые (женский голос) | «Кость лёгкая, если её выточить» | Leda |
| race_kostyanki_x_g.mp3 | Костянки (женский голос) | «Мясо уходит, кость остаётся» | Sulafat |
| race_kostyanye_schetchiki_x_g.mp3 | Костяные счётчики (женский голос) | «Мы считаем всё, и тебя уже посчитали» | Erinome |
| race_kostyanye_shamany_x_g.mp3 | Костяные шаманы (женский голос) | «Кость помнит дольше, чем мясо» | Erinome |
| race_kovylniki_x_g.mp3 | Ковыльники (мужской голос) | «Ветер в степи один, а дорог под ним тысяча» | Orus |
| race_kovylnye_kentavry_x_g.mp3 | Ковыльные кентавры (женский голос) | «Стрела быстрее ветра, если её пустил кентавр» | Despina |
| race_kozhany_x_g.mp3 | Кожаны (женский голос) | «Днём нас нет, и ночью нас тоже нет» | Kore |
| race_kristallidy_x_g.mp3 | Кристаллиды (мужской голос) | «Свет проходит сквозь нас и не врёт» | Puck |
| race_krovavaya_znat_x_g.mp3 | Кровавая знать (мужской голос) | «Кровь бывает голубой, а бывает нужной» | Algenib |
| race_krovavye_fei_x_g.mp3 | Кровавые феи (мужской голос) | «Мы берём мелочью, но берём всегда» | Puck |
| race_krovniki_x_g.mp3 | Кровники (мужской голос) | «Долг крови считают до последней капли» | Charon |
| race_krovostrizhi_x_g.mp3 | Кровострижи (мужской голос) | «Мы бьём на лету и не возвращаемся» | Iapetus |
| race_kumysniki_x_g.mp3 | Кумысники (женский голос) | «Кумыс пьют сидя, а скачут стоя» | Erinome |
| race_kunyaki_x_g.mp3 | Куньяки (женский голос) | «Меня тут не было, и ты меня не видел» | Sulafat |
| race_kurgannye_shamany_x_g.mp3 | Курганные шаманы (женский голос) | «Курган помнит больше, чем летопись» | Gacrux |
| race_kuznechnye_ciklopy_x_g.mp3 | Кузнечные циклопы (женский голос) | «Один глаз, одна наковальня, один удар» | Leda |
| race_labirintniki_x_g.mp3 | Лабиринтники (женский голос) | «Выход есть всегда, но не для всех» | Despina |
| race_lamii_x_g.mp3 | Ламии (мужской голос) | «Послушай песню, путник, она недолгая» | Charon |
| race_leprekony_x_g.mp3 | Лепреконы (женский голос) | «Счёт дружбе не помеха, а основа» | Gacrux |
| race_lesnye_kentavry_x_g.mp3 | Лесные кентавры (мужской голос) | «Лес лечит, а я помогаю» | Enceladus |
| race_lesnye_murashi_x_g.mp3 | Лесные мураши (мужской голос) | «Холм растёт, и мы растём» | Achird |
| race_lesnye_sychi_x_g.mp3 | Лесные сычи (женский голос) | «Ельник спит, а я за него не сплю» | Gacrux |
| race_lesoviki_x_g.mp3 | Лесовики (женский голос) | «Лес пропустил тебя, значит и я пропущу» | Achernar |
| race_lisoviny_x_g.mp3 | Лисовины (мужской голос) | «Честная цена? Какая честная, такая и цена» | Orus |
| race_lovushechniki_x_g.mp3 | Ловушечники (женский голос) | «Не наступай туда. И туда тоже» | Achernar |
| race_lunnye_elfy_x_g.mp3 | Лунные эльфы (мужской голос) | «Ночью видно больше, чем днём» | Orus |
| race_lunnye_obratnye_x_g.mp3 | Лунные обратные (мужской голос) | «Мы растём, когда луна убывает» | Enceladus |
| race_lunnye_volkolaki_x_g.mp3 | Лунные волколаки (женский голос) | «Сегодня луна не полная, тебе повезло» | Sulafat |
| race_lykodery_x_g.mp3 | Лыкодеры (женский голос) | «Лапти сплету, дорога сама пойдёт» | Erinome |
| race_lyudi_x_g.mp3 | Люди (женский голос) | «Чужак в наших полях виден издалека» | Despina |
| race_mednoborcy_x_g.mp3 | Медноборцы (женский голос) | «Медь поёт, если её правильно ударить» | Sulafat |
| race_mednocheshuynye_x_g.mp3 | Медночешуйные (женский голос) | «Слово драконида крепче чешуи» | Kore |
| race_mednye_polozy_x_g.mp3 | Медные полозы (женский голос) | «Медь мне сестра, а ты мне кто?» | Sulafat |
| race_medvelaki_x_g.mp3 | Медвелаки (женский голос) | «Разбудишь зря — пожалеешь до весны» | Erinome |
| race_melniki_zaprud_x_g.mp3 | Мельники запруд (женский голос) | «Вода крутит колесо, а колесо кормит» | Leda |
| race_metelnye_veyry_x_g.mp3 | Метельные вейры (мужской голос) | «Метель за мной, а ты вперёд иди» | Orus |
| race_mezheviki_x_g.mp3 | Межевики (женский голос) | «Межа не для того, чтобы её топтать» | Sulafat |
| race_micelidy_x_g.mp3 | Мицелиды (мужской голос) | «Все мы из одного корня, путник» | Charon |
| race_minotavry_x_g.mp3 | Минотавры (женский голос) | «В лабиринте прямых путей не бывает» | Achernar |
| race_mnogoglazye_vestniki_x_g.mp3 | Многоглазые вестники (мужской голос) | «Смотрим всеми глазами и всё равно не всё видим» | Achird |
| race_mnogokrylye_x_g.mp3 | Многокрылые (женский голос) | «Считать крылья бесполезно, их больше» | Sulafat |
| race_mnogorukie_x_g.mp3 | Многорукие (женский голос) | «Чем больше рук, тем меньше споров» | Kore |
| race_molchuny_vzglyada_x_g.mp3 | Молчуны взгляда (женский голос) | «Я уже сказала. Взглядом» | Erinome |
| race_moroki_x_g.mp3 | Мороки (мужской голос) | «Ты видишь меня таким, каким хочешь» | Orus |
| race_moroznye_veyry_x_g.mp3 | Морозные вейры (мужской голос) | «Зима рассудит, кто был прав» | Enceladus |
| race_morskie_solevary_x_g.mp3 | Морские солевары (женский голос) | «Море отдаёт соль тому, кто ждёт» | Kore |
| race_motylkovye_x_g.mp3 | Мотыльковые (мужской голос) | «На свет летят не от глупости, а от нужды» | Algenib |
| race_murashniki_x_g.mp3 | Мурашники (мужской голос) | «Нас много, и каждый знает своё дело» | Iapetus |
| race_nagi_x_g.mp3 | Наги (мужской голос) | «Суди сам, но судить будут и тебя» | Puck |
| race_nakovalschiki_x_g.mp3 | Наковальщики (женский голос) | «Бью раз, и гора звенит» | Erinome |
| race_naledniki_x_g.mp3 | Наледники (женский голос) | «Наледь крепкая, пока я на ней» | Erinome |
| race_nasledniki_harga_x_g.mp3 | Наследники Харга (женский голос) | «Харг ушёл, а счёт остался за нами» | Despina |
| race_nebesnye_tabunschiki_x_g.mp3 | Небесные табунщики (женский голос) | «Табун ходит там, где ветер ровный» | Kore |
| race_nochnicy_x_g.mp3 | Ночницы (мужской голос) | «Темнота мне дом, а тебе дорога» | Enceladus |
| race_norushki_x_g.mp3 | Норушки (мужской голос) | «Под полом всё слышно, и я всё слышал» | Achird |
| race_oazisnye_lamii_x_g.mp3 | Оазисные ламии (мужской голос) | «Вода есть, но за песню» | Enceladus |
| race_oblachnye_kity_x_g.mp3 | Облачные киты (женский голос) | «Я плыву, а берег сам ко мне приходит» | Sulafat |
| race_oblachnye_pastuhi_x_g.mp3 | Облачные пастухи (женский голос) | «Туча за мной, и дождь за тучей» | Leda |
| race_oblachnye_skakuny_x_g.mp3 | Облачные скакуны (мужской голос) | «Держись крепче или не держись вовсе» | Iapetus |
| race_ognehvostye_x_g.mp3 | Огнехвостые (мужской голос) | «Хвост видишь? Больше ничего не увидишь» | Enceladus |
| race_ognekrovnye_x_g.mp3 | Огнекровные (женский голос) | «Тронешь — обожжёшься. Предупреждаю один раз» | Achernar |
| race_ogry_x_g.mp3 | Огры (женский голос) | «Мало говорю, много ем, редко ошибаюсь» | Despina |
| race_omutniki_x_g.mp3 | Омутники (женский голос) | «Омут тихий, пока ты тихий» | Gacrux |
| race_orki_x_g.mp3 | Орки (женский голос) | «Кто не держит слово, тот не удержит и топор» | Sulafat |
| race_osochnicy_x_g.mp3 | Осочницы (мужской голос) | «В осоке тропа, а в тропе я» | Puck |
| race_padalschiki_korvaksa_x_g.mp3 | Падальщики Корвакса (женский голос) | «Мы приходим после, и нам всегда есть что взять» | Erinome |
| race_pancirniki_x_g.mp3 | Панцирники (женский голос) | «Куда спешить? Я ещё успею» | Achernar |
| race_pastuhi_ciklopy_x_g.mp3 | Пастухи-циклопы (женский голос) | «Овцы считаны, все на месте» | Sulafat |
| race_pechatniki_run_x_g.mp3 | Печатники рун (женский голос) | «Печать поставлена — дверь молчит» | Kore |
| race_pegasy_x_g.mp3 | Пегасы (мужской голос) | «Тяжёлого я не понесу» | Achird |
| race_pepelnye_deti_x_g.mp3 | Пепельные дети (мужской голос) | «Пепел тёплый, садись, пока не остыл» | Achird |
| race_pepelnye_kuznecy_x_g.mp3 | Пепельные кузнецы (женский голос) | «Горн остыл, а заказы остались» | Sulafat |
| race_pepelnye_orki_x_g.mp3 | Пепельные орки (женский голос) | «Пепел во рту, огонь в сердце» | Erinome |
| race_pepelnye_pegasy_x_g.mp3 | Пепельные пегасы (мужской голос) | «Возим только тех, кто не боится золы» | Orus |
| race_pepelnye_velikany_x_g.mp3 | Пепельные великаны (женский голос) | «Мы ходим там, где всё уже сгорело» | Erinome |
| race_pepelokrylye_x_g.mp3 | Пепелокрылые (мужской голос) | «Крылья в пепле, а летим выше вас» | Orus |
| race_pervorozhdennye_zari_x_g.mp3 | Перворождённые Зари (мужской голос) | «Первый свет был наш, остальное ваше» | Orus |
| race_pervye_zveri_x_g.mp3 | Первые Звери (женский голос) | «Каждый зверь в лесу — мой внук» | Kore |
| race_peschanye_dzhinny_x_g.mp3 | Песчаные джинны (женский голос) | «В песках слово дороже воды» | Leda |
| race_peschanye_yaschery_x_g.mp3 | Песчаные ящеры (женский голос) | «Жара — это просто тепло» | Achernar |
| race_peschernye_gobliny_x_g.mp3 | Пещерные гоблины (женский голос) | «В темноте я вижу, а ты нет» | Achernar |
| race_peschernye_nochnicy_x_g.mp3 | Пещерные ночницы (мужской голос) | «В пещере эхо — мой второй голос» | Enceladus |
| race_plamennye_vestniki_x_g.mp3 | Пламенные вестники (мужской голос) | «Сгорю и вернусь с новостями» | Charon |
| race_plotinschiki_x_g.mp3 | Плотинщики (женский голос) | «Плотина стоит, пока я стою» | Sulafat |
| race_plotogony_x_g.mp3 | Плотогоны (женский голос) | «Плот не тонет, если держать течение» | Leda |
| race_podpolnye_norushki_x_g.mp3 | Подпольные норушки (мужской голос) | «Под половицей всё слышно» | Charon |
| race_pogranichnye_tiflingi_x_g.mp3 | Пограничные тифлинги (женский голос) | «Грань близко, а страх далеко» | Gacrux |
| race_poleviki_x_g.mp3 | Полевики (женский голос) | «Межу не трогай, и хлеб будет» | Despina |
| race_polnochnye_hodoki_x_g.mp3 | Полночные ходоки (женский голос) | «Полночь — моя дорога» | Leda |
| race_polozy_x_g.mp3 | Полозы (женский голос) | «Жилу покажу тому, кто не жаден» | Kore |
| race_poludennicy_x_g.mp3 | Полуденницы (мужской голос) | «В полдень работают, а не бродят» | Iapetus |
| race_polurosliki_x_g.mp3 | Полурослики (женский голос) | «Дорога кормит идущего, садись и ешь» | Achernar |
| race_poslednie_krylya_x_g.mp3 | Последние крылья (женский голос) | «Нас мало, поэтому мы считаем каждого» | Achernar |
| race_poslednie_x_g.mp3 | Последние (женский голос) | «После нас никого, и это не жалоба» | Erinome |
| race_pribrezhnye_pancirniki_x_g.mp3 | Прибрежные панцирники (женский голос) | «Отмель тёплая, спешить некуда» | Kore |
| race_privratniki_x_g.mp3 | Привратники (женский голос) | «Дверь открою, но не сегодня» | Erinome |
| race_provozvestniki_neba_x_g.mp3 | Провозвестники неба (женский голос) | «Сверху срок виден раньше» | Erinome |
| race_provozvestniki_x_g.mp3 | Провозвестники (женский голос) | «День назначен, и он уже близко» | Despina |
| race_pryadilschiki_x_g.mp3 | Прядильщики (мужской голос) | «Каждая нить куда-нибудь ведёт» | Puck |
| race_pustokrylye_x_g.mp3 | Пустокрылые (женский голос) | «Под нами нет тени, посмотри сам» | Despina |
| race_pustotelye_x_g.mp3 | Пустотелые (женский голос) | «Внутри у нас место, и оно не занято» | Achernar |
| race_pustotniki_x_g.mp3 | Пустотники (женский голос) | «Там, откуда мы, нет ни верха, ни низа» | Kore |
| race_raskatnye_x_g.mp3 | Раскатные (женский голос) | «Первый гром — это мой» | Sulafat |
| race_rassvetnye_tumanniki_x_g.mp3 | Рассветные туманники (мужской голос) | «Солнце встанет, и меня не станет» | Algenib |
| race_rassvetnye_x_g.mp3 | Рассветные (мужской голос) | «Первый луч мой, остальные твои» | Orus |
| race_rechane_x_g.mp3 | Речане (женский голос) | «Река кормит, река и судит» | Leda |
| race_rechnye_polurosliki_x_g.mp3 | Речные полурослики (мужской голос) | «Лодка — это дом, который плавает» | Puck |
| race_rogatye_strazhi_x_g.mp3 | Рогатые стражи (женский голос) | «Ворота мои, рога мои» | Kore |
| race_roschevye_siriny_x_g.mp3 | Рощевые сирины (мужской голос) | «В роще поют, а не спорят» | Algenib |
| race_runnye_karly_x_g.mp3 | Рунные карлы (женский голос) | «Рука дрогнет — руна солжёт» | Despina |
| race_runovedy_x_g.mp3 | Руноведы (женский голос) | «Каждая трещина в мире — это строка» | Leda |
| race_rusalki_x_g.mp3 | Русалки (мужской голос) | «Море возвращает своё, и тебя вернёт» | Achird |
| race_rysi_lyudi_x_g.mp3 | Рысьи люди (женский голос) | «Рысь ждёт, а потом не промахивается» | Leda |
| race_sadovnicy_glubin_x_g.mp3 | Садовницы глубин (мужской голос) | «В саду на дне всегда тихо» | Charon |
| race_sadovye_zhar_pticy_x_g.mp3 | Садовые жар-птицы (мужской голос) | «В саду светло и ночью» | Enceladus |
| race_salamandry_x_g.mp3 | Саламандры (женский голос) | «Сгори и начни заново, это не угроза» | Erinome |
| race_satiry_x_g.mp3 | Сатиры (женский голос) | «Сначала выпьем, потом решим, враги мы или нет» | Despina |
| race_serebryanye_elfy_x_g.mp3 | Серебряные эльфы (мужской голос) | «Луна — наша память о свете» | Algenib |
| race_serye_bratya_x_g.mp3 | Серые братья (женский голос) | «Стая рядом, даже когда её не видно» | Leda |
| race_sfinksy_x_g.mp3 | Сфинксы (женский голос) | «Ответь, и пройдёшь. Не ответишь — останешься» | Gacrux |
| race_shelkopryady_snov_x_g.mp3 | Шелкопряды снов (мужской голос) | «Нить сна тонка, но держит крепче верёвки» | Charon |
| race_shelkopryady_tishiny_x_g.mp3 | Шелкопряды тишины (мужской голос) | «Тише, нить не любит шума» | Enceladus |
| race_shepchuschie_x_g.mp3 | Шепчущие (мужской голос) | «Слушай ниже, я говорю не сюда» | Enceladus |
| race_shepotokrylye_x_g.mp3 | Шёпотокрылые (мужской голос) | «Наши крылья не шумят, потому и слышно нас поздно» | Orus |
| race_shkvalnye_virmy_x_g.mp3 | Шквальные вирмы (женский голос) | «Шторм — это мой шаг» | Despina |
| race_shtormovye_virmy_x_g.mp3 | Штормовые вирмы (женский голос) | «Гром идёт впереди нас, а мы не спешим» | Achernar |
| race_silfy_x_g.mp3 | Сильфы (мужской голос) | «Мы бываем там, где вы только дышите» | Iapetus |
| race_siriny_x_g.mp3 | Сирины (мужской голос) | «Не слушай меня долго, дорогу забудешь» | Orus |
| race_skalistye_garpii_x_g.mp3 | Скалистые гарпии (мужской голос) | «Кричу громче бури, и буря слушает» | Charon |
| race_skalniki_x_g.mp3 | Скальники (женский голос) | «На перевал без меня не ходи» | Kore |
| race_skalnye_kunyaki_x_g.mp3 | Скальные куньяки (женский голос) | «В расщелине меня не найти» | Sulafat |
| race_skalogrudye_velikany_x_g.mp3 | Скалогрудые великаны (женский голос) | «Моя наковальня — эта гора» | Gacrux |
| race_slepcy_niksora_x_g.mp3 | Слепцы Никсора (женский голос) | «Глаза нам мешали, мы их отдали» | Erinome |
| race_snovidcy_x_g.mp3 | Сновидцы (мужской голос) | «Ты спишь, просто ещё не заметил» | Achird |
| race_sny_kamnya_x_g.mp3 | Сны камня (женский голос) | «Сплю и вижу камень» | Sulafat |
| race_solevary_x_g.mp3 | Солевары (женский голос) | «Соль и хлеб, путник, а там поговорим» | Kore |
| race_solyanye_krachki_x_g.mp3 | Соляные крачки (мужской голос) | «Над солью ветер ровный, держись за нами» | Enceladus |
| race_solyanye_vdovy_x_g.mp3 | Соляные вдовы (мужской голос) | «Соль сушит слёзы, поэтому мы их не льём» | Orus |
| race_sonnye_skaty_x_g.mp3 | Сонные скаты (женский голос) | «Мы спим в полёте, и это никому не мешает» | Achernar |
| race_sosnovye_kunyaki_x_g.mp3 | Сосновые куньяки (мужской голос) | «На сосне меня никто не достанет» | Enceladus |
| race_spyaschie_gory_x_g.mp3 | Спящие Горы (женский голос) | «Не буди меня без нужды, я держу мир» | Despina |
| race_srebrorogi_x_g.mp3 | Сребророги (мужской голос) | «Иди за светом, и выйдешь» | Algenib |
| race_sshivateli_grani_x_g.mp3 | Сшиватели Грани (женский голос) | «Трещина есть, а нить у меня» | Despina |
| race_steklyannye_silfidy_x_g.mp3 | Стеклянные сильфиды (мужской голос) | «Тронешь — зазвенит, и все услышат» | Achird |
| race_stepnye_orki_x_g.mp3 | Степные орки (женский голос) | «Вепрь бежит, орк правит, степь молчит» | Leda |
| race_stolpy_grani_x_g.mp3 | Столпы Грани (женский голос) | «Небо тяжёлое, но я держу» | Achernar |
| race_strazhi_zolotyh_gor_x_g.mp3 | Стражи золотых гор (женский голос) | «Золото тут есть. Тебе не достанется» | Gacrux |
| race_sumerechniki_x_g.mp3 | Сумеречники (женский голос) | «Между днём и ночью есть полоса, мы в ней живём» | Despina |
| race_sumerechnye_elfy_x_g.mp3 | Сумеречные эльфы (мужской голос) | «На опушке видно обе стороны мира» | Iapetus |
| race_svalochniki_x_g.mp3 | Свалочники (женский голос) | «Выбросил? Значит, моё» | Erinome |
| race_svechnye_koboldy_x_g.mp3 | Свечные кобольды (мужской голос) | «Без свечи в шахте ни шагу» | Orus |
| race_svetlorozhdennye_x_g.mp3 | Светлорождённые (мужской голос) | «Клятва дороже жизни, и жизнь это знает» | Puck |
| race_svideteli_x_g.mp3 | Свидетели (мужской голос) | «Я видел это раньше тебя» | Algenib |
| race_sychi_x_g.mp3 | Сычи (женский голос) | «Ночью видно то, что днём прячется» | Despina |
| race_syrovary_x_g.mp3 | Сыровары (мужской голос) | «Сыр с горы вкуснее, проверь» | Puck |
| race_tabunschiki_kovylya_x_g.mp3 | Табунщики ковыля (женский голос) | «Конь чует дорогу раньше всадника» | Sulafat |
| race_tenehodcy_x_g.mp3 | Тенеходцы (женский голос) | «Всё имеет цену, включая молчание» | Erinome |
| race_terzayuschie_v_nebe_x_g.mp3 | Терзающие в небе (женский голос) | «Сверху выбирают, снизу только ждут» | Despina |
| race_terzayuschie_x_g.mp3 | Терзающие (женский голос) | «Мы не спорим, мы разбираем» | Sulafat |
| race_tiflingi_x_g.mp3 | Тифлинги (женский голос) | «За мою кровь мне уже заплатили сполна» | Despina |
| race_tinnye_yaschery_x_g.mp3 | Тинные ящеры (женский голос) | «Ил тёплый, а ты замёрз» | Sulafat |
| race_tisovye_elfy_x_g.mp3 | Тисовые эльфы (женский голос) | «Тис гнётся, но не ломается» | Sulafat |
| race_titany_grani_x_g.mp3 | Титаны Грани (женский голос) | «Мы держали небо, пока вы учились ходить» | Gacrux |
| race_tkachi_sozvezdiy_x_g.mp3 | Ткачи созвездий (мужской голос) | «Одна нить от звезды к тебе» | Algenib |
| race_tleyuschie_ispoliny_x_g.mp3 | Тлеющие исполины (женский голос) | «Пепел тёплый, пока я здесь» | Gacrux |
| race_tleyuschie_x_g.mp3 | Тлеющие (женский голос) | «Горим медленно, зато давно» | Erinome |
| race_trehglavye_x_g.mp3 | Трёхглавые (женский голос) | «Три головы, три мнения» | Despina |
| race_trolli_x_g.mp3 | Тролли (женский голос) | «Камень я переживу, тебя тем более» | Kore |
| race_trostnikovye_pevcy_x_g.mp3 | Тростниковые певцы (женский голос) | «Закат спели, теперь можно спать» | Erinome |
| race_tumanniki_x_g.mp3 | Туманники (мужской голос) | «Меня не видно, но я здесь» | Orus |
| race_uglekrylye_x_g.mp3 | Углекрылые (женский голос) | «Искры с крыльев падают, берегись» | Achernar |
| race_uglezhogi_izoldy_x_g.mp3 | Углежоги Изольды (женский голос) | «Уголь горит, пока о нём не вспомнят» | Kore |
| race_undiny_x_g.mp3 | Ундины (мужской голос) | «Вода не держит следов, а память держит» | Iapetus |
| race_uteshitelnicy_x_g.mp3 | Утешительницы (мужской голос) | «Горе уйдёт, песня останется» | Enceladus |
| race_utoplenniki_x_g.mp3 | Утопленники (женский голос) | «Вода нас не отпустила, и тебя не отпустит» | Despina |
| race_varnichane_x_g.mp3 | Варничане (женский голос) | «Варница дымит — значит, соль будет» | Sulafat |
| race_vervolfy_x_g.mp3 | Вервольфы (женский голос) | «Днём мы соседи, ночью я за себя не отвечаю» | Erinome |
| race_veschuny_x_g.mp3 | Вещуны (женский голос) | «Завтра я уже видела, а ты ещё нет» | Sulafat |
| race_vetrenicy_x_g.mp3 | Ветреницы (мужской голос) | «Ветер принёс вести, а ты слушай» | Algenib |
| race_vetrenye_garpii_x_g.mp3 | Ветреные гарпии (мужской голос) | «Ветер в лицо — лучший ветер» | Orus |
| race_vodyaniki_x_g.mp3 | Водяники (женский голос) | «Без поклона в мою воду не заходи» | Leda |
| race_voroni_veschuny_x_g.mp3 | Вороньи вещуны (женский голос) | «Будет так, как я сказала» | Gacrux |
| race_vyuzhnicy_x_g.mp3 | Вьюжницы (мужской голос) | «Вьюга поёт, а я подпеваю» | Enceladus |
| race_vyvodok_ulury_x_g.mp3 | Выводок Улуры (мужской голос) | «Нас много, и мать считает каждого» | Puck |
| race_yadokrylye_x_g.mp3 | Ядокрылые (мужской голос) | «Не дыши глубоко рядом с нами» | Algenib |
| race_yadovitye_kvakshi_x_g.mp3 | Ядовитые квакши (мужской голос) | «Не трогай меня, и я не трону» | Enceladus |
| race_yantarniki_x_g.mp3 | Янтарники (мужской голос) | «В янтаре всё хранится, и ты тоже сохранишься» | Charon |
| race_yantarnye_ozherelniki_x_g.mp3 | Янтарные ожерельники (мужской голос) | «На каждой бусине — прадед» | Puck |
| race_yarly_vyugi_x_g.mp3 | Ярлы вьюги (женский голос) | «Ярл сказал — вьюга пришла» | Leda |
| race_yascherolyudy_x_g.mp3 | Ящеролюды (женский голос) | «Холодная кровь не значит пустое сердце» | Achernar |
| race_zapechniki_x_g.mp3 | Запечники (женский голос) | «Печь тёплая, и мне тепло» | Achernar |
| race_zemleroyki_x_g.mp3 | Землеройки (женский голос) | «Глаза врут, а земля никогда» | Despina |
| race_zerkalcy_x_g.mp3 | Зеркальцы (мужской голос) | «Посмотри на меня и скажи, кто из нас настоящий» | Algenib |
| race_zerkalnye_moroki_x_g.mp3 | Зеркальные мороки (мужской голос) | «Посмотри в воду. Видишь? Это я» | Enceladus |
| race_zerkalnye_pticy_x_g.mp3 | Зеркальные птицы (мужской голос) | «В небе отражается то, чего внизу нет» | Iapetus |
| race_zhabolyudy_x_g.mp3 | Жаболюды (женский голос) | «Ква — это не песня, это предупреждение» | Leda |
| race_zhar_pticy_x_g.mp3 | Жар-птицы (мужской голос) | «Одно перо — и ночь не страшна» | Orus |
| race_zheleznoborodye_x_g.mp3 | Железнобородые (женский голос) | «Борода железная, слово тоже» | Sulafat |
| race_zhemchuzhnye_sireny_x_g.mp3 | Жемчужные сирены (мужской голос) | «Море помнит всех, кто в нём пел» | Orus |
| race_zhilniki_x_g.mp3 | Жильники (женский голос) | «Жила вон там, под твоими ногами» | Gacrux |
| race_zhneicy_poludnya_x_g.mp3 | Жнеицы полудня (мужской голос) | «Жни, пока солнце высоко» | Algenib |
| race_zverinye_praotcy_x_g.mp3 | Звериные праотцы (женский голос) | «Лес зовёт меня отцом» | Leda |
| race_zverolyudy_x_g.mp3 | Зверолюды (женский голос) | «Ты пахнешь дорогой и чужим страхом» | Erinome |
| race_zvezdnye_skitalcy_x_g.mp3 | Звёздные скитальцы (женский голос) | «Между звёздами тоже есть дороги» | Gacrux |
| race_zvezdnye_tkachi_x_g.mp3 | Звёздные ткачи (мужской голос) | «Нить уже протянута, ты просто её не видишь» | Orus |
| race_zvonkie_kristallidy_x_g.mp3 | Звонкие кристаллиды (мужской голос) | «Слышишь звон? Это я отвечаю» | Orus |

## 6.0: оклики рас Дальнего Круга

Двадцать пять рас из-за Завесы, у каждой — свой оклик своим полом и вторым полом (_x). Записано голосами Gemini (`gemini-3.8-flash-tts`) 30 сентября 2026 года тем же порядком, что и прежние оклики; MP3 320 кбит/с, моно, 44,1 кГц, −18 LUFS.

| Файл | Народ | Слова | Голос Gemini |
|---|---|---|---|
| race_vyparniki_g.mp3 | Выпарники | «Соли тебе на дорогу. Вода у колодца, а правда — в чане.» | Algenib |
| race_vyparniki_x_g.mp3 | Выпарники (второй голос) | «Соли тебе на дорогу. Вода у колодца, а правда — в чане.» | Kore |
| race_mshanniki_g.mp3 | Мшанники | «Не спеши... На болоте спешат только утопленники.» | Enceladus |
| race_mshanniki_x_g.mp3 | Мшанники (второй голос) | «Не спеши... На болоте спешат только утопленники.» | Leda |
| race_zerkalniki_g.mp3 | Зеркальники | «Я вижу тебя дважды. И оба раза — с миром?» | Erinome |
| race_zerkalniki_x_g.mp3 | Зеркальники (второй голос) | «Я вижу тебя дважды. И оба раза — с миром?» | Orus |
| race_smolyane_g.mp3 | Смоляне | «Пахнет смолой — значит, ты у нас дома. Проходи, только на янтарь не наступай.» | Iapetus |
| race_smolyane_x_g.mp3 | Смоляне (второй голос) | «Пахнет смолой — значит, ты у нас дома. Проходи, только на янтарь не наступай.» | Despina |
| race_voroncy_g.mp3 | Воронцы | «Весть с круч: гость пришёл. Говори быстро — гроза ждать не станет.» | Fenrir |
| race_voroncy_x_g.mp3 | Воронцы (второй голос) | «Весть с круч: гость пришёл. Говори быстро — гроза ждать не станет.» | Erinome |
| race_svetlyachniki_g.mp3 | Светлячники | «Свети ярче, гость, а то в Жилах не разглядеть, кто пришёл.» | Leda |
| race_svetlyachniki_x_g.mp3 | Светлячники (второй голос) | «Свети ярче, гость, а то в Жилах не разглядеть, кто пришёл.» | Umbriel |
| race_rogachi_g.mp3 | Рогачи | «Садись к огню. Туры не кусаются, а я — тем более.» | Charon |
| race_rogachi_x_g.mp3 | Рогачи (второй голос) | «Садись к огню. Туры не кусаются, а я — тем более.» | Laomedeia |
| race_vosmirukie_g.mp3 | Восьмирукие | «Тише... Нить дрожит, когда говорят громко.» | Despina |
| race_vosmirukie_x_g.mp3 | Восьмирукие (второй голос) | «Тише... Нить дрожит, когда говорят громко.» | Algenib |
| race_schitospinnye_g.mp3 | Щитоспинные | «Здравствуй. Отвечу тебе завтра. Или через год.» | Schedar |
| race_schitospinnye_x_g.mp3 | Щитоспинные (второй голос) | «Здравствуй. Отвечу тебе завтра. Или через год.» | Vindemiatrix |
| race_skarabei_g.mp3 | Скарабеи | «Солнце катится! Помоги толкнуть — или отойди с дороги.» | Alnilam |
| race_skarabei_x_g.mp3 | Скарабеи (второй голос) | «Солнце катится! Помоги толкнуть — или отойди с дороги.» | Callirrhoe |
| race_zavesniki_g.mp3 | Завесники | «Шов позади. Не оглядывайся: туман помнит лица.» | Autonoe |
| race_zavesniki_x_g.mp3 | Завесники (второй голос) | «Шов позади. Не оглядывайся: туман помнит лица.» | Charon |
| race_ryzhehvosty_g.mp3 | Рыжехвосты | «О, гость! А у меня как раз есть то, чего тебе не хватает.» | Puck |
| race_ryzhehvosty_x_g.mp3 | Рыжехвосты (второй голос) | «О, гость! А у меня как раз есть то, чего тебе не хватает.» | Leda |
| race_kolokolniki_g.mp3 | Колокольники | «Звон тебе навстречу! Слушай, чисто ли звучит.» | Pulcherrima |
| race_kolokolniki_x_g.mp3 | Колокольники (второй голос) | «Звон тебе навстречу! Слушай, чисто ли звучит.» | Orus |
| race_kornevniki_g.mp3 | Корневики | «Стой. Земля говорит, что ты с миром. Земля не врёт.» | Umbriel |
| race_kornevniki_x_g.mp3 | Корневики (второй голос) | «Стой. Земля говорит, что ты с миром. Земля не врёт.» | Despina |
| race_sovinoglazye_g.mp3 | Совиноглазые | «Не спится? Нам тоже. Садись, ночь длинная.» | Sulafat |
| race_sovinoglazye_x_g.mp3 | Совиноглазые (второй голос) | «Не спится? Нам тоже. Садись, ночь длинная.» | Iapetus |
| race_zharoviki_g.mp3 | Жаровики | «Погрейся у огня. Только близко не подходи — обожжёшься.» | Algieba |
| race_zharoviki_x_g.mp3 | Жаровики (второй голос) | «Погрейся у огня. Только близко не подходи — обожжёшься.» | Autonoe |
| race_nerpichi_g.mp3 | Нерпичи | «Холодно? Это ещё не холод. Холод — подо льдом.» | Aoede |
| race_nerpichi_x_g.mp3 | Нерпичи (второй голос) | «Холодно? Это ещё не холод. Холод — подо льдом.» | Algieba |
| race_kitoglavy_g.mp3 | Китоглавы | «Мир тебе. Кит тебя слышит — значит, и мы слышим.» | Orus |
| race_kitoglavy_x_g.mp3 | Китоглавы (второй голос) | «Мир тебе. Кит тебя слышит — значит, и мы слышим.» | Gacrux |
| race_korallidy_g.mp3 | Кораллиды | «Осторожно, не ломай риф: он растёт дольше, чем живут люди.» | Laomedeia |
| race_korallidy_x_g.mp3 | Кораллиды (второй голос) | «Осторожно, не ломай риф: он растёт дольше, чем живут люди.» | Achird |
| race_meduzniki_g.mp3 | Медузники | «Свет тебе в тёмной воде.» | Kore |
| race_meduzniki_x_g.mp3 | Медузники (второй голос) | «Свет тебе в тёмной воде.» | Schedar |
| race_burevestniki_g.mp3 | Буревестники | «Ветер крепчает! Хороший день, чтобы выйти в море.» | Zubenelgenubi |
| race_burevestniki_x_g.mp3 | Буревестники (второй голос) | «Ветер крепчает! Хороший день, чтобы выйти в море.» | Kore |
| race_rakovinniki_g.mp3 | Раковинники | «Тсс... Слышишь? Раковина шепчет твоё имя.» | Achernar |
| race_rakovinniki_x_g.mp3 | Раковинники (второй голос) | «Тсс... Слышишь? Раковина шепчет твоё имя.» | Puck |
| race_neboglazy_g.mp3 | Небоглазы | «Звёзды сказали, что ты придёшь. Ты опоздал на час.» | Sadachbia |
| race_neboglazy_x_g.mp3 | Небоглазы (второй голос) | «Звёзды сказали, что ты придёшь. Ты опоздал на час.» | Aoede |
| race_masochniki_g.mp3 | Масочники | «Какое лицо тебе показать? У меня их много.» | Gacrux |
| race_masochniki_x_g.mp3 | Масочники (второй голос) | «Какое лицо тебе показать? У меня их много.» | Fenrir |
| race_kamnejedy_g.mp3 | Каменноеды | «Хороший у вас тут камень. Вкусный.» | Rasalgethi |
| race_kamnejedy_x_g.mp3 | Каменноеды (второй голос) | «Хороший у вас тут камень. Вкусный.» | Erinome |

## 6.0: оклики народов Дальнего Круга

Пятьдесят народов-ветвей рас из-за Завесы: у каждого свой оклик и своя интонация, своим полом и вторым полом (_x). Записано голосами Gemini (`gemini-3.8-flash-tts`) 1 октября 2026 года, по десять народов в одной записи (мужской и женский голос по очереди), нарезка с проверкой текста распознаванием; MP3 320 кбит/с, моно, 44,1 кГц, −18 LUFS.

| Файл | Народ | Слова | Голос Gemini |
|---|---|---|---|
| race_chanovye_vyparniki_g.mp3 | Чановые выпарники | «Чан полон — голос громок. Горсть соли за слово, путник.» | Charon |
| race_chanovye_vyparniki_x_g.mp3 | Чановые выпарники (второй голос) | «Чан полон — голос громок. Горсть соли за слово, путник.» | Despina |
| race_suhoozercy_g.mp3 | Сухоозёрцы | «Озеро ушло, а мы остались. Садись, воды хватит на двоих.» | Charon |
| race_suhoozercy_x_g.mp3 | Сухоозёрцы (второй голос) | «Озеро ушло, а мы остались. Садись, воды хватит на двоих.» | Despina |
| race_kochkari_g.mp3 | Кочкари | «Не торопись. На вече торопливых не слушают.» | Charon |
| race_kochkari_x_g.mp3 | Кочкари (второй голос) | «Не торопись. На вече торопливых не слушают.» | Despina |
| race_torfyanye_mshanniki_g.mp3 | Торфяные мшанники | «Пласт режем ровно, а сушим долго. Таков и разговор.» | Charon |
| race_torfyanye_mshanniki_x_g.mp3 | Торфяные мшанники (второй голос) | «Пласт режем ровно, а сушим долго. Таков и разговор.» | Despina |
| race_dnevnye_zerkalniki_g.mp3 | Дневные зеркальники | «Смотри прямо: что сказано днём, то и отразится.» | Despina |
| race_dnevnye_zerkalniki_x_g.mp3 | Дневные зеркальники (второй голос) | «Смотри прямо: что сказано днём, то и отразится.» | Charon |
| race_otrazhyonnye_g.mp3 | Отражённые | «Мы — та сторона стекла. Говори тише, нас слышат дважды.» | Despina |
| race_otrazhyonnye_x_g.mp3 | Отражённые (второй голос) | «Мы — та сторона стекла. Говори тише, нас слышат дважды.» | Charon |
| race_degtyari_g.mp3 | Дегтяри | «Пахнет дёгтем — значит, дело делается.» | Charon |
| race_degtyari_x_g.mp3 | Дегтяри (второй голос) | «Пахнет дёгтем — значит, дело делается.» | Despina |
| race_yantarnye_smolyane_g.mp3 | Янтарные смоляне | «Смола помнит лето. Хочешь, покажу, что в ней застыло?» | Charon |
| race_yantarnye_smolyane_x_g.mp3 | Янтарные смоляне (второй голос) | «Смола помнит лето. Хочешь, покажу, что в ней застыло?» | Despina |
| race_grozovye_gnyozda_g.mp3 | Грозовые гнёзда | «Гнездо у самой тучи. Гостю — место у края, но крепко держись.» | Charon |
| race_grozovye_gnyozda_x_g.mp3 | Грозовые гнёзда (второй голос) | «Гнездо у самой тучи. Гостю — место у края, но крепко держись.» | Despina |
| race_vestovye_voroncy_g.mp3 | Вестовые воронцы | «Весть принёс — весть возьми. Задерживаться не велено.» | Charon |
| race_vestovye_voroncy_x_g.mp3 | Вестовые воронцы (второй голос) | «Весть принёс — весть возьми. Задерживаться не велено.» | Despina |
| race_zhilnye_svetlyachniki_g.mp3 | Жильные светлячники | «Свети под ноги: жила ведёт, но и обманывает.» | Sulafat |
| race_zhilnye_svetlyachniki_x_g.mp3 | Жильные светлячники (второй голос) | «Свети под ноги: жила ведёт, но и обманывает.» | Orus |
| race_mhovye_fonarschiki_g.mp3 | Мховые фонарщики | «Фонарь зажжён — значит, ход живой. Проходи.» | Sulafat |
| race_mhovye_fonarschiki_x_g.mp3 | Мховые фонарщики (второй голос) | «Фонарь зажжён — значит, ход живой. Проходи.» | Orus |
| race_perevalschiki_g.mp3 | Перевальщики | «Через перевал — с нами, без нас — по снегу до весны.» | Orus |
| race_perevalschiki_x_g.mp3 | Перевальщики (второй голос) | «Через перевал — с нами, без нас — по снегу до весны.» | Sulafat |
| race_podnebesnye_pastuhi_g.mp3 | Поднебесные пастухи | «Наши туры пасутся выше облаков. А ты откуда поднялся?» | Orus |
| race_podnebesnye_pastuhi_x_g.mp3 | Поднебесные пастухи (второй голос) | «Наши туры пасутся выше облаков. А ты откуда поднялся?» | Sulafat |
| race_parusnye_stany_g.mp3 | Парусные станы | «Станы ставим там, где ветер поёт в нитях. Слышишь?» | Sulafat |
| race_parusnye_stany_x_g.mp3 | Парусные станы (второй голос) | «Станы ставим там, где ветер поёт в нитях. Слышишь?» | Orus |
| race_tenetniki_chasch_g.mp3 | Тенетники чащ | «Не задень нить. Каждая из них кому-нибудь да скажет.» | Sulafat |
| race_tenetniki_chasch_x_g.mp3 | Тенетники чащ (второй голос) | «Не задень нить. Каждая из них кому-нибудь да скажет.» | Orus |
| race_letopisnye_pancyri_g.mp3 | Летописные панцири | «Всё запишем. Не спеши — летопись длиннее жизни.» | Orus |
| race_letopisnye_pancyri_x_g.mp3 | Летописные панцири (второй голос) | «Всё запишем. Не спеши — летопись длиннее жизни.» | Sulafat |
| race_lekarskie_pancyri_g.mp3 | Лекарские панцири | «Покажи, где болит. Медленно, но вылечим.» | Orus |
| race_lekarskie_pancyri_x_g.mp3 | Лекарские панцири (второй голос) | «Покажи, где болит. Медленно, но вылечим.» | Sulafat |
| race_solncekaty_g.mp3 | Солнцекаты | «Солнце катится — и мы за ним. Не стой на пути.» | Orus |
| race_solncekaty_x_g.mp3 | Солнцекаты (второй голос) | «Солнце катится — и мы за ним. Не стой на пути.» | Sulafat |
| race_stekloduvy_dyun_g.mp3 | Стеклодувы дюн | «Песок и жар — вот и всё стекло. Остальное — дыхание.» | Orus |
| race_stekloduvy_dyun_x_g.mp3 | Стеклодувы дюн (второй голос) | «Песок и жар — вот и всё стекло. Остальное — дыхание.» | Sulafat |
| race_shovnye_zavesniki_g.mp3 | Шовные завесники | «Шов позади, туман впереди. Держись за мой рукав.» | Leda |
| race_shovnye_zavesniki_x_g.mp3 | Шовные завесники (второй голос) | «Шов позади, туман впереди. Держись за мой рукав.» | Iapetus |
| race_rassvetnye_zavesniki_g.mp3 | Рассветные завесники | «На рассвете Завеса тоньше всего. Пойдём, пока светло.» | Leda |
| race_rassvetnye_zavesniki_x_g.mp3 | Рассветные завесники (второй голос) | «На рассвете Завеса тоньше всего. Пойдём, пока светло.» | Iapetus |
| race_nornye_kupcy_g.mp3 | Норные купцы | «В норе тесно, зато цены просторные. Заходи!» | Iapetus |
| race_nornye_kupcy_x_g.mp3 | Норные купцы (второй голос) | «В норе тесно, зато цены просторные. Заходи!» | Leda |
| race_medovye_ryzhehvosty_g.mp3 | Медовые рыжехвосты | «Мёд свежий, наливка крепкая, а сдача — честная.» | Iapetus |
| race_medovye_ryzhehvosty_x_g.mp3 | Медовые рыжехвосты (второй голос) | «Мёд свежий, наливка крепкая, а сдача — честная.» | Leda |
| race_zvonari_bashen_g.mp3 | Звонари башен | «Слышишь звон? Это башня с тобой поздоровалась.» | Leda |
| race_zvonari_bashen_x_g.mp3 | Звонари башен (второй голос) | «Слышишь звон? Это башня с тобой поздоровалась.» | Iapetus |
| race_kamertonnye_kolokolniki_g.mp3 | Камертонные колокольники | «Скажи ещё раз — ты сфальшивил на последнем слове.» | Leda |
| race_kamertonnye_kolokolniki_x_g.mp3 | Камертонные колокольники (второй голос) | «Скажи ещё раз — ты сфальшивил на последнем слове.» | Iapetus |
| race_glubinnye_sadovniki_g.mp3 | Глубинные садовники | «Внизу тоже растут сады. Только поливают их тишиной.» | Iapetus |
| race_glubinnye_sadovniki_x_g.mp3 | Глубинные садовники (второй голос) | «Внизу тоже растут сады. Только поливают их тишиной.» | Leda |
| race_izgorodniki_g.mp3 | Изгородники | «Изгородь держит не колья, а корни. Обходи слева.» | Iapetus |
| race_izgorodniki_x_g.mp3 | Изгородники (второй голос) | «Изгородь держит не колья, а корни. Обходи слева.» | Leda |
| race_nochnye_chtecy_g.mp3 | Ночные чтецы | «Ночь длинная, книга толстая. Присядешь — дочитаю вслух.» | Leda |
| race_nochnye_chtecy_x_g.mp3 | Ночные чтецы (второй голос) | «Ночь длинная, книга толстая. Присядешь — дочитаю вслух.» | Iapetus |
| race_storozhevye_sovinoglazye_g.mp3 | Сторожевые совиноглазые | «Вижу тебя давно. Назовись, пока я добрая.» | Leda |
| race_storozhevye_sovinoglazye_x_g.mp3 | Сторожевые совиноглазые (второй голос) | «Вижу тебя давно. Назовись, пока я добрая.» | Iapetus |
| race_ugolnye_ochagi_g.mp3 | Угольные очаги | «У очага жарко, зато не пусто. Грейся, но не трогай угли.» | Umbriel |
| race_ugolnye_ochagi_x_g.mp3 | Угольные очаги (второй голос) | «У очага жарко, зато не пусто. Грейся, но не трогай угли.» | Callirrhoe |
| race_zakalschiki_g.mp3 | Закальщики | «Клинок кричит в воде — значит, будет жить.» | Umbriel |
| race_zakalschiki_x_g.mp3 | Закальщики (второй голос) | «Клинок кричит в воде — значит, будет жить.» | Callirrhoe |
| race_podlyodnye_nerpichi_g.mp3 | Подлёдные нерпичи | «Подо льдом тихо и рыбно. Наверху — шумно и холодно.» | Callirrhoe |
| race_podlyodnye_nerpichi_x_g.mp3 | Подлёдные нерпичи (второй голос) | «Подо льдом тихо и рыбно. Наверху — шумно и холодно.» | Umbriel |
| race_shhernye_lovcy_g.mp3 | Шхерные ловцы | «Сеть пустая не бывает — бывает нетерпеливый ловец.» | Callirrhoe |
| race_shhernye_lovcy_x_g.mp3 | Шхерные ловцы (второй голос) | «Сеть пустая не бывает — бывает нетерпеливый ловец.» | Umbriel |
| race_kitovye_pastuhi_g.mp3 | Китовые пастухи | «Наш город плывёт на ките. Ступай мягче — он чувствует.» | Umbriel |
| race_kitovye_pastuhi_x_g.mp3 | Китовые пастухи (второй голос) | «Наш город плывёт на ките. Ступай мягче — он чувствует.» | Callirrhoe |
| race_ambrovye_kitoglavy_g.mp3 | Амбровые китоглавы | «Амбра пахнет морем и деньгами. Сколько дашь?» | Umbriel |
| race_ambrovye_kitoglavy_x_g.mp3 | Амбровые китоглавы (второй голос) | «Амбра пахнет морем и деньгами. Сколько дашь?» | Callirrhoe |
| race_rifovody_g.mp3 | Рифоводы | «Риф растёт медленно. Не ломай то, что старше тебя.» | Callirrhoe |
| race_rifovody_x_g.mp3 | Рифоводы (второй голос) | «Риф растёт медленно. Не ломай то, что старше тебя.» | Umbriel |
| race_zhemchuzhnye_korallidy_g.mp3 | Жемчужные кораллиды | «Жемчуг — это слеза моря. Мы бережём каждую.» | Callirrhoe |
| race_zhemchuzhnye_korallidy_x_g.mp3 | Жемчужные кораллиды (второй голос) | «Жемчуг — это слеза моря. Мы бережём каждую.» | Umbriel |
| race_nochnye_ogni_g.mp3 | Ночные огни | «Видишь свет в воде? Это мы. Не бойся.» | Callirrhoe |
| race_nochnye_ogni_x_g.mp3 | Ночные огни (второй голос) | «Видишь свет в воде? Это мы. Не бойся.» | Umbriel |
| race_strekalschiki_g.mp3 | Стрекальщики | «Тронешь без спросу — обожжёшься. Спроси.» | Callirrhoe |
| race_strekalschiki_x_g.mp3 | Стрекальщики (второй голос) | «Тронешь без спросу — обожжёшься. Спроси.» | Umbriel |
| race_shtormovye_locmany_g.mp3 | Штормовые лоцманы | «Буря близко. Хочешь дойти — слушай меня, а не небо.» | Alnilam |
| race_shtormovye_locmany_x_g.mp3 | Штормовые лоцманы (второй голос) | «Буря близко. Хочешь дойти — слушай меня, а не небо.» | Erinome |
| race_spasateli_skal_g.mp3 | Спасатели скал | «Держи верёвку! Скала не ждёт.» | Alnilam |
| race_spasateli_skal_x_g.mp3 | Спасатели скал (второй голос) | «Держи верёвку! Скала не ждёт.» | Erinome |
| race_hraniteli_rakovin_g.mp3 | Хранители раковин | «Приложи раковину к уху — она помнит твой голос.» | Erinome |
| race_hraniteli_rakovin_x_g.mp3 | Хранители раковин (второй голос) | «Приложи раковину к уху — она помнит твой голос.» | Alnilam |
| race_perlamutrovye_otshelniki_g.mp3 | Перламутровые отшельники | «Мы живём одни, но не в одиночестве. Море говорит с нами.» | Erinome |
| race_perlamutrovye_otshelniki_x_g.mp3 | Перламутровые отшельники (второй голос) | «Мы живём одни, но не в одиночестве. Море говорит с нами.» | Alnilam |
| race_schisliteli_g.mp3 | Счислители | «Звёзд над островом ровно столько, сколько надо. Я пересчитал.» | Alnilam |
| race_schisliteli_x_g.mp3 | Счислители (второй голос) | «Звёзд над островом ровно столько, сколько надо. Я пересчитал.» | Erinome |
| race_zvezdolocmany_g.mp3 | Звездолоцманы | «Курс по звёздам верный. Отчаливаем на рассвете.» | Alnilam |
| race_zvezdolocmany_x_g.mp3 | Звездолоцманы (второй голос) | «Курс по звёздам верный. Отчаливаем на рассвете.» | Erinome |
| race_posolskie_maski_g.mp3 | Посольские маски | «Под этой маской — посол. Под той — друг. Выбирай.» | Erinome |
| race_posolskie_maski_x_g.mp3 | Посольские маски (второй голос) | «Под этой маской — посол. Под той — друг. Выбирай.» | Alnilam |
| race_taynye_maski_g.mp3 | Тайные маски | «Ты меня не видел. И я тебя тоже.» | Erinome |
| race_taynye_maski_x_g.mp3 | Тайные маски (второй голос) | «Ты меня не видел. И я тебя тоже.» | Alnilam |
| race_rudoedy_g.mp3 | Рудоеды | «Руда вкусная, когда жила чистая. Хочешь кусочек?» | Alnilam |
| race_rudoedy_x_g.mp3 | Рудоеды (второй голос) | «Руда вкусная, когда жила чистая. Хочешь кусочек?» | Erinome |
| race_shtolniki_g.mp3 | Штольники | «Штольня длинная, а выход один. Не потеряйся.» | Alnilam |
| race_shtolniki_x_g.mp3 | Штольники (второй голос) | «Штольня длинная, а выход один. Не потеряйся.» | Erinome |
