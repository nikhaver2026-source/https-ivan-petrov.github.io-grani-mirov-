/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — запуск.
   Первое касание будит звук (браузеры и WebView без него молчат), при
   первом запуске звучит пролог, потом — главное меню.
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
  LAB.Bank.preload(LAB.SOUND_CORE || []);
  setTimeout(function () { LAB.Bank.preload(LAB.SOUND_ALL || []); }, 4000);
  if (!LAB.store.get("lab_prologue_seen")) LAB.ui.prologue(false);
  else LAB.ui.mainMenu();
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
  /* уход в фон: записать игру и приглушить звук */
  document.addEventListener("visibilitychange", function () {
    var hidden = document.hidden;
    if (hidden && LAB.game && LAB.game.entered) LAB.game.autosave();
    try { if (LAB.AE.ctx) { if (hidden) LAB.AE.ctx.suspend(); else LAB.AE.ctx.resume(); } } catch (e) { /* */ }
  });
  window.labPause = function () { if (LAB.game && LAB.game.entered) LAB.game.autosave(); };
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
  var floors = 0;
  step("tour", function () {
    for (var L = 1; L <= LAB.LEVELS_N; L++) for (var F = 1; F <= LAB.FLOORS_N; F++) {
      LAB.game.enterFloor(L, F, F === 1 && L > 1 ? "gatedown" : "down", true);
      for (var k = 0; k < 4; k++) LAB.combat.tick();
      LAB.game.lookAround();
      G = LAB.game.G; G.dead = false; G.hp = G.hpMax;
      floors++;
    }
  });
  step("audio", function () { LAB.Bank.preload(["step_plate", "bump_wall", "bcn_gatecard"]); });
  /* Музыка и фон уровня — из памяти. Проверяется уровень, где стоит герой:
     музыку прошлых уровней игра сама выгружает. Ждём декодирования до 40 с. */
  var cur = LAB.game.G.L, musId = "mus_l" + cur, ambId = "amb_l" + cur, t0 = Date.now();
  var allBad = function (id) { var d = LAB.Bank.defs[id]; return !!d && d.f.every(function (f) { return LAB.Bank.bad[f]; }); };
  var finish = function () {
    var audio = LAB.Bank.ready("step_plate") && LAB.Bank.ready("bump_wall");
    var musicOk = false, secs = Math.round((Date.now() - t0) / 100) / 10;
    try { var h = LAB.Bank.ready(musId) && LAB.Bank.play(musId, { bus: "music", loop: true, gain: 0.01 }); musicOk = !!h && h.dur > 30; if (h) h.stop(0.05); } catch (e) { musicOk = false; }
    var ambOk = LAB.Bank.ready(ambId);
    if (!musicOk) fails.push("музыка не играет" + (allBad(musId) ? " (ошибка декодирования)" : " (не успела за " + secs + " с)"));
    if (!ambOk) fails.push("фон уровня не декодировался" + (allBad(ambId) ? " (ошибка декодирования)" : ""));
    var tts = "";
    try { tts = window.LabTTS ? window.LabTTS.status() + (window.LabTTS.hasRussian() ? ", русский есть" : ", русского нет") : "нет моста"; } catch (e) { tts = "?"; }
    if (!audio) fails.push("звук не декодировался");
    /* компьютер: голосов Microsoft нет — без голосов игрока говорит встроенный eSpeak */
    if (LAB.desktop && LAB.Speech.backend === "espeak" && LAB.Speech.espSt !== "ready") fails.push("встроенный eSpeak не поднялся");
    log((fails.length ? "selftest FAIL: " + fails.join(" | ") : "selftest ok") + "; этажей: " + floors + "; звук: " + (audio ? "да" : "нет") + "; музыка: " + (musicOk ? "да, " + musId + " за " + secs + " с" : "нет") + "; речь: " + tts + "; движок речи: " + LAB.Speech.backend + (LAB.Speech.backend === "espeak" ? " (" + LAB.Speech.espSt + ")" : ""));
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
