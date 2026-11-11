#!/usr/bin/env python3.13
"""seg.py "слова отрезка" [знак] [метка] — отрезок: куски, уровень и высота каждого куска, огибающая хвоста; запись в out/."""
import sys, os, json, math, numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def разбор(S, слова, end="!", метка=None, тихо=False):
    x, res, кс = S.отрезок(слова, end); st = [0] + list(S.стыки_отрезка) + [len(x)]
    out = []
    for k in range(len(st) - 1):
        s = x[st[k]:st[k + 1]]
        if len(s) < 64: continue
        db = 10 * math.log10(float(np.mean(s ** 2)) + 1e-10); пик = 20 * math.log10(float(np.abs(s).max()) + 1e-9)
        fs = [E._yin_f0(s[i:i + 720]) for i in range(0, len(s) - 720 + 1, 240)] if len(s) >= 720 else []; f = np.array([v for v in fs if v and v > 0])
        ri, s_, e_, j, вид, o = кс[k] if k < len(кс) else (None,) * 6
        out.append(dict(k=k, мс=round(1000 * len(s) / SR), дб=round(db, 1), пик=round(пик, 1), f0=round(float(np.median(f)), 0) if len(f) else 0, ист=S.V.recs[ri]["f"] if ri is not None else "?", вид=вид))
    if not тихо:
        for o in out: print("  ", o)
        print("   швы:", list(zip([round(p / SR, 3) for p in S.стыки_отрезка], S.виды_отрезка)))
        h = int(SR * 0.01); хв = x[-int(0.30 * SR):]; ст = " ▁▂▃▄▅▆▇█"; pk = np.abs(x).max()
        print("   хвост 300 мс:", "".join(ст[int(np.clip((20 * math.log10(max(1e-9, math.sqrt(float(np.mean(хв[i:i + h] ** 2)))) / pk) + 54) / 54 * 8, 0, 8))] for i in range(0, len(хв) - h + 1, h)))
    if метка: sf.write(f"/root/S/us2/out/{метка}.flac", x, SR)
    return x, out, кс
if __name__ == "__main__":
    S = E.Синтезатор("m")
    разбор(S, sys.argv[1].split(), sys.argv[2] if len(sys.argv) > 2 else "!", sys.argv[3] if len(sys.argv) > 3 else None)
