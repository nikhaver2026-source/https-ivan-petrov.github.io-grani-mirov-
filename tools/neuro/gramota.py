"""gramota.py — проверка грамоты описаний для отбора лучшего варианта Описателя (вне игры): по словарю pymorphy3
находит выдуманные слова, несогласованные пары «прилагательное + существительное», падеж после предлога, глагол
сразу после предлога, повтор
одного корня и обрыв фразы. ошибки(о, свои="") → список (вид ошибки, слово); свои — имя и черты (их слова не выдуманы)."""
import re, functools

СЛОВО = re.compile(r"[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*")
# предлог → допустимые падежи следующего слова (gen2/acc2/loc2 сводятся к основным)
ПРЕДЛОГИ = {
    "в": "accs loct", "во": "accs loct", "на": "accs loct", "над": "ablt", "надо": "ablt", "под": "ablt accs",
    "подо": "ablt accs", "за": "accs ablt", "перед": "ablt", "пред": "ablt", "между": "ablt gent", "меж": "ablt gent",
    "с": "ablt gent accs", "со": "ablt gent accs", "из": "gent", "изо": "gent", "от": "gent", "ото": "gent",
    "до": "gent", "без": "gent", "у": "gent", "для": "gent", "из-за": "gent", "из-под": "gent", "среди": "gent",
    "около": "gent", "вокруг": "gent", "возле": "gent", "вдоль": "gent", "после": "gent", "кроме": "gent",
    "мимо": "gent", "против": "gent", "позади": "gent", "внутри": "gent", "вне": "gent", "посреди": "gent",
    "вглубь": "gent", "сквозь": "accs", "через": "accs", "про": "accs", "о": "loct accs",
    "об": "loct accs", "обо": "loct accs", "при": "loct", "по": "datv loct accs", "к": "datv", "ко": "datv",
}
СВОД = {"gen2": "gent", "acc2": "accs", "loc2": "loct", "gen1": "gent", "loc1": "loct"}
ПРИЛ = {"ADJF", "PRTF"}
ИМЕН = {"NOUN", "NPRO"}
ГЛАГ = {"VERB", "INFN"}
ЗНАЧ = {"NOUN", "ADJF", "ADJS", "VERB", "INFN", "PRTF", "PRTS", "GRND", "ADVB"}
_морф = None


def морф():
    global _морф
    if _морф is None:
        import pymorphy3
        _морф = pymorphy3.MorphAnalyzer()
    return _морф


@functools.lru_cache(maxsize=200000)
def разборы(w):
    return tuple(морф().parse(w))  # все разборы, и редкие («с ним» — творительный при счёте 0,008)


@functools.lru_cache(maxsize=200000)
def известно(w):
    return морф().word_is_known(w)


def _падеж(p):
    c = p.tag.case
    return СВОД.get(c, c)


def _согласны(a, b):
    """есть ли разбор прилагательного a и существительного b, согласованный по числу, падежу и (в ед. ч.) роду"""
    for pa in разборы(a):
        if pa.tag.POS not in ПРИЛ:
            continue
        for pb in разборы(b):
            if pb.tag.POS not in ИМЕН or _падеж(pa) != _падеж(pb):
                continue
            if pa.tag.number != pb.tag.number and pb.tag.number is not None:
                continue
            if pa.tag.number == "sing" and pb.tag.gender is not None and "Ms-f" not in pb.tag and pa.tag.gender != pb.tag.gender:
                continue
            return True
    return False


def _только(w, чт):
    рз = разборы(w)
    return bool(рз) and all(p.tag.POS in чт for p in рз)


def ошибки(о, свои=""):
    сл = СЛОВО.findall(о); ниж = [w.lower() for w in сл]
    свои_сл = {w.lower() for w in СЛОВО.findall(свои)}
    ош = []
    for w, n in zip(сл, ниж):
        if len(n) > 3 and n not in свои_сл and not известно(n) and not (w[0].isupper() and w != сл[0]):
            ош.append(("выдумано", w))
    for i in range(len(ниж) - 1):
        a, b = ниж[i], ниж[i + 1]
        if a in ПРЕДЛОГИ and b not in свои_сл:
            мож = set(ПРЕДЛОГИ[a].split())
            рз = [p for p in разборы(b) if p.tag.POS in ИМЕН | ПРИЛ]
            if рз and len(рз) == len(разборы(b)) and not any(_падеж(p) in мож for p in рз):
                ош.append(("падеж", a + " " + b))
            elif _только(b, ГЛАГ):
                ош.append(("предлог", a + " " + b))
        if _только(a, ПРИЛ) and _только(b, ИМЕН) and b not in свои_сл and not _согласны(a, b):
            ош.append(("согласие", a + " " + b))
    корни = {}
    for n in ниж:
        if len(n) < 4:
            continue
        p = разборы(n)[0]
        if p.tag.POS in ЗНАЧ:
            корни.setdefault(p.normal_form, 0); корни[p.normal_form] += 1
    ош += [("повтор", к) for к, c in корни.items() if c > 1]
    if о and о.rstrip()[-1:] not in ".!?…»":
        ош.append(("обрыв", о[-12:]))
    if len(сл) < 4:
        ош.append(("коротко", о))
    return ош
