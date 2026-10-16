/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — запуск.
   Первое касание будит звук (браузеры и WebView без него молчат), потом —
   главное меню; новая игра начинается с пролога.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
var started = false;

function start(e) {
  if (started) return;
  started = true;
  /* касание, которое разбудило звук, жестом не считается (клавиша — уже отработала) */
  if (e && e.type === "pointerdown" && LAB.input && LAB.input.swallow) LAB.input.swallow();
  LAB.AE.ensure();
  try { if (LAB.AE.ctx && LAB.AE.ctx.state === "suspended") LAB.AE.ctx.resume(); } catch (x) { /* */ }
  LAB.Sound.preload(LAB.SOUND_CORE || []);
  setTimeout(function () { LAB.Sound.preload(LAB.SOUND_ALL || []); }, 4000);
  /* пролог звучит в начале новой игры («Начать игру»); сначала — главное меню */
  LAB.ui.mainMenu();
}

window.addEventListener("error", function (e) {
  try { if (window.LabTTS && window.LabTTS.log) window.LabTTS.log("error " + (e && e.message) + " @" + (e && e.filename) + ":" + (e && e.lineno)); } catch (x) { /* */ }
});
function boot() {
  LAB.safe(function () { if (LAB.registerSounds) LAB.registerSounds(); });
  LAB.Speech.init();
  LAB.input.init();
  LAB.ui.setScreen("boot");
  var t = document.getElementById("pageTitle"), x = document.getElementById("pageText"), h = document.getElementById("pageHint");
  if (t) t.textContent = LAB.TITLE;
  if (x) x.textContent = LAB.SUBTITLE + ". Игра для незрячих и для тех, кто играет на слух.";
  if (h) h.textContent = LAB.K("Коснитесь экрана, чтобы начать.", "Нажмите любую клавишу, чтобы начать.");
  var pad = document.getElementById("pad");
  if (pad) pad.addEventListener("pointerdown", start, { once: true });
  document.addEventListener("keydown", function kd(e) { document.removeEventListener("keydown", kd); start(e); });
  /* телефон говорит и без касания — подскажем, что делать */
  setTimeout(function () { if (!started) LAB.say(LAB.TITLE + ". " + LAB.K("Коснитесь экрана, чтобы начать.", "Нажмите любую клавишу, чтобы начать.")); }, 900);
  /* компьютер: звук разрешён приложением — игра начинается сама */
  if (LAB.desktop) setTimeout(function () { start(null); }, 500);
  /* уход в фон (звонок, свёрнутое окно): игра записывает себя, мир стоит,
     речь молчит, звук приглушён; вернулись — всё продолжается */
  var toBg = function (on) {
    LAB.bg = on;
    if (on) {
      if (LAB.game && LAB.game.entered) LAB.game.autosave();
      LAB.safe(function () { if (LAB.input) LAB.input.stopAll(); });
      LAB.safe(function () { if (LAB.combat && LAB.combat.stopFire) LAB.combat.stopFire(); });
      LAB.safe(function () { if (LAB.Speech && LAB.Speech.hush) LAB.Speech.hush(); });
      try { if (LAB.AE.ctx) LAB.AE.ctx.suspend(); } catch (e) { /* */ }
    } else {
      try { if (LAB.AE.ctx) LAB.AE.ctx.resume(); } catch (e) { /* */ }
    }
  };
  document.addEventListener("visibilitychange", function () { toBg(document.hidden); });
  window.labPause = function () { toBg(true); };
  var resume0 = window.labResume;
  window.labResume = function () { toBg(false); if (resume0) resume0(); };
  /* для проверок: в приложении — отметка в журнале устройства */
  window.LAB_READY = true;
  try { if (window.LabTTS && window.LabTTS.log) window.LabTTS.log("ready " + LAB.TITLE + " " + LAB.VERSION + ", звуков: " + Object.keys(LAB.SND || {}).length); } catch (e) { /* */ }
}

/* Самопроверка на устройстве: её зовёт приложение по ключу запуска lab_selftest
   (проверка APK на эмуляторах Android 9 и новее). Итог — в журнал устройства. */
