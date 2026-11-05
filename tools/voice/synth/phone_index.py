#!/usr/bin/env python3.13
"""phone_index.py ГОЛОС — указатель всех звуков базы (по разметке hmm_align): поток кодов звуков по записям
(между записями — «|»), для каждого звука — запись, слово, номер звука, начало и конец, начало/конец слова,
промежуток до следующего звука, а в середине звука — спектр (13 MFCC окна 20 мс), высота (окно 40 мс) и громкость.
Нужен для сборки незнакомых слов из кусков всей речи диктора (дифонный отбор). Итог: phidx_<голос>.npz."""
import sys, json, multiprocessing as mp
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E

голос = sys.argv[1] if len(sys.argv) > 1 else "m"
V = None


def _запись(ri):
    r = V.recs[ri]
    if "ph" not in r: return ri, None
    a = V.звук(ri); out = []
    W2 = int(E.SR * 0.01); W4 = int(E.SR * 0.02)
    for j, ph in enumerate(r["ph"]):
        for k, (z, б, t0, t1) in enumerate(ph):
            c = int((t0 + t1) / 2 * E.SR)
            x2 = a[max(0, c - W2):c + W2]; x4 = a[max(0, c - W4):c + W4]
            mf = E._mfcc(x2) if len(x2) >= 64 else np.zeros(13)
            f0 = E._yin_f0(x4) if len(x4) >= 2 * W4 - 2 else 0.0
            out.append((j, k, z, t0, t1, mf, f0, E._db(x2) if len(x2) else -60.0, k == 0, k == len(ph) - 1))
    return ri, out


def main():
    global V
    V = E.Голос(голос)
    with mp.get_context("fork").Pool(4) as pool:
        res = pool.map(_запись, range(len(V.recs)), chunksize=64)
    поток = []; ri_ = []; j_ = []; k_ = []; t0_ = []; t1_ = []; mf_ = []; f0_ = []; en_ = []; wi_ = []; wf_ = []
    for ri, out in res:
        if not out: continue
        for (j, k, z, t0, t1, mf, f0, en, wi, wf) in out:
            поток.append(z); ri_.append(ri); j_.append(j); k_.append(k); t0_.append(t0); t1_.append(t1)
            mf_.append(mf); f0_.append(f0); en_.append(en); wi_.append(wi); wf_.append(wf)
        поток.append("|"); ri_.append(-1); j_.append(-1); k_.append(-1); t0_.append(0); t1_.append(0)
        mf_.append(np.zeros(13)); f0_.append(0); en_.append(-60); wi_.append(False); wf_.append(False)
    t0a, t1a = np.array(t0_, np.float32), np.array(t1_, np.float32)
    пром = np.r_[t0a[1:] - t1a[:-1], 0].astype(np.float32)   # промежуток до следующего звука (пауза между словами)
    np.savez(f"/root/S/us2/phidx_{голос}.npz", поток=np.array(["".join(поток)]), ri=np.array(ri_, np.int32), j=np.array(j_, np.int16),
             k=np.array(k_, np.int16), t0=t0a, t1=t1a, mf=np.array(mf_, np.float32), f0=np.array(f0_, np.float32),
             en=np.array(en_, np.float32), wi=np.array(wi_), wf=np.array(wf_), пром=пром)
    print(f"звуков: {len(поток) - поток.count('|')}, записей: {поток.count('|')}")


if __name__ == "__main__":
    main()
