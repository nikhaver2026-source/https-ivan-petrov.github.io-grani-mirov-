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
