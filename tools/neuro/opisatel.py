"""opisatel.py — Описатель: суть нового (короткое описание) по имени и чертам (в игру пока не входит).

Летописец писал имя и описание одной записью, и описание выходило бессвязным: Учитель ставил ему 1,97 из 5 (80 %
плохих), настоящим описаниям игры — 4,36. Описаний в таблицах игры около 2,5 тысячи — по ним сеть по буквам выучивает
правописание, но не смысл. Описатель — отдельная сеть того же устройства (letopisec.py), обученная на большом корпусе
описаний «имя + черты → суть»: черты — то, что Мастер свойств сказал о новом (нрав и места твари, климат края, облик
и части вещи, роль и нрав персонажа, откуда взялся бог), и то, где оно появилось. Описание пишется к уже выбранному
имени; из нескольких вариантов берётся лучший.

черты(вид, свойства, доп) — строка черт в том виде, в каком сеть их видит («нрав=хищник; охотится=ночью; …»): одна и
та же функция и для учебного корпуса, и в «Живом мире».
"""
import re

# коды таблиц игры — словами
КОДЫ = {"autumn": "осень", "spring": "весна", "summer": "лето", "winter": "зима", "water": "вода", "dirt": "земля",
        "sand": "песок", "rock": "камень", "stone": "камень", "snow": "снег", "ice": "лёд", "mud": "грязь", "grass": "трава",
        "sea": "море", "heat": "жар", "cold": "холод", "forest": "лес", "swamp": "болото", "mountain": "горы", "cave": "пещера",
        "plains": "равнина", "desert": "пустыня", "tundra": "тундра", "jungle": "джунгли", "coast": "побережье",
        "volcano": "вулкан", "ruins": "руины", "any": "любая", "night": "ночь", "day": "день"}
# какие черты важны для сути (по виду) — остальное (числа, служебное) не берётся
ВАЖНЫЕ = {
    "тварь": ["нрав", "охотится", "водится"],
    "земля": ["климат", "биомы", "ресурс", "опасность"],
    "бог": ["откуда", "тип", "сфера"],
    "поселение": ["земли", "товар", "нужда", "край"],
    "подземелье": ["ресурс", "твари", "ловушка", "край"],
    "вещь": ["ранг", "облик", "части", "чары", "проклятие", "творец"],
    "персонаж": ["роль", "народ", "нрав"],
    "ресурс": ["кат", "пора", "почва", "край"],
    "находка": ["встречается", "край"],
    "грань": ["откуда", "край"],
    "миф": ["откуда"],
}
МАКС = 4

def _слово(v):
    if isinstance(v, (list, tuple)): return ", ".join(_слово(x) for x in list(v)[:2] if _слово(x))
    if isinstance(v, dict): return ""
    if isinstance(v, float): return "" if abs(v) < 10 else str(round(v))
    v = str(v).strip(); v = КОДЫ.get(v, v)
    v = re.split(r",? урон \d| — ", v)[0].strip()  # ловушка «тяжести (камень), урон 11 — сродни …» → «тяжести (камень)»
    if re.fullmatch(r"[A-Za-z_]+", v): return ""  # непереведённый код таблицы — не черта
    return re.sub(r"\s+", " ", v)[:40]

def черты(вид, свойства=None, доп=None):
    """→ строка «k=v; k=v» (до четырёх черт): сначала доп (откуда, роль, край), затем свойства Мастера"""
    все = {}
    for источник in (доп or {}, свойства if isinstance(свойства, dict) else {}):
        for k, v in источник.items():
            if k not in все and _слово(v): все[k] = _слово(v)
    порядок = ВАЖНЫЕ.get(вид, list(все))
    пары = [f"{k}={все[k]}" for k in порядок if k in все][:МАКС]
    return "; ".join(пары)

# событие мира → вид нового и то, что о нём известно сверх свойств Мастера (откуда взялось, край, роль, творец)
ВИД_СОБЫТИЯ = {"тварь_пришла": "тварь", "ресурс_открыт": "ресурс", "персонаж_пришёл": "персонаж", "артефакт_выкован": "вещь",
               "город_основан": "поселение", "подземелье_открыто": "подземелье", "объект_появился": "находка",
               "грань_открылась": "грань", "миф_родился": "миф", "земля_поднялась": "земля", "бог_из_грани": "бог",
               "бог_дух_места": "бог", "бог_наследник": "бог", "бог_апофеоз": "бог"}
