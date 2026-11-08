#!/usr/bin/env python3.13
"""trace.py "фраза" [веса] — разбор фразы: куски (слова, источник, длительность), швы (вид, место), сдвиги высоты
на краях кусков, правка громкости швов, поправка тембра на швах (размах, дБ)."""
import sys, os, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
SR = 24000
S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 else None); V = S.V
лог = {"сдвиг": [], "темп": []}
с0 = psola.сдвинуть
def с(x, c, *a, **k):
    c_ = np.asarray(c) if not np.isscalar(c) else np.full(len(x), c); лог["сдвиг"].append((len(x), float(c_[0]), float(c_[-1]))); return с0(x, c, *a, **k)
psola.сдвинуть = с
for от in E.текст_в_отрезки(sys.argv[1]):
    лог["сдвиг"].clear(); x, res, кс = S.отрезок(от["w"], от["end"])
    print("отрезок:", " ".join(от["w"]))
    for k, (ri, s_, e_, j, вид, o) in enumerate(кс):
        r = V.recs[ri]
        if вид == "o":
            ws = r["w"]; слова = [w[0] for w in ws if w[1] >= s_ - 0.03 and w[2] <= e_ + 0.03]
            j0 = next((q for q in range(j, -1, -1) if abs(ws[q][1] - s_) < 0.03), j)
            до = ws[j0 - 1][0] if j0 > 0 else "·"; после = ws[j + 1][0] if j + 1 < len(ws) else "·"
            звуки = " ".join(p[0] for q in range(j0, j + 1) for p in r["ph"][q]) if "ph" in r else "?"
            print(f"  кусок {k}: {слова} [{звуки}] {1000 * (e_ - s_):.0f} мс | в источнике: …{до} [·] {после}… пауза до {ws[j0][3]:.2f} после {ws[j][4]:.2f} | {r['f']}")
        else:
            print(f"  кусок {k}: часть {1000 * (e_ - s_):.0f} мс из {r['f']} ({s_:.2f}–{e_:.2f})")
    print("  швы:", list(zip([round(p / SR, 3) for p in S.стыки_отрезка], S.виды_отрезка)))
    print("  сдвиги высоты (мс, начало, конец):", [(round(l / 24), round(a, 2), round(b, 2)) for l, a, b in лог["сдвиг"]])
