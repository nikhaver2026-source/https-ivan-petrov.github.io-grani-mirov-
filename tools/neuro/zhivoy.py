"""zhivoy.py — Живой мир: все сети Режиссёра вместе (в игру не входит).

Сердце мира выбирает, что случится; Летописец даёт имя новому (несколько вариантов — Судья оставляет лучший, повторов
нет); Мастер свойств даёт числа и признаки новым тварям, растениям, землям и богам. На выходе — летопись мира за
заданное число лет (Markdown) и опись всего нового, что мир породил.

  python3 zhivoy.py <папка данных> [лет] [зерно] [файл вывода .md]
"""
import sys, os, json, random, collections
import torch
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mir as M, serdce as S

ВИД_МАСТЕРА = {"тварь": "MONSTERS", "растение": "PLANTS", "земля": "REGIONS", "бог": "LESSER_GODS"}

def имена(папка, R):
    """функция имени: Летописец пишет варианты, Судья выбирает; если сетей нет — None (мир даст заглушку)"""
    try:
        import letopisec as Л, sudya as СД
        os.environ.setdefault("LET_D", "192"); os.environ.setdefault("LET_L", "4")
        м, сл = Л.загрузить(папка)
    except Exception as e:
        print("Летописец не загружен:", e); return None, {}
    try: су, ссл = СД.загрузить(папка)
    except Exception: су = None
    корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
    изв = collections.defaultdict(set)
    for z in корпус: изв[z["вид"]].add(z["имя"])
    опись = collections.defaultdict(list)
    def f(вид, черты=None):
        вид_л = {"поселение": "поселение", "подземелье": "подземелье", "тварь": "тварь", "вещь": "вещь", "ресурс": "ресурс",
                 "грань": "грань", "земля": "земля", "персонаж": "персонаж", "находка": "находка", "миф": "миф", "бог": "бог"}.get(вид, вид)
        вар = Л.писать(м, сл, вид_л, 4, None, изв[вид_л] | {n for n, _ in опись[вид_л]}, T=0.8)
        if not вар: return None
        if су: вар.sort(key=lambda x: -СД.оценка(су, ссл, вид_л, x[0], x[1]))
        имя, о = вар[0]; опись[вид_л].append((имя, о)); return имя
    return f, опись

def прогон(папка, лет=100, зерно=7, вывод=None):
    torch.set_num_threads(2); R = random.Random(зерно)
    T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8"))
    f, опись = имена(папка, R)
    c = torch.load(os.path.join(папка, "serdce.pt")); сеть = S.Сердце(c["вход"]); сеть.load_state_dict(c["сеть"]); сеть.eval()
    мастер = None
    try:
        import master as МС; мастер = МС.загрузить(папка)
    except Exception: pass
    мир = M.Мир(T, зерно, имена=f); игрок = S.новый_игрок(R)
    свойства = {}
    with torch.no_grad():
        for _ in range(лет):
            возм = мир.возможные(); маска = torch.full((S.E,), float("-inf"))
            for e in возм: маска[M.СОБЫТИЯ.index(e)] = 0
            x = torch.tensor(мир.признаки() + игрок + [S.напряжение(мир)], dtype=torch.float32)
            h, логиты, _ = сеть(x.unsqueeze(0)); p = torch.softmax(логиты[0] + маска, -1); ei = int(torch.multinomial(p, 1)); e = M.СОБЫТИЯ[ei]
            цели = возм[e] if len(возм[e]) <= 24 else R.sample(возм[e], 24)
            чц = torch.tensor([S.черты_цели(ц) for ц in цели], dtype=torch.float32)
            ц = цели[int(torch.multinomial(torch.softmax(сеть.оценка_целей(h, ei, чц), -1), 1))]
            мир.шаг(e, ц)
            след = мир.летопись[-1]["след"]
            for вид, табл in ВИД_МАСТЕРА.items():
                ключ = {"тварь": "тварь", "растение": "ресурс", "земля": "земля", "бог": "бог"}[вид]
                if мастер and ключ in след and табл in мастер.спец: свойства[след[ключ]] = мастер.породить(табл, 1, R=R)[0]
    строки = [f"# Летопись мира за {лет} лет (зерно {зерно})", "",
              "Сердце мира выбирало события, Летописец давал имена новому, Судья отбирал лучшее, Мастер свойств — числа.", ""]
    for z in мир.летопись:
        доп = ""
        for v in z["след"].values():
            if v in свойства: доп = " — " + ", ".join(f"{k}: {vv}" for k, vv in свойства[v].items())
        строки.append(f"- **Год {z['год']}.** {z['текст']}{доп}")
    if опись:
        строки += ["", "## Новое, что породил мир", ""]
        for вид, сп in опись.items():
            строки.append(f"- **{вид}**: " + "; ".join(f"{n}" + (f" ({о[:80]})" if о else "") for n, о in сп))
    текст = "\n".join(строки) + "\n"
    if вывод: open(вывод, "w", encoding="utf-8").write(текст)
    print(текст)

if __name__ == "__main__":
    прогон(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 100, int(sys.argv[3]) if len(sys.argv) > 3 else 7, sys.argv[4] if len(sys.argv) > 4 else None)
