#!/usr/bin/env python3.13
"""live_speed.py N — живые записи диктора при ускорении (WSOLA и PSOLA): доля ошибочных букв распознавателя — мерка,
к которой стремится синтез на той же скорости."""
import sys, json, random, re
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E, psola
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=3)
def норм(t): return re.sub(r"[^а-яa-z0-9]+", "", t.lower().replace("ё", "е"))
def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]
def узнать(y):
    y = np.concatenate([np.zeros(2400, np.float32), y, np.zeros(4800, np.float32)])
    a16 = np.interp(np.arange(0, len(y), 1.5), np.arange(len(y)), y).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return норм(s.result.text)
V = E.Голос("m"); random.seed(9); idx = [i for i in random.sample(range(len(V.recs)), 600) if len(V.recs[i]["w"]) >= 4][:int(sys.argv[1]) if len(sys.argv) > 1 else 120]
for k in (1.5, 2.0, 2.5):
    for имя, f in (("WSOLA", lambda y: E.Синтезатор.темп(y, k)), ("PSOLA", lambda y: psola.темп(y, k))):
        c = []
        for ri in idx:
            y = V.звук(ri).astype(np.float32); t = норм(V.recs[ri]["k"])
            c.append(lev(t, узнать(f(y))) / max(1, len(t)))
        print(f"живые записи, скорость {k}, {имя}: доля ошибочных букв {np.mean(c):.4f}", flush=True)
