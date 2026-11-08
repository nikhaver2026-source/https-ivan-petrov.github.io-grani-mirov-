#!/usr/bin/env python3.13
"""creak.py ГОЛОС — хрип (скрипучий голос) в каждом вхождении слова: доля громких кадров гласных (не тише пика записи
на 15 дБ) без определимой высоты голоса. У озвучки Gemini хрип часто на концах фраз; посреди синтезированной фразы
он слышен призвуком. Итог: creak_<голос>.json {"файл#j": доля} — движок штрафует выбор (вес «скрип»)."""
import sys, os, json, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"
V = None; ГЛ = set("аоуыэиАОУЫЭИ")


def init():
    global V
    import engine as E
    V = E.Синтезатор(ГОЛОС).V


def одна(ri):
    import psola
    r = V.recs[ri]
    if "ph" not in r: return None
    try:
        a = V.звук(ri); f, hop = psola._f0_дорожка(a)
        e = np.array([np.sqrt(np.mean(a[i * hop:i * hop + 2 * hop] ** 2) + 1e-10) for i in range(len(f))])
        гр = 20 * np.log10(e / (e.max() + 1e-12)) > -15; out = {}; изл = {}
        for j, фон in enumerate(r["ph"]):
            n = 0; без = 0
            for ph in фон:
                if ph[0] not in ГЛ: continue
                for q in range(int(ph[2] * 100), min(len(f), int(ph[3] * 100) + 1)):
                    if гр[q]: n += 1; без += f[q] <= 0
            if n >= 2: out[f"{r['f']}#{j}"] = round(без / n, 3)
            # срывы голоса: скачок высоты > 5 пт между соседними громкими звонкими кадрами внутри слова
            w = r["w"][j]; q0, q1 = int(w[1] * 100), min(len(f) - 1, int(w[2] * 100))
            k = 0; пред = None
            for q in range(q0, q1 + 1):
                if not (f[q] > 0 and гр[q]): continue
                if пред is not None and q - пред <= 5 and abs(12 * np.log2(f[q] / f[пред])) > 5: k += 1
                пред = q
            if k: изл[f"{r['f']}#{j}"] = k
        return out, изл
    except Exception:
        return None


if __name__ == "__main__":
    import engine as E
    n = len(E.Синтезатор(ГОЛОС).V.recs); итог = {}; изломы = {}
    with mp.get_context("fork").Pool(3, initializer=init) as pool:
        for i, r in enumerate(pool.imap_unordered(одна, range(n), chunksize=32)):
            if r: итог.update(r[0]); изломы.update(r[1])
            if i % 3000 == 0: print(f"{i}/{n}", flush=True)
    json.dump(итог, open(f"/root/S/us2/creak_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(изломы, open(f"/root/S/us2/pbreak_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
    print(f"срывов голоса: вхождений со срывом {len(изломы)} из {len(итог)}")
    v = np.array(list(итог.values())); print(f"готово: вхождений {len(v)}, хрип (доля громких кадров гласных без высоты): медиана {np.median(v):.3f}, > 0,3 у {np.mean(v > 0.3):.1%}, > 0,5 у {np.mean(v > 0.5):.1%}")
