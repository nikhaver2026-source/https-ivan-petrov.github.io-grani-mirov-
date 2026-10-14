"""textcorpus.py — весь русский текст игры для предобучения Летописца (index.html → text.txt).

Строки в кавычках с русскими буквами длиннее 24 знаков: справка, книги, описания, реплики, хроника. Подстановки
${…} заменяются многоточием, повторы убираются. Языку и слогу мира Летописец учится здесь, а на сущностях
(corpus.jsonl) — доучивается писать имя и суть по виду.

  python3 textcorpus.py <index.html> <папка данных>
"""
import sys, os, re

def main(путь, папка):
    s = open(путь, encoding="utf-8").read()
    # строки в двойных, одинарных и обратных кавычках (без переносов внутри, кроме обратных)
    шаб = re.compile(r'"((?:[^"\\\n]|\\.){25,}?)"|\'((?:[^\'\\\n]|\\.){25,}?)\'|`((?:[^`\\]|\\.){25,}?)`', re.S)
    видели, вывод = set(), []
    for m in шаб.finditer(s):
        t = next(g for g in m.groups() if g is not None)
        if len(re.findall("[А-Яа-яЁё]", t)) < 15: continue
        t = re.sub(r"\$\{[^{}]*\}", "…", t)
        t = t.replace("\\n", " ").replace('\\"', '"').replace("\\'", "'")
        t = re.sub(r"<[^>]{1,80}>", " ", t)
        t = re.sub(r"\s+", " ", t).strip()
        if len(t) < 25 or t in видели: continue
        # строки-программы (код в кавычках) — мимо
        if re.search(r"[{};=]\s*\w+\(|function|=>|\bconst\b", t): continue
        видели.add(t); вывод.append(t)
    os.makedirs(папка, exist_ok=True)
    with open(os.path.join(папка, "text.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(вывод) + "\n")
    print("строк", len(вывод), "знаков", sum(len(t) for t in вывод))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
