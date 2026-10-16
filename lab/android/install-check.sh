#!/bin/bash
# Проверка APK «Подземной лаборатории» на эмуляторе (рабочий процесс
# lab-android.yml): APK ставится, приложение запускается, страница
# загружается без ошибок, самопроверка игры проходит — новая игра, ходьба,
# оружие, окна, сохранение и загрузка, все 200 этажей, декодирование звука.
#   bash lab/android/install-check.sh <APK>
set -e
APK=$1
PKG=io.github.granimirov.lab
REL=$(adb shell getprop ro.build.version.release | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk | tr -d '\r')
echo "Android $REL (API $SDK)"
adb shell settings put global verifier_verify_adb_installs 0 || true
adb shell settings put global package_verifier_enable 0 || true
adb install -r "$APK"
adb shell dumpsys package $PKG | grep -E "versionName|targetSdk|minSdk" | head -3 || true
adb shell dumpsys package com.google.android.webview 2>/dev/null | grep -m1 versionName || adb shell dumpsys package com.android.webview 2>/dev/null | grep -m1 versionName || true
adb logcat -c
adb shell am start -W -n $PKG/.MainActivity --ez lab_selftest true
RES=""
for i in $(seq 1 150); do
  RES=$(adb logcat -d -s LabJS:* | grep -E "selftest (ok|FAIL)" || true)
  [ -n "$RES" ] && break
  sleep 2
done
echo "== журнал страницы"
adb logcat -d -s LabJS:* | tail -20
adb logcat -d -s LabConsole:* | grep -v -E "LabConsole.*(LOG|DEBUG)" | tail -30 || true
echo "== итог"
echo "$RES"
PID=$(adb shell pidof $PKG | tr -d '\r' || true)
adb logcat -d | grep -E "AndroidRuntime|FATAL EXCEPTION" | tail -20 || true
echo "процесс игры: ${PID:-нет}"
ERR=$(adb logcat -d -s LabJS:* | grep -E "^.*LabJS.*error " || true)
[ -n "$PID" ]
echo "$RES" | grep -q "selftest ok"
[ -z "$ERR" ] || { echo "ошибки страницы: $ERR"; exit 1; }
echo "Android $REL: APK поставлен, игра запущена, самопроверка пройдена"
