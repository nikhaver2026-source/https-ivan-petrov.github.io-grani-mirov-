"""Сверяет игровые ресурсы внутри APK или Windows ZIP с исходными файлами."""
import argparse
import hashlib
from pathlib import Path
from zipfile import ZipFile

def sha256(stream):
    digest = hashlib.sha256()
    for data in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(data)
    return digest.digest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1]
    android = args.package.suffix.lower() == ".apk"
    with ZipFile(args.package) as archive:
        entries = archive.namelist()
        if len(set(entries)) != len(entries):
            raise ValueError("В пакете повторяются пути")
        roots = [n[:-len("index.html")] for n in entries
                 if (n == "assets/www/index.html" if android else n.endswith("/resources/game/index.html"))]
        if len(roots) != 1:
            raise ValueError("Не найдена единственная игровая страница")
        root = roots[0]
        expected = [source / n for n in ("index.html", "icon-192.png", "icon-512.png")]
        for folder in ("js", "espeak", "sounds"):
            expected.extend(p for p in (source / folder).rglob("*") if p.is_file())
        if "ready: true" not in (source / "js/oko_voiced.js").read_text(encoding="utf8"):
            expected = [p for p in expected if source / "sounds/oko" not in p.parents]
        expected_names = {p.relative_to(source).as_posix() for p in expected}
        packaged_names = {n[len(root):] for n in entries if n.startswith(root) and not n.endswith("/")}
        if expected_names != packaged_names:
            raise ValueError(f"Отсутствуют {sorted(expected_names-packaged_names)[:12]}, лишние {sorted(packaged_names-expected_names)[:12]}")
        for path in expected:
            name = path.relative_to(source).as_posix()
            with path.open("rb") as original, archive.open(root + name) as packed:
                if sha256(original) != sha256(packed):
                    raise ValueError("Отличается содержимое " + name)
        residents = sum(n.startswith("sounds/residents/") and n.endswith(".wav") for n in expected_names)
        print(f"Ресурсы совпадают: {len(expected_names)} файлов, записей жителей: {residents}")
if __name__ == "__main__":
    main()
