"""letopisec.py — Летописец: порождающая сеть мира (трансформер по буквам, условный по виду сущности).

Учится в два этапа на одной и той же сети:
  1) язык мира — окна по 256 знаков из всего русского текста игры (text.txt);
  2) сущности — записи «⟦вид⟧⟨черты⟩⟨и⟩имя⟨о⟩описание⟨к⟩» из таблиц мира (corpus.jsonl), вперемешку с текстом,
     чтобы сеть не забывала язык.
Пишет новое: по виду (и, если заданы, чертам) — имя и суть; имена, повторяющие уже существующие или слишком близкие
к ним, отбрасываются.

  python3 letopisec.py train <папка данных> [шагов] [этап: язык|сущности|оба]
  python3 letopisec.py write <папка данных> <вид> [сколько] [черты: ключ=значение;…]
  python3 letopisec.py eval  <папка данных>       — потеря на проверке, доля нового, образцы по всем видам
  python3 letopisec.py dump  <папка данных> [на вид] [файл] — выдумки всех видов «вид\tимя\tо» (для Учителя и Судьи)
Потоки — LET_THREADS (по умолчанию 2). Снимок — <папка>/letopisec.pt (каждые 250 шагов; обучение продолжает с него).
"""
import sys, os, json, math, time, random, re, collections, itertools
import torch, torch.nn as nn, torch.nn.functional as F

СЛУЖ = ["<pad>", "⟨и⟩", "⟨о⟩", "⟨к⟩", "⟨ч⟩", "⟨/ч⟩", "\n"]
ВИДЫ = ["бог", "грань", "миф", "история", "держава", "народ", "тварь", "зверь", "чары", "вещь", "ресурс", "растение",
        "зелье", "земля", "поселение", "подземелье", "здание", "находка", "персонаж", "вера", "слух"]
CTX = int(os.environ.get("LET_CTX", "256"))

class Словарь:
    def __init__(s, знаки):
        s.т = СЛУЖ + ["⟦" + в + "⟧" for в in ВИДЫ] + sorted(знаки)
        s.и = {t: i for i, t in enumerate(s.т)}
        s.спец = sorted([t for t in s.т if len(t) > 1], key=len, reverse=True)
    def код(s, текст):
        out, i = [], 0
        while i < len(текст):
            for t in s.спец:
                if текст.startswith(t, i): out.append(s.и[t]); i += len(t); break
            else:
                out.append(s.и.get(текст[i], s.и["<pad>"])); i += 1
        return out
    def текст(s, коды): return "".join(s.т[c] for c in коды if c != 0)

def запись(z, с_чертами=True):
    ч = ""
    if с_чертами and z.get("черты"):
        пары = [f"{k}={v}" for k, v in z["черты"].items()][:4]
        ч = "⟨ч⟩" + "; ".join(пары) + "⟨/ч⟩"
    о = ("⟨о⟩" + z["о"]) if z.get("о") else ""
    return f"⟦{z['вид']}⟧{ч}⟨и⟩{z['имя']}{о}⟨к⟩"

class Блок(nn.Module):
    def __init__(s, d, h, p):
        super().__init__(); s.n1 = nn.LayerNorm(d); s.a = nn.MultiheadAttention(d, h, dropout=p, batch_first=True)
        s.n2 = nn.LayerNorm(d); s.f = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d), nn.Dropout(p))
    def forward(s, x, маска):
        y = s.n1(x); x = x + s.a(y, y, y, attn_mask=маска, need_weights=False)[0]
        return x + s.f(s.n2(x))

