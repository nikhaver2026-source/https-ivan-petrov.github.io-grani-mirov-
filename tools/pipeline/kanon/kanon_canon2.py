"""kanon_canon2.py — канон II (Альфа 1.5) в данные краёв: озёра, реки, моря, горы, архипелаги, подводье, города с
кварталами, расы и народы, боги, твари, вещи, ресурсы и люди. Каждый из 17 пакетов II ложится в свой край канона I
(kk_NN): его твари встают в край, вещи — у людей края, город — среди поселений, места природы — вокруг земли края.
  build2(canon2, world, cre, items, ctx) → (твари, вещи, ошибки); world правится на месте."""
import hashlib, re, json, glob, os
import pymorphy3

M = pymorphy3.MorphAnalyzer()
C2 = "/root/S/lit/canon2"


def hid(p, name): return p + str(int(hashlib.md5(name.encode()).hexdigest(), 16) % 100000)
def h6(name): return int(hashlib.md5(name.encode()).hexdigest()[:6], 16)
def lc1(s): return s[:1].lower() + s[1:] if s and not s[:2].isupper() else s


def load():
    out = []
    for f in sorted(glob.glob(f"{C2}/[0-9][0-9]_*2.jsonl")):
        pk = os.path.basename(f)[:2]
        for l in open(f, encoding="utf-8"):
            z = json.loads(l); z["пакет"] = pk; out.append(z)
    return out


# ── родительный падеж (трофей «клык межевого волка»): прилагательные — по роду главного слова ──
ГЕНТ_РУЧ = {"Звонокол": "звонокола", "Цепной змей": "цепного змея", "Мостовой тролль-мытарь": "мостового тролля-мытаря"}

def _gent_noun(w):
    if "-" in w: return "-".join(_gent_noun(x) for x in w.split("-"))
    for p in M.parse(w):
        if "NOUN" in p.tag and "nomn" in p.tag:
            g = p.inflect({"gent", "sing"})
            if g: return g.word.replace("ё", "е") if "ё" not in w else g.word
    lw = w.lower()
    if lw.endswith("й"): return w[:-1] + "я"
    if lw.endswith("ь"): return w[:-1] + "я"
    if lw.endswith("а"): return w[:-1] + ("и" if lw[-2:-1] in "гкхжшщч" else "ы")
    if lw.endswith("я"): return w[:-1] + "и"
    if lw[-1:] in "бвгджзклмнпрстфхцчшщ": return w + "а"
    return w

def _gender(w):
    w0 = w.split("-")[0]
    for p in M.parse(w0):
        if "NOUN" in p.tag and "nomn" in p.tag:
            for g in ("masc", "femn", "neut"):
                if g in p.tag: return g
    return "femn" if w0.lower().endswith(("а", "я")) else "masc"

def gent(name):
    if name in ГЕНТ_РУЧ: return ГЕНТ_РУЧ[name]
    ws = name.split(); head = None
    for i, w in enumerate(ws):
        ps = M.parse(w.split("-")[0])
        if any("NOUN" in p.tag for p in ps) and not any(("ADJF" in p.tag or "PRTF" in p.tag) and p.score > 0.3 for p in ps):
            head = i; break
    if head is None: head = len(ws) - 1
    g = _gender(ws[head]); out = []
    for i, w in enumerate(ws):
        if i < head:
            p = next((p for p in M.parse(w) if "ADJF" in p.tag or "PRTF" in p.tag), None)
            r = p.inflect({"gent", g, "sing"}) if p else None
            out.append(((r.word if "ё" in w else r.word.replace("ё", "е")) if r else w) if i else (((r.word if "ё" in w else r.word.replace("ё", "е")) if r else w)))
        elif i == head: out.append(_gent_noun(w) if w[:1].islower() or i == 0 else w[:1] + _gent_noun(w)[1:])
        else: out.append(w)
    out[0] = out[0][:1].lower() + out[0][1:]
    return " ".join(out)


