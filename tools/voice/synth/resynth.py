#!/usr/bin/env python3.13
"""resynth.py N варианты… — цена самого механизма склейки: живая запись режется на слова по разметке и склеивается
движком обратно (каждое слово — отдельный кусок, соседи те же, что в оригинале). Судья звучания (DNSMOS) и разборчивость
(GigaAM) — оригинал против пересклейки. Разница = потери на швах, краях и обработках, без влияния выбора кусков."""
import sys, os, json, random, re
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E, judge_q
SR = 24000
N = int(sys.argv[1])
S0 = E.Синтезатор("m"); V = S0.V
по_месту = {tuple(V.occ[o]): o for o in range(len(V.occ))}
random.seed(8); recs = []
for ri in random.sample(range(len(V.recs)), 4000):
    r = V.recs[ri]
    if ri in V.искл_ri or "ph" not in r or not (4 <= len(r["w"]) <= 12): continue
    if any(w[4] > 0.12 for w in r["w"][:-1]): continue   # без пауз внутри — один отрезок
    if not all((ri, j) in по_месту for j in range(len(r["w"]))): continue
    recs.append(ri)
    if len(recs) >= N: break


def пересклеить(S, ri):
    r = V.recs[ri]; res = [("o", по_месту[(ri, j)]) for j in range(len(r["w"]))]
    S.витерби = lambda слова, end: res
    def куски(res_):
        out = []
        for u in res_:
            ri_, j = V.occ[u[1]]; w = V.recs[ri_]["w"][j]; s, e = S._края(ri_, j, j, w[1], w[2]); out.append((ri_, s, e, j, "o", u[1]))
        return out
    S.куски = куски
    x, _, _ = S.отрезок([w[0] for w in r["w"]], ".")
    return np.concatenate([np.zeros(int(SR * 0.1), np.float32), x.astype(np.float32), np.zeros(int(SR * 0.2), np.float32)])


ориг = [judge_q.оценка(V.звук(ri)) for ri in recs]; ориг = np.array(ориг)
print(f"оригиналы ({len(recs)} записей): SIG {ориг[:, 0].mean():.3f}, OVRL {ориг[:, 2].mean():.3f}", flush=True)
for арг in sys.argv[2:]:
    S = E.Синтезатор("m", json.loads(арг)); р = np.array([judge_q.оценка(пересклеить(S, ri)) for ri in recs])
    d = р[:, 2] - ориг[:, 2]
    print(f"пересклейка {арг}: SIG {р[:, 0].mean():.3f}, OVRL {р[:, 2].mean():.3f}; против оригинала OVRL {d.mean():+.3f} ± {d.std() / np.sqrt(len(d)):.3f}", flush=True)
