#!/usr/bin/env python3.13
"""buzz2.py N [веса…] — жужжание в глухих местах (повторяемость огибающей выше 3 кГц с шагом 4–6 мс, как buzz.py):
синтез первых N фраз набора при разных весах + живые записи для сравнения."""
import sys, os, json
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola


def жужжание(a, sr=24000):
    X = np.fft.rfft(a); f = np.fft.rfftfreq(len(a), 1 / sr); X[f < 3000] = 0; h = np.fft.irfft(X, len(a))
    env = np.convolve(np.abs(h), np.ones(24) / 24, "same")
    f0, hop = psola._f0_дорожка(a); вз = []
    for i in range(len(f0)):
        s0, s1 = i * hop, i * hop + 960
        if s1 > len(a) or f0[i] > 0: continue
        if np.sqrt(np.mean(h[s0:s1] ** 2)) < 0.01: continue
        e = env[s0:s1] - env[s0:s1].mean(); den = np.dot(e, e) + 1e-12
        вз.append(max(np.dot(e[:-L], e[L:]) / den for L in range(96, 145, 6)))
    return вз


if __name__ == "__main__":
    N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
    for арг in sys.argv[2:]:
        if арг == "живые":
            V = E.Синтезатор("m").V; import random; random.seed(5); вз = []
            for ri in random.sample(range(len(V.recs)), N): вз += жужжание(V.звук(ri))
        else:
            S = E.Синтезатор("m", json.loads(арг)); вз = []
            for ф in фразы: вз += жужжание(S.сказать(ф)[0])
        вз = np.array(вз); print(f"{арг}: глухих кадров {len(вз)}, повторяемость {вз.mean():.3f}, доля > 0,5 {np.mean(вз > 0.5):.1%}", flush=True)
