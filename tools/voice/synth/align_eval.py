#!/usr/bin/env python3.13
"""align_eval.py [N] — проверка разметки: N случайных слов из середины фраз (без пауз вокруг) вырезаются
(а) прежним способом движка (граница базы + страховка по времени букв), (б) по разметке звуков; каждое слово
распознаётся отдельно (с тишиной по краям). Доля ошибочных букв и доля слов с лишними/потерянными буквами по краям."""
import sys, json, re, random, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E, hmm_align as H
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1500
rec = None


def init():
    global rec
    import sherpa_onnx
    rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=1)


def норм(t): return re.sub(r"[^а-яa-z0-9]+", "", t.lower().replace("ё", "е"))


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def узнать(y):
    тиш = np.zeros(int(24000 * 0.08), np.float32); x = np.concatenate([тиш, y, тиш])
    a16 = np.interp(np.arange(0, len(x), 1.5), np.arange(len(x)), x).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); return норм(s.result.text)


def одно(item):
    f, w, (s0, e0), (s1, e1) = item
    a = H.звук_записи("m", f); out = []
    for s, e in ((s0, e0), (s1, e1)):
        h = узнать(a[int(s * 24000):int(e * 24000)]); t = норм(w)
        out.append((min(1.0, lev(t, h) / max(1, len(t))), h))
    return w, out


def main():
    recs = H.записи("m"); разм = {}
    for l in open("/root/S/us2/align_m.jsonl", encoding="utf-8"):
        x = json.loads(l); разм[x["i"]] = x
    random.seed(7); items = []
    кандидаты = [(ri, j) for ri, r in enumerate(recs) if ri in разм for j in range(1, len(r["w"]) - 1)
                 if r["w"][j][3] < 0.05 and r["w"][j][4] < 0.05 and len(r["w"][j][0]) >= 2]
    for ri, j in random.sample(кандидаты, N):
        r = recs[ri]; ws = r["w"]; w = ws[j]
        s0, e0 = w[1], w[2]
        if w[5]: s0 = max(s0, w[5][0] - E.Синтезатор._до(w[0][0])); e0 = min(e0, w[5][-1] + E.Синтезатор._после(w[0][-1]))
        a = разм[ri]["w"][j]; s1, e1 = a[1], a[2]
        items.append((r["f"], w[0], (s0, e0), (s1, e1)))
    with mp.Pool(4, initializer=init) as pool: res = pool.map(одно, items, chunksize=20)
    for k, имя in enumerate(("прежние края", "разметка звуков")):
        c = np.array([o[k][0] for _, o in res])
        print(f"{имя}: доля ошибочных букв {c.mean():.4f}, слов без ошибки {np.mean(c == 0):.1%}")
    хуже = [(w, o) for w, o in res if o[1][0] > o[0][0]][:12]; лучше = [(w, o) for w, o in res if o[1][0] < o[0][0]][:12]
    print("стало хуже:", "; ".join(f"{w}: {o[0][1]}→{o[1][1]}" for w, o in хуже))
    print("стало лучше:", "; ".join(f"{w}: {o[0][1]}→{o[1][1]}" for w, o in лучше))


if __name__ == "__main__":
    main()
