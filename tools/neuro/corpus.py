"""corpus.py — учебный корпус Летописца из таблиц мира (world_tables.json → corpus.jsonl, corpus_stats.txt).

Каждая сущность игры — запись {вид, имя, о, черты}: вид — к какому роду мира относится (бог, народ, тварь, вещь,
ресурс, растение, зелье, чары, земля, держава, поселение, подземелье, здание, находка, персонаж, история, грань…),
имя — как её называют, о — описание или суть, черты — короткие признаки (стихия, край, редкость…), по которым
Летописец потом пишет новое под заданные условия.

  python3 corpus.py <папка данных>
"""
import sys, os, json, re, collections

ВИДЫ = [  # (вид, шаблон имени таблицы) — первое совпадение
    ("бог", r"GOD|PANTHEON|DEIT|БОГ"),
    ("грань", r"GRAN|FACET|GRANI|SEAM|PRK|ГРАН"),
    ("миф", r"MYTH|LEGEND|SAGA|TALE|ЛЕГЕНД"),
    ("история", r"HISTORY|CHRON|EPOCH|ERA|WAR_CAUSE|PEACE"),
    ("держава", r"EMPIRE|REALM|KINGDOM|HOUSES|DYNAST"),
    ("народ", r"RACE|PEOPLE|CLAN|TRIBE|NATION"),
    ("тварь", r"MONSTER|BEAST|FOE|UNDEAD|CREATURE|DK_BEAST|HERD"),
    ("зверь", r"^ZV_|PET|MOUNT"),
    ("чары", r"SPELL|SCHOOL|MAGIC|CURSE|RITE"),
    ("вещь", r"ITEM|ARTIFACT|WEAPON|ARMOR|RELIC|TREASURE|GEAR"),
    ("ресурс", r"RES|ORE|METAL|GEM|CRYSTAL"),
    ("растение", r"PLANT|HERB|FLOWER|TREE"),
    ("зелье", r"POTION|ELIXIR|BREW"),
    ("земля", r"REGION|BIOME|ISLE|ISLAND|MAT_|LAND|OCEAN|WASTE|SEA_TYPES|DIVE"),
    ("поселение", r"VILL|TOWN|CITY|PORT|TAV|MARKET|FORGE_A|SCHOOL_A"),
    ("подземелье", r"DEPTH|DEEP|DUNGEON|INST|CHERTOG|TOWER|SEWER|CAVE|VAULT"),
    ("здание", r"BUILD|HALL|SHOP|TEMPLE|SHRINE"),
    ("находка", r"FIND|PROP|OBJ|DEVICE|MECH|TECH"),
    ("персонаж", r"SOUL|NPC|PROF|MASTER|PREACH|HERO_TEMP|SAINT"),
    ("вера", r"FAITH|DOGMA|FEAST|CULT"),
    ("слух", r"RUMOR|NEWS_|OMEN"),
]
ИМЯ = ["n", "name", "title"]
ОПИС = ["о", "desc", "myth", "hist", "ep", "сфера", "dom", "creed", "девиз", "о2", "суть", "что", "story"]
ЧЕРТЫ = ["тип", "стих", "климат", "кат", "редкость", "нрав", "god", "race", "sym", "культ", "святое", "обряд",
         "biomes", "биомы", "home", "ресурс", "опасность", "магия", "magic", "школа", "материк", "gov", "герб"]
СЛУЖЕБНЫЕ = r"^(SOUND|VOICE|HERO_VOICE|HERO_FIGHT|SAMPLES|GUIDE|ТИК|ZV_LEVEL|NEWS$|LIVE_LINES|GEST|QS|CB_|SET_|AM_|ENC_|BANK|SCENE|FOE_VOICE|PROLOGUE|G$|ZMR|SVD|SPL)"

def вид(имя):
    if re.match(СЛУЖЕБНЫЕ, имя): return None
    for в, ш in ВИДЫ:
        if re.search(ш, имя): return в
    return None

def строка(v):
    if isinstance(v, str): return v.strip()
    if isinstance(v, (int, float)) and not isinstance(v, bool): return str(v)
    if isinstance(v, list) and v and all(isinstance(x, str) for x in v): return ", ".join(v[:4])
    return None

def записи(таблица, вид_, d):
    элементы = d if isinstance(d, list) else list(d.values()) if isinstance(d, dict) else []
    ключи = list(d.keys()) if isinstance(d, dict) else None
    for i, x in enumerate(элементы):
        if isinstance(x, dict):
            имя = next((x[k] for k in ИМЯ if isinstance(x.get(k), str) and 1 < len(x[k]) < 80), None)
            if имя is None and ключи and isinstance(ключи[i], str) and re.search("[а-яё]", ключи[i]): имя = ключи[i]
            if not имя: continue
            о = next((x[k] for k in ОПИС if isinstance(x.get(k), str) and len(x[k]) > 8), "")
            черты = {k: строка(x[k]) for k in ЧЕРТЫ if k in x and строка(x[k])}
            yield {"вид": вид_, "имя": имя.strip(), "о": о.strip()[:400], "черты": черты, "из": таблица}
        elif isinstance(x, str) and re.search("[А-Яа-яЁё]", x) and 2 < len(x) < 60:
            yield {"вид": вид_, "имя": x.strip(), "о": "", "черты": {}, "из": таблица}