# ── твари ──
РОД2 = {"Искроглазый сом": "deep", "Копейный волк-одиночка": "beast", "Брошенная кукла-плакальщица": "construct", "Белый мираж-заманщик": "spirit",
        "Галечный водяной": "spirit", "Распадочный леший-путаник": "spirit", "Ключевая выдра-хозяйка": "beast", "Цепной змей": "crawler",
        "Цепной грызун": "beast", "Арочный подменыш": "spirit", "Ковыльная змея-шептунья": "crawler", "Соляная гадюка": "crawler",
        "Мутный сом Межи": "deep", "Зеркальный отблеск": "spirit", "Отражённый двойник": "spirit", "Перевёрнутый фонарщик": "spirit",
        "Соляной утопленник-звонарь": "undead", "Утопленный дозорный": "undead", "Каменный утопленник": "undead", "Отречённый рыцарь-утопленник": "undead",
        "Забойщик в водолазном шлеме": "undead", "Подлёдная хороводница": "spirit", "Лавовый сторож трещины": "construct", "Оплавленный пёс": "beast",
        "Седой вожак Зубцов": "beast", "Корявый водяник": "spirit"}
БИОМ2 = [(r"степ|равнин|пол[ея]\b|луг|курган|межа|пастбищ|ковыл", "plains"), (r"лес|чащ|рощ|тайг|\bбор|опушк|дубрав|глухоман|распад|сопк", "forest"),
         (r"болот|топ[ьи]|трясин|заводь|плавн|канав", "swamp"), (r"пустын|пустош|солонч|бархан|соль|солян|стекл", "desert"),
         (r"гор[ыа]?\b|скал|утёс|осып|перевал|кряж|башн", "mountains"), (r"дорог|тракт|улиц|город|мост|арк|переул|квартал|порог", "road")]
СРЕДА_БИОМ = {"суша": None, "вода": ["swamp", "coast"], "глубь": [], "воздух": ["mountains"], "горы": ["mountains"]}
УМ_ТВАРЕЙ = {"засада", "стая", "тревога", "яд", "ест_чары", "вор", "смена", "зеркало", "звон_ломает", "панцирь", "сети", "морок", "гасит_свет",
             "роет", "трус", "реген", "путает_чары", "оглушает", "пора", "держатель", "крадёт_память", "огонь", "слепой", "мирный"}


def creatures(Z, край, KC, БОГ, ош):
    out = []
    for z in [z for z in Z if z["вид"] == "тварь"]:
        h = h6(z["имя"]); t = (z["имя"] + " " + z["о"]).lower()
        fam = РОД2.get(z["имя"]) or KC.family_of(z)
        if fam == "beast" and z["имя"] not in РОД2 and z["среда"] == "глубь": fam = "deep"
        if fam == "beast" and z["имя"] not in РОД2 and z["среда"] == "воздух": fam = "bird"
        b = СРЕДА_БИОМ.get(z["среда"])
        if b is None:
            тт = t + " " + z.get("механика", "") + " " + z.get("связь", "") + " " + " ".join(z.get("черты", []))
            b = [x for rx, x in БИОМ2 if re.search(rx, тт)] or [край["terr"]]
        elif z["среда"] == "воздух" and край["terr"] not in b: b = b + [край["terr"]]
        ум = [u for u in z.get("повадки", []) if u in УМ_ТВАРЕЙ]
        for u in z.get("повадки", []):
            if u not in УМ_ТВАРЕЙ: ош.append(f"тварь {z['имя']}: повадка {u}")
        lv = int(z.get("уровень", 5))
        rec = dict(id=f"kn_{z['пакет']}_{h % 100000:05d}", n=z["имя"], biomes=list(dict.fromkeys(b)), min=max(1, lv - 3), max=lv + 5, род=fam, умения=ум,
                   о=z["о"], механика=z.get("механика", ""), звукО=z.get("звук", ""), нрав="", охотится="", пакет=z["пакет"],
                   трофей=f"{KC.ТРОФЕЙ.get(fam, 'клык')} {gent(z['имя'])}", канон2=True)
        if z["среда"] == "глубь": rec["глубь"] = True
        rec["snd"], rec["fx"] = KC.ГОЛОС.get(fam, ("mgrowl", "growl"))
        if fam in ("spirit", "undead"): rec["нежить"] = True
        if z["среда"] == "воздух": rec["fly"] = 2 if fam == "bird" else 1
        if "роет" in ум: rec["роет"] = True
        rec["бог"] = БОГ.get(fam, "wood")
        rec["цена"] = int(round(12 + rec["max"] * 6))
        out.append(rec)
    return out


