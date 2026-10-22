/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — экраны и окна.
   Пролог (вправо — дальше, влево — назад, вверх — пропустить), главное
   меню (Начать игру, Пролог, Загрузить игру, Руководство, Настройки), настройки
   (синтезатор, сложность, громкость музыки — свайп вверх и вниз), окно
   персонажа (три пальца вверх: здоровье, заряд, «Сохранить игру» на три
   слота, «Выход»), инвентарь (три пальца вниз, по разделам), мастерская,
   импланты, записки, финал. В окнах: свайп вправо и влево — пункты,
   двойное касание — выбрать, вверх и вниз — значение у ползунка,
   два пальца вниз — закрыть окно.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB, S = LAB.settings;
function say(t, o) { LAB.say(t, o); }
function sayq(t) { LAB.say(t, { interrupt: false }); }
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function $(id) { return document.getElementById(id); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }

var screen = "boot";
var stack = [];
var page = null; /* листаемые страницы: пролог, финал */

/* ════════ ОКНА ════════ */
function itemText(it) {
  var l = typeof it.label === "function" ? it.label() : it.label;
  if (it.kind === "slider" || it.kind === "choice" || it.kind === "toggle") l += ": " + valueText(it);
  if (it.disabled && !it.info) l += " — недоступно";
  return l;
}
function valueText(it) {
  var v = it.get();
  if (it.kind === "toggle") return v ? "включено" : "выключено";
  if (it.kind === "choice") { var o = it.options.filter(function (x) { return x.v === v; })[0]; return o ? o.label : String(v); }
  if (it.fmt) return it.fmt(v);
  return String(v);
}
function top() { return stack.length ? stack[stack.length - 1] : null; }
function menu(title, items, opts) {
  opts = opts || {};
  items = (items || []).filter(Boolean);
  if (!items.length) return;
  if (opts.closeFirst !== false && opts.replace) stack.pop();
  /* то же окно уже открыто ниже (пункт «Назад» открывает родителя заново) —
     заменяем его, а не копим: «назад» и пункт «Назад» ведут в одно место */
  for (var si = stack.length - 1; si >= 0; si--) if (stack[si].title === title && !stack[si].root) { stack.splice(si); break; }
  var w = { title: title, items: items, i: Math.max(0, Math.min(items.length - 1, opts.focus || 0)), keep: !!opts.keep, root: !!opts.root, rebuild: opts.rebuild || null, onClose: opts.onClose || null, onFocus: opts.onFocus || null, silentOpen: !!opts.silent, intro: opts.intro || "" };
  stack.push(w);
  if (LAB.input && LAB.input.stopAll) LAB.input.stopAll(); /* ходьба и очередь с удержания — стоп */
  LAB.UI.open();
  render();
  var hl = LAB.tutor ? LAB.tutor.level() : 2;
  if (!w.silentOpen) say(title + ". " + (w.intro ? w.intro + " " : "") + itemText(w.items[w.i]) + (S.verbose && hl >= 1 && (hl >= 3 || !G().tut.win) ? LAB.K(". Свайп вправо и влево — пункты, двойное касание — выбрать, два пальца вниз — закрыть.", ". Стрелки вверх и вниз — пункты, Enter — выбрать, Escape — закрыть.") : ""));
  if (gm() && gm().entered) G().tut.win = 1;
  /* (1.5) окну важно, какой пункт перед игроком: книги капсулы считают прочитанные страницы */
  if (w.onFocus) LAB.safe(function () { w.onFocus(w.i); });
  return w;
}
function closeTop(silent) {
  var w = top();
  if (!w || w.root) return false;
  /* окно записки закрыли (Escape, «назад», два пальца вниз) — чтение
     обрывается и больше не продолжается */
  if (w.note) LAB.Speech.endNote();
  var quiet = LAB.Speech.noteBusy(); /* записка ещё читается — без объявлений */
  stack.pop();
  if (w.onClose) LAB.safe(w.onClose);
  if (!silent) LAB.UI.close();
  render();
  var t = top();
  if (t && !silent) {
    if (t.rebuild) { t.items = t.rebuild(); t.i = Math.min(t.i, t.items.length - 1); render(); }
    if (!quiet) say(t.title + ". " + itemText(t.items[t.i]));
  } else if (!t && !silent && !quiet && screen === "game") say("Игра.");
  return true;
}
function closeAll() {
  while (stack.length && !top().root) { var w = stack.pop(); if (w.note) LAB.Speech.endNote(); if (w.onClose) LAB.safe(w.onClose); }
  render();
}
function layer() {
  if (screen !== "game") return "screen";
  return stack.length ? top() : null;
}
function activate() {
  var w = top(); if (!w) return;
  var it = w.items[w.i];
  if (!it) return;
  if (it.kind === "toggle") { it.set(!it.get()); LAB.UI.click(); say(itemText(it) + (it.descOf ? ". " + it.descOf(it.get()) : "")); render(); return; }
  if (it.kind === "choice") { cycle(it, 1); return; }
  if (it.kind === "slider") { say(itemText(it) + LAB.K(". Свайп вверх — больше, вниз — меньше.", ". Стрелка вправо — больше, влево — меньше.")); return; }
  if (it.disabled) { LAB.UI.error(); say(it.why || "Недоступно."); return; }
  /* «Отойти», «Назад», «Отмена» без действия — закрыть окно и сказать, где вы */
  if (it.close || (/^(Отойти|Назад|Отмена)$/.test(String(it.label)) && String(it.fn).replace(/\s+/g, "") === "function(){}")) { if (!closeTop()) LAB.UI.error(); return; }
  LAB.UI.click();
  var keep = w.keep || it.keep, n0 = LAB.Speech.sayN || 0;
  /* пункт выполняется, пока его окно ещё открыто: открыл новое окно — это
     остаётся под ним (жест «назад» вернёт сюда); не открыл — окно закрывается */
  LAB.safe(function () { it.fn(); });
  var wi = stack.indexOf(w);
  if (!keep && !w.root && wi >= 0 && top() === w) {
    stack.splice(wi, 1); render();
    if ((LAB.Speech.sayN || 0) === n0 && !(LAB.mini && LAB.mini.active())) {
      var t = top();
      if (t) say(t.title + ". " + itemText(t.items[t.i])); else if (screen === "game") say("Игра.");
    }
  }
  if (keep && top() === w && w.rebuild) { var old = w.i; w.items = w.rebuild(); w.i = Math.min(old, w.items.length - 1); render(); }
}
function move(step) {
  var w = top(); if (!w) return;
  var n = w.items.length;
  w.i = (w.i + step + n) % n;
  LAB.UI.move();
  render();
  if (w.onFocus) LAB.safe(function () { w.onFocus(w.i); });
  /* записка читается, а игрок сам пошёл по её абзацам: общее чтение обрывается,
     и звучит выбранный абзац (прежде ходили молча, и на компьютере это выглядело
     как зависание: стрелки нажимаются, а ответа нет, пока не нажать Ctrl) */
  if (w.note && LAB.Speech.noteBusy()) LAB.Speech.endNote();
  say(itemText(w.items[w.i]));
}
function cycle(it, step) {
  var opts = it.options, cur = it.get(), k = 0;
  for (var i = 0; i < opts.length; i++) if (opts[i].v === cur) k = i;
  k = (k + step + opts.length) % opts.length;
  it.set(opts[k].v);
  LAB.UI.click();
  /* значение и его описание — одной фразой: описание не теряется */
  say(valueText(it) + (it.descOf ? ". " + it.descOf(it.get()) : ""));
  render();
}
function adjust(it, dir) {
  if (it.kind === "slider") {
    var v = it.get() + (dir > 0 ? it.step : -it.step);
    v = Math.max(it.min, Math.min(it.max, Math.round(v * 100) / 100));
    it.set(v);
    LAB.UI.move();
    say(valueText(it));
    render();
    return true;
  }
  if (it.kind === "choice") { cycle(it, dir > 0 ? 1 : -1); return true; }
  if (it.kind === "toggle") { it.set(dir > 0); LAB.UI.click(); say(itemText(it) + (it.descOf ? ". " + it.descOf(it.get()) : "")); render(); return true; }
  return false;
}
function readAll() {
  var w = top(); if (!w) return;
  say(w.title + ". " + w.items.map(function (it, i) { return (i + 1) + ". " + itemText(it); }).join(". "));
}

