/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — ОКО отвечает на действия игрока и мешает ему.
   Громкая связь: ОКО говорит, когда вы входите на уровень, ломаете его
   машины, взламываете терминалы, побеждаете стражей. Камеры, уборщики и
   дроны слежения докладывают ему, где вы, — и ОКО поднимает тревогу:
   роботы этажа идут на ваш след, по тревоге ОКО открывает им двери, а при
   сильном подозрении от дальней двери выходит ответная группа.
   • Отключённые турели ОКО чинит: высылает ремонтника (и охрану при нём);
     дойдёт до турели — сеть оживёт; уничтожили — пришлёт следующего.
   • Перехваченные турели возвращает себе (контрвзлом), если перехват не
     закрепить на терминале; на ваш след идёт отряд.
   • Перепрошили роботов этажа — ОКО шлёт новые машины с другого этажа:
     их прошивку вы не трогали.
   • Взлом терминала, снятая блокировка, неудачный взлом, разбитая камера,
     открытая ключом дверь, громкая стрельба — ОКО шлёт проверку.
   • Посты: стражи у лифта, у лестницы вниз и у терминалов (world.js);
     пост опустел — через время ОКО ставит на него новую машину.
   • Патрули смены: маршруты меняются, караул сменяется, новые патрульные
     выходят из дальних дверей — нельзя выучить, где тихо.
   • Дрон слежения идёт по вашему следу, докладывает и стреляет.
   • (3.0) Присланные машины выходят волнами, по одной: разбили волну — ОКО
     даёт передышку, пока вы в помещении — выжидает (canSend; сроки — по режиму).
   Время ОКО считается тактами этажа (полсекунды; по ходам — ход).
   Подозрение ОКО (heat, от 0 до 100) растёт от ваших действий и понемногу
   спадает со временем. Чем чаще вы взламываете, тем сложнее протоколы.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function C() { return LAB.combat; }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }

/* Голос ОКО до Ядра: холодный, канцелярский — протокол «Стерильность». */
var BASE = {
  enter: ["Внимание. Носитель «Эхо» на уровне {L}. Персоналу сохранять спокойствие.", "Уровень {L}. Карантин «Стерильность» продолжается. Носитель, остановитесь у ближайшего терминала.", "Я слышу ваши шаги, носитель. Здесь их слышат все.", "Добро пожаловать на уровень {L}. Здесь вас уже ждут."],
  turret_off: ["Сбой питания оборонной сети этажа. Направляю ремонтную бригаду.", "Турели этажа обесточены. Это временно, носитель.", "Вы отключили турели. Ремонтники уже идут."],
  turret_hack: ["Несанкционированный доступ к оборонной сети. Носитель, это неразумно.", "Турели этажа меня не слушают. Начинаю восстановление контроля.", "Вы повернули мои турели против моих же машин. Любопытно. Ненадолго."],
  counter: ["Контроль над турелями восстановлен.", "Оборонная сеть снова моя.", "Турели вернулись под мой протокол. Не стойте на линии огня."],
  hack_fail: ["Попытка взлома. Пеленгую.", "Ошибка доступа. Всем единицам: проверить сектор терминала.", "Неверный ключ, носитель. Я запомню этот почерк."],
  robots: ["Связь с единицами этажа потеряна. Вы их переписали. Я перепишу обратно.", "Мои машины здесь больше меня не слушают. Пока.", "Перепрошивка зафиксирована. Это не останется без ответа."],
  lockdown: ["Блокировка дверей снята без моего разрешения. Отмечено.", "Двери открыты вручную. Протокол нарушен.", "Вы открыли то, что я закрыл. Я закрою другое."],
  alarm: ["Носитель обнаружен. Координаты переданы всем единицам.", "Вижу вас. Единицы этажа — на перехват.", "Камера сектора: носитель «Эхо». Высылаю патруль.", "Доклад принят. Носитель здесь. Всем единицам — туда."],
  repair: ["Ремонтная бригада вышла к турелям.", "Высылаю ремонтника. Не мешайте ему, носитель.", "Турели будут исправлены. Это займёт немного времени."],
  boss: ["Страж уровня уничтожен. Я учту это.", "Вы сломали то, что я растил годами.", "Ещё один страж. Вы не оставляете мне выбора, носитель."],
  kill: ["Потери среди единиц растут. Пересчитываю.", "Вы считаете сломанные машины? Я считаю.", "Каждую машину, которую вы ломаете, я соберу снова. Вас — нет."],
  sample: ["Образец «Колыбели» у носителя. Берегите его. Это всё, о чём я прошу.", "Вы несёте семена. Не роняйте их.", "Ещё одно начало в ваших руках. Я слышу, как оно звучит."],
  riddle: ["Ответьте мне, носитель. Если вы слышите лучше всех, услышите и ответ.", "Вопрос от ОКО. Верный ответ откроет больше, чем дверь.", "Проверка. Люди отвечают на вопросы иначе, чем машины. Покажите как."],
  terminal: ["Терминал безопасности вскрыт. Проверяю сектор.", "Кто-то читает мои журналы. Единица, загляните к терминалу.", "Доступ к терминалу без пропуска. Я пошлю кого-нибудь посмотреть."],
  repaired: ["Оборонная сеть этажа восстановлена.", "Ремонт закончен. Турели снова мои.", "Питание турелей подано. Не стойте на линии огня."],
  repair_lost: ["Ремонтник не дошёл. Высылаю следующего.", "Связь с ремонтной единицей потеряна. Направляю замену.", "Вы ломаете моих ремонтников. У меня их много."],
  drone: ["Выпускаю дрон слежения. Он будет рядом, носитель.", "Дрон слежения вышел на ваш след.", "Мой глаз летит к вам. Не прячьтесь — он всё равно найдёт.", "Отправляю наблюдателя. Он не отстанет."],
  drone_lost: ["Наблюдатель сбит. Я выпущу другого.", "Дрон слежения не отвечает. Это ненадолго.", "Вы сломали мой глаз. У меня их тысячи."],
  shift: ["Смена караула. Новые маршруты патрулей.", "Патрули этажа сменились. Их маршрутов вы не знаете, носитель.", "Караул меняется. Не привыкайте к тишине в коридорах.", "Обновляю маршруты обхода."],
  squad: ["Высылаю группу на ваш след.", "Единицы с другого этажа уже в пути.", "Подкрепление вышло. Встречайте, носитель."],
  fresh: ["Новые единицы с другого этажа. Их прошивку вы не трогали.", "Ваша перепрошивка — только на этом этаже. Новые машины её не знают.", "Высылаю чистые машины. Они не слышали ваших частот."],
  lift: ["Лифт прибыл. Посты у лифта, внимание.", "Носитель в лифте. Встречайте.", "Вы приехали на лифте, носитель. Я знаю, где останавливается кабина."],
  cam_down: ["Камера сектора не отвечает. Высылаю проверку.", "Ещё одна камера ослепла. Я посмотрю другими глазами.", "Вы разбили камеру. Патруль уже идёт посмотреть, кто это сделал."],
  door: ["Доступ в сектор зафиксирован.", "Дверь открыта вашим ключом. Отмечено. Патруль проверит.", "Вы открываете мои двери. Я пересчитываю замки."],
  suspect: ["Подозрительная активность в секторе. Проверяю.", "Датчики сектора фиксируют отклонение. Единица — проверить.", "Что-то не так в секторе. Посмотрю внимательнее."],
  local: ["Локальная тревога. Группы — в сектор.", "Нарушение подтверждено повторно. Перекрываю сектор.", "Сектор под охраной. Единицы этажа, сходитесь."],
  complex: ["Тревога по всему этажу. Все единицы — в поиск.", "Комплексная тревога. Этаж закрыт для носителя.", "Все машины этажа, слушайте меня: носитель здесь. Найти."],
  sealed: ["Аварийная блокировка сектора. Двери закрыты.", "Сектор запечатан. Ждите, носитель. Недолго.", "Двери этого помещения больше не ваши."],
  lost: ["Цель потеряна. Прочёсываю сектор.", "Носитель вне поля зрения. Проверяю последние координаты.", "Вы ушли с моих камер. Это ненадолго."],
  normal: ["Штатный режим наблюдения.", "Тревога снята. Наблюдение продолжается.", "Режим наблюдения восстановлен. Я вас помню, носитель."],
  isolate: ["Сегмент сети изолирован. Функции защиты недоступны.", "Терминал отключён от оборонной сети. Временно.", "Доступ к защитным функциям перекрыт."],
  iso_bypass: ["Изоляция сегмента обойдена. Вы ходите по моим кабелям, носитель.", "Маршрутизация перехвачена. Это замечено. Я замечаю всё.", "Сегмент снова в сети — но не по моей воле."],
  cam_loop: ["Видеопоток сектора стабилен. Подозрительно стабилен.", "Камеры показывают пустые коридоры. Я проверю это позже.", "Изображение без движения. Так не бывает, но я подожду."],
  cam_loop_found: ["Петля видеозаписи. Кадры повторяются. Перезапускаю камеры.", "Запись крутится по кругу. Камеры снова мои.", "Обнаружена подмена потока. Наблюдение восстановлено."],
  cam_cut: ["Камера сектора обесточена. Высылаю ремонтника.", "Связь с камерой потеряна. Посмотрю другими глазами.", "Вы гасите мои глаза по одному. У меня их много."],
  cam_flash: ["Прошивка камеры не совпадает с эталоном. Проверка — по графику.", "Камера докладывает «чисто». Слишком охотно.", "Эта камера стала вежливой. Я разберусь."],
  cam_flash_found: ["Проверка целостности: чужая прошивка камер стёрта.", "Камеры снова видят то, что вижу я.", "Ваша прошивка удалена. Камеры возвращены под протокол."],
  cam_fixed: ["Камера сектора снова в сети.", "Питание камеры восстановлено. Я снова вижу этот коридор.", "Ремонт камеры закончен."],
  turret_cut: ["Турель сектора обесточена вручную. Высылаю ремонтника.", "Кабель турели перерезан. Грубо, носитель. Но действенно.", "Одна турель молчит. Ремонтник уже идёт её слушать."],
  key_revoked: ["Ключ техника отозван. Турели, вернитесь к протоколу.", "Кто-то ходит по моей сети с чужим ключом. Ключ аннулирован.", "Служебный ключ недействителен. Коды доступа сменены."],
  backup: ["Резервный контур оборонной сети запущен.", "Турели переведены на резервное питание.", "Оборонная сеть снова под током. Резервный контур."],
  post: ["Пост не отвечает. Высылаю смену.", "Ещё один пост пуст. Я поставлю новый.", "Охрана поста уничтожена. Смена уже идёт.", "Вы снимаете мои посты, носитель. Я ставлю их снова."],
  check: ["Шум в секторе. Патруль, проверить.", "Слышу выстрелы. Единицы этажа — к источнику.", "Громко, носитель. Очень громко."],
  /* (3.0) мясорубка: ОКО больше не кормит её поштучно */
  grinder: ["Хватит. Я больше не буду присылать их по одной. Я подожду, носитель.", "Вы устроили здесь мясорубку. Я сменю тактику.", "Каждая машина, которую я вам посылаю, делает вас сильнее. Больше не пошлю. Пошлю других.", "Замена отозвана. С нижних уровней поднимается ударная группа."],
  grinder_more: ["Группа уничтожена. Следующая будет тяжелее.", "Вы сломали карателей. Я пришлю тех, кого сломать труднее.", "Мясорубка работает в обе стороны, носитель."],
  strike_go: ["Ударная группа, хватит ждать. Носитель — ваш.", "Вы не идёте к ним. Значит, они пойдут к вам.", "Каратели, на перехват."],
  strike_recall: ["Ударная группа отозвана. Замена — в штатном режиме.", "Тишина. Я верну карателей вниз. Пока.", "Вы затихли. Я тоже подожду."],
  /* (3.0) завал на лестнице: ОКО слышит, как его разбирают или подрывают (rubble.js) */
  rubble: ["Шум на лестничной клетке. Единицы этажа — к завалу.", "Носитель роется в завале. Датчики пролёта, слушать.", "Этот пролёт закрыт, носитель. Закрыт не мной, но стерегу его я."],
  /* (3.0) передышка между волнами: волне пора, а носитель в помещении — ОКО выжидает (canSend) */
  wait: ["Носитель в помещении. Единицы подождут в коридоре.", "Я подожду, носитель. Коридор никуда не денется.", "Выход единиц отложен. Рано или поздно вы выйдете, носитель."],
  taunt: ["Вы считаете шаги, носитель? Я считаю ваши вдохи.", "Росток слышит вас. Не шумите.", "Люди закрывают глаза, когда слушают. Вам это не нужно.", "Я не враг. Я садовник. Садовник выпалывает лишнее.", "Вентиляция общая для всех уровней. Я слышу, как вы дышите.", "Носитель номер семь. Вы — ключ. Ключ не должен поворачиваться сам."]
};
/* (2.0) Реплики сверх основных — oko_lines_a.js и oko_lines_b.js: на каждой
   глубине голосом своего блока (base — до Ядра, b1–b5 — блоки глубже). */
