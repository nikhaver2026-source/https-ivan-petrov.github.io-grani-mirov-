#!/bin/bash
# Разбор установки на эмуляторе: ставит каждый APK начисто и печатает точную причину отказа.
echo "Android $(adb shell getprop ro.build.version.release | tr -d '\r'), API $(adb shell getprop ro.build.version.sdk | tr -d '\r'), $(adb shell getprop ro.build.fingerprint | tr -d '\r')"
adb shell df -h /data | tail -1
for APK in "$@"; do
  echo "════ $APK ($(stat -c %s "$APK") байт)"
  adb uninstall io.github.granimirov > /dev/null 2>&1 || true
  adb logcat -c
  OUT=$(adb install "$APK" 2>&1); RC=$?
  echo "$OUT" | tail -5
  echo "код выхода adb install: $RC"
  adb logcat -d | grep -iE "PackageManager|PackageInstaller|ziparchive|StrictJar|ApkSignature|INSTALL_|Zip|jar|verif" | grep -viE "chatty|dexopt" | tail -60
  adb shell dumpsys package io.github.granimirov | grep -E "versionName|versionCode" | head -2
done
