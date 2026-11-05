#!/usr/bin/env python3.13
"""join_mlp.py ГОЛОС — выученная цена стыка, вторая ступень: небольшая нейросеть (numpy) отличает живой переход
между словами у диктора от склейки двух случайных слов с теми же видами краевых звуков.
Признаки стороны: спектр края (13 MFCC), громкость, высота (лог, 0 — глухо), звонкость, вид звука (5) — для конца
левого слова и начала правого (по 21). Первый слой раскладывается на сумму сторон — в движке цена считается сразу
для всех пар кандидатов. Итог: joinnn_<голос>.npz (веса, нормировка, медиана живых)."""
import sys, math, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E

голос = sys.argv[1] if len(sys.argv) > 1 else "m"
V = E.Голос(голос)
ВИДЫ = "гсзкп"


def сторона(o, конец):
    кл = V.кл_к[o] if конец else V.кл_н[o]
    mf = V.mfe[o] if конец else V.mfs[o]; en = V.ene[o] if конец else V.ens[o]; f = V.f0e[o] if конец else V.f0s[o]
    v = np.zeros(21, np.float32); v[:13] = mf; v[13] = en; v[14] = math.log(f) if f > 0 else 0.0; v[15] = float(f > 0)
    v[16 + ВИДЫ.index(кл if кл in ВИДЫ else "п")] = 1.0
    return v


def main():
    rnd = random.Random(5)
    живые = [o for o in range(len(V.occ) - 1) if V.occ[o][0] == V.occ[o + 1][0] and "ph" in V.recs[V.occ[o][0]]
             and V.recs[V.occ[o][0]]["w"][V.occ[o][1]][4] <= 0.005]
    по_виду = {}
    for o in range(len(V.occ)):
        if "ph" in V.recs[V.occ[o][0]]: по_виду.setdefault(V.кл_н[o], []).append(o)
    A, B, y = [], [], []
    for o in живые:
        A.append(сторона(o, True)); B.append(сторона(o + 1, False)); y.append(0.0)
        o3 = rnd.choice(по_виду[V.кл_н[o + 1]])   # склейка: тот же левый конец, чужое начало того же вида
        A.append(сторона(o, True)); B.append(сторона(o3, False)); y.append(1.0)
    A = np.array(A); B = np.array(B); y = np.array(y, np.float32)
    X = np.hstack([A, B]); mu = X.mean(0); sd = X.std(0) + 1e-4; X = (X - mu) / sd
    idx = np.random.default_rng(1).permutation(len(y)); k = len(y) // 10; тест, обуч = idx[:k], idx[k:]
    print(f"пар: {len(y)} (живых {int((y == 0).sum())})", flush=True)
    rng = np.random.default_rng(2)
    H1, H2 = 64, 32
    W1 = rng.normal(0, math.sqrt(2 / X.shape[1]), (X.shape[1], H1)).astype(np.float32); b1 = np.zeros(H1, np.float32)
    W2 = rng.normal(0, math.sqrt(2 / H1), (H1, H2)).astype(np.float32); b2 = np.zeros(H2, np.float32)
    W3 = rng.normal(0, math.sqrt(1 / H2), (H2, 1)).astype(np.float32); b3 = np.zeros(1, np.float32)
    P = [W1, b1, W2, b2, W3, b3]; M_ = [np.zeros_like(p) for p in P]; V_ = [np.zeros_like(p) for p in P]
    lr, β1, β2, шаг = 2e-3, 0.9, 0.999, 0

    def вперёд(x):
        z1 = x @ W1 + b1; h1 = np.maximum(z1, 0); z2 = h1 @ W2 + b2; h2 = np.maximum(z2, 0); z3 = (h2 @ W3 + b3)[:, 0]
        return z1, h1, z2, h2, z3

    def auc(s, yy):
        o = np.argsort(s); r = np.empty(len(s)); r[o] = np.arange(1, len(s) + 1); pos = yy == 1
        return (r[pos].sum() - pos.sum() * (pos.sum() + 1) / 2) / (pos.sum() * (~pos).sum())

    for эп in range(12):
        perm = rng.permutation(обуч)
        for i in range(0, len(perm), 512):
            bi = perm[i:i + 512]; x = X[bi]; t = y[bi]
            z1, h1, z2, h2, z3 = вперёд(x); p = 1 / (1 + np.exp(-z3))
            g3 = ((p - t) / len(bi))[:, None]
            gW3 = h2.T @ g3; gb3 = g3.sum(0); g2 = (g3 @ W3.T) * (z2 > 0)
            gW2 = h1.T @ g2; gb2 = g2.sum(0); g1 = (g2 @ W2.T) * (z1 > 0)
            gW1 = x.T @ g1; gb1 = g1.sum(0)
            шаг += 1
            for j, g in enumerate([gW1 + 1e-5 * W1, gb1, gW2 + 1e-5 * W2, gb2, gW3, gb3]):
                M_[j] = β1 * M_[j] + (1 - β1) * g; V_[j] = β2 * V_[j] + (1 - β2) * g * g
                P[j] -= lr * (M_[j] / (1 - β1 ** шаг)) / (np.sqrt(V_[j] / (1 - β2 ** шаг)) + 1e-8)
        s = вперёд(X[тест])[4]
        print(f"эпоха {эп + 1}: AUC на отложенных {auc(s, y[тест]):.3f}", flush=True)
    s_ж = вперёд(X[y == 0])[4]
    np.savez(f"/root/S/us2/joinnn_{голос}.npz", W1=W1, b1=b1, W2=W2, b2=b2, W3=W3, b3=b3, mu=mu, sd=sd, мед=np.median(s_ж))
    print(f"записано: joinnn_{голос}.npz; лог-шансы склейки у живых стыков: медиана {np.median(s_ж):.2f}")


if __name__ == "__main__":
    main()
