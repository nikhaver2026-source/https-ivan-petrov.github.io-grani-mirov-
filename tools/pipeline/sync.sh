#!/bin/bash
# sync.sh — после правок в рабочей папке конвейера (/root/S) обновить его копию в репозитории.
# Список файлов — FILES.txt; новый поздний модуль впишите и в rebuild.py, и в FILES.txt.
set -e
REPO=$(cd "$(dirname "$0")/../.." && pwd)
S=/root/S
while read -r f; do [ -z "$f" ] && continue; mkdir -p "$REPO/tools/pipeline/$(dirname "$f")"; cp -f "$S/$f" "$REPO/tools/pipeline/$f"; done < "$REPO/tools/pipeline/FILES.txt"
cp -f "$S"/release1*.py "$REPO/tools/pipeline/release/" 2>/dev/null || true
echo "копия конвейера в репозитории обновлена: $(wc -l < "$REPO/tools/pipeline/FILES.txt") файлов"
