#!/usr/bin/env python3
"""punct.py — исходные тексты записей со знаками препинания: ключ фразы → текст.
Источники: описи голосового пакета (поле t), CREDITS.md голосов (| файл | текст |), старый список фраз
tools/voice/gvoice_phrases.json, пакеты записи (gvrec/d*/raw/*/pack*.json), собранная речь (gvrec/collect.txt,
куски — как их ищет игра). Итог: /root/S/us2/punct.json."""
import json, re, glob, os
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"


def ключ(t): return re.sub(r"[^а-яa-z0-9]+", " ", str(t).lower().replace("ё", "е")).strip()


m = {}
def add(t):
    t = str(t).strip(); k = ключ(t)
    if k and k not in m and re.search(r"[а-яА-Я]", t): m[k] = t
for v in "mf":
    t = open(f"{R}/sounds/gvoice_pack/{v}/bank.js", encoding="utf-8").read(); b = json.loads(t[t.index("{"):t.rindex("}") + 1])
    for x in b.get("t", {}).values(): add(x)
for f in [f"{R}/sounds/gvoice/CREDITS.md", f"{R}/sounds/gvoice_f/CREDITS.md"]:
    for l in open(f, encoding="utf-8"):
        mm = re.match(r"\|\s*g[vf]\d+\.flac\s*\|\s*(.+?)\s*\|\s*$", l)
        if mm: add(mm.group(1))
for x in json.load(open(f"{R}/tools/voice/gvoice_phrases.json", encoding="utf-8")): add(x["t"])
for j in glob.glob("/root/S/gvrec/**/pack*.json", recursive=True):
    for x in json.load(open(j, encoding="utf-8")): add(x["t"])
# собранная речь: целые тексты, предложения и части по «:» «;» и тире
if os.path.exists("/root/S/gvrec/collect.txt"):
    for l in open("/root/S/gvrec/collect.txt", encoding="utf-8"):
        try: тексты = json.loads(l)
        except Exception: continue
        for т in тексты:
            add(т)
            for s in re.findall(r"[^.!?…]+[.!?…]*", т):
                s = s.strip(); add(s)
                for c in re.split(r"(?<=[:;])\s+", s):
                    add(c)
                    for d in re.split(r"(?<=—)\s+", c): add(d)
json.dump(m, open("/root/S/us2/punct.json", "w", encoding="utf-8"), ensure_ascii=False)
print("текстов со знаками:", len(m))
for v in "mf":
    п = [json.loads(l)["k"] for l in open(f"/root/S/us2/db_{v}.jsonl", encoding="utf-8")] if os.path.exists(f"/root/S/us2/db_{v}.jsonl") else []
    if п: print(v, "записей базы с известным текстом:", sum(1 for k in п if k in m), "из", len(п))