/* ════════ ОТРИСОВКА (для зрячих помощников) ════════ */
function render() {
  var box = $("win"), list = $("winList"), tt = $("winTitle");
  if (!box) return;
  var w = top();
  if (!w) { box.hidden = true; return; }
  box.hidden = false;
  tt.textContent = w.title;
  list.innerHTML = "";
  w.items.forEach(function (it, i) {
    var li = document.createElement("li");
    li.textContent = itemText(it);
    if (i === w.i) li.className = "cur";
    if (it.disabled) li.className += " off";
    li.addEventListener("click", function () { w.i = i; render(); activate(); });
    list.appendChild(li);
  });
  var cur = list.children[w.i];
  if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ block: "nearest" }); } catch (e) { /* */ } }
}
function refresh() {
  if (screen !== "game" || !gm() || !gm().entered || !gm().CUR.fl) return;
  var g = G(), w = gm().curWeapon();
  var hp = $("hudHp"), wp = $("hudWeapon"), pl = $("hudPlace");
  if (hp) { hp.textContent = "❤ " + g.hp + "/" + g.hpMax + (g.st.shield ? " 🛡" + g.st.shield : ""); hp.style.color = g.hp < g.hpMax * 0.3 ? "#ff6b6b" : ""; }
  if (wp) wp.textContent = (g.drawn ? "⚔ " : "") + (w ? (w.ammo === "none" ? w.name : w.name + " " + w.charge + "/" + w.cap) : "—");
  if (pl) pl.textContent = "Ур. " + g.L + " · эт. " + g.F + " · " + (gm().roomAt(g.x, g.y) ? gm().roomAt(g.x, g.y).name : "коридор");
  drawMapSoon();
  if (top()) render();
}
/* (2.0) Карта на экране перерисовывается раз за кадр, сколько бы раз её ни
   просили (шаг, попадание, такт), а в облегчённом режиме — не чаще раза в
   полторы секунды: весь этаж — десятки тысяч клеток. */
var mapReq = false, mapAt = 0;
function drawMapSoon() {
  if (mapReq) return;
  mapReq = true;
  var go = function () { mapReq = false; mapAt = Date.now(); if (screen === "game" && gm() && gm().CUR && gm().CUR.fl) LAB.safe(drawMap); };
  var frame = function () { if (window.requestAnimationFrame) window.requestAnimationFrame(go); else setTimeout(go, 16); };
  var wait = S.lite ? 1500 - (Date.now() - mapAt) : 0;
  if (wait > 0) setTimeout(frame, wait); else frame();
}
function drawMap() {
  var cv = $("map");
  if (!cv || !cv.getContext || !gm().CUR.fl) return;
  var CUR = gm().CUR, fl = CUR.fl, W = LAB.W, H = LAB.H;
  var cs = Math.max(4, Math.floor(Math.min(cv.clientWidth || 340, 520) / W));
  if (cv.width !== W * cs) cv.width = W * cs;
  if (cv.height !== H * cs) cv.height = H * cs;
  var c = cv.getContext("2d");
  c.fillStyle = "#06070c"; c.fillRect(0, 0, cv.width, cv.height);
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var i = y * W + x;
    if (!CUR.seen || !CUR.seen[i]) continue;
    var t = fl.t[i];
    if (t === LAB.T.WALL) continue;
    c.fillStyle = t === LAB.T.DOOR ? (CUR.fs.doors[fl.doorAt[i].id] === 2 ? "#3d7" : "#c84") : t === LAB.T.CORR ? "#2a3040" : "#39415a";
    c.fillRect(x * cs, y * cs, cs - 1, cs - 1);
  }
  fl.objs.forEach(function (o) { if (CUR.seen && CUR.seen[o.y * W + o.x]) { c.fillStyle = "#8ab"; c.fillRect(o.x * cs + 1, o.y * cs + 1, cs - 3, cs - 3); } });
  if (LAB.combat) LAB.combat.visibleFoes(12).forEach(function (f) { c.fillStyle = f.calm ? "#999" : "#f44"; c.fillRect(f.x * cs + 1, f.y * cs + 1, cs - 3, cs - 3); });
  c.fillStyle = "#ffd84a"; c.fillRect(G().x * cs, G().y * cs, cs - 1, cs - 1);
}
LAB.showCaption = function (text) {
  var el = $("caption");
  if (!el) return;
  el.textContent = text;
};

/* ════════ ЭКРАНЫ ════════ */
function setScreen(s) {
  screen = s;
  document.body.setAttribute("data-screen", s);
  var hud = $("hud"); if (hud) hud.hidden = s !== "game";
  var pv = $("pageView"); if (pv) pv.hidden = !(s === "prologue" || s === "ending" || s === "boot" || s === "story");
}
function showGame() {
  stack = [];
  page = null;
  setScreen("game");
  render();
  A("music", "game");
  if (LAB.combat) LAB.combat.start();
  refresh();
}

/* Листаемые страницы. */
function showPage(pages, i, opts) {
  page = { pages: pages, i: i, opts: opts || {} };
  var p = pages[i];
  $("pageTitle").textContent = page.opts.title || "";
  $("pageText").textContent = p;
  $("pageHint").textContent = page.opts.hint || "";
  say((i === 0 && page.opts.title ? page.opts.title + ". " : "") + p + (i === pages.length - 1 && page.opts.lastHint ? " " + page.opts.lastHint : ""));
}
function pageGesture(g) {
  if (!page) return false;
  if (g.kind === "swipe" && g.n === 1) {
    if (g.dir === "R") {
      if (page.i < page.pages.length - 1) { LAB.UI.move(); showPage(page.pages, page.i + 1, page.opts); }
      else { var d = page.opts.done; page = null; if (d) d(); }
      return true;
    }
    if (g.dir === "L") { if (page.i > 0) { LAB.UI.move(); showPage(page.pages, page.i - 1, page.opts); } else LAB.UI.error(); return true; }
    if (g.dir === "U" && page.opts.skip !== false) { var d2 = page.opts.done; page = null; LAB.UI.close(); if (d2) d2(); return true; }
  }
  if (g.kind === "tap" || g.kind === "dtap") { showPage(page.pages, page.i, page.opts); return true; }
  if (g.kind === "back") { var d3 = page.opts.done; page = null; if (d3) d3(); return true; }
  return true;
}

/* Пролог. Новая игра всегда начинается с него (newGame — после последней
   страницы или пропуска); из главного меню его можно послушать ещё раз. */
function prologue(mode) {
  var startNew = mode === "new";
  stack = [];
  render();
  setScreen("prologue");
  A("music", "prologue");
  showPage(LAB.PROLOGUE, 0, {
    title: LAB.TITLE + ". Пролог",
    hint: LAB.K("Свайп вправо — дальше, влево — назад, вверх — пропустить.", "Стрелка вправо или Enter — дальше, влево — назад, Escape — пропустить."),
    lastHint: startNew ? LAB.K("Свайп вправо — начать игру.", "Стрелка вправо или Enter — начать игру.") : LAB.K("Свайп вправо — в главное меню.", "Стрелка вправо или Enter — в главное меню."),
    done: function () { LAB.store.set("lab_prologue_seen", "1"); if (startNew) gm().newGame(); else mainMenu(); }
  });
  sayq(LAB.K("Свайп вправо — дальше, влево — назад, вверх — пропустить пролог.", "Стрелка вправо или Enter — дальше, влево — назад, Escape — пропустить пролог."));
}
/* Страницы истории посреди игры: конец и начало блока, сцена у пульта. Мир ждёт. */
function pages(list, opts) {
  opts = opts || {};
  stack = [];
  render();
  setScreen("story");
  if (gm()) gm().paused = true;
  showPage(list, 0, {
    title: opts.title || "",
    hint: LAB.K("Свайп вправо — дальше, влево — назад, вверх — пропустить.", "Стрелка вправо или Enter — дальше, влево — назад, Escape — пропустить."),
    lastHint: LAB.K("Свайп вправо — дальше в игру.", "Стрелка вправо или Enter — дальше в игру."),
    done: function () { if (gm()) gm().paused = false; if (opts.done) opts.done(); else showGame(); }
  });
}

function mainMenu(silentIntro) {
  if (LAB.capsule && LAB.capsule.reset) LAB.safe(LAB.capsule.reset); /* музыка капсулы стихает */
  if (gm() && gm().entered) { gm().autosave(); gm().entered = false; }
  if (gm()) { gm().session = (gm().session || 0) + 1; gm().paused = false; gm().descending = false; }
  LAB.safe(function () { LAB.Speech.later = []; LAB.Speech.held = []; clearTimeout(LAB.Speech.heldTimer); LAB.Speech.heldTimer = null; });
  if (LAB.combat) LAB.combat.stop();
  A("stopWorld");
  stack = [];
  page = null;
  setScreen("menu");
  A("music", "menu");
  $("pageTitle").textContent = LAB.TITLE;
  $("pageText").textContent = LAB.SUBTITLE;
  menu(LAB.TITLE + ". Главное меню", [
    { label: "Начать игру", fn: startGame },
    { label: "Пролог", fn: function () { prologue("menu"); } },
    { label: "Загрузить игру", fn: function () { loadMenu(); } },
    { label: "Руководство", fn: function () { if (LAB.guide) LAB.guide.open(); } },
    { label: "Что нового?", fn: function () { if (LAB.news) LAB.news.open(); } },
    { label: "Настройки", fn: function () { settingsMenu(); } }
  ], { root: true, intro: freshNote(), keep: false });
}
/* Первый запуск новой версии, после которой старые записи стёрты, — сказать об этом один раз;
   (2.0) так же — когда сборка начинает прохождение заново. */
