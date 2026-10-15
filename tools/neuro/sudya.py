"""sudya.py — Судья: сеть, отличающая настоящие сущности мира от неудачных (в игру не входит).

Вход — запись «⟦вид⟧имя⟨о⟩описание» (первые 160 знаков). Выход — вероятность, что так могла быть написана
настоящая сущность этого вида. Учится отличать настоящие записи из таблиц игры от брака: имени чужого вида под этим
видом (бог с именем травы), перемешанных букв, бессвязных имён из сочетаний букв, оборванных описаний и — когда он
есть — порождённого Летописцем, которое Судья помечает как сомнительное по ходу дообучения. Летописец пишет много,
Судья оставляет лучшее.

(2-й Судья) Вид подаётся не знаком в начале строки — свёртки шириной до пяти знаков почти не связывали его с именем,
и «чужое имя под этим видом» Судья угадывал наугад (52 %), — а отдельно, прямо в решающий слой; заодно Судья учится
угадывать вид по самой записи (вторая голова): так в признаках появляется то, чем имя бога отличается от имени вещи.

  python3 sudya.py train <папка данных> [шагов] [файл порождённого Летописцем, по строке «вид\tимя\tо»]
  python3 sudya.py score <папка данных> <вид> <имя> [описание]
"""
import sys, os, json, random, collections, math
import torch, torch.nn as nn, torch.nn.functional as F
L = 160

def строка(вид, имя, о=""): return (f"⟦{вид}⟧{имя}⟨о⟩{о}")[:L]
def текст(имя, о=""): return (f"{имя}⟨о⟩{о}")[:L]

