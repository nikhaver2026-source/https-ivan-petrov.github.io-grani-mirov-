#!/usr/bin/env python3.13
"""scratch_one.py [фраза] [метка] — одна фраза «с нуля» по правилам из прочитанного (Apple: гибридный выбор единиц;
Microsoft HTT; Чаппелл и Хансен: сравнение способов сглаживания стыков):
 1. Звук кусков НЕ переделывается: ни сдвига высоты, ни сглаживания тембра, ни растяжения — только общий множитель
    громкости куска (у слушателей любая переделка звука на стыке оценивалась хуже сырой склейки).
 2. Выбор (Витерби): цена цели — место слова во фразе и знак, соседние звуки как в цели, чистота и звучание источника
    (хрип, срывы голоса, оценка записи), обычная длительность; цена стыка — высота краёв, громкость, спектр против живых
    переходов той же пары звуков; слова подряд из одной записи — без цены (чем длиннее цепочки, тем меньше стыков).
 3. «Оптимальная стыковка»: звонкий к звонкому — период в период (метки периодов голоса совмещены, перекрытие два
    периода); у глухих и смычных — разрез в самой тихой точке у границы, встык; иначе — в точке лучшего совпадения волн.
 4. Вариантов много (разные соотношения цен): каждый собирается и оценивается — двумя распознавателями (разборчивость)
    и по звуку стыков (скачок высоты, ступенька громкости, спектральный скачок сверх живого); берётся лучший.
Итог: out/<метка>.flac и отчёт по кускам и стыкам."""
import sys, os, json, math, re, random
import numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E, psola
SR = E.SR
ФРАЗА = sys.argv[1] if len(sys.argv) > 1 else "Ночью у стен ходит стража, и фонари горят до самого рассвета."
МЕТКА = sys.argv[2] if len(sys.argv) > 2 else "scratch"
S = E.Синтезатор("m"); V = S.V
КОНЕЦ = set(".!?…")


# ── целевая линия высоты фразы: обычный ход спокойной фразы у этого голоса (таблица prosody.py: медианы высоты начала,
#    конца и середины слова по месту во фразе) — куски подбираются под неё, а не переделываются под неё
import prosody as PR
_Т = json.load(open("/root/S/us2/prosody_m.json", encoding="utf-8"))["т"]
_КР = json.load(open("/root/S/us2/edgef0_m.json", encoding="utf-8"))
_пт = lambda v: 12 * math.log2(v / V.f0_мед)


_ЛИН55 = {}


def линия_v55(слова, end):
    """Мелодия нынешнего движка (её интонацию игрок назвал хорошей) как целевая линия: высота начала, конца и середины
    каждого слова у выбранных им кусков; неизвестное — по соседям; края в пределах −6…+4,5 пт (ниже — хрип); на каждом
    стыке конец левого слова и начало правого сведены к среднему — линия непрерывна, форма фразы та же."""
    res = S.витерби(list(слова), end); сыр = []
    for u in res:
        в = высоты(u[1]) if u[0] == "o" else None
        сыр.append(list(в) if в else [None, None, None])
    n = len(сыр)
    for i, (a, b, m) in enumerate(сыр):
        if m is None: m = (a + b) / 2 if a is not None and b is not None else a if a is not None else b
        if m is None: m = next((x[2] for x in сыр[i + 1:] + сыр[:i][::-1] if x[2] is not None), 0.0)
        if a is None: a = сыр[i - 1][1] if i > 0 and сыр[i - 1][1] is not None else m
        if b is None: b = m
        сыр[i] = [float(np.clip(v, -6.0, 4.5)) for v in (a, b, m)]
    if os.environ.get("LINE_AVG"):   # прежний вариант: на стыке конец левого и начало правого — к среднему
        for i in range(n - 1):
            t = (сыр[i][1] + сыр[i + 1][0]) / 2; сыр[i][1] = t; сыр[i + 1][0] = t
        for x in сыр: x[2] = 0.5 * x[2] + 0.25 * (x[0] + x[1])
    return сыр


