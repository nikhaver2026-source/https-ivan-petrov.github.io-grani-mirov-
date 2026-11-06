#!/usr/bin/env python3.13
"""joinclick.py [веса] — щелчок на стыке: энергия высоких частот (выше 3 кГц) в ±1,5 мс у точки стыка против энергии
в окрестности 5–15 мс (дБ). У живой речи — то же на настоящих границах слов без паузы."""
import sys, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
def вч(y):
    X = np.fft.rfft(y.astype(np.float64)); f = np.fft.rfftfreq(len(y), 1 / E.SR); X[f < 3000] = 0; return np.fft.irfft(X, len(y))
def щелчок(h, p):
    a = int(E.SR * 0.0015); b0, b1 = int(E.SR * 0.005), int(E.SR * 0.015)
    if p - b1 < 0 or p + b1 > len(h): return None
    ц = np.mean(h[p - a:p + a] ** 2) + 1e-12; о = np.mean(np.r_[h[p - b1:p - b0], h[p + b0:p + b1]] ** 2) + 1e-12
    return 10 * np.log10(ц / о)
веса = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
S = E.Синтезатор("m", веса); фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[:80]
xs = []; по_виду = {}
for ф in фразы:
    y, _ = S.сказать(ф); h = вч(y)
    for p, вид in zip(S.стыки, S.стыки_виды):
        v = щелчок(h, p)
        if v is not None: xs.append(v); по_виду.setdefault(вид, []).append(v)
xs = np.array(xs)
for вид, v in по_виду.items(): v = np.array(v); print(f"  {вид}: стыков {len(v)}, > 6 дБ {np.mean(v > 6):.1%}, > 10 дБ {np.mean(v > 10):.1%}")
print(f"синтез {веса}: стыков {len(xs)}, перевес ВЧ у точки стыка: средний {xs.mean():+.2f} дБ, доля > 6 дБ {np.mean(xs > 6):.1%}, > 10 дБ {np.mean(xs > 10):.1%}")
V = S.V; random.seed(4); ys = []
for ri in random.sample(range(20000), 300):
    r = V.recs[ri]
    if "ph" not in r or ri in V.искл_ri: continue
    a = V.звук(ri); h = вч(a)
    for k in range(len(r["w"]) - 1):
        if r["w"][k][4] < 0.005:
            v = щелчок(h, int(r["w"][k][2] * E.SR))
            if v is not None: ys.append(v)
ys = np.array(ys)
print(f"живая речь: границ {len(ys)}, перевес ВЧ: средний {ys.mean():+.2f} дБ, доля > 6 дБ {np.mean(ys > 6):.1%}, > 10 дБ {np.mean(ys > 10):.1%}")
