#!/bin/bash
# restore.sh [--force] — разложить конвейер сборки из репозитория туда, где его ждут скрипты.
# Пути в скриптах конвейера абсолютные (временная папка сессии 13 октября и /root/S), поэтому на новой машине
# конвейер кладётся ровно по тем же путям, и сборка идёт как раньше:  cd /root/S/hron && PHASE=9 bash build_all.sh
# Без --force уже лежащие там файлы не перезаписываются (рабочие правки не теряются).
set -e
REPO=$(cd "$(dirname "$0")/../.." && pwd)
S=/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad
FORCE=0; [ "$1" = "--force" ] && FORCE=1
# put ИСТОЧНИК ЦЕЛЬ — копировать; без --force уже лежащий файл не трогать (без cp -n: его поведение разное в разных coreutils)
put() { if [ "$FORCE" = 1 ] || [ ! -e "$2" ]; then cp -f "$1" "$2"; fi; }
mkdir -p "$S"
while read -r f; do [ -z "$f" ] && continue; mkdir -p "$S/$(dirname "$f")"; put "$REPO/tools/pipeline/$f" "$S/$f"; done < "$REPO/tools/pipeline/FILES.txt"
for f in "$REPO"/tools/pipeline/release/*.py; do put "$f" "$S/$(basename "$f")"; done
mkdir -p "$S/dev155"; for f in "$REPO"/tools/pipeline/svod/* "$REPO"/tools/soak/*; do put "$f" "$S/dev155/$(basename "$f")"; done
[ -e /root/S ] || ln -s "$S" /root/S
echo "конвейер разложен в $S (/root/S); сборка: cd /root/S/hron && PHASE=9 bash build_all.sh"
