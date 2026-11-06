#!/usr/bin/env python3.13
"""artef.py — где призвуки: одни и те же 40 фраз синтезируются с выключением по очереди каждой обработки; мерка —
выбросы покадрового скачка спектра (кадр 10 мс) вне стыков: 99-й перцентиль и доля кадров с резким скачком;
то же у живой речи. Обработка, после выключения которой выбросов меньше всего, — вероятный источник призвуков."""
import sys, json
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
фразы = json.load(open("/root/S/us2/test_set.json", encoding="utf-8"))[:40]
def поток(y, исключить=()):
    hop = 240; n = len(y) // hop
    M = np.array([E._mfcc(y[i * hop:i * hop + 2 * hop])[1:] for i in range(n - 1)]); en = np.array([E._db(y[i * hop:i * hop + 2 * hop]) for i in range(n - 1)])
    d = np.linalg.norm(np.diff(M, axis=0), axis=1); ok = (en[1:] > en.max() - 35) & (en[:-1] > en.max() - 35)
    for p in исключить: ok[max(0, p // hop - 3):p // hop + 3] = False   # рядом со стыками не считаем
    return d[ok]
варианты = {"всё (38)": {}, "без PSOLA-темпа": {"ровный_темп": 0}, "без сглаживания тембра": {"тембр_шов": 0},
            "без PSOLA-высоты": {"сгладить": 0}, "громкость 0,6": {"ровная_громкость": 0.6}, "без перекрытия стыков": {"плавный_стык": 0}}
S = E.Синтезатор("m")
for имя, w in варианты.items():
    S.в.update({"ровный_темп": 2, "тембр_шов": 1.0, "сгладить": 2, "ровная_громкость": 0.9, "плавный_стык": 10}); S.в.update(w)
    d = np.concatenate([поток(*(lambda y: (y, S.стыки))(S.сказать(ф)[0])) for ф in фразы])
    print(f"{имя:>24}: 99-й перцентиль {np.percentile(d, 99):.1f}, доля резких (>45) {np.mean(d > 45):.2%}", flush=True)
V = S.V; import random; random.seed(4)
d = np.concatenate([поток(V.звук(ri).astype(np.float32)) for ri in random.sample(range(20000), 120)])
print(f"{'живая речь':>24}: 99-й перцентиль {np.percentile(d, 99):.1f}, доля резких (>45) {np.mean(d > 45):.2%}")
