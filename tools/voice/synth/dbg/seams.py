#!/usr/bin/env python3.13
"""seams.py "фраза" [веса] — каждый шов фразы: вид, скачок спектра (против обычного внутри соседних кусков), провал
громкости, скачок высоты, одиночная вспышка верхов; плюс такие же места внутри кусков, где скачок спектра выше, чем
на швах (подозрительные места не на швах)."""
import sys, os, json, math, numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def разбор(S, текст, метка=None, тихо=False):
    r = S.сказать(текст); x = np.asarray(r[0] if isinstance(r, tuple) else r, dtype=np.float64)
    h = int(SR * 0.005); N = int(SR * 0.02)
    кадры = [x[k:k + N] for k in range(0, len(x) - N, h)]
    M = np.array([E._mfcc(c)[1:] for c in кадры]); Eн = np.array([E._db(c) for c in кадры])
    поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]
    громко = Eн > Eн.max() - 30
    обычно = float(np.median(поток[громко])); p95 = float(np.percentile(поток[громко], 95))
    def f0(a, b):
        s = x[max(0, a):b]
        if len(s) < 720: return 0.0
        v = [E._yin_f0(s[i:i + 720]) for i in range(0, len(s) - 720 + 1, 240)]; v = [q for q in v if q > 0]
        return float(np.median(v)) if v else 0.0
    out = []
    for p, вид in zip(S.стыки, S.стыки_виды):
        k = int(p / h); a, b = max(0, k - 6), min(len(поток), k + 3)
        сп = float(поток[a:b].max()) if b > a else 0.0
        л = x[max(0, p - int(0.06 * SR)):max(0, p - int(0.03 * SR))]; п = x[p + int(0.03 * SR):p + int(0.06 * SR)]; ц = x[max(0, p - int(0.01 * SR)):p + int(0.01 * SR)]
        провал = (E._db(ц) - max(E._db(л), E._db(п))) if len(л) > 100 and len(п) > 100 else 0.0
        fл, fп = f0(p - int(0.07 * SR), p - int(0.005 * SR)), f0(p + int(0.005 * SR), p + int(0.07 * SR))
        выс = 12 * math.log2(fп / fл) if fл > 0 and fп > 0 else None
        ур = E._db(x[p + int(0.005 * SR):p + int(0.05 * SR)]) - E._db(x[max(0, p - int(0.05 * SR)):max(1, p - int(0.005 * SR))])
        out.append(dict(t=round(p / SR, 3), вид=вид, спектр=round(сп / обычно, 1), провал=round(провал, 1), уровень=round(ур, 1), высота=None if выс is None else round(выс, 1), f=(round(fл), round(fп))))
    if not тихо:
        print(f"«{текст}»: {len(x) / SR:.2f} с, швов {len(out)}; обычный скачок спектра 1.0, 95 % кадров ниже {p95 / обычно:.1f}")
        for o in out: print("   ", o)
        # подозрительные места вне швов
        швы = [int(p / h) for p in S.стыки]; края = set()
        for k in швы: края.update(range(k - 8, k + 5))
        вне = [(float(поток[k] / обычно), k) for k in range(len(поток)) if громко[k] and k not in края and поток[k] > 1.6 * p95]
        вне.sort(reverse=True)
        print("    вне швов, скачок спектра выше 1,6 × 95 %:", [(round(v, 1), round(k * h / SR, 3)) for v, k in вне[:8]])
    if метка: sf.write(f"/root/S/us2/out/{метка}.flac", x.astype(np.float32), SR)
    return x, out
if __name__ == "__main__":
    S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 else None)
    разбор(S, sys.argv[1], sys.argv[3] if len(sys.argv) > 3 else None)
