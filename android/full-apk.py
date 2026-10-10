#!/usr/bin/env python3
"""Полный APK «Грани Миров» любого веса (14.5).

Полная сборка несёт всю игру и все записи без сжатия и без потерь: игрок
ставит один файл, и всё уже внутри — ничего не докачивается и не ставится
отдельно. Записей больше 4 ГиБ, а обычный архив APK (ZIP) больше 4 ГиБ быть
не может; нужен ZIP64. Android читает APK в формате ZIP64 начиная с Android 12
(libziparchive), но подписи v2/v3 у таких файлов система не принимает
(«ZIP64 APK not supported»), и apksigner их не подписывает. Поэтому полный APK
подписывается подписью v1 (jarsigner), а целевой API у него — 29: подпись v1
без v2 Android принимает у приложений с целевым API ниже 30.

  python3 android/full-apk.py <APK игры> <папка sounds> <выход>

Берёт собранный APK игры (страница, код, ресурсы — без записей), выбрасывает
его прежнюю подпись (META-INF/*.SF, *.RSA, *.DSA, *.EC, MANIFEST.MF) и
дописывает все записи как assets/www/sounds/… без сжатия (ZIP_STORED; FLAC уже
сжат без потерь). Выход — неподписанный архив; ZIP64 он становится сам, когда
перерастает 4 ГиБ. Затем: jarsigner (подпись v1) — см. .github/workflows/android.yml.
"""
import os
import sys
import zipfile

SIG = (".SF", ".RSA", ".DSA", ".EC")


def old_signature(name):
    if not name.startswith("META-INF/"):
        return False
    base = name[len("META-INF/"):]
    return "/" not in base and (base == "MANIFEST.MF" or base.upper().endswith(SIG))


def build(apk, sounds, out):
    n_app = n_snd = 0
    total = 0
    with zipfile.ZipFile(apk) as src, zipfile.ZipFile(out, "w", allowZip64=True) as dst:
        for info in src.infolist():
            if old_signature(info.filename) or info.filename.startswith("assets/www/sounds/"):
                continue
            data = src.read(info)
            zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            zi.compress_type = info.compress_type
            zi.external_attr = info.external_attr
            dst.writestr(zi, data)
            n_app += 1
        for root, dirs, files in os.walk(sounds):
            dirs.sort()
            for f in sorted(files):
                p = os.path.join(root, f)
                rel = os.path.relpath(p, sounds).replace(os.sep, "/")
                dst.write(p, "assets/www/sounds/" + rel, compress_type=zipfile.ZIP_STORED)
                n_snd += 1
                total += os.path.getsize(p)
    return n_app, n_snd, total


def check(path, sounds):
    """Каждая запись папки sounds — в архиве, того же размера, без сжатия."""
    want = {}
    for root, _, files in os.walk(sounds):
        for f in files:
            p = os.path.join(root, f)
            want["assets/www/sounds/" + os.path.relpath(p, sounds).replace(os.sep, "/")] = os.path.getsize(p)
    with zipfile.ZipFile(path) as z:
        have = {i.filename: i for i in z.infolist()}
    missing = [k for k in want if k not in have]
    wrong = [k for k, v in want.items() if k in have and (have[k].file_size != v or have[k].compress_type != zipfile.ZIP_STORED)]
    return missing, wrong, len(have)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    apk, sounds, out = sys.argv[1:]
    a, s, t = build(apk, sounds, out)
    missing, wrong, n = check(out, sounds)
    size = os.path.getsize(out)
    print(f"полный APK: файлов игры {a}, записей {s} ({t / 1e9:.2f} ГБ), всего в архиве {n}; "
          f"{size / 1e9:.2f} ГБ{', ZIP64' if size >= 1 << 32 else ''}")
    if missing or wrong:
        sys.exit(f"нет в архиве: {missing[:3]}; не тот размер или сжатие: {wrong[:3]}")
