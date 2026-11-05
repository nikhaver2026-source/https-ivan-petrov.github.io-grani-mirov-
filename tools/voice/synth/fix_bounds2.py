#!/usr/bin/env python3.13
"""fix_bounds2.py ГОЛОС [суффикс] — границы слов по переходу звука, а не по тишине. Тишина внутри глухого «с», «ш»,
«ф» тише гласной перед ним, и граница по тишине срезала начало такого слова. Теперь граница — в точке наибольшего
изменения спектра между последней буквой слова (+20 мс) и первой буквой следующего (−10 мс), с предпочтением более
ранней точки (смычка перед «п», «т», «к» остаётся со своим словом)."""
import sys, json, numpy as np, soundfile as sf, multiprocessing as mp
sys.path.insert(0, "/root/S/us2"); import engine as E
ГОЛОС = sys.argv[1]; СУФ = sys.argv[2] if len(sys.argv) > 2 else ""
R = E.R; D = {"m": "gvoice", "f": "gvoice_f"}[ГОЛОС]; SR = E.SR; hop = int(SR * 0.005); N = int(SR * 0.02)


def граница(a, t0, t1):
    i0, i1 = max(0, int(t0 * SR) - N // 2), min(len(a), int(t1 * SR) + N // 2)
    if i1 - i0 < N + hop * 3: return (t0 + t1) / 2
    кадры = [a[k:k + N] for k in range(i0, i1 - N, hop)]
    M = np.array([E._mfcc(x)[1:] for x in кадры]); En = np.array([E._db(x) for x in кадры])
    поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]; поток += np.r_[0, np.abs(np.diff(En))] * 0.5
    д = np.linspace(0, 1, len(кадры))
    оц = поток / (поток.max() + 1e-9) - 0.25 * д
    k = int(np.argmax(оц)); return (i0 + k * hop + N // 2) / SR


def исправить(line):
    r = json.loads(line); f = r["f"]
    a, _ = sf.read(f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac", dtype="float32")
    ws = r["w"]
    for i in range(len(ws) - 1):
        бA, бB = ws[i][5], ws[i + 1][5]
        if not бA or not бB: continue
        t0, t1 = бA[-1] + 0.02, бB[0] - 0.01
        b = (бA[-1] + бB[0]) / 2 if t1 - t0 < 0.015 else граница(a, t0, t1)
        ws[i][2] = round(b, 3); ws[i + 1][1] = round(b, 3)
    return json.dumps(r, ensure_ascii=False)


if __name__ == "__main__":
    src = f"/root/S/us2/db_{ГОЛОС}{СУФ}.jsonl"; lines = open(src, encoding="utf-8").read().splitlines()
    with mp.Pool(4) as p: out = p.map(исправить, lines, chunksize=64)
    import shutil; shutil.copy(src, src + ".v2")
    open(src, "w", encoding="utf-8").write("\n".join(out) + "\n"); print("границы по переходу звука:", len(out))
