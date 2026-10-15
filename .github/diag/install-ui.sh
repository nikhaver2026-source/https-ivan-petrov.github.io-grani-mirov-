#!/bin/bash
# Установка так, как ставит телефон: файл лежит в «Загрузках», его открывает установщик Android
# (копирует к себе, разбирает, по кнопке «Установить» ставит). Печатает итог и причину отказа.
PKG=io.github.granimirov
echo "Android $(adb shell getprop ro.build.version.release | tr -d '\r'), API $(adb shell getprop ro.build.version.sdk | tr -d '\r')"
tapText() { # нажать кнопку с одним из текстов
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb pull /sdcard/ui.xml /tmp/ui.xml > /dev/null 2>&1 || return 1
  python3 - "$@" <<'PY'
import re, sys, subprocess
x = open("/tmp/ui.xml", encoding="utf-8", errors="replace").read()
for want in sys.argv[1:]:
    for m in re.finditer(r'<node [^>]*?text="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', x):
        if m.group(1).strip().lower() == want.lower():
            a, b, c, d = map(int, m.groups()[1:])
            subprocess.run(["adb", "shell", "input", "tap", str((a + c) // 2), str((b + d) // 2)])
            print("нажато:", m.group(1)); sys.exit(0)
sys.exit(1)
PY
}
texts() {
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
  adb pull /sdcard/ui.xml /tmp/ui.xml > /dev/null 2>&1 || return
  python3 -c "import re;x=open('/tmp/ui.xml',encoding='utf-8',errors='replace').read();print(' | '.join(t for t in re.findall(r'text=\"([^\"]+)\"',x) if t.strip()))"
}
for APK in "$@"; do
  NAME=$(basename "$APK")
  echo "════ $NAME ($(stat -c %s "$APK") байт) — через установщик"
  adb uninstall $PKG > /dev/null 2>&1 || true
  adb shell rm -f /sdcard/Download/*.apk
  time adb push "$APK" /sdcard/Download/$NAME | tail -1
  adb shell content call --uri content://media --method scan_volume --arg external_primary > /dev/null 2>&1 || true
  sleep 5
  ID=$(adb shell content query --uri content://media/external/downloads --projection _id:_display_name | tr -d '\r' | grep "$NAME" | grep -oE "_id=[0-9]+" | head -1 | cut -d= -f2)
  echo "запись в «Загрузках»: ${ID:-не найдена}"
  [ -n "$ID" ] || continue
  adb logcat -c
  adb shell am start -a android.intent.action.VIEW -t application/vnd.android.package-archive \
    -d "content://media/external/downloads/$ID" --grant-read-uri-permission
  RES=""
  for i in $(seq 1 120); do
    sleep 5
    if adb shell pm list packages $PKG | grep -q $PKG; then RES="поставлено"; break; fi
    T=$(texts)
    case "$T" in
      *"not installed"*|*"не установлено"*|*"invalid"*|*"conflict"*|*"blocked"*|*"Blocked"*|*"problem"*) RES="отказ: $T"; break;;
    esac
    tapText "Install" "Update" "Установить" "Обновить" "Continue" "Продолжить" "Install anyway" > /dev/null 2>&1 || true
    [ $((i % 6)) -eq 0 ] && echo "… $((i*5)) с: $T" | cut -c1-300
  done
  echo "ИТОГ $NAME: ${RES:-не дождались}"
  adb logcat -d | grep -iE "PackageInstaller|InstallStaging|InstallInstalling|InstallRepository|PackageManager.*(fail|error|Exception)|INSTALL_|ziparchive|StrictJar|Exception" | grep -viE "Instant App|chatty" | tail -40
done
