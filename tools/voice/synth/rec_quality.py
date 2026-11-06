#!/usr/bin/env python3.13
"""rec_quality.py ГОЛОС — качество звучания каждой записи базы склейки (DNSMOS P.835: SIG — искажения речи, OVRL):
сбои озвучки (треск, дребезг, «металл») в исходной записи попадают в синтез вместе со словами. Итог: rq_<голос>.json
{файл: [SIG, BAK, OVRL]} — движок штрафует выбор слов из записей с низким SIG (вес «качество_ист»)."""
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
    import judge_q
    try: return V.recs[ri]["f"], [round(v, 3) for v in judge_q.оценка(V.звук(ri), окон=1)]
    except Exception: return None


if __name__ == "__main__":
    import engine as E
    V0 = E.Синтезатор(ГОЛОС).V; n = len(V0.recs); вых = f"/root/S/us2/rq_{ГОЛОС}.json"
    итог = json.load(open(вых + ".part", encoding="utf-8")) if os.path.exists(вых + ".part") else {}
    нужно = [ri for ri in range(n) if V0.recs[ri]["f"] not in итог]
    print(f"уже оценено {len(итог)}, осталось {len(нужно)}", flush=True)
    with mp.get_context("fork").Pool(3, initializer=init) as pool:
        for i, r in enumerate(pool.imap_unordered(одна, нужно, chunksize=16)):
            if r: итог[r[0]] = r[1]
            if i % 1000 == 0:
                print(f"{i}/{len(нужно)}", flush=True)
                json.dump(итог, open(вых + ".part", "w", encoding="utf-8"), ensure_ascii=False)   # перезапуск не теряет работу
    json.dump(итог, open(вых, "w", encoding="utf-8"), ensure_ascii=False)
    s = np.array([v[0] for v in итог.values()])
    print(f"готово: записей {len(итог)}, SIG медиана {np.median(s):.3f}, 5 % {np.percentile(s, 5):.3f}, 1 % {np.percentile(s, 1):.3f}")
