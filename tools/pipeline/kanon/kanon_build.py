"""kanon_build.py — данные канона для модуля игры kanon180_late.js: из canon/*.jsonl и разметки kanon_*.py собирает
/root/S/hron/kanon180_data.json. Сам проверяет, что каждое заклинание проходит законы плетения игры (школа даёт ядро, ядро держится
в форме), имена не повторяются ни между собой, ни с игрой, все звуки есть в банке (bank из dump.json или новые kn_*).
  python3 kanon_build.py → данные + отчёт; код 1 при ошибке."""
import json, glob, re, sys, os
sys.path.insert(0, "/root/S/kanon")
import kanon_magic as KM

C = "/root/S/lit/canon"; OUT = "/root/S/hron/kanon180_data.json"
MAG = open("/root/S/kanon/mag_region.js", encoding="utf-8").read()
DUMP = json.load(open("/root/S/kanon/dump.json"))
BANK = set(DUMP["bank"]); NEWSND = set()  # новые записи kn_* (синтез) — заводятся модулем в SOUND_BANK
ош = []

def lc(s):  # «о» школьных чар игры: со строчной, без точки в конце
    s = s.strip().rstrip(".")
    return s[:1].lower() + s[1:] if s and not s[:2].isupper() else s

# ── ядра и формы игры (для проверки совместимости, как spellIncompat) ──
CORES = {}
for m in re.finditer(r'\{id:"(\w+)",\s*n:"[^"]+",\s*род:"[^"]+",\s*k:\s*[\d.]+,\s*сем:\[([^\]]*)\],\s*формы:\[([^\]]*)\]', MAG):
    CORES[m.group(1)] = dict(сем=re.findall(r'"([^"]+)"', m.group(2)), формы=re.findall(r'"([^"]+)"', m.group(3)))
FORMS = {}
for m in re.finditer(r'\{id:"(\w+)",n:"[^"]+",имя:"[^"]+",род:"[^"]+",дальность:[\d.]+,радиус:[\d.]+,подготовка:[\d.]+,откат:[\d.]+,база:[\d.]+,сем:\[([^\]]*)\]', MAG):
    FORMS[m.group(1)] = dict(сем=re.findall(r'"([^"]+)"', m.group(2)))
assert len(CORES) == 16 and len(FORMS) == 12, (len(CORES), len(FORMS))
SEM = {s["id"]: s["сем"] for s in DUMP["schools"]}
ELEM_SCHOOLS = {}
for f in KM.FORMS: FORMS[f["id"]] = dict(сем=f["сем"])
for c, add in KM.CORE_FORMS.items(): CORES[c]["формы"] = CORES[c]["формы"] + [x for x in add if x not in CORES[c]["формы"]]
for s in KM.SCHOOLS: SEM[s["id"]] = s["сем"]
SCHOOL_ELEM = {}
for m in re.finditer(r'\{id:"(e_\w+)",[^\n]*школы:\[([^\]]*)\]', MAG):
    for sid in re.findall(r'"(\w+)"', m.group(2)): SCHOOL_ELEM[sid] = m.group(1)
for s in KM.SCHOOLS: SCHOOL_ELEM[s["id"]] = s["elem"]

def incompat(school, form, core, elem=None):
    sem = SEM.get(school); f = FORMS.get(form); c = CORES.get(core)
    if not sem or not f or not c: return f"нет школы/формы/ядра {school}/{form}/{core}"
    if sem not in f["сем"]: return f"форма {form} чужда школе {school} ({sem})"
    if sem not in c["сем"]: return f"ядро {core} не даётся школе {school} ({sem})"
    if form not in c["формы"]: return f"ядро {core} не держится в форме {form}"
    el = elem or SCHOOL_ELEM.get(school, "e_order")
    if core == "heal" and el in ("e_fire", "e_bone", "e_chaos"): return f"{el} не лечит"
    if core == "veil" and el in ("e_storm", "e_fire"): return f"{el} не прячет"
    if core == "ward" and el == "e_chaos": return "хаос не щит"
    if core == "bless" and el == "e_blood": return "кровью не благословляют"
    return ""

def snd(x, где):
    if x is None: return
    if x.startswith("kn_"): NEWSND.add(x); return
    if x not in BANK: ош.append(f"{где}: звука «{x}» нет в банке")

# ── канон ──
CANON = []
for f in sorted(glob.glob(f"{C}/[0-9][0-9]_*.jsonl")):
    if f.endswith("00_shkoly.jsonl"): continue
    for l in open(f, encoding="utf-8"):
        z = json.loads(l); z.pop("мотив", None); z["пакет"] = os.path.basename(f)[:2]; CANON.append(z)
BY = {z["имя"]: z for z in CANON}