# ── вещи: слот → направление, дело → характеристики и особое ──
ДЕЛО2 = {  # дело канона II → ({характеристика: доля}, [особые канона I или новые], дом)
 "путь_короче": ({"скорость": 1}, [], "run"), "переиграть": ({"здоровье": 0.6}, ["переиграть"], "leg"), "чутьё": ({"чутьё": 1.2}, [], "util"),
 "оберег_день": ({"сопр_тьма": 1}, ["разум"], "spir"), "свет": ({"шк_свет": 0.8}, ["свет"], "myst"), "вода": ({"восст": 1}, ["лечит_час:1"], "alch"),
 "детали": ({"удача": 1}, ["части"], "util"), "пропуск": ({"удача": 0.5}, ["без_пошлины"], "util"), "путает": ({"скрытность": 1}, ["первый_удар"], "myst"),
 "убежище": ({"защита": 0.8}, ["убежище"], "def"), "удача": ({"удача": 1.2}, [], "fact"), "стойк_за_раны": ({"здоровье": 1}, ["стойк_за_раны"], "def"),
 "против_нежити": ({"сила": 0.8}, ["против_нечисти"], "war"), "чует_засаду": ({"чутьё": 0.8}, ["чует_засаду"], "util"),
 "щит_заряды": ({"защита": 1}, ["щит_заряды"], "def"), "весть": ({"удача": 0.4}, ["весть"], "util"), "дыхание": ({"здоровье": 0.6}, ["дыхание"], "elem"),
 "части": ({"сила": 0.5}, ["части"], "war"), "лечит_час": ({"восст": 1}, ["лечит_час:1"], "alch"), "пугает_слабых": ({"сила": 0.8}, ["испуг_побеждённых"], "war"),
 "огонь_удар": ({"шк_огонь": 1, "сила": 0.4}, [], "elem"), "приручение": ({"чутьё": 0.6}, ["питомцы"], "util"), "нежить_мимо": ({"сопр_тьма": 1}, ["против_нечисти"], "spir"),
 "зов_зверя": ({"чутьё": 0.6}, ["питомцы"], "util"), "заслон1": ({"защита": 0.8}, ["заслон1"], "def"),
}
ДЕЛО_НОВ2 = {"дыхание": "под водой дышится дольше: нырять в глубины можно без риска задохнуться"}
РАНГИ = ["необычный", "редкий", "эпический"]


def items(Z, KI, stats, ош):
    out = []
    дело_всё = dict(KI.ДЕЛО); дело_всё.update(ДЕЛО_НОВ2)
    for z in [z for z in Z if z["вид"] == "вещь"]:
        if z["дело"] not in ДЕЛО2: ош.append(f"вещь {z['имя']}: дело {z['дело']}"); continue
        ст, особ, дом = ДЕЛО2[z["дело"]]
        р = 1 + h6(z["имя"]) % 3
        база = {}
        for k, доля in ст.items():
            if k not in stats: ош.append(f"{z['имя']}: нет характеристики {k}"); continue
            v = stats[k] * KI.МОЩЬ[р] * доля
            база[k] = round(v, 3) if k in KI.ДОЛИ else (int(round(v)) or 1)
        дела = [дело_всё[o.split(":")[0]] for o in особ if o.split(":")[0] in дело_всё]
        for o in особ:
            if o.split(":")[0] not in дело_всё: ош.append(f"{z['имя']}: особое {o}")
        out.append(dict(id=hid("kv_", z["имя"]), имя=z["имя"], дом=дом, ранг=р, база=база, особ=особ, дело="; ".join(дела),
                        о=z["о"].rstrip("."), облик="", части="", звукО=z.get("звук", ""), пакет=z["пакет"], слот=z.get("слот", ""), канон2=True))
    return out


ЭФ_БОГ = {"лечение": "стойкость", "мана": "астрал", "весть": "чутьё", "стойкость": "стойкость", "оберег": "оберег", "мощь": "мощь",
          "тишина": "тишина шага", "чутьё": "чутьё", "тепло": "тепло", "клад": "удача", "свет": "ночное зрение", "убежище": "морок",
          "разум": "оберег", "след": "скорость"}
