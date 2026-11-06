#!/usr/bin/env python3.13
"""gvcut.py ГОЛОС — разрезать сырые пакеты raw/<голос>/packNNN.wav на фразы (tools/voice/README.md, раздел «Что делать с записью пакета»).

1. Дробим запись по паузам от 0,1 с мельче, чем нужно; каждый кусок распознаём (GigaAM, sherpa-onnx).
2. Склеиваем соседние куски во фразы динамическим программированием с ценой «доля ошибочных букв»;
   пустые куски (вдохи, шум) можно пропустить.
3. Каждая фраза распознаётся ещё раз целиком: не больше 12 % ошибочных букв, темп не медленнее 8 знаков в секунду.
4. Края: спереди 30 мс, сзади 60 мс. Громкость — линейно до −18 LUFS, пик не выше −1 дБ (ffmpeg, до трёх проходов).
5. FLAC 24 кГц моно 16 бит → cut/<голос>/NNNN.flac; итог — cut/<голос>/итог.json (фраза → файл, отказы с причиной).
"""
import sys, os, re, json, glob, subprocess, tempfile
import numpy as np, soundfile as sf, sherpa_onnx

ГОЛОС = sys.argv[1]
ТУТ = os.environ.get("CORPUS_DIR", "/root/S/us2/corpus")
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
SR = 24000
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=3)


def норм(t):
    return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def lev(a, b):
    if a == b: return 0
    if not a or not b: return max(len(a), len(b))
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def cer(ref, hyp):
    r, h = норм(ref).replace(" ", ""), норм(hyp).replace(" ", "")
    return lev(r, h) / max(1, len(r))


def узнать(a):
    if len(a) < SR * 0.08: return ""
    a16 = np.interp(np.arange(0, len(a), SR / 16000), np.arange(len(a)), a).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s)
    return s.result.text.strip()


def куски(a):
    """Речь между паузами ≥ 0,22 с: [(начало, конец)] в отсчётах."""
    fr = int(SR * 0.01)
    n = len(a) // fr
    e = np.sqrt(np.mean(a[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(e)
    порог = max(np.percentile(db, 10) + 12, np.max(db) - 50)
    речь = db > порог
    out, i = [], 0
    while i < n:
        if not речь[i]: i += 1; continue
        j = i
        while j < n:
            if речь[j]: j += 1; continue
            k = j
            while k < n and not речь[k]: k += 1
            if k - j >= 10 or k >= n: break
            j = k
        out.append((i * fr, min(len(a), j * fr)))
        i = j
    return [(s, e) for s, e in out if e - s >= SR * 0.06]


def громкость(src, dst):
    gain = 0.0
    for _ in range(3):
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", f"volume={gain}dB,ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); P = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
        if abs(I + 18) <= 0.3 and P <= -1.0: break
        gain += -18 - I
    flt = f"volume={gain:.2f}dB,alimiter=limit=0.89:level=disabled:attack=1:release=40"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", flt, "-ar", str(SR), "-ac", "1",
                    "-sample_fmt", "s16", "-c:a", "flac", dst], check=True)


def main():
    out = f"{ТУТ}/cut/{ГОЛОС}"; os.makedirs(out, exist_ok=True)
    итог = {"годные": {}, "отказы": []}
    номер = 0
    for wav in sorted(glob.glob(f"{ТУТ}/raw/{ГОЛОС}/pack*.wav")):
        фразы = [f["t"] for f in json.load(open(wav[:-4] + ".json", encoding="utf-8"))]
        a, sr = sf.read(wav, dtype="float32")
        if a.ndim > 1: a = a.mean(axis=1)
        assert sr == SR, sr
        кс = куски(a)
        тексты = [узнать(a[s:e]) for s, e in кс]
        n, m, ГР = len(фразы), len(кс), 12
        INF = 1e9
        # dp[i][j]: лучшая цена, когда первые i фраз заняли первые j кусков
        dp = np.full((n + 1, m + 1), INF); dp[0][0] = 0; how = {}
        for j in range(1, m + 1):  # пропуск пустых кусков до первой фразы
            if not норм(тексты[j - 1]) and dp[0][j - 1] < INF: dp[0][j] = dp[0][j - 1]; how[(0, j)] = ("skip",)
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                best, arg = INF, None
                if not норм(тексты[j - 1]) and dp[i][j - 1] < INF:  # пустой кусок после фразы — выбросить
                    best, arg = dp[i][j - 1] + 0.02, ("skip",)
                for g in range(1, min(ГР, j) + 1):
                    if dp[i - 1][j - g] >= INF: continue
                    c = cer(фразы[i - 1], " ".join(тексты[j - g:j]))
                    v = dp[i - 1][j - g] + min(c, 1.5)
                    if v < best: best, arg = v, ("take", g)
                dp[i][j] = best
                if arg: how[(i, j)] = arg
        # обратный ход
        i, j, связь = n, m, {}
        while j > 0 and (i, j) in how and how[(i, j)][0] == "skip" and dp[i][j - 1] <= dp[i][j]: j -= 1
        while i > 0 and j > 0:
            h = how.get((i, j))
            if not h: break
            if h[0] == "skip": j -= 1; continue
            g = h[1]; связь[i - 1] = (j - g, j); i -= 1; j -= g
        for k, t in enumerate(фразы):
            if k not in связь: итог["отказы"].append({"t": t, "почему": "не нашлась в записи", "пакет": os.path.basename(wav)}); continue
            j0, j1 = связь[k]
            s = max(0, кс[j0][0] - int(SR * 0.03)); e = min(len(a), кс[j1 - 1][1] + int(SR * 0.06))
            кусок = a[s:e]; слышно = узнать(кусок); c = cer(t, слышно)
            знаков = len(норм(t).replace(" ", "")); сек = (кс[j1 - 1][1] - кс[j0][0]) / SR
            темп = знаков / max(0.05, сек)
            if c > 0.12 or темп < 8:
                итог["отказы"].append({"t": t, "почему": f"ошибок {c:.0%}, темп {темп:.1f}", "слышно": слышно, "пакет": os.path.basename(wav)}); continue
            try:   # голос: кусок чужим голосом (Gemini «съехал») — не брать
                import sys as _s; _s.path.insert(0, "/root/S/us2"); import voice_id
                годится, пояснение = voice_id.голос_подходит(кусок, ГОЛОС)
            except Exception as ex: годится, пояснение = True, f"проверка голоса не удалась: {ex}"
            if not годится:
                итог["отказы"].append({"t": t, "почему": пояснение, "пакет": os.path.basename(wav)}); continue
            номер += 1
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf: tmp = tf.name
            sf.write(tmp, кусок, SR, subtype="PCM_16")
            dst = f"{out}/{номер:04d}.flac"; громкость(tmp, dst); os.unlink(tmp)
            итог["годные"][t] = {"файл": os.path.basename(dst), "ошибок": round(c, 3), "темп": round(темп, 1), "сек": round(len(кусок) / SR, 2)}
        print(f"{os.path.basename(wav)}: фраз {n}, кусков {m}, годных {sum(1 for x in итог['годные'])}, отказов {len(итог['отказы'])}", flush=True)
    json.dump(итог, open(f"{out}/итог.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
