#!/usr/bin/env python3.13
"""learn_fit.py ФАЙЛ.npz — логистическая регрессия «слово не узнают» по признакам единицы и стыков (numpy, L2).
Проверка — на отложенной пятой части (AUC). Итог: learned_m.json — веса признаков (лог-шансы ошибки)."""
import sys, json
import numpy as np
zs = [np.load(f) for f in sys.argv[1:]]; имена = list(zs[0]["имена"])
X = np.concatenate([z["X"] for z in zs]).astype(np.float64); y = np.concatenate([z["y"] for z in zs]).astype(np.float64)
rng = np.random.default_rng(5); idx = rng.permutation(len(y)); k = len(y) // 5
тест, обуч = idx[:k], idx[k:]


def учить(X, y, l2=1e-3, шагов=4000, lr=0.5):
    w = np.zeros(X.shape[1]); b = float(np.log(y.mean() / (1 - y.mean())))
    for _ in range(шагов):
        p = 1 / (1 + np.exp(-(X @ w + b))); g = p - y
        w -= lr * (X.T @ g / len(y) + l2 * w); b -= lr * g.mean()
    return w, b


def auc(s, y):
    order = np.argsort(s); r = np.empty(len(s)); r[order] = np.arange(1, len(s) + 1)
    pos = y == 1; n1, n0 = pos.sum(), (~pos).sum()
    return (r[pos].sum() - n1 * (n1 + 1) / 2) / max(1, n1 * n0)


w, b = учить(X[обуч], y[обуч])
print(f"слов {len(y)}, доля неузнанных {y.mean():.3f}; AUC на отложенных {auc(X[тест] @ w + b, y[тест]):.3f}")
for н, v in sorted(zip(имена, w), key=lambda x: -abs(x[1])): print(f"  {н:>20}: {v:+.3f}")
w, b = учить(X, y)
json.dump({"b": b, "w": dict(zip(имена, map(float, w)))}, open("/root/S/us2/learned_m.json", "w"), ensure_ascii=False, indent=1)
print("веса записаны: learned_m.json")
