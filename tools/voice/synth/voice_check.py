#!/usr/bin/env python3.13
"""voice_check.py — проверка голоса каждой записи: «тот ли это диктор». Классификатор (логистическая регрессия)
мужской Iapetus против женского Callirrhoe по средней высоте, её разбросу и усреднённому спектру звонких мест
(13 MFCC); обучение — на описях игры обоих голосов. Оцениваются все записи мужской базы склейки (опись, пакет,
корпус) и вся мужская опись игры. Дополнительно — отклонение от «своего» голоса (расстояние до центра мужских
записей). Итог: voice_m.json {файл: {p_жен, f0, откл}} и сводка."""
import sys, os, json, glob, re, random, multiprocessing as mp
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import engine as E, psola
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"


def путь(f, голос="m"):
    if f.startswith("/"): return f + ".flac"
    D = {"m": "gvoice", "f": "gvoice_f"}[голос]
    return f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac"


def признаки(p):
    try:
        a, sr = sf.read(p, dtype="float32")
        f0, hop = psola._f0_дорожка(a)
        v = f0[f0 > 0]
        if len(v) < 5: return None
        кадры = [a[i * hop:i * hop + 2 * hop] for i in np.where(f0 > 0)[0] if i * hop + 2 * hop <= len(a)]
        M = np.mean([E._mfcc(x) for x in кадры[::2]], axis=0)
        return np.r_[np.log(np.median(v)), np.log(np.percentile(v, 90) / max(1.0, np.percentile(v, 10))), M].astype(np.float32)
    except Exception:
        return None


def банк(папка, имя):
    о = sorted(glob.glob(f"{R}/sounds/{папка}/{имя}[0-9]*.js"), key=lambda x: int(re.search(r"(\d+)\.js$", x).group(1)))[-1]
    t = open(о, encoding="utf-8").read(); return json.loads(t[t.index("{"):t.rindex("}") + 1])["p"]


def main():
    bm = банк("gvoice", "bank_"); bf = банк("gvoice_f", "bank_f")
    random.seed(3)
    обуч_m = random.sample(sorted(set(bm.values())), 4000); обуч_f = random.sample(sorted(set(bf.values())), 4000)
    # все мужские записи: опись игры + база склейки (пакет, корпус)
    все = {f: путь(f) for f in set(bm.values())}
    for доп in ("", "_pack", "_corpus"):
        p = f"/root/S/us2/db_m{доп}.jsonl"
        if os.path.exists(p):
            for l in open(p, encoding="utf-8"):
                f = json.loads(l)["f"]; все[f] = путь(f)
    ключи = sorted(все); пути = [все[k] for k in ключи] + [путь(f, "f") for f in обуч_f]
    with mp.Pool(4) as pool: X = pool.map(признаки, пути, chunksize=32)
    Xm = {k: x for k, x in zip(ключи, X[:len(ключи)]) if x is not None}
    Xf = [x for x in X[len(ключи):] if x is not None]
    A = np.array([Xm[f] for f in обуч_m if f in Xm] + Xf); y = np.r_[np.zeros(sum(f in Xm for f in обуч_m)), np.ones(len(Xf))]
    mu, sd = A.mean(0), A.std(0) + 1e-6; Z = (A - mu) / sd
    w = np.zeros(Z.shape[1]); b = 0.0
    for _ in range(3000):
        p = 1 / (1 + np.exp(-(Z @ w + b))); g = p - y; w -= 0.3 * (Z.T @ g / len(y) + 1e-3 * w); b -= 0.3 * g.mean()
    acc = np.mean(((Z @ w + b) > 0) == (y == 1))
    центр = np.median(np.array(list(Xm.values())), axis=0); разброс = np.median(np.abs(np.array(list(Xm.values())) - центр), axis=0) + 1e-6
    итог = {}
    for f, x in Xm.items():
        z = (x - mu) / sd; pж = float(1 / (1 + np.exp(-(z @ w + b))))
        итог[f] = {"p_жен": round(pж, 3), "f0": round(float(np.exp(x[0])), 1), "откл": round(float(np.mean(np.abs(x - центр) / разброс)), 2)}
    json.dump(итог, open("/root/S/us2/voice_m.json", "w", encoding="utf-8"), ensure_ascii=False)
    np.savez("/root/S/us2/voice_model.npz", mu=mu, sd=sd, w=w, b=b, центр=центр, разброс=разброс)
    print(f"классификатор голоса: точность на обучении {acc:.3f}; записей проверено {len(итог)}")
    for имя, отбор in (("опись игры", set(bm.values())), ("корпус синтезатора", {f for f in итог if f.startswith("/root/S/us2/corpus")})):
        pp = np.array([итог[f]["p_жен"] for f in итог if f in отбор])
        print(f"{имя}: записей {len(pp)}, похожих на женский голос (p>0,5) {int((pp > 0.5).sum())}, сомнительных (p>0,2) {int((pp > 0.2).sum())}")


if __name__ == "__main__":
    main()
