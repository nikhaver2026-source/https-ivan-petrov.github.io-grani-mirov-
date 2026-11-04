#!/usr/bin/env python3.13
"""fix_bounds.py ГОЛОС — границы слов заново, по сохранённому времени букв: провал громкости строго между
последней буквой слова (+30 мс) и первой буквой следующего (−15 мс). Прежде окно заходило на 40 мс за первую
букву следующего слова, и его начальный согласный прилипал к концу предыдущего (слипание при склейке)."""
import sys, json, numpy as np, soundfile as sf, multiprocessing as mp
ГОЛОС = sys.argv[1]; R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"; D = {"m": "gvoice", "f": "gvoice_f"}[ГОЛОС]; SR = 24000


def исправить(line):
    r = json.loads(line); f = r["f"]
    a, sr = sf.read(f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac", dtype="float32")
    fr = int(SR * 0.005); n = len(a) // fr
    e = np.sqrt(np.mean(a[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10)
    ws = r["w"]
    for i in range(len(ws) - 1):
        бA, бB = ws[i][5], ws[i + 1][5]
        if not бA or not бB: continue
        t0, t1 = бA[-1] + 0.03, бB[0] - 0.015
        if t1 - t0 < 0.01:
            b = (бA[-1] + бB[0]) / 2
        else:
            i0, i1 = int(t0 * SR / fr), min(len(e), max(int(t0 * SR / fr) + 1, int(t1 * SR / fr)))
            b = (i0 + int(np.argmin(e[i0:i1]))) * fr / SR + fr / SR / 2
        ws[i][2] = round(b, 3); ws[i + 1][1] = round(b, 3)
    return json.dumps(r, ensure_ascii=False)


if __name__ == "__main__":
    src = f"/root/S/us2/db_{ГОЛОС}{sys.argv[2] if len(sys.argv) > 2 else ''}.jsonl"; lines = open(src, encoding="utf-8").read().splitlines()
    with mp.Pool(4) as p: out = p.map(исправить, lines, chunksize=64)
    import shutil; shutil.copy(src, src + ".v1")
    open(src, "w", encoding="utf-8").write("\n".join(out) + "\n"); print("границы обновлены:", len(out))
