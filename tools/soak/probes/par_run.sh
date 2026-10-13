#!/bin/bash
# par_run.sh ВОРКЕРОВ ПАПКА_ЛОГОВ — все наборы tests/*.js (кроме run.js) в несколько потоков против сервера 8903 (с путём репозитория, как tests/run.js).
W=$1;D=$2;mkdir -p "$D";REPO=/home/user/https-ivan-petrov.github.io-grani-mirov-;cd "$REPO"
URL="http://localhost:8903/$(basename "$REPO")/index.html"
mapfile -t ALL < <(ls tests/*.js | grep -v '/run.js$' | sort -V)
run_shard(){ local k=$1;local LOG="$D/shard$k.log";: > "$LOG"
 for ((i=k;i<${#ALL[@]};i+=W)); do f=${ALL[$i]};s=$(date +%s)
  out=$(NODE_PATH=$REPO/node_modules timeout 900 node "$f" "$URL" 2>&1);code=$?;e=$(( $(date +%s)-s ))
  p=$(echo "$out" | grep -c '^PASS');fl=$(echo "$out" | grep -c '^FAIL')
  echo "$(basename $f) код $code за ${e}с PASS $p FAIL $fl" >> "$LOG"
  [ "$code" != "0" ] && echo "$out" | grep -E '^FAIL|Error|СБОЙ' | head -5 | cut -c1-500 | sed 's/^/    /' >> "$LOG"
 done; echo "ГОТОВО" >> "$LOG"; }
for ((k=0;k<W;k++)); do run_shard $k & done; wait
echo "всего наборов ${#ALL[@]}"; grep -h ' код ' "$D"/shard*.log | awk '{print $3}' | sort | uniq -c