function freshNote() {
  var fs0 = LAB.freshStart, rr = LAB.restartRun;
  if (fs0 && fs0.wiped && !fs0.said) {
    fs0.said = true;
    /* (2.2) сменилась и версия, и прохождение — хватит одного сообщения */
    if (rr) rr.said = true;
    return "Это новая версия игры — " + LAB.VERSION + ". Сохранения прежних версий сброшены: в игре много нового, и её проходят заново, с самого начала. Настройки остались прежними. Что изменилось — пункт «Что нового?».";
  }
  if (rr && rr.wiped && !rr.said) {
    rr.said = true;
    return "В этой сборке игра начинается заново: прежнее прохождение и сохранения сброшены — в комплексе многое изменилось, и пройти его стоит с самого начала, с пролога. Настройки остались прежними. Что изменилось — пункт «Что нового?».";
  }
  /* слабое устройство: один раз подсказать про облегчённый режим */
  if (!S.lite && weakDevice() && !LAB.store.get("lab_lite_hint")) {
    LAB.store.set("lab_lite_hint", "1");
    return (LAB.desktop ? "У этого компьютера" : "У этого телефона") + " немного памяти или ядер процессора. Если игра будет запаздывать, включите облегчённый режим: «Настройки», пункт «Облегчённый режим».";
  }
  return "";
}
/* Слабое устройство: мало памяти (2 ГБ и меньше) или ядер (два и меньше);
   приложение для Android само говорит, что телефон слабый. */
function weakDevice() {
  try {
    if (window.LabTTS && window.LabTTS.lowRam && String(window.LabTTS.lowRam()) === "1") return true;
    var dm = +navigator.deviceMemory || 0, hc = +navigator.hardwareConcurrency || 0;
    return (dm > 0 && dm <= 2) || (hc > 0 && hc <= 2);
  } catch (e) { return false; }
}
/* Облегчённый режим включён или выключен. Что изменилось, окно скажет
   вместе со значением (descOf). */
function liteSet(v) {
  S.lite = v ? 1 : 0; LAB.saveSettings();
  if (LAB.AE.applyLite) LAB.AE.applyLite();
}
function liteDesc(v) {
  /* частота звука выбирается при запуске: устройство уже работает с другой — нужен перезапуск */
  var rate = !!LAB.AE.ctx && LAB.AE.liteCtx !== !!v;
  return v ? "Дальние спокойные машины думают реже, и их шагов издалека не слышно; отзвука помещений нет; звуков одновременно меньше; карта на экране рисуется реже; в памяти меньше готовых этажей. Игра та же: машин столько же, сохранения общие." + (rate ? " Звук станет ещё легче — 22 килогерца, записи в моно — после перезапуска игры." : "")
    : "Полная подробность мира и звука." + (rate ? " Полное качество звука — после перезапуска игры." : "");
}
/* (2.2, просьба игрока) Звук в фоне: что будет, когда вы уйдёте в другое
   окно или приложение. */
function bgDesc(v) {
  if (v) return "Ушли в другое " + (LAB.desktop ? "окно" : "приложение") + " или свернули игру — она ждёт вас, а звук звучит тише" + (LAB.desktop ? "; окно не сворачивается" : "") + ". Вернулись — звук как прежде.";
  return (LAB.desktop ? "Ушли в другое окно — окно игры сворачивается и ждёт вас, звук выключен." : "Свернули игру или ушли в другое приложение — она ждёт вас, звук выключен.") + " Вернулись — звук снова звучит.";
}
function startGame() {
  var hasAuto = !!gm().slotInfo("auto");
  if (hasAuto) {
    menu("Начать новую игру?", [
      { label: "Да, начать сначала. Автозапись заменится, слоты 1, 2 и 3 останутся", fn: function () { prologue("new"); } },
      { label: "Продолжить с автозаписи: " + gm().slotText("auto").replace("Автозапись: ", ""), fn: function () { gm().loadSlot("auto"); } },
      { label: "Отмена", fn: function () { reopenMain(); } }
    ]);
    return;
  }
  prologue("new");
}
function reopenMain() { if (screen === "menu" && !top()) mainMenu(true); else if (top()) say(top().title + ". " + itemText(top().items[top().i])); }

function loadMenu() {
  var keys = ["auto", 1, 2, 3];
  var items = keys.map(function (k) {
    var info = gm().slotInfo(k);
    return { label: gm().slotText(k), disabled: !info, why: "Слот пуст.", fn: function () { if (!gm().loadSlot(k)) reopenMain(); } };
  });
  /* резервные копии: прежнее содержимое слота до последней записи */
  keys.forEach(function (k) {
    var t = gm().slotText(k, true);
    if (t) items.push({ label: t, fn: function () { if (!gm().loadSlot(k, true)) reopenMain(); } });
  });
  menu("Загрузить игру", items.concat([{ label: "Назад", fn: function () { reopenMain(); } }]));
}
function saveMenu() {
  menu("Сохранить игру", [1, 2, 3].map(function (k) {
    return { label: gm().slotText(k), fn: function () {
      if (gm().slotInfo(k)) {
        menu("Перезаписать слот " + k + "?", [
          { label: "Да, записать поверх", fn: function () { gm().saveSlot(k); } },
          { label: "Нет", fn: function () { saveMenu(); } }
        ]);
      } else gm().saveSlot(k);
    } };
  }).concat([{ label: "Назад", fn: function () {} }]));
}

