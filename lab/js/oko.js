/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — ОКО отвечает на действия игрока.
   Громкая связь: ОКО говорит, когда вы входите на уровень, ломаете его
   машины, взламываете терминалы, побеждаете стражей. Камеры и уборщики
   докладывают ему, где вы, — и ОКО поднимает тревогу: роботы этажа идут
   на ваш след, при сильном подозрении — выходит ответная группа.
   Отключённые турели ОКО чинит: высылает ремонтника, и если тот дойдёт
   до турели, турели оживут. Перехваченные турели ОКО через какое-то время
   возвращает себе (контрвзлом), если перехват не закрепить на терминале.
   Чем чаще вы взламываете, тем сложнее становятся его протоколы.
   Подозрение ОКО (heat, от 0 до 100) растёт от ваших действий и понемногу
   спадает со временем.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
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
/* Сказать по громкой связи (с позывным и сигналом). */
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
  setTimeout(function () { LAB.say("ОКО по громкой связи: «" + t + "»", { interrupt: false }); }, 450);
  if (LAB.game.journal && (kind === "turret_hack" || kind === "robots" || kind === "boss")) LAB.game.journal("ОКО: «" + t + "»");
  return true;
}
function heat(n) { var o = st(); o.heat = Math.max(0, Math.min(100, o.heat + n)); }

/* Тревога на этаже: роботы идут на след героя; при сильном подозрении —
   ответная группа от дальней двери. */
function alarm(x, y, why, power) {
  var f = fs();
  if (!f) return;
  if (f.okoBlind || G().st.jam > 0) return;
  var now = Date.now();
  if (f.alarmUntil && f.alarmUntil > now - 4000 && !power) { if (LAB.combat) LAB.combat.alertMech(x, y, 99); return; }
  f.alarmUntil = now + 20000;
  heat(why === "camera" ? 7 : 4);
  A("okoAlarm");
  if (LAB.combat) LAB.combat.alertMech(x, y, why === "cleaner" ? 14 : 99);
  speak("alarm", true);
  var o = st();
  if ((o.heat >= 35 || power) && LAB.combat && (f.squads || 0) < 2 + Math.floor(o.heat / 40)) {
    f.squads = (f.squads || 0) + 1;
    LAB.combat.sendSquad(1 + (o.heat >= 60 ? 1 : 0) + (G().L >= 20 && Math.random() < 0.4 ? 1 : 0), "hunt");
  }
}

/* Насколько ОКО усложнило протоколы: после частых взломов — длиннее ключи
   и сложнее схемы; подозрение тоже добавляет. */
function difficulty() { var o = st(); return Math.min(4, Math.floor(o.hacks / 3) + Math.floor(o.heat / 40)); }

/* События игры. */
function event(kind, data) {
  data = data || {};
  var o = st(), f = fs();
  switch (kind) {
    case "enter":
      if (!o.levelSaid || o.levelSaid < G().L) { o.levelSaid = G().L; setTimeout(function () { speak("enter", true); }, 5200); }
      break;
    case "turret_off":
      o.hacks++; heat(10); speak("turret_off", true);
      /* ремонтник выходит к турелям через полминуты */
      f.repairAt = Date.now() + 25000 + Math.random() * 15000;
      break;
    case "turret_hack":
      o.hacks++; heat(16); speak("turret_hack", true);
      f.counterAt = Date.now() + Math.max(60000, 150000 - o.heat * 900);
      if (LAB.combat) LAB.combat.alertMech(G().x, G().y, 30);
      break;
    case "turret_hold":
      f.counterAt = Date.now() + 180000; heat(4);
      break;
    case "hack_fail":
      o.fails++; heat(12); alarm(data.x != null ? data.x : G().x, data.y != null ? data.y : G().y, "hack", o.heat >= 50);
      speak("hack_fail", true);
      break;
    case "terminal_hack":
      o.hacks++; heat(3);
      break;
    case "robots":
      o.hacks++; heat(20); speak("robots", true);
      break;
    case "lockdown":
      heat(6); speak("lockdown");
      break;
    case "camera":
      alarm(G().x, G().y, "camera");
      break;
    case "cleaner":
      alarm(G().x, G().y, "cleaner");
      break;
    case "boss":
      heat(10); setTimeout(function () { speak("boss", true); }, 2500);
      break;
    case "kill":
      o.kills++; heat(1);
      if (o.kills - (o.killSaid || 0) >= 15) { o.killSaid = o.kills; speak("kill"); }
      break;
    case "sample":
      if (Math.random() < 0.3) setTimeout(function () { speak("sample"); }, 1800);
      break;
    case "riddle_ok":
      heat(-25);
      break;
    case "riddle_fail":
      heat(8); alarm(G().x, G().y, "hack");
      break;
    case "blind":
      f.okoBlind = true; heat(8);
      break;
  }
}

/* Такт (раз в полсекунды, из боя): ремонтники, контрвзлом, подозрение. */
var tickN = 0;
function tick() {
  var f = fs(), o = st(), now = Date.now(), g = G();
  if (!f || g.dead) return;
  tickN++;
  if (g.st.jam > 0) g.st.jam--;
  if (tickN % 60 === 0) heat(-1);
  if (f.repairAt && now >= f.repairAt) {
    f.repairAt = 0;
    if (f.turretMode === "off" && LAB.combat && LAB.combat.turretsLeft() > 0) {
      if (LAB.combat.sendSquad(1, "repair")) speak("repair", true);
    }
  }
  if (f.counterAt && now >= f.counterAt) {
    f.counterAt = 0;
    if (f.turretMode === "ours" && LAB.combat) {
      f.turretMode = "on";
      LAB.combat.turretsHostile();
      A("play", "term_err");
      speak("counter", true);
    }
  }
  /* иногда ОКО говорит просто так — когда рядом тихо */
  if (now - (o.lastTaunt || 0) > 240000 + Math.random() * 180000 && !(LAB.combat && LAB.combat.danger())) {
    o.lastTaunt = now;
    if (o.lastTaunt && tickN > 200) speak("taunt");
  }
}

LAB.oko = {
  event: event, tick: tick, speak: speak, alarm: alarm, difficulty: difficulty, heat: heat,
  state: st, lines: lines
};
})();
