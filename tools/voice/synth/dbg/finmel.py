#!/usr/bin/env python3.13
"""finmel.py [N] — живая речь: мелодия конца фразы. Для последнего слова записи (≥ 3 слов): высота ударного гласного
к медиане высоты гласных всех предыдущих слов (пт), начало ударного гласного к его концу (ход внутри), последний
безударный гласный к ударному. Отдельно концы перед точкой и перед восклицательным знаком."""
import sys, os, json, math, random, numpy as np
sys.path.insert(0, "/root/S/us2"); sys.path.insert(0, "/root/S/us2/dbg")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, tail as T
SR = 24000
S = E.Синтезатор("m", None); V = S.V; random.seed(7)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 300
вх = {(r_, j_): o for o, (r_, j_) in enumerate(V.occ)}
def f0(w, t0, t1):
    a, b = int(t0 * SR), int(t1 * SR); n = 720
    v = [T.период(np.asarray(w[k:k + n], dtype=np.float64)) for k in range(a, max(a + 1, b - n + 1), 240)]
    return [f for f, r in v if r > 0.6 and 70 < f < 350]
recs = [ri for ri, r in enumerate(V.recs) if "ph" in r and len(r["w"]) >= 3]; random.shuffle(recs)
R = {".": [], "!": []}; ВСЕ = []
for ri in recs:
    r = V.recs[ri]; ws = r["w"]; j = len(ws) - 1
    if j >= len(r["ph"]) or not r["ph"][j]: continue
    o = вх.get((ri, j)); зн = V.знак(o) if o is not None else None
    if зн not in R: continue
    ph = r["ph"][j]; гл = [z for z in ph if str(z[0]).lower() in "аиуыэо"]; уд = [z for z in гл if str(z[0]).isupper()]
    if len(уд) != 1: continue
    w = V.звук(ri); пред = []
    for q in range(j):
        for z in r["ph"][q] or []:
            if str(z[0]).lower() in "аиуыэо": пред += f0(w, float(z[2]), float(z[3]))
    у = f0(w, float(уд[0][2]), float(уд[0][3]))
    if len(пред) < 6 or len(у) < 2: continue
    мп = float(np.median(пред)); ВСЕ.append(мп); d = dict(уд=12 * math.log2(float(np.median(у)) / мп), ход=12 * math.log2(у[-1] / у[0]) if len(у) >= 3 else None, нач=12 * math.log2(у[0] / мп))
    if гл[-1] is not уд[0]:
        к = f0(w, float(гл[-1][2]), float(гл[-1][3]))
        if len(к) >= 2: d["кон"] = 12 * math.log2(float(np.median(к)) / float(np.median(у))); d["кон_к_фразе"] = 12 * math.log2(к[-1] / мп)
    R[зн].append(d)
    if len(R["."]) >= N and len(R["!"]) >= N // 3: break
q = lambda v, p: round(float(np.percentile(v, p)), 1)
print(f"медиана высоты гласных до последнего слова: {q(ВСЕ,50)} Гц (25 % {q(ВСЕ,25)}, 75 % {q(ВСЕ,75)})")
for зн, L in R.items():
    print(f"конец перед «{зн}»: слов {len(L)}")
    for k, имя in (("уд", "ударный гласный к фразе"), ("нач", "начало ударного к фразе"), ("ход", "ход внутри ударного"), ("кон", "последний безударный к ударному"), ("кон_к_фразе", "самый конец к фразе")):
        v = [d[k] for d in L if d.get(k) is not None]
        if v: print(f"   {имя}: 25 % {q(v,25)}, медиана {q(v,50)}, 75 % {q(v,75)} пт ({len(v)})")