/* ════════ НАСТРОЙКИ ════════ */
function settingsMenu() {
  var Sp = LAB.Speech;
  var ttsOpts = LAB.desktop ?
    [{ v: "auto", label: "Автоматически: голос чтеца экрана или установленный русский синтезатор" }, { v: "system", label: "Голос компьютера, выбранный в списке голосов" }, { v: "espeak", label: "Встроенный eSpeak" }] :
    [{ v: "auto", label: "Автоматически: голос телефона, если он говорит по-русски" }, { v: "system", label: "Системный синтезатор телефона" }, { v: "espeak", label: "Встроенный eSpeak" }];
  var items = [
    { kind: "choice", label: "Синтезатор речи", options: ttsOpts, get: function () { return S.tts; }, set: function (v) { S.tts = v; LAB.saveSettings(); Sp.choose(); } },
    { label: function () { return "Голос синтезатора: " + (S.tts === "espeak" ? "встроенный eSpeak" : S.voice || autoVoiceName()); }, fn: voiceMenu },
    { kind: "slider", label: "Скорость речи", min: 0, max: 100, step: 5, get: function () { return S.ratePct == null ? 50 : +S.ratePct; }, set: function (v) { S.ratePct = v; S.rate = LAB.rateFromPct(v); LAB.saveSettings(); }, fmt: function (v) { return Math.round(v) + " процентов" + (v === 50 ? ", обычная" : ""); } },
    { kind: "choice", label: "Режим сложности", options: (LAB.DIFF_ORDER || [1, 2, 3]).map(function (k) { return { v: k, label: LAB.DIFF[k].n }; }), get: function () { return S.difficulty || 1; }, set: function (v) { S.difficulty = v; LAB.saveSettings(); }, descOf: function (v) { return LAB.DIFF[v] ? LAB.DIFF[v].desc : ""; } },
    vol("Громкость музыки", "musicVol"),
    vol("Громкость звуков", "fxVol"),
    vol("Громкость атмосферы", "ambVol"),
    vol("Громкость маяков", "beaconVol"),
    vol("Громкость речи", "voiceVol"),
    tog("Вибрация", "haptics"),
    tog("Пошаговый режим: враги ходят только после вас", "turnBased"),
    tog("Двери без замка открываются сами", "autoDoors"),
    tog("Читать записки сразу", "autoRead"),
    tog("Голос робота у машин", "robotVoice"),
    tog("Подсказки", "verbose"),
    tog("Субтитры звуков на экране", "subtitles"),
    { kind: "choice", label: LAB.desktop ? "Облегчённый режим для слабых компьютеров" : "Облегчённый режим для слабых телефонов",
      options: [{ v: 0, label: "выключен" }, { v: 1, label: "включён" }],
      get: function () { return S.lite ? 1 : 0; }, set: function (v) { liteSet(v); }, descOf: liteDesc },
    { kind: "toggle", label: "Приглушать звук в фоне", get: function () { return !!S.bgDim; }, set: function (v) { S.bgDim = v ? 1 : 0; LAB.saveSettings(); }, descOf: bgDesc },
    { label: "Микшер: каналы звука, низкие частоты, диапазон громкости", fn: mixerMenu },
    { kind: "choice", label: "Режим навигатора", options: [
        { v: "full", label: "подробный: путь и повороты по шагам" }, { v: "brief", label: "краткий: сколько шагов и куда сначала" },
        { v: "beacon", label: "по звуку: маяк навигатора впереди на пути" }, { v: "free", label: "свободный: путь только по запросу" }],
      get: function () { return S.navMode || "full"; }, set: function (v) { S.navMode = v; LAB.saveSettings(); if (gm() && gm().navStop) gm().navStop(); } },
    { kind: "choice", label: "Частота подсказок", options: [{ v: 0, label: "только по запросу" }, { v: 1, label: "редко" }, { v: 2, label: "обычно" }, { v: 3, label: "часто" }],
      get: function () { return S.hints == null ? 2 : +S.hints; }, set: function (v) { S.hints = v; LAB.saveSettings(); },
      descOf: function (v) { return ["Сами подсказки молчат: всё — по запросу и в руководстве.", "Подсказки — только о новом, напоминаний почти нет.", "Подсказки о новом и редкие напоминания, если вы долго стоите.", "Подсказки о новом, о том, как пользоваться окнами, и частые напоминания."][v] || ""; } },
    tog("Обучение: подсказки шагов", "tutor"),
    { label: "Обучение: повторить последнюю подсказку", keep: true, fn: function () { if (LAB.tutor && gm() && gm().entered) LAB.tutor.repeat(); else say("Обучение идёт в игре: подсказки звучат, когда встречаете новое."); } },
    { label: "Обучение: начать заново", keep: true, fn: function () { if (LAB.tutor && gm() && gm().entered) LAB.tutor.reset(); else say("Начните игру: обучение идёт в ней."); } },
    { kind: "choice", label: "Уведомление об автозаписи", options: [{ v: 0, label: "без уведомления" }, { v: 1, label: "мягкий звук" }, { v: 2, label: "звук и голос" }],
      get: function () { return S.saveNote == null ? 1 : +S.saveNote; }, set: function (v) { S.saveNote = v; LAB.saveSettings(); } },
    { label: "Назад", fn: function () { if (screen === "menu") reopenMain(); } }
  ];
  menu("Настройки", items, { intro: LAB.K("Свайп вверх и вниз меняет значение.", "Стрелки вправо и влево меняют значение.") });
}
/* Микшер: каналы громкости, низкие частоты, динамический диапазон. */
function mixerMenu() {
  var items = [
    vol("Речь", "voiceVol"),
    vol("Окружение: фон уровня и помещений", "ambVol"),
    vol("Интерфейс: окна и сигналы", "uiVol"),
    vol("Сигналы головоломок: тоны взлома, реле, замков — на время головоломки музыка и фон стихают", "puzzleVol"),
    vol("Оружие: ваши выстрелы и удары", "weapVol"),
    vol("Противники: роботы, твари, турели, камеры", "foeVol"),
    vol("Музыка", "musicVol"),
    vol("Тревоги и сирены", "alarmVol"),
    vol("Маяки предметов", "beaconVol"),
    { kind: "slider", label: "Пространственные эффекты: отзвук помещений", min: 0, max: 1.5, step: 0.1, get: function () { return S.spaceVol == null ? 1 : +S.spaceVol; }, set: function (v) { S.spaceVol = Math.round(v * 10) / 10; LAB.saveSettings(); LAB.AE.applyVolumes(); }, fmt: function (v) { return Math.round(v * 100) + " процентов" + (Math.round(v * 10) === 10 ? ", как задумано" : v === 0 ? ", сухо" : ""); } },
    vol("Все звуковые эффекты вместе", "fxVol"),
    { kind: "slider", label: "Низкие частоты", min: -12, max: 9, step: 3, get: function () { return +S.bass || 0; }, set: function (v) { S.bass = v; LAB.saveSettings(); if (LAB.AE.applyMix) LAB.AE.applyMix(); }, fmt: function (v) { return v === 0 ? "как записано" : (v > 0 ? "плюс " : "минус ") + Math.abs(v) + " децибел"; } },
    { kind: "choice", label: "Динамический диапазон", options: [{ v: 0, label: "широкий: громкое громче, тихое тише" }, { v: 1, label: "обычный" }, { v: 2, label: "сжатый: тихое слышно, громкое не оглушает — для наушников и тихой игры" }],
      get: function () { return S.drc == null ? 1 : +S.drc; }, set: function (v) { S.drc = v; LAB.saveSettings(); if (LAB.AE.applyMix) LAB.AE.applyMix(); } },
    { label: "Назад", fn: settingsMenu }
  ];
  menu("Микшер", items, { intro: "Речь, интерфейс и маяки идут мимо низких частот: бас не закрывает слова и сигналы. " + LAB.K("Свайп вверх и вниз меняет значение.", "Стрелки вправо и влево меняют значение.") });
}
function vol(label, key) {
  return { kind: "slider", label: label, min: 0, max: 1, step: 0.05, get: function () { return S[key] == null ? 1 : +S[key]; }, set: function (v) { S[key] = v; LAB.saveSettings(); LAB.AE.applyVolumes(); if (key === "fxVol" || key === "uiVol") LAB.UI.blip(700, 0.06, 0.1); if (key === "musicVol" && LAB.atmos) A("musicVolume"); }, fmt: function (v) { return Math.round(v * 100) + " процентов"; } };
}
function tog(label, key) {
  return { kind: "toggle", label: label, get: function () { return !!S[key]; }, set: function (v) { S[key] = v ? 1 : 0; LAB.saveSettings(); LAB.AE.applyVolumes(); } };
}
function autoVoiceName() {
  var a = LAB.Speech.listVoices().filter(function (v) { return v.auto; })[0];
  return a ? "сам выбирается — " + a.name : "по умолчанию";
}
function voiceMenu() {
  var vs = LAB.Speech.listVoices();
  if (LAB.desktop) { desktopVoiceMenu(vs); return; }
  var ru = vs.filter(function (v) { return /^ru/i.test(v.lang); });
  var list = (ru.length ? ru : vs).slice(0, 60);
  if (!list.length) { say("Голосов телефона не найдено. Игра говорит встроенным eSpeak."); settingsMenu(); return; }
  menu("Голос синтезатора", list.map(function (v) {
    return { label: v.name, fn: function () { LAB.Speech.setVoice(v.id); setTimeout(function () { say("Так звучит этот голос. Подземная лаборатория."); settingsMenu(); }, 200); } };
  }).concat([{ label: "Назад", fn: settingsMenu }]));
}
/* Компьютер: все голоса, что стоят у игрока, — голос NVDA, голос JAWS,
   RHVoice и eSpeak NG из NVDA, сторонние голоса SAPI 5. Голосов Microsoft
   нет. Сначала русские, потом остальные; в конце — встроенный eSpeak и
   «Перечитать голоса компьютера» (запустили NVDA или поставили синтезатор). */
