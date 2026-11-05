#!/usr/bin/env python3.13
"""align_new.py ГОЛОС ФАЙЛ_БАЗЫ... — разметить звуки в записях базы, где разметки ещё нет (новые записи, корпус),
обученной моделью hmm_<голос>.npz, и записать в базу так же, как align_apply.py (края слов по звукам, «ph»)."""
import sys, json, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
import hmm_align as H

голос = sys.argv[1]; файлы = sys.argv[2:]
М = H.Модель.загрузить(f"/root/S/us2/hmm_{голос}.npz")


def разметить(r):
    try:
        x, e = H.признаки(H.звук_записи(голос, r["f"]))
        слова = [w[0] for w in r["w"]]; паузы = [w[4] >= 0.12 for w in r["w"]]
        гр = H.граф(М, слова, паузы)
        if гр is None: return None
        st, пр, мет, тр = гр
        путь, ll, _ = H.витерби(М, x, st, пр)
        if путь is None: return None
        T = len(путь); звуки_слов = [[] for _ in r["w"]]; t = 0
        while t < T:
            m_ = мет[путь[t]]; t1 = t
            while t1 + 1 < T and мет[путь[t1 + 1]] == m_: t1 += 1
            if m_ is not None:
                wi, pi, z, буква = m_
                звуки_слов[wi].append([z, буква, round(t * H.ШАГ, 3), round((t1 + 1) * H.ШАГ, 3)])
            t = t1 + 1
        if any(not z for z in звуки_слов): return None
        ws = []
        for j, (w_old, ph) in enumerate(zip(r["w"], звуки_слов)):
            s, e_ = ph[0][2], ph[-1][3]
            до = 0.0 if j == 0 else round(max(0.0, s - звуки_слов[j - 1][-1][3]), 3)
            после = 0.0 if j == len(r["w"]) - 1 else round(max(0.0, звуки_слов[j + 1][0][2] - e_), 3)
            буквы = [round(next((z[2] for z in ph if z[1] >= k), ph[-1][3]), 3) for k in range(len(w_old[0]))]
            ws.append([w_old[0], s, e_, до, после, буквы])
        r = dict(r); r["w"] = ws; r["ph"] = звуки_слов; r["ll"] = round(ll, 3); return r
    except Exception:
        return None


if __name__ == "__main__":
    for p in файлы:
        recs = [json.loads(l) for l in open(p, encoding="utf-8")]
        нужно = [i for i, r in enumerate(recs) if "ph" not in r]
        with mp.get_context("fork").Pool(4) as pool: нов = pool.map(разметить, [recs[i] for i in нужно], chunksize=16)
        k = 0
        for i, r in zip(нужно, нов):
            if r: recs[i] = r; k += 1
        with open(p, "w", encoding="utf-8") as fo:
            for r in recs: fo.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"{p}: без разметки было {len(нужно)}, размечено {k}")
