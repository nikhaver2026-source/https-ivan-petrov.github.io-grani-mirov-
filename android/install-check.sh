#!/bin/bash
# Проверка полного APK на эмуляторе (рабочий процесс android.yml): APK
# ставится, приложение запускается и читает запись из самого конца архива —
# за пределом 4 ГиБ, где у ZIP64 свои поля.
#   bash android/install-check.sh <APK>
set -e
APK=$1
PKG=io.github.granimirov
read -r LAST SIZE OFF < <(python3 - "$APK" <<'PY'
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
i = max(z.infolist(), key=lambda x: x.header_offset)
print(i.filename[len("assets/"):], i.file_size, i.header_offset)
PY
)
echo "Android $(adb shell getprop ro.build.version.release | tr -d '\r'); последняя запись: $LAST ($SIZE байт, смещение $OFF)"
adb shell settings put global verifier_verify_adb_installs 0 || true
adb shell settings put global package_verifier_enable 0 || true
adb shell df -h /data | tail -1
time adb install -r "$APK"
adb shell dumpsys package $PKG | grep -E "versionName|targetSdk" | head -3
adb logcat -c
adb shell am start -W -n $PKG/.MainActivity --es grani_probe "$LAST"
for i in $(seq 1 60); do
  L=$(adb logcat -d -s GraniProbe:* | grep -E "GraniProbe.*(ok|fail)" || true)
  [ -n "$L" ] && break
  sleep 2
done
echo "$L"
sleep 10
PID=$(adb shell pidof $PKG | tr -d '\r' || true)
adb logcat -d | grep -E "AndroidRuntime|FATAL EXCEPTION" | tail -20 || true
echo "процесс игры: ${PID:-нет}"
echo "$L" | grep -q "ok $LAST $SIZE"
[ -n "$PID" ]
echo "Полный APK на Android $(adb shell getprop ro.build.version.release | tr -d '\r'): поставлен, запущен, запись за пределом 4 ГиБ прочитана"
