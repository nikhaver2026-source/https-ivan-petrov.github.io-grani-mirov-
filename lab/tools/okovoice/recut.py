#!/usr/bin/env python3
"""Голос ОКО: нарезать заново сохранённые записи пакетов.

    GEMINI_API_KEYS=… python3 lab/tools/okovoice/recut.py [--work ПАПКА] [--all]

Записи пакетов лежат в --work (как у run.py), рядом с каждой — <запись>.json: состав
пакета и итог нарезки. Квота записи не тратится — только запросы «что слышно» (seg.py).
Берутся записи, ещё не нарезанные (--all — и нарезанные, у кого не всё принято).
run.py делает то же сам в начале каждого запуска. В конце — manifest.py.
"""
import argparse, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import run  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=os.environ.get("OKOVOICE_WORK", "/tmp/okovoice_work"))
    ap.add_argument("--all", action="store_true", help="и записи, где уже не всё принято")
    a = ap.parse_args()
    run.LOG = open(os.path.join(a.work, "run.log"), "a", encoding="utf-8")
    ks = run.keys_env()
    if not ks:
        sys.exit("нет ключей Gemini в окружении (GEMINI_API_KEYS)")
    got, total = run.recut(a.work, ks, a.all)
    subprocess.run([sys.executable, os.path.join(HERE, "manifest.py")], check=True)
    run.log(f"итог нарезки: принято {got} из {total}")


if __name__ == "__main__":
    main()
