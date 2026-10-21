#!/bin/bash
# Эмулятор готов, когда не только загрузился (sys.boot_completed), но и
# поднял системные службы: на новых образах (Android 17) загрузка бывает
# объявлена раньше, чем отвечают диспетчер пакетов и настройки, — тогда
# adb install падает с «Can't find service: package». Готово — три
# проверки подряд с паузой: загрузка, пакеты, настройки.
#   bash lab/android/emu-ready.sh [предел в секундах]
LIMIT=${1:-420}
T0=$(date +%s); OKN=0; B=""; P=""; S=""
while :; do
  B=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  P=$(adb shell pm path android 2>/dev/null | tr -d '\r')
  S=$(adb shell settings get global device_provisioned 2>/dev/null | tr -d '\r')
  if [ "$B" = "1" ] && echo "$P" | grep -q "^package:" && echo "$S" | grep -qE '^[0-9]'; then OKN=$((OKN + 1)); else OKN=0; fi
  if [ "$OKN" -ge 3 ]; then echo "эмулятор готов за $(( $(date +%s) - T0 )) с: службы пакетов и настроек отвечают"; exit 0; fi
  [ $(( $(date +%s) - T0 )) -ge "$LIMIT" ] && break
  sleep 5
done
echo "эмулятор не поднял службы за $LIMIT с: boot_completed=${B:-нет}, пакеты=${P:0:60}, настройки=${S:0:40}"
adb shell getprop 2>/dev/null | grep -E "sys.boot_completed|dev.bootcomplete|init.svc.(zygote|zygote64|zygote_secondary|bootanim|surfaceflinger|servicemanager|system_server)|ro.build.fingerprint" || true
adb logcat -d -b crash 2>/dev/null | tail -40 || true
adb logcat -d 2>/dev/null | grep -E "FATAL EXCEPTION IN SYSTEM PROCESS|\*\*\* FATAL|system_server|Watchdog|DeadSystemException|SurfaceFlinger.*(abort|crash)" | tail -30 || true
exit 1
