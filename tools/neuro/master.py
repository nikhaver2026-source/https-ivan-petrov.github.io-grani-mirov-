"""master.py — Мастер свойств: сеть, порождающая числа и признаки нового (в игру не входит).

Учится на таблицах игры, где у сущностей есть числа и признаки: твари (уровни, стая, часы охоты, нрав, края),
твари тёмных земель (уровни, полёт, магия), растения (редкость, пора, почва, вид), зелья (срок, стойкость), края мира
(опасность, климат, биомы, ресурс), малые боги (тип, область), чары (цена), а со второй версии ещё нравы людей
(торг, дар, слух, память, смелость, правда), находки на дорогах (вес, где встречаются), подземелья (план яруса,
твари, добыча, ресурс и опасность), ремёсла городов (земли, товар, нужда), роды зверей (ранг, сила, стойкость,
ловкость, чутьё, ход, корм, роли) и ловушки (урон, род, вид). Одна сеть на всех: смешанный вариационный
автокодировщик — у каждой таблицы свои поля, у поля своя голова (число — нормальное распределение, признак — выбор
из словаря, набор признаков — несколько отметок). Новое порождается из случайной точки скрытого пространства и
приводится в пределы, которые есть в игре (нижний уровень не выше верхнего, редкость в своих границах).

Подбор по месту: Мастер порождает несколько вариантов и оставляет тот, что подходит месту и случаю — тварь, что
живёт в здешних землях, находку, что встречается в таких краях, нрав, что под стать роли человека.
Составитель вещей собирает артефакт из частей игры (ранг, направление, руны, ядра, эссенции, кристаллы, чары,
проклятие, норов) — без несовместимых частей, ранг по силе творца.

  python3 master.py train <папка данных> [шагов]
  python3 master.py gen   <папка данных> <таблица> [сколько]
  python3 master.py eval  <папка данных>   — порождённое против настоящего: средние, доли признаков, новизна, правильность
"""
import sys, os, json, math, random, collections
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F

ТАБЛИЦЫ = {  # таблица → (вид, числа, признаки, наборы)
    "MONSTERS": ("тварь", ["min", "max", "вода", "удел"], ["нрав", "часы"], ["biomes"]),
    "DARK_MONSTERS": ("тварь", ["min", "max", "fly"], ["magic"], []),
    "PLANTS": ("растение", ["редкость"], ["кат"], ["пора", "почва"]),
    "POTIONS": ("зелье", ["срок", "стаб"], [], []),
    "REGIONS": ("земля", ["опасность"], ["климат", "ресурс"], ["биомы"]),
    "LESSER_GODS": ("бог", ["область"], ["тип"], []),
    "DK_GODS": ("бог", ["область"], ["тип"], []),
    "SPELLS": ("чары", ["cost", "price"], [], []),
    # вторая версия: всё, что порождает Сердце мира, получает свои числа и признаки
    "SOUL_CHARS": ("персонаж", ["торг", "дар", "слух", "память", "смелость", "правда"], [], []),
    "FINDS": ("находка", ["вес"], [], ["где"]),
    "DUNGEON_KINDS": ("подземелье", ["план.тварей", "план.сундуков", "план.книг", "план.комнат", "план.жил", "план.вещей", "план.факелов"], [], ["твари", "добыча"]),
    "DUNG_TYPES": ("подземелье", [], ["ресурс", "опасность"], []),
    "CITY_TRADES": ("поселение", [], [], ["земли", "товар", "нужда"]),
    "ZV_FAMILIES": ("зверь", ["р", "сила", "стойк", "ловк", "чутьё", "ездовой"], ["ход", "g"], ["корм", "роли"]),
    "TRAPS": ("ловушка", ["урон"], ["род", "вид"], []),
}
ПАРЫ = [("min", "max")]  # нижнее не выше верхнего
НЕТ = "—"
Z = 8

def взять(r, f):
    """поле строки; «план.тварей» — из вложенного словаря (нет ключа в плане — ноль), ездовой да/нет — 1/0"""
    if "." in f:
        a, b = f.split(".", 1); d = r.get(a)
        return (d.get(b, 0) if isinstance(d, dict) else None)
    v = r.get(f)
    return float(v) if isinstance(v, bool) else v

