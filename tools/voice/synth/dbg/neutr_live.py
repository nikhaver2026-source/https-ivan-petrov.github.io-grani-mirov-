#!/usr/bin/env python3.13
"""neutr_live.py [N] — калибровка правила «конец_нейтрально» на живой речи: тот же расчёт (опора — медиана высоты до
последнего слова, потолок = опора + цель, превышение кадров последнего слова) на настоящих записях диктора.
Сколько живых фраз правило задело бы и на сколько — правило не должно «исправлять» живую речь."""
import sys, os, json, math, random, numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
SR = 24000
S = E.Синтезатор("m", None); V = S.V; random.seed(11)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 200
вх = {(r_, j_): o for o, (r_, j_) in enumerate(V.occ)}
def дорожка(x):
    f, _ = psola._f0_дорожка(np.asarray(x, np.float32)); f = np.asarray(f, np.float64); v = f[f > 0]
    if len(v) >= 3:
        м = float(np.median(v)); f[(f > 0) & (np.abs(12 * np.log2(np.maximum(f, 1.0) / м)) > 9)] = 0.0
    return f
recs = [ri for ri, r in enumerate(V.recs) if len(r["w"]) >= 3]; random.shuffle(recs)
R = {".": [], "!": []}
for ri in recs:
    r = V.recs[ri]; ws = r["w"]; j = len(ws) - 1; o = вх.get((ri, j)); зн = V.знак(o) if o is not None else None
    if зн not in R or len(R[зн]) >= N: continue
    w = V.звук(ri); a = int(ws[j][1] * SR)
    if a < SR // 4 or len(w) - a < SR // 10: continue
    пред = дорожка(w[:a]); пред = пред[пред > 0]; f = дорожка(w[a:]); f = f[f > 0]
    if len(пред) < 10 or len(f) < 5: continue
    опора = float(np.median(пред)); прев = 12 * np.log2(f / опора)
    R[зн].append((float(прев.max()), float(np.percentile(прев, 90)), float(np.median(прев))))
    if all(len(v) >= N for v in R.values()): break
q = lambda v, p: round(float(np.percentile(v, p)), 1)
for зн, L in R.items():
    if not L: continue
    мх = [x[0] for x in L]; p90 = [x[1] for x in L]; мед = [x[2] for x in L]
    print(f"перед «{зн}» ({len(L)} фраз): самый высокий кадр последнего слова к опоре: 25 % {q(мх,25)}, медиана {q(мх,50)}, 75 % {q(мх,75)}, 90 % {q(мх,90)} пт; "
          f"90-я доля кадров: медиана {q(p90,50)}, 75 % {q(p90,75)}; медиана слова: {q(мед,50)} (75 % {q(мед,75)})")
    for цель in (-2.5, -1.5, 0.5, 2.0):
        зад = [m for m in мх if 0.8 * (m - цель) > 0.2]; print(f"    цель {цель:+.1f}: правило задело бы {100 * len(зад) / len(L):.0f} % живых фраз; сдвиг ≥ 2 пт — {100 * sum(0.8 * (m - цель) >= 2 for m in мх) / len(L):.0f} %")
