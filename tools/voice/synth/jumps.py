#!/usr/bin/env python3.13
"""jumps.py N варианты… — только мерки плавности без распознавания (скачок высоты на стыке, уровень, темп, громкость).
Вариант: JSON весов; ключ "_пз": [a, b] — пределы растяжки звонких мест (psola.ПРЕДЕЛ_ЗВ)."""
import sys, os, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
def высота_шва(y, p):
    import math
    a0 = max(0, p - int(E.SR * 0.07)); seg = y[a0:p + int(E.SR * 0.07)]
    if len(seg) < int(E.SR * 0.1): return None
    f0, hop = psola._f0_дорожка(seg, hop=120); c = p - a0; t = np.arange(len(f0)) * hop
    до = f0[(t >= c - int(E.SR * 0.03)) & (t <= c - int(E.SR * 0.005))]; по = f0[(t >= c + int(E.SR * 0.005)) & (t <= c + int(E.SR * 0.03))]
    до, по = до[до > 0], по[по > 0]
    if len(до) < 2 or len(по) < 2: return None
    return abs(12 * math.log2(np.median(по) / np.median(до)))


N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
for арг in sys.argv[2:]:
    w = json.loads(арг); пз = w.pop("_пз", None); psola.ПРЕДЕЛ_ЗВ = tuple(пз) if пз else (0.7, 1.5)
    S = E.Синтезатор("m", w); вв = []
    for ф in фразы:
        y, _ = S.сказать(ф)
        for p in getattr(S, "стыки", []):
            в_ = высота_шва(y, p)
            if в_ is not None: вв.append(в_)
    print(f"{арг}: высота на швах {np.mean(вв):.3f} пт (n={len(вв)}, >3 пт {np.mean(np.array(вв) > 3):.1%}), скачок по краям кусков {np.mean(S.скачки):.3f} пт (n={len(S.скачки)}), уровень {np.mean(S.скачки_уровня):.2f}, темп {np.mean(S.скачки_темпа):.3f}, громкость {np.mean(S.скачки_громкости):.2f}", flush=True)
