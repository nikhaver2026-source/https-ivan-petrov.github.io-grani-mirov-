#!/usr/bin/env python3.13
"""clicks2.py [веса] — одиночные вспышки по всему сигналу: энергия высоких частот (выше 3 кГц) в окне 1,5 мс выше
медианы И левой (−15…−4 мс), И правой (+4…+15 мс) окрестности на 12 дБ каждой (естественный взрыв смычного обычно
продолжается придыханием или гласной справа). Где: у стыка слов, у стыка частей, у края отрезка, внутри куска."""
import sys, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
def вч(y):
    X = np.fft.rfft(y.astype(np.float64)); f = np.fft.rfftfreq(len(y), 1 / E.SR); X[f < 3000] = 0; return np.fft.irfft(X, len(y))
def вспышки(y, порог=12.0):
    h = вч(y); w = 36; n = len(h) // w
    e = 10 * np.log10(np.mean(h[:n * w].reshape(n, w) ** 2, axis=1) + 1e-12)
    out = []
    for i in range(11, n - 11):
        л = np.median(e[i - 10:i - 2]); п = np.median(e[i + 3:i + 11])
        if e[i] - л > порог and e[i] - п > порог and e[i] > -60 and e[i] == e[i - 1:i + 2].max(): out.append(i * w + w // 2)
    return out
веса = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
S = E.Синтезатор("m", веса); фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[:80]
сек = 0; где = {}; примеры = []
orig = S.отрезок; края = []
def отр(слова, end):
    x, res, кс = orig(слова, end); края.append(len(x)); return x, res, кс
S.отрезок = отр
for ф in фразы:
    края.clear(); y, _ = S.сказать(ф); сек += len(y) / E.SR
    # границы отрезков в итоговом сигнале
    гран = []; поз = int(E.SR * 0.10)
    for L_, от in zip(края, E.текст_в_отрезки(ф)):
        гран += [поз, поз + L_]; поз += L_ + int(E.SR * E.ПАУЗА.get(от["end"], 0.2))
    for c in вспышки(y):
        d_ст = min([abs(c - p) for p in S.стыки] + [10 ** 9]); i_ст = int(np.argmin([abs(c - p) for p in S.стыки])) if S.стыки else -1
        if d_ст < int(E.SR * 0.012): вид = "у стыка: " + S.стыки_виды[i_ст]
        elif min([abs(c - g) for g in гран] + [10 ** 9]) < int(E.SR * 0.015): вид = "у края отрезка"
        else: вид = "внутри куска"
        где[вид] = где.get(вид, 0) + 1
        if len(примеры) < 15: примеры.append((ф[:35], round(c / E.SR, 3), вид))
print(f"синтез {веса}: вспышек {sum(где.values())} на {сек:.0f} с ({sum(где.values()) / сек:.2f} в секунду): {где}")
for p in примеры: print("  ", p)
V = S.V; random.seed(4); вс = 0; с2 = 0.0
for ri in random.sample(range(20000), 150):
    if ri in V.искл_ri: continue
    y = V.звук(ri); с2 += len(y) / E.SR; вс += len(вспышки(y))
print(f"живая речь: вспышек {вс} на {с2:.0f} с ({вс / с2:.2f} в секунду)")
