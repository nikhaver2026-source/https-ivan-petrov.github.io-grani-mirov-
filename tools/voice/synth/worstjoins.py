import sys, os, json, collections
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def шов(y, p, L=480):
    if p - L < 0 or p + L > len(y): return None
    a, b = y[p - L:p], y[p:p + L]
    if E._db(a) < -50 or E._db(b) < -50: return None
    return float(np.linalg.norm(E._mfcc(a)[1:] - E._mfcc(b)[1:])), E._db(a), E._db(b)
S = E.Синтезатор("m", {"октава_точно": 1}); V = S.V
фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:200]
худшие = []; виды = collections.Counter(); виды_все = collections.Counter()
def край(кусок, сторона):
    ri, s_, e_, j, вид, o = кусок; r = V.recs[ri]
    if вид != "o" or "ph" not in r: return "?"
    if сторона < 0: return r["ph"][j][-1][0]
    ws = r["w"]; j0 = next((q for q in range(j, -1, -1) if abs(ws[q][1] - s_) < 0.03), None)
    return "?" if j0 is None else r["ph"][j0][0][0]
for ф in фразы:
    for от in E.текст_в_отрезки(ф):
        x, res, кс = S.отрезок(от["w"], от["end"])
        for k, p in enumerate(S.стыки_отрезка):
            m = шов(x, p)
            if not m: continue
            пара = (край(кс[k], -1), край(кс[k + 1], 0)); виды_все[S.виды_отрезка[k]] += 1
            if m[0] > 68.7:
                виды[S.виды_отрезка[k]] += 1; худшие.append((round(m[0]), round(m[1]), round(m[2]), пара, S.виды_отрезка[k], ф[:40]))
print("резких по видам стыка:", dict(виды), "всего по видам:", dict(виды_все))
кл = collections.Counter(E.Синтезатор._класс_звука(a) + "→" + E.Синтезатор._класс_звука(b) if hasattr(E.Синтезатор, "_класс_звука") else str((a, b)) for *_, (a, b), _, _ in [(h[0], h[1], h[2], h[3], h[4], h[5]) for h in худшие])
print("по классам краевых звуков:", кл.most_common(10))
for h in sorted(худшие, reverse=True)[:25]: print(h)
