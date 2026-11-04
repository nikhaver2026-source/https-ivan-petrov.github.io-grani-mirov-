#!/usr/bin/env python3
"""gvapply.py — встроить нарезанные записи cut/m и cut/f РОВНО ОДИН РАЗ.
Новые файлы — следующими номерами (gvNNNN мужской, gfNNNN женский) в sounds/gvoice и sounds/gvoice_f; опись
переходит на следующий номер (bank_39 → bank_40, bank_f39 → bank_f40) через git mv; счёт в CREDITS; ссылка в
основе конвейера (hron/index_before_mater.html). Метка cut/встроено.json не даёт встроить второй раз."""
import os, re, json, glob, shutil, subprocess, sys
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-"
ТУТ = "/root/S/gvrec"
ОСНОВА = "/root/S/hron/index_before_mater.html"
метка = f"{ТУТ}/cut/встроено.json"
if os.path.exists(метка): sys.exit("уже встроено: " + open(метка, encoding="utf-8").read()[:200])


def ключ(t): return re.sub(r"[^а-яa-z0-9]+", " ", t.lower().replace("ё", "е")).strip()


итог = {}
основа = open(ОСНОВА, encoding="utf-8").read()
for голос, папка, преф, имя in [("m", "gvoice", "gv", "bank_"), ("f", "gvoice_f", "gf", "bank_f")]:
    D = f"{R}/sounds/{папка}"
    описи = sorted(glob.glob(f"{D}/{имя}[0-9]*.js"), key=lambda f: int(re.search(r"(\d+)\.js$", f).group(1)))
    старая = описи[-1]; н = int(re.search(r"(\d+)\.js$", старая).group(1)); новая = f"{D}/{имя}{н + 1}.js"
    t = open(старая, encoding="utf-8").read(); голова = t[:t.index("{")]; хвост = t[t.rindex("}") + 1:]
    b = json.loads(t[t.index("{"):t.rindex("}") + 1])
    номера = [int(m.group(1)) for f in os.listdir(D) for m in [re.match(преф + r"(\d+)\.flac$", f)] if m]
    следующий = max(номера) + 1
    вырезано = json.load(open(f"{ТУТ}/cut/{голос}/итог.json", encoding="utf-8"))["годные"]
    добавлено = 0
    for фраза, о in вырезано.items():
        k = ключ(фраза)
        if not k or k in b["p"]: continue
        имя_ф = f"{преф}{следующий:04d}"; следующий += 1
        shutil.copyfile(f"{ТУТ}/cut/{голос}/{о['файл']}", f"{D}/{имя_ф}.flac")
        b["p"][k] = имя_ф; добавлено += 1
    subprocess.run(["git", "-C", R, "mv", старая, новая], check=True)
    open(новая, "w", encoding="utf-8").write(голова + json.dumps(b, ensure_ascii=False, separators=(",", ":")) + хвост)
    кр = f"{D}/CREDITS.md"; c = open(кр, encoding="utf-8").read()
    c = re.sub(r"Записей: \d+", f"Записей: {len(b['p'])}", c, count=1)
    c = c.replace(os.path.basename(старая), os.path.basename(новая))
    open(кр, "w", encoding="utf-8").write(c)
    было = основа.count(f"sounds/{папка}/{os.path.basename(старая)}")
    assert было == 1, (папка, было)
    основа = основа.replace(f"sounds/{папка}/{os.path.basename(старая)}", f"sounds/{папка}/{os.path.basename(новая)}")
    итог[голос] = {"опись": os.path.basename(новая), "добавлено": добавлено, "всего": len(b["p"])}
open(ОСНОВА, "w", encoding="utf-8").write(основа)
json.dump(итог, open(метка, "w", encoding="utf-8"), ensure_ascii=False)
print(json.dumps(итог, ensure_ascii=False))
