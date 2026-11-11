#!/usr/bin/env python3.13
"""weak.py ГОЛОС — слабые вхождения: уровень каждого слова базы относительно уровня речи своей записи (дБ).
Зачем: игрок (11.11.2026) услышал, что в «не стесняйся» слог «не» пропадает. Выбранное «не» оказалось на 12 дБ тише
обычного и без голоса (хвост длинной фразы), а мерка хрипа его не видела (она считает только громкие кадры).
Итог — weak_<голос>.json {"запись#номер_слова": дБ}; движок берёт плату «слабость» за слово тише обычного для него."""
import sys, os, json, numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"; SR = E.SR
V = E.Голос(ГОЛОС); out = {}
for ri, r in enumerate(V.recs):
    a = V.звук(ri)
    if a is None or len(a) < 200: continue
    гр = a[np.abs(a) > 0.03 * float(np.abs(a).max())]
    if len(гр) < 200: continue
    база = E._db(гр)
    for j, w in enumerate(r["w"]):
        s = a[int(w[1] * SR):int(w[2] * SR)]
        if len(s) >= 120: out[f"{r['f']}#{j}"] = round(E._db(s) - база, 1)
    if ri % 4000 == 0: print(ri, len(V.recs), flush=True)
json.dump(out, open(f"/root/S/us2/weak_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
v = np.array(list(out.values())); print("готово: вхождений", len(out), "медиана %.1f, 1%% %.1f, 5%% %.1f" % (np.median(v), np.percentile(v, 1), np.percentile(v, 5)))
