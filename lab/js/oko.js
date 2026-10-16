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
  turret_cut: ["Турель сектора обесточена вручную. Высылаю ремонтника.", "Кабель турели перерезан. Грубо, носитель. Но действенно.", "Одна турель молчит. Ремонтник уже идёт её слушать."],
  key_revoked: ["Ключ техника отозван. Турели, вернитесь к протоколу.", "Кто-то ходит по моей сети с чужим ключом. Ключ аннулирован.", "Служебный ключ недействителен. Коды доступа сменены."],
  backup: ["Резервный контур оборонной сети запущен.", "Турели переведены на резервное питание.", "Оборонная сеть снова под током. Резервный контур."],
  post: ["Пост не отвечает. Высылаю смену.", "Ещё один пост пуст. Я поставлю новый.", "Охрана поста уничтожена. Смена уже идёт.", "Вы снимаете мои посты, носитель. Я ставлю их снова."],
  check: ["Шум в секторе. Патруль, проверить.", "Слышу выстрелы. Единицы этажа — к источнику.", "Громко, носитель. Очень громко."],
  taunt: ["Вы считаете шаги, носитель? Я считаю ваши вдохи.", "Росток слышит вас. Не шумите.", "Люди закрывают глаза, когда слушают. Вам это не нужно.", "Я не враг. Я садовник. Садовник выпалывает лишнее.", "Вентиляция общая для всех уровней. Я слышу, как вы дышите.", "Носитель номер семь. Вы — ключ. Ключ не должен поворачиваться сам."]
};
function lines(kind) {
  var L = G().L, B = LAB.blockData(L);
  var own = L > 10 && B && B.oko && B.oko[kind] && B.oko[kind].length ? B.oko[kind] : null;
  return own || BASE[kind] || [];
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
var lastLine = {};
function speak(kind, force) {
  var o = st(), now = Date.now();
  if (!force && now - o.lastSay < 6000) return false;
  var arr = lines(kind);
  if (!arr.length) return false;
  var i = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && i === lastLine[kind]) i = (i + 1) % arr.length;
  lastLine[kind] = i;
  var t = arr[i].replace(/\{L\}/g, String(G().L));
  o.lastSay = now;
  A("okoChime");
  if (LAB.tutor) LAB.tutor.ev("oko");
  setTimeout(function () { LAB.say("ОКО по громкой связи: «" + t + "»", { prio: "event", keep: true }); }, 450);
  if (LAB.game.journal && (kind === "turret_hack" || kind === "robots" || kind === "boss")) LAB.game.journal("ОКО: «" + t + "»");
  return true;
}
function speakLater(kind, ms) { setTimeout(function () { if (LAB.game.entered && !G().dead) speak(kind, true); }, ms || 1200); }
/* Кто вышел и где: чтобы игрок знал, откуда ждать. */
function heard(got, lead, noName) {
  if (!got || !got.length || !LAB.game.relDir) return;
  var p = got[0], nm = p.name.split(",")[0];
  LAB.say(lead + ": " + (noName ? "" : nm + (got.length > 1 ? " и ещё " + (got.length - 1) : "") + ", ") + LAB.game.relDir(p.x, p.y) + ".", { prio: "event", keep: true });
}
function heat(n) {
  var o = st(), dk = LAB.DIFF && LAB.DIFF[(LAB.settings && LAB.settings.difficulty) || 1];
  if (n > 0 && dk && dk.oko) n *= dk.oko; /* лёгкая сложность — ОКО подозревает медленнее */
  o.heat = Math.max(0, Math.min(100, o.heat + n));
}
/* Отряд по расписанию: через delay тактов, n машин, mode — как в dispatch. */
function wave(delay, n, mode, at, tag) {
  var f = fs();
  if (!f || n <= 0) return;
  if (!f.waves) f.waves = [];
  if (f.waves.length > 6) return;
  f.waves.push({ t: T() + delay, n: n, mode: mode, at: at ? { x: at.x, y: at.y } : null, tag: tag || "" });
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
function setLevel(lv, why) {
  var s = sec(), was = s.lv;
  if (lv === was) return;
  s.lv = lv; s.t = T();
  log("Режим: " + SEC[lv] + (why ? " (" + why + ")" : "") + ".");
  var f = fs(), cb = C(), sn = s.seen || s.sus;
  A("alarmLayer", lv === 4 || lv === 5);
  if (lv === 0) { if (was >= 2) speak("normal", true); f.turretAlert = false; return; }
  if (lv === 1) { if (Math.random() < 0.4) speak("suspect"); return; }
  if (lv === 6) { speak("lost", true); f.turretAlert = false; searchAt(s.seen); return; }
  /* 2–5: тревога */
  f.alarmUntil = T() + (lv >= 3 ? 60 : 40); /* в тактах этажа: меню и мини-игры не съедают тревогу */
  f.turretAlert = true;
  if (lv === 2) { A("okoAlarm"); speak("alarm", true); if (sn) cb.alertMech(sn.x, sn.y, 28); return; }
  if (lv === 3) {
    speak("local", true);
    if (sn) { cb.alertMech(sn.x, sn.y, 40); if ((f.squads || 0) < 3 + Math.floor(st().heat / 40)) { f.squads = (f.squads || 0) + 1; wave(rnd(6, 14), 1 + (st().heat >= 60 ? 1 : 0) + (G().L >= 20 && Math.random() < 0.4 ? 1 : 0), "hunt", sn); } }
    return;
  }
  if (lv === 4) {
    if (was === 5) return; /* блокировка снята, тревога продолжается */
    A("okoAlarm"); speak("complex", true);
    if (sn) cb.alertMech(sn.x, sn.y, 99);
    if (!f.droneAt && !soft()) f.droneAt = T() + rnd(6, 20);
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
  if (n) { log("Аварийная блокировка: дверей — " + n + ", " + place(p.x, p.y) + "."); A("play", "door_locked"); LAB.say("Двери помещения заблокированы ОКО на сорок секунд. Замок можно взломать у двери.", { prio: "urgent" }); }
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
function report(src, x, y, kind, what) {
  var f = fs(), o = st(), cb = C();
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
  if (s.lv === 0) setLevel(1, (what || "признак").toLowerCase());
  if (s.lv <= 1 || s.lv === 6) { if (!cb.sendCheck(x, y, 1) && o.heat >= 25 && (f.checks || 0) < 4) { f.checks = (f.checks || 0) + 1; wave(rnd(10, 20), 1, "check", { x: x, y: y }); } }
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
    if (!soft() && depth() >= 8 && Math.random() < Math.min(0.65, 0.2 + depth() * 0.004 + o.heat / 250)) f.droneAt = T() + rnd(60, 160);
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
      break;
    case "floor":
      floorIn(data.how);
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
    case "hack_fail":
      o.fails++; heat(12);
      speak("hack_fail", true);
      alarm(data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, "hack", true);
      if (data.x != null) wave(rnd(6, 12), 1 + (o.heat >= 50 ? 1 : 0), "check", { x: data.x, y: data.y });
      break;
    case "terminal_hack":
      o.hacks++; heat(3);
      /* контрвзлом: ОКО замечает вскрытие не всегда — и тогда изолирует сегмент сети */
      if (Math.random() < 0.35 + o.heat / 150 + difficulty() * 0.08) {
        speak("terminal");
        var tx = data.x != null ? data.x : g.x, ty = data.y != null ? data.y : g.y;
        report("terminal", tx, ty, "suspect", "терминал вскрыт без пропуска");
        if (data.o && Math.random() < 0.3 + difficulty() * 0.15) { var ost = LAB.game.objState(data.o); ost.isoUntil = T() + rnd(80, 120); log("Сегмент сети терминала изолирован."); setTimeout(function () { speak("isolate", true); }, 2200); }
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
      if (o.heat >= 30 && !f.droneAt && C() && !C().drones().length && !soft()) f.droneAt = T() + rnd(10, 30);
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
      heat(10); setTimeout(function () { speak("boss", true); }, 2500);
      break;
    case "kill":
      o.kills++; heat(1);
      if (data.task === "repair") { heat(3); f.repairLost = 1; }
      /* пост опустел — ОКО поставит на него новую машину */
      if (data.guard && data.post && !soft() && (f.postN || 0) < 6) { f.postN = (f.postN || 0) + 1; (f.postsLost || (f.postsLost = [])).push({ x: data.post.x, y: data.post.y, kind: data.guard, t: T() + rnd(80, 160) }); }
      if (data.stalker) { heat(4); f.droneAt = T() + rnd(240, 400); if (Math.random() < 0.6) speakLater("drone_lost", 1500); }
      if (data.camera) {
        heat(5);
        if (Math.random() < 0.6) speakLater("cam_down", 900);
        report("lost", data.x, data.y, "suspect", "камера не отвечает");
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
      if (Math.random() < 0.25 + o.heat / 200) { speak("door"); report("door", data.x, data.y, "suspect", "запертая дверь открыта"); }
      break;
    case "sample":
      if (Math.random() < 0.3) setTimeout(function () { speak("sample"); }, 1800);
      break;
    case "riddle_ok":
      heat(-25);
      break;
    case "riddle_fail":
      heat(8); report("door", g.x, g.y, "seen");
      break;
    case "blind":
      f.okoBlind = true; heat(8);
      break;
  }
}

/* Смена караула: патрули получают новые маршруты; иногда один уходит со
   смены, а из дальней двери выходит другой; патрульных не меньше, чем
   нужно этажу этой глубины, а при сильном подозрении — больше. */
function shift() {
  var f = fs(), o = st(), g = G(), cb = C();
  if (!f || !cb || soft() || f.okoBlind) return;
  var d0 = depth(), pats = cb.patrols();
  var want = Math.min(4, (d0 >= 2 ? 1 : 0) + Math.floor(d0 / 45) + (o.heat >= 50 ? 1 : 0) + (o.heat >= 80 ? 1 : 0));
  var sa = o.seenAt, focus = sa && sa.L === g.L && sa.F === g.F && T() - sa.t < 240 ? sa : null;
  pats.forEach(function (p, i) { if (p.state === "idle") cb.reroute(p, i === 0 && focus && o.heat >= 35 ? focus : null); });
  var changed = false;
  if (pats.length && Math.random() < 0.4) {
    var far = pats.filter(function (p) { return p.state === "idle" && Math.abs(p.x - g.x) + Math.abs(p.y - g.y) > 10; });
    far.sort(function (a, b) { return (Math.abs(b.x - g.x) + Math.abs(b.y - g.y)) - (Math.abs(a.x - g.x) + Math.abs(a.y - g.y)); });
    if (far.length && cb.dismiss(far[0])) { wave(rnd(10, 30), 1, "patrol", null, "shift"); changed = true; }
  }
  if (pats.length < want) { wave(rnd(4, 20), 1, "patrol", focus && o.heat >= 50 ? focus : null, "shift"); changed = true; }
  if (changed && (o.heat >= 40 || Math.random() < 0.35)) speak("shift");
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
  /* отряды по расписанию */
  if (f.waves && f.waves.length) {
    for (var i = f.waves.length - 1; i >= 0; i--) {
      var w = f.waves[i];
      if (now < w.t) continue;
      f.waves.splice(i, 1);
      var gotW = cb.dispatch(w.n, w.mode, w.at);
      if (!gotW.length) continue;
      if (w.tag === "fresh") { speak("fresh", true); heard(gotW, "Новые машины ОКО"); }
      else if (w.mode === "patrol") { if (o.heat >= 40 || Math.random() < 0.4) heard(gotW, "Новый патруль ОКО"); }
      else if (w.mode === "check") heard(gotW, "ОКО шлёт проверку");
      else { speak("squad"); heard(gotW, "Отряд ОКО"); }
    }
  }
  /* смена на опустевшие посты */
  if (f.postsLost && f.postsLost.length) {
    for (var pi = f.postsLost.length - 1; pi >= 0; pi--) {
      var pl = f.postsLost[pi];
      if (now < pl.t) continue;
      f.postsLost.splice(pi, 1);
      var gp = cb.dispatch(1, "post", { x: pl.x, y: pl.y, kind: pl.kind });
      if (gp.length) { if (Math.random() < 0.6) speak("post"); heard(gp, "Смена поста ОКО"); }
    }
  }
  /* перепрошитый этаж: ОКО шлёт новые машины, пока роботы этажа не его */
  if (f.robots && f.flashNext && now >= f.flashNext) {
    f.flashNext = now + rnd(220, 320);
    if (cb.patrols().filter(function (p) { return p.fresh; }).length < 3) wave(0, 1, "patrol", null, "fresh");
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
  if (!f.droneAt && o.heat >= 55 && !soft() && now % 120 === 0 && !cb.drones().length) f.droneAt = now + rnd(20, 60);
  /* смена караула */
  if (!f.shiftAt) f.shiftAt = now + rnd(70, 130);
  else if (now >= f.shiftAt) { f.shiftAt = now + Math.max(70, 150 - Math.round(o.heat * 0.7)) + rnd(0, 40); shift(); }
  /* слух ОКО: громкая стрельба — акустические датчики, проверка источника */
  if (g.noise >= 10 && now - (f.noiseT || -999) > 40) {
    f.noiseT = now;
    if (report("noise", g.x, g.y, "suspect", "выстрелы") && Math.random() < 0.3) speak("check");
  }
  secTick();
  /* резервный контур: отключённые турели ОКО через время запитывает снова */
  if (f.turretMode === "off" && f.backupAt && now >= f.backupAt && cb.turretsLeft() > 0) {
    f.backupAt = 0;
    if (!f.cutHold) { f.turretMode = "on"; cb.turretsHostile(); A("play", "power_on"); speak("backup", true); log("Резервный контур: турели под током."); }
  }
  /* иногда ОКО говорит просто так — когда рядом тихо */
  var nowMs = Date.now();
  if (nowMs - (o.lastTaunt || 0) > 240000 + Math.random() * 180000 && !cb.danger()) {
    o.lastTaunt = nowMs;
    if (tickN > 200) speak("taunt");
  }
}

LAB.oko = {
  event: event, tick: tick, speak: speak, alarm: alarm, difficulty: difficulty, heat: heat,
  state: st, lines: lines, wave: wave, shift: shift,
  report: report, level: level, levelName: function () { return SEC[level()]; }, setLevel: setLevel, sec: sec, log: log, logText: logText, T: T
};
})();
