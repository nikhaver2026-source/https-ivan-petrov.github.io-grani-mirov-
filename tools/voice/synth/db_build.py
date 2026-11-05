#!/usr/bin/env python3.13
"""db_build.py ГОЛОС — база слов для склейки из записей Gemini (sounds/gvoice или sounds/gvoice_f).

Каждая запись распознаётся GigaAM (время каждой буквы, шаг 40 мс). В базу идут только записи, где распознанное
совпало с текстом описи (не больше одной ошибочной буквы на слово в среднем и столько же слов). Для каждого слова:
файл, начало и конец (граница уточняется по провалу громкости между словами), соседи слева и справа,
место во фразе, паузы до и после. Итог: /root/S/us2/db_<голос>.jsonl — по строке на запись:
{"f": файл, "k": ключ фразы, "dur": сек, "w": [[слово, начало, конец, пауза_до, пауза_после, [время каждой буквы]], ...]}"""
import sys, os, re, json, glob, multiprocessing as mp
import numpy as np, soundfile as sf

ГОЛОС = sys.argv[1]
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
D = {"m": "gvoice", "f": "gvoice_f"}[ГОЛОС]
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = None


def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def init():
    global rec
    import sherpa_onnx
    rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=1)


def энергия(a, sr):
    fr = int(sr * 0.005); n = len(a) // fr
    return np.sqrt(np.mean(a[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10), fr


def обработать(item):
    k, f = item
    try:
        a, sr = sf.read(f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac", dtype="float32")
        a16 = np.interp(np.arange(0, len(a), sr / 16000), np.arange(len(a)), a).astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s); r = s.result
        слышно = норм(r.text); слова = k.split()
        if слышно.split() != слова: return None  # только точное совпадение слов — разметка надёжна
        # буквы → слова по пробелам
        ws, cur = [], []
        for tok, t in zip(r.tokens, r.timestamps):
            if tok.strip() == "":
                if cur: ws.append(cur); cur = []
            else: cur.append(t)
        if cur: ws.append(cur)
        if len(ws) != len(слова): return None
        e, fr = энергия(a, sr); dur = len(a) / sr
        def мин_между(t0, t1):
            i0, i1 = int(t0 * sr / fr), max(int(t0 * sr / fr) + 1, int(t1 * sr / fr))
            i1 = min(i1, len(e)); i0 = min(i0, i1 - 1)
            return (i0 + int(np.argmin(e[i0:i1]))) * fr / sr
        out = []
        for i, w in enumerate(ws):
            s0 = 0.0 if i == 0 else None; e0 = dur if i == len(ws) - 1 else None
            out.append([слова[i], s0, e0, w[0], w[-1], w])
        # границы между словами: провал громкости между последней буквой слова и первой буквой следующего
        for i in range(len(out) - 1):
            b = мин_между(out[i][4] + 0.02, out[i + 1][3] + 0.04)
            out[i][2] = b; out[i + 1][1] = b
        # паузы: тишина у границы (громкость ниже −45 дБ от пика) дольше 0,12 с
        пик = float(np.max(e)); тихо = e < пик * 10 ** (-40 / 20)
        def пауза(t):
            i = int(t * sr / fr); l = i; r_ = i
            while l > 0 and тихо[l - 1]: l -= 1
            while r_ < len(тихо) and тихо[r_]: r_ += 1
            return round((r_ - l) * fr / sr, 3)
        рез = []
        for i, (w, s0, e0, _, _, буквы) in enumerate(out):
            рез.append([w, round(s0, 3), round(e0, 3), пауза(s0) if i else 0.0, пауза(e0) if i < len(out) - 1 else 0.0, [round(x, 2) for x in буквы]])
        return {"f": f, "k": k, "dur": round(dur, 3), "w": рез}
    except Exception as ex:
        return None


def main():
    if len(sys.argv) > 2 and sys.argv[2] == "corpus":  # корпус синтезатора (us2/corpus): только для склейки, не для игры
        и = json.load(open(f"/root/S/us2/corpus/cut/{ГОЛОС}/итог.json", encoding="utf-8"))["годные"]
        def кл(t): return re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е")).strip()
        items = [(кл(t), f"/root/S/us2/corpus/cut/{ГОЛОС}/{v['файл'][:-5]}") for t, v in и.items()]; out = f"/root/S/us2/db_{ГОЛОС}_corpus.jsonl"
    elif len(sys.argv) > 2 and sys.argv[2] == "pack":  # голосовой пакет того же голоса
        t = open(f"{R}/sounds/gvoice_pack/{ГОЛОС}/bank.js", encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
        items = [(k, f"gvoice_pack/{ГОЛОС}/{v}") for k, v in p.items()]; out = f"/root/S/us2/db_{ГОЛОС}_pack.jsonl"
    else:
        о = sorted(glob.glob(f"{R}/sounds/{D}/bank_*[0-9].js"), key=lambda x: int(re.search(r"(\d+)\.js$", x).group(1)))[-1]
        t = open(о, encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
        items = list(p.items()); out = f"/root/S/us2/db_{ГОЛОС}.jsonl"
    ok = 0
    with mp.Pool(4, initializer=init) as pool, open(out, "w", encoding="utf-8") as fo:
        for i, r in enumerate(pool.imap_unordered(обработать, items, chunksize=32)):
            if r: fo.write(json.dumps(r, ensure_ascii=False) + "\n"); ok += 1
            if i % 2000 == 0: print(f"{i}/{len(items)} годных {ok}", flush=True)
    print(f"готово: записей {len(items)}, в базе {ok}")


if __name__ == "__main__":
    main()