class Судья(nn.Module):
    """свёртки по буквам (ширина 2–7) → максимум и среднее по строке; решение — по признакам и виду вместе"""
    def __init__(s, V, NV, d=64, c=128):
        super().__init__(); s.e = nn.Embedding(V, d); s.ев = nn.Embedding(NV, 32)
        s.c = nn.ModuleList([nn.Conv1d(d, c, k, padding=k // 2) for k in (2, 3, 5, 7)])
        H = 2 * 4 * c
        s.o = nn.Sequential(nn.Linear(H + 32, 192), nn.GELU(), nn.Dropout(0.2), nn.Linear(192, 1))
        s.вид = nn.Sequential(nn.Dropout(0.2), nn.Linear(H, NV))
    def признаки(s, x):
        м = (x > 0).float().unsqueeze(1); h = s.e(x).transpose(1, 2); out = []
        for c in s.c:
            y = F.gelu(c(h))[..., : x.shape[1]]
            out += [(y - 1e4 * (1 - м)).max(-1).values, (y * м).sum(-1) / м.sum(-1).clamp(min=1)]
        return torch.cat(out, -1)
    def forward(s, x, в, с_видом=False):
        h = s.признаки(x); r = s.o(torch.cat([h, s.ев(в)], -1)).squeeze(-1)
        return (r, s.вид(h)) if с_видом else r

class Буквы:
    def __init__(s, знаки): s.т = ["<pad>", "<?>"] + sorted(знаки); s.и = {c: i for i, c in enumerate(s.т)}
    def код(s, t): v = [s.и.get(c, 1) for c in t[:L]]; return v + [0] * (L - len(v))

def брак(z, все, по_виду, R, двуграммы):
    вид = z["вид"]; к = R.random()
    if к < 0.3:  # чужое имя под этим видом
        чужие = [x for x in все if x["вид"] != вид]; y = R.choice(чужие); return строка(вид, y["имя"], y["о"])
    if к < 0.5:  # перемешанные буквы имени
        b = list(z["имя"]); R.shuffle(b); return строка(вид, "".join(b), z["о"])
    if к < 0.75:  # бессвязное имя из сочетаний букв
        c, n = "^", ""
        while len(n) < 18:
            сл = двуграммы.get(c)
            if not сл: break
            c = R.choices(list(сл), weights=list(сл.values()))[0]
            if c == "$": break
            n += c
        return строка(вид, n.capitalize() or "Ъ", "")
    # оборванное или чужое описание
    y = R.choice(по_виду[вид] if R.random() < 0.3 else все)
    о = y["о"][: R.randint(0, max(1, len(y["о"]) // 3))] if y["о"] else ""
    return строка(вид, z["имя"], о + (" " + R.choice(все)["о"][:40] if R.random() < 0.5 else ""))

def учить(папка, шагов=6000, порождённое=None):
    torch.manual_seed(4); R = random.Random(4); torch.set_num_threads(int(os.environ.get("SUD_THREADS", "1")))
    все = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    по_виду = collections.defaultdict(list)
    for z in все: по_виду[z["вид"]].append(z)
    двуграммы = collections.defaultdict(collections.Counter)
    for z in все:
        n = "^" + z["имя"].lower() + "$"
        for a, b in zip(n, n[1:]): двуграммы[a][b] += 1
    плохие = []
    if порождённое and os.path.exists(порождённое):
        for l in open(порождённое, encoding="utf-8"):
            ч = l.rstrip("\n").split("\t")
            if len(ч) >= 2: плохие.append((ч[0], ч[1], ч[2] if len(ч) > 2 else ""))
    виды = sorted(по_виду); ви = {в: i for i, в in enumerate(виды)}
    сл = Буквы(set("".join(текст(z["имя"], z["о"]) for z in все))); R.shuffle(все)
    пров = все[: len(все) // 10]; учз = все[len(все) // 10:]
    м = Судья(len(сл.т), len(виды)); опт = torch.optim.AdamW(м.parameters(), lr=2e-3, weight_decay=1e-4)
    def брак2(z):
        """брак как тройка (вид, имя, описание) — из прежнего брака (строка с меткой вида)"""
        t = брак(z, все, по_виду, R, двуграммы); имя_о = t[t.index("⟧") + 1:]
        имя, _, о = имя_о.partition("⟨о⟩"); return z["вид"], имя, о
    for ш in range(шагов):
        for g in опт.param_groups: g["lr"] = 2e-3 * min(1.0, (ш + 1) / 200) * (0.05 + 0.95 * 0.5 * (1 + math.cos(math.pi * ш / шагов)))
        x, в, y, вн = [], [], [], []
        for _ in range(48):
            z = R.choice(учз); x.append(сл.код(текст(z["имя"], z["о"] if R.random() < 0.6 else ""))); в.append(ви[z["вид"]]); y.append(1.0)  # судить и по одному имени
            б = R.choice(плохие) if плохие and R.random() < 0.3 else брак2(z)
            x.append(сл.код(текст(б[1], б[2]))); в.append(ви.get(б[0], ви[z["вид"]])); y.append(0.0)
        X = torch.tensor(x); В = torch.tensor(в); Y = torch.tensor(y)
        r, лв = м(X, В, с_видом=True); настоящие = Y > 0.5
        п = F.binary_cross_entropy_with_logits(r, Y) + 0.5 * F.cross_entropy(лв[настоящие], В[настоящие])
        опт.zero_grad(); п.backward(); torch.nn.utils.clip_grad_norm_(м.parameters(), 1.0); опт.step()
        if (ш + 1) % 500 == 0:
            м.eval()
            with torch.no_grad():
                Rv = random.Random(9); ок = 0; n = 0
                for z in пров[:300]:
                    p1 = torch.sigmoid(м(torch.tensor([сл.код(текст(z["имя"], z["о"]))]), torch.tensor([ви[z["вид"]]])))[0].item()
                    t0 = брак(z, все, по_виду, Rv, двуграммы); имя, _, о = t0[t0.index("⟧") + 1:].partition("⟨о⟩")
                    p0 = torch.sigmoid(м(torch.tensor([сл.код(текст(имя, о))]), torch.tensor([ви[z["вид"]]])))[0].item()
                    ок += (p1 > 0.5) + (p0 < 0.5); n += 2
            м.train(); print(f"шаг {ш+1}: потеря {п.item():.3f}, точность на проверке {ок/n:.3f}", flush=True)
    torch.save({"м": м.state_dict(), "т": сл.т, "виды": виды, "версия": 2}, os.path.join(папка, "sudya.pt"))

def загрузить(папка):
    c = torch.load(os.path.join(папка, "sudya.pt")); сл = Буквы([]); сл.т = c["т"]; сл.и = {ch: i for i, ch in enumerate(сл.т)}
    сл.виды = c["виды"]; сл.ви = {в: i for i, в in enumerate(сл.виды)}
    м = Судья(len(сл.т), len(сл.виды)); м.load_state_dict(c["м"]); м.eval(); return м, сл

@torch.no_grad()
def оценка(м, сл, вид, имя, о=""):
    в = сл.ви.get(вид)
    if в is None: return 0.5
    return torch.sigmoid(м(torch.tensor([сл.код(текст(имя, о))]), torch.tensor([в])))[0].item()

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 6000, sys.argv[4] if len(sys.argv) > 4 else None)
    else:
        м, сл = загрузить(папка); print(round(оценка(м, сл, sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else ""), 3))
