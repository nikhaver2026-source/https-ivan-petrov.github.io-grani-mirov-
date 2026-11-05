#!/usr/bin/env python3.13
"""occ_check.py ГОЛОС — чистота каждого вхождения слова: вырезать слово по границам базы (с тишиной по краям),
распознать отдельно, доля ошибочных букв против самого слова. Итог: /root/S/us2/occ_<голос>.npy (порядок — как
у Голос.occ: записи базы, затем пакета, слова по порядку)."""
import sys, os, re, json, multiprocessing as mp
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import engine as E
ГОЛОС = sys.argv[1]
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"; D = {"m": "gvoice", "f": "gvoice_f"}[ГОЛОС]
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"; SR = 24000
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


def запись(item):
    r, нужно = item
    f = r["f"]; a, sr = sf.read(f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac", dtype="float32")
    out = []; тиш = np.zeros(int(SR * 0.08), dtype=np.float32)
    for jj, w in enumerate(r["w"]):
        if not нужно[jj]: out.append((-1.0, None)); continue
        # вырезать так, как движок берёт слово рядом с чужим соседом
        s0, e0 = w[1], w[2]; ws = r["w"]
        if "ph" in r:   # разметка звуков: край — граница звука, в паузу — чуть-чуть
            if jj > 0: s0 = w[1] - min(w[3], 0.005)
            if jj < len(ws) - 1: e0 = w[2] + min(w[4], 0.025)
        else:
            if jj > 0 and w[5] and w[3] < 0.05: s0 = max(s0, w[5][0] - E.Синтезатор._до(w[0][0]))
            if jj < len(ws) - 1 and w[5] and w[4] < 0.05: e0 = min(e0, w[5][-1] + E.Синтезатор._после(w[0][-1]))
        x = np.concatenate([тиш, a[int(s0 * SR):int(e0 * SR)], тиш])
        a16 = np.interp(np.arange(0, len(x), SR / 16000), np.arange(len(x)), x).astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s)
        h = норм(s.result.text); t = норм(w[0])
        out.append((min(1.0, lev(t, h) / max(1, len(t))), h))
    return out


def main():
    recs = [json.loads(l) for l in open(f"/root/S/us2/db_{ГОЛОС}.jsonl", encoding="utf-8")]
    for доп in ("pack", "corpus"):
        if os.path.exists(f"/root/S/us2/db_{ГОЛОС}_{доп}.jsonl"): recs += [json.loads(l) for l in open(f"/root/S/us2/db_{ГОЛОС}_{доп}.jsonl", encoding="utf-8")]
    # до 12 вхождений на слово: те, что вероятнее пойдут в дело (близкие по длине к медиане; середина, начало, конец)
    по_слову = {}
    for ri, r in enumerate(recs):
        for j, w in enumerate(r["w"]):
            место = "н" if j == 0 or w[3] > 0.15 else "к" if j == len(r["w"]) - 1 or w[4] > 0.15 else "с"
            по_слову.setdefault(w[0], []).append((ri, j, w[2] - w[1], место))
    отбор = set()
    for w, xs in по_слову.items():
        м = float(np.median([x[2] for x in xs]))
        for место, сколько in (("с", 6), ("к", 3), ("н", 3)):
            for x in sorted((x for x in xs if x[3] == место), key=lambda x: abs(x[2] - м))[:сколько]: отбор.add((x[0], x[1]))
    items = [(r, [(ri, j) in отбор for j in range(len(r["w"]))]) for ri, r in enumerate(recs)]
    print("вхождений к проверке:", len(отбор), flush=True)
    # возобновление: готовые записи — из промежуточного сохранения (контейнер может перезапуститься)
    чек = f"/root/S/us2/occ_{ГОЛОС}.part3.json"
    готово = json.load(open(чек)) if os.path.exists(чек) else []
    print(f"уже проверено записей: {len(готово)}", flush=True)
    res = [x for r in готово for x in r]; done = list(готово)
    with mp.Pool(4, initializer=init) as pool:
        for i, r in enumerate(pool.imap(запись, items[len(готово):], chunksize=16), len(готово)):
            res += r; done.append(r)
            if i % 2000 == 0:
                json.dump(done, open(чек + ".tmp", "w")); os.replace(чек + ".tmp", чек); print(f"{i}/{len(recs)}", flush=True)
    a = np.array([x[0] for x in res], dtype=np.float32); np.save(f"/root/S/us2/occ_{ГОЛОС}.npy", a)
    json.dump([x[1] for x in res], open(f"/root/S/us2/occ_{ГОЛОС}_heard.json", "w", encoding="utf-8"), ensure_ascii=False)
    пр = a[a >= 0]
    print(f"готово: вхождений {len(a)}, проверено {len(пр)}, из них чисто {np.mean(пр == 0):.2%}, средняя доля ошибок {пр.mean():.3f}")


if __name__ == "__main__":
    main()
