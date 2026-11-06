#!/usr/bin/env python3.13
"""edge_fix.py ГОЛОС — правка краёв слов по распознавателю: для вхождений, у которых при отдельном распознавании
испорчен край (лишнее или потерянное в начале — левый, в конце — правый), край сдвигается на −30, −15, +15, +30 мс;
вырезка (как в движке) распознаётся; берётся сдвиг с наименьшей долей ошибочных букв (при равенстве — меньший).
Итог: edges_<голос>.json {файл#слово: [сдвиг_начала, сдвиг_конца]} — движок прибавляет их к краям; карта чистоты
occ_<голос>_map.json обновляется для исправленных вхождений."""
import sys, os, json, re, multiprocessing as mp
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"; D = {"m": "gvoice", "f": "gvoice_f"}[ГОЛОС]
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"; SR = 24000
rec = None
СДВИГИ = (-0.030, -0.015, 0.015, 0.030)


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


def края(h, t):
    if h == t: return False, False
    if t in h: i = h.find(t); return i > 0, len(h) - i - len(t) > 0
    return h[:1] != t[:1], h[-1:] != t[-1:]


def одна(item):
    f, j, w, s0, e0, лев, прав, prev_cer = item
    pth = f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac"
    if not os.path.exists(pth): return None
    a, _ = sf.read(pth, dtype="float32"); тиш = np.zeros(int(SR * 0.08), np.float32); t = норм(w)
    def мерка(s, e):
        s, e = max(0.0, s), min(len(a) / SR, e)
        if e - s < 0.04: return 9.0, ""
        x = np.concatenate([тиш, a[int(s * SR):int(e * SR)], тиш])
        a16 = np.interp(np.arange(0, len(x), 1.5), np.arange(len(x)), x).astype(np.float32)
        st = rec.create_stream(); st.accept_waveform(16000, a16); rec.decode_stream(st); h = норм(st.result.text)
        return min(1.0, lev(t, h) / max(1, len(t))), h
    лучш = (prev_cer, 0.0, 0.0, None)
    варианты = [(ds, 0.0) for ds in СДВИГИ] if лев else []
    варианты += [(0.0, de) for de in СДВИГИ] if прав else []
    for ds, de in варианты:
        c, h = мерка(s0 + ds, e0 + de)
        if c < лучш[0] - 1e-9 or (abs(c - лучш[0]) < 1e-9 and лучш[3] is not None and abs(ds) + abs(de) < abs(лучш[1]) + abs(лучш[2])):
            лучш = (c, ds, de, h)
    if лучш[3] is None: return None
    return f"{f}#{j}", лучш[1], лучш[2], лучш[0], лучш[3], prev_cer


def main():
    recs = [json.loads(l) for l in open(f"/root/S/us2/db_{ГОЛОС}.jsonl", encoding="utf-8")]
    for доп in ("pack", "corpus"):
        p = f"/root/S/us2/db_{ГОЛОС}_{доп}.jsonl"
        if os.path.exists(p): recs += [json.loads(l) for l in open(p, encoding="utf-8")]
    карта = json.load(open(f"/root/S/us2/occ_{ГОЛОС}_map.json", encoding="utf-8"))
    гол = json.load(open(f"/root/S/us2/voice_{ГОЛОС}.json", encoding="utf-8")) if os.path.exists(f"/root/S/us2/voice_{ГОЛОС}.json") else {}
    items = []
    for r in recs:
        if "ph" not in r: continue
        x = гол.get(r["f"])
        if x and (x["p_жен"] > 0.3 or x["откл"] > 2.5 or x["f0"] > 190): continue   # чужой голос — не трогаем, он вне выбора
        ws = r["w"]
        for j, w in enumerate(ws):
            v = карта.get(f"{r['f']}#{j}")
            if not v or v[1] is None or v[0] <= 0: continue
            лев, прав = края(v[1], норм(w[0]))
            if not (лев or прав): continue
            s0 = w[1] - (min(w[3], 0.005) if j > 0 else 0.0); e0 = w[2] + (min(w[4], 0.025) if j < len(ws) - 1 else 0.0)
            items.append((r["f"], j, w[0], s0, e0, лев and j > 0, прав and j < len(ws) - 1, float(v[0])))
    items = [x for x in items if x[5] or x[6]]
    print(f"вхождений с испорченным краем: {len(items)}", flush=True)
    правки = {}; лучше = 0
    with mp.Pool(4, initializer=init) as pool:
        for i, r in enumerate(pool.imap_unordered(одна, items, chunksize=8)):
            if r:
                k, ds, de, c, h, c0 = r
                правки[k] = [round(ds, 3), round(de, 3)]; карта[k] = [round(c, 4), h]; лучше += c < c0
            if i % 2000 == 0: print(f"{i}/{len(items)} исправлено {len(правки)}", flush=True)
    json.dump(правки, open(f"/root/S/us2/edges_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(карта, open(f"/root/S/us2/occ_{ГОЛОС}_map.json", "w", encoding="utf-8"), ensure_ascii=False)
    print(f"готово: проверено {len(items)}, края сдвинуты у {len(правки)}, из них стало чище {лучше}")


if __name__ == "__main__":
    main()
