import sys, os, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000; L = int(SR * 0.012)
фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:200]
for арг in sys.argv[1:]:
    w_ = json.loads(арг); E.КФ_ПОРОГ = float(w_.pop("_кфп", 0.0)); E.КФ_РЕЖИМ = w_.pop("_кфр", "корр"); S = E.Синтезатор("m", w_); r = []
    for ф in фразы:
        for от in E.текст_в_отрезки(ф):
            x, res, кс = S.отрезок(от["w"], от["end"])
            for p, v in zip(S.стыки_отрезка, S.виды_отрезка):
                if v != "середина звука": continue
                c = p + int(SR * 0.006) - L // 2   # середина перекрытия
                if c - 2 * L < 0 or c + 2 * L > len(x): continue
                м = np.sqrt(np.mean(x[c - L // 2:c + L // 2] ** 2)); до = np.sqrt(np.mean(x[c - 2 * L:c - L] ** 2)); по = np.sqrt(np.mean(x[c + L:c + 2 * L] ** 2))
                if до > 1e-3 and по > 1e-3: r.append(20 * np.log10(м / np.sqrt(до * по)))
    r = np.array(r); print(f"{арг}: стыков посередине звука {len(r)}, громкость перекрытия против соседей: средняя {r.mean():+.2f} дБ, доля > +1,5 дБ {np.mean(r > 1.5):.1%}", flush=True)
