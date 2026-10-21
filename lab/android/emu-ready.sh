#!/bin/bash
# Эмулятор готов, когда не только загрузился (sys.boot_completed), но и
# поднял системные службы: на новых образах (Android 17) загрузка бывает
# объявлена раньше, чем отвечают диспетчер пакетов и настройки, — тогда
# adb install падает с «Can't find service: package». Готово — три
# проверки подряд с паузой: загрузка, пакеты, настройки. Потом — проверка
# устойчивости: surfaceflinger и system_server не должны перезапускаться
# (сломанная настройка графики роняет их по кругу каждые полминуты, а
# boot_completed при этом остаётся 1).
#   bash lab/android/emu-ready.sh [предел в секундах]
LIMIT=${1:-420}
T0=$(date +%s); OKN=0; B=""; P=""; S=""
pids() { echo "$(adb shell pidof surfaceflinger 2>/dev/null | tr -d '\r') / $(adb shell pidof system_server 2>/dev/null | tr -d '\r')"; }
diag() {
  adb shell getprop 2>/dev/null | grep -E "sys.boot_completed|dev.bootcomplete|init.svc.(zygote|zygote64|zygote_secondary|bootanim|surfaceflinger|servicemanager|system_server)|ro.build.fingerprint" || true
  adb logcat -d -b crash 2>/dev/null | tail -40 || true
  adb logcat -d 2>/dev/null | grep -E "FATAL EXCEPTION IN SYSTEM PROCESS|\*\*\* FATAL|system_server|Watchdog|DeadSystemException|SurfaceFlinger.*(abort|crash)|Assertion failed" | tail -30 || true
}
while :; do
  B=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  P=$(adb shell pm path android 2>/dev/null | tr -d '\r')
  S=$(adb shell settings get global device_provisioned 2>/dev/null | tr -d '\r')
  if [ "$B" = "1" ] && echo "$P" | grep -q "^package:" && echo "$S" | grep -qE '^[0-9]'; then OKN=$((OKN + 1)); else OKN=0; fi
  if [ "$OKN" -ge 3 ]; then
    T1=$(( $(date +%s) - T0 ))
    # устойчивость: 45 с номера процессов графики и системы не меняются
    P0=$(pids); STABLE=1
    for i in $(seq 1 9); do
      sleep 5
      P1=$(pids)
      if [ "$P1" != "$P0" ]; then STABLE=0; break; fi
    done
    if [ "$STABLE" = "1" ]; then echo "эмулятор готов за $T1 с: службы пакетов и настроек отвечают, surfaceflinger и system_server устойчивы ($P0)"; exit 0; fi
    echo "эмулятор не устойчив: surfaceflinger / system_server перезапускаются ($P0 → $P1)"
    diag
    exit 1
  fi
  [ $(( $(date +%s) - T0 )) -ge "$LIMIT" ] && break
  sleep 5
done
echo "эмулятор не поднял службы за $LIMIT с: boot_completed=${B:-нет}, пакеты=${P:0:60}, настройки=${S:0:40}"
diag
exit 1
