#!/usr/bin/env python3.13
"""oov_lex.py ГОЛОС [N] — выученный словарь собранных слов: каждое слово текстов игры, которого нет в записях
(oov_game_words.json, по частоте), собирается несколькими способами (сборка из потока речи с разными ценами,
дифоны внутри слов, сборка по буквам); каждый вариант синтезируется отдельно и распознаётся; берётся вариант с
наименьшей долей ошибочных звуков (при равенстве — основной). Итог: oovlex_<голос>.json {слово: {"части": [[файл,
начало, конец, середина_в_начале, середина_в_конце], ...], "ош": доля, "способ": имя}} — движок берёт части оттуда."""
import sys, os, json, re, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"; N = int(sys.argv[2]) if len(sys.argv) > 2 else 100000
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
СПОСОБЫ = [("поток", {}), ("поток край1", {"п_край": 1.0}), ("поток K32", {"п_K": 32}),
           ("дифоны", {"поток": 0, "дифоны": 1}), ("буквы", {"поток": 0, "дифоны": 0})]
S = rec = None


def init():
    global S, rec
    import engine as E, sherpa_onnx
    S = E.Синтезатор(ГОЛОС, {"лексикон": 0})
    rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=1)


def норм(t): return re.sub(r"[^а-я]+", "", t.lower().replace("ё", "е"))


def тр(w):
    import fon
    try: return "".join({"э": "и", "о": "а"}.get(z, z).lower() for z, _ in fon.слово(w))
    except Exception: return w


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def одно(w):
    import engine as E
    база = dict(S.в); лучш = None
    for имя, веса in СПОСОБЫ:
        S.в = {**база, **веса}
        try:
            части = S.из_частей(w)
            if not части: continue
            y, _ = S.сказать(w)
            y = np.concatenate([np.zeros(2400, np.float32), y, np.zeros(2400, np.float32)])
            a16 = np.interp(np.arange(0, len(y), 1.5), np.arange(len(y)), y).astype(np.float32)
            st = rec.create_stream(); st.accept_waveform(16000, a16); rec.decode_stream(st); h = норм(st.result.text)
            t = тр(w); ош = min(1.0, lev(t, тр(h) if h else "") / max(1, len(t)))
            if лучш is None or ош < лучш[0] - 1e-9:
                лучш = (ош, имя, [[S.V.recs[ч[0]]["f"], round(float(ч[1]), 4), round(float(ч[2]), 4), bool(ч[3]) if len(ч) > 3 else False,
                                   bool(ч[4]) if len(ч) > 4 else False] for ч in части], h)
        except Exception:
            continue
    S.в = база
    return w, лучш


def main():
    слова = json.load(open(os.environ.get("OOV_WORDS", "/root/S/us2/oov_game_words.json"), encoding="utf-8"))[:N]
    итог = {}
    with mp.get_context("fork").Pool(4, initializer=init) as pool:
        for i, (w, r) in enumerate(pool.imap_unordered(одно, слова, chunksize=4)):
            if r: итог[w] = {"части": r[2], "ош": round(r[0], 3), "способ": r[1], "слышно": r[3]}
            if i % 200 == 0: print(f"{i}/{len(слова)}", flush=True)
    вых = os.environ.get("OOV_OUT", f"/root/S/us2/oovlex_{ГОЛОС}.json")
    if os.environ.get("OOV_MERGE") and os.path.exists(вых):   # дополнить имеющийся словарь
        старый = json.load(open(вых, encoding="utf-8")); старый.update(итог); итог_всё = старый
    else: итог_всё = итог
    json.dump(итог_всё, open(вых, "w", encoding="utf-8"), ensure_ascii=False)
    ош = np.array([x["ош"] for x in итог.values()])
    from collections import Counter
    print(f"готово: слов {len(итог)}, ошибочных звуков в среднем {ош.mean():.3f}, без ошибки {np.mean(ош == 0):.1%}; способы {dict(Counter(x['способ'] for x in итог.values()))}")


if __name__ == "__main__":
    main()
