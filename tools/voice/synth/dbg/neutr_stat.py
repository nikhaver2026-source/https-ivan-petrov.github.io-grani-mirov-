#!/usr/bin/env python3.13
"""neutr_stat.py [N] — сколько фраз проверочного набора задевает правило «конец_нейтрально» и на сколько полутонов."""
import sys, os, json, numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
Ф = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:int(sys.argv[1]) if len(sys.argv) > 1 else 120]
S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 else None); задето = 0; макс = []; хв = 0; вз = 0; зн = {".": [0, 0], "!": [0, 0], "?": [0, 0]}
for ф in Ф:
    S._конец_сдвиги = []; S._хвост_тише_дб = []; S._в_звуке_сдвиги = []
    S.сказать(ф if isinstance(ф, str) else ф.get("t", ""))
    т = (ф if isinstance(ф, str) else ф.get("t", "")).strip(); к = "!" if т.endswith("!") else "?" if т.endswith("?") else "."
    зн[к][0] += 1
    if S._конец_сдвиги: задето += 1; макс.append(min(min(c[2]) for c in S._конец_сдвиги)); зн[к][1] += 1
    хв += bool(S._хвост_тише_дб); вз += bool(S._в_звуке_сдвиги)
print("по знакам (фраз, задето):", зн, "; сдвиг ≥ 2 пт:", sum(m <= -2 for m in макс))
print(f"фраз {len(Ф)}: нейтральный конец задел {задето}; сдвиг (самый большой во фразе): медиана {np.median(макс):.1f}, до {min(макс):.1f} пт; тихий хвост — {хв} фраз; шов в звуке сглажен — {вз} фраз")
