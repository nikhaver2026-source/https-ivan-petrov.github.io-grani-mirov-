#!/bin/sh
# Заменить index.html внутри APK, выровнять и подписать.
#
#   sh tools/apk-update-index.sh старый.apk [index.html] [новый.apk]
#
# ПОДПИСЬ. Если ключ не задан, скрипт создаёт свой и подписывает им. Это
# ДРУГОЙ ключ, не тот, которым подписан прежний APK: поставить новую сборку
# поверх старой не выйдет — старую придётся удалить, а вместе с ней пропадут
# сохранения игры: они лежат в личном хранилище приложения.
# Чтобы этого не случилось, подпишите СВОИМ ключом:
#   KEYSTORE=путь KS_PASS=пароль KEY_ALIAS=имя KEY_PASS=пароль \
#     sh tools/apk-update-index.sh старый.apk
#
# Выравнивание и подпись делает uber-apk-signer (в нём и zipalign, и
# apksigner). Нет под рукой — скрипт скачает его с GitHub; свой можно задать
# через SIGNER=путь. Рабочую папку можно задать через WORKDIR=путь.
set -e
APK="$1"
HTML="${2:-index.html}"
OUT="${3:-}"
[ -n "$APK" ] || { echo "Как звать: sh tools/apk-update-index.sh старый.apk [index.html] [новый.apk]"; exit 2; }
[ -f "$APK" ] || { echo "Нет файла: $APK"; exit 2; }
[ -f "$HTML" ] || { echo "Нет файла: $HTML"; exit 2; }

ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORKDIR="${WORKDIR:-$(mktemp -d)}"
mkdir -p "$WORKDIR"
UNSIGNED="$WORKDIR/unsigned.apk"

python3 "$ROOT/tools/apk-update-index.py" "$APK" "$HTML" "$UNSIGNED"

SIGNER="${SIGNER:-$WORKDIR/uber-apk-signer.jar}"
if [ ! -f "$SIGNER" ]; then
  echo "качаю uber-apk-signer…"
  curl -sS -L -o "$SIGNER" \
    https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
fi

if [ -z "${KEYSTORE:-}" ]; then
  KEYSTORE="$WORKDIR/grani.keystore"
  KS_PASS="${KS_PASS:-granimirov}"
  KEY_ALIAS="${KEY_ALIAS:-grani}"
  KEY_PASS="${KEY_PASS:-$KS_PASS}"
  if [ ! -f "$KEYSTORE" ]; then
    echo "создаю свой ключ: подпись будет НЕ той, что у прежней сборки"
    keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$KEY_ALIAS" \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass "$KS_PASS" -keypass "$KEY_PASS" \
      -dname "CN=Gran Mirov, OU=game, O=Gran Mirov, C=RU" >/dev/null
  fi
fi
KS_PASS="${KS_PASS:-granimirov}"
KEY_ALIAS="${KEY_ALIAS:-grani}"
KEY_PASS="${KEY_PASS:-$KS_PASS}"

echo "выравниваю и подписываю…"
mkdir -p "$WORKDIR/signed"
java -jar "$SIGNER" --apks "$UNSIGNED" --out "$WORKDIR/signed" \
  --ks "$KEYSTORE" --ksAlias "$KEY_ALIAS" --ksPass "$KS_PASS" --ksKeyPass "$KEY_PASS"

READY=$(ls "$WORKDIR/signed"/*.apk 2>/dev/null | head -1)
[ -n "$READY" ] || { echo "Подпись не удалась, смотрите вывод выше. Рабочая папка: $WORKDIR"; exit 1; }
[ -n "$OUT" ] || OUT="$(dirname "$APK")/$(basename "$APK" .apk)-new.apk"
cp "$READY" "$OUT"
echo "готово: $OUT"
echo "ключ:   $KEYSTORE"
