#!/usr/bin/env python3.13
"""fraza_var.py ВЫХОД "фраза" веса1 веса2 … — одна фраза в нескольких видах подряд (каждый вид дважды, между видами
1,2 с тишины): для сравнения на слух. Веса — JSON-поправки к весам движка ("{}" — как есть)."""
import sys, os, json
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
S = E.Синтезатор("m", None); база = dict(S.в); части = []
for в in sys.argv[3:]:
    S.в = dict(база); S.в.update(json.loads(в)); x = S.сказать(sys.argv[2])[0]
    части += [x, np.zeros(int(E.SR * 0.6), np.float32), x, np.zeros(int(E.SR * 1.2), np.float32)]
sf.write(sys.argv[1], np.concatenate(части), E.SR, subtype="PCM_16"); print("готово", sys.argv[1], len(sys.argv) - 3, "вида")
