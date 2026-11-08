#!/usr/bin/env python3.13
"""engine.py — синтезатор-склейка голосами Gemini (с нуля, 4 ноября 2026). В игру пока не встраивается.

Устройство:
1. Текст: числа → слова, деление на интонационные отрезки по знакам препинания; у слова — место в отрезке.
2. Единицы от длинных к коротким: цепочки слов подряд из одной записи (естественные стыки и интонация) →
   отдельные слова → части слов (по времени букв) для слов, которых нет в базе.
3. Выбор Витерби: цена единицы (последнее слово отрезка — из конца фразы-источника, чтобы окончание не
   глоталось; соседние звуки как в цели, чтобы слова не слипались; длительность без выбросов) + цена стыка
   (высота голоса, громкость, спектр на границе; слова подряд из одной записи — бесплатно).
4. Склейка: стык с поиском лучшего совпадения волны и равномощным перекрытием; паузы по знакам; сглаживание
   громкости соседних кусков.
"""
import re, json, os, functools, math
import numpy as np, soundfile as sf

SR = 24000
КФ_РЕЖИМ = "корр"   # "энергия" — линейное перекрытие с подгонкой громкости смеси; иное — по совпадению волн
КФ_ПОРОГ = 0.0   # совпадение волн ниже порога — перекрытие как для несвязанных звуков
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
ТУТ = "/root/S/us2"
ГЛАСНЫЕ = set("аеиоуыэюяё")
ЗВОНКИЕ = set("бвгджзй")
СОНОРНЫЕ = set("лмнр")
ГЛУХИЕ = set("пфктшсхцчщ")


def класс(ch):
    if not ch: return "п"
    if ch in ГЛАСНЫЕ: return "г"
    if ch in СОНОРНЫЕ: return "с"
    if ch in ЗВОНКИЕ: return "з"
    if ch in ГЛУХИЕ: return "к"
    return "п"


# ───────────────────────── 1. ТЕКСТ ─────────────────────────
ЕД = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать",
      "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
ДЕС = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
СОТ = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]


