#!/usr/bin/env python3.13
"""judge_q.py — судья качества звучания: DNSMOS P.835 (Microsoft, модель sig_bak_ovr.onnx): SIG — искажения самой речи
(призвуки, дребезг, обрывы), BAK — помехи фона, OVRL — общее. Шкала 1–5. Не распознаватель: слышит именно звучание.
оценка(y24к) → (sig, bak, ovrl)."""
import numpy as np, onnxruntime as ort
_s = None
ДЛ = 9.01; SR16 = 16000
P_SIG = np.poly1d([-0.08397278, 1.22083953, 0.0052439]); P_BAK = np.poly1d([-0.13166888, 1.60915514, -0.39604546])
P_OVR = np.poly1d([-0.06766283, 1.11546468, 0.04602535])


def оценка(y, sr=24000, окон=None):
    global _s
    if _s is None:
        o = ort.SessionOptions(); o.intra_op_num_threads = 1; o.inter_op_num_threads = 1
        _s = ort.InferenceSession("/root/S/asr/dnsmos/sig_bak_ovr.onnx", o, providers=["CPUExecutionProvider"])
    a = np.interp(np.arange(0, len(y), sr / SR16), np.arange(len(y)), np.asarray(y, np.float64)).astype(np.float32)
    n = int(ДЛ * SR16)
    while len(a) < n: a = np.append(a, a)
    шаг = SR16; рез = []
    всего = max(1, int((len(a) - n) / шаг) + 1)
    for i in range(0, всего if окон is None else min(всего, окон)):
        seg = a[i * шаг:i * шаг + n]
        if len(seg) < n: break
        sig, bak, ovr = _s.run(None, {_s.get_inputs()[0].name: seg[None, :]})[0][0]
        рез.append((P_SIG(sig), P_BAK(bak), P_OVR(ovr)))
    return tuple(float(np.mean([r[k] for r in рез])) for k in range(3))


if __name__ == "__main__":   # judge_q.py N варианты… — синтез первых N фраз набора; «живые» — записи диктора
    import sys, os, json, random
    sys.path.insert(0, "/root/S/us2")
    os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
    import engine as E, psola
    N = int(sys.argv[1]); фразы = json.load(open(os.environ.get("EVAL_SET", "/root/S/us2/test_set400.json"), encoding="utf-8"))[:N]
    for арг in sys.argv[2:]:
        if арг == "живые":
            V = E.Синтезатор("m").V; random.seed(5); р = [оценка(V.звук(ri)) for ri in random.sample([i for i in range(len(V.recs)) if i not in V.искл_ri], N)]
        else:
            w = json.loads(арг); psola.КОНЕЦ = bool(w.pop("_конец", 1)); psola.МЕТКИ = w.pop("_метки", "пик"); psola.ГРАНИЦА = int(w.pop("_граница", 2)); psola.ПРИВЯЗКА = bool(w.pop("_привязка", 1)); S = E.Синтезатор("m", w)
            р = [оценка(S.сказать(ф)[0]) for ф in фразы]
        р = np.array(р); os.makedirs("/root/S/us2/out/jq", exist_ok=True)
        np.save(f"/root/S/us2/out/jq/{abs(hash(арг)) % 10**8}.npy", р); open("/root/S/us2/out/jq/index.txt", "a", encoding="utf-8").write(f"{abs(hash(арг)) % 10**8}\t{N}\t{арг}\n")
        if арг != "живые" and "база" in globals():
            d = р[:, 2] - база[:, 2]; print(f"   против первого варианта: OVRL {d.mean():+.3f} ± {d.std() / np.sqrt(len(d)):.3f}, SIG {(р[:, 0] - база[:, 0]).mean():+.3f}", flush=True)
        elif арг != "живые": база = р
        print(f"{арг}: SIG {р[:, 0].mean():.3f}, BAK {р[:, 1].mean():.3f}, OVRL {р[:, 2].mean():.3f} (±{р[:, 2].std() / np.sqrt(len(р)):.3f})", flush=True)