class Летописец(nn.Module):
    def __init__(s, V, d=int(os.environ.get("LET_D", "256")), L=int(os.environ.get("LET_L", "6")), h=8, p=float(os.environ.get("LET_P", "0.1"))):
        super().__init__(); s.e = nn.Embedding(V, d); s.pos = nn.Embedding(CTX, d); s.drop = nn.Dropout(p)
        s.b = nn.ModuleList([Блок(d, h, p) for _ in range(L)]); s.n = nn.LayerNorm(d); s.o = nn.Linear(d, V, bias=False)
        s.o.weight = s.e.weight
        s.register_buffer("маска", torch.triu(torch.full((CTX, CTX), float("-inf")), 1), persistent=False)
        s.apply(s._нач)
    @staticmethod
    def _нач(m):
        """малые начальные веса (как у трансформеров): иначе общие веса входа и выхода дают огромные оценки и учёба вязнет"""
        if isinstance(m, (nn.Linear, nn.Embedding)):
            nn.init.normal_(m.weight, 0.0, 0.02)
            if getattr(m, "bias", None) is not None: nn.init.zeros_(m.bias)
    def forward(s, x):
        T = x.shape[1]; h = s.drop(s.e(x) + s.pos(torch.arange(T)))
        for б in s.b: h = б(h, s.маска[:T, :T])
        return s.o(s.n(h))

def данные(папка):
    текст = open(os.path.join(папка, "text.txt"), encoding="utf-8").read()
    корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    знаки = set(текст) | set("".join(z["имя"] + z["о"] + json.dumps(z.get("черты", {}), ensure_ascii=False) for z in корпус))
    # служебные метки разбираются целиком (сл.спец) раньше отдельных знаков, поэтому их буквы остаются в алфавите;
    # прежде отсюда вычитались все буквы меток — строчные «о», «и», «к», «ч» (и латинские a, d, p) становились
    # пустым местом, и сеть училась на тексте без самых частых букв
    знаки -= {"⟨", "⟩", "⟦", "⟧"}; знаки.discard("\n")
    нет = [б for б in "абвгдежзийклмнопрстуфхцчшщъыьэюяё" if б not in знаки]
    if нет: raise SystemExit(f"в алфавите Летописца нет букв: {''.join(нет)}")
    return текст, корпус, знаки

