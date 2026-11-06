#!/usr/bin/env python3.13
"""psola.py — сдвиг высоты голоса по периодам основного тона (TD-PSOLA) без изменения тембра и длительности.
сдвинуть(x, сдвиг_пт) — сдвиг_пт: число или массив полутонов на каждый отсчёт (плавные переходы высоты)."""
import math
import numpy as np

SR = 24000
ГРАНИЦА = 2   # периодов у краёв звонкого участка, которые темп не трогает
ПРИВЯЗКА = True   # начало звонкого участка — на метку периода (иначе вся звонкая часть сдвигается на долю периода)
МЕТКИ = "пик"   # "корр" — метки периодов по сходству с предыдущим периодом
КОНЕЦ = True   # окно у конца звука — внутрь (False — как раньше)
ПРЕДЕЛ_ЗВ = (0.7, 1.5)   # пределы растяжки звонких мест, когда глухие не трогаются


def _f0_дорожка(x, hop=240, fmin=70, fmax=400):
    """Высота по кадрам 10 мс (упрощённый YIN); 0 — глухо."""
    W = int(SR * 0.03); tmin, tmax = int(SR / fmax), int(SR / fmin)
    out = []
    for c in range(0, len(x), hop):
        # у конца звука окно сдвигается внутрь (иначе последним ~30 мс не хватает окна и они всегда «глухие» — и сдвиг
        # высоты не доходил до самого стыка)
        a0 = max(0, min(c - W // 2, len(x) - W - tmax)) if КОНЕЦ else max(0, c - W // 2)
        a = x[a0:a0 + W + tmax]
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


def звонкость(x, hop=240):
    """Надёжно звонкие кадры (10 мс): период найден И энергия ниже 1 кГц — больше 60 % всей (у «с», «ш», «ф», «х» и
    взрывов смычных она мала). Только такие места можно резать на периоды без призвуков."""
    f0, _ = _f0_дорожка(x, hop=hop); n = len(f0); out = np.zeros(n, bool)
    W = 512; окно = np.hanning(W); f = np.fft.rfftfreq(W, 1 / SR); низ = f < 1000
    for i in range(n):
        if f0[i] <= 0: continue
        c = i * hop; seg = x[max(0, c - W // 2):max(0, c - W // 2) + W]
        if len(seg) < W: seg = np.pad(seg, (0, W - len(seg)))
        P = np.abs(np.fft.rfft(seg * окно)) ** 2; out[i] = P[низ].sum() > 0.6 * (P.sum() + 1e-12)
    return out


def _смесь(обр, исх, зв, hop=240, переход=120):
    """Обработанное — только в звонких кадрах, в прочих — исходный звук; переходы — 5 мс."""
    m = np.repeat(зв.astype(np.float32), hop)[:len(исх)]
    if len(m) < len(исх): m = np.r_[m, np.zeros(len(исх) - len(m), np.float32)]
    k = np.ones(переход, np.float32) / переход; m = np.convolve(m, k, "same")
    return (m * обр + (1 - m) * исх).astype(np.float32)


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
                h = T // 2; q = м[-1]
                if МЕТКИ == "корр" and q - h >= 0 and q + int(1.3 * T) + h <= len(x):
                    # период — туда, где волна лучше всего повторяет предыдущий период (метки без дрожания между
                    # двумя пиками одного периода)
                    ref = x[q - h:q + h].astype(np.float64); L0, L1 = int(0.7 * T), int(1.3 * T)
                    seg = x[q + L0 - h:q + L1 + h].astype(np.float64)
                    r = np.correlate(seg, ref, "valid")
                    e = np.cumsum(np.r_[0.0, seg ** 2]); en = e[2 * h:] - e[:-2 * h]
                    n_ = min(len(r), len(en)); r = r[:n_] / np.sqrt(en[:n_] * np.dot(ref, ref) + 1e-12)
                    if n_ and r.max() > 0.5: p = q + L0 + int(np.argmax(r))
            if м and p <= м[-1]: p = м[-1] + T
            м.append(p); зв.append(True)
            t = p + int(0.7 * T)
        else:
            p = t if not м or t > м[-1] else м[-1] + int(SR * 0.005)
            м.append(p); зв.append(False); t = p + int(SR * 0.005)
    м = np.array([p for p in м if p < len(x)]); зв = np.array(зв[:len(м)])
    return м, зв


def сдвинуть(x, сдвиг_пт, не_трогать=None):
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
    if y is None: return x[П:П + n0]
    y = y[П:П + n0]; исх = x[П:П + n0]
    зв = звонкость(исх)
    if не_трогать is not None:   # отрезки (в отсчётах), которые остаются как есть (например, дрожащее «р»)
        for a0, a1 in не_трогать: зв[max(0, a0 // 240):max(0, a1 // 240) + 1] = False
    return _смесь(y, исх, зв)   # шумные согласные и взрывы — нетронуты


def _сдвиг(x, сдв):
    м, зв = метки(x)
    if len(м) < 3 or not зв.any(): return None
    out = np.zeros(len(x) + SR // 10, np.float32); норм = np.zeros_like(out)
    # периоды анализа
    T = np.diff(м, append=м[-1] + (м[-1] - м[-2]))
    t = float(м[0]); i = 0; был_зв = False
    while t < len(x):
        # ближайшая метка анализа
        while i + 1 < len(м) and abs(м[i + 1] - t) < abs(м[i] - t): i += 1
        if ПРИВЯЗКА and зв[i] and not был_зв: t = float(м[i])   # начало звонкого участка — ровно на метку периода
        был_зв = bool(зв[i])
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


def темп(x, k, только_звонкие=False):
    """Изменение темпа в k раз (k > 1 — быстрее) по периодам основного тона: в звонких местах выбрасываются (или
    повторяются) целые периоды — высота и чёткость сохраняются; в глухих — окна по 5 мс. k — число или массив
    по отсчётам входа (переменный темп: согласные — медленнее, гласные и паузы — быстрее)."""
    x = np.asarray(x, np.float32)
    if len(x) < SR // 20: return x
    П = int(SR * 0.025)
    xp = np.concatenate([np.zeros(П, np.float32), x, np.zeros(П, np.float32)])
    kk = np.full(len(xp), float(k)) if np.isscalar(k) else np.concatenate([np.full(П, k[0]), np.asarray(k, np.float64), np.full(П, k[-1])])
    м, зв = метки(xp)
    if len(м) < 3: return x
    T = np.diff(м, append=м[-1] + (м[-1] - м[-2]))
    def _звонкая_середина():
        """Звонкие периоды, кроме ГРАНИЦА первых и последних в каждом звонком участке: у переходов «гласная — глухой»
        выброшенный или повторённый период ломает переход (призвук на конце гласной)."""
        мз = np.zeros(len(xp), bool); n_ = len(м); q = 0
        while q < n_:
            if not зв[q]: q += 1; continue
            r_ = q
            while r_ + 1 < n_ and зв[r_ + 1]: r_ += 1
            for u in range(q + ГРАНИЦА, r_ + 1 - ГРАНИЦА): мз[м[u]:м[u] + int(T[u])] = True
            q = r_ + 1
        return мз
    if только_звонкие and not np.isscalar(k) and зв.any():   # переменный темп: глухие места — 1:1
        kk = np.where(_звонкая_середина(), kk, 1.0)
    if только_звонкие and np.isscalar(k) and зв.any():
        # глухие места («с», «ш», «ф», «х», взрывы) — 1:1: при растяжке их окна по 5 мс складывают несвязанные
        # кусочки шума, и громкость шума дрожит с частотой 200 Гц (жужжание); весь сдвиг длины — на звонкие периоды
        мз = _звонкая_середина()
        h5 = int(SR * 0.005); n5 = len(xp) // h5   # тишину (ниже −30 дБ громких мест) тоже можно тянуть
        rms = np.sqrt(np.mean(xp[:n5 * h5].reshape(n5, h5) ** 2, axis=1)); порог = 0.03 * (np.percentile(rms, 95) + 1e-9)
        мз[:n5 * h5] |= np.repeat(rms < порог, h5)
        Vx = float(мз[П:П + len(x)].sum()); Ux = len(x) - Vx; нужно = len(x) / float(k) - Ux
        if Vx > 0.15 * len(x) and нужно > 0.3 * Vx:
            kv = float(np.clip(Vx / нужно, *ПРЕДЕЛ_ЗВ))
            kk = np.where(мз, kv, 1.0)
    n_out = int(np.sum(1.0 / kk)) + SR // 10
    out = np.zeros(n_out + SR // 10, np.float32); норм = np.zeros_like(out)
    t_an, t_out, i = float(м[0]), float(м[0] / kk[0]), 0
    был_зв = False; посл = None
    while t_an < len(xp) - 1 and t_out < len(out) - 1:
        while i + 1 < len(м) and abs(м[i + 1] - t_an) < abs(м[i] - t_an): i += 1
        if ПРИВЯЗКА and зв[i] and not был_зв:   # начало звонкого участка: чтение — ровно с метки, вывод — туда же
            d_ = float(м[i]) - t_an; t_an = float(м[i]); t_out += d_ / kk[min(len(kk) - 1, int(t_an))]
        elif ПРИВЯЗКА and not зв[i] and был_зв and посл is not None:
            # конец звонкого участка: глухое продолжение читается ровно с того места, где кончилось содержимое
            # последнего периода (иначе на стыке «гласная — глухой» двоение или провал до полпериода)
            t_an = посл[0] + (t_out - посл[1])
            while i + 1 < len(м) and abs(м[i + 1] - t_an) < abs(м[i] - t_an): i += 1
            while i > 0 and abs(м[i - 1] - t_an) < abs(м[i] - t_an): i -= 1
            if зв[i]:   # снова звонкая метка ближе — остаёмся в звонком
                t_an = float(м[i])
        был_зв = bool(зв[i])
        Ti = int(T[i]) if зв[i] else int(SR * 0.005)
        Ti = max(40, min(Ti, int(SR / 60)))
        L = Ti if зв[i] else int(SR * 0.005)
        ц = м[i] if зв[i] else int(round(t_an))   # глухо: окно — ровно с места чтения, а не с ближайшей метки
        a0, a1 = ц - L, ц + L
        s0 = int(round(t_out)) - L
        if a0 >= 0 and a1 <= len(xp) and s0 >= 0 and s0 + 2 * L <= len(out):
            w = np.hanning(2 * L).astype(np.float32)
            out[s0:s0 + 2 * L] += xp[a0:a1] * w; норм[s0:s0 + 2 * L] += w
        if зв[i]: посл = (float(ц), float(round(t_out)))
        t_out += Ti; t_an += Ti * kk[min(len(kk) - 1, int(t_an))]
    норм[норм < 0.1] = 1.0
    y = out / норм
    n_res = int(round(np.sum(1.0 / kk[П:П + len(x)])))
    a = int(round(П / kk[0]))
    y = y[a:a + n_res]
    rx = np.sqrt(np.mean(x ** 2)) + 1e-9; ry = np.sqrt(np.mean(y ** 2)) + 1e-9
    return (y * (rx / ry)).astype(np.float32)