LAB.selftest = function () {
  var log = function (m) { try { if (window.LabTTS && window.LabTTS.log) window.LabTTS.log(m); } catch (e) { /* */ } try { console.log(m); } catch (e2) { /* */ } };
  var fails = [];
  var step = function (name, fn) { try { fn(); } catch (e) { fails.push(name + ": " + (e && e.message)); } };
  log("selftest start; webview " + navigator.userAgent);
  step("start", function () { start({ type: "pointerdown" }); });
  step("newgame", function () { LAB.game.newGame(); });
  var G = LAB.game.G;
  step("walk", function () { var d = ["N", "E", "S", "W"]; for (var i = 0; i < 80; i++) LAB.game.tryMove(d[Math.floor(Math.random() * 4)], false); });
  step("weapon", function () { LAB.game.toggleDraw(); LAB.combat.fire("N", false); LAB.game.reload(); LAB.game.switchWeapon(1); LAB.game.toggleDraw(); });
  step("windows", function () { LAB.ui.character(); LAB.ui.closeAll(); LAB.ui.inventory(); LAB.ui.closeAll(); LAB.ui.implants(); LAB.ui.closeAll(); });
  step("save", function () { if (!LAB.game.saveSlot(1)) throw new Error("не записалось"); });
  step("load", function () { if (!LAB.game.loadSlot(1)) throw new Error("не загрузилось"); });
  step("navigate", function () { LAB.game.navigate(false); LAB.game.navigate(true); LAB.game.lookAround(); });
  step("oko", function () { if (LAB.oko) { LAB.oko.event("camera"); LAB.oko.event("turret_off"); LAB.oko.tick(); } });
  var floors = 0;
  /* Обход этажей: первый уровень целиком, дальше — три этажа уровня (первый,
     один из средних и последний, со стражем и шлюзом). На компьютере и в
     браузере — каждый уровень; на телефоне — до Ядра каждый, глубже — первый
     и последний уровень каждого блока и каждый пятый (все уровни целиком
     проверяет генератор при сборке, tests/world.test.js). */
  var phone = !!window.LabTTS && !LAB.desktop;
  var deepPick = function (L) { return L <= 11 || !phone || L === LAB.LEVELS_N || L % 5 === 0 || L % 20 === 1; };
  step("tour", function () {
    /* обход — без звука: сотни этажей подряд, иначе игра закажет музыку и
       голоса каждого уровня разом (памяти телефона не хватит) */
    LAB.Sound.setQuiet(true);
    var heap = function () { try { return performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) + " МБ" : "?"; } catch (e) { return "?"; } };
    for (var L = 1; L <= LAB.LEVELS_N; L++) {
      if (!deepPick(L)) continue;
      if (L % 10 === 1) log("selftest tour: уровень " + L + ", этажей " + floors + ", память " + heap());
      var list = L === 1 ? [] : [1, (L % 18) + 2, LAB.FLOORS_N];
      if (L === 1) for (var f0 = 1; f0 <= LAB.FLOORS_N; f0++) list.push(f0);
      for (var i = 0; i < list.length; i++) {
        var F = list[i];
        LAB.game.enterFloor(L, F, F === 1 && L > 1 ? "gatedown" : "down", true);
        for (var k = 0; k < 4; k++) LAB.combat.tick();
        LAB.game.lookAround();
        if (F === LAB.FLOORS_N && LAB.combat.turretsLeft()) { LAB.combat.turretsOurs(); LAB.combat.tick(); LAB.combat.turretsOff(); LAB.combat.tick(); }
        G = LAB.game.G; G.dead = false; G.hp = G.hpMax;
        floors++;
      }
    }
    LAB.Sound.setQuiet(false);
    LAB.game.enterFloor(1, 1, "start", true);
  });
  LAB.Sound.setQuiet(false);
  step("audio", function () { LAB.Sound.preload(["step_plate", "bump_wall", "bcn_gatecard"]); });
  /* Музыка и фон уровня — из памяти. Проверяется уровень, где стоит герой:
     музыку прошлых уровней игра сама выгружает. Ждём декодирования до 40 с. */
  var cur = LAB.game.G.L, musId = "mus_l" + cur, ambId = LAB.LEVELS[cur].amb || "amb_l" + cur, t0 = Date.now();
  var allBad = function (id) { var d = LAB.Bank.defs[id]; return !!d && d.f.every(function (f) { return LAB.Bank.bad[f]; }); };
  /* Слышно ли музыку на динамике телефона: доля звука выше 350 Гц (фильтр
     верхних частот второго порядка по 20 с записи). Гул ниже 350 Гц динамик
     телефона не играет — такую музыку игрок не слышит вовсе. */
  var hearDb = function (buf) {
    var d = buf.getChannelData(0), sr = buf.sampleRate, n = Math.min(d.length, Math.floor(sr * 20)), s0 = Math.floor((d.length - n) / 2);
    var w = 2 * Math.PI * 350 / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
    var b0 = (1 + cs) / 2 / a0, b1 = -(1 + cs) / a0, b2 = b0, a1 = -2 * cs / a0, a2 = (1 - al) / a0;
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0, ex = 0, ey = 0;
    for (var i = s0; i < s0 + n; i++) { var x = d[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; ex += x * x; ey += y * y; }
    return ex > 0 ? Math.round(100 * Math.log(ey / ex + 1e-12) / Math.LN10) / 10 : -99;
  };
  var finish = function () {
    var audio = LAB.Bank.ready("step_plate") && LAB.Bank.ready("bump_wall");
    var musicOk = false, secs = Math.round((Date.now() - t0) / 100) / 10, hear = -99, playing = false, buf = null;
    try {
      var f0 = LAB.Bank.defs[musId] && LAB.Bank.defs[musId].f[0];
      buf = f0 ? LAB.Bank.bufs[f0] : null;
      if (buf) hear = hearDb(buf);
      /* музыку должна включить сама игра — проверяется то, что звучит, а не только загрузка */
      var mn = LAB.atmos && LAB.atmos.musicNow ? LAB.atmos.musicNow() : null;
      playing = !!(mn && mn.id === musId && mn.on);
      musicOk = !!buf && buf.duration > 30 && playing && hear >= -12;
    } catch (e) { musicOk = false; }
    var ambOk = LAB.Bank.ready(ambId);
    if (!musicOk) fails.push("музыка не играет" + (allBad(musId) ? " (ошибка декодирования)" : !buf ? " (не успела за " + secs + " с)" : !playing ? " (игра её не включила)" : " (на динамике не слышно: " + hear + " дБ выше 350 Гц)"));
    if (!ambOk) fails.push("фон уровня не декодировался" + (allBad(ambId) ? " (ошибка декодирования)" : ""));
    var tts = "";
    try { tts = window.LabTTS ? window.LabTTS.status() + (window.LabTTS.hasRussian() ? ", русский есть" : ", русского нет") : "нет моста"; } catch (e) { tts = "?"; }
    if (!audio) fails.push("звук не декодировался");
    /* компьютер: голосов Microsoft нет — без голосов игрока говорит встроенный eSpeak */
    if (LAB.desktop && LAB.Speech.backend === "espeak" && LAB.Speech.espSt !== "ready") fails.push("встроенный eSpeak не поднялся");
    log((fails.length ? "selftest FAIL: " + fails.join(" | ") : "selftest ok") + "; этажей: " + floors + "; звук: " + (audio ? "да" : "нет") + "; музыка: " + (musicOk ? "да, " + musId + " за " + secs + " с, на динамике " + hear + " дБ выше 350 Гц" : "нет") + "; речь: " + tts + "; движок речи: " + LAB.Speech.backend + (LAB.Speech.backend === "espeak" ? " (" + LAB.Speech.espSt + ")" : ""));
    LAB.ui.mainMenu();
  };
  var poll = function () {
    var ok = LAB.Bank.ready(musId) && LAB.Bank.ready(ambId) && LAB.Bank.ready("step_plate") && LAB.Bank.ready("bump_wall");
    var espWait = LAB.desktop && LAB.Speech.backend === "espeak" && LAB.Speech.espSt === "loading";
    if ((ok && !espWait) || allBad(musId) || Date.now() - t0 > 40000) { finish(); return; }
    setTimeout(poll, 500);
  };
  setTimeout(poll, 3000);
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
LAB.start = start;
})();
