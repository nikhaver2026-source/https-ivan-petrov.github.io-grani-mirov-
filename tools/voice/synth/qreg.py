#!/usr/bin/env python3.13
"""qreg.py N — что в склейке снижает качество звучания: по фразам DNSMOS (OVRL, SIG) против признаков фразы — швов
на секунду, доля собранных из частей слов, средний скачок спектра/громкости/высоты на швах, доля кусков из
середины записи. Корреляции и линейная регрессия (стандартизованные коэффициенты)."""
import sys, os, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, judge_q
from jumps import высота_шва
SR = 24000


def шов(y, p, L=480):
    if p - L < 0 or p + L > len(y): return None
    a, b = y[p - L:p], y[p:p + L]
    if E._db(a) < -50 or E._db(b) < -50: return None
    return float(np.linalg.norm(E._mfcc(a)[1:] - E._mfcc(b)[1:])), abs(E._db(a) - E._db(b))


N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
S = E.Синтезатор("m"); X = []; Y = []
for ф in фразы:
    y, отч = S.сказать(ф); q = judge_q.оценка(y)
    речь = max(0.3, np.sum(np.abs(y) > 1e-3) / SR)
    сп, гр, вв = [], [], []
    for p in S.стыки:
        m = шов(y, p)
        if m: сп.append(m[0]); гр.append(m[1])
        v = высота_шва(y, p)
        if v is not None: вв.append(v)
    слов = sum(len(o["слова"]) for o in отч); частей = sum(len(o["вне базы"]) for o in отч); кусков = sum(o["кусков"] for o in отч)
    X.append([len(S.стыки) / речь, частей / max(1, слов), кусков / max(1, слов), np.mean(сп) if сп else 35, np.mean(гр) if гр else 5, np.mean(вв) if вв else 1.4, речь])
    Y.append(q)
X = np.array(X); Y = np.array(Y); имена = ["швов/с", "доля частей", "кусков/слово", "скачок спектра", "скачок громкости", "скачок высоты", "длина речи"]
for k, н in enumerate(имена): print(f"{н:>16}: среднее {X[:, k].mean():.2f}; корреляция с OVRL {np.corrcoef(X[:, k], Y[:, 2])[0, 1]:+.2f}, с SIG {np.corrcoef(X[:, k], Y[:, 0])[0, 1]:+.2f}")
Z = (X - X.mean(0)) / (X.std(0) + 1e-9); A = np.c_[Z, np.ones(len(Z))]
w = np.linalg.lstsq(A, Y[:, 2], rcond=None)[0]
print("регрессия OVRL (на одно стандартное отклонение признака):", {н: round(float(v), 3) for н, v in zip(имена, w)})
np.savez("/root/S/us2/out/qreg.npz", X=X, Y=Y)