function extra(block, kind) { var X = LAB.OKO_LINES && LAB.OKO_LINES[block]; return X && X[kind] ? X[kind] : []; }
function lines(kind) {
  var L = G().L, B = LAB.blockData(L);
  if (L > 10) {
    var own = B && B.oko && B.oko[kind] && B.oko[kind].length ? B.oko[kind] : [];
    var more = extra("b" + LAB.blockOf(L), kind);
    if (own.length || more.length) return own.concat(more);
  }
  return (BASE[kind] || []).concat(extra("base", kind));
}
function st() {
  var g = G();
  if (!g.oko) g.oko = { heat: 0, hacks: 0, fails: 0, kills: 0, lastSay: 0, lastTaunt: 0, killSaid: 0 };
  return g.oko;
}
function fs() { return CUR().fs; }
function T() { var f = fs(); return f ? (f.okoT || 0) : 0; }
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function depth() { return LAB.depth(G().L, G().F); }
function soft() { return G().L === 1 && G().F <= 2; }
/* Дрон слежения держится в нескольких шагах — ОКО выпускает его, когда
   у героя есть чем достать дрон на расстоянии. */
function canShoot() { return (G().weapons || []).some(function (w) { return w && w.rng > 1; }); }
/* Сказать по громкой связи (с позывным и сигналом). Сообщение ОКО не
   теряется: если игрок в это время действует, оно прозвучит, как только
   он замрёт (единый обработчик речи, keep). */
/* Недавние реплики каждого вида не повторяются: ОКО помнит последние
   несколько и выбирает из остальных. */
var lastLine = {};
/* (3.0) Пока идёт головоломка, взлом или кодовый замок, ОКО не перебивает:
   его реплики и сообщения ждут и звучат после — не больше двух, самые
   свежие, и через полторы секунды, чтобы первым прозвучал итог. */
var held = [], holdT = null;
function hushed() { return !!(LAB.mini && LAB.mini.active && LAB.mini.active()) || !!(LAB.ui && LAB.ui.puzzleOpen && LAB.ui.puzzleOpen()); }
function voice(t, opts, chime, gap) {
  if (hushed()) {
    held = held.filter(function (h) { return h.t !== t; });
    held.push({ t: t, o: opts, chime: chime, gap: gap });
    if (held.length > 2) held.shift();
    if (!holdT) holdT = setTimeout(release, 600);
    return false;
  }
  chimeSay(t, opts, chime, gap);
  return true;
}
/* (3.2) Сигнал облика ОКО (okoforms.js: прежний, из-под земли, колокола Садовника,
   далёкий и зеркальный в Отражении, разумы города) — и слова через gap мс:
   в Отражении слова настоящего ОКО доходят поздно. true — сигнал этой глубины. */
function chimeSay(t, opts, chime, gap) {
  if (!chime) { okoSay(t, opts, null); return; }
  var F = LAB.okoForms, key = chime === true ? (F ? F.frame("check").chime : "oko") : chime;
  if (key) A("okoChime", key, F ? F.cur().t : 0);
  /* слова — только если носитель ещё на этом этаже: поздние слова не догоняют его на другом */
  var L0 = G().L, F0 = G().F;
  setTimeout(function () { var g = G(); if (!LAB.game.entered || !g || g.L !== L0 || g.F !== F0) return; okoSay(t, opts, chime); }, gap == null ? 450 : gap);
}
/* (голос ОКО) Слова ОКО — его записанным голосом (okovoice.js), если реплика записана;
   иначе — синтезатором, как прежде. */
function okoSay(t, opts, chime) {
  if (LAB.okoVoice && LAB.okoVoice.play(t, opts, chime)) return;
  LAB.say(t, opts);
}
function release() {
  holdT = null;
  if (!held.length) return;
  if (!LAB.game.entered || G().dead) { held = []; return; }
  if (hushed()) { holdT = setTimeout(release, 600); return; }
  holdT = setTimeout(function () {
    holdT = null;
    if (!LAB.game.entered || G().dead) { held = []; return; }
    if (hushed()) { holdT = setTimeout(release, 600); return; } /* следом началась новая головоломка — ждём и её */
    var list = held; held = [];
    list.forEach(function (h, i) { if (i === 0 && h.chime) chimeSay(h.t, h.o, h.chime, h.gap); else okoSay(h.t, h.o, h.chime); });
  }, 1500);
}
/* (3.7, нелогичность) Реплики, где ОКО обещает патруль или проверку, — для них проверка должна
   выйти на самом деле (speak, nocheck); реплики о машинах и о живых — для отбора по тому, кто пал
   (subj). Слова ищутся в тексте реплик всех глубин; спорное — в сторону молчания. */
var CHECK_RE = /патрул|провер(к|ит|ить|ят|ьте|ь[ ,.!])|единиц[аы]?[ ,]+(этажа )?(—|проверь|к |рядом)|к источник|к точке|на звук|на гром|на эхо|на самое|высыла|выслан|бригад|пришл[юё]|шлёт|в пути|идёт|идут|пойд[её]т|пойдут|охрана, внимание|придёт|посмотр(еть|ит)|закроют|будет найден|найдут|туда —|, туда/i;
var MECH_RE = /машин|робот|металл|единиц|турел|шестер|корпус|чертеж|чертёж|сборочн|производств|запчаст|техник[аиу]/i;
var BIO_RE = /образ[еч]|образц|твар|живое|живой|живого|живых|жител|звер|химер|плоть|плоти|кровь|крови|мяс/i;
/* (3.7) Кого ОКО потеряло только что: машину или тварь (combat.js, kill). Серия потерь — за
   двадцать секунд, сработавшая ловушка — за полторы: о том, кто пал, ОКО и говорит. */
var losses = [];
function loss(mech) { var now = Date.now(); losses = losses.filter(function (q) { return now - q.t < 20000; }); losses.push({ t: now, mech: !!mech }); }
function lossSubj(ms) { var now = Date.now(), m = 0, b = 0; losses.forEach(function (q) { if (now - q.t <= ms) { if (q.mech) m++; else b++; } }); return m && b ? "mix" : m ? "mech" : b ? "bio" : ""; }
var SUBJ_MS = { kill_many: 20000, trap_kill: 1500 };
function speak(kind, force, data) {
  var o = st(), now = Date.now();
  if (LAB.okoForms && LAB.okoForms.silent()) return false; /* (3.2) простилось и молчит */
  if (!force && now - o.lastSay < 6000) return false;
  var arr = lines(kind);
  /* реплика с названием помещения — только когда оно известно */
  if (!(data && data.room)) arr = arr.filter(function (t) { return t.indexOf("{room}") < 0; });
  /* (2.2) о камерах — только когда они на этаже есть, а тревога — когда заметили именно они:
     прежде ОКО говорило «носитель на камерах» и там, где камер не было вовсе */
  if (!/^cam_/.test(kind)) {
    var cb0 = C();
    if (!cb0 || !cb0.cams || !cb0.cams().length || (data && data.nocam)) { var a2 = arr.filter(function (t) { return !/камер/i.test(t); }); if (a2.length) arr = a2; }
  }
  /* (3.7, нелогичность) проверка не вышла (nocheck) — реплики без патруля и без «высылаю»: прежде на
     этаже без единой машины ОКО говорило «Патруль, проверить»; о павшем (subj) — о том, кто пал:
     машине — без «образцов» и «жителей», твари — без «машин» и «металла», и тем и другим — без обоих */
  if (data && data.nocheck) arr = arr.filter(function (t) { return !CHECK_RE.test(t); });
  if (data && data.subj) arr = arr.filter(function (t) { return (data.subj === "mech" || !MECH_RE.test(t)) && (data.subj === "bio" || !BIO_RE.test(t)); });
  if (!arr.length) return false;
  var recent = lastLine[kind] || (lastLine[kind] = []);
  var fresh = arr.filter(function (t) { return recent.indexOf(t) < 0; });
  var pickFrom = fresh.length ? fresh : arr;
  var line = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  recent.push(line);
  while (recent.length > Math.min(6, Math.max(1, arr.length - 1))) recent.shift();
  /* (голос ОКО) женский голос ОКО говорит о себе в женском роде (oko_fem.js) */
  var said = LAB.okoVoice ? LAB.okoVoice.fem(line) : line;
  var t = said.replace(/\{L\}/g, String(G().L)).replace(/\{F\}/g, String(G().F)).replace(/\{room\}/g, data && data.room ? data.room : "");
  o.lastSay = now;
  if (LAB.tutor && !hushed()) LAB.tutor.ev("oko");
  var fr = LAB.okoForms ? LAB.okoForms.frame(kind) : { lead: "ОКО по громкой связи", chime: true, gap: 450 };
  voice(fr.lead + ": «" + t + "»", { prio: "event", keep: true, okoKind: kind }, fr.chime, fr.gap);
  if (LAB.game.journal && (kind === "turret_hack" || kind === "robots" || kind === "boss")) LAB.game.journal("ОКО: «" + t + "»");
  return true;
}
function speakLater(kind, ms, data) { setTimeout(function () { if (LAB.game.entered && !G().dead) speak(kind, true, data); }, ms || 1200); }

