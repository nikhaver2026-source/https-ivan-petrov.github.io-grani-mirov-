#!/bin/bash
# d_run.sh ЧИСЛО — запись дня: очередь из собранной речи → пакеты m/f попеременно до конца квоты → нарезка.
# Встраивание — отдельно и ровно один раз: apply.sh. Журнал — /root/S/gvrec/d<ЧИСЛО>.log.
cd /root/S/gvrec; D=${1:?число}; L=/root/S/gvrec/d$D.log
[ -d raw ] && { echo "$(date -u +%T) raw/ уже есть — прежний день не убран в архив" >> $L; exit 1; }
bash /root/.config/grani/keys.sh >> $L 2>&1 || exit 1
python3 gvqueue.py >> $L 2>&1
стоп_m=0; стоп_f=0
for i in $(seq 1 40); do
  for v in m f; do
    eval "s=\$стоп_$v"; [ "$s" = 1 ] && continue
    out=$(timeout 1200 python3 gvrec2.py $v 120 /root/S/gvrec/queue_$v.json 2>&1); rc=$?
    echo "$(date -u +%T) $out" >> $L
    if [ $rc = 2 ]; then echo "$(date -u +%T) ключи исчерпаны" >> $L; break 2; fi
    echo "$out" | grep -q 'нечего записывать' && eval "стоп_$v=1"
  done
  [ "$стоп_m" = 1 ] && [ "$стоп_f" = 1 ] && break
done
echo "$(date -u +%T) запись кончилась, режу" >> $L
for v in m f; do [ -d raw/$v ] && taskset -c 0-3 python3.13 gvcut.py $v >> $L 2>&1; done
echo "$(date -u +%T) ГОТОВО" >> $L
