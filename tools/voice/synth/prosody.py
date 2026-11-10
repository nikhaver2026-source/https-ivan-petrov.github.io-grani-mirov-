#!/usr/bin/env python3.13
"""prosody.py ГОЛОС — модель мелодии фразы (по образцу гибридных систем: у Apple и Microsoft плавную линию высоты
предсказывает модель, а куски подбираются под неё, поэтому сходятся сами, без обработки звука).
Для каждого слова отрезка предсказываются высота начала, конца и середины (полутона от медианы голоса) по месту слова:
знак конца отрезка, длина отрезка, номер слова от начала и от конца, число слогов, место ударения, служебное ли слово
(предлог, союз), служебные ли соседи. Плюс разброс (насколько высота в этом месте свободна) — он становится весом цены.
Обучение — на всей базе (вхождения с известной высотой краёв, edgef0), проверка — на отложенных записях (каждая десятая).
Итог: prosody_<голос>.json — таблица с откатом (годится и для игры, без библиотек) и отчёт о точности."""
import sys, os, json, math, zlib
import numpy as np
sys.path.insert(0, "/root/S/us2")
import engine as E

ГОЛОС = sys.argv[1] if len(sys.argv) > 1 else "m"
СЛУЖ = set("в во на с со к ко у о об от до по за из и а но да не ни же ли бы то что как при про для над под без или".split())


def признаки(слова, i, кл):
    """Признаки места слова в отрезке — те же при обучении и при синтезе."""
    n = len(слова); w = слова[i]
    сл = sum(ch in E.ГЛАСНЫЕ for ch in w); уд = E.ударение(w)
    до_конца = sum(ch in E.ГЛАСНЫЕ for ch in w[уд + 1:]) if уд >= 0 else -1
    return dict(кл=".?,:".index(кл), n=min(n, 12), i=min(i, 6), r=min(n - 1 - i, 6), доля=0.0 if n == 1 else i / (n - 1),
                сл=min(сл, 5), уд=min(до_конца, 3), служ=int(w in СЛУЖ),
                служ_л=int(i > 0 and слова[i - 1] in СЛУЖ), служ_п=int(i < n - 1 and слова[i + 1] in СЛУЖ))


ИМЕНА = ["кл", "n", "i", "r", "доля", "сл", "уд", "служ", "служ_л", "служ_п"]


def данные(V):
    край = json.load(open(f"/root/S/us2/edgef0_{ГОЛОС}.json", encoding="utf-8"))
    X, Y, грп = [], [], []
    пт = lambda v: 12 * math.log2(v / V.f0_мед)
    for ri, r in enumerate(V.recs):
        if ri in V.искл_ri: continue
        pz = r.get("pz"); ws = r["w"]
        границы = [j for j in range(len(ws)) if pz and pz[j]] if pz else []
        if not границы or границы[-1] != len(ws) - 1: границы.append(len(ws) - 1)
        нач = 0
        for гр in границы:
            конец = (pz[гр] if pz and pz[гр] else ".")
            кл = "?" if конец == "?" else "," if конец in ",;—" else ":" if конец == ":" else "."
            слова = [w[0] for w in ws[нач:гр + 1]]
            for j in range(нач, гр + 1):
                e = край.get(f"{r['f']}#{j}")
                if not e or e[0] <= 0 or e[1] <= 0 or e[2] <= 0: continue
                ф = признаки(слова, j - нач, кл)
                X.append([ф[k] for k in ИМЕНА]); Y.append([пт(e[0]), пт(e[1]), пт(e[2])]); грп.append(zlib.crc32(r["f"].encode()) % 10)
            нач = гр + 1
    return np.array(X, float), np.array(Y, float), np.array(грп)


def ключи(x):
    """Ключи таблицы от подробного к грубому (откат): место, длина, слоги, ударение, служебность."""
    кл, n, i, r, _, сл, уд, служ, сл_л, сл_п = (int(v) for v in x)
    nb = 1 if n == 1 else 2 if n == 2 else 3 if n <= 4 else 4 if n <= 7 else 5
    ib, rb = min(i, 3), min(r, 3)
    return [(кл, nb, ib, rb, min(сл, 3), уд, служ), (кл, nb, ib, rb, служ, min(сл, 3)), (кл, nb, ib, rb, служ), (кл, ib, rb, служ), (кл, ib, rb), (кл, rb), (кл,)]


if __name__ == "__main__":
    V = E.Синтезатор(ГОЛОС).V
    X, Y, грп = данные(V)
    тест = грп == 0; уч = ~тест
    print("вхождений", len(X), "учебных", int(уч.sum()), "проверочных", int(тест.sum()))
    # прежняя цель: медиана середины по (знак, доля из пяти)
    def прежняя(x):
        кл, n, i = ".?,:"[int(x[0])], int(x[1]), int(x[2]); посл = int(x[3]) == 0
        доля = 4 if посл else (0 if n == 1 else min(4, int(5 * i / n))); return V.мелодия.get((кл, доля), 0.0)
    б = np.array([прежняя(x) for x in X[тест]])
    print("прежняя цель (середина слова): средняя ошибка %.2f пт" % np.mean(np.abs(Y[тест, 2] - б)))
    for k, имя in enumerate(("начало", "конец", "середина")):
        print("  без модели (%s — общая медиана): %.2f пт" % (имя, np.mean(np.abs(Y[тест, k] - np.median(Y[уч, k])))))
    # деревья с усилением — потолок точности
    from sklearn.ensemble import HistGradientBoostingRegressor as H
    for k, имя in enumerate(("начало", "конец", "середина")):
        m = H(max_iter=300, learning_rate=0.06, max_leaf_nodes=31, min_samples_leaf=40, loss="absolute_error").fit(X[уч], Y[уч, k])
        print("  деревья (%s): %.2f пт" % (имя, np.mean(np.abs(Y[тест, k] - m.predict(X[тест])))))
    # таблица с откатом — то, что пойдёт в движок и в игру
    def таблица(Xу, Yу, мин=40):
        сум = {}
        for x, y in zip(Xу, Yу):
            for ур, k in enumerate(ключи(x)): сум.setdefault((ур,) + k, []).append(y)
        return {k: (np.median(np.array(v), axis=0), np.mean(np.abs(np.array(v) - np.median(np.array(v), axis=0)), axis=0), len(v)) for k, v in сум.items() if len(v) >= мин}
    Т = таблица(X[уч], Y[уч])
    def цель(x, Т=Т):
        for ур, k in enumerate(ключи(x)):
            v = Т.get((ур,) + k)
            if v is not None: return v
        return (np.zeros(3), np.full(3, 3.0), 0)
    п = np.array([цель(x)[0] for x in X[тест]])
    for k, имя in enumerate(("начало", "конец", "середина")):
        print("  таблица (%s): %.2f пт" % (имя, np.mean(np.abs(Y[тест, k] - п[:, k]))))
    # итоговая таблица — по всей базе
    Т = таблица(X, Y)
    out = {"|".join(map(str, k)): [[round(float(a), 2) for a in v[0]], [round(float(a), 2) for a in v[1]], v[2]] for k, v in Т.items()}
    json.dump({"f0_мед": V.f0_мед, "т": out}, open(f"/root/S/us2/prosody_{ГОЛОС}.json", "w", encoding="utf-8"), ensure_ascii=False)
    print("таблица: ключей", len(out), "→ prosody_%s.json" % ГОЛОС)