# ── магия ──
РАНГ = {1: dict(сила=0.9, откат=0, золото=40), 2: dict(сила=1.15, откат=2, золото=120), 3: dict(сила=1.45, откат=5, золото=300)}
def spell_rec(src, m, idx):
    school = m.get("школа") or src["школа"]; form = m.get("форма") or src["форма"]; core = m["ядро"]; ранг = int(src["ранг"])
    why = incompat(school, form, core, m.get("стихия") or src.get("стихия"))
    if why: ош.append(f"заклинание «{src['имя']}»: {why}")
    r = РАНГ[ранг]
    rec = dict(id=f"kn_sp_{idx}", n=src["имя"], school=school, форма=form, ранг=ранг, сила=r["сила"], cost=int(src["цена"]),
               откат=r["откат"], золото=r["золото"], о=lc(src["о"]), ядро=core)
    if m.get("стихия") or src.get("стихия"): rec["стихия"] = m.get("стихия") or src.get("стихия")
    if m.get("особое"): rec["особое"] = m["особое"]
    rec["звукО"] = src.get("звук", ""); rec["механика"] = src.get("механика", "")
    return rec

base, extra = [], []
idx = 0
for name, m in KM.SPELLS.items():
    src = BY.get(name)
    if not src: ош.append(f"заклинания «{name}» нет в каноне"); continue
    idx += 1; rec = spell_rec(src, m, idx)
    (base if m["role"] == "base" else extra).append(rec)
for s in KM.NEW_SPELLS:
    idx += 1; src = dict(имя=s["имя"], школа=s["школа"], форма=s["форма"], ранг=s["ранг"], цена=s["цена"], о=s["о"], звук=s["звук"], механика=s["механика"])
    base.append(spell_rec(src, dict(ядро=s["ядро"]), idx))
# в каноне все заклинания размечены
for z in CANON:
    if z["вид"] == "заклинание" and z["имя"] not in KM.SPELLS: ош.append(f"заклинание канона «{z['имя']}» без разметки")
# по три у каждой новой школы, ступени 1–3
for s in KM.SCHOOLS:
    ранги = sorted(r["ранг"] for r in base if r["school"] == s["id"])
    if ранги != [1, 2, 3]: ош.append(f"школа {s['id']}: чары академии {ранги}, нужно 1, 2, 3")
names = [r["n"] for r in base + extra]
if len(set(names)) != len(names): ош.append("повтор имени заклинания")
game_spells = set(DUMP["spells"])
for n in names:
    if n in game_spells: ош.append(f"заклинание «{n}» уже есть в игре")

schools = []
for s in KM.SCHOOLS:
    for k in ("звук", "голос"): snd(s[k], f"школа {s['id']}")
    for l, v in s["audio"].items(): snd(v, f"слой {l} школы {s['id']}")
    specs = []
    for sid, n, core, el, zv, о in s["specs"]:
        snd(zv, f"специализация {n}")
        ok = [f["id"] for f in [dict(id=k) for k in FORMS] if not incompat(s["id"], f["id"], core, el)]
        if not ok: ош.append(f"специализация {n} ({s['id']}): ни одной годной формы")
        specs.append(dict(id=sid, школа=s["id"], n=n, ядро=core, стихия=el, звук=zv, о=о))
    schools.append(dict(id=s["id"], n=s["n"], род=s["род"], сем=s["сем"], k=s["k"], звук=s["звук"], голос=s["голос"], elem=s["elem"], fac=s["fac"],
                        audio=s["audio"], specs=specs))
for f in KM.FORMS: snd(f["звук"], f"форма {f['id']}")

# ── твари ──
import kanon_creatures as KC
CRE = KC.build_manual(CANON)
БОГ = {"beast": "wood", "crawler": "deep", "bird": "storm", "giant": "stone", "construct": "forge", "spirit": "moon", "undead": "navy",
       "fiend": "ash", "dragon": "ash", "deep": "deep", "humanoid": "road", "bone": "navy"}
НАРОДЫ = {}
for z in CANON:
    if z["вид"] == "народ": НАРОДЫ.setdefault(z["пакет"], []).append(z["имя"])
for t in CRE:
    t["бог"] = БОГ.get(t["род"], "wood")
    н = НАРОДЫ.get(t["пакет"], [])
    t["кто"] = (f"О них знают {н[0]}" + (f" и {н[1]}" if len(н) > 1 else "") + ".") if н else ""
    t["цена"] = int(round(12 + t["max"] * 6))
names_t = [t["n"] for t in CRE] + [t["трофей"] for t in CRE]
if len(set(names_t)) != len(names_t): ош.append("повтор имени твари или трофея")
GAME_MON = {m["n"] for m in DUMP["monsters"]}
for t in CRE:
    if t["n"] in GAME_MON: ош.append(f"тварь «{t['n']}» уже есть в игре")
