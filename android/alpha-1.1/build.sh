#!/usr/bin/env bash
set -euo pipefail

platform=$(realpath "$1")
tools=$(realpath "$2")
game=$(realpath "$3")
out=$(realpath -m "$4")
root=$(dirname "$(realpath "$0")")
mkdir -p "$out"
build=$(mktemp -d)
trap 'rm -rf "$build"' EXIT

mkdir -p "$build/res/values" "$build/res/mipmap-xxhdpi" "$build/res/mipmap-xxxhdpi" "$build/classes" "$build/dex" "$build/assets/www"
cp "$root/inputs/styles.xml" "$build/res/values/"
cp "$game/icon-192.png" "$build/res/mipmap-xxhdpi/ic_launcher.png"
cp "$game/icon-512.png" "$build/res/mipmap-xxxhdpi/ic_launcher.png"
cp -a "$game/." "$build/assets/www/"
"$tools/aapt2" compile --dir "$build/res" -o "$build/resources.zip"
"$tools/aapt2" link -I "$platform" --manifest "$root/inputs/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 35 --version-code 40110000 --version-name 'Альфа 1.1' \
  -A "$build/assets" -0 flac -0 ogg -0 mp3 -0 wav -o "$build/base.apk" "$build/resources.zip"

if command -v javac >/dev/null && javac -version >/dev/null 2>&1; then
  javac --release 17 -encoding UTF-8 -cp "$platform" -d "$build/classes" "$root"/inputs/*.java
else
  java -jar "$root/ecj.jar" -17 -proc:none -encoding UTF-8 -cp "$platform" -d "$build/classes" "$root"/inputs/*.java
fi
mapfile -d '' classes < <(find "$build/classes" -name '*.class' -print0 | sort -z)
"$tools/d8" --release --min-api 24 --lib "$platform" --output "$build/dex" "${classes[@]}"
(cd "$build/dex" && zip -q "$build/base.apk" classes.dex)
"$tools/zipalign" -f 4 "$build/base.apk" "$out/aligned.apk"
"$tools/zipalign" -c 4 "$out/aligned.apk"
