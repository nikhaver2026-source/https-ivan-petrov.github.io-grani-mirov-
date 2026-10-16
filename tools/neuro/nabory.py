"""nabory.py — наборы вариантов имени, как их видит «Живой мир» (после отсева копий и формы), с признаками отбора (в игру не входит).
  python3 nabory.py <папка данных> <наборов на вид> <выход .jsonl> <выход .tsv для Учителя>"""
import sys, os, json, random, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import torch, letopisec as Л, sudya as СД, slovnik as СН, vid as ВД, zhivoy as Z

папка, n, вых, тсв = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
torch.set_num_threads(3); torch.manual_seed(13); R = random.Random(13)
м, сл = Л.загрузить(папка); мета = СД.мета_загрузить(папка); вд = ВД.загрузить(папка)
корпус = [json.loads(l) for l in open(os.path.join(папка, "corpus.jsonl"), encoding="utf-8")]
изв = collections.defaultdict(set)
for z in корпус: изв[z["вид"]].add(z["имя"])
все = {z["имя"].lower() for z in корпус}
T = json.load(open(os.path.join(папка, "world_tables.json"), encoding="utf-8")); thr = T.get("THR_NAMES", {})
Z.ИМЕНА_ЛЮДЕЙ.update(x.lower() for x in thr.get("муж", []) + thr.get("жен", []) + T.get("СВОД_ИМЕНА", []) if isinstance(x, str))
ВИДЫ = ["бог", "тварь", "вещь", "ресурс", "подземелье", "земля", "поселение", "персонаж", "находка", "миф", "грань"]
с_тсв = open(тсв, "w", encoding="utf-8")
with open(вых, "w", encoding="utf-8") as f:
    for в in ВИДЫ:
        for k in range(n):
            вар = [x for x in Л.писать(м, сл, в, 10, None, изв[в], T=0.8) if x[0].lower() not in все and Z.годится(в, x[0])]
            if len(вар) < 2: continue
            набор = [{"имя": и, "о": о, "мета": мета(в, и, о), "вид_p": вд(в, и)} for и, о in вар]
            f.write(json.dumps({"вид": в, "набор": набор}, ensure_ascii=False) + "\n"); f.flush()
            for x in набор: с_тсв.write(f"{в}\t{x['имя']}\t{x['о']}\n")
            с_тсв.flush()
        print(в, flush=True)
