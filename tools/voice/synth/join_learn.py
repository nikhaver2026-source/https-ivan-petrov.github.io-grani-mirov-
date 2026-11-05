#!/usr/bin/env python3.13
"""join_learn.py ГОЛОС — выученная цена стыка по живой речи диктора: как меняются спектр, громкость и высота на
настоящих границах слов (слова подряд без паузы), отдельно для каждой пары видов звука (конец слова → начало
следующего: гласный, сонорный, звонкий шумный, глухой). Цена стыка кандидатов — насколько их перепад не похож на
живой (сумма квадратов отклонений в долях естественного разброса). Итог: join_<голос>.json.
Проверка: доля живых стыков и случайных пар, которых модель отличает (AUC)."""
import sys, json, math, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E

голос = sys.argv[1] if len(sys.argv) > 1 else "m"
V = E.Голос(голос)


def вид(z): return E.Синтезатор._класс_звука(z)


def край(o, сторона):
    ri, j = V.occ[o]; r = V.recs[ri]
    if "ph" not in r: return None
    return вид(r["ph"][j][-1][0] if сторона < 0 else r["ph"][j][0][0])


def перепад(o1, o2):
    d = list(V.mfs[o2][1:] - V.mfe[o1][1:]) + [float(V.ens[o2] - V.ene[o1])]
    a, b = V.f0e[o1], V.f0s[o2]
    d.append(12 * math.log2(b / a) if a > 0 and b > 0 else np.nan)
    return np.array(d, np.float64)


живые = {}
for o in range(len(V.occ) - 1):
    ri, j = V.occ[o]; r2, j2 = V.occ[o + 1]
    if ri != r2 or "ph" not in V.recs[ri] or V.recs[ri]["w"][j][4] > 0.005: continue
    п = (край(o, -1), край(o + 1, 0)); живые.setdefault(п, []).append(перепад(o, o + 1))
модель = {}
for п, xs in живые.items():
    X = np.array(xs)
    if len(X) < 50: continue
    mu = np.nanmean(X, 0); sd = np.nanstd(X, 0) + 1e-3
    модель["".join(п)] = {"mu": mu.tolist(), "sd": sd.tolist(), "n": len(X)}
print("пар видов:", len(модель), {k: v["n"] for k, v in модель.items()})


def цена(o1, o2):
    п = "".join((край(o1, -1) or "п", край(o2, 0) or "п")); m = модель.get(п)
    if not m: return None
    d = перепад(o1, o2); z = (d - np.array(m["mu"])) / np.array(m["sd"]); z = z[~np.isnan(z)]
    return float(np.mean(z * z))


# проверка: живые стыки против случайных пар с тем же сочетанием видов
rnd = random.Random(1); ж, сл = [], []
по_краю = {}
for o in range(len(V.occ)):
    k = край(o, 0)
    if k: по_краю.setdefault(k, []).append(o)
пары = [(o, o + 1) for o in range(len(V.occ) - 1) if V.occ[o][0] == V.occ[o + 1][0] and "ph" in V.recs[V.occ[o][0]] and V.recs[V.occ[o][0]]["w"][V.occ[o][1]][4] <= 0.005]
for o1, o2 in rnd.sample(пары, 4000):
    c = цена(o1, o2)
    if c is None: continue
    ж.append(c); o3 = rnd.choice(по_краю[край(o2, 0)])
    c2 = цена(o1, o3)
    if c2 is not None: сл.append(c2)
ж, сл = np.array(ж), np.array(сл)
s = np.r_[ж, сл]; y = np.r_[np.zeros(len(ж)), np.ones(len(сл))]
order = np.argsort(s); rk = np.empty(len(s)); rk[order] = np.arange(1, len(s) + 1)
auc = (rk[y == 1].sum() - len(сл) * (len(сл) + 1) / 2) / (len(сл) * len(ж))
print(f"цена живых стыков: медиана {np.median(ж):.2f}; случайных пар: {np.median(сл):.2f}; AUC {auc:.3f}")
json.dump({"пары": модель, "медиана_живых": float(np.median(ж))}, open(f"/root/S/us2/join_{голос}.json", "w", encoding="utf-8"), ensure_ascii=False)
print("записано: join_%s.json" % голос)