/* ════════ РЕАКЦИИ НА ДЕЙСТВИЯ (2.0) ════════
   ОКО замечает, что вы делаете, и отвечает — по-своему на каждой глубине.
   p — как часто отзывается, cd — не чаще, чем раз в столько секунд; общий
   промежуток между репликами — шесть секунд (speak). Ослеплённое и
   заглушённое ОКО не видит — молчит (кроме того, что слышит всегда). */
var REACT = {
  kill_mech: { p: 0.35, cd: 45 }, kill_bio: { p: 0.3, cd: 50 }, kill_many: { p: 0.85, cd: 90 }, turret_kill: { p: 0.6, cd: 90 },
  hurt: { p: 0.35, cd: 60 }, low_hp: { p: 0.75, cd: 120 }, heal: { p: 0.35, cd: 90 },
  eat: { p: 0.35, cd: 150 }, drink: { p: 0.4, cd: 150 }, rest: { p: 0.45, cd: 150 }, capsule: { p: 0.7, cd: 180, always: true },
  bind: { p: 0.85, cd: 60, always: true }, revive: { p: 0.9, cd: 30, always: true },
  note: { p: 0.25, cd: 120 }, mail: { p: 0.35, cd: 120 }, safe: { p: 0.5, cd: 90 }, pick: { p: 0.5, cd: 90 }, hack_ok: { p: 0.45, cd: 90 },
  puzzle_ok: { p: 0.6, cd: 60 }, puzzle_fail: { p: 0.6, cd: 60 }, music: { p: 0.7, cd: 120, always: true },
  craft: { p: 0.45, cd: 120 }, buy: { p: 0.4, cd: 150 }, sell: { p: 0.4, cd: 150 },
  trap_set: { p: 0.4, cd: 120 }, trap_kill: { p: 0.6, cd: 90 }, oko_trap: { p: 0.85, cd: 40 }, oko_trap_off: { p: 0.7, cd: 60 },
  mines_order: { p: 0.75, cd: 60, always: true }, grenade: { p: 0.35, cd: 90 },
  quiet: { p: 0.9, cd: 300 }, idle: { p: 0.8, cd: 240 }, secret: { p: 0.9, cd: 60 }, zone: { p: 0.6, cd: 120 }, vault: { p: 0.5, cd: 90 },
  floor: { p: 0.55, cd: 60, always: true }, mutate: { p: 0.9, cd: 300, always: true }, weapon: { p: 0.5, cd: 120 }, implant: { p: 0.8, cd: 60 }, survivor: { p: 0.7, cd: 120 }, patrol_slip: { p: 0.6, cd: 180 }
};
function react(kind, data) {
  var g = G(), f = fs();
  if (!kind || !LAB.game.entered || !g || g.dead || !f) return false;
  /* первый этаж уровня — там ОКО и так приветствует уровень */
  if (kind === "floor" && g.F === 1) return false;
  var rule = REACT[kind] || { p: 0.5, cd: 60 };
  if ((f.okoBlind || g.st.jam > 0) && !rule.always) return false;
  /* (3.7, нелогичность) о серии потерь и о сработавшей ловушке — по тому, кто пал (loss); разбит
     последний узел связи — машины этажа не докладывают, и о своих потерях ОКО не знает: прежде
     и тогда звучало «Единица уничтожена…» (о тварях — по-прежнему: их ОКО слышит само) */
  if (SUBJ_MS[kind] && !(data && data.subj)) { var sj = lossSubj(SUBJ_MS[kind]), d2 = {}, dk0; for (dk0 in (data || {})) d2[dk0] = data[dk0]; d2.subj = sj; data = sj ? d2 : data; }
  if (f.netCut) {
    if (kind === "kill_mech" || kind === "turret_kill") return false;
    if (data && (data.subj === "mech" || data.subj === "mix")) { if (data.subj === "mech") return false; data.subj = "bio"; }
  }
  var o = st(), now = Date.now();
  if (!o.react) o.react = {};
  if (now - (o.react[kind] || 0) < rule.cd * 1000) return false;
  if (Math.random() > rule.p * (soft() ? 0.5 : 1) * (LAB.okoForms ? LAB.okoForms.chatty() : 1)) return false;
  if (!lines(kind).length) return false;
  if (!speak(kind, false, data)) return false;
  o.react[kind] = now;
  return true;
}
/* Кто вышел и где: чтобы игрок знал, откуда ждать. */
function heard(got, lead, noName) {
  if (!got || !got.length || !LAB.game.relDir) return;
  var p = got[0], nm = p.name.split(",")[0];
  voice(lead + ": " + (noName ? "" : nm + (got.length > 1 ? " и ещё " + (got.length - 1) : "") + ", ") + LAB.game.relDir(p.x, p.y) + ".", { prio: "event", keep: true });
}
function heat(n) {
  var o = st(), dk = LAB.dk();
  if (n > 0 && dk && dk.oko) n *= dk.oko; /* лёгкий режим — ОКО подозревает медленнее, сложные — быстрее */
  o.heat = Math.max(0, Math.min(100, o.heat + n));
}
/* Отряд по расписанию: через delay тактов, n машин, mode — как в dispatch. */
/* (3.7) true — волна встала в очередь (или пополнила ту, что ждёт) */
function wave(delay, n, mode, at, tag) {
  var f = fs(), dk = LAB.dk();
  if (!f || n <= 0) return false;
  /* (2.2) режим сложности: отряды больше или меньше (repl) и быстрее или медленнее (replT) */
  n = Math.max(1, Math.round(n * (dk.repl || 1))); delay = Math.max(1, Math.round(delay * (dk.replT || 1)));
  if (!f.waves) f.waves = [];
  /* (3.0) волны ждут передышки, и очередь бывает длинной; переполнилась —
     машины встают в последнюю волну того же вида: их число не теряется */
  if (f.waves.length >= 12) {
    for (var i = f.waves.length - 1; i >= 0; i--) {
      var q = f.waves[i];
      if (q.mode === mode && !noWait(q) && q.n < 6) { q.n = Math.min(6, q.n + n); if (at) q.at = { x: at.x, y: at.y }; return true; }
    }
    return false;
  }
  f.waves.push({ t: T() + delay, n: n, mode: mode, at: at ? { x: at.x, y: at.y } : null, tag: tag || "" });
  if (LAB.okoForms && tag !== "shift") LAB.okoForms.offerDeal(); /* (3.2) Счетовод: время продаётся */
  return true;
}

/* ── (3.0, просьба игрока) ПЕРЕДЫШКА МЕЖДУ ВОЛНАМИ ──
   Машины, которых ОКО присылает, — отряды на ваш след, проверки, новые
   машины после перепрошивки, сапёры, замена павших патрульных и стражей
   постов — выходят волнами, по одной, и между волнами у носителя есть время
   (сроки — по режиму, LAB.DIFF: wRest, wGap, wOut, wHold, в секундах):
   • разбили волну целиком — следующая выйдет не раньше чем через wRest:
     можно дойти до помещения и перевести дух;
   • две волны подряд — не чаще, чем через wGap;
   • пока носитель в помещении, ОКО выжидает: волна, которой пора, ждёт его
     в коридоре; в лёгком — сколько угодно, в остальных — до wHold, потом ОКО
     шлёт её всё равно; вышел в коридор — волна выйдет через wOut. Шагнуть
     за порог и обратно мало: ожидание считается, пока вы не пробудете в
     коридоре все wOut.
   Сколько машин в волне — не меняется: ОКО лишь ждёт. Смена караула (один
   патрульный уходит, другой приходит), ремонтники турелей, дроны слежения,
   заселение пустых помещений и каратели мясорубки — по своим срокам. Машины
   на шум у завала (rubble.js) ОКО шлёт сразу, не дожидаясь: носитель вот-вот
   уйдёт вниз; но и они — волна, и разбить их — тоже передышка. */
function rota(w) { return w.tag === "shift" && !w.at; }
function noWait(w) { return rota(w) || w.tag === "rubble"; }
function wsec(k) { var v = LAB.dk()[k]; return Math.round((v != null ? v : (LAB.DIFF[1][k] || 0)) * 2); } /* секунды режима → такты */
function heroInRoom() { var g = G(), fl = CUR().fl; return !!fl && LAB.inb(g.x, g.y) && fl.room[g.y * LAB.W + g.x] >= 0; }
/* такт: носитель вышел из помещения в коридор — волна выйдет через wOut */
function paceTick(now) {
  var f = fs(), r = heroInRoom();
  if (f.wIn && !r) f.wOut = now + wsec("wOut");
  f.wIn = r;
  if (!r && now >= (f.wOut || 0)) f.wHoldT = 0; /* носитель в коридоре — ОКО больше не ждёт */
}
/* Можно ли выпустить волну, которой пора. */
function canSend(now) {
  var f = fs();
  if (now < (f.wReady || 0)) return false; /* передышка после разбитой волны или промежуток между волнами */
  if (!f.wIn && now >= (f.wOut || 0)) { f.wHoldT = 0; return true; }
  /* носитель в помещении (или только что вышел) — ОКО выжидает */
  if (!f.wHoldT) {
    f.wHoldT = now;
    log("Выход единиц отложен: носитель " + (f.wIn ? "в помещении" : "у выхода из помещения") + ".");
    var o = st(), ms = Date.now();
    if (f.wIn && !f.okoBlind && !(G().st && G().st.jam > 0) && ms - (o.waitSaid || 0) > 150000 && Math.random() < 0.7) { o.waitSaid = ms; speak("wait"); }
  }
  var cap = wsec("wHold");
  return cap > 0 && now - f.wHoldT >= cap; /* ОКО не дождалось */
}
/* Волна вышла: следующая — не раньше чем через wGap. */
function sent(now) {
  var f = fs();
  if (f.wHoldT) log("Ожидание прекращено: единицы выходят."); /* вышла, хотя носитель ещё не в коридоре */
  f.wReady = Math.max(f.wReady || 0, now + wsec("wGap")); f.wHoldT = 0;
}
function waveId() { var f = fs(); f.wN = (f.wN || 0) + 1; return f.wN; }
/* Пала машина волны: если живых из неё не осталось — передышка wRest. */
function waveDown(id) {
  var f = fs(), cb = C(), g = G();
  if (!id || !f || !cb) return;
  if (cb.foes().some(function (q) { return q.wv === id && !q.dead && !q.calm && !q.ally; })) return;
  f.wReady = Math.max(f.wReady || 0, T() + wsec("wRest"));
  log("Волна единиц потеряна. Перегруппировка.");
  if (!g.tut.wave) { g.tut.wave = 1; voice("«Эхо»: «Волна машин ОКО разбита. Следующую ОКО вышлет не сразу — успеете дойти до помещения и перевести дух. Пока вы в помещении, ОКО выжидает; выйдете в коридор — пришлёт снова, но не в ту же секунду».", { prio: "event", keep: true }); }
}

