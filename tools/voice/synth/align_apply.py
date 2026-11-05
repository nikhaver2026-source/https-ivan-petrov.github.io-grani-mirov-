#!/usr/bin/env python3.13
"""align_apply.py ГОЛОС — перенос разметки звуков (align_<голос>.jsonl, свой разметчик hmm_align.py) в базу склейки.
Слово: начало — начало его первого звука, конец — конец последнего (точно по звукам, без хвостов соседей);
пауза до/после — тишина между словами по разметке; «ph» — звуки слова [звук, номер буквы, начало, конец].
Время букв (w[5]) — начало звука этой буквы (для сборки слов из частей по буквам).
Пишет db_<голос>.jsonl, db_<голос>_pack.jsonl, db_<голос>_corpus.jsonl (прежние — с суффиксом .v3)."""
import sys, os, json, shutil
ТУТ = "/root/S/us2"
голос = sys.argv[1]
разм = {}
for l in open(f"{ТУТ}/align_{голос}.jsonl", encoding="utf-8"):
    x = json.loads(l); разм[x["i"]] = x
ri = 0; всего = есть = 0
for доп in ("", "_pack", "_corpus"):
    p = f"{ТУТ}/db_{голос}{доп}.jsonl"
    if not os.path.exists(p): continue
    recs = [json.loads(l) for l in open(p, encoding="utf-8")]
    if not os.path.exists(p + ".v3"): shutil.copy(p, p + ".v3")
    with open(p, "w", encoding="utf-8") as fo:
        for r in recs:
            a = разм.get(ri); ri += 1; всего += 1
            if a and len(a["w"]) == len(r["w"]) and all(len(w[3]) for w in a["w"]):
                есть += 1
                ws = []
                for j, (w_old, w_new) in enumerate(zip(r["w"], a["w"])):
                    s, e = w_new[1], w_new[2]
                    до = 0.0 if j == 0 else round(max(0.0, s - a["w"][j - 1][2]), 3)
                    после = 0.0 if j == len(r["w"]) - 1 else round(max(0.0, a["w"][j + 1][1] - e), 3)
                    ph = w_new[3]
                    буквы = []
                    for k in range(len(w_old[0])):   # начало звука буквы k (буквы без звука — по следующему звуку)
                        t = next((z[2] for z in ph if z[1] >= k), ph[-1][3])
                        буквы.append(round(t, 3))
                    ws.append([w_old[0], round(s, 3), round(e, 3), до, после, буквы])
                r["w"] = ws; r["ph"] = [w_new[3] for w_new in a["w"]]; r["ll"] = a["ll"]
            fo.write(json.dumps(r, ensure_ascii=False) + "\n")
print(f"записей {всего}, по новой разметке {есть}")
