#!/bin/bash
# Проверка обновления на эмуляторе (рабочий процесс android.yml): сначала
# ставится прежний полный APK (последняя удачная сборка из main), запускается
# и заводит свои данные; на них кладётся метка, как сохранение игрока. Затем
# поверх ставится новый APK — так, как ставит телефон, без удаления прежнего.
# Обновление должно пройти: та же подпись, номер сборки выше, метка и данные
# WebView (сохранения игры) на месте, дата первой установки прежняя, новая
# версия запускается и читает запись из конца архива ZIP64.
#   bash android/update-check.sh <прежний APK или пусто> <новый APK>
set -e
PREV=$1
NEW=$2
PKG=io.github.granimirov
if [ -z "$PREV" ] || [ ! -s "$PREV" ]; then
  echo "Прежней сборки нет — проверяю установку начисто"
  exec bash android/install-check.sh "$NEW"
fi
info() { adb shell dumpsys package $PKG | tr -d '\r'; }
field() { info | grep -m1 -oE "$1=[^ ]+" | cut -d= -f2-; }
adb shell settings put global verifier_verify_adb_installs 0 || true
adb shell settings put global package_verifier_enable 0 || true
echo "Android $(adb shell getprop ro.build.version.release | tr -d '\r'): ставлю прежнюю сборку"
adb shell df -h /data | tail -1
time adb install "$PREV"
OLD=$(field versionCode)
FIRST=$(info | grep -m1 -oE "firstInstallTime=[0-9: -]+" | cut -d= -f2-)
echo "прежняя: versionCode $OLD, поставлена $FIRST"
# Прежняя версия запускается и заводит данные WebView (там живут сохранения).
adb shell am start -W -n $PKG/.MainActivity
sleep 30
adb shell am force-stop $PKG
# Метка в данных приложения — как сохранение игрока (образы google_apis дают adb root).
MARK=""
if adb root > /dev/null 2>&1; then
  adb wait-for-device
  sleep 3
  D=/data/data/$PKG
  U=$(adb shell stat -c %u $D | tr -d '\r')
  adb shell "mkdir -p $D/files && echo granimark > $D/files/update-mark && chown -R $U:$U $D/files && restorecon -R $D/files" || true
  MARK=$(adb shell cat $D/files/update-mark 2>/dev/null | tr -d '\r' || true)
  WV=$(adb shell "ls $D/app_webview 2>/dev/null | head -3" | tr -d '\r' || true)
  echo "метка: ${MARK:-нет}; данные WebView: ${WV:-нет}"
fi
adb shell df -h /data | tail -1
# Новая версия — поверх, без удаления прежней; затем запуск и чтение записи из конца архива.
bash android/install-check.sh "$NEW"
NEWV=$(field versionCode)
FIRST2=$(info | grep -m1 -oE "firstInstallTime=[0-9: -]+" | cut -d= -f2-)
echo "новая: versionCode $NEWV, первая установка $FIRST2"
[ "$NEWV" -gt "$OLD" ] || { echo "номер сборки не вырос: $OLD → $NEWV"; exit 1; }
[ "$FIRST2" = "$FIRST" ] || { echo "дата первой установки сменилась — это не обновление, а установка заново"; exit 1; }
if [ -n "$MARK" ]; then
  M2=$(adb shell cat /data/data/$PKG/files/update-mark 2>/dev/null | tr -d '\r' || true)
  [ "$M2" = "$MARK" ] || { echo "метка в данных пропала — данные игрока не пережили обновление"; exit 1; }
  adb shell ls /data/data/$PKG/app_webview > /dev/null || { echo "данные WebView пропали"; exit 1; }
fi
echo "Обновление поверх прежней сборки ($OLD → $NEWV): поставлено без удаления, данные на месте, новая версия запущена"