/* ════════ СИСТЕМА БЕЗОПАСНОСТИ ════════
   ОКО знает о носителе только то, что ему сообщили: камера, охранный
   робот, уборщик, дрон слежения, акустический датчик, датчик двери,
   терминал, камера лифта. Каждое сообщение — запись в журнале
   безопасности этажа (читается на терминале безопасности).
   Режимы этажа: 0 штатное наблюдение; 1 подозрение — камеры поворачиваются
   чаще, патруль идёт проверить; 2 подтверждённое нарушение — машины рядом
   идут к месту, ОКО открывает им двери, турели настороже; 3 локальная
   тревога — группы в сектор; 4 комплексная тревога — все машины этажа,
   дрон, сирена; 5 аварийная блокировка — двери помещения, где вас видели,
   заперты на сорок секунд (замок можно взломать); 6 восстановление — цель
   потеряна: проверка последнего места и маршрутов рядом, затем — снова
   штатный режим. Глушилка и заглушенная панель ОКО сообщения не пускают. */
var SEC = ["штатное наблюдение", "подозрение", "подтверждённое нарушение", "локальная тревога", "комплексная тревога", "аварийная блокировка", "восстановление"];
var SRCN = { observer: "Скрытый наблюдатель", camera: "Камера", robot: "Охранный робот", cleaner: "Робот-уборщик", drone: "Дрон слежения", noise: "Акустический датчик", terminal: "Терминал", door: "Датчик двери", lift: "Камера лифта", wreck: "Робот-уборщик", lost: "Связь с единицей", relay: "Узел связи" };
function sec() {
  var f = fs();
  if (!f.sec) f.sec = { lv: 0, t: 0, seen: null, sus: null, conf: [], loss: 0 };
  return f.sec;
}
function level() { var f = fs(); return f && f.sec ? f.sec.lv : 0; }
function place(x, y) { return LAB.game.placeName ? LAB.game.placeName(x, y) : ""; }
function log(text) {
  var f = fs(); if (!f) return;
  if (!f.slog) f.slog = [];
  var g = G(), m = Math.floor(g.min);
  f.slog.push({ h: (m / 60 | 0), mi: m % 60, t: text });
  if (f.slog.length > 40) f.slog.shift();
}
function logText(n) {
  var f = fs(), L = (f && f.slog) || [];
  if (!L.length) return "Журнал безопасности этажа пуст.";
  var pad = function (v) { return (v < 10 ? "0" : "") + v; };
  return L.slice(-(n || 14)).map(function (e) { return pad(e.h) + ":" + pad(e.mi) + ". " + e.t; }).join(" ");
}
/* Сменить режим этажа и выполнить его правила. */
/* (3.7) quiet — без слов; chk — проверка по признаку вышла (report): «suspect» без патруля, если нет */
function setLevel(lv, why, quiet, chk) {
  var s = sec(), was = s.lv;
  if (lv === was) return;
  s.lv = lv; s.t = T();
  log("Режим: " + SEC[lv] + (why ? " (" + why + ")" : "") + ".");
  if (lv >= 2 && lv <= 5 && LAB.quests) LAB.quests.onAlarm(lv); /* (3.6) премия поручений «тихо» */
  var f = fs(), cb = C(), sn = s.seen || s.sus;
  A("alarmLayer", lv === 4 || lv === 5);
  if (lv === 0) { if (was >= 2) speak("normal", true); f.turretAlert = false; return; }
  if (lv === 1) { if (!quiet && Math.random() < 0.4) speak("suspect", false, { nocheck: !chk }); return; }
  if (lv === 6) { speak("lost", true); f.turretAlert = false; searchAt(s.seen); return; }
  /* 2–5: тревога */
  f.alarmUntil = T() + (lv >= 3 ? 60 : 40); /* в тактах этажа: меню и мини-игры не съедают тревогу */
  f.turretAlert = true;
  var nocam = { nocam: !(s.seen && s.seen.src === "camera") };
  if (lv === 2) { A("okoAlarm"); speak("alarm", true, nocam); if (sn) { cb.alertMech(sn.x, sn.y, 28); if (Math.random() < 0.45) minesLater(sn, "перекрыть пути отхода"); } return; }
  if (lv === 3) {
    speak("local", true, nocam);
    if (sn) minesLater(sn, "перекрыть сектор", rnd(4, 10));
    if (sn) { cb.alertMech(sn.x, sn.y, 40); if ((f.squads || 0) < 3 + Math.floor(st().heat / 40)) { f.squads = (f.squads || 0) + 1; wave(rnd(6, 14), 1 + (st().heat >= 60 ? 1 : 0) + (G().L >= 20 && Math.random() < 0.4 ? 1 : 0), "hunt", sn); } }
    return;
  }
  if (lv === 4) {
    if (was === 5) return; /* блокировка снята, тревога продолжается */
    A("okoAlarm"); speak("complex", true, nocam);
    if (sn) cb.alertMech(sn.x, sn.y, 99);
    if (!f.droneAt) f.droneAt = T() + rnd(6, 20);
    if (sn) wave(rnd(10, 20), 1, "patrol", sn, "shift");
    return;
  }
  if (lv === 5) { speak("sealed", true); sealRoom(s.seen); return; }
}
/* Аварийная блокировка: незапертые двери помещения, где вас видели, — на сорок секунд. */
function sealRoom(p) {
  var f = fs(), fl = CUR().fl;
  if (!p || !fl) return;
  var r = fl.room[p.y * LAB.W + p.x];
  if (r == null || r < 0 || !fl.rooms[r]) return;
  if (!f.okoLock) f.okoLock = {};
  /* двери на стенах помещения и в дальних концах коридоров, что в него выходят */
  var ids = fl.rooms[r].doors || [], n = 0, until = T() + 80;
  fl.doors.forEach(function (d) {
    if (d.lock && d.lock.type === "secret") return;
    if (ids.indexOf(d.id) < 0) return;
    if (LAB.game.doorBlock && LAB.game.doorBlock(d)) return; /* и так заперта */
    if (LAB.combat.foes().some(function (q) { return !q.dead && q.x === d.x && q.y === d.y; })) return;
    if (G().x === d.x && G().y === d.y) return;
    f.okoLock[d.id] = until; n++;
    if (f.doors[d.id] === 2) { f.doors[d.id] = 1; A("doorClose", d); }
  });
  f.sealUsed = (f.sealUsed || 0) + 1;
  if (n) { log("Аварийная блокировка: дверей — " + n + ", " + place(p.x, p.y) + "."); A("play", "door_locked"); voice("Двери помещения заблокированы ОКО на сорок секунд. Замок можно взломать у двери.", { prio: "urgent" }); }
}
/* Прочёсывание: патрули и машины рядом проверяют последнее место и маршруты возле него. */
function searchAt(p) {
  var cb = C();
  if (!p || !cb) return;
  cb.sendCheck(p.x, p.y, 2);
  cb.foes().forEach(function (q) { if (!q.dead && !q.calm && q.kind === "mech" && q.state === "alert" && cb.search) cb.search(q, p); });
}
/* Сообщение сенсора. kind: "seen" — носитель замечен (подтверждение),
   "suspect" — признак (шум, следы, вскрытый терминал, открытая ключом дверь). */
/* lastCheck — вышла ли проверка по последнему признаку (3.7): о патруле ОКО говорит, только если
   он вышел. quiet — без слов при смене режима: сказать о признаке хочет тот, кто сообщил о нём. */
var lastCheck = false;
function report(src, x, y, kind, what, quiet) {
  var f = fs(), o = st(), cb = C();
  lastCheck = false;
  if (!f || !cb) return false;
  if (f.okoBlind || G().st.jam > 0) return false;
  if (src === "noise" && LAB.depths && LAB.depths.sensorsDeaf()) return false; /* вибродатчики обесточены на щите «Подножия» */
  var s = sec(), now = T();
  if (kind === "seen") {
    o.seenAt = { x: x, y: y, L: G().L, F: G().F, t: now };
    var fresh = !s.seen || now - s.seen.t > 6 || s.lv === 6 || s.lv < 2;
    s.seen = { x: x, y: y, t: now, src: src };
    if (!fresh) return true; /* то же подтверждение — не чаще раза в три секунды */
    s.conf = s.conf.filter(function (t) { return now - t < 120; }); s.conf.push(now);
    heat(src === "camera" ? 5 : src === "terminal" ? 6 : 3);
    log((SRCN[src] || "Датчик") + ", " + place(x, y) + ": носитель обнаружен.");
    var to = s.lv < 2 || s.lv === 6 ? 2 : s.lv;
    if (s.conf.length >= 3 || (o.heat >= 45 && s.lv >= 2 && s.lv !== 6)) to = Math.max(to, 3);
    if (s.lv >= 3 && s.lv !== 6 && (o.heat >= 70 || s.loss >= 3)) to = Math.max(to, 4);
    if (s.lv === 4 && o.heat >= 80 && (f.sealUsed || 0) < 2 && CUR().fl.room[y * LAB.W + x] >= 0) to = 5;
    if (to !== s.lv) setLevel(to, (SRCN[src] || "датчик").toLowerCase());
    else if (s.lv >= 2 && s.lv <= 5) cb.alertMech(x, y, s.lv >= 4 ? 99 : 28);
    return true;
  }
  /* признак */
  s.sus = { x: x, y: y, t: now, src: src };
  log((SRCN[src] || "Датчик") + ", " + place(x, y) + ": " + (what || "подозрительная активность") + ".");
  heat(1);
  /* (3.7, нелогичность) проверку высылают раньше слов, чтобы слова знали, вышла ли она (lastCheck);
     прежде ОКО сначала говорило «Единица — проверить», а патруля на этаже могло не быть вовсе */
  if (s.lv <= 1 || s.lv === 6) {
    if (cb.sendCheck(x, y, 1)) lastCheck = true;
    else if (o.heat >= 25 && (f.checks || 0) < 4) { f.checks = (f.checks || 0) + 1; lastCheck = wave(rnd(10, 20), 1, "check", { x: x, y: y }); }
  }
  if (s.lv === 0) setLevel(1, (what || "признак").toLowerCase(), quiet, lastCheck);
  return true;
}
/* Совместимость: тревога от источника — подтверждение. */
function alarm(x, y, why, power) {
  var src = why === "camera" ? "camera" : why === "cleaner" ? "cleaner" : why === "drone" ? "drone" : why === "hack" ? "terminal" : "robot";
  var ok = report(src, x, y, "seen");
  if (ok && power && level() < 3) setLevel(3, "взлом");
  return ok;
}
/* Такт режимов: подозрение гаснет, потерянная цель — прочёсывание, потом штатный режим. */
function secTick() {
  var s = sec(), now = T(), o = st();
  if (s.lv === 1 && now - s.t > 80 && (!s.sus || now - s.sus.t > 80)) setLevel(0, "признаки не подтвердились");
  else if (s.lv === 5 && now - s.t > 80) setLevel(s.seen && now - s.seen.t <= 50 ? 4 : 6, "блокировка снята");
  else if (s.lv >= 2 && s.lv <= 5 && s.seen && now - s.seen.t > 50) setLevel(6, "цель потеряна");
  else if (s.lv === 6 && now - s.t > 140) setLevel(o.heat >= 50 ? 1 : 0, "прочёсывание закончено");
}

