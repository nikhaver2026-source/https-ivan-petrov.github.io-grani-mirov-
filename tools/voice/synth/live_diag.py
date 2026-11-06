#!/usr/bin/env python3.13
"""live_diag.py N — потолок тем же разбором, что diag.py: настоящие записи диктора (случайные N фраз описи от трёх
слов), ошибки по словам — по буквам и по звукам."""
import sys, json, re, random, glob, importlib.util
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import fon
spec = importlib.util.spec_from_file_location("d", "/root/S/us2/diag.py"); src = open("/root/S/us2/diag.py", encoding="utf-8").read()
ns = {}; exec(compile(src.split("def main():")[0].replace('ГОЛОС = sys.argv[1]; a_, b_ = map(int, sys.argv[2].split(":")); МЕТКА = sys.argv[3]', 'ГОЛОС="m"; a_=b_=0; МЕТКА=""').replace("веса = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None", "веса=None"), "diag", "exec"), ns)
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
def тр(w):
    try: return "".join({"э": "и", "о": "а"}.get(z, z).lower() for z, _ in fon.слово(w))
    except Exception: return w
о = sorted(glob.glob(f"{R}/sounds/gvoice/bank_*[0-9].js"), key=lambda x: int(re.search(r"(\d+)\.js$", x).group(1)))[-1]
t = open(о, encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
random.seed(11); items = [kv for kv in random.sample(list(p.items()), 2000) if len(kv[0].split()) >= 3][:int(sys.argv[1])]
всего = е1 = е2 = 0
for k, f in items:
    a, sr = sf.read(f"{R}/sounds/gvoice/{f}.flac", dtype="float32")
    слышно = ns["норм"](ns["узнать"](a))
    for x in ns["разбор_слов"](k, слышно):
        всего += 1; a1 = bool(x["вид"]); a2 = a1 and (тр(x["w"]) != тр(x["h"]) or bool(x.get("вставка_до")))
        е1 += a1; е2 += a2
print(f"живые записи ({len(items)} фраз, {всего} слов): с ошибкой по буквам {е1 / всего:.1%}, по звукам {е2 / всего:.1%}")