def линия(слова, i, end):
    if os.environ.get("LINE", "v55") == "v55":
        key = (tuple(слова), end)
        if key not in _ЛИН55: _ЛИН55[key] = линия_v55(слова, end)
        return _ЛИН55[key][i]
    кл = "?" if end == "?" else "," if end in ",;—" else ":" if end == ":" else "."
    ф = PR.признаки(слова, i, кл); x = [ф[k] for k in PR.ИМЕНА]
    for ур, k in enumerate(PR.ключи(x)):
        v = _Т.get("|".join(map(str, (ур,) + k)))
        if v: return v[0]
    return [0.0, 0.0, 0.0]


def высоты(o):
    ri, j = V.occ[o]; e = _КР.get(f"{V.recs[ri]['f']}#{j}")
    if not e: return None
    return [(_пт(v) if v > 0 else None) for v in e[:3]]


def отклонение(o, цель):
    """Насколько высота слова (начало, конец, середина) далека от линии фразы: до 1 пт — свободно, дальше — круто."""
    в = высоты(o)
    if в is None: return 1.5
    d = [abs(a - b) for a, b in zip(в, цель) if a is not None]
    if not d: return 1.5
    return float(np.mean([max(0.0, x - 1.0) + 0.25 * max(0.0, x - 1.0) ** 2 for x in d]))


def класс_знака(z): return "?" if z == "?" else "," if z in ",;—" else ":" if z == ":" else "." if z else ""


ПРИЗВУК = {("gvoice_pack/m/p06507", "рассвета")}   # игрок: призвук в «рассвета» (и в v55, и в сборке с нуля — одна и та же запись)


def цена_цели(o, слова, i, end):
    """Насколько вхождение подходит месту: знак и край фразы, соседние звуки, качество источника, длительность."""
    n = len(слова); w = V.w(o); c = 0.0; посл, перв = i == n - 1, i == 0
    if (V.recs[V.occ[o][0]]["f"], w[0]) in ПРИЗВУК: c += 50.0
    зн = V.знак(o)
    if посл:
        if зн is not None and класс_знака(зн) == класс_знака(end): c += 0.0
        elif V.конец_фразы(o): c += 1.0
        else:   # слово из середины записи: годится в конец фразы, если его тон идёт вниз (в конце фраз у диктора хрип)
            в = высоты(o); вниз = bool(в and в[0] is not None and в[1] is not None and в[1] <= в[0] - 0.8)
            c += 1.2 if вниз and end in ".!…" else 3.0
    else:
        if V.конец_фразы(o): c += 2.5
        elif w[4] >= 0.05: c += 1.0
    if перв: c += 0.0 if V.начало_фразы(o) else 0.8
    elif w[3] >= 0.05: c += 1.0
    for d, idx in ((-1, i - 1), (1, i + 1)):   # соседний звук в источнике — как в цели (коартикуляция)
        цель = слова[idx] if 0 <= idx < n else None; ист = V.сосед(o, d)
        if цель is None and ист is None: continue
        if цель is None or ист is None: c += 0.5; continue
        if цель == ист: c -= 0.4; continue
        a = цель[-1] if d < 0 else цель[0]; b = ист[-1] if d < 0 else ист[0]
        c += 0.0 if a == b else 0.35 if E.класс(a) == E.класс(b) else 0.9
    ч = float(V.чистота[o]) if V.чистота is not None else -1
    c += 3.0 * (0.3 if ч < 0 else ч)
    c += 7.0 * max(0.0, S._скрип(o) - 0.05) + 1.5 * S._излом(o) + 1.0 * S._качество_ист(o)   # хрип слышен призвуком
    c += float(V.край_л[o]) + float(V.край_п[o])
    м = V.медиана.get(w[0]) or V.dur[o]
    c += 1.5 * max(0.0, abs(math.log(max(1e-3, V.dur[o]) / max(1e-3, м))) - 0.2)
    return c


