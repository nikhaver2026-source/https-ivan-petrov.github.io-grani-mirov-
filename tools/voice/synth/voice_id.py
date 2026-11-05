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


def голос_подходит(a, голос):
    x = признаки(np.asarray(a, np.float32))
    if x is None: return True, "мало звонких мест — не проверялось"
    m = _модель(); z = (x - m["mu"]) / m["sd"]; p = float(1 / (1 + math.exp(-(z @ m["w"] + float(m["b"])))))
    f0 = float(np.exp(x[0])); откл = float(np.mean(np.abs(x - m["центр"]) / m["разброс"]))
    if голос == "m":
        ok = p <= 0.5 and f0 <= 190 and откл <= 3.0
    else:
        ok = p >= 0.5
    return ok, f"чужой голос? женский {p:.2f}, высота {f0:.0f} Гц, тембр {откл:.1f}"
