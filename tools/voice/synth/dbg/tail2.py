#!/usr/bin/env python3.13
"""tail2.py "фраза" t0 t1 ШИРЕ … — доля голоса по кадрам в окне [t0, t1] с при разных значениях psola.ШИРЕ."""
import sys, os, numpy as np
sys.path.insert(0, "/root/S/us2"); sys.path.insert(0, "/root/S/us2/dbg")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola, tail as T
SR = 24000; S = E.Синтезатор("m", None); t0, t1 = float(sys.argv[2]), float(sys.argv[3])
for ш in sys.argv[4:]:
    psola.ШИРЕ = int(ш); x = np.asarray(S.сказать(sys.argv[1])[0], np.float64); N = int(SR * 0.03); out = []
    for k in range(int(t0 * SR), int(t1 * SR), int(SR * 0.005)):
        f, r = T.период(x[k:k + N]); out.append(f"{int(f)}/{r:.2f}")
    print("ШИРЕ", ш, ":", " ".join(out))
