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
  # раз в минуту — жив ли процесс игры и сколько он занимает
  if [ $((i % 30)) -eq 0 ]; then
    P=$(adb shell pidof $PKG | tr -d '\r' || true)
    echo "… $((i * 2)) с: процесс ${P:-нет}; $(adb shell dumpsys meminfo $PKG 2>/dev/null | grep -m1 -E 'TOTAL' | tr -s ' ' | cut -c1-80)"
    [ -z "$P" ] && break
  fi
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
if [ -z "$PID" ] || ! echo "$RES" | grep -q "selftest ok"; then
  echo "== почему процесс игры закрылся"
  adb logcat -d | grep -i -E "lowmemorykiller|lmkd|Killing .*$PKG|$PKG.*(died|killed)|has died|renderer|render process|chromium.*(crash|fatal|OOM|out of memory)|signal (6|11)|SIGSEGV|SIGABRT|tombstone|Abort message" | tail -40 || true
  adb logcat -d -b crash 2>/dev/null | tail -30 || true
  adb logcat -d -b events 2>/dev/null | grep -E "am_kill|am_proc_died|am_low_memory|am_anr|am_crash" | tail -20 || true
  echo "== память устройства"; adb shell cat /proc/meminfo 2>/dev/null | head -3 || true
fi
ERR=$(adb logcat -d -s LabJS:* | grep -E "^.*LabJS.*error " || true)
[ -n "$PID" ]
echo "$RES" | grep -q "selftest ok"
[ -z "$ERR" ] || { echo "ошибки страницы: $ERR"; exit 1; }
echo "Android $REL: APK поставлен, игра запущена, самопроверка пройдена"