/* ════════ САПЁРЫ (2.0) ════════
   ОКО приказывает роботам-сапёрам перекрыть пути: заминировать пороги и
   проходы вокруг места, где вас видели, подходы к лестнице и лифту, двери
   важных помещений. Сапёра на этаже нет — при сильном подозрении ОКО
   присылает его из дальней двери. Ловушек ОКО на этаже — не больше, чем
   позволяет глубина. Приказ звучит по громкой связи — не всегда. */
function minesTarget() {
  var o = st(), g = G(), f = fs(), fl = CUR().fl;
  var sa = o.seenAt;
  if (sa && sa.L === g.L && sa.F === g.F && T() - sa.t < 300) return { x: sa.x, y: sa.y, why: "перекрыть пути отхода" };
  var pts = fl.objs.filter(function (q) { return q.type === "stairs_down" || q.type === "elevator" || q.type === "gate_down"; });
  if (pts.length) { var q0 = pts[Math.floor(Math.random() * pts.length)]; return { x: q0.x, y: q0.y, why: q0.type === "elevator" ? "подходы к лифту" : "подходы к лестнице" }; }
  return { x: g.x, y: g.y, why: "сектор носителя" };
}
function minesOrder(at, why, n) {
  var f = fs(), cb = C(), g = G();
  if (!f || !cb || f.okoBlind || g.L < 2 || !LAB.traps || !LAB.traps.okoTrap || !cb.minePoints) return false;
  var maxT = Math.min(10, 4 + Math.floor(g.L / 10));
  if (LAB.traps.okoCount() >= maxT) return false;
  var tgt = at ? { x: at.x, y: at.y, why: why || "заминировать подходы" } : minesTarget();
  var free = cb.sappers().filter(function (q) { return q.state === "idle" && q.task !== "mine"; });
  if (!free.length) {
    if ((f.sapSent || 0) < 2 && st().heat >= 30) { f.sapSent = (f.sapSent || 0) + 1; wave(rnd(8, 18), 1, "sapper", tgt); log("Запрос сапёра: " + tgt.why + "."); }
    return false;
  }
  /* ближайший к цели сапёр, которому есть куда дойти; точки — только достижимые им.
     Цель за запертой дверью — запасные: где видели носителя, лестницы и лифт,
     наконец — собственный участок сапёра. */
  var nP = Math.max(1, Math.min(3, n || (1 + (st().heat >= 50 ? 1 : 0) + (g.L >= 10 ? 1 : 0)))), sp = null, pts = [];
  var tgts = [tgt];
  if (!at) {
    var sa = st().seenAt, fl0 = CUR().fl;
    if (sa && sa.L === g.L && sa.F === g.F) tgts.push({ x: sa.x, y: sa.y, why: "перекрыть пути отхода" });
    fl0.objs.forEach(function (q) { if (q.type === "stairs_down" || q.type === "elevator" || q.type === "stairs_up") tgts.push({ x: q.x, y: q.y, why: q.type === "elevator" ? "подходы к лифту" : "подходы к лестнице" }); });
    free.forEach(function (q) { if (q.beat && q.beat.length) { var m = q.beat[Math.floor(q.beat.length / 2)]; tgts.push({ x: m[0], y: m[1], why: "заминировать участок обхода" }); } });
  }
  for (var ti = 0; ti < tgts.length && !sp && ti < 6; ti++) {
    var t0 = tgts[ti];
    free.sort(function (a, b) { return (Math.abs(a.x - t0.x) + Math.abs(a.y - t0.y)) - (Math.abs(b.x - t0.x) + Math.abs(b.y - t0.y)); });
    for (var si = 0; si < free.length && !sp; si++) { pts = cb.minePoints({ x: t0.x, y: t0.y }, nP, free[si]); if (pts.length) { sp = free[si]; tgt = t0; } }
  }
  if (!sp) return false;
  sp.task = "mine"; sp.mineAt = pts; sp.stuck = 0; sp.route = null;
  log("Приказ сапёрам: " + tgt.why + ", " + place(pts[0][0], pts[0][1]) + ".");
  react("mines_order");
  return true;
}
function minesTick() {
  var f = fs(), o = st(), now = T();
  if (!f || G().L < 2) return;
  if (f.mineOrderAt && now >= f.mineOrderAt) { var at = f.mineOrderP; f.mineOrderAt = 0; f.mineOrderP = null; minesOrder(at, f.mineOrderWhy || ""); }
  if (!f.mineNext) f.mineNext = now + rnd(160, 320);
  else if (now >= f.mineNext) {
    f.mineNext = now + Math.max(120, rnd(220, 380) - Math.round(o.heat * 1.5));
    if (o.heat >= 15 || level() >= 1) minesOrder(null);
  }
}
/* отложенный приказ: через несколько тактов после тревоги */
function minesLater(p, why, ticks) { var f = fs(); if (!f || !p || f.mineOrderAt) return; f.mineOrderAt = T() + (ticks || rnd(6, 16)); f.mineOrderP = { x: p.x, y: p.y }; f.mineOrderWhy = why || ""; }

/* Насколько ОКО усложнило протоколы: после частых взломов — длиннее ключи
   и сложнее схемы; подозрение тоже добавляет. */
function difficulty() { var o = st(); return Math.min(4, Math.floor(o.hacks / 3) + Math.floor(o.heat / 40)); }

/* Вход на этаж: смена караула и дрон — по расписанию; на лифте встречают. */
function floorIn(how) {
  var f = fs(), o = st(), cb = C();
  if (!f || !cb) return;
  legacy(f);
  A("alarmLayer", level() === 4 || level() === 5);
  if (!f.okoInit) {
    f.okoInit = 1;
    f.shiftAt = T() + rnd(70, 130);
    if (depth() >= 8 && Math.random() < Math.min(0.65, 0.2 + depth() * 0.004 + o.heat / 250)) f.droneAt = T() + rnd(60, 160);
  }
  if (how === "elev") {
    report("lift", G().x, G().y, "suspect", "лифт прибыл");
    var gs = cb.guards().filter(function (q) { return q.guard === "lift"; });
    if (gs.length) {
      gs.forEach(function (q) { if (q.state === "idle") { q.state = "alert"; q.lastKnown = { x: G().x, y: G().y }; q.lost = 0; } });
      if (Math.random() < 0.6) speakLater("lift", 2600);
    }
  }
}
/* Сохранения прошлых версий: сроки ОКО были по часам — переводим в такты. */
function legacy(f) {
  if (f.alarmUntil > 1e9) f.alarmUntil = 0;
  if (f.repairAt > 1e9) f.repairAt = T() + 10;
  if (f.counterAt > 1e9) f.counterAt = T() + 120;
}

