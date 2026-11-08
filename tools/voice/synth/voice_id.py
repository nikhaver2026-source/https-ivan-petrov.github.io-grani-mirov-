#!/usr/bin/env python3.13
"""voice_id.py — проверка голоса куска записи: тот ли диктор (модель voice_model.npz из voice_check.py:
мужской Iapetus против женского Callirrhoe по высоте и усреднённому спектру звонких мест).
голос_подходит(a, голос) → (годится, пояснение). Мужской: вероятность женского ≤ 0,5, высота ≤ 190 Гц, тембр не
дальше обычного; женский: вероятность женского ≥ 0,5."""
import sys, math
import numpy as np
sys.path.insert(0, "/root/S/us2")
_М = None


def _модель():
    global _М
    if _М is None: z = np.load("/root/S/us2/voice_model.npz"); _М = {k: z[k] for k in z.files}
    return _М


def признаки(a):
    import engine as E, psola
    f0, hop = psola._f0_дорожка(a); v = f0[f0 > 0]
    if len(v) < 5: return None
    кадры = [a[i * hop:i * hop + 2 * hop] for i in np.where(f0 > 0)[0] if i * hop + 2 * hop <= len(a)]
    M = np.mean([E._mfcc(x) for x in кадры[::2]], axis=0)
    return np.r_[np.log(np.median(v)), np.log(np.percentile(v, 90) / max(1.0, np.percentile(v, 10))), M].astype(np.float32)


def окно_женское(a, sr=24000):
    """Наибольшая вероятность женского голоса по окнам 1 с (шаг 0,5 с) и высота этого окна."""
    import engine as E, psola
    m = _модель(); f0, hop = psola._f0_дорожка(a)
    idx = [i for i in np.where(f0 > 0)[0] if i * hop + 2 * hop <= len(a)]
    if len(idx) < 5: return 0.0, 0.0
    mf = {i: E._mfcc(a[i * hop:i * hop + 2 * hop]) for i in idx[::2]}; best = (0.0, 0.0)
    for s in range(0, max(1, len(f0) - 100 + 1), 50):
        ii = [i for i in idx if s <= i < s + 100]; mm = [mf[i] for i in ii if i in mf]
        if len(ii) < 5 or len(mm) < 3: continue
        v = f0[ii]; x = np.r_[np.log(np.median(v)), np.log(np.percentile(v, 90) / max(1.0, np.percentile(v, 10))), np.mean(mm, axis=0)]
        z = (x - m["mu"]) / m["sd"]; pw = float(1 / (1 + math.exp(-(z @ m["w"] + float(m["b"])))))
        if pw > best[0]: best = (pw, float(np.median(v)))
    return best


def голос_подходит(a, голос):
    x = признаки(np.asarray(a, np.float32))
    if x is None: return True, "мало звонких мест — не проверялось"
    m = _модель(); z = (x - m["mu"]) / m["sd"]; p = float(1 / (1 + math.exp(-(z @ m["w"] + float(m["b"])))))
    f0 = float(np.exp(x[0])); откл = float(np.mean(np.abs(x - m["центр"]) / m["разброс"]))
    if голос == "m":
        ok = p <= 0.5 and f0 <= 190 and откл <= 3.0
        if ok:   # и по окнам 1 с: чужой голос лишь в части куска «размывает» оценку целиком (8 ноября)
            pw, fw = окно_женское(np.asarray(a, np.float32))
            if pw > 0.9 and fw >= 145: return False, f"чужой голос в части куска: женский {pw:.2f} в окне, высота {fw:.0f} Гц"
    else:
        ok = p >= 0.5
    return ok, f"чужой голос? женский {p:.2f}, высота {f0:.0f} Гц, тембр {откл:.1f}"
