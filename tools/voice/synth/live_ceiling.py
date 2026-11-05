#!/usr/bin/env python3.13
"""live_ceiling.py N — потолок: распознаватель на настоящих записях Gemini (случайные N из описи игры, без отбора)."""
import sys, json, re, random, glob
import numpy as np, soundfile as sf
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=3)
def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()
def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]
о = sorted(glob.glob(f"{R}/sounds/gvoice/bank_*[0-9].js"), key=lambda x: int(re.search(r"(\d+)\.js$", x).group(1)))[-1]
t = open(о, encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
random.seed(11); items = [kv for kv in random.sample(list(p.items()), 1500) if len(kv[0].split()) >= 3][:int(sys.argv[1])]
c, w = [], []
for k, f in items:
    a, sr = sf.read(f"{R}/sounds/gvoice/{f}.flac", dtype="float32")
    a16 = np.interp(np.arange(0, len(a), sr / 16000), np.arange(len(a)), a).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); h = норм(s.result.text)
    c.append(lev(k.replace(" ", ""), h.replace(" ", "")) / max(1, len(k.replace(" ", "")))); w.append(lev(k.split(), h.split()) / max(1, len(k.split())))
print(f"настоящие записи ({len(items)} фраз от трёх слов): ошибочных букв {np.mean(c):.4f}, ошибочных слов {np.mean(w):.3f}")
