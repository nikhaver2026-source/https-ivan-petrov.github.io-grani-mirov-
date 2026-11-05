#!/usr/bin/env python3.13
"""pieces.py "фраза" ... — куски синтеза по отдельности: источник, границы, что слышно в каждом куске (с тишиной по
краям) и в каждой паре соседних кусков. Для поиска, какой кусок приносит лишние буквы или теряет окончание."""
import sys, re, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=4)


def узнать(y):
    y = np.concatenate([np.zeros(2400, np.float32), y.astype(np.float32), np.zeros(2400, np.float32)])
    a16 = np.interp(np.arange(0, len(y), E.SR / 16000), np.arange(len(y)), y).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return s.result.text


S = E.Синтезатор("m", json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].startswith("{") else None); V = S.V
for ф in [a for a in sys.argv[1:] if not a.startswith("{")]:
    print("═══", ф)
    for от in E.текст_в_отрезки(ф):
        x, res, кс = S.отрезок(от["w"], от["end"])
        print("  отрезок целиком:", узнать(x))
        звуки = []
        for (ri, s, e, j, вид, o) in кс:
            r = V.recs[ri]; a = V.звук(ri); y = a[int(s * E.SR):int(e * E.SR)]
            звуки.append(y)
            if вид == "o":
                ws = r["w"]; j0 = next(k for k in range(j, -1, -1) if abs(ws[k][1] - s) < 0.2 or k == 0)
                слова = [w[0] for w in ws if w[1] < e - 0.02 and w[2] > s + 0.02]
                print(f"  [{' '.join(слова)}] из «{r['k']}» {s:.3f}-{e:.3f}  слышно: «{узнать(y)}»")
            else:
                print(f"  часть из «{r['k']}» {s:.3f}-{e:.3f}  слышно: «{узнать(y)}»")
        for k in range(len(звуки) - 1):
            print(f"    пара {k}+{k + 1}: «{узнать(S.встык(звуки[k], звуки[k + 1]))}»")
