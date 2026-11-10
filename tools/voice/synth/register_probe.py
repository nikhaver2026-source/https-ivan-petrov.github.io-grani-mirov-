#!/usr/bin/env python3.13
"""register_probe.py — из чего складывается разброс высоты слов: регистр записи (её медиана) и ход внутри записи."""
import sys, json, math
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
V = E.Синтезатор("m").V
край = json.load(open("/root/S/us2/edgef0_m.json", encoding="utf-8"))
пт = lambda v: 12 * math.log2(v / V.f0_мед)
рег, внутри, все = [], [], []
for ri, r in enumerate(V.recs):
    if ri in V.искл_ri: continue
    m = [пт(край[f"{r['f']}#{j}"][2]) for j in range(len(r["w"])) if край.get(f"{r['f']}#{j}") and край[f"{r['f']}#{j}"][2] > 0]
    if len(m) < 3: continue
    med = float(np.median(m)); рег.append(med); внутри += [x - med for x in m]; все += m
рег, внутри, все = map(np.array, (рег, внутри, все))
print("записей", len(рег), "слов", len(все))
print("разброс высоты слов (СКО): всего %.2f пт; регистр записи %.2f пт; внутри записи %.2f пт" % (все.std(), рег.std(), внутри.std()))
print("регистр записи, процентили 5/25/50/75/95: " + " ".join("%.1f" % np.percentile(рег, q) for q in (5, 25, 50, 75, 95)))
print("доля записей в пределах ±1,5 пт от медианы голоса: %.0f %%" % (100 * np.mean(np.abs(рег) <= 1.5)))