# (2-я версия) у видов с именами собственными в корпус попадали черты, желания и поступки («Стравить с соперником»,
# «выдать дочь за хорошего человека» — персонаж; «кража», «слух», «достаток» — поселение): таблицы разбирались по
# названию, а не по смыслу, и Летописец выучил, что имя персонажа — это фраза. Теперь у таких видов остаётся только
# похожее на имя, а настоящие имена добавляются из таблиц игры.
ИМЕННЫЕ = {"персонаж", "поселение", "бог", "грань", "держава"}
def похоже_на_имя(имя):
    w = имя.split()
    if not w or len(w) > 4 or not re.match(r"[А-ЯЁ]", имя) or re.search(r"[,:;!?(){}\[\]0-9«»]", имя): return False
    if re.search(r"(ть|ться|тись|ти)$", w[0].lower()): return False
    # глагол в имени — это фраза, а не имя: «Волна оседает раньше голоса», «Переносит из воды»
    if any(len(x) >= 5 and x.lower().endswith(("ает", "яет", "еет", "оет", "ует", "ится", "ется", "ают", "яют", "уют", "ешь", "ишь")) for x in w): return False
    if len(w) > 1 and len(w[0]) >= 7 and w[0].lower().endswith(("ит", "ет")) and w[1].lower() in ("из", "в", "на", "под", "за", "к", "от", "по", "с"): return False
    return True

def добавки(T):
    """настоящие имена из таблиц игры: люди (имена и роды), города, заставы, подземные городки, ордена и храмы"""
    import random as _r
    R = _r.Random(5); thr = T.get("THR_NAMES", {}) if isinstance(T.get("THR_NAMES"), dict) else {}
    муж = [x for x in thr.get("муж", []) if isinstance(x, str)]; жен = [x for x in thr.get("жен", []) if isinstance(x, str)]
    свод = [x for x in T.get("СВОД_ИМЕНА", []) if isinstance(x, str)]
    дом = [x for x in thr.get("дом", []) + thr.get("знать", []) if isinstance(x, str)]; род = [x for x in thr.get("род", []) if isinstance(x, str)]
    for и in муж + жен + свод:
        пол = "ж" if и in жен or (и in свод and и[-1] in "ая") else "м"
        yield {"вид": "персонаж", "имя": и, "о": "", "черты": {"пол": пол}, "из": "THR_NAMES"}
        if дом: yield {"вид": "персонаж", "имя": f"{и} из дома {R.choice(дом)}", "о": "", "черты": {"пол": пол}, "из": "THR_NAMES"}
        if род and пол == "м": yield {"вид": "персонаж", "имя": f"{и} из рода {R.choice(род)}", "о": "", "черты": {"пол": пол}, "из": "THR_NAMES"}
    пре = [x for x in T.get("CITY_PREF", []) if isinstance(x, str)]; суф = [x for x in T.get("CITY_SUF", []) if isinstance(x, str)]
    for a in пре:
        for b in суф: yield {"вид": "поселение", "имя": a + b, "о": "", "черты": {}, "из": "CITY_PREF"}
    for x in T.get("NAMED_CITIES", []):
        if isinstance(x, dict) and x.get("n"): yield {"вид": "поселение", "имя": x["n"], "о": (x.get("о") or "")[:400], "черты": {"тип": x.get("роль", "")} if x.get("роль") else {}, "из": "NAMED_CITIES"}
    for t, шаблон in (("DEEP_TOWN_NAMES", "{}"), ("FORT_NAMES", "Застава {}"), ("SMUGGLER_DEN_NAMES", "{}"), ("WARCAMP_NAMES", "{}")):
        for x in T.get(t, []):
            if isinstance(x, str): yield {"вид": "поселение", "имя": шаблон.format(x), "о": "", "черты": {}, "из": t}
    for x in T.get("DEEP_NAMES", []):
        if isinstance(x, str): yield {"вид": "подземелье", "имя": x, "о": "", "черты": {}, "из": "DEEP_NAMES"}
    for x in T.get("FOREST_NAMES", []):
        if isinstance(x, str): yield {"вид": "земля", "имя": x, "о": "", "черты": {}, "из": "FOREST_NAMES"}
    for x in thr.get("храм", []):
        if isinstance(x, str): yield {"вид": "вера", "имя": x, "о": "", "черты": {}, "из": "THR_NAMES"}

def main(папка):
    T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8"))
    всё, видели = [], set()
    for t, d in T.items():
        в = вид(t)
        if not в: continue
        for z in записи(t, в, d):
            ключ = (z["вид"], z["имя"].lower())
            if ключ in видели: continue
            видели.add(ключ); всё.append(z)
    было = len(всё); всё = [z for z in всё if z["вид"] not in ИМЕННЫЕ or похоже_на_имя(z["имя"])]; убрано = было - len(всё)
    for z in добавки(T):
        ключ = (z["вид"], z["имя"].lower())
        if ключ in видели: continue
        видели.add(ключ); всё.append(z)
    print(f"убрано не похожих на имя {убрано}, добавлено имён из таблиц {len(всё) - было + убрано}")
    with open(os.path.join(папка, "corpus.jsonl"), "w", encoding="utf-8") as f:
        for z in всё: f.write(json.dumps(z, ensure_ascii=False) + "\n")
    по = collections.Counter(z["вид"] for z in всё)
    сопис = collections.Counter(z["вид"] for z in всё if z["о"])
    таб = collections.defaultdict(set)
    for z in всё: таб[z["вид"]].add(z["из"])
    with open(os.path.join(папка, "corpus_stats.txt"), "w", encoding="utf-8") as f:
        for в, n in по.most_common():
            f.write(f"{в}\t{n}\tс описанием {сопис[в]}\tтаблиц {len(таб[в])}: {', '.join(sorted(таб[в])[:12])}\n")
    print("записей", len(всё), "видов", len(по), "знаков", sum(len(z["имя"]) + len(z["о"]) for z in всё))

if __name__ == "__main__":
    main(sys.argv[1])
