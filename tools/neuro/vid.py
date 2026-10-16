"""vid.py — Определитель вида: на что похоже имя — на бога, человека, город, вещь, тварь… (в игру не входит).

Летописец держит вид слабо: среди выдумок под «персонажем» попадаются «Ступени» и «руда», под «вещью» — «Застава
Первого Слова». Определитель — линейная модель по буквосочетаниям имени (2–4 буквы с границами слова, хеш на 2^16
признаков) и простым приметам (число слов, заглавная, «из дома», «из рода», «Застава»), учится на корпусе второй
версии. В «Живом мире» из вариантов Летописца берётся тот, что больше похож на нужный вид.

  python3 vid.py train <папка данных>          — обучение и точность на отложенных именах
  python3 vid.py test  <папка данных> <имя>    — вероятности видов
"""
import sys, os, json, random, re, zlib
import torch, torch.nn.functional as F

H = 1 << 16

def признаки(имя):
    t = "^" + имя.lower() + "$"; инд = []
    for n in (2, 3, 4):
        for i in range(len(t) - n + 1): инд.append(zlib.crc32(t[i:i + n].encode()) % H)
    for сл in имя.lower().split(): инд.append(zlib.crc32(("w:" + сл).encode()) % H)  # слово целиком
    ws = имя.split()
    доп = [min(len(ws), 6) / 6, float(имя[:1].isupper()), float(" из дома " in имя or " из рода " in имя), float(len(ws) == 1)]
    return инд, доп

def пачка(имена):
    X = torch.zeros(len(имена), H + 4)
    for j, n in enumerate(имена):
        инд, доп = признаки(n)
        for i in инд: X[j, i] += 1.0
        X[j, H:] = torch.tensor(доп)
    return X

def учить(папка):
    torch.manual_seed(3)
    корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    виды = sorted({z["вид"] for z in корпус}); ви = {в: i for i, в in enumerate(виды)}
    random.Random(4).shuffle(корпус); пр = корпус[: len(корпус) // 10]; уч = корпус[len(корпус) // 10:]
    W = torch.zeros(H + 4, len(виды), requires_grad=True); b = torch.zeros(len(виды), requires_grad=True)
    опт = torch.optim.Adam([W, b], lr=0.02)
    Xп = пачка([z["имя"] for z in пр]); Yп = torch.tensor([ви[z["вид"]] for z in пр])
    for эп in range(30):
        random.shuffle(уч)
        for i in range(0, len(уч), 256):
            ч = уч[i:i + 256]; X = пачка([z["имя"] for z in ч]); Y = torch.tensor([ви[z["вид"]] for z in ч])
            п = F.cross_entropy(X @ W + b, Y) + 1e-5 * (W ** 2).sum(); опт.zero_grad(); п.backward(); опт.step()
        if (эп + 1) % 10 == 0:
            with torch.no_grad(): ток = ((Xп @ W + b).argmax(-1) == Yп).float().mean().item()
            print(f"эпоха {эп+1}: точность на отложенных {ток:.3f}", flush=True)
    with torch.no_grad():
        P = (Xп @ W + b).argmax(-1)
        for в in ("персонаж", "поселение", "бог", "вещь", "тварь", "грань"):
            м = Yп == ви[в]
            if м.any(): print(f"  {в}: узнан в {(P[м] == ви[в]).float().mean().item():.2f} из {int(м.sum())}")
    torch.save({"W": W.detach().half(), "b": b.detach(), "виды": виды}, os.path.join(папка, "vid.pt"))

def загрузить(папка):
    пут = os.path.join(папка, "vid.pt")
    if not os.path.exists(пут): return None
    z = torch.load(пут); W = z["W"].float(); b = z["b"]; виды = z["виды"]; ви = {в: i for i, в in enumerate(виды)}
    def p(вид, имя):
        """вероятность, что имя — этого вида"""
        if вид not in ви: return 0.5
        with torch.no_grad(): return torch.softmax(пачка([имя]) @ W + b, -1)[0, ви[вид]].item()
    p.виды = виды; p.все = lambda имя: dict(zip(виды, torch.softmax(пачка([имя]) @ W + b, -1)[0].tolist()))
    return p

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка)
    else:
        p = загрузить(папка); в = p.все(" ".join(sys.argv[3:]))
        print(sorted(((round(v, 3), k) for k, v in в.items()), reverse=True)[:5])
