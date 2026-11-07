#!/usr/bin/env python3.13
"""discrim.py N — «различитель»: по звуку вокруг шва (±60 мс) отличить склейку синтеза от настоящей границы слов без
паузы в живой речи. Признаки: огибающие спектра (MFCC) до/после и их разница, скачок громкости, высоты, звонкость
краёв, всплеск высоких частот у точки, поток спектра у точки против окрестности. Логистическая регрессия; проверка —
на отложенной трети (AUC). Самые весомые признаки показывают, что в склейке слышно; итог — discrim_m.npz."""
import sys, os, json, random
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
SR = 24000; W = int(SR * 0.02)


def признаки(y, p):
    if p - 3 * W < 0 or p + 3 * W > len(y): return None
    a, b = y[p - W:p], y[p:p + W]
    if E._db(a) < -45 and E._db(b) < -45: return None
    ma, mb = E._mfcc(a), E._mfcc(b); ma2, mb2 = E._mfcc(y[p - 3 * W:p - 2 * W]), E._mfcc(y[p + 2 * W:p + 3 * W])
    поток = np.linalg.norm(ma[1:] - mb[1:]); фон = 0.5 * (np.linalg.norm(ma2[1:] - ma[1:]) + np.linalg.norm(mb[1:] - mb2[1:]))
    X = np.fft.rfft(y[p - 3 * W:p + 3 * W]); f = np.fft.rfftfreq(6 * W, 1 / SR); X[f < 3000] = 0; h = np.fft.irfft(X, 6 * W)
    вч_т = np.sqrt(np.mean(h[3 * W - 36:3 * W + 36] ** 2)) + 1e-7; вч_о = np.sqrt(np.mean(np.r_[h[:W], h[-W:]] ** 2)) + 1e-7
    f0, _ = psola._f0_дорожка(y[p - 3 * W:p + 3 * W], hop=120); fa = f0[2:6]; fb = f0[7:11]
    fa, fb = fa[fa > 0], fb[fb > 0]; зa, зb = float(len(fa) > 1), float(len(fb) > 1)
    дв = abs(12 * np.log2(np.median(fb) / np.median(fa))) if зa and зb else 0.0
    return np.r_[ma[1:] - mb[1:], np.abs(ma[1:] - mb[1:]), [поток, поток - фон, E._db(a) - E._db(b), abs(E._db(a) - E._db(b)),
                 20 * np.log10(вч_т / вч_о), дв, зa, зb, зa * зb, E._db(a), E._db(b)]].astype(np.float32)


ИМЕНА = [f"mfcc_разн{k}" for k in range(1, 13)] + [f"mfcc_модуль{k}" for k in range(1, 13)] + ["поток", "поток_сверх_фона", "громкость_разн", "громкость_скачок", "вч_у_точки", "скачок_высоты", "звонко_до", "звонко_после", "звонко_оба", "уровень_до", "уровень_после"]

if __name__ == "__main__":
    N = int(sys.argv[1]); S = E.Синтезатор("m"); V = S.V
    q = [x["t"] for x in json.load(open("/root/S/gvrec/queue_m.json", encoding="utf-8"))]
    тест = set(json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))) | set(json.load(open("/root/S/us2/test_set.json", encoding="utf-8")))
    random.seed(77); фразы = [t for t in q if t not in тест and 3 <= len(t.split()) <= 12]; random.shuffle(фразы)
    Xs, Xl = [], []
    for ф in фразы[:N]:
        y, _ = S.сказать(ф)
        for p in S.стыки:
            x = признаки(y, p)
            if x is not None: Xs.append(x)
    while len(Xl) < len(Xs):
        ri = random.randrange(len(V.recs)); r = V.recs[ri]
        if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
        j = random.randrange(len(r["w"]) - 1)
        if r["w"][j][4] > 0.005: continue
        x = признаки(V.звук(ri), int(r["w"][j][2] * SR))
        if x is not None: Xl.append(x)
    X = np.array(Xs + Xl); y = np.r_[np.ones(len(Xs)), np.zeros(len(Xl))]
    idx = np.random.RandomState(1).permutation(len(y)); X, y = X[idx], y[idx]; n = len(y) * 2 // 3
    mu, sd = X[:n].mean(0), X[:n].std(0) + 1e-6; Z = (X - mu) / sd; w = np.zeros(Z.shape[1]); b = 0.0
    for _ in range(4000):
        pr = 1 / (1 + np.exp(-(Z[:n] @ w + b))); g = pr - y[:n]; w -= 0.2 * (Z[:n].T @ g / n + 3e-3 * w); b -= 0.2 * g.mean()
    s = Z[n:] @ w + b; pos, neg = s[y[n:] == 1], s[y[n:] == 0]
    auc = np.mean(pos[:, None] > neg[None, :])
    print(f"швов синтеза {len(Xs)}, живых границ {len(Xl)}; различитель AUC на отложенных {auc:.3f} (0,5 — неотличимо)")
    for н, v in sorted(zip(ИМЕНА, w), key=lambda z: -abs(z[1]))[:12]: print(f"  {н:>18}: {v:+.3f}")
    np.savez("/root/S/us2/discrim_m.npz", mu=mu, sd=sd, w=w, b=b, имена=np.array(ИМЕНА))
