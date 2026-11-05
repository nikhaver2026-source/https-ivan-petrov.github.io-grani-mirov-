#!/usr/bin/env python3.13
"""psola.py — сдвиг высоты голоса по периодам основного тона (TD-PSOLA) без изменения тембра и длительности.
сдвинуть(x, сдвиг_пт) — сдвиг_пт: число или массив полутонов на каждый отсчёт (плавные переходы высоты)."""
import math
import numpy as np

SR = 24000


def _f0_дорожка(x, hop=240, fmin=70, fmax=400):
    """Высота по кадрам 10 мс (упрощённый YIN); 0 — глухо."""
    W = int(SR * 0.03); tmin, tmax = int(SR / fmax), int(SR / fmin)
    out = []
    for c in range(0, len(x), hop):
        a = x[max(0, c - W // 2):max(0, c - W // 2) + W + tmax]
        if len(a) < W + tmax or np.sqrt(np.mean(a ** 2)) < 2e-3: out.append(0.0); continue
        a = a - a.mean(); w = a[:W]
        r = np.correlate(a, w, mode="valid")[:tmax + 1]
        e = np.cumsum(np.r_[0.0, a.astype(np.float64) ** 2]); E0 = e[W]
        Et = e[np.arange(tmax + 1) + W] - e[np.arange(tmax + 1)]
        d = E0 + Et - 2 * r; d[0] = 0
        cm = np.ones_like(d); cm[1:] = d[1:] * np.arange(1, len(d)) / (np.cumsum(d[1:]) + 1e-12)
        i = np.where(cm[tmin:] < 0.3)[0]
        if not len(i): out.append(0.0); continue
        i = i[0] + tmin
        while i + 1 < len(cm) and cm[i + 1] < cm[i]: i += 1
        out.append(SR / i)
    f = np.array(out)
    v = f[f > 0]
    if len(v) >= 3:   # ошибки октавы: удвоение/половина относительно медианы куска
        m = float(np.median(v))
        f = np.where(f > 1.7 * m, f / 2, f); f = np.where((f > 0) & (f < 0.6 * m), f * 2, f)
        g = f.copy()
        for k in range(1, len(f) - 1):   # медиана по трём соседним кадрам
            if f[k - 1] > 0 and f[k] > 0 and f[k + 1] > 0: g[k] = np.median(f[k - 1:k + 2])
        f = g
    return f, hop


def метки(x):
    """Метки периодов: в звонких местах — пики волны через период, в глухих — каждые 5 мс. → (метки, звонкость)."""
    f0, hop = _f0_дорожка(x)
    lp = np.convolve(x, np.ones(9) / 9, mode="same")
    м, зв = [], []
    t = 0
    while t < len(x):
        k = min(len(f0) - 1, t // hop); f = f0[k]
        if f > 0:
            T = int(SR / f)
            lo, hi = t, min(len(x), t + T)
            if not м or not зв[-1]:   # начало звонкого участка — самый сильный пик первого периода
                p = lo + int(np.argmax(lp[lo:hi])) if hi > lo else t
            else:                      # дальше — пик около ожидаемого места
                c = м[-1] + T; lo, hi = max(м[-1] + int(0.7 * T), 0), min(len(x), м[-1] + int(1.3 * T))
                p = lo + int(np.argmax(lp[lo:hi])) if hi > lo else c
            if м and p <= м[-1]: p = м[-1] + T
            м.append(p); зв.append(True)
            t = p + int(0.7 * T)
        else:
            p = t if not м or t > м[-1] else м[-1] + int(SR * 0.005)
            м.append(p); зв.append(False); t = p + int(SR * 0.005)
    м = np.array([p for p in м if p < len(x)]); зв = np.array(зв[:len(м)])
    return м, зв


def сдвинуть(x, сдвиг_пт):
    """Сдвиг высоты на сдвиг_пт полутонов (число или массив по отсчётам); глухие участки не трогаются."""
    x = np.asarray(x, np.float32)
    if np.isscalar(сдвиг_пт):
        if abs(сдвиг_пт) < 0.05: return x
        сдв = np.full(len(x), float(сдвиг_пт))
    else:
        сдв = np.asarray(сдвиг_пт, np.float64)
        if np.max(np.abs(сдв)) < 0.05: return x
    if len(x) < SR // 20: return x
    # поля тишины по 25 мс: окна у самых краёв тоже целые (иначе край куска остаётся несдвинутым или проседает)
    П = int(SR * 0.025); n0 = len(x)
    x = np.concatenate([np.zeros(П, np.float32), x, np.zeros(П, np.float32)])
    сдв = np.concatenate([np.full(П, сдв[0]), сдв, np.full(П, сдв[-1])])
    y = _сдвиг(x, сдв)
    return y[П:П + n0] if y is not None else x[П:П + n0]


def _сдвиг(x, сдв):
    м, зв = метки(x)
    if len(м) < 3 or not зв.any(): return None
    out = np.zeros(len(x) + SR // 10, np.float32); норм = np.zeros_like(out)
    # периоды анализа
    T = np.diff(м, append=м[-1] + (м[-1] - м[-2]))
    t = float(м[0]); i = 0
    while t < len(x):
        # ближайшая метка анализа
        while i + 1 < len(м) and abs(м[i + 1] - t) < abs(м[i] - t): i += 1
        Ti = int(T[i]) if зв[i] else int(SR * 0.005)
        Ti = max(40, min(Ti, int(SR / 60)))
        L = Ti if зв[i] else int(SR * 0.005)
        a0, a1 = м[i] - L, м[i] + L
        if a0 >= 0 and a1 <= len(x):
            g = x[a0:a1] * np.hanning(2 * L).astype(np.float32)
            s0 = int(round(t)) - L
            if s0 >= 0 and s0 + 2 * L <= len(out):
                out[s0:s0 + 2 * L] += g; норм[s0:s0 + 2 * L] += np.hanning(2 * L).astype(np.float32)
        k = 2 ** (сдв[min(len(сдв) - 1, int(t))] / 12) if зв[i] else 1.0
        t += max(20.0, Ti / k)
    норм[норм < 0.1] = 1.0   # края, где окна не перекрылись, — как есть
    y = (out / норм)[:len(x)]
    # нормировка суммы окон Ханна с шагом T/k: при правильном перекрытии сумма ≈ 1; громкость — как у исходного
    rx = np.sqrt(np.mean(x ** 2)) + 1e-9; ry = np.sqrt(np.mean(y ** 2)) + 1e-9
    return (y * (rx / ry)).astype(np.float32)


if __name__ == "__main__":
    import sys, soundfile as sf
    a, sr = sf.read(sys.argv[1], dtype="float32")
    for st in (-2, 2):
        y = сдвинуть(a, st); sf.write(f"/tmp/claude-0/psola_{st:+d}.wav", y, sr)
        f0a = _f0_дорожка(a)[0]; f0b = _f0_дорожка(y)[0]
        va = f0a[f0a > 0]; vb = f0b[f0b > 0]
        print(st, "длина", len(a), len(y), "высота до %.1f после %.1f Гц (ожидалось %.1f)" % (np.median(va), np.median(vb), np.median(va) * 2 ** (st / 12)))