def цена_стыка(c1, c2, k):
    """Кандидат — целое вхождение («o») или слово из двух частей («ч»: единицы мельче слова, как полузвуки у Apple)."""
    if c1["вид"] == "o" and c2["вид"] == "o":
        o1, o2 = c1["o"], c2["o"]; r1, j1 = V.occ[o1]; r2, j2 = V.occ[o2]
        if r1 == r2 and j2 == j1 + 1: return 0.0
    c = k["стык"]; a, b = c1["fe"], c2["fs"]
    if a > 0 and b > 0:
        d = abs(12 * math.log2(a / b)); c += k["f0"] * (d + max(0.0, d - 2.0) ** 2)
    if c1["вид"] == "o" and c2["вид"] == "o":
        c += k["громк"] * min(15.0, abs(float(V.ene[c1["o"]]) - float(V.ens[c2["o"]])))
        c += k["живой"] * min(6.0, S._шов_живой(c1["o"], c2["o"]))
    return c


_f0кэш = {}


def дорожка(ri):
    if ri not in _f0кэш: _f0кэш[ri] = psola._f0_дорожка(V.звук(ri).astype(np.float32))[0]
    return _f0кэш[ri]


def высота_участка(ri, t0, t1, конец):
    f = дорожка(ri); v = [x for x in f[int(t0 * 100):int(t1 * 100) + 1] if x > 0]
    if len(v) < 2: return 0.0
    return float(np.median(v[-3:] if конец else v[:3]))


_ЧАСТИ = {}


def ударный_на_слух(o, su):
    """Словарь ударений ошибается («двери» → «дверИ»): ударный гласный должен быть не тише прочих гласных слова
    больше чем на 2 дБ."""
    ww = V.w(o); U = ww[0]; a = V.звук(V.occ[o][0]); г = []
    for q, ch in enumerate(U):
        if ch not in E.ГЛАСНЫЕ: continue
        t0 = ww[5][q]; t1 = ww[5][q + 1] if q + 1 < len(U) else ww[2]
        seg = a[int(t0 * SR):int(t1 * SR)]
        if len(seg) > 64: г.append((q, E._db(seg)))
    св = next((d for q, d in г if q == su), None); пр = [d for q, d in г if q != su]
    return св is None or not пр or св >= max(пр) - 2.0


