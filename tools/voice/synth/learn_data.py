#!/usr/bin/env python3.13
"""learn_data.py N — данные для обучения цены выбора: N настоящих незаписанных фраз игры (очередь записи, не из
проверочного набора) синтезируются со случайно встряхнутыми весами; результат распознаётся; для каждого слова из
базы — признаки выбранной единицы и её стыков, метка 1 — слово не узнано. Итог: learn_<N>.npz (X, y, имена)."""
import sys, json, re, random, math
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E
import sherpa_onnx
М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{М}/model.int8.onnx", tokens=f"{М}/tokens.txt", num_threads=4)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1500


def норм(t): return re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def выровнять(a, b):
    """Метка ошибки для каждого слова цели a по услышанному b (Левенштейн по словам)."""
    n, m = len(a), len(b); D = np.zeros((n + 1, m + 1), dtype=int); D[:, 0] = range(n + 1); D[0, :] = range(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1): D[i, j] = min(D[i - 1, j] + 1, D[i, j - 1] + 1, D[i - 1, j - 1] + (a[i - 1] != b[j - 1]))
    i, j, ош = n, m, [0] * n
    while i > 0 or j > 0:
        if i > 0 and j > 0 and D[i, j] == D[i - 1, j - 1] + (a[i - 1] != b[j - 1]):
            ош[i - 1] = int(a[i - 1] != b[j - 1]); i -= 1; j -= 1
        elif i > 0 and D[i, j] == D[i - 1, j] + 1: ош[i - 1] = 1; i -= 1
        else: j -= 1
    return ош


ИМЕНА = ["чистота", "непроверено", "сосед_л", "сосед_п", "класс_л", "класс_п", "знак_несовп", "конец_как_середина", "середина_как_конец",
         "начало_пауза", "длина_откл", "букв", "короткое", "мелодия_откл", "подряд_л", "подряд_п", "f0_л", "f0_п", "громк_л", "громк_п",
         "спектр_л", "спектр_п", "первое", "последнее", "звуки_несовп", "край_л", "край_п", "разм_плохо"]


def признаки(S, слова, end, res, i):
    V = S.V; o = res[i][1]; n = len(слова); w = слова[i]
    ч = float(V.чистота[o]) if V.чистота is not None else 0.3
    f = dict.fromkeys(ИМЕНА, 0.0)
    f["чистота"] = max(0.0, ч); f["непроверено"] = float(ч < 0)
    for d, idx, ключ, кл in ((-1, i - 1, "сосед_л", "класс_л"), (1, i + 1, "сосед_п", "класс_п")):
        цель = слова[idx] if 0 <= idx < n else None; ист = V.сосед(o, d)
        if цель is not None and ист == цель: f[ключ] = 1.0
        кц = E.класс(цель[-1] if d < 0 and цель else (цель[0] if цель else "")); ки = E.класс(ист[-1] if d < 0 and ист else (ист[0] if ист else ""))
        f[кл] = float(кц != ки)
    зн = V.знак(o); цзн = end if i == n - 1 else ""
    f["знак_несовп"] = float(зн is not None and зн != цзн)
    f["конец_как_середина"] = float(i < n - 1 and V.конец_фразы(o)); f["середина_как_конец"] = float(i == n - 1 and not V.конец_фразы(o))
    f["начало_пауза"] = float(i > 0 and V.начало_фразы(o) and V.w(o)[3] > 0.15)
    м = V.медиана.get(w) or V.dur[o]; f["длина_откл"] = abs(math.log(max(1e-3, V.dur[o]) / max(1e-3, м)))
    f["букв"] = len(w) / 10; f["короткое"] = float(len(w) <= 2)
    h = V.высота_пт(o)
    if h is not None:
        кл = "?" if end == "?" else "," if end in ",;—" else ":" if end == ":" else "."
        доля = 4 if i == n - 1 else (0 if n == 1 else min(4, int(5 * i / n))); ц = V.мелодия.get((кл, доля))
        if ц is not None: f["мелодия_откл"] = min(6.0, abs(h - ц)) / 6
    for d, сторона in ((-1, "л"), (1, "п")):
        k = i + d
        if not (0 <= k < n) or res[k][0] != "o":
            continue
        o2 = res[k][1]; a, b = (o2, o) if d < 0 else (o, o2)
        r1, j1 = V.occ[a]; r2, j2 = V.occ[b]
        if r1 == r2 and j2 == j1 + 1: f["подряд_" + сторона] = 1.0; continue
        x1, x2 = V.f0e[a], V.f0s[b]
        if x1 > 0 and x2 > 0: f["f0_" + сторона] = min(12.0, abs(12 * math.log2(x1 / x2))) / 12
        f["громк_" + сторона] = min(20.0, abs(V.ene[a] - V.ens[b])) / 20
        f["спектр_" + сторона] = min(60.0, float(np.linalg.norm(V.mfe[a] - V.mfs[b]))) / 60
    f["первое"] = float(i == 0); f["последнее"] = float(i == n - 1)
    в0 = S.в.get("звуки_цель", 0); S.в["звуки_цель"] = 1.0; f["звуки_несовп"] = min(3.0, S._цена_звуков(o, слова, i)) / 3; S.в["звуки_цель"] = в0
    цепь_л = i > 0 and V.сосед(o, -1) == слова[i - 1]; цепь_п = i < n - 1 and V.сосед(o, 1) == слова[i + 1]
    f["край_л"] = float(V.край_л[o]) * (0.3 if цепь_л else 1.0); f["край_п"] = float(V.край_п[o]) * (0.3 if цепь_п else 1.0)
    f["разм_плохо"] = float(V.ll[o] < -48.0)
    return [f[k] for k in ИМЕНА]


