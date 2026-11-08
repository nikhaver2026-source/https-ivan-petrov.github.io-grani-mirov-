#!/usr/bin/env python3.13
"""edgef0.py ГОЛОС — высота краёв каждого вхождения по ближайшей к краю гласной: медиана первых/последних трёх громких
(не тише пика записи на 25 дБ) звонких кадров слова (дорожка 10 мс), поиск — до середины слова; плюс медиана высоты
слова. Прежняя высота краёв мерилась по 40 мс у самого края — там обычно согласный, и она чаще всего 0: выбор кусков
не видел скачков высоты на стыке. Итог: edgef0_<голос>.json {"файл#j": [начало, конец, медиана]}."""
import sys, os, json, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"
V = None


def init():
    global V
    import engine as E
    V = E.Синтезатор(ГОЛОС).V


def одна(ri):
    import psola
    r = V.recs[ri]
    try:
        a = V.звук(ri); f, hop = psola._f0_дорожка(a)
        e = np.array([np.sqrt(np.mean(a[i * hop:i * hop + 2 * hop] ** 2) + 1e-10) for i in range(len(f))])
        ok = (f > 0) & (20 * np.log10(e / (e.max() + 1e-12)) > -25); out = {}
        for j, w in enumerate(r["w"]):
            q0, q1 = int(w[1] * 100), min(len(f) - 1, int(w[2] * 100)); mid = (q0 + q1) // 2
            нач = [f[q] for q in range(q0, mid + 1) if ok[q]][:3]; кон = [f[q] for q in range(q1, mid - 1, -1) if ok[q]][:3]
            все = [f[q] for q in range(q0, q1 + 1) if ok[q]]
            if len(все) >= 3:
                мед = float(np.median(все))
                fs = float(np.median(нач)) if len(нач) >= 2 else 0.0; fe = float(np.median(кон)) if len(кон) >= 2 else 0.0
                # сбой оценки (дальше 6 пт от средней высоты слова) — не верить
                if fs and abs(12 * np.log2(fs / мед)) > 6: fs = 0.0
                if fe and abs(12 * np.log2(fe / мед)) > 6: fe = 0.0
                out[f"{r['f']}#{j}"] = [round(fs, 1), round(fe, 1), round(мед, 1)]
        return out
    except Exception:
        return None


if __name__ == "__main__":
    import engine as E
    n = len(E.Синтезатор(ГОЛОС).V.recs); итог = {}
    with mp.get_context("fork").Pool(3, initializer=init) as pool:
        for i, r in enumerate(pool.imap_unordered(одна, range(n), chunksize=32)):
            if r: итог.update(r)
            if i % 5000 == 0: print(f"{i}/{n}", flush=True)
    json.dump(итог, open(f"/root/S/us2/edgef0_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
    v = np.array(list(итог.values()))
    print(f"готово: вхождений {len(v)}, высота начала известна у {np.mean(v[:, 0] > 0):.1%}, конца у {np.mean(v[:, 1] > 0):.1%}")
