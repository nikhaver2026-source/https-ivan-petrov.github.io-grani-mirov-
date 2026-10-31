#!/bin/bash
# (4.1) Новый запуск игры в том же процессе после ухода в фон: страница должна загрузиться.
# Уход в фон усыпляет таймеры страницы (WebView.pauseTimers) — на весь процесс, а не на
# одно окно. Прежде окно, закрытое в фоне или «Выходом», оставляло их усыплёнными, и
# следующий запуск в том же процессе (Android держит его в памяти) стоял на «Загрузке» —
# так и писал игрок: «иногда игра не загружается».
# Здесь: обычный запуск (без самопроверки: в ней страница в фоне не засыпает) → «Домой»
# (страница уснула) → запуск новым окном (прежнее закрывается, процесс тот же) →
# страница должна сказать «ready».
#   bash lab/android/relaunch-check.sh          — ждём, что загрузится (новый APK)
#   bash lab/android/relaunch-check.sh stuck    — только сведения: встанет ли (прежний APK)
set -u
PKG=io.github.granimirov.lab
WANT=${1:-ok}
ready() { adb logcat -d -s LabJS:* 2>/dev/null | grep -E "ready " | tail -1 || true; }
wait_ready() { local R="" i; for i in $(seq 1 "$1"); do R=$(ready); [ -n "$R" ] && break; sleep 2; done; echo "$R"; }
adb shell am force-stop $PKG
adb logcat -c
adb shell am start -W -n $PKG/.MainActivity > /dev/null
R1=$(wait_ready 90)
P1=$(adb shell pidof $PKG | tr -d '\r' || true)
sleep 3
adb shell input keyevent KEYCODE_HOME
sleep 5
adb logcat -c
# NEW_TASK | CLEAR_TASK: прежнее окно закрывается, новое открывается в том же процессе —
# как запуск после «Выхода», пока Android ещё держит процесс игры
adb shell am start -W -f 0x10008000 -n $PKG/.MainActivity > /dev/null
R2=$(wait_ready 60)
P2=$(adb shell pidof $PKG | tr -d '\r' || true)
SAME=""; [ -n "$P1" ] && [ "$P1" = "$P2" ] && SAME=" (тот же)"
echo "первый запуск: $([ -n "$R1" ] && echo 'страница загрузилась' || echo 'страница НЕ загрузилась'), процесс ${P1:-нет}"
echo "новое окно после фона: $([ -n "$R2" ] && echo 'страница загрузилась' || echo 'стоит на «Загрузке»'), процесс ${P2:-нет}$SAME"
adb shell am force-stop $PKG
[ "$WANT" = "stuck" ] && exit 0
[ -n "$R1" ] && [ -n "$R2" ] || { echo "новый запуск после фона не загрузил страницу"; exit 1; }
echo "запуск после фона в том же процессе: страница загружается"
