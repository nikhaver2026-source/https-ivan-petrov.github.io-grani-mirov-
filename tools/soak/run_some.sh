#!/bin/bash
# run_some.sh ЛОГ НОМЕР… — наборы проверок по очереди против сервера на 8903 (tools/soak/srv8903.js); итог каждого — в лог.
LOG=$1;shift;: > "$LOG"
cd "$(dirname "$0")/../.."
for t in "$@"; do f=$(ls tests/${t}-*.js 2>/dev/null | head -1); [ -z "$f" ] && { echo "$t: нет файла" >> "$LOG"; continue; }
 s=$(date +%s); out=$(NODE_PATH=$PWD/node_modules timeout 600 node "$f" http://localhost:8903/index.html 2>&1); code=$?; e=$(( $(date +%s)-s ))
 echo "$(basename $f) код $code за ${e}с :: $(echo "$out" | grep -E 'passed' | tail -1)" >> "$LOG"
 echo "$out" | grep -E '^FAIL' | cut -c1-600 >> "$LOG"
done
echo "ГОТОВО" >> "$LOG"
