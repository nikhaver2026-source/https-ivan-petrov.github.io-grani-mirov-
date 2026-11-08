#!/usr/bin/env python3.13
"""voice_scan.py — голос по окнам внутри записи: Gemini иногда переходит на женский голос лишь на часть записи, и
оценка записи целиком «размывается» (5–8 ноября пропущена запись с вероятностью 0,35). Для каждой мужской записи
(опись игры и база склейки): вероятность женского голоса целиком и наибольшая по окнам 1 с (шаг 0,5 с), высота окна.
Модель — voice_model.npz (voice_check.py). Итог: voice_scan_m.json {файл: [p_целиком, p_окно_макс, f0_окна, начало_окна]}."""
import sys, os, json, glob, re, multiprocessing as mp
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import engine as E, psola
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
M = np.load("/root/S/us2/voice_model.npz")


def путь(f):
    if f.startswith("/"): return f + ".flac"
    return f"{R}/sounds/{f if '/' in f else 'gvoice/' + f}.flac"


def p_жен(f0v, mf):
    if len(f0v) < 5 or len(mf) < 3: return None, 0.0
    x = np.r_[np.log(np.median(f0v)), np.log(np.percentile(f0v, 90) / max(1.0, np.percentile(f0v, 10))), np.mean(mf, axis=0)]
    z = (x - M["mu"]) / M["sd"]; return float(1 / (1 + np.exp(-(z @ M["w"] + float(M["b"]))))), float(np.median(f0v))


def одна(f):
    try:
        a, sr = sf.read(путь(f), dtype="float32"); f0, hop = psola._f0_дорожка(a)
        idx = [i for i in np.where(f0 > 0)[0] if i * hop + 2 * hop <= len(a)]
        if len(idx) < 5: return f, None
        mf = {i: E._mfcc(a[i * hop:i * hop + 2 * hop]) for i in idx[::2]}
        p0, _ = p_жен(f0[idx], np.array(list(mf.values())))
        best = (0.0, 0.0, 0.0); W = 100; H = 50   # кадры по 10 мс
        for s in range(0, max(1, len(f0) - W + 1), H):
            ii = [i for i in idx if s <= i < s + W]
            pw, fw = p_жен(f0[ii], np.array([mf[i] for i in ii if i in mf]))
            if pw is not None and pw > best[0]: best = (pw, fw, s * hop / sr)
        return f, [round(p0, 3) if p0 is not None else None, round(best[0], 3), round(best[1], 1), round(best[2], 2)]
    except Exception:
        return f, None


if __name__ == "__main__":
    о = sorted(glob.glob(f"{R}/sounds/gvoice/bank_*[0-9].js"), key=lambda x: int(re.search(r"(\d+)\.js$", x).group(1)))[-1]
    t = open(о, encoding="utf-8").read(); p = json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]
    файлы = set(p.values())
    for доп in ("_pack", "_corpus"):
        q = f"/root/S/us2/db_m{доп}.jsonl"
        if os.path.exists(q): файлы |= {json.loads(l)["f"] for l in open(q, encoding="utf-8")}
    файлы = sorted(файлы); итог = {}
    with mp.Pool(3) as pool:
        for i, (f, r) in enumerate(pool.imap_unordered(одна, файлы, chunksize=32)):
            if r: итог[f] = r
            if i % 5000 == 0: print(f"{i}/{len(файлы)}", flush=True)
    json.dump(итог, open("/root/S/us2/voice_scan_m.json", "w", encoding="utf-8"), ensure_ascii=False)
    v = np.array([[x[0] or 0, x[1]] for x in итог.values()])
    print(f"готово: записей {len(итог)}; целиком p>0,5: {int((v[:, 0] > 0.5).sum())}, p>0,3: {int((v[:, 0] > 0.3).sum())}; окно p>0,7: {int((v[:, 1] > 0.7).sum())}, окно p>0,9: {int((v[:, 1] > 0.9).sum())}")