ОТКУДА = {"бог_из_грани": "сила из грани", "бог_дух_места": "дух края", "бог_наследник": "наследник павшего бога",
          "бог_апофеоз": "смертный, вознесённый верой", "грань_открылась": "грань над краем"}

def доп_из_события(e, мир, ц):
    """что известно о новом из самого события: откуда, край (его земля), роль и народ, творец, о чём миф"""
    текст = мир.летопись[-1]["текст"]; доп = {}
    if e in ОТКУДА: доп["откуда"] = ОТКУДА[e]
    кр = re.search(r"кра[яе]м? «([^»]+)»", текст)
    if кр:
        рег = next((р for р in мир.регионы if р["имя"] == кр.group(1)), None)
        if рег: доп["край"] = мир.биом_имя.get(рег["биом"], рег["биом"])
    вид = ВИД_СОБЫТИЯ.get(e)
    if вид == "персонаж" and мир.персонажи: доп.update(роль=мир.персонажи[-1].get("роль"), народ=мир.персонажи[-1].get("народ"))
    if вид == "вещь" and isinstance(ц, dict): доп["творец"] = "бог" if "сфера" in ц else (ц.get("роль") or "")
    if вид == "миф":
        о = re.search(r"«(.+)»", текст); доп["откуда"] = re.sub(r"Безымянн\w+ \w+ \d+", "", о.group(1))[:40].strip(" —,") if о else ""
    return доп

def загрузить(папка, вариантов=6, T=0.7):
    """Описатель из папки: функция (вид, имя, черты) → описание, или None. Если в папке сеть по частям слов
    (opisatel_best.pt + opisatel_bpe.json) — лучшее из OP_K (48) вариантов по «уверенность − ошибки грамоты» без
    шаблонов, уже сказанных в этом мире (память — на всё время жизни функции); иначе сеть по буквам (letopisec.pt) —
    лучшее из нескольких по средней уверенности"""
    import os, letopisec as Л
    if папка and os.path.exists(os.path.join(папка, "opisatel_best.pt")) and os.path.exists(os.path.join(папка, "opisatel_bpe.json")):
        м, т = сеть_загрузить(папка); было = set(); K = int(os.environ.get("OP_K", "48"))
        def описать_ч(вид, имя, черты_=""):
            р = сеть_лучшее(м, т, вид, имя, черты_ or "", K, T=T, было=было)
            return р[0] if р else ""
        return описать_ч
    if not папка or not os.path.exists(os.path.join(папка, "letopisec_vocab.json")): return None
    м, сл = Л.загрузить(папка)
    def описать(вид, имя, черты_=""):
        вар = Л.описать(м, сл, вид, имя, вариантов, черты_ or None, T=T, пачка=вариантов + 2)
        if not вар: return ""
        ув = Л.уверенность_описаний(м, сл, вид, имя, вар, черты_ or None)
        return вар[max(range(len(вар)), key=lambda i: ув[i])]
    return описать

# ── (2) сеть по частям слов. Сеть по буквам при таком объёме данных не удерживала ни согласования, ни смысла
# («Бледный мир сплетает под сводом над бурей…»), а черты пропускала. Здесь текст режется на части слов (BPE, 6000
# частей: частые слова целиком, редкие — основой и окончанием): предложение в 3–4 раза короче, правописание решено
# словарём, и сеть учит только порядок слов, согласование и смысл. Устройство — то же, что у Летописца (трансформер
# с кэшем внимания), шире: 384 × 6.
СЛУЖ_Ч = ["<pad>", "<и>", "<о>", "<к>", "<ч>", "</ч>"]
ВИДЫ_Ч = ["бог", "тварь", "вещь", "ресурс", "подземелье", "земля", "поселение", "персонаж", "находка", "миф", "грань",
          "держава", "народ", "чары", "зверь", "растение", "зелье", "здание", "история", "вера", "слух"]

def запись_ч(вид, имя, черты_="", о=None):
    return f"⟦{вид}⟧" + (f"<ч>{черты_}</ч>" if черты_ else "") + f"<и>{имя}<о>" + ((о + "<к>") if о is not None else "")

