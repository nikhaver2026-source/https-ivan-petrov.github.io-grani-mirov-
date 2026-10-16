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
function heat(n) { var o = st(); o.heat = Math.max(0, Math.min(100, o.heat + n)); }
/* Отряд по расписанию: через delay тактов, n машин, mode — как в dispatch. */
function wave(delay, n, mode, at, tag) {
  var f = fs();
  if (!f || n <= 0) return;
  if (!f.waves) f.waves = [];
  if (f.waves.length > 6) return;
  f.waves.push({ t: T() + delay, n: n, mode: mode, at: at ? { x: at.x, y: at.y } : null, tag: tag || "" });
}

/* Тревога на этаже: роботы идут на след героя (двери им открывает ОКО);
   при сильном подозрении — ответная группа от дальней двери. */
function alarm(x, y, why, power) {
  var f = fs(), o = st();
  if (!f || !C()) return;
  if (f.okoBlind || G().st.jam > 0) return;
  var now = Date.now(), radius = why === "cleaner" ? 14 : why === "drone" ? 28 : 99;
  o.seenAt = { x: x, y: y, L: G().L, F: G().F, t: T() };
  if (f.alarmUntil && f.alarmUntil > now - 4000 && !power) { C().alertMech(x, y, radius); return; }
  f.alarmUntil = now + 20000;
  heat(why === "camera" ? 7 : why === "drone" ? 3 : 4);
  A("okoAlarm");
  C().alertMech(x, y, radius);
  if (why !== "drone") speak("alarm", true);
  if ((o.heat >= 35 || power) && (f.squads || 0) < 2 + Math.floor(o.heat / 40)) {
    f.squads = (f.squads || 0) + 1;
    wave(rnd(6, 14), 1 + (o.heat >= 60 ? 1 : 0) + (G().L >= 20 && Math.random() < 0.4 ? 1 : 0), why === "hack" ? "check" : "hunt", { x: x, y: y });
  }
}

/* Насколько ОКО усложнило протоколы: после частых взломов — длиннее ключи
   и сложнее схемы; подозрение тоже добавляет. */
function difficulty() { var o = st(); return Math.min(4, Math.floor(o.hacks / 3) + Math.floor(o.heat / 40)); }

/* Вход на этаж: смена караула и дрон — по расписанию; на лифте встречают. */
function floorIn(how) {
  var f = fs(), o = st(), cb = C();
  if (!f || !cb) return;
  legacy(f);
  if (!f.okoInit) {
    f.okoInit = 1;
    f.shiftAt = T() + rnd(70, 130);
    if (!soft() && depth() >= 8 && Math.random() < Math.min(0.65, 0.2 + depth() * 0.004 + o.heat / 250)) f.droneAt = T() + rnd(60, 160);
  }
  if (how === "elev") {
    var gs = cb.guards().filter(function (q) { return q.guard === "lift"; });
    if (gs.length) {
      gs.forEach(function (q) { if (q.state === "idle") { q.state = "alert"; q.lastKnown = { x: G().x, y: G().y }; q.lost = 0; } });
      if (Math.random() < 0.6) speakLater("lift", 2600);
    }
  }
}
/* Сохранения прошлых версий: сроки ОКО были по часам — переводим в такты. */
function legacy(f) {
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
      /* ремонтник выходит к турелям через несколько секунд */
      f.repairAt = T() + rnd(14, 26); f.repairN = 0;
      break;
    case "turret_hack":
      o.hacks++; heat(16); speak("turret_hack", true);
      f.counterAt = T() + Math.max(120, 300 - Math.round(o.heat * 1.8));
      if (C()) C().alertMech(g.x, g.y, 30);
      wave(rnd(16, 26), 1 + (o.heat >= 50 ? 1 : 0), "hunt");
      break;
    case "turret_hold":
      f.counterAt = T() + 360; heat(4);
      break;
    case "hack_fail":
      o.fails++; heat(12);
      alarm(data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, "hack", true);
      speak("hack_fail", true);
      break;
    case "terminal_hack":
      o.hacks++; heat(3);
      if (Math.random() < 0.35 + o.heat / 150) {
        speak("terminal");
        var tx = data.x != null ? data.x : g.x, ty = data.y != null ? data.y : g.y;
        if (!(C() && C().sendCheck(tx, ty, 1)) && o.heat >= 25) wave(rnd(10, 20), 1, "check", { x: tx, y: ty });
      }
      break;
    case "robots":
      o.hacks++; heat(20); speak("robots", true);
      wave(rnd(24, 40), 2 + (o.heat >= 60 ? 1 : 0), "hunt", null, "fresh");
      f.flashNext = T() + rnd(200, 300);
      break;
    case "lockdown":
      heat(6); speak("lockdown", true);
      wave(rnd(12, 20), 1 + (o.heat >= 50 ? 1 : 0), "hunt");
      break;
    case "camera":
      alarm(g.x, g.y, "camera");
      if (o.heat >= 30 && !f.droneAt && C() && !C().drones().length && !soft()) f.droneAt = T() + rnd(10, 30);
      break;
    case "cleaner":
      alarm(g.x, g.y, "cleaner");
      break;
    case "drone":
      alarm(data.x != null ? data.x : g.x, data.y != null ? data.y : g.y, "drone");
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
        if (!(C() && C().sendCheck(data.x, data.y, 1)) && o.heat >= 25) wave(rnd(10, 24), 1, "check", { x: data.x, y: data.y });
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
      if (Math.random() < 0.25 + o.heat / 200) { speak("door"); if (C()) C().sendCheck(data.x, data.y, 1); }
      break;
    case "sample":
      if (Math.random() < 0.3) setTimeout(function () { speak("sample"); }, 1800);
      break;
    case "riddle_ok":
      heat(-25);
      break;
    case "riddle_fail":
      heat(8); alarm(g.x, g.y, "hack");
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
  if (f.turretMode === "off" && cb.turretsLeft() > 0) {
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
      var gd = cb.dispatch(1, "drone");
      if (gd.length) { speak("drone", true); heard(gd, "Вылетел дрон слежения ОКО", true); }
    }
  }
  if (!f.droneAt && o.heat >= 55 && !soft() && now % 120 === 0 && !cb.drones().length) f.droneAt = now + rnd(20, 60);
  /* смена караула */
  if (!f.shiftAt) f.shiftAt = now + rnd(70, 130);
  else if (now >= f.shiftAt) { f.shiftAt = now + Math.max(70, 150 - Math.round(o.heat * 0.7)) + rnd(0, 40); shift(); }
  /* слух ОКО: громкая стрельба — патруль идёт к источнику */
  if (g.noise >= 10 && o.heat >= 20 && now - (f.noiseT || -999) > 40) {
    f.noiseT = now;
    if (cb.sendCheck(g.x, g.y, 1) && Math.random() < 0.3) speak("check");
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
  state: st, lines: lines, wave: wave, shift: shift
};
})();