ГЕО = ("озеро", "река", "море", "горы", "архипелаг", "подводье")


def build2(canon2, world, cre, itms, ctx):
    import kanon_creatures as KC, kanon_items as KI, kanon_world as KW
    ош = []
    по = {}
    for z in canon2: по.setdefault(z["пакет"], []).append(z)
    КРАЙ = {k["пакет"]: k for k in world}
    БОГ = ctx["бог_рода"]
    имена_игры = ctx["имена"]
    T2, I2 = [], []
    for pk in sorted(по):
        Z = по[pk]; k = КРАЙ.get(pk)
        if not k: ош.append(f"пакет II {pk}: нет края"); continue
        get = lambda v: [z for z in Z if z["вид"] == v]
        # твари: сухопутные, водные, горные и летучие встают в край; глубинные — только в подводье
        tw = creatures(Z, k, KC, БОГ, ош)
        н = [p["имя"] for p in k["народы"]] + [z["имя"] for z in get("народ") + get("раса")]
        for t in tw: t["кто"] = (f"О них знают {н[0]}" + (f" и {н[1]}" if len(н) > 1 else "") + ".") if н else ""
        T2 += tw
        k["твари"] = k["твари"] + [t["id"] for t in tw if not t.get("глубь")]
        ТВ = {t["n"]: t for t in tw}
        # вещи края II: у людей края II, и клад подводья
        iv = items(Z, KI, ctx["stats"], ош); I2 += iv
        # ресурсы
        РС = {}
        for z in get("ресурс"):
            r = dict(id=hid("kr_", z["имя"]), имя=z["имя"], о=z["о"].rstrip("."), механика=z.get("механика", ""), пора="", почва="",
                     ниши=[KW.pick(KW.НИША, z.get("назначение", "") + " " + z["о"], "heal")], цена=14 + h6(z["имя"]) % 40, где=z.get("где", ""), канон2=True)
            if r["ниши"][0] not in ctx["ниши"]: ош.append(f"ресурс {z['имя']}: ниша {r['ниши'][0]}")
            k["ресурсы"].append(r); РС[z["имя"]] = r
        # места природы
        гео = []; ГЕ = {}
        for z in [z for z in Z if z["вид"] in ГЕО]:
            f = dict(id=hid("kf_", z["имя"]), вид=z["вид"], имя=z["имя"], о=z["о"].rstrip("."), механика=z.get("механика", ""), эф=z.get("эф", "чутьё"),
                     опасность=z.get("опасность"), звукО=z.get("звук", ""), черты=z.get("черты", []))
            for кл in ("течение", "переправа", "высота", "перевал", "характер", "глубина", "нужно", "вода"):
                if кл in z: f[кл] = z[кл]
            гео.append(f); ГЕ[z["имя"]] = (f, z)
        for f, z in ГЕ.values():
            р = z.get("ресурс") or z.get("руда")
            if р:
                if р in РС: f["ресурс"] = РС[р]["id"]
                else:  # ресурс из канона I этого края или другого пакета II
                    r1 = next((r for kk in world for r in kk["ресурсы"] if r["имя"] == р), None)
                    if r1: f["ресурс"] = r1["id"]
                    else: ош.append(f"{f['имя']}: ресурса «{р}» нет")
            if z["вид"] == "подводье":
                w = ГЕ.get(z.get("водоём"))
                if not w: ош.append(f"{f['имя']}: водоёма «{z.get('водоём')}» нет в пакете"); continue
                f["водоём"] = w[0]["id"]; w[0]["подводье"] = f["id"]
                t = ТВ.get(z.get("тварь"))
                if not t: ош.append(f"{f['имя']}: твари «{z.get('тварь')}» нет"); continue
                f["тварь"] = t["id"]
                if not t.get("глубь"): ош.append(f"{f['имя']}: хозяин «{t['n']}» не глубинный")
                f["клад"] = [x["id"] for x in iv]
            if z["вид"] == "архипелаг":
                w = ГЕ.get(z.get("море"))
                if w: f["море"] = w[0]["id"]; w[0]["архипелаг"] = f["id"]
                f["острова"] = [dict(id=hid("ki_", q["имя"]), имя=q["имя"], о=q["о"], эф=q["эф"]) for q in z.get("острова", [])]
        k["гео"] = гео
        # ресурсы находятся у своих мест природы
        for r in [r for r in k["ресурсы"] if r.get("где")]:
            f = ГЕ.get(r["где"])
            if f and not f[0].get("ресурс"): f[0]["ресурс"] = r["id"]
        # город — поселение края с кварталами
        for z in get("город"):
            k["поселения"].append(dict(id=hid("ks_", z["имя"]), имя=z["имя"], kind="город", о=z["о"].rstrip("."), механика=z.get("механика", ""),
                                      товар=z.get("ремесло", ""), нужда="", звукО=z.get("звук", ""), правитель=z.get("правитель", ""), народ2=z.get("народ", ""),
                                      кварталы=[dict(id=hid("kq_", q["имя"]), имя=q["имя"], о=q["о"], эф=q["эф"]) for q in z.get("кварталы", [])], канон2=True))
        # расы и народы
        for z in get("раса") + get("народ"):
            k["народы"].append(dict(id=hid("kn_", z["имя"]), имя=z["имя"], о=z["о"].rstrip("."), механика=z.get("механика", ""), раса=z["вид"] == "раса",
                                    облик=z.get("облик", ""), дар=z.get("дар", ""), эф=z.get("эф", ""), язык=z.get("язык", ""), среда=z.get("среда", ""),
                                    звукО=z.get("звук", ""), канон2=True))
        # боги
        for z in get("бог"):
            д = ЭФ_БОГ.get(z.get("дар", ""), "удача")
            k["боги"].append(dict(id=hid("kg_", z["имя"]), имя=z["имя"], о=z["о"].rstrip("."), механика=z.get("механика", ""), тип=z.get("сфера", ""),
                                  звукО=z.get("звук", ""), дар=д, запрет=z.get("запрет", ""), святилище=z.get("святилище", ""), канон2=True))
        # люди: дело — одолеть сильнейшую сухопутную тварь края II; продают вещи края II
        земные = sorted([t for t in tw if not t.get("глубь")], key=lambda t: -t["max"])
        for i, z in enumerate(get("персонаж")):
            t = земные[i % len(земные)] if земные else None
            k["люди"].append(dict(id=hid("kc_", z["имя"]), имя=z["имя"], роль="знаток края", народ="", нрав="", о=z["о"].rstrip("."), механика=z.get("механика", ""),
                                  звукО=z.get("звук", ""), учит=[], чары=[], продаёт=[x["id"] for x in iv if x["ранг"] <= 3], весть=True,
                                  дело=dict(тварь=t["id"], n=t["n"], награда=60 + t["max"] * 15) if t else None, канон2=True))
    # проверки: имена не повторяются ни между собой, ни с каноном I, ни с игрой
    имена = [t["n"] for t in T2] + [t["трофей"] for t in T2] + [x["имя"] for x in I2]
    for k in world:
        for f in k.get("гео", []): имена.append(f["имя"]); имена += [q["имя"] for q in f.get("острова", [])]
        for s in k["поселения"]:
            if s.get("канон2"): имена.append(s["имя"]); имена += [q["имя"] for q in s.get("кварталы", [])]
        for x in k["народы"] + k["боги"] + k["люди"] + k["ресурсы"]:
            if x.get("канон2"): имена.append(x["имя"])
    from collections import Counter
    for n, c in Counter(имена).items():
        if c > 1: ош.append(f"повтор имени II: {n}")
    старые = {t["n"] for t in cre} | {t["трофей"] for t in cre} | {x["имя"] for x in itms}
    for n in имена:
        if n in старые: ош.append(f"имя II «{n}» уже в каноне I")
        if n in имена_игры: ош.append(f"имя II «{n}» уже в игре")
    ids = [t["id"] for t in T2] + [x["id"] for x in I2]
    if len(set(ids)) != len(ids) or set(ids) & ({t["id"] for t in cre} | {x["id"] for x in itms}): ош.append("повтор id II")
    return T2, I2, ош