def части_слова(W, лин, N=14):
    """Слово из двух частей других слов: начало — из слова с тем же началом, конец — из слова с тем же концом; ударение
    на том же месте; разрез перед согласным; обе части — по линии высоты фразы и сходятся между собой по высоте."""
    key = (W, tuple(round(x, 1) for x in лин))
    if key in _ЧАСТИ: return _ЧАСТИ[key]
    уд = E.ударение(W); n = len(W); out = []
    if уд < 0 or n < 4: _ЧАСТИ[key] = out; return out
    откл1 = lambda v, ц: 1.5 if v <= 0 else max(0.0, abs(_пт(v) - ц) - 1.0) + 0.25 * max(0.0, abs(_пт(v) - ц) - 1.0) ** 2
    for k_ in range(2, n - 1):
        if W[k_] in E.ГЛАСНЫЕ or W[k_] in "ьъй": continue
        Л, П = W[:k_], W[k_:]; лев, прав = [], []
        for U, os_ in V.по_слову.items():
            if U == W or len(U) <= max(len(Л), len(П)): continue
            su = E.ударение(U)
            if su < 0: continue
            if U.startswith(Л) and (su == уд if уд < k_ else su >= k_):
                ктх = 0.0 if U[k_] == W[k_] else 0.4 if E.класс(U[k_]) == E.класс(W[k_]) else 1.0
                for o in os_[:8]:
                    ww = V.w(o)
                    if len(ww[5]) != len(U) or (V.чистота is not None and V.чистота[o] > 0.34): continue
                    ri = V.occ[o][0]; t0, t1 = ww[1], ww[5][k_]
                    if t1 - t0 < 0.04: continue
                    if уд < k_ and (ww[5][su + 1] - ww[5][su] < 0.07 or not ударный_на_слух(o, su)): continue
                    fs, fe = высота_участка(ri, t0, t1, False), высота_участка(ri, t0, t1, True)
                    c = ктх + откл1(fs, лин[0]) + 7.0 * max(0.0, S._скрип(o) - 0.05) + (0.6 if ww[3] >= 0.05 else 0.0)
                    лев.append((c, ri, t0, t1, fs, fe, U))
            dп = len(U) - len(П)
            if U.endswith(П) and ((n - 1 - уд) == (len(U) - 1 - su) if уд >= k_ else su < dп):
                ктх = 0.0 if U[dп - 1] == W[k_ - 1] else 0.4 if E.класс(U[dп - 1]) == E.класс(W[k_ - 1]) else 1.0
                for o in os_[:8]:
                    ww = V.w(o)
                    if len(ww[5]) != len(U) or (V.чистота is not None and V.чистота[o] > 0.34): continue
                    ri = V.occ[o][0]; t0, t1 = ww[5][dп], ww[2]
                    if t1 - t0 < 0.04: continue
                    if уд >= k_ and ((ww[5][su + 1] if su + 1 < len(U) else ww[2]) - ww[5][su] < 0.07 or not ударный_на_слух(o, su)): continue
                    fs, fe = высота_участка(ri, t0, t1, False), высота_участка(ri, t0, t1, True)
                    c = ктх + откл1(fe, лин[1]) + 7.0 * max(0.0, S._скрип(o) - 0.05) + (1.0 if V.конец_фразы(o) else 0.0)
                    прав.append((c, ri, t0, t1, fs, fe, U, o))
        лев.sort(key=lambda z: z[0]); прав.sort(key=lambda z: z[0])
        пары = []
        for l in лев[:25]:
            for r in прав[:25]:
                d = abs(12 * math.log2(l[5] / r[4])) if l[5] > 0 and r[4] > 0 else 1.5
                пары.append((2.2 + l[0] + r[0] + 0.8 * (d + max(0.0, d - 1.5) ** 2), d, l, r))   # шов внутри слова слышнее шва между словами
        пары.sort(key=lambda z: z[0])
        for c, d, l, r in пары[:40]:
            # оптимальная стыковка внутри слова: разрез каждой части — в самой тихой точке у границы звуков (±25 мс);
            # шов проверяется по звуку: расстояние огибающих спектра и ступенька громкости через точку шва
            t1 = тихое_время(l[1], l[3]); t0 = тихое_время(r[1], r[2])
            if t1 - l[2] < 0.04 or r[3] - t0 < 0.04: continue
            a = V.звук(l[1])[int(l[2] * SR):int(t1 * SR)].astype(np.float32); b = V.звук(r[1])[int(t0 * SR):int(r[3] * SR)].astype(np.float32)
            W_ = int(SR * 0.025)
            if len(a) < 2 * W_ or len(b) < 2 * W_: continue
            ea, eb = S._огибающая(a[-W_:]), S._огибающая(b[:W_])
            рас = float(np.mean(np.abs(ea - eb))) if ea is not None and eb is not None else 1.5
            гр = abs(E._db(a[-W_:]) - E._db(b[:W_]))
            out.append(dict(вид="ч", t=c + 3.0 * рас + 0.08 * гр, fs=l[4], fe=r[5], части=[(l[1], l[2], t1), (r[1], t0, r[3])], o=r[7],
                            инфо=f"{Л}|{П}: «{l[6]}» + «{r[6]}», шов внутри слова: высота {d:.1f} пт, спектр {рас:.2f}, громкость {гр:.1f} дБ"))
    out.sort(key=lambda z: z["t"]); out = out[:N]; _ЧАСТИ[key] = out; return out