def плоско(r, поля):
    return {f: взять(r, f) for f in поля}

def собрать(T):
    спец = {}; строки = []
    for t, (вид, чис, приз, наб) in ТАБЛИЦЫ.items():
        rows = [{**r, **плоско(r, чис)} for r in T.get(t, []) if isinstance(r, dict)]
        if not rows: continue
        с = {"вид": вид, "чис": {}, "приз": {}, "наб": {}}
        for f in чис:
            v = [float(r[f]) for r in rows if isinstance(r.get(f), (int, float))]
            if v: с["чис"][f] = (float(np.mean(v)), float(np.std(v) + 1e-6), float(min(v)), float(max(v)), all(float(x).is_integer() for x in v))
        for f in приз:
            сл = sorted({str(r[f]) for r in rows if r.get(f) not in (None, "")})
            if сл and any(r.get(f) in (None, "") for r in rows): сл.append(НЕТ)  # «нет признака» — тоже выбор (тварь без своих часов, без магии)
            if сл: с["приз"][f] = сл
        for f in наб:
            сл = sorted({str(x) for r in rows for x in (r.get(f) or []) if isinstance(r.get(f), list)})
            if сл: с["наб"][f] = сл
        спец[t] = с
        for r in rows: строки.append((t, r))
    return спец, строки

class Мастер(nn.Module):
    def __init__(s, спец):
        super().__init__(); s.спец = спец; s.табл = list(спец); s.вх = {}; n = 0
        for t, с in спец.items():
            for f in с["чис"]: s.вх[(t, "ч", f)] = (n, 1); n += 1
            for f, сл in с["приз"].items(): s.вх[(t, "п", f)] = (n, len(сл)); n += len(сл)
            for f, сл in с["наб"].items(): s.вх[(t, "н", f)] = (n, len(сл)); n += len(сл)
        s.N = n; Tn = len(s.табл)
        s.enc = nn.Sequential(nn.Linear(n + Tn, 128), nn.GELU(), nn.Linear(128, 2 * Z))
        s.dec = nn.Sequential(nn.Linear(Z + Tn, 128), nn.GELU(), nn.Linear(128, 128), nn.GELU(), nn.Linear(128, n + n))  # средние/логиты и лог-разброс чисел
    def кодировать(s, t, r):
        x = torch.zeros(s.N); m = torch.zeros(s.N); с = s.спец[t]
        for f, (mu, sd, lo, hi, _) in с["чис"].items():
            if isinstance(r.get(f), (int, float)): i, _ = s.вх[(t, "ч", f)]; x[i] = (float(r[f]) - mu) / sd; m[i] = 1
        for f, сл in с["приз"].items():
            i, k = s.вх[(t, "п", f)]; m[i:i + k] = 1
            v = НЕТ if r.get(f) in (None, "") else str(r[f])
            if v in сл: x[i + сл.index(v)] = 1
        for f, сл in с["наб"].items():
            i, k = s.вх[(t, "н", f)]; m[i:i + k] = 1
            for v in (r.get(f) or []):
                if str(v) in сл: x[i + сл.index(str(v))] = 1
        return x, m
    def tvec(s, t): v = torch.zeros(len(s.табл)); v[s.табл.index(t)] = 1; return v
    def forward(s, x, tv):
        h = s.enc(torch.cat([x, tv], -1)); mu, lv = h[..., :Z], h[..., Z:].clamp(-6, 4)
        z = mu + torch.randn_like(mu) * torch.exp(0.5 * lv); o = s.dec(torch.cat([z, tv], -1)); return o, mu, lv
    def потеря(s, t, x, m, o):
        потеря = 0.0; с = s.спец[t]; ср, лр = o[..., :s.N], o[..., s.N:].clamp(-5, 3)
        for f in с["чис"]:
            i, _ = s.вх[(t, "ч", f)]; потеря = потеря + (m[..., i] * (0.5 * лр[..., i] + 0.5 * (x[..., i] - ср[..., i]) ** 2 / torch.exp(лр[..., i]))).sum()
        for f in с["приз"]:
            i, k = s.вх[(t, "п", f)]
            есть = x[..., i:i + k].sum(-1) > 0
            if есть.any(): потеря = потеря + F.cross_entropy(ср[..., i:i + k][есть], x[..., i:i + k][есть].argmax(-1), reduction="sum")
        for f in с["наб"]:
            i, k = s.вх[(t, "н", f)]; потеря = потеря + F.binary_cross_entropy_with_logits(ср[..., i:i + k], x[..., i:i + k], reduction="sum")
        return потеря
    @torch.no_grad()
    def породить(s, t, n=1, T=1.0, R=None):
        tv = s.tvec(t).expand(n, -1); z = torch.randn(n, Z) * T; o = s.dec(torch.cat([z, tv], -1)); с = s.спец[t]; вывод = []
        ср, лр = o[:, :s.N], o[:, s.N:].clamp(-5, 3)
        for j in range(n):
            r = {}
            for f, (mu, sd, lo, hi, целое) in с["чис"].items():
                i, _ = s.вх[(t, "ч", f)]; v = (ср[j, i] + torch.randn(()) * torch.exp(0.5 * лр[j, i]) * 0.5).item() * sd + mu
                v = min(hi, max(lo, v)); r[f] = int(round(v)) if целое else round(v, 2)
            for f, сл in с["приз"].items():
                i, k = s.вх[(t, "п", f)]; p = F.softmax(ср[j, i:i + k] / T, -1); v = сл[int(torch.multinomial(p, 1))]; r[f] = None if v == НЕТ else v
            for f, сл in с["наб"].items():
                i, k = s.вх[(t, "н", f)]; p = torch.sigmoid(ср[j, i:i + k]); вз = [сл[q] for q in range(k) if torch.rand(()) < p[q]]
                r[f] = вз or [сл[int(p.argmax())]]
            for a, b in ПАРЫ:
                if a in r and b in r and r[a] > r[b]: r[a], r[b] = r[b], r[a]
            план = [f for f in с["чис"] if f.startswith("план.")]
            if план and not any(r[f] for f in план):  # в плане яруса хоть что-то есть
                r[max(план, key=lambda f: ср[j, s.вх[(t, "ч", f)][0]].item())] = 1
            вывод.append(r)
        return вывод