function desktopVoiceMenu(vs, focus) {
  var ru = vs.filter(function (v) { return /^ru/i.test(v.lang); }), other = vs.filter(function (v) { return !/^ru/i.test(v.lang); });
  var pick = function (v) {
    S.tts = "system"; LAB.saveSettings();
    LAB.Speech.setVoice(v.id);
    setTimeout(function () { say("Так звучит этот голос. Подземная лаборатория."); settingsMenu(); }, 250);
  };
  var items = ru.concat(other).slice(0, 300).map(function (v) {
    var cur = S.tts !== "espeak" && (S.voice ? S.voice === v.id : v.auto);
    return { label: v.name + (v.engine ? ", " + v.engine : "") + (/^ru/i.test(v.lang) ? "" : ", язык " + v.lang) + (cur ? " — сейчас говорит" : ""), fn: function () { pick(v); } };
  });
  if (!vs.length) items.push({ label: "Голосов компьютера не найдено: нет NVDA, JAWS и сторонних синтезаторов. Игра говорит встроенным eSpeak.", info: true, keep: true, fn: function () { say(LAB.desktop && window.LabDesktop && window.LabDesktop.ttsDiag ? "Почему: " + window.LabDesktop.ttsDiag() : "Голосов нет."); } });
  items.push({ label: "Встроенный eSpeak NG — идёт вместе с игрой" + (S.tts === "espeak" ? " — сейчас говорит" : ""), fn: function () { S.tts = "espeak"; LAB.saveSettings(); LAB.Speech.choose(); setTimeout(function () { say("Так звучит встроенный eSpeak. Подземная лаборатория."); settingsMenu(); }, 250); } });
  items.push({ label: "Выбирать голос самому: сначала голос запущенного чтеца экрана, NVDA или JAWS", fn: function () {
    S.tts = "auto"; S.voice = ""; LAB.saveSettings();
    /* пустое имя — голос выбирается сам и дальше: запустят NVDA или JAWS — заговорит он */
    if (window.LabTTS && window.LabTTS.setVoice) { try { window.LabTTS.setVoice(""); } catch (e) { /* */ } }
    LAB.Speech.choose(); setTimeout(function () { say("Голос выбирается сам. Сейчас: " + autoVoiceName().replace("сам выбирается — ", "") + "."); settingsMenu(); }, 250); } });
  items.push({ label: "Перечитать голоса компьютера", fn: function () {
    var D = window.LabDesktop;
    if (!D || !D.ttsRestart) { desktopVoiceMenu(LAB.Speech.listVoices()); return; }
    say("Ищу голоса компьютера…");
    D.ttsRestart().then(function (r) {
      setTimeout(function () {
        LAB.Speech.refreshBridge();
        var list = LAB.Speech.listVoices();
        say("Голосов найдено: " + list.length + "." + (r && r.ready ? "" : " Почему мало: " + (r && r.diag || "")));
        desktopVoiceMenu(list);
      }, 600);
    }).catch(function () { desktopVoiceMenu(LAB.Speech.listVoices()); });
  } });
  items.push({ label: "Назад", fn: settingsMenu });
  menu("Голоса компьютера: " + vs.length, items, { focus: focus || 0 });
}

/* ════════ ОКНО ПЕРСОНАЖА (три пальца вверх) ════════ */
function character() {
  if (!gm().entered) return;
  var lines = gm().characterText();
  var items = lines.map(function (t) { return { label: t, keep: true, fn: function () { say(t); } }; });
  items.push({ label: "Сохранить игру", fn: saveMenu });
  items.push({ label: "Настройки", fn: settingsMenu });
  items.push({ label: "Руководство", fn: function () { if (LAB.guide) LAB.guide.open(); } });
  if (LAB.tutor) items.push({ label: "Обучение: повторить подсказку. " + LAB.tutor.progress(), keep: true, fn: function () { LAB.tutor.repeat(); } });
  items.push({ label: "Выход", fn: exitMenu });
  menu("Персонаж", items);
}
function exitMenu() {
  var items = [{ label: "Выйти в главное меню. Игра сохранится в автозапись", fn: function () { gm().autosave(); mainMenu(); } }];
  if (window.LabTTS && window.LabTTS.exitApp) items.push({ label: "Закрыть приложение. Игра сохранится в автозапись", fn: function () { gm().autosave(); try { window.LabTTS.exitApp(); } catch (e) { /* */ } } });
  items.push({ label: "Отмена", fn: function () {} });
  menu("Выход", items);
}

