#!/usr/bin/env python3.13
"""jitter.py — неровность периодов голоса (джиттер, %) и мерцание громкости периодов (шиммер, %) в звонких местах:
синтез с разными обработками и живая речь. Высокий джиттер/шиммер слышен как треск, хрип."""
import sys, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E, psola
def меры(y):
    f0, hop = psola._f0_дорожка(y); дж, шм = [], []
    for i in range(1, len(f0) - 1):
        if f0[i - 1] <= 0 or f0[i] <= 0 or f0[i + 1] <= 0: continue
        T = E.SR / f0[i]; c = i * hop; seg = y[int(c - 2 * T):int(c + 3 * T)]
        if len(seg) < 4 * T: continue
        # периоды: пики через автокорреляцию — точное положение максимумов в каждом периоде
        pk = []; p = int(np.argmax(np.abs(seg[:int(T)])))
        while p + int(1.3 * T) < len(seg):
            lo, hi = p + int(0.7 * T), p + int(1.3 * T); q = lo + int(np.argmax(np.abs(seg[lo:hi]))); pk.append(q); p = q
        if len(pk) < 3: continue
        Ts = np.diff(pk); A = np.abs(seg[pk])
        дж.append(np.mean(np.abs(np.diff(Ts))) / np.mean(Ts)); шм.append(np.mean(np.abs(np.diff(A))) / (np.mean(A) + 1e-9))
    return дж, шм
фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[:40]
for имя, w in (("всё (40)", {}), ("без PSOLA-высоты", {"сгладить": 0}), ("без PSOLA-темпа", {"ровный_темп": 0}),
               ("без обоих PSOLA", {"сгладить": 0, "ровный_темп": 0}), ("без сглаживания тембра", {"тембр_шов": 0})):
    S = E.Синтезатор("m", w); дж, шм = [], []
    for ф in фразы:
        a, b = меры(S.сказать(ф)[0]); дж += a; шм += b
    print(f"{имя:>24}: джиттер {100 * np.mean(дж):.2f} %, шиммер {100 * np.mean(шм):.2f} %, доля кадров с джиттером > 5 %: {np.mean(np.array(дж) > 0.05):.1%}", flush=True)
V = S.V; random.seed(4); дж, шм = [], []
for ri in random.sample(range(20000), 80):
    if ri in V.искл_ri: continue
    a, b = меры(V.звук(ri).astype(np.float32)); дж += a; шм += b
print(f"{'живая речь':>24}: джиттер {100 * np.mean(дж):.2f} %, шиммер {100 * np.mean(шм):.2f} %, доля кадров с джиттером > 5 %: {np.mean(np.array(дж) > 0.05):.1%}")
