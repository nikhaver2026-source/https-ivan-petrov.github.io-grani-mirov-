"""sudya.py — Судья: сеть, отличающая настоящие сущности мира от неудачных (в игру не входит).

Вход — запись «⟦вид⟧имя⟨о⟩описание» (первые 160 знаков). Выход — вероятность, что так могла быть написана
настоящая сущность этого вида. Учится отличать настоящие записи из таблиц игры от брака: имени чужого вида под этим
видом (бог с именем травы), перемешанных букв, бессвязных имён из сочетаний букв, оборванных описаний и — когда он
есть — порождённого Летописцем, которое Судья помечает как сомнительное по ходу дообучения. Летописец пишет много,
Судья оставляет лучшее.

(2-й Судья) Вид подаётся не знаком в начале строки — свёртки шириной до пяти знаков почти не связывали его с именем,
и «чужое имя под этим видом» Судья угадывал наугад (52 %), — а отдельно, прямо в решающий слой; заодно Судья учится
угадывать вид по самой записи (вторая голова): так в признаках появляется то, чем имя бога отличается от имени вещи.

(3-й Судья) Учится и на оценках Учителя (uchitel.py imena: Gemini ставит выдумкам Летописца 1–5): выдумки на 4–5 —
к настоящим, на 1–2 — к браку. Мерило — согласие с Учителем на отложенных выдумках: доля пар «хорошая — плохая», где
хорошая получила от Судьи балл выше (1,0 — полное согласие, 0,5 — наугад).

  python3 sudya.py train <папка данных> [шагов] [файл порождённого Летописцем, по строке «вид\tимя\tо», или оценки .jsonl]
  python3 sudya.py score <папка данных> <вид> <имя> [описание]
  python3 sudya.py meta  <папка данных> <оценки Учителя .jsonl[,…]> [наборы .jsonl] — Мета-судья поверх Судьи, Словника и Определителя вида
  python3 sudya.py vnutr <папка данных> <оценки Учителя .jsonl[,…]> [наборы .jsonl] — Внутренний судья на представлении Летописца
"""
import sys, os, json, random, collections, math
import torch, torch.nn as nn, torch.nn.functional as F
L = 160

def строка(вид, имя, о=""): return (f"⟦{вид}⟧{имя}⟨о⟩{о}")[:L]
def текст(имя, о=""): return (f"{имя}⟨о⟩{о}")[:L]

