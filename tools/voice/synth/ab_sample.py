#!/usr/bin/env python3.13
"""ab_sample.py МЕТКА веса — те же 12 фраз пробы (test_set.json) с заданными весами, без распознавания: для сравнения
на слух (игрок слышит тоньше мерок). Итог: out/<МЕТКА>_m.flac."""
import sys, os, json
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[:12]
S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 else None); части = []
for ф in фразы: части += [S.сказать(ф)[0], np.zeros(E.SR, np.float32)]
sf.write(f"/root/S/us2/out/{sys.argv[1]}_m.flac", np.concatenate(части), E.SR, subtype="PCM_16"); print("готово", sys.argv[1])
