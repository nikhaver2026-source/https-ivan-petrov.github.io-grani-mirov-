#!/bin/bash
# Проверка APK «Подземной лаборатории» на эмуляторе одной версии Android (lab-android-compat.yml):
# 1) прежний выпуск ставится и запускается; 2) новый APK встаёт поверх него ОБНОВЛЕНИЕМ — без
#    удаления, данные игры (сохранения) остаются: это та же установка, что у игроков с телефона;
# 3) дальше — обычная проверка основной сборки: установка, запуск, самопроверка игры, запуск после
#    фона (lab/android/install-check.sh).
#   bash .github/lab-compat-check.sh <новый APK> [прежний APK]
set -e
NEW=$1; OLD=${2:-}
PKG=io.github.granimirov.lab
D="lab/android"
bash "$D/emu-ready.sh" 300 || true
adb shell settings put global verifier_verify_adb_installs 0 || true
adb shell settings put global package_verifier_enable 0 || true
REL=$(adb shell getprop ro.build.version.release | tr -d '\r'); SDK=$(adb shell getprop ro.build.version.sdk | tr -d '\r')
PG=$(adb shell getconf PAGE_SIZE 2>/dev/null | tr -d '\r' || true)
echo "Android $REL (API $SDK), страница памяти: ${PG:-?} байт"
echo "место в /data до установки: $(adb shell df -h /data 2>/dev/null | tail -1 | tr -s ' ')"
inst() {
  local F=$1
  for t in 1 2 3; do
    case $t in
      1) adb install -r "$F" && return 0 ;;
      2) adb install --no-streaming -r "$F" && return 0 ;;
      3) adb push "$F" /data/local/tmp/lab.apk > /dev/null && adb shell pm install -r /data/local/tmp/lab.apk && { adb shell rm -f /data/local/tmp/lab.apk; return 0; } ;;
    esac
    echo "установка не удалась (способ $t) — жду системные службы"
    bash "$D/emu-ready.sh" 180 || true
  done
  return 1
}
info() { adb shell dumpsys package $PKG | grep -E "versionName|firstInstallTime|lastUpdateTime" | tr -s ' ' | head -3; }
if [ -n "$OLD" ] && [ -f "$OLD" ]; then
  echo "== прежний выпуск"
  inst "$OLD" || { echo "::error::прежний APK не поставился на Android $REL"; exit 1; }
  info
  # запустить прежний: у игры появляются данные (настройки, сохранения в WebView)
  adb shell am start -W -n $PKG/.MainActivity > /dev/null || true
  sleep 20
  adb shell am force-stop $PKG || true
  FIRST0=$(adb shell dumpsys package $PKG | grep -m1 firstInstallTime | tr -d '\r' | sed 's/.*=//')
  adb root > /dev/null 2>&1 || true; sleep 3; adb wait-for-device
  DATA0=$(adb shell ls /data/data/$PKG 2>/dev/null | tr -d '\r' | tr '\n' ' ' || true)
  echo "данные прежней версии: ${DATA0:-нет доступа}"
  echo "== новый APK поверх прежнего — обновлением"
  inst "$NEW" || { echo "::error::новый APK не встал поверх прежнего на Android $REL"; adb logcat -d | grep -iE "PackageManager|INSTALL_FAILED" | tail -20; exit 1; }
  info
  FIRST1=$(adb shell dumpsys package $PKG | grep -m1 firstInstallTime | tr -d '\r' | sed 's/.*=//')
  [ "$FIRST0" = "$FIRST1" ] || { echo "::error::это не обновление: дата первой установки сменилась ($FIRST0 → $FIRST1)"; exit 1; }
  DATA1=$(adb shell ls /data/data/$PKG 2>/dev/null | tr -d '\r' | tr '\n' ' ' || true)
  if [ -n "$DATA0" ]; then
    for x in $DATA0; do echo " $DATA1 " | grep -q " $x " || { echo "::error::после обновления пропала папка данных игры: $x"; exit 1; }; done
    echo "данные игры после обновления на месте: $DATA1"
  fi
  adb unroot > /dev/null 2>&1 || true; sleep 3; adb wait-for-device; bash "$D/emu-ready.sh" 120 || true
  echo "обновление с прежнего выпуска: ставится, дата первой установки та же, данные на месте"
fi
echo "место в /data после установки: $(adb shell df -h /data 2>/dev/null | tail -1 | tr -s ' ')"
bash "$D/install-check.sh" "$NEW"
