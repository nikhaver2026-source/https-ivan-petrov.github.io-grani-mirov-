#!/usr/bin/env python3.13
"""buzz.py файлы… — призвук «жужжание» в глухих местах: повторяемость огибающей высокочастотной части (выше 3 кГц)
с шагом 4–6 мс в незвонких громких кадрах (норм. автокорреляция огибающей). У живой речи — низкая."""
import sys
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import psola
for p in sys.argv[1:]:
    a, sr = sf.read(p, dtype="float32")
    X = np.fft.rfft(a); f = np.fft.rfftfreq(len(a), 1 / sr); X[f < 3000] = 0; h = np.fft.irfft(X, len(a))
    env = np.abs(h); k = np.ones(24) / 24; env = np.convolve(env, k, "same")   # огибающая (1 мс)
    f0, hop = psola._f0_дорожка(a)
    вз = []
    for i in range(len(f0)):
        s0, s1 = i * hop, i * hop + 960
        if s1 > len(a) or f0[i] > 0: continue
        e = env[s0:s1]
        if np.sqrt(np.mean(h[s0:s1] ** 2)) < 0.01: continue
        e = e - e.mean(); den = np.dot(e, e) + 1e-12
        вз.append(max(np.dot(e[:-L], e[L:]) / den for L in range(96, 145, 6)))
    print(f"{p.split('/')[-1]}: глухих кадров {len(вз)}, повторяемость 4–6 мс: средняя {np.mean(вз):.3f}, доля > 0,5: {np.mean(np.array(вз) > 0.5):.1%}")