def _до_тысячи(n, жен=False):
    w = []
    if n >= 100: w.append(СОТ[n // 100]); n %= 100
    if n >= 20: w.append(ДЕС[n // 10]); n %= 10
    if n:
        if жен and n == 1: w.append("одна")
        elif жен and n == 2: w.append("две")
        else: w.append(ЕД[n])
    return w


def число(n):
    n = int(n)
    if n == 0: return "ноль"
    if n < 0: return "минус " + число(-n)
    if n >= 10 ** 12:   # очень длинное число — по цифрам
        return " ".join("ноль" if ch == "0" else ЕД[int(ch)] for ch in str(n))
    w = []
    if n >= 1_000_000_000:
        м = n // 1_000_000_000; n %= 1_000_000_000; w += _до_тысячи(м)
        w.append("миллиард" if м % 10 == 1 and м % 100 != 11 else "миллиарда" if 2 <= м % 10 <= 4 and not 12 <= м % 100 <= 14 else "миллиардов")
    if n >= 1_000_000:
        м = n // 1_000_000; n %= 1_000_000; w += _до_тысячи(м)
        w.append("миллион" if м % 10 == 1 and м % 100 != 11 else "миллиона" if 2 <= м % 10 <= 4 and not 12 <= м % 100 <= 14 else "миллионов")
    if n >= 1000:
        т = n // 1000; n %= 1000; w += _до_тысячи(т, жен=True)
        w.append("тысяча" if т % 10 == 1 and т % 100 != 11 else "тысячи" if 2 <= т % 10 <= 4 and not 12 <= т % 100 <= 14 else "тысяч")
    w += _до_тысячи(n)
    return " ".join(x for x in w if x)


# латиница: клавиши и частые слова игры, остальное — по правилам чтения
ЛАТ_СЛОВА = {"enter": "энтер", "shift": "шифт", "alt": "альт", "ctrl": "контрол", "control": "контрол", "tab": "таб",
             "esc": "эскейп", "escape": "эскейп", "space": "пробел", "backspace": "бэкспейс", "delete": "делит", "del": "делит",
             "home": "хоум", "end": "энд", "page": "пейдж", "up": "ап", "down": "даун", "insert": "инсерт", "caps": "капс",
             "lock": "лок", "windows": "виндоус", "android": "андроид", "gemini": "джемини", "elevenlabs": "элевен лабс",
             "eleven": "элевен", "labs": "лабс", "flare": "флэр", "ok": "окей", "apk": "апэка", "wav": "вав", "mp": "эмпэ"}
ЛАТ_БУКВЫ = {"a": "эй", "b": "би", "c": "си", "d": "ди", "e": "и", "f": "эф", "g": "джи", "h": "эйч", "i": "ай", "j": "джей",
             "k": "кей", "l": "эл", "m": "эм", "n": "эн", "o": "оу", "p": "пи", "q": "кью", "r": "ар", "s": "эс", "t": "ти",
             "u": "ю", "v": "ви", "w": "дабл ю", "x": "экс", "y": "уай", "z": "зед"}
_ЛАТ_ПРАВИЛА = [("sch", "ш"), ("sh", "ш"), ("ch", "ч"), ("th", "т"), ("ph", "ф"), ("ck", "к"), ("qu", "кв"), ("oo", "у"),
                ("ee", "и"), ("ea", "и"), ("ou", "ау"), ("ay", "эй"), ("ey", "эй"), ("y", "и"), ("a", "а"), ("b", "б"),
                ("c", "к"), ("d", "д"), ("e", "е"), ("f", "ф"), ("g", "г"), ("h", "х"), ("i", "и"), ("j", "дж"), ("k", "к"),
                ("l", "л"), ("m", "м"), ("n", "н"), ("o", "о"), ("p", "п"), ("q", "к"), ("r", "р"), ("s", "с"), ("t", "т"),
                ("u", "у"), ("v", "в"), ("w", "в"), ("x", "кс"), ("z", "з")]


def латиница(слово):
    w = слово.lower()
    if w in ЛАТ_СЛОВА: return ЛАТ_СЛОВА[w]
    if re.fullmatch(r"f\d{1,2}", w): return "эф " + число(w[1:])
    if len(w) == 1: return ЛАТ_БУКВЫ.get(w, w)
    if w.isupper() if False else (слово.isupper() and len(w) <= 4): return " ".join(ЛАТ_БУКВЫ.get(ch, ch) for ch in w)
    out, i = "", 0
    while i < len(w):
        for a, b in _ЛАТ_ПРАВИЛА:
            if w.startswith(a, i): out += b; i += len(a); break
        else: i += 1
    return out


ЗНАК_КОНЦА = {".": ".", "!": "!", "?": "?", "…": "…", ",": ",", ";": ";", ":": ":", "—": "—", "(": ",", ")": ","}


def текст_в_отрезки(t):
    """→ [{"w": [слова], "end": знак}] ; слова — нижний регистр, «ё» → «е»."""
    t = str(t).replace("ё", "е").replace("Ё", "Е")
    t = re.sub(r"\b[Ff](\d{1,2})\b", lambda m: " эф " + число(m.group(1)) + " ", t)
    t = re.sub(r"[A-Za-z]+", lambda m: " " + латиница(m.group(0)) + " ", t)
    t = re.sub(r"(\d+)\s*%", lambda m: число(m.group(1)) + " процентов", t)
    t = re.sub(r"\d+", lambda m: " " + число(m.group(0)) + " ", t)
    t = re.sub(r"\s[-–—]\s", " — ", t)
    t = t.replace("...", "…")
    out, cur = [], []
    for tok in re.findall(r"[А-Яа-яA-Za-z]+(?:-[А-Яа-яA-Za-z]+)*|[.!?…,;:—()]", t):
        if tok in ЗНАК_КОНЦА:
            if cur: out.append({"w": cur, "end": ЗНАК_КОНЦА[tok]}); cur = []
            elif out and tok in ".!?…": out[-1]["end"] = ЗНАК_КОНЦА[tok]
        else:
            for part in tok.lower().split("-"):
                if part: cur.append(part)
    if cur: out.append({"w": cur, "end": "."})
    return out


ПАУЗА = {".": 0.40, "!": 0.40, "?": 0.40, "…": 0.48, ",": 0.17, ";": 0.24, ":": 0.24, "—": 0.20}
КОНЕЦ_ФРАЗЫ = set(".!?…")


# ── ударения: словарь Koziev/NLP_Datasets all_accents (CC0), 1,68 млн словоформ ──
_УД = None
def ударение(w):
    """Номер ударной буквы слова или −1, если слова нет в словаре."""
    global _УД
    if _УД is None:
        p = f"{ТУТ}/dict/stress.json"
        _УД = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
    i = _УД.get(w, -1)
    if i < 0 and sum(ch in ГЛАСНЫЕ for ch in w) == 1:   # одна гласная — она и ударная
        i = next(k for k, ch in enumerate(w) if ch in ГЛАСНЫЕ)
    return i


def с_ударением(w):
    """Слово, где ударная гласная — заглавная (для сравнения частей с учётом ударения); без словаря — как есть."""
    i = ударение(w)
    return w[:i] + w[i].upper() + w[i + 1:] if i >= 0 else w


# ───────────────────────── 2. БАЗА ─────────────────────────
def _yin_f0(x, sr=SR, fmin=70, fmax=400):
    """Высота голоса окна x (Гц) или 0 — глухо. Упрощённый YIN."""
    x = x - np.mean(x)
    if np.sqrt(np.mean(x ** 2)) < 1e-3: return 0.0
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    if len(x) < tmax * 2: return 0.0
    W = len(x) - tmax
    r = np.correlate(x, x[:W], mode="valid")[tmin:tmax]          # Σ x[j]·x[j+τ]
    e = np.cumsum(np.concatenate([[0.0], x.astype(np.float64) ** 2]))
    E0 = e[W]; Et = e[np.arange(tmin, tmax) + W] - e[np.arange(tmin, tmax)]
    d = E0 + Et - 2 * r
    cm = d * np.arange(1, len(d) + 1) / (np.cumsum(d) + 1e-12)
    i = np.where(cm < 0.15)[0]
    if not len(i): return 0.0
    i = i[0]
    while i + 1 < len(cm) and cm[i + 1] < cm[i]: i += 1
    return sr / (tmin + i)


@functools.lru_cache(maxsize=1)
def _mel():
    n_fft, n_mel = 512, 32
    f = np.linspace(0, SR / 2, n_fft // 2 + 1)
    m = lambda hz: 2595 * np.log10(1 + hz / 700)
    im = lambda mm: 700 * (10 ** (mm / 2595) - 1)
    pts = im(np.linspace(m(80), m(8000), n_mel + 2))
    fb = np.zeros((n_mel, len(f)))
    for i in range(n_mel):
        l, c, r = pts[i], pts[i + 1], pts[i + 2]
        fb[i] = np.clip(np.minimum((f - l) / (c - l), (r - f) / (r - c)), 0, None)
    dct = np.cos(np.pi / n_mel * (np.arange(n_mel)[None, :] + 0.5) * np.arange(13)[:, None])
    return fb, dct


def _mfcc(x):
    fb, dct = _mel()
    if len(x) < 64: return np.zeros(13)
    w = np.hanning(len(x)); spec = np.abs(np.fft.rfft(x * w, 512)) ** 2
    return dct @ np.log(fb @ spec + 1e-8)


def _db(x): return 10 * math.log10(float(np.mean(x ** 2)) + 1e-10)


def _знаки(текст, слова):
    """Знак после каждого слова по исходному тексту: '', '.', ',', '?', '!', ':', ';', '—', '…'; None — текст неизвестен."""
    if not текст: return None
    t = текст.replace("ё", "е").replace("Ё", "Е").replace("...", "…")
    t = re.sub(r"\s[-–—]\s", " — ", t)
    out, k = [], 0
    for tok in re.findall(r"[А-Яа-яA-Za-z0-9]+(?:-[А-Яа-яA-Za-z0-9]+)*|[.!?…,;:—]", t):
        if tok in ".!?…,;:—":
            if out and out[-1] == "": out[-1] = tok
            elif out and tok in ".!?…" and out[-1] in ",;:—": out[-1] = tok
            continue
        for part in tok.lower().split("-"):
            if not part: continue
            if k >= len(слова) or part != слова[k]: return None
            out.append(""); k += 1
    return out if k == len(слова) else None


class Голос:
    def __init__(self, голос):
        self.г = голос
        self.D = {"m": "gvoice", "f": "gvoice_f"}[голос]
        self.recs = [json.loads(l) for l in open(f"{ТУТ}/db_{голос}.jsonl", encoding="utf-8")]
        for доп in ("pack", "corpus"):   # голосовой пакет того же голоса; корпус синтезатора (только для склейки)
            if os.path.exists(f"{ТУТ}/db_{голос}_{доп}.jsonl"):
                self.recs += [json.loads(l) for l in open(f"{ТУТ}/db_{голос}_{доп}.jsonl", encoding="utf-8")]
        # знак препинания после каждого слова записи — по исходному тексту (punct.json), если он известен
        тексты = json.load(open(f"{ТУТ}/punct.json", encoding="utf-8")) if os.path.exists(f"{ТУТ}/punct.json") else {}
        for r in self.recs:
            r["pz"] = _знаки(тексты.get(r["k"]), [w[0] for w in r["w"]])
        # честная проверка: записи, совпадающие с проверочными фразами (или их частью от трёх слов), не используются
        # (список записей и порядок не меняются — признаки и чистота остаются в силе)
        искл_ri = set(); искл = os.environ.get("SYNTH_EXCLUDE")
        if искл:
            кл = lambda t: re.sub(r"\s+", " ", re.sub(r"[^а-яa-z0-9]+", " ", str(t).lower().replace("ё", "е"))).strip()
            фразы = [" " + кл(t) + " " for f in искл.split(":") if os.path.exists(f) for t in json.load(open(f, encoding="utf-8"))]
            for ri, r in enumerate(self.recs):
                k = " " + r["k"] + " "
                if any(k.strip() == ф.strip() or (len(r["k"].split()) >= 3 and k in ф) for ф in фразы): искл_ri.add(ri)
        # чужой голос: записи, где проверка голоса (voice_check.py) слышит не этого диктора, — в выбор не идут никогда
        pv = f"{ТУТ}/voice_{голос}.json"; self.чужой_голос = 0
        if os.path.exists(pv):
            гол = json.load(open(pv, encoding="utf-8"))
            for ri, r in enumerate(self.recs):
                x = гол.get(r["f"])
                if not x: continue
                чужой = (x["p_жен"] > 0.3 if голос == "m" else x["p_жен"] < 0.7) or x["откл"] > 2.5 \
                    or (голос == "m" and x["f0"] > 190)   # голос «съехал»: не тот тембр или не та высота для этого диктора
                if чужой: искл_ri.add(ri); self.чужой_голос += 1
        # голос по окнам внутри записи (voice_scan.py): Gemini переходит на чужой голос лишь на часть записи — оценка
        # записи целиком «размывается»; окно 1 с с явным женским голосом (p > 0,7 и высота окна ≥ 140 Гц) — вне выбора
        ps = f"{ТУТ}/voice_scan_{голос}.json"
        if голос == "m" and os.path.exists(ps):
            ск = json.load(open(ps, encoding="utf-8"))
            for ri, r in enumerate(self.recs):
                x = ск.get(r["f"])
                if x and ((x[1] > 0.7 and x[2] >= 140) or (x[0] or 0) > 0.3) and ri not in искл_ri:
                    искл_ri.add(ri); self.чужой_голос += 1
        self.исключено = len(искл_ri)
        # запись без файла (убрана из описи игры) — тоже вне выбора
        for ri, r in enumerate(self.recs):
            f = r["f"]; pth = f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else self.D + '/' + f}.flac"
            if ri not in искл_ri and not os.path.exists(pth): искл_ri.add(ri)
        self.искл_ri = искл_ri
        self.occ = []  # (rec, j)
        self.по_слову = {}
        for ri, r in enumerate(self.recs):
            for j, w in enumerate(r["w"]):
                if ri not in искл_ri: self.по_слову.setdefault(w[0], []).append(len(self.occ))
                self.occ.append((ri, j))
        self._признаки()
        p = f"{ТУТ}/occ_{голос}.npy"; pm = f"{ТУТ}/occ_{голос}_map.json"; self._слышно = None
        if os.path.exists(pm):   # карта по ключу «файл#слово» — не зависит от порядка записей в базе
            карта = json.load(open(pm, encoding="utf-8"))
            self.чистота = np.full(len(self.occ), -1.0, np.float32); self._слышно = [None] * len(self.occ)
            for o, (ri, j) in enumerate(self.occ):
                v = карта.get(f"{self.recs[ri]['f']}#{j}")
                if v: self.чистота[o] = v[0]; self._слышно[o] = v[1]
        else: self.чистота = np.load(p) if os.path.exists(p) else None
        if self.чистота is not None and len(self.чистота) < len(self.occ):   # новые записи (корпус) в конце — «не проверено»
            self.чистота = np.concatenate([self.чистота, -np.ones(len(self.occ) - len(self.чистота), dtype=np.float32)])
        if self.чистота is not None and len(self.чистота) != len(self.occ): self.чистота = None
        # края вхождения по отдельному распознаванию: лишнее/потерянное в начале (край_л) и в конце (край_п)
        n = len(self.occ); self.край_л = np.zeros(n, np.float32); self.край_п = np.zeros(n, np.float32)
        p = f"{ТУТ}/occ_{голос}_heard.json"
        if self._слышно is not None or os.path.exists(p):
            hs = self._слышно if self._слышно is not None else json.load(open(p, encoding="utf-8"))
            for o, h in enumerate(hs[:n]):
                if h is None: continue
                t = self.w(o)[0]
                if h == t: continue
                if t in h: i = h.find(t); self.край_л[o] = float(i > 0); self.край_п[o] = float(len(h) - i - len(t) > 0)
                else: self.край_л[o] = float(h[:1] != t[:1]); self.край_п[o] = float(h[-1:] != t[-1:])
        self.ll = np.array([float(self.recs[ri].get("ll", 0.0)) for ri, _ in self.occ], np.float32)
        pe = f"{ТУТ}/edges_{голос}.json"
        self.правки = json.load(open(pe, encoding="utf-8")) if os.path.exists(pe) else {}
        кз = Синтезатор._класс_звука
        self.кл_н = ["п"] * n; self.кл_к = ["п"] * n
        for o, (ri, j) in enumerate(self.occ):
            r = self.recs[ri]
            if "ph" in r and r["ph"][j]: self.кл_н[o] = кз(r["ph"][j][0][0]); self.кл_к[o] = кз(r["ph"][j][-1][0])
        self._мелодия()
        self.медиана = {}
        for w, os_ in self.по_слову.items():
            d = [self.dur[o] for o in os_]; self.медиана[w] = float(np.median(d))

    def _признаки(self):
        p = f"{ТУТ}/feat_{self.г}.npz"
        if os.path.exists(p):
            z = np.load(p)
            if len(z["dur"]) == len(self.occ) and "f0m" in z.files:
                for k in z.files: setattr(self, k, z[k])
                return
        n = len(self.occ); f0s = np.zeros(n); f0e = np.zeros(n); ens = np.zeros(n); ene = np.zeros(n)
        mfs = np.zeros((n, 13)); mfe = np.zeros((n, 13)); dur = np.zeros(n); f0m = np.zeros(n)
        L = int(SR * 0.04); M = int(SR * 0.025)
        for o, (ri, j) in enumerate(self.occ):
            if j == 0: a = self.звук(ri)
            w = self.recs[ri]["w"][j]; s, e = int(w[1] * SR), int(w[2] * SR)
            seg = a[s:e]; dur[o] = (e - s) / SR
            head = seg[int(SR * 0.005):int(SR * 0.005) + L]; tail = seg[max(0, len(seg) - L - int(SR * 0.005)):len(seg) - int(SR * 0.005)]
            f0s[o] = _yin_f0(head) if len(head) == L else 0; f0e[o] = _yin_f0(tail) if len(tail) == L else 0
            ens[o] = _db(seg[:M]) if len(seg) >= M else -60; ene[o] = _db(seg[-M:]) if len(seg) >= M else -60
            mfs[o] = _mfcc(seg[:M]); mfe[o] = _mfcc(seg[-M:])
            вз = [_yin_f0(seg[q:q + L]) for q in (len(seg) // 4, len(seg) // 2, 3 * len(seg) // 4) if q + L <= len(seg)]
            вз = [v for v in вз if v > 0]; f0m[o] = float(np.median(вз)) if вз else 0.0
        for k, v in dict(f0s=f0s, f0e=f0e, ens=ens, ene=ene, mfs=mfs, mfe=mfe, dur=dur, f0m=f0m).items(): setattr(self, k, v)
        np.savez(p, f0s=f0s, f0e=f0e, ens=ens, ene=ene, mfs=mfs, mfe=mfe, dur=dur, f0m=f0m)

    def _мелодия(self):
        """Средний ход высоты (полутона от медианы голоса) по месту слова в отрезке (5 долей) и знаку конца отрезка."""
        f = self.f0m[self.f0m > 0]; self.f0_мед = float(np.median(f)) if len(f) else 120.0
        сумма = {}; o = 0
        for r in self.recs:
            pz = r.get("pz"); ws = r["w"]
            # отрезки записи по знакам (без знаков — вся запись один отрезок с точкой)
            границы = [j for j in range(len(ws)) if pz and pz[j]] if pz else []
            if not границы or границы[-1] != len(ws) - 1: границы.append(len(ws) - 1)
            нач = 0
            for гр in границы:
                конец = (pz[гр] if pz and pz[гр] else ".")
                кл = "?" if конец == "?" else "," if конец in ",;—" else ":" if конец == ":" else "."
                n = гр - нач + 1
                for j in range(нач, гр + 1):
                    v = self.f0m[o + j]
                    if v > 0:
                        доля = 0 if n == 1 else min(4, int(5 * (j - нач) / n)) if j < гр else 4
                        k = (кл, доля); сумма.setdefault(k, []).append(12 * math.log2(v / self.f0_мед))
                нач = гр + 1
            o += len(ws)
        self.мелодия = {k: float(np.median(v)) for k, v in сумма.items() if len(v) >= 20}

    def высота_пт(self, o):
        v = self.f0m[o]; return None if v <= 0 else 12 * math.log2(v / self.f0_мед)

    @functools.lru_cache(maxsize=4096)
    def звук(self, ri):
        f = self.recs[ri]['f']
        pth = f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else self.D + '/' + f}.flac"
        if not os.path.exists(pth): return np.zeros(SR, np.float32)   # убрана из описи — в выборе не участвует
        a, sr = sf.read(pth, dtype="float32")
        return a

    # ── свойства вхождения ──
    def w(self, o): ri, j = self.occ[o]; return self.recs[ri]["w"][j]
    def конец_фразы(self, o):
        ri, j = self.occ[o]; w = self.recs[ri]["w"][j]; return j == len(self.recs[ri]["w"]) - 1 or w[4] > 0.15
    def начало_фразы(self, o):
        ri, j = self.occ[o]; w = self.recs[ri]["w"][j]; return j == 0 or w[3] > 0.15
    def знак(self, o):
        ri, j = self.occ[o]; pz = self.recs[ri].get("pz"); return None if pz is None else pz[j]
    def сосед(self, o, d):
        ri, j = self.occ[o]; ws = self.recs[ri]["w"]; k = j + d
        return ws[k][0] if 0 <= k < len(ws) else None


# ───────────────────────── 3. ВЫБОР ─────────────────────────
_ТОЧКА, _ЗАПЯТАЯ = set(".!…"), set(",;—")


def _цена_знака(цель, ист):
    """Насколько интонация слова-источника (знак после него) подходит к месту в цели."""
    if цель == ист: return 0.0
    if цель in _ТОЧКА: return 0.3 if ист in _ТОЧКА else 2.0 if ист == "?" else 0.9 if ист in _ЗАПЯТАЯ or ист == ":" else 2.5
    if цель == "?": return 1.5 if ист in _ТОЧКА else 2.0
    if цель in _ЗАПЯТАЯ: return 0.2 if ист in _ЗАПЯТАЯ else 0.4 if ист == ":" else 0.8 if ист in _ТОЧКА else 1.0 if ист == "" else 1.5
    if цель == ":": return 0.5 if ист in _ЗАПЯТАЯ else 0.8 if ист in _ТОЧКА else 1.0
    return 1.0  # середина без паузы, а у источника после слова знак — интонация конца

class Синтезатор:
    def __init__(self, голос, веса=None):
        self.V = Голос(голос)
        self.в = dict(конец=3.0, середина_конец=1.2, начало=0.8, середина_начало=0.6, сосед=0.35, звук=0.3,
                      длина=1.0, стык=1.0, знак=1.2, чистота=3.0, сгладить=2, мелодия=0.15, пауза_стык=0, края=3, запас_нач=0.005, запас_кон=0.025, звуки_цель=0.6, дифоны=1, гладкий_стык=0, плавный_стык=10, шов_уч=0.5, громкость_шов=1, ровный_темп=0, темп_звонких=1, поток=1, стык_продлить=0, цепь_коротких=0, шов_нн=0, темп_psola=0, быстрые=0, темп_звуки=0, д_край=0.9, д_сосед=0.3, д_класс=0.2, д_смычка=0.1, д_плохие=0.3, д_длина=0.0, п_чистота=5.0, п_край=1.5, п_шов=0.5, п_K=16, п_межслов=1, п_сосед=0.3, п_класс=0.2, мелодия_фразы=0, тембр_шов=1.5, тембр_без_громкости=-1, шов_громкость_мягко=0.5, стык_периоды=2, высота_надёжно=2, высота_порог_дб=25, скрип=2.0, скрип_мягко=1, излом=0.5, высота_краёв_новая=1, высота_краёв_как_есть=1, скрип_конец=0.6, сгладить_предел=2.0, цепь_бонус=0, соседний_звук=0.6, ровная_громкость=0.3, кф_корр=1, октава_точно=1, качество_ист=1, ровная_громкость_предел=6, ровный_тембр=0, тишина_по_звукам=1, тишина_несмычн=0.003, гасить_взрыв=16, лексикон=1, встык=1, сжать_тишину=1, тишина_нач=0.06, тишина_кон=0.03, короткие=1.0, умный_темп=0, учёный=2, плохие_в_части=0, по_звукам=1, f0_слух=0.35, пауза_внутри=0.5, f0=0.12, громк=0.08, спектр=0.02, K=60, часть=4.0)
        if веса: self.в.update(веса)
        self.скачки = []; self.скачки_уровня = []; self.скачки_темпа = []; self.скачки_громкости = []; self.скачки_яркости = []
        pj = f"{ТУТ}/join_{голос}.json"; self.шов = None
        if os.path.exists(pj):
            j_ = json.load(open(pj, encoding="utf-8"))
            self.шов = {k: (np.array(v["mu"]), np.array(v["sd"])) for k, v in j_["пары"].items()}; self.шов_мед = j_["медиана_живых"]
        pn = f"{ТУТ}/joinnn_{голос}.npz"; self.нн = None
        if os.path.exists(pn) and self.в.get("шов_нн"): self._загрузить_нн(pn)
        if self.в.get("высота_краёв_новая") and os.path.exists(f"{ТУТ}/edgef0_{голос}.json"):
            # высота краёв по ближайшей к краю гласной (edgef0.py) вместо 40 мс у самого края (там обычно согласный)
            d = json.load(open(f"{ТУТ}/edgef0_{голос}.json", encoding="utf-8")); V_ = self.V
            f0s = V_.f0s.copy(); f0e = V_.f0e.copy()
            for oo, (ri, j) in enumerate(V_.occ):
                v = d.get(f"{V_.recs[ri]['f']}#{j}")
                if v:
                    if self.в.get("высота_краёв_как_есть") and len(v) >= 5: f0s[oo] = v[3]; f0e[oo] = v[4]
                    else: f0s[oo] = v[0]; f0e[oo] = v[1]
            V_.f0s2, V_.f0e2 = f0s, f0e   # только для ручной платы за скачок высоты (прочие цены учились на прежних)
        p = self.в.get("уч_файл") or f"{ТУТ}/learned_{голос}.json"
        self.уч = json.load(open(p, encoding="utf-8"))["w"] if os.path.exists(p) else None
        if self.уч:   # признаки, которые не могут «помогать» (иначе движок нарочно выберет грубый стык), — не ниже нуля
            for k in ("f0_л", "f0_п", "громк_л", "громк_п", "спектр_л", "спектр_п", "мелодия_откл", "класс_л", "класс_п",
                      "знак_несовп", "длина_откл", "середина_как_конец", "чистота", "непроверено", "звуки_несовп", "край_л", "край_п", "разм_плохо", "соседний_звук"):
                if k in self.уч: self.уч[k] = max(0.0, self.уч[k])

    def _произношение(self, слова):
        """Звуки слов отрезка с уподоблением на стыках (fon.фраза) — кэш по словам отрезка."""
        к = tuple(слова)
        if getattr(self, "_пр_ключ", None) != к:
            import fon
            try: self._пр = [[{"э": "и", "о": "а"}.get(z, z) for z, _ in x] for x in fon.фраза(list(слова))]
            except Exception: self._пр = None
            self._пр_ключ = к
        return self._пр

    def _цена_звуков(self, o, слова, i):
        """Звуки вхождения (по разметке) против нужного произношения: оглушение/озвончение на стыке («без дела» [з],
        «без тебя» [с]; «в» [в]/[ф]), ударение (качество гласных). Края слова — дороже, середина — дешевле."""
        if not self.в.get("звуки_цель"): return 0.0
        ri, j = self.V.occ[o]; r = self.V.recs[ri]
        if "ph" not in r: return 0.0
        пр = self._произношение(слова)
        if not пр or i >= len(пр): return 0.0
        нужно = пр[i]; есть = [z[0] for z in r["ph"][j]]
        if len(нужно) != len(есть): return self.в["звуки_цель"] * 0.5
        c = 0.0
        for k, (a, b) in enumerate(zip(нужно, есть)):
            if a != b: c += 1.0 if k in (0, len(нужно) - 1) else 0.5
        return self.в["звуки_цель"] * c

    def _темп_по_звукам(self, y, k):
        """Переменный темп: паузы сжимаются сильнее всего, тянущиеся гласные — сильнее среднего, согласные и переходы —
        слабее (их и так мало, а они несут разборчивость). Общая длина — ровно len/k. → темп на каждый отсчёт."""
        import psola
        hop = 240; n = max(1, len(y) // hop)
        e = np.array([_db(y[i * hop:(i + 1) * hop]) for i in range(n)])
        f0, _ = psola._f0_дорожка(y, hop=hop); f0 = f0[:n] if len(f0) >= n else np.r_[f0, np.zeros(n - len(f0))]
        M = np.array([_mfcc(y[i * hop:i * hop + 2 * hop])[1:] for i in range(n)])
        поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]; поток = np.convolve(поток, np.ones(3) / 3, "same")
        порог = np.percentile(поток, 60)
        в = self.в.get("темп_веса", (2.2, 1.3, 0.75))
        w = np.where(e < e.max() - 40, в[0], np.where((f0 > 0) & (поток < порог), в[1], в[2]))
        a = float(np.sum(1.0 / w)) * k / n          # сумма 1/(a·w) = n/k
        кк = np.repeat(a * w, hop)
        return np.r_[кк, np.full(max(0, len(y) - len(кк)), кк[-1] if len(кк) else k)][:len(y)]

    def _цена_темпа(self, o):
        """На быстрой речи — вхождения, которые диктор сам сказал быстрее обычного (естественная быстрая речь
        разборчивее искусственно сжатой); медленные — дороже."""
        k = getattr(self, "_скорость", 1.0)
        if k <= 1.05 or not self.в.get("быстрые"): return 0.0
        V = self.V; м = V.медиана.get(V.w(o)[0]) or V.dur[o]
        return self.в["быстрые"] * min(1.0, k - 1.0) * math.log(max(1e-3, V.dur[o]) / max(1e-3, м))

    def _цена_соседних_звуков(self, o, слова, i):
        """Звук соседнего слова в источнике против звука соседа в цели: последний звук левого соседа и первый звук правого
        (по разметке и произношению фразы). Совпал — переход в слово и из слова звучит как надо."""
        w = self.в.get("соседний_звук")
        if not w: return 0.0
        V = self.V; ri, j = V.occ[o]; r = V.recs[ri]
        if "ph" not in r: return 0.0
        пр = self._произношение(слова)
        if not пр: return 0.0
        c = 0.0; кл = self._класс_звука
        for d in (-1, 1):
            k = i + d; js = j + d
            if not (0 <= k < len(слова)): continue
            if not (0 <= js < len(r["w"])) or (d < 0 and r["w"][j][3] > 0.05) or (d > 0 and r["w"][j][4] > 0.05):
                c += 0.5; continue   # в источнике там пауза или край фразы — переход другой
            ц = пр[k][-1] if d < 0 else пр[k][0]; и = r["ph"][js][-1][0] if d < 0 else r["ph"][js][0][0]
            и = {"э": "и", "о": "а"}.get(и, и)
            c += 0.0 if ц == и else (0.4 if кл(ц) == кл(и) else 1.0)
        return w * c

    def _звон_край(self, o, слова, i):
        """Шов внутри звонкого участка цели (свой краевой звук и звук соседа — гласный/сонорный), а в источнике у этого
        края была пауза или глухой звук: кусок несёт затухание или начало голоса — на шве голос «рассыпается»."""
        V = self.V; ri, j = V.occ[o]; r = V.recs[ri]
        if "ph" not in r: return 0.0
        пр = self._произношение(слова)
        if not пр: return 0.0
        кл = self._класс_звука; c = 0.0; ЗВ = ("г", "с")
        for d in (-1, 1):
            k = i + d
            if not (0 <= k < len(слова)): continue
            свой = пр[i][0] if d < 0 else пр[i][-1]; сосед = пр[k][-1] if d < 0 else пр[k][0]
            if кл(свой) not in ЗВ or кл(сосед) not in ЗВ: continue
            js = j + d
            if not (0 <= js < len(r["w"])) or (d < 0 and r["w"][j][3] > 0.03) or (d > 0 and r["w"][j][4] > 0.03): c += 1.0; continue
            и = r["ph"][js][-1][0] if d < 0 else r["ph"][js][0][0]
            if кл(и) not in ("г", "с", "з"): c += 1.0
        return c

    def _пауза_край(self, o, слова, i):
        """Шов внутри отрезка цели (паузы нет), а в источнике у этого края была пауза дольше 0,1 с: кусок несёт
        затухание (или начало) голоса — у шва провал громкости и «рассыпание» голоса."""
        V = self.V; ri, j = V.occ[o]; w = V.recs[ri]["w"]; c = 0.0
        if i > 0 and (j == 0 or w[j][3] > 0.1): c += 1.0
        if i < len(слова) - 1 and (j == len(w) - 1 or w[j][4] > 0.1): c += 1.0
        return c

    def _скрип(self, o):
        """Хрип (скрипучий голос) во вхождении: доля громких кадров гласных без определимой высоты (creak_<голос>.json)."""
        if not hasattr(self, "_скр"):
            p = f"{ТУТ}/creak_{self.V.г}.json"; self._скр = None
            if os.path.exists(p):
                d = json.load(open(p, encoding="utf-8")); self._скр = np.zeros(len(self.V.occ), np.float32)
                for oo, (ri, j) in enumerate(self.V.occ):
                    self._скр[oo] = d.get(f"{self.V.recs[ri]['f']}#{j}", 0.0)
        return 0.0 if self._скр is None else float(self._скр[o])

    def _излом(self, o):
        """Срывы голоса во вхождении (скачки высоты > 5 пт между соседними громкими кадрами, pbreak_<голос>.json)."""
        if not hasattr(self, "_изл"):
            p = f"{ТУТ}/pbreak_{self.V.г}.json"; self._изл = None
            if os.path.exists(p):
                d = json.load(open(p, encoding="utf-8")); self._изл = np.zeros(len(self.V.occ), np.float32)
                for oo, (ri, j) in enumerate(self.V.occ):
                    self._изл[oo] = d.get(f"{self.V.recs[ri]['f']}#{j}", 0)
        return 0.0 if self._изл is None else float(min(2.0, self._изл[o]))

    def _качество_ист(self, o):
        """Штраф за звучание записи-источника (rq_<голос>.json, DNSMOS SIG): ниже медианы — дороже."""
        if not hasattr(self, "_кач"):
            p = f"{ТУТ}/rq_{self.V.г}.json"; self._кач = None
            if os.path.exists(p):
                rq = json.load(open(p, encoding="utf-8")); sig = np.full(len(self.V.recs), np.nan)
                for ri, r in enumerate(self.V.recs):
                    v = rq.get(r["f"])
                    if v: sig[ri] = v[0]
                self._кач_мед = float(np.nanmedian(sig)); self._кач = np.where(np.isnan(sig), self._кач_мед, sig)
        if self._кач is None: return 0.0
        return max(0.0, self._кач_мед - float(self._кач[self.V.occ[o][0]]))

    def цена_единицы(self, o, слова, i, end):
        c = self._цена_единицы(o, слова, i, end) + self._цена_темпа(o)
        if self.в.get("качество_ист"): c += self.в["качество_ист"] * self._качество_ист(o)
        if self.в.get("звон_край"): c += self.в["звон_край"] * self._звон_край(o, слова, i)
        if self.в.get("пауза_край"): c += self.в["пауза_край"] * self._пауза_край(o, слова, i)
        if self.в.get("излом"): c += self.в["излом"] * self._излом(o)
        if self.в.get("скрип"):
            if self.в.get("скрип_мягко") == 2:   # только сильный хрип, в любом месте (в конце фразы его тоже слышно)
                c += self.в["скрип"] * max(0.0, self._скрип(o) - 0.35)
            elif self.в.get("скрип_мягко"):   # сильный хрип не в конце отрезка; в конце — только очень сильный
                if i < len(слова) - 1: c += self.в["скрип"] * max(0.0, self._скрип(o) - 0.35)
                elif self.в.get("скрип_конец"): c += self.в["скрип"] * max(0.0, self._скрип(o) - float(self.в["скрип_конец"]))
            else: c += self.в["скрип"] * self._скрип(o)
        if not (self.в.get("учёный") and self.уч and "соседний_звук" in self.уч): c += self._цена_соседних_звуков(o, слова, i)
        return c

    def _цена_единицы(self, o, слова, i, end):
        if self.в.get("учёный") and self.уч:
            c = self._уч_единица(o, слова, i, end)
            if self.в["учёный"] == 2: c += self._естественность(o, слова, i, end)
            if "звуки_несовп" in self.уч:   # выученная плата за звуки — вместо ручной
                в0 = self.в.get("звуки_цель", 0); self.в["звуки_цель"] = 1.0
                c += self.уч["звуки_несовп"] * min(3.0, self._цена_звуков(o, слова, i)) / 3; self.в["звуки_цель"] = в0
                return c
            return c + self._цена_звуков(o, слова, i)
        V, в = self.V, self.в; n = len(слова); c = 0.0
        последнее, первое = i == n - 1, i == 0
        зн = V.знак(o); цель_зн = end if последнее else ""
        if зн is not None:
            c += _цена_знака(цель_зн, зн) * в["знак"]
        elif последнее: c += 0 if V.конец_фразы(o) else (в["конец"] if end in КОНЕЦ_ФРАЗЫ else в["конец"] * 0.5)
        elif V.конец_фразы(o): c += в["середина_конец"]
        if первое: c += 0 if V.начало_фразы(o) else в["начало"]
        elif V.начало_фразы(o) and V.w(o)[3] > 0.15: c += в["середина_начало"]
        # соседи: тот же сосед — плюс; иначе звук на стыке того же класса
        кор = в["короткие"] if len(слова[i]) <= 2 else 1.0   # «до», «у», «в»: свои соседи (1 — как у прочих слов)
        for d, idx in ((-1, i - 1), (1, i + 1)):
            цель = слова[idx] if 0 <= idx < n else None; ист = V.сосед(o, d)
            if цель is not None and ист == цель: c -= в["сосед"] * кор
            elif кор > 1.01 and цель and ист and (цель[-1] if d < 0 else цель[0]) == (ист[-1] if d < 0 else ист[0]): c -= в["сосед"]
            else:
                кц = класс(цель[-1] if d < 0 and цель else (цель[0] if цель else ""))
                ки = класс(ист[-1] if d < 0 and ист else (ист[0] if ист else ""))
                if кц != ки: c += в["звук"] * кор
        if V.чистота is not None:
            ч = float(V.чистота[o]); c += в["чистота"] * (0.3 if ч < 0 else ч)   # −1 — не проверено
        h = V.высота_пт(o)
        if h is not None:
            кл = "?" if end == "?" else "," if end in ",;—" else ":" if end == ":" else "."
            доля = 4 if последнее else (0 if n == 1 else min(4, int(5 * i / n)))
            цель_h = V.мелодия.get((кл, доля))
            if цель_h is not None: c += в["мелодия"] * min(6.0, abs(h - цель_h))
        м = V.медиана.get(V.w(o)[0]) or V.dur[o]
        if abs(math.log(max(1e-3, V.dur[o]) / max(1e-3, м))) > 0.35: c += в["длина"]
        return c

    def _естественность(self, o, слова, i, end):
        """Ручные составляющие, которых распознаватель не слышит: интонация знака, мелодия места, лишние паузы."""
        V, в = self.V, self.в; n = len(слова); c = 0.0
        ww = V.w(o)
        if i < n - 1 and ww[4] >= 0.05: c += в["пауза_внутри"]       # в источнике после слова пауза, в цели — нет
        if i > 0 and ww[3] >= 0.05: c += в["пауза_внутри"]           # в источнике перед словом пауза, в цели — нет
        зн = V.знак(o)
        if зн is not None: c += _цена_знака(end if i == n - 1 else "", зн) * в["знак"] * 0.5
        h = V.высота_пт(o)
        if h is not None:
            кл = "?" if end == "?" else "," if end in ",;—" else ":" if end == ":" else "."
            доля = 4 if i == n - 1 else (0 if n == 1 else min(4, int(5 * i / n))); цh = V.мелодия.get((кл, доля))
            if цh is not None: c += в["мелодия"] * min(6.0, abs(h - цh)) * 0.5
        return c

    def _уч_единица(self, o, слова, i, end):
        """Цена единицы из выученных весов: лог-шансы того, что слово не узнают (только признаки самой единицы)."""
        V, W = self.V, self.уч; n = len(слова); w = слова[i]; c = 0.0
        ч = float(V.чистота[o]) if V.чистота is not None else 0.3
        c += W["чистота"] * max(0.0, ч) + W["непроверено"] * float(ч < 0)
        for d, idx, ключ, кл in ((-1, i - 1, "сосед_л", "класс_л"), (1, i + 1, "сосед_п", "класс_п")):
            цель = слова[idx] if 0 <= idx < n else None; ист = V.сосед(o, d)
            if цель is not None and ист == цель: c += W[ключ]
            кц = класс(цель[-1] if d < 0 and цель else (цель[0] if цель else "")); ки = класс(ист[-1] if d < 0 and ист else (ист[0] if ист else ""))
            if кц != ки: c += W[кл]
        зн = V.знак(o); цзн = end if i == n - 1 else ""
        if зн is not None and зн != цзн: c += W["знак_несовп"]
        if i < n - 1 and V.конец_фразы(o): c += W["конец_как_середина"]
        if i == n - 1 and not V.конец_фразы(o): c += W["середина_как_конец"]
        if i > 0 and V.начало_фразы(o) and V.w(o)[3] > 0.15: c += W["начало_пауза"]
        м = V.медиана.get(w) or V.dur[o]; c += W["длина_откл"] * abs(math.log(max(1e-3, V.dur[o]) / max(1e-3, м)))
        if "соседний_звук" in W:   # выученная плата за несовпадение соседних звуков — вместо ручной
            в0 = self.в.get("соседний_звук", 0); self.в["соседний_звук"] = 1.0
            c += W["соседний_звук"] * self._цена_соседних_звуков(o, слова, i) / 2; self.в["соседний_звук"] = в0
        if "край_л" in W:
            цепь_л = i > 0 and V.сосед(o, -1) == слова[i - 1]; цепь_п = i < n - 1 and V.сосед(o, 1) == слова[i + 1]
            c += W["край_л"] * float(V.край_л[o]) * (0.3 if цепь_л else 1.0) + W["край_п"] * float(V.край_п[o]) * (0.3 if цепь_п else 1.0)
            c += W.get("разм_плохо", 0.0) * float(V.ll[o] < -48.0)
        h = V.высота_пт(o)
        if h is not None:
            кл = "?" if end == "?" else "," if end in ",;—" else ":" if end == ":" else "."
            доля = 4 if i == n - 1 else (0 if n == 1 else min(4, int(5 * i / n))); цh = V.мелодия.get((кл, доля))
            if цh is not None: c += W["мелодия_откл"] * min(6.0, abs(h - цh)) / 6
        return c

    def _уч_стык(self, o1, o2):
        V, W = self.V, self.уч
        r1, j1 = V.occ[o1]; r2, j2 = V.occ[o2]
        if r1 == r2 and j2 == j1 + 1: return W["подряд_л"] + W["подряд_п"]
        c = 0.0; a, b = V.f0e[o1], V.f0s[o2]
        if a > 0 and b > 0: c += (W["f0_л"] + W["f0_п"]) * min(12.0, abs(12 * math.log2(a / b))) / 12
        c += (W["громк_л"] + W["громк_п"]) * min(20.0, abs(V.ene[o1] - V.ens[o2])) / 20
        c += (W["спектр_л"] + W["спектр_п"]) * min(60.0, float(np.linalg.norm(V.mfe[o1] - V.mfs[o2]))) / 60
        return c

    def _загрузить_нн(self, pn):
        """Сеть стыка: первый слой — сумма вклада конца левого вхождения и начала правого (считается заранее для всех)."""
        z = np.load(pn); V = self.V; n = len(V.occ); ВИДЫ = "гсзкп"
        def стороны(конец):
            X = np.zeros((n, 21), np.float32)
            X[:, :13] = V.mfe if конец else V.mfs; X[:, 13] = V.ene if конец else V.ens
            f = V.f0e if конец else V.f0s; X[:, 14] = np.where(f > 0, np.log(np.maximum(f, 1e-3)), 0.0); X[:, 15] = (f > 0)
            кл = V.кл_к if конец else V.кл_н
            for o in range(n): X[o, 16 + ВИДЫ.index(кл[o] if кл[o] in ВИДЫ else "п")] = 1.0
            return X
        mu, sd, W1 = z["mu"], z["sd"], z["W1"]
        A = (стороны(True) - mu[:21]) / sd[:21]; B = (стороны(False) - mu[21:]) / sd[21:]
        self.нн = {"Pa": (A @ W1[:21]).astype(np.float32), "Pb": (B @ W1[21:] + z["b1"]).astype(np.float32),
                   "W2": z["W2"], "b2": z["b2"], "W3": z["W3"][:, 0], "b3": float(z["b3"][0]), "мед": float(z["мед"])}

    def _шов_нн_мат(self, левые, правые):
        """Матрица цены стыка сети для всех пар (левое вхождение, правое): лог-шансы «склейка» сверх обычного у живых."""
        N = self.нн; a = N["Pa"][левые]; b = N["Pb"][правые]
        h1 = np.maximum(a[:, None, :] + b[None, :, :], 0)
        h2 = np.maximum(h1 @ N["W2"] + N["b2"], 0)
        z = h2 @ N["W3"] + N["b3"]
        return np.maximum(0.0, z - N["мед"])

    def _шов_живой(self, o1, o2):
        """Насколько перепад спектра, громкости и высоты на стыке не похож на живой переход у диктора (по паре видов звука)."""
        V = self.V; m = self.шов.get(V.кл_к[o1] + V.кл_н[o2]) if self.шов else None
        if m is None: return 0.0
        mu, sd = m
        d = np.empty(14); d[:12] = V.mfs[o2][1:] - V.mfe[o1][1:]; d[12] = V.ens[o2] - V.ene[o1]
        a, b = V.f0e[o1], V.f0s[o2]
        if a > 0 and b > 0:
            d[13] = 12 * math.log2(b / a); z = (d - mu) / sd
        else: z = (d[:13] - mu[:13]) / sd[:13]
        return max(0.0, float(np.mean(z * z)) - self.шов_мед)

    def цена_стыка(self, o1, o2):
        if self.в.get("учёный") and self.уч:
            c = self._уч_стык(o1, o2)
            r1, j1 = self.V.occ[o1]; r2, j2 = self.V.occ[o2]
            if self.в.get("шов_уч") and not (r1 == r2 and j2 == j1 + 1): c += self.в["шов_уч"] * self._шов_живой(o1, o2)
            if self.в.get("цепь_бонус") and r1 == r2 and j2 == j1 + 1: c -= self.в["цепь_бонус"]
            if self.в.get("цепь_коротких") and r1 == r2 and j2 == j1 + 1 and min(len(self.V.w(o1)[0]), len(self.V.w(o2)[0])) <= 2:
                c -= self.в["цепь_коротких"]   # «в лесу», «и вот»: служебное слово — вместе с соседом из той же записи
            if self.в["учёный"] == 2:   # скачок высоты слышит человек, а не распознаватель — ручная плата
                r1, j1 = self.V.occ[o1]; r2, j2 = self.V.occ[o2]
                if not (r1 == r2 and j2 == j1 + 1):
                    if hasattr(self.V, "f0e2"): a, b = self.V.f0e2[o1], self.V.f0s2[o2]
                    else: a, b = self.V.f0e[o1], self.V.f0s[o2]
                    if a > 0 and b > 0:
                        дв = min(12.0, abs(12 * math.log2(a / b))); c += self.в["f0_слух"] * дв
                        c += self.в.get("f0_хвост", 0.0) * max(0.0, дв - 4.0)   # большие скачки — сильно дороже
            return c
        V, в = self.V, self.в
        r1, j1 = V.occ[o1]; r2, j2 = V.occ[o2]
        if r1 == r2 and j2 == j1 + 1: return 0.0
        c = в["стык"]
        a, b = V.f0e[o1], V.f0s[o2]
        if a > 0 and b > 0: c += в["f0"] * min(12.0, abs(12 * math.log2(a / b)))
        c += в["громк"] * min(20.0, abs(V.ene[o1] - V.ens[o2]))
        c += в["спектр"] * float(np.linalg.norm(V.mfe[o1] - V.mfs[o2]))
        return c

    def кандидаты(self, слова, end):
        V, K = self.V, self.в["K"]; out = []
        for i, w in enumerate(слова):
            os_ = V.по_слову.get(w, [])
            # все вхождения испорчены (проверены и плохо узнаются) — слово лучше собрать из частей других слов
            if os_ and V.чистота is not None and self.в["плохие_в_части"]:
                чс = [float(V.чистота[o]) for o in os_]
                if all(c >= self.в["плохие_в_части"] for c in чс): os_ = []
            if not os_: out.append(None); continue
            # вхождения, продолжающие цепочку с соседом, — всегда в списке
            цепь = [o for o in os_ if (i > 0 and V.сосед(o, -1) == слова[i - 1]) or (i + 1 < len(слова) and V.сосед(o, 1) == слова[i + 1])]
            прочие = sorted((o for o in os_), key=lambda o: self.цена_единицы(o, слова, i, end))[:K]
            out.append(list(dict.fromkeys(цепь[:K * 2] + прочие)))
        return out

    def витерби(self, слова, end):
        """→ список единиц по словам: ("o", вхождение) или ("часть", [(rec, s, e), ...]) для слов вне базы."""
        канд = self.кандидаты(слова, end)
        # слова вне базы — заранее собираются из частей и стоят отдельно (стык с ними — обычной ценой)
        res = [None] * len(слова)
        i = 0
        while i < len(слова):
            if канд[i] is None:
                res[i] = ("часть", self.из_частей(слова[i], слова[i - 1] if i else "", слова[i + 1] if i + 1 < len(слова) else "")); i += 1; continue
            j = i
            while j < len(слова) and канд[j] is not None: j += 1
            # Витерби на отрезке i..j-1
            best = [{o: (self.цена_единицы(o, слова, i, end), None) for o in канд[i]}]
            for k in range(i + 1, j):
                cur = {}
                пред = list(best[-1].keys())
                Mн = None
                if self.нн is not None:
                    Mн = self.в["шов_нн"] * self._шов_нн_мат(np.array(пред), np.array(канд[k]))
                    for a_, po in enumerate(пред):   # слова подряд из одной записи — живой стык, без платы
                        r1, j1 = self.V.occ[po]
                        for b_, o in enumerate(канд[k]):
                            if self.V.occ[o] == (r1, j1 + 1): Mн[a_, b_] = 0.0
                for b_, o in enumerate(канд[k]):
                    u = self.цена_единицы(o, слова, k, end)
                    if Mн is None:
                        p, v = min(((po, pv[0] + self.цена_стыка(po, o)) for po, pv in best[-1].items()), key=lambda x: x[1])
                    else:
                        p, v = min(((po, best[-1][po][0] + self.цена_стыка(po, o) + float(Mн[a_, b_])) for a_, po in enumerate(пред)), key=lambda x: x[1])
                    cur[o] = (v + u, p)
                best.append(cur)
            o = min(best[-1], key=lambda x: best[-1][x][0]); путь = [o]
            for k in range(len(best) - 1, 0, -1): o = best[k][o][1]; путь.append(o)
            путь.reverse()
            for k, o in enumerate(путь): res[i + k] = ("o", o)
            i = j
        return res

    def _лексикон(self):
        """Выученный словарь собранных слов (oov_lex.py): слово → части (файл записи, начало, конец, разрезы)."""
        if not hasattr(self, "_лекс"):
            p = f"{ТУТ}/oovlex_{self.V.г}.json"; self._лекс = {}
            if os.path.exists(p):
                по_файлу = {r["f"]: ri for ri, r in enumerate(self.V.recs)}
                for w, x in json.load(open(p, encoding="utf-8")).items():
                    части = []
                    for f, t0, t1, сн, ск in x["части"]:
                        ri = по_файлу.get(f)
                        if ri is None or ri in self.V.искл_ri: части = None; break
                        части.append((ri, t0, t1, сн, ск))
                    if части: self._лекс[w] = части
        return self._лекс

    def из_частей(self, слово, лев="", прав=""):
        if self.в.get("лексикон") and слово in self._лексикон() and not getattr(self, "_искл_слово", None):
            return list(self._лекс[слово])
        if self.в.get("поток"):
            п = self._из_потока(слово, лев, прав)
            if п: return п
        if self.в.get("дифоны"):
            д = self._из_дифонов(слово)
            if д: return д
        буквы = self._из_частей(слово, True) or self._из_частей(слово, False)
        if self.в["по_звукам"]:
            звуки = self._из_звуков(слово)
            # меньше частей — меньше стыков; при равенстве — буквенная сборка (проверена дольше)
            if звуки and (not буквы or len(звуки) < len(буквы)): return звуки
        return буквы or (self._из_звуков(слово) if self.в["по_звукам"] else [])

    @staticmethod
    def _класс_звука(k):
        if k.lower() in "аоуыэи": return "г"
        if k in "лмнрЛМНРj": return "с"
        if k.lower() in "бвгджз": return "з"
        if k.lower() in "пфктшсхцчщ": return "к"
        return "п"

    def _из_звуков(self, слово):
        """Слово вне базы — из частей других слов по совпадению ЗВУКОВ (произношение fon: редукция, мягкость,
        оглушение, -тся → [ца] ...). Разрез — между звуками разных букв, время — граница звуков по разметке."""
        import fon
        V = self.V
        if not hasattr(self, "_зв"):
            self._зв = {}
            чист = (lambda o: (0.3 if V.чистота[o] < 0 else float(V.чистота[o]))) if V.чистота is not None else (lambda o: 0.0)
            for u, os_ in V.по_слову.items():
                по_ключу = {}
                for o in os_:
                    ri, j = V.occ[o]; r = V.recs[ri]
                    if "ph" not in r: continue
                    ключ = "".join(z[0] for z in r["ph"][j])
                    if ключ: по_ключу.setdefault(ключ, []).append(o)
                for ключ, good in по_ключу.items():
                    good.sort(key=lambda o: (чист(o) > 0.34, V.конец_фразы(o) or V.начало_фразы(o), abs(V.dur[o] - V.медиана[u])))
                    if ключ not in self._зв or len(good) > len(self._зв[ключ][2]): self._зв[ключ] = (u, None, good[:6])
            self._зв_кэш = {}
        try: цель = [({"э": "и", "о": "а"}.get(z, z), b) for z, b in fon.слово(слово)]
        except Exception: return []
        P = "".join(k for k, _ in цель); n = len(P)
        if not n: return []
        кл = self._класс_звука
        def можно_резать_ц(k): return 0 < k < n and цель[k][1] != цель[k - 1][1]
        def можно_резать_и(ph, k): return 0 < k < len(ph) and ph[k][1] != ph[k - 1][1]
        best = [(0.0, [])] + [(1e9, None)] * n
        for j in range(1, n + 1):
            for i in range(max(0, j - 12), j):
                if best[i][1] is None or (i > 0 and not можно_резать_ц(i)): continue
                if j < n and not можно_резать_ц(j): continue
                sub = P[i:j]; L = j - i
                r = self._зв_кэш.get(sub)
                if r is None:
                    r = sorted((k for k in self._зв if sub in k), key=len)[:60]; self._зв_кэш[sub] = r
                лучшая = None
                for ключ in r:
                    u, _, os_ = self._зв[ключ]; ri0, j0 = V.occ[os_[0]]; ph = V.recs[ri0]["ph"][j0]; p0 = ключ.find(sub)
                    while p0 >= 0:
                        q = p0 + L
                        if (p0 == 0 or можно_резать_и(ph, p0)) and (q == len(ключ) or можно_резать_и(ph, q)):
                            c = 1.0 + (1.6 if L == 1 else 0.3 if L == 2 else 0.0)
                            if i == 0: c += 0 if p0 == 0 else 0.6
                            else:
                                if p0 == 0: c += 0.4
                                elif ключ[p0 - 1] == P[i - 1]: c -= 0.3
                                elif кл(ключ[p0 - 1]) != кл(P[i - 1]): c += 0.3
                                if кл(P[i]) == "к": c -= 0.2
                                elif кл(P[i]) == "г" and кл(P[i - 1]) == "г": c += 0.4
                            if j == n: c += 0 if q == len(ключ) else 0.6
                            else:
                                if q == len(ключ): c += 0.4
                                elif ключ[q] == P[j]: c -= 0.3
                                elif кл(ключ[q]) != кл(P[j]): c += 0.3
                            if лучшая is None or c < лучшая[0]: лучшая = (c, ключ, p0)
                        p0 = ключ.find(sub, p0 + 1)
                if лучшая and best[i][0] + лучшая[0] < best[j][0]:
                    best[j] = (best[i][0] + лучшая[0], best[i][1] + [(лучшая[1], лучшая[2], L)])
        if best[n][1] is None: return []
        части = []
        for (ключ, p0, L) in best[n][1]:
            u, _, os_ = self._зв[ключ]; o = os_[0]; ri, jj = V.occ[o]; ww = V.recs[ri]["w"][jj]; ph = V.recs[ri]["ph"][jj]
            t0 = ph[p0][2]; t1 = ph[p0 + L - 1][3]
            if p0 == 0 and jj > 0: t0 -= min(ww[3], self.в["запас_нач"])
            if p0 + L == len(ph) and jj < len(V.recs[ri]["w"]) - 1: t1 += min(ww[4], self.в["запас_кон"])
            if t1 - t0 > 0.02: части.append((ri, t0, t1))
        return части

    def _указатель(self):
        if not hasattr(self, "_пи"):
            p = f"{ТУТ}/phidx_{self.V.г}.npz"
            self._пи = None
            if os.path.exists(p):
                z = np.load(p); self._пи = {k: z[k] for k in z.files}; self._пи["поток"] = str(z["поток"][0])
                self._пи_кэш = {}
        return self._пи

    def _из_потока(self, слово, лев="", прав=""):
        """Незнакомое слово — дифонным отбором из всей речи диктора: куски — любые последовательности звуков подряд
        (и через границу слов, если между ними нет паузы), разрез — посередине общего звука; выбор Витерби по цене
        куска (совпадение соседних звуков, начало и конец слова — из начала и конца слова-источника) и цене стыка
        (спектр, высота и громкость в середине общего звука). → [(rec, t0, t1, середина_в_начале, середина_в_конце)]"""
        import fon
        И = self._указатель()
        if И is None: return []
        try:
            сл = [x for x in (лев, слово, прав) if x]; i = сл.index(слово) if лев == "" else 1
            тр = fon.фраза(сл)[i if лев else 0]
            цель = [({"э": "и", "о": "а"}.get(z, z), b) for z, b in тр]
        except Exception: return []
        P = "".join(k for k, _ in цель); n = len(P)
        if n < 2: return []
        Sx = И["поток"]; пром = И["пром"]; wi = И["wi"]; wf = И["wf"]; mf = И["mf"]; f0 = И["f0"]; en = И["en"]
        кл = self._класс_звука; кэш = self._пи_кэш

        искл = getattr(self, "_искл_слово", None); Ri = И["ri"]; Jj = И["j"]
        def вхождения(sub):
            r = кэш.get((sub, искл))
            if r is None:
                r = []; p = Sx.find(sub)
                while p >= 0 and len(r) < 400:
                    ok = len(sub) == 1 or float(пром[p:p + len(sub) - 1].max()) < 0.03
                    if ok and len(sub) > 1 and not self.в["п_межслов"]:   # куски только внутри одного слова-источника
                        ok = int(Jj[p]) == int(Jj[p + len(sub) - 1]) and int(Ri[p]) == int(Ri[p + len(sub) - 1])
                    if ok and self.V.искл_ri and (int(Ri[p]) in self.V.искл_ri or int(Ri[p + len(sub) - 1]) in self.V.искл_ri): ok = False
                    if ok and искл:   # спрятанное слово (обучение на знакомых словах) — его записи не брать
                        ok = all(self.V.recs[int(Ri[q])]["w"][int(Jj[q])][0] != искл for q in range(p, p + len(sub)))
                    if ok: r.append(p)
                    p = Sx.find(sub, p + 1)
                кэш[(sub, искл)] = r
            return r

        if not hasattr(self, "_вх_по_рj"):
            self._вх_по_рj = {(ri, j): o for o, (ri, j) in enumerate(self.V.occ)}
        чист = self.V.чистота
        def цена_куска(p, L, m1, m2, a, b):
            c = 1.0
            if чист is not None and self.в.get("п_чистота"):   # чистота слов-источников куска (по отдельному распознаванию)
                for q in {p, p + L - 1}:
                    o = self._вх_по_рj.get((int(Ri[q]), int(Jj[q])))
                    if o is not None: ч = float(чист[o]); c += self.в["п_чистота"] * (0.3 if ч < 0 else ч)
            if m1 < 0: c += 0.0 if wi[p] else self.в["п_край"]
            else:
                if a > 0 and p > 0:
                    c += -self.в["п_сосед"] if Sx[p - 1] == P[a - 1] else (self.в["п_класс"] if кл(Sx[p - 1]) != кл(P[a - 1]) else 0.0)
            q = p + L - 1
            if m2 >= n: c += 0.0 if wf[q] else self.в["п_край"]
            else:
                if b + 1 < n and q + 1 < len(Sx):
                    c += -self.в["п_сосед"] if Sx[q + 1] == P[b + 1] else (self.в["п_класс"] if кл(Sx[q + 1]) != кл(P[b + 1]) else 0.0)
            return c

        пш = self.в["п_шов"]
        def цена_стыка(q, p):
            c = 0.02 * float(np.linalg.norm(mf[q][1:] - mf[p][1:])) + 0.03 * abs(float(en[q] - en[p]))
            if f0[q] > 0 and f0[p] > 0: c += 0.1 * min(12.0, abs(12 * math.log2(f0[q] / f0[p])))
            return пш * c

        K = int(self.в["п_K"])
        # best[m] = {(p, L, первый_звук_части_в_потоке, последний): (цена, путь)}
        best = {-1: {None: (0.0, [])}}
        for m2 in list(range(0, n - 1)) + [n]:
            cur = {}
            for m1 in [-1] + list(range(0, n - 1)):
                if m1 not in best or m1 >= m2 or m2 - m1 > 14: continue
                a, b = max(m1, 0), min(m2, n - 1); L = b - a + 1
                if m1 >= 0 and m2 < n and L < 2: continue
                кандидаты = sorted(((цена_куска(p, L, m1, m2, a, b), p) for p in вхождения(P[a:b + 1])))[:K]
                for c_, p in кандидаты:
                    лучш = None
                    for ключ, (v, путь) in best[m1].items():
                        st = 0.0 if ключ is None else цена_стыка(ключ, p)   # ключ — индекс общего звука в прошлом куске
                        if лучш is None or v + st < лучш[0]: лучш = (v + st, путь)
                    q = p + L - 1   # последний звук куска (общий со следующим, если m2 < n)
                    val = лучш[0] + c_
                    if q not in cur or val < cur[q][0]: cur[q] = (val, лучш[1] + [(p, L, m1 >= 0, m2 < n)])
            if cur: best[m2] = dict(sorted(cur.items(), key=lambda kv: kv[1][0])[:K * 4])
        if n not in best: return []
        _, путь = min(best[n].values(), key=lambda x: x[0])
        части = []
        for (p, L, сер_н, сер_к) in путь:
            ri = int(И["ri"][p]); q = p + L - 1
            if сер_н: t0 = (float(И["t0"][p]) + float(И["t1"][p])) / 2 - 0.006
            else:
                t0 = float(И["t0"][p])
                if wi[p] and int(И["j"][p]) > 0: t0 -= min(self.V.recs[ri]["w"][int(И["j"][p])][3], self.в["запас_нач"])
            if сер_к: t1 = (float(И["t0"][q]) + float(И["t1"][q])) / 2 + 0.006
            else:
                t1 = float(И["t1"][q]); jq = int(И["j"][q])
                if wf[q] and jq < len(self.V.recs[ri]["w"]) - 1: t1 += min(self.V.recs[ri]["w"][jq][4], self.в["запас_кон"])
            if t1 - t0 > 0.015: части.append((ri, t0, t1, сер_н, сер_к))
        return части

    def _из_дифонов(self, слово):
        """Слово вне базы — из частей с разрезом ПОСЕРЕДИНЕ общего звука (как в дифонном синтезе): соседние части
        перекрываются на один звук, стык приходится на устойчивую середину звука, а не на переход между звуками
        (переход несёт следы чужого соседа). Начало и конец слова — по возможности из начала и конца слова-источника.
        → [(rec, t0, t1, середина_в_начале, середина_в_конце), ...]"""
        import fon
        V = self.V
        if not hasattr(self, "_зв"): self._из_звуков("а")   # построить указатель звуков
        try: цель = [({"э": "и", "о": "а"}.get(z, z), b) for z, b in fon.слово(слово)]
        except Exception: return []
        P = "".join(k for k, _ in цель); n = len(P)
        if n < 2: return []
        кл = self._класс_звука
        в = self.в; искл = getattr(self, "_искл_слово", None)
        def шов(z):   # насколько удобен звук для разреза посередине
            return -в["д_смычка"] if кл(z) == "к" else в["д_плохие"] if z in "jрР" else 0.0
        # позиции: −1 — начало слова; m (0..n−2) — середина звука m; n — конец слова
        best = {-1: (0.0, [])}
        for m2 in list(range(0, n - 1)) + [n]:
            лучш = None
            for m1 in [-1] + list(range(0, n - 1)):
                if m1 not in best or m1 >= m2: continue
                a, b = max(m1, 0), min(m2, n - 1)
                L = b - a + 1
                if m1 >= 0 and m2 < n and L < 2: continue
                if m2 - m1 > 14: continue
                sub = P[a:b + 1]
                r = self._зв_кэш.get(sub)
                if r is None:
                    r = sorted((k for k in self._зв if sub in k), key=len)[:60]; self._зв_кэш[sub] = r
                for ключ in r:
                    if искл and self._зв[ключ][0] == искл: continue
                    p0 = ключ.find(sub)
                    while p0 >= 0:
                        q = p0 + L   # после последнего звука части
                        c = 1.0 - в["д_длина"] * (L - 2)
                        if m1 < 0: c += 0 if p0 == 0 else в["д_край"]
                        else:
                            c += шов(P[m1])
                            if p0 > 0 and m1 > 0:
                                c += -в["д_сосед"] if ключ[p0 - 1] == P[m1 - 1] else (в["д_класс"] if кл(ключ[p0 - 1]) != кл(P[m1 - 1]) else 0.0)
                        if m2 >= n: c += 0 if q == len(ключ) else в["д_край"]
                        else:
                            c += шов(P[m2])
                            if q < len(ключ) and m2 + 1 < n:
                                c += -в["д_сосед"] if ключ[q] == P[m2 + 1] else (в["д_класс"] if кл(ключ[q]) != кл(P[m2 + 1]) else 0.0)
                        v = best[m1][0] + c
                        if лучш is None or v < лучш[0]: лучш = (v, best[m1][1] + [(ключ, p0, L, m1 >= 0, m2 < n)])
                        p0 = ключ.find(sub, p0 + 1)
            if лучш: best[m2] = лучш
        if n not in best: return []
        части = []
        for (ключ, p0, L, сер_н, сер_к) in best[n][1]:
            u, _, os_ = self._зв[ключ]; o = os_[0]; ri, jj = V.occ[o]; ww = V.recs[ri]["w"][jj]; ph = V.recs[ri]["ph"][jj]
            if сер_н: t0 = (ph[p0][2] + ph[p0][3]) / 2 - 0.006
            else:
                t0 = ph[p0][2]
                if p0 == 0 and jj > 0: t0 -= min(ww[3], self.в["запас_нач"])
            if сер_к: t1 = (ph[p0 + L - 1][2] + ph[p0 + L - 1][3]) / 2 + 0.006
            else:
                t1 = ph[p0 + L - 1][3]
                if p0 + L == len(ph) and jj < len(V.recs[ri]["w"]) - 1: t1 += min(ww[4], self.в["запас_кон"])
            if t1 - t0 > 0.02: части.append((ri, t0, t1, сер_н, сер_к))
        return части

    def _из_частей(self, слово, уд):
        """Слово вне базы — из частей других слов (поиск по буквам). Часть — подстрока слова базы с временем букв.
        Цена части: 1 за каждую (меньше стыков), однобуквенная — почти запрет; начало/конец слова — из начала/конца
        слова-источника; соседние буквы источника совпадают с целью — дешевле (звуки переходят естественно);
        разрез перед глухим согласным дешевле, между гласными дороже. → [(rec, t0, t1), ...]"""
        V = self.V; w = с_ударением(слово) if уд else слово; n = len(w)
        if not hasattr(self, "_указ"):
            self._указ = {True: {}, False: {}}
            for u, os_ in V.по_слову.items():
                good = [o for o in os_ if len(V.w(o)[5]) == len(u)]
                if good:
                    м = V.медиана[u]
                    чист = (lambda o: (0.3 if V.чистота[o] < 0 else float(V.чистота[o]))) if V.чистота is not None else (lambda o: 0.0)
                    good.sort(key=lambda o: (чист(o) > 0.34, V.конец_фразы(o) or V.начало_фразы(o), abs(V.dur[o] - м)))
                    self._указ[True][с_ударением(u)] = good[:6]; self._указ[False][u] = good[:6]
            self._кэш_подстрок = {True: {}, False: {}}
        слова = self._указ[уд]
        best = [(0.0, [])] + [(1e9, None)] * n
        for j in range(1, n + 1):
            for i in range(max(0, j - 12), j):
                if best[i][1] is None: continue
                sub = w[i:j]; L = j - i
                лучшая = None
                for u in self._содержащие(sub, уд):
                    p0 = u.find(sub)
                    while p0 >= 0:
                        c = 1.0 + (1.6 if L == 1 else 0.3 if L == 2 else 0.0)
                        if i == 0: c += 0 if p0 == 0 else 0.6
                        else:
                            if p0 == 0: c += 0.4
                            elif u[p0 - 1] == w[i - 1]: c -= 0.3
                            elif класс(u[p0 - 1].lower()) != класс(w[i - 1].lower()): c += 0.3
                            if w[i] in ГЛУХИЕ: c -= 0.2
                            elif w[i].lower() in ГЛАСНЫЕ and w[i - 1].lower() in ГЛАСНЫЕ: c += 0.4
                        q = p0 + L
                        if j == n: c += 0 if q == len(u) else 0.6
                        else:
                            if q == len(u): c += 1.2 if u[-1].lower() in "бвгджз" else 0.4   # на конце слова — оглушена
                            elif u[q] == w[j]: c -= 0.3
                            elif класс(u[q].lower()) != класс(w[j].lower()): c += 0.3
                        if лучшая is None or c < лучшая[0]: лучшая = (c, u, p0)
                        p0 = u.find(sub, p0 + 1)
                if лучшая and best[i][0] + лучшая[0] < best[j][0]:
                    best[j] = (best[i][0] + лучшая[0], best[i][1] + [(лучшая[1], лучшая[2], L)])
        if best[n][1] is None:
            if not уд: print(f"[нет частей для слова: {слово}]")
            return []
        части = []
        for (u, p0, L) in best[n][1]:
            o = слова[u][0]; ri, j = V.occ[o]; ww = V.recs[ri]["w"][j]; б = ww[5]
            if "ph" in V.recs[ri] and self.в["края"] >= 3:
                t0 = ww[1] if p0 == 0 else б[p0]; t1 = ww[2] if p0 + L == len(u) else б[p0 + L]
                if p0 == 0 and j > 0: t0 -= min(ww[3], self.в["запас_нач"])
                if p0 + L == len(u) and j < len(V.recs[ri]["w"]) - 1: t1 += min(ww[4], self.в["запас_кон"])
            else:
                t0 = ww[1] if p0 == 0 else self._граница(ri, (б[p0 - 1] + б[p0]) / 2)
                t1 = ww[2] if p0 + L == len(u) else self._граница(ri, (б[p0 + L - 1] + б[p0 + L]) / 2)
            if t1 - t0 > 0.02: части.append((ri, t0, t1))
        return части

    def _содержащие(self, sub, уд):
        к = self._кэш_подстрок[уд]; r = к.get(sub)
        if r is None:
            r = [u for u in self._указ[уд] if sub in u]
            r.sort(key=len); r = r[:60]; к[sub] = r
        return r

    def _граница(self, ri, t, окно=0.03):
        """Разрез внутри слова: в ±30 мс от оценки по времени букв — точка наибольшего изменения спектра
        (переход одного звука в другой); при равенстве — где тише."""
        a = self.V.звук(ri); hop = int(SR * 0.005); N = int(SR * 0.02)
        i0, i1 = max(0, int((t - окно) * SR) - N), min(len(a), int((t + окно) * SR) + N)
        if i1 - i0 < N * 3: return t
        кадры = [a[k:k + N] for k in range(i0, i1 - N, hop)]
        M = np.array([_mfcc(x)[1:] for x in кадры]); E = np.array([_db(x) for x in кадры])
        поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]
        # близость к исходной оценке тоже ценится: разрез не уходит далеко от букв
        центр = np.array([(i0 + k * hop + N / 2) / SR for k in range(len(кадры))])
        оц = поток / (поток.max() + 1e-9) - 0.15 * (E - E.min()) / (np.ptp(E) + 1e-9) - 0.5 * np.abs(центр - t) / окно
        k = int(np.argmax(оц)); return (i0 + k * hop + N // 2) / SR

    # ───────────────────────── 4. СКЛЕЙКА ─────────────────────────
    # сколько звука бывает до первой и после последней буквы (по классу звука), с запасом
    ДО = {"г": 0.06, "с": 0.07, "з": 0.08, "к": 0.10, "п": 0.07}
    ПОСЛЕ = {"г": 0.11, "с": 0.10, "з": 0.08, "к": 0.10, "п": 0.09}

    @staticmethod
    def _после(ch):
        if ch in "птк": return 0.05      # смычный: хвост — только взрыв
        if ch in "цч": return 0.07
        if ch in "бдг": return 0.05
        if ch in "ьъ": return 0.09
        return Синтезатор.ПОСЛЕ[класс(ch)]

    @staticmethod
    def _до(ch):
        if ch in "птк": return 0.09      # смычка перед взрывом — со своим словом
        if ch in "сшфхщ": return 0.11     # длинный шум
        return Синтезатор.ДО[класс(ch)]

    def _края(self, ri, j0, j1, s, e):
        """Кусок из слов j0..j1 записи ri вне своего окружения: края не дальше типичной длины звука от своих букв
        (чужие хвосты соседних слов источника не попадают)."""
        ws = self.V.recs[ri]["w"]
        if self.в["края"] >= 3 and "ph" in self.V.recs[ri]:
            # точная разметка звуков: край — граница звука; в паузу источника — чуть-чуть (нарастание и затухание);
            # поправка края по распознавателю (edge_fix.py), если она есть
            f = self.V.recs[ri]["f"]; пр = self.V.правки
            if j0 > 0: s = ws[j0][1] - min(ws[j0][3], self.в["запас_нач"]) + (пр.get(f"{f}#{j0}", (0, 0))[0] if self.в.get("правки_краёв", 0) else 0)
            if j1 < len(ws) - 1: e = ws[j1][2] + min(ws[j1][4], self.в["запас_кон"]) + (пр.get(f"{f}#{j1}", (0, 0))[1] if self.в.get("правки_краёв", 0) else 0)
            return s, e
        if self.в["края"] and j0 > 0 and ws[j0][5] and ws[j0][3] < 0.05:
            перв = ws[j0][5][0]; lo = max(s, перв - self._до(ws[j0][0][0])); hi = перв - 0.008
            s = self._переход(ri, lo, hi, к_концу=True) if self.в["края"] == 2 and hi - lo > 0.015 else lo
        if self.в["края"] and j1 < len(ws) - 1 and ws[j1][5] and ws[j1][4] < 0.05:
            посл = ws[j1][5][-1]; lo = посл + 0.02; hi = min(e, посл + self._после(ws[j1][0][-1]))
            e = self._переход(ri, lo, hi, к_концу=False) if self.в["края"] == 2 and hi - lo > 0.015 else hi
        return s, e

    def _переход(self, ri, lo, hi, к_концу):
        """Точка наибольшего изменения спектра в [lo, hi] — переход от чужого звука к своему (или наоборот).
        к_концу=True — при равенстве ближе к своему слову справа, иначе — слева."""
        a = self.V.звук(ri); hop = int(SR * 0.004); N = int(SR * 0.016)
        i0, i1 = max(0, int(lo * SR) - N // 2), min(len(a), int(hi * SR) + N // 2)
        if i1 - i0 < N + 3 * hop: return lo if к_концу else hi
        кадры = [a[k:k + N] for k in range(i0, i1 - N, hop)]
        M = np.array([_mfcc(x)[1:] for x in кадры]); En = np.array([_db(x) for x in кадры])
        поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)] + 0.5 * np.r_[0, np.abs(np.diff(En))]
        д = np.linspace(0, 1, len(кадры)); д = д if к_концу else 1 - д
        k = int(np.argmax(поток / (поток.max() + 1e-9) + 0.15 * д))
        return min(hi, max(lo, (i0 + k * hop + N // 2) / SR))

    def куски(self, res):
        """Единицы → куски звука: подряд идущие слова одной записи сливаются в один кусок."""
        V = self.V; out = []
        for u in res:
            if u[0] == "o":
                ri, j = V.occ[u[1]]; w = V.recs[ri]["w"][j]
                if out and out[-1][0] == ri and out[-1][3] == j - 1 and out[-1][4] == "o":
                    out[-1] = (ri, out[-1][1], w[2], j, "o", u[1])
                else: out.append((ri, w[1], w[2], j, "o", u[1]))
            else:
                for ч in u[1]:
                    ri, s, e = ч[:3]; out.append((ri, s, e, -1, "ч", (ч[3], ч[4]) if len(ч) > 3 else None))
        # края кусков из слов: без чужих хвостов
        итог = []
        for (ri, s, e, j, вид, o) in out:
            if вид == "o":
                ws = V.recs[ri]["w"]; j0 = next(k for k in range(j, -1, -1) if abs(ws[k][1] - s) < 1e-6)
                s, e = self._края(ri, j0, j, s, e)
            итог.append((ri, s, e, j, вид, o))
        return итог

    def _звонкий_край(self, кусок, сторона):
        """Звук на краю куска (сторона −1 — конец, 0 — начало) — гласный, сонорный или «й» (по разметке)."""
        ri, s_, e_, j, вид, o = кусок
        if вид != "o": return False
        r = self.V.recs[ri]
        if "ph" not in r: return False
        if сторона == 0:
            ws = r["w"]; j0 = next((k for k in range(j, -1, -1) if abs(ws[k][1] - s_) < 0.03), None)
            if j0 is None: return False
            z = r["ph"][j0][0][0]
        else: z = r["ph"][j][-1][0]
        return z.lower() in "аоуыэиjлмнр"

    @staticmethod
    def встык(a, b, f=int(SR * 0.002), ноль=int(SR * 0.002)):
        """Стык на переходе звуков: без перекрытия — короткий взрыв согласного не тонет в нарастании.
        Разрез подтягивается к переходу волны через ноль на подъёме (в пределах 2 мс) — против щелчка;
        по 2 мс затухания и нарастания на самых краях."""
        if len(a) > 4 * ноль:
            хв = a[-2 * ноль:]; zc = np.where((хв[:-1] <= 0) & (хв[1:] > 0))[0]
            if len(zc): a = a[:len(a) - 2 * ноль + int(zc[-1]) + 1]
        if len(b) > 4 * ноль:
            гл = b[:2 * ноль]; zc = np.where((гл[:-1] <= 0) & (гл[1:] > 0))[0]
            if len(zc): b = b[int(zc[0]) + 1:]
        if len(a) > 2 * f: a = a.copy(); a[-f:] *= np.linspace(1, 0, f)
        if len(b) > 2 * f: b = b.copy(); b[:f] *= np.linspace(0, 1, f)
        return np.concatenate([a, b])

    @staticmethod
    def _тишина_краёв(x, с_начала, с_конца, нач_макс=0.05, кон_макс=0.02):
        if len(x) < SR // 20: return x
        fr = int(SR * 0.005); n = len(x) // fr
        e = np.sqrt(np.mean(x[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10)
        тихо = e < np.max(e) * 10 ** (-38 / 20)
        i0, i1 = 0, len(x)
        if с_начала:
            k = 0
            while k < n and тихо[k]: k += 1
            лишнее = k * fr - int(SR * нач_макс)
            if лишнее > 0: i0 = лишнее
        if с_конца:
            k = n - 1
            while k >= 0 and тихо[k]: k -= 1
            лишнее = (n - 1 - k) * fr - int(SR * кон_макс)
            if лишнее > 0: i1 = len(x) - лишнее
        return x[i0:i1] if i1 - i0 > SR // 50 else x

    @staticmethod
    def стык(a, b, L=int(SR * 0.012), сдвиг=int(SR * 0.004), корр=False):
        if len(a) < L or len(b) < L + сдвиг: return np.concatenate([a, b])
        хвост = a[-L:]; лучш, лучш_d = -2, 0
        for d in range(0, сдвиг, 4):
            голова = b[d:d + L]; den = np.linalg.norm(хвост) * np.linalg.norm(голова) + 1e-9
            c = float(np.dot(хвост, голова) / den)
            if c > лучш: лучш, лучш_d = c, d
        b = b[лучш_d:]
        if корр and КФ_РЕЖИМ == "энергия":
            # линейное перекрытие, затем громкость смеси — ровно между громкостями двух сторон (без всплеска на
            # совпавших волнах и без провала на несвязанных; совпадение волн угадывать не нужно)
            p_ = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, L)); fo, fi = 1.0 - p_, p_
            m = a[-L:] * fo + b[:L] * fi
            ra = float(np.sqrt(np.mean(a[-L:] ** 2))); rb = float(np.sqrt(np.mean(b[:L] ** 2))); rm = float(np.sqrt(np.mean(m ** 2))) + 1e-9
            g = float(np.clip(0.5 * (ra + rb) / rm, 0.7, 1.6)) if ra + rb > 1e-5 else 1.0
            return np.concatenate([a[:-L], (m * g).astype(a.dtype), b[L:]])
        if корр:
            # громкость перекрытия — по совпадению волн ρ: для совпавших волн синус/косинус дают всплеск до +3 дБ
            # (на гласных слышно призвуком); вес входящего — плавный подъём p, уходящего — из g1² + 2ρ·g1·g2 + g2² = 1
            ρ = float(np.clip(лучш, 0.0, 1.0))
            if КФ_ПОРОГ > 0:   # лучшее из многих сдвигов завышено случайно: ниже порога — как несвязанные (сохранение мощности)
                ρ = float(np.clip((ρ - КФ_ПОРОГ) / (1.0 - КФ_ПОРОГ), 0.0, 1.0))
            p_ = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, L))
            fi = p_; fo = -ρ * p_ + np.sqrt(np.maximum(0.0, ρ * ρ * p_ * p_ - p_ * p_ + 1.0))
        else:
            t = np.linspace(0, np.pi / 2, L); fo, fi = np.cos(t), np.sin(t)
        return np.concatenate([a[:-L], a[-L:] * fo + b[:L] * fi, b[L:]])

    @staticmethod
    def стык_периоды(a, b, n=1):
        """Шов двух звонких звуков по периодам голоса: последняя метка периода левого куска m_a и первая правого m_b;
        правый ставится так, чтобы его метка пришлась ровно через период T после m_a, перекрытие — ровно один период
        (плавный подъём/спад). Колебание голоса не рассыпается на шве. None — если меток нет."""
        import psola
        Z = int(SR * 0.06)
        if len(a) < Z + 10 or len(b) < Z + 10: return None
        ta = a[-Z:].astype(np.float32); hb = b[:Z].astype(np.float32)
        ма, за = psola.метки(ta); мб, зб = psola.метки(hb)
        ма = [int(m) for m, z in zip(ма, за) if z]; мб = [int(m) for m, z in zip(мб, зб) if z]
        if len(ма) < 3 or len(мб) < 3: return None
        Ta = int(np.median(np.diff(ма[-3:]))); Tb = int(np.median(np.diff(мб[:3])))
        if not (40 <= Ta <= 400 and 40 <= Tb <= 400) or abs(np.log(Ta / Tb)) > 0.25: return None
        T = int(round((Ta + Tb) / 2))
        if n >= 2:
            # перекрытие n периодов: последние n периодов левого и первые n периодов правого, метки совмещены —
            # форма волны перетекает за несколько периодов, как в живой речи (а не скачком внутри одного)
            mа = next((m for m in reversed(ма) if m + n * T <= Z - 1), None); mб = next((m for m in мб if m + n * T <= Z - 1), None)
            if mа is None or mб is None: return None
            ia = len(a) - Z + mа; L_ = n * T
            p_ = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, L_))
            смесь = a[ia:ia + L_] * (1 - p_) + b[mб:mб + L_] * p_
            Синтезатор._пс_точка = ia + L_ // 2
            return np.concatenate([a[:ia], смесь.astype(a.dtype), b[mб + L_:]])
        # левая метка — последняя, после которой в куске есть ещё целый период; правая — первая, перед которой есть период
        mа = next((m for m in reversed(ма) if m + T <= Z - 1), None); mб = next((m for m in мб if m - T >= 0), None)
        if mа is None or mб is None: return None
        ia = len(a) - Z + mа
        p_ = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, T))
        смесь = a[ia:ia + T] * (1 - p_) + b[mб - T:mб] * p_
        Синтезатор._пс_точка = ia + T // 2   # середина перекрытия — для мерок шва
        return np.concatenate([a[:ia], смесь.astype(a.dtype), b[mб:]])

    def отрезок(self, слова, end):
        res = self.витерби(слова, end)
        кс = self.куски(res)
        V = self.V; звуки = []
        for ki, (ri, s, e, j, вид, o) in enumerate(кс):
            a = V.звук(ri); последний = ki == len(кс) - 1
            # конец отрезка, взятый не из конца фразы-источника: хвост на 30 мс шире и с затуханием —
            # окончание не обрывается на полуслове
            хвост = 0
            пр = int(SR * self.в.get("плавный_стык", 0) / 1000 * self.в.get("стык_продлить", 0)) if len(кс) > 1 else 0
            if пр:   # кусок чуть шире своих границ: перекрытие ложится на продолжение, а не на свой последний звук
                if ki > 0: s = max(0.0, s - пр / SR)
                if not последний: e = e + пр / SR
            if последний and вид == "o" and not V.конец_фразы(o):
                хвост = int(SR * 0.03)
                if self.в["края"] >= 3 and "ph" in V.recs[ri]: хвост = int(SR * min(0.03, max(0.0, V.w(o)[4] - self.в["запас_кон"])))
            i0, i1 = int(s * SR), min(len(a), int(e * SR) + хвост)
            x = a[i0:i1].copy()
            if хвост and len(x) > хвост: x[-хвост:] *= np.linspace(1, 0, хвост)
            if последний and вид == "o" and not V.конец_фразы(o) and (self.в.get("конец_тянуть") or self.в.get("конец_спад")) and len(x) > SR // 10:
                # последнее слово отрезка взято из середины записи: в конце фразы диктор тянет последний слог и
                # понижает голос — без этого слово звучит оборванным (ошибок втрое больше, чем у слов из конца фразы)
                import psola
                L = len(x); Lw = min(L, int((e - V.w(o)[1]) * SR)); a0 = L - int(0.5 * Lw); a1 = L - int(0.15 * Lw)
                if self.в.get("конец_тянуть"):
                    k = np.ones(L); km = float(self.в["конец_тянуть"])
                    k[a0:a1] = np.linspace(1.0, km, a1 - a0); k[a1:] = km
                    x = psola.темп(x.astype(np.float32), k, True)
                if self.в.get("конец_спад") and end in ".!":
                    L = len(x); c = np.zeros(L); n0 = min(L, int(SR * 0.2))
                    c[L - n0:] = np.linspace(0, -float(self.в["конец_спад"]), n0)
                    x = psola.сдвинуть(x, c)
            звуки.append(x)
        # мера ритма: темп кусков (звуков в секунду по разметке) и скачки темпа между соседними кусками
        тк = self._темпы_кусков(кс)
        for a_, b_ in zip(тк, тк[1:]):
            if a_ and b_: self.скачки_темпа.append(abs(math.log(a_ / b_)))
        # ровный темп: каждый кусок — к общему темпу отрезка (доля от обычной длины этих слов у диктора)
        if self.в.get("ровный_темп") and len(звуки) > 1:
            звуки = self._ровный_темп(звуки, кс)
        # высота голоса на стыках — без скачков: каждому куску небольшой сдвиг (не больше 1,5 полутона)
        if self.в.get("мелодия_фразы") and len(звуки) > 1:
            звуки = self._мелодия_фразы(звуки)
        if self.в["сгладить"] == 2 and len(звуки) > 1:
            звуки = self._плавная_высота(звуки, кс=кс)
        elif self.в["сгладить"] and len(звуки) > 1:
            звуки = self._сгладить_высоту(звуки)
        # мера плавности: скачки уровня высоты между соседними кусками и скачки высоты на стыках (полутона)
        if self.в.get("мерить_уровни", 1):
            ур = [self._уровень(x) for x in звуки]
            for a_, b_ in zip(ур, ур[1:]):
                if a_ is not None and b_ is not None: self.скачки_уровня.append(abs(a_ - b_))
        L = int(SR * 0.04)
        for x, y in zip(звуки, звуки[1:]):
            b = _yin_f0(x[-L - 120:-120]) if len(x) > L + 120 else 0; a = _yin_f0(y[120:120 + L]) if len(y) > L + 120 else 0
            if a > 0 and b > 0: self.скачки.append(abs(12 * math.log2(b / a)))
        # громкость соседних кусков — без скачков (громкость куска — по звонким местам, тишина не считается)
        уровни = [self._громкость_речи(x) for x in звуки if len(x)]
        if уровни:
            ц = float(np.median(уровни)); α = self.в.get("ровная_громкость", 0.6); пр = self.в.get("ровная_громкость_предел", 6)
            for k, x in enumerate(звуки):
                if len(x): g = np.clip(ц - self._громкость_речи(x), -пр, пр) * α; звуки[k] = x * 10 ** (g / 20)
        # ровный тембр: долговременная окраска (яркость) каждого куска — к средней по фразе, на долю «ровный_тембр»
        if self.в.get("ровный_тембр") and len(звуки) > 1:
            звуки = self._ровный_тембр(звуки)
        # мера ровности тембра: перепад яркости (наклон спектра) соседних кусков
        ярк = [self._яркость(x) for x in звуки]
        self.скачки_яркости += [abs(a_ - b_) for a_, b_ in zip(ярк, ярк[1:]) if a_ is not None and b_ is not None]
        # мера ровности: перепад громкости соседних кусков целиком (дБ)
        ур_г = [self._громкость_речи(x) for x in звуки if len(x) > SR // 20]
        self.скачки_громкости += [abs(a_ - b_) for a_, b_ in zip(ур_г, ур_г[1:])]
        # громкость на каждом стыке — к перепаду, как на живом стыке у диктора между такими звуками (плавно, 100 мс)
        if self.в.get("громкость_шов") and self.шов and len(звуки) > 1:
            звуки = self._громкость_швов(звуки, кс)
        # тембр на стыке: спектральные огибающие краёв соседних кусков сводятся навстречу (плавно, 30 мс)
        if self.в.get("тембр_шов") and len(звуки) > 1:
            звуки = self._тембр_швов(звуки, L_ms=self.в.get("тембр_окно", 30))
        # тишина на стыках — не длиннее естественной: смычка перед согласным ≤ 50 мс, хвост слова ≤ 20 мс
        if self.в["сжать_тишину"]:
            if self.в.get("тишина_по_звукам"):
                # тишина у края — по звуку: перед смычным (его смычка — тишина) до 60 мс, перед прочими — до 12 мс;
                # после взрыва смычного, если дальше не смычка, — до 10 мс (взрыв с обрывом в тишину слышен щелчком)
                СМЫЧН = set("пткбдгПТКБДГцч")
                def зв(кусок, сторона):
                    ri, s_, e_, j, вид, o = кусок; r = self.V.recs[ri]
                    if вид != "o" or "ph" not in r: return None
                    if сторона < 0: return r["ph"][j][-1][0]
                    ws = r["w"]; j0 = next((q for q in range(j, -1, -1) if abs(ws[q][1] - s_) < 0.03), None)
                    return None if j0 is None else r["ph"][j0][0][0]
                нов = []
                for k, x in enumerate(звуки):
                    нач = self.в["тишина_нач"]; кон = self.в["тишина_кон"]
                    if k > 0:
                        z = зв(кс[k], 0)
                        if z is not None and z not in СМЫЧН: нач = min(нач, self.в.get("тишина_несмычн", 0.003))
                    if k < len(звуки) - 1:
                        z1, z2 = зв(кс[k], -1), зв(кс[k + 1], 0)
                        if z1 is not None and z1 in СМЫЧН and z2 is not None and z2 not in СМЫЧН: кон = min(кон, 0.010)
                    y = self._тишина_краёв(x, k > 0, k < len(звуки) - 1, нач, кон)
                    if k < len(звуки) - 1 and self.в.get("гасить_взрыв"):
                        z1 = зв(кс[k], -1)
                        if z1 is not None and z1 in СМЫЧН:   # конец на взрыве смычного — плавно гаснет, а не обрывается
                            f = min(len(y) // 4, int(SR * self.в["гасить_взрыв"] / 1000))
                            if f > 8: y = y.copy(); y[-f:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, f))).astype(np.float32)
                    нов.append(y)
                звуки = нов
            else:
                звуки = [self._тишина_краёв(x, k > 0, k < len(звуки) - 1, self.в["тишина_нач"], self.в["тишина_кон"]) for k, x in enumerate(звуки)]
        out = звуки[0] if звуки else np.zeros(1)
        пз = int(SR * self.в["пауза_стык"] / 1000); стыки = []
        виды = []
        for k, x in enumerate(звуки[1:], 1):
            стыки.append(len(out)); виды.append("?")
            if пз > 0:   # короткая тишина между кусками из разных записей — слова не слипаются
                f = min(int(SR * 0.004), len(out) // 2, len(x) // 2)
                if f > 0: out = out.copy(); out[-f:] *= np.linspace(1, 0, f); x = x.copy(); x[:f] *= np.linspace(0, 1, f)
                out = np.concatenate([out, np.zeros(пз, dtype=np.float32), x])
            elif кс[k - 1][4] == "ч" and кс[k][4] == "ч" and кс[k - 1][5] and кс[k][5] and кс[k - 1][5][1] and кс[k][5][0]:
                виды[-1] = "середина звука"; стыки[-1] = len(out) - int(SR * 0.006)
                out = self.стык(out, x, сдвиг=int(SR * self.в.get("сдвиг_середина", 4) / 1000), корр=bool(self.в.get("кф_корр")))   # разрез посередине звука: волны похожи — плавное перекрытие
            elif self.в.get("плавный_стык"):
                # плавный стык везде: перекрытие с подбором совпадения волны (края — точно по звукам, так что
                # перекрытие приходится на сам переход, а не на взрыв согласного)
                L = int(SR * self.в["плавный_стык"] / 1000)
                if self.в.get("стык_звонкий") and self._звонкий_край(кс[k - 1], -1) and self._звонкий_край(кс[k], 0):
                    L = int(SR * self.в["стык_звонкий"] / 1000)   # гласные/сонорные с обеих сторон — перекрытие длиннее
                    сд = int(SR * self.в.get("сдвиг_звонкий", 4) / 1000)   # и подбор совпадения — в пределах периода
                else: сд = int(SR * 0.004)
                пс = None
                if self.в.get("стык_периоды") and self._звонкий_край(кс[k - 1], -1) and self._звонкий_край(кс[k], 0):
                    пс = self.стык_периоды(out, x, int(self.в["стык_периоды"]))
                if пс is not None:
                    виды[-1] = "по периодам"; стыки[-1] = Синтезатор._пс_точка; out = пс
                elif len(out) > 3 * L and len(x) > 3 * L:
                    виды[-1] = "перекрытие" + (" (часть)" if кс[k - 1][4] == "ч" or кс[k][4] == "ч" else "")
                    стыки[-1] = len(out) - L // 2; out = self.стык(out, x, L=L, сдвиг=сд, корр=bool(self.в.get("кф_корр")))
                else: виды[-1] = "встык (короткий кусок)"; out = self.встык(out, x)
            elif self.в.get("гладкий_стык") and self._звонкий_край(кс[k - 1], -1) and self._звонкий_край(кс[k], 0):
                # гласные и сонорные с обеих сторон: короткое перекрытие с подбором волны — без щелчка-«согласного»
                L = int(SR * self.в["гладкий_стык"] / 1000); out = self.стык(out, x, L=L, сдвиг=int(SR * 0.004))
            elif self.в["встык"]: out = self.встык(out, x)
            else: out = self.стык(out, x)
        # плавный переход громкости через шов: тихая сторона у точки шва чуть поднимается к громкой (треугольный вес,
        # ±W мс) — ступенька громкости меньше, громкая сторона не опускается (иначе провал у шва)
        α = self.в.get("шов_громкость_мягко", 0.0)
        if α and стыки:
            W = int(SR * self.в.get("шов_громкость_окно", 25) / 1000); Q = int(SR * 0.005); out = out.astype(np.float32).copy()
            for p in стыки:
                if p - W - Q < 0 or p + W + Q > len(out): continue
                Ld = _db(out[p - W:p - Q]); Rd = _db(out[p + Q:p + W])
                if Ld < -45 or Rd < -45: continue
                D = float(np.clip(Rd - Ld, -6.0, 6.0))
                if abs(D) < 2.0: continue
                tri = 1.0 - np.abs(np.arange(-W, W) / W)
                g = np.zeros(2 * W)
                if D > 0: g[:W] = α * D * tri[:W]   # левая тише — поднять её у точки
                else: g[W:] = -α * D * tri[W:]       # правая тише — поднять её у точки
                out[p - W:p + W] *= (10 ** (g / 20)).astype(np.float32)
        # края: короткое нарастание и затухание
        f = min(len(out) // 4, int(SR * self.в.get("нарастание_мс", 6) / 1000)); f2 = min(len(out) // 4, int(SR * 0.006))
        if f > 0: out[:f] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, f))).astype(np.float32)
        if f2 > 0: out[-f2:] *= np.linspace(1, 0, f2)
        self.стыки_отрезка = стыки; self.виды_отрезка = виды
        return out, res, кс

    @staticmethod
    def _огибающая(x, n_fft=512):
        """Сглаженная огибающая спектра участка (лог-амплитуда, кепстральное сглаживание до 30 коэффициентов)."""
        if len(x) < 64: return None
        w = np.hanning(len(x)); S = np.abs(np.fft.rfft(x * w, n_fft)) + 1e-6
        c = np.fft.irfft(np.log(S)); c[30:-30] = 0
        return np.fft.rfft(c).real

    def _тембр_швов(self, звуки, L_ms=30, сила=None):
        """На каждом стыке: огибающая конца левого куска и начала правого сводятся к средней (на долю «тембр_шов»),
        поправка плавно спадает от стыка к краю окна. Покадрово (окно 20 мс, шаг 5 мс), меняется только амплитуда."""
        сила = float(self.в["тембр_шов"] if сила is None else сила); n_fft = 512
        N = int(SR * 0.02); H = int(SR * 0.005); L = int(SR * L_ms / 1000); W = int(SR * 0.025)
        out = [x.astype(np.float32).copy() for x in звуки]
        поправки = [[None, None] for _ in звуки]   # (огибающая-разница в начале, в конце) в лог-амплитуде
        for k in range(len(звуки) - 1):
            a, b = звуки[k], звуки[k + 1]
            if len(a) < 2 * L or len(b) < 2 * L: continue
            ea, eb = self._огибающая(a[-W:]), self._огибающая(b[:W])
            if ea is None or eb is None or _db(a[-W:]) < -45 or _db(b[:W]) < -45: continue
            ср = (ea + eb) / 2
            поправки[k][1] = np.clip((ср - ea) * сила, -1.5, 1.5); поправки[k + 1][0] = np.clip((ср - eb) * сила, -1.5, 1.5)
            if self.в.get("тембр_без_громкости"):   # только форма спектра: общий уровень не трогать (иначе провал у шва)
                for q_, dd in ((k, поправки[k][1]), (k + 1, поправки[k + 1][0])):
                    if self.в["тембр_без_громкости"] < 0:   # только поднимать тихую сторону, громкую не опускать
                        dd = dd - min(0.0, float(np.mean(dd)))
                    else: dd = dd - float(self.в["тембр_без_громкости"]) * float(np.mean(dd))
                    if q_ == k: поправки[k][1] = dd
                    else: поправки[k + 1][0] = dd
        окно = np.hanning(N).astype(np.float32)
        for k, x in enumerate(out):
            нач, кон = поправки[k]
            if нач is None and кон is None: continue
            y = x.copy(); n = len(x)
            for сторона, d in ((0, нач), (1, кон)):
                if d is None: continue
                lo, hi = (0, min(n, L + N)) if сторона == 0 else (max(0, n - L - N), n)
                seg = x[lo:hi].astype(np.float64); acc = np.zeros(len(seg)); норм = np.zeros(len(seg))
                for p0 in range(0, max(1, len(seg) - N + 1), H):
                    fr = seg[p0:p0 + N]
                    if len(fr) < N: break
                    центр = lo + p0 + N // 2
                    вес = max(0.0, 1 - (центр / L if сторона == 0 else (n - центр) / L))
                    F = np.fft.rfft(fr * окно, n_fft); e0 = float(np.sum(np.abs(F) ** 2)); F *= np.exp(d * вес)
                    if self.в.get("тембр_без_громкости", 0) >= 1:   # энергия кадра — прежняя
                        e1 = float(np.sum(np.abs(F) ** 2)); F *= np.sqrt(e0 / (e1 + 1e-12))
                    r = np.fft.irfft(F, n_fft)[:N]
                    acc[p0:p0 + N] += r * окно; норм[p0:p0 + N] += окно ** 2
                ok = норм > 1e-3
                нов = seg.copy(); нов[ok] = acc[ok] / норм[ok]
                # переход к нетронутому сигналу на краю окна (кадры с весом 0 дают исходный звук)
                y[lo:hi] = нов.astype(np.float32)
            out[k] = y
        return out

    def _темпы_кусков(self, кс):
        """Темп куска — звуков в секунду (по разметке звуков слов куска); None — неизвестно."""
        V = self.V; out = []
        for (ri, s_, e_, j, вид, o) in кс:
            r = V.recs[ri]
            if вид != "o" or "ph" not in r or e_ - s_ < 0.08: out.append(None); continue
            ws = r["w"]; j0 = next((k for k in range(j, -1, -1) if abs(ws[k][1] - s_) < 0.03), j)
            n = sum(len(r["ph"][k]) for k in range(j0, j + 1)); d = sum(ws[k][2] - ws[k][1] for k in range(j0, j + 1))
            out.append(n / d if d > 0.05 else None)
        return out

    def _ровный_темп(self, звуки, кс, предел=0.15):
        V = self.V; доли = []
        for (ri, s_, e_, j, вид, o) in кс:
            if вид != "o": доли.append(None); continue
            ws = V.recs[ri]["w"]; j0 = next((k for k in range(j, -1, -1) if abs(ws[k][1] - s_) < 0.03), j)
            факт = sum(ws[k][2] - ws[k][1] for k in range(j0, j + 1))
            обычно = sum(V.медиана.get(ws[k][0], ws[k][2] - ws[k][1]) for k in range(j0, j + 1))
            доли.append(факт / max(1e-3, обычно))
        есть = [d for d in доли if d]
        if len(есть) < 2: return звуки
        цель = float(np.median(есть)); out = []
        for x, d in zip(звуки, доли):
            if not d: out.append(x); continue
            k = float(np.clip(d / цель, 1 - предел, 1 + предел))   # k > 1 — кусок медленнее общего: ускорить
            if abs(k - 1) <= self.в.get("темп_порог", 0.04): out.append(x); continue
            # запас тишины в конце: WSOLA не дочитывает последние 40 мс — окончание не должно пропасть
            if self.в.get("ровный_темп") == 2:   # по периодам основного тона (чище для звонких мест)
                import psola; out.append(psola.темп(x.astype(np.float32), k, bool(self.в.get("темп_звонких", 0)))); continue
            xp = np.concatenate([x.astype(np.float32), np.zeros(int(SR * 0.06), np.float32)])
            y = self.темп(xp, k); out.append(y[:int(round(len(x) / k))].astype(np.float32))
        return out

    def _край_вид(self, кусок, сторона):
        """Вид звука на краю куска (по разметке): «г», «с», «з», «к»; None — неизвестно."""
        ri, s_, e_, j, вид, o = кусок
        if вид != "o": return None
        r = self.V.recs[ri]
        if "ph" not in r: return None
        if сторона < 0: return self._класс_звука(r["ph"][j][-1][0])
        ws = r["w"]; j0 = next((k for k in range(j, -1, -1) if abs(ws[k][1] - s_) < 0.03), None)
        return None if j0 is None else self._класс_звука(r["ph"][j0][0][0])

    def _громкость_швов(self, звуки, кс, предел=4.0):
        L = int(SR * 0.02); R_ = int(SR * 0.10)
        сдв = [[0.0, 0.0] for _ in звуки]   # дБ в начале и в конце куска
        for k in range(len(звуки) - 1):
            a, b = звуки[k], звуки[k + 1]
            if len(a) < 2 * L or len(b) < 2 * L: continue
            m = self.шов.get((self._край_вид(кс[k], -1) or "") + (self._край_вид(кс[k + 1], 0) or ""))
            if m is None: continue
            да, дб = _db(a[-L:]), _db(b[:L])
            if да < -45 or дб < -45: continue
            δ = float(np.clip((дб - да) - m[0][12], -2 * предел, 2 * предел))
            сдв[k][1] += δ / 2; сдв[k + 1][0] -= δ / 2
        out = []
        for x, (gн, gк) in zip(звуки, сдв):
            if abs(gн) < 0.3 and abs(gк) < 0.3: out.append(x); continue
            n = len(x); g = np.zeros(n); r = min(R_, n // 2)
            if r > 0:
                g[:r] += gн * (1 - np.arange(r) / r); g[n - r:] += gк * (np.arange(r) / r)
            out.append((x * 10 ** (g / 20)).astype(np.float32))
        return out

    @staticmethod
    def _окраска(x, n_fft=1024):
        """Долговременная огибающая спектра громких мест куска (лог-амплитуда по полосам 1/3 октавы) или None."""
        fr = int(SR * 0.02); n = len(x) // fr
        if n < 4: return None
        e = 10 * np.log10(np.mean(x[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10)
        кадры = [x[i * fr:(i + 1) * fr] for i in range(n) if e[i] > e.max() - 25]
        if len(кадры) < 3: return None
        S = np.mean([np.abs(np.fft.rfft(k * np.hanning(fr), n_fft)) ** 2 for k in кадры], axis=0) + 1e-10
        f = np.fft.rfftfreq(n_fft, 1 / SR); края = 100 * 2 ** (np.arange(0, 22) / 3)   # 100 Гц … ~12 кГц
        return np.array([10 * np.log10(S[(f >= края[i]) & (f < края[i + 1])].mean()) for i in range(len(края) - 1)])

    def _яркость(self, x):
        """Яркость куска: наклон долговременного спектра (дБ на октаву) по громким местам."""
        о = self._окраска(x)
        if о is None: return None
        окт = np.arange(len(о)) / 3; return float(np.polyfit(окт, о, 1)[0])

    def _ровный_тембр(self, звуки, предел=4.0):
        """Каждый кусок: плавная частотная поправка (по полосам), приближающая его долговременную окраску к средней по
        фразе на долю «ровный_тембр»; поправка — гладкая (наклон и кривизна), не больше ±4 дБ."""
        о = [self._окраска(x) for x in звуки]
        есть = [v for v in о if v is not None]
        if len(есть) < 2: return звуки
        ср = np.median(np.array(есть), axis=0); α = float(self.в["ровный_тембр"]); out = []
        окт = np.arange(len(ср)) / 3
        for x, v in zip(звуки, о):
            if v is None or len(x) < 512: out.append(x); continue
            d = np.polyval(np.polyfit(окт, ср - v, 2), окт) * α   # гладкая поправка: только наклон и кривизна
            d = np.clip(d - np.mean(d), -предел, предел)            # громкость не трогаем — только окраску
            n_fft = 1 << int(np.ceil(np.log2(len(x) + 1)))
            f = np.fft.rfftfreq(n_fft, 1 / SR); центры = 100 * 2 ** ((np.arange(len(d)) + 0.5) / 3)
            g = np.interp(np.log2(np.maximum(f, 50)), np.log2(центры), d)
            X = np.fft.rfft(x, n_fft) * 10 ** (g / 20)
            out.append(np.fft.irfft(X, n_fft)[:len(x)].astype(np.float32))
        return out

    @staticmethod
    def _громкость_речи(x):
        """Громкость куска по его громким местам (кадры 10 мс не тише пика на 30 дБ) — паузы и смычки не тянут вниз."""
        fr = int(SR * 0.01); n = len(x) // fr
        if n < 2: return _db(x)
        e = 10 * np.log10(np.mean(x[:n * fr].reshape(n, fr) ** 2, axis=1) + 1e-10)
        гр = e[e > e.max() - 30]
        return float(10 * np.log10(np.mean(10 ** (гр / 10))))

    @staticmethod
    def _уровень(x):
        """Уровень высоты куска — медиана звонких кадров (полутоны от 100 Гц) или None."""
        import psola
        if len(x) < SR // 20: return None
        f, _ = psola._f0_дорожка(x); v = f[f > 0]
        return 12 * math.log2(float(np.median(v)) / 100.0) if len(v) >= 3 else None

    def _мелодия_фразы(self, звуки, предел=3.0):
        """Ровная мелодия: уровни высоты кусков подтягиваются к плавной линии по всей фразе (прямая по времени —
        естественное понижение к концу), на долю «мелодия_фразы»; последний кусок (интонация конца) — вдвое слабее."""
        import psola
        ур = [self._уровень(x) for x in звуки]; t = np.cumsum([0] + [len(x) for x in звуки[:-1]]) + np.array([len(x) / 2 for x in звуки])
        есть = [k for k, u in enumerate(ур) if u is not None]
        if len(есть) < 3: return звуки
        A = np.vstack([t[есть], np.ones(len(есть))]).T; коэф = np.linalg.lstsq(A, np.array([ур[k] for k in есть]), rcond=None)[0]
        α = float(self.в["мелодия_фразы"]); out = []
        for k, x in enumerate(звуки):
            if ур[k] is None: out.append(x); continue
            цель = коэф[0] * t[k] + коэф[1]; d = float(np.clip((цель - ур[k]) * α * (0.5 if k == len(звуки) - 1 else 1.0), -предел, предел))
            out.append(psola.сдвинуть(x, d) if abs(d) > 0.2 else x)
        return out

    def _звуки_куска(self, кусок, какие):
        """Отрезки (в отсчётах от начала куска) звуков из множества «какие» по разметке."""
        ri, s_, e_, j, вид, o = кусок; r = self.V.recs[ri]
        if вид != "o" or "ph" not in r: return []
        ws = r["w"]; j0 = next((q for q in range(j, -1, -1) if abs(ws[q][1] - s_) < 0.03), j); out = []
        for q in range(j0, j + 1):
            for ph in r["ph"][q]:
                if ph[0] in какие: out.append((int((ph[2] - s_) * SR), int((ph[3] - s_) * SR)))
        return out

    def _плавная_высота(self, звуки, предел=4.0, кс=None):
        """Высота на стыках — без скачка: на каждом стыке края сводятся навстречу (по половине разницы), сдвиг плавно
        спадает к нулю за 150 мс внутрь куска; сдвиг — PSOLA (без изменения тембра и длительности)."""
        import psola
        края = []
        for x in звуки:   # высота краёв — по дорожке куска с поправкой октавы: медиана первых/последних 3 звонких кадров
            f, _ = psola._f0_дорожка(x) if len(x) > SR // 20 else (np.zeros(1), 0)
            v = np.where(f > 0)[0]
            if len(v) < 2: края.append((0, 0)); continue
            a = float(np.median(f[v[:3]])) if v[0] <= 4 else 0.0
            b = float(np.median(f[v[-3:]])) if v[-1] >= len(f) - 5 else 0.0
            if self.в.get("высота_надёжно") and len(f) >= 3:
                # надёжная высота краёв: только громкие кадры (не тише пика на 15 дБ), звонкий участок ≥ 3 кадров,
                # примыкающий к краю (≤ 50 мс); оценка дальше 6 пт от средней высоты слова — не верить (сбой на хвосте)
                ee = np.array([np.sqrt(np.mean(x[i * 240:i * 240 + 480] ** 2) + 1e-10) for i in range(len(f))])
                гр = 20 * np.log10(ee / ee.max()) > -float(self.в.get("высота_порог_дб", 15)); зв = (f > 0) & гр
                мед = float(np.median(f[зв])) if зв.sum() >= 3 else 0.0
                def край_надёжно(порядок):
                    i0 = None
                    for q in порядок[:5]:
                        if зв[q]: i0 = q; break
                    if i0 is None or мед <= 0: return 0.0
                    run = []
                    q = i0
                    for q in порядок[порядок.index(i0):]:
                        if not зв[q]: break
                        run.append(f[q])
                    if len(run) < 3: return 0.0
                    v = float(np.median(run[:3]))
                    return v if abs(12 * math.log2(v / мед)) <= 6 else 0.0
                if self.в["высота_надёжно"] == 2:   # прежняя оценка, но далёкая от средней высоты слова — сбой: не верить
                    if мед > 0:
                        if a > 0 and abs(12 * math.log2(a / мед)) > 6: a = 0.0
                        if b > 0 and abs(12 * math.log2(b / мед)) > 6: b = 0.0
                else:
                    a = край_надёжно(list(range(len(f)))); b = край_надёжно(list(range(len(f) - 1, -1, -1)))
            if self.в.get("высота_край") and len(x) > SR // 10:
                # у самого края: кадры по 5 мс в 5–30 мс от края (как слышно на стыке), не меньше двух звонких
                f5, h5 = psola._f0_дорожка(x, hop=120); t5 = np.arange(len(f5)) * h5; n = len(x)
                пп = f5[(t5 >= int(SR * 0.005)) & (t5 <= int(SR * 0.03))]; пп = пп[пп > 0]
                кк = f5[(t5 >= n - int(SR * 0.03)) & (t5 <= n - int(SR * 0.005))]; кк = кк[кк > 0]
                if len(пп) >= 2: a = float(np.median(пп))
                if len(кк) >= 2: b = float(np.median(кк))
            края.append((a, b))
        сдв = [[0.0, 0.0] for _ in звуки]
        for k in range(len(звуки) - 1):
            b, a = края[k][1], края[k + 1][0]
            if b > 0 and a > 0:
                d0 = 12 * math.log2(b / a)
                if self.в.get("октава_точно"):
                    # ошибка октавы — только около 12 пт (тогда исправляется остаток); настоящие скачки 5–9 пт
                    # (слово из взволнованной фразы рядом со спокойным) — исправляются до предела
                    if 10 <= abs(d0) <= 14: d0 -= 12 * np.sign(d0)
                    elif abs(d0) > 14: d0 = 0.0
                    d = float(np.clip(d0, -2 * предел, 2 * предел))
                else:
                    d = float(np.clip(d0, -2 * предел, 2 * предел))
                    if abs(d) > 7: d = 0.0   # вероятная ошибка октавы — не трогать
                d *= self.в.get("сгладить_доля", 1.0)   # какую долю скачка убирать (живая речь тоже не ровная)
                зона = self.в.get("сгладить_зона", 0.0)   # естественный скачок не трогать — убирать только избыток
                d = float(np.sign(d) * max(0.0, abs(d) - зона))
                пр_ = self.в.get("сгладить_предел", 3.0); h_ = float(np.clip(d / 2, -пр_, пр_))
                сдв[k][1] = -h_; сдв[k + 1][0] = h_
        out = []
        R_ = int(SR * 0.15)
        for x, (sн, sк) in zip(звуки, сдв):
            пор = self.в.get("сгладить_порог", 0.15)
            if abs(sн) < пор and abs(sк) < пор: out.append(x); continue
            n = len(x); c = np.zeros(n)
            if n < 2 * R_: c = np.linspace(sн, sк, n)
            else:
                c[:R_] = sн * (1 - np.arange(R_) / R_); c[n - R_:] = sк * (np.arange(R_) / R_)
            нт = None
            if кс is not None and self.в.get("р_без_сдвига"):
                нт = self._звуки_куска(кс[len(out)], {"р", "Р", "р'", "Р'", "рь", "Рь"}) or None
            out.append(psola.сдвинуть(x, c, нт))
        return out

    @staticmethod
    def _сгладить_высоту(звуки, предел=2.5):
        L = int(SR * 0.04)
        края = []
        for x in звуки:
            a = _yin_f0(x[int(SR * 0.005):int(SR * 0.005) + L]) if len(x) > L + 120 else 0
            b = _yin_f0(x[-L - 120:-120]) if len(x) > L + 120 else 0
            края.append((a, b))
        # сдвиги s_k (полутона): минимизировать Σ(конец_k + s_k − начало_{k+1} − s_{k+1})² + λ·Σ s_k²
        n = len(звуки); A = np.eye(n) * 0.5; rhs = np.zeros(n)
        for k in range(n - 1):
            b, a = края[k][1], края[k + 1][0]
            if b > 0 and a > 0:
                d = 12 * math.log2(b / a)        # насколько конец k выше начала k+1
                # (s_k − s_{k+1} + d)² → по s_k: +, по s_{k+1}: −
                A[k, k] += 1; A[k + 1, k + 1] += 1; A[k, k + 1] -= 1; A[k + 1, k] -= 1
                rhs[k] -= d; rhs[k + 1] += d
        try: сдв = np.clip(np.linalg.solve(A, rhs), -предел, предел)
        except Exception: return звуки
        out = []
        for x, st in zip(звуки, сдв):
            if abs(st) < 0.15 or len(x) < 200: out.append(x); continue
            k = 2 ** (st / 12)                    # выше на st полутонов — читать быстрее в k раз
            idx = np.arange(0, len(x) - 1, k)
            out.append(np.interp(idx, np.arange(len(x)), x).astype(np.float32))
        return out

    @staticmethod
    def темп(y, k):
        """Ускорить речь в k раз (k>1 — быстрее) без изменения высоты: WSOLA, окно 30 мс, поиск совпадения ±8 мс."""
        if abs(k - 1) < 0.02 or len(y) < SR // 10: return y
        N = int(SR * 0.03); H = N // 2; tol = int(SR * 0.008)
        win = np.hanning(N).astype(np.float32)
        n_out = int(len(y) / k) + N
        out = np.zeros(n_out + N, dtype=np.float32); norm = np.zeros_like(out)
        pos_in, pos_out, prev = 0.0, 0, None
        while True:
            c = int(pos_in)
            if c + N + tol >= len(y) or pos_out + N >= len(out): break
            if prev is None: d = 0
            else:
                best, d = -1e9, 0
                for dd in range(-tol, tol + 1, 2):
                    a0 = c + dd
                    if a0 < 0: continue
                    v = float(np.dot(y[a0:a0 + N], prev))
                    if v > best: best, d = v, dd
            a0 = max(0, c + d); seg = y[a0:a0 + N]
            out[pos_out:pos_out + N] += seg * win; norm[pos_out:pos_out + N] += win
            prev = y[a0 + H:a0 + H + N] if a0 + H + N <= len(y) else y[a0:a0 + N]
            pos_in += H * k; pos_out += H
        norm[norm < 1e-3] = 1.0
        return (out / norm)[:pos_out + H]

    @staticmethod
    def темп_умный(y, k, сила=0.7):
        """Ускорение в k раз с сохранением согласных: переходы (спектр быстро меняется) сжимаются слабо, тянущиеся
        гласные и паузы — сильнее; общая длина — как задано. WSOLA с переменным шагом чтения."""
        if abs(k - 1) < 0.02 or len(y) < SR // 10: return y
        hop = int(SR * 0.01); n = len(y) // hop
        if n < 4: return Синтезатор.темп(y, k)
        M = np.array([_mfcc(y[i * hop:i * hop + 2 * hop])[1:] for i in range(n)]); En = np.array([_db(y[i * hop:i * hop + hop]) for i in range(n)])
        поток = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]
        поток = np.convolve(поток, np.ones(3) / 3, "same"); пн = поток / (np.percentile(поток, 95) + 1e-9)
        тихо = En < En.max() - 35
        ровно = np.clip(1 - пн, 0, 1) ** 1.5
        вес = np.where(тихо, 1.6, ровно * сила + (1 - сила) * 0.5)   # чем больше, тем сильнее сжимать участок
        # скорость участка s_i = 1 + a·вес_i; a — чтобы общая длина стала len/k
        lo, hi = 0.0, 20.0
        for _ in range(40):
            a = (lo + hi) / 2; dur = np.sum(1.0 / (1 + a * вес))
            if dur > n / k: lo = a
            else: hi = a
        скор = 1 + a * вес
        N = int(SR * 0.024); H = N // 2; tol = int(SR * 0.006); win = np.hanning(N).astype(np.float32)
        out = np.zeros(int(len(y) / k) + 4 * N, dtype=np.float32); norm = np.zeros_like(out)
        pos_in, pos_out, prev = 0.0, 0, None
        while True:
            c = int(pos_in)
            if c + N + tol >= len(y) or pos_out + N >= len(out): break
            d = 0
            if prev is not None:
                best = -1e9
                for dd in range(-tol, tol + 1, 2):
                    a0 = c + dd
                    if a0 < 0: continue
                    v = float(np.dot(y[a0:a0 + N], prev))
                    if v > best: best, d = v, dd
            a0 = max(0, c + d); seg = y[a0:a0 + N]
            out[pos_out:pos_out + N] += seg * win; norm[pos_out:pos_out + N] += win
            prev = y[a0 + H:a0 + H + N] if a0 + H + N <= len(y) else y[a0:a0 + N]
            pos_in += H * скор[min(n - 1, c // hop)]; pos_out += H
        norm[norm < 1e-3] = 1.0
        return (out / norm)[:pos_out + H]

    def сказать(self, текст, скорость=1.0):
        части, отчёт = [], []; self.стыки = []; self.стыки_виды = []; поз = int(SR * 0.10)
        self._скорость = скорость; факт = обычно = 0.0
        for от in текст_в_отрезки(текст):
            x, res, кс = self.отрезок(от["w"], от["end"])
            for u in res:   # естественная длина выбранных слов против обычной у диктора
                if u[0] == "o":
                    o = u[1]; факт += self.V.dur[o]; обычно += self.V.медиана.get(self.V.w(o)[0]) or self.V.dur[o]
            self.стыки += [поз + p for p in getattr(self, "стыки_отрезка", [])]; self.стыки_виды += list(getattr(self, "виды_отрезка", []))
            поз += len(x) + int(SR * ПАУЗА.get(от["end"], 0.2))
            части.append(x); части.append(np.zeros(int(SR * ПАУЗА.get(от["end"], 0.2))))
            отчёт.append({"слова": от["w"], "кусков": len(кс), "вне базы": [w for w, u in zip(от["w"], res) if u[0] == "часть"]})
        if части: части = части[:-1]
        # тишина по краям, как в записях Gemini: 100 мс до и 200 мс после — последнее слово успевает договориться
        части = [np.zeros(int(SR * 0.10))] + части + [np.zeros(int(SR * 0.20))]
        y = np.concatenate(части)
        # −18 LUFS приближённо: по средней громкости речи
        речь = y[np.abs(y) > 1e-4]
        if len(речь):
            g = -20.5 - _db(речь); y = y * 10 ** (g / 20)
        if скорость != 1.0 and self.в.get("быстрые") and обычно > 0:
            # выбранные вхождения уже быстрее обычного — сжать настолько меньше (заданная скорость сохраняется)
            скорость = max(1.0, скорость * факт / обычно) if скорость > 1 else скорость
        if скорость != 1.0:
            if self.в.get("темп_звуки") and скорость > 1:
                import psola; y = psola.темп(y.astype(np.float32), self._темп_по_звукам(y, скорость))
            elif self.в.get("темп_psola"):
                import psola; y = psola.темп(y.astype(np.float32), скорость)
            else: y = (self.темп_умный if self.в["умный_темп"] else self.темп)(y.astype(np.float32), скорость)
        пик = np.max(np.abs(y)) + 1e-9
        if пик > 0.89: y = y * 0.89 / пик
        return y.astype(np.float32), отчёт
