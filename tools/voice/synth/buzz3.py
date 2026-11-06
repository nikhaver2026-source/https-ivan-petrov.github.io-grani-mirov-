#!/usr/bin/env python3.13
"""buzz3.py — жужжание 200 Гц в глухих местах точнее: спектр огибающей шума выше 3 кГц в незвонких громких кадрах
(окна 40 мс); мерка — мощность на 190–210 Гц относительно соседних полос 120–180 и 220–280 Гц, дБ. Склейка окон по
5 мс несвязанного шума даёт дрожь громкости ровно с этим шагом."""
import sys
import numpy as np
sys.path.insert(0, "/root/S/us2")
import psola


def пик200(a, sr=24000):
    X = np.fft.rfft(a); f = np.fft.rfftfreq(len(a), 1 / sr); X[f < 3000] = 0; h = np.fft.irfft(X, len(a))
    env = np.abs(h); f0, hop = psola._f0_дорожка(a); P = None; n = 0
    W = 960; ff = np.fft.rfftfreq(W * 4, 1 / sr); ок = np.hanning(W)
    for i in range(0, len(f0) - 4, 2):
        s0 = i * hop
        if s0 + W > len(a) or (f0[i:i + 4] > 0).any(): continue
        if np.sqrt(np.mean(h[s0:s0 + W] ** 2)) < 0.01: continue
        e = env[s0:s0 + W]; e = (e - e.mean()) * ок
        p = np.abs(np.fft.rfft(e, W * 4)) ** 2; P = p if P is None else P + p; n += 1
    return P, n, ff


def мерка(P, ff):
    ц = P[(ff >= 190) & (ff <= 210)].mean(); с = np.r_[P[(ff >= 120) & (ff <= 180)], P[(ff >= 220) & (ff <= 280)]].mean()
    return 10 * np.log10(ц / с)


if __name__ == "__main__":   # buzz3.py N веса… — синтез первых N фраз набора; «живые» — случайные записи
    import os, json
    os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
    import engine as E
    N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
    for арг in sys.argv[2:]:
        if арг == "живые":
            V = E.Синтезатор("m").V; import random; random.seed(5); звуки = (V.звук(ri) for ri in random.sample(range(len(V.recs)), N))
        else:
            S = E.Синтезатор("m", json.loads(арг)); звуки = (S.сказать(ф)[0] for ф in фразы)
        PP = None; nn = 0
        for a in звуки:
            P, n, ff = пик200(a)
            if P is not None: PP = P if PP is None else PP + P; nn += n
        print(f"{арг}: окон {nn}, пик 200 Гц {мерка(PP, ff):+.2f} дБ", flush=True)
