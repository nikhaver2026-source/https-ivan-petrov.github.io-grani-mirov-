#!/usr/bin/env python3.13
"""timbre_probe.py — расстояние огибающих спектра (как в сглаживании тембра) на настоящих границах слов без паузы
в живой речи: какой скачок тембра естествен. По обзору Чаппелла и Хансена сглаживать стоит только швы грубее живых."""
import sys, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
S = E.Синтезатор("m"); V = S.V; SR = E.SR; W = int(SR * 0.025)
random.seed(1); рас = []; пары = {}; кз = E.Синтезатор._класс_звука
for ri in random.sample(range(len(V.recs)), 2500):
    if ri in V.искл_ri: continue
    r = V.recs[ri]; a = V.звук(ri)
    for j in range(len(r["w"]) - 1):
        w1, w2 = r["w"][j], r["w"][j + 1]
        if w1[4] > 0.03 or w2[1] - w1[2] > 0.03: continue
        p = int((w1[2] + w2[1]) / 2 * SR)
        if p - W < 0 or p + W > len(a): continue
        x, y = a[p - W:p], a[p:p + W]
        if E._db(x) < -45 or E._db(y) < -45: continue
        ea, eb = S._огибающая(x), S._огибающая(y)
        if ea is None or eb is None: continue
        d = float(np.mean(np.abs(ea - eb))); рас.append(d)
        if "ph" in r and r["ph"][j] and r["ph"][j + 1]: пары.setdefault(кз(r["ph"][j][-1][0]) + кз(r["ph"][j + 1][0][0]), []).append(d)
рас = np.array(рас)
print("живых границ", len(рас), "расстояние огибающих: медиана %.3f, 75 %% %.3f, 90 %% %.3f, 95 %% %.3f" % tuple(np.percentile(рас, q) for q in (50, 75, 90, 95)))
for k in sorted(пары, key=lambda k: -len(пары[k])):
    v = np.array(пары[k])
    if len(v) >= 40: print("  %s: %5d  медиана %.2f  75 %% %.2f  90 %% %.2f" % (k, len(v), *np.percentile(v, (50, 75, 90))))
