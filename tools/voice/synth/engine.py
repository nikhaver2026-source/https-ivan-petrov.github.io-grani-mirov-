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
    w = []
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
        self.исключено = len(искл_ri)
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
        a, sr = sf.read(f + ".flac" if f.startswith("/") else f"{R}/sounds/{f if '/' in f else self.D + '/' + f}.flac", dtype="float32")
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
                      длина=1.0, стык=1.0, знак=1.2, чистота=3.0, сгладить=2, мелодия=0.15, пауза_стык=0, края=3, запас_нач=0.005, запас_кон=0.025, звуки_цель=0.6, дифоны=1, гладкий_стык=0, плавный_стык=10, шов_уч=0.5, громкость_шов=1, ровный_темп=0, поток=0, стык_продлить=0, цепь_коротких=0, встык=1, сжать_тишину=1, тишина_нач=0.06, тишина_кон=0.03, короткие=1.0, умный_темп=0, учёный=2, плохие_в_части=0, по_звукам=1, f0_слух=0.08, пауза_внутри=0.5, f0=0.12, громк=0.08, спектр=0.02, K=60, часть=4.0)
        if веса: self.в.update(веса)
        self.скачки = []
        pj = f"{ТУТ}/join_{голос}.json"; self.шов = None
        if os.path.exists(pj):
            j_ = json.load(open(pj, encoding="utf-8"))
            self.шов = {k: (np.array(v["mu"]), np.array(v["sd"])) for k, v in j_["пары"].items()}; self.шов_мед = j_["медиана_живых"]
        p = self.в.get("уч_файл") or f"{ТУТ}/learned_{голос}.json"
        self.уч = json.load(open(p, encoding="utf-8"))["w"] if os.path.exists(p) else None
        if self.уч:   # признаки, которые не могут «помогать» (иначе движок нарочно выберет грубый стык), — не ниже нуля
            for k in ("f0_л", "f0_п", "громк_л", "громк_п", "спектр_л", "спектр_п", "мелодия_откл", "класс_л", "класс_п",
                      "знак_несовп", "длина_откл", "середина_как_конец", "чистота", "непроверено", "звуки_несовп", "край_л", "край_п", "разм_плохо"):
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

    def цена_единицы(self, o, слова, i, end):
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
            if self.в.get("цепь_коротких") and r1 == r2 and j2 == j1 + 1 and min(len(self.V.w(o1)[0]), len(self.V.w(o2)[0])) <= 2:
                c -= self.в["цепь_коротких"]   # «в лесу», «и вот»: служебное слово — вместе с соседом из той же записи
            if self.в["учёный"] == 2:   # скачок высоты слышит человек, а не распознаватель — ручная плата
                r1, j1 = self.V.occ[o1]; r2, j2 = self.V.occ[o2]
                if not (r1 == r2 and j2 == j1 + 1):
                    a, b = self.V.f0e[o1], self.V.f0s[o2]
                    if a > 0 and b > 0: c += self.в["f0_слух"] * min(12.0, abs(12 * math.log2(a / b)))
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
                for o in канд[k]:
                    u = self.цена_единицы(o, слова, k, end)
                    p, v = min(((po, pv[0] + self.цена_стыка(po, o)) for po, pv in best[-1].items()), key=lambda x: x[1])
                    cur[o] = (v + u, p)
                best.append(cur)
            o = min(best[-1], key=lambda x: best[-1][x][0]); путь = [o]
            for k in range(len(best) - 1, 0, -1): o = best[k][o][1]; путь.append(o)
            путь.reverse()
            for k, o in enumerate(путь): res[i + k] = ("o", o)
            i = j
        return res

    def из_частей(self, слово, лев="", прав=""):
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

        def вхождения(sub):
            r = кэш.get(sub)
            if r is None:
                r = []; p = Sx.find(sub)
                while p >= 0 and len(r) < 400:
                    if len(sub) == 1 or float(пром[p:p + len(sub) - 1].max()) < 0.03: r.append(p)
                    p = Sx.find(sub, p + 1)
                кэш[sub] = r
            return r

        def цена_куска(p, L, m1, m2, a, b):
            c = 1.0
            if m1 < 0: c += 0.0 if wi[p] else 0.6
            else:
                if a > 0 and p > 0:
                    c += -0.3 if Sx[p - 1] == P[a - 1] else (0.2 if кл(Sx[p - 1]) != кл(P[a - 1]) else 0.0)
            q = p + L - 1
            if m2 >= n: c += 0.0 if wf[q] else 0.6
            else:
                if b + 1 < n and q + 1 < len(Sx):
                    c += -0.3 if Sx[q + 1] == P[b + 1] else (0.2 if кл(Sx[q + 1]) != кл(P[b + 1]) else 0.0)
            return c

        def цена_стыка(q, p):
            c = 0.02 * float(np.linalg.norm(mf[q][1:] - mf[p][1:])) + 0.03 * abs(float(en[q] - en[p]))
            if f0[q] > 0 and f0[p] > 0: c += 0.1 * min(12.0, abs(12 * math.log2(f0[q] / f0[p])))
            return c

        K = 8
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
        def шов(z):   # насколько удобен звук для разреза посередине
            return -0.1 if кл(z) == "к" else 0.3 if z in "jрР" else 0.0
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
                    p0 = ключ.find(sub)
                    while p0 >= 0:
                        q = p0 + L   # после последнего звука части
                        c = 1.0
                        if m1 < 0: c += 0 if p0 == 0 else 0.6
                        else:
                            c += шов(P[m1])
                            if p0 > 0 and m1 > 0:
                                c += -0.3 if ключ[p0 - 1] == P[m1 - 1] else (0.2 if кл(ключ[p0 - 1]) != кл(P[m1 - 1]) else 0.0)
                        if m2 >= n: c += 0 if q == len(ключ) else 0.6
                        else:
                            c += шов(P[m2])
                            if q < len(ключ) and m2 + 1 < n:
                                c += -0.3 if ключ[q] == P[m2 + 1] else (0.2 if кл(ключ[q]) != кл(P[m2 + 1]) else 0.0)
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
            # точная разметка звуков: край — граница звука; в паузу источника — чуть-чуть (нарастание и затухание)
            if j0 > 0: s = ws[j0][1] - min(ws[j0][3], self.в["запас_нач"])
            if j1 < len(ws) - 1: e = ws[j1][2] + min(ws[j1][4], self.в["запас_кон"])
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
    def стык(a, b, L=int(SR * 0.012), сдвиг=int(SR * 0.004)):
        if len(a) < L or len(b) < L + сдвиг: return np.concatenate([a, b])
        хвост = a[-L:]; лучш, лучш_d = -2, 0
        for d in range(0, сдвиг, 4):
            голова = b[d:d + L]; den = np.linalg.norm(хвост) * np.linalg.norm(голова) + 1e-9
            c = float(np.dot(хвост, голова) / den)
            if c > лучш: лучш, лучш_d = c, d
        b = b[лучш_d:]
        t = np.linspace(0, np.pi / 2, L); fo, fi = np.cos(t), np.sin(t)
        return np.concatenate([a[:-L], a[-L:] * fo + b[:L] * fi, b[L:]])

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
            звуки.append(x)
        # ровный темп: каждый кусок — к общему темпу отрезка (доля от обычной длины этих слов у диктора)
        if self.в.get("ровный_темп") and len(звуки) > 1:
            звуки = self._ровный_темп(звуки, кс)
        # высота голоса на стыках — без скачков: каждому куску небольшой сдвиг (не больше 1,5 полутона)
        if self.в["сгладить"] == 2 and len(звуки) > 1:
            звуки = self._плавная_высота(звуки)
        elif self.в["сгладить"] and len(звуки) > 1:
            звуки = self._сгладить_высоту(звуки)
        # мера плавности: скачки высоты на стыках (полутона)
        L = int(SR * 0.04)
        for x, y in zip(звуки, звуки[1:]):
            b = _yin_f0(x[-L - 120:-120]) if len(x) > L + 120 else 0; a = _yin_f0(y[120:120 + L]) if len(y) > L + 120 else 0
            if a > 0 and b > 0: self.скачки.append(abs(12 * math.log2(b / a)))
        # громкость соседних кусков — без скачков
        уровни = [_db(x) for x in звуки if len(x)]
        if уровни:
            ц = float(np.median(уровни))
            for k, x in enumerate(звуки):
                if len(x): g = np.clip(ц - _db(x), -6, 6) * 0.6; звуки[k] = x * 10 ** (g / 20)
        # громкость на каждом стыке — к перепаду, как на живом стыке у диктора между такими звуками (плавно, 100 мс)
        if self.в.get("громкость_шов") and self.шов and len(звуки) > 1:
            звуки = self._громкость_швов(звуки, кс)
        # тишина на стыках — не длиннее естественной: смычка перед согласным ≤ 50 мс, хвост слова ≤ 20 мс
        if self.в["сжать_тишину"]:
            звуки = [self._тишина_краёв(x, k > 0, k < len(звуки) - 1, self.в["тишина_нач"], self.в["тишина_кон"]) for k, x in enumerate(звуки)]
        out = звуки[0] if звуки else np.zeros(1)
        пз = int(SR * self.в["пауза_стык"] / 1000); стыки = []
        for k, x in enumerate(звуки[1:], 1):
            стыки.append(len(out))
            if пз > 0:   # короткая тишина между кусками из разных записей — слова не слипаются
                f = min(int(SR * 0.004), len(out) // 2, len(x) // 2)
                if f > 0: out = out.copy(); out[-f:] *= np.linspace(1, 0, f); x = x.copy(); x[:f] *= np.linspace(0, 1, f)
                out = np.concatenate([out, np.zeros(пз, dtype=np.float32), x])
            elif кс[k - 1][4] == "ч" and кс[k][4] == "ч" and кс[k - 1][5] and кс[k][5] and кс[k - 1][5][1] and кс[k][5][0]:
                out = self.стык(out, x)   # разрез посередине звука: волны похожи — плавное перекрытие
            elif self.в.get("плавный_стык"):
                # плавный стык везде: перекрытие с подбором совпадения волны (края — точно по звукам, так что
                # перекрытие приходится на сам переход, а не на взрыв согласного)
                L = int(SR * self.в["плавный_стык"] / 1000)
                if len(out) > 3 * L and len(x) > 3 * L:
                    стыки[-1] = len(out) - L // 2; out = self.стык(out, x, L=L, сдвиг=int(SR * 0.004))
                else: out = self.встык(out, x)
            elif self.в.get("гладкий_стык") and self._звонкий_край(кс[k - 1], -1) and self._звонкий_край(кс[k], 0):
                # гласные и сонорные с обеих сторон: короткое перекрытие с подбором волны — без щелчка-«согласного»
                L = int(SR * self.в["гладкий_стык"] / 1000); out = self.стык(out, x, L=L, сдвиг=int(SR * 0.004))
            elif self.в["встык"]: out = self.встык(out, x)
            else: out = self.стык(out, x)
        # края: короткое нарастание и затухание
        f = min(len(out) // 4, int(SR * 0.006))
        if f > 0: out[:f] *= np.linspace(0, 1, f); out[-f:] *= np.linspace(1, 0, f)
        self.стыки_отрезка = стыки
        return out, res, кс

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
            if abs(k - 1) <= 0.04: out.append(x); continue
            # запас тишины в конце: WSOLA не дочитывает последние 40 мс — окончание не должно пропасть
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

    def _плавная_высота(self, звуки, предел=4.0):
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
            края.append((a, b))
        сдв = [[0.0, 0.0] for _ in звуки]
        for k in range(len(звуки) - 1):
            b, a = края[k][1], края[k + 1][0]
            if b > 0 and a > 0:
                d = float(np.clip(12 * math.log2(b / a), -2 * предел, 2 * предел))
                if abs(d) > 7: d = 0.0   # вероятная ошибка октавы — не трогать
                сдв[k][1] = -d / 2; сдв[k + 1][0] = d / 2
        out = []
        R_ = int(SR * 0.15)
        for x, (sн, sк) in zip(звуки, сдв):
            if abs(sн) < 0.15 and abs(sк) < 0.15: out.append(x); continue
            n = len(x); c = np.zeros(n)
            if n < 2 * R_: c = np.linspace(sн, sк, n)
            else:
                c[:R_] = sн * (1 - np.arange(R_) / R_); c[n - R_:] = sк * (np.arange(R_) / R_)
            out.append(psola.сдвинуть(x, c))
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
        части, отчёт = [], []; self.стыки = []; поз = int(SR * 0.10)
        for от in текст_в_отрезки(текст):
            x, res, кс = self.отрезок(от["w"], от["end"])
            self.стыки += [поз + p for p in getattr(self, "стыки_отрезка", [])]
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
        if скорость != 1.0: y = (self.темп_умный if self.в["умный_темп"] else self.темп)(y.astype(np.float32), скорость)
        пик = np.max(np.abs(y)) + 1e-9
        if пик > 0.89: y = y * 0.89 / пик
        return y.astype(np.float32), отчёт
