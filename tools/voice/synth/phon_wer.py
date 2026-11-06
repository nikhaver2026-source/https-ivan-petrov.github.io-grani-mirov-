#!/usr/bin/env python3.13
"""phon_wer.py diag_<метка>.json — доля слов с ошибкой ПО ЗВУКАМ: услышанное слово, произносимое так же, как нужное
(безударные окончания: «золота»/«золото», «драки»/«драке»), ошибкой не считается."""
import sys, json
sys.path.insert(0, "/root/S/us2")
import fon
def тр(w):
    try: return "".join({"э": "и", "о": "а"}.get(z, z).lower() for z, _ in fon.слово(w))
    except Exception: return w
z = json.load(open(sys.argv[1], encoding="utf-8")); всего = ош_буквы = ош_звуки = 0; по_ед = {}
for r in z:
    for x in r["слова"]:
        всего += 1; e1 = bool(x["вид"]); e2 = e1 and (тр(x["w"]) != тр(x["h"]) or bool(x.get("вставка_до")))
        ош_буквы += e1; ош_звуки += e2; ед = x.get("ед", "?"); a = по_ед.setdefault(ед, [0, 0, 0]); a[0] += 1; a[1] += e1; a[2] += e2
print(f"слов {всего}: с ошибкой по буквам {ош_буквы / всего:.1%}, по звукам {ош_звуки / всего:.1%}")
for ед, (n, a, b) in по_ед.items(): print(f"  {ед}: слов {n}, по буквам {a / n:.1%}, по звукам {b / n:.1%}")
