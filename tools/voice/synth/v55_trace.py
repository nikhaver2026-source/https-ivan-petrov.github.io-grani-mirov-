import sys, os, json, math
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
S = E.Синтезатор("m"); V = S.V
КР = json.load(open("/root/S/us2/edgef0_m.json", encoding="utf-8")); пт = lambda v: ("%+.1f" % (12 * math.log2(v / V.f0_мед))) if v > 0 else "  — "
ф = sys.argv[1] if len(sys.argv) > 1 else "Ночью у стен ходит стража, и фонари горят до самого рассвета."
for о in E.текст_в_отрезки(ф):
    res = S.витерби(о["w"], о["end"])
    for u in res:
        if u[0] == "o":
            ri, j = V.occ[u[1]]; e = КР.get(f"{V.recs[ri]['f']}#{j}") or [0, 0, 0]
            print("  %-10s %-22s «%s» нач/кон/сер %s  хрип %.2f" % (V.w(u[1])[0], V.recs[ri]["f"], V.recs[ri]["k"][:44], " ".join(пт(v) for v in e[:3]), S._скрип(u[1])))
        else: print("  из частей:", [(V.recs[ч[0]]["f"], round(ч[1], 2), round(ч[2], 2)) for ч in u[1]])
