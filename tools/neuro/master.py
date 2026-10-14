"""master.py — Мастер свойств: сеть, порождающая числа и признаки нового (в игру не входит).

Учится на таблицах игры, где у сущностей есть числа и признаки: твари (уровни, стая, часы охоты, нрав, края),
твари тёмных земель (уровни, полёт, магия), растения (редкость, пора, почва, вид), зелья (срок, стойкость), края мира
(опасность, климат, биомы, ресурс), малые боги (тип, область), чары (цена). Одна сеть на всех: смешанный вариационный
автокодировщик — у каждой таблицы свои поля, у поля своя голова (число — нормальное распределение, признак — выбор
из словаря, набор признаков — несколько отметок). Новое порождается из случайной точки скрытого пространства и
приводится в пределы, которые есть в игре (нижний уровень не выше верхнего, редкость в своих границах).

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
}
ПАРЫ = [("min", "max")]  # нижнее не выше верхнего
Z = 8

def собрать(T):
    спец = {}; строки = []
    for t, (вид, чис, приз, наб) in ТАБЛИЦЫ.items():
        rows = [r for r in T.get(t, []) if isinstance(r, dict)]
        if not rows: continue
        с = {"вид": вид, "чис": {}, "приз": {}, "наб": {}}
        for f in чис:
            v = [float(r[f]) for r in rows if isinstance(r.get(f), (int, float))]
            if v: с["чис"][f] = (float(np.mean(v)), float(np.std(v) + 1e-6), float(min(v)), float(max(v)), all(float(x).is_integer() for x in v))
        for f in приз:
            сл = sorted({str(r[f]) for r in rows if r.get(f) not in (None, "")})
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
            if r.get(f) not in (None, "") and str(r[f]) in сл: x[i + сл.index(str(r[f]))] = 1
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
                i, k = s.вх[(t, "п", f)]; p = F.softmax(ср[j, i:i + k] / T, -1); r[f] = сл[int(torch.multinomial(p, 1))]
            for f, сл in с["наб"].items():
                i, k = s.вх[(t, "н", f)]; p = torch.sigmoid(ср[j, i:i + k]); вз = [сл[q] for q in range(k) if torch.rand(()) < p[q]]
                r[f] = вз or [сл[int(p.argmax())]]
            for a, b in ПАРЫ:
                if a in r and b in r and r[a] > r[b]: r[a], r[b] = r[b], r[a]
            вывод.append(r)
        return вывод

def учить(папка, шагов=4000):
    torch.manual_seed(2); random.seed(2); torch.set_num_threads(1)
    T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8")); спец, строки = собрать(T)
    м = Мастер(спец); опт = torch.optim.Adam(м.parameters(), lr=2e-3)
    данные = [(t, *м.кодировать(t, r)) for t, r in строки]
    по = collections.defaultdict(list)
    for d in данные: по[d[0]].append(d)
    for ш in range(шагов):
        t = random.choice(list(по)); пачка = random.sample(по[t], min(32, len(по[t])))
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
        rows = [r for r in T[t] if isinstance(r, dict)]; ген = м.породить(t, 200)
        чис = "; ".join(f"{f} {np.mean([r[f] for r in rows if isinstance(r.get(f),(int,float))]):.2f}/{np.mean([g[f] for g in ген]):.2f}" for f in с["чис"])
        приз = "; ".join(f"{f}: " + ", ".join(f"{k} {v/len(rows):.2f}/{sum(1 for g in ген if g[f]==k)/200:.2f}" for k, v in collections.Counter(str(r.get(f)) for r in rows).most_common(3)) for f in с["приз"])
        ключи = {json.dumps({k: r.get(k) for k in ген[0]}, sort_keys=True, ensure_ascii=False) for r in rows}
        нов = sum(1 for g in ген if json.dumps(g, sort_keys=True, ensure_ascii=False) not in ключи) / 200
        print(f"{t} ({с['вид']}): числа настоящее/порождённое — {чис} | {приз} | новых {нов:.2f}")
        print("   пример:", json.dumps(ген[0], ensure_ascii=False)[:220])

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 4000)
    elif cmd == "gen":
        м = загрузить(папка)
        for r in м.породить(sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 5): print(json.dumps(r, ensure_ascii=False))
    else: оценить(папка)