# ── подбор по месту и случаю ──
def подобрать(м, t, оценка, n=16):
    """Мастер порождает n вариантов, остаётся лучший по оценке места (при равенстве — первый, порядок случайный)"""
    вар = м.породить(t, n)
    return max(вар, key=оценка)

def базы_биомов(T):
    """тонкий биом края (shore, conifer…) → грубый, каким пользуются твари и находки (coast, forest…)"""
    б = {x["id"]: x["база"] for k in ("BIOMES", "MAT_BIOMES") for x in T.get(k, []) if isinstance(x, dict) and x.get("база")}
    б.update({x["id"]: "cave" for x in T.get("DEEP_BIOMES", []) if isinstance(x, dict) and x.get("id")})
    б.update({"isle": "coast", "volcano": "mountains", "wasteland": "desert", "tundra": "plains", "lakeland": "coast",
              "ancient_forest": "forest", "steppe": "plains"})
    for грубый in ("cave", "coast", "desert", "forest", "mountains", "plains", "road", "swamp"): б.setdefault(грубый, грубый)
    return б

# какие черты нрава нужны роли человека (Сердце мира даёт роль, Мастер — нрав под стать)
НРАВ_РОЛИ = {"герой": {"смелость": 2, "дар": 1}, "пророк": {"слух": 1.5, "правда": 1.5}, "мастер": {"память": 1.5, "торг": 1},
             "маг": {"память": 1.5, "слух": 1}, "тиран": {"правда": -2, "дар": -1, "смелость": 1}, "странник": {"слух": 1.5, "смелость": 1}}

def нрав_ближе(T, r):
    """на какой нрав игры больше всего похож порождённый (по шести чертам)"""
    п = ["торг", "дар", "слух", "память", "смелость", "правда"]
    return min(T.get("SOUL_CHARS", []), key=lambda x: sum((float(x[k]) - float(r[k])) ** 2 for k in п))["n"]

