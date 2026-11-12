#!/usr/bin/env python3.13
"""src_tail.py "слова отрезка" [знак] — откуда взят хвост последнего слова: куски (запись, t0, t1) и кадры источника
вокруг последнего куска с разметкой звуков: виден ли провал между согласным и гласным в самой записи."""
import sys, os, json, math, numpy as np
sys.path.insert(0, "/root/S/us2"); sys.path.insert(0, "/root/S/us2/dbg")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, tail as T
SR = 24000
S = E.Синтезатор("m", None)
слова = sys.argv[1].split(); S._знак_отрезка = sys.argv[2] if len(sys.argv) > 2 else "!"
x, res, кс = S.отрезок(слова, S._знак_отрезка)
print("виды:", getattr(S, "стыки_отрезка_виды", None))
ч = S.из_частей(слова[-1]) if hasattr(S, "из_частей") else None
print("части:", [(c[0], round(c[1], 3), round(c[2], 3), c[3], c[4]) for c in (ч or [])])
if ч:
    ri, t0, t1 = ч[-1][:3]; r = S.V.recs[ri]; w = S.V.звук(ri)
    print("запись:", r.get("id") or r.get("f"), "|", " ".join(str(z[0]) for z in r["w"])[-90:])
    for ph in r.get("ph", []):
        for z in ph or []:
            if t0 - 0.12 <= float(z[2]) <= t1 + 0.05: print("   звук", z[0], round(float(z[2]), 3), round(float(z[3]), 3))
    a = int((t0 - 0.06) * SR); b = min(len(w), int((t1 + 0.03) * SR)); N = int(SR * 0.03); h = int(SR * 0.005)
    for k in range(max(0, a), b - N, h):
        s = np.asarray(w[k:k + N], dtype=np.float64); f, rr = T.период(s); t = (k + N / 2) / SR
        print(f"   {t:6.3f} с {E._db(np.asarray(w[k + N // 2 - h:k + N // 2 + h], dtype=np.float64)):6.1f} дБ {f:5.0f} Гц голос {rr:4.2f} верх/низ {T.наклон(s):6.1f}{'  ← начало куска' if abs(t - t0) < 0.0026 else ''}{'  ← конец куска' if abs(t - t1) < 0.0026 else ''}")