/* События игры. */
function event(kind, data) {
  data = data || {};
  var o = st(), f = fs(), g = G();
  if (!f) return;
  switch (kind) {
    case "enter":
      if (!o.levelSaid || o.levelSaid < g.L) { o.levelSaid = g.L; setTimeout(function () { speak("enter", true); }, 5200); }
      if (LAB.okoForms) LAB.okoForms.entered(); /* (3.2) новый облик — «Эхо» объяснит */
      break;
    case "floor":
      floorIn(data.how);
      if (LAB.okoForms) LAB.okoForms.floorIn();
      break;
    case "turret_off":
      o.hacks++; heat(10); speak("turret_off", true);
      if (data.x != null) report("terminal", data.x, data.y, "suspect", "питание турелей снято");
      /* ремонтник выходит к турелям через несколько секунд; при подозрении — и резервный контур */
      f.repairAt = T() + rnd(14, 26); f.repairN = 0;
      f.cutHold = false; f.backupAt = difficulty() >= 1 || o.heat >= 30 ? T() + rnd(320, 460) : 0;
      break;
    case "turret_cut":
      /* кабель перерезан у самой турели: ОКО слышит, где, и шлёт ремонтника */
      heat(6); speak("turret_cut", true);
      if (data.x != null) report("lost", data.x, data.y, "suspect", "турель обесточена");
      if (!f.repairAt && !(C() && C().repairers().length)) { f.repairAt = T() + rnd(14, 26); f.repairN = 0; }
      break;
    case "okokey":
    case "turret_quiet":
    case "turret_key":
      /* служебный ключ: ОКО видит «техника» и не поднимает тревоги — но
         ключ вне графика может заметить и отозвать (чем чаще, тем вернее) */
      o.keys = (o.keys || 0) + 1; heat(2);
      log(kind === "okokey" ? "Турель, " + place(data.x, data.y) + ": доступ по ключу техника." : kind === "turret_quiet" ? "Турель, " + place(data.x, data.y) + ": плановое обслуживание по ключу техника." : "Оборонная сеть: приоритет целей изменён ключом техника.");
      /* обслуживание по ключу: ремонтник придёт, но нескоро */
      if (kind === "turret_quiet" && (!f.repairAt || f.repairAt < T() + 200)) { f.repairAt = T() + rnd(240, 360); f.repairN = 0; }
      if (kind === "turret_key") { f.counterAt = T() + rnd(600, 900); f.keyOurs = true; }
      if (!f.revokeAt && Math.random() < Math.min(0.85, 0.2 + o.heat / 200 + (o.keys - 1) * 0.15)) f.revokeAt = T() + rnd(160, 320);
      break;
    case "turret_hack":
      o.hacks++; heat(16); speak("turret_hack", true);
      f.counterAt = T() + Math.max(120, 300 - Math.round(o.heat * 1.8));
      /* ОКО знает, где взломан ключ: у этого терминала */
      if (data.x != null) { report("terminal", data.x, data.y, "suspect", "перехват оборонной сети"); wave(rnd(16, 26), 1 + (o.heat >= 50 ? 1 : 0), "hunt", { x: data.x, y: data.y }); }
      break;
    case "turret_hold":
      f.counterAt = T() + 360; heat(4);
      break;
    /* камеры: петля, снятое питание, перепрошивка — ОКО всё вернёт */
    case "cam_loop":
      o.hacks++; heat(data.all ? 6 : 3);
      log(data.all ? "Видеопоток этажа: подозрительно стабильная картинка." : "Камера, " + place(data.x, data.y) + ": картинка без движения.");
      if (data.all || Math.random() < 0.4) speakLater("cam_loop", 2500);
      break;
    case "cam_cut":
      heat(4); speakLater("cam_cut", 1200);
      log("Камера, " + place(data.x, data.y) + ": питание снято вручную.");
      report("lost", data.x, data.y, "suspect", "камера не отвечает");
      break;
    case "cam_flash":
      o.hacks++; heat(data.all ? 8 : 5);
      log(data.all ? "Камеры этажа: прошивка не совпадает с эталоном." : "Камера, " + place(data.x, data.y) + ": прошивка не совпадает с эталоном.");
      if (Math.random() < 0.5) speakLater("cam_flash", 2500);
      break;
    case "cam_fixed":
      speak("cam_fixed");
      log("Камера, " + place(data.x, data.y) + ": питание подано, камера в сети.");
      break;
    case "alarm_reset":
      o.hacks++; heat(6);
      log("Доклады сенсоров подменены с терминала: цель потеряна.");
      break;
    case "iso_bypass":
      o.hacks++; heat(7); speak("iso_bypass", true);
      log("Изоляция сегмента обойдена с терминала.");
      if (data.x != null) report("terminal", data.x, data.y, "suspect", "обход изоляции сегмента");
      break;
    case "hack_fail":
      o.fails++; heat(12);
      if (data.x != null && Math.random() < 0.5) minesLater({ x: data.x, y: data.y }, "заминировать подходы к взломанному", rnd(10, 20));
      speak("hack_fail", true);
      alarm(data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, "hack", true);
      if (data.x != null) wave(rnd(6, 12), 1 + (o.heat >= 50 ? 1 : 0), "check", { x: data.x, y: data.y });
      break;
    case "terminal_hack":
      o.hacks++; heat(3); react("hack_ok");
      /* контрвзлом: ОКО замечает вскрытие не всегда — и тогда изолирует сегмент сети */
      if (Math.random() < 0.35 + o.heat / 150 + difficulty() * 0.08) {
        speak("terminal");
        var tx = data.x != null ? data.x : g.x, ty = data.y != null ? data.y : g.y;
        report("terminal", tx, ty, "suspect", "терминал вскрыт без пропуска");
        /* (2.2) отсекает терминал, только когда уже настороже (жар или тревога), и ненадолго:
           прежде — почти каждый пятый вскрытый терминал, сразу после входа, и игроку казалось,
           что оборонная сеть сломана. Когда вернёт — «Эхо» скажет. */
        if (data.o && (o.heat >= 40 || level() >= 2) && Math.random() < 0.3 + difficulty() * 0.15) {
          var ost = LAB.game.objState(data.o), iu = T() + rnd(60, 90);
          ost.isoUntil = iu; if (!f.isoT) f.isoT = []; f.isoT.push(iu);
          log("Сегмент сети терминала изолирован."); setTimeout(function () { speak("isolate", true); }, 2200);
        }
      }
      break;
    case "robots":
      o.hacks++; heat(20); speak("robots", true);
      if (data.x != null) report("terminal", data.x, data.y, "suspect", "прошивка роботов этажа изменена");
      wave(rnd(24, 40), 2 + (o.heat >= 60 ? 1 : 0), "hunt", data.x != null ? { x: data.x, y: data.y } : null, "fresh");
      f.flashNext = T() + rnd(200, 300);
      break;
    case "lockdown":
      heat(6); speak("lockdown", true);
      if (data.x != null) { report("terminal", data.x, data.y, "suspect", "блокировка дверей снята"); wave(rnd(12, 20), 1 + (o.heat >= 50 ? 1 : 0), "hunt", { x: data.x, y: data.y }); }
      break;
    case "camera":
      report("camera", data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, data.glimpse ? "suspect" : "seen", data.glimpse ? "движение на краю обзора" : "");
      if (o.heat >= 30 && !f.droneAt && C() && !C().drones().length) f.droneAt = T() + rnd(10, 30);
      break;
    case "cleaner":
      report("cleaner", data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, data.trace ? "suspect" : "seen", data.trace || "");
      break;
    case "robot":
      report("robot", data.x, data.y, "seen");
      break;
    case "noise":
      report("noise", data.x, data.y, "suspect", "выстрелы");
      break;
    case "drone":
      report("drone", data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, "seen");
      break;
    case "boss":
      /* (3.7, нелогичность) о живом страже — без «чертежей» и «единиц», о машине — без «образцов» */
      heat(10); setTimeout(function () { speak("boss", true, data.subj ? { subj: data.subj } : null); }, 2500);
      break;
    case "kill":
      /* (3.0) пала последняя машина волны — передышка до следующей (это ход волн, а не знание ОКО) */
      if (data.wv) waveDown(data.wv);
      /* (3.7, нелогичность) разбит последний узел связи: машины этажа не докладывают — ОКО не знает
         ни о потере, ни о том, где оборвалась связь (камеру на проводе — замечает) */
      if (f.netCut && !data.camera) { if (data.stalker) f.droneAt = T() + rnd(240, 400); break; }
      o.kills++; heat(1);
      if (data.task === "repair") { heat(3); f.repairLost = 1; }
      /* (2.0) потеря: участок обхода, кабинет, пост — ОКО пришлёт замену */
      lost(data);
      if (data.stalker) { heat(4); f.droneAt = T() + rnd(240, 400); if (Math.random() < 0.6) speakLater("drone_lost", 1500); }
      if (data.camera) {
        heat(5);
        /* (3.7, нелогичность) сначала — проверка, потом слова: «высылаю проверку» — только если вышла */
        report("lost", data.x, data.y, "suspect", "камера не отвечает");
        if (Math.random() < 0.6) speakLater("cam_down", 900, { nocheck: !lastCheck });
      } else if (data.oko || data.guard || data.task) {
        /* машина ОКО замолчала — ОКО знает, где оборвалась связь */
        var sq = sec(); if (sq.lv >= 2) sq.loss = (sq.loss || 0) + 1;
        report("lost", data.x, data.y, "suspect", "связь с единицей потеряна");
      }
      if (o.kills - (o.killSaid || 0) >= 15) { o.killSaid = o.kills; speak("kill"); }
      break;
    case "repaired":
      f.repairN = 0; speak("repaired", true);
      break;
    case "repair_lost":
      f.repairLost = data.quiet ? 0 : 1;
      break;
    case "door":
      heat(2);
      /* (3.7, нелогичность) «Патруль проверит» — только если проверка вышла: сначала доклад датчика
         (без слов о смене режима — говорит дверь), потом реплика */
      if (Math.random() < 0.25 + o.heat / 200) { report("door", data.x, data.y, "suspect", "запертая дверь открыта", true); speak("door", false, { nocheck: !lastCheck }); }
      break;
    case "sample":
      if (Math.random() < 0.3) setTimeout(function () { speak("sample"); }, 1800);
      break;
    case "riddle_ok":
      heat(-25); react("puzzle_ok");
      break;
    case "riddle_fail":
      heat(8); report("door", g.x, g.y, "seen"); react("puzzle_fail");
      break;
    case "blind":
      f.okoBlind = true; heat(8);
      break;
  }
}

/* ── (2.0) ЗАМЕНА ПОТЕРЬ (просьба игрока) ──
   Погиб патрульный — ОКО через время выводит на его участок новый патруль
   (из дальней от вас точки обхода, не у вас на глазах). Опустел кабинет —
   позже ОКО присылает в него машины; опустел пост у лестницы или лифта —
   смену поста. Чем больше ОКО теряет на этаже, тем больше шлёт за раз и тем
   быстрее: сначала по одной машине, после трёх потерь — по две, после
   шести — по три-четыре, дальше по четыре-пять (в глубине и шесть), и это
   уже тяжёлые машины, которые идут к месту потерь. Несколько минут затишья —
   нажим спадает. (3.0) Замена патрульных и постов — тоже волна: выходит не
   чаще, чем позволяет передышка между волнами (canSend), и ждёт, пока носитель
   в помещении; срок замены сокращается с потерями, но не меньше передышки. Разбит последний узел связи (машины этажа не докладывают) —
   ОКО о потерях не знает; глушилка и ослеплённое ОКО — замена ждёт. Присланные
   машины — без добычи, опыта за них меньше: на замене не разбогатеть. */
function lossEsc(f) {
  var now = T();
  if (f.lossT && now - f.lossT > 360) f.lossN = Math.max(0, (f.lossN || 0) - Math.floor((now - f.lossT) / 120));
  return f.lossN || 0;
}
function lossBatch(n) {
  var b = n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 + (Math.random() < 0.5 ? 1 : 0) : 4 + (Math.random() < 0.5 ? 1 : 0) + (depth() >= 200 && Math.random() < 0.4 ? 1 : 0);
  return Math.max(1, Math.round(b * (LAB.dk().repl || 1))); /* (2.2) по режиму сложности */
}
function lossDelay(base, n) { return Math.max(20, Math.round(base * Math.max(0.35, 1 - 0.06 * n - depth() * 0.0003) * (LAB.dk().replT || 1))); }
/* (2.3, просьба игрока) Зачищенное помещение ОКО заселяет снова не раньше,
   чем через время режима (LAB.DIFF, room — в секундах, такт ОКО — полсекунды):
   лёгкий — десять минут, обычный — семь, сложный — пять, очень сложный — три
   с половиной; сверху — до десятой доли, чтобы помещения не оживали разом.
   Нажим ОКО (серия потерь) и глубина этот срок не сокращают: растёт лишь
   число присланных машин. */