# ── составитель вещей: артефакт из частей игры ──
НАПР_ТВОРЦА = {"маг": ["mag", "elem"], "мастер": ["run", "util", "alch"], "герой": ["war", "def", "leg"], "пророк": ["spir", "time"],
               "тиран": ["war", "fact"], "странник": ["space", "util", "myst"],
               "память": ["time", "spir"], "буря": ["elem"], "пепел": ["elem", "war"], "жатва": ["alch", "util"], "тайна": ["myst"],
               "дорога": ["space"], "клятва": ["fact", "def"], "глубина": ["mag", "space"]}

def вещь(T, сила=0.5, творец="персонаж", черта=None, R=None):
    """творец: бог / персонаж / народ; черта — роль персонажа или сфера бога; сила 0..1 — от неё ранг"""
    import random as _r
    R = R or _r.Random()
    ранги = T["ART_RANKS"]; осн = {"бог": 4, "персонаж": 2, "народ": 1}.get(творец, 1)
    ранг = max(0, min(len(ранги) - 1, int(round(осн + сила * 4 + R.gauss(0, 0.7)))))
    рк = ранги[ранг]; напр = T["ART_DIRS"]
    свои = [d for d in напр if d["id"] in НАПР_ТВОРЦА.get(черта, [])]
    d = R.choice(свои) if свои and R.random() < 0.8 else R.choice(напр)
    вражда = {(c["a"], c["b"]) for c in T.get("ART_CONFLICTS", [])} | {(c["b"], c["a"]) for c in T.get("ART_CONFLICTS", [])}
    гнёзд = max(1, min(3, рк["гнёзд"] or 1)); части = []
    кандидаты = [p for p in T["ART_PARTS"] if p["ред"] <= 1 + ранг // 2 + 1]
    for _ in range(гнёзд):
        if not кандидаты: break
        вес = [(1 + 8 * len(set(p["даёт"]) & set(d["своё"]))) for p in кандидаты]  # части под направление вещи
        p = R.choices(кандидаты, вес)[0]
        if any((p["id"], q["id"]) in вражда for q in части) or p in части: continue
        части.append(p)
    даёт = {}
    def прибавить(сл, k=1.0):
        for ключ, v in сл.items(): даёт[ключ] = round(даёт.get(ключ, 0) + v * k, 3)
    for p in части: прибавить(p["даёт"], 1 + ранг * 0.15)
    чары = проклятие = норов = None
    if R.random() < 0.3 + 0.07 * ранг:
        ч = [e for e in T.get("ART_ENCHANTS", []) if e["ред"] <= 2 + ранг // 2]
        if ч: чары = R.choice(ч); прибавить(чары["даёт"])
    if R.random() < (0.35 if черта == "тиран" else 0.12):
        проклятие = R.choice(T["ART_CURSES"]); прибавить(проклятие["берёт"])
    if ранг >= 4 and R.random() < 0.5: норов = R.choice(T["ART_MINDS"])
    return {"ранг": рк["n"], "уровень": рк["уровень"], "направление": d["n"], "облик": R.choice(d["слово"]),
            "части": [p["n"] for p in части], "чары": чары["n"] if чары else None,
            "проклятие": проклятие["n"] if проклятие else None,
            "норов": f"{норов['n']}: хочет {норов['хочет']}" if норов else None, "даёт": даёт}

def учить(папка, шагов=4000):
    torch.manual_seed(2); random.seed(2); torch.set_num_threads(1)
    T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8")); спец, строки = собрать(T)
    м = Мастер(спец); опт = torch.optim.Adam(м.parameters(), lr=2e-3)
    данные = [(t, *м.кодировать(t, r)) for t, r in строки]
    по = collections.defaultdict(list)
    for d in данные: по[d[0]].append(d)
    for ш in range(шагов):
        t = random.choice(list(по)); пачка = random.sample(по[t], min(32, len(по[t])))  # таблицы поровну: малые не тонут в больших
        x = torch.stack([d[1] for d in пачка]); m = torch.stack([d[2] for d in пачка]); tv = м.tvec(t).expand(len(пачка), -1)
        o, mu, lv = м(x, tv); β = min(0.5, ш / шагов)
        кл = -0.5 * (1 + lv - mu ** 2 - lv.exp()).sum(); п = (м.потеря(t, x, m, o) + β * кл) / len(пачка)
        опт.zero_grad(); п.backward(); опт.step()
        if (ш + 1) % 500 == 0: print(f"шаг {ш+1}: потеря {п.item():.3f}", flush=True)
    torch.save({"м": м.state_dict(), "спец": спец}, os.path.join(папка, "master.pt"))

def загрузить(папка):
    c = torch.load(os.path.join(папка, "master.pt")); м = Мастер(c["спец"]); м.load_state_dict(c["м"]); return м

def оценить(папка):
    T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8")); м = загрузить(папка)
    for t, с in м.спец.items():
        rows = [{**r, **плоско(r, list(с["чис"]))} for r in T[t] if isinstance(r, dict)]; ген = м.породить(t, 200)
        чис = "; ".join(f"{f} {np.mean([r[f] for r in rows if isinstance(r.get(f),(int,float))]):.2f}/{np.mean([g[f] for g in ген]):.2f}" for f in с["чис"])
        приз = "; ".join(f"{f}: " + ", ".join(f"{k} {v/len(rows):.2f}/{sum(1 for g in ген if (НЕТ if g[f] is None else g[f])==k)/200:.2f}" for k, v in collections.Counter(НЕТ if r.get(f) in (None, "") else str(r[f]) for r in rows).most_common(3)) for f in с["приз"])
        ключи = {json.dumps({k: r.get(k) for k in ген[0]}, sort_keys=True, ensure_ascii=False) for r in rows}
        нов = sum(1 for g in ген if json.dumps(g, sort_keys=True, ensure_ascii=False) not in ключи) / 200
        print(f"{t} ({с['вид']}): числа настоящее/порождённое — {чис} | {приз} | новых {нов:.2f}")
        print("   пример:", json.dumps(ген[0], ensure_ascii=False)[:220])
    # подбор по месту: доля подходящих месту — случайный вариант против подобранного
    import random as _r
    R = _r.Random(5); базы = базы_биомов(T); края = [b for r in T.get("REGIONS", []) for b in (r.get("биомы") or [])]
    def доля(t, поле, n=300):
        if t not in м.спец: return None
        сл = сб = 0
        for _ in range(n):
            б = базы.get(R.choice(края), "plains"); ок = lambda g: б in (g.get(поле) or [])
            сл += ок(м.породить(t, 1)[0]); сб += ок(подобрать(м, t, lambda g: ок(g) + R.random() * 0.01))
        return сл / n, сб / n
    for t, поле in (("MONSTERS", "biomes"), ("FINDS", "где"), ("CITY_TRADES", "земли")):
        д = доля(t, поле)
        if д: print(f"по месту {t}: подходит краю без подбора {д[0]:.2f}, с подбором {д[1]:.2f}")
    if "SOUL_CHARS" in м.спец:
        сл = сб = 0
        for _ in range(300):
            роль = R.choice(list(НРАВ_РОЛИ)); о = lambda g: sum(w * (g[k] - м.спец["SOUL_CHARS"]["чис"][k][0]) / м.спец["SOUL_CHARS"]["чис"][k][1] for k, w in НРАВ_РОЛИ[роль].items())
            сл += о(м.породить("SOUL_CHARS", 1)[0]) > 0; сб += о(подобрать(м, "SOUL_CHARS", о)) > 0
        print(f"нрав под роль: под стать роли без подбора {сл/300:.2f}, с подбором {сб/300:.2f}")
        g = подобрать(м, "SOUL_CHARS", lambda g: g["смелость"]); print("   герой:", g, "— ближе всего к нраву", нрав_ближе(T, g))
    if T.get("ART_RANKS"):
        for творец, черта, сила in (("бог", "буря", 0.9), ("персонаж", "мастер", 0.5), ("персонаж", "тиран", 0.7), ("народ", None, 0.3)):
            print(f"вещь ({творец}, {черта}, сила {сила}):", json.dumps(вещь(T, сила, творец, черта, R), ensure_ascii=False)[:300])

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 4000)
    elif cmd == "gen":
        м = загрузить(папка)
        for r in м.породить(sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 5): print(json.dumps(r, ensure_ascii=False))
    else: оценить(папка)
