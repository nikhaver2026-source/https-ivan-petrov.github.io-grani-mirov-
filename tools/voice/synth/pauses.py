#!/usr/bin/env python3.13
"""pauses.py [веса] — рваность синтеза: пауз ≥60 мс на слово внутри фраз без знаков (живые записи — 0,071)."""
import sys, json, re, numpy as np
sys.path.insert(0, "/root/S/us2"); import engine as E
def паузы(y, sr=E.SR, мин=0.06):
    fr = int(sr * 0.005); n = len(y) // fr; e = np.sqrt(np.mean(y[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10)
    тихо = e < np.max(e) * 10 ** (-38 / 20); i0 = np.argmax(~тихо); i1 = n - np.argmax(~тихо[::-1]); t = тихо[i0:i1]; out = []; k = 0
    while k < len(t):
        if t[k]:
            j = k
            while j < len(t) and t[j]: j += 1
            if (j - k) * fr / sr >= мин: out.append((j - k) * fr / sr)
            k = j
        else: k += 1
    return out
веса = json.loads(sys.argv[1]) if len(sys.argv) > 1 else None
тест = [t for t in json.load(open("/root/S/us2/test_set.json", encoding="utf-8")) if not re.search(r"[,;:—]", t.rstrip(".!?…»«\""))][:60]
S = E.Синтезатор("m", веса); g = []; слов = 0
for t in тест:
    y, _ = S.сказать(t); g += паузы(y); о = E.текст_в_отрезки(t); слов += sum(len(x["w"]) for x in о)
print(f"пауз ≥60 мс на слово {len(g) / max(1, слов):.3f} (живые 0,071)")
