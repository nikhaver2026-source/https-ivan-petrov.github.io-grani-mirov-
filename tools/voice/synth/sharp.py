#!/usr/bin/env python3.13
"""sharp.py N [веса…] — резкость: (1) нарастание в начале и спад в конце фразы (мс от −30 дБ до −6 дБ пика и обратно);
(2) резкость смены звука у шва: поток спектра у точки против окрестности (MFCC, окна 10 мс) — синтез против живых
границ слов с теми же парами звуков; (3) скачок огибающей громкости через шов (дБ между соседними кадрами 10 мс)."""
import sys, os, json, random, collections
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000; Fm = 240


def огиб(y):
    n = len(y) // Fm; return 10 * np.log10(np.mean(y[:n * Fm].reshape(n, Fm).astype(np.float64) ** 2, axis=1) + 1e-10)


def края(y):
    e = огиб(y); пик = e.max(); над = np.where(e > пик - 30)[0]
    if len(над) < 5: return None
    i0, i1 = над[0], над[-1]
    j0 = i0 + int(np.argmax(e[i0:] > пик - 6)) if (e[i0:] > пик - 6).any() else i0
    j1 = i1 - int(np.argmax(e[:i1 + 1][::-1] > пик - 6))
    return (j0 - i0) * 10, (i1 - j1) * 10


def шов(y, p):
    if p - 6 * Fm < 0 or p + 6 * Fm > len(y): return None
    м = [E._mfcc(y[p + k * Fm:p + (k + 1) * Fm])[1:] for k in range(-4, 4)]   # 8 кадров по 10 мс вокруг точки
    d = [np.linalg.norm(м[k + 1] - м[k]) for k in range(7)]                     # поток между соседними кадрами
    у_точки = d[3]; фон = float(np.median([d[0], d[1], d[5], d[6]]))
    e = огиб(y[p - 2 * Fm:p + 2 * Fm])
    if e.max() < -50: return None
    return у_точки - фон, abs(e[2] - e[1])


N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
for арг in (sys.argv[2:] or ["{}"]):
    S = E.Синтезатор("m", json.loads(арг)); V = S.V; кр = []; ш = []; пары = collections.Counter()
    for ф in фразы:
        y, _ = S.сказать(ф); k_ = края(y)
        if k_: кр.append(k_)
        for от in E.текст_в_отрезки(ф):
            x, res, кс = S.отрезок(от["w"], от["end"])
            for k, p in enumerate(S.стыки_отрезка):
                m = шов(x, p)
                if m: ш.append(m); пары[(S._край_вид(кс[k], -1) or "?") + (S._край_вид(кс[k + 1], 0) or "?")] += 1
    кр, ш = np.array(кр), np.array(ш)
    print(f"синтез {арг}: нарастание {np.median(кр[:, 0]):.0f} мс, спад {np.median(кр[:, 1]):.0f} мс; резкость шва {ш[:, 0].mean():+.2f} (доля > 10: {np.mean(ш[:, 0] > 10):.1%}), скачок громкости {ш[:, 1].mean():.2f} дБ", flush=True)
random.seed(4); жк = []; жш = []; нужно = dict(пары); тр = 0
for ri in random.sample([i for i in range(len(V.recs)) if i not in V.искл_ri and not V.recs[i]["f"].startswith("/")], 300):
    k_ = края(V.звук(ri))
    if k_: жк.append(k_)
while sum(нужно.values()) > 0 and тр < 300000:
    тр += 1; ri = random.randrange(len(V.recs)); r = V.recs[ri]
    if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
    j = random.randrange(len(r["w"]) - 1)
    if r["w"][j][4] > 0.005: continue
    пара = (S._класс_звука(r["ph"][j][-1][0]) or "?") + (S._класс_звука(r["ph"][j + 1][0][0]) or "?")
    if нужно.get(пара, 0) <= 0: continue
    m = шов(V.звук(ri), int(r["w"][j][2] * SR))
    if m: жш.append(m); нужно[пара] -= 1
жк, жш = np.array(жк), np.array(жш)
print(f"живая речь: нарастание {np.median(жк[:, 0]):.0f} мс, спад {np.median(жк[:, 1]):.0f} мс; резкость шва {жш[:, 0].mean():+.2f} (доля > 10: {np.mean(жш[:, 0] > 10):.1%}), скачок громкости {жш[:, 1].mean():.2f} дБ")