def тихое_время(ri, t, окно=0.025, кадр=0.005):
    """Самая тихая точка записи в окне ±окно вокруг границы звуков t (с)."""
    a = V.звук(ri); F = int(SR * кадр); p0 = max(0, int((t - окно) * SR)); p1 = min(len(a) - F, int((t + окно) * SR))
    if p1 <= p0: return t
    e = [(float(np.mean(a[p:p + F].astype(np.float64) ** 2)), p) for p in range(p0, p1, F // 2)]
    return (min(e)[1] + F // 2) / SR


def витерби(слова, end, k, K=160):
    n = len(слова); канд = []
    for i, w in enumerate(слова):
        os_ = V.по_слову.get(w, [])
        if not os_: return None
        лин = линия(слова, i, end)
        ц = sorted(((цена_цели(o, слова, i, end) + k.get("линия", 0.0) * отклонение(o, лин), o) for o in os_))[:K]
        кс = [dict(вид="o", o=o, t=t, fs=float(V.f0s2[o]), fe=float(V.f0e2[o])) for t, o in ц]
        # редкое слово, ни одна запись которого не ложится на линию фразы, — ещё и из двух частей других слов
        if k.get("части", 1) and (len(os_) < 12 or min(отклонение(o, лин) for o in os_) > 0.8):
            цели = [лин]
            if i > 0: цели.append([линия(слова, i - 1, end)[1], лин[1], лин[2]])          # начать там, где кончил сосед слева
            if i < n - 1: цели.append([лин[0], линия(слова, i + 1, end)[0], лин[2]])      # кончить там, где начнёт сосед справа
            for ц_ in цели:
                for ч in части_слова(w, ц_): кс.append(dict(ч, t=k.get("часть", 1.0) * ч["t"]))
        канд.append(кс)
    # цепочки: продолжение предыдущего слова из той же записи всегда в списке
    for i in range(1, n):
        есть = {c["o"] for c in канд[i] if c["вид"] == "o"}
        for pc in list(канд[i - 1]):
            if pc["вид"] != "o": continue
            po = pc["o"]; o = po + 1
            if o < len(V.occ) and o not in есть and V.occ[o][0] == V.occ[po][0] and V.occ[o][1] == V.occ[po][1] + 1 and V.w(o)[0] == слова[i] \
                    and V.occ[o][0] not in V.искл_ri:
                канд[i].append(dict(вид="o", o=o, t=цена_цели(o, слова, i, end) + k.get("линия", 0.0) * отклонение(o, линия(слова, i, end)), fs=float(V.f0s2[o]), fe=float(V.f0e2[o]))); есть.add(o)
    best = [[k["цель"] * c["t"] for c in канд[0]]]; back = [[-1] * len(канд[0])]
    for i in range(1, n):
        cur, bk = [], []
        for c in канд[i]:
            m, mi = 1e18, -1
            for q, pc in enumerate(канд[i - 1]):
                v = best[i - 1][q] + цена_стыка(pc, c, k)
                if v < m: m, mi = v, q
            cur.append(m + k["цель"] * c["t"]); bk.append(mi)
        best.append(cur); back.append(bk)
    q = int(np.argmin(best[-1])); путь = []
    for i in range(n - 1, -1, -1):
        путь.append(канд[i][q]); q = back[i][q]
    return путь[::-1]


def звонко(x, конец):
    """Край куска звонкий: в последних (первых) 40 мс есть высота."""
    seg = x[-int(SR * 0.06):] if конец else x[:int(SR * 0.06)]
    if len(seg) < int(SR * 0.05): return False
    f, _ = psola._f0_дорожка(seg.astype(np.float32)); f = f[-4:] if конец else f[:4]
    return int(np.sum(f > 0)) >= 3


def тихая_точка(x, конец, окно=0.020, кадр=0.004):
    """Самый тихий кадр в окне у края: туда разрез (смычка, пауза) — оптимальная стыковка без переделки звука."""
    W, F = int(SR * окно), int(SR * кадр)
    if len(x) < 2 * W: return None
    seg = x[-W:] if конец else x[:W]
    e = [float(np.mean(seg[p:p + F] ** 2)) for p in range(0, W - F + 1, F // 2)]
    i = int(np.argmin(e)); ур = 10 * math.log10(e[i] + 1e-10); пик = 10 * math.log10(float(np.max(x ** 2)) + 1e-10)
    if ур > пик - 30: return None   # тихого места у края нет
    p = i * (F // 2) + F // 2
    return (len(x) - W + p) if конец else p


def соединить(a, b, отчёт):
    """Стык двух кусков без переделки звука: период в период, либо разрез в тихой точке, либо лучшее совпадение волн."""
    за, зб = звонко(a, True), звонко(b, False)
    if за and зб:
        y = E.Синтезатор.стык_периоды(a, b, n=2)
        if y is not None: отчёт.append("период в период"); return y, len(a)
        отчёт.append("совпадение волн"); return E.Синтезатор.стык(a, b, L=int(SR * 0.012), сдвиг=int(SR * 0.009), корр=True), len(a)
    pa, pb = тихая_точка(a, True), тихая_точка(b, False)
    if pa is not None or pb is not None:
        if pa is not None: a = a[:pa]
        if pb is not None: b = b[pb:]
        отчёт.append("разрез в тишине"); return E.Синтезатор.встык(a, b), len(a)
    отчёт.append("встык на переходе звуков"); return E.Синтезатор.встык(a, b), len(a)


def собрать(отрезки, пути):
    """Куски → звук. Возвращает звук, точки стыков и отчёт."""
    части = []; точки = []; отч = []; поз = 0
    for (слова, end), путь in zip(отрезки, пути):
        кс = S.куски([("o", c["o"]) if c["вид"] == "o" else ("ч", c["части"]) for c in путь]); звуки = []
        посл_o = путь[-1]["o"]
        for ki, (ri, s, e, j, вид, o) in enumerate(кс):
            a = V.звук(ri); i0, i1 = int(s * SR), min(len(a), int(e * SR))
            if ki == len(кс) - 1:   # конец отрезка: хвост слова до 30 мс, с затуханием
                хв = int(SR * min(0.03, max(0.0, V.w(посл_o)[4]))) if not V.конец_фразы(посл_o) else int(SR * 0.04)
                i1 = min(len(a), i1 + хв)
            x = a[i0:i1].astype(np.float32).copy()
            звуки.append(x)
            отч.append(f"{V.recs[ri]['f']}: «{' '.join(w[0] for w in V.recs[ri]['w'] if s - 1e-3 <= w[1] and w[2] <= e + 0.05)}»" if вид == "o" else f"{V.recs[ri]['f']}: часть слова, {e - s:.2f} с")
        # громкость кусков — к общей (только множитель)
        ур = [S._громкость_речи(x) for x in звуки]; ц = float(np.median(ур))
        звуки = [x * 10 ** (float(np.clip(ц - u, -4, 4)) * 0.6 / 20) for x, u in zip(звуки, ур)]
        y = звуки[0]
        for x in звуки[1:]:
            y, p = соединить(y, x, отч); точки.append(поз + p)
        f = int(SR * 0.008); y = y.copy(); y[:f // 2] *= np.linspace(0, 1, f // 2); y[-f:] *= np.linspace(1, 0, f)
        части.append(y); поз += len(y)
        пауза = int(SR * (0.22 if end in ",;—:" else 0.0)); части.append(np.zeros(пауза, np.float32)); поз += пауза
    return np.concatenate(части).astype(np.float32), точки, отч


# ── оценка варианта ──
import sherpa_onnx, judge2
_М = "/root/S/asr/sherpa-onnx-nemo-ctc-giga-am-v2-russian-2025-04-19"
_rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f"{_М}/model.int8.onnx", tokens=f"{_М}/tokens.txt", num_threads=2)
норм = lambda t: re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е"))).strip()


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1): cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def узнать(y):
    a16 = np.interp(np.arange(0, len(y), SR / 16000), np.arange(len(y)), y).astype(np.float32)
    s = _rec.create_stream(); s.accept_waveform(16000, a16); _rec.decode_stream(s); return s.result.text


def мерки_шва(y, p):
    """Скачок высоты (пт), ступенька громкости (дБ) и спектральный скачок (MFCC) у точки стыка."""
    L = int(SR * 0.02)
    if p - 3 * L < 0 or p + 3 * L > len(y): return None
    a, b = y[p - L:p], y[p:p + L]
    fa, _ = psola._f0_дорожка(y[p - 3 * L:p].astype(np.float32)); fb, _ = psola._f0_дорожка(y[p:p + 3 * L].astype(np.float32))
    fa, fb = fa[-3:], fb[:3]; fa, fb = fa[fa > 0], fb[fb > 0]
    дв = abs(12 * math.log2(float(np.median(fb)) / float(np.median(fa)))) if len(fa) and len(fb) else 0.0
    return дв, abs(E._db(a) - E._db(b)), float(np.linalg.norm(E._mfcc(a)[1:] - E._mfcc(b)[1:]))


if __name__ == "__main__":
    отр = [(o["w"], o["end"]) for o in E.текст_в_отрезки(ФРАЗА)]
    цель = норм(" ".join(" ".join(w) for w, _ in отр))
    random.seed(7); варианты = {}
    сетка = [dict(цель=1.0, стык=1.0, f0=0.35, громк=0.05, живой=0.5, линия=1.0, часть=1.0)]
    for _ in range(60):
        сетка.append(dict(цель=random.choice([0.6, 1.0, 1.5]), стык=random.choice([0.5, 1.0, 2.0, 3.0]), f0=random.choice([0.2, 0.35, 0.6, 1.0]),
                          громк=random.choice([0.02, 0.05, 0.1]), живой=random.choice([0.2, 0.5, 1.0]), линия=random.choice([0.5, 1.0, 2.0, 3.0]), часть=random.choice([0.6, 1.0, 1.5])))
    for k in сетка:
        пути = [витерби(w, e, k) for w, e in отр]
        if any(p is None for p in пути): print("слова нет в базе"); sys.exit(1)
        ключ = tuple(tuple((c["вид"], c["o"], tuple(c.get("части", ()))) for c in p) for p in пути)
        if ключ not in варианты: варианты[ключ] = (k, пути)
    print("вариантов выбора:", len(варианты))
    def оценить(пути, k):
        y, точки, отч = собрать(отр, пути)
        г1 = норм(узнать(y)); г2 = норм(judge2.узнать2(y))
        c1 = lev(цель.replace(" ", ""), г1.replace(" ", "")) / len(цель.replace(" ", "")); c2 = lev(цель.replace(" ", ""), г2.replace(" ", "")) / len(цель.replace(" ", ""))
        м = [m for m in (мерки_шва(y, p) for p in точки) if m]
        выс = max([m[0] for m in м] or [0.0]); гр = float(np.mean([m[1] for m in м])) if м else 0.0; сп = float(np.mean([m[2] for m in м])) if м else 0.0
        def откл_к(c, лн):
            if c["вид"] == "o": return отклонение(c["o"], лн)
            d = [abs(_пт(v) - ц) for v, ц in ((c["fs"], лн[0]), (c["fe"], лн[1])) if v > 0]
            return float(np.mean([max(0.0, x - 1.0) + 0.25 * max(0.0, x - 1.0) ** 2 for x in d])) if d else 1.5
        откл = float(np.mean([откл_к(c, линия(w, i, e)) for (w, e), путь in zip(отр, пути) for i, c in enumerate(путь)]))
        скач = []
        for путь in пути:
            for ка, кб in zip(путь, путь[1:]):
                if ка["вид"] == "o" and кб["вид"] == "o":
                    r1, j1 = V.occ[ка["o"]]; r2, j2 = V.occ[кб["o"]]
                    if r1 == r2 and j2 == j1 + 1: continue
                a, b = ка["fe"], кб["fs"]
                if a > 0 and b > 0: скач.append(abs(12 * math.log2(a / b)))
        выс = max(выс, max(скач or [0.0]))
        хр = float(np.mean([S._скрип(c["o"]) for путь in пути for c in путь]))
        # сначала разборчивость (оба судьи), потом гладкость: мелодия по линии, худший скачок высоты, число стыков, громкость, спектр, хрип
        внутри = sum(1 for путь in пути for c in путь if c["вид"] == "ч")   # швы внутри слов слышнее (игрок: призвук в «фонари» из частей)
        балл = 100 * (c1 + c2) + 2.0 * откл + 0.6 * выс + 0.4 * len(точки) + 0.15 * гр + 0.02 * сп + 6.0 * хр + 2.5 * внутри
        return (балл, c1, c2, выс, len(точки), гр, сп, y, отч, k, г1, г2, откл, пути, точки)
    итог = [оценить(пути, k) for ключ, (k, пути) in варианты.items()]
    итог.sort(key=lambda z: z[0])
    # местный перебор: у лучшей сборки каждое слово из частей (и последнее слово) пробуется в других исполнениях —
    # другие пары частей, лучшие целые записи; каждая замена проверяется обоими распознавателями и мерками
    луч = итог[0]; kб = луч[9]
    for si, ((w, e), путь) in enumerate(zip(отр, луч[13])):
        for i in range(len(путь)):
            if not (луч[13][si][i]["вид"] == "ч" or (i == len(путь) - 1 and si == len(отр) - 1)): continue
            лин = линия(w, i, e); замены = [dict(ч, t=ч["t"]) for ч in части_слова(w[i], лин, N=14)]
            целые = sorted(((цена_цели(o, w, i, e) + kб.get("линия", 1.0) * отклонение(o, лин), o) for o in V.по_слову.get(w[i], [])))[:6]
            замены += [dict(вид="o", o=o, t=t, fs=float(V.f0s2[o]), fe=float(V.f0e2[o])) for t, o in целые if t < 40]
            тек = луч[13][si][i]["t"]
            for з in замены:   # замена принимается по сумме: оценка сборки + цена места (конец фразы, хрип, линия)
                пути2 = [list(p) for p in луч[13]]; пути2[si][i] = з
                r = оценить(пути2, kб)
                if r[0] + 0.7 * з["t"] < луч[0] + 0.7 * тек - 1e-6: луч = r; тек = з["t"]
    итог = [луч]
    итог.sort(key=lambda z: z[0])
    for z in итог[:6]:
        print("балл %.2f | ошибок букв %.1f %% / %.1f %% | мелодия от линии %.2f | худший скачок высоты %.1f пт | стыков %d | громкость %.1f дБ | спектр %.0f | %s" % (z[0], 100 * z[1], 100 * z[2], z[12], z[3], z[4], z[5], z[6], json.dumps(z[9], ensure_ascii=False)))
    л = итог[0]
    sf.write(f"/root/S/us2/out/{МЕТКА}.flac", np.concatenate([np.zeros(int(SR * 0.05), np.float32), л[7], np.zeros(int(SR * 0.15), np.float32)]), SR, subtype="PCM_16")
    print("лучший:", "\n  ".join(л[8])); print("слышит судья 1:", л[10]); print("слышит судья 2:", л[11])
    for (w, e), путь in zip(отр, л[13]):
        for i, c in enumerate(путь):
            лн = линия(w, i, e)
            if c["вид"] == "o": в = высоты(c["o"]) or [None] * 3; что = ""
            else: в = [_пт(c["fs"]) if c["fs"] > 0 else None, _пт(c["fe"]) if c["fe"] > 0 else None, None]; что = "  из частей — " + c["инфо"]
            print("  %-10s высота нач/кон/сер: %s  линия: %s%s" % (w[i], " ".join(("%+.1f" % x) if x is not None else "  — " for x in в), " ".join("%+.1f" % x for x in лн), что))
        for ка, кб in zip(путь, путь[1:]):
            if ка["вид"] == "o" and кб["вид"] == "o":
                r1, j1 = V.occ[ка["o"]]; r2, j2 = V.occ[кб["o"]]
                if r1 == r2 and j2 == j1 + 1: continue
            a, b = ка["fe"], кб["fs"]
            print("  стык: высота %.0f → %.0f Гц (%s пт)" % (a, b, ("%.1f" % abs(12 * math.log2(a / b))) if a > 0 and b > 0 else "—"))
    y = л[7]
    for p_ in л[14]:
        m = мерки_шва(y, p_); print(("  точка %.2f с: скачок высоты %.1f пт, громкость %.1f дБ, спектр %.0f" % ((p_ / SR,) + m)) if m else "  точка %.2f с: край" % (p_ / SR))
    print("готово →", f"/root/S/us2/out/{МЕТКА}.flac", "длина %.2f с" % (len(л[7]) / SR))
