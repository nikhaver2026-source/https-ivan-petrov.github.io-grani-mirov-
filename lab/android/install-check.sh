#!/bin/bash
# Проверка APK «Подземной лаборатории» на эмуляторе (рабочий процесс
# lab-android.yml): APK ставится, приложение запускается, страница
# загружается без ошибок, самопроверка игры проходит — новая игра, ходьба,
# оружие, окна, сохранение и загрузка, все 200 этажей, декодирование звука;
# (4.1) новый запуск после ухода в фон в том же процессе загружается (relaunch-check.sh).
#   bash lab/android/install-check.sh <APK>
set -e
APK=$1
PKG=io.github.granimirov.lab
REL=$(adb shell getprop ro.build.version.release | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk | tr -d '\r')
echo "Android $REL (API $SDK)"
adb shell settings put global verifier_verify_adb_installs 0 || true
adb shell settings put global package_verifier_enable 0 || true
# установка: службы на свежем эмуляторе иногда ещё не поднялись — подождать и
# повторить другим способом: потоковая установка, без потока (adb копирует APK
# и ставит), вручную — копия в /data/local/tmp и pm install (pm сам скажет
# причину отказа, а не «Broken pipe»)
inst() {
  local F=${2:-$APK}
  case "$1" in
    1) adb install -r "$F" ;;
    2) adb install --no-streaming -r "$F" ;;
    *) adb push "$F" /data/local/tmp/lab.apk > /dev/null && adb shell pm install -r /data/local/tmp/lab.apk ;;
  esac
}
# (4.1) Сравнение по запросу (LAB_OLD_APK — прежний APK из выпуска lab-android-latest): встаёт
# ли он на «Загрузке» при запуске после фона. Только сведения — сборку не роняет; потом прежний
# удаляется, и новый APK ставится начисто и проверяется тем же сценарием ниже.
if [ -n "${LAB_OLD_APK:-}" ] && [ -f "$LAB_OLD_APK" ]; then
  echo "== прежний APK ($LAB_OLD_APK): запуск после фона"
  OK_OLD=""
  for t in 1 2 3; do inst $t "$LAB_OLD_APK" > /dev/null 2>&1 && { OK_OLD=1; break; }; bash "$(dirname "$0")/emu-ready.sh" 180 || true; done
  if [ -n "$OK_OLD" ]; then bash "$(dirname "$0")/relaunch-check.sh" stuck || true; else echo "прежний APK не поставился — сравнения не будет"; fi
  # новый APK проверяется на чистой установке, как и без сравнения
  adb uninstall $PKG > /dev/null 2>&1 || true
fi
for t in 1 2 3; do
  inst $t && break
  echo "установка не удалась (попытка $t) — жду системные службы"
  bash "$(dirname "$0")/emu-ready.sh" 180 || true
done
adb shell pm path $PKG | grep -q "^package:" || { echo "APK не поставился"; adb logcat -d -b crash 2>/dev/null | tail -30 || true; exit 1; }
adb shell dumpsys package $PKG | grep -E "versionName|targetSdk|minSdk" | head -3 || true
adb shell dumpsys package com.google.android.webview 2>/dev/null | grep -m1 versionName || adb shell dumpsys package com.android.webview 2>/dev/null | grep -m1 versionName || true
adb logcat -c
adb shell am start -W -n $PKG/.MainActivity --ez lab_selftest true
RES=""
for i in $(seq 1 240); do
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
# (4.1) запуск после ухода в фон, новым окном в том же процессе: страница не стоит на «Загрузке»
echo "== запуск после фона в том же процессе"
bash "$(dirname "$0")/relaunch-check.sh"
echo "Android $REL: APK поставлен, игра запущена, самопроверка пройдена, запуск после фона загружается"