def готовить(папка):
    текст, корпус, знаки = данные(папка)
    пс = os.path.join(папка, "letopisec_vocab.json")
    if os.path.exists(пс): сл = Словарь([]); сл.т = json.load(open(пс, encoding="utf-8")); сл.и = {t: i for i, t in enumerate(сл.т)}; сл.спец = sorted([t for t in сл.т if len(t) > 1], key=len, reverse=True)
    else: сл = Словарь(знаки); json.dump(сл.т, open(пс, "w", encoding="utf-8"), ensure_ascii=False)
    random.seed(7); пров_ид = set(random.sample(range(len(корпус)), max(50, len(корпус) // 20)))
    учить = [z for i, z in enumerate(корпус) if i not in пров_ид]; пров = [z for i, z in enumerate(корпус) if i in пров_ид]
    т = torch.tensor(сл.код(текст), dtype=torch.long); n = len(т); тп = т[: n * 95 // 100]; тв = т[n * 95 // 100:]
    return сл, тп, тв, учить, пров, корпус

def пачка_текст(т, B):
    i = torch.randint(0, len(т) - CTX - 1, (B,)); x = torch.stack([т[j:j + CTX + 1] for j in i]); return x[:, :-1], x[:, 1:]

def пачка_записи(сл, записи, B, накоп=None):
    xs = []
    for _ in range(B):
        # несколько записей подряд в одно окно — сеть видит много сущностей сразу
        к = []
        while len(к) < CTX + 1:
            z = random.choices(записи, cum_weights=накоп)[0] if накоп else random.choice(записи)
            к += сл.код(запись(z, random.random() < float(os.environ.get("LET_PCH", "0.7")))) + [сл.и["\n"]]
        xs.append(torch.tensor(к[:CTX + 1]))
    x = torch.stack(xs); y = x[:, 1:].clone(); y[y == 0] = -100; return x[:, :-1], y

def учить(папка, шагов, этап):
    torch.set_num_threads(int(os.environ.get("LET_THREADS", "2"))); torch.manual_seed(1)
    сл, тп, тв, учз, прз, _ = готовить(папка); V = len(сл.т)
    м = Летописец(V); пут = os.path.join(папка, "letopisec.pt"); шаг0 = 0
    опт = torch.optim.AdamW(м.parameters(), lr=float(os.environ.get("LET_LR", "6e-4")), weight_decay=float(os.environ.get("LET_WD", "0.05")), betas=(0.9, 0.95))
    лучшая = float(json.load(open(пут + ".лучший"))["бит"]) if os.path.exists(пут + ".лучший") else 99.0
    if os.path.exists(пут):
        c = torch.load(пут); сс = c["м"]
        if сс["pos.weight"].shape[0] < м.pos.weight.shape[0]:  # окно шире снимка (Описатель: 160 → 256): прежние места — как были,
            ст = сс["pos.weight"]; н = м.pos.weight.shape[0]  # новые — копией последних прежних
            сс["pos.weight"] = torch.cat([ст, ст[-(н - ст.shape[0]):]]); c.pop("опт", None)
        м.load_state_dict(сс); шаг0 = c["шаг"]
        if "опт" in c: опт.load_state_dict(c["опт"])  # снимок без состояния оптимизатора (лучший) — начинается с чистого
    print(f"Летописец: словарь {V}, весов {sum(p.numel() for p in м.parameters())/1e6:.2f} млн, с шага {шаг0}", flush=True)
    B = int(os.environ.get("LET_B", "24")); t0 = time.time(); ср = None
    # LET_VES — вес образцов Учителя и отобранных выдумок (из: УЧИТЕЛЬ, ОТБОР) в пачках записей (корпус третьей версии)
    вес = float(os.environ.get("LET_VES", "1")); накоп = None
    if вес != 1: накоп = list(itertools.accumulate(вес if z.get("из") in ("УЧИТЕЛЬ", "ОТБОР") else 1.0 for z in учз))
    for ш in range(шаг0, шагов):
        доля_записей = 0.0 if этап == "язык" else (0.75 if этап == "сущности" else min(0.75, max(0.0, (ш - шагов * 0.45) / (шагов * 0.2)) * 0.75))
        lr = float(os.environ.get("LET_LR", "6e-4")) * min(1.0, (ш + 1) / 300) * (0.1 + 0.9 * 0.5 * (1 + math.cos(math.pi * ш / шагов)))
        for g in опт.param_groups: g["lr"] = lr
        x, y = пачка_записи(сл, учз, B, накоп) if random.random() < доля_записей else пачка_текст(тп, B)
        м.train(); п = F.cross_entropy(м(x).reshape(-1, V), y.reshape(-1), ignore_index=-100)
        опт.zero_grad(); п.backward(); torch.nn.utils.clip_grad_norm_(м.parameters(), 1.0); опт.step()
        ср = п.item() if ср is None else 0.98 * ср + 0.02 * п.item()
        if (ш + 1) % 50 == 0: print(f"шаг {ш+1}: потеря {ср:.3f} (записей {доля_записей:.2f}), {time.time()-t0:.0f} с", flush=True)
        if (ш + 1) % 250 == 0 or ш + 1 == шагов:
            torch.save({"м": м.state_dict(), "опт": опт.state_dict(), "шаг": ш + 1}, пут + ".tmp"); os.replace(пут + ".tmp", пут)
            # (18) проверка на сущностях, которых сеть не видела, — чаще, когда идут записи; лучший снимок — отдельно:
            # 6×256 к концу заучивала таблицы (проверка 1,80 → 2,15 бит) и копировала имена чужих видов
            if (ш + 1) % 1000 == 0 or ш + 1 == шагов or (доля_записей > 0 and (ш + 1) % 500 == 0):
                пр = оценка_потери(м, сл, тв, прз, V); print("  проверка:", пр, flush=True)
                if доля_записей > 0 and пр["сущности_бит_на_знак"] < лучшая:
                    лучшая = пр["сущности_бит_на_знак"]; torch.save({"м": м.state_dict(), "шаг": ш + 1}, os.path.join(папка, "letopisec_best.pt"))
                    json.dump({"бит": лучшая, "шаг": ш + 1}, open(пут + ".лучший", "w")); print(f"  лучший снимок: шаг {ш + 1}, {лучшая:.3f} бит", flush=True)
                for в in random.sample(ВИДЫ, 3): print("  образец", в, "→", "; ".join(n for n, _ in писать(м, сл, в, 2, известные=set())), flush=True)
        if доля_записей > 0 and not os.path.exists(os.path.join(папка, "letopisec_язык.pt")):  # снимок конца языкового этапа — для новых попыток
            torch.save({"м": м.state_dict(), "опт": опт.state_dict(), "шаг": ш + 1}, os.path.join(папка, "letopisec_язык.pt"))

@torch.no_grad()
def оценка_потери(м, сл, тв, прз, V):
    м.eval(); torch.manual_seed(5); random.seed(5)
    пт = [F.cross_entropy(м(x).reshape(-1, V), y.reshape(-1)).item() for x, y in [пачка_текст(тв, 16) for _ in range(8)]]
    пз = [F.cross_entropy(м(x).reshape(-1, V), y.reshape(-1), ignore_index=-100).item() for x, y in [пачка_записи(сл, прз, 16) for _ in range(8)]]
    return {"текст_бит_на_знак": round(sum(пт) / len(пт) / math.log(2), 3), "сущности_бит_на_знак": round(sum(пз) / len(пз) / math.log(2), 3)}

def близко(a, b):
    a, b = a.lower(), b.lower()
    if a == b: return True
    if abs(len(a) - len(b)) > 3: return False
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, cb in enumerate(b, 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (ca != cb))
    return d[-1] <= max(1, len(a) // 6)

@torch.no_grad()
def писать(м, сл, вид, сколько, черты=None, известные=None, T=0.85, top_p=0.92, попыток=None):
    """имена (и описания) вида: варианты пишутся пачками с кэшем внимания; известные и почти одинаковые отсеиваются"""
    м.eval(); вывод = []; попыток = попыток or сколько * 6
    нач = сл.код(f"⟦{вид}⟧" + (("⟨ч⟩" + черты + "⟨/ч⟩") if черты else "") + "⟨и⟩")
    к_конец = сл.и["⟨к⟩"]; сделано = 0
    while сделано < попыток and len(вывод) < сколько:
        B = min(попыток - сделано, max(4, (сколько - len(вывод)) * 3)); сделано += B
        with torch.no_grad():
            x = torch.tensor([нач] * B); жив = torch.ones(B, dtype=torch.bool); длина = torch.full((B,), -1)
            л, кэш = вперёд_кэш(м, x[:1]); кэш = [(k.expand(B, -1, -1, -1), v.expand(B, -1, -1, -1)) for k, v in кэш]; л = л[:, -1].expand(B, -1)
            for _ in range(CTX - x.shape[1] - 1):
                p = F.softmax(л / T, -1)
                sp, si = torch.sort(p, descending=True, dim=-1); cs = torch.cumsum(sp, -1); sp[cs - sp > top_p] = 0
                c = si.gather(1, torch.multinomial(sp / sp.sum(-1, keepdim=True), 1))
                конец = жив & ((c[:, 0] == к_конец) | (c[:, 0] == сл.и["\n"])); длина[конец] = x.shape[1]; жив &= ~конец
                x = torch.cat([x, c], 1)
                if not жив.any() or x.shape[1] >= CTX: break
                л, кэш = вперёд_кэш(м, c, кэш, x.shape[1] - 1); л = л[:, -1]
        for i in range(B):
            if длина[i] < 0: continue
            t = сл.текст(x[i, len(нач):длина[i]].tolist()).strip()
            имя, _, о = t.partition("⟨о⟩"); имя = имя.strip()
            if not (2 <= len(имя) <= 60) or "⟦" in имя or "⟨" in имя: continue
            if известные is not None and any(близко(имя, k) for k in известные): continue
            if any(близко(имя, n) for n, _ in вывод): continue
            вывод.append((имя, о.strip()))
            if len(вывод) >= сколько: break
    return вывод

@torch.no_grad()
def вперёд_кэш(м, x, кэш=None, поз0=0):
    """прямой проход только по новым знакам x [B, t] с кэшем ключей и значений прежних (по слою) — для порождения:
    шаг стоит как один знак, а не как вся строка. → (логиты [B, t, V], кэш)"""
    кэш = кэш or [None] * len(м.b); B, t = x.shape
    h = м.e(x) + м.pos(torch.arange(поз0, поз0 + t))
    for li, б in enumerate(м.b):
        y = б.n1(h); H = б.a.num_heads; d = y.shape[-1]; dh = d // H
        q, k, v = F.linear(y, б.a.in_proj_weight, б.a.in_proj_bias).chunk(3, -1)
        q, k, v = (z.view(B, t, H, dh).transpose(1, 2) for z in (q, k, v))
        if кэш[li] is not None: k = torch.cat([кэш[li][0], k], 2); v = torch.cat([кэш[li][1], v], 2)
        кэш[li] = (k, v); Tk = k.shape[2]
        маска = torch.ones(t, Tk, dtype=torch.bool).tril(diagonal=Tk - t)
        а = ((q @ k.transpose(-1, -2)) / math.sqrt(dh)).masked_fill(~маска, float("-inf")).softmax(-1)
        h = h + б.a.out_proj((а @ v).transpose(1, 2).reshape(B, t, d))
        h = h + б.f(б.n2(h))
    return м.o(м.n(h)), кэш

@torch.no_grad()
def описать(м, сл, вид, имя, сколько=1, черты=None, T=0.8, top_p=0.9, пачка=None):
    """описание к уже выбранному имени: начало записи «⟦вид⟧⟨ч⟩черты⟨/ч⟩⟨и⟩имя⟨о⟩» — сеть дописывает суть до ⟨к⟩;
    варианты пишутся одной пачкой (по цене почти одного). → список разных описаний (без пустых и оборванных)"""
    м.eval(); B = пачка or max(сколько, 1) + 2
    нач = сл.код(f"⟦{вид}⟧" + (("⟨ч⟩" + черты + "⟨/ч⟩") if черты else "") + "⟨и⟩" + имя + "⟨о⟩")[-(CTX - 24):]
    к_конец, к_н = сл.и["⟨к⟩"], сл.и["\n"]
    x = torch.tensor([нач] * B); жив = torch.ones(B, dtype=torch.bool); длина = torch.full((B,), -1)
    л, кэш = вперёд_кэш(м, x[:1]); кэш = [(k.expand(B, -1, -1, -1), v.expand(B, -1, -1, -1)) for k, v in кэш]; л = л[:, -1].expand(B, -1)
    for t in range(CTX - x.shape[1]):
        p = F.softmax(л / T, -1)
        sp, si = torch.sort(p, descending=True, dim=-1); cs = torch.cumsum(sp, -1); sp[cs - sp > top_p] = 0
        c = si.gather(1, torch.multinomial(sp / sp.sum(-1, keepdim=True), 1))
        конец = жив & ((c[:, 0] == к_конец) | (c[:, 0] == к_н)); длина[конец] = x.shape[1]; жив &= ~конец
        x = torch.cat([x, c], 1)
        if not жив.any() or x.shape[1] >= CTX: break
        л, кэш = вперёд_кэш(м, c, кэш, x.shape[1] - 1); л = л[:, -1]
    вывод = []
    for i in range(B):
        if длина[i] < 0: continue
        о = сл.текст(x[i, len(нач):длина[i]].tolist()).strip()
        if len(о) < 8 or "⟨" in о or "⟦" in о or о in вывод: continue
        вывод.append(о)
    return вывод[:сколько] if сколько else вывод

@torch.no_grad()
def уверенность_описаний(м, сл, вид, имя, описания, черты=None):
    """средняя лог-вероятность букв каждого описания (и знака конца) при этом имени и чертах — для отбора лучшего
    варианта (у описаний, в отличие от имён, гладкость текста и есть первое мерило)"""
    м.eval(); нач = сл.код(f"⟦{вид}⟧" + (("⟨ч⟩" + черты + "⟨/ч⟩") if черты else "") + "⟨и⟩" + имя + "⟨о⟩")[-(CTX - 24):]
    итог = []
    for о in описания:
        x = torch.tensor([(нач + сл.код(о) + [сл.и["⟨к⟩"]])[:CTX]]); л = F.log_softmax(м(x[:, :-1])[0], -1)
        ц = x[0, 1:]; лп = л[torch.arange(len(ц)), ц][len(нач) - 1:]; итог.append(лп.mean().item())
    return итог

@torch.no_grad()
def вектор(м, сл, вид, имя):
    """внутреннее представление имени у Летописца (для Внутреннего судьи, sudya.py vnutr): среднее скрытое состояние по
    буквам имени, состояние на знаке конца и уверенность (средний и худший лог-вероятность букв)"""
    нач = сл.код(f"⟦{вид}⟧⟨и⟩"); тело = сл.код(имя) + [сл.и["⟨к⟩"]]
    x = torch.tensor([(нач + тело)[:CTX]]); T = x.shape[1]
    h = м.e(x) + м.pos(torch.arange(T))
    for б in м.b: h = б(h, м.маска[:T, :T])
    h = м.n(h)[0]; л = F.log_softmax(м.o(h[:-1]), -1); ц = x[0, 1:]; лп = л[torch.arange(len(ц)), ц][len(нач) - 1:]
    return torch.cat([h[len(нач):T - 1].mean(0), h[-1], torch.tensor([лп.mean().item(), лп.min().item()])])

def загрузить(папка, снимок=None):
    сл = Словарь([]); сл.т = json.load(open(os.path.join(папка, "letopisec_vocab.json"), encoding="utf-8"))
    сл.и = {t: i for i, t in enumerate(сл.т)}; сл.спец = sorted([t for t in сл.т if len(t) > 1], key=len, reverse=True)
    # ширина, число слоёв и окно — по самому снимку (192×4 и 256×6 лежат в разных папках)
    global CTX
    лучший = os.path.join(папка, "letopisec_best.pt")  # лучший по проверке на незнакомых сущностях, если есть
    if снимок is None: снимок = лучший if os.path.exists(лучший) and os.environ.get("LET_LAST") != "1" else os.path.join(папка, "letopisec.pt")
    z = torch.load(снимок)["м"]
    d = z["n.weight"].shape[0]; L = 1 + max(int(k.split(".")[1]) for k in z if k.startswith("b."))
    CTX = z["pos.weight"].shape[0]
    м = Летописец(len(сл.т), d=d, L=L); м.load_state_dict(z); return м, сл

if __name__ == "__main__":
    cmd, папка = sys.argv[1], sys.argv[2]
    if cmd == "train": учить(папка, int(sys.argv[3]) if len(sys.argv) > 3 else 8000, sys.argv[4] if len(sys.argv) > 4 else "оба")
    elif cmd == "write":
        torch.set_num_threads(2); м, сл = загрузить(папка)
        корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
        изв = {z["имя"] for z in корпус if z["вид"] == sys.argv[3]}
        for имя, о in писать(м, сл, sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 8, sys.argv[5] if len(sys.argv) > 5 else None, изв):
            print(f"{имя} — {о}" if о else имя)
    elif cmd == "dump":  # выдумки всех видов в файл «вид\tимя\tо» — для оценок Учителя и обучения Судьи
        torch.set_num_threads(int(os.environ.get("LET_THREADS", "2"))); torch.manual_seed(int(os.environ.get("LET_SEED", "3"))); м, сл = загрузить(папка)
        корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 60; вых = sys.argv[4] if len(sys.argv) > 4 else os.path.join(папка, "vydumki.tsv")
        with open(вых, "w", encoding="utf-8") as f:
            for в in ВИДЫ:
                изв = {z["имя"] for z in корпус if z["вид"] == в}
                for T_ in (0.7, 0.85, 1.0):  # разная смелость — Судье нужны и хорошие, и плохие выдумки
                    for имя, о in писать(м, сл, в, max(1, n // 3), известные=изв, T=T_):
                        f.write(f"{в}\t{имя}\t{о}\n")
                f.flush(); print(в, flush=True)
    elif cmd == "eval":
        torch.set_num_threads(2); м, сл = загрузить(папка); сл2, тп, тв, учз, прз, корпус = готовить(папка)
        print(оценка_потери(м, сл, тв, прз, len(сл.т)))
        for в in ВИДЫ:
            изв = {z["имя"] for z in корпус if z["вид"] == в}; р = писать(м, сл, в, 4, известные=изв)
            print(f"{в}: " + " | ".join(f"{n} — {o[:90]}" if o else n for n, o in р))
