#!/usr/bin/env python3
"""Полный APK «Грани Миров» любого веса (14.5; связки записей — 17.0).

Полная сборка несёт всю игру и все записи без сжатия и без потерь: игрок
ставит один файл, и всё уже внутри — ничего не докачивается и не ставится
отдельно. Записей больше 4 ГиБ, а обычный архив APK (ZIP) больше 4 ГиБ быть
не может; нужен ZIP64. Android читает APK в формате ZIP64 начиная с Android 12
(libziparchive), но подписи v2/v3 у таких файлов система не принимает
(«ZIP64 APK not supported»), и apksigner их не подписывает. Поэтому полный APK
подписывается подписью v1 (jarsigner), а целевой API у него — 29: подпись v1
без v2 Android принимает у приложений с целевым API ниже 30.

(17.0) Записи лежат не по одной, а в нескольких больших файлах-связках
assets/www/snd/p0.pak, p1.pak… (до 256 МиБ каждая, записи подряд, без сжатия) с
описью assets/www/snd/index.tsv («путь<TAB>связка<TAB>смещение<TAB>длина»).
Подпись v1 перечисляет каждую запись архива в META-INF/MANIFEST.MF и в .SF:
при 72 тысячах записей эти списки перевалили за 8 000 000 байт — столько
допускает проверка подписи Java (jdk.jar.maxSignatureFileSize, JDK-8300596),
и Android 16 перестал ставить сборку 17.0 («Приложение не установлено»).
Со связками в архиве несколько десятков записей, списки подписи — килобайты.
Записи страница просит по прежним адресам sounds/…: приложение (MainActivity)
находит их по описи и читает прямо из связки.

  python3 android/full-apk.py <APK игры> <папка sounds> <выход>

Берёт собранный APK игры (страница, код, ресурсы — без записей), выбрасывает
его прежнюю подпись (META-INF/*.SF, *.RSA, *.DSA, *.EC, MANIFEST.MF) и
дописывает связки и опись без сжатия (ZIP_STORED; FLAC уже сжат без потерь).
Выход — неподписанный архив; ZIP64 он становится сам, когда перерастает 4 ГиБ.
Затем: jarsigner (подпись v1) — см. .github/workflows/android.yml.
"""
import os
import random
import sys
import zipfile

SIG = (".SF", ".RSA", ".DSA", ".EC")
PAK_MAX = 256 << 20
PAK_DIR = "assets/www/snd/"


def old_signature(name):
    if not name.startswith("META-INF/"):
        return False
    base = name[len("META-INF/"):]
    return "/" not in base and (base == "MANIFEST.MF" or base.upper().endswith(SIG))


def sound_files(sounds):
    """Все файлы папки sounds по порядку: (путь внутри sounds, путь на диске)."""
    out = []
    for root, dirs, files in os.walk(sounds):
        dirs.sort()
        for f in sorted(files):
            p = os.path.join(root, f)
            out.append((os.path.relpath(p, sounds).replace(os.sep, "/"), p))
    return out


def build(apk, sounds, out):
    n_app = 0
    total = 0
    files = sound_files(sounds)
    index = []
    with zipfile.ZipFile(apk) as src, zipfile.ZipFile(out, "w", allowZip64=True) as dst:
        for info in src.infolist():
            if old_signature(info.filename) or info.filename.startswith(("assets/www/sounds/", PAK_DIR)):
                continue
            data = src.read(info)
            zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            zi.compress_type = info.compress_type
            zi.external_attr = info.external_attr
            dst.writestr(zi, data)
            n_app += 1
        # Связки: записи подряд, пока связка не перерастёт 256 МиБ (участок APK, который система
        # на миг отображает в память при открытии связки, остаётся небольшим и на 32-битных телефонах).
        groups, cur, size = [], [], 0
        for rel, p in files:
            n = os.path.getsize(p)
            if cur and size + n > PAK_MAX:
                groups.append(cur); cur, size = [], 0
            cur.append((rel, p, n)); size += n
        if cur:
            groups.append(cur)
        for k, group in enumerate(groups):
            zi = zipfile.ZipInfo(f"{PAK_DIR}p{k}.pak", date_time=(2026, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_STORED
            zi.external_attr = 0o644 << 16
            off = 0
            with dst.open(zi, "w", force_zip64=sum(n for _, _, n in group) >= 1 << 31) as w:
                for rel, p, n in group:
                    with open(p, "rb") as f:
                        while True:
                            b = f.read(1 << 20)
                            if not b:
                                break
                            w.write(b)
                    index.append(f"{rel}\t{k}\t{off}\t{n}")
                    off += n
                    total += n
        zi = zipfile.ZipInfo(PAK_DIR + "index.tsv", date_time=(2026, 1, 1, 0, 0, 0))
        zi.compress_type = zipfile.ZIP_STORED
        zi.external_attr = 0o644 << 16
        dst.writestr(zi, ("\n".join(index) + "\n").encode("utf-8"))
    return n_app, len(files), len(groups), total


def check(path, sounds):
    """Каждая запись папки sounds — в описи, того же размера; выборка сверена побайтно."""
    files = sound_files(sounds)
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        idx = {}
        for line in z.read(PAK_DIR + "index.tsv").decode("utf-8").splitlines():
            rel, k, off, n = line.split("\t")
            idx[rel] = (int(k), int(off), int(n))
        missing = [rel for rel, _ in files if rel not in idx]
        wrong = [rel for rel, p in files if rel in idx and idx[rel][2] != os.path.getsize(p)]
        packs = sorted({k for k, _, _ in idx.values()})
        stored = all(z.getinfo(f"{PAK_DIR}p{k}.pak").compress_type == zipfile.ZIP_STORED for k in packs)
        # побайтная сверка: первые, последние и ещё двести случайных записей
        rnd = random.Random(17)
        sample = files[:20] + files[-20:] + rnd.sample(files, min(200, len(files)))
        bad = []
        for rel, p in sample:
            k, off, n = idx[rel]
            with z.open(f"{PAK_DIR}p{k}.pak") as f:
                f.seek(off)
                if f.read(n) != open(p, "rb").read():
                    bad.append(rel)
    return missing, wrong + bad, len(names), len(packs), stored


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    apk, sounds, out = sys.argv[1:]
    a, s, packs, t = build(apk, sounds, out)
    missing, wrong, n, packs2, stored = check(out, sounds)
    size = os.path.getsize(out)
    print(f"полный APK: файлов игры {a}, записей {s} ({t / 1e9:.2f} ГБ) в {packs} связках, всего в архиве {n}; "
          f"{size / 1e9:.2f} ГБ{', ZIP64' if size >= 1 << 32 else ''}")
    if missing or wrong or not stored or packs2 != packs:
        sys.exit(f"нет в описи: {missing[:3]}; не тот размер или не те байты: {wrong[:3]}; без сжатия: {stored}")