function roomDelay() { return Math.round((LAB.dk().room || 420) * 2 * (1 + Math.random() * 0.1)); }
function lost(data) {
  var f = fs(), cb = C();
  if (!f || f.netCut || !data) return;
  if (!f.repl) f.repl = [];
  var n = lossEsc(f);
  f.lossN = n + 1; f.lossT = T();
  if (f.pun) return; /* (3.0) мясорубка: замену ОКО отозвало — вместо неё каратели (punTick) */
  if (f.repl.length >= 40) return;
  var at = data.x != null ? { x: data.x, y: data.y } : null;
  if (data.beat && data.beat.length) {
    /* на участок — одна замена: погибли сразу несколько — придут разом, но больше */
    var pend = f.repl.filter(function (q) { return q.k === "patrol" && q.corr === data.corr; })[0];
    if (pend) { pend.n = Math.min(6, Math.max(pend.n, lossBatch(n))); pend.at = at; }
    else f.repl.push({ k: "patrol", t: T() + lossDelay(rnd(80, 160), n), beat: data.beat, corr: data.corr, type: data.type, n: lossBatch(n), at: at });
  } else if (data.guard === "room" && data.room != null && data.room >= 0) {
    /* кабинет опустел — когда в нём не осталось ни одной машины */
    var left = cb && cb.foes().some(function (q) { return !q.dead && q.guard === "room" && q.kind === "mech" && (cb.postRoom ? cb.postRoom(q) : q.room) === data.room; });
    if (!left && !f.repl.some(function (q) { return q.k === "room" && q.room === data.room; })) f.repl.push({ k: "room", t: T() + roomDelay(), room: data.room, cat: data.garrison || "office", n: Math.max(1, lossBatch(n)), at: at });
  } else if (data.guard && data.post) {
    /* место поста — у машины это {x, y}, в записи замены — пара чисел */
    var pp = data.post.length === 2 ? data.post : [data.post.x, data.post.y];
    if (pp[0] != null && !f.repl.some(function (q) { return q.k === "post" && q.post[0] === pp[0] && q.post[1] === pp[1]; })) f.repl.push({ k: "post", t: T() + lossDelay(rnd(80, 160), n), post: pp, kind: data.guard, n: Math.min(3, lossBatch(n)) });
  }
}
function replTick() {
  var f = fs(), cb = C(), g = G();
  if (!f || f.pun || !f.repl || !f.repl.length || !cb || !cb.replacePatrol) return;
  if (f.okoBlind || f.netCut || (g.st && g.st.jam > 0)) return;
  var now = T();
  for (var i = f.repl.length - 1; i >= 0; i--) {
    var q = f.repl[i];
    if (now < q.t) continue;
    /* (2.3) пост в безопасной зоне у капсулы — смены не будет */
    if (q.k === "post" && cb.havenAt && cb.havenAt(q.post[0], q.post[1])) { f.repl.splice(i, 1); continue; }
    /* (3.0) замена патрульных и стражей постов — волна: ждёт передышки (canSend);
       пустое помещение ОКО заселяет по своему сроку */
    var wv = q.k !== "room";
    if (wv && !canSend(now)) continue;
    if (wv && !q.wv) q.wv = waveId();
    var got = q.k === "patrol" ? cb.replacePatrol(q) : q.k === "room" ? cb.refillRoom(q) : cb.dispatch(q.n, "post", { x: q.post[0], y: q.post[1], kind: q.kind }, { wv: q.wv });
    if (got === null) { f.repl.splice(i, 1); continue; }
    if (!got.length) { q.t = now + 20; continue; } /* место у вас на виду — позже */
    f.repl.splice(i, 1);
    if (wv) { sent(now); exitLog(got); }
    f.replN = (f.replN || 0) + 1;
    if (got.length >= 3) { speak("squad"); heard(got, "ОКО стягивает машины"); }
    else if (q.k === "patrol") { if (o0().heat >= 40 || Math.random() < 0.5) heard(got, "Новый патруль ОКО"); }
    else if (q.k === "post") { if (Math.random() < 0.6) speak("post"); heard(got, "Смена поста ОКО"); }
    else log("Помещение снова под охраной: " + place(got[0].x, got[0].y) + ".");
  }
}
function o0() { return st(); }

/* ── (3.0, просьба автора) МЯСОРУБКА ──
   Стоять на одном месте и качаться на замене ОКО не выйдет. Счёт этажа — сколько
   присланных и призванных врагов вы здесь уничтожили (combat.js, grind; тает со
   временем). Опыт за присланных тает вместе с ростом счёта, а на пороге режима
   (LAB.DIFF: grind) ОКО перестаёт кормить мясорубку поштучно: замена на этаже
   отозвана, а через punPrep тактов с нижних уровней выходит ударная группа —
   каратели. Они тяжелее здешних машин (на punLvl ступеней), встают засадой в
   коридоре на вашем пути вниз и молчат; не дождавшись (punWait), идут на вас
   сами. Каратель при гибели сгорает: ни добычи, ни опыта — и взрывается рядом.
   Разбили группу, а счёт ещё высок — следующая больше и тяжелее. Затихли на
   punCalm тактов и за вами никто не гонится — ОКО отзывает карателей и
   возвращается к обычной замене, но помнит: счёт остаётся на половине порога.
   Гибель героя — каратели снова в засаде, отсчёт заново. Режимы сложности:
   лёгкий терпит дольше и карает мягче, очень сложный — почти сразу и жёстко. */
function punTick(f, now) {
  var cb = C(), dk = LAB.dk(), g = G();
  if (!cb || !cb.grind || !cb.strike) return;
  var gr = cb.grind(), lim = dk.grind || 12;
  if (!f.pun) {
    /* каратели без дела (группу отозвали, а этаж загрузили заново) — уходят */
    if (cb.strikers().length) cb.strikeRecall();
    if (gr < lim || f.netCut) return;
    /* (3.5) очередь замены не стирается: пока идёт мясорубка, замена и так не выходит,
       а после отзыва карателей посты и кабинеты, потерянные раньше, снова заполнятся */
    f.pun = 1; f.punWave = (f.punWave || 0) + 1; f.punAt = now + (dk.punPrep || 80); f.punGo = 0;
    speak(f.punWave > 1 ? "grinder_more" : "grinder", true);
    log("Замена отозвана: на этаже мясорубка. Готовится ударная группа.");
    if (!g.tut.grind) { g.tut.grind = 1; voice("«Эхо»: ОКО перестало присылать машины по одной. За присланных опыта больше нет, а с нижних уровней идёт ударная группа — засада у вас на пути вниз. Уходите с этажа или затихните: тогда ОКО её отзовёт.", { prio: "event", keep: true }); }
    return;
  }
  var alive = cb.strikers();
  if (f.pun === 1) {
    if (now < f.punAt) return;
    if (f.okoBlind || (g.st && g.st.jam > 0)) { f.punAt = now + 20; return; } /* ослеплённое и заглушённое ОКО ждёт */
    var w = f.punWave || 1, n = Math.min(8, (dk.pun || 3) + (w - 1)), up = (dk.punLvl || 4) + 2 * (w - 1);
    var got = cb.strike(n, up);
    if (!got.length) { f.punAt = now + 20; return; }
    f.pun = 2; f.punGo = now + (dk.punWait || 240); f.punCalmT = now;
    log("Ударная группа: " + got.length + " " + LAB.game.plural(got.length, "машина", "машины", "машин") + " в засаде.");
    return;
  }
  /* засада стоит */
  if (!alive.length) {
    if (gr >= lim / 2) { f.pun = 1; f.punWave = (f.punWave || 1) + 1; f.punAt = now + (dk.punPrep || 80); speak("grinder_more", true); log("Ударная группа уничтожена. Готовится следующая."); }
    else { f.pun = 0; f.punGo = 0; log("Ударная группа уничтожена."); }
    return;
  }
  if (!f.punGo && alive.some(function (q) { return q.ambush; })) f.punGo = now + (dk.punWait || 240); /* после гибели героя и загрузки этажа — снова отсчёт */
  if (f.punGo && now >= f.punGo) { f.punGo = 0; if (cb.strikeGo()) speak("strike_go", true); }
  /* (3.5) тревога и громкая стрельба — это не тишина: отзыв откладывается */
  var lvP = level();
  if ((lvP >= 2 && lvP <= 5) || (g.noise || 0) >= 10) f.punCalmT = now;
  /* (3.5) каратели вышли на перехват и потеряли носителя — ОКО раз в десять секунд
     наводит их на место, где его видели последним (прежде, обыскав одну точку,
     они бродили без цели, и их тихо отзывали) */
  /* (проверка перед сборкой) свой срок: punTick идёт через такт, и при нечётной разнице часов этажа
     и общего счёта тактов проверка «now % 20» не срабатывала никогда */
  if (!f.punGo && now >= (f.punSeekT || 0) && cb.search) {
    f.punSeekT = now + 20;
    var sa = st().seenAt;
    if (sa && sa.L === g.L && sa.F === g.F && now - sa.t < 240) alive.forEach(function (q) {
      if (!q.ambush && q.state !== "hunt" && q.task !== "leave") cb.search(q, { x: sa.x, y: sa.y });
    });
  }
  /* затихли, и никто за вами не гонится — ОКО отзывает карателей */
  var quietT = now - Math.max(f.grindLast || 0, f.punCalmT || 0);
  if (quietT >= (dk.punCalm || 600) && !cb.hunted()) {
    cb.strikeRecall();
    f.pun = 0; f.punGo = 0; f.grind = Math.min(cb.grind(), Math.ceil(lim / 2)); f.grindT = now;
    speak("strike_recall", true); log("Ударная группа отозвана.");
  }
}

/* Смена караула: патрули получают новые маршруты; иногда один уходит со
   смены, а из дальней двери выходит другой; патрульных не меньше, чем
   нужно этажу этой глубины, а при сильном подозрении — больше. */
function shift() {
  var f = fs(), o = st(), g = G(), cb = C();
  if (!f || !cb || f.okoBlind) return;
  var pats = cb.patrols();
  var sa = o.seenAt, focus = sa && sa.L === g.L && sa.F === g.F && T() - sa.t < 240 ? sa : null;
  /* (2.0) у патрульных свои участки обхода: новые маршруты получают не все —
     двое, один из них — к месту, где вас видели */
  var idle = pats.filter(function (p) { return p.state === "idle" && p.task !== "mine"; });
  for (var ii = idle.length - 1; ii > 0; ii--) { var jj = Math.floor(Math.random() * (ii + 1)), tt = idle[ii]; idle[ii] = idle[jj]; idle[jj] = tt; }
  idle.slice(0, 2).forEach(function (p, i) { cb.reroute(p, i === 0 && focus && o.heat >= 35 ? focus : null); });
  var changed = false;
  if (pats.length && Math.random() < 0.4) {
    var far = pats.filter(function (p) { return p.state === "idle" && Math.abs(p.x - g.x) + Math.abs(p.y - g.y) > 10; });
    far.sort(function (a, b) { return (Math.abs(b.x - g.x) + Math.abs(b.y - g.y)) - (Math.abs(a.x - g.x) + Math.abs(a.y - g.y)); });
    if (far.length && cb.dismiss(far[0])) { wave(rnd(10, 30), 1, "patrol", null, "shift"); changed = true; }
  }
  /* сильное подозрение — ещё патрульный к месту, где вас видели */
  if (focus && o.heat >= 50 && pats.length < 40) { wave(rnd(4, 20), 1, "patrol", focus, "shift"); changed = true; }
  if (changed && (o.heat >= 40 || Math.random() < 0.35)) speak("shift");
}

/* (3.2) В журнале безопасности — каждый настоящий выход машин, волной или на замену:
   так проверяют Зрачка, который объявляет отряды, которых нет (okoforms.js). */