def main():
    тест = set(json.load(open("/root/S/us2/test_set.json", encoding="utf-8")))
    q = [x["t"] for x in json.load(open("/root/S/gvrec/queue_m.json", encoding="utf-8"))]
    random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 11)
    фразы = [t for t in q if t not in тест and 3 <= len(норм(t).split()) <= 12 and not re.search(r"[A-Za-z]", t)]
    random.shuffle(фразы); фразы = фразы[:N]
    S = E.Синтезатор("m"); база = dict(S.в); X, Y = [], []
    уч0 = dict(S.уч) if S.уч else None
    for k, ф in enumerate(фразы):
        # встряхнуть веса: разные сочетания единиц
        S.в = {**база, **{кл: база[кл] * random.choice([0.3, 0.6, 1.0, 1.6, 3.0]) for кл in ("чистота", "стык", "знак", "мелодия", "звук", "сосед", "длина", "f0", "спектр")}}
        if уч0: S.уч = {k: v * random.choice([0.4, 0.7, 1.0, 1.4, 2.0]) for k, v in уч0.items()}   # встряхнуть и выученные веса
        отрезки = E.текст_в_отрезки(ф); y = []; ресы = []
        for от in отрезки:
            res = S.витерби(от["w"], от["end"]); ресы.append((от, res))
        звук, _ = S.сказать(ф)   # тот же выбор (детерминирован при тех же весах)
        a16 = np.interp(np.arange(0, len(звук), E.SR / 16000), np.arange(len(звук)), звук).astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(16000, a16); rec.decode_stream(s)
        цель = [w for от in отрезки for w in от["w"]]; ош = выровнять(цель, норм(s.result.text).split())
        p = 0
        for от, res in ресы:
            for i in range(len(от["w"])):
                if res[i][0] == "o": X.append(признаки(S, от["w"], от["end"], res, i)); Y.append(ош[p])
                p += 1
        if k % 100 == 0: print(f"{k}/{len(фразы)} слов {len(Y)} ошибок {sum(Y)}", flush=True)
    np.savez(f"/root/S/us2/learn_{N}_{sys.argv[2] if len(sys.argv) > 2 else 11}.npz", X=np.array(X, dtype=np.float32), y=np.array(Y, dtype=np.float32), имена=np.array(ИМЕНА))
    print(f"готово: слов {len(Y)}, доля неузнанных {np.mean(Y):.3f}")


if __name__ == "__main__":
    main()
