#!/usr/bin/env python3.13
"""hmm_align.py ГОЛОС [итераций] — свой разметчик звуков для голоса: скрытая марковская модель (3 состояния на звук,
смеси гауссиан), обучение по всем записям базы (Витерби: разметка → пересчёт модели → разметка ...).
Признаки: 13 MFCC + Δ + ΔΔ, шаг 5 мс. Произношение — fon.фраза. Между словами — необязательная пауза, по краям —
тишина. Начало обучения — равномерная раскладка звуков внутри слов по прежним границам базы.
Итог: /root/S/us2/hmm_<голос>.npz (модель) и /root/S/us2/align_<голос>.jsonl — по строке на запись:
{"i": номер записи (как в engine.Голос.recs), "w": [[слово, начало, конец, [[звук, номер буквы, начало, конец], ...]], ...],
 "ll": средняя правдоподобность кадра}. Время — секунды, точность 5 мс."""
import sys, os, json, math, time, multiprocessing as mp
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
import fon

SR = 24000; HOP = 120; WIN = 600; NFFT = 1024; ШАГ = HOP / SR
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"; ТУТ = "/root/S/us2"
NST = 3   # состояний на звук


# ───────── признаки ─────────
def _мел():
    f = np.linspace(0, SR / 2, NFFT // 2 + 1); m = lambda hz: 2595 * np.log10(1 + hz / 700); im = lambda mm: 700 * (10 ** (mm / 2595) - 1)
    pts = im(np.linspace(m(60), m(10000), 40 + 2)); fb = np.zeros((40, len(f)))
    for i in range(40):
        l, c, r = pts[i], pts[i + 1], pts[i + 2]; fb[i] = np.clip(np.minimum((f - l) / (c - l), (r - f) / (r - c)), 0, None)
    dct = np.cos(np.pi / 40 * (np.arange(40)[None, :] + 0.5) * np.arange(13)[:, None]) * math.sqrt(2 / 40)
    return fb.astype(np.float32), dct.astype(np.float32)
FB, DCT = _мел(); ОКНО = np.hamming(WIN).astype(np.float32)


def _дельта(x, N=3):
    d = np.zeros_like(x); den = 2 * sum(n * n for n in range(1, N + 1)); xp = np.pad(x, ((N, N), (0, 0)), mode="edge")
    for n in range(1, N + 1): d += n * (xp[N + n:N + n + len(x)] - xp[N - n:N - n + len(x)])
    return d / den


def признаки(a):
    """Кадр t — окно с центром в (t + 0,5)·5 мс: граница между кадрами t−1 и t — ровно t·5 мс."""
    a = np.append(a[0], a[1:] - 0.97 * a[:-1]).astype(np.float32)
    a = np.pad(a, ((WIN - HOP) // 2, WIN))
    n = max(1, (len(a) - WIN) // HOP + 1)
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    fr = a[idx] * ОКНО
    sp = np.abs(np.fft.rfft(fr, NFFT)) ** 2
    c = np.log(sp @ FB.T + 1e-6) @ DCT.T
    x = np.hstack([c, _дельта(c), _дельта(_дельта(c))]).astype(np.float32)
    x = (x - x.mean(0)) / (x.std(0) + 1e-5)
    e = (10 * np.log10(np.mean(fr * fr, axis=1) + 1e-10)).astype(np.float32)
    return x, e


# ───────── быстрая рекурсия Витерби (numba) ─────────
from numba import njit


@njit(cache=True)
def _рекурсия(E, петля, выход, src, dst, d0):
    T, S = E.shape
    d = d0.copy(); bp = np.zeros((T, S), np.int8); nd = np.empty(S)
    for t in range(1, T):
        for s in range(S):
            best = d[s] + петля[s]; arg = 0
            if s > 0:
                c = d[s - 1] + выход[s - 1]
                if c > best:
                    best = c; arg = 1
            nd[s] = best; bp[t, s] = arg
        for k in range(len(src)):
            c = d[src[k]] + выход[src[k]]
            if c > nd[dst[k]]:
                nd[dst[k]] = c; bp[t, dst[k]] = 2
        for s in range(S): d[s] = nd[s] + E[t, s]
    return d, bp


# ───────── модель ─────────
class Модель:
    def __init__(self, звуки, M=1, D=39):
        self.звуки = list(звуки); self.ид = {z: i for i, z in enumerate(self.звуки)}
        # состояния: звук k → 3 состояния (k*3..k*3+2); пауза «sp» → 1 состояние; тишина «sil» → 3 состояния
        self.S = NST * len(self.звуки); self.M = M; self.D = D
        self.mu = np.zeros((self.S, M, D), np.float32); self.var = np.ones((self.S, M, D), np.float32)
        self.w = np.ones((self.S, M), np.float32) / M
        self.петля = np.full(self.S, math.log(0.7), np.float32); self.выход = np.full(self.S, math.log(0.3), np.float32)

    def сост(self, z): k = self.ид[z]; return list(range(NST * k, NST * k + (1 if z == "sp" else NST)))

    def лог_прав(self, x, ss):
        """x: (T, D); ss — номера состояний → (T, len(ss)) логарифм правдоподобия (смесь гауссиан, диагональные)."""
        mu = self.mu[ss]; var = self.var[ss]; w = self.w[ss]          # (K, M, D), (K, M)
        iv = 1.0 / var
        const = -0.5 * (np.log(var).sum(-1) + self.D * math.log(2 * math.pi)) + np.log(w + 1e-12)   # (K, M)
        K, M = len(ss), self.M
        x2 = (x * x) @ iv.reshape(K * M, self.D).T                     # (T, K*M)
        xm = x @ (mu * iv).reshape(K * M, self.D).T
        m2 = (mu * mu * iv).sum(-1).reshape(K * M)
        ll = -0.5 * (x2 - 2 * xm + m2[None, :]) + const.reshape(K * M)[None, :]
        ll = ll.reshape(len(x), K, M)
        mx = ll.max(-1, keepdims=True)
        return (mx[..., 0] + np.log(np.exp(ll - mx).sum(-1))), ll

    def сохранить(self, p):
        np.savez(p, звуки=np.array(self.звуки), mu=self.mu, var=self.var, w=self.w, петля=self.петля, выход=self.выход)

    @staticmethod
    def загрузить(p):
        z = np.load(p); m = Модель([str(x) for x in z["звуки"]], z["mu"].shape[1], z["mu"].shape[2])
        m.mu, m.var, m.w, m.петля, m.выход = z["mu"], z["var"], z["w"], z["петля"], z["выход"]; return m


def граф(модель, слова, паузы):
    """Цепочка состояний фразы: sil? [звуки слова 1] sp? [звуки слова 2] ... sil?
    → (состояния, можно_пропустить, метки (слово, звук_в_слове, (звук, буква)) или None для пауз)."""
    тр = fon.фраза(слова, паузы)
    st, пр, мет = [], [], []
    def добавить(z, skip, метка):
        for s in модель.сост(z): st.append(s); пр.append(skip); мет.append(метка)
    добавить("sil", True, None)
    if any(not звуки for звуки in тр): return None
    for wi, звуки in enumerate(тр):
        for pi, (z, буква) in enumerate(звуки):
            if z not in модель.ид: z = {"э": "и", "о": "а"}.get(z, z)
            if z not in модель.ид: return None
            добавить(z, False, (wi, pi, z, буква))
        if wi < len(тр) - 1: добавить("sp", True, None)
    добавить("sil", True, None)
    return np.array(st), np.array(пр, bool), мет, тр


def витерби(модель, x, st, пр):
    """→ путь: номер позиции графа для каждого кадра (или None, если не уложилось)."""
    T, S = len(x), len(st)
    уник, обр = np.unique(st, return_inverse=True)
    ll, llc = модель.лог_прав(x, уник); E = ll[:, обр]                       # (T, S)
    петля = модель.петля[st]; выход = модель.выход[st]
    # пропускаемые группы (тишина из 3 состояний, пауза из одного) — пропуск только целиком
    s = 0; группы = []
    while s < S:
        if пр[s]:
            e = s
            while e + 1 < S and пр[e + 1] and st[e + 1] == st[e] + 1: e += 1
            группы.append((s, e)); s = e + 1
        else: s += 1
    NEG = -1e30
    d = np.full(S, NEG, np.float64)
    d[0] = E[0, 0]
    for (a, b) in группы:
        if a == 0 and b + 1 < S: d[b + 1] = E[0, b + 1]
    вход_пропуск = {b + 1: a - 1 for (a, b) in группы if a > 0 and b + 1 < S}   # в позицию b+1 можно прийти из a−1
    src = np.array(sorted(вход_пропуск.values()), int) if вход_пропуск else np.zeros(0, int)
    dst = np.array([k for k, v in sorted(вход_пропуск.items(), key=lambda kv: kv[1])], int) if вход_пропуск else np.zeros(0, int)
    # 0 — петля, 1 — из s−1, 2 — пропуск группы
    d, bp = _рекурсия(np.ascontiguousarray(E, dtype=np.float64), петля.astype(np.float64), выход.astype(np.float64),
                      src.astype(np.int64), dst.astype(np.int64), d)
    # конец: последняя позиция (тишина) или конец последнего слова (тишина пропущена)
    концы = [S - 1]
    for (a, b) in группы:
        if b == S - 1: концы.append(a - 1)
    s = max(концы, key=lambda k: d[k])
    if d[s] < -1e29: return None, None, None
    путь = np.zeros(T, int); путь[-1] = s
    for t in range(T - 1, 0, -1):
        b = bp[t, s]
        if b == 1: s -= 1
        elif b == 2: s = вход_пропуск[s]
        путь[t - 1] = s
    comp = llc[np.arange(T), обр[путь]].argmax(-1)
    return путь, float(d[путь[-1]] / T), comp


# ───────── данные ─────────
def записи(голос):
    recs = [json.loads(l) for l in open(f"{ТУТ}/db_{голос}.jsonl", encoding="utf-8")]
    for доп in ("pack", "corpus"):
        p = f"{ТУТ}/db_{голос}_{доп}.jsonl"
        if os.path.exists(p): recs += [json.loads(l) for l in open(p, encoding="utf-8")]
    return recs


def звук_записи(голос, f):
    D = {"m": "gvoice", "f": "gvoice_f"}[голос]
    a, sr = sf.read(f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else D + '/' + f}.flac", dtype="float32")
    return a


G = {}   # общее для дочерних процессов (fork): признаки, записи, модель


def _раскладка_начальная(r, тр, T, e):
    """Равномерная раскладка звуков внутри слов по прежним границам → номер состояния (в смысле модели) на кадр, −1 — не брать."""
    м = G["модель"]; lab = np.full(T, -1, int)
    ws = r["w"]
    s_sil = м.сост("sil")
    # тишина в начале и в конце — по громкости (ниже пика на 40 дБ)
    гр = np.where(e > e.max() - 40)[0]
    t0 = int(гр[0]) if len(гр) else 0; tE = int(гр[-1]) + 1 if len(гр) else T
    for t in range(0, min(T, t0)): lab[t] = s_sil[min(2, t * 3 // max(1, t0))]
    for t in range(tE, T): lab[t] = s_sil[min(2, (t - tE) * 3 // max(1, T - tE))]
    for wi, (w, звуки) in enumerate(zip(ws, тр)):
        a, b = int(round(w[1] / ШАГ)), min(T, int(round(w[2] / ШАГ)))
        if wi == 0: a = max(a, t0)
        if wi == len(ws) - 1: b = min(b, tE)
        if b - a < len(звуки) * NST: continue
        вес = np.array([1.5 if z in fon.ГЛАСНЫЕ_ЗВ else 1.0 for z, _ in звуки]); гр = a + np.r_[0, np.cumsum(вес) / вес.sum()] * (b - a)
        for k, (z, _) in enumerate(звуки):
            if z not in м.ид: continue
            ss = м.сост(z); p0, p1 = int(гр[k]), int(гр[k + 1])
            for t in range(p0, p1): lab[t] = ss[min(NST - 1, (t - p0) * NST // max(1, p1 - p0))]
    return lab


def _статистика(lab, x, M, ll_comp=None):
    """Суммы для пересчёта: по состояниям (и составляющим смеси — жёстко по лучшей)."""
    S = G["модель"].S; D = x.shape[1]
    n = np.zeros((S, M)); s1 = np.zeros((S, M, D)); s2 = np.zeros((S, M, D))
    ok = lab >= 0
    if not ok.any(): return n, s1, s2
    l = lab[ok]; xx = x[ok]
    if M == 1: comp = np.zeros(len(l), int)
    else: comp = ll_comp[ok]
    key = l * M + comp; order = np.argsort(key, kind="stable"); ks = key[order]; xs = xx[order]
    u, st = np.unique(ks, return_index=True)
    c = np.diff(np.r_[st, len(ks)]); a1 = np.add.reduceat(xs, st, axis=0); a2 = np.add.reduceat(xs * xs, st, axis=0)
    n.reshape(-1)[u] += c; s1.reshape(-1, D)[u] += a1; s2.reshape(-1, D)[u] += a2
    return n, s1, s2


def _работа(диапазон):
    """Разметка части записей текущей моделью → статистика (и разметка, если G['выдать'])."""
    м = G["модель"]; M = м.M; S = м.S; D = м.D
    N = np.zeros((S, M)); S1 = np.zeros((S, M, D)); S2 = np.zeros((S, M, D))
    петли = np.zeros(S); всего = np.zeros(S); сумма_ll = 0.0; кадров = 0; провал = 0; выход = []
    for ri in range(*диапазон):
        r = G["recs"][ri]; x = G["X"][ri]
        if x is None: continue
        слова = [w[0] for w in r["w"]]; паузы = [w[4] >= 0.12 for w in r["w"]]
        гр = граф(м, слова, паузы)
        if гр is None: провал += 1; continue
        st, пр, мет, тр = гр
        if G["нач"]:
            lab = _раскладка_начальная(r, тр, len(x), G["E"][ri]); путь = None
        else:
            путь, ll, comp = витерби(м, x, st, пр)
            if путь is None: провал += 1; continue
            lab = st[путь]; сумма_ll += ll * len(x); кадров += len(x)
            # переходы: петля, если позиция та же
            same = путь[1:] == путь[:-1]
            np.add.at(всего, lab[:-1], 1); np.add.at(петли, lab[:-1][same], 1)
            if G.get("выдать"): выход.append((ri, путь, мет, ll))
        if G["нач"]: comp = None
        n, s1, s2 = _статистика(lab, x, M, comp)
        N += n; S1 += s1; S2 += s2
    return N, S1, S2, петли, всего, сумма_ll, кадров, провал, выход


def _признаки_записи(ri):
    r = G["recs"][ri]
    try: return признаки(звук_записи(G["голос"], r["f"]))
    except Exception: return None, None


def пересчитать(м, N, S1, S2, петли, всего, пол):
    M = м.M
    for s in range(м.S):
        for k in range(M):
            if N[s, k] >= 5:
                mu = S1[s, k] / N[s, k]; var = S2[s, k] / N[s, k] - mu * mu
                м.mu[s, k] = mu; м.var[s, k] = np.maximum(var, пол)
        tot = N[s].sum()
        if tot > 0: м.w[s] = np.maximum(N[s] / tot, 1e-3); м.w[s] /= м.w[s].sum()
        if всего[s] >= 20:
            p = min(0.95, max(0.3, петли[s] / всего[s])); м.петля[s] = math.log(p); м.выход[s] = math.log(1 - p)


def разделить(м):
    """Удвоить число составляющих смеси: каждую — на две, сдвинутые на ±0,2 σ."""
    M = м.M; mu = np.concatenate([м.mu - 0.2 * np.sqrt(м.var), м.mu + 0.2 * np.sqrt(м.var)], 1)
    var = np.concatenate([м.var, м.var], 1); w = np.concatenate([м.w, м.w], 1) / 2
    м.M = 2 * M; м.mu, м.var, м.w = mu.astype(np.float32), var.astype(np.float32), w.astype(np.float32)


def проход(диапазоны, нач=False, выдать=False):
    G["нач"] = нач; G["выдать"] = выдать
    with mp.get_context("fork").Pool(4) as pool:
        res = pool.map(_работа, диапазоны)
    м = G["модель"]
    N = sum(r[0] for r in res); S1 = sum(r[1] for r in res); S2 = sum(r[2] for r in res)
    петли = sum(r[3] for r in res); всего = sum(r[4] for r in res)
    ll = sum(r[5] for r in res) / max(1, sum(r[6] for r in res)); провал = sum(r[7] for r in res)
    выход = [x for r in res for x in r[8]]
    return N, S1, S2, петли, всего, ll, провал, выход


def main():
    голос = sys.argv[1]; ИТ = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    G["голос"] = голос; recs = записи(голос); G["recs"] = recs
    t0 = time.time()
    with mp.get_context("fork").Pool(4) as pool:
        пары = pool.map(_признаки_записи, range(len(recs)), chunksize=64)
    G["X"] = [p[0] for p in пары]; G["E"] = [p[1] for p in пары]; del пары
    print(f"признаки: {len(recs)} записей, {sum(len(x) for x in G['X'] if x is not None)} кадров, {time.time() - t0:.0f} с", flush=True)
    # набор звуков
    звуки = set()
    for r in recs:
        for тр in fon.фраза([w[0] for w in r["w"]]):
            for z, _ in тр: звуки.add({"э": "и", "о": "а"}.get(z, z))
    звуки = sorted(звуки) + ["sp", "sil"]
    print("звуков:", len(звуки), "".join(z for z in звуки if len(z) == 1), flush=True)
    шаг = (len(recs) + 15) // 16; диап = [(i, min(len(recs), i + шаг)) for i in range(0, len(recs), шаг)]
    все = np.concatenate([x for x in G["X"] if x is not None][:3000]); пол = (0.01 * все.var(0)).astype(np.float32)
    if len(sys.argv) > 3 and sys.argv[3] == "дальше":   # дообучение с сохранённой модели: ещё проход, удвоение смеси, проходы
        м = Модель.загрузить(f"{ТУТ}/hmm_{голос}.npz"); G["модель"] = м
        import shutil; shutil.copy(f"{ТУТ}/hmm_{голос}.npz", f"{ТУТ}/hmm_{голос}.M{м.M}.npz")
        print(f"дообучение: смесь {м.M}", flush=True)
        план = ["", "раздел", "", ""] + [""] * max(0, ИТ - 4)
    else:
        м = Модель(звуки); G["модель"] = м
        N, S1, S2, петли, всего, ll, провал, _ = проход(диап, нач=True)
        пересчитать(м, N, S1, S2, петли, всего, пол)
        sp, sil = м.сост("sp")[0], м.сост("sil")[0]; м.mu[sp] = м.mu[sil]; м.var[sp] = м.var[sil]   # пауза — как тишина
        print(f"начало: {time.time() - t0:.0f} с", flush=True)
        план = ["", "", "раздел", "", "раздел", "", "раздел", ""] + [""] * max(0, ИТ - 8)
    for it, шагп in enumerate(план[:ИТ]):
        if шагп == "раздел": разделить(м)
        G["модель"] = м
        N, S1, S2, петли, всего, ll, провал, _ = проход(диап)
        пересчитать(м, N, S1, S2, петли, всего, пол)
        print(f"итерация {it + 1}: смесь {м.M}, правдоподобие кадра {ll:.2f}, не уложилось {провал}, {time.time() - t0:.0f} с", flush=True)
        м.сохранить(f"{ТУТ}/hmm_{голос}.npz")
    # итоговая разметка
    G["модель"] = м
    *_, ll, провал, выход = проход(диап, выдать=True)
    with open(f"{ТУТ}/align_{голос}.jsonl", "w", encoding="utf-8") as fo:
        for ri, путь, мет, llr in sorted(выход, key=lambda x: x[0]):
            r = recs[ri]; T = len(путь)
            # отрезки по меткам: звук = подряд идущие кадры одной метки (слово, звук)
            звуки_слов = [[] for _ in r["w"]]
            t = 0
            while t < T:
                m_ = мет[путь[t]]; t1 = t
                while t1 + 1 < T and мет[путь[t1 + 1]] == m_ and (m_ is None or True): t1 += 1
                if m_ is not None:
                    wi, pi, z, буква = m_
                    if звуки_слов[wi] and звуки_слов[wi][-1][4] == pi: звуки_слов[wi][-1][3] = round((t1 + 1) * ШАГ, 3)
                    else: звуки_слов[wi].append([z, буква, round(t * ШАГ, 3), round((t1 + 1) * ШАГ, 3), pi])
                t = t1 + 1
            out = []
            for wi, w in enumerate(r["w"]):
                зв = [[z, б, a, b] for z, б, a, b, _ in звуки_слов[wi]]
                out.append([w[0], зв[0][2] if зв else w[1], зв[-1][3] if зв else w[2], зв])
            fo.write(json.dumps({"i": ri, "f": r["f"], "w": out, "ll": round(llr, 3)}, ensure_ascii=False) + "\n")
    print(f"готово: размечено {len(выход)}, не уложилось {провал}, {time.time() - t0:.0f} с")


if __name__ == "__main__":
    main()
