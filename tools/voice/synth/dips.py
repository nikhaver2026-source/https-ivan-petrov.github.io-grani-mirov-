#!/usr/bin/env python3.13
"""dips.py N [веса…] — провал громкости у шва: уровень в ±10 мс у точки против окрестности (30–60 мс по обе стороны),
дБ; синтез против живых границ слов без паузы; по причине: у левого слова в источнике была пауза после, у правого —
пауза до, обе, ни одной."""
import sys, os, json, random, collections
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def db(x): return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-10)
def провал(y, p):
    if p - 1440 < 0 or p + 1440 > len(y): return None
    ц = db(y[p - 240:p + 240]); о = max(db(y[p - 1440:p - 720]), db(y[p + 720:p + 1440]))
    if о < -45: return None
    return ц - о
N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
for арг in (sys.argv[2:] or ["{}"]):
    w_ = json.loads(арг); E.КФ_ПОРОГ = float(w_.pop("_кфп", 0.0)); E.КФ_РЕЖИМ = w_.pop("_кфр", "корр"); S = E.Синтезатор("m", w_); V = S.V; по = collections.defaultdict(list)
    for ф in фразы:
        for от in E.текст_в_отрезки(ф):
            x, res, кс = S.отрезок(от["w"], от["end"])
            for k, p in enumerate(S.стыки_отрезка):
                v = провал(x, p)
                if v is None: continue
                л, п = кс[k], кс[k + 1]
                пп = л[4] == "o" and V.recs[л[0]]["w"][л[3]][4] > 0.03
                пд = п[4] == "o" and (lambda ws, s_: next((w[3] for w in ws if abs(w[1] - s_) < 0.03), 0))(V.recs[п[0]]["w"], п[1]) > 0.03
                по[("пауза после левого" if пп else "") + (" + " if пп and пд else "") + ("пауза до правого" if пд else "") or "без пауз"].append(v)
    все = np.concatenate([np.array(v) for v in по.values()])
    print(f"синтез {арг}: швов {len(все)}, провал у точки: средний {все.mean():+.2f} дБ, доля < −6 дБ {np.mean(все < -6):.1%}")
    for k, v in sorted(по.items(), key=lambda z: -len(z[1])): v = np.array(v); print(f"   {k}: {len(v)}, средний {v.mean():+.2f} дБ, < −6 дБ {np.mean(v < -6):.1%}")
random.seed(3); ж = []
while len(ж) < 1500:
    ri = random.randrange(len(V.recs)); r = V.recs[ri]
    if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
    j = random.randrange(len(r["w"]) - 1)
    if r["w"][j][4] > 0.005: continue
    v = провал(V.звук(ri), int(r["w"][j][2] * SR))
    if v is not None: ж.append(v)
ж = np.array(ж); print(f"живая речь: границ {len(ж)}, провал средний {ж.mean():+.2f} дБ, доля < −6 дБ {np.mean(ж < -6):.1%}")
