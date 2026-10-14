"""sudya.py — Судья: сеть, отличающая настоящие сущности мира от неудачных (в игру не входит).

Вход — запись «⟦вид⟧имя⟨о⟩описание» (первые 160 знаков). Выход — вероятность, что так могла быть написана
настоящая сущность этого вида. Учится отличать настоящие записи из таблиц игры от брака: имени чужого вида под этим
видом (бог с именем травы), перемешанных букв, бессвязных имён из сочетаний букв, оборванных описаний и — когда он
есть — порождённого Летописцем, которое Судья помечает как сомнительное по ходу дообучения. Летописец пишет много,
Судья оставляет лучшее.

  python3 sudya.py train <папка данных> [шагов] [файл порождённого Летописцем, по строке «вид\tимя\tо»]
  python3 sudya.py score <папка данных> <вид> <имя> [описание]
"""
import sys, os, json, random, collections, math
import torch, torch.nn as nn, torch.nn.functional as F
L = 160

def строка(вид, имя, о=""): return (f"⟦{вид}⟧{имя}⟨о⟩{о}")[:L]

class Судья(nn.Module):
    def __init__(s, V, d=64):
        super().__init__(); s.e = nn.Embedding(V, d)
        s.c = nn.ModuleList([nn.Conv1d(d, 96, k, padding=k // 2) for k in (2, 3, 5)])
        s.o = nn.Sequential(nn.Linear(288, 96), nn.GELU(), nn.Dropout(0.2), nn.Linear(96, 1))
    def forward(s, x):
        h = s.e(x).transpose(1, 2); h = torch.cat([F.gelu(c(h)).max(-1).values for c in s.c], -1); return s.o(h).squeeze(-1)

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

def учить(папка, шагов=3000, порождённое=None):
    torch.manual_seed(4); R = random.Random(4); torch.set_num_threads(1)
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
            if len(ч) >= 2: плохие.append(строка(ч[0], ч[1], ч[2] if len(ч) > 2 else ""))
    сл = Буквы(set("".join(строка(z["вид"], z["имя"], z["о"]) for z in все))); R.shuffle(все)
    пров = все[: len(все) // 10]; учз = все[len(все) // 10:]
    м = Судья(len(сл.т)); опт = torch.optim.Adam(м.parameters(), lr=2e-3)
    for ш in range(шагов):
        x, y = [], []
        for _ in range(32):
            z = R.choice(учз); x.append(сл.код(строка(z["вид"], z["имя"], z["о"] if R.random() < 0.6 else ""))); y.append(1.0)  # судить и по одному имени
            x.append(сл.код(R.choice(плохие) if плохие and R.random() < 0.3 else брак(z, все, по_виду, R, двуграммы))); y.append(0.0)
        п = F.binary_cross_entropy_with_logits(м(torch.tensor(x)), torch.tensor(y))
        опт.zero_grad(); п.backward(); опт.step()
        if (ш + 1) % 500 == 0:
            м.eval()
            with torch.no_grad():
                Rv = random.Random(9); ок = 0; n = 0
                for z in пров[:300]:
                    p1 = torch.sigmoid(м(torch.tensor([сл.код(строка(z["вид"], z["имя"], z["о"]))])))[0].item()
                    p0 = torch.sigmoid(м(torch.tensor([сл.код(брак(z, все, по_виду, Rv, двуграммы))])))[0].item()
                    ок += (p1 > 0.5) + (p0 < 0.5); n += 2
            м.train(); print(f"шаг {ш+1}: потеря {п.item():.3f}, точность на проверке {ок/n:.3f}", flush=True)
    torch.save({"м": м.state_dict(), "т": сл.т}, os.path.join(папка, "sudya.pt"))

def загрузить(папка):
    c = torch.load(os.path.join(папка, "sudya.pt")); сл = Буквы([]); сл.т = c["т"]; сл.и = {ch: i for i, ch in enumerate(сл.т)}
    м = Судья(len(сл.т)); м.load_state_dict(c["м"]); м.eval(); return м, сл

@torch.no_grad()
def оценка(м, сл, вид, имя, о=""): return torch.sigmoid(м(torch.tensor([сл.код(строка(вид, имя, о))])))[0].item()

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 3000, sys.argv[4] if len(sys.argv) > 4 else None)
    else:
        м, сл = загрузить(папка); print(round(оценка(м, сл, sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else ""), 3))
