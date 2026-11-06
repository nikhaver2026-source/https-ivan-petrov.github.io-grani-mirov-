#!/usr/bin/env python3.13
"""tails.py N — хвосты распределений на швах: скачок спектра (MFCC, окна 20 мс), громкости и высоты на швах синтеза
против настоящих границ слов без паузы у живой речи; по видам краевых звуков (гласный/сонорный/прочее)."""
import sys, os, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
from jumps import высота_шва
SR = 24000
def шов(y, p, L=480):
    if p - L < 0 or p + L > len(y): return None
    a, b = y[p - L:p], y[p:p + L]
    if E._db(a) < -50 or E._db(b) < -50: return None
    return float(np.linalg.norm(E._mfcc(a)[1:] - E._mfcc(b)[1:])), abs(E._db(a) - E._db(b))
N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}); V = S.V
сп, гр, вв = [], [], []
for ф in фразы:
    y, _ = S.сказать(ф)
    for p in S.стыки:
        m = шов(y, p); v = высота_шва(y, p)
        if m: сп.append(m[0]); гр.append(m[1])
        if v is not None: вв.append(v)
random.seed(3); жс, жг, жв = [], [], []
while len(жс) < 1500:
    ri = random.randrange(len(V.recs)); r = V.recs[ri]
    if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
    j = random.randrange(len(r["w"]) - 1)
    if r["w"][j][4] > 0.005: continue
    y = V.звук(ri); p = int(r["w"][j][2] * SR); m = шов(y, p); v = высота_шва(y, p)
    if m: жс.append(m[0]); жг.append(m[1])
    if v is not None: жв.append(v)
for имя, a, b in (("спектр", сп, жс), ("громкость, дБ", гр, жг), ("высота, пт", вв, жв)):
    a, b = np.array(a), np.array(b)
    print(f"{имя}: синтез n={len(a)} среднее {a.mean():.2f}, 90 % {np.percentile(a, 90):.2f}, 97 % {np.percentile(a, 97):.2f}, 99 % {np.percentile(a, 99):.2f} | живая n={len(b)} среднее {b.mean():.2f}, 90 % {np.percentile(b, 90):.2f}, 97 % {np.percentile(b, 97):.2f}, 99 % {np.percentile(b, 99):.2f}")
    t = np.percentile(b, 97); print(f"   доля сверх 97-го процентиля живой речи ({t:.2f}): синтез {np.mean(a > t):.1%} (живая 3 %)")
