#!/usr/bin/env python3
"""ci2.py — сверка записей Gemini: каждая запись описи лежит на диске, каждый файл папки есть в описи,
и игра подключает последнюю опись каждого голоса. Запуск из папки репозитория."""
import os, re, json, glob, sys
плохо = []; всего = 0
idx = open("index.html", encoding="utf-8").read()
for папка, имя in [("gvoice", "bank_"), ("gvoice_f", "bank_f")]:
    D = f"sounds/{папка}"
    описи = sorted(glob.glob(f"{D}/{имя}[0-9]*.js"), key=lambda f: int(re.search(r"(\d+)\.js$", f).group(1)))
    if len(описи) != 1: плохо.append(f"{папка}: описей {len(описи)}")
    о = описи[-1]; t = open(о, encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
    файлы = {f[:-5] for f in os.listdir(D) if f.endswith(".flac")}
    нет = [v for v in set(p.values()) if v not in файлы]; лишние = [f for f in файлы if f not in set(p.values())]
    if нет: плохо.append(f"{папка}: нет файлов {len(нет)}: {нет[:5]}")
    if лишние: плохо.append(f"{папка}: не задействованы {len(лишние)}: {sorted(лишние)[:5]}")
    if f'url:"sounds/{папка}/{os.path.basename(о)}"' not in idx: плохо.append(f"{папка}: игра не подключает {os.path.basename(о)}")
    всего += len(p)
print("Все записи на месте и все задействованы" if not плохо else "Сбои:\n" + "\n".join(плохо), f"({всего})")
sys.exit(1 if плохо else 0)
