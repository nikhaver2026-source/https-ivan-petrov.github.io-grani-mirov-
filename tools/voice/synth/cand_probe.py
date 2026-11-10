import sys, os, json, math
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
S = E.Синтезатор("m"); V = S.V
КР = json.load(open("/root/S/us2/edgef0_m.json", encoding="utf-8")); пт = lambda v: 12 * math.log2(v / V.f0_мед) if v > 0 else None
for w in sys.argv[1:]:
    os_ = V.по_слову.get(w, []); print(w, "вхождений", len(os_))
    for o in os_[:40]:
        ri, j = V.occ[o]; e = КР.get(f"{V.recs[ri]['f']}#{j}") or [0, 0, 0]
        print("   %s «%s» высота нач/кон/сер %s  хрип %.2f чистота %.2f" % (V.recs[ri]["f"], V.recs[ri]["k"][:50], " ".join(("%+.1f" % пт(v)) if v > 0 else "—" for v in e[:3]), S._скрип(o), float(V.чистота[o])))
