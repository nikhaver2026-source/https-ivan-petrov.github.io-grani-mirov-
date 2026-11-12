#!/usr/bin/env python3.13
"""neutr_rough.py [N] — не добавляет ли «конец_нейтрально» шероховатости: для фраз набора, которые правило задевает,
в последних 700 мс считаются громкие кадры (не тише пика на 15 дБ) с рассыпанным голосом (периодичность < 0,5 при
периодичности ≥ 0,8 у соседей по звонкому участку исходной фразы) — с правилом и без него."""
import sys, os, json, numpy as np
sys.path.insert(0, "/root/S/us2"); sys.path.insert(0, "/root/S/us2/dbg")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, tail as T
SR = 24000
Ф = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:int(sys.argv[1]) if len(sys.argv) > 1 else 60]
S = E.Синтезатор("m", None); база = dict(S.в)
def кадры(x):
    x = np.asarray(x, np.float64)[-int(0.7 * SR):]; N = int(SR * 0.03); h = int(SR * 0.01); out = []
    for k in range(0, len(x) - N, h):
        s = x[k:k + N]; f, r = T.период(s); out.append((E._db(s), r))
    return out
def рыхлых(к):
    if not к: return 0, 0
    пик = max(d for d, r in к); гр = [(d, r) for d, r in к if d > пик - 15]
    return sum(1 for d, r in гр if r < 0.5), len(гр)
всего = [0, 0, 0]; хуже = []
for ф in Ф:
    т = ф if isinstance(ф, str) else ф.get("t", "")
    S.в = dict(база); S._конец_сдвиги = []; y = S.сказать(т)[0]
    if not S._конец_сдвиги: continue
    S.в = dict(база); S.в["конец_нейтрально"] = 0.0; x = S.сказать(т)[0]
    a, n = рыхлых(кадры(x)); b, _ = рыхлых(кадры(y)); всего[0] += a; всего[1] += b; всего[2] += n
    if b - a >= 3: хуже.append((b - a, т[:60]))
print(f"задетых фраз: громких кадров {всего[2]}; рыхлых без правила {всего[0]}, с правилом {всего[1]}")
for d, т in sorted(хуже, reverse=True)[:8]: print("   +", d, т)