def словарь_учить(тексты, путь, размер=6000):
    from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders
    т = Tokenizer(models.BPE(unk_token="<unk>"))
    т.pre_tokenizer = pre_tokenizers.Metaspace(); т.decoder = decoders.Metaspace()
    особые = СЛУЖ_Ч + ["<unk>"] + [f"⟦{в}⟧" for в in ВИДЫ_Ч]
    т.train_from_iterator(тексты, trainers.BpeTrainer(vocab_size=размер, special_tokens=особые, min_frequency=2))
    т.save(путь); return т

def _ч_текст(z):
    ч = z.get("черты") or {}
    return "; ".join(f"{k}={v}" for k, v in list(ч.items())[:4]) if isinstance(ч, dict) else str(ч)

def сеть_учить(папка, шагов=4000, d=384, L=6, ctx=96, B=32, lr=1e-3):
    """учит сеть описаний по частям слов на corpus.jsonl папки (вид, имя, черты, о); лучший снимок — по проверке"""
    import os, json, math, random, time, torch, torch.nn.functional as F
    from tokenizers import Tokenizer
    import letopisec as Л
    torch.set_num_threads(int(os.environ.get("OP_THREADS", "3"))); torch.manual_seed(1); random.seed(7)
    зап = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    random.shuffle(зап); пр, уч = зап[: max(200, len(зап) // 20)], зап[max(200, len(зап) // 20):]
    пс = os.path.join(папка, "opisatel_bpe.json")
    т = Tokenizer.from_file(пс) if os.path.exists(пс) else словарь_учить([запись_ч(z["вид"], z["имя"], _ч_текст(z), z["о"]) for z in уч], пс)
    V = т.get_vocab_size(); к = т.token_to_id("<к>")
    код = lambda z, ч=True: т.encode(запись_ч(z["вид"], z["имя"], _ч_текст(z) if ч else "", z["о"])).ids
    Л.CTX = ctx; м = Л.Летописец(V, d=d, L=L, p=float(os.environ.get("OP_P", "0.1")))
    опт = torch.optim.AdamW(м.parameters(), lr=lr, weight_decay=0.1, betas=(0.9, 0.95))
    пут = os.path.join(папка, "opisatel.pt"); шаг0 = 0; лучшая = 99.0
    if os.path.exists(пут):
        c = torch.load(пут); м.load_state_dict(c["м"]); шаг0 = c["шаг"]; лучшая = c.get("лучшая", 99.0)
        if "опт" in c: опт.load_state_dict(c["опт"])  # снимок лучшего (без состояния оптимизатора) — тоже годится
    # OP_TEXT — живой русский текст игры (строки), доля OP_TEXT_P пачки: грамматика и связность сверх описаний
    тексты = [l.strip() for l in open(os.environ["OP_TEXT"], encoding="utf-8") if l.strip()] if os.environ.get("OP_TEXT") else []
    доля_т = float(os.environ.get("OP_TEXT_P", "0.25"))
    def пачка():
        xs = []
        for _ in range(B):
            q = []
            while len(q) < ctx + 1:
                q += т.encode(random.choice(тексты) + "<к>").ids if тексты and random.random() < доля_т else код(random.choice(уч), random.random() < 0.9)
            xs.append(torch.tensor(q[: ctx + 1]))
        x = torch.stack(xs); return x[:, :-1], x[:, 1:]
    @torch.no_grad()
    def проверка():
        м.eval(); нат = 0.0; зн = 0
        for z in пр[:400]:
            ids = код(z); x = torch.tensor([ids[:ctx]]); л = F.log_softmax(м(x[:, :-1])[0], -1); ц = x[0, 1:]
            о_нач = ids.index(т.token_to_id("<о>")) if т.token_to_id("<о>") in ids else 0
            нат -= л[torch.arange(len(ц)), ц][о_нач:].sum().item(); зн += len(z["о"]) + 1
        м.train(); return нат / зн / math.log(2)
    print(f"Описатель (части слов): словарь {V}, весов {sum(p.numel() for p in м.parameters()) / 1e6:.1f} млн, с шага {шаг0}", flush=True)
    t0 = time.time(); ср = None
    for ш in range(шаг0, шагов):
        for g in опт.param_groups: g["lr"] = lr * min(1, (ш + 1) / 200) * (0.1 + 0.9 * 0.5 * (1 + math.cos(math.pi * ш / шагов)))
        x, y = пачка(); м.train(); п = F.cross_entropy(м(x).reshape(-1, V), y.reshape(-1))
        опт.zero_grad(); п.backward(); torch.nn.utils.clip_grad_norm_(м.parameters(), 1.0); опт.step()
        ср = п.item() if ср is None else 0.98 * ср + 0.02 * п.item()
        if (ш + 1) % 100 == 0: print(f"шаг {ш + 1}: потеря {ср:.3f}, {time.time() - t0:.0f} с", flush=True)
        if (ш + 1) % 500 == 0 or ш + 1 == шагов:
            б = проверка(); print(f"  проверка: описание {б:.3f} бит на знак", flush=True)
            if б < лучшая:
                лучшая = б; torch.save({"м": м.state_dict(), "V": V, "d": d, "L": L, "ctx": ctx, "шаг": ш + 1, "бит": б}, os.path.join(папка, "opisatel_best.pt"))
                print(f"  лучший снимок: шаг {ш + 1}", flush=True)
            torch.save({"м": м.state_dict(), "опт": опт.state_dict(), "шаг": ш + 1, "лучшая": лучшая}, пут + ".tmp"); os.replace(пут + ".tmp", пут)

def сеть_загрузить(папка):
    """сеть описаний по частям слов → (сеть, словарь частей) или None"""
    import os, torch
    from tokenizers import Tokenizer
    import letopisec as Л
    пут = os.path.join(папка, "opisatel_best.pt")
    if not os.path.exists(пут): return None
    z = torch.load(пут); Л.CTX = z["ctx"]; м = Л.Летописец(z["V"], d=z["d"], L=z["L"]); м.load_state_dict(z["м"]); м.eval()
    return м, Tokenizer.from_file(os.path.join(папка, "opisatel_bpe.json"))

_НАЧАЛА = {}

def _начала_слов(т, V):
    """части, с которых начинается слово из четырёх и больше букв (основы) — их повтор штрафуется"""
    import torch
    if id(т) not in _НАЧАЛА:
        м = torch.zeros(V)
        for i in range(V):
            ч = т.id_to_token(i) or ""
            if ч.startswith("▁") and len(ч) > 4 and ч[1:].isalpha(): м[i] = 1.0
        _НАЧАЛА[id(т)] = м
    return _НАЧАЛА[id(т)]

def сеть_описать(м, т, вид, имя, черты_="", сколько=6, T=0.7, top_p=0.9, пен=0.0):
    """варианты описания одной пачкой с кэшем внимания → [(описание, средняя лог-вероятность части)];
    пен — штраф (в логитах) за уже сказанную основу слова, только для выбора, не для оценки уверенности"""
    import torch, torch.nn.functional as F
    import letopisec as Л
    ctx = м.pos.weight.shape[0]; нач = т.encode(запись_ч(вид, имя, черты_)).ids[-(ctx - 40):]; к = т.token_to_id("<к>")
    B = сколько + 2
    with torch.no_grad():
        x = torch.tensor([нач] * B); жив = torch.ones(B, dtype=torch.bool); длина = torch.full((B,), -1); лп = torch.zeros(B)
        л, кэш = Л.вперёд_кэш(м, x[:1]); кэш = [(a.expand(B, -1, -1, -1), b.expand(B, -1, -1, -1)) for a, b in кэш]; л = л[:, -1].expand(B, -1)
        if пен: осн = _начала_слов(т, л.shape[-1]); был = torch.zeros(B, л.shape[-1])
        for _ in range(ctx - x.shape[1]):
            лс = F.log_softmax(л, -1); p = F.softmax((л - пен * был if пен else л) / T, -1)
            sp, si = torch.sort(p, descending=True, dim=-1); cs = torch.cumsum(sp, -1); sp[cs - sp > top_p] = 0
            c = si.gather(1, torch.multinomial(sp / sp.sum(-1, keepdim=True), 1))
            if пен: был.scatter_(1, c, torch.maximum(был.gather(1, c), осн[c]))
            лп += torch.where(жив, лс.gather(1, c)[:, 0], torch.zeros(B))
            конец = жив & (c[:, 0] == к); длина[конец] = x.shape[1]; жив &= ~конец
            x = torch.cat([x, c], 1)
            if not жив.any() or x.shape[1] >= ctx: break
            л, кэш = Л.вперёд_кэш(м, c, кэш, x.shape[1] - 1); л = л[:, -1]
    вывод, было = [], set()
    for i in range(B):
        if длина[i] < 0: continue
        о = т.decode(x[i, len(нач):длина[i]].tolist()).strip()
        if len(о) < 8 or о in было or "<" in о or "⟦" in о: continue
        было.add(о); вывод.append((о, лп[i].item() / max(1, длина[i].item() - len(нач) + 1)))
    return вывод[:сколько]

ВЕС_ОШИБКИ = 0.4  # «уверенность − 0,4 × ошибки грамоты»: связь с баллом Учителя 0,54 (одна уверенность — 0,42)

ВЕС_ШАБЛОНА = 0.2  # за каждую тройку слов, уже бывшую в выбранных описаниях этого мира

def тройки(о):
    """тройки слов описания и его первое слово (зачин «Сияющий…» у каждого бога — тоже шаблон)"""
    сл = re.findall(r"[а-яё]+", о.lower())
    return {" ".join(сл[i:i + 3]) for i in range(len(сл) - 2)} | ({"^" + сл[0]} if сл else set())

def сеть_лучшее(м, т, вид, имя, черты_="", сколько=16, T=0.7, top_p=0.9, пен=0.0, было=None):
    """лучшее из вариантов сети: средняя лог-вероятность частей минус ВЕС_ОШИБКИ за каждую ошибку грамоты
    (gramota.py; без pymorphy3 — только уверенность) и ВЕС_ШАБЛОНА за каждую тройку слов из прежних описаний
    (было — множество троек; выбранное описание добавляет в него свои) → (описание, оценка) или None"""
    вар = []
    for _ in range(max(1, сколько // 16)): вар += сеть_описать(м, т, вид, имя, черты_, min(16, сколько), T=T, top_p=top_p, пен=пен)
    if not вар: return None
    try:
        import gramota as Г
        ош = lambda о: len(Г.ошибки(о, имя + " " + черты_))
        Г.морф()
    except ImportError:
        ош = lambda о: 0
    шаб = (lambda о: len(тройки(о) & было)) if было is not None else (lambda о: 0)
    лучш = max(((о, лп - ВЕС_ОШИБКИ * ош(о) - ВЕС_ШАБЛОНА * шаб(о)) for о, лп in вар), key=lambda x: x[1])
    if было is not None: было |= тройки(лучш[0])
    return лучш

def сеть_вектор(м, т, вид, имя, черты_, о):
    """внутреннее представление описания у Описателя (для судьи описаний): среднее скрытое состояние по частям
    описания, состояние на конце и уверенность (средняя и худшая лог-вероятность частей)"""
    import torch, torch.nn.functional as F
    ctx = м.pos.weight.shape[0]; н = len(т.encode(запись_ч(вид, имя, черты_)).ids)
    ids = т.encode(запись_ч(вид, имя, черты_, о)).ids; n = len(ids) - н; ids = ids[-ctx:]
    with torch.no_grad():
        x = torch.tensor([ids]); T = x.shape[1]; h = м.e(x) + м.pos(torch.arange(T))
        for б in м.b: h = б(h, м.маска[:T, :T])
        h = м.n(h)[0]; л = F.log_softmax(м.o(h[:-1]), -1); ц = x[0, 1:]; лп = л[torch.arange(len(ц)), ц][-n:]
        return torch.cat([h[-n - 1:-1].mean(0), h[-1], torch.tensor([лп.mean().item(), лп.min().item()])])

def сеть_уверенность(м, т, вид, имя, черты_, описания):
    """средняя лог-вероятность частей каждого готового описания (вместе с концом <к>) при данном входе → [float]"""
    import torch, torch.nn.functional as F
    ctx = м.pos.weight.shape[0]; н = len(т.encode(запись_ч(вид, имя, черты_)).ids); вых = []
    with torch.no_grad():
        for о in описания:
            ids = т.encode(запись_ч(вид, имя, черты_, о)).ids; n = len(ids) - н; ids = ids[-ctx:]
            лс = F.log_softmax(м(torch.tensor([ids[:-1]])), -1)[0]
            цель = torch.tensor(ids[1:]); лп = лс[torch.arange(len(цель)), цель][-n:]
            вых.append(лп.mean().item())
    return вых
