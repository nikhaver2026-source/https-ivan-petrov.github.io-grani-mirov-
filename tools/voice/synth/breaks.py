#!/usr/bin/env python3.13
"""breaks.py N — срывы ровности голоса внутри звонких звуков («призвуки на А, У, Р»): в каждом кадре 5 мс звонкого
места — сходство соседних периодов волны (норм. корреляция периода с предыдущим). Срыв: сходство < 0,6 при ровных
соседях (> 0,85 в 10–20 мс до и после). Частота срывов на секунду звонкой речи: синтез против живой речи; срывы синтеза
разложены по причине: у шва (±15 мс), в месте сдвига высоты (PSOLA), в месте правки тембра или громкости, прочее
(сама запись). Варианты весов выравнены по отсчётам (длительность не меняется), поэтому места обработок видны как разница."""
import sys, os, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
SR = 24000; HOP = 120


def сходство(y):
    """Сходство периода с предыдущим по кадрам 5 мс (nan — глухо)."""
    f0, _ = psola._f0_дорожка(y, hop=HOP); out = np.full(len(f0), np.nan)
    for i, f in enumerate(f0):
        if f <= 0: continue
        T = int(round(SR / f)); c = i * HOP
        if c - T < 0 or c + T > len(y): continue
        a = y[c - T:c].astype(np.float64); b = y[c:c + T].astype(np.float64)
        # лучшее совпадение при сдвиге ±10 % периода (период немного плывёт)
        best = -1.0
        for d in range(-T // 10, T // 10 + 1, 2):
            if c + d - T < 0 or c + d + T > len(y): continue
            a = y[c + d - T:c + d].astype(np.float64); b = y[c + d:c + d + T].astype(np.float64)
            if c + d + T > len(y): continue
            r = np.dot(a - a.mean(), b - b.mean()) / (np.sqrt(np.dot(a - a.mean(), a - a.mean()) * np.dot(b - b.mean(), b - b.mean())) + 1e-12)
            best = max(best, r)
        out[i] = best
    return out


def срывы(s):
    ev = []
    for i in range(4, len(s) - 4):
        if np.isnan(s[i]) or s[i] >= 0.6: continue
        до = s[i - 4:i - 1]; по = s[i + 2:i + 5]
        if np.all(~np.isnan(до)) and np.all(~np.isnan(по)) and np.all(до > 0.85) and np.all(по > 0.85): ev.append(i)
    return ev


if __name__ == "__main__":
    N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
    варианты = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    S = E.Синтезатор("m"); вж = 0.0; nж = 0
    random.seed(5); V = S.V
    for ri in random.sample([i for i in range(len(V.recs)) if i not in V.искл_ri], N):
        y = V.звук(ri); s = сходство(y); вж += np.sum(~np.isnan(s)) * HOP / SR; nж += len(срывы(s))
    print(f"живая речь: звонкой речи {вж:.0f} с, срывов {nж}, на секунду {nж / max(1, вж):.3f}", flush=True)
    # синтез: доля срывов у швов (±15 мс) для каждого варианта; живая речь — у границ слов без паузы
    for арг in sys.argv[2:] or ["{}"]:
        S1 = E.Синтезатор("m", json.loads(арг)); вс = 0.0; n = 0; у_шва = 0; примеры = []
        for ф in фразы:
            y1, _ = S1.сказать(ф); стыки = list(S1.стыки); s1 = сходство(y1); вс += np.sum(~np.isnan(s1)) * HOP / SR
            for i in срывы(s1):
                n += 1; c = i * HOP; ш = any(abs(c - p) < 360 for p in стыки); у_шва += ш
                if len(примеры) < 12: примеры.append((ф[:45], round(c / SR, 3), "шов" if ш else ""))
        print(f"синтез {арг}: звонкой речи {вс:.0f} с, срывов {n}, на секунду {n / max(1, вс):.3f}, у швов {у_шва}", flush=True)
        for p in примеры: print("   ", p)