SND_FILES = json.load(open("/root/S/kanon/synth/files.json", encoding="utf-8"))
# ── питомцы и скакуны ──
import kanon_pets as KP
BANKF = json.load(open("/root/S/kanon/bank_full.json", encoding="utf-8"))
ALLBANK = set(BANK) | set(BANKF)
used_snd = {}
for p in DUMP["zvsnd"].values():
    for r, v in p.items():
        if isinstance(v, list): used_snd.setdefault(r, set()).add("+".join(sorted(v)))
ZA = json.load(open("/root/S/kanon/zvabil.json", encoding="utf-8"))
used_abil = {json.dumps(x[4], ensure_ascii=False) for L in ZA["abil"].values() for x in L if len(x) > 4 and x[4]}
PETS, ош_п = KP.build(CANON, ALLBANK, used_snd, used_abil, list(SND_FILES), {x[0] for L in ZA['abil'].values() for x in L}, {f"{p['г'][0]}@{p['п']}" for p in DUMP['zvsnd'].values()})
ош += ош_п
for x in PETS:
    for r, v in x["снд"].items():
        if isinstance(v, list):
            for k in v: snd(k, f"зверь {x['имя']}")
    for a in x["способности"]:
        for layer in a["зв"]:
            for k in layer: snd(k, f"способность {a['n']}")
# громкость новых для зверей записей — как zv_level.py (к −14 дБ звучащей части, пик не выше −3 дБ)
sys.path.insert(0, "/root/S/hron")
import zv_level as ZL
IDX = open("/home/user/https-ivan-petrov.github.io-grani-mirov-/index.html", encoding="utf-8").read()
ZVL = json.loads(re.search(r"const ZV_LEVEL=(\{[^\n]*?\});", IDX).group(1))
def files_of(k):
    if k in SND_FILES: return SND_FILES[k]
    if k in BANKF: return BANKF[k]["f"]
    if k in DUMP["bank"]: return DUMP["bank"][k]["f"]
    return []
need = set()
for x in PETS:
    for v in x["снд"].values():
        if isinstance(v, list):
            for k in v: need.update(files_of(k))
    for a in x["способности"]:
        for layer in a["зв"]:
            for k in layer: need.update(files_of(k))
ZV_NEW = {}
SNDR = "/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"
for f in sorted(need):
    if f in ZVL: continue
    pth = SNDR + f
    if not os.path.exists(pth): pth = "/root/S/kanon/snd_hold/" + os.path.basename(f) if f.startswith("kanon/") else pth
    if not os.path.exists(pth): ош.append(f"нет файла {f}"); continue
    m = ZL.measure(pth)
    if not m: ош.append(f"не замерить {f}"); continue
    lvl, pk = m
    ZV_NEW[f] = round(max(ZL.KMIN, min(ZL.KMAX, 10 ** ((ZL.TARGET - lvl) / 20), 10 ** ((ZL.CEIL - pk) / 20))), 2)
for r in NEWSND:
    if r not in SND_FILES: ош.append(f"новый звук {r}: нет файлов синтеза")
# ── вещи ──
import kanon_items as KI
ART_ST = {m.group(1): float(m.group(2)) for m in re.finditer(r'\{id:"([^"]+)",\s*n:"[^"]+",\s*ед:"[^"]+",\s*предел:[\d.]+,\s*шаг:([\d.]+)', IDX)}
SCH_N = {s["id"]: s["n"] for s in DUMP["schools"]}
SCH_N.update({s["id"]: s["n"] for s in KM.SCHOOLS})
ITEMS, ош_в = KI.build(CANON, ART_ST, SCH_N)
ош += ош_в
names_all = [t["n"] for t in CRE] + [x["имя"] for x in PETS] + [x["имя"] for x in ITEMS]
if len(set(names_all)) != len(names_all): ош.append("повтор имени среди тварей, зверей и вещей")
data = dict(items=ITEMS, pets=PETS, zvLevel=ZV_NEW, версия="18.0", sounds={r: SND_FILES[r] for r in sorted(NEWSND) if r in SND_FILES}, schools=schools, forms=KM.FORMS, coreForms=KM.CORE_FORMS, schoolSpells=base, extraSpells=extra, creatures=CRE, newSounds=sorted(NEWSND))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"вещей {len(ITEMS)}, зверей {len(PETS)}, новых громкостей {len(ZV_NEW)}; тварей {len(CRE)}; школ {len(schools)}, специализаций {sum(len(s['specs']) for s in schools)}, форм {len(KM.FORMS)}, чар академии {len(base)}, у наставников {len(extra)}; новых звуков {len(NEWSND)}: {sorted(NEWSND)}")
print(f"ошибки ({len(ош)}):", *ош[:40], sep="\n  ")
sys.exit(1 if ош else 0)