/* ════════ ИНВЕНТАРЬ (три пальца вниз) ════════ */
function inventory(focus) {
  if (!gm().entered) return;
  var g = G();
  var cnt = function (ids) { return ids.reduce(function (a, k) { return a + (g.inv[k] || 0); }, 0); };
  var ammoN = Object.keys(g.ammo).reduce(function (a, k) { return a + (g.ammo[k] || 0); }, 0);
  var items = [
    { label: "Оружие: " + g.weapons.length, fn: weaponsMenu },
    { label: "Батареи и боеприпасы: " + ammoN, fn: ammoMenu },
    { label: "Аптечки и лекарства: " + cnt(medIds()), fn: medsMenu },
    { label: "Еда и напитки: " + cnt(foodIds()), fn: foodMenu },
    { label: "Броня и комбинезоны: " + g.armors.length + (g.armor ? ", надета" : ", не надета"), fn: armorMenu },
    { label: "Гранаты, пластины и устройства: " + cnt(gadgetIds()), fn: gadgetsMenu },
    { label: "Ловушки и мины: " + (LAB.traps ? LAB.traps.count() : 0), fn: function () { if (LAB.traps) LAB.traps.menu(); } },
    { label: "Защита и инструменты: " + cnt(catIds("protect").concat(catIds("tool"))), fn: toolsMenu },
    { label: "Ценности: " + cnt(catIds("valuable")), fn: valuablesMenu },
    { label: "Детали: " + cnt(LAB.PARTS), fn: partsMenu },
    { label: "Модули оружия в запасе: " + cnt(modIds()), fn: modsMenu },
    { label: "Пропуска и ключи", fn: passesMenu },
    { label: "Архив документов: " + g.noteList.length, fn: notesMenu },
    { label: "Задания: " + g.quests.filter(function (q) { return !q.done; }).length, fn: questsMenu },
    { label: "Журнал", fn: journalMenu },
    { label: "Достижения" + (LAB.ach && g.ach ? ": " + Object.keys(g.ach.d || {}).length + " из " + LAB.ach.LIST.length : ""), fn: function () { if (LAB.ach) LAB.ach.menu(); } },
    { label: "Импланты: " + g.implants.length + ", образцы: " + Object.keys(g.samples).length, fn: implants },
    { label: "Кредиты: " + g.credits, info: true, keep: true, fn: function () { say("Кредиты: " + g.credits + ". Тратятся в торговых терминалах и у выживших."); } }
  ];
  /* focus — номер пункта или начало его названия («Задания») */
  if (typeof focus === "string") { var fi = -1; items.forEach(function (it, i) { if (fi < 0 && it.label.indexOf(focus) === 0) fi = i; }); focus = fi < 0 ? 0 : fi; }
  menu("Инвентарь", items, { focus: focus || 0 });
}
function back(fn) { return { label: "Назад", fn: fn || function () { inventory(); } }; }
function weaponsMenu() {
  var g = G();
  menu("Оружие", g.weapons.map(function (w, i) {
    return { label: gm().weaponLine(w) + (i === g.wi ? " — в руках" : ""), fn: function () { weaponMenu(i); } };
  }).concat([back()]));
}
function weaponMenu(i) {
  var g = G(), w = g.weapons[i];
  if (!w) return;
  var d = LAB.WEAPONS[w.base];
  menu(w.name, [
    { label: i === g.wi ? "Уже в руках" : "Взять в руки", fn: function () { gm().equipWeapon(i); } },
    { label: "Осмотреть", fn: function () {
      var Wk = LAB.workshop, ml = Wk ? Wk.modsLine(w) : "";
      var pf = Wk ? Wk.profile(w) : "";
      say(w.name + ". " + d.desc + " Урон " + LAB.weaponDmg(w) + " (" + LAB.DTYPE_N[w.dt] + ")" + (w.cap ? ", заряд " + w.charge + " из " + w.cap : "") + ". " + (Wk ? pf.charAt(0).toUpperCase() + pf.slice(1) + " Состояние " + Math.round(Wk.cond(w)) + " из 100. " + (ml ? "Модули: " + ml + ". " : "") + "Гнёзд для модулей: " + Wk.slots(w) + ", занято " + Wk.used(w) + ". " : "Дальность " + w.rng + ". ") + LAB.RANKS[w.rank] + ".");
      weaponMenu(i); } },
    { label: "Разобрать на детали", fn: function () { gm().scrapWeapon(i); weaponsMenu(); } },
    back(weaponsMenu)
  ]);
}
function ammoMenu() {
  var g = G(), w = gm().curWeapon();
  var kinds = ["energy", "magnetron", "positron"];
  Object.keys(g.ammo).forEach(function (k) { if (kinds.indexOf(k) < 0 && LAB.AMMO[k] && (g.ammo[k] > 0 || (w && w.ammo === k))) kinds.push(k); });
  var items = kinds.map(function (k) {
    return { label: LAB.AMMO[k].n + ": " + (g.ammo[k] || 0), fn: function () {
      if (w && w.ammo === k) gm().reload(); else say(LAB.AMMO[k].desc);
    } };
  });
  items.push(back());
  menu("Батареи и боеприпасы", items, { intro: w && w.ammo !== "none" ? LAB.K("Двойное касание на нужной батарее — перезарядить оружие в руках.", "Enter на нужной батарее — перезарядить оружие в руках.") : "" });
}
var MEDS = ["medkit_s", "medkit_l", "bandage", "antidote", "sorbent", "stim", "energy_d", "neuroblock"];
/* Вещи одного раздела (1.5): лекарства, защита, инструменты, ценности — по полю cat. */
function catIds(cat) { return Object.keys(LAB.ITEMS).filter(function (k) { return LAB.ITEMS[k].cat === cat; }); }
/* Лекарства: прежние — всегда в списке, новые — только те, что есть с собой. */
function medIds() { var g = G(); return MEDS.concat(catIds("med").filter(function (k) { return MEDS.indexOf(k) < 0 && g.inv[k] > 0; })); }
function medsMenu() {
  var g = G();
  menu("Аптечки и лекарства", medIds().map(function (k) {
    return { label: LAB.ITEMS[k].n + ": " + (g.inv[k] || 0) + ". " + LAB.ITEMS[k].desc, fn: function () { if (gm().useItem(k)) {} } };
  }).concat([{ label: "Состояние тела", keep: true, fn: function () { gm().bodyStatus(); } }, back()]));
}
/* Защита (респираторы, изолента) и инструменты (дозиметр, кусачки, набор): инструменты не тратятся. */
function toolsMenu() {
  var g = G();
  var items = catIds("protect").concat(catIds("tool")).filter(function (k) { return g.inv[k] > 0; }).map(function (k) {
    var d = LAB.ITEMS[k];
    return { label: d.n + ": " + g.inv[k] + ". " + d.desc, fn: function () { gm().useItem(k); } };
  });
  if (!items.length) items.push({ label: "Ничего нет. Респираторы, изоленту, дозиметры и инструменты продают пункты снабжения; их собирают у верстака и находят в кабинетах.", info: true, keep: true, fn: function () {} });
  items.push(back());
  menu("Защита и инструменты", items);
}
/* Ценности: часы, кольца, слитки, носители — их скупают пункты снабжения, торговые терминалы и выжившие. */
function valuablesMenu() {
  var g = G(), tot = 0;
  var items = catIds("valuable").filter(function (k) { return g.inv[k] > 0; }).map(function (k) {
    var d = LAB.ITEMS[k], p = LAB.sellPrice ? LAB.sellPrice.item(k, { who: "supply" }) : Math.round(d.price * 0.7);
    tot += p * g.inv[k];
    return { label: d.n + ": " + g.inv[k] + ". Скупка — около " + p + " за штуку. " + d.desc, keep: true, fn: function () { gm().useItem(k); } };
  });
  if (!items.length) items.push({ label: "Ценностей нет. Их находят в кабинетах, сейфах и тайниках, а продают в пунктах снабжения.", info: true, keep: true, fn: function () {} });
  items.push(back());
  menu("Ценности", items, { intro: tot ? "Всё вместе стоит около " + tot + " кредитов." : "" });
}
function foodIds() { return Object.keys(LAB.ITEMS).filter(function (k) { return LAB.ITEMS[k].kind === "food"; }); }
/* Еда в рюкзаке: съесть; вверху — сколько сытости и энергии. */
function foodMenu() {
  var g = G(), b = g.body || { food: 0 };
  var items = foodIds().filter(function (k) { return g.inv[k] > 0; }).map(function (k) {
    return { label: LAB.ITEMS[k].n + ": " + g.inv[k] + ". " + LAB.ITEMS[k].desc, fn: function () { gm().useItem(k); } };
  });
  if (!items.length) items.push({ label: "Еды нет. Её продают автоматы с едой и повара; бывает она на кухнях и в столовых.", info: true, keep: true, fn: function () {} });
  items.push(back());
  menu("Еда и напитки", items, { intro: "Сытость " + Math.round(b.food) + " из 100, энергия имплантов " + g.en + " из " + g.enMax + "." });
}
function armorMenu() {
  var g = G();
  var items = g.armors.map(function (a, i) {
    var on = g.armor && g.armor.id === a.id;
    return { label: gm().armorLine(a) + (on ? " — надета" : ""), fn: function () { armorItem(i); } };
  });
  if (!items.length) items.push({ label: "Брони нет. Её находят, покупают в торговых терминалах и собирают в мастерской.", info: true, keep: true, fn: function () {} });
  if (g.armor) items.push({ label: "Вставить бронепластину в надетую броню: пластин " + (g.inv.plate || 0), fn: function () { gm().installPlate(); armorMenu(); } });
  items.push(back());
  menu("Броня", items);
}
function armorItem(i) {
  var g = G(), a = g.armors[i];
  if (!a) return;
  var on = g.armor && g.armor.id === a.id;
  var d = LAB.ARMORS[a.base];
  menu(a.name, [
    on ? { label: "Снять", fn: function () { gm().removeArmor(); armorMenu(); } } : { label: "Надеть", fn: function () { gm().equipArmor(i); armorMenu(); } },
    { label: "Осмотреть", fn: function () { say(gm().armorLine(a) + ". " + d.desc); armorItem(i); } },
    { label: "Разобрать на детали", fn: function () { gm().scrapArmor(i); armorMenu(); } },
    back(armorMenu)
  ]);
}
/* Устройства: гранаты, пластины, самоделки мастерской и вещи блоков. */
function gadgetIds() {
  var ids = ["emp", "plate", "decoder", "fieldkit", "wrepair", "repairkit", "engkit", "noise", "turret_kit", "jammer", "lockpick", "filter", "sonar", "okokey", "decoy_e", "disruptor", "turret_kit2"];
  for (var k in LAB.ITEMS) { var d = LAB.ITEMS[k]; if (d.kind !== "part" && !d.cat && d.depth && ids.indexOf(k) < 0) ids.push(k); }
  return ids;
}
function gadgetsMenu() {
  var g = G();
  var items = [
    { label: "ЭМИ-граната: " + (g.inv.emp || 0) + ". Бросить вперёд по последнему направлению", fn: function () { if (LAB.combat) LAB.combat.throwEmp(); } },
    { label: "Бронепластина: " + (g.inv.plate || 0) + ". Вставить в надетую броню", fn: function () { gm().installPlate(); } },
    { label: "Декодер пропусков: " + (g.inv.decoder || 0), keep: true, fn: function () { say(LAB.ITEMS.decoder.desc + LAB.K(" Применяется у двери: двойное касание у двери.", " Применяется у двери: Enter у двери.")); } }
  ];
  gadgetIds().slice(3).forEach(function (k) {
    var d = LAB.ITEMS[k];
    if (!d || !(g.inv[k] > 0)) return;
    var kit = LAB.repair && LAB.repair.isKit(k);
    var verb = kit ? "Починить" : d.kind === "throw" ? "Бросить вперёд" : d.kind === "deploy" ? "Поставить впереди" : d.fx && d.fx.pick ? "Применяется у двери" : k === "okokey" ? "Применяется у турели и на терминале безопасности" : "Применить";
    items.push({ label: d.n + ": " + (kit ? LAB.repair.countText(k) : g.inv[k]) + ". " + verb + ". " + d.desc, fn: function () { gm().useItem(k); } });
  });
  items.push(back());
  menu("Гранаты, пластины и устройства", items);
}
function partsMenu() {
  var g = G();
  var items = LAB.PARTS.filter(function (k) { return g.inv[k] > 0; }).map(function (k) {
    var line = LAB.workshop ? LAB.workshop.partLine(k) : LAB.ITEMS[k].n + ": " + g.inv[k];
    return { label: line, keep: true, fn: function () { say(LAB.ITEMS[k].desc + " " + line); } };
  });
  if (!items.length) items.push({ label: "Деталей нет. Ищите в ящиках, у роботов и на полу.", keep: true, fn: function () {} });
  if (LAB.workshop) items.push({ label: "Все детали этой глубины: где найти и для чего", fn: function () { LAB.workshop.partsGuide(); } });
  items.push(back());
  menu("Детали", items);
}
/* Запасные модули оружия: ставятся у верстака. */
function modIds() { return Object.keys(LAB.ITEMS).filter(function (k) { return LAB.ITEMS[k].kind === "wmodule"; }); }
function modsMenu() {
  var g = G();
  var items = modIds().filter(function (k) { return g.inv[k] > 0; }).map(function (k) {
    return { label: LAB.ITEMS[k].n + ": " + g.inv[k] + ". " + LAB.ITEMS[k].desc, keep: true, fn: function () { say(LAB.ITEMS[k].desc); } };
  });
  if (!items.length) items.push({ label: "Запасных модулей нет. Их собирают у верстака, раздел «Модули оружия», и снимают с оружия.", info: true, keep: true, fn: function () {} });
  items.push(back());
  menu("Модули оружия в запасе", items);
}
function passesMenu() {
  var g = G(), items = [];
  items.push({ label: "Пропуск доступа: " + (g.tier ? LAB.TIERS[g.tier].n : "нет"), keep: true, fn: function () { say(g.tier ? LAB.TIERS[g.tier].n + ": открывает двери с картридером этого цвета и ниже." : "Пропуска нет."); } });
  items.push({ label: "Пропуск лифта этажей уровня " + g.L + ": " + (g.elev[g.L] ? "есть" : "нет"), keep: true, fn: function () { say(g.elev[g.L] ? "Лифт этажей уровня " + g.L + " вас повезёт." : "Пропуск лифта лежит на втором этаже уровня."); } });
  if (!LAB.isReactorLevel(g.L)) items.push({ label: "Шлюзовая ключ-карта уровня " + g.L + ": " + (g.gate[g.L] ? "есть" : "нет"), keep: true, fn: function () { say(g.gate[g.L] ? "Гермошлюз на последнем этаже уровня откроется. Пройти можно только вниз." : "Ключ-карта — на последнем этаже уровня, у шлюза: у стража или спрятана."); } });
  else items.push({ label: "Ключ доступа к реактору «Исток»: " + (gm().hasCore(g.L) ? "есть" : "нет"), keep: true, fn: function () {} });
  Object.keys(g.keys).forEach(function (k) { items.push({ label: g.keys[k], keep: true, fn: function () { say(g.keys[k] + "."); } }); });
  var codes = Object.keys(g.codes);
  if (codes.length) items.push({ label: "Известные коды: " + codes.length, keep: true, fn: function () { say(codes.map(function (c) { return "«" + g.codes[c] + "» — " + c.split("").join(" "); }).join("; ") + "."); } });
  items.push(back());
  menu("Пропуска и ключи", items);
}
/* ── АРХИВ ДОКУМЕНТОВ: всё найденное, с поиском ── */
function docLabel(n, d) {
  return "«" + d.t + "»" + (d.a ? ", " + d.a : "") + ". " + d.cat + ". " + (d.dname ? d.dname + ", " : "") + "уровень " + n.L + ", этаж " + n.F + (d.pl ? ", " + d.pl : "");
}
function openDoc(n, back) {
  var d = gm().docInfo(n), links = docLinks(n, d);
  G().lastDoc = n.id;
  note(d.t, (d.a ? d.a.charAt(0).toUpperCase() + d.a.slice(1) + ". " : "") + d.x + (links.length ? " Связанных документов в архиве: " + links.length + "." : ""), back, {
    extra: links.map(function (l) { return { label: "Связано: «" + l.d.t + "»" + (l.d.a ? ", " + l.d.a : ""), fn: function () { LAB.Speech.endNote(); openDoc(l.n, back); } }; })
  });
}
/* Перекрёстные ссылки: документы архива, чьих авторов упоминает этот,
   и те, где упомянут его автор (по основе фамилии: «Лыков» — «Лыкова»). */
