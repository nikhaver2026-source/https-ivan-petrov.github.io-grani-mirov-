#!/usr/bin/env python3.13
"""finlvl.py [N] — живая речь: насколько последний безударный гласный слова в конце фразы тише ударного гласного того
же слова (пик уровня по 20 мс) и ниже по высоте. Мерка для хвостов, собранных из частей."""
import sys, os, json, math, random, numpy as np
sys.path.insert(0, "/root/S/us2"); sys.path.insert(0, "/root/S/us2/dbg")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, tail as T
SR = 24000
S = E.Синтезатор("m", None); V = S.V; random.seed(5)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 300
def пик(w, t0, t1):
    a, b = int(t0 * SR), int(t1 * SR); n = int(SR * 0.02)
    if b - a < n: return None
    return max(E._db(np.asarray(w[k:k + n], dtype=np.float64)) for k in range(a, b - n + 1, n // 4))
def f0(w, t0, t1):
    a, b = int(t0 * SR), int(t1 * SR); n = 720
    v = [T.период(np.asarray(w[k:k + n], dtype=np.float64)) for k in range(a, b - n + 1, 240)]; v = [f for f, r in v if r > 0.6 and f > 0]
    return float(np.median(v)) if v else 0.0
recs = [ri for ri, r in enumerate(V.recs) if "ph" in r and r["w"]]; random.shuffle(recs)
D = []; H = []; Dся = []
for ri in recs:
    r = V.recs[ri]; ws = r["w"]; j = len(ws) - 1; ph = r["ph"][j] if j < len(r["ph"]) else None
    if not ph or len(ph) < 3: continue
    гл = [z for z in ph if str(z[0]).lower() in "аиуыэо"]
    if len(гл) < 2 or ph[-1] is not гл[-1]: continue
    уд = [z for z in гл if str(z[0]).isupper()]
    if len(уд) != 1 or уд[0] is гл[-1]: continue
    w = V.звук(ri); a = пик(w, float(уд[0][2]), float(уд[0][3])); b = пик(w, float(гл[-1][2]), float(гл[-1][3]))
    if a is None or b is None or not (math.isfinite(a) and math.isfinite(b)) or a < -60: continue
    D.append(b - a)
    if str(ph[-2][0]).lower() in "пфктшсхцчщ": Dся.append(b - a)
    fa, fb = f0(w, float(уд[0][2]), float(уд[0][3])), f0(w, float(гл[-1][2]), float(гл[-1][3]))
    if fa > 0 and fb > 0: H.append(12 * math.log2(fb / fa))
    if len(D) >= N: break
q = lambda v, p: round(float(np.percentile(v, p)), 1)
print(f"слов {len(D)}: последний безударный гласный к ударному, дБ: 25 % {q(D,25)}, медиана {q(D,50)}, 75 % {q(D,75)}")
print(f"  после глухого согласного ({len(Dся)}): 25 % {q(Dся,25)}, медиана {q(Dся,50)}, 75 % {q(Dся,75)}")
print(f"  высота ({len(H)}): 25 % {q(H,25)}, медиана {q(H,50)}, 75 % {q(H,75)} пт")