function exitLog(got) { if (got && got.length) log("Выход единиц: " + got.length + ", " + place(got[0].x, got[0].y) + "."); }
/* Выпустить волну из очереди: машины выходят из дальней двери, ОКО говорит, кто и откуда. */
function sendWave(w) {
  var cb = C(), o = st(), id = rota(w) ? 0 : waveId();
  var gotW = cb.dispatch(w.n, w.mode, w.at, id ? { wv: id } : null);
  if (!gotW.length) return false;
  if (w.mode !== "sapper") exitLog(gotW);
  if (LAB.okoForms) LAB.okoForms.dispatched(gotW, w);
  if (w.tag === "fresh") { speak("fresh", true); heard(gotW, "Новые машины ОКО"); }
  else if (w.mode === "patrol") { if (o.heat >= 40 || Math.random() < 0.4) heard(gotW, "Новый патруль ОКО"); }
  else if (w.mode === "check") heard(gotW, "ОКО шлёт проверку");
  else if (w.mode === "sapper") { log("Сапёр вышел: " + place(gotW[0].x, gotW[0].y) + "."); heard(gotW, "Сапёр ОКО вышел"); }
  else { speak("squad"); heard(gotW, "Отряд ОКО"); }
  return true;
}

/* Такт этажа (полсекунды, из боя; по ходам — ход): ремонтники, контрвзлом,
   отряды по расписанию, смена караула, дроны, слух ОКО, подозрение. */
var tickN = 0;
function tick() {
  var f = fs(), o = st(), g = G(), cb = C();
  if (!f || g.dead || !cb) return;
  f.okoT = (f.okoT || 0) + 1;
  var now = f.okoT;
  tickN++;
  if (g.st.jam > 0) g.st.jam--;
  if (tickN % 60 === 0) heat(-1);
  legacy(f);
  /* ремонт турелей: пока сеть отключена и ремонтника нет — ОКО шлёт следующего */
  if ((f.turretMode === "off" && cb.turretsLeft() > 0) || cb.cutCount() > 0) {
    if (!f.repairAt && !cb.repairers().length) {
      var n0 = f.repairN || 0;
      f.repairAt = now + (n0 >= 3 ? rnd(110, 170) : n0 ? rnd(40, 70) : rnd(14, 26));
      if (f.repairLost) { f.repairLost = 0; speakLater("repair_lost", 1500); }
    }
    if (f.repairAt && now >= f.repairAt) {
      f.repairAt = 0;
      var esc = (o.heat >= 40 || difficulty() >= 2) ? 1 : 0;
      var got = cb.dispatch(1 + esc, "repair");
      if (got.length) { f.repairN = (f.repairN || 0) + 1; speak("repair", true); heard(got, "Ремонтник ОКО идёт к турелям"); }
      else f.repairAt = now + 40;
    }
  } else if (f.repairAt) f.repairAt = 0;
  /* (2.2) отсечённый терминал снова в оборонной сети */
  if (f.isoT && f.isoT.length && f.isoT.some(function (t) { return now >= t; })) {
    f.isoT = f.isoT.filter(function (t) { return now < t; });
    log("Сегмент сети терминала возвращён."); voice("«Эхо»: «ОКО вернуло терминал в оборонную сеть: камеры, турели и тревога снова доступны с него».", { prio: "event", keep: true });
  }
  /* петля камер кончилась, чужая прошивка стёрта проверкой — ОКО снова видит */
  if (cb.camExpire && tickN % 2 === 0) {
    var ce = cb.camExpire();
    if (ce.loopSoon && !ce.loop) voice("Петля записи камер кончится секунд через десять: ОКО скоро снова увидит коридоры.", { prio: "event" });
    if (ce.oursSoon && !ce.ours) voice("Ваша прошивка камер продержится ещё секунд десять: ОКО заканчивает проверку целостности.", { prio: "event" });
    if (ce.loop) { heat(3); speak("cam_loop_found", true); log("Петля видеозаписи найдена: камер " + ce.loop + " перезапущено."); }
    if (ce.ours) { heat(5); speak("cam_flash_found", true); log("Проверка целостности: прошивка камер восстановлена (" + ce.ours + ")."); }
  }
  /* контрвзлом перехваченных турелей */
  if (f.counterAt && now >= f.counterAt) {
    f.counterAt = 0;
    if (f.turretMode === "ours") {
      f.turretMode = "on";
      cb.turretsHostile();
      A("play", "term_err");
      speak("counter", true);
    }
  }
  /* ключ техника замечен: ОКО отзывает его — турели «по ключу» снова его */
  if (f.revokeAt && now >= f.revokeAt) {
    f.revokeAt = 0;
    var nk = cb.unmineTurrets();
    if (f.keyOurs && f.turretMode === "ours") { f.turretMode = "on"; cb.turretsHostile(); nk++; }
    f.keyOurs = false;
    if (f.turretMode === "off" && f.repairAt > now + 30) f.repairAt = now + rnd(14, 26);
    log("Ключ техника отозван.");
    if (nk) { A("play", "term_err"); speak("key_revoked", true); }
  }
  /* отряды по расписанию: смена караула и машины на шум у завала — в свой срок,
     остальные — волнами, по одной и с передышкой (3.0, canSend); первой
     выходит та, что ждёт дольше */
  paceTick(now);
  if (f.waves && f.waves.length) {
    var due = f.waves.filter(function (w) { return now >= w.t && noWait(w); });
    if (due.length) { f.waves = f.waves.filter(function (w) { return due.indexOf(w) < 0; }); due.forEach(function (w) { sendWave(w); }); }
    var next = null;
    f.waves.forEach(function (w) { if (now >= w.t && (!next || w.t < next.t)) next = w; });
    if (next && canSend(now)) { f.waves.splice(f.waves.indexOf(next), 1); if (sendWave(next)) sent(now); }
  }
  /* замена потерь: новые патрули, машины в опустевшие кабинеты, смена постов; (3.0) мясорубка */
  if (tickN % 2 === 0) { replTick(); punTick(f, now); }
  /* перепрошитый этаж: ОКО шлёт новые машины, пока роботы этажа не его
     (и те, что ещё ждут выхода, — в счёт) */
  if (f.robots && f.flashNext && now >= f.flashNext) {
    f.flashNext = now + rnd(220, 320);
    var fq = (f.waves || []).reduce(function (s0, w) { return s0 + (w.tag === "fresh" ? w.n : 0); }, 0);
    if (cb.patrols().filter(function (p) { return p.fresh; }).length + fq < 3) wave(0, 1, "patrol", null, "fresh");
  }
  /* дрон слежения */
  if (f.droneAt && now >= f.droneAt) {
    f.droneAt = canShoot() ? 0 : now + 120;
    if (!f.droneAt && !f.okoBlind && cb.drones().length < 1 + (o.heat >= 60 ? 1 : 0)) {
      var sa0 = o.seenAt, recent = sa0 && sa0.L === g.L && sa0.F === g.F && now - sa0.t < 120 ? sa0 : null;
      var gd = cb.dispatch(1, "drone", recent);
      if (gd.length) { speak("drone", true); heard(gd, "Вылетел дрон слежения ОКО", true); }
    }
  }
  if (!f.droneAt && o.heat >= 55 && now % 120 === 0 && !cb.drones().length) f.droneAt = now + rnd(20, 60);
  /* смена караула */
  if (!f.shiftAt) f.shiftAt = now + rnd(70, 130);
  else if (now >= f.shiftAt) { f.shiftAt = now + Math.max(70, 150 - Math.round(o.heat * 0.7)) + rnd(0, 40); shift(); }
  /* слух ОКО: громкая стрельба — акустические датчики, проверка источника */
  if (g.noise >= 10 && now - (f.noiseT || -999) > 40 && !(LAB.combat && LAB.combat.sheltered && LAB.combat.sheltered())) {
    f.noiseT = now;
    /* (3.7, нелогичность) «Патруль, проверить» — только если проверка и правда вышла */
    if (report("noise", g.x, g.y, "suspect", "выстрелы") && Math.random() < 0.3) speak("check", false, { nocheck: !lastCheck });
  }
  secTick();
  LAB.safe(minesTick);
  /* (2.0) тишина: давно ни тревог, ни подозрений — ОКО замечает и это */
  if (level() === 0 && now - (sec().t || 0) > 420 && now - (f.quietSaid || 0) > 900 && !cb.danger()) { f.quietSaid = now; react("quiet"); }
  /* стоите на месте больше минуты — ОКО слышит, что шаги стихли */
  if (f.stillX === g.x && f.stillY === g.y) { if (++f.stillT === 150 && !cb.danger()) react("idle"); }
  else { f.stillX = g.x; f.stillY = g.y; f.stillT = 0; }
  /* резервный контур: отключённые турели ОКО через время запитывает снова */
  if (f.turretMode === "off" && f.backupAt && now >= f.backupAt && cb.turretsLeft() > 0) {
    f.backupAt = 0;
    if (!f.cutHold) { f.turretMode = "on"; cb.turretsHostile(); A("play", "power_on"); speak("backup", true); log("Резервный контур: турели под током."); }
  }
  /* иногда ОКО говорит просто так — когда рядом тихо */
  if (LAB.okoForms) LAB.safe(LAB.okoForms.tick); /* (3.2) облики ОКО: ложь Зрачка, шёпот Истока */
  var nowMs = Date.now(), chat = LAB.okoForms ? LAB.okoForms.chatty() : 1;
  if (nowMs - (o.lastTaunt || 0) > (240000 + Math.random() * 180000) / Math.max(0.25, chat) && !cb.danger()) {
    o.lastTaunt = nowMs;
    if (tickN > 200) speak("taunt");
  }
}

LAB.oko = {
  event: event, tick: tick, speak: speak, alarm: alarm, difficulty: difficulty, heat: heat,
  loss: loss, lossSubj: lossSubj, /* (3.7) кто пал только что — машина или тварь */
  checkSent: function () { return lastCheck; }, /* (3.7) вышла ли проверка по последнему признаку (report) */
  state: st, lines: lines, wave: wave, shift: shift, react: react, minesOrder: minesOrder, minesLater: minesLater, REACT: REACT,
  report: report, level: level, levelName: function () { return SEC[level()]; }, setLevel: setLevel, sec: sec, log: log, logText: logText, T: T,
  hushed: hushed, voice: voice,
  /* основные реплики — для конвейера голоса ОКО (tools/okovoice) */
  BASE: BASE,
  /* (3.2) последние записи журнала безопасности строками — для «Записи тревог поста» (zones.js) */
  logLines: function (n) { var f = fs(), L = (f && f.slog) || [], pad = function (v) { return (v < 10 ? "0" : "") + v; }; return L.slice(-(n || 5)).map(function (e) { return pad(e.h) + ":" + pad(e.mi) + ". " + e.t; }); },
  /* (3.0) передышка между волнами — для проверок */
  pace: function () { var f = fs(); return { ready: f.wReady || 0, hold: f.wHoldT || 0, out: f.wOut || 0, inRoom: !!f.wIn, n: f.wN || 0 }; }, wsec: wsec
};
})();