class Судья(nn.Module):
    """свёртки по буквам (ширина 2–7) → максимум и среднее по строке; решение — по признакам и виду вместе"""
    def __init__(s, V, NV, d=64, c=int(os.environ.get("SUD_C", "96"))):
        super().__init__(); s.e = nn.Embedding(V, d); s.ев = nn.Embedding(NV, 32)
        s.c = nn.ModuleList([nn.Conv1d(d, c, k, padding=k // 2) for k in (2, 3, 5, 7)])
        H = 2 * 4 * c
        s.o = nn.Sequential(nn.Dropout(0.3), nn.Linear(H + 32, 128), nn.GELU(), nn.Dropout(0.3), nn.Linear(128, 1))
        s.вид = nn.Sequential(nn.Dropout(0.3), nn.Linear(H, NV))
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
    плохие = []; хорошие = []; провер_у = []
    if порождённое and os.path.exists(порождённое) and порождённое.endswith(".jsonl"):
        оц = [json.loads(l) for l in open(порождённое, encoding="utf-8") if l.strip()]
        random.Random(8).shuffle(оц); провер_у = оц[: len(оц) // 6]  # отложенные оценки — для мерила согласия
        for z in оц[len(оц) // 6:]:
            if z["балл"] >= 4: хорошие.append((z["вид"], z["имя"], z.get("о", "")))
            elif z["балл"] <= 2: плохие.append((z["вид"], z["имя"], z.get("о", "")))
        print(f"оценки Учителя: хороших {len(хорошие)}, плохих {len(плохие)}, отложено {len(провер_у)}", flush=True)
    elif порождённое and os.path.exists(порождённое):
        for l in open(порождённое, encoding="utf-8"):
            ч = l.rstrip("\n").split("\t")
            if len(ч) >= 2: плохие.append((ч[0], ч[1], ч[2] if len(ч) > 2 else ""))
    виды = sorted(по_виду); ви = {в: i for i, в in enumerate(виды)}
    сл = Буквы(set("".join(текст(z["имя"], z["о"]) for z in все))); R.shuffle(все)
    пров = все[: len(все) // 10]; учз = все[len(все) // 10:]
    м = Судья(len(сл.т), len(виды)); опт = torch.optim.AdamW(м.parameters(), lr=2e-3, weight_decay=float(os.environ.get("SUD_WD", "5e-4")))
    def порча(v):
        """случайная порча букв (каждая десятая — «не знаю»): Судья не должен узнавать запись по заученному имени"""
        return [1 if c > 1 and R.random() < 0.1 else c for c in v]
    def сбалансированная():
        """средняя точность по настоящим и по браку на отложенных записях — по ней выбирается лучший снимок"""
        м.eval(); Rv = random.Random(9); да = нет = 0; n = min(300, len(пров))
        with torch.no_grad():
            for z in пров[:n]:
                да += torch.sigmoid(м(torch.tensor([сл.код(текст(z["имя"], z["о"]))]), torch.tensor([ви[z["вид"]]])))[0].item() > 0.5
                t0 = брак(z, все, по_виду, Rv, двуграммы); имя, _, о = t0[t0.index("⟧") + 1:].partition("⟨о⟩")
                нет += torch.sigmoid(м(torch.tensor([сл.код(текст(имя, о))]), torch.tensor([ви[z["вид"]]])))[0].item() < 0.5
        м.train(); return (да / n + нет / n) / 2, да / n, нет / n
    def согласие():
        """доля пар (выдумка лучше по Учителю, выдумка хуже), где Судья тоже ставит первую выше"""
        if not провер_у: return None
        м.eval()
        with torch.no_grad():
            о = [(z["балл"], torch.sigmoid(м(torch.tensor([сл.код(текст(z["имя"], z.get("о", "")))]), torch.tensor([ви.get(z["вид"], 0)])))[0].item()) for z in провер_у]
        м.train(); пары = [(a, b) for a in о for b in о if a[0] > b[0]]
        return sum(1 for a, b in пары if a[1] > b[1]) / max(1, len(пары))
    лучшая = (-1, None)
    def брак2(z):
        """брак как тройка (вид, имя, описание) — из прежнего брака (строка с меткой вида)"""
        t = брак(z, все, по_виду, R, двуграммы); имя_о = t[t.index("⟧") + 1:]
        имя, _, о = имя_о.partition("⟨о⟩"); return z["вид"], имя, о
    for ш in range(шагов):
        for g in опт.param_groups: g["lr"] = 2e-3 * min(1.0, (ш + 1) / 200) * (0.05 + 0.95 * 0.5 * (1 + math.cos(math.pi * ш / шагов)))
        x, в, y, вн = [], [], [], []
        for _ in range(48):
            if хорошие and R.random() < 0.2:  # выдумка, которую Учитель счёл хорошей, — к настоящим
                х_ = R.choice(хорошие); x.append(порча(сл.код(текст(х_[1], х_[2])))); в.append(ви.get(х_[0], 0)); y.append(1.0); z = R.choice(учз)
            else:
                z = R.choice(учз); x.append(порча(сл.код(текст(z["имя"], z["о"] if R.random() < 0.6 else "")))); в.append(ви[z["вид"]]); y.append(1.0)  # судить и по одному имени
            б = R.choice(плохие) if плохие and R.random() < (0.4 if хорошие else 0.3) else брак2(z)
            x.append(порча(сл.код(текст(б[1], б[2])))); в.append(ви.get(б[0], ви[z["вид"]])); y.append(0.0)
        X = torch.tensor(x); В = torch.tensor(в); Y = torch.tensor(y)
        r, лв = м(X, В, с_видом=True); настоящие = Y > 0.5
        п = F.binary_cross_entropy_with_logits(r, Y) + 0.5 * F.cross_entropy(лв[настоящие], В[настоящие])
        опт.zero_grad(); п.backward(); torch.nn.utils.clip_grad_norm_(м.parameters(), 1.0); опт.step()
        if (ш + 1) % 250 == 0:
            б_, да_, нет_ = сбалансированная(); сг = согласие()
            мерило = б_ if сг is None else 0.5 * б_ + 0.5 * сг  # (3) снимок выбирается и по согласию с Учителем
            if мерило > лучшая[0]: лучшая = (мерило, {k: v.clone() for k, v in м.state_dict().items()}, ш + 1)
            print(f"шаг {ш+1}: потеря {п.item():.3f}, на проверке: средняя {б_:.3f} (настоящие {да_:.3f}, брак {нет_:.3f})"
                  + (f", согласие с Учителем {сг:.3f}" if сг is not None else ""), flush=True)
    if лучшая[1] is not None: м.load_state_dict(лучшая[1]); print(f"лучший снимок — шаг {лучшая[2]}, мерило {лучшая[0]:.3f}", flush=True)
    torch.save({"м": м.state_dict(), "т": сл.т, "виды": виды, "версия": 3 if провер_у else 2}, os.path.join(папка, "sudya.pt"))

def загрузить(папка):
    c = torch.load(os.path.join(папка, "sudya.pt")); сл = Буквы([]); сл.т = c["т"]; сл.и = {ch: i for i, ch in enumerate(сл.т)}
    сл.виды = c["виды"]; сл.ви = {в: i for i, в in enumerate(сл.виды)}
    м = Судья(len(сл.т), len(сл.виды)); м.load_state_dict(c["м"]); м.eval(); return м, сл

@torch.no_grad()
def оценка(м, сл, вид, имя, о=""):
    в = сл.ви.get(вид)
    if в is None: return 0.5
    return torch.sigmoid(м(torch.tensor([сл.код(текст(имя, о))]), torch.tensor([в])))[0].item()

# ── Мета-судья: маленькая модель поверх готовых признаков, учится на оценках Учителя ──
# Свёрточный Судья, дообученный на тысяче оценок, заучивал сами имена (согласие с Учителем на отложенных 0,54 — хуже,
# чем без оценок, 0,63). Мета-судья — логистическая модель на дюжине признаков: оценка Судьи, вероятность нужного вида
# по второй голове Судьи («не тот вид» — главная беда выдумок), выдуманные слова и несогласие по Словнику, копия имени
# другого вида, длина имени, есть ли описание. Параметров мало — тысячи оценок хватает.
МЕТА_ПРИЗНАКИ = ["судья", "вид", "вид_лучший", "выдумано_имя", "выдумано_о", "несогласие", "копия", "слов", "букв", "есть_о", "о_букв", "заглавная",
                 "похож_на_вид", "похож_имена"]  # (2) похожесть по Определителю вида (vid.py) — вообще и у людей и городов
ИМЕННЫЕ_ВИДЫ = {"персонаж", "поселение"}

def мета_признаки(м, сл, сн, корпус_по_имени, вид, имя, о="", вд=None):
    import slovnik as СН
    в = сл.ви.get(вид)
    with torch.no_grad():
        r, лв = м(torch.tensor([сл.код(текст(имя, о))]), torch.tensor([в if в is not None else 0]), с_видом=True)
        pв = torch.softmax(лв[0], -1)
    ws = имя.split()
    return [torch.sigmoid(r[0]).item(), pв[в].item() if в is not None else 0.0, float(pв.argmax().item() == в) if в is not None else 0.0,
            сн.доля(имя), сн.доля(о), float(СН.несогласие(имя)),
            float(any(v != вид for v in корпус_по_имени.get(имя.lower(), ()))), min(len(ws), 8) / 8, min(len(имя), 60) / 60,
            float(bool(о)), min(len(о), 200) / 200, float(имя[:1].isupper())] + (
            lambda pv: [pv, pv if вид in ИМЕННЫЕ_ВИДЫ else 0.0])(вд(вид, имя) if вд else 0.5)

def мета_загрузить(папка):
    """Мета-судья, если обучен: функция (вид, имя, о) → оценка 0..1, иначе None"""
    пут = os.path.join(папка, "sudya_meta.json")
    if not os.path.exists(пут): return None
    import slovnik as СН
    z = json.load(open(пут, encoding="utf-8")); w = torch.tensor(z["w"]); b = z["b"]; м, сл = загрузить(папка); сн = СН.построить(папка)
    if len(w) < len(МЕТА_ПРИЗНАКИ): w = torch.cat([w, torch.zeros(len(МЕТА_ПРИЗНАКИ) - len(w))])  # снимок первой версии
    вд = None
    try:
        import vid as ВД; вд = ВД.загрузить(папка)
    except Exception: pass
    по_имени = collections.defaultdict(set)
    for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8"):
        x = json.loads(l); по_имени[x["имя"].lower()].add(x["вид"])
    return lambda вид, имя, о="": torch.sigmoid(torch.tensor(мета_признаки(м, сл, сн, по_имени, вид, имя, о, вд)) @ w + b).item()

def мета_учить(папка, оценки, наборы=None):
    """оценки — файл(ы) оценок Учителя (через запятую); наборы — наборы вариантов (nabory.py) с оценками в тех же файлах:
    по ним — главное мерило, средний балл выбранного варианта (две половины наборов: учимся на одной, проверяем на другой)"""
    import slovnik as СН
    torch.manual_seed(5); м, сл = загрузить(папка); сн = СН.построить(папка)
    try:
        import vid as ВД; вд = ВД.загрузить(папка)
    except Exception: вд = None
    корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    по_имени = collections.defaultdict(set)
    for z in корпус: по_имени[z["имя"].lower()].add(z["вид"])
    оц = []
    for пут in оценки.split(","): оц += [json.loads(l) for l in open(пут, encoding="utf-8") if l.strip()]
    балл = {(z["вид"], z["имя"]): z["балл"] for z in оц}
    X = lambda зз: torch.tensor([мета_признаки(м, сл, сн, по_имени, z["вид"], z["имя"], z.get("о", ""), вд) for z in зз])
    def обучить(учз):
        Xу = X(учз); Yу = torch.tensor([(z["балл"] - 1) / 4 for z in учз])
        w = torch.zeros(len(МЕТА_ПРИЗНАКИ), requires_grad=True); b = torch.zeros(1, requires_grad=True); опт = torch.optim.Adam([w, b], lr=0.05)
        for _ in range(2000):
            п = F.binary_cross_entropy_with_logits(Xу @ w + b, Yу) + 1e-3 * (w ** 2).sum(); опт.zero_grad(); п.backward(); опт.step()
        return w.detach(), b.detach()
    if наборы:
        нб = []
        for l in open(наборы, encoding="utf-8"):
            н = json.loads(l); x = [v for v in н["набор"] if (н["вид"], v["имя"]) in балл]
            if len(x) >= 2: нб.append((н["вид"], x))
        random.Random(3).shuffle(нб); пол = [нб[0::2], нб[1::2]]; в_наборах = {(в, v["имя"]) for в, x in нб for v in x}
        прочие = [z for z in оц if (z["вид"], z["имя"]) not in в_наборах]
        выб = collections.defaultdict(list)
        for k in (0, 1):
            учз = прочие + [{"вид": в, "имя": v["имя"], "о": v["о"], "балл": балл[(в, v["имя"])]} for в, x in пол[1 - k] for v in x]
            w, b = обучить(учз)
            for в, x in пол[k]:
                Xн = X([{"вид": в, "имя": v["имя"], "о": v["о"]} for v in x]); оц_н = (Xн @ w + b).tolist()
                выб["новый"].append(балл[(в, x[max(range(len(x)), key=lambda i: оц_н[i])]["имя"])])
                выб["прежний"].append(балл[(в, max(x, key=lambda v: v["мета"] + {"персонаж": 1.5, "поселение": 0.5}.get(в, 0.1) * v["вид_p"])["имя"])])
                выб["случайно"].append(sum(балл[(в, v["имя"])] for v in x) / len(x)); выб["лучший"].append(max(балл[(в, v["имя"])] for v in x))
        print("средний балл выбранного варианта (две половины наборов):", {k: round(sum(v) / len(v), 2) for k, v in выб.items()})
    random.Random(8).shuffle(оц)
    пров, учз = оц[: len(оц) // 6], оц[len(оц) // 6:]
    Xп = X(пров); w, b = обучить(учз)
    def согласие(оценка, зз):
        о = list(zip([z["балл"] for z in зз], оценка.tolist())); пары = [(a, c) for a in о for c in о if a[0] > c[0]]
        return sum(1 for a, c in пары if a[1] > c[1]) / max(1, len(пары))
    with torch.no_grad(): итог = {"мета-судья": согласие(Xп @ w + b, пров), "Судья v2": согласие(Xп[:, 0], пров),
                                  "Судья v2 − Словник": согласие(Xп[:, 0] - (0.6 * Xп[:, 3] + 0.3 * Xп[:, 4] + 0.3 * Xп[:, 5]), пров)}
    print("согласие с Учителем на отложенных:", {k: round(v, 3) for k, v in итог.items()})
    print("веса:", {k: round(v, 2) for k, v in zip(МЕТА_ПРИЗНАКИ, w.tolist())})
    w, b = обучить(оц)  # итоговый — на всех оценках
    json.dump({"признаки": МЕТА_ПРИЗНАКИ, "w": w.tolist(), "b": b.item(), "согласие": итог}, open(os.path.join(папка, "sudya_meta.json"), "w"), ensure_ascii=False)

# ── Внутренний судья: внутреннее представление имени у самого Летописца (letopisec.вектор) → гребневая регрессия на
# оценки Учителя. Один он отбирает хуже Мета-судьи (3,1 против 3,27 в наборах), но вместе с ним — лучше (3,40):
# Летописец «знает», насколько имя похоже на то, что он видел, а Мета-судья — форму, вид и копии.
def критик(папка, м=None, сл=None):
    """Летописец, глазами которого смотрит Внутренний судья: «критик» — другой снимок (letopisec_kritik.pt), а без него —
    сам Летописец папки. Свои выдумки сеть-генератор считает правдоподобными все, и судья на её представлении в свежих
    наборах ничего не прибавлял (3,23); на представлении другого снимка — прибавляет (3,40–3,46)"""
    import letopisec as Л
    пут = os.path.join(папка, "letopisec_kritik.pt")
    if os.path.exists(пут): return Л.загрузить(папка, снимок=пут)
    return (м, сл) if м is not None else Л.загрузить(папка)

def внутр_учить(папка, оценки, наборы=None, лам=300.0):
    import letopisec as Л
    torch.set_num_threads(int(os.environ.get("SUD_THREADS", "2"))); м, сл = критик(папка); м.eval()
    оц = collections.defaultdict(list)
    for пут in оценки.split(","):
        for l in open(пут, encoding="utf-8"):
            z = json.loads(l); оц[(z["вид"], z["имя"])].append(z["балл"])
    ключи = list(оц); X = torch.stack([Л.вектор(м, сл, в, и) for в, и in ключи]); Y = torch.tensor([sum(оц[k]) / len(оц[k]) for k in ключи])
    def гребень(Xa, Ya):
        mu, sd = Xa.mean(0), Xa.std(0) + 1e-6; Z = (Xa - mu) / sd; ym = Ya.mean()
        return mu, sd, torch.linalg.solve(Z.T @ Z + лам * torch.eye(Z.shape[1]), Z.T @ (Ya - ym)), ym.item()
    print(f"Внутренний судья: оценённых {len(ключи)}, признаков {X.shape[1]}", flush=True)
    if наборы:  # проверка по наборам: учимся без половины наборов, выбираем в ней
        import random as _r
        нб = []
        for l in open(наборы, encoding="utf-8"):
            н = json.loads(l); в = н["вид"]; x = [dict(v, балл=sum(оц[(в, v["имя"])]) / len(оц[(в, v["имя"])])) for v in н["набор"] if (в, v["имя"]) in оц]
            if len(x) >= 2: нб.append((в, x))
        инд = {k: i for i, k in enumerate(ключи)}; пор = list(range(len(нб))); _r.Random(3).shuffle(пор)
        вв = {"персонаж": 1.5, "поселение": 0.5}; итог = collections.defaultdict(list)
        for пол in (пор[::2], пор[1::2]):
            искл = {(нб[j][0], v["имя"]) for j in пол for v in нб[j][1]}
            уч = [i for i, k in enumerate(ключи) if k not in искл]; mu, sd, w, ym = гребень(X[уч], Y[уч])
            for j in пол:
                в, x = нб[j]; п = (((torch.stack([X[инд[(в, v["имя"])]] for v in x]) - mu) / sd) @ w + ym).tolist()
                итог["случайно"].append(sum(v["балл"] for v in x) / len(x)); итог["лучший"].append(max(v["балл"] for v in x))
                итог["внутренний"].append(x[max(range(len(x)), key=lambda i: п[i])]["балл"])
                if "мета" in x[0]:
                    итог["мета+вид"].append(max(x, key=lambda v: v["мета"] + вв.get(в, 0.1) * v["вид_p"])["балл"])
                    итог["мета+вид+внутр"].append(x[max(range(len(x)), key=lambda i: x[i]["мета"] + вв.get(в, 0.1) * x[i]["вид_p"] + ВЕС_ВНУТР * п[i] / 5)]["балл"])
        print("выбор в наборах (средний балл Учителя):", ", ".join(f"{k} {sum(v) / len(v):.2f}" for k, v in итог.items()), flush=True)
    mu, sd, w, ym = гребень(X, Y)
    torch.save({"mu": mu, "sd": sd, "w": w, "ym": ym, "лам": лам, "оценённых": len(ключи)}, os.path.join(папка, "sudya_vnutr.pt"))
    print("сохранён sudya_vnutr.pt", flush=True)

ВЕС_ВНУТР = 1.5  # вес Внутреннего судьи при отборе («Живой мир»): мета + вес_вида × вид + 1,5 × балл/5

def внутр_загрузить(папка, м=None, сл=None):
    """Внутренний судья, если обучен: функция (вид, имя) → ожидаемый балл Учителя (1..5), иначе None. Признаки — от
    Летописца-критика этой папки (или самого Летописца): новый критик — и судью учить заново (sudya.py vnutr)"""
    пут = os.path.join(папка, "sudya_vnutr.pt")
    if not os.path.exists(пут): return None
    import letopisec as Л
    z = torch.load(пут); м, сл = критик(папка, м, сл)
    def балл(вид, имя):
        м.eval(); return (((Л.вектор(м, сл, вид, имя) - z["mu"]) / z["sd"]) @ z["w"] + z["ym"]).item()
    return балл

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 6000, sys.argv[4] if len(sys.argv) > 4 else None)
    elif cmd == "meta": мета_учить(папка, sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    elif cmd == "vnutr": внутр_учить(папка, sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    else:
        м, сл = загрузить(папка); print(round(оценка(м, сл, sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else ""), 3))