function surStem(a) {
  var w = String(a || "").trim().split(/\s+/).pop() || "";
  if (!/^[А-ЯЁ][а-яё]{3,}$/.test(w)) return "";
  return w.slice(0, Math.max(4, w.length - 2));
}
function mentions(text, stem) { return !!stem && new RegExp("(^|[^А-Яа-яЁё])" + stem).test(String(text || "")); }
function docLinks(n, d) {
  var my = surStem(d.a), out = [];
  G().noteList.forEach(function (m) {
    if (m === n || m.id === n.id || out.length >= 4) return;
    var e = gm().docInfo(m), st = surStem(e.a);
    if (st === my) return; /* того же автора ищут «по автору» */
    if ((st && mentions(d.x, st)) || (my && mentions(e.x, my))) out.push({ n: m, d: e });
  });
  return out;
}
function docListMenu(title, list, back) {
  var items = list.slice().reverse().map(function (n) {
    var d = gm().docInfo(n);
    return { label: docLabel(n, d), fn: function () { openDoc(n, function () { docListMenu(title, list, back); }); } };
  });
  if (!items.length) items.push({ label: "Документов нет.", keep: true, fn: function () {} });
  items.push({ label: "Назад", fn: function () { (back || notesMenu)(); } });
  menu(title + ": " + list.length, items);
}
/* Сгруппировать по признаку: глубина, категория, автор, первая буква. */
function docGroups(title, keyOf) {
  var g = G(), groups = {}, order = [];
  g.noteList.forEach(function (n) {
    var k = keyOf(n, gm().docInfo(n)) || "без пометки";
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(n);
  });
  order.sort(function (a, b) { return a.localeCompare(b, "ru"); });
  menu(title, order.map(function (k) {
    return { label: k + ": " + groups[k].length, fn: function () { docListMenu(k, groups[k], function () { docGroups(title, keyOf); }); } };
  }).concat([{ label: "Назад", fn: function () { notesMenu(); } }]));
}
function notesMenu() {
  var g = G(), last = g.lastDoc && g.noteList.filter(function (n) { return n.id === g.lastDoc; })[0];
  var items = [
    { label: "Все документы, новые сверху: " + g.noteList.length, fn: function () { docListMenu("Все документы", g.noteList, notesMenu); } },
    { label: "По глубине", fn: function () { docGroups("Документы по глубине", function (n, d) { return d.dname || "«Ковчег»"; }); } },
    { label: "По категории", fn: function () { docGroups("Документы по категории", function (n, d) { return d.cat; }); } },
    { label: "По автору", fn: function () { docGroups("Документы по автору", function (n, d) { return d.a ? d.a.split(",")[0] : "без подписи"; }); } },
    { label: "По первой букве названия", fn: function () { docGroups("Документы по первой букве", function (n, d) { var c = String(d.t || "").replace(/^[«"„\s]+/, "").charAt(0).toUpperCase(); return c ? "на «" + c + "»" : ""; }); } }
  ];
  if (last) items.push({ label: "Прослушать снова: «" + gm().docInfo(last).t + "»", fn: function () { openDoc(last, notesMenu); } });
  if (!g.noteList.length) items = [{ label: "Документов пока нет. Записки, письма и журналы, которые вы найдёте, попадут сюда.", keep: true, fn: function () {} }];
  items.push(back());
  menu("Архив документов", items);
}
function questsMenu() {
  var g = G();
  var items = g.quests.filter(function (q) { return !q.done; }).map(function (q) {
    return { label: (q.type === "main" ? "Главное: " + q.text : q.short + " — " + gm().questProgress(q) + ". Заказчик: " + q.giverName + ", уровень " + q.L + ", этаж " + q.F), keep: true, fn: function () { say(q.text || q.short); } };
  });
  if (!items.length) items.push({ label: "Заданий нет.", keep: true, fn: function () {} });
  items.push(back());
  menu("Задания", items);
}
function journalMenu() {
  var g = G();
  var items = g.journal.slice(0, 40).map(function (t) { return { label: t, keep: true, fn: function () { say(t); } }; });
  if (!items.length) items.push({ label: "Журнал пуст.", keep: true, fn: function () {} });
  items.push(back());
  menu("Журнал", items);
}
/* Окно записки: пока оно открыто, мир ждёт, и текст дочитывается до конца,
   если игрок его не трогает. Свайп вправо и влево (стрелки на компьютере) —
   по абзацам: общее чтение обрывается, звучит выбранный абзац. «Закрыть» или
   два пальца вниз — назад.
   На компьютере — окно-диалог: Escape закрывает его, и чтение обрывается. */
function note(title, text, after, opts) {
  opts = opts || {};
  var parts = String(text).match(/[^.!?…]+[.!?…»]*/g) || [text];
  var paras = [], curp = "";
  parts.forEach(function (p) { if ((curp + p).length > 220 && curp) { paras.push(curp.trim()); curp = p; } else curp += p; });
  if (curp.trim()) paras.push(curp.trim());
  var items = paras.map(function (p) { return { label: p, keep: true, fn: function () { say(p); } }; });
  if (opts.extra) items = items.concat(opts.extra);
  items.push({ label: opts.closeLabel || "Закрыть", fn: function () { LAB.Speech.endNote(); if (after) after(); else if (!top() && screen === "game") say("Игра."); } });
  A("play", "paper");
  var w = menu(title, items, { silent: true });
  if (w) w.note = true;
  say(title + ". " + text, { interrupt: !opts.queue, read: true, note: true });
}

/* ════════ МАСТЕРСКАЯ ════════ */
/* Окно мастерской, рецепты, ремонт и разбор — workshop.js. */
function craft(o) { if (LAB.workshop) LAB.workshop.open(o); }

/* ════════ ИМПЛАНТЫ (четыре пальца, двойное касание) ════════ */
function implants() {
  if (!gm().entered) return;
  var g = G(), IM = LAB.implants;
  /* (2.0) сначала импланты, которые применяют; потом чипы — работают сами */
  var act = g.implants.filter(function (id) { return !(IM && IM.isChip(id)); }), pas = g.implants.filter(function (id) { return IM && IM.isChip(id); });
  var items = act.map(function (id) {
    var d = gm().implantDef(id), tg = IM ? IM.tag(id) : "";
    return { label: d.n + (tg ? ", " + tg : "") + ", " + gm().implantCost(id) + " энергии. " + d.desc, fn: function () { if (LAB.combat) LAB.combat.useImplant(id); } };
  });
  pas.forEach(function (id) { items.push({ label: "Чип: " + IM.line(id) + " Работает сам.", keep: true, fn: function () { say(IM.line(id)); } }); });
  /* чипы в рюкзаке: вживить; лишние — продать или разобрать у верстака */
  if (IM) IM.chips().forEach(function (k) {
    var it = LAB.ITEMS[k], dup = g.implants.indexOf(it.implant) >= 0;
    items.push({ label: it.n + " в рюкзаке: " + g.inv[k] + ". " + (dup ? "Такой уже вживлён — продать или разобрать у верстака" : "Вживить"), fn: function () { gm().useItem(k); } });
  });
  items.push({ label: "Энергия: " + g.en + " из " + g.enMax, keep: true, fn: function () { say("Энергия имплантов " + g.en + " из " + g.enMax + ". Понемногу восстанавливается сама, если вы сыты и нервы не перегружены. Образцы «Колыбели» расширяют запас."); } });
  if (IM) items.push({ label: IM.cyberText(), fn: function () { IM.cyberMenu(); } });
  menu("Импланты", items);
}

/* ════════ НАВИГАТОР: список целей (три пальца вправо) ════════ */
function navMenu() { if (gm().entered) gm().navigate(false); }

/* ════════ ФИНАЛ ════════ */
function ending(win) {
  stack = [];
  render();
  setScreen("ending");
  if (LAB.combat) LAB.combat.stop();
  A("stopWorld");
  A("music", "ending");
  var g = G();
  var mins = Math.round((g.stats.ms + Date.now() - (gm().t0 || Date.now())) / 60000);
  var stats = "Итоги. В игре " + Math.floor(mins / 60) + " ч " + (mins % 60) + " мин. Уровень героя " + g.lvl + ". Побеждено врагов " + g.stats.kills + ". Тайников " + g.stats.secrets + ". Записок " + g.stats.notes + ". Образцов " + Object.keys(g.samples).length + ". Гибелей " + g.stats.deaths + ". Режим сложности: " + LAB.dk().n.toLowerCase() + ".";
  /* как вы прошли пять глубин — страница перед итогами */
  var epi = LAB.depths && LAB.depths.epilogue ? LAB.depths.epilogue() : "";
  var pages = LAB.ENDING.concat(epi ? [epi] : [], [stats, LAB.CREDITS_TEXT || "Конец. Спасибо, что слушали."]);
  showPage(pages, 0, {
    title: "Финал", skip: false,
    hint: LAB.K("Свайп вправо — дальше, влево — назад.", "Стрелка вправо или Enter — дальше, влево — назад."),
    lastHint: LAB.K("Свайп вправо — в главное меню.", "Стрелка вправо или Enter — в главное меню."),
    done: function () { mainMenu(); }
  });
}

/* ════════ БАННЕР УРОВНЯ ════════ */
function levelBanner() {
  var b = $("banner"); if (!b) return;
  var lev = LAB.LEVELS[G().L], B = G().L > 10 ? LAB.BLOCKS[LAB.blockOf(G().L)] : null;
  b.textContent = (B && B.name ? B.name + " · " : "") + "Уровень " + G().L + " · " + lev.name;
  b.hidden = false;
  setTimeout(function () { b.hidden = true; }, 4000);
}

/* ════════ ЖЕСТЫ В ОКНАХ И НА ЭКРАНАХ ════════ */
function gesture(g) {
  if (screen === "boot") return true;
  if (page) return pageGesture(g);
  var w = top();
  if (!w) return false;
  if (g.kind === "back") { if (!closeTop()) { if (screen === "menu") say("Главное меню. " + itemText(w.items[w.i])); } return true; }
  if (g.n === 1) {
    if (g.kind === "swipe") {
      if (g.dir === "R") { move(1); return true; }
      if (g.dir === "L") { move(-1); return true; }
      var it = w.items[w.i];
      if (g.dir === "U") { if (!adjust(it, 1)) say(w.title + ". Пункт " + (w.i + 1) + " из " + w.items.length + ": " + itemText(it)); return true; }
      if (g.dir === "D") { if (!adjust(it, -1)) { if (!closeTop()) LAB.UI.error(); } return true; }
    }
    if (g.kind === "dtap") { activate(); return true; }
    if (g.kind === "tap") { if (w.note && LAB.Speech.noteBusy()) LAB.Speech.endNote(); say(itemText(w.items[w.i])); return true; }
    return true;
  }
  if (g.n === 2 && g.kind === "swipe" && g.dir === "D") { if (!closeTop()) LAB.UI.error(); return true; }
  if (g.n === 2 && g.kind === "swipe" && g.dir === "U") { readAll(); return true; }
  if (g.n === 2 && g.kind === "tap") { LAB.Speech.hush(); return true; }
  if (screen === "game" && g.n === 3 && g.kind === "swipe" && (g.dir === "U" || g.dir === "D")) {
    var want = g.dir === "U" ? "Персонаж" : "Инвентарь";
    if (w.title === want) closeTop(); else { closeAll(); if (g.dir === "U") character(); else inventory(); }
    return true;
  }
  return true;
}

/* ════════ КЛАВИАТУРА В ОКНАХ ════════
   Стрелки вверх и вниз — пункты, вправо и влево — значение, Enter — выбрать,
   пробел — повторить пункт, Tab — прочитать всё окно, Home и End — первый и
   последний пункт, Escape или Backspace — назад, C и I — персонаж и
   инвентарь (как три пальца вверх и вниз), F1 — руководство. */
function key(act) {
  if (screen === "boot") return true;
  var w = top();
  if (!w) return false;
  var it = w.items[w.i], n = w.items.length;
  /* записка читается, а игрок ходит по ней клавишами — чтение целиком уступает выбранному абзацу */
  if (w.note && LAB.Speech.noteBusy() && /^(next|prev|first|last|inc|dec|repeat)$/.test(act)) LAB.Speech.endNote();
  var quiet = false;
  var where = function () { return w.title + ". Пункт " + (w.i + 1) + " из " + n + ": " + itemText(w.items[w.i]); };
  switch (act) {
    case "next": move(1); return true;
    case "prev": move(-1); return true;
    case "first": case "last":
      w.i = act === "first" ? 0 : n - 1; LAB.UI.move(); render();
      if (!quiet) say(itemText(w.items[w.i]));
      return true;
    case "inc": case "dec":
      if (!adjust(it, act === "inc" ? 1 : -1) && !quiet) say(where());
      return true;
    case "select": activate(); return true;
    case "repeat": if (!quiet) say(where()); return true;
    case "all": readAll(); return true;
    case "hush": LAB.Speech.hush(); return true;
    case "histBack": LAB.history.show(-1); return true;
    case "histFwd": LAB.history.show(1); return true;
    case "back":
      if (!closeTop()) { if (screen === "menu") say("Главное меню. " + itemText(w.items[w.i])); else LAB.UI.error(); }
      return true;
    case "char": case "inv":
      if (screen !== "game") return true;
      var want = act === "char" ? "Персонаж" : "Инвентарь";
      if (w.title === want) closeTop(); else { closeAll(); if (act === "char") character(); else inventory(); }
      return true;
    case "guide":
      if (LAB.guide && w.title !== "Руководство") LAB.guide.open();
      return true;
  }
  return false;
}
function pageOpen() { return !!page; }

LAB.ui = {
  key: key, pageOpen: pageOpen,
  menu: menu, closeTop: closeTop, closeAll: closeAll, layer: layer, gesture: gesture, refresh: refresh, render: render,
  note: note, craft: craft, ending: ending, levelBanner: levelBanner, showGame: showGame, mainMenu: mainMenu, prologue: prologue, pages: pages,
  character: character, inventory: inventory, implants: implants, settings: settingsMenu, loadMenu: loadMenu, saveMenu: saveMenu,
  navMenu: navMenu, screen: function () { return screen; }, setScreen: setScreen, top: top, activate: activate, move: move
};
})();
